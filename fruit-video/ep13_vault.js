'use strict';
/* SHIFT HAPPENS, Episode 13: ep13_vault (work in progress: room and light test) */
(() => {
if (!window.TIMELINE_EP13) return;
const { person, zoomTo, faceC, faceZoom, drawBg, inB, runner } = window.H6;
const A7 = window.A7, A10 = window.A10, A11 = window.A11, A13 = window.A13, S6 = window.S6, S7 = window.S7;
const { p2, poly, quad3, grad, radial, rgba } = V2;
const { box3, onZ, kz, lit, table3, chair3, wallClock, ceilingLamp, backWindow } = S6;
const bs = id => B(id).s, be = id => B(id).e;
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);
const cl01 = x => Math.max(0, Math.min(1, x));
const sk = (t, a, b) => { const k = cl01((t - a) / (b - a)); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------------ the room (world units: X right, Y up, Z forward; the camera looks north from the door wall)
const ZB = 2200, HW = 460, CH = 600;
const CAMP = { f: 1400, cy: 330, hy: 860 };
const TBL = { x: -60, z: 1380, w: 190, d: 66, h: 125 };
const PLATE = { x: 82, z: 1338 }, CARD = { x: -185, z: 1322 };   // the sandwich at the right end of the table, the tent card at the left end
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

// ------------------------------------------------------------------ set-dressing lettering: drawn only while it lies wholly inside the frame (and inside the door opening in view D); it fades out before it reaches an edge,
// so no string is ever sliced by the frame and nothing printed behind the door leaf shows through it
let CLIPQ = null;                                     // a screen-space polygon the lettering has to stay inside, or null
const scrBox = (x0, y0, x1, y1) => {                  // screen bounds of a local rectangle under the current transform
  const m = ctx.getTransform(); let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [u, v] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) { const X = m.a * u + m.c * v + m.e, Y = m.b * u + m.d * v + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return [a, b, c, d];
};
const inPoly = (x, y, P) => { let r = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) r = !r; return r; };
function visK(x0, y0, x1, y1, pad = 4) {              // 1 = wholly inside with room to spare, 0 = touching or crossing an edge
  const b = scrBox(x0, y0, x1, y1), d = Math.min(b[0], b[1], W - b[2], H - b[3]) - pad;
  const k = clamp(d / 30, 0, 1);
  if (k > 0 && CLIPQ) for (const [x, y] of [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]]) if (!inPoly(x, y, CLIPQ)) return 0;
  return k;
}
function lab13(str, cx, cy, o = {}) {                 // UI.label that knows when it would be cut. Returns the opacity it was drawn with
  const f = o.maxW ? UI.fit(str, o.maxW, Object.assign({}, o, { quiet: true })) : null;
  const size = f ? f.size : (o.size ?? 40), m = UI.sizeOf(str, { size, font: o.font, weight: o.weight, spacing: f ? f.spacing : (o.spacing || 0), lw: f ? f.lw : (o.lw || 0) });
  const k = visK(cx - m.w / 2, cy - m.cap / 2 - size * .24, cx + m.w / 2, cy + m.cap / 2 + size * .28);
  if (k < .02) return 0;
  if (k >= .999) UI.label(str, cx, cy, o); else { ctx.save(); ctx.globalAlpha *= k; UI.label(str, cx, cy, o); ctx.restore(); }
  return k;
}

// ------------------------------------------------------------------ the back wall: the things that stopped on 3/12/2019
const BANNER = { x0: -410, x1: 410, y0: 506, y1: 586 };
const CLOCK = { x: -150, y: 466, r: 58 };
const CAL = { x0: -70, x1: 70, y0: 290, y1: 470 };
const WIN = { x0: 116, x1: 326, y0: 172, y1: 484 };
const VEND = { x0: -456, x1: -334, z0: 2030, z1: 2162, h: 432 };
const FRIDGE = { x0: 352, x1: 456, z0: 2040, z1: 2172, h: 470 };
const COUNTER = { x0: 316, x1: 460, z0: 1500, z1: 1992, h: 200 };
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
  lab13('HAPPY NURSES WEEK 2019', r[0] + w / 2, r[1] + h / 2, { size: h * .5, weight: 900, fill: '#fff4f0', stroke: '#7a3a54', lw: h * .05, spacing: h * .04, maxW: w - h * 1.0, hero: false, cid: 'banner13', center: true });
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
  UI.container('cal13h', 'sign', [r[0] + 2 * k, r[1] + 2 * k, r[0] + r[2] - 2 * k, r[1] + 2 * k + hh], 0);
  lab13('MARCH 2019', r[0] + r[2] / 2, r[1] + 2 * k + hh / 2, { size: hh * .52, weight: 900, fill: '#fff2e0', spacing: hh * .05, maxW: r[2] * .86, hero: false, cid: 'cal13h', center: true });
  // the grid: a header row and six weeks, placed by hand on one baseline grid (March 1, 2019 was a Friday)
  const gx = r[0] + 6 * k, gy = r[1] + hh + 8 * k, gw = r[2] - 12 * k, gh = r[3] - hh - 14 * k, cw = gw / 7, rh = gh / 7, fs = rh * .66, cell = (rw, c) => [gx + cw * (c + .5), gy + rh * (rw + .5)];
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, c) => { const [x, y] = cell(0, c); lab13(d, x, y, { size: fs, weight: 800, fill: '#6a5c38', hero: false, cid: 'cal13' }); });
  CAL_DAYS.forEach((row, ri) => row.forEach((n, c) => { if (!n) return; const [x, y] = cell(ri + 1, c); lab13(n, x, y, { size: fs, weight: 800, fill: c % 6 === 0 ? '#a8353c' : '#2a2630', hero: false, cid: 'cal13' }); }));
  // the 12th, circled twice in red marker
  { const [cx, cy] = cell(3, 2);
    ctx.save(); ctx.strokeStyle = '#c4222e'; ctx.lineWidth = Math.max(2, 3 * k); ctx.lineCap = 'round';
    for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.ellipse(cx, cy, cw * (.5 + j * .06), rh * (.56 + j * .05), -.2 + j * .1, 0, TAU * .95); ctx.stroke(); }
    ctx.restore(); }
  ctx.fillStyle = V2.grad(0, r[1], 0, r[1] + r[3], [[0, 'rgba(210,206,200,.4)'], [.35, 'rgba(210,206,200,0)'], [1, 'rgba(210,206,200,.14)']]); ctx.fillRect(r[0], r[1], r[2], r[3]);   // dust
}

