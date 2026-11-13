# Sources de D&D Compagnon

L'application distribuée est un fichier HTML autonome. Elle est reconstruite depuis ces sources ; il ne faut jamais modifier directement les fichiers de `dist/`.

## Organisation

- `shell.html` : structure HTML et repères d'assemblage.
- `styles.css`, `theme.css` : présentation et thèmes.
- `js/01-base.js` à `js/11-evenements.js` : logique de l'application, concaténée dans l'ordre des noms.
- `js/02-plateforme.js` : seul module autorisé à communiquer directement avec l'API Claude. Sans cette API, l'application fonctionne localement.
- `data/srd-data.json` : catalogue SRD embarqué.
- `data/hb-cat.json` : catalogue hors SRD embarqué.
- `build.py` : validation des sources et construction.
- `studio/studio.html` : interface et simulation du studio de dés.
- `vendor/` : moteurs 3D et physique et leurs licences, embarqués dans le HTML construit.
- `tests/run.js` : tests Playwright sans données personnelles réelles.
- `outils/` : sources et générateur du catalogue hors SRD.

Les données SRD et hors SRD font partie des sources. La construction échoue si l'un des catalogues est absent, invalide ou manifestement incomplet.

## Construire

Depuis ce dossier :

```bash
python3 build.py
```

La commande produit :

- `dist/index.html` : fichier destiné à la publication ;
- `dist/dnd-compagnon.html` : fichier autonome à transmettre ;
- `dist/main.js` : JavaScript intermédiaire utilisé pour le contrôle syntaxique.

Les deux fichiers HTML contiennent systématiquement les catalogues SRD et hors SRD. Ils sont vierges de tout personnage.
Le studio de dés et ses moteurs sont intégrés au fichier : aucune connexion n'est nécessaire pour les charger. Ses préférences restent dans le navigateur sous `registre-dice-studio-v1`, séparément des fiches de personnage.
Dans Réglages, l’interrupteur « Dés 3D » est grisé tant que « Jets virtuels » est désactivé. Le choix est conservé sous `registre-virtual-dice-display`. Tous les jets virtuels passent par un même chemin (`roll3d` dans `js/05-studio.js`) : avec les dés 3D, le moteur lance d'abord les dés que le jet va tirer, puis le calcul habituel tourne une fois les dés arrêtés en lisant leurs faces (`rnd` les prend dans l'ordre). Aucun résultat, journal ni dépense n'a lieu avant l'arrêt ; quitter la fenêtre ou la vue pendant le lancer l'annule. Les dés roulent toujours au-dessus de la page (le mode « avec plateau » a été retiré) ; hors fenêtre de jet, « Passer l'animation » flotte en bas de l'écran.
Pour préparer cette intégration, `rollExpr` renvoie aussi le détail ordonné des dés tirés, y compris les dés relancés et le signe de chaque terme. Un jet de d20 normal ne tire qu'un dé.

## Tester

```bash
node tests/run.js dist/dnd-compagnon.html                      # toute la suite
node tests/run.js dist/dnd-compagnon.html --only "Pavé"        # seulement les tests dont le nom contient « Pavé »
```

`--only` est répétable et ignore les majuscules. Il sert pendant le travail ; toute la suite reste obligatoire une fois à la fin de chaque lot (règle dans `AGENTS.md`). Une sélection qui ne correspond à aucun test échoue au lieu d'afficher un faux succès.

Ajouter ou adapter un test pour chaque correction fonctionnelle. Les tests créent leurs propres personnages temporaires et simulent les capacités Claude quand elles sont nécessaires.

## Régénérer le catalogue hors SRD

Modifier `outils/cat_src.py` ou `outils/cat_phb.json`, puis exécuter :

```bash
python3 outils/build_cat.py
python3 build.py
```

Le catalogue ne contient que les noms, livres, liens et données mécaniques prévues ; il ne doit pas recopier le texte intégral des ouvrages hors SRD.

## Règles de maintenance

- Ne jamais intégrer un personnage réel ou de démonstration dans la version distribuée.
- Ne jamais dépendre d'une ancienne page publiée pour construire l'application.
- Ne pas appeler directement `window.claude` ailleurs que dans `js/02-plateforme.js`.
- Conserver les anciens fichiers personnels en dehors de `dist/` ; une reconstruction remplace uniquement les produits de `dist/`.

## Dés virtuels (préférence globale)

