'use strict';
/* SHIFT HAPPENS, Episode 13: ep13_vault (work in progress: room and light test) */
(() => {
if (!window.TIMELINE_EP13) return;
const { person, zoomTo, faceC, faceZoom, drawBg, inB } = window.H6;
const A7 = window.A7, A10 = window.A10, A11 = window.A11, A13 = window.A13, S6 = window.S6, S7 = window.S7;
const { p2, poly, grad, radial, rgba } = V2;
const { box3, onZ, kz, lit, table3, chair3, wallClock, ceilingLamp, backWindow } = S6;
const bs = id => B(id).s, be = id => B(id).e;
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);
const cl01 = x => Math.max(0, Math.min(1, x));
const sk = (t, a, b) => { const k = cl01((t - a) / (b - a)); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------------ the room (world units: X right, Y up, Z forward; the camera looks north from the door wall)
const ZB = 2200, HW = 460, CH = 600;
const CAMP = { f: 1400, cy: 330, hy: 860 };
const TBL = { x: -60, z: 1380, w: 150, d: 66, h: 135 };
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => hex(V2.rgb(c).map(v => v * f));

// ------------------------------------------------------------------ the light map: everything is drawn as if the room were lit, then multiplied by what the lights actually reach
const LM = { cv: V2.mk(540, 960), s: .5 };
LM.g = LM.cv.getContext('2d');
function lmBegin(amb) {   // amb: [r, g, b] 0..255, the level of the whole room
  const g = LM.g, m = ctx.getTransform();
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.fillStyle = `rgb(${amb[0] | 0},${amb[1] | 0},${amb[2] | 0})`; g.fillRect(0, 0, LM.cv.width, LM.cv.height);
  g.setTransform(m.a * LM.s, m.b * LM.s, m.c * LM.s, m.d * LM.s, m.e * LM.s, m.f * LM.s);
  g.globalCompositeOperation = 'lighter';
}
// a soft elliptical patch of light: centre, radii, rotation, colour 'r,g,b', strength, hardness (0 soft .. 1 hard edge)
function lmSpot(x, y, rx, ry, color, a, o = {}) {
  if (a <= 0) return;
  const g = LM.g, hard = o.hard ?? .45;
  g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(${color},${a})`); gr.addColorStop(Math.max(.05, hard), `rgba(${color},${a * (o.mid ?? .9)})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}
// a lit cone's footprint plus the air between the lamp and it (a light shaft of lighter fog)
function lmPoly(pts, color, a) {
  const g = LM.g; g.save(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = `rgba(${color},${a})`; g.fill(); g.restore();
}
function lmApply() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(LM.cv, 0, 0, W, H); ctx.restore();
}

// ------------------------------------------------------------------ cones of light in the air: soft, layered, widening from the lamp to the thing it hits
function beamVol(S, T, r0, r1, color, a, o = {}) {
  const dx = T[0] - S[0], dy = T[1] - S[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const layers = [[1, .22], [.72, .3], [.46, .38], [.24, .5]];
  for (const [k, w] of layers) {
    ctx.fillStyle = V2.grad(S[0], S[1], T[0], T[1], [[0, rgba(color, a * w * (o.near ?? 1))], [.55, rgba(color, a * w * .72)], [1, rgba(color, a * w * (o.far ?? .5))]]);
    ctx.beginPath(); ctx.moveTo(S[0] + nx * r0 * k, S[1] + ny * r0 * k); ctx.lineTo(T[0] + nx * r1 * k, T[1] + ny * r1 * k); ctx.lineTo(T[0] - nx * r1 * k, T[1] - ny * r1 * k); ctx.lineTo(S[0] - nx * r0 * k, S[1] - ny * r0 * k); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}


// ------------------------------------------------------------------ small perspective helpers
const wq = (Z, x0, y0, x1, y1) => { const a = p2(x0, y1, Z), b = p2(x1, y0, Z); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; };   // screen rect [x, y, w, h] of a world rect on the plane Z
const wpoly = (Z, x0, y0, x1, y1) => [p2(x0, y0, Z), p2(x1, y0, Z), p2(x1, y1, Z), p2(x0, y1, Z)];
const curScale = () => { const m = ctx.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); };
const stand = (X, Y, Z, fn, s = 1) => { const [x, y] = p2(X, Y, Z), k = kz(Z) * s; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(k); ctx.restore(); };   // a billboard standing on a world point: origin at its base, 1 unit = 1 world unit, up is -y
const discTop = (X, Y, Z, rx, rz, fill, stroke, lw = 2) => {   // a flat ellipse lying on a horizontal plane
  const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; pts.push(p2(X + Math.cos(a) * rx, Y, Z + Math.sin(a) * rz)); }
  poly(pts, fill, stroke, lw);
};
const dustTop = (x0, x1, y, z0, z1, a = .4) => poly([p2(x0, y, z0), p2(x1, y, z0), p2(x1, y, z1), p2(x0, y, z1)], `rgba(204,204,196,${a})`);
const px = u => u * curScale();                       // units -> screen px at the current transform
const heroPx = u => px(u) >= 34;                      // a string this big on screen is read by the viewer, so the gate holds it to the hero rules

// ------------------------------------------------------------------ the back wall: the things that stopped on 3/12/2019
const BANNER = { x0: -410, x1: 410, y0: 506, y1: 586 };
const CLOCK = { x: -150, y: 466, r: 58 };
const CAL = { x0: -62, x1: 82, y0: 286, y1: 470 };
const WIN = { x0: 126, x1: 304, y0: 186, y1: 470 };
const VEND = { x0: 330, x1: 452, z0: 2030, z1: 2162, h: 432 };
const FRIDGE = { x0: -456, x1: -352, z0: 2040, z1: 2172, h: 470 };
const COUNTER = { x0: 262, x1: 460, z0: 1100, z1: 1992, h: 200 };
const BAR_AT = { x: 388, y: 262 };   // the last granola bar in the machine (world X, Y on the glass)

function stains() {   // water stains, peeling paint and a creep of mould on the back wall and the ceiling
  const Z = ZB - 2;
  for (const [x, y, w, h, c, a] of [[-380, 380, 150, 190, '120,96,56', .26], [210, 560, 190, 90, '110,90,50', .22], [-250, 520, 120, 70, '90,80,48', .2], [20, 150, 280, 60, '70,84,70', .24]]) {
    const r = wq(Z, x, y, x + w, y + h), cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, Math.abs(r[3] / r[2])); ctx.fillStyle = V2.radial(0, 0, 0, Math.abs(r[2]) / 2, [[0, `rgba(${c},${a})`], [.6, `rgba(${c},${a * .6})`], [1, `rgba(${c},0)`]]); ctx.beginPath(); ctx.arc(0, 0, Math.abs(r[2]) / 2, 0, TAU); ctx.fill(); ctx.restore();
  }
  // mould in the top right corner
  { const [cx, cy] = p2(HW, CH, Z), k = kz(Z); ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    for (let i = 0; i < 16; i++) { const a = PI * .5 + sr(i, 1) * PI * .5, d = 20 + sr(i, 2) * 110; ctx.fillStyle = `rgba(30,48,34,${.16 + .16 * sr(i, 3)})`; ctx.beginPath(); ctx.arc(Math.cos(a) * d - 6, Math.sin(a) * d + 6, 8 + sr(i, 4) * 22, 0, TAU); ctx.fill(); } ctx.restore(); }
  // peeling paint: curled flakes with the bare plaster showing
  for (const [x, y, s] of [[-330, 300, 1], [300, 410, .8], [-120, 560, .7]]) {
    const [px0, py0] = p2(x, y, Z), k = kz(Z) * s; ctx.save(); ctx.translate(px0, py0); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(176,164,140,.7)'; ctx.beginPath(); ctx.moveTo(-26, 10); ctx.quadraticCurveTo(-8, -40, 20, -22); ctx.quadraticCurveTo(34, 0, 14, 20); ctx.quadraticCurveTo(-8, 30, -26, 10); ctx.fill();
    ctx.fillStyle = '#7f8c80'; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.quadraticCurveTo(4, -28, 26, -16); ctx.quadraticCurveTo(18, 4, 4, 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(30,30,30,.4)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  // stained ceiling tiles
  for (const [x, z, w, d, a] of [[-300, 1500, 220, 200, .3], [120, 900, 200, 240, .25], [-160, 1900, 240, 180, .28], [300, 1600, 160, 160, .22]]) poly([p2(x, CH - 1, z), p2(x + w, CH - 1, z), p2(x + w, CH - 1, z + d), p2(x, CH - 1, z + d)], `rgba(118,98,52,${a})`);
}

function banner(lt, ST) {
  const { x0, x1, y0, y1 } = BANNER, Z = ZB - 6, r = wq(Z, x0, y0, x1, y1), k = kz(Z), flap = Math.sin(lt * 1.7) * .004 * ST.draft;
  const w = r[2], h = r[3];
  // streamers first (crepe paper twisted and gone grey), then the cloth
  ctx.save(); ctx.lineCap = 'round';
  for (const [fx, len, c] of [[.06, 150, '#cf8aa0'], [.2, 110, '#8fb2c8'], [.5, 70, '#d8c27a'], [.8, 120, '#cf8aa0'], [.95, 160, '#8fb2c8']]) {
    const x = r[0] + w * fx, y = r[1] + h * .9, L = len * k, sw = Math.sin(lt * 1.3 + fx * 9) * 5 * ST.draft;
    ctx.strokeStyle = c; ctx.lineWidth = 7 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 18 * k + sw, y + L * .3, x - 14 * k + sw, y + L * .6, x + 6 * k + sw, y + L); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2 * k; ctx.setLineDash([6 * k, 12 * k]); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
  // the cloth, hanging from the right nail: the left nail gave up, so it droops and the lettering leans with it
  const pivot = [r[0] + w, r[1] + h * .1], ang = .07 + flap;
  ctx.save(); ctx.translate(pivot[0], pivot[1]); ctx.rotate(ang); ctx.translate(-pivot[0], -pivot[1]);
  const cl = new Path2D(); cl.moveTo(r[0], r[1]); cl.lineTo(r[0] + w, r[1]); cl.lineTo(r[0] + w - h * .28, r[1] + h * .5); cl.lineTo(r[0] + w, r[1] + h); cl.lineTo(r[0], r[1] + h); cl.lineTo(r[0] + h * .28, r[1] + h * .5); cl.closePath();
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 10 * k; ctx.shadowOffsetY = 5 * k;
  ctx.fillStyle = V2.grad(0, r[1], 0, r[1] + h, [[0, '#d9a0b4'], [1, '#b87c92']]); ctx.fill(cl); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.clip(cl); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 3 * k;
  for (let i = -4; i < 40; i++) { ctx.beginPath(); ctx.moveTo(r[0] + i * 26 * k, r[1] + h); ctx.lineTo(r[0] + i * 26 * k + 40 * k, r[1]); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, r[1], 0, r[1] + h * .5, [[0, 'rgba(214,210,204,.55)'], [1, 'rgba(214,210,204,0)']]); ctx.fillRect(r[0], r[1], w, h * .5);   // dust along the top
  ctx.restore();
  ctx.lineWidth = 3.5 * k; ctx.strokeStyle = 'rgba(40,16,30,.8)'; ctx.stroke(cl);
  UI.container('banner13', 'banner', [r[0] + h * .28, r[1], r[0] + w - h * .28, r[1] + h], h * .06);
  UI.label('HAPPY NURSES WEEK 2019', r[0] + w / 2, r[1] + h / 2, { size: h * .5, weight: 900, fill: '#fff4f0', stroke: '#7a3a54', lw: h * .05, spacing: h * .04, maxW: w - h * 1.0, hero: false, cid: 'banner13', center: true });
  ctx.restore();
  // a string of three deflated balloons hanging off the loose end
  for (const [fx, dy, c] of [[.04, 70, '#b88aa0'], [.095, 110, '#86a6b8'], [.02, 130, '#c9b070']]) {
    const x = r[0] + w * fx, y = r[1] + h * .95, L = dy * k, wob = Math.sin(lt * 1.1 + fx * 20) * 3 * ST.draft;
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + wob, y + L * .5, x + wob * 1.5, y + L); ctx.stroke();
    ctx.save(); ctx.translate(x + wob * 1.5, y + L + 16 * k); ctx.fillStyle = c; ctx.strokeStyle = 'rgba(30,16,30,.75)'; ctx.lineWidth = 2.4 * k;
    ctx.beginPath(); ctx.moveTo(0, -16 * k); ctx.bezierCurveTo(26 * k, -10 * k, 22 * k, 36 * k, 4 * k, 40 * k); ctx.bezierCurveTo(-6 * k, 48 * k, -22 * k, 30 * k, -24 * k, 8 * k); ctx.bezierCurveTo(-24 * k, -8 * k, -12 * k, -14 * k, 0, -16 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,16,30,.35)'; ctx.lineWidth = 1.6 * k; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14 * k + i * 9 * k, 0); ctx.quadraticCurveTo(-8 * k + i * 9 * k, 14 * k, -12 * k + i * 9 * k, 28 * k); ctx.stroke(); }
    ctx.restore();
  }
  return r;
}

function clock3() {   // the wall clock, stopped at 3:12, its glass grey with dust
  const { x, y, r } = CLOCK, Z = ZB - 4;
  wallClock(x, y, Z, 0, 12, 3, r);
  const [cx, cy] = p2(x, y, Z), R = r * kz(Z);
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = V2.radial(0, 0, R * .1, R * 1.05, [[0, 'rgba(196,194,186,.18)'], [1, 'rgba(196,194,186,.5)']]); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = Math.max(1.6, R * .05); ctx.beginPath(); ctx.arc(0, 0, R * .84, PI * 1.05, PI * 1.38); ctx.stroke();   // a swipe of clean glass
  ctx.strokeStyle = 'rgba(30,24,30,.55)'; ctx.lineWidth = Math.max(1.2, R * .025); ctx.beginPath(); ctx.moveTo(R * .5, -R * .1); ctx.lineTo(R * .72, R * .12); ctx.lineTo(R * .64, R * .34); ctx.stroke();   // a hairline crack
  ctx.restore();
}

// the wall calendar, stuck on March 2019: the 12th circled in red marker
const CAL_DAYS = (() => { const rows = []; let d = 1; for (let r = 0; r < 6; r++) { const row = []; for (let c = 0; c < 7; c++) { const n = r * 7 + c - 4; row.push(n >= 1 && n <= 31 ? String(n) : ''); } rows.push(row); } return rows; })();   // March 1, 2019 was a Friday
function calendar(lt) {
  const { x0, x1, y0, y1 } = CAL, Z = ZB - 5, r = wq(Z, x0, y0, x1, y1), k = kz(Z), hh = r[3] * .17;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8 * k; ctx.shadowOffsetY = 4 * k;
  ctx.fillStyle = '#c9c2a8'; rr(r[0] - 4 * k, r[1] - 3 * k, r[2] + 8 * k, r[3] + 10 * k, 4 * k); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.restore();
  UI.panel([r[0], r[1], r[2], r[3]], { fill: '#e9e2c6', stroke: '#7a6e4a', lw: 2 * k, r: 3 * k, id: 'cal13', kind: 'sign', pad: 0 });
  ctx.fillStyle = '#b8434a'; ctx.fillRect(r[0] + 2 * k, r[1] + 2 * k, r[2] - 4 * k, hh); ctx.fillStyle = 'rgba(214,210,204,.4)'; ctx.fillRect(r[0] + 2 * k, r[1] + 2 * k, r[2] - 4 * k, hh * .3);
  UI.label('MARCH 2019', r[0] + r[2] / 2, r[1] + 2 * k + hh / 2, { size: hh * .52, weight: 900, fill: '#fff2e0', spacing: hh * .05, maxW: r[2] * .86, hero: false, cid: 'cal13', center: true });
  const tb = UI.table([r[0] + 6 * k, r[1] + hh + 8 * k, r[2] - 12 * k, r[3] - hh - 14 * k], Array.from({ length: 7 }, (_, i) => ({ w: 1 / 7, align: 'center', weight: 800, fill: i % 6 === 0 ? '#a8353c' : '#2a2630' })), CAL_DAYS,
    { header: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], hero: false, fill: 'rgba(0,0,0,0)', stroke: null, lw: 0, headFill: 'rgba(0,0,0,0)', headText: { fill: '#6a5c38' }, grid: 'rgba(0,0,0,0)', size: r[3] * .062, padX: 0, r: 0 });
  // the 12th, circled twice
  const c12 = tb.cell(1, 2);
  if (c12) { ctx.save(); ctx.strokeStyle = '#c4222e'; ctx.lineWidth = Math.max(2, 3 * k); ctx.lineCap = 'round';
    for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.ellipse(c12.cx, c12.cy, (c12.x1 - c12.x0) * (.46 + j * .06), (c12.y1 - c12.y0) * (.5 + j * .05), -.2 + j * .1, 0, TAU * .95); ctx.stroke(); }
    ctx.restore(); }
  ctx.fillStyle = V2.grad(0, r[1], 0, r[1] + r[3], [[0, 'rgba(210,206,200,.4)'], [.35, 'rgba(210,206,200,0)'], [1, 'rgba(210,206,200,.14)']]); ctx.fillRect(r[0], r[1], r[2], r[3]);   // dust
}

function windowFrame(lt, ST) {
  const { x0, x1, y0, y1 } = WIN, Z = ZB;
  backWindow(Z, { x0, x1, y0, y1, sky: ['#04081a', '#13224a'], mull: 2,
    draw: f => { const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
      ctx.fillStyle = '#e8f0ff'; for (let i = 0; i < 22; i++) { ctx.globalAlpha = (.25 + .5 * sr(i, 1)) * (.7 + .3 * Math.sin(lt * (1 + sr(i, 5) * 2) + i)); ctx.fillRect(fx0 + w * sr(i, 2), fy1 + h * .72 * sr(i, 3), 3, 3); } ctx.globalAlpha = 1;
      ctx.fillStyle = '#0a1024'; ctx.fillRect(fx0, fy0 - h * .09, w, h * .09);   // the lot's roofline
      ST.winFill && ST.winFill(f); } });
  // blinds, half raised and bent, dust on the sill
  const r = wq(Z, x0, y0, x1, y1), k = kz(Z);
  ctx.save(); ctx.beginPath(); wpoly(Z, x0, y0, x1, y1).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  const slats = 9, hh = r[3] * .34;
  for (let i = 0; i < slats; i++) { const yy = r[1] + i * hh / slats; ctx.fillStyle = i % 2 ? 'rgba(168,170,160,.96)' : 'rgba(146,150,142,.96)'; ctx.fillRect(r[0] - 2, yy, r[2] + 4, hh / slats * .82); ctx.fillStyle = 'rgba(214,210,204,.4)'; ctx.fillRect(r[0] - 2, yy, r[2] + 4, 2 * k); }
  ctx.strokeStyle = 'rgba(40,34,30,.7)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(r[0] + r[2] * .88, r[1]); ctx.lineTo(r[0] + r[2] * .88, r[1] + hh + 40 * k); ctx.stroke();
  ctx.restore();
  dustTop(x0 - 22, x1 + 22, y0 - 10, Z - 40, Z, .5);
}

