// Outils communs aux Functions Spotify (côté serveur Netlify uniquement).
// Les clés sont lues dans les variables d'environnement, jamais renvoyées.
export const PORTEES = 'user-read-currently-playing user-read-recently-played user-top-read';

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

export const page = (titre, contenu, statut = 200) =>
  new Response(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titre} · Room 33</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#1F150E;color:#EFE6D2;font:16px/1.55 system-ui,sans-serif;padding:24px">
<main style="max-width:36rem;display:grid;gap:16px"><h1 style="font:400 32px/1.2 Georgia,serif;margin:0">${titre}</h1>${contenu}</main></body></html>`,
    { status: statut, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );
