# Règles communes — D&D Compagnon

Règle unique pour tout agent qui travaille sur ce dossier (Claude, ChatGPT/Codex ou autre). `CLAUDE.md` ne fait que renvoyer ici. Ordre d'autorité : ce fichier, puis `LISEZMOI.md` et les sources, puis `claude/passation-appli-dnd.md`.

## Source officielle

- Le dépôt Git **local** de ce dossier, branche `main`, est la seule source officielle.
- GitHub sert uniquement de sauvegarde distante et de point de restauration. **Ne rien pousser, ne créer aucune branche distante ni pull request sans l'accord explicite du propriétaire.**
- Claude et ChatGPT travaillent **l'un après l'autre, jamais en même temps**. Chacun repart du dernier commit laissé par l'autre.

## Avant toute modification

1. Lire `LISEZMOI.md` (et ce fichier).
2. `git status` et `git log -1` (ou `git log --oneline -5`).
3. Si des modifications non enregistrées existent : **ne rien écraser**, les signaler au propriétaire et attendre.
4. Pour comprendre le travail récent, utiliser `git diff` / `git log -p` sur les derniers commits plutôt que relire toute l'application. Lire `claude/passation-appli-dnd.md` seulement si le contexte manque.

## Pendant

- Le propriétaire décide. Quand il pose une question : **répondre et proposer, ne rien modifier sans son accord.**
- Modifier **uniquement les fichiers nécessaires** à la tâche. Pas de refonte non demandée.
- Ne jamais modifier `dist/` (généré, non suivi par Git) ni le dossier `D&D Compagnon/` (encore utilisé).
- Noms de fichiers sans accent, sans espace, sans caractère spécial.

## Après modification

Le travail se fait par **lot** : l'ensemble des modifications demandées en une fois par le propriétaire (un ou plusieurs sujets).

1. `python3 build.py`
2. **Pendant le lot**, après chaque sujet : lancer seulement les tests concernés (le ou les nouveaux tests et leurs voisins), par exemple `node tests/run.js dist/dnd-compagnon.html --only "Pavé" --only "Tour"`. Si Playwright manque sur la machine, lancer les tests ailleurs **sur le fichier construit par ce dossier** et le dire.
3. Relire `git diff`.
4. Si les tests ciblés réussissent : `git add` **fichier par fichier** (jamais `git add -A` ni `git add .`), puis un commit local au message explicite. Un commit par sujet ; le message indique « Tests ciblés : N/N ».
5. **À la fin du lot**, une seule fois : reconstruire et lancer **toute** la suite (`node tests/run.js dist/dnd-compagnon.html`, 115 tests au 11 nov. 2026). Un échec se corrige par un nouveau commit, puis toute la suite est relancée. Aucun lot n'est rendu, publié ou laissé à l'autre agent sans une suite complète réussie sur son dernier commit.
6. Communiquer au propriétaire : résumé des changements, fichiers modifiés, résultat exact des tests (ciblés par commit, complet en fin de lot), identifiants des commits.
7. Ne jamais annoncer que les tests passent sans les avoir réellement lancés ; ne jamais présenter un résultat `--only` comme la suite complète.

## Code

- Les modules `js/` sont concaténés dans l'ordre alphabétique et partagent la même portée globale (pas d'import/export).
- Seul `js/02-plateforme.js` accède à `window.claude`. Sans Claude, l'appli doit démarrer et fonctionner en mode local.
- Tout nouveau contrôle aléatoire : attribut `data-virtual`, ajout à `VIRTUAL_ACTIONS`, test dés verrouillés et déverrouillés.
- Chaque correction ou nouvelle fonction ajoute ou adapte un test dans `tests/run.js`.
- Les catalogues `data/srd-data.json` et `data/hb-cat.json` font partie des sources et restent embarqués.

## Données et confidentialité

- Aucun personnage réel ni d'exemple dans la version distribuée ni dans les tests ; tester uniquement sur des persos créés pour le test.
- Ne jamais modifier les vraies fiches de personnage sans demande explicite.
- Les notes de `claude/` peuvent citer les persos de la table : elles restent privées (jamais dans une version distribuée ni un dépôt public).
- Une nouvelle version ne doit jamais écraser les données déjà stockées dans un navigateur.

## Contenu de jeu

- Hors SRD : mécanique, résumé rédigé avec ses propres mots et lien vers la source. Jamais de copier-coller d'AideDD ou d'autres sites, jamais de texte de règles intégral dans le catalogue. Pas de mention « (mes mots) » dans les textes.
- Libellés d'objets et de règles exacts.
- L'appli facilite, le MJ décide : elle ne choisit pas l'action, ne déduit pas un jet d'une intention narrative et n'annonce pas qu'une attaque touche.

## Interface

- Contenu en français, interface épurée.
- Popups ou cartes contextuelles plutôt que listes qui se déplient ; clics qui sélectionnent, pas d'info-bulle gênante.
- « À la table » est l'expérience principale ; vérifier aussi la largeur iPhone.
- Tailles de texte : uniquement l'échelle `--fs-xs` 11, `--fs-sm` 13, `--fs-md` 16, `--fs-lg` 18, `--fs-xl` 22, `--fs-2xl` 28 px (définie dans `styles.css`) ; jamais de `font-size` en px ailleurs, sauf grands chiffres décoratifs (32 px et plus). Un test le vérifie.
- Écrans tactiles : toute cible fait au moins 44×44 px (bloc `@media (pointer:coarse)` en fin de `theme.css`) ; l'ordinateur garde sa densité. Rien ne doit sortir de l'écran en largeur iPhone. Un test le vérifie.
- Fermer une fenêtre : toujours la même croix (44×44, 28 px). Supprimer : toujours l'icône corbeille `ICON_TRASH` avec la classe `btndel`, jamais une croix.

## Livraison

- Publication de l'artefact claude.ai : par Claude seulement, avec l'accord du propriétaire, en conservant les capacités existantes (republier sans `capabilities`).
- Mettre à jour `claude/passation-appli-dnd.md` (et `LISEZMOI.md` si la construction change) quand une décision ou un chantier change.
