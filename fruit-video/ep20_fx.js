'use strict';
/* SHIFT HAPPENS, Episode 20: The Snow Day. The weather and light kit: `window.SN20` (snow and cold) and `window.L20` (light). Owner: the WX builder. Contract: /tmp/shift_tools/briefs/WX20_API.md; usage, costs and
 * traps: GUIDE_WX20.md in this folder. Built on FX18 (ep18_fx.js loads first): FX18.rnd, FX18.noise, FX18.sprite, FX18.cone, FX18.glow.
 *
 * Every function is `SN20.name(c, o)` / `L20.name(c, o)` with `c` the 2D context to draw into (scenes pass `ctx`) and `o` an options object. WORLD functions draw in the transform you already have; SCREEN
 * functions (L20.emergency) reset it. All of them are PURE functions of their arguments and `t` (scene-local seconds): no Math.random, no Date, no state, so every worker renders the same frame, in any order.
 * Randomness only from FX18.rnd. Each call saves and restores the context state. Soft shapes come from cached sprites.
 *
 * AS BUILT (additions to the contract are marked [added])
 *   clock         SN20.SCENE_CLOCK, depthAt(clockMinutes), wind(t, gusts), windInt(t, gusts) [px], GUST(t, gusts) [added]
 *   snow          SN20.snow {x0, y0, x1, y1, t, seed, layers, density, fall, wind, gusts, sway, size, alpha, tone, fore, slice, clip [added]}
 *   light         L20.pass {ambient, tint, lights, bloom, grade, vignette, lift, t [added], glow [added]}; light kinds point / cone / rect / strip
 *   (batches 2 and 3 are listed here as they land: frost sill bank cap beam breath | spray flurry emergency lamps settle maskPoints)
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
      c.drawImage(flakeSprite(tone, shape, soft, bi), x - half, y - half);
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
  const dk = mk(cw, ch), lc = mk(cw, ch);
  return PASS = { cw, ch, dk, dkc: dk.getContext('2d'), lc, lcc: lc.getContext('2d') };
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
L20.pass = function pass(c, o = {}) {
  const cv = c.canvas, w = cv.width, h = cv.height;
  if (!(w > 8) || !(h > 8)) return 0;
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
  if (D > .004 || vig > .004) {                                                                   /* the darkness */
    dkc.setTransform(1, 0, 0, 1, 0, 0); dkc.globalCompositeOperation = 'source-over'; dkc.globalAlpha = 1; dkc.clearRect(0, 0, P.cw, P.ch);
    if (D > .004) {
      dkc.fillStyle = rgba(tint, D); dkc.fillRect(0, 0, P.cw, P.ch);
      if (n) { dkc.globalCompositeOperation = 'destination-out'; dkc.drawImage(P.lc, 0, 0); dkc.globalCompositeOperation = 'source-over'; }
    }
    if (vig > .004) { dkc.globalAlpha = vig; dkc.drawImage(vigSprite(tint, P.cw, P.ch), 0, 0); dkc.globalAlpha = 1; }
    c.drawImage(P.dk, 0, 0, P.cw, P.ch, 0, 0, P.cw * DS, P.ch * DS);
  }
  if (n && glowAmt > .004) {                                                                      /* the lights' own colour, over their bounding box only */
    const X0 = Math.max(0, Math.floor(sx0 / DS)) * DS, Y0 = Math.max(0, Math.floor(sy0 / DS)) * DS, X1 = Math.min(P.cw, Math.ceil(sx1 / DS)) * DS, Y1 = Math.min(P.ch, Math.ceil(sy1 / DS)) * DS;
    if (X1 > X0 && Y1 > Y0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = glowAmt; c.drawImage(P.lc, X0 / DS, Y0 / DS, (X1 - X0) / DS, (Y1 - Y0) / DS, X0, Y0, X1 - X0, Y1 - Y0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  }
  if (bloomA > .01) {                                                                             /* bloom on the cores of points and cone lenses */
    for (const [l, pw] of live) {
      const kind = l.kind || 'point', X = M.a * (+l.x || 0) + M.c * (+l.y || 0) + M.e, Y = M.b * (+l.x || 0) + M.d * (+l.y || 0) + M.f, col = l.color || '#fff1d6';
      if (kind === 'point') FX.glow(c, { x: X, y: Y, r: Math.max(16, Math.min(150, (+l.r || 200) * zoom * .3)), color: col, alpha: bloomA * .8 * Math.min(1.2, pw), core: .6 });
      else if (kind === 'cone') FX.glow(c, { x: X, y: Y, r: Math.max(14, Math.min(70, (+l.len || 700) * zoom * .07)), color: col, alpha: bloomA * .75 * Math.min(1.2, pw), core: .85 });
    }
  }
  const gr = o.grade;
  if (gr && gr.alpha > .004) { c.globalCompositeOperation = gr.mode || 'source-over'; c.globalAlpha = clamp01(gr.alpha); c.fillStyle = gr.color || '#000'; c.fillRect(0, 0, w, h); }
  c.restore();
  return n;
};

/* @@END@@ */
})();
