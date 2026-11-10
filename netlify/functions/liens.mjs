// « Ouvrir l'app » : liens du même morceau sur Spotify, Apple Music, Deezer et
// YouTube Music, via Odesli (song.link). Mis en cache une semaine.
import { trouverMorceau, reponse, parametres } from '../lib/deezer.mjs';

const PLATEFORMES = { spotify: 'spotify', appleMusic: 'apple', deezer: 'deezer', youtubeMusic: 'youtube' };

export default async (req) => {
  const p = parametres(req);
  if (!p) return reponse({ erreur: 'titre et artiste requis' }, 400, 60);
  try {
    const m = await trouverMorceau(p);
    if (!m) return reponse({ erreur: 'Morceau introuvable' }, 404, 3600);
    const liens = { deezer: m.lien };
    try {
      const rep = await fetch(`https://api.song.link/v1-alpha.1/links?userCountry=FR&url=${encodeURIComponent(m.lien)}`, { signal: AbortSignal.timeout(8000) });
      if (rep.ok) {
        const d = await rep.json();
        for (const [cle, nom] of Object.entries(PLATEFORMES)) if (d.linksByPlatform?.[cle]?.url) liens[nom] = d.linksByPlatform[cle].url;
      }
    } catch { /* Odesli indisponible : on garde au moins Deezer */ }
    return reponse({ titre: m.titre, artiste: m.artiste, liens }, 200, Object.keys(liens).length > 1 ? 604800 : 600);
  } catch {
    return reponse({ erreur: 'Service indisponible' }, 502, 30);
  }
};

export const config = { path: '/api/liens' };
