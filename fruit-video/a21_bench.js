// a21_bench.js: the test bench and determinism harness of the Episode 21 kits (ep21_art.js: window.A21, ep21_hud.js: window.H21). NOT loaded by index.html.
//   node a21_bench.js <view>[&k=v...][@x,y,w,h][#name] ...   renders a view of the bench page to build/ep21_art/out/<name>.png (the crop is in canvas px)
//   node a21_bench.js det                                    the determinism check: every view drawn twice in one page and once in a second page, pixels compared; Math.random and Date are trapped while drawing
//   node a21_bench.js list                                   the views (det runs them all); also 'cost' (the cost per call, printed), 'prof', 'splitreg' (the split helper's audit trimming with REG on)
// The page loads exactly the scripts of index.html (except main.js) and a stand-in v2 episode with no timeline lines (mouths are set by hand). Bench captions are plain canvas text (bench only, not part of any sprite).
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, OUT = path.join(ROOT, 'build', 'ep21_art', 'out');
let playwright; try { playwright = require('playwright'); } catch { playwright = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.json': 'application/json', '.png': 'image/png' };

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>A21 bench</title><style>
@font-face { font-family: Bangers; src: url(/fonts/Bangers-Regular.ttf); } @font-face { font-family: Lucky; src: url(/fonts/LuckiestGuy-Regular.ttf); }
@font-face { font-family: Nunito; src: url(/fonts/Nunito.ttf); font-weight: 200 1000; } html, body { margin: 0; background: #111; } canvas { display: block; } #log { font: 12px monospace; color: #9f9; white-space: pre-wrap; }
</style></head><body><canvas id="c" width="1080" height="1920"></canvas><div id="log"></div><script>
const LOGEL = document.getElementById('log'); const log = (...a) => { LOGEL.textContent += a.join(' ') + '\\n'; };
window.addEventListener('error', e => log('ERROR', e.message, (e.filename || '').split('/').pop() + ':' + e.lineno));
window.READY = (async () => {
  const idx = await (await fetch('/index.html')).text();
  const srcs = [...idx.matchAll(/<script src="([^"]+)"><\\/script>/g)].map(m => m[1]).filter(s => s !== 'main.js');
  for (const k of ['ep21_hud.js', 'ep21_art.js']) if (!srcs.includes(k)) srcs.splice(Math.max(0, srcs.indexOf('ep21.js')), 0, k);
  for (const s of srcs) await new Promise(res => { const e = document.createElement('script'); e.src = '/' + s; e.async = false; e.onload = res; e.onerror = () => { log('LOAD FAIL', s); res(); }; document.body.appendChild(e); });
  await Promise.all(['400 40px Bangers', '900 40px Nunito', '700 40px Nunito', '400 40px Lucky'].map(f => document.fonts.load(f)));
  EP = { num: 21, v2: true, textGate: false, TL: { lines: [], scenes: [], duration: 10, beats: {} }, SCENES: {}, layout: 'v2' }; TL = EP.TL; CUR = null;
  log('A21:', window.A21 ? Object.keys(A21).join(' ') : 'MISSING', '| H21:', window.H21 ? Object.keys(H21).join(' ') : 'MISSING');
  await new Promise(res => { const e = document.createElement('script'); e.src = '/__a21_views.js'; e.onload = res; e.onerror = () => { log('LOAD FAIL views'); res(); }; document.body.appendChild(e); });
  return true;
})();
</script></body></html>`;

/* the views (run in the page) */
const VIEWS = String.raw`
const LIGHTS = { warm: { key: [-.55, -.72], keyColor: '#fff1d6', keyA: .24, rim: '#bcd6ff', rimA: .36, shadow: '#1a1430', shadowA: .3, bounce: '#ffe2b8', bounceA: .14 },
  office: { key: [-.4, -.85], keyColor: '#eef6ff', keyA: .26, rim: '#cfe2ff', rimA: .3, shadow: '#141a30', shadowA: .3, bounce: '#e6eeff', bounceA: .12 } };
const BGS = { wall: ['#c9d3dc', '#aab7c4', '#d9dee2'], dusk: ['#3a4a72', '#56689a', '#8a96c0'], dark: ['#1b2236', '#2a3350', '#3c4766'], warm: ['#d8c9ad', '#b9a585', '#e4d8c2'] };
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
    try { c.draw(x0, y0, cw, ch, fy); } catch (e) { log('ERROR in cell', i, e.message, e.stack.split('\n')[1]); }
    ctx.restore();
    if (c.cap) { ctx.save(); ctx.font = '700 22px Nunito'; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x0 + 4, y0 + 4, ctx.measureText(c.cap).width + 14, 30); ctx.fillStyle = '#fff'; ctx.fillText(c.cap, x0 + 11, y0 + 27); ctx.restore(); }
  });
}
const P = (q, k, d) => q[k] != null ? +q[k] : d;
const who = n => n === 'radish' ? A21.radish : A21.kale;
const ch = (n, o) => drawChar(Object.assign(who(n)(Object.assign({ t: 1.3 }, o.pre || {})), o.post || {}));
window.drawView = (v, q) => {
  const t = P(q, 't', 1.3);
  if (v === 'turn') {   /* both surveyors at 0, 35, 70, 90, 145, 180 degrees and -35 */
    const yaws = [0, .6, 1.2, Math.PI / 2, 2.5, Math.PI, -.6, -Math.PI / 2];
    const L = [];
    for (const n of ['kale', 'radish']) for (const y of yaws) L.push({ cap: n + ' ' + Math.round(y * 180 / Math.PI), draw: (x0, y0, w, h, fy) => ch(n, { pre: { t, yaw: y, scanner: P(q, 'scanner', 0) }, post: { x: x0 + w / 2, y: fy, s: P(q, 's', .62) } }) });
    cells(4, 4, L);
  } else if (v === 'expr') {   /* every expression at speaking size, plus the poses */
    const E = [['kale', 'kale_neutral'], ['kale', 'kale_note'], ['kale', 'kale_raise'], ['kale', 'kale_satisfied'], ['radish', 'radish_flat'], ['radish', 'radish_note'], ['radish', 'radish_impressed'], ['radish', 'radish_buried'], ['kale', 'kale_neutral', 'write'], ['kale', 'kale_neutral', 'rest'], ['radish', 'radish_flat', 'tap'], ['radish', 'radish_flat', 'clip']];
    cells(4, 3, E.map(([n, e, pose]) => ({ cap: e + (pose ? ' ' + pose : ''), draw: (x0, y0, w, h, fy) => ch(n, { pre: { t, expr: e, pose, cbTicks: 2.6, scanner: e === 'radish_flat' && !pose ? 1 : 0, cbPen: pose ? undefined : true }, post: { x: x0 + w / 2, y: e === 'radish_buried' ? fy - 60 : fy, s: P(q, 's', .72) } }) })));
  } else if (v === 'speak') {   /* the speaking size: a close two-shot (face about 300 px), mouths open */
    cells(1, 1, [{ draw: (x0, y0, w, h, fy) => {
      const s = P(q, 's', 1.5);
      ch('kale', { pre: { t, expr: q.ek || 'kale_neutral', yaw: P(q, 'yk', .35), raiseK: P(q, 'rk', 0) }, post: { x: 300, y: 1260, s, who: null, talk: P(q, 'talk', .5) } });
      ch('radish', { pre: { t, expr: q.er || 'radish_flat', yaw: P(q, 'yr', -.35), scanner: P(q, 'scanner', 1) }, post: { x: 800, y: 1260, s, who: null, talk: P(q, 'talk', .5) * .6 } });
    } }], { floor: 660 });
  } else if (v === 'wide') {   /* a wide: the pair at about 220 px, with a Strawberry for scale */
    cells(1, 1, [{ draw: (x0, y0, w, h, fy) => {
      const s = P(q, 's', .5);
      drawChar(Object.assign(A7.straw({ t }), { x: 260, y: 1200, s: .44, expr: 'neutral' }));
      ch('kale', { pre: { t, yaw: .4 }, post: { x: 520, y: 1200, s } });
      ch('radish', { pre: { t, yaw: -.4, scanner: 1 }, post: { x: 780, y: 1200, s } });
    } }], { floor: 720, bg: 'warm' });
  } else if (v === 'clip') {   /* the clipboard set piece, large */
    cells(1, 1, [{ draw: (x0, y0, w, h, fy) => {
      const R = A21.clipboard(ctx, { x: 540, y: 900, w: P(q, 'w', 700), rot: P(q, 'rot', -.04), items: ['FRONT DOORS', 'STAFFING', 'LABELS', 'SHIFT HAPPENS'], ticks: P(q, 'ticks', 2.5), fail: q.fail != null ? +q.fail : undefined, t });
      ctx.strokeStyle = '#f0f'; ctx.lineWidth = 3; for (const r of R.rows) { ctx.strokeRect(r.box[0], r.box[1], r.box[2] - r.box[0], r.box[3] - r.box[1]); ctx.beginPath(); ctx.arc(r.text[0], r.text[1], 6, 0, 7); ctx.stroke(); }
    } }], { floor: 0, bg: 'dark' });
  } else if (window.drawView2) window.drawView2(v, q, t);
  else log('unknown view', v);
};
window.VIEW_LIST = ['turn', 'expr', 'speak', 'wide', 'clip'];
`;
/* the HUD, split-screen, props, cost and audit-trim views (also run in the page) */
const VIEWS2 = String.raw`
/* extra bench views for a21_bench.js (HUD, split screen, props); loaded by the bench page after the main views */
window.drawView2 = (v, q, t) => {
  const P2 = (k, d) => q[k] != null ? +q[k] : d;
  if (v === 'hud') {   /* reticle at lock 0, .35, .7, 1 (+ the pulse), a tracked box; the scan; the frame in each mode; the stamp's phases */
    cells(2, 3, [
      { cap: 'reticle lock 0 / .5', bg: 'dark', draw: (x0, y0, w, h) => { V2.setLight(LIGHTS.office); H21.reticle(ctx, { x: x0 + 140, y: y0 + 330, w: 110, h: 150, t, lock: 0, label: 'CLOSET' }); H21.reticle(ctx, { x: x0 + 400, y: y0 + 330, w: 110, h: 150, t, lock: .5, label: 'CLOSET' }); } },
      { cap: 'reticle lock .8 / 1 red', bg: 'wall', draw: (x0, y0, w, h) => { H21.reticle(ctx, { x: x0 + 140, y: y0 + 330, w: 110, h: 150, t, lock: .8, label: 'CLOSET', color: H21.RED }); H21.reticle(ctx, { x: x0 + 400, y: y0 + 330, w: 110, h: 150, t, lock: 1, label: 'OCCUPIED', color: H21.RED, sub: 'SINCE 2019' }); } },
      { cap: 'scan down (screen)', bg: 'dark', draw: (x0, y0, w, h) => { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); H21.scan(ctx, { t: P2('scanT', .5), t0: 0, dur: 1.2 }); ctx.restore(); } },
      { cap: 'stamp: descent, impact, rest', bg: 'warm', draw: (x0, y0, w, h) => { H21.stamp(ctx, { x: x0 + 150, y: y0 + 200, t: -.06, t0: 0, s: .7, text: 'SURVEYED' }); H21.stamp(ctx, { x: x0 + 390, y: y0 + 200, t: .04, t0: 0, s: .7, text: 'SURVEYED' }); H21.stamp(ctx, { x: x0 + 270, y: y0 + 450, t: 1, t0: 0, s: .9, text: 'CORRECTED', rot: .1 }); } },
      { cap: 'hudFrame scan (whole frame below)', bg: 'dark', draw: () => {} },
      { cap: 'track', bg: 'wall', draw: (x0, y0, w, h) => { const bx = tt => [x0 + 200 + 120 * Math.sin(tt * 2), y0 + 250, x0 + 300 + 120 * Math.sin(tt * 2), y0 + 400]; const b = bx(t); ctx.strokeStyle = '#888'; ctx.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); H21.reticle(ctx, Object.assign(H21.track({ id: 'x', boxAt: bx }, t), { t, lock: 1, label: 'TRACK' })); } },
    ], { light: 'office' });
    if (q.frame) H21.hudFrame(ctx, { t, mode: q.frame, count: q.count != null ? +q.count : undefined });
  } else if (v === 'frame') {
    cells(1, 1, [{ bg: q.bg || 'dark', draw: () => {} }], { light: 'office', floor: 0 });
    H21.hudFrame(ctx, { t, mode: q.mode || 'scan', count: q.count != null ? +q.count : undefined, chyron: q.chyron !== '0' });
    if (q.scan) H21.scan(ctx, { t: +q.scan, t0: 0, dur: 1.2, dir: q.dir || 'down' });
  } else if (v === 'split') {   /* the split screen: the same pair on both sides, through two cameras; a tilted divider at x */
    ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); V2.setLight(LIGHTS.warm); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const scene = (calm) => (c, B) => {
      H21.halfCam(c, B, 540, 1000, P2('z', .95));
      const g = c.createLinearGradient(0, 300, 0, 1500); g.addColorStop(0, calm ? '#cdd8e2' : '#e6b48c'); g.addColorStop(1, calm ? '#9fb0c2' : '#b0704c'); c.fillStyle = g; c.fillRect(-400, -200, 1900, 2300);
      c.fillStyle = calm ? '#dfe5ea' : '#d9b896'; c.fillRect(-400, 1260, 1900, 900);
      drawChar(Object.assign(A21.kale({ t, expr: calm ? 'kale_note' : 'kale_raise', pose: 'write' }), { x: 380, y: 1260, s: .62 }));
      drawChar(Object.assign(A7.straw({ t }), { x: 700, y: 1260, s: .62, expr: calm ? 'neutral' : 'panic' }));
    };
    H21.split(ctx, { t, x: P2('x', 540), angle: P2('ang', .06), gap: P2('gap', 14), labelL: 'WITH THE STATE', labelR: 'A NORMAL NIGHT' }, scene(true), scene(false));
  } else if (v === 'cost') {   /* the cost per call (ms, headless, mean of 40 after one warm-up) */
    cells(1, 1, [{ bg: 'dark', draw: () => {} }], { light: 'office' });
    const N = 40, res = [];
    const flush = () => mainCtx.getImageData(0, 0, 1, 1); const time = (name, fn) => { fn(0); flush(); const t0 = performance.now(); for (let i = 1; i <= N; i++) { ctx.save(); fn(i); ctx.restore(); flush(); } res.push(name.padEnd(34) + ((performance.now() - t0) / N).toFixed(2) + ' ms'); };
    time('H21.reticle (lock anim + tag)', i => H21.reticle(ctx, { x: 540, y: 900, w: 200, h: 300, t: i * .02, t0: 0, label: 'CLOSET' }));
    time('H21.track (boxAt, 5 samples)', i => H21.track({ id: 'a', boxAt: tt => [100 + tt * 10, 200, 300, 400] }, i * .03));
    time('H21.scan', i => H21.scan(ctx, { t: .2 + i * .02, t0: 0 }));
    time('H21.hudFrame', i => H21.hudFrame(ctx, { t: i * .03, mode: 'deficiency', count: 1 }));
    time('H21.stamp (landed)', i => H21.stamp(ctx, { x: 540, y: 900, t: 1 + i * .01, t0: 0, text: 'SURVEYED' }));
    time('H21.split (empty halves, labels)', i => H21.split(ctx, { x: 540, angle: .05, labelL: 'WITH THE STATE', labelR: 'A NORMAL NIGHT' }, () => {}, () => {}));
    time('A21.kale s1', i => drawChar(Object.assign(A21.kale({ t: i * .03 }), { x: 300, y: 1300, s: 1 })));
    time('A21.kale s1 yaw .6', i => drawChar(Object.assign(A21.kale({ t: i * .03, yaw: .6 }), { x: 300, y: 1300, s: 1 })));
    time('A21.radish s1 scanner', i => drawChar(Object.assign(A21.radish({ t: i * .03, scanner: 1 }), { x: 700, y: 1300, s: 1 })));
    time('A21.radish s1 yaw -.6', i => drawChar(Object.assign(A21.radish({ t: i * .03, yaw: -.6 }), { x: 700, y: 1300, s: 1 })));
    time('A21.clipboard w600', i => A21.clipboard(ctx, { x: 540, y: 900, w: 600, ticks: 2.5, t: i * .03 }));
    time('A7.straw s1 (reference)', i => drawChar(Object.assign(A7.straw({ t: i * .03 }), { x: 500, y: 1300, s: 1 })));
    if (window.drawCost3) drawCost3(time);
    log('COST\n' + res.join('\n'));
  } else log('unknown view', v);
};
window.VIEW_LIST.push('hud', 'frame', 'split');
window.drawCost3 = time => {
  time('A21.label', i => A21.label(ctx, { x: 300, y: 300, t: i * .03 }));
  time('A21.padlock', i => A21.padlock(ctx, { x: 300, y: 300, t: i * .03 }));
  time('A21.sanitizer', i => A21.sanitizer(ctx, { x: 300, y: 300, t: i * .03, pump: .5 }));
  time('A21.fridgeThermo', i => A21.fridgeThermo(ctx, { x: 300, y: 300, t: i * .03 }));
  time('A21.crashCart', i => A21.crashCart(ctx, { x: 300, y: 900, t: i * .03, open: .5 }));
  time('A21.binder (cover, text)', i => A21.binder(ctx, { x: 300, y: 300, w: 90, h: 120, t: i * .03, spine: 'POLICY 7.4' }));
  time('A21.binder x40 (tumbling)', i => { for (let j = 0; j < 40; j++) A21.binder(ctx, { x: 100 + j * 20, y: 300, w: 60, h: 80, rot: j * .4 + i * .01, seed: j }); });
  time('A21.policyCloset closed', i => A21.policyCloset(ctx, { x: 540, y: 1300, t: i * .03, strain: .5 }));
  time('A21.policyCloset open (all binders)', i => A21.policyCloset(ctx, { x: 540, y: 1300, t: i * .03, open: 1 }));
};
const _dv2 = window.drawView2;
window.drawView2 = (v, q, t) => {
  if (v !== 'prof') return _dv2(v, q, t);
  cells(1, 1, [{ bg: 'dark', draw: () => {} }], { light: 'office' });
  const N = 20, res = [];
  const time = (name, fn) => { fn(0); const t0 = performance.now(); for (let i = 1; i <= N; i++) { ctx.save(); fn(i); ctx.restore(); } res.push(name.padEnd(40) + ((performance.now() - t0) / N).toFixed(2) + ' ms'); };
  const K = (extra) => i => drawChar(Object.assign(A21.kale(Object.assign({ t: i * .03, yaw: .6 }, extra)), { x: 300, y: 1300, s: 1 }));
  time('kale yaw all', K({}));
  time('kale yaw no frill', K({ frill: false }));
  time('kale yaw no glasses', K({ glasses: false }));
  time('kale yaw no badge', K({ badge21: false }));
  time('kale yaw no suit', K({ suit21: false }));
  time('kale yaw acc none', i => drawChar(Object.assign(A21.kale({ t: i * .03, yaw: .6 }), { x: 300, y: 1300, s: 1, acc: [] })));
  time('kale yaw pose rest', K({ pose: 'rest' }));
  time('kale front pose rest', i => drawChar(Object.assign(A21.kale({ t: i * .03, pose: 'rest' }), { x: 300, y: 1300, s: 1 })));
  time('clipboard no text (textMin 999)', i => A21.clipboard(ctx, { x: 540, y: 900, w: 600, ticks: 2.5, textMin: 999 }));
  time('clipboard text', i => A21.clipboard(ctx, { x: 540, y: 900, w: 600, ticks: 2.5 }));
  time('UI.label 40px plain', i => UI.label('FRONT DOORS', 300, 300, { size: 40 }));
  time('UI.label 40px maxW', i => UI.label('FRONT DOORS', 300, 300, { size: 40, maxW: 380 }));
  time('UI.label 40px align left maxW', i => UI.label('FRONT DOORS', 300, 300, { size: 40, maxW: 380, align: 'left' }));
  time('reticle no label', i => H21.reticle(ctx, { x: 540, y: 900, w: 200, h: 300, t: i * .02, t0: 0 }));
  time('reticle label', i => H21.reticle(ctx, { x: 540, y: 900, w: 200, h: 300, t: i * .02, t0: 0, label: 'CLOSET' }));
  log('COST\n' + res.join('\n'));
};
const _dv3 = window.drawView2;
window.drawView2 = (v, q, t) => {
  if (v === 'props') {
    cells(3, 4, [
      { cap: 'label: slap / peel .3 / .8', bg: 'wall', draw: (x0, y0) => { A21.label(ctx, { x: x0 + 180, y: y0 + 140, t: .05, t0: 0, rot: -.04 }); A21.label(ctx, { x: x0 + 180, y: y0 + 280, t, peel: .3, text: 'DATED 11/6 3:05P' }); A21.label(ctx, { x: x0 + 180, y: y0 + 420, t, peel: .8 }); } },
      { cap: 'padlock shut / open', bg: 'wall', draw: (x0, y0) => { A21.padlock(ctx, { x: x0 + 110, y: y0 + 300, s: 1.4, t }); A21.padlock(ctx, { x: x0 + 260, y: y0 + 300, s: 1.4, t, open: 1, color: 'steel' }); } },
      { cap: 'sanitizer pump 0 / .8', bg: 'wall', draw: (x0, y0) => { A21.sanitizer(ctx, { x: x0 + 100, y: y0 + 280, s: .9, t }); A21.sanitizer(ctx, { x: x0 + 260, y: y0 + 280, s: .9, t, pump: .8, level: .3 }); } },
      { cap: 'fridgeThermo 38 / 46', bg: 'wall', draw: (x0, y0) => { A21.fridgeThermo(ctx, { x: x0 + 100, y: y0 + 300, s: 1, deg: 38, t }); A21.fridgeThermo(ctx, { x: x0 + 270, y: y0 + 300, s: .8, deg: 46, t }); } },
      { cap: 'crashCart sealed', bg: 'wall', draw: (x0, y0, w, h, fy) => A21.crashCart(ctx, { x: x0 + w / 2, y: fy, s: .72, t }) },
      { cap: 'crashCart open', bg: 'wall', draw: (x0, y0, w, h, fy) => A21.crashCart(ctx, { x: x0 + w / 2, y: fy, s: .72, t, open: 1, restock: .7 }) },
      { cap: 'binders: cover, spine, tumbling', bg: 'wall', draw: (x0, y0) => { A21.binder(ctx, { x: x0 + 100, y: y0 + 200, w: 120, h: 160, spine: 'POLICY 7.4', seed: 0 }); A21.binder(ctx, { x: x0 + 260, y: y0 + 200, w: 46, h: 160, spine: '7.4', seed: 1 }); for (let i = 0; i < 4; i++) A21.binder(ctx, { x: x0 + 70 + i * 75, y: y0 + 420, w: 70, h: 92, rot: -.6 + i * .5, seed: i + 2, spine: 'BREAKS' }); } },
      { cap: 'closet: strain', bg: 'wall', draw: (x0, y0, w, h, fy) => A21.policyCloset(ctx, { x: x0 + w / 2, y: fy, s: .7, t, strain: 1 }) },
      { cap: 'closet: open .7, packed .6', bg: 'wall', draw: (x0, y0, w, h, fy) => { const R = A21.policyCloset(ctx, { x: x0 + w / 2, y: fy, s: .7, t, open: .7, packed: .6 }); } },
      { cap: 'agency strawberries', bg: 'wall', draw: (x0, y0, w, h, fy) => { for (let i = 0; i < 3; i++) drawChar(Object.assign(A21.agencyBadge(A11.straw({ t: t + i })), { x: x0 + 70 + i * 110, y: fy, s: .38 + i * .08, yaw: (i - 1) * .5, expr: 'neutral' })); } },
      { cap: 'closet open 1, full', bg: 'wall', draw: (x0, y0, w, h, fy) => A21.policyCloset(ctx, { x: x0 + w / 2, y: fy, s: .7, t, open: 1 }) },
      { cap: 'agency close', bg: 'wall', draw: (x0, y0, w, h, fy) => drawChar(Object.assign(A21.agencyBadge(A11.straw({ t })), { x: x0 + w / 2, y: fy + 40, s: 1.1, expr: 'neutral' })) },
    ], { light: 'office', floor: 60 });
  } else return _dv3(v, q, t);
};
window.VIEW_LIST.push('props');
const _dv4 = window.drawView2;
window.drawView2 = (v, q, t) => {
  if (v !== 'splitreg') return _dv4(v, q, t);
  ctx = mainCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); V2.setLight(LIGHTS.warm); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  REG.on = true; REG.items = []; REG.errors = []; REG.order = 0;
  const half = x => (c, B) => { H21.halfCam(c, B, 540, 1000, 1); c.fillStyle = '#9fb0c2'; c.fillRect(-400, -200, 1900, 2300); drawChar(Object.assign(A7.straw({ t }), { x, y: 1260, s: .7, id: 'straw' + x })); };
  H21.split(ctx, { t, x: 540, angle: .06, labelL: 'LEFT', labelR: 'RIGHT' }, half(+q.lx || 540), half(+q.rx || 300));
  log('REG items', REG.items.length, REG.items.filter(i => i.type === 'face').map(i => i.id + ' ' + i.box.map(Math.round).join(',')).join(' | '));
  log('REG errors: ' + JSON.stringify(REG.errors));
  REG.on = false;
};
`;

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel === '/__a21_bench.html') { res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }); return res.end(PAGE); }
      if (rel === '/__a21_views.js') { res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }); return res.end(VIEWS + '\n' + VIEWS2); }
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
  await page.goto(`http://127.0.0.1:${port}/__a21_bench.html`);
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
      if (process.env.LOG || /ERROR|unknown|COST/.test(log)) console.error(log);
      const data = await page.evaluate(c => { const cv = document.getElementById('c'); if (!c) return cv.toDataURL('image/png'); const t = document.createElement('canvas'); t.width = c[2]; t.height = c[3]; t.getContext('2d').drawImage(cv, c[0], c[1], c[2], c[3], 0, 0, c[2], c[3]); return t.toDataURL('image/png'); }, P.crop);
      const file = path.join(OUT, (P.name || P.spec.replace(/[^\w.=-]+/g, '_')) + '.png');
      fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64')); console.log('wrote', path.relative(ROOT, file));
    }
  } finally { await browser.close(); srv.close(); }
})();
