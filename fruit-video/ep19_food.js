'use strict';
/* SHIFT HAPPENS, Episode 19: The Potluck. The food kit `window.F19` (owner: the FOOD builder). Contract: /tmp/shift_tools/briefs/F19_API.md; usage, options and traps: GUIDE_FOOD19.md in this folder.
 *
 * Everything draws into the context you pass (scenes pass `ctx`), in WORLD units, in the transform that is in force (the scene camera). Every function is a PURE function of its arguments and `t`
 * (scene-local seconds): no Math.random, no Date, no state that depends on how many frames were drawn: frame N is identical in every worker and every run. Randomness only from rnd(seed, k)
 * (the same hash as FX18.rnd). Each call saves and restores the context. The static body of a dish is baked ONCE into an offscreen canvas (keyed by kind, view and style, at the pixel density the
 * current transform needs) and blitted; only the animated parts (steam, liquids, lids, wobble, a pour) are drawn live. The cache only saves time: dropping it never changes a pixel.
 * No text is ever baked: stickers, labels and the dial legend are drawn live through the UI kit (set dressing unless you pass hero: true).
 *
 * AS BUILT   F19.dish(ctx, kind, o)      o = { x, y, s, rot, t, seed, steam, shadow, alpha, view: 'side' | 'top' }; (x, y) = the bottom centre of the footprint (view 'top': its centre); returns { w, h, top: [x, y], hot: [x, y] }
 *   kinds (F19.kinds lists them; each also has a top view except pieSlice)
 *     roll, rolls {n 1..12, cover}, basket, plate {items [kind | {kind, k, dx, dy, ...opts}], itemScale, stickers [{kind, text, at, s, rot}]}, coffee {thick 0..1, fill 0..1, mug}
 *     turkey {carve 0..1: sixths = slices taken}, turkeySlices {n}, turkeyChop, turkeyMince, turkeyPuree, turkeyMold {shine} (these six also take bare: no platter, no garnish), pie {slice 0..1}, pieMold {slice}, pieSlice {mold}
 *     blender {on, fill, color, lid}, slowcooker {lid -1..1, hop, fog, light, dial, hero}, jello {wobble, t0, color}, cranCan {slices 0..4}, casserole {foil}, pizzaBox {open}
 *   F19.info(kind, o)            the same record without drawing
 *   F19.steam(ctx, o)            { x, y, w, h, t, seed, power, curl, t0, t1, period, stagger, n, lean }
 *   F19.pour(ctx, o)             { x0, y0, x1, y1, t, t0, t1, visc, color, width, keep } -> { lands, ends };  F19.viscosity(thick) -> visc;  F19.thickOf(visc) -> thick
 *   F19.sticker(ctx, o)          { kind: note | sticker | label | tag | clip, x, y, s, rot, text, t, t0, hero } -> box
 *   F19.jiggle(t, t0, amp, freq, damp) -> { sx, sy, skew }       F19.BEIGE (#d9c7a3), BEIGE_D, BEIGE_L, BEIGE_H, BEIGE_X, OUT       F19.rnd, noise, mix, rgba, lerp, seg, clamp01
 *   A dish with s < .02 or alpha 0 draws nothing and still returns its record. Native size at s = 1 (side view): rolls, basket, plate, pie, casserole, platters about 300 to 340 px wide; a single roll 160; a cup 120; a mug 190; a
 *   blender 190 x 270; a slow cooker 330 x 250. Local y runs down the screen, so a dish rises to negative y.
 */
(() => {
const F19 = window.F19 = {};
const PI = Math.PI, TAU = PI * 2;
const OUT = 'rgba(28,20,14,.75)';
F19.OUT = OUT;
F19.BEIGE = '#d9c7a3'; F19.BEIGE_D = '#c4ad84'; F19.BEIGE_L = '#ece0c6'; F19.BEIGE_H = '#f7efdc'; F19.BEIGE_X = '#a58f68';

// ------------------------------------------------------------------ helpers (rnd, noise, rgb, mix are the FX18 ones, copied so the kit also runs on its own)
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => b === a ? (t >= a ? 1 : 0) : clamp01((t - a) / (b - a));
const sstep = (a, b, x) => { const k = seg(x, a, b); return k * k * (3 - 2 * k); };
const ease = {
  out: k => { k = clamp01(k); return 1 - (1 - k) * (1 - k) * (1 - k); },
  in: k => { k = clamp01(k); return k * k * k; },
  io: k => { k = clamp01(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
};
function rnd(seed, k) {
  seed = +seed || 0; k = +k || 0;
  const a = Math.floor(seed), af = seed - a, b = Math.floor(k), bf = k - b;
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x632be5ab | 0, 0x85ebca6b);
  h ^= Math.imul((af * 16384) | 0, 0xc2b2ae35) ^ Math.imul(((bf * 16384) | 0) + 0x1b873593 | 0, 0x27d4eb2f);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
function noise(seed, x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return rnd(seed, i) * (1 - u) + rnd(seed, i + 1) * u; }
const RGBC = new Map();
function rgb(css) {
  if (Array.isArray(css)) return css;
  let v = RGBC.get(css); if (v) return v;
  let s = String(css).trim(), r = 255, g = 255, b = 255;
  if (s[0] === '#') { if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]; const n = parseInt(s.slice(1, 7), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
  else { const m = s.match(/[\d.]+/g); if (m && m.length >= 3) { r = +m[0]; g = +m[1]; b = +m[2]; } }
  v = [r, g, b]; if (RGBC.size > 600) RGBC.clear(); RGBC.set(css, v); return v;
}
const rgba = (css, a) => { const c = rgb(css); return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (+clamp01(a).toFixed(4)) + ')'; };
const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return 'rgb(' + Math.round(lerp(A[0], B[0], k)) + ',' + Math.round(lerp(A[1], B[1], k)) + ',' + Math.round(lerp(A[2], B[2], k)) + ')'; };
const lgr = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) gr.addColorStop(o, col); return gr; };
const rgr = (g, x0, y0, r0, x1, y1, r1, stops) => { const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1); for (const [o, col] of stops) gr.addColorStop(o, col); return gr; };
F19.rnd = rnd; F19.noise = noise; F19.mix = mix; F19.rgba = rgba; F19.lerp = lerp; F19.seg = seg; F19.clamp01 = clamp01;

/* path and paint helpers: all draw in the LOCAL frame of the dish (x right, y down, origin = bottom centre of the footprint) */
function ellp(g, x, y, rx, ry, rot = 0, a0 = 0, a1 = TAU) { g.beginPath(); g.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, a0, a1); }
function rrp(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function ink(g, lw = 3, col = OUT) { g.lineWidth = lw; g.strokeStyle = col; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function fillInk(g, fill, lw = 3, col) { g.fillStyle = fill; g.fill(); ink(g, lw, col); }
/* a soft specular spot */
function spot(g, x, y, rx, ry, rot = 0, a = .6, col = '#fffbe8') { g.save(); g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); g.restore(); }
/* a soft contact shadow ellipse (radial falloff) */
function shade(g, x, y, rx, ry, a = .42) {
  g.save(); g.translate(x, y); g.scale(1, ry / rx);
  g.fillStyle = rgr(g, 0, 0, 0, 0, 0, rx, [[0, 'rgba(24,14,8,' + a + ')'], [.55, 'rgba(24,14,8,' + (a * .6) + ')'], [1, 'rgba(24,14,8,0)']]);
  g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
/* the smooth closed curve through points (Catmull-Rom as beziers); pts = [[x, y], ...] */
function smooth(g, pts, closed = true, tension = .5) {
  const n = pts.length; g.beginPath();
  if (n < 3) { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) g.lineTo(pts[i][0], pts[i][1]); return; }
  const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  g.moveTo(P(0)[0], P(0)[1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), k = tension / 3 * 2;
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2, p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2, p2[0], p2[1]);
  }
  if (closed) g.closePath();
}
function clean(c) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.shadowBlur = 0; c.shadowColor = 'rgba(0,0,0,0)'; c.imageSmoothingEnabled = true; }
/* UI kit text, only when the kit is there; set dressing unless hero (not held to size, margins or cover, and may be cut by the frame) */
function lab(str, cx, cy, o, hero) {
  if (typeof UI === 'undefined' || !UI.label) return null;
  return UI.label(str, cx, cy, Object.assign({ hero: hero === true, crop: hero !== true }, o));
}

// ------------------------------------------------------------------ the sprite cache (bake once, blit; never holds text)
const CACHE = new Map(); let cacheBytes = 0; const CACHE_MAX = 160 * 1048576;
const LADDER = [.3, .4, .5, .63, .8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4];
function bake(key, bx, by, bw, bh, ppu, paint) {
  const w = Math.max(1, Math.ceil(bw * ppu)), h = Math.max(1, Math.ceil(bh * ppu)), kk = key + '|' + ppu + '|' + w + 'x' + h;
  let e = CACHE.get(kk); if (e) return e;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.scale(w / bw, h / bh); g.translate(-bx, -by);
  paint(g);
  e = { cv, bx, by, bw, bh };
  cacheBytes += w * h * 4; if (cacheBytes > CACHE_MAX) { CACHE.clear(); cacheBytes = w * h * 4; }
  CACHE.set(kk, e); return e;
}
/* pixels per local unit that the current transform needs, rounded up to a rung of the ladder (so a slow zoom reuses sprites) */
function ppuFor(c) {
  let dev = 1; try { const m = c.getTransform(); dev = Math.hypot(m.a, m.b); } catch (e) { dev = 1; }
  for (const p of LADDER) if (p >= dev * .98) return p;
  return LADDER[LADDER.length - 1];
}

// ------------------------------------------------------------------ the dish dispatcher
const KINDS = {};
F19.kinds = KINDS;
let ALPHA = 1;                                       /* the alpha of the enclosing dish while a plate draws its items (a stack, restored on exit) */
const toWorld = (x, y, s, rot, p) => { const co = Math.cos(rot), si = Math.sin(rot); return [x + s * (p[0] * co - p[1] * si), y + s * (p[0] * si + p[1] * co)]; };
function recordOf(kind, o, K, view) {
  const info = K.info(o || {}, view);
  const s = o && o.s != null ? +o.s : 1, x = o && +o.x || 0, y = o && +o.y || 0, rot = o && +o.rot || 0;
  return { info, s, x, y, rot, res: { w: info.w * s, h: info.h * s, top: toWorld(x, y, s, rot, info.top), hot: toWorld(x, y, s, rot, info.hot) } };
}
/* F19.dish(ctx, kind, o): see the header. Unknown kind: draws nothing, returns null. */
function dish(c, kind, o = {}) {
  const view = o.view === 'top' ? 'top' : 'side';
  const K = (view === 'top' && TOP[kind]) || KINDS[kind]; if (!K) return null;
  const R = recordOf(kind, o, K, view), info = R.info, s = R.s, t = +o.t || 0;
  const alpha = (o.alpha == null ? 1 : clamp01(o.alpha)) * ALPHA;
  if (!(s >= .02) || !(alpha > .004)) return R.res;
  const prevA = ALPHA; ALPHA = alpha;
  c.save(); clean(c);
  try {
    c.translate(R.x, R.y); if (R.rot) c.rotate(R.rot); c.scale(s, s);
    if (alpha < 1) c.globalAlpha = alpha;
    if (K.paint) {
      const shadow = o.shadow !== false, [x0, y0, x1, y1] = info.bbox;
      const e = bake(kind + ':' + view + ':' + (shadow ? 1 : 0) + ':' + info.key, x0, y0, x1 - x0, y1 - y0, ppuFor(c), g => K.paint(g, o, view, info, shadow));
      c.drawImage(e.cv, e.bx, e.by, e.bw, e.bh);
    }
    if (K.live) K.live(c, o, view, info, t);
    const st = o.steam > 0 && K.steam ? K.steam(o, info, view) : null;
    if (st && st.power > .01) F19.steam(c, { x: info.hot[0], y: info.hot[1], w: st.w, h: st.h, t, seed: (o.seed || 0) + 3, power: clamp01(o.steam) * st.power, curl: st.curl });
  } finally { c.restore(); ALPHA = prevA; }
  return R.res;
}
F19.dish = dish;
F19.info = (kind, o = {}) => { const view = o.view === 'top' ? 'top' : 'side', K = (view === 'top' && TOP[kind]) || KINDS[kind]; return K ? recordOf(kind, o, K, view).res : null; };

// ------------------------------------------------------------------ jiggle: a damped wobble to multiply onto anything drawn (a jello, a pudding cup, a mold)
/* F19.jiggle(t, t0, amp = .12, freq = 3.2, damp = 3) -> { sx, sy, skew }: 1, 1, 0 before t0; afterwards sy = 1 + a, sx = 1 - a / 2 (volume kept), skew leans with the quarter-period phase. a = amp * e^(-damp tau) * sin(2 pi freq tau). */
F19.jiggle = (t, t0, amp = .12, freq = 3.2, damp = 3) => {
  const tau = (+t || 0) - (+t0 || 0);
  if (!(tau > 0)) return { sx: 1, sy: 1, skew: 0 };
  const env = Math.exp(-damp * tau), a = amp * env * Math.sin(TAU * freq * tau), b = amp * env * Math.cos(TAU * freq * tau);
  return { sx: 1 - a * .5, sy: 1 + a, skew: b * .5 };
};

// ------------------------------------------------------------------ steam: thin curling wisps rising from (x, y)
/* F19.steam(ctx, { x, y, w, h, t, seed, power, curl }): (x, y) = the source (the middle of its base), w = how wide the source is (also how far wisps sway), h = how high the wisps climb, power 0..1 (alpha and number of wisps, 2 to 5),
 * curl 0..1 (default .6: how much the tips curl). Added: t0 (the plume starts at t0: nothing before it; wisps are born over `stagger` (default .9) x a period), t1 (emission stops at t1: wisps in flight finish), period (seconds for a head to climb
 * the whole height: default 2.3 to 4; a short period makes a fast burst), n (the number of wisps, 1..14; default 2 to 5 from power), lean (px the plume drifts sideways by its top, growing with height: a draught). Cream white, soft: it reads on a dark or mid ground; on a white wall it is a faint haze. Normal blend, alpha at most .55: keep it off hero text (the gate counts a wisp
 * as covering only at alpha .5 and up, and a wisp is thin, but keep the title text clear anyway). About 1.2 ms for 5 wisps. */
F19.steam = function steam(c, o = {}) {
  const x = +o.x || 0, y = +o.y || 0, w = o.w == null ? 60 : +o.w, h = o.h == null ? 150 : +o.h, t = +o.t || 0, seed = +o.seed || 0;
  const power = o.power == null ? 1 : clamp01(o.power), curl = o.curl == null ? .6 : clamp01(o.curl);
  if (!(power > .02) || !(h > 4) || !(w > 1)) return;
  const lean = +o.lean || 0, n = o.n != null ? Math.max(1, Math.min(14, o.n | 0)) : 2 + Math.round(power * 3), N = 14, ot0 = o.t0 == null ? null : +o.t0, ot1 = o.t1 == null ? null : +o.t1, stag = o.stagger == null ? .9 : +o.stagger;
  c.save(); clean(c);
  for (let i = 0; i < n; i++) {
    const r1 = rnd(seed + 11.1, i), r2 = rnd(seed + 23.7, i), r3 = rnd(seed + 37.9, i), r4 = rnd(seed + 41.3, i), r5 = rnd(seed + 53.9, i);
    const T = o.period ? o.period * (.85 + .3 * r1) : 2.3 + r1 * 1.7;                    /* seconds for a head to climb the whole height */
    let life;
    if (ot0 == null) life = (((t / T) + r2) % 1 + 1) % 1;
    else { const tt = t - ot0 - r2 * T * stag; if (tt < 0) continue; life = (tt / T) % 1; if (ot1 != null && t - life * T > ot1) continue; }     /* t0 / t1: a burst that starts at t0 and stops emitting at t1 */
    const env = sstep(0, .16, life) * (1 - sstep(.58, .98, life));
    if (env < .02) continue;
    const L = .42 + .3 * r3, head = life, tail = Math.max(0, head - L);
    const x0 = (r4 - .5) * w * .8, A = w * (.3 + .45 * r1), kk = TAU / (h * (.5 + .45 * r2)), om = TAU / (1.7 + 1.4 * r3), ph = r5 * TAU, om2 = TAU / (1.3 + 1.2 * r1);
    const hwMax = (1.6 + w * .05) * (.55 + 1.25 * head), a = .5 * power * env;
    const Lp = [], Rp = [];
    for (let k = 0; k <= N; k++) {
      const uu = k / N, u = lerp(tail, head, uu), yy = u * h;
      let off = x0 * (1 - .5 * u) + A * (.2 + u) * Math.sin(kk * yy - om * t + ph) + (noise(seed + 3.3 + i, t * .35) - .5) * w * .9 * u;
      off += curl * w * .85 * Math.max(0, u - .4) * Math.sin(om2 * t + ph * 1.7 + u * 5) + lean * Math.pow(u, 1.4);
      const bump = Math.pow(Math.sin(PI * Math.min(1, uu * .94 + .03)), .75), hw = hwMax * (.12 + .88 * bump);
      Lp.push([off - hw, -yy]); Rp.push([off + hw, -yy]);
    }
    c.save(); c.translate(x, y);
    c.beginPath(); c.moveTo(Lp[0][0], Lp[0][1]);
    for (let k = 1; k < N; k++) c.quadraticCurveTo(Lp[k][0], Lp[k][1], (Lp[k][0] + Lp[k + 1][0]) / 2, (Lp[k][1] + Lp[k + 1][1]) / 2);
    c.lineTo(Lp[N][0], Lp[N][1]); c.lineTo(Rp[N][0], Rp[N][1]);
    for (let k = N - 1; k >= 1; k--) c.quadraticCurveTo(Rp[k + 1][0], Rp[k + 1][1], (Rp[k][0] + Rp[k + 1][0]) / 2, (Rp[k][1] + Rp[k + 1][1]) / 2);
    c.lineTo(Rp[0][0], Rp[0][1]); c.closePath();
    const yT = -tail * h, yH = -head * h;
    const grad = k => { const gr = c.createLinearGradient(0, yT, 0, yH); gr.addColorStop(0, rgba('#fff8ee', 0)); gr.addColorStop(.28, rgba('#fff8ee', a * k)); gr.addColorStop(.72, rgba('#fffaf2', a * k * .9)); gr.addColorStop(1, rgba('#fffaf2', 0)); return gr; };
    c.lineWidth = hwMax * 1.5; c.lineJoin = 'round'; c.strokeStyle = grad(.3); c.stroke();        /* the soft halo: the same ribbon, stroked wide */
    c.fillStyle = grad(.85); c.fill();                                                           /* the core */
    c.restore();
  }
  c.restore();
};

// ================================================================== shared painting: gingham, rolls, baskets
/* red and white gingham over the rectangle, under the caller's clip; cell = check size, sy = vertical squash (a cloth lying flat seen from the side), a = stripe alpha */
function gingham(g, x0, y0, x1, y1, cell, sy = 1, a = .5, red = '208,56,46') {
  const cy = cell * sy;
  g.save(); g.fillStyle = '#fdf8f0'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = 'rgba(' + red + ',' + a + ')';
  for (let y = Math.floor(y0 / (2 * cy)) * 2 * cy; y < y1; y += 2 * cy) g.fillRect(x0, y, x1 - x0, cy);
  for (let x = Math.floor(x0 / (2 * cell)) * 2 * cell; x < x1; x += 2 * cell) g.fillRect(x, y0, cell, y1 - y0);
  g.restore();
}
/* one dinner roll, side view: bottom centre (x, y), half width 78 * s. k varies the shape a little (hash seed). */
function rollSide(g, x, y, s, k, shadow = true) {
  g.save(); g.translate(x, y); g.scale(s, s * (.93 + .12 * rnd(k, 1)));
  const w = 78 + 4 * rnd(k, 2), h = 80 + 8 * rnd(k, 3), lean = (rnd(k, 4) - .5) * 14;
  if (shadow) shade(g, 0, -1, w * 1.08, 15, .4);
  const body = () => { g.beginPath(); g.moveTo(-w, -9); g.bezierCurveTo(-w - 9, -h * .56, -w * .55 + lean, -h - 5, lean, -h); g.bezierCurveTo(w * .55 + lean, -h - 5, w + 9, -h * .56, w, -9); g.bezierCurveTo(w * .86, 6, -w * .86, 6, -w, -9); g.closePath(); };
  body(); g.fillStyle = lgr(g, 0, -h, 0, 8, [[0, '#f7cc82'], [.38, '#e69a45'], [.78, '#c2742b'], [1, '#8f4a1b']]); g.fill();
  g.save(); body(); g.clip();
  g.fillStyle = lgr(g, -w, 0, w, 0, [[0, 'rgba(255,236,170,.30)'], [.45, 'rgba(255,236,170,0)'], [1, 'rgba(70,30,6,.34)']]); g.fillRect(-w - 12, -h - 12, w * 2 + 24, h + 30);
  g.fillStyle = 'rgba(80,36,10,.38)'; g.beginPath(); g.ellipse(0, 10, w * 1.05, 24, 0, 0, TAU); g.fill();                                 /* the dark underside */
  for (let i = 0; i < 13; i++) { const a = rnd(k + 5, i) * TAU, r = Math.sqrt(rnd(k + 6, i)) * .85, px = Math.cos(a) * w * r * .8 - w * .1, py = -h * .6 + Math.sin(a) * h * r * .45;     /* flour */
    g.fillStyle = 'rgba(255,252,240,' + (.5 + .35 * rnd(k + 7, i)) + ')'; g.beginPath(); g.arc(px, py, 1.1 + 2.1 * rnd(k + 8, i), 0, TAU); g.fill(); }
  g.restore();
  g.beginPath(); g.moveTo(-w * .5, -h * .8); g.quadraticCurveTo(lean * .5, -h * .66, w * .48, -h * .78);                                    /* the slash on top */
  g.lineWidth = 5.5; g.strokeStyle = 'rgba(112,58,20,.55)'; g.lineCap = 'round'; g.stroke(); g.lineWidth = 2.4; g.strokeStyle = 'rgba(255,226,160,.7)'; g.stroke();
  spot(g, -w * .3 + lean * .5, -h * .78, w * .26, h * .085, -.42, .62); spot(g, -w * .62, -h * .46, 5, 11, -.5, .35);
  body(); ink(g, 3.2);
  g.restore();
}
/* one roll seen from above: centre (x, y), radius 40 * s */
function rollTop(g, x, y, s, k, shadow = true) {
  g.save(); g.translate(x, y); g.rotate((rnd(k, 1) - .5) * 1.4); g.scale(s, s);
  const r = 40;
  if (shadow) shade(g, 3, 5, r * 1.15, r * .95, .34);
  g.beginPath(); g.ellipse(0, 0, r * (1 + .05 * rnd(k, 2)), r * (1 - .06 * rnd(k, 3)), 0, 0, TAU);
  g.fillStyle = rgr(g, -r * .25, -r * .3, r * .1, 0, 0, r * 1.05, [[0, '#f9d38c'], [.5, '#e69c47'], [.88, '#c2742b'], [1, '#98511f']]); g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 10; i++) { const a = rnd(k + 5, i) * TAU, rr_ = Math.sqrt(rnd(k + 6, i)) * r * .8; g.fillStyle = 'rgba(255,252,240,' + (.45 + .3 * rnd(k + 7, i)) + ')'; g.beginPath(); g.arc(Math.cos(a) * rr_, Math.sin(a) * rr_, 1 + 1.8 * rnd(k + 8, i), 0, TAU); g.fill(); }
  g.restore();
  g.beginPath(); g.moveTo(-r * .46, r * .1); g.quadraticCurveTo(0, -r * .2, r * .5, -r * .06); g.lineWidth = 4.4; g.strokeStyle = 'rgba(112,58,20,.5)'; g.lineCap = 'round'; g.stroke(); g.lineWidth = 1.8; g.strokeStyle = 'rgba(255,226,160,.7)'; g.stroke();
  spot(g, -r * .34, -r * .42, r * .3, r * .1, -.7, .6);
  g.beginPath(); g.ellipse(0, 0, r * (1 + .05 * rnd(k, 2)), r * (1 - .06 * rnd(k, 3)), 0, 0, TAU); ink(g, 3);
  g.restore();
}
KINDS.roll = {
  info(o, view) { const top = view === 'top'; return { bbox: top ? [-60, -56, 66, 64] : [-96, -96, 96, 26], w: top ? 80 : 160, h: top ? 80 : 90, top: [0, top ? -40 : -86], hot: [0, top ? 0 : -70], key: 'k' + (o.seed || 0) }; },
  paint(g, o, view, info, shadow) { if (view === 'top') rollTop(g, 0, 0, 1, o.seed || 0, shadow); else rollSide(g, 0, 0, 1, o.seed || 0, shadow); },
};

