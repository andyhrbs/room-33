// ==========================================================================
// Room 33 — Les disques et les bacs, modifiables dans /admin :
// - un fichier par disque dans src/data/cms/disques/ (rubrique « Les disques ») ;
// - la liste des bacs dans src/data/cms/bacs.json (rubrique « Les bacs ») ;
// - le Top (cms/top.json), le morceau du moment (cms/morceau.json), le bac des visiteurs (cms/visiteurs.json).
// Au build, Spotify complète chaque disque (pochette, année, label, pistes, lien de l'artiste).
// Contenu actuel = DÉMO (mêmes disques qu'avant) ; les textes vides retombent sur les textes de maquette.
// ==========================================================================
import type { Motif } from '../components/types';
import { infosAlbums, infosTitres, type Piste } from '../lib/catalogue';
import donneesBacs from './cms/bacs.json';
import donneesTop from './cms/top.json';
import donneesMorceau from './cms/morceau.json';
import donneesVisiteurs from './cms/visiteurs.json';

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
  photoArtiste?: string; // photo de l'artiste (Spotify, au build) pour « Découvrir l'artiste »
  upc?: string;          // code-barres de l'album (Spotify), pour retrouver le même disque sur chaque plateforme
  liens?: Record<string, string>; // liens « Ouvrir l'app » résolus au build (spotify, apple, deezer)
  pistes?: Piste[];
  coupDeCoeur?: string;  // titre du morceau préféré d'Andyh sur l'album (admin), signalé dans la tracklist de la fiche
  ajoute: string;      // date d'ajout (ordre des disques, « mis à jour le » des bacs)
  textes: TextesDisque; // ce qu'Andyh écrit dans l'admin (peut être vide)
}
export interface TextesDisque {
  avis?: string; avisCourt?: string;
  moment?: { temps?: string; texte?: string; texteCourt?: string };
  credits?: { role: string; nom: string }[];
  bio?: string; bioCourte?: string;
}

type EntreeDisque = TextesDisque & { titre: string; artiste: string; genre: string; spotify?: string; annee?: number; ajoute?: string; motif?: Motif; coupDeCoeur?: string };
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
    ajoute: e.ajoute ?? '1970-01-01',
    coupDeCoeur: e.coupDeCoeur?.trim() || undefined,
    textes: { avis: e.avis, avisCourt: e.avisCourt, moment: e.moment, credits: e.credits, bio: e.bio, bioCourte: e.bioCourte },
  }))
  .sort((a, b) => a.ajoute.localeCompare(b.ajoute)); // du plus ancien au plus récent

// Au build : on complète chaque disque avec Spotify (pochette, année, label, pistes)
const infos = await infosAlbums(disques.map((d) => ({ cle: d.slug, titre: d.titre, artiste: d.artiste, spotifyId: d.spotifyId })));
for (const d of disques) {
  const i = infos.get(d.slug);
  if (!i) continue;
  Object.assign(d, { spotifyId: i.spotifyId, pistes: i.pistes }, i.pochette && { pochette: i.pochette }, i.annee && { annee: i.annee }, i.label && { label: i.label }, i.lienSpotify && { lienSpotify: i.lienSpotify }, i.lienArtiste && { lienArtiste: i.lienArtiste }, i.photoArtiste && { photoArtiste: i.photoArtiste }, i.upc && { upc: i.upc }, Object.keys(i.liens).length && { liens: i.liens });
}

export const parSlug = (slug: string) => disques.find((d) => d.slug === slug)!;

