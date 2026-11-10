Passation — appli « D&D Compagnon » (fiche de perso dynamique)

À lire au démarrage d'une nouvelle discussion. État au 6 novembre 2026, artefact version 116.

Où sont les choses
> Document historique Claude. Pour la construction et les tests actuels, suivre `LISEZMOI.md` ; les instructions de build ci-dessous sont obsolètes.

Artefact (version publiée) : https://claude.ai/artifact/StZK93cX5zFvqDhjF5D62G — propriétaire Angle. C'est ce que les joueurs utilisent : un fichier unique.
Sources (depuis le 6 nov. 2026) : documents app/… de ce projet. Lire d'abord app/LISEZMOI.md : contenu, et la marche à suivre pour récupérer, assembler (app/build.py), tester (app/tests/run.js, 19 tests) et publier.
app/shell.html, app/styles.css, app/theme.css (thème Dark Fantasy, sombre par défaut + mode clair), app/js/01-base.js … app/js/11-evenements.js (concaténés dans l'ordre, même portée globale), app/outils/ (régénération du catalogue).
Les gros blocs de données (srd-data ~1 Mo, hb-cat ~100 Ko) ne sont pas dans le projet : build.py les reprend de la page publiée (Artifact read avec path: "index.html").
Avant de modifier : python3 build.py --base base.html --check doit dire « Identique au fichier de base ». Version 116 publiée depuis ces sources.
Réécrire les modules modifiés dans le projet en fin de session seulement (project_write avec local_path en chemin absolu).
Capacités de l'artefact (republier sans capabilities pour les conserver) : db (règle exemples read/write owner), downloads, user, sample, mcp → host:claude_browser avec preview_start, get_page_text, tabs_close. Depuis une session cloud on ne peut PAS ajouter d'autres outils au serveur host (ex. request_access refusé).
Données : data/users/<uid>/ (privé par utilisateur), lisible/écrivable avec ArtifactData (data/users/me). Une fiche est limitée à 256 Ko.
Persos : perso_cornelius (Occultiste 3, Protecteur céleste, Humain, historique Médecin), perso_vvofmqf02c3j (Garrant, Aasimar Paladin 3, Serment de dévotion, Soldat, joueur Seb).
Hors SRD (type:"hb") : h_agathys, h_guerisseur, h_robuste, h_protecteur, h_medecin, hb_crsbnkdcxnl1 (Aasimar, rempli par recherche web + effets), hb_m6495mrrhpfl (Traité de médecine).
Toujours écrire avec if_version ; ne jamais modifier les vraies fiches sans demande (tests sur copies locales).
Fichier autonome : dnd-compagnon.html (produit par build.py). Bouton « Enregistrer l'appli avec mes persos » pour l'embarquer. Le remplissage automatique n'y est pas (pas de Claude hors artefact).
Architecture (JS vanilla)
Rendu complet via render(), délégation sur data-act (clics) et handlers change/input (data-bind, data-hb, data-lu, data-w). Modales via renderModal() (priorité : S.rv relecture, S.catPick catalogue, S.af remplissage auto, puis S.pending). L'état S est une constante globale (pas window.S).
Données SRD 5.2.1 FR embarquées dans #srd-data ; index S.C / S.idx. clsOf(id) résout classes SRD et hors SRD (hbClass, id "hb:"+_id).
Calcul : derive(ch) → D (sources/effets, sorts, ressources D.res, D.always, CA, PV…). Effets hb : maitrise, sorts, ressource (max formule evalF, accepte niv>=3?1:0), reserve (dés), pvniv, guerisseur, etc.
Navigation : « À la table » et « Fiche de personnage » restent sur le perso affiché (S.cur) ; le perso principal (mainId()) n'est pris que si aucun perso n'est ouvert.
En-tête : marque, navigation, bouton « Menu » et, juste dessous (zone #hchar), le bouton « Mode clair / Mode sombre » (data-act="theme").
Thème : curTheme/applyTheme/setTheme (03-demarrage) ; data-theme sur <html> (« dark » par défaut, « light »), enregistré dans prefs.theme et localStorage (registre-theme). Dans theme.css, chaque couleur est une variable --df-<couleur sombre> définie dans un bloc sombre et un bloc clair ; retouches en fin de fichier.
Bandeau d'information setBanner(texte, clé) : croix bannerClose ; avec une clé, la fermeture est retenue (localStorage registre-banner-<clé>, clé local pour le message « Mode local »).
Vues : menu/liste, fiche (bandeau avec portrait ch.portrait en data URL WebP réduit sous 60 Ko, Classe/Espèce/Historique/Joueur·se ; onglets Jeu, Compétences, Sorts, Aptitudes, Inventaire, Notes, Construction), « À la table » (bandeau de stats avec bouclier de CA ; carte santé avec barre de PV, « PV max ± » à 0 sans bonus, dés de vie en simple affichage, et en pied Concentration, Inspiration héroïque et bouton Repos ; popup Repos : deux cartes séparées « Repos court » / « Repos long » puis le détail : restOpen, restKind, restLong, restShort ; tuiles « Jets et fiche » ; tour Action/Bonus/Réaction/Mouvement/Autre, carte Détails tCard), Contenu perso (éditeur hb), Grimoire. Croix de fermeture des popups et info-bulles agrandies (42 px).
Assistants : création (viewWizard, S.W, 8 étapes) ; montée de niveau (levelPlan/lvlModal/lvlApply, enchaînement via S.lvlTarget). Pendant l'enchaînement de création, la popup de niveau ne se ferme plus par un clic à côté ; « Arrêter ici » demande confirmation (lvlStop / lvlStopNo / lvlStopYes) et affiche « Création du personnage · niveau X sur Y ».
Remplissage auto (afRun, afNear, afWeb, afMem) : AideDD via navigateur de l'app → sinon page la plus proche (AIDE_IDX) → recherche web DuckDuckGo limitée à WEB_SITES (dndbeyond, dungeonmister, arcaneeye, dungeonsanddragonsfan, theroleplayersguild ; wikidot exclu) → mode mémoire (sample seul, marqué « à vérifier »). La lecture web ne marche que pour le propriétaire, dans l'app Claude ordinateur ; les sites ont été autorisés dans son navigateur.
Onglets : afTab(r) lit l'identifiant quelle que soit la forme de la réponse ; afCloseTab attend la fermeture et signale un échec dans S.afTabNote. Format réel : preview_start répond « Opened <url> in the browser pane (tabId seed). … » ; quand le volet n'a qu'un onglet, il réutilise l'id seed.
Page à ancre (#, sous-classes et historiques d'AideDD) : lecture jusqu'à 200 000 caractères, puis afSection garde la section de l'élément.
Catalogue hors SRD (v113) : S.CAT (432 entrées, règles 2024) = noms, livre, lien et faits mécaniques seulement (aucun texte de règles). Champs : id, k (classe, sous-classe, historique, espece, don, sort), n, vo, b, u ; sous-classe c (classe parente) ; historique ab, sk, tools, feat, featRef ; don cat, pre, lv ; sort lv, ec, cl, ct, conc, rit.
Sources : Manuel des joueurs 2024 en français depuis AideDD (36 sous-classes, 12 historiques, 58 dons, 52 sorts) ; suppléments en VO depuis les listes publiques de D&D Beyond (Heroes of Faerûn, Astarion's Book of Hungers, Lorwyn, Eberron: Forge of the Artificer avec l'Artificier, Ravenloft: The Horrors Within, Arcana Unleashed). Pas d'espèces dans Heroes of Faerûn ; les sorts de Ravenloft sont des rééditions du Manuel (exclus) ; World of Warcraft (17 nov. 2026) et les « Drops » D&D Beyond ne sont pas inclus.
Les classes des sorts des suppléments ne sont pas publiques (pages payantes) : ces sorts n'apparaissent pas dans les listes par classe, seulement dans le catalogue de Contenu perso (sauf Homunculus Servant → Artificier).
Valeur d'option cat:<id> ; catMat crée la fiche hb (catId, pending:true, lien, faits) au moment du choix ; catRes est appelé dans le gestionnaire change (toutes les listes, sauf addFeatSel résolu au clic « Ajouter ») et dans wpick. catHb évite les doublons (même catId ou même nom normalisé). Fiches hb déjà présentes masquées : Protecteur céleste, Aasimar, Guérisseur, Robuste, Armure d'Agathys.
Branché dans : assistant (classe, historique avec don prérempli, espèce, don d'origine, sorts), montée de niveau (sous-classe par classe parente, dons généraux / faveurs épiques, style de combat, sorts via classSpells), Construction, et « Depuis le catalogue » dans Contenu perso (catPick).
Relecture (S.rv, rvStart/rvRun/rvFill/rvApply) : après la création (ou la fin de l'enchaînement de niveaux) et après une montée de niveau, liste les fiches pending utilisées par le perso ; « Remplir » enchaîne AideDD → web → mémoire pour chaque fiche, puis Valider / Laisser à remplir (pendingSkip) / Tout valider. Les fiches choisies puis abandonnées dans l'assistant sont supprimées (W.catMade).
Fait (principaux choix)

SRD + « Hors SRD » (badge, source/livre ou « Personnalisée », liens AideDD/références) ; À la table complète (concentration forcée, jets contre la mort, dés de vie, PV max, historique supprimable ligne par ligne, Perception passive) ; équipement avec silhouette et harmonisation ; objets magiques (+N, charges, objets multi-sorts) ; manifestations à choix/répétables, Frappe occulte ; classes hors SRD ; assistant de création (tableau standard / points avec compteur / 6 jets 3–18 avec équivalent en points, alignement 2 listes, création hors SRD en ligne) ; Châtiment divin + lancers gratuits génériques (« toujours préparé ») ; Style de combat (montée de niveau + Guerrier niv. 1).

v112 : montée de niveau de la création protégée ; fermeture des onglets du navigateur fiabilisée et signalée en cas d'échec.
v113 : catalogue hors SRD des règles 2024 + écran de relecture qui remplit en lot (choix d'Angle : tout ce qui suit les règles 2024, sorts inclus, remplissage à la création).
6 nov. 2026 : découpage en modules (sources dans ce projet, choix d'Angle ; pas de GitHub pour l'instant), script d'assemblage et tests automatiques. Aucun changement de comportement.
v114 : refonte Dark Fantasy proposée par Angle (bandeau du perso avec portrait, À la table redessiné), mode clair au choix, alignement d'À la table corrigé, PV temporaires réorganisés sur téléphone.
v115 : bouton de thème sous « Menu », nom du perso retiré de l'en-tête, « PV max ± » à 0, message « Mode local » fermable par une croix (fermeture retenue), croix des popups plus grandes.
v116 : navigation qui reste sur le perso affiché (bug « revient au premier perso »), dés de vie non cliquables, bouton Repos à côté d'Inspiration héroïque (plus de tuile), popup Repos en deux cartes séparées.
Règles de travail d'Angle
Quand il pose une question : répondre et proposer, ne rien modifier sans son feu vert.
Libellés exacts des objets ; popups plutôt que listes dépliantes ; clics qui sélectionnent (pas d'info-bulle qui gêne).
Hors SRD : mécanique + résumé avec mes propres mots + lien ; jamais de copier-coller d'AideDD ou d'autres sites. Pas de « (mes mots) » dans les textes.
Publier l'artefact et renvoyer le fichier autonome après chaque changement validé ; ajouter un test pour chaque correction ou nouvelle fonction.
À faire (ordre proposé)
Essai réel du catalogue dans l'app Claude ordinateur : créer un perso avec un historique, un don et une sous-classe du catalogue, lancer « Remplir », vérifier les résumés et la fermeture des onglets. Vérifier aussi l'ajout d'un vrai portrait et sa sauvegarde en ligne.
Pack de table : exporter le contenu hors SRD validé utilisé par les persos, pour que les potes l'importent.
Bottes d'arme : choix des armes maîtrisées (Paladin, Guerrier, Barbare, Rôdeur) au lieu d'afficher la botte partout.
Outils : demander l'outil au lieu de garder la phrase brute de l'historique.
Choix de traits d'espèce (lignage elfique, ascendance draconique…) dans l'assistant.
« Page la plus proche » : exclure les pages SRD pour un élément hors SRD.
Garrant : vérification en jeu (Imposition des mains, Conduit divin, Arme sacrée, Châtiment divin). Il doit encore choisir son Style de combat (Construction → Dons).
Baudoin, Gnome Roublard. 9. Mara, Humaine Paladin. 10. Yarjerit Dragnir, Drakéide Moine.
Partage avec les potes (mode mémoire pour eux) + mini guide d'utilisation.
(En pause) ménage du bandeau ; liens AideDD pour les éléments SRD ; ajout de World of Warcraft au catalogue après sa sortie, si voulu.
