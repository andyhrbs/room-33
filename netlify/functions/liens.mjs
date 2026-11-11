// « Ouvrir l'app » : liens du même morceau (ou album, ou page d'un artiste : « Sa discographie ») sur chaque plateforme.
// Pas de service intermédiaire : chaque plateforme est interrogée directement.
// - Spotify : API Web (clés de l'app, côté serveur)  - Deezer : API publique
// - Apple Music : API de recherche iTunes (publique) - YouTube Music : page de recherche
import { trouverMorceau, reponse, parametres } from '../lib/deezer.mjs';
import { demanderJeton } from '../lib/spotify.mjs';

const normal = (s = '') => s.toLowerCase().normalize('NFD').replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');
const memeArtiste = (a, b) => normal(a).includes(normal(b)) || normal(b).includes(normal(a));
const delai = { signal: AbortSignal.timeout(8000) };

// Page de l'artiste (« Sa discographie ») sur chaque plateforme
async function spotifyArtiste(artiste) {
  const { access_token } = await demanderJeton({ grant_type: 'client_credentials' });
  const r = await fetch(`https://api.spotify.com/v1/search?type=artist&limit=5&market=FR&q=${encodeURIComponent(artiste)}`, { headers: { Authorization: `Bearer ${access_token}` }, ...delai });
  if (!r.ok) return null;
  const items = (await r.json()).artists?.items ?? [];
  return (items.find((a) => normal(a.name) === normal(artiste)) ?? items[0])?.external_urls?.spotify ?? null;
}
async function appleArtiste(artiste) {
  const r = await fetch(`https://itunes.apple.com/search?country=fr&limit=5&entity=musicArtist&term=${encodeURIComponent(artiste)}`, delai);
  if (!r.ok) return null;
  const res = (await r.json()).results ?? [];
  const bon = res.find((x) => normal(x.artistName) === normal(artiste)) ?? res[0];
  return bon?.artistLinkUrl?.replace('itunes.apple.com', 'music.apple.com').replace(/[?&]uo=\d+/, '') ?? null;
}
async function deezerArtiste(artiste) {
  const r = await fetch(`https://api.deezer.com/search/artist?limit=5&q=${encodeURIComponent(artiste)}`, delai);
  if (!r.ok) return null;
  const res = (await r.json()).data ?? [];
  return (res.find((a) => normal(a.name) === normal(artiste)) ?? res[0])?.link ?? null;
}

async function spotify({ titre, artiste, type }) {
  const { access_token } = await demanderJeton({ grant_type: 'client_credentials' });
  const t = type === 'album' ? 'album' : 'track';
  // 1) recherche précise (champs) ; 2) recherche libre si rien ne correspond (titres courts ou courants)
  for (const q of [`${t}:${titre} artist:${artiste}`, `${titre} ${artiste}`]) {
    const r = await fetch(`https://api.spotify.com/v1/search?type=${t}&limit=10&market=FR&q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${access_token}` }, ...delai });
    if (!r.ok) continue;
    const items = (await r.json())[`${t}s`]?.items ?? [];
    const bon = items.find((x) => x.artists?.some((a) => memeArtiste(a.name, artiste)) && normal(x.name).startsWith(normal(titre).slice(0, 10)))
      ?? items.find((x) => x.artists?.some((a) => memeArtiste(a.name, artiste)));
    if (bon?.external_urls?.spotify) return bon.external_urls.spotify;
  }
  return null;
}

// Par code-barres (UPC) : le même album, exactement, quel que soit son titre
const variantesUpc = (upc) => [...new Set([upc, upc.replace(/^0+/, ''), upc.padStart(13, '0'), upc.padStart(12, '0')])];
async function appleParUpc(upc) {
  for (const pays of ['fr', 'us']) for (const code of variantesUpc(upc)) {
    const r = await fetch(`https://itunes.apple.com/lookup?upc=${code}&country=${pays}&entity=album`, delai).catch(() => null);
    if (!r?.ok) continue;
    const album = ((await r.json()).results ?? []).find((x) => x.wrapperType === 'collection' || x.collectionType === 'Album');
    if (album?.collectionViewUrl) return album.collectionViewUrl.replace('itunes.apple.com', 'music.apple.com').replace(/[?&]uo=\d+/, '');
  }
  return null;
}
async function deezerParUpc(upc) {
  for (const code of variantesUpc(upc)) {
    const r = await fetch(`https://api.deezer.com/album/upc:${code}`, delai).catch(() => null);
    if (!r?.ok) continue;
    const a = await r.json();
    if (a?.link && !a.error) return a.link;
  }
  return null;
}

async function apple({ titre, artiste, type }) {
  const entite = type === 'album' ? 'album' : 'song';
  // catalogue français d'abord, puis américain (certains disques n'y sont référencés que là)
  for (const pays of ['fr', 'us']) {
    const r = await fetch(`https://itunes.apple.com/search?country=${pays}&limit=25&entity=${entite}&term=${encodeURIComponent(`${artiste} ${titre}`)}`, delai).catch(() => null);
    if (!r?.ok) continue;
    const res = (await r.json()).results ?? [];
    const bon = res.find((x) => memeArtiste(x.artistName, artiste) && normal(type === 'album' ? x.collectionName : x.trackName).startsWith(normal(titre).slice(0, 10))) ?? res.find((x) => memeArtiste(x.artistName, artiste));
    const url = type === 'album' ? bon?.collectionViewUrl : bon?.trackViewUrl;
    if (url) return url.replace('itunes.apple.com', 'music.apple.com').replace(/[?&]uo=\d+/, '');
  }
  return null;
}

const youtube = ({ titre, artiste }) => `https://music.youtube.com/search?q=${encodeURIComponent(`${titre} ${artiste}`)}`;

export default async (req) => {
  const p = parametres(req);
  if (!p) return reponse({ erreur: 'titre et artiste requis' }, 400, 60);
  const sur = (promesse) => promesse.catch(() => null);
  if (p.type === 'artiste') {
    const [sp, ap, dz] = await Promise.all([sur(spotifyArtiste(p.artiste)), sur(appleArtiste(p.artiste)), sur(deezerArtiste(p.artiste))]);
    const liens = { youtube: `https://music.youtube.com/search?q=${encodeURIComponent(p.artiste)}` };
    if (sp) liens.spotify = sp;
    if (ap) liens.apple = ap;
    if (dz) liens.deezer = dz;
    return reponse({ artiste: p.artiste, liens }, 200, sp && ap && dz ? 604800 : 600);
  }
  // album avec code-barres : correspondance exacte d'abord, recherche par titre en secours
  const parUpc = (f, repli) => (p.upc ? f(p.upc).then((x) => x ?? repli()) : repli());
  const [dz, sp, ap, dzAlbum] = await Promise.all([
    sur(trouverMorceau(p)),
    p.spotify ? Promise.resolve(p.spotify) : sur(spotify(p)),
    sur(parUpc(appleParUpc, () => apple(p))),
    p.upc ? sur(deezerParUpc(p.upc)) : Promise.resolve(null),
  ]);
  const liens = { youtube: youtube(p) };
  if (sp) liens.spotify = sp;
  if (ap) liens.apple = ap;
  if (dzAlbum || dz?.lien) liens.deezer = dzAlbum || dz.lien;
  // tout trouvé → cache 1 semaine ; sinon 10 min pour réessayer bientôt
  return reponse({ titre: p.titre, artiste: p.artiste, liens }, 200, sp && ap && dz ? 604800 : 600);
};

export const config = { path: '/api/liens' };
