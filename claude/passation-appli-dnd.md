# Passation technique — D&D Compagnon

État au 10 novembre 2026. Fusion de la passation historique (versions 112 à 118 de l'artefact) et de la passation de la reprise menée hors de Claude (sauvegardes, isolation de Claude, dés virtuels, pavé numérique, suivi du tour).

Règles de travail communes à Claude et ChatGPT : `AGENTS.md`. Construction et tests : `LISEZMOI.md`. En cas de contradiction, l'ordre d'autorité est : `AGENTS.md`, puis `LISEZMOI.md` et les sources, puis ce document.

Ce document reste privé (il cite les persos de la table) : ne jamais le joindre à une version distribuée ni à un dépôt public.

## 1. Vue d'ensemble

- Application web en JavaScript vanilla, distribuée sous forme d'un **fichier HTML autonome** (styles, script et catalogues embarqués).
- Deux usages :
  - **artefact claude.ai** : version publiée utilisée par la table, avec capacités Claude (base en ligne, utilisateur, génération, navigateur, téléchargements) ;
  - **fichier autonome** : fonctionne sans Claude, données dans le navigateur.
- **Source officielle : le dépôt Git local** `/Users/maison/Documents/JDR/Appli/App Version Claude`, branche `main`. GitHub ne sert que de sauvegarde (aucun envoi sans accord). `dist/` est reconstruit par `build.py` et n'est pas suivi par Git.
- Le dossier `D&D Compagnon/` (ancienne page et `content.json`) est encore utilisé : ne pas le modifier. `js/03-demarrage.js` charge `content.json` en secours si le SRD embarqué manque.
- `dnd-compagnon.html` à la racine : copie suivie de l'appli, distincte de `dist/`.

## 2. Organisation des sources

| Chemin | Rôle |
|---|---|
| `shell.html` | Gabarit de la page avec cinq repères d'assemblage |
| `styles.css` | Styles de base |
| `theme.css` | Thème Dark Fantasy (sombre par défaut) et mode clair |
| `js/01-base.js` | Constantes, état `S`, classes hors SRD |
| `js/02-plateforme.js` | Adaptateur `PLATFORM` : **seul** accès à `window.claude` |
| `js/02-remplissage.js` | Remplissage automatique (AideDD, web, mémoire, onglets) |
| `js/03-demarrage.js` | Démarrage, sauvegarde, thème, préférence des dés virtuels |
| `js/04-catalogue.js` | Catalogue hors SRD et écran de relecture |
| `js/05-regle.js` | Règles et calculs (`derive`, effets, objets magiques, dés) |
| `js/06-fiche.js` | Rendu de la fiche et des vues |
| `js/07-montee-niveau.js` | Montée de niveau |
| `js/08-table.js` | « À la table », équipement, suivi du tour |
| `js/09-objets-bulles.js` | Objets SRD, info-bulles |
| `js/10-assistant.js` | Assistant de création, import/export |
| `js/11-evenements.js` | Gestionnaires d'événements |
| `data/srd-data.json` | Catalogue SRD 5.2.1 FR (~1 Mo) |
| `data/hb-cat.json` | Catalogue hors SRD (~100 Ko, 432 entrées) |
| `outils/` | Régénération du catalogue hors SRD |
| `tests/run.js` | Suite Playwright (64 cas) |
| `claude/` | Passation, plan de tests par classe, référence d'entraînement du perso Occultiste |

Les modules sont **concaténés dans l'ordre alphabétique** des noms et partagent la même portée globale (pas d'import/export). Les noms de fichiers sont sans accent ni espace.

Renommages du 10 novembre 2026 (commits `a402ea1` et `b8118cd`) :

| Ancien nom | Nouveau nom |
|---|---|
| `js/03-démarrage.js` | `js/03-demarrage.js` |
| `js/07-montee niveau.js` | `js/07-montee-niveau.js` |
| `js/09-objets bulles.js` | `js/09-objets-bulles.js` |
| `claude/passation appli dnd.md` | `claude/passation-appli-dnd.md` |
| `claude/plan tests classes.md` | `claude/plan-tests-classes.md` |
| `claude/cornelius reference entrainement.md` | `claude/cornelius-reference-entrainement.md` |

