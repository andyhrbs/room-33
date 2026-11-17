// « Ce que j'écoute » : lit le compte Spotify d'Andyh côté serveur et renvoie
// seulement ce que la page Platine affiche. Réponse mise en cache 60 s sur le CDN Netlify.
import { cles } from '../lib/spotify.mjs';
import { lireEcoutes } from '../lib/ecoute.mjs';

const json = (donnees, statut = 200, cache = 60) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${cache}, stale-while-revalidate=300`, 'Netlify-Vary': 'query=periode' },
  });

export default async (req) => {
  if (!cles().refresh) return json({ erreur: 'Spotify pas encore relié' }, 503, 10);
  try {
    return json(await lireEcoutes(new URL(req.url).searchParams.get('periode') ?? '4-semaines'));
  } catch {
    return json({ erreur: 'Spotify indisponible pour le moment' }, 502, 10);
  }
};

export const config = { path: '/api/spotify/ecoute' };