/* the wicker basket (side view): the pieces are split so that rolls can sit between the back and the front */
const BK = { rimY: -80, rimRx: 150, rimRy: 34, baseY: -8, baseRx: 100, baseRy: 20 };
function weaveRows(g, rows) {
  g.save(); g.lineCap = 'round';
  for (let j = 1; j <= rows; j++) {
    const u = j / (rows + 1), cy = lerp(BK.rimY, BK.baseY, u), rx = lerp(BK.rimRx, BK.baseRx, u), ry = lerp(BK.rimRy, BK.baseRy, u);
    g.beginPath(); g.ellipse(0, cy, rx, ry, 0, .04, PI - .04); g.strokeStyle = 'rgba(86,48,16,.55)'; g.lineWidth = 2.4; g.stroke();
    const n = 26;
    for (let m = 0; m < n; m++) {
      const th = PI * (m + .5 * (j % 2) + .25) / n; if (th <= .06 || th >= PI - .06) continue;
      const u2 = (j + 1) / (rows + 1), cy2 = lerp(BK.rimY, BK.baseY, Math.min(1, u2)), rx2 = lerp(BK.rimRx, BK.baseRx, Math.min(1, u2)), ry2 = lerp(BK.rimRy, BK.baseRy, Math.min(1, u2));
      g.beginPath(); g.moveTo(Math.cos(th) * rx, cy + Math.sin(th) * ry); g.lineTo(Math.cos(th) * rx2, cy2 + Math.sin(th) * ry2);
      g.strokeStyle = (m + j) % 2 ? 'rgba(250,214,150,.42)' : 'rgba(70,38,12,.4)'; g.lineWidth = 3.4; g.stroke();
    }
  }
  g.restore();
}
function rimRope(g, front) {
  const a0 = front ? 0 : PI, a1 = front ? PI : TAU;
  g.beginPath(); g.ellipse(0, BK.rimY, BK.rimRx, BK.rimRy, 0, a0, a1); g.lineWidth = 15; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke();
  g.beginPath(); g.ellipse(0, BK.rimY, BK.rimRx, BK.rimRy, 0, a0, a1); g.lineWidth = 10.5; g.strokeStyle = front ? '#e3b46e' : '#b98648'; g.stroke();
  g.save(); g.lineWidth = 2; g.strokeStyle = 'rgba(110,66,26,.55)';
  for (let m = 0; m < 44; m++) { const th = lerp(a0, a1, (m + .5) / 44), cx = Math.cos(th) * BK.rimRx, cy = BK.rimY + Math.sin(th) * BK.rimRy; g.beginPath(); g.moveTo(cx - 2.2, cy - 4.4); g.lineTo(cx + 2.2, cy + 4.4); g.stroke(); }
  g.beginPath(); g.ellipse(0, BK.rimY - 2, BK.rimRx, BK.rimRy, 0, a0 + .1, a1 - .1); g.lineWidth = 2.4; g.strokeStyle = front ? 'rgba(255,240,200,.55)' : 'rgba(255,230,180,.25)'; g.stroke();
  g.restore();
}
/* back half: the back rim, the dark inside, the cloth lining (flat gingham, squashed to the viewing angle) */
function basketBack(g, shadow, lining = true) {
  if (shadow) shade(g, 0, -2, 175, 26, .42);
  g.beginPath(); g.ellipse(0, BK.rimY, BK.rimRx - 2, BK.rimRy - 1, 0, 0, TAU); g.fillStyle = lgr(g, 0, BK.rimY - BK.rimRy, 0, BK.rimY + BK.rimRy, [[0, '#6f4521'], [1, '#8d5c2e']]); g.fill();
  rimRope(g, false);
  if (lining) {
    g.save(); g.beginPath(); g.ellipse(0, BK.rimY + 3, BK.rimRx - 9, BK.rimRy - 6, 0, 0, TAU); g.clip();
    gingham(g, -BK.rimRx, BK.rimY - 40, BK.rimRx, BK.rimY + 40, 22, .34, .52);
    g.fillStyle = lgr(g, 0, BK.rimY - BK.rimRy, 0, BK.rimY + BK.rimRy, [[0, 'rgba(60,30,10,.32)'], [.5, 'rgba(60,30,10,0)']]); g.fillRect(-BK.rimRx, BK.rimY - 40, BK.rimRx * 2, 80);
    g.restore();
  }
}
/* front half: the outer wall, the weave, the front rope, and the cloth tongues hanging over it */
function basketFront(g, flaps = true) {
  const body = () => { g.beginPath(); g.moveTo(-BK.rimRx, BK.rimY); g.bezierCurveTo(-BK.rimRx + 3, BK.rimY + 34, -BK.baseRx - 14, BK.baseY - 12, -BK.baseRx, BK.baseY); g.ellipse(0, BK.baseY, BK.baseRx, BK.baseRy, 0, PI, 0, true); g.bezierCurveTo(BK.baseRx + 14, BK.baseY - 12, BK.rimRx - 3, BK.rimY + 34, BK.rimRx, BK.rimY); g.ellipse(0, BK.rimY, BK.rimRx, BK.rimRy, 0, 0, PI); g.closePath(); };
  body(); g.fillStyle = lgr(g, -BK.rimRx, 0, BK.rimRx, 0, [[0, '#dca963'], [.35, '#c98f4e'], [.78, '#a66d36'], [1, '#7d4d24']]); g.fill();
  g.save(); body(); g.clip(); weaveRows(g, 5);
  g.fillStyle = lgr(g, 0, BK.rimY, 0, 22, [[0, 'rgba(255,240,200,.0)'], [1, 'rgba(50,24,6,.34)']]); g.fillRect(-BK.rimRx - 4, BK.rimY, BK.rimRx * 2 + 8, 110);
  g.restore(); body(); ink(g, 3.4);
  rimRope(g, true);
  if (flaps) {
    /* two napkin corners hanging over the front rim: the top edge follows the rim, the bottom is a soft V (the cloth's corner points down) */
    for (const [xa, xb, hang, bias] of [[-142, -34, 44, -.08], [58, 138, 32, .1]]) {
      const rimYat = x => BK.rimY + BK.rimRy * Math.sqrt(Math.max(0, 1 - (x / BK.rimRx) * (x / BK.rimRx))) + 1, xm = lerp(xa, xb, .5 + bias), ya = rimYat(xa) - 3, yb = rimYat(xb) - 3, N = 10;
      const path = () => { g.beginPath(); g.moveTo(xa, ya); for (let i = 1; i <= N; i++) { const x = lerp(xa, xb, i / N); g.lineTo(x, rimYat(x) - 3); } g.lineTo(xb, yb + hang * .16); g.quadraticCurveTo(lerp(xm, xb, .5) + 2, rimYat(xm) + hang * .62, xm, rimYat(xm) + hang); g.quadraticCurveTo(lerp(xa, xm, .5) - 2, rimYat(xm) + hang * .62, xa, ya + hang * .16); g.closePath(); };
      g.save(); g.translate(2, 5); path(); g.fillStyle = 'rgba(40,20,8,.28)'; g.fill(); g.restore();
      g.save(); path(); g.fillStyle = '#fff'; g.fill(); g.clip(); gingham(g, xa - 6, BK.rimY, xb + 6, BK.rimY + 90, 17, 1, .55);
      g.fillStyle = lgr(g, xa, 0, xb, 0, [[0, 'rgba(255,255,255,.22)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(60,20,10,.22)']]); g.fillRect(xa - 6, BK.rimY, xb - xa + 12, 90);
      g.strokeStyle = 'rgba(130,40,30,.3)'; g.lineWidth = 2; for (const f of [.3, .5, .7]) { const x = lerp(xa, xb, f); g.beginPath(); g.moveTo(x, rimYat(x)); g.quadraticCurveTo((x + xm) / 2, rimYat(x) + hang * .4, xm + (x - xm) * .12, rimYat(xm) + hang * .8); g.stroke(); }
      g.restore(); path(); ink(g, 2.8);
    }
  }
}
KINDS.basket = {
  info(o, view) { return view === 'top' ? { bbox: [-170, -170, 170, 176], w: 330, h: 330, top: [0, -140], hot: [0, 0], key: 't' + (o.seed || 0) + ':' + (o.rotCloth || 0) } : { bbox: [-182, -122, 182, 34], w: 300, h: 120, top: [0, -118], hot: [0, -88], key: 's' }; },
  paint(g, o, view, info, shadow) { if (view === 'top') basketTop(g, o, shadow, 0, []); else { basketBack(g, shadow); basketFront(g); } },
};
/* the basket from above: a gingham square on the diagonal under a woven ring, the cloth lining inside, rolls on it. rollsList = [[x, y], ...] (inside the ring, radius 106) */
function topSlots(n, seed) {
  const a0 = rnd(seed, 77) * TAU, out = [], ring = (m, R, off) => { for (let i = 0; i < m; i++) out.push([Math.cos(a0 + off + TAU * i / m) * R, Math.sin(a0 + off + TAU * i / m) * R]); };
  if (n <= 1) out.push([0, 0]);
  else if (n <= 8) ring(n, n === 2 ? 34 : n === 3 ? 40 : n === 4 ? 46 : n === 5 ? 54 : n === 6 ? 60 : n === 7 ? 64 : 68, 0);
  else { const outer = n >= 12 ? 8 : 7; ring(outer, 70, 0); ring(n - outer, n - outer <= 2 ? 22 : 30, PI / (n - outer)); }
  return out;
}
function basketTop(g, o, shadow, n, slots, cover = 0) {
  const seed = o.seed || 0, rc = PI / 12 + rnd(seed, 5) * PI / 6;
  if (shadow) { shade(g, 4, 8, 170, 150, .36); }
  g.save(); g.rotate(rc);                                                                                       /* the cloth */
  g.beginPath(); g.rect(-135, -135, 270, 270); g.save(); g.shadowColor = 'rgba(30,14,6,.30)'; g.shadowBlur = 0; g.fillStyle = '#fff'; g.fill(); g.restore();
  g.save(); g.clip(); gingham(g, -140, -140, 140, 140, 27, 1, .5);
  g.fillStyle = rgr(g, -30, -30, 40, 0, 0, 200, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(90,24,14,.28)']]); g.fillRect(-140, -140, 280, 280); g.restore();
  g.beginPath(); g.rect(-135, -135, 270, 270); ink(g, 3);
  g.beginPath(); g.rect(-127, -127, 254, 254); g.lineWidth = 1.6; g.strokeStyle = 'rgba(140,40,30,.45)'; g.stroke();
  g.restore();
  g.beginPath(); g.arc(0, 0, 133, 0, TAU); g.fillStyle = rgr(g, -40, -48, 20, 0, 0, 140, [[0, '#ebc582'], [.6, '#c98f4e'], [1, '#8b5a2b']]); g.fill();      /* the ring */
  g.save(); g.beginPath(); g.arc(0, 0, 133, 0, TAU); g.arc(0, 0, 105, 0, TAU, true); g.clip();
  for (let m = 0; m < 56; m++) { const th = TAU * m / 56; g.beginPath(); g.moveTo(Math.cos(th) * 105, Math.sin(th) * 105); g.lineTo(Math.cos(th + .09) * 133, Math.sin(th + .09) * 133); g.strokeStyle = m % 2 ? 'rgba(250,214,150,.45)' : 'rgba(70,38,12,.45)'; g.lineWidth = 4.2; g.stroke(); }
  g.restore();
  g.beginPath(); g.arc(0, 0, 133, 0, TAU); ink(g, 3.6); g.beginPath(); g.arc(0, 0, 119, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(80,44,14,.55)'; g.stroke();
  g.beginPath(); g.arc(0, 0, 126, PI * 1.05, PI * 1.62); g.lineWidth = 4; g.strokeStyle = 'rgba(255,244,214,.5)'; g.stroke();
  g.beginPath(); g.arc(0, 0, 105, 0, TAU); g.fillStyle = '#7c4f26'; g.fill(); ink(g, 3);
  g.save(); g.beginPath(); g.arc(0, 0, 104, 0, TAU); g.clip(); g.rotate(.4);                                     /* the lining */
  gingham(g, -110, -110, 110, 110, 25, 1, .5);
  g.fillStyle = rgr(g, 0, 0, 60, 0, 0, 108, [[0, 'rgba(50,24,8,0)'], [1, 'rgba(50,24,8,.5)']]); g.rotate(-.4); g.fillRect(-110, -110, 220, 220);
  g.restore();
  slots.forEach((p, i) => rollTop(g, p[0], p[1], .86, seed * 13 + i, true));
  if (cover > 0) {                                                                                              /* a flap folded over the edge of the rolls */
    const ca = rnd(seed, 91) * TAU, r0 = 105 - 70 * cover;
    g.save(); g.beginPath(); g.arc(0, 0, 104, 0, TAU); g.clip(); g.rotate(ca);
    g.beginPath(); g.moveTo(r0, -58 * cover - 10); g.quadraticCurveTo(r0 + 22, 0, r0 - 6, 70 * cover + 10); g.lineTo(130, 90); g.lineTo(130, -90); g.closePath();
    g.save(); g.fillStyle = '#fff'; g.fill(); g.clip(); gingham(g, r0 - 30, -120, 140, 120, 22, 1, .55); g.fillStyle = lgr(g, r0, 0, r0 + 70, 0, [[0, 'rgba(60,20,10,.3)'], [.3, 'rgba(60,20,10,0)']]); g.fillRect(r0 - 30, -120, 180, 240); g.restore();
    g.beginPath(); g.moveTo(r0, -58 * cover - 10); g.quadraticCurveTo(r0 + 22, 0, r0 - 6, 70 * cover + 10); ink(g, 3);
    g.restore();
  }
}
/* the side-view pile: slots are [x, base y, scale, draw order]; they fill in this order as n grows */
const SLOTS = [[0, -78, .52, 0], [-40, -56, .5, 5], [42, -54, .5, 5], [-64, -97, .48, 2], [64, -99, .48, 2], [-100, -66, .46, 4], [100, -68, .46, 4], [-22, -111, .46, 1], [24, -113, .46, 1], [-114, -90, .42, 3], [114, -92, .42, 3], [0, -131, .44, 9]];
KINDS.rolls = {
  info(o, view) {
    const n = Math.max(1, Math.min(12, Math.round(o.n == null ? 8 : o.n))), top = view === 'top';
    return { bbox: top ? [-204, -204, 204, 212] : [-182, -230, 182, 34], w: top ? 290 : 300, h: top ? 290 : 215, top: top ? [0, -140] : [0, -214], hot: top ? [0, 0] : [0, -130], key: 'n' + n + ':' + (o.seed || 0) + ':' + Math.round((o.cover == null ? (top ? 0 : .5) : o.cover) * 4), q: { n, cover: o.cover == null ? (top ? 0 : .5) : clamp01(o.cover) } };
  },
  paint(g, o, view, info, shadow) {
    const n = info.q.n, seed = o.seed || 0, cover = Math.round(info.q.cover * 4) / 4;
    if (view === 'top') { basketTop(g, o, shadow, n, topSlots(n, seed), cover); return; }
    basketBack(g, shadow);
    const hidden = cover > 0 ? new Set([3, 7, 9, 11]) : new Set(), list = [];
    for (let i = 0, shown = 0; i < SLOTS.length && shown < n; i++) { if (hidden.has(i)) continue; list.push(i); shown++; }
    list.sort((a, b) => SLOTS[a][3] - SLOTS[b][3] || SLOTS[a][1] - SLOTS[b][1]).forEach(i => { const S = SLOTS[i]; rollSide(g, S[0] + (rnd(seed, i) - .5) * 5, S[1], S[2], seed * 17 + i, false); });
    if (cover > 0) {                                                                                              /* a napkin corner folded over the back-left of the pile */
      const k = .6 + .4 * cover, A = [-150, -88], B = [-150 + 100 * k, -150 - 34 * k], C = [-150 + 150 * k, -108 + 10 * k];
      const tri = () => { g.beginPath(); g.moveTo(A[0], A[1]); g.quadraticCurveTo(A[0] + 8, B[1] + 6, B[0], B[1]); g.quadraticCurveTo(B[0] + 40 * k, B[1] + 10, C[0], C[1]); g.quadraticCurveTo((A[0] + C[0]) / 2, (A[1] + C[1]) / 2 + 22, A[0], A[1]); g.closePath(); };
      g.save(); g.translate(2, 4); tri(); g.fillStyle = 'rgba(40,20,8,.3)'; g.fill(); g.restore();
      g.save(); tri(); g.fillStyle = '#fff'; g.fill(); g.clip(); g.rotate(-.35); gingham(g, -260, -260, 60, 40, 15, .9, .55); g.rotate(.35);
      g.fillStyle = lgr(g, B[0], B[1], C[0], C[1], [[0, 'rgba(255,255,255,.25)'], [1, 'rgba(70,24,12,.32)']]); g.fillRect(-170, -190, 220, 120);
      g.strokeStyle = 'rgba(130,40,30,.32)'; g.lineWidth = 2; g.beginPath(); g.moveTo(B[0] - 14, B[1] + 14); g.quadraticCurveTo(B[0] - 20, (B[1] + A[1]) / 2, A[0] + 16, A[1] - 6); g.moveTo(B[0] + 10, B[1] + 14); g.quadraticCurveTo((B[0] + C[0]) / 2 - 12, (B[1] + C[1]) / 2, C[0] - 10, C[1] - 4); g.stroke();
      g.restore(); tri(); ink(g, 3);
    }
    basketFront(g);
  },
  steam(o, info) { return { w: 120, h: 150, power: .35, curl: .5 }; },
};
// ================================================================== plate, coffee, stickers
/* items on a plate: [kind | { kind, ...dish options, dx, dy, k }]. Base scale of each kind relative to its own s = 1, and slots [x, y(bottom centre)] per item count (side view), centres (top view) */
const PS_SIDE = { turkeyMold: .45, turkey: .34, turkeySlices: .4, turkeyChop: .4, turkeyMince: .4, turkeyPuree: .4, pie: .34, pieMold: .4, pieSlice: .56, roll: .66, rolls: .22, coffee: .68, jello: .3, cranCan: .42, casserole: .26, basket: .2, blender: .2, slowcooker: .2, pizzaBox: .24, plate: .5 };
const PS_TOP = { turkeyMold: .3, turkey: .26, turkeySlices: .3, turkeyChop: .3, turkeyMince: .3, turkeyPuree: .3, pie: .3, pieMold: .3, pieSlice: .44, roll: .72, rolls: .2, coffee: .6, jello: .3, cranCan: .4, casserole: .24, basket: .2, blender: .2, slowcooker: .2, pizzaBox: .22, plate: .5 };
const SLOT_SIDE = [null, [[0, -12]], [[-58, -18], [56, -10]], [[-64, -24], [64, -24], [0, 2]], [[-60, -26], [44, 3], [-46, 3], [64, -26]], [[-62, -26], [0, -30], [62, -26], [-36, 3], [38, 3]], [[-66, -26], [0, -30], [66, -26], [-52, 4], [0, 6], [52, 4]]];
const SLOT_TOP = [null, [[0, 0]], [[-54, 0], [54, 0]], [[-56, -34], [56, -34], [0, 48]], [[-54, -50], [56, 42], [-52, 44], [58, -46]], [[-62, -44], [0, -8], [62, -44], [-42, 52], [46, 52]], [[-66, -44], [0, -50], [66, -44], [-50, 40], [0, 54], [52, 40]]];
function plateItems(o) { return (Array.isArray(o.items) ? o.items : []).slice(0, 6).map(it => typeof it === 'string' ? { kind: it } : it); }
function plateSide(g, shadow) {
  const cy = -18, rx = 150, ry = 38;
  if (shadow) shade(g, 0, 4, rx * 1.12, 21, .42);
  g.beginPath(); g.ellipse(0, cy + 7, rx, ry, 0, 0, TAU); fillInk(g, '#c9c1b0', 3.2);                                          /* the plate's thickness */
  g.beginPath(); g.ellipse(0, cy, rx, ry, 0, 0, TAU); g.fillStyle = lgr(g, -rx, cy - ry, rx, cy + ry, [[0, '#ffffff'], [.5, '#f6f2e8'], [1, '#d9d2c1']]); g.fill();
  g.save(); g.beginPath(); g.ellipse(0, cy, rx, ry, 0, 0, TAU); g.clip();                                                      /* fluted paper rim */
  for (let m = 0; m < 64; m++) { const th = TAU * m / 64; g.beginPath(); g.moveTo(Math.cos(th) * rx * .9, cy + Math.sin(th) * ry * .9); g.lineTo(Math.cos(th) * rx, cy + Math.sin(th) * ry); g.strokeStyle = 'rgba(120,108,86,.28)'; g.lineWidth = 2; g.stroke(); }
  g.restore();
  g.beginPath(); g.ellipse(0, cy, rx, ry, 0, 0, TAU); ink(g, 3.4);
  g.beginPath(); g.ellipse(0, cy, rx * .8, ry * .8, 0, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(120,108,86,.45)'; g.stroke();
  g.beginPath(); g.ellipse(0, cy + 2, rx * .72, ry * .72, 0, 0, TAU); g.fillStyle = lgr(g, 0, cy - ry, 0, cy + ry, [[0, '#e3dccb'], [.45, '#f1ece0'], [1, '#faf6ee']]); g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(120,108,86,.4)'; g.stroke();
  g.beginPath(); g.ellipse(0, cy, rx * .94, ry * .94, 0, PI * 1.08, PI * 1.55); g.lineWidth = 3.4; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
}
function plateTop(g, shadow) {
  const r = 150;
  if (shadow) shade(g, 3, 6, r * 1.1, r * 1.05, .36);
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = rgr(g, -40, -50, 30, 0, 0, r, [[0, '#ffffff'], [.8, '#f4efe4'], [1, '#d8d0be']]); g.fill();
  g.save(); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip();
  for (let m = 0; m < 72; m++) { const th = TAU * m / 72; g.beginPath(); g.moveTo(Math.cos(th) * r * .9, Math.sin(th) * r * .9); g.lineTo(Math.cos(th) * r, Math.sin(th) * r); g.strokeStyle = 'rgba(120,108,86,.28)'; g.lineWidth = 2.4; g.stroke(); }
  g.restore(); g.beginPath(); g.arc(0, 0, r, 0, TAU); ink(g, 3.4);
  g.beginPath(); g.arc(0, 0, r * .8, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(120,108,86,.45)'; g.stroke();
  g.beginPath(); g.arc(0, 0, r * .72, 0, TAU); g.fillStyle = rgr(g, 20, 26, 20, 0, 0, r * .74, [[0, '#faf6ee'], [.8, '#f0ebde'], [1, '#e2dac8']]); g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(120,108,86,.4)'; g.stroke();
  g.beginPath(); g.arc(0, 0, r * .93, PI * 1.08, PI * 1.55); g.lineWidth = 3.4; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
}
KINDS.plate = {
  info(o, view) {
    const top = view === 'top', n = plateItems(o).length;
    return { bbox: top ? [-170, -168, 176, 176] : [-170, -70, 170, 36], w: 300, h: top ? 300 : 56 + (n ? 60 : 0), top: [0, top ? 0 : -18], hot: [0, top ? 0 : -24], key: 'p', q: { n } };
  },
  paint(g, o, view, info, shadow) { if (view === 'top') plateTop(g, shadow); else plateSide(g, shadow); },
  live(c, o, view, info, t) {
    const items = plateItems(o), n = items.length, top = view === 'top', slots = (top ? SLOT_TOP : SLOT_SIDE)[Math.min(6, n)] || [], PS = top ? PS_TOP : PS_SIDE, cs = o.itemScale == null ? 1 : +o.itemScale;
    const drawn = items.map((it, i) => { const sl = slots[i] || [0, 0], base = (PS[it.kind] || .3) * (it.k == null ? 1 : it.k) * cs * (n >= 5 ? .88 : 1); return { it, x: sl[0] + (it.dx || 0), y: sl[1] + (it.dy || 0), s: base, i }; });
    if (!top) drawn.sort((a, b) => a.y - b.y);
    for (const d of drawn) { const it = d.it, p = Object.assign({ bare: true }, it, { x: d.x, y: d.y, s: d.s, t, view: top ? 'top' : 'side', seed: (o.seed || 0) * 7 + d.i, steam: it.steam != null ? it.steam : o.steam || 0, shadow: true }); delete p.kind; delete p.dx; delete p.dy; delete p.k; if (p.rot == null) p.rot = 0; dish(c, it.kind, p); }
    if (Array.isArray(o.stickers)) for (const st of o.stickers) {
      const bx = info.bbox, fx = st.at ? st.at[0] : .5, fy = st.at ? st.at[1] : .5;
      F19.sticker(c, Object.assign({ s: .7, t }, st, { x: lerp(top ? -150 : -150, top ? 150 : 150, fx), y: lerp(top ? -150 : -56, top ? 150 : 20, fy) }));
    }
  },
};

/* the cup and the mug. Local geometry: rim ellipse, base ellipse. */
const CUPG = {
  paper: { rimY: -104, rimRx: 56, rimRy: 13, baseY: -5, baseRx: 38, baseRy: 9, wall: 4, slope: (56 - 38) / 99, depthMax: 40 },
  mug: { rimY: -96, rimRx: 52, rimRy: 12, baseY: -5, baseRx: 49, baseRy: 11, wall: 5, slope: 3 / 91, depthMax: 40 },
};
function cupPaint(g, G, mug, shadow) {
  if (shadow) shade(g, mug ? 8 : 0, 1, 82, 14, .42);
  const body = () => {
    g.beginPath(); g.moveTo(-G.rimRx, G.rimY);
    if (mug) g.lineTo(-G.baseRx, G.baseY); else g.bezierCurveTo(-G.rimRx + 3, G.rimY + 34, -G.baseRx - 5, G.baseY - 30, -G.baseRx, G.baseY);
    g.ellipse(0, G.baseY, G.baseRx, G.baseRy, 0, PI, 0, true);
    if (mug) g.lineTo(G.rimRx, G.rimY); else g.bezierCurveTo(G.baseRx + 5, G.baseY - 30, G.rimRx - 3, G.rimY + 34, G.rimRx, G.rimY);
    g.ellipse(0, G.rimY, G.rimRx, G.rimRy, 0, 0, PI); g.closePath();
  };
  if (mug) {                                                                                                                    /* the handle sits behind the body's right edge */
    g.beginPath(); g.moveTo(G.rimRx - 6, G.rimY + 18); g.bezierCurveTo(G.rimRx + 46, G.rimY + 8, G.rimRx + 46, G.baseY - 22, G.rimRx - 4, G.baseY - 24);
    g.lineWidth = 17; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 11.5; g.strokeStyle = '#f4efe4'; g.stroke();
    g.beginPath(); g.moveTo(G.rimRx - 6, G.rimY + 18); g.bezierCurveTo(G.rimRx + 46, G.rimY + 8, G.rimRx + 46, G.baseY - 22, G.rimRx - 4, G.baseY - 24); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.8)'; g.stroke();
  }
  body(); g.fillStyle = lgr(g, -G.rimRx, 0, G.rimRx, 0, [[0, '#fffdf8'], [.4, '#f7f1e5'], [1, '#c9bda8']]); g.fill();
  g.save(); body(); g.clip();
  if (mug) {
    g.fillStyle = lgr(g, 0, 0, 0, 0, [[0, '#fff'], [1, '#fff']]);
    g.fillStyle = '#d2473a'; g.fillRect(-G.rimRx - 2, G.rimY + 30, G.rimRx * 2 + 4, 15); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-G.rimRx - 2, G.rimY + 30, G.rimRx * 2 + 4, 4);
    g.fillStyle = 'rgba(60,40,20,.16)'; g.beginPath(); g.ellipse(0, G.baseY + 6, G.rimRx + 4, 20, 0, 0, TAU); g.fill();
  } else {                                                                                                                      /* the corrugated sleeve */
    const rxAt = y => G.rimRx - (y - G.rimY) * G.slope + 2, y0 = -84, y1 = -34;
    g.beginPath(); g.ellipse(0, y0, rxAt(y0), 12, 0, 0, PI); g.ellipse(0, y1, rxAt(y1), 9.5, 0, PI, 0, true); g.closePath();
    g.fillStyle = lgr(g, -G.rimRx, 0, G.rimRx, 0, [[0, '#d99a5c'], [.45, '#c98548'], [1, '#8f5a2c']]); g.fill();
    for (let m = -8; m <= 8; m++) { const x = m * 6.2; g.beginPath(); g.moveTo(x * (rxAt(y0) / 52), y0 + 11 * Math.sqrt(Math.max(0, 1 - Math.pow(x / 52, 2)))); g.lineTo(x * (rxAt(y1) / 52), y1 + 9 * Math.sqrt(Math.max(0, 1 - Math.pow(x / 52, 2)))); g.strokeStyle = 'rgba(70,36,12,.28)'; g.lineWidth = 1.6; g.stroke(); }
    g.beginPath(); g.ellipse(0, y0, rxAt(y0), 12, 0, 0, PI); g.lineWidth = 2.2; g.strokeStyle = 'rgba(60,30,10,.5)'; g.stroke(); g.beginPath(); g.ellipse(0, y1, rxAt(y1), 9.5, 0, 0, PI); g.stroke();
    g.fillStyle = 'rgba(60,40,20,.14)'; g.beginPath(); g.ellipse(0, G.baseY + 4, G.baseRx + 8, 16, 0, 0, TAU); g.fill();
  }
  spot(g, -G.rimRx * .62, (G.rimY + G.baseY) * .5, 4.5, 26, .06, .55);
  g.restore(); body(); ink(g, 3.4);
  g.beginPath(); g.ellipse(0, G.rimY, G.rimRx - G.wall + 1, G.rimRy - 2, 0, 0, TAU); g.fillStyle = lgr(g, 0, G.rimY - G.rimRy, 0, G.rimY + G.rimRy, [[0, '#8f8573'], [.55, '#c9bfae'], [1, '#e9e1d2']]); g.fill();   /* the inside wall */
  g.beginPath(); g.ellipse(0, G.rimY, G.rimRx, G.rimRy, 0, 0, TAU); ink(g, 3.6);
}
const LIQ = [[0, '#33170a', '#5f3a1e'], [.35, '#4a2910', '#8a5a2e'], [.7, '#6f4017', '#c28a3e'], [1, '#9c7248', '#cfa878']];
/* the liquid's colour at thickness th: k 0 = the body colour, k 1 = the lighter ring / highlight colour */
function liqCol(th, k) { let a = LIQ[0], b = LIQ[3]; for (let i = 0; i < 3; i++) if (th <= LIQ[i + 1][0]) { a = LIQ[i]; b = LIQ[i + 1]; break; } const u = b[0] === a[0] ? 0 : clamp01((th - a[0]) / (b[0] - a[0])); return mix(a[k + 1], b[k + 1], u); }
function coffeeGeo(o) { const G = CUPG[o.mug ? 'mug' : 'paper'], thick = clamp01(o.thick || 0), fill = o.fill == null ? .85 : clamp01(o.fill), depth = 3 + (1 - fill) * G.depthMax; const sy = G.rimY + depth, rx = G.rimRx - G.wall - depth * G.slope, ry = Math.max(2, rx * G.rimRy / G.rimRx); return { G, thick, fill, depth, sy, rx, ry, mug: !!o.mug }; }
KINDS.coffee = {
  info(o, view) {
    const mug = !!o.mug, top = view === 'top', G = CUPG[mug ? 'mug' : 'paper'], gg = coffeeGeo(o);
    if (top) return { bbox: [-84, -84, 96, 96], w: 120, h: 120, top: [0, 0], hot: [0, 0], key: 'T' + (mug ? 'm' : 'p'), q: gg };
    return { bbox: mug ? [-72, -144, 124, 24] : [-76, -150, 76, 24], w: mug ? 190 : 120, h: 100, top: [0, G.rimY], hot: [0, gg.sy - 3 - 22 * sstep(.6, 1, gg.thick) * sstep(.6, .95, gg.fill)], key: (mug ? 'm' : 'p'), q: gg };
  },
  paint(g, o, view, info, shadow) {
    const G = CUPG[info.q.mug ? 'mug' : 'paper'];
    if (view === 'top') {
      if (shadow) shade(g, 4, 6, 72, 70, .36);
      if (info.q.mug) { g.beginPath(); g.moveTo(46, -8); g.bezierCurveTo(96, -26, 96, 34, 44, 18); g.lineWidth = 17; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 11.5; g.strokeStyle = '#f4efe4'; g.stroke(); }
      g.beginPath(); g.arc(0, 0, 56, 0, TAU); g.fillStyle = rgr(g, -18, -22, 8, 0, 0, 58, [[0, '#ffffff'], [.8, '#efe8d8'], [1, '#c9bda8']]); g.fill(); ink(g, 3.6);
      g.beginPath(); g.arc(0, 0, 49, 0, TAU); g.fillStyle = '#d9d0c0'; g.fill(); ink(g, 2); return;
    }
    cupPaint(g, G, info.q.mug, shadow);
  },
  live(c, o, view, info, t) {
    const gg = info.q, G = gg.G, th = gg.thick, seed = o.seed || 0;
    if (view === 'top') {
      c.beginPath(); c.arc(0, 0, 45, 0, TAU); c.fillStyle = rgr(c, -10, -12, 4, 0, 0, 46, [[0, liqCol(th, 1)], [.35, liqCol(th, 0)], [1, liqCol(th, 0)]]); c.fill();
      spot(c, -14, -16, 14, 5, -.7, .55 * (1 - th * .7)); c.beginPath(); c.arc(0, 0, 45, 0, TAU); ink(c, 2, 'rgba(28,20,14,.45)');
      if (th > .8) { c.beginPath(); for (let i = 0; i < 40; i++) { const a = i * .4, r = 2 + i * .95; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * .95); } c.strokeStyle = 'rgba(255,240,210,.35)'; c.lineWidth = 2; c.stroke(); }
      return;
    }
    const rim = () => ellp(c, 0, G.rimY, G.rimRx - G.wall + 1, G.rimRy - 2);
    const dome = 24 * sstep(.6, 1, th) * sstep(.6, .95, gg.fill);
    c.save(); rim(); c.clip();
    c.beginPath(); c.ellipse(0, gg.sy, gg.rx, gg.ry, 0, 0, TAU); c.fillStyle = rgr(c, -gg.rx * .25, gg.sy - gg.ry * .3, 2, 0, gg.sy, gg.rx, [[0, liqCol(th, 1)], [.4, liqCol(th, 0)], [1, mix(liqCol(th, 0), '#000000', .3)]]); c.fill();
    c.beginPath(); c.ellipse(0, gg.sy, gg.rx, gg.ry, 0, 0, TAU); c.lineWidth = 3; c.strokeStyle = rgba(liqCol(th, 1), .8); c.stroke();                      /* the meniscus ring */
    const rip = (1 - th) * (1 - th), kq = (t * (.5 + .3 * rnd(seed, 3)) + rnd(seed, 4)) % 1;
    if (rip > .02) { c.beginPath(); c.ellipse(0, gg.sy, gg.rx * (.15 + .75 * kq), gg.ry * (.15 + .75 * kq), 0, 0, TAU); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,225,185,' + (.3 * rip * (1 - kq)) + ')'; c.stroke(); }
    const sw = sstep(.25, .55, th) * (1 - sstep(.88, 1, th));
    if (sw > .02) { c.beginPath(); const rot = t * .12; for (let i = 0; i <= 46; i++) { const a = i * .34 + rot, r = .06 + i * .02; c.lineTo(Math.cos(a) * gg.rx * r, gg.sy + Math.sin(a) * gg.ry * r); } c.lineWidth = 2.6; c.strokeStyle = 'rgba(255,214,140,' + (.5 * sw) + ')'; c.stroke(); }
    c.restore();
    if (dome > .5) {                                                                                                                                             /* pudding heaps above the rim */
      const rx0 = G.rimRx - G.wall + 1, ry0 = G.rimRy - 2, y0 = G.rimY;
      c.beginPath(); c.moveTo(-rx0, y0); c.bezierCurveTo(-rx0 * 1.02, y0 - dome * 1.35, rx0 * 1.02, y0 - dome * 1.35, rx0, y0); c.ellipse(0, y0, rx0, ry0, 0, 0, PI); c.closePath();
      c.fillStyle = rgr(c, -rx0 * .3, y0 - dome * .9, 3, 0, y0 - dome * .3, rx0 * 1.1, [[0, liqCol(1, 1)], [.5, liqCol(1, 0)], [1, mix(liqCol(1, 0), '#000', .25)]]); c.fill();
      c.beginPath(); c.moveTo(-rx0, y0); c.bezierCurveTo(-rx0 * 1.02, y0 - dome * 1.35, rx0 * 1.02, y0 - dome * 1.35, rx0, y0); ink(c, 3.2);
      spot(c, -rx0 * .3, y0 - dome * .78, rx0 * .3, dome * .1, -.2, .35, '#fff3d8');
    }
    c.beginPath(); c.ellipse(0, G.rimY, G.rimRx, G.rimRy, 0, 0, PI); c.lineWidth = 3.6; c.strokeStyle = OUT; c.stroke();                                          /* the front lip over the liquid */
    c.beginPath(); c.ellipse(0, G.rimY - 1, G.rimRx - 4, G.rimRy - 3, 0, .25, PI - .25); c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke();
    const gl = (1 - th * .85) * .6; if (gl > .05) spot(c, -gg.rx * .38, gg.sy - gg.ry * .28 - dome * .2, gg.rx * .3, 3.2, -.12, gl);            /* the specular streak */
  },
  steam(o, info) { const th = info.q.thick, p = 1 - sstep(.45, .78, th); return p > .02 ? { w: 38, h: 120, power: p, curl: .7 } : null; },
};

/* ================================================================== stickers and labels */
/* F19.sticker(ctx, { kind, x, y, s, rot, text, t, t0, hero }): (x, y) = the centre. kind: 'note' (yellow sticky note, handwriting font, text may hold \n), 'sticker' (a round FUN COMMITTEE style badge with a tiny turkey; the first word goes
 * on the first line, the rest on the second), 'label' (a white allergen label: "CONTAINS: BREAD" puts CONTAINS: small and the rest big; a barcode strip), 'tag' (a hang tag on a string), 'clip' (a binder clip, no text).
 * t0 (optional): the moment it is stuck on: it slaps down over .2 s (scale 1.3 to 1, a small rotation settle); nothing is drawn before t0. Text is drawn live through the UI kit: set dressing unless hero: true.
 * Returns the axis-aligned box [x0, y0, x1, y1] of the sticker (in the current transform). */
/* the best line breaks for a short text in a box: every split by words is tried, the one whose common size is largest wins (fewer lines on a tie). Uses the UI kit's measuring when it is there. A '\n' in the text fixes the breaks. */
const FITC = new Map();
function fitLines(text, maxW, font, weight, maxSize, minSize) {
  const key = text + '|' + maxW + '|' + font + '|' + maxSize; let r = FITC.get(key); if (r) return r;
  const hard = text.split('\n').map(x => x.trim()).filter(Boolean), words = text.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
  const cands = hard.length > 1 ? [hard] : [[words.join(' ')]];
  if (hard.length <= 1) for (let i = 1; i < words.length; i++) cands.push([words.slice(0, i).join(' '), words.slice(i).join(' ')]);
  const sizeOf = ln => (typeof UI !== 'undefined' && UI.fit) ? Math.min(maxSize, UI.fit(ln, maxW, { size: maxSize, font, weight, min: minSize }).size) : Math.min(maxSize, maxW / Math.max(1, ln.length * .6));
  let best = null;
  for (const lines of cands) { let size = maxSize; for (const ln of lines) size = Math.min(size, sizeOf(ln)); const score = size - (lines.length - 1) * 1.5; if (!best || score > best.score) best = { lines, size, score }; }
  if (!best) best = { lines: [''], size: maxSize, score: 0 };
  if (FITC.size > 300) FITC.clear(); FITC.set(key, best); return best;
}
const STK = { note: [118, 108], sticker: [118, 118], label: [150, 70], tag: [112, 74], clip: [64, 76] };
F19.sticker = function sticker(c, o = {}) {
  const kind = STK[o.kind] ? o.kind : 'note', bw = STK[kind][0], bh = STK[kind][1], s0 = o.s == null ? 1 : +o.s, t = +o.t || 0;
  let k = 1, settle = 0;
  if (o.t0 != null) { if (t < o.t0) return null; const u = clamp01((t - o.t0) / .2); k = lerp(1.3, 1, ease.out(u)); settle = (1 - ease.out(u)) * .08; }
  const s = s0 * k, rot = (+o.rot || 0) + settle, x = +o.x || 0, y = +o.y || 0, hero = o.hero === true;
  const ca = Math.abs(Math.cos(rot)), sa = Math.abs(Math.sin(rot)), hw = (bw * ca + bh * sa) * s / 2, hh = (bw * sa + bh * ca) * s / 2, box = [x - hw, y - hh, x + hw, y + hh];
  if (!(s0 * k >= .02)) return box;
  const alpha = o.alpha == null ? 1 : clamp01(o.alpha);
  if (alpha <= .004) return box;
  c.save(); clean(c); c.translate(x, y); c.rotate(rot); c.scale(s, s); if (alpha < 1) c.globalAlpha = alpha;
  const tilt = Math.abs(rot) + .2, text = String(o.text == null ? '' : o.text), txt = (str, cx, cy, op) => lab(str, cx, cy, Object.assign({ tilt }, op), hero);
  if (kind === 'note') {
    const w = bw, h = bh;
    shade(c, 4, h / 2 + 2, w * .55, 9, .3);
    c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2 - 16); c.quadraticCurveTo(w / 2 - 2, h / 2 - 2, w / 2 - 18, h / 2); c.lineTo(-w / 2, h / 2); c.closePath();
    c.fillStyle = lgr(c, 0, -h / 2, 0, h / 2, [[0, '#ffee7a'], [1, '#ffd93c']]); c.fill(); ink(c, 2.6);
    c.beginPath(); c.moveTo(w / 2 - 18, h / 2); c.quadraticCurveTo(w / 2 - 4, h / 2 - 3, w / 2, h / 2 - 16); c.quadraticCurveTo(w / 2 - 16, h / 2 - 14, w / 2 - 18, h / 2); c.fillStyle = '#e8b81c'; c.fill(); ink(c, 2);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 10);
    const fl = fitLines(text, w - 24, 'Lucky', 400, 30, 12), n = fl.lines.length;
    fl.lines.forEach((ln, i) => txt(ln, 0, (i - (n - 1) / 2) * fl.size * 1.22 + 3, { size: fl.size, font: 'Lucky', weight: 400, fill: '#2a3a78', maxW: w - 20 }));
  } else if (kind === 'sticker') {
    const r = 58, N = 16;
    c.beginPath(); for (let i = 0; i <= N * 4; i++) { const a = TAU * i / (N * 4), rr_ = r * (1 + .045 * Math.cos(a * N)); c.lineTo(Math.cos(a) * rr_, Math.sin(a) * rr_); } c.closePath();
    c.fillStyle = rgr(c, -18, -22, 6, 0, 0, r * 1.05, [[0, '#f59a4a'], [1, '#d9591e']]); c.fill(); ink(c, 3);
    c.beginPath(); c.arc(0, 0, r * .82, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,240,210,.85)'; c.stroke();
    c.save(); c.translate(0, -23);                                                                                                   /* the tiny turkey */
    for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i - 2) * .42; c.save(); c.rotate(a + PI / 2); c.beginPath(); c.ellipse(0, -15, 4.6, 12, 0, 0, TAU); c.fillStyle = ['#e0492f', '#f0a22a', '#fbd14a', '#f0a22a', '#e0492f'][i]; c.fill(); ink(c, 1.4); c.restore(); }
    c.beginPath(); c.ellipse(0, 3, 10, 9, 0, 0, TAU); c.fillStyle = '#8a5530'; c.fill(); ink(c, 1.8); c.beginPath(); c.arc(0, -4, 4.6, 0, TAU); c.fillStyle = '#a06a3c'; c.fill(); ink(c, 1.4);
    c.fillStyle = '#e8402f'; c.beginPath(); c.arc(2.5, 0.4, 1.4, 0, TAU); c.fill(); c.restore();
    const words = text.trim().split(/\s+/), l1 = words.length > 1 ? words[0] : text, l2 = words.length > 1 ? words.slice(1).join(' ') : '';
    txt(l1, 0, 12, { size: 21, font: 'Nunito', weight: 900, fill: '#fff6dc', stroke: '#7a2e0e', lw: 3.4, spacing: 1.5, maxW: 84 });
    if (l2) txt(l2, 0, 32, { size: 15, font: 'Nunito', weight: 900, fill: '#fff6dc', stroke: '#7a2e0e', lw: 3, spacing: .6, maxW: 88 });
  } else if (kind === 'label') {
    const w = bw, h = bh;
    shade(c, 2, h / 2 + 1, w * .5, 6, .25);
    rrp(c, -w / 2, -h / 2, w, h, 5); c.fillStyle = '#fdfdfa'; c.fill(); ink(c, 2.2, 'rgba(60,56,50,.7)');
    c.fillStyle = '#c8281e'; c.fillRect(-w / 2 + 4, -h / 2 + 4, 7, h - 24);                                                           /* a red allergen bar */
    const ci = text.indexOf(':'), a = ci > 0 ? text.slice(0, ci + 1) : '', b = ci > 0 ? text.slice(ci + 1).trim() : text;
    if (a) txt(a, 7, -h / 2 + 15, { size: 14, font: 'Nunito', weight: 900, fill: '#2a2622', spacing: .8, maxW: w - 34 });
    txt(b, 7, a ? -h / 2 + 33 : -h / 2 + 24, { size: 27, font: 'Nunito', weight: 900, fill: '#1c1814', spacing: 1, maxW: w - 34 });
    let hx = 0; for (let i = 0; i < text.length; i++) hx = (hx * 31 + text.charCodeAt(i)) >>> 0;
    c.fillStyle = '#25211d'; let bx = -w / 2 + 16; for (let i = 0; i < 34 && bx < w / 2 - 10; i++) { const bwid = 1 + ((hx >> (i % 24)) & 1) + (i % 5 === 0 ? 1 : 0); c.fillRect(bx, h / 2 - 17, bwid, 11); bx += bwid + 1.4 + ((hx >> ((i * 3) % 20)) & 1); }
  } else if (kind === 'tag') {
    const w = bw, h = bh;
    shade(c, 3, h / 2 + 1, w * .5, 6, .25);
    c.beginPath(); c.moveTo(-w / 2 + 18, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.lineTo(-w / 2, -h / 2 + 18); c.closePath();
    c.fillStyle = lgr(c, 0, -h / 2, 0, h / 2, [[0, '#f8f0da'], [1, '#e6d8b4']]); c.fill(); ink(c, 2.4);
    c.beginPath(); c.arc(-w / 2 + 20, -h / 2 + 18, 5.2, 0, TAU); c.fillStyle = 'rgba(70,56,36,.8)'; c.fill(); ink(c, 1.6);
    c.beginPath(); c.moveTo(-w / 2 + 20, -h / 2 + 18); c.bezierCurveTo(-w / 2 - 6, -h / 2 - 10, -w / 2 - 34, -h / 2 - 22, -w / 2 - 44, -h / 2 - 10); c.lineWidth = 2.4; c.strokeStyle = '#8a7a58'; c.stroke();
    txt(text, 6, 8, { size: 31, font: 'Nunito', weight: 900, fill: '#2f2418', maxW: w - 36 });
  } else {
    c.save(); c.lineCap = 'round';                                                                                                       /* a binder clip: silver wire handles, black body */
    c.beginPath(); c.moveTo(-18, -4); c.bezierCurveTo(-34, -40, -12, -52, 0, -50); c.bezierCurveTo(12, -52, 34, -40, 18, -4); c.lineWidth = 6.2; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 3.4; c.strokeStyle = '#d8dde4'; c.stroke();
    c.beginPath(); c.moveTo(-30, 34); c.lineTo(-18, -8); c.lineTo(18, -8); c.lineTo(30, 34); c.quadraticCurveTo(0, 42, -30, 34); c.closePath(); c.fillStyle = lgr(c, -30, 0, 30, 0, [[0, '#4a4a54'], [.5, '#25252c'], [1, '#101016']]); c.fill(); ink(c, 2.6);
    c.beginPath(); c.moveTo(-20, 28); c.lineTo(-12, -2); c.lineWidth = 2.4; c.strokeStyle = 'rgba(255,255,255,.3)'; c.stroke(); c.restore();
  }
  c.restore();
  return box;
};
// ================================================================== batch 2: the turkey family
/* a white platter with a gold ring: ellipse (0, cy), radii rx, ry */
function platter(g, rx, ry, cy, shadow) {
  if (shadow) shade(g, 0, cy + ry * .5, rx * 1.1, ry * .8, .44);
  g.beginPath(); g.ellipse(0, cy + 9, rx, ry, 0, 0, TAU); fillInk(g, '#cfc7b4', 3.2);
  g.beginPath(); g.ellipse(0, cy, rx, ry, 0, 0, TAU); g.fillStyle = lgr(g, -rx, cy - ry, rx, cy + ry, [[0, '#ffffff'], [.55, '#f6f2e8'], [1, '#d8d0bd']]); g.fill(); ink(g, 3.4);
  g.beginPath(); g.ellipse(0, cy + 1, rx * .9, ry * .88, 0, 0, TAU); g.lineWidth = 3; g.strokeStyle = '#d4a94c'; g.stroke();
  g.beginPath(); g.ellipse(0, cy + 2, rx * .8, ry * .78, 0, 0, TAU); g.fillStyle = lgr(g, 0, cy - ry, 0, cy + ry, [[0, '#e7e0cf'], [.5, '#f4efe3'], [1, '#fbf8f0']]); g.fill(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(120,108,86,.4)'; g.stroke();
  g.beginPath(); g.ellipse(0, cy, rx * .96, ry * .95, 0, PI * 1.08, PI * 1.5); g.lineWidth = 3.4; g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke();
}
function parsley(g, x, y, s, k) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 10; i++) { const a = -PI + PI * (i + rnd(k, i) * .6) / 9, r = 9 + 9 * rnd(k, i + 20); g.save(); g.rotate(a); g.translate(r, 0); g.beginPath(); g.ellipse(0, 0, 11, 6.5, 0, 0, TAU); g.fillStyle = ['#4f8f3a', '#3c7a2e', '#6aaa4a'][i % 3]; g.fill(); ink(g, 1.6, 'rgba(20,50,16,.6)'); g.restore(); }
  g.restore();
}
function berry(g, x, y, r) {
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = rgr(g, x - r * .35, y - r * .4, r * .1, x, y, r * 1.05, [[0, '#f0675e'], [.55, '#c62a34'], [1, '#7c1020']]); g.fill(); ink(g, 1.8); spot(g, x - r * .35, y - r * .4, r * .28, r * .17, -.6, .85);
}
function orangeSlice(g, x, y, r) {
  g.save(); g.translate(x, y); g.beginPath(); g.ellipse(0, 0, r, r * .62, -.1, 0, TAU); g.fillStyle = '#f4a028'; g.fill(); ink(g, 2); g.beginPath(); g.ellipse(0, 0, r * .8, r * .48, -.1, 0, TAU); g.fillStyle = '#fbc24c'; g.fill();
  g.strokeStyle = 'rgba(255,240,200,.85)'; g.lineWidth = 1.6; for (let i = 0; i < 6; i++) { const a = i * PI / 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * .76, Math.sin(a) * r * .46); g.stroke(); } g.restore();
}
const TMAT = {
  roast: { top: '#fbcb6c', mid: '#e89a3e', low: '#c0701f', deep: '#82401a', edge: 'rgba(100,42,8,.5)', leg0: '#eaa646', leg1: '#b46a22', wing: '#d28028', hi: '#fff4d2', line: 'rgba(110,52,12,.5)' },
  mold: { top: '#f1e6cc', mid: '#d9c7a3', low: '#c4ad84', deep: '#a48c62', edge: 'rgba(140,116,76,.5)', leg0: '#e0cfab', leg1: '#c2aa7e', wing: '#cdb88f', hi: '#fbf5e4', line: 'rgba(150,126,86,.6)' },
};
const BODY_PTS = [[-98, -58], [-95, -96], [-70, -133], [-30, -151], [30, -151], [70, -133], [95, -96], [98, -58], [84, -40], [40, -31], [-40, -31], [-84, -40]];
/* a drumstick on the left (mirror with g.scale(-1, 1)): the meaty thigh at P0 (in front of the body), the bone tip at P1 */
function drumstick(g, M, mold) {
  const P0 = [-74, -56], P1 = [-136, -88], r0 = 28, r1 = 12, dx = P1[0] - P0[0], dy = P1[1] - P0[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  /* one path of three parts (two circles and the quad between them); all wound the same way, or the overlaps cancel under the nonzero rule and the leg turns see-through */
  const quad = [[P0[0] + nx * r0, P0[1] + ny * r0], [P1[0] + nx * r1, P1[1] + ny * r1], [P1[0] - nx * r1, P1[1] - ny * r1], [P0[0] - nx * r0, P0[1] - ny * r0]];
  let area = 0; for (let i = 0; i < 4; i++) { const a = quad[i], b = quad[(i + 1) % 4]; area += a[0] * b[1] - b[0] * a[1]; } if (area < 0) quad.reverse();
  const shape = () => { g.beginPath(); g.arc(P0[0], P0[1], r0, 0, TAU); g.moveTo(P1[0] + r1, P1[1]); g.arc(P1[0], P1[1], r1, 0, TAU); g.moveTo(quad[0][0], quad[0][1]); g.lineTo(quad[1][0], quad[1][1]); g.lineTo(quad[2][0], quad[2][1]); g.lineTo(quad[3][0], quad[3][1]); g.closePath(); };
  const bx = P1[0] + ux * 20, by = P1[1] + uy * 20;
  if (!mold) {                                                                                                                 /* the bone and its knuckle */
    g.beginPath(); g.moveTo(P1[0], P1[1]); g.lineTo(bx, by); g.lineWidth = 13; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 8.2; g.strokeStyle = '#f6efdc'; g.stroke();
    g.beginPath(); g.arc(bx + ny * 4.4, by - nx * 4.4, 6.2, 0, TAU); g.arc(bx - ny * 4.4, by + nx * 4.4, 6.2, 0, TAU); fillInk(g, '#f6efdc', 2.2);
  }
  g.lineJoin = 'round'; shape(); g.lineWidth = 7; g.strokeStyle = OUT; g.stroke(); shape(); g.fillStyle = lgr(g, P0[0] - r0, P0[1] - r0, P0[0] + r0, P0[1] + r0, [[0, M.leg0], [1, M.leg1]]); g.fill();
  g.save(); shape(); g.clip(); g.fillStyle = lgr(g, 0, P0[1] - r0, 0, P0[1] + r0, [[0, 'rgba(255,255,255,.12)'], [.5, 'rgba(0,0,0,0)'], [1, M.edge]]); g.fillRect(-200, -200, 200, 200); g.restore();
  spot(g, P0[0] - 9, P0[1] - 15, 14, 5, -.6, mold ? .35 : .65, M.hi);
  g.beginPath(); g.moveTo(P1[0] + ux * -16 + nx * 5, P1[1] - uy * 16 + ny * 5); g.quadraticCurveTo(P1[0] - ux * 30 + nx * 8, P1[1] - uy * 30 + ny * 8, P1[0] - ux * 40 + nx * 14, P1[1] - uy * 40 + ny * 14); g.lineWidth = 2; g.strokeStyle = M.line; g.stroke();
  if (!mold) {                                                                                                                 /* the white paper frill */
    g.save(); g.translate(bx + ux * 4, by + uy * 4); g.rotate(Math.atan2(dy, dx));
    g.beginPath(); g.moveTo(-6, -13); g.lineTo(2, -17); g.lineTo(0, -12); g.lineTo(8, -14); g.lineTo(5, -8); g.lineTo(13, -8); g.lineTo(8, -3); g.lineTo(15, 0); g.lineTo(8, 3); g.lineTo(13, 8); g.lineTo(5, 8); g.lineTo(8, 14); g.lineTo(0, 12); g.lineTo(2, 17); g.lineTo(-6, 13); g.closePath();
    g.fillStyle = '#fffdf6'; g.fill(); ink(g, 2); g.restore();
  } else {                                                                                                                      /* a piped rosette at the tip */
    for (let i = 0; i < 7; i++) { const a = i * TAU / 7; g.beginPath(); g.arc(bx + Math.cos(a) * 6.6, by + Math.sin(a) * 6.6, 4.6, 0, TAU); fillInk(g, M.top, 1.6, M.line); }
    g.beginPath(); g.arc(bx, by, 5, 0, TAU); fillInk(g, M.mid, 1.6, M.line);
  }
}
function wing(g, M, mold) {
  const pts = [[-76, -130], [-92, -118], [-98, -98], [-90, -84], [-74, -98], [-68, -120]];
  smooth(g, pts, true, .55); g.fillStyle = lgr(g, -112, -128, -82, -80, [[0, M.wing], [1, M.leg1]]); g.fill(); ink(g, 3);
  g.strokeStyle = M.line; g.lineWidth = 2; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-90 + i * 6, -108 + i * 3); g.quadraticCurveTo(-87 + i * 6, -100, -84 + i * 5, -90); g.stroke(); }
  spot(g, -84, -118, 3.6, 8, .4, mold ? .3 : .5, M.hi);
}
/* the whole bird on its platter. mold = the beige puree version (same shape, piped detail). carveN 0..6 = slices taken off the right side (the option `carve` 0..1 is quantised to sixths). */
function turkeyDraw(g, mold, shadow, carveN, shine, bare) {
  const M = mold ? TMAT.mold : TMAT.roast;
  if (bare) { if (shadow) shade(g, 0, 0, 134, 18, .44); g.save(); g.translate(0, 27); } else platter(g, 168, 36, -26, shadow);
  if (bare) { /* no platter, no garnish */ }
  else if (!mold) { parsley(g, -128, -46, 1.1, 1); parsley(g, 130, -48, 1.1, 2); parsley(g, -54, -50, .8, 3); parsley(g, 56, -50, .8, 4); }
  else { for (let i = 0; i < 9; i++) { const u = (i + .5) / 9 - .5, bx = u * 250, by = -26 + 27 * Math.sqrt(Math.max(0, 1 - Math.pow(u * 2 * .93, 2))) * .6; g.beginPath(); g.arc(bx, by + 8, 6.4, 0, TAU); fillInk(g, M.top, 1.8, M.line); } }
  /* the body: an egg, wide at the platter, a rounded breast on top */
  smooth(g, BODY_PTS, true, .6);
  g.fillStyle = lgr(g, 0, -152, 0, -31, [[0, M.top], [.4, M.mid], [.8, M.low], [1, M.deep]]); g.fill();
  g.save(); smooth(g, BODY_PTS, true, .6); g.clip();
  g.fillStyle = rgr(g, 0, -92, 30, 0, -92, 110, [[0, 'rgba(0,0,0,0)'], [.65, 'rgba(0,0,0,0)'], [1, M.edge]]); g.fillRect(-120, -170, 240, 150);        /* the darker crust toward the edge */
  if (!mold) { for (let i = 0; i < 70; i++) { const x = (rnd(11, i) - .5) * 180, y = -146 + rnd(12, i) * 100; g.fillStyle = 'rgba(110,50,12,' + (.12 + .2 * rnd(13, i)) + ')'; g.beginPath(); g.arc(x, y, .9 + 1.6 * rnd(14, i), 0, TAU); g.fill(); } }
  g.beginPath(); g.moveTo(0, -148); g.quadraticCurveTo(-6, -96, 2, -36); g.lineWidth = mold ? 3 : 4.4; g.strokeStyle = M.line; g.lineCap = 'round'; g.stroke();            /* the breastbone line */
  g.restore();
  g.save(); wing(g, M, mold); g.scale(-1, 1); wing(g, M, mold); g.restore();
  if (carveN > 0) {                                                                                                                    /* carved: the cut face on the right of the breast, a bone, slices lying beside it */
    const n = carveN, cx = 54 - 3 * n, cy = -94, rx = 8 + 7 * n, ry = 26 + 3 * n;
    g.save(); g.translate(cx, cy); g.rotate(.14); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fillStyle = lgr(g, -rx, -ry, rx, ry, [[0, '#fbebd0'], [1, '#e8cca0']]); g.fill(); g.lineWidth = 6.5; g.strokeStyle = '#c9782a'; g.stroke(); ink(g, 2.4);
    g.save(); g.beginPath(); g.ellipse(0, 0, rx - 2, ry - 2, 0, 0, TAU); g.clip(); g.strokeStyle = 'rgba(190,140,90,.55)'; g.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * rx / 3.4, -ry); g.quadraticCurveTo(i * rx / 3.4 + 6, 0, i * rx / 3.4 - 2, ry); g.stroke(); } g.restore();
    if (n >= 4) { g.beginPath(); g.moveTo(-rx * .45, -ry * .8); g.quadraticCurveTo(-rx * .1, 0, -rx * .45, ry * .8); g.lineWidth = 8; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 4.6; g.strokeStyle = '#f6efdc'; g.stroke(); }
    g.restore();
  }
  /* the legs sit in front of the body's lower sides */
  g.save(); drumstick(g, M, mold); g.restore(); g.save(); g.scale(-1, 1); drumstick(g, M, mold); g.restore();
  if (carveN > 0) for (let i = 0; i < Math.min(carveN, 4); i++) { g.save(); g.translate(60 + i * 14, -20 + i * 2); g.rotate(-.2); g.beginPath(); g.ellipse(0, 0, 33, 12, 0, 0, TAU); g.fillStyle = '#f6e3c4'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#cf8630'; g.stroke(); ink(g, 2.2); g.restore(); }
  /* the glaze */
  if (!mold) { spot(g, -34, -128, 34, 6, -.3, .62, M.hi); spot(g, 42, -136, 16, 4, .2, .5, M.hi); spot(g, -72, -100, 5, 16, .4, .38, M.hi); spot(g, 26, -86, 3, 10, .2, .3, M.hi); }
  else { g.save(); g.globalAlpha = .75 * shine; g.fillStyle = rgr(g, -34, -124, 2, -34, -120, 56, [[0, 'rgba(255,252,238,.95)'], [1, 'rgba(255,252,238,0)']]); g.beginPath(); g.ellipse(-34, -122, 56, 28, -.2, 0, TAU); g.fill(); g.restore(); spot(g, -50, -134, 20, 4, -.3, .8 * shine, '#fffdf2'); }
  smooth(g, BODY_PTS, true, .6); ink(g, 3.6);
  if (mold) {                                                                                                                         /* piped detail: a rope along the breastbone, rosettes, a scalloped hem */
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-2 + i * .6, -140 + i * 15, 5, 0, TAU); fillInk(g, M.top, 1.6, M.line); }
    for (const [px, py] of [[-46, -108], [44, -108], [-66, -80], [64, -80]]) { for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(px + Math.cos(a) * 5.4, py + Math.sin(a) * 5.4, 3.6, 0, TAU); fillInk(g, M.top, 1.4, M.line); } g.beginPath(); g.arc(px, py, 3.8, 0, TAU); fillInk(g, M.mid, 1.4, M.line); }
    for (let i = 0; i < 11; i++) { const u = i / 10, px = -66 + u * 132, py = -36 + 6 * Math.sin(PI * u); g.beginPath(); g.arc(px, py, 5.2, 0, TAU); fillInk(g, M.top, 1.6, M.line); }
  } else if (!bare) {
    berry(g, -100, -22, 8); berry(g, -84, -16, 8); orangeSlice(g, -46, -12, 20); berry(g, 4, -10, 8); parsley(g, 24, -8, .85, 5); orangeSlice(g, 62, -13, 20); berry(g, 104, -18, 8); berry(g, 120, -25, 8);   /* the front garnish */
  }
  if (bare) g.restore();
}
KINDS.turkey = {
  info(o) { const q = Math.round(clamp01(o.carve || 0) * 6), b = !!o.bare; return { bbox: [-190, -190, 190, 36], w: 340, h: 170, top: [0, -154 + (b ? 27 : 0)], hot: [0, -140 + (b ? 27 : 0)], key: 'c' + q + (b ? 'b' : ''), q: { carve: q, bare: b } }; },
  paint(g, o, view, info, shadow) { turkeyDraw(g, false, shadow, info.q.carve, 1, info.q.bare); },
  steam() { return { w: 120, h: 150, power: .6, curl: .6 }; },
};
KINDS.turkeyMold = {
  info(o) { const sh = Math.round(clamp01(o.shine == null ? .6 : o.shine) * 8), b = !!o.bare; return { bbox: [-190, -190, 190, 36], w: 340, h: 170, top: [0, -154 + (b ? 27 : 0)], hot: [0, -140 + (b ? 27 : 0)], key: 's' + sh + (b ? 'b' : ''), q: { shine: sh / 8, bare: b } }; },
  paint(g, o, view, info, shadow) { turkeyDraw(g, true, shadow, 0, info.q.shine, info.q.bare); },
  steam() { return { w: 100, h: 120, power: .22, curl: .5 }; },
};
/* a slice: a plump oval of white meat with a golden skin edge along the top; pieces for the chop; a crumbly mound; a smooth beige scoop */
function sliceShape(g, x, y, rot, s, shade_) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.ellipse(0, 0, 46, 27, 0, 0, TAU); g.fillStyle = lgr(g, -40, -24, 40, 24, [[0, '#fbeacd'], [1, shade_ || '#e6c79a']]); g.fill();
  g.beginPath(); g.ellipse(0, 0, 46, 27, 0, PI * 1.02, PI * 1.98); g.lineWidth = 7; g.strokeStyle = '#cf8630'; g.lineCap = 'round'; g.stroke();
  g.save(); g.beginPath(); g.ellipse(0, 0, 44, 25, 0, 0, TAU); g.clip(); g.strokeStyle = 'rgba(200,150,100,.5)'; g.lineWidth = 1.5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(-44, i * 7); g.quadraticCurveTo(0, i * 7 + 4, 44, i * 7 - 2); g.stroke(); } g.restore();
  g.beginPath(); g.ellipse(0, 0, 46, 27, 0, 0, TAU); ink(g, 2.8); spot(g, -14, -12, 14, 3, -.2, .35, '#fffaf0'); g.restore();
}
/* a platter, or with `bare` just a contact shadow and everything lowered by dy (a dish that sits on a plate of its own) */
function seat(g, bare, rx, ry, cy, dy, shadow) { if (bare) { if (shadow) shade(g, 0, 0, rx * .8, ry * .55, .42); g.translate(0, dy); } else platter(g, rx, ry, cy, shadow); }
KINDS.turkeySlices = {
  info(o) { const n = Math.max(3, Math.min(10, Math.round(o.n == null ? 7 : o.n))), b = !!o.bare; return { bbox: [-190, -150, 190, 36], w: 340, h: 110, top: [0, -92 + (b ? 24 : 0)], hot: [0, -80 + (b ? 24 : 0)], key: 'n' + n + (b ? 'b' : ''), q: { n, bare: b } }; },
  paint(g, o, view, info, shadow) {
    const n = info.q.n, bare = info.q.bare; g.save(); seat(g, bare, 168, 36, -26, 24, shadow); if (!bare) { parsley(g, -132, -48, 1.05, 6); parsley(g, 134, -50, 1.05, 7); }
    for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - .5 : 0; sliceShape(g, u * 236, -44 - 14 * (1 - 4 * u * u) + 4 * Math.sin(i * 2.1), u * .95, 1, i % 2 ? '#e9cca0' : '#efd5ac'); }
    if (!bare) { berry(g, -100, -16, 8); berry(g, -84, -11, 8); orangeSlice(g, 90, -12, 19); berry(g, 118, -20, 8); }
    g.restore();
  },
  steam() { return { w: 140, h: 120, power: .5, curl: .6 }; },
};
KINDS.turkeyChop = {
  info(o) { const b = !!o.bare; return { bbox: [-170, -140, 170, 36], w: 300, h: 120, top: [0, -100 + (b ? 22 : 0)], hot: [0, -90 + (b ? 22 : 0)], key: 'k' + (o.seed || 0) + (b ? 'b' : ''), q: { bare: b } }; },
  paint(g, o, view, info, shadow) {
    g.save(); seat(g, info.q.bare, 150, 33, -24, 22, shadow); const cols = ['#ecd2a8', '#e0bd8a', '#f2dfbd', '#cf9f58', '#d9b27a'], pcs = [];
    for (let i = 0; i < 58; i++) { const u = rnd(31, i) * 2 - 1, x = u * 86, hh = 78 * Math.pow(Math.max(0, 1 - Math.pow(x / 92, 2)), .8); pcs.push({ x, y: -34 - rnd(32, i) * hh + 8 * rnd(33, i), k: i }); }
    pcs.sort((a, b) => a.y - b.y).forEach(p => { const r = 11 + 8 * rnd(34, p.k), a = rnd(35, p.k) * TAU; g.save(); g.translate(p.x, p.y); g.rotate(a); g.beginPath(); for (let j = 0; j < 6; j++) { const aa = TAU * j / 6, rr_ = r * (.75 + .35 * rnd(36, p.k * 7 + j)); g.lineTo(Math.cos(aa) * rr_, Math.sin(aa) * rr_ * .8); } g.closePath(); g.fillStyle = cols[p.k % 5]; g.fill(); ink(g, 2, 'rgba(60,34,12,.7)'); if (p.k % 4 === 0) { g.beginPath(); g.moveTo(-r * .5, -r * .3); g.lineTo(r * .4, -r * .4); g.lineWidth = 3; g.strokeStyle = '#c47a2a'; g.stroke(); } g.restore(); });
    if (!info.q.bare) parsley(g, -118, -22, .8, 8);
    g.restore();
  },
  steam() { return { w: 120, h: 110, power: .45, curl: .6 }; },
};
KINDS.turkeyMince = {
  info(o) { const b = !!o.bare; return { bbox: [-170, -140, 170, 36], w: 300, h: 110, top: [0, -92 + (b ? 22 : 0)], hot: [0, -80 + (b ? 22 : 0)], key: 'm' + (o.seed || 0) + (b ? 'b' : ''), q: { bare: b } }; },
  paint(g, o, view, info, shadow) {
    g.save(); seat(g, info.q.bare, 150, 33, -24, 22, shadow); const mound = []; for (let i = 0; i < 28; i++) { const a = PI + PI * i / 27, r = 1 + .06 * (rnd(41, i) - .5); mound.push([Math.cos(a) * 92 * r, -34 + Math.sin(a) * 76 * r * (.9 + .2 * rnd(42, i))]); }
    mound.push([92, -30], [0, -26], [-92, -30]);
    smooth(g, mound, true, .45); g.fillStyle = lgr(g, 0, -110, 0, -30, [[0, '#e8cd9e'], [1, '#c79d62']]); g.fill();
    g.save(); smooth(g, mound, true, .45); g.clip();
    const cols = ['#f1dbb2', '#e0bd88', '#cf9f60', '#b8844a', '#ead2a6'];
    for (let i = 0; i < 380; i++) { const x = (rnd(43, i) * 2 - 1) * 96, y = -108 + rnd(44, i) * 84, r = 1.6 + 2.2 * rnd(45, i); g.fillStyle = cols[i % 5]; g.beginPath(); g.ellipse(x, y, r * 1.2, r, rnd(46, i) * PI, 0, TAU); g.fill(); if (i % 3 === 0) { g.fillStyle = 'rgba(50,28,10,.35)'; g.beginPath(); g.arc(x + 1, y + r * .8, r * .5, 0, TAU); g.fill(); } }
    g.fillStyle = rgr(g, 0, -60, 20, 0, -50, 110, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(70,40,12,.4)']]); g.fillRect(-100, -120, 200, 100); g.restore();
    smooth(g, mound, true, .45); ink(g, 2.8);
    g.restore();
  },
  steam() { return { w: 110, h: 100, power: .4, curl: .6 }; },
};
KINDS.turkeyPuree = {
  info(o) { const b = !!o.bare; return { bbox: [-170, -150, 170, 36], w: 300, h: 110, top: [0, -102 + (b ? 22 : 0)], hot: [0, -92 + (b ? 22 : 0)], key: 'p' + (b ? 'b' : ''), q: { bare: b } }; },
  paint(g, o, view, info, shadow) {
    g.save(); seat(g, info.q.bare, 150, 33, -24, 22, shadow); const M = TMAT.mold;
    const scoop = () => { g.beginPath(); g.moveTo(-78, -34); g.bezierCurveTo(-84, -100, -40, -120, 0, -120); g.bezierCurveTo(40, -120, 84, -100, 78, -34);
      for (let i = 0; i <= 10; i++) { const u = i / 10, x = 78 - u * 156; g.quadraticCurveTo(x + 7, -22 - (i % 2 ? 0 : 6), x - 7.8, -33 + (i % 2 ? 4 : -1)); } g.closePath(); };      /* a ruffled foot */
    scoop(); g.fillStyle = rgr(g, -26, -96, 6, 0, -70, 94, [[0, M.hi], [.35, M.top], [.7, M.mid], [1, M.low]]); g.fill(); ink(g, 3.2);
    g.save(); scoop(); g.clip(); g.strokeStyle = M.line; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-68, -50); g.quadraticCurveTo(0, -34, 68, -50); g.stroke(); g.beginPath(); g.moveTo(-56, -76); g.quadraticCurveTo(0, -62, 56, -76); g.stroke(); g.beginPath(); g.moveTo(-34, -100); g.quadraticCurveTo(0, -92, 34, -100); g.stroke(); g.restore();
    spot(g, -34, -102, 20, 6, -.55, .75, '#fffcf0');
    g.restore();
  },
  steam() { return { w: 80, h: 100, power: .25, curl: .5 }; },
};
// ------------------------------------------------------------------ the pie family (side view; the maths: ground plane (X right, Z toward the viewer), screen y = cy + Z * k - height)
const PIE = { cy: -52, R: 142, k: .23 };
function pecan(g, x, y, a, b, th, k, mold) {
  const pts = [], c_ = Math.cos(th), s_ = Math.sin(th);
  for (let i = 0; i < 14; i++) { const p = TAU * i / 14, px = a * (Math.cos(p) + .12 * Math.cos(2 * p)), py = b * Math.sin(p) * (1 - .1 * Math.cos(p)); pts.push([x + px * c_ - py * s_, y + (px * s_ + py * c_) * k]); }
  g.save(); g.translate(1.4, 3); smooth(g, pts, true, .6); g.fillStyle = mold ? 'rgba(120,96,60,.5)' : 'rgba(40,16,4,.55)'; g.fill(); g.restore();
  smooth(g, pts, true, .6); g.fillStyle = mold ? lgr(g, x - a, y - b * k, x + a, y + b * k, [[0, '#efe3c8'], [1, '#cdb88f']]) : lgr(g, x - a, y - b * k, x + a, y + b * k, [[0, '#dc9a48'], [1, '#8f5222']]); g.fill(); ink(g, 2.2, mold ? 'rgba(120,96,60,.8)' : OUT);
  g.strokeStyle = mold ? 'rgba(150,126,86,.7)' : 'rgba(70,32,10,.65)'; g.lineWidth = 1.5; g.lineCap = 'round';
  for (const off of [-.35, .35]) { g.beginPath(); for (let i = 0; i <= 6; i++) { const u = (i / 6 - .5) * 1.5, px = a * u, py = b * off * (1 - Math.abs(u) * .6); g.lineTo(x + px * c_ - py * s_, y + (px * s_ + py * c_) * k); } g.stroke(); }
  g.beginPath(); g.ellipse(x - a * .25 * c_, y - b * .35 * k, a * .32, Math.max(1.2, b * .13 * k * 2), th * .5, 0, TAU); g.fillStyle = 'rgba(255,240,200,' + (mold ? .6 : .55) + ')'; g.fill();
}
/* the cut wall of a missing wedge: edge A -> B on the top plane, extruded down by d, in layers (glaze, filling, crust) */
function cutWall(g, A, B, d, W) {
  const dx = B[0] - A[0], dy = B[1] - A[1]; if (Math.abs(dx) < 1) return;
  g.save(); g.translate(A[0], A[1]); g.transform(1, dy / dx, 0, 1, 0, 0); const x0 = Math.min(0, dx), w = Math.abs(dx);
  g.fillStyle = W.fill; g.fillRect(x0, 0, w, d);
  g.fillStyle = lgr(g, 0, 0, 0, d, [[0, W.glaze], [.18, W.fill], [.55, W.fill2], [.78, W.fill2], [.8, W.crust], [1, W.crust2]]); g.fillRect(x0, 0, w, d);
  for (let i = 0; i < 5; i++) { const px = x0 + w * (i + .5) / 5, sz = 5 + 3 * rnd(55, i); g.fillStyle = W.nut; g.beginPath(); g.ellipse(px + (rnd(56, i) - .5) * 8, d * (.18 + .22 * rnd(57, i)), sz * 1.5, sz * .8, 0, 0, TAU); g.fill(); }
  g.restore();
  g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(B[0], B[1] + d); g.lineTo(A[0], A[1] + d); g.closePath(); ink(g, 2.6);
}
const WALL_PIE = { glaze: '#a05a26', fill: '#6c3a1a', fill2: '#4f2a12', crust: '#e0a95c', crust2: '#b9792c', nut: 'rgba(190,120,50,.85)' };
const WALL_MOLD = { glaze: '#e9dcc0', fill: '#d9c7a3', fill2: '#cdb88f', crust: '#e4d4b2', crust2: '#c4ad84', nut: 'rgba(240,229,205,.9)' };
function pieDraw(g, mold, shadow, sliceQ) {
  const { cy, R, k } = PIE, Rt = 148, base = -6;
  if (shadow) shade(g, 0, 0, 168, 24, .44);
  /* the body: a foil tin, or the molded side */
  const sideTop = cy + 2, rb = mold ? 134 : 108, rtop = mold ? R : Rt;
  g.beginPath(); g.moveTo(-rtop, sideTop); g.bezierCurveTo(-rtop + 2, sideTop + 22, -rb - 8, base - 16, -rb, base); g.ellipse(0, base, rb, rb * k, 0, PI, 0, true); g.bezierCurveTo(rb + 8, base - 16, rtop - 2, sideTop + 22, rtop, sideTop); g.ellipse(0, sideTop, rtop, rtop * k, 0, 0, PI); g.closePath();
  g.fillStyle = mold ? lgr(g, -rtop, 0, rtop, 0, [[0, '#ecdfc4'], [.4, '#d9c7a3'], [1, '#b49c70']]) : lgr(g, -rtop, 0, rtop, 0, [[0, '#e4e8ee'], [.35, '#c4cad3'], [.75, '#9aa2ad'], [1, '#737b86']]); g.fill();
  g.save(); g.clip();
  g.strokeStyle = mold ? 'rgba(130,108,70,.45)' : 'rgba(60,70,84,.5)'; g.lineWidth = mold ? 2.2 : 2.6;
  for (let i = 0; i <= 44; i++) { const f = PI * i / 44, x1 = Math.cos(f) * rtop, y1 = sideTop + Math.sin(f) * rtop * k, x2 = Math.cos(f) * rb, y2 = base + Math.sin(f) * rb * k; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); if (!mold && i % 2) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(x1 + 3, y1); g.lineTo(x2 + 2, y2); g.stroke(); g.strokeStyle = 'rgba(60,70,84,.5)'; } }
  g.fillStyle = lgr(g, 0, sideTop, 0, base + 14, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(30,20,10,.32)']]); g.fillRect(-rtop, sideTop, rtop * 2, 60);
  g.restore();
  g.beginPath(); g.moveTo(-rtop, sideTop); g.bezierCurveTo(-rtop + 2, sideTop + 22, -rb - 8, base - 16, -rb, base); g.ellipse(0, base, rb, rb * k, 0, PI, 0, true); g.bezierCurveTo(rb + 8, base - 16, rtop - 2, sideTop + 22, rtop, sideTop); ink(g, 3.4);
  if (!mold) { g.beginPath(); g.ellipse(0, sideTop, Rt, Rt * k, 0, 0, TAU); g.lineWidth = 6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3.2; g.strokeStyle = '#eef0f4'; g.stroke(); }
  /* the crimped crust ring and the filling */
  const rr_ = R - 11;
  g.beginPath(); g.ellipse(0, cy, R, R * k, 0, 0, TAU); g.fillStyle = lgr(g, 0, cy - R * k, 0, cy + R * k, [[0, mold ? '#f2e8d0' : '#f0c37a'], [1, mold ? '#d4c19a' : '#d38e3c']]); g.fill(); ink(g, 3.4, mold ? 'rgba(90,70,40,.8)' : OUT);
  const fr = R - 22;
  g.beginPath(); g.ellipse(0, cy + 2, fr + 4, (fr + 4) * k, 0, 0, TAU); g.fillStyle = mold ? '#c4ad84' : '#8e5a28'; g.fill();                                                          /* the inner wall of the crust, in shade */
  g.beginPath(); g.ellipse(0, cy + 4, fr, fr * k, 0, 0, TAU); g.fillStyle = mold ? lgr(g, -fr * .5, cy - fr * k, fr * .6, cy + fr * k, [[0, '#ecdfc4'], [1, '#d4c19a']]) : rgr(g, -fr * .35, cy - fr * k * .5, 4, 0, cy + 4, fr, [[0, '#a8622a'], [.5, '#7a4119'], [1, '#52290e']]); g.fill(); ink(g, 2.4, mold ? 'rgba(120,96,60,.7)' : 'rgba(30,14,4,.7)');
  g.strokeStyle = mold ? 'rgba(130,108,70,.5)' : 'rgba(120,64,18,.6)'; g.lineWidth = 2.2; g.lineCap = 'round';
  for (let i = 0; i < 48; i++) { const f = TAU * i / 48, c_ = Math.cos(f), s_ = Math.sin(f); g.beginPath(); g.moveTo(c_ * (rr_ - 8), cy + s_ * (rr_ - 8) * k); g.lineTo(c_ * (rr_ + 9) + s_ * 2, cy + s_ * (rr_ + 9) * k - c_ * .5); g.stroke(); }
  if (mold) { for (let i = 0; i < 30; i++) { const f = TAU * i / 30; g.beginPath(); g.arc(Math.cos(f) * (R - 8), cy + Math.sin(f) * (R - 8) * k, 5.4, 0, TAU); fillInk(g, '#f2e8d0', 1.6, 'rgba(120,96,60,.8)'); } }
  /* pecans: an outer ring, an inner ring, one in the middle, back to front */
  const pcs = []; for (let i = 0; i < 12; i++) { const f = TAU * (i + .5 * rnd(60, i)) / 12; pcs.push([Math.cos(f) * fr * .74, Math.sin(f) * fr * .74, f + PI / 2 + (rnd(61, i) - .5) * .6]); }
  for (let i = 0; i < 6; i++) { const f = TAU * (i + .3) / 6; pcs.push([Math.cos(f) * fr * .4, Math.sin(f) * fr * .4, f + PI / 2 + .5]); } pcs.push([0, 0, .4]);
  pcs.sort((p, q) => p[1] - q[1]).forEach(p => pecan(g, p[0], cy + 4 + p[1] * k, 17, 9.5, p[2], k, mold));
  if (!mold) { spot(g, -fr * .45, cy - fr * k * .1, fr * .3, 3.5, -.12, .4, '#ffe9c4'); spot(g, fr * .3, cy + fr * k * .5, fr * .14, 2.2, .1, .3, '#ffe9c4'); }
  else { spot(g, -fr * .42, cy - fr * k * .15, fr * .34, 4, -.1, .55, '#fffaf0'); }
  /* a missing wedge */
  if (sliceQ > 0) {
    const f1 = 36 * PI / 180, f2 = f1 + sliceQ * 86 * PI / 180, d = 34, W = mold ? WALL_MOLD : WALL_PIE;
    const A = [0, cy + 3], B1 = [Math.cos(f1) * R, cy + Math.sin(f1) * R * k], B2 = [Math.cos(f2) * R, cy + Math.sin(f2) * R * k];
    g.save(); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B1[0], B1[1]); g.ellipse(0, cy, R, R * k, 0, f1, f2); g.closePath(); g.clip();
    g.fillStyle = mold ? lgr(g, 0, cy, 0, cy + R * k, [[0, '#a89066'], [1, '#d4c19a']]) : lgr(g, 0, cy, 0, cy + R * k, [[0, '#6c737e'], [1, '#c9ced6']]); g.fillRect(-R, cy - 4, R * 2, R * k + 12);
    if (Math.cos(f1) > .03) cutWall(g, A, B1, d, W); if (Math.cos(f2) < -.03) cutWall(g, A, B2, d, W);
    g.restore();
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B1[0], B1[1]); g.ellipse(0, cy, R, R * k, 0, f1, f2); g.lineTo(A[0], A[1]); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke();
    if (!mold) { g.beginPath(); g.ellipse(0, sideTop, Rt, Rt * k, 0, f1, f2); g.lineWidth = 6; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 3.2; g.strokeStyle = '#eef0f4'; g.stroke(); }
  }
}
KINDS.pie = {
  info(o) { const q = Math.round(clamp01(o.slice || 0) * 12) / 12; return { bbox: [-176, -108, 176, 30], w: 300, h: 78, top: [0, -66], hot: [0, -58], key: 'q' + q, q: { slice: q } }; },
  paint(g, o, view, info, shadow) { pieDraw(g, false, shadow, info.q.slice); },
  steam() { return { w: 130, h: 120, power: .5, curl: .6 }; },
};
KINDS.pieMold = {
  info(o) { const q = Math.round(clamp01(o.slice || 0) * 12) / 12; return { bbox: [-176, -108, 176, 30], w: 300, h: 78, top: [0, -66], hot: [0, -58], key: 'q' + q, q: { slice: q } }; },
  paint(g, o, view, info, shadow) { pieDraw(g, true, shadow, info.q.slice); },
  steam() { return { w: 110, h: 100, power: .2, curl: .5 }; },
};
/* one wedge on its side: the cut face toward the viewer in layers, the thin top, the crust at the far end */
KINDS.pieSlice = {
  info(o) { return { bbox: [-100, -94, 100, 26], w: 170, h: 76, top: [0, -54], hot: [0, -48], key: 'v' + (o.mold ? 'm' : 'p'), q: { mold: !!o.mold } }; },
  paint(g, o, view, info, shadow) {
    const mold = info.q.mold, W = mold ? WALL_MOLD : WALL_PIE, R = 150, k = .3, d = 40, cy = -42, f1 = PI, f2 = PI + 50 * PI / 180, ox = 78;
    g.save(); g.translate(ox - 78 + 0, 0);
    if (shadow) shade(g, -4, 0, 100, 14, .42);
    const A = [0 - 0, cy], B1 = [-R, cy], B2 = [Math.cos(f2) * R, cy + Math.sin(f2) * R * k]; g.translate(78, 0);
    /* the outer crust wall along the arc */
    g.beginPath(); g.ellipse(0, cy, R, R * k, 0, f1, f2); g.lineTo(B2[0], B2[1] + d); g.ellipse(0, cy + d, R, R * k, 0, f2, f1, true); g.closePath();
    g.fillStyle = lgr(g, B1[0], 0, B2[0], 0, [[0, mold ? '#d4c19a' : '#c98a36'], [1, mold ? '#e6d8b8' : '#e8b468']]); g.fill(); ink(g, 3);
    /* the top surface: filling, a crust border along the arc, pecans */
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B1[0], B1[1]); g.ellipse(0, cy, R, R * k, 0, f1, f2); g.closePath(); g.fillStyle = mold ? '#d9c7a3' : rgr(g, -60, cy - 4, 4, -60, cy, 120, [[0, '#a8622a'], [1, '#5a2e10']]); g.fill();
    g.save(); g.clip(); g.beginPath(); g.ellipse(0, cy, R - 6, (R - 6) * k, 0, f1 - .05, f2 + .05); g.lineWidth = 24; g.strokeStyle = mold ? '#e4d4b2' : '#e2ac5e'; g.stroke();
    for (const [px, py, th] of [[-72, -3, .1], [-100, -4, -.5], [-46, 2, .5], [-118, -11, .9]]) pecan(g, px, cy + py, 15, 8, th, k, mold); g.restore();
    g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B1[0], B1[1]); g.ellipse(0, cy, R, R * k, 0, f1, f2); g.closePath(); ink(g, 3);
    /* the cut face: the wall under the edge A to B1 */
    cutWall(g, A, B1, d, W);
    g.restore();
  },
  steam() { return { w: 90, h: 80, power: .3, curl: .5 }; },
};
// ------------------------------------------------------------------ the blender
/* F19.dish(ctx, 'blender', { on 0..1, fill 0..1, color, lid 0..1, t }): a glass jar on a dark base with a dial. on = spinning (the jar shakes, the contents swirl in a vortex with moving streaks); fill = the level of the contents;
 * color = the contents (default beige); lid 0 = on the jar, 1 = lifted 96 px above it and tilted (the open mouth shows: drop things in). Native size: 190 wide, 270 tall. hot = the top of the jar. */
