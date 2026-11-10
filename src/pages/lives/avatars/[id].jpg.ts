// Photo de la chaîne YouTube de chaque live, récupérée AU BUILD et servie par Room 33 :
// le visiteur ne contacte pas YouTube tant qu'il ne lance pas une vidéo (vie privée).
// Pas de photo trouvée : image transparente, la lettrine R reste visible dessous.
import type { APIRoute, GetStaticPaths } from 'astro';
import { lives } from '../../../data/lives';
import { infosVideo } from '../../../lib/youtube';

export const getStaticPaths: GetStaticPaths = () => lives.map((l) => ({ params: { id: l.youtube } }));

const transparent = () => new Response(Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0)), { headers: { 'Content-Type': 'image/gif' } });

export const GET: APIRoute = async ({ params }) => {
  const { avatar } = await infosVideo(params.id!);
  if (!avatar) return transparent();
  try {
    const r = await fetch(avatar, { signal: AbortSignal.timeout(8000) });
    if (r.ok) return new Response(await r.arrayBuffer(), { headers: { 'Content-Type': r.headers.get('content-type') ?? 'image/jpeg' } });
  } catch { /* on garde la lettrine */ }
  return transparent();
};
