// The lead: an original character built from code. Tousled black hair falling over his right eye with
// a violet streak, plum bomber jacket open over a black tee, silver crescent-moon pendant, gray cargo
// pants, white high-tops. Skinned limbs on a bone rig, hand-drawn anime face on a texture, hair clumps
// that sway on their own.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, inked } from './toon.js';
import { clamp, lerp, sstep, noise1, fbm1, TAU } from './util.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- palette
export const COL = {
  skin: 0x93603f,
  hair: 0x221b2b,
  streak: 0x8f5cff,
  jacket: 0x4a2c5c,
  rib: 0x2f1c3b,
  tee: 0x17131c,
  pants: 0x62626e,
  shoe: 0xf2f0f6,
  sole: 0x9a8cc8,
  silver: 0xe0e2ee,
};

// ---------------------------------------------------------------- rest skeleton (meters, facing +z)
const REST = {
  hips: V(0, 0.98, 0), spine: V(0, 1.12, 0), chest: V(0, 1.3, 0), neck: V(0, 1.48, 0), head: V(0, 1.56, 0),
  upperArmL: V(0.2, 1.43, 0), foreArmL: V(0.25, 1.16, 0.0), handL: V(0.27, 0.905, 0.01),
  upperArmR: V(-0.2, 1.43, 0), foreArmR: V(-0.25, 1.16, 0.0), handR: V(-0.27, 0.905, 0.01),
  upperLegL: V(0.095, 0.93, 0), lowerLegL: V(0.1, 0.52, 0.0), footL: V(0.1, 0.1, -0.01),
  upperLegR: V(-0.095, 0.93, 0), lowerLegR: V(-0.1, 0.52, 0.0), footR: V(-0.1, 0.1, -0.01),
};
const PARENT = {
  hips: null, spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  upperArmL: 'chest', foreArmL: 'upperArmL', handL: 'foreArmL',
  upperArmR: 'chest', foreArmR: 'upperArmR', handR: 'foreArmR',
  upperLegL: 'hips', lowerLegL: 'upperLegL', footL: 'lowerLegL',
  upperLegR: 'hips', lowerLegR: 'upperLegR', footR: 'lowerLegR',
};
const BONE_NAMES = Object.keys(REST);

// ---------------------------------------------------------------- geometry builders
// A tube around a centerline. center(s) and rad(s) take s in [0, 1] along the length;
// rad returns [rx, rz]. The cross-section's depth axis follows zRef. weight(s) returns
// [[boneIndex, w], ...]. Ends are closed with domes.
function tube({ center, rad, lenSeg = 28, ringSeg = 20, zRef = V(0, 0, 1), weight = null, cap0 = true, cap1 = true, capSeg = 5, th0 = 0 }) {
  const rings = [];
  const eps = 1e-3;
  const frameAt = s => {
    const c = center(s);
    const T = center(Math.min(1, s + eps)).sub(center(Math.max(0, s - eps))).normalize();
    const z = typeof zRef === 'function' ? zRef(s) : zRef;
    const B2 = z.clone().sub(T.clone().multiplyScalar(z.dot(T))).normalize();
    const B1 = new THREE.Vector3().crossVectors(B2, T);
    return { c, T, B1, B2 };
  };
  const lenAt = [];
  const S = [];
  for (let i = 0; i <= lenSeg; i++) S.push(i / lenSeg);
  // Start dome.
  if (cap0) {
    const f = frameAt(0), [rx, rz] = rad(0), rm = (rx + rz) / 2;
    for (let k = capSeg; k >= 1; k--) {
      const a = (k / capSeg) * Math.PI / 2;
      rings.push({ ...f, c: f.c.clone().addScaledVector(f.T, -rm * Math.sin(a) * 0.7), rx: rx * Math.cos(a) + 1e-4, rz: rz * Math.cos(a) + 1e-4, s: 0, dome: -Math.sin(a), v: 0 });
    }
  }
  for (const s of S) {
    const f = frameAt(s), [rx, rz] = rad(s);
    const [rx2, rz2] = rad(Math.min(1, s + eps));
    const L = center(Math.min(1, s + eps)).distanceTo(center(s)) || eps;
    rings.push({ ...f, rx, rz, s, slope: ((rx2 + rz2) - (rx + rz)) / 2 / L, v: s });
  }
  if (cap1) {
    const f = frameAt(1), [rx, rz] = rad(1), rm = (rx + rz) / 2;
    for (let k = 1; k <= capSeg; k++) {
      const a = (k / capSeg) * Math.PI / 2;
      rings.push({ ...f, c: f.c.clone().addScaledVector(f.T, rm * Math.sin(a) * 0.7), rx: rx * Math.cos(a) + 1e-4, rz: rz * Math.cos(a) + 1e-4, s: 1, dome: Math.sin(a), v: 1 });
    }
  }
  const pos = [], nor = [], uv = [], si = [], sw = [], idx = [];
  const n = new THREE.Vector3(), p = new THREE.Vector3();
  rings.forEach(r => {
    const w = weight ? weight(r.s) : null;
    for (let j = 0; j <= ringSeg; j++) {
      const th = th0 + (j / ringSeg) * TAU;
      const c = Math.cos(th), s = Math.sin(th);
      p.copy(r.c).addScaledVector(r.B1, c * r.rx).addScaledVector(r.B2, s * r.rz);
      n.set(0, 0, 0).addScaledVector(r.B1, c / Math.max(r.rx, 1e-4)).addScaledVector(r.B2, s / Math.max(r.rz, 1e-4)).normalize();
      if (r.dome !== undefined) n.multiplyScalar(Math.sqrt(Math.max(0, 1 - r.dome * r.dome))).addScaledVector(r.T, r.dome).normalize();
      else if (r.slope) n.addScaledVector(r.T, -r.slope).normalize();
      pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); uv.push(j / ringSeg, r.v);
      if (w) {
        const ww = w.slice(0, 4);
        while (ww.length < 4) ww.push([0, 0]);
        const tot = ww.reduce((a, b) => a + b[1], 0) || 1;
        si.push(...ww.map(e => e[0])); sw.push(...ww.map(e => e[1] / tot));
      }
    }
  });
  const rs = ringSeg + 1;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < ringSeg; j++) {
      const a = i * rs + j, b = (i + 1) * rs + j, c = (i + 1) * rs + j + 1, d = i * rs + j + 1;
      idx.push(a, d, b, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (weight) {
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }
  g.setIndex(idx);
  return g;
}

// Polyline through points, parametrized by arc length, rounded at interior joints.
function pathThrough(pts, round = 0.35) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', round);
  return s => curve.getPointAt(clamp(s));
}

