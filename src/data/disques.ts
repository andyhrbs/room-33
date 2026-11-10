// ==========================================================================
// Room 33 — Les disques et les bacs, modifiables dans /admin :
// - un fichier par disque dans src/data/cms/disques/ (rubrique « Les disques ») ;
// - la liste des bacs dans src/data/cms/bacs.json (rubrique « Les bacs »).
// Au build, Spotify complète chaque disque (pochette, année, label, pistes, lien de l'artiste).
// Contenu actuel = DÉMO (mêmes disques qu'avant) ; les textes vides retombent sur les textes de maquette.
// ==========================================================================
import type { Motif } from '../components/types';
import { infosAlbums, type Piste } from '../lib/catalogue';
import donneesBacs from './cms/bacs.json';

export interface Disque {
  slug: string;
  titre: string;
  artiste: string;
  annee: number;
  genre: string;
  motif: Motif;        // pochette de démo tant que Spotify n'a pas donné la vraie
  pochette?: string;   // URL de la vraie pochette (Spotify, au build)
  spotifyId?: string;  // identifiant Spotify de l'album (sinon retrouvé par titre + artiste)
  label?: string;
  lienSpotify?: string;
  lienArtiste?: string; // page de l'artiste sur Spotify (« Sa discographie »)
  pistes?: Piste[];
  humeurs: string[];   // bacs d'humeur où ranger aussi le disque (ex. « Bac de nuit »)
  ajoute: string;      // date d'ajout (ordre des disques, « mis à jour le » des bacs)
  textes: TextesDisque; // ce qu'Andyh écrit dans l'admin (peut être vide)
}
export interface TextesDisque {
  avis?: string; avisCourt?: string;
  moment?: { temps?: string; texte?: string; texteCourt?: string };
  credits?: { role: string; nom: string }[];
  bio?: string; bioCourte?: string;
}

type EntreeDisque = TextesDisque & { titre: string; artiste: string; genre: string; humeurs?: string[]; spotify?: string; annee?: number; ajoute?: string; motif?: Motif };
const motifs: Motif[] = ['bandes', 'lune', 'arc', 'points', 'croix', 'cercles'];
const fichiers = import.meta.glob<EntreeDisque>('./cms/disques/*.json', { eager: true, import: 'default' });

export const disques: Disque[] = Object.entries(fichiers)
  .map(([chemin, e], i) => ({
    slug: chemin.split('/').pop()!.replace(/\.json$/, ''),
    titre: e.titre, artiste: e.artiste, genre: e.genre,
    annee: Number(e.annee) || 0,
    motif: e.motif && motifs.includes(e.motif) ? e.motif : motifs[i % motifs.length],
    // lien d'album Spotify collé dans l'admin → identifiant (sinon Spotify le retrouve par titre + artiste)
    spotifyId: e.spotify?.match(/album\/([A-Za-z0-9]{22})/)?.[1],
    humeurs: e.humeurs ?? [],
    ajoute: e.ajoute ?? '1970-01-01',
    textes: { avis: e.avis, avisCourt: e.avisCourt, moment: e.moment, credits: e.credits, bio: e.bio, bioCourte: e.bioCourte },
  }))
  .sort((a, b) => a.ajoute.localeCompare(b.ajoute)); // du plus ancien au plus récent

// Au build : on complète chaque disque avec Spotify (pochette, année, label, pistes)
const infos = await infosAlbums(disques.map((d) => ({ cle: d.slug, titre: d.titre, artiste: d.artiste, spotifyId: d.spotifyId })));
for (const d of disques) {
  const i = infos.get(d.slug);
  if (!i) continue;
  Object.assign(d, { spotifyId: i.spotifyId, pistes: i.pistes }, i.pochette && { pochette: i.pochette }, i.annee && { annee: i.annee }, i.label && { label: i.label }, i.lienSpotify && { lienSpotify: i.lienSpotify }, i.lienArtiste && { lienArtiste: i.lienArtiste });
}

export const parSlug = (slug: string) => disques.find((d) => d.slug === slug)!;

