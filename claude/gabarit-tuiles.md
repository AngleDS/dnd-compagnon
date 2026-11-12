# Gabarit des tuiles d'« À la table »

État au 12 nov. 2026 (v167, commit `fd7af10`). **À lire avant toute retouche de tuile** (Claude ou ChatGPT).
Les valeurs viennent du code : `--th` (`theme.css`), `TL`, `TILE_W`, `TILE_META`, `cellW` (`js/08-table.js`).
Le tableau des tailles de `claude/catalogue-tuiles-2024.md` (sections 2.1 et 2.2) est **périmé** : ne pas s'en servir.

## 1. Ce qui est figé (ne pas changer sans l'accord d'Angle)

| Mesure | Valeur | Où |
|---|---|---|
| Hauteur d'une tuile | **76 px**, la même pour toutes | `--th` dans `theme.css` |
| Tuile sur deux rangées (grande case 2×2) | 164 px (76 + 12 + 76) | `.ccell[data-sz="2"]` |
| Écart entre deux tuiles d'un bloc | 12 px | `TL.G`, `.tblocks.tfree .rtiles…{gap:12px}` |
| Marge intérieure d'un bloc | 8 px (bordure 1 + 7) | `TL.M`, `.tblocks.tfree>.tblk` |
| Bande de titre d'un bloc | 24 px | `TL.BAND`, `.tband` |
| Écart entre deux colonnes de page | 4 px | `TL.FG` |
| Écart vertical entre blocs | 16 px (4 px avec « Tasser ») | `TL.VGAP`, `TL.GAP` |
| Largeurs minimales par gabarit | É 70 · M 104 · L 156 · P 330 px | `TILE_W` |
| Tailles de texte | uniquement `--fs-xs` 11, `--fs-sm` 13, `--fs-md` 16, `--fs-lg` 18, `--fs-xl` 22, `--fs-2xl` 28 | AGENTS.md |
| Cible tactile | 44 px au moins pour tout bouton seul | AGENTS.md |

Exception existante à ne pas copier : `.tblk.w1 .rtile .label` utilise `calc(var(--fs-xs) * .9)` pour les blocs d'une colonne.

## 2. Largeur réelle d'une tuile sur iPhone (390 px de large, 358 utiles)

| Bloc | 1 tuile par rangée | 2 | 3 | 4 |
|---|---|---|---|---|
| 4 colonnes de page | 342 | 165 | 106 | 76 |
| 3 colonnes | 251 | 119 | 75 | 53 |
| 2 colonnes | 161 | 74 | 45 | — |
| 1 colonne | 70 | — | — | — |

Une tuile n'est proposée que si la case fait au moins sa largeur minimale (`tileFits`). Le contenu doit tenir dans **76 px de haut** et dans la **plus petite** largeur où la tuile peut se retrouver (70 px pour une tuile É).

## 3. Les familles de tuiles et leur gabarit

| Famille | Classe CSS | Gabarit | Largeur mini | Contenu attendu |
|---|---|---|---|---|
| Repères (valeurs : CA, Initiative, Vitesse, Perception passive, DD des sorts…) | `.rtile` | V valeur | É 70 | valeur (`b.num`) + libellé (`.label`), 2 lignes au plus |
| Raccourcis (Tests, Sauvegardes, États, Inventaire, Équipement, Repos, Historique, Notes, Sorts, Attaques, Actions) | `.tpbtn` | Pop | M 104 | icône `.tpi` + nom + une info (`.tpsub`), chaque ligne coupée par « … » |
| Inspiration héroïque | `.rtile` / `.tpbtn` | B bascule | É 70 | état ✓ / — |
| Concentration | — | V | M 104 | nom du sort |
| Recherche (tuile) | — | Pop | É 70 | une seule rangée de haut |
| Emplacements de sorts | `.rslots` | K compteur | L 156 | ronds par niveau, seulement dans un bloc créé |
| Ressources (une par ressource) | `.rrestile` / `.rres` | K / R | É 70 | « 2/3 » ou dés « 9/10 d4 » ; ronds si la place suffit |
| Combat! (Action, Action bonus, Réaction, Mouvement, Autre) | `.tturnbtn` | Pop | — | libellé sur 2 lignes au plus (`.tturnl`) + nombre d'options (`.tturnn`) |

Ne sont **pas** des tuiles : la carte Points de vie (`.health-card`), le bandeau du personnage (`.character-banner`), la barre de recherche du bloc Recherche, les lignes de liste (`.trow`, avec les boutons de jet `.tkb`).

## 4. Ce qu'on peut retoucher librement

- Disposition interne (alignements, ordre icône / valeur / libellé), icônes SVG (trait `var(--brass)`).
- Couleurs, bordures, ombres, à condition de passer par les variables du thème (`--sheet`, `--sheet2`, `--line`, `--brass`, `--ink`, `--muted`, `--blood`, `--ok`…), en sombre **et** en clair.
- États : pressé (`aria-pressed`), épuisé (`.vide0`), survol, focus visible.

## 5. Avant de rendre une retouche

1. `python3 build.py`, puis **toute** la suite (`node tests/run.js dist/dnd-compagnon.html`). Tests qui gardent les tuiles : « Tuiles (T1) », « Tuiles (T2) », « Tuiles T5 », « Formats des blocs de base », « Placement libre », « Grande case 2×2 », « aucun débordement à 375 points ».
2. Vérifier à l'œil à 390 px et 1200 px, thème sombre et clair, dans un bloc de 4 colonnes et dans un bloc d'une colonne.
3. Pas de texte coupé hors « … » prévu, rien qui déborde de 76 px de haut.
