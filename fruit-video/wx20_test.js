'use strict';
/* WX20 test and demo driver (not loaded by index.html). Playwright + wx20_demo.html (standalone: ep18_fx.js and ep20_fx.js) and, for the engine mode, index.html?capture&ep=20.
 *   node wx20_test.js list                                                the case names
 *   node wx20_test.js sheet <case,case,...> <t,t,...> [out.png] [cellW]   a contact sheet (rows = cases, columns = times) in build/ep20_wx/
 *   node wx20_test.js one <case> <t> [out.png]                            one case at its native size
 *   node wx20_test.js det [case,...]                                      determinism: same call twice; t drawn first or last; a second page gives the same pixels
 *   node wx20_test.js cost [case,...]                                     milliseconds per draw of the kit calls inside each case
 *   node wx20_test.js engine <case,...> <t,t,...> [out.png] [cellW]       cases drawn through the real renderer (grade, bloom) over a real Strawberry
 *   node wx20_test.js enginedet                                           the engine cases again: two fresh pages and reverse order must hash the same
 *   node wx20_test.js scenedet <scene,...> [t,t,...]                      the REAL scenes (title, end, any): the same frames in two fresh pages and in reverse order must hash the same
 *   node wx20_test.js scenecost <scene,...>                               ms per frame (no motion blur) of the real scenes through the real renderer
 * Output: build/ep20_wx/*.png */
