'use strict';
// Illustrated-stills engine. Every shot is one painted frame from art/, moved by a camera and
// brought to life with layered effects: rain, fog, particles, light, local warps and beat pulses.
// Coordinates passed as (u, v) are fractions of the source image; cam.map turns them into pixels.

const ART_FILES = [
  '01_intro', '02_walk', '03_eye', '04_perform', '05_shards', '06_photos', '07_closeup', '08_window',
  '09_stage', '10_headparty', '11_mirror', '12_drive', '13_shockwave', '14_city', '15_boat', '16_storm',
  '17_demons', '18_light', '19_underwater', '20_rooftop', '21_highway', '22_crawl', '23_coffin', '24_maze',
  '25_circle', '26_diamonds', '27_ascend',
];
const ART = {};

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

// Full-size art lives in art/NN_name.jpg. Until it is there, the small previews in art/thumbs stand in.
function loadArt() {
  return Promise.all(ART_FILES.map(name =>
    loadImage(`art/${name}.jpg`)
      .catch(() => loadImage(`art/thumbs/${name}.jpg`))
      .catch(() => null)
      .then(im => { ART[name] = im; })));
}

let _fx = null;
const fxCanvas = () => _fx || (_fx = mkCanvas(W, H));

// ---------------- timing ----------------
// Sections are 16 bars, so one beat is a 64th of a section.
const beatLen = () => (SECTION_STARTS.verse1 - SECTION_STARTS.chorus1) / 64;
function beatPulse(t, from, sharp = 7) {
  const b = beatLen();
  const ph = ((t - from) % b + b) % b / b;
  return Math.exp(-ph * sharp);
}

// ---------------- camera ----------------
// Move spec: { a: [zoom, fx, fy], b: [zoom, fx, fy], ease, rot: [r0, r1], drift }.
// zoom 1 means the still just covers the frame; (fx, fy) is the image point held at frame center.
function shotCam(I, m, extraZoom = 0) {
  const p = clamp(I.lt / I.dur);
  const e = (m.ease || easeInOut)(p);
  const a = m.a, b = m.b || m.a;
  const drift = m.drift === undefined ? 5 : m.drift;
  const seed = m.seed || 1;
  return {
    z: lerp(a[0], b[0], e) * (1 + extraZoom),
    fx: lerp(a[1], b[1], e),
    fy: lerp(a[2], b[2], e),
    rot: m.rot ? lerp(m.rot[0], m.rot[1], e) : 0,
    dx: drift * fbm1(I.t * 0.45, seed) + (m.shake || 0) * fbm1(I.t * 11, seed + 7) * 14,
    dy: drift * 0.7 * fbm1(I.t * 0.4, seed + 3) + (m.shake || 0) * fbm1(I.t * 11, seed + 9) * 14,
    dr: 0.0012 * fbm1(I.t * 0.3, seed + 5) + (m.shake || 0) * fbm1(I.t * 9, seed + 11) * 0.006,
  };
}

// Draws the still under the camera and leaves the camera transform applied (caller restores).
function plate(g, name, c) {
  const img = ART[name];
  g.translate(W / 2 + c.dx, H / 2 + c.dy);
  g.rotate(c.rot + c.dr);
  g.translate(-W / 2, -H / 2);
  if (!img) {
    g.fillStyle = '#120a1c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c9b8ff'; g.font = "400 34px 'Share Tech Mono'"; g.textAlign = 'center';
    g.fillText(`missing art/${name}.jpg`, W / 2, H / 2);
    return { map: (u, v) => [u * W, v * H], k: 1 };
  }
  const iw = img.naturalWidth, ih = img.naturalHeight;
  // A little extra cover so drift and tilt never show an edge.
  const s = Math.max(W / iw, H / ih) * c.z * 1.04;
  const dw = iw * s, dh = ih * s;
  const ox = clamp(W / 2 - c.fx * dw, W - dw, 0);
  const oy = clamp(H / 2 - c.fy * dh, H - dh, 0);
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, ox, oy, dw, dh);
  return { map: (u, v) => [ox + u * dw, oy + v * dh], k: dw / W, ox, oy, dw, dh };
}

// ---------------- weather and atmosphere ----------------
function rain(g, t, o = {}) {
  drawRain(g, t, Object.assign({ n: 360, alpha: 0.22, len: 60, speed: 2100, angle: 0.12, color: [205, 200, 255], layers: 3 }, o));
}

// A few large, soft streaks right in front of the lens.
function rainFront(g, t, o = {}) {
  const { n = 26, a = 0.12, seed = 9, angle = 0.12 } = o;
  g.save();
  g.filter = 'blur(2px)';
  drawRain(g, t, { n, alpha: a, len: 190, speed: 2900, angle, width: 3.2, layers: 1, seed, color: [230, 225, 255] });
  g.restore();
}

