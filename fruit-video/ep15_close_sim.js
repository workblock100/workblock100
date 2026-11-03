'use strict';
/* SHIFT HAPPENS, Episode 15, scene `close` (26.09 s, 6:00 PM, THE CLOSING): the DOM-free physics (E15-A). window.__EP15_SIMS.close = { build } and module.exports = { build }.
 * build() -> { world, T, screen: { w: 1080, h: 1920, cx: 540, cam }, sceneStart: 0, meta }. Deterministic (no Math.random, no clock); the scene samples world.at(lt) and never steps.
 * Units are tower pixels (S15 / S14 coordinates, y down), gravity 1100 px/s^2 like the dock scene. With the tower sunk one floor (sink 1) the Fruit Bowl / Greenleaf seam is at y 604 and the street at y 1342.
 * What is simulated:
 *   - THE BANNER: a verlet cloth (PHYS2D cloth, 3D: x, y and z toward the viewer) 1100 x 520 hung from a bar (kinematic, it sways like the end of two taut cables from the crane's hook), rolled up on the bar
 *     at the start and unrolled from 0.30 s to 1.45 s (the roll falls like a yo-yo and snaps), then a breeze keeps it moving. The scene draws the mesh, the roll, the bar and the cables.
 *   - THE TOSS (beat b1, 'Tossed!' at 7.10 s): lettuce leaves (convex polygons, fabric) and ID badges (boxes, plastic) are flung up by Binder's tongs from the staff group and rain down on the street (y 1342):
 *     their landings are the foley events of the scene (leaf on concrete, badge on concrete). */
(function () {
const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : (typeof window !== 'undefined' ? window.PHYS2D : null);
if (!P) return;

const G = 1100, T_RUN = 26.09, GROUND = 1342;
const BAR = { x: 540, y: 410, w: 1100 }, BANNER = { w: 1100, h: 520 }, HOOK = [540, -1000];
const UNROLL = { t0: .30, dur: 1.15, r0: 15, snap: .3 };
const TOSS_T = 7.10;
const sin = P.sin, cos = P.cos;
const TAU = 6.283185307179586;

/* the bar's scripted pose: a slow pendulum sway of the two cables (the hook is fixed, the cables keep their length: the bar rides an arc) */
function barPose(t) {
  const k = t < 1.3 ? 0 : (t > 2.6 ? 1 : (t - 1.3) / 1.3), a = k * k * (3 - 2 * k);
  const s = sin(TAU * t / 5.3 + .4), s2 = sin(TAU * t / 3.7 + 1.9);
  return { x: BAR.x + a * 16 * s, y: BAR.y + a * (3 * s2 - 1.5 * s * s), angle: a * .011 * sin(TAU * t / 5.3 + 1.1) };
}

function build(opts) {
  opts = opts || {};
  const W = P.world({ gravity: [0, G], dt: 1 / 240, seed: 15, materials: { fabric: { density: .2, friction: .9, restitution: .02 }, plastic: { density: .6, friction: .4, restitution: .3 } }, feel: { bounce: 1.1, soft: 0 } });
  const meta = { bar: null, cloth: null, items: [], tossT: TOSS_T, hook: HOOK, banner: BANNER, barDef: BAR, unroll: UNROLL, ground: GROUND };

  W.floor(GROUND, { x: 540, halfWidth: 3000, mat: 'concrete', tag: 'ground', friction: .8 });

  /* ---- the banner bar (kinematic) and the cloth pinned to it */
  const bar = W.body({ type: 'kinematic', box: [BAR.w / 2 + 14, 9], x: BAR.x, y: BAR.y, pose: barPose, tag: 'bar', mat: 'wood', category: 8, mask: 0 });
  const cloth = W.cloth({
    x: BAR.x - BANNER.w / 2, y: BAR.y + 9, width: BANNER.w, height: BANNER.h, cols: 15, rows: 9, body: bar,
    wind: { z: 64, x: 22, gust: 120, hz: .46, k: .0062, gain: 2.4 }, unroll: UNROLL, iterations: 4, drag: .62, hem: 2.2, maxStretch: .02,
  });
  meta.bar = bar.id; meta.cloth = 0;

  /* ---- the toss: the tongs fling lettuce and badges up from the group at 'Tossed!'. Until then the items sleep in mid air (a sleeping body is not integrated and nothing touches it) and are not drawn. */
  const R = P.rng(777), GX0 = 150, GX1 = 760, GY0 = 1170;
  const leaves = 26, badges = 9;
  for (let i = 0; i < leaves; i++) {
    const x = GX0 + (GX1 - GX0) * R(), s = 10 + 8 * R(), a0 = R() * TAU;
    const pts = [[-s * 1.1, 0], [-s * .5, -s * .8], [s * .4, -s * .9], [s * 1.2, -s * .1], [s * .5, s * .7], [-s * .6, s * .6]];
    const b = W.body({ type: 'dynamic', poly: pts, x, y: GY0 + 30 * R(), angle: a0, mat: 'fabric', density: .25, friction: .9, restitution: .05, tag: 'leaf', category: 4, mask: 1 | 4, data: { kind: 'leaf', i, s, hue: R() } });
    b.awake = false; meta.items.push(b.id);
  }
  for (let i = 0; i < badges; i++) {
    const x = GX0 + 20 + (GX1 - GX0 - 40) * (i + R() * .6) / badges, y = GY0 + 60 + 20 * R();
    const b = W.body({ type: 'dynamic', box: [10, 14], x, y, angle: (R() - .5) * .3, mat: 'plastic', density: .5, friction: .5, restitution: .35, tag: 'badge', category: 4, mask: 1 | 4, data: { kind: 'badge', i, hue: R() } });
    b.awake = false; meta.items.push(b.id);
  }
  W.schedule(TOSS_T, w => {
    const rr2 = P.rng(4242);
    for (const id of meta.items) {
      const b = w.bodies[id], u = (b.x - GX0) / (GX1 - GX0);
      b.vx = (u - .45) * 260 + (rr2() - .5) * 200; b.vy = -(780 + 620 * rr2()); b.w = (rr2() - .5) * 18; b.wake();
    }
  });

  W.run(opts.T || T_RUN, { sampleHz: 60 });
  return { world: W, T: W.T, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, z: .6 } }, sceneStart: 0, meta };
}
const api = { build, barPose, consts: { G, T_RUN, GROUND, BAR, BANNER, HOOK, UNROLL, TOSS_T } };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP15_SIMS = window.__EP15_SIMS || {}; window.__EP15_SIMS.close = api; }
})();
