# SuperApp Famille Mobile — V5.27 « Refonte Courses & repas + logos 3D »

Grosse version : nouveaux logos d'apps, refonte complète Courses & repas,
cartes conditionnelles sur l'accueil, audit du scroll, et plein de fix
d'adaptation mobile.

## 1. Logos 3D des apps
- 6 nouveaux logos style 3D Pixar (maison, chariot courses, livres+pomme,
  cœur+stéthoscope, ballon+raquette, famille violette).
- Source : 6 PNG de 1254×1254 → convertis en **WebP optimisés**
  (de ~7.8 Mo à 109 Ko total).
- Appliqués **partout où il y avait un emoji de module** :
  cartes d'apps (accueil + Mes apps), entête des modules, onboarding,
  Paramètres → Applications, Catégories, Données de référence,
  Notifications, et onglets de modules dans les sous-panneaux.
- Logo Familles : la nouvelle image violette remplace l'ancien badge.

## 2. Inversions d'avatars dans 3 packs famille
Renommage des fichiers physiques (les références dans le code restent identiques) :
- **Asie** : `ado_fille` ↔ `petite_fille`
- **Mixte** : `ado_fille` ↔ `petite_fille`
- **Europe** : rotation à 3 → `ado_fille` devient `petite_fille`,
  `ado_garcon` devient `ado_fille`, `petite_fille` devient `ado_garcon`

## 3. Audit du scroll et de la navigation
**Plus de remontée parasite quand on clique sur un filtre ou une action :**
- `setView()` ne remet en haut **que si on change vraiment de vue** (pas si
  on rappelle setView sur la vue actuelle, ce qui arrive après filter/coche).
- `render()` **préserve la position de scroll** avant et après.
- Conséquence : cliquer sur une chip, cocher un élément, modifier, supprimer,
  filtrer par membre — on reste exactement où on était.

## 4. Boutons Santé centrés + cartes urgences
- Boutons « RV / Traitement / Document » : texte forcé à centrer dedans,
  flex-direction column, plus de débordement.
- Cartes Pompiers/Police/SAMU : nouveau placeholder « À renseigner » en
  **petit texte gris** (au lieu d'être de la taille des numéros) → plus
  de chevauchement entre les 3 cartes même sur écran < 380px.

## 5. Refonte complète Courses & repas
- **3 chips simples** au lieu de 5 : **Repas · Courses · Stock**.
- **Vue Repas** : carte « 🍽️ Aujourd'hui — [jour] » en vedette en haut
  avec Midi/Soir bien visibles, puis tableau Lun-Dim × Midi/Soir
  pour la semaine complète.
- **Vue Courses** : liste à cocher, ajout manuel, aucun lien automatique
  avec les repas.
- **Vue Stock** : liste enrichie avec niveau (Bon/Moyen/Faible).
  **Bouton « + Aux courses » apparaît automatiquement** quand un produit
  est marqué Faible → ajoute la ligne dans la liste de courses.
- **Frontières propres** entre la zone des chips (avec son propre fond
  blanc et son intitulé « FILTRER ») et le contenu en dessous.
- **Adaptation mobile du tableau hebdo** : les libellés de plats longs
  (Thieboudiène, Pâtes bolognaises) wrappent au lieu de déborder.

## 6. Accueil — cartes conditionnelles (« design qui s'efface »)
- **Carte « 🍽️ Aujourd'hui à table »** ne s'affiche que si **au moins un
  repas** (midi OU soir) est planifié pour aujourd'hui. Sinon : invisible.
  Pas de reproche silencieux à la mère qui n'a pas planifié.
- **Indicateur « 🛒 X courses en attente »** ne s'affiche que si la liste
  de courses est non vide.
- Les deux cartes cliquables → ouvrent directement la bonne vue.

## Tests d'exécution (8 catégories, toutes vertes)
- Logos 3D dans toutes les apps ✓
- Inversions avatars (hash vérifiés) ✓
- Scroll : setView intelligent + render préserve position ✓
- Cartes urgences avec placeholder réduit ✓
- 3 chips Courses & repas, vues Repas/Courses/Stock distinctes ✓
- Bouton « + Aux courses » fonctionne (5 → 6 courses) ✓
- Cartes accueil conditionnelles (apparaissent/disparaissent) ✓
- Non-régressions : médicaments dans Traitements, 6 modules OK, packs OK

## Conservé
- Tout le système de paliers de couleur par app (V5.24)
- Lisibilité des boutons V5.26
- Tableau menu semaine modèle de données (V5.11)
- Cartes membres riches (héritées de V5.13+)
