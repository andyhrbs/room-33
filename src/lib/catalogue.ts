// ==========================================================================
// Room 33 — Infos des disques depuis Spotify, récupérées AU BUILD.
// Pochette, année, label, lien et pistes sont écrits dans les pages HTML :
// les visiteurs ne parlent jamais à Spotify, et les clés restent sur Netlify.
// Sans clés (ou si Spotify ne répond pas), le site garde les motifs de démo.
// ==========================================================================
import { jetonApplication } from './spotify';

export interface Piste { numero: number; titre: string; duree: string }
export interface InfosSpotify { spotifyId: string; pochette?: string; annee?: number; label?: string; lienSpotify?: string; lienArtiste?: string; pistes: Piste[] }

const API = 'https://api.spotify.com/v1';
const duree = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}`;

async function appel(jeton: string, chemin: string) {
  const rep = await fetch(API + chemin, { headers: { Authorization: `Bearer ${jeton}` }, signal: AbortSignal.timeout(10000) });
  if (!rep.ok) throw new Error(`Spotify ${rep.status} sur ${chemin.split('?')[0]}`);
  return rep.json();
}

// Retrouve l'identifiant Spotify d'un album à partir de son titre et de son artiste
async function chercherAlbum(jeton: string, titre: string, artiste: string): Promise<string | undefined> {
  const q = encodeURIComponent(`album:${titre} artist:${artiste}`);
  const r = await appel(jeton, `/search?type=album&limit=5&market=FR&q=${q}`);
  const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const items: any[] = r.albums?.items ?? [];
  const exact = items.find((a) => normal(a.name).startsWith(normal(titre)) && a.artists.some((x: any) => normal(x.name) === normal(artiste)));
  return (exact ?? items.find((a) => a.artists.some((x: any) => normal(x.name) === normal(artiste))))?.id;
}

export async function infosAlbums(liste: { cle: string; titre: string; artiste: string; spotifyId?: string }[]): Promise<Map<string, InfosSpotify>> {
  const resultat = new Map<string, InfosSpotify>();
  const jeton = await jetonApplication();
  if (!jeton.ok) {
    console.warn(`[Spotify] ${jeton.erreur} : pochettes de démo conservées.`);
    return resultat;
  }
  for (const d of liste) {
    try {
      const id = d.spotifyId ?? (await chercherAlbum(jeton.jeton, d.titre, d.artiste));
      if (!id) { console.warn(`[Spotify] album introuvable : ${d.artiste} — ${d.titre}`); continue; }
      const a = await appel(jeton.jeton, `/albums/${id}?market=FR`);
      resultat.set(d.cle, {
        spotifyId: id,
        pochette: a.images?.[0]?.url,
        annee: a.release_date ? Number(String(a.release_date).slice(0, 4)) : undefined,
        label: a.label || undefined,
        lienSpotify: a.external_urls?.spotify,
        lienArtiste: a.artists?.[0]?.external_urls?.spotify,
        pistes: (a.tracks?.items ?? []).map((p: any) => ({ numero: p.track_number, titre: p.name, duree: duree(p.duration_ms) })),
      });
    } catch (e) {
      console.warn(`[Spotify] ${d.artiste} — ${d.titre} : ${(e as Error).message}`);
    }
  }
  console.log(`[Spotify] ${resultat.size}/${liste.length} disques complétés depuis Spotify.`);
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
