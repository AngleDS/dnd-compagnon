# Catalogue des tuiles D&D 2024 pour « À la table »

Document de recherche, 11 novembre 2026. Rien n'est codé ni décidé : c'est une base de travail pour Angle. Il complète le référentiel du 10 novembre (`referentiel-actuel.md`) sans le remplacer.

---

## 1. Résumé

- **164 tuiles** (170 lignes, dont 6 simples renvois) dans 11 familles : Défense et survie (7), Initiative-mouvement-corps (9), Sens et passifs (7), Tuiles maîtresses (9), Combat (9), Magie (9), Ressources de classe (76, une sous-section par classe), Espèces (12), Dons (11), Objets (9), Outils de table (12). Beaucoup de ressources de classe se ramènent à **8 gabarits** (valeur, compteur, réserve, dé, compteur+dé, bascule, maîtresse, texte), ce qui garde le code simple.
- **Manques principaux du référentiel** : Inspiration héroïque et Concentration en tuiles ; Attaque de sort (bonus) ; **DD d'aptitude** (souffle, manœuvres, Credo, Frappe malicieuse) et DD d'agrippement ; Épuisement ; Apnée ; **Compagnon** (PV du destrier, de la bête, du familier) ; **Forme active** (Forme sauvage, Rage active) ; Effets en cours (durées) ; Arcanum mystique ; Présage du Devin ; Rage implacable (DD qui monte) ; dés de ressource (supériorité, énergie psionique, arts martiaux, attaque sournoise) ; outils (Recherche, Ce tour, Notes, Historique, Repos, Aide-mémoire des actions).
- **Formats** : la largeur réelle d'une case va de 80 à 358 px ; l'éligibilité doit se calculer sur **la largeur réelle en pixels**, pas sur le nom du format. Chaque tuile déclare une largeur minimale (É, M, L ou P) et une hauteur (1 ou 2 lignes).
- **Recommandations clés** : ajouter le format **1×2** (le plus utile : donne 175 px dans un bloc de 4 colonnes) et le **bandeau 2 lignes** (2 × toutes les colonnes) ; le 2×1 est peu utile ; donner à chaque tuile un **nom court** (10 caractères au plus) pour les cases étroites ; un compteur passe en chiffres (« 2/5 ») dès qu'il n'a plus la place pour ses ronds.

---

## 2. Légende des formats

### 2.1 Largeurs réelles sur iPhone (390 px, 358 px utiles, espacement 8 px)

| Format (lignes × colonnes) | Bloc à 4 col. | 3 col. | 2 col. | 1 col. | Repères | Raccourcis |
|---|---|---|---|---|---|---|
| **1×1** (existe) | 84 px — É | 114 px — M | 175 px — L | 358 px — P | 80 px — É | 170 px — L |
| **1×2** (proposé) | 175 px — L | 236 px — L+ | 358 px — P | — | — | — |
| **2×1** (proposé) | 84 × 144 | 114 × 144 | 175 × 144 | 358 × 144 | — | — |
| **2×2** (existe) | 175 × 144 | 236 × 144 | 358 × 144 | — | — | — |
| **Ligne entière 1×N** (existe) | 358 px — P | 358 — P | 358 — P | 358 — P | — | — |
| **Bandeau 2×N** (proposé) | 358 × 144 | idem | idem | idem | — | — |

Hauteur d'une ligne : 68 px au moins (144 px pour deux lignes).

### 2.2 Classes de largeur (utilisées dans les tableaux)

| Code | Largeur | Ce qui tient (police 12–13 px) | Compteur à ronds (14 px + 6 px) |
|---|---|---|---|
| **É** étroite | 80–84 px | nom court ≤ 10 car. + valeur ≤ 4 car. | 3 ronds au plus |
| **M** moyenne | 114 px | nom ≤ 14 car. + valeur ≤ 6 car. | 5 ronds |
| **L** large | 170–236 px | nom complet + valeur + une info dessous | 8 ronds |
| **P** pleine | 358 px | phrase courte, liste de 4–6 pastilles | 16 ronds |
| **×2** | 2 lignes de haut | liste de 3–4 lignes, texte de 2–3 lignes | 2 rangées de ronds |

Règle d'éligibilité proposée : une tuile est **proposée** pour une case si la largeur réelle de la case est au moins sa largeur minimale et si la hauteur suffit ; sinon elle est **montrée barrée**, avec la raison (« Il faut au moins 1×2 ici »).

### 2.3 Blocs : ce qu'ils acceptent

