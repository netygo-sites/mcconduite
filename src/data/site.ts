// Réglages partagés par les pages.

/**
 * Formulaire de pré-inscription : envoyé au service de formulaires NETYGO (netygo-forms),
 * jamais de route /api dans le site. sitekey : clé publique du widget Cloudflare Turnstile
 * du site (la clé secrète reste dans le service).
 */
export const formulaire = {
  endpoint: 'https://netygo-forms.netygo.workers.dev/v1/mcconduite-fr',
  sitekey: '0x4AAAAAAE_PqEa_tOy_PoOU',
};