const JARP = g => { g.beginPath(); g.moveTo(-50, -86); g.bezierCurveTo(-52, -132, -72, -192, -78, -246); g.lineTo(78, -246); g.bezierCurveTo(72, -192, 52, -132, 50, -86); g.quadraticCurveTo(0, -77, -50, -86); g.closePath(); };
const jarHalf = y => 50 + clamp01((-86 - y) / 160) * 28;
KINDS.blender = {
  info(o) { return { bbox: [-140, -380, 140, 30], w: 190, h: 270, top: [0, -262], hot: [0, -246], key: 'b' }; },
  paint(g, o, view, info, shadow) {
    if (shadow) shade(g, 0, 2, 118, 17, .45);
    g.beginPath(); g.moveTo(-96, -2); g.lineTo(-86, -68); g.quadraticCurveTo(-84, -84, -66, -86); g.lineTo(66, -86); g.quadraticCurveTo(84, -84, 86, -68); g.lineTo(96, -2); g.quadraticCurveTo(0, 12, -96, -2); g.closePath();
    g.fillStyle = lgr(g, -96, 0, 96, 0, [[0, '#4a4e5a'], [.3, '#2f323b'], [.75, '#1f2128'], [1, '#14151a']]); g.fill(); ink(g, 3.4);
    g.beginPath(); g.moveTo(-84, -66); g.quadraticCurveTo(0, -56, 84, -66); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.18)'; g.stroke();
    g.beginPath(); g.arc(0, -36, 17, 0, TAU); fillInk(g, lgr(g, -14, -50, 14, -22, [[0, '#f0f1f4'], [1, '#8a8f9a']]), 2.6); g.beginPath(); g.moveTo(0, -36); g.lineTo(9, -46); g.lineWidth = 3.4; g.strokeStyle = '#c93a2a'; g.stroke();
    for (const [bx, c_] of [[-58, '#b8bcc6'], [-44, '#b8bcc6'], [46, '#c93a2a'], [60, '#6fbf5a']]) { g.beginPath(); g.arc(bx, -36, 5, 0, TAU); fillInk(g, c_, 1.8); }
    spot(g, -62, -74, 22, 3, -.1, .3, '#fff');
    g.beginPath(); g.moveTo(-68, -84); g.lineTo(-62, -98); g.lineTo(62, -98); g.lineTo(68, -84); g.closePath(); fillInk(g, '#383b46', 2.8);                  /* the collar */
    g.beginPath(); g.moveTo(52, -140); g.bezierCurveTo(112, -148, 118, -226, 74, -232); g.lineWidth = 17; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 11; g.strokeStyle = '#2b2e37'; g.stroke();   /* the handle */
    JARP(g); g.fillStyle = 'rgba(205,224,236,.35)'; g.fill();                                                                                       /* the glass body, behind the contents */
    g.beginPath(); g.ellipse(0, -246, 78, 10, 0, 0, TAU); g.fillStyle = 'rgba(150,170,184,.55)'; g.fill();
  },
  live(c, o, view, info, t) {
    const on = clamp01(o.on || 0), fill = o.fill == null ? .55 : clamp01(o.fill), lid = clamp01(o.lid || 0), col = o.color || F19.BEIGE;
    const sh = on * 1.7, jx = Math.sin(t * 61) * sh, jy = Math.sin(t * 73 + 1) * sh * .6;
    c.save(); c.translate(jx, jy);
    const yL = -92 - fill * 146 + (on ? Math.sin(t * 47) * 1.6 * on : 0), w = jarHalf(yL);
    if (fill > .01) {
      c.save(); JARP(c); c.clip();
      c.fillStyle = lgr(c, -78, 0, 78, 0, [[0, mix(col, '#ffffff', .22)], [.4, col], [1, mix(col, '#000000', .28)]]); c.fillRect(-90, yL, 180, -80 - yL);
      if (on > .02) {                                                                                                                               /* the swirl: dashes that sweep across the jar */
        const om = TAU * (1.6 + 1.2 * on);
        for (let j = 0; j < 16; j++) { const yy = yL + 8 + (j + .5) / 16 * (-92 - yL - 6), ww = jarHalf(yy) - 6, ph = om * t + j * 1.37, x = Math.sin(ph) * ww * .92, front = Math.cos(ph); if (front < -.1) continue; c.beginPath(); c.moveTo(x - 9 - 6 * on, yy); c.lineTo(x + 9 + 6 * on, yy); c.lineWidth = 3.2; c.lineCap = 'round'; c.strokeStyle = j % 2 ? 'rgba(255,255,255,' + (.3 * on * front) + ')' : 'rgba(40,24,8,' + (.28 * on * front) + ')'; c.stroke(); }
      }
      c.beginPath(); c.ellipse(0, yL, w - 2, (w - 2) * .13, 0, 0, TAU); c.fillStyle = mix(col, '#ffffff', .12); c.fill();
      if (on > .02) { c.beginPath(); c.ellipse(0, yL + 3 * on, (w - 2) * .5 * on + 4, (w - 2) * .09 * on + 1, 0, 0, TAU); c.fillStyle = mix(col, '#000000', .45); c.fill(); for (let i = 0; i < 3; i++) { const a = om0(t, i); c.beginPath(); c.ellipse(0, yL + 1, (w - 4) * (.35 + .22 * i), (w - 4) * (.35 + .22 * i) * .13, 0, a, a + 1.5); c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,255,255,' + (.35 * on) + ')'; c.stroke(); } }
      else spot(c, -w * .35, yL, w * .35, 2.4, 0, .5, '#fff');
      c.restore();
    }
    /* the glass in front of the contents */
    JARP(c); c.lineWidth = 3.6; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke();
    c.beginPath(); c.moveTo(-44, -232); c.bezierCurveTo(-52, -190, -46, -150, -40, -112); c.lineWidth = 7; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.moveTo(60, -222); c.bezierCurveTo(56, -190, 48, -150, 44, -118); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
    c.beginPath(); c.moveTo(-48, -92); c.quadraticCurveTo(0, -84, 48, -92); c.lineWidth = 6; c.strokeStyle = 'rgba(120,150,170,.35)'; c.stroke();
    c.beginPath(); c.ellipse(0, -246, 78, 10, 0, 0, PI); c.lineWidth = 3.6; c.strokeStyle = OUT; c.stroke(); if (lid > .4) { c.beginPath(); c.ellipse(0, -246, 78, 10, 0, PI, TAU); c.stroke(); }
    /* the lid: seated, or lifted and tilted above the jar */
    const lk = ease.out(lid), ly = -lk * 96, lr = lk * -.22;
    c.save(); c.translate(lk * -14, ly); c.rotate(lr); c.translate(0, 0);
    c.beginPath(); c.moveTo(-80, -246); c.lineTo(-76, -262); c.quadraticCurveTo(0, -272, 76, -262); c.lineTo(80, -246); c.ellipse(0, -246, 80, 11, 0, 0, PI); c.closePath(); c.fillStyle = lgr(c, -80, 0, 80, 0, [[0, '#4a4e5a'], [.5, '#2b2e37'], [1, '#17181d']]); c.fill(); ink(c, 3.2);
    c.beginPath(); c.ellipse(0, -262, 76, 10, 0, 0, TAU); c.fillStyle = '#3a3d48'; c.fill(); ink(c, 2.6);
    c.beginPath(); c.ellipse(0, -266, 24, 6, 0, 0, TAU); c.fillStyle = '#23252c'; c.fill(); ink(c, 2.4); c.beginPath(); c.moveTo(-14, -272); c.lineTo(14, -272); c.lineWidth = 6; c.strokeStyle = '#4a4e5a'; c.lineCap = 'round'; c.stroke(); spot(c, -40, -262, 20, 2.2, 0, .3, '#fff');
    c.restore(); c.restore();
  },
  steam(o, info) { return null; },
};
const om0 = (t, i) => (t * (4.2 + i) + i * 2.1) % TAU;

