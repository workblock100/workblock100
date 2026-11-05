'use strict';
/* SHIFT HAPPENS, Episode 20: The Snow Day. The weather and light kit: `window.SN20` (snow and cold) and `window.L20` (light). Owner: the WX builder. Contract: /tmp/shift_tools/briefs/WX20_API.md; usage, costs and
 * traps: GUIDE_WX20.md in this folder. Built on FX18 (ep18_fx.js loads first): FX18.rnd, FX18.noise, FX18.sprite, FX18.cone, FX18.glow.
 *
 * Every function is `SN20.name(c, o)` / `L20.name(c, o)` with `c` the 2D context to draw into (scenes pass `ctx`) and `o` an options object. WORLD functions draw in the transform you already have; SCREEN
 * functions (L20.emergency) reset it. All of them are PURE functions of their arguments and `t` (scene-local seconds): no Math.random, no Date, no state, so every worker renders the same frame, in any order.
 * Randomness only from FX18.rnd. Each call saves and restores the context state. Soft shapes come from cached sprites.
 *
 * AS BUILT (additions to the contract are marked [added]); every function below has landed
 *   clock         SN20.SCENE_CLOCK, depthAt(clockMinutes), wind(t, gusts), windInt(t, gusts) [px], GUST(t, gusts) [added]
 *   snow          SN20.snow {x0, y0, x1, y1, t, seed, layers, density, fall, wind, gusts, sway, size, alpha, tone, fore, slice, clip [added]}
 *   on things     SN20.sill {x0, x1, y, depth, seed, tone, t [added]}, bank {x, y, w, h, seed, shade, flip, tone, t [added]}, cap {x0, x1, y, depth, seed, round, tone, t [added]}
 *   frost, cold   SN20.frost {x, y, w, h, amount, seed, t, tone, fade [added]}, beam {x, y, ang, spread, len, color, alpha, t, seed, flakes, soft, wind [added], gusts [added], density [added]},
 *                 breath {x, y, t, seed, period, dir, size, alpha, phase}
 *   thrown        SN20.spray {x, y, ang, t, t0, t1, seed, power, width, gravity}, flurry {x, y, r, t, t0, life, seed, n}
 *   the title     SN20.maskPoints(drawFn, w, h, step, seed), settle {pts, from, t, t0, t1, seed, size, alpha, tone [added], max [added]}
 *   light         L20.pass {ambient, tint, lights, bloom, grade, vignette, lift, t [added], glow [added]}; light kinds point / cone / rect (facing, spill [added]) / strip; skipped in the text gate's mask pass
 *                 L20.emergency {level, t, pulse}, L20.lamps(list, {t}) with list items {x, y, r, color, alpha [added], core [added], flicker}
 * Tests: wx20_demo.html and wx20_test.js (determinism, cost, contact sheets, the real renderer with a real Strawberry, the real title and end scenes). Guide: GUIDE_WX20.md.
 */
(() => {
const FX = window.FX18;
if (!FX || typeof FX.rnd !== 'function') { console.warn('ep20_fx: FX18 is missing, SN20 and L20 are not defined'); return; }
const SN20 = window.SN20 = window.SN20 || {}, L20 = window.L20 = window.L20 || {};
const TAU = Math.PI * 2, PI = Math.PI;
const { rnd, noise, sprite, rgb, rgba, mix } = FX;
const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => b === a ? (t >= a ? 1 : 0) : clamp01((t - a) / (b - a));
const sstep = (a, b, x) => { const k = seg(x, a, b); return k * k * (3 - 2 * k); };
/* every function starts from a clean state (the caller's transform stays) */
function clean(c) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.shadowBlur = 0; c.shadowColor = 'rgba(0,0,0,0)'; c.imageSmoothingEnabled = true; }
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.__txOK = true; return c; };

// ------------------------------------------------------------------ the clock of the snow
SN20.SCENE_CLOCK = { forecast: 840, lot: 990, blackout: 1092, dayroom: 1240, night: 1379 };
/* depth 0..1 as a monotone cubic (Fritsch-Carlson) through the contract's points: 0 at 2:00 PM (840), .25 at 4:30 PM, .45 at 8:12 PM, .6 at 1360, .9 at 7:00 AM (1860); 0 before, creeping to 1 after */
const DEPTH_PTS = [[840, 0], [990, .25], [1212, .45], [1360, .6], [1860, .9]];
const DEPTH_M = (() => {
  const P = DEPTH_PTS, n = P.length, h = [], d = [], m = [];
  for (let i = 0; i < n - 1; i++) { h[i] = P[i + 1][0] - P[i][0]; d[i] = (P[i + 1][1] - P[i][1]) / h[i]; }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return m;
})();
SN20.depthAt = function depthAt(clockMinutes) {
  const x = +clockMinutes, P = DEPTH_PTS, n = P.length;
  if (!(x > P[0][0])) return 0;
  if (x >= P[n - 1][0]) return .9 + .1 * (1 - Math.exp(-(x - P[n - 1][0]) / 900));
  let i = 0; while (i < n - 2 && x > P[i + 1][0]) i++;
  const hh = P[i + 1][0] - P[i][0], u = (x - P[i][0]) / hh, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * P[i][1] + (u3 - 2 * u2 + u) * hh * DEPTH_M[i] + (-2 * u3 + 3 * u2) * P[i + 1][1] + (u3 - u2) * hh * DEPTH_M[i + 1];
};

// ------------------------------------------------------------------ wind and gusts
const WIND_PX = 150;                                              /* px per second at wind 1 */
const WA = { a: .34, T: 7.31, p: .6 }, WB = { a: .21, T: 3.17, p: 2.4 };      /* two incommensurate sines: the slow deterministic base wind */
const baseWind = t => WA.a * Math.sin(TAU * t / WA.T + WA.p) + WB.a * Math.sin(TAU * t / WB.T + WB.p);
const baseInt = t => { const f = W => -W.a * W.T / TAU * (Math.cos(TAU * t / W.T + W.p) - Math.cos(W.p)); return f(WA) + f(WB); };
/* gusts = [[t0, dur, amp], ...]: a raised-cosine bump of height amp (may be negative) from t0 for dur seconds */
function gustOf(t, gusts) {
  let s = 0;
  if (gusts) for (let i = 0; i < gusts.length; i++) { const g = gusts[i], d = g[1], u = (t - g[0]) / d; if (!(d > 0) || u <= 0 || u >= 1) continue; s += g[2] * .5 * (1 - Math.cos(TAU * u)); }
  return s;
}
function gustInt(t, gusts) {
  let s = 0;
  if (gusts) for (let i = 0; i < gusts.length; i++) { const g = gusts[i], d = g[1], u = (t - g[0]) / d; if (!(d > 0) || u <= 0) continue; s += g[2] * d * (u >= 1 ? .5 : u / 2 - Math.sin(TAU * u) / (4 * PI)); }
  return s;
}
SN20.GUST = (t, gusts) => gustOf(+t || 0, gusts);
SN20.wind = function wind(t, gusts) { const w = baseWind(+t || 0) + gustOf(+t || 0, gusts); return w < -1 ? -1 : w > 1 ? 1 : w; };
SN20.windInt = function windInt(t, gusts) { t = +t || 0; return WIND_PX * (baseInt(t) + gustInt(t, gusts)); };

// ------------------------------------------------------------------ snow
/* Flake sprites: one per (tone, shape, softness, size bucket), baked at the exact size they are drawn at (no minification shimmer). 'light' tone: a white body on a cool-blue shadow and rim so it reads on pale
 * walls; 'dark' tone: plain white with a soft halo. Shapes: a disc, or a six-armed crystal for the larger flakes. */
