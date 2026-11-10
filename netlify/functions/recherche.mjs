// « Recommandez-moi un son » : recherche de morceaux ET d'albums sur Spotify (dès 3 lettres), ou infos
// d'un lien Spotify collé (morceau ou album). Côté serveur : les clés de l'app restent dans les variables Netlify.
// GET /api/recherche?q=nina%20simone  →  { resultats: [{ type, id, titre, artiste, annee, pochette, lien }] }
import { reponse } from '../lib/deezer.mjs';
import { demanderJeton } from '../lib/spotify.mjs';

const delai = () => ({ signal: AbortSignal.timeout(8000) });
// la plus petite image d'au moins 64 px (les images arrivent de la plus grande à la plus petite)
const vignette = (images = []) => [...images].reverse().find((i) => (i.width || 0) >= 64)?.url ?? images[0]?.url ?? null;
const versAlbum = (a) => ({
  type: 'album',
  id: a.id,
  titre: a.name,
  artiste: (a.artists || []).map((x) => x.name).join(', '),
  annee: (a.release_date || '').slice(0, 4),
  pochette: vignette(a.images),
  lien: a.external_urls?.spotify ?? null,
});
const versResultat = (t) => ({
  type: 'morceau',
  id: t.id,
  titre: t.name,
  artiste: (t.artists || []).map((a) => a.name).join(', '),
  annee: (t.album?.release_date || '').slice(0, 4),
  // la plus petite pochette d'au moins 64 px (les images arrivent de la plus grande à la plus petite)
  pochette: [...(t.album?.images || [])].reverse().find((i) => (i.width || 0) >= 64)?.url ?? t.album?.images?.[0]?.url ?? null,
  lien: t.external_urls?.spotify ?? null,
});

export default async (req) => {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 200);
  if (q.length < 3) return reponse({ resultats: [] }, 200, 3600);
  try {
    const { access_token } = await demanderJeton({ grant_type: 'client_credentials' });
    const auth = { headers: { Authorization: `Bearer ${access_token}` }, ...delai() };
    // lien Spotify collé : open.spotify.com/track/ID ou /album/ID (avec ou sans /intl-fr/)
    const lien = q.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album)\/([A-Za-z0-9]{22})/);
    if (lien) {
      const [, sorte, id] = lien;
      const r = await fetch(`https://api.spotify.com/v1/${sorte}s/${id}?market=FR`, auth);
      if (!r.ok) return reponse({ resultats: [] }, 200, 600);
      const d = await r.json();
      return reponse({ resultats: [sorte === 'album' ? versAlbum(d) : versResultat(d)] }, 200, 86400);
    }
    const r = await fetch(`https://api.spotify.com/v1/search?type=track,album&limit=5&market=FR&q=${encodeURIComponent(q)}`, auth);
    if (!r.ok) throw new Error(`Spotify ${r.status}`);
    const json = await r.json();
    const morceaux = (json.tracks?.items ?? []).map(versResultat);
    const albums = (json.albums?.items ?? []).filter(Boolean).filter((a) => a.album_type !== 'single').map(versAlbum);
    // liste mélangée : morceau, album, morceau, album… (8 au plus). Si le nom d'un album colle à la recherche, il passe devant.
    const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nq = norm(q);
    const fort = albums.findIndex((a) => nq.includes(norm(a.titre)) || norm(a.titre).includes(nq));
    const tete = fort >= 0 ? albums.splice(fort, 1) : [];
    const melange = [];
    for (let i = 0; melange.length < 8 && (i < morceaux.length || i < albums.length); i++) {
      if (morceaux[i]) melange.push(morceaux[i]);
      if (albums[i] && i < 3) melange.push(albums[i]);
    }
    return reponse({ resultats: [...tete, ...melange].slice(0, 8) }, 200, 3600);
  } catch {
    return reponse({ erreur: 'recherche indisponible' }, 502, 30);
  }
};

export const config = { path: '/api/recherche' };
