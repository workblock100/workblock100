// Renders SHIFT HAPPENS to MP4 (or preview stills) with headless Chromium + ffmpeg.
//   node render.js preview 3.5 12 40.2   -> build/preview/t_<sec>.png
//   node render.js audit [step] [from] [to] -> layout audit: lists anything covered or cut off
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
      if (process.env.MB) await page.evaluate(() => { window.MBP = true; });
      const dir = path.join(BUILD, 'preview');
      fs.mkdirSync(dir, { recursive: true });
      for (const a of args) {
        const t = parseFloat(a);
        const data = await page.evaluate(t => { (window.MBP ? window.renderMB : window.renderAt)(t); return document.getElementById('c').toDataURL('image/png'); }, t);
        fs.writeFileSync(path.join(dir, `t_${t.toFixed(2)}.png`), Buffer.from(data.split(',')[1], 'base64'));
      }
      console.log('wrote', args.length, 'previews to', dir);
      return;
    }
    if (mode === 'events') {
      // foley from the animation: sample the episode, watch each walker's gait phase, and write a footstep wherever a foot lands on screen
      const fps = parseFloat(args[0] || '15'), workers = parseInt(process.env.WORKERS || '4', 10), pages = [];
      for (let i = 0; i < workers; i++) pages.push(await openPage(browser, port));
      const duration = pages[0].duration, n = Math.floor(duration * fps), per = [], chunk = 60;
      let next = 0;
      await Promise.all(pages.map(async ({ page }) => {
        while (next * chunk < n) {
          const c = next++, a = c * chunk, b = Math.min(n, a + chunk);
          const res = await page.evaluate(([a, b, fps]) => { const out = []; for (let i = a; i < b; i++) { window.__REC = []; window.renderAt(i / fps); out.push(window.__REC); } window.__REC = null; return out; }, [a, b, fps]);
          for (let i = 0; i < res.length; i++) per[a + i] = res[i];
        }
      }));
      const events = [], last = new Map();
      for (let i = 0; i < n; i++) {
        const t1 = i / fps, rec = per[i] || [];
        const crowd = rec.length > 7;
        const seen = new Set();
        for (const r of rec) {
          const key = r.key; seen.add(key);
          const p = last.get(key);
          const vis = r.x > -120 && r.x < 1200 && r.y > -200 && r.y < 2100;
          if (p && !crowd && vis && Math.abs(r.cyc - p.cyc) < 3 && r.cyc !== p.cyc) {
            const lo = Math.min(r.cyc, p.cyc), hi = Math.max(r.cyc, p.cyc), t0 = p.t;
            // the right foot lands when the phase passes an integer, the left foot at the half-integers
            for (let m = Math.floor(lo * 2) + 1; m <= Math.floor(hi * 2); m++) {
              const cy = m / 2, u = (cy - p.cyc) / (r.cyc - p.cyc), tc = t0 + u * (t1 - t0);
              events.push({ t: +tc.toFixed(3), name: 'step', foot: m % 2 ? 'L' : 'R', key, vol: +Math.min(.34, .1 + .2 * Math.min(1, r.s / 1.4)).toFixed(3), pan: +Math.max(-.8, Math.min(.8, (r.x - 540) / 540 * .8)).toFixed(3) });
            }
          }
          last.set(key, { t: t1, cyc: r.cyc });
        }
        for (const key of [...last.keys()]) if (!seen.has(key)) last.delete(key);
      }
      events.sort((a, b) => a.t - b.t);
      fs.writeFileSync(path.join(BUILD, 'events.json'), JSON.stringify(events));
      console.log(`wrote ${events.length} footsteps to ${path.join(BUILD, 'events.json')} (${n} samples at ${fps} fps)`);
      return;
    }
    if (mode === 'textinv') {
      // every distinct text run in a range: where it is, how big, how it is turned, and the moment it is most visible (feeds the text atlas)
      const { page, duration } = await openPage(browser, port);
      const step = parseFloat(args[0] || '0.25'), from = parseFloat(args[1] || '0'), to = Math.min(duration, parseFloat(args[2] || String(duration)));
      const inv = await page.evaluate(([a, b, st]) => TXA.inventory(a, b, st), [from, to, step]);
      fs.mkdirSync(BUILD, { recursive: true });
      fs.writeFileSync(path.join(BUILD, 'textinv.json'), JSON.stringify(inv));
      console.log(`wrote ${inv.length} distinct text runs to ${path.join(BUILD, 'textinv.json')}`);
      return;
    }
    if (mode === 'audit') {
      const { page, duration } = await openPage(browser, port);
      if (process.env.TEXTGATE) await page.evaluate(() => { TXA.force = true; });   // hold an older episode to the text gate too
      const step = parseFloat(args[0] || '0.1'), from = parseFloat(args[1] || '0'), to = Math.min(duration, parseFloat(args[2] || String(duration)));
      const rows = await page.evaluate(([a, b, st]) => window.audit(a, b, st), [from, to, step]);
      // collapse consecutive hits of the same problem into time ranges
      const groups = new Map();
      for (const [t, scene, msg] of rows) {
        const k = scene + ' | ' + msg.replace(/\(\d+%\)|\[.*\]/g, '').trim();
        const g = groups.get(k) || { scene, msg, from: t, to: t, n: 0 };
        g.to = t; g.n++; groups.set(k, g);
      }
      const list = [...groups.values()].sort((a, b) => a.from - b.from);
      const notes = list.filter(g => g.msg.startsWith('NOTE ')), errs = list.filter(g => !g.msg.startsWith('NOTE '));
      for (const g of errs) console.log(`${g.from.toFixed(2)}-${g.to.toFixed(2)}s  ${g.scene.padEnd(9)} ${g.msg}  (x${g.n})`);
      if (!process.env.NONOTES) for (const g of notes) console.log(`${g.from.toFixed(2)}-${g.to.toFixed(2)}s  ${g.scene.padEnd(9)} ${g.msg}  (x${g.n})`);
      const errFrames = rows.filter(r => !r[2].startsWith('NOTE ')).length;
      console.log(`${errFrames} issue-frames, ${errs.length} distinct issues, ${Math.round((to - from) / step)} frames checked, ${notes.length} notes`);
      // Episode 6 onward is held to a hard gate: any layout issue fails the run (notes do not). Older episodes keep the old behavior.
      if (errFrames && (EPNUM >= 6 || process.env.STRICT)) process.exitCode = 1;
      return;
    }
    const out = path.resolve(args[0] || path.join(BUILD, 'shift-happens.mp4'));
    const workers = parseInt(process.env.WORKERS || '4', 10);
    const pages = [];
    for (let i = 0; i < workers; i++) pages.push(await openPage(browser, port));
    const fps = 30;
    const first = parseInt(process.env.FROM || '0', 10);
    const total = parseInt(process.env.FRAMES || '0', 10) || Math.ceil(pages[0].duration * fps) - first;
    // AUDIO=path overrides the soundtrack; an .m4a/.aac file is stream-copied so it is not encoded twice
    const audio = process.env.AUDIO ? path.resolve(process.env.AUDIO) : path.join(BUILD, 'audio.wav');
    const acodec = /\.(m4a|aac)$/i.test(audio) ? ['-c:a', 'copy'] : ['-c:a', 'aac', '-b:a', '192k'];
    const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', (process.env.FMT || '').includes('png') ? 'png' : 'mjpeg', '-i', '-',
      '-ss', String(first / fps), '-i', audio, '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '25', '-pix_fmt', 'yuv420p',
      ...acodec, '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
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
