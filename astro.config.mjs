// @ts-check
import { defineConfig } from 'astro/config';
import apostrophes from './src/integrations/apostrophes.mjs';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://room-33.netlify.app', // à remplacer par le vrai domaine au sprint 7
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [apostrophes()], // apostrophes typographiques ’ dans tout le texte affiché
});
