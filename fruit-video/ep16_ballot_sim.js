'use strict';
/* SHIFT HAPPENS, Episode 16, scene `ballot`: the DOM-free physics of the ballot box (E1617-BALLOT). window.__EP16_SIMS.ballot = { build, consts } and module.exports = same.
 * build() -> { world, T, runT, screen: { w: 1080, h: 1920, cx: 540, cam }, sceneStart: 0, meta }. Deterministic (no Math.random, no clock); the scene samples world.at(lt) and never steps.
 *
 * Units are ROOM units (the scene's break room), in the plane of the ballot box: u = sideways from the box centre, v = DOWN from the table top (v 0 = the table top, the box floor rests on it, v 230 = the floor of the room).
 *   - the table top (static, 380 wide), the room floor, the clear box (two walls, a floor) 150 wide inside and 140 tall, a LID (kinematic: it sits on the box, then at the crowd cue it is thrown up and over the edge on a scripted arc);
 *   - 3 + 27 + 14 ballots (22 x 14, `cardboard`), all created at t = 0 where they will appear, frozen (mask 0, no gravity) until their time:
 *       three staff drop a folded ballot through the slot at the three clicks (the ballot appears under the slot just after the click and falls into the box);
 *       five fill pops (5, 6, 5, 6, 5 ballots appear in the box at the cue and drop onto the pile); the crowd cue (22.818) throws the lid, kicks the whole pile up and out and adds 14 more: they rain onto the table and the floor.
 *   Every collision after a ballot's time is a foley event (the ballots are silent until then).
 * meta.ballots[i] = { id, t (the time it appears), grp ('drop' | 'pop' | 'crowd'), k (index in its group), hero (true for the three dropped ones: shown folded and readable while in the hand) }. */
