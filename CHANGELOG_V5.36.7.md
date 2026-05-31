# V5.36.7 — Correctif Documents Supabase / iPhone

## Documents Supabase
- Correction de l'ouverture des documents sur iPhone/Safari : l'onglet est ouvert immédiatement au clic, puis redirigé vers l'URL signée Supabase.
- Ajout d'un bouton Télécharger en complément du bouton Ouvrir.
- Sécurisation des appels JavaScript inline avec chemins Supabase contenant accents, apostrophes ou caractères spéciaux.
- Correction du module enregistré lors de l'upload : le document est maintenant rattaché au module canonique de l'item, et non à la collection technique.
- Les documents existants avec anciens modules techniques sont relus via le contexte de leur item quand c'est possible.

## Vue documents
- Familles > Documents devient une vue globale de tous les documents Supabase.
- Ajout des filtres chips par module, membre et catégorie.
- Dans chaque module, la vue Documents affiche les documents rattachés au module concerné.
- Chaque document affiche son contexte : module, item lié, membre, catégorie et taille.

## Sport / Loisir / Voyage
- Correction du registre interne pour retrouver les items Loisirs, Voyages, Checklist Loisirs et Checklist Voyages lors du rattachement documentaire.
