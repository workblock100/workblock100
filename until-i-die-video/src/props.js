'use strict';
// Reusable scene elements. All deterministic in (t, seed).

// ---------- weather ----------
function drawRain(ctx, t, o = {}) {
  const { n = 520, speed = 2300, len = 42, angle = 0.16, alpha = 0.32, color = [190, 200, 255], seed = 1, width = 1.3, layers = 3, x0 = -300, x1 = W + 300, y0 = -60, y1 = H + 60 } = o;
  const span = y1 - y0;
  ctx.save();
  ctx.lineCap = 'round';
  for (let L = 0; L < layers; L++) {
    const d = (L + 1) / layers;
    ctx.strokeStyle = rgba(color, alpha * (0.35 + 0.65 * d));
    ctx.lineWidth = width * (0.5 + d);
    ctx.beginPath();
    const cnt = Math.round(n / layers);
    const sp = speed * (0.55 + 0.45 * d);
    const ln = len * (0.45 + 0.55 * d);
    for (let i = 0; i < cnt; i++) {
      const hx = hash(i, seed, L), hp = hash(i, seed + 5, L);
      const yy = y0 + fract(hp + (t * sp) / span) * span;
      const xx = x0 + hx * (x1 - x0) + (yy - y0) * Math.tan(angle);
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx - Math.sin(angle) * ln, yy - Math.cos(angle) * ln);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSplashes(ctx, t, o = {}) {
  const { n = 60, y0 = H * 0.8, y1 = H, color = [200, 210, 255], alpha = 0.4, seed = 3, period = 0.45, x0 = 0, x1 = W } = o;
  ctx.save();
  ctx.lineWidth = 1.2;
  for (let k = 0; k < n; k++) {
    const ph = t / period + hash(k, seed);
    const idx = Math.floor(ph), life = fract(ph);
    const x = x0 + hash(k, idx, seed) * (x1 - x0);
    const yy = y0 + hash(k, idx, seed + 1) * (y1 - y0);
    const persp = 0.4 + 0.6 * (yy - y0) / Math.max(1, y1 - y0);
    const r = (4 + 26 * life) * persp;
    ctx.strokeStyle = rgba(color, alpha * (1 - life) * persp);
    ctx.beginPath();
    ctx.ellipse(x, yy, r, r * 0.28, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

// Lightning intensity from a list of strike times (sharp attack, flickering decay).
function flashAt(t, times, decay = 0.35) {
  let v = 0;
  for (const s of times) {
    const d = t - s;
    if (d < 0 || d > decay * 4) continue;
    const flick = 0.85 + 0.15 * Math.sin(d * 40);
    v = Math.max(v, Math.exp(-d / decay) * flick);
  }
  return clamp(v);
}

function boltPoints(x0, y0, x1, y1, seed, disp = 110, depth = 7) {
  let pts = [[x0, y0], [x1, y1]];
  const rnd = mulberry32(seed);
  let d = disp;
  for (let k = 0; k < depth; k++) {
    const np = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const off = (rnd() * 2 - 1) * d;
      np.push([mx - (dy / l) * off, my + (dx / l) * off], b);
    }
    pts = np;
    d *= 0.55;
  }
  return pts;
}

function drawBolt(ctx, x0, y0, x1, y1, seed, a = 1, c = [200, 180, 255], width = 3, branches = 3) {
  if (a <= 0.01) return;
  const main = boltPoints(x0, y0, x1, y1, seed);
  const paths = [main];
  const rnd = mulberry32(seed + 77);
  for (let b = 0; b < branches; b++) {
    const i = 8 + Math.floor(rnd() * (main.length * 0.6));
    const p = main[Math.min(i, main.length - 1)];
    const ang = Math.atan2(y1 - y0, x1 - x0) + (rnd() - 0.5) * 1.6;
    const len = Math.hypot(x1 - x0, y1 - y0) * (0.18 + rnd() * 0.25);
    paths.push(boltPoints(p[0], p[1], p[0] + Math.cos(ang) * len, p[1] + Math.sin(ang) * len, seed + b * 13 + 1, 50, 5));
  }
  paths.forEach((pts, pi) => {
    const w = pi === 0 ? width : width * 0.45;
    neonStroke(ctx, g => { g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); }, c, w, a * (pi === 0 ? 1 : 0.7));
  });
}

// ---------- sky ----------
function drawStars(ctx, t, o = {}) {
  const { n = 260, seed = 9, y1 = H * 0.7, alpha = 1, color = [230, 225, 255], drift = 0 } = o;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = fract(hash(i, seed) + drift * t * (0.3 + hash(i, seed + 3))) * W;
    const y = hash(i, seed + 1) * y1;
    const s = Math.pow(hash(i, seed + 2), 3);
    const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + 3 * hash(i, seed + 4)) + i);
    const a = alpha * tw * (0.25 + 0.75 * s);
    ctx.fillStyle = rgba(color, a);
    const r = 0.6 + s * 1.8;
    ctx.fillRect(x - r / 2, y - r / 2, r, r);
    if (s > 0.75) glow(ctx, x, y, 10 + 16 * s, color, a * 0.5);
  }
  ctx.restore();
}

function drawMoon(ctx, x, y, r, c = [236, 230, 255], a = 1, seed = 4) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, r * 5, mixc(c, PAL.violet, 0.5), 0.35 * a);
  glow(ctx, x, y, r * 2.2, c, 0.35 * a);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, rgba(PAL.white));
  g.addColorStop(0.7, rgba(c));
  g.addColorStop(1, rgba(mixc(c, [120, 110, 170], 0.5)));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  const rnd = mulberry32(seed);
  for (let i = 0; i < 9; i++) {
    const ang = rnd() * TAU, d = Math.sqrt(rnd()) * r * 0.75, cr = r * (0.05 + rnd() * 0.14);
    ctx.fillStyle = rgba([150, 140, 190], 0.25);
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d, cr, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// Soft fog bands made of large drifting blobs.
function drawFog(ctx, t, o = {}) {
  const { n = 14, y = H * 0.7, h = 260, color = [80, 60, 140], alpha = 0.18, speed = 18, seed = 21, size = 520, add = false } = o;
  ctx.save();
  if (add) ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = fract(hash(i, seed) + (t * speed * (0.5 + hash(i, seed + 1))) / (W + size * 2)) * (W + size * 2) - size;
    const yy = y + hashs(i, seed + 2) * h * 0.5;
    const s = size * (0.6 + 0.8 * hash(i, seed + 3));
    ctx.globalAlpha = alpha * (0.5 + 0.5 * hash(i, seed + 4));
    ctx.drawImage(glowSprite(color), x - s, yy - s * 0.45, s * 2, s * 0.9);
  }
  ctx.restore();
}

// Cloud bank rendered once into a cache canvas and drifted.
const _cloudCache = new Map();
function cloudLayer(seed, w, h, base, lit) {
  const key = `${seed}|${w}|${h}|${base}|${lit}`;
  if (_cloudCache.has(key)) return _cloudCache.get(key);
  const c = mkCanvas(w, h), g = c.getContext('2d');
  const rnd = mulberry32(seed);
  const col = hexc(base), lcol = hexc(lit);
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w, y = h * (0.35 + rnd() * 0.5);
    const r = 90 + rnd() * 260;
    g.globalAlpha = 0.5 + rnd() * 0.4;
    g.drawImage(glowSprite(col), x - r, y - r * 0.55, r * 2, r * 1.1);
  }
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const x = rnd() * w, y = h * (0.28 + rnd() * 0.3);
    const r = 60 + rnd() * 180;
    g.globalAlpha = 0.12 + rnd() * 0.12;
    g.drawImage(glowSprite(lcol), x - r, y - r * 0.5, r * 2, r);
  }
  _cloudCache.set(key, c);
  return c;
}
function drawClouds(ctx, t, o = {}) {
  const { seed = 5, y = 0, h = 520, base = '#140c26', lit = '#6d4bb3', speed = 12, alpha = 1, flash = 0, flashC = [200, 180, 255] } = o;
  const w = W * 2;
  const layer = cloudLayer(seed, w, h, base, lit);
  const off = ((t * speed) % w + w) % w;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(layer, -off, y);
  ctx.drawImage(layer, -off + w, y);
  if (flash > 0.01) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = flash * 0.9;
    ctx.filter = 'brightness(2.2)';
    ctx.drawImage(layer, -off, y);
    ctx.drawImage(layer, -off + w, y);
    ctx.filter = 'none';
    ctx.globalAlpha = flash * 0.5;
    ctx.fillStyle = rgba(flashC, 0.35);
    ctx.fillRect(0, y, W, h);
  }
  ctx.restore();
}

