'use strict';
/* SHIFT HAPPENS, Episode 22, scene `santa` (SANTA'S VISIT, 7:30 PM, 27.641 s): the DOM-free soft bodies of the scene (builder SANTA), SOFT2D (soft2d.js).
 * window.__EP22_SIMS.santa = { build, L, T, geo } and module.exports = the same. World time = scene-local time (tools_phys_events.js adds the scene start).
 *
 * THE GEOMETRY (geo.*) is shared with ep22_santa.js and with A22.hoyer (ep22_art.js, A22.HOYER): the scene draws from the same functions the colliders and pins follow, so picture and simulation agree.
 *   geo.hoyer(t): the Hoyer lift in side view (mast x, the boom's pivot and angle, the tip, the swivel, the spreader bar and its four hooks, the pendulum sway of what hangs from the tip).
 *   geo.body(t): Santa's round body as a circle: standing, the sit (9.56 .. 9.86: a dip into the cushion and a bounce; seated centre 1102 = A22.santa 'seated' at the floor 1300), lifted in the sling from
 *   23.18 (the sling takes up 30 px of slack, then he rises with the bar), swaying with the bar.
 *   geo.beltTop(t, which): the gait belt's script in TOP VIEW (see below); geo.beltFront(b, X, Z): a top-view point projected onto the front view (b = geo.body); geo.tailHand(t): Onion's near hand (front view).
 * THE WORLD (build): one SOFT2D world, two groups that never meet:
 *   1. THE GAIT BELT, simulated in a TOP VIEW of his waist (the belt's own plane, far left of the room at BX, BY; y there is depth, +y toward the camera; no gravity): a canvas strap (rope, 56 particles,
 *      1104 px, 22 wide) round a circle collider (his waist, r 133). Its buckle end is thrown round his back on a path (8.64 .. 8.90), then held at the front centre (the buckle, 8.96); its tail end is in
 *      Onion's near hand: by his right side, through the buckle (8.88 .. 8.95), the tug (9.42 .. 9.52: the slack of the loose wrap goes into the tail and the strap closes on his waist), tucked (9.62 ..).
 *      The scene projects it: x stays, depth becomes y * 30/133 under his waist line, the half behind him is hidden.
 *   2. THE HOYER SLING (front view, in the room): a fabric band (26 x 5, 1080 x 56) under Santa in the chair, round a kinematic circle that is his body (geo.body); its loops lie on the floor beside
 *      the chair (a floor collider) until 22.60, fly up to the hooks (slingrustle 22.68), and the band takes his weight as the bar rises (hoyerlift 23.18), stretches and settles, and sways with the bar.
 * Deterministic: no Math.random, no clock; the library's own sine and cosine in everything the solver evaluates (pins, poses). Built once by the scene (lazily) and sampled with world.at(lt). */
