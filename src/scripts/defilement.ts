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
    // laisser le navigateur faire dans les fenêtres par-dessus la page, et pendant l'écran d'entrée
    prevent: (el: HTMLElement) =>
      Boolean(el.closest?.('dialog, [data-lenis-prevent], [data-entree]')) ||
      document.documentElement.classList.contains('entree-active'),
  });
  (window as unknown as { room33Lenis?: Lenis }).room33Lenis = lenis; // accès à Lenis pour les autres scripts
  // Changement de page (ClientRouter) : Lenis s'arrête pendant l'échange, puis repart de la position que la navigation
  // vient de fixer (haut de page, ou position retrouvée au retour en arrière). Avant, il se recalait trop tôt (sur 0)
  // et effaçait la position retrouvée au retour.
  document.addEventListener('astro:before-swap', () => lenis.stop());
  const recaler = () => { lenis.resize(); lenis.scrollTo(window.scrollY, { immediate: true, force: true }); if (!document.querySelector('dialog[open]')) lenis.start(); };
  document.addEventListener('astro:page-load', () => requestAnimationFrame(recaler));
  // Fenêtre modale ouverte (tiroir, menu mobile) : la page derrière ne bouge plus
  new MutationObserver(() => {
    if (document.querySelector('dialog[open]')) lenis.stop(); else lenis.start();
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
}
