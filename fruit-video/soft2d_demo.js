/* soft2d_demo.js: the SOFT2D cases on a 1080x1920 canvas. soft2d_demo.html?case=drape&t=2.4 (or &sheet=0.5,1,2 for a contact sheet).
 * Each case's build() is DOM-free (soft2d_test.js reuses them in node); draw(ctx, st) paints a frame from w.at(t). */
(function () {
'use strict';
const S = (typeof window !== 'undefined' && window.SOFT2D) || require('./soft2d.js');
const CASES = {};

function floorBand(ctx, y, view, col) {   // a table / cart top seen with the view's tilt
  const ky = view ? view.ky : 0;
  ctx.fillStyle = col || '#b9c2cf'; ctx.fillRect(0, y - 220 * ky, 1080, 1920);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, y + 220 * ky, 1080, 10);
}
function boxFaces(ctx, x, y, hw, hh, hd, view, col, face) {   // a box of half sizes hw, hh, hd at (x, y, 0): top face then front face
  const ky = view ? view.ky : 0, top = y - hh, bot = y + hh;
  ctx.fillStyle = col || '#e8d7b0';
  ctx.beginPath(); ctx.moveTo(x - hw, top - ky * hd); ctx.lineTo(x + hw, top - ky * hd); ctx.lineTo(x + hw, top + ky * hd); ctx.lineTo(x - hw, top + ky * hd); ctx.closePath(); ctx.fill();
  ctx.fillStyle = face || '#d4be8e'; ctx.fillRect(x - hw, top + ky * hd, 2 * hw, bot - top);
  ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 3; ctx.strokeRect(x - hw, top + ky * hd, 2 * hw, bot - top);
  ctx.beginPath(); ctx.moveTo(x - hw, top + ky * hd); ctx.lineTo(x - hw, top - ky * hd); ctx.lineTo(x + hw, top - ky * hd); ctx.lineTo(x + hw, top + ky * hd); ctx.stroke();
}
const VIEW = { kx: 0, ky: 0.42 };

// a Chux pad dropped flat over a small box: it drapes in depth (front, back, side flaps, cone folds at the corners)
CASES.drape = { T: 3, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 22 });
  const top = 1250, bw = 90, bh = 60, bd = 70;
  w.collider({ floor: top, mat: 'metal', tag: 'cart' });
  w.collider({ box: [bw, bh], x: 540, y: top - bh, depth: 2 * bd, mat: 'cardboard', tag: 'box' });
  w.cloth({ cx: 540, y: top - 2 * bh - 120, width: 340, height: 340, cols: 22, rows: 22, plane: 'xz', mat: 'chux', tag: 'chux' });
  w.run(this.T);
  return { w: w, draw: function (ctx, st) {
    floorBand(ctx, top, VIEW);
    S.drawCloth(ctx, st.cloths[0], { fill: '#4f86d9', back: '#e9eef5', quilt: 1, shade: 0.45, view: VIEW, zMax: -bd, edge: { color: '#2f5aa0', width: 2 } });
    boxFaces(ctx, 540, top - bh, bw, bh, bd, VIEW);
    S.drawCloth(ctx, st.cloths[0], { fill: '#4f86d9', back: '#e9eef5', quilt: 1, shade: 0.45, view: VIEW, zMin: -bd, edge: { color: '#2f5aa0', width: 2 } });
  } };
} };

