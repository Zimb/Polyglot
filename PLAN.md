# Polyglot — Plan & Architecture
> Application web d'apprentissage des langues par IA  
> Stack : **React + Vite · TailwindCSS · Supabase · OpenRouter · Vercel**

---

## Concept

L'utilisateur choisit sa **langue native** et la **langue à apprendre**. L'IA (via OpenRouter) joue le rôle de tuteur : elle génère des leçons, des flashcards, des exercices de grammaire, et des conversations adaptées au niveau de l'apprenant.

---

## Stack technique

| Couche | Outil | Rôle |
|--------|-------|------|
| Frontend | React 18 + Vite | UI, composants, routing |
| Style | TailwindCSS | Design system dark-mode |
| État global | Zustand | Langue, niveau, XP session |
| Auth + DB | Supabase | Authentification, PostgreSQL, RLS |
| IA | OpenRouter API | GPT-4o-mini, Claude, Mistral… |
| Déploiement | Vercel | Serverless functions + hosting |

---

## Schéma base de données (Supabase)

```sql
-- Profil utilisateur
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  native_lang  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Langues apprises par l'utilisateur
CREATE TABLE user_languages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_lang   TEXT NOT NULL,
  level         TEXT DEFAULT 'beginner',
  xp            INT DEFAULT 0,
  streak        INT DEFAULT 0,
  last_activity DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_lang)
);

-- Sessions de leçons
CREATE TABLE lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_lang TEXT NOT NULL,
  mode        TEXT NOT NULL,   -- flashcard | daily | grammar | chat | translation | quiz
  score       INT,
  xp_earned   INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Mots appris
CREATE TABLE learned_words (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_lang TEXT NOT NULL,
  word        TEXT NOT NULL,
  translation TEXT NOT NULL,
  mastery     INT DEFAULT 0,   -- 0 (nouveau) → 5 (maîtrisé)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_lang, word)
);
```

> ⚠️ Activer **Row-Level Security** sur toutes les tables.

---

## Architecture des fichiers

```
polyglot/
├── api/                          ← Serverless functions Vercel
│   ├── flashcard.js              ✅ Génère 8 flashcards via OpenRouter
│   ├── lesson.js                 ⬜ Leçon du jour
│   ├── grammar.js                ⬜ Explication grammaticale
│   ├── chat.js                   ⬜ Conversation libre
│   ├── translate.js              ⬜ Défi traduction
│   └── quiz.js                   ⬜ Quiz 10 questions
├── src/
│   ├── lib/
│   │   ├── supabase.js           ✅ Client Supabase
│   │   └── languages.js          ✅ 15 langues + 18 thèmes
│   ├── store/
│   │   └── useAppStore.js        ✅ Zustand (langue, niveau, XP)
│   ├── components/
│   │   ├── ui/                   ⬜ Button, Card, Badge, Modal, Input
│   │   ├── layout/               ⬜ Navbar, Sidebar, PageWrapper
│   │   ├── auth/                 ⬜ LoginForm, ProtectedRoute
│   │   └── progress/             ⬜ StreakBadge, XPBar, StatsCard
│   ├── pages/
│   │   ├── Vocabulary.jsx        ✅ Flashcards (mode jeu complet)
│   │   ├── Dashboard.jsx         ⬜
│   │   ├── Lesson.jsx            ⬜
│   │   ├── Grammar.jsx           ⬜
│   │   ├── Conversation.jsx      ⬜
│   │   ├── Translation.jsx       ⬜
│   │   ├── Quiz.jsx              ⬜
│   │   ├── Login.jsx             ⬜
│   │   ├── Signup.jsx            ⬜
│   │   ├── Onboarding.jsx        ⬜
│   │   └── Landing.jsx           ⬜
│   ├── App.jsx                   ✅ Routing de base
│   └── main.jsx                  ✅
├── dev-server.js                 ✅ Express local (remplace vercel dev)
├── .env.local                    ✅ Clés (ne jamais commiter)
├── vercel.json                   ✅
├── vite.config.js                ✅ Proxy /api + CSP headers
└── package.json                  ✅
```

---

## Variables d'environnement

| Variable | `.env.local` | Vercel Dashboard | Accessible |
|----------|:---:|:---:|---------|
| `VITE_SUPABASE_URL` | ✅ | ✅ | Client + Serveur |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ✅ | Client + Serveur |
| `OPENROUTER_API_KEY` | ✅ | ✅ | **Serveur uniquement** (jamais `VITE_`) |

---

## Lancer en local

```bash
npm run dev
# [API]  Express   → http://localhost:3001/api
# [VITE] React     → http://localhost:5173
```

---

## Sécurité

- `OPENROUTER_API_KEY` uniquement dans les serverless functions (jamais exposé au client)
- Inputs sanitisés avant injection dans les prompts IA (anti prompt-injection)
- RLS Supabase — chaque utilisateur ne lit/écrit que ses propres données
- HTTPS partout (Vercel par défaut)