// ---------- city ----------
const _cityCache = new Map();
function cityLayer(seed, h, o = {}) {
  const { col = '#07040f', win = '#ffcf7a', winP = 0.12, minH = 0.25, maxH = 1, w = W * 1.5 } = o;
  const key = `${seed}|${h}|${col}|${win}|${winP}|${minH}|${w}`;
  if (_cityCache.has(key)) return _cityCache.get(key);
  const c = mkCanvas(w, h), g = c.getContext('2d');
  const rnd = mulberry32(seed);
  const wc = hexc(win);
  let x = 0;
  while (x < w) {
    const bw = 40 + rnd() * 130;
    const bh = h * (minH + rnd() * (maxH - minH));
    g.fillStyle = col;
    g.fillRect(x, h - bh, bw + 1, bh);
    if (rnd() < 0.25) g.fillRect(x + bw * 0.45, h - bh - 30 - rnd() * 60, 3, 90);
    if (rnd() < 0.2) { g.fillRect(x + bw * 0.2, h - bh - 14, bw * 0.3, 14); }
    const cols = Math.floor(bw / 14), rows = Math.floor(bh / 20);
    for (let r = 1; r < rows; r++)
      for (let q = 0; q < cols; q++) {
        if (rnd() < winP) {
          const b = 0.4 + rnd() * 0.6;
          g.fillStyle = rgba(mixc(wc, [140, 180, 255], rnd() * 0.5), b);
          g.fillRect(x + 5 + q * 14, h - bh + r * 20, 6, 9);
        }
      }
    x += bw + rnd() * 6;
  }
  _cityCache.set(key, c);
  return c;
}
function drawCity(ctx, seed, yBase, h, offset = 0, o = {}) {
  const layer = cityLayer(seed, h, o);
  const w = layer.width;
  const off = ((offset % w) + w) % w;
  ctx.drawImage(layer, -off, yBase - h);
  if (w - off < W) ctx.drawImage(layer, w - off, yBase - h);
}

// ---------- shapes ----------
// Smooth closed/open curve through points (Catmull-Rom converted to bezier).
function curveThrough(ctx, pts, closed = false) {
  const n = pts.length;
  const P = i => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  ctx.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1]);
  }
  if (closed) ctx.closePath();
}

// Generic human head profile (facing right), unit size around (0,0), height ~1.2.
const HEAD_PROFILE = [
  [-0.16, 0.66], [-0.2, 0.36], [-0.3, 0.2], [-0.42, 0.0], [-0.4, -0.3], [-0.22, -0.5], [0.04, -0.56],
  [0.26, -0.42], [0.35, -0.2], [0.37, -0.08], [0.47, 0.08], [0.39, 0.13], [0.415, 0.2], [0.38, 0.24],
  [0.4, 0.28], [0.36, 0.37], [0.22, 0.44], [0.12, 0.5], [0.11, 0.66],
];
function headPath(ctx, cx, cy, s, flip = 1) {
  const pts = HEAD_PROFILE.map(([x, y]) => [cx + x * s * flip, cy + y * s]);
  curveThrough(ctx, pts, false);
  ctx.closePath();
}

// Almond-shaped eye; open in [0,1].
function eyePath(ctx, cx, cy, w, h, open) {
  const hh = h * open;
  ctx.moveTo(cx - w, cy);
  ctx.bezierCurveTo(cx - w * 0.45, cy - hh * 1.25, cx + w * 0.45, cy - hh * 1.25, cx + w, cy);
  ctx.bezierCurveTo(cx + w * 0.45, cy + hh * 1.05, cx - w * 0.45, cy + hh * 1.05, cx - w, cy);
  ctx.closePath();
}

// Shadow creature with horns and glowing eyes; sway driven by noise.
function drawDemon(ctx, x, y, s, t, seed, o = {}) {
  const { eye = PAL.blood, alpha = 1, fill = [6, 2, 8], kneel = 0, rise = 1, rim = [255, 50, 70] } = o;
  if (rim && !o._rimPass) {
    ctx.save();
    ctx.filter = `blur(${Math.max(1, s * 0.006).toFixed(1)}px)`;
    drawDemon(ctx, x + s * 0.008, y - s * 0.01, s, t, seed, { ...o, fill: rim, eye: [0, 0, 0], _rimPass: true, alpha: alpha * 0.85 });
    ctx.restore();
  }
  const rnd = mulberry32(seed);
  const horn = 0.18 + rnd() * 0.22, lean = (rnd() - 0.5) * 0.3, arms = 0.5 + rnd() * 0.5;
  const sw = noise1(t * 0.8, seed) * 0.08;
  const hh = s * (1 - 0.35 * kneel) * rise;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(lean * 0.3 + sw);
  ctx.fillStyle = rgba(fill);
  ctx.beginPath();
  const top = -hh;
  const hw = s * 0.16;
  // Body tapering into smoke at the bottom.
  ctx.moveTo(-s * 0.26, 0);
  ctx.bezierCurveTo(-s * 0.3, top * 0.45, -hw * 1.3, top * 0.72, -hw * 0.9, top * 0.8);
  // Left horn.
  ctx.bezierCurveTo(-hw * 1.4, top * (0.95 + horn), -hw * 2.2, top * (1.0 + horn * 1.2), -hw * 1.9, top * (1.08 + horn * 1.4));
  ctx.bezierCurveTo(-hw * 1.2, top * (1.0 + horn * 0.6), -hw * 0.8, top * 1.02, -hw * 0.45, top * 1.0);
  ctx.quadraticCurveTo(0, top * 1.06, hw * 0.45, top * 1.0);
  // Right horn.
  ctx.bezierCurveTo(hw * 0.8, top * 1.02, hw * 1.2, top * (1.0 + horn * 0.6), hw * 1.9, top * (1.08 + horn * 1.4));
  ctx.bezierCurveTo(hw * 2.2, top * (1.0 + horn * 1.2), hw * 1.4, top * (0.95 + horn), hw * 0.9, top * 0.8);
  ctx.bezierCurveTo(hw * 1.3, top * 0.72, s * 0.3, top * 0.45, s * 0.26, 0);
  // Wispy bottom.
  for (let i = 5; i >= 0; i--) {
    const px = lerp(s * 0.26, -s * 0.26, i / 5);
    ctx.lineTo(px + noise1(t * 1.5 + i, seed + 3) * s * 0.05, s * (0.12 + 0.1 * hash(i, seed)));
  }
  ctx.closePath();
  ctx.fill();
  // Arms: long, drooping, clawed.
  ctx.strokeStyle = rgba(fill);
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.055;
  for (const sd of [-1, 1]) {
    const ax = sd * hw * 1.1, ay = top * 0.72;
    const reach = arms * s * (0.55 + 0.1 * Math.sin(t * 1.3 + sd + seed));
    const ex = ax + sd * reach * 0.55, ey = ay + reach * 0.35;
    const hx = ex + sd * reach * 0.2, hy = ey + reach * 0.55;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ex, ey - reach * 0.1, hx, hy); ctx.stroke();
    ctx.lineWidth = s * 0.018;
    for (let c = -1; c <= 1; c++) {
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + sd * s * 0.03 + c * s * 0.02, hy + s * 0.07); ctx.stroke();
    }
    ctx.lineWidth = s * 0.055;
  }
  if (o._rimPass) { ctx.restore(); return; }
  // Eyes.
  ctx.globalCompositeOperation = 'lighter';
  const ey = top * 0.9, blink = sstep(0.9, 0.95, fract(t * 0.23 + hash(seed, 1))) * (1 - sstep(0.95, 1, fract(t * 0.23 + hash(seed, 1))));
  for (const sd of [-1, 1]) {
    glow(ctx, sd * hw * 0.42, ey, s * 0.09, eye, 0.9 * (1 - blink));
    glow(ctx, sd * hw * 0.42, ey, s * 0.03, PAL.white, 0.8 * (1 - blink), 1);
  }
  ctx.restore();
}