// Profile lookup: keys [[s, value], ...] with smooth interpolation.
function prof(keys) {
  return s => {
    if (s <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (s <= keys[i][0]) {
      const [s0, a] = keys[i - 1], [s1, b] = keys[i];
      const u = (s - s0) / (s1 - s0), e = u * u * (3 - 2 * u);
      return Array.isArray(a) ? a.map((x, k) => lerp(x, b[k], e)) : lerp(a, b, e);
    }
    return keys[keys.length - 1][1];
  };
}

function smoothSphere(r, ws, hs, deform, o = {}) {
  let g = new THREE.SphereGeometry(r, ws, hs, 0, TAU, o.thetaStart || 0, o.thetaLength || Math.PI);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g);
  if (deform) {
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); deform(v); p.setXYZ(i, v.x, v.y, v.z); }
  }
  g.computeVertexNormals();
  return g;
}

function ellipsoid(sx, sy, sz, seg = 24) {
  return smoothSphere(1, seg, Math.round(seg * 0.7), v => v.set(v.x * sx, v.y * sy, v.z * sz));
}

// ---------------------------------------------------------------- head shape
const HEAD_R = 0.108;
const HEAD_C = V(0, 0.105, 0.012); // head center, relative to the head bone
// Skull to anime face: narrower sides, tapered longer jaw, rounder back.
function headDeform(v) {
  const r = HEAD_R;
  v.x *= 0.9;
  if (v.z < 0) v.z *= 1.06;
  if (v.y < 0) {
    const t = clamp(-v.y / r);
    v.x *= 1 - 0.34 * Math.pow(t, 1.5);
    v.z *= 1 - 0.18 * Math.pow(t, 1.6) * (v.z < 0 ? 2.2 : 1);
    v.y *= 1.2;
    if (v.z > 0) v.z += 0.012 * t * t;
  }
  return v;
}

// ---------------------------------------------------------------- face texture
const FACE = { phi0: Math.PI / 2 - 0.95, phiW: 1.9, th0: Math.PI / 2 - 0.62, thW: 1.62, size: 1024 };
const fx = dphi => (dphi + 0.95) / FACE.phiW * FACE.size;
const fy = dth => (dth + 0.62) / FACE.thW * FACE.size;
const FSX = FACE.size / FACE.phiW, FSY = FACE.size / FACE.thW; // px per radian

