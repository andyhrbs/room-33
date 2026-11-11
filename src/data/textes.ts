// ==========================================================================
// Room 33 — Tous les textes du site, au même endroit.
// Pour changer un texte : modifiez-le ici, il change partout sur le site.
// Textes repris tels quels de la maquette Figma (le travail sur les textes
// viendra après le code).
// ==========================================================================
import reglages from './cms/site.json';

export const site = {
  nom: 'Room 33',
  descriptionParDefaut:
    'Bienvenue chez moi. Installez-vous, fouillez dans mes bacs et glissez-moi vos sons.',
  // compte Instagram : modifiable dans /admin (fichier src/data/cms/site.json)
  instagram: reglages.instagram,
  instagramUrl: reglages.instagramUrl,
  spotifyUrl: reglages.spotifyUrl, // profil Spotify (pied de page)
};

// Les pages, dans l'ordre du menu mobile
export const pages = [
  { numero: '01', court: 'La pièce', long: 'La pièce', explication: 'L’accueil, la vue d’ensemble.', href: '/' },
  { numero: '02', court: 'Les bacs', long: 'Les bacs', explication: 'Mes disques, rangés par genre.', href: '/bacs' },
  { numero: '03', court: 'Le Top', long: 'Le Top de la Room', explication: 'Mes disques préférés, classés.', href: '/top' },
  { numero: '04', court: 'La platine', long: 'La platine', explication: 'Ce que j’écoute en ce moment.', href: '/platine' },
  { numero: '05', court: 'Les lives', long: 'Les lives', explication: 'Les concerts que je repasse en boucle.', href: '/lives' },
  { numero: '06', court: 'Le comptoir', long: 'Le comptoir', explication: 'Qui je suis.', href: '/comptoir' },
  { numero: '07', court: 'Le bac des visiteurs', long: 'Le bac des visiteurs', explication: 'Les sons que vous m’avez recommandés.', href: '/visiteurs' },
] as const;

export const nav = {
  // Liens visibles dans la barre du haut (ordi)
  liens: ['Les bacs', 'Le Top', 'La platine', 'Les lives', 'Le comptoir', 'Le bac des visiteurs'],
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
  signature: 'Fait par Andyh',
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
  morceau: { surtitre: 'Le morceau du moment', voirFiche: 'Voir le disque' },
  bacs: { surtitre: 'Les bacs', titre: 'Piochez ceux qui vous parlent.', lien: 'Tous les bacs' },
  platine: { surtitre: 'La platine', titre: 'Ce qui tourne chez moi en ce moment.', lien: 'Voir toutes mes écoutes' },
  top: { surtitre: 'Le Top de la Room', titre: 'Les disques qui ne quittent jamais la platine.', lien: 'Voir le Top complet' },
  lives: { surtitre: 'Les lives', titre: 'Ce soir, sur scène.', lien: 'Voir tous les lives', chaine: 'Andyh · Room 33', chaineSous: 'Les lives que je repasse en boucle', aSuivre: 'À suivre', voirYoutube: 'Voir sur YouTube' },
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

// ---------- Tiroir « Recommandez-moi un son » (s'ouvre de partout) ----------
export const tiroir = {
  titre: 'Recommandez-moi un son',
  intro: 'Un morceau ou un album qui pourrait me plaire ? Cherchez-le, choisissez-le, envoyez. Je l’écoute vraiment.',
  etape1: '1 · Votre son',
  champ: 'Cherchez un morceau, un album ou un artiste',
  champCourt: 'Morceau, album ou artiste',
  aideLien: 'ou collez un lien Spotify, Apple Music, Deezer ou YouTube',
  etape2: '2 · Vous (facultatif)',
  prenom: 'Votre prénom',
  mot: 'Un mot sur ce son, pourquoi il me plairait…',
  envoyer: 'Envoyer au disquaire',
  envoi: 'Envoi en cours…',
  insta: 'Plutôt en DM ? Écrivez-moi sur Insta',
  note: 'Si je valide votre son, il rejoint le bac des visiteurs avec votre prénom.',
  choisir: 'Choisir',
  choisi: 'Choisi',
  lienColle: 'Lien collé',
  morceau: 'Morceau',
  album: 'Album',
  recherche: 'Recherche…',
  aucun: 'Aucun son trouvé. Essayez avec le nom de l’artiste, ou collez un lien.',
  erreurRecherche: 'La recherche ne répond pas. Réessayez, ou collez un lien.',
  erreurChoix: 'Choisissez un son avant d’envoyer.',
  erreurEnvoi: 'L’envoi n’a pas marché. Réessayez dans un instant, ou écrivez-moi sur Insta.',
  merciTitre: 'C’est dans la caisse.',
  merci: 'Merci ! J’écoute ça bientôt. Si je valide, votre son rejoint le bac des visiteurs avec votre prénom.',
  autre: 'Recommander un autre son',
  retour: 'Retour à la pièce',
  fermer: 'Fermer',
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

// ---------- Page : Le bac des visiteurs ----------
export const visiteursTextes = {
  compte: (n: number, date: string) => `${n} son${n > 1 ? 's' : ''} · le dernier ajouté le ${date}`,
  conseille: (prenom: string) => `Conseillé par ${prenom}`,
  videTitre: 'Le bac attend son premier son.',
  videTexte: 'Personne ne l’a encore rempli. Recommandez-moi un morceau : s’il me parle, il arrive ici avec votre prénom.',
  ecouter: '(écouter sur Spotify, nouvel onglet)',
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
  voirYoutube: 'Voir sur YouTube',
  lire: 'Lire la vidéo',
  consentement: 'La vidéo se charge depuis YouTube quand vous la lancez.',
};
