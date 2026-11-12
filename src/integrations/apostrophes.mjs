// ==========================================================================
// Room 33 — apostrophe typographique partout : après le build, chaque apostrophe droite (')
// du texte affiché devient l'apostrophe typographique (’) de la police (Gilda Display, Mona Sans).
// En Gilda, la droite fait un petit coin collé à la lettre (« 'Til »). Touche le texte visible et
// les attributs lus (alt, aria-label, title, placeholder), jamais le code (script, style) ni les data-*.
// Le texte ajouté en direct par les scripts (Spotify, lecteur) passe par typo() dans src/scripts/typo.ts.
// ==========================================================================
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APOS = /'|&#39;|&#x27;|&apos;/g;
const LUS = /(\s(?:alt|aria-label|title|placeholder)=")([^"]*)(")/g;

export function typographier(html) {
  // découpe : blocs script/style laissés tels quels, balises (attributs lus seulement), texte
  return html.replace(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]+>)|([^<]+)/g, (m, balise, texte) => {
    if (texte !== undefined) return texte.replace(APOS, '’');
    if (/^<(script|style)/i.test(balise)) return balise;
    return balise.replace(LUS, (_, a, v, b) => a + v.replace(APOS, '’') + b);
  });
}

async function* fichiers(dossier) {
  for (const e of await readdir(dossier, { withFileTypes: true })) {
    const p = join(dossier, e.name);
    if (e.isDirectory()) yield* fichiers(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

export default function apostrophes() {
  return {
    name: 'room33-apostrophes',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let n = 0;
        for await (const f of fichiers(fileURLToPath(dir))) {
          const avant = await readFile(f, 'utf8');
          const apres = typographier(avant);
          if (apres !== avant) { await writeFile(f, apres); n++; }
        }
        logger.info(`apostrophes typographiques : ${n} page(s) retouchée(s)`);
      },
    },
  };
}
