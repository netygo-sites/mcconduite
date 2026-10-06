# Site MC Conduite — notes de livraison

Site vitrine personnalisé à partir du template **AutoGuru**, pour l'auto-moto-école **MC Conduite** (Échirolles).

## Technique (depuis octobre 2026)
Site **Astro** statique, hébergé sur **Cloudflare Pages** (projet `mcconduite`, build `npm run build`, sortie `dist/`).
Auparavant : pages HTML écrites à la main, hébergées sur Vercel (historique git conservé).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère les CSS puis le site dans dist/
```

| Dossier | Contenu |
|---|---|
| `src/pages/` | Une page par fichier (`contact.astro` → `/contact`) : titre, description et données structurées en tête, contenu dessous |
| `src/layouts/Base.astro` | `<head>` commun (SEO, polices, styles), préchargeur, scripts |
| `src/components/` | En-tête (bandeau, menu) et pied de page, communs à toutes les pages |
| `src/styles/custom.css` | **Source des styles** (avec Bootstrap, slicknav et Font Awesome à côté) |
| `scripts/build-css.mjs` | Purge et fusionne les styles → `public/css/site.css` + styles de la partie haute intégrés aux pages. Lancé tout seul par `dev` et `build` : ne jamais modifier les fichiers générés |
| `public/` | Images, scripts (`js/function.js` = script du site), polices, documents du label, `robots.txt`, `sitemap.xml`, `llms.txt` |
| `functions/videos/` | Sert la vidéo du héros par morceaux (Safari l'exige, Pages ne le fait pas seul) |

**Adresses** : les pages n'ont plus d'extension (`/contact`). Cloudflare Pages redirige de lui-même les anciennes adresses en `.html`.
En ajoutant une page : l'ajouter aussi dans `public/sitemap.xml` et, si utile, `public/llms.txt`.

## Pages (21)
- Accueil, Permis B, Permis Moto, Tarifs, Label qualité, Contact (formulaire de pré-inscription + carte)
- 11 fiches formation : code de la route, boîte manuelle, boîte automatique, conduite accompagnée, conduite supervisée, post-permis, code moto, permis AM, A1, A2, A L5e
- Mentions légales, politique de confidentialité, règlement intérieur, page 404

## Identité visuelle
- Couleurs définies dans `src/styles/custom.css` (bloc « MC CONDUITE - Personnalisations marque » en fin de fichier) :
  - Noir `#1A1A1A` + dégradé or/orange `#F5A623 → #E8830C`
- Logo : `images/mc/logo-mc-conduite-white.png` (header/footer, fond sombre) et `logo-mc-conduite.png` (fond clair)
- Photos clientes optimisées dans `images/mc/`

## ⚠️ Éléments à compléter (placeholders repérables `⚠️ À compléter` dans le code)
1. **Photos** : staff, véhicules (voitures + motos), piste moto — à fournir par Amira.
2. **Réseaux sociaux** : liens Facebook / Instagram / TikTok (footer, `href="#"`).
3. **Email pro** : actuellement `mcconduiteechirolles@gmail.com` — remplacer par l'adresse `@mcconduite.fr` si créée.
4. **Tarifs** : « sur demande » partout (décision validée). Ajouter une grille si souhaité.
5. **Permis moto** : programmes/durées/tarifs détaillés (AM, A1, A2, A L5e) à confirmer ; équipement et horaires de piste à préciser.
6. **Hébergeur** (mentions légales) : raison sociale + adresse Netygo à compléter.
7. **Durée de conservation des données** (politique de confidentialité) à valider.
8. **Bannière cookies** : à mettre en place selon les outils de suivi retenus.
9. **Avis clients** : aucun avis fictif n'a été ajouté. Un bloc « Avis Google » pourra être intégré une fois les avis disponibles.
10. **Règlement intérieur** : version synthétisée en ligne ; possibilité d'ajouter le PDF officiel en téléchargement.

## Formulaire de pré-inscription
Envoyé au **service de formulaires NETYGO** (`netygo-forms`, entrée `mc-conduite`) : aucun code serveur dans le site.
Adresse d'envoi et clé publique Turnstile dans `src/data/site.ts`, envoi dans `public/js/function.js` (champ piège, horodatage, vérification anti-robot invisible). Destinataires, accusé de réception et libellés du mail se règlent dans le service, pas ici.

## Données société (vérifiées dans le doc client)
- Adresse : 26 avenue du 8 mai 1945, 38130 Échirolles · Tél : 04 38 21 48 02
- SIRET 99 365 935 00017 · APE 85.53Z · Agrément E2603800020 · Directrice de publication : Sabrina Boulahdjar
- Piste moto : parking Alpexpo, 2 avenue d'Innsbruck, 38100 Grenoble

## SEO
- `title` + `meta description` personnalisés par page · H1 localisés (Échirolles/Grenoble) · données structurées `DrivingSchool` (schema.org) sur l'accueil.

_Site réalisé par Netygo._
