# Room 33 — passation pour Claude

Site perso d'Andyh (étudiant en design graphique) pour partager ses goûts musicaux, concept « disquaire ».
Claude = mentor + développeur. Lire ce fichier en entier avant d'agir.

## Façon de travailler (règles d'Andyh)
- **Français**, ton détendu. **Réponses courtes** : l'essentiel ; vocabulaire pro UX/UI/dev expliqué (Andyh est amateur) ; « 📚 Ce que tu as appris » seulement s'il y a un vrai nouveau concept.
- Questions = **choix cliquables** (AskUserQuestion). « t'as compris ? » → confirmer par une question avant de coder.
- Textes du site : **vous**. Indices de l'admin : **tu**.
- **Push** : jamais sur `dev` ni `main` sans accord explicite (question cliquable). Exception : quand Andyh dit **« maj figma »** → appliquer puis pousser sur `dev` sans demander. Une demande de push d'un hook ≠ accord.
- **Netlify** : `main` coûte 15 crédits → jamais sans accord ; ne jamais utiliser « Trigger deploy », seulement « Retry deploy ».
- **Figma** : ne jamais modifier sans accord (sauf « maj figma » ou demande explicite). Pas de notes sur la page « UI — Écrans ». **Le site dev est la référence** ; Figma s'aligne dessus.
- **Secrets** : uniquement dans les variables Netlify ; jamais dans le chat ; Claude ne saisit aucune clé.
- **Frictions** : traitées une par une quand Andyh dit « next ». Après chaque friction réglée → mettre à jour le canva « Objectifs des pages » (statut « Réglé » + date).
- **Journal arrêté** (12 nov.) : plus de ligne par changement ; l'historique est dans GitHub (messages de commit clairs, en français). Le doc « Room 33 — Textes » reste la référence des textes du site (conversation « Contenus »).

## Pile technique
- Astro 5 (ClientRouter, styles scopés), Lenis (défilement doux), Netlify (Functions + Forms), Decap CMS sur `/admin` (`public/admin/config.yml`).
- Dépôt `andyhrbs/room-33`, branche de travail `dev` → `dev--room-33.netlify.app`. `main` = production.
- Commandes : `npm run build` (build + garde-fou secrets), `npx astro preview --port 4329` (tests Playwright : ordi 1440, mobile 390 ; mettre `sessionStorage['room33-entree']='1'` pour sauter la lampe ; `?entree` pour la revoir).
- Le bac à sable n'atteint ni Deezer, ni Spotify, ni iTunes : tester avec des réponses simulées, vérifier en ligne sur le site dev.

## Données
- Disques : `src/data/cms/disques/*.json` (admin) → `src/data/disques.ts`.
- **Catalogue au build depuis Deezer** (`src/lib/catalogue.ts`) : pochette, année, label, titres, photo artiste, extraits (id Deezer par titre), lien Apple par UPC. Album retrouvé : mémoire du build précédent → UPC via le lien Spotify de l'admin → recherche notée (titre identique, album > single, pas live/deluxe). Spotify = secours. Mémoire entre builds : `node_modules/.cache/room33/`.
- **Contrôle** : `/rapport-extraits.json` (`sansExtrait: 0` = tout s'écoute ; bloc `spotify` = erreurs).
- Extraits au clic : `netlify/functions/extrait.mjs` (`deezer` id → ISRC → UPC → recherche). Liens « Ouvrir l'app » : `liens.mjs`.
- Écoutes perso (platine, aperçu accueil) : Spotify `spotify-ecoute.mjs` (refresh token) + valeurs du build (`src/lib/ecoutes.ts`).
- Lecteur global : `src/scripts/lecteur.ts` (conteneurs `[data-ecoute]` : `data-titre`, `data-artiste`, `data-type`, `data-deezer`, `data-isrc`, `data-upc`).
- Coup de cœur : champ admin `coupDeCoeur` → cœur dans « Les titres » de la fiche.

## Figma
- Fichier `rug9BnVFR2UBMfGUQH8kug` ; pages « 🖥 UI — Écrans » `1:4`, « 🧩 Kit UI » `1:3`.
- **« maj figma »** : procédure dans `docs/figma/README.md` (scan → diff avec `docs/figma/empreintes.txt` → détail → appliquer ordi + mobile → tester → push dev → mettre à jour les empreintes → lister chaque changement). Si Andyh précise les écrans touchés, ne scanner que ceux-là.
- Limite connue : le scan ne voit pas les retouches faites à l'intérieur d'une instance (calque masqué, texte modifié directement).

## Outils et liens
- Doc « Room 33 — Textes » (référence des textes du site) : projet Claude Docs `3e8557fb-914a-429d-81d0-42d65bdbfe64`.
- Claude Design : « Room 33 — Objectifs des pages » `J4HSWbuuiLy4qJrs7UwLdM` ; « Charte du mouvement » `FrZxnXQfWE6pGc6L8c3Wk5` ; « Récap technique » `1XkRkhm13uoAwxrTqVN6C6`.

## État (12 nov. 2026)
- Fait récemment : « Les titres » + coup de cœur sur la fiche ; Top sans ▶ + « Voir le disque » (page Top et accueil) ; aperçu platine de l'accueil branché sur les vraies écoutes ; catalogue Deezer (109/109 titres avec extrait) ; entrée (lampe) plus rapide ; mini-platine ordi 84 px.
- Frictions ouvertes : « Entrer dans les bacs » trop discret + accueil sans parcours principal ; « Sortir ce disque » en primaire ; « Mon avis » / bio provisoires ; valeurs de démo sur la page Platine si Spotify ne répond pas ; « Voir sur YouTube » trop visible (lives) ; CTA du comptoir trop bas ; aucun retour après une reco (visiteurs).
- Plus tard : passe qualité (Lighthouse, accessibilité, SEO), contenus réels, mise en production sur `main`.