(function () {
const S2 = (typeof window !== 'undefined' && window.SOFT2D) || (typeof module === 'object' && module.exports && typeof require === 'function' ? (() => { try { return require('./soft2d.js'); } catch (e) { return null; } })() : null);
const sin = S2 && S2.sin ? S2.sin : Math.sin, cos = S2 && S2.cos ? S2.cos : Math.cos;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const eio = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eo = k => 1 - (1 - k) * (1 - k);
const PI = Math.PI;

/* the layout (world px, the same numbers as ep22_santa.js) */
const L = {
  FY: 1300,
  SANTA: { x: 1150, s: 1.0, rx: 136, ry: 128, leg: 90, standCy: 1300 - (90 + 128 * .9), sitCy: 1102, r: 132 },
  ONION: { x: 1460, belt: 1330 },
  HOY: { park: 2023, home: 1570, mastH: 640, boom: 420, a0: -.24, aTravel: -.10, a1: .36, swivel: 40, bar: 150, hookIn: 118 },
  BELT: { BX: -3000, BY: 1100, R0: 133, e: 30, half: 11, n: 56, len: 1104, dy: 40 },
  SLING: { cols: 26, rows: 5, L: 1080, Wd: 56, rest: 330 },
};
/* the script (scene-local s, on the frames the scene snaps to) */
const T = {
  sit: [9.56, 9.86],
  belt: { throw: [8.64, 8.90], hold: 8.90, toBuckle: [8.88, 8.95], buckle: 8.961, tug: [9.42, 9.52], tuck: [9.62, 9.78] },
  rips: [14.659, 15.259, 15.859, 16.459],
  roll: [22.082, 22.58], lower: [22.40, 22.66], hook: [22.60, 22.76], rustle: 22.682, lift: [23.182, 24.55], slack: 30, sway: { t0: 23.55, A: .12, tau: 1.3, w: 2.3, off: [26.6, 27.3] },
  run: 27.7,
};

// ------------------------------------------------------------------ geometry shared with the scene (and A22.hoyer)
function hoyer(t) {
  const H = L.HOY, rollK = eio(sg(t, T.roll[0], T.roll[1]));
  const settle = t > T.roll[1] ? -6 * Math.exp(-(t - T.roll[1]) * 7) * sin((t - T.roll[1]) * 18) : 0;
  const mastX = lerp(H.park, H.home, rollK) + settle;
  const aLow = lerp(H.aTravel, H.a0, eio(sg(t, T.lower[0], T.lower[1])));
  const ang = t < T.lift[0] ? aLow : lerp(H.a0, H.a1, eio(sg(t, T.lift[0], T.lift[1])));
  const pivot = [mastX - 12, L.FY - H.mastH], tip = [pivot[0] - H.boom * cos(ang), pivot[1] - H.boom * sin(ang)];
  /* the sway: a kick as he leaves the chair, damped, calmed to nothing by 27.3 (the match cut is still); a small swing as the lift stops rolling */
  const W = T.sway, u = t - W.t0, env = u > 0 ? W.A * Math.exp(-u / W.tau) * (1 - ss(t, W.off[0], W.off[1])) : 0;
  const roll = t > T.roll[0] && t < T.roll[1] + .8 ? .05 * sin(Math.min(1, (t - T.roll[0]) / .5) * PI) * Math.exp(-Math.max(0, t - T.roll[1]) * 3) : 0;
  const theta = env * sin(u * W.w) + roll;
  /* everything that hangs from the tip turns rigidly about it by theta (clockwise on screen for theta > 0) */
  const ca = cos(theta), sa = sin(theta), R = (dx, dy) => [tip[0] + dx * ca - dy * sa, tip[1] + dx * sa + dy * ca];
  const swv = R(0, H.swivel), P = (dx, dy) => R(dx, H.swivel + dy);
  const bar = { x: swv[0], y: swv[1], rot: theta, a: P(-H.bar, 0), b: P(H.bar, 0) };
  const hooks = [P(-H.bar, 12), P(-H.hookIn, 12), P(H.hookIn, 12), P(H.bar, 12)];
  return { mastX, pivot, ang, tip, swv, theta, bar, hooks, P, R, base: { x0: mastX - 470, x1: mastX + 46, y: L.FY } };
}
const tipY0 = L.FY - L.HOY.mastH - L.HOY.boom * sin(L.HOY.a0);
function body(t) {
  const S = L.SANTA;
  let cy = S.standCy, x = S.x, sit = 0, lift = 0, theta = 0;
  if (t >= T.sit[0]) {
    const k = sg(t, T.sit[0], T.sit[1]); sit = k;
    cy = lerp(S.standCy, S.sitCy, k) + 28 * sin(PI * k) + (t > T.sit[1] ? -9 * Math.exp(-(t - T.sit[1]) * 8) * sin((t - T.sit[1]) * 26) : 0);
  }
  if (t >= T.lift[0]) {
    const h = hoyer(t), d = Math.max(0, tipY0 - h.tip[1]), up = d - T.slack + T.slack * Math.exp(-d / T.slack);
    const k = c01(up / 60), ux = lerp(S.x, h.tip[0], k), uy = S.sitCy - up, p = h.R(ux - h.tip[0], uy - h.tip[1]);
    lift = up; theta = h.theta; x = p[0]; cy = p[1];
  }
  return { x, y: cy, r: S.r, sit, lift, theta };
}
function beltWrap(t) {
  const B = T.belt, on = t >= B.throw[0], buckled = t >= B.buckle, tug = ss(t, B.tug[0], B.tug[1]);
  return { on, thr: sg(t, B.throw[0], B.throw[1]), buckled, tug, cinch: tug * (1 - .45 * ss(t, B.tug[1] + .2, B.tug[1] + .8)) };
}
/* the belt in top view: 'buckle' = the path of the buckle end until it is held at the front; 'tail' = Onion's near hand on the tail */
function beltTop(t, which) {
  const B = L.BELT, X = B.BX, Y = B.BY, R = B.R0 + B.half, P = T.belt;
  if (which === 'buckle') {
    if (t >= P.hold) return [X, Y + R];
    const u = eo(sg(t, P.throw[0], P.throw[1])), a = lerp(.31, .31 - (.31 + 1.5 * PI), u), r = lerp(297, R, u * u);
    return [X + r * cos(a), Y + r * sin(a)];
  }
  const side = [X + B.R0 + 20, Y + 60], thru = [X + 26, Y + R + 3], tugged = [X + 170, Y + 190], tuck = [X + 64, Y + R + 6];
  if (t < P.toBuckle[0]) return side;
  if (t < P.tug[0]) { const k = ss(t, P.toBuckle[0], P.toBuckle[1]); return [lerp(side[0], thru[0], k), lerp(side[1], thru[1], k)]; }
  if (t < P.tuck[0]) { const k = ss(t, P.tug[0], P.tug[1]); return [lerp(thru[0], tugged[0], k), lerp(thru[1], tugged[1], k)]; }
  const k = ss(t, P.tuck[0], P.tuck[1]); return [lerp(tugged[0], tuck[0], k), lerp(tugged[1], tuck[1], k)];
}
const beltFront = (b, X, Z) => [b.x + (X - L.BELT.BX), b.y + L.BELT.dy + (Z - L.BELT.BY) * L.BELT.e / L.BELT.R0];
const tailHand = t => { const p = beltTop(t, 'tail'); return beltFront(body(t), p[0], p[1]); };
/* the sling's end columns: their creation spot, the rest on the floor beside the chair, then the hooks */
function slingEnd(t, side, j) {
  const S = L.SLING, x0 = L.SANTA.x, top = L.SANTA.sitCy + L.SANTA.r + 8, rows = S.rows;
  const born = [x0 + side * S.L / 2, top + j * S.Wd / (rows - 1)], rest = [x0 + side * S.rest + side * j * 3, L.FY - 16 - j * 4];
  if (t < 1.0) { const k = ss(t, 0, 1.0); return [lerp(born[0], rest[0], k), lerp(born[1], rest[1], k)]; }
  if (t < T.hook[0]) return rest;
  const h = hoyer(t), hk = side < 0 ? [h.hooks[0], h.hooks[1]] : [h.hooks[3], h.hooks[2]], u = j / (rows - 1), hx = lerp(hk[0][0], hk[1][0], u), hy = lerp(hk[0][1], hk[1][1], u) + 6;
  const k = ss(t, T.hook[0], T.hook[1]); return [lerp(rest[0], hx, k), lerp(rest[1], hy, k) - 60 * sin(PI * k)];
}

// ------------------------------------------------------------------ the SOFT2D world
function build(opts) {
  opts = opts || {};
  if (!S2 || typeof S2.world !== 'function') throw new Error('ep22_santa_sim: SOFT2D is not loaded');
  const w = S2.world({ gravity: [0, 1500], dt: 1 / 240, iterations: 12, seed: 22, damping: .02 });
  const meta = {};
  /* 1. THE GAIT BELT (top view of his waist) */
  {
    const B = L.BELT, n = B.n, waist = w.collider({ circle: B.R0, x: B.BX, y: B.BY, friction: .5, mat: 'felt', tag: 'santa' });
    /* laid out as a loop in front of him whose ends sit where the pins start (it is not drawn before the throw) */
    const p0 = beltTop(0, 'buckle'), p1 = beltTop(0, 'tail'), mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    let rL = B.len / (2 * PI), C = null, a0 = 0, span = 0;
    for (let it = 0; it < 4; it++) {
      C = [mx + 60, my + rL + 20]; a0 = Math.atan2(p0[1] - C[1], p0[0] - C[0]); const a1 = Math.atan2(p1[1] - C[1], p1[0] - C[0]);
      let sp = ((a1 - a0) % (2 * PI) + 2 * PI) % (2 * PI); if (sp < PI) sp -= 2 * PI; span = sp; rL = B.len / Math.abs(sp);
    }
    const pts = []; for (let i = 0; i < n; i++) { const a = a0 + span * i / (n - 1); pts.push([C[0] + rL * cos(a), C[1] + rL * sin(a)]); }
    const belt = w.rope({ points: pts, segments: n - 1, mass: .04, stretch: 0, bend: .08, width: 22, thickness: B.half, mat: 'canvas', tag: 'gaitbelt', collide: [waist.id], friction: .6, gravityScale: 0, damping: 3,
      pins: [{ k: 0, to: t => beltTop(t, 'buckle') }, { k: -1, to: t => beltTop(t, 'tail') }] });
    meta.belt = { id: belt.id, waist: waist.id, n };
  }
  /* 2. THE SLING (front view, in the room) */
  {
    const S = L.SLING, sa = L.SANTA;
    const santa = w.collider({ circle: sa.r + 4, x: sa.x, y: sa.sitCy, pose: t => { const b = t < T.sit[1] + .3 ? { x: sa.x, y: sa.sitCy } : body(t); return { x: b.x, y: b.y, angle: 0 }; }, friction: .75, mat: 'felt', tag: 'santa' });
    const floor = w.collider({ floor: L.FY - 6, friction: .8, mat: 'wood', tag: 'floor', silent: true });
    const pins = []; for (let j = 0; j < S.rows; j++) { pins.push({ i: 0, j, to: t => slingEnd(t, -1, j) }); pins.push({ i: S.cols - 1, j, to: t => slingEnd(t, 1, j) }); }
    const sl = w.cloth({ cx: sa.x, y: sa.sitCy + sa.r + 8, width: S.L, height: S.Wd, cols: S.cols, rows: S.rows, mat: 'fabric', tag: 'sling', collide: [santa.id, floor.id], friction: .75, pins });
    meta.sling = { id: sl.id, santa: santa.id, cols: S.cols, rows: S.rows };
  }
  w.warmup(opts.warm || .4);
  w.run(opts.T || T.run, { sampleHz: opts.sampleHz || 120 });
  return { world: w, T: T.run, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 1150, y: 1000, z: 1.0 } }, maxEvents: 90, meta };
}

const api = { build, L, T, geo: { hoyer, body, beltWrap, beltTop, beltFront, tailHand, slingEnd, tipY0 } };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP22_SIMS = window.__EP22_SIMS || {}; window.__EP22_SIMS.santa = api; }
})();
