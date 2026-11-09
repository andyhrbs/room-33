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

// Bacs (repris de la maquette)
export const bacs = [
  { slug: 'soul-rnb', nom: 'Soul & R&B', detail: '18 disques', type: 'genre', motif: 'bandes' },
  { slug: 'jazz', nom: 'Jazz', detail: '14 disques', type: 'genre', motif: 'arc' },
  { slug: 'rap', nom: 'Rap', detail: '22 disques', type: 'genre', motif: 'lune' },
  { slug: 'bac-de-nuit', nom: 'Bac de nuit', detail: '12 disques · humeur', type: 'humeur', motif: 'points' },
  { slug: 'dimanche-matin', nom: 'Dimanche matin', detail: '9 disques · humeur', type: 'humeur', motif: 'croix' },
  { slug: 'les-basses', nom: 'Les basses', detail: '11 disques · humeur', type: 'humeur', motif: 'cercles' },
] satisfies { slug: string; nom: string; detail: string; type: string; motif: Motif }[];

// Le Top de la Room (ordre = classement)
export const top = [
  'dijon-absolutely',
  'daniel-caesar-freudian',
  'tom-misch-geography',
  'yussef-dayes-black-classical-music',
  'mk-gee-two-star',
].map(parSlug);

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
