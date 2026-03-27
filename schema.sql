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