function drawEye(g, cx, cy, side, f) {
  // side: -1 = his right eye (viewer's left), +1 = his left eye.
  const ex = fx(cx), ey = fy(cy);
  const w = 0.2 * FSX, h = 0.125 * FSY;
  const inner = side * -1;                    // inner corner points toward the nose
  const blink = clamp(f.blink || 0);
  const lookX = (f.look ? f.look[0] : 0) * 0.045 * FSX, lookY = (f.look ? f.look[1] : 0) * 0.03 * FSY;
  const xi = ex + inner * w, xo = ex - inner * w;
  // Upper lid: from inner corner (lower) arching up to the outer corner.
  const upper = open => {
    const top = ey - h * (0.95 * open + 0.05 * (1 - open)) + h * 0.9 * (1 - open);
    return [[xi, ey + h * 0.12], [ex + inner * w * 0.45, top - h * 0.05], [ex - inner * w * 0.35, top], [xo, ey - h * 0.18 + h * 0.7 * (1 - open)]];
  };
  const lower = [[xi, ey + h * 0.12], [ex + inner * w * 0.3, ey + h * 0.78], [ex - inner * w * 0.45, ey + h * 0.72], [xo, ey - h * 0.1]];
  const open = 1 - blink;
  if (open > 0.12) {
    const up = upper(open);
    // Eye white.
    g.save();
    g.beginPath();
    g.moveTo(...up[0]); g.bezierCurveTo(...up[1], ...up[2], ...up[3]);
    g.bezierCurveTo(...lower[2], ...lower[1], ...lower[0]);
    g.closePath();
    g.fillStyle = '#efe8f3';
    g.fill();
    g.clip();
    // Iris and pupil.
    const ix = ex + lookX - inner * w * 0.04, iy = ey + h * 0.16 + lookY, ir = 0.095 * FSX, iry = 0.108 * FSY;
    const gr = g.createLinearGradient(0, iy - iry, 0, iy + iry);
    gr.addColorStop(0, '#1d1226'); gr.addColorStop(0.55, '#4a2f63'); gr.addColorStop(1, '#8a66b0');
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(ix, iy, ir, iry, 0, 0, TAU); g.fill();
    g.strokeStyle = '#140b1b'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#0e0814';
    g.beginPath(); g.ellipse(ix, iy + iry * 0.05, ir * 0.42, iry * 0.5, 0, 0, TAU); g.fill();
    // Lid shadow across the top of the eye.
    const sh = g.createLinearGradient(0, ey - h, 0, ey + h * 0.2);
    sh.addColorStop(0, 'rgba(30,14,40,0.75)'); sh.addColorStop(1, 'rgba(30,14,40,0)');
    g.fillStyle = sh; g.fillRect(ex - w * 1.2, ey - h * 1.2, w * 2.4, h * 1.4);
    // Highlights.
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath(); g.ellipse(ix - inner * ir * -0.35, iy - iry * 0.4, ir * 0.24, iry * 0.2, -0.4, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath(); g.ellipse(ix + inner * ir * -0.35, iy + iry * 0.45, ir * 0.1, iry * 0.08, 0, 0, TAU); g.fill();
    g.restore();
    // Upper lash line: heavy, tapering, with a flick at the outer corner.
    g.save();
    g.fillStyle = '#120a16';
    g.beginPath();
    g.moveTo(...up[0]);
    g.bezierCurveTo(...up[1], ...up[2], ...up[3]);
    g.lineTo(up[3][0] - inner * w * 0.16, up[3][1] + h * 0.12);
    g.bezierCurveTo(up[2][0], up[2][1] + h * 0.26, up[1][0], up[1][1] + h * 0.3, up[0][0] - inner * -2, up[0][1] + 4);
    g.closePath();
    g.fill();
    g.restore();
    // Lower lash, soft and partial.
    g.strokeStyle = 'rgba(40,20,40,0.55)'; g.lineWidth = 3.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - inner * w * 0.1, lower[1][1] - 2); g.quadraticCurveTo(ex - inner * w * 0.6, lower[2][1] - 2, xo - inner * 4, ey - h * 0.02); g.stroke();
    // Crease.
    g.strokeStyle = 'rgba(60,30,40,0.5)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(ex + inner * w * 0.2, ey - h * 1.2 + h * 0.9 * (1 - open)); g.quadraticCurveTo(ex - inner * w * 0.4, ey - h * 1.38 + h * 0.9 * (1 - open), xo - inner * 6, ey - h * 0.7 + h * 0.7 * (1 - open)); g.stroke();
  } else {
    // Closed: one soft curved lash line, slightly downturned.
    g.strokeStyle = '#140a18'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(xi, ey + h * 0.2); g.quadraticCurveTo(ex, ey + h * 0.62, xo, ey + h * 0.05); g.stroke();
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(xo, ey + h * 0.05); g.lineTo(xo - inner * 10, ey + h * 0.3); g.stroke();
  }
}

