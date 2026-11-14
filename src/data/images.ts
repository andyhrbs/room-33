// ==========================================================================
// Room 33 — Images du site (photos de la pièce générées dans ChatGPT, agrandies avec Magnific)
// Chaque image existe en 3 largeurs WebP dans public/images/ : <nom>-<largeur>.webp
// (ordi : 1280 · 1920 · 2560 ; vertical mobile : 720 · 1080 · 1440). Le navigateur prend la bonne
// selon la densité de l'écran (image-set) : un téléphone ne télécharge pas l'image géante.
// Pour remplacer une image : regénérer les 3 largeurs avec le même nom (script dans l'historique Git, 14/11).
// ==========================================================================
const url = (nom: string, largeur: number) => `/images/${nom}-${largeur}.webp`;
/** valeur CSS d'un fond : image-set(1x, 2x) */
const set = (nom: string, l1: number, l2: number) => `image-set(url('${url(nom, l1)}') 1x, url('${url(nom, l2)}') 2x)`;

// Adresses simples (préchargement du hero, balises <img>)
export const images: Record<string, string | null> = {
  pieceOrdi: url('piece-ordi', 1920),            // la pièce, 16:9 (hero de l'accueil ordi)
  pieceMobile: url('piece-mobile', 1080),        // la pièce, vraie photo verticale 9:16 (hero de l'accueil mobile)
  pieceEteinteOrdi: url('piece-eteinte-ordi', 1920),     // la pièce éteinte (fond de l'entrée, ordi)
  pieceEteinteMobile: url('piece-eteinte-mobile', 1080), // idem mobile
  andyhPiano: null,     // vraie photo d'Andyh au piano, 4:5 (comptoir)
};

// Fonds CSS (image-set) des photos de la pièce
export const fonds = {
  pieceOrdi: set('piece-ordi', 1920, 2560),
  pieceMobile: set('piece-mobile', 720, 1440),
  pieceEteinteOrdi: set('piece-eteinte-ordi', 1920, 2560),
  pieceEteinteMobile: set('piece-eteinte-mobile', 720, 1440),
};

// Gros plans de la pièce = heroes des pages intérieures (une vraie photo par page, plus de recadrage)
export const grosPlans = {
  top: 'gros-plan-top',                 // le mur de cadres → Le Top de la Room
  platine: 'gros-plan-platine',         // la platine → La platine
  bacs: 'gros-plan-bacs',               // les étagères du buffet → Les bacs
  comptoir: 'gros-plan-comptoir',       // le piano → Le comptoir
  recommander: 'gros-plan-recommander', // la caisse de vinyles → Recommandez-moi un son (pas encore utilisée)
  visiteurs: 'gros-plan-visiteurs',     // le canapé → Le bac des visiteurs
  lives: 'gros-plan-lives',             // la chaîne hi-fi → Les lives
} as const;
export type GrosPlan = keyof typeof grosPlans;
/** fonds d'un gros plan : ordi (1920 / 2560) et mobile (1280 / 1920, l'image est recadrée en hauteur) */
export const fondGrosPlan = (cle: GrosPlan) => ({ ordi: set(grosPlans[cle], 1920, 2560), mobile: set(grosPlans[cle], 1280, 1920) });

// Ancien système (recadrages de la photo de la pièce, repris de Figma) : gardé pour mémoire, plus utilisé
export type Recadrage = [number, number, number, number];
export const recadrages: Record<string, Recadrage> = {};
