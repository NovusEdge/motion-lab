// Frame-exact capture: loads a page, freezes it at t = frame / fps, screenshots each frame.
//
//   node render.mjs anim.html --secs 6 --fps 60 --size 1080x1080
//   node render.mjs anim.html --fps 60 --frames 0,84,112,359 --out out/stills
//
// Needs `npm i -D playwright` and `npx playwright install chromium` in the working
// directory, or PLAYWRIGHT_CHROMIUM=/path/to/chromium to use a system browser.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve, join, dirname, basename, extname, relative } from 'node:path';
import { parseArgs } from 'node:util';

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    secs: { type: 'string', default: '6' },
    fps: { type: 'string', default: '60' },
    size: { type: 'string', default: '1080x1080' },
    scale: { type: 'string', default: '1' },
    frames: { type: 'string' },
    out: { type: 'string', default: 'out/frames' },
    gl: { type: 'boolean', default: false },
    subframes: { type: 'string', default: '1' },
  },
});
// k subframes spread over the first half of each frame (a 180° shutter). Files are numbered
// sequentially; average each group of k with ffmpeg tmix to get motion blur.
const k = Math.max(1, Number(o.subframes));
const file = positionals[0] ?? 'anim.html';
const fps = Number(o.fps);
const total = Math.round(Number(o.secs) * fps);
const [width, height] = o.size.split('x').map(Number);
// A loop of N frames renders 0..N-1; frame N is frame 0 again and would stutter at the seam.
const list = o.frames
  ? o.frames.split(',').map(Number)
  : Array.from({ length: total }, (_, i) => i);

mkdirSync(o.out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  // Headless Chromium falls back to software GL, which is slow and can differ from the GPU.
  args: o.gl ? ['--use-angle=default', '--enable-gpu', '--ignore-gpu-blocklist'] : [],
});
// Served over http, not file://: Chromium refuses ES module imports and fetch() from file
// pages, and the page then renders without its script instead of failing loudly.
const root = dirname(resolve(file));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.glb': 'model/gltf-binary',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
const server = createServer((req, res) => {
  const p = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (relative(root, p).startsWith('..')) return res.writeHead(403).end();
  try {
    res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
    res.end(readFileSync(p));
  } catch { res.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));

const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: Number(o.scale) });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console error:', m.text()));
page.on('requestfailed', (r) => console.error('request failed:', r.url()));
await page.goto(`http://127.0.0.1:${server.address().port}/${basename(file)}?render=1`, { waitUntil: 'load' });
await page.evaluate(async () => {
  await document.fonts.ready;
  // Pages that load fonts, textures or bake data set window.__ready = true (or a promise) when done.
  if ('__ready' in window) {
    const start = performance.now();
    while (!(await window.__ready)) {
      if (performance.now() - start > 30000) throw new Error('window.__ready never became true');
      await new Promise((r) => setTimeout(r, 50));
    }
  }
});
const driven = await page.evaluate(() => typeof window.renderAt === 'function' || document.getAnimations().length > 0);
if (!driven) console.error('warning: no window.renderAt and no CSS/WAAPI animations; every frame will be identical');

for (const i of list) {
  for (let j = 0; j < k; j++) {
    await page.evaluate(async (t) => {
      if (typeof window.renderAt === 'function') await window.renderAt(t);
      for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
      // Two rAFs so the frozen state is painted before the screenshot.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, (i + j / (2 * k)) / fps);
    const n = k === 1 ? i : i * k + j;
    await page.screenshot({ path: join(o.out, `${String(n).padStart(k === 1 ? 4 : 6, '0')}.png`) });
  }
}
await browser.close();
server.close();
console.log(`${list.length} frame(s) at ${fps} fps -> ${o.out}`);
// The blend writes ordinary %04d frames so contact-sheet.sh, diff.sh and the export commands
// work on the blurred result unchanged.
if (k > 1) {
  console.log(`blend: mkdir -p out/frames && ffmpeg -framerate ${fps * k} -i ${o.out}/%06d.png ` +
    `-vf "tmix=frames=${k},select='eq(mod(n\\,${k})\\,${k - 1})'" -fps_mode passthrough ` +
    `-start_number 0 out/frames/%04d.png`);
}
