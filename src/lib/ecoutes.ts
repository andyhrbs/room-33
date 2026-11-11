// ==========================================================================
// Room 33 — « Ce qui tourne chez moi » : l'artiste et le titre les plus écoutés
// des 4 dernières semaines, lus AU BUILD sur le compte Spotify d'Andyh.
// Sert de valeur de départ à l'aperçu de la platine (accueil) : la page la remet
// à jour en direct via /api/spotify/ecoute. Sans clés ou si Spotify ne répond pas : null.
// ==========================================================================
export interface EcoutesDuMois {
  artiste: { nom: string; image?: string } | null;
  titre: { titre: string; artiste: string; pochette?: string; lien?: string } | null;
}

const image = (images: { url: string; width: number }[] = []) => (images.find((i) => i.width === 300) || images[0])?.url;

export async function ecoutesDuMois(): Promise<EcoutesDuMois | null> {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !secret || !refresh) return null;
  try {
    const rep = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
      signal: AbortSignal.timeout(8000),
    });
    if (!rep.ok) throw new Error(`jeton refusé (${rep.status})`);
    const { access_token } = await rep.json();
    const api = async (chemin: string) => {
      const r = await fetch('https://api.spotify.com/v1' + chemin, { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`Spotify ${r.status}`);
      return r.json();
    };
    const [artistes, titres] = await Promise.all([api('/me/top/artists?limit=1&time_range=short_term'), api('/me/top/tracks?limit=1&time_range=short_term')]);
    const a = artistes?.items?.[0];
    const t = titres?.items?.[0];
    return {
      artiste: a ? { nom: a.name, image: image(a.images) } : null,
      titre: t ? { titre: t.name, artiste: t.artists.map((x: { name: string }) => x.name).join(', '), pochette: image(t.album?.images), lien: t.external_urls?.spotify } : null,
    };
  } catch (e) {
    console.warn(`[Platine] écoutes du mois indisponibles au build : ${(e as Error).message}`);
    return null;
  }
}
