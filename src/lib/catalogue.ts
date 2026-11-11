// ==========================================================================
// Room 33 — Infos des disques depuis Spotify, récupérées AU BUILD.
// Pochette, année, label, lien et pistes sont écrits dans les pages HTML :
// les visiteurs ne parlent jamais à Spotify, et les clés restent sur Netlify.
// Sans clés (ou si Spotify ne répond pas), le site garde les motifs de démo.
// ==========================================================================
import { jetonApplication } from './spotify';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// ---------- Mémoire entre deux builds ----------
// Netlify garde node_modules d'un build à l'autre : on y range la dernière réponse Spotify réussie
// de chaque disque. Si Spotify refuse (trop de builds d'affilée : code 429) ou ne répond pas,
// le disque garde sa pochette, ses titres et ses extraits au lieu de retomber sur la démo.
const DOSSIER_MEMOIRE = 'node_modules/.cache/room33';
const FICHIER_MEMOIRE = `${DOSSIER_MEMOIRE}/disques-spotify.json`;
let memoire: Record<string, InfosSpotify> = {};
try { memoire = JSON.parse(readFileSync(FICHIER_MEMOIRE, 'utf8')); } catch { /* premier build : rien en mémoire */ }
const sauverMemoire = () => { try { mkdirSync(DOSSIER_MEMOIRE, { recursive: true }); writeFileSync(FICHIER_MEMOIRE, JSON.stringify(memoire)); } catch { /* pas grave */ } };
// État du dernier build, affiché dans /rapport-extraits.json (aide au diagnostic, sans aucune clé)
export const etatSpotify: { jeton?: string; erreurs: string[]; depuisMemoire: string[] } = { erreurs: [], depuisMemoire: [] };

export interface Piste { numero: number; titre: string; duree: string; deezer?: number } // deezer : id du morceau sur Deezer (extrait de 30 s), trouvé au build
export interface InfosSpotify { spotifyId: string; pochette?: string; annee?: number; label?: string; lienSpotify?: string; lienArtiste?: string; photoArtiste?: string; upc?: string; liens: Record<string, string>; pistes: Piste[]; extraitAlbum?: number; deezerAlbum?: number }

const API = 'https://api.spotify.com/v1';
const duree = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}`;

async function appel(jeton: string, chemin: string, essai = 0): Promise<any> {
  const rep = await fetch(API + chemin, { headers: { Authorization: `Bearer ${jeton}` }, signal: AbortSignal.timeout(10000) });
  // trop de demandes : Spotify dit combien de secondes attendre ; on attend (max 15 s) et on réessaie 2 fois
  if (rep.status === 429 && essai < 2) {
    const attente = Math.min(Number(rep.headers.get('retry-after')) || 3, 15);
    console.warn(`[Spotify] 429 (trop de demandes) : pause de ${attente} s`);
    await new Promise((r) => setTimeout(r, attente * 1000));
    return appel(jeton, chemin, essai + 1);
  }
  if (!rep.ok) throw new Error(`Spotify ${rep.status} sur ${chemin.split('?')[0]}`);
  return rep.json();
}

// ---------- Extraits Deezer, résolus au build ----------
// Pour chaque piste, on garde l'id Deezer du MÊME morceau (le lien d'extrait, lui, expire : il est
// redemandé au clic par /api/extrait?deezer=…). Ordre d'essai : album Deezer retrouvé par son UPC
// (même disque, même ordre de pistes), puis le code ISRC du morceau (identifiant unique d'un enregistrement).
type PisteDeezer = { id: number; title: string; title_short?: string; preview?: string; track_position?: number; disk_number?: number; rank?: number; readable?: boolean };
const simple = (s = '') => s.toLowerCase().normalize('NFD').replace(/\([^)]*\)|\[[^\]]*\]| - .*$/g, '').replace(/[^a-z0-9]/g, '');
async function deezerJson(chemin: string) {
  const r = await fetch('https://api.deezer.com' + chemin, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Deezer ${r.status}`);
  const d = await r.json();
  if (d?.error) throw new Error('Deezer : ' + (d.error.message || 'erreur'));
  return d;
}
async function pistesDeezerParUpc(upc: string): Promise<PisteDeezer[]> {
  for (const code of variantesUpc(upc)) {
    try {
      const a = await deezerJson(`/album/upc:${code}`);
      if (!a?.id) continue;
      return (await deezerJson(`/album/${a.id}/tracks?limit=200`)).data ?? [];
    } catch { /* variante suivante */ }
  }
  return [];
}
// album absent sous ce code UPC (édition deluxe, autre pressage…) : on le cherche par artiste + titre
async function pistesDeezerParNom(artiste: string, titre: string): Promise<PisteDeezer[]> {
  try {
    const r = (await deezerJson(`/search/album?limit=10&q=${encodeURIComponent(`artist:"${artiste}" album:"${titre}"`)}`)).data ?? [];
    const al = r.find((x: any) => simple(x.artist?.name) === simple(artiste) && simple(x.title).startsWith(simple(titre)));
    return al ? (await deezerJson(`/album/${al.id}/tracks?limit=200`)).data ?? [] : [];
  } catch { return []; }
}
async function deezerParIsrc(isrc: string): Promise<PisteDeezer | undefined> {
  try { const t = await deezerJson(`/track/isrc:${isrc}`); return t?.id ? t : undefined; } catch { return undefined; }
}
export const rapportExtraits: { disque: string; pistes: number; sansExtrait: string[]; source: string }[] = [];

