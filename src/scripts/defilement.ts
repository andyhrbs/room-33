// ==========================================================================
// Room 33 — Défilement lissé à la molette (Lenis), comme sur les sites Framer.
// Chaque cran de molette glisse puis ralentit doucement au lieu de s'arrêter net.
// - Seulement la molette : pavé tactile et téléphone gardent leur inertie naturelle (syncTouch: false).
// - Le vrai défilement du navigateur est conservé : clavier, ancres, rideau, apparitions marchent pareil.
// - Rien dans le tiroir, les menus et l'écran d'entrée (data-lenis-prevent, dialog).
// - « Réduire les animations » : défilement normal du navigateur.
// ==========================================================================
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const lenis = new Lenis({
    lerp: 0.085,          // doux : ~1 s pour se poser (plus petit = plus lent)
    wheelMultiplier: 1,   // même distance par cran qu'avant
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
    autoRaf: true,
    // garde des sections aimantées (page d'un bac) : peut absorber un coup de molette
    virtualScroll: (d) => { const g = (window as unknown as { room33Garde?: (x: typeof d) => boolean }).room33Garde; return g ? g(d) : true; },
    // laisser le navigateur faire dans les fenêtres par-dessus la page, et pendant l'écran d'entrée
    prevent: (el: HTMLElement) =>
      Boolean(el.closest?.('dialog, [data-lenis-prevent], [data-entree]')) ||
      document.documentElement.classList.contains('entree-active'),
  });
  (window as unknown as { room33Lenis?: Lenis }).room33Lenis = lenis; // utilisé par les sections aimantées (page d'un bac)
  // Changement de page (ClientRouter) : Lenis repart de la position que le navigateur vient de fixer
  document.addEventListener('astro:after-swap', () => { lenis.scrollTo(window.scrollY, { immediate: true, force: true }); lenis.resize(); });
  // Fenêtre modale ouverte (tiroir, menu mobile) : la page derrière ne bouge plus
  new MutationObserver(() => {
    if (document.querySelector('dialog[open]')) lenis.stop(); else lenis.start();
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
}
