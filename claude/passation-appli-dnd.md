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

Tests : `node tests/run.js dist/dnd-compagnon.html` (Playwright ; persos temporaires ; Claude et navigateur simulés). Un seul navigateur pour toute la suite, un contexte isolé par test (vérifié par les tests « Isolation »). Durée dans l'espace de Claude : environ 55 s pour 78 tests (81 s avant le 10 nov. 2026). **Décision d'Angle (10 nov. 2026)** : pendant un lot, seulement les tests concernés (`--only`, environ 10 s) et un commit par sujet marqué « Tests ciblés » ; toute la suite une fois en fin de lot, obligatoire avant de rendre, publier ou passer la main (règle dans `AGENTS.md`). Sans carte graphique, chaque mouvement de souris simulé coûte une image (environ 80 ms) : limiter les `steps` des glisser et ne jamais laisser un clic attendre un élément absent (8 s perdues par attente). Playwright n'est pas installé sur le Mac : Claude lance la suite dans son espace de travail, sur le `dist/dnd-compagnon.html` construit par le Mac.

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
- Artefact publié : https://claude.ai/artifact/StZK93cX5zFvqDhjF5D62G (propriétaire : Angle), dernière version publiée v122 (10 nov. 2026). Données en ligne par utilisateur (`data/users/<uid>/`, fiche limitée à 256 Ko), lisibles et modifiables par Claude avec `ArtifactData` (toujours avec `if_version`).
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

### Moins, mais mieux (décision d'Angle, 10 nov. 2026)

Après comparaison avec Le Compagnon (le-compagnon-dnd.fr : fiche 5E française très complète, outils MJ, table virtuelle, dés 3D, jets déduits des actions), Angle confirme que l'appli prend le chemin inverse : **faire moins, mais mieux**. Règles pour trancher toute nouvelle idée :

- **Orientée joueur, à la table.** Une fonction n'entre que si elle sert le joueur au moment où le MJ vient de demander quelque chose. Outils MJ, préparation et gestion de campagne restent dehors (éventuel outil MJ séparé, plus tard).
- **Deux clics maximum pour tout usage courant**, vérifiés en largeur iPhone : jet, sort, ressource, dégâts et soins, règle d'un état. Une fonction qui en demande trois est retravaillée ou abandonnée.
- **Personnaliser plutôt qu'afficher plus.** Le joueur choisit ce qu'il voit (tuiles, section 15) ; l'écran par défaut reste dépouillé.
- **Aucun agrément décoratif** : pas de dés 3D, pas de bruitages, pas d'animation qui retarde un résultat.
- **Retirer compte autant qu'ajouter** : revue régulière de ce qui encombre.

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

