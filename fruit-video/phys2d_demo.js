'use strict';
/* phys2d_demo.js: three DOM-free demo simulations for PHYS2D (the shape of an `ep15_<scene>_sim.js` sim module):
 *   crane()   a crane lowers a heavy block of 12 rooms (4 x 3, three props in every room) onto a tower of 12 rooms; the block lands with a bang,
 *             props jump and some fall, the tower squats on springs (slider joints) and settles, the slings are released and whip
 *   jenga()   24 labelled boxes (an org chart) knocked over by a wrecking ball on a rope
 *   banner()  a banner rolled up under a roof edge unfurls in a breeze (cloth)
 * Each returns { world, T, screen: { w, h, cx, cam }, meta } where world has been built and warmed up but not run (the caller runs it).
 * Browser: window.PHYS2D_DEMO and window.__EP15_SIMS.physdemo_*;  node: module.exports (build() = crane()).
 * Units are canvas pixels (1080 x 1920); gravity 1800 px/s^2 (a dollhouse: 1 m is about 184 px). y points down. */
(function (root, factory) {
  const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : root.PHYS2D;
  const api = factory(P);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.PHYS2D_DEMO = api;
    root.__EP15_SIMS = root.__EP15_SIMS || {};
    root.__EP15_SIMS.physdemo_crane = { build: api.crane };
    root.__EP15_SIMS.physdemo_jenga = { build: api.jenga };
    root.__EP15_SIMS.physdemo_banner = { build: api.banner };
  }
})(typeof window !== 'undefined' ? window : null, function (PHYS2D) {

const G = 1800, GY = 1700;

// ---------------------------------------------------------------- the crane scene
function crane() {
  const w = PHYS2D.world({ gravity: [0, G], seed: 15 });
  w.feel.bounce = 1.7;                                     // cartoon: props bounce more than wood and ceramic really do
  const ground = w.floor(GY, { tag: 'ground', mat: 'concrete', friction: 0.8, category: 1 });
  w.body({ type: 'static', box: [30, 1500], x: -30, y: GY - 1500, tag: 'wall', mat: 'concrete', category: 1 });   // invisible walls keep the debris in the picture
  w.body({ type: 'static', box: [30, 1500], x: 1110, y: GY - 1500, tag: 'wall', mat: 'concrete', category: 1 });
  const CXT = 450, PITCH = 110, SL = 8, ROOM_H = PITCH - 2 * SL, DENS = 0.5;   // tower centre x, floor pitch, half slab, clear room height
  const ROOM_X = [-225, -75, 75, 225];
  const meta = { ground: GY, cx: CXT, pitch: PITCH, slab: SL, roomH: ROOM_H, floors: [], block: null, props: [], ropes: [], hook: null };

  function floorShapes(level, left, right, roof, partH) { // shapes of one floor at local y = -level * PITCH (a slab with its partitions standing on it)
    const y0 = -level * PITCH, sh = [{ box: [300, SL], offset: [0, y0], mat: 'concrete', density: DENS }], ph = partH || ROOM_H;
    for (const px of [-150, 0, 150]) sh.push({ box: [4, ph / 2], offset: [px, y0 - SL - ph / 2], mat: 'wood', density: DENS });
    // outer walls: full height on one side, a low parapet on the other (props that hop out of the building fall to the ground)
    sh.push({ box: [4, left ? ROOM_H / 2 : 13], offset: [-296, y0 - SL - (left ? ROOM_H / 2 : 13)], mat: 'wood', density: DENS });
    sh.push({ box: [4, right ? ROOM_H / 2 : 13], offset: [296, y0 - SL - (right ? ROOM_H / 2 : 13)], mat: 'wood', density: DENS });
    if (roof) sh.push({ box: [300, SL], offset: [0, y0 - PITCH], mat: 'concrete', density: DENS });
    return sh;
  }
  // the lower tower: three floors on springs
  const floors = [];
  for (let k = 0; k < 3; k++) {
    const y = GY - SL - k * PITCH;
    // floor 0 is the foundation (static); floors 1 and 2 sit on springs
    const b = w.body({ type: k === 0 ? 'static' : 'dynamic', shapes: floorShapes(0, k === 0, k !== 1, false, k === 1 ? 46 : 0), x: CXT, y, group: -7, tag: 'room', mat: 'wood', data: { kind: 'floor', k } });
    floors.push(b); meta.floors.push({ body: b, k, y });
  }
  // the block: three floors fused into one rigid body, with a roof; it starts 260 px above the tower
  const GAP = 260, HOFF = 9;
  const topFloorTop = GY - SL - 2 * PITCH - SL - ROOM_H;                // top of the partitions of floor 2
  const blockY = topFloorTop - SL - GAP;                                  // centre of the block's bottom slab at the start
  let bsh = [];
  for (let k = 0; k < 3; k++) bsh = bsh.concat(floorShapes(k, k !== 1, k === 1, k === 2));
  const block = w.body({ type: 'dynamic', shapes: bsh.map(s => Object.assign(s, { density: DENS * 1.5 })), x: CXT - HOFF, y: blockY, angle: 0.0, tag: 'block', mat: 'wood', data: { kind: 'block' } });
  meta.block = { body: block, y0: blockY };
  // props: a chair, a tray and a plant pot in every room
  const PD = 0.12;
  function prop(kind, x, y, extra) {
    let shapes, mat;
    if (kind === 'chair') { shapes = [{ box: [14, 3], offset: [0, 0], mat: 'wood', density: PD * 1.2 }, { box: [2.5, 15], offset: [-11.5, -18], mat: 'wood', density: PD * 1.2 }, { box: [2.5, 10], offset: [-8, 13], mat: 'wood', density: PD * 1.2 }, { box: [2.5, 10], offset: [8, 13], mat: 'wood', density: PD * 1.2 }]; }
    else if (kind === 'tray') { shapes = [{ box: [20, 3], offset: [0, 0], mat: 'metal', density: PD * 1.5 }]; }
    else { shapes = [{ poly: [[-13, -12], [13, -12], [9, 12], [-9, 12]], offset: [0, 0], mat: 'ceramic', density: PD * 2 }, { circle: 12, offset: [0, -22], mat: 'fabric', density: PD * 0.5 }]; }
    const jx = (w.rand() - 0.5) * 10, ja = (w.rand() - 0.5) * 0.06, jf = 0.3 + 0.3 * w.rand(), jr = 0.3 + 0.3 * w.rand();
    shapes.forEach(s => { s.friction = jf; s.restitution = kind === 'tray' ? jr * 0.7 : jr; });
    return w.body(Object.assign({ type: 'dynamic', shapes, x: x + jx, y: y - 0.3, angle: ja, tag: kind === 'tray' ? 'tray' : (kind === 'pot' ? 'pot' : 'chair'), category: 4, data: { kind } }, extra || {}));
  }
  function stock(level, baseY, owner) { // baseY = top surface of the slab of this level
    for (let i = 0; i < 4; i++) {
      const cx = CXT + ROOM_X[i];
      const chairFaces = (i + level) % 2 ? 1 : -1;
      const items = [['chair', cx - 42 * chairFaces, baseY - 23.5], ['tray', cx + 8 * chairFaces, baseY - 3.6], ['pot', cx + 46 * chairFaces, baseY - 12.4]];
      for (const it of items) { const p = prop(it[0], it[1], it[2]); p.data.room = { owner, level, i }; meta.props.push(p); }
    }
  }
  for (let k = 0; k < 3; k++) stock(k, GY - 2 * SL - k * PITCH, 'tower');                 // slab top of floor k
  for (let k = 0; k < 3; k++) stock(k, blockY - SL - k * PITCH, 'block');
  // springs: each floor slides vertically on the one below (a spring with damping and a bump stop)
  const mass = b => b.mass;
  const propsAbove = y => meta.props.reduce((s, p) => s + (p.y < y ? mass(p) : 0), 0);
  const SQUAT = 9;                                                           // static squat of each spring in px
  for (let k = 1; k < 3; k++) {
    const above = floors.slice(k).reduce((s, b) => s + mass(b), 0) + mass(block) + propsAbove(floors[k].y + 5);
    const kk = above * G / SQUAT, cc = 2 * 0.17 * Math.sqrt(kk * above);
    const tilt = (k === 1 ? 1 : -1) * 0.30;                                 // the floors zigzag as they squat: props get a sideways jolt too
    w.joint({ type: 'slider', a: floors[k - 1], b: floors[k], anchor: [CXT, floors[k].y], axis: [Math.sin(tilt), -Math.cos(tilt)], stiffness: kk, damping: cc, lower: -52, upper: 4, tag: 'spring' });
  }
  // the crane: a kinematic hook, two slings of 20 segments each
  const A = 520, T1 = 1.25, V1 = A * T1, S1 = 0.5 * A * T1 * T1, T2 = 0.4, S2 = V1 * T2 / 2, TUP = 4.6, B = 4500;
  const anchorY = blockY - 3 * PITCH - SL;                                  // block roof top
  const hookY0 = anchorY - 520;
  const hookS = t => { // distance travelled downwards
    if (t <= 0) return 0;
    if (t <= T1) return 0.5 * A * t * t;
    if (t <= T1 + T2) { const u = t - T1; return S1 + V1 * u - 0.5 * (V1 / T2) * u * u; }
    const hold = S1 + S2;
    if (t <= TUP) return hold;
    const u = t - TUP; return hold - 0.5 * B * u * u;
  };
  // the hook hangs 9 px off the block's centre, so the block hangs tilted and lands on one corner, then slams flat
  const hook = w.body({ type: 'kinematic', box: [14, 10], x: CXT, y: hookY0, category: 8, mask: 0, tag: 'hook', mat: 'metal', pose: t => ({ x: CXT, y: hookY0 + hookS(t) }) });
  meta.hook = { body: hook, y0: hookY0, travel: hookS };
  const slings = [-1, 1].map(sd => w.joint({ type: 'rope', a: hook, b: block, anchorA: [sd * 9, 8], anchorB: [sd * 250, -3 * PITCH - SL - 3], segments: 20, tag: 'cable', mat: 'metal', radius: 2.5, collide: true, category: 2, mask: 1, bend: 3 }));
  meta.ropes = slings;
  w.schedule(TUP - 0.05, () => { slings.forEach(r => r.releaseB()); });       // the slings are let go; the hook whips them up
  w.warmup(1.3);
  return { world: w, T: 9, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, zoom: 1 } }, meta };
}

