/*
 * Génère css/site.css — la SEULE feuille de styles chargée par les pages.
 *
 * ⚠️  IMPORTANT : ne jamais modifier css/site.css à la main.
 *     Les modifications de style se font dans css/custom.css, puis on relance :
 *
 *         node build-css.js
 *
 *     Pourquoi : les 4 feuilles étaient chargées séparément et bloquaient
 *     l'affichage pendant ~2 200 ms sur 4G (4 allers-retours réseau).
 *     Fusionnées, il n'y a plus qu'une seule requête.
 */
const fs = require('fs');
const path = require('path');

// Ordre de cascade — NE PAS MODIFIER (reproduit l'ordre historique du <head>)
//
// bootstrap.purged.css = bootstrap.min.css débarrassé des règles inutilisées
// (227 Ko -> 99 Ko). Généré avec PurgeCSS, avec une liste blanche pour les
// classes ajoutées par JavaScript (slicknav, collapse/show/active, is-visible…).
// bootstrap.min.css est conservé comme source de référence.
// À régénérer si de nouvelles classes Bootstrap sont utilisées dans le HTML.
const order = [
  'css/bootstrap.purged.css',
  'css/slicknav.min.css',
  'css/all.min.css',
  'css/custom.css',
];

const root = __dirname;
let out = '@charset "UTF-8";';

for (const f of order) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    console.error('ABANDON : fichier source manquant -> ' + f);
    process.exit(1);
  }
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/@charset\s+"[^"]*"\s*;/gi, '');            // un seul @charset, en tête
  c = c.replace(/\/\*#\s*sourceMappingURL=[^*]*\*\//g, ''); // sourcemaps mortes
  if (f.endsWith('all.min.css')) {
    // Font Awesome bloque l'affichage du texte pendant le chargement (210 ms perdus)
    c = c.replace(/font-display:block/g, 'font-display:swap');
  }
  out += '\n/* ' + f + ' */\n' + c.trim();
}

// Contrôle d'intégrité : accolades équilibrées
let depth = 0, bad = 0;
for (const ch of out) { if (ch === '{') depth++; if (ch === '}') { depth--; if (depth < 0) bad++; } }
if (depth !== 0 || bad !== 0) {
  console.error('ABANDON : CSS mal formé (profondeur ' + depth + ', erreurs ' + bad + ')');
  process.exit(1);
}

fs.writeFileSync(path.join(root, 'css/site.css'), out, 'utf8');
console.log('css/site.css généré : ' + (out.length / 1024).toFixed(0) + ' Ko');
