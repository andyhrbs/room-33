// ==========================================================================
// Garde-fou anti-fuite (remplace la case « Contains secret values » payante).
// Après le build, cherche les clés Spotify dans tous les fichiers publiés.
// Si une clé secrète y apparaît, le build échoue : rien n'est mis en ligne.
// ==========================================================================
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const secrets = ['SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN']
  .map((nom) => [nom, process.env[nom]])
  .filter(([, valeur]) => valeur && valeur.length >= 8);

if (secrets.length === 0) {
  console.log('Garde-fou : aucune clé secrète dans cet environnement, rien à vérifier.');
  process.exit(0);
}

const dossiers = ['dist', '.netlify/functions'];
const fuites = [];
const parcourir = (dossier) => {
  let entrees;
  try { entrees = readdirSync(dossier); } catch { return; }
  for (const nom of entrees) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) { parcourir(chemin); continue; }
    const contenu = readFileSync(chemin).toString('latin1');
    for (const [nomCle, valeur] of secrets) if (contenu.includes(valeur)) fuites.push(`${nomCle} trouvé dans ${chemin}`);
  }
};
dossiers.forEach(parcourir);

if (fuites.length) {
  console.error('⛔ Garde-fou : une clé secrète se retrouve dans les fichiers publiés !');
  fuites.forEach((f) => console.error('   - ' + f));
  console.error('   Build arrêté. Rien n’a été mis en ligne.');
  process.exit(1);
}
console.log(`Garde-fou : ${secrets.length} clé(s) secrète(s) vérifiée(s), aucune fuite.`);
