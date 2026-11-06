'use strict';
/* SHIFT HAPPENS, Episode 22, scene `swap` (THE EXCHANGE, 9:00 PM, 26.888 s): the DOM-free soft-body physics of THE RIP (builder STATION). SOFT2D.
 * window.__EP22_SIMS.swapRip = { build, GIFTS, T } and module.exports = the same. World time = scene-local time (tools_phys_events.js adds the scene start).
 *
 * THE WORLD is the flat front elevation of the nurses' station in scene px (y down). Five of the staff hold a wrapped gift in front of them (blocking A of ep22_station.js: x, scale, kind below; the
 * gift's front is the rectangle the scene's held prop draws, computed here from the same numbers). The paper on each front is a SOFT2D cloth (paper, 13 x 10), glued at its border (pins that hold it where
 * it is) with no gravity until its rip. On its cue each paper is unzipped along two jagged vertical rip paths into three strips, the top edge of each strip is pulled away (the side strips outward and
 * down, the middle one down: they peel off hinged at the bottom), the paper may tear further where it is pulled (tear strain 1.7, jag .35: ragged white edges), then everything lets go and the pieces
 * flutter down to the floor and settle there (the floor line is just in front of their feet). Cues (paperrip): Lemon 2.976, Mango 3.126, Onion 3.276, Strawberry 3.426; Tomato's ribbon zips off at 3.776
 * (drawn by the scene) and her paper crinkles off at 4.176 (crinkle 4.276). Deterministic (no Math.random, no clock; SOFT2D's own rng). Built once (lazily) by the scene and sampled with world.at(lt);
 * never stepped by a render. Test: build/ep22_station/rip_test.js. */
(function () {
const getS = () => (typeof window !== 'undefined' && window.SOFT2D) || (typeof module === 'object' && module.exports ? require('./soft2d.js') : null);
/* the kinds' numbers (engine.js / ep15_art.js / ep5_art.js KINDS: leg, ry, mouthY, mw) and blocking A (ep22_station.js XA, SSC, SFL) */
const KD = { tom: [84, 106, 22, 25], lemon: [90, 140, 30, 26], mango: [86, 118, 34, 26], onion: [78, 124, 40, 20], straw: [92, 132, 14, 26] };
const XA = { straw: 400, tom: 640, lemon: 860, mango: 1080, onion: 1300 }, SC = { straw: .86, tom: .88, lemon: .84, mango: .86, onion: .84 }, SFL = 1280;
const T = { lemon: 2.976, mango: 3.126, onion: 3.276, straw: 3.426, tom: 4.176, run: 8.0 };
/* the gift's front rectangle (world) as the scene's giftHold draws it: local top = face-box bottom + 6 (+22 for Tomato's big bow), w x h */
function rectOf(n) {
  const [leg, ry, mouthY, mw] = KD[n], s = SC[n], big = n === 'tom', w = big ? 150 : 128, h = big ? 106 : 96;
  const fb = mouthY + 55 * mw / 26, top = fb + 6 + (big ? 22 : 0), cy = SFL - (leg + ry * .9) * s;
  return { n, x0: XA[n] - w / 2 * s, y0: cy + top * s, w: w * s, h: h * s, s };
}
const GIFTS = ['lemon', 'mango', 'onion', 'straw', 'tom'].map(rectOf);
function build(opts) {
  opts = opts || {};
  const S = getS(); if (!S || typeof S.world !== 'function') throw new Error('ep22_swap_sim: SOFT2D is not loaded');
  const w = S.world({ gravity: [0, 1500], dt: 1 / 240, iterations: 12, seed: 22, damping: .02 });
  w.collider({ floor: SFL + 8, mat: 'wood', tag: 'floor', friction: .7 });
  const meta = { gifts: [] };
  const COLS = 13, ROWS = 10;
  for (const g of GIFTS) {
    const t0 = T[g.n];
    const pins = [];
    for (let i = 0; i < COLS; i++) { pins.push({ i, j: 0 }); pins.push({ i, j: ROWS - 1 }); }
    for (let j = 1; j < ROWS - 1; j++) { pins.push({ i: 0, j }); pins.push({ i: COLS - 1, j }); }
    const c = w.cloth({ x: g.x0, y: g.y0, width: g.w, height: g.h, cols: COLS, rows: ROWS, mat: 'paper', tag: 'wrap', gravityScale: 0, pins, tear: { strain: 1.7, jag: .35, seed: g.n.length },
      collide: true, friction: .5 });
    meta.gifts.push({ n: g.n, id: c.id, t0, rect: g });
    /* the rip: two jagged vertical tears (the first from the top, the second a beat later), then the strips are pulled off */
    w.rip(c.id, { path: [[.36, 0], [.31, .35], [.38, .7], [.33, 1]], t0, t1: t0 + .12, jag: .4 });
    w.rip(c.id, { path: [[.66, 0], [.71, .4], [.64, .75], [.69, 1]], t0: t0 + .03, t1: t0 + .16, jag: .4 });
    const s = g.s, pull = (dx, dy, dz) => (p0, a, b) => t => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))), e = u * u * (3 - 2 * u); return [p0[0] + dx * e, p0[1] + dy * e - 26 * s * Math.sin(Math.PI * e), (p0[2] || 0) + dz * e]; };
    const leftPull = pull(-120 * s, 70 * s, 30), midPull = pull(8 * s, 120 * s, 60), rightPull = pull(120 * s, 70 * s, 30);
    w.schedule(t0, W => {
      W.set(c.id, { gravityScale: 1 });
      const o = W.object(c.id);
      for (let i = 0; i < COLS; i++) {
        const k = c.index(i, 0), p0 = [W.x[o.p0 + k], W.y[o.p0 + k], W.z ? W.z[o.p0 + k] : 0], u = i / (COLS - 1);
        W.unpin(c.id, k);
        const f = u < .33 ? leftPull : u > .67 ? rightPull : midPull, d = u < .33 ? 0 : u > .67 ? .02 : .05;
        W.pin(c.id, k, f(p0, t0 + d, t0 + d + .24), { until: t0 + d + .26 });
      }
      for (let j = 1; j < ROWS - 1; j++) { W.unpin(c.id, c.index(0, j)); W.unpin(c.id, c.index(COLS - 1, j)); }
    });
    w.schedule(t0 + .34, W => { W.release(c.id); });
  }
  w.warmup(opts.warm || .05);
  w.run(opts.T || T.run, { sampleHz: 120 });
  return { world: w, T: T.run, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 850, y: 1110, z: .92 } }, maxEvents: 80, meta };
}
const api = { build, GIFTS, T };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP22_SIMS = window.__EP22_SIMS || {}; window.__EP22_SIMS.swapRip = api; }
})();
