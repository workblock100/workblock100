// Renders SHIFT HAPPENS to MP4 (or preview stills) with headless Chromium + ffmpeg.
//   node render.js preview 3.5 12 40.2   -> build/preview/t_<sec>.png
//   node render.js audit [step]          -> layout audit: lists anything covered or cut off
//   node render.js video [out.mp4]       -> full 1080x1920 30fps H.264 + AAC
// Env: EP=1|2 (episode), FFMPEG=/path/to/ffmpeg (defaults to `ffmpeg` on PATH), WORKERS=4, CHROMIUM=/path/to/chrome
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

let playwright;
try { playwright = require('playwright'); } catch { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const ROOT = __dirname;
const EPNUM = parseInt(process.env.EP || '1', 10);
const BUILD = path.join(ROOT, 'build', EPNUM === 1 ? '' : `ep${EPNUM}`);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.json': 'application/json' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html?capture&ep=${EPNUM}`);
  await page.evaluate(([f, q]) => { window.FMT = f; window.Q = q; }, [process.env.FMT || 'image/jpeg', parseFloat(process.env.Q || '0.93')]);
  const duration = await page.evaluate(() => window.READY);
  return { page, duration };
}

async function main() {
  const [mode = 'preview', ...args] = process.argv.slice(2);
  const srv = await serve();
  const port = srv.address().port;
  const launch = { args: ['--disable-gpu', '--disable-web-security'] };
  if (process.env.CHROMIUM) launch.executablePath = process.env.CHROMIUM;
  const browser = await playwright.chromium.launch(launch);
  try {
    if (mode === 'preview') {
      const { page } = await openPage(browser, port);
      const dir = path.join(BUILD, 'preview');
      fs.mkdirSync(dir, { recursive: true });
      for (const a of args) {
        const t = parseFloat(a);
        const data = await page.evaluate(t => { window.renderAt(t); return document.getElementById('c').toDataURL('image/png'); }, t);
        fs.writeFileSync(path.join(dir, `t_${t.toFixed(2)}.png`), Buffer.from(data.split(',')[1], 'base64'));
      }
      console.log('wrote', args.length, 'previews to', dir);
      return;
    }
    if (mode === 'audit') {
      const { page, duration } = await openPage(browser, port);
      const step = parseFloat(args[0] || '0.1');
      const rows = await page.evaluate(([d, st]) => window.audit(0, d, st), [duration, step]);
      // collapse consecutive hits of the same problem into time ranges
      const groups = new Map();
      for (const [t, scene, msg] of rows) {
        const k = scene + ' | ' + msg.replace(/\(\d+%\)|\[.*\]/g, '').trim();
        const g = groups.get(k) || { scene, msg, from: t, to: t, n: 0 };
        g.to = t; g.n++; groups.set(k, g);
      }
      const list = [...groups.values()].sort((a, b) => a.from - b.from);
      for (const g of list) console.log(`${g.from.toFixed(2)}-${g.to.toFixed(2)}s  ${g.scene.padEnd(9)} ${g.msg}  (x${g.n})`);
      console.log(`${rows.length} issue-frames, ${list.length} distinct issues, ${Math.round(duration / step)} frames checked`);
      return;
    }
    const out = path.resolve(args[0] || path.join(BUILD, 'shift-happens.mp4'));
    const workers = parseInt(process.env.WORKERS || '4', 10);
    const pages = [];
    for (let i = 0; i < workers; i++) pages.push(await openPage(browser, port));
    const fps = 30;
    const first = parseInt(process.env.FROM || '0', 10);
    const total = parseInt(process.env.FRAMES || '0', 10) || Math.ceil(pages[0].duration * fps) - first;
    const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', (process.env.FMT || '').includes('png') ? 'png' : 'mjpeg', '-i', '-',
      '-ss', String(first / fps), '-i', path.join(BUILD, 'audio.wav'), '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '25', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const CH = 15;
    const chunks = [];
    for (let s = 0; s < total; s += CH) chunks.push([first + s, Math.min(CH, total - s)]);
    const done = new Map();
    let next = 0, written = 0;
    const t0 = Date.now();
    const flush = async () => {
      while (done.has(written)) {
        const frames = done.get(written); done.delete(written);
        for (const f of frames) {
          if (!ff.stdin.write(Buffer.from(f.slice(f.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
        }
        written++;
        if (written % 20 === 0) {
          const pct = written / chunks.length, el = (Date.now() - t0) / 1000;
          process.stdout.write(`\r${(pct * 100).toFixed(1)}%  ${el.toFixed(0)}s elapsed, ~${(el / pct - el).toFixed(0)}s left   `);
        }
      }
    };
    await Promise.all(pages.map(async ({ page }) => {
      while (next < chunks.length) {
        const idx = next++;
        const [s, n] = chunks[idx];
        done.set(idx, await page.evaluate(([s, n]) => window.captureFrames(s, n), [s, n]));
        await flush();
      }
    }));
    await flush();
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
    console.log(`\nwrote ${out} (${total} frames) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