// Magic circle used when the Kid holds the demons back.
function drawSigil(ctx, x, y, r, t, c = PAL.cyan, a = 1) {
  if (a <= 0.01) return;
  const circle = (rr) => g => g.arc(x, y, rr, 0, TAU);
  neonStroke(ctx, circle(r), c, 3, a);
  neonStroke(ctx, circle(r * 0.82), c, 1.5, a * 0.8);
  const poly = (k, rr, rotA) => g => {
    for (let i = 0; i <= k; i++) {
      const an = rotA + (i * TAU * 2) / k;
      const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
  };
  neonStroke(ctx, poly(5, r * 0.8, t * 0.5), c, 1.6, a * 0.9);
  neonStroke(ctx, poly(3, r * 0.45, -t * 0.8), c, 1.4, a * 0.7);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 36; i++) {
    const an = i * TAU / 36 + t * 0.3;
    const r0 = r * 0.86, r1 = r * (i % 3 === 0 ? 0.97 : 0.92);
    ctx.strokeStyle = rgba(c, 0.6 * a);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0);
    ctx.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1);
    ctx.stroke();
  }
  glow(ctx, x, y, r * 1.6, c, 0.25 * a);
  ctx.restore();
}

// Heartbeat trace (PQRST) value for phase in [0,1).
function ecgWave(ph) {
  const g = (m, s, a) => a * Math.exp(-Math.pow((ph - m) / s, 2));
  return g(0.18, 0.025, 0.12) + g(0.3, 0.008, -0.1) + g(0.325, 0.009, 1.0) + g(0.35, 0.01, -0.28) + g(0.55, 0.045, 0.22);
}

function drawECG(ctx, t, o = {}) {
  const { y = H * 0.82, amp = 120, bpm = 72, c = PAL.green, a = 1, flat = null, x0 = 0, x1 = W, sweep = 2.6 } = o;
  if (a <= 0.01) return;
  const beat = 60 / bpm;
  const head = fract(t / sweep) * (x1 - x0) + x0;
  const val = tt => {
    if (flat && tt > flat[0] && tt < flat[1]) return 0;
    return ecgWave(fract(tt / beat));
  };
  ctx.save();
  const trail = (x1 - x0) * 0.85;
  const steps = 360;
  // Draw in segments so older parts fade.
  for (let sgi = 0; sgi < 6; sgi++) {
    const fa = (sgi + 1) / 6;
    neonStroke(ctx, g => {
      for (let i = 0; i <= steps / 6; i++) {
        const k = (sgi * steps) / 6 + i;
        const dx = trail * (1 - k / steps);
        let x = head - dx;
        const tt = t - (dx / (x1 - x0)) * sweep;
        if (x < x0) x += x1 - x0;
        const yy = y - val(tt) * amp;
        if (i === 0 || x > head) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
    }, c, 2.2, a * fa * fa);
  }
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, head, y - val(t) * amp, 40, c, a * 0.9, 1);
  ctx.restore();
}