// the vending machine: glass front, coils, one granola bar left. The glass is emissive: drawn again after the light map (see vendGlow)
function vendingBox() {
  const { x0, x1, z0, z1, h } = VEND;
  box3({ x0, x1, y1: h, z0, z1, color: '#3a527c', front: '#46639a', side: '#2c4066', top: '#53688a' });
  const g = wpoly(z0, x0 + 12, 150, x1 - 40, h - 36);
  poly(g, V2.grad(0, g[2][1], 0, g[0][1], [[0, '#9fc4c8'], [1, '#6f9a9c']]), 'rgba(10,20,30,.8)', 2.4);
  const cell = (c, r) => [lerp(x0 + 16, x1 - 44, (c + .5) / 3), lerp(h - 56, 170, (r + .5) / 5)];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {   // coils: empty except the one bar
    const [cx, cy] = cell(c, r), a = p2(cx - 15, cy, z0), b = p2(cx + 15, cy, z0);
    ctx.strokeStyle = 'rgba(30,40,50,.7)'; ctx.lineWidth = Math.max(1.4, 2.4 * kz(z0)); ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo((a[0] + b[0]) / 2, a[1] + 5 * kz(z0), ...b); ctx.stroke();
    for (let q = 0; q < 4; q++) { const t0 = (q + .5) / 4, qx = lerp(a[0], b[0], t0); ctx.beginPath(); ctx.arc(qx, a[1] + 2 * kz(z0), 2.4 * kz(z0), 0, PI); ctx.stroke(); }
  }
  // the last bar, hanging on its coil
  { const [cx, cy] = cell(1, 1), q = p2(cx, cy + 4, z0 - 1), kk = kz(z0); ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(kk, kk); ctx.rotate(.04);
    ctx.fillStyle = V2.grad(-16, 0, 16, 0, [[0, '#2f6fc0'], [.5, '#dfe6f2'], [1, '#e8a23a']]); ctx.strokeStyle = 'rgba(20,16,24,.85)'; ctx.lineWidth = 2.4; rr(-17, -9, 34, 62, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-13, -4, 5, 52); ctx.restore(); }
  // the side panel: keypad, coin slot, the chute flap
  { const [px0, py0] = p2(x1 - 30, 300, z0), kk = kz(z0); ctx.save(); ctx.translate(px0, py0); ctx.scale(kk, kk);
    ctx.fillStyle = '#20262e'; rr(-8, -150, 34, 160, 4); ctx.fill(); ctx.fillStyle = '#9aa4b0'; for (let i = 0; i < 6; i++) rr(-3 + (i % 2) * 14, -140 + ((i / 2) | 0) * 20, 10, 12, 2), ctx.fill();
    ctx.fillStyle = '#d6dde6'; rr(-4, -60, 26, 8, 2); ctx.fill(); ctx.restore(); }
  { const [fx, fy] = p2((x0 + x1) / 2, 80, z0), kk = kz(z0); ctx.fillStyle = 'rgba(10,14,22,.85)'; ctx.fillRect(fx - 42 * kk, fy - 18 * kk, 84 * kk, 36 * kk); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(fx - 42 * kk, fy - 18 * kk, 84 * kk, 5 * kk); }
  const lbl = wq(z0, x0 + 8, h - 34, x1 - 38, h - 6);   // the lit header
  ctx.fillStyle = '#e8eef2'; rr(lbl[0], lbl[1], lbl[2], lbl[3], 4 * kz(z0)); ctx.fill();
  UI.container('vend13', 'sign', [lbl[0], lbl[1], lbl[0] + lbl[2], lbl[1] + lbl[3]], lbl[3] * .1);
  UI.label('SNACKS', lbl[0] + lbl[2] / 2, lbl[1] + lbl[3] / 2, { size: lbl[3] * .56, weight: 900, fill: '#c4343f', spacing: lbl[3] * .06, maxW: lbl[2] * .9, hero: false, cid: 'vend13', center: true });
  dustTop(x0, x1, h, z0, z1, .55);
}
function vendGlow(ST) {   // the machine's own light: the one lit thing in a dark room (drawn after the light map)
  const { x0, x1, z0, h } = VEND, g = wpoly(z0, x0 + 12, 150, x1 - 40, h - 36), a = ST.vend, [cx, cy] = p2((x0 + x1) / 2, 280, z0), k = kz(z0);
  if (a <= .01) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.beginPath(); g.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  ctx.fillStyle = V2.grad(0, g[2][1], 0, g[0][1], [[0, `rgba(150,235,225,${.5 * a})`], [1, `rgba(110,200,205,${.38 * a})`]]); ctx.fillRect(g[0][0] - 4, g[2][1] - 4, g[1][0] - g[0][0] + 8, g[0][1] - g[2][1] + 8);
  ctx.restore();
  V2.glow(cx, cy, 260 * k, '120,225,215', .3 * a, 'screen', .45);
}

