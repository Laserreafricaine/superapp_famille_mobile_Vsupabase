# SuperApp Famille Mobile — V5.36.10

## Documents Supabase — upload strict et diagnostic visible

- L’ajout d’un document est maintenant considéré comme réussi uniquement si :
  1. le fichier est envoyé dans Supabase Storage ;
  2. la ligne correspondante est créée dans `family_documents`.
- Si l’insertion dans `family_documents` échoue, le fichier Storage est supprimé pour éviter les fichiers orphelins.
- Les erreurs Supabase ne sont plus masquées : elles apparaissent dans la zone Documents.
- Les erreurs de lecture de `family_documents` sont affichées au lieu de montrer à tort “Aucun document attaché”.
- Le nom technique stocké dans Storage est sécurisé pour éviter les problèmes avec accents, apostrophes et caractères spéciaux.
- Cache PWA mis à jour en `5.36.10`.
