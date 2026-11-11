// Recherche d'un morceau sur Deezer (API publique, sans clé) pour obtenir
// l'extrait de 30 s et le lien Deezer. Côté serveur uniquement (Netlify Functions).
const normal = (s = '') => s.toLowerCase().normalize('NFD').replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');

async function api(chemin) {
  const rep = await fetch('https://api.deezer.com' + chemin, { signal: AbortSignal.timeout(8000) });
  if (!rep.ok) throw new Error(`Deezer ${rep.status}`);
  const d = await rep.json();
  if (d.error) throw new Error('Deezer : ' + (d.error.message || 'erreur'));
  return d;
}
const chercher = async (q) => ((await api(`/search?limit=25&q=${encodeURIComponent(q)}`)).data || []).filter((t) => t.preview);
// un morceau précis (id Deezer ou code ISRC) ; null s'il n'existe pas ou n'a pas d'extrait
const exact = async (chemin) => { try { const t = await api(chemin); return t?.id && t.preview ? t : null; } catch { return null; } };
const variantesUpc = (upc) => [...new Set([upc, upc.replace(/^0+/, ''), upc.padStart(13, '0'), upc.padStart(12, '0')])];
async function pistesAlbum(upc) {
  for (const code of variantesUpc(upc)) {
    try { const a = await api(`/album/upc:${code}`); if (a?.id) return ((await api(`/album/${a.id}/tracks?limit=200`)).data || []).filter((t) => t.preview); } catch { /* variante suivante */ }
  }
  return [];
}
// titre « propre » pour la recherche : sans (feat. …), [Remastered], « - Live »…
const nu = (s = '') => s.replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/\s[-–]\s.*$/, '').replace(/\s(feat|ft)\.?\s.*$/i, '').trim();

// type « titre » : le morceau lui-même ; type « album » : le morceau le plus écouté de l'album.
// Ordre : id Deezer (trouvé au build) → code ISRC → album par UPC → recherche par nom.
export async function trouverMorceau({ titre, artiste, type = 'titre', deezer, isrc, upc }) {
  const a = normal(artiste.split(/,|&| et | x /i)[0]);
  const memeArtiste = (t) => normal(t.artist?.name).includes(a) || a.includes(normal(t.artist?.name)) || (t.contributors || []).some((c) => normal(c.name).includes(a));
  let t = (deezer && (await exact(`/track/${deezer}`))) || (isrc && (await exact(`/track/isrc:${isrc}`))) || null;
  if (!t && upc) {
    const pistes = await pistesAlbum(upc);
    t = type === 'album' ? pistes.sort((x, y) => (y.rank || 0) - (x.rank || 0))[0] : pistes.find((x) => normal(nu(x.title)) === normal(nu(titre)));
  }
  if (!t) {
    let resultats;
    if (type === 'album') {
      resultats = (await chercher(`artist:"${nu(artiste)}" album:"${nu(titre)}"`)).filter((x) => memeArtiste(x) && normal(x.album?.title).startsWith(normal(titre).slice(0, 12)));
      if (!resultats.length) resultats = (await chercher(`${artiste} ${titre}`)).filter(memeArtiste);
      resultats.sort((x, y) => (y.rank || 0) - (x.rank || 0));
    } else {
      const q = nu(titre).replace(/"/g, '');
      resultats = (await chercher(`artist:"${artiste.split(/,|&/)[0].trim()}" track:"${q}"`)).filter(memeArtiste);
      if (!resultats.length) resultats = (await chercher(`${artiste.split(/,|&/)[0].trim()} ${q}`)).filter(memeArtiste);
      const pareil = resultats.find((x) => normal(nu(x.title)) === normal(nu(titre)));
      if (pareil) resultats = [pareil, ...resultats];
    }
    t = resultats[0];
  }
  if (!t) return null;
  return { titre: t.title_short || t.title, artiste: t.artist.name, extrait: t.preview, lien: t.link, pochette: t.album?.cover_medium || null, pochetteGrande: t.album?.cover_xl || t.album?.cover_big || null };
}

export const reponse = (donnees, statut = 200, cache = 600) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${cache}, stale-while-revalidate=${cache}`, 'Netlify-Vary': 'query' },
  });

export const parametres = (req) => {
  const u = new URL(req.url).searchParams;
  const titre = (u.get('titre') || '').slice(0, 200), artiste = (u.get('artiste') || '').slice(0, 200);
  const type = u.get('type') === 'album' ? 'album' : u.get('type') === 'artiste' ? 'artiste' : 'titre';
  // facultatifs (albums) : code-barres UPC et lien Spotify déjà connus au build
  const upc = /^\d{8,14}$/.test(u.get('upc') || '') ? u.get('upc') : undefined;
  const spotify = /^https:\/\/open\.spotify\.com\/(album|track)\/[A-Za-z0-9]{22}$/.test(u.get('spotify') || '') ? u.get('spotify') : undefined;
  // facultatifs (morceaux) : id Deezer trouvé au build, code ISRC donné par Spotify
  const deezer = /^\d{1,12}$/.test(u.get('deezer') || '') ? u.get('deezer') : undefined;
  const isrc = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/i.test(u.get('isrc') || '') ? u.get('isrc').toUpperCase() : undefined;
  return titre && artiste ? { titre, artiste, type, upc, spotify, deezer, isrc } : null;
};
