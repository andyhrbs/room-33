// ==========================================================================
// Room 33 — Lecteur d'extraits (un seul son à la fois, jamais d'autoplay).
// - Tout bouton [data-ecouter] lance l'extrait de 30 s (Deezer, via /api/extrait)
//   du morceau décrit par son conteneur [data-ecoute] (data-titre, data-artiste, data-type).
// - La mini-platine (en bas) persiste d'une page à l'autre grâce au ClientRouter :
//   ce script tourne une seule fois et le son continue pendant la navigation.
// - « Ouvrir l'app » : liens via /api/liens ; le visiteur choisit l'app à chaque fois
//   (pas de mémorisation : un mauvais clic ne l'enferme pas dans une app).
// ==========================================================================

// deezer / isrc : identifiants exacts du morceau (trouvés au build, ou donnés par Spotify) → l'extrait ne dépend pas d'une recherche par nom
type Morceau = { titre: string; artiste: string; type: 'titre' | 'album' | 'artiste'; liens?: Record<string, string>; upc?: string; deezer?: string; isrc?: string };
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
  let liensConnus: Record<string, string> | undefined;
  try { liensConnus = c.dataset.liens ? JSON.parse(c.dataset.liens) : undefined; } catch { liensConnus = undefined; }
  return { titre: c.dataset.titre, artiste: c.dataset.artiste, type: c.dataset.type === 'album' ? 'album' : 'titre', liens: liensConnus, upc: c.dataset.upc || undefined, deezer: c.dataset.deezer || undefined, isrc: c.dataset.isrc || undefined };
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
    const q = new URLSearchParams({ titre: m.titre, artiste: m.artiste, type: m.type });
    if (m.deezer) q.set('deezer', m.deezer);
    if (m.isrc) q.set('isrc', m.isrc);
    if (m.upc) q.set('upc', m.upc);
    const rep = await fetch(`/api/extrait?${q}`);
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
    const connus = m.liens ?? {};
    const youtube = `https://music.youtube.com/search?q=${encodeURIComponent(`${m.titre} ${m.artiste}`)}`;
    // liens déjà résolus au build (albums) : rien à demander
    if (connus.spotify && connus.apple && connus.deezer) cacheLiens.set(k, Promise.resolve({ youtube, ...connus }));
    else {
      const q = new URLSearchParams({ titre: m.titre, artiste: m.artiste, type: m.type });
      if (m.upc) q.set('upc', m.upc);
      if (connus.spotify) q.set('spotify', connus.spotify);
      cacheLiens.set(k, fetch(`/api/liens?${q}`)
        .then((r) => (r.ok ? r.json() : null)).then((d) => ({ youtube, ...(d?.liens ?? {}), ...connus }))
        .catch(() => (Object.keys(connus).length ? { youtube, ...connus } : null)));
    }
  }
  return cacheLiens.get(k)!;
}

let morceauChoix: Morceau | null = null;
async function choisirApp(m: Morceau) {
  const dialogue = document.querySelector<HTMLDialogElement>('[data-choix-app]');
  if (!dialogue) return;
  morceauChoix = m;
  // « Sa discographie » : la fenêtre propose la page de l'artiste sur chaque app
  dialogue.querySelector('#titre-choix-app')!.textContent = m.type === 'artiste' ? 'Sa discographie sur…' : 'Écouter en entier sur…';
  dialogue.querySelector('[data-choix-morceau]')!.textContent = m.type === 'artiste' ? m.artiste : `${m.titre} — ${m.artiste}`;
  const boutons = dialogue.querySelectorAll<HTMLButtonElement>('[data-app]');
  boutons.forEach((b) => (b.disabled = true));
  dialogue.setAttribute('aria-busy', 'true'); // pendant la recherche des liens : boutons inactifs mais pas assombris
  dialogue.classList.remove('ferme');
  dialogue.showModal();
  dialogue.focus({ preventScroll: true }); // pas de contour sur la croix à l'ouverture au doigt
  const l = await liens(m);
  if (morceauChoix !== m) return;
  dialogue.removeAttribute('aria-busy');
  boutons.forEach((b) => (b.disabled = !l?.[b.dataset.app!]));
  if (!l) dialogue.querySelector('[data-choix-morceau]')!.textContent = 'Liens indisponibles pour le moment.';
}

// Liens demandés dès que le visiteur s'approche de « Ouvrir l'app » (survol, focus, doigt posé) : la fenêtre s'ouvre déjà prête
const prechauffer = (e: Event) => {
  const el = (e.target as Element)?.closest?.('[data-ouvrir-app]');
  if (!el || el.closest('[data-mini-platine]')) { if (el && courant) liens(courant); return; }
  const m = lireMorceau(el); if (m) liens(m);
};
['pointerover', 'focusin', 'touchstart'].forEach((t) => document.addEventListener(t, prechauffer, { passive: true }));

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

  const discographie = cible.closest<HTMLElement>('[data-ouvrir-artiste]');
  if (discographie?.dataset.artiste) { e.preventDefault(); choisirApp({ titre: discographie.dataset.artiste, artiste: discographie.dataset.artiste, type: 'artiste' }); return; }

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