L'ordre de concaténation est inchangé ; le fichier construit est identique octet pour octet. Le `é` de `03-démarrage.js` existait en deux encodages (composé dans Git, décomposé sur le disque macOS), ce qui créait un faux fichier non suivi vu depuis Linux.

## 3. Construction et validation

`python3 build.py` produit `dist/index.html`, `dist/dnd-compagnon.html` et `dist/main.js`. Le build échoue si :

- un catalogue est absent, invalide ou incomplet (SRD : plus de 300 sorts et au moins 12 classes ; hors SRD : plus de 400 entrées) ;
- un repère d'assemblage manque ou est en double dans `shell.html` ;
- un module contient `</script` ;
- le JavaScript assemblé échoue à `node --check`.

Tests : `node tests/run.js dist/dnd-compagnon.html` (Playwright ; persos temporaires ; Claude et navigateur simulés). Playwright n'est pas installé sur le Mac : Claude lance la suite dans son espace de travail, sur le `dist/dnd-compagnon.html` construit par le Mac.

## 4. Architecture

- Rendu complet via `render()`, délégation sur `data-act` (clics) et gestionnaires change/input (`data-bind`, `data-hb`, `data-lu`, `data-w`). L'état `S` est une constante globale (pas `window.S`).
- Modales via `renderModal()` ; priorité : `S.rv` relecture, `S.catPick` catalogue, `S.af` remplissage auto, puis `S.pending`.
- Données SRD dans `#srd-data`, index `S.C` / `S.idx`. `clsOf(id)` résout classes SRD et hors SRD (`hbClass`, id `"hb:"+_id`).
- Calcul : `derive(ch)` → `D` (sources/effets, sorts, ressources `D.res`, `D.always`, CA, PV…). Effets hors SRD : `maitrise`, `sorts`, `ressource` (max par formule `evalF`, accepte `niv>=3?1:0`), `reserve` (dés), `pvniv`, `guerisseur`, etc.
- Navigation : « À la table » et « Fiche de personnage » restent sur le perso affiché (`S.cur`) ; le perso principal (`mainId()`) n'est pris que si aucun perso n'est ouvert.
- En-tête : marque, navigation, « Menu » et, dessous (`#hchar`), le bouton « Mode clair / Mode sombre » (`data-act="theme"`).
- Thème : `curTheme` / `applyTheme` / `setTheme` (03-demarrage) ; `data-theme` sur `<html>` (`dark` par défaut, `light`), enregistré dans `prefs.theme` et `localStorage` (`registre-theme`). Dans `theme.css`, chaque couleur est une variable `--df-<couleur sombre>` définie dans un bloc sombre et un bloc clair ; retouches du clair en fin de fichier.
- Bandeau `setBanner(texte, clé)` : croix `bannerClose` ; avec une clé, la fermeture est retenue (`registre-banner-<clé>`, clé `local` pour « Mode local »).
- Portrait (`data-act="portrait"`) : champ fichier `#portrait-file` créé à la demande dans `<body>`, **hors du rendu** (un `render()` pendant le choix de l'image le détruisait) ; id du perso dans `dataset.id`. Réduction en boucle (320 → 192 px) sous 60 000 caractères, en WebP ou en JPEG si le navigateur n'encode pas le WebP (Safari).
- Vues : menu/liste ; fiche (bandeau avec portrait, onglets Jeu, Compétences, Sorts, Aptitudes, Inventaire, Notes, Construction) ; « À la table » ; Contenu perso (éditeur hors SRD) ; Grimoire.
- « À la table » : bandeau de stats avec bouclier de CA ; carte santé (barre de PV, « PV max ± », dés de vie en affichage, Concentration, Inspiration héroïque, bouton Repos) ; popup Repos en deux cartes (`restOpen`, `restKind`, `restLong`, `restShort`) ; tour Action / Bonus / Réaction / Mouvement / Autre ; carte Détails `tCard`.
- Assistants : création (`viewWizard`, `S.W`, 8 étapes) ; montée de niveau (`levelPlan` / `lvlModal` / `lvlApply`, enchaînement via `S.lvlTarget`, « Arrêter ici » confirmé par `lvlStop` / `lvlStopNo` / `lvlStopYes`).

## 5. Plateforme et Claude

- `js/02-plateforme.js` expose `PLATFORM` : utilisateur, base de données, génération, navigateur Claude, téléchargement. Aucun autre module n'appelle `window.claude`.
- Sans pont Claude : l'appli démarre en mode local, les persos sont dans le navigateur, les catalogues sont disponibles, les fonctions de jeu marchent.
- Artefact publié : https://claude.ai/artifact/StZK93cX5zFvqDhjF5D62G (propriétaire : Angle), dernière version publiée v118. Données en ligne par utilisateur (`data/users/<uid>/`, fiche limitée à 256 Ko), lisibles et modifiables par Claude avec `ArtifactData` (toujours avec `if_version`).
- Persos en ligne : `perso_cornelius` (Cornelius Ward, Humain Occultiste 3, Protecteur céleste, historique Médecin) ; `perso_vvofmqf02c3j` (Garrant, Aasimar Paladin 3, Serment de dévotion, Soldat, joueur Seb). Contenus hors SRD : `h_agathys`, `h_guerisseur`, `h_robuste`, `h_protecteur`, `h_medecin`, `hb_crsbnkdcxnl1` (Aasimar), `hb_m6495mrrhpfl` (Traité de médecine). Capacités à conserver à chaque publication (republier **sans** `capabilities`) : `db`, `downloads`, `user`, `sample`, `mcp` vers le navigateur de l'app (`preview_start`, `get_page_text`, `tabs_close`).
- Remplissage automatique (`afRun`, `afNear`, `afWeb`, `afMem`) : AideDD via le navigateur de l'app → page la plus proche (`AIDE_IDX`) → recherche web limitée à `WEB_SITES` → mode mémoire (`sample`, marqué « à vérifier »). La lecture web ne marche que pour le propriétaire de l'artefact, dans l'app Claude sur ordinateur.
  - `afTab(r)` lit l'identifiant d'onglet quelle que soit la forme de la réponse ; `afCloseTab` attend la fermeture et signale un échec dans `S.afTabNote`. `preview_start` répond « Opened <url> in the browser pane (tabId seed) » ; avec un seul onglet, l'id `seed` est réutilisé.
  - Pages à ancre (sous-classes, historiques d'AideDD) : lecture jusqu'à 200 000 caractères, puis `afSection` garde la section utile.
- **Reliquats** : des textes mentionnent encore Claude ou claude.ai (`02-remplissage.js`, `04-catalogue.js`, relecture hors SRD). Question ouverte : garder ces capacités seulement dans l'artefact, ou les supprimer au profit d'un remplissage manuel. L'appli ne doit pas laisser croire que Claude est nécessaire.

## 6. Catalogue hors SRD

- `S.CAT` : 432 entrées des règles 2024, **noms, livre, lien et faits mécaniques seulement**, jamais de texte de règles.
- Champs : `id`, `k` (classe, sous-classe, historique, espece, don, sort), `n`, `vo`, `b`, `u` ; sous-classe `c` ; historique `ab`, `sk`, `tools`, `feat`, `featRef` ; don `cat`, `pre`, `lv` ; sort `lv`, `ec`, `cl`, `ct`, `conc`, `rit`.
- Sources : Manuel des joueurs 2024 en français (36 sous-classes, 12 historiques, 58 dons, 52 sorts) ; suppléments en VO depuis les listes publiques de D&D Beyond (Heroes of Faerûn, Astarion's Book of Hungers, Lorwyn, Eberron: Forge of the Artificer, Ravenloft: The Horrors Within, Arcana Unleashed). Non inclus : World of Warcraft, « Drops » D&D Beyond. Les classes des sorts des suppléments ne sont pas publiques : ces sorts n'apparaissent que dans Contenu perso (sauf Homunculus Servant → Artificier).
- Valeur d'option `cat:<id>` ; `catMat` crée la fiche hors SRD (`catId`, `pending:true`, lien, faits) au moment du choix ; `catRes` dans le gestionnaire `change` et dans `wpick` ; `catHb` évite les doublons.
- Relecture (`S.rv`, `rvStart` / `rvRun` / `rvFill` / `rvApply`) après création ou montée de niveau : « Remplir », Valider, Laisser à remplir (`pendingSkip`), Tout valider. Fiches abandonnées dans l'assistant supprimées (`W.catMade`).
- Régénération : `python3 outils/build_cat.py` puis `python3 build.py`.

## 7. Données, sauvegardes et imports

- Version distribuée **vierge** : aucun personnage réel ni d'exemple (test automatisé). Les persos s'importent séparément.
- Bouton « Télécharger ma copie personnelle » (`dnd-compagnon-personnel.html`) : contient les données du joueur, à ne pas partager involontairement. Export d'un perso : `<nom>.json`. Ces fichiers sont exclus du dépôt par `.gitignore`.
- Stockage local : clé `registre-docs`, enveloppe versionnée (`registre: 1`, `dataVersion: 1`, dictionnaire `docs`). L'ancien format (dictionnaire direct) est migré ; une version future est refusée avec un message.
- Une nouvelle version du HTML ne remplace **jamais** des données locales existantes ; le seed embarqué n'initialise qu'un navigateur vierge.
- Erreurs d'écriture visibles (stockage plein, accès refusé, version future, échec) : les données restent marquées modifiées et le joueur est invité à exporter.
- Écriture regroupée (700 ms), forcée immédiatement sur `pagehide` et passage à l'état caché (Safari / iOS).
- Imports validés avant insertion (taille, type, version, profondeur, longueur des listes et des chaînes, structure des persos et contenus, identifiants, nombres, tableaux, propriétés interdites `__proto__` / `prototype` / `constructor`). Un import incohérent est refusé en entier.

## 8. Philosophie de jeu (validée)

« À la table » est le produit principal ; l'onglet Jeu, plus dense, reste la fiche complète.

1. Le joueur décrit au MJ ce qu'il veut faire.
2. Le MJ décide si c'est possible, s'il faut un jet, et lequel.
3. Le joueur retrouve ce jet dans l'appli.
4. L'appli applique les modificateurs et automatismes connus.
5. Le MJ reste seul juge du résultat.

L'appli ne joue pas à la place du joueur, ne propose pas la meilleure action, ne décide pas du test, n'interprète pas une intention narrative et n'annonce pas qu'une attaque touche. Exemple : « Je veux me cacher » ne doit **pas** mener à « Fais un test de Discrétion ».

Principe : une fois la mécanique indiquée par le MJ, le joueur la trouve et l'exécute en deux clics maximum.

## 9. Dés virtuels et dés physiques

- Dés virtuels **verrouillés par défaut**. Interrupteur global dans « À la table », près des notes et de l'historique : « Dés virtuels : désactivés / activés ».
- Réglage global au navigateur (tous les persos, jamais dans une fiche ni importé) : clé `registre-virtual-dice`, valeurs `1` / `0`. Repli de session avec avertissement si le stockage est indisponible ; synchronisation entre onglets par l'événement `storage`.
- Fonctions (03-demarrage) : `virtualDiceEnabled()`, `setVirtualDice()`, `applyDicePreference()`, prévues pour le futur menu « Réglages généraux ».
- **Modes exclusifs** (décision explicite) : en mode physique, champs et pavé seulement, aucun tirage ; en mode virtuel, boutons virtuels seulement, champs physiques masqués et pavé impossible à ouvrir.
- Contrôles aléatoires marqués `data-virtual` et recensés dans `VIRTUAL_ACTIONS` : `wroll`, `r20`, `dmg`, `death`, `spendhd`, `pool`, `ccroll`, `hdvirt`, `tvroll`, `tvdmg`, `cast`, `sdmg`, `smiteRoll`, `chargeRecoveryRoll`. Blocage avant tout tirage ou dépense (emplacement, charge, ressource), et contrôle dans les fonctions de dés.
- **Tout nouveau contrôle aléatoire** : `data-virtual`, ajout à `VIRTUAL_ACTIONS`, test verrouillé et déverrouillé.
- Récupération aléatoire de charges au repos, dés verrouillés : mise en attente sur l'objet, champ dans « À la table », le joueur saisit le total des dés, l'appli ajoute le bonus fixe ; l'attente est sauvegardée avec le perso.
- Pavé numérique (remplace les curseurs) : chiffres, Effacer, retour arrière, Annuler, Valider ; bornes du dé contrôlées ; valeur appliquée et journalisée après validation ; clavier (chiffres, Entrée, Échap ; Entrée ou Espace ouvre le pavé). Couvre d20, deux d20 (avantage/désavantage), dégâts, concentration, dés de vie, jets contre la mort, formules libres, charges, Frappe occulte, dés de création. Pas de débordement en largeur iPhone (testé).

## 10. Suivi du tour

- Ouvrir une carte, consulter les bonus, changer avantage/désavantage, saisir un dé au pavé ou fermer sans valider : **rien n'est consommé**.
- Le lancer virtuel ou la validation physique du **jet principal** consomme le coût (Action, Action bonus ou Réaction). Les dégâts, critiques et relances ne consomment rien de plus. (Une variante « consommer aux dégâts » a été essayée puis annulée.)
- La carte Détails reste ouverte, le résultat visible, avec « ✓ Action consommée pour ce tour » et « Annuler la consommation ».
- L'annulation restaure **seulement** le suivi du tour : ni résultat, ni historique, ni emplacement, charge ou ressource rendus. Le libellé doit rester clair sur ce point.
- Actions sans jet : bouton explicite, consommation au clic.
- Coûts gérés : Action, Action bonus, Réaction (« Action consommée », « Action bonus consommée », « Réaction consommée »). Aucun coût n'est déduit d'une intention ; les coûts modifiables gardent leur sélecteur.
- Plusieurs attaques : état consommé, pas de compteur ; les attaques suivantes restent accessibles.
- Sorts : consultation gratuite ; premier lancement ou premier jet validé = déclaration (emplacement ou ressource dépensé, coût consommé) ; relances sans redépense ; sort mineur = coût sans emplacement ; sans emplacement disponible, rien n'est consommé ; un rituel ne termine pas « Autre ».
- Objets à charges : premier usage = charge + coût ; relances gratuites ; annuler le suivi ne rend pas la charge.
- Initiative et sauvegardes : aucun coût de tour.
- **Mouvement** et **Autre** sont des jalons **manuels**, jamais terminés automatiquement, annulables (« ✓ Mouvement terminé », « ✓ Autre terminé »). « Nouveau tour » remet tout à zéro.
- Compteurs affichés en nombre d'options entre parenthèses (« Actions (8) »), états consommés écrits en clair.

## 11. Historique des versions

- Base : SRD + hors SRD (badge, livre ou « Personnalisée », liens) ; « À la table » complète ; équipement avec silhouette et harmonisation ; objets magiques (+N, charges, multi-sorts) ; manifestations à choix/répétables, Frappe occulte ; classes hors SRD ; assistant de création (tableau standard, points, 6 jets) ; Châtiment divin et lancers gratuits ; Style de combat.
- v112 : montée de niveau de la création protégée ; fermeture des onglets fiabilisée.
- v113 : catalogue hors SRD des règles 2024 et écran de relecture.
- 6 nov. 2026 : découpage en modules, script d'assemblage, tests automatiques.
- v114 : refonte Dark Fantasy, mode clair, « À la table » redessiné.
- v115 : bouton de thème sous « Menu », message « Mode local » fermable, croix des popups agrandies.
- v116 : navigation qui reste sur le perso affiché, popup Repos en deux cartes.
- v117 : interligne de la carte santé.
- v118 : enregistrement du portrait (champ hors rendu, repli JPEG). Dernière version publiée de l'artefact au 10 nov. 2026.
- Reprise hors Claude (9–10 nov. 2026) : sources autonomes avec catalogues dans `data/`, build sans page publiée, HTML nettoyé, version distribuée vierge, adaptateur `PLATFORM`, sauvegarde versionnée et imports validés, dés virtuels verrouillés, pavé numérique, suivi du tour. 64 tests.
- 10 nov. 2026 : essai d'un dépôt GitHub privé partagé, abandonné (pull request #1 de `AngleDS/Compagnon` laissée ouverte, non fusionnée). Nouvelle méthode : dépôt Git local sur le Mac (commit de référence `e78717c`), GitHub en simple sauvegarde. Renommages sans accent ni espace (`a402ea1`, `b8118cd`), `AGENTS.md` / `CLAUDE.md` communs à Claude et ChatGPT, passation fusionnée. Aucun changement de comportement.

## 12. Assistant de création — problèmes connus

- Choix SRD, hors SRD complets et hors SRD « à remplir » mélangés ; des fiches « à remplir » sont sélectionnables et peuvent passer avant des choix complets.
- Certains traits d'espèce exigent un choix (lignage, ascendance, héritage) que l'assistant renvoie à plus tard : fiche incomplète possible.
- Création possible sans nom (« Nouveau personnage »).
- Tableau standard : la même valeur peut être choisie deux fois avant le blocage.

Refonte envisagée : nom et choix mécaniques obligatoires ; contenus complets d'abord ; séparation SRD / hors SRD complet / personnel ou incomplet ; fiches « à remplir » hors du parcours normal ; choix d'espèce intégrés ; parcours plus simple ; aperçu dynamique et création à haut niveau conservés.

## 13. Questions ouvertes

- **Recherche de « À la table »** : « Que fais-tu ? » remplacé par « Trouver un jet, une action, un sort… » (fait le 10 nov. 2026, testé). Gérer les variantes purement mécaniques (attaque/attaquer/frapper, « JS Constitution », « save CON », pluriels, accents, abréviations, fautes simples) **sans jamais** convertir une intention narrative en jet.
- Recherche collante sur téléphone ; hiérarchie de l'en-tête sur téléphone (piste : PV, états et concentration, recherche, tour, CA/initiative/vitesse, perception passive et DD, taille) ; bouton « Ouvrir <test> » depuis une règle déjà ouverte qui cite un test.
- Onglet Jeu : certains automatismes de « À la table » n'y sont pas appliqués (ex. désavantage d'Empoisonné). Connu, non prioritaire.
- Historique des jets : lisibilité, rotation ou limite, distinction entre annulation du suivi et annulation d'une dépense.
- Menu « Réglages généraux » : dés virtuels, thème, futures préférences ; emplacement, persistance de chaque préférence (navigateur, copie personnelle, synchronisation) ; raccourci des dés à garder dans « À la table ».
- Reliquats Claude (section 5).
- Stratégie de sauvegarde entre appareils (navigateur, iPhone, iPad, copie personnelle, synchronisation, restauration, confidentialité) : à concevoir avant d'implémenter.

## 14. À faire (ordre proposé, à valider avec Angle)

1. Vérifier la version actuelle dans l'artefact (persos en ligne, `PLATFORM`) avant de publier la v119 (avec l'accord d'Angle) ; tests manuels : mode physique et virtuel, attaque, dégâts, sort, Action bonus, Réaction, annulation, Mouvement, Autre, Nouveau tour.
2. Finitions de « À la table » (section 13).
3. Menu « Réglages généraux ».
4. Assistant de création (section 12), dont les choix de traits d'espèce.
5. Décision sur les reliquats Claude.
6. Sauvegarde entre appareils.
7. Pack de table (exporter le contenu hors SRD validé pour les autres joueurs) ; bottes d'arme limitées aux armes maîtrisées ; choix de l'outil de l'historique ; « page la plus proche » sans pages SRD pour un élément hors SRD.
8. Essai réel du catalogue et du remplissage dans l'app Claude sur ordinateur.
9. Vérification des classes une à une (`claude/plan-tests-classes.md`) : Garrant (vérification en jeu : Imposition des mains, Conduit divin, Arme sacrée, Châtiment divin ; Style de combat à choisir), puis Baudoin (Gnome Roublard), Mara (Humaine Paladin), Yarjerit Dragnir (Drakéide Moine).
10. Publication (PWA, iPhone, iPad, éventuellement App Store) : seulement après stabilisation et accord explicite.
