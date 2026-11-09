// Étape 1 de la connexion (à faire une seule fois) : envoie Andyh sur Spotify
// pour autoriser Room 33 à lire ses écoutes. Désactivée dès que le jeton existe.
import { cles, page, PORTEES } from '../lib/spotify.mjs';

export default async (req) => {
  const { id, secret, refresh } = cles();
  if (refresh) return page('Déjà connecté', '<p>Room 33 est déjà relié à votre compte Spotify. Cette page est désactivée.</p>', 410);
  if (!id || !secret) return page('Clés manquantes', '<p>Ajoutez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET dans Netlify.</p>', 500);
  const origine = new URL(req.url).origin;
  const etat = crypto.randomUUID();
  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = new URLSearchParams({ client_id: id, response_type: 'code', redirect_uri: `${origine}/api/spotify/callback`, scope: PORTEES, state: etat, show_dialog: 'true' });
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString(), 'Set-Cookie': `etat_spotify=${etat}; Path=/api/spotify; HttpOnly; Secure; SameSite=Lax; Max-Age=600`, 'Cache-Control': 'no-store' },
  });
};

export const config = { path: '/api/spotify/connexion' };