const FB_LO = 1.6, FB_RATIO = 1.18, FB_N = 18;
const bucketOf = d => { const b = Math.round(Math.log(Math.max(d, FB_LO) / FB_LO) / Math.log(FB_RATIO)); return b < 0 ? 0 : b > FB_N - 1 ? FB_N - 1 : b; };
const bucketD = i => FB_LO * Math.pow(FB_RATIO, i);
const FS = [];                                                     /* sprite table, index = (((tone * 2 + shape) * 2 + soft) * FB_N + bucket) */
function flakeSprite(tone, shape, soft, bi) {
  const idx = (((tone * 2 + shape) * 2 + soft) * FB_N + bi);
  let s = FS[idx];
  if (s) return s;
  const d = bucketD(bi), S = Math.ceil(d * 2.3) + 8, light = tone === 0;
  s = sprite('sn20f:' + idx, S, S, (g, w) => {
    g.translate(w / 2, w / 2);
    const R = d / 2;
    const disc = (r, col, a, ox, oy, hard) => {
      const gr = g.createRadialGradient(ox, oy, 0, ox, oy, r);
      gr.addColorStop(0, rgba(col, a)); gr.addColorStop(hard, rgba(col, a * .92)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(ox, oy, r, 0, TAU); g.fill();
    };
    if (shape === 0) {
      if (light && !soft) {                                                 /* a white puff shaded blue toward its lower right, with a thin cool rim and a faint halo: reads on a pale wall */
        disc(R * 1.9 + 1, '#46608e', .26, 0, .5, .45);
        const gr = g.createRadialGradient(-.22 * R, -.28 * R, 0, 0, 0, R * 1.08 + .4);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(.55, '#f6f9ff'); gr.addColorStop(.84, '#cddaf0'); gr.addColorStop(1, '#7893c4');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 1.08 + .4, 0, TAU); g.fill();
      } else if (light) { disc(R * 1.5 + 1, '#7f9ccc', .3, 0, 0, .3); disc(R * 1.25 + .2, '#ffffff', .9, 0, 0, .2); }
      else { disc(R * 2.2 + 1, '#bcd2ff', soft ? .14 : .22, 0, 0, 0); disc(R * (soft ? 1.25 : .98) + .2, '#ffffff', soft ? .9 : 1, 0, 0, soft ? .2 : .72); }
    } else {
      const arm = (col, lw, a) => {
        g.strokeStyle = rgba(col, a); g.lineWidth = lw; g.lineCap = 'round'; g.beginPath();
        for (let k = 0; k < 3; k++) {
          const an = k * PI / 3 + .2, ca = Math.cos(an), sa = Math.sin(an);
          g.moveTo(-ca * R * 1.15, -sa * R * 1.15); g.lineTo(ca * R * 1.15, sa * R * 1.15);
          for (const sgn of [-1, 1]) for (const f of [.45, -.45]) {      /* side branches at 60 degrees, a pair on each half of every arm */
            const bx = ca * R * f * 1.15, by = sa * R * f * 1.15, an2 = an + sgn * PI / 3 * (f > 0 ? 1 : -1);
            g.moveTo(bx, by); g.lineTo(bx + Math.cos(an2) * R * .42, by + Math.sin(an2) * R * .42);
          }
        }
        g.stroke();
      };
      const lw = Math.max(.9, d * .09);
      if (light) arm('#46608e', lw + 1.6, .45); else disc(R * 1.9, '#bcd2ff', .14, 0, 0, 0);
      arm('#ffffff', lw, 1); disc(R * .32, '#ffffff', 1, 0, 0, .5);
    }
  });
  FS[idx] = s;
  return s;
}
/* the layers, back to front. d0..d1 = diameter range in px, a0..a1 = alpha range, fall in px/s, nK = flake count relative to 90 per 1080 x 1920, wk = how much of the wind it takes (parallax), sw = sway scale */
const LAY = {
  far:    { i: 0, d0: 2.8, d1: 4.8, a0: .5, a1: .76, fall: 62, nK: 2.0, wk: .5, sw: .6, soft: 0 },
  midfar: { i: 1, d0: 4.4, d1: 7.4, a0: .6, a1: .86, fall: 92, nK: 1.3, wk: .8, sw: .85, soft: 0 },
  mid:    { i: 2, d0: 7.0, d1: 12.5, a0: .72, a1: .98, fall: 125, nK: .95, wk: 1.0, sw: 1.0, soft: 0 },
  near:   { i: 3, d0: 14, d1: 21, a0: .28, a1: .5, fall: 195, nK: .4, wk: 1.35, sw: 1.3, soft: 1 },
};
const LSETS = { 1: ['mid'], 2: ['far', 'mid'], 3: ['far', 'mid', 'near'], 4: ['far', 'midfar', 'mid', 'near'] };
/* per-flake constants (11 floats each), cached by (seed, layer, count); the cache only saves time */
const FPARAMS = new Map();
function flakeParams(seed, name, li, n) {
  const key = seed + '|' + name + '|' + n;
  let p = FPARAMS.get(key);
  if (p) return p;
  p = new Float32Array(n * 11);
  const sd = seed + li * 977 + .25;
  for (let i = 0; i < n; i++) {
    const b = i * 11, k = i * 11;
    p[b] = rnd(sd, k); p[b + 1] = rnd(sd, k + 1); p[b + 2] = rnd(sd, k + 2); p[b + 3] = .8 + .4 * rnd(sd, k + 3);
    p[b + 4] = .55 + .9 * rnd(sd, k + 4); p[b + 5] = .22 + .38 * rnd(sd, k + 5); p[b + 6] = TAU * rnd(sd, k + 6);
    p[b + 7] = p[b + 5] * (2.1 + 1.3 * rnd(sd, k + 7)); p[b + 8] = TAU * rnd(sd, k + 8); p[b + 9] = rnd(sd, k + 9); p[b + 10] = rnd(sd, k + 10);
  }
  if (FPARAMS.size > 160) FPARAMS.clear();
  FPARAMS.set(key, p);
  return p;
}
/* WORLD. Falling snow in a rectangle (see GUIDE_WX20.md for every option). Flakes wrap in an invisible margin outside the rectangle, so nothing pops; clipped to the rectangle unless clip is false. */
SN20.snow = function snow(c, o = {}) {
  const x0 = o.x0 == null ? 0 : o.x0, y0 = o.y0 == null ? 0 : o.y0, x1 = o.x1 == null ? 1080 : o.x1, y1 = o.y1 == null ? 1920 : o.y1, RW = x1 - x0, RH = y1 - y0;
  if (!(RW > 4) || !(RH > 4)) return;
  const t = +o.t || 0, seed = +o.seed || 0, density = o.density == null ? 1 : o.density, fallK = o.fall == null ? 1 : o.fall, swayK = o.sway == null ? 1 : o.sway, sizeK = o.size == null ? 1 : o.size, alphaK = o.alpha == null ? 1 : o.alpha;
  if (!(density > 0) || !(alphaK > .003)) return;
  const tone = o.tone === 'dark' ? 1 : 0, slice = o.slice || 'all';
  let names = LSETS[Math.max(1, Math.min(4, Math.round(o.layers == null ? 3 : o.layers)))];
  if (o.fore === false || slice === 'back') names = names.filter(n => n !== 'near');
  else if (slice === 'front') names = names.filter(n => n === 'near');
  if (!names.length) return;
  const wi = SN20.windInt(t, o.gusts) + (o.wind || 0) * t, area = RW * RH / (1080 * 1920), M = 28, WX = RW + 2 * M, HY = RH + 2 * M;
  c.save(); clean(c);
  if (o.clip !== false) { c.beginPath(); c.rect(x0, y0, RW, RH); c.clip(); }
  for (let ln = 0; ln < names.length; ln++) {
    const L = LAY[names[ln]], n = Math.max(4, Math.round(90 * L.nK * density * area)), P = flakeParams(seed, names[ln], L.i, n), soft = L.soft;
    for (let i = 0; i < n; i++) {
      const b = i * 11, d = lerp(L.d0, L.d1, Math.pow(P[b + 2], 1.4)) * sizeK, fall = L.fall * fallK * P[b + 3];
      const A1 = L.sw * swayK * (4 + d * 1.1) * P[b + 4], A2 = A1 * .45;
      const sx = A1 * Math.sin(TAU * P[b + 5] * t + P[b + 6]) + A2 * Math.sin(TAU * P[b + 7] * t + P[b + 8]), sy = .22 * A1 * Math.sin(TAU * P[b + 7] * t + P[b + 8] + 1.3);
      let xx = P[b] * WX + wi * L.wk + sx; xx -= Math.floor(xx / WX) * WX;
      let yy = P[b + 1] * HY + fall * t + sy; yy -= Math.floor(yy / HY) * HY;
      const x = x0 - M + xx, y = y0 - M + yy, bi = bucketOf(d), half = (Math.ceil(bucketD(bi) * 2.3) + 8) / 2;
      if (x < x0 - half || x > x1 + half || y < y0 - half || y > y1 + half) continue;
      const shape = (bucketD(bi) >= 5.4 && P[b + 10] < .22) ? 1 : 0;
      c.globalAlpha = lerp(L.a0, L.a1, P[b + 9]) * alphaK;
      c.drawImage(flakeSprite(tone, shape, soft, bi), Math.round(x - half), Math.round(y - half));      /* whole pixels: a blit without filtering costs half */
    }
  }
  c.restore();
};

// ------------------------------------------------------------------ L20: the lighting pass
/* The darkness and the lights' colour are built on two canvases at 1/4 size (soft by nature) and scaled up over the finished picture:
 *   lc  : every light, drawn in WORLD coordinates through the caller's camera transform (divided by DS), coloured sprites, 'lighter'. Its alpha is the reach of the lights, its premultiplied colour the glow they add.
 *   dk  : the dark tint at alpha (1 - max(ambient, lift)), the lights' reach cut out of it (destination-out of lc), then the vignette. Drawn over the picture ('source-over').
 * The lights' colour (lc) is then added to the picture ('lighter', only over the lights' bounding box), the bloom cores are added with FX18.glow (which also feeds the engine's bloom layer), and the optional grade. */
