# Polyglot — Charte Graphique
> **Direction : "Editorial Warm Night"**  
> Chaud, typographique, humain. Pas de gradients bleu-violet, pas de glow IA.

---

## 1. Philosophie de design

| Principe | Application |
|----------|-------------|
| **Chaleur** | Fond brun-noir (pas bleu-noir tech). Les yeux se posent. |
| **Typographie comme héros** | Le mot à apprendre prend tout l'espace. Taille 72px+ sur la carte. |
| **Papier, pas écran** | Les flashcards ressemblent à de vraies fiches bristol. Fond crème recto. |
| **Une seule action** | Un écran = une décision. Pas de menus dans tous les sens. |
| **Pas de gradients IA** | Zéro dégradé bleu-violet-indigo. Couleurs franches et chaudes. |

---

## 2. Palette de couleurs

### Fond & surfaces — Warm Dark

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#0C0A08` | Fond de page — brun-noir chaud |
| `bg-surface` | `#161210` | Cards, panels |
| `bg-elevated` | `#1E1A15` | Inputs, dropdowns |
| `bg-hover` | `#262018` | États hover |
| `border` | `#2E2820` | Bordures standard |
| `border-hover` | `#3D3228` | Bordures au survol |

### Accent principal — Ambre Miel

Pas d'indigo. Pas de violet. De l'ambre — chaleureux, distinctif, mémorable.

| Token | Hex | Usage |
|-------|-----|-------|
| `amber-700` | `#92650A` | Fond accent profond |
| `amber-500` | `#C8920A` | Boutons primaires, actif |
| `amber-400` | `#E8A820` | Hover, highlights |
| `amber-200` | `#F5D080` | Texte accent sur fond sombre |
| `amber-100` | `#FDF0C0` | Texte léger sur ambre foncé |

### Sémantique

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#4A8F5F` | "Knew it", score ≥ 75% (vert forêt, pas neon) |
| `success-text` | `#90C8A0` | Texte success |
| `danger` | `#903030` | "Didn't know", erreurs (rouge sombre) |
| `danger-text` | `#E08080` | Texte danger |

### Texte — Warm White

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#F0E6D3` | Corps + titres — crème chaud (jamais blanc pur) |
| `text-secondary` | `#8A7A68` | Labels, sous-titres |
| `text-muted` | `#4A3F35` | Placeholders, désactivé |

### Couleur carte recto (fiche papier)

| Token | Hex | Usage |
|-------|-----|-------|
| `card-paper` | `#F5EDD8` | Fond recto flashcard — papier blanc cassé |
| `card-paper-text` | `#1A1410` | Texte sur fond papier |
| `card-paper-sub` | `#7A6A58` | Phonétique sur fond papier |

---

## 3. Typographie

**Titre / UI : [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)**  
Géométrique avec du caractère. Pas générique. Reconnaissable. Variable font.