// Glisser le lecteur plein écran vers le bas avec le doigt pour le fermer (comme une feuille iOS, Shazam ou Apple Music).
// Pendant le geste : il suit le doigt en rétrécissant un peu, ses coins s'arrondissent (on sent qu'on le « décolle »),
// vers le haut il résiste (effet élastique). Au lâcher : il part avec l'élan du doigt et ralentit (fermeture),
// ou revient en douceur, sans rebond (charte « feutré »).
{
  let d: HTMLDialogElement | null = null;
  let id = -1, y0 = 0, dy = 0;
  let points: { y: number; t: number }[] = [];
  let appuye = false, glisse = false, ignorerClic = false;
  const SEUIL = 8; // px avant de considérer que c'est un glissé (et pas un simple appui sur un bouton)

  // position → apparence : de 0 (en place) à 1 (une hauteur d'écran plus bas)
  const poser = (el: HTMLDialogElement, y: number) => {
    const p = Math.min(1, Math.max(0, y / innerHeight));
    const echelle = 1 - Math.min(p, 0.5) * 0.12;          // jusqu'à 94 % à mi-écran
    const rayon = Math.min(28, Math.max(0, y) * 0.35);     // coins arrondis dès les premiers pixels
    el.style.transform = `translateY(${y}px) scale(${echelle})`;
    el.style.borderRadius = `${rayon}px`;
  };
  // vitesse moyenne des 80 dernières ms (plus fiable que le dernier mouvement seul), en px/ms
  const vitesse = () => {
    const fin = points[points.length - 1], debut = points.find((q) => fin.t - q.t <= 80) ?? points[0];
    return fin && debut && fin.t > debut.t ? (fin.y - debut.y) / (fin.t - debut.t) : 0;
  };

  const finir = (el: HTMLDialogElement, fermer: boolean, v: number) => {
    const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nettoyer = () => { el.style.transition = ''; el.style.transform = ''; el.style.borderRadius = ''; el.classList.remove('glisse'); if (fermer) el.close(); };
    if (calme) { nettoyer(); return; }
    let duree: number, courbe: string;
    if (fermer) {
      // on garde l'élan : plus le geste est rapide, plus la fin est courte ; la courbe démarre à la vitesse du doigt
      const reste = innerHeight - dy;
      duree = Math.round(Math.min(380, Math.max(200, reste / Math.max(v, 1.4))));
      courbe = 'cubic-bezier(0.25, 0.8, 0.3, 1)';
    } else {
      duree = 520; courbe = 'cubic-bezier(0.16, 1, 0.3, 1)'; // retour long et doux
    }
    el.style.transition = `transform ${duree}ms ${courbe}, border-radius ${duree}ms ${courbe}`;
    if (fermer) { el.style.transform = `translateY(${innerHeight}px) scale(0.92)`; el.style.borderRadius = '28px'; }
    else { el.style.transform = 'translateY(0) scale(1)'; el.style.borderRadius = '0px'; }
    let fait = false;
    const une = () => { if (!fait) { fait = true; nettoyer(); } };
    el.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') une(); });
    setTimeout(une, duree + 150); // filet de sécurité si transitionend ne vient pas
  };

  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element).closest?.<HTMLDialogElement>('[data-lecteur-plein]');
    if (!el?.open || (e.pointerType === 'mouse' && e.button !== 0)) return;
    d = el; id = e.pointerId; y0 = e.clientY; dy = 0; points = [{ y: e.clientY, t: e.timeStamp }]; appuye = true; glisse = false;
  });
  document.addEventListener('pointermove', (e) => {
    if (!appuye || e.pointerId !== id || !d) return;
    const brut = e.clientY - y0;
    points.push({ y: e.clientY, t: e.timeStamp }); if (points.length > 12) points.shift();
    if (!glisse && brut > SEUIL) { glisse = true; d.classList.add('glisse'); d.style.transition = 'none'; d.style.transformOrigin = '50% 0'; }
    if (!glisse) return;
    // vers le bas : suit le doigt ; vers le haut : résiste (élastique, 24 px au plus)
    dy = brut >= 0 ? brut : -Math.min(24, Math.sqrt(-brut) * 3);
    poser(d, dy);
  });
  const relacher = (e: PointerEvent) => {
    if (!appuye || e.pointerId !== id || !d) return;
    appuye = false;
    if (!glisse) return;
    ignorerClic = true; setTimeout(() => (ignorerClic = false), 80); // le doigt levé sur un bouton ne doit pas le déclencher
    const v = vitesse();
    const fermer = e.type !== 'pointercancel' && (dy > innerHeight * 0.25 || (v > 0.5 && dy > 40));
    finir(d, fermer, v);
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