function drawFace(g, f) {
  g.clearRect(0, 0, FACE.size, FACE.size);
  // Brows (mostly under the fringe).
  g.strokeStyle = '#1a1119'; g.lineCap = 'round';
  [-1, 1].forEach(side => {
    const x0 = fx(side * 0.13), x1 = fx(side * 0.52);
    const raise = (f.brow || 0) * 0.04 * FSY;
    g.lineWidth = 11;
    g.beginPath(); g.moveTo(x0, fy(-0.2) - raise * 1.5); g.quadraticCurveTo(fx(side * 0.33), fy(-0.26) - raise, x1, fy(-0.2)); g.stroke();
  });
  drawEye(g, -0.37, 0.1, -1, f);
  drawEye(g, 0.37, 0.1, 1, f);
  // Nose: a small shadow tick.
  g.strokeStyle = 'rgba(80,40,30,0.75)'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(fx(0.02), fy(0.3)); g.lineTo(fx(0.05), fy(0.37)); g.lineTo(fx(0.0), fy(0.385)); g.stroke();
  // Mouth.
  const m = clamp(f.mouth || 0);
  const mx = fx(0), my = fy(0.58), mw = 0.11 * FSX;
  if (m < 0.08) {
    g.strokeStyle = '#3b1c1a'; g.lineWidth = 5.5;
    g.beginPath(); g.moveTo(mx - mw, my + 3); g.quadraticCurveTo(mx, my - 2 + (f.smile || 0) * 12, mx + mw, my + 3); g.stroke();
  } else {
    const mh = m * 0.075 * FSY, ww = mw * (0.75 + 0.25 * (1 - m));
    g.fillStyle = '#3a1219';
    g.beginPath();
    g.moveTo(mx - ww, my);
    g.bezierCurveTo(mx - ww * 0.6, my - mh * 0.35, mx + ww * 0.6, my - mh * 0.35, mx + ww, my);
    g.bezierCurveTo(mx + ww * 0.7, my + mh * 1.2, mx - ww * 0.7, my + mh * 1.2, mx - ww, my);
    g.fill();
    g.save(); g.clip();
    g.fillStyle = '#f2ecec'; g.fillRect(mx - ww, my - mh * 0.4, ww * 2, mh * 0.35);
    g.fillStyle = '#a1464f'; g.beginPath(); g.ellipse(mx, my + mh * 0.95, ww * 0.6, mh * 0.35, 0, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = '#2a0e12'; g.lineWidth = 4; g.stroke();
  }
  // Tear track for the sad close-ups.
  if (f.tear) {
    const a = clamp(f.tear);
    g.strokeStyle = `rgba(210,225,255,${0.7 * a})`; g.lineWidth = 6;
    g.beginPath(); g.moveTo(fx(-0.3), fy(0.2)); g.quadraticCurveTo(fx(-0.33), fy(0.36), fx(-0.3), fy(0.3 + 0.25 * a)); g.stroke();
  }
}

// ---------------------------------------------------------------- hair
// Direction on the head sphere: el = elevation (deg), az = azimuth (deg, 0 = front, + = his left).
const dirEA = (el, az) => { const e = el * Math.PI / 180, a = az * Math.PI / 180; return V(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)); };

// Hair clump layout: [elRoot, azRoot, elTip, azTip, rTip, width, streak?]
function hairLayout() {
  const L = [];
  // Crown: tousled clumps lying back and out, not standing tall.
  for (let i = 0; i < 12; i++) {
    const az = -170 + i * 30 + (i % 2) * 8;
    L.push([80, az, 38 - (i % 3) * 7, az + 12, 1.2 + (i % 2) * 0.05, 0.05, 0]);
  }
  // Back: down to the nape, flaring out a little.
  for (let i = 0; i < 9; i++) {
    const az = 130 + i * 12.5;
    L.push([40, az, -44 + (i % 2) * 8, az + (i % 3 - 1) * 6, 1.1, 0.052, 0]);
  }
  // Sides: over the top of the ears, thin at the temples.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const az = s * (66 + i * 13);
      L.push([46, az, -14 - i * 5, az + s * 4, 1.1, 0.042, 0]);
    }
  }
  // Fringe: pointed locks that end at the brows, sweeping toward his right.
  const fr = [
    [60, 50, 18, 46, 1.12, 0.034], [63, 36, 12, 30, 1.14, 0.036], [65, 22, 8, 14, 1.15, 0.036],
    [66, 8, 6, -2, 1.16, 0.036], [66, -8, 4, -18, 1.16, 0.038], [63, -24, 0, -34, 1.15, 0.038],
    [60, -40, 4, -50, 1.14, 0.034], [58, -54, 10, -62, 1.12, 0.03],
  ];
  fr.forEach(c => L.push([...c, 0]));
  // One longer lock over his right eye, and the violet streak beside it.
  L.push([65, -16, -14, -24, 1.18, 0.034, 0]);
  L.push([66, -2, -2, -12, 1.17, 0.026, 1]);
  L.push([65, -10, -8, -20, 1.18, 0.022, 1]);
  return L;
}

// ---------------------------------------------------------------- hands
function buildHand(side, mats) {
  const hand = new THREE.Group();
  const palm = inked(new THREE.Mesh(ellipsoid(0.021, 0.047, 0.042), mats.skin), 0.6);
  palm.position.set(0, -0.045, 0.004);
  hand.add(palm);
  const fingers = [];
  const fg = new THREE.CapsuleGeometry(0.0095, 0.036, 4, 10);
  for (let i = 0; i < 4; i++) {
    const piv = new THREE.Group();
    piv.position.set(0, -0.085, 0.028 - i * 0.018);
    const seg = inked(new THREE.Mesh(fg, mats.skin), 0.5);
    seg.position.y = -0.022;
    piv.add(seg);
    // Second knuckle so a curl reads as a real finger.
    const piv2 = new THREE.Group();
    piv2.position.y = -0.042;
    const tip = inked(new THREE.Mesh(new THREE.CapsuleGeometry(0.0088, 0.018, 4, 10), mats.skin), 0.5);
    tip.position.y = -0.014;
    piv2.add(tip);
    piv.add(piv2);
    hand.add(piv);
    fingers.push([piv, piv2]);
  }
  const thumb = new THREE.Group();
  thumb.position.set(-side * 0.012, -0.03, 0.035);
  const th = inked(new THREE.Mesh(new THREE.CapsuleGeometry(0.0105, 0.036, 4, 10), mats.skin), 0.5);
  th.position.y = -0.025;
  thumb.add(th);
  thumb.rotation.set(0.5, 0, -side * 0.35);
  hand.add(thumb);
  hand.userData = { fingers, thumb, side };
  return hand;
}

