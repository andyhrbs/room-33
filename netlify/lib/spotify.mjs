// Outils communs aux Functions Spotify (côté serveur Netlify uniquement).
// Les clés sont lues dans les variables d'environnement, jamais renvoyées.
// Portées autorisées lors de la connexion unique (10 nov. 2026) :
// user-read-currently-playing user-read-recently-played user-top-read.
// Pour relier un autre compte un jour : restaurer les Functions spotify-connexion et
// spotify-callback depuis le commit d65d747 (git), le temps d'obtenir un nouveau token.

export const cles = () => ({
  id: process.env.SPOTIFY_CLIENT_ID,
  secret: process.env.SPOTIFY_CLIENT_SECRET,
  refresh: process.env.SPOTIFY_REFRESH_TOKEN,
});

export const basic = ({ id, secret }) => 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');

export async function demanderJeton(corps) {
  const rep = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: basic(cles()), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(corps),
    signal: AbortSignal.timeout(8000),
  });
  if (!rep.ok) throw new Error(`jeton refusé (${rep.status})`);
  return rep.json();
}

