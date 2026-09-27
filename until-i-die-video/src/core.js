'use strict';
// Core utilities: math, deterministic randomness, noise, color, canvas helpers.
// Everything that draws is a pure function of time, so any frame can be rendered
// in any order (the renderer splits the video across several browser workers).

const W = 1920, H = 1080;
const TAU = Math.PI * 2;
// Scene registry: scene files add draw functions here, keyed by name used in timeline.js.
const SCENES = {};

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const fract = x => x - Math.floor(x);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const remap = (x, a, b, c, d) => c + (d - c) * clamp((x - a) / (b - a));
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => { t = clamp(t); return t * t * t; };
const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; t = clamp(t); return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
// Fade in over [a, a+fi], hold, fade out over [b-fo, b].
const window01 = (x, a, b, fi, fo = fi) => sstep(a, a + fi, x) * (1 - sstep(b - fo, b, x));

// ---------- deterministic randomness ----------
function hashi(i) {
  i |= 0;
  i = Math.imul(i ^ (i >>> 16), 0x7feb352d);
  i = Math.imul(i ^ (i >>> 15), 0x846ca68b);
  i ^= i >>> 16;
  return (i >>> 0) / 4294967296;
}
function hash(a, b = 0, c = 0) {
  return hashi(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791) ^ 0x2545f491);
}
// Signed version in [-1, 1).
const hashs = (a, b = 0, c = 0) => hash(a, b, c) * 2 - 1;

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth value noise in [-1, 1].
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1;
}
function fbm1(x, seed = 0, oct = 3) {
  let s = 0, a = 0.5, fr = 1, n = 0;
  for (let o = 0; o < oct; o++) { s += a * noise1(x * fr, seed + o * 31); n += a; fr *= 2.03; a *= 0.5; }
  return s / n;
}
function noise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}

// ---------- color ----------
// Colors are [r, g, b] arrays with 0-255 channels.
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const scalec = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
function hexc(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Palette used across the video.
const PAL = {
  ink: hexc('#05030a'),
  night: hexc('#0b0718'),
  violet: hexc('#8b3dff'),
  purple: hexc('#b347ff'),
  magenta: hexc('#ff2bd6'),
  cyan: hexc('#29e6ff'),
  ice: hexc('#bff6ff'),
  blood: hexc('#ff1e3c'),
  ember: hexc('#ff7a1a'),
  gold: hexc('#ffc857'),
  white: [255, 255, 255],
  teal: hexc('#0fb5a8'),
  deep: hexc('#04122b'),
  green: hexc('#39ff9a'),
};

// ---------- canvas helpers ----------
function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

const _glowCache = new Map();
// Soft radial sprite, gaussian-ish falloff. Tinted by color, drawn with 'lighter' for light.
function glowSprite(c, hard = 0) {
  const key = c.join(',') + '|' + hard;
  let s = _glowCache.get(key);
  if (s) return s;
  s = mkCanvas(128, 128);
  const g = s.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (hard) {
    gr.addColorStop(0, rgba([255, 255, 255], 1));
    gr.addColorStop(0.18, rgba(mixc(c, [255, 255, 255], 0.5), 1));
    gr.addColorStop(0.35, rgba(c, 0.55));
    gr.addColorStop(0.6, rgba(c, 0.14));
    gr.addColorStop(1, rgba(c, 0));
  } else {
    gr.addColorStop(0, rgba(c, 1));
    gr.addColorStop(0.12, rgba(c, 0.78));
    gr.addColorStop(0.28, rgba(c, 0.42));
    gr.addColorStop(0.5, rgba(c, 0.14));
    gr.addColorStop(0.75, rgba(c, 0.035));
    gr.addColorStop(1, rgba(c, 0));
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  _glowCache.set(key, s);
  return s;
}

function glow(ctx, x, y, r, c, a = 1, hard = 0) {
  if (a <= 0.002 || r <= 0.5) return;
  ctx.globalAlpha = a;
  ctx.drawImage(glowSprite(c, hard), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

// Additive glowing stroke along a path: wide faint pass, medium pass, bright core.
function neonStroke(ctx, pathFn, c, width, a = 1, core = true) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const passes = [[width * 7, 0.05], [width * 3.2, 0.13], [width * 1.6, 0.35]];
  for (const [w, al] of passes) {
    ctx.strokeStyle = rgba(c, al * a);
    ctx.lineWidth = w;
    ctx.beginPath(); pathFn(ctx); ctx.stroke();
  }
  if (core) {
    ctx.strokeStyle = rgba(mixc(c, [255, 255, 255], 0.65), 0.9 * a);
    ctx.lineWidth = Math.max(1, width * 0.55);
    ctx.beginPath(); pathFn(ctx); ctx.stroke();
  }
  ctx.restore();
}

function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [p, c, a] of stops) g.addColorStop(p, rgba(c, a === undefined ? 1 : a));
  return g;
}

function fillBG(ctx, stops, y0 = 0, y1 = H) {
  ctx.fillStyle = vgrad(ctx, y0, y1, stops);
  ctx.fillRect(-W, -H, W * 3, H * 3);
}

// Pre-rendered grayscale noise tiles (TV static, grain).
const NOISE_TILES = [];
function initNoise() {
  const rnd = mulberry32(999);
  for (let k = 0; k < 6; k++) {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (rnd() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    NOISE_TILES.push(c);
  }
}

// Fill current clip/area with TV static; frame index picks the tile.
function drawStatic(ctx, x, y, w, h, frame, a = 1, scale = 2) {
  const tile = NOISE_TILES[frame % NOISE_TILES.length];
  ctx.save();
  ctx.globalAlpha = a;
  ctx.imageSmoothingEnabled = false;
  const ts = 256 * scale;
  const ox = hash(frame, 7) * ts, oy = hash(frame, 11) * ts;
  for (let yy = y - oy; yy < y + h; yy += ts)
    for (let xx = x - ox; xx < x + w; xx += ts) ctx.drawImage(tile, xx, yy, ts, ts);
  ctx.restore();
}

// Rotating 2D point helpers.
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// Camera: push-in + drift + optional shake, applied around the frame center.
function camera(ctx, { zoom = 1, x = 0, y = 0, rot: r = 0, shake = 0, t = 0, seed = 0 } = {}) {
  const sx = shake * (fbm1(t * 9, seed + 1) * 22), sy = shake * (fbm1(t * 9, seed + 2) * 22);
  const sr = shake * fbm1(t * 7, seed + 3) * 0.012;
  ctx.translate(W / 2 + x + sx, H / 2 + y + sy);
  ctx.rotate(r + sr);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -H / 2);
}

// Text with letter spacing (Canvas letterSpacing is supported in Chromium, but keep a fallback).
function spacedText(ctx, str, x, y, spacing) {
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = spacing + 'px';
    ctx.fillText(str, x, y);
    ctx.letterSpacing = '0px';
    return;
  }
  const chars = [...str];
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width + spacing;
  total -= spacing;
  const align = ctx.textAlign;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.textAlign = 'left';
  for (const ch of chars) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; }
  ctx.textAlign = align;
}