- Ouvrir une carte, consulter les bonus, changer avantage/désavantage, saisir un seul des deux d20, annuler le pavé ou fermer sans saisir : **rien n'est consommé**.
- Le lancer virtuel ou le jet physique complet du **jet principal** consomme le coût (Action, Action bonus ou Réaction). **Une seule validation** (décision d'Angle, 10 nov. 2026) : le Valider du pavé enregistre le jet dès que tous les dés sont saisis ; les boutons « Valider le jet » et « Valider les dégâts » ont été retirés. Formulaires (concentration, dés de vie, mort, charges, Frappe occulte, jet libre) : le Valider du pavé les applique aussi, Appliquer reste pour le clavier. Un jet physique n'est jamais journalisé deux fois pour la même saisie (`physLogged`). Les dégâts, critiques et relances ne consomment rien de plus. (Une variante « consommer aux dégâts » a été essayée puis annulée.)
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
- v118 : enregistrement du portrait (champ hors rendu, repli JPEG).
- Reprise hors Claude (9–10 nov. 2026) : sources autonomes avec catalogues dans `data/`, build sans page publiée, HTML nettoyé, version distribuée vierge, adaptateur `PLATFORM`, sauvegarde versionnée et imports validés, dés virtuels verrouillés, pavé numérique, suivi du tour. 64 tests.
- 10 nov. 2026 : essai d'un dépôt GitHub privé partagé, abandonné (pull request #1 de `AngleDS/Compagnon` laissée ouverte, non fusionnée). Nouvelle méthode : dépôt Git local sur le Mac (commit de référence `e78717c`), GitHub en simple sauvegarde. Renommages sans accent ni espace (`a402ea1`, `b8118cd`), `AGENTS.md` / `CLAUDE.md` communs à Claude et ChatGPT, passation fusionnée. Aucun changement de comportement.
- v119 (10 nov. 2026, commit `f8159ca`) : première publication depuis le dépôt local. Reprend la reprise ChatGPT (sauvegarde versionnée, `PLATFORM`, dés virtuels verrouillés par défaut, pavé numérique, suivi du tour) et le texte de recherche « Trouver un jet, une action, un sort… ». Vérifiée avant publication avec une copie en lecture seule des vraies données en ligne : calculs de Cornelius identiques à la v118, aucune erreur, aucune écriture à l'ouverture. Capacités de l'artefact conservées. La plateforme enveloppe la page dans son propre squelette HTML (balises en double sans effet). Garrant n'apparaît pas dans les données en ligne du propriétaire (peut-être dans l'espace de Seb) : à vérifier avec Seb.
- v120 (10 nov. 2026, commit `3ae4d66`) : historique des jets plus lisible (un jour à la fois, toucher + dégâts regroupés, « Voir plus ») et glisser-déposer de l'équipement (zone Sac, échange, appui long au doigt). Vérifiée avec une copie des vraies données avant et après publication : calculs inchangés, aucune écriture, aucune erreur. Capacités conservées. À essayer en vrai : appui long sur iPhone.
- v121 (10 nov. 2026, commit `82f0cbd`) : échelle typographique unique (commit `1bffb09`), cibles de 44×44 sur écran tactile, croix de fermeture identiques, corbeilles, champ « Jet libre » et inventaire réparés sur téléphone. Vérifiée avec une copie des vraies données avant et après publication : calculs inchangés, aucune écriture, aucune erreur. Capacités conservées.
- v122 (10 nov. 2026, commit `9789a67`) : une seule validation des vrais dés (le Valider du pavé enregistre le jet), plus de double ligne dans l'historique, ligne = carte et bouton i = règle, états et repos dans la recherche (règle d'un état depuis la popup États, pastille d'un état actif réparée), champs de dés sans flèches haut/bas ni effet des touches ↑/↓ et de la molette. Vérifiée avec une copie en lecture seule des vraies données avant et après publication (dés physiques et virtuels) : calculs de Cornelius identiques à la v121, aucune écriture, aucune erreur. Capacités conservées. À essayer à la main : attaque et sort en vrais dés au pavé (une seule validation, Action consommée, une ligne d'historique), bouton i au doigt, recherche « empois » et « repos ».

## 12. Assistant de création — problèmes connus

- Choix SRD, hors SRD complets et hors SRD « à remplir » mélangés ; des fiches « à remplir » sont sélectionnables et peuvent passer avant des choix complets.
- Certains traits d'espèce exigent un choix (lignage, ascendance, héritage) que l'assistant renvoie à plus tard : fiche incomplète possible.
- Création possible sans nom (« Nouveau personnage »).
- Tableau standard : la même valeur peut être choisie deux fois avant le blocage.

Refonte envisagée : nom et choix mécaniques obligatoires ; contenus complets d'abord ; séparation SRD / hors SRD complet / personnel ou incomplet ; fiches « à remplir » hors du parcours normal ; choix d'espèce intégrés ; parcours plus simple ; aperçu dynamique et création à haut niveau conservés.

## 13. Questions ouvertes

