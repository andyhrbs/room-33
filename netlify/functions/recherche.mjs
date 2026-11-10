// « Recommandez-moi un son » : recherche de morceaux sur Spotify (dès 3 lettres), ou infos d'un
// lien Spotify collé. Côté serveur : les clés de l'app restent dans les variables Netlify.
// GET /api/recherche?q=nina%20simone  →  { resultats: [{ id, titre, artiste, annee, pochette, lien }] }
import { reponse } from '../lib/deezer.mjs';
import { demanderJeton } from '../lib/spotify.mjs';

const delai = () => ({ signal: AbortSignal.timeout(8000) });
const versResultat = (t) => ({
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
    // lien Spotify collé : open.spotify.com/track/ID (avec ou sans /intl-fr/)
    const id = q.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]{22})/)?.[1];
    if (id) {
      const r = await fetch(`https://api.spotify.com/v1/tracks/${id}?market=FR`, auth);
      if (!r.ok) return reponse({ resultats: [] }, 200, 600);
      return reponse({ resultats: [versResultat(await r.json())] }, 200, 86400);
    }
    const r = await fetch(`https://api.spotify.com/v1/search?type=track&limit=6&market=FR&q=${encodeURIComponent(q)}`, auth);
    if (!r.ok) throw new Error(`Spotify ${r.status}`);
    const items = (await r.json()).tracks?.items ?? [];
    return reponse({ resultats: items.map(versResultat) }, 200, 3600);
  } catch {
    return reponse({ erreur: 'recherche indisponible' }, 502, 30);
  }
};

export const config = { path: '/api/recherche' };
