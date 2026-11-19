// Descarga three.js, GLTFLoader y las fuentes para que el juego funcione 100% offline.
import fs from 'node:fs';
import path from 'node:path';

const W = 'www', V = path.join(W, 'vendor'), F = path.join(V, 'fonts');
fs.mkdirSync(F, { recursive: true });

const get = async (u, ua) => {
  const r = await fetch(u, ua ? { headers: { 'User-Agent': ua } } : undefined);
  if (!r.ok) throw new Error(u + ' -> ' + r.status);
  return r;
};
const save = async (u, f) => fs.writeFileSync(f, Buffer.from(await (await get(u)).arrayBuffer()));

let html = fs.readFileSync('NOWHERE.html', 'utf8');

await save('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', path.join(V, 'three.min.js'));
await save('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js', path.join(V, 'GLTFLoader.js'));

// Fuentes: pedir el CSS con un UA moderno para recibir woff2
const m = html.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/);
if (m) {
  let css = await (await get(m[1].replace(/&amp;/g, '&'),
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36')).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(x => x[1]))];
  let i = 0;
  for (const u of urls) {
    const name = `f${i++}.woff2`;
    await save(u, path.join(F, name));
    css = css.split(u).join(`fonts/${name}`);
  }
  fs.writeFileSync(path.join(V, 'fonts.css'), css);
}

html = html
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="vendor/fonts.css" rel="stylesheet">')
  .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/, 'vendor/three.min.js')
  .replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/loaders\/GLTFLoader\.js/, 'vendor/GLTFLoader.js');

fs.writeFileSync(path.join(W, 'index.html'), html);
console.log('OK: www/ listo (offline)');
