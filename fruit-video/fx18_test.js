'use strict';
/* FX18 test and demo driver (not loaded by index.html). Playwright + fx18_demo.html (standalone) and, for the engine mode, index.html?capture&ep=18.
 *   node fx18_test.js sheet <case,case,...> <t,t,...> [out.png] [cellW]   a contact sheet (rows = cases, columns = times) in build/ep18_fx/
 *   node fx18_test.js det [case,...]                                      determinism: same call twice; t drawn first or last; a second page gives the same pixels
 *   node fx18_test.js cost [case,...]                                     milliseconds per draw of each case
 *   node fx18_test.js engine <case,...> <t,t,...> [out.png] [cellW]       cases drawn through the real renderer over a real Strawberry (foam smoke flame alarm misc)
 *   node fx18_test.js enginedet                                           the engine cases again: two fresh pages and reverse order must hash the same
 *   node fx18_test.js list                                                the case names
 * Output: build/ep18_fx/*.png */
const fs = require('fs'), path = require('path'), http = require('http');
const { execSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const ROOT = __dirname, OUT = path.join(ROOT, 'build', 'ep18_fx');
fs.mkdirSync(OUT, { recursive: true });
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
const nums = s => String(s).split(',').map(parseFloat);
async function demoPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/fx18_demo.html`);
  return page;
}

/* runs INSIDE index.html?capture&ep=18: replaces the title scene (in memory only) by effect test scenes that go through the real renderer (grade, bloom, motion blur off) with a real Strawberry */
function engineSetup() {
  const F = window.FX18, E = EPISODES[18], H = window.H6, cur = { name: '' };
  const straw = (x, y, s, o) => Object.assign(window.A11.straw({}), { x, y, s, who: 'straw', expr: 'sour' }, o || {});
  const wall = (kind) => {
    const g = ctx.createLinearGradient(0, 0, 0, 1920);
    if (kind === 'dark') { g.addColorStop(0, '#120e12'); g.addColorStop(1, '#241a18'); } else { g.addColorStop(0, '#9fb3a6'); g.addColorStop(.72, '#8ea194'); g.addColorStop(.72, '#7a8478'); g.addColorStop(1, '#5d655c'); }
    ctx.fillStyle = g; ctx.fillRect(-200, -200, 1480, 2320);
  };
  const CASES = {
    foam: { draw(lt) {
      wall(); const o = straw(640, 1330, 1.25); drawChar(o); const [fx, fy] = H.faceC(o);
      F.foamJet(ctx, { nozzle: te => ({ x: 90, y: 960 + 12 * Math.sin(te * 7), ang: .02 + .04 * Math.sin(te * 4) }), t0: .2, t1: 2.0, t: lt, speed: 1500, size: 34, seed: 3 });
      F.foamPile(ctx, { x: fx, y: fy + 150, w: 230, h: 150, t: lt, t0: 1.3, grow: 1.0, seed: 4 });
      F.foamPile(ctx, { x: fx - 40, y: fy - 110, w: 190, h: 110, t: lt, t0: 1.7, grow: .9, seed: 6 });
    } },
    smoke: { draw(lt) {
      wall(); const o = straw(640, 1330, 1.25); drawChar(o); const [fx, fy] = H.faceC(o);
      F.smoke(ctx, { x: 300, y: 1400, w: 130, h: 900, t: lt, t0: 0, seed: 2, density: .7, drift: 160 });
      F.smoke(ctx, { x: fx - 30, y: fy + 330, w: 110, h: 520, t: lt, t0: .2, seed: 6, density: .45, drift: -50, color: '#8a8a90' });
      F.smokeLayer(ctx, { x0: -50, x1: 1130, yTop: -20, depth: 460, t: lt, seed: 4, alpha: .5 });
    } },
    flame: { draw(lt) {
      wall('dark'); const o = straw(540, 1450, 1.25); F.flame(ctx, { x: 540, y: 1480, w: 520, h: 330, t: lt, seed: 1, kind: 'log' }); drawChar(o); const [fx, fy] = H.faceC(o);
      F.cone(ctx, { x: 540, y: 1470, ang: -Math.PI / 2, spread: 1.5, len: 900, color: '#ff9a3a', alpha: .3, soft: .9 }); F.embers(ctx, { x: 540, y: 1450, w: 420, t: lt, seed: 1, count: 18, rise: 420 });
    } },
    alarm: { draw(lt) {
      wall(); const o = straw(540, 1330, 1.25, { expr: 'panic' }); drawChar(o);
      const k = F.hornK(lt, .4, 99); ctx.fillStyle = '#c1121f'; ctx.beginPath(); ctx.roundRect(800, 360, 120, 100, 10); ctx.fill(); F.lamp(ctx, { x: 860, y: 410, level: F.strobe(k), r: 22 });
      F.cone(ctx, { x: 200, y: 330, ang: Math.PI / 2 + .25, spread: .9, len: 900, color: '#ffe8c0', alpha: .22 });
    }, over(lt) { const k = F.hornK(lt, .4, 99); F.wash(ctx, { color: '#ff2020', alpha: .12, mode: 'multiply' }); F.wash(ctx, { color: '#ffeedd', alpha: .3 * F.strobe(k), mode: 'add' }); F.vignette(ctx, { alpha: .4, color: '#12060a' }); } },
    misc: { draw(lt) {
      wall(); const o = straw(540, 1330, 1.25); drawChar(o);
      F.sparks(ctx, { x: 250, y: 700, t: lt, t0: .4, seed: 3, count: 24, speed: 600 }); F.puff(ctx, { x: 800, y: 1330, r: 140, t: lt, t0: .9, life: 1.6, seed: 2 });
      F.water(ctx, { x: 540, y: 120, t: lt, t0: .2, t1: 2.2, seed: 2, len: 700 });
    } },
  };
  E.SCENES.title = { shot: () => 'fx', cam() { H.zoomTo(540, 960, 1); }, draw(lt) { CASES[cur.name].draw(lt); }, fx: () => ({ bloom: .45, vignette: .2, grain: .04 }), blur: () => 1, over(lt) { const f = CASES[cur.name].over; if (f) f(lt); }, noChyron: true, noScrim: true };
  window.__FXE = {
    names: Object.keys(CASES),
    sheet(names, times, w) {
      const h = Math.round(w * 1920 / 1080), cv = document.createElement('canvas'); cv.width = times.length * (w + 6) + 6; cv.height = names.length * (h + 6) + 6;
      const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
      names.forEach((n, r) => times.forEach((t, k) => { cur.name = n; renderAt(t); g.drawImage(document.getElementById('c'), 6 + k * (w + 6), 6 + r * (h + 6), w, h); }));
      return cv.toDataURL('image/png');
    },
    hash(name, t) { cur.name = name; renderAt(t); const c = document.getElementById('c'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let hh = 2166136261; for (let i = 0; i < d.length; i += 4) { hh ^= d[i] ^ (d[i + 1] << 8) ^ (d[i + 2] << 16); hh = Math.imul(hh, 16777619); } return (hh >>> 0).toString(16); },
  };
}

async function main() {
  const [mode = 'list', ...args] = process.argv.slice(2);
  const srv = await serve(), port = srv.address().port;
  const browser = await playwright.chromium.launch({ args: ['--disable-gpu', '--disable-web-security'] });
  try {
    if (mode === 'list') { const p = await demoPage(browser, port); console.log((await p.evaluate(() => Object.keys(CASES))).join(' ')); return; }
    if (mode === 'sheet') {
      const [names, times, out = 'sheet.png', cellW = '340'] = args, p = await demoPage(browser, port);
      const url = await p.evaluate(([n, t, w]) => sheet(n.split(','), t, w), [names, nums(times), parseFloat(cellW)]);
      fs.writeFileSync(path.join(OUT, out), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', path.join(OUT, out)); return;
    }
    if (mode === 'det') {
      const p = await demoPage(browser, port), p2 = await demoPage(browser, port);
      const names = args[0] ? args[0].split(',') : await p.evaluate(() => Object.keys(CASES).filter(n => !CASES[n].noDet)), times = [0.3, 0.9, 1.7, 2.6, 4.05];
      let bad = 0;
      for (const n of names) {
        const hs = await p.evaluate(([n, ts]) => ts.map(t => hashCase(n, t)), [n, times]);                  /* forward */
        const hs2 = await p.evaluate(([n, ts]) => ts.slice().reverse().map(t => hashCase(n, t)).reverse(), [n, times]);   /* backward (t drawn first or last) */
        const hs3 = await p2.evaluate(([n, ts]) => ts.map(t => hashCase(n, t)), [n, times]);               /* a second page = a second worker */
        const hs4 = await p.evaluate(([n, ts]) => ts.map(t => hashCase(n, t)), [n, times]);                /* the same call again */
        const ok = hs.every((h, i) => h === hs2[i] && h === hs3[i] && h === hs4[i]);
        const distinct = new Set(hs).size;
        if (!ok) bad++;
        console.log((ok ? 'OK   ' : 'FAIL ') + n.padEnd(14) + ' distinct frames ' + distinct + '/' + times.length + (ok ? '' : '  ' + JSON.stringify([hs, hs2, hs3, hs4])));
      }
      console.log(bad ? `DETERMINISM: ${bad} case(s) differ` : 'DETERMINISM: all cases identical (forward, backward, repeat, second page)'); process.exitCode = bad ? 1 : 0; return;
    }
    if (mode === 'cost') {
      const p = await demoPage(browser, port), names = args[0] ? args[0].split(',') : await p.evaluate(() => Object.keys(CASES));
      for (const n of names) { const ms = await p.evaluate(n => { cost(n, 1.2, 8); return cost(n, 1.2, 60); }, n); console.log(n.padEnd(14), ms.toFixed(2), 'ms/draw'); }
      return;
    }
    if (mode === 'engine') {
      const [name, times, out = 'engine.png', cellW = '360'] = args;
      const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
      page.on('pageerror', e => console.error('PAGE ERROR', e.message));
      page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
      await page.goto(`http://127.0.0.1:${port}/index.html?capture&ep=18`);
      await page.evaluate(() => window.READY);
      await page.evaluate(engineSetup);
      const url = await page.evaluate(([n, ts, w]) => window.__FXE.sheet(n.split(','), ts, w), [name, nums(times), parseFloat(cellW)]);
      fs.writeFileSync(path.join(OUT, out), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', path.join(OUT, out)); return;
    }
    if (mode === 'enginedet') {
      /* the same frames in two fresh pages (two workers) and in reverse order must hash the same: the real renderer, a real character, every effect case */
      const open = async () => { const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); pg.on('pageerror', e => console.error('PAGE ERROR', e.message)); await pg.goto(`http://127.0.0.1:${port}/index.html?capture&ep=18`); await pg.evaluate(() => window.READY); await pg.evaluate(engineSetup); return pg; };
      const a = await open(), b = await open(), names = await a.evaluate(() => window.__FXE.names), times = [.5, 1.3, 2.1, 3.4, 5.0]; let bad = 0;
      for (const n of names) {
        const h1 = await a.evaluate(([n, ts]) => ts.map(t => window.__FXE.hash(n, t)), [n, times]);
        const h2 = await b.evaluate(([n, ts]) => ts.slice().reverse().map(t => window.__FXE.hash(n, t)).reverse(), [n, times]);
        const ok = h1.every((h, i) => h === h2[i]); if (!ok) bad++;
        console.log((ok ? 'OK   ' : 'FAIL ') + n.padEnd(8) + ' distinct ' + new Set(h1).size + '/' + times.length);
      }
      console.log(bad ? `ENGINE DETERMINISM: ${bad} differ` : 'ENGINE DETERMINISM: identical across two pages and reverse order'); process.exitCode = bad ? 1 : 0; return;
    }
    console.error('unknown mode', mode);
  } finally { await browser.close(); srv.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
