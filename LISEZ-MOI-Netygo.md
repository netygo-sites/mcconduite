# Site MC Conduite — notes de livraison

Site vitrine personnalisé à partir du template **AutoGuru**, pour l'auto-moto-école **MC Conduite** (Échirolles).

## Pages livrées (9)
- `index.html` — Accueil
- `permis-b.html` — Permis B (code, manuelle, automatique, AAC, supervisée, post-permis)
- `permis-moto.html` — Permis Moto (code moto, AM, A1, A2, A L5e) + bloc piste Alpexpo
- `label-qualite.html` — Label qualité
- `contact.html` — Contact + formulaire de pré-inscription + carte
- `mentions-legales.html`, `politique-confidentialite.html`, `reglement-interieur.html` — pages légales (liens en footer)
- `404.html` — page d'erreur

## Identité visuelle
- Couleurs définies dans `css/custom.css` (bloc « MC CONDUITE - Personnalisations marque » en fin de fichier) :
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
- `contact.html` : le formulaire a `action="#"`. Le branchement de l'envoi (PHP `form-process.php` du template, ou solution Netygo) reste à connecter sur le serveur de production. La validation côté client (champs requis + RGPD) est active.

## Données société (vérifiées dans le doc client)
- Adresse : 26 avenue du 8 mai 1945, 38130 Échirolles · Tél : 04 38 21 48 02
- SIRET 99 365 935 00017 · APE 85.53Z · Agrément E2603800020 · Directrice de publication : Sabrina Boulahdjar
- Piste moto : parking Alpexpo, 2 avenue d'Innsbruck, 38100 Grenoble

## SEO
- `title` + `meta description` personnalisés par page · H1 localisés (Échirolles/Grenoble) · données structurées `DrivingSchool` (schema.org) sur l'accueil.

_Site réalisé par Netygo._
