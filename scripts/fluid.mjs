// Calcule les tailles fluides (mobile 375px → ordi 1440px) à partir des valeurs Figma
const sizes = { geant:[62,164], hero:[44,152], display:[44,76], h1:[36,60], h2:[30,48], h3:[24,32], 'corps-l':[18,20], corps:[16,16], petit:[13,14], legende:[12,13], lettrine:[62,106], marque:[94,323], logo:[22,26] };
const r = n => +n.toFixed(4);
for (const [k,[min,max]] of Object.entries(sizes)) {
  if (min===max) { console.log(`  --taille-${k}: ${r(min/16)}rem;`); continue; }
  const slope = (max-min)/(1440-375); const b = min - slope*375;
  console.log(`  --taille-${k}: clamp(${r(min/16)}rem, ${r(b/16)}rem + ${r(slope*100)}vw, ${r(max/16)}rem);`);
}
