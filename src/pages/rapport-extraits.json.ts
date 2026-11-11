// Rapport du build : pour chaque disque, les titres sans extrait Deezer (rien n'y renvoie, sert aux vérifications).
import { disques } from '../data/disques';
import { rapportExtraits } from '../lib/catalogue';

export function GET() {
  const total = rapportExtraits.reduce((n, r) => n + r.pistes, 0);
  const manquants = rapportExtraits.reduce((n, r) => n + r.sansExtrait.length, 0);
  return new Response(JSON.stringify({ genereLe: new Date().toISOString(), disques: disques.length, disquesVerifies: rapportExtraits.length, titres: total, sansExtrait: manquants, detail: rapportExtraits.filter((r) => r.sansExtrait.length) }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
