# Audit graphique et UX — ChatGPT (13 nov. 2026, avant le studio de dés)

Texte transmis par Angle. Suite donnée : chantiers 30, 31, 32 et 23 de la feuille de route (section 14 de `passation-appli-dnd.md`).

J’ai approfondi l’audit avec six profils de test, sur ordinateur et sur un écran de 390 px :

- **Magicien elfe** : sorts, emplacements et réaction.
- **Clerc nain** : sorts, concentration et ressource d’espèce.
- **Paladin drakéide** : Imposition des mains et souffle.
- **Roublard halfelin** : profil sans bloc de ressources affiché.
- **Barbare orc** : Rage et plusieurs ressources.
- **Druide elfe** : sorts et concentration.

J’ai aussi suivi une attaque et une utilisation d’Imposition des mains jusqu’à leur résultat, puis simulé l’affichage d’un magicien aux niveaux 10 et 20 pour observer la densité des emplacements. Ces deux derniers affichages ne représentent pas des personnages complets montés normalement : ils servent à éprouver la mise en page.

**Le constat principal : je n’ai pas observé de débordement horizontal sur ces profils, mais plusieurs endroits deviennent difficiles à lire ou à comprendre lorsque les capacités s’accumulent.** Le point le plus sensible est la cohabitation entre ressources, PV et sorts.

### 1. Une même ressource peut apparaître à plusieurs endroits

Sur le paladin, **Imposition des mains** apparaît à la fois dans la carte PV et dans le bloc Ressources. Chez le magicien et le druide de test, c’est le cas d’**Initié à la magie**. Chez le barbare, la Rage est également présente dans les deux zones.

La répétition peut être pratique : elle permet d’accéder à une ressource sans changer ses habitudes. Mais la présentation diffère : la carte PV montre une fraction, tandis que le bloc Ressources utilise des pastilles. Il faut comprendre soi-même que les deux affichages correspondent à la même réserve.

**Ma proposition :** conserver le double accès lorsqu’il est utile, mais rapprocher leur présentation et leur nom. Une fraction associée aux pastilles rendrait le lien plus évident. Il faudrait aussi vérifier ensemble si toutes les ressources méritent une place dans la carte PV, ou seulement certaines.

### 2. La carte PV concentre beaucoup de fonctions chez les lanceurs de sorts

Sur le druide, elle réunit les PV, les dégâts et soins, les PV temporaires, le modificateur de maximum, les dés de vie, le repos, une ressource, les emplacements de sorts et la concentration.

Au niveau 20 simulé, les neuf niveaux d’emplacements tiennent sur le téléphone sans déborder, ce qui est positif. En revanche, les numéros de niveau et les pastilles deviennent petits, et il faut examiner la grille pour trouver rapidement l’emplacement voulu. La carte s’allonge également avant même d’ajouter d’éventuels états.

**Ma proposition pour notre futur travail sur la carte PV :** garder les PV comme point focal, puis donner aux emplacements et à la concentration des zones visuellement distinctes. Pour les emplacements, j’explorerais une lecture du type **« niv. 1 : 4/4 »**, tout en conservant un accès tactile adapté.

### 3. Les libellés longs mettent certaines tuiles sous pression

Le cas le plus visible est **« Initié à la magie (sort de niveau 1) »** : dans la petite tuile intégrée à la carte PV, le nom doit se répartir sur plusieurs lignes et devient difficile à parcourir. Dans le bloc Ressources, la tuile est beaucoup plus large, mais le même nom occupe une grande place.

Sur le paladin, **« Imposition des mains (PV) »** reste compréhensible, mais montre le même problème à une moindre échelle.

**Ma proposition :** établir, comme pour les repères, des libellés compacts propres à chaque capacité quand l’espace manque, en conservant toujours le nom complet dans la fenêtre et le nom accessible. Par exemple, sous réserve de validation : **« Initié à la magie »**, avec le niveau dans la fenêtre ou sur une ligne secondaire si nécessaire.

### 4. Les listes de sorts peuvent devenir très hautes

Dans la fenêtre Sorts du magicien, **Bouclier** affiche sur sa ligne une condition de réaction complète : elle prend plusieurs lignes sur mobile et repousse les commandes vers le bas. Avec trois sorts, cela reste utilisable ; avec une liste plus fournie, le balayage risque d’être lent.

À l’inverse, les informations **Toucher**, **Dégâts**, **Lancer** et le niveau sont bien visibles : elles sont utiles à la table.

**Ma proposition :** garder sur la ligne le nom, le temps d’incantation sous une forme courte, la portée et les actions disponibles. Placer la condition détaillée de réaction dans la fiche du sort, accessible par le bouton d’information. Pour Bouclier, la ligne pourrait par exemple afficher **« Réaction · personnelle »**.

### 5. Les nombres de « Ce tour » restent ambigus selon le profil

Je précise mon constat précédent : le nombre semble correspondre aux options propres au personnage présentées directement, tandis que les actions communes sont regroupées séparément. Par exemple, la fenêtre Action du magicien affiche ses deux armes et deux sorts, puis **« Autres actions (10) »**. La tuile annonce **« 4 options »**.

