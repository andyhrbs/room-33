// ==========================================================================
// Room 33 — Boutons « ← Retour » : ils ramènent d'où l'on vient (comme le retour du navigateur, au même
// endroit de la page) et disent où ils mènent : « Retour au Top », « Retour au bac Soul & R&B »…
// - Une petite pile garde les pages traversées dans le site (sessionStorage, pour l'onglet).
// - Arrivée de l'extérieur (Google, un lien) : pile vide → le retour par défaut de la page
//   (« Retour dans la pièce » vers l'accueil, ou le bac du disque sur une fiche).
// - Éléments concernés : le lien du hero [data-retour-origine] (s'il est un lien) et la pastille [data-retour-flottant] ;
//   le texte se met dans [data-retour-texte].
// ==========================================================================
type Etape = { chemin: string; titre: string };
const CLE = 'room33-pile';
const lire = (): Etape[] => { try { return JSON.parse(sessionStorage.getItem(CLE) ?? '[]'); } catch { return []; } };
const ecrire = (p: Etape[]) => { try { sessionStorage.setItem(CLE, JSON.stringify(p.slice(-30))); } catch { /* stockage indisponible */ } };
const propre = (c: string) => c.replace(/\.html$/, '').replace(/\/$/, '') || '/';

// libellé du retour selon la page d'où l'on vient
function libelle({ chemin, titre }: Etape) {
  const nom = titre.split(' · ')[0];
  if (chemin === '/') return 'Retour dans la pièce';
  if (chemin === '/bacs') return 'Retour aux bacs';
  if (chemin.startsWith('/bacs/')) return `Retour au bac ${nom}`;
  if (chemin === '/top') return 'Retour au Top';
  if (chemin === '/platine') return 'Retour à la platine';
  if (chemin === '/lives') return 'Retour aux lives';
  if (chemin === '/comptoir') return 'Retour au comptoir';
  if (chemin === '/visiteurs') return 'Retour au bac des visiteurs';
  if (chemin.startsWith('/disques/')) return `Retour à ${nom.split(' — ')[0]}`;
  return `Retour à ${nom}`;
}

// navigation dans le site : on empile la page quittée (en avant), on dépile (en arrière)
document.addEventListener('astro:before-preparation', (e) => {
  const ev = e as Event & { direction?: string; from: URL; to: URL };
  const de = propre(ev.from.pathname), vers = propre(ev.to.pathname);
  if (de === vers) return;
  const pile = lire();
  if (ev.direction === 'back') { if (pile.length && propre(pile[pile.length - 1].chemin) === vers) pile.pop(); }
  else pile.push({ chemin: de, titre: document.title });
  ecrire(pile);
});

function appliquer() {
  const pile = lire();
  const ici = propre(location.pathname);
  const precedente = pile.length && propre(pile[pile.length - 1].chemin) !== ici ? pile[pile.length - 1] : null;
  const liens = [...document.querySelectorAll<HTMLAnchorElement>('a[data-retour-origine], a[data-retour-flottant]')];
  for (const a of liens) {
    if (!a.dataset.defautHref) { a.dataset.defautHref = a.getAttribute('href') ?? '/'; a.dataset.defautTexte = a.querySelector('[data-retour-texte]')?.textContent ?? ''; }
    const href = precedente ? precedente.chemin : a.dataset.defautHref;
    const texte = precedente ? libelle(precedente) : a.dataset.defautTexte!;
    a.setAttribute('href', href);
    a.querySelectorAll('[data-retour-texte]').forEach((t) => (t.textContent = texte));
    if (a.hasAttribute('aria-label')) a.setAttribute('aria-label', texte);
    a.toggleAttribute('data-retour-pile', !!precedente);
  }
}
document.addEventListener('astro:page-load', appliquer);

// clic : on revient vraiment en arrière (même endroit de la page, comme le bouton du navigateur)
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[data-retour-pile]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault(); e.stopPropagation(); // avant la navigation fluide (sinon elle ouvrirait la page comme une nouvelle)
  history.back();
}, true);
