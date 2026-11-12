// ==========================================================================
// Room 33 — Hero aimanté (même principe que la section d'un bac, voir PageBac.astro).
// Le hero et la page qui glisse par-dessus (le rideau) se comportent comme deux « écrans » :
// - depuis le hero, le moindre défilement vers le bas emboîte directement la section suivante en haut de l'écran ;
// - depuis le haut de la section, défiler vers le haut ramène directement au hero ;
// - pendant le glissement, les crans de molette sont absorbés (pas d'à-coups).
// Molette (ordi) : interceptée via Lenis (room33GardeHero, voir defilement.ts).
// Doigt (mobile) : décidé au lever du doigt, d'après le sens du geste.
// Clavier / barre de défilement : filet de sécurité quand le défilement s'arrête entre les deux.
// Page d'un bac sur ordi : la cible est la section du bac sous la nav ; au-delà, son propre aimant prend le relais.
// Rien avec « réduire les animations ».
// ==========================================================================
type LenisMini = { scrollTo: (y: number, o: object) => void };
const DUREE = 1.3; // s : glissement très doux
// démarrage et arrivée en douceur (accélère puis ralentit), pour un mouvement plus naturel
const courbe = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let anim = false, dernierY = window.scrollY, sens = 0, minuteur = 0, debutDoigt = 0, yDoigt = 0;

const actif = () =>
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !document.querySelector('dialog[open]') &&
  !document.documentElement.classList.contains('entree-active');

// position (en px de défilement) où la section recouvre tout le hero ; null s'il n'y a pas de hero
function bas(): number | null {
  const hero = document.querySelector<HTMLElement>('.hero-accueil, .hero-page');
  const rideau = document.querySelector<HTMLElement>('.rideau');
  if (!hero || !rideau) return null;
  // page d'un bac sur ordi : on s'emboîte sur la section du bac, sous la nav (là où son propre aimant la tient)
  const bac = matchMedia('(min-width: 64rem)').matches ? document.querySelector<HTMLElement>('[data-ecran-bac]') : null;
  if (bac) return Math.round(window.scrollY + bac.getBoundingClientRect().top - 72);
  return Math.round(window.scrollY + rideau.getBoundingClientRect().top);
}

function glisser(cible: number) {
  anim = true;
  const fin = () => { anim = false; dernierY = window.scrollY; };
  const l = (window as unknown as { room33Lenis?: LenisMini }).room33Lenis;
  if (l) l.scrollTo(cible, { duration: DUREE, easing: courbe, lock: true, force: true, onComplete: fin });
  else { window.scrollTo({ top: cible, behavior: 'smooth' }); setTimeout(fin, DUREE * 1000); }
}

// sens > 0 : vers le bas. Renvoie true si l'aimant a pris la main.
function decider(direction: number): boolean {
  if (!actif()) return false;
  const b = bas(); if (b === null) return false;
  const y = window.scrollY;
  if (direction > 0 && y < b - 2) { glisser(b); return true; }       // du hero vers la section
  if (direction < 0 && y > 2 && y <= b + 2) { glisser(0); return true; } // du haut de la section vers le hero
  return false;
}

// Molette (appelé par Lenis avant chaque mouvement) : false = Lenis ne bouge pas
(window as unknown as { room33GardeHero?: (d: { deltaY: number; event: Event }) => boolean }).room33GardeHero = ({ deltaY, event }) => {
  if (event.type !== 'wheel' || !actif() || bas() === null) return true;
  if (anim) { event.preventDefault(); return false; }
  if (Math.abs(deltaY) < 2) return true;
  if (decider(Math.sign(deltaY))) { event.preventDefault(); return false; }
  return true;
};

// Doigt : on note le départ, on décide au lever selon le sens du geste
addEventListener('touchstart', (e) => { debutDoigt = e.touches[0]?.clientY ?? 0; yDoigt = window.scrollY; }, { passive: true });
addEventListener('touchend', (e) => {
  if (anim) return;
  const dy = debutDoigt - (e.changedTouches[0]?.clientY ?? debutDoigt); // > 0 : le doigt monte = la page descend
  const b = bas(); if (b === null || Math.abs(dy) < 12) return;
  if (yDoigt < b - 2 || window.scrollY < b - 2) decider(Math.sign(dy));
}, { passive: true });

// Filet de sécurité (clavier, barre de défilement) : arrêt entre le hero et la section → on finit le mouvement
addEventListener('scroll', () => {
  const y = window.scrollY;
  if (Math.abs(y - dernierY) > 1) sens = Math.sign(y - dernierY);
  dernierY = y;
  if (anim) return;
  clearTimeout(minuteur);
  minuteur = window.setTimeout(() => {
    const b = bas(); if (anim || b === null || !actif()) return;
    const y2 = window.scrollY;
    if (y2 > 2 && y2 < b - 2) decider(sens || 1);
  }, 180);
}, { passive: true });
