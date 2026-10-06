// @ts-check
import { defineConfig } from 'astro/config';

// Pages à plat (contact.html) : Cloudflare Pages les sert sans extension (/contact)
// et redirige de lui-même /contact.html, l'adresse de l'ancien site, vers /contact.
export default defineConfig({
  site: 'https://mcconduite.fr',
  trailingSlash: 'never',
  build: { format: 'file' },
});
