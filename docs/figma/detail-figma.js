// Room 33 — « maj figma » : détail des blocs modifiés, à coller dans use_figma après avoir remplacé IDS.
// Lecture seule. Pour chaque nœud : chemin › type › taille › fond › contour › rayon › auto-layout (gap/padding) › texte, taille, style › composant.
const IDS = ['15:74']; // ← ids des blocs signalés par diff.mjs
const M = (v) => (typeof v === 'symbol' ? 'mix' : typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const noms = new Map();
const nomVar = async (id) => { if (!noms.has(id)) { const v = await figma.variables.getVariableByIdAsync(id); noms.set(id, v?.name || id); } return noms.get(id); };
const hex = (c) => [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
const peintures = async (arr) => { if (!Array.isArray(arr)) return 'mix'; const o = []; for (const p of arr) { if (p.visible === false) continue; o.push(p.type === 'SOLID' ? (p.boundVariables?.color ? await nomVar(p.boundVariables.color.id) : '#' + hex(p.color) + (p.opacity < 1 ? '@' + M(p.opacity) : '')) : p.type.slice(0, 4)); } return o.join('+'); };
const ligne = async (n, chemin) => {
  const r = [chemin, n.type.slice(0, 4), Math.round(n.width) + '×' + Math.round(n.height)];
  if (n.visible === false) r.push('MASQUÉ');
  if (n.opacity < 1) r.push('opacité ' + M(n.opacity));
  if ('fills' in n) { const f = await peintures(n.fills); if (f) r.push('fond ' + f); }
  if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length) r.push('contour ' + (await peintures(n.strokes)) + ' ' + M(n.strokeWeight));
  if ('cornerRadius' in n && n.cornerRadius) r.push('rayon ' + M(n.cornerRadius));
  if ('effects' in n && n.effects?.length) r.push('effets ' + n.effects.filter((e) => e.visible !== false).map((e) => e.type + (e.radius ? ' ' + e.radius : '')).join(','));
  if (n.layoutMode && n.layoutMode !== 'NONE') r.push((n.layoutMode === 'VERTICAL' ? 'col' : 'ligne') + ' gap ' + M(n.itemSpacing) + ' pad ' + [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map(M).join('/') + ' align ' + n.primaryAxisAlignItems + '/' + n.counterAxisAlignItems);
  if (n.type === 'TEXT') { r.push('« ' + n.characters.replace(/\n/g, '⏎') + ' »', 'taille ' + M(n.fontSize)); if (typeof n.textStyleId === 'string' && n.textStyleId) { const st = await figma.getStyleByIdAsync(n.textStyleId); if (st) r.push('style ' + st.name); } }
  if (n.type === 'INSTANCE') { const m = await n.getMainComponentAsync(); r.push('composant ' + (m?.parent?.type === 'COMPONENT_SET' ? m.parent.name + ' / ' + m.name : m?.name)); }
  return r.join(' · ');
};
const out = [];
for (const id of IDS) {
  const racine = await figma.getNodeByIdAsync(id);
  if (!racine) { out.push(id + ' : introuvable (supprimé ?)'); continue; }
  let p = racine; while (p.parent && p.parent.type !== 'PAGE') p = p.parent;
  if (p.parent) await figma.setCurrentPageAsync(p.parent);
  const tour = async (n, chemin) => { out.push(await ligne(n, chemin)); if ('children' in n && n.type !== 'INSTANCE') for (const c of n.children) await tour(c, chemin + ' › ' + c.name.slice(0, 40)); };
  await tour(racine, (racine.parent?.name ? racine.parent.name + ' › ' : '') + racine.name);
}
return out.join('\n');