(function () {
const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : (typeof window !== 'undefined' ? window.PHYS2D : null);
if (!P) return;

const G = 1100, T_RUN = 24.82;
const T_CLICK = [20.518, 20.918, 21.318], T_POP = [21.918, 22.118, 22.318, 22.468, 22.618], N_POP = [5, 6, 5, 6, 5], T_CROWD = 22.818, N_CROWD = 14;
const TABLE_W = 190, FLOORV = 238, BOXW = 75, BOXH = 140, BW = 11, BH = 7;                      /* table half width, floor depth below the table top, box inner half width / height, ballot half sizes */
const LID = { y: -(BOXH + 8), hw: 88, hh: 8 };

/* the lid: sits on the box until the crowd cue, then a scripted arc up and over the table's right edge to the floor (it lands flat at about 24.3 s) */
const LID_VX = 210, LID_VY = -560, LID_W = 6, LID_LAND = FLOORV - LID.hh;
const LID_TA = (-LID_VY + Math.sqrt(LID_VY * LID_VY + 2 * G * (LID_LAND - LID.y))) / G;
function lidPose(t) {
  if (t < T_CROWD) return { x: 0, y: LID.y, angle: 0 };
  const a = t - T_CROWD;
  if (a < LID_TA) return { x: LID_VX * a, y: LID.y + LID_VY * a + .5 * G * a * a, angle: LID_W * a };
  const b = a - LID_TA, k = Math.min(1, b / .25), ang0 = LID_W * LID_TA, flat = Math.round(ang0 / Math.PI) * Math.PI;
  return { x: LID_VX * LID_TA + 30 * k * (2 - k), y: LID_LAND, angle: ang0 + (flat - ang0) * k * (2 - k) };
}

function build(opts) {
  opts = opts || {};
  const W = P.world({ gravity: [0, G], dt: 1 / 240, seed: 16, materials: { paper: { density: .35, friction: .5, restitution: .14 } }, feel: { bounce: 1, soft: 0 } });
  const meta = { ballots: [], T_CLICK, T_POP, T_CROWD, consts: { TABLE_W, FLOORV, BOXW, BOXH, BW, BH } };
  W.floor(FLOORV, { x: 0, halfWidth: 3000, mat: 'concrete', tag: 'floor', friction: .7, restitution: .08 });
  W.body({ type: 'static', x: 0, y: 9, box: [TABLE_W, 9], mat: 'wood', tag: 'table', friction: .5, restitution: .1 });                          /* the top surface is v = 0 */
  W.body({ type: 'static', x: 0, y: -3, box: [BOXW + 3, 3], mat: 'plastic', tag: 'box', friction: .5, restitution: .1 });                            /* the box floor: top at v -6 */
  for (const sx of [-1, 1]) W.body({ type: 'static', x: sx * (BOXW + 3), y: -(BOXH / 2 + 3), box: [3, BOXH / 2 + 3], mat: 'plastic', tag: 'box', friction: .3, restitution: .1 });
  W.body({ type: 'kinematic', x: 0, y: LID.y, box: [LID.hw, LID.hh], mat: 'plastic', tag: 'lid', pose: lidPose });

  /* the ballots: parked where they will appear; slot n of the box fills row by row (5 across, 15 pitch) */
  const jit = (i, k) => { const v = Math.sin(i * 91.7 + k * 17.3) * 43758.5453; return v - Math.floor(v); };
  const slot = n => ({ x: (n % 5 - 2) * 25 + (jit(n, 1) - .5) * 9, y: -(6 + BH + Math.floor(n / 5) * 15) - 5 - jit(n, 2) * 5, a: (jit(n, 3) - .5) * .8 });
  const mk = (grp, k, t, pos, vel) => {
    const b = W.body({ type: 'dynamic', x: pos.x, y: pos.y, angle: pos.a, box: [BW, BH], mat: 'cardboard', friction: .55, restitution: .12, density: .5, tag: 'ballot', linearDamping: .25, angularDamping: .3, gravityScale: 0, mask: 0, allowSleep: true, vx: 0, vy: 0 });
    meta.ballots.push({ id: b.id, t, grp, k, hero: grp === 'drop' }); b.__t = t; b.__vel = vel || [0, 0, 0]; return b;
  };
  const all = [];
  let n = 0;
  T_CLICK.forEach((t, i) => { const s = slot(i + 1); all.push(mk('drop', i, t + .1, { x: (i - 1) * 4, y: -(BOXH - 6), a: (i - 1) * .3 }, [0, 20, (i - 1) * 2])); });
  n = 3;
  T_POP.forEach((t, i) => { for (let j = 0; j < N_POP[i]; j++) { const s = slot(n++); all.push(mk('pop', n, t, s, [0, 0, (jit(n, 4) - .5) * 3])); } });
  for (let j = 0; j < N_CROWD; j++) {
    const s = { x: (j % 5 - 2) * 22 + (jit(j, 5) - .5) * 8, y: -(BOXH + 24 + Math.floor(j / 5) * 22), a: (jit(j, 6) - .5) * 1.2 };
    all.push(mk('crowd', j, T_CROWD, s, [(jit(j, 7) - .5) * 600, -(500 + jit(j, 8) * 700), (jit(j, 9) - .5) * 16]));
  }
  /* activation: each ballot wakes at its time (collisions and gravity on, velocity as planned); at the crowd cue the whole pile is kicked up and out */
  const times = {}; for (const b of all) (times[b.__t.toFixed(4)] = times[b.__t.toFixed(4)] || []).push(b);
  Object.keys(times).forEach(k => W.schedule(+k, w => { for (const b of times[k]) { b.mask = 0xFFFF; b.gscale = 1; b.vx = b.__vel[0]; b.vy = b.__vel[1]; b.w = b.__vel[2]; b.wake(); } }));
  W.schedule(T_CROWD, w => {
    let i = 0;
    for (const b of all) if (b.__t < T_CROWD && b.mask !== 0) { b.vx = (jit(i, 11) - .5) * 640; b.vy = -(420 + jit(i, 12) * 620); b.w = (jit(i, 13) - .5) * 14; b.wake(); i++; }
  });
  W.run(opts.T || T_RUN, { sampleHz: 120 });
  return { world: W, T: T_RUN, runT: W.T, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, z: 1 } }, sceneStart: 0, meta };
}
const api = { build, lidPose, consts: { T_CLICK, T_POP, N_POP, T_CROWD, N_CROWD, TABLE_W, FLOORV, BOXW, BOXH, BW, BH, LID, G } };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP16_SIMS = window.__EP16_SIMS || {}; window.__EP16_SIMS.ballot = api; }
})();
