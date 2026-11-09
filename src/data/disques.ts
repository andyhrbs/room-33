// ==========================================================================
// Room 33 — Disques de DÉMONSTRATION (Sprint 3)
// Artistes repris de tes écoutes Spotify, albums choisis par Claude pour
// remplir les pages. Au Sprint 4, ce fichier est remplacé par tes vrais
// disques (ajoutés depuis /admin, pochettes et infos via Spotify).
// ==========================================================================
import type { Motif } from '../components/types';

export interface Disque {
  slug: string;
  titre: string;
  artiste: string;
  annee: number;
  genre: string;
  motif: Motif;        // pochette de démo en attendant les vraies (Sprint 4)
  pochette?: string;   // URL de la vraie pochette
}

export const disques: Disque[] = [
  { slug: 'dijon-absolutely', titre: 'Absolutely', artiste: 'Dijon', annee: 2021, genre: 'Soul & R&B', motif: 'bandes' },
  { slug: 'daniel-caesar-freudian', titre: 'Freudian', artiste: 'Daniel Caesar', annee: 2017, genre: 'Soul & R&B', motif: 'lune' },
  { slug: 'tom-misch-geography', titre: 'Geography', artiste: 'Tom Misch', annee: 2018, genre: 'Indie', motif: 'arc' },
  { slug: 'yussef-dayes-black-classical-music', titre: 'Black Classical Music', artiste: 'Yussef Dayes', annee: 2023, genre: 'Jazz', motif: 'points' },
  { slug: 'mk-gee-two-star', titre: 'Two Star & the Dream Police', artiste: 'Mk.gee', annee: 2024, genre: 'Indie', motif: 'croix' },
  { slug: 'jordan-ward-forward', titre: 'FORWARD', artiste: 'Jordan Ward', annee: 2023, genre: 'Soul & R&B', motif: 'cercles' },
  { slug: 'khamari-a-brief-nirvana', titre: 'A Brief Nirvana', artiste: 'Khamari', annee: 2022, genre: 'Soul & R&B', motif: 'arc' },
  { slug: 'luidji-tristesse-business', titre: 'Tristesse Business : Saison 1', artiste: 'Luidji', annee: 2022, genre: 'Rap', motif: 'lune' },
];

export const parSlug = (slug: string) => disques.find((d) => d.slug === slug)!;

// Bacs : par genre (rempli automatiquement) et par humeur (choisis à la main)
export interface Bac { slug: string; nom: string; type: 'genre' | 'humeur'; motif: Motif; description: string; disques: Disque[]; maj: string }
const parGenre = (g: string) => disques.filter((d) => d.genre === g);
const choix = (...slugs: string[]) => slugs.map(parSlug);
const MAJ = '28 octobre 2026';
export const bacs: Bac[] = [
  { slug: 'soul-rnb', nom: 'Soul & R&B', type: 'genre', motif: 'bandes', description: 'Des voix, du groove, et de la chaleur.', disques: parGenre('Soul & R&B'), maj: MAJ },
  { slug: 'jazz', nom: 'Jazz', type: 'genre', motif: 'arc', description: 'Le jazz d’hier et celui d’aujourd’hui.', disques: parGenre('Jazz'), maj: MAJ },
  { slug: 'rap', nom: 'Rap', type: 'genre', motif: 'lune', description: 'Des textes et des prods qui restent.', disques: parGenre('Rap'), maj: MAJ },
  { slug: 'indie', nom: 'Indie', type: 'genre', motif: 'croix', description: 'Des sons faits à la maison, qui ne ressemblent à rien d’autre.', disques: parGenre('Indie'), maj: MAJ },
  { slug: 'afro', nom: 'Afro', type: 'genre', motif: 'points', description: 'Afrobeat, highlife, et tout ce qui fait bouger.', disques: parGenre('Afro'), maj: MAJ },
  { slug: 'classique', nom: 'Classique', type: 'genre', motif: 'cercles', description: 'Le piano d’abord, et le reste.', disques: parGenre('Classique'), maj: MAJ },
  { slug: 'bac-de-nuit', nom: 'Bac de nuit', type: 'humeur', motif: 'points', description: 'Pour les fins de soirée : des sons lents et chauds, qui laissent de la place à la basse.', disques: choix('daniel-caesar-freudian', 'khamari-a-brief-nirvana', 'dijon-absolutely', 'yussef-dayes-black-classical-music'), maj: MAJ },
];
export const bacParSlug = (slug: string) => bacs.find((b) => b.slug === slug)!;
export const detailBac = (b: Bac) => `${b.disques.length} disque${b.disques.length > 1 ? 's' : ''}${b.type === 'humeur' ? ' · humeur' : ''}`;
// Le bac d'un disque : son bac de genre
export const bacDuDisque = (d: Disque) => bacs.find((b) => b.type === 'genre' && b.nom === d.genre)!;
// Numérotation façon vinyle : A1, A2, A3, B1…
export const face = (i: number, parFace = 3) => `${String.fromCharCode(65 + Math.floor(i / parFace))}${(i % parFace) + 1}`;

