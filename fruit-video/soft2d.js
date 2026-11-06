/* soft2d.js : deterministic, dependency-free soft-body library for SHIFT HAPPENS (Episode 22).
 * Browser: window.SOFT2D (nothing else global).   Node: module.exports.   Guide: GUIDE_SOFT.md.   Tests: node soft2d_test.js
 * Design: position-based dynamics (XPBD, "small steps"): every world step of dt is split into `iterations` substeps, each
 * substep integrates the particles, applies the pins, solves every distance / area / shape constraint once (Gauss-Seidel,
 * alternating sweep direction) and projects the particles out of the colliders with Coulomb friction.
 * Particles are 3D (z points at the viewer): cloth can drape over a box in depth and torn scraps flutter (a front view
 * draws x, y; z sorts, shades and, with `view`, tilts). Ropes and balloons live in a plane (z constant).
 * Determinism: only + - * / sqrt floor and integer maths in the solver (own sin/cos, own PRNG): no Math.random, no clock,
 * no Math.sin/cos/atan2/pow/exp. The same code and seed give bit-identical results in node and the browser.
 * Units: scene pixels, y down, seconds; angles in radians, clockwise on screen (the ctx.rotate direction).
 *
 * ADDED to the SOFT22_API contract (names there are unchanged):
 *   cloth: plane:'xy'|'xz' (a sheet in the screen plane, or a horizontal sheet: width along x, height along z), z (depth of
 *     the sheet or of its back row), cx/cy (centre instead of the top-left x, y), damping, flutter (air drag on the sheet's
 *     normal: scraps glide and tumble), gravityScale, sticky; pin targets { obj:id, index } (follow another object's particle)
 *   collider: z, depth (a finite slab in z; default infinite), side (wall: +1 free space to the right, -1 to the left),
 *     sticky (tape sticks to it), silent
 *   world: wind:[x,y,z], substeps are `iterations`; w.unpin(id, index), w.setPressure(id, p), w.release(id) (all pins off),
 *     w.object(id), w.colliderPose(id, t), w.makeState(), state.colliders[{id,x,y,angle}], state cloth z (Float32Array)
 *   SOFT2D.project(x, y, z, view), SOFT2D.materials, SOFT2D.rng, SOFT2D.version
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (root) root.SOFT2D = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null), function () {
'use strict';

const PI = 3.141592653589793, TWO_PI = 6.283185307179586, HALF_PI = 1.5707963267948966;
const INF = Infinity;

// ---------------------------------------------------------------- deterministic maths (same as phys2d.js)
let _sn = 0, _cs = 1;
function sincos(a) {
  if (a > PI || a < -PI) a -= TWO_PI * Math.floor((a + PI) / TWO_PI);
  let sg = 1;
  if (a > HALF_PI) { a = PI - a; sg = -1; } else if (a < -HALF_PI) { a = -PI - a; sg = -1; }
  const x2 = a * a;
  _sn = a * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800 + x2 * (1 / 6227020800 + x2 * (-1 / 1307674368000 + x2 * (1 / 355687428096000)))))))));
  _cs = sg * (1 + x2 * (-1 / 2 + x2 * (1 / 24 + x2 * (-1 / 720 + x2 * (1 / 40320 + x2 * (-1 / 3628800 + x2 * (1 / 479001600 + x2 * (-1 / 87178291200 + x2 * (1 / 20922789888000)))))))));
}
function fsin(a) { sincos(a); return _sn; }
function fcos(a) { sincos(a); return _cs; }
/* mulberry32: integer maths only, identical everywhere */
function makeRng(seed) {
  let s = (seed | 0) || 1;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function num(v, d) { return (typeof v === 'number' && v === v) ? v : d; }

// ---------------------------------------------------------------- materials
/* Soft materials: friction (Coulomb), stretch / shear / bend softness (0 = rigid; 1 = a cell strains about 100 % under its own
 * weight, so 0.01 is stiff and 1 is floppy), damping (air drag on every particle, 1/s), flutter (drag on a sheet's normal,
 * 1 = a flat sheet falls at about g / 6), thickness (collision radius, px), tear (default break strain when tear:true), crinkle
 * (paper crinkle events), sticky (tape). Collider materials only need friction (the sound keys on the names). */
const MATERIALS = {
  paper:   { friction: 0.45, stretch: 0, shear: 0.002, bend: 0.03, damping: 0.8, flutter: 1.0, thickness: 1.5, tear: 1.25, crinkle: 1 },
  chux:    { friction: 0.75, stretch: 0.001, shear: 0.01, bend: 0.35, damping: 1.6, flutter: 0.45, thickness: 3, tear: 1.6 },
  fabric:  { friction: 0.8, stretch: 0.003, shear: 0.03, bend: 0.9, damping: 1.4, flutter: 0.6, thickness: 2.5, tear: 1.8 },
  canvas:  { friction: 0.8, stretch: 0, shear: 0.01, bend: 0.08, damping: 1.4, flutter: 0.25, thickness: 3, tear: 2 },
  ribbon:  { friction: 0.25, stretch: 0, shear: 0.02, bend: 0.35, damping: 0.9, flutter: 0.8, thickness: 1.5, tear: 1.6 },
  tape:    { friction: 0.9, stretch: 0, shear: 0.01, bend: 0.2, damping: 1.0, flutter: 0.6, thickness: 1.2, tear: 1.3, sticky: 1 },
  tinsel:  { friction: 0.4, stretch: 0, shear: 0.05, bend: 3, damping: 0.8, flutter: 1.2, thickness: 4, tear: 2 },
  nitrile: { friction: 0.9, stretch: 0.02, shear: 0.05, bend: 0.15, damping: 1.0, flutter: 0.4, thickness: 2, tear: 2 },
  string:  { friction: 0.5, stretch: 0, shear: 0.05, bend: 6, damping: 0.8, flutter: 0.5, thickness: 1, tear: 2 },
  // collider materials
  default: { friction: 0.5 }, wood: { friction: 0.55 }, metal: { friction: 0.35 }, cardboard: { friction: 0.7 }, plastic: { friction: 0.4 },
  glass: { friction: 0.25 }, ceramic: { friction: 0.4 }, rubber: { friction: 0.95 }, concrete: { friction: 0.7 }, skin: { friction: 0.8 }, felt: { friction: 0.85 }
};

// ---------------------------------------------------------------- colliders
const C_BOX = 1, C_CIRCLE = 2, C_CAPSULE = 3, C_POLY = 4, C_FLOOR = 5, C_CEIL = 6, C_WALL = 7;
function Collider(W, def, id) {
  this.id = id; this.world = W;
  this.tag = def.tag || 'collider'; this.mat = def.mat || 'default';
  const m = W.mats[this.mat] || MATERIALS.default;
  this.friction = num(def.friction, m.friction != null ? m.friction : 0.5);
  this.skin = num(def.skin, 0);
  this.sticky = !!def.sticky; this.silent = !!def.silent;
  this.x = num(def.x, 0); this.y = num(def.y, 0); this.angle = num(def.angle, 0);
  this.zc = num(def.z, 0);
  const depth = def.depth != null ? +def.depth : INF;
  this.hd = depth === INF ? INF : depth / 2;
  this.pose = typeof def.pose === 'function' ? def.pose : null;
  this.hw = 0; this.hh = 0; this.r = 0; this.hl = 0; this.Y = 0; this.X = 0; this.side = 1;
  if (def.floor != null) { this.type = C_FLOOR; this.Y = +def.floor; this.hd = INF; }
  else if (def.ceiling != null) { this.type = C_CEIL; this.Y = +def.ceiling; this.hd = INF; }
  else if (def.wall != null) { this.type = C_WALL; this.X = +def.wall; this.side = def.side != null ? (def.side < 0 ? -1 : 1) : (this.X < 540 ? 1 : -1); this.hd = INF; }
  else if (def.box) { this.type = C_BOX; this.hw = +def.box[0]; this.hh = +def.box[1]; }
  else if (def.circle != null) { this.type = C_CIRCLE; this.r = +def.circle; }
  else if (def.capsule) { this.type = C_CAPSULE; this.hl = +def.capsule[0]; this.r = +def.capsule[1]; }
  else if (def.poly) {
    this.type = C_POLY;
    let P = def.poly.map(function (q) { return [+q[0], +q[1]]; });
    let A = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; }
    if (A < 0) P = P.reverse();       // store clockwise-on-screen = positive signed area in y-down coordinates
    const n = P.length; this.n = n;
    this.vx = new Float64Array(n); this.vy = new Float64Array(n); this.nx = new Float64Array(n); this.ny = new Float64Array(n);
    let br = 0;
    for (let i = 0; i < n; i++) {
      this.vx[i] = P[i][0]; this.vy[i] = P[i][1];
      const b = P[(i + 1) % n], ex = b[0] - P[i][0], ey = b[1] - P[i][1], l = Math.sqrt(ex * ex + ey * ey) || 1;
      this.nx[i] = ey / l; this.ny[i] = -ex / l;   // outward for positive area in y-down coordinates
      const rr = Math.sqrt(P[i][0] * P[i][0] + P[i][1] * P[i][1]); if (rr > br) br = rr;
    }
    this.br = br;
  } else throw new Error('SOFT2D: collider needs box, circle, capsule, poly, floor, ceiling or wall');
  // bounding radius in local space (for the broad phase)
  this.br = this.type === C_BOX ? Math.sqrt(this.hw * this.hw + this.hh * this.hh) : (this.type === C_CIRCLE ? this.r : (this.type === C_CAPSULE ? this.hl + this.r : (this.br || 0)));
  // current and previous pose (kinematic colliders are lerped inside a step)
  if (this.pose) { const p = this.pose(0) || {}; this.x = num(p.x, this.x); this.y = num(p.y, this.y); this.angle = num(p.angle, this.angle); }
  this.px = this.x; this.py = this.y; this.pa = this.angle;     // pose at the start of the current step
  this.nx1 = this.x; this.ny1 = this.y; this.na1 = this.angle;  // pose at the end of the current step
  this.cx = this.x; this.cy = this.y; this.ca = this.angle;     // pose at the current substep
  sincos(this.angle); this.sn = _sn; this.cs = _cs; this.psn = _sn; this.pcs = _cs;
  this.ox = this.x; this.oy = this.y;                           // pose at the previous substep (surface motion for friction)
}
/* the collider's pose at time t (kinematic: pose(t); static: fixed) */
Collider.prototype.poseAt = function (t) {
  if (!this.pose) return { x: this.x, y: this.y, angle: this.angle };
  const p = this.pose(t) || {};
  return { x: num(p.x, this.x), y: num(p.y, this.y), angle: num(p.angle, this.angle) };
};

// ---------------------------------------------------------------- the world
function World(o) {
  o = o || {};
  const g = o.gravity || [0, 1500];
  this.kind = 'soft';
  this.gx = num(g[0], 0); this.gy = num(g[1], 1500); this.gz = num(g[2], 0);
  this.gm = Math.sqrt(this.gx * this.gx + this.gy * this.gy + this.gz * this.gz);
  this.G = this.gm > 1 ? this.gm : 1000;               // reference acceleration for the softness parameters
  this.dt = o.dt || 1 / 240; this.rate = Math.round(1 / this.dt);
  this.sub = Math.max(1, Math.round(o.iterations || 12));
  this.seed = o.seed != null ? o.seed : 1; this._rng = makeRng(this.seed);
  this.damping = num(o.damping, 0.02);
  this.maxSpeed = num(o.maxSpeed, 4000);   // ADDED: px/s cap on any particle
  this.air = num(o.air, 0);
  const wd = o.wind || [0, 0, 0]; this.wind = [num(wd[0], 0), num(wd[1], 0), num(wd[2], 0)];
  this.mats = Object.assign({}, MATERIALS, o.materials || {});
  this.colliders = []; this.objects = []; this.cloths = []; this.ropes = []; this.balloons = [];
  this._byId = []; this._uid = 0;
  this._sched = []; this._pins = []; this._started = false; this._warm = false; this._ran = false;
  this.stepIndex = 0; this.time = 0; this.T = 0;
  this.events = []; this.warnings = []; this._raw = []; this._evLast = new Map(); this.maxEvents = 20000;
  this.evGap = 0.05;
  this.np = 0; this.nc = 0; this._bK = -1; this._bR = 1; this._ripq = []; this._ripi = 0;
}
World.prototype.rand = function () { return this._rng(); };
World.prototype._id = function (obj) { const id = this._uid++; this._byId[id] = obj; return id; };
World.prototype.object = function (id) { const o = this._byId[typeof id === 'object' && id ? id.id : id]; return o || null; };
World.prototype.collider = function (def) {
  if (this._started) throw new Error('SOFT2D: add colliders before warmup()/run()');
  const c = new Collider(this, def || {}, this._uid);
  this._id(c); c.index = this.colliders.length; this.colliders.push(c);
  return { id: c.id, collider: c };
};
World.prototype.colliderPose = function (id, t) { const c = this.object(id); return c && c.poseAt ? c.poseAt(t) : null; };
World.prototype.schedule = function (t, fn) {
  this._sched.push({ t: +t, fn: fn, done: false, k: this._sched.length });
  this._sched.sort(function (a, b) { return a.t - b.t || a.k - b.k; });
  return this;
};

// ---------------------------------------------------------------- soft objects (cloth, rope, balloon share this base)
const K_STRETCH = 0, K_SHEAR = 1, K_BEND = 2, K_TIE = 3, K_MAX = 4;   // K_MAX: one-sided (resists stretching only)
function SoftObj(W, type, def) {
  this.world = W; this.type = type; this.def = def;
  this.id = W._id(this);
  this.tag = def.tag || type; this.mat = def.mat || (type === 'cloth' ? 'paper' : (type === 'rope' ? 'ribbon' : 'nitrile'));
  this.m = W.mats[this.mat] || W.mats.paper;
  this.n = 0; this.p0 = -1; this.c0 = 0; this.c1 = 0;
  this.cons = [];                     // [a, b, rest, softness, kind, breakStrain] (local particle indices)
  this.collide = def.collide != null ? def.collide : true;
  this.friction = num(def.friction, this.m.friction != null ? this.m.friction : 0.5);
  this.damping = num(def.damping, this.m.damping != null ? this.m.damping : 1);
  this.flutter = num(def.flutter, this.m.flutter != null ? this.m.flutter : 0);
  this.gscale = num(def.gravityScale, 1);
  this.sticky = def.sticky != null ? def.sticky : !!this.m.sticky;
  this.silent = !!def.silent;
  this.dim3 = false;
  this.events = 0;
  const act = def.active || null;   // ADDED: [t0, t1] simulated only then; frozen (pins too) before and after, so long scenes stay cheap
  this.a0 = act ? num(act[0], -INF) : -INF; this.a1 = act ? num(act[1], INF) : INF; this.on = true;
}
SoftObj.prototype._alloc = function (n) {
  this.n = n;
  this.ix = new Float64Array(n); this.iy = new Float64Array(n); this.iz = new Float64Array(n); this.iw = new Float64Array(n);
};
/* softness s -> XPBD compliance: a constraint strains by about s (fraction of its length) under the weight of one particle */
SoftObj.prototype._alpha = function (s, L, mp) { return s > 0 ? s * L / (mp * this.world.G) : 0; };
SoftObj.prototype.index = function (i, j) { return this.type === 'cloth' ? j * this.cols + i : i; };
function tearDef(t, m, seed) {
  if (!t) return null;
  if (t === true) t = {};
  return { strain: num(t.strain, m.tear || 1.4), seed: t.seed != null ? t.seed : seed, jag: num(t.jag, 0.35), min: num(t.min, 1.005) };
}
/* a constraint's break ratio: jag varies the margin above rest (strain 1.2, jag .5 -> 1.1 to 1.3) so the tear wanders */
function breakRatio(td, rng) { return Math.max(td.min, 1 + (td.strain - 1) * (1 + td.jag * (rng() - 0.5) * 2)); }

// ---------------------------------------------------------------- cloth: a grid of particles with stretch, shear and bend constraints
World.prototype.cloth = function (def) {
  if (this._started) throw new Error('SOFT2D: add cloth before warmup()/run()');
  def = def || {};
  const o = new SoftObj(this, 'cloth', def);
  const cols = o.cols = Math.max(2, (def.cols | 0) || 12), rows = o.rows = Math.max(2, (def.rows | 0) || 12), n = cols * rows;
  const width = o.width = num(def.width, 200), height = o.height = num(def.height, 200);
  o._alloc(n);
  const dx = o.dxr = width / (cols - 1), dy = o.dyr = height / (rows - 1);
  const plane = o.plane = def.plane === 'xz' ? 'xz' : 'xy';
  sincos(num(def.angle, 0)); const sn = _sn, cs = _cs;
  const cX = def.cx != null, cY = def.cy != null;   // centre per axis (cx and/or cy), else x, y is the top-left corner
  const ox = cX ? num(def.cx, 0) : num(def.x, 0), oy = cY ? num(def.cy, 0) : num(def.y, 0), oz = num(def.z, 0);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i;
    if (plane === 'xy') {
      const lx = i * dx - (cX ? width / 2 : 0), ly = j * dy - (cY ? height / 2 : 0);
      o.ix[k] = ox + cs * lx - sn * ly; o.iy[k] = oy + sn * lx + cs * ly; o.iz[k] = oz;
    } else {   // horizontal sheet: x along the width, z along the height (row 0 at the back), y constant; angle turns it about the vertical axis
      const lx = i * dx - (cX ? width / 2 : 0), lz = j * dy - height / 2;
      o.ix[k] = ox + cs * lx - sn * lz; o.iy[k] = oy; o.iz[k] = oz + sn * lx + cs * lz;
    }
  }
  o.dim3 = true;
  const mass = num(def.mass, 0.2), mp = mass / n;
  o.mp = mp;
  for (let k = 0; k < n; k++) o.iw[k] = 1 / mp;
  o.thickness = num(def.thickness, o.m.thickness != null ? o.m.thickness : 2);
  const sS = num(def.stretch, o.m.stretch || 0), sH = num(def.shear, o.m.shear != null ? o.m.shear : 0.05), sB = num(def.bend, o.m.bend != null ? o.m.bend : 0.5);
  const td = o.tearDef = tearDef(def.tear, o.m, (this.seed | 0) * 7919 + o.id * 104729 + 1);
  const rng = td ? makeRng(td.seed) : null;
  const brk = function () { return td ? breakRatio(td, rng) : 0; };
  const id2 = function (i, j) { return j * cols + i; };
  const C = o.cons, emap = o._emap = new Map();
  const edge = function (a, b, rest, s, kind, br) { emap.set(a < b ? a * n + b : b * n + a, C.length); C.push([a, b, rest, s, kind, br]); };
  // order: consecutive constraints never share a particle (red-black batches), so the sweep pipelines; still Gauss-Seidel
  for (let par = 0; par < 2; par++) for (let j = par; j < rows - 1; j += 2) for (let i = 0; i < cols; i++) edge(id2(i, j), id2(i, j + 1), dy, sS, K_STRETCH, brk());
  for (let j = 0; j < rows; j++) for (let par = 0; par < 2; par++) for (let i = par; i < cols - 1; i += 2) edge(id2(i, j), id2(i + 1, j), dx, sS, K_STRETCH, brk());
  const dg = Math.sqrt(dx * dx + dy * dy), nq = (rows - 1) * (cols - 1);
  o.shear0 = C.length; o.qs = new Int32Array(nq);   // one diagonal per quad (the triangles' shared edge), alternating like the triangles
  for (let par = 0; par < 2; par++) for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
    if (((i + j) & 1) !== par) continue;
    o.qs[j * (cols - 1) + i] = C.length;
    if (par === 0) edge(id2(i, j), id2(i + 1, j + 1), dg, sH, K_SHEAR, brk()); else edge(id2(i + 1, j), id2(i, j + 1), dg, sH, K_SHEAR, brk());
  }
  o.nStruct = C.length;
  o.bendOf = [];   // bend constraint -> its two structural edges (it dies with either)
  if (sB >= 0 && def.bend !== false) {
    const bh = function (i, j) { o.bendOf.push([emap.get(id2(i, j) * n + id2(i + 1, j)), emap.get(id2(i + 1, j) * n + id2(i + 2, j))]); C.push([id2(i, j), id2(i + 2, j), 2 * dx, sB, K_BEND, 0]); };
    const bv = function (i, j) { o.bendOf.push([emap.get(id2(i, j) * n + id2(i, j + 1)), emap.get(id2(i, j + 1) * n + id2(i, j + 2))]); C.push([id2(i, j), id2(i, j + 2), 2 * dy, sB, K_BEND, 0]); };
    for (let j = 0; j < rows; j++) for (let g = 0; g < 4; g += 2) for (let i = g; i < cols - 2; i += 4) { bh(i, j); if (i + 1 < cols - 2) bh(i + 1, j); }
    for (let g = 0; g < 4; g += 2) for (let j = g; j < rows - 2; j += 4) for (let jj = j; jj < j + 2 && jj < rows - 2; jj++) for (let i = 0; i < cols; i++) bv(i, jj);
  }
  // triangles (alternating diagonals), uv, triangle edges (constraint indices) and neighbours, rest areas
  const nt = 2 * (cols - 1) * (rows - 1);
  o.nt = nt; o.tri = new Uint32Array(3 * nt); o.uv = new Float32Array(2 * n);
  o.triE = new Int32Array(3 * nt); o.triN = new Int32Array(3 * nt).fill(-1); o.triQ = new Int32Array(nt); o.triA0 = new Float64Array(nt);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = id2(i, j); o.uv[2 * k] = i / (cols - 1); o.uv[2 * k + 1] = j / (rows - 1); }
  let t = 0;
  const putTri = function (a, b, c, q) { o.tri[3 * t] = a; o.tri[3 * t + 1] = b; o.tri[3 * t + 2] = c; o.triQ[t] = q; o.triA0[t] = dx * dy / 2; t++; };
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
    const a = id2(i, j), b = id2(i + 1, j), c = id2(i, j + 1), d = id2(i + 1, j + 1), q = j * (cols - 1) + i;
    if (((i + j) & 1) === 0) { putTri(a, b, d, q); putTri(a, d, c, q); } else { putTri(a, b, c, q); putTri(b, d, c, q); }
  }
  const owner = new Map();
  for (let k = 0; k < nt; k++) for (let e = 0; e < 3; e++) {
    const a = o.tri[3 * k + e], b = o.tri[3 * k + (e + 1) % 3], key = a < b ? a * n + b : b * n + a;
    o.triE[3 * k + e] = emap.get(key);
    const prev = owner.get(key);
    if (prev === undefined) owner.set(key, 3 * k + e); else { o.triN[3 * k + e] = (prev / 3) | 0; o.triN[prev] = k; }
  }
  // per-particle rest area share (flutter) and per-edge triangle count (tearing)
  o.share = new Float64Array(n);
  for (let k = 0; k < nt; k++) for (let e = 0; e < 3; e++) o.share[o.tri[3 * k + e]] += o.triA0[k] / 3;
  o.area0 = width * height;
  o.pins = [];
  const pins = def.pins || [];
  for (let m = 0; m < pins.length; m++) {
    const p = pins[m]; const k = p.index != null ? p.index : id2(p.i < 0 ? cols + p.i : (p.i | 0), p.j < 0 ? rows + p.j : (p.j | 0));
    this._addPin(o, k, p.to, p);
  }
  this.objects.push(o); this.cloths.push(o);
  return o;
};

// ---------------------------------------------------------------- rope: a chain of particles with stretch and bend constraints
World.prototype.rope = function (def) {
  if (this._started) throw new Error('SOFT2D: add ropes before warmup()/run()');
  def = def || {};
  const o = new SoftObj(this, 'rope', def);
  const N = Math.max(1, (def.segments | 0) || 16), n = N + 1;
  let P = def.points ? def.points.map(function (q) { return [+q[0], +q[1]]; }) : [def.from || [0, 0], def.to || [(def.from || [0, 0])[0] + 100, (def.from || [0, 0])[1]]];
  // arc-length resampling to N equal segments; a `length` longer than the from-to distance sags as a parabola
  let L = 0; const cum = [0];
  for (let i = 1; i < P.length; i++) { const ex = P[i][0] - P[i - 1][0], ey = P[i][1] - P[i - 1][1]; L += Math.sqrt(ex * ex + ey * ey); cum.push(L); }
  let sag = 0;
  if (!def.points && def.length != null && +def.length > L * 1.0001) sag = Math.sqrt(3 * L * (+def.length - L) / 8);
  const total = !def.points && def.length != null ? Math.max(+def.length, L) : L;
  o._alloc(n);
  const zc = num(def.z, 0);
  const gl = this.gm > 0 ? this.gm : 1, gdx = this.gx / gl, gdy = this.gy / gl;
  for (let i = 0, s = 0; i < n; i++) {
    const want = L * i / N;
    while (s < cum.length - 2 && cum[s + 1] < want) s++;
    const seg = cum[s + 1] - cum[s], f = seg > 0 ? (want - cum[s]) / seg : 0, u = i / N, sg = 4 * sag * u * (1 - u);
    o.ix[i] = P[s][0] + (P[s + 1][0] - P[s][0]) * f + gdx * sg; o.iy[i] = P[s][1] + (P[s + 1][1] - P[s][1]) * f + gdy * sg; o.iz[i] = zc;
  }
  const seg = total / N; o.segLen = seg; o.length = total; o.N = N; o.width = num(def.width, 10);
  const mass = num(def.mass, 0.05), mp = mass / n; o.mp = mp;
  for (let i = 0; i < n; i++) o.iw[i] = 1 / mp;
  o.thickness = num(def.thickness, num(def.radius, Math.max(0.5, o.width / 2)));
  const sS = num(def.stretch, o.m.stretch || 0), sB = num(def.bend, o.m.bend != null ? o.m.bend : 0.2);
  const td = o.tearDef = tearDef(def.tear, o.m, (this.seed | 0) * 7919 + o.id * 104729 + 3), rng = td ? makeRng(td.seed) : null;
  // segment m is constraint m (tearing relies on it); the sweep order (even segments, then odd) is kept in o.order
  for (let i = 0; i < N; i++) o.cons.push([i, i + 1, seg, sS, def.slack === false ? K_STRETCH : K_MAX, td ? breakRatio(td, rng) : 0]);
  o.nStruct = N;
  if (sB >= 0 && def.bend !== false) for (let i = 0; i + 2 <= N; i++) o.cons.push([i, i + 2, 2 * seg, sB, K_BEND, 0]);
  const ord = [];
  for (let par = 0; par < 2; par++) for (let i = par; i < N; i += 2) ord.push(i);
  for (let g = 0; g < 4; g += 2) for (let i = g; i + 2 <= N; i += 4) { ord.push(N + i); if (i + 3 <= N) ord.push(N + i + 1); }
  o.order = ord;
  o.pins = [];
  const pins = def.pins || [];
  for (let m = 0; m < pins.length; m++) { const p = pins[m]; let k = p.k != null ? p.k | 0 : (p.index | 0); if (k < 0) k = n + k; this._addPin(o, k, p.to, p); }
  this.objects.push(o); this.ropes.push(o);
  return o;
};

// ---------------------------------------------------------------- pins, cuts and scripted changes
/* to: [x,y(,z)] | t => [x,y(,z)] | { collider:id, local:[x,y(,z)] } | { obj:id, index } | omitted (held where it is when the pin turns on) */
World.prototype._addPin = function (o, k, to, opt) {
  opt = opt || {};
  if (!(k >= 0 && k < o.n)) throw new Error('SOFT2D: pin index ' + k + ' out of range for ' + o.type + ' ' + o.id + ' (n = ' + o.n + ')');
  const pin = { obj: o, k: k, p: -1, mode: 0, fn: null, col: null, tob: null, tk: 0, tx: 0, ty: 0, tz: 0, lx: 0, ly: 0, lz: 0, hasT: false,
    from: num(opt.from, -INF), until: opt.until != null ? +opt.until : INF, on: false, sx: 0, sy: 0, sz: 0, ex: 0, ey: 0, ez: 0, order: this._pins.length };
  if (typeof to === 'function') { pin.mode = 1; pin.fn = to; }
  else if (to && to.collider != null) { pin.mode = 2; pin.col = this.object(to.collider); if (!pin.col || !pin.col.poseAt) throw new Error('SOFT2D: pin to unknown collider ' + to.collider); const l = to.local || [0, 0]; pin.lx = +l[0] || 0; pin.ly = +l[1] || 0; pin.lz = l[2] != null ? +l[2] : NaN; }
  else if (to && to.obj != null) { pin.mode = 3; pin.tob = this.object(to.obj); if (!pin.tob || pin.tob.n == null) throw new Error('SOFT2D: pin to unknown object ' + to.obj); pin.tk = to.index | 0; if (pin.tk < 0) pin.tk += pin.tob.n; }
  else if (to && to.length >= 2) { pin.mode = 0; pin.hasT = true; pin.tx = +to[0]; pin.ty = +to[1]; pin.tz = to[2] != null ? +to[2] : NaN; }
  else { pin.mode = 0; pin.hasT = false; }
  if (this._started) pin.p = o.p0 + k;
  o.pins.push(pin); this._pins.push(pin);
  return pin;
};
World.prototype.pin = function (objId, index, to, opt) {
  const o = this.object(objId); if (!o || o.n == null) throw new Error('SOFT2D: pin: unknown object ' + objId);
  let k = index | 0; if (k < 0) k += o.n;
  opt = opt || {};
  if (this._started && opt.from == null) opt = Object.assign({}, opt, { from: this.time });
  return this._addPin(o, k, to, opt);
};
/* remove every pin on particle `index` of object objId from now on (the particle keeps the pin's last velocity) */
World.prototype.unpin = function (objId, index) {
  const o = this.object(objId); if (!o) return this;
  let k = index | 0; if (k < 0) k += o.n;
  for (const p of o.pins) if (p.k === k && p.until > this.time) p.until = this.time;
  return this;
};
World.prototype.release = function (objId) { const o = this.object(objId); if (o) for (const p of o.pins) if (p.until > this.time) p.until = this.time; return this; };
/* cut the constraint(s) between particles a and b of an object (cloth: a scripted tear between neighbours; rope: segment a..b) */
World.prototype.cut = function (objId, a, b) {
  const o = this.object(objId); if (!o) return this;
  if (b == null) b = a + 1;
  if (!this._started) { (o._precut || (o._precut = [])).push([a, b]); return this; }
  this._cutPair(o, a, b, this.time);
  return this;
};
/* ADDED: rip a cloth along a path in its rest space (u, v from 0 to 1; [0,0] is the top-left of the sheet as built), unzipping from
 * t0 to t1; jag (in cells) wobbles the line so the edges come out ragged. The triangles on the line die (a gap about half a cell
 * wide with white fibres when drawn with ragged), so the two sides part; a pulling pin then carries the flap away. */
World.prototype.rip = function (objId, o) {
  const c = this.object(objId); if (!c || c.type !== 'cloth') return this;
  o = o || {};
  const path = o.path || [o.from || [0, 0], o.to || [1, 1]];
  const t0 = num(o.t0, this._started ? this.time : 0), t1 = Math.max(t0, num(o.t1, t0 + 0.3)), jag = num(o.jag, 0.3);
  const W = c.width, H = c.height, du = W / (c.cols - 1), dv = H / (c.rows - 1), cell = Math.min(du, dv), step = 0.2 * cell;
  const P = path.map(function (q) { return [q[0] * W, q[1] * H]; });
  if (P.length >= 2) {   // run a cell past both ends so a rip that starts or ends on the sheet's border cuts through it
    const ext = function (a, b) { const ex = a[0] - b[0], ey = a[1] - b[1], l = Math.sqrt(ex * ex + ey * ey) || 1; return [a[0] + ex / l * cell, a[1] + ey / l * cell]; };
    P.unshift(ext(P[0], P[1])); P.push(ext(P[P.length - 1], P[P.length - 2]));
  }
  const rng = makeRng(o.seed != null ? o.seed : (this.seed | 0) * 31 + c.id * 977 + this._ripq.length + 7);
  let L = 0; const cum = [0];
  for (let i = 1; i < P.length; i++) { L += Math.sqrt((P[i][0] - P[i - 1][0]) * (P[i][0] - P[i - 1][0]) + (P[i][1] - P[i - 1][1]) * (P[i][1] - P[i - 1][1])); cum.push(L); }
  if (!(L > 0)) return this;
  const knots = []; for (let k = 0; k <= Math.ceil(L / cell) + 1; k++) knots.push((rng() - 0.5) * 2 * jag * cell);
  const seen = new Set(), cols = c.cols, rows = c.rows;
  const locate = function (qx, qy) {
    if (qx < -cell || qy < -cell || qx > W + cell || qy > H + cell) return -1;
    qx = qx < 0 ? 0 : (qx > W ? W : qx); qy = qy < 0 ? 0 : (qy > H ? H : qy);
    let i = Math.floor(qx / du), j = Math.floor(qy / dv); if (i > cols - 2) i = cols - 2; if (j > rows - 2) j = rows - 2;
    const fx = qx / du - i, fy = qy / dv - j, q = j * (cols - 1) + i;
    if (((i + j) & 1) === 0) return fx > fy ? 2 * q : 2 * q + 1;
    return fx + fy < 1 ? 2 * q : 2 * q + 1;
  };
  for (let sd = 0, seg = 0; sd <= L + 1e-9; sd += step) {
    while (seg < P.length - 2 && cum[seg + 1] < sd) seg++;
    const a = P[seg], b = P[seg + 1], sl = cum[seg + 1] - cum[seg], f = sl > 0 ? (sd - cum[seg]) / sl : 0;
    const tx = sl > 0 ? (b[0] - a[0]) / sl : 1, ty = sl > 0 ? (b[1] - a[1]) / sl : 0, nx = -ty, ny = tx;
    const kk = sd / cell, k0 = Math.floor(kk), fr = kk - k0, sm = fr * fr * (3 - 2 * fr), wob = knots[k0] + (knots[k0 + 1] - knots[k0]) * sm;
    const px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f;
    for (const off of [-0.2, 0, 0.2]) {
      const tri = locate(px + nx * (wob + off * cell), py + ny * (wob + off * cell));
      if (tri >= 0 && !seen.has(tri)) { seen.add(tri); this._ripq.push({ t: t0 + (t1 - t0) * sd / L, c: c, tri: tri, k: this._ripq.length }); }
    }
  }
  this._ripq.sort(function (p, q) { return p.t - q.t || p.k - q.k; });
  return this;
};
World.prototype._runRips = function (t0) {
  const Q = this._ripq;
  while (this._ripi < Q.length && Q[this._ripi].t <= t0 + 1e-9) {
    const r = Q[this._ripi++], c = r.c;
    if (c.triDead[r.tri] !== INF) continue;
    this._killTri(c, r.tri, t0);
    const a = c.p0 + c.tri[3 * r.tri];
    c.tornLen += c.dxr;
    this._push('tear', c, null, this.x[a], this.y[a], 0.55, t0, { len: c.dxr });
  }
};
/* change an object's parameters from now on (inside a schedule): gravityScale, damping, flutter, friction, pressure, buoyancy */
World.prototype.set = function (objId, props) {
  const o = this.object(objId); if (!o || !props) return this;
  for (const k of ['gravityScale', 'damping', 'flutter', 'friction', 'buoyancy']) if (props[k] != null) o[k === 'gravityScale' ? 'gscale' : k] = +props[k];
  if (props.pressure != null && o.type === 'balloon') { if (typeof props.pressure === 'function') o.pressureFn = props.pressure; else { o.pressureFn = null; o.pressureV = +props.pressure; } }
  return this;
};
World.prototype.setPressure = function (objId, p) { const o = this.object(objId); if (o && o.type === 'balloon') { o.pressureFn = null; o.pressureV = +p; } return this; };

// ---------------------------------------------------------------- preparation: flatten every object into typed arrays
World.prototype._prepare = function () {
  if (this._started) return;
  this._started = true;
  let np = 0; for (const o of this.objects) { o.p0 = np; np += o.n; }
  this.np = np;
  const F = function () { return new Float64Array(np); };
  this.x = F(); this.y = F(); this.z = F(); this.px = F(); this.py = F(); this.pz = F(); this.vx = F(); this.vy = F(); this.vz = F();
  this.im = F(); this.im0 = F(); this.rad = F(); this.ax = F(); this.ay = F(); this.az = F();
  this.pob = new Int32Array(np); this.pinCnt = new Int32Array(np); this.ctc = new Int32Array(np).fill(-1); this.stuck = new Int32Array(np).fill(-1);
  for (let oi = 0; oi < this.objects.length; oi++) {
    const o = this.objects[oi]; o.oi = oi;
    for (let k = 0; k < o.n; k++) {
      const p = o.p0 + k;
      this.x[p] = this.px[p] = o.ix[k]; this.y[p] = this.py[p] = o.iy[k]; this.z[p] = this.pz[p] = o.iz[k];
      this.im0[p] = this.im[p] = o.iw[k]; this.rad[p] = o.thickness; this.pob[p] = oi;
    }
  }
  let nc = 0; for (const o of this.objects) { o.c0 = nc; nc += o.cons.length; o.c1 = nc; }
  this.nc = nc;
  const ca = this.ca = new Int32Array(nc), cb = this.cb = new Int32Array(nc), cr = this.crest = new Float64Array(nc), cal = this.calpha = new Float64Array(nc);
  const ck = this.ckind = new Uint8Array(nc), cbk = this.cbrk = new Float64Array(nc), con = this.con = new Uint8Array(nc), cob = this.cob = new Int32Array(nc);
  for (const o of this.objects) for (let m = 0; m < o.cons.length; m++) {
    const c = o.cons[m], k = o.c0 + m;
    ca[k] = o.p0 + c[0]; cb[k] = o.p0 + c[1]; cr[k] = c[2]; cal[k] = o._alpha(c[3], c[2], o.mp); ck[k] = c[4]; cbk[k] = c[5] > 0 ? c[5] * c[2] : 0; con[k] = (c[4] === K_MAX || c[5] > 0) ? 2 : 1; cob[k] = o.oi;
  }
  this.csm = Float64Array.from(cr);   // smoothed lengths of the breakable constraints
  const cord = this.cord = new Int32Array(nc);   // sweep order of the planar solver (ropes: even segments, then odd)
  for (const o of this.objects) for (let m = 0; m < o.cons.length; m++) cord[o.c0 + m] = o.c0 + (o.order ? o.order[m] : m);
  this._tearOn = false;
  for (const o of this.objects) {
    let cl = [];
    if (o.collide === true) cl = this.colliders.map(function (c) { return c.index; });
    else if (Array.isArray(o.collide)) for (const id of o.collide) { const c = this.object(id && id.id != null ? id.id : id); if (c && c.poseAt) cl.push(c.index); }
    o.cl = new Int32Array(cl);
    o.hitV = new Float64Array(this.colliders.length); o.hitX = new Float64Array(this.colliders.length); o.hitY = new Float64Array(this.colliders.length);
    o.slideV = new Float64Array(this.colliders.length); o.slideN = new Int32Array(this.colliders.length); o.slideT = new Float64Array(this.colliders.length);
    o.contactN = new Int32Array(this.colliders.length);
    o.dfac = 1; o.ab = [0, 0, 0, 0];
    if (o.tearDef) this._tearOn = true;
    if (o.type === 'cloth') this._clothTopology(o);
    if (o.type === 'rope') { o.segDead = new Float64Array(o.N).fill(INF); }
  }
  for (const p of this._pins) {
    p.p = p.obj.p0 + p.k;
    if (p.mode === 0 && !p.hasT) { p.tx = this.x[p.p]; p.ty = this.y[p.p]; p.tz = this.z[p.p]; p.hasT = true; p.fixedAtStart = true; }
  }
  for (const o of this.objects) if (o._precut) for (const ab of o._precut) this._cutPair(o, ab[0], ab[1], 0);
  if (this.balloons.length) this._prepareBalloons();
  this._prepareSoft();
};
/* cloth topology for tearing: edge -> its (up to two) triangles, vertex -> triangles, structural edge -> bends across it */
World.prototype._clothTopology = function (o) {
  const nC = o.cons.length, nt = o.nt;
  o.et0 = new Int32Array(nC).fill(-1); o.et1 = new Int32Array(nC).fill(-1);
  for (let t = 0; t < nt; t++) for (let e = 0; e < 3; e++) { const m = o.triE[3 * t + e]; if (o.et0[m] < 0) o.et0[m] = t; else o.et1[m] = t; }
  const cnt = new Int32Array(o.n + 1);
  for (let t = 0; t < nt; t++) for (let e = 0; e < 3; e++) cnt[o.tri[3 * t + e] + 1]++;
  for (let v = 0; v < o.n; v++) cnt[v + 1] += cnt[v];
  o.vtS = cnt; o.vtL = new Int32Array(3 * nt); const fill = new Int32Array(o.n);
  for (let t = 0; t < nt; t++) for (let e = 0; e < 3; e++) { const v = o.tri[3 * t + e]; o.vtL[cnt[v] + fill[v]++] = t; }
  o.bendsOf = new Map();
  for (let b = 0; b < o.bendOf.length; b++) for (const m of o.bendOf[b]) { if (m == null) continue; let l = o.bendsOf.get(m); if (!l) o.bendsOf.set(m, l = []); l.push(o.nStruct + b); }
  o.triDead = new Float64Array(nt).fill(INF); o.tornT = new Float64Array(o.n).fill(INF);
  o.tornLen = 0;
};

// ---------------------------------------------------------------- tearing and cutting
World.prototype._kill = function (k) { if (this.con[k]) { this.con[k] = 0; return true; } return false; };
World.prototype._breakCon = function (k, t, scripted) {
  if (!this.con[k]) return;
  const o = this.objects[this.cob[k]];
  this.con[k] = 0;
  const m = k - o.c0;
  if (o.type === 'cloth') this._tearCloth(o, m, t);
  else if (o.type === 'rope') {
    if (m < o.N) { o.segDead[m] = t; if (m - 1 >= 0) this._kill(o.c0 + o.N + m - 1); if (m < o.N - 1) this._kill(o.c0 + o.N + m); }
  }
  o.tornLen += this.crest[k];
  if (!this._warm && !o.silent) {
    const a = this.ca[k], b = this.cb[k];
    this._push('tear', o, null, 0.5 * (this.x[a] + this.x[b]), 0.5 * (this.y[a] + this.y[b]), scripted ? 0.6 : 0.5, t, { len: this.crest[k], strain: Math.round(this.csm[k] / this.crest[k] * 1000) / 1000 });
  }
};
World.prototype._tearCloth = function (o, m, t) {
  const t0 = o.et0[m], t1 = o.et1[m];
  if (t0 >= 0 && o.triDead[t0] === INF) this._killTri(o, t0, t);
  if (t1 >= 0 && o.triDead[t1] === INF) this._killTri(o, t1, t);
  const bl = o.bendsOf.get(m); if (bl) for (const b of bl) this._kill(o.c0 + b);
};
World.prototype._killTri = function (o, tr, t) {
  o.triDead[tr] = t;
  for (let e = 0; e < 3; e++) {
    const m = o.triE[3 * tr + e], a = o.et0[m], b = o.et1[m];
    const allDead = (a < 0 || o.triDead[a] !== INF) && (b < 0 || o.triDead[b] !== INF);
    if (allDead && this.con[o.c0 + m]) { this.con[o.c0 + m] = 0; const bl = o.bendsOf.get(m); if (bl) for (const bb of bl) this._kill(o.c0 + bb); }
  }
  for (let e = 0; e < 3; e++) {
    const v = o.tri[3 * tr + e];
    let alive = false; for (let s = o.vtS[v]; s < o.vtS[v + 1]; s++) if (o.triDead[o.vtL[s]] === INF) { alive = true; break; }
    if (alive && o.tornT[v] === INF) o.tornT[v] = t;
    if (!alive) {   // an orphan (no triangle left): it is invisible, so freeze it where it is instead of letting it fly off
      const p = o.p0 + v; this.im[p] = 0; this.im0[p] = 0; this.vx[p] = 0; this.vy[p] = 0; this.vz[p] = 0;
      for (let k = o.c0; k < o.c1; k++) if (this.con[k] && (this.ca[k] === p || this.cb[k] === p)) this.con[k] = 0;
    }
  }
};
World.prototype._cutPair = function (o, a, b, t) {
  if (o.type === 'cloth') {
    const n = o.n, key = a < b ? a * n + b : b * n + a, m = o._emap.get(key);
    if (m == null) { this.warnings.push('cut: particles ' + a + ' and ' + b + ' of cloth ' + o.id + ' are not neighbours'); return; }
    if (!this._started) return;
    this._breakCon(o.c0 + m, t, true);
  } else if (o.type === 'rope') {
    const s = Math.min(a, b); if (s < 0 || s >= o.N) return;
    if (!this._started) return;
    this._breakCon(o.c0 + s, t, true);
  } else if (o.type === 'balloon') {
    const s = Math.min(a, b); if (!this._started) return;
    if (s >= 0 && s < o.n) this._breakCon(o.c0 + s, t, true);
  }
};

// ---------------------------------------------------------------- one step: schedules, poses, pins, then `sub` small substeps
World.prototype._runSchedules = function (t0) {
  const S = this._sched;
  for (let i = 0; i < S.length; i++) {
    const s = S[i];
    if (s.done) continue;
    if (s.t > t0 + 1e-9) break;
    s.done = true;
    s.fn(this);
  }
};
World.prototype._pinTargets = function (t0, t1) {
  const P = this._pins, x = this.x, y = this.y, z = this.z;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], now = p.from <= t0 + 1e-9 && t0 < p.until - 1e-9;
    if (now !== p.on) {
      if (now) {
        this.pinCnt[p.p]++;
        if (p.mode === 0 && (!p.hasT || p.freeze)) { p.tx = x[p.p]; p.ty = y[p.p]; p.tz = z[p.p]; p.hasT = true; }
        p.fresh = true;
      } else this.pinCnt[p.p]--;
      p.on = now;
      this.im[p.p] = this.pinCnt[p.p] > 0 ? 0 : this.im0[p.p];
    }
    if (!p.on) continue;
    const zp = z[p.p];
    if (p.mode === 0) { p.sx = p.ex = p.tx; p.sy = p.ey = p.ty; p.sz = p.ez = (p.tz === p.tz ? p.tz : zp); }
    else if (p.mode === 1) {
      const e = p.fn(t1) || [x[p.p], y[p.p]];
      if (p.fresh) { const s = p.fn(t0) || e; p.sx = +s[0]; p.sy = +s[1]; p.sz = s[2] != null ? +s[2] : zp; }
      else { p.sx = p.ex; p.sy = p.ey; p.sz = p.ez; }
      p.ex = +e[0]; p.ey = +e[1]; p.ez = e[2] != null ? +e[2] : zp;
    } else if (p.mode === 2) {
      const c = p.col; sincos(c.pa); let sn = _sn, cs = _cs;
      p.sx = c.px + cs * p.lx - sn * p.ly; p.sy = c.py + sn * p.lx + cs * p.ly; p.sz = p.lz === p.lz ? c.zc + p.lz : zp;
      sincos(c.na1); sn = _sn; cs = _cs;
      p.ex = c.nx1 + cs * p.lx - sn * p.ly; p.ey = c.ny1 + sn * p.lx + cs * p.ly; p.ez = p.sz;
    }
    p.fresh = false;
  }
};
World.prototype._applyPins = function (f) {
  const P = this._pins, x = this.x, y = this.y, z = this.z;
  for (let i = 0; i < P.length; i++) {
    const p = P[i]; if (!p.on || !p.obj.on) continue;
    const k = p.p;
    if (p.mode === 3) { const q = p.tob.p0 + p.tk; x[k] = x[q]; y[k] = y[q]; if (p.obj.dim3) z[k] = z[q]; continue; }
    x[k] = p.sx + (p.ex - p.sx) * f; y[k] = p.sy + (p.ey - p.sy) * f;
    if (p.obj.dim3) z[k] = p.sz + (p.ez - p.sz) * f;
  }
};
World.prototype._colliderLerp = function (f) {
  const C = this.colliders;
  for (let i = 0; i < C.length; i++) {
    const c = C[i];
    c.ox = c.cx; c.oy = c.cy; c.osn = c.sn; c.ocs = c.cs;
    if (!c.pose) continue;
    c.cx = c.px + (c.nx1 - c.px) * f; c.cy = c.py + (c.ny1 - c.py) * f; c.ca = c.pa + (c.na1 - c.pa) * f;
    sincos(c.ca); c.sn = _sn; c.cs = _cs;
  }
};
World.prototype._integrate = function (h) {
  const O = this.objects, x = this.x, y = this.y, z = this.z, px = this.px, py = this.py, pz = this.pz, vx = this.vx, vy = this.vy, vz = this.vz, im = this.im, ax = this.ax, ay = this.ay, az = this.az;
  for (let oi = 0; oi < O.length; oi++) {
    const o = O[oi], p0 = o.p0, p1 = o.p0 + o.n, df = o.dfac, gx = o.ab[0], gy = o.ab[1], gz = o.ab[2];
    if (!o.on) { for (let p = p0; p < p1; p++) { px[p] = x[p]; py[p] = y[p]; pz[p] = z[p]; vx[p] = 0; vy[p] = 0; vz[p] = 0; } continue; }
    if (o.dim3) {
      for (let p = p0; p < p1; p++) {
        px[p] = x[p]; py[p] = y[p]; pz[p] = z[p];
        if (im[p] === 0) continue;
        const a = (vx[p] + (gx + ax[p]) * h) * df, b = (vy[p] + (gy + ay[p]) * h) * df, c = (vz[p] + (gz + az[p]) * h) * df;
        vx[p] = a; vy[p] = b; vz[p] = c; x[p] += a * h; y[p] += b * h; z[p] += c * h;
      }
    } else {
      for (let p = p0; p < p1; p++) {
        px[p] = x[p]; py[p] = y[p];
        if (im[p] === 0) continue;
        const a = (vx[p] + (gx + ax[p]) * h) * df, b = (vy[p] + (gy + ay[p]) * h) * df;
        vx[p] = a; vy[p] = b; x[p] += a * h; y[p] += b * h;
      }
    }
  }
};
/* cloth: stretch and shear every substep; bending (soft by nature) every other substep with its compliance taken over the
 * doubled step (XPBD-consistent: alpha / (2h)^2), which saves a third of the work */
World.prototype._solve = function (ih2, rev) {
  const O = this.objects, n = O.length;
  for (let q = 0; q < n; q++) {
    const o = O[rev ? n - 1 - q : q];
    if (!o.on) continue;
    if (o.c1 > o.c0) {
      if (o.dim3) {
        const cs = o.c0 + o.nStruct;
        if (!rev) { this._solve3(o.c0, cs, ih2, false); }
        else { if (o.c1 > cs) this._solve3(cs, o.c1, ih2 * 0.25, true); this._solve3(o.c0, cs, ih2, true); }
      } else this._solve2(o.c0, o.c1, ih2, rev);
      if (this._bK >= 0) this._breakWorst();
    }
    if (o.type === 'balloon') this._solveBalloon(o, ih2);
  }
};
/* one Gauss-Seidel sweep of distance constraints c0..c1 (con[k]: 0 dead, 1 plain, 2 one-sided or breakable). Two copies of
 * the loop (forward, backward) keep the hot path free of branches; the 1e-30 keeps two pinned ends finite (their weights are 0). */
World.prototype._solve3 = function (c0, c1, ih2, rev) {
  const x = this.x, y = this.y, z = this.z, im = this.im, ca = this.ca, cb = this.cb, cr = this.crest, cal = this.calpha, con = this.con;
  if (!rev) {
    for (let k = c0; k < c1; k++) {
      const fl = con[k]; if (fl === 0) continue;
      const i = ca[k], j = cb[k], dx = x[j] - x[i], dy = y[j] - y[i], dz = z[j] - z[i], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (fl === 2 && this._special(k, d)) continue;
      if (d < 1e-9) continue;
      const wi = im[i], wj = im[j], s = (d - cr[k]) / ((wi + wj + cal[k] * ih2 + 1e-30) * d), si = wi * s, sj = wj * s;
      x[i] += si * dx; y[i] += si * dy; z[i] += si * dz; x[j] -= sj * dx; y[j] -= sj * dy; z[j] -= sj * dz;
    }
  } else {
    for (let k = c1 - 1; k >= c0; k--) {
      const fl = con[k]; if (fl === 0) continue;
      const i = ca[k], j = cb[k], dx = x[j] - x[i], dy = y[j] - y[i], dz = z[j] - z[i], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (fl === 2 && this._special(k, d)) continue;
      if (d < 1e-9) continue;
      const wi = im[i], wj = im[j], s = (d - cr[k]) / ((wi + wj + cal[k] * ih2 + 1e-30) * d), si = wi * s, sj = wj * s;
      x[i] += si * dx; y[i] += si * dy; z[i] += si * dz; x[j] -= sj * dx; y[j] -= sj * dy; z[j] -= sj * dz;
    }
  }
};
/* a one-sided (slack) constraint skips when compressed; a breakable one tears when stretched past its break length */
World.prototype._special = function (k, d) {
  if (d < this.crest[k] && this.ckind[k] === K_MAX) return true;
  const b = this.cbrk[k];
  if (b > 0) {
    // tear on a smoothed length: a sweep leaves its residual on alternate batches each substep, and one impulsive spike should not tear
    const ds = this.csm[k] = this.csm[k] * 0.75 + d * 0.25;
    if (ds > b) { const r = ds / b; if (r > this._bR) { this._bR = r; this._bK = k; } }   // broken after the sweep: only the worst one
  }
  return false;
};
/* after an object's sweep: tear its most strained over-limit constraint (one per object per substep: the tear runs from the
 * stress concentration as one front instead of popping everywhere at once) */
World.prototype._breakWorst = function () { if (this._bK >= 0) { const k = this._bK; this._bK = -1; this._bR = 1; this._breakCon(k, this._ts, false); } };
World.prototype._solve2 = function (c0, c1, ih2, rev) {
  const x = this.x, y = this.y, im = this.im, ca = this.ca, cb = this.cb, cr = this.crest, cal = this.calpha, con = this.con, cord = this.cord;
  for (let q = c0; q < c1; q++) {
    const k = cord[rev ? c1 - 1 - (q - c0) : q];
    const fl = con[k]; if (fl === 0) continue;
    const i = ca[k], j = cb[k], dx = x[j] - x[i], dy = y[j] - y[i], d = Math.sqrt(dx * dx + dy * dy);
    if (fl === 2 && this._special(k, d)) continue;
    if (d < 1e-9) continue;
    const wi = im[i], wj = im[j], s = (d - cr[k]) / ((wi + wj + cal[k] * ih2 + 1e-30) * d), si = wi * s, sj = wj * s;
    x[i] += si * dx; y[i] += si * dy; x[j] -= sj * dx; y[j] -= sj * dy;
  }
};
World.prototype._collide = function () {
  const O = this.objects, C = this.colliders, x = this.x, y = this.y;
  for (let oi = 0; oi < O.length; oi++) {
    const o = O[oi], cl = o.cl;
    if (!cl.length || !o.on) continue;
    const p0 = o.p0, p1 = p0 + o.n;
    let x0 = INF, x1 = -INF, y0 = INF, y1 = -INF;
    for (let p = p0; p < p1; p++) { const a = x[p], b = y[p]; if (a < x0) x0 = a; if (a > x1) x1 = a; if (b < y0) y0 = b; if (b > y1) y1 = b; }
    for (let m = 0; m < cl.length; m++) {
      const c = C[cl[m]], R = o.thickness + c.skin;
      if (c.type === C_FLOOR) { if (y1 < c.Y - R) continue; }
      else if (c.type === C_CEIL) { if (y0 > c.Y + R) continue; }
      else if (c.type === C_WALL) { if (c.side > 0 ? x0 > c.X + R : x1 < c.X - R) continue; }
      else { const br = c.br + R; if (x0 > c.cx + br || x1 < c.cx - br || y0 > c.cy + br || y1 < c.cy - br) continue; }
      this._collideOC(o, c, R, p0, p1);
    }
  }
};
World.prototype._collideOC = function (o, c, R, p0, p1) {
  const x = this.x, y = this.y, z = this.z, px = this.px, py = this.py, pz = this.pz, vx = this.vx, vy = this.vy, vz = this.vz, im = this.im, ctc = this.ctc;
  const ci = c.index, mu = Math.sqrt(o.friction * c.friction), mus = mu * 1.25, type = c.type;
  const cx = c.cx, cy = c.cy, sn = c.sn, cs = c.cs, kin = !!c.pose, ox = c.ox, oy = c.oy, osn = c.osn, ocs = c.ocs;
  const zc = c.zc, hd = c.hd, finZ = hd !== INF, d3 = o.dim3, ih = this._ih;
  const hitV = o.hitV, slideV = o.slideV, slideN = o.slideN, contactN = o.contactN;
  const sticky = o.sticky && c.sticky;
  for (let p = p0; p < p1; p++) {
    if (im[p] === 0) continue;
    const X = x[p], Y = y[p], Z = z[p];
    let d = 0, nlx = 0, nly = 0, nz = 0, lx = 0, ly = 0, hit = true;
    if (type === C_FLOOR) { d = c.Y - Y; nly = -1; if (d >= R) hit = false; }
    else if (type === C_CEIL) { d = Y - c.Y; nly = 1; if (d >= R) hit = false; }
    else if (type === C_WALL) { d = c.side * (X - c.X); nlx = c.side; if (d >= R) hit = false; }
    else {
      const rx = X - cx, ry = Y - cy;
      lx = cs * rx + sn * ry; ly = -sn * rx + cs * ry;
      if (type === C_BOX) {
        const qx = (lx < 0 ? -lx : lx) - c.hw, qy = (ly < 0 ? -ly : ly) - c.hh;
        if (qx >= R || qy >= R) hit = false;
        else if (qx > 0 && qy > 0) { const L = Math.sqrt(qx * qx + qy * qy); if (L >= R) hit = false; else { d = L; nlx = (lx < 0 ? -qx : qx) / L; nly = (ly < 0 ? -qy : qy) / L; } }
        else if (qx > qy) { d = qx; nlx = lx < 0 ? -1 : 1; }
        else { d = qy; nly = ly < 0 ? -1 : 1; }
      } else if (type === C_CIRCLE) {
        const L2 = lx * lx + ly * ly, rr = c.r + R;
        if (L2 >= rr * rr) hit = false;
        else { const L = Math.sqrt(L2); if (L > 1e-9) { nlx = lx / L; nly = ly / L; } else { nly = -1; } d = L - c.r; }
      } else if (type === C_CAPSULE) {
        const qx = lx < -c.hl ? -c.hl : (lx > c.hl ? c.hl : lx), ex = lx - qx, L2 = ex * ex + ly * ly, rr = c.r + R;
        if (L2 >= rr * rr) hit = false;
        else { const L = Math.sqrt(L2); if (L > 1e-9) { nlx = ex / L; nly = ly / L; } else { nly = -1; } d = L - c.r; }
      } else {   // convex polygon
        const n = c.n, VX = c.vx, VY = c.vy, NX = c.nx, NY = c.ny;
        let best = -INF, be = 0, outside = false;
        for (let e = 0; e < n; e++) { const s = (lx - VX[e]) * NX[e] + (ly - VY[e]) * NY[e]; if (s > best) { best = s; be = e; } if (s > 0) outside = true; }
        if (best >= R) hit = false;
        else if (!outside) { d = best; nlx = NX[be]; nly = NY[be]; }
        else {
          let md = INF, mx = 0, my = 0;
          for (let e = 0; e < n; e++) {
            const ax = VX[e], ay = VY[e], bx = VX[(e + 1) % n], by = VY[(e + 1) % n], ex = bx - ax, ey = by - ay;
            let u = ((lx - ax) * ex + (ly - ay) * ey) / (ex * ex + ey * ey); u = u < 0 ? 0 : (u > 1 ? 1 : u);
            const qx = ax + ex * u - lx, qy = ay + ey * u - ly, dd = qx * qx + qy * qy;
            if (dd < md) { md = dd; mx = -qx; my = -qy; }
          }
          const L = Math.sqrt(md);
          if (L >= R) hit = false; else { d = L; if (L > 1e-9) { nlx = mx / L; nly = my / L; } else { nlx = NX[be]; nly = NY[be]; } }
        }
      }
    }
    if (hit && finZ) {   // a slab of finite depth: the z faces and rounded edges
      const qz = (Z > zc ? Z - zc : zc - Z) - hd;
      if (qz >= R) hit = false;
      else if (d3) {
        if (qz > 0 && d > 0) { const L = Math.sqrt(d * d + qz * qz); if (L >= R) hit = false; else { const f = d / L; nlx *= f; nly *= f; nz = (Z > zc ? qz : -qz) / L; d = L; } }
        else if (qz > d) { d = qz; nlx = 0; nly = 0; nz = Z > zc ? 1 : -1; }
      }
    }
    if (!hit) { if (ctc[p] === ci) ctc[p] = -1; continue; }
    const pen = R - d;
    let nx = nlx, ny = nly;
    if (type < C_FLOOR) { nx = cs * nlx - sn * nly; ny = sn * nlx + cs * nly; }
    const Xn = X + nx * pen, Yn = Y + ny * pen, Zn = Z + nz * pen;
    let sx = 0, sy = 0;
    if (kin) { sx = X - (ocs * lx - osn * ly + ox); sy = Y - (osn * lx + ocs * ly + oy); }
    const rx = Xn - px[p] - sx, ry = Yn - py[p] - sy, rz = d3 ? Zn - pz[p] : 0, rn = rx * nx + ry * ny + rz * nz;
    const tx = rx - rn * nx, ty = ry - rn * ny, tz = rz - rn * nz, tl2 = tx * tx + ty * ty + tz * tz;
    let fx = Xn, fy = Yn, fz = Zn, tl = 0;
    if (tl2 > 1e-24) {
      tl = Math.sqrt(tl2);
      let k = tl < mus * pen ? 1 : mu * pen / tl; if (k > 1) k = 1;
      fx -= tx * k; fy -= ty * k; fz -= tz * k; tl *= 1 - k;
    }
    x[p] = fx; y[p] = fy; if (d3) z[p] = fz;
    // events: a new contact is an impact; sustained tangential motion is a slide
    if (!c.silent) {
      if (ctc[p] !== ci) {
        let vn = -(vx[p] * nx + vy[p] * ny + (d3 ? vz[p] * nz : 0));
        if (kin) vn += (sx * nx + sy * ny) * ih;
        if (vn > hitV[ci]) { hitV[ci] = vn; o.hitX[ci] = fx; o.hitY[ci] = fy; }
      }
      const vt = tl * ih; if (vt > slideV[ci]) slideV[ci] = vt;
      slideN[ci]++; contactN[ci]++;
    }
    ctc[p] = ci;
    if (sticky && this.stuck[p] < 0 && !this._warm) {
      this.stuck[p] = ci;
      const rx2 = fx - cx, ry2 = fy - cy;
      this._addPin(o, p - o.p0, { collider: c.id, local: [cs * rx2 + sn * ry2, -sn * rx2 + cs * ry2] }, { from: this._ts });
    }
  }
};
/* velocities from the substep's motion, capped at maxSpeed (a pin that over-stretched something and lets go must not whip it away) */
World.prototype._velocities = function (ih) {
  const O = this.objects, x = this.x, y = this.y, z = this.z, px = this.px, py = this.py, pz = this.pz, vx = this.vx, vy = this.vy, vz = this.vz, im = this.im;
  const vm = this.maxSpeed, vm2 = vm * vm;
  for (let oi = 0; oi < O.length; oi++) {
    const o = O[oi], p0 = o.p0, p1 = p0 + o.n;
    if (o.dim3) for (let p = p0; p < p1; p++) {
      let a = (x[p] - px[p]) * ih, b = (y[p] - py[p]) * ih, c = (z[p] - pz[p]) * ih; const v2 = a * a + b * b + c * c;
      if (v2 > vm2 && im[p] > 0) { const k = vm / Math.sqrt(v2); a *= k; b *= k; c *= k; }
      vx[p] = a; vy[p] = b; vz[p] = c;
    } else for (let p = p0; p < p1; p++) {
      let a = (x[p] - px[p]) * ih, b = (y[p] - py[p]) * ih; const v2 = a * a + b * b;
      if (v2 > vm2 && im[p] > 0) { const k = vm / Math.sqrt(v2); a *= k; b *= k; }
      vx[p] = a; vy[p] = b;
    }
  }
};
/* forces held for one step: gravity per object (gravityScale, balloon buoyancy) and the sheet drag (flutter) */
World.prototype._stepForces = function (t0) {
  const h = this.dt / this.sub, O = this.objects;
  const tw = this._warm ? 0 : t0;
  for (let oi = 0; oi < O.length; oi++) {
    const o = O[oi];
    o.on = tw >= o.a0 - 1e-9 && tw < o.a1 - 1e-9;
    o.dfac = 1 / (1 + h * (this.damping + o.damping));
    o.ab[0] = this.gx * o.gscale; o.ab[1] = this.gy * o.gscale; o.ab[2] = this.gz * o.gscale;
    if (o.type === 'cloth') this._flutter(o);
    else if (o.type === 'balloon') this._balloonStep(o, t0);
  }
};
World.prototype._flutter = function (o) {
  const k = o.flutter * 6 + this.air, ax = this.ax, ay = this.ay, az = this.az, p0 = o.p0, n = o.n;
  if (!(k > 0)) return;
  for (let p = p0; p < p0 + n; p++) { ax[p] = 0; ay[p] = 0; az[p] = 0; }
  const x = this.x, y = this.y, z = this.z, vx = this.vx, vy = this.vy, vz = this.vz, T = o.tri, dead = o.triDead, A0 = o.triA0, sh = o.share;
  const wx = this.wind[0], wy = this.wind[1], wz = this.wind[2];
  let pw = 0;
  for (let t = 0; t < o.nt; t++) {
    if (dead[t] !== INF) continue;
    const a = p0 + T[3 * t], b = p0 + T[3 * t + 1], c = p0 + T[3 * t + 2];
    const e1x = x[b] - x[a], e1y = y[b] - y[a], e1z = z[b] - z[a], e2x = x[c] - x[a], e2y = y[c] - y[a], e2z = z[c] - z[a];
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const nl = Math.sqrt(nx * nx + ny * ny + nz * nz); if (nl < 1e-9) continue;
    nx /= nl; ny /= nl; nz /= nl;
    const vn = ((vx[a] + vx[b] + vx[c]) / 3 - wx) * nx + ((vy[a] + vy[b] + vy[c]) / 3 - wy) * ny + ((vz[a] + vz[b] + vz[c]) / 3 - wz) * nz;
    if (vn === 0) continue;
    const f = -k * vn * A0[t] / 3;
    pw += vn * vn * A0[t];
    let q = a; ax[q] += f * nx / sh[q - p0]; ay[q] += f * ny / sh[q - p0]; az[q] += f * nz / sh[q - p0];
    q = b; ax[q] += f * nx / sh[q - p0]; ay[q] += f * ny / sh[q - p0]; az[q] += f * nz / sh[q - p0];
    q = c; ax[q] += f * nx / sh[q - p0]; ay[q] += f * ny / sh[q - p0]; az[q] += f * nz / sh[q - p0];
  }
  o.airP = pw;   // sum of vn^2 * area: the flap events read its rms
};
World.prototype.step = function () {
  if (!this._started) this._prepare();
  const dt = this.dt, sub = this.sub, h = dt / sub, ih2 = 1 / (h * h), warm = this._warm;
  const t0 = warm ? 0 : this.stepIndex * dt, t1 = warm ? 0 : t0 + dt;
  this._ih = 1 / h;
  if (!warm) { this._runSchedules(t0); if (this._ripi < this._ripq.length) this._runRips(t0); }
  const C = this.colliders;
  for (let i = 0; i < C.length; i++) {
    const c = C[i];
    if (!c.pose) continue;
    c.px = c.nx1; c.py = c.ny1; c.pa = c.na1;
    const p = c.pose(t1) || {};
    c.nx1 = num(p.x, c.nx1); c.ny1 = num(p.y, c.ny1); c.na1 = num(p.angle, c.na1);
  }
  this._pinTargets(t0, t1);
  this._stepForces(t0);
  for (let s = 1; s <= sub; s++) {
    const f = s / sub;
    this._ts = warm ? 0 : t0 + dt * f;
    this._colliderLerp(f);
    this._integrate(h);
    this._applyPins(f);
    this._solve(ih2, (s & 1) === 0);
    if (this._softOn && (s & 1) === 0) this._softCollide();   // every second substep: contacts between soft bodies are slow
    this._collide();
    this._velocities(this._ih);
  }
  if (!warm) this._stepEvents(t1);
  else this._clearContacts();
  if (!warm) { this.stepIndex++; this.time = this.stepIndex * dt; }
};

// ---------------------------------------------------------------- events
const KINDS = ['tear', 'crinkle', 'hit', 'slide', 'squeak', 'stretch', 'pop', 'flap'];
World.prototype._push = function (kind, o, c, x, y, mag, t, extra) {
  if (o.silent || (c && c.silent)) return;
  if (mag > 1) mag = 1; if (!(mag > 0)) return;
  const key = o.id * 16 + KINDS.indexOf(kind);
  const last = this._evLast.get(key);
  if (last !== undefined && t - last.t < this.evGap) {   // thinning: one per object and kind per 50 ms, keep the louder
    if (mag > last.mag) { last.mag = mag; last.x = x; last.y = y; last.t = t; if (c) { last.matB = c.mat; last.tagB = c.tag; last.b = c.id; } if (extra) for (const k in extra) last[k] = extra[k]; }
    else if (extra && extra.len) last.len = (last.len || 0) + extra.len;
    return;
  }
  if (this._raw.length >= this.maxEvents) return;
  const e = { t: t, kind: kind, id: o.id, tag: o.tag, mat: o.mat, matB: c ? c.mat : null, tagB: c ? c.tag : null, b: c ? c.id : -1, x: x, y: y, mag: mag };
  if (extra) for (const k in extra) e[k] = extra[k];
  this._raw.push(e); this._evLast.set(key, e);
};
function ln(x) {   // natural log with + - * / only (deterministic)
  if (!(x > 0)) return -745;
  let k = 0;
  while (x > 1.4142135623730951) { x *= 0.5; k++; }
  while (x < 0.7071067811865476) { x *= 2; k--; }
  const y = (x - 1) / (x + 1), y2 = y * y;
  return k * 0.6931471805599453 + 2 * y * (1 + y2 * (1 / 3 + y2 * (1 / 5 + y2 * (1 / 7 + y2 * (1 / 9 + y2 * (1 / 11 + y2 * (1 / 13)))))));
}
/* speed (px/s) -> 0..1 on a log scale: 40 px/s is silent, 1600 px/s is full */
function speedMag(v, v0, v1) { if (!(v > v0)) return 0; const m = ln(v / v0) / ln(v1 / v0); return m > 1 ? 1 : m; }
World.prototype._stepEvents = function (t) {
  const O = this.objects, C = this.colliders, dt = this.dt;
  for (let oi = 0; oi < O.length; oi++) {
    const o = O[oi], cl = o.cl;
    if (!o.on) continue;
    for (let m = 0; m < cl.length; m++) {
      const ci = cl[m], c = C[ci];
      const v = o.hitV[ci];
      if (v > 40) {
        const cnt = o.contactN[ci] / this.sub, mass = cnt > 1 ? 0.12 * ln(cnt) / ln(2) : 0;
        this._push('hit', o, c, o.hitX[ci], o.hitY[ci], Math.min(1, speedMag(v, 40, 1600) * (o.type === 'rope' ? 0.8 : 1) + mass * 0.5), t, { speed: Math.round(v) });
      }
      if (o.slideN[ci] > 0 && o.slideV[ci] > 60) {
        o.slideT[ci] += dt;
        if (o.slideT[ci] >= 0.1) {
          o.slideT[ci] = 0;
          const sq = o.mat === 'nitrile';
          this._push(sq ? 'squeak' : 'slide', o, c, o.hitX[ci] || 0, o.hitY[ci] || 0, Math.min(0.85, 0.15 + 0.6 * speedMag(o.slideV[ci], 60, 1200)), t, { speed: Math.round(o.slideV[ci]) });
        }
      } else o.slideT[ci] = 0;
    }
    if (o.type === 'cloth') this._clothEvents(o, t);
    else if (o.type === 'rope') this._ropeEvents(o, t);
    else if (o.type === 'balloon') this._balloonEvents(o, t);
    for (let m = 0; m < cl.length; m++) { const ci = cl[m]; o.hitV[ci] = 0; o.slideV[ci] = 0; o.slideN[ci] = 0; o.contactN[ci] = 0; }
  }
};
World.prototype._clearContacts = function () {
  for (const o of this.objects) { o.hitV.fill(0); o.slideV.fill(0); o.slideN.fill(0); o.contactN.fill(0); }
};
/* cloth: 'crinkle' when stiff paper bends fast (the rate of change of its bend constraints), 'flap' from the air drag power (a pad
 * shaken out, a scrap fluttering down) */
World.prototype._clothEvents = function (o, t) {
  const x = this.x, y = this.y, z = this.z, ca = this.ca, cb = this.cb, cr = this.crest, con = this.con, b0 = o.c0 + o.nStruct, nb = o.c1 - b0;
  if (o.m.crinkle && nb > 0) {
    const pb = o.prevBend || (o.prevBend = new Float64Array(nb).fill(-1));
    let sum = 0, best = 0, bx = 0, by = 0, cnt = 0;
    for (let i = 0; i < nb; i++) {
      const k = b0 + i; if (!con[k]) continue;
      const a = ca[k], b = cb[k], dx = x[b] - x[a], dy = y[b] - y[a], dz = z[b] - z[a], d = Math.sqrt(dx * dx + dy * dy + dz * dz) / cr[k];
      if (pb[i] >= 0) { const dd = d > pb[i] ? d - pb[i] : pb[i] - d; sum += dd; cnt++; if (dd > best) { best = dd; bx = (x[a] + x[b]) / 2; by = (y[a] + y[b]) / 2; } }
      pb[i] = d;
    }
    const rate = cnt ? sum / cnt / this.dt : 0;   // mean fold speed (fraction of length per second)
    if (rate > 0.25) this._push('crinkle', o, null, bx, by, Math.min(1, 0.2 + 0.8 * speedMag(rate, 0.25, 6)), t, { rate: Math.round(rate * 100) / 100 });
  }
  if (o.airP > 0) {
    const rms = Math.sqrt(o.airP / o.area0);
    if (rms > 120) { const c = o.p0 + (o.n >> 1); this._push('flap', o, null, x[c], y[c], Math.min(0.9, 0.15 + 0.75 * speedMag(rms, 120, 1500)), t, { speed: Math.round(rms) }); }
  }
};
/* rope: 'stretch' when a strap or ribbon snaps taut (from slack to its full length), 'flap' when a free length whips through the air */
World.prototype._ropeEvents = function (o, t) {
  const x = this.x, y = this.y, p0 = o.p0, N = o.N;
  let L = 0, R = 0, sp = 0;
  for (let i = 0; i < N; i++) { if (o.segDead[i] !== INF) continue; const a = p0 + i, b = a + 1, dx = x[b] - x[a], dy = y[b] - y[a]; L += Math.sqrt(dx * dx + dy * dy); R += o.segLen; }
  for (let i = 0; i <= N; i++) { const q = p0 + i; sp += Math.sqrt(this.vx[q] * this.vx[q] + this.vy[q] * this.vy[q]); }
  sp /= N + 1;
  const r = R > 0 ? L / R : 0, rate = (r - (o.lastR || r)) / this.dt;
  o.lastR = r;
  if (r > 0.995 && o.slackT > 0.15 && rate > 0.05) { const c = p0 + (N >> 1); this._push('stretch', o, null, x[c], y[c], Math.min(1, 0.3 + 0.7 * speedMag(rate, 0.05, 3)), t, { rate: Math.round(rate * 100) / 100 }); o.slackT = 0; }
  if (r < 0.985) o.slackT = (o.slackT || 0) + this.dt; else if (r > 0.995) o.slackT = 0;
  let touching = false; for (let m = 0; m < o.cl.length; m++) if (o.contactN[o.cl[m]] > 0) { touching = true; break; }
  if (!touching && sp > 350) { const c = p0 + (N >> 1); this._push('flap', o, null, x[c], y[c], Math.min(0.85, 0.15 + 0.7 * speedMag(sp, 350, 2500)), t, { speed: Math.round(sp) }); }
};
World.prototype._finishEvents = function () {
  const ev = this._raw.filter(function (e) { return e.mag > 0; });
  ev.sort(function (a, b) { return a.t - b.t || a.id - b.id || KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind); });
  for (const e of ev) { e.t = Math.round(e.t * 1e6) / 1e6; e.mag = Math.round(e.mag * 1000) / 1000; e.x = Math.round(e.x * 10) / 10; e.y = Math.round(e.y * 10) / 10; }
  this.events = ev;
};

// ---------------------------------------------------------------- warmup, run, sampling
/* settle before t = 0: time is held at 0 (pins at their t = 0 targets, kinematic colliders at pose(0)), no schedules, no events */
World.prototype.warmup = function (seconds) {
  if (this._ran) throw new Error('SOFT2D: warmup() must come before run()');
  if (!this._started) this._prepare();
  this._warm = true;
  const n = Math.round(num(seconds, 0) * this.rate);
  for (let i = 0; i < n; i++) this.step();
  this._warm = false; this.stepIndex = 0; this.time = 0;
  for (const p of this._pins) { if (p.on) { this.pinCnt[p.p]--; this.im[p.p] = this.pinCnt[p.p] > 0 ? 0 : this.im0[p.p]; } p.on = false; }
  this.ctc.fill(-1);
  return this;
};
World.prototype._allocRec = function (ns) {
  for (const o of this.objects) {
    o.dims = o.dim3 ? 3 : 2; o.buf = new Float32Array(ns * o.n * o.dims);
    if (o.type === 'balloon') { o.areaBuf = new Float32Array(ns); o.presBuf = new Float32Array(ns); }
  }
  this._kin = this.colliders.filter(function (c) { return !!c.pose; });
  this.cbuf = new Float32Array(ns * 3 * this._kin.length);
};
World.prototype._record = function (si) {
  const x = this.x, y = this.y, z = this.z;
  for (const o of this.objects) {
    const n = o.n, d = o.dims, buf = o.buf, base = si * n * d;
    for (let k = 0; k < n; k++) {
      const p = o.p0 + k;
      let a = x[p], b = y[p];
      if (!(a === a && b === b) || a > 1e7 || a < -1e7 || b > 1e7 || b < -1e7) {   // never let a NaN reach a renderer: freeze at the last good sample
        if (this.warnings.length < 50) this.warnings.push(o.type + ' ' + o.id + ' (' + o.tag + ') particle ' + k + ' left the finite world at sample ' + si);
        const q = (si > 0 ? si - 1 : 0) * n * d + k * d;
        a = si > 0 ? buf[q] : o.ix[k]; b = si > 0 ? buf[q + 1] : o.iy[k];
        x[p] = a; y[p] = b; this.vx[p] = 0; this.vy[p] = 0; this.px[p] = a; this.py[p] = b;
        if (d === 3) { z[p] = si > 0 ? buf[q + 2] : o.iz[k]; this.vz[p] = 0; this.pz[p] = z[p]; }
      }
      buf[base + k * d] = a; buf[base + k * d + 1] = b;
      if (d === 3) buf[base + k * d + 2] = z[p];
    }
    if (o.type === 'balloon') { o.areaBuf[si] = o.curArea; o.presBuf[si] = o.curP; }
  }
  const K = this._kin;
  for (let i = 0; i < K.length; i++) { const c = K[i], q = (si * K.length + i) * 3; this.cbuf[q] = c.cx; this.cbuf[q + 1] = c.cy; this.cbuf[q + 2] = c.ca; }
};
/* simulate 0..T once and keep sampled particle positions (Float32). sampleHz should divide the step rate (default 120). */
World.prototype.run = function (T, opts) {
  opts = opts || {};
  if (this._ran) { if (T <= this.T + 1e-9) return this; throw new Error('SOFT2D: this world already ran for ' + this.T + ' s; build a new world to run longer'); }
  if (!this._started) this._prepare();
  const hz = opts.sampleHz || 120;
  this.sps = Math.max(1, Math.round(this.rate / hz)); this.sampleDt = this.sps * this.dt; this.sampleHz = 1 / this.sampleDt;
  const ns = Math.floor(num(T, 0) / this.sampleDt + 1e-9) + 1;
  this.ns = ns; this.T = (ns - 1) * this.sampleDt;
  this._allocRec(ns); this._ran = true;
  if (this.balloons.length) this._balloonSync(0);
  this._record(0);
  for (let i = 1; i < ns; i++) { for (let k = 0; k < this.sps; k++) this.step(); this._record(i); }
  this._finishEvents();
  return this;
};
World.prototype.makeState = function () {
  const st = { t: 0, cloths: [], ropes: [], balloons: [], colliders: [], by: {} };
  for (const o of this.cloths) {
    const e = { id: o.id, type: 'cloth', tag: o.tag, mat: o.mat, cols: o.cols, rows: o.rows, width: o.width, height: o.height, pts: new Float32Array(2 * o.n), z: new Float32Array(o.n),
      uv: o.uv, tri: o.tri, alive: new Uint8Array(o.nt).fill(1), torn: new Uint8Array(o.n), triN: o.triN, n: o.n, nt: o.nt, flat: true };
    st.cloths.push(e); st.by[o.id] = e;
  }
  for (const o of this.ropes) { const e = { id: o.id, type: 'rope', tag: o.tag, mat: o.mat, n: o.n, width: o.width, pts: new Float32Array(2 * o.n), alive: new Uint8Array(o.N).fill(1) }; st.ropes.push(e); st.by[o.id] = e; }
  for (const o of this.balloons) { const e = { id: o.id, type: 'balloon', tag: o.tag, mat: o.mat, n: o.n, pts: new Float32Array(2 * o.n), area: 0, area0: o.area0, pressure: 0, popped: false, outline: o.outlineKind, cuff: o.cuff, knot: o.knot, tips: o.tips }; st.balloons.push(e); st.by[o.id] = e; }
  for (const c of this.colliders) st.colliders.push({ id: c.id, tag: c.tag, x: c.x, y: c.y, angle: c.angle });
  return st;
};
/* the state at time t (clamped to 0..T), interpolated between samples; a pure function of t. The returned object is reused unless you pass `out`. */
World.prototype.at = function (t, out) {
  if (!this._ran) throw new Error('SOFT2D: call run(T) before at(t)');
  const st = out || this._st || (this._st = this.makeState());
  let k = t / this.sampleDt; const maxK = this.ns - 1;
  if (!(k > 0)) k = 0; else if (k > maxK) k = maxK;
  let i0 = Math.floor(k); if (i0 >= maxK) i0 = maxK > 0 ? maxK - 1 : 0;
  const f = maxK > 0 ? k - i0 : 0, g = 1 - f, i1 = maxK > 0 ? i0 + 1 : 0;
  const tt = (i0 + f) * this.sampleDt;
  st.t = t;
  for (let ci = 0; ci < this.cloths.length; ci++) {
    const o = this.cloths[ci], s = st.cloths[ci], n = o.n, buf = o.buf, a0 = i0 * n * 3, a1 = i1 * n * 3, P = s.pts, Z = s.z;
    let zmin = INF, zmax = -INF;
    for (let q = 0; q < n; q++) {
      const u = a0 + 3 * q, v = a1 + 3 * q;
      P[2 * q] = buf[u] * g + buf[v] * f; P[2 * q + 1] = buf[u + 1] * g + buf[v + 1] * f;
      const zz = Z[q] = buf[u + 2] * g + buf[v + 2] * f; if (zz < zmin) zmin = zz; if (zz > zmax) zmax = zz;
    }
    s.flat = zmax - zmin < 0.5;
    const TD = o.triDead, A = s.alive; for (let q = 0; q < o.nt; q++) A[q] = TD[q] > tt ? 1 : 0;
    const TT = o.tornT, TR = s.torn; for (let q = 0; q < n; q++) TR[q] = TT[q] <= tt ? 1 : 0;
  }
  for (let ri = 0; ri < this.ropes.length; ri++) {
    const o = this.ropes[ri], s = st.ropes[ri], n = o.n, buf = o.buf, a0 = i0 * n * 2, a1 = i1 * n * 2, P = s.pts;
    for (let q = 0; q < 2 * n; q++) P[q] = buf[a0 + q] * g + buf[a1 + q] * f;
    const SD = o.segDead, A = s.alive; for (let q = 0; q < o.N; q++) A[q] = SD[q] > tt ? 1 : 0;
  }
  for (let bi = 0; bi < this.balloons.length; bi++) {
    const o = this.balloons[bi], s = st.balloons[bi], n = o.n, buf = o.buf, a0 = i0 * n * 2, a1 = i1 * n * 2, P = s.pts;
    for (let q = 0; q < 2 * n; q++) P[q] = buf[a0 + q] * g + buf[a1 + q] * f;
    s.area = o.areaBuf[i0] * g + o.areaBuf[i1] * f; s.pressure = o.presBuf[i0] * g + o.presBuf[i1] * f; s.popped = o.popT <= tt;
  }
  const K = this._kin, nk = K.length;
  for (let i = 0; i < nk; i++) {
    const c = K[i], e = st.colliders[c.index], q0 = (i0 * nk + i) * 3, q1 = (i1 * nk + i) * 3;
    e.x = this.cbuf[q0] * g + this.cbuf[q1] * f; e.y = this.cbuf[q0 + 1] * g + this.cbuf[q1 + 1] * f; e.angle = this.cbuf[q0 + 2] * g + this.cbuf[q1 + 2] * f;
  }
  return st;
};

// ---------------------------------------------------------------- balloons: closed loops with an area target, a shape and buoyancy
/* the glove outline, raw: knot first, visually counter-clockwise (bottom -> right -> fingers right to left -> thumb -> left -> cuff),
 * origin at the palm centre, about 250 px tall at puff 1. puff 0 is the flat (limp) glove: same points, thinner fingers. */
function gloveRaw(puff) {
  const pf = puff < 0 ? 0 : (puff > 1.6 ? 1.6 : puff), out = [], tips = [];
  const fw = 16 + 13 * pf, pw = 52 + 9 * pf, ph = 44 + 8 * pf, cwT = 19 + 3 * pf, cwB = 23 + 4 * pf, cy0 = ph * 0.92, cuffY = ph + 30 + 2 * pf;
  const push = function (x, y) { out.push([x, y]); };
  const ell = function (a0, a1, n) { for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * PI / 180; sincos(a); push(pw * _cs, ph * _sn); } };
  const finger = function (bx, by, th, L, w) {   // up the right side, over the tip, down the left side
    sincos(th); const ux = _sn, uy = -_cs, rx = _cs, ry = _sn, tx = bx + ux * (L - w / 2), ty = by + uy * (L - w / 2);
    for (let i = 0; i < 3; i++) { const f = i / 3; push(bx + rx * w / 2 + (tx - bx) * f, by + ry * w / 2 + (ty - by) * f); }
    tips.push(out.length + 3);
    for (let i = 0; i <= 6; i++) { const a = PI * i / 6; sincos(a); push(tx + rx * _cs * w / 2 + ux * _sn * w / 2, ty + ry * _cs * w / 2 + uy * _sn * w / 2); }
    for (let i = 1; i <= 3; i++) { const f = i / 3; push(tx - rx * w / 2 + (bx - tx) * f, ty - ry * w / 2 + (by - ty) * f); }
  };
  push(0, cuffY + 4);                                   // the knot
  push(cwB, cuffY); push(cwT, cy0 + 6);                 // cuff, right
  ell(72, -28, 5);                                      // palm, right side
  const sp = 25 + 5 * pf, byf = -ph * 0.62;
  const F = [[1.5 * sp, 0.2, 62], [0.5 * sp, 0.06, 78], [-0.5 * sp, -0.05, 84], [-1.5 * sp, -0.18, 74]];   // pinky, ring, middle, index
  for (let f = 0; f < 4; f++) {
    finger(F[f][0], byf, F[f][1], F[f][2] * (1 - 0.06 * pf) + ph * 0.38, fw);
    if (f < 3) push((F[f][0] + F[f + 1][0]) / 2, byf - 2 + 5 * (1 - pf));   // the valley between two fingers
  }
  push(-pw * 0.86, -ph * 0.42);                          // palm, upper left, to the thumb
  finger(-pw * 0.84, -ph * 0.02, -1.02, 62 - 4 * pf, fw * 1.12);
  ell(158, 105, 4);                                     // palm, left side down to the neck
  push(-cwT, cy0 + 6); push(-cwB, cuffY);               // cuff, left
  out.tips = tips;                                      // raw indices of the finger tips: pinky, ring, middle, index, thumb
  return out;
}
/* the particle nearest each raw tip index after resampling */
function tipIdx(rawTips, idx) { return rawTips.map(function (r) { let best = 0, bd = INF; for (let k = 0; k < idx.length; k++) { const d = Math.abs(idx[k] - r); if (d < bd) { bd = d; best = k; } } return best; }); }
/* SOFT2D.gloveOutline({ scale, puff, segments }): the inflated glove (puff 1) as [[x,y],...], knot first, counter-clockwise */
function gloveOutline(o) {
  o = o || {};
  const sc = num(o.scale, 1), raw = gloveRaw(num(o.puff, 1));
  if (!o.segments) return raw.map(function (q) { return [q[0] * sc, q[1] * sc]; });
  const full = gloveRaw(1), fr = resampleIdx(full, o.segments | 0);
  const res = fr.map(function (r) { const q = atIdx(raw, r); return [q[0] * sc, q[1] * sc]; });
  res.tips = tipIdx(full.tips, fr); res.knot = 0;
  return res;
}
/* fractional raw indices of n points evenly spaced by arc length along a closed polyline (the first point stays first) */
function resampleIdx(P, n) {
  const m = P.length, cum = [0];
  for (let i = 0; i < m; i++) { const a = P[i], b = P[(i + 1) % m]; cum.push(cum[i] + Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]))); }
  const L = cum[m], out = [];
  for (let k = 0, s = 0; k < n; k++) { const want = L * k / n; while (s < m - 1 && cum[s + 1] < want) s++; const sl = cum[s + 1] - cum[s]; out.push(s + (sl > 0 ? (want - cum[s]) / sl : 0)); }
  return out;
}
function atIdx(P, r) { const m = P.length, i = Math.floor(r), f = r - i, a = P[i % m], b = P[(i + 1) % m]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
function polyArea(X, Y, n) { let A = 0; for (let i = 0; i < n; i++) { const j = i + 1 === n ? 0 : i + 1; A += X[i] * Y[j] - X[j] * Y[i]; } return A / 2; }

World.prototype.balloon = function (def) {
  if (this._started) throw new Error('SOFT2D: add balloons before warmup()/run()');
  def = def || {};
  const o = new SoftObj(this, 'balloon', def);
  const n = Math.max(8, (def.segments | 0) || 64), sc = num(def.scale, 1);
  let full, flat;
  o.outlineKind = typeof def.outline === 'string' ? def.outline : (def.outline ? 'custom' : 'circle');
  o.tips = [];
  if (o.outlineKind === 'glove') {
    const rf = gloveRaw(1), r0 = gloveRaw(0), idx = resampleIdx(rf, n);
    full = idx.map(function (r) { return atIdx(rf, r); }); flat = idx.map(function (r) { return atIdx(r0, r); });
    o.tips = tipIdx(rf.tips, idx);   // ADDED: particle indices of the finger tips (pinky, ring, middle, index, thumb)
  } else {
    let P;
    if (o.outlineKind === 'circle') { P = []; const R = num(def.radius, 60); for (let k = 0; k < 96; k++) { sincos(HALF_PI + TWO_PI * k / 96); P.push([R * _cs, R * _sn]); } }   // knot at the bottom
    else P = def.outline.map(function (q) { return [+q[0], +q[1]]; });
    let A = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; }
    if (A > 0) { const first = P[0]; P = [first].concat(P.slice(1).reverse()); }   // make it visually counter-clockwise, keep the first point first
    const idx = resampleIdx(P, n); full = idx.map(function (r) { return atIdx(P, r); });
    let cx = 0, cy = 0; for (const q of full) { cx += q[0] / n; cy += q[1] / n; }
    flat = full.map(function (q) { return [cx + (q[0] - cx) * 0.55, cy + (q[1] - cy) * 0.55]; });   // limp: a small slack pouch
  }
  o._alloc(n);
  const x0 = num(def.x, 0), y0 = num(def.y, 0), zc = num(def.z, 0);
  const p0 = typeof def.pressure === 'function' ? num(def.pressure(0), 1) : num(def.pressure, 1);
  const f0 = p0 < 0 ? 0 : (p0 > 1 ? 1 : p0);
  for (let k = 0; k < n; k++) { o.ix[k] = x0 + sc * (flat[k][0] + (full[k][0] - flat[k][0]) * f0); o.iy[k] = y0 + sc * (flat[k][1] + (full[k][1] - flat[k][1]) * f0); o.iz[k] = zc; }
  o.QFx = new Float64Array(n); o.QFy = new Float64Array(n); o.Q0x = new Float64Array(n); o.Q0y = new Float64Array(n);
  let fcx = 0, fcy = 0, lcx = 0, lcy = 0; for (let k = 0; k < n; k++) { fcx += full[k][0] / n; fcy += full[k][1] / n; lcx += flat[k][0] / n; lcy += flat[k][1] / n; }
  for (let k = 0; k < n; k++) { o.QFx[k] = sc * (full[k][0] - fcx); o.QFy[k] = sc * (full[k][1] - fcy); o.Q0x[k] = sc * (flat[k][0] - lcx); o.Q0y[k] = sc * (flat[k][1] - lcy); }
  o.area1 = -polyArea(o.QFx, o.QFy, n); o.area0 = o.area1; o.areaFlat = -polyArea(o.Q0x, o.Q0y, n);   // positive for counter-clockwise
  let per = 0; for (let k = 0; k < n; k++) { const j = (k + 1) % n; per += Math.sqrt((o.QFx[j] - o.QFx[k]) * (o.QFx[j] - o.QFx[k]) + (o.QFy[j] - o.QFy[k]) * (o.QFy[j] - o.QFy[k])); }
  o.size = per / PI; o.perim = per;   // about the diameter: the length scale of the shape softness
  const mass = num(def.mass, 0.02), mp = mass / n; o.mp = mp;
  for (let k = 0; k < n; k++) o.iw[k] = 1 / mp;
  o.thickness = num(def.thickness, o.m.thickness != null ? o.m.thickness : 2);
  o.N = n;
  const sS = num(def.stretch, 0.02), sB = num(def.bend, 0.15);
  const s0 = p0 > 1 ? Math.sqrt(p0) : 1, G0x = new Float64Array(n), G0y = new Float64Array(n);
  for (let k = 0; k < n; k++) { G0x[k] = (o.Q0x[k] + (o.QFx[k] - o.Q0x[k]) * f0) * s0; G0y[k] = (o.Q0y[k] + (o.QFy[k] - o.Q0y[k]) * f0) * s0; }
  const dist = function (a, b) { return Math.sqrt((G0x[b] - G0x[a]) * (G0x[b] - G0x[a]) + (G0y[b] - G0y[a]) * (G0y[b] - G0y[a])); };
  for (let k = 0; k < n; k++) o.cons.push([k, (k + 1) % n, dist(k, (k + 1) % n), sS, K_STRETCH, 0]);          // rest lengths follow the inflation (reset every step)
  if (def.bend !== false) for (let k = 0; k < n; k++) o.cons.push([k, (k + 2) % n, dist(k, (k + 2) % n), sB, K_BEND, 0]);
  o.nStruct = n;
  const ord = []; for (let par = 0; par < 2; par++) for (let k = par; k < n; k += 2) ord.push(k); for (let g = 0; g < 4; g += 2) for (let k = g; k < n; k += 4) { ord.push(n + k); if (k + 1 < n) ord.push(n + k + 1); }
  o.order = def.bend !== false ? ord : ord.slice(0, n);
  o.pressureFn = typeof def.pressure === 'function' ? def.pressure : null; o.pressureV = typeof def.pressure === 'function' ? 1 : num(def.pressure, 1);
  o.buoyancy = num(def.buoyancy, 0);
  o.shapeFull = num(def.shape, 0.004); o.shapeLimp = num(def.limp, 0.03);   // shape softness when full and when limp (fraction of its size it gives under its weight)
  o.gasW = TWO_PI * num(def.gasHz, 5);   // the gas spring (squash and bulge), about 5 Hz
  o.popAt = def.pop ? num(def.pop.pressure, 3) : INF; o.popT = INF;
  const kc = def.keel === false ? 0 : Math.max(1, Math.round(n * 0.05));   // particles each side of the knot that get no lift
  o.keel = new Float64Array(n).fill(n / (n - (2 * kc + 1 > n ? 0 : 2 * kc + 1)));
  if (kc) for (let k = -kc; k <= kc; k++) o.keel[(k + n) % n] = 0;
  o.softCollide = !!def.softCollide;
  o.cuff = o.outlineKind === 'glove' ? 2 : 0; o.knot = 0;
  o.pins = [];
  const pins = def.pins || [];
  for (let m = 0; m < pins.length; m++) { const p = pins[m]; let k = p.k != null ? p.k | 0 : (p.index | 0); if (k < 0) k = n + k; this._addPin(o, k, p.to, p); }
  this.objects.push(o); this.balloons.push(o);
  return o;
};
World.prototype._prepareBalloons = function () {
  for (const o of this.balloons) {
    o.gx = new Float64Array(o.n); o.gy = new Float64Array(o.n);
    o.curP = 0; o.curArea = 0; o.fill = 0; o.Atgt = 0; o.smA = 0; o.popped = false; o.bHitV = 0; o.bSlideV = 0; o.bSlideN = 0; o.bSlideT = 0;
    this._balloonStep(o, 0, true);
  }
  this._balloonSync();
};
World.prototype._balloonSync = function () {
  for (const o of this.balloons) { const X = this.x.subarray(o.p0, o.p0 + o.n), Y = this.y.subarray(o.p0, o.p0 + o.n); o.curArea = -polyArea(X, Y, o.n); }
};
/* per step: the pressure now, the target shape (flat -> full with the pressure, scaled past 1), rest lengths, buoyancy */
World.prototype._balloonStep = function (o, t0, init) {
  let p = o.pressureFn ? num(o.pressureFn(t0), 0) : o.pressureV;
  if (p < 0) p = 0;
  if (!o.popped && p > o.popAt && !init) {
    o.popped = true; o.popT = t0;
    this._kill(o.c0 + o.N - 1);   // the membrane splits open
    const X = this.x, Y = this.y; let cx = 0, cy = 0; for (let k = 0; k < o.n; k++) { cx += X[o.p0 + k] / o.n; cy += Y[o.p0 + k] / o.n; }
    for (let k = 0; k < o.n; k++) { const q = o.p0 + k, dx = X[q] - cx, dy = Y[q] - cy, l = Math.sqrt(dx * dx + dy * dy) || 1; this.vx[q] += dx / l * 900; this.vy[q] += dy / l * 900; }
    this._push('pop', o, null, cx, cy, 1, t0);
  }
  o.curP = o.popped ? 0 : p;
  const f = p > 1 ? 1 : p, s = p > 1 ? Math.sqrt(p) : 1, n = o.n, gx = o.gx, gy = o.gy;
  for (let k = 0; k < n; k++) { gx[k] = (o.Q0x[k] + (o.QFx[k] - o.Q0x[k]) * f) * s; gy[k] = (o.Q0y[k] + (o.QFy[k] - o.Q0y[k]) * f) * s; }
  o.Atgt = -polyArea(gx, gy, n);
  const cr = this.crest;
  if (cr && !init) {
    for (let k = 0; k < n; k++) { const j = (k + 1) % n, i2 = (k + 2) % n; cr[o.c0 + k] = Math.sqrt((gx[j] - gx[k]) * (gx[j] - gx[k]) + (gy[j] - gy[k]) * (gy[j] - gy[k])); if (o.c1 - o.c0 > n) cr[o.c0 + n + k] = Math.sqrt((gx[i2] - gx[k]) * (gx[i2] - gx[k]) + (gy[i2] - gy[k]) * (gy[i2] - gy[k])); }
  }
  // shape softness: limp (soft) to full (firm), geometric between them
  const sl = o.shapeLimp, sf = o.shapeFull, soft = o.popped ? INF : sl * (f <= 0 ? 1 : (f >= 1 ? sf / sl : 1 - f + f * sf / sl));
  o.smA = soft === INF ? INF : soft * o.size / (o.mp * this.G);      // compliance of the pull toward the target shape
  o.fill = o.curArea > 0 ? Math.min(2, o.curArea / o.area1) : 0;
  if (!init && this.ay) {   // buoyancy: no lift on the knot and cuff (the heavy tied end), the rest lifted a little more: it rises knot-down
    const lift = o.buoyancy * o.fill, ux = this.gm > 0 ? this.gx / this.gm : 0, uy = this.gm > 0 ? this.gy / this.gm : 1, ax = this.ax, ay = this.ay;
    for (let k = 0; k < n; k++) { const q = o.p0 + k, l = o.keel[k] * lift; ax[q] = -ux * l; ay[q] = -uy * l; }
  }
};
/* per substep: the area constraint (gas) and the pull toward the best-fit rotated target shape (shape matching, XPBD-style) */
World.prototype._solveBalloon = function (o, ih2) {
  if (o.popped) return;
  const n = o.n, p0 = o.p0, X = this.x, Y = this.y, W = this.im, gx = o.gx, gy = o.gy;
  // area: C = A - Atgt (A positive for counter-clockwise); grad_k = ((y[k-1] - y[k+1]) / 2, (x[k+1] - x[k-1]) / 2) with the sign for CCW
  if (o.curP > 0.02) {
    let A = 0, den = 0;
    for (let k = 0; k < n; k++) { const j = k + 1 === n ? 0 : k + 1; A += X[p0 + k] * Y[p0 + j] - X[p0 + j] * Y[p0 + k]; }
    A = -A / 2;
    for (let k = 0; k < n; k++) { const a = p0 + (k === 0 ? n - 1 : k - 1), b = p0 + (k + 1 === n ? 0 : k + 1), gxk = (Y[b] - Y[a]) / 2, gyk = (X[a] - X[b]) / 2; den += W[p0 + k] * (gxk * gxk + gyk * gyk); }
    const C = A - o.Atgt;
    if (den > 0 && (C < 0 || o.curP >= 0.3)) {
      // the gas is a spring of angular frequency gasHz (XPBD compliance chosen so one substep moves (w h)^2 of the way), not a rod
      const e = o.gasW * o.gasW / ih2, lam = -C / (den / e);
      // apply with the gradients at the start of this pass (Jacobi over the loop: no order bias)
      let px_ = X[p0 + n - 1], py_ = Y[p0 + n - 1];
      const x0 = X[p0], y0 = Y[p0];
      for (let k = 0; k < n; k++) {
        const q = p0 + k, nb = k + 1 === n ? p0 : q + 1, nxv = k + 1 === n ? x0 : X[nb], nyv = k + 1 === n ? y0 : Y[nb];
        const gxk = (py_ - nyv) / 2, gyk = (nxv - px_) / 2;   // dA/dx_k, dA/dy_k (A positive counter-clockwise)
        px_ = X[q]; py_ = Y[q];
        X[q] += W[q] * lam * gxk; Y[q] += W[q] * lam * gyk;
      }
    }
    o.curArea = A;
  } else { o.curArea = -polyArea(X.subarray(p0, p0 + n), Y.subarray(p0, p0 + n), n); }
  // shape matching: best rotation of the target onto the particles (2D polar decomposition, no trig), then a compliant pull
  if (o.smA !== INF) {
    let cx = 0, cy = 0; for (let k = 0; k < n; k++) { cx += X[p0 + k]; cy += Y[p0 + k]; } cx /= n; cy /= n;
    let a = 0, b = 0;
    for (let k = 0; k < n; k++) { const px = X[p0 + k] - cx, py = Y[p0 + k] - cy; a += px * gx[k] + py * gy[k]; b += py * gx[k] - px * gy[k]; }
    const l = Math.sqrt(a * a + b * b) || 1, cs = a / l, sn = b / l, fr = 1 / (1 + o.smA * ih2 * o.mp);
    for (let k = 0; k < n; k++) {
      const q = p0 + k; if (W[q] === 0) continue;
      const tx = cx + cs * gx[k] - sn * gy[k], ty = cy + sn * gx[k] + cs * gy[k];
      X[q] += (tx - X[q]) * fr; Y[q] += (ty - Y[q]) * fr;
    }
  }
};
World.prototype._balloonEvents = function (o, t) {
  if (o.bHitV > 60 && o.bOther) this._push('hit', o, { mat: o.bOther.mat, tag: o.bOther.tag, id: o.bOther.id, silent: false }, o.bHitX, o.bHitY, Math.min(1, speedMag(o.bHitV, 60, 900)), t, { speed: Math.round(o.bHitV) });
  if (o.bSlideN > 0 && o.bSlideV > 40) {
    o.bSlideT += this.dt;
    if (o.bSlideT >= 0.12) { o.bSlideT = 0; this._push('squeak', o, o.bOther ? { mat: o.bOther.mat, tag: o.bOther.tag, id: o.bOther.id } : null, o.bHitX, o.bHitY, Math.min(0.8, 0.2 + 0.5 * speedMag(o.bSlideV, 40, 600)), t, { speed: Math.round(o.bSlideV) }); }
  } else o.bSlideT = 0;
  o.bHitV = 0; o.bSlideV = 0; o.bSlideN = 0;
};

/* softCollide: particles of different soft-colliding objects keep apart (radius about half their spacing, so loops cannot slip through
 * each other); a spatial hash over those particles, every substep. Balloon on balloon makes 'hit' (bonk) and 'squeak' events. */
World.prototype._prepareSoft = function () {
  const L = this._softList = this.objects.filter(function (o) { return o.softCollide; });
  this._softOn = L.length > 1;
  if (!this._softOn) return;
  this.rs = new Float64Array(this.np); let mr = 0;
  for (const o of L) {
    const sp = o.type === 'balloon' ? o.perim / o.n : (o.type === 'cloth' ? Math.min(o.dxr, o.dyr) : o.segLen);
    const r = Math.max(o.thickness, 0.6 * sp);
    for (let k = 0; k < o.n; k++) this.rs[o.p0 + k] = r;
    if (r > mr) mr = r;
    o.bHitV = 0; o.bHitX = 0; o.bHitY = 0; o.bSlideV = 0; o.bSlideN = 0; o.bOther = null;
  }
  this._softCell = 2 * mr; this._shHead = new Int32Array(8192).fill(-1); this._shNext = new Int32Array(this.np); this._shKeys = new Int32Array(this.np);
};
World.prototype._softCollide = function () {
  const L = this._softList, x = this.x, y = this.y, px = this.px, py = this.py, im = this.im, rs = this.rs, pob = this.pob, head = this._shHead, next = this._shNext, keys = this._shKeys;
  const cell = this._softCell, inv = 1 / cell, ih = this._ih, O = this.objects;
  // broad phase: only objects whose box (grown by a cell) overlaps another soft object's box take part
  for (let a = 0; a < L.length; a++) {
    const o = L[a]; o.near = false; if (!o.on) continue;
    let x0 = INF, x1 = -INF, y0 = INF, y1 = -INF;
    for (let p = o.p0; p < o.p0 + o.n; p++) { const u = x[p], v = y[p]; if (u < x0) x0 = u; if (u > x1) x1 = u; if (v < y0) y0 = v; if (v > y1) y1 = v; }
    o.bx0 = x0 - cell; o.bx1 = x1 + cell; o.by0 = y0 - cell; o.by1 = y1 + cell;
  }
  let any = false;
  for (let a = 0; a < L.length; a++) { const o = L[a]; if (!o.on) continue; for (let b = a + 1; b < L.length; b++) { const q = L[b]; if (!q.on) continue; if (o.bx0 < q.bx1 && q.bx0 < o.bx1 && o.by0 < q.by1 && q.by0 < o.by1) { o.near = true; q.near = true; any = true; } } }
  if (!any) return;
  let nk = 0;
  for (let a = 0; a < L.length; a++) { const o = L[a]; if (!o.near) continue; for (let p = o.p0; p < o.p0 + o.n; p++) { const key = ((Math.floor(x[p] * inv) * 73856093) ^ (Math.floor(y[p] * inv) * 19349663)) & 8191; if (head[key] < 0) keys[nk++] = key; next[p] = head[key]; head[key] = p; } }
  for (let a = 0; a < L.length; a++) {
    const o = L[a]; if (!o.near) continue;
    for (let p = o.p0; p < o.p0 + o.n; p++) {
      const cx = Math.floor(x[p] * inv), cy = Math.floor(y[p] * inv);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (let q = head[((((cx + dx) * 73856093) ^ ((cy + dy) * 19349663)) & 8191)]; q >= 0; q = next[q]) {
          if (pob[q] <= pob[p]) continue;   // each pair once, never within one object
          const ex = x[q] - x[p], ey = y[q] - y[p], d2 = ex * ex + ey * ey, R = rs[p] + rs[q];
          if (d2 >= R * R || d2 < 1e-12) continue;
          const wp = im[p], wq = im[q], ws = wp + wq; if (ws === 0) continue;
          const d = Math.sqrt(d2), pen = (R - d) / (d * ws), sx = ex * pen, sy = ey * pen;
          // relative motion before the push (approach speed and rubbing) for the events
          const rvx = (x[q] - px[q]) - (x[p] - px[p]), rvy = (y[q] - py[q]) - (y[p] - py[p]), nx = ex / d, ny = ey / d, vn = -(rvx * nx + rvy * ny) * ih, vt = Math.abs(rvx * ny - rvy * nx) * ih;
          x[p] -= sx * wp; y[p] -= sy * wp; x[q] += sx * wq; y[q] += sy * wq;
          const oq = O[pob[q]];
          if (vn > o.bHitV) { o.bHitV = vn; o.bHitX = x[p]; o.bHitY = y[p]; o.bOther = oq; }
          if (vt > o.bSlideV) o.bSlideV = vt; o.bSlideN++;
        }
      }
    }
  }
  for (let i = 0; i < nk; i++) head[keys[i]] = -1;
};

// ---------------------------------------------------------------- foley, hashing, helpers
/* w.events -> the sound builder's list (same shape as PHYS2D.eventsToFoley, name 'soft'):
 * [{ t (absolute s), name:'soft', mat:'paper' | 'paper+wood', mag, pan, x, y, k:'tear'|'crinkle'|'hit'|..., tag:'wrap' | 'wrap+box' }]
 * opts: sceneStart, screen { w, h, cx, cam:{x,y,zoom} | fn(t) | project }, maxEvents (120), panScale (.85), offscreenGain (.6), gain (1). */
function eventsToFoley(events, opts) {
  opts = opts || {};
  const screen = opts.screen || {}, W = screen.w || 1080, H = screen.h || 1920, cx = screen.cx != null ? screen.cx : W / 2;
  const t0 = opts.sceneStart || 0, cap = opts.maxEvents || 120, panScale = opts.panScale != null ? opts.panScale : 0.85, offG = opts.offscreenGain != null ? opts.offscreenGain : 0.6, gain = opts.gain != null ? opts.gain : 1;
  const out = [], pr = [0, 0];
  for (let i = 0; i < (events || []).length; i++) {
    const e = events[i];
    let sx = e.x, sy = e.y;
    if (typeof screen.project === 'function') { const p = screen.project(e.x, e.y, e.t, pr); if (p) { sx = p[0]; sy = p[1]; } }
    else if (screen.cam) {
      const c = typeof screen.cam === 'function' ? screen.cam(e.t) : screen.cam;
      if (c) { const z = c.zoom != null ? c.zoom : (c.z != null ? c.z : 1); sx = cx + (e.x - c.x) * z; sy = H / 2 + (e.y - c.y) * z; }
    }
    let pan = (sx - cx) / (W / 2); pan = (pan < -1 ? -1 : (pan > 1 ? 1 : pan)) * panScale;
    let mag = e.mag * gain;
    if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) mag *= offG;
    mag = mag > 1 ? 1 : mag;
    const ma = e.mat || 'paper', mb = e.matB;
    const o = { t: Math.round((t0 + e.t) * 1000) / 1000, name: 'soft', mat: mb ? (ma <= mb ? ma + '+' + mb : mb + '+' + ma) : ma, mag: Math.round(mag * 100) / 100,
      pan: Math.round(pan * 100) / 100, x: Math.round(e.x), y: Math.round(e.y), k: e.kind, tag: (e.tag || '?') + (e.tagB ? '+' + e.tagB : ''), _a: e.id };
    if (e.len != null) o.len = Math.round(e.len);
    out.push(o);
  }
  let res = out;
  if (out.length > cap) {   // keep the first event of each object and kind, then the loudest; at most `cap`
    const seen = {}, pin = [], rest = [];
    for (let i = 0; i < out.length; i++) { const key = out[i]._a + ':' + out[i].k; if (!seen[key]) { seen[key] = 1; pin.push(i); } else rest.push(i); }
    const byMag = function (a, b) { return out[b].mag - out[a].mag || a - b; };
    pin.sort(byMag); rest.sort(byMag);
    const keep = pin.slice(0, cap).concat(rest.slice(0, Math.max(0, cap - pin.length)));
    keep.sort(function (a, b) { return a - b; });
    res = keep.map(function (i) { return out[i]; });
  }
  for (let i = 0; i < res.length; i++) delete res[i]._a;
  return res;
}
/* FNV-1a hash of n sampled states (every particle, triangle and segment flag): equal hashes mean bit-identical simulations */
function stateHash(w, n) {
  n = n || 100;
  const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
  let h = 0x811c9dc5;
  const mix = function (v) { f32[0] = v; h = Math.imul(h ^ u32[0], 0x01000193); };
  const st = w.makeState();
  for (let k = 0; k < n; k++) {
    w.at(n > 1 ? w.T * k / (n - 1) : 0, st);
    for (const c of st.cloths) { for (let i = 0; i < c.pts.length; i++) mix(c.pts[i]); for (let i = 0; i < c.z.length; i++) mix(c.z[i]); for (let i = 0; i < c.alive.length; i++) mix(c.alive[i]); }
    for (const r of st.ropes) { for (let i = 0; i < r.pts.length; i++) mix(r.pts[i]); for (let i = 0; i < r.alive.length; i++) mix(r.alive[i]); }
    for (const b of st.balloons) { for (let i = 0; i < b.pts.length; i++) mix(b.pts[i]); mix(b.area); mix(b.popped ? 1 : 0); }
    for (const c of st.colliders) { mix(c.x); mix(c.y); mix(c.angle); }
  }
  for (const e of w.events) { mix(e.t); mix(e.mag); }
  return (h >>> 0).toString(16);
}
/* screen position of a 3D point under a view { kx, ky } (x' = x + kx z, y' = y + ky z); a front view is { kx:0, ky:0 } */
function project(x, y, z, view, out) {
  out = out || [0, 0];
  const kx = view && view.kx || 0, ky = view && view.ky || 0;
  out[0] = x + kx * (z || 0); out[1] = y + ky * (z || 0);
  return out;
}
/* outline colliders and soft bodies of a state (debugging, not for the film) */
function debugDraw(ctx, w, st) {
  ctx.save(); ctx.lineWidth = 2;
  for (const c of w.colliders) {
    const e = st && st.colliders ? st.colliders[c.index] : c, x = e.x, y = e.y, a = e.angle || 0;
    ctx.strokeStyle = c.pose ? '#2b6cff' : '#7a7f87';
    ctx.beginPath();
    if (c.type === C_FLOOR || c.type === C_CEIL) { ctx.moveTo(-5000, c.Y); ctx.lineTo(5000, c.Y); }
    else if (c.type === C_WALL) { ctx.moveTo(c.X, -5000); ctx.lineTo(c.X, 5000); }
    else {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      if (c.type === C_BOX) ctx.rect(-c.hw, -c.hh, 2 * c.hw, 2 * c.hh);
      else if (c.type === C_CIRCLE) { ctx.arc(0, 0, c.r, 0, TWO_PI); ctx.moveTo(0, 0); ctx.lineTo(c.r, 0); }
      else if (c.type === C_CAPSULE) { ctx.arc(-c.hl, 0, c.r, HALF_PI, 3 * HALF_PI); ctx.arc(c.hl, 0, c.r, -HALF_PI, HALF_PI); ctx.closePath(); }
      else { for (let i = 0; i < c.n; i++) { if (i) ctx.lineTo(c.vx[i], c.vy[i]); else ctx.moveTo(c.vx[i], c.vy[i]); } ctx.closePath(); }
      ctx.restore();
    }
    ctx.stroke();
  }
  if (st) {
    ctx.strokeStyle = '#2a7'; ctx.lineWidth = 1;
    for (const c of st.cloths) {
      ctx.beginPath();
      for (let t = 0; t < c.nt; t++) { if (!c.alive[t]) continue; const a = c.tri[3 * t], b = c.tri[3 * t + 1], d = c.tri[3 * t + 2]; ctx.moveTo(c.pts[2 * a], c.pts[2 * a + 1]); ctx.lineTo(c.pts[2 * b], c.pts[2 * b + 1]); ctx.lineTo(c.pts[2 * d], c.pts[2 * d + 1]); ctx.closePath(); }
      ctx.stroke();
    }
    ctx.strokeStyle = '#a52'; ctx.lineWidth = 2;
    for (const r of st.ropes) { ctx.beginPath(); for (let i = 0; i < r.n; i++) { if (i) ctx.lineTo(r.pts[2 * i], r.pts[2 * i + 1]); else ctx.moveTo(r.pts[2 * i], r.pts[2 * i + 1]); } ctx.stroke(); }
    ctx.strokeStyle = '#72a';
    for (const b of st.balloons) { ctx.beginPath(); for (let i = 0; i < b.n; i++) { if (i) ctx.lineTo(b.pts[2 * i], b.pts[2 * i + 1]); else ctx.moveTo(b.pts[2 * i], b.pts[2 * i + 1]); } ctx.closePath(); ctx.stroke(); }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- drawing (browser; pure functions of a state)
const DRAW = {};
function hash2(a, b) { let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35); h ^= h >>> 13; h = Math.imul(h, 0x27d4eb2f); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
function parseColor(c) {   // '#rgb' | '#rrggbb' | 'rgb(...)' -> [r, g, b]
  if (typeof c !== 'string') return [200, 200, 200];
  if (c[0] === '#') {
    if (c.length === 4) return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16)];
    return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)];
  }
  const m = c.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [200, 200, 200];
}
function mix(c, k, to) { const a = parseColor(c), b = to || [0, 0, 0]; return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')'; }
function newCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return null;
}
/* a cached texture of the cloth's print in rest space (res texture px per rest px); quilt draws Chux quilting over a flat colour */
const TEX = new Map(); let TEXN = 0;
function clothTexture(st, o, res) {
  const W = st.width, H = st.height;
  const key = (typeof o.fill === 'function' ? (o.fill.__softKey || (o.fill.__softKey = 'f' + (++TEXN))) : String(o.fill)) + '|' + (o.quilt || 0) + '|' + W + 'x' + H + '@' + res;
  let t = TEX.get(key);
  if (t) return t;
  const cw = Math.max(2, Math.ceil(W * res)), ch = Math.max(2, Math.ceil(H * res));
  const cv = newCanvas(cw, ch); if (!cv) return null;
  const g = cv.getContext('2d');
  g.scale(res, res);
  if (typeof o.fill === 'function') o.fill(g, W, H);
  else { g.fillStyle = o.fill || '#c62828'; g.fillRect(0, 0, W, H); }
  if (o.quilt > 0) quiltPattern(g, W, H, o.quilt, typeof o.fill === 'string' ? o.fill : '#5b8fd6');
  t = { canvas: cv, w: cw, h: ch, res: res };
  if (TEX.size > 64) TEX.delete(TEX.keys().next().value);
  TEX.set(key, t);
  return t;
}
/* Chux quilting: a diamond grid of stitched channels with puffy cells (a soft highlight in each cell, a darker seam) */
function quiltPattern(g, W, H, q, base) {
  const step = Math.max(10, 26 / q), lite = mix(base, 0.35, [255, 255, 255]), dark = mix(base, 0.32);
  g.save();
  g.globalAlpha = 0.55; g.fillStyle = lite;
  for (let y = -step; y < H + step; y += step) for (let x = -step + ((Math.round(y / step) & 1) ? step / 2 : 0); x < W + step; x += step) {
    g.beginPath(); g.ellipse(x - step * 0.08, y - step * 0.1, step * 0.26, step * 0.18, 0, 0, TWO_PI); g.fill();
  }
  g.globalAlpha = 0.8; g.strokeStyle = dark; g.lineWidth = Math.max(1, step * 0.07);
  g.beginPath();
  for (let k = -H; k < W + H; k += step) { g.moveTo(k, 0); g.lineTo(k + H, H); g.moveTo(k + H, 0); g.lineTo(k, H); }
  g.stroke();
  g.globalAlpha = 0.35; g.strokeStyle = lite; g.lineWidth = Math.max(0.6, step * 0.035); g.setLineDash([step * 0.12, step * 0.1]);
  g.beginPath();
  for (let k = -H; k < W + H; k += step) { g.moveTo(k + 1.5, 0); g.lineTo(k + H + 1.5, H); g.moveTo(k + H + 1.5, 0); g.lineTo(k + 1.5, H); }
  g.stroke(); g.setLineDash([]);
  g.globalAlpha = 1; g.strokeStyle = mix(base, 0.45); g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3);   // the sealed border
  g.restore();
}
const LX = -0.38, LY = -0.55, LZ = 0.74;   // light from the upper left, toward the viewer (normalised below)
const LN = Math.sqrt(LX * LX + LY * LY + LZ * LZ), Lx = LX / LN, Ly = LY / LN, Lz = LZ / LN;
/* SOFT2D.drawCloth(ctx, st, { fill, back, shade, edge:{color,width}, quilt, ragged, alpha, view:{kx,ky}, zMin, zMax, res, light }) */
DRAW.cloth = function (ctx, st, o) {
  o = o || {};
  if (!st || !st.pts) return;
  const n = st.n || (st.pts.length >> 1), nt = st.nt || (st.tri.length / 3), P = st.pts, Z = st.z, T = st.tri, A = st.alive, UV = st.uv;
  const view = o.view, kx = view && view.kx || 0, ky = view && view.ky || 0, zMin = o.zMin != null ? o.zMin : -INF, zMax = o.zMax != null ? o.zMax : INF;
  const shade = o.shade != null ? o.shade : 0.35, fill = o.fill != null ? o.fill : '#c62828', back = o.back || '#f4f1ea', alpha = o.alpha != null ? o.alpha : 1;
  if (alpha <= 0) return;
  // screen positions, per-vertex normals (3D), per-triangle depth and darkness
  const sc = st._scr || (st._scr = { sx: new Float32Array(n), sy: new Float32Array(n), nx: new Float32Array(n), ny: new Float32Array(n), nz: new Float32Array(n), dk: new Float32Array(nt), dz: new Float32Array(nt), ord: new Int32Array(nt), fr: new Uint8Array(nt) });
  const SX = sc.sx, SY = sc.sy, NX = sc.nx, NY = sc.ny, NZ = sc.nz, DK = sc.dk, DZ = sc.dz, ORD = sc.ord, FR = sc.fr;
  for (let i = 0; i < n; i++) { const z = Z ? Z[i] : 0; SX[i] = P[2 * i] + kx * z; SY[i] = P[2 * i + 1] + ky * z; NX[i] = 0; NY[i] = 0; NZ[i] = 0; }
  const W = st.width || 1, H = st.height || 1, cols = st.cols, rows = st.rows, a0 = (W / (cols - 1)) * (H / (rows - 1)) / 2;
  for (let t = 0; t < nt; t++) {
    if (!A[t]) continue;
    const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
    const za = Z ? Z[a] : 0, zb = Z ? Z[b] : 0, zc = Z ? Z[c] : 0;
    const e1x = P[2 * b] - P[2 * a], e1y = P[2 * b + 1] - P[2 * a + 1], e1z = zb - za, e2x = P[2 * c] - P[2 * a], e2y = P[2 * c + 1] - P[2 * a + 1], e2z = zc - za;
    const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;   // area-weighted; nz > 0 = front (y-down)
    NX[a] += nx; NY[a] += ny; NZ[a] += nz; NX[b] += nx; NY[b] += ny; NZ[b] += nz; NX[c] += nx; NY[c] += ny; NZ[c] += nz;
    const sa = (SX[b] - SX[a]) * (SY[c] - SY[a]) - (SY[b] - SY[a]) * (SX[c] - SX[a]);
    FR[t] = sa >= 0 ? 1 : 0; DZ[t] = (za + zb + zc) / 3;
    DK[t] = st.flat ? Math.min(1, Math.max(0, (1 - Math.abs(sa) / (2 * a0)) * 1.6)) : 0;   // in-plane compression (a flat cloth buckling)
  }
  let m = 0;
  for (let t = 0; t < nt; t++) {
    if (!A[t] || DZ[t] < zMin || DZ[t] > zMax) continue;
    if (!st.flat) {
      let lam = 0;
      for (let e = 0; e < 3; e++) { const v = T[3 * t + e], l = Math.sqrt(NX[v] * NX[v] + NY[v] * NY[v] + NZ[v] * NZ[v]) || 1, s = NZ[v] >= 0 ? 1 : -1; lam += s * (NX[v] * Lx + NY[v] * Ly + NZ[v] * Lz) / l; }
      lam = lam / 3 / Lz;   // 1 = facing the viewer
      DK[t] = lam >= 1 ? 0 : (lam <= 0 ? 1 : 1 - lam);
    }
    ORD[m++] = t;
  }
  if (!st.flat) { const sub = Array.prototype.slice.call(ORD, 0, m); sub.sort(function (p, q) { return DZ[p] - DZ[q] || p - q; }); for (let i = 0; i < m; i++) ORD[i] = sub[i]; }
  else {   // a flat cloth: front faces first, folded-over (back) faces on top
    let k = 0; const tmp = new Int32Array(m);
    for (let i = 0; i < m; i++) if (FR[ORD[i]]) tmp[k++] = ORD[i];
    for (let i = 0; i < m; i++) if (!FR[ORD[i]]) tmp[k++] = ORD[i];
    for (let i = 0; i < m; i++) ORD[i] = tmp[i];
  }
  ctx.save();
  if (alpha < 1) ctx.globalAlpha *= alpha;
  const textured = typeof fill === 'function' || o.quilt > 0;
  const tex = textured ? clothTexture(st, o, o.res || 1.5) : null;
  const pat = tex ? ctx.createPattern(tex.canvas, 'no-repeat') : null;
  const base = ctx.getTransform ? ctx.getTransform() : null;
  const res = tex ? tex.res : 1, grow = 0.9 / Math.max(2, Math.min(W / (cols - 1), H / (rows - 1)));
  const flatFill = typeof fill === 'string' ? fill : (o.base || '#999');
  // solid underlay under the front faces hides hairline seams between textured triangles
  if (pat) { ctx.fillStyle = mix(flatFill === '#999' ? '#c0c0c0' : flatFill, 0); ctx.beginPath(); for (let i = 0; i < m; i++) { const t = ORD[i]; if (!FR[t]) continue; triPath(ctx, SX, SY, T, t); } ctx.fill(); }
  const levels = 8;
  if (st.flat) {   // batched: one fill per side and shade level
    if (pat) for (let i = 0; i < m; i++) { const t = ORD[i]; if (FR[t]) texTri(ctx, base, pat, SX, SY, UV, T, t, W * res, H * res, grow); }
    else { ctx.fillStyle = fill; ctx.beginPath(); for (let i = 0; i < m; i++) { const t = ORD[i]; if (FR[t]) triPath(ctx, SX, SY, T, t); } ctx.fill(); }
    ctx.fillStyle = back; ctx.beginPath(); let anyBack = false; for (let i = 0; i < m; i++) { const t = ORD[i]; if (!FR[t]) { triPath(ctx, SX, SY, T, t); anyBack = true; } } if (anyBack) ctx.fill();
    if (shade > 0) for (let L = 1; L < levels; L++) {
      ctx.beginPath(); let any = false;
      for (let i = 0; i < m; i++) { const t = ORD[i]; if (Math.min(levels - 1, Math.floor(DK[t] * levels)) === L) { triPath(ctx, SX, SY, T, t); any = true; } }
      if (any) { ctx.fillStyle = 'rgba(20,16,30,' + (shade * L / (levels - 1)).toFixed(3) + ')'; ctx.fill(); }
    }
  } else {   // depth-sorted: one triangle at a time, back to front
    for (let i = 0; i < m; i++) {
      const t = ORD[i];
      if (FR[t] && pat) texTri(ctx, base, pat, SX, SY, UV, T, t, W * res, H * res, grow);
      else { ctx.fillStyle = FR[t] ? flatFill : back; ctx.beginPath(); triPath(ctx, SX, SY, T, t, 0.35); ctx.fill(); }
      const L = Math.min(levels - 1, Math.floor(DK[t] * levels));
      if (shade > 0 && L > 0) { ctx.fillStyle = 'rgba(20,16,30,' + (shade * L / (levels - 1)).toFixed(3) + ')'; ctx.beginPath(); triPath(ctx, SX, SY, T, t, 0.35); ctx.fill(); }
    }
  }
  clothEdges(ctx, st, o, SX, SY, ORD, m);
  ctx.restore();
};
/* a triangle in screen space, grown by g px about its centroid (hides anti-aliasing seams) */
function triPath(ctx, SX, SY, T, t, g) {
  const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
  if (!g) { ctx.moveTo(SX[a], SY[a]); ctx.lineTo(SX[b], SY[b]); ctx.lineTo(SX[c], SY[c]); ctx.closePath(); return; }
  const mx = (SX[a] + SX[b] + SX[c]) / 3, my = (SY[a] + SY[b] + SY[c]) / 3;
  const ex = function (v) { const dx = SX[v] - mx, dy = SY[v] - my, l = Math.sqrt(dx * dx + dy * dy) || 1; return [SX[v] + dx / l * g, SY[v] + dy / l * g]; };
  const A = ex(a), B = ex(b), C = ex(c);
  ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath();
}
/* fill one triangle with the print: the affine map from rest (texture) space to screen, composed with the canvas transform */
function texTri(ctx, base, pat, SX, SY, UV, T, t, TW, TH, grow) {
  const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
  const r0x = UV[2 * a] * TW, r0y = UV[2 * a + 1] * TH, r1x = UV[2 * b] * TW, r1y = UV[2 * b + 1] * TH, r2x = UV[2 * c] * TW, r2y = UV[2 * c + 1] * TH;
  const u1x = r1x - r0x, u1y = r1y - r0y, u2x = r2x - r0x, u2y = r2y - r0y, det = u1x * u2y - u2x * u1y;
  if (det === 0) return;
  const s1x = SX[b] - SX[a], s1y = SY[b] - SY[a], s2x = SX[c] - SX[a], s2y = SY[c] - SY[a];
  const ma = (s1x * u2y - s2x * u1y) / det, mc = (s2x * u1x - s1x * u2x) / det, mb = (s1y * u2y - s2y * u1y) / det, md = (s2y * u1x - s1y * u2x) / det;
  const me = SX[a] - ma * r0x - mc * r0y, mf = SY[a] - mb * r0x - md * r0y;
  if (base) ctx.setTransform(base.a * ma + base.c * mb, base.b * ma + base.d * mb, base.a * mc + base.c * md, base.b * mc + base.d * md, base.a * me + base.c * mf + base.e, base.b * me + base.d * mf + base.f);
  else { ctx.save(); ctx.transform(ma, mb, mc, md, me, mf); }
  const cx = (r0x + r1x + r2x) / 3, cy = (r0y + r1y + r2y) / 3, k = 1 + grow;
  ctx.beginPath(); ctx.moveTo(cx + (r0x - cx) * k, cy + (r0y - cy) * k); ctx.lineTo(cx + (r1x - cx) * k, cy + (r1y - cy) * k); ctx.lineTo(cx + (r2x - cx) * k, cy + (r2y - cy) * k); ctx.closePath();
  ctx.fillStyle = pat; ctx.fill();
  if (base) ctx.setTransform(base); else ctx.restore();
}
/* boundary and torn edges: an optional edge stroke and, along tears, thin white ragged fibres (paper's torn core) */
function clothEdges(ctx, st, o, SX, SY, ORD, m) {
  const T = st.tri, A = st.alive, N = st.triN, edge = o.edge, rag = o.ragged != null ? o.ragged : 1;
  if (!edge && !(rag > 0)) return;
  if (!N) return;
  const torn = [], outer = [];
  for (let i = 0; i < m; i++) {
    const t = ORD[i];
    for (let e = 0; e < 3; e++) {
      const nb = N[3 * t + e];
      if (nb >= 0 && A[nb]) continue;
      (nb < 0 ? outer : torn).push(t, e);
    }
  }
  if (edge && (outer.length || torn.length)) {
    ctx.strokeStyle = edge.color || 'rgba(0,0,0,.35)'; ctx.lineWidth = edge.width || 1.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    const add = function (L) { for (let k = 0; k < L.length; k += 2) { const t = L[k], e = L[k + 1], a = T[3 * t + e], b = T[3 * t + (e + 1) % 3]; ctx.moveTo(SX[a], SY[a]); ctx.lineTo(SX[b], SY[b]); } };
    add(outer); if (!(rag > 0)) add(torn);
    ctx.stroke();
  }
  if (rag > 0 && torn.length) {
    const col = o.fiber || '#fbf8f0';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (let k = 0; k < torn.length; k += 2) {
        const t = torn[k], e = torn[k + 1], a = T[3 * t + e], b = T[3 * t + (e + 1) % 3], c = T[3 * t + (e + 2) % 3];
        const ax = SX[a], ay = SY[a], bx = SX[b], by = SY[b], ex = bx - ax, ey = by - ay, L = Math.sqrt(ex * ex + ey * ey) || 1;
        let nx = -ey / L, ny = ex / L;   // outward = away from the triangle's third vertex
        if ((SX[c] - ax) * nx + (SY[c] - ay) * ny > 0) { nx = -nx; ny = -ny; }
        const seed = (a < b ? a * 7919 + b : b * 7919 + a);
        if (pass === 0) {   // the jagged fibre band
          ctx.moveTo(ax, ay);
          for (let s = 1; s <= 4; s++) { const f = s / 4, j = (hash2(seed, s) - 0.25) * 2.6 * rag; ctx.lineTo(ax + ex * f + nx * j, ay + ey * f + ny * j); }
        } else {            // a few stray hairs
          for (let s = 0; s < 2; s++) { const f = 0.2 + 0.6 * hash2(seed, 10 + s), l = (1.5 + 3.5 * hash2(seed, 20 + s)) * rag, sk = (hash2(seed, 30 + s) - 0.5) * 0.9; const px = ax + ex * f, py = ay + ey * f; ctx.moveTo(px, py); ctx.lineTo(px + (nx + ex / L * sk) * l, py + (ny + ey / L * sk) * l); }
        }
      }
      ctx.strokeStyle = col; ctx.globalAlpha = pass === 0 ? 0.95 : 0.8; ctx.lineWidth = pass === 0 ? 2.2 * rag : 0.9;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/* SOFT2D.drawBalloon(ctx, st, { fill, outline, shine, cuff, alpha }): a smooth closed outline, a soft inner shade on the lower right,
 * a darker outline, a highlight on the upper left and (glove) the rolled cuff and knot at particle 0 */
DRAW.balloon = function (ctx, st, o) {
  o = o || {};
  if (!st || !st.pts) return;
  const n = st.n || (st.pts.length >> 1), P = st.pts, alpha = o.alpha != null ? o.alpha : 1;
  if (alpha <= 0 || n < 3) return;
  const fill = o.fill || '#7e57c2', line = o.outline || '#2b1a4a', shine = o.shine != null ? o.shine : 0.6;
  let cx = 0, cy = 0, x0 = INF, x1 = -INF, y0 = INF, y1 = -INF;
  for (let k = 0; k < n; k++) { const x = P[2 * k], y = P[2 * k + 1]; cx += x; cy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  cx /= n; cy /= n;
  const sz = Math.max(20, Math.sqrt(Math.max(1, st.area || (x1 - x0) * (y1 - y0) * 0.6)));
  ctx.save(); if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = function (dx, dy) {
    ctx.beginPath();
    const mx = (P[2 * (n - 1)] + P[0]) / 2 + dx, my = (P[2 * (n - 1) + 1] + P[1]) / 2 + dy; ctx.moveTo(mx, my);
    for (let k = 0; k < n; k++) { const j = k + 1 === n ? 0 : k + 1; ctx.quadraticCurveTo(P[2 * k] + dx, P[2 * k + 1] + dy, (P[2 * k] + P[2 * j]) / 2 + dx, (P[2 * k + 1] + P[2 * j + 1]) / 2 + dy); }
    ctx.closePath();
  };
  if (st.popped) {   // a burst balloon: a limp scrap of rubber
    ctx.strokeStyle = fill; ctx.lineWidth = Math.max(3, sz * 0.05); ctx.beginPath();
    for (let k = 0; k < n; k++) { if (k) ctx.lineTo(P[2 * k], P[2 * k + 1]); else ctx.moveTo(P[0], P[1]); } ctx.stroke(); ctx.restore(); return;
  }
  path(0, 0); ctx.fillStyle = fill; ctx.fill();
  ctx.save(); path(0, 0); ctx.clip();
  path(-sz * 0.07, -sz * 0.08); ctx.strokeStyle = 'rgba(25,10,45,0.22)'; ctx.lineWidth = sz * 0.2; ctx.stroke();
  ctx.restore();
  path(0, 0); ctx.strokeStyle = line; ctx.lineWidth = Math.max(2, sz * 0.024); ctx.stroke();
  if (shine > 0) {
    const hx = cx - (x1 - x0) * 0.16, hy = cy - (y1 - y0) * 0.02;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.75 * shine).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(hx, hy, sz * 0.1, sz * 0.05, -0.6, 0, TWO_PI); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + sz * 0.11, hy - sz * 0.07, sz * 0.022, 0, TWO_PI); ctx.fill();
  }
  const cuff = o.cuff != null ? o.cuff : (st.outline === 'glove');
  if (cuff) {   // the rolled cuff across the neck and the tied knot below it
    const k1 = Math.max(1, Math.round(n * 0.028)), ax = P[2 * k1], ay = P[2 * k1 + 1], bx = P[2 * (n - k1)], by = P[2 * (n - k1) + 1];
    const kx = P[0], ky = P[1]; let nx = kx - (ax + bx) / 2, ny = ky - (ay + by) / 2; const nl = Math.sqrt(nx * nx + ny * ny) || 1; nx /= nl; ny /= nl;
    ctx.strokeStyle = line; ctx.lineWidth = sz * 0.085 + 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = mix(fill, 0.3, [255, 255, 255]); ctx.lineWidth = sz * 0.085; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    const qx = kx + nx * sz * 0.05, qy = ky + ny * sz * 0.05, r = sz * 0.042;
    ctx.fillStyle = mix(fill, 0.2); ctx.strokeStyle = line; ctx.lineWidth = Math.max(1.5, sz * 0.016);
    ctx.beginPath(); ctx.ellipse(qx, qy, r * 1.2, r, 0, 0, TWO_PI); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qx - r * 0.6, qy + r * 0.6); ctx.quadraticCurveTo(qx - r * 1.6, qy + r * 2.2, qx - r * 0.9, qy + r * 2.6); ctx.moveTo(qx + r * 0.6, qy + r * 0.6); ctx.quadraticCurveTo(qx + r * 1.4, qy + r * 2.0, qx + r * 1.1, qy + r * 2.5); ctx.stroke();
  }
  ctx.restore();
};

/* ---------------------------------------------------------------- ropes: cord, ribbon (twists where it turns), belt (stitched strap, buckle), tape, tinsel */
DRAW.rope = function (ctx, st, o) {
  o = o || {};
  if (!st || !st.pts) return;
  const n = st.n || (st.pts.length >> 1), P = st.pts, alive = st.alive;
  const width = o.width != null ? o.width : (st.width || 8), style = o.style || 'cord', alpha = o.alpha != null ? o.alpha : 1;
  const color = o.color || ({ ribbon: '#d4a017', belt: '#c9b48a', tape: '#efe3c4', tinsel: '#e8c547', cord: '#7a5230' })[style] || '#7a5230';
  if (alpha <= 0 || n < 2) return;
  ctx.save(); if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  let i = 0;
  while (i < n - 1) {
    if (alive && !alive[i]) { i++; continue; }
    let j = i; while (j < n - 1 && (!alive || alive[j])) j++;
    ropeRun(ctx, P, i, j, width, color, style, o, i === 0);
    i = j + 1;
  }
  ctx.restore();
};
function smoothLine(ctx, X, Y, k0, k1) {
  ctx.moveTo(X[k0], Y[k0]);
  if (k1 - k0 < 2) { ctx.lineTo(X[k1], Y[k1]); return; }
  for (let k = k0 + 1; k < k1; k++) ctx.quadraticCurveTo(X[k], Y[k], (X[k] + X[k + 1]) / 2, (Y[k] + Y[k + 1]) / 2);
  ctx.lineTo(X[k1], Y[k1]);
}
function ropeRun(ctx, P, i0, i1, width, color, style, o, first) {
  const m = i1 - i0 + 1, X = new Float32Array(m), Y = new Float32Array(m), NX = new Float32Array(m), NY = new Float32Array(m), Wd = new Float32Array(m), TW = new Float32Array(m);
  for (let k = 0; k < m; k++) { X[k] = P[2 * (i0 + k)]; Y[k] = P[2 * (i0 + k) + 1]; }
  let phi = o.phase || 0; const twist = o.twist != null ? o.twist : 1.4;
  let ptx = 0, pty = 0;
  for (let k = 0; k < m; k++) {
    const a = k > 0 ? k - 1 : k, b = k < m - 1 ? k + 1 : k;
    let tx = X[b] - X[a], ty = Y[b] - Y[a]; const l = Math.sqrt(tx * tx + ty * ty) || 1; tx /= l; ty /= l;
    NX[k] = -ty; NY[k] = tx;
    if (k > 0) phi += (ptx * ty - pty * tx) * twist;
    ptx = tx; pty = ty;
    const c = fcos(phi); TW[k] = c < 0 ? -c : c;
    Wd[k] = style === 'ribbon' ? width * (0.22 + 0.78 * TW[k]) : width;
  }
  const shadow = o.shadow != null ? o.shadow : style !== 'tinsel';
  if (shadow) {
    ctx.save(); ctx.translate(2, 4); ctx.strokeStyle = 'rgba(20,14,30,0.16)'; ctx.lineWidth = (style === 'cord' ? width + 2 : width * 0.9);
    ctx.beginPath(); smoothLine(ctx, X, Y, 0, m - 1); ctx.stroke(); ctx.restore();
  }
  if (style === 'cord') {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); smoothLine(ctx, X, Y, 0, m - 1); ctx.stroke();
    ctx.strokeStyle = mix(color, 0.45, [255, 255, 255]); ctx.lineWidth = Math.max(1, width * 0.3);
    ctx.save(); ctx.translate(-width * 0.16, -width * 0.16); ctx.beginPath(); smoothLine(ctx, X, Y, 0, m - 1); ctx.stroke(); ctx.restore();
    return;
  }
  if (style === 'tinsel') { tinselRun(ctx, X, Y, NX, NY, m, width, color, o); return; }
  // a band: left edge forward, right edge back
  const LXa = new Float32Array(m), LYa = new Float32Array(m), RXa = new Float32Array(m), RYa = new Float32Array(m);
  for (let k = 0; k < m; k++) { const h = Wd[k] / 2; LXa[k] = X[k] + NX[k] * h; LYa[k] = Y[k] + NY[k] * h; RXa[k] = X[k] - NX[k] * h; RYa[k] = Y[k] - NY[k] * h; }
  const band = function () {
    ctx.beginPath(); smoothLine(ctx, LXa, LYa, 0, m - 1);
    if (style === 'tape') zig(ctx, LXa[m - 1], LYa[m - 1], RXa[m - 1], RYa[m - 1], X[m - 1] - X[Math.max(0, m - 2)], Y[m - 1] - Y[Math.max(0, m - 2)]); else ctx.lineTo(RXa[m - 1], RYa[m - 1]);
    for (let k = m - 2; k >= 0; k--) { if (k > 0) ctx.quadraticCurveTo(RXa[k], RYa[k], (RXa[k] + RXa[k - 1]) / 2, (RYa[k] + RYa[k - 1]) / 2); else ctx.lineTo(RXa[0], RYa[0]); }
    if (style === 'tape') zig(ctx, RXa[0], RYa[0], LXa[0], LYa[0], X[0] - X[Math.min(m - 1, 1)], Y[0] - Y[Math.min(m - 1, 1)]);
    ctx.closePath();
  };
  ctx.fillStyle = color; if (style === 'tape') ctx.globalAlpha *= 0.93;
  band(); ctx.fill();
  if (style === 'tape') ctx.globalAlpha /= 0.93;
  if (style === 'ribbon') {   // the turned (edge-on) parts are darker; a sheen along the middle where it faces us
    for (let L = 1; L <= 3; L++) {
      ctx.beginPath(); let any = false;
      for (let k = 0; k < m - 1; k++) { const tw = (TW[k] + TW[k + 1]) / 2, lev = tw > 0.75 ? 0 : (tw > 0.5 ? 1 : (tw > 0.28 ? 2 : 3)); if (lev !== L) continue; any = true; ctx.moveTo(LXa[k], LYa[k]); ctx.lineTo(LXa[k + 1], LYa[k + 1]); ctx.lineTo(RXa[k + 1], RYa[k + 1]); ctx.lineTo(RXa[k], RYa[k]); ctx.closePath(); }
      if (any) { ctx.fillStyle = 'rgba(30,15,10,' + (0.12 * L).toFixed(2) + ')'; ctx.fill(); }
    }
    ctx.strokeStyle = mix(color, 0.5, [255, 255, 255]); ctx.lineWidth = Math.max(1, width * 0.12); ctx.globalAlpha *= 0.8;
    ctx.beginPath(); for (let k = 0; k < m - 1; k++) { if (TW[k] > 0.6 && TW[k + 1] > 0.6) { ctx.moveTo(X[k] - NX[k] * width * 0.12, Y[k] - NY[k] * width * 0.12); ctx.lineTo(X[k + 1] - NX[k + 1] * width * 0.12, Y[k + 1] - NY[k + 1] * width * 0.12); } } ctx.stroke();
    ctx.globalAlpha /= 0.8;
  }
  if (style === 'belt') {   // stitching inset from both edges
    ctx.strokeStyle = mix(color, 0.35, [255, 255, 255]); ctx.lineWidth = Math.max(1, width * 0.05); ctx.setLineDash([width * 0.18, width * 0.12]);
    const inset = function (s) { ctx.beginPath(); for (let k = 0; k < m; k++) { const h = Wd[k] / 2 - Math.max(2.5, width * 0.12); const px = X[k] + NX[k] * h * s, py = Y[k] + NY[k] * h * s; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); };
    inset(1); inset(-1); ctx.setLineDash([]);
  }
  if (style === 'tape') {   // paper fibres along the strip
    ctx.strokeStyle = mix(color, 0.12); ctx.lineWidth = 0.8; ctx.globalAlpha *= 0.5;
    for (const s of [-0.22, 0.18]) { ctx.beginPath(); for (let k = 0; k < m; k++) { const px = X[k] + NX[k] * Wd[k] * s, py = Y[k] + NY[k] * Wd[k] * s; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); }
    ctx.globalAlpha /= 0.5;
  }
  ctx.strokeStyle = o.edge || mix(color, 0.38); ctx.lineWidth = Math.max(1, Math.min(2.2, width * 0.08)); band(); ctx.stroke();
  if (style === 'belt' && o.buckle && first) buckle(ctx, X[0], Y[0], -NY[0], NX[0], width, o);
}
/* a sawtooth across the end of a band (torn tape) from (ax, ay) to (bx, by); d points outward along the strip */
function zig(ctx, ax, ay, bx, by, dx, dy) {
  const l = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / l, uy = dy / l, teeth = 4;
  for (let s = 1; s <= teeth * 2; s++) { const f = s / (teeth * 2), o = (s & 1) ? 2.5 : 0; ctx.lineTo(ax + (bx - ax) * f + ux * o, ay + (by - ay) * f + uy * o); }
}
/* the gait belt's metal buckle at the first particle: a rounded frame across the strap, a prong, a highlight */
function buckle(ctx, x, y, tx, ty, w, o) {
  const L = w * 0.9, H = w * 1.35;   // oriented by the strap's tangent basis (no trig)
  ctx.save(); ctx.transform(tx, ty, -ty, tx, x, y);
  ctx.fillStyle = 'rgba(20,14,30,0.18)'; roundRect(ctx, -L * 0.5 + 2, -H / 2 + 4, L, H, w * 0.18); ctx.fill();
  ctx.fillStyle = o.metal || '#c9ced6'; ctx.strokeStyle = '#5d6470'; ctx.lineWidth = Math.max(1.2, w * 0.07);
  roundRect(ctx, -L * 0.5, -H / 2, L, H, w * 0.18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = o.color || '#c9b48a'; roundRect(ctx, -L * 0.22, -H / 2 + H * 0.2, L * 0.44, H * 0.6, w * 0.08); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5d6470'; ctx.lineWidth = Math.max(1.5, w * 0.09); ctx.beginPath(); ctx.moveTo(-L * 0.5, 0); ctx.lineTo(L * 0.2, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, w * 0.05); ctx.beginPath(); ctx.moveTo(-L * 0.38, -H / 2 + 3); ctx.lineTo(L * 0.3, -H / 2 + 3); ctx.stroke();
  ctx.restore();
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
/* tinsel: a fuzzy garland of short strands along the path, three tones and a few fixed sparkles */
function tinselRun(ctx, X, Y, NX, NY, m, width, color, o) {
  const cols = o.colors || [color, mix(color, 0.45, [255, 255, 255]), mix(color, 0.35)];
  const pts = [];
  for (let k = 0; k < m - 1; k++) { const dx = X[k + 1] - X[k], dy = Y[k + 1] - Y[k], l = Math.sqrt(dx * dx + dy * dy), s = Math.max(1, Math.round(l / 3)); for (let q = 0; q < s; q++) { const f = q / s; pts.push(X[k] + dx * f, Y[k] + dy * f, NX[k], NY[k]); } }
  for (let c = 0; c < 3; c++) {
    ctx.strokeStyle = cols[c]; ctx.lineWidth = Math.max(1, width * 0.09); ctx.beginPath();
    for (let q = 0; q < pts.length; q += 4) {
      const id = q >> 2; if (id % 3 !== c) continue;
      const r1 = hash2(id, 3) - 0.5, r2 = hash2(id, 7), len = width * (0.35 + 0.55 * r2), nx = pts[q + 2], ny = pts[q + 3];
      const ux = nx * fcos(r1 * 3) - ny * fsin(r1 * 3), uy = nx * fsin(r1 * 3) + ny * fcos(r1 * 3), sg = (id & 1) ? 1 : -1;
      ctx.moveTo(pts[q] - ux * len * 0.5 * sg, pts[q + 1] - uy * len * 0.5 * sg); ctx.lineTo(pts[q] + ux * len * 0.5 * sg, pts[q + 1] + uy * len * 0.5 * sg);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,240,0.9)';
  for (let q = 0; q < pts.length; q += 4) { const id = q >> 2; if (hash2(id, 11) > 0.08) continue; ctx.beginPath(); ctx.arc(pts[q] + (hash2(id, 13) - 0.5) * width * 0.6, pts[q + 1] + (hash2(id, 17) - 0.5) * width * 0.6, Math.max(1, width * 0.08), 0, TWO_PI); ctx.fill(); }
}

return {
  version: '0.1', kind: 'soft',
  world: function (o) { return new World(o); },
  eventsToFoley: eventsToFoley, stateHash: stateHash, project: project, debugDraw: debugDraw,
  drawCloth: function (ctx, st, o) { return DRAW.cloth(ctx, st, o); },
  drawRope: function (ctx, st, o) { return DRAW.rope(ctx, st, o); },
  drawBalloon: function (ctx, st, o) { return DRAW.balloon ? DRAW.balloon(ctx, st, o) : null; },
  gloveOutline: gloveOutline,
  materials: MATERIALS, sin: fsin, cos: fcos, rng: makeRng
};
});
