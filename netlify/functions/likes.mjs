// « J'aime » des lives (grande vue de la vidéo) : chaque visiteur peut aimer un live, tout le monde voit le total.
// Stockage : Netlify Blobs (petite base clé → valeur incluse dans Netlify, rien à configurer).
// Anti-triche : un j'aime par navigateur. Le navigateur envoie un identifiant au hasard (gardé chez lui) ;
// on n'en garde qu'une empreinte (hachage), jamais l'identifiant lui-même.
//   GET  /api/likes?ids=a,b,c            → { totaux: { a: 3, b: 0, c: 12 }, aimes: [] }   (+ &visiteur=… : lesquels il aime)
//   POST /api/likes { id, visiteur, aime } → { id, total, aime }
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const ID = /^[\w-]{6,20}$/;          // id de vidéo YouTube
const VISITEUR = /^[\w-]{16,64}$/;
const empreinte = (v) => createHash('sha256').update('room33-likes:' + v).digest('hex').slice(0, 24);
const json = (corps, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export default async (req) => {
  const store = getStore({ name: 'likes-lives', consistency: 'strong' });
  const lire = async (id) => (await store.get(id, { type: 'json' })) ?? { visiteurs: [] };

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const ids = (url.searchParams.get('ids') ?? '').split(',').filter((x) => ID.test(x)).slice(0, 50);
    const v = url.searchParams.get('visiteur');
    const h = v && VISITEUR.test(v) ? empreinte(v) : null;
    const totaux = {}; const aimes = [];
    await Promise.all(ids.map(async (id) => { const d = await lire(id); totaux[id] = d.visiteurs.length; if (h && d.visiteurs.includes(h)) aimes.push(id); }));
    return json({ totaux, aimes });
  }

  if (req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ erreur: 'corps invalide' }, 400); }
    const { id, visiteur, aime } = b ?? {};
    if (!ID.test(id ?? '') || !VISITEUR.test(visiteur ?? '') || typeof aime !== 'boolean') return json({ erreur: 'paramètres invalides' }, 400);
    const h = empreinte(visiteur);
    const d = await lire(id);
    const deja = d.visiteurs.includes(h);
    if (aime && !deja) d.visiteurs.push(h);
    if (!aime && deja) d.visiteurs = d.visiteurs.filter((x) => x !== h);
    if (aime !== deja) await store.setJSON(id, d);
    return json({ id, total: d.visiteurs.length, aime });
  }

  return json({ erreur: 'méthode non permise' }, 405);
};

export const config = { path: '/api/likes' };
