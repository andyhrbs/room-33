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
    if (statut) statut.textContent = e === 'erreur' ? 'Extrait indisponible' : e === 'chargement' ? 'Chargement…' : '30 s · aperçu Deezer';
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
    document.body.classList.add('avec-lecteur');
  }
}

function progression() {
  const mini = document.querySelector<HTMLElement>('[data-mini-platine]');
  if (!mini) return;
  const total = audio.duration || 30;
  const pct = Math.min(100, (audio.currentTime / total) * 100);
  mini.querySelector('[data-temps]')!.textContent = `${mmss(audio.currentTime)} / ${mmss(total)}`;
  const barre = mini.querySelector<HTMLElement>('[data-progression]')!;
  barre.setAttribute('aria-valuenow', String(Math.round(pct)));
  (barre.firstElementChild as HTMLElement).style.width = `${pct}%`;
}

function annoncer(texte: string) {
  const a = document.querySelector('[data-annonce]');
  if (a) a.textContent = texte;
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
audio.addEventListener('ended', () => { etat = 'pause'; audio.currentTime = 0; afficher(); progression(); });
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
  dialogue.showModal();
  const l = await liens(m);
  if (morceauChoix !== m) return;
  boutons.forEach((b) => (b.disabled = !l?.[b.dataset.app!]));
  if (!l) dialogue.querySelector('[data-choix-morceau]')!.textContent = 'Liens indisponibles pour le moment.';
}

// ---------- Clics (délégués : marchent sur toutes les pages, même après navigation) ----------
document.addEventListener('click', async (e) => {
  const cible = e.target as Element;
  const ecouter = cible.closest('[data-ecouter]');
  if (ecouter) { e.preventDefault(); const m = lireMorceau(ecouter); if (m) basculer(m); return; }

  if (cible.closest('[data-lecture-pause]')) { if (!courant) return; if (etat === 'erreur') basculer({ ...courant }); else if (audio.paused) jouer(); else audio.pause(); return; }

  const app = cible.closest('[data-ouvrir-app]');
  if (app) { e.preventDefault(); const m = app.closest('[data-mini-platine]') ? courant : lireMorceau(app); if (m) choisirApp(m); return; }

  const choix = cible.closest<HTMLButtonElement>('[data-app]');
  if (choix && morceauChoix && !choix.disabled) {
    const l = await liens(morceauChoix);
    const url = l?.[choix.dataset.app!];
    if (url) window.open(url, '_blank', 'noopener');
    document.querySelector<HTMLDialogElement>('[data-choix-app]')?.close();
    return;
  }
  if (cible.closest('[data-fermer-choix]')) document.querySelector<HTMLDialogElement>('[data-choix-app]')?.close();
});

// Clic sur le fond de la fenêtre = fermer
document.addEventListener('click', (e) => {
  const d = e.target as HTMLElement;
  if (d instanceof HTMLDialogElement && d.matches('[data-choix-app]')) d.close();
});

// Après chaque navigation : remettre les bons états sur la nouvelle page
document.addEventListener('astro:page-load', afficher);
document.addEventListener('room33:ecoutes', afficher); // listes remplies en direct (page Platine)
document.addEventListener('room33:video', () => { if (!audio.paused) audio.pause(); }); // une vidéo démarre : on coupe l'extrait
