// ==========================================================================
// Room 33 — Lecteur d'extraits (un seul son à la fois, jamais d'autoplay).
// - Tout bouton [data-ecouter] lance l'extrait de 30 s (Deezer, via /api/extrait)
//   du morceau décrit par son conteneur [data-ecoute] (data-titre, data-artiste, data-type).
// - La mini-platine (en bas) persiste d'une page à l'autre grâce au ClientRouter :
//   ce script tourne une seule fois et le son continue pendant la navigation.
// - « Ouvrir l'app » : liens via /api/liens ; le visiteur choisit l'app à chaque fois
//   (pas de mémorisation : un mauvais clic ne l'enferme pas dans une app).
// ==========================================================================

type Morceau = { titre: string; artiste: string; type: 'titre' | 'album' };
type Etat = '' | 'chargement' | 'lecture' | 'pause' | 'erreur';

const audio = new Audio();
audio.preload = 'none';

let courant: (Morceau & { cle: string }) | null = null;
// File d'écoute : la liste d'où vient l'extrait lancé (ex. le top de la platine), pour précédent / suivant
let file: Morceau[] = [];
let pochetteCourante = '';
let position = -1;
let etat: Etat = '';
let demande = 0;

const cle = (m: Morceau) => `${m.type}|${m.titre}|${m.artiste}`.toLowerCase();
const lireMorceau = (el: Element | null): Morceau | null => {
  const c = el?.closest<HTMLElement>('[data-ecoute]');
  if (!c?.dataset.titre || !c.dataset.artiste) return null;
  return { titre: c.dataset.titre, artiste: c.dataset.artiste, type: c.dataset.type === 'album' ? 'album' : 'titre' };
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- Affichage ----------
function afficher() {
  // tous les conteneurs d'écoute de la page
  document.querySelectorAll<HTMLElement>('[data-ecoute]').forEach((c) => {
    const m = lireMorceau(c);
    const actif = !!(m && courant && cle(m) === courant.cle);
    const e = actif ? etat : '';
    if (e) c.dataset.etat = e; else delete c.dataset.etat;
    c.querySelectorAll<HTMLButtonElement>('[data-ecouter]').forEach((b) => {
      if (b.closest('[data-ecoute]') !== c) return;
      b.setAttribute('aria-pressed', String(e === 'lecture'));
      if (m) b.setAttribute('aria-label', e === 'lecture' ? `Mettre en pause l’extrait de ${m.titre}, ${m.artiste}` : `Écouter un extrait de ${m.titre}, ${m.artiste}`);
    });
    const statut = c.querySelector<HTMLElement>('[data-statut]');
    if (statut) { if (e === 'erreur' || e === 'chargement') statut.textContent = e === 'erreur' ? 'Extrait indisponible' : 'Chargement…'; else statut.innerHTML = '30 s<span class="seulement-ordi"> · aperçu Deezer</span>'; } // mobile : « 30 s » (Figma)
  });
  // mini-platine
  const mini = document.querySelector<HTMLElement>('[data-mini-platine]');
  if (mini && courant) {
    mini.hidden = false;
    mini.dataset.etat = etat;
    mini.querySelector('[data-titre]')!.textContent = courant.titre;
    mini.querySelector('[data-artiste]')!.textContent = courant.artiste;
    mini.querySelector('[data-mini-statut]')!.textContent = etat === 'erreur' ? 'Extrait indisponible' : 'Extrait';
    mini.querySelector('[data-lecture-pause]')!.setAttribute('aria-label', etat === 'lecture' ? 'Mettre en pause' : 'Reprendre l’extrait');
    const prec = mini.querySelector<HTMLButtonElement>('[data-precedent]'), suiv = mini.querySelector<HTMLButtonElement>('[data-suivant]');
    if (prec) prec.disabled = !courant; // toujours actif : revient au début, puis au morceau d'avant
    if (suiv) suiv.disabled = position < 0 || position >= file.length - 1;
    // lecteur plein écran (mobile)
    const plein = mini.querySelector<HTMLElement>('[data-lecteur-plein]');
    if (plein) {
      plein.querySelector('[data-plein-titre]')!.textContent = courant.titre;
      plein.querySelector('[data-plein-artiste]')!.textContent = courant.artiste;
      plein.querySelector('[data-plein-statut]')!.textContent = etat === 'erreur' ? 'Extrait indisponible' : etat === 'chargement' ? 'Chargement…' : 'Extrait · 30 s';
      plein.querySelector('[data-plein-lecture]')!.setAttribute('aria-label', etat === 'lecture' ? 'Mettre en pause' : 'Reprendre l’extrait');
      plein.querySelector<HTMLButtonElement>('[data-plein-precedent]')!.disabled = !courant;
      plein.querySelector<HTMLButtonElement>('[data-plein-suivant]')!.disabled = position < 0 || position >= file.length - 1;
      const img = plein.querySelector<HTMLImageElement>('[data-plein-pochette]')!;
      if (pochetteCourante) { if (img.src !== pochetteCourante) img.src = pochetteCourante; img.hidden = false; } else img.hidden = true;
    }
    document.body.classList.add('avec-lecteur');
  }
}

function progression() {
  const mini = document.querySelector<HTMLElement>('[data-mini-platine]');
  if (!mini) return;
  const total = audio.duration || 30;
  const pct = Math.min(100, (audio.currentTime / total) * 100);
  const courant = mini.querySelector('[data-temps-courant]'), fin = mini.querySelector('[data-temps-total]');
  if (courant) courant.textContent = mmss(audio.currentTime);
  if (fin) fin.textContent = mmss(total);
  const barre = mini.querySelector<HTMLElement>('[data-progression]')!;
  barre.setAttribute('aria-valuenow', String(Math.round(pct)));
  (barre.firstElementChild as HTMLElement).style.width = `${pct}%`;
  const plein = mini.querySelector<HTMLElement>('[data-lecteur-plein]');
  if (plein) {
    plein.querySelector<HTMLElement>('[data-plein-progression]')!.style.width = `${pct}%`;
    plein.querySelector('[data-plein-courant]')!.textContent = mmss(audio.currentTime);
    plein.querySelector('[data-plein-total]')!.textContent = mmss(total);
  }
}

function annoncer(texte: string) {
  const a = document.querySelector('[data-annonce]');
  if (a) a.textContent = texte;
}

// ---------- File d'écoute ----------
// La liste qui contient le morceau cliqué (ol, ul… avec au moins 2 extraits), sinon tous les extraits de la page.
function construireFile(depuis: Element) {
  const conteneur = depuis.closest<HTMLElement>('[data-ecoute]');
  let liste: Element | null = conteneur?.parentElement ?? null;
  while (liste && liste !== document.body && liste.querySelectorAll('[data-ecoute]').length < 2) liste = liste.parentElement;
  const elements = [...(liste && liste !== document.body ? liste : document).querySelectorAll('[data-ecoute]')];
  const vus = new Set<string>();
  file = elements.map((e) => lireMorceau(e)).filter((m): m is Morceau => !!m && !vus.has(cle(m)) && !!vus.add(cle(m)));
  const m = lireMorceau(depuis);
  position = m ? file.findIndex((x) => cle(x) === cle(m)) : -1;
}
function sauter(sens: 1 | -1) {
  if (sens === -1 && audio.currentTime > 3) { audio.currentTime = 0; afficher(); return; } // comme Spotify : d'abord le début du morceau
  const i = position + sens;
  if (i < 0 || i >= file.length) return;
  position = i;
  basculer(file[i]);
}

// ---------- Lecture ----------
async function basculer(m: Morceau) {
  const k = cle(m);
  if (courant?.cle === k && etat !== 'erreur' && etat !== 'chargement') {
    if (audio.paused) await jouer(); else audio.pause();
    return;
  }
  const n = ++demande;
  audio.pause();
  courant = { ...m, cle: k };
  etat = 'chargement';
  afficher();
  try {
    const rep = await fetch(`/api/extrait?${new URLSearchParams({ titre: m.titre, artiste: m.artiste, type: m.type })}`);
    const d = await rep.json();
    if (n !== demande) return; // un autre extrait a été demandé entre-temps
    if (!rep.ok || !d.extrait) throw new Error();
    // pochette Deezer sur le petit vinyle de la mini-platine
    const vinyle = document.querySelector<HTMLElement>('[data-mini-platine] .vinyle');
    if (vinyle) vinyle.style.backgroundImage = d.pochette ? `url("${d.pochette}")` : '';
    // grande pochette du lecteur plein écran (Deezer la donne aussi en grand : cover_xl)
    pochetteCourante = (d.pochetteGrande || d.pochette || '') as string;
    audio.src = d.extrait;
    await jouer();
    annoncer(`Lecture de l’extrait : ${m.titre}, ${m.artiste}`);
  } catch {
    if (n !== demande) return;
    etat = 'erreur';
    afficher();
    annoncer(`Extrait indisponible pour ${m.titre}`);
  }
}

async function jouer() {
  try { await audio.play(); } catch { etat = 'pause'; afficher(); }
}

audio.addEventListener('play', () => { etat = 'lecture'; afficher(); });
audio.addEventListener('pause', () => { if (etat === 'lecture') { etat = 'pause'; afficher(); } });
audio.addEventListener('ended', () => {
  // extrait fini : le suivant de la liste démarre, sinon on s'arrête au début
  if (position >= 0 && position < file.length - 1) { sauter(1); return; }
  etat = 'pause'; audio.currentTime = 0; afficher(); progression();
});
audio.addEventListener('timeupdate', progression);
audio.addEventListener('error', () => { if (courant && audio.src) { etat = 'erreur'; afficher(); } });

// ---------- Ouvrir l'app ----------
const cacheLiens = new Map<string, Promise<Record<string, string> | null>>();
function liens(m: Morceau) {
  const k = cle(m);
  if (!cacheLiens.has(k)) {
    cacheLiens.set(k, fetch(`/api/liens?${new URLSearchParams({ titre: m.titre, artiste: m.artiste, type: m.type })}`)
      .then((r) => (r.ok ? r.json() : null)).then((d) => d?.liens ?? null).catch(() => null));
  }
  return cacheLiens.get(k)!;
}

let morceauChoix: Morceau | null = null;
async function choisirApp(m: Morceau) {
  const dialogue = document.querySelector<HTMLDialogElement>('[data-choix-app]');
  if (!dialogue) return;
  morceauChoix = m;
  dialogue.querySelector('[data-choix-morceau]')!.textContent = `${m.titre} — ${m.artiste}`;
  const boutons = dialogue.querySelectorAll<HTMLButtonElement>('[data-app]');
  boutons.forEach((b) => (b.disabled = true));
  dialogue.classList.remove('ferme');
  dialogue.showModal();
  dialogue.focus({ preventScroll: true }); // pas de contour sur la croix à l'ouverture au doigt
  const l = await liens(m);
  if (morceauChoix !== m) return;
  boutons.forEach((b) => (b.disabled = !l?.[b.dataset.app!]));
  if (!l) dialogue.querySelector('[data-choix-morceau]')!.textContent = 'Liens indisponibles pour le moment.';
}

// ---------- Clics (délégués : marchent sur toutes les pages, même après navigation) ----------
document.addEventListener('click', async (e) => {
  const cible = e.target as Element;
  const ecouter = cible.closest('[data-ecouter]');
  if (ecouter) { e.preventDefault(); const m = lireMorceau(ecouter); if (m) { construireFile(ecouter); basculer(m); } return; }
  if (cible.closest('[data-ouvrir-plein]')) { const d = document.querySelector<HTMLDialogElement>('[data-lecteur-plein]'); if (d && !d.open) { afficher(); progression(); d.showModal(); d.focus({ preventScroll: true }); } return; } // focus sur le lecteur, pas sur la croix (sinon contour au toucher)
  if (cible.closest('[data-fermer-plein]')) { fermerPlein(); return; }
  if (cible.closest('[data-precedent]')) { sauter(-1); return; }
  if (cible.closest('[data-suivant]')) { sauter(1); return; }

  if (cible.closest('[data-lecture-pause]')) { if (!courant) return; if (etat === 'erreur') basculer({ ...courant }); else if (audio.paused) jouer(); else audio.pause(); return; }

  const app = cible.closest('[data-ouvrir-app]');
  if (app) { e.preventDefault(); const m = app.closest('[data-mini-platine]') ? courant : lireMorceau(app); if (m) choisirApp(m); return; }

  const choix = cible.closest<HTMLButtonElement>('[data-app]');
  if (choix && morceauChoix && !choix.disabled) {
    const l = await liens(morceauChoix);
    const url = l?.[choix.dataset.app!];
    if (url) window.open(url, '_blank', 'noopener');
    fermerChoix();
    return;
  }
  if (cible.closest('[data-fermer-choix]')) fermerChoix();
});

// Fenêtre « Écouter en entier sur… » : se referme en douceur (croix, fond, Échap, choix d'une app)
function fermerChoix() {
  const d = document.querySelector<HTMLDialogElement>('[data-choix-app]');
  if (!d?.open || d.classList.contains('ferme')) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { d.close(); return; }
  d.classList.add('ferme');
  const fin = (e?: AnimationEvent) => { if (e && e.target !== d) return; d.removeEventListener('animationend', fin); d.classList.remove('ferme'); d.close(); };
  d.addEventListener('animationend', fin);
  setTimeout(() => { if (d.classList.contains('ferme')) fin(); }, 400);
}
document.addEventListener('cancel', (e) => { if ((e.target as Element).matches?.('[data-choix-app]')) { e.preventDefault(); fermerChoix(); } }, true);

// Lecteur plein écran : se referme en glissant vers le bas
function fermerPlein() {
  const d = document.querySelector<HTMLDialogElement>('[data-lecteur-plein]');
  if (!d?.open) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { d.close(); return; }
  d.classList.add('ferme');
  d.addEventListener('animationend', () => { d.classList.remove('ferme'); d.close(); }, { once: true });
}
document.addEventListener('cancel', (e) => { if ((e.target as Element).matches?.('[data-lecteur-plein]')) { e.preventDefault(); fermerPlein(); } }, true);

// Glisser le lecteur plein écran vers le bas avec le doigt pour le fermer (comme une story ou Shazam).
// Il suit le doigt ; lâché après un quart d'écran ou d'un geste rapide, il se ferme ; sinon il remonte.
{
  let d: HTMLDialogElement | null = null;
  let id = -1, y0 = 0, dy = 0, yAvant = 0, tAvant = 0, vitesse = 0;
  let appuye = false, glisse = false, ignorerClic = false;
  const SEUIL = 8; // px avant de considérer que c'est un glissé (et pas un simple appui sur un bouton)

  const finir = (el: HTMLDialogElement, fermer: boolean) => {
    const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nettoyer = () => { el.style.transition = ''; el.style.transform = ''; el.classList.remove('glisse'); if (fermer) el.close(); };
    if (calme) { nettoyer(); return; }
    el.style.transition = fermer ? 'transform 0.28s var(--courbe-sortie)' : 'transform 0.45s var(--courbe-douce)';
    el.style.transform = fermer ? 'translateY(100%)' : 'translateY(0)';
    let fait = false;
    const une = () => { if (!fait) { fait = true; nettoyer(); } };
    el.addEventListener('transitionend', une, { once: true });
    setTimeout(une, 600); // filet de sécurité si transitionend ne vient pas
  };

  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element).closest?.<HTMLDialogElement>('[data-lecteur-plein]');
    if (!el?.open || (e.pointerType === 'mouse' && e.button !== 0)) return;
    d = el; id = e.pointerId; y0 = yAvant = e.clientY; tAvant = e.timeStamp; dy = 0; vitesse = 0; appuye = true; glisse = false;
  });
  document.addEventListener('pointermove', (e) => {
    if (!appuye || e.pointerId !== id || !d) return;
    dy = Math.max(0, e.clientY - y0);
    const dt = e.timeStamp - tAvant;
    if (dt > 0) { vitesse = (e.clientY - yAvant) / dt; yAvant = e.clientY; tAvant = e.timeStamp; }
    if (!glisse && dy > SEUIL) { glisse = true; d.classList.add('glisse'); d.style.transition = 'none'; }
    if (glisse) d.style.transform = `translateY(${dy}px)`;
  });
  const relacher = (e: PointerEvent) => {
    if (!appuye || e.pointerId !== id || !d) return;
    appuye = false;
    if (!glisse) return;
    ignorerClic = true; setTimeout(() => (ignorerClic = false), 80); // le doigt levé sur un bouton ne doit pas le déclencher
    const fermer = e.type !== 'pointercancel' && (dy > innerHeight * 0.25 || (vitesse > 0.5 && dy > 40));
    finir(d, fermer);
  };
  document.addEventListener('pointerup', relacher);
  document.addEventListener('pointercancel', relacher);
  document.addEventListener('click', (e) => { if (ignorerClic) { e.preventDefault(); e.stopPropagation(); } }, true);
}

// Clic sur le fond de la fenêtre = fermer
document.addEventListener('click', (e) => {
  const d = e.target as HTMLElement;
  if (d instanceof HTMLDialogElement && d.matches('[data-choix-app]')) fermerChoix();
});

// Après chaque navigation : remettre les bons états sur la nouvelle page
document.addEventListener('astro:page-load', afficher);
document.addEventListener('room33:ecoutes', afficher); // listes remplies en direct (page Platine)
document.addEventListener('room33:video', () => { if (!audio.paused) audio.pause(); }); // une vidéo démarre : on coupe l'extrait