// Retrouve l'identifiant Spotify d'un album à partir de son titre et de son artiste
async function chercherAlbum(jeton: string, titre: string, artiste: string): Promise<string | undefined> {
  const q = encodeURIComponent(`album:${titre} artist:${artiste}`);
  const r = await appel(jeton, `/search?type=album&limit=5&market=FR&q=${q}`);
  const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const items: any[] = r.albums?.items ?? [];
  const exact = items.find((a) => normal(a.name).startsWith(normal(titre)) && a.artists.some((x: any) => normal(x.name) === normal(artiste)));
  return (exact ?? items.find((a) => a.artists.some((x: any) => normal(x.name) === normal(artiste))))?.id;
}


// ---------- Liens « Ouvrir l'app » résolus au build, par code-barres (UPC) ----------
// Le code UPC identifie un album de façon unique dans tous les catalogues : Apple Music et Deezer
// retrouvent exactement le même disque, sans dépendre d'une recherche par titre (fragile sur
// les titres courts ou courants comme « Absolutely »).
const variantesUpc = (upc: string) => [...new Set([upc, upc.replace(/^0+/, ''), upc.padStart(13, '0'), upc.padStart(12, '0')])];
const sansSuivi = (u?: string) => u?.replace('itunes.apple.com', 'music.apple.com').replace(/[?&]uo=\d+/, '');
async function appleParUpc(upc: string): Promise<string | undefined> {
  for (const pays of ['fr', 'us']) {
    for (const code of variantesUpc(upc)) {
      try {
        const r = await fetch(`https://itunes.apple.com/lookup?upc=${code}&country=${pays}&entity=album`, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) continue;
        const album = ((await r.json()).results ?? []).find((x: any) => x.wrapperType === 'collection' || x.collectionType === 'Album');
        if (album?.collectionViewUrl) return sansSuivi(album.collectionViewUrl);
      } catch { /* on essaie la variante suivante */ }
    }
  }
  return undefined;
}
async function deezerParUpc(upc: string): Promise<string | undefined> {
  for (const code of variantesUpc(upc)) {
    try {
      const r = await fetch(`https://api.deezer.com/album/upc:${code}`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const a = await r.json();
      if (a?.link && !a.error) return a.link;
    } catch { /* variante suivante */ }
  }
  return undefined;
}

// ---------- Catalogue depuis Deezer (source principale) ----------
// Deezer (API publique, sans clé, limites larges) donne tout ce qu'affiche une fiche : pochette 1000 px,
// année, label, titres et durées, photo de l'artiste, code-barres et extraits — ceux du MÊME album.
// Spotify ne sert plus qu'en secours (album absent de Deezer) et pour les écoutes perso de la platine.
type EntreeAlbum = { cle: string; titre: string; artiste: string; spotifyId?: string };
const meme = (a = '', b = '') => { const x = simple(a), y = simple(b); return !!x && !!y && (x === y || x.includes(y) || y.includes(x)); };
const brut = (s = '') => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const VARIANTE = /\b(live|remix(es)?|deluxe|edition|version|instrumental|acoustic|remaster(ed)?|tour)\b/i;
async function albumParUpc(upc: string): Promise<number | undefined> {
  for (const code of variantesUpc(upc)) { try { const a = await deezerJson(`/album/upc:${code}`); if (a?.id) return a.id; } catch { /* variante suivante */ } }
  return undefined;
}
// Ordre : album déjà trouvé au build précédent → code-barres via le lien Spotify de l'admin (exact) →
// recherche par artiste + titre, en préférant le titre identique, l'album (pas le single), et en écartant live / deluxe / remix.
async function trouverAlbumDeezer(d: EntreeAlbum, jeton?: string, connu?: number): Promise<number | undefined> {
  if (connu) return connu;
  if (d.spotifyId && jeton) {
    try { const upc = (await appel(jeton, `/albums/${d.spotifyId}?market=FR`)).external_ids?.upc; const id = upc && (await albumParUpc(upc)); if (id) return id; } catch { /* Spotify indisponible : recherche */ }
  }
  const parties = d.artiste.split(/·|,|&/).map((x) => x.trim()).filter(Boolean); // classique : « Chopin · Martha Argerich »
  const candidats = new Map<number, any>();
  for (const q of [`artist:"${parties[0]}" album:"${d.titre}"`, `${parties[0]} ${d.titre}`, `album:"${d.titre}"`]) {
    try { for (const al of (await deezerJson(`/search/album?limit=25&q=${encodeURIComponent(q)}`)).data ?? []) if (parties.some((p) => meme(al.artist?.name, p))) candidats.set(al.id, al); } catch { /* requête suivante */ }
  }
  const t = d.titre;
  const proche = (al: any) => simple(al.title) === simple(t) || simple(al.title).startsWith(simple(t)) || simple(t).startsWith(simple(al.title));
  const score = (al: any) => (brut(al.title) === brut(t) ? 6 : 0) + (simple(al.title) === simple(t) ? 3 : 0) + (al.record_type === 'album' ? 3 : al.record_type === 'ep' ? 1 : 0)
    - (VARIANTE.test(al.title) && !VARIANTE.test(t) ? 4 : 0) + Math.min(al.nb_tracks ?? 0, 40) / 100;
  return [...candidats.values()].filter(proche).sort((x, y) => score(y) - score(x))[0]?.id;
}
const imageDeezer = (u?: string) => (u && !/\/(artist|cover)\/\//.test(u) ? u : undefined); // image vide = pas de photo
async function infosDeezer(d: EntreeAlbum, jeton?: string, connu?: number): Promise<InfosSpotify | undefined> {
  const id = await trouverAlbumDeezer(d, jeton, connu);
  if (!id) return undefined;
  const al = await deezerJson(`/album/${id}`);
  const pistesDz: PisteDeezer[] = (await deezerJson(`/album/${id}/tracks?limit=200`)).data ?? [];
  const upc: string | undefined = al.upc || undefined;
  const liens: Record<string, string> = {};
  if (d.spotifyId) liens.spotify = `https://open.spotify.com/album/${d.spotifyId}`;
  if (al.link) liens.deezer = al.link;
  if (upc) { const ap = await appleParUpc(upc); if (ap) liens.apple = ap; }
  const sansExtrait = pistesDz.filter((t) => !t.preview).map((t) => t.title);
  rapportExtraits.push({ disque: `${d.artiste} — ${d.titre}`, pistes: pistesDz.length, sansExtrait, source: 'Deezer' });
  if (sansExtrait.length) console.warn(`[Extraits] ${d.artiste} — ${d.titre} : pas d'extrait pour ${sansExtrait.join(' · ')}`);
  return {
    spotifyId: d.spotifyId ?? '',
    pochette: imageDeezer(al.cover_xl || al.cover_big),
    annee: al.release_date ? Number(String(al.release_date).slice(0, 4)) || undefined : undefined,
    label: al.label || undefined,
    lienSpotify: liens.spotify,
    photoArtiste: imageDeezer(al.artist?.picture_xl || al.artist?.picture_big),
    upc,
    liens,
    pistes: pistesDz.map((t) => ({ numero: t.track_position ?? 0, titre: t.title, duree: duree(((t as any).duration ?? 0) * 1000), deezer: t.preview ? t.id : undefined })),
    extraitAlbum: pistesDz.filter((t) => t.preview).sort((x, y) => (y.rank ?? 0) - (x.rank ?? 0))[0]?.id,
    deezerAlbum: id,
  };
}

export async function infosAlbums(liste: EntreeAlbum[]): Promise<Map<string, InfosSpotify>> {
  const resultat = new Map<string, InfosSpotify>();
  const jeton = await jetonApplication(); // seulement pour le secours
  const restants: EntreeAlbum[] = [];
  for (const d of liste) {
    try {
      const cleM = `${d.artiste}|${d.titre}|${d.spotifyId ?? ''}`.toLowerCase();
      const i = await infosDeezer(d, jeton.ok ? jeton.jeton : undefined, memoire[cleM]?.deezerAlbum);
      if (i) { resultat.set(d.cle, i); memoire[cleM] = i; continue; }
      console.warn(`[Deezer] album introuvable : ${d.artiste} — ${d.titre} (on essaie Spotify)`);
      etatSpotify.erreurs.push(`${d.artiste} — ${d.titre} : absent de Deezer`);
    } catch (e) {
      console.warn(`[Deezer] ${d.artiste} — ${d.titre} : ${(e as Error).message} (on essaie Spotify)`);
      etatSpotify.erreurs.push(`${d.artiste} — ${d.titre} : Deezer ${(e as Error).message}`);
    }
    restants.push(d);
  }
  sauverMemoire();
  if (restants.length) for (const [k, v] of await infosAlbumsSpotify(restants)) resultat.set(k, v);
  console.log(`[Catalogue] ${resultat.size}/${liste.length} disques complétés (${liste.length - restants.length} depuis Deezer).`);
  return resultat;
}

async function infosAlbumsSpotify(liste: { cle: string; titre: string; artiste: string; spotifyId?: string }[]): Promise<Map<string, InfosSpotify>> {
  const resultat = new Map<string, InfosSpotify>();
  const cleMemoire = (d: { titre: string; artiste: string; spotifyId?: string }) => `${d.artiste}|${d.titre}|${d.spotifyId ?? ''}`.toLowerCase();
  const depuisMemoire = (d: { cle: string; titre: string; artiste: string; spotifyId?: string }) => {
    const m = memoire[cleMemoire(d)];
    if (m) { resultat.set(d.cle, m); etatSpotify.depuisMemoire.push(`${d.artiste} — ${d.titre}`); }
  };
  const jeton = await jetonApplication();
  if (!jeton.ok) {
    console.warn(`[Spotify] ${jeton.erreur} : disques repris de la mémoire du build précédent (sinon pochettes de démo).`);
    etatSpotify.jeton = jeton.erreur;
    liste.forEach(depuisMemoire);
    return resultat;
  }
  const photos = new Map<string, string | undefined>(); // une seule demande par artiste
  for (const d of liste) {
    try {
      const id = d.spotifyId ?? (await chercherAlbum(jeton.jeton, d.titre, d.artiste));
      if (!id) { console.warn(`[Spotify] album introuvable : ${d.artiste} — ${d.titre}`); etatSpotify.erreurs.push(`${d.artiste} — ${d.titre} : album introuvable`); depuisMemoire(d); continue; }
      const a = await appel(jeton.jeton, `/albums/${id}?market=FR`);
      // photo de l'artiste principal (section « Découvrir l'artiste »)
      const idArtiste: string | undefined = a.artists?.[0]?.id;
      if (idArtiste && !photos.has(idArtiste)) {
        try { photos.set(idArtiste, (await appel(jeton.jeton, `/artists/${idArtiste}`)).images?.[0]?.url); } catch { photos.set(idArtiste, undefined); }
      }
      // liens des apps, résolus une fois pour toutes ici (le visiteur n'attend rien, rien ne peut rater)
      const upc: string | undefined = a.external_ids?.upc;
      const liens: Record<string, string> = {};
      if (a.external_urls?.spotify) liens.spotify = a.external_urls.spotify;
      if (upc) {
        const [ap, dz] = await Promise.all([appleParUpc(upc), deezerParUpc(upc)]);
        if (ap) liens.apple = ap;
        if (dz) liens.deezer = dz;
      }
      const manque = ['spotify', 'apple', 'deezer'].filter((k) => !liens[k]);
      if (manque.length) console.warn(`[Liens] ${d.artiste} — ${d.titre} : lien introuvable au build pour ${manque.join(', ')} (recherche en direct au clic)`);
      // extraits : id Deezer de chaque piste (album par UPC, sinon ISRC piste par piste)
      const items: any[] = a.tracks?.items ?? [];
      let dz = upc ? await pistesDeezerParUpc(upc) : [];
      let source = dz.length ? 'album Deezer (UPC)' : '';
      if (!dz.length) { dz = await pistesDeezerParNom(d.artiste, d.titre); if (dz.length) source = 'album Deezer (titre)'; }
      const ids = new Map<string, number>(); // cle « disque-piste » → id Deezer
      const nomsDeezer = new Map<string, string>();
      const cleP = (p: any) => `${p.disc_number ?? 1}-${p.track_number}`;
      for (const p of items) {
        const memePlace = dz.find((t) => (t.disk_number ?? 1) === (p.disc_number ?? 1) && t.track_position === p.track_number);
        const ok = (t?: PisteDeezer) => t && t.preview && (simple(t.title).startsWith(simple(p.name).slice(0, 6)) || simple(p.name).startsWith(simple(t.title_short || t.title).slice(0, 6)));
        const t = ok(memePlace) ? memePlace : dz.find((x) => x.preview && simple(x.title_short || x.title) === simple(p.name));
        if (t) { ids.set(cleP(p), t.id); if (!p.name) nomsDeezer.set(cleP(p), t.title_short || t.title); } // Spotify donne parfois un titre vide
      }
      const manquantes = items.filter((p) => !ids.has(cleP(p)));
      let erreurIsrc = '';
      if (manquantes.length) {
        // codes ISRC : seulement dans la fiche complète d'un morceau (par lots de 50)
        for (let i = 0; i < manquantes.length; i += 50) {
          try {
            const lot = (await appel(jeton.jeton, `/tracks?ids=${manquantes.slice(i, i + 50).map((p) => p.id).join(',')}&market=FR`)).tracks ?? [];
            for (const t of lot) {
              const isrc = t?.external_ids?.isrc;
              const trouve = isrc ? await deezerParIsrc(isrc) : undefined;
              if (trouve?.preview) ids.set(cleP(t), trouve.id);
            }
          } catch (e) { console.warn(`[Extraits] ${d.artiste} — ${d.titre} : ISRC indisponibles (${(e as Error).message})`); erreurIsrc = (e as Error).message; }
        }
      }
      const sansExtrait = items.filter((p) => !ids.has(cleP(p))).map((p) => p.name);
      if (sansExtrait.length) console.warn(`[Extraits] ${d.artiste} — ${d.titre} : pas d'extrait Deezer pour ${sansExtrait.length}/${items.length} titre(s) : ${sansExtrait.join(' · ')}`);
      rapportExtraits.push({ disque: `${d.artiste} — ${d.titre}`, pistes: items.length, sansExtrait: sansExtrait.map((n) => n || '(titre sans nom)'), source: (source || 'ISRC') + (erreurIsrc ? ` · ISRC : ${erreurIsrc}` : '') });
      // extrait « de l'album » : son titre le plus écouté sur Deezer (sinon le 1er qui a un extrait)
      const extraitAlbum = dz.filter((t) => t.preview).sort((x, y) => (y.rank ?? 0) - (x.rank ?? 0))[0]?.id ?? [...ids.values()][0];
      resultat.set(d.cle, {
        extraitAlbum,
        spotifyId: id,
        pochette: a.images?.[0]?.url,
        annee: a.release_date ? Number(String(a.release_date).slice(0, 4)) : undefined,
        label: a.label || undefined,
        lienSpotify: a.external_urls?.spotify,
        lienArtiste: a.artists?.[0]?.external_urls?.spotify,
        photoArtiste: idArtiste ? photos.get(idArtiste) : undefined,
        upc,
        liens,
        pistes: items.map((p: any) => ({ numero: p.track_number, titre: p.name || nomsDeezer.get(cleP(p)) || '', duree: duree(p.duration_ms), deezer: ids.get(cleP(p)) })),
      });
    } catch (e) {
      console.warn(`[Spotify] ${d.artiste} — ${d.titre} : ${(e as Error).message}`);
      etatSpotify.erreurs.push(`${d.artiste} — ${d.titre} : ${(e as Error).message}`);
    }
    if (resultat.has(d.cle)) memoire[cleMemoire(d)] = resultat.get(d.cle)!;
    else depuisMemoire(d);
  }
  sauverMemoire();
  console.log(`[Spotify] ${resultat.size}/${liste.length} disques complétés (${etatSpotify.depuisMemoire.length} depuis la mémoire).`);
  return resultat;
}

// ---------- Morceaux recommandés (bac des visiteurs) ----------
export interface InfosTitre { titre: string; artiste: string; album?: string; pochette?: string; annee?: number; lienSpotify?: string }

// Un morceau par son lien Spotify (open.spotify.com/track/…), sinon cherché par titre + artiste
export async function infosTitres(liste: { cle: string; titre: string; artiste: string; spotifyId?: string }[]): Promise<Map<string, InfosTitre>> {
  const resultat = new Map<string, InfosTitre>();
  if (liste.length === 0) return resultat;
  const jeton = await jetonApplication();
  if (!jeton.ok) {
    console.warn(`[Spotify] ${jeton.erreur} : recos des visiteurs sans pochette.`);
    return resultat;
  }
  for (const m of liste) {
    try {
      let t: any;
      if (m.spotifyId) t = await appel(jeton.jeton, `/tracks/${m.spotifyId}?market=FR`);
      else {
        const q = encodeURIComponent(`track:${m.titre} artist:${m.artiste}`);
        t = (await appel(jeton.jeton, `/search?type=track&limit=1&market=FR&q=${q}`)).tracks?.items?.[0];
      }
      if (!t) { console.warn(`[Spotify] morceau introuvable : ${m.artiste} — ${m.titre}`); continue; }
      resultat.set(m.cle, {
        titre: t.name,
        artiste: (t.artists ?? []).map((a: any) => a.name).join(', '),
        album: t.album?.name,
        pochette: t.album?.images?.[0]?.url,
        annee: t.album?.release_date ? Number(String(t.album.release_date).slice(0, 4)) : undefined,
        lienSpotify: t.external_urls?.spotify,
      });
    } catch (e) {
      console.warn(`[Spotify] ${m.artiste} — ${m.titre} : ${(e as Error).message}`);
    }
  }
  return resultat;
}
