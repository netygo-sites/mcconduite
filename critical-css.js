/*
 * Génère css/critical.css — les styles de la partie visible sans défiler
 * (préchargeur + en-tête + hero / en-tête de page).
 *
 * Ce fichier est ensuite INTÉGRÉ dans le <head> de chaque page par
 * inline-critical.js, tandis que css/site.css passe en chargement asynchrone.
 * Objectif : sortir le CSS du chemin critique (il bloquait ~1 700 ms sur 4G).
 *
 * Usage :  node purge-css.js && node build-css.js && node critical-css.js && node inline-critical.js
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;

/* ---------- 1) Zone visible sans défiler : on collecte classes / id / balises ---------- */
const tokens = new Set();
const tags = new Set();

function collect(html) {
  for (const m of html.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && tokens.add(c));
  for (const m of html.matchAll(/id="([^"]+)"/g)) tokens.add(m[1]);
  for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b/gi)) tags.add(m[1].toLowerCase());
}

// index.html : jusqu'à la fin du hero ; pages internes : jusqu'à la fin de l'en-tête de page
for (const [file, marker] of [['index.html', 'Hero Section End'], ['permis-b.html', 'Page Header End']]) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const h = fs.readFileSync(p, 'utf8');
  const start = h.indexOf('<body');
  let end = h.indexOf(marker);
  if (end === -1) {                       // pas de marqueur : on prend l'en-tête + une marge
    end = h.indexOf('</header>');
    end = end === -1 ? start + 20000 : end + 6000;
  }
  collect(h.slice(start, end));
}

/* ---------- 2) Extraction des règles correspondantes dans site.css ---------- */
const css = fs.readFileSync(path.join(root, 'css/site.css'), 'utf8');

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const classRe = /\.(-?[_a-zA-Z][\w-]*)/g;
const idRe = /#(-?[_a-zA-Z][\w-]*)/g;

function selectorIsCritical(sel) {
  const classes = [...sel.matchAll(classRe)].map(m => m[1]);
  const ids = [...sel.matchAll(idRe)].map(m => m[1]);
  if (classes.length === 0 && ids.length === 0) {
    // sélecteur de balise pur (body, h1, a…) ou :root : styles de base, on garde
    const bare = sel.replace(/::?[a-z-]+(\([^)]*\))?/gi, '').replace(/\[[^\]]*\]/g, '').trim();
    if (!bare) return true;
    return bare.split(/[\s>+~,]+/).filter(Boolean).every(t => tags.has(t.toLowerCase()) || t === '*');
  }
  return classes.some(c => tokens.has(c)) || ids.some(i => tokens.has(i));
}

// Découpe le CSS en blocs de premier niveau, en respectant chaînes et imbrication
function splitBlocks(src) {
  const out = [];
  let depth = 0, start = 0, inStr = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (c === '\\') i++; else if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { out.push(src.slice(start, i + 1)); start = i + 1; } }
  }
  return out;
}

function filterRules(src) {
  let kept = '';
  for (const block of splitBlocks(src)) {
    const brace = block.indexOf('{');
    if (brace === -1) continue;
    const prelude = block.slice(0, brace).trim();
    const body = block.slice(brace + 1, block.lastIndexOf('}'));

    if (/^@(media|supports)/i.test(prelude)) {
      const inner = filterRules(body);
      if (inner.trim()) kept += prelude + '{' + inner + '}';
      continue;
    }
    if (/^@(font-face|keyframes|-webkit-keyframes|charset|view-transition)/i.test(prelude)) {
      kept += block;   // polices, animations et variables : indispensables
      continue;
    }
    const sels = prelude.split(',').map(s => s.trim()).filter(Boolean);
    const good = sels.filter(selectorIsCritical);
    if (good.length) kept += good.join(',') + '{' + body + '}';
  }
  return kept;
}

const critical = filterRules(css);

let d = 0, bad = 0;
for (const ch of critical) { if (ch === '{') d++; if (ch === '}') { d--; if (d < 0) bad++; } }
if (d !== 0 || bad !== 0) { console.error('ABANDON : CSS critique mal formé'); process.exit(1); }

fs.writeFileSync(path.join(root, 'css/critical.css'), critical, 'utf8');
console.log('css/critical.css : ' + (critical.length / 1024).toFixed(0) + ' Ko  (site.css : ' +
  (css.length / 1024).toFixed(0) + ' Ko) — ' + tokens.size + ' classes de la zone haute');