// ---------------------------------------------------------------- shoes
function buildShoe(mats) {
  const g = new THREE.Group();
  const body = inked(new THREE.Mesh(ellipsoid(0.056, 0.05, 0.128), mats.shoe), 0.7);
  body.position.set(0, -0.05, 0.045);
  const collar = inked(new THREE.Mesh(tube({ center: s => V(0, lerp(-0.07, 0.05, s), 0), rad: s => [0.058 - s * 0.004, 0.064 - s * 0.006], lenSeg: 4, ringSeg: 18 }), mats.shoe), 0.7);
  const sole = inked(new THREE.Mesh(ellipsoid(0.062, 0.02, 0.138), mats.sole), 0.7);
  sole.position.set(0, -0.085, 0.045);
  const tongue = new THREE.Mesh(ellipsoid(0.03, 0.012, 0.06), mats.shoe);
  tongue.position.set(0, -0.005, 0.07); tongue.rotation.x = -0.5;
  const lace = new THREE.Mesh(ellipsoid(0.028, 0.006, 0.05), mats.rib);
  lace.position.set(0, -0.012, 0.085); lace.rotation.x = -0.45;
  g.add(body, collar, sole, tongue, lace);
  return g;
}

// ---------------------------------------------------------------- the character
export class Character {
  constructor(o = {}) {
    this.group = new THREE.Group();
    const mats = this.mats = {
      skin: toon(COL.skin, { rim: 0.9 }),
      hair: toon(0xffffff, { map: hairTexture(COL.hair), rim: 0.45 }),
      streak: toon(0xffffff, { map: hairTexture(COL.streak), rim: 1.1, emissive: 0x2a1060 }),
      jacket: toon(0xffffff, { map: jacketTexture(), rim: 0.75 }),
      sleeve: toon(COL.jacket, { rim: 0.75 }),
      rib: toon(COL.rib, { rim: 0.8 }),
      tee: toon(COL.tee, { rim: 0.6 }),
      pants: toon(COL.pants, { rim: 0.9 }),
      shoe: toon(COL.shoe, { rim: 0.5 }),
      sole: toon(COL.sole, { rim: 0.5 }),
      silver: toon(COL.silver, { rim: 1.2, emissive: 0x303040 }),
    };
    // Bones.
    const B = this.bones = {};
    for (const name of BONE_NAMES) {
      const b = new THREE.Bone();
      b.name = name;
      const par = PARENT[name];
      b.position.copy(REST[name]).sub(par ? REST[par] : V(0, 0, 0));
      if (par) B[par].add(b);
      B[name] = b;
    }
    this.group.add(B.hips);
    this.group.updateMatrixWorld(true);
    const boneList = BONE_NAMES.map(n => B[n]);
    this.skeleton = new THREE.Skeleton(boneList);
    const bi = n => BONE_NAMES.indexOf(n);
    const skinned = (geo, mat, k = 1) => {
      const m = new THREE.SkinnedMesh(geo, mat);
      m.frustumCulled = false;
      this.group.add(m);
      m.bind(this.skeleton);
      inked(m, k);
      return m;
    };
    // Two-bone blend along a limb: a before the joint at sj, b after.
    const twoBone = (a, b, sj, bl = 0.06) => s => { const w = sstep(sj - bl, sj + bl, s); return [[bi(a), 1 - w], [bi(b), w]]; };

    // --- torso (jacket), hips -> chest by height
    const tY0 = 0.905, tY1 = 1.5;
    const torsoRad = prof([[0, [0.162, 0.115]], [0.08, [0.158, 0.112]], [0.2, [0.168, 0.12]],
      [0.42, [0.18, 0.126]], [0.64, [0.19, 0.127]], [0.8, [0.198, 0.122]], [0.9, [0.185, 0.11]], [0.96, [0.135, 0.09]], [1, [0.075, 0.07]]]);
    const torsoGeo = tube({
      center: s => V(0, lerp(tY0, tY1, s), s > 0.85 ? -0.006 : 0.004), rad: torsoRad, lenSeg: 30, ringSeg: 32, th0: -Math.PI / 2, cap0: false, cap1: false,
      weight: s => { const y = lerp(tY0, tY1, s); const a = sstep(1.0, 1.12, y), b = sstep(1.18, 1.3, y); return [[bi('hips'), 1 - a], [bi('spine'), a - b], [bi('chest'), b]]; },
    });
    skinned(torsoGeo, mats.jacket, 1.1);
    // Shoulder caps so raised arms stay attached.
    for (const s of [-1, 1]) {
      const cap = inked(new THREE.Mesh(ellipsoid(0.052, 0.04, 0.056), mats.sleeve), 1);
      cap.position.set(s * 0.176, 1.405, 0).sub(REST.chest);
      B.chest.add(cap);
    }
    // Collar rib, hem rib.
    const collar = inked(new THREE.Mesh(new THREE.TorusGeometry(0.074, 0.016, 10, 32), mats.rib), 0.7);
    collar.rotation.x = Math.PI / 2 - 0.3;
    collar.scale.set(1.08, 1, 1);
    collar.position.set(0, 1.482, 0.0).sub(REST.chest);
    B.chest.add(collar);
    const hem = inked(new THREE.Mesh(tube({ center: s => V(0, lerp(0.895, 0.955, s), 0), rad: s => [0.168, 0.119], lenSeg: 3, ringSeg: 32, cap0: false, cap1: false }), mats.rib), 1);
    hem.position.sub(REST.hips);
    B.hips.add(hem);
    // Tee neckline inside the collar.
    const teeNeck = new THREE.Mesh(ellipsoid(0.07, 0.03, 0.06), mats.tee);
    teeNeck.position.set(0, 1.475, 0.02).sub(REST.chest);
    B.chest.add(teeNeck);
    // Pendant: thin chain loop and a silver crescent.
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.0025, 6, 40, Math.PI * 0.9), mats.silver);
    chain.rotation.set(0.3, 0, Math.PI + Math.PI * 0.05);
    chain.position.set(0, 1.47, 0.08).sub(REST.chest);
    B.chest.add(chain);
    const moon = inked(new THREE.Mesh(crescentGeo(0.022), mats.silver), 0.4);
    moon.position.set(0.0, 1.385, 0.137).sub(REST.chest);
    moon.rotation.x = -0.15;
    B.chest.add(moon);

    // --- pelvis (pants)
    const pelvis = inked(new THREE.Mesh(ellipsoid(0.16, 0.1, 0.115), mats.pants), 1);
    pelvis.position.set(0, 0.905, -0.005).sub(REST.hips);
    B.hips.add(pelvis);

    // --- sleeves
    for (const s of ['L', 'R']) {
      const pts = [REST['upperArm' + s].clone().add(V(0, 0.02, 0)), REST['foreArm' + s], REST['hand' + s].clone().add(V(0, 0.02, 0))];
      const path = pathThrough(pts, 0.2);
      const len0 = pts[0].distanceTo(pts[1]), len1 = pts[1].distanceTo(pts[2]), sj = len0 / (len0 + len1);
      const geo = tube({ center: path, rad: prof([[0, [0.062, 0.066]], [0.15, [0.061, 0.064]], [sj, [0.055, 0.058]], [0.85, [0.05, 0.052]], [1, [0.047, 0.049]]]),
        lenSeg: 30, ringSeg: 20, weight: twoBone('upperArm' + s, 'foreArm' + s, sj, 0.07) });
      skinned(geo, mats.sleeve, 1);
      const cuff = inked(new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.014, 10, 24), mats.rib), 0.7);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.copy(REST['hand' + s]).add(V(0, 0.028, 0)).sub(REST['foreArm' + s]);
      B['foreArm' + s].add(cuff);
      const hand = buildHand(s === 'L' ? 1 : -1, mats);
      B['hand' + s].add(hand);
      this['hand' + s] = hand;
    }

    // --- legs
    for (const s of ['L', 'R']) {
      const pts = [REST['upperLeg' + s].clone().add(V(0, 0.03, 0)), REST['lowerLeg' + s], REST['foot' + s].clone().add(V(0, -0.02, 0))];
      const path = pathThrough(pts, 0.2);
      const len0 = pts[0].distanceTo(pts[1]), len1 = pts[1].distanceTo(pts[2]), sj = len0 / (len0 + len1);
      const geo = tube({ center: path, rad: prof([[0, [0.086, 0.09]], [0.2, [0.08, 0.084]], [sj, [0.064, 0.068]], [0.8, [0.062, 0.064]], [0.95, [0.07, 0.07]], [1, [0.068, 0.068]]]),
        lenSeg: 30, ringSeg: 20, weight: twoBone('upperLeg' + s, 'lowerLeg' + s, sj, 0.06) });
      skinned(geo, mats.pants, 1);
      // Cargo pocket on the outer thigh.
      const side = s === 'L' ? 1 : -1;
      const pocket = inked(new THREE.Mesh(ellipsoid(0.016, 0.07, 0.052), mats.pants), 0.6);
      pocket.position.set(side * 0.078, -0.2, 0.004);
      B['upperLeg' + s].add(pocket);
      const flap = new THREE.Mesh(ellipsoid(0.018, 0.012, 0.054), mats.rib);
      flap.position.set(side * 0.08, -0.14, 0.004);
      B['upperLeg' + s].add(flap);
      const shoe = buildShoe(mats);
      B['foot' + s].add(shoe);
    }

    // --- neck and head
    const neck = inked(new THREE.Mesh(tube({ center: s => V(0, lerp(-0.05, 0.1, s), 0.006), rad: s => [0.039, 0.041], lenSeg: 4, ringSeg: 18 }), mats.skin), 0.8);
    B.neck.add(neck);
    const head = this.head = new THREE.Group();
    head.position.copy(HEAD_C);
    B.head.add(head);
    const skullGeo = smoothSphere(HEAD_R, 48, 36, headDeform);
    sphereNormals(skullGeo);
    const skull = inked(new THREE.Mesh(skullGeo, mats.skin), 1);
    head.add(skull);
    // Ears.
    for (const s of [-1, 1]) {
      const ear = inked(new THREE.Mesh(ellipsoid(0.012, 0.026, 0.018), mats.skin), 0.6);
      ear.position.set(s * HEAD_R * 0.9, -0.01, -0.01);
      head.add(ear);
    }
    // Face decal: a shell a hair above the skin, same deformation, with the drawn face.
    this.faceCanvas = document.createElement('canvas');
    this.faceCanvas.width = this.faceCanvas.height = FACE.size;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    this.faceTex.anisotropy = 4;
    const faceGeo = new THREE.SphereGeometry(HEAD_R * 1.004, 64, 48, FACE.phi0, FACE.phiW, FACE.th0, FACE.thW);
    {
      const p = faceGeo.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); headDeform(v); p.setXYZ(i, v.x, v.y, v.z); }
      sphereNormals(faceGeo);
    }
    const faceMesh = new THREE.Mesh(faceGeo, toon(0xffffff, { map: this.faceTex, transparent: true, rim: 0 }));
    faceMesh.renderOrder = 2;
    head.add(faceMesh);
    this._faceKey = '';

    // Hair: cap plus clumps, each on its own pivot so it can sway.
    const cap = inked(new THREE.Mesh(smoothSphere(HEAD_R * 1.075, 40, 28, v => { v.x *= 0.93; if (v.z < 0) v.z *= 1.06; return v; }, { thetaLength: 1.95 }), mats.hair), 1);
    cap.rotation.x = -0.32;
    cap.position.set(0, 0.006, -0.01);
    head.add(cap);
    this.clumps = [];
    hairLayout().forEach((c, i) => {
      const [elR, azR, elT, azT, rT, w, streak] = c;
      const root = dirEA(elR, azR).multiplyScalar(HEAD_R * 1.02);
      root.x *= 0.93;
      const outR = dirEA(elR, azR);
      const tip = dirEA(elT, azT).multiplyScalar(HEAD_R * rT);
      tip.x *= 0.95;
      const outT = dirEA(elT, azT);
      const p1 = root.clone().addScaledVector(outR, HEAD_R * 0.34).add(V(0, HEAD_R * 0.05, 0));
      const p2 = tip.clone().addScaledVector(outT, HEAD_R * 0.18).add(V(0, HEAD_R * 0.25, 0));
      const bez = new THREE.CubicBezierCurve3(root, p1, p2, tip);
      const wob = 0.85 + 0.3 * Math.abs(Math.sin(i * 12.9898));
      const geo = tube({
        center: s => bez.getPoint(s).sub(root), lenSeg: 16, ringSeg: 10,
        rad: s => { const r = w * wob * Math.pow(1 - s, 0.85) * (1 + 0.35 * Math.sin(Math.PI * Math.min(1, s * 1.4))); return [r + 0.0012, r * 0.42 + 0.001]; },
        zRef: s => bez.getPoint(s).normalize(), cap0: true, cap1: true, capSeg: 3,
      });
      const pivot = new THREE.Group();
      pivot.position.copy(root);
      const mesh = inked(new THREE.Mesh(geo, streak ? mats.streak : mats.hair), 0.8);
      pivot.add(mesh);
      head.add(pivot);
      this.clumps.push({ pivot, seed: i * 7.3, k: elR > 70 ? 0.6 : 1 });
    });
    this.group.traverse(o => { o.frustumCulled = false; });
    this.update(0, {});
  }

  // Applies a pose. Missing entries fall back to the rest pose. Angles in radians.
  // pose: { hips: [x,y,z] rotation, hipsPos: [x,y,z] offset, spine, chest, neck, head,
  //         upperArmL, foreArmL, handL, ..., curlL, curlR (0..1), face: {...}, wind }
  update(t, pose) {
    const B = this.bones;
    for (const n of BONE_NAMES) {
      const r = pose[n];
      if (r) B[n].rotation.set(r[0], r[1], r[2]); else B[n].rotation.set(0, 0, 0);
    }
    const hp = pose.hipsPos || [0, 0, 0];
    B.hips.position.set(REST.hips.x + hp[0], REST.hips.y + hp[1], REST.hips.z + hp[2]);
    for (const s of ['L', 'R']) {
      const hand = this['hand' + s], curl = pose['curl' + s] ?? 0.25;
      hand.visible = !pose.hideHands;
      hand.userData.fingers.forEach(([a, b], i) => { a.rotation.x = curl * (1.1 + i * 0.08); b.rotation.x = curl * 1.3; });
      hand.userData.thumb.rotation.x = 0.5 + curl * 0.5;
    }
    // Hair sways a little on its own, more with wind.
    const wind = pose.wind ?? 0.2;
    this.clumps.forEach(c => {
      const a = (0.025 + 0.09 * wind) * c.k;
      c.pivot.rotation.set(a * fbm1(t * (0.8 + wind), c.seed), a * 0.5 * noise1(t * 0.7, c.seed + 3), a * fbm1(t * (0.9 + wind), c.seed + 11));
    });
    // Face.
    const f = pose.face || {};
    const blink = f.blink ?? autoBlink(t, f.seed || 0);
    const face = { blink: f.closed ? 1 : blink, mouth: f.mouth || 0, look: f.look || [0, 0], brow: f.brow || 0, smile: f.smile || 0, tear: f.tear || 0 };
    const key = [face.blink, face.mouth, face.look[0], face.look[1], face.brow, face.smile, face.tear].map(x => x.toFixed(2)).join(',');
    if (key !== this._faceKey) {
      drawFace(this.faceCanvas.getContext('2d'), face);
      this.faceTex.needsUpdate = true;
      this._faceKey = key;
    }
  }
}

