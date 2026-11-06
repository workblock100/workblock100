'use strict';
/* SHIFT HAPPENS, Episode 22, scene `wrap` (THE WRAPPING, 6:00 PM, 26.234 s): the DOM-free soft bodies of the scene (builder WRAP), and the layout, cue times and hand paths the picture shares with them.
 * window.__EP22_SIMS.wrap = { build, L, T, HAND, BAL } and module.exports = the same. World time = scene-local time (tools_phys_events.js adds the scene start).
 *
 * TWO REGIONS in one SOFT2D world (they never meet):
 *  INSERT (the cart top in close-up, 3.26 to 9.26): insert px (the insert is drawn at zoom 1 on screen: x 0..1080) shifted down by L.INS.dy (3000) so nothing meets the hall's bodies. The pudding's
 *    box on the cart top, the blue Chux dropped over it (cloth, mat chux), the two strips of paper tape (ropes, mat tape) pulled off the roll and pressed down on the folds.
 *  HALL (the flat elevation of the hall, floor L.FY 1250, ceiling L.CEIL 400): the glove she blows up for the bow (a balloon, outline 'glove', pinned to her hand, then set on the gift), and the dozen glove
 *    balloons that float up and bump along the ceiling (balloons with buoyancy, a ceiling collider, softCollide between them when the library has it).
 * The hand paths (HAND) are pure functions of time made of smoothstep keys only (no trig): the scene draws Strawberry's hands on them and the sim pins the cloth, the tape and the gloves to them.
 * Built once (lazily) by the scene and sampled with world.at(lt); never stepped by a render. Until SOFT2D has landed, build() returns null and the scene draws its hand-animated stand-ins. */