- **Recherche de « À la table »** : « Que fais-tu ? » remplacé par « Trouver un jet, une action, un sort… » (fait le 10 nov. 2026, testé). **Décision d'Angle (10 nov. 2026) : pas de recherche par variantes de vocabulaire** (attaquer/frapper, « save CON »…) : l'appli aide à chercher, elle ne devine pas une intention.
- **Reporté (décision d'Angle, 10 nov. 2026)** : recherche collante sur téléphone ; hiérarchie de l'en-tête sur téléphone (piste : PV, états et concentration, recherche, tour, CA/initiative/vitesse, perception passive et DD, taille) ; bouton « Ouvrir <test> » depuis une règle déjà ouverte qui cite un test.
- **Tuiles personnalisables du bandeau d'« À la table »** (idée d'Angle, 10 nov. 2026, pas commencée ; détail dans la section 15).
- **Glisser-déposer de l'équipement** (fait le 10 nov. 2026, décisions d'Angle) : dans la popup « Équipement », on glisse un objet d'un emplacement à l'autre, depuis la nouvelle zone « Sac » (objets équipables non portés) vers un emplacement, ou d'un emplacement vers le Sac pour le retirer. Emplacement occupé : échange si chaque objet convient à sa nouvelle place, sinon refus ; depuis le Sac, l'ancien objet retourne au Sac. Mains : mêmes règles que la liste d'un emplacement (tout objet sauf armure ; **bouclier seulement en main secondaire**, décision d'Angle). Cibles valides allumées pendant le glisser. Souris : glisser direct ; doigt : appui long (350 ms) puis glisser, un glisser rapide reste un défilement. Toucher un emplacement ouvre toujours la liste. Code : `eqDropFits`, `eqMoveOk`, `eqMove` (08-table, s'appuient sur `eqSet`) et bloc « glisser-déposer » en fin de 11-evenements (événements de pointeur, pas de glisser-déposer natif, peu fiable au doigt sur iPhone). À essayer en vrai sur iPhone.
- **Cohérence de l'interface** (audit du 10 nov. 2026 à la demande d'Angle). Typographie **faite** : 27 tailles différentes ramenées à une échelle unique de 6 (variables `--fs-*` dans `styles.css`, 11 / 13 / 16 / 18 / 22 / 28 px ; grands chiffres décoratifs de 32 px et plus inchangés ; `<small>` rattaché à l'échelle) ; texte courant 15 → 16 px ; test automatique. Zones tactiles et croix : **faites** (même jour) : sur écran tactile seulement (`@media (pointer:coarse)` en fin de `theme.css`, prioritaire sur les hauteurs du thème), toutes les cibles font au moins 44×44 (boutons, listes, champs, sections dépliables, cases à cocher via leur étiquette, pastilles de charges avec le même dessin au centre, mots d'aide agrandis en hauteur) ; l'ordinateur garde sa densité (décision d'Angle). Croix de fermeture identiques partout (popups, bulles, pavé numérique, bannière : 44×44, 28 px). Boutons de suppression : icône corbeille (`ICON_TRASH`, classe `btndel`, décision d'Angle). Corrigés au passage : champ « Jet libre » écrasé à 18 px de large dans l'onglet Jeu (défaut antérieur) ; lignes de l'inventaire qui sortaient de la popup. Sur téléphone, un objet à beaucoup de charges (10 pour la Trousse de soins) affiche ses pastilles sur plusieurs rangées : piste future, un compteur compact au-delà de 6 charges. Tests automatiques : typographie, cibles tactiles, rien hors écran, croix, corbeilles, densité sur ordinateur.
- **Audit « deux clics » d'« À la table »** (10 nov. 2026, iPhone 390×844, Paladin 5 de test). Trouver un jet, un sort, une ressource ou encaisser des dégâts : 1 à 2 touchers. Corrigé le jour même avec l'accord d'Angle : double ligne dans l'historique pour les tests et sauvegardes physiques (`f3f37a7`) ; **une seule validation** des vrais dés (`4361fc4`, un toucher de moins par jet : sauvegarde physique à 6 touchers au lieu de 7 pour un résultat à deux chiffres ; le message de ce commit indique à tort 5) ; ligne = carte, bouton i = règle (`f45682a`) ; états et repos dans la recherche, règle d'un état depuis la popup États, pastille d'un état actif réparée (`cb41c35`). **Reste à réfléchir avec Angle** : la recherche est sous le pli (870 px pour un écran de 844) ; au-dessus : navigation (Contenu perso, Grimoire, Mode clair), bloc identité (classe, espèce, historique, joueur), tuiles, carte PV ; rien du tour ni des jets visible sans défiler. Pistes notées, non décidées : en-tête compact, identité sur une ligne, navigation dans le Menu, recherche en haut ou collante, texte d'aide sous le suivi du tour à retirer, Taille et Perception passive vers les tuiles (section 15).
- Onglet Jeu : certains automatismes de « À la table » n'y sont pas appliqués (ex. désavantage d'Empoisonné). Réglé par le futur onglet « Feuille » (section 16), qui affichera ces effets sans permettre de jouer.
- Historique des jets : lisibilité **faite le 10 nov. 2026** (un jour à la fois avec pastilles « dim. 8 nov. (124) », jour le plus récent par défaut ; toucher + dégâts/soins du même nom à moins de 10 minutes regroupés sur une ligne, supprimés ensemble ; lignes compactes avec détail des dés en petit ; 30 lignes puis « Voir plus »). Croix de suppression par ligne conservées telles quelles et filtres par type refusés pour le moment (décisions d'Angle). Restent : rotation ou limite (aujourd'hui 200 jets par perso), distinction entre annulation du suivi et annulation d'une dépense.
- Menu « Réglages généraux » : dés virtuels, thème, futures préférences ; emplacement, persistance de chaque préférence (navigateur, copie personnelle, synchronisation) ; raccourci des dés à garder dans « À la table ».
- Reliquats Claude (section 5).
- Stratégie de sauvegarde entre appareils (navigateur, iPhone, iPad, copie personnelle, synchronisation, restauration, confidentialité) : à concevoir avant d'implémenter.