function windowFrame(lt, ST) {   // one big pane (no cross bars: the Moon sits in it); blinds bunched at the top, dust on the sill
  const { x0, x1, y0, y1 } = WIN, Z = ZB;
  const f = S7.winPane(Z, { x0, x1, y0, y1 }, f => {
    const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
    ctx.fillStyle = '#e8f0ff'; for (let i = 0; i < 26; i++) { ctx.globalAlpha = (.25 + .5 * sr(i, 1)) * (.7 + .3 * Math.sin(lt * (1 + sr(i, 5) * 2) + i)); ctx.fillRect(fx0 + w * sr(i, 2), fy1 + h * .72 * sr(i, 3), 3, 3); } ctx.globalAlpha = 1;
    ctx.fillStyle = '#0a1024'; ctx.fillRect(fx0, fy0 - h * .08, w, h * .08);   // the lot's roofline
    if (ST.moon) ST.moon(f);
    ctx.fillStyle = 'rgba(214,214,210,.1)'; ctx.fillRect(fx0, fy1, w, h);   // a film of dust on the glass
  }, { sky: [[0, '#04081a'], [1, '#14244c']], frame: '#bdb9aa', sill: true });
  const r = wq(Z, x0, y0, x1, y1), k = kz(Z), hh = r[3] * .12;
  ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  for (let i = 0; i < 4; i++) { const yy = r[1] + i * hh / 4; ctx.fillStyle = i % 2 ? 'rgba(168,170,160,.97)' : 'rgba(146,150,142,.97)'; ctx.fillRect(r[0] - 2, yy, r[2] + 4, hh / 4 * .85); ctx.fillStyle = 'rgba(214,210,204,.45)'; ctx.fillRect(r[0] - 2, yy, r[2] + 4, 1.6 * k); }
  ctx.strokeStyle = 'rgba(40,34,30,.7)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(r[0] + r[2] * .9, r[1]); ctx.lineTo(r[0] + r[2] * .9, r[1] + hh + 30 * k); ctx.stroke();
  ctx.restore();
  dustTop(x0 - 22, x1 + 22, y0 - 10, Z - 40, Z, .5);
  return f;
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
  lab13('SNACKS', lbl[0] + lbl[2] / 2, lbl[1] + lbl[3] / 2, { size: lbl[3] * .56, weight: 900, fill: '#c4343f', spacing: lbl[3] * .06, maxW: lbl[2] * .9, hero: false, cid: 'vend13', center: true });
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
  { const X = 388, Z = 1640, w = 60, y0 = h, hh = 62;   // a microwave nobody has used since the cake
    const f = box3({ x0: X - w, x1: X + w, y0, y1: y0 + hh, z0: Z, z1: Z + 90, color: '#c9ccd0', front: '#d8dadd', side: '#a3a8ae', top: '#e6e8ea' });
    poly([p2(X - w * .82, y0 + 10, Z), p2(X + w * .1, y0 + 10, Z), p2(X + w * .1, y0 + hh - 10, Z), p2(X - w * .82, y0 + hh - 10, Z)], '#1c1f24', 'rgba(10,10,14,.9)', 2.4);
    poly([p2(X + w * .3, y0 + 10, Z), p2(X + w * .92, y0 + 10, Z), p2(X + w * .92, y0 + hh - 10, Z), p2(X + w * .3, y0 + hh - 10, Z)], '#2b2f38', 'rgba(10,10,14,.9)', 2);
    dustTop(X - w, X + w, y0 + hh, Z, Z + 90, .5); void f; }
  // coffee maker
  stand(402, h, 1560, () => {
    ctx.fillStyle = '#26262c'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3; rr(-34, -92, 68, 92, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3a44'; rr(-34, -92, 68, 18, 6); ctx.fill(); ctx.fillStyle = 'rgba(210,206,198,.5)'; rr(-34, -94, 68, 8, 4); ctx.fill();
    ctx.fillStyle = 'rgba(180,190,190,.5)'; ctx.strokeStyle = '#1a1a20'; ctx.lineWidth = 2.6; rr(-22, -62, 44, 52, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b1210'; rr(-20, -30, 40, 18, 6); ctx.fill(); ctx.fillStyle = 'rgba(70,52,36,.7)'; rr(-20, -34, 40, 6, 3); ctx.fill();
    ctx.fillStyle = '#c4342a'; ell(24, -82, 3, 3); ctx.fill();
  });
  // the cake: a stand, a hardened sheet cake with a wedge missing and a plastic knife standing in it
  stand(398, h, 1850, () => {
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

// the table: a sandwich with one bite gone, the tent card, a mug, a napkin box, all under dust. The middle in front of Brenda is kept clear so her face and her hands show
function tableItems(lt, ST) {
  const y = TBL.h + 16, x = TBL.x;
  dustTop(x - TBL.w, x + TBL.w, y, TBL.z - TBL.d, TBL.z + TBL.d, .5);
  // the plate and the sandwich, at the right-hand end
  const PX = PLATE.x;
  discTop(PX, y + 1, PLATE.z, 46, 27, '#e7e4d8', 'rgba(25,16,30,.7)', 2); discTop(PX, y + 2, PLATE.z, 34, 19, '#cfcbbd');
  stand(PX, y + 4, PLATE.z, () => {
    ctx.lineJoin = 'round';
    const bread = (yy, c) => { ctx.fillStyle = c; ctx.strokeStyle = 'rgba(40,24,12,.85)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-38, yy); ctx.lineTo(24, yy); ctx.quadraticCurveTo(34, yy - 5, 26, yy - 14); ctx.lineTo(-38, yy - 14); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    bread(0, '#c9b078'); ctx.fillStyle = '#7e8c5a'; ctx.beginPath(); ctx.moveTo(-40, -15); for (let i = 0; i < 9; i++) ctx.lineTo(-40 + i * 8, -15 - (i % 2 ? 6 : 1)); ctx.lineTo(26, -15); ctx.lineTo(26, -9); ctx.lineTo(-40, -9); ctx.closePath(); ctx.fill();   // lettuce gone to paper
    ctx.fillStyle = '#8a4a3a'; ctx.fillRect(-36, -22, 56, 7); ctx.fillStyle = '#c9a448'; ctx.fillRect(-36, -28, 54, 6);
    bread(-28, '#bda46c'); ctx.fillStyle = 'rgba(86,110,80,.55)'; for (let i = 0; i < 6; i++) { ell(-30 + i * 10 + (i % 2) * 3, -37 + (i % 3) * 3, 3 + (i % 2) * 2, 2.4); ctx.fill(); }   // mould
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(30, -20, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(20,16,12,.9)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(24 + i * 8, -36 + (i % 2) * 2, 5, PI, TAU); ctx.fill(); }   // the bite
    ctx.fillStyle = 'rgba(214,210,200,.55)'; ctx.beginPath(); ctx.ellipse(-8, -41, 38, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1a1e'; ctx.save(); ctx.translate(-22, -45); ctx.rotate(.4); ell(0, 0, 4, 2.6); ctx.fill(); ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 1; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 1.4, 1); ctx.lineTo(d * 5, 5); ctx.stroke(); } ctx.restore();   // a very dead fly
  }, .78);
  // mug and napkin box
  stand(x - 102, y + 3, 1425, () => { ctx.fillStyle = '#d8d4c8'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3; rr(-18, -46, 36, 46, 5); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(20, -24, 11, -PI / 2, PI / 2); ctx.stroke(); ctx.fillStyle = '#3a2a1c'; ell(0, -43, 15, 4); ctx.fill(); ctx.fillStyle = 'rgba(210,206,198,.6)'; ell(0, -45, 15, 4); ctx.fill(); });
  stand(x + 176, y + 3, 1425, () => { ctx.fillStyle = '#9aa0a8'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3; rr(-22, -40, 44, 40, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8e4d8'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 12, -40); ctx.lineTo(-10 + i * 12, -56); ctx.lineTo(-4 + i * 12, -40); ctx.fill(); } });
  // the tent card, at the left-hand end
  tentCard(CARD.x, y + 2, CARD.z, ST);
}
function tentCard(X, Y, Z, ST, o = {}) {
  stand(X, Y, Z, () => {
    const w = 120, h = 86, id = o.id || 'tent13';
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(6, 3, 70, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#cfc6a6'; ctx.beginPath(); ctx.moveTo(-w / 2 - 6, 0); ctx.lineTo(w / 2 + 14, 0); ctx.lineTo(w / 2 + 8, -10); ctx.lineTo(-w / 2, -10); ctx.closePath(); ctx.fill();   // the fold: the back leaf of the tent
    UI.panel([-w / 2, -h, w, h - 8], { fill: ['#efe4be', '#d9cc9e'], stroke: '#8a7a50', lw: 2.4, r: 4, id, kind: 'sign', pad: 7 });
    ctx.fillStyle = 'rgba(210,206,198,.42)'; ctx.fillRect(-w / 2 + 2, -h + 2, w - 4, 9);   // dust on the top edge
    ctx.strokeStyle = 'rgba(120,100,60,.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-w / 2 + 4, -14); ctx.lineTo(w / 2 - 4, -14); ctx.stroke();
    lab13('BACK IN', 0, -66, { size: 15, weight: 800, fill: '#7a2a2a', spacing: 2, maxW: w - 24, hero: false, cid: id });
    lab13('15 MIN', 0, -44, { size: 36, font: 'Bangers', weight: 400, fill: '#9a2a2a', spacing: 2, maxW: w - 24, hero: false, cid: id });
    lab13('3/12/2019', 0, -24, { size: 14, weight: 800, fill: '#4a4030', spacing: 1, maxW: w - 24, hero: false, cid: id });
  });
}

function footprints() {   // the crew's tracks through the dust, from the door (behind the camera, right) to where they stand; clean floor shows through
  const pts = []; for (let i = 0; i < 13; i++) { const u = i / 12; pts.push([lerp(-150, -40, easeIO(u)) + (i % 2 ? 22 : -22), lerp(560, 1070, u)]); }
  pts.forEach(([X, Z], i) => { const a = i % 2 ? .1 : -.1; ctx.save(); const [x, y] = p2(X, 0, Z), k = kz(Z); ctx.translate(x, y); ctx.scale(k, k * .3); ctx.rotate(a);
    ctx.fillStyle = 'rgba(84,88,80,.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 26, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 36, 8, 10, 0, 0, TAU); ctx.fill(); ctx.restore(); });
}

function cobwebs(lt, ST) {
  const draft = ST.draft, Z = ZB - 3;
  // the two top corners and the ceiling lamp, the window, the vending machine and the table legs
  for (const [X, side] of [[-HW, 1], [HW, -1]]) { const [x, y] = p2(X, CH, Z), k = kz(Z); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, side, 0, 0, 1, 150 * k], { alpha: .62, seed: side + 3, lw: 1.5 }); ctx.restore(); }
  { const [x, y] = p2(WIN.x1, WIN.y1, Z), k = kz(Z); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, -1, 0, 0, 1, 90 * k], { alpha: .5, seed: 9, lw: 1.3 }); ctx.restore(); }
  { const [x, y] = p2(VEND.x0, VEND.h, VEND.z0), k = kz(VEND.z0); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, 1, 0, 0, -1, 70 * k], { alpha: .5, seed: 13, lw: 1.3 }); ctx.restore(); }
  void draft; void lt;
}


// a chair that can face either way: dir +1 has its back on the far side (the sitter faces the camera), -1 on the near side (the sitter faces the table)
function chair13(X, Z, o = {}) {
  const w = o.w ?? 50, d = o.d ?? 44, seat = o.seat ?? 120, back = o.back ?? 280, c = o.color ?? '#8a6a4a', dir = o.dir ?? 1, leg = '#3a3a44';
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box3({ x0: X + dx * (w - 6) - 4, x1: X + dx * (w - 6) + 4, y1: seat, z0: Z + dz * (d - 6) - 4, z1: Z + dz * (d - 6) + 4, color: leg, lw: 1 });
  box3({ x0: X - w, x1: X + w, y0: seat, y1: seat + 16, z0: Z - d, z1: Z + d, color: c });
  const bz0 = dir > 0 ? Z + d - 10 : Z - d, bz1 = dir > 0 ? Z + d : Z - d + 10;
  box3({ x0: X - w, x1: X + w, y0: seat + 16, y1: back, z0: bz0, z1: bz1, color: c, top: lit(c, 1.1) });
  dustTop(X - w, X + w, seat + 16, Z - d, Z + d, .4);
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
  deadPlant(-262, 2072, lt);
  vendingBox();
  counterSet(lt);
  ceilingLamp(0, 1230, CH, ST.tubeShow, '210,236,222', 120, 300);
  cobwebs(lt, ST);
  footprints();
}
function roomSeat() { chair13(-60, 1555, { dir: 1 }); }   // Brenda's chair, behind the table
function roomFront(lt, ST) {   // the table, its things, and the empty chair across from Brenda
  table3(TBL.x, TBL.z, { w: TBL.w, d: TBL.d, h: TBL.h, color: '#b89a68' });
  tableItems(lt, ST);
}
// the relief's chair, pulled out at the right-hand end of the table: seen in profile (its back on the right), a cardigan from 2019 still hanging on it
const CHAIR2 = { x: 236, z: 1398 };
function chairSide(X, Z, o = {}) {
  const w = o.w ?? 48, d = o.d ?? 44, seat = o.seat ?? 112, back = o.back ?? 248, c = o.color ?? '#8a6a4a', leg = '#3a3a44', sd = o.side ?? 1;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box3({ x0: X + dx * (w - 6) - 4, x1: X + dx * (w - 6) + 4, y1: seat, z0: Z + dz * (d - 6) - 4, z1: Z + dz * (d - 6) + 4, color: leg, lw: 1 });
  box3({ x0: X - w, x1: X + w, y0: seat, y1: seat + 14, z0: Z - d, z1: Z + d, color: c });
  const bx0 = sd > 0 ? X + w - 10 : X - w, bx1 = sd > 0 ? X + w : X - w + 10;
  box3({ x0: bx0, x1: bx1, y0: seat + 14, y1: back, z0: Z - d, z1: Z + d, color: c, top: lit(c, 1.1) });
  box3({ x0: bx0 - 3, x1: bx1 + 3, y0: back - 30, y1: back - 18, z0: Z - d, z1: Z + d, color: lit(c, .92), lw: 1.4 });
  dustTop(X - w, X + w, seat + 14, Z - d, Z + d, .42);
  dustTop(bx0, bx1, back, Z - d, Z + d, .5);
  if (o.cardigan) stand(X + sd * (w - 4), back + 2, Z - d - 2, () => {   // a lilac cardigan over the top of the back: shoulders, one sleeve hanging, buttons, a drift of dust
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 3;
    const g = V2.grad(0, -30, 0, 150, [[0, '#9a86b4'], [1, '#6e5c8c']]); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-sd * 4, -22); ctx.bezierCurveTo(-sd * 30, -26, -sd * 54, -2, -sd * 58, 40); ctx.bezierCurveTo(-sd * 62, 96, -sd * 56, 128, -sd * 44, 150); ctx.lineTo(-sd * 20, 146); ctx.bezierCurveTo(-sd * 26, 104, -sd * 18, 62, sd * 6, 42); ctx.lineTo(sd * 12, 70); ctx.bezierCurveTo(sd * 16, 100, sd * 14, 120, sd * 10, 140); ctx.lineTo(sd * 24, 140); ctx.bezierCurveTo(sd * 30, 100, sd * 26, 50, sd * 18, 4); ctx.bezierCurveTo(sd * 12, -18, sd * 4, -24, -sd * 4, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,28,60,.35)'; ctx.lineWidth = 2.4; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-sd * (14 + i * 9), -8 + i * 4); ctx.quadraticCurveTo(-sd * (18 + i * 9), 60 + i * 8, -sd * (12 + i * 8), 130); ctx.stroke(); }
    ctx.fillStyle = '#d8c8e6'; for (let i = 0; i < 3; i++) { ell(sd * 2, 2 + i * 28, 4.4, 4.4); ctx.fill(); }
    ctx.fillStyle = 'rgba(214,210,200,.55)'; ctx.beginPath(); ctx.moveTo(-sd * 30, -18); ctx.bezierCurveTo(-sd * 12, -34, sd * 8, -30, sd * 14, -12); ctx.bezierCurveTo(sd * 2, -4, -sd * 18, -2, -sd * 30, -18); ctx.fill();
    A13.cobweb('orb', [-sd * 36, 60, 26], { alpha: .5, seed: 11, lw: 1.3 });
  });
}
function nearChair() { chairSide(CHAIR2.x, CHAIR2.z, { cardigan: true }); }


// ------------------------------------------------------------------ time and words
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const lineSpan = id => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id); return l ? [l.s - CUR.start, l.e - CUR.start] : [0, 0]; };
const ph = (lt, a, b) => sk(lt, a, b);                                   // 0..1, smooth
const pulse = (lt, t0, d) => lt < t0 || lt > t0 + d ? 0 : Math.sin((lt - t0) / d * PI);   // one hump
const damp = (lt, t0, hz = 14, tau = .18) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);   // a wobble after a hit
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const A2 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ------------------------------------------------------------------ the state of the lights, a pure function of scene time
const AMB_DARK = [17, 23, 27], AMB_TUBE = [204, 226, 214], RED_ON = [255, 54, 64];
function tubeAt(lt) {
  if (lt < 22.34) return 0;
  if (lt < 22.67) { for (const [t0, d, v] of [[22.34, .05, .5], [22.48, .06, .75], [22.6, .06, .95]]) if (lt >= t0 && lt < t0 + d) return v; return 0; }
  if (lt < 27.18) return lt < 23.5 ? (hash(Math.floor(lt * 20) + 5) > .9 ? .6 : 1) : (hash(Math.floor(lt * 9) + 2) > .965 ? .78 : 1);
  if (lt < 28.8) return hash(Math.floor(lt * 30) + 11) > .64 ? .85 : .06;   // the tube stutters in the red light
  if (lt < 33.3) return hash(Math.floor(lt * 14) + 3) > .82 ? .04 : .3;
  return .3 * (1 - ph(lt, 33.3, 34.2));
}
function alarmAt(lt) {   // the red strobe: a hard flash at the freeze, then a pulse about 2.4 times a second until the door closes (it never goes fully out)
  if (lt < 27.18) return 0;
  if (lt < 27.3) return 1;
  if (lt < 27.58) return .4;
  const env = 1 - ph(lt, 33.5, 34.4);
  return env * (Math.sin((lt - 27.58) * TAU * 2.4 + 1.2) > -.1 ? 1 : .45);
}
function state(lt) {
  const ST = {}, tube = tubeAt(lt), al = alarmAt(lt);
  ST.tube = tube; ST.alarm = al; ST.tubeShow = tube; ST.moon = f => moonPaint(lt, ST, f);
  ST.hall = lt < 2.85 ? 0 : 1 + ph(lt, 20.6, 21.9) * .8 - ph(lt, 32.4, 33.2) * .2;   // the door is open from the first cut; it floods when Brenda leaves
  ST.draft = lt < 2.85 ? 1 : .6 + ph(lt, 20.8, 21.8);
  ST.vend = (.3 + .1 * Math.sin(lt * 1.9) - (hash(Math.floor(lt * 11) + 7) > .94 ? .18 : 0)) * (1 - tube * .55) + .1 * tube;
  // the room's own level: dark, then the tube, then red over everything
  let amb = mix3(AMB_DARK, AMB_TUBE, tube);
  amb = mix3(amb, A2(RED_ON, .95), Math.min(1, al * .88));
  if (al > 0 && lt > 27.58) amb = A2(amb, .55 + .45 * al);
  ST.amb = amb;
  return ST;
}

// ------------------------------------------------------------------ cast: where they stand, what they do. One function per person, all pure functions of scene time
const KD = k => KINDS[k] || KINDS.lemon;
const WIDE = { lemon: [-345, 1250], straw: [-170, 1200], mango: [165, 1212], clem: [345, 1262], brenda: [25, 1520] };
const BR_Y = 98;   // Brenda's body centre sits this high above the floor-point of her chair when she is seated (so standing up is a stretch, not a jump)
/* a point of a character's own frame (local px, origin at the body centre) in scene coordinates */
const handAt = (o, lx, ly) => { const k = KD(o.kind), leg = o.noLegs ? 0 : (k.leg || 90); return [o.x + lx * o.s, o.y - (o.lift || 0) - (leg + k.ry * .9) * o.s + ly * o.s]; };
const SH = { straw: [104, -13], lemon: [103, 7], mango: [92, 12], clem: [96, 10], brenda: [99, 12] };   // shoulder points, local
const mk = (ctor, X, Z, ex) => ctor(Object.assign(V2.at(X, Z), ex));
const lookAt = (o, tx, ty, k = 1) => { const [cx, cy] = faceC(o); const dx = tx - cx, dy = ty - cy, L = Math.hypot(dx, dy) || 1; return [clamp(dx / L, -1, 1) * k, clamp(dy / L, -1, 1) * k]; };

// the pen: each of the crew holds a penlight; where it points is decided by penPlan(), the character just has to hold it there
function withPen(o, side, grip, aimAt, on = 1) {
  const key = side > 0 ? 'r' : 'l';
  o.hold = Object.assign({}, o.hold, { [key]: 'fp13_pen' });
  o.grip = Object.assign({}, o.grip, { [key]: grip });
  o.arms = Object.assign({}, o.arms, { [key]: 'hold' });
  const h = handAt(o, grip[0], grip[1]);
  o.penOn = on;
  if (aimAt) { o.penAim = Math.atan2(aimAt[0] - h[0], -(aimAt[1] - h[1])); const L = 62 * o.s; o._pen = { hand: h, tip: [h[0] + Math.sin(o.penAim) * L, h[1] - Math.cos(o.penAim) * L], on }; }
  else { o.penAim = 0; o._pen = { hand: h, tip: [h[0], h[1] - 62 * o.s], on: 0 }; }
}


// ------------------------------------------------------------------ the penlights: where each beam points over time (world points), how strong, how much it shakes
const TG = { banner: [-120, 548, ZB - 6], cal: [10, 384, ZB - 5], clock: [-150, 468, ZB - 4], vend: [-395, 252, VEND.z0], win: [214, 330, ZB], plate: [PLATE.x, 172, PLATE.z], tent: [CARD.x, 204, CARD.z], brenda: [25, 196, 1508],
  chair: [CHAIR2.x, 150, CHAIR2.z], floorB: [-60, 0, 1296], floorL: [-250, 0, 1330], floorR: [150, 0, 1330], ceil: [-40, CH, 1500] };
const PEN_PLAN = {
  lemon: [[0, 'clock', .8, 0], [4.3, 'plate', .85, 0], [5.08, 'brenda', 1, 1], [6.43, 'floorB', .55, 0], [8.7, 'clock', .8, 0], [9.35, 'cal', .85, 0], [10.6, 'brenda', .6, 0], [12.2, 'chair', .8, 0], [13.2, 'brenda', .8, 0], [15.4, 'brenda', 1, 1], [16.0, 'floorB', .6, 0]],
  straw: [[0, 'banner', .8, 0], [3.9, 'tent', .85, 0], [5.08, 'brenda', 1, 1], [6.4, 'brenda', .6, 0], [15.4, 'brenda', 1, 1], [16.0, 'floorB', .6, 0]],
  mango: [[0, 'cal', .8, 0], [3.75, 'plate', .9, 0], [5.08, 'brenda', 1, 1], [6.4, 'brenda', .7, 0], [15.4, 'brenda', 1, 1], [16.0, 'floorL', .6, 0]],
  clem: [[0, 'win', .8, 0], [4.5, 'tent', .85, 0], [5.08, 'brenda', 1, 1], [6.4, 'brenda', .7, 0], [15.4, 'brenda', 1, 1], [16.0, 'floorR', .6, 0]],
};
function penPlan(who, lt) {
  const keys = PEN_PLAN[who];
  let i = 0; while (i + 1 < keys.length && lt >= keys[i + 1][0]) i++;
  const [t0, name, a, shake] = keys[i], prev = keys[Math.max(0, i - 1)], k = ph(lt, t0, t0 + .28);
  const P = TG[name], Q = TG[prev[1]];
  const wob = (hash(who.length * 7) + .5) * 1.7;
  const tgt = [lerp(Q[0], P[0], k) + 22 * Math.sin(lt * .9 * wob + who.length), lerp(Q[1], P[1], k) + 16 * Math.cos(lt * 1.1 * wob + who.length), lerp(Q[2], P[2], k)];
  const sh = lerp(prev[3], shake, k), fade = 1 - ph(lt, 22.5, 22.75);
  return { tgt, a: lerp(prev[2], a, k) * fade, shake: sh, name };
}

// ------------------------------------------------------------------ Lemon, Mango, Clementine, Strawberry
// every actor: a function of scene time that returns drawChar options (plus a pen record for the light rig). They share these habits: eyes dart between where the thought is, the body leans a little on every beat, the mouth belongs to the voice.
const track = (keys, lt) => {   // [t, [v..]] eased between keys
  if (lt <= keys[0][0]) return keys[0][1].slice();
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], e = easeIO(seg(lt, a[0], b[0])); return a[1].map((v, j) => lerp(v, b[1][j], e)); }
  return keys[keys.length - 1][1].slice();
};
const inR = (lt, a, b) => lt >= a && lt < b;

function actLemon(lt, ex = {}, pos = null) {
  const [X0, Z0] = WIDE.lemon, bow = ph(lt, 20.2, 20.7) * (1 - ph(lt, 21.9, 22.4));
  let [X, Z] = pos || [X0 - 40 * bow, Z0];
  const exit = ph(lt, 32.45, 33.0);   // rushes out, toward the door behind the camera
  X = lerp(X, -240, easeIn(exit)); Z = lerp(Z, 420, easeIn(exit));
  const o = mk(A7.lemon, X, Z, { expr: 'neutral', arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {} });
  o.expr = lt < 5.08 ? 'neutral' : lt < 6.43 ? 'shock' : lt < 7.5 ? 'sad' : lt < 11.87 ? 'neutral' : lt < 13.28 ? 'sad' : lt < 15.38 ? 'neutral' : lt < 16.3 ? 'shock' : lt < 22.0 ? 'sad' : lt < 25.7 ? 'neutral' : lt < 28.83 ? 'panic' : lt < 30.6 ? 'dead' : lt < 31.99 ? 'neutral' : 'happy';
  o.look = track([[0, [.5, -.1]], [2.9, [.55, -.3]], [3.8, [.2, .1]], [5.08, [.4, -.15]], [6.43, [.3, .5]], [7.36, [.5, .1]], [8.3, [.45, -.1]], [8.91, [.5, -.5]], [9.42, [.4, -.55]], [10.0, [.35, 0]], [10.63, [.5, .05]], [11.87, [.35, .45]], [12.5, [.4, .5]], [13.28, [.45, -.05]],
    [15.38, [.3, .0]], [16.5, [.5, 0]], [20.2, [.5, .2]], [22.2, [.5, .15]], [24.6, [.55, -.2]], [25.8, [.5, -.4]], [26.1, [0, 0]], [28.83, [.55, -.35]], [30.0, [.5, -.1]], [30.7, [.5, .1]], [32.0, [.1, .2]]], lt);
  o.lid = lt < 6.43 ? undefined : (lt < 7.4 ? .38 : lt < 11.87 ? undefined : lt < 13.28 ? .4 : undefined);
  const pen = penPlan('lemon', lt);
  const gesture = inR(lt, 8.22, 10.43), handFree = lt >= 6.43 && lt < 7.3;
  // free hand: on her chest for "Brenda." and the hats-off; open and slow when she tells the story; points on "Sit."
  if (handFree || (lt >= 20.2 && lt < 22.0)) { o.grip.l = [-44, 36]; o.arms.l = 'hold'; o.hand.l = 'flat'; }
  else if (gesture) { o.arms.l = [1.15 + .12 * Math.sin(lt * 2.2), .5]; o.hand.l = 'open'; }
  else if (inR(lt, 30.67, 31.86)) { o.arms.r = lt > 31.3 ? 'point' : [1.2, .3]; o.hand.r = lt > 31.3 ? 'point' : 'flat'; }
  if (inR(lt, 26.0, 28.83)) { o.grip.l = [-40, 34]; o.arms.l = 'hold'; o.hand.l = 'fist'; }
  if (lt < 22.34) withPen(o, 1, [150, -34], pen.tgt ? p2(pen.tgt[0], pen.tgt[1], pen.tgt[2]) : null, pen.a > .05 ? 1 : 0);
  if (lt >= 31.99) { o.arms.r = [1.9 * ph(lt, 32.0, 32.3) + .3, .3]; }
  o.rot = .05 * Math.sin(lt * .8) + .07 * pulse(lt, 6.43, .9) + .05 * bow + (inR(lt, 26.0, 28.83) ? .0 : 0);
  if (inR(lt, 28.83, 29.6)) { o.twitch = true; o.browUp = -6; }
  if (inR(lt, 26.0, 28.83)) { o.mouthOpen = .55; o.shake = lt < 27.18 ? 2.2 : 0; }
  if (inR(lt, 5.08, 6.4)) o.shake = 2.2;
  o.sparkle = inR(lt, 16.3, 20.2);
  o.penPlan = pen; o.z = Z;
  return Object.assign(o, ex);
}

function actMango(lt, ex = {}, pos = null) {
  const [X0, Z0] = WIDE.mango, bow = ph(lt, 20.2, 20.7) * (1 - ph(lt, 21.9, 22.4));
  let [X, Z] = pos || [X0 - 30 * bow, Z0];
  const exit = ph(lt, 32.3, 32.85);
  X = lerp(X, -170, easeIn(exit)); Z = lerp(Z, 380, easeIn(exit));
  const o = mk(A7.mango, X, Z, { expr: 'neutral', arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {} });
  o.expr = lt < 3.75 ? 'neutral' : lt < 5.08 ? 'hopeful' : lt < 6.43 ? 'shock' : lt < 10.63 ? 'neutral' : lt < 11.72 ? 'shock' : lt < 13.28 ? 'sad' : lt < 15.38 ? 'hopeful' : lt < 16.3 ? 'shock' : lt < 20.15 ? 'sad' : lt < 22 ? 'sad' : lt < 25.9 ? 'happy' : lt < 28.83 ? 'panic' : lt < 30.67 ? 'dead' : lt < 32.0 ? 'sour' : 'happy';
  o.look = track([[0, [-.4, -.2]], [2.9, [-.55, -.3]], [3.75, [-.45, .15]], [5.08, [-.4, -.1]], [8.2, [-.3, -.1]], [9.2, [-.5, -.35]], [10.63, [-.4, 0]], [11.8, [-.2, .35]], [13.28, [-.4, -.05]], [16.5, [-.45, 0]], [22.2, [-.4, .1]], [24.0, [-.5, .3]], [25.8, [-.5, -.4]], [28.83, [-.5, -.2]], [30.7, [-.3, -.2]]], lt);
  const pen = penPlan('mango', lt);
  const hop = Math.max(0, pulse(lt, 4.3, .34)) * 16 + pulse(lt, 15.4, .3) * 10 + (lt >= 32.3 ? Math.abs(Math.sin((lt - 32.3) * 9)) * 22 * (1 - exit) : 0);
  o.lift = (o.lift || 0) + hop * o.s;
  // hand over her mouth at the find and at "never came back", hands clasped through Brenda's speech, on the heart for the hats-off
  const mouthHand = inR(lt, 5.2, 6.4) || inR(lt, 10.63, 11.6);
  if (mouthHand) { o.grip.l = [-14, 40]; o.arms.l = 'hold'; o.hand.l = 'flat'; }
  else if (inR(lt, 15.38, 16.2)) { o.grip.l = [-60, 4]; o.grip.r = [60, 4]; o.arms.l = 'hold'; o.arms.r = 'hold'; o.hand.l = 'open'; o.hand.r = 'open'; }
  else if (inR(lt, 16.2, 20.15)) { o.grip.l = [-8, 30]; o.grip.r = [8, 34]; o.arms.l = 'hold'; o.arms.r = 'hold'; o.hand.l = 'grip'; o.hand.r = 'grip'; }
  else if (inR(lt, 20.2, 22.0)) { o.grip.r = [40, 36]; o.arms.r = 'hold'; o.hand.r = 'flat'; }
  else if (inR(lt, 26.0, 28.83)) { o.arms.l = 'up'; o.arms.r = 'up'; o.hand.l = 'open'; o.hand.r = 'open'; }
  if (!mouthHand && !inR(lt, 15.38, 20.15) && lt < 22.34) withPen(o, -1, [-140, -30], pen.tgt ? p2(pen.tgt[0], pen.tgt[1], pen.tgt[2]) : null, pen.a > .05 ? 1 : 0);
  if (inR(lt, 3.75, 4.9)) { o.arms.l = 'point'; }
  o.rot = -.04 * Math.sin(lt * .9) - .05 * pulse(lt, 13.28, 1.9) + .04 * bow;
  if (inR(lt, 26.0, 28.83)) { o.mouthOpen = .8; o.shake = lt < 27.18 ? 2.4 : 0; }
  if (inR(lt, 5.08, 6.4)) o.shake = 2.2;
  o.sparkle = inR(lt, 10.63, 20.2);
  if (lt >= 32.0) o.arms = { l: [2.2 * ph(lt, 32.0, 32.3) + .3, .3], r: 'run' };
  o.penPlan = pen; o.z = Z;
  return Object.assign(o, ex);
}

function actClem(lt, ex = {}, pos = null) {
  const [X0, Z0] = WIDE.clem, bow = ph(lt, 20.2, 20.7) * (1 - ph(lt, 21.9, 22.4));
  let [X, Z] = pos || [X0, Z0];
  const exit = ph(lt, 32.12, 32.6);
  X = lerp(X, -60, easeIn(exit)); Z = lerp(Z, 340, easeIn(exit));
  const o = mk(A10.clem, X, Z, { expr: 'hopeful', arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {} });
  o.expr = lt < 5.08 ? 'hopeful' : lt < 6.43 ? 'panic' : lt < 7.36 ? 'shock' : lt < 8.22 ? 'neutral' : lt < 13.28 ? 'sad' : lt < 15.38 ? 'hopeful' : lt < 16.3 ? 'shock' : lt < 20.15 ? 'sad' : lt < 22 ? 'sad' : lt < 25.9 ? 'happy' : lt < 28.83 ? 'panic' : lt < 32.0 ? 'shock' : 'happy';
  o.look = track([[0, [-.5, -.4]], [2.9, [-.5, -.5]], [4.4, [-.6, .1]], [5.08, [-.5, -.1]], [7.3, [-.3, .0]], [8.2, [-.4, -.1]], [10.5, [-.5, 0]], [13.28, [-.5, -.1]], [16.5, [-.5, 0]], [22.2, [-.4, .1]], [25.8, [-.4, -.4]], [28.83, [-.3, -.3]], [31.0, [-.4, -.1]]], lt);
  const pen = penPlan('clem', lt);
  const hop = pulse(lt, 15.4, .3) * 12 + (lt >= 32.12 ? Math.abs(Math.sin((lt - 32.12) * 10)) * 26 * (1 - exit * .5) : 0) + pulse(lt, 32.03, .3) * 16;
  o.lift = (o.lift || 0) + hop * o.s;
  const handUp = inR(lt, 7.36, 8.2);
  if (handUp) { o.grip.r = [100, -52]; o.arms.r = 'hold'; o.hand.r = 'open'; }
  else if (inR(lt, 26.0, 28.83)) { o.grip.l = [-12, 36]; o.grip.r = [12, 36]; o.arms.l = 'hold'; o.arms.r = 'hold'; o.hand.l = 'flat'; o.hand.r = 'flat'; }
  else if (inR(lt, 20.2, 22.0)) { o.grip.r = [38, 34]; o.arms.r = 'hold'; o.hand.r = 'flat'; }
  if (!handUp && lt < 22.34) withPen(o, -1, [-132, -22], pen.tgt ? p2(pen.tgt[0], pen.tgt[1], pen.tgt[2]) : null, pen.a > .05 ? 1 : 0);
  o.rot = (inR(lt, 7.36, 8.2) ? -.1 : 0) + .04 * Math.sin(lt * 1.3 + 1) + .04 * bow;
  if (inR(lt, 5.08, 6.4)) o.shake = 2.6;
  if (inR(lt, 26.0, 28.83)) { o.mouthOpen = .3; o.shake = lt < 27.18 ? 2.8 : 0; }
  o.sparkle = inR(lt, 16.3, 20.2);
  if (lt >= 32.0) { o.arms = { l: 'run', r: lt < 32.45 ? [2.6, .3] : 'run' }; }
  o.penPlan = pen; o.z = Z;
  return Object.assign(o, ex);
}


// ------------------------------------------------------------------ Strawberry: awe, resolve, the chair, the first bite in seven hours
const SEATP = [25, 1520];   // Brenda's chair, then Strawberry's
const strawRoute = route => lt => route(lt);
const keyRoute = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const STRAW_PATH = keyRoute([[0, WIDE.straw[0], WIDE.straw[1]], [15.95, WIDE.straw[0], WIDE.straw[1]], [16.9, -105, 1262, 'io'], [20.3, -105, 1262], [20.9, -215, 1275, 'io'], [21.3, -215, 1275], [21.75, -255, 1415, 'io'], [22.27, SEATP[0], SEATP[1] - 20, 'io']]);
const SIT_T = 22.28;
function actStraw(lt, ex = {}, pos = null, seatPos = null) {
  const route = pos ? () => pos : STRAW_PATH, sp = seatPos || SEATP;
  const [X, Z] = route(lt), seated = lt >= SIT_T;
  const dt = lt - SIT_T, drop = seated ? Math.sin(PI * seg(dt, 0, .38)) * (1 - seg(dt, .38, .55)) : 0;
  let o;
  const mkS = (extra) => person(A11.straw, route, lt, extra);
  const base = { expr: 'neutral', arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {}, id: 'straw', who: 'straw' };
  if (!seated) o = mkS(Object.assign(base, { stride: lt < 21.9 ? 30 : 38 }));
  else { const q = V2.at(sp[0], sp[1]); o = A11.straw(Object.assign(q, base, { noLegs: true, noShadow: true, noReflect: true })); o.y = q.y - 92 * q.s; o.lift = 0; o.squash = .16 * drop; }
  // the face
  o.expr = lt < 2.85 ? 'neutral' : lt < 3.75 ? 'hopeful' : lt < 5.08 ? 'neutral' : lt < 6.43 ? 'shock' : lt < 11.87 ? 'dead' : lt < 13.28 ? 'sad' : lt < 15.38 ? 'hopeful' : lt < 15.95 ? 'shock' : lt < 22.0 ? 'neutral' : lt < 23.85 ? 'chill' : lt < 28.83 ? 'happy' : lt < 30.67 ? 'shock' : lt < 32.59 ? 'chill' : 'smug';
  if (inR(lt, 2.85, 3.75)) o.face = { wide: 1.14, raise: 14 };
  if (inR(lt, 15.95, 20.15)) o.face = { curve: .7, lid: .12, raise: 4, ang: -.2, wide: 1.04 };
  o.look = track([[0, [.4, -.1]], [2.9, [.5, -.45]], [3.55, [.55, -.5]], [3.8, [.4, .0]], [4.6, [.25, .15]], [5.08, [.4, -.1]], [6.43, [.45, -.1]], [13.28, [.5, -.1]], [15.4, [.45, 0]], [16.2, [.55, -.1]], [19.9, [.5, -.12]], [20.3, [.2, .3]], [21.5, [-.4, .1]], [22.4, [.3, -.1]], [24.0, [0, .4]], [28.83, [-.5, -.3]], [30.7, [-.5, -.3]], [31.9, [-.4, -.2]]], lt);
  const chew = inR(lt, 23.9, 27.18) || inR(lt, 32.55, 33.6) || inR(lt, 29.0, 28.8);
  if (inR(lt, 23.9, 27.18)) { o.lid = 1; o.shut = 1; o.mouthOpen = Math.max(0, .26 * Math.sin((lt - 23.9) * 9)) * (lt > 24.4 ? 1 : .6); }
  if (inR(lt, 32.55, 33.6)) { o.lid = 1; o.shut = 1; o.mouthOpen = Math.max(0, .2 * Math.sin((lt - 32.6) * 9)); }
  if (inR(lt, 27.18, 28.83)) { o.lid = 1; o.shut = 1; o.mouthOpen = .0; }
  void chew;
  o.sparkle = inR(lt, 17.4, 20.3);
  // pen and hands
  const pen = penPlan('straw', lt);
  if (lt < 15.95) withPen(o, 1, [148, -42], pen.tgt ? p2(pen.tgt[0], pen.tgt[1], pen.tgt[2]) : null, pen.a > .05 ? 1 : 0);
  if (inR(lt, 15.95, 20.9)) { const k = ph(lt, 16.0, 16.5); o.grip.r = [lerp(120, 205, k), lerp(30, 14, k)]; o.arms.r = 'hold'; o.hand.r = 'open'; }   // her hand out to Brenda, palm up
  if (inR(lt, 20.9, 22.0)) { o.grip.r = [44, 38]; o.arms.r = 'hold'; o.hand.r = 'flat'; o.cap = false; o.hold = { l: 'fp13_cap' }; o.grip.l = [-40, 36]; o.arms.l = 'hold'; }   // hat over her heart
  if (inR(lt, 20.0, 20.9)) { o.cap = false; o.hold = Object.assign({}, o.hold, { l: 'fp13_cap' }); o.grip.l = [-46, 34]; o.arms.l = 'hold'; }
  if (seated && lt < 23.1) { o.arms = { l: 'rest', r: 'rest' }; o.hold = {}; o.grip = {}; }
  if (lt >= 22.0 && lt < 23.1) { o.cap = true; }
  // the granola bar: out of her pocket, unwrapped, to her mouth
  if (lt >= 23.1) {
    const un = ph(lt, 23.12, 23.55), toMouth = ph(lt, 23.62, 23.9), bite = ph(lt, 23.9, 24.1), bite2 = ph(lt, 33.0, 33.2);
    o.hold = { l: 'fp13_bar' }; o.arms = { l: 'hold', r: 'hold' }; o.hand = { l: 'grip', r: 'grip' };
    o.grip = { l: [lerp(-70, -26, toMouth), lerp(30, 30, toMouth) + 12 * (1 - toMouth)], r: [lerp(-40 + 22 * un, -20, toMouth), lerp(24, 44, toMouth)] };
    o.barOpen = un; o.barBite = Math.max(bite * .4, lt > 32 ? .4 + .2 * bite2 : 0); o.barRot = lerp(0, .9, toMouth);
  }
  o.rot = seated ? (lt < 23.1 ? -.03 : 0) + .02 * Math.sin(lt * 1.6) : .03 * Math.sin(lt * .9);
  if (inR(lt, 5.08, 6.4) || inR(lt, 15.4, 15.95)) o.shake = 1.8;
  if (!seated) o.transit = false;
  if (inR(lt, 28.83, 30.67)) o.shut = 0;
  o.acc = (o.acc || []).concat(['fp13_shut']);
  o.penPlan = pen; o.z = seated ? sp[1] : Z; o.seated = seated;
  return Object.assign(o, ex);
}

// ------------------------------------------------------------------ Brenda
const BR_ROUTE = keyRoute([[0, SEATP[0], SEATP[1]], [20.45, SEATP[0], SEATP[1]], [20.95, -215, 1470, 'io']]);
function actBrenda(lt, ex = {}, pos = null, route = null) {
  const rt = route || (pos ? () => pos : BR_ROUTE);
  const [X, Z] = rt(lt), up = lt >= 20.45, q = V2.at(X, Z);
  const base = { expr: A13.expr('weak'), arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {} };
  const first = lineSpan('br1')[0];   // 13.28
  // phases: asleep (eyes shut, hands folded, web across her mouth) -> one eye cracks -> awake -> tearful -> relieved -> stands, stretches
  const wake = ph(lt, first, first + .3), eye2 = ph(lt, first + .85, first + 1.15), fullWake = ph(lt, 14.2, 15.0);
  const o = up ? person(A13.brenda, rt, lt, Object.assign({ stride: 22 }, base)) : A13.brenda(Object.assign(q, base));
  if (!up) { o.noLegs = true; o.noShadow = true; o.noReflect = true; o.y = q.y - BR_Y * q.s; o.lift = 0; }
  o.dust = lt < 20.45 ? .85 - .1 * ph(lt, 13.28, 15.2) : lerp(.75, .08, ph(lt, 20.45, 21.2));
  // the eyes: shut (lid 1 + the lash arcs) until she wakes; the right one first, then the other
  const lidA = lt < first ? 1 : lerp(1, .42, wake);
  o.lid = lt < first ? 1 : (lt < first + .85 ? lidA : lerp(lidA, .26, eye2));
  o.shut = lt < first + .02 ? 1 : 0;
  o.expr = A13.expr(lt < first ? 'weak' : lt < 15.4 ? 'wake' : lt < 17.5 ? 'weak' : lt < 19.55 ? 'tear' : 'relief');
  if (lt >= 15.4 && lt < 17.5) o.face = { raise: 12, curve: -.2, lid: .2 };
  if (lt >= 15.4 && lt < 17.5) o.lid = .22;
  if (lt >= 17.5 && lt < 19.55) o.lid = .3;
  if (lt >= 19.55) o.lid = .2;
  o.look = track([[0, [0, .2]], [13.3, [.0, .3]], [14.0, [-.3, .1]], [15.0, [-.5, -.1]], [15.8, [.5, -.1]], [16.3, [-.55, 0]], [17.0, [-.5, -.1]], [17.55, [-.55, .05]], [19.0, [-.5, .2]], [19.6, [-.4, 0]], [20.3, [.0, -.2]], [20.9, [-.5, 0]]], lt);
  o.specsDrop = lerp(.7, .9, ph(lt, 13.5, 19.5)) - .5 * ph(lt, 20.6, 20.9);
  // the cobweb across her mouth: stretches on the first word, snaps at 13.45
  const wsnap = first + .2;
  o.web = lt < 20.6 ? (lt > 14.8 ? 1 - ph(lt, 14.6, 15.0) : 1) : 0;
  o.webT = lt < wsnap ? -1 : lt - wsnap;
  o.tear = ph(lt, 17.62, 19.5) * (lt < 20.4 ? 1 : 1 - ph(lt, 20.4, 20.8));
  // the body: upright and still; she draws a breath at the wake; head lifts; hands folded at her chest with cobwebs between the fingers
  const lift = ph(lt, first, first + .5) * 7 - 4 * pulse(lt, 14.2, 1.0);
  o.y -= lift * o.s * .5;
  o.rot = .02 * Math.sin(lt * .8) - .03 * ph(lt, first, first + .6) + (lt > 17.6 && lt < 19.9 ? .012 * Math.sin(lt * 7) : 0);
  if (lt < 20.15) { o.grip = { l: [-22, 20], r: [22, 24] }; o.arms = { l: 'hold', r: 'hold' }; o.hand = { l: 'grip', r: 'grip' }; }
  // she stands: a crouch, a stretch (arms up, a long breath), a wobble, then the first steps
  if (lt >= 20.15) {
    const k = lt - 20.15, crouch = pulse(lt, 20.15, .35) * .16, stretch = ph(lt, 20.5, 20.85) * (1 - ph(lt, 20.85, 21.2));
    o.squash = crouch - .08 * stretch; if (up) o.plant = true;
    o.arms = { l: stretch > .05 ? 'up' : 'rest', r: stretch > .05 ? 'up' : 'rest' }; o.hand = { l: 'open', r: 'open' }; o.grip = {};
    o.shake = lt < 20.45 ? 2.4 : 0;
    o.rot = .05 * Math.sin(k * 9) * Math.exp(-k * 1.2);
    if (up) { const sp = Math.hypot(...[0, 0]); void sp; }
  }
  o.z = Z; o.seated = !up;
  return Object.assign(o, ex);
}


// ------------------------------------------------------------------ the other end of the room, looking back at the door wall (view S): the door in the middle, the Q sign over it, a panel of call lights either side
const ZBS = 1550, SDOOR = { x0: -133, x1: 133, y1: 363 };
const CALL_COLS = 4, CALL_ROWS = 4;
/* a block of the call-light board: 4 x 4 domes (the board is two panels, one either side of the door, 16 + 16 = 32 domes). lit(i) -> 0 | level (red) for the dome's global index */
function callPanel(x, y, w, h, first, lit_, o = {}) {
  const id = o.id || 'callp' + first, hero = o.hero === true;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = h * .06; ctx.shadowOffsetY = h * .02; ctx.fillStyle = '#20242c'; rr(x, y, w, h, h * .04); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = Math.max(2, h * .014); rr(x, y, w, h, h * .04); ctx.stroke();
  const hh = h * .15; ctx.fillStyle = '#12151b'; rr(x + h * .025, y + h * .025, w - h * .05, hh, h * .025); ctx.fill();
  ctx.restore();
  UI.container(id, 'sign', [x, y, x + w, y + h], h * .025);
  UI.container(id + 'h', 'sign', [x + h * .025, y + h * .025, x + w - h * .025, y + h * .025 + hh], 0);
  lab13(o.title || 'NURSE CALL', x + w / 2, y + h * .025 + hh / 2, { size: hh * .5, weight: 900, fill: '#c9d2e6', spacing: hh * .08, maxW: w * .8, hero, cid: id + 'h', center: true });
  const gx = w / CALL_COLS, gy = (h - hh - h * .06) / CALL_ROWS, r0 = Math.min(gx, gy) * .3, top = y + h * .025 + hh + h * .02, cells = [];
  for (let n = 0; n < 16; n++) {
    const c = n % CALL_COLS, r = (n / CALL_COLS) | 0, cx = x + gx * (c + .5), cy = top + gy * (r + .5), lv = lit_(first + n) || 0;
    ctx.fillStyle = '#0c0e12'; ell(cx, cy, r0 * 1.22, r0 * 1.22); ctx.fill();
    ctx.fillStyle = lv > .02 ? `rgba(255,59,78,${.5 + .5 * lv})` : 'rgb(46,50,58)'; ell(cx, cy, r0, r0); ctx.fill();
    ctx.fillStyle = lv > .02 ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)'; ell(cx - r0 * .3, cy - r0 * .34, r0 * .34, r0 * .26); ctx.fill();
    cells.push({ cx, cy, r: r0, lv });
  }
  return { id, cells, x0: x, y0: y, x1: x + w, y1: y + h };
}
// the cascade: dome i lights at 27.48 + i x 0.022 and keeps flickering; hours on the Q sign roll from 99 to 0
const domeLit = (lt, i) => { const t0 = 27.48 + i * .022; if (lt < t0) return 0; const k = lt - t0; return (k < .08 ? .55 + 4 * k : 1) * (.82 + .18 * Math.sin(lt * 21 + i * 1.7)) * (lt < 33.4 ? 1 : 1 - ph(lt, 33.4, 34.3)); };
const qHours = lt => lt < 27.3 ? 99 : lt < 27.48 ? Math.round(99 * (1 - easeIn(seg(lt, 27.3, 27.48)))) : 0;

