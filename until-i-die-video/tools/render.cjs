#!/usr/bin/env node
// Renders the animation frame-by-frame in headless Chromium and encodes an H.264 MP4.
//
//   node tools/render.cjs [--fps 30] [--from 0] [--to 148] [--workers 4] [--out out/until-i-die.mp4]
//                         [--frames out/frames] [--crf 18] [--stills 1,12.5,40]
//
// Needs Playwright (npm i -g playwright, or local) and ffmpeg with libx264 on PATH
// (or FFMPEG=/path/to/ffmpeg). Frames are cached as JPEGs, so an interrupted render resumes.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (_) {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return require(path.join(globalRoot, 'playwright'));
}

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const ROOT = path.resolve(__dirname, '..');
const FPS = +opt('fps', 30);
const WORKERS = +opt('workers', 4);
const OUT = path.resolve(ROOT, opt('out', 'out/until-i-die.mp4'));
const FRAMES = path.resolve(ROOT, opt('frames', 'out/frames'));
const CRF = opt('crf', '18');
const STILLS = opt('stills', null);

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css' };
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function openPage(chromium, url) {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(url);
  await page.evaluate(() => window.__ready);
  return { browser, page };
}

async function main() {
  const { chromium } = loadPlaywright();
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/index.html?render`;
  fs.mkdirSync(FRAMES, { recursive: true });

  if (STILLS) {
    const { browser, page } = await openPage(chromium, url);
    for (const s of STILLS.split(',').map(Number)) {
      const data = await page.evaluate(t => window.renderAt(t, 0.9), s);
      const f = path.join(ROOT, 'out', `still_${s.toFixed(2)}.jpg`);
      fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
      console.log('wrote', f);
    }
    await browser.close();
    srv.close();
    return;
  }

  const probe = await openPage(chromium, url);
  const videoLen = await probe.page.evaluate(() => VIDEO_LEN);
  await probe.browser.close();
  const from = +opt('from', 0), to = +opt('to', videoLen);
  const first = Math.round(from * FPS), last = Math.round(to * FPS) - 1;
  const total = last - first + 1;
  const per = Math.ceil(total / WORKERS);
  const t0 = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const a = first + w * per, b = Math.min(last, a + per - 1);
    if (a > b) return;
    const { browser, page } = await openPage(chromium, url);
    for (let f = a; f <= b; f++) {
      const file = path.join(FRAMES, `f${String(f).padStart(6, '0')}.jpg`);
      if (!fs.existsSync(file)) {
        const data = await page.evaluate(t => window.renderAt(t, 0.93), f / FPS);
        fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
      }
      done++;
      if (done % 60 === 0) {
        const el = (Date.now() - t0) / 1000;
        console.log(`${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${((total - done) / (done / el) / 60).toFixed(1)} min`);
      }
    }
    await browser.close();
  }));
  srv.close();
  console.log(`rendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);

  const ffmpeg = process.env.FFMPEG || 'ffmpeg';
  const ff = spawn(ffmpeg, [
    '-y', '-framerate', String(FPS), '-start_number', String(first), '-i', path.join(FRAMES, 'f%06d.jpg'),
    '-frames:v', String(total),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-tune', 'film', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', OUT,
  ], { stdio: ['ignore', 'inherit', 'inherit'] });
  await new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  console.log('wrote', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