const DS = 4;
let PASS = null;
function passBuf(w, h) {
  const cw = Math.ceil(w / DS), ch = Math.ceil(h / DS);
  if (PASS && PASS.cw === cw && PASS.ch === ch) return PASS;
  const dk = mk(cw, ch), lc = mk(cw, ch), mid = mk(cw * 2, ch * 2);
  return PASS = { cw, ch, dk, dkc: dk.getContext('2d'), lc, lcc: lc.getContext('2d'), mid, midc: mid.getContext('2d') };
}
/* bakes a coloured sprite whose alpha is fn(px, py, w, h) in 0..1 */
function bake(key, w, h, col, fn) {
  return sprite(key, w, h, (g, ww, hh) => {
    const id = g.createImageData(ww, hh), d = id.data, rr = rgb(col);
    for (let py = 0; py < hh; py++) for (let px = 0; px < ww; px++) {
      const a = fn(px + .5, py + .5, ww, hh);
      if (!(a > 0)) continue;
      const i = (py * ww + px) * 4; d[i] = rr[0]; d[i + 1] = rr[1]; d[i + 2] = rr[2]; d[i + 3] = a >= 1 ? 255 : (a * 255 + .5) | 0;
    }
    g.putImageData(id, 0, 0);
  });
}
/* point: a plateau and a smooth fall to the radius */
function pointSprite(col, soft) {
  const qs = Math.round(clamp01(soft) * 10), plateau = .05 + (1 - qs / 10) * .5;
  return bake('l20pt:' + col + ':' + qs, 128, 128, col, (x, y, w) => { const u = Math.hypot(x - w / 2, y - w / 2) / (w / 2); return u >= 1 ? 0 : Math.pow(1 - sstep(plateau, 1, u), 1.5); });
}
/* cone: length CONE_L along +x from the origin; radial fall, angular edge, a bright axis */
const CONE_L = 192;
function coneSprite(col, spread, soft) {
  const q = Math.max(2, Math.min(70, Math.round(spread / .04))), qs = Math.round(clamp01(soft) * 10), hs = q * .04 / 2, sf = qs / 10, hh = Math.max(8, Math.ceil(2 * CONE_L * Math.sin(Math.min(hs, 1.45))) + 4);
  return bake('l20cn:' + col + ':' + q + ':' + qs, CONE_L, hh, col, (px, py, w, h) => {
    const dy = py - h / 2, u = Math.hypot(px, dy) / CONE_L;
    if (u >= 1) return 0;
    const v = Math.abs(Math.atan2(dy, px)) / hs;
    if (v >= 1) return 0;
    return clamp01((1 - sstep(.85 - sf * .75, 1, v)) * (.72 + .28 * (1 - v * v)) * Math.pow(1 - u, 1.1) * sstep(0, .04, u));
  });
}
/* rect: a unit square [-1, 1] inside a [-1.8, 1.8] sprite: the square is fully lit with a soft inner edge, a halo beyond it; drawn stretched to w x h */
const RECT_U = 144;
function rectSprite(col, soft) {
  const qs = Math.round(clamp01(soft) * 10), sb = .06 + qs / 10 * .3;
  return bake('l20rc:' + col + ':' + qs, RECT_U, RECT_U, col, (px, py, w) => {
    const ax = Math.abs(px / w * 3.6 - 1.8) - 1, ay = Math.abs(py / w * 3.6 - 1.8) - 1;
    if (ax <= 0 && ay <= 0) return lerp(.6, 1, sstep(0, sb, -Math.max(ax, ay)));
    return .6 * Math.pow(1 - sstep(0, .8, Math.hypot(Math.max(ax, 0), Math.max(ay, 0))), 1.6);
  });
}
/* spill: the patch a window or a screen throws in front of itself: x in [0, 1] along, y in [-1.8, 1.8] across (half width 1 at x = 0, growing to 1.7), fading with distance */
function spillSprite(col) {
  return bake('l20sp:' + col, 128, 128, col, (px, py, w) => {
    const x = px / w, v = Math.abs(py / w * 3.6 - 1.8) / (1 + .7 * x);
    return v >= 1 ? 0 : clamp01(Math.pow(1 - x, 1.25) * (1 - sstep(.5, 1, v)) * sstep(0, .06, x) * .85);
  });
}
/* strip: a horizontal capsule of length 8 * lq and width 4 * wq (world px) baked at half size; padded by the fall */
function stripSprite(col, lq, wq, soft) {
  const qs = Math.round(clamp01(soft) * 10), L = lq * 8, Wd = wq * 4, pad = Math.ceil(Wd * 1.1), w = Math.ceil((L + 2 * pad) / 2), h = pad, hw = Wd / 2;
  return bake('l20st:' + col + ':' + lq + ':' + wq + ':' + qs, w, h, col, (px, py) => {
    const X = px * 2, Y = py * 2, cx = X < pad ? pad : X > pad + L ? pad + L : X;
    return Math.pow(1 - sstep(hw * (.15 + (1 - qs / 10) * .4), hw * 1.9, Math.hypot(X - cx, Y - pad)), 1.4);
  });
}
function vigSprite(tint, cw, ch) {
  return sprite('l20vig:' + tint, cw, ch, (g, w, h) => {
    g.translate(w / 2, h / 2); g.scale(w / 2, h / 2);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2);
    for (const [s, k] of [[0, 0], [.4, 0], [.54, .07], [.68, .22], [.82, .52], [.93, .82], [1, 1]]) gr.addColorStop(s, rgba(tint, k));
    g.fillStyle = gr; g.fillRect(-1.01, -1.01, 2.02, 2.02);
  });
}
/* a slow, soft flicker multiplier: amplitude clamped to .25 and rate to 3 Hz, so no setting of it can ever become a strobe */
function flick(l, t) {
  const f = l.flicker;
  if (!f) return 1;
  const amt = Math.min(.25, Math.abs(f.amt == null ? .08 : f.amt)), rate = Math.min(3, Math.abs(f.rate == null ? 1.5 : f.rate));
  return 1 + amt * (FX.noise((+f.seed || 0) + 7, t * rate) * 2 - 1);
}
/* draws one light into the light canvas (world coordinates, 'lighter'); returns its world bounding box [x0, y0, x1, y1], or null */
function drawLight(g, l, pw) {
  const kind = l.kind || 'point', col = l.color || '#fff1d6', x = +l.x || 0, y = +l.y || 0;
  const put = (spr, dx, dy, dw, dh, a) => { g.globalAlpha = a > 1 ? 1 : a; g.drawImage(spr, dx, dy, dw, dh); if (a > 1) { g.globalAlpha = a - 1 > 1 ? 1 : a - 1; g.drawImage(spr, dx, dy, dw, dh); } };
  const cone = (cx, cy, ang, spread, len, soft, a) => {
    const spr = coneSprite(col, spread, soft), k = len / CONE_L;
    g.save(); g.translate(cx, cy); g.rotate(ang); g.scale(k, k); put(spr, 0, -spr.height / 2, spr.width, spr.height, a); g.restore();
    const hs = Math.min(1.45, Math.max(.04, spread / 2)); let x0 = cx, y0 = cy, x1 = cx, y1 = cy;
    const pts = [ang - hs, ang, ang + hs]; for (let k2 = -4; k2 <= 4; k2++) { const q = k2 * PI / 2; if (q > ang - hs && q < ang + hs) pts.push(q); }
    for (const an of pts) { const px = cx + Math.cos(an) * len, py = cy + Math.sin(an) * len; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
    return [x0, y0, x1, y1];
  };
  if (kind === 'point') {
    const r = +l.r > 1 ? +l.r : 200;
    put(pointSprite(col, l.soft == null ? .7 : l.soft), x - r, y - r, 2 * r, 2 * r, pw);
    return [x - r, y - r, x + r, y + r];
  }
  if (kind === 'cone') {
    const len = +l.len > 1 ? +l.len : 700, bb = cone(x, y, l.ang || 0, l.spread == null ? .6 : l.spread, len, l.soft == null ? .55 : l.soft, pw), pr = Math.max(26, len * .09);
    put(pointSprite(col, .8), x - pr, y - pr, 2 * pr, 2 * pr, pw * .8);                         /* the pool around the lens and the hand */
    return [Math.min(bb[0], x - pr), Math.min(bb[1], y - pr), Math.max(bb[2], x + pr), Math.max(bb[3], y + pr)];
  }
  if (kind === 'rect') {
    const w = +l.w > 1 ? +l.w : 200, h = +l.h > 1 ? +l.h : 120, kx = 1.8 * w, ky = 1.8 * h;
    put(rectSprite(col, l.soft == null ? .5 : l.soft), x - kx / 2, y - ky / 2, kx, ky, pw);
    let bb = [x - kx / 2, y - ky / 2, x + kx / 2, y + ky / 2];
    if (l.facing != null) {                                                                      /* the light patch a window or a screen throws in front of itself: a soft trapezoid from its edge */
      const f = +l.facing || 0, cf = Math.cos(f), sf = Math.sin(f), sl = +l.spill > 1 ? +l.spill : 1.4 * Math.max(w, h);
      const ah = (w * Math.abs(sf) + h * Math.abs(cf)) / 2, ext = (w * Math.abs(cf) + h * Math.abs(sf)) / 2, a0 = ext * .85;
      g.save(); g.translate(x, y); g.rotate(f); g.translate(a0, 0); put(spillSprite(col), 0, -1.8 * ah, sl, 3.6 * ah, pw * .75); g.restore();
      for (const a of [a0, a0 + sl]) for (const b of [-3.1 * ah, 3.1 * ah]) { const px = x + a * cf - b * sf, py = y + a * sf + b * cf; bb = [Math.min(bb[0], px), Math.min(bb[1], py), Math.max(bb[2], px), Math.max(bb[3], py)]; }
    }
    return bb;
  }
  if (kind === 'strip') {
    const x2 = +l.x2 || 0, y2 = +l.y2 || 0, wd = +l.width > 2 ? +l.width : 60, len = Math.hypot(x2 - x, y2 - y), lq = Math.max(1, Math.round(len / 8)), wq = Math.max(1, Math.round(wd / 4));
    const spr = stripSprite(col, lq, wq, l.soft == null ? .6 : l.soft), pad = Math.ceil(wq * 4 * 1.1), k = len / (lq * 8);
    g.save(); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x)); g.scale(k, 1);
    put(spr, -pad, -pad, spr.width * 2, spr.height * 2, pw);                                     /* baked at half size: drawn at twice its pixels */
    g.restore();
    const e = pad + 2;
    return [Math.min(x, x2) - e, Math.min(y, y2) - e, Math.max(x, x2) + e, Math.max(y, y2) + e];
  }
  return null;
}
/* SCREEN-sized operation in WORLD coordinates (see GUIDE_WX20.md): darken, light, tint, bloom, grade. Returns the number of lights drawn. */
/* the text gate's mask pass (window.TXA.mask) re-renders the world with the text in a flat key colour to see what covers it: a lighting veil is not a cover (like the engine's bloom and grade, which are not part of that pass either), so the
 * pass and the emergency wash skip themselves there. Text drawn BEFORE the pass is darkened in the picture but not reported: light your signs, or draw hero text after the pass. */
