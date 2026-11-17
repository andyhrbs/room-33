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
  { numero: '01', court: 'Accueil', long: 'Accueil', explication: 'Tout, en un coup d’œil.', href: '/' },
  { numero: '02', court: 'Mes disques', long: 'Mes disques', explication: 'Rangés par genre : servez-vous.', href: '/bacs' },
  { numero: '03', court: 'Mon Top', long: 'Mon Top', explication: 'Mes disques du moment, classés.', href: '/top' },
  { numero: '04', court: 'Mes écoutes', long: 'Mes écoutes', explication: 'Ce que j’écoute en ce moment.', href: '/platine' },
  { numero: '05', court: 'En vidéo', long: 'En vidéo', explication: 'Mes performances préférées.', href: '/lives' },
  { numero: '06', court: 'Qui je suis', long: 'Qui je suis', explication: 'Moi, et pourquoi Room 33.', href: '/comptoir' },
  { numero: '07', court: 'Vos sons', long: 'Vos sons', explication: 'Vos recos qui m’ont plu.', href: '/visiteurs' },
] as const;

export const nav = {
  // Liens visibles dans la barre du haut (ordi)
  liens: ['Mes disques', 'Mon Top', 'Mes écoutes', 'En vidéo', 'Qui je suis', 'Vos sons'],
  cta: 'Recommandez-moi un son',
  ouvrirMenu: 'Ouvrir le menu',
  fermerMenu: 'Fermer le menu',
};

export const piedDePage = {
  question: 'Un son à me faire écouter ?',
  champ: 'Titre, artiste ou lien',
  envoyer: 'Envoyer',
  liens: ['Accueil', 'Mes disques', 'Mon Top', 'Mes écoutes', 'En vidéo', 'Vos sons', 'Qui je suis'],
  cta: 'Recommandez-moi un son',
  reseaux: { instagram: 'Instagram', spotify: 'Spotify', dm: 'Écrivez-moi en DM' },
  copyright: '© 2026 Room 33 · Mentions légales',
  donnees: 'Données : Spotify · Extraits : Deezer',
};

export const accueilProvisoire = {
  titre: 'Room 33',
  phrase: 'Bienvenue chez moi. La pièce se prépare.',
};

// ---------- Page : La pièce (accueil) ----------
export const accueil = {
  titre: 'Bienvenue chez moi.',
  accroche: 'Installez-vous, faites comme chez vous : les bacs sont ouverts, la platine tourne.',
  accrocheMobile: 'Installez-vous, faites comme chez vous.',
  entrer: 'Voir mes disques',
  morceau: { surtitre: 'Le morceau du moment', voirFiche: 'Voir le disque' },
  bacs: { surtitre: 'Mes disques', titre: 'Servez-vous, prenez le temps de fouiller.', lien: 'Voir tous les bacs' },
  platine: { surtitre: 'Mes écoutes', titre: 'Ce qui tourne chez moi en ce moment.', lien: 'Voir toutes mes écoutes', voirArtiste: 'Voir l’artiste', legendeArtiste: 'Mon artiste du mois', legendeTitre: 'En boucle ce mois-ci', indispo: 'La platine fait une pause : mes écoutes reviennent dans un instant.' },
  top: { surtitre: 'Mon Top', titre: 'Les disques qui tournent le plus en ce moment.', lien: 'Voir le Top en entier' },
  lives: { surtitre: 'En vidéo', titre: 'À regarder, le son à fond.', lien: 'Voir toutes les vidéos', chaine: 'Andyh · Room 33', chaineSous: 'Mes performances préférées', aSuivre: 'À suivre', voirYoutube: 'Voir sur YouTube' },
  bandeauPause: 'Mettre en pause le défilement',
  bandeauLecture: 'Relancer le défilement',
};

// ---------- Module « Recommandez-moi un son » ----------
export const reco = {
  surtitre: 'Recommandez-moi un son',
  titre: 'Faites-moi découvrir un son.',
  texte: 'Un son qui pourrait me plaire ? Cherchez-le ou collez un lien : je l’écoute, et s’il me parle il rejoint la page Vos sons avec votre prénom.',
  texteMobile: 'Cherchez-le ou collez un lien. S’il me parle, il rejoint la page Vos sons avec votre prénom.',
  champ: 'Cherchez un titre, un artiste, ou collez un lien…',
  champMobile: 'Titre, artiste ou lien…',
  envoyer: 'Envoyer',
  insta: 'ou écrivez-moi sur Insta',
};

