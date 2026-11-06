// a22_bench.js: the test bench and determinism harness of the Episode 22 art kit (ep22_art.js: window.A22). NOT loaded by index.html.
//   node a22_bench.js <view>[&k=v...][@x,y,w,h][#name] ...   renders a view of the bench page to build/ep22_art/out/<name>.png (the crop is in canvas px)
//   node a22_bench.js det                                    the determinism check: every view drawn twice in one page and once in a second page, pixels compared; Math.random and Date are trapped while drawing
//   node a22_bench.js list | cost                            the views; the cost per call (printed)
// The page loads exactly the scripts of index.html (except main.js) and a stand-in v2 episode with no timeline lines (mouths are set by hand). Bench captions are plain canvas text (bench only, not part of any sprite).
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, OUT = path.join(ROOT, 'build', 'ep22_art', 'out');
let playwright; try { playwright = require('playwright'); } catch { playwright = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png' };

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>A22 bench</title><style>
@font-face { font-family: Bangers; src: url(/fonts/Bangers-Regular.ttf); } @font-face { font-family: Lucky; src: url(/fonts/LuckiestGuy-Regular.ttf); }
@font-face { font-family: Nunito; src: url(/fonts/Nunito.ttf); font-weight: 200 1000; } html, body { margin: 0; background: #111; } canvas { display: block; } #log { font: 12px monospace; color: #9f9; white-space: pre-wrap; }
</style></head><body><canvas id="c" width="1080" height="1920"></canvas><div id="log"></div><script>
const LOGEL = document.getElementById('log'); const log = (...a) => { LOGEL.textContent += a.join(' ') + '\\n'; };
window.addEventListener('error', e => log('ERROR', e.message, (e.filename || '').split('/').pop() + ':' + e.lineno));
window.READY = (async () => {
  const idx = await (await fetch('/index.html')).text();
  const srcs = [...idx.matchAll(/<script src="([^"]+)"><\\/script>/g)].map(m => m[1]).filter(s => s !== 'main.js');
  if (!srcs.includes('ep22_art.js')) srcs.splice(Math.max(0, srcs.indexOf('ep22.js')), 0, 'ep22_art.js');
  for (const s of srcs) await new Promise(res => { const e = document.createElement('script'); e.src = '/' + s; e.async = false; e.onload = res; e.onerror = () => { log('LOAD FAIL', s); res(); }; document.body.appendChild(e); });
  await Promise.all(['400 40px Bangers', '900 40px Nunito', '700 40px Nunito', '400 40px Lucky'].map(f => document.fonts.load(f)));
  EP = { num: 22, v2: true, textGate: false, TL: { lines: [], scenes: [], duration: 10, beats: {} }, SCENES: {}, layout: 'v2' }; TL = EP.TL; CUR = null;
  log('A22:', window.A22 ? Object.keys(A22).join(' ') : 'MISSING');
  await new Promise(res => { const e = document.createElement('script'); e.src = '/__a22_views.js'; e.onload = res; e.onerror = () => { log('LOAD FAIL views'); res(); }; document.body.appendChild(e); });
  return true;
})();
</script></body></html>`;

/* the views (run in the page) */
const VIEWS = String.raw`
const LIGHTS = { warm: { key: [-.55, -.72], keyColor: '#fff1d6', keyA: .24, rim: '#bcd6ff', rimA: .36, shadow: '#1a1430', shadowA: .3, bounce: '#ffe2b8', bounceA: .14 },
  night: { key: [-.45, -.8], keyColor: '#ffd9a8', keyA: .22, rim: '#8fb0ff', rimA: .4, shadow: '#101830', shadowA: .34, bounce: '#ffcf9a', bounceA: .12 } };
const BGS = { wall: ['#c9d3dc', '#aab7c4', '#d9dee2'], dark: ['#1b2236', '#2a3350', '#3c4766'], warm: ['#d8c9ad', '#b9a585', '#e4d8c2'] };
function cells(cols, rows, list, opt = {}) {
  ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); V2.setLight(LIGHTS[opt.light || 'warm']);
  const cw = Math.floor(W / cols), ch = Math.floor(H / rows);
  ctx.fillStyle = '#20242b'; ctx.fillRect(0, 0, W, H);
  list.forEach((c, i) => {
    if (!c) return;
    const col = i % cols, row = Math.floor(i / cols), x0 = col * cw, y0 = row * ch, B = BGS[c.bg || opt.bg || 'wall'];
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + 2, y0 + 2, cw - 4, ch - 4); ctx.clip();
    const g = ctx.createLinearGradient(0, y0, 0, y0 + ch); g.addColorStop(0, B[0]); g.addColorStop(1, B[1]); ctx.fillStyle = g; ctx.fillRect(x0, y0, cw, ch);
    const fy = y0 + ch - (c.floor ?? opt.floor ?? 50); ctx.fillStyle = B[2]; ctx.fillRect(x0, fy, cw, ch); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(x0, fy, cw, 3);
    try { c.draw(x0, y0, cw, ch, fy); } catch (e) { log('ERROR in cell', i, e.message, (e.stack || '').split('\n')[1]); }
    ctx.restore();
    if (c.cap) { ctx.save(); ctx.font = '700 22px Nunito'; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x0 + 4, y0 + 4, ctx.measureText(c.cap).width + 14, 30); ctx.fillStyle = '#fff'; ctx.fillText(c.cap, x0 + 11, y0 + 27); ctx.restore(); }
  });
}
const P = (q, k, d) => q[k] != null ? +q[k] : d;
const CAST = {
  straw: o => (window.A11 && A11.straw ? A11.straw(o) : A7.straw(o)), lemon: o => A7.lemon(o), mango: o => A7.mango(o), onion: o => A15.onion(o), tom: o => A15.tomato(o), bind: o => A15.binder(o),
  egg: o => A20.eggplant(o), pear: o => A7.pear(o), cran: o => A7.cran(o), banana: o => A7.banana(o), goji: o => A7.goji(o),
};
const dress = (n, o) => A22.santaHat(CAST[n](Object.assign({ t: o.t }, o.pre || {})), o.hat || {});
window.VIEW_LIST = ['hats', 'hatturn', 'santa', 'santaturn', 'props1', 'props2', 'props3', 'tree'];
window.drawView = (v, q) => {
  const t = P(q, 't', 1.3), sc = P(q, 's', .6);
  if (v === 'hats') {   /* the whole cast in Santa hats, front, at speaking size */
    const L = Object.keys(CAST).map(n => ({ cap: n, draw: (x0, y0, w, h, fy) => drawChar(Object.assign(dress(n, { t }), { x: x0 + w / 2, y: fy, s: n === 'bind' ? .55 : sc, t })) }));
    L.push({ cap: 'santa', draw: (x0, y0, w, h, fy) => drawChar(Object.assign(A22.santa({ t }), { x: x0 + w / 2, y: fy, s: .5, t })) });
    cells(4, 3, L);
  } else if (v === 'hatturn') {   /* the hat on four heads at 0, 35, 90 and 180 degrees */
    const yaws = [0, .6, Math.PI / 2, Math.PI], L = [];
    for (const n of ['straw', 'onion', 'tom', 'pear']) for (const y of yaws) L.push({ cap: n + ' ' + Math.round(y * 180 / Math.PI), draw: (x0, y0, w, h, fy) => drawChar(Object.assign(dress(n, { t, pre: { yaw: y } }), { x: x0 + w / 2, y: fy, s: .5, t, yaw: y })) });
    cells(4, 4, L);
  } else if (v === 'santa') {   /* Santa: every pose and expression */
    const S = (o, post) => (x0, y0, w, h, fy) => { const r = A22.santa(Object.assign({ t }, o)); Object.assign(r, { x: x0 + w / 2, y: fy, s: .52, t }, post || {}); if (o.pose === 'seated') A22.lowChair(ctx, { x: r.x, y: fy, s: r.s, part: 'back' }); drawChar(r); if (o.pose === 'seated') A22.lowChair(ctx, { x: r.x, y: fy, s: r.s, part: 'front' }); };
    cells(3, 4, [
      { cap: 'stand jolly', draw: S({}) }, { cap: 'talk (open)', draw: S({ expr: 'happy' }, { talk: .8 }) }, { cap: 'santa_stuck', draw: S({ expr: 'santa_stuck' }) },
      { cap: 'seated stuck', draw: S({ pose: 'seated', expr: 'santa_stuck' }) }, { cap: 'seated talk', draw: S({ pose: 'seated', expr: 'santa_stuck' }, { talk: .7 }) }, { cap: 'hoyer', draw: (x0, y0, w, h, fy) => { const r = A22.santa({ t, pose: 'hoyer', expr: 'santa_jolly' }); Object.assign(r, { x: x0 + w / 2, y: y0 + h * .55, s: .5, t }); drawChar(r); ctx.strokeStyle = '#7a7f8a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(r.x - 120, y0 + 60); ctx.lineTo(r.x + 120, y0 + 60); ctx.stroke(); } },
      { cap: 'sack hand', draw: S({ sack: 'hand' }) }, { cap: 'sack shoulder', draw: S({ sack: 'shoulder' }) }, { cap: 'shock', draw: S({ expr: 'shock' }) },
      { cap: 'wide s.25', draw: (x0, y0, w, h, fy) => { for (let i = 0; i < 3; i++) drawChar(Object.assign(A22.santa({ t: t + i }), { x: x0 + 70 + i * 90, y: fy, s: .25, t: t + i })); } }, { cap: 'speaking s1 crop', draw: (x0, y0, w, h, fy) => drawChar(Object.assign(A22.santa({ t }), { x: x0 + w / 2, y: fy + 260, s: 1, t, talk: .5 })) }, { cap: 'elf hat (egg)', draw: (x0, y0, w, h, fy) => drawChar(Object.assign(dress('egg', { t }), { x: x0 + w / 2, y: fy, s: .55, t })) },
    ]);
  } else if (v === 'santaturn') {
    const yaws = [0, .35, .6, 1.0, Math.PI / 2, 2.2, Math.PI, -.6, -Math.PI / 2], L = [];
    for (const y of yaws) L.push({ cap: 'yaw ' + Math.round(y * 180 / Math.PI), draw: (x0, y0, w, h, fy) => drawChar(Object.assign(A22.santa({ t, yaw: y }), { x: x0 + w / 2, y: fy, s: .5, t, yaw: y })) });
    cells(3, 3, L);
  } else if (v === 'props1') {   /* gifts in every paper, open, with a tag; the Chux flat and folded; the prints as SOFT2D would draw them */
    const papers = ['stripes', 'dots', 'trees', 'candy', 'plain'], cols = Object.values(A22.GIFT_COLORS);
    const L = papers.map((p, i) => ({ cap: p, draw: (x0, y0, w, h, fy) => A22.gift(ctx, { x: x0 + w / 2, y: fy - 20, s: 1.2, paper: p, color: cols[i][0], color2: cols[i][1], t, seed: i + 1 }) }));
    L.push({ cap: 'open .6', draw: (x0, y0, w, h, fy) => A22.gift(ctx, { x: x0 + w / 2, y: fy - 20, s: 1.1, paper: 'stripes', open: .6, t }) });
    L.push({ cap: 'tag, red bow', draw: (x0, y0, w, h, fy) => A22.gift(ctx, { x: x0 + w / 2, y: fy - 20, s: 1.3, paper: 'stripes', color: '#c62828', color2: '#f4e9d8', ribbonColor: '#e8b93a', bowColor: '#d62839', tag: 'TO: THE 3-11', t }) });
    L.push({ cap: 'chux', draw: (x0, y0, w, h, fy) => A22.chux(ctx, { x: x0 + w / 2, y: y0 + h / 2, s: .9, t }) });
    L.push({ cap: 'chux fold .6', draw: (x0, y0, w, h, fy) => A22.chux(ctx, { x: x0 + w / 2, y: y0 + h / 2, s: .9, fold: .6, crumple: .7, t }) });
    L.push({ cap: 'paperPrint trees', draw: (x0, y0, w, h, fy) => { ctx.save(); ctx.translate(x0 + 30, y0 + 50); A22.paperPrint('trees', '#2e7d4f', '#f6edd9')(ctx, w - 60, h - 100); ctx.restore(); } });
    L.push({ cap: 'chuxPrint', draw: (x0, y0, w, h, fy) => { ctx.save(); ctx.translate(x0 + 30, y0 + 50); A22.chuxPrint()(ctx, w - 60, h - 100); ctx.restore(); } });
    L.push({ cap: 'bow', draw: (x0, y0, w, h, fy) => A22.bow(ctx, { x: x0 + w / 2, y: y0 + h / 2, r: 110, color: '#d62839', t }) });
    cells(4, 3, L);
  } else if (v === 'props2') {   /* batch 2: the wrap, the search, the swap */
    const C = (cap, f) => ({ cap, draw: (x0, y0, w, h, fy) => f(x0 + w / 2, y0 + h / 2, fy, w, h) });
    cells(4, 5, [
      C('balloon puff 0', (x, y) => A22.gloveBalloon(ctx, { x, y, s: .8, puff: 0, t })), C('balloon .5', (x, y) => A22.gloveBalloon(ctx, { x, y, s: .8, puff: .5, t })), C('balloon 1 face', (x, y) => A22.gloveBalloon(ctx, { x, y: y - 30, s: .9, puff: 1, face: true, string: 120, t })), C('glove flat', (x, y) => A22.glove(ctx, { x, y, s: .9, rot: .3, t })),
      C('gloveBox (bottom)', (x, y, fy) => A22.gloveBox(ctx, { x, y: fy, s: 1.1, t })), C('tapeRoll pull .7', (x, y) => A22.tapeRoll(ctx, { x: x - 60, y, s: 1.2, pull: .7, t })), C('pudding / open', (x, y, fy) => { A22.pudding(ctx, { x: x - 55, y: fy, s: 1.3, t }); A22.pudding(ctx, { x: x + 55, y: fy, s: 1.3, open: 1, t }); }), C('candle lit', (x, y, fy) => { A22.candle(ctx, { x: x - 60, y: fy, s: 1, t }); A22.candle(ctx, { x: x + 60, y: fy, s: 1, lit: 1, t }); }),
      C('gripSocks', (x, y) => A22.gripSocks(ctx, { x, y: y - 100, s: 1, t })), C('mug hero', (x, y, fy) => A22.mug(ctx, { x: x - 20, y: fy, s: .95, hero: true, t })), C('dentures 0 / .8', (x, y) => { A22.dentures(ctx, { x, y: y - 60, s: 1.4, open: 0, t }); A22.dentures(ctx, { x, y: y + 70, s: 1.4, open: .8, t }); }), C('dentureCup / open', (x, y, fy) => { A22.dentureCup(ctx, { x: x - 60, y: fy, s: 1, t }); A22.dentureCup(ctx, { x: x + 60, y: fy, s: 1, open: 1, t }); }),
      C('nameSlip 0 .5 1', (x, y) => { A22.nameSlip(ctx, { x, y: y - 120, s: 1.6, unfold: 0, t }); A22.nameSlip(ctx, { x, y, s: 1.6, unfold: .5, t }); A22.nameSlip(ctx, { x, y: y + 130, s: 1.6, unfold: 1, name: 'STRAWBERRY', t }); }), C('santaHatProp', (x, y) => A22.santaHatProp(ctx, { x, y: y - 80, s: 1, slips: 6, t })), C('secretSantaHat shake', (x, y) => A22.secretSantaHat(ctx, { x, y: y - 80, s: 1, shake: .25, t })), C('held: mug, balloon', (x, y, fy) => drawChar(Object.assign(A7.straw({ t }), { x, y: fy, s: .62, t, hold: { r: 'fp22_mug', l: 'fp22_balloon' }, arms: { r: 'offer', l: 'up' }, p22: { puff: 1, face: true } }))),
      C('held: socks, candle', (x, y, fy) => drawChar(Object.assign(A7.mango({ t }), { x, y: fy, s: .62, t, hold: { r: 'fp22_socks', l: 'fp22_candle' }, arms: { r: 'offer', l: 'offer' } }))), C('held: slip, hatprop', (x, y, fy) => drawChar(Object.assign(A15.tomato({ t }), { x, y: fy, s: .62, t, hold: { r: 'fp22_slip', l: 'fp22_hatprop' }, arms: { r: 'offer', l: 'hold' }, p22: { unfold: 1, name: 'STRAWBERRY', slips: 8 } }))), C('held: dcup, pudding', (x, y, fy) => drawChar(Object.assign(A7.lemon({ t }), { x, y: fy, s: .62, t, hold: { r: 'fp22_dcup', l: 'fp22_pudding' }, arms: { r: 'offer', l: 'offer' } }))), C('held: tape, glove', (x, y, fy) => drawChar(Object.assign(A7.straw({ t }), { x, y: fy, s: .62, t, hold: { r: 'fp22_tape', l: 'fp22_glove' }, arms: { r: 'offer', l: 'offer' } }))),
    ]);
  } else if (v === 'props3') {   /* batch 3 */
    const C = (cap, f, bg) => ({ cap, bg, draw: (x0, y0, w, h, fy) => f(x0 + w / 2, y0 + h / 2, fy, w, h, x0, y0) });
    cells(3, 4, [
      C('hoyer lift 0', (x, y, fy) => { const r = A22.hoyer(ctx, { x: x + 110, y: fy, s: .5, lift: 0, t }); ctx.fillStyle = '#f0f'; for (const [hx, hy] of r.hooks) { ctx.beginPath(); ctx.arc(hx, hy, 4, 0, TAU); ctx.fill(); } }),
      C('hoyer lift 1 theta .1', (x, y, fy) => { const r = A22.hoyer(ctx, { x: x + 110, y: fy, s: .5, lift: 1, theta: .1, t }); ctx.fillStyle = '#f0f'; for (const [hx, hy] of r.hooks) { ctx.beginPath(); ctx.arc(hx, hy, 4, 0, TAU); ctx.fill(); } }),
      C('gaitBelt coil / strap', (x, y) => { A22.gaitBelt(ctx, { x: x - 60, y: y - 60, s: .9, t }); A22.gaitBelt(ctx, { mode: 'strap', a: [x - 140, y + 140], b: [x + 140, y + 120], sag: 30, t }); }),
      C('stringLights', (x, y, fy, w, h, x0, y0) => { const r = A22.stringLights(ctx, { a: [x0 + 20, y0 + 120], b: [x0 + w - 20, y0 + 110], sag: 70, n: 8, t, seed: 2 }); log('stringLights', r.lights.length); }, 'dark'),
      C('tinsel', (x, y, fy, w, h, x0, y0) => { const pts = []; for (let i = 0; i <= 24; i++) pts.push([x0 + 20 + i * (w - 40) / 24, y0 + 200 + Math.sin(i / 24 * Math.PI) * 120]); A22.tinsel(ctx, pts, { t, width: 16, color: '#e8c04a' }); const p2 = pts.map(([a, b]) => [a, b + 160]); A22.tinsel(ctx, p2, { t, width: 14, color: '#c8d0dc', seed: 3 }); }, 'dark'),
      C('ribbonCurl x3', (x, y) => { A22.ribbonCurl(ctx, { x: x - 60, y: y - 120, s: 1.2, color: '#e8b93a', t }); A22.ribbonCurl(ctx, { x, y: y - 120, s: 1.2, color: '#d62839', t, seed: 2 }); A22.ribbonCurl(ctx, { x: x + 60, y: y - 120, s: 1.2, color: '#2f6fd0', t, seed: 3 }); }),
      C('wreath', (x, y) => A22.wreath(ctx, { x, y, s: 1.4, t })),
      C('stockings', (x, y) => { A22.stocking(ctx, { x: x - 80, y: y - 150, s: .9, name: 'Brenda', t }); A22.stocking(ctx, { x: x + 80, y: y - 150, s: .9, name: 'Strawberry', color: '#2e7d4f', dir: -1, t }); }),
      C('sweater tom 0', (x, y, fy) => drawChar(Object.assign(A22.sweater(A15.tomato({ t })), { x, y: fy, s: .62, t }))),
      C('sweater tom .6', (x, y, fy) => drawChar(Object.assign(A22.sweater(A15.tomato({ t, yaw: .6 })), { x, y: fy, s: .62, t, yaw: .6 }))),
      C('sweater tom PI/2', (x, y, fy) => drawChar(Object.assign(A22.sweater(A15.tomato({ t, yaw: Math.PI / 2 })), { x, y: fy, s: .62, t, yaw: Math.PI / 2 }))),
      C('sweater + hat', (x, y, fy) => drawChar(Object.assign(A22.santaHat(A22.sweater(A15.tomato({ t }))), { x, y: fy, s: .62, t }))),
    ]);
  } else if (v === 'tree') {
    cells(2, 2, [
      { cap: 'tree lit', bg: 'dark', draw: (x0, y0, w, h, fy) => { const R = A22.tree(ctx, { x: x0 + w / 2, y: fy, s: .78, t, gifts: 3 }); log('tree lights', R.lights.length, 'star', R.star.map(Math.round).join(',')); } },
      { cap: 'tree t+0.7', bg: 'dark', draw: (x0, y0, w, h, fy) => A22.tree(ctx, { x: x0 + w / 2, y: fy, s: .78, t: t + .7 }) },
      { cap: 'small, day', draw: (x0, y0, w, h, fy) => A22.tree(ctx, { x: x0 + w / 2, y: fy, s: .45, t, glow: 0 }) },
      { cap: 'twinkle 0..6 s (24 bulbs)', draw: (x0, y0, w, h, fy) => { ctx.fillStyle = '#111'; ctx.fillRect(x0 + 10, y0 + 40, w - 20, h - 60); for (let b = 0; b < 24; b++) { const ph = FX18.rnd(120, b); ctx.strokeStyle = A22.LIGHT_COLORS[b % 7]; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const tt = i / 200 * 6, v2 = A22.twinkle(tt, ph); const X = x0 + 20 + i / 200 * (w - 40), Y = y0 + 60 + b * 30 + (1 - v2) * 26; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke(); } } },
    ]);
  } else if (v === 'cost') {
    cells(1, 1, [{ draw: () => {} }]);
    const flush = () => mainCtx.getImageData(0, 0, 1, 1);
    const time = (name, f, n = 40) => { f(0); flush(); const t0 = performance.now(); for (let i = 0; i < n; i++) { f(i); flush(); } log('COST', name, ((performance.now() - t0) / n).toFixed(2), 'ms'); };
    time('A7.straw s1 (reference)', i => drawChar(Object.assign(A7.straw({ t: i * .03 }), { x: 500, y: 1300, s: 1 })));
    time('santaHat straw s1', i => drawChar(Object.assign(A22.santaHat(A7.straw({ t: i * .03 })), { x: 500, y: 1300, s: 1 })));
    time('santa s1', i => drawChar(Object.assign(A22.santa({ t: i * .03 }), { x: 500, y: 1300, s: 1 })));
    time('santa s1 yaw .6', i => drawChar(Object.assign(A22.santa({ t: i * .03, yaw: .6 }), { x: 500, y: 1300, s: 1 })));
    time('santa seated', i => drawChar(Object.assign(A22.santa({ t: i * .03, pose: 'seated' }), { x: 500, y: 1300, s: 1 })));
    time('tree s1 lights', i => A22.tree(ctx, { x: 540, y: 1500, s: 1, t: i * .03 }));
    time('gift s1.5 tag', i => A22.gift(ctx, { x: 540, y: 900, s: 1.5, tag: 'TO: THE 3-11', t: i * .03 }));
    time('chux s1', i => A22.chux(ctx, { x: 540, y: 900, s: 1, t: i * .03 }));
    time('paperPrint 400x300', i => A22.paperPrint('candy')(ctx, 400, 300));
  } else if (v === 'prof') {
    cells(1, 1, [{ draw: () => {} }]);
    const flush = () => mainCtx.getImageData(0, 0, 1, 1);
    const time = (name, f, n = 60) => { f(0); flush(); const t0 = performance.now(); for (let i = 0; i < n; i++) { f(i); flush(); } log('COST', name, ((performance.now() - t0) / n).toFixed(3), 'ms'); };
    const fills = i => { for (let j = 0; j < 20000; j++) { ctx.fillStyle = j % 2 ? '#ff0000' : '#00ff00'; } };
    time('20k fillStyle sets', fills, 10);
    time('straw plain A', i => drawChar(Object.assign(A7.straw({ t: 1 }), { x: 500, y: 1300, s: 1 })));
    time('straw plain B', i => drawChar(Object.assign(A7.straw({ t: 1 }), { x: 500, y: 1300, s: 1 })));
    time('santa front', i => drawChar(Object.assign(A22.santa({ t: 1 }), { x: 500, y: 1300, s: 1 })));
    time('santa front again', i => drawChar(Object.assign(A22.santa({ t: 1 }), { x: 500, y: 1300, s: 1 })));
    time('straw plain C (after santa)', i => drawChar(Object.assign(A7.straw({ t: 1 }), { x: 500, y: 1300, s: 1 })));
    time('20k fillStyle sets after', fills, 10);
    time('flush overhead (empty)', i => {});
    for (const nm of ['fp22_santacoat', 'fp22_beard', 'fp22_santahat']) time('acc ' + nm, i => { const o = A22.santa({ t: 1 }); ctx.save(); ctx.translate(500, 900); EXT.acc[nm](o, KINDS.melon, 1, 'mid'); ctx.restore(); });
    time('santa accessories only', i => { const o = A22.santa({ t: 1 }); ctx.save(); ctx.translate(500, 900); for (const a of o.acc) EXT.acc[a] && EXT.acc[a](o, KINDS.melon, 1, 'mid'); ctx.restore(); });
  } else log('unknown view', v);
};
`;

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/__a22_bench.html') { res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }); return res.end(PAGE); }
      if (rel === '/__a22_views.js') { res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }); return res.end(VIEWS); }
      const p = path.join(ROOT, rel);
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/__a22_bench.html`);
  await page.evaluate(() => window.READY);
  return page;
}
const parse = a => { let spec = a, name = null, crop = null; const h = spec.indexOf('#'); if (h >= 0) { name = spec.slice(h + 1); spec = spec.slice(0, h); } const at = spec.indexOf('@'); if (at >= 0) { crop = spec.slice(at + 1).split(',').map(Number); spec = spec.slice(0, at); } const view = spec.split('&')[0], q = Object.fromEntries(spec.split('&').slice(1).map(kv => kv.split('='))); return { spec, view, q, name, crop }; };
(async () => {
  const args = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(), port = srv.address().port, browser = await playwright.chromium.launch({ args: ['--disable-gpu', '--disable-web-security'] });
  try {
    const page = await openPage(browser, port);
    const log0 = await page.evaluate(() => document.getElementById('log').textContent);
    if (process.env.LOG || /ERROR|FAIL|MISSING/.test(log0)) console.error('--- page log ---\n' + log0);
    if (args[0] === 'list') { console.log(await page.evaluate(() => window.VIEW_LIST.join(' '))); return; }
    if (args[0] === 'det') {
      const views = args.slice(1).length ? args.slice(1) : await page.evaluate(() => window.VIEW_LIST);
      const page2 = await openPage(browser, port);
      const shot = (pg, a) => pg.evaluate(({ view, q }) => {
        const R = Math.random, D = Date.now, PN = performance.now.bind(performance); let bad = [];
        Math.random = () => { bad.push('Math.random'); return R(); }; Date.now = () => { bad.push('Date.now'); return D(); };
        const t0 = PN(); try { window.drawView(view, q); } finally { Math.random = R; Date.now = D; }
        const ms = PN() - t0, d = mainCtx.getImageData(0, 0, W, H).data; let h1 = 0, h2 = 0; for (let i = 0; i < d.length; i += 7) { h1 = (h1 * 31 + d[i]) >>> 0; h2 = (h2 + d[i] * (i % 251)) >>> 0; }
        return { hash: h1.toString(16) + ':' + h2.toString(16), bad: [...new Set(bad)], ms: Math.round(ms) };
      }, a);
      let ok = true;
      for (const v of views) { const a = parse(v), r1 = await shot(page, a), r2 = await shot(page, a), r3 = await shot(page2, a); const same = r1.hash === r2.hash && r1.hash === r3.hash; ok = ok && same && !r1.bad.length; console.log(`${same && !r1.bad.length ? 'SAME' : 'DIFF'}  ${v.padEnd(28)} ${r1.hash} ${r2.hash} ${r3.hash}  ${r1.ms} ms${r1.bad.length ? '  CALLS ' + r1.bad.join(',') : ''}`); }
      console.log(ok ? 'determinism: OK (identical pixels in one page and across pages; no Math.random / Date while drawing)' : 'determinism: FAILED');
      return;
    }
    for (const a of args) {
      const P = parse(a);
      await page.evaluate(({ view, q }) => window.drawView(view, q), P);
      const log = await page.evaluate(() => { const t = document.getElementById('log').textContent; document.getElementById('log').textContent = ''; return t; });
      if (process.env.LOG || /ERROR|unknown|COST|tree/.test(log)) console.error(log);
      const data = await page.evaluate(c => { const cv = document.getElementById('c'); if (!c) return cv.toDataURL('image/png'); const t = document.createElement('canvas'); t.width = c[2]; t.height = c[3]; t.getContext('2d').drawImage(cv, c[0], c[1], c[2], c[3], 0, 0, c[2], c[3]); return t.toDataURL('image/png'); }, P.crop);
      const file = path.join(OUT, (P.name || P.spec.replace(/[^\w.=-]+/g, '_')) + '.png');
      fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64')); console.log('wrote', path.relative(ROOT, file));
    }
  } finally { await browser.close(); srv.close(); }
})();