function deadPlant(X, Z, lt) {
  stand(X, 0, Z, () => {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 3, 62, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9a6a4c'; ctx.strokeStyle = 'rgba(25,16,30,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, -86); ctx.lineTo(40, -86); ctx.lineTo(30, 0); ctx.lineTo(-30, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(214,210,200,.5)'; ctx.beginPath(); ctx.moveTo(-40, -86); ctx.lineTo(40, -86); ctx.lineTo(38, -74); ctx.lineTo(-38, -74); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.ellipse(0, -88, 38, 8, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 11; i++) {   // dead stalks bowed over, leaves like brown paper
      const a = -2.6 + i * .52, L = 120 + (i % 4) * 34, sw = Math.sin(lt * .8 + i) * .01;
      ctx.save(); ctx.translate((i - 5) * 4, -88); ctx.rotate(a * .5 + sw);
      ctx.strokeStyle = i % 2 ? '#6f5a38' : '#7a6642'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -L * .6, 6 + (i % 3) * 8, -L); ctx.stroke();
      ctx.fillStyle = i % 3 ? '#8a7448' : '#6a5a38'; ctx.strokeStyle = 'rgba(40,30,16,.7)'; ctx.lineWidth = 2.4;
      ctx.translate(6 + (i % 3) * 8, -L); ctx.rotate(1.2 + (i % 3) * .3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -10, 44, 12); ctx.quadraticCurveTo(24, 20, 0, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#8a7448' : '#6a5a38'; ctx.save(); ctx.translate(-70 + i * 20 + (i % 2) * 6, -2 - (i % 3) * 2); ctx.rotate(i); ctx.beginPath(); ctx.ellipse(0, 0, 12, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); }   // fallen leaves
    A13.cobweb('orb', [30, -150, 40], { alpha: .55, seed: 3, lw: 1.6 });
  });
}

// the counter along the right wall: the microwave, a coffee maker with a black crust in the pot, and the cake nobody finished
function counterSet(lt) {
  const { x0, x1, z0, z1, h } = COUNTER;
  box3({ x0, x1, y1: h, z0, z1, color: '#b9b4a2', top: '#6a6a60', front: '#a8a38f', side: '#8d8977' });
  dustTop(x0, x1, h, z0, z1, .45);
  S6.microwave(352, 1500, { on: 0, display: '' });
  // coffee maker
  stand(392, h, 1260, () => {
    ctx.fillStyle = '#26262c'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3; rr(-34, -92, 68, 92, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3a44'; rr(-34, -92, 68, 18, 6); ctx.fill(); ctx.fillStyle = 'rgba(210,206,198,.5)'; rr(-34, -94, 68, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(180,190,190,.5)'; ctx.strokeStyle = '#1a1a20'; ctx.lineWidth = 2.6; rr(-22, -62, 44, 52, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b1210'; rr(-20, -30, 40, 18, 6); ctx.fill(); ctx.fillStyle = 'rgba(70,52,36,.7)'; rr(-20, -34, 40, 6, 3); ctx.fill();
    ctx.fillStyle = '#c4342a'; ell(24, -82, 3, 3); ctx.fill();
  });
  // the cake: a stand, a hardened sheet cake with a wedge missing and a plastic knife standing in it
  stand(398, h, 1700, () => {
    ctx.fillStyle = '#d8d2c4'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -46, 66, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillRect(-7, -46, 14, 46); ctx.strokeRect(-7, -46, 14, 46); ctx.beginPath(); ctx.ellipse(0, 0, 36, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c99a9a'; ctx.beginPath(); ctx.moveTo(-54, -50); ctx.lineTo(-54, -88); ctx.bezierCurveTo(-40, -98, 40, -98, 54, -88); ctx.lineTo(54, -50); ctx.bezierCurveTo(30, -38, -30, -38, -54, -50); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2e6d6'; ctx.beginPath(); ctx.moveTo(-54, -88); ctx.bezierCurveTo(-40, -112, 40, -112, 54, -88); ctx.bezierCurveTo(40, -98, -40, -98, -54, -88); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0e0a0a'; ctx.beginPath(); ctx.moveTo(14, -92); ctx.lineTo(54, -88); ctx.lineTo(54, -50); ctx.lineTo(22, -48); ctx.closePath(); ctx.fill();   // the missing wedge: a dark hollow
    ctx.fillStyle = '#d6b8a0'; ctx.beginPath(); ctx.moveTo(14, -92); ctx.lineTo(22, -48); ctx.lineTo(30, -50); ctx.lineTo(24, -92); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,40,.55)'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-40 + i * 14, -96); ctx.lineTo(-38 + i * 14 + (i % 2) * 6, -74); ctx.lineTo(-44 + i * 14, -52); ctx.stroke(); }   // the cracks of a fossil
    ctx.fillStyle = 'rgba(214,210,200,.6)'; ctx.beginPath(); ctx.ellipse(-8, -100, 36, 8, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(-20, -84); ctx.rotate(.2); ctx.fillStyle = '#e8e4d8'; rr(-4, -44, 8, 44, 3); ctx.fill(); ctx.stroke(); ctx.restore();   // the knife
    A13.cobweb('orb', [40, -112, 34], { alpha: .6, seed: 7, lw: 1.5 });
  });
}

// the table: a sandwich with one bite gone, the tent card, a mug, a napkin box, all under dust
function tableItems(lt, ST) {
  const y = TBL.h + 16, x = TBL.x;
  dustTop(x - TBL.w, x + TBL.w, y, TBL.z - TBL.d, TBL.z + TBL.d, .5);
  // the plate and the sandwich
  discTop(x + 36, y + 1, 1335, 52, 30, '#e7e4d8', 'rgba(25,16,30,.7)', 2); discTop(x + 36, y + 2, 1335, 38, 21, '#cfcbbd');
  stand(x + 36, y + 4, 1335, () => {
    ctx.lineJoin = 'round';
    const bread = (yy, c) => { ctx.fillStyle = c; ctx.strokeStyle = 'rgba(40,24,12,.85)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-38, yy); ctx.lineTo(24, yy); ctx.quadraticCurveTo(34, yy - 5, 26, yy - 14); ctx.lineTo(-38, yy - 14); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    bread(0, '#c9b078'); ctx.fillStyle = '#7e8c5a'; ctx.beginPath(); ctx.moveTo(-40, -15); for (let i = 0; i < 9; i++) ctx.lineTo(-40 + i * 8, -15 - (i % 2 ? 6 : 1)); ctx.lineTo(26, -15); ctx.lineTo(26, -9); ctx.lineTo(-40, -9); ctx.closePath(); ctx.fill();   // lettuce gone to paper
    ctx.fillStyle = '#8a4a3a'; ctx.fillRect(-36, -22, 56, 7); ctx.fillStyle = '#c9a448'; ctx.fillRect(-36, -28, 54, 6);
    bread(-28, '#bda46c'); ctx.fillStyle = 'rgba(86,110,80,.55)'; for (let i = 0; i < 6; i++) { ell(-30 + i * 10 + (i % 2) * 3, -37 + (i % 3) * 3, 3 + (i % 2) * 2, 2.4); ctx.fill(); }   // mould
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(30, -20, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(20,16,12,.9)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(24 + i * 8, -36 + (i % 2) * 2, 5, PI, TAU); ctx.fill(); }   // the bite
    ctx.fillStyle = 'rgba(214,210,200,.55)'; ctx.beginPath(); ctx.ellipse(-8, -41, 38, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1a1e'; ctx.save(); ctx.translate(-22, -45); ctx.rotate(.4); ell(0, 0, 4, 2.6); ctx.fill(); ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 1; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 1.4, 1); ctx.lineTo(d * 5, 5); ctx.stroke(); } ctx.restore();   // a very dead fly
  });
  // mug and napkin box
  stand(x - 118, y + 3, 1420, () => { ctx.fillStyle = '#d8d4c8'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3; rr(-18, -46, 36, 46, 5); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(20, -24, 11, -PI / 2, PI / 2); ctx.stroke(); ctx.fillStyle = '#3a2a1c'; ell(0, -43, 15, 4); ctx.fill(); ctx.fillStyle = 'rgba(210,206,198,.6)'; ell(0, -45, 15, 4); ctx.fill(); });
  stand(x + 118, y + 3, 1400, () => { ctx.fillStyle = '#9aa0a8'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3; rr(-22, -40, 44, 40, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8e4d8'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 12, -40); ctx.lineTo(-10 + i * 12, -56); ctx.lineTo(-4 + i * 12, -40); ctx.fill(); } });
  // the tent card
  tentCard(x - 112, y + 2, 1322, ST);
}
function tentCard(X, Y, Z, ST, o = {}) {
  stand(X, Y, Z, () => {
    const w = 120, h = 86, sc = curScale();
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(6, 3, 70, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#cfc6a6'; ctx.beginPath(); ctx.moveTo(-w / 2 - 6, 0); ctx.lineTo(w / 2 + 14, 0); ctx.lineTo(w / 2 + 8, -10); ctx.lineTo(-w / 2, -10); ctx.closePath(); ctx.fill();   // the fold: the back leaf of the tent
    UI.sign([-w / 2, -h, w, h - 8], [{ t: 'BACK IN', size: 15, weight: 800, fill: '#7a2a2a', spacing: 2, hero: px(15) >= 34 }, { t: '15 MIN', size: 36, font: 'Bangers', weight: 400, fill: '#9a2a2a', spacing: 2, hero: px(36) >= 34, gap: 2 }, { t: '3/12/2019', size: 14, weight: 800, fill: '#4a4030', spacing: 1, hero: px(14) >= 34, gap: 4 }],
      { fill: ['#efe4be', '#d9cc9e'], stroke: '#8a7a50', lw: 2.4, r: 4, id: o.id || 'tent13', kind: 'sign', pad: 7 });
    ctx.fillStyle = 'rgba(210,206,198,.55)'; ctx.fillRect(-w / 2, -h, w, 10);   // dust on the top edge
    ctx.strokeStyle = 'rgba(120,100,60,.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-w / 2 + 4, -14); ctx.lineTo(w / 2 - 4, -14); ctx.stroke(); void sc;
  });
}

function footprints() {   // the crew's tracks through the dust, from the door (behind the camera, right) to where they stand; clean floor shows through
  const pts = []; for (let i = 0; i < 17; i++) { const u = i / 16; pts.push([lerp(190, -40, easeOut(u)) + (i % 2 ? 24 : -24) * (1 - u * .2), lerp(40, 1070, u)]); }
  pts.forEach(([X, Z], i) => { const a = i % 2 ? .12 : -.12; ctx.save(); const [x, y] = p2(X, 0, Z), k = kz(Z); ctx.translate(x, y); ctx.scale(k, k * .3); ctx.rotate(a);
    ctx.fillStyle = 'rgba(72,76,70,.36)'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 36, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 44, 12, 14, 0, 0, TAU); ctx.fill(); ctx.restore(); });
}

function cobwebs(lt, ST) {
  const draft = ST.draft, Z = ZB - 3;
  // the two top corners and the ceiling lamp, the window, the vending machine and the table legs
  for (const [X, side] of [[-HW, 1], [HW, -1]]) { const [x, y] = p2(X, CH, Z), k = kz(Z); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, side, 0, 0, 1, 150 * k], { alpha: .62, seed: side + 3, lw: 1.5 }); ctx.restore(); }
  { const [x, y] = p2(WIN.x1, WIN.y1, Z), k = kz(Z); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, -1, 0, 0, 1, 90 * k], { alpha: .5, seed: 9, lw: 1.3 }); ctx.restore(); }
  { const [x, y] = p2(VEND.x0, VEND.h, VEND.z0), k = kz(VEND.z0); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, 1, 0, 0, -1, 70 * k], { alpha: .5, seed: 13, lw: 1.3 }); ctx.restore(); }
  void draft; void lt;
}


// ------------------------------------------------------------------ the whole room, far to near (the table and the chairs are separate, so the cast can be sorted between them)
const PAL = { wall: '#a9b5aa', wain: '#587a7c', floorA: '#b8bcb0', floorB: '#8d9389', ceil: '#adb5ab', fog: '#56686a' };
function roomBack(lt, ST) {
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: PAL.wall, wain: PAL.wain, floorA: PAL.floorA, floorB: PAL.floorB, ceil: PAL.ceil, fog: PAL.fog, fogAmt: .35, tile: 110, bright: .9, rail: 100 });
  stains();
  windowFrame(lt, ST);
  banner(lt, ST); clock3(); calendar(lt);
  // the left wall: a cork board with notes that curled
  { const X = -HW, q = [p2(X, 250, 1250), p2(X, 250, 1750), p2(X, 450, 1750), p2(X, 450, 1250)]; poly(q, '#9a7a50', 'rgba(25,16,30,.7)', 3);
    poly([p2(X, 262, 1262), p2(X, 262, 1738), p2(X, 438, 1738), p2(X, 438, 1262)], '#b89a6a');
    for (const [z, y, c] of [[1330, 380, '#cfc890'], [1470, 340, '#c8a0a8'], [1600, 390, '#9fb4bc'], [1690, 330, '#a8bc96'], [1400, 290, '#cdb888']]) poly([p2(X, y, z - 36), p2(X, y, z + 36), p2(X, y + 56, z + 36), p2(X, y + 56, z - 36)], c, 'rgba(25,16,30,.35)', 1.4); }
  // fridge, plant, vending machine
  box3({ x0: FRIDGE.x0, x1: FRIDGE.x1, y1: FRIDGE.h, z0: FRIDGE.z0, z1: FRIDGE.z1, color: '#b9c2c6', front: '#cdd5d8', side: '#98a2a8', top: '#d8dde0' });
  onZ(FRIDGE.z0, FRIDGE.x1 - 14, FRIDGE.x1 - 8, 280, 400, '#7a828a'); onZ(FRIDGE.z0, FRIDGE.x0, FRIDGE.x1, 322, 326, 'rgba(0,0,0,.3)'); dustTop(FRIDGE.x0, FRIDGE.x1, FRIDGE.h, FRIDGE.z0, FRIDGE.z1, .55);
  deadPlant(-286, 2060, lt);
  vendingBox();
  counterSet(lt);
  ceilingLamp(0, 1230, CH, ST.tubeShow, '210,236,222', 120, 300);
  cobwebs(lt, ST);
  footprints();
}
function roomFront(lt, ST) {   // the table and the two chairs
  chair3(-60, 1555, { color: '#8a6a4a', w: 50, d: 44, seat: 120, back: 280 });
  table3(TBL.x, TBL.z, { w: TBL.w, d: TBL.d, h: TBL.h, color: '#b89a68' });
  tableItems(lt, ST);
}
function nearChair() { chair3(-60, 1170, { color: '#8a6a4a', w: 50, d: 44, seat: 120, back: 280 }); }

const DEBUG = { lit: 1 };
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.vault = {
  shot: () => 'test',
  cam() { V2.setCam(CAMP); zoomTo(540, 960, 1); },
  draw(lt) {
    const ST = { tubeShow: 1, draft: 1, vend: 1 };
    V2.setLight({ key: [-.3, -.85], keyColor: '#fff0d8', keyA: .3, rim: '#9fc4ff', rimA: .35, shadow: '#101a24', shadowA: .4, amb: '#cfe0d8', ambA: .06 });
    roomBack(lt, ST); nearChair(); roomFront(lt, ST);
    if (DEBUG.lit) return;
    lmBegin([14, 20, 24]);
    lmApply();
  },
  fx: () => ({ bloom: .4, vignette: .3 }),
  blur: () => 1,
  over() {},
};
})();