Les dés virtuels sont verrouillés par défaut. L’interrupteur de « À la table », à côté des notes et de l’historique, active tous les jets virtuels pour tous les personnages. Le choix est conservé uniquement dans ce navigateur sous la clé `registre-virtual-dice` (`1` / `0`), indépendamment des personnages et des imports. `js/03-demarrage.js` expose `virtualDiceEnabled()` et `setVirtualDice()` pour réutiliser ce réglage dans le futur menu « Réglages généraux », avec le thème et les autres préférences.

Tout nouveau contrôle aléatoire doit porter `data-virtual` et son action doit figurer dans `VIRTUAL_ACTIONS`. Les événements sont bloqués avant tout tirage ou dépense ; les fonctions de dés contrôlent également le verrou. Les modes sont exclusifs : en mode physique, seuls les champs et le pavé de saisie sont disponibles ; en mode virtuel, ces champs et leurs validations sont masqués et désactivés. Les bonus et la sélection automatique du dé sont appliqués dans les deux modes. Aucun curseur de saisie n’est utilisé.

La Frappe occulte et les formules libres acceptent un total de dés physiques. Lorsqu’un repos doit récupérer des charges aléatoires et que les dés virtuels sont verrouillés, la récupération est mise en attente sur l’objet et un champ apparaît dans « À la table ». Saisir uniquement le total des dés : le bonus de la formule est ajouté par l’application. Cette attente est sauvegardée avec le personnage.

Les tests couvrent le verrou et sa persistance, l’absence de dépense en cas de lancer bloqué, les états et les dés physiques, les critiques, la concentration, les dés de vie, les formules libres, la création, la Frappe occulte, les charges au repos et la largeur iPhone. Le placeholder de recherche est conservé ; sa révision et le menu de réglages généraux restent des chantiers futurs.

## Pavé numérique des dés physiques

En mode physique, toucher un champ de résultat de dé ouvre un pavé numérique intégré. Le mode virtuel interdit la saisie physique et l’ouverture du pavé. Il propose les chiffres, Effacer, retour arrière, Annuler et Valider, avec contrôle des bornes du dé. La valeur n’est appliquée et journalisée qu’après validation. Le clavier physique reste utilisable (chiffres, Entrée, Échap) ; Entrée ou Espace sur un champ ouvre aussi le pavé. Le pavé couvre les d20, les dégâts, la concentration, les dés de vie, les jets contre la mort, les formules libres, les charges, la Frappe occulte et les dés de création.

## Suivi du tour dans « À la table »

Un jet d’attaque virtuel ou un jet physique complet consomme automatiquement le coût renseigné : Action, Action bonus ou Réaction. **Une seule validation** : le bouton Valider du pavé enregistre le jet dès que tous les dés nécessaires sont saisis (les deux d20 en avantage ou désavantage) ; il n’y a plus de bouton « Valider le jet » ni « Valider les dégâts ». Une saisie au clavier sans le pavé est enregistrée quand on quitte le champ. Dans les formulaires (concentration, dés de vie, jets contre la mort, charges, Frappe occulte, jet libre), le Valider du pavé applique aussi la saisie ; le bouton Appliquer reste pour la saisie au clavier, sans doublon. Un jet physique n’est jamais journalisé deux fois pour la même saisie. Les dégâts d’une arme, les critiques et leurs relances ne changent pas le suivi du tour. Les attaques supplémentaires restent accessibles ; l’application suit un état consommé, pas un compteur d’attaques.

La carte Détails reste ouverte et affiche le résultat ainsi que la confirmation du coût consommé. `Annuler la consommation` restaure uniquement ce coût, sans effacer les résultats ou l’historique et sans rendre d’emplacement, de charge ou de ressource. Les actions sans jet gardent une validation explicite. Un sort ou un objet est déclaré au premier lancer/jet physique validé, ou par son bouton explicite ; les dépenses déjà effectuées dans cette carte ne sont pas répétées lors des relances. La consultation seule ne dépense rien. L’ancienne annulation globale du lancement du sort est remplacée dans la carte par l’annulation limitée au suivi du tour.

Les coûts absents ne sont pas déduits d’une intention narrative. Les capacités dont le coût est modifiable conservent leur sélecteur existant. Mouvement et Autre sont des jalons exclusivement manuels, annulables. Les nombres d’options sont présentés entre parenthèses, les états consommés/terminés sont libellés explicitement, et Nouveau tour remet tous ces états à zéro. Les rituels et les utilisations de coût « Autre » ne terminent pas automatiquement ce jalon.
