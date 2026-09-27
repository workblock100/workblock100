'use strict';
// The Kid, drawn in full detail. An original character made for this video: shaggy dark hair
// with a violet streak and a fringe that falls over one eye, a plum bomber jacket over a black
// tee, a silver crescent-moon pendant, gray cargo pants and white high-tops. Cel-shaded vector
// style. Rides on the rig in kid.js (sideJoints / frontJoints), so every pose there works here.

const AC = {
  skin: [124, 80, 56], skinSh: [88, 55, 40], skinHi: [160, 108, 78],
  lip: [112, 66, 62], hair: [20, 16, 26], hairHi: [76, 66, 104], streak: [158, 106, 255],
  tee: [30, 28, 38], teeSh: [18, 16, 26], print: [236, 236, 248],
  jacket: [60, 34, 80], jacketHi: [132, 96, 180], rib: [150, 104, 255],
  pants: [62, 62, 74], pantsHi: [100, 100, 118],
  shoe: [238, 238, 246], sole: [150, 110, 240],
  silver: [216, 220, 234], ink: [10, 6, 16], eye: [236, 228, 220], iris: [46, 28, 22],
};

// Frame time for secondary motion (hair sway, blinks). main.js sets it before each shot.
let LEAD_T = 0;

function leadShade(style) {
  const lit = style.lit === undefined ? 0.6 : style.lit;
  const tint = style.tint || [255, 255, 255];
  const ink = AC.ink;
  return c => rgba([
    lerp(ink[0], (c[0] * tint[0]) / 255, lit),
    lerp(ink[1], (c[1] * tint[1]) / 255, lit),
    lerp(ink[2], (c[2] * tint[2]) / 255, lit),
  ]);
}

// Tapered capsule from a (width w0) to b (width w1).
function taperPath(ctx, a, b, w0, w1) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / L, ny = dx / L, an = Math.atan2(dy, dx);
  ctx.moveTo(a[0] + (nx * w0) / 2, a[1] + (ny * w0) / 2);
  ctx.lineTo(b[0] + (nx * w1) / 2, b[1] + (ny * w1) / 2);
  ctx.arc(b[0], b[1], w1 / 2, an + Math.PI / 2, an - Math.PI / 2, true);
  ctx.lineTo(a[0] - (nx * w0) / 2, a[1] - (ny * w0) / 2);
  ctx.arc(a[0], a[1], w0 / 2, an - Math.PI / 2, an + Math.PI / 2, true);
  ctx.closePath();
}

// ---------------- hair ----------------
// A lock of hair: leaves the scalp and curves under its own weight.
function strandPoints(root, dir, len, bend, sway, n = 6) {
  const pts = [root];
  let a = dir, p = root;
  const side = Math.cos(dir) >= 0 ? 1 : -1;
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    a += side * bend * k * 0.55 + sway * k;
    p = [p[0] + Math.cos(a) * (len / n), p[1] + Math.sin(a) * (len / n)];
    pts.push(p);
  }
  return pts;
}

