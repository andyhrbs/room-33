// ==========================================================================
// Room 33 — Infos d'une vidéo YouTube, récupérées AU BUILD (sans clé d'API) :
// nom de la chaîne, photo de la chaîne, date de publication.
// - nom : oEmbed (officiel, stable) ; photo et date : lues dans la page publique de la vidéo.
// Si YouTube change sa page ou ne répond pas, on renvoie ce qu'on a : le site affiche alors
// le lieu et l'année saisis dans l'admin, et la lettrine R à la place de la photo.
// ==========================================================================
export interface InfosVideo { chaine?: string; avatar?: string; date?: string }

const cache = new Map<string, Promise<InfosVideo>>();
const delai = () => ({ signal: AbortSignal.timeout(8000) });

async function lire(id: string): Promise<InfosVideo> {
  const infos: InfosVideo = {};
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, delai());
    if (r.ok) infos.chaine = (await r.json()).author_name || undefined;
  } catch { /* pas de réseau */ }
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=fr`, { ...delai(), headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' } });
    if (r.ok) {
      const html = await r.text();
      // la date apparaît sous plusieurs formes selon la version de page que YouTube renvoie
      infos.date = [
        /<meta itemprop="(?:uploadDate|datePublished)" content="([^"]+)"/,
        /"(?:uploadDate|publishDate)":"(\d{4}-\d{2}-\d{2}[^"]*)"/,
        /"(?:uploadDate|publishDate)":\{"simpleText":"([^"]+)"\}/,
        /"dateText":\{"simpleText":"([^"]+)"\}/,
      ].map((re) => html.match(re)?.[1]).find(Boolean);
      if (!infos.date) console.warn(`[YouTube] date introuvable pour ${id}`);
      const vignettes = html.match(/"videoOwnerRenderer":\{"thumbnail":\{"thumbnails":(\[[^\]]+\])/)?.[1];
      if (vignettes) {
        const liste = JSON.parse(vignettes) as { url: string; width?: number }[];
        infos.avatar = liste.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url?.replace(/^\/\//, 'https://');
      }
    }
  } catch { /* page illisible : on garde le reste */ }
  return infos;
}

export const infosVideo = (id: string) => {
  if (!cache.has(id)) cache.set(id, lire(id));
  return cache.get(id)!;
};

// « 13 juillet 2020 »
export const dateFr = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  // date au format ISO → « 13 juillet 2020 » ; texte déjà lisible (« 13 juil. 2020 ») → tel quel
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};
