# Référentiel des tuiles d'« À la table »

État au 10 novembre 2026. Décisions d'Angle prises avec Claude ; rien n'est codé. Chantier décrit dans `claude/passation-appli-dnd.md` (section 15).

Ce référentiel liste **toutes les tuiles possibles**, à partir des règles D&D 2024 et de ce qu'affichent les autres applis (D&D Beyond, Le Compagnon). Les questions de tuiles obligatoires par classe, de défaut par classe et de nombre maximal de tuiles sont **mises de côté pour le moment** (décision d'Angle).

## Blocs et tailles (décidé avec Angle, 10 nov. 2026)

- **Repères** : 8 tuiles de valeurs, 2 rangées de 4.
- **Raccourcis** : 6 tuiles, 3 lignes de 2 ; tuiles larges avec une information sous le nom. **Par défaut** (décision d'Angle) : Tests de caractéristique, Jets de sauvegarde, États, Inventaire, Équipement, et une case vide.
- **Bloc personnalisé** : créé et nommé par l'utilisateur, absent par défaut ; toutes les tailles de 1×1 à 4×4 (lignes × colonnes) ; grille où une tuile peut occuper plusieurs cases (ex. Emplacements sur une ligne entière). Repères et Raccourcis sont des blocs du même système, livrés par défaut.
- Tous les blocs se réordonnent en **mode disposition** (verrouillé par défaut) ; ordre enregistré par perso.

## Principes décidés

- **Tuiles maîtresses** pour les jets : une tuile ouvre une popup avec tous les jets ou éléments qui en dépendent. Pas de raccourci individuel vers un jet, un sort ou une attaque (doublon avec la recherche et les futurs « plus utilisés »).
- **Seule exception : Initiative**, tuile individuelle (lancée à chaque combat).
- **Carte santé, hors tuiles** : PV, PV temporaires, dés de vie, Concentration (et son jet), Inspiration héroïque, jets contre la mort à 0 PV, Repos.
- Une tuile ne décide jamais à la place du MJ : elle affiche, ouvre un jet, un compteur ou une règle.
- Libellés à reprendre exactement de l'appli au moment du développement.

Légende. **Au toucher** : *affichage* (rien), *jet* (carte du jet), *compteur* (gestion de la ressource), *règle* (explication), *popup* (tuile maîtresse). **Appli** : ✓ valeur déjà calculée, ~ partielle, ✗ à construire.

## 1. Défense et survie

| Tuile | Au toucher | Appli |
|---|---|---|
| Classe d'armure | affichage (détail du calcul) | ✓ |
| Résistances, immunités, vulnérabilités | affichage | ✗ |
| Bouclier équipé | affichage | ✓ |

(PV, PV temporaires, dés de vie, jets contre la mort, Concentration, Inspiration et Repos : carte santé.)

## 2. Initiative, mouvement et corps

| Tuile | Au toucher | Appli |
|---|---|---|
| **Initiative** (seule tuile de jet individuelle) | jet | ✓ |
| Vitesse au sol | affichage | ✓ |
| Vitesses spéciales (vol, nage, escalade, fouissement) | affichage | ~ |
| Taille | affichage | ✓ |
| Saut en longueur / en hauteur | affichage + règle | ✗ |
| Capacité de port / charge | affichage | ~ |

## 3. Sens et valeurs passives

| Tuile | Au toucher | Appli |
|---|---|---|
| Perception passive | affichage | ✓ |
| Intuition passive | affichage | ~ |
| Investigation passive | affichage | ~ |
| Vision dans le noir (portée) | affichage + règle | ✗ |
| Autres sens (perception aveugle, perception des vibrations, vision véritable) | affichage + règle | ✗ |

## 4. Tuiles maîtresses

| Tuile | La popup contient | Appli |
|---|---|---|
| Tests de caractéristique | les 6 caractéristiques et leurs compétences | ✓ (bloc « Jets et fiche ») |
| Jets de sauvegarde | les 6 sauvegardes, plus la concentration | ✓ |
| Attaques | armes, mains nues, sorts d'attaque ; botte d'arme | ~ (aujourd'hui dans « Actions ») |
| Sorts | sorts préparés, emplacements, DD et attaque de sort | ~ (dans les popups d'actions) |
| Ressources | ressources de classe, sous-classe, espèce, dons, compteurs perso | ✗ |
| États | états, épuisement, règle de chaque état | ✓ |
| Inventaire | objets, charges, consommables, or | ✓ |
| Équipement | silhouette, mains, harmonisation | ✓ |

Les tuiles maîtresses remplaceraient le bloc « Jets et fiche » actuel.

## 5. Combat (valeurs)

| Tuile | Au toucher | Appli |
|---|---|---|
| Nombre d'attaques par action | affichage | ✓ |
| Bonus de maîtrise | affichage | ✓ |
| Réaction disponible | compteur (suivi du tour) | ✓ |

## 6. Magie (valeurs)

| Tuile | Au toucher | Appli |
|---|---|---|
| DD des sorts | affichage | ✓ |
| Emplacements, un niveau ou tous | compteur | ✓ |
| Emplacements de pacte | compteur | ✓ |
| Sorts préparés (nombre / max) | affichage | ✓ |

## 7. Ressources (une tuile par ressource, construite à partir de ce que le perso possède)

| Tuile | Au toucher | Appli |
|---|---|---|
| Chaque ressource de classe ou de sous-classe (ex. Rage, Inspiration bardique, Conduit divin, Forme sauvage, Points de sorcellerie, Second souffle, Imposition des mains, Restauration arcanique) | compteur | ✓ |
| Dé de ressource (inspiration bardique, arts martiaux, attaque sournoise…) | affichage | ~ |
| Ressource d'espèce (Souffle, Révélation céleste…) | compteur | ✓ |
| Ressource de don (Chanceux…) | compteur | ✓ |
| Compteur personnalisé du joueur | compteur | ✓ |

## 8. Objets et ressources matérielles

| Tuile | Au toucher | Appli |
|---|---|---|
| Charges d'un objet (baguette, bâton…) | compteur | ✓ |
| Munitions | compteur | ~ |
| Objets harmonisés (x/3) | affichage | ✓ |
| Potion ou consommable au choix | compteur | ✓ |
| Or / bourse | affichage | ✓ |

## 9. Pas des tuiles

Langues, maîtrises d'armes, d'armures et d'outils, historique, niveau et XP, alignement : texte long ou rarement utile en partie ; leur place est la future « Feuille » (passation, section 16).

## Reste à décider (plus tard)

- Tuiles obligatoires par classe, défaut par classe, nombre maximal de tuiles sur téléphone (pistes et problème du quota : passation, section 15).
- Interface en blocs à disposer soi-même (voir passation, idées notées).