function roomSBack(lt, ST, o = {}) {
  S6.shell({ zb: ZBS, hw: HW, ch: CH, wall: PAL.wall, wain: PAL.wain, floorA: PAL.floorA, floorB: PAL.floorB, ceil: PAL.ceil, fog: PAL.fog, fogAmt: .35, tile: 110, bright: .9, rail: 100 });
  const Z = ZBS - 2;
  // water stains and a creep of mould on the door wall
  for (const [x, y, w, h, c, a] of [[-420, 330, 160, 200, '120,96,56', .24], [250, 470, 190, 90, '110,90,50', .22], [-60, 120, 280, 60, '70,84,70', .22]]) {
    const r = wq(Z, x, y, x + w, y + h), cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2; ctx.save(); ctx.translate(cx, cy); ctx.scale(1, Math.abs(r[3] / r[2])); ctx.fillStyle = V2.radial(0, 0, 0, Math.abs(r[2]) / 2, [[0, `rgba(${c},${a})`], [1, `rgba(${c},0)`]]); ctx.beginPath(); ctx.arc(0, 0, Math.abs(r[2]) / 2, 0, TAU); ctx.fill(); ctx.restore();
  }
  // the doorway: frame, the leaf swung back against the room (seen as a slab at the left jamb), the hall beyond (emissive: see emissiveS)
  const { x0, x1, y1 } = SDOOR;
  onZ(Z, x0 - 18, x1 + 18, 0, y1 + 18, '#8d8e86', 'rgba(25,16,30,.7)', 2.6);
  poly(wpoly(Z, x0, 0, x1, y1), '#1a1d22');
  quad3([x0, 0, Z], [x0, 0, Z - 150], [x0, y1, Z - 150], [x0, y1, Z], '#8a929e', 'rgba(25,16,30,.7)', 2.2);
  quad3([x0, 0, Z - 150], [x0 + 12, 0, Z - 150], [x0 + 12, y1, Z - 150], [x0, y1, Z - 150], '#6a727e');
  // the Q sign over the door, the call-light panels either side
  const q = S7.qSign(Z, { x0: -150, x1: 150, y0: 392, y1: 560 }, qHours(lt), { title: '', flash: ST.alarm * .8, flicker: .6 + .4 * ST.alarm });
  { const cx = (q[0][0] + q[1][0]) / 2, w = q[1][0] - q[0][0], h = q[0][1] - q[2][1], top = q[2][1];
    UI.container('q13s', 'sign', [q[0][0], top, q[1][0], top + h * .34], h * .02);
    lab13('HOURS SINCE THE Q WORD', cx, top + h * .18, { size: h * .15, weight: 900, fill: 'rgba(255,255,255,.88)', spacing: h * .018, maxW: w * .9, hero: false, cid: 'q13s', center: true }); }
  const L = wq(Z, -450, 236, -160, 536), R = wq(Z, 160, 236, 450, 536), k = kz(Z), lit_ = i => domeLit(lt, i);
  const hero = px(26) >= 34;
  SCELLS.push(...callPanel(L[0], L[1], L[2], L[3], 0, lit_, { title: 'NURSE CALL  1-16', hero, id: 'callL' }).cells, ...callPanel(R[0], R[1], R[2], R[3], 16, lit_, { title: 'NURSE CALL  17-32', hero, id: 'callR' }).cells);
  // a coat rail by the door with a cardigan and a lunch bag from 2019, an umbrella in the corner
  { const [hx, hy] = p2(-205, 330, Z - 4); ctx.save(); ctx.translate(hx, hy); ctx.scale(k, k);
    ctx.fillStyle = '#9aa0a8'; rr(-6, -8, 12, 12, 3); ctx.fill();
    ctx.fillStyle = '#7a6a8a'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(0, -12, 30, 0); ctx.lineTo(44, 120); ctx.lineTo(-44, 120); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(214,210,200,.5)'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(0, -12, 30, 0); ctx.lineTo(34, 16); ctx.lineTo(-34, 16); ctx.closePath(); ctx.fill(); ctx.restore(); }
  dustTop(x0 - 18, x1 + 18, y1 + 18, Z - 20, Z, .5);
  ceilingLamp(0, 760, CH, ST.tubeShow, '210,236,222', 120, 300);
  { const [x, y] = p2(-HW, CH, Z), kk = kz(Z); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, 1, 0, 0, 1, 150 * kk], { alpha: .6, seed: 4, lw: 1.5 }); ctx.restore(); }
  { const [x, y] = p2(HW, CH, Z), kk = kz(Z); ctx.save(); ctx.translate(x, y); A13.cobweb('corner', [0, 0, -1, 0, 0, 1, 150 * kk], { alpha: .6, seed: 5, lw: 1.5 }); ctx.restore(); }
}
// the hall beyond the open door, and the door's own light (emissive: drawn after the light map)
function emissiveS(lt, ST) {
  const { x0, x1, y1 } = SDOOR, Z = ZBS - 2, f = wpoly(Z, x0, 0, x1, y1), a = ST.hall;
  if (a <= .01) return;
  ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  ctx.fillStyle = V2.grad(0, f[2][1], 0, f[0][1], [[0, '#f3fbff'], [1, '#c8e0f0']]); ctx.globalAlpha = clamp(a); ctx.fillRect(f[0][0] - 4, f[2][1] - 4, f[1][0] - f[0][0] + 8, f[0][1] - f[2][1] + 8);
  ctx.restore();
  const c = p2(0, 190, Z), k = kz(Z);
  V2.glow(c[0], c[1], 520 * k, '210,232,255', .55 * clamp(a), 'screen', .9);
}