// the wrap: the pad drapes over a box held in the air, then moving pins fold the four flaps down and under it
CASES.wrap = { T: 4, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 22 });
  const cy = 1050, bw = 90, bh = 60, bd = 70, n = 18;
  w.collider({ box: [bw, bh], x: 540, y: cy, depth: 2 * bd, mat: 'cardboard', tag: 'box' });
  const pad = w.cloth({ cx: 540, y: cy - bh - 90, width: 330, height: 330, cols: n, rows: n, plane: 'xz', mat: 'chux', tag: 'chux' });
  const under = cy + bh + 6, ease = function (t, a, b) { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
  // fold left and right flaps first (1.2-2.0 s), then front and back (2.2-3.0 s): each edge row of particles is carried under the box
  const fold = function (side, t0) {
    for (let k = 1; k < n - 1; k++) {
      const i = side === 'L' ? 0 : (side === 'R' ? n - 1 : k), j = side === 'B' ? 0 : (side === 'F' ? n - 1 : k), idx = pad.index(i, j);
      const sx = side === 'L' ? -1 : (side === 'R' ? 1 : 0), sz = side === 'B' ? -1 : (side === 'F' ? 1 : 0);
      const along = (k / (n - 1) - 0.5);
      const tx = 540 + (sx ? sx * bw * 0.55 : along * 2 * bw * 0.9), tz = sz ? sz * bd * 0.55 : along * 2 * bd * 0.9;
      w.schedule(t0, function (w) {
        const x0 = w.x[w.object(pad.id).p0 + idx], y0 = w.y[w.object(pad.id).p0 + idx], z0 = w.z[w.object(pad.id).p0 + idx];
        w.pin(pad.id, idx, function (t) { const e = ease(t, t0, t0 + 0.8); return [x0 + (tx - x0) * e, y0 + (under - y0) * e - 40 * S.sin(Math.PI * e), z0 + (tz - z0) * e]; }, { until: 99 });
      });
    }
  };
  fold('L', 1.2); fold('R', 1.2); fold('B', 2.2); fold('F', 2.2);
  w.run(this.T);
  return { w: w, draw: function (ctx, st) {
    ctx.fillStyle = '#cfd6e0'; ctx.fillRect(0, 1250, 1080, 700);
    S.drawCloth(ctx, st.cloths[0], { fill: '#4f86d9', back: '#e9eef5', quilt: 1, shade: 0.45, view: VIEW, zMax: -bd, edge: { color: '#2f5aa0', width: 2 } });
    boxFaces(ctx, 540, cy, bw, bh, bd, VIEW);
    S.drawCloth(ctx, st.cloths[0], { fill: '#4f86d9', back: '#e9eef5', quilt: 1, shade: 0.45, view: VIEW, zMin: -bd, edge: { color: '#2f5aa0', width: 2 } });
  } };
} };

// wrapping paper on a gift's front, pinned round the border; a hand (a group of pins) grabs the top-right corner and rips it off
function giftPrint(ctx, W, H) {
  ctx.fillStyle = '#c62828'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e53935'; for (let x = -H; x < W; x += 46) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x + 18 + H, H); ctx.lineTo(x + H, H); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#f6e7a1'; for (let y = 20; y < H; y += 46) for (let x = 20 + ((y / 46) & 1) * 23; x < W; x += 46) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
}
CASES.tear = { T: 3, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 7 });
  const x0 = 300, y0 = 760, W = 480, H = 420, cols = 24, rows = 21;
  w.collider({ floor: 1400, mat: 'wood', tag: 'table' });
  const grab = [];   // the corner the hand holds
  for (let i = cols - 3; i < cols; i++) for (let j = 0; j < 3; j++) grab.push(i + ',' + j);
  const pins = [];   // the border, as if folded round the box edges (the grabbed corner excepted)
  for (let i = 0; i < cols; i++) for (const j of [0, rows - 1]) if (grab.indexOf(i + ',' + j) < 0) pins.push({ i: i, j: j });
  for (let j = 1; j < rows - 1; j++) for (const i of [0, cols - 1]) if (grab.indexOf(i + ',' + j) < 0) pins.push({ i: i, j: j });
  const paper = w.cloth({ x: x0, y: y0, width: W, height: H, cols: cols, rows: rows, mat: 'paper', tag: 'wrap', gravityScale: 0, collide: [w.colliders[0].id], pins: pins,
    tear: { strain: 1.8, jag: 0.4 } });   // physical tearing only as a safety valve: the rip path does the work
  const dx = W / (cols - 1), dy = H / (rows - 1);
  for (const g of grab) {
    const gi = +g.split(',')[0], gj = +g.split(',')[1], gx = x0 + gi * dx, gy = y0 + gj * dy;
    w.pin(paper.id, paper.index(gi, gj), function (t) { const u = Math.max(0, Math.min(1, (t - 0.4) / 1.0)), e = u * u * u; return [gx - 430 * e, gy + 520 * e - 160 * S.sin(Math.PI * e), 40 * S.sin(Math.PI * Math.min(1, u * 1.4))]; }, { until: 1.45 });
  }
  // the rip runs from the top edge down to the right edge while the hand pulls: a flap comes away
  w.rip(paper.id, { path: [[0.42, 0], [0.62, 0.45], [1, 0.78]], t0: 0.42, t1: 0.72, jag: 0.6 });   // the rip leads the hand
  w.schedule(0.4, function (w) { w.set(paper.id, { gravityScale: 1 }); });
  w.schedule(0.4, function (w) {   // the flap's edges come off the box (top edge right of the rip, right edge above it)
    for (let i = Math.round(0.42 * (cols - 1)) + 1; i < cols; i++) w.unpin(paper.id, paper.index(i, 0));
    for (let j = 0; j < Math.round(0.78 * (rows - 1)); j++) w.unpin(paper.id, paper.index(cols - 1, j));
  });
  w.run(this.T);
  return { w: w, draw: function (ctx, st) {
    ctx.fillStyle = '#7d5a3c'; ctx.fillRect(0, 1400, 1080, 520);
    ctx.fillStyle = '#ece3cf'; ctx.fillRect(x0, y0, W, H); ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, W, H);
    ctx.fillStyle = '#6b5a3a'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('A CANDLE', x0 + W / 2, y0 + H / 2 + 16);
    S.drawCloth(ctx, st.cloths[0], { fill: giftPrint, back: '#f7f2e6', shade: 0.3, ragged: 1 });
  } };
} };