// Perfect maze via recursive backtracker; returns wall segments in grid units.
const _mazeCache = new Map();
function mazeWalls(n, seed) {
  const key = n + '|' + seed;
  if (_mazeCache.has(key)) return _mazeCache.get(key);
  const rnd = mulberry32(seed);
  const vis = new Uint8Array(n * n);
  const right = new Uint8Array(n * n).fill(1), down = new Uint8Array(n * n).fill(1);
  const stack = [0]; vis[0] = 1;
  const path = [];
  const walk = [0];
  while (stack.length) {
    const c = stack[stack.length - 1];
    const cx = c % n, cy = (c / n) | 0;
    const nb = [];
    if (cx > 0 && !vis[c - 1]) nb.push([c - 1, 'l']);
    if (cx < n - 1 && !vis[c + 1]) nb.push([c + 1, 'r']);
    if (cy > 0 && !vis[c - n]) nb.push([c - n, 'u']);
    if (cy < n - 1 && !vis[c + n]) nb.push([c + n, 'd']);
    if (!nb.length) { stack.pop(); if (stack.length) walk.push(stack[stack.length - 1]); continue; }
    const [nx, dir] = nb[Math.floor(rnd() * nb.length)];
    if (dir === 'r') right[c] = 0; if (dir === 'l') right[nx] = 0;
    if (dir === 'd') down[c] = 0; if (dir === 'u') down[nx] = 0;
    vis[nx] = 1; stack.push(nx); path.push(nx); walk.push(nx);
  }
  const segs = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const c = y * n + x;
    if (right[c] && x < n - 1) segs.push([x + 1, y, x + 1, y + 1]);
    if (down[c] && y < n - 1) segs.push([x, y + 1, x + 1, y + 1]);
  }
  segs.push([0, 0, n, 0], [0, 0, 0, n], [n, 0, n, n], [0, n, n, n]);
  const out = { segs, order: path, walk };
  _mazeCache.set(key, out);
  return out;
}

// Diamond (rhombus) sparkle with a 4-point glint.
function drawDiamond(ctx, x, y, s, ang, c, a = 1) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, rgba(PAL.white, 0.95));
  g.addColorStop(0.5, rgba(c, 0.85));
  g.addColorStop(1, rgba(mixc(c, PAL.ink, 0.5), 0.9));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.3); ctx.lineTo(s * 0.85, -s * 0.2); ctx.lineTo(0, s * 1.3); ctx.lineTo(-s * 0.85, -s * 0.2); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(PAL.white, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-s * 0.85, -s * 0.2); ctx.lineTo(s * 0.85, -s * 0.2); ctx.moveTo(0, -s * 1.3); ctx.lineTo(0, s * 1.3); ctx.stroke();
  ctx.restore();
}

function drawGlint(ctx, x, y, s, c = PAL.white, a = 1) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(c, a);
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s * 0.18, y);
  ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s * 0.18, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.moveTo(x - s * 0.7, y); ctx.quadraticCurveTo(x, y, x, y - s * 0.12);
  ctx.quadraticCurveTo(x, y, x + s * 0.7, y); ctx.quadraticCurveTo(x, y, x, y + s * 0.12);
  ctx.quadraticCurveTo(x, y, x - s * 0.7, y);
  ctx.fill();
  glow(ctx, x, y, s * 0.8, c, a * 0.8);
  ctx.restore();
}

