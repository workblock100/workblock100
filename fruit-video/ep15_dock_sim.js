'use strict';
/* SHIFT HAPPENS, Episode 15, scene `dock`: the DOM-free physics of the merge (E15-K). window.__EP15_SIMS.dock = { build, hookY, consts } and module.exports = same.
 * The crane hook (kinematic) lowers the Greenleaf block (a heavy compound body) on four cable ropes onto Fruit Bowl's roof. The hook follows a scripted descent built BACKWARDS from the contact so that the block's
 * underside meets the roof sign's top edge at scene time 5.821 s (the `dockimpact` cue; verified by build/ep15_k/simtest.js: 5.8208); the winch slips for the last 0.4 s, so the block hits at 524 px/s.
 * Fruit Bowl is one kinematic body whose pose follows a scripted damped spring (the squat: peak 40 px about 0.19 s after the landing, a rebound of 10 px, rest at 0), carrying the roof's ridge cap and slopes and the top floor's ceiling, floor,
 * walls, lintels and furniture. The roof sign (two halves), the chimney (bricks and cap), the weathervane and loose tile chips are thrown clear at the first touch (collision category 2: they never touch the
 * block; the scene draws them in front of the building, as if flung toward the camera); the top floor's props (chairs, trays, pizza boxes, a fishbowl, a plant, an IV pole, papers, mugs, a clock ...) are dynamic bodies
 * resting on its floors and furniture; warmup settles them before t = 0 and they are asleep until the squat wakes them.
 * Tower coordinates are S15's (ep15_house.js): ground 1342, ridge cap 274, top floor floor line 656 (the props' floor), ceiling 380.
 * build() -> { world, T, runT, screen: { w: 1080, h: 1920, cx: 540, cam }, sceneStart: 0, meta }; meta lists every body for the scene's sprites (name, kind, size, room) and the fixed numbers.
 * Deterministic (no Math.random, no clock); the scene samples world.at(lt) / world.pose(id, lt) and never steps. */