// a canvas gait belt: buckle end on the body's left, the free end carried under and round, then tugged snug
CASES.belt = { T: 3, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 3 });
  const cx = 540, cy = 1000, R = 170;
  const body = w.collider({ circle: R, x: cx, y: cy, mat: 'fabric', tag: 'santa' });
  const belt = w.rope({ from: [cx - R - 14, cy], to: [cx - R - 14, cy + 600], segments: 40, width: 30, mat: 'canvas', tag: 'gaitbelt',
    pins: [{ k: 0, to: { collider: body.id, local: [-R - 14, 0] } }] });
  const path = function (t) {   // the hand: down, under the body, up the right side, then a tug out to the right
    const a = Math.min(1, Math.max(0, (t - 0.2) / 1.4)), ang = Math.PI * (1 - a * 1.0), rr = R + 60;
    if (t < 1.8) return [cx + rr * S.cos(ang), cy + rr * S.sin(ang) * (a > 0 ? 1 : 0) + (a > 0 ? 0 : 600 * (1 - t / 0.2) * 0)];
    const u = Math.min(1, (t - 1.8) / 0.4); return [cx + rr + 90 * u * u, cy - 40 * u];
  };
  w.pin(belt.id, -1, path, { from: 0.2 });
  w.run(this.T);
  return { w: w, draw: function (ctx, st) {
    ctx.fillStyle = '#e9e2d8'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#d23a2e'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 18, cy - R, 36, 2 * R);
    S.drawRope(ctx, st.ropes[0], { style: 'belt', width: 30, color: '#4a6fa5', buckle: true });
  } };
} };

// a Hoyer sling: a fabric strip hung from two hooks; a body (kinematic circle) settles into it, then the boom lifts
CASES.sling = { T: 3.5, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 5 });
  const cols = 26, rows = 5, L = 620, Wd = 90, hx0 = 540 - 230, hx1 = 540 + 230, hy = 700;
  const lift = function (t) { const u = Math.min(1, Math.max(0, (t - 2.0) / 1.2)); return -160 * u * u * (3 - 2 * u); };
  const body = w.collider({ circle: 150, x: 540, y: 600, mat: 'fabric', tag: 'santa', pose: function (t) { const u = Math.min(1, t / 1.4); return { x: 540, y: 560 + 470 * (u * (2 - u)) + lift(t), angle: 0 }; } });
  const sling = w.cloth({ x: 540 - L / 2, y: hy, width: L, height: Wd, cols: cols, rows: rows, mat: 'fabric', tag: 'sling', collide: [body.id] });
  for (let j = 0; j < rows; j++) {
    const off = (j - (rows - 1) / 2) * 8;
    w.pin(sling.id, sling.index(0, j), function (t) { return [hx0 + off * 0.3, hy + off + lift(t)]; });
    w.pin(sling.id, sling.index(cols - 1, j), function (t) { return [hx1 - off * 0.3, hy + off + lift(t)]; });
  }
  w.run(this.T);
  return { w: w, draw: function (ctx, st) {
    ctx.fillStyle = '#e9e2d8'; ctx.fillRect(0, 0, 1080, 1920);
    const ly = lift(st.t);
    ctx.strokeStyle = '#59606b'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(hx0 - 40, hy - 60 + ly); ctx.lineTo(hx1 + 40, hy - 60 + ly); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx0, hy - 60 + ly); ctx.lineTo(hx0, hy + ly); ctx.moveTo(hx1, hy - 60 + ly); ctx.lineTo(hx1, hy + ly); ctx.stroke();
    const b = st.colliders[0];
    ctx.fillStyle = '#d23a2e'; ctx.beginPath(); ctx.arc(b.x, b.y, 150, 0, Math.PI * 2); ctx.fill();
    S.drawCloth(ctx, st.cloths[0], { fill: '#6c8fb3', back: '#4d6a88', shade: 0.4, edge: { color: '#34506e', width: 3 } });
  } };
} };

