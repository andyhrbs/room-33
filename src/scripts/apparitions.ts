// ==========================================================================
// Room 33 — Apparitions au défilement (charte du mouvement, « socle A »).
// Les blocs de chaque section (titres, textes, cartes, lignes de liste) arrivent en fondu
// + 20 px vers le haut quand ils entrent à l'écran, une seule fois, avec 80 ms d'écart
// entre ceux qui arrivent ensemble (6 au maximum, le reste d'un coup).
// - Ce qui est déjà à l'écran au chargement ne bouge pas (on ne fait jamais attendre).
// - Sans JavaScript : tout reste visible (rien n'est caché d'avance dans le HTML).
// - « Réduire les animations » : simple fondu court (voir global.css).
// Pour exclure un bloc : data-sans-apparition sur lui ou sur un parent.
// Liste à faire arriver d'un bloc (ex. les titres d'un album) : data-apparition-groupe sur la liste ;
// dès qu'une ligne entre à l'écran, toutes les lignes arrivent, en cascade (12 au maximum).
// ==========================================================================
const BLOCS = [
  'article', '.textes', '.pochette', 'h2', 'h3', 'p', 'blockquote', 'figure', 'table', 'form', 'dl',
  '.actions', '[role="list"] > li', 'ul > li', 'ol > li', '.pochette-un', '.poch', 'img', 'iframe', '[data-video]',
].join(',');
const MAX_CASCADE = 6;
const MAX_CASCADE_GROUPE = 12;

let observateur: IntersectionObserver | undefined;

function preparer() {
  observateur?.disconnect();
  const sections = document.querySelectorAll<HTMLElement>('main section');
  const aSurveiller: HTMLElement[] = [];
  for (const section of sections) {
    if (section.closest('[data-sans-apparition]')) continue;
    const choisis: HTMLElement[] = [];
    for (const el of section.querySelectorAll<HTMLElement>(BLOCS)) {
      // on garde le bloc le plus haut : pas d'animation dans une animation
      if (choisis.some((c) => c.contains(el))) continue;
      if (el.closest('[data-sans-apparition], dialog')) continue;
      choisis.push(el);
    }
    const visibleAuChargement = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.height > 0; };
    for (const el of choisis) {
      if (visibleAuChargement(el)) continue; // déjà visible au chargement
      // groupe dont une ligne est déjà à l'écran : tout le groupe reste visible (pas de lignes qui arrivent après coup)
      const g = el.closest<HTMLElement>('[data-apparition-groupe]');
      if (g && [...g.children].some((x) => visibleAuChargement(x as HTMLElement))) continue;
      // dans une rangée qui défile à l'horizontale (bacs de l'accueil, « Les autres bacs », fiche disque),
      // les pochettes montent aussi : on donne à la rangée la place de la montée en bas (padding compensé
      // par une marge négative, la mise en page ne bouge pas), sinon une barre de défilement verticale apparaît
      const parent = el.parentElement;
      if (parent && !parent.dataset.placeMontee && /auto|scroll/.test(getComputedStyle(parent).overflowX)) {
        const cs = getComputedStyle(parent);
        const place = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--distance-apparition')) || 0;
        parent.style.paddingBottom = `${parseFloat(cs.paddingBottom) + place + 8}px`;
        parent.style.marginBottom = `${parseFloat(cs.marginBottom) - place - 8}px`;
        parent.dataset.placeMontee = 'oui'; // « oui » et pas '' : une chaîne vide compte comme « faux » et la place était ajoutée une fois par pochette
      }
      el.dataset.apparition = '';
      aSurveiller.push(el);
    }
  }
  if (!aSurveiller.length) return;
  observateur = new IntersectionObserver((entrees) => {
    // ceux qui entrent ensemble arrivent en cascade, dans l'ordre de la page
    const entres = new Set(entrees.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement));
    // une ligne d'un groupe entre : tout le groupe arrive avec elle (même les lignes encore sous l'écran)
    let groupe = false;
    for (const el of [...entres]) {
      const g = el.closest('[data-apparition-groupe]');
      if (g) { groupe = true; g.querySelectorAll<HTMLElement>('[data-apparition]:not(.apparu)').forEach((x) => entres.add(x)); }
    }
    const visibles = [...entres].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    visibles.forEach((el, i) => {
      el.style.setProperty('--rang', String(Math.min(i, groupe ? MAX_CASCADE_GROUPE : MAX_CASCADE)));
      el.classList.add('apparu');
      observateur!.unobserve(el);
      // une fois arrivé, l'élément redevient normal (ses propres effets de survol reprennent la main)
      el.addEventListener('transitionend', () => { delete el.dataset.apparition; el.classList.remove('apparu'); el.style.removeProperty('--rang'); }, { once: true });
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  aSurveiller.forEach((el) => observateur!.observe(el));
}

// Défilement très rapide (molette, ancre, touche Fin) : les blocs sautés, déjà au-dessus de l'écran,
// s'affichent directement, sans animation, pour ne jamais laisser de trou en remontant.
let enAttente = false;
addEventListener('scroll', () => {
  if (enAttente) return;
  enAttente = true;
  requestAnimationFrame(() => {
    enAttente = false;
    for (const el of document.querySelectorAll<HTMLElement>('[data-apparition]:not(.apparu)')) {
      if (el.getBoundingClientRect().bottom < 0) { observateur?.unobserve(el); delete el.dataset.apparition; }
    }
  });
}, { passive: true });

// Le rideau : le hero (hauteur de l'écran) reste fixe ; il s'assombrit à mesure que la page le recouvre.
function rideau() {
  const hero = document.querySelector<HTMLElement>('.hero-accueil, .hero-page');
  const suite = document.querySelector<HTMLElement>('.rideau');
  if (!hero || !suite) return;
  const r = suite.getBoundingClientRect().top;
  const couvert = Math.min(1, Math.max(0, 1 - r / innerHeight));
  hero.style.setProperty('--couvert', couvert.toFixed(3));
}
let rideauEnAttente = false;
const rideauPlanifie = () => {
  if (rideauEnAttente) return;
  rideauEnAttente = true;
  requestAnimationFrame(() => { rideauEnAttente = false; rideau(); });
};
addEventListener('scroll', rideauPlanifie, { passive: true });
addEventListener('resize', rideauPlanifie);

document.addEventListener('astro:page-load', () => { preparer(); rideau(); });
