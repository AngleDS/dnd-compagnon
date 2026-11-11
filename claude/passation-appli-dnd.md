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

Tests : `node tests/run.js dist/dnd-compagnon.html` (Playwright ; persos temporaires ; Claude et navigateur simulés). Un seul navigateur pour toute la suite, un contexte isolé par test (vérifié par les tests « Isolation »). Durée dans l'espace de Claude : environ 65 s pour 106 tests (81 s avant le 10 nov. 2026). **Décision d'Angle (10 nov. 2026)** : pendant un lot, seulement les tests concernés (`--only`, environ 10 s) et un commit par sujet marqué « Tests ciblés » ; toute la suite une fois en fin de lot, obligatoire avant de rendre, publier ou passer la main (règle dans `AGENTS.md`). Sans carte graphique, chaque mouvement de souris simulé coûte une image (environ 80 ms) : limiter les `steps` des glisser et ne jamais laisser un clic attendre un élément absent (8 s perdues par attente). Playwright n'est pas installé sur le Mac : Claude lance la suite dans son espace de travail, sur le `dist/dnd-compagnon.html` construit par le Mac.

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
- Vues : menu/liste ; fiche (bandeau avec portrait, onglets Jeu, Compétences, Sorts, Aptitudes, Inventaire, Notes, Construction) ; « À la table » ; « Mes contenus » (vue `hb`, éditeur hors SRD, ex-« Contenu perso ») ; « Catalogue » (vue `comp`, SRD, ex-« Grimoire »).
- « À la table » : bandeau de stats avec bouclier de CA ; carte santé (barre de PV, « PV max ± », dés de vie en affichage, Concentration, Inspiration héroïque, bouton Repos) ; popup Repos en deux cartes (`restOpen`, `restKind`, `restLong`, `restShort`) ; tour Action / Bonus / Réaction / Mouvement / Autre ; carte Détails `tCard`.
- Assistants : création (`viewWizard`, `S.W`, 8 étapes) ; montée de niveau (`levelPlan` / `lvlModal` / `lvlApply`, enchaînement via `S.lvlTarget`, « Arrêter ici » confirmé par `lvlStop` / `lvlStopNo` / `lvlStopYes`).

## 5. Plateforme et Claude