| Bloc | Case | Accepte |
|---|---|---|
| **Rep** (Repères) | 1×1 de 80 px | tuiles É sur 1 ligne |
| **Rac** (Raccourcis) | 1×1 de 170 px, info sous le nom | tuiles É, M ou L sur 1 ligne (une tuile É s'y affiche avec son info) |
| **Perso** (bloc personnalisé) | selon modèle | toute tuile dont la largeur minimale tient dans la case ou le groupe de cases |

### 2.4 Les 8 gabarits

| Gabarit | Exemple | Largeur min. | Comportement à la largeur |
|---|---|---|---|
| **V** valeur courte | CA 17 | É | identique partout ; en L, détail sous la valeur |
| **K** compteur | Fougue ●○ | É | ronds si la place suffit, sinon « 2/5 » ; −/+ au toucher |
| **R** réserve chiffrée | Imposition 35/40 | É | toujours en chiffres ; pavé numérique au toucher |
| **D** dé | Arts martiaux d8 | É | identique partout |
| **KD** compteur + dé | Insp. bardique d8 · 3/4 | É (serré) | conseillé L : dé et ronds côte à côte |
| **B** bascule | Témérité (ce tour) | É | allumée / éteinte ; remise à zéro par « Ce tour » ou le repos |
| **Pop** maîtresse | Sauvegardes | É | É : icône + nom court ; L : nom + info (meilleur bonus, nombre d'éléments) |
| **T** texte ou liste | Résistances, Notes | L | P ou ×2 pour lister ; en É seulement une icône + un nombre |

### 2.5 Nouveaux formats : avis

| Format | Utilité | Avis |
|---|---|---|
| **1×2** | Donne une case large dans un bloc de 4 colonnes : compteurs de 4 à 8 ronds, compteur + dé, noms longs, Bottes d'arme, Ce tour compact. | **À ajouter en priorité.** Sans lui, une tuile L dans un bloc de 4 colonnes coûte un 2×2 (4 cases sur 8). |
| **Bandeau 2×N** | Notes, Ce tour détaillé, Emplacements de 9 niveaux sur deux rangées, Effets en cours. | **Utile**, mais il prend 8 cases dans un bloc de 4 colonnes : réserver aux blocs de 1 à 3 colonnes ou en faire une tuile seule. |
| **2×1** | Liste verticale étroite (3 lignes de texte court). Rares usages : Arcanum mystique 6-7-8-9, Présage (2–3 valeurs). | **Facultatif.** Les mêmes tuiles tiennent en 1×2. |
| **2×2** | Garde son intérêt pour Ce tour, Compagnon, Forme active. | À garder. |

---

## 3. Tableau principal

Colonnes abrégées. **Pour qui** : « toujours » ou condition d'apparition. **Formats possibles** : classes de largeur lisibles (É, M, L, P ; ×2 = deux lignes). **Conseillé** : format conseillé en notation lignes × colonnes, avec le bloc visé. **Blocs** : Rep / Rac / Perso (largeur minimale). **SRD** : ✓ dans le SRD 5.2.1, ✗ hors SRD (mécanique résumée seulement). **Recharge** : RC = repos court, RL = repos long. **BM** = bonus de maîtrise. ★★★ = sert presque à chaque séance ; ★ = rare. Noms : ceux d'AideDD (version 2024) servant de contrôle, à confirmer avec la VF officielle.

### 3.1 Défense et survie (DEF)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Classe d'armure | DEF | toujours | 17 | affichage (détail du calcul, bouclier, sorts) | É M L P | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Résistances, immunités, vulnérabilités | DEF | dès qu'il y en a une (espèce, rage, sort, objet) | icônes ou « 3 » ; en L : « Feu · Poison » | affichage (liste et source) | É (icône + nombre), L, P | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; la rage ajoute ses résistances quand elle est active |
| Bouclier équipé | DEF | porte un bouclier | +2 | affichage | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; peut se fondre dans la CA |
| **Inspiration héroïque** | DEF | toujours (Humain : regagnée à chaque RL ; Guerrier Champion niv. 10 : regagnée au début du tour en combat) | ● ou ○ | compteur 0/1 + règle (relancer un dé tout de suite, garder le nouveau) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; demandée par Angle ; une seule à la fois, le MJ la donne |
| **Concentration** | DEF | lanceur de sorts | nom du sort ou « — » | règle (DD = 10 ou moitié des dégâts, plafonné à 30) + jet + fin | É (icône allumée), L (nom du sort) | 1×2 Perso / 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; aujourd'hui dans la carte PV (voir questions) |
| Épuisement | DEF | toujours (utile surtout quand niveau > 0) | 0 à 6 | compteur + règle (−2 par niveau aux jets de d20, −1,5 m de vitesse par niveau ; 6 = mort ; un RL en retire 1) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; déjà dans la popup États ; tuile utile pour Rôdeur (Infatigable) |
| Aura (Paladin) | DEF | Paladin niv. 6 | +3 · 3 m | règle (bonus de Charisme aux sauvegardes des alliés dans l'aura ; 9 m au niv. 18) | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; regroupe Protection et Courage |

### 3.2 Initiative, mouvement et corps (MVT)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| **Initiative** | MVT | toujours | +5 | jet (avantage si Instinct sauvage, Vigilant, etc.) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; seule tuile de jet individuelle |
| Vitesse au sol | MVT | toujours | 9 m | affichage (détail : espèce, armure lourde, Déplacement rapide, sans armure) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; épuisement déduit |
| Vitesses spéciales | MVT | si vol, nage, escalade ou fouissement | « Vol 9 m » ; en L : toutes | affichage + règle | É (une seule), L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★ ; Rôdeur niv. 6 (escalade, nage), Drakéide niv. 5 (vol) |
| Taille | MVT | toujours | M | affichage | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; change en Forme de géant (Goliath) |
| Saut | MVT | toujours | 4,5 m · 1,2 m | règle (longueur = valeur de Force en pieds avec élan ; hauteur = 3 + mod. de Force en pieds ; moitié sans élan) | É (2 valeurs serrées), L | 1×2 Perso | Rac Perso(L) | ✓ | ★ ; Voleur : utilise la Dextérité |
| Capacité de port | MVT | toujours | 120 / 225 kg | affichage + règle (port, traîner, soulever) | L | 1×1 Rac | Rac Perso(L) | ✓ | ★ ; calcul selon Force et taille |
| Apnée | MVT | toujours | 3 min | règle (1 + mod. de Con. minutes, 30 s au moins ; ensuite épuisement) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; nouvelle ; utile en campagne aquatique |
| Charge du voyage / allure | MVT | toujours | Normale | règle (rapide / normale / lente et effets) | É, L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★ ; à garder seulement si Angle veut du voyage |
| Forme active | MVT | Druide (Forme sauvage), Goliath (Forme de géant), Barbare (Rage), sorts de métamorphose | « Loup · 11 PV » ou « En rage » | popup : forme, PV temporaires, CA, attaques de la forme, durée, fin | L, P, ×2 | 2×2 Perso | Rac Perso(L) | ✓ | ★★★ pour Druide ; tuile contextuelle (vide hors de la forme) |

### 3.3 Sens et passifs (SENS)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Perception passive | SENS | toujours | 14 | affichage | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Intuition passive | SENS | toujours | 12 | affichage | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Investigation passive | SENS | toujours | 11 | affichage | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Vision dans le noir | SENS | espèce (18 ou 36 m), Traqueur des ténèbres, sorts | 18 m | règle (pénombre vue comme lumière vive, noir vu comme pénombre, sans couleurs) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ |
| Vision aveugle | SENS | Rôdeur niv. 18 (9 m), objets, formes | 9 m | règle | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Perception des vibrations | SENS | Nain (Connaissance de la pierre, 18 m, 10 min) | 18 m | règle + durée | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; souvent fondue dans la tuile Nain |
| Vision lucide | SENS | Faveur épique, manifestation Vue de sorcier (9 m), sorts | 18 m | règle | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |

### 3.4 Tuiles maîtresses (MAI)

Toutes : **Au toucher** = popup qui regroupe les jets ou éléments qui en dépendent. En case étroite : icône + nom court ; en case large : nom + une info.

| Tuile | Fam. | Pour qui | Affiche (É / L) | La popup contient | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Tests de caractéristique | MAI | toujours | « Tests » / « Tests · meilleur +7 » | 6 caractéristiques et leurs compétences | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; défaut Raccourcis |
| Jets de sauvegarde | MAI | toujours | « Sauveg. » / « Sauvegardes · FOR CON » | 6 sauvegardes + concentration ; avantages notés (Sens du danger, Résistance naine…) | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; défaut Raccourcis |
| Attaques | MAI | toujours | « Attaques » / « 2 par action » | armes, mains nues, sorts d'attaque, Botte d'arme de chaque arme | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; défaut conseillé pour non-lanceurs |
| Sorts | MAI | lanceur (dont tiers de lanceur) | « Sorts » / « 7 préparés » | sorts préparés par niveau, emplacements, DD, attaque | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; défaut conseillé pour lanceurs |
| Ressources | MAI | dès qu'une ressource existe | « Ress. » / « 4 ressources » | toutes les ressources (classe, espèce, dons, objets, maison) | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; filet de sécurité si les tuiles de ressource ne sont pas posées |
| États | MAI | toujours | « États » / « À terre, Empoisonné » | états, épuisement, règle de chaque état | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; défaut Raccourcis |
| Inventaire | MAI | toujours | « Inv. » / « 12 objets · 34 po » | objets, charges, consommables, or | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; défaut Raccourcis |
| Équipement | MAI | toujours | « Équip. » / « 2/3 harmonisés » | silhouette, mains, harmonisation | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; défaut Raccourcis |
| Actions (aide-mémoire) | MAI | toujours (utile aux débutants) | « Actions » / « Ce que je peux faire » | les 12 actions 2024 (Attaquer, Chercher, Aider, Se cacher, Esquiver, Foncer, Se désengager, Influencer, Étudier, Magie, Préparer, Utiliser un objet), action bonus et réaction propres au perso | É L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; nouvelle ; noms d'actions à confirmer en VF |

### 3.5 Combat (CBT)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Attaques par action | CBT | Attaque supplémentaire (niv. 5+) ou toujours | 2 | affichage | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ |
| Bonus de maîtrise | CBT | toujours | +3 | affichage | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ |
| Réaction disponible | CBT | toujours | ● / ○ | compteur (remis à zéro au début de ton tour) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; recoupe Ce tour |
| Bottes d'arme | CBT | Barbare, Guerrier, Paladin, Rôdeur, Roublard niv. 1 ; dons | « 3 bottes » / « Rapière : Ouverture… » | règle : chaque arme maîtrisée et sa propriété (Enchaînement, Écorchure, Coup double, Poussée, Sape, Ralentissement, Renversement, Ouverture — VF à vérifier) | É (nombre), L, P | 1×2 Perso | Rep Rac Perso(É) | ✓ | ★★ ; changement d'arme au RL |
| DD d'aptitude | CBT | dès qu'une aptitude impose une sauvegarde hors sort (Souffle, manœuvres, Frappe malicieuse, Frappe étourdissante, Paume…) | DD 15 | affichage + liste des aptitudes qui l'utilisent | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; nouvelle ; une même formule (8 + BM + mod.) avec la caractéristique propre à chaque aptitude |
| DD d'agrippement et de bousculade | CBT | toujours (Frappe à mains nues) | DD 13 | règle (8 + mod. de Force + BM ; échapper à l'état Agrippé) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Critique | CBT | Guerrier Champion (19–20, puis 18–20), sorts ou objets | 19+ | affichage | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; n'apparaît que si différent de 20 |
| Témérité | CBT | Barbare niv. 2 | bascule | bascule « ce tour » + règle (avantage à tes attaques de Force, avantage aux attaques contre toi jusqu'à ton prochain tour) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ pour Barbare ; s'éteint au tour suivant |
| Effets en cours | CBT | toujours | « 2 effets » / « Bénédiction 7 rds · Marque » | liste des effets suivis (sort, cible, rounds restants) ; le joueur les ajoute | É (nombre), L, P, ×2 | 2×N Perso | Rep Rac Perso(É) | ✓ | ★★ ; nouvelle ; la tuile compte, elle ne décide pas de la fin |

### 3.6 Magie (MAG)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| DD des sorts | MAG | lanceur | 15 | affichage | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Attaque de sort | MAG | lanceur | +7 | jet libre d'attaque de sort | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; **manque au référentiel** |
| Emplacements, un niveau | MAG | lanceur | « Niv 1 ●●○ » | compteur | É (≤3 ronds), L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Emplacements, tous niveaux | MAG | lanceur | une rangée par niveau | compteur | P, ×2 au-delà de 5 niveaux | 1×N ou 2×N Perso | Perso(P) | ✓ | ★★★ ; rangée qui s'adapte, déjà dans la carte PV |
| Emplacements de pacte | MAG | Occultiste | « Pacte 3 · ●● » | compteur (RC) | É (≤3), L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Arcanum mystique | MAG | Occultiste niv. 11 | 6 ● 7 ● 8 ○ 9 ● | compteur 1 par niveau de sort (RL) | É (« 3/4 »), L, 2×1 | 1×2 Perso | Rep Rac Perso(É) | ✓ | ★★ ; nouvelle |
| Sorts préparés | MAG | lanceur qui prépare | 7/8 | affichage | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Lancer gratuit | MAG | sort sans emplacement 1/RL (Initié à la magie, Lignage elfique, Héritage fiélon, Affinité féerique, Ennemi juré…) | « Foulée ● » | compteur + lien vers le sort | É, L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; une tuile par sort gratuit, ou une seule tuile qui les regroupe |
| Rituels | MAG | Magicien (Savoir rituel), Lanceur de rituels, Pacte du grimoire | « Rituels » | popup des rituels connus et rappel (+10 min, sans emplacement) | É L | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; peut rester dans la popup Sorts |

### 3.7 Ressources de classe (RES)

Recharge entre parenthèses. Les options qui consomment une même ressource (Conduit divin, Inspiration bardique, Points de Credo…) sont dans la **popup de la tuile de la ressource**, pas en tuiles séparées.

#### 3.7.1 Barbare (sous-classe SRD : Berserker)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Rage | RES | Barbare 1 | « 3/4 · +2 » | compteur (1 au RC, toutes au RL) + bascule « en rage » + règle (bonus de dégâts, résistances, durée, fin) | É (chiffres), L (ronds + bonus) | 1×2 Perso / 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; 2 → 6 utilisations ; bonus +2 → +4 ; Rage persistante (niv. 15) : 1 fois par RL, tout revient à l'Initiative |
| Coup brutal | RES | Barbare 9 | 1d10 | dé + règle (renoncer à l'avantage de Témérité pour un effet ; 2d10 au niv. 17) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Rage implacable | RES | Barbare 11 | DD 15 | compteur de DD (10, +5 par réussite, revient à 10 au RC ou RL) + jet de Constitution | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; nouvelle, très utile |
| Présence intimidante | RES | Berserker 14 | ● | compteur (1 par RL, ou en dépensant une Rage) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Frénésie | RES | Berserker 3 | +3d6 | dé (autant de d6 que le bonus de rage, une fois par tour avec Témérité) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Guerrier des dieux | RES | Zélateur 3 | 4d12 | réserve de dés de soin (4 → 7, RL) | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★★ ; Fureur divine (dégâts en plus) dans la popup |
| Rage de la nature / Aspect | RES | Cœur sauvage 3 et 6 | « Loup » | sélecteur d'option (à chaque rage ; aspect au RL) + règle | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Vitalité de l'arbre | RES | Arbre-Monde 3 | +7 PV t. | règle (PV temporaires = niveau en entrant en rage ; soins aux alliés) | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★ |

#### 3.7.2 Barde (SRD : Collège du Savoir)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Inspiration bardique | RES | Barde 1 | « d8 · 3/4 » | compteur + dé + popup des usages (Mots cinglants, Pirouettes, Inspiration martiale…) | É (serré), L | 1×2 Perso / 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; utilisations = mod. de Charisme ; RL, puis RC dès le niv. 5 ; d6 → d12 ; niv. 18 : remonte à 2 à l'Initiative |
| Magie envoûtante | RES | Séduction 3 | ● | compteur (1 par RL, ou 1 Inspiration) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Manteau de majesté | RES | Séduction 6 | ● | compteur (1 par RL, ou emplacement niv. 3+) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ ; nom AideDD « Mante de majesté » à vérifier |

#### 3.7.3 Clerc (SRD : Domaine de la Vie)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Conduit divin | RES | Clerc 2, Paladin 3 | ●●○ | compteur (1 au RC, tous au RL) + popup des options (Étincelle divine et ses dés, Renvoi des morts-vivants, options de domaine ou de serment) | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; Clerc 2 → 4, Paladin 2 → 3 |
| Intervention divine | RES | Clerc 10 | ● | compteur (RL) + règle | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Éclat protecteur | RES | Lumière 3 | 3/3 | compteur (mod. de Sagesse ; RL, puis RC au niv. 6) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Prêtre de guerre | RES | Guerre 3 | 3/3 | compteur (mod. de Sagesse ; RC ou RL) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Faveur du filou / Réplique | RES | Ruse 3 | « Réplique : active » | compteur + bascule de la réplique | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★ |

#### 3.7.4 Druide (SRD : Cercle de la Terre)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Forme sauvage | RES | Druide 2 | ●●○ | compteur (1 au RC, toutes au RL) + choix de la forme → ouvre Forme active ; Compagnon sauvage dans la popup | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; 2 → 4 utilisations |
| Regain sauvage | RES | Druide 5 | ● | compteur (conversion d'une Forme en emplacement niv. 1, 1 par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; peut vivre dans la popup Forme sauvage |
| Ressourcement | RES | Terre 6 | ● | compteur (récupérer des emplacements au RC, 1 par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Terrain choisi | RES | Terre 3 | Polaire | affichage + sorts du cercle | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Carte stellaire / Forme stellaire | RES | Astres 3 | « Calice » | compteur (Trait guideur gratuit, mod. de Sagesse par RL) + sélecteur de forme | É, L | 1×2 | Rep Rac Perso(É) | ✗ | ★★ |
| Présage cosmique | RES | Astres 6 | « Heur · 2/3 » | compteur (mod. de Sagesse par RL) + parité du dé tiré au RL | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Foulée sélène | RES | Lune 10 | 3/3 | compteur (mod. de Sagesse par RL, ou emplacement 2+) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Courroux des mers | RES | Mers 3 | bascule | bascule (aura de 10 min, dépense une Forme sauvage) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |

#### 3.7.5 Ensorceleur (SRD : Sorcellerie draconique)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Points de sorcellerie | RES | Ensorceleur 2 | 7/9 | réserve (RL) + popup : conversion emplacement ↔ points, options de Métamagie et leur coût | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; égal au niveau |
| Sorcellerie innée | RES | Ensorceleur 1 | ●○ · active | compteur (2 par RL) + bascule 1 min (+1 au DD des sorts, avantage aux attaques de sort) | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; niv. 7 : réactivable pour 2 points |
| Restauration ensorcelée | RES | Ensorceleur 5 | ● | compteur (points récupérés au RC, 1 par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Ailes draconiques | RES | Draconique 14 | ● | compteur (1 par RL, ou 3 points) + bascule | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; ajoute une vitesse de vol |
| Compagnon draconique | RES | Draconique 18 | ● | compteur (un appel gratuit par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Marée du chaos | RES | Sauvage 3 | ● | compteur (revient après une bouffée de magie sauvage ou au RL) + lien table | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Rétablir l'équilibre / Bastion de la loi | RES | Mécanique 3 et 6 | 3/3 | compteur (mod. de Charisme par RL) ; Bastion = réserve de d8 payée en points | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Sorcellerie aberrante | RES | Aberrante 6–18 | — | popup des aptitudes payées en points | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ ; tient dans Points de sorcellerie |

#### 3.7.6 Guerrier (SRD : Champion)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Second souffle | RES | Guerrier 1 | « ●●○ · 1d10+5 » | compteur (1 au RC, tous au RL) + jet de soins ; Sens tactique (niv. 2) dans la popup | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; 2 → 4 utilisations |
| Fougue | RES | Guerrier 2 | ● | compteur (RC ou RL ; 2 au niv. 17) + règle (une action de plus) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Inflexible | RES | Guerrier 9 | ●○ | compteur (RL ; 1 → 3) + règle (relancer une sauvegarde ratée avec un bonus égal au niveau) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Dés de supériorité | RES | Maître de guerre 3 | « d8 · 3/4 » | compteur + dé (RC ou RL) + popup des manœuvres connues avec leur DD | É, L | 1×2 Perso | Rep Rac Perso(É) | ✗ | ★★★ ; 4 → 6 dés, d8 → d12 ; Observation de l'ennemi (1 par RL) dans la popup |
| Dés d'énergie psionique | RES | Soldat psi 3, Âme acérée 3 | « d6 · 4/4 » | compteur + dé (1 au RC, tous au RL) + popup (Champ protecteur, Frappe psionique, Mouvement télékinétique…) | É, L | 1×2 Perso | Rep Rac Perso(É) | ✗ | ★★★ ; nombre et taille montent avec le niveau |
| Rétablissement héroïque | RES | Champion 18 | règle | règle (soins au début du tour quand on est à la moitié des PV ou moins) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; l'appli peut l'allumer quand PV ≤ moitié |
| Magie de guerre | RES | Chevalier occulte 7 | règle | règle (remplacer une attaque par un sort mineur, puis un sort au niv. 18) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ ; les emplacements passent par les tuiles Magie |

#### 3.7.7 Magicien (SRD : Évocateur)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Restauration magique | RES | Magicien 1 | « ● · 3 niv. » | compteur (1 par RL) + choix des emplacements à récupérer (total ≤ moitié du niveau, emplacements ≤ 5) | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; le référentiel dit « Restauration arcanique » : libellé à trancher |
| Sorts de prédilection | RES | Magicien 20 | ●● | compteur (1 par sort, RC ou RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Surcharge magique | RES | Évocateur 14 | « ● · 2d12 » | compteur (1 gratuite par RL) + dégâts nécrotiques à subir ensuite, qui montent à chaque usage | É, L | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Égide arcanique | RES | Abjurateur 3 | 12/15 | réserve de PV de l'égide (2 × niveau + mod. d'Int.) ; se recharge en dépensant des emplacements | É | 1×1 Rep | Rep Rac Perso(É) | ✗ | ★★★ pour l'Abjurateur |
| Présage | RES | Devin 3 | « 17 · 4 » | valeurs des dés tirés au RL (2, puis 3 au niv. 14) ; toucher = utiliser une valeur | É (2 valeurs), L, 2×1 | 1×2 Perso | Rep Rac Perso(É) | ✗ | ★★★ pour le Devin ; Troisième Œil (1 par RC/RL) dans la popup |
| Créatures fantasmagoriques / Calque | RES | Illusionniste 6 et 10 | ●● | compteurs | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |

#### 3.7.8 Moine (SRD : Credo de la Paume)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Points de Credo | RES | Moine 2 | 5/6 | réserve (RC ou RL) + popup des dépenses (Déluge de coups, Défense patiente, Pas du vent, Frappe étourdissante…) | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; égal au niveau |
| Arts martiaux | RES | Moine 1 | d8 | dé + règle | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; d6 → d12 |
| Métabolisme surnaturel | RES | Moine 2 | ● | compteur (1 par RL ; à l'Initiative, rend tous les points et soigne) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Déviation d'assaut | RES | Moine 3 | −1d10+8 | règle (réduction des dégâts en réaction ; renvoi pour 1 point) | É, L | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Plénitude physique | RES | Paume 6 | 3/3 | compteur (mod. de Sagesse par RL) + jet de soins | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Lien élémentaire | RES | Éléments 3 | bascule | bascule 10 min (1 point) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Mains de guérison et de nuisance | RES | Miséricorde 3 | « 3/3 » | règle ; compteur des usages gratuits du niv. 11 (mod. de Sagesse par RL) ; Main de la miséricorde ultime (1 par RL, niv. 17) | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |

#### 3.7.9 Occultiste (SRD : Fiélon)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Rouerie magique | RES | Occultiste 2 | ● | compteur (1 par RL) + récupération de la moitié des emplacements de pacte | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; niv. 20 : récupère tout |
| Manifestations occultes | RES | Occultiste 1 | « 5 » | popup des manifestations connues ; compteurs pour celles qui sont limitées (Don des profondeurs, Don des protecteurs…) | É, L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ |
| Communication avec le protecteur | RES | Occultiste 9 | ● | compteur (1 par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Chance du Ténébreux | RES | Fiélon 6 | 3/3 | compteur (mod. de Charisme par RL) + ajout d'un d10 | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ ; Traversée des enfers (1 par RL ou emplacement) dans la popup |
| Foulée des fées | RES | Archifée 3 | 3/3 | compteur (mod. de Charisme par RL) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Lumière guérisseuse | RES | Céleste 3 | 6/6 d6 | réserve de d6 (1 + niveau, RL) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Combattant clairvoyant | RES | Grand Ancien 6 | ● | compteur (RC ou RL, ou emplacement) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |

#### 3.7.10 Paladin (SRD : Serment de Dévotion)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Imposition des mains | RES | Paladin 1 | 25/30 | réserve (5 × niveau, RL) + soigner / retirer un état (Toucher réparateur, niv. 14) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Châtiment de paladin | RES | Paladin 2 | ● | compteur (un Châtiment divin sans emplacement, 1 par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Fidèle destrier | RES | Paladin 5 | ● | compteur (un appel gratuit par RL) → Compagnon | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Arme sacrée / Vœu d'hostilité / … | RES | sous-classe 3 | bascule | bascule de l'effet (durée) ; dépense un Conduit divin | É | 1×1 | Rep Rac Perso(É) | ✓ (Dévotion) | ★★ |
| Nimbe sacré (ou capstone de serment) | RES | sous-classe 20 | ● | compteur (1 par RL, ou emplacement niv. 5) + bascule 10 min | É | 1×1 | Rep Rac Perso(É) | ✓ (Dévotion) | ★ |

#### 3.7.11 Rôdeur (SRD : Chasseur)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Ennemi juré | RES | Rôdeur 1 | ●●○ | compteur (Marque du chasseur sans emplacement, RL ; 2 → 6) + cible marquée | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ |
| Infatigable | RES | Rôdeur 10 | 3/3 | compteur (PV temporaires, mod. de Sagesse par RL) + règle (épuisement réduit au RC) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Voile de la nature | RES | Rôdeur 14 | 3/3 | compteur (invisibilité courte, mod. de Sagesse par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Proie du chasseur / Tactiques défensives | RES | Chasseur 3 et 7 | « Tueur de colosses » | sélecteur (changeable au RC ou RL) + règle | É (nom court), L | 1×2 / 1×1 Rac | Rac Perso(L) | ✓ | ★★ ; nom long : L conseillé |
| Frappe effroyable | RES | Traqueur des ténèbres 3 | 3/3 | compteur (mod. de Sagesse par RL, 1 par tour) ; bonus d'Initiative et vision dans le noir répercutés | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Renforts / Vagabond brumeux | RES | Vagabond féerique 11 et 15 | ● · 3/3 | compteurs | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Compagnon primitif | RES | Belluaire 3 | → Compagnon | voir Compagnon (Outils) | — | — | — | ✗ | ★★★ pour le Belluaire |

#### 3.7.12 Roublard (SRD : Voleur)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Attaque sournoise | RES | Roublard 1 | 3d6 | dé + bascule « utilisée ce tour » + popup Frappe malicieuse (options et coût en dés, DD) | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★★ ; 1d6 → 10d6 |
| Visée appliquée | RES | Roublard 3 | bascule | bascule « ce tour » + règle (avantage, vitesse à 0) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Coup de chance | RES | Roublard 20 | ● | compteur (RC ou RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Voleur de sorts | RES | Arnaqueur arcanique 17 | ● | compteur (1 par RL) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ ; emplacements du tiers de lanceur dans Magie |
| Voile psychique / Déchirer l'esprit | RES | Âme acérée 13 et 17 | ● | compteurs (1 par RL ou dés psioniques) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ ; les dés vont dans « Dés d'énergie psionique » |

### 3.8 Espèces (ESP)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Souffle | ESP | Drakéide | « 2d10 · 2/3 » | compteur (BM par RL) + dé + DD + zone | É (serré), L | 1×2 / 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★★ ; 1d10 → 4d10 |
| Vol draconique | ESP | Drakéide 5 | ● | compteur (1 par RL) + bascule 10 min | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Connaissance de la pierre | ESP | Nain 1 | 2/2 | compteur (BM par RL) + bascule 10 min (perception des vibrations 18 m) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Sorts de lignage / d'héritage | ESP | Elfe, Tieffelin (niv. 3 et 5), Gnome des forêts (BM par RL) | ●● | compteurs → Lancer gratuit | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Bricolage | ESP | Gnome des roches | 1/3 | compteur d'appareils actifs (3 au plus) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Ascendance gigantesque | ESP | Goliath | « Froid · 2/3 » | compteur (BM par RL) + règle de l'ascendance choisie | É, L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ |
| Forme de géant | ESP | Goliath 5 | ● | compteur (1 par RL) + bascule 10 min → Forme active | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Poussée d'adrénaline | ESP | Orc | 2/3 | compteur (BM par RC ou RL) + PV temporaires = BM | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ |
| Acharnement | ESP | Orc | ● | compteur (1 par RL ; tomber à 1 PV au lieu de 0) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ ; aussi visible depuis la carte PV |
| Ingénieux | ESP | Humain | → | règle : Inspiration héroïque à chaque RL | — | — | — | ✓ | pas de tuile propre : alimente Inspiration héroïque |
| Mains guérisseuses | ESP | Aasimar | ● | compteur (1 par RL) + jet de soins (d4 × BM) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ ; aasimar absent du SRD 5.2 ; VF à vérifier |
| Révélation céleste | ESP | Aasimar 3 | ● | compteur (1 par RL) + choix de la forme (ailes, rayonnement, linceul) + bascule 1 min | É, L | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |

Pas de tuile pour : Halfelin (Chanceux de l'espèce, Brave : règles passives, à mettre dans Sauvegardes et Tests) ; Elfe (Transe : règle de repos) ; Humain (Doué, Polyvalent).

### 3.9 Dons (DON)

Les historiques 2024 n'apportent pas de ressource propre : ils donnent un don d'origine, traité ici.

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Chanceux | DON | don d'origine | 2/3 | compteur (points = BM, RL) + règle | É | 1×1 Rep | Rep Rac Perso(É) | ✗ | ★★★ |
| Initié à la magie | DON | don d'origine | ● | → Lancer gratuit (sort niv. 1, 1 par RL) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★★ |
| Vigilant | DON | don d'origine | → | modifie la tuile Initiative (+BM, échange d'initiative) | — | — | — | ✓ | pas de tuile propre |
| Guérisseur | DON | don d'origine | → | modifie Trousse de soins (soigner un allié avec ses dés de vie) | — | — | — | ✗ | pas de tuile propre |
| Musicien | DON | don d'origine | règle | règle (donner l'Inspiration héroïque à des alliés après un repos) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Affinité féerique / Touché par l'ombre | DON | don général | ●● | → Lancer gratuit (2 sorts, 1 par RL chacun) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ ; VF à vérifier |
| Chef cuisinier | DON | don général | 3/3 | compteur de friandises (BM, RL) + règle du RC (1d8 de plus) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Tueur de mages | DON | don général | ● | compteur (Esprit gardé, RC ou RL) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Maître des armures lourdes | DON | don général | −3 | valeur (réduction des dégâts = BM) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★★ |
| Lanceur de rituels / Télépathe / Empoisonneur | DON | don général | ● · 3/3 | compteurs (rituel rapide 1 par RL ; Détection des pensées 1 par RL ; doses de poison = BM) | É | 1×1 | Rep Rac Perso(É) | ✗ | ★ |
| Faveurs épiques | DON | niv. 19 | ● | compteur selon la faveur (Destin : 1 par Initiative ou repos ; Rappel de sort : 1 par RL ; Prouesse au combat : 1 par tour ; Vision lucide → Sens) | É | 1×1 | Rep Rac Perso(É) | ✓ (7 faveurs) | ★ ; Récupération : hors SRD |

Dons sans tuile (règle passive ou valeur déjà intégrée) : Robuste, Doué, Artisan, Attaquant sauvage, Bagarreur de tavernes (dans Attaques), Résilient, Mobile (Vitesse), Mage de guerre (Concentration), Durable (carte PV), Lutteur (DD d'agrippement), Sentinelle, Tireur d'élite, Maître des armes lourdes (règles dans Attaques), styles de combat (intégrés aux calculs).

### 3.10 Objets (OBJ)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| Charges d'un objet | OBJ | objet à charges | 5/7 | compteur + recharge (souvent à l'aube, avec un jet) | É, L | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ ; la recharge par jet reste au joueur |
| Munitions | OBJ | arme à munitions | 18 | compteur + règle (récupérer la moitié après le combat) | É | 1×1 Rep | Rep Rac Perso(É) | ✓ | ★★ |
| Objets harmonisés | OBJ | dès 1 harmonisation | 2/3 | affichage → Équipement | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Potion ou consommable | OBJ | possède l'objet | « Soins ×3 » | compteur + effet (jet de soins) | É, L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; reste affichée à 0 jusqu'à retrait |
| Or / bourse | OBJ | toujours | 34 po | affichage + conversion | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Trousse de soins | OBJ | en possède une | 7/10 | compteur (stabiliser ; Guérisseur : soins) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Lumière | OBJ | torche, lanterne, sort Lumière | « Torche 40 min » | minuteur indicatif + rayons (vive / faible) | É, L | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; le MJ tient le temps réel |
| Rations et eau | OBJ | toujours (campagne de voyage) | 4 j | compteur | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ |
| Objet à sort stocké | OBJ | Anneau de stockage de sorts, parchemins | « 2 sorts » | popup (sorts stockés, niveau) | É, L | 1×1 | Rep Rac Perso(É) | ✓ | ★ |

### 3.11 Outils de table (OUT)

| Tuile | Fam. | Pour qui | Affiche | Au toucher | Formats possibles | Conseillé | Blocs | SRD | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| **Recherche** | OUT | toujours | loupe | ouvre la recherche (règles, sorts, objets, aptitudes) | É, L, P (champ visible) | 1×1 Rac ou 1×N | Rep Rac Perso(É) | — | ★★★ ; aujourd'hui un bloc |
| **Ce tour** | OUT | toujours | Act · Bonus · Réac · Mvt | pastilles à cocher ; remise à zéro au tour suivant ; remet aussi les bascules « ce tour » | É (« 2/4 »), L (4 pastilles), P, ×2 (avec mouvement restant en mètres) | 1×N ou 2×2 Perso | Rep Rac Perso(É) | — | ★★★ ; aujourd'hui un bloc ; en É, seulement un résumé |
| **Notes** | OUT | toujours | « 3 notes » / début de la dernière | popup des notes | É (icône + nombre), L, P, ×2 (2–3 lignes lisibles) | 2×N Perso | Rep Rac Perso(É) | — | ★★ ; aujourd'hui un bloc |
| Historique des jets | OUT | toujours | dernier résultat « 17 » | liste des derniers jets | É, L (2 derniers), P | 1×1 Rac | Rep Rac Perso(É) | — | ★★ |
| Repos | OUT | toujours | lune / café | popup Repos court / Repos long (dés de vie, récupérations) | É, L | 1×1 Rac | Rep Rac Perso(É) | ✓ | ★★ ; aujourd'hui dans la carte PV |
| Inspiration héroïque | OUT | → voir 3.1 | | | | | | | rangée en Défense et survie |
| Dés libres | OUT | toujours | d20 | lancer libre (choix du dé, nombre, bonus) | É | 1×1 | Rep Rac Perso(É) | — | ★★ ; utile quand le MJ demande un jet hors fiche |
| Compagnon | OUT | Belluaire, Fidèle destrier, Appel de familier, Compagnon sauvage, sorts d'invocation | « Loup · 14/20 » | popup : PV (dégâts / soins), CA, attaques, vitesse | L, P, ×2 | 2×2 Perso | Rac Perso(L) | ✓ | ★★★ pour Belluaire ; nouvelle ; PV en mini-carte |
| Jets contre la mort | OUT | à 0 PV | ●●○ / ✕○○ | compteur réussites / échecs + jet | L | — | — | ✓ | **reste dans la carte PV** (cité pour mémoire) |
| Dés de vie | OUT | toujours | 3/5 d10 | compteur | É | 1×1 | Rep Rac Perso(É) | ✓ | reste dans la carte PV ; tuile possible pour qui veut l'avoir en Repères |
| Niveau d'éclairage / Abri | OUT | toujours | règle | règle (abri partiel +2, supérieur +5, total ; lumière vive / faible / ténèbres) | É | 1×1 | Rep Rac Perso(É) | ✓ | ★ ; peut vivre dans Actions |
| Bloc-compteur maison | OUT | créé par le joueur | selon définition | selon définition | selon définition | — | selon largeur | — | voir section 5 ; le « compteur personnalisé » actuel en devient un cas |

---

## 4. Tuiles dynamiques

### 4.1 Règle d'apparition proposée

| Situation | Comportement |
|---|---|
| Le perso **gagne** une source (niveau, sous-classe, don, espèce, objet porté ou harmonisé) | La tuile entre dans le catalogue, groupe « Pour ce perso ». Un **point** sur « Personnaliser » signale « Nouvelle tuile : Fougue ». **Rien n'est placé d'office** sans accord, sauf s'il reste une case vide **et** que la tuile est la ressource principale de la classe (★★★) : on la propose alors en un toucher (« Ajouter dans la case vide ? »). |
| Le perso **perd** la source (changement de don, objet retiré, harmonisation rompue, niveau corrigé) | La tuile reste à sa place, **grisée**, avec « Plus disponible : objet non harmonisé ». Un toucher propose de la retirer. Jamais de suppression silencieuse. |
| Tuile **contextuelle** (Forme active, Rage active, Effets en cours, Épuisement, Jets contre la mort) | Toujours placée par le joueur ; elle affiche « — » hors contexte et s'allume quand l'état est actif. |
| Consommable épuisé (dernière potion) | La tuile reste à 0 ; le joueur la retire. |
| Édition d'un bloc | Trois groupes : **Pour ce perso** (triés par priorité ★), **Générales**, puis les tuiles du perso **trop grandes** pour la case, barrées avec la raison. Les tuiles des autres classes ne sont **pas** montrées (elles n'ont pas de sens pour ce perso). |

### 4.2 Tuiles par défaut selon le profil

Raccourcis par défaut (décision d'Angle) : Tests, Sauvegardes, États, Inventaire, Équipement, + la 6ᵉ case indiquée ci-dessous à la place de la case vide (à valider).

| Profil | Repères proposés (8) | 6ᵉ Raccourci | Bloc perso suggéré (non créé d'office) |
|---|---|---|---|
| **Non lanceur** (Barbare, Guerrier, Moine, Roublard) | CA, Initiative, Vitesse, Perception passive, Inspiration héroïque, ressource 1, ressource 2, Attaques/action ou dé | Attaques | « Combat » 1×4 : Ce tour (ligne), puis ressources |
| ex. Barbare | CA, Init., Vitesse, Perc., Insp., **Rage**, **Témérité**, Attaques/action | Attaques | Rage implacable dès le niv. 11 |
| ex. Guerrier | CA, Init., Vitesse, Perc., Insp., **Second souffle**, **Fougue**, Attaques/action | Attaques | Dés de supériorité (Maître de guerre) |
| ex. Moine | CA, Init., Vitesse, Perc., Insp., **Points de Credo**, **Arts martiaux**, DD d'aptitude | Attaques | Métabolisme surnaturel |
| ex. Roublard | CA, Init., Vitesse, Perc., Insp., **Attaque sournoise**, DD d'aptitude, Munitions ou Visée appliquée | Attaques | — |
| **Demi-lanceur** (Paladin, Rôdeur ; et tiers : Chevalier occulte, Arnaqueur arcanique) | CA, Init., Vitesse, Perc., DD des sorts, Emplacements niv. 1, ressource 1, Concentration ou Insp. | Sorts | « Magie » : Emplacements (ligne) |
| ex. Paladin | CA, Init., Vitesse, Perc., DD, **Imposition des mains**, **Conduit divin**, Aura | Sorts | Châtiment de paladin, Emplacements |
| ex. Rôdeur | CA, Init., Vitesse, Perc., DD, **Ennemi juré**, Emplacements niv. 1, Concentration | Sorts | Compagnon (Belluaire) |
| **Lanceur complet** (Barde, Clerc, Druide, Ensorceleur, Magicien) | CA, Init., Vitesse, Perc., DD des sorts, Attaque de sort, ressource 1, Concentration | Sorts | « Magie » : Emplacements tous niveaux (ligne ou bandeau) |
| ex. Barde | … + **Inspiration bardique** | Sorts | |
| ex. Clerc | … + **Conduit divin** | Sorts | |
| ex. Druide | … + **Forme sauvage** | Sorts | Forme active 2×2 |
| ex. Ensorceleur | … + **Points de sorcellerie** (Sorcellerie innée en bloc perso) | Sorts | |
| ex. Magicien | … + **Restauration magique** (Égide ou Présage selon la sous-classe) | Sorts | |
| **Occultiste** | CA, Init., Vitesse, Perc., DD, Emplacements de pacte, Rouerie magique, Concentration | Sorts | Arcanum mystique (1×2) dès le niv. 11, Manifestations |

---

## 5. Tuiles « maison » (menu futur, hors « À la table »)

Ce qu'une tuile maison devrait pouvoir définir, en restant simple :

| Champ | Choix | Remarque |
|---|---|---|
| Nom et **nom court** | texte ; nom court ≤ 10 caractères | le nom court sert en case étroite |
| Icône | choix dans une liste fermée | lisible à 80 px |
| Type | valeur · compteur · réserve · dé · compteur + dé · bascule · note · règle | reprend les 8 gabarits : les formats se calculent tout seuls |
| Valeur ou maximum | nombre fixe, ou formule simple : BM, mod. d'une caractéristique, niveau (total ou de classe), avec × et + | pas de conditions (« si… alors ») |
| Dé | d4 à d20, nombre de dés, bonus | optionnel ; un jet apparaît au toucher |
| Recharge | aucune · RC · RL · 1 au RC et tout au RL · aube · à l'Initiative · chaque tour · manuelle | couvre tous les cas du catalogue |
| Affichage | ronds ou chiffres (automatique selon la largeur) | |
| Texte de règle | texte libre écrit par le joueur + lien facultatif | jamais de texte importé d'un site |
| Formats | calculés selon le type et la longueur du nom ; le joueur peut en interdire | évite les tuiles illisibles |
| Rattachement | perso uniquement (option plus tard : copier vers un autre perso) | |
| Point de départ | « Dupliquer une tuile existante » | le plus rapide pour un objet maison |

Garde-fous : une tuile maison n'agit sur aucune autre valeur (ne change ni la CA ni les PV) ; elle est stockée dans la fiche et suit les sauvegardes.

---

## 6. Questions ouvertes pour Angle

1. **Inspiration héroïque, Concentration et Repos** : deviennent-ils des tuiles **à la place** de la carte PV, ou **en plus** (la carte gardant une version minimale) ?
2. **Format 1×2** : l'ajoute-t-on (recommandé) ? Et le bandeau 2×N pour Notes et Ce tour ? Le 2×1 peut-il attendre ?
3. **Raccourcis** : une tuile étroite (CA, Fougue…) peut-elle aller dans une case de Raccourcis, avec son info dessous, ou les Raccourcis sont-ils réservés aux tuiles maîtresses et outils ?
4. **Placement d'office** : à la montée de niveau, accepter qu'une tuile ★★★ soit proposée dans une case vide (un toucher pour accepter), ou seulement le point sur « Personnaliser » ?
5. **Tuiles bascule** (Témérité, Attaque sournoise « utilisée ce tour », Visée appliquée) : les veux-tu, avec remise à zéro par « Ce tour », ou est-ce trop de suivi ?
6. **Compagnon** (destrier, bête du Belluaire, familier) : tuile avec PV dans « À la table », ou plus tard une fiche séparée ?
7. **Libellés** : quelle source fait foi pour les noms (VF officielle du Manuel des joueurs 2024 ou AideDD) ? Exemples à trancher : « Restauration arcanique » / « Restauration magique », « Botte d'arme » / « Bottes d'arme », « Mante de majesté ».
8. **Effets en cours** (durées en rounds, cibles marquées) : utile, ou hors de « moins mais mieux » ?
9. **Présage du Devin et Présage cosmique** : l'appli tire-t-elle les dés au RL, ou le joueur saisit-il ses jets physiques ?
10. **Multiclasse** : une seule tuile Conduit divin si Clerc et Paladin, ou une par classe ? Hors périmètre pour l'instant ?

---

## 6 bis. Décisions d'Angle (11 nov. 2026)

Toutes les recommandations de Claude sont validées :
1. Inspiration héroïque, Concentration et Repos deviennent des tuiles ; la carte PV ne garde que PV, états et emplacements, plus la Concentration tant qu'un sort est en cours.
2. Format 1×2 ajouté ; bandeau de 2 lignes sur toute la largeur pour Ce tour et Notes ; le 2×1 attend.
3. Une tuile de valeur peut aller dans les Raccourcis si elle est éligible (règle de la largeur réelle de la case).
4. Montée de niveau : une nouvelle tuile est seulement signalée (point dans le menu de personnalisation), jamais placée d'office.
5. Tuiles bascule : plus tard.
6. Compagnon : tuile simple (PV et CA) ; fiche complète plus tard.
7. Noms : la VF officielle du Manuel des joueurs 2024 fait foi ; cas douteux vérifiés un par un.
8. Effets en cours : non pour l'instant.
9. Présage : tirage par l'appli ou saisie des dés physiques, selon le réglage des dés.
10. Multiclasse : une tuile par classe, traité plus tard.

**Précision d'Angle (11 nov. 2026) : « Ce tour » ne sera jamais une tuile.** Il reste un bloc non personnalisable, qu'on peut seulement déplacer ou supprimer ; les mentions de Ce tour en tuile ou en bandeau dans ce document sont caduques.

**Décision d'Angle (11 nov. 2026) : Repères redevient immuable et « sur mesure ».** Son contenu est calculé par l'appli (classe, sous-classe, espèce, dons) ; le joueur peut le déplacer mais ni le modifier ni le supprimer. Grille de 4 colonnes à hauteur variable (2 rangées en général, 3 au plus, sans case vide). 4 valeurs communes (CA, Initiative, Vitesse, Perception passive) + jusqu'à 4 valeurs propres (DD et attaque de sort, attaques par action, dés de classe, DD d'aptitude…). Sortent de Repères : Taille, Maîtrise, Dés de vie, Intuition et Investigation passives (restent sur la Feuille ; tuiles toujours disponibles pour les blocs créés). **Les ressources à dépenser (Rage, Fougue, Focus, Conduit divin…) vont dans un bloc séparé « Ressources »**, lui aussi sur mesure et à hauteur variable (lot T3).

Ordre de travail : les tuiles d'abord, dans les fenêtres actuelles ; le menu de personnalisation dédié (« À la table » immuable) viendra ensuite et réutilisera la grille et la réserve.

## 7. Sources

- SRD 5.2.1, Wizards of the Coast, CC-BY-4.0 : https://dndbeyond.com/srd — PDF : https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf
- Licence CC-BY-4.0 : https://creativecommons.org/licenses/by/4.0/
- D&D Beyond, les 10 espèces du Player's Handbook 2024 : https://www.dndbeyond.com/posts/1783-the-10-species-in-the-2024-players-handbook
- D&D Beyond, publication des règles de base 2024 en Creative Commons : https://www.dndbeyond.com/posts/1949-you-can-now-publish-your-own-creations-using-the
- AideDD, règles 2024 (vérification des noms français uniquement, aucun texte repris) : classes https://www.aidedd.org/regles-24/classes/ (Barbare, Barde, Clerc, Druide, Ensorceleur, Guerrier, Magicien, Moine, Occultiste, Paladin, Rôdeur, Roublard) ; espèces https://www.aidedd.org/regles-24/origines-des-personnages/description-des-especes/ ; glossaire https://www.aidedd.org/regles-24/glossaire/ ; don Chanceux https://www.aidedd.org/feat/fr/chanceux
- Attribution requise si du texte SRD est repris plus tard : « This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License. »

**Limites de vérification** : nombres d'utilisations et recharges vérifiés sur les pages de classe AideDD 2024 et le SRD ; les noms français des sous-classes hors SRD non détaillées par AideDD (Zélateur, Astres, Sorcellerie aberrante et mécanique, Soldat psi, Credo de la Miséricorde, Âme acérée, Vagabond féerique, Belluaire avancé), de l'aasimar, des dons généraux et des faveurs épiques, et les noms des propriétés de Botte d'arme sont **à confirmer** avec la VF officielle.