// ------------------------------------------------------------------ the Moon: the lookout. He rises into the window while the room wakes up, speaks, and covers his mouth
function moonState(lt) {
  const rise = ph(lt, 22.9, 24.5), o = { k: rise, expr: 'chill', look: [-.1, .2], cover: 0 };
  if (lt >= 24.5) { o.expr = 'happy'; o.look = track([[24.5, [-.15, .15]], [26.0, [-.25, .2]], [27.5, [-.1, .1]], [28.83, [-.3, .2]]], lt); }
  if (lt >= 28.83) { o.expr = 'neutral'; o.look = [-.35, .25]; }
  if (lt >= 29.4) { o.expr = 'sad'; o.look = [-.3, .3]; o.cover = easeOut(seg(lt, 29.45, 29.75)) * (1 - seg(lt, 31.2, 31.6)); }
  if (lt >= 31.2) { o.expr = 'sad'; o.look = [-.4, .2]; }
  return o;
}
function moonPaint(lt, ST, f) {   // inside the clipped glass: the lit face and the glow around it
  const m = moonState(lt);
  if (m.k <= .001) return;
  const [bx, by] = f[0], [rx] = f[1], [, ty] = f[2], w = rx - bx, h = by - ty, r = w * .47, s = r / KINDS.moon7.rx;
  const cx = bx + w / 2, cyFinal = ty + h * .5, cy = lerp(by + r * .9, cyFinal, easeOut(m.k));
  const keep = ctx.globalAlpha;
  ctx.globalAlpha = keep * clamp(m.k * 2.5);
  A7.moon(cx, cy, s, { t: lt, alpha: 1, suppress: false, char: { expr: m.expr, look: m.look, lid: lt < 24.4 ? .45 : undefined } });
  ctx.globalAlpha = keep;
  if (m.cover > .01) {
    const mx = cx - 4 * s, my = cy + KINDS.moon7.mouthY * s, k = m.cover, hx = lerp(cx + r * 1.15, mx + 10 * s, k), hy = lerp(cy + r * 1.1, my + 2 * s, k);
    ctx.save(); ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 40 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + r * 1.35, cy + r * 1.5); ctx.lineTo(hx + 24 * s, hy + 14 * s); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(PI + .14); ctx.scale(2.5 * s, 2.5 * s); V2C.hand('flat', 1, {}); ctx.restore();
  }
}
const moonGlow = (lt, ST) => {   // the light he sheds into the room (screen blend, after the light map)
  const m = moonState(lt); if (m.k <= .02) return;
  const c = p2((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, ZB), k = kz(ZB);
  V2.glow(c[0], c[1], 330 * k, '176,200,255', .26 * m.k, 'screen', .5);
};

// ------------------------------------------------------------------ the cast as a whole, and what the frame lets us show
const PICK = { lemon: actLemon, mango: actMango, clem: actClem, straw: actStraw, brenda: actBrenda };
function castAll(lt, pos = {}, ex = {}) {
  const c = {};
  for (const id of Object.keys(PICK)) c[id] = id === 'straw' ? actStraw(lt, ex[id] || {}, pos[id] || null, pos.seat || null) : PICK[id](lt, ex[id] || {}, pos[id] || null, id === 'brenda' ? pos.brendaRoute || null : undefined);
  return c;
}
const frameRect = (m = 0) => [CAM.x - 540 / CAM.z + m / CAM.z, CAM.y - 960 / CAM.z + m / CAM.z, CAM.x + 540 / CAM.z - m / CAM.z, CAM.y + 960 / CAM.z - m / CAM.z];
const faceRect = o => { const K = KD(o.kind), [fx, fy] = faceC(o), hw = (K.eyeX + K.er * 1.5 + 6) * o.s, hh = ((K.mouthY - K.eyeY) / 2 + K.er * 2.0 + 24) * o.s; return [fx - hw, fy - hh, fx + hw, fy + hh]; };
const rectIn = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[2] <= b[2] && a[3] <= b[3];
const faceInside = (o, m = 12) => rectIn(faceRect(o), frameRect(m));
/* a pen is a prop: it is drawn only when the whole of it lies inside the frame; otherwise the hand holds nothing and the beam enters from beyond the frame edge */
function penCorners(o) {
  const [hx, hy] = o._pen.hand, a = (o.penAim || 0) + (o.rot || 0), s = o.s, ux = Math.sin(a), uy = -Math.cos(a);
  return [[-14, -10], [-14, 10], [68, 10], [68, -10]].map(([t, w]) => [hx + (ux * t - uy * w) * s, hy + (uy * t + ux * w) * s]);
}
function trimPen(o) {
  if (!o._pen || !o.hold) return;
  const key = o.hold.r === 'fp13_pen' ? 'r' : o.hold.l === 'fp13_pen' ? 'l' : null; if (!key) return;
  const fr = frameRect(34), ok = penCorners(o).every(([x, y]) => x > fr[0] && x < fr[2] && y > fr[1] && y < fr[3]);
  o._pen.shown = ok;
  if (!ok) { const h = Object.assign({}, o.hold); delete h[key]; o.hold = h; }
}

// ------------------------------------------------------------------ lamps: the beams of the penlights, the faces a penlight is catching, the light under the door
const PR = { banner: 120, cal: 95, clock: 85, vend: 105, win: 125, plate: 62, tent: 58, brenda: 112, chair: 95, floorB: 135, floorL: 130, floorR: 130, ceil: 150 };
const PEN_COL = '255,240,212';
function penLamps(lt, ST, cast, show) {
  const L = [];
  if (lt > 22.34) return L;
  for (const who of ['lemon', 'straw', 'mango', 'clem']) {
    const c = cast[who]; if (!c || !c._pen || !c.penPlan || !c._pen.on) continue;
    const pl = c.penPlan; if (pl.a < .03) continue;
    const T0 = p2(pl.tgt[0], pl.tgt[1], pl.tgt[2]), kk = kz(pl.tgt[2]), flat = pl.name.startsWith('floor') || pl.name === 'chair', r = PR[pl.name] * kk;
    const j = pl.shake, T = [T0[0] + Math.sin(lt * 47 + who.length * 3) * j * 7, T0[1] + Math.cos(lt * 41 + who.length) * j * 6];
    const shown = !!(show && show[who]) && c._pen.shown !== false;
    let from = c._pen.tip;
    if (!shown) { const dx = T[0] - from[0], dy = T[1] - from[1], d = Math.hypot(dx, dy) || 1; from = [from[0] - dx / d * 1500, from[1] - dy / d * 1500]; }   // the pen is out of shot: the light comes in from beyond the frame
    L.push({ who, from, to: T, r, a: pl.a, flat, s: c.s, z: c.z, shown });
  }
  return L;
}
function lampsToMap(L) {
  for (const l of L) lmSpot(l.to[0], l.to[1], l.r, l.flat ? l.r * .42 : l.r, PEN_COL, Math.min(1, .95 * l.a), { hard: .5 });
}
// light in the air is drawn on two half-size layers: one lamp at a time on layer A, where the bodies nearer the camera than the lamp cut it away, then added to layer B; B goes over the picture in screen blend
const AIR = { a: V2.mk(540, 960), b: V2.mk(540, 960) };
AIR.ga = AIR.a.getContext('2d'); AIR.gb = AIR.b.getContext('2d');
function airBegin(g) { const m = ctx.getTransform(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, 540, 960); g.setTransform(m.a * .5, m.b * .5, m.c * .5, m.d * .5, m.e * .5, m.f * .5); }
function beamG(g, S, T, r0, r1, color, a) {
  const dx = T[0] - S[0], dy = T[1] - S[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, N = 10;
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const f = 1 - i / N * .92, w = a * (.05 + .045 * i / N), gr = g.createLinearGradient(S[0], S[1], T[0], T[1]);
    gr.addColorStop(0, `rgba(${color},${w})`); gr.addColorStop(.55, `rgba(${color},${w * .72})`); gr.addColorStop(1, `rgba(${color},${w * .5})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(S[0] + nx * r0 * f, S[1] + ny * r0 * f); g.lineTo(T[0] + nx * r1 * f, T[1] + ny * r1 * f); g.lineTo(T[0] - nx * r1 * f, T[1] - ny * r1 * f); g.lineTo(S[0] - nx * r0 * f, S[1] - ny * r0 * f); g.closePath(); g.fill();
  }
}
function motesG(g, S, T, r0, r1, t, o = {}) {   // lit dust motes inside a cone (every mote a pure function of t)
  const n = o.n ?? 40, seed = o.seed ?? 1, size = o.size ?? 2.6, a = o.alpha ?? .85, color = o.color ?? '255,246,224';
  const dx = T[0] - S[0], dy = T[1] - S[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u = (sr(i, seed) + t * (.01 + .02 * sr(i, seed + 1))) % 1, v = (sr(i, seed + 2) * 2 - 1) * .9, ph0 = sr(i, seed + 3) * TAU, w = lerp(r0, r1, u);
    const x = S[0] + dx * u + nx * v * w + Math.sin(t * .7 + ph0) * 8 * (.4 + u), y = S[1] + dy * u + ny * v * w + Math.cos(t * .6 + ph0) * 6 + ((t * (6 + 8 * sr(i, seed + 4))) % 40);
    const tw = .45 + .55 * Math.sin(t * (1.1 + 1.6 * sr(i, seed + 5)) + ph0), sz = size * (.45 + sr(i, seed + 6) * .9);
    g.fillStyle = `rgba(${color},${a * tw * (.35 + .65 * sr(i, seed + 7)) * (1 - u * .25)})`; g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
  }
}
function glowG(g, x, y, r, color, a) {
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${color},${a})`); gr.addColorStop(.35, `rgba(${color},${a * .35})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function lampsAir(L, lt, ST, cast, show) {   // the visible cones, the dust turning in them, the bright bulb at each pen tip
  if (!L.length) return;
  const gA = AIR.ga, gB = AIR.gb;
  gB.setTransform(1, 0, 0, 1, 0, 0); gB.globalCompositeOperation = 'source-over'; gB.clearRect(0, 0, 540, 960);
  const occ = [];
  if (cast) for (const id of Object.keys(cast)) { const o = cast[id]; if (!show || !show[id] || id === 'brenda') continue; const K = KD(o.kind), c = handAt(o, 0, 0); occ.push({ id, z: o.z, cx: c[0], cy: c[1], rx: K.rx * o.s * 1.02, ry: K.ry * o.s * 1.02 }); }
  for (const l of L) {
    airBegin(gA);
    const r0 = Math.max(3, 5 * l.s), r1 = l.r * .78;
    beamG(gA, l.from, l.to, r0, r1, PEN_COL, .5 * l.a);
    motesG(gA, l.from, l.to, r0 * 1.5, r1, lt, { n: 40, seed: l.who.length * 5 + 2, alpha: .9 * l.a, size: 2.8 * Math.max(.7, l.s * .8) });
    if (l.shown !== false) glowG(gA, l.from[0], l.from[1], 46 * l.s, '255,246,224', .85 * l.a);
    gA.globalCompositeOperation = 'destination-out'; gA.fillStyle = '#000';
    for (const q of occ) if (l.z != null && q.z < l.z - 1 && q.id !== l.who) { gA.beginPath(); gA.ellipse(q.cx, q.cy, q.rx, q.ry, 0, 0, TAU); gA.fill(); }
    gB.setTransform(1, 0, 0, 1, 0, 0); gB.globalCompositeOperation = 'lighter'; gB.drawImage(AIR.a, 0, 0);
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.imageSmoothingEnabled = true; ctx.drawImage(AIR.b, 0, 0, W, H); ctx.restore();
}
// a penlight (or someone else's) catching a face: a soft warm patch on the face and the shoulders under it; the speaker gets the most
function faceKeys(lt, ST, cast, speaker, subj) {
  if (ST.tube > .55 || lt > 22.34) return;
  for (const id of ['lemon', 'straw', 'mango', 'clem', 'brenda']) {
    const o = cast[id]; if (!o) continue;
    const [fx, fy] = faceC(o), sp = id === speaker, base = id === 'brenda' ? .2 : .32;
    let a = Math.min(1, (sp ? 1.0 : base) * (id === subj ? 1.0 : .8));
    if (id === 'brenda') a *= ph(lt, 5.1, 5.3);   // she stays in the dark until the beams find her
    if (a < .05) continue;
    lmSpot(fx - 20 * o.s, fy + 18 * o.s, 170 * o.s, 200 * o.s, '255,236,204', a, { hard: .35 });
  }
}
function lmShade(x, y, rx, ry, a) {   // take light away: a soft dark patch on the light map
  if (a <= 0) return;
  const g = LM.g; g.save(); g.globalCompositeOperation = 'source-over'; g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.7, `rgba(0,0,0,${a * .85})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
}

// ------------------------------------------------------------------ particles: dust that is thrown off, falls, and is lit where it falls (pure functions of time)
function puff(x, y, t0, lt, o = {}) {
  const k = lt - t0; if (k < 0 || k > (o.life ?? 1.8)) return;
  const n = o.n ?? 26, sp = o.speed ?? 260, sc = o.size ?? 1, up = o.up ?? 0;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = (sr(i, 31) * 2 - 1) * (o.arc ?? PI) - PI / 2 + (o.dir ?? 0), v = sp * (.25 + sr(i, 32)) * Math.exp(-k * 2.2), d = 1 - Math.exp(-k * 2.2);
    const px = x + Math.cos(a) * sp * (.25 + sr(i, 32)) * d / 2.2 * .9 + Math.sin(k * 2 + i) * 8 * k, py = y + Math.sin(a) * sp * (.25 + sr(i, 32)) * d / 2.2 * .9 - up * k + 90 * k * k * (.4 + sr(i, 33));
    const r = (14 + 26 * sr(i, 34)) * sc * (.6 + .8 * k), al = (1 - k / (o.life ?? 1.8)) * (o.alpha ?? .55) * (.4 + .6 * sr(i, 35));
    ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(${o.color ?? '206,202,194'},${al})`], [1, `rgba(${o.color ?? '206,202,194'},0)`]]); ctx.fillRect(px - r, py - r, r * 2, r * 2); void v;
  }
  ctx.restore();
}
function flakes(x, y, t0, lt, o = {}) {   // small grains that drop from a point: lashes, a cap, a shoulder
  const k = lt - t0; if (k < 0 || k > (o.life ?? 2.2)) return;
  ctx.save(); ctx.fillStyle = `rgba(214,210,202,${o.alpha ?? .8})`;
  for (let i = 0; i < (o.n ?? 16); i++) { const px = x + (sr(i, 41) * 2 - 1) * (o.w ?? 40) + Math.sin(k * 3 + i) * 6, py = y + (k * (60 + 90 * sr(i, 42))) * (o.fall ?? 1), a = (1 - k / (o.life ?? 2.2)) * (.4 + .6 * sr(i, 43)); if (a <= 0) continue; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(px, py, 1.4 + 2.2 * sr(i, 44), 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the camera lenses
const lensN = (o = {}) => V2.setCam(Object.assign({}, CAMP, o));
const DOORX = -180, DWR = 266, DHR = 363;
const FOYER_K = .85;   /* the door is drawn at this fraction of the foyer's world scale, so the foyer around it keeps its size */
const kd2r = kd => kd * 370 / DWR;                      // the interior's px per world unit at the door plane, given the door leaf's scale
const czOfKd = kd => -1400 / kd2r(kd);

// ------------------------------------------------------------------ the light state of the characters (lit as if the room were bright; the light map takes the rest away)
function charLight(lt, ST, mode = 'N') {
  if (mode === 'S') { V2.setLight({ key: [0, -.2], keyColor: '#cfe0f0', keyA: .12, rim: '#d8ecff', rimA: .6, shadow: '#080e16', shadowA: .5, bounce: '#9fb4c8', bounceA: .1, amb: '#aabccc', ambA: .08, back: { color: '216,236,255', a: .55, w: 18 }, frontDark: .3 }); return; }
  V2.setLight({ key: [-.35, -.8], keyColor: '#fff0d6', keyA: .3, rim: '#9fc4ff', rimA: .38, shadow: '#0c141c', shadowA: .4, bounce: '#cfe0d4', bounceA: .08, amb: '#cfe0d8', ambA: .05 });
}
const speakerId = () => { const l = lineAt(T); if (!l) return null; return { straw: 'straw', lemon: 'lemon', mango: 'mango', clem: 'clem', brenda: 'brenda', moon: 'moon' }[l.who] || null; };

// ------------------------------------------------------------------ view N: the room from the door wall, looking north
function sceneN(lt, ST, sh) {
  const clt = sh.freezeLt ?? lt, cast = castAll(clt, sh.pos || {}, sh.ex || {}), spk = speakerId(), subj = sh.subj || null;
  charLight(lt, ST, 'N');
  const show = {};
  for (const id of Object.keys(cast)) { const o = cast[id]; show[id] = (id === subj || faceInside(o)) && !(sh.hide || []).includes(id); if (show[id]) trimPen(o); }
  const L = penLamps(lt, ST, cast, show);
  const zS = subj ? cast[subj].z : 0, bg = sh.dof || 0;
  const items = [{ z: 99999, fn: () => roomBack(lt, ST) }, { z: TBL.z, fn: () => roomFront(lt, ST) }];
  if (!sh.noSeat) items.push({ z: 1555, fn: roomSeat });
  if (!sh.noChair) items.push({ z: CHAIR2.z, fn: nearChair });
  for (const id of Object.keys(cast)) if (show[id] && !(subj && id !== subj && cast[id].z < zS - 25)) items.push({ z: cast[id].z, fn: () => (subj && id !== subj && cast[id].z > zS + 25 ? drawBg : drawChar)(cast[id]), id });
  const far = [], near = [];
  for (const it of items) (subj && bg > 0 && it.z > zS + 25 ? far : near).push(it);
  far.sort((a, b) => b.z - a.z); near.sort((a, b) => b.z - a.z);
  if (far.length) V2.dof(bg, () => far.forEach(it => it.fn()));
  near.forEach(it => it.fn());
  // dust that is thrown off
  { const b = cast.brenda; if (b && show.brenda) { const [fx, fy] = faceC(b); puff(fx, fy + 30 * b.s, 20.45, lt, { n: 34, speed: 340, size: 1.3 * b.s, alpha: .7, up: 20 }); flakes(fx + 22 * b.s, fy - 10 * b.s, 13.3, lt, { n: 14, w: 26 * b.s, life: 1.6, fall: b.s }); }
    const s2 = cast.straw; if (s2 && show.straw && lt >= SIT_T - .02) puff(s2.x, s2.y + 60 * s2.s, SIT_T, lt, { n: 22, speed: 240, size: 1.1 * s2.s, alpha: .55, up: 10, arc: PI * .9 }); }
  // the light map
  lmBegin(ST.amb);
  if (ST.hall > 0) lmSpot(-60, 1850, 800, 620, '96,114,132', .42 * ST.hall * (1 - ST.tube));
  { const k = kz(VEND.z0), vp = p2((VEND.x0 + VEND.x1) / 2, 160, VEND.z0 - 90); lmSpot(vp[0], vp[1], 270 * k, 210 * k, '86,176,172', .6 * ST.vend, { hard: .3 }); }
  { const m = moonState(lt), wp = p2((WIN.x0 + WIN.x1) / 2, 100, ZB - 400), k = kz(ZB - 400); lmSpot(wp[0], wp[1], 300 * k, 170 * k, '90,116,170', .4 * m.k * (1 - ST.tube)); }
  lampsToMap(L); faceKeys(lt, ST, cast, spk, subj);
  // before the find, Brenda is only a shape in the dark behind the table
  if (lt < 5.32 && cast.brenda && show.brenda) { const b = cast.brenda, [fx, fy] = faceC(b); lmShade(fx, fy + 20 * b.s, 190 * b.s, 150 * b.s, .94 * (1 - ph(lt, 5.1, 5.32))); }
  lmApply();
  return { cast, L, show };
}
function airN(lt, ST, L, cast, show) {   // light in the air, and the things that are their own light (drawn over the light map, never dimmed by it)
  lampsAir(L, lt, ST, cast, show);
  moonGlow(lt, ST); vendGlow(ST); tubeGlow(ST);
}
function drawN(lt, ST, sh) { const r = sceneN(lt, ST, sh); airN(lt, ST, r.L, r.cast, r.show); return r; }
function tubeGlow(ST) {   // the ceiling tube is a light source: it must not be dimmed by the light map
  if (ST.tube <= .02) return;
  const q = [p2(-120, CH - 3, 1230), p2(120, CH - 3, 1230), p2(120, CH - 3, 1530), p2(-120, CH - 3, 1530)], c = p2(0, CH - 3, 1380), k = kz(1380);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(226,250,238,${.85 * ST.tube})`; ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore();
  V2.glow(c[0], c[1], 520 * k, '214,246,230', .5 * ST.tube, 'screen', .9);
}

// ------------------------------------------------------------------ view S: the door wall from the table end
const SCELLS = [];
function drawS(lt, ST, sh) {
  const cast = castAll(sh.freezeLt ?? lt, sh.pos || {}, sh.ex || {});
  charLight(lt, ST, 'S');
  SCELLS.length = 0;
  roomSBack(lt, ST);
  // furniture and the cast, far to near
  const items = [];
  if (sh.table) { const t = sh.table; items.push({ z: t.z + 120, fn: () => chair13(t.x, t.z + 90, { dir: 1 }) }); items.push({ z: t.z, fn: () => { table3(t.x, t.z, { w: TBL.w, d: TBL.d, h: TBL.h, color: '#b89a68' }); dustTop(t.x - TBL.w, t.x + TBL.w, TBL.h + 16, t.z - TBL.d, t.z + TBL.d, .5); } }); }
  for (const id of Object.keys(cast)) { if ((sh.hide || []).includes(id)) continue; items.push({ z: cast[id].z, fn: () => drawChar(cast[id]) }); }
  items.sort((a, b) => b.z - a.z).forEach(it => it.fn());
  // the red alarm lights the room from the domes
  if (ST.alarm > .02) for (const [x, y] of [[-300, 400], [300, 400]]) { const q = p2(x, y, ZBS - 20); V2.addLight({ x: q[0], y: q[1], r: 1100, color: '255,40,56', a: .5 * ST.alarm }); }
  lmBegin(ST.amb);
  { const q = p2(0, 120, ZBS - 40), k = kz(ZBS - 40); lmSpot(q[0], q[1], 520 * k, 420 * k, '176,200,226', .7 * ST.hall * (1 - ST.alarm * .6), { hard: .3 }); }
  { const q = p2(0, 0, ZBS - 500), k = kz(ZBS - 500); lmSpot(q[0], q[1], 360 * k, 130 * k, '150,176,204', .6 * ST.hall * (1 - ST.alarm * .6), { hard: .2 }); }
  if (ST.alarm > .02) { for (const c of SCELLS) if (c.lv > .02) lmSpot(c.cx, c.cy, 170 * kz(ZBS), 150 * kz(ZBS), '255,60,74', .5 * c.lv, { hard: .1 }); }
  if (sh.id === 'out') { const q = p2(-40, 0, 1000), k = kz(1000); lmSpot(q[0], q[1], 500 * k, 300 * k, '120,146,176', .35, {}); }
  lmApply();
  emissiveS(lt, ST); tubeGlowS(ST);
  for (const c of SCELLS) if (c.lv > .02) V2.glow(c.cx, c.cy, c.r * 3.4, '255,59,78', .7 * c.lv, 'screen', .8);
  return { cast };
}
function tubeGlowS(ST) {
  if (ST.tube <= .02) return;
  const q = [p2(-120, CH - 3, 760), p2(120, CH - 3, 760), p2(120, CH - 3, 1060), p2(-120, CH - 3, 1060)], c = p2(0, CH - 3, 910), k = kz(910);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(226,250,238,${.85 * ST.tube})`; ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore();
  V2.glow(c[0], c[1], 520 * k, '214,246,230', .5 * ST.tube, 'screen', .9);
}


// ------------------------------------------------------------------ view D: through the door, from the hall (the opening, and the end)
const ALL_OPEN = { reader: 1, tape: 1, wet: 1, bolt1: 1, bolt2: 1, padlock: 1, chain: 1 };
// the four penlights arrive from behind the camera, one after another, sweep up the far wall and settle: banner, calendar, clock, vending machine
function dPens(lt) {
  const spec = [[TG.banner, .95, 250], [TG.cal, 1.32, 430], [TG.clock, 1.69, 640], [TG.vend, 2.06, 830]], out = [];
  spec.forEach(([tg, t1, sx], i) => {
    const t0 = t1 - .7, a = ph(lt, t0 - .12, t0 + .08) * (1 - ph(lt, 2.7, 2.84));
    if (a <= .01) return;
    const u = easeOut(seg(lt, t0, t1)), S0 = [DOORX + (i - 1.5) * 70, 0, 260 + i * 70], arc = Math.sin(u * PI) * 240;
    const wob = lt > t1 ? 1 : 0;
    const w = [lerp(S0[0], tg[0], u) + wob * 14 * Math.sin(lt * 1.8 + i * 2), lerp(S0[1], tg[1], u) + arc + wob * 10 * Math.cos(lt * 2.1 + i), lerp(S0[2], tg[2], u)];
    const T = p2(w[0], w[1], w[2]), kk = kz(w[2]), name = ['banner', 'cal', 'clock', 'vend'][i];
    out.push({ who: 'dp' + i, from: [sx, H + 60], to: T, r: PR[name] * kk * (1 + .6 * (1 - u)), a: a * .95, flat: u < .35, s: 2.2 });
  });
  return out;
}
function drawD(lt, ST, sh, cfg) {
  const { czR, cxR, ajar } = cfg, outside = czR < -70, kR = outside ? 1400 / -czR : 0, kd = kR * DWR / 370;
  const x0 = outside ? 540 + (DOORX - cxR) * kR : 0, y0 = outside ? 860 + 330 * kR : 0;
  let poly_ = null;
  if (outside) {
    // the hall side: the foyer and the door drawn at the scale that puts its opening exactly where the room's door is
    const kk = kd / FOYER_K;
    V2.setCam({ f: kk * S13.FOY.zb, cx: -(x0 - 540) / kk, cy: 330, hy: y0 - 330 * kk, cz: 0 });   /* the foyer is seen from where it was built (cz 0), with a longer lens, so its lamps stay in front of the camera */
    S13.light('foyer');
    S13.foyer({ t: lt, lampsOn: 1 });
    S13.breakDoor(x0, y0, kd, { t: lt, ajar, locks: ALL_OPEN, dust: .6 * (1 - ajar * .5), rd: { state: 'ok', k: 1 }, hero: ajar < .04 && lt < 3 ? undefined : false, plaque: true, heroPlaque: false });
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgb(${96 + 40 * ST.tubeShow | 0},${112 + 40 * ST.tubeShow | 0},${130 + 36 * ST.tubeShow | 0})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    const cs = Math.cos(ajar * 1.4), xr = -185 + 370 * cs, tp = (1 - cs) * 22;
    poly_ = [[x0 + xr * kd, y0 - tp * .5 * kd], [x0 + 185 * kd, y0], [x0 + 185 * kd, y0 - 504 * kd], [x0 + xr * kd, y0 - (504 - tp) * kd]];
  }
  V2.setCam({ f: 1400, cx: cxR, cy: 330, hy: 860, cz: czR });
  const shI = Object.assign({}, sh, { dof: 0 });
  ctx.save();
  if (outside) { ctx.beginPath(); poly_.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); }
  const r = sceneN(lt, Object.assign({}, ST, { hall: 0 }), shI);
  if (sh.curtain) {   // the cobweb curtain across the doorway, torn by the door
    const a = p2(DOORX - DWR / 2, DHR, 0), b = p2(DOORX + DWR / 2, 0, 0);
    ctx.save(); A13.cobweb('curtain', [a[0], a[1], b[0], b[1]], { tear: ph(lt, .38, 1.8), from: 1, t: lt, alpha: .55, seed: 3, lw: Math.max(1.2, 1.7 * kR / 2), nx: 11, ny: 14 }); ctx.restore();
  }
  ctx.restore();
  airN(lt, ST, r.L, r.cast, r.show);
  return r;
}

// ------------------------------------------------------------------ the shots: each one is a camera, a subject, how soft the background is, and where the cast stands if it is not in the usual place
const sc = (X, Y, Z) => p2(X, Y, Z);
const S_OUT = { lemon: [-330, 1180], straw: [-170, 1180], mango: [170, 1180], clem: [330, 1180] };
const S_FRZ = { lemon: [-330, 1170], mango: [110, 1170], clem: [330, 1170], brenda: [0, 1522], seat: [-110, 1262] };
const BR_S = keyRoute([[20.95, 0, 1340], [21.95, 0, 1500, 'io']]);
const hideGone = ['brenda'], hideAll = ['brenda', 'lemon', 'mango', 'clem'];
const SHOTS = [
  { id: 'door', a: 0, b: 2.85, view: 'D', curtain: true, hide: ['lemon', 'straw', 'mango', 'clem', 'brenda'], d: lt => ({ czR: lerp(-960, -700, easeOut(seg(lt, 0, 2.85))), cxR: DOORX, ajar: .95 * easeIO(seg(lt, .34, 2.3)) }) },
  { id: 'cuS1', a: 2.85, b: 3.72, subj: 'straw', dof: 9, cam: (lt, u, c) => faceZoom(c.straw, lerp(2.25, 2.42, u), 95) },
  { id: 'cuM1', a: 3.72, b: 4.45, subj: 'mango', dof: 9, cam: (lt, u, c) => faceZoom(c.mango, lerp(2.35, 2.5, u), 95) },
  { id: 'tbl', a: 4.45, b: 6.38, cam: (lt, u) => zoomTo(lerp(515, 495, u), lerp(1015, 990, u), lerp(1.9, 2.45, easeIO(u)) + .12 * damp(lt, 5.18, 16, .15)) },
  { id: 'cuL1', a: 6.38, b: 7.32, subj: 'lemon', dof: 9, cam: (lt, u, c) => faceZoom(c.lemon, lerp(2.3, 2.42, u), 90) },
  { id: 'cuC1', a: 7.32, b: 8.18, subj: 'clem', dof: 9, cam: (lt, u, c) => faceZoom(c.clem, lerp(2.45, 2.55, u), 90) },
  { id: 'l2a', a: 8.18, b: 9.15, subj: 'lemon', dof: 8, cam: (lt, u, c) => faceZoom(c.lemon, lerp(1.85, 1.95, u), 70) },
  { id: 'ins', a: 9.15, b: 10.15, cam: (lt, u) => { const A = sc(CLOCK.x, CLOCK.y, ZB - 4), B = sc(10, 380, ZB - 5), k = easeIO(seg(lt, 9.5, 9.85)); zoomTo(lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(3.3, 3.5, u)); } },
  { id: 'l2b', a: 10.15, b: 10.58, subj: 'lemon', dof: 8, cam: (lt, u, c) => faceZoom(c.lemon, lerp(1.95, 2.02, u), 70) },
  { id: 'cuM2', a: 10.58, b: 11.8, subj: 'mango', dof: 9, cam: (lt, u, c) => faceZoom(c.mango, lerp(2.4, 2.52, u), 90) },
  { id: 'cuL3', a: 11.8, b: 12.3, subj: 'lemon', dof: 9, cam: (lt, u, c) => faceZoom(c.lemon, lerp(2.5, 2.66, u), 90) },
  { id: 'chair', a: 12.3, b: 13.22, cam: (lt, u) => zoomTo(640, 1040, lerp(2.2, 2.32, u)) },
  { id: 'cuB1', a: 13.22, b: 15.36, subj: 'brenda', dof: 9, cam: (lt, u, c) => faceZoom(c.brenda, lerp(2.15, 2.7, easeIO(u)), 75) },
  { id: 'gasp', a: 15.36, b: 16.2, cam: (lt, u) => zoomTo(540, 960, lerp(1, 1.04, u)) },
  { id: 'two', a: 16.2, b: 19.98, cam: (lt, u) => zoomTo(lerp(385, 395, u), lerp(985, 975, u), lerp(1.55, 1.8, easeIO(u))) },
  { id: 'rise', a: 19.98, b: 20.95, cam: (lt, u) => zoomTo(lerp(485, 440, u), 940, 1.9) },
  { id: 'out', a: 20.95, b: 22.0, view: 'S', pos: Object.assign({}, S_OUT, { brendaRoute: BR_S }), cam: () => zoomTo(540, 960, 1) },
  { id: 'sit', a: 22.0, b: 22.95, hide: hideGone, cam: (lt, u) => zoomTo(520, 965, lerp(1, 1.08, u)) },
  { id: 'unwrap', a: 22.95, b: 23.85, subj: 'straw', dof: 8, hide: hideGone, cam: (lt, u, c) => faceZoom(c.straw, lerp(1.7, 1.95, u), 70) },
  { id: 'cuS3', a: 23.85, b: 24.62, subj: 'straw', dof: 9, hide: hideGone, cam: (lt, u, c) => faceZoom(c.straw, lerp(2.4, 2.55, u), 85) },
  { id: 'moon1', a: 24.62, b: 26.0, hide: hideAll, cam: (lt, u) => { const c = sc((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, ZB); zoomTo(c[0], c[1] - 10, lerp(2.7, 3.1, u)); } },
  { id: 'dreadL', a: 26.0, b: 26.35, subj: 'lemon', dof: 9, hide: hideGone, cam: (lt, u, c) => faceZoom(c.lemon, lerp(2.5, 2.8, u), 90) },
  { id: 'dreadM', a: 26.35, b: 26.7, subj: 'mango', dof: 9, hide: hideGone, cam: (lt, u, c) => faceZoom(c.mango, lerp(2.5, 2.8, u), 90) },
  { id: 'dreadC', a: 26.7, b: 27.0, subj: 'clem', dof: 9, hide: hideGone, cam: (lt, u, c) => faceZoom(c.clem, lerp(2.6, 2.9, u), 90) },
  { id: 'dreadS', a: 27.0, b: 27.18, subj: 'straw', dof: 9, hide: hideGone, cam: (lt, u, c) => faceZoom(c.straw, lerp(2.4, 2.5, u), 85) },
  { id: 'freeze', a: 27.18, b: 28.8, view: 'S', freezeLt: 27.17, pos: S_FRZ, table: { x: -110, z: 1160 }, cam: (lt, u) => zoomTo(540, lerp(965, 940, u), lerp(1, 1.07, u)) },
  { id: 'cuL4', a: 28.8, b: 29.55, subj: 'lemon', dof: 9, hide: hideGone, cam: (lt, u, c) => faceZoom(c.lemon, lerp(2.4, 2.5, u), 90) },
  { id: 'moon2', a: 29.55, b: 30.62, hide: hideAll, cam: (lt, u) => { const c = sc((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, ZB); zoomTo(c[0], c[1] - 10, lerp(3.0, 3.15, u)); } },
  { id: 'l5', a: 30.62, b: 31.98, hide: hideGone, cam: (lt, u) => zoomTo(lerp(205, 225, u), 975, 1.3) },
  { id: 'cuC2', a: 31.98, b: 32.3, subj: 'clem', dof: 9, hide: hideGone, cam: (lt, u, c) => faceZoom(c.clem, lerp(2.5, 2.7, u), 90) },
  { id: 'run', a: 32.3, b: 32.59, view: 'S', special: 'run', pos: S_FRZ, table: { x: -110, z: 1160 }, cam: () => zoomTo(540, 940, 1.07) },
  { id: 'cuS4', a: 32.59, b: 33.34, subj: 'straw', dof: 9, hide: hideAll, cam: (lt, u, c) => faceZoom(c.straw, lerp(2.3, 2.45, u), 85) },
  { id: 'end', a: 33.34, b: 36, view: 'D', hide: hideAll, d: lt => { const k = easeIn(seg(lt, 33.34, 33.74)), k2 = easeOut(seg(lt, 33.74, 34.6)); return { czR: lt < 33.74 ? lerp(200, -80, k) : lerp(-80, -780, k2), cxR: lerp(-60, DOORX, ph(lt, 33.34, 33.7)), ajar: lt < 33.7 ? .95 : .95 * (1 - easeIn(seg(lt, 33.7, 33.86))) }; } },
];
const shotAt = lt => { for (const s of SHOTS) if (lt < s.b) return s; return SHOTS[SHOTS.length - 1]; };


// ------------------------------------------------------------------ the crew bolts for the door: backs to us, running toward the bright doorway (the last half second before "Pending.")
function drawRun(lt, ST, sh) {
  charLight(lt, ST, 'S');
  SCELLS.length = 0;
  roomSBack(lt, ST);
  const rt = (x0, z0, x1, z1, t0, t1) => t => [lerp(x0, x1, easeIn(seg(t, t0, t1))), lerp(z0, z1, easeIn(seg(t, t0, t1)))];
  const back = { noFace: true, acc: [], hold: {}, grip: {}, transit: true };
  const list = [];
  list.push([A7.lemon, rt(-330, 1170, -40, 1540, 32.14, 32.75), 'lemon', { arms: { l: 'run', r: 'run' } }]);
  list.push([A7.mango, rt(110, 1170, 20, 1545, 32.08, 32.68), 'mango', { arms: { l: 'run', r: 'run' } }]);
  list.push([A10.clem, rt(330, 1170, 60, 1550, 32.0, 32.6), 'clem', { arms: { l: 'run', r: 'run' } }]);
  const items = [];
  const t = sh.table; items.push({ z: t.z + 120, fn: () => chair13(t.x, t.z + 90, { dir: 1 }) }); items.push({ z: t.z, fn: () => { table3(t.x, t.z, { w: TBL.w, d: TBL.d, h: TBL.h, color: '#b89a68' }); dustTop(t.x - TBL.w, t.x + TBL.w, TBL.h + 16, t.z - TBL.d, t.z + TBL.d, .5); } });
  const q = V2.at(S_FRZ.seat[0], S_FRZ.seat[1]);
  const so = actStraw(lt, { t: 32.4 }, [S_FRZ.seat[0], S_FRZ.seat[1]], S_FRZ.seat); items.push({ z: S_FRZ.seat[1], fn: () => drawChar(so) }); void q;
  for (const [ctor, fn, id, ex] of list) { const o = runner(ctor, fn, lt, Object.assign({ id, who: id }, back, ex), 360); items.push({ z: fn(lt)[1], fn: () => drawChar(o) }); }
  // Brenda: first out of the door, a spring in her step (she has not answered a light since 2019)
  { const route = t2 => [lerp(0, 0, 0), lerp(1522, 1720, easeIn(seg(t2, 32.06, 32.6)))], o = runner(A13.brenda, route, lt, { id: 'brenda', who: 'brenda', noFace: true, transit: true, acc: ['fp13_scrubs'], dust: 0, specsDrop: 0, arms: { l: 'run', r: 'run' }, expr: 'brenda_relief', capOff: false }, 360);
    o.lift = (o.lift || 0) + Math.abs(Math.sin((lt - 32.06) * 11)) * 26 * o.s; items.push({ z: route(lt)[1], fn: () => drawChar(o) }); }
  items.sort((a, b) => b.z - a.z).forEach(it => it.fn());
  lmBegin(ST.amb);
  { const qq = p2(0, 120, ZBS - 40), k = kz(ZBS - 40); lmSpot(qq[0], qq[1], 520 * k, 420 * k, '176,200,226', .7 * ST.hall * (1 - ST.alarm * .6), { hard: .3 }); }
  if (ST.alarm > .02) for (const c of SCELLS) if (c.lv > .02) lmSpot(c.cx, c.cy, 170 * kz(ZBS), 150 * kz(ZBS), '255,60,74', .5 * c.lv, { hard: .1 });
  lmApply();
  emissiveS(lt, ST); tubeGlowS(ST);
  for (const c of SCELLS) if (c.lv > .02) V2.glow(c.cx, c.cy, c.r * 3.4, '255,59,78', .7 * c.lv, 'screen', .8);
}

// ------------------------------------------------------------------ HUD and sound words (screen space, after the grade)
function timerChip(lt) {
  const a = easeBack(seg(lt, 23.05, 23.35)); if (a <= 0) return;
  const rem = Math.max(0, 1800 - (lt - 23.05)), str = Math.floor(rem / 60) + ':' + String(Math.floor(rem % 60)).padStart(2, '0');
  const x = 646, y = 118, w = 340, h = 64, cx = x + w / 2, cy = y + h / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'hud-break' });
  ctx.save(); ctx.translate(cx, cy); ctx.scale(a, a); ctx.translate(-cx, -cy); ctx.globalAlpha *= clamp(a * 2);
  UI.panel([x, y, w, h], { fill: 'rgba(8,10,20,.78)', stroke: '#4de3ff', lw: 3, r: 32, id: 'hudbreak', kind: 'pill', pad: 10, shadow: 14 });
  // a cup of coffee, in cyan, with steam
  ctx.save(); ctx.translate(x + 36, cy + 4); ctx.strokeStyle = '#4de3ff'; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(13, -8); ctx.lineTo(10, 12); ctx.quadraticCurveTo(0, 16, -10, 12); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(15, 0, 6, -PI / 2, PI / 2); ctx.stroke();
  for (const dx of [-5, 5]) { ctx.beginPath(); ctx.moveTo(dx, -13); ctx.quadraticCurveTo(dx + 4 * Math.sin(lt * 3 + dx), -19, dx, -25); ctx.stroke(); }
  ctx.restore();
  UI.label('BREAK', x + 66, cy, { size: 30, weight: 900, fill: '#bff3ff', spacing: 2, align: 'left', cid: 'hudbreak' });
  UI.label(str, x + w - 26, cy, { size: 46, font: 'Bangers', weight: 400, fill: '#4de3ff', spacing: 2, align: 'right', cid: 'hudbreak' });
  ctx.restore();
}
function sfx(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .12), hold = o.hold ?? .55, f = 1 - seg(lt, t0 + hold, t0 + hold + .2);
  if (k <= 0 || f <= 0) return;
  const s = lerp(1.3, 1, easeOut(k));
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(s, s);
  UI.label(str, 0, 0, { size: o.size ?? 110, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', stroke: '#150f22', lw: o.lw ?? 12, spacing: 3, shadow: 12, rot: o.rot ?? -.08, tilt: .3, hero: false });
  ctx.restore();
}

// ------------------------------------------------------------------ the scene
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.vault = {
  shot: lt => shotAt(lt).id,
  cam(lt) {
    const sh = shotAt(lt), u = seg(lt, sh.a, sh.b);
    if (sh.view === 'D') { const c = sh.d(lt); V2.setCam({ f: 1400, cx: c.cxR, cy: 330, hy: 860, cz: c.czR }); zoomTo(540, 960, 1); return; }
    lensN(); zoomTo(540, 960, 1);
    const c = sh.cam && sh.cam.length >= 3 ? castAll(sh.freezeLt ?? lt, sh.pos || {}, sh.ex || {}) : null;
    sh.cam && sh.cam(lt, u, c);
    if (lt >= 5.18 && lt < 6.4) CAM.shake = 3.5 * Math.exp(-(lt - 5.18) * 2.2);
    if (lt >= 27.18 && lt < 28.2) CAM.shake = 9 * Math.exp(-(lt - 27.18) * 3.2);
  },
  draw(lt) {
    const sh = shotAt(lt), ST = state(lt);
    if (sh.view === 'D') drawD(lt, ST, sh, sh.d(lt));
    else if (sh.view === 'S') (sh.special === 'run' ? drawRun : drawS)(lt, ST, sh);
    else drawN(lt, ST, sh);
  },
  fx(lt) {
    const ST = state(lt), tube = ST.tube, al = ST.alarm, dark = 1 - tube;
    return {
      bloom: .55, vignette: .6, grain: .06, contrast: .16, sat: 0,
      tint: [['#7fa6b8', .16 * dark * (1 - al), 'soft-light'], ['#06121a', .1 * dark * (1 - al), 'multiply'], ['#b8ecc4', .2 * tube * (1 - al), 'soft-light'], ['#ff2a3a', .34 * al, 'soft-light']],
      fade: Math.max(1 - seg(lt, 0, .35), seg(lt, 34.5, 35.35)), fadeColor: '2,4,8',
      aberr: lt >= 27.18 && lt < 27.5 ? 7 * (1 - (lt - 27.18) / .32) : 0,
    };
  },
  blur(lt) {
    const sh = shotAt(lt);
    if (lt - sh.a < .05 || sh.b - lt < .04) return 1;
    if (lt >= 33.34 && lt < 33.9) return 4;
    if (lt >= 20.95 && lt < 22.0) return 2;
    if (lt >= 32.3 && lt < 32.59) return 3;
    if (lt >= .9 && lt < 2.3) return 2;
    return 1;
  },
  over(lt) {
    timerChip(lt);
    sfx(lt, .28, 'CREEEEAK', 600, 400, { size: 120, fill: '#e6e0cc', hold: 1.3, rot: -.06 });
    sfx(lt, 20.25, 'CRACK!', 770, 470, { size: 110 });
    sfx(lt, 22.3, 'FWUMP', 780, 700, { size: 110 });
    sfx(lt, 22.34, 'TINK', 400, 330, { size: 66, fill: '#cfeedd', hold: .25, rot: -.12 }); sfx(lt, 22.48, 'TINK', 700, 300, { size: 66, fill: '#cfeedd', hold: .25, rot: .1 }); sfx(lt, 22.6, 'TINK', 560, 380, { size: 66, fill: '#cfeedd', hold: .25, rot: -.05 });
    sfx(lt, 23.9, 'MUNCH', 820, 440, { size: 100, fill: '#ffe135', hold: .6 });
    sfx(lt, 27.23, 'SKREEEE', 540, 340, { size: 150, fill: '#ffffff', hold: .5, rot: -.04 });
    sfx(lt, 27.46, 'CLUNK', 540, 1000, { size: 110, fill: '#ffe135', hold: .4 });
    sfx(lt, 33.84, 'THUNK', 760, 560, { size: 100, fill: '#ffe135', hold: .5 });
    if (lt >= 27.18 && lt < 27.3) { ctx.save(); ctx.globalAlpha = .85 * (1 - (lt - 27.18) / .12); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (lt >= 5.18 && lt < 5.3) { ctx.save(); ctx.globalAlpha = .4 * (1 - (lt - 5.18) / .12); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
};
})();