// ------------------------------------------------------------------ viscosity and the pour
/* F19.viscosity(thick) -> visc: the coffee's thick (0 liquid, .35 nectar, .7 honey, 1 pudding) as the pour's visc (0 water, .25 nectar, .5 honey, 1 pudding); F19.thickOf is its inverse. */
const VMAP = [[0, 0], [.35, .25], [.7, .5], [1, 1]];
const mapPW = (x, a, b) => { x = clamp01(x); for (let i = 0; i < 3; i++) if (x <= VMAP[i + 1][a]) { const p = VMAP[i], q = VMAP[i + 1]; return lerp(p[b], q[b], (x - p[a]) / (q[a] - p[a])); } return VMAP[3][b]; };
F19.viscosity = thick => mapPW(thick, 0, 1);
F19.thickOf = visc => mapPW(visc, 1, 0);
/* a smooth ribbon through pts [{x, y, w}] (w = full width); the end caps are rounded when capA / capB are set. band(a, b) = the strip between fractions a and b of the width (-.5 .. .5). */
function ribbonPts(pts, a, b) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const p = pts[i], p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)]; let tx = p1.x - p0.x, ty = p1.y - p0.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; L.push([p.x - ty * p.w * a, p.y + tx * p.w * a]); R.push([p.x - ty * p.w * b, p.y + tx * p.w * b]); }
  return [L, R];
}
function ribbonPath(c, pts, a, b, capA, capB) {
  const [L, R] = ribbonPts(pts, a, b), n = pts.length; c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n - 1; i++) c.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
  c.lineTo(L[n - 1][0], L[n - 1][1]);
  if (capB) { const p = pts[n - 1], q = pts[n - 2] || p, d = Math.atan2(p.y - q.y, p.x - q.x), rb = p.w * (b - a) / 2, mx = (L[n - 1][0] + R[n - 1][0]) / 2, my = (L[n - 1][1] + R[n - 1][1]) / 2; c.ellipse(mx, my, rb, rb, d - PI / 2, PI, 0, true); }
  c.lineTo(R[n - 1][0], R[n - 1][1]);
  for (let i = n - 2; i >= 1; i--) c.quadraticCurveTo(R[i + 1][0], R[i + 1][1], (R[i][0] + R[i + 1][0]) / 2, (R[i][1] + R[i + 1][1]) / 2);
  c.lineTo(R[0][0], R[0][1]);
  if (capA) { const p = pts[0], q = pts[1] || p, d = Math.atan2(q.y - p.y, q.x - p.x), ra = p.w * (b - a) / 2, mx = (L[0][0] + R[0][0]) / 2, my = (L[0][1] + R[0][1]) / 2; c.ellipse(mx, my, ra, ra, d - PI / 2, 0, PI, true); }
  c.closePath();
}
/* a rounded lump of pudding: centre (x, y), half sizes rx, ry; lit from the upper left */
function lumpDraw(c, x, y, rx, ry, col, hi, flat) {
  c.save(); c.translate(x, y); c.beginPath(); c.ellipse(0, 0, Math.max(.5, rx), Math.max(.5, ry), 0, 0, TAU);
  c.fillStyle = rgr(c, -rx * .3, -ry * .35, 1, 0, 0, Math.max(rx, ry) * 1.15, [[0, hi], [.45, col], [1, mix(col, '#000000', .3)]]); c.fill(); ink(c, 3); spot(c, -rx * .32, -ry * .38, rx * .3, ry * .14, -.5, .55, '#fff3dc'); c.restore();
}
/* F19.pour(ctx, { x0, y0, x1, y1, t, t0, t1, visc, color, width, keep }): a stream from a spout at (x0, y0) to a surface at (x1, y1) from t0 (the head leaves the spout) to t1 (the tail does).
 * visc 0 water: a fast, straight, thin stream that splashes (droplets and rings); .5 honey: a slow rope that thins as it falls, sways and COILS on itself where it lands; 1 pudding: it will not pour: a lump bulges out of the spout, hangs,
 * stretches on a neck, snaps, falls and plops with a slow wobble (a new lump every 1.55 s while t0..t1 lasts). In between it blends (nectar .25 is water that has started to cling and bead). width = the stream's width at the spout (default 14;
 * lumps are about 1.5 x that in radius). color: default the matching coffee colour. keep: leave the mound at the surface after the pour (default: it settles away). Returns { lands, ends }: the time the first liquid reaches (x1, y1) and the
 * time the last does. The stream is drawn on top of what is already there: draw the vessel first. Pure function of t. */
