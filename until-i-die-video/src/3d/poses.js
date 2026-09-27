// Pose library and motion cycles. A pose maps bone names to [x, y, z] rotations (radians).
// Conventions (character faces +z): upperArm x < 0 raises the arm forward, z abducts (L +, R -),
// y twists (L < 0 turns the forearm inward); foreArm x < 0 bends the elbow; upperLeg x < 0 swings
// the leg forward; lowerLeg x > 0 bends the knee; spine/chest/neck/head x > 0 lean or look down,
// y turns toward his left.
import { lerp, clamp, noise1, fbm1, TAU } from './util.js';

const BONES = ['hips', 'spine', 'chest', 'neck', 'head', 'upperArmL', 'foreArmL', 'handL', 'upperArmR', 'foreArmR', 'handR',
  'upperLegL', 'lowerLegL', 'footL', 'upperLegR', 'lowerLegR', 'footR'];
const Z = [0, 0, 0];

// Arms relaxed at the sides.
export const REST = {
  upperArmL: [0.02, 0, 0.06], foreArmL: [-0.18, 0, 0], handL: [0, 0, -0.05],
  upperArmR: [0.02, 0, -0.06], foreArmR: [-0.18, 0, 0], handR: [0, 0, 0.05],
  curlL: 0.35, curlR: 0.35,
};

export const POSES = {
  rest: REST,
  pockets: { ...REST, upperArmL: [0.06, 0, 0.12], foreArmL: [-0.55, 0, 0], upperArmR: [0.06, 0, -0.12], foreArmR: [-0.55, 0, 0], hideHands: true },
  heart: { ...REST, upperArmR: [-0.5, 1.35, -0.12], foreArmR: [-2.0, 0, 0], handR: [0, 0, -0.2], curlR: 0.1 },
  bothHeart: { ...REST, upperArmR: [-0.5, 1.35, -0.12], foreArmR: [-2.0, 0, 0], handR: [0, 0, -0.2], curlR: 0.1,
    upperArmL: [-0.45, -1.25, 0.14], foreArmL: [-1.85, 0, 0], handL: [0, 0, 0.25], curlL: 0.15 },
  palmOut: { ...REST, upperArmR: [-1.5, 0, -0.05], foreArmR: [-0.1, 0, 0], handR: [-1.3, 0, 0], curlR: 0.0, upperArmL: [0.25, 0, 0.18], foreArmL: [-0.3, 0, 0] },
  windowPalm: { ...REST, upperArmR: [-1.25, 0.1, -0.35], foreArmR: [-0.9, 0, 0], handR: [-1.1, 0, 0], curlR: 0.0 },
  spread: { ...REST, upperArmL: [-0.2, 0, 1.0], foreArmL: [-0.2, 0, 0], upperArmR: [-0.2, 0, -1.0], foreArmR: [-0.2, 0, 0], curlL: 0.1, curlR: 0.1 },
  limp: { ...REST, upperArmL: [0.05, 0, 0.14], foreArmL: [-0.05, 0, 0], upperArmR: [0.05, 0, -0.14], foreArmR: [-0.05, 0, 0], curlL: 0.5, curlR: 0.5, head: [0.55, 0, 0.15], neck: [0.2, 0, 0] },
  sinkLean: { ...REST, upperArmL: [-0.5, -0.3, 0.2], foreArmL: [-0.6, 0, 0], upperArmR: [-0.5, 0.3, -0.2], foreArmR: [-0.6, 0, 0], curlL: 0.1, curlR: 0.1, spine: [0.25, 0, 0], chest: [0.15, 0, 0] },
};

// Weighted blend of two poses.
export function blend(a, b, w) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k], vb = b[k];
    if (Array.isArray(va) || Array.isArray(vb)) {
      const x = va || Z, y = vb || Z;
      out[k] = [lerp(x[0], y[0], w), lerp(x[1], y[1], w), lerp(x[2], y[2], w)];
    } else if (typeof va === 'number' || typeof vb === 'number') out[k] = lerp(va ?? 0, vb ?? 0, w);
    else out[k] = w < 0.5 ? va : vb;
  }
  return out;
}

// Adds rotation offsets from b onto a.
export function layer(a, b) {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    const vb = b[k];
    if (Array.isArray(vb)) { const va = a[k] || Z; out[k] = [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]]; }
    else if (k === 'hipsPos') { const va = a.hipsPos || Z; out.hipsPos = [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]]; }
    else out[k] = vb;
  }
  return out;
}

// Breathing and small weight shifts, so a held pose never looks frozen.
export function idle(t, k = 1, seed = 0) {
  const br = Math.sin(t * 1.35 + seed) * k;
  const sw = fbm1(t * 0.25, seed + 5) * k;
  return {
    spine: [0.012 * br, 0.03 * sw, 0.015 * sw], chest: [-0.02 * br, 0, 0],
    neck: [0.01 * br, 0.04 * fbm1(t * 0.3, seed + 9) * k, 0], head: [0.015 * fbm1(t * 0.4, seed + 13) * k, 0.05 * fbm1(t * 0.35, seed + 17) * k, 0.02 * sw],
    upperArmL: [0.015 * br, 0, 0.01 * br], upperArmR: [0.015 * br, 0, -0.01 * br],
    hips: [0, 0.02 * sw, 0.015 * sw], hipsPos: [0.01 * sw, 0.003 * br, 0],
  };
}

