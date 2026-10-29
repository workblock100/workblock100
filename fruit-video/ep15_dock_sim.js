'use strict';
/* SHIFT HAPPENS, Episode 15, scene `dock`: the DOM-free physics of the merge (E15-K). window.__EP15_SIMS.dock = { build } and module.exports = { build }.
 * The crane hook (kinematic) lowers the Greenleaf block (a heavy compound body) on four cable ropes onto Fruit Bowl's roof: the hook follows a scripted descent built BACKWARDS from the contact so that the block's
 * first touch (the roof sign's top edge) is at scene time 5.821 s (the `dockimpact` cue); the Fruit Bowl block is a dynamic body on a slider spring (the squat); the roof sign (two halves), the chimney (bricks), the
 * weathervane and the top floor's props are dynamic bodies. Tower coordinates are S15's (ep15_house.js): ground 1342, ridge cap 274, top floor floor line 656.
 * build() -> { world, T, screen: { w: 1080, h: 1920, cx: 540, cam }, sceneStart: 0, meta } ; meta describes every body for the scene's sprites (kind, size, sprite offset) and the fixed numbers (hook path, lugs).
 * Deterministic (no Math.random, no clock); the scene samples world.at(lt) and never steps. */
(function () {
const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : (typeof window !== 'undefined' ? window.PHYS2D : null);

const G = 1100, T_RUN = 32.38, TC = 5.821, T_LOWER = 2.221;
const GL_H = 1002, GL_DOCK_BOT = 274, GL_CY_DOCK = GL_DOCK_BOT - GL_H / 2;      /* -227 */
const SIGN_TOP = 190, RIDGE = 274, FLOOR_Y = 656, CEIL_Y = 380;
const SLING_DX = [-400, -140, 140, 400], EYE_DY = 109, LUG_DY = -523, SLING_L = 251;
const HOOK_TO_UNDER = EYE_DY + SLING_L + 22 + GL_H;                                    /* hook centre to the block's underside when the slings hang taut: 1384 */
const HOOK_C = SIGN_TOP - HOOK_TO_UNDER;                                               /* hook centre y at first contact: -1194 */
const V1 = 83.75, A_SLIP = 1100, TAU_SLIP = .4, EASE = .8;                              /* the winch slips for the last 0.4 s: the block drops 127 px and meets the sign at 524 px/s */
const FB_HZ = 2.76;
const SLACK_END = 30;                                                                    /* the slings end this slack (px) after the whip */
const HOOK0 = HOOK_C - (V1 * (EASE / 2 + (TC - TAU_SLIP - T_LOWER - EASE)) + V1 * TAU_SLIP + .5 * A_SLIP * TAU_SLIP * TAU_SLIP);   /* where the hook starts so that it is at HOOK_C at TC */

/* the hook's centre y at scene time t (a scripted, backwards-built path). The block lags the hook by about 26 ms when the winch slips (the slings have to go slack first), so the path runs CAL seconds early:
 * the block's underside meets the sign's top edge at TC (verified by build/ep15_k/simtest.js). */
const CAL = .026;
function hookY(tt) {
  const t = tt + CAL, u = t - T_LOWER, ts = TC - TAU_SLIP;
  if (u <= 0) return HOOK0;
  if (u < EASE) return HOOK0 + V1 * u * u / (2 * EASE);
  const yS = HOOK0 + V1 * (EASE / 2 + (ts - T_LOWER - EASE));
  if (t < ts) return HOOK0 + V1 * (EASE / 2 + (u - EASE));
  if (t < TC) { const d = t - ts; return yS + V1 * d + .5 * A_SLIP * d * d; }
  const vC = V1 + A_SLIP * TAU_SLIP, d = t - TC, yC = HOOK_C;
  const dRoof = RIDGE - SIGN_TOP + 10, tRoof = dRoof / vC;                                    /* the hook keeps going at full speed until the block meets the ridge cap (84 px later), then the brake bites */
  const tBrake = .28, yStop = yC + dRoof + .5 * vC * tBrake;
  if (d < tRoof) return yC + vC * d;
  if (d < tRoof + tBrake) { const e = d - tRoof; return yC + dRoof + vC * e - .5 * (vC / tBrake) * e * e; }
  if (t < 6.45 + CAL) return yStop;
  const k = Math.min(1, (t - 6.45 - CAL) / .12), e = k * k * (3 - 2 * k);                       /* the winch hauls the slack: the slings whip */
  return yStop - (yStop - (yC + dRoof + SLACK_END)) * e;
}

function build(opts) {
  opts = opts || {};
  const W = P.world({ gravity: [0, G], dt: 1 / 240, seed: 15, materials: { wood: { density: 0.8, friction: 0.55, restitution: 0.18 } }, feel: { bounce: 1.1, soft: 0 } });
  const meta = { bodies: [], hookY0: HOOK0, hookC: HOOK_C, TC, lugs: SLING_DX, sling: SLING_L, ropes: [], props: [], parts: {} };
  const reg = (b, info) => { meta.bodies.push(Object.assign({ id: b.id }, info)); return b; };

  /* ---- the street */
  W.floor(1342, { x: 540, halfWidth: 3000, mat: 'concrete', tag: 'ground' });

  /* ---- Fruit Bowl: one body (fixed rotation) on a slider spring: ridge cap and roof slopes, the top floor's ceiling, floor, outer walls and doorway lintels */
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
    sh(409, 598, 95, 6, 'wood'), sh(670, 592, 44, 5, 'wood'), sh(808 + 162, 600, 46, 8, 'wood'), sh(808 + 95, 585, 15, 3, 'wood'), sh(22 + 160, 578, 92, 4, 'wood'),
  ];
  const SAG0 = G / Math.pow(2 * Math.PI * FB_HZ, 2);                                    /* the building's own weight compresses its spring this much: start higher so that it rests at the nominal position */
  const fb = reg(W.body({ type: 'dynamic', x: FO[0], y: FO[1] - SAG0, shapes: fbShapes, mass: 500000, fixedRotation: true, tag: 'fruitbowl', mat: 'concrete', allowSleep: false }), { name: 'fb', origin: FO });
  W.joint({ type: 'slider', a: W.ground, b: fb, anchor: FO, axis: [0, 1], hz: FB_HZ, ratio: .3, lower: -80, upper: 110 });

  /* ---- the hook (kinematic: the path above) and the Greenleaf block */
  const hook = reg(W.body({ type: 'kinematic', x: 540, y: HOOK0, pose: t => ({ x: 540, y: hookY(t), angle: 0 }), tag: 'hook', silent: true }), { name: 'hook' });
  const gl0 = HOOK0 + HOOK_TO_UNDER - GL_H / 2;                                          /* the block's centre at t = 0 */
  const glShapes = [
    { box: [530, 6], offset: [0, 495], mat: 'concrete', friction: .6, restitution: .05 }, { box: [530, 6], offset: [0, -495], mat: 'concrete' },
    { box: [6, 489], offset: [-524, 0], mat: 'concrete' }, { box: [6, 489], offset: [524, 0], mat: 'concrete' }, { box: [518, 6], offset: [0, 165], mat: 'concrete' }, { box: [518, 6], offset: [0, -165], mat: 'concrete' },
  ];
  const gl = reg(W.body({ type: 'dynamic', x: 540, y: gl0, vx: 5, shapes: glShapes, mass: 900000, angularDamping: .25, tag: 'greenleaf', mat: 'concrete', allowSleep: false, category: 4, mask: 1 }), { name: 'gl', origin: [540, gl0] });
  for (let i = 0; i < 4; i++) {
    const r = W.joint({ type: 'rope', a: hook, b: gl, anchorA: [SLING_DX[i], EYE_DY], anchorB: [SLING_DX[i], LUG_DY], segments: 12, length: SLING_L, mass: 9000, damping: .02, mat: 'metal', tag: 'cable', bend: 4, sleep: false });
    meta.ropes.push(r.id);
  }
  W.schedule(3.421, w => { gl.vx += 9; });                                                  /* the load shifts as the cables creak */

  /* ---- the roof sign in two halves, the chimney, the weathervane, loose tile chips */
  const sign = (id, x, w, text, legs) => {
    const shapes = [{ box: [w / 2, 38], mat: 'wood', friction: .6, restitution: .2 }].concat(legs.map(lx => ({ box: [9, 4], offset: [lx - x, 42], mat: 'wood' })));
    const b = W.body({ type: 'dynamic', x, y: SIGN_TOP + 38, shapes, density: .8, tag: 'sign', mat: 'wood', data: { id, text, w, h: 76 }, category: 2, mask: 3 });
    meta.parts['sign' + id] = b.id; return reg(b, { name: 'sign' + id, w, h: 76, text, x, y: SIGN_TOP + 38 });
  };
  sign('a', 350, 300, 'FRUIT BOWL', [240, 460]); sign('b', 690, 380, 'REHAB & NURSING', [540, 840]);
  const bricks = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const b = W.body({ type: 'dynamic', x: 886 + 11 + c * 22, y: RIDGE - 4.5 - r * 9, box: [11, 4.5], mat: 'concrete', density: 1.2, tag: 'chimney', friction: .7, restitution: .08, data: { i: r * 3 + c }, category: 2, mask: 3 }); bricks.push(reg(b, { name: 'brick', w: 22, h: 9, i: r * 3 + c })); }
  const cap = W.body({ type: 'dynamic', x: 919, y: RIDGE - 36 - 4.5, box: [40, 4.5], mat: 'concrete', density: 1.2, tag: 'chimney', friction: .7, category: 2, mask: 3 }); reg(cap, { name: 'cap', w: 80, h: 9 });
  const vane = W.body({ type: 'dynamic', x: 150, y: RIDGE - 19, shapes: [{ box: [2, 19], mat: 'metal' }, { box: [30, 3], offset: [0, -17], mat: 'metal' }], density: .6, tag: 'vane', mat: 'metal', category: 2, mask: 3 }); reg(vane, { name: 'vane' });
  meta.parts.cap = cap.id; meta.parts.vane = vane.id; meta.parts.bricks = bricks.map(b => b.id);

  /* the crush: at the block's first touch the roof furniture is thrown clear (toward the camera and outward: the scene draws it in front of everything); the physics takes over from there */
  const TL = TC + .012;
  W.schedule(TL, w => {
    const hit = (b, vx, vy, spin) => { b.vx = vx; b.vy = vy; b.w = spin; b.wake(); };
    const sa = W.bodies[meta.parts.signa], sb = W.bodies[meta.parts.signb];
    hit(sa, -430, -330, -9.5); hit(sb, 380, -380, 8.2);
    for (let i = 0; i < bricks.length; i++) { const r = Math.floor(i / 3), c = i % 3; hit(bricks[i], 150 + 60 * r + 40 * c + 30 * ((i * 7) % 5), -260 - 70 * r - 30 * ((i * 3) % 4), (c - 1) * 6 + (r % 2 ? 4 : -4)); }
    hit(cap, 330, -480, 7); hit(vane, -300, -420, -11);
  });

  W.warmup(1.2);
  W.run(opts.T || T_RUN, { sampleHz: 120 });
  return { world: W, T: W.T, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, z: .5 } }, sceneStart: 0, meta };
}
const api = { build, hookY, consts: { TC, T_LOWER, HOOK0, HOOK_C, GL_CY_DOCK, SLING_DX, EYE_DY, LUG_DY, SLING_L, GL_H, RIDGE, SIGN_TOP, FLOOR_Y, CEIL_Y } };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP15_SIMS = window.__EP15_SIMS || {}; window.__EP15_SIMS.dock = api; }
})();
