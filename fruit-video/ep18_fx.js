'use strict';
/* SHIFT HAPPENS, Episode 18: The Fire Drill. The effects kit `window.FX18` (owner: the FX builder). Contract: /tmp/shift_tools/briefs/FX18_API.md; usage, costs and traps: GUIDE_FX18.md in this folder.
 *
 * Every function is `FX18.name(c, o)` with `c` the 2D context to draw into (scenes pass `ctx`) and `o` an options object. WORLD functions draw in the transform you already have; SCREEN functions (wash, vignette)
 * reset it and use 1080 x 1920. All of them are PURE functions of their arguments and `t` (scene-local seconds): no Math.random, no Date, no state, so every worker renders the same frame, in any order. Randomness comes
 * only from FX18.rnd(seed, k). Each call saves and restores the context state. Soft shapes are drawn from cached sprites (FX18.sprite), never from per-particle gradients or ctx.filter.
 *
 * AS BUILT
 *   alarm pattern   HORN, hornOn(k), strobe(k), hornK(lt, start, stop) [added], hornPulse(k) [added]
 *   light passes    wash {color, alpha, mode, steady}, vignette {alpha, color}, glow {x, y, r, color, alpha, core}, cone {x, y, ang, spread, len, color, alpha, soft}, lamp {x, y, level, r, color, rays},
 *                   pool {x, y, rx, ry, color, alpha} [added]
 *   matter          foamJet {nozzle, t0, t1, t, rate, speed, spread, size, gravity, seed, color, drag [added]}, foamPile {x, y, w, h, t, t0, grow, seed, color},
 *                   flame {x, y, w, h, t, seed, power, lean, kind: log|torch|candle|blaze, glow [added]}, embers {x, y, w, t, seed, count, rise}, puff {x, y, r, t, t0, life, color, n, flat [added], seed},
 *                   sparks {x, y, t, t0, count, speed, life, gravity, seed, color}, smoke {x, y, w, h, t, t0, t1 [added], seed, density, rise, color, drift, life, rate [added]},
 *                   water {x, y, ang, spread, len, t, t0, t1, seed, drops}, smokeLayer {x0, x1, yTop, depth, t, seed, color, alpha}
 *   helpers         rnd, noise, sprite, clamp01, seg, lerp, ease{out, in, io, back}, rgb, rgba, mix, STROBE_TAU
 * Tests: fx18_demo.html and fx18_test.js (determinism, cost, contact sheets, the real renderer over a Strawberry).
 */
(() => {
const FX18 = window.FX18 = {};
const TAU = Math.PI * 2, PI = Math.PI;
const EPS = 1e-6;                      /* cue times snapped to a frame can differ from the frame time by a float error: treat [start, end) boundaries with this much slack */

// ------------------------------------------------------------------ helpers
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => b === a ? (t >= a ? 1 : 0) : clamp01((t - a) / (b - a));
const sstep = (a, b, x) => { const k = seg(x, a, b); return k * k * (3 - 2 * k); };
const ease = {
  out: k => { k = clamp01(k); return 1 - (1 - k) * (1 - k) * (1 - k); },
  in: k => { k = clamp01(k); return k * k * k; },
  io: k => { k = clamp01(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
  back: (k, s = 1.7) => { k = clamp01(k); const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); },
};
/* a hash of (seed, k) in [0, 1): integer mixing, identical in every worker and every run; seed and k may be any finite numbers (fractions count) */
function rnd(seed, k) {
  seed = +seed || 0; k = +k || 0;
  const a = Math.floor(seed), af = seed - a, b = Math.floor(k), bf = k - b;
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x632be5ab | 0, 0x85ebca6b);
  h ^= Math.imul((af * 16384) | 0, 0xc2b2ae35) ^ Math.imul(((bf * 16384) | 0) + 0x1b873593 | 0, 0x27d4eb2f);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
/* smooth 1D value noise in [0, 1] (cubic between hashed lattice points): slow wander for flicker, sway and drift */
function noise(seed, x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return rnd(seed, i) * (1 - u) + rnd(seed, i + 1) * u;
}
/* smooth 2D value noise in [0, 1] (used to bake sprites) */
function noise2(seed, x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (i, j) => rnd(seed + j * 17.31, i);
  return lerp(lerp(h(ix, iy), h(ix + 1, iy), ux), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), ux), uy);
}
const RGBC = new Map();
function rgb(css) {
  if (Array.isArray(css)) return css;
  let v = RGBC.get(css);
  if (v) return v;
  let s = String(css).trim(), r = 255, g = 255, b = 255;
  if (s[0] === '#') {
    if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    const n = parseInt(s.slice(1, 7), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255;
  } else { const m = s.match(/[\d.]+/g); if (m && m.length >= 3) { r = +m[0]; g = +m[1]; b = +m[2]; } }
  v = [r, g, b]; if (RGBC.size > 600) RGBC.clear(); RGBC.set(css, v); return v;
}
const rgba = (css, a) => { const c = rgb(css); return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (+(a < 0 ? 0 : a > 1 ? 1 : a).toFixed(4)) + ')'; };
const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return 'rgb(' + Math.round(lerp(A[0], B[0], k)) + ',' + Math.round(lerp(A[1], B[1], k)) + ',' + Math.round(lerp(A[2], B[2], k)) + ')'; };
const SW = () => typeof W === 'number' ? W : 1080, SH = () => typeof H === 'number' ? H : 1920;
/* a cached offscreen canvas: drawFn(g, w, h) must be a pure function of `key` (the size is added to the key). The cache is only a speed-up: dropping it never changes a pixel. */
const SPR = new Map();
function sprite(key, w, h, draw) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const kk = key + '|' + w + 'x' + h;
  let cv = SPR.get(kk);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  if (SPR.size > 700) SPR.clear();
  SPR.set(kk, cv);
  return cv;
}
/* every function starts from a clean state (the caller's transform stays) */
function clean(c) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.shadowBlur = 0; c.shadowColor = 'rgba(0,0,0,0)'; c.imageSmoothingEnabled = true; }
/* the engine's bloom layer takes a copy of the light: only when we draw into the live engine context (V2.emit uses its current transform) */
function bloom(c, x, y, r, col, a) {
  if (!(a > .01)) return;
  try { if (typeof V2 !== 'undefined' && V2.emit && typeof ctx !== 'undefined' && c === ctx) V2.emit(x, y, r, col, a); } catch (e) { /* no engine: nothing to feed */ }
}

// ------------------------------------------------------------------ the alarm pattern (temporal three; the sound uses the same numbers)
const HORN = { period: 4.0, on: 0.5, off: 0.5, pulses: 3, gap: 1.5 };
const STROBE_TAU = 0.22;
/* 0 or 1: the horn is sounding. k = seconds since the horn started (lt - the scene-local second of the horn3 cue). */
function hornOn(k) {
  k += EPS;
  if (!(k >= 0)) return 0;
  const step = HORN.on + HORN.off, m = k % HORN.period;
  if (m >= step * HORN.pulses) return 0;
  return (m % step) < HORN.on ? 1 : 0;
}
/* 0..1: the wall strobes. Jumps to 1 on the first frame of each horn pulse, then decays exponentially (tau .22 s); nothing else. */
function strobe(k) {
  k += EPS;
  if (!(k >= 0)) return 0;
  const step = HORN.on + HORN.off, m = k % HORN.period, idx = Math.min(HORN.pulses - 1, Math.floor(m / step));
  const v = Math.exp(-(m - idx * step) / STROBE_TAU);
  return v < .012 ? 0 : v;
}
/* k for a scene that has a start and a stop cue: -1 (silent) before `start` and from `stop` on */
function hornK(lt, start, stop) { return (lt >= start - EPS && (stop == null || lt < stop - EPS)) ? Math.max(0, lt - start) : -1; }
/* { on, index, age }: index 0..2 while a pulse sounds (else -1); age = seconds since the latest pulse began (Infinity before the first) */
function hornPulse(k) {
  k += EPS;
  if (!(k >= 0)) return { on: 0, index: -1, age: Infinity };
  const step = HORN.on + HORN.off, m = k % HORN.period, idx = Math.min(HORN.pulses - 1, Math.floor(m / step)), age = m - idx * step;
  const on = (m < step * HORN.pulses && age < HORN.on) ? 1 : 0;
  return { on, index: on ? idx : -1, age };
}

