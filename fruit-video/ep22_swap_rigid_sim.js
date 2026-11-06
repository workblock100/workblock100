'use strict';
/* SHIFT HAPPENS, Episode 22, scene `swap` (THE EXCHANGE, 9:00 PM, 26.888 s): the DOM-free rigid-body physics of THE PILE (builder STATION). PHYS2D.
 * window.__EP22_SIMS.swapPile = { build, L, T, GIFTS } and module.exports = the same. World time = scene-local time (tools_phys_events.js adds the scene start).
 *
 * THE WORLD is the flat front elevation of the nurses' station in scene px (y down). Strawberry stands at x L.SX with her feet on L.FY (scale .9). She is not a body: her HEAD is a static rubber box over the
 * audit's face box with a steep roof to the top of her head (nothing can rest on her face), her BODY below it a static box. The gifts are tossed in by the staff from both sides (off the frame) between
 * 15.11 and 15.87 (giftpile 15.61: the first lands), in two DEPTH SLABS: the side slab (1) meets the floor, her head and body and the other side gifts, so they heap up against her sides to her ears; the
 * front slab (2) meets only its own floor line (a little nearer the camera) and the other front gifts: three low boxes slide in at floor level and cover her legs and her lower body, never above her chin.
 * At 16.19 the BIG gift drops from above onto a small crown box on the top of her head (it alone meets it) and lands at 16.61 (giftthump): her face shows between the heaps, a gift on her head, one
 * arm free above the right heap (the mug she holds up later clears the gift on her head).
 * Every gift waits, parked where it is thrown from, with no gravity and no collisions until its toss. Deterministic (no Math.random, no clock; PHYS2D's own rng). Built once (lazily) by the scene and
 * sampled with world.at(lt); never stepped by a render. Tools: build/ep22_station/pile_test.js (report, face clearance, determinism).
 */
