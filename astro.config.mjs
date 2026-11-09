// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://room33.netlify.app', // à remplacer par le vrai domaine au sprint 7
  trailingSlash: 'never',
  build: { format: 'file' },
});