// Slow drifting fog bank between y0 and y1 (screen space).
function fog(g, t, o = {}) {
  const { y0 = H * 0.6, y1 = H, n = 14, c = [150, 110, 220], a = 0.12, vx = 26, seed = 5, r = 420 } = o;
  g.save();
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const span = W + r * 2;
    const x = fract(hash(i, seed) + (t * vx * (0.6 + 0.8 * hash(i, seed, 1))) / span) * span - r;
    const y = y0 + hash(i, seed, 2) * (y1 - y0);
    const rr = r * (0.6 + 0.8 * hash(i, seed, 3));
    const breathe = 0.75 + 0.25 * Math.sin(t * 0.5 + i * 1.7);
    g.globalAlpha = a * breathe;
    g.drawImage(glowSprite(c), x - rr * 1.6, y - rr * 0.55, rr * 3.2, rr * 1.1);
  }
  g.restore();
}

// Floating motes: dust, embers, sparkles or bubbles, drifting at (vx, vy) px/s.
function particles(g, t, o = {}) {
  const { n = 50, kind = 'dust', c = [225, 205, 255], a = 0.55, seed = 3, x0 = 0, x1 = W, y0 = 0, y1 = H, vx = 6, vy = -18, size = 3 } = o;
  const w = x1 - x0, h = y1 - y0;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const sp = 0.5 + hash(i, seed, 1);
    const x = x0 + fract(hash(i, seed) + (t * vx * sp) / w) * w + Math.sin(t * 0.8 + i * 2.3) * 10;
    const y = y0 + fract(hash(i, seed, 2) + (t * vy * sp) / h) * h;
    const tw = 0.45 + 0.55 * Math.sin(t * (1.2 + 2.5 * hash(i, seed, 4)) + i);
    const r = size * (0.5 + hash(i, seed, 5));
    if (kind === 'bubble') {
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = rgba(c, a * 0.7);
      g.lineWidth = 1.4;
      g.beginPath(); g.arc(x, y, r * 2.2, 0, TAU); g.stroke();
      g.fillStyle = rgba([255, 255, 255], a * 0.6);
      g.beginPath(); g.arc(x - r * 0.7, y - r * 0.7, r * 0.5, 0, TAU); g.fill();
      g.globalCompositeOperation = 'lighter';
    } else if (kind === 'sparkle') {
      if (tw > 0.2) drawGlint(g, x, y, r * 5 * tw, c, a * tw);
    } else {
      glow(g, x, y, r * 5, c, a * 0.5 * tw);
      glow(g, x, y, r * 1.2, mixc(c, [255, 255, 255], 0.6), a * tw, 1);
    }
  }
  g.restore();
}

// Lightning: brightens the whole frame for each strike time.
function lightning(g, t, times, o = {}) {
  const f = flashAt(t, times, o.decay || 0.18);
  if (f <= 0.01) return 0;
  g.save();
  g.globalCompositeOperation = 'screen';
  g.fillStyle = rgba(o.c || [205, 195, 255], (o.a || 0.55) * f);
  g.fillRect(-W, -H, W * 3, H * 3);
  g.restore();
  return f;
}

// Soft diagonal band of light that crosses the frame once over [t0, t0 + dur].
function lightSweep(g, t, t0, dur, o = {}) {
  const p = (t - t0) / dur;
  if (p <= 0 || p >= 1) return;
  const { c = [255, 230, 255], a = 0.18, width = 360, ang = 0.35 } = o;
  const x = lerp(-width * 2, W + width * 2, easeInOut(p));
  g.save();
  g.globalCompositeOperation = 'screen';
  g.translate(x, H / 2);
  g.rotate(ang);
  const gr = g.createLinearGradient(-width, 0, width, 0);
  gr.addColorStop(0, rgba(c, 0));
  gr.addColorStop(0.5, rgba(c, a * Math.sin(Math.PI * p)));
  gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr;
  g.fillRect(-width, -H * 1.5, width * 2, H * 3);
  g.restore();
}

// Lens flare on a light source: bloom core, horizontal anamorphic streak, faint ghosts.
function flare(g, x, y, r, c, a = 1) {
  if (a <= 0.01) return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  glow(g, x, y, r * 2.2, c, 0.5 * a);
  glow(g, x, y, r * 0.6, [255, 255, 255], 0.9 * a, 1);
  g.globalAlpha = 0.55 * a;
  g.drawImage(glowSprite(mixc(c, [150, 180, 255], 0.5)), x - r * 9, y - r * 0.18, r * 18, r * 0.36);
  const vx = W / 2 - x, vy = H / 2 - y;
  [[0.6, 0.18], [1.3, 0.3], [1.7, 0.12]].forEach(([k, s], i) => {
    glow(g, x + vx * k, y + vy * k, r * s * 3, i === 1 ? [140, 120, 255] : c, 0.12 * a);
  });
  g.restore();
}

// A light source that breathes and flickers now and then.
function flicker(t, seed, rate = 0.6) {
  const n = noise1(t * 9, seed);
  const dip = hash(Math.floor(t * rate * 4), seed) > 0.86 ? 0.35 + 0.65 * n : 1;
  return (0.88 + 0.12 * Math.sin(t * 2.1 + seed)) * dip;
}