## 14. À faire (ordre validé par Angle le 10 nov. 2026, sauf mention)

**Lot 1 — Corrections sans décision** (relevées par l'audit « deux clics », la revue UX de ChatGPT et Angle ; feu vert d'Angle à attendre avant de commencer) :
1. Onglets de la fiche qui se chevauchent sur iPhone (« CompétenSorts… ») : barre d'onglets défilante horizontalement, onglets à largeur naturelle, indice visible qu'elle continue. Ajouter un test qui détecte les chevauchements d'éléments (les tests de largeur actuels ne vérifient que le débordement de la page).
2. Popups longues (« Tests de caractéristique »…) : indice visible que le contenu continue plus bas.
3. Texte de la recherche tronqué sur téléphone : le raccourcir (piste : « Jet, action, sort… »).
4. Tuile Initiative vide dans l'onglet Jeu (future « Feuille ») sur téléphone : vérifier et corriger.
5. Import d'un personnage : revenir à la liste des personnages (avec un message « <nom> importé ») au lieu d'ouvrir l'onglet Jeu (aujourd'hui `S.view="sheet"; S.tab="jeu"` dans le gestionnaire d'import de `js/11-evenements.js`).

**Lot 2 — En-tête d'« À la table » sur téléphone** (à redéfinir avec Angle avant tout code). « À la table » est le seul écran de jeu (section 16) : son en-tête est pensé uniquement pour jouer. Constat de l'audit : recherche à 870 px pour un écran de 844, rien du tour ni des jets visible sans défiler. Maquettes A (actuel), B (compact) et C (recherche collante) proposées le 10 nov. : **Angle n'est pas convaincu**. Point de départ suivant : ce qu'Angle veut voir en premier en ouvrant l'appli en pleine partie. Pistes plus franches à proposer : commandes en bas de l'écran, sous le pouce ; écran de jeu sans défilement, le reste en popups.

**Lot 3 — Tuiles personnalisables** (section 15), à concevoir avec l'en-tête du lot 2.

**Lot 4 — Onglet « Feuille »** (chantier prévu plus tard par Angle ; section 16).