const inMask = () => typeof TXA !== 'undefined' && !!TXA && !!TXA.mask;
L20.pass = function pass(c, o = {}) {
  const cv = c.canvas, w = cv.width, h = cv.height;
  if (!(w > 8) || !(h > 8) || inMask()) return 0;
  const lights = o.lights || [], t = +o.t || 0;
  const ambient = clamp01(o.ambient == null ? .22 : o.ambient), lift = clamp01(o.lift == null ? .08 : o.lift), D = 1 - Math.max(ambient, lift);
  const tint = o.tint || '#0b1230', vig = clamp01(o.vignette == null ? .25 : o.vignette), bloomA = clamp01(o.bloom == null ? .5 : o.bloom), glowAmt = o.glow == null ? .32 : o.glow;
  const M = c.getTransform(), P = passBuf(w, h), lcc = P.lcc, dkc = P.dkc, zoom = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)) || 1;
  lcc.setTransform(1, 0, 0, 1, 0, 0); lcc.globalCompositeOperation = 'source-over'; lcc.globalAlpha = 1; lcc.clearRect(0, 0, P.cw, P.ch);
  lcc.setTransform(M.a / DS, M.b / DS, M.c / DS, M.d / DS, M.e / DS, M.f / DS); lcc.globalCompositeOperation = 'lighter'; lcc.imageSmoothingEnabled = true;
  let n = 0, sx0 = 1e9, sy0 = 1e9, sx1 = -1e9, sy1 = -1e9;
  const live = [];
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    if (!l) continue;
    const pw = (l.power == null ? 1 : l.power) * flick(l, t);
    if (!(pw > .004)) continue;
    const bb = drawLight(lcc, l, Math.min(1.5, pw));
    if (!bb) continue;
    n++; live.push([l, pw]);
    for (let k = 0; k < 4; k++) {
      const bx = k & 1 ? bb[2] : bb[0], by = k & 2 ? bb[3] : bb[1], X = M.a * bx + M.c * by + M.e, Y = M.b * bx + M.d * by + M.f;
      if (X < sx0) sx0 = X; if (X > sx1) sx1 = X; if (Y < sy0) sy0 = Y; if (Y > sy1) sy1 = Y;
    }
  }
  lcc.setTransform(1, 0, 0, 1, 0, 0); lcc.globalAlpha = 1; lcc.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); clean(c);
  /* the lit box: the lights' bounding box in screen pixels, snapped to the low-res grid. Outside it the mask is uniform (and the vignette is smooth), so a plain nearest-neighbour copy is exact and cheap; inside it the
   * darkness is upscaled smoothly in two stages (bilinear to half size, then nearest): a full-frame bilinear upscale costs 8 ms in the software renderer, this 1.5 to 3 ms. */
  const FW = P.cw * DS, FH = P.ch * DS;
  let X0 = Math.max(0, Math.floor(sx0 / DS)) * DS, Y0 = Math.max(0, Math.floor(sy0 / DS)) * DS, X1 = Math.min(P.cw, Math.ceil(sx1 / DS)) * DS, Y1 = Math.min(P.ch, Math.ceil(sy1 / DS)) * DS;
  const box = n > 0 && X1 > X0 && Y1 > Y0;
  if (D > .004 || vig > .004) {                                                                   /* the darkness */
    dkc.setTransform(1, 0, 0, 1, 0, 0); dkc.globalCompositeOperation = 'source-over'; dkc.globalAlpha = 1; dkc.clearRect(0, 0, P.cw, P.ch);
    if (D > .004) {
      dkc.fillStyle = rgba(tint, D); dkc.fillRect(0, 0, P.cw, P.ch);
      if (n) { dkc.globalCompositeOperation = 'destination-out'; dkc.drawImage(P.lc, 0, 0); dkc.globalCompositeOperation = 'source-over'; }
    }
    if (vig > .004) { dkc.globalAlpha = vig; dkc.drawImage(vigSprite(tint, P.cw, P.ch), 0, 0); dkc.globalAlpha = 1; }
    c.imageSmoothingEnabled = false;
    const strip = (x, y, ww, hh) => { if (ww > 0 && hh > 0) c.drawImage(P.dk, x / DS, y / DS, ww / DS, hh / DS, x, y, ww, hh); };
    if (!box) strip(0, 0, FW, FH);
    else {
      strip(0, 0, FW, Y0); strip(0, Y1, FW, FH - Y1); strip(0, Y0, X0, Y1 - Y0); strip(X1, Y0, FW - X1, Y1 - Y0);
      const mc = P.midc, bx = X0 / 2, by = Y0 / 2, bw = (X1 - X0) / 2, bh = (Y1 - Y0) / 2;
      mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalCompositeOperation = 'source-over'; mc.globalAlpha = 1; mc.clearRect(bx, by, bw, bh);
      mc.imageSmoothingEnabled = true; mc.drawImage(P.dk, X0 / DS, Y0 / DS, (X1 - X0) / DS, (Y1 - Y0) / DS, bx, by, bw, bh);
      c.drawImage(P.mid, bx, by, bw, bh, X0, Y0, X1 - X0, Y1 - Y0);
    }
    c.imageSmoothingEnabled = true;
  }
  if (box && glowAmt > .004) {                                                                    /* the lights' own colour, over their bounding box only (nearest: it is a soft, faint add) */
    c.imageSmoothingEnabled = false; c.globalCompositeOperation = 'lighter'; c.globalAlpha = glowAmt;
    c.drawImage(P.lc, X0 / DS, Y0 / DS, (X1 - X0) / DS, (Y1 - Y0) / DS, X0, Y0, X1 - X0, Y1 - Y0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = true;
  }
  if (bloomA > .01) {                                                                             /* bloom on the cores of points and cone lenses */
    for (const [l, pw] of live) {
      const kind = l.kind || 'point', X = M.a * (+l.x || 0) + M.c * (+l.y || 0) + M.e, Y = M.b * (+l.x || 0) + M.d * (+l.y || 0) + M.f, col = l.color || '#fff1d6';
      if (kind === 'point') FX.glow(c, { x: X, y: Y, r: Math.max(14, Math.min(110, (+l.r || 200) * zoom * .2)), color: col, alpha: bloomA * .7 * Math.min(1.2, pw), core: .6 });
      else if (kind === 'cone') FX.glow(c, { x: X, y: Y, r: Math.max(14, Math.min(70, (+l.len || 700) * zoom * .07)), color: col, alpha: bloomA * .75 * Math.min(1.2, pw), core: .85 });
    }
  }
  const gr = o.grade;
  if (gr && gr.alpha > .004) { c.globalCompositeOperation = gr.mode || 'source-over'; c.globalAlpha = clamp01(gr.alpha); c.fillStyle = gr.color || '#000'; c.fillRect(0, 0, w, h); }
  c.restore();
  return n;
};

// ------------------------------------------------------------------ batch 2: snow lying on things (sill, bank, cap)
/* two palettes: 'light' (default: a pale wall or day: a cool-blue rim so the white never vanishes) and 'dark' (a moonlit night: bluer, no rim). shadow = the blue the shaded side and the lip shadow are made of */
const SNOWC = {
  light: { top: '#ffffff', mid: '#eef4fc', low: '#c3d2ec', rim: 'rgba(105,135,188,.62)', shadow: '#30497a' },
  dark: { top: '#f3f7ff', mid: '#cddbf4', low: '#8aa1cd', rim: null, shadow: '#081230' },
};
const tn = o => SNOWC[o.tone === 'dark' ? 'dark' : 'light'];
/* a smooth lumpy profile in about -1..1: two octaves of FX18.noise along a length in px */
const lump = (seed, px) => (noise(seed + 1, px / 46) - .5) * 1.2 + (noise(seed + 5, px / 17) - .5) * .8;
/* a sparkle: a soft dot with a four-point cross; a = 0..1 */
function glint(c, x, y, r, a) {
  if (a < .03) return;
  c.globalAlpha = Math.min(1, a * .55); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, r * .32, 0, TAU); c.fill();
  c.globalAlpha = Math.min(1, a); c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(.8, r * .16); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r * 1.1); c.lineTo(x, y + r * 1.1); c.stroke(); c.globalAlpha = 1;
}
const twinkle = (seed, k, t) => t == null ? .85 : .35 + .65 * Math.pow(.5 + .5 * Math.sin(TAU * (.35 + .5 * rnd(seed + 11, k)) * t + TAU * rnd(seed + 12, k)), 2);
/* WORLD. A snow heap on a ledge: lumpy, tapered at both ends, a soft blue shadow under the lip, a few sparkles (they twinkle if you pass t). Draw it after the ledge.
 * o = { x0, x1, y (the ledge top), depth (px), seed, tone, t [added, optional] } */
