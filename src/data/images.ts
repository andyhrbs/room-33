// ==========================================================================
// Room 33 — Images du site
// Déposez les fichiers dans public/images/ puis indiquez leur chemin ici.
// Tant qu'une image vaut null, le site affiche un fond provisoire.
// ==========================================================================
export const images: Record<string, string | null> = {
  pieceOrdi: '/images/piece-ordi.jpg', // photo de la pièce, 16:9 (hero accueil ordi + gros plans recadrés des autres pages)
  pieceEteinteOrdi: null, // photo de la pièce éteinte (fond de l'entrée « Allumez la lampe », ordi) ; en attendant : la pièce, assombrie
  pieceMobile: null,    // photo de la pièce, vraie photo verticale 9:16 (hero accueil mobile)
  pianoGrosPlan: null,  // gros plan du piano (hero du comptoir)
  andyhPiano: null,     // vraie photo d'Andyh au piano, 4:5 (comptoir)
};

// Gros plans des pages intérieures = recadrages de la photo de la pièce (repris de Figma).
// [largeur, hauteur, gauche, haut] de la zone visible, en fraction de l'image (imageTransform « Crop » de Figma).
export type Recadrage = [number, number, number, number];
export const recadrages: Record<string, Recadrage> = {
  bac: [0.5, 0.5, 0.25, 0.25],        // les étagères du buffet
  platine: [0.36, 0.36, 0.30, 0.30],  // la platine
  top: [0.5, 0.5, 0.25, 0.03],        // le mur de cadres
  visiteurs: [0.6, 0.6, 0.20, 0.30],  // le canapé
  comptoir: [0.42, 0.62, 0.56, 0.30], // le piano
  lives: [0.4, 0.425, 0.48, 0.27],    // la chaîne hi-fi
};
