// ==========================================================================
// Room 33 — Accès à Spotify, côté serveur uniquement.
// Les clés sont lues dans les variables d'environnement de Netlify.
// Ce fichier n'est jamais envoyé au navigateur : il ne sert qu'au build
// (et plus tard aux Netlify Functions). Ne jamais afficher une clé.
// ==========================================================================

export const clesPresentes = () => ({
  clientId: Boolean(process.env.SPOTIFY_CLIENT_ID),
  clientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
});

// Demande un jeton « application » à Spotify (client credentials).
// Renvoie le jeton, ou une erreur lisible sans jamais contenir les clés.
export async function jetonApplication(): Promise<{ ok: true; jeton: string } | { ok: false; erreur: string }> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return { ok: false, erreur: 'clés absentes' };
  try {
    const rep = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!rep.ok) return { ok: false, erreur: `Spotify a refusé les clés (code ${rep.status})` };
    const donnees = await rep.json();
    return { ok: true, jeton: donnees.access_token };
  } catch {
    return { ok: false, erreur: 'Spotify injoignable pendant le build' };
  }
}