const fs = require('fs'), path = require('path'), http = require('http');
const { execSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const ROOT = __dirname, OUT = path.join(ROOT, 'build', 'ep20_wx');
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
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/willReadFrequently/.test(m.text())) console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/wx20_demo.html`);
  return page;
}

/* runs INSIDE index.html?capture&ep=20: replaces the title scene (in memory only) by test scenes that go through the real renderer (grade, bloom, motion blur off) with a real Strawberry in front of the kit */
function engineSetup() {
  const S = window.SN20, L = window.L20, E = EPISODES[20], H = window.H6, cur = { name: '' };
  const straw = (x, y, s, o) => Object.assign(window.A11.straw({}), { x, y, s, who: 'straw', expr: 'sour' }, o || {});
  const lemon = (x, y, s, o) => Object.assign(window.A7.lemon({}), { x, y, s, who: 'lemon', expr: 'neutral' }, o || {});
  const room = (kind) => {
    const g = ctx.createLinearGradient(0, 0, 0, 1920);
    if (kind === 'pale') { g.addColorStop(0, '#d9e2e6'); g.addColorStop(.72, '#cdd8dc'); g.addColorStop(.72, '#9aa6a4'); g.addColorStop(1, '#7b8684'); } else { g.addColorStop(0, '#b9a98c'); g.addColorStop(.72, '#a89677'); g.addColorStop(.72, '#6e5b44'); g.addColorStop(1, '#4e402f'); }
    ctx.fillStyle = g; ctx.fillRect(-200, -200, 1480, 2320);
  };
  const CASES = {
    passRoom: { draw(lt) {
      room(); const a = straw(330, 1330, 1.25, { expr: 'weak' }), b = lemon(760, 1330, 1.25); drawChar(a); drawChar(b);
      const fl = { x: 110, y: 930, ang: .42 + .05 * Math.sin(lt * 1.3) };
      L.pass(ctx, { ambient: .2, t: lt, lights: [
        { kind: 'cone', x: fl.x, y: fl.y, ang: fl.ang, spread: .55, len: 1100, color: '#f4f8ff', flicker: { seed: 3, amt: .05, rate: 1.4 } },
        { kind: 'point', x: 880, y: 860, r: 330, color: '#ffb25a', soft: .8, flicker: { seed: 9, amt: .1, rate: 2 }, power: .9 },
        { kind: 'rect', x: 540, y: 330, w: 420, h: 200, color: '#9fd8ff', soft: .6, facing: Math.PI / 2, power: .8 } ] });
    } },
    passDark: { draw(lt) {
      room(); const a = straw(330, 1330, 1.25), b = lemon(760, 1330, 1.25); drawChar(a); drawChar(b);
      L.pass(ctx, { ambient: 0, lift: .06, t: lt, lights: [{ kind: 'point', x: 540, y: 1000, r: 150, color: '#70ffd0', power: .9 }, { kind: 'cone', x: 330, y: 880, ang: 1.2, spread: .45, len: 600, color: '#f4f8ff' }] });
    } },
    snowPale: { draw(lt) {
      room('pale'); drawChar(straw(540, 1360, 1.3, { expr: 'sour' }));
      S.snow(ctx, { x0: 0, y0: 0, x1: 1080, y1: 1920, t: lt, seed: 4, density: 1.6, tone: 'light', slice: 'back' });
    } },
    snowNight: { draw(lt) {
      ctx.fillStyle = '#12204a'; ctx.fillRect(-200, -200, 1480, 2320); drawChar(straw(540, 1360, 1.3, { expr: 'sour' }));
      S.snow(ctx, { x0: 0, y0: 0, x1: 1080, y1: 1920, t: lt, seed: 4, density: 2.2, tone: 'dark', wind: 60, gusts: [[2, 1.6, .8]] });
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
    if (mode === 'one') {
      const [name, t = '1', out = 'one.png'] = args, p = await demoPage(browser, port);
      const url = await p.evaluate(([n, tt]) => one(n, tt), [name, parseFloat(t)]);
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
        console.log((ok ? 'OK   ' : 'FAIL ') + n.padEnd(16) + ' distinct frames ' + distinct + '/' + times.length + (ok ? '' : '  ' + JSON.stringify([hs, hs2, hs3, hs4])));
      }
      console.log(bad ? `DETERMINISM: ${bad} case(s) differ` : 'DETERMINISM: all cases identical (forward, backward, repeat, second page)'); process.exitCode = bad ? 1 : 0; return;
    }
    if (mode === 'cost') {
      const p = await demoPage(browser, port), names = args[0] ? args[0].split(',') : await p.evaluate(() => Object.keys(CASES));
      for (const n of names) { const ms = await p.evaluate(n => { cost(n, 1.2, 8); return cost(n, 1.2, 60); }, n); console.log(n.padEnd(16), ms.toFixed(2), 'ms/draw'); }
      return;
    }
    if (mode === 'engine') {
      const [name, times, out = 'engine.png', cellW = '360'] = args;
      const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
      page.on('pageerror', e => console.error('PAGE ERROR', e.message));
      page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
      await page.goto(`http://127.0.0.1:${port}/index.html?capture&ep=20`);
      await page.evaluate(() => window.READY);
      await page.evaluate(engineSetup);
      const url = await page.evaluate(([n, ts, w]) => window.__FXE.sheet(n.split(','), ts, w), [name, nums(times), parseFloat(cellW)]);
      fs.writeFileSync(path.join(OUT, out), Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', path.join(OUT, out)); return;
    }
    if (mode === 'enginedet') {
      /* the same frames in two fresh pages (two workers) and in reverse order must hash the same: the real renderer, a real character, every engine case */
      const open = async () => { const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); pg.on('pageerror', e => console.error('PAGE ERROR', e.message)); await pg.goto(`http://127.0.0.1:${port}/index.html?capture&ep=20`); await pg.evaluate(() => window.READY); await pg.evaluate(engineSetup); return pg; };
      const a = await open(), b = await open(), names = await a.evaluate(() => window.__FXE.names), times = [.5, 1.3, 2.1, 3.4, 5.0]; let bad = 0;
      for (const n of names) {
        const h1 = await a.evaluate(([n, ts]) => ts.map(t => window.__FXE.hash(n, t)), [n, times]);
        const h2 = await b.evaluate(([n, ts]) => ts.slice().reverse().map(t => window.__FXE.hash(n, t)).reverse(), [n, times]);
        const ok = h1.every((h, i) => h === h2[i]); if (!ok) bad++;
        console.log((ok ? 'OK   ' : 'FAIL ') + n.padEnd(10) + ' distinct ' + new Set(h1).size + '/' + times.length);
      }
      console.log(bad ? `ENGINE DETERMINISM: ${bad} differ` : 'ENGINE DETERMINISM: identical across two pages and reverse order'); process.exitCode = bad ? 1 : 0; return;
    }
    if (mode === 'scenedet' || mode === 'scenecost') {
      const scenes = (args[0] || 'title,end').split(','), times = args[1] ? nums(args[1]) : [.3, 1.2, 1.9, 2.9, 3.9, 4.5, 5.6, 6.5];
      const open = async () => { const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } }); pg.on('pageerror', e => console.error('PAGE ERROR', e.message)); await pg.goto(`http://127.0.0.1:${port}/index.html?capture&ep=20`); await pg.evaluate(() => window.READY); return pg; };
      const hashAt = () => { const c = document.getElementById('c'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let hh = 2166136261; for (let i = 0; i < d.length; i += 4) { hh ^= d[i] ^ (d[i + 1] << 8) ^ (d[i + 2] << 16); hh = Math.imul(hh, 16777619); } return (hh >>> 0).toString(16); };
      const a = await open();
      if (mode === 'scenecost') {
        for (const sc of scenes) {
          const ms = await a.evaluate(([id, ts]) => { const s = window.TIMELINE_EP20.scenes.find(x => x.id === id), use = ts.filter(t => t < s.dur - .05); for (const t of use) renderAt(s.start + t); const t0 = performance.now(); for (const t of use) renderAt(s.start + t + .013); return (performance.now() - t0) / use.length; }, [sc, times]);
          console.log(sc.padEnd(10), ms.toFixed(1), 'ms/frame (MB per the scene, rendered through the real pipeline)');
        }
        return;
      }
      const b = await open(); let bad = 0;
      for (const sc of scenes) {
        const info = await a.evaluate(id => { const s = window.TIMELINE_EP20.scenes.find(x => x.id === id); return { start: s.start, dur: s.dur }; }, sc), use = times.filter(t => t < info.dur - .05);
        const h1 = await a.evaluate(([st, ts, f]) => { const hf = eval(f); return ts.map(t => { renderAt(st + t); return hf(); }); }, [info.start, use, hashAt.toString()]);
        const h2 = await b.evaluate(([st, ts, f]) => { const hf = eval(f); return ts.slice().reverse().map(t => { renderAt(st + t); return hf(); }).reverse(); }, [info.start, use, hashAt.toString()]);
        const ok = h1.every((h, i) => h === h2[i]); if (!ok) bad++;
        console.log((ok ? 'OK   ' : 'FAIL ') + sc.padEnd(10) + ' distinct ' + new Set(h1).size + '/' + use.length + (ok ? '' : '  ' + JSON.stringify([h1, h2])));
      }
      console.log(bad ? `SCENE DETERMINISM: ${bad} differ` : 'SCENE DETERMINISM: identical across two pages and reverse order'); process.exitCode = bad ? 1 : 0; return;
    }
    console.error('unknown mode', mode);
  } finally { await browser.close(); srv.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
