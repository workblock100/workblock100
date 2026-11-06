'use strict';
/* SHIFT HAPPENS, Episode 21, scene `closet` (THE POLICY CLOSET, 7:10 PM, 27.163 s): the DOM-free physics of the binder avalanche (builder CLOSET).
 * window.__EP21_SIMS.closet = { build, L, T, ... } and module.exports = the same. World time = scene-local time (tools_phys_events.js adds the scene start).
 *
 * THE WORLD is a flat front elevation of the corridor wall, in world px (y down, the corridor floor is FY 1250, a character is about 420 tall). The policy closet (x -40..440, top 560) holds five rows of
 * policy binders (shelf tops 1232 / 1100 / 968 / 836 / 704), each binder a box standing on its spine end, packed side by side, a few stuffed flat on top of the rows. The binders are spread over three
 * DEPTH SLABS (0 back, 1 middle, 2 front): a binder only meets binders of its own slab and its slab's floor (1238 / 1250 / 1264: the deeper the slab, the higher its floor line on the screen), so the heap has
 * depth without being impossibly tall in a 2D world. Before the pour every binder meets every binder and the shelves (the packed closet is one solid block).
 * Mr. Radish stands in front of the closet (feet x 300). He is not a body: only his FACE is, a static circle over a box (slabs 1 and 2 meet it; slab 0 passes behind him), so the pile can bury his legs and
 * body and the binders that fall on him bounce off his head, and no binder ever rests on his face. A small CROWN box on top of his head meets only the LAST binder.
 * THE SCRIPT (scene-local s): the doors burst at 5.48 (closetopen; the doors are the scene's drawing, not bodies); a beat of stillness; at 5.68 (binderavalanche) the rows let go from the bottom up
 * (5.68 .. 5.92 plus a jitter): each binder stops meeting the shelves and the other slabs and gets a shove out of the closet (outward from the closet's middle, a hop, a spin); the heap settles and sleeps.
 * One binder lies flat on the top shelf right above his head and stays there (it alone still meets the top shelf) until 7.17, when it drops: it lands flat on his crown at about 7.65 (the bonk on a beat).
 * At 8.40 (Onion: "Policy seven point four.") the binder of slab 1 or 2 whose upper end is nearest Onion's reach on the left flank of the heap, and that has the least on top of it, is pulled out of the pile by a
 * soft drag (a mouse joint on its upper end, following a scripted path to the place beside her face where she holds it up); the binders it was holding slump. meta.pluck says which one.
 * Deterministic (no Math.random, no clock; PHYS2D's own sine and cosine; seeded rng). Built once (lazily) by the scene and sampled with world.at(lt); never stepped by a render. */
