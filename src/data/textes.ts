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
  { numero: '05', court: 'Le comptoir', long: 'Le comptoir', explication: 'Qui je suis.', href: '/comptoir' },
  { numero: '06', court: 'Le bac des visiteurs', long: 'Le bac des visiteurs', explication: 'Les sons que vous m’avez recommandés.', href: '/visiteurs' },
] as const;

export const nav = {
  // Liens visibles dans la barre du haut (ordi)
  liens: ['Les bacs', 'Le Top', 'La platine', 'Le comptoir'],
  cta: 'Recommandez-moi un son',
  ouvrirMenu: 'Ouvrir le menu',
  fermerMenu: 'Fermer le menu',
};

export const piedDePage = {
  question: 'Un son à me faire écouter ?',
  champ: 'Titre, artiste ou lien',
  envoyer: 'Envoyer',
  liens: ['La pièce', 'Les bacs', 'Le Top', 'La platine', 'Le bac des visiteurs', 'Le comptoir'],
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
