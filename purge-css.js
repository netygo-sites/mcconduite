/*
 * Retire les règles CSS jamais utilisées par le site (template AutoGuru :
 * ~2/3 de custom.css et plus de la moitié de Bootstrap ne servaient à rien).
 *
 *   css/bootstrap.min.css -> css/bootstrap.purged.css
 *   css/custom.css        -> css/custom.purged.css
 *
 * Prérequis (hors dépôt, une seule fois) :  npm install purgecss
 * Usage :                                   node purge-css.js && node build-css.js
 *
 * ⚠️  La liste blanche ci-dessous est ESSENTIELLE : PurgeCSS ne voit que le HTML
 *     statique, or beaucoup de classes sont ajoutées à l'exécution par jQuery
 *     (menu slicknav), Bootstrap (collapse/show/active) ou nos scripts
 *     (is-visible du bouton retour-haut). Sans elles, le menu mobile et
 *     l'accordéon FAQ casseraient.
 */
let PurgeCSS;
try { ({ PurgeCSS } = require('purgecss')); }
catch { console.error('ABANDON : purgecss introuvable. Lancez `npm install purgecss`.'); process.exit(1); }

const fs = require('fs');
const path = require('path');
const root = __dirname;
// PurgeCSS traite les chemins comme des globs : sous Windows, les antislashs
// casseraient la résolution. On force des séparateurs "/".
const g = p => path.join(root, p).split(path.sep).join('/');

const safelist = {
  standard: [
    'show', 'fade', 'active', 'collapsed', 'collapsing', 'collapse',
    'is-visible', 'wow', 'animated', 'hide', 'disabled', 'reveal',
    'preloader', 'loading', 'split-line', 'error', 'success',
    'modal-open', 'modal-backdrop',
  ],
  deep: [
    /^slicknav/,                                   // menu mobile généré par jQuery
    /^mc-/,                                        // classes maison
    /^accordion/, /^collaps/, /^modal/, /^dropdown/, /^offcanvas/,
    /^navbar/, /^nav-/, /^carousel/, /^tooltip/, /^popover/,
    /^fa-/, /^help-block/, /^form-/,
    /^text-anime/, /^image-anime/,
    /^header/, /^hero/, /^footer/, /^bs-/,
  ],
  greedy: [/^col-/, /^row/, /^container/, /^d-/, /^btn/],
};

const jobs = [
  { src: 'css/bootstrap.min.css', out: 'css/bootstrap.purged.css' },
  { src: 'css/custom.css',        out: 'css/custom.purged.css' },
];

(async () => {
  const html = fs.readdirSync(root).filter(f => f.endsWith('.html')).map(f => g(f));
  const js = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => g('js/' + f));
  if (!html.length) { console.error('ABANDON : aucune page HTML trouvée'); process.exit(1); }

  for (const { src, out } of jobs) {
    const res = await new PurgeCSS().purge({
      content: [...html, ...js],   // le JS est scanné : il référence des classes
      css: [g(src)],
      safelist,
      keyframes: false,            // certaines animations sont déclenchées par JS
      fontFace: false,
      variables: false,            // les variables CSS sont utilisées dynamiquement
    });

    const css = res[0].css;
    let d = 0, bad = 0;
    for (const ch of css) { if (ch === '{') d++; if (ch === '}') { d--; if (d < 0) bad++; } }
    if (d !== 0 || bad !== 0) { console.error('ABANDON : ' + src + ' -> CSS mal formé'); process.exit(1); }

    fs.writeFileSync(path.join(root, out), css, 'utf8');
    const before = fs.statSync(path.join(root, src)).size;
    console.log(src.padEnd(24) + (before / 1024).toFixed(0).padStart(5) + ' Ko -> ' +
      (css.length / 1024).toFixed(0).padStart(4) + ' Ko  (-' + Math.round((1 - css.length / before) * 100) + '%)');
  }
  console.log('\nLancez maintenant : node build-css.js');
})();
