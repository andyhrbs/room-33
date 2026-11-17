// Lecture des écoutes Spotify d'Andyh (côté serveur uniquement) : utilisée par la Function /api/spotify/ecoute
// (en direct) et au build (copie des dernières vraies écoutes, affichée si Spotify ne répond pas).
import { cles, demanderJeton } from './spotify.mjs';

export const PERIODES = { '4-semaines': 'short_term', '6-mois': 'medium_term', '1-an': 'long_term' };
const pochette = (images = []) => (images.find((i) => i.width === 300) || images[0])?.url ?? null;
const morceau = (t) => t && { titre: t.name, artiste: t.artists.map((a) => a.name).join(', '), isrc: t.external_ids?.isrc, album: t.album?.name, annee: Number(String(t.album?.release_date ?? '').slice(0, 4)) || null, pochette: pochette(t.album?.images), duree: `${Math.floor(t.duration_ms / 60000)}:${String(Math.round((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`, lien: t.external_urls?.spotify };

export async function jeton() {
  const { access_token } = await demanderJeton({ grant_type: 'refresh_token', refresh_token: cles().refresh });
  return access_token;
}

// periode : '4-semaines' | '6-mois' | '1-an' ; accessToken : réutilisable pour plusieurs périodes
export async function lireEcoutes(periode, accessToken) {
  const t = accessToken ?? (await jeton());
  const api = async (chemin) => {
    const r = await fetch('https://api.spotify.com/v1' + chemin, { headers: { Authorization: `Bearer ${t}` }, signal: AbortSignal.timeout(8000) });
    if (r.status === 204) return null;
    if (!r.ok) throw new Error(`Spotify ${r.status}`);
    return r.json();
  };
  const plage = PERIODES[periode] ?? 'short_term';
  const [enCours, recents, titres, artistes] = await Promise.all([
    api('/me/player/currently-playing?market=FR'),
    api('/me/player/recently-played?limit=1'),
    api(`/me/top/tracks?limit=5&time_range=${plage}`),
    api(`/me/top/artists?limit=5&time_range=${plage}`),
  ]);
  const joue = enCours?.is_playing && enCours.item?.type === 'track';
  return {
    enCours: joue ? morceau(enCours.item) : null,
    derniere: recents?.items?.[0] ? { ...morceau(recents.items[0].track), le: recents.items[0].played_at } : null,
    topTitres: (titres?.items ?? []).map(morceau),
    topArtistes: (artistes?.items ?? []).map((a) => ({ nom: a.name, image: pochette(a.images), genres: a.genres?.slice(0, 2) ?? [], lien: a.external_urls?.spotify })),
    periode: plage,
    majLe: new Date().toISOString(),
  };
}
