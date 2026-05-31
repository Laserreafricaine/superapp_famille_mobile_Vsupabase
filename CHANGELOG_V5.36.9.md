# V5.36.9 — Parcours documents dans les dialogs

- Correction du parcours de création : après le premier enregistrement d’un élément compatible documents, le dialog reste ouvert.
- Le nouvel élément passe automatiquement en mode modification avec son ID réel.
- La section Documents bascule immédiatement de l’état “enregistre d’abord” vers la zone active de dépôt Supabase.
- À la réouverture d’un élément existant, la section Documents est visible immédiatement avec un état “Chargement des documents…”, puis Supabase hydrate la liste.
- La section Documents reste placée au-dessus de Visibilité.
- Mise à jour des versions d’assets/cache pour éviter de charger une ancienne version sur mobile/PWA.
