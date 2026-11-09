// « Ce que j'écoute » : lit le compte Spotify d'Andyh côté serveur et renvoie
// seulement ce que la page Platine affiche. Réponse mise en cache 60 s sur le CDN Netlify.
import { cles, demanderJeton } from './_spotify.mjs';

const PERIODES = { '4-semaines': 'short_term', '6-mois': 'medium_term', '1-an': 'long_term' };
const pochette = (images = []) => (images.find((i) => i.width === 300) || images[0])?.url ?? null;
const morceau = (t) => t && { titre: t.name, artiste: t.artists.map((a) => a.name).join(', '), album: t.album?.name, annee: Number(String(t.album?.release_date ?? '').slice(0, 4)) || null, pochette: pochette(t.album?.images), duree: `${Math.floor(t.duration_ms / 60000)}:${String(Math.round((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`, lien: t.external_urls?.spotify };

const json = (donnees, statut = 200, cache = 60) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${cache}, stale-while-revalidate=300`, 'Netlify-Vary': 'query=periode' },
  });

export default async (req) => {
  if (!cles().refresh) return json({ erreur: 'Spotify pas encore relié' }, 503, 10);
  const periode = PERIODES[new URL(req.url).searchParams.get('periode')] ?? 'short_term';
  try {
    const { access_token } = await demanderJeton({ grant_type: 'refresh_token', refresh_token: cles().refresh });
    const api = async (chemin) => {
      const r = await fetch('https://api.spotify.com/v1' + chemin, { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(8000) });
      if (r.status === 204) return null;
      if (!r.ok) throw new Error(`Spotify ${r.status}`);
      return r.json();
    };
    const [enCours, recents, titres, artistes] = await Promise.all([
      api('/me/player/currently-playing?market=FR'),
      api('/me/player/recently-played?limit=1'),
      api(`/me/top/tracks?limit=5&time_range=${periode}`),
      api(`/me/top/artists?limit=5&time_range=${periode}`),
    ]);
    const joue = enCours?.is_playing && enCours.item?.type === 'track';
    return json({
      enCours: joue ? morceau(enCours.item) : null,
      derniere: recents?.items?.[0] ? { ...morceau(recents.items[0].track), le: recents.items[0].played_at } : null,
      topTitres: (titres?.items ?? []).map(morceau),
      topArtistes: (artistes?.items ?? []).map((a) => ({ nom: a.name, image: pochette(a.images), genres: a.genres?.slice(0, 2) ?? [], lien: a.external_urls?.spotify })),
      periode,
      majLe: new Date().toISOString(),
    });
  } catch (e) {
    return json({ erreur: 'Spotify indisponible pour le moment' }, 502, 10);
  }
};

export const config = { path: '/api/spotify/ecoute' };
