// ==========================================================================
// Room 33 — Tous les textes du site, au même endroit.
// Pour changer un texte : modifiez-le ici, il change partout sur le site.
// Textes repris tels quels de la maquette Figma (le travail sur les textes
// viendra après le code).
// ==========================================================================

export const site = {
  nom: 'Room 33',
  descriptionParDefaut:
    'Bienvenue chez moi. Installez-vous, fouillez dans mes bacs et glissez-moi vos sons.',
  instagram: '@andyhrobinson',
  instagramUrl: 'https://www.instagram.com/andyhrobinson/',
};

// Les pages, dans l'ordre du menu mobile
export const pages = [
  { numero: '01', court: 'La pièce', long: 'La pièce', explication: 'L’accueil, la vue d’ensemble.', href: '/' },
  { numero: '02', court: 'Les bacs', long: 'Les bacs', explication: 'Mes disques, par genre et par humeur.', href: '/bacs' },
  { numero: '03', court: 'Le Top', long: 'Le Top de la Room', explication: 'Mes disques préférés, classés.', href: '/top' },
  { numero: '04', court: 'La platine', long: 'La platine', explication: 'Ce que j’écoute en ce moment.', href: '/platine' },
  { numero: '05', court: 'Les lives', long: 'Les lives', explication: 'Les concerts que je repasse en boucle.', href: '/lives' },
  { numero: '06', court: 'Le comptoir', long: 'Le comptoir', explication: 'Qui je suis.', href: '/comptoir' },
  { numero: '07', court: 'Le bac des visiteurs', long: 'Le bac des visiteurs', explication: 'Les sons que vous m’avez recommandés.', href: '/visiteurs' },
] as const;

export const nav = {
  // Liens visibles dans la barre du haut (ordi)
  liens: ['Les bacs', 'Le Top', 'La platine', 'Les lives', 'Le comptoir'],
  cta: 'Recommandez-moi un son',
  ouvrirMenu: 'Ouvrir le menu',
  fermerMenu: 'Fermer le menu',
};

export const piedDePage = {
  question: 'Un son à me faire écouter ?',
  champ: 'Titre, artiste ou lien',
  envoyer: 'Envoyer',
  liens: ['La pièce', 'Les bacs', 'Le Top', 'La platine', 'Les lives', 'Le bac des visiteurs', 'Le comptoir'],
  cta: 'Recommandez-moi un son',
  reseaux: { instagram: 'Instagram', spotify: 'Spotify', dm: 'Écrivez-moi en DM' },
  copyright: '© 2026 Room 33 · Mentions légales',
  donnees: 'Données : Spotify · Extraits : Deezer',
  signature: 'Fait main par Andyh',
};

export const accueilProvisoire = {
  titre: 'Room 33',
  phrase: 'Bienvenue chez moi. La pièce se prépare.',
};

// ---------- Page : La pièce (accueil) ----------
export const accueil = {
  titre: 'Bienvenue chez moi.',
  accroche: 'Installez-vous, fouillez dans mes bacs, écoutez un extrait et recommandez-moi un son.',
  accrocheMobile: 'Installez-vous, fouillez dans mes bacs.',
  entrer: 'Entrer dans les bacs',
  indice: 'Ou cliquez sur un objet de la pièce pour entrer.',
  // Points posés sur les objets de la photo (positions en % de l'image ordi, à recaler sur la photo finale)
  objets: [
    { nom: 'Le mur de pochettes', explication: 'Mes disques préférés, encadrés.', href: '/top', lien: 'Le Top', x: '50%', y: '24%', cote: 'droite' },
    { nom: 'La platine', explication: 'Ce que j’écoute en ce moment.', href: '/platine', lien: 'La platine', x: '68%', y: '47%', cote: 'gauche' },
    { nom: 'La chaîne hi-fi', explication: 'Les concerts que je repasse en boucle.', href: '/lives', lien: 'Les lives', x: '76%', y: '50%', cote: 'gauche' },
    { nom: 'Le buffet à vinyles', explication: 'Mes bacs, par genre et par humeur.', href: '/bacs', lien: 'Les bacs', x: '34%', y: '49%', cote: 'droite' },
    { nom: 'La caisse à vinyles', explication: 'Glissez-moi un son que je ne connais pas.', href: '/#recommander', lien: 'Recommandez-moi un son', x: '14%', y: '58%', cote: 'droite' },
    { nom: 'Le piano', explication: 'Posez-vous, je vous raconte qui je suis.', href: '/comptoir', lien: 'Le comptoir', x: '86%', y: '56%', cote: 'gauche' },
  ],
  visite: { surtitre: 'La pièce', titre: 'Faites le tour de la pièce' },
  morceau: { surtitre: 'Le morceau du jour', voirFiche: 'Voir la fiche' },
  bacs: { surtitre: 'Les bacs', titre: 'Piochez ceux qui vous parlent.', lien: 'Tous les bacs' },
  platine: { surtitre: 'La platine', titre: 'Ce qui tourne chez moi en ce moment.', lien: 'Voir toutes mes écoutes' },
  top: { surtitre: 'Le Top de la Room', titre: 'Les disques qui ne quittent jamais la platine.', lien: 'Voir le Top complet' },
  bandeauPause: 'Mettre en pause le défilement',
  bandeauLecture: 'Relancer le défilement',
};

