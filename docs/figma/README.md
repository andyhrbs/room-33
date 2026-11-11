# « maj figma » — procédure

Quand Andyh dit **« maj figma »**, on ne se fie pas à ce qu'il décrit ni à un coup d'œil : on passe **tout le fichier Figma** au crible pour retrouver chaque changement, au détail près, puis on l'applique sur le site (branche `dev`).

Fichier : `rug9BnVFR2UBMfGUQH8kug` — pages suivies : « 🖥 UI — Écrans » (`1:4`), « 🧩 Kit UI » (`1:3`), variables et styles de texte.

## Étapes

1. **Scanner** : coller `scan-figma.js` dans `use_figma` (lecture seule). Il renvoie une ligne `id empreinte` par bloc d'écran, par composant du Kit, par variable et par style de texte. Enregistrer la réponse dans un fichier (ex. `/tmp/scan.txt`).
2. **Comparer** : `node docs/figma/diff.mjs docs/figma/empreintes.txt /tmp/scan.txt` → blocs **modifiés**, **ajoutés**, **supprimés**.
3. **Lire le détail** : mettre les ids signalés dans `IDS` de `detail-figma.js` et le coller dans `use_figma`. On obtient, nœud par nœud : taille, fond, contour, rayon, auto-layout (gap, padding, alignement), texte exact, taille et style de texte, composant utilisé.
4. **Comparer au code**, propriété par propriété (textes, espacements, couleurs, tailles, ordre des éléments, versions ordi ET mobile). Un composant du Kit modifié → vérifier toutes les pages qui l'utilisent. Une variable modifiée → `src/styles/tokens.css`.
5. **Appliquer** sur `dev`, construire, tester (Playwright, ordi 1440 et mobile 390), pousser (« maj figma » vaut accord pour pousser sur `dev`, jamais sur `main`), noter au journal.
6. **Mettre à jour la référence** : remplacer `empreintes.txt` par le nouveau scan (garder la ligne de commentaire en tête, avec la date), et le committer avec le reste.

Lister dans la réponse **chaque** changement trouvé et ce qui a été fait, y compris ceux qu'Andyh n'a pas mentionnés.

## Limites

- Un bloc d'écran est suivi en entier : un seul pixel changé dedans le signale, `detail-figma.js` dit lequel.
- Les pages « Read me » et « UX — Recherche » ne sont pas suivies (pas de rendu sur le site).
- Les identifiants de variables ne comptent pas, seulement leurs noms et valeurs : relier une couche à une variable de même valeur la signale quand même (c'est voulu, ça peut changer le code).
