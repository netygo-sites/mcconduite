/*
 * Génère css/site.css — la SEULE feuille de styles chargée par les pages.
 *
 * ⚠️  NE JAMAIS modifier css/site.css à la main : il est écrasé à chaque build.
 *
 * Chaîne de production :
 *   css/custom.css      (SOURCE — c'est ici qu'on écrit)
 *        │  PurgeCSS (voir purge-css.js)
 *        ▼
 *   css/custom.purged.css
 *        │  build-css.js  ← ce script
 *        ▼
 *   css/site.css         (servi aux visiteurs)
 *
 * Après avoir modifié css/custom.css (ou ajouté des classes dans le HTML) :
 *     node purge-css.js && node build-css.js
 *
 * Pourquoi : les 4 feuilles séparées bloquaient l'affichage ~2 200 ms sur 4G,
 * et 89 % des règles n'étaient jamais utilisées.
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;

// Ordre de cascade — NE PAS MODIFIER (reproduit l'ordre historique du <head>)
const order = [
  { file: 'css/bootstrap.purged.css', source: 'css/bootstrap.min.css' },
  { file: 'css/slicknav.min.css',     source: null },
  { file: 'css/all.min.css',          source: null },
  { file: 'css/custom.purged.css',    source: 'css/custom.css' },
];

// Garde-fou : une source modifiée après sa version purgée signifie que la
// purge n'a pas été relancée — le build produirait un site.css périmé.
let stale = false;
for (const { file, source } of order) {
  if (!source) continue;
  const p = path.join(root, file), s = path.join(root, source);
  if (!fs.existsSync(p)) { console.error('ABANDON : ' + file + ' manquant — lancez `node purge-css.js`'); process.exit(1); }
  if (fs.statSync(s).mtimeMs > fs.statSync(p).mtimeMs) {
    console.error('ATTENTION : ' + source + ' est plus récent que ' + file);
    stale = true;
  }
}
if (stale) { console.error('\nABANDON : relancez `node purge-css.js` avant `node build-css.js`.'); process.exit(1); }

let out = '@charset "UTF-8";';
for (const { file } of order) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) { console.error('ABANDON : fichier manquant -> ' + file); process.exit(1); }
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/@charset\s+"[^"]*"\s*;/gi, '');            // un seul @charset, en tête
  c = c.replace(/\/\*#\s*sourceMappingURL=[^*]*\*\//g, ''); // sourcemaps mortes
  if (file.endsWith('all.min.css')) {
    // Font Awesome bloque l'affichage du texte pendant le chargement (210 ms perdus)
    c = c.replace(/font-display:block/g, 'font-display:swap');
  }
  out += '\n/* ' + file + ' */\n' + c.trim();
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