// Rear view of a low coupe (original design). Returns nothing; draws at (x, y) = ground center.
function drawCarRear(ctx, x, y, s, t, o = {}) {
  const { brake = 1, plate = '999', kid = true } = o;
  const vib = noise1(t * 30, 3) * s * 0.004;
  ctx.save();
  ctx.translate(x, y + vib);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.06, 0, 0, TAU); ctx.fill();
  // Tires.
  ctx.fillStyle = '#050307';
  ctx.fillRect(-s * 0.56, -s * 0.2, s * 0.17, s * 0.2);
  ctx.fillRect(s * 0.39, -s * 0.2, s * 0.17, s * 0.2);
  // Body.
  const body = new Path2D();
  body.moveTo(-s * 0.6, -s * 0.12);
  body.lineTo(-s * 0.62, -s * 0.3);
  body.quadraticCurveTo(-s * 0.6, -s * 0.4, -s * 0.46, -s * 0.43);
  body.lineTo(-s * 0.33, -s * 0.62);
  body.quadraticCurveTo(0, -s * 0.7, s * 0.33, -s * 0.62);
  body.lineTo(s * 0.46, -s * 0.43);
  body.quadraticCurveTo(s * 0.6, -s * 0.4, s * 0.62, -s * 0.3);
  body.lineTo(s * 0.6, -s * 0.12);
  body.quadraticCurveTo(0, -s * 0.08, -s * 0.6, -s * 0.12);
  const bg = ctx.createLinearGradient(0, -s * 0.7, 0, 0);
  bg.addColorStop(0, '#1a0f22'); bg.addColorStop(0.5, '#0c0712'); bg.addColorStop(1, '#040205');
  ctx.fillStyle = bg;
  ctx.fill(body);
  // Rear window with the Kid's hood silhouette inside.
  const win = new Path2D();
  win.moveTo(-s * 0.4, -s * 0.44); win.lineTo(-s * 0.29, -s * 0.6);
  win.quadraticCurveTo(0, -s * 0.66, s * 0.29, -s * 0.6); win.lineTo(s * 0.4, -s * 0.44); win.closePath();
  const wg = ctx.createLinearGradient(0, -s * 0.66, 0, -s * 0.44);
  wg.addColorStop(0, '#3a1a1a'); wg.addColorStop(1, '#ff6a2a');
  ctx.fillStyle = wg;
  ctx.globalAlpha = 0.55;
  ctx.fill(win);
  ctx.globalAlpha = 1;
  if (kid) {
    ctx.save();
    ctx.clip(win);
    ctx.fillStyle = '#050206';
    ctx.beginPath(); ctx.ellipse(-s * 0.12, -s * 0.5, s * 0.055, s * 0.065, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.12, -s * 0.535, s * 0.075, s * 0.055, 0, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.195, -s * 0.53); ctx.quadraticCurveTo(-s * 0.2, -s * 0.47, -s * 0.18, -s * 0.44); ctx.lineTo(-s * 0.06, -s * 0.44); ctx.quadraticCurveTo(-s * 0.04, -s * 0.47, -s * 0.045, -s * 0.53); ctx.closePath(); ctx.fill();
    ctx.fillRect(-s * 0.22, -s * 0.46, s * 0.2, s * 0.05);
    ctx.restore();
  }
  // Rim highlights from the fire.
  ctx.strokeStyle = 'rgba(255,140,60,0.55)';
  ctx.lineWidth = s * 0.006;
  ctx.stroke(body);
  // Taillight bar.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const tl = s * 0.045;
  for (const sd of [-1, 1]) {
    ctx.fillStyle = rgba(PAL.blood, 0.9);
    ctx.fillRect(sd > 0 ? s * 0.28 : -s * 0.56, -s * 0.33, s * 0.28, tl);
    glow(ctx, sd * s * 0.42, -s * 0.31, s * 0.3 * (0.7 + 0.3 * brake), PAL.blood, 0.7 * brake);
  }
  ctx.fillStyle = rgba(PAL.blood, 0.7);
  ctx.fillRect(-s * 0.28, -s * 0.325, s * 0.56, tl * 0.35);
  ctx.restore();
  // Plate.
  ctx.fillStyle = '#d9d2c5';
  ctx.fillRect(-s * 0.1, -s * 0.24, s * 0.2, s * 0.07);
  ctx.fillStyle = '#120a14';
  ctx.font = `700 ${s * 0.05}px 'Share Tech Mono', monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(plate, 0, -s * 0.203);
  // Exhaust sparks.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 2; i++) {
    const ex = (i ? 1 : -1) * s * 0.2;
    glow(ctx, ex, -s * 0.13, s * (0.05 + 0.03 * Math.abs(noise1(t * 20, i))), PAL.ember, 0.9);
  }
  ctx.restore();
}

// Seatbelt warning glyph.
function drawSeatbeltIcon(ctx, x, y, s, c, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, s * 1.6, c, 0.5);
  ctx.fillStyle = rgba(c, 1);
  ctx.strokeStyle = rgba(c, 1);
  ctx.lineWidth = s * 0.12;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - s * 0.55, s * 0.18, 0, TAU); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y - s * 0.2); ctx.quadraticCurveTo(x, y - s * 0.3, x + s * 0.3, y - s * 0.2);
  ctx.lineTo(x + s * 0.28, y + s * 0.45); ctx.lineTo(x - s * 0.28, y + s * 0.45); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.beginPath(); ctx.moveTo(x - s * 0.25, y - s * 0.22); ctx.lineTo(x + s * 0.26, y + s * 0.35); ctx.stroke();
  ctx.strokeStyle = rgba(c, 1);
  ctx.lineWidth = s * 0.06;
  ctx.beginPath(); ctx.moveTo(x - s * 0.2, y - s * 0.17); ctx.lineTo(x + s * 0.3, y + s * 0.3); ctx.stroke();
  ctx.restore();
}

// Coffin (classic six-sided), seen from the front and slightly above.
function coffinPath(s) {
  const p = new Path2D();
  p.moveTo(0, -s * 0.5);
  p.lineTo(s * 0.17, -s * 0.36);
  p.lineTo(s * 0.12, s * 0.5);
  p.lineTo(-s * 0.12, s * 0.5);
  p.lineTo(-s * 0.17, -s * 0.36);
  p.closePath();
  return p;
}

// Small sailboat hull + sail.
function drawBoat(ctx, x, y, s, ang, o = {}) {
  const { lamp = 1 } = o;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = '#040208';
  ctx.beginPath();
  ctx.moveTo(-s * 0.55, -s * 0.05); ctx.lineTo(s * 0.6, -s * 0.07);
  ctx.quadraticCurveTo(s * 0.5, s * 0.14, s * 0.3, s * 0.16); ctx.lineTo(-s * 0.35, s * 0.16);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.12, -s * 0.55, -s * 0.05);
  ctx.fill();
  ctx.fillRect(-s * 0.02, -s * 0.95, s * 0.025, s * 0.9);
  ctx.beginPath(); ctx.moveTo(s * 0.02, -s * 0.9); ctx.quadraticCurveTo(s * 0.45, -s * 0.5, s * 0.42, -s * 0.12); ctx.lineTo(s * 0.02, -s * 0.12); ctx.closePath();
  ctx.fillStyle = '#0c0714'; ctx.fill();
  ctx.strokeStyle = 'rgba(150,130,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.03, -s * 0.8); ctx.quadraticCurveTo(-s * 0.32, -s * 0.45, -s * 0.3, -s * 0.12); ctx.lineTo(-s * 0.03, -s * 0.12); ctx.closePath();
  ctx.fillStyle = '#08050f'; ctx.fill(); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, s * 0.45, -s * 0.2, s * 0.35, PAL.gold, 0.8 * lamp);
  glow(ctx, s * 0.45, -s * 0.2, s * 0.08, PAL.white, 0.9 * lamp, 1);
  ctx.restore();
}

// Ocean surface height at x for a wave layer.
function waveY(x, t, base, amp, k, speed, seed) {
  return base
    + amp * Math.sin(x * k + t * speed + seed)
    + amp * 0.45 * Math.sin(x * k * 2.3 - t * speed * 1.4 + seed * 2.1)
    + amp * 0.2 * Math.sin(x * k * 5.1 + t * speed * 2.2 + seed * 0.7)
    + amp * 0.35 * noise1(x * k * 0.35 + t * 0.2, seed | 0);
}

// Clock face (used for the restless moment).
function drawClock(ctx, x, y, r, t, spin, c, a = 1) {
  if (a <= 0.01) return;
  neonStroke(ctx, g => g.arc(x, y, r, 0, TAU), c, 2, a);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const an = i * TAU / 12;
    ctx.strokeStyle = rgba(c, 0.8 * a);
    ctx.lineWidth = i % 3 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(an) * r * 0.82, y + Math.sin(an) * r * 0.82);
    ctx.lineTo(x + Math.cos(an) * r * 0.93, y + Math.sin(an) * r * 0.93);
    ctx.stroke();
  }
  ctx.restore();
  const hand = (len, ang, w) => neonStroke(ctx, g => { g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); }, c, w, a);
  hand(r * 0.55, spin * 0.083 - Math.PI / 2, 3);
  hand(r * 0.78, spin - Math.PI / 2, 2);
}