(function () {
const SOFT2D = (typeof window !== 'undefined' && window.SOFT2D) || (typeof module === 'object' && module.exports ? (() => { try { return require('./soft2d.js'); } catch (e) { return null; } })() : null);

/* ------------------------------------------------------------------ the timeline of the scene (scene-local seconds; cues as in `python3 /tmp/shift_tools/cues.py 22 wrap`, snapped to frames by the scene) */
const T = {
  wrap: 3.262, rustle: 3.462, drop: 3.96, fold1: 4.462, fold2: 5.162, tape1: 5.862, tape2: 6.462, snap: 7.262, inflate: 7.562, squeak: 8.662, wrapEnd: 9.262,
  labelgun: 14.939, bal: 19.117, inf1: 19.217, inf2: 19.617, squeak2: 20.317, bonk: 20.917, balEnd: 21.517, sting: 24.884, dur: 26.234,
};

/* ------------------------------------------------------------------ the layout */
const L = {
  /* the hall (world px, y down) */
  FY: 1250, CEIL: 400,
  cart: { x0: 330, x1: 630, top: 1100 },                                  /* the med cart, against the wall (its top at hip height); Strawberry stands at its right end */
  gift: { cx: 470, w: 170, bottom: 1100 },                                /* the pudding's box on the cart top: the insert's box (312 wide) scaled by w / 312: front 1000..1100, top face 940..1000 */
  pos: { straw: 650, straw0: 730, mango: 185, onion: 230, pear: 1020 },
  doors: [{ x0: 10, x1: 250, room: 2 }, { x0: 900, x1: 1140, room: 3 }], doorTop: 770,
  /* the insert (insert px at zoom 1; the sim adds INS.dy) */
  INS: { dy: 3000, cartBack: 868, cartFront: 1236, boxX0: 384, boxX1: 696, boxTop: 902, boxFront: 1012, boxBottom: 1196, roll: [196, 1150], gbox: [900, 1120] },
  chux: { w: 720, h: 600, cols: 24, rows: 20 },
};

/* ------------------------------------------------------------------ keyframe paths (smoothstep between keys; no trig, so the solver can call them) */
const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const sm = k => k * k * (3 - 2 * k);
function keys(K, t) {                                                     /* K = [[t, x, y], ...] (or [t, v]): the value at t */
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const a = K[i - 1], b = K[i], k = sm(c01((t - a[0]) / (b[0] - a[0]))); return a.slice(1).map((v, j) => v + (b[j + 1] - v) * k); }
  return K[K.length - 1].slice(1);
}

/* Strawberry's two hands in the INSERT (insert px; the left arm comes in from the upper left, the right arm from the upper right, as an insert over the cart top). [t, x, y]; the pose: HAND.pose(side, t).
 * The pad is held by the corners of its far edge (3.20-3.96): brought in bunched, shaken out (chuxrustle 3.46), lowered over the box and let go (3.96). Fold 1 (chuxfold 4.46): the left hand takes the left
 * skirt's outer corner in over the front face; fold 2 (5.16) the right hand the right one. Tape (tapepull 5.86 / 6.46): the left hand pinches the end on the roll (left of the box), pulls a strip out,
 * the roll's teeth tear it, she lays it across the edge of a fold and the right hand presses it along. */
const HK = {
  L: [[3.20, 370, 300], [3.40, 372, 470], [3.47, 374, 474], [3.56, 186, 520], [3.62, 190, 500], [3.74, 192, 760], [3.96, 196, 884], [4.08, 214, 820], [4.30, 250, 760], [4.40, 296, 1140], [4.46, 300, 1150],
      [4.74, 528, 1150], [4.86, 528, 1150], [5.00, 230, 780], [5.70, 230, 780], [5.82, 214, 1104], [5.86, 216, 1108], [5.98, 330, 1010], [6.02, 340, 1002], [6.16, 522, 1060], [6.26, 522, 1060],
      [6.38, 240, 1060], [6.42, 214, 1104], [6.462, 216, 1108], [6.58, 330, 1010], [6.60, 342, 1004], [6.72, 640, 1148], [6.80, 640, 1148], [6.93, 520, 900]],
  R: [[3.20, 710, 300], [3.40, 708, 470], [3.47, 706, 474], [3.56, 894, 520], [3.62, 890, 500], [3.74, 888, 760], [3.96, 884, 884], [4.08, 866, 820], [4.30, 840, 760], [5.06, 820, 1100], [5.162, 780, 1150],
      [5.44, 552, 1150], [5.56, 552, 1150], [5.72, 860, 780], [6.08, 820, 980], [6.16, 440, 1148], [6.40, 522, 1060], [6.56, 760, 900], [6.66, 600, 1000], [6.72, 558, 1060], [6.92, 640, 1148], [6.93, 640, 1148]],
};
const HAND = {
  at: (side, t) => keys(HK[side], t),
  /* the arm's direction from the wrist back to the shoulder (off frame) */
  arm: side => side === 'L' ? -2.25 : -.9,
  /* 'grip' holds a corner of the pad; 'pinch' holds the tape's end; 'flat' presses down; 'open' is free */
  pose(side, t) {
    if (t < 3.96) return 'grip';
    if (side === 'L') { if (t >= 4.40 && t < 4.86) return 'flat'; if ((t >= 5.84 && t < 6.16) || (t >= 6.44 && t < 6.72)) return 'pinch'; return 'open'; }
    if (t >= 5.10 && t < 5.56) return 'flat';
    if ((t >= 6.16 && t < 6.40) || (t >= 6.72 && t < 6.93)) return 'flat';
    return 'open';
  },
  /* the folds: the left skirt from 4.462 to 4.74, the right one from 5.162 to 5.44 */
  fold: [[4.462, 4.74], [5.162, 5.44]],
  /* the tape: pulled from the roll at t0, torn at tear, laid (lay), pressed along a -> b until press (insert px) */
  tape: [{ t0: 5.862, tear: 6.02, lay: 6.16, press: 6.40, a: [440, 1148], b: [522, 1060] }, { t0: 6.462, tear: 6.60, lay: 6.72, press: 6.92, a: [558, 1060], b: [640, 1148] }],
};

/* ------------------------------------------------------------------ the glove for the bow (hall px): limp in her right hand at 7.43, blown up 7.56-8.32 (three breaths), tied (squeak 8.66), set on the gift (9.05) */
const BOW = {
  breaths: [[7.562, 7.80], [7.86, 8.06], [8.10, 8.32]],
  puff(t) { let p = 0; const w = [.45, .33, .22]; this.breaths.forEach(([a, b], i) => { p += w[i] * sm(c01((t - a) / (b - a))); }); return p; },
  tie: [8.40, 8.662], set: [8.72, 9.05],
  /* the cuff's place (hall px): at her mouth, then down onto the gift's top */
  knot: [506, 966],                                                       /* where the knot sits on the gift's top face */
  cuff(t, mouth) { const a = mouth || [L.pos.straw - 84, 1052]; const k = sm(c01((t - this.set[0]) / (this.set[1] - this.set[0]))); return [a[0] + (this.knot[0] - a[0]) * k, a[1] + (this.knot[1] - a[1]) * k]; },
};

/* ------------------------------------------------------------------ the dozen balloons (hall px): out of the box two at a time, a puff at her mouth (from each pair's cue), swelling as she raises them over her
 * head, let go (rel); they rise to the ceiling and spread along it. x1 = where each ends up; s = size (1: about 150 wide, 190 tall); balloon 8 (the hero, with a marker smiley) ends over Room 3 for the
 * last shot's match cut. Balloon 4 bonks the lamp at 1020 (balloonbonk 20.917); balloons 2 and 3 meet and rub on the ceiling (glovesqueak 20.317). */
const BAL = (() => {
  const out = [], cue = [19.217, 19.617, 19.86, 20.02, 20.16, 20.28];
  const fin = [452, 612, 330, 520, 1016, 1092, 214, 1420, 1260, 772, 1580, 90];
  const sz = [1.0, .94, .98, 1.04, .96, 1.02, .95, 1.03, 1.4, .92, 1.0, .97];
  for (let i = 0; i < 12; i++) { const c = cue[i >> 1]; out.push({ i, t0: c, rel: c + .3, side: i % 2 ? 1 : -1, x1: fin[i], s: sz[i], face: i === 8, seed: 31 + i * 7 }); }
  return out;
})();
const BALCUE = [19.217, 19.617, 19.86, 20.02, 20.16, 20.28];

/* ------------------------------------------------------------------ the SOFT2D world
 * INSERT geometry in 3D (insert px, y down, z toward the viewer; drawn with VIEW: a point at depth z is drawn at y + 0.42 z, so the box's top face shows): the pudding's box is a collider box of half
 * sizes 156 x 92 x 131 standing on the cart top (floor y 1141): its top face projects to y 902..1012 and its front face to 1012..1196, exactly the drawn box. The Chux (cloth, mat chux, 24 x 20 cells,
 * 720 wide, 560 long) hangs from Strawberry's two hands by the corners of its far edge, folded in half (its near edge pinned up beside the far one) until the shake (chuxrustle 3.462): the near edge is let
 * go and the far edge spreads with the hands, the pad unfurls; she carries the far edge down and back over the box (3.70-3.96) and lets go: it drapes over the top, the front and the ends. The folds
 * (chuxfold 4.462, 5.162): the front half of each end flap is carried round the front corner onto the front face by moving pins (a diagonal fold). The tape (ropes, mat tape, 14 segments of 12 px, in
 * the plane z 150): unrolled off the roll by her left hand (each particle waits at the roll's exit until enough has been pulled), torn off at the roll (a cut), laid across a fold, and pressed down
 * along its length by her right hand (each particle pinned where the hand passes over it). */
const VIEW = { kx: 0, ky: .42 };
const BOX = { x: 540, y: 1049, hw: 156, hh: 92, hd: 131, floor: 1141 };
const HZ = t => { const a = sm(c01((t - 3.74) / (3.96 - 3.74))); return 250 + (-176 - 250) * a; };          /* the hands' depth: in front of the box (the pad lowered onto the cart), then swept up and back over it */
const toW = (p, z) => [p[0], p[1] - VIEW.ky * z, z];                                                          /* a screen point at depth z -> world */
function build(opts = {}) {
  const S = (typeof window !== 'undefined' && window.SOFT2D) || SOFT2D;
  if (!S || typeof S.world !== 'function') return null;
  const DY = L.INS.dy, w = S.world({ gravity: [0, 1500], dt: 1 / 240, iterations: 12, seed: 22, damping: .02 });
  const sh = (p) => [p[0], p[1] + DY, p[2] || 0];
  w.collider({ floor: BOX.floor + DY, mat: 'plastic', tag: 'cart' });
  const box = w.collider({ box: [BOX.hw, BOX.hh], x: BOX.x, y: BOX.y + DY, depth: 2 * BOX.hd, mat: 'cardboard', tag: 'box' });
  /* the hands in world space (pins): the screen path (HAND) at the hands' depth */
  const handW = side => t => { const z = HZ(t); return sh(toW(HAND.at(side, t), z)); };
  const NU = 24, NV = 20, CWD = 720, CLN = 560;
  /* the far edge's particles spread along the line between the hands (bunched while the hands are close); the near edge pinned up beside it until the shake */
  const pins = [];
  const along = (i, t) => { const a = handW('L')(t), b = handW('R')(t), u = i / NU; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; };
  for (let i = 0; i <= NU; i++) {
    const corner = i === 0 || i === NU;
    pins.push({ i, j: 0, to: corner ? handW(i === 0 ? 'L' : 'R') : (t => along(i, t)), until: corner ? T.drop : T.rustle + .16 });
  }
  const h0 = handW('L')(0), h1 = handW('R')(0);
  const pad = w.cloth({ cx: (h0[0] + h1[0]) / 2, y: h0[1], width: CWD, height: CLN, cols: NU + 1, rows: NV + 1, plane: 'xy', z: h0[2], mat: 'chux', tag: 'chux', friction: .8, damping: .45, flutter: .12, pins });
  /* the folds: the front half of each end flap carried round the front corner onto the front face */
  const ease = (t, a, b) => sm(c01((t - a) / (b - a)));
  const fold = (side, t0, t1) => {
    const i = side < 0 ? 0 : NU, ex = BOX.x + side * BOX.hw;
    for (let j = 8; j <= NV; j++) {
      const idx = pad.index(i, j), u = (j - 8) / (NV - 8);
      w.schedule(t0, w2 => {
        const o = w2.object(pad.id), x0 = w2.x[o.p0 + idx], y0 = w2.y[o.p0 + idx], z0 = w2.z[o.p0 + idx];
        const yt = Math.min(BOX.floor + DY - 6, Math.max(BOX.y - BOX.hh + DY + 12, y0)), xt = ex - side * (40 + 120 * u), zt = BOX.hd + 7;
        w2.pin(pad.id, idx, t => { const e = ease(t, t0, t1); return [x0 + (xt - x0) * e + side * 46 * S.sin(Math.PI * e), y0 + (yt - y0) * e - 26 * S.sin(Math.PI * e), z0 + (zt - z0) * e + 60 * S.sin(Math.PI * e)]; }, { until: 99 });
      });
    }
  };
  fold(-1, T.fold1, T.fold1 + .3); fold(1, T.fold2, T.fold2 + .3);
  /* the tape: unrolled by the left hand, torn at the roll, laid and pressed */
  const TZ = 150, roll = sh(toW([L.INS.roll[0] + 34, L.INS.roll[1] - 30], TZ)), tapes = [];
  HAND.tape.forEach((tp, n) => {
    const N = 14, seg = 12, hand = handW('L'), tpins = [{ k: 0, to: roll, until: tp.tear }];
    const handZ = t => { const p = sh(toW(HAND.at('L', t), TZ)); return [p[0], p[1], TZ]; };
    for (let k = 1; k < N; k++) {                                                                      /* particle k leaves the roll once the hand is (N - k) segments away */
      let tk = tp.tear; for (let t = tp.t0; t <= tp.tear; t += 1 / 240) { const h = handZ(t); if (Math.hypot(h[0] - roll[0], h[1] - roll[1]) >= (N - k) * seg) { tk = t; break; } }
      tpins.push({ k, to: [roll[0], roll[1], TZ], from: 0, until: tk });
    }
    tpins.push({ k: -1, to: handZ, from: tp.t0, until: tp.lay + .02 });
    const A = sh(toW(tp.a, TZ)), B = sh(toW(tp.b, TZ));
    for (let k = 0; k <= N; k++) { const u = k / N, tk = tp.lay + (tp.press - tp.lay) * u; tpins.push({ k: k === N ? -1 : k, to: [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, TZ], from: tk + .01 }); }
    const r = w.rope({ from: [roll[0], roll[1]], to: [roll[0] + 1, roll[1]], length: N * seg, segments: N, width: 26, thickness: 3, mat: 'tape', tag: 'tape', z: TZ, collide: false, pins: tpins });
    w.schedule(tp.tear, w2 => w2.cut(r.id, 0, 1));
    tapes.push(r.id);
  });
  w.warmup(opts.warm ?? .6);
  if (opts.run !== false) w.run(opts.T || T.wrapEnd, { sampleHz: 120 });
  return { world: w, T: opts.T || T.wrapEnd, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960 + DY, z: 1 } }, sampleHz: 120, maxEvents: 80,
    meta: { view: VIEW, box: BOX, dy: DY, chux: pad.id, tapes, boxCollider: box.id, cols: NU, rows: NV, size: [CWD, CLN] } };
}

const api = { build, L, T, HAND, HK, BOW, BAL, BALCUE, keys, VIEW, BOX };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP22_SIMS = window.__EP22_SIMS || {}; window.__EP22_SIMS.wrap = api; }
})();