(function () {
const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : (typeof window !== 'undefined' ? window.PHYS2D : null);
if (!P) return;
/* Strawberry (A11.straw, s .9): body centre BY = FY - (92 + 132 * .9) * .9; face box x SX +- 64, y BY - 75 .. BY + 63 (v2_char's face box at s .9) */
const L = { G: 2600, SX: 400, FY: 1324, S: .9, slabFloor: [0, 1324, 1340] };
L.BY = L.FY - (92 + 132 * .9) * L.S;
L.face = { x0: L.SX - 70, x1: L.SX + 70, y0: L.BY - 82, y1: L.BY + 66, roof: L.FY - 362 };
L.body = { x0: L.SX - 104, x1: L.SX + 104, y0: L.BY + 66, y1: L.FY - 74 };
const T = { toss0: 15.50, thump: 16.61, run: 18.6 };
/* the gifts: [w, h, slab, side (-1 thrown from the left, +1 from the right, 0 dropped from above), toss time, target x, target y (the centre where it should come to rest), spin, palette index].
 * The side slab heaps in two mounds against her sides (base row, then up); the front slab slides in along the floor; the big one drops onto her crown. The build aims every throw at its target. */
const SX = L.SX, FY = L.FY, BX = 104;
const GIFTS = [
  [150, 112, 1, -1, 15.11, SX - BX - 75, FY - 56, 1.0, 0], [144, 120, 1, 1, 15.17, SX + BX + 72, FY - 60, -1.0, 1],
  [112, 84, 1, -1, 15.26, SX - BX - 150 - 60, FY - 42, -1.4, 2], [118, 90, 1, 1, 15.33, SX + BX + 144 + 63, FY - 45, 1.2, 3],
  [126, 92, 1, -1, 15.44, SX - 70 - 63, FY - 112 - 46, -1.2, 4], [132, 100, 1, 1, 15.51, SX + 70 + 66, FY - 120 - 50, 1.0, 5],
  [104, 74, 1, -1, 15.62, SX - 70 - 52, FY - 204 - 37, 1.4, 6], [100, 80, 1, 1, 15.69, SX + BX + 144 + 63, FY - 90 - 40, -1.2, 7],
  [92, 70, 1, -1, 15.80, SX - BX - 150 - 60, FY - 84 - 35, 1.6, 8], [92, 64, 1, 1, 15.87, SX + BX + 144 + 63, FY - 170 - 32, -1.6, 9],
  [176, 128, 2, -1, 15.42, SX - 84, FY + 16 - 64, 0, 10], [164, 124, 2, 1, 15.52, SX + 92, FY + 16 - 62, 0, 11],
  [96, 62, 1, -1, 15.98, SX - 70 - 48, FY - 278 - 31, 1.2, 13],
  [150, 112, 3, 0, 16.19, SX - 12, 0, 0, 12],
];
const TAU_SIDE = .5;
const C = { FL1: 2, FL2: 4, SIDE: 8, FRONT: 16, HEAD: 32, CROWN: 64, BIG: 128, WALL: 256 };
function build(opts) {
  opts = opts || {};
  const W = P.world({ gravity: [0, L.G], seed: 22, dt: 1 / 240, materials: { cardboard: { density: 1, friction: .7, restitution: .14 } }, feel: { bounce: 1.1, soft: 0 },
    sleepLin: .09, sleepAng: .16, timeToSleep: .3, velIters: 8, ...(opts.wopt || {}) });
  const meta = { L, T, C, gifts: [], ids: {} };
  /* the floors of the two slabs; walls far out of the frame */
  W.floor(L.slabFloor[1], { x: L.SX, halfWidth: 3000, mat: 'wood', tag: 'floor', friction: .8, restitution: .05, category: C.FL1, mask: C.SIDE | C.BIG });
  W.floor(L.slabFloor[2], { x: L.SX, halfWidth: 3000, mat: 'wood', tag: 'floor', friction: .8, restitution: .05, category: C.FL2, mask: C.FRONT });
  for (const x of [L.SX - 980, L.SX + 980]) W.body({ type: 'static', x, y: L.FY - 400, box: [40, 600], mat: 'wood', tag: 'wall', category: C.WALL, mask: C.SIDE | C.FRONT, silent: true });
  /* her head (the face box, a steep roof to the crown) and her body: the side gifts heap against them */
  const F = L.face, fx = (F.x0 + F.x1) / 2, fhw = (F.x1 - F.x0) / 2;
  const head = W.body({ type: 'static', x: fx, y: F.y0, shapes: [
    { box: [fhw, (F.y1 - F.y0) / 2], offset: [0, (F.y1 - F.y0) / 2], mat: 'fabric', friction: .25, restitution: .1 },
    { poly: [[-fhw, 0], [-6, F.roof - F.y0], [6, F.roof - F.y0], [fhw, 0]], mat: 'fabric', friction: .25, restitution: .1 },
  ], mat: 'fabric', tag: 'head', category: C.HEAD, mask: C.SIDE });
  const B = L.body;
  const body = W.body({ type: 'static', x: (B.x0 + B.x1) / 2, y: (B.y0 + B.y1) / 2, box: [(B.x1 - B.x0) / 2, (B.y1 - B.y0) / 2], mat: 'fabric', tag: 'nurse', friction: .6, restitution: .05, category: C.HEAD, mask: C.SIDE });
  const crown = W.body({ type: 'static', x: fx - 12, y: F.roof + 4, box: [40, 4], mat: 'fabric', tag: 'head', friction: .9, restitution: .08, category: C.CROWN, mask: C.BIG });
  meta.ids.head = head.id; meta.ids.body = body.id; meta.ids.crown = crown.id;
  const maskOf = slab => slab === 2 ? C.FL2 | C.FRONT | C.WALL : slab === 3 ? C.CROWN : C.FL1 | C.SIDE | C.HEAD | C.WALL;
  const catOf = slab => slab === 2 ? C.FRONT : slab === 3 ? C.BIG : C.SIDE;
  const G = L.G;
  GIFTS.forEach(([w, h, slab, side, t0, xt, yt, spin, pal], i) => {
    /* the throw starts outside the frame on its side, high; the front slab slides in low along its floor; the big one falls from above onto the crown */
    let x0, y0, vx, vy;
    if (slab === 3) { x0 = xt; yt = F.roof - h / 2; y0 = yt - 340; vy = 260; vx = 0; }
    else if (slab === 2) { x0 = L.SX + side * 560; y0 = yt; const d = xt - x0; vx = 6.2 * d; vy = 0; }      /* shoved in: it slides to a stop (damping and friction) in front of her */
    else { x0 = L.SX + side * 560; y0 = L.FY - 560 - 30 * (i % 3); const tau = TAU_SIDE + .03 * (i % 4); vx = (xt - x0) / tau; vy = (yt - y0 - .5 * G * tau * tau) / tau; }
    const b = W.body({ type: 'dynamic', x: x0, y: y0, angle: 0, box: [w / 2, h / 2], mat: 'cardboard', tag: slab === 3 ? 'biggift' : 'gift', density: slab === 3 ? 1.4 : 1, friction: slab === 2 ? .2 : .85, restitution: .06,
      category: catOf(slab), mask: 0, gravityScale: 0, angularDamping: 2.2, linearDamping: slab === 2 ? 4.8 : .05, fixedRotation: slab >= 2 });
    const info = { id: b.id, i, w, h, slab, side, t0, pal, xt, yt };
    meta.gifts.push(info);
    W.schedule(t0, () => { b.gscale = 1; b.mask = maskOf(slab); b.setVelocity(vx, vy, slab >= 2 ? 0 : spin); });
  });
  W.warmup(opts.warm || .2);
  W.run(opts.T || T.run, { sampleHz: 120 });
  return { world: W, T: W.T, screen: { w: 1080, h: 1920, cx: 540, cam: { x: L.SX, y: L.FY - 260, z: 1.15 } }, maxEvents: 90, meta };
}
const api = { build, L, T, C, GIFTS };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP22_SIMS = window.__EP22_SIMS || {}; window.__EP22_SIMS.swapPile = api; }
})();
