'use strict';
/* F19 test and demo driver (not loaded by index.html). Playwright + f19_demo.html (standalone) and, for the engine mode, index.html?capture&ep=19.
 *   node f19_test.js sheet <case,case,...> <t,t,...> [out.png] [cellW] [bg]   a contact sheet (rows = cases, columns = times) in build/ep19_food/   (bg = neutral | wall | dark)
 *   node f19_test.js det [case,...]                                            determinism: the same call twice; t drawn first or last; a second page gives the same pixels
 *   node f19_test.js cost [case,...]                                           milliseconds per draw of each case (warm: sprites cached)
 *   node f19_test.js cold [case,...]                                           milliseconds of the first draw of each case (sprites baked)
 *   node f19_test.js list                                                      the case names
 *   node f19_test.js engine <case,...> <t,t,...> [out.png] [cellW]             cases drawn through the real renderer (grade, bloom) over a kitchen wall: see engineSetup
 * Output: build/ep19_food/*.png */
const fs = require('fs'), path = require('path'), http = require('http');
const { execSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const ROOT = __dirname, OUT = path.join(ROOT, 'build', 'ep19_food');
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
  await page.goto(`http://127.0.0.1:${port}/f19_demo.html`);
  return page;
}

/* runs INSIDE index.html?capture&ep=19: replaces the title scene (in memory only) by food test scenes that go through the real renderer (grade, bloom, UI kit text, motion blur off) */
function engineSetup() {
  const F = window.F19, E = EPISODES[19], H = window.H6, cur = { name: '' };
  const wall = () => { const g = ctx.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, '#9fb3a6'); g.addColorStop(.62, '#8ea194'); g.addColorStop(.62, '#b98a58'); g.addColorStop(1, '#8d6238'); ctx.fillStyle = g; ctx.fillRect(-200, -200, 1480, 2320); };
  const CASES = {
    cooker: { draw(lt) {
      wall(); F.dish(ctx, 'slowcooker', { x: 540, y: 1100, s: 2.5, steam: .9, light: .6 + .4 * Math.sin(lt * 3), hero: true, t: lt, seed: 2, hop: lt > .5 && lt < .8 ? 1 : 0 });
    } },
    plate: { draw(lt) {
      wall(); F.dish(ctx, 'plate', { x: 540, y: 1100, s: 2.6, items: ['turkeyMold', 'roll', 'pieMold', { kind: 'coffee', thick: 1, fill: .9 }], steam: 1, t: lt, stickers: [{ kind: 'note', text: 'FOR STRAWBERRY', at: [.18, .05], s: .8, rot: -.12 }, { kind: 'label', text: 'CONTAINS: BREAD', at: [.8, .1], s: .7, rot: .05 }] });
    } },
    foods: { draw(lt) {
      wall(); F.dish(ctx, 'turkey', { x: 300, y: 500, s: 1.0, steam: 1, t: lt, seed: 1 }); F.dish(ctx, 'pie', { x: 780, y: 500, s: .9, steam: 1, t: lt, seed: 2 });
      F.dish(ctx, 'jello', { x: 250, y: 860, s: 1.1, wobble: 1, t0: 0, t: lt }); F.dish(ctx, 'cranCan', { x: 740, y: 860, s: 1.1, slices: 2, t: lt }); F.dish(ctx, 'casserole', { x: 330, y: 1180, s: .9, t: lt, steam: 1 });
      F.dish(ctx, 'blender', { x: 800, y: 1220, s: 1.0, fill: .6, on: 1, t: lt });
    } },
    stickers: { draw(lt) {
      wall(); F.dish(ctx, 'plate', { x: 540, y: 1000, s: 2.2, items: ['roll'], t: lt });
      F.sticker(ctx, { kind: 'note', x: 250, y: 420, s: 2.4, rot: -.08, text: 'FOR STRAWBERRY', t: lt, hero: true }); F.sticker(ctx, { kind: 'sticker', x: 800, y: 420, s: 2.4, rot: .12, text: 'FUN COMMITTEE', t: lt, hero: true });
      F.sticker(ctx, { kind: 'label', x: 280, y: 700, s: 2.4, rot: .02, text: 'CONTAINS: BREAD', t: lt, hero: true }); F.sticker(ctx, { kind: 'tag', x: 800, y: 700, s: 2.4, rot: -.1, text: '78 F', t: lt, hero: true });
    } },
  };
  E.SCENES.title = { shot: () => 'f', cam() { H.zoomTo(540, 960, 1); }, draw(lt) { CASES[cur.name].draw(lt); }, fx: () => ({ bloom: .35, vignette: .2, grain: .03 }), blur: () => 1, over(lt) { const f = CASES[cur.name].over; if (f) f(lt); }, noChyron: true, noScrim: true };
  window.__F19E = {
    names: Object.keys(CASES),
    sheet(names, times, w) {
      const h = Math.round(w * 1920 / 1080), cv = document.createElement('canvas'); cv.width = times.length * (w + 6) + 6; cv.height = names.length * (h + 6) + 6;
      const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
      names.forEach((n, r) => times.forEach((t, k) => { cur.name = n; renderAt(t); g.drawImage(document.getElementById('c'), 6 + k * (w + 6), 6 + r * (h + 6), w, h); }));
      return cv.toDataURL('image/png');
    },
  };
}