// Fiche disque : textes provisoires de la maquette (les tiens arrivent au Sprint 4)
export const fiche = (d: Disque) => {
  const i = disques.indexOf(d);
  const memeVeine = [...disques.filter((x) => x !== d && x.genre === d.genre), ...disques.filter((x) => x !== d && x.genre !== d.genre)].slice(0, 4);
  return {
    reference: `DSQ-${String(i + 1).padStart(3, '0')}`,
    avis: '« Ici, ton avis en 3 à 5 phrases, comme une note de pochette. Ce que ce disque te fait, quand tu l’écoutes, le morceau à écouter en premier si on ne connaît pas. »',
    avisCourt: '« Ton avis en 3 à 5 phrases, comme une note de pochette. »',
    moment: { temps: '1:24', texte: 'À 1:24, la voix décroche et tout le morceau s’envole. Le passage qui m’accroche, en deux ou trois phrases.', texteCourt: 'À 1:24, la voix décroche et tout le morceau s’envole.' },
    credits: [['Claviers', 'Nom du pianiste'], ['Basse', 'Nom du bassiste'], ['Batterie', 'Nom du batteur'], ['Production', 'Nom du producteur']],
    artiste: { bio: 'Deux lignes pour situer l’artiste : d’où il vient, ce qu’il a changé, par quel disque commencer.', bioCourte: 'Deux lignes pour situer l’artiste.' },
    memeVeine,
    precedent: disques[(i - 1 + disques.length) % disques.length],
    suivant: disques[(i + 1) % disques.length],
  };
};

// Le Top de la Room (ordre = classement)
export const top = [
  'dijon-absolutely',
  'daniel-caesar-freudian',
  'tom-misch-geography',
  'yussef-dayes-black-classical-music',
  'mk-gee-two-star',
  'jordan-ward-forward',
  'khamari-a-brief-nirvana',
  'luidji-tristesse-business',
].map(parSlug);

// Top titres (bascule « Titres » du Top, et classements de la platine)
export interface Titre { titre: string; disque: Disque; duree: string }
export const topTitres: Titre[] = [
  { titre: 'Best Part', disque: parSlug('daniel-caesar-freudian'), duree: '3:29' },
  { titre: 'Many Times', disque: parSlug('dijon-absolutely'), duree: '3:41' },
  { titre: 'It Runs Through Me', disque: parSlug('tom-misch-geography'), duree: '4:21' },
  { titre: 'Are You Looking Up', disque: parSlug('mk-gee-two-star'), duree: '3:13' },
  { titre: 'FAMJAM4000', disque: parSlug('jordan-ward-forward'), duree: '3:18' },
  { titre: 'Get You', disque: parSlug('daniel-caesar-freudian'), duree: '4:38' },
  { titre: 'Disco Yes', disque: parSlug('tom-misch-geography'), duree: '4:51' },
];
export const pourquoiNumeroUn = {
  long: '« Pourquoi il est tout en haut : deux ou trois phrases, le morceau à écouter en premier. »',
  court: '« Pourquoi il est tout en haut. »',
};

// La platine (démo : les vraies stats Spotify arrivent au Sprint 4)
export const platineDetail = {
  enCours: topTitres[0],
  heures: '126 h',
  artisteUn: 'Dijon',
  titreUn: topTitres[1],
  topArtistes: [
    { nom: 'Dijon', ecoutes: 42 },
    { nom: 'Daniel Caesar', ecoutes: 36 },
    { nom: 'Tom Misch', ecoutes: 30 },
    { nom: 'Mk.gee', ecoutes: 24 },
    { nom: 'Yussef Dayes', ecoutes: 18 },
  ],
  mot: '« Un mois très soul, beaucoup de basses rondes. J’ai retourné cet album en boucle pendant les trajets… »',
  motCourt: '« Un mois très soul, beaucoup de basses rondes. »',
};

// Le bac des visiteurs (démo de la maquette : les vraies recos arrivent au Sprint 5)
const motifsRecos: Motif[] = ['cercles', 'lune', 'points', 'croix', 'bandes', 'arc', 'lune', 'points'];
export const recos = ['Inès', 'Malik', 'Jade', 'Yanis', 'Léa', 'Sami', 'Chloé', 'Noah'].map((prenom, i) => ({
  prenom, titre: 'Titre du morceau', artiste: 'Artiste', annee: 1970 + i * 3, motif: motifsRecos[i],
}));

// Le morceau du jour
export const morceauDuJour = {
  date: '30 octobre',
  titre: 'It Runs Through Me',
  disque: parSlug('tom-misch-geography'),
  avis: '« Deux phrases d’avis : pourquoi ce son aujourd’hui, ce qui me fait revenir dessus, la ligne de basse qui tue à 1:24. »',
  avisCourt: '« Deux phrases d’avis : pourquoi ce son aujourd’hui. »',
};

// La platine (chiffres Spotify au Sprint 4)
export const platine = [
  { valeur: '126 h', legende: 'écoutées ces 4 dernières semaines' },
  { valeur: 'Artiste n° 1', legende: 'le plus écouté du mois' },
  { valeur: 'Titre n° 1', legende: 'en boucle ce mois-ci' },
];

export const genres = ['Soul & R&B', 'Jazz', 'Rap', 'Indie', 'Afro', 'Classique'];