// Natural blinking: quick closes every few seconds.
function autoBlink(t, seed) {
  const period = 3.3;
  const k = Math.floor((t + seed) / period);
  const at = k * period + 0.6 + 1.8 * Math.abs(Math.sin(k * 91.7 + seed));
  const d = t + seed - at;
  if (d < 0 || d > 0.16) return 0;
  return Math.sin(Math.PI * d / 0.16);
}

// Shading normals from a plain ellipsoid instead of the deformed jaw: smooth anime shadow shapes.
// The outline hull still uses these, which keeps the ink line even around the chin.
function sphereNormals(g) {
  const p = g.attributes.position, n = new THREE.Vector3();
  const arr = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    n.set(p.getX(i) / 0.9, p.getY(i) * 0.85, p.getZ(i)).normalize();
    arr[i * 3] = n.x; arr[i * 3 + 1] = n.y; arr[i * 3 + 2] = n.z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(arr, 3));
}

// Hair strip texture along each clump: base color with a soft highlight band near the root.
function hairTexture(hex) {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const g = c.getContext('2d');
  const base = new THREE.Color(hex), hi = base.clone().lerp(new THREE.Color(0x9a88c0), 0.32);
  const gr = g.createLinearGradient(0, 256, 0, 0); // canvas bottom = root (v = 0)
  gr.addColorStop(0, '#' + base.getHexString());
  gr.addColorStop(0.16, '#' + base.getHexString());
  gr.addColorStop(0.22, '#' + hi.getHexString());
  gr.addColorStop(0.3, '#' + hi.getHexString());
  gr.addColorStop(0.36, '#' + base.getHexString());
  gr.addColorStop(1, '#' + base.clone().multiplyScalar(0.8).getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crescentGeo(r) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, Math.PI * 0.35, Math.PI * 1.65, false);
  s.absarc(r * 0.42, 0, r * 0.8, Math.PI * 1.45, Math.PI * 0.55, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 2, curveSegments: 16 });
  g.rotateZ(-0.5);
  return g;
}

function jacketTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const base = '#' + COL.jacket.toString(16).padStart(6, '0');
  g.fillStyle = base; g.fillRect(0, 0, 1024, 512);
  // Soft vertical quilting so the shading reads as fabric.
  for (let x = 0; x < 1024; x += 64) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x + 30, 0, 4, 512); }
  // Open front: black tee between the zipper tapes, a star print on the chest.
  const cx = 512, half = 46;
  g.fillStyle = '#' + COL.tee.toString(16).padStart(6, '0');
  g.fillRect(cx - half, 0, half * 2, 512);
  g.fillStyle = '#7a52a0';
  g.fillRect(cx - half - 7, 0, 7, 512); g.fillRect(cx + half, 0, 7, 512);
  g.fillStyle = 'rgba(180,150,255,0.9)';
  const star = (x, y, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
  star(cx + 10, 150, 22);
  // Hem rib band.
  g.fillStyle = '#' + COL.rib.toString(16).padStart(6, '0');
  g.fillRect(0, 470, 1024, 42);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let x = 0; x < 1024; x += 10) g.fillRect(x, 470, 3, 42);
  // Welt pockets.
  g.strokeStyle = '#2b1836'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(330, 330); g.lineTo(372, 400); g.stroke();
  g.beginPath(); g.moveTo(694, 330); g.lineTo(652, 400); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
