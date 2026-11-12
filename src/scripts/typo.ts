// Apostrophe droite (') → typographique (’) pour le texte ajouté en direct (Spotify, lecteur, lives).
// Même règle que src/integrations/apostrophes.mjs pour le texte écrit au build.
export const typo = (s = '') => s.replace(/'/g, '’');
