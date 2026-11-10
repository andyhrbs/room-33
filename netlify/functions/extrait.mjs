// Extrait de 30 s (Deezer) d'un morceau ou d'un album, à la demande du lecteur.
// Les liens d'extrait Deezer expirent : réponse mise en cache 10 min seulement.
import { trouverMorceau, reponse, parametres } from '../lib/deezer.mjs';

export default async (req) => {
  const p = parametres(req);
  if (!p) return reponse({ erreur: 'titre et artiste requis' }, 400, 60);
  try {
    const m = await trouverMorceau(p);
    return m ? reponse(m) : reponse({ erreur: 'Extrait introuvable' }, 404, 3600);
  } catch {
    return reponse({ erreur: 'Deezer indisponible' }, 502, 30);
  }
};

export const config = { path: '/api/extrait' };