// ---------- Module « Recommandez-moi un son » ----------
export const reco = {
  surtitre: 'Recommandez-moi un son',
  titre: 'Faites-moi découvrir un son.',
  texte: 'Un son qui pourrait me plaire ? Cherchez-le ou collez un lien : je l’écoute, et s’il me parle il rejoint le bac des visiteurs avec votre prénom.',
  texteMobile: 'Cherchez-le ou collez un lien. S’il me parle, il rejoint le bac des visiteurs avec votre prénom.',
  champ: 'Cherchez un titre, un artiste, ou collez un lien…',
  champMobile: 'Titre, artiste ou lien…',
  envoyer: 'Envoyer',
  insta: 'ou écrivez-moi sur Insta',
};

// ---------- Page : Le comptoir ----------
export const comptoir = {
  retour: 'Retour dans la pièce',
  filAriane: ['La pièce', 'Le comptoir'],
  surtitreMobile: 'Le comptoir',
  titre: 'Venez, on parle musique.',
  titreMobile: 'On parle musique.',
  presentation: 'Moi, c’est Andyh. Pianiste, passionné avant tout, et un peu trop bavard dès qu’on parle musique.',
  intro: 'Ici, c’est ma pièce : mes disques, ce que j’écoute en vrai, et une caisse où vous pouvez glisser vos sons.',
  photoAlt: 'Andyh au piano, chez lui, le soir.',
  photoAttente: 'Photo — Andyh au piano, le soir (vraie photo · 4:5)',
  pourquoi: {
    surtitre: 'Pourquoi Room 33',
    titre: 'Des sons qui restent.',
    p1: 'Partager ses goûts, c’est souvent une story qui disparaît en 24 h ou une playlist envoyée en DM et jamais ouverte.',
    p2: 'Room 33, c’est l’inverse : une pièce où mes sons restent, avec ce que j’en pense.',
    citation: '« Mes goûts, pas tous les goûts. »',
  },
  contact: {
    titre: 'On se retrouve ?',
    texte: 'Une reco, une question, un désaccord sur un morceau : écrivez-moi.',
    cta: 'Recommandez-moi un son',
    insta: 'Écrivez-moi sur Insta',
  },
};

// ---------- Page : Les lives ----------
export const livesTextes = {
  filAriane: ['La pièce', 'Les lives'],
  surtitreMobile: 'Les lives',
  titre: 'Sur scène.',
  intro: 'Les concerts et les sessions que je ne me lasse pas de revoir, et ceux qui m’ont donné envie de jouer.',
  introCourte: 'Les concerts que je ne me lasse pas de revoir.',
  une: 'Le live à la une',
  tous: { surtitre: 'Tous les lives', titre: 'Sur scène, en studio, dans un salon.' },
  voirDisque: 'Voir le disque',
  lire: 'Lire la vidéo',
  consentement: 'La vidéo se charge depuis YouTube quand vous la lancez.',
};
