// Room 33 — compare deux scans Figma (lignes « id empreinte »).
// Usage : node docs/figma/diff.mjs docs/figma/empreintes.txt nouveau-scan.txt
// Affiche les blocs modifiés, ajoutés et supprimés. Après avoir appliqué les changements : remplacer empreintes.txt par le nouveau scan.
import { readFileSync } from 'node:fs';
const lire = (f) => new Map(readFileSync(f, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.trim().split(/\s+/)));
const [ancien, nouveau] = [lire(process.argv[2]), lire(process.argv[3])];
const modifies = [], ajoutes = [], supprimes = [];
for (const [id, e] of nouveau) { if (!ancien.has(id)) ajoutes.push(id); else if (ancien.get(id) !== e) modifies.push(id); }
for (const id of ancien.keys()) if (!nouveau.has(id)) supprimes.push(id);
console.log(`Modifiés (${modifies.length}) : ${modifies.join(' ') || '—'}`);
console.log(`Ajoutés (${ajoutes.length}) : ${ajoutes.join(' ') || '—'}`);
console.log(`Supprimés (${supprimes.length}) : ${supprimes.join(' ') || '—'}`);