**Idées notées par Angle (10 nov. 2026), à planifier** :
- **Renommer « Grimoire » en « Catalogue »** (navigation, titre de la page, mentions dans l'appli).
- **Renommer « Contenu perso » en « Mes contenus »** (décision d'Angle, 10 nov. 2026 ; navigation, titre de la page et mentions dans l'appli, dont l'assistant de création). « Homebrew » écarté : la page contient aussi les éléments saisis depuis les livres officiels hors SRD.
- **« À la table » : accès rapide aux jets et actions les plus utilisés.** Existe déjà en partie : `T.recent` (6 derniers éléments ouverts, `js/08-table.js`), mais par récence, pour la session seulement, non enregistré. Piste : classement par fréquence tiré de l'historique des jets (`rollLog`) et des cartes ouvertes, enregistré dans la fiche. Information factuelle, sans deviner d'intention.
- **« À la table » : plusieurs notes horodatées** au lieu de la zone unique « Notes de partie » (`sessionNotes`) : ajouter, lire, supprimer ; date et heure automatiques. Migration : l'ancienne note devient la première.
- **Menu : générer un PDF propre de la fiche** (mise en page soignée, lisible à l'impression). Voisin du chantier « Feuille » (section 16), qui peut servir de base. Choix technique à faire (feuille de style d'impression ou génération directe).

**Ensuite** (ordre à revoir au moment voulu) :
- Menu « Réglages généraux » (thème, dés virtuels, futures préférences ; il accueille aussi « Mode clair », « Contenu perso », « Grimoire » si l'en-tête est allégé).
- Assistant de création (section 12), dont les choix de traits d'espèce.
- Accueil plus léger sur téléphone (revue UX de ChatGPT, priorité moyenne) : « Créer un personnage » comme action principale, import et sauvegarde regroupés dans un bloc secondaire.
- Décision sur les reliquats Claude.
- Sauvegarde entre appareils.
- Pack de table (exporter le contenu hors SRD validé pour les autres joueurs) ; bottes d'arme limitées aux armes maîtrisées ; choix de l'outil de l'historique ; « page la plus proche » sans pages SRD pour un élément hors SRD.
- Essai réel du catalogue et du remplissage dans l'app Claude sur ordinateur.
- Vérification des classes une à une (`claude/plan-tests-classes.md`) : Garrant (vérification en jeu : Imposition des mains, Conduit divin, Arme sacrée, Châtiment divin ; Style de combat à choisir), puis Baudoin (Gnome Roublard), Mara (Humaine Paladin), Yarjerit Dragnir (Drakéide Moine).
- Publication (PWA, iPhone, iPad, éventuellement App Store) : seulement après stabilisation et accord explicite.

**À essayer à la main dans l'artefact (v122)** : attaque et sort en vrais dés au pavé (une seule validation, Action consommée, une ligne d'historique), bouton i au doigt, recherche « empois » et « repos », mode virtuel, Action bonus, Réaction, annulation, Mouvement, Autre, Nouveau tour.

**Outillage (facultatif)** : si Codex travaille sur le Mac, installer Playwright sur macOS pour qu'il lance `tests/run.js` lui-même (commandes dans la conversation du 10 nov.) ; son navigateur intégré refuse `file://`, passer par `python3 -m http.server 8765` et `http://localhost:8765/dist/dnd-compagnon.html`.

## 15. Chantier à venir : tuiles personnalisables d'« À la table »

Idée d'Angle (10 nov. 2026). **Rien n'est codé ; tout ce qui n'est pas marqué « décidé » reste à valider avec Angle avant de développer.**

Décidé par Angle :
- Le bandeau d'« À la table » devient un ensemble de tuiles choisies **par perso** (réglage enregistré dans la fiche, il suit l'export).
- Le **nombre de tuiles est limité** par la place sur téléphone.
- Les **tuiles obligatoires comptent dans ce quota** (pas de tuile hors quota).
- Certaines tuiles sont **obligatoires selon la classe** ; ensuite, un **défaut confortable** est pré-coché par classe et reste modifiable.
- Le comportement **dépend de la tuile** : simple affichage, ou ouverture du jet ou du compteur correspondant. Jamais de décision à la place du MJ.
- Il faut d'abord **définir le catalogue** de toutes les tuiles possibles.

Interface envisagée : bouton « Personnaliser » sur le bandeau → popup pour cocher et ordonner ; tuiles obligatoires grisées (déplaçables, pas retirables). Bandeau actuel (défaut de départ) : CA, Initiative, Vitesse, Taille, Perception passive, DD des sorts. PV, Concentration et Inspiration restent dans la carte santé, hors tuiles.

Catalogue proposé (non validé) :

| Famille | Tuiles | Au toucher |
|---|---|---|
| Défense et mouvement | CA, Vitesse, Taille | affichage |
| | Initiative | ouvre le jet |
| Perceptions passives | Perception, Investigation, Intuition | affichage |
| Magie | DD des sorts | affichage |
| | Attaque de sort | ouvre le jet |
| | Emplacements ou pacte | compteur |
| Jets au choix | une caractéristique, une sauvegarde, une compétence | ouvre le jet |
| Ressources | chaque ressource de classe ou d'aptitude | compteur |
| | Dés de vie restants, Épuisement | affichage |
| Divers | Bonus de maîtrise, Or | affichage |
| | Charges d'un objet | compteur |

Obligatoires proposées (non validées) : pour tous CA, Initiative, Vitesse (demandées ou utilisées à presque chaque tour) ; pour les lanceurs de sorts DD et emplacements ; plus la ressource sans laquelle la classe ne se joue pas. Perception passive et Taille restent au choix (la passive est surtout utilisée par le MJ, la taille rarement).

| Classe | Obligatoires de classe | Défaut confortable |
|---|---|---|
| Barbare | Rage | Athlétisme, Perception passive, Dés de vie |
| Barde | DD, emplacements, Inspiration bardique | Persuasion, Perception passive, Intuition passive |
| Clerc | DD, emplacements, Conduit divin | Perception passive, Intuition passive, Médecine |
| Druide | DD, emplacements, Forme sauvage | Perception passive, Nature, Survie |
| Ensorceleur | DD, emplacements, Points de sorcellerie | Perception passive, Persuasion, Arcanes |
| Guerrier | Second souffle, Sursaut d'action | Athlétisme, Perception passive, Dés de vie |
| Magicien | DD, emplacements | Arcanes, Investigation passive, Restauration arcanique |
| Moine | Points de Focus | Acrobaties, Discrétion, Perception passive |
| Occultiste | DD, pacte | Rouerie magique, Perception passive, Arcanes |
| Paladin | DD, emplacements, Imposition des mains | Conduit divin, Perception passive, Athlétisme |
| Rôdeur | DD, emplacements | Ennemi juré, Discrétion, Perception passive |
| Roublard | (aucune) | Attaque sournoise, Discrétion, Perception passive |

Libellés à reprendre exactement de l'appli au moment du développement. Multiclasse : obligatoires additionnées (DD et emplacements une seule fois), défaut de la classe principale. Classes hors SRD : obligatoires communes + DD et emplacements si lanceur, défaut tiré de leurs ressources.

**Problème ouvert : le quota.** Avec 6 tuiles (2 rangées de 3 sur iPhone), Paladin, Clerc, Druide, Barde et Ensorceleur auraient déjà 6 obligatoires et aucune place libre. Pistes (à trancher avec une maquette en largeur iPhone) :
1. Tuile **« Magie » combinée** (DD + pastilles d'emplacements) : 5 obligatoires au plus, au moins 1 place libre. Piste préférée par Claude.
2. Tuiles compactes (4 par rangée sur iPhone pour les valeurs courtes : 8 tuiles sur 2 rangées).
3. Retirer la Vitesse des obligatoires (moins bonne option).

Avec la piste 1 et un quota de 6 : Roublard 3 obligatoires / 3 libres ; Magicien, Occultiste, Rôdeur 4 / 2 ; Barbare, Moine 4 / 2 ; Guerrier 5 / 1 ; Paladin, Clerc, Druide, Barde, Ensorceleur 5 / 1.

## 16. Chantier à venir : onglet « Feuille » (ex-onglet « Jeu »)

Décisions d'Angle (10 nov. 2026). Chantier prévu plus tard ; rien n'est codé.

- **Un seul écran de jeu : « À la table ».** L'onglet « Jeu » ne sert plus à jouer. Il devient **« Feuille »** : toute la fiche de personnage au même endroit, comme une feuille de perso papier ou la plupart des applis.
- **Lecture seule.** On retire tout ce qui agit : Dégâts, Soins, +/− des PV temporaires, lancers de dés, dépenses de ressources.
- **Tout ce qui informe reste** : bulles de règles, descriptions, liens AideDD.
- **Valeurs exactes en temps réel** : PV, emplacements et ressources restants, états, concentration. Les effets des états sont **signalés** (ex. « désavantage aux jets d'attaque et aux tests (Empoisonné) »), avec la même logique que « À la table » (`condAdvice`).
- **Les modifications restent dans « Construction »** (inchangé).
- Conséquence pour le lot 2 : l'en-tête d'« À la table » n'a pas à reprendre la fiche ; il est pensé uniquement pour jouer.