F19.pour = function pour(c, o = {}) {
  const x0 = +o.x0 || 0, y0 = +o.y0 || 0, x1 = o.x1 == null ? x0 : +o.x1, y1 = o.y1 == null ? y0 + 300 : +o.y1, t = +o.t || 0, t0 = o.t0 == null ? 0 : +o.t0;
  const visc = clamp01(o.visc == null ? 0 : o.visc), W0 = o.width == null ? 14 : +o.width, sc = W0 / 14, thick = F19.thickOf(visc);
  const col = o.color || liqCol(thick, 0), hi = o.color ? mix(o.color, '#ffffff', .4) : liqCol(thick, 1), D = Math.max(8, Math.hypot(x1 - x0, y1 - y0)), keep = !!o.keep;
  const t1 = Math.max(o.t1 == null ? t0 + 1.5 : +o.t1, t0 + .05);
  c.save(); clean(c);
  let res;
  if (visc < .78) {
    /* ----- a stream: every element leaves the spout at time te with speed v0 and falls with g; its place along the line is s(t - te), its width follows the flux and the speed */
    const v0 = lerp(300, 70, Math.pow(visc, .8)), gr = lerp(5200, 900, Math.pow(visc, .7)), tauD = (-v0 + Math.sqrt(v0 * v0 + 2 * gr * D)) / gr;
    const lands = t0 + tauD, ends = t1 + tauD; res = { lands, ends };
    const fall = tau => v0 * tau + .5 * gr * tau * tau, Tr = .05 + .15 * visc, Tt = .12 + .6 * visc, Wr = W0 * (1 + .5 * visc);
    const q = te => sstep(t0, t0 + Tr, te) * (1 - sstep(t1 - Tt, t1, te));
    const teHi = Math.min(t, t1), teLo = Math.max(t0, t - tauD);
    const ux = (x1 - x0) / D, uy = (y1 - y0) / D, nx = -uy, ny = ux;
    const A = Wr * .8 * sstep(.2, .5, visc) * (1 - sstep(.6, .78, visc)), neck = sstep(.5, .78, visc) * .8;
    const tipA = TAU * 1.5 * (t - lands), Rc = Wr * .55 * sstep(.25, .5, visc);
    /* the pile / splash at the surface (drawn first: the stream lands on it) */
    const since = t - lands;
    if (since > 0) {
      if (visc < .3) {                                                                                       /* water: a bright lump, rings, droplets */
        const act = clamp01(1 - (t - ends) / .5); if (t > ends - .02 || true) {
          const a = since < 0 ? 0 : (t <= ends ? 1 : clamp01(1 - (t - ends) / .45));
          if (a > .01) {
            for (let r = 0; r < 2; r++) { const ph = ((since / .55) + r * .5) % 1, rr_ = (6 + 40 * ph) * sc; c.beginPath(); c.ellipse(x1, y1, rr_, rr_ * .26, 0, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = rgba(hi, .55 * (1 - ph) * a); c.stroke(); }
            c.beginPath(); c.ellipse(x1, y1 - 2 * sc, W0 * .85, W0 * .3, 0, 0, TAU); c.fillStyle = rgba(hi, .55 * a); c.fill();
            for (let j = 0; j < 22; j++) { const Tc = .42, ph = ((since / Tc) + rnd(77, j)) % 1, birth = t - ph * Tc; if (birth < lands || birth > ends) continue; const vx = (rnd(78, j) - .5) * 300 * sc, vy = -(110 + rnd(79, j) * 220) * sc, tau = ph * Tc, px = x1 + vx * tau, py = y1 + vy * tau + 900 * sc * tau * tau, r = (1.4 + 1.8 * rnd(80, j)) * Math.max(.6, sc);
              c.beginPath(); c.ellipse(px, py, r, r * 1.25, Math.atan2(vy + 1800 * sc * tau, vx) - PI / 2, 0, TAU); c.fillStyle = rgba(j % 3 ? hi : col, (1 - ph * ph) * .9 * a); c.fill(); }
          }
        }
      } else {                                                                                               /* honey: a coil of folds, growing while it lands */
        const vol = ease.out(clamp01(since / (Math.max(.4, ends - lands) + .5))), settle = keep ? 0 : sstep(ends + .5, ends + 1.9, t), Hm = 1.25 * Wr * vol * (1 - settle), Rb = (1.25 + .3 * visc) * Wr * (1 + .5 * settle), stp = Wr * .2;
        const K = Math.max(0, Math.ceil(Hm / stp));
        for (let k = 0; k < K; k++) { const u = k / Math.max(1, K), r = Rb * Math.pow(1 - u * .42, .9), yy = y1 - k * stp, ox = Math.sin(tipA * .5 + k * 1.3) * Rc * .35 * (1 - settle);
          c.beginPath(); c.ellipse(x1 + ox, yy, r, r * .27, 0, 0, TAU); c.fillStyle = lgr(c, 0, yy - r * .3, 0, yy + r * .3, [[0, hi], [.5, col], [1, mix(col, '#000', .25)]]); c.fill(); ink(c, 2.4); c.beginPath(); c.ellipse(x1 + ox - r * .2, yy - r * .08, r * .5, r * .1, -.1, PI * 1.1, PI * 1.8); c.lineWidth = 2; c.strokeStyle = rgba('#fff2d0', .5); c.stroke(); }
      }
    }
    if (teHi > teLo + 1e-4 && t >= t0) {
      const N = 30, pts = []; let capA = false;
      for (let j = 0; j <= N; j++) {
        const te = lerp(teHi, teLo, j / N), tau = Math.min(tauD, t - te), s = Math.min(D, fall(tau)), u = s / D, v = v0 + gr * tau, qq = q(te);
        let w = Wr * Math.sqrt(Math.max(0, qq)) * Math.sqrt(v0 / v); if (neck > 0) w *= 1 - neck * .5 * (1 + Math.sin(TAU * te / .27 + 1.3));
        const wave = A * Math.sin(5.1 * te + 1.1) * Math.pow(Math.sin(PI * Math.min(1, u)), .9) + Rc * Math.cos(tipA) * Math.pow(u, 3);
        pts.push({ x: x0 + ux * s + nx * wave, y: y0 + uy * s + ny * wave, w: Math.max(0, w), u });
      }
      capA = pts[0].u > .002;
      const live = pts.filter(p => p.w > .5);
      if (live.length > 1) {
        const ow = lerp(2, 3.4, visc);
        ribbonPath(c, live, -.5, .5, capA, true); c.lineWidth = ow * 2; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); c.fillStyle = col; c.fill();
        ribbonPath(c, live, .14, .5, false, false); c.fillStyle = 'rgba(0,0,0,.18)'; c.fill();
        ribbonPath(c, live, -.34, -.12, false, false); c.fillStyle = rgba(hi, .8); c.fill();
      }
    }
  } else {
    /* ----- pudding: lumps. phases per lump: bulge out of the spout (a), hang and stretch on a neck (b), fall (g), plop and wobble */
    const R = Math.max(18, W0 * 1.5), P = 1.55, a = .5, b = .55, gg = 3400, nL = Math.max(1, Math.floor((t1 - t0 - .2) / P) + 1), dropEnd = R * 1.1 + 22, vy0 = (R * 2.2 + 22) / b;
    const yc = tau => y0 + R * .95 + dropEnd + vy0 * tau + .5 * gg * tau * tau, ryF = tau => R * (1.6 - .45 * sstep(0, .3, tau));
    const landTau = ys => { let lo = 0, hi_ = 1.2; for (let i = 0; i < 16; i++) { const m = (lo + hi_) / 2; if (yc(m) + ryF(m) >= ys) hi_ = m; else lo = m; } return hi_; };
    const pileH = k => Math.min(k * R * .5, R * 1.7), dxk = k => (rnd(90, k) - .5) * R * .5;
    res = { lands: t0 + a + b + landTau(y1), ends: t0 + (nL - 1) * P + a + b + landTau(y1 - pileH(nL - 1)) };
    const colp = col, hip = hi;
    let lastLand = -1e9;
    for (let k = 0; k < nL; k++) {                                                                           /* the settled lumps first (they are under the stream) */
      const tb = t0 + k * P, ys = y1 - pileH(k), tl = tb + a + b + landTau(ys); lastLand = Math.max(lastLand, tl); const u = t - tl;
      if (u < 0) continue;
      const ph = u, wob = .26 * Math.exp(-2.6 * ph) * Math.sin(TAU * 2.9 * ph), flat = .5 + .5 * (1 - Math.exp(-ph * 9)), settle = keep ? 0 : sstep(res.ends + .6, res.ends + 1.8, t);
      const sq = Math.sin(PI * Math.min(1, ph / .2)) * Math.exp(-ph * 3), r0 = sstep(0, .2, ph);                                              /* the plop: a quick squash (wide and low), then a dome */
      const rx = R * (.93 + .19 * r0 + .22 * sq) * (1 - wob * .5) * (1 + .2 * settle), ry = R * (1.15 - .3 * r0 - .45 * sq) * (1 + wob) * (1 - .6 * settle);
      if (settle < .99) { c.save(); c.globalAlpha = 1 - sstep(.6, 1, settle); c.beginPath(); c.moveTo(x1 + dxk(k) - rx, ys); c.bezierCurveTo(x1 + dxk(k) - rx, ys - ry * 1.25, x1 + dxk(k) + rx, ys - ry * 1.25, x1 + dxk(k) + rx, ys); c.closePath();
        c.fillStyle = rgr(c, x1 + dxk(k) - rx * .3, ys - ry * .8, 2, x1 + dxk(k), ys - ry * .4, rx * 1.2, [[0, hip], [.45, colp], [1, mix(colp, '#000', .3)]]); c.fill(); ink(c, 3); spot(c, x1 + dxk(k) - rx * .35, ys - ry * .75, rx * .3, ry * .12, -.4, .5, '#fff3dc'); c.restore(); }
    }
    for (let k = 0; k < nL; k++) {                                                                           /* the lump in the air */
      const tb = t0 + k * P, u = t - tb, ys = y1 - pileH(k), tl = tb + a + b + landTau(ys); if (u < 0 || t >= tl) continue;
      if (u < a) { const r = R * ease.out(u / a); if (r > 1) { c.save(); c.beginPath(); c.moveTo(x0 - r * .8, y0 - 1); c.lineTo(x0 + r * .8, y0 - 1); c.lineTo(x0 + r * .8, y0 + r * .3); c.ellipse(x0, y0 + r * .3, r * .8, r * 1.0, 0, 0, PI); c.lineTo(x0 - r * .8, y0 + r * .3); c.closePath(); c.fillStyle = rgr(c, x0 - r * .3, y0 + r * .2, 1, x0, y0 + r * .6, r * 1.2, [[0, hip], [.45, colp], [1, mix(colp, '#000', .3)]]); c.fill(); ink(c, 3); spot(c, x0 - r * .32, y0 + r * .3, r * .26, r * .13, -.5, .5, '#fff3dc'); c.restore(); } }
      else if (u < a + b) { const uu = (u - a) / b, cy_ = y0 + R * .95 + R * 1.1 * uu * uu + 22 * uu, ry = R * (1.05 + .55 * uu * uu), rx = R / Math.sqrt(ry / R), nw = lerp(R * 1.4, R * .14, Math.pow(uu, .7));
        c.save(); const nk = [{ x: x0, y: y0 - 2, w: R * 1.5 }, { x: x0, y: lerp(y0, cy_ - ry * .7, .5), w: lerp(R * 1.5, nw, .7) }, { x: x0, y: cy_ - ry * .6, w: nw }];
        ribbonPath(c, nk, -.5, .5, false, false); c.lineWidth = 6; c.strokeStyle = OUT; c.stroke(); c.fillStyle = colp; c.fill(); lumpDraw(c, x0, cy_, rx, ry, colp, hip); c.restore(); }
      else { const tau = u - a - b, cy_ = yc(tau), ry = ryF(tau), rx = R / Math.sqrt(ry / R); c.save();
        if (tau < .14) { const len = (R * 1.1 + 22) * (1 - tau / .14); const nk = [{ x: x0, y: y0 - 2, w: R * .5 }, { x: x0, y: y0 + len * .5, w: R * .18 }, { x: x0, y: y0 + len, w: 2 }]; ribbonPath(c, nk, -.5, .5, false, true); c.lineWidth = 4.6; c.strokeStyle = OUT; c.stroke(); c.fillStyle = colp; c.fill(); }
        lumpDraw(c, x0 + (x1 - x0) * Math.min(1, tau / Math.max(.2, landTau(ys))) + dxk(k) * Math.min(1, tau / .3) * 0, cy_, rx, ry, colp, hip); c.restore(); }
    }
  }
  c.restore();
  return res;
};
// ================================================================== batch 3: the slow cooker, jello, the can of cranberry sauce, the casserole, the pizza box
/* ----- the slow cooker. F19.dish(ctx, 'slowcooker', { lid -1..1, hop 0..1, fog 0..1, light 0..1, dial, steam 0..1, t, hero }).
 * A chrome base with black handles and a dial (OFF LOW HIGH WARM, pointer at `dial`: 'WARM' default; the legend KEEP WARM is live UI text), a stoneware crock with bubbling stew, a glass lid with a chrome rim, a vent notch, a black knob,
 * condensation (`fog` 0..1: how steamed up the glass is, default .5). lid: the lid tips (sign = which side rises: + the right, - the left; size = how far, 1 = about 36 px) and `hop` lifts it straight up (1 = 40 px).
 * With steam > 0 the lid also rattles by itself (a small deterministic bounce, up to 2 px at about 8 Hz). light = the KEEP WARM lamp (0..1, glows additively). Steam leaves the vent (`hot`) and, when the lid is lifted, the gap.
 * Native size 330 wide, 250 tall. hero: true makes the legend hero text (close-ups). */
