# Polyglot — Mode Flashcards : état de l'art

## Route
`/flashcards` → `src/pages/Vocabulary.jsx`

---

## Fonctionnalités implémentées ✅

### Génération IA
- `api/flashcard.js` — appel OpenRouter `gpt-4o-mini`
- System prompt : locuteur natif de la langue cible (phrases naturelles, non traduites)
- 8 cartes par session (réduit si révision injectée)
- `contentGuide` adapté au niveau : débutant / intermédiaire / avancé
- `domainHints` : couverture sémantique exhaustive par lieu (16 lieux)
- `avoidClause` : évite les mots déjà vus (`seenWords`, max 60)
- Paramètre `newCount` : nombre variable selon les cartes de révision injectées

### Carte 3D
- Flip animé (CSS `perspective` + `rotateY`)
- Recto (paper `#F5EDD8`) : mot / expression / dialogue selon niveau, phonétique
- Verso (amber `#C8920A`) : traduction + exemple + traduction exemple
- Flèches ← → pour naviguer (← = passer, → = suivant)
- Label `révision` discret sur les cartes de rappel

### Système RPG — 16 lieux
Restaurant, Café/Brasserie, Musée, Parc, Parc d'attractions, Supermarché, Marché,
Gare/Aéroport, Hôtel, Chez le médecin, Pharmacie, Plage, Cinéma/Théâtre,
Dans la rue, Bureau/Travail, Université/École

### Sessions
- `seenWords` accumulé à travers les sessions "Continuer"
- **Continuer** → nouvelles cartes, évite les répétitions
- **Reprendre** → rejoue les mêmes cartes sans appel API

### Révision automatique
- 0–2 cartes anciennes (même langue + niveau) piochées aléatoirement
- Glissées à position aléatoire dans la session
- Session toujours 8 cartes au total

### Carte félicitations
- Apparaît après la 8e carte (phase `congrats`)
- Recto : "Félicitations !" en langue **cible**
- Verso : traduction en langue **native** + compteur de cartes
- Traductions disponibles dans 15 langues

### Setup screen
- Sélecteur langue native / langue cible / niveau
- Grille de 16 tuiles de lieu
- Badge compteur (fiches sauvegardées pour ce lieu × niveau × langue cible)
- S'actualise quand on change la langue cible

### Persistence Supabase
- Table `saved_cards` : upsert après chaque session via `syncCardsToSupabase`
- Déduplié par `device_id | word | target_lang | level`
- Page `/mes-fiches` : filtres niveau + lieu, groupements, expandable

---

## Ce qui reste à faire ⬜

- Persistance du thème de lieu choisi entre sessions (store)
- Barre de progression visuelle dans le header pendant la session
- Animations de transition entre cartes (swipe)
- Son / prononciation (TTS)

---

## Architecture future — Hub `/vocabulary`

`/vocabulary` deviendra un menu "méthodes d'apprentissage" contenant :

| Mode | Route | État |
|------|-------|------|
| Flashcards (actuel) | `/flashcards` | ✅ |
| Dictée | `/dictee` | ⬜ |
| Association image-mot | `/images` | ⬜ |
| Jeu de mémoire (paires) | `/memoire` | ⬜ |
| Compléter la phrase | `/lacunes` | ⬜ |
| Anagrammes | `/anagrammes` | ⬜ |
| Dialogue IA (NPC) | `/chat` | ⬜ |
| Quiz choix multiples | `/quiz` | ⬜ |

---

## Idées de méthodes créatives pour apprendre du vocabulaire

### 1. Dictée guidée (`/dictee`)
L'API génère une phrase en langue cible. L'utilisateur entend le mot (TTS) ou le voit flou, et doit l'écrire. Immédiatement comparé et corrigé. Excellent pour orthographe + écoute active.

### 2. Jeu de mémoire (`/memoire`)
Plateau de paires retournées : mot en langue cible d'un côté, traduction de l'autre. On retourne deux à deux. Toutes les cartes sont issues de `savedCards` → réutilise le vocabulaire acquis.

### 3. Compléter la phrase (`/lacunes`)
Une phrase avec un mot manqué, 4 choix proposés. L'API génère le contexte + les distracteurs. Simple à implémenter, très efficace pour la rétention en contexte.

### 4. Association image → mot (`/images`)
Affiche une image (Unsplash) et demande d'identifier le mot en langue cible parmi 4 choix. Mémorisaton par association visuelle, bien connu en psychologie cognitive.

### 5. Anagrammes (`/anagrammes`)
Les lettres du mot cible sont mélangées, il faut les remettre dans l'ordre. Ludique, fonctionne bien pour les langues à orthographe régulière (espagnol, italien, etc.).

### 6. Histoire collaborative (`/histoire`)
L'utilisateur écrit une phrase intégrant un mot cible. L'IA continue l'histoire et propose le prochain mot. Créatif, favorise la production active plus que la reconnaissance.

### 7. Dialogue avec un NPC (`/chat`)
NPC situé dans un lieu (ex. serveur au restaurant). L'utilisateur doit tenir la conversation. Contexte immersif fort, le plus proche d'une vraie situation.