SN20.sill = function sill(c, o = {}) {
  const x0 = +o.x0 || 0, x1 = o.x1 == null ? x0 + 300 : +o.x1, y = +o.y || 0, depth = +o.depth || 0, seed = +o.seed || 0, K = tn(o), Wd = x1 - x0;
  if (!(depth > .5) || !(Wd > 4)) return;
  const n = Math.max(6, Math.round(Wd / 7)), top = [];
  for (let i = 0; i <= n; i++) { const u = i / n, hh = depth * Math.pow(Math.sin(PI * u), .7) * (.8 + .2 * lump(seed, u * Wd)); top.push([x0 + u * Wd, y - Math.max(0, hh)]); }
  c.save(); clean(c);
  let g = c.createLinearGradient(0, y, 0, y + 14); g.addColorStop(0, rgba(K.shadow, .42)); g.addColorStop(1, rgba(K.shadow, 0));
  c.fillStyle = g; c.fillRect(x0 + Wd * .02, y, Wd * .96, 14);                                      /* the shadow under the lip, on the ledge's front */
  c.beginPath(); c.moveTo(x0, y + 1); for (const p of top) c.lineTo(p[0], p[1]); c.lineTo(x1, y + 1); c.closePath();
  g = c.createLinearGradient(0, y - depth, 0, y + 1); g.addColorStop(0, K.top); g.addColorStop(.45, K.mid); g.addColorStop(1, K.low); c.fillStyle = g; c.fill();
  if (K.rim) { c.lineWidth = 1.6; c.lineJoin = 'round'; c.strokeStyle = K.rim; c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
  const ns = Math.min(9, Math.round(Wd / 80) + 1);
  for (let k = 0; k < ns; k++) { const u = .08 + .84 * rnd(seed + 9, k), i = Math.round(u * n), p = top[i]; if (y - p[1] > 3) glint(c, p[0], p[1] - 1, 2 + 2.4 * rnd(seed + 10, k), twinkle(seed, k, o.t)); }
  c.restore();
};
/* WORLD. A drift or mound: a lumpy dome, steeper on its windward side, lit from the top left; `shade` (0..1, default .6) is how blue the shadow side is; flip mirrors it. o = { x, y (base centre), w, h, seed, shade, flip, tone, t [optional] } */
SN20.bank = function bank(c, o = {}) {
  const x = +o.x || 0, y = +o.y || 0, w = +o.w || 300, h = +o.h || 100, seed = +o.seed || 0, shade = o.shade == null ? .6 : clamp01(o.shade), K = tn(o);
  if (!(w > 4) || !(h > .5)) return;
  const n = Math.max(10, Math.round(w / 8)), top = [];
  for (let i = 0; i <= n; i++) { const u = i / n, e = Math.sin(PI * Math.pow(u, 1.35)), hh = h * Math.pow(Math.max(0, e), .85) * (1 + .09 * lump(seed, u * w)); top.push([-w / 2 + u * w, -Math.max(0, hh)]); }
  c.save(); clean(c); c.translate(x, y); if (o.flip) c.scale(-1, 1);
  let g = c.createRadialGradient(0, 0, 0, 0, 0, w * .56); g.addColorStop(0, rgba(K.shadow, .5)); g.addColorStop(1, rgba(K.shadow, 0));
  c.save(); c.translate(0, 3); c.scale(1, .13); c.fillStyle = g; c.beginPath(); c.arc(0, 0, w * .56, 0, TAU); c.fill(); c.restore();     /* the contact shadow */
  c.beginPath(); c.moveTo(-w / 2, 1); for (const p of top) c.lineTo(p[0], p[1]); c.lineTo(w / 2, 1); c.closePath();
  g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, K.top); g.addColorStop(.4, K.mid); g.addColorStop(1, mix(K.low, K.shadow, .08 + .3 * shade)); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, rgba(K.shadow, 0)); g.addColorStop(1, rgba(K.shadow, .05 + .1 * shade)); c.fillStyle = g; c.fillRect(-w / 2, -h - 4, w, h + 6);
  c.strokeStyle = rgba(K.shadow, .09 + .08 * shade); c.lineWidth = 2.4; c.lineCap = 'round';                                          /* wind-carved ridges */
  for (let k = 0; k < 3; k++) { const u0 = .14 + .66 * rnd(seed + 3, k), xs = -w / 2 + u0 * w, hh = h * (.25 + .3 * k / 2); c.beginPath(); c.moveTo(xs, -hh * .15); c.quadraticCurveTo(xs + w * .16, -hh * 1.2, xs + w * .34, -hh * .6); c.stroke(); }
  c.restore();
  if (K.rim) { c.lineWidth = 1.6; c.lineJoin = 'round'; c.strokeStyle = K.rim; c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
  const ns = Math.min(10, Math.round(w / 70) + 1);
  for (let k = 0; k < ns; k++) { const u = .12 + .72 * rnd(seed + 9, k), p = top[Math.round(u * n)]; if (-p[1] > 3) glint(c, p[0], p[1] + 2 + .15 * h * rnd(seed + 13, k), 2 + 2.4 * rnd(seed + 10, k), twinkle(seed, k, o.t)); }
  c.restore();
};
/* WORLD. Snow lying along a flat top (a car roof, a sign, a bench, a hat brim): a loaf-shaped layer of thickness `depth` above y from x0 to x1; `round` 0 = flat top and square ends, 1 = fully rounded shoulders with a small
 * overhang. Draw it AFTER the object. o = { x0, x1, y (the top surface), depth, seed, round, tone, t [optional] } */
SN20.cap = function cap(c, o = {}) {
  const x0 = +o.x0 || 0, x1 = o.x1 == null ? x0 + 200 : +o.x1, y = +o.y || 0, depth = +o.depth || 0, seed = +o.seed || 0, rd = o.round == null ? .6 : clamp01(o.round), K = tn(o), Wd = x1 - x0;
  if (!(depth > .4) || !(Wd > 3)) return;
  const ov = 1.5 + 3 * rd, sh = Math.min(Wd * .45, depth * (.35 + 1.2 * rd)), n = Math.max(6, Math.round(Wd / 6)), top = [];
  for (let i = 0; i <= n; i++) {
    const px = i / n * Wd, e = Math.min(1, Math.min(px, Wd - px) / Math.max(1, sh)), edge = Math.sin(e * PI / 2), flat = e >= 1 ? 1 : edge;
    top.push([x0 + px, y - depth * (rd < .01 ? (px < 1 || Wd - px < 1 ? .85 : 1) : flat) * (1 + .1 * lump(seed, px))]);
  }
  c.save(); clean(c);
  c.beginPath(); c.moveTo(x0 - ov, y + .5); c.quadraticCurveTo(x0 - ov, y - depth * .3, top[0][0], top[0][1]);
  for (const p of top) c.lineTo(p[0], p[1]);
  c.quadraticCurveTo(x1 + ov, y - depth * .3, x1 + ov, y + .5); c.closePath();
  const g = c.createLinearGradient(0, y - depth, 0, y); g.addColorStop(0, K.top); g.addColorStop(.5, K.mid); g.addColorStop(1, K.low); c.fillStyle = g; c.fill();
  if (K.rim) { c.lineWidth = 1.5; c.lineJoin = 'round'; c.strokeStyle = K.rim; c.stroke(); }
  c.fillStyle = rgba(K.shadow, .3); c.fillRect(x0 - ov * .6, y, Wd + ov * 1.2, 2);                  /* the contact line under the snow's lip */
  const ns = Math.min(6, Math.round(Wd / 90));
  for (let k = 0; k < ns; k++) { const p = top[Math.round((.1 + .8 * rnd(seed + 9, k)) * n)]; if (y - p[1] > 3) glint(c, p[0], p[1] - 1, 2 + 1.8 * rnd(seed + 10, k), twinkle(seed, k, o.t)); }
  c.restore();
};

