/*
 * Intègre css/critical.css dans le <head> de chaque page et bascule
 * css/site.css en chargement asynchrone.
 *
 * Avant : site.css bloquait le rendu ~1 700 ms sur 4G lente.
 * Après : la partie visible s'affiche immédiatement avec les styles intégrés,
 *         le reste de la feuille arrive sans bloquer.
 *
 * Le script est idempotent : il remplace le bloc précédent à chaque exécution.
 * Usage : node purge-css.js && node build-css.js && node critical-css.js && node inline-critical.js
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;

const BEGIN = '<!-- critical:begin (genere par inline-critical.js - ne pas editer) -->';
const END = '<!-- critical:end -->';

const criticalPath = path.join(root, 'css/critical.css');
if (!fs.existsSync(criticalPath)) {
  console.error('ABANDON : css/critical.css manquant — lancez `node critical-css.js`.');
  process.exit(1);
}
const critical = fs.readFileSync(criticalPath, 'utf8').trim();

// Bloc à insérer : styles de la zone haute + feuille complète en asynchrone
const block =
  BEGIN + '\n' +
  '\t<style>' + critical + '</style>\n' +
  '\t<link rel="preload" href="css/site.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n' +
  '\t<noscript><link rel="stylesheet" href="css/site.css"></noscript>\n' +
  '\t' + END;

// Lien bloquant d'origine, à remplacer la première fois
const originalLink =
  /[^\n]*<!-- Feuille de styles fusionnee[^\n]*\r?\n[^\n]*<link href="css\/site\.css" rel="stylesheet" media="screen">/;

let done = 0;
for (const f of fs.readdirSync(root).filter(n => n.endsWith('.html'))) {
  const p = path.join(root, f);
  let h = fs.readFileSync(p, 'utf8');

  if (h.includes(BEGIN)) {
    // Remplace le bloc existant (régénération)
    const re = new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    h = h.replace(re, block);
  } else if (originalLink.test(h)) {
    h = h.replace(originalLink, '\t' + block);
  } else {
    console.error('  ' + f + ' : lien vers site.css introuvable, page ignoree');
    continue;
  }

  fs.writeFileSync(p, h, 'utf8');
  done++;
}
console.log(done + ' pages : CSS critique integre, site.css en asynchrone');
