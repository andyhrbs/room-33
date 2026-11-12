// ==========================================================================
// Room 33 — Hero aimanté : quand la section suivante recouvre au moins les 3/4 du hero
// (en descendant) et que le défilement s'arrête, la page s'emboîte : la section recouvre tout le hero.
// Ordi et mobile. Rien avec « réduire les animations », ni sur la page d'un bac sur ordi
// (sa première section a déjà son propre aimant, voir PageBac.astro).
// ==========================================================================
const COUVERT_MIN = 0.75;
type LenisMini = { scrollTo: (y: number, o: object) => void };

let dernierY = window.scrollY, versLeBas = false, minuteur = 0, anim = false, doigt = false;

const actif = () =>
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !document.querySelector('dialog[open]') &&
  !document.documentElement.classList.contains('entree-active') &&
  !(matchMedia('(min-width: 64rem)').matches && document.querySelector('[data-ecran-bac]'));

function verifier() {
  if (anim || doigt || !versLeBas || !actif()) return;
  const hero = document.querySelector<HTMLElement>('.hero-accueil, .hero-page');
  const rideau = document.querySelector<HTMLElement>('.rideau');
  if (!hero || !rideau) return;
  const h = hero.offsetHeight;
  const haut = rideau.getBoundingClientRect().top; // h = rien recouvert, 0 = tout recouvert
  const couvert = 1 - haut / h;
  if (couvert < COUVERT_MIN || haut <= 2) return;
  const cible = window.scrollY + haut;
  anim = true;
  const l = (window as unknown as { room33Lenis?: LenisMini }).room33Lenis;
  if (l) l.scrollTo(cible, { duration: 0.6, easing: (t: number) => 1 - Math.pow(1 - t, 3), lock: true, force: true, onComplete: () => { anim = false; } });
  else { window.scrollTo({ top: cible, behavior: 'smooth' }); setTimeout(() => (anim = false), 600); }
}

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (Math.abs(y - dernierY) > 1) versLeBas = y > dernierY;
  dernierY = y;
  clearTimeout(minuteur);
  minuteur = window.setTimeout(verifier, 140); // le défilement (et son inertie) vient de s'arrêter
}, { passive: true });
// au doigt : on attend que le doigt se lève (puis que l'inertie s'arrête) avant d'emboîter
window.addEventListener('touchstart', () => { doigt = true; }, { passive: true });
window.addEventListener('touchend', () => { doigt = false; clearTimeout(minuteur); minuteur = window.setTimeout(verifier, 160); }, { passive: true });