async function main() {
  const [mode = 'list', ...args] = process.argv.slice(2);
  const srv = await serve(), port = srv.address().port;
  const browser = await playwright.chromium.launch({ args: ['--disable-gpu', '--disable-web-security'] });
  try {
    if (mode === 'list') { const p = await demoPage(browser, port); console.log((await p.evaluate(() => Object.keys(CASES))).join(' ')); return; }
    if (mode === 'sheet') {
      const [names, times, out = 'sheet.png', cellW = '340', bg = 'neutral'] = args, p = await demoPage(browser, port);
      const url = await p.evaluate(([n, t, w, b]) => sheet(n.split(','), t, w, b), [names, nums(times), parseFloat(cellW), bg]);
      fs.writeFileSync(path.join(OUT, out), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', path.join(OUT, out)); return;
    }
    if (mode === 'det') {
      const p = await demoPage(browser, port), p2 = await demoPage(browser, port);
      const names = args[0] ? args[0].split(',') : await p.evaluate(() => Object.keys(CASES).filter(n => !CASES[n].noDet)), times = [0.3, 0.9, 1.7, 2.6, 4.05];
      let bad = 0;
      for (const n of names) {
        const hs = await p.evaluate(([n, ts]) => ts.map(t => hashCase(n, t)), [n, times]);                                      /* forward */
        const hs2 = await p.evaluate(([n, ts]) => ts.slice().reverse().map(t => hashCase(n, t)).reverse(), [n, times]);         /* backward (t drawn first or last) */
        const hs3 = await p2.evaluate(([n, ts]) => ts.map(t => hashCase(n, t)), [n, times]);                                    /* a second page = a second worker */
        const hs4 = await p.evaluate(([n, ts]) => ts.map(t => hashCase(n, t)), [n, times]);                                     /* the same call again */
        const ok = hs.every((h, i) => h === hs2[i] && h === hs3[i] && h === hs4[i]);
        const distinct = new Set(hs).size;
        if (!ok) bad++;
        console.log((ok ? 'OK   ' : 'FAIL ') + n.padEnd(14) + ' distinct frames ' + distinct + '/' + times.length + (ok ? '' : '  ' + JSON.stringify([hs, hs2, hs3, hs4])));
      }
      console.log(bad ? `DETERMINISM: ${bad} case(s) differ` : 'DETERMINISM: all cases identical (forward, backward, repeat, second page)'); process.exitCode = bad ? 1 : 0; return;
    }
    if (mode === 'cost') {
      const p = await demoPage(browser, port), names = args[0] ? args[0].split(',') : await p.evaluate(() => Object.keys(CASES));
      for (const n of names) { const ms = await p.evaluate(n => { cost(n, 1.2, 6); return cost(n, 1.2, 40); }, n); console.log(n.padEnd(14), ms.toFixed(2), 'ms/draw (warm)'); }
      return;
    }
    if (mode === 'cold') {
      const names = args[0] ? args[0].split(',') : null;
      const p0 = await demoPage(browser, port), all = names || await p0.evaluate(() => Object.keys(CASES)); await p0.close();
      for (const n of all) { const p = await demoPage(browser, port); const ms = await p.evaluate(n => cost(n, 1.2, 1), n); console.log(n.padEnd(14), ms.toFixed(1), 'ms first draw (cold)'); await p.close(); }
      return;
    }
    if (mode === 'engine') {
      const [name, times, out = 'engine.png', cellW = '360'] = args;
      const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
      page.on('pageerror', e => console.error('PAGE ERROR', e.message));
      page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
      await page.goto(`http://127.0.0.1:${port}/index.html?capture&ep=19`);
      await page.evaluate(() => window.READY);
      await page.evaluate(engineSetup);
      const url = await page.evaluate(([n, ts, w]) => window.__F19E.sheet(n.split(','), ts, w), [name, nums(times), parseFloat(cellW)]);
      fs.writeFileSync(path.join(OUT, out), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', path.join(OUT, out)); return;
    }
    console.error('unknown mode', mode);
  } finally { await browser.close(); srv.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