(function () {
const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : (typeof window !== 'undefined' ? window.PHYS2D : null);

const G = 1100, T_RUN = 10.0, T_SCENE = 32.38, TC = 5.821, T_LOWER = 2.221;
const GL_H = 1002, GL_DOCK_BOT = 274, GL_CY_DOCK = GL_DOCK_BOT - GL_H / 2;      /* -227 */
const SIGN_TOP = 190, RIDGE = 274, FLOOR_Y = 656, CEIL_Y = 380;
const SLING_DX = [-400, -140, 140, 400], EYE_DY = 109, LUG_DY = -523, SLING_L = 251;
const HOOK_TO_UNDER = EYE_DY + SLING_L + 22 + GL_H;                                    /* hook centre to the block's underside when the slings hang taut: 1384 */
const HOOK_C = SIGN_TOP - HOOK_TO_UNDER;                                               /* hook centre y at first contact: -1194 */
const V1 = 83.75, A_SLIP = 1100, TAU_SLIP = .4, EASE = .8;                              /* the winch slips for the last 0.4 s: the block drops 127 px and meets the sign at 524 px/s */
const SLACK_END = 30;
const HOOK0 = HOOK_C - (V1 * (EASE / 2 + (TC - TAU_SLIP - T_LOWER - EASE)) + V1 * TAU_SLIP + .5 * A_SLIP * TAU_SLIP * TAU_SLIP);   /* where the hook starts so that it is at HOOK_C at TC */

/* the hook's centre y at scene time t (a scripted, backwards-built path). The block lags the hook by about 26 ms when the winch slips (the slings have to go slack first), so the path runs CAL seconds early:
 * the block's underside meets the sign's top edge at TC. */
const CAL = 0;
function hookY(tt) {
  const t = tt + CAL, u = t - T_LOWER, ts = TC - TAU_SLIP;
  if (u <= 0) return HOOK0;
  if (u < EASE) return HOOK0 + V1 * u * u / (2 * EASE);
  const yS = HOOK0 + V1 * (EASE / 2 + (ts - T_LOWER - EASE));
  if (t < ts) return HOOK0 + V1 * (EASE / 2 + (u - EASE));
  if (t < TC) { const d = t - ts; return yS + V1 * d + .5 * A_SLIP * d * d; }
  const vC = V1 + A_SLIP * TAU_SLIP, d = t - TC, yC = HOOK_C;
  const dRoof = RIDGE - SIGN_TOP + 10, tRoof = dRoof / vC;                              /* the hook keeps going at full speed until the block meets the ridge cap, then the brake bites late: the slings go slack */
  const tBrake = .28, yStop = yC + dRoof + .5 * vC * tBrake;
  if (d < tRoof) return yC + vC * d;
  if (d < tRoof + tBrake) { const e = d - tRoof; return yC + dRoof + vC * e - .5 * (vC / tBrake) * e * e; }
  if (t < 6.45 + CAL) return yStop;
  const k = Math.min(1, (t - 6.45 - CAL) / .12), e = k * k * (3 - 2 * k);                 /* the winch hauls the slack: the slings whip */
  return yStop - (yStop - (yC + dRoof + SLACK_END)) * e;
}

/* the load sways as the cables creak: a few px sideways, ramped in by 3.421 (the creak), gone by 5.5 so the block comes down square onto the roof sign */
function hookX(t) {
  if (t < 3.421 || t > 5.5) return 540;
  const u = t - 3.421, env = (1 - Math.exp(-u * 14)) * Math.max(0, 1 - u / 2.079);
  return 540 + 9 * env * P.sin(u * 2 * Math.PI / 1.9);
}
/* the squat of Fruit Bowl (px, positive down): a damped spring started by the block's landing (T_HIT) with a downward kick: peak 40 px about 0.19 s later, a 10 px rebound, rest at 0 by T_HIT + 2 s; before the landing a faint
 * tremor that grows with the load coming down (the top floor starts to buzz). exp() is a squaring series (deterministic everywhere). */
const SQ_W = 2 * Math.PI * 1.05, SQ_Z = .4, SQ_WD = SQ_W * Math.sqrt(1 - SQ_Z * SQ_Z), SQ_V0 = 440, T_HIT = 5.975;
function fexp(x) { let y = 1 + x / 1024; for (let i = 0; i < 10; i++) y *= y; return y; }
function squat(t) {
  if (t <= T_HIT) { const k = Math.max(0, Math.min(1, (t - 3.8) / (T_HIT - 3.8))); return (.12 + .88 * k * k) * .9 * P.sin(t * 2 * Math.PI * 19) * k; }
  const tau = t - T_HIT; if (tau > 3) return 0;
  return (SQ_V0 / SQ_WD) * fexp(-SQ_Z * SQ_W * tau) * P.sin(SQ_WD * tau) * (tau > 2 ? 1 - (tau - 2) : 1);
}

function build(opts) {
  opts = opts || {};
  const W = P.world({ gravity: [0, G], dt: 1 / 240, seed: 15, ropeSweeps: opts.ropeSweeps || 2, ropePosIters: opts.ropePosIters || 3, materials: { wood: { density: 0.8, friction: 0.55, restitution: 0.18 } }, feel: { bounce: 1.1, soft: 0 } });
  const meta = { bodies: [], hookY0: HOOK0, hookC: HOOK_C, TC, lugs: SLING_DX, sling: SLING_L, ropes: [], props: [], parts: {}, dockSquat: 0, tHit: T_HIT, floorY: FLOOR_Y, ceilY: CEIL_Y, TL: TC + .012 };
  const reg = (b, info) => { meta.bodies.push(Object.assign({ id: b.id }, info)); return b; };

  /* ---- the street */
  W.floor(1342, { x: 540, halfWidth: 3000, mat: 'concrete', tag: 'ground' });

  /* ---- Fruit Bowl: one body (fixed rotation) on a slider spring: ridge cap and roof slopes, the top floor's ceiling, floor, outer walls, doorway lintels and furniture */
  const FO = [540, 500];
  const sh = (cx, cy, hw, hh, mat, extra) => Object.assign({ box: [hw, hh], offset: [cx - FO[0], cy - FO[1]], mat: mat || 'concrete', friction: .6, restitution: .08 }, extra || {});
  const fbShapes = [
    sh(540, RIDGE + 5, 420, 5, 'wood'),
    { poly: [[-14 - FO[0], 346 - FO[1]], [126 - FO[0], 346 - FO[1]], [126 - FO[0], 282 - FO[1]], [-6 - FO[0], 343 - FO[1]]], mat: 'ceramic', friction: .5, restitution: .08 },
    { poly: [[954 - FO[0], 346 - FO[1]], [1094 - FO[0], 346 - FO[1]], [1086 - FO[0], 343 - FO[1]], [954 - FO[0], 282 - FO[1]]], mat: 'ceramic', friction: .5, restitution: .08 },
    sh(540, CEIL_Y - 8, 530, 8), sh(540, FLOOR_Y + 6, 530, 6),
    sh(16, (CEIL_Y + FLOOR_Y) / 2, 6, (FLOOR_Y - CEIL_Y) / 2), sh(1064, (CEIL_Y + FLOOR_Y) / 2, 6, (FLOOR_Y - CEIL_Y) / 2),
    sh(278, 423, 6, 43), sh(540, 423, 6, 43), sh(802, 423, 6, 43),
    /* furniture the props stand on: the conference table top, the break room table, the bed, the bedside table, the Administrator's desk */
    sh(409, 602, 95, 6, 'wood'), sh(670, 597, 44, 5, 'wood'), sh(970, 600, 46, 8, 'wood'), sh(903, 585, 15, 3, 'wood'), sh(182, 578, 92, 4, 'wood'),
  ];
  const fb = reg(W.body({ type: 'kinematic', x: FO[0], y: FO[1], shapes: fbShapes, pose: t => ({ x: FO[0], y: FO[1] + squat(t), angle: 0 }), tag: 'fruitbowl', mat: 'concrete' }), { name: 'fb', origin: FO });

  /* ---- the hook (kinematic: the path above) and the Greenleaf block (category 4: it meets Fruit Bowl and the street, nothing else) */
  const hook = reg(W.body({ type: 'kinematic', x: 540, y: HOOK0, pose: t => ({ x: hookX(t), y: hookY(t), angle: 0 }), tag: 'hook', silent: true }), { name: 'hook' });
  const gl0 = HOOK0 + HOOK_TO_UNDER - GL_H / 2;                                          /* the block's centre at t = 0 */
  const glShapes = [
    { box: [530, 6], offset: [0, 495], mat: 'concrete', friction: .6, restitution: .05 }, { box: [530, 6], offset: [0, -495], mat: 'concrete' },
    { box: [6, 489], offset: [-524, 0], mat: 'concrete' }, { box: [6, 489], offset: [524, 0], mat: 'concrete' }, { box: [518, 6], offset: [0, 165], mat: 'concrete' }, { box: [518, 6], offset: [0, -165], mat: 'concrete' },
  ];
  const gl = reg(W.body({ type: 'dynamic', x: 540, y: gl0, vx: 5, shapes: glShapes, mass: 900000, angularDamping: .25, tag: 'greenleaf', mat: 'concrete', allowSleep: false, category: 4, mask: 1 }), { name: 'gl', origin: [540, gl0] });
  for (let i = 0; i < (opts.noRopes ? 0 : 4); i++) {
    const r = W.joint({ type: 'rope', a: hook, b: gl, anchorA: [SLING_DX[i], EYE_DY], anchorB: [SLING_DX[i], LUG_DY], segments: opts.segs || 6, length: SLING_L, mass: 9000, damping: .02, mat: 'metal', tag: 'cable', bend: 4, sleep: false });
    meta.ropes.push(r.id);
  }
  const link = W.joint({ type: 'weld', a: hook, b: gl, anchor: [540, gl0] });               /* a rigid link (no rope lag) until the first touch: the block's underside is exactly hook + 1384 */
  W.schedule(TC, w => { W.removeJoint(link); });
  W.schedule(3.421, w => { gl.vx += 9; });                                                  /* the load shifts as the cables creak */

  /* ---- the roof sign in two halves (board 190..266, legs to the ridge), the chimney, the weathervane, loose tile chips: category 2 (mask 3: they meet Fruit Bowl, the street and each other) */
  const sign = (id, x, w, text, legs) => {
    const shapes = [{ box: [w / 2, 38], mat: 'wood', friction: .6, restitution: .2 }].concat(legs.map(lx => ({ box: [9, 4], offset: [lx - x, 42], mat: 'wood' })));
    const b = W.body({ type: 'dynamic', x, y: SIGN_TOP + 38, shapes, density: .8, tag: 'sign', mat: 'wood', data: { id, text, w, h: 76 }, category: 2, mask: 3 });
    meta.parts['sign' + id] = b.id; return reg(b, { name: 'sign' + id, w, h: 76, text, x, y: SIGN_TOP + 38, legs });
  };
  sign('a', 350, 300, 'FRUIT BOWL', [240, 460]); sign('b', 690, 380, 'REHAB & NURSING', [540, 840]);
  const bricks = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const b = W.body({ type: 'dynamic', x: 886 + 11 + c * 22, y: RIDGE - 4.5 - r * 9, box: [11, 4.5], mat: 'concrete', density: 1.2, tag: 'chimney', friction: .7, restitution: .08, data: { i: r * 3 + c }, category: 2, mask: 3 }); bricks.push(reg(b, { name: 'brick', w: 22, h: 9, i: r * 3 + c })); }
  const cap = W.body({ type: 'dynamic', x: 919, y: RIDGE - 36 - 4.5, box: [40, 4.5], mat: 'concrete', density: 1.2, tag: 'chimney', friction: .7, category: 2, mask: 3 }); reg(cap, { name: 'cap', w: 80, h: 9 });
  const vane = W.body({ type: 'dynamic', x: 150, y: RIDGE - 19, shapes: [{ box: [2, 19], mat: 'metal' }, { box: [30, 3], offset: [0, -17], mat: 'metal' }], density: .6, tag: 'vane', mat: 'metal', category: 2, mask: 3 }); reg(vane, { name: 'vane' });
  meta.parts.cap = cap.id; meta.parts.vane = vane.id; meta.parts.bricks = bricks.map(b => b.id);
  const chips = [];
  for (let i = 0; i < 22; i++) { const x = 130 + ((i * 197) % 800), b = W.body({ type: 'dynamic', x, y: RIDGE - 2.5, box: [6 + (i % 3) * 2, 2], angle: ((i * 37) % 11 - 5) * .05, mat: 'ceramic', density: 1, tag: 'tile', friction: .6, restitution: .15, category: 2, mask: 0, allowSleep: true }); chips.push(reg(b, { name: 'chip', w: 12 + (i % 3) * 4, h: 4, i })); }
  meta.parts.chips = chips.map(b => b.id);

  /* ---- the top floor's props: [name, kind (drawn by S15.drawProp), room], y is the body centre; floor line 656, table tops 592 / 587, desk 578, bed 592 */
  const prop = (name, kind, room, def) => {
    if (opts.propFilter && !opts.propFilter(room, name, kind)) return null;
    const sp = { w: def.w, h: def.h, flip: def.flip }, d = Object.assign({}, def); delete d.w; delete d.h; delete d.flip;       /* w is the angular velocity in PHYS2D: keep the sprite's size out of the body definition */
    const b = W.body(Object.assign({ type: 'dynamic', mat: 'wood', friction: .55, restitution: .2, category: 1, mask: 1 | 2 }, d));
    meta.props.push(b.id); return reg(b, { name, kind, room, w: sp.w, h: sp.h, tag: def.tag, flip: sp.flip });
  };
  const T0 = 596, F = FLOOR_Y;
  if (!opts.noProps) {
  /* conference room (x 284..534): pizza boxes, papers and a fishbowl on the table; two chairs, a plant on the floor; the wall clock */
  for (let i = 0; i < 3; i++) prop('pizza' + i, 'pizza', 'conf', { x: 345 + (i % 2 ? 3 : -2), y: T0 - 4.5 - i * 9, box: [27, 4.5], mat: 'cardboard', tag: 'pizzabox', w: 54, h: 9 });
  prop('fishbowl', 'fishbowl', 'conf', { x: 488, y: T0 - 15, circle: 15, mat: 'glass', tag: 'fishbowl', w: 30, h: 30, restitution: .25 });
  for (let i = 0; i < 5; i++) prop('paper' + i, 'paper', 'conf', { x: 392 + (i % 2) * 2, y: T0 - 1, box: [11, 1], mat: 'fabric', tag: 'paper', w: 22, h: 2, linearDamping: .4, angularDamping: .6, group: -2 });
  for (const [i, x] of [[0, 448], [1, 462]]) prop('cmug' + i, 'mug', 'conf', { x, y: T0 - 5, box: [4.5, 5], mat: 'ceramic', tag: 'mug', w: 10, h: 10, restitution: .15 });
  prop('plant', 'plant', 'rest', { x: 748, y: F - 38, shapes: [{ box: [14, 13], offset: [0, 25], mat: 'ceramic' }, { circle: 22, offset: [0, -14], mat: 'fabric', density: .25 }], tag: 'plant', w: 56, h: 90 });
  const clock = prop('clock', 'clock', 'conf', { x: 402, y: 398, circle: 14, mat: 'plastic', tag: 'clock', w: 28, h: 28, gravityScale: 0, allowSleep: false, category: 8, mask: 1 });       /* hangs on the wall (no gravity) until the first touch, then it falls */
  /* office (x 22..272): a tray with two cups on the desk, a bucket, a fan, binders */
  prop('tray', 'tray', 'office', { x: 176, y: 574 - 2, box: [17, 2], mat: 'plastic', tag: 'tray', w: 34, h: 4 });
  for (let i = 0; i < 2; i++) prop('cup' + i, 'cup', 'office', { x: 168 + i * 16, y: 568 - 5.5, box: [4.5, 5.5], mat: 'ceramic', tag: 'cup', w: 9, h: 11, restitution: .15 });
  prop('bucket', 'bucket', 'office', { x: 52, y: F - 11, box: [8, 11], mat: 'metal', tag: 'bucket', w: 20, h: 24 });
  prop('fan', 'fan', 'office', { x: 98, y: F - 36, shapes: [{ box: [13, 3], offset: [0, 33], mat: 'metal' }, { box: [1.6, 22], offset: [0, 8], mat: 'metal' }, { circle: 14, offset: [0, -20], mat: 'plastic' }], tag: 'fan', w: 40, h: 72 });
  for (let i = 0; i < 6; i++) prop('binder' + i, 'binder', 'office', { x: (i >= 3 ? 205 : 240) + (i % 2 ? 2 : -2), y: F - 3.5 - (i % 3) * 7, box: [14, 3.2], mat: 'plastic', tag: 'binder', w: 30, h: 7 });
  /* break room (x 546..796): mugs and plates on the table, a stool */
  for (const [i, x] of [[0, 636], [1, 672], [2, 686]]) prop('mug' + i, 'mug', 'rest', { x, y: 592 - 5, box: [4.5, 5], mat: 'ceramic', tag: 'mug', w: 10, h: 10, restitution: .15 });
  for (let i = 0; i < 2; i++) prop('plate' + i, 'plate', 'rest', { x: 704, y: 592 - 1.5 - i * 3, box: [10, 1.5], mat: 'ceramic', tag: 'plate', w: 20, h: 3 });
  prop('stool', 'stool', 'rest', { x: 600, y: F - 20, shapes: [{ box: [14, 3], offset: [0, -17], mat: 'wood' }, { box: [2, 18], offset: [-10, 2], mat: 'wood' }, { box: [2, 18], offset: [10, 2], mat: 'wood' }], tag: 'chair', w: 30, h: 40 });
  /* Room 14 (x 808..1058): the IV pole, a pillow on the bed, a vase on the bedside table, a basin, slippers */
  prop('ivpole', 'ivpole', 'r14', { x: 868, y: F - 70, shapes: [{ box: [15, 2.5], offset: [0, 67.5], mat: 'metal' }, { box: [1.6, 66], offset: [0, 0], mat: 'metal' }, { box: [10, 7], offset: [0, -64], mat: 'plastic', density: .5 }], tag: 'ivpole', w: 34, h: 140, density: .6 });
  prop('pillow', 'pillow', 'r14', { x: 950, y: 592 - 6, box: [18, 5], mat: 'fabric', tag: 'pillow', w: 36, h: 10, restitution: .05 });
  prop('vase', 'vase', 'r14', { x: 835, y: F - 22, box: [8, 22], mat: 'glass', tag: 'vase', w: 16, h: 44 });
  prop('basin', 'basin', 'r14', { x: 1020, y: F - 4, box: [10, 4], mat: 'plastic', tag: 'basin', w: 20, h: 8 });
  for (let i = 0; i < 2; i++) prop('slipper' + i, 'slipper', 'r14', { x: 930 + i * 14, y: F - 3, box: [6, 3], mat: 'fabric', tag: 'slipper', w: 12, h: 6 });

  }
  /* ---- scripted life: the crush throws the roof furniture clear at the first touch (a little after it: the block's underside has just met the sign); a rattle in the top floor as the load comes down */
  const TL = meta.TL;
  W.schedule(TL, w => {
    const hit = (b, vx, vy, spin) => { b.vx = vx; b.vy = vy; b.w = spin; b.wake(); };
    hit(W.bodies[meta.parts.signa], -490, -330, -9.5); hit(W.bodies[meta.parts.signb], 430, -380, 8.2);        /* the two halves fly clear over the eaves (toward the camera) and land in the street beyond the frame of the wide settle shot */
    for (let i = 0; i < bricks.length; i++) { const r = Math.floor(i / 3), c = i % 3; hit(bricks[i], 150 + 60 * r + 40 * c + 30 * ((i * 7) % 5), -260 - 70 * r - 30 * ((i * 3) % 4), (c - 1) * 6 + (r % 2 ? 4 : -4)); }
    hit(cap, 330, -480, 7); hit(vane, -300, -420, -11);
    const ck = W.bodies[meta.props[meta.bodies.findIndex(b => b.name === 'clock') >= 0 ? 0 : 0]]; const cb = meta.bodies.find(b => b.name === 'clock'); if (cb) { const c = W.bodies[cb.id]; c.gscale = 1; c.vy = 60; c.w = 2.5; c.wake(); }
    for (let i = 0; i < chips.length; i++) { const b = chips[i]; b.mask = 3; hit(b, (i % 2 ? 1 : -1) * (120 + 40 * ((i * 5) % 7)), -150 - 30 * ((i * 3) % 6), ((i * 13) % 9 - 4) * 2.2); }
  });

  W.warmup(opts.warm || .6);
  W.run(opts.T || T_RUN, { sampleHz: 120 });
  return { world: W, T: T_SCENE, runT: W.T, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, z: .5 } }, sceneStart: 0, meta };
}
const api = { build, hookY, hookX, squat, consts: { TC, T_LOWER, HOOK0, HOOK_C, GL_CY_DOCK, SLING_DX, EYE_DY, LUG_DY, SLING_L, GL_H, RIDGE, SIGN_TOP, FLOOR_Y, CEIL_Y, T_SCENE, T_RUN, T_HIT } };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP15_SIMS = window.__EP15_SIMS || {}; window.__EP15_SIMS.dock = api; }
})();
