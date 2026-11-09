// Étape 2 : Spotify renvoie ici avec un code. On l'échange contre un « refresh token »
// qu'Andyh copie UNE fois dans Netlify (SPOTIFY_REFRESH_TOKEN). Rien n'est enregistré ici.
import { cles, demanderJeton, page } from './_spotify.mjs';

export default async (req) => {
  if (cles().refresh) return page('Déjà connecté', '<p>Room 33 est déjà relié à Spotify. Cette page est désactivée.</p>', 410);
  const url = new URL(req.url);
  const erreur = url.searchParams.get('error');
  if (erreur) return page('Connexion annulée', `<p>Spotify a répondu : ${erreur.replace(/[^a-z_]/gi, '')}. Vous pouvez recommencer depuis /api/spotify/connexion.</p>`, 400);
  const etatCookie = (req.headers.get('cookie') || '').match(/etat_spotify=([\w-]+)/)?.[1];
  if (!etatCookie || etatCookie !== url.searchParams.get('state')) return page('Lien expiré', '<p>Recommencez depuis /api/spotify/connexion (le lien est valable 10 minutes).</p>', 400);
  try {
    const jeton = await demanderJeton({ grant_type: 'authorization_code', code: url.searchParams.get('code') || '', redirect_uri: `${url.origin}/api/spotify/callback` });
    if (!jeton.refresh_token) throw new Error('pas de refresh token');
    return page('C’est relié.', `
<p>Copiez ce code, puis collez-le dans Netlify : <strong>Project configuration → Environment variables → Add a variable</strong>, nom <code>SPOTIFY_REFRESH_TOKEN</code>, même réglage que les deux autres.</p>
<textarea readonly rows="4" style="width:100%;font:14px monospace;background:#120B07;color:#EFE6D2;border:1px solid #4A3626;border-radius:8px;padding:12px" onclick="this.select()">${jeton.refresh_token}</textarea>
<p style="color:rgb(239 230 210 / .62)">Ne le partagez avec personne, pas même dans une conversation. Une fois la variable enregistrée, relancez un déploiement : cette page se désactivera toute seule.</p>`);
  } catch (e) {
    return page('Échec de la connexion', `<p>${String(e.message).replace(/[<>]/g, '')}. Vérifiez que l’adresse de redirection ${url.origin}/api/spotify/callback est bien enregistrée dans votre app Spotify.</p>`, 500);
  }
};

export const config = { path: '/api/spotify/callback' };
