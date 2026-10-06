/**
 * Vidéos servies par morceaux (réponses 206) sur Cloudflare Pages.
 *
 * Pages ignore l'en-tête Range sur ses fichiers statiques : une vidéo part toujours
 * entière, en 200. Or Safari (iPhone, iPad, Mac) lit une vidéo par requêtes partielles
 * et refuse de la lire quand le serveur n'y répond pas. Cette fonction ne s'exécute que
 * sur /videos/* (Pages en déduit son _routes.json) : le reste du site reste statique.
 * Sans effet en local : `astro dev` ne lit pas le dossier functions/. La vidéo du héros (public/videos/) est concernée.
 */
export async function onRequestGet({ request, env }) {
  // Le fichier entier, tel que Pages le sert (validation If-None-Match comprise)
  const headers = new Headers(request.headers);
  headers.delete('Range');
  headers.delete('If-Range');
  const asset = await env.ASSETS.fetch(new Request(request.url, { headers }));
  if (asset.status !== 200) return asset; // 304, 404…

  // Une seule plage : « bytes=début-fin », « bytes=début- » ou « bytes=-longueur ».
  // Plusieurs plages, ou un If-Range qui ne correspond plus : le fichier entier.
  const range = /^bytes=(\d*)-(\d*)$/.exec((request.headers.get('Range') ?? '').trim());
  const ifRange = request.headers.get('If-Range');
  if (!range || (!range[1] && !range[2]) || (ifRange && ifRange !== asset.headers.get('ETag'))) {
    const full = new Response(asset.body, asset);
    full.headers.set('Accept-Ranges', 'bytes');
    return full;
  }

  const buffer = await asset.arrayBuffer();
  const size = buffer.byteLength;
  const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }

  const out = new Headers(asset.headers);
  out.delete('Content-Length'); // recalculé d'après le morceau envoyé
  out.set('Accept-Ranges', 'bytes');
  out.set('Content-Range', `bytes ${start}-${end}/${size}`);
  return new Response(new Uint8Array(buffer, start, end - start + 1), { status: 206, headers: out });
}