// ------------------------------------------------------------------ batch 2: beam (a headlight or flashlight in falling snow) and breath (a puff of cold breath)
/* a bright dot with a hot core, baked per colour: the flakes inside a beam */
function dotSprite(col) {
  const hot = mix(col, '#ffffff', .7);
  return sprite('sn20dot:' + col, 32, 32, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba('#ffffff', 1)); gr.addColorStop(.22, rgba(hot, .9)); gr.addColorStop(.55, rgba(col, .28)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
/* WORLD. A headlight or flashlight beam in falling snow: an FX18 cone plus the flakes inside it, brighter and sparkling (they fall like the scene's snow; pass the same wind and gusts to match it).
 * o = { x, y, ang, spread, len, color, alpha, t, seed, flakes (default true), soft, wind, gusts, density (flakes in the beam, default 1) } */
SN20.beam = function beam(c, o = {}) {
  const x = +o.x || 0, y = +o.y || 0, ang = +o.ang || 0, spread = o.spread == null ? .5 : Math.max(.05, Math.min(2.6, o.spread)), len = o.len == null ? 700 : +o.len, col = o.color || '#fff4d6', a = o.alpha == null ? .5 : o.alpha;
  const t = +o.t || 0, seed = +o.seed || 0;
  if (!(a > .01) || !(len > 4)) return;
  FX.cone(c, { x, y, ang, spread, len, color: col, alpha: a, soft: o.soft == null ? .6 : o.soft });
  if (o.flakes === false) return;
  const hs = spread / 2;
  let bx0 = x, by0 = y, bx1 = x, by1 = y;                                                         /* the cone's bounding box */
  const pts = [ang - hs, ang, ang + hs]; for (let k = -4; k <= 4; k++) { const q = k * PI / 2; if (q > ang - hs && q < ang + hs) pts.push(q); }
  for (const an of pts) { const px = x + Math.cos(an) * len, py = y + Math.sin(an) * len; if (px < bx0) bx0 = px; if (px > bx1) bx1 = px; if (py < by0) by0 = py; if (py > by1) by1 = py; }
  const M = 24, WX = bx1 - bx0 + 2 * M, HY = by1 - by0 + 2 * M, n = Math.max(10, Math.min(240, Math.round(WX * HY / 4200 * (o.density == null ? 1 : o.density))));
  const wi = SN20.windInt(t, o.gusts) + (o.wind || 0) * t, dspr = dotSprite(col), ca = Math.cos(ang), sa = Math.sin(ang);
  c.save(); clean(c); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const fall = 80 + 130 * rnd(seed + 2, i), sw = 5 + 9 * rnd(seed + 3, i), f1 = .25 + .4 * rnd(seed + 4, i), p1 = TAU * rnd(seed + 5, i);
    let xx = rnd(seed + 1, i * 2) * WX + wi * (.7 + .5 * rnd(seed + 6, i)) + sw * Math.sin(TAU * f1 * t + p1); xx -= Math.floor(xx / WX) * WX;
    let yy = rnd(seed + 1, i * 2 + 1) * HY + fall * t; yy -= Math.floor(yy / HY) * HY;
    const fx = bx0 - M + xx, fy = by0 - M + yy, dx = fx - x, dy = fy - y, r = Math.hypot(dx, dy);
    if (r > len || r < 10) continue;
    let th = Math.atan2(dy, dx) - ang; th -= TAU * Math.round(th / TAU);
    const v = Math.abs(th) / hs;
    if (v >= 1) continue;
    const tw = .55 + .45 * Math.pow(.5 + .5 * Math.sin(TAU * (.6 + 1.6 * rnd(seed + 7, i)) * t + TAU * rnd(seed + 8, i)), 2), br = Math.pow(1 - r / len, .8) * (1 - Math.pow(v, 2.2)) * tw;
    if (br < .03) continue;
    const rr = 3 + 5 * rnd(seed + 9, i); c.globalAlpha = Math.min(1, a * 1.9 * br);
    c.drawImage(dspr, fx - rr, fy - rr, rr * 2, rr * 2);
  }
  c.restore();
};
/* the breath puff: a soft white blob with a faint blue-grey edge (it shows as a darker rim on a pale wall and vanishes on a dark one) */
function puffSprite() {
  return sprite('sn20breath', 96, 96, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,.92)'); gr.addColorStop(.45, 'rgba(247,251,255,.78)'); gr.addColorStop(.72, 'rgba(214,226,243,.46)'); gr.addColorStop(.88, 'rgba(140,162,196,.2)'); gr.addColorStop(1, 'rgba(120,145,185,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
/* WORLD. A puff of cold breath leaving a mouth every `period` seconds (default 1.9): six lobes leave over the first .4 s, drift in the direction dir (+1 right, -1 left), rise, swell and fade over about 1.9 s; thicker
 * and softer than steam, with a faint darker edge. o = { x, y (the mouth), t, seed, period, dir, size (1 = a 60 px puff), alpha, phase (seconds: shifts the schedule) } */
SN20.breath = function breath(c, o = {}) {
  const x = +o.x || 0, y = +o.y || 0, t = +o.t || 0, seed = +o.seed || 0, period = o.period > .3 ? +o.period : 1.9, dir = o.dir < 0 ? -1 : 1, size = o.size == null ? 1 : o.size, alpha = o.alpha == null ? 1 : o.alpha, phase = +o.phase || 0;
  if (!(alpha > .01) || !(size > .05)) return;
  const LIFE = Math.min(2.4, Math.max(1.2, period * 1.05)), cyc = Math.floor((t - phase) / period), spr = puffSprite();
  c.save(); clean(c);
  for (let k = cyc - 1; k <= cyc; k++) {
    const t0 = phase + k * period, age = t - t0;
    if (age < 0 || age > LIFE) continue;
    for (let j = 0; j < 6; j++) {
      const la = age - j * .07;
      if (la < 0) continue;
      const u = la / (LIFE - j * .07), r1 = rnd(seed + k * 7.3, j), r2 = rnd(seed + k * 7.3 + .5, j + 9), e = 1 - Math.pow(1 - u, 1.8);
      const px = x + dir * (14 + (80 + 70 * r1) * size * e) + 8 * size * Math.sin(u * 5 + j), py = y - (10 + (40 + 40 * r2) * size) * Math.pow(u, .85) + 6 * size * Math.sin(u * 4 + j * 2) + 6 * size * u;
      const r = size * (13 + 50 * Math.pow(u, .55)) * (.8 + .4 * r1), al = alpha * .62 * Math.pow(1 - u, 1.35) * sstep(0, .1, la);
      if (al < .01) continue;
      c.globalAlpha = al; c.drawImage(spr, px - r, py - r, 2 * r, 2 * r);
    }
  }
  c.restore();
};

// ------------------------------------------------------------------ batch 2: frost
/* One fern (a frost crystal): a slightly bending stem of length L grown to g (0..1) of it, symmetric side branches angled toward the tip that start growing once the stem has passed their root, short twigs on the
 * branches. Segments go into three batches by weight (stem, branch, twig) as flat arrays [x1, y1, x2, y2, ...]. */
function fern(S, x0, y0, th, L, g, seed) {
  const Lg = L * g;
  if (Lg < 3) return;
  const bend = (rnd(seed, 1) - .5) * .9, ns = Math.max(3, Math.round(Lg / 16)), step = Lg / ns, P = [x0, y0], A = [];
  let px = x0, py = y0;
  for (let i = 1; i <= ns; i++) { const a = th + bend * (i / ns); A.push(a); px += Math.cos(a) * step; py += Math.sin(a) * step; P.push(px, py); S.stem.push(P[2 * i - 2], P[2 * i - 1], px, py); }
  const nb = Math.max(2, Math.round(L / 14));
  for (let k = 0; k < nb; k++) {
    const f = .1 + .84 * (k + .5) / nb, d = f * L;
    if (d > Lg - 1) continue;
    const i = Math.min(ns - 1, Math.floor(d / step)), fr = d / step - i, rx = P[2 * i] + (P[2 * i + 2] - P[2 * i]) * fr, ry = P[2 * i + 1] + (P[2 * i + 3] - P[2 * i + 1]) * fr, as = A[i];
    for (const sg of [-1, 1]) {
      const lb = L * (.3 * Math.pow(1 - f, .75) + .06) * clamp01((Lg - d) / (L * .22)) * (.85 + .3 * rnd(seed + 2 + sg, k));
      if (lb < 2.5) continue;
      const ab = as + sg * (1.0 - .28 * f), ex = rx + Math.cos(ab) * lb, ey = ry + Math.sin(ab) * lb;
      S.br.push(rx, ry, ex, ey);
      if (lb > 11) for (const ft of [.36, .64, .9]) {
        const tx = rx + (ex - rx) * ft, ty = ry + (ey - ry) * ft, lt2 = lb * .36 * (1 - ft * .35);
        for (const s2 of [-1, 1]) { const at = ab + s2 * .95; S.tw.push(tx, ty, tx + Math.cos(at) * lt2, ty + Math.sin(at) * lt2); }
      }
    }
  }
}
function strokeBatch(c, arr, lw, col, ox, oy) {
  if (!arr.length) return;
  c.lineWidth = lw; c.strokeStyle = col; c.beginPath();
  for (let i = 0; i < arr.length; i += 4) { c.moveTo(arr[i] + ox, arr[i + 1] + oy); c.lineTo(arr[i + 2] + ox, arr[i + 3] + oy); }
  c.stroke();
}
/* The frost itself, painted into a pane-sized canvas g (origin = the pane's top left) for a given amount: the misted rim and every fern. Position independent: the same seed gives the same lace anywhere. */
function frostPaint(g, w, h, amount, seed, dark, mistK) {
  const m = Math.min(w, h), S = { stem: [], br: [], tw: [] };
  const nb = Math.max(4, Math.round(w / 44)), ns = Math.max(4, Math.round(h / 58)), nt = Math.max(2, Math.round(w / 90)), cornerD = (sx, sy) => Math.min(Math.hypot(sx, sy - h), Math.hypot(sx - w, sy - h)) / ((w + h) * .5);
  const grow = (sx, sy, th, Lmax, extra, k) => {
    const start = .03 + .5 * Math.min(1, cornerD(sx, sy)) + .1 * rnd(seed + 31, k) + extra, gr = clamp01((amount - start) / .5);
    if (gr > 0) fern(S, sx, sy, th, Lmax * (.5 + .5 * rnd(seed + 32, k)), gr, seed + 100 + k * 3.7);
  };
  for (let i = 0; i < nb; i++) { const sx = (i + .15 + .7 * rnd(seed + 40, i)) * w / nb; grow(sx, h + 2, -PI / 2 + (rnd(seed + 41, i) - .5) * .8, m * .4, 0, i); }
  for (let j = 0; j < ns; j++) {
    const sy = (j + .15 + .7 * rnd(seed + 42, j)) * h / ns;
    grow(-2, sy, -.28 + (rnd(seed + 43, j) - .5) * .8, m * .31, 0, 100 + j); grow(w + 2, sy, PI + .28 + (rnd(seed + 44, j) - .5) * .8, m * .31, 0, 200 + j);
  }
  for (let i = 0; i < nt; i++) { const sx = (i + .2 + .6 * rnd(seed + 45, i)) * w / nt; grow(sx, -2, PI / 2 + (rnd(seed + 46, i) - .5) * .8, m * .2, .14, 300 + i); }
  g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
  const mist = Math.pow(amount, .8) * mistK;                                                      /* the misted rim: a milky band along every edge, thickest in the bottom corners */
  const band = (x0, y0, x1, y1, bx, by, bw, bh, a) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, rgba('#eef6ff', a)); gr.addColorStop(.5, rgba('#eef6ff', a * .38)); gr.addColorStop(1, rgba('#eef6ff', 0)); g.fillStyle = gr; g.fillRect(bx, by, bw, bh); };
  const dz = m * .16 * mist;
  band(0, h, 0, h - dz * 1.4, 0, h - dz * 1.4, w, dz * 1.4, .52 * mist);
  band(0, 0, dz, 0, 0, 0, dz, h, .42 * mist); band(w, 0, w - dz, 0, w - dz, 0, dz, h, .42 * mist); band(0, 0, 0, dz * .7, 0, 0, w, dz * .7, .34 * mist);
  for (const cx of [0, w]) { const r = dz * 2.6, gr = g.createRadialGradient(cx, h, 0, cx, h, r); gr.addColorStop(0, rgba('#f2f8ff', .5 * mist)); gr.addColorStop(1, rgba('#f2f8ff', 0)); g.fillStyle = gr; g.fillRect(cx - r, h - r, r * 2, r); }
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (!dark) { const u = 'rgba(88,118,170,.4)'; strokeBatch(g, S.stem, 3.8, u, 0, 1); strokeBatch(g, S.br, 2.8, u, 0, 1); strokeBatch(g, S.tw, 2.2, u, 0, 1); }       /* a blue underline so white lace reads on a pale pane */
  strokeBatch(g, S.tw, 1.1, 'rgba(255,255,255,.88)', 0, 0); strokeBatch(g, S.br, 1.6, 'rgba(255,255,255,.92)', 0, 0); strokeBatch(g, S.stem, 2.3, 'rgba(255,255,255,.96)', 0, 0);
  g.restore();
}
const FROST_Q = 40, FROSTC = new Map();                                       /* the baked frost per (pane, seed, tone, amount step): a small LRU, it only saves time */
function frostSprite(w, h, qa, seed, dark, mistK) {
  const key = w + 'x' + h + '|' + seed + '|' + (dark ? 1 : 0) + '|' + mistK + '|' + qa;
  let cv = FROSTC.get(key);
  if (cv) { FROSTC.delete(key); FROSTC.set(key, cv); return cv; }
  cv = mk(w, h); frostPaint(cv.getContext('2d'), w, h, qa / FROST_Q, seed, dark, mistK);
  FROSTC.set(key, cv); if (FROSTC.size > 14) FROSTC.delete(FROSTC.keys().next().value);
  return cv;
}
/* WORLD. Frost on a window pane (x, y = top left): ferns grow in from the edges as `amount` (0..1) rises, first from the bottom corners, then along the bottom and the sides, last from the top; at 1 the lace and the
 * misted rim cover about 60 percent of the pane and the centre stays clear. A faint glint travels across the ferns with t. Clipped to the pane rectangle. The lace is baked once per pane and amount step (1/40) and the two
 * neighbouring steps are cross-faded, so growing frost is smooth and a call costs about one pane-sized blit (1 to 2 ms).
 * o = { x, y, w, h, amount, seed, t, tone ('light' default | 'dark'), fade [added: 0..1, how strongly the rim is misted, default 1] } */
SN20.frost = function frost(c, o = {}) {
  const x = +o.x || 0, y = +o.y || 0, w = Math.round(+o.w || 300), h = Math.round(+o.h || 400), amount = clamp01(+o.amount || 0), seed = +o.seed || 0, t = +o.t || 0, dark = o.tone === 'dark', mistK = o.fade == null ? 1 : +o.fade;
  if (!(amount > .01) || !(w > 20) || !(h > 20)) return;
  const q = amount * FROST_Q, q0 = Math.floor(q), f = q - q0;
  c.save(); clean(c); c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (q0 >= 1 && f < .98) { c.globalAlpha = f > .02 ? 1 - f * .5 : 1; c.drawImage(frostSprite(w, h, q0, seed, dark, mistK), x, y); }
  if (f > .02) { c.globalAlpha = f; c.drawImage(frostSprite(w, h, q0 + 1, seed, dark, mistK), x, y); }
  const spr = frostSprite(w, h, Math.min(FROST_Q, Math.max(1, Math.round(q))), seed, dark, mistK), ph = ((t * 130) % (w + h + 500)) - 250 + x + y;    /* the glint: two nested diagonal bands that brighten the lace they pass over */
  c.globalCompositeOperation = 'lighter';
  for (const [wd, al] of [[150, .16], [64, .26]]) {
    const s0 = ph - wd - x - y, s1 = ph + wd - x - y;
    c.save(); c.beginPath(); c.moveTo(x + s0, y); c.lineTo(x + s1, y); c.lineTo(x + s1 - h, y + h); c.lineTo(x + s0 - h, y + h); c.closePath(); c.clip(); c.globalAlpha = al; c.drawImage(spr, x, y); c.restore();
  }
  c.restore();
};

// ------------------------------------------------------------------ batch 3: spray, flurry (powder), emergency, lamps, maskPoints and settle (the title)
/* a soft white puff shaded blue toward its lower right, no ring: the clumps and powder of spray and flurry (reads on a pale wall by its shading, on a dark one by its whiteness) */
function powderSprite() {
  return sprite('sn20powder', 64, 64, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r * .8, r * .72, 0, r, r, r);
    gr.addColorStop(0, 'rgba(255,255,255,.96)'); gr.addColorStop(.5, 'rgba(244,249,255,.9)'); gr.addColorStop(.78, 'rgba(206,220,242,.62)'); gr.addColorStop(.92, 'rgba(150,174,212,.22)'); gr.addColorStop(1, 'rgba(130,156,200,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
/* WORLD. Snow thrown by a plow blade or a shovel: clumps and fine powder leave (x, y) along ang (default straight up-right: -pi/4) inside the full angle `width` (default .8 rad), slow down in the air, arc and fall.
 * Emission runs from t0 to t1 (default: for ever); what is in the air finishes its flight. power scales rate and speed (default 1), gravity default 1100 px/s^2.
 * o = { x, y, ang, t, t0, t1, seed, power, width, gravity } */
SN20.spray = function spray(c, o = {}) {
  const x = +o.x || 0, y = +o.y || 0, ang = o.ang == null ? -PI / 4 : +o.ang, t = +o.t || 0, t0 = o.t0 == null ? 0 : +o.t0, t1 = o.t1 == null ? Infinity : +o.t1, seed = +o.seed || 0, pw = o.power == null ? 1 : +o.power, width = o.width == null ? .8 : +o.width, G = o.gravity == null ? 1100 : +o.gravity;
  if (t < t0 || !(pw > .02)) return;
  const rate = 95 * pw, LIFE = 1.7, tE = Math.min(t, t1), iLo = Math.max(0, Math.ceil((t - LIFE - t0) * rate) - 1), iHi = Math.min(iLo + 420, Math.floor((tE - t0) * rate));
  const spr = powderSprite(), K = 1.7;
  c.save(); clean(c);
  for (let i = iLo; i <= iHi; i++) {
    const tb = t0 + (i + rnd(seed + 1, i)) / rate, age = t - tb;
    if (tb > tE || age < 0 || age > LIFE) continue;
    const a = ang + width * (rnd(seed + 2, i) - .5) + width * .15 * (rnd(seed + 3, i) - .5), clump = rnd(seed + 4, i) < .32, v = (clump ? 430 : 300 + 520 * rnd(seed + 5, i)) * (.75 + .25 * pw), life = (clump ? 1.5 : .8 + .6 * rnd(seed + 6, i));
    if (age > life) continue;
    const e = (1 - Math.exp(-K * age)) / K, px = x + Math.cos(a) * v * e, py = y + Math.sin(a) * v * e + .5 * G * age * age, u = age / life;
    const r = clump ? 7 + 9 * rnd(seed + 7, i) + 5 * u : 3 + 4 * rnd(seed + 7, i) + 6 * u, al = (clump ? .88 : .6) * (1 - sstep(.55, 1, u)) * sstep(0, .04, age);
    if (al < .02) continue;
    c.globalAlpha = al; c.drawImage(spr, px - r, py - r, 2 * r, 2 * r);
  }
  const on = seg(t, t0, t0 + .18) * (1 - seg(t, t1, t1 + .5));                                      /* the cloud at the blade while it throws */
  if (on > .02) { c.globalAlpha = .5 * on; const r = 34 + 16 * Math.sin(t * 9); c.drawImage(spr, x - r, y - r * .8, 2 * r, 2 * r); }
  c.restore();
};
/* WORLD. A burst of powder (a snowball hit, a door dump, a slip): a flash of white and `n` puffs (default 36) thrown outward from (x, y), slowed by the air, falling a little, over `life` seconds (default 1).
 * o = { x, y, r (the size of the burst, default 80), t, t0, life, seed, n } */
SN20.flurry = function flurry(c, o = {}) {
  const x = +o.x || 0, y = +o.y || 0, R = o.r == null ? 80 : +o.r, t = +o.t || 0, t0 = o.t0 == null ? 0 : +o.t0, life = o.life == null ? 1 : +o.life, seed = +o.seed || 0, n = Math.min(120, o.n == null ? 36 : Math.round(o.n)), age = t - t0;
  if (age < 0 || age > life + .05 || !(R > 2)) return;
  const spr = powderSprite(), u0 = age / life;
  c.save(); clean(c);
  if (u0 < .45) { const k = u0 / .45, r = R * (.5 + .9 * (1 - Math.pow(1 - k, 2))); c.globalAlpha = .7 * (1 - k) * (1 - k); c.drawImage(spr, x - r, y - r, 2 * r, 2 * r); }
  for (let i = 0; i < n; i++) {
    const a = TAU * rnd(seed + 1, i), v = R * (2.2 + 4.5 * rnd(seed + 2, i)), e = (1 - Math.exp(-3.4 * age)) / 3.4, l = life * (.65 + .35 * rnd(seed + 3, i)), u = age / l;
    if (u >= 1) continue;
    const px = x + Math.cos(a) * v * e, py = y + Math.sin(a) * v * e * .8 + .5 * R * 4.5 * age * age, r = R * (.07 + .14 * rnd(seed + 4, i)) * (.7 + .8 * Math.pow(u, .6)), al = .85 * Math.pow(1 - u, 1.2) * sstep(0, .05, age);
    if (al < .02) continue;
    c.globalAlpha = al; c.drawImage(spr, px - r, py - r, 2 * r, 2 * r);
  }
  c.restore();
};
/* SCREEN. The red-amber wash for the generator beat: a multiplied red cast, a red-black vignette, and a slow breathing (a sine of period 2.6 s whose depth is `pulse`: never a strobe).
 * o = { level (0..1), t, pulse (0..1, default .15) }. About 4 ms at full level; level 0 draws nothing. */
L20.emergency = function emergency(c, o = {}) {
  const lv = clamp01(+o.level || 0), pulse = clamp01(o.pulse == null ? .15 : o.pulse), t = +o.t || 0;
  if (!(lv > .005) || inMask()) return;
  const w = c.canvas.width, h = c.canvas.height, br = 1 - pulse * (.5 - .5 * Math.cos(TAU * t / 2.6));
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); clean(c);
  c.globalCompositeOperation = 'multiply'; c.fillStyle = rgba('#ff4a30', clamp01(.46 * lv * br)); c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = false; c.globalAlpha = clamp01(.36 * lv * (.7 + .3 * br)); c.drawImage(vigSprite('#1c0204', Math.ceil(w / DS), Math.ceil(h / DS)), 0, 0, Math.ceil(w / DS) * DS, Math.ceil(h / DS) * DS);
  c.restore();
};
/* WORLD. Small glowing LED candles and lamps, the glow only (no darkening): list = [{ x, y, r (default 60), color, alpha (default .8), flicker: { seed, amt (<= .25), rate (<= 3 Hz) } }]; o = { t }. Uses FX18.glow, so it feeds the engine's bloom. */
L20.lamps = function lamps(c, list, o = {}) {
  const t = +(o && o.t) || 0;
  if (!list) return;
  for (let i = 0; i < list.length; i++) {
    const l = list[i];
    if (!l) continue;
    const f = flick(l, t);
    FX.glow(c, { x: +l.x || 0, y: +l.y || 0, r: (l.r == null ? 60 : +l.r) * (1 + .12 * (f - 1)), color: l.color || '#ffcf80', alpha: (l.alpha == null ? .8 : +l.alpha) * f, core: l.core == null ? .6 : l.core });
  }
};
/* Target points for SN20.settle: drawFn(g) paints the shape (text, a logo) into an offscreen w x h canvas (a flat silhouette: the text gate ignores it); the points are a jittered grid of `step` px (default 7) over every
 * cell whose centre is inked, as [x, y] in the canvas's own coordinates. Pure and deterministic, but it costs a little: call it ONCE per shape and keep the result (the font must be loaded). */
SN20.maskPoints = function maskPoints(drawFn, w, h, step, seed) {
  step = step > 1 ? step : 7; seed = +seed || 0;
  const cv = mk(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))), g = cv.getContext('2d');
  drawFn(g);
  const d = g.getImageData(0, 0, cv.width, cv.height).data, pts = [];
  for (let gy = 0, k = 0; gy * step < cv.height; gy++) for (let gx = 0; gx * step < cv.width; gx++, k++) {
    const cx = Math.min(cv.width - 1, Math.floor(gx * step + step / 2)), cy = Math.min(cv.height - 1, Math.floor(gy * step + step / 2));
    if (d[(cy * cv.width + cx) * 4 + 3] < 128) continue;
    pts.push([gx * step + step * (.2 + .6 * rnd(seed + 1, k)), gy * step + step * (.2 + .6 * rnd(seed + 2, k))]);
  }
  return pts;
};
/* WORLD. Snow settling into a shape: every flake swirls round `from` = { x, y, r } (a vortex: the inner ones turn faster) until t0, then flies to its own target point on a curved path, each leaving at its own moment and
 * resting there from t1 on. o = { pts: [[x, y], ...], from, t, t0, t1, seed, size (flake diameter, default 7), alpha, tone ('dark' default), max (the most flakes, default 2600) }. About 3 us a flake. */
