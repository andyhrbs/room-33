// ==========================================================================
// Room 33 — Boutons « ← Retour » : ils ramènent d'où l'on vient (comme le retour du navigateur, au même
// endroit de la page) et disent où ils mènent : « Retour à mon Top », « Retour au bac Soul & R&B »…
// - Une petite pile garde les pages traversées dans le site (sessionStorage, pour l'onglet).
// - Arrivée de l'extérieur (Google, un lien) : pile vide → le retour par défaut de la page
//   (« Retour dans la pièce » vers l'accueil, ou le bac du disque sur une fiche).
// - Éléments concernés : le lien du hero [data-retour-origine] (s'il est un lien) et la pastille [data-retour-flottant] ;
//   le texte se met dans [data-retour-texte].
// - Sur une fiche disque, le retour saute les autres fiches ouvertes à la suite (disque A → disque B)
//   et ramène à la page « mère » : le Top, un bac, l'accueil… (plusieurs pas en arrière d'un coup).
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
  if (chemin === '/bacs') return 'Retour à mes disques';
  if (/^\/bacs\/[^/]+\/disques$/.test(chemin)) return `Retour à tout le bac ${nom}`;
  if (chemin.startsWith('/bacs/')) return `Retour au bac ${nom}`;
  if (chemin === '/top') return 'Retour à mon Top';
  if (chemin === '/platine') return 'Retour à mes écoutes';
  if (chemin === '/lives') return 'Retour aux vidéos';
  if (chemin === '/comptoir') return 'Retour à « Qui je suis »';
  if (chemin === '/visiteurs') return 'Retour à vos sons';
  if (chemin.startsWith('/disques/')) return `Retour à ${nom.split(' — ')[0]}`;
  return `Retour à ${nom}`;
}

// navigation dans le site : on empile la page quittée (en avant), on dépile (en arrière)
document.addEventListener('astro:before-preparation', (e) => {
  const ev = e as Event & { direction?: string; from: URL; to: URL };
  const de = propre(ev.from.pathname), vers = propre(ev.to.pathname);
  if (de === vers) return;
  const pile = lire();
  if (ev.direction === 'back') {
    // retour d'un ou plusieurs pas : on retire tout jusqu'à la page retrouvée (incluse)
    const i = pile.map((p) => propre(p.chemin)).lastIndexOf(vers);
    if (i >= 0) pile.length = i;
  }
  else pile.push({ chemin: de, titre: document.title });
  ecrire(pile);
});

function appliquer() {
  const pile = lire();
  const ici = propre(location.pathname);
  const fiche = (c: string) => propre(c).startsWith('/disques/');
  // sur une fiche : la dernière page qui n'est pas une fiche ; ailleurs : simplement la page d'avant
  let i = pile.length - 1;
  if (fiche(ici)) while (i >= 0 && fiche(pile[i].chemin)) i--;
  const precedente = i >= 0 && propre(pile[i].chemin) !== ici ? pile[i] : null;
  const pas = pile.length - i;
  const liens = [...document.querySelectorAll<HTMLAnchorElement>('a[data-retour-origine], a[data-retour-flottant]')];
  for (const a of liens) {
    if (!a.dataset.defautHref) { a.dataset.defautHref = a.getAttribute('href') ?? '/'; a.dataset.defautTexte = a.querySelector('[data-retour-texte]')?.textContent ?? ''; }
    const href = precedente ? precedente.chemin : a.dataset.defautHref;
    const texte = precedente ? libelle(precedente) : a.dataset.defautTexte!;
    a.setAttribute('href', href);
    a.querySelectorAll('[data-retour-texte]').forEach((t) => (t.textContent = texte));
    if (a.hasAttribute('aria-label')) a.setAttribute('aria-label', texte);
    a.toggleAttribute('data-retour-pile', !!precedente);
    if (precedente) a.dataset.retourPas = String(pas); else delete a.dataset.retourPas;
  }
}
document.addEventListener('astro:page-load', appliquer);

// clic : on revient vraiment en arrière (même endroit de la page, comme le bouton du navigateur)
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[data-retour-pile]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault(); e.stopPropagation(); // avant la navigation fluide (sinon elle ouvrirait la page comme une nouvelle)
  history.go(-(Number(a.dataset.retourPas) || 1));
}, true);