// paper tape pulled off a roll by the hand, laid across the box top (sticky), then torn off at the roll
CASES.tape = { T: 3, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 9 });
  const roll = w.collider({ circle: 38, x: 300, y: 900, mat: 'cardboard', tag: 'roll' });
  w.collider({ box: [200, 70], x: 640, y: 1150, mat: 'cardboard', tag: 'box', sticky: true });
  const N = 30, seg = 20.5, ex = 300, ey = 941;   // 615 px of tape: the hand never pulls it taut past its length
  const hand = function (t) { const u = Math.min(1, t / 1.0), v = Math.min(1, Math.max(0, (t - 1.0) / 0.5)); return [ex + 550 * u * (2 - u), ey + 136 * v * v]; };
  // unrolling: particle k waits at the roll's exit until the hand has pulled (N - k) segments out, then it is free
  const pins = [{ k: 0, to: { collider: roll.id, local: [0, 41] } }];
  for (let k = 1; k < N; k++) {
    let tk = 99; for (let t = 0; t <= 1.6; t += 1 / 240) { const h = hand(t); if (Math.sqrt((h[0] - ex) * (h[0] - ex) + (h[1] - ey) * (h[1] - ey)) >= (N - k) * seg) { tk = t; break; } }
    pins.push({ k: k, to: [ex, ey], until: tk });
  }
  pins.push({ k: -1, to: hand, until: 1.6 });
  const tape = w.rope({ from: [ex, ey], to: [ex, ey], length: N * seg, segments: N, width: 26, mat: 'tape', tag: 'tape', thickness: 3, pins: pins });
  w.schedule(1.9, function (w) { w.cut(tape.id, 0, 1); for (let k = 1; k < N; k++) w.unpin(tape.id, k); });   // torn off at the roll: the free length falls onto the box and sticks
  w.run(this.T);
  return { w: w, draw: function (ctx, st) {
    ctx.fillStyle = '#e9e2d8'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = '#d4be8e'; ctx.fillRect(440, 1080, 400, 140); ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 3; ctx.strokeRect(440, 1080, 400, 140);
    ctx.fillStyle = '#efe3c4'; ctx.beginPath(); ctx.arc(300, 900, 38, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#9b8c6c'; ctx.beginPath(); ctx.arc(300, 900, 20, 0, Math.PI * 2); ctx.fill();
    S.drawRope(ctx, st.ropes[0], { style: 'tape', width: 26 });
  } };
} };

