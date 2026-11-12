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
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const dateFr = (brut?: string) => {
  if (!brut) return undefined;
  const d = new Date(brut);
  // date au format ISO → « 13 juillet 2020 »
  if (!Number.isNaN(d.getTime()) && /^\d{4}-/.test(brut)) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  // texte de la page YouTube (« Sortie le 13 juil. 2020 », « Diffusé en direct le 4 août 2022 ») → « 13 juillet 2020 »
  const m = brut.match(/(\d{1,2})(?:er)?\s+([a-zéèûô]+)\.?\s+(\d{4})/i);
  if (m) {
    const brutMois = m[2].toLowerCase().normalize('NFD');
    // « juin » et « juil. » commencent pareil : on regarde la 4e lettre
    const nom = MOIS.find((x) => x.normalize('NFD').startsWith(brutMois.slice(0, brutMois.startsWith('ju') ? 4 : 3)));
    if (nom) return `${Number(m[1])} ${nom} ${m[3]}`;
  }
  // texte relatif (« il y a 3 ans ») ou illisible : rien, le site affiche alors l'année saisie dans l'admin
  return undefined;
};

// Photo de la chaîne, réduite à 96 px et écrite DANS la page (image en « data URI », ~3 Ko) :
// elle s'affiche en même temps que le texte, sans attendre un second téléchargement.
// Pas de photo : null (la lettrine R reste visible).
const cachePhotos = new Map<string, Promise<string | null>>();
export const photoChaine = (id: string) => {
  if (!cachePhotos.has(id)) cachePhotos.set(id, (async () => {
    const { avatar } = await infosVideo(id);
    if (!avatar) return null;
    try {
      const r = await fetch(avatar, delai());
      if (!r.ok) return null;
      const { default: sharp } = await import('sharp');
      const petite = await sharp(Buffer.from(await r.arrayBuffer())).resize(96, 96, { fit: 'cover' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      return `data:image/jpeg;base64,${petite.toString('base64')}`;
    } catch { return null; }
  })());
  return cachePhotos.get(id)!;
};
