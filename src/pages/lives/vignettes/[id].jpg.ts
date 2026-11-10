// Vignettes des vidéos, récupérées sur YouTube AU BUILD et servies par Room 33 :
// le visiteur ne contacte pas YouTube tant qu'il ne lance pas une vidéo (vie privée).
import type { APIRoute, GetStaticPaths } from 'astro';
import { lives } from '../../../data/lives';

export const getStaticPaths: GetStaticPaths = () => lives.map((l) => ({ params: { id: l.youtube } }));

export const GET: APIRoute = async ({ params }) => {
  for (const taille of ['maxresdefault', 'sddefault', 'hqdefault']) {
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${params.id}/${taille}.jpg`, { signal: AbortSignal.timeout(8000) });
      if (r.ok && Number(r.headers.get('content-length') ?? 2000) > 1500) return new Response(await r.arrayBuffer(), { headers: { 'Content-Type': 'image/jpeg' } });
    } catch { /* on essaie la taille suivante */ }
  }
  // pas de vignette (ex. build sans réseau) : image transparente 1×1
  return new Response(Uint8Array.from(atob('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='), (c) => c.charCodeAt(0)), { headers: { 'Content-Type': 'image/jpeg' } });
};