// ---------------- local motion on the painted frame ----------------
// Horizontal strip warp in screen space: fn(y) returns the x offset for that row.
function warpRows(g, y0, y1, fn, step = 3) {
  const c = g.canvas, fx = fxCanvas(), f = fx.getContext('2d');
  y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H, Math.ceil(y1));
  if (y1 <= y0) return;
  f.setTransform(1, 0, 0, 1, 0, 0);
  f.clearRect(0, y0, W, y1 - y0);
  f.drawImage(c, 0, y0, W, y1 - y0, 0, y0, W, y1 - y0);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (let y = y0; y < y1; y += step) {
    const h = Math.min(step, y1 - y);
    const dx = fn(y);
    if (Math.abs(dx) < 0.05) continue;
    g.drawImage(fx, 0, y, W, h, dx, y, W, h);
  }
  g.restore();
}

// Vertical strip warp: fn(x) returns the y offset for that column.
function warpCols(g, x0, x1, y0, y1, fn, step = 3) {
  const c = g.canvas, fx = fxCanvas(), f = fx.getContext('2d');
  x0 = Math.max(0, Math.floor(x0)); x1 = Math.min(W, Math.ceil(x1));
  y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H, Math.ceil(y1));
  if (x1 <= x0 || y1 <= y0) return;
  f.setTransform(1, 0, 0, 1, 0, 0);
  f.clearRect(x0, y0, x1 - x0, y1 - y0);
  f.drawImage(c, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (let x = x0; x < x1; x += step) {
    const w = Math.min(step, x1 - x);
    const dy = fn(x);
    if (Math.abs(dy) < 0.05) continue;
    g.drawImage(fx, x, y0, w, y1 - y0, x, y0 + dy, w, y1 - y0);
  }
  g.restore();
}

// Digital glitch inside a screen rectangle: displaced slices plus a color-split ghost.
function glitchRect(g, x0, y0, x1, y1, fr, amt) {
  if (amt <= 0.02) return;
  const c = g.canvas, fx = fxCanvas(), f = fx.getContext('2d');
  x0 = Math.max(0, x0 | 0); y0 = Math.max(0, y0 | 0); x1 = Math.min(W, x1 | 0); y1 = Math.min(H, y1 | 0);
  const w = x1 - x0, h = y1 - y0;
  f.setTransform(1, 0, 0, 1, 0, 0);
  f.clearRect(x0, y0, w, h);
  f.drawImage(c, x0, y0, w, h, x0, y0, w, h);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  for (let i = 0; i < 14; i++) {
    if (hash(i, fr, 1) > amt) continue;
    const y = y0 + hash(i, fr, 2) * h, hh = 4 + hash(i, fr, 3) * 60;
    const dx = hashs(i, fr, 4) * 90 * amt;
    g.drawImage(fx, x0, y, w, hh, x0 + dx, y, w, hh);
  }
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = 0.35 * amt;
  g.filter = 'sepia(1) hue-rotate(260deg) saturate(4)';
  g.drawImage(fx, x0, y0, w, h, x0 + 10 * amt, y0, w, h);
  g.filter = 'sepia(1) hue-rotate(140deg) saturate(4)';
  g.drawImage(fx, x0, y0, w, h, x0 - 10 * amt, y0, w, h);
  g.restore();
}

// Expanding ring of light (shockwaves, beat hits).
function ring(g, x, y, r, width, c, a, squash = 0.45) {
  if (a <= 0.01 || r <= 1) return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [w, al] of [[width * 4, 0.12], [width * 1.6, 0.35], [width * 0.5, 0.9]]) {
    g.strokeStyle = rgba(w < width ? mixc(c, [255, 255, 255], 0.6) : c, al * a);
    g.lineWidth = w;
    g.beginPath(); g.ellipse(x, y, r, r * squash, 0, 0, TAU); g.stroke();
  }
  g.restore();
}

// ---------------- color ----------------
// Chorus colorways: 0 keeps the painted violet, 1 pushes crimson, 2 pushes gold.
function grade(g, v, amt = 1) {
  if (!v) return;
  const c = v === 1 ? [210, 30, 60] : [255, 176, 70];
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'color';
  g.fillStyle = rgba(c, 0.3 * amt);
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = rgba(c, 0.35 * amt);
  g.fillRect(0, 0, W, H);
  g.restore();
}

// Fades a shot in from black or out to black at its own edges (used inside long holds).
function edgeFade(g, I, fin = 0, fout = 0) {
  let a = 0;
  if (fin > 0) a = Math.max(a, 1 - clamp(I.lt / fin));
  if (fout > 0) a = Math.max(a, 1 - clamp((I.dur - I.lt) / fout));
  if (a <= 0) return;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = `rgba(0,0,0,${a})`;
  g.fillRect(0, 0, W, H);
  g.restore();
}
