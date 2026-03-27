# Polyglot — Roadmap

## Légende
- ✅ Terminé
- 🔄 En cours
- ⬜ À faire

---

## Phase 1 — Foundation ✅

| Tâche | État |
|-------|------|
| Scaffold Vite + React + Tailwind | ✅ |
| Configuration Supabase client | ✅ |
| Schéma SQL créé dans Supabase | ✅ |
| Store Zustand (langue, niveau, XP) | ✅ |
| Librairie langues (15 langues + 18 thèmes) | ✅ |
| Serveur Express local (`dev-server.js`) | ✅ |
| Proxy Vite `/api → localhost:3001` | ✅ |
| Déploiement Vercel initial | ✅ |
| Variables d'env dans Vercel Dashboard | ✅ |

---

## Phase 2 — Mode Flashcards ✅

| Tâche | État |
|-------|------|
| `api/flashcard.js` — génération IA 8 cartes | ✅ |
| Sanitisation inputs / gestion d'erreur | ✅ |
| Page Setup (langue, niveau, thème) | ✅ |
| Carte 3D flip (recto mot, verso traduction + exemple) | ✅ |
| Boutons "Knew it ✓" / "Didn't know ✗" | ✅ |
| Barre de progression | ✅ |
| Écran score final (knew / missed / %) | ✅ |
| Sauvegarde mots connus → Supabase `learned_words` | ✅ |

---

## Phase 3 — Authentification & Onboarding ⬜

| Tâche | État |
|-------|------|
| Page Login (email/password) | ⬜ |
| Page Signup | ⬜ |
| OAuth Google (Supabase) | ⬜ |
| Composant `ProtectedRoute` | ⬜ |
| Page Onboarding — choix langue native | ⬜ |
| Page Onboarding — choix langue cible | ⬜ |
| Page Onboarding — choix niveau | ⬜ |
| Quiz de placement IA (5 questions) | ⬜ |
| Création automatique profil dans `profiles` | ⬜ |

---

## Phase 4 — Dashboard ⬜

| Tâche | État |
|-------|------|
| Page Dashboard (accueil après login) | ⬜ |
| Affichage streak du jour | ⬜ |
| Affichage XP total | ⬜ |
| Cartes raccourcis vers chaque mode de jeu | ⬜ |
| Compteur mots appris | ⬜ |
| Navbar persistante (streak + XP toujours visibles) | ⬜ |

---

## Phase 5 — Modes de jeu supplémentaires ⬜

### 5.1 Leçon du jour
| Tâche | État |
|-------|------|
| `api/lesson.js` — leçon thématique IA | ⬜ |
| Page `Lesson.jsx` | ⬜ |
| 5 vocabulaires + 2 phrases + conseil grammaire | ⬜ |

### 5.2 Coach grammatical
| Tâche | État |
|-------|------|
| `api/grammar.js` — explication bilingue IA | ⬜ |
| Page `Grammar.jsx` | ⬜ |

### 5.3 Conversation libre
| Tâche | État |
|-------|------|
| `api/chat.js` — chat IA natif de la langue cible | ⬜ |
| Page `Conversation.jsx` avec bulles chat | ⬜ |
| Historique de la conversation | ⬜ |

### 5.4 Défi traduction
| Tâche | État |
|-------|------|
| `api/translate.js` — phrase IA + correction | ⬜ |
| Page `Translation.jsx` | ⬜ |

### 5.5 Quiz
| Tâche | État |
|-------|------|
| `api/quiz.js` — 10 QCM générés par IA | ⬜ |
| Page `Quiz.jsx` | ⬜ |
| Score final + XP gagné | ⬜ |

---

## Phase 6 — Gamification ⬜

| Tâche | État |
|-------|------|
| Système XP — points par mode, par score | ⬜ |
| Streaks — jours consécutifs de pratique | ⬜ |
| Mise à jour streak dans `user_languages` | ⬜ |
| Composant `XPBar` | ⬜ |
| Composant `StreakBadge` | ⬜ |
| Page Profil / Stats | ⬜ |

---

## Phase 7 — Polish & Production ⬜

| Tâche | État |
|-------|------|
| Landing page publique | ⬜ |
| Design responsive mobile-first | ⬜ |
| Skeleton screens / loading states | ⬜ |
| Toast notifications (erreurs, succès) | ⬜ |
| Page Settings (changer langue cible, modèle IA) | ⬜ |
| Activer RLS Supabase sur toutes les tables | ⬜ |
| Domaine custom sur Vercel | ⬜ |

---

## Langues supportées (15)

| Code | Langue | Drapeau |
|------|--------|---------|
| `en` | English | 🇬🇧 |
| `fr` | Français | 🇫🇷 |
| `es` | Español | 🇪🇸 |
| `de` | Deutsch | 🇩🇪 |
| `it` | Italiano | 🇮🇹 |
| `pt` | Português | 🇵🇹 |
| `ja` | 日本語 | 🇯🇵 |
| `zh` | 中文 | 🇨🇳 |
| `ar` | العربية | 🇸🇦 |
| `ru` | Русский | 🇷🇺 |
| `ko` | 한국어 | 🇰🇷 |
| `nl` | Nederlands | 🇳🇱 |
| `pl` | Polski | 🇵🇱 |
| `tr` | Türkçe | 🇹🇷 |
| `hi` | हिन्दी | 🇮🇳 |

---

*Mis à jour : 28 mars 2026*