// ------------------------------------------------------------------ light and screen passes
/* SCREEN. A full-frame colour wash. mode: 'add' | 'screen' | 'multiply' | 'normal'. A flash (add/screen) is capped at .35 alpha unless the wash is steady (it does not pulse). */
function wash(c, o = {}) {
  const mode = o.mode || 'normal';
  let a = o.alpha == null ? 1 : o.alpha;
  if ((mode === 'add' || mode === 'screen') && !o.steady) a = Math.min(a, .35);
  if (!(a > .002)) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); clean(c);
  c.globalCompositeOperation = mode === 'add' ? 'lighter' : mode === 'multiply' ? 'multiply' : mode === 'screen' ? 'screen' : 'source-over';
  c.globalAlpha = clamp01(a); c.fillStyle = o.color || '#ffffff'; c.fillRect(0, 0, SW(), SH());
  c.restore();
}
/* SCREEN. Darkened corners: an ellipse that follows the frame, smooth falloff. The gradient is baked once at 1/8 size (per colour) and blitted up: a full-frame gradient fill costs 8 ms in the software renderer. */
function vignette(c, o = {}) {
  const a = o.alpha == null ? .35 : o.alpha;
  if (!(a > .002)) return;
  const w = SW(), h = SH(), col = o.color || '#000000';
  const spr = sprite('vig:' + col, w / 8, h / 8, (g, sw, sh) => {
    g.translate(sw / 2, sh / 2); g.scale(sw / 2, sh / 2);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2);
    for (const [s, k] of [[0, 0], [.38, 0], [.52, .07], [.66, .22], [.8, .52], [.92, .82], [1, 1]]) gr.addColorStop(s, rgba(col, k));
    g.fillStyle = gr; g.fillRect(-1.01, -1.01, 2.02, 2.02);
  });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); clean(c);
  c.globalAlpha = clamp01(a); c.drawImage(spr, 0, 0, w, h);
  c.restore();
}
/* the soft glow sprite: a hot core and a long halo (a gaussian plus a power tail), colour baked in */
function glowSprite(col) {
  return sprite('glow:' + col, 128, 128, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    for (let i = 0; i <= 18; i++) { const u = i / 18, a = .65 * Math.exp(-Math.pow(u * 3.2, 2)) + .35 * Math.pow(1 - u, 2.5); gr.addColorStop(u, rgba(col, a)); }
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
function hotSprite(col) {
  const hot = mix(col, '#ffffff', .78);
  return sprite('hot:' + hot, 96, 96, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    for (let i = 0; i <= 14; i++) { const u = i / 14, a = Math.pow(1 - u, 1.6) * (u < .5 ? 1 : 1); gr.addColorStop(u, rgba(i === 0 ? '#ffffff' : hot, a)); }
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
/* WORLD. A radial additive glow (an LED, an exit sign's halo, a lamp). core 0..1 is the hot near-white centre. Feeds the engine's bloom. */
function glow(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, r = o.r == null ? 60 : o.r, col = o.color || '#ffcc66', a = o.alpha == null ? 1 : o.alpha, core = o.core || 0;
  if (!(a > .004) || !(r > .5)) return;
  c.save(); clean(c); c.globalCompositeOperation = 'lighter';
  const spr = glowSprite(col);
  c.globalAlpha = clamp01(a); c.drawImage(spr, x - r, y - r, r * 2, r * 2);
  if (a > 1) { c.globalAlpha = clamp01(a - 1); c.drawImage(spr, x - r, y - r, r * 2, r * 2); }
  if (core > .004) { const cr = r * .34; c.globalAlpha = clamp01(a * core); c.drawImage(hotSprite(col), x - cr, y - cr, cr * 2, cr * 2); }
  c.restore();
  bloom(c, x, y, r * .8, col, Math.min(1, a) * .35);
}
/* WORLD. A soft elliptical light pool (an exit sign's wash on the floor, a lamp on a desk): rx and ry are the radii. */
function pool(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, rx = o.rx == null ? 160 : o.rx, ry = o.ry == null ? rx * .35 : o.ry, a = o.alpha == null ? .5 : o.alpha, col = o.color || '#fff0c8';
  if (!(a > .004) || !(rx > .5) || !(ry > .5)) return;
  c.save(); clean(c); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp01(a);
  c.translate(x, y); c.scale(1, ry / rx); c.drawImage(glowSprite(col), -rx, -rx, rx * 2, rx * 2);
  c.restore();
}
/* a light cone baked once per (colour, spread, softness): length 256 along +x from the origin, alpha = radial falloff x angular edge x a bright axis x a little streak noise */
const CONE_L = 256;
function coneSprite(col, spread, soft) {
  const sp = Math.max(.04, Math.min(2.8, spread)), q = Math.round(sp / .02), qs = Math.round(soft / .05), hs = q * .02 / 2, sf = qs * .05, rr = rgb(col);
  const hh = Math.max(8, Math.ceil(2 * CONE_L * Math.sin(Math.min(hs, 1.45))) + 2);
  return sprite('cone:' + col + ':' + q + ':' + qs, CONE_L, hh, (g, w, h) => {
    const id = g.createImageData(w, h), d = id.data, cy = h / 2;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const dx = px + .5, dy = py + .5 - cy, r = Math.hypot(dx, dy), u = r / CONE_L;
      if (u >= 1 || dx <= 0) continue;
      const th = Math.atan2(dy, dx), v = Math.abs(th) / hs;
      if (v >= 1) continue;
      const edge = 1 - sstep(1 - sf, 1, v), axis = .74 + .26 * (1 - v * v), fall = Math.pow(1 - u, 1.35) * sstep(0, .035, u);
      const n = 1 + .22 * (noise2(5, th / hs * 4.5 + 9, u * 1.6) - .5) + .12 * (noise2(11, th / hs * 11 + 3, u * 3.2) - .5);
      const a = clamp01(edge * axis * fall * n);
      const i = (py * w + px) * 4; d[i] = rr[0]; d[i + 1] = rr[1]; d[i + 2] = rr[2]; d[i + 3] = Math.round(a * 255);
    }
    g.putImageData(id, 0, 0);
  });
}
/* WORLD. A soft light cone from (x, y) along ang (radians, 0 = +x, pi/2 = down on screen), full angle `spread`, length `len`. soft 0..1 = how much of the edge fades. */
function cone(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, ang = o.ang || 0, spread = o.spread == null ? .6 : o.spread, len = o.len == null ? 600 : o.len, a = o.alpha == null ? .5 : o.alpha;
  if (!(a > .004) || !(len > 1)) return;
  const spr = coneSprite(o.color || '#fff2c8', spread, o.soft == null ? .55 : o.soft), k = len / CONE_L;
  c.save(); clean(c); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp01(a);
  c.translate(x, y); c.rotate(ang); c.scale(k, k);
  c.drawImage(spr, 0, -spr.height / 2);
  if (a > 1) { c.globalAlpha = clamp01(a - 1); c.drawImage(spr, 0, -spr.height / 2); }
  c.restore();
}
/* WORLD. A strobe lamp. level 0..1 (pass FX18.strobe(k)): hot white core, bloom, a few thin rays; level 0 is the dead lens (a pale grey disc with a highlight). */
function lamp(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, lv = clamp01(o.level || 0), r = o.r == null ? 14 : o.r, col = o.color || '#fff0dc', nr = o.rays == null ? 8 : o.rays;
  c.save(); clean(c);
  if (lv > .01) {
    const e = Math.pow(lv, .8);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = clamp01(.5 * e); const R = r * (3 + 7 * e); c.drawImage(glowSprite(col), x - R, y - R, R * 2, R * 2);
    /* thin rays: a fixed fan with uneven lengths, longer as the flash is brighter */
    c.lineCap = 'round';
    for (let i = 0; i < nr; i++) {
      const a = i / nr * TAU + .31 + (rnd(7, i) - .5) * .25, L = r * (2.2 + 3.4 * rnd(3, i)) * (.45 + 1.1 * e), x0 = x + Math.cos(a) * r * .8, y0 = y + Math.sin(a) * r * .8, x1 = x + Math.cos(a) * (r * .8 + L), y1 = y + Math.sin(a) * (r * .8 + L);
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba('#ffffff', .85 * e)); g.addColorStop(1, rgba(col, 0));
      c.strokeStyle = g; c.lineWidth = Math.max(1.2, r * (i % 2 ? .1 : .16)); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    /* a thin flat streak across the lens, as a real xenon strobe leaves on a camera */
    const sw = r * (5 + 9 * e), gs = c.createLinearGradient(x - sw, y, x + sw, y); gs.addColorStop(0, rgba(col, 0)); gs.addColorStop(.5, rgba('#ffffff', .55 * e)); gs.addColorStop(1, rgba(col, 0));
    c.fillStyle = gs; c.fillRect(x - sw, y - Math.max(1, r * .05), sw * 2, Math.max(2, r * .1));
    c.globalCompositeOperation = 'source-over';
  }
  /* the lens: dead grey at level 0, whitening as it fires */
  const lit = sstep(.0, .5, lv), base = mix('#c9ccd1', '#ffffff', lit), edge = mix('#8f959c', '#ffe9c8', lit);
  const lg = c.createRadialGradient(x - r * .3, y - r * .35, r * .08, x, y, r);
  lg.addColorStop(0, mix('#f4f6f8', '#ffffff', lit)); lg.addColorStop(.55, base); lg.addColorStop(1, edge);
  c.fillStyle = lg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.lineWidth = Math.max(1, r * .1); c.strokeStyle = rgba(mix('#6c727a', '#ffd9a0', lit), 1); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  if (lv > .01) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp01(lv * 1.3); const hr = r * 2.1; c.drawImage(hotSprite(col), x - hr, y - hr, hr * 2, hr * 2); }
  c.restore();
  bloom(c, x, y, r * 6, col, lv * .55);
}

Object.assign(FX18, { HORN, hornOn, strobe, hornK, hornPulse, wash, vignette, glow, pool, cone, lamp, rnd, noise, sprite, clamp01, seg, lerp, ease, rgb, rgba, mix, STROBE_TAU });
// ------------------------------------------------------------------ batch 2: foam (an extinguisher jet and a pile of it)
/* tones of a foam colour: a bright top, a bluish-white body, a faint blue-grey shadow side */
function foamTones(col) { return { hi: mix(col, '#ffffff', .75), mid: mix(col, '#f1f5fa', .4), lo: mix(col, '#b4c6dc', .4), deep: mix(col, '#8aa0bf', .52) }; }
/* one lit bubble-ball: light from the upper left, a blue-grey underside, a few surface bubbles and a pin-prick highlight (variants 0..9 differ in their bubbles) */
function foamBallSprite(col, v) {
  return sprite('fball2:' + col + ':' + v, 96, 96, (g, w) => {
    const c0 = w / 2, r = 45, T = foamTones(col);
    g.save(); g.beginPath(); g.arc(c0, c0, r, 0, TAU); g.clip();
    /* directional shading: the gradient is centred up-left and reaches past the ball, so only the lower right edge goes blue-grey */
    const gr = g.createRadialGradient(c0 - r * .3, c0 - r * .38, r * .05, c0 - r * .18, c0 - r * .22, r * 1.42);
    gr.addColorStop(0, rgba(T.hi, 1)); gr.addColorStop(.3, rgba(T.mid, 1)); gr.addColorStop(.6, rgba(T.mid, 1)); gr.addColorStop(.8, rgba(T.lo, 1)); gr.addColorStop(1, rgba(T.deep, 1));
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.restore();
    /* surface bubbles: small rimmed circles on the lit side */
    const nb = 3 + (v % 3);
    for (let i = 0; i < nb; i++) {
      const a = rnd(31 + v, i * 3) * TAU, d = r * (.2 + .55 * rnd(32 + v, i * 3 + 1)), br = r * (.07 + .09 * rnd(33 + v, i * 3 + 2)), bx = c0 + Math.cos(a) * d, by = c0 + Math.sin(a) * d;
      g.fillStyle = rgba(T.hi, .5); g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
      g.lineWidth = Math.max(1, br * .2); g.strokeStyle = rgba(T.lo, .6 + .25 * (by > c0 ? 1 : 0)); g.beginPath(); g.arc(bx, by, br, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(bx - br * .35, by - br * .35, br * .26, 0, TAU); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(c0 - r * .3, c0 - r * .42, r * .16, r * .1, -.5, 0, TAU); g.fill();
  });
}
/* a foam chunk: three or four balls fused, with an under-shadow (the heavy clumps of a jet and the crown of a pile) */
function foamClumpSprite(col, v) {
  return sprite('fclump:' + col + ':' + v, 128, 128, (g, w) => {
    const c0 = w / 2, T = foamTones(col), n = 4, R = 22;
    const sh = g.createRadialGradient(c0 + 6, c0 + 12, 4, c0 + 6, c0 + 12, 54); sh.addColorStop(0, rgba(T.deep, .55)); sh.addColorStop(1, rgba(T.deep, 0)); g.fillStyle = sh; g.fillRect(0, 0, w, w);
    const L = [];
    for (let i = 0; i < n; i++) { const a = rnd(41 + v, i * 2) * TAU, d = i ? R * (.55 + .7 * rnd(42 + v, i * 2 + 1)) : 0; L.push({ x: c0 + Math.cos(a) * d, y: c0 + Math.sin(a) * d * .8, r: R * (i ? .95 + .45 * rnd(43 + v, i) : 1.5) }); }
    L.sort((p, q) => q.y - p.y);
    for (const b of L) {
      g.save(); g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.clip();
      const gr = g.createRadialGradient(b.x - b.r * .3, b.y - b.r * .38, b.r * .05, b.x - b.r * .18, b.y - b.r * .22, b.r * 1.42);
      gr.addColorStop(0, rgba(T.hi, 1)); gr.addColorStop(.3, rgba(T.mid, 1)); gr.addColorStop(.6, rgba(T.mid, 1)); gr.addColorStop(.8, rgba(T.lo, 1)); gr.addColorStop(1, rgba(T.deep, 1));
      g.fillStyle = gr; g.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2); g.restore();
    }
    for (let i = 0; i < 4; i++) {
      const b = L[i % L.length], a = -.4 - rnd(44 + v, i) * 2.2, bx = b.x + Math.cos(a) * b.r * .62, by = b.y + Math.sin(a) * b.r * .62, br = 3 + 3 * rnd(45 + v, i);
      g.fillStyle = rgba(T.hi, .6); g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); g.lineWidth = 1.3; g.strokeStyle = rgba(T.lo, .85); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(bx - br * .3, by - br * .3, br * .28, 0, TAU); g.fill();
    }
  });
}
function mistSprite(col) {
  return sprite('mist:' + col, 32, 32, (g, w) => { const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, rgba(mix(col, '#ffffff', .6), .95)); gr.addColorStop(.5, rgba(col, .55)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
}
/* the soft body of a foam mass: a smooth white puff with a faint blue-grey underside (it fills the gaps between the bubble-balls so the foam reads as one thick mass) */
function foamBodySprite(col) {
  return sprite('fbody:' + col, 96, 96, (g, w) => {
    const c0 = w / 2, r = 46, T = foamTones(col), gr = g.createRadialGradient(c0 - r * .18, c0 - r * .26, r * .05, c0, c0, r);
    gr.addColorStop(0, rgba(T.hi, 1)); gr.addColorStop(.5, rgba(T.mid, 1)); gr.addColorStop(.78, rgba(T.lo, .9)); gr.addColorStop(1, rgba(T.deep, 0));
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
const FOAM_SCR = new Float32Array(1024 * 8);
/* WORLD. Extinguisher foam. nozzle(te) -> {x, y, ang} is a function of an ABSOLUTE scene-local time: a particle born at te leaves from nozzle(te) along ang + spread * (rnd - .5)
 * (a triangular spread: dense on the axis), speed px/s slowed by `drag` per second, falls with `gravity` px/s^2 (terminal speed gravity / drag), grows while it flies and fades over ~1.4 s.
 * Heavy clumps (1 in 8) fall faster and last longer; a fine mist rides the edge. Two passes: a soft white body (a continuous mass) then shaded bubble-balls on top.
 * The emitter may move and spin: the jet curls with it. Keep nozzle() cheap: it is called once per live particle. */
function foamJet(c, o = {}) {
  const nozzle = o.nozzle, t = o.t;
  if (typeof nozzle !== 'function' || !(t >= 0 || t < 0)) return;
  const t0 = o.t0 == null ? 0 : o.t0, t1 = o.t1 == null ? Infinity : o.t1, rate = o.rate == null ? 120 : o.rate, speed = o.speed == null ? 1100 : o.speed, spread = o.spread == null ? .35 : o.spread;
  const size = o.size == null ? 34 : o.size, grav = o.gravity == null ? 700 : o.gravity, drag = Math.max(.01, o.drag == null ? .9 : o.drag), seed = o.seed || 0, col = o.color || '#ffffff', LIFE = 1.4, LMAX = LIFE * 1.7;
  if (t < t0 || !(rate > 0)) return;
  const tE = Math.min(t, t1), iLo = Math.max(0, Math.ceil((t - LMAX - t0) * rate) - 1), iHi = Math.min(iLo + 1000, Math.floor((tE - t0) * rate));
  if (iHi < iLo) return;
  c.save(); clean(c);
  /* the fine mist first (behind): small fast dots on a wider fan */
  const sprM = mistSprite(col), md = drag * 1.2;
  for (let i = iLo; i <= iHi; i += 2) {
    const te = t0 + (i + rnd(seed + 7, i)) / rate, age = t - te, life = .55 + .35 * rnd(seed + 8, i);
    if (te > tE || age < 0 || age > life) continue;
    const nz = nozzle(te); if (!nz) continue;
    const ang = nz.ang + spread * 1.3 * (rnd(seed + 9, i) + rnd(seed + 10, i) - 1) * .5, v = speed * (1 + .35 * rnd(seed + 11, i)), E = 1 - Math.exp(-md * age);
    const x = nz.x + Math.cos(ang) * v * E / md, y = nz.y + Math.sin(ang) * v * E / md + (grav / md) * (age - E / md), k = age / life, rr = size * (.2 + .3 * rnd(seed + 12, i)) * (.6 + .6 * k);
    c.globalAlpha = .55 * (1 - k) * Math.min(1, age / .04); c.drawImage(sprM, x - rr, y - rr, rr * 2, rr * 2);
  }
  /* the particles: state first (x, y, radius, alpha, clump, variant), then two passes */
  const S = FOAM_SCR; let n = 0;
  for (let i = iLo; i <= iHi; i++) {
    const te = t0 + (i + rnd(seed + 1, i)) / rate, age = t - te;
    if (te > tE || age < 0) continue;
    const clump = rnd(seed + 4, i) < .125, life = LIFE * (.8 + .4 * rnd(seed + 5, i)) * (clump ? 1.6 : 1);
    if (age > life) continue;
    const nz = nozzle(te); if (!nz) continue;
    const ang = nz.ang + spread * (rnd(seed + 2, i) + rnd(seed + 3, i) - 1) * .5, v = speed * (.7 + .5 * rnd(seed + 6, i)) * (clump ? .72 : 1), dr = drag * (clump ? 1.35 : 1), g = grav * (clump ? 1.6 : 1);
    const E = 1 - Math.exp(-dr * age), k = age / life;
    const rad = size * (clump ? 1.25 : 1) * (.38 + .62 * ease.out(age / (life * .7))) * (.8 + .45 * rnd(seed + 13, i)) * (1 - .55 * sstep(.5, 1, k));
    const a = sstep(0, .05, k) * (1 - sstep(.84, 1, k));   /* bubbles shrink and pop instead of fading to a grey ghost */
    if (a < .01 || rad < .5) continue;
    const j = n * 8; S[j] = nz.x + Math.cos(ang) * v * E / dr; S[j + 1] = nz.y + Math.sin(ang) * v * E / dr + (g / dr) * (age - E / dr); S[j + 2] = rad; S[j + 3] = a; S[j + 4] = clump ? 1 : 0; S[j + 5] = i; S[j + 6] = age; n++;
  }
  c.globalAlpha = 1;
  const balls = [], clumps = [];
  for (let v = 0; v < 10; v++) { balls.push(foamBallSprite(col, v)); clumps.push(foamClumpSprite(col, v)); }
  /* the dense core: young particles also draw a soft solid-white body so the first stretch of the jet is one bright mass */
  const body = foamBodySprite(col);
  for (let q = 0; q < n; q++) {
    const j = q * 8, age = S[j + 6];
    if (age > .17 || S[j + 4]) continue;
    const R = S[j + 2] * 2.3; c.globalAlpha = .92 * (1 - age / .17) * Math.min(1, S[j + 3] * 1.2); c.drawImage(body, S[j] - R, S[j + 1] - R, R * 2, R * 2);
  }
  for (let q = 0; q < n; q++) {
    const j = q * 8, i = S[j + 5], vi = Math.floor(rnd(seed + 14, i) * 10);
    c.globalAlpha = S[j + 3];
    if (S[j + 4]) { const R = S[j + 2] * 1.9; c.drawImage(clumps[vi], S[j] - R, S[j + 1] - R, R * 2, R * 2); }
    else { const R = S[j + 2] * 1.15; c.drawImage(balls[vi], S[j] - R, S[j + 1] - R, R * 2, R * 2); }
  }
  c.globalAlpha = 1;
  /* the nozzle itself: a bright dense burst while it is firing */
  if (t <= t1 + .05 && t >= t0) {
    const nz = nozzle(Math.min(t, t1));
    if (nz) { const rr = size * 1.5 * seg(t, t0, t0 + .08) * (1 - seg(t, t1, t1 + .05)); if (rr > 1) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55; c.drawImage(glowSprite('#ffffff'), nz.x - rr, nz.y - rr, rr * 2, rr * 2); } }
  }
  c.restore();
}
/* WORLD. A blob of foam on a surface or a character: (x, y) is the bottom centre, w x h the size when grown. It swells from nothing at t0 over `grow` seconds (default .8): a soft body, then
 * bubble-balls in a bumpy hump with a flat bottom, a faint contact shadow, small bubbles at the rim that grow and pop. For other shapes call it several times (a beard, a pool, a cap). */
function foamPile(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w == null ? 160 : o.w, h = o.h == null ? w * .6 : o.h, t = o.t || 0, t0 = o.t0 == null ? 0 : o.t0, grow = Math.max(.05, o.grow == null ? .8 : o.grow), seed = o.seed || 0, col = o.color || '#ffffff';
  const K = seg(t, t0, t0 + grow);
  if (K <= 0 || w < 2 || h < 2) return;
  c.save(); clean(c);
  const T = foamTones(col), kk = ease.out(K);
  /* contact shadow */
  c.globalAlpha = .34 * kk; const sw = w * .62 * (.4 + .6 * kk); c.save(); c.translate(x, y + h * .02); c.scale(1, .16); c.drawImage(glowSprite(T.deep), -sw, -sw, sw * 2, sw * 2); c.restore(); c.globalAlpha = 1;
  /* the lobes: a guaranteed base row, then random fill up to the hump, in a few sizes (big mounds and small froth) */
  const L = [], B = Math.max(3, Math.round(w / 34));
  for (let j = 0; j < B; j++) { const u = B === 1 ? 0 : -1 + 2 * j / (B - 1), r = w * (.15 - .03 * Math.abs(u)) * (.9 + .25 * rnd(seed, j)); L.push({ u: u * .88, r, cy: y - r * .86, d: rnd(seed + 50, j) }); }
  const N = Math.max(6, Math.min(48, Math.round(w * h / 1100)));
  for (let j = 0; j < N; j++) {
    const u = (rnd(seed + 60, j) * 2 - 1) * .92, top = h * Math.pow(Math.max(0, 1 - u * u), .5), big = rnd(seed + 64, j) < .45, r = Math.min(Math.max(top * .5, h * .1), w * (big ? .1 + .08 * rnd(seed + 61, j) : .045 + .04 * rnd(seed + 61, j)));
    L.push({ u, r, cy: y - r - rnd(seed + 62, j) * Math.max(0, top - 2 * r), d: rnd(seed + 63, j) });
  }
  L.sort((p, q) => q.cy - p.cy || p.u - q.u);
  const body = foamBodySprite(col), balls = [];
  for (let v = 0; v < 10; v++) balls.push(foamBallSprite(col, v));
  const pos = L.map(b => { const lk = ease.back(seg(K, b.d * .5, b.d * .5 + .5), 1.5); return { x: x + b.u * w * .5, y: y - (y - b.cy) * (.55 + .45 * lk), r: b.r * lk }; });
  for (const p of pos) { const R = p.r * 1.45; if (R > .5) c.drawImage(body, p.x - R, p.y - R, R * 2, R * 2); }
  for (let j = 0; j < pos.length; j++) { const p = pos[j], r = p.r * 1.08; if (r > .5) c.drawImage(balls[j % 10], p.x - r, p.y - r, r * 2, r * 2); }
  /* rim bubbles: each grows and pops on its own cycle */
  if (K >= .5) {
    const nb = Math.max(3, Math.round(w / 40));
    for (let j = 0; j < nb; j++) {
      const ph = (t * (.32 + .25 * rnd(seed + 70, j)) + rnd(seed + 71, j)) % 1, grow2 = sstep(0, .75, ph), pop = ph > .9 ? 0 : 1, u = (rnd(seed + 72, j) * 2 - 1) * .86, top = h * Math.pow(Math.max(0, 1 - u * u), .5), by = y - top * (.45 + .5 * rnd(seed + 73, j)), bx = x + u * w * .5, br = (3 + w * .018 * rnd(seed + 74, j)) * grow2 * pop * sg2(K);
      if (br < .6) continue;
      c.fillStyle = rgba(T.hi, .55); c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); c.lineWidth = Math.max(1, br * .2); c.strokeStyle = rgba(T.lo, .85); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(bx - br * .32, by - br * .32, br * .28, 0, TAU); c.fill();
    }
  }
  c.restore();
}
const sg2 = K => seg(K, .5, 1);

Object.assign(FX18, { foamJet, foamPile });

// ------------------------------------------------------------------ batch 3: fire (flame, embers)
/* kind table. n tongues across the base; hLo..hHi their relative heights (a bell: the middle is tallest); wMul base width of a tongue relative to w / n; sway tip wander (fraction of the tongue's height) at swayHz;
 * slow / fast: height flicker amplitudes (slow wander about 1 Hz, a quick shimmer at 9 to 14 Hz); glow: the ambient light it throws; bed: a glowing ember bed under the tongues; dip: how far the base rounds below y. */
const FLAME_KINDS = {
  log: { n: 6, hLo: .42, hHi: 1.0, wMul: 1.8, sway: .11, swayHz: .55, slow: .15, fast: .05, glow: 1.0, bed: 1, dip: 0, shape: 0, asp: .16 },
  torch: { n: 3, hLo: .62, hHi: 1.0, wMul: 1.9, sway: .2, swayHz: 1.0, slow: .16, fast: .07, glow: .9, bed: 0, dip: .5, shape: 0, asp: .15 },
  candle: { n: 1, hLo: 1, hHi: 1, wMul: .8, sway: .04, swayHz: .6, slow: .05, fast: .02, glow: .55, bed: 0, dip: .25, shape: 1, asp: 0 },
  blaze: { n: 9, hLo: .38, hHi: 1.06, wMul: 1.9, sway: .27, swayHz: 1.2, slow: .22, fast: .08, glow: 1.2, bed: 1, dip: 0, shape: 0, asp: .13 },
};
/* layers, outer to inner: width and height scale of the tongue, blend, alpha, colour stops from the hot base to the cool tip (rgba), so the shorter tongues read hotter */
const FLAME_LAYERS = [
  { sw: 1.0, sh: 1.0, mode: 'source-over', a: .94, st: [[0, 'rgba(255,118,30,1)'], [.35, 'rgba(228,62,12,.97)'], [.78, 'rgba(168,24,8,.72)'], [1, 'rgba(110,12,4,0)']] },
  { sw: .8, sh: .84, mode: 'lighter', a: .8, st: [[0, 'rgba(255,180,50,1)'], [.4, 'rgba(255,132,26,.95)'], [.85, 'rgba(228,62,12,.55)'], [1, 'rgba(228,62,12,0)']] },
  { sw: .56, sh: .68, mode: 'lighter', a: .68, st: [[0, 'rgba(255,226,130,1)'], [.45, 'rgba(255,196,64,.95)'], [.9, 'rgba(255,146,32,.5)'], [1, 'rgba(255,146,32,0)']] },
  { sw: .3, sh: .46, mode: 'lighter', a: .62, st: [[0, 'rgba(255,248,214,1)'], [.5, 'rgba(255,238,170,.95)'], [1, 'rgba(255,216,120,0)']] },
];
/* the candle's layers (a stable yellow drop; the blue base is drawn separately) */
const CANDLE_LAYERS = [
  { sw: 1.5, sh: 1.12, mode: 'lighter', a: .16, st: [[0, 'rgba(255,170,60,1)'], [1, 'rgba(255,120,30,0)']] },
  { sw: 1.0, sh: 1.0, mode: 'source-over', a: .9, st: [[0, 'rgba(255,170,50,1)'], [.5, 'rgba(255,140,30,.95)'], [1, 'rgba(230,80,16,0)']] },
  { sw: .72, sh: .8, mode: 'lighter', a: .85, st: [[0, 'rgba(255,228,120,1)'], [.6, 'rgba(255,200,70,.95)'], [1, 'rgba(255,160,40,0)']] },
  { sw: .4, sh: .52, mode: 'lighter', a: .85, st: [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,244,200,0)']] },
];
/* one tongue: a lick of flame (shape 0: base on y, curved sides, a pointed tip leaning to tx) or a drop (shape 1, the candle) */
function tonguePath(c, bx, y, bw, th, tx, mx, sw, sh, dip, shape) {
  const w = bw * sw, T = th * sh, X = tx * sh, M = mx * sh;
  c.beginPath();
  if (shape === 1) {
    c.moveTo(bx, y + dip);
    c.bezierCurveTo(bx - w * 1.3, y - T * .02, bx - w * 1.2 + M * .3, y - T * .55, bx + X * .9, y - T);
    c.bezierCurveTo(bx + w * 1.2 + M * .3, y - T * .55, bx + w * 1.3, y - T * .02, bx, y + dip);
  } else {
    c.moveTo(bx - w, y);
    c.bezierCurveTo(bx - w * 1.14, y - T * .32, bx + M - w * .82, y - T * .68, bx + X, y - T);
    c.bezierCurveTo(bx + M + w * .82, y - T * .66, bx + w * 1.14, y - T * .30, bx + w, y);
    if (dip > 0) c.quadraticCurveTo(bx, y + w * dip * 1.4, bx - w, y);
  }
  c.closePath();
}
/* WORLD. A fire whose base is centred on (x, y), w wide at the base, h tall at power 1. kind: 'log' | 'torch' | 'candle' | 'blaze'; lean -1..1; power 0..1.5 (0 = out).
 * Tongues (each a deep red edge, an orange body, a yellow middle and a white-yellow core, with a second lick that splits off and rejoins), a slow uneven flicker with a fast shimmer, an ambient glow and,
 * for log and blaze, a glowing ember bed and a warm pool on the surface. Pure function of (options, t). */
function flame(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w == null ? 120 : o.w, h = o.h == null ? 160 : o.h, t = o.t || 0, seed = o.seed || 0, pw = o.power == null ? 1 : Math.max(0, o.power), lean = Math.max(-1, Math.min(1, o.lean || 0));
  const K = FLAME_KINDS[o.kind] || FLAME_KINDS.torch;
  if (!(pw > .01) || !(w > 1) || !(h > 1)) return;
  const pa = Math.min(1, pw * 1.15), fl = .84 + .16 * noise(seed + 90, t * 10.5) + .04 * Math.sin(t * 23 + seed), candle = K.shape === 1, gk = o.glow == null ? 1 : Math.max(0, o.glow);   /* glow 0..2 scales the ambient light and the pool on the surface (0 keeps the fire inside its own frame, e.g. a TV) */
  const tg = [];
  for (let i = 0; i < K.n; i++) {
    const r = k => rnd(seed, i * 13 + k), u = K.n === 1 ? 0 : (i + .5) / K.n - .5 + (r(2) - .5) * .5 / K.n;
    const bell = K.n === 1 ? 1 : Math.pow(Math.max(0, Math.cos(u * PI * .92)), 1.3), hf = lerp(K.hLo, K.hHi, bell * (.72 + .28 * r(8)));
    const f1 = .8 + .7 * r(3), f2 = 9 + 5 * r(4), f3 = K.swayHz * (.7 + .6 * r(9));
    const th = h * pw * hf * (1 + K.slow * (2 * noise(seed + i, t * f1 + i * 3.7) - 1) + K.fast * (2 * noise(seed + 40 + i, t * f2) - 1));
    const bw = Math.min(w * .5, Math.max((w / K.n) * .5 * K.wMul * (.8 + .4 * r(5)), th * K.asp)) * (pw < .5 ? .65 + .7 * pw : 1);
    const tx = (lean * .6 + K.sway * (2 * noise(seed + 20 + i, t * f3) - 1)) * th, mx = tx * .35 + K.sway * .4 * (2 * noise(seed + 60 + i, t * f3 * 1.7 + 5) - 1) * th;
    /* the second lick: shares the base, swings out and back (a fork that splits and rejoins) */
    const sp = .5 + .5 * Math.sin(TAU * (.4 + .5 * r(6)) * t + r(7) * TAU), sgn = r(10) < .5 ? -1 : 1;
    const th2 = th * (.6 + .12 * sp); tg.push({ bx: x + u * w, bw, th, tx, mx, tx2: tx + sgn * Math.min(bw * (.3 + 1.7 * sp), th2 * .26), th2, mx2: mx * .6 + sgn * bw * .25 * sp, bw2: bw * .86, hf });
  }
  const gh = h * pw * 1.12;
  c.save(); clean(c); c.globalCompositeOperation = 'lighter';
  /* ambient glow and the warm pool on the surface */
  const R = Math.max(gh * .85, w * .95) * 1.15;
  if (gk > 0) c.globalAlpha = clamp01(.36 * K.glow * pa * fl * gk), c.drawImage(glowSprite('#ff8a30'), x - R, y - gh * .38 - R, R * 2, R * 2);
  const pr = w * (candle ? 1.0 : 1.45);
  if (gk > 0) { c.globalAlpha = clamp01(.3 * K.glow * pa * fl * gk); c.save(); c.translate(x, y + w * .03); c.scale(1, candle ? .3 : .22); c.drawImage(glowSprite('#ff7a22'), -pr, -pr, pr * 2, pr * 2); c.restore(); }
  if (K.bed) { const bw2 = w * .66; c.globalAlpha = clamp01(.8 * pa * (.78 + .22 * noise(seed + 77, t * 3.1))); c.save(); c.translate(x, y - w * .015); c.scale(1, .2); c.drawImage(glowSprite('#ff5a14'), -bw2, -bw2, bw2 * 2, bw2 * 2); c.restore(); }
  if (candle) { const bw2 = w * .9; c.globalAlpha = clamp01(.55 * pa); c.drawImage(glowSprite('#4d7bff'), x - bw2, y - h * pw * .13 - bw2, bw2 * 2, bw2 * 2); }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  /* the layers */
  const LAY = candle ? CANDLE_LAYERS : FLAME_LAYERS;
  for (let li = 0; li < LAY.length; li++) {
    const L = LAY[li], g = c.createLinearGradient(0, y, 0, y - gh);
    for (const [s, col] of L.st) g.addColorStop(s, col);
    c.fillStyle = g; c.globalCompositeOperation = L.mode; c.globalAlpha = clamp01(L.a * pa * (li === 0 ? 1 : fl));
    for (const q of tg) {
      tonguePath(c, q.bx, y, q.bw, q.th, q.tx, q.mx, L.sw, L.sh, K.dip * q.bw, K.shape); c.fill();
      if (K.n > 1) { tonguePath(c, q.bx, y, q.bw2, q.th2, q.tx2, q.mx2, L.sw, L.sh, K.dip * q.bw2, K.shape); c.fill(); }
    }
  }
  c.restore();
  if (gk > 0) bloom(c, x, y - gh * .35, Math.max(gh, w) * .8, '#ff8a30', .5 * pa * K.glow * Math.min(1, gk));
}
/* WORLD. Sparks that drift up from a fire: `count` (default 14) embers, each on its own cycle (period 1.6 to 3.4 s), rising `rise` px (default 260) with a sideways wander, cooling from yellow to red. */
function embers(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w == null ? 100 : o.w, t = o.t || 0, seed = o.seed || 0, n = Math.min(80, o.count == null ? 14 : o.count), rise = o.rise == null ? 260 : o.rise;
  if (!(n > 0)) return;
  c.save(); clean(c); c.globalCompositeOperation = 'lighter';
  const sp = glowSprite('#ff7a22'), spH = glowSprite('#ffd060');
  for (let i = 0; i < n; i++) {
    const T = 1.6 + 1.8 * rnd(seed, i * 5 + 1), ph = t / T + rnd(seed, i * 5 + 2), cyc = Math.floor(ph), u = ph - cyc;
    const cx0 = x + (rnd(seed + 9, i * 31 + cyc) - .5) * w, wander = (14 + 30 * rnd(seed + 3, i * 31 + cyc)) * Math.sin(TAU * (.5 + rnd(seed + 4, i)) * (t + i * .37) + rnd(seed + 5, i) * 6);
    const e = 1 - Math.pow(1 - u, 1.7), px = cx0 + wander * e + (rnd(seed + 6, i * 31 + cyc) - .5) * 60 * e, py = y - rise * (.55 + .6 * rnd(seed + 7, i * 31 + cyc)) * e;
    const a = sstep(0, .07, u) * Math.pow(1 - u, 1.1) * (.65 + .35 * noise(seed + 8 + i, t * 15)), r = (1.6 + 2.4 * rnd(seed + 2, i * 31 + cyc)) * (1 - .45 * u);
    if (a < .02) continue;
    const R = r * 4.2; c.globalAlpha = clamp01(a * .85); c.drawImage(sp, px - R, py - R, R * 2, R * 2);
    c.globalAlpha = clamp01(a * (1 - u * .6)); const R2 = r * 1.7; c.drawImage(spH, px - R2, py - R2, R2 * 2, R2 * 2);
  }
  c.restore();
}

Object.assign(FX18, { flame, embers });

// ------------------------------------------------------------------ batch 4: puff, sparks, smoke
/* a baked smoke puff: a soft blob whose edge is warped by noise (never a round disc), mottled inside, lit from the upper left. tone 0..3 mixes the colour toward a pale grey (smoke thins and pales as it rises). */
function smokeSprite(col, v, tone) {
  const base = mix(col, '#d4d4da', tone / 4);
  return sprite('smk:' + base + ':' + v, 112, 112, (g, w) => {
    const id = g.createImageData(w, w), d = id.data, c0 = w / 2, B = rgb(base);
    for (let py = 0; py < w; py++) for (let px = 0; px < w; px++) {
      const nx = (px + .5 - c0) / c0, ny = (py + .5 - c0) / c0, r = Math.hypot(nx, ny);
      if (r >= 1) continue;
      const n1 = noise2(70 + v, (nx + 1) * 1.9, (ny + 1) * 1.9), n2 = noise2(80 + v, (nx + 1) * 4.6, (ny + 1) * 4.6), n3 = noise2(90 + v, (nx + 1) * 9, (ny + 1) * 9);
      const rr = r * (1 + .6 * (n1 - .5) + .22 * (n2 - .5) + .05 * (n3 - .5));
      let a = clamp01(1 - rr); a = a * a * (3 - 2 * a);
      a *= (.62 + .72 * n2 - .1) * (1 - sstep(.5, .94, r));   /* the window keeps the baked edge at exactly zero alpha: no visible disc outline */
      const l = clamp01(.58 - .32 * nx - .42 * ny + .5 * (n1 - .5) + .18 * (n3 - .5)), k = lerp(1, .74 + .42 * l, clamp01(a * 2.4)), i = (py * w + px) * 4;   /* thin edges take the mid tone: no dark rims */
      d[i] = Math.min(255, B[0] * k); d[i + 1] = Math.min(255, B[1] * k); d[i + 2] = Math.min(255, B[2] * k); d[i + 3] = Math.round(clamp01(a) * 255);
    }
    g.putImageData(id, 0, 0);
  });
}
/* WORLD. One expanding poof (a door-slam dust puff, a landing): n lobes (default 7) fly out from (x, y) to radius r and thin out over `life` s (default .8), with a little lift. flat 0..1 squashes it
 * onto a floor (default .2). color default a dust beige. */
function puff(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, r = o.r == null ? 80 : o.r, t = o.t || 0, t0 = o.t0 == null ? 0 : o.t0, life = o.life == null ? .8 : o.life, n = Math.min(24, o.n == null ? 7 : o.n), col = o.color || '#ddd5c4', flat = o.flat == null ? .2 : o.flat, seed = o.seed || 0;
  const u = (t - t0) / life;
  if (u <= 0 || u >= 1 || !(r > 1)) return;
  const e = 1 - Math.pow(1 - u, 2.4), tone = Math.min(3, Math.floor(u * 4));
  c.save(); clean(c);
  for (let i = 0; i < n + 2; i++) {
    const core = i >= n, a0 = core ? rnd(seed + 3, i) * TAU : (i + rnd(seed + 1, i) * .6) / n * TAU, d = core ? .12 : (.75 + .3 * rnd(seed + 2, i));
    const px = x + Math.cos(a0) * r * d * e * (core ? .5 : 1), py = y + Math.sin(a0) * r * d * e * (1 - flat) * (core ? .5 : 1) - r * .18 * e * (core ? 1.4 : 1), lr = r * (core ? .55 : .32 + .18 * rnd(seed + 4, i)) * (.45 + .75 * e);
    const al = Math.pow(1 - u, 1.25) * sstep(0, .06, u) * .9;
    c.globalAlpha = al; const R = lr * 1.15;
    c.drawImage(smokeSprite(col, (i + (seed | 0)) % 6, tone), px - R, py - R, R * 2, R * 2);
  }
  c.restore();
}
/* WORLD. A burst of bright sparks with tails (a door magnet releasing, a short circuit): `count` (default 18) fly out from (x, y) at up to `speed` px/s (default 520), fall with `gravity` (default 900) and
 * die inside `life` s (default .55). A tiny flash at the source for the first frames. */
function sparks(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, t = o.t || 0, t0 = o.t0 == null ? 0 : o.t0, n = Math.min(120, o.count == null ? 18 : o.count), speed = o.speed == null ? 520 : o.speed, life = o.life == null ? .55 : o.life, grav = o.gravity == null ? 900 : o.gravity, seed = o.seed || 0, col = o.color || '#ffb830';
  const age = t - t0;
  if (age < 0 || age > life * 1.25) return;
  c.save(); clean(c); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  if (age < .14) { const R = 46 * (1 - age / .14) + 10; c.globalAlpha = .7 * (1 - age / .14); c.drawImage(glowSprite('#ffd070'), x - R, y - R, R * 2, R * 2); }
  const hot = mix(col, '#ffffff', .8);
  for (let i = 0; i < n; i++) {
    const a = rnd(seed, i * 5 + 1) * TAU, v = speed * (.3 + .85 * Math.pow(rnd(seed, i * 5 + 2), .7)), L = life * (.55 + .6 * rnd(seed, i * 5 + 3)), u = age / L;
    if (u >= 1) continue;
    const pos = tt => { const E = 1 - Math.exp(-3 * tt); return [x + Math.cos(a) * v * E / 3, y + Math.sin(a) * v * E / 3 + .5 * grav * tt * tt]; };
    const p1 = pos(age), p0 = pos(Math.max(0, age - .07 - .03 * rnd(seed, i * 5 + 4))), al = Math.pow(1 - u, .9), lw = 1.4 + 2.4 * rnd(seed, i * 5 + 5) * (1 - u);
    c.strokeStyle = rgba(col, .5 * al); c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    const p05 = [lerp(p0[0], p1[0], .5), lerp(p0[1], p1[1], .5)];
    c.strokeStyle = rgba(hot, al); c.lineWidth = lw; c.beginPath(); c.moveTo(p05[0], p05[1]); c.lineTo(p1[0], p1[1]); c.stroke();
  }
  c.restore();
}
/* WORLD. A smoke plume from (x, y): puffs are born at `rate` per second (default 9) from t0 (and stop at `t1` if given), rise `h` px over `life` s (default 3.4), widen from w to about 2.5 w, thin out, pale and
 * lean by `drift` px at the top. density 0..1 (default .6) is the opacity; color is the dense base colour (default a warm dark grey). Soft, mottled and layered: it reads as haze over a face, never a flat disc. */
function smoke(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, w = o.w == null ? 80 : o.w, h = o.h == null ? 400 : o.h, t = o.t || 0, t0 = o.t0 == null ? 0 : o.t0, t1 = o.t1 == null ? Infinity : o.t1, seed = o.seed || 0, dens = o.density == null ? .6 : o.density;
  const rate = o.rate == null ? 9 : o.rate, life = o.life == null ? 3.4 : o.life, drift = o.drift || 0, col = o.color || '#5e5c62', rise = o.rise == null ? 1 : o.rise;
  if (t < t0 || !(dens > .01)) return;
  const tE = Math.min(t, t1), iLo = Math.max(0, Math.ceil((t - life - t0) * rate) - 1), iHi = Math.min(iLo + 200, Math.floor((tE - t0) * rate));
  c.save(); clean(c);
  for (let i = iLo; i <= iHi; i++) {
    const tb = t0 + (i + rnd(seed + 1, i)) / rate, age = t - tb;
    if (tb > tE || age < 0 || age >= life) continue;
    const u = age / life, e = 1 - Math.pow(1 - u, 1.7 * rise ** -.5), lat = (rnd(seed + 2, i) - .5) * w * .45 + Math.sin(TAU * (.18 + .12 * rnd(seed + 3, i)) * age + rnd(seed + 4, i) * 6.3) * w * .35 * u + drift * u * u;
    const px = x + lat, py = y - h * e, r = w * (.3 + .55 * rnd(seed + 5, i)) * (.8 + 1.7 * Math.pow(u, .75));
    const al = dens * .62 * sstep(0, .09, u) * Math.pow(1 - u, 1.25), tone = Math.min(3, Math.floor(u * 4.2));
    if (al < .01) continue;
    c.globalAlpha = al; const R = r * 1.1;
    c.drawImage(smokeSprite(col, (i + (seed | 0)) % 6, tone), px - R, py - R, R * 2, R * 2);
  }
  c.restore();
}

Object.assign(FX18, { puff, sparks, smoke });

// ------------------------------------------------------------------ batch 5: water (a sprinkler fan) and smokeLayer (haze under a ceiling)
/* WORLD. A sprinkler fan: drops leave (x, y) along ang (default straight down, pi/2) inside the full angle `spread` (default 1.7 rad), reach about `len` px (default 520), fall with gravity and die after
 * about a second. `drops` per second (default 90), t0 / t1 start and stop the flow (spray finishes its flight after t1). A faint wet sheet near the head, streak-shaped drops, a few fat ones. */
function water(c, o = {}) {
  const x = o.x || 0, y = o.y || 0, ang = o.ang == null ? PI / 2 : o.ang, spread = o.spread == null ? 1.7 : o.spread, len = o.len == null ? 520 : o.len, t = o.t || 0, t0 = o.t0 == null ? 0 : o.t0, t1 = o.t1 == null ? Infinity : o.t1, seed = o.seed || 0, rate = o.drops == null ? 90 : o.drops;
  if (t < t0 || !(rate > 0)) return;
  const LIFE = 1.0, G = 1500, tE = Math.min(t, t1), iLo = Math.max(0, Math.ceil((t - LIFE * 1.3 - t0) * rate) - 1), iHi = Math.min(iLo + 600, Math.floor((tE - t0) * rate));
  c.save(); clean(c); c.lineCap = 'round';
  /* the wet sheet: a pale additive cone that thins over the first half second of the throw */
  const on = seg(t, t0, t0 + .15) * (1 - seg(t, t1, t1 + .25));
  if (on > .01) { c.globalCompositeOperation = 'lighter'; cone(c, { x, y, ang, spread: spread * .95, len: len * .55, color: '#bcd8ff', alpha: .1 * on, soft: .8 }); c.globalCompositeOperation = 'source-over'; }
  for (let i = iLo; i <= iHi; i++) {
    const te = t0 + (i + rnd(seed + 1, i)) / rate, age = t - te, life = LIFE * (.8 + .4 * rnd(seed + 2, i));
    if (te > tE || age < 0 || age > life) continue;
    const a = ang + spread * (rnd(seed + 3, i) - .5), v = len * (.9 + .9 * rnd(seed + 4, i)), E = 1 - Math.exp(-1.6 * age);
    const pos = tt => { const e = 1 - Math.exp(-1.6 * tt); return [x + Math.cos(a) * v * e / 1.6, y + Math.sin(a) * v * e / 1.6 + .5 * G * tt * tt]; };
    const p1 = pos(age), p0 = pos(Math.max(0, age - .045)), k = age / life, al = (1 - sstep(.7, 1, k)) * sstep(0, .06, k), fat = rnd(seed + 5, i) < .12;
    c.strokeStyle = rgba('#d6e8ff', .78 * al); c.lineWidth = fat ? 3.6 : 2; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    if (fat) { c.fillStyle = rgba('#ffffff', .9 * al); c.beginPath(); c.arc(p1[0], p1[1], 2.4, 0, TAU); c.fill(); }
  }
  c.restore();
}
/* WORLD. A hanging smoke layer under a ceiling at yTop, `depth` px thick, from x0 to x1: dense at the top, with a ragged underside that moves slowly (soft puffs along a wandering edge). color default a warm grey, alpha default .5. */
function smokeLayer(c, o = {}) {
  const x0 = o.x0 == null ? 0 : o.x0, x1 = o.x1 == null ? 1080 : o.x1, yTop = o.yTop || 0, depth = o.depth == null ? 200 : o.depth, t = o.t || 0, seed = o.seed || 0, col = o.color || '#6a6870', al = o.alpha == null ? .5 : o.alpha;
  if (!(al > .01) || !(x1 > x0) || !(depth > 2)) return;
  c.save(); clean(c);
  c.beginPath(); c.rect(x0, yTop, x1 - x0, depth * 2); c.clip();             /* nothing above the ceiling line */
  /* the wandering underside (a slow wander of two noise octaves): .45 to 1 of the depth */
  const under = x => yTop + depth * (.45 + .55 * (noise(seed, x / 230 + t * .07) * .62 + noise(seed + 9, x / 95 - t * .11) * .38));
  /* the body: a shallow band at the ceiling that fades to nothing at half the depth (the puffs make the lower edge) */
  const g = c.createLinearGradient(0, yTop, 0, yTop + depth * .6);
  g.addColorStop(0, rgba(col, al)); g.addColorStop(.5, rgba(col, al * .7)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x0, yTop, x1 - x0, depth * .6);
  /* two rows of soft puffs: one at mid depth, one along the underside */
  const step = Math.max(36, depth * .3), n = Math.ceil((x1 - x0) / step) + 1;
  for (let row = 0; row < 2; row++) for (let i = 0; i <= n; i++) {
    const k = i + row * 57, bx = x0 + i * step + (rnd(seed + 1, k) - .5) * step * .9 + Math.sin(t * .22 + k * 1.3) * 14, r = depth * (.3 + .22 * rnd(seed + 2, k)) * (row ? 1 : 1.15);
    const by = row ? under(bx) - r * .35 + Math.sin(t * .31 + k * 2.1) * depth * .04 : yTop + depth * (.18 + .2 * rnd(seed + 4, k));
    c.globalAlpha = al * (row ? .6 : .72) * (.7 + .3 * rnd(seed + 3, k)); const R = r * 1.1;
    c.drawImage(smokeSprite(col, k % 6, 1 + (k % 2)), bx - R, by - R, R * 2, R * 2);
  }
  c.restore();
}

Object.assign(FX18, { water, smokeLayer });
})();