Le comportement peut donc être cohérent techniquement, mais le libellé ne permet pas de deviner cette distinction.

**Ma proposition :** soit inclure les actions communes dans le nombre, soit indiquer clairement le périmètre du compteur. Avant de choisir une formulation, il faudrait vérifier qu’elle reste juste pour les réactions, les sorts et les aptitudes.

### 6. Certaines différences d’interaction ne sont pas assez visibles

Dans « Ce tour », **Actions**, **Actions bonus**, **Réactions** et **Autre** ouvrent une fenêtre. **Mouvement**, lui, change directement d’état. Pourtant, les tuiles ont une présentation très proche.

Ce n’est pas bloquant une fois qu’on le sait, mais à la première utilisation, on ne peut pas anticiper le résultat du toucher.

**Ma proposition :** garder le design Arsenal validé et ajouter un indice discret sur les tuiles qui changent immédiatement d’état : par exemple un indicateur « À faire / Terminé » plus explicite. Les tuiles ouvrant une fenêtre pourraient conserver leur traitement actuel.

### 7. Le parcours d’attaque est plus court, mais demande encore de comprendre la succession des gestes

Sur le paladin, j’ai suivi : **Actions → Toucher → Normal → saisie du d20 → Raté**. Le retour à la liste indique bien **« Action consommée »**, avec une possibilité d’annuler cet état : c’est clair après coup.

Dans la fenêtre de jet, les boutons **Dégâts**, **Critique** et **Raté** sont déjà visibles avant la saisie. Je comprends l’intérêt pour accélérer le tour, mais une personne qui découvre l’interface peut hésiter sur l’ordre : faut-il saisir le dé, puis choisir l’un de ces boutons ?

**Ma proposition :** renforcer la phrase d’accompagnement, par exemple **« Saisis ton d20, puis choisis la suite »**, et vérifier visuellement le comportement des boutons avant et après saisie. Je conserverais la décision de toucher ou rater entre les mains du joueur.

### 8. Imposition des mains fonctionne, mais le menu mérite d’être plus explicite

J’ai utilisé 3 points de la réserve du paladin. La fenêtre de résultat indique correctement **3 PV pris, 2/5 restants et action bonus consommée**, puis propose **« Appliquer à moi »** et **« Annuler l’utilisation »**. C’est un bon retour d’état.

Le petit menu précédent mélange cependant un champ, un bouton « Utiliser », « Tout », « Retirer Empoisonné » et « Détails ». Sur mobile, sa relation avec la ligne d’origine demande un instant de lecture.

**Ma proposition :** lui donner un titre plus direct, par exemple **« Combien de PV utiliser ? »**, et mieux séparer la saisie des autres usages possibles. Je conserverais le résultat et l’annulation, qui sont utiles.

### 9. L’absence de nombre sur certaines tuiles peut être interprétée de plusieurs façons

Chez plusieurs profils, **Actions bonus** ou **Réactions** apparaissent sans nombre, tandis que d’autres tuiles affichent « 1 option » ou « 2 options ». La fenêtre Action bonus du magicien précise ensuite **« Rien de propre à ton personnage »**, tout en permettant de marquer l’action comme consommée.

Sans ouvrir la fenêtre, l’absence de nombre peut vouloir dire « aucune option », « nombre inconnu » ou simplement « information non affichée ».

**Ma proposition :** choisir un état explicite, par exemple **« Aucune option propre »**, si cela tient dans le gabarit, ou une formulation compacte accompagnée d’une explication dans la fenêtre. Il faut préserver la possibilité de marquer l’action même lorsqu’aucune option propre n’est listée.

### 10. Les pictogrammes et les noms complets restent importants selon les espèces

Le drakéide ajoute notamment **DD du souffle** et la ressource **Souffle** ; le nain et l’orc apportent leurs propres ressources. C’est là que l’interface doit continuer à rester compréhensible quand plusieurs capacités ne sont pas familières.

Sur les profils observés, les tuiles tiennent à l’écran, mais le nombre de repères et de ressources modifie sensiblement la hauteur de la page. Le système de tuiles personnalisables est donc précieux : les besoins d’un barbare orc ne sont pas ceux d’un magicien elfe.

**Ma proposition :** lors du choix des tuiles, montrer clairement les capacités propres à l’espèce et à la classe, avec un aperçu de leur nom complet. Je n’imposerais pas une disposition identique à tous les personnages.

### Ce que je retiens pour la suite

Je travaillerais dans cet ordre :

1. **Carte PV et ressources** : duplication, noms longs, concentration et emplacements.
2. **Lisibilité des listes de sorts et d’actions sur mobile**.
3. **Sens des compteurs et comportement des tuiles de « Ce tour »**.
4. **Petits ajustements des parcours de jet et d’utilisation de ressource**.

Je n’ai pas encore parcouru toutes les classes, toutes les espèces, les multiclassages ni une liste de sorts complète de haut niveau. Les captures et vérifications ont été faites avec des personnages temporaires ; **aucune fiche réelle ni source de l’application n’a été modifiée**.