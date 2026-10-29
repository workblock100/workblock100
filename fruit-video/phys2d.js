/* phys2d.js : deterministic, dependency-free 2D rigid-body physics for SHIFT HAPPENS (Episode 15).
 * Browser: window.PHYS2D.   Node: module.exports.   See GUIDE_PHYS.md for the API.
 * Design: Box2D-lite family. Fixed step 1/240 s, sequential impulses with warm starting, SAT polygon manifolds
 * (max 2 points, speculative margin), accumulated impulses, Coulomb friction, restitution with a velocity threshold,
 * NGS position correction with slop, sleeping islands, joints (distance/spring/rope, pin, weld, slider, mouse),
 * particle ropes, verlet cloth, and collision events for the sound.
 * Determinism: only + - * / sqrt floor and integer maths are used (own sin/cos, own PRNG): no Math.random, no
 * Date, no Math.sin/cos/atan2/pow. The same code and seed give bit-identical results in every engine.
 * Coordinates: y points down (canvas). Angles in radians, positive = clockwise on screen (ctx.rotate direction).
 * Units: whatever the scene uses; `unit` (units per metre) is inferred from gravity (|g| / 9.8) so every tolerance scales.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  if (root) root.PHYS2D = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null), function () {
'use strict';

const PI = 3.141592653589793, TWO_PI = 6.283185307179586, HALF_PI = 1.5707963267948966;
const STATIC = 0, KINEMATIC = 1, DYNAMIC = 2;
const KEYMUL = 32768; // contact key = uidA * KEYMUL + uidB: small integers, so Map lookups never allocate (at most 32767 shapes)

// ---------------------------------------------------------------- deterministic maths
let _sn = 0, _cs = 1;
/* sin and cos of a (results in _sn, _cs). Taylor series on [-pi/2, pi/2] after folding: error below 1e-13. */
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
/* mulberry32: integer maths only, so identical everywhere */
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

// ---------------------------------------------------------------- materials (density is relative, friction and restitution are Coulomb / Newton)
const MATERIALS = {
  default:   { density: 1.0, friction: 0.50, restitution: 0.10 },
  wood:      { density: 0.8, friction: 0.55, restitution: 0.15 },
  metal:     { density: 3.0, friction: 0.35, restitution: 0.12 },
  cardboard: { density: 0.3, friction: 0.70, restitution: 0.05 },
  plastic:   { density: 0.6, friction: 0.40, restitution: 0.35 },
  glass:     { density: 1.5, friction: 0.25, restitution: 0.20 },
  fabric:    { density: 0.2, friction: 0.90, restitution: 0.02 },
  ceramic:   { density: 1.2, friction: 0.40, restitution: 0.10 },
  rubber:    { density: 1.0, friction: 0.95, restitution: 0.75 },
  concrete:  { density: 2.5, friction: 0.70, restitution: 0.05 }
};

// ---------------------------------------------------------------- shapes
function Shape() {
  this.body = null; this.uid = 0; this.circle = false; this.n = 0;
  this.lvx = null; this.lvy = null; this.lnx = null; this.lny = null; // local vertices / outward normals (body origin frame)
  this.wvx = null; this.wvy = null; this.wnx = null; this.wny = null; // world copies, refreshed every step the body moves
  this.cx = 0; this.cy = 0; this.r = 0; this.wcx = 0; this.wcy = 0;   // local centre (circle centre / polygon centroid), radius, world circle centre
  this.area = 0; this.polar = 0; this.density = 1; this.friction = 0.5; this.restitution = 0.1; this.mat = 'default';
  this.inr = 0; this.bound = 0;                                       // half thickness, bounding radius about the body origin
  this.minx = 0; this.miny = 0; this.maxx = 0; this.maxy = 0;
}
/* refresh world vertices, normals and the (fat) AABB from the body origin transform */
Shape.prototype.update = function (xo, yo, sn, cs, m) {
  if (this.circle) {
    const wx = xo + cs * this.cx - sn * this.cy, wy = yo + sn * this.cx + cs * this.cy, r = this.r + m;
    this.wcx = wx; this.wcy = wy; this.minx = wx - r; this.maxx = wx + r; this.miny = wy - r; this.maxy = wy + r;
    return;
  }
  let mnx = 1e30, mny = 1e30, mxx = -1e30, mxy = -1e30;
  const n = this.n, lvx = this.lvx, lvy = this.lvy, lnx = this.lnx, lny = this.lny, wvx = this.wvx, wvy = this.wvy, wnx = this.wnx, wny = this.wny;
  for (let i = 0; i < n; i++) {
    const x = xo + cs * lvx[i] - sn * lvy[i], y = yo + sn * lvx[i] + cs * lvy[i];
    wvx[i] = x; wvy[i] = y;
    wnx[i] = cs * lnx[i] - sn * lny[i]; wny[i] = sn * lnx[i] + cs * lny[i];
    if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y;
  }
  this.minx = mnx - m; this.maxx = mxx + m; this.miny = mny - m; this.maxy = mxy + m;
};

/* convex hull (monotone chain), counter-clockwise in maths orientation, collinear points dropped, at most 8 vertices */
function hull(pts) {
  const p = pts.map(function (q) { return [q[0], q[1]]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  if (p.length < 3) throw new Error('PHYS2D: polygon needs 3 points');
  const cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
  const lo = [], up = [];
  for (let i = 0; i < p.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 1e-12) lo.pop(); lo.push(p[i]); }
  for (let i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 1e-12) up.pop(); up.push(p[i]); }
  lo.pop(); up.pop();
  const h = lo.concat(up);
  if (h.length < 3) throw new Error('PHYS2D: degenerate polygon');
  while (h.length > 8) { // drop the vertex that contributes least area
    let bi = 0, ba = 1e30;
    for (let i = 0; i < h.length; i++) {
      const a = h[(i + h.length - 1) % h.length], b = h[i], c = h[(i + 1) % h.length];
      const ar = Math.abs(cr(a, b, c));
      if (ar < ba) { ba = ar; bi = i; }
    }
    h.splice(bi, 1);
  }
  return h;
}

function makeShape(body, sd, W) {
  const s = new Shape();
  s.body = body; s.uid = W._shapeUid++;
  s.mat = sd.mat || body.mat || 'default';
  const M = W.mats[s.mat] || W.mats.default;
  s.density = sd.density != null ? sd.density : M.density;
  s.friction = sd.friction != null ? sd.friction : M.friction;
  s.restitution = sd.restitution != null ? sd.restitution : M.restitution;
  const ox = sd.offset ? sd.offset[0] : 0, oy = sd.offset ? sd.offset[1] : 0;
  if (sd.circle != null) {
    s.circle = true; s.r = sd.circle; s.cx = ox; s.cy = oy;
    s.area = PI * s.r * s.r;
    s.polar = 0.5 * s.area * s.r * s.r + s.area * (ox * ox + oy * oy); // per unit density, about the body origin
    s.inr = s.r; s.bound = Math.sqrt(ox * ox + oy * oy) + s.r;
    return s;
  }
  let pts;
  if (sd.box) { const hw = sd.box[0], hh = sd.box[1]; pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]; }
  else {
    pts = sd.poly;
    if (typeof pts[0] === 'number') { const q = []; for (let i = 0; i + 1 < pts.length; i += 2) q.push([pts[i], pts[i + 1]]); pts = q; }
  }
  sincos(sd.angle || 0);
  const ca = _cs, sa = _sn;
  pts = pts.map(function (q) { return [ox + ca * q[0] - sa * q[1], oy + sa * q[0] + ca * q[1]]; });
  const h = sd.box ? pts : hull(pts);
  const n = h.length;
  s.n = n; s.lvx = new Float64Array(n); s.lvy = new Float64Array(n); s.lnx = new Float64Array(n); s.lny = new Float64Array(n);
  s.wvx = new Float64Array(n); s.wvy = new Float64Array(n); s.wnx = new Float64Array(n); s.wny = new Float64Array(n);
  let area = 0, cxs = 0, cys = 0, J = 0;
  for (let i = 0; i < n; i++) {
    const a = h[i], b = h[(i + 1) % n];
    s.lvx[i] = a[0]; s.lvy[i] = a[1];
    const ex = b[0] - a[0], ey = b[1] - a[1], len = Math.sqrt(ex * ex + ey * ey);
    s.lnx[i] = ey / len; s.lny[i] = -ex / len;
    const cr = a[0] * b[1] - b[0] * a[1];
    area += 0.5 * cr; cxs += (a[0] + b[0]) * cr; cys += (a[1] + b[1]) * cr;
    J += cr * (a[0] * a[0] + a[0] * b[0] + b[0] * b[0] + a[1] * a[1] + a[1] * b[1] + b[1] * b[1]);
  }
  if (area < 1e-12) throw new Error('PHYS2D: polygon has no area (wrong winding is fixed automatically; check the points)');
  s.area = area; s.cx = cxs / (6 * area); s.cy = cys / (6 * area); s.polar = J / 12;
  let inr = 1e30, bound = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(s.lnx[i] * (s.cx - s.lvx[i]) + s.lny[i] * (s.cy - s.lvy[i]));
    if (d < inr) inr = d;
    const r = Math.sqrt(s.lvx[i] * s.lvx[i] + s.lvy[i] * s.lvy[i]);
    if (r > bound) bound = r;
  }
  s.inr = inr; s.bound = bound;
  return s;
}

// ---------------------------------------------------------------- bodies
function Body(W, def, id) {
  this.id = id; this.world = W;
  this.type = def.type === 'static' ? STATIC : (def.type === 'kinematic' ? KINEMATIC : DYNAMIC);
  this.shapes = [];
  this.x = def.x || 0; this.y = def.y || 0; this.angle = def.angle || 0;     // origin transform (live solver state)
  sincos(this.angle); this.sn = _sn; this.cs = _cs;
  this.cx = this.x; this.cy = this.y; this.a = this.angle;                   // centre of mass position + angle (solver state)
  this.lcx = 0; this.lcy = 0;                                               // local centre of mass
  this.vx = def.vx || 0; this.vy = def.vy || 0; this.w = def.w || 0;
  this.mass = 0; this.im = 0; this.inertia = 0; this.ii = 0;
  this.awake = true; this.sleepTime = 0; this.allowSleep = def.allowSleep !== false && def.sleep !== false;
  this.linDamp = def.linearDamping || 0; this.angDamp = def.angularDamping || 0; this.gscale = def.gravityScale != null ? def.gravityScale : 1;
  this.fixedRot = !!def.fixedRotation;
  this.group = def.group | 0; this.category = def.category != null ? def.category : 1; this.mask = def.mask != null ? def.mask : 0xFFFF;
  this.tag = def.tag || ''; this.mat = def.mat || 'default'; this.data = def.data;
  this.pose = typeof def.pose === 'function' ? def.pose : null;
  this.px = this.x; this.py = this.y; this.pa = this.angle;                 // kinematic target for the end of the step
  this.silent = !!def.silent; this.internal = !!def.internal;               // silent: no events. internal: rope particle (not listed by at())
  this.radius = 0; this.inr = 0; this.slot = -1; this.jlist = []; this.moving = false; this.wild = false; this.def = def;
}
Body.prototype.isDynamic = function () { return this.type === DYNAMIC; };
/* mass data from the shapes (density x area), centre of mass, inertia; def.mass / def.inertia override */
Body.prototype.finalize = function () {
  let m = 0, mx = 0, my = 0, J = 0, rad = 0, inr = 1e30;
  for (const s of this.shapes) {
    const sm = s.density * s.area;
    m += sm; mx += sm * s.cx; my += sm * s.cy; J += s.density * s.polar;
    if (s.bound > rad) rad = s.bound;
    if (s.inr < inr) inr = s.inr;
  }
  this.radius = rad; this.inr = inr < 1e30 ? inr : 0;
  const d = this.def;
  if (this.type === DYNAMIC) {
    let ms = m, lx = 0, ly = 0, I = 0;
    if (m > 0) { lx = mx / m; ly = my / m; I = J - m * (lx * lx + ly * ly); }
    if (d.mass != null) { const k = ms > 0 ? d.mass / ms : 1; I = ms > 0 ? I * k : 0; ms = d.mass; }
    if (ms <= 0) ms = 1;
    if (d.inertia != null) I = d.inertia;
    this.mass = ms; this.im = 1 / ms; this.lcx = lx; this.lcy = ly;
    this.inertia = I > 0 ? I : 0; this.ii = (this.fixedRot || I <= 0) ? 0 : 1 / I;
  } else { this.mass = 0; this.im = 0; this.ii = 0; this.lcx = 0; this.lcy = 0; }
  this.syncFromOrigin();
};
/* centre of mass state from the origin transform */
Body.prototype.syncFromOrigin = function () {
  this.a = this.angle; sincos(this.a); this.sn = _sn; this.cs = _cs;
  this.cx = this.x + this.cs * this.lcx - this.sn * this.lcy; this.cy = this.y + this.sn * this.lcx + this.cs * this.lcy;
};
/* origin transform from the centre of mass state */
Body.prototype.syncToOrigin = function () {
  this.angle = this.a; this.x = this.cx - (this.cs * this.lcx - this.sn * this.lcy); this.y = this.cy - (this.sn * this.lcx + this.cs * this.lcy);
};
Body.prototype.setVelocity = function (vx, vy, w) { this.vx = vx; this.vy = vy; this.w = w || 0; this.wake(); return this; };
Body.prototype.applyImpulse = function (ix, iy, px, py) { // impulse at a world point (default: centre of mass)
  this.vx += this.im * ix; this.vy += this.im * iy;
  if (px != null) this.w += this.ii * ((px - this.cx) * iy - (py - this.cy) * ix);
  this.wake(); return this;
};
Body.prototype.setPose = function (x, y, angle) { // only before the world has run
  this.x = x; this.y = y; this.angle = angle || 0; this.px = x; this.py = y; this.pa = this.angle; this.syncFromOrigin(); this.refreshShapes(); return this;
};
Body.prototype.wake = function () { if (!this.awake && this.type !== STATIC) { this.awake = true; this.sleepTime = 0; } return this; };
Body.prototype.refreshShapes = function () {
  const m = this.world.aabbMargin;
  for (const s of this.shapes) s.update(this.x, this.y, this.sn, this.cs, m);
};

// ---------------------------------------------------------------- contacts and narrowphase
function MPoint() {
  this.lx = 0; this.ly = 0; this.id = 0;       // point in the incident body's frame (circle centre for circles), feature id for warm starting
  this.jn = 0; this.jt = 0;                    // accumulated normal / tangent impulses
  this.x = 0; this.y = 0; this.s = 0;          // world contact point (midway between the surfaces), separation (negative = overlap)
  this.rax = 0; this.ray = 0; this.rbx = 0; this.rby = 0; this.nm = 0; this.tm = 0; this.vb = 0; this.rel = 0;
}
function Contact() {
  this.sa = null; this.sb = null; this.A = null; this.B = null; this.key = 0;
  this.friction = 0; this.rest = 0; this.count = 0; this.nv = 0; this.type = 0; this.rsum = 0;
  this.nx = 0; this.ny = 0; this.lnx = 0; this.lny = 0; this.lpx = 0; this.lpy = 0;
  this.p0 = new MPoint(); this.p1 = new MPoint();
  this.block = false; this.k11 = 0; this.k12 = 0; this.k22 = 0; this.i11 = 0; this.i12 = 0; this.i22 = 0;
  this.slideT = 0; this.rollT = 0; this.silent = false; this.ok = 0; this.stat = false;
}
function rotInvX(b, x, y) { return b.cs * x + b.sn * y; }
function rotInvY(b, x, y) { return -b.sn * x + b.cs * y; }

let _edge = 0;
/* largest separation of Q from the faces of P (early out above margin); the face index lands in _edge */
function findMaxSep(P, Q, margin) {
  let best = -1e30, bi = 0;
  const pn = P.n, qn = Q.n, pvx = P.wvx, pvy = P.wvy, pnx = P.wnx, pny = P.wny, qvx = Q.wvx, qvy = Q.wvy;
  for (let i = 0; i < pn; i++) {
    const nx = pnx[i], ny = pny[i], vx = pvx[i], vy = pvy[i];
    let si = 1e30;
    for (let j = 0; j < qn; j++) {
      const s = nx * (qvx[j] - vx) + ny * (qvy[j] - vy);
      if (s < si) si = s;
    }
    if (si > best) { best = si; bi = i; if (best > margin) break; }
  }
  _edge = bi; return best;
}
const _ca = new Float64Array(6), _cb = new Float64Array(6), _cc = new Float64Array(6);
/* clip the segment v (x0 y0 id0 x1 y1 id1) against the half plane n.p <= off; ids as in Box2D features, packed */
function clipSeg(o, v, nx, ny, off, viA) {
  const d0 = nx * v[0] + ny * v[1] - off, d1 = nx * v[3] + ny * v[4] - off;
  let k = 0;
  if (d0 <= 0) { o[0] = v[0]; o[1] = v[1]; o[2] = v[2]; k = 1; }
  if (d1 <= 0) { const q = k * 3; o[q] = v[3]; o[q + 1] = v[4]; o[q + 2] = v[5]; k++; }
  if (d0 * d1 < 0) {
    const t = d0 / (d0 - d1), q = k * 3;
    o[q] = v[0] + t * (v[3] - v[0]); o[q + 1] = v[1] + t * (v[4] - v[1]);
    o[q + 2] = ((viA & 7) << 5) | (((v[2] >> 2) & 7) << 2) | 1; // indexA = viA, indexB from vertex 0, typeA vertex, typeB face
    k++;
  }
  return k;
}
/* polygon A against polygon B (world space). Fills the contact manifold, returns the point count. */
function polyPoly(c, A, B, margin, ktol) {
  const sa = findMaxSep(A, B, margin); if (sa > margin) return 0; const ea = _edge;
  const sb = findMaxSep(B, A, margin); if (sb > margin) return 0; const eb = _edge;
  let R, I, edge, flip;
  if (sb > sa + ktol) { R = B; I = A; edge = eb; flip = true; c.type = 2; } else { R = A; I = B; edge = ea; flip = false; c.type = 1; }
  const rnx = R.wnx[edge], rny = R.wny[edge];
  let ii = 0, md = 1e30;
  for (let k = 0; k < I.n; k++) { const d = rnx * I.wnx[k] + rny * I.wny[k]; if (d < md) { md = d; ii = k; } }
  const i1 = ii, i2 = ii + 1 < I.n ? ii + 1 : 0;
  const iv1 = edge, iv2 = edge + 1 < R.n ? edge + 1 : 0;
  const v1x = R.wvx[iv1], v1y = R.wvy[iv1], v2x = R.wvx[iv2], v2y = R.wvy[iv2];
  let tx = v2x - v1x, ty = v2y - v1y; const tl = Math.sqrt(tx * tx + ty * ty); tx /= tl; ty /= tl;
  const front = rnx * v1x + rny * v1y;
  _ca[0] = I.wvx[i1]; _ca[1] = I.wvy[i1]; _ca[2] = ((edge & 7) << 5) | ((i1 & 7) << 2) | 2;
  _ca[3] = I.wvx[i2]; _ca[4] = I.wvy[i2]; _ca[5] = ((edge & 7) << 5) | ((i2 & 7) << 2) | 2;
  if (clipSeg(_cb, _ca, -tx, -ty, -(tx * v1x + ty * v1y), iv1) < 2) return 0;
  if (clipSeg(_cc, _cb, tx, ty, tx * v2x + ty * v2y, iv2) < 2) return 0;
  c.nx = flip ? -rnx : rnx; c.ny = flip ? -rny : rny;
  c.lnx = R.lnx[edge]; c.lny = R.lny[edge];
  c.lpx = 0.5 * (R.lvx[iv1] + R.lvx[iv2]); c.lpy = 0.5 * (R.lvy[iv1] + R.lvy[iv2]);
  const ib = I.body;
  let cnt = 0;
  for (let k = 0; k < 2; k++) {
    const px = _cc[k * 3], py = _cc[k * 3 + 1];
    const sep = rnx * px + rny * py - front;
    if (sep > margin) continue;
    const p = cnt === 0 ? c.p0 : c.p1;
    p.s = sep; p.x = px - 0.5 * sep * rnx; p.y = py - 0.5 * sep * rny;
    const dx = px - ib.x, dy = py - ib.y;
    p.lx = ib.cs * dx + ib.sn * dy; p.ly = -ib.sn * dx + ib.cs * dy;
    let id = _cc[k * 3 + 2] | 0;
    if (flip) id = (((id >> 2) & 7) << 5) | (((id >> 5) & 7) << 2) | ((id & 1) << 1) | ((id >> 1) & 1);
    p.id = id; cnt++;
  }
  return cnt;
}
/* polygon A against circle B */
function polyCircle(c, A, B, margin) {
  const px = B.wcx, py = B.wcy, r = B.r, n = A.n;
  let best = -1e30, fi = 0;
  for (let i = 0; i < n; i++) {
    const s = A.wnx[i] * (px - A.wvx[i]) + A.wny[i] * (py - A.wvy[i]);
    if (s > r + margin) return 0;
    if (s > best) { best = s; fi = i; }
  }
  const i2 = fi + 1 < n ? fi + 1 : 0;
  const v1x = A.wvx[fi], v1y = A.wvy[fi], v2x = A.wvx[i2], v2y = A.wvy[i2];
  let nx, ny, qx, qy, lqx, lqy;
  if (best < 1e-12) {
    nx = A.wnx[fi]; ny = A.wny[fi];
    qx = 0.5 * (v1x + v2x); qy = 0.5 * (v1y + v2y); lqx = 0.5 * (A.lvx[fi] + A.lvx[i2]); lqy = 0.5 * (A.lvy[fi] + A.lvy[i2]);
  } else {
    const u1 = (px - v1x) * (v2x - v1x) + (py - v1y) * (v2y - v1y), u2 = (px - v2x) * (v1x - v2x) + (py - v2y) * (v1y - v2y);
    if (u1 <= 0 || u2 <= 0) {
      const vx = u1 <= 0 ? v1x : v2x, vy = u1 <= 0 ? v1y : v2y, vi = u1 <= 0 ? fi : i2;
      const dx = px - vx, dy = py - vy, d = Math.sqrt(dx * dx + dy * dy);
      if (d > r + margin) return 0;
      nx = dx / d; ny = dy / d; qx = vx; qy = vy; lqx = A.lvx[vi]; lqy = A.lvy[vi];
    } else {
      nx = A.wnx[fi]; ny = A.wny[fi];
      qx = 0.5 * (v1x + v2x); qy = 0.5 * (v1y + v2y); lqx = 0.5 * (A.lvx[fi] + A.lvx[i2]); lqy = 0.5 * (A.lvy[fi] + A.lvy[i2]);
    }
  }
  const ab = A.body;
  c.type = 1; c.nx = nx; c.ny = ny; c.lnx = rotInvX(ab, nx, ny); c.lny = rotInvY(ab, nx, ny); c.lpx = lqx; c.lpy = lqy;
  const p = c.p0, sep = nx * (px - qx) + ny * (py - qy) - r;
  p.lx = B.cx; p.ly = B.cy; p.id = 0; p.s = sep; p.x = px - (r + 0.5 * sep) * nx; p.y = py - (r + 0.5 * sep) * ny;
  return 1;
}
function circleCircle(c, A, B, margin) {
  const dx = B.wcx - A.wcx, dy = B.wcy - A.wcy, rr = A.r + B.r, d2 = dx * dx + dy * dy;
  if (d2 > (rr + margin) * (rr + margin)) return 0;
  const d = Math.sqrt(d2);
  let nx = 0, ny = 1; if (d > 1e-9) { nx = dx / d; ny = dy / d; }
  c.type = 0; c.nx = nx; c.ny = ny; c.lnx = 0; c.lny = 0; c.lpx = A.cx; c.lpy = A.cy;
  const p = c.p0, sep = d - rr;
  p.lx = B.cx; p.ly = B.cy; p.id = 0; p.s = sep; p.x = A.wcx + (A.r + 0.5 * sep) * nx; p.y = A.wcy + (A.r + 0.5 * sep) * ny;
  return 1;
}
function collide(c, A, B, margin, ktol) {
  if (A.circle) return B.circle ? circleCircle(c, A, B, margin) : 0; // contacts are created with the polygon first
  return B.circle ? polyCircle(c, A, B, margin) : polyPoly(c, A, B, margin, ktol);
}

// ---------------------------------------------------------------- contact solver: soft step (soft constraints + relax), warm started
/* Per step the world sets: SB bias rate, SM mass scale, SI impulse scale (b2MakeSoft of the contact frequency), SLP slop, PUSH max push-out speed, IH 1/h.
 * Penetration is removed by a bias velocity (no position teleporting); a relax pass without bias then removes the energy the bias added. */
let SB = 0, SM = 1, SI = 0, SG = 0, SB2 = 0, SM2 = 1, SI2 = 0, SG2 = 0, SLP = 0, PUSH = 1e9, IH = 240, FLIP = 0;
function initContact(c, ratio) {
  const A = c.A, B = c.B, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  const nx = c.nx, ny = c.ny, tx = ny, ty = -nx, n = c.count;
  c.nv = n;
  let vAx = A.vx, vAy = A.vy, wA = A.w, vBx = B.vx, vBy = B.vy, wB = B.w;
  for (let k = 0; k < n; k++) {
    const p = k === 0 ? c.p0 : c.p1;
    p.rax = p.x - A.cx; p.ray = p.y - A.cy; p.rbx = p.x - B.cx; p.rby = p.y - B.cy;
    const rnA = p.rax * ny - p.ray * nx, rnB = p.rbx * ny - p.rby * nx;
    const kn = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
    p.nm = kn > 0 ? 1 / kn : 0;
    const rtA = p.rax * ty - p.ray * tx, rtB = p.rbx * ty - p.rby * tx;
    const kt = mA + mB + iA * rtA * rtA + iB * rtB * rtB;
    p.tm = kt > 0 ? 1 / kt : 0;
    const dvx = vBx - wB * p.rby - vAx + wA * p.ray, dvy = vBy + wB * p.rbx - vAy - wA * p.rax;
    p.rel = dvx * nx + dvy * ny;           // approach speed before the solve (restitution, events)
    p.jn *= ratio; p.jt *= ratio;
    const Px = p.jn * nx + p.jt * tx, Py = p.jn * ny + p.jt * ty; // warm start
    vAx -= mA * Px; vAy -= mA * Py; wA -= iA * (p.rax * Py - p.ray * Px);
    vBx += mB * Px; vBy += mB * Py; wB += iB * (p.rbx * Py - p.rby * Px);
  }
  A.vx = vAx; A.vy = vAy; A.w = wA; B.vx = vBx; B.vy = vBy; B.w = wB;
  c.block = false;
  if (n === 2) { // 2-point block solver: only when the 2x2 system is well conditioned, otherwise the second point is redundant
    const a = c.p0, b = c.p1;
    const r1A = a.rax * ny - a.ray * nx, r1B = a.rbx * ny - a.rby * nx, r2A = b.rax * ny - b.ray * nx, r2B = b.rbx * ny - b.rby * nx;
    const k11 = mA + mB + iA * r1A * r1A + iB * r1B * r1B, k22 = mA + mB + iA * r2A * r2A + iB * r2B * r2B, k12 = mA + mB + iA * r1A * r2A + iB * r1B * r2B;
    if (k11 * k11 < 1000 * (k11 * k22 - k12 * k12)) { c.block = true; c.k11 = k11; c.k12 = k12; c.k22 = k22; } else c.nv = 1;
  }
}
function solveContactV(c, useBias) {
  const A = c.A, B = c.B, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  let vAx = A.vx, vAy = A.vy, wA = A.w, vBx = B.vx, vBy = B.vy, wB = B.w;
  const nx = c.nx, ny = c.ny, tx = ny, ty = -nx, fr = c.friction, n = c.nv;
  const stat = c.stat, sb = stat ? SB2 : SB, sm = stat ? SM2 : SM, si = stat ? SI2 : SI, sg = stat ? SG2 : SG;
  for (let q = 0; q < n; q++) { // friction first: the normal constraint is the more important one; point order alternates per iteration
    const p = (q ^ FLIP) === 0 ? c.p0 : c.p1;
    const dvx = vBx - wB * p.rby - vAx + wA * p.ray, dvy = vBy + wB * p.rbx - vAy - wA * p.rax;
    let lam = -p.tm * (dvx * tx + dvy * ty);
    const mf = fr * p.jn, nt = p.jt + lam, nj = nt < -mf ? -mf : (nt > mf ? mf : nt);
    lam = nj - p.jt; p.jt = nj;
    const Px = lam * tx, Py = lam * ty;
    vAx -= mA * Px; vAy -= mA * Py; wA -= iA * (p.rax * Py - p.ray * Px);
    vBx += mB * Px; vBy += mB * Py; wB += iB * (p.rbx * Py - p.rby * Px);
  }
  if (!c.block) {
    for (let q = 0; q < n; q++) {
      const p = (q ^ FLIP) === 0 ? c.p0 : c.p1;
      const dvx = vBx - wB * p.rby - vAx + wA * p.ray, dvy = vBy + wB * p.rbx - vAy - wA * p.rax;
      const vn = dvx * nx + dvy * ny, s = p.s;
      let bias = 0, ms = 1, is = 0;
      if (s > 0) bias = s * IH;                       // speculative: a gap may close but not be crossed
      else if (useBias) { const e = s + SLP; if (e < 0) { bias = sb * e; if (bias < -PUSH) bias = -PUSH; } ms = sm; is = si; }
      let lam = -p.nm * ms * (vn + bias) - is * p.jn;
      const nj = p.jn + lam > 0 ? p.jn + lam : 0;
      lam = nj - p.jn; p.jn = nj;
      const Px = lam * nx, Py = lam * ny;
      vAx -= mA * Px; vAy -= mA * Py; wA -= iA * (p.rax * Py - p.ray * Px);
      vBx += mB * Px; vBy += mB * Py; wB += iB * (p.rbx * Py - p.rby * Px);
    }
  } else { // 2-point block LCP with soft regularisation: (K + diag(k/a2)) x = K a - (vn + bias)
    const a = c.p0, b = c.p1;
    let bias1 = 0, bias2 = 0, g1 = 0, g2 = 0;
    if (a.s > 0) bias1 = a.s * IH; else if (useBias) { const e = a.s + SLP; if (e < 0) { bias1 = sb * e; if (bias1 < -PUSH) bias1 = -PUSH; } g1 = c.k11 * sg; }
    if (b.s > 0) bias2 = b.s * IH; else if (useBias) { const e = b.s + SLP; if (e < 0) { bias2 = sb * e; if (bias2 < -PUSH) bias2 = -PUSH; } g2 = c.k22 * sg; }
    const K11 = c.k11 + g1, K22 = c.k22 + g2, K12 = c.k12, det = 1 / (K11 * K22 - K12 * K12);
    const i11 = K22 * det, i12 = -K12 * det, i22 = K11 * det;
    const ax = a.jn, ay = b.jn;
    const d1x = vBx - wB * a.rby - vAx + wA * a.ray, d1y = vBy + wB * a.rbx - vAy - wA * a.rax;
    const d2x = vBx - wB * b.rby - vAx + wA * b.ray, d2y = vBy + wB * b.rbx - vAy - wA * b.rax;
    const bx = d1x * nx + d1y * ny + bias1 - (c.k11 * ax + c.k12 * ay), by = d2x * nx + d2y * ny + bias2 - (c.k12 * ax + c.k22 * ay);
    let x1 = -(i11 * bx + i12 * by), x2 = -(i12 * bx + i22 * by), ok = x1 >= 0 && x2 >= 0; // case 1: both active
    if (!ok) { x1 = -bx / K11; x2 = 0; ok = x1 >= 0 && K12 * x1 + by >= 0; }               // case 2: only point 1
    if (!ok) { x1 = 0; x2 = -by / K22; ok = x2 >= 0 && K12 * x2 + bx >= 0; }               // case 3: only point 2
    if (!ok) { x1 = 0; x2 = 0; ok = bx >= 0 && by >= 0; }                                  // case 4: both separating
    if (ok) {
      const e1 = x1 - ax, e2 = x2 - ay;
      const P1x = e1 * nx, P1y = e1 * ny, P2x = e2 * nx, P2y = e2 * ny;
      vAx -= mA * (P1x + P2x); vAy -= mA * (P1y + P2y);
      wA -= iA * ((a.rax * P1y - a.ray * P1x) + (b.rax * P2y - b.ray * P2x));
      vBx += mB * (P1x + P2x); vBy += mB * (P1y + P2y);
      wB += iB * ((a.rbx * P1y - a.rby * P1x) + (b.rbx * P2y - b.rby * P2x));
      a.jn = x1; b.jn = x2;
    }
  }
  A.vx = vAx; A.vy = vAy; A.w = wA; B.vx = vBx; B.vy = vBy; B.w = wB;
}
/* restitution after the iterations, only for points that really carried an impulse and arrived faster than the threshold */
function applyRestitution(c, thresh, bounce) {
  const e = c.rest * bounce;
  if (e <= 0) return;
  const A = c.A, B = c.B, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii, nx = c.nx, ny = c.ny;
  for (let k = 0; k < c.nv; k++) {
    const p = k === 0 ? c.p0 : c.p1;
    if (p.rel > -thresh || p.jn <= 0) continue;
    const dvx = B.vx - B.w * p.rby - A.vx + A.w * p.ray, dvy = B.vy + B.w * p.rbx - A.vy - A.w * p.rax;
    let lam = -p.nm * (dvx * nx + dvy * ny + (e > 0.98 ? 0.98 : e) * p.rel);
    const nj = p.jn + lam > 0 ? p.jn + lam : 0;
    lam = nj - p.jn; p.jn = nj;
    const Px = lam * nx, Py = lam * ny;
    A.vx -= mA * Px; A.vy -= mA * Py; A.w -= iA * (p.rax * Py - p.ray * Px);
    B.vx += mB * Px; B.vy += mB * Py; B.w += iB * (p.rbx * Py - p.rby * Px);
  }
}

// ---------------------------------------------------------------- joints
function jointBase(j, W, def, type) {
  j.type = type; j.world = W; j.id = W._jointUid++;
  j.a = def.a || W.ground; j.b = def.b || W.ground;
  if (def.anchor) { // world anchor
    const A = j.a, B = j.b, dxa = def.anchor[0] - A.x, dya = def.anchor[1] - A.y, dxb = def.anchor[0] - B.x, dyb = def.anchor[1] - B.y;
    j.lax = A.cs * dxa + A.sn * dya; j.lay = -A.sn * dxa + A.cs * dya; j.lbx = B.cs * dxb + B.sn * dyb; j.lby = -B.sn * dxb + B.cs * dyb;
  } else {
    j.lax = def.anchorA ? def.anchorA[0] : 0; j.lay = def.anchorA ? def.anchorA[1] : 0;
    j.lbx = def.anchorB ? def.anchorB[0] : 0; j.lby = def.anchorB ? def.anchorB[1] : 0;
  }
  j.collide = !!def.collideConnected; j.removed = false; j.broken = false; j.rope = null;
  j.breakImpulse = def.breakImpulse || (def.breakForce ? def.breakForce * W.dt : 0);
  j.rax = 0; j.ray = 0; j.rbx = 0; j.rby = 0; j.ok = 0; j.silent = false; j.sweep = false;
  j.tag = def.tag || '';
}
let _ex = 0, _ey = 0;
/* Euler-integration drift of an anchor at offset (rx, ry) from the centre of a body turning at w: the target velocity that cancels it.
 * (1 - cos th) r + (th - sin th) perp(r), divided by h. Skipped for large turns per step (the expansion is not meant for them). */
function turnTarget(w, h, rx, ry) {
  const th = w * h;
  if (th > 0.25 || th < -0.25) { _ex = 0; _ey = 0; return; }
  sincos(th);
  const c1 = (1 - _cs) / h, c2 = (th - _sn) / h;
  _ex = c1 * rx - c2 * ry; _ey = c1 * ry + c2 * rx;
}
/* world offsets from each centre of mass to the anchors */
function anchors(j) {
  const A = j.a, B = j.b;
  let lx = j.lax - A.lcx, ly = j.lay - A.lcy;
  j.rax = A.cs * lx - A.sn * ly; j.ray = A.sn * lx + A.cs * ly;
  lx = j.lbx - B.lcx; ly = j.lby - B.lcy;
  j.rbx = B.cs * lx - B.sn * ly; j.rby = B.sn * lx + B.cs * ly;
}
function rotUpdate(b) { sincos(b.a); b.sn = _sn; b.cs = _cs; }
function applyLin(A, B, rax, ray, rbx, rby, Px, Py, L) { // velocity impulse P at the anchors plus extra angular impulse L
  A.vx -= A.im * Px; A.vy -= A.im * Py; A.w -= A.ii * ((rax * Py - ray * Px) + L);
  B.vx += B.im * Px; B.vy += B.im * Py; B.w += B.ii * ((rbx * Py - rby * Px) + L);
}

/* distance: rigid, spring (stiffness k + damping c, or hz + ratio), or one-sided: mode 'max' = rope (only pulls), 'min' = strut */
function DistanceJoint(W, def) {
  jointBase(this, W, def, 'distance');
  anchors(this);
  const A = this.a, B = this.b;
  const dx = B.cx + this.rbx - A.cx - this.rax, dy = B.cy + this.rby - A.cy - this.ray;
  this.length = def.length != null ? def.length : Math.sqrt(dx * dx + dy * dy);
  this.mode = (def.mode === 'max' || def.maxOnly) ? 1 : (def.mode === 'min' ? 2 : 0);
  this.k = def.stiffness || 0; this.c = def.damping || 0; this.hz = def.hz || 0; this.ratio = def.ratio != null ? def.ratio : 0.5;
  this.spring = this.mode === 0 && (this.k > 0 || this.hz > 0);
  // particle to particle (no rotation, anchors at the centres): lean code path for rope segments
  this.pp = this.a.ii === 0 && this.b.ii === 0 && this.lax === this.a.lcx && this.lay === this.a.lcy && this.lbx === this.b.lcx && this.lby === this.b.lcy && this.a.type === DYNAMIC && this.b.type === DYNAMIC;
  this.sweep = false;
  this.impulse = 0; this.ux = 0; this.uy = 0; this.mass = 0; this.soft = 0; this.gamma = 0; this.bias = 0; this.len = 0; this.cen = 0;
}
DistanceJoint.prototype.init = function (h, ratio) {
  const A = this.a, B = this.b;
  if (this.pp) { this.initPP(h, ratio); return; }
  anchors(this);
  const dx = B.cx + this.rbx - A.cx - this.rax, dy = B.cy + this.rby - A.cy - this.ray, len = Math.sqrt(dx * dx + dy * dy);
  this.len = len;
  if (len > 1e-9) { this.ux = dx / len; this.uy = dy / len; } else { this.ux = 0; this.uy = 0; }
  const crA = this.rax * this.uy - this.ray * this.ux, crB = this.rbx * this.uy - this.rby * this.ux;
  let inv = A.im + B.im + A.ii * crA * crA + B.ii * crB * crB;
  this.mass = inv > 0 ? 1 / inv : 0;
  if (this.spring) {
    let k = this.k, c = this.c;
    if (this.hz > 0) { const om = TWO_PI * this.hz; k = this.mass * om * om; c = 2 * this.mass * this.ratio * om; }
    let g = h * (c + h * k); g = g > 0 ? 1 / g : 0;
    this.gamma = g; this.bias = (len - this.length) * h * k * g;
    inv += g; this.soft = inv > 0 ? 1 / inv : 0;
  } else { this.gamma = 0; this.bias = 0; this.soft = this.mass; }
  // second-order target: Euler integration moves the anchors along their tangents; asking for the matching relative speed keeps the
  // length (and so the energy of a swinging rope or chain) instead of letting the next solve remove it
  this.cen = 0;
  if (!this.spring && len > 1e-6 && (this.mode === 0 || (this.mode === 1 ? len > this.length * 0.98 : len < this.length * 1.02))) {
    let dvx = (B.vx - B.w * this.rby) - (A.vx - A.w * this.ray), dvy = (B.vy + B.w * this.rbx) - (A.vy + A.w * this.rax);
    const du = this.ux * dvx + this.uy * dvy, tang2 = dvx * dvx + dvy * dvy - du * du;
    const hb2 = h * h * tang2;
    let chord = 0;
    if (hb2 > 0) chord = hb2 < len * len ? (Math.sqrt(len * len - hb2) - len) / h : -len / h; // exact: |d + h dv| = |d|
    let c = chord;
    if (B.w !== 0) { turnTarget(B.w, h, this.rbx, this.rby); c += this.ux * _ex + this.uy * _ey; }
    if (A.w !== 0) { turnTarget(A.w, h, this.rax, this.ray); c -= this.ux * _ex + this.uy * _ey; }
    this.cen = c;
  }
  this.impulse *= ratio;
  applyLin(A, B, this.rax, this.ray, this.rbx, this.rby, this.impulse * this.ux, this.impulse * this.uy, 0);
};
DistanceJoint.prototype.initPP = function (h, ratio) {
  const A = this.a, B = this.b;
  const dx = B.cx - A.cx, dy = B.cy - A.cy, len = Math.sqrt(dx * dx + dy * dy);
  this.len = len; this.rax = 0; this.ray = 0; this.rbx = 0; this.rby = 0;
  if (len > 1e-9) { this.ux = dx / len; this.uy = dy / len; } else { this.ux = 0; this.uy = 0; }
  let inv = A.im + B.im;
  this.mass = inv > 0 ? 1 / inv : 0;
  if (this.spring) {
    let k = this.k, c = this.c;
    if (this.hz > 0) { const om = TWO_PI * this.hz; k = this.mass * om * om; c = 2 * this.mass * this.ratio * om; }
    let g = h * (c + h * k); g = g > 0 ? 1 / g : 0;
    this.gamma = g; this.bias = (len - this.length) * h * k * g;
    inv += g; this.soft = inv > 0 ? 1 / inv : 0; this.cen = 0;
  } else {
    this.gamma = 0; this.bias = 0; this.soft = this.mass; this.cen = 0;
    if (len > 1e-6 && (this.mode === 0 || (this.mode === 1 ? len > this.length * 0.98 : len < this.length * 1.02))) {
      const dvx = B.vx - A.vx, dvy = B.vy - A.vy, du = this.ux * dvx + this.uy * dvy, hb2 = h * h * (dvx * dvx + dvy * dvy - du * du);
      if (hb2 > 0) this.cen = hb2 < len * len ? (Math.sqrt(len * len - hb2) - len) / h : -len / h;
    }
  }
  this.impulse *= ratio;
  const Px = this.impulse * this.ux, Py = this.impulse * this.uy;
  A.vx -= A.im * Px; A.vy -= A.im * Py; B.vx += B.im * Px; B.vy += B.im * Py;
};
DistanceJoint.prototype.solveV = function (invH) {
  const A = this.a, B = this.b, ux = this.ux, uy = this.uy;
  if (this.pp) {
    let Cdot = ux * (B.vx - A.vx) + uy * (B.vy - A.vy) - this.cen, imp;
    if (this.mode === 0) { imp = -this.soft * (Cdot + this.bias + this.gamma * this.impulse); this.impulse += imp; }
    else if (this.mode === 1) {
      const C = this.len - this.length; if (C < 0) Cdot += C * invH;
      imp = -this.mass * Cdot; const ni = this.impulse + imp < 0 ? this.impulse + imp : 0; imp = ni - this.impulse; this.impulse = ni;
    } else {
      const C = this.len - this.length; if (C > 0) Cdot += C * invH;
      imp = -this.mass * Cdot; const ni = this.impulse + imp > 0 ? this.impulse + imp : 0; imp = ni - this.impulse; this.impulse = ni;
    }
    const Px = imp * ux, Py = imp * uy;
    A.vx -= A.im * Px; A.vy -= A.im * Py; B.vx += B.im * Px; B.vy += B.im * Py;
    return;
  }
  let Cdot = ux * ((B.vx - B.w * this.rby) - (A.vx - A.w * this.ray)) + uy * ((B.vy + B.w * this.rbx) - (A.vy + A.w * this.rax)) - this.cen;
  let imp;
  if (this.mode === 0) { imp = -this.soft * (Cdot + this.bias + this.gamma * this.impulse); this.impulse += imp; }
  else if (this.mode === 1) { // rope: len <= length, impulse <= 0 (pull only); a slack rope may lengthen up to the limit
    const C = this.len - this.length; if (C < 0) Cdot += C * invH;
    imp = -this.mass * Cdot; const ni = Math.min(0, this.impulse + imp); imp = ni - this.impulse; this.impulse = ni;
  } else {
    const C = this.len - this.length; if (C > 0) Cdot += C * invH;
    imp = -this.mass * Cdot; const ni = Math.max(0, this.impulse + imp); imp = ni - this.impulse; this.impulse = ni;
  }
  applyLin(A, B, this.rax, this.ray, this.rbx, this.rby, imp * ux, imp * uy, 0);
};
DistanceJoint.prototype.solveP = function () {
  if (this.spring) return 0;
  const A = this.a, B = this.b, W = this.world;
  if (this.pp) {
    const dx = B.cx - A.cx, dy = B.cy - A.cy, len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-9) return 0;
    let C = len - this.length;
    if (this.mode === 1) C = clamp(C, 0, W.maxCorr); else if (this.mode === 2) C = clamp(C, -W.maxCorr, 0); else C = clamp(C, -W.maxCorr, W.maxCorr);
    const k = -this.mass * C / len, Px = k * dx, Py = k * dy;
    A.cx -= A.im * Px; A.cy -= A.im * Py; B.cx += B.im * Px; B.cy += B.im * Py;
    return C < 0 ? -C : C;
  }
  anchors(this);
  const dx = B.cx + this.rbx - A.cx - this.rax, dy = B.cy + this.rby - A.cy - this.ray, len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-9) return 0;
  const ux = dx / len, uy = dy / len;
  let C = len - this.length;
  if (this.mode === 1) C = clamp(C, 0, W.maxCorr); else if (this.mode === 2) C = clamp(C, -W.maxCorr, 0); else C = clamp(C, -W.maxCorr, W.maxCorr);
  const imp = -this.mass * C, Px = imp * ux, Py = imp * uy;
  if (A.im > 0) { A.cx -= A.im * Px; A.cy -= A.im * Py; }
  if (A.ii > 0) { A.a -= A.ii * (this.rax * Py - this.ray * Px); rotUpdate(A); }
  if (B.im > 0) { B.cx += B.im * Px; B.cy += B.im * Py; }
  if (B.ii > 0) { B.a += B.ii * (this.rbx * Py - this.rby * Px); rotUpdate(B); }
  return C < 0 ? -C : C;
};
DistanceJoint.prototype.reaction = function () { return Math.abs(this.impulse); };
DistanceJoint.prototype.forget = function () { this.impulse = 0; };

/* revolute / pin: anchors coincide; optional angle limits (relative angle b - a - ref) and motor */
function RevoluteJoint(W, def) {
  jointBase(this, W, def, 'pin');
  this.ref = def.referenceAngle != null ? def.referenceAngle : this.b.a - this.a.a;
  this.enableLimit = def.lower != null || def.upper != null;
  this.lower = def.lower != null ? def.lower : -1e9; this.upper = def.upper != null ? def.upper : 1e9;
  this.enableMotor = def.motorSpeed != null || def.maxMotorTorque != null;
  this.motorSpeed = def.motorSpeed || 0; this.maxTorque = def.maxMotorTorque != null ? def.maxMotorTorque : 0;
  this.ix = 0; this.iy = 0; this.im2 = 0; this.il = 0; this.iu = 0; // point impulse, motor, lower, upper
  this.k11 = 0; this.k12 = 0; this.k22 = 0; this.am = 0; this.fixed = false; this.tx = 0; this.ty = 0;
}
RevoluteJoint.prototype.init = function (h, ratio) {
  const A = this.a, B = this.b;
  anchors(this);
  const rax = this.rax, ray = this.ray, rbx = this.rbx, rby = this.rby, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  this.k11 = mA + mB + ray * ray * iA + rby * rby * iB; this.k12 = -ray * rax * iA - rby * rbx * iB; this.k22 = mA + mB + rax * rax * iA + rbx * rbx * iB;
  this.am = (iA + iB) > 0 ? 1 / (iA + iB) : 0; this.fixed = (iA + iB) === 0;
  if (this.fixed) { this.il = 0; this.iu = 0; this.im2 = 0; }
  this.tx = 0; this.ty = 0; // second-order anchor target (see DistanceJoint)
  if (B.w !== 0) { turnTarget(B.w, h, rbx, rby); this.tx += _ex; this.ty += _ey; }
  if (A.w !== 0) { turnTarget(A.w, h, rax, ray); this.tx -= _ex; this.ty -= _ey; }
  this.ix *= ratio; this.iy *= ratio; this.im2 *= ratio; this.il *= ratio; this.iu *= ratio;
  applyLin(A, B, rax, ray, rbx, rby, this.ix, this.iy, this.im2 + this.il - this.iu);
};
RevoluteJoint.prototype.solveV = function (invH) {
  const A = this.a, B = this.b, iA = A.ii, iB = B.ii;
  if (this.enableMotor && !this.fixed) {
    const mx = this.maxTorque / invH;
    let imp = -this.am * (B.w - A.w - this.motorSpeed);
    const ni = clamp(this.im2 + imp, -mx, mx); imp = ni - this.im2; this.im2 = ni;
    A.w -= iA * imp; B.w += iB * imp;
  }
  if (this.enableLimit && !this.fixed) {
    const ang = B.a - A.a - this.ref;
    { // lower
      const C = ang - this.lower, bias = C > 0 ? C * invH : 0;
      let imp = -this.am * (B.w - A.w + bias); const ni = Math.max(this.il + imp, 0); imp = ni - this.il; this.il = ni;
      A.w -= iA * imp; B.w += iB * imp;
    }
    { // upper
      const C = this.upper - ang, bias = C > 0 ? C * invH : 0;
      let imp = -this.am * (A.w - B.w + bias); const ni = Math.max(this.iu + imp, 0); imp = ni - this.iu; this.iu = ni;
      A.w += iA * imp; B.w -= iB * imp;
    }
  }
  const rax = this.rax, ray = this.ray, rbx = this.rbx, rby = this.rby;
  const cx = (B.vx - B.w * rby) - (A.vx - A.w * ray), cy = (B.vy + B.w * rbx) - (A.vy + A.w * rax);
  const det0 = this.k11 * this.k22 - this.k12 * this.k12, det = det0 !== 0 ? 1 / det0 : 0;
  const bx = this.tx - cx, by = this.ty - cy;
  const px = det * (this.k22 * bx - this.k12 * by), py = det * (this.k11 * by - this.k12 * bx);
  this.ix += px; this.iy += py;
  applyLin(A, B, rax, ray, rbx, rby, px, py, 0);
};
RevoluteJoint.prototype.solveP = function () {
  const A = this.a, B = this.b, W = this.world;
  let angErr = 0;
  if (this.enableLimit && !this.fixed) {
    const ang = B.a - A.a - this.ref; let C = 0;
    if (this.lower === this.upper) C = clamp(ang - this.lower, -W.maxAngCorr, W.maxAngCorr);
    else if (ang <= this.lower) C = clamp(ang - this.lower + W.angSlop, -W.maxAngCorr, 0);
    else if (ang >= this.upper) C = clamp(ang - this.upper - W.angSlop, 0, W.maxAngCorr);
    const li = -this.am * C; A.a -= A.ii * li; B.a += B.ii * li; rotUpdate(A); rotUpdate(B); angErr = C < 0 ? -C : C;
  }
  anchors(this);
  const rax = this.rax, ray = this.ray, rbx = this.rbx, rby = this.rby, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  const cx = B.cx + rbx - A.cx - rax, cy = B.cy + rby - A.cy - ray;
  const k11 = mA + mB + ray * ray * iA + rby * rby * iB, k12 = -ray * rax * iA - rby * rbx * iB, k22 = mA + mB + rax * rax * iA + rbx * rbx * iB;
  const d0 = k11 * k22 - k12 * k12, det = d0 !== 0 ? 1 / d0 : 0;
  const px = -det * (k22 * cx - k12 * cy), py = -det * (k11 * cy - k12 * cx);
  if (mA > 0) { A.cx -= mA * px; A.cy -= mA * py; }
  if (iA > 0) { A.a -= iA * (rax * py - ray * px); rotUpdate(A); }
  if (mB > 0) { B.cx += mB * px; B.cy += mB * py; }
  if (iB > 0) { B.a += iB * (rbx * py - rby * px); rotUpdate(B); }
  return Math.sqrt(cx * cx + cy * cy) + angErr;
};
RevoluteJoint.prototype.reaction = function () { return Math.sqrt(this.ix * this.ix + this.iy * this.iy); };
RevoluteJoint.prototype.forget = function () { this.ix = 0; this.iy = 0; this.im2 = 0; this.il = 0; this.iu = 0; };
RevoluteJoint.prototype.angle = function () { return this.b.a - this.a.a - this.ref; };

let _x = 0, _y = 0, _z = 0;
/* solve the symmetric 3x3 system K x = b (result in _x _y _z) */
function solve3(k11, k12, k13, k22, k23, k33, b1, b2, b3) {
  const c11 = k22 * k33 - k23 * k23, c12 = k13 * k23 - k12 * k33, c13 = k12 * k23 - k13 * k22;
  const c22 = k11 * k33 - k13 * k13, c23 = k12 * k13 - k11 * k23, c33 = k11 * k22 - k12 * k12;
  let det = k11 * c11 + k12 * c12 + k13 * c13; det = det !== 0 ? 1 / det : 0;
  _x = det * (c11 * b1 + c12 * b2 + c13 * b3); _y = det * (c12 * b1 + c22 * b2 + c23 * b3); _z = det * (c13 * b1 + c23 * b2 + c33 * b3);
}
function solve2(k11, k12, k22, b1, b2) {
  let det = k11 * k22 - k12 * k12; det = det !== 0 ? 1 / det : 0;
  _x = det * (k22 * b1 - k12 * b2); _y = det * (k11 * b2 - k12 * b1);
}

/* weld: locks relative position and angle. Optional soft angle (hz + ratio) lets a welded structure flex. */
function WeldJoint(W, def) {
  jointBase(this, W, def, 'weld');
  this.ref = def.referenceAngle != null ? def.referenceAngle : this.b.a - this.a.a;
  this.hz = def.hz || 0; this.ratio = def.ratio != null ? def.ratio : 0.5;
  this.ix = 0; this.iy = 0; this.iz = 0; this.gamma = 0; this.bias = 0; this.am = 0;
  this.k11 = 0; this.k12 = 0; this.k13 = 0; this.k22 = 0; this.k23 = 0; this.k33 = 0;
}
WeldJoint.prototype.init = function (h, ratio) {
  const A = this.a, B = this.b, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  anchors(this);
  const rax = this.rax, ray = this.ray, rbx = this.rbx, rby = this.rby;
  this.k11 = mA + mB + ray * ray * iA + rby * rby * iB; this.k12 = -ray * rax * iA - rby * rbx * iB; this.k13 = -ray * iA - rby * iB;
  this.k22 = mA + mB + rax * rax * iA + rbx * rbx * iB; this.k23 = rax * iA + rbx * iB; this.k33 = iA + iB;
  if (this.hz > 0) {
    const im = iA + iB, m = im > 0 ? 1 / im : 0, om = TWO_PI * this.hz, d = 2 * m * this.ratio * om, k = m * om * om;
    let g = h * (d + h * k); g = g !== 0 ? 1 / g : 0;
    this.gamma = g; this.bias = (B.a - A.a - this.ref) * h * k * g;
    const inv = im + g; this.am = inv !== 0 ? 1 / inv : 0;
  } else { this.gamma = 0; this.bias = 0; }
  this.ix *= ratio; this.iy *= ratio; this.iz *= ratio;
  applyLin(A, B, rax, ray, rbx, rby, this.ix, this.iy, this.iz);
};
WeldJoint.prototype.solveV = function () {
  const A = this.a, B = this.b, iA = A.ii, iB = B.ii, rax = this.rax, ray = this.ray, rbx = this.rbx, rby = this.rby;
  if (this.hz > 0) {
    const Cd2 = B.w - A.w, imp2 = -this.am * (Cd2 + this.bias + this.gamma * this.iz);
    this.iz += imp2; A.w -= iA * imp2; B.w += iB * imp2;
    const cx = (B.vx - B.w * rby) - (A.vx - A.w * ray), cy = (B.vy + B.w * rbx) - (A.vy + A.w * rax);
    solve2(this.k11, this.k12, this.k22, -cx, -cy);
    this.ix += _x; this.iy += _y; applyLin(A, B, rax, ray, rbx, rby, _x, _y, 0);
  } else {
    const cx = (B.vx - B.w * rby) - (A.vx - A.w * ray), cy = (B.vy + B.w * rbx) - (A.vy + A.w * rax), cz = B.w - A.w;
    if (this.k33 > 0) solve3(this.k11, this.k12, this.k13, this.k22, this.k23, this.k33, -cx, -cy, -cz);
    else { solve2(this.k11, this.k12, this.k22, -cx, -cy); _z = 0; }
    this.ix += _x; this.iy += _y; this.iz += _z; applyLin(A, B, rax, ray, rbx, rby, _x, _y, _z);
  }
};
WeldJoint.prototype.solveP = function () {
  const A = this.a, B = this.b, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  anchors(this);
  const rax = this.rax, ray = this.ray, rbx = this.rbx, rby = this.rby;
  const k11 = mA + mB + ray * ray * iA + rby * rby * iB, k12 = -ray * rax * iA - rby * rbx * iB, k13 = -ray * iA - rby * iB;
  const k22 = mA + mB + rax * rax * iA + rbx * rbx * iB, k23 = rax * iA + rbx * iB, k33 = iA + iB;
  const cx = B.cx + rbx - A.cx - rax, cy = B.cy + rby - A.cy - ray;
  let px, py, pz = 0, angErr = 0;
  if (this.hz > 0) { solve2(k11, k12, k22, -cx, -cy); px = _x; py = _y; }
  else {
    const cz = B.a - A.a - this.ref; angErr = Math.abs(cz);
    if (k33 > 0) { solve3(k11, k12, k13, k22, k23, k33, -cx, -cy, -cz); px = _x; py = _y; pz = _z; }
    else { solve2(k11, k12, k22, -cx, -cy); px = _x; py = _y; }
  }
  if (mA > 0) { A.cx -= mA * px; A.cy -= mA * py; }
  if (iA > 0) { A.a -= iA * ((rax * py - ray * px) + pz); rotUpdate(A); }
  if (mB > 0) { B.cx += mB * px; B.cy += mB * py; }
  if (iB > 0) { B.a += iB * ((rbx * py - rby * px) + pz); rotUpdate(B); }
  return Math.sqrt(cx * cx + cy * cy) + angErr;
};
WeldJoint.prototype.reaction = function () { return Math.sqrt(this.ix * this.ix + this.iy * this.iy); };
WeldJoint.prototype.forget = function () { this.ix = 0; this.iy = 0; this.iz = 0; };

/* mouse / target: a soft pin that drags body b's anchor toward a target point (array, or function of time) */
function MouseJoint(W, def) {
  jointBase(this, W, def, 'mouse');
  this.target = def.target || [this.b.x, this.b.y];
  this.hz = def.hz != null ? def.hz : 5; this.ratio = def.ratio != null ? def.ratio : 0.7; this.maxForce = def.maxForce != null ? def.maxForce : 1e9;
  this.ix = 0; this.iy = 0; this.gamma = 0; this.cx = 0; this.cy = 0; this.m11 = 0; this.m12 = 0; this.m22 = 0; this.h = 0;
}
MouseJoint.prototype.init = function (h, ratio) {
  const B = this.b, A = this.a;
  anchors(this);
  const t = typeof this.target === 'function' ? this.target(this.world.time) : this.target;
  const m = B.mass, om = TWO_PI * this.hz, d = 2 * m * this.ratio * om, k = m * om * om;
  let g = h * (d + h * k); g = g !== 0 ? 1 / g : 0; const beta = h * k * g;
  this.gamma = g;
  const rbx = this.rbx, rby = this.rby, iB = B.ii, mB = B.im;
  const k11 = mB + iB * rby * rby + g, k12 = -iB * rbx * rby, k22 = mB + iB * rbx * rbx + g;
  let det = k11 * k22 - k12 * k12; det = det !== 0 ? 1 / det : 0;
  this.m11 = det * k22; this.m12 = -det * k12; this.m22 = det * k11;
  this.cx = (B.cx + rbx - t[0]) * beta; this.cy = (B.cy + rby - t[1]) * beta;
  B.w *= 0.98; // a little damping keeps the drag stable
  this.ix *= ratio; this.iy *= ratio;
  B.vx += mB * this.ix; B.vy += mB * this.iy; B.w += iB * (rbx * this.iy - rby * this.ix);
  this.h = h;
};
MouseJoint.prototype.solveV = function () {
  const B = this.b, rbx = this.rbx, rby = this.rby;
  const cdx = B.vx - B.w * rby, cdy = B.vy + B.w * rbx;
  const bx = -(cdx + this.cx + this.gamma * this.ix), by = -(cdy + this.cy + this.gamma * this.iy);
  let px = this.m11 * bx + this.m12 * by, py = this.m12 * bx + this.m22 * by;
  const ox = this.ix, oy = this.iy;
  this.ix += px; this.iy += py;
  const mx = this.h * this.maxForce, l2 = this.ix * this.ix + this.iy * this.iy;
  if (l2 > mx * mx) { const s = mx / Math.sqrt(l2); this.ix *= s; this.iy *= s; }
  px = this.ix - ox; py = this.iy - oy;
  B.vx += B.im * px; B.vy += B.im * py; B.w += B.ii * (rbx * py - rby * px);
};
MouseJoint.prototype.solveP = function () { return 0; };
MouseJoint.prototype.reaction = function () { return 0; };
MouseJoint.prototype.forget = function () { this.ix = 0; this.iy = 0; };

/* slider (prismatic): b slides along an axis fixed in a. axis [x,y] in a's frame (default [0,-1] = up on screen).
 * translation 0 is the initial offset. Optional spring toward 0 (stiffness/damping or hz/ratio), limits lower/upper, motor. */
function SliderJoint(W, def) {
  jointBase(this, W, def, 'slider');
  const ax = def.axis ? def.axis[0] : 0, ay = def.axis ? def.axis[1] : -1, l = Math.sqrt(ax * ax + ay * ay);
  this.axx = ax / l; this.axy = ay / l;
  this.ref = def.referenceAngle != null ? def.referenceAngle : this.b.a - this.a.a;
  anchors(this);
  const A = this.a, B = this.b;
  const dx = B.cx + this.rbx - A.cx - this.rax, dy = B.cy + this.rby - A.cy - this.ray;
  this.t0 = (A.cs * this.axx - A.sn * this.axy) * dx + (A.sn * this.axx + A.cs * this.axy) * dy;
  this.k = def.stiffness || 0; this.c = def.damping || 0; this.hz = def.hz || 0; this.ratio = def.ratio != null ? def.ratio : 0.5;
  this.enableLimit = def.lower != null || def.upper != null;
  this.lower = def.lower != null ? def.lower : -1e9; this.upper = def.upper != null ? def.upper : 1e9;
  this.motorSpeed = def.motorSpeed || 0; this.maxMotor = def.maxMotorForce || 0; this.enableMotor = def.motorSpeed != null;
  this.ip = 0; this.ia = 0; this.is = 0; this.im2 = 0; this.il = 0; this.iu = 0;
  this.axisX = 0; this.axisY = 0; this.a1 = 0; this.a2 = 0; this.s1 = 0; this.s2 = 0; this.px = 0; this.py = 0;
  this.axm = 0; this.k11 = 0; this.k12 = 0; this.k22 = 0; this.gamma = 0; this.bias = 0; this.soft = 0; this.trans = 0; this.dx = 0; this.dy = 0;
}
SliderJoint.prototype.geom = function () {
  const A = this.a, B = this.b;
  anchors(this);
  const dx = B.cx + this.rbx - A.cx - this.rax, dy = B.cy + this.rby - A.cy - this.ray;
  const ax = A.cs * this.axx - A.sn * this.axy, ay = A.sn * this.axx + A.cs * this.axy;
  this.axisX = ax; this.axisY = ay; this.px = -ay; this.py = ax;
  const ux = dx + this.rax, uy = dy + this.ray;
  this.a1 = ux * ay - uy * ax; this.a2 = this.rbx * ay - this.rby * ax;
  this.s1 = ux * this.py - uy * this.px; this.s2 = this.rbx * this.py - this.rby * this.px;
  this.trans = ax * dx + ay * dy - this.t0;
  this.dx = dx; this.dy = dy;
  const mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  const ka = mA + mB + iA * this.a1 * this.a1 + iB * this.a2 * this.a2;
  this.axm = ka > 0 ? 1 / ka : 0;
  this.k11 = mA + mB + iA * this.s1 * this.s1 + iB * this.s2 * this.s2; this.k12 = iA * this.s1 + iB * this.s2; this.k22 = iA + iB;
};
SliderJoint.prototype.applyAxis = function (imp) { // impulse along the axis on b (and minus on a)
  const A = this.a, B = this.b, Px = imp * this.axisX, Py = imp * this.axisY, LA = imp * this.a1, LB = imp * this.a2;
  A.vx -= A.im * Px; A.vy -= A.im * Py; A.w -= A.ii * LA; B.vx += B.im * Px; B.vy += B.im * Py; B.w += B.ii * LB;
};
SliderJoint.prototype.applyPerp = function (ip, ia) {
  const A = this.a, B = this.b, Px = ip * this.px, Py = ip * this.py, LA = ip * this.s1 + ia, LB = ip * this.s2 + ia;
  A.vx -= A.im * Px; A.vy -= A.im * Py; A.w -= A.ii * LA; B.vx += B.im * Px; B.vy += B.im * Py; B.w += B.ii * LB;
};
SliderJoint.prototype.axialSpeed = function () {
  const A = this.a, B = this.b;
  return this.axisX * (B.vx - A.vx) + this.axisY * (B.vy - A.vy) + this.a2 * B.w - this.a1 * A.w;
};
SliderJoint.prototype.init = function (h, ratio) {
  this.geom();
  if (this.k > 0 || this.hz > 0) {
    let k = this.k, c = this.c;
    if (this.hz > 0) { const om = TWO_PI * this.hz; k = this.axm * om * om; c = 2 * this.axm * this.ratio * om; }
    let g = h * (c + h * k); g = g > 0 ? 1 / g : 0;
    this.gamma = g; this.bias = this.trans * h * k * g;
    const inv = (this.axm > 0 ? 1 / this.axm : 0) + g; this.soft = inv > 0 ? 1 / inv : 0;
  } else { this.gamma = 0; this.bias = 0; this.soft = 0; }
  this.ip *= ratio; this.ia *= ratio; this.is *= ratio; this.im2 *= ratio; this.il *= ratio; this.iu *= ratio;
  this.applyAxis(this.is + this.im2 + this.il - this.iu);
  this.applyPerp(this.ip, this.ia);
};
SliderJoint.prototype.solveV = function (invH) {
  if (this.soft > 0) { const imp = -this.soft * (this.axialSpeed() + this.bias + this.gamma * this.is); this.is += imp; this.applyAxis(imp); }
  if (this.enableMotor) {
    const mx = this.maxMotor / invH; let imp = -this.axm * (this.axialSpeed() - this.motorSpeed);
    const ni = clamp(this.im2 + imp, -mx, mx); imp = ni - this.im2; this.im2 = ni; this.applyAxis(imp);
  }
  if (this.enableLimit) {
    { const C = this.trans - this.lower, bias = C > 0 ? C * invH : 0;
      let imp = -this.axm * (this.axialSpeed() + bias); const ni = Math.max(this.il + imp, 0); imp = ni - this.il; this.il = ni; this.applyAxis(imp); }
    { const C = this.upper - this.trans, bias = C > 0 ? C * invH : 0;
      let imp = -this.axm * (-this.axialSpeed() + bias); const ni = Math.max(this.iu + imp, 0); imp = ni - this.iu; this.iu = ni; this.applyAxis(-imp); }
  }
  const A = this.a, B = this.b;
  const c1 = this.px * (B.vx - A.vx) + this.py * (B.vy - A.vy) + this.s2 * B.w - this.s1 * A.w, c2 = B.w - A.w;
  if (this.k22 > 0) solve2(this.k11, this.k12, this.k22, -c1, -c2); else { _x = this.k11 > 0 ? -c1 / this.k11 : 0; _y = 0; }
  this.ip += _x; this.ia += _y; this.applyPerp(_x, _y);
};
SliderJoint.prototype.solveP = function () {
  const A = this.a, B = this.b, W = this.world, mA = A.im, mB = B.im, iA = A.ii, iB = B.ii;
  this.geom();
  let err = 0;
  if (this.enableLimit) {
    let C = 0;
    if (this.trans < this.lower) C = clamp(this.trans - this.lower + W.slop, -W.maxCorr, 0);
    else if (this.trans > this.upper) C = clamp(this.trans - this.upper - W.slop, 0, W.maxCorr);
    if (C !== 0) {
      const imp = -this.axm * C, Px = imp * this.axisX, Py = imp * this.axisY;
      if (mA > 0) { A.cx -= mA * Px; A.cy -= mA * Py; } if (iA > 0) { A.a -= iA * imp * this.a1; rotUpdate(A); }
      if (mB > 0) { B.cx += mB * Px; B.cy += mB * Py; } if (iB > 0) { B.a += iB * imp * this.a2; rotUpdate(B); }
      err = Math.abs(C); this.geom();
    }
  }
  const c1 = this.px * this.dx + this.py * this.dy, c2 = B.a - A.a - this.ref;
  if (this.k22 > 0) solve2(this.k11, this.k12, this.k22, -c1, -c2); else { _x = this.k11 > 0 ? -c1 / this.k11 : 0; _y = 0; }
  const ip = _x, ia = _y, Px = ip * this.px, Py = ip * this.py;
  if (mA > 0) { A.cx -= mA * Px; A.cy -= mA * Py; } if (iA > 0) { A.a -= iA * (ip * this.s1 + ia); rotUpdate(A); }
  if (mB > 0) { B.cx += mB * Px; B.cy += mB * Py; } if (iB > 0) { B.a += iB * (ip * this.s2 + ia); rotUpdate(B); }
  return err + Math.abs(c1) + Math.abs(c2);
};
SliderJoint.prototype.reaction = function () { return Math.abs(this.ip); };
SliderJoint.prototype.forget = function () { this.ip = 0; this.ia = 0; this.is = 0; this.im2 = 0; this.il = 0; this.iu = 0; };
SliderJoint.prototype.translation = function () { return this.trans; };

// ---------------------------------------------------------------- the world
function ufFind(uf, x) { while (uf[x] !== x) { uf[x] = uf[uf[x]]; x = uf[x]; } return x; }
/* natural log from + - * / only (events are post-processing, but keep everything identical across engines) */
function fln(x) {
  if (!(x > 0)) return -745;
  let k = 0;
  while (x > 1.4142135623730951) { x *= 0.5; k++; }
  while (x < 0.7071067811865476) { x *= 2; k--; }
  const y = (x - 1) / (x + 1), y2 = y * y;
  return k * 0.6931471805599453 + 2 * y * (1 + y2 * (1 / 3 + y2 * (1 / 5 + y2 * (1 / 7 + y2 * (1 / 9 + y2 * (1 / 11 + y2 * (1 / 13)))))));
}
const LOG10E = 0.4342944819032518;

function World(opts) {
  opts = opts || {};
  const g = opts.gravity || [0, 980];
  this.gx = g[0]; this.gy = g[1];
  const gm = Math.sqrt(g[0] * g[0] + g[1] * g[1]);
  this.gm = gm;
  this.unit = opts.unit || (gm > 0 ? gm / 9.8 : 100);
  const U = this.unit;
  this.dt = opts.dt || 1 / 240; this.rate = Math.round(1 / this.dt);
  this.seed = opts.seed != null ? opts.seed : 1; this._rng = makeRng(this.seed);
  this.velIters = opts.velIters || 8; this.posIters = opts.posIters != null ? opts.posIters : 3; this.relaxIters = opts.relaxIters != null ? opts.relaxIters : 1;
  this.contactHz = opts.contactHz || 90; this.contactZeta = opts.contactZeta || 10; this.biasSlop = opts.biasSlop != null ? opts.biasSlop : 0.1; this.staticMul = opts.staticMul || 1;
  this.slop = opts.slop != null ? opts.slop : 0.005 * U;          // allowed overlap
  this.margin = opts.margin != null ? opts.margin : 0.02 * U;     // speculative contact distance and AABB fattening
  this.aabbMargin = this.margin;
  this.maxCorr = opts.maxCorr || 0.1 * U; this.pushSpeed = (opts.pushSpeed || 3) * U; this.angSlop = 0.034906585039886591; this.maxAngCorr = 0.13962634015954636;
  this.velThresh = (opts.velocityThreshold != null ? opts.velocityThreshold : 0.8) * U;
  this.maxSpeed = (opts.maxSpeed || 80) * U; this.maxSpin = opts.maxSpin || 250;
  this.sleepOn = opts.sleep !== false; this.sleepLin = (opts.sleepLin != null ? opts.sleepLin : 0.03) * U; this.sleepAng = opts.sleepAng != null ? opts.sleepAng : 0.05; this.timeToSleep = opts.timeToSleep != null ? opts.timeToSleep : 0.5;
  this.feel = { bounce: 1.0, soft: 0.0 };
  if (opts.feel) { for (const k in opts.feel) this.feel[k] = opts.feel[k]; }
  this.mats = Object.assign({}, MATERIALS, opts.materials || {});
  this.maxSub = opts.maxSubsteps || 8;
  // events
  this.evSpeed = 0.12 * U; this.evMin = opts.eventMin != null ? opts.eventMin : 0.03; this.evGap = 0.06; this.slideV = 0.35 * U; this.slideGap = 0.12; this.rollGap = 0.15; this.maxEvents = 20000;
  this.eventRef = opts.eventRef || null;
  this.bodies = []; this.joints = []; this.ropes = []; this.cloths = [];
  this.contacts = []; this._cmap = new Map(); this._pool = [];
  this._ropeJ = []; this._tmpC = []; this._tmpJ = []; this._nAll = 0; this._nDyn = 0; this.ropeSweeps = opts.ropeSweeps != null ? opts.ropeSweeps : 4; this.ropePosIters = opts.ropePosIters != null ? opts.ropePosIters : 6;
  this._sap = []; this._kin = []; this._sched = []; this._actC = []; this._actJ = []; this._dyn = []; this._allAwake = [];
  this._shapeUid = 1; this._jointUid = 1; this._started = false; this._warm = false; this._prevH = 0; this._jdirty = false;
  this.stepIndex = 0; this.time = 0;
  this.ground = new Body(this, { type: 'static' }, -1); this.ground.finalize();
  this._rec = false; this._raw = []; this._evLast = new Map(); this.events = []; this.warnings = [];
  this._ran = false; this.T = 0;
  this._uf = null; this._minT = null; this._minThick = 0;
}
World.prototype.rand = function () { return this._rng(); };
World.prototype.body = function (def) {
  if (this._started) throw new Error('PHYS2D: add bodies before warmup()/run()');
  def = def || {};
  if (this._shapeUid > 32000) throw new Error('PHYS2D: too many shapes (limit 32000)');
  const b = new Body(this, def, this.bodies.length);
  const sds = def.shapes || ((def.box || def.circle != null || def.poly) ? [{ box: def.box, circle: def.circle, poly: def.poly, offset: def.offset, angle: def.shapeAngle, density: def.density, friction: def.friction, restitution: def.restitution, mat: def.mat }] : []);
  for (let i = 0; i < sds.length; i++) b.shapes.push(makeShape(b, sds[i], this));
  b.finalize();
  if (b.type === KINEMATIC && b.pose) { const p = b.pose(0) || {}; b.x = p.x != null ? p.x : b.x; b.y = p.y != null ? p.y : b.y; b.angle = p.angle != null ? p.angle : b.angle; b.px = b.x; b.py = b.y; b.pa = b.angle; b.syncFromOrigin(); }
  b.refreshShapes();
  this.bodies.push(b);
  for (let i = 0; i < b.shapes.length; i++) this._sap.push(b.shapes[i]);
  if (b.type === KINEMATIC) this._kin.push(b);
  return b;
};
World.prototype.addJoint = function (j) {
  this.joints.push(j);
  if (!j.collide) { j.a.jlist.push(j); if (j.b !== j.a) j.b.jlist.push(j); }
  return j;
};
World.prototype.joint = function (def) {
  if (this._started) throw new Error('PHYS2D: add joints before warmup()/run()');
  const t = def.type;
  if (t === 'rope') return this._rope(def);
  let j;
  if (t === 'distance' || t === 'spring') { if (t === 'spring' && !(def.stiffness > 0) && !(def.hz > 0)) def = Object.assign({ hz: 4 }, def); j = new DistanceJoint(this, def); }
  else if (t === 'pin' || t === 'revolute') j = new RevoluteJoint(this, def);
  else if (t === 'weld') j = new WeldJoint(this, def);
  else if (t === 'mouse' || t === 'target') j = new MouseJoint(this, def);
  else if (t === 'slider' || t === 'prismatic') j = new SliderJoint(this, def);
  else throw new Error('PHYS2D: unknown joint type ' + t);
  return this.addJoint(j);
};
World.prototype.removeJoint = function (j) { j.removed = true; this._jdirty = true; };
/* call fn(world) at the first step whose time is >= t (deterministic scripting: cut a rope, give a shove) */
World.prototype.schedule = function (t, fn) {
  this._sched.push({ t: t, fn: fn });
  this._sched.sort(function (a, b) { return a.t - b.t; }); // stable: equal times keep insertion order
};
/* a wide static floor whose top surface is at y (box with a deep body so nothing tunnels) */
World.prototype.floor = function (y, o) {
  o = o || {};
  const d = o.depth || 200;
  return this.body({ type: 'static', x: o.x || 0, y: y + d, box: [o.halfWidth || 20000, d], mat: o.mat || 'concrete', friction: o.friction, restitution: o.restitution, tag: o.tag || 'floor', category: o.category, mask: o.mask });
};

World.prototype._prepare = function () {
  const n = this.bodies.length;
  this._uf = new Int32Array(n); this._minT = new Float64Array(n);
  let mt = 1e30;
  for (const b of this.bodies) if (!b.internal && b.shapes.length && b.mask !== 0 && b.inr > 0 && b.inr < mt) mt = b.inr;
  this._minThick = mt < 1e30 ? mt : 1e30;
  this._started = true;
};
World.prototype._should = function (ba, bb) {
  if (ba.group !== 0 && ba.group === bb.group) return ba.group > 0;
  if (((ba.mask & bb.category) === 0) || ((bb.mask & ba.category) === 0)) return false;
  const jl = ba.jlist;
  for (let i = 0; i < jl.length; i++) { const j = jl[i]; if (!j.removed && ((j.a === ba && j.b === bb) || (j.a === bb && j.b === ba))) return false; }
  return true;
};
World.prototype._newContact = function (a, b, key) {
  let sa = a, sb = b;
  if (sa.circle && !sb.circle) { sa = b; sb = a; } // polygon first
  const c = this._pool.length ? this._pool.pop() : new Contact();
  c.sa = sa; c.sb = sb; c.A = sa.body; c.B = sb.body; c.key = key;
  c.friction = Math.sqrt(sa.friction * sb.friction); c.rest = sa.restitution > sb.restitution ? sa.restitution : sb.restitution;
  c.rsum = (sa.circle ? sa.r : 0) + (sb.circle ? sb.r : 0);
  c.count = 0; c.nv = 0; c.p0.jn = 0; c.p0.jt = 0; c.p1.jn = 0; c.p1.jt = 0; c.p0.id = -1; c.p1.id = -1; c.slideT = 0; c.rollT = 0;
  c.silent = c.A.silent || c.B.silent; c.stat = c.A.im === 0 || c.B.im === 0;
  this.contacts.push(c); this._cmap.set(key, c);
};
/* broadphase (sort and sweep on x) then narrowphase for every contact that has an awake body */
World.prototype._collide = function () {
  const S = this._sap, n = S.length, cmap = this._cmap;
  for (let i = 1; i < n; i++) { const s = S[i], x = s.minx; let j = i - 1; while (j >= 0 && S[j].minx > x) { S[j + 1] = S[j]; j--; } S[j + 1] = s; }
  for (let i = 0; i < n; i++) {
    const a = S[i], ba = a.body, aact = ba.awake && ba.type !== STATIC, amax = a.maxx, ay0 = a.miny, ay1 = a.maxy;
    for (let j = i + 1; j < n; j++) {
      const b = S[j];
      if (b.minx > amax) break;
      if (b.miny > ay1 || b.maxy < ay0) continue;
      const bb = b.body;
      if (ba === bb) continue;
      if (!aact && !(bb.awake && bb.type !== STATIC)) continue;
      if (ba.type !== DYNAMIC && bb.type !== DYNAMIC) continue;
      const key = a.uid < b.uid ? a.uid * KEYMUL + b.uid : b.uid * KEYMUL + a.uid;
      if (cmap.has(key)) continue;
      if (!this._should(ba, bb)) continue;
      this._newContact(a, b, key);
    }
  }
  const cs = this.contacts, margin = this.margin, ktol = 0.1 * this.slop;
  let w = 0;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i], sa = c.sa, sb = c.sb, A = c.A, B = c.B;
    if (!((A.awake && A.type !== STATIC) || (B.awake && B.type !== STATIC))) { cs[w++] = c; continue; }
    if (sa.minx > sb.maxx || sb.minx > sa.maxx || sa.miny > sb.maxy || sb.miny > sa.maxy) {
      if (c.count > 0) { A.wake(); B.wake(); }
      cmap.delete(c.key); this._pool.push(c); continue;
    }
    const was = c.count > 0, p0 = c.p0, p1 = c.p1;
    const oc = c.count, id0 = p0.id, n0 = p0.jn, t0 = p0.jt, id1 = p1.id, n1 = p1.jn, t1 = p1.jt;
    c.count = collide(c, sa, sb, margin, ktol);
    for (let k = 0; k < c.count; k++) {
      const p = k === 0 ? p0 : p1; p.jn = 0; p.jt = 0;
      if (oc > 0 && p.id === id0) { p.jn = n0; p.jt = t0; } else if (oc > 1 && p.id === id1) { p.jn = n1; p.jt = t1; }
    }
    if ((c.count > 0) !== was) { A.wake(); B.wake(); }
    cs[w++] = c;
  }
  cs.length = w;
};
/* union touching bodies and jointed bodies; any island with an awake member wakes completely */
World.prototype._islands = function () {
  const bodies = this.bodies, nb = bodies.length, uf = this._uf;
  for (let i = 0; i < nb; i++) uf[i] = i;
  const cs = this.contacts;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (c.count === 0 || c.A.type === STATIC || c.B.type === STATIC) continue;
    const ra = ufFind(uf, c.A.id), rb = ufFind(uf, c.B.id);
    if (ra !== rb) uf[ra] = rb;
  }
  const js = this.joints;
  for (let i = 0; i < js.length; i++) {
    const j = js[i];
    if (j.removed || j.a.type === STATIC || j.b.type === STATIC) continue;
    const ra = ufFind(uf, j.a.id), rb = ufFind(uf, j.b.id);
    if (ra !== rb) uf[ra] = rb;
  }
  const mt = this._minT;
  for (let i = 0; i < nb; i++) mt[i] = 0;
  for (let i = 0; i < nb; i++) { const b = bodies[i]; if (b.type !== STATIC && b.awake) mt[ufFind(uf, i)] = 1; }
  const dyn = this._dyn, all = this._allAwake;
  let na = 0, nd = 0;
  for (let i = 0; i < nb; i++) {
    const b = bodies[i];
    if (b.type === STATIC) continue;
    if (!b.awake && mt[ufFind(uf, i)] === 1) { b.awake = true; b.sleepTime = 0; }
    if (b.awake) { all[na++] = b; if (b.type === DYNAMIC) dyn[nd++] = b; }
  }
  this._nAll = na; this._nDyn = nd;
};
World.prototype._sleepPass = function (h) {
  const all = this._allAwake, na = this._nAll, uf = this._uf, mt = this._minT, nb = this.bodies.length;
  if (!this.sleepOn) return;
  const lin2 = this.sleepLin * this.sleepLin, ang2 = this.sleepAng * this.sleepAng;
  for (let i = 0; i < nb; i++) mt[i] = 1e30;
  for (let i = 0; i < na; i++) {
    const b = all[i];
    const moving = b.type === KINEMATIC ? b.moving : (b.vx * b.vx + b.vy * b.vy > lin2 || b.w * b.w > ang2);
    if (!b.allowSleep || moving) b.sleepTime = 0; else b.sleepTime += h;
    const r = ufFind(uf, b.id);
    if (b.sleepTime < mt[r]) mt[r] = b.sleepTime;
  }
  for (let i = 0; i < na; i++) {
    const b = all[i];
    if (mt[ufFind(uf, b.id)] >= this.timeToSleep) { b.awake = false; b.vx = 0; b.vy = 0; b.w = 0; b.sleepTime = 0; }
  }
};

/* Order the constraints so the ones farthest from an anchor (static / kinematic body) are solved first: the load of a stack or a rope
 * then reaches the anchor in one sweep instead of one contact per iteration. Depth = shortest constraint path to an anchor; stable counting sort. */
World.prototype._depthOrder = function (ac, nac, aj, naj) {
  const bodies = this.bodies, nb = bodies.length;
  if (!this._depth || this._depth.length !== nb + 1) { this._depth = new Int32Array(nb + 1); this._cnt = new Int32Array(80); }
  const d = this._depth, INF = 1 << 28, cnt = this._cnt;
  d.fill(INF); d[0] = 0;
  for (let i = 0; i < nb; i++) if (bodies[i].type !== DYNAMIC) d[i + 1] = 0;
  let changed = true, passes = 0;
  while (changed && passes < 70) {
    changed = false; passes++;
    for (let i = 0; i < nac; i++) {
      const c = ac[i], ia = c.A.id + 1, ib = c.B.id + 1, da = d[ia], db = d[ib];
      if (da + 1 < db) { d[ib] = da + 1; changed = true; } else if (db + 1 < da) { d[ia] = db + 1; changed = true; }
    }
    for (let i = 0; i < naj; i++) {
      const j = aj[i], ia = j.a.id + 1, ib = j.b.id + 1, da = d[ia], db = d[ib];
      if (da + 1 < db) { d[ib] = da + 1; changed = true; } else if (db + 1 < da) { d[ia] = db + 1; changed = true; }
    }
  }
  const top = 76;
  // contacts
  cnt.fill(0);
  const tmpC = this._tmpC, tmpJ = this._tmpJ;
  for (let i = 0; i < nac; i++) { const c = ac[i], k = d[c.A.id + 1] > d[c.B.id + 1] ? d[c.A.id + 1] : d[c.B.id + 1]; c.ok = k > top ? top : k; cnt[c.ok]++; }
  let acc = 0; for (let k = top; k >= 0; k--) { const n = cnt[k]; cnt[k] = acc; acc += n; } // descending depth
  for (let i = 0; i < nac; i++) tmpC[cnt[ac[i].ok]++] = ac[i];
  for (let i = 0; i < nac; i++) ac[i] = tmpC[i];
  // joints
  cnt.fill(0);
  for (let i = 0; i < naj; i++) { const j = aj[i], k = d[j.a.id + 1] > d[j.b.id + 1] ? d[j.a.id + 1] : d[j.b.id + 1]; j.ok = k > top ? top : k; cnt[j.ok]++; }
  acc = 0; for (let k = top; k >= 0; k--) { const n = cnt[k]; cnt[k] = acc; acc += n; }
  for (let i = 0; i < naj; i++) tmpJ[cnt[aj[i].ok]++] = aj[i];
  for (let i = 0; i < naj; i++) aj[i] = tmpJ[i];
};
/* one solver step of length h starting at simulation time t */
World.prototype._stepH = function (h, t) {
  // warm-start impulses are rescaled only when the step gets shorter (otherwise the carried impulse is too big and kicks the pile);
  // when it gets longer they are kept as they are (too small is safe: the iterations rebuild them; an impact impulse times 8 explodes)
  const invH = 1 / h, ratio = this._prevH > 0 && h < this._prevH ? h / this._prevH : 1;
  this._prevH = h;
  if (!this._warm) {
    const sc = this._sched;
    while (sc.length && sc[0].t <= t + 1e-9) sc.shift().fn(this);
  }
  if (this._jdirty) { // drop removed joints
    const js = this.joints; let w = 0;
    for (let i = 0; i < js.length; i++) { if (js[i].removed) { js[i].a.wake(); js[i].b.wake(); } else js[w++] = js[i]; }
    js.length = w; this._jdirty = false;
  }
  // kinematic bodies: scripted target for the end of the step
  const tp = this._warm ? 0 : t + h;
  for (let i = 0; i < this._kin.length; i++) {
    const k = this._kin[i];
    let tx, ty, ta;
    if (k.pose) { const p = k.pose(tp) || {}; tx = p.x != null ? p.x : k.x; ty = p.y != null ? p.y : k.y; ta = p.angle != null ? p.angle : k.angle; }
    else { tx = k.x + k.vx * h; ty = k.y + k.vy * h; ta = k.angle + k.w * h; }
    k.px = tx; k.py = ty; k.pa = ta;
    k.vx = (tx - k.x) * invH; k.vy = (ty - k.y) * invH; k.w = (ta - k.angle) * invH;
    k.moving = (tx !== k.x || ty !== k.y || ta !== k.angle);
    if (k.moving) { k.awake = true; k.sleepTime = 0; }
  }
  this._collide();
  this._islands();
  const dyn = this._dyn, all = this._allAwake, nDyn = this._nDyn, nAll = this._nAll;
  if (nAll === 0) return;
  // integrate velocities
  const gx = this.gx * h, gy = this.gy * h;
  for (let i = 0; i < nDyn; i++) {
    const b = dyn[i];
    b.vx += gx * b.gscale; b.vy += gy * b.gscale;
    if (b.linDamp > 0) { const d = 1 / (1 + h * b.linDamp); b.vx *= d; b.vy *= d; }
    if (b.angDamp > 0) b.w *= 1 / (1 + h * b.angDamp);
  }
  const feel = this.feel, soft = feel.soft < 0 ? 0 : (feel.soft > 1 ? 1 : feel.soft);
  const slop = this.slop * (1 + 3 * soft);
  // active constraints
  const ac = this._actC, aj = this._actJ, cs = this.contacts, js = this.joints;
  let nac = 0, naj = 0;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (c.count > 0 && ((c.A.awake && c.A.type !== STATIC) || (c.B.awake && c.B.type !== STATIC))) ac[nac++] = c;
  }
  for (let i = 0; i < js.length; i++) {
    const j = js[i];
    if ((j.a.awake && j.a.type !== STATIC) || (j.b.awake && j.b.type !== STATIC)) aj[naj++] = j;
  }
  this._depthOrder(ac, nac, aj, naj);
  // soft contact coefficients for this step
  const hz = this.contactHz * (1 - 0.8 * soft), om = TWO_PI * hz, a1 = 2 * this.contactZeta + h * om, a2 = h * om * a1, a3 = 1 / (1 + a2);
  const om2 = om * this.staticMul, b1 = 2 * this.contactZeta + h * om2, b2 = h * om2 * b1, b3 = 1 / (1 + b2);
  SB = om / a1; SM = a2 * a3; SI = a3; SG = 1 / a2; SB2 = om2 / b1; SM2 = b2 * b3; SI2 = b3; SG2 = 1 / b2;
  SLP = this.biasSlop * slop; PUSH = this.pushSpeed; IH = invH;
  for (let i = 0; i < naj; i++) aj[i].init(h, ratio);
  for (let i = 0; i < nac; i++) initContact(ac[i], ratio);
  if (this._dbg) this._dbg('init', 0, ac, nac, aj, naj);
  const ajr = this._ropeJ;
  let nr = 0;
  for (let i = 0; i < naj; i++) if (aj[i].sweep) ajr[nr++] = aj[i];
  const sweeps = this.ropeSweeps;
  for (let it = 0; it < this.velIters; it++) {
    FLIP = it & 1;
    for (let k = 0; k < sweeps && nr > 0; k++) for (let i = 0; i < nr; i++) ajr[i].solveV(invH); // ropes converge slowly under heavy loads: extra sweeps (cheap)
    for (let i = 0; i < naj; i++) if (!aj[i].sweep) aj[i].solveV(invH);
    if (this._dbg) this._dbg('jnt', it, ac, nac, aj, naj);
    for (let i = 0; i < nac; i++) solveContactV(ac[i], true);
    if (this._dbg) this._dbg('vel', it, ac, nac, aj, naj);
  }
  // integrate positions
  const vmax2 = this.maxSpeed * this.maxSpeed, wmax = this.maxSpin;
  let runaway = false;
  for (let i = 0; i < nDyn; i++) {
    const b = dyn[i];
    const v2 = b.vx * b.vx + b.vy * b.vy;
    if (v2 > vmax2) {
      if (!(v2 < vmax2 * 1e4) || !(b.w * b.w < wmax * wmax * 1e4)) { b.vx = 0; b.vy = 0; b.w = 0; runaway = true; b.wild = true; } // NaN or absurd: stop it and forget its impulses
      else { const s = this.maxSpeed / Math.sqrt(v2); b.vx *= s; b.vy *= s; }
    }
    if (b.w > wmax) b.w = wmax; else if (b.w < -wmax) b.w = -wmax; else if (!(b.w === b.w)) { b.w = 0; b.wild = true; runaway = true; }
    b.cx += h * b.vx; b.cy += h * b.vy; b.a += h * b.w;
  }
  if (runaway) this._forget(ac, nac, aj, naj);
  for (let i = 0; i < this._kin.length; i++) { const k = this._kin[i]; k.cx = k.px; k.cy = k.py; k.a = k.pa; rotUpdate(k); }
  for (let i = 0; i < nDyn; i++) if (dyn[i].w !== 0) rotUpdate(dyn[i]);
  // relax: solve again without bias so the push-out velocity does not stay in the bodies
  for (let it = 0; it < this.relaxIters; it++) {
    FLIP = it & 1;
    for (let i = 0; i < naj; i++) aj[i].solveV(invH);
    for (let i = 0; i < nac; i++) solveContactV(ac[i], false);
    if (this._dbg) this._dbg('relax', it, ac, nac, aj, naj);
  }
  const bounce = feel.bounce;
  for (let i = 0; i < nac; i++) applyRestitution(ac[i], this.velThresh, bounce);
  if (this._dbg) this._dbg('restitution', 0, ac, nac, aj, naj);
  if (this._rec) this._events(ac, nac, h, t);
  // joints: position correction (NGS); ropes get extra, tighter sweeps because a heavy load barely moves while the light nodes do
  for (let it = 0; it < this.posIters; it++) {
    let ok = true;
    for (let i = 0; i < naj; i++) if (aj[i].solveP() > slop) ok = false;
    if (ok) break;
  }
  for (let it = 0; it < this.ropePosIters && nr > 0; it++) {
    let ok = true;
    for (let i = 0; i < nr; i++) if (ajr[i].solveP() > 0.1 * slop) ok = false;
    if (ok) break;
  }
  // finalize transforms
  const m = this.aabbMargin;
  for (let i = 0; i < nAll; i++) {
    const b = all[i];
    if (b.type === KINEMATIC) { sincos(b.a); b.sn = _sn; b.cs = _cs; b.x = b.cx; b.y = b.cy; b.angle = b.a; }
    else b.syncToOrigin();
    const sh = b.shapes;
    for (let k = 0; k < sh.length; k++) sh[k].update(b.x, b.y, b.sn, b.cs, m);
  }
  this._sleepPass(h);
  // breakable joints
  for (let i = 0; i < naj; i++) {
    const j = aj[i];
    if (j.breakImpulse > 0 && j.reaction() > j.breakImpulse && !j.broken) this._breakJoint(j, t);
  }
};
/* zero the accumulated impulses of every constraint that touches a runaway body */
World.prototype._forget = function (ac, nac, aj, naj) {
  for (let i = 0; i < nac; i++) {
    const c = ac[i];
    if (c.A.wild || c.B.wild) { c.p0.jn = 0; c.p0.jt = 0; c.p1.jn = 0; c.p1.jt = 0; }
  }
  for (let i = 0; i < naj; i++) { const j = aj[i]; if (j.a.wild || j.b.wild) j.forget(); }
  for (let i = 0; i < this._nDyn; i++) {
    const b = this._dyn[i];
    if (b.wild) { b.wild = false; if (!(b.cx === b.cx && b.cy === b.cy && b.a === b.a)) { b.cx = b.px; b.cy = b.py; b.a = b.pa; } this.warnings.push('runaway body ' + b.id + ' (' + b.tag + ') was stopped at t=' + (this.stepIndex * this.dt).toFixed(3)); }
  }
};
World.prototype._breakJoint = function (j, t) {
  j.broken = true; j.removed = true; this._jdirty = true;
  if (j.rope) j.rope.cutAt(j);
  if (this._rec && !j.silent) {
    const A = j.a, B = j.b, x = B.cx + j.rbx, y = B.cy + j.rby;
    this._push('break', A, B, A.shapes[0], B.shapes[0], x, y, 0.8, 0, t, 3);
  }
};
World.prototype._substeps = function () {
  const dyn = this._dyn, dt = this.dt, mt = this._minThick;
  if (mt >= 1e29) return 1;
  let mv = 0;
  for (let i = 0; i < dyn.length; i++) {
    const b = dyn[i]; if (b.internal) continue;
    const m = (Math.abs(b.vx) + Math.abs(b.vy)) * dt + Math.abs(b.w) * dt * b.radius;
    if (m > mv) mv = m;
  }
  mv += this.gm * dt * dt;
  if (mv <= mt) return 1;
  const n = Math.ceil(mv / mt);
  return n > this.maxSub ? this.maxSub : n;
};
World.prototype.step = function () {
  if (!this._started) this._prepare();
  const n = this._substeps(), h = this.dt / n, t0 = this.stepIndex * this.dt;
  for (let i = 0; i < n; i++) this._stepH(h, t0 + i * h);
  for (let i = 0; i < this.cloths.length; i++) this.cloths[i].step(this.dt, t0, this._warm);
  this.stepIndex++; this.time = this.stepIndex * this.dt;
};

// ---------------------------------------------------------------- events
World.prototype._mag = function (E) {
  const r = (fln(E / this._eRef) * LOG10E + 2.5) / 5;
  return r < 0 ? 0 : (r > 1 ? 1 : r);
};
World.prototype._push = function (kind, A, B, sa, sb, x, y, mag, speed, t, kidx) {
  const lo = A.id < B.id ? A.id : B.id, hi = A.id < B.id ? B.id : A.id;
  const key = ((lo + 1) * 65536 + (hi + 1)) * 4 + kidx;
  const last = this._evLast.get(key);
  if (last !== undefined && t - last.t < this.evGap) { // thinning: one per pair and kind per evGap, keep the louder
    if (mag > last.mag) { last.mag = mag; last.speed = speed; last.x = x; last.y = y; last.t = t; }
    return;
  }
  if (this._raw.length >= this.maxEvents) return;
  const e = { t: t, kind: kind, a: A.id, b: B.id, tagA: A.tag, tagB: B.tag, matA: sa ? sa.mat : A.mat, matB: sb ? sb.mat : B.mat, x: x, y: y, mag: mag, speed: speed };
  this._raw.push(e); this._evLast.set(key, e);
};
World.prototype._events = function (ac, nac, h, t) {
  const invH = 1 / h, te = t + h, U = this.unit;
  for (let i = 0; i < nac; i++) {
    const c = ac[i];
    if (c.silent) continue;
    let hp = null, hr = 0;
    for (let k = 0; k < c.nv; k++) { const p = k === 0 ? c.p0 : c.p1; if (p.jn > 0 && p.rel < hr) { hr = p.rel; hp = p; } }
    if (hp !== null && -hr > this.evSpeed) { // an impact: energy of the closing speed on the effective mass at the point
      const mag = this._mag(0.5 * hp.nm * hr * hr);
      if (mag >= this.evMin) this._push('hit', c.A, c.B, c.sa, c.sb, hp.x, hp.y, mag, -hr, te, 0);
    }
    const p = (c.count > 1 && c.p1.jn > c.p0.jn) ? c.p1 : c.p0;
    if (p.jn > 0) {
      const A = c.A, B = c.B;
      const dvx = B.vx - B.w * p.rby - A.vx + A.w * p.ray, dvy = B.vy + B.w * p.rbx - A.vy - A.w * p.rax;
      const vt = Math.abs(dvx * c.ny - dvy * c.nx);
      if (vt > this.slideV) {
        c.slideT += h;
        if (c.slideT >= this.slideGap) {
          c.slideT = 0;
          const F = p.jn * invH, mr = this._mRef * this.gm;
          let m = 0.12 + 0.5 * vt / (2 * U) + 0.3 * (mr > 0 ? F / (2 * mr) : 0); if (m > 0.85) m = 0.85;
          if (m >= this.evMin) this._push('slide', A, B, c.sa, c.sb, p.x, p.y, m, vt, te, 1);
        }
      } else c.slideT = 0;
      const circ = c.sa.circle ? c.sa : (c.sb.circle ? c.sb : null);
      if (circ !== null) {
        const cb = circ.body, sp = Math.sqrt(cb.vx * cb.vx + cb.vy * cb.vy);
        if (sp > 0.4 * U && vt < 0.3 * sp) {
          c.rollT += h;
          if (c.rollT >= this.rollGap) { c.rollT = 0; let m = 0.1 + 0.5 * sp / (2 * U); if (m > 0.7) m = 0.7; this._push('roll', A, B, c.sa, c.sb, p.x, p.y, m, sp, te, 2); }
        } else c.rollT = 0;
      }
    } else { c.slideT = 0; c.rollT = 0; }
  }
};
World.prototype._prepRun = function () {
  const m = [];
  for (const b of this.bodies) if (b.type === DYNAMIC && !b.internal && !b.silent) m.push(b.mass);
  m.sort(function (a, b) { return a - b; });
  this._mRef = this.eventRef && this.eventRef.mass ? this.eventRef.mass : (m.length ? m[m.length >> 1] : 1);
  const vref = this.eventRef && this.eventRef.speed ? this.eventRef.speed : Math.sqrt(2 * this.gm * this.unit);
  this._eRef = 0.5 * this._mRef * vref * vref;
  if (!(this._eRef > 0)) this._eRef = 1;
};
World.prototype._finishEvents = function () {
  const ev = this._raw.filter(function (e) { return e.mag > 0; });
  ev.sort(function (a, b) { return a.t - b.t || a.a - b.a || a.b - b.b; });
  this.events = ev;
};

// ---------------------------------------------------------------- warmup, run, sampling
/* settle the scene before t = 0: kinematic bodies are held at pose(0), no events, nothing recorded */
World.prototype.warmup = function (seconds) {
  if (this._ran) throw new Error('PHYS2D: warmup() must come before run()');
  if (!this._started) this._prepare();
  this._warm = true;
  const n = Math.round(seconds * this.rate);
  for (let i = 0; i < n; i++) this.step();
  this._warm = false; this.stepIndex = 0; this.time = 0;
  return this;
};
World.prototype._record = function (si) {
  const bs = this.bodies, buf = this.buf, ns6 = this.nslot * 6;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    if (b.slot < 0) continue;
    const o = si * ns6 + b.slot * 6;
    let x = b.x, y = b.y, a = b.angle;
    if (!(x === x && y === y && a === a) || x > 1e7 || x < -1e7 || y > 1e7 || y < -1e7) { // never let a NaN reach a renderer: freeze at the last good sample
      this.warnings.push('body ' + b.id + ' (' + b.tag + ') left the finite world at sample ' + si);
      const po = (si > 0 ? si - 1 : 0) * ns6 + b.slot * 6;
      x = si > 0 ? buf[po] : 0; y = si > 0 ? buf[po + 1] : 0; a = si > 0 ? buf[po + 2] : 0;
      b.x = x; b.y = y; b.angle = a; b.syncFromOrigin(); b.vx = 0; b.vy = 0; b.w = 0; b.awake = false;
    }
    buf[o] = x; buf[o + 1] = y; buf[o + 2] = a;
    buf[o + 3] = b.vx - b.w * (b.y - b.cy); buf[o + 4] = b.vy + b.w * (b.x - b.cx); buf[o + 5] = b.awake ? 1 : 0;
  }
  for (let i = 0; i < this.cloths.length; i++) this.cloths[i].record(si);
};
/* simulate 0..T once and store one transform per body per sample (Float32Array). sampleHz should divide the step rate (default 120). */
World.prototype.run = function (T, opts) {
  opts = opts || {};
  if (this._ran) { if (T <= this.T + 1e-9) return this; throw new Error('PHYS2D: this world already ran for ' + this.T + ' s; build a new world to run longer'); }
  if (!this._started) this._prepare();
  const hz = opts.sampleHz || 120;
  this.sps = Math.max(1, Math.round(this.rate / hz)); this.sampleDt = this.sps * this.dt; this.sampleHz = 1 / this.sampleDt;
  const ns = Math.floor(T / this.sampleDt + 1e-9) + 1;
  this.ns = ns; this.T = (ns - 1) * this.sampleDt;
  let nslot = 0;
  for (const b of this.bodies) b.slot = b.type === STATIC ? -1 : nslot++;
  this.nslot = nslot; this.buf = new Float32Array(ns * nslot * 6);
  for (let i = 0; i < this.cloths.length; i++) this.cloths[i].alloc(ns);
  this._prepRun(); this._rec = true; this._ran = true;
  this._record(0);
  for (let i = 1; i < ns; i++) { for (let k = 0; k < this.sps; k++) this.step(); this._record(i); }
  this._rec = false;
  this._finishEvents();
  return this;
};
World.prototype.makeState = function () {
  const st = { t: 0, bodies: [], by: [], ropes: [], cloths: [] };
  for (const b of this.bodies) {
    if (b.internal) { st.by.push(undefined); continue; }
    const e = { id: b.id, x: b.x, y: b.y, angle: b.angle, vx: 0, vy: 0, awake: b.type !== STATIC && b.awake };
    st.bodies.push(e); st.by.push(e);
  }
  for (const r of this.ropes) st.ropes.push({ id: r.id, n: r.nodes.length, pts: new Float32Array(2 * r.nodes.length) });
  for (const c of this.cloths) st.cloths.push({ id: c.id, cols: c.cols, rows: c.rows, pts: new Float32Array(3 * c.cols * c.rows), roll: { y: 0, r: 0, done: true } });
  return st;
};
/* the state at time t (clamped to 0..T), interpolated; a pure function of t. The returned object is reused unless you pass `out` (from makeState()). */
World.prototype.at = function (t, out) {
  if (!this._ran) throw new Error('PHYS2D: call run(T) before at(t)');
  const st = out || (this._st || (this._st = this.makeState()));
  let k = t / this.sampleDt; const maxK = this.ns - 1;
  if (!(k > 0)) k = 0; else if (k > maxK) k = maxK;
  let i0 = Math.floor(k); if (i0 >= maxK) i0 = maxK > 0 ? maxK - 1 : 0;
  const f = maxK > 0 ? k - i0 : 0, i1 = maxK > 0 ? i0 + 1 : 0, g = 1 - f;
  st.t = t;
  const buf = this.buf, ns6 = this.nslot * 6, o0 = i0 * ns6, o1 = i1 * ns6, bs = this.bodies;
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i], e = st.by[i];
    if (b.internal || e === undefined) continue;
    if (b.slot < 0) { e.x = b.x; e.y = b.y; e.angle = b.angle; e.vx = 0; e.vy = 0; e.awake = false; continue; }
    const s = b.slot * 6, p = o0 + s, q = o1 + s;
    e.x = buf[p] * g + buf[q] * f; e.y = buf[p + 1] * g + buf[q + 1] * f; e.angle = buf[p + 2] * g + buf[q + 2] * f;
    e.vx = buf[p + 3] * g + buf[q + 3] * f; e.vy = buf[p + 4] * g + buf[q + 4] * f; e.awake = (buf[p + 5] + buf[q + 5]) > 0;
  }
  for (let r = 0; r < this.ropes.length; r++) {
    const nodes = this.ropes[r].nodes, pts = st.ropes[r].pts;
    for (let i = 0; i < nodes.length; i++) { const s = nodes[i].slot * 6; pts[2 * i] = buf[o0 + s] * g + buf[o1 + s] * f; pts[2 * i + 1] = buf[o0 + s + 1] * g + buf[o1 + s + 1] * f; }
  }
  for (let c = 0; c < this.cloths.length; c++) { const cl = this.cloths[c]; cl.sample(i0, i1, f, st.cloths[c].pts); if (cl.unroll) cl.rollState(t, st.cloths[c].roll); }
  return st;
};
/* one body's pose at time t: { x, y, angle, vx, vy, awake } (a fresh object unless `out` is given) */
World.prototype.pose = function (id, t, out) {
  const b = typeof id === 'object' ? id : this.bodies[id], e = out || { x: 0, y: 0, angle: 0, vx: 0, vy: 0, awake: false };
  if (b.slot < 0) { e.x = b.x; e.y = b.y; e.angle = b.angle; e.vx = 0; e.vy = 0; e.awake = false; return e; }
  let k = t / this.sampleDt; const maxK = this.ns - 1;
  if (!(k > 0)) k = 0; else if (k > maxK) k = maxK;
  let i0 = Math.floor(k); if (i0 >= maxK) i0 = maxK > 0 ? maxK - 1 : 0;
  const f = maxK > 0 ? k - i0 : 0, i1 = maxK > 0 ? i0 + 1 : 0, g = 1 - f, ns6 = this.nslot * 6, buf = this.buf;
  const p = i0 * ns6 + b.slot * 6, q = i1 * ns6 + b.slot * 6;
  e.x = buf[p] * g + buf[q] * f; e.y = buf[p + 1] * g + buf[q + 1] * f; e.angle = buf[p + 2] * g + buf[q + 2] * f;
  e.vx = buf[p + 3] * g + buf[q + 3] * f; e.vy = buf[p + 4] * g + buf[q + 4] * f; e.awake = (buf[p + 5] + buf[q + 5]) > 0;
  return e;
};

// ---------------------------------------------------------------- ropes
/* A rope is N+1 particle bodies joined by one-sided distance joints (pull only), a weak bending spring between every second particle,
 * and pins to the bodies at its ends. Either end body may be omitted (a free end). */
function Rope(W, id) { this.id = id; this.nodes = []; this.segs = []; this.bends = []; this.pinA = null; this.pinB = null; this.world = W; this.segLen = 0; }
Rope.prototype.cut = function (i) { if (this.segs[i]) this.world.removeJoint(this.segs[i]); return this; };   // cut segment i
Rope.prototype.releaseA = function () { if (this.pinA) this.world.removeJoint(this.pinA); return this; };      // let go of the body at end A
Rope.prototype.releaseB = function () { if (this.pinB) this.world.removeJoint(this.pinB); return this; };
Rope.prototype.cutAt = function () {};
World.prototype._rope = function (def) {
  const A = def.a || null, B = def.b || null, N = Math.max(2, def.segments || 20);
  const ax = def.pointA ? def.pointA[0] : (A ? A.x + A.cs * (def.anchorA ? def.anchorA[0] : 0) - A.sn * (def.anchorA ? def.anchorA[1] : 0) : 0);
  const ay = def.pointA ? def.pointA[1] : (A ? A.y + A.sn * (def.anchorA ? def.anchorA[0] : 0) + A.cs * (def.anchorA ? def.anchorA[1] : 0) : 0);
  const bx = def.pointB ? def.pointB[0] : (B ? B.x + B.cs * (def.anchorB ? def.anchorB[0] : 0) - B.sn * (def.anchorB ? def.anchorB[1] : 0) : ax);
  const by = def.pointB ? def.pointB[1] : (B ? B.y + B.sn * (def.anchorB ? def.anchorB[0] : 0) + B.cs * (def.anchorB ? def.anchorB[1] : 0) : ay + (def.length || 100));
  const cx = bx - ax, cy = by - ay, D = Math.sqrt(cx * cx + cy * cy);
  const L = Math.max(def.length != null ? def.length : D, D), segLen = L / N;
  const sag = L > D * 1.0001 ? Math.sqrt(3 * D * (L - D) / 8) : 0; // parabolic sag so the first frame is not a straight line
  const gl = this.gm > 0 ? this.gm : 1, gdx = this.gx / gl, gdy = this.gy / gl;
  // total mass: default 10 % of the heavier dynamic end body, shared among the nodes
  let load = 0; if (A && A.type === DYNAMIC) load = A.mass; if (B && B.type === DYNAMIC && B.mass > load) load = B.mass;
  const total = def.mass != null ? def.mass : (load > 0 ? 0.1 * load : 0.05 * L * this.unit * 0.01);
  const nm = total / (N + 1), r = def.radius != null ? def.radius : 1.5, collide = !!def.collide;
  const rope = new Rope(this, this.ropes.length);
  const mat = def.mat || 'metal', tag = def.tag || 'cable';
  for (let i = 0; i <= N; i++) {
    const t = i / N, s = 4 * sag * t * (1 - t);
    rope.nodes.push(this.body({ type: 'dynamic', x: ax + cx * t + gdx * s, y: ay + cy * t + gdy * s, mass: nm, inertia: 1, fixedRotation: true, circle: collide ? r : undefined, density: 1, mat: mat, tag: tag,
      internal: true, silent: true, mask: collide ? 0xFFFF : 0, category: 0x4000, linearDamping: def.damping != null ? def.damping : 0.05, allowSleep: def.sleep !== false }));
    if (!collide) { rope.nodes[i].shapes.length = 0; rope.nodes[i].radius = 0; }
  }
  // pins first (so the solver sees the heavy anchors early), then segments, then bends
  if (A) { rope.pinA = this.addJoint(new RevoluteJoint(this, { a: A, b: rope.nodes[0], anchor: [ax, ay] })); rope.pinA.silent = true; rope.pinA.rope = rope; rope.pinA.sweep = true; }
  for (let i = 0; i < N; i++) {
    const j = new DistanceJoint(this, { a: rope.nodes[i], b: rope.nodes[i + 1], length: segLen, mode: 'max', breakImpulse: def.breakImpulse });
    j.silent = true; j.rope = rope; j.sweep = true; rope.segs.push(this.addJoint(j));
  }
  if (B) { rope.pinB = this.addJoint(new RevoluteJoint(this, { a: B, b: rope.nodes[N], anchor: [bx, by] })); rope.pinB.silent = true; rope.pinB.rope = rope; rope.pinB.sweep = true; }
  const bend = def.bend != null ? def.bend : 3;
  if (bend > 0) for (let i = 0; i + 2 <= N; i++) {
    const j = new DistanceJoint(this, { a: rope.nodes[i], b: rope.nodes[i + 2], length: 2 * segLen, hz: bend, ratio: 0.6 });
    j.silent = true; j.rope = rope; rope.bends.push(this.addJoint(j));
  }
  rope.segLen = segLen; rope.length = L; rope.N = N;
  this.ropes.push(rope);
  return rope;
};

// ---------------------------------------------------------------- cloth (3D verlet grid, pinned along the top, with wind)
/* x, y are the screen plane, z points at the viewer: wind along z billows the banner (foreshortening + shading in a front view). */
function Cloth(W, def, id) {
  this.id = id; this.world = W;
  const cols = this.cols = Math.max(2, def.cols | 0 || 8), rows = this.rows = Math.max(2, def.rows | 0 || 12), n = cols * rows;
  this.n = n; this.width = def.width || 200; this.height = def.height || 300;
  const x0 = def.x || 0, y0 = def.y || 0;
  this.dxr = this.width / (cols - 1); this.dyr = this.height / (rows - 1); this.x0 = x0; this.y0 = y0;
  this.px = new Float64Array(n); this.py = new Float64Array(n); this.pz = new Float64Array(n);
  this.qx = new Float64Array(n); this.qy = new Float64Array(n); this.qz = new Float64Array(n);
  this.ax = new Float64Array(n); this.ay = new Float64Array(n); this.az = new Float64Array(n);
  this.iw = new Float64Array(n); this.rowOf = new Int32Array(n); this.wv = [0, 0, 0];
  this.hem = def.hem != null ? def.hem : 2.5; // the bottom row is heavier (a hem weight) so the banner hangs straight
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i; this.px[k] = x0 + i * this.dxr; this.py[k] = y0 + j * this.dyr;
    this.qx[k] = this.px[k]; this.qy[k] = this.py[k]; this.iw[k] = j === rows - 1 ? 1 / this.hem : 1; this.rowOf[k] = j;
  }
  // pins: columns of the top row (default all), optionally attached to a body (local offsets)
  this.pinCols = def.pins || (function () { const a = []; for (let i = 0; i < cols; i++) a.push(i); return a; })();
  this.pinBody = def.body || null; this.pinLocal = [];
  for (let m = 0; m < this.pinCols.length; m++) {
    const k = this.pinCols[m]; this.iw[k] = 0;
    if (this.pinBody) { const b = this.pinBody, dx = this.px[k] - b.x, dy = this.py[k] - b.y; this.pinLocal.push(b.cs * dx + b.sn * dy, -b.sn * dx + b.cs * dy); }
  }
  this.unroll = null; this.released = rows;
  if (def.unroll) { // the banner starts as a roll under the top edge; the roll falls (a yo-yo) and releases one row at a time
    const u = this.unroll = { t0: def.unroll.t0 || 0, dur: def.unroll.dur || 2, r0: def.unroll.r0 != null ? def.unroll.r0 : 14, snap: def.unroll.snap != null ? def.unroll.snap : 0.35 };
    this.released = 1;
    for (let j = 1; j < rows; j++) for (let i = 0; i < cols; i++) this.iw[j * cols + i] = 0;
    u.A = 3 - u.snap; u.B = u.snap - 2; // E(tau) = A tau^2 + B tau^3 : E(1) = 1, E'(1) = snap
  }
  this.iters = def.iterations || 8; this.maxStretch = def.maxStretch != null ? def.maxStretch : 0.02; this.drag = def.drag != null ? def.drag : 0.6;
  this.gscale = def.gravityScale != null ? def.gravityScale : 1; this.floorY = def.floorY != null ? def.floorY : 1e30;
  const wd = def.wind || {};
  this.wind = [wd.x || 0, wd.y || 0, wd.z || 0]; this.gust = wd.gust || 0; this.gustHz = wd.hz || 0.7; this.gustK = wd.k != null ? wd.k : 0.012; this.windGain = wd.gain != null ? wd.gain : 2.2; this.windPhase = wd.phase || 0;
  this.windOn = this.gust !== 0 || this.wind[0] !== 0 || this.wind[1] !== 0 || this.wind[2] !== 0;
  // constraints: vertical first (top to bottom), then horizontal, shear, bend
  const C = [], id2 = function (i, j) { return j * cols + i; };
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols; i++) C.push([id2(i, j), id2(i, j + 1), this.dyr, 1]);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols - 1; i++) C.push([id2(i, j), id2(i + 1, j), this.dxr, 1]);
  const dg = Math.sqrt(this.dxr * this.dxr + this.dyr * this.dyr);
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { C.push([id2(i, j), id2(i + 1, j + 1), dg, 0.6]); C.push([id2(i + 1, j), id2(i, j + 1), dg, 0.6]); }
  const bs = def.bend != null ? def.bend : 0.25;
  if (bs > 0) {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols - 2; i++) C.push([id2(i, j), id2(i + 2, j), 2 * this.dxr, bs]);
    for (let j = 0; j < rows - 2; j++) for (let i = 0; i < cols; i++) C.push([id2(i, j), id2(i, j + 2), 2 * this.dyr, bs]);
  }
  const nc = this.nc = C.length; this.ca = new Int32Array(nc); this.cb = new Int32Array(nc); this.cr = new Float64Array(nc); this.ck = new Float64Array(nc);
  for (let m = 0; m < nc; m++) { this.ca[m] = C[m][0]; this.cb[m] = C[m][1]; this.cr[m] = C[m][2]; this.ck[m] = C[m][3]; }
  this.buf = null; this.ns = 0;
  // triangles (a b c) and (b d c) of every quad, for the wind
  this.tri = new Int32Array((rows - 1) * (cols - 1) * 6); let m = 0;
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
    const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
    this.tri[m++] = a; this.tri[m++] = b; this.tri[m++] = c; this.tri[m++] = b; this.tri[m++] = d; this.tri[m++] = c;
  }
}
/* roll centre offset below the top edge at time t */
Cloth.prototype.rollY = function (t) {
  const u = this.unroll;
  let tau = (t - u.t0) / u.dur; tau = tau < 0 ? 0 : (tau > 1 ? 1 : tau);
  return u.r0 + (this.height - u.r0) * (u.A * tau * tau + u.B * tau * tau * tau);
};
/* roll state at time t for the renderer: { y (centre, world), r (radius), done } */
Cloth.prototype.rollState = function (t, out) {
  out = out || {};
  if (!this.unroll) { out.y = this.y0; out.r = 0; out.done = true; return out; }
  const u = this.unroll, yc = this.rollY(t), H = this.height;
  const rem = (H - (yc - u.r0)) / H;
  out.y = this.y0 + yc; out.r = u.r0 * Math.sqrt(rem < 0 ? 0 : rem) * (rem > 0.04 ? 1 : (rem < 0 ? 0 : rem / 0.04));
  out.done = t >= u.t0 + u.dur; return out;
};
Cloth.prototype.windAt = function (x, y, t, o) {
  let wx = this.wind[0], wy = this.wind[1], wz = this.wind[2];
  if (this.gust !== 0) {
    const f = TWO_PI * this.gustHz, ph = this.windPhase;
    sincos(f * t - this.gustK * x + ph); const s1 = _sn;
    sincos(f * 1.73 * t - this.gustK * 2.1 * x + 1.3 + ph + y * 0.004); const s2 = _sn;
    sincos(f * 0.37 * t + 0.6 + ph); const s3 = _sn;
    const m = this.gust * (0.65 + 0.35 * s3);
    wz += m * (0.7 * s1 + 0.3 * s2); wx += m * 0.35 * s2; wy += m * 0.05 * s1;
  }
  o[0] = wx; o[1] = wy; o[2] = wz;
};
Cloth.prototype.step = function (h, t, warm) {
  const W = this.world, cols = this.cols, rows = this.rows, n = this.n, px = this.px, py = this.py, pz = this.pz, qx = this.qx, qy = this.qy, qz = this.qz, iw = this.iw;
  const tt = warm ? 0 : t + h, invH = 1 / h, gx = W.gx * this.gscale, gy = W.gy * this.gscale;
  if (this.pinBody) { // pins follow their body
    const b = this.pinBody;
    for (let m = 0; m < this.pinCols.length; m++) {
      const k = this.pinCols[m], lx = this.pinLocal[2 * m], ly = this.pinLocal[2 * m + 1];
      px[k] = b.x + b.cs * lx - b.sn * ly; py[k] = b.y + b.sn * lx + b.cs * ly; pz[k] = 0; qx[k] = px[k]; qy[k] = py[k]; qz[k] = 0;
    }
  }
  let nrel = rows;
  if (this.unroll) { // rows that are still wound sit on the roll; a row is released when the roll reaches its rest height
    const yRoll = this.y0 + this.rollY(tt), vRoll = (this.rollY(tt) - this.rollY(tt - h)) * invH;
    nrel = 1; while (nrel < rows && yRoll - this.y0 >= nrel * this.dyr - 1e-9) nrel++;
    for (let j = nrel; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i; px[k] = this.x0 + i * this.dxr; py[k] = yRoll; pz[k] = 0; qx[k] = px[k]; qy[k] = yRoll - vRoll * h; qz[k] = 0; iw[k] = 0;
    }
    for (let j = this.released; j < nrel; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i; iw[k] = j === rows - 1 ? 1 / this.hem : 1; qy[k] = py[k] - vRoll * h; }
    if (nrel > this.released) this.released = nrel;
  }
  const ax = this.ax, ay = this.ay, az = this.az;
  ax.fill(0); ay.fill(0); az.fill(0);
  if (this.windOn) { // aerodynamic force on every triangle: proportional to the relative velocity along the normal
    const tri = this.tri, wv = this.wv, ga = this.windGain / (6 * this.dxr * this.dyr);
    for (let m = 0; m < tri.length; m += 3) {
      const i0 = tri[m], i1 = tri[m + 1], i2 = tri[m + 2];
      const e1x = px[i1] - px[i0], e1y = py[i1] - py[i0], e1z = pz[i1] - pz[i0], e2x = px[i2] - px[i0], e2y = py[i2] - py[i0], e2z = pz[i2] - pz[i0];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nl < 1e-9) continue;
      this.windAt((px[i0] + px[i1] + px[i2]) / 3, (py[i0] + py[i1] + py[i2]) / 3, tt, wv);
      const vx = wv[0] - ((px[i0] - qx[i0]) + (px[i1] - qx[i1]) + (px[i2] - qx[i2])) * invH / 3;
      const vy = wv[1] - ((py[i0] - qy[i0]) + (py[i1] - qy[i1]) + (py[i2] - qy[i2])) * invH / 3;
      const vz = wv[2] - ((pz[i0] - qz[i0]) + (pz[i1] - qz[i1]) + (pz[i2] - qz[i2])) * invH / 3;
      const f = ga * (nx * vx + ny * vy + nz * vz) / nl, fx = f * nx, fy = f * ny, fz = f * nz;
      ax[i0] += fx; ay[i0] += fy; az[i0] += fz; ax[i1] += fx; ay[i1] += fy; az[i1] += fz; ax[i2] += fx; ay[i2] += fy; az[i2] += fz;
    }
  }
  const h2 = h * h, damp = 1 / (1 + h * this.drag);
  for (let k = 0; k < n; k++) {
    if (iw[k] === 0) continue;
    const vx = (px[k] - qx[k]) * damp, vy = (py[k] - qy[k]) * damp, vz = (pz[k] - qz[k]) * damp;
    qx[k] = px[k]; qy[k] = py[k]; qz[k] = pz[k];
    px[k] += vx + (gx + ax[k]) * h2; py[k] += vy + (gy + ay[k]) * h2; pz[k] += vz + az[k] * h2;
  }
  const ca = this.ca, cb = this.cb, cr = this.cr, ck = this.ck, nc = this.nc, rowOf = this.rowOf, wound = this.unroll !== null && nrel < rows;
  for (let it = 0; it < this.iters; it++) {
    for (let m = 0; m < nc; m++) {
      const a = ca[m], b = cb[m], wa = iw[a], wb = iw[b], ws = wa + wb;
      if (ws === 0) continue;
      const dx = px[b] - px[a], dy = py[b] - py[a], dz = pz[b] - pz[a], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 1e-9) continue;
      if (wound && d < cr[m] && (rowOf[a] >= nrel || rowOf[b] >= nrel)) continue; // the roll can pull a row but never pushes it
      const s = ck[m] * (d - cr[m]) / (d * ws);
      px[a] += wa * s * dx; py[a] += wa * s * dy; pz[a] += wa * s * dz; px[b] -= wb * s * dx; py[b] -= wb * s * dy; pz[b] -= wb * s * dz;
    }
  }
  const lim = this.dyr * (1 + this.maxStretch); // strain limit: a top-down sweep keeps hanging cloth from stretching
  for (let j = 1; j < rows; j++) for (let i = 0; i < cols; i++) {
    const b = j * cols + i, a = b - cols;
    if (iw[b] === 0 || j >= nrel) continue;
    const dx = px[b] - px[a], dy = py[b] - py[a], dz = pz[b] - pz[a], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > lim) { const s = lim / d; px[b] = px[a] + dx * s; py[b] = py[a] + dy * s; pz[b] = pz[a] + dz * s; }
  }
  if (this.floorY < 1e29) for (let k = 0; k < n; k++) if (py[k] > this.floorY && iw[k] !== 0) { py[k] = this.floorY; qy[k] = py[k]; }
};
Cloth.prototype.alloc = function (ns) { this.ns = ns; this.buf = new Float32Array(ns * this.n * 3); };
Cloth.prototype.record = function (si) {
  const o = si * this.n * 3, b = this.buf;
  for (let k = 0; k < this.n; k++) { b[o + 3 * k] = this.px[k]; b[o + 3 * k + 1] = this.py[k]; b[o + 3 * k + 2] = this.pz[k]; }
};
Cloth.prototype.sample = function (i0, i1, f, out) {
  const m = this.n * 3, p = i0 * m, q = i1 * m, b = this.buf, g = 1 - f;
  for (let k = 0; k < m; k++) out[k] = b[p + k] * g + b[q + k] * f;
};
World.prototype.cloth = function (def) {
  if (this._started) throw new Error('PHYS2D: add cloth before warmup()/run()');
  const c = new Cloth(this, def, this.cloths.length);
  this.cloths.push(c); return c;
};

// ---------------------------------------------------------------- foley, helpers, export
/* Turn w.events into the compact list the sound builder reads: [{ t, name:'phys', mat:'metal+wood', mag, pan, x, y, k, tag }].
 * opts: sceneStart (seconds added to t), screen { w, h, cx, cam | project }, maxEvents (default 120), panScale (0.85), offscreenGain (0.6), gain (1). */
function eventsToFoley(events, opts) {
  opts = opts || {};
  const screen = opts.screen || {}, W = screen.w || 1080, H = screen.h || 1920, cx = screen.cx != null ? screen.cx : W / 2;
  const t0 = opts.sceneStart || 0, cap = opts.maxEvents || 120, panScale = opts.panScale != null ? opts.panScale : 0.85, offG = opts.offscreenGain != null ? opts.offscreenGain : 0.6, gain = opts.gain != null ? opts.gain : 1;
  const out = [], pr = [0, 0];
  for (let i = 0; i < events.length; i++) {
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
    const ma = e.matA || 'default', mb = e.matB || 'default';
    out.push({ t: Math.round((t0 + e.t) * 1000) / 1000, name: 'phys', mat: ma <= mb ? ma + '+' + mb : mb + '+' + ma, mag: Math.round(mag * 100) / 100,
      pan: Math.round(pan * 100) / 100, x: Math.round(e.x), y: Math.round(e.y), k: e.kind, tag: (e.tagA || '?') + '+' + (e.tagB || '?'), _a: e.a, _b: e.b });
  }
  let res = out;
  if (out.length > cap) { // keep the first impact of each body, then the loudest; always at most `cap`
    const seen = {}, pin = [], rest = [];
    for (let i = 0; i < out.length; i++) {
      const o = out[i]; let p = false;
      if (!seen['a' + o._a]) { seen['a' + o._a] = 1; p = true; }
      if (!seen['a' + o._b]) { seen['a' + o._b] = 1; p = true; }
      (p ? pin : rest).push(i);
    }
    const byMag = function (a, b) { return out[b].mag - out[a].mag || a - b; };
    pin.sort(byMag); rest.sort(byMag);
    const keep = pin.slice(0, cap).concat(rest.slice(0, Math.max(0, cap - pin.length)));
    keep.sort(function (a, b) { return a - b; });
    res = keep.map(function (i) { return out[i]; });
  }
  for (let i = 0; i < res.length; i++) { delete res[i]._a; delete res[i]._b; }
  return res;
}
/* FNV-1a hash of n sampled states (bodies, rope and cloth points): equal hashes mean bit-identical simulations */
function stateHash(w, n) {
  n = n || 100;
  const f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
  let h = 0x811c9dc5;
  const mix = function (v) { f32[0] = v; h = Math.imul(h ^ u32[0], 0x01000193); };
  const st = w.makeState();
  for (let k = 0; k < n; k++) {
    w.at(n > 1 ? w.T * k / (n - 1) : 0, st);
    for (const e of st.bodies) { mix(e.x); mix(e.y); mix(e.angle); mix(e.vx); mix(e.vy); mix(e.awake ? 1 : 0); }
    for (const r of st.ropes) for (let i = 0; i < r.pts.length; i++) mix(r.pts[i]);
    for (const c of st.cloths) for (let i = 0; i < c.pts.length; i++) mix(c.pts[i]);
  }
  return (h >>> 0).toString(16);
}
/* per-vertex unit normals of a cloth point array (x y z triples), z toward the viewer; out is a Float32Array(3 * cols * rows) */
function clothNormals(pts, cols, rows, out) {
  out = out || new Float32Array(3 * cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const il = i > 0 ? i - 1 : i, ir = i < cols - 1 ? i + 1 : i, ju = j > 0 ? j - 1 : j, jd = j < rows - 1 ? j + 1 : j;
    const a = 3 * (j * cols + il), b = 3 * (j * cols + ir), c = 3 * (ju * cols + i), d = 3 * (jd * cols + i);
    const ux = pts[b] - pts[a], uy = pts[b + 1] - pts[a + 1], uz = pts[b + 2] - pts[a + 2], vx = pts[d] - pts[c], vy = pts[d + 1] - pts[c + 1], vz = pts[d + 2] - pts[c + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    const o = 3 * (j * cols + i); out[o] = nx / l; out[o + 1] = ny / l; out[o + 2] = nz / l;
  }
  return out;
}
return { version: '1.0', world: function (o) { return new World(o); }, eventsToFoley: eventsToFoley, stateHash: stateHash, clothNormals: clothNormals,
  materials: MATERIALS, sin: fsin, cos: fcos, rng: makeRng, STATIC: STATIC, KINEMATIC: KINEMATIC, DYNAMIC: DYNAMIC };
});