// Bacs : un bac par genre, rempli automatiquement avec les disques de ce genre
export interface Bac { slug: string; nom: string; motif: Motif; description: string; disques: Disque[]; maj: string; majCourt: string }
const versSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'n').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// « 28 octobre 2026 » (ordi) ou « 28 oct. » (mobile, maquette Figma)
const dateMaj = (liste: Disque[], court = false) => {
  const plusRecent = liste.map((d) => d.ajoute).sort().pop();
  const d = plusRecent ? new Date(plusRecent) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', court ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};
type EntreeBac = { nom: string; motif?: Motif; description?: string; slug?: string };
export const bacs: Bac[] = (donneesBacs.bacs as EntreeBac[]).map((b, i) => {
  const liste = disques.filter((d) => d.genre === b.nom);
  return { slug: b.slug || versSlug(b.nom), nom: b.nom, motif: b.motif && motifs.includes(b.motif) ? b.motif : motifs[i % motifs.length], description: b.description ?? '', disques: liste, maj: dateMaj(liste.length ? liste : disques), majCourt: dateMaj(liste.length ? liste : disques, true) }; // bac vide : date du dernier disque ajouté
});
export const bacParSlug = (slug: string) => bacs.find((b) => b.slug === slug)!;
export const detailBac = (b: Bac) => `${b.disques.length} disque${b.disques.length > 1 ? 's' : ''}`;
// Le bac d'un disque : son bac de genre
// (si son bac de genre a été supprimé dans l'admin : lien vers le premier bac, sans casser la page)
export const bacDuDisque = (d: Disque) => bacs.find((b) => b.nom === d.genre) ?? { ...bacs[0], nom: d.genre || bacs[0].nom };
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

// Disque lié depuis l'admin (Top, morceau du moment) : ignoré s'il a été supprimé entre-temps
const disqueLie = (slug: string, ou: string) => {
  const d = disques.find((x) => x.slug === slug);
  if (!d) console.warn(`[Admin] ${ou} : le disque « ${slug} » n'existe plus, ignoré.`);
  return d;
};
// Durée d'un morceau = celle de sa piste sur l'album (Spotify, au build)
const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const dureeDe = (titre: string, d: Disque) => d.pistes?.find((p) => normal(p.titre).startsWith(normal(titre)))?.duree ?? '';

// Le Top de la Room (ordre = classement), modifiable dans /admin › Le Top
type DonneesTop = { albums?: { disque: string }[]; titres?: { titre: string; disque: string }[]; pourquoiAlbum?: string; pourquoiAlbumCourt?: string; pourquoiTitre?: string; pourquoiTitreCourt?: string };
const t0 = donneesTop as DonneesTop;
const topAdmin = (t0.albums ?? []).map((a) => disqueLie(a.disque, 'Top albums')).filter((d): d is Disque => Boolean(d));
// Top vide (tous ses disques supprimés) : les disques les plus récents, pour que les pages tiennent debout
export const top: Disque[] = topAdmin.length ? topAdmin : disques.slice().reverse();

// Top titres (bascule « Titres » du Top, et classements de démo de la platine)
export interface Titre { titre: string; disque: Disque; duree: string }
const titresAdmin: Titre[] = (t0.titres ?? []).flatMap((t) => {
  const disque = disqueLie(t.disque, 'Top titres');
  return disque ? [{ titre: t.titre, disque, duree: dureeDe(t.titre, disque) }] : [];
});
export const topTitres: Titre[] = titresAdmin.length ? titresAdmin
  : top.map((d) => ({ titre: d.pistes?.[0]?.titre ?? d.titre, disque: d, duree: d.pistes?.[0]?.duree ?? '' }));
const pourquoi = (long?: string, court?: string) => ({
  long: long || '« Pourquoi il est tout en haut : deux ou trois phrases, le morceau à écouter en premier. »',
  court: court || long || '« Pourquoi il est tout en haut. »',
});
export const pourquoiNumeroUn = pourquoi(t0.pourquoiAlbum, t0.pourquoiAlbumCourt);
export const pourquoiTitreUn = pourquoi(t0.pourquoiTitre, t0.pourquoiTitreCourt);

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

// Le bac des visiteurs : les recos validées par Andyh, ajoutées dans /admin › Le bac des visiteurs
// (la plus récente en premier). Spotify complète au build : pochette, année, lien.
type EntreeReco = { prenom: string; type?: 'morceau' | 'album'; titre: string; artiste: string; spotify?: string; ajoute?: string };
export interface Reco { prenom: string; type: 'morceau' | 'album'; titre: string; artiste: string; annee?: number; pochette?: string; lien?: string; motif: Motif; ajoute: string }
const entreesRecos = ((donneesVisiteurs as { recos?: EntreeReco[] }).recos ?? [])
  .map((r, i) => {
    // le lien décide s'il est là (track / album), sinon le champ « type » de l'admin
    const lien = r.spotify?.match(/(track|album)\/([A-Za-z0-9]{22})/);
    const type: 'morceau' | 'album' = lien ? (lien[1] === 'album' ? 'album' : 'morceau') : r.type === 'album' ? 'album' : 'morceau';
    return { ...r, type, cle: String(i), spotifyId: lien?.[2] };
  });
// morceaux : Spotify « tracks » ; albums : comme les disques du site (pochette, année, lien)
const infosRecos = await infosTitres(entreesRecos.filter((r) => r.type === 'morceau'));
const infosRecosAlbums = await infosAlbums(entreesRecos.filter((r) => r.type === 'album'));
export const recos: Reco[] = entreesRecos
  .map((r, i) => {
    const base = { prenom: r.prenom, type: r.type, motif: motifs[i % motifs.length], ajoute: r.ajoute ?? '1970-01-01' };
    if (r.type === 'album') {
      const a = infosRecosAlbums.get(r.cle);
      return { ...base, titre: r.titre, artiste: r.artiste, annee: a?.annee, pochette: a?.pochette, lien: a?.lienSpotify ?? (r.spotify || undefined) };
    }
    const s = infosRecos.get(r.cle);
    return { ...base, titre: s?.titre ?? r.titre, artiste: s?.artiste ?? r.artiste, annee: s?.annee, pochette: s?.pochette, lien: s?.lienSpotify ?? (r.spotify || undefined) };
  })
  .sort((a, b) => b.ajoute.localeCompare(a.ajoute));

// Le morceau du moment (sans date : changé quand Andyh en a envie), modifiable dans /admin › L'accueil
type DonneesMorceau = { titre: string; disque: string; avis?: string; avisCourt?: string };
const m0 = donneesMorceau as DonneesMorceau;
const disqueMorceau = disqueLie(m0.disque, 'Morceau du moment') ?? disques[disques.length - 1];
export const morceauDuJour = {
  titre: m0.titre,
  disque: disqueMorceau,
  avis: m0.avis || '« Deux phrases d’avis : pourquoi ce son aujourd’hui, ce qui me fait revenir dessus, la ligne de basse qui tue à 1:24. »',
  avisCourt: m0.avisCourt || m0.avis || '« Deux phrases d’avis : pourquoi ce son aujourd’hui. »',
};

// La platine (chiffres Spotify au Sprint 4)
export const platine = [
  { valeur: 'Artiste n° 1', legende: 'le plus écouté du mois' },
  { valeur: 'Titre n° 1', legende: 'en boucle ce mois-ci' },
];

export const genres = ['Soul & R&B', 'Jazz', 'Rap', 'Indie', 'Afro', 'Classique'];