- `js/02-plateforme.js` expose `PLATFORM` : utilisateur, base de données, génération, navigateur Claude, téléchargement. Aucun autre module n'appelle `window.claude`.
- Sans pont Claude : l'appli démarre en mode local, les persos sont dans le navigateur, les catalogues sont disponibles, les fonctions de jeu marchent.
- Artefact publié : https://claude.ai/artifact/StZK93cX5zFvqDhjF5D62G (propriétaire : Angle), dernière version publiée v146 (11 nov. 2026). Données en ligne par utilisateur (`data/users/<uid>/`, fiche limitée à 256 Ko), lisibles et modifiables par Claude avec `ArtifactData` (toujours avec `if_version`).
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
- v123 (10 nov. 2026, fichier construit au commit `bb583c3`) : lot 1. Onglets de la fiche défilants sur iPhone (plus de chevauchement), valeurs de la fiche visibles en dés physiques, recherche « Jet, action, sort… », fondu en bas des popups qui continuent, retour à la liste après import, « Catalogue » et « Mes contenus ». Vérifiée avec une copie en lecture seule des vraies données avant et après publication (dés physiques et virtuels) : calculs de Cornelius identiques à la v122, aucune écriture, aucune erreur ; seules différences attendues : plus de texte dans Jeu, Compétences et Sorts en dés physiques (valeurs réapparues), nom « Mes contenus ». Capacités conservées.
- v124 (10 nov. 2026, fichier construit au commit `646a6ee`) : « À la table » en blocs ordonnés par perso et mode disposition verrouillé (étapes 1 et 2 des tuiles). Vérifiée avec une copie en lecture seule des vraies données avant et après publication (dés physiques et virtuels) : calculs identiques à la v123, aucune écriture, aucune erreur ; seule différence attendue : le bouton « Modifier la disposition ». Capacités conservées.
- v125 (10 nov. 2026, fichier construit au commit `a3d328d`) : Repères en grille de 8 tuiles (étape 3), glisser d'un bloc par n'importe où à la souris. Vérifiée avec une copie en lecture seule des vraies données avant et après publication (dés physiques et virtuels) : calculs identiques à la v124, aucune écriture, aucune erreur. Capacités conservées. **Prochaine étape : 4 (bloc Raccourcis). Tuiles par défaut choisies par Angle : « Tests de caractéristique », « Jets de sauvegarde », « États », « Inventaire », « Équipement » et une case vide**, affichée comme un « + » dans un cadre en pointillés (idée d'Angle, aussi pour la case vide des Repères ; le « + » ajoutera une tuile une fois « Personnaliser » fait) (popups existantes, rien à créer ; Attaques, Sorts et Ressources resteront des tuiles proposées dans « Personnaliser », étape 5).
- v126 (10 nov. 2026, fichier construit au commit `27df194`) : bloc Raccourcis (5 tuiles et case libre « + »), « + » dans la case vide des Repères (étape 4). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v125, aucune écriture, aucune erreur. Capacités conservées.
- v146 (11 nov. 2026, fichier construit au commit `4349425`) : bloc Ressources (T3b). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v145 (seule la vue « À la table » change), aucune écriture, aucune erreur. Capacités conservées. PWA GitHub toujours en v138. À la demande d'Angle, ajout d'un perso de démonstration dans ses données en ligne : `perso_1kmdwarylsk9`, Séraphine Valdor, Paladine drakéide niv. 6, Serment de Dévotion (emplacements classiques, Repères complets, Ressources, armure + bouclier) ; style de combat et bottes d'arme non choisis ; Cornelius non touché.
- v145 (11 nov. 2026, fichier construit au commit `28c8663`) : explication de chaque tuile de valeur, icônes, fenêtre Vitesse ; vitesse du Moine et du Barbare. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v144, aucune écriture, aucune erreur. Capacités conservées. PWA GitHub toujours en v138.
- v144 (11 nov. 2026, fichier construit au commit `82e1292`) : Repères immuable et sur mesure (lot T3a), Guerrier 3 et 4 attaques aux niveaux 11 et 20. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v143 (seule la vue « À la table » change), aucune écriture, aucune erreur. Capacités conservées. PWA GitHub toujours en v138.
- v143 (11 nov. 2026, fichier construit au commit `1c6e1a8`) : tuiles, lot T2 (Inspiration en tuile, Concentration, Épuisement, Recherche, bloc Notes en tuiles). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v142 (seule la vue « À la table » change), aucune écriture, aucune erreur. Capacités conservées. PWA GitHub toujours en v138.
- v142 (11 nov. 2026, fichier construit au commit `f229872`) : défilement allégé pour Safari. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v141, aucune écriture, aucune erreur. Capacités conservées. PWA GitHub toujours en v138.
- v141 (11 nov. 2026, fichier construit au commit `2c71364`) : « Ce tour » non personnalisable, dégradé sur les tuiles cliquables dans les deux modes. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v140, aucune écriture, aucune erreur. Capacités conservées. PWA GitHub toujours en v138.
- v140 (11 nov. 2026, fichier construit au commit `1695609`) : tuiles, lot T1. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v139, aucune écriture, aucune erreur. Capacités conservées. PWA GitHub toujours en v138.
- v139 (11 nov. 2026, fichier construit au commit `f16db51`) : appui long au doigt pour tout glisser, actions et confirmation en tête de la fenêtre d'un bloc. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v138, aucune écriture, aucune erreur. Capacités conservées. **La PWA GitHub reste en v138** (choix d'Angle).
- v138 (11 nov. 2026, fichier construit au commit `58b8320`) : Menu en liste déroulante (personnages, mode clair, dés virtuels, ajouter un bloc, disposition), en-tête iPhone sur 2 lignes, jour de l'historique en vert. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v137, aucune écriture, aucune erreur ; seuls les textes de l'en-tête et du bandeau disparu changent. Capacités conservées.
- v137 (11 nov. 2026, fichier construit au commit `ef6a0f4`) : gestion des blocs depuis le bloc (crayon, supprimer, remettre, bandeau du haut). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v136, aucune écriture, aucune erreur ; seuls les titres d'« À la table » changent. Capacités conservées.
- v136 (11 nov. 2026, fichier construit au commit `c7d8c88`) : corrections demandées par Angle — PV temp. et PV max ± dans la même fenêtre (`pvPop`, `hpMaxAdd`) avec icône clavier qui ouvre le pavé numérique (`openDicePad(cible,true)`, même en dés virtuels ; touche ± pour un malus) ; « i » toujours en bout de ligne (listes `.trow` sur ordinateur, fenêtre des États en 2 colonnes `.condgrid`) ; « Changer de format » d'un bloc personnalisé (`blkfmt:`, `blkFormat`, `cReformat` : les tuiles qui ne tiennent plus retournent dans la réserve) ; modèles limités à 8 cases (12 modèles, `BLK_TPL`) ; « Annuler » du pavé à taille normale. Décision d'Angle : on garde le « i » (pas le mot en pointillé) dans les lignes, parce que la ligne entière ouvre la carte. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v135, aucune écriture, aucune erreur. Capacités conservées.
- v135 (11 nov. 2026, fichier construit au commit `26795ba`) : états actifs sous la barre de PV, bloc séparé supprimé. Vérifiée avant et après publication avec une copie en lecture seule des vraies données (aucun état actif) : résultats identiques à la v134, aucune écriture, aucune erreur. Capacités conservées.
- v134 (11 nov. 2026, fichier construit au commit `3af3cb0`) : carte PV avec emplacements qui s'adaptent au perso, PV temp. alignés, Repos en 4e colonne ; bloc « États actifs » provisoire. Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v133, aucune écriture, aucune erreur ; seuls les titres d'« À la table » changent. Capacités conservées.
- v133 (10 nov. 2026) : **retour à la v131 à la demande d'Angle** (fichier identique octet pour octet). La v132 (bloc « Emplacements et états » en bloc à tuiles, commit `c3e581d`) est annulée par `git revert` (`7aabf00`, `d193ebb`) ; aucune donnée ne contenait `layout.res`. Le bloc « Emplacements et états » reste provisoire. Raison donnée par Angle : c'est le fait que ce soit **un bloc séparé** qui ne lui convient pas ; il va repenser la question (ne rien coder avant sa décision).
- **Décision d'Angle (11 nov. 2026) : emplacements dans la carte PV, hauteur qui s'adapte** (maquette validée, pas encore codée) : rangée « Emplacements de sorts » entre les dés de vie et Concentration / Inspiration / Repos, visible seulement si le perso a des emplacements (30 % des combinaisons classe, sous-classe et niveau n'en ont jamais, calcul sur le Manuel 2024) ; une pastille par niveau de sort « numéro + ronds » (4 ronds au plus), largeur fixe, 3 par ligne sur iPhone, pacte dans une pastille dorée à part ; de 0 à 4 lignes (pire cas : magicien 18 / occultiste 2, 9 niveaux + pacte, 22 emplacements). **On garde le cadenas** pour modifier les ronds. **Codé le 11 nov. 2026 (commit `3af3cb0`, publié en v134)** : rangée `slotsRow` (`.hslots`, `.hs`, styles en fin de `theme.css`) ; PV temp. sans + et − (« PV temp. », popup `hptemp` : ±1, +5, +10, saisie `data-tmpset`, remise à zéro) ; trois valeurs alignées ; Repos en 4e colonne (titre + icône, `.health-rest`), retiré du pied de carte ; ordinateur : grille 2×2 pour ces quatre éléments. Le bloc `res` ne garde que les états actifs (libellé « États actifs ») **en attendant la décision d'Angle sur les états**.
- **Décision d'Angle (11 nov. 2026) : états actifs dans la carte PV, option 3 de la maquette** : pastilles de tous les états actifs (et épuisement) sous la barre de PV, sur toute la largeur, visibles seulement s'il y a un état ; « un joueur a besoin de voir tous ses états » (pas de résumé « +N »). **Codé et publié en v135 (commit `26795ba`)** : `condRow` (`.hpconds`, `.hpcond`) dans `.table-hp-meter`, rangée entière = un bouton (44 px) qui ouvre la popup `cond` (règles par le bouton i) ; bloc `res` retiré de `TBLK`. **Le chantier « Emplacements et états » est clos.**
- **Gestion des blocs depuis le bloc (corrections d'Angle, 11 nov. 2026, commit `ef6a0f4`, publié en v137)** : crayon toujours visible sur chaque bloc sauf Personnage et Points de vie (`BLK_FIXED`) ; fenêtre « Bloc : … » = tuiles (blocs à tuiles), format et nom (blocs créés), Monter / Descendre, Supprimer avec confirmation (`blkActions`) ; fenêtre `blk:<id>` pour Recherche, Ce tour, Notes. Blocs livrés retirés dans `ch.layout.hidden` (vérifié à l'import), remis par « Ajouter un bloc » (`blkRestore`). Bandeau en haut d'« À la table » (`.ttopbar`) : « Dés : physiques / virtuels », « + Ajouter un bloc », « Disposition » ; bouton du bas supprimé (décision d'Angle) ; récupération des charges hors du bloc Notes (`.tcharges`). **Recherche, Ce tour et Notes deviendront des tuiles** (décision d'Angle, à faire).
- **Retours d'Angle (11 nov. 2026, publié en v139, PWA non mise à jour)** : au doigt, **appui long pour toutes les fonctions de glisser-déposer** (tuiles, blocs, équipement ; `LONG_PRESS_MS` = 350 ms) — un glisser rapide fait défiler ; dans la fenêtre d'un bloc, les actions (Monter, Descendre, Tuiles par défaut / Format, Supprimer) et la **confirmation de suppression sont en tête**. À corriger plus tard : le bandeau du mode local renvoie vers « Télécharger ma copie personnelle » dans le Menu, alors que le bouton est sur la page Mes personnages.
- **Catalogue des tuiles validé (11 nov. 2026)** : `claude/catalogue-tuiles-2024.md` (164 tuiles, formats, éligibilité par bloc, tuiles dynamiques, tuiles maison ; décisions d'Angle en section 6 bis : Inspiration, Concentration et Repos en tuiles, format 1×2 et bandeau 2 lignes, montée de niveau = tuile signalée jamais placée d'office, VF officielle 2024 pour les noms, tuiles bascule / effets en cours / multiclasse plus tard). **Prochain chantier : implémenter les tuiles dans les fenêtres actuelles**, puis le menu de personnalisation dédié. Remplace `claude/referentiel-tuiles.md` pour le catalogue.
- **Décisions d'Angle pour T2 (11 nov. 2026)** : carte PV inchangée (Concentration toujours affichée, même sans sort ; Repos, épuisement, PV temp., PV max, dés de vie y restent), ces éléments existent aussi en tuiles ; **seule Inspiration héroïque sort de la carte** et devient une tuile, placée par défaut dans la 6ᵉ case des Raccourcis. Pas de bloc « En jeu ». Tuile Recherche : **une seule ligne de haut**, 1, 2 ou 4 colonnes de large (1×1 = loupe ; plus large = barre), résultats dans une liste déroulante ; bloc livré « Recherche » qui contient cette tuile, même place. Bloc livré « Notes » avec les tuiles Notes et Historique. Ordre des blocs inchangé. Contrôle de lisibilité à 375 points dans T2.
- **Lot T2 des tuiles (11 nov. 2026, publié en v143)** : `TILE_GEN` (insp, conc, exh, search), rendus étroits (`repTileMap`) et larges (`racTileMap`) ; dans un bloc créé, une tuile générale en case ≥ 170 px prend sa forme large ; `tileSizeOk` (Recherche `h1` : une ligne de haut) ; `searchBar()` + liste déroulante `.tresdrop` (une seule barre par écran, `S.T._tq`), action `tsearch` ; Inspiration : `RACC_DEFAUT`, `inspPlaced`, `seeInsp`, `ch.layout.inspSeen` ; bloc Notes en tuiles ; test 375 points. **Reportés à T3** : DD des aptitudes (calcul propre à chaque classe) et autres valeurs de classe.
- **Décision Repères (11 nov. 2026)** : Repères redevient immuable et sur mesure (calculé selon classe, sous-classe, espèce, dons ; déplaçable seulement), 4 colonnes à hauteur variable (2 à 3 rangées) ; ressources à dépenser dans un bloc « Ressources » séparé, sur mesure (lot T3). Détail : `catalogue-tuiles-2024.md`, section 6 bis.
- **Lot T3a (11 nov. 2026, publié en v144)** : `repWants`/`reperesAuto` (4 communes CA, Initiative, Vitesse, Perception passive + 4 propres au plus, dans cet ordre : valeur de classe — Dégâts de rage, Dé bardique, Arts martiaux + DD du Credo, Attaque sournoise + DD Frappe malicieuse, Critique du Champion —, DD et attaque de sort, Attaques par action si > 1, Aura de protection, DD du souffle drakéide) ; rangées équilibrées sur une grille de 12 (`.rtiles.rauto`), sans case vide ; `BLK_KEEP` (Repères ni supprimable ni personnalisable ; un ancien masquage est ignoré) ; `tiles:reperes` renvoie à `blk:reperes` ; ancien `ch.layout.tiles.reperes` ignoré, pas effacé, sauf l'Inspiration qui passe dans les Raccourcis (`inspInRep`) ; tuiles de classe proposées ailleurs seulement si le perso y a droit. **Correction** : le Guerrier SRD comptait 2 attaques au lieu de 3 (niv. 11) et 4 (niv. 20), aptitudes nommées « Double/Triple attaque supplémentaire ».
- **Lot « Explications et icônes » (11 nov. 2026, publié en v145 ; décision d'Angle, avant T3b)** : toute tuile de valeur est un bouton `.rinfo` qui ouvre `info:<id>` (`infoData`/`infoPop` : sens de la valeur + calcul ligne par ligne + total), sans liseré ni dégradé ; liseré et dégradé réservés aux fenêtres où l'on agit (Initiative, Vitesse, Inspiration, Concentration, Raccourcis…). Petite icône dorée au-dessus du chiffre (`REP_ICON`, `.rico`, variante A). `derive` fournit `D.acParts` et `D.speedParts`. Vitesse : fenêtre `speed` (calcul, autres déplacements `ch.speeds` = escalade, nage, vol, fouissement au pas de 1,5 m, rappels de règles, sauts selon la Force) ; validé à l'import. **Corrections** : Moine (Déplacement sans armure, sans armure ni bouclier) et Barbare (Déplacement rapide au niveau 5, hors armure lourde) n'avaient pas leur bonus de vitesse. Classe CSS `.texpl` (`.tinfo` est déjà le bouton « i »). Bloc Ressources (T3b) : sous la carte PV (choix d'Angle).
- **Lot T3b (11 nov. 2026, publié en v146)** : bloc « Ressources » (`resBlock`), une tuile par entrée de `D.res`, 2 par rangée (la dernière seule prend la rangée) ; jusqu'à 8 : ronds à toucher (`pips`, convention habituelle : toucher le dernier rond plein en dépense un) ; au-delà : − / + (`resstep`) ; réserve de dés et Rouerie magique : bouton vers la fiche ; toucher le nom ouvre la fiche (`tsel`). Absent sans ressource. Dans `BLK_KEEP` (déplaçable seulement) ; placé sous PV, y compris dans un ordre déjà enregistré (`tableOrder`).
- **À faire plus tard (note d'Angle, 11 nov. 2026)** : repasser sur le design des tuiles les plus connues et utilisées (CA, Vitesse, etc.).
- **À faire plus tard (note d'Angle, 11 nov. 2026)** : réduire le nombre de touchers pour les actions, actions bonus et réactions ; pouvoir toucher directement les valeurs « Toucher » et « Dégâts » pour lancer le jet.
- **Défilement Safari (11 nov. 2026, commit `f229872`, publié en v142)** : saccades en haut et en bas de page signalées par Angle ; fond déplacé sur une couche fixe composée (`body::after`), flou de l'en-tête et des onglets retiré, en-tête opaque. **Confirmé fluide par Angle sur Safari (11 nov. 2026).**
- **Note d'Angle (11 nov. 2026) pour l'étape deux colonnes** : pouvoir mettre **deux blocs côte à côte** (par exemple deux blocs 2×2) quand la page sera scindée en deux colonnes.
- **Notes d'Angle pour plus tard (11 nov. 2026)** : proposer plusieurs **« skins » par classe**, chacun avec son mode clair et son mode sombre (ou un mode par défaut) ; pour la personnalisation d'« À la table », chaque classe aura un bouton **« Automatique (recommandé) »** qui compose le meilleur écran possible, avec toutes les caractéristiques nécessaires au perso. Tuiles cliquables : liseré doré **et dégradé dans les deux modes**, tuiles d'information unies (fait le 11 nov.).
- **Lot T1 des tuiles (11 nov. 2026, publié en v140)** : `TILE_META` (gabarit, largeur minimale É/M/L/P, action, `only`), `cellW` (largeur réelle des cases), `tileOkInBlk`, `fitSize`, `cFreeSpot`, tailles `TILE_SIZES` (1×1, 1×2 = `12`, 2×2, ligne `l`, bandeau `b`) ; réserve commune, tuiles non éligibles **grisées et barrées** (décision d'Angle) avec la raison ; Raccourcis acceptent les tuiles de valeur ; liseré doré `.tact` / `.tpbtn`. **Décision d'Angle : la largeur des cases se calcule sur un iPhone de référence de 390 points (mêmes tuiles proposées sur tous les appareils) ; ajouter dans T2 un contrôle de lisibilité à 375 points (SE, mini) ; le SE de 1re génération (320) est hors cible.** Prochain : T2 (tuiles générales : Inspiration, Concentration, Repos, Épuisement en tuiles ; carte PV allégée ; Recherche, Notes, Historique en tuiles). **« Ce tour » ne sera jamais une tuile (décision d'Angle) : bloc non personnalisable, seulement déplaçable et supprimable.**
- **Audit UX de ChatGPT (11 nov. 2026), discuté, rien n'est validé ni codé.** Réponses d'Angle : ordre par défaut d'« À la table » — pas le sujet du moment ; **idée d'Angle : à terme, « À la table » immuable (aucune modification possible depuis l'écran de jeu), la personnalisation se fait dans un menu à part dédié** ; libellés d'icônes (cadenas…) — à réfléchir ; **oui au liseré doré pour les tuiles qui ouvrent une action** ; ordinateur en deux colonnes — en temps voulu. Prochain chantier : les tuiles.
- **PWA (11 nov. 2026, demande d'Angle)** : dépôt public `AngleDS/dnd-compagnon` (GitHub Pages, PWA préparée le 9 nov. : `manifest.webmanifest`, `sw.js`, `pwa.js`, `icons/`, `fonts/`). Mise à jour préparée vers la v138 : `index.html` = `dist/index.html` + données intégrées dans `#seed-docs` (Cornelius et contenu perso, **choix d'Angle : garder Cornelius intégré**, visible par quiconque a l'adresse) + polices locales `fonts/fonts.css` + balises PWA + `pwa.js` ; `sw.js` : nouvelle version de cache et polices mises en cache. Script : `outils`-like, régénérable (voir conversation). Fichiers prêts dans `dist/pwa/` (index.html, sw.js). **Envoyée sur GitHub le 11 nov. 2026** (commit `37db7c1` sur `main`, après installation de l'appli GitHub de Claude par Angle). Pour une mise à jour : régénérer `index.html` (dist + `#seed-docs` + polices locales + balises PWA + `pwa.js`) et changer la version `CACHE` de `sw.js`. Les sources ne sont pas sauvegardées sur GitHub (choix d'Angle). Sur Pages, pas de Claude : mode local, données par appareil, pas d'IA ni de navigateur.
- **Menu en liste déroulante (décision d'Angle, 11 nov. 2026, publié en v138)** : Mes personnages, Mode clair, Dés virtuels, et dans « À la table » Ajouter un bloc, Disposition ; « d'autres trucs à venir » s'y ajouteront (réglages). Bandeau `.ttopbar` supprimé ; en-tête iPhone sur 2 lignes (onglets qui défilent).
- **Précisions d'Angle pour le catalogue des tuiles (11 nov. 2026)** : Inspiration héroïque deviendra une tuile ; le tableau doit donner pour chaque tuile ses **formats possibles** (certaines ne tiendront jamais en 1×1) ; en modifiant un bloc, seules les tuiles éligibles aux emplacements de ce bloc seront proposées, les autres affichées **barrées ou en rouge** (à décider) ; prévoir qu'un jour un menu (hors « À la table ») permette de **créer ses propres tuiles**. Recherche lancée par Claude (tableau à soumettre à Angle).
- **Note d'Angle pour plus tard (11 nov. 2026) : retravailler les tuiles.** Il en manque. Il faudra des **tuiles « dynamiques »**, proposées selon leur utilité pour le perso (exemple donné : Inspiration héroïque). Le catalogue des **Repères** ne propose pas tout non plus. Angle prévoit un gros travail de recherche (à partir du référentiel `claude/referentiel-tuiles.md` et des règles 2024). Rien n'est décidé ni codé. La carte PV dépend donc du perso : rangée présente ou non, pacte ou niveaux de sort, nombre de lignes ; recalculée à chaque affichage.
- v132 (10 nov. 2026, commit `c3e581d`, annulée par la v133) : bloc « Emplacements et états » en bloc à tuiles.
- v131 (10 nov. 2026, fichier construit au commit `c6d913e`) : blocs personnalisés à place exacte, au glisser-déposer (lot C). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v130, aucune écriture, aucune erreur. Capacités conservées.
- v130 (10 nov. 2026, fichier construit au commit `5aaab3f`) : tuiles au glisser-déposer et crayon sur les blocs (lot B). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : calculs identiques à la v129, aucune écriture, aucune erreur ; seul le texte d'« À la table » gagne le titre « Repères ». Capacités conservées.
- v129 (10 nov. 2026, fichier construit au commit `a0e94d0`) : glisser plus lisible (lot A). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v128, aucune écriture, aucune erreur. Capacités conservées.
- v128 (10 nov. 2026, fichier construit au commit `e2e55bf`) : blocs personnalisés (étape 6). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v127, aucune écriture, aucune erreur. Capacités conservées.
- v127 (10 nov. 2026, fichier construit au commit `a9a9661`) : « Personnaliser » les tuiles des Repères et des Raccourcis (étape 5). Vérifiée avant et après publication avec une copie en lecture seule des vraies données : résultats identiques à la v126, aucune écriture, aucune erreur. Capacités conservées.

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

**Lot 1 — Corrections sans décision : fait le 10 nov. 2026**, publié en v123 (suite complète 84/84 sur `bb583c3`).
- Onglets de la fiche sur iPhone : la largeur minimale de 44 px laissait les onglets se tasser et se chevaucher (effet du commit `82f0cbd`). Barre défilante, fondu sur le bord qui continue, onglet actif ramené dans la partie visible ; lignes de compétences à 44 px (zones de toucher qui débordaient). Nouveau test : aucun élément cliquable n'en recouvre un autre (`343b393`).
- Fiche en dés physiques : les valeurs écrites dans les boutons de lancer virtuel disparaissaient (initiative, modificateurs, sauvegardes, compétences, bonus d'attaque). Elles s'affichent comme du texte non cliquable (`29f5d17`).
- Recherche : « Jet, action, sort… » ; fondu en bas d'une popup qui continue (`c025595`).
- Import : retour à la liste des personnages avec le message « <nom> importé » (`cccc094`).
- Noms : « Catalogue » (ex-Grimoire) et « Mes contenus » (ex-Contenu perso), identifiants internes inchangés (`hb`, `comp`) (`bb583c3`).

**Lot 2 — En-tête d'« À la table » sur téléphone** (à redéfinir avec Angle avant tout code). « À la table » est le seul écran de jeu (section 16) : son en-tête est pensé uniquement pour jouer. Constat de l'audit : recherche à 870 px pour un écran de 844, rien du tour ni des jets visible sans défiler. Maquettes A (actuel), B (compact) et C (recherche collante) proposées le 10 nov. : **Angle n'est pas convaincu**. Point de départ suivant : ce qu'Angle veut voir en premier en ouvrant l'appli en pleine partie. Pistes plus franches à proposer : commandes en bas de l'écran, sous le pouce ; écran de jeu sans défilement, le reste en popups.

**Lot 3 — Tuiles personnalisables** (section 15), à concevoir avec l'en-tête du lot 2.

**Lot 4 — Onglet « Feuille »** (chantier prévu plus tard par Angle ; section 16).

**Idées notées par Angle (10 nov. 2026), à planifier** :
- **« À la table » : accès rapide aux jets et actions les plus utilisés.** Existe déjà en partie : `T.recent` (6 derniers éléments ouverts, `js/08-table.js`), mais par récence, pour la session seulement, non enregistré. Piste : classement par fréquence tiré de l'historique des jets (`rollLog`) et des cartes ouvertes, enregistré dans la fiche. Information factuelle, sans deviner d'intention.
- **« À la table » : plusieurs notes horodatées** au lieu de la zone unique « Notes de partie » (`sessionNotes`) : ajouter, lire, supprimer ; date et heure automatiques. Migration : l'ancienne note devient la première.
- **En-tête de l'appli** (remarque d'Angle, 10 nov. 2026) : dans « À la table », l'en-tête (marque, navigation, Menu) dépasse de la colonne des blocs ; à remanier : soit pleine largeur de la page, soit aligné sur la largeur des blocs.
- **Retravailler les popups** (demande d'Angle, 10 nov. 2026) : les rendre lisibles et harmonisées entre elles (Tests, Sauvegardes, États, Inventaire, Équipement, Repos, cartes Détails…) : même structure, mêmes tailles, mêmes boutons.
- **Interface en blocs à disposer soi-même** (plus tard, au-delà des tuiles) : chaque joueur place la barre de recherche, les blocs de tuiles et les autres blocs d'« À la table » où il le souhaite, à la manière de widgets.
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

**À essayer à la main dans l'artefact (v124)** : mode disposition au doigt sur iPhone (poignée, flèches, Terminé, ordre conservé après rechargement) ; onglets de la fiche au doigt sur iPhone, valeurs de la fiche en dés physiques, import d'un perso ; attaque et sort en vrais dés au pavé (une seule validation, Action consommée, une ligne d'historique), bouton i au doigt, recherche « empois » et « repos », mode virtuel, Action bonus, Réaction, annulation, Mouvement, Autre, Nouveau tour.

**Outillage (facultatif)** : si Codex travaille sur le Mac, installer Playwright sur macOS pour qu'il lance `tests/run.js` lui-même (commandes dans la conversation du 10 nov.) ; son navigateur intégré refuse `file://`, passer par `python3 -m http.server 8765` et `http://localhost:8765/dist/dnd-compagnon.html`.

## 15. Chantier à venir : tuiles personnalisables d'« À la table »

Idée d'Angle (10 nov. 2026). **Rien n'est codé ; tout ce qui n'est pas marqué « décidé » reste à valider avec Angle avant de développer.**

**Organisation de l'écran en blocs (décisions d'Angle, 10 nov. 2026)** : « À la table » est découpé en blocs que le joueur peut monter ou descendre par glisser-déposer (appui long au doigt) ; **ordre enregistré par perso** (il suit l'export). Blocs : 1) Bandeau personnage ; 2) **Repères** (2×4 tuiles de valeurs) ; 3) PV (carte santé) ; 4) Barre de recherche ; 5) **Ce tour** (bloc à part entière) ; 6) **Raccourcis** (2×6 tuiles : tuiles maîtresses, ressources, objets) ; 7) pied de page (notes, historique). **Un seul design responsive** (une colonne sur iPhone, deux sur iPad et ordinateur), pas d'interfaces séparées. **Emplacements de sorts en tuile** ; pour les lanceurs, piste d'Angle : tuiles ou blocs de tailles différentes (grille à définir), par exemple une « ligne » pleine largeur pour les emplacements.

**Maquette validée (10 nov. 2026, iPhone)** : Repères = 8 tuiles de valeurs (2 rangées de 4) ; **Raccourcis = 6 tuiles, 3 lignes de 2** (tuiles larges avec une information sous le nom, ex. « DD 13 · attaque +5 ») ; **bloc personnalisé** créé et nommé par l'utilisateur (absent par défaut), une ligne pleine largeur où il glisse la tuile de son choix, qui prend alors toute la largeur (ex. « Mes emplacements » avec la tuile Emplacements). Sur iPad, la carte PV écrasée en demi-colonne est **à revoir plus tard** (cause probable : la disposition en deux colonnes).

**Avancement (10 nov. 2026, publié en v124)** : étapes 1 et 2 faites, suite complète 87/87 sur `646a6ee`.
- Étape 1 (`9a8f922`) : `viewTable` renvoie des blocs (`TBLK`, `tableOrder`, `tableBlocks` dans `js/08-table.js`) ; ordre dans `ch.layout.order` (vérifié à l'import) ; bloc vide masqué ; jets contre la mort dans le bloc Points de vie ; bloc temporaire « Emplacements et états » (rangée actuelle des emplacements et des états actifs, appelée à devenir des tuiles) ; une seule colonne à toutes les largeurs ; le bandeau du perso (`banner`, `js/06-fiche.js`) devient le bloc Personnage.
- Étape 2 (`646a6ee`) : mode disposition `S.layoutEdit` (non enregistré), actions `layoutEdit`, `layoutDone`, `layoutReset`, `blkMove` ; glisser par la poignée `[data-blkgrip]` (bloc `BLKD` en fin de `js/11-evenements.js`), sans appui long puisque le mode est verrouillé ; place calculée d'après la hauteur du doigt (le bandeau collé du mode recouvrait le haut de l'écran).

- Étape 3 (publiée en v125) : bloc Repères en grille 2×4 (`REPERES_DEFAUT`, `reperesTiles` dans `js/08-table.js`, styles `.rtiles` / `.rtile`) : CA, Initiative (ouvre le jet), Vitesse, DD des sorts, Perception passive, Maîtrise, Attaques par action, Taille. **Sans sorts, la case du DD reste vide** (décision d'Angle). Les emplacements de pacte rejoignent le bloc « Emplacements et états ». Le choix des tuiles viendra avec « Personnaliser » (étape 5). Angle préfère avancer dans l'ordre des étapes (3, puis 4…).

- Étape 4 (publiée en v126) : bloc Raccourcis (`.tpanels`, 3 lignes de 2) : Tests de caractéristique, Jets de sauvegarde, États, Inventaire, Équipement, chacun avec une information sous le nom (`.tpsub`), et une case libre « + » en pointillés (`.tplus`) ; même « + » pour la case vide des Repères. Le « + » ne fait encore rien : il ajoutera une tuile avec « Personnaliser » (étape 5). **Prochaine étape : 5.**

- Étape 5 (publiée en v127) : « Personnaliser » les blocs Repères (8 cases) et Raccourcis (6 cases). Catalogues `TILE_CAT` (Repères : + Attaque de sort, Intuition passive, Investigation passive, Dés de vie ; Raccourcis : + Repos, Historique des jets, Notes de partie) ; choix par perso dans `ch.layout.tiles` (vérifié à l'import) ; popup `tiles:<bloc>` ouverte par le bouton « Personnaliser » du mode disposition ou en touchant un « + » (case pré-sélectionnée) : monter, descendre, vider, ajouter, « Tuiles par défaut ». Sans sorts, DD et Attaque de sort comptent comme cases libres et ne sont pas proposés. Attaques, Sorts et Ressources (popups à créer) pas encore au catalogue. **Prochaine étape : 6 (blocs personnalisés).**
- Étape 6 (publiée en v128) : blocs personnalisés dans `ch.layout.custom` (`[{id:"c_…",name,r,c,tiles:[{id,sz}]}]`, vérifié à l'import, 20 blocs au plus). Mode disposition : « Ajouter un bloc » ouvre la popup `blkadd` (16 modèles) ; le bloc créé (« Mon bloc N », placé en bas) ouvre sa popup `tiles:c_…` : nom, tuiles (catalogues Repères + Raccourcis + Emplacements de sorts pour les lanceurs), taille de chaque tuile 1×1, 2×2 (si 2 colonnes ou plus) ou ligne entière, monter, descendre, retirer, supprimer le bloc avec confirmation. Placement automatique (`grid-auto-flow:dense`), cases restantes en « + ». Choix faits par Claude, à confirmer par Angle : tailles 1×1, 2×2 et ligne (pas de 1×2) ; placement automatique. **Prochaine étape : 7.**
- **Retours d'Angle après la v128 (10 nov. 2026), décidés, en trois lots** :
  - Lot A (publié en v129) : glisser un bloc = copie semi-transparente (`dragGhost`, `.dragghost`) qui suit le doigt ou la souris, emplacement d'arrivée en pointillés (`.blkph`, 64 px), autres blocs animés (`flipMove`), défilement automatique (`blkLoop`) ; Équipement : la carte elle-même suit le doigt (au-dessus du doigt au toucher) et la case visée s'allume.
  - Lot B (publié en v130 ; `tbHead`, `tileFace`, actions `tileCell` / `tileAdd` / `tileDel`, glisser `TDG` dans `js/11-evenements.js` ; « tileMove » supprimé) : petit crayon toujours visible dans un coin de chaque bloc à tuiles, qui ouvre sa personnalisation ; popup refaite au glisser-déposer : en haut le bloc avec ses vraies cases, en dessous une réserve de tuiles (icône et nom) ; réserve → case = poser, case → case = déplacer ou échanger, case → réserve ou hors du bloc = retirer ; plus de flèches ni de puces « + CA » ; « Tuiles par défaut », nom et suppression restent. Dans la popup, la tuile part dès qu'on la tire (pas d'appui long) ; un toucher simple affiche ses tailles.
  - Lot C (publié en v131 ; `cGrid`, `cMove`, `cResize`, `cUpdate`, `gridCellAt` ; toucher une tuile la sélectionne sans échange, l'échange se fait au glisser ; une tuile de la réserve remplace ce qu'elle recouvre) : blocs personnalisés, la tuile se pose exactement sur la case visée (position ligne et colonne enregistrée, plus de rangement automatique) ; taille 1×1, 2×2 ou ligne choisie en touchant la tuile posée ; message si la place manque ; conversion automatique des blocs v128.

**Étapes (validées par Angle)** :
1. Découper « À la table » en blocs (Personnage compact, Repères, PV, Recherche, Ce tour, Raccourcis, Notes et historique), sans changer les fonctions ; ordre enregistré dans la fiche du perso.
2. **Mode disposition verrouillé par défaut** (décision d'Angle, contre les fausses manipulations) : bouton « Modifier la disposition » (même principe que le cadenas de Construction) ; déverrouillé, les blocs montrent poignées et flèches monter / descendre, glisser-déposer (appui long au doigt, glisser direct à la souris, mécanique de l'équipement), ajout, suppression et choix des tuiles ; « Terminé » reverrouille. Verrouillé, rien ne bouge.
3. Bloc Repères : tuiles de valeurs du référentiel (Initiative ouvre le jet).
4. Bloc Raccourcis : tuiles maîtresses et leurs popups (Tests, Sauvegardes, États, Inventaire, Équipement existent ; Attaques, Sorts, Ressources à créer).
5. « Personnaliser » : choisir les tuiles de chaque bloc dans le référentiel.
6. Blocs personnalisés : créer, nommer, supprimer ; **toutes les tailles de 1×1 à 4×4** (lignes × colonnes ; 1×4 = ligne pleine largeur). **Grille où une tuile peut occuper plusieurs cases** (décision d'Angle, option « c » ; ex. dans un bloc 2×4, Emplacements sur une ligne entière et quatre petites tuiles dessous). Repères (2×4) et Raccourcis (3×2) sont deux blocs livrés par défaut du même système. **Création d'un bloc : une popup propose les modèles de taille au choix** (décision d'Angle) ; au doigt, on ne modifie jamais la taille d'un bloc, seulement ses tuiles et leur place. Propositions à valider : tailles de tuile proposées 1×1, 1×2, 2×2 et ligne entière ; placement automatique dans l'ordre choisi (les tuiles se rangent d'elles-mêmes en comblant les trous), plutôt qu'un placement libre case par case, plus délicat au doigt.
7. Plus tard : iPad et ordinateur en deux colonnes, carte PV adaptée.

**Référentiel des tuiles : `claude/referentiel-tuiles.md`** (10 nov. 2026, décidé avec Angle) : liste exhaustive à partir des règles 2024 ; **tuiles maîtresses** pour les jets (une tuile ouvre la popup des jets qui en dépendent), **Initiative** seule tuile de jet individuelle, Concentration et santé dans la carte PV. Les tuiles obligatoires, le défaut par classe et le quota ci-dessous sont **mis de côté pour le moment** (décision d'Angle) ; le catalogue proposé ci-dessous est remplacé par le référentiel.

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

