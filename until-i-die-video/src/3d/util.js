// Math, deterministic randomness and noise. Every frame is a pure function of time,
// so the renderer can split the video across several browser workers.

export const W = 1920, H = 1080;
export const TAU = Math.PI * 2;

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const fract = x => x - Math.floor(x);
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const remap = (x, a, b, c, d) => c + (d - c) * clamp((x - a) / (b - a));
export const easeInOut = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => { t = clamp(t); return t * t * t; };
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
// Fade in over [a, a+fi], hold, fade out over [b-fo, b].
export const window01 = (x, a, b, fi, fo = fi) => sstep(a, a + fi, x) * (1 - sstep(b - fo, b, x));

function hashi(i) {
  i |= 0;
  i = Math.imul(i ^ (i >>> 16), 0x7feb352d);
  i = Math.imul(i ^ (i >>> 15), 0x846ca68b);
  i ^= i >>> 16;
  return (i >>> 0) / 4294967296;
}
export function hash(a, b = 0, c = 0) {
  return hashi(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791) ^ 0x2545f491);
}
export const hashs = (a, b = 0, c = 0) => hash(a, b, c) * 2 - 1;

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth value noise in [-1, 1].
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1;
}
export function fbm1(x, seed = 0, oct = 3) {
  let s = 0, a = 0.5, fr = 1, n = 0;
  for (let o = 0; o < oct; o++) { s += a * noise1(x * fr, seed + o * 31); n += a; fr *= 2.03; a *= 0.5; }
  return s / n;
}

// Blend between keyed values: keys = [[t, value], ...] sorted by t; value may be a number or array.
export function keyed(keys, t, ease = smooth) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const e = ease((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((x, k) => lerp(x, v1[k], e)) : lerp(v0, v1, e);
    }
  }
  return keys[keys.length - 1][1];
}