// ---------- Tiroir « Recommandez-moi un son » (s'ouvre de partout) ----------
export const tiroir = {
  titre: 'Recommandez-moi un son',
  intro: 'Un son qui pourrait me plaire ? Trouvez-le ci-dessous et envoyez-le-moi.',
  etape1: '1 · Votre son',
  champ: 'Cherchez un morceau, un album ou un artiste',
  champCourt: 'Morceau, album ou artiste',
  aideLien: 'ou collez un lien Spotify, Apple Music, Deezer ou YouTube',
  etape2: '2 · Vous (facultatif)',
  prenom: 'Votre prénom',
  instaVisiteur: 'Votre Insta, pour être prévenu',
  mot: 'Un mot sur ce son, pourquoi il me plairait…',
  envoyer: 'Me l’envoyer',
  envoi: 'Envoi en cours…',
  insta: 'Plutôt en DM ? Écrivez-moi sur Insta',
  note: 'Si je valide votre son, il rejoint la page Vos sons avec votre prénom.',
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
  merci: 'Merci ! J’écoute tout, promis. Si je valide, votre son rejoint la page Vos sons avec votre prénom, et je vous préviens sur Insta si vous l’avez laissé.',
  voirBac: 'Voir vos sons',
  autre: 'Recommander un autre son',
  retour: 'Retour à la pièce',
  fermer: 'Fermer',
};

// ---------- Page : Le comptoir ----------
export const comptoir = {
  retour: 'Retour dans la pièce',
  filAriane: ['Accueil', 'Qui je suis'],
  surtitreMobile: 'Qui je suis',
  titre: 'Venez, on parle musique.',
  titreMobile: 'On parle musique.',
  presentation: {
    surtitre: 'Derrière le comptoir',
    titre: 'Moi, c’est Andyh.',
    texte: [
      'La musique, je suis tombé dedans tout petit. À Madagascar, mon père, pianiste à l’église, passait du jazz et du classique en boucle à la maison : Oscar Peterson, Ray Charles, Maggie Blanchard. C’est lui qui m’a transmis cette passion, et le goût des belles harmonies.',
      'Arrivé en France pour mes études, j’ai continué à jouer du piano à l’église, et j’essaie aujourd’hui d’écrire mes propres chansons. Je vais aussi souvent en concert, surtout quand l’artiste est entouré de vrais musiciens, comme Venna en 2024. Mes inspirations ? Sade, Luidji, Odeal, Venna…',
      'Et dès qu’un morceau me plaît, je deviens vite bavard : vous voilà prévenus.',
    ],
  },
  photoAlt: 'Andyh au piano, chez lui, le soir.',
  photoAttente: 'Photo — Andyh au piano, le soir (vraie photo · 4:5)',
  pourquoi: {
    surtitre: 'Pourquoi Room 33',
    titre: 'Une pièce, des 33 tours.',
    p1: 'Je suis designer UX/UI. Alors pour partager ce que j’écoute, plutôt qu’une playlist de plus, j’ai construit une pièce.',
    p2: 'Le nom vient du 33 tours, le disque qu’on écoute du début à la fin. Ici, c’est pareil : on entre, on fouille dans les bacs, on écoute. C’est ma manière à moi de vous faire découvrir mon univers, et qu’on se retrouve autour des sons qu’on aime.',
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
  filAriane: ['Accueil', 'En vidéo'],
  surtitreMobile: 'En vidéo',
  titre: 'Le son à fond.',
  intro: 'Les performances que je repasse sans me lasser.',
  introCourte: 'Les performances que je repasse sans me lasser.',
  une: 'À la une',
  tous: { surtitre: 'Toutes les vidéos', titre: 'Sur scène, en studio, dans un salon.' },
  voirYoutube: 'Voir sur YouTube',
  lire: 'Lire la vidéo',
  consentement: 'La vidéo se charge depuis YouTube quand vous la lancez.',
};