const COOK = { y: -126, rx: 146, ry: 30 };
function cookerBase(g, shadow) {
  if (shadow) shade(g, 0, 0, 196, 25, .46);
  for (const sx of [-1, 1]) { g.beginPath(); g.roundRect(sx * 92 - 20, -14, 40, 12, 4); fillInk(g, '#15161a', 2.6); }
  const body = () => { g.beginPath(); g.moveTo(-146, COOK.y); g.bezierCurveTo(-152, -92, -146, -30, -126, -14); g.ellipse(0, -14, 126, 17, 0, PI, 0, true); g.bezierCurveTo(146, -30, 152, -92, 146, COOK.y); g.ellipse(0, COOK.y, COOK.rx, COOK.ry, 0, 0, PI); g.closePath(); };
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 142, -108); g.bezierCurveTo(sx * 190, -112, sx * 192, -66, sx * 138, -66); g.lineCap = 'round'; g.lineWidth = 19; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 12.5; g.strokeStyle = '#25272e'; g.stroke(); g.beginPath(); g.moveTo(sx * 150, -104); g.bezierCurveTo(sx * 180, -106, sx * 182, -74, sx * 148, -72); g.lineWidth = 2.4; g.strokeStyle = 'rgba(255,255,255,.28)'; g.stroke(); }
  body(); g.fillStyle = lgr(g, -150, 0, 150, 0, [[0, '#f6f8fa'], [.14, '#d9dde3'], [.42, '#aeb4be'], [.78, '#8c929d'], [1, '#666c78']]); g.fill();
  g.save(); body(); g.clip();
  g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 40; i++) g.fillRect(-150 + i * 7.6, COOK.y, 2, 130);                       /* brushed streaks */
  g.fillStyle = lgr(g, 0, -34, 0, -10, [[0, '#2a2c33'], [1, '#101114']]); g.fillRect(-150, -34, 300, 26);                                /* the black base band */
  g.fillStyle = lgr(g, 0, COOK.y, 0, COOK.y + 26, [[0, 'rgba(0,0,0,.28)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(-150, COOK.y, 300, 26);
  spot(g, -108, -76, 5, 36, .04, .55, '#fff'); spot(g, 112, -70, 3, 30, 0, .22, '#fff');
  g.restore(); body(); ink(g, 3.6);
  g.beginPath(); g.moveTo(-143, -34); g.bezierCurveTo(-60, -26, 60, -26, 143, -34); g.lineWidth = 2.2; g.strokeStyle = 'rgba(20,20,26,.7)'; g.stroke();
  /* the crock rim and the dark opening (the stew is drawn live) */
  g.beginPath(); g.ellipse(0, COOK.y, 136, 27, 0, 0, TAU); g.fillStyle = lgr(g, -136, 0, 136, 0, [[0, '#fbf3e2'], [.5, '#efe3cb'], [1, '#c9b894']]); g.fill(); ink(g, 3);
  g.beginPath(); g.ellipse(0, COOK.y + 2, 121, 21, 0, 0, TAU); g.fillStyle = '#4a2a14'; g.fill(); ink(g, 2.4, 'rgba(28,20,14,.5)');
  /* the dial: a black collar, a knob, four detents */
  g.beginPath(); g.arc(0, -68, 28, 0, TAU); fillInk(g, lgr(g, -20, -90, 20, -46, [[0, '#4b4e58'], [1, '#17181d']]), 2.8);
  for (let i = 0; i < 4; i++) { const a = (-150 + i * 40) * PI / 180; g.beginPath(); g.arc(Math.cos(a) * 36, -68 + Math.sin(a) * 36, 2.6, 0, TAU); g.fillStyle = i === 0 ? '#9aa0ab' : i === 3 ? '#ffb347' : '#d8dce3'; g.fill(); }
  g.beginPath(); g.arc(0, -68, 19, 0, TAU); fillInk(g, lgr(g, -14, -84, 14, -52, [[0, '#6a6e7a'], [.5, '#2b2d34'], [1, '#101114']]), 2.6); spot(g, -7, -77, 8, 3, -.5, .4, '#fff');
  g.beginPath(); g.arc(52, -68, 7, 0, TAU); fillInk(g, '#3a0c0c', 2.2);                                                                 /* the lamp housing */
}
function cookerLid(g, fog) {
  const R = 132, Ry = 27, dome = () => { g.beginPath(); g.moveTo(-R, 0); g.bezierCurveTo(-R, -72, -72, -112, 0, -112); g.bezierCurveTo(72, -112, R, -72, R, 0); g.ellipse(0, 0, R, Ry, 0, 0, PI); g.closePath(); };
  g.beginPath(); g.moveTo(-8, -108); g.lineTo(-8, -122); g.lineTo(8, -122); g.lineTo(8, -108); g.closePath(); fillInk(g, '#2a2c33', 2.6);                                                       /* the knob */
  g.beginPath(); g.ellipse(0, -128, 22, 14, 0, 0, TAU); fillInk(g, lgr(g, -16, -140, 16, -116, [[0, '#5a5e6a'], [.5, '#2b2d34'], [1, '#101114']]), 2.8); spot(g, -7, -134, 7, 3, -.4, .45, '#fff');
  dome(); g.fillStyle = lgr(g, -R, -112, R, 0, [[0, 'rgba(235,246,252,.46)'], [.5, 'rgba(205,226,240,.30)'], [1, 'rgba(150,180,200,.30)']]); g.fill();
  g.save(); dome(); g.clip();
  g.fillStyle = rgr(g, 0, -42, 10, 0, -42, 126, [[0, 'rgba(255,255,255,' + (.42 * fog) + ')'], [1, 'rgba(255,255,255,' + (.1 * fog) + ')']]); g.fillRect(-R, -114, R * 2, 130);       /* the fog on the inside */
  for (let i = 0; i < 16; i++) { const a = rnd(3, i) * PI, rr_ = 28 + 92 * Math.sqrt(rnd(4, i)), x = Math.cos(a) * rr_ * 1.05, y = -Math.sin(a) * rr_ * .85 - 8; if (Math.abs(x) > R - 8) continue;
    const sz = 2.2 + 3.2 * rnd(5, i); g.beginPath(); g.ellipse(x, y, sz * .8, sz * 1.15, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,' + (.3 + .25 * fog) + ')'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(70,90,110,.5)'; g.stroke(); spot(g, x - sz * .25, y - sz * .4, sz * .25, sz * .3, 0, .9, '#fff');
    if (i % 4 === 0) { g.beginPath(); g.moveTo(x, y + sz); g.lineTo(x + (rnd(6, i) - .5) * 3, y + sz + 14 + 10 * rnd(7, i)); g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,' + (.28 * fog + .1) + ')'; g.stroke(); } }
  g.restore();
  g.beginPath(); g.moveTo(-104, -22); g.bezierCurveTo(-110, -62, -80, -92, -44, -100); g.lineWidth = 10; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineCap = 'round'; g.stroke();
  g.beginPath(); g.moveTo(92, -34); g.bezierCurveTo(98, -56, 88, -76, 70, -88); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.4)'; g.stroke();
  dome(); ink(g, 3.4);
  g.beginPath(); g.ellipse(0, 0, R, Ry, 0, 0, PI); g.lineWidth = 11; g.strokeStyle = OUT; g.stroke(); g.lineWidth = 7; g.strokeStyle = lgr(g, -R, 0, R, 0, [[0, '#f2f4f7'], [.5, '#b9bfc8'], [1, '#868c97']]); g.stroke();   /* the chrome rim */
  g.beginPath(); g.ellipse(100, Ry * .64 - 1, 7, 3.4, 0, 0, TAU); g.fillStyle = '#1c1d22'; g.fill(); ink(g, 1.6);                                                                                /* the vent */
}
const COOKER_DIAL = { OFF: -150, LOW: -110, HIGH: -70, WARM: -30 };
KINDS.slowcooker = {
  info(o) { const fg = Math.round(clamp01(o.fog == null ? .5 : o.fog) * 4); return { bbox: [-206, -190, 206, 32], w: 330, h: 250, top: [0, -250], hot: [100, -126 + 17], key: 'sc', q: { fog: fg / 4 } }; },
  paint(g, o, view, info, shadow) { cookerBase(g, shadow); },
  live(c, o, view, info, t) {
    const seed = o.seed || 0, steam = clamp01(o.steam || 0), lid = Math.max(-1, Math.min(1, o.lid || 0)), hop = clamp01(o.hop || 0), light = clamp01(o.light == null ? 0 : o.light);
    /* the stew */
    c.save(); c.beginPath(); c.ellipse(0, COOK.y + 2, 121, 21, 0, 0, TAU); c.clip();
    c.fillStyle = rgr(c, -30, COOK.y - 4, 4, 0, COOK.y + 2, 124, [[0, '#a85a24'], [.6, '#7e3c16'], [1, '#4e2610']]); c.fillRect(-124, COOK.y - 24, 248, 50);
    for (let i = 0; i < 26; i++) { const a = rnd(11, i) * TAU, rr_ = Math.sqrt(rnd(12, i)); c.fillStyle = ['#c9792f', '#5f2c10', '#d89b45', '#8b4a1c'][i % 4]; c.beginPath(); c.ellipse(Math.cos(a) * rr_ * 104, COOK.y + 2 + Math.sin(a) * rr_ * 15, 4 + 5 * rnd(13, i), 2 + 2.6 * rnd(14, i), rnd(15, i) * PI, 0, TAU); c.fill(); }
    for (let i = 0; i < 6; i++) { const ph = (t * (.55 + .25 * rnd(16, i)) + rnd(17, i)) % 1, bx = (rnd(18, i) * 2 - 1) * 84, by = COOK.y + 2 + (rnd(19, i) * 2 - 1) * 10, r = (2 + 6 * Math.min(1, ph / .85)) * (steam > 0 || light > 0 ? 1 : .8);
      if (ph < .88) { c.beginPath(); c.ellipse(bx, by, r * 1.3, r * .8, 0, 0, TAU); c.fillStyle = 'rgba(255,222,170,.38)'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,236,200,.8)'; c.stroke(); spot(c, bx - r * .4, by - r * .25, r * .3, r * .2, 0, .8, '#fff'); } else { c.beginPath(); c.ellipse(bx, by, r * 2.2 * (ph - .6), r * .9 * (ph - .6), 0, 0, TAU); c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,236,200,' + (1 - (ph - .88) / .12) * .7 + ')'; c.stroke(); } }
    c.restore();
    /* the lid: tips about the far rim point, lifts straight up with hop, and rattles on its own steam */
    const rat = steam > 0 ? steam * (.55 + .45 * Math.sin(t * 5.3 + seed)) : 0, bounce = rat * 2 * Math.abs(Math.sin(t * 8 * PI + seed * 3.1)), wob = rat * .012 * Math.sin(t * 8 * TAU + seed);
    const side = lid >= 0 ? 1 : -1, ang = -side * Math.abs(lid) * .15 + wob, hopY = -hop * 40 - bounce - Math.abs(lid) * 8;
    const e = bake('lid:' + info.q.fog, -150, -150, 300, 190, ppuFor(c), g => cookerLid(g, info.q.fog));
    c.save(); c.translate(0, COOK.y + hopY); c.translate(-side * 132, 0); c.rotate(ang); c.translate(side * 132, 0); c.drawImage(e.cv, e.bx, e.by, e.bw, e.bh); c.restore();
    /* the KEEP WARM lamp and the legend */
    const da = (COOKER_DIAL[o.dial] != null ? COOKER_DIAL[o.dial] : COOKER_DIAL.WARM) * PI / 180;
    c.beginPath(); c.moveTo(Math.cos(da) * 6, -68 + Math.sin(da) * 6); c.lineTo(Math.cos(da) * 16, -68 + Math.sin(da) * 16); c.lineWidth = 3.4; c.strokeStyle = '#fff6e0'; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(52, -68, 4.6, 0, TAU); c.fillStyle = mix('#5a1010', '#ff4a3a', light); c.fill(); spot(c, 50.6, -69.6, 1.4, 1.2, 0, .4 + .5 * light, '#ffd8d0');
    if (light > .02) { if (typeof FX18 !== 'undefined' && FX18.glow) FX18.glow(c, { x: 52, y: -68, r: 30 + 14 * light, color: '#ff3a2a', alpha: .75 * light, core: .5 * light }); else { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rgr(c, 52, -68, 0, 52, -68, 40, [[0, 'rgba(255,70,50,' + (.7 * light) + ')'], [1, 'rgba(255,70,50,0)']]); c.fillRect(8, -112, 90, 90); c.restore(); } }
    lab('KEEP WARM', 0, -21, { size: 14, font: 'Nunito', weight: 900, fill: '#f4f1ea', stroke: '#16171b', lw: 3, spacing: 1.2, maxW: 100 }, o.hero);
    /* steam from the gap on the rising side */
    const gap = Math.max(Math.abs(lid) * 1.6, hop * 1.4);
    if (gap > .05) F19.steam(c, { x: side * 118, y: COOK.y - 6 + hopY * .4, w: 50, h: 130, t, seed: seed + 9, power: Math.min(1, .35 + gap * .8) * Math.max(.5, steam), curl: .7 });
  },
  steam(o, info) { return { w: 30, h: 140, power: .75, curl: .65 }; },
};

/* ----- jello: a fluted mold on a small plate. wobble 0..1 and t0: from t0 the mold wobbles (a damped jiggle, amplitude .16 x wobble, 3.4 Hz) about its base. color = the gelatin (default lime). */
function jelloBody(g, col) {
  const dk = mix(col, '#000000', .35), lt = mix(col, '#ffffff', .45), body = () => { g.beginPath(); g.moveTo(-82, -22); g.bezierCurveTo(-90, -70, -74, -112, -64, -138); g.bezierCurveTo(-40, -152, 40, -152, 64, -138); g.bezierCurveTo(74, -112, 90, -70, 82, -22); g.ellipse(0, -22, 82, 14, 0, 0, PI); g.closePath(); };
  body(); g.fillStyle = lgr(g, -90, 0, 90, 0, [[0, mix(col, '#ffffff', .25)], [.35, col], [.8, dk], [1, mix(col, '#000000', .5)]]); g.fill();
  g.save(); body(); g.clip();
  for (let i = 0; i < 9; i++) { const cx = -56 + i * 14, ys = -140, ye = -22; g.beginPath(); g.moveTo(cx * .78, ys); g.quadraticCurveTo(cx * 1.0, -80, cx * 1.08, ye + 12); g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,' + (.12 + .1 * (i % 2)) + ')'; g.stroke(); }                          /* flutes */
  const fr = ['#ffb84a', '#ffe36a', '#ff8a4a', '#fff0a0'];
  for (let i = 0; i < 14; i++) { const x = (rnd(21, i) * 2 - 1) * 56, y = -134 + rnd(22, i) * 106; g.save(); g.translate(x, y); g.rotate(rnd(23, i) * PI); g.beginPath(); g.ellipse(0, 0, 7 + 6 * rnd(24, i), 4.5 + 3 * rnd(25, i), 0, 0, TAU); g.fillStyle = fr[i % 4]; g.globalAlpha = .55; g.fill(); g.globalAlpha = .5; g.lineWidth = 1.4; g.strokeStyle = 'rgba(80,40,0,.7)'; g.stroke(); g.restore(); }
  g.fillStyle = lgr(g, 0, -150, 0, -20, [[0, 'rgba(255,255,255,.22)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.18)']]); g.fillRect(-100, -156, 200, 150);
  g.restore(); body(); ink(g, 3.4);
  g.beginPath(); g.ellipse(0, -142, 60, 9, 0, 0, TAU); g.fillStyle = lt; g.globalAlpha = .6; g.fill(); g.globalAlpha = 1; ink(g, 2, 'rgba(28,20,14,.5)');
  spot(g, -52, -96, 7, 34, .12, .75, '#ffffff'); spot(g, -34, -128, 16, 4, -.5, .8, '#ffffff'); spot(g, 56, -80, 3, 16, -.1, .35, '#ffffff');
}
KINDS.jello = {
  info(o) { const c0 = o.color || '#7be04f'; return { bbox: [-130, -176, 130, 30], w: 190, h: 150, top: [0, -150], hot: [0, -140], key: 'j' + c0, q: { color: c0 } }; },
  paint(g, o, view, info, shadow) {
    if (shadow) shade(g, 0, 2, 134, 18, .44);
    g.beginPath(); g.ellipse(0, -10, 112, 22, 0, 0, TAU); fillInk(g, '#e9e3d4', 3); g.beginPath(); g.ellipse(0, -13, 96, 17, 0, 0, TAU); fillInk(g, lgr(g, 0, -30, 0, 4, [[0, '#ded7c6'], [1, '#f7f3ea']]), 2);
  },
  live(c, o, view, info, t) {
    const j = F19.jiggle(t, o.t0 == null ? 1e9 : +o.t0, .16 * clamp01(o.wobble == null ? 0 : o.wobble), 3.4, 2.4), idle = .004 * Math.sin(t * 2.3 + (o.seed || 0));
    const e = bake('jello:' + info.q.color, -100, -160, 200, 150, ppuFor(c), g => jelloBody(g, info.q.color));
    c.save(); c.translate(0, -20); c.transform(j.sx, 0, j.skew, j.sy + idle, 0, 0); c.drawImage(e.cv, e.bx, e.by + 20, e.bw, e.bh); c.restore();
  },
};

/* ----- the can of jellied cranberry sauce: the cylinder with the can's ridges, on a plate. slices 0..4: slices cut from the top lie fanned on the plate. */
KINDS.cranCan = {
  info(o) { const n = Math.max(0, Math.min(4, Math.round(o.slices || 0))); return { bbox: [-150, -190, 160, 30], w: 250, h: 150 - n * 22, top: [-30, -150 + n * 22], hot: [-30, -140 + n * 22], key: 'n' + n, q: { n } }; },
  paint(g, o, view, info, shadow) {
    const n = info.q.n, H = 150 - n * 24, cx = -30, rx = 62, ry = 16, yb = -18;
    if (shadow) shade(g, 0, 2, 156, 20, .44);
    g.beginPath(); g.ellipse(0, -10, 148, 28, 0, 0, TAU); fillInk(g, '#e9e3d4', 3.2); g.beginPath(); g.ellipse(0, -13, 128, 22, 0, 0, TAU); fillInk(g, lgr(g, 0, -34, 0, 6, [[0, '#ded7c6'], [1, '#f7f3ea']]), 2);
    for (let i = 0; i < n; i++) { g.save(); g.translate(62 + i * 18, -18 + i * 2); g.rotate(-.1 + i * .04); g.beginPath(); g.ellipse(0, 0, 44, 12, 0, 0, TAU); g.fillStyle = '#8a1030'; g.fill(); ink(g, 2.6); g.beginPath(); g.ellipse(0, -5, 44, 12, 0, 0, TAU); g.fillStyle = lgr(g, -44, 0, 44, 0, [[0, '#d63a58'], [.5, '#b01b3d'], [1, '#85102c']]); g.fill(); ink(g, 2.6); g.beginPath(); g.ellipse(0, 0, 44, 12, 0, 0, PI); g.lineTo(-44, -5); g.moveTo(44, 0); g.lineTo(44, -5); g.lineWidth = 2.6; g.strokeStyle = OUT; g.stroke(); spot(g, -14, -8, 14, 3, 0, .55, '#ffe0e8'); g.restore(); }
    const body = () => { g.beginPath(); g.moveTo(cx - rx, yb - H); g.lineTo(cx - rx, yb); g.ellipse(cx, yb, rx, ry, 0, PI, 0, true); g.lineTo(cx + rx, yb - H); g.ellipse(cx, yb - H, rx, ry, 0, 0, PI); g.closePath(); };
    body(); g.fillStyle = lgr(g, cx - rx, 0, cx + rx, 0, [[0, '#d43a58'], [.2, '#b3203f'], [.6, '#8c1230'], [1, '#600a22']]); g.fill();
    g.save(); body(); g.clip();
    const rings = Math.max(2, Math.round(H / 24));                                                                            /* the can's ridges, pressed into the jelly */
    for (let i = 0; i < rings; i++) { const yy = yb - 10 - i * ((H - 14) / rings); g.beginPath(); g.ellipse(cx, yy, rx + 1, ry, 0, .02, PI - .02); g.lineWidth = 4.4; g.strokeStyle = 'rgba(40,0,10,.42)'; g.stroke(); g.beginPath(); g.ellipse(cx, yy - 3.6, rx, ry, 0, .1, PI - .1); g.lineWidth = 2; g.strokeStyle = 'rgba(255,170,190,.5)'; g.stroke(); }
    g.restore(); body(); ink(g, 3.4);
    g.beginPath(); g.ellipse(cx, yb - H, rx, ry, 0, 0, TAU); g.fillStyle = rgr(g, cx - 18, yb - H - 4, 3, cx, yb - H, rx, [[0, '#f0708a'], [.5, '#c8284a'], [1, '#9c1636']]); g.fill(); ink(g, 3);
    spot(g, cx - 38, yb - H / 2, 5, H * .36, .06, .55, '#ffd0da'); spot(g, cx - 24, yb - H - 2, 18, 3.4, -.2, .75, '#fff0f4');
  },
  steam() { return null; },
};

/* ----- the casserole: a glass dish with a foil lid (green bean casserole under it). foil 0..1 = how much of the top is covered (default .78; 0 = off, you see the crispy onions) */
KINDS.casserole = {
  info(o) { const f = Math.round(clamp01(o.foil == null ? .78 : o.foil) * 4) / 4; return { bbox: [-180, -150, 180, 30], w: 330, h: 112, top: [0, -112], hot: [0, -100], key: 'f' + f, q: { foil: f } }; },
  paint(g, o, view, info, shadow) {
    const f = info.q.foil;
    if (shadow) shade(g, 0, 2, 190, 22, .44);
    for (const sx of [-1, 1]) { g.beginPath(); g.roundRect(sx * 158 - 14, -86, 28, 30, 8); fillInk(g, 'rgba(210,230,240,.7)', 2.8); }                    /* the glass lugs */
    g.beginPath(); g.roundRect(-150, -76, 300, 66, [8, 8, 22, 22]); g.fillStyle = lgr(g, 0, -76, 0, -8, [[0, '#cfd9a0'], [.4, '#9aa96a'], [1, '#6f7c48']]); g.fill();
    g.save(); g.beginPath(); g.roundRect(-150, -76, 300, 66, [8, 8, 22, 22]); g.clip(); for (let i = 0; i < 30; i++) { g.fillStyle = i % 3 ? 'rgba(236,226,196,.7)' : 'rgba(80,100,40,.6)'; g.beginPath(); g.ellipse(-140 + rnd(31, i) * 280, -70 + rnd(32, i) * 56, 6 + 8 * rnd(33, i), 2.4 + 2.6 * rnd(34, i), rnd(35, i) * PI, 0, TAU); g.fill(); } g.fillStyle = 'rgba(210,232,244,.42)'; g.fillRect(-150, -76, 300, 66); spot(g, -100, -50, 4, 22, .05, .5, '#fff'); g.restore();
    g.beginPath(); g.roundRect(-150, -76, 300, 66, [8, 8, 22, 22]); ink(g, 3.4);
    const top = () => { g.beginPath(); g.roundRect(-150, -112, 300, 44, 22); };
    top(); g.fillStyle = 'rgba(224,238,246,.7)'; g.fill(); ink(g, 3.4);
    g.beginPath(); g.roundRect(-140, -106, 280, 34, 18); g.fillStyle = '#b9a35e'; g.fill(); g.save(); g.clip();
    for (let i = 0; i < 90; i++) { g.fillStyle = ['#e0b45a', '#c98a32', '#f0d089', '#9c6420'][i % 4]; g.beginPath(); g.ellipse(-136 + rnd(41, i) * 272, -104 + rnd(42, i) * 30, 4 + 5 * rnd(43, i), 2 + 2 * rnd(44, i), rnd(45, i) * PI, 0, TAU); g.fill(); } g.restore();
    g.beginPath(); g.roundRect(-140, -106, 280, 34, 18); ink(g, 2.4, 'rgba(60,40,10,.7)');
    if (f > 0) {                                                                                                                                   /* the foil: a sheet over the top, a crimped skirt over the lip, a torn free edge */
      const x1 = -150 + 306 * f, yt = -119, yb = -58, edge = []; for (let i = 0; i <= 8; i++) edge.push([x1 + 7 * Math.sin(i * 2.3) + (i % 2 ? 4 : -3), yt + i * (yb - yt) / 8]);
      const sheet = () => { g.beginPath(); g.moveTo(-158, -106); g.quadraticCurveTo(-158, yt, -142, yt); for (const p of edge) g.lineTo(p[0], p[1]); for (let x = x1 - 6, i = 0; x > -150; x -= 15, i++) g.lineTo(x, yb + (i % 2 ? 0 : 5)); g.lineTo(-158, yb); g.closePath(); };
      g.save(); g.translate(1, 4); sheet(); g.fillStyle = 'rgba(30,24,16,.3)'; g.fill(); g.restore();
      sheet(); g.fillStyle = lgr(g, -158, yt, x1, yb, [[0, '#f6f8fa'], [.3, '#c3c9d1'], [.55, '#eef0f3'], [.8, '#aab1bb'], [1, '#dfe3e8']]); g.fill();
      g.save(); sheet(); g.clip(); g.strokeStyle = 'rgba(80,90,104,.42)'; g.lineWidth = 1.7;
      for (let i = 0; i < 16; i++) { const x = -156 + (x1 + 156) * (i + rnd(46, i) * .7) / 16; g.beginPath(); g.moveTo(x, yt + 2); g.lineTo(x + (rnd(47, i) - .5) * 14, -92); g.lineTo(x + (rnd(48, i) - .5) * 10, yb); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 9; i++) { const x = -150 + (x1 + 150) * (i + .5) / 9; g.beginPath(); g.moveTo(x, yt + 4); g.lineTo(x + 9, -74); g.stroke(); }
      g.beginPath(); g.moveTo(-158, -71); g.lineTo(x1 + 12, -71); g.lineWidth = 3; g.strokeStyle = 'rgba(70,80,96,.55)'; g.stroke(); g.beginPath(); g.moveTo(-158, -74); g.lineTo(x1 + 12, -74); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.75)'; g.stroke();
      g.restore(); sheet(); ink(g, 3);
    }
  },
  steam() { return { w: 140, h: 110, power: .4, curl: .6 }; },
};

/* ----- the pizza box: closed (a flat cardboard box with a red stripe and a pizza slice icon) or open (open 0..1: the lid swings up on its back hinge and the pizza shows: crust, sauce, cheese, pepperoni). */
KINDS.pizzaBox = {
  info(o) { const op = Math.round(clamp01(o.open || 0) * 8) / 8; return { bbox: [-190, -260, 190, 30], w: 330, h: 40 + 150 * Math.sin(op * 105 * PI / 180), top: [0, -40], hot: [0, -52], key: 'o' + op, q: { open: op } }; },
  paint(g, o, view, info, shadow) {
    const op = info.q.open, th = op * 105 * PI / 180, W = 150, D = 46, Dr = 150, Hh = 30, y0 = -4, top = y0 - Hh, bk = top - D, lid = () => {
      const yf = bk + D * Math.cos(th) - Dr * Math.sin(th), hf = W - 26 + 26 * Math.max(0, Math.cos(th)), L = [-hf, yf], R = [hf, yf];
      g.beginPath(); g.moveTo(-W + 26, bk); g.lineTo(W - 26, bk); g.lineTo(R[0], R[1]); g.lineTo(L[0], L[1]); g.closePath();
      g.fillStyle = lgr(g, 0, Math.min(bk, yf), 0, Math.max(bk, yf), [[0, '#dcb27a'], [1, op > .5 ? '#c99d62' : '#d9ad74']]); g.fill(); ink(g, 3.2);
      g.save(); g.clip(); g.fillStyle = '#c93a2a'; const y1_ = lerp(bk, yf, .18), y2_ = lerp(bk, yf, .27); g.beginPath(); g.moveTo(-W, y1_); g.lineTo(W, y1_); g.lineTo(W, y2_); g.lineTo(-W, y2_); g.closePath(); g.fill();
      const my = lerp(bk, yf, .62), mx = 0; g.beginPath(); g.moveTo(mx - 20, my - 8 * (1 - Math.abs(Math.cos(th)) * 0)); g.lineTo(mx + 22, my - 8); g.lineTo(mx + 2, my + 12 * Math.min(1, Math.abs(yf - bk) / 40 + .2)); g.closePath(); g.fillStyle = '#f2c14e'; g.fill(); ink(g, 2); g.restore();
      g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(R[0], R[1]); g.lineTo(R[0], R[1] + 6); g.lineTo(L[0], L[1] + 6); g.closePath(); g.fillStyle = '#b98c52'; g.fill(); ink(g, 2.6);
    };
    if (shadow) shade(g, 0, 4, 190, 22, .42);
    if (op > .15) lid();                                                                                                                  /* raised: it stands behind the box */
    g.beginPath(); g.moveTo(-W, top); g.lineTo(-W, y0); g.lineTo(W, y0); g.lineTo(W, top); g.closePath(); g.fillStyle = lgr(g, -W, 0, W, 0, [[0, '#d8b077'], [1, '#b98c52']]); g.fill(); ink(g, 3.2);
    g.beginPath(); g.moveTo(-W, top); g.lineTo(-W + 26, bk); g.lineTo(W - 26, bk); g.lineTo(W, top); g.closePath(); g.fillStyle = op > .15 ? '#e6d2a8' : '#c99d62'; g.fill(); ink(g, 3.2);
    if (op > .15) {                                                                                                                      /* the pizza inside */
      const cy = top - D * .52;
      g.beginPath(); g.ellipse(0, cy, 118, 21, 0, 0, TAU); fillInk(g, lgr(g, 0, cy - 21, 0, cy + 21, [[0, '#ebb85f'], [1, '#c98a3a']]), 3);
      g.beginPath(); g.ellipse(0, cy - 1, 101, 17, 0, 0, TAU); g.fillStyle = '#d94a2a'; g.fill(); g.beginPath(); g.ellipse(0, cy - 1, 95, 15, 0, 0, TAU); g.fillStyle = '#f2c14e'; g.fill();
      for (let i = 0; i < 9; i++) { const a = TAU * i / 9 + .3, rr_ = i % 2 ? .62 : .26; g.beginPath(); g.ellipse(Math.cos(a) * 94 * rr_, cy - 1 + Math.sin(a) * 15 * rr_, 12, 4.2, 0, 0, TAU); fillInk(g, '#b02a24', 1.8); }
      g.strokeStyle = 'rgba(140,80,20,.4)'; g.lineWidth = 1.8; for (let i = 0; i < 4; i++) { const a = i * PI / 4 + .4; g.beginPath(); g.moveTo(-Math.cos(a) * 94, cy - Math.sin(a) * 15); g.lineTo(Math.cos(a) * 94, cy + Math.sin(a) * 15); g.stroke(); }
      spot(g, -50, cy - 6, 26, 3, -.05, .35, '#fff6d0');
    } else lid();                                                                                                                        /* closed: the lid lies on top */
  },
  steam(o, info) { return info.q.open > .5 ? { w: 140, h: 120, power: .6, curl: .6 } : null; },
};
// ================================================================== top views (view: 'top'): a dish seen from straight above, for a plate on a table; origin = the centre. roll, rolls, basket, plate and coffee have theirs above.
const TOP = {};
/* what a top view's picture depends on, besides `bare` (it goes into the sprite key) */
const TOPKEY = { pie: o => Math.round(clamp01(o.slice || 0) * 12), pieMold: o => Math.round(clamp01(o.slice || 0) * 12), jello: o => o.color || '', cranCan: o => Math.round(o.slices || 0), casserole: o => Math.round(clamp01(o.foil == null ? .78 : o.foil) * 4), pizzaBox: o => clamp01(o.open || 0) > .3 ? 1 : 0 };
function dishTop(kind, bbox, w, h, paint) { TOP[kind] = { info(o) { const b = !!o.bare; return { bbox, w, h, top: [0, 0], hot: [0, 0], key: 'T' + (b ? 'b' : '') + (TOPKEY[kind] ? TOPKEY[kind](o) : ''), q: { bare: b, o } }; }, paint(g, o, view, info, shadow) { paint(g, info.q.o, info.q.bare, shadow, info); }, steam() { return null; } }; }
function platterTop(g, r, bare, shadow) { if (bare) { if (shadow) shade(g, 4, 8, r * .8, r * .78, .38); return; } if (shadow) shade(g, 4, 8, r * 1.06, r, .38); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = rgr(g, -40, -50, 20, 0, 0, r, [[0, '#ffffff'], [.8, '#f1ecdf'], [1, '#d0c8b4']]); g.fill(); ink(g, 3.4); g.beginPath(); g.arc(0, 0, r * .9, 0, TAU); g.lineWidth = 3; g.strokeStyle = '#d4a94c'; g.stroke(); g.beginPath(); g.arc(0, 0, r * .8, 0, TAU); g.fillStyle = '#f7f3ea'; g.fill(); }
function legTop(g, M, sx, mold) {
  const P0 = [sx * 44, 52], P1 = [sx * 94, 124], r0 = 25, r1 = 12, dx = P1[0] - P0[0], dy = P1[1] - P0[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const bx = P1[0] + ux * 18, by = P1[1] + uy * 18;
  if (!mold) { g.beginPath(); g.moveTo(P1[0], P1[1]); g.lineTo(bx, by); g.lineWidth = 13; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#f6efdc'; g.stroke(); }
  g.beginPath(); g.arc(P0[0], P0[1], r0, 0, TAU); g.moveTo(P1[0] + r1, P1[1]); g.arc(P1[0], P1[1], r1, 0, TAU); g.lineWidth = 7; g.strokeStyle = OUT; g.stroke(); g.fillStyle = M.leg0; g.fill();
  g.beginPath(); g.moveTo(P0[0] - uy * r0, P0[1] + ux * r0); g.lineTo(P1[0] - uy * r1, P1[1] + ux * r1); g.lineTo(P1[0] + uy * r1, P1[1] - ux * r1); g.lineTo(P0[0] + uy * r0, P0[1] - ux * r0); g.closePath(); g.lineWidth = 7; g.strokeStyle = OUT; g.stroke(); g.fillStyle = M.leg0; g.fill();
  g.beginPath(); g.arc(P0[0], P0[1], r0 - 2, 0, TAU); g.fillStyle = M.leg0; g.fill(); spot(g, P0[0] - 8, P0[1] - 9, 11, 5, -.6, mold ? .35 : .6, M.hi);
  if (mold) { for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(bx + Math.cos(a) * 6, by + Math.sin(a) * 6, 4.2, 0, TAU); fillInk(g, M.top, 1.5, M.line); } }
  else { g.save(); g.translate(bx + ux * 3, by + uy * 3); g.rotate(Math.atan2(dy, dx)); g.beginPath(); g.moveTo(-5, -12); g.lineTo(2, -16); g.lineTo(0, -11); g.lineTo(8, -13); g.lineTo(5, -7); g.lineTo(13, -7); g.lineTo(8, -2); g.lineTo(15, 0); g.lineTo(8, 2); g.lineTo(13, 7); g.lineTo(5, 7); g.lineTo(8, 13); g.lineTo(0, 11); g.lineTo(2, 16); g.lineTo(-5, 12); g.closePath(); g.fillStyle = '#fffdf6'; g.fill(); ink(g, 1.8); g.restore(); }
}
for (const mold of [false, true]) dishTop(mold ? 'turkeyMold' : 'turkey', [-214, -206, 214, 214], 340, 300, (g, o, bare, shadow) => {
  const M = mold ? TMAT.mold : TMAT.roast; platterTop(g, 186, bare, shadow);
  legTop(g, M, -1, mold); legTop(g, M, 1, mold);
  for (const sx of [-1, 1]) { g.save(); g.translate(sx * 78, -8); g.rotate(sx * .18); g.beginPath(); g.ellipse(0, 0, 22, 48, 0, 0, TAU); g.fillStyle = M.wing; g.fill(); ink(g, 3); g.restore(); }
  g.beginPath(); g.ellipse(0, 0, 86, 104, 0, 0, TAU); g.fillStyle = rgr(g, -28, -34, 10, 0, 0, 112, [[0, M.top], [.45, M.mid], [.85, M.low], [1, M.deep]]); g.fill(); ink(g, 3.6);
  g.beginPath(); g.moveTo(0, -94); g.quadraticCurveTo(-5, 0, 2, 92); g.lineWidth = mold ? 3 : 4; g.strokeStyle = M.line; g.stroke();
  if (!mold) { for (let i = 0; i < 40; i++) { const a = rnd(i * 3.1) * TAU, r = Math.sqrt(rnd(i * 5.7)) * 80; g.fillStyle = 'rgba(110,50,12,' + (.12 + .2 * rnd(i)) + ')'; g.beginPath(); g.arc(Math.cos(a) * r * .82, Math.sin(a) * r, .9 + 1.5 * rnd(i * 7.1), 0, TAU); g.fill(); } spot(g, -34, -52, 30, 6, -.5, .6, M.hi); spot(g, 40, -62, 12, 4, .3, .4, M.hi); }
  else { for (let i = 0; i < 18; i++) { const a = TAU * i / 18; g.beginPath(); g.arc(Math.cos(a) * 86, Math.sin(a) * 104, 5, 0, TAU); fillInk(g, M.top, 1.5, M.line); } for (const [px, py] of [[-34, -40], [34, -40], [0, 34]]) { for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(px + Math.cos(a) * 5.4, py + Math.sin(a) * 5.4, 3.6, 0, TAU); fillInk(g, M.top, 1.3, M.line); } } spot(g, -30, -50, 30, 8, -.5, .7, '#fffdf2'); }
});
for (const mold of [false, true]) dishTop(mold ? 'pieMold' : 'pie', [-186, -180, 190, 190], 300, 300, (g, o, bare, shadow, info) => {
  const R = 142, fr = R - 22, sl = Math.round(clamp01(o.slice || 0) * 12) / 12;
  if (shadow) shade(g, 4, 8, 172, 168, .4);
  if (!mold) { g.beginPath(); g.arc(0, 0, 152, 0, TAU); g.fillStyle = rgr(g, -40, -50, 20, 0, 0, 152, [[0, '#e9ecf1'], [.8, '#aab1bb'], [1, '#868e99']]); g.fill(); ink(g, 3.6); }
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fillStyle = rgr(g, -30, -40, 10, 0, 0, R, mold ? [[0, '#f4eada'], [1, '#d4c19a']] : [[0, '#f4c887'], [1, '#d08a38']]); g.fill(); ink(g, 3.4, mold ? 'rgba(90,70,40,.8)' : OUT);
  g.strokeStyle = mold ? 'rgba(130,108,70,.5)' : 'rgba(120,64,18,.6)'; g.lineWidth = 2.4; g.lineCap = 'round'; for (let i = 0; i < 52; i++) { const f = TAU * i / 52, c_ = Math.cos(f), s_ = Math.sin(f); g.beginPath(); g.moveTo(c_ * (R - 17), s_ * (R - 17)); g.lineTo(c_ * (R - 2) + s_ * 2, s_ * (R - 2) - c_ * 2); g.stroke(); }
  if (mold) for (let i = 0; i < 30; i++) { const f = TAU * i / 30; g.beginPath(); g.arc(Math.cos(f) * (R - 8), Math.sin(f) * (R - 8), 5.4, 0, TAU); fillInk(g, '#f2e8d0', 1.5, 'rgba(120,96,60,.8)'); }
  g.beginPath(); g.arc(0, 0, fr, 0, TAU); g.fillStyle = mold ? '#e4d6b8' : rgr(g, -30, -36, 6, 0, 0, fr, [[0, '#a8622a'], [.5, '#7a4119'], [1, '#52290e']]); g.fill(); ink(g, 2.4, mold ? 'rgba(120,96,60,.7)' : 'rgba(30,14,4,.7)');
  const pcs = []; for (let i = 0; i < 12; i++) { const f = TAU * i / 12; pcs.push([Math.cos(f) * fr * .74, Math.sin(f) * fr * .74, f + PI / 2]); } for (let i = 0; i < 6; i++) { const f = TAU * (i + .3) / 6; pcs.push([Math.cos(f) * fr * .4, Math.sin(f) * fr * .4, f + PI / 2 + .5]); } pcs.push([0, 0, .4]);
  pcs.forEach(p => pecan(g, p[0], p[1], 17, 9.5, p[2], 1, mold));
  spot(g, -fr * .4, -fr * .45, fr * .22, 5, -.6, mold ? .5 : .35, '#fff4dc');
  if (sl > 0) { const f1 = -70 * PI / 180, f2 = f1 + sl * 86 * PI / 180; g.save(); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R + 1, f1, f2); g.closePath(); g.fillStyle = mold ? '#b49c70' : '#8f97a3'; g.fill(); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke(); g.restore(); }
});
dishTop('jello', [-130, -130, 130, 134], 190, 190, (g, o, bare, shadow) => {
  const col = o.color || '#7be04f', dk = mix(col, '#000000', .35);
  if (shadow) shade(g, 4, 8, 128, 124, .38);
  g.beginPath(); g.arc(0, 0, 116, 0, TAU); fillInk(g, '#e9e3d4', 3); g.beginPath(); g.arc(0, 0, 100, 0, TAU); fillInk(g, '#f7f3ea', 2);
  g.beginPath(); g.arc(0, 0, 82, 0, TAU); g.fillStyle = rgr(g, -24, -30, 8, 0, 0, 84, [[0, mix(col, '#ffffff', .5)], [.5, col], [1, dk]]); g.fill(); ink(g, 3.4);
  g.beginPath(); g.arc(0, 0, 56, 0, TAU); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.18)'; g.stroke();
  const fr = ['#ffb84a', '#ffe36a', '#ff8a4a', '#fff0a0']; for (let i = 0; i < 12; i++) { const a = rnd(i * 2.3) * TAU, r = Math.sqrt(rnd(i * 4.1)) * 62; g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(rnd(i * 5.5) * PI); g.beginPath(); g.ellipse(0, 0, 9, 5.5, 0, 0, TAU); g.fillStyle = fr[i % 4]; g.globalAlpha = .6; g.fill(); g.restore(); }
  spot(g, -34, -42, 22, 6, -.7, .8, '#fff');
});
dishTop('cranCan', [-130, -120, 150, 130], 220, 200, (g, o, bare, shadow) => {
  const n = Math.max(0, Math.min(4, Math.round(o.slices || 0)));
  g.beginPath(); g.arc(0, 0, 118, 0, TAU); fillInk(g, '#e9e3d4', 3); g.beginPath(); g.arc(0, 0, 102, 0, TAU); fillInk(g, '#f7f3ea', 2);
  for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(66 + i * 14, 24 + i * 4, 46, 14, -.2, 0, TAU); g.fillStyle = '#b01b3d'; g.fill(); ink(g, 2.6); spot(g, 56 + i * 14, 18 + i * 4, 14, 3, -.2, .5, '#ffd0da'); }
  if (shadow) shade(g, 3, 6, 66, 62, .36);
  g.beginPath(); g.arc(-18, -4, 62, 0, TAU); g.fillStyle = rgr(g, -38, -26, 6, -18, -4, 64, [[0, '#f0708a'], [.5, '#c8284a'], [1, '#8c1230']]); g.fill(); ink(g, 3.4);
  g.beginPath(); g.arc(-18, -4, 46, 0, TAU); g.lineWidth = 2; g.strokeStyle = 'rgba(40,0,10,.25)'; g.stroke(); spot(g, -40, -28, 18, 5, -.7, .8, '#fff0f4');
});
dishTop('casserole', [-176, -130, 176, 130], 330, 230, (g, o, bare, shadow) => {
  const f = Math.round(clamp01(o.foil == null ? .78 : o.foil) * 4) / 4;
  if (shadow) shade(g, 4, 8, 190, 130, .36);
  for (const sx of [-1, 1]) { g.beginPath(); g.roundRect(sx * 164 - 14, -20, 28, 40, 8); fillInk(g, 'rgba(210,230,240,.8)', 2.8); }
  g.beginPath(); g.roundRect(-154, -104, 308, 208, 26); fillInk(g, 'rgba(224,238,246,.9)', 3.4); g.beginPath(); g.roundRect(-140, -90, 280, 180, 18); g.fillStyle = '#b9a35e'; g.fill(); g.save(); g.clip();
  for (let i = 0; i < 110; i++) { g.fillStyle = ['#e0b45a', '#c98a32', '#f0d089', '#9c6420'][i % 4]; g.beginPath(); g.ellipse(-140 + rnd(i * 1.9) * 280, -90 + rnd(i * 3.7) * 180, 4 + 5 * rnd(i * 5.3), 2 + 2 * rnd(i * 7.9), rnd(i * 9.1) * PI, 0, TAU); g.fill(); } g.restore(); g.beginPath(); g.roundRect(-140, -90, 280, 180, 18); ink(g, 2.4, 'rgba(60,40,10,.7)');
  if (f > 0) { const x1 = -154 + 308 * f; g.save(); g.beginPath(); g.rect(-160, -110, x1 + 160, 220); g.clip(); g.beginPath(); g.roundRect(-156, -106, 312, 212, 28); g.fillStyle = lgr(g, -150, -100, x1, 100, [[0, '#f4f6f8'], [.3, '#c3c9d1'], [.6, '#eef0f3'], [1, '#aab1bb']]); g.fill(); g.strokeStyle = 'rgba(80,90,104,.42)'; g.lineWidth = 1.7; for (let i = 0; i < 12; i++) { const x = -150 + (x1 + 150) * (i + .4) / 12; g.beginPath(); g.moveTo(x, -104); g.lineTo(x + 10, 0); g.lineTo(x - 6, 104); g.stroke(); } g.restore(); g.beginPath(); g.moveTo(x1, -108); for (let i = 0; i <= 8; i++) g.lineTo(x1 + 6 * Math.sin(i * 2.3) + (i % 2 ? 4 : -3), -108 + i * 27); g.lineWidth = 3; g.strokeStyle = OUT; g.stroke(); }
});
dishTop('slowcooker', [-206, -150, 206, 150], 330, 300, (g, o, bare, shadow) => {
  if (shadow) shade(g, 4, 8, 190, 150, .4);
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 140, -16); g.bezierCurveTo(sx * 190, -22, sx * 190, 22, sx * 140, 16); g.lineWidth = 19; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 12.5; g.strokeStyle = '#25272e'; g.stroke(); }
  g.beginPath(); g.arc(0, 0, 148, 0, TAU); g.fillStyle = rgr(g, -40, -50, 20, 0, 0, 150, [[0, '#f6f8fa'], [.5, '#b3b9c2'], [1, '#7d838e']]); g.fill(); ink(g, 3.6);
  g.beginPath(); g.arc(0, 0, 130, 0, TAU); g.fillStyle = '#efe3cb'; g.fill(); ink(g, 3); g.beginPath(); g.arc(0, 0, 118, 0, TAU); g.fillStyle = 'rgba(205,226,240,.55)'; g.fill(); ink(g, 3);
  g.beginPath(); g.arc(0, 0, 96, 0, TAU); g.fillStyle = 'rgba(255,255,255,.18)'; g.fill(); spot(g, -50, -56, 36, 7, -.7, .7, '#fff');
  g.beginPath(); g.arc(0, 0, 18, 0, TAU); fillInk(g, lgr(g, -14, -14, 14, 14, [[0, '#5a5e6a'], [1, '#101114']]), 2.8); spot(g, -5, -6, 6, 3, -.4, .45, '#fff');
});
dishTop('pizzaBox', [-176, -176, 176, 180], 330, 330, (g, o, bare, shadow) => {
  const op = clamp01(o.open || 0); if (shadow) shade(g, 5, 9, 190, 186, .38);
  g.beginPath(); g.roundRect(-158, -158, 316, 316, 8); fillInk(g, '#d8b077', 3.4);
  if (op > .3) { g.beginPath(); g.arc(0, 0, 132, 0, TAU); fillInk(g, '#e8b25a', 3); g.beginPath(); g.arc(0, 0, 114, 0, TAU); g.fillStyle = '#d94a2a'; g.fill(); g.beginPath(); g.arc(0, 0, 106, 0, TAU); g.fillStyle = '#f2c14e'; g.fill(); for (let i = 0; i < 9; i++) { const a = TAU * i / 9 + .3, r = i % 2 ? 66 : 28; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 13, 0, TAU); fillInk(g, '#b02a24', 1.8); } }
  else { g.fillStyle = '#c93a2a'; g.fillRect(-158, -90, 316, 22); g.beginPath(); g.moveTo(-26, -20); g.lineTo(30, -20); g.lineTo(2, 34); g.closePath(); fillInk(g, '#f2c14e', 2.4); g.beginPath(); g.roundRect(-158, -158, 316, 316, 8); ink(g, 3.4); }
});
for (const [kind, rx, draw] of [['turkeySlices', 160, (g) => { for (let i = 0; i < 7; i++) { const u = i / 6 - .5; sliceShape(g, u * 200, -u * u * 70 - 4, -.9 + u * .5, .9, i % 2 ? '#e9cca0' : '#efd5ac'); } }], ['turkeyChop', 150, (g) => { for (let i = 0; i < 36; i++) { const a = rnd(i * 3.1) * TAU, r = Math.sqrt(rnd(i * 5.3)) * 78, cols = ['#ecd2a8', '#e0bd8a', '#f2dfbd', '#cf9f58', '#d9b27a']; g.save(); g.translate(Math.cos(a) * r, Math.sin(a) * r); g.rotate(rnd(i * 7.1) * PI); g.beginPath(); g.roundRect(-12, -10, 24, 20, 6); g.fillStyle = cols[i % 5]; g.fill(); ink(g, 2, 'rgba(60,34,12,.7)'); g.restore(); } }],
  ['turkeyMince', 150, (g) => { const pts = []; for (let i = 0; i < 24; i++) { const a = TAU * i / 24, r = 90 * (1 + .07 * (rnd(i * 2.9) - .5)); pts.push([Math.cos(a) * r, Math.sin(a) * r]); } smooth(g, pts, true, .45); g.fillStyle = '#d6b27c'; g.fill(); g.save(); smooth(g, pts, true, .45); g.clip(); const cols = ['#f1dbb2', '#e0bd88', '#cf9f60', '#b8844a', '#ead2a6']; for (let i = 0; i < 260; i++) { const a = rnd(i * 1.3) * TAU, r = Math.sqrt(rnd(i * 2.1)) * 92; g.fillStyle = cols[i % 5]; g.beginPath(); g.ellipse(Math.cos(a) * r, Math.sin(a) * r, 3.4, 2.6, rnd(i * 3.3) * PI, 0, TAU); g.fill(); } g.restore(); smooth(g, pts, true, .45); ink(g, 2.8); }],
  ['turkeyPuree', 150, (g) => { const M = TMAT.mold; g.beginPath(); g.arc(0, 0, 86, 0, TAU); g.fillStyle = rgr(g, -26, -30, 8, 0, 0, 90, [[0, M.hi], [.5, M.top], [1, M.low]]); g.fill(); ink(g, 3.2); g.strokeStyle = M.line; g.lineWidth = 2.4; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(0, 0, 66 - k * 20, PI * .1 + k, PI * 1.5 + k); g.stroke(); } spot(g, -30, -36, 20, 6, -.6, .7, '#fffcf0'); }]]) dishTop(kind, [-190, -184, 190, 190], 320, 300, (g, o, bare, shadow) => { platterTop(g, rx + 12, bare, shadow); draw(g); });
dishTop('blender', [-110, -110, 130, 120], 190, 190, (g, o, bare, shadow) => {
  if (shadow) shade(g, 4, 8, 118, 116, .38); g.beginPath(); g.arc(0, 0, 96, 0, TAU); fillInk(g, '#2b2d34', 3.4); g.beginPath(); g.moveTo(70, -12); g.bezierCurveTo(130, -20, 130, 24, 70, 14); g.lineWidth = 17; g.strokeStyle = OUT; g.lineCap = 'round'; g.stroke(); g.lineWidth = 11; g.strokeStyle = '#2b2e37'; g.stroke();
  g.beginPath(); g.arc(0, 0, 84, 0, TAU); g.fillStyle = rgr(g, -24, -28, 8, 0, 0, 88, [[0, '#5a5e6a'], [1, '#17181d']]); g.fill(); ink(g, 2.6); g.beginPath(); g.arc(0, 0, 24, 0, TAU); fillInk(g, '#23252c', 2.4); spot(g, -40, -44, 22, 5, -.7, .35, '#fff');
});
/* @@BATCH-INSERT@@ */
})();