function drawStrand(ctx, S, C, flat) {
  const { pts, w, streak } = S;
  const n = pts.length - 1;
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6;
    const ww = (w * Math.pow(1 - i / (n + 0.6), 0.8)) / 2;
    L.push([pts[i][0] - (dy / l) * ww, pts[i][1] + (dx / l) * ww]);
    R.push([pts[i][0] + (dy / l) * ww, pts[i][1] - (dx / l) * ww]);
  }
  ctx.beginPath();
  L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = n; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath();
  if (flat) { ctx.fillStyle = flat; ctx.fill(); return; }
  if (streak) {
    const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[n][0], pts[n][1]);
    g.addColorStop(0, C(AC.hair)); g.addColorStop(0.45, C(mixc(AC.hair, AC.streak, 0.7))); g.addColorStop(1, C(AC.streak));
    ctx.fillStyle = g;
  } else ctx.fillStyle = C(AC.hair);
  ctx.fill();
  ctx.strokeStyle = rgba(AC.ink, 0.85);
  ctx.lineWidth = Math.max(0.7, w * 0.07);
  ctx.stroke();
  // Sheen along the lock.
  ctx.strokeStyle = C(streak ? mixc(AC.streak, AC.print, 0.4) : AC.hairHi);
  ctx.lineWidth = Math.max(0.6, w * 0.09);
  ctx.beginPath();
  for (let i = 1; i < n - 1; i++) {
    const x = lerp(L[i][0], pts[i][0], 0.5), y = lerp(L[i][1], pts[i][1], 0.5);
    i === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Layout in head units (1 = half the head height). Returns { back, front } strand lists.
function hairLayout(view, u, seed = 7) {
  const t = LEAD_T;
  const R = mulberry32(seed * 7919);
  const out = { back: [], front: [] };
  let k = 0;
  const scalp = (th, s = 0.9) => [Math.cos(th) * 0.74 * u * s, Math.sin(th) * 0.9 * u * s - 0.1 * u];
  const add = (layer, root, dir, len, bend, w, streak = false) => {
    const sway = noise1(t * 1.1 + k * 0.7, seed + k) * 0.06 + Math.sin(t * 1.9 + k) * 0.012;
    out[layer].push({ pts: strandPoints(root, dir, len * u, bend, sway), w: w * u, streak });
    k++;
  };
  const P = Math.PI;
  if (view === 'front') {
    for (let i = 0; i < 6; i++) { // sides frame the face
      const s = i < 3 ? 1 : -1, q = (i % 3) / 2;
      const th = s > 0 ? lerp(-0.04 * P, -0.24 * P, q) : lerp(-0.96 * P, -0.76 * P, q);
      add('back', scalp(th, 0.96), P / 2 - s * (0.08 + R() * 0.2), 0.95 + R() * 0.35, 0.05, 0.36 + R() * 0.06);
    }
    for (let i = 0; i < 9; i++) { // tousled volume on top
      const th = lerp(-0.18 * P, -0.82 * P, i / 8) + (R() - 0.5) * 0.1;
      add('front', scalp(th, 0.82), lerp(th, -P / 2, 0.25) + (R() - 0.5) * 0.5, 0.5 + R() * 0.28, 1.1 + R() * 0.5, 0.36 + R() * 0.08);
    }
    for (let i = 0; i < 7; i++) { // side-swept fringe over his right eye (screen left)
      const th = lerp(-0.34 * P, -0.64 * P, i / 6);
      add('front', scalp(th, 0.86), lerp(0.66 * P, 0.78 * P, R()), 0.95 + R() * 0.4, 0.28 + R() * 0.2, 0.34 + R() * 0.08, i === 2 || i === 4);
    }
  } else if (view === 'back') {
    for (let i = 0; i < 16; i++) {
      const th = lerp(-0.04 * P, -0.96 * P, i / 15) + (R() - 0.5) * 0.08;
      const dir = lerp(th, P / 2, 0.55) + (R() - 0.5) * 0.3;
      add('front', scalp(th, 0.85), dir, 0.9 + R() * 0.5, 0.25, 0.38 + R() * 0.08, i === 5 || i === 9);
    }
  } else {
    // Profile, facing +x: back strands, crown volume, fringe forward over the brow.
    for (let i = 0; i < 8; i++) {
      const th = lerp(-0.86 * P, -1.16 * P, i / 7);
      add('back', scalp(th, 0.95), P * (0.58 + R() * 0.16), 1.0 + R() * 0.45, 0.08, 0.36 + R() * 0.06);
    }
    for (let i = 0; i < 8; i++) {
      const th = lerp(-0.42 * P, -0.86 * P, i / 7) + (R() - 0.5) * 0.08;
      add('front', scalp(th, 0.84), lerp(th, -P / 2, 0.3) + (R() - 0.5) * 0.5, 0.5 + R() * 0.3, 1.0 + R() * 0.5, 0.38 + R() * 0.08);
    }
    for (let i = 0; i < 6; i++) {
      const th = lerp(-0.26 * P, -0.46 * P, i / 5);
      add('front', scalp(th, 0.9), P * (0.18 + R() * 0.1), 0.85 + R() * 0.35, 0.35 + R() * 0.2, 0.34 + R() * 0.08, i === 2);
    }
  }
  return out;
}

// ---------------- face (head-local coordinates, u = half head height, facing +x in profile) ----------------
function faceParams(pose) {
  const f = pose.face || {};
  const cyc = fract(LEAD_T / 3.7 + (f.seed || 0) * 0.37);
  const blink = cyc > 0.95 ? Math.sin(((cyc - 0.95) / 0.05) * Math.PI) : 0;
  return { eyes: clamp((f.eyes === undefined ? 1 : f.eyes) * (1 - blink)), mouth: f.mouth || 0, look: f.look || 0, nod: f.nod || 0 };
}

const PROFILE = [
  [-0.42, 0.74], [-0.8, 0.34], [-0.88, -0.2], [-0.64, -0.72], [-0.1, -1.0],
  [0.44, -0.86], [0.64, -0.52], [0.7, -0.24], [0.68, -0.1], [0.78, 0.1], [0.86, 0.24],
  [0.82, 0.33], [0.73, 0.35], [0.81, 0.45], [0.76, 0.52], [0.82, 0.6], [0.72, 0.72],
  [0.72, 0.86], [0.56, 0.98], [0.2, 0.92], [-0.12, 0.68],
];

function sideHead(ctx, u, C, flat, fp) {
  const ow = Math.max(0.8, u * 0.045);
  const face = () => { ctx.beginPath(); curveThrough(ctx, PROFILE.map(([x, y]) => [x * u, y * u]), true); };
  face();
  ctx.fillStyle = flat || C(AC.skin);
  ctx.fill();
  if (flat) return;
  ctx.save(); face(); ctx.clip();
  ctx.fillStyle = C(AC.skinSh);
  ctx.beginPath(); ctx.ellipse(-0.55 * u, 0.25 * u, 0.75 * u, 1.05 * u, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = C(AC.skinHi);
  ctx.beginPath(); ctx.ellipse(0.62 * u, -0.45 * u, 0.12 * u, 0.28 * u, -0.3, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow; face(); ctx.stroke();
  ctx.fillStyle = C(AC.skin);
  ctx.beginPath(); ctx.ellipse(-0.16 * u, 0.1 * u, 0.11 * u, 0.19 * u, 0.15, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.lineWidth = ow * 0.7;
  ctx.beginPath(); ctx.arc(-0.16 * u, 0.1 * u, 0.07 * u, -1.2, 1.4); ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = C(AC.hair); ctx.lineWidth = u * 0.07;
  ctx.beginPath(); ctx.moveTo(0.38 * u, -0.26 * u); ctx.quadraticCurveTo(0.52 * u, -0.31 * u, 0.66 * u, -0.24 * u); ctx.stroke();
  const eo = fp.eyes;
  if (eo > 0.15) {
    ctx.fillStyle = rgba(AC.eye);
    ctx.beginPath(); ctx.moveTo(0.4 * u, -0.07 * u); ctx.quadraticCurveTo(0.52 * u, (-0.07 - 0.1 * eo) * u, 0.64 * u, -0.06 * u); ctx.quadraticCurveTo(0.53 * u, (-0.06 + 0.07 * eo) * u, 0.4 * u, -0.07 * u); ctx.fill();
    ctx.fillStyle = rgba(AC.iris);
    ctx.beginPath(); ctx.ellipse(0.58 * u, -0.08 * u, 0.045 * u, 0.06 * u * eo, 0, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow * 1.1;
  if (eo > 0.15) {
    ctx.beginPath(); ctx.moveTo(0.38 * u, -0.08 * u); ctx.quadraticCurveTo(0.52 * u, (-0.08 - 0.1 * eo) * u, 0.66 * u, -0.06 * u); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(0.4 * u, -0.08 * u); ctx.quadraticCurveTo(0.52 * u, -0.01 * u, 0.64 * u, -0.06 * u); ctx.stroke();
    ctx.lineWidth = ow * 0.7;
    ctx.beginPath(); ctx.moveTo(0.58 * u, -0.04 * u); ctx.lineTo(0.62 * u, 0.0); ctx.moveTo(0.52 * u, -0.035 * u); ctx.lineTo(0.54 * u, 0.01 * u); ctx.stroke();
  }
  ctx.lineWidth = ow * 0.8;
  ctx.beginPath(); ctx.arc(0.8 * u, 0.28 * u, 0.055 * u, 0.6, 2.6); ctx.stroke();
  const mo = fp.mouth;
  if (mo > 0.05) {
    ctx.fillStyle = rgba([30, 10, 14]);
    ctx.beginPath(); ctx.ellipse(0.75 * u, 0.53 * u, 0.07 * u, 0.06 * u * mo, 0.2, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = C(AC.lip); ctx.lineWidth = ow;
  ctx.beginPath(); ctx.moveTo(0.63 * u, 0.52 * u); ctx.lineTo(0.78 * u, 0.53 * u); ctx.stroke();
}

function sideHairCap(ctx, u, C, flat) {
  ctx.beginPath();
  ctx.moveTo(0.56 * u, -0.6 * u);
  ctx.quadraticCurveTo(0.3 * u, -1.12 * u, -0.45 * u, -0.98 * u);
  ctx.quadraticCurveTo(-1.02 * u, -0.6 * u, -0.92 * u, 0.12 * u);
  ctx.quadraticCurveTo(-0.82 * u, 0.55 * u, -0.46 * u, 0.66 * u);
  ctx.quadraticCurveTo(-0.34 * u, 0.1 * u, 0.0, -0.22 * u);
  ctx.quadraticCurveTo(0.3 * u, -0.42 * u, 0.56 * u, -0.6 * u);
  ctx.fillStyle = flat || C(AC.hair);
  ctx.fill();
}

function frontFace(ctx, u, C, flat, fp, back) {
  const ow = Math.max(0.8, u * 0.045);
  const facePath = () => {
    ctx.beginPath();
    ctx.moveTo(0, -0.96 * u);
    ctx.bezierCurveTo(0.46 * u, -0.96 * u, 0.63 * u, -0.6 * u, 0.63 * u, -0.12 * u);
    ctx.bezierCurveTo(0.63 * u, 0.32 * u, 0.5 * u, 0.62 * u, 0.22 * u, 0.93 * u);
    ctx.quadraticCurveTo(0, 1.06 * u, -0.22 * u, 0.93 * u);
    ctx.bezierCurveTo(-0.5 * u, 0.62 * u, -0.63 * u, 0.32 * u, -0.63 * u, -0.12 * u);
    ctx.bezierCurveTo(-0.63 * u, -0.6 * u, -0.46 * u, -0.96 * u, 0, -0.96 * u);
    ctx.closePath();
  };
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(s * 0.64 * u, 0.06 * u, 0.11 * u, 0.2 * u, 0, 0, TAU);
    ctx.fillStyle = flat || C(back ? AC.skinSh : AC.skin); ctx.fill();
    if (!flat) { ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow; ctx.stroke(); }
  }
  facePath();
  ctx.fillStyle = flat || C(back ? AC.hair : AC.skin);
  ctx.fill();
  if (flat) return;
  if (back) { ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow; facePath(); ctx.stroke(); return; }
  ctx.save(); facePath(); ctx.clip();
  ctx.fillStyle = C(AC.skinSh);
  ctx.beginPath(); ctx.ellipse(0.6 * u, 0.1 * u, 0.34 * u, 1.1 * u, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 1.05 * u, 0.6 * u, 0.2 * u, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = C(AC.skinHi);
  ctx.beginPath(); ctx.ellipse(-0.34 * u, -0.45 * u, 0.2 * u, 0.14 * u, -0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.02 * u, 0.12 * u, 0.05 * u, 0.16 * u, 0, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow; facePath(); ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = C(AC.hair); ctx.lineWidth = u * 0.08;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(s * 0.11 * u, -0.2 * u); ctx.quadraticCurveTo(s * 0.27 * u, -0.28 * u, s * 0.43 * u, -0.2 * u); ctx.stroke();
  }
  const eo = fp.eyes, lx = fp.look * 0.04 * u;
  for (const s of [-1, 1]) {
    const cx = s * 0.27 * u, cy = -0.03 * u;
    if (eo > 0.15) {
      ctx.fillStyle = rgba(AC.eye);
      ctx.beginPath();
      ctx.moveTo(cx - 0.17 * u, cy); ctx.quadraticCurveTo(cx, cy - 0.16 * u * eo, cx + 0.17 * u, cy);
      ctx.quadraticCurveTo(cx, cy + 0.11 * u * eo, cx - 0.17 * u, cy); ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = rgba(AC.iris);
      ctx.beginPath(); ctx.arc(cx + lx, cy - 0.01 * u, 0.088 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx + lx, cy - 0.01 * u, 0.042 * u, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(cx + lx - 0.03 * u, cy - 0.045 * u, 0.024 * u, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow * 1.3;
    ctx.beginPath(); ctx.moveTo(cx - 0.19 * u, cy + 0.01 * u); ctx.quadraticCurveTo(cx, cy - 0.17 * u * Math.max(eo, 0.05) - 0.01 * u, cx + 0.18 * u, cy); ctx.stroke();
    if (eo <= 0.15) {
      ctx.lineWidth = ow * 0.7;
      ctx.beginPath(); ctx.moveTo(cx + 0.08 * u, cy + 0.01 * u); ctx.lineTo(cx + 0.1 * u, cy + 0.05 * u); ctx.moveTo(cx, cy + 0.02 * u); ctx.lineTo(cx, cy + 0.06 * u); ctx.stroke();
    }
    ctx.strokeStyle = C(AC.skinSh); ctx.lineWidth = ow * 0.7;
    ctx.beginPath(); ctx.moveTo(cx - 0.12 * u, cy + 0.08 * u); ctx.quadraticCurveTo(cx, cy + 0.13 * u, cx + 0.12 * u, cy + 0.08 * u); ctx.stroke();
  }
  ctx.strokeStyle = C(AC.skinSh); ctx.lineWidth = ow;
  ctx.beginPath(); ctx.moveTo(0.07 * u, -0.02 * u); ctx.quadraticCurveTo(0.1 * u, 0.14 * u, 0.11 * u, 0.22 * u); ctx.stroke();
  ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow;
  ctx.beginPath();
  ctx.moveTo(-0.17 * u, 0.26 * u); ctx.quadraticCurveTo(-0.21 * u, 0.35 * u, -0.09 * u, 0.35 * u);
  ctx.quadraticCurveTo(0, 0.4 * u, 0.09 * u, 0.35 * u); ctx.quadraticCurveTo(0.21 * u, 0.35 * u, 0.17 * u, 0.26 * u);
  ctx.stroke();
  ctx.fillStyle = rgba([40, 18, 16]);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 0.075 * u, 0.335 * u, 0.035 * u, 0.02 * u, s * 0.3, 0, TAU); ctx.fill(); }
  const mo = fp.mouth;
  const my = 0.6 * u;
  if (mo > 0.04) {
    ctx.fillStyle = rgba([34, 10, 14]);
    ctx.beginPath(); ctx.ellipse(0, my + 0.03 * u, 0.14 * u, 0.1 * u * mo + 0.01 * u, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba([235, 230, 225]);
    ctx.fillRect(-0.09 * u, my - 0.02 * u, 0.18 * u, 0.035 * u * mo);
  }
  ctx.fillStyle = C(AC.lip);
  ctx.beginPath();
  ctx.moveTo(-0.2 * u, my);
  ctx.quadraticCurveTo(-0.09 * u, my - 0.08 * u, 0, my - 0.05 * u);
  ctx.quadraticCurveTo(0.09 * u, my - 0.08 * u, 0.2 * u, my);
  ctx.quadraticCurveTo(0.09 * u, my - 0.01 * u, -0.2 * u, my);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.18 * u, my + 0.03 * u * mo);
  ctx.quadraticCurveTo(0, my + 0.1 * u * mo + 0.02 * u, 0.18 * u, my + 0.03 * u * mo);
  ctx.quadraticCurveTo(0, my + 0.16 * u + 0.1 * u * mo, -0.18 * u, my + 0.03 * u * mo);
  ctx.fill();
  ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow * 0.9;
  ctx.beginPath(); ctx.moveTo(-0.19 * u, my + 0.01 * u); ctx.quadraticCurveTo(0, my + 0.04 * u + 0.08 * u * mo, 0.19 * u, my + 0.01 * u); ctx.stroke();
}

function frontHairCap(ctx, u, C, flat, back) {
  ctx.beginPath();
  if (back) {
    ctx.ellipse(0, -0.1 * u, 0.78 * u, 0.98 * u, 0, 0, TAU);
  } else {
    ctx.moveTo(-0.7 * u, 0.1 * u);
    ctx.bezierCurveTo(-0.84 * u, -0.8 * u, -0.4 * u, -1.12 * u, 0, -1.12 * u);
    ctx.bezierCurveTo(0.4 * u, -1.12 * u, 0.84 * u, -0.8 * u, 0.7 * u, 0.1 * u);
    ctx.quadraticCurveTo(0.64 * u, -0.4 * u, 0.4 * u, -0.5 * u);
    ctx.quadraticCurveTo(0.1 * u, -0.6 * u, -0.2 * u, -0.5 * u);
    ctx.quadraticCurveTo(-0.62 * u, -0.4 * u, -0.7 * u, 0.1 * u);
    ctx.closePath();
  }
  ctx.fillStyle = flat || C(AC.hair);
  ctx.fill();
}

// Silver crescent-moon pendant.
function drawMoonPendant(ctx, x, y, s, C, flat) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.clip();
  ctx.beginPath();
  ctx.rect(x - s * 2, y - s * 2, s * 4, s * 4);
  ctx.arc(x + s * 0.5, y - s * 0.3, s * 0.85, 0, TAU, true);
  ctx.fillStyle = flat || C(AC.silver);
  ctx.fill();
  ctx.restore();
  if (!flat && s > 4) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x - s * 0.5, y + s * 0.3, s * 1.6, [200, 210, 255], 0.35);
    ctx.restore();
  }
}

// Hand seen from the back: palm, finger breaks, thumb. dir = angle the hand points (radians).
function drawHand(ctx, wrist, dir, s, C, flat, mirror = 1) {
  ctx.save();
  ctx.translate(wrist[0], wrist[1]);
  ctx.rotate(dir);
  ctx.scale(1, mirror);
  ctx.beginPath();
  ctx.moveTo(0, -0.24 * s);
  ctx.quadraticCurveTo(0.5 * s, -0.3 * s, 0.9 * s, -0.2 * s);
  ctx.quadraticCurveTo(1.08 * s, 0, 0.9 * s, 0.2 * s);
  ctx.quadraticCurveTo(0.5 * s, 0.28 * s, 0.3 * s, 0.26 * s);
  ctx.quadraticCurveTo(0.42 * s, 0.46 * s, 0.26 * s, 0.5 * s);
  ctx.quadraticCurveTo(0.08 * s, 0.4 * s, 0, 0.24 * s);
  ctx.closePath();
  ctx.fillStyle = flat || C(AC.skin);
  ctx.fill();
  if (!flat) {
    ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = Math.max(0.7, s * 0.05); ctx.stroke();
    ctx.strokeStyle = C(AC.skinSh); ctx.lineWidth = Math.max(0.6, s * 0.035);
    ctx.beginPath();
    for (const k of [-0.1, 0, 0.1]) { ctx.moveTo(0.66 * s, k * s * 1.4); ctx.lineTo(0.98 * s, k * s * 1.2); }
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------- full figure ----------------
function leadSide(ctx, J, h, pose, C, flat) {
  const f = J.f, ow = Math.max(1, h * 0.0042);
  const fp = faceParams(pose);
  const u = 0.0725 * h;
  const fillPart = (col, pathFn, outline = true) => {
    ctx.beginPath(); pathFn();
    ctx.fillStyle = flat || C(col); ctx.fill();
    if (outline && !flat) { ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow; ctx.stroke(); }
  };
  const inHead = fn => { ctx.save(); ctx.translate(J.head[0], J.head[1]); ctx.rotate(J.ha * f); ctx.scale(f, 1); fn(); ctx.restore(); };
  const hair = hairLayout('side', u);
  inHead(() => { for (const S of hair.back) drawStrand(ctx, S, C, flat); });
  const arm = A => {
    fillPart(AC.jacket, () => taperPath(ctx, J.shoulder, A.elbow, 0.076 * h, 0.066 * h));
    fillPart(AC.jacket, () => taperPath(ctx, A.elbow, A.hand, 0.066 * h, 0.058 * h));
    if (!flat) {
      ctx.strokeStyle = C(AC.jacketHi); ctx.lineWidth = ow * 1.2;
      ctx.beginPath(); ctx.moveTo(J.shoulder[0], J.shoulder[1] - 0.02 * h); ctx.lineTo(lerp(J.shoulder[0], A.elbow[0], 0.85), lerp(J.shoulder[1], A.elbow[1], 0.85) - 0.02 * h); ctx.stroke();
      ctx.strokeStyle = C(AC.rib); ctx.lineWidth = 0.014 * h;
      const cx = lerp(A.elbow[0], A.hand[0], 0.9), cy = lerp(A.elbow[1], A.hand[1], 0.9);
      const an = Math.atan2(A.hand[1] - A.elbow[1], A.hand[0] - A.elbow[0]);
      ctx.beginPath(); ctx.moveTo(cx - Math.sin(an) * 0.028 * h, cy + Math.cos(an) * 0.028 * h); ctx.lineTo(cx + Math.sin(an) * 0.028 * h, cy - Math.cos(an) * 0.028 * h); ctx.stroke();
    }
    drawHand(ctx, A.hand, Math.atan2(A.hand[1] - A.elbow[1], A.hand[0] - A.elbow[0]), 0.062 * h, C, flat, f);
  };
  const leg = L => {
    fillPart(AC.pants, () => taperPath(ctx, [0, 0], L.knee, 0.112 * h, 0.09 * h));
    fillPart(AC.pants, () => taperPath(ctx, L.knee, L.ankle, 0.09 * h, 0.08 * h));
    if (!flat) {
      // Cargo pocket on the thigh.
      const px = lerp(0, L.knee[0], 0.55), py = lerp(0, L.knee[1], 0.55);
      ctx.fillStyle = C(AC.pantsHi);
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(L.knee[1], L.knee[0]) - Math.PI / 2);
      ctx.fillRect(-0.026 * h, -0.03 * h, 0.052 * h, 0.06 * h);
      ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow * 0.8; ctx.strokeRect(-0.026 * h, -0.03 * h, 0.052 * h, 0.06 * h);
      ctx.restore();
    }
    const fa = L.a2 * 0.3;
    const heel = [L.ankle[0] - f * 0.035 * h, L.ankle[1] + 0.025 * h];
    const toe = [L.ankle[0] + Math.cos(fa) * f * 0.09 * h, L.ankle[1] + 0.035 * h + Math.sin(fa) * 0.02 * h];
    fillPart(AC.shoe, () => taperPath(ctx, heel, toe, 0.066 * h, 0.052 * h));
    if (!flat) { ctx.strokeStyle = C(AC.sole); ctx.lineWidth = h * 0.012; ctx.beginPath(); ctx.moveTo(heel[0], heel[1] + 0.026 * h); ctx.lineTo(toe[0], toe[1] + 0.02 * h); ctx.stroke(); }
  };
  arm(J.AB);
  leg(J.B);
  const top = [J.neck[0] - J.up[0] * 0.04 * h, J.neck[1] - J.up[1] * 0.04 * h];
  const hem = [-J.up[0] * 0.035 * h, -J.up[1] * 0.035 * h];
  fillPart(AC.jacket, () => taperPath(ctx, hem, top, 0.17 * h, 0.15 * h));
  if (!flat) {
    ctx.save();
    ctx.beginPath(); taperPath(ctx, hem, top, 0.17 * h, 0.15 * h); ctx.clip();
    ctx.strokeStyle = C(AC.tee); ctx.lineWidth = 0.03 * h;
    ctx.beginPath(); ctx.moveTo(top[0] + f * 0.07 * h, top[1] + 0.01 * h); ctx.lineTo(hem[0] + f * 0.078 * h, hem[1]); ctx.stroke();
    ctx.strokeStyle = C(AC.rib); ctx.lineWidth = 0.02 * h;
    ctx.beginPath(); ctx.moveTo(hem[0] - 0.1 * h, hem[1] + 0.012 * h); ctx.lineTo(hem[0] + 0.1 * h, hem[1] + 0.012 * h); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = C(AC.silver); ctx.lineWidth = Math.max(1, h * 0.004);
    const cx0 = J.neck[0] + f * 0.03 * h, cy0 = J.neck[1] + 0.005 * h;
    ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.quadraticCurveTo(cx0 + f * 0.05 * h, cy0 + 0.04 * h, cx0 + f * 0.064 * h, cy0 + 0.08 * h); ctx.stroke();
    drawMoonPendant(ctx, cx0 + f * 0.066 * h, cy0 + 0.095 * h, 0.014 * h, C, flat);
  }
  leg(J.F);
  fillPart(AC.skin, () => taperPath(ctx, J.neck, [lerp(J.neck[0], J.head[0], 0.6), lerp(J.neck[1], J.head[1], 0.6)], 0.06 * h, 0.06 * h));
  if (!flat) {
    // Ribbed collar.
    ctx.strokeStyle = C(AC.rib); ctx.lineWidth = 0.016 * h;
    ctx.beginPath(); ctx.moveTo(J.neck[0] - f * 0.035 * h, J.neck[1] + 0.005 * h); ctx.lineTo(J.neck[0] + f * 0.035 * h, J.neck[1] + 0.012 * h); ctx.stroke();
  }
  inHead(() => {
    sideHead(ctx, u, C, flat, fp);
    sideHairCap(ctx, u, C, flat);
    for (const S of hair.front) drawStrand(ctx, S, C, flat);
  });
  arm(J.AF);
}

function leadFront(ctx, J, h, pose, C, flat) {
  const ow = Math.max(1, h * 0.0042);
  const back = !!pose.back;
  const fp = faceParams(pose);
  const u = 0.0725 * h;
  const fillPart = (col, pathFn, outline = true) => {
    ctx.beginPath(); pathFn();
    ctx.fillStyle = flat || C(col); ctx.fill();
    if (outline && !flat) { ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow; ctx.stroke(); }
  };
  const inHead = fn => { ctx.save(); ctx.translate(J.head[0], J.head[1] + (fp.nod || 0) * 0.01 * h); ctx.rotate(pose.tilt * 0.6); fn(); ctx.restore(); };
  const hair = hairLayout(back ? 'back' : 'front', u);
  if (!back) inHead(() => { for (const S of hair.back) drawStrand(ctx, S, C, flat); });
  [J.L, J.R].forEach((Lg, i) => {
    const sd = i ? 1 : -1;
    fillPart(AC.pants, () => taperPath(ctx, Lg.hip, Lg.knee, 0.11 * h, 0.092 * h));
    fillPart(AC.pants, () => taperPath(ctx, Lg.knee, Lg.ankle, 0.094 * h, 0.086 * h));
    if (!flat) {
      ctx.fillStyle = C(AC.pantsHi);
      const px = lerp(Lg.hip[0], Lg.knee[0], 0.55) + sd * 0.03 * h, py = lerp(Lg.hip[1], Lg.knee[1], 0.55);
      ctx.fillRect(px - 0.02 * h, py - 0.03 * h, 0.04 * h, 0.055 * h);
      ctx.strokeStyle = rgba(AC.ink); ctx.lineWidth = ow * 0.8; ctx.strokeRect(px - 0.02 * h, py - 0.03 * h, 0.04 * h, 0.055 * h);
    }
    // High-tops.
    fillPart(AC.shoe, () => ctx.ellipse(Lg.ankle[0] + sd * 0.01 * h, Lg.ankle[1] + 0.025 * h, 0.052 * h, 0.038 * h, sd * 0.1, 0, TAU));
    if (!flat) { ctx.fillStyle = C(AC.sole); ctx.fillRect(Lg.ankle[0] + sd * 0.01 * h - 0.05 * h, Lg.ankle[1] + 0.047 * h, 0.1 * h, 0.014 * h); }
  });
  const n = J.neck;
  const body = () => {
    ctx.moveTo(n[0] - 0.05 * h, n[1] - 0.012 * h);
    ctx.quadraticCurveTo(n[0] - 0.12 * h, n[1] - 0.002 * h, n[0] - 0.136 * h, n[1] + 0.055 * h);
    ctx.quadraticCurveTo(n[0] - 0.146 * h, n[1] + 0.13 * h, n[0] - 0.126 * h, n[1] + 0.2 * h);
    ctx.lineTo(-0.118 * h, 0.04 * h);
    ctx.quadraticCurveTo(0, 0.06 * h, 0.118 * h, 0.04 * h);
    ctx.lineTo(n[0] + 0.126 * h, n[1] + 0.2 * h);
    ctx.quadraticCurveTo(n[0] + 0.146 * h, n[1] + 0.13 * h, n[0] + 0.136 * h, n[1] + 0.055 * h);
    ctx.quadraticCurveTo(n[0] + 0.12 * h, n[1] - 0.002 * h, n[0] + 0.05 * h, n[1] - 0.012 * h);
    ctx.closePath();
  };
  fillPart(AC.jacket, body);
  if (!flat) {
    ctx.save();
    ctx.beginPath(); body(); ctx.clip();
    if (!back) {
      // Black tee down the open front, with a small star print.
      ctx.fillStyle = C(AC.tee);
      ctx.beginPath();
      ctx.moveTo(n[0] - 0.05 * h, n[1] - 0.02 * h); ctx.lineTo(n[0] + 0.05 * h, n[1] - 0.02 * h);
      ctx.lineTo(0.05 * h, 0.08 * h); ctx.lineTo(-0.05 * h, 0.08 * h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C(AC.print);
      starPath(ctx, n[0] - 0.012 * h, n[1] + 0.15 * h, 0.018 * h); ctx.fill();
      // Zipper edges.
      ctx.strokeStyle = C(AC.silver); ctx.lineWidth = ow;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(n[0] + s * 0.05 * h, n[1] + 0.01 * h); ctx.lineTo(s * 0.05 * h, 0.03 * h); ctx.stroke(); }
      // Jacket shading on the far side.
      ctx.fillStyle = C(mixc(AC.jacket, AC.ink, 0.35));
      ctx.beginPath(); ctx.ellipse(n[0] + 0.14 * h, n[1] + 0.16 * h, 0.05 * h, 0.2 * h, 0, 0, TAU); ctx.fill();
    } else {
      ctx.strokeStyle = C(AC.jacketHi); ctx.lineWidth = ow * 1.5;
      ctx.beginPath(); ctx.moveTo(n[0], n[1] + 0.03 * h); ctx.lineTo(0, 0.04 * h); ctx.stroke();
    }
    // Ribbed hem band.
    ctx.fillStyle = C(AC.rib);
    ctx.beginPath(); ctx.moveTo(-0.12 * h, 0.018 * h); ctx.quadraticCurveTo(0, 0.04 * h, 0.12 * h, 0.018 * h); ctx.lineTo(0.12 * h, 0.05 * h); ctx.quadraticCurveTo(0, 0.07 * h, -0.12 * h, 0.05 * h); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  [J.AL, J.AR].forEach((A, i) => {
    const sd = i ? 1 : -1;
    fillPart(AC.jacket, () => taperPath(ctx, A.sh, A.elbow, 0.078 * h, 0.068 * h));
    fillPart(AC.jacket, () => taperPath(ctx, A.elbow, A.hand, 0.068 * h, 0.06 * h));
    const an = Math.atan2(A.hand[1] - A.elbow[1], A.hand[0] - A.elbow[0]);
    if (!flat) {
      ctx.strokeStyle = C(AC.jacketHi); ctx.lineWidth = ow * 1.2;
      ctx.beginPath(); ctx.moveTo(A.sh[0] + sd * 0.022 * h, A.sh[1]); ctx.lineTo(A.elbow[0] + sd * 0.02 * h, A.elbow[1]); ctx.lineTo(A.hand[0] + sd * 0.016 * h, A.hand[1]); ctx.stroke();
      ctx.strokeStyle = C(AC.rib); ctx.lineWidth = 0.014 * h;
      const cx = lerp(A.elbow[0], A.hand[0], 0.9), cy = lerp(A.elbow[1], A.hand[1], 0.9);
      ctx.beginPath(); ctx.moveTo(cx - Math.sin(an) * 0.029 * h, cy + Math.cos(an) * 0.029 * h); ctx.lineTo(cx + Math.sin(an) * 0.029 * h, cy - Math.cos(an) * 0.029 * h); ctx.stroke();
    }
    drawHand(ctx, A.hand, an, 0.064 * h, C, flat, i ? -1 : 1);
  });
  fillPart(AC.skin, () => taperPath(ctx, [n[0], n[1] + 0.01 * h], [J.head[0], J.head[1] + 0.04 * h], 0.062 * h, 0.058 * h));
  if (!flat) {
    // Ribbed collar ring.
    ctx.strokeStyle = C(AC.rib); ctx.lineWidth = 0.016 * h;
    ctx.beginPath(); ctx.ellipse(n[0], n[1] - 0.004 * h, 0.05 * h, 0.014 * h, 0, back ? Math.PI : 0, back ? TAU : Math.PI); ctx.stroke();
    if (!back) {
      ctx.fillStyle = C(AC.skinSh);
      ctx.beginPath(); ctx.ellipse(J.head[0], J.head[1] + 0.068 * h, 0.03 * h, 0.01 * h, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = C(AC.silver); ctx.lineWidth = Math.max(1, h * 0.0035);
      ctx.beginPath(); ctx.moveTo(n[0] - 0.035 * h, n[1] - 0.004 * h); ctx.quadraticCurveTo(n[0], n[1] + 0.12 * h, n[0] + 0.035 * h, n[1] - 0.004 * h); ctx.stroke();
      drawMoonPendant(ctx, n[0], n[1] + 0.07 * h, 0.014 * h, C, flat);
    }
  }
  inHead(() => {
    frontFace(ctx, u, C, flat, fp, back);
    frontHairCap(ctx, u, C, flat, back);
    for (const S of hair.front) drawStrand(ctx, S, C, flat);
  });
}

function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

// Close-up head in profile (used for the diamond burst). size = full head height in px.
function drawKidHead(ctx, x, y, size, pose, style = {}) {
  const C = leadShade(style);
  const u = size / 2;
  const fp = faceParams(pose);
  const hair = hairLayout('side', u, 11);
  const f = pose.facing || 1;
  const all = (fl) => {
    for (const S of hair.back) drawStrand(ctx, S, C, fl);
    sideHead(ctx, u, C, fl, fp);
    sideHairCap(ctx, u, C, fl);
    for (const S of hair.front) drawStrand(ctx, S, C, fl);
  };
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((pose.tilt || 0) * f);
  ctx.scale(f, 1);
  if (style.rim) {
    ctx.save();
    ctx.translate((style.rim.dx || 0) * size * 6, (style.rim.dy || 0) * size * 6);
    all(rgba(style.rim.c, style.rim.a === undefined ? 1 : style.rim.a));
    ctx.restore();
  }
  all(null);
  ctx.restore();
}