// Walk cycle. Returns the pose and the forward distance covered by time t.
export function walk(t, o = {}) {
  const { period = 1.12, stride = 0.62, arms = 1, bounce = 1 } = o;
  const ph = (t / period) * TAU;
  const s = Math.sin(ph), c = Math.cos(ph);
  const swingL = Math.max(0, c), swingR = Math.max(0, -c);
  const pose = {
    upperLegL: [-0.4 * s - 0.05, 0, 0.02], upperLegR: [0.4 * s - 0.05, 0, -0.02],
    lowerLegL: [0.1 + 0.75 * Math.pow(swingL, 1.4), 0, 0], lowerLegR: [0.1 + 0.75 * Math.pow(swingR, 1.4), 0, 0],
    footL: [-0.2 * s + 0.25 * Math.max(0, -Math.sin(ph + 0.9)), 0, 0], footR: [0.2 * s + 0.25 * Math.max(0, Math.sin(ph + 0.9)), 0, 0],
    hips: [0.03, 0.12 * s, 0.04 * Math.cos(2 * ph)], hipsPos: [0.015 * s, -0.022 * bounce * s * s, 0],
    spine: [0.04, -0.06 * s, 0], chest: [0.02, -0.07 * s, 0], neck: [0, 0.05 * s, 0], head: [-0.02, 0.04 * s, 0],
    upperArmL: [0.32 * s * arms, 0, 0.08], foreArmL: [-0.3 - 0.2 * Math.max(0, -s) * arms, 0, 0],
    upperArmR: [-0.32 * s * arms, 0, -0.08], foreArmR: [-0.3 - 0.2 * Math.max(0, s) * arms, 0, 0],
    curlL: 0.45, curlR: 0.45,
  };
  return { pose, dist: (t / period) * stride * 2 };
}

// Crawl on hands and knees toward +z. Returns pose and distance.
export function crawl(t, o = {}) {
  const { period = 1.9, stride = 0.28 } = o;
  const ph = (t / period) * TAU, s = Math.sin(ph), c = Math.cos(ph);
  const pose = {
    hips: [1.2, 0.05 * s, 0], hipsPos: [0, -0.43 + 0.015 * Math.abs(s), -0.05],
    spine: [0.12, 0, 0.03 * s], chest: [0.08, 0, 0], neck: [-0.55, 0, 0], head: [-0.35, 0.05 * s, 0],
    upperLegL: [-1.35 - 0.25 * s, 0, 0.08], lowerLegL: [1.9 + 0.1 * s, 0, 0], footL: [0.6, 0, 0],
    upperLegR: [-1.35 + 0.25 * s, 0, -0.08], lowerLegR: [1.9 - 0.1 * s, 0, 0], footR: [0.6, 0, 0],
    upperArmL: [-1.05 + 0.28 * s, 0, 0.15], foreArmL: [-0.15 - 0.2 * Math.max(0, c), 0, 0], handL: [-0.9, 0, 0], curlL: 0.1,
    upperArmR: [-1.05 - 0.28 * s, 0, -0.15], foreArmR: [-0.15 - 0.2 * Math.max(0, -c), 0, 0], handR: [-0.9, 0, 0], curlR: 0.1,
  };
  return { pose, dist: (t / period) * stride * 2 };
}

// Sitting on a ledge at seat height, legs hanging.
export const SIT_LEDGE = {
  ...REST, hipsPos: [0, -0.46, 0], hips: [0.05, 0, 0],
  upperLegL: [-1.5, 0, 0.06], lowerLegL: [1.45, 0, 0], footL: [0.3, 0, 0],
  upperLegR: [-1.5, 0, -0.06], lowerLegR: [1.5, 0, 0], footR: [0.3, 0, 0],
  upperArmL: [0.25, 0, 0.3], foreArmL: [-0.2, 0, 0], handL: [-0.6, 0, 0.3], curlL: 0.2,
  upperArmR: [0.25, 0, -0.3], foreArmR: [-0.2, 0, 0], handR: [-0.6, 0, -0.3], curlR: 0.2,
  spine: [0.12, 0, 0], chest: [0.08, 0, 0], head: [0.1, 0, 0],
};

// Sitting on the deck hugging his knees.
export const SIT_HUG = {
  ...REST, hipsPos: [0, -0.84, 0], hips: [-0.35, 0, 0],
  upperLegL: [-1.95, 0, 0.1], lowerLegL: [2.35, 0, 0], footL: [-0.2, 0, 0],
  upperLegR: [-1.95, 0, -0.1], lowerLegR: [2.35, 0, 0], footR: [-0.2, 0, 0],
  spine: [0.45, 0, 0], chest: [0.3, 0, 0], neck: [0.2, 0, 0], head: [-0.15, 0, 0],
  upperArmL: [-0.9, -0.6, 0.25], foreArmL: [-1.3, 0, 0], curlL: 0.6,
  upperArmR: [-0.9, 0.6, -0.25], foreArmR: [-1.3, 0, 0], curlR: 0.6,
};