// ---------------------------------------------------------------- the Jenga scene
const ORG = ['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CHRO', 'VP Ops', 'VP Care', 'VP Meals', 'VP Linen', 'Dir Nursing', 'Dir Intake', 'Mgr Days', 'Mgr Eves', 'Mgr Nights', 'Lead A', 'Lead B', 'Lead C', 'Nurse 1', 'Nurse 2', 'Nurse 3', 'CNA 1', 'CNA 2', 'Intern'];
function jenga() {
  const w = PHYS2D.world({ gravity: [0, G], seed: 7 });
  w.floor(GY, { tag: 'ground', mat: 'concrete', friction: 0.8 });
  w.body({ type: 'static', box: [40, 400], x: 1100, y: GY - 400, tag: 'wall', mat: 'concrete' });   // a wall just outside the picture keeps the debris in it
  const CXT = 700, BW = 124, BH = 40, LEVELS = 8, R = 50, L = 580, TH = 31 * Math.PI / 180, meta = { ground: GY, boxes: [], ball: null, rope: null, labels: ORG, BW, BH, R };
  let n = 0;
  for (let l = 0; l < LEVELS; l++) for (let i = 0; i < 3; i++) {     // a brick-bond tower: every other level is shifted by half a box
    const x = CXT + (i - 1) * (BW + 1) + (l % 2 ? -BW / 2 : 0), y = GY - BH / 2 - l * (BH + 0.5) - 0.25;
    const b = w.body({ type: 'dynamic', box: [BW / 2, BH / 2], x, y, mat: l % 3 === 0 ? 'cardboard' : 'wood', tag: 'box', friction: 0.55, density: 0.7, data: { label: ORG[n], level: l } });
    meta.boxes.push(b); n++;
  }
  // wrecking ball: a kinematic hook, a rope of 20 segments, a heavy steel ball (30 boxes' worth) swinging in from the left, hitting the top third of the tower
  const hookX = CXT - 2 * BW - 1 - R + 20, hookY = GY - 5.2 * BH - L;
  const hook = w.body({ type: 'kinematic', box: [10, 10], x: hookX, y: hookY, mask: 0, category: 8, tag: 'hook', pose: () => ({ x: hookX, y: hookY }) });
  const ball = w.body({ type: 'dynamic', circle: R, x: hookX - L * Math.sin(TH), y: hookY + L * Math.cos(TH), density: 14, mat: 'metal', tag: 'ball', data: { kind: 'ball' } });
  const rope = w.joint({ type: 'rope', a: hook, b: ball, segments: 20, length: L, tag: 'cable', mat: 'metal', radius: 2.5, bend: 3 });
  meta.ball = ball; meta.rope = rope; meta.hook = hook; meta.hookX = hookX; meta.hookY = hookY;
  return { world: w, T: 7, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, zoom: 1 } }, meta };
}

// ---------------------------------------------------------------- the banner scene
function banner() {
  const w = PHYS2D.world({ gravity: [0, G], seed: 3 });
  const roof = w.body({ type: 'static', box: [330, 24], x: 540, y: 620, mat: 'concrete', tag: 'roof' });
  const BW = 400, BH = 700, x0 = 540 - BW / 2, y0 = 644;
  const cloth = w.cloth({ x: x0, y: y0, width: BW, height: BH, cols: 11, rows: 20, wind: { z: 100, x: 30, gust: 500, hz: 0.45, k: 0.006 }, unroll: { t0: 0.7, dur: 1.5, r0: 17, snap: 0.3 }, iterations: 8, windGain: 2.6, drag: 0.2, wallZ: 0 });
  const meta = { cloth, roof, x0, y0, BW, BH };
  return { world: w, T: 8, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, zoom: 1 } }, meta };
}

return { crane, jenga, banner, build: crane, G, GY };
});