// a purple nitrile glove held at the cuff: limp, then blown up (five fingers puff out), tied, let go: it floats to the ceiling
CASES.glove = { T: 4, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 22 });
  w.collider({ ceiling: 420, mat: 'plastic', tag: 'ceiling' });
  const hand = function (t) { return [540, 1240 - 60 * Math.max(0, Math.min(1, (t - 1.4) / 0.3))]; };
  w.balloon({ x: 540, y: 1160, outline: 'glove', segments: 80, pressure: function (t) { return Math.max(0, Math.min(1.12, (t - 0.4) / 0.9 * 1.12)); },
    buoyancy: 1850, mat: 'nitrile', tag: 'glove', pins: [{ k: 0, to: hand, until: 1.8 }] });
  w.run(this.T);
  return { w: w, draw: function (ctx, st) {
    ctx.fillStyle = '#e9e2d8'; ctx.fillRect(0, 0, 1080, 1920); ctx.fillStyle = '#d8d0c2'; ctx.fillRect(0, 0, 1080, 420);
    S.drawBalloon(ctx, st.balloons[0], { fill: '#8e6bd1', outline: '#3b2566', shine: 0.6, cuff: true });
  } };
} };
// a dozen glove balloons, two at a time, float up and bump along the ceiling (they overlap until softCollide lands)
CASES.balloons = { T: 4.5, build: function () {
  const w = S.world({ gravity: [0, 1500], seed: 12 });
  w.collider({ ceiling: 300, mat: 'plastic', tag: 'ceiling' }); w.collider({ wall: 40, side: 1, tag: 'wall' }); w.collider({ wall: 1040, side: -1, tag: 'wall' });
  for (let i = 0; i < 12; i++) {
    const t0 = 0.15 * (i >> 1), x = 150 + (i % 6) * 156 + (i >= 6 ? 70 : 0), y = 1350 + (i % 3) * 60;
    w.balloon({ x: x, y: y, outline: 'glove', scale: 0.62, segments: 56, pressure: function (t) { return Math.max(0, Math.min(1.1, (t - t0) / 0.5 * 1.1)); },
      buoyancy: 1500 + 400 + 60 * (i % 4), mat: 'nitrile', tag: 'glove', softCollide: true, pins: [{ k: 0, to: [x, y + 70], until: t0 + 0.6 }] });
  }
  w.run(this.T);
  const cols = ['#8e6bd1', '#5b8fd6', '#8e6bd1', '#6fa3e0'];
  return { w: w, draw: function (ctx, st) {
    ctx.fillStyle = '#e9e2d8'; ctx.fillRect(0, 0, 1080, 1920); ctx.fillStyle = '#d8d0c2'; ctx.fillRect(0, 0, 1080, 300);
    st.balloons.forEach(function (b, i) { S.drawBalloon(ctx, b, { fill: cols[i % 4], outline: '#2b2550', shine: 0.55, cuff: true }); });
  } };
} };

if (typeof module === 'object' && module.exports) module.exports = { CASES: CASES };
if (typeof document === 'undefined') return;
// ---------------------------------------------------------------- page
const q = new URLSearchParams(location.search), name = q.get('case') || 'drape', cs = CASES[name];
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
if (!cs) { ctx.fillStyle = '#fff'; ctx.font = '40px sans-serif'; ctx.fillText('no case ' + name + ' (' + Object.keys(CASES).join(', ') + ')', 40, 100); window.__done = true; return; }
const t0 = performance.now(), built = cs.build(), bakeMs = performance.now() - t0;
const times = q.get('sheet') ? q.get('sheet').split(',').map(Number) : [Number(q.get('t') || cs.T)];
const per = times.length > 1 ? Math.ceil(Math.sqrt(times.length)) : 1, sc = 1 / per;
let drawMs = 0;
times.forEach(function (t, k) {
  const st = built.w.at(t);
  ctx.save(); ctx.translate((k % per) * 1080 * sc, Math.floor(k / per) * 1920 * sc); ctx.scale(sc, sc);
  ctx.beginPath(); ctx.rect(0, 0, 1080, 1920); ctx.clip();
  ctx.fillStyle = '#f2efe9'; ctx.fillRect(0, 0, 1080, 1920);
  const zoom = +(q.get('zoom') || 1);
  if (zoom !== 1) { ctx.translate(540, 960); ctx.scale(zoom, zoom); ctx.translate(-(+(q.get('cx') || 540)), -(+(q.get('cy') || 960))); }
  const d0 = performance.now(); built.draw(ctx, st); drawMs += performance.now() - d0;
  if (q.get('debug')) S.debugDraw(ctx, built.w, st);
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.font = 'bold 44px sans-serif'; ctx.fillText(name + '  t=' + t.toFixed(2), 30, 70);
  ctx.restore();
});
window.__stats = { bakeMs: Math.round(bakeMs), drawMs: +(drawMs / times.length).toFixed(2), events: built.w.events.length, warnings: built.w.warnings.slice(0, 5), hash: S.stateHash(built.w, 20) };
window.__done = true;
})();
