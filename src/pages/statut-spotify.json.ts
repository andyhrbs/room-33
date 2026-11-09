// Petit voyant de contrôle, fabriqué au build : dit seulement si les clés
// existent et si Spotify les accepte. Ne contient jamais les clés elles-mêmes.
import type { APIRoute } from 'astro';
import { clesPresentes, jetonApplication } from '../lib/spotify';

export const GET: APIRoute = async () => {
  const cles = clesPresentes();
  const jeton = await jetonApplication();
  const statut = {
    variables: cles,
    spotify: jeton.ok ? 'clés acceptées' : jeton.erreur,
    verifieLe: new Date().toISOString(),
  };
  return new Response(JSON.stringify(statut, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
