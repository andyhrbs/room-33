// ==========================================================================
// Room 33 — Les lives (vidéos YouTube). Contenu modifiable dans /admin
// (rubrique « Les lives », fichier src/data/cms/lives.json).
// Le premier de la liste est « à la une » : dans l'admin, il suffit de glisser un live en haut.
// ==========================================================================
import donnees from './cms/lives.json';

export interface Live {
  youtube: string;   // identifiant de la vidéo (11 caractères), tiré du lien collé dans l'admin
  artiste: string;
  titre: string;
  lieu: string;      // émission, lieu, ville
  annee: number;
  mot: string;       // ton mot (une à trois phrases)
}

// Accepte un lien YouTube sous toutes ses formes (watch?v=, youtu.be/, /live/, /shorts/, /embed/) ou l'identifiant seul
export function idYoutube(video: string): string | null {
  const v = (video || '').trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(/(?:v=|youtu\.be\/|\/(?:live|shorts|embed)\/)([\w-]{11})/);
  return m ? m[1] : null;
}

type Entree = { video: string; artiste: string; titre: string; lieu?: string; annee?: number; mot?: string };

export const lives: Live[] = (donnees.lives as Entree[])
  .map((l) => ({ ...l, youtube: idYoutube(l.video) }))
  .filter((l): l is Entree & { youtube: string } => !!l.youtube) // un lien illisible ne casse pas la page : le live est ignoré
  .map((l) => ({
    youtube: l.youtube, artiste: l.artiste, titre: l.titre, lieu: l.lieu ?? '',
    annee: Number(l.annee) || new Date().getFullYear(), mot: l.mot ?? '',
  }));
