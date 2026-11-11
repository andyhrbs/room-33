// Room 33 — « maj figma » : empreintes du fichier Figma (rug9BnVFR2UBMfGUQH8kug), à coller tel quel dans use_figma.
// Lecture seule. Renvoie une ligne « id empreinte » par élément suivi :
//   - chaque bloc de 1er niveau de chaque écran (page « 🖥 UI — Écrans ») + le cadre de l'écran lui-même (suffixe :cadre)
//   - chaque composant / groupe de 2e niveau du « 🧩 Kit UI » (boutons, cartes, nav…)
//   - chaque variable (valeur résolue) et chaque style de texte
// Comparer à docs/figma/empreintes.txt avec `node docs/figma/diff.mjs` : une empreinte différente = bloc modifié dans Figma,
// une ligne en plus = ajouté, en moins = supprimé. Puis lire le détail des blocs modifiés avec detail-figma.js.
const M = (v) => (typeof v === 'symbol' ? 'mix' : typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const h = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
const noms = new Map();
const nomVar = async (id) => { if (!noms.has(id)) { const v = await figma.variables.getVariableByIdAsync(id); noms.set(id, v?.name || id); } return noms.get(id); };
const hex = (c) => [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
const peintures = async (arr) => {
  if (!Array.isArray(arr)) return 'mix';
  const o = [];
  for (const p of arr) {
    if (p.visible === false) continue;
    if (p.type === 'SOLID') o.push(p.boundVariables?.color ? await nomVar(p.boundVariables.color.id) : '#' + hex(p.color) + '@' + M(p.opacity ?? 1));
    else if (p.type === 'IMAGE') o.push('img:' + p.imageHash + ':' + p.scaleMode);
    else o.push(p.type + JSON.stringify((p.gradientStops || []).map((s) => hex(s.color) + M(s.color.a) + '/' + M(s.position))));
  }
  return o.join('+');
};
const sig = async (n) => {
  const r = [n.name, n.type, M(n.x), M(n.y), M(n.width), M(n.height), n.visible, M(n.opacity), M(n.rotation || 0)];
  if ('fills' in n) r.push(await peintures(n.fills));
  if ('strokes' in n) r.push(await peintures(n.strokes), M(n.strokeWeight));
  if ('cornerRadius' in n) r.push(M(n.cornerRadius));
  if ('effects' in n && n.effects?.length) r.push(JSON.stringify(n.effects.map((e) => [e.type, e.radius, e.offset, e.spread, e.color && hex(e.color), e.visible])));
  if (n.layoutMode) r.push(n.layoutMode, M(n.itemSpacing), M(n.paddingTop), M(n.paddingRight), M(n.paddingBottom), M(n.paddingLeft), n.primaryAxisAlignItems, n.counterAxisAlignItems, n.layoutSizingHorizontal, n.layoutSizingVertical, n.layoutWrap);
  if (n.type === 'TEXT') r.push(n.characters, M(n.fontSize), JSON.stringify(n.fontName === figma.mixed ? 'mix' : n.fontName), JSON.stringify(n.lineHeight === figma.mixed ? 'mix' : n.lineHeight), JSON.stringify(n.letterSpacing === figma.mixed ? 'mix' : n.letterSpacing), n.textAlignHorizontal, n.textCase === figma.mixed ? 'mix' : n.textCase, n.textDecoration === figma.mixed ? 'mix' : n.textDecoration);
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); r.push(m?.id, JSON.stringify(n.componentProperties)); }
  return r.join('§');
};
const empreinte = async (node) => { const parts = []; const tour = async (n) => { parts.push(await sig(n)); if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children) await tour(c); }; await tour(node); return h(parts.join('¶')); };
const lignes = [];
// Écrans : 1 empreinte par bloc de 1er niveau
let page = figma.root.children.find((p) => p.id === '1:4');
await figma.setCurrentPageAsync(page);
for (const e of page.children.flatMap((c) => (c.type === 'SECTION' ? c.children : [c]))) {
  if (e.type === 'FRAME' && e.children?.length) { lignes.push(e.id + ':cadre ' + h(await sig(e))); for (const b of e.children) lignes.push(b.id + ' ' + (await empreinte(b))); }
  else lignes.push(e.id + ' ' + (await empreinte(e)));
}
// Kit UI : 1 empreinte par élément de 2e niveau (composants, jeux de variantes)
page = figma.root.children.find((p) => p.id === '1:3');
await figma.setCurrentPageAsync(page);
for (const g of page.children) {
  if ('children' in g && g.type !== 'INSTANCE' && g.type !== 'COMPONENT' && g.type !== 'COMPONENT_SET') for (const c of g.children) lignes.push(c.id + ' ' + (await empreinte(c)));
  else lignes.push(g.id + ' ' + (await empreinte(g)));
}
// Variables et styles de texte
for (const col of await figma.variables.getLocalVariableCollectionsAsync())
  for (const id of col.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); lignes.push('var:' + v.name.replace(/\s/g, '_') + ' ' + h(JSON.stringify(v.valuesByMode))); }
for (const s of await figma.getLocalTextStylesAsync()) lignes.push('style:' + s.name.replace(/\s/g, '_') + ' ' + h(JSON.stringify([s.fontName, s.fontSize, s.lineHeight, s.letterSpacing, s.textCase])));
return lignes.join('\n');
