/*
 * Génère les deux feuilles de styles du site. Lancé avant `astro dev` et `astro build` (package.json).
 *
 *   src/styles/custom.css          SOURCE : c'est ici qu'on écrit
 *   src/styles/bootstrap.min.css   Bootstrap complet
 *        │  1. PurgeCSS retire les règles jamais utilisées (2/3 de custom.css, plus de la moitié de Bootstrap)
 *        │  2. fusion avec slicknav.min.css et all.min.css (Font Awesome), dans l'ordre de cascade historique
 *        ▼
 *   public/css/site.css            feuille complète, chargée sans bloquer l'affichage
 *        │  3. extraction des règles de la partie visible sans défiler
 *        ▼
 *   src/styles/critical.css        intégrée dans le <head> de chaque page (src/layouts/Base.astro)
 *
 * ⚠️  Ne jamais modifier site.css ni critical.css à la main : ils sont écrasés à chaque lancement
 *     (et ignorés par git).
 *
 * Pourquoi : les 4 feuilles séparées bloquaient l'affichage ~2 200 ms sur 4G, 89 % des règles
 * n'étaient jamais utilisées, et la feuille fusionnée bloquait encore ~1 700 ms.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PurgeCSS } from 'purgecss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// PurgeCSS traite les chemins comme des globs : sous Windows, les antislashs casseraient la résolution
const g = (p) => path.join(root, p).split(path.sep).join('/');
const lire = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const lister = (dir, ext) => fs.readdirSync(path.join(root, dir), { recursive: true }).filter((f) => f.endsWith(ext)).map((f) => g(`${dir}/${f}`));

function verifier(css, nom) {
	let d = 0, bad = 0;
	for (const ch of css) { if (ch === '{') d++; if (ch === '}') { d--; if (d < 0) bad++; } }
	if (d !== 0 || bad !== 0) { console.error(`ABANDON : ${nom} -> CSS mal formé`); process.exit(1); }
}

/* ---------- 1) Purge ---------- */

// ⚠️  Cette liste blanche est ESSENTIELLE : PurgeCSS ne voit que le code des pages, or beaucoup de
//     classes sont ajoutées à l'exécution par jQuery (menu slicknav), Bootstrap (collapse/show/active)
//     ou nos scripts (is-visible du bouton retour-haut). Sans elles, le menu mobile et l'accordéon
//     FAQ casseraient.
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

const content = [...lister('src', '.astro'), ...lister('public/js', '.js')]; // le JS est scanné : il référence des classes
const purger = async (src) => {
	const [{ css }] = await new PurgeCSS().purge({
		content,
		css: [g(src)],
		safelist,
		keyframes: false,            // certaines animations sont déclenchées par JS
		fontFace: false,
		variables: false,            // les variables CSS sont utilisées dynamiquement
	});
	verifier(css, src);
	return css;
};

/* ---------- 2) Fusion ---------- */

// Ordre de cascade — NE PAS MODIFIER (reproduit l'ordre historique du <head>)
const feuilles = [
	['bootstrap.min.css', await purger('src/styles/bootstrap.min.css')],
	['slicknav.min.css', lire('src/styles/slicknav.min.css')],
	['all.min.css', lire('src/styles/all.min.css')],
	['custom.css', await purger('src/styles/custom.css')],
];

let site = '@charset "UTF-8";';
for (let [nom, c] of feuilles) {
	c = c.replace(/@charset\s+"[^"]*"\s*;/gi, '');            // un seul @charset, en tête
	c = c.replace(/\/\*#\s*sourceMappingURL=[^*]*\*\//g, ''); // sourcemaps mortes
	// Font Awesome bloque l'affichage du texte pendant le chargement (210 ms perdus)
	if (nom === 'all.min.css') c = c.replace(/font-display:block/g, 'font-display:swap');
	site += `\n/* ${nom} */\n${c.trim()}`;
}
verifier(site, 'site.css');
fs.mkdirSync(path.join(root, 'public/css'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/css/site.css'), site);

/* ---------- 3) Styles de la partie visible sans défiler ---------- */

// Zone haute : préchargeur + en-tête, puis le héros de l'accueil et l'en-tête des pages internes
const tokens = new Set();
const tags = new Set();
function collect(html) {
	for (const m of html.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => c && tokens.add(c));
	for (const m of html.matchAll(/id="([^"]+)"/g)) tokens.add(m[1]);
	for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b/gi)) tags.add(m[1].toLowerCase());
}
const jusqua = (fichier, marqueur) => {
	const h = lire(fichier);
	const fin = h.indexOf(marqueur);
	if (fin === -1) { console.error(`ABANDON : marqueur « ${marqueur} » introuvable dans ${fichier}`); process.exit(1); }
	return h.slice(0, fin);
};
const gabarit = lire('src/layouts/Base.astro');
collect(gabarit.slice(gabarit.indexOf('<body')));
collect(lire('src/components/Header.astro'));
collect(jusqua('src/pages/index.astro', 'Hero Section End'));
collect(jusqua('src/pages/permis-b.astro', 'Page Header Section End'));

const classRe = /\.(-?[_a-zA-Z][\w-]*)/g;
const idRe = /#(-?[_a-zA-Z][\w-]*)/g;

function selectorIsCritical(sel) {
	const classes = [...sel.matchAll(classRe)].map((m) => m[1]);
	const ids = [...sel.matchAll(idRe)].map((m) => m[1]);
	if (classes.length === 0 && ids.length === 0) {
		// sélecteur de balise pur (body, h1, a…) ou :root : styles de base, on garde
		const bare = sel.replace(/::?[a-z-]+(\([^)]*\))?/gi, '').replace(/\[[^\]]*\]/g, '').trim();
		if (!bare) return true;
		return bare.split(/[\s>+~,]+/).filter(Boolean).every((t) => tags.has(t.toLowerCase()) || t === '*');
	}
	return classes.some((c) => tokens.has(c)) || ids.some((i) => tokens.has(i));
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
			if (inner.trim()) kept += `${prelude}{${inner}}`;
			continue;
		}
		if (/^@(font-face|keyframes|-webkit-keyframes|charset|view-transition)/i.test(prelude)) {
			kept += block;   // polices, animations et variables : indispensables
			continue;
		}
		const good = prelude.split(',').map((s) => s.trim()).filter(Boolean).filter(selectorIsCritical);
		if (good.length) kept += `${good.join(',')}{${body}}`;
	}
	return kept;
}

// Intégrée dans la page, la feuille n'est plus dans /css/ : ses chemins relatifs partent de la racine
const critical = filterRules(site).replace(/url\((['"]?)\.\.\//g, 'url($1/').trim();
verifier(critical, 'critical.css');
fs.writeFileSync(path.join(root, 'src/styles/critical.css'), critical);

const ko = (s) => `${(s.length / 1024).toFixed(0)} Ko`;
console.log(`CSS : site.css ${ko(site)}, critical.css ${ko(critical)} (${tokens.size} classes de la zone haute)`);
