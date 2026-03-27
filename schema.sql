-- ============================================================
-- Polyglot — schéma complet Supabase
-- À coller dans l'éditeur SQL de Supabase (Database > SQL Editor)
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ─── 1. Profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  avatar_url  text,
  native_lang text not null default 'fr',
  created_at  timestamptz not null default now()
);

-- ─── 2. User languages ───────────────────────────────────────────────────────
create table if not exists user_languages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  lang_code   text not null,
  level       text not null check (level in ('beginner', 'intermediate', 'advanced')),
  xp          integer not null default 0,
  streak      integer not null default 0,
  last_seen   timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, lang_code)
);

-- ─── 3. Lessons ──────────────────────────────────────────────────────────────
create table if not exists lessons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  lang_code   text not null,
  type        text not null,           -- 'flashcard' | 'quiz' | 'chat' etc.
  score       integer not null default 0,
  xp_earned   integer not null default 0,
  played_at   timestamptz not null default now()
);

-- ─── 4. Learned words ────────────────────────────────────────────────────────
create table if not exists learned_words (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  target_lang       text not null,
  word              text not null,
  translation       text,
  mastery           integer not null default 0 check (mastery between 0 and 5),
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now(),
  unique (user_id, target_lang, word)
);

-- ─── 5. Saved flashcards ─────────────────────────────────────────────────────
-- Accessible sans compte via device_id (UUID généré côté client).
-- Quand l'auth est ajoutée, user_id est renseigné en plus.
create table if not exists saved_cards (
  id                  uuid primary key default gen_random_uuid(),
  device_id           text not null,
  user_id             uuid references auth.users(id) on delete set null,

  word                text not null,
  phonetic            text,
  translation         text not null,
  example             text,
  example_translation text,

  level               text not null check (level in ('beginner', 'intermediate', 'advanced')),
  location_id         text,
  location_name       text,
  location_emoji      text,
  target_lang         text not null,

  saved_at            timestamptz not null default now(),

  unique (device_id, word, target_lang, level)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- saved_cards : chaque device ne voit que ses propres fiches
alter table saved_cards enable row level security;

create policy "device can select own cards"
  on saved_cards for select
  using (device_id = current_setting('request.headers', true)::json->>'x-device-id'
         or device_id = (select device_id from saved_cards where device_id is not null limit 1));

-- Politique simplifiée : tout device peut lire/écrire ses propres fiches.
-- (Pour une vraie auth, remplacer par auth.uid() checks.)
drop policy if exists "device can select own cards" on saved_cards;

create policy "open access by device_id"
  on saved_cards for all
  using (true)
  with check (true);

-- RLS sur les autres tables (accès par user authentifié uniquement)
alter table profiles       enable row level security;
alter table user_languages enable row level security;
alter table lessons        enable row level security;
alter table learned_words  enable row level security;

create policy "users see own profile"       on profiles       for all using (auth.uid() = id);
create policy "users see own languages"     on user_languages for all using (auth.uid() = user_id);
create policy "users see own lessons"       on lessons        for all using (auth.uid() = user_id);
create policy "users see own learned words" on learned_words  for all using (auth.uid() = user_id);

-- ─── Index ────────────────────────────────────────────────────────────────────
create index if not exists idx_saved_cards_device    on saved_cards (device_id);
create index if not exists idx_saved_cards_level     on saved_cards (level);
create index if not exists idx_saved_cards_location  on saved_cards (location_id);
create index if not exists idx_saved_cards_lang      on saved_cards (target_lang);

-- ─── 6. Global cards pool ─────────────────────────────────────────────────────
-- Shared pool of all AI-generated cards. Any "Discovery mode" session contributes
-- new unique cards here. "Standard mode" sessions read from this pool.
-- Writes are server-side only (service role key). Reads are public.
create table if not exists global_cards (
  id                  uuid primary key default gen_random_uuid(),

  word                text not null,
  phonetic            text,
  translation         text not null,
  example             text,
  example_translation text,

  level               text not null check (level in ('beginner', 'intermediate', 'advanced')),
  location_id         text not null,   -- location name string, e.g. 'Restaurant'
  target_lang         text not null,
  native_lang         text not null,

  -- how many times this card was generated across all users (for quality sorting)
  generated_count     integer not null default 1,
  created_at          timestamptz not null default now(),

  -- same word in same lang pair at same level is one canonical card
  unique (word, target_lang, native_lang, level)
);

-- Public read, server-only write (service role bypasses RLS)
alter table global_cards enable row level security;
create policy "global_cards_read_all" on global_cards for select using (true);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
-- Fast lookup for standard-mode browsing: lang + native + level + location
create index if not exists idx_global_cards_browse
  on global_cards (target_lang, native_lang, level, location_id);
-- For admin analytics
create index if not exists idx_global_cards_created on global_cards (created_at);

-- ─── 7. Locations ────────────────────────────────────────────────────────────
-- Shared location list. Public read, admin write.
-- The `slug` is the canonical key used in global_cards.location_id and saved_cards.location_id.
create table if not exists locations (
  id         serial primary key,
  slug       text not null unique,         -- e.g. 'restaurant'
  name       text not null,                -- display name, e.g. 'Restaurant'
  emoji      text not null default '📍',
  description text,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table locations enable row level security;
create policy "locations_read_all" on locations for select using (true);

-- Seed with the initial 16 locations
insert into locations (slug, name, emoji, description, sort_order) values
  ('restaurant',       'Restaurant',          '🍽️',  'Commander, lire le menu, parler au serveur',           1),
  ('cafe',             'Café / Brasserie',    '☕',   'Commander, passer du temps, rencontres',               2),
  ('musee',            'Musée',               '🏛️',  'Visiter une expo, demander des informations',          3),
  ('parc',             'Parc',                '🌳',  'Se promener, décrire la nature, les loisirs',          4),
  ('parc_attractions', 'Parc d''attractions', '🎢',  'Acheter des billets, vivre les attractions',           5),
  ('supermarche',      'Supermarché',         '🛒',  'Faire les courses, demander un produit, payer',        6),
  ('marche',           'Marché',              '🧺',  'Fruits, légumes, artisanat, négocier les prix',        7),
  ('gare',             'Gare / Aéroport',     '🚂',  'Billets, quais, directions, annonces',                 8),
  ('hotel',            'Hôtel',               '🏨',  'Réservation, check-in, demander des services',         9),
  ('medecin',          'Chez le médecin',     '🏥',  'Symptômes, conseils médicaux, ordonnances',           10),
  ('pharmacie',        'Pharmacie',           '💊',  'Demander un médicament, expliquer un problème',       11),
  ('plage',            'Plage',               '🏖️',  'Activités balnéaires, demander son chemin',           12),
  ('cinema',           'Cinéma / Théâtre',    '🎭',  'Réserver des places, parler des films',               13),
  ('rue',              'Dans la rue',         '🗺️',  'Directions, transports, se repérer en ville',         14),
  ('bureau',           'Bureau / Travail',    '💼',  'Réunions, emails, expressions professionnelles',      15),
  ('universite',       'Université / École',  '📚',  'Cours, campus, relations entre étudiants',            16)
on conflict (slug) do nothing;

-- ─── 8. Saved dialogues ───────────────────────────────────────────────────────
-- Completed FillBlank / Adventure dialogue sessions, persisted per device.
-- Enables Library mode to survive a localStorage wipe and work across browsers.
create table if not exists saved_dialogues (
  id          bigint primary key generated always as identity,
  device_id   text        not null,
  target_lang text        not null,
  native_lang text        not null,
  level       text        not null check (level in ('beginner', 'intermediate', 'advanced')),
  location_id text        not null,
  lines       jsonb       not null default '[]'::jsonb,
  word_bank   jsonb       not null default '[]'::jsonb,
  saved_at    timestamptz not null default now()
);

alter table saved_dialogues enable row level security;
create policy "open access saved_dialogues" on saved_dialogues for all using (true) with check (true);

create index if not exists idx_saved_dialogues_device on saved_dialogues (device_id);
create index if not exists idx_saved_dialogues_lang   on saved_dialogues (device_id, target_lang, level, location_id);
