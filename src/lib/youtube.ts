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
// en-têtes « navigateur » + accord cookies déjà donné : sinon YouTube peut renvoyer sa page de consentement (UE) sans données
const ENTETES = { 'Accept-Language': 'fr-FR,fr;q=0.9', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', Cookie: 'SOCS=CAI; CONSENT=YES+1' };
const plusGrande = (json?: string) => {
  if (!json) return undefined;
  try { return (JSON.parse(json) as { url: string; width?: number }[]).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url?.replace(/^\/\//, 'https://'); } catch { return undefined; }
};

async function lire(id: string): Promise<InfosVideo> {
  const infos: InfosVideo = {};
  let pageChaine: string | undefined;
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, delai());
    if (r.ok) { const o = await r.json(); infos.chaine = o.author_name || undefined; pageChaine = o.author_url || undefined; }
  } catch { /* pas de réseau */ }
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=fr`, { ...delai(), headers: ENTETES });
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
      // photo de la chaîne : les 1res vignettes qui suivent « videoOwnerRenderer » (l'ordre des clés change selon les pages)
      const i = html.indexOf('"videoOwnerRenderer"');
      const vignettes = i >= 0 ? html.slice(i, i + 4000).match(/"thumbnails":(\[[^\]]+\])/)?.[1] : undefined;
      if (vignettes) infos.avatar = plusGrande(vignettes);
    }
  } catch { /* page illisible : on garde le reste */ }
  // secours : la page de la chaîne (lien donné par oEmbed) → sa photo de profil (og:image)
  if (!infos.avatar && pageChaine) {
    try {
      const r = await fetch(pageChaine, { ...delai(), headers: ENTETES });
      if (r.ok) {
        const html = await r.text();
        infos.avatar = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&')
          ?? (() => { const cle = '"avatar":{"thumbnails":'; const j = html.indexOf(cle); return j >= 0 ? plusGrande(html.slice(j + cle.length).match(/^(\[[^\]]+\])/)?.[1]) : undefined; })();
      }
    } catch { /* on garde la lettrine */ }
  }
  if (!infos.avatar) console.warn(`[YouTube] photo de la chaîne introuvable pour ${id}`);
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