**Body : [DM Sans](https://fonts.google.com/specimen/DM+Sans)**  
Chaud, légèrement organique. Moins froid qu'Inter.

**Exemples de langue : [DM Mono](https://fonts.google.com/specimen/DM+Mono)**  
Pour afficher les mots en langue cible avec précision et style.

```css
font-family: 'Space Grotesk', system-ui, sans-serif;  /* titres, UI */
font-family: 'DM Sans', system-ui, sans-serif;         /* body */
font-family: 'DM Mono', monospace;                     /* mots langue */
```

### Échelle typographique

| Rôle | Taille | Poids | Police | Usage |
|------|--------|-------|--------|-------|
| `word-hero` | 64–80px | 700 | DM Mono | Le mot sur la flashcard — héros absolu |
| `display` | 48px | 700 | Space Grotesk | Score final, titres landing |
| `h1` | 30px | 600 | Space Grotesk | Titre de page |
| `h2` | 22px | 600 | Space Grotesk | Section header |
| `h3` | 17px | 500 | Space Grotesk | Card title |
| `body-lg` | 16px | 400 | DM Sans | Contenu principal |
| `body` | 14px | 400 | DM Sans | Labels |
| `mono` | 14px | 400 | DM Mono | Exemples, phonétiques |
| `caption` | 12px | 400 | DM Sans | Métadonnées |
| `overline` | 11px | 500 | Space Grotesk | Labels majuscules |

### Règles typo
- Interligne corps : `1.6`
- Interligne titres : `1.15`
- Lettre-espacement overline : `+0.1em` uppercase
- **Jamais de blanc pur** — `#F0E6D3` (crème chaud)

---

## 4. Espacement

Basé sur une grille de **4px**.

| Token | Valeur | Usage |
|-------|--------|-------|
| `space-1` | 4px | Gap minimal |
| `space-2` | 8px | Gap interne composant |
| `space-3` | 12px | Padding compact |
| `space-4` | 16px | Padding standard |
| `space-6` | 24px | Section interne |
| `space-8` | 32px | Entre sections |
| `space-12` | 48px | Padding page |
| `space-16` | 64px | Espacement hero |

---

## 5. Coins arrondis (border-radius)

| Token | Valeur | Usage |
|-------|--------|-------|
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 10px | Inputs, petites cards |
| `radius-lg` | 16px | Cards principales |
| `radius-xl` | 20px | Modales, flashcards |
| `radius-full` | 9999px | Boutons pill, avatars |

---

## 6. Ombres

```css
/* Card standard */
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);

/* Card accent (hover) */
box-shadow: 0 8px 32px rgba(79, 70, 229, 0.25);

/* Modal */
box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
```

---

## 7. Composants UI

### Bouton primaire
```
bg: #4338CA → hover #4F46E5
text: #F0F0F8  font-weight: 600
padding: 12px 24px  border-radius: 12px
transition: background 150ms ease
```

### Bouton secondaire
```
bg: transparent  border: 1px solid #252535
text: #9999BB → hover text: #F0F0F8, border: #4F46E5
padding: 12px 24px  border-radius: 12px
```

### Bouton success / danger (ex: flashcards)
```
success: bg rgba(16,185,129,0.15)  border rgba(16,185,129,0.35)  text #6EE7B7
danger:  bg rgba(239,68,68,0.15)   border rgba(239,68,68,0.35)   text #FCA5A5
hover: opacité +10%
```

### Input / Select
```
bg: #1E1E2A  border: 1px solid #252535
focus border: #4F46E5 (ring glow 0 0 0 3px rgba(79,70,229,0.2))
text: #F0F0F8  placeholder: #55557A
border-radius: 10px  padding: 10px 14px
```

### Card
```
bg: #16161F  border: 1px solid #1E1E2A
border-radius: 16px  padding: 24px
hover: border-color #252535
```

### Badge / Tag
```
bg: rgba(99,102,241,0.15)  border: 1px solid rgba(99,102,241,0.3)
text: #A5B4FC  font-size: 12px  font-weight: 600
padding: 4px 10px  border-radius: 6px
```

### Flashcard (spécifique)
```
Recto  — gradient #4338CA → #7C3AED  (indigo → violet)
Verso  — gradient #059669 → #0D9488  (emerald → teal)
border-radius: 20px
shadow: 0 20px 60px rgba(0,0,0,0.5)
flip animation: rotateY 550ms cubic-bezier(0.45, 0.05, 0.55, 0.95)
```

---

## 8. Iconographie

- Bibliothèque : **[Lucide Icons](https://lucide.dev)** (stroke, cohérent, léger)
- Taille standard : `20px` (navbar), `16px` (inline), `24px` (feature icons)
- Stroke width : `1.5px`
- Couleur : hérite du parent (`currentColor`)

---

## 9. Animations & transitions

| Interaction | Animation | Durée |
|-------------|-----------|-------|
| Hover bouton | background color | 150ms ease |
| Apparition card / page | slide up + fade in | 300ms ease-out |
| Flip flashcard | rotateY 3D | 550ms cubic-bezier |
| Transition de page | fade | 200ms ease |
| Loading spinner | rotate | 800ms linear infinite |
| Toast notification | slide in from top | 250ms ease-out |

**Règle générale : les animations durent < 400ms. Rien de "flashy".**

---

## 10. Layout & grille

- Max-width contenu : `1024px` (centré, `mx-auto`)
- Padding horizontal page : `24px` mobile → `48px` desktop
- Grille : 12 colonnes, gap `24px`
- Sidebar (desktop) : `240px` fixe
- Zone de contenu principal : flex colonne, `gap-8`

### Breakpoints
| Nom | Largeur |
|-----|---------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

---

## 11. Micro-identité visuelle

### Logo / Icône
- Symbole : **∞** (infini) stylisé, ou lettres entrelacées A→Z
- Couleur : gradient `#4F46E5 → #7C3AED`
- Pas de serif, pas d'ombres portées sur le logo

### Langage visuel des drapeaux
- Drapeaux emoji natifs — pas de bibliothèque externe
- Taille affichage : `24px` (sélecteurs), `32px` (onboarding), `16px` (inline)

### Progress & gamification
- Barre XP : gradient `#4F46E5 → #7C3AED`, fond `#1E1E2A`, height `6px`, radius pill
- Streak : icône 🔥, couleur `#F59E0B`, badge rounded-full
- Score % : couleur dynamique — rouge < 50%, orange 50–74%, vert ≥ 75%

---

## 12. Do / Don't

| ✅ Do | ❌ Don't |
|-------|---------|
| Fond sombre uniforme `#0D0D12` | Mélanger plusieurs niveaux de noir |
| Un seul appel à l'action par écran | Double bouton primaire |
| Espacement généreux (respirer) | Tasser les éléments |
| Animations subtiles et rapides | Animations > 500ms ou en boucle |
| Texte `#F0F0F8` (légèrement bleuté) | Blanc pur `#FFFFFF` sur fond sombre |
| Icônes Lucide stroke `1.5px` | Mélanger styles d'icônes |
| Border `1px solid` pour délimiter | Box shadows multiples ou lourdes |

---

*Charte rédigée le 28 mars 2026 — version 1.0*