SN20.settle = function settle(c, o = {}) {
  const pts = o.pts, fr = o.from || { x: 540, y: 960, r: 300 }, t = +o.t || 0, t0 = o.t0 == null ? 0 : +o.t0, t1 = o.t1 == null ? t0 + 1.2 : Math.max(+o.t1, t0 + .3), seed = +o.seed || 0, alpha = o.alpha == null ? 1 : +o.alpha, size = o.size == null ? 7 : +o.size;
  if (!pts || !pts.length || !(alpha > .01)) return;
  const n = Math.min(pts.length, o.max || 2600), tone = o.tone === 'light' ? 0 : 1, stride = pts.length / n;
  c.save(); clean(c);
  const fx = +fr.x || 0, fy = +fr.y || 0, fR = +fr.r || 300;
  for (let i = 0; i < n; i++) {
    const tp = pts[Math.min(pts.length - 1, Math.floor(i * stride))], r1 = rnd(seed + 1, i), r2 = rnd(seed + 2, i), r3 = rnd(seed + 3, i), r4 = rnd(seed + 4, i);
    const rho = fR * (.18 + .82 * Math.sqrt(r1)), th0 = TAU * r2, om = (.9 + 1.5 * r3) * Math.pow(.25 + rho / fR * .75, -.6) * (r4 < .5 ? 1 : 1.25), sp = (tt, extra) => {         /* the swirl position at time tt */
      const th = th0 + om * tt * 2.2, rr = rho * (1 + .08 * Math.sin(tt * 3.1 + i) + (extra || 0));
      return [fx + Math.cos(th) * rr, fy + Math.sin(th) * rr * .78 + 10 * Math.sin(tt * 2 + th0)];
    };
    const flight = .46 + .32 * r3, dep = t0 + (t1 - t0 - flight) * Math.pow(r4, .8), u = (t - dep) / flight;
    let x, y, al = alpha * (.62 + .38 * r2), sz = size * (.62 + .7 * r3);
    if (t < dep) { const p = sp(t, 0); x = p[0]; y = p[1]; al *= .78; }
    else if (u < 1) {
      const p = sp(dep, 0), e = 1 - Math.pow(1 - u, 4), dx = tp[0] - p[0], dy = tp[1] - p[1], L = Math.hypot(dx, dy) || 1, bow = 4 * e * (1 - e) * Math.min(160, L * .22) * (r1 < .5 ? 1 : -1);      /* the bow dies as fast as the approach: a flake arrives on its point, not beside it */
      x = p[0] + dx * e - dy / L * bow; y = p[1] + dy * e + dx / L * bow; al *= .78 + .22 * u;
    } else { x = tp[0]; y = tp[1]; }
    const bi = bucketOf(sz);
    if (al < .02) continue;
    c.globalAlpha = al > 1 ? 1 : al; const half = (Math.ceil(bucketD(bi) * 2.3) + 8) / 2;
    c.drawImage(flakeSprite(tone, 0, 0, bi), Math.round(x - half), Math.round(y - half));
  }
  c.restore();
};

/* @@END@@ */
})();
