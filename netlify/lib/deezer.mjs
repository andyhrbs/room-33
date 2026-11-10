// Recherche d'un morceau sur Deezer (API publique, sans clé) pour obtenir
// l'extrait de 30 s et le lien Deezer. Côté serveur uniquement (Netlify Functions).
const normal = (s = '') => s.toLowerCase().normalize('NFD').replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');

async function chercher(q) {
  const rep = await fetch(`https://api.deezer.com/search?limit=25&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8000) });
  if (!rep.ok) throw new Error(`Deezer ${rep.status}`);
  const d = await rep.json();
  if (d.error) throw new Error('Deezer : ' + (d.error.message || 'erreur'));
  return (d.data || []).filter((t) => t.preview);
}

// type « titre » : le morceau lui-même ; type « album » : le morceau le plus écouté de l'album
export async function trouverMorceau({ titre, artiste, type = 'titre' }) {
  const a = normal(artiste);
  const memeArtiste = (t) => normal(t.artist?.name).includes(a) || a.includes(normal(t.artist?.name));
  let resultats;
  if (type === 'album') {
    resultats = (await chercher(`artist:"${artiste}" album:"${titre}"`)).filter((t) => memeArtiste(t) && normal(t.album?.title).startsWith(normal(titre).slice(0, 12)));
    if (!resultats.length) resultats = (await chercher(`${artiste} ${titre}`)).filter(memeArtiste);
    resultats.sort((x, y) => (y.rank || 0) - (x.rank || 0));
  } else {
    resultats = (await chercher(`artist:"${artiste}" track:"${titre}"`)).filter(memeArtiste);
    if (!resultats.length) resultats = (await chercher(`${artiste} ${titre}`)).filter(memeArtiste);
    const exact = resultats.find((t) => normal(t.title) === normal(titre));
    if (exact) resultats = [exact, ...resultats];
  }
  const t = resultats[0];
  if (!t) return null;
  return { titre: t.title_short || t.title, artiste: t.artist.name, extrait: t.preview, lien: t.link, pochette: t.album?.cover_medium || null };
}

export const reponse = (donnees, statut = 200, cache = 600) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${cache}, stale-while-revalidate=${cache}`, 'Netlify-Vary': 'query' },
  });

export const parametres = (req) => {
  const u = new URL(req.url).searchParams;
  const titre = (u.get('titre') || '').slice(0, 200), artiste = (u.get('artiste') || '').slice(0, 200);
  const type = u.get('type') === 'album' ? 'album' : 'titre';
  return titre && artiste ? { titre, artiste, type } : null;
};
