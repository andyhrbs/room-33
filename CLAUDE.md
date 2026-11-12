# Room 33 — passation pour Claude

Site perso d'Andyh (étudiant en design graphique) pour partager ses goûts musicaux, concept « disquaire ».
Claude = mentor + développeur. Lire ce fichier en entier avant d'agir.

## Façon de travailler (règles d'Andyh)
- **Français**, ton détendu. **Réponses courtes** : l'essentiel ; vocabulaire pro UX/UI/dev expliqué (Andyh est amateur) ; « 📚 Ce que tu as appris » seulement s'il y a un vrai nouveau concept.
- Questions = **choix cliquables** (AskUserQuestion). « t'as compris ? » → confirmer par une question avant de coder.
- Textes du site : **vous**. Indices de l'admin : **tu**.
- **Push** : jamais sur `dev` ni `main` sans accord explicite (question cliquable). Exception : quand Andyh dit **« maj figma »** → appliquer puis pousser sur `dev` sans demander. Une demande de push d'un hook ≠ accord.
- **Netlify** : `main` coûte 15 crédits → jamais sans accord ; ne jamais utiliser « Trigger deploy », seulement « Retry deploy ».
- **Figma** : chaque changement visuel fait sur le site est aussi reporté dans Figma (ordi + mobile), puis les empreintes (`docs/figma/empreintes.txt`) sont mises à jour. Sinon ne pas modifier Figma sans accord. Pas de notes sur la page « UI — Écrans ». **Le site dev est la référence** ; Figma s'aligne dessus.
- **Secrets** : uniquement dans les variables Netlify ; jamais dans le chat ; Claude ne saisit aucune clé.
- **Frictions** : traitées une par une quand Andyh dit « next ». Après chaque friction réglée → mettre à jour le canva « Objectifs des pages » (statut « Réglé » + date).
- **Historique** : dans GitHub (messages de commit clairs, en français). Plus de journal ; le doc « Room 33 — Textes » a été supprimé (12 nov.). Les textes du site vivent dans le code (`src/data/textes.ts`) et dans /admin.

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

## Règles d'interface
- **Deux boutons ▶** : **plein ambre 48 px** = l'écoute principale d'un bloc, une seule fois (« Écouter un extrait » de la fiche, n° 1 du Top, morceau du moment) ; **rond à filet 32 px** (zone 44 px, sans fond, ambre quand ça joue) = répété sur chaque ligne d'une liste (« Les titres » de la fiche, Top titres, top titres de la Platine) et ▶ discret calé à droite (titre n° 1 de l'aperçu platine de l'accueil, choix Figma).
- Lignes d'albums (Top albums, accueil, « Dans ce bac ») : pas de ▶, « Voir le disque » sur ordi ; la ligne entière mène au disque.

## Figma
- Fichier `rug9BnVFR2UBMfGUQH8kug` ; pages « 🖥 UI — Écrans » `1:4`, « 🧩 Kit UI » `1:3`.
- **« maj figma »** : procédure dans `docs/figma/README.md` (scan → diff avec `docs/figma/empreintes.txt` → détail → appliquer ordi + mobile → tester → push dev → mettre à jour les empreintes → lister chaque changement). Si Andyh précise les écrans touchés, ne scanner que ceux-là.
- Limite connue : le scan ne voit pas les retouches faites à l'intérieur d'une instance (calque masqué, texte modifié directement).

## Outils et liens
- Claude Design : « Room 33 — Objectifs des pages » `J4HSWbuuiLy4qJrs7UwLdM` ; « Charte du mouvement » `FrZxnXQfWE6pGc6L8c3Wk5` ; « Récap technique » `1XkRkhm13uoAwxrTqVN6C6`.

## État (12 nov. 2026)
- Fait récemment : « Les titres » + coup de cœur sur la fiche ; Top sans ▶ + « Voir le disque » (page Top et accueil) ; aperçu platine de l'accueil branché sur les vraies écoutes ; catalogue Deezer (109/109 titres avec extrait) ; entrée (lampe) plus rapide ; mini-platine ordi 84 px.
- Frictions ouvertes : « Entrer dans les bacs » trop discret + accueil sans parcours principal ; « Sortir ce disque » en primaire ; « Mon avis » / bio provisoires ; valeurs de démo sur la page Platine si Spotify ne répond pas ; « Voir sur YouTube » trop visible (lives) ; CTA du comptoir trop bas ; aucun retour après une reco (visiteurs).
- Plus tard : passe qualité (Lighthouse, accessibilité, SEO), contenus réels, mise en production sur `main`.