// Bacs : par genre (rempli automatiquement avec le genre de chaque disque) et par humeur (disques qui le cochent)
export interface Bac { slug: string; nom: string; type: 'genre' | 'humeur'; motif: Motif; description: string; disques: Disque[]; maj: string }
const versSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dateMaj = (liste: Disque[]) => {
  const plusRecent = liste.map((d) => d.ajoute).sort().pop();
  const d = plusRecent ? new Date(plusRecent) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
};
type EntreeBac = { nom: string; type?: string; motif?: Motif; description?: string; slug?: string };
export const bacs: Bac[] = (donneesBacs.bacs as EntreeBac[]).map((b, i) => {
  const type = b.type === 'humeur' ? 'humeur' : 'genre';
  const liste = type === 'genre' ? disques.filter((d) => d.genre === b.nom) : disques.filter((d) => d.humeurs.includes(b.nom));
  return { slug: b.slug || versSlug(b.nom), nom: b.nom, type, motif: b.motif && motifs.includes(b.motif) ? b.motif : motifs[i % motifs.length], description: b.description ?? '', disques: liste, maj: dateMaj(liste.length ? liste : disques) }; // bac vide : date du dernier disque ajouté
});
export const bacParSlug = (slug: string) => bacs.find((b) => b.slug === slug)!;
export const detailBac = (b: Bac) => `${b.disques.length} disque${b.disques.length > 1 ? 's' : ''}${b.type === 'humeur' ? ' · humeur' : ''}`;
// Le bac d'un disque : son bac de genre
// (si son bac de genre a été supprimé dans l'admin : lien vers le premier bac, sans casser la page)
export const bacDuDisque = (d: Disque) => bacs.find((b) => b.type === 'genre' && b.nom === d.genre) ?? { ...bacs[0], nom: d.genre || bacs[0].nom };
// Numérotation façon vinyle : A1, A2, A3, B1…
export const face = (i: number, parFace = 3) => `${String.fromCharCode(65 + Math.floor(i / parFace))}${(i % parFace) + 1}`;

// Fiche disque : les textes saisis dans l'admin ; à défaut, les textes provisoires de la maquette
export const fiche = (d: Disque) => {
  const i = disques.indexOf(d);
  const memeVeine = [...disques.filter((x) => x !== d && x.genre === d.genre), ...disques.filter((x) => x !== d && x.genre !== d.genre)].slice(0, 4);
  const t = d.textes;
  const credits = t.credits?.filter((c) => c.role && c.nom).map((c) => [c.role, c.nom] as [string, string]);
  return {
    reference: `DSQ-${String(i + 1).padStart(3, '0')}`,
    avis: t.avis || '« Ici, ton avis en 3 à 5 phrases, comme une note de pochette. Ce que ce disque te fait, quand tu l’écoutes, le morceau à écouter en premier si on ne connaît pas. »',
    avisCourt: t.avisCourt || t.avis || '« Ton avis en 3 à 5 phrases, comme une note de pochette. »',
    moment: {
      temps: t.moment?.temps || '1:24',
      texte: t.moment?.texte || 'À 1:24, la voix décroche et tout le morceau s’envole. Le passage qui m’accroche, en deux ou trois phrases.',
      texteCourt: t.moment?.texteCourt || t.moment?.texte || 'À 1:24, la voix décroche et tout le morceau s’envole.',
    },
    credits: credits?.length ? credits : [['Claviers', 'Nom du pianiste'], ['Basse', 'Nom du bassiste'], ['Batterie', 'Nom du batteur'], ['Production', 'Nom du producteur']],
    artiste: { bio: t.bio || 'Deux lignes pour situer l’artiste : d’où il vient, ce qu’il a changé, par quel disque commencer.', bioCourte: t.bioCourte || t.bio || 'Deux lignes pour situer l’artiste.' },
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
  artisteUn: 'Dijon',
  titreUn: topTitres[1],
  topArtistes: [
    { nom: 'Dijon', ecoutes: 42 },
    { nom: 'Daniel Caesar', ecoutes: 36 },
    { nom: 'Tom Misch', ecoutes: 30 },
    { nom: 'Mk.gee', ecoutes: 24 },
    { nom: 'Yussef Dayes', ecoutes: 18 },
  ],
};

// Le bac des visiteurs (démo de la maquette : les vraies recos arrivent au Sprint 5)
const motifsRecos: Motif[] = ['cercles', 'lune', 'points', 'croix', 'bandes', 'arc', 'lune', 'points'];
export const recos = ['Inès', 'Malik', 'Jade', 'Yanis', 'Léa', 'Sami', 'Chloé', 'Noah'].map((prenom, i) => ({
  prenom, titre: 'Titre du morceau', artiste: 'Artiste', annee: 1970 + i * 3, motif: motifsRecos[i],
}));

// Le morceau du moment (sans date : changé quand Andyh en a envie, il ne paraît jamais périmé)
export const morceauDuJour = {
  titre: 'It Runs Through Me',
  disque: parSlug('tom-misch-geography'),
  avis: '« Deux phrases d’avis : pourquoi ce son aujourd’hui, ce qui me fait revenir dessus, la ligne de basse qui tue à 1:24. »',
  avisCourt: '« Deux phrases d’avis : pourquoi ce son aujourd’hui. »',
};

// La platine (chiffres Spotify au Sprint 4)
export const platine = [
  { valeur: 'Artiste n° 1', legende: 'le plus écouté du mois' },
  { valeur: 'Titre n° 1', legende: 'en boucle ce mois-ci' },
];

export const genres = ['Soul & R&B', 'Jazz', 'Rap', 'Indie', 'Afro', 'Classique'];