(function () {
const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : (typeof window !== 'undefined' ? window.PHYS2D : null);
if (!P) return;
const sin = P.sin;

const L = {
  G: 2600, FY: 1250, seed: 2107,
  slabFloor: [1244, 1250, 1260],
  closet: { x0: -40, x1: 520, ix0: -20, ix1: 500, top: 560, itop: 580, cx: 240 },
  shelves: [1244, 1100, 968, 836, 704], shelfT: 12,
  /* Mr. Radish (A21.radish, s 1.12, x 300; buried: body centre y 1060): his face's collider is a box over the audit's face box (A21.faceBox: x 226..374, y 983..1144) with a steep roof to the top
   * of his head (942, the tuft above it) so nothing rests there; the crown box on the roof's peak meets only the LAST binder */
  radish: { x: 300, s: 1.12, cy: 1060, face: { x0: 216, x1: 384, y0: 978, y1: 1150, roof: 930, roofW: 6 }, crown: { y: 935, hw: 44, hh: 5 } },
  lastX: 300, stops: [-420, 1000],
  grab: [-110, 1160],                 /* where Onion's hand would like to reach into the heap (world); she then stands 120 px left of the chosen binder's end */
  liftDx: -10, liftY: 990,            /* where she holds it up: its upper end, 10 px left of where she found it and beside her face (within reach of her shoulder) */
};
const T = { doors: 5.48, pour: 5.68, last: 7.30, pluck: 8.40, lift: .52, run: 11.0 };
/* collision categories */
const C = { FL: [2, 4, 8], BIN: [16, 32, 64], SHELF: 128, FACE: 256, CROWN: 512, LAST: 1024, WALL: 2048 };
const ALLBIN = C.BIN[0] | C.BIN[1] | C.BIN[2] | C.LAST;
const TH = [15, 19, 24, 30, 38];            /* spine widths: 1", 1.5", 2", 3", 4" binders */
const NCOL = 8;                             /* colour slots (the scene owns the palette) */

/* the packed closet: rows of upright binders, a flat one stuffed on top of rows 0 to 3, the LAST binder lying flat on the top shelf above his head */
function layout() {
  const R = P.rng(L.seed), out = [], cl = L.closet;
  const slabOf = () => { const u = R(); return u < .3 ? 0 : (u < .65 ? 1 : 2); };
  /* a binder that sits behind his face in the picture is in the back slab: it passes behind him (it would start inside the face's collider); the bottom row under his face (the cave below his chin) is
   * short enough to clear the collider and is never in the back slab: it tumbles out over his feet and buries his legs */
  const F = L.radish.face, CAVE0 = F.x0, CAVE1 = F.x1;
  const behindFace = (x, y, hw, hh) => x + hw > F.x0 - 10 && x - hw < F.x1 + 10 && y + hh > F.roof - 10 && y - hh < F.y1 + 4;
  for (let r = 0; r < 5; r++) {
    const y0 = L.shelves[r], gaps = r === 4 ? [[cl.ix0 + 1.5, L.lastX - 47], [L.lastX + 47, cl.ix1 - 1.5]] : (r === 0 ? [[cl.ix0 + 1.5, CAVE0 - 1], [CAVE1 + 1, cl.ix1 - 1.5]] : [[cl.ix0 + 1.5, cl.ix1 - 1.5]]);
    if (r === 0) {        /* the cave under his chin: a stack of binders lying flat on the closet floor, short ones standing either side (they clear the face's collider) */
      let y = y0;
      for (let k = 0; k < 3; k++) { const th = [26, 24, 22][k]; out.push({ row: 0, kind: 'flat', x: L.radish.x + [0, -4, 5][k], y: y - th / 2 - .2, hw: th / 2, hh: 44, ang: Math.PI / 2, slab: 1 + Math.floor(R() * 2), cave: 'stack', col: Math.floor(R() * NCOL), lbl: R() }); y -= th + .4; }
      for (const [a, b] of [[CAVE0, L.radish.x - 46], [L.radish.x + 46, CAVE1]]) { let x = a + 1; for (;;) { const th = [30, 24, 19, 15].find(v => x + v <= b - 1); if (!th) break; const h = 78 + Math.floor(R() * 3) * 2; out.push({ row: 0, kind: 'up', x: x + th / 2, y: y0 - h / 2 - .2, hw: th / 2, hh: h / 2, ang: 0, slab: 1 + Math.floor(R() * 2), cave: 'side', col: Math.floor(R() * NCOL), lbl: R() }); x += th + 1; } }
    }
    let rowTop = 0;
    for (const [a, b] of gaps) {
      let x = a;
      for (;;) {
        const i0 = Math.floor(R() * 5); let th = 0;
        for (let j = 0; j < 5 && !th; j++) { const v = TH[(i0 + j) % 5]; if (x + v <= b) th = v; }
        if (!th) break;
        const cx = x + th / 2, h = 84 + Math.floor(R() * 5) * 2, cy = y0 - h / 2 - .2;
        out.push({ row: r, kind: 'up', x: cx, y: cy, hw: th / 2, hh: h / 2, ang: 0, slab: behindFace(cx, cy, th / 2, h / 2) ? 0 : slabOf(), col: Math.floor(R() * NCOL), lbl: R() });
        rowTop = Math.max(rowTop, h);
        x += th + .7 + R() * 1.3;
      }
    }
    if (r < 4) {          /* a binder stuffed flat across the tops of the row */
      const th = TH[Math.floor(R() * 3)], h = 88, x = cl.ix0 + 60 + R() * (cl.ix1 - cl.ix0 - 120);
      const y = y0 - rowTop - th / 2 - .6;     /* on the tallest spines of the row, clear of the shelf above (the board is 12 thick, the rows 132 apart) */
      out.push({ row: r, kind: 'flat', x, y, hw: th / 2, hh: h / 2, ang: Math.PI / 2, slab: behindFace(x, y, h / 2, th / 2) ? 0 : slabOf(), col: Math.floor(R() * NCOL), lbl: R() });
    } else {              /* the last binder: flat on the top shelf, right above his head */
      out.push({ row: r, kind: 'last', x: L.lastX, y: y0 - 13 - .2, hw: 13, hh: 44, ang: Math.PI / 2, slab: 1, col: 1, lbl: R() });
    }
  }
  return out;
}

/* remove the live contacts of body b that its new mask no longer allows (a mask is only read when a contact is created) */
function refilter(W, b) {
  const cs = W.contacts;
  for (let k = cs.length - 1; k >= 0; k--) {
    const c = cs[k];
    if ((c.A === b || c.B === b) && !W._should(c.A, c.B)) { if (c.count > 0) { c.A.wake(); c.B.wake(); } W._cmap.delete(c.key); W._pool.push(c); cs.splice(k, 1); }
  }
}

function build(opts) {
  opts = opts || {};
  const W = P.world({ gravity: [0, L.G], seed: 21, dt: 1 / 240, materials: { plastic: { density: 1, friction: .6, restitution: .16 } }, feel: { bounce: 1.15, soft: 0 },
    sleepLin: .09, sleepAng: .16, timeToSleep: .3, velIters: 8, ...(opts.wopt || {}) });
  const meta = { L, T, C, binders: [], by: {}, ids: {}, pluck: null };
  const cl = L.closet;

  /* ---- the floors of the three slabs, the closet (its floor plinth, four shelves, two side walls), Radish's face and crown */
  for (let k = 0; k < 3; k++) W.floor(L.slabFloor[k], { x: 200, halfWidth: 4000, mat: 'concrete', tag: 'floor', friction: .7, restitution: .06, category: C.FL[k], mask: C.BIN[k] | (k === 1 ? C.LAST : 0) });
  const shelfBody = (y, hh, tag) => W.body({ type: 'static', x: cl.cx, y, box: [(cl.ix1 - cl.ix0) / 2 + 20, hh], mat: 'wood', tag, friction: .5, restitution: .1, category: C.SHELF, mask: ALLBIN });
  shelfBody(L.shelves[0] + 3, 3, 'shelf');
  for (let r = 1; r < 5; r++) shelfBody(L.shelves[r] + L.shelfT / 2, L.shelfT / 2, 'shelf');
  for (const x of [cl.ix0 - 10, cl.ix1 + 10]) W.body({ type: 'static', x, y: (cl.itop + L.FY) / 2, box: [10, (L.FY - cl.itop) / 2], mat: 'wood', tag: 'shelf', category: C.SHELF, mask: ALLBIN });
  /* two stops far outside the avalanche's frame (the camera sees about x -270..750 then): a binder that skids that far stops there, out of sight */
  for (const x of [L.stops[0] - 40, L.stops[1] + 40]) W.body({ type: 'static', x, y: L.FY - 300, box: [40, 400], mat: 'concrete', tag: 'wall', friction: .6, restitution: .05, category: C.WALL, mask: C.BIN[0] | C.BIN[1] | C.BIN[2], silent: true });
  const F = L.radish.face, Cr = L.radish.crown, fx = (F.x0 + F.x1) / 2, fhw = (F.x1 - F.x0) / 2;
  const face = W.body({ type: 'static', x: fx, y: F.y0, shapes: [
    { box: [fhw, (F.y1 - F.y0) / 2], offset: [0, (F.y1 - F.y0) / 2], mat: 'rubber', friction: .2, restitution: .1 },
    { poly: [[-fhw, 0], [-F.roofW, F.roof - F.y0], [F.roofW, F.roof - F.y0], [fhw, 0]], mat: 'rubber', friction: .2, restitution: .1 },
  ], mat: 'rubber', tag: 'head', category: C.FACE, mask: C.BIN[1] | C.BIN[2] });
  const crown = W.body({ type: 'static', x: fx, y: Cr.y, box: [Cr.hw, Cr.hh], mat: 'rubber', tag: 'head', friction: .9, restitution: .12, category: C.CROWN, mask: C.LAST });
  meta.ids.face = face.id; meta.ids.crown = crown.id;

  /* ---- the binders */
  const R = P.rng(L.seed * 7 + 3);
  const maskAfter = k => C.FL[k] | C.BIN[k] | C.WALL | (k >= 1 ? C.FACE | C.LAST : 0);
  for (const d of layout()) {
    const isLast = d.kind === 'last';
    const b = W.body({ type: 'dynamic', x: d.x, y: d.y, angle: d.ang, box: [d.hw, d.hh], mat: 'plastic', tag: 'binder', density: 1, friction: d.slab === 0 ? .85 : .6, restitution: .16,
      category: isLast ? C.LAST : C.BIN[d.slab], mask: C.SHELF | ALLBIN, angularDamping: 1.1, linearDamping: .15, data: d });
    const info = Object.assign({ id: b.id }, d);
    meta.binders.push(info); meta.by[b.id] = info;
    if (isLast) { meta.ids.last = b.id; info.tRel = T.last; continue; }
    /* the release: bottom rows first; the shove points out of the closet's middle, harder for the slabs nearer the camera */
    const tr = T.pour + .036 * d.row + .04 * R(), u = (d.x - L.radish.x) / 220, out = [.7, .8, 1.0][d.slab];
    let vx = Math.max(-230, Math.min(230, out * (u * 120 + 10) + (R() - .5) * 50)), vy = -(d.row === 0 ? 40 + 50 * R() : 20 + 50 * R()), w = (R() - .5) * 10 + u * 3 * out;
    if (d.cave === 'stack') { vx = (R() - .5) * 24; vy = -10; w = 0; }                                     /* the flat stack slides out a little and stays: his legs are buried */
    if (d.cave === 'side') { vx = (d.x < L.radish.x ? -1 : 1) * (10 + 20 * R()); vy = -15; w = (d.x < L.radish.x ? 1 : -1) * (3 + 3 * R()); }   /* the short ones either side fall in over his feet */
    info.tRel = tr;
    W.schedule(tr, () => { b.mask = maskAfter(d.slab); refilter(W, b); b.wake(); b.vx = vx; b.vy = vy; b.w = w; });
  }
  /* the last binder drops straight down onto his crown */
  W.schedule(T.last, () => { const b = W.bodies[meta.ids.last]; b.mask = C.CROWN | C.FL[1] | C.BIN[1] | C.BIN[2]; refilter(W, b); b.wake(); b.vx = 0; b.vy = 30; b.w = 0; });

  /* ---- the pluck: at T.pluck choose the binder (slab 1 or 2, at least 2" thick) whose upper end is nearest Onion's reach and that holds the least, and drag it out by that end */
  W.schedule(T.pluck, () => {
    let best = null, bs = 1e9;
    for (const info of meta.binders) {
      if (info.kind === 'last' || info.slab < 1 || info.hw < 11) continue;
      const b = W.bodies[info.id], s = b.sn, c = b.cs;
      const ex = -s * -info.hh, ey = c * -info.hh;             /* the end at local (0, -hh) */
      const up = ey <= 0 ? [b.x + ex, b.y + ey, -info.hh] : [b.x - ex, b.y - ey, info.hh];
      let load = 0;
      for (const ct of W.contacts) { if (ct.count === 0) continue; const o = ct.A === b ? ct.B : (ct.B === b ? ct.A : null); if (o && o.type === P.DYNAMIC && o.cy < b.cy - 8) load++; }
      const sc = Math.hypot(up[0] - L.grab[0], up[1] - L.grab[1]) + 120 * load + (up[0] < -210 || up[0] > -20 || up[1] > 1215 || up[1] < 1040 ? 600 : 0);
      if (sc < bs) { bs = sc; best = { info, b, up }; }
    }
    if (!best) return;
    const g0 = [best.up[0], best.up[1]], lift = [g0[0] + L.liftDx, L.liftY], t0 = T.pluck, dur = T.lift;
    const target = t => {
      const u = Math.max(0, Math.min(1, (t - t0) / dur)), e = u * u * (3 - 2 * u);
      return [g0[0] + (lift[0] - g0[0]) * e, g0[1] + (lift[1] - g0[1]) * e - 70 * sin(Math.PI * Math.min(1, u * 1.15))];
    };
    const s0 = W._started; W._started = false;
    W.joint({ type: 'mouse', b: best.b, anchorB: [0, best.up[2]], target, hz: 5.5, ratio: .95, maxForce: best.b.mass * 60000 });
    W._started = s0;
    best.b.wake(); best.b.angDamp = 9;
    const pb = best.b, slab = best.info.slab;
    W.schedule(t0 + .32, () => { pb.mask = C.FL[slab]; refilter(W, pb); });          /* once it is out of the pile it meets nothing but the floor: the heap can sleep */
    W.schedule(t0 + dur, () => { pb.angDamp = 14; pb.linDamp = 5; });                 /* held: it hangs still from her hand */
    meta.pluck = { id: best.b.id, t0, dur, end: best.up[2], g0, lift, score: bs, onionX: g0[0] - 120 };
  });

  W.warmup(opts.warm || 1.0);
  W.run(opts.T || T.run, { sampleHz: 120 });
  return { world: W, T: W.T, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 240, y: 1000, z: 1.05 } }, maxEvents: 140, meta };
}
const api = { build, L, T, C, layout };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP21_SIMS = window.__EP21_SIMS || {}; window.__EP21_SIMS.closet = api; }
})();
