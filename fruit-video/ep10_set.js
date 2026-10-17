'use strict';
/* SHIFT HAPPENS, Episode 10 set: the Administrator's office (a perspective room on the Episode 6 kit). Exposed as window.S10.
 * (work in progress: stage 2, the wall)
 */
(() => {
const { p2, poly, quad3, grad, radial, rgba, mix } = V2;
const S6 = window.S6, A7 = window.A7;
const { box3, shell, onZ, kz, ceilingLamp, lit } = S6;
const ink = 'rgba(25,16,30,.62)';

// ------------------------------------------------------------------ layout: every number is a world coordinate (X right, Y up, Z forward), shared with the scenes through office.layout
const LAY = {
  zb: 1750, hw: 800, ch: 820,                                   // back wall depth, half width, ceiling height
  rail: 170,                                                    // top of the wainscot
  door: { x0: -770, x1: -510, y1: 470 },                        // the pocket door in the back wall, far left
  win: { y0: 560, y1: 760, panes: [[-660, -270], [-220, 170], [220, 610]] },   // a ribbon of three panes high on the wall: above every head, so faces never sit against the glare
  portrait: { x0: -470, y0: 190, w: 230, h: 320 },              // the framed portrait; the vault recess sits behind it
  chart: { x0: -205, y1: 515, w: 340, h: 310 },                 // the FY BUDGET board: in the gap between the two of them, so it is behind both of them in every two-shot
  poster: { x0: 690, y1: 500, w: 130, h: 190 },
  dips: { x0: 545, y1: 500 },                                   // three diplomas stacked at the right
  desk: { x0: -40, x1: 580, z0: 1200, z1: 1460, top: 232 },     // the executive desk: front face toward the visitor
  admin: { x: 300, z: 1560, seat: 205 },                        // where the Administrator sits (his body bottom rests at y = seat)
  visitor: { x: -120, z: 1020, seat: 58 },                      // the low guest chair
};

// ------------------------------------------------------------------ palettes: day (2:58 PM) and night (10:30 PM, 10:55 PM)
const PAL = {
  day: { wall: '#a9b8a4', wain: '#6b4630', floorA: '#2f4260', floorB: '#1f2b45', ceil: '#efe9db', fog: '#b9c4b4', frame: '#f0ead8', slat: ['#f6f1e2', '#cfc6ae'], trim: '#c9a040', wood: '#5a3a28', woodHi: '#7a5238' },
  night: { wall: '#3d4a6a', wain: '#2e211f', floorA: '#1b2340', floorB: '#10162c', ceil: '#2c3452', fog: '#141a34', frame: '#b8b4aa', slat: ['#8c92ac', '#5a6080'], trim: '#a88838', wood: '#3a2519', woodHi: '#4e3322' },
};

// ------------------------------------------------------------------ art that never changes is painted once into a small canvas (the world is redrawn every frame, and a frame must stay cheap)
const CACHE = {};
function art(key, w, h, sc, draw) {
  let c = CACHE[key];
  if (!c) {
    c = V2.mk(Math.ceil(w * sc), Math.ceil(h * sc));
    const g = c.getContext('2d'), prev = ctx;
    ctx = g; g.save(); g.scale(sc, sc); REG.suppress++;
    try { draw(w, h); } finally { REG.suppress--; ctx = prev; g.restore(); }
    CACHE[key] = c;
  }
  return c;
}
// lay a cached picture on the back wall: (x0, y1) is its top left corner in world units, w and h its size
function onWall(c, x0, y1, w, h, z, sx = 1) {
  const a = p2(x0, y1, z), b = p2(x0 + w, y1 - h, z), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.translate(cx, cy); ctx.scale(sx, sx); ctx.drawImage(c, -(b[0] - a[0]) / 2, -(b[1] - a[1]) / 2, b[0] - a[0], b[1] - a[1]); ctx.restore();
}
const goldEdge = (x, y, w, h, r, lw = 5) => { ctx.strokeStyle = V2.grad(x, y, x + w, y + h, [[0, '#fff0a8'], [.35, '#c99a2e'], [.7, '#8a6414'], [1, '#e8c458']]); ctx.lineWidth = lw; rr(x, y, w, h, r); ctx.stroke(); };

// ------------------------------------------------------------------ the art on the walls (units are world units, drawn at 2 px per unit)
// the portrait of the Administrator: a gilded frame, drapery, the sitter, a slice raised like a scepter
function drawPortrait(w, h) {
  // frame
  const fg = V2.grad(0, 0, w, h, [[0, '#f4d878'], [.3, '#c2922c'], [.62, '#8c6216'], [1, '#e2b84a']]);
  ctx.fillStyle = fg; rr(0, 0, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(40,24,6,.8)'; ctx.lineWidth = 3; rr(1.5, 1.5, w - 3, h - 3, 9); ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,170,.5)'; for (let i = 0; i < 18; i++) { ell(10 + i * (w - 20) / 17, 9, 3.2, 3.2); ctx.fill(); ell(10 + i * (w - 20) / 17, h - 9, 3.2, 3.2); ctx.fill(); }
  ctx.fillStyle = 'rgba(70,40,6,.5)'; rr(18, 18, w - 36, h - 36 - 34, 4); ctx.fill();
  // the canvas: a dark green drapery with a gold tassel and a sky window
  const cx0 = 22, cy0 = 22, cw = w - 44, ch = h - 44 - 34;
  ctx.save(); rr(cx0, cy0, cw, ch, 3); ctx.clip();
  ctx.fillStyle = V2.grad(0, cy0, 0, cy0 + ch, [[0, '#183a2c'], [1, '#0d2219']]); ctx.fillRect(cx0, cy0, cw, ch);
  ctx.fillStyle = V2.grad(cx0 + cw * .6, cy0, cx0 + cw, cy0, [[0, 'rgba(255,200,120,0)'], [1, 'rgba(255,200,120,.45)']]); ctx.fillRect(cx0, cy0, cw, ch);
  ctx.strokeStyle = 'rgba(10,30,22,.7)'; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx0 + i * cw / 5, cy0); ctx.quadraticCurveTo(cx0 + i * cw / 5 + 10, cy0 + ch * .5, cx0 + i * cw / 5 - 6, cy0 + ch); ctx.stroke(); }
  // the sitter: shoulders (a navy suit with a red tie), a melon head, a chain of office
  const mx = cx0 + cw / 2, my = cy0 + ch * .46;
  ctx.fillStyle = V2.grad(0, my + 30, 0, cy0 + ch, [[0, '#24407a'], [1, '#14264c']]); ctx.beginPath(); ctx.moveTo(cx0 - 6, cy0 + ch + 4); ctx.quadraticCurveTo(cx0 + 4, my + 52, mx - 40, my + 46); ctx.lineTo(mx + 40, my + 46); ctx.quadraticCurveTo(cx0 + cw - 4, my + 52, cx0 + cw + 6, cy0 + ch + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.moveTo(mx - 20, my + 46); ctx.lineTo(mx + 20, my + 46); ctx.lineTo(mx, my + 100); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c4202c'; ctx.beginPath(); ctx.moveTo(mx - 6, my + 52); ctx.lineTo(mx + 6, my + 52); ctx.lineTo(mx + 10, my + 100); ctx.lineTo(mx, my + 110); ctx.lineTo(mx - 10, my + 100); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8c458'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx - 52, my + 44); ctx.quadraticCurveTo(mx, my + 120, mx + 52, my + 44); ctx.stroke();
  ctx.fillStyle = '#e8c458'; ell(mx, my + 104, 9, 9); ctx.fill();
  ctx.fillStyle = V2.radial(mx - 14, my - 18, 4, 56, [[0, '#fff0c8'], [.6, '#e2b878'], [1, '#a8742e']]); ell(mx, my, 50, 54); ctx.fill();
  ctx.strokeStyle = 'rgba(250,236,200,.55)'; ctx.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(mx + i * 14 - 8, my - 50); ctx.quadraticCurveTo(mx + i * 17, my, mx + i * 14 + 8, my + 50); ctx.stroke(); }
  ctx.fillStyle = '#4a3010'; ell(mx - 17, my - 6, 4.6, 6); ctx.fill(); ell(mx + 17, my - 6, 4.6, 6); ctx.fill();
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx - 25, my - 19); ctx.lineTo(mx - 10, my - 17); ctx.moveTo(mx + 25, my - 19); ctx.lineTo(mx + 10, my - 17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx - 15, my + 20); ctx.quadraticCurveTo(mx, my + 30, mx + 15, my + 19); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,.25)'; ell(mx - 30, my + 12, 9, 6); ctx.fill(); ell(mx + 30, my + 12, 9, 6); ctx.fill();
  // the slice, held up like a scepter
  ctx.save(); ctx.translate(cx0 + cw - 40, my + 66); ctx.rotate(-.18);
  ctx.fillStyle = '#c28a3e'; ctx.beginPath(); ctx.moveTo(-18, -80); ctx.quadraticCurveTo(0, -92, 18, -80); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2c440'; ctx.beginPath(); ctx.moveTo(-14, -74); ctx.quadraticCurveTo(0, -84, 14, -74); ctx.lineTo(0, -8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b3261e'; for (const [dx, dy] of [[-5, -62], [6, -48], [-2, -32]]) { ell(dx, dy, 5.4, 5.4); ctx.fill(); }
  ctx.restore();
  // craquelure and a varnish sheen
  ctx.strokeStyle = 'rgba(255,240,200,.1)'; ctx.lineWidth = 1; for (let i = 0; i < 22; i++) { const x = cx0 + hash(i + 3) * cw, y = cy0 + hash(i + 40) * ch; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(i) - .5) * 40, y + (hash(i + 8) - .5) * 40); ctx.lineTo(x + (hash(i + 2) - .5) * 60, y + (hash(i + 9) - .5) * 40); ctx.stroke(); }
  ctx.fillStyle = V2.grad(cx0, cy0, cx0 + cw, cy0 + ch, [[0, 'rgba(255,255,255,.2)'], [.35, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(cx0, cy0, cw, ch);
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,18,4,.85)'; ctx.lineWidth = 3; rr(cx0, cy0, cw, ch, 3); ctx.stroke();
  // the brass plate
  const py = h - 52;
  ctx.fillStyle = V2.grad(0, py, 0, py + 30, [[0, '#f2d67a'], [1, '#b88a22']]); rr(w / 2 - 82, py, 164, 30, 4); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,6,.8)'; ctx.lineWidth = 2; ctx.stroke();
  text('THE ADMINISTRATOR', w / 2, py + 11, { size: 13, fill: '#3a2606', weight: 900, spacing: 1.2 });
  text('(in his own opinion)', w / 2, py + 23, { size: 9.5, fill: '#5a3e0a', weight: 800, italic: true });
}
// the FY BUDGET board: a real pie, 97 percent pizza, with STAFF, SUPPLIES and DIGNITY pulled out as slivers
const PIE = { cx: 120, cy: 190, R: 96, slivers: [['STAFF', 1.8, '#2f6fd8'], ['SUPPLIES', .9, '#27a064'], ['DIGNITY', .3, '#a24bd6']] };
function drawPizza(R, a0, a1) {   // a pizza, painted into the wedge from angle a0 to a1 (clockwise from 3 o'clock), centred on the origin
  ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath(); ctx.clip();
  ctx.fillStyle = V2.radial(-R * .2, -R * .25, R * .1, R * 1.1, [[0, '#f0bc6c'], [.7, '#d8964a'], [1, '#a8662a']]); ell(0, 0, R, R); ctx.fill();            // crust
  ctx.fillStyle = 'rgba(255,236,170,.45)'; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + .1, r = R - 8 + (i % 3) * 1.5; ell(Math.cos(a) * r, Math.sin(a) * r, 5.5, 3.2, a + PI / 2); ctx.fill(); }   // crust bubbles
  ctx.fillStyle = '#c4301c'; ell(0, 0, R - 17, R - 17); ctx.fill();                                                                                         // sauce
  ctx.fillStyle = V2.radial(-R * .2, -R * .2, 2, R, [[0, '#ffe27a'], [1, '#f0b43c']]); ell(0, 0, R - 21, R - 21); ctx.fill();                                // cheese
  ctx.fillStyle = 'rgba(255,248,200,.55)'; for (let i = 0; i < 22; i++) { ell((hash(i + 3) - .5) * R * 1.5, (hash(i + 30) - .5) * R * 1.5, 6 + hash(i + 7) * 8, 4 + hash(i + 11) * 5, hash(i) * 3); ctx.fill(); }
  ctx.fillStyle = 'rgba(190,110,30,.4)'; for (let i = 0; i < 16; i++) { ell((hash(i + 60) - .5) * R * 1.5, (hash(i + 90) - .5) * R * 1.5, 3 + hash(i + 5) * 4, 2.5 + hash(i + 9) * 3, hash(i + 2) * 3); ctx.fill(); }
  const pep = [[-.52, -.4], [.12, -.62], [.58, -.28], [-.2, -.04], [.36, .14], [-.62, .22], [.08, .46], [.62, .5], [-.36, .62], [.78, -.02], [-.84, -.1], [-.02, -.3]];
  for (const [px, py] of pep) {
    const x = px * (R - 24), y = py * (R - 24);
    ctx.fillStyle = '#9c1c16'; ell(x, y + 1.6, 13.5, 13); ctx.fill(); ctx.fillStyle = V2.radial(x - 3, y - 4, 1, 14, [[0, '#e0503c'], [1, '#b02a1c']]); ell(x, y, 13, 12.6); ctx.fill();
    ctx.fillStyle = 'rgba(120,20,10,.55)'; for (let q = 0; q < 4; q++) { ell(x + Math.cos(q * 1.7 + px) * 6, y + Math.sin(q * 1.7 + px) * 6, 1.8, 1.8); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(x - 4, y - 5, 4, 2.2, -.5); ctx.fill();
  }
  ctx.fillStyle = '#3f9a3a'; for (const [lx, ly, ra] of [[-.3, .32, .5], [.42, -.46, -.8], [.5, .66, 2.2]]) { ctx.save(); ctx.translate(lx * R, ly * R); ctx.rotate(ra); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(7, -9, 0, -17); ctx.quadraticCurveTo(-7, -9, 0, 0); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(80,44,14,.9)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath(); ctx.stroke();
}
function drawChart(w, h) {
  ctx.fillStyle = '#23262f'; rr(0, 0, w, h, 16); ctx.fill();
  ctx.fillStyle = V2.grad(0, 0, 0, h, [[0, '#ffffff'], [1, '#ebe8dd']]); rr(9, 9, w - 18, h - 18, 9); ctx.fill();
  text('FY BUDGET', w / 2, 44, { size: 50, font: 'Bangers', weight: 400, fill: '#1c3566', spacing: 3 });
  text('ALL DEPARTMENTS, ALL YEAR', w / 2, 76, { size: 14, fill: '#8a90a4', spacing: 2.2 });
  ctx.strokeStyle = '#1c3566'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, 92); ctx.lineTo(w - 30, 92); ctx.stroke();
  const { cx, cy, R, slivers } = PIE;
  const tot = slivers.reduce((s, q) => s + q[1], 0), gap = tot / 100 * TAU, mid = 0;   // the slivers sit around 3 o'clock
  let a = mid - gap / 2;
  ctx.save(); ctx.translate(cx, cy);
  // the slivers, each pulled out a little along its own bisector
  const spots = [];
  for (const [name, pct, col] of slivers) {
    const da = pct / 100 * TAU, bis = a + da / 2, ox = Math.cos(bis) * 9, oy = Math.sin(bis) * 9;
    ctx.fillStyle = col; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, R + 2, a, a + da); ctx.closePath(); ctx.fill(); ctx.stroke();
    spots.push([name, pct, col, Math.cos(bis) * (R + 12) + ox, Math.sin(bis) * (R + 12) + oy]);
    a += da;
  }
  drawPizza(R, a, mid - gap / 2 + TAU);
  ctx.restore();
  // the legend, with leader lines
  const lx = 250;
  spots.forEach(([name, pct, col, x, y], i) => {
    const ly = cy - 44 + i * 44;
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx + x, cy + y); ctx.lineTo(cx + x + 14 + i * 3, cy + y); ctx.lineTo(lx - 10, ly); ctx.lineTo(lx - 4, ly); ctx.stroke();
    ctx.fillStyle = col; rr(lx, ly - 16, 12, 32, 3); ctx.fill();
    text(name, lx + 20, ly - 6, { size: 15, fill: '#2a2f45', weight: 900, align: 'left', spacing: .6 });
    text(pct.toFixed(1) + '%', lx + 20, ly + 11, { size: 15, fill: col, weight: 900, align: 'left' });
  });
  // the one label that matters
  ctx.save(); ctx.translate(cx - 18, cy + 8); ctx.rotate(-.06);
  ctx.fillStyle = '#fff8e6'; ctx.strokeStyle = '#7a1c14'; ctx.lineWidth = 3.4; rr(-64, -28, 128, 56, 14); ctx.fill(); ctx.stroke();
  text('PIZZA', 0, -8, { size: 28, font: 'Bangers', weight: 400, fill: '#b3261e', spacing: 2 });
  text('97%', 0, 16, { size: 24, font: 'Bangers', weight: 400, fill: '#b3261e', spacing: 2 });
  ctx.restore();
  text('SOURCE: THE ADMINISTRATOR', w / 2, h - 22, { size: 11, fill: '#9aa0b2', weight: 800, spacing: 1.6 });
}
// the poster
function drawPoster(w, h) {
  ctx.fillStyle = '#1b1b24'; rr(0, 0, w, h, 5); ctx.fill();
  ctx.fillStyle = '#f6f2e8'; rr(6, 6, w - 12, h - 12, 3); ctx.fill();
  const px = 14, py = 14, pw = w - 28, ph = h * .62;
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
  ctx.fillStyle = V2.grad(0, py, 0, py + ph, [[0, '#4a3a8a'], [.45, '#e8707a'], [.75, '#ffc07a'], [1, '#ffe8b0']]); ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = '#fff6c8'; ell(px + pw * .62, py + ph * .62, pw * .14, pw * .14); ctx.fill();
  ctx.fillStyle = V2.grad(0, py + ph * .66, 0, py + ph, [[0, '#2a3a6a'], [1, '#101a3a']]); ctx.fillRect(px, py + ph * .66, pw, ph * .34);
  ctx.fillStyle = 'rgba(255,230,160,.4)'; for (let i = 0; i < 5; i++) ctx.fillRect(px + pw * (.42 + i * .03), py + ph * (.7 + i * .055), pw * (.2 - i * .02), 2);
  ctx.fillStyle = '#0c1226'; ctx.beginPath(); ctx.moveTo(px + pw * .08, py + ph * .76); ctx.lineTo(px + pw * .92, py + ph * .74); ctx.lineTo(px + pw * .86, py + ph * .79); ctx.lineTo(px + pw * .14, py + ph * .8); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 4; i++) { const x = px + pw * (.24 + i * .17); ctx.beginPath(); ctx.arc(x, py + ph * .7, pw * .05, 0, TAU); ctx.fill(); ctx.fillRect(x - pw * .035, py + ph * .72, pw * .07, ph * .06); ctx.strokeStyle = '#0c1226'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, py + ph * .75); ctx.lineTo(x - pw * .12, py + ph * .86); ctx.stroke(); }
  ctx.restore();
  text('SYNERGY', w / 2, py + ph + 24, { size: 26, fill: '#1b1b24', weight: 900, spacing: 3.4 });
  text('TOGETHER, EVERYONE', w / 2, py + ph + 44, { size: 10.5, fill: '#3a3a4a', weight: 900, spacing: 1.2 });
  text('ACHIEVES MONEY*', w / 2, py + ph + 57, { size: 10.5, fill: '#3a3a4a', weight: 900, spacing: 1.2 });
  text('*some of everyone', w / 2, h - 16, { size: 6.4, fill: '#8a8a9a', weight: 800, italic: true });
}
// diplomas: cream paper, a gold border, a red seal
const DIP = [
  { top: 'CERTIFICATE OF EXCELLENCE', big: ['CERTIFIED IN', 'SAYING NO'], sub: 'with distinction (always)' },
  { top: 'MASTER OF BUSINESS', big: ['M.B.A.', 'BUDGET AVOIDANCE'], sub: 'summa cum laude' },
  { top: 'PIZZA PARTY PLANNING', big: ['HONORS', 'GRADUATE'], sub: 'class of last friday' },
];
function drawDiploma(w, h, i) {
  const d = DIP[i];
  ctx.fillStyle = i === 0 ? '#2a2018' : '#1f1a14'; rr(0, 0, w, h, 4); ctx.fill();
  ctx.fillStyle = V2.grad(0, 0, w, h, [[0, '#fffaec'], [1, '#efe4c8']]); rr(5, 5, w - 10, h - 10, 2); ctx.fill();
  goldEdge(9, 9, w - 18, h - 18, 2, 2.4); goldEdge(13, 13, w - 26, h - 26, 2, 1);
  text(d.top, w / 2, 24, { size: i === 0 ? 8.6 : 7.6, fill: '#6a5a3a', weight: 900, spacing: 1, maxW: w - 30 });
  text(d.big[0], w / 2, h * .42, { size: i === 0 ? 18 : 15, font: 'Bangers', weight: 400, fill: '#7a1c1c', spacing: 1.4, maxW: w - 30 });
  text(d.big[1], w / 2, h * .42 + (i === 0 ? 21 : 18), { size: i === 0 ? 24 : 15, font: 'Bangers', weight: 400, fill: i === 0 ? '#b3261e' : '#1c3566', spacing: 1.4, maxW: w - 30 });
  text(d.sub, w / 2, h * .74, { size: 7.4, fill: '#7a6a4a', weight: 800, italic: true, maxW: w - 30 });
  ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(w * .2, h - 24); ctx.bezierCurveTo(w * .3, h - 36, w * .36, h - 14, w * .46, h - 26); ctx.stroke();
  ctx.fillStyle = '#c4202c'; ell(w * .76, h - 28, 9, 9); ctx.fill(); ctx.strokeStyle = '#8a1018'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fillStyle = '#c4202c'; ctx.beginPath(); ctx.moveTo(w * .76 - 4, h - 22); ctx.lineTo(w * .76 - 7, h - 10); ctx.lineTo(w * .76 - 2, h - 14); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(w * .76 + 4, h - 22); ctx.lineTo(w * .76 + 7, h - 10); ctx.lineTo(w * .76 + 2, h - 14); ctx.closePath(); ctx.fill();
}

// ------------------------------------------------------------------ the window ribbon: sky, skyline, moon, blinds
function stars(x0, y0, x1, y1, t, n, seed, a) {
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i + seed)), y = lerp(y0, y1, hash(i + seed + 70) ** 1.3), tw = .5 + .5 * Math.sin(t * (1.1 + hash(i + 5) * 2) + i), r = 1.1 + hash(i + 9) * 1.6;
    ctx.fillStyle = `rgba(255,252,235,${a * (.3 + .7 * tw)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
}
function windowBand(o, P) {
  const zb = LAY.zb, k = kz(zb), W_ = LAY.win, night = o.night, t = o.t ?? 0;
  const tilt = clamp(o.blinds ?? (night ? .5 : .45)), up = clamp(o.blindsUp ?? (night ? .78 : 0));
  W_.panes.forEach(([x0, x1], pi) => {
    const y0 = W_.y0, y1 = W_.y1;
    onZ(zb, x0 - 20, x1 + 20, y0 - 20, y1 + 24, P.frame, ink, 2.6);
    const f = [p2(x0, y0, zb), p2(x1, y0, zb), p2(x1, y1, zb), p2(x0, y1, zb)], L = f[3][0], R = f[2][0], T = f[3][1], B_ = f[0][1], Hh = B_ - T;
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    ctx.fillStyle = grad(0, T, 0, B_, night ? [[0, '#04061a'], [.6, '#101a42'], [1, '#233470']] : [[0, '#6fb8f4'], [.65, '#b5dcf8'], [1, '#eaf6fd']]); ctx.fillRect(L - 2, T - 2, R - L + 4, Hh + 4);
    if (night) stars(L, T, R, B_ - Hh * .3, t, 16, pi * 31 + 5, .9);
    else {
      A7.clouds(t, T + Hh * .12, T + Hh * .55, { n: 2, a: .92, speed: 5, seed: pi * 3 + 1, scale: .5 * k });
      V2.glow(R - (R - L) * .2, T + Hh * .18, (R - L) * .7, '255,244,214', .5, 'screen', 0);
    }
    for (let i = 0; i < 9; i++) {   // the town: pale blocks by day, a dark skyline with a few lit windows at night
      const bw = (R - L) / 9 * (1 + hash(i + pi * 9) * .4), bx = L + (R - L) * (i / 9) - bw * .1, bh = Hh * (.14 + .2 * hash(i + pi * 17 + 3));
      ctx.fillStyle = night ? '#0a0e26' : '#a9bfd6'; ctx.fillRect(bx, B_ - bh, bw, bh + 2);
      if (night) { for (let q = 0; q < 6; q++) if (hash(i * 7 + q + pi * 13) > .55) { ctx.fillStyle = hash(q + i) > .5 ? 'rgba(255,214,130,.85)' : 'rgba(255,236,170,.7)'; ctx.fillRect(bx + 5 + (q % 3) * bw * .28, B_ - bh + 8 + Math.floor(q / 3) * bh * .38, 5, 7); } }
      else { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let q = 0; q < 4; q++) ctx.fillRect(bx + 5 + (q % 2) * bw * .4, B_ - bh + 7 + Math.floor(q / 2) * bh * .4, 6, 8); }
    }
    if (night && pi === 1) {   // the Moon, high in the middle pane
      const mx = (L + R) / 2 + (R - L) * .12, my = T + Hh * .42, mr = Hh * .27;
      V2.glow(mx, my, mr * 3.4, '190,210,255', .42, 'screen', .5);
      ctx.fillStyle = grad(mx - mr, my - mr, mx + mr, my + mr, [[0, '#fffdf0'], [1, '#e6dcb8']]); ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(160,140,100,.22)'; for (const [dx, dy, rr2] of [[-.35, -.25, .22], [.3, .12, .17], [-.05, .4, .12], [.4, -.38, .1]]) { ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, rr2 * mr, 0, TAU); ctx.fill(); }
    }
    // the blinds: slats stacked from the top. up raises the stack, tilt (0 open to 1 shut) widens each slat
    const n = 11, pitch = Hh / n, pe = pitch * (1 - .86 * up), th = pe * (.2 + .82 * tilt);
    for (let i = 0; i < n; i++) {
      const y = T + i * pe;
      ctx.fillStyle = grad(0, y, 0, y + th, [[0, P.slat[0]], [1, P.slat[1]]]); ctx.fillRect(L - 2, y, R - L + 4, th);
      ctx.fillStyle = 'rgba(30,24,40,.34)'; ctx.fillRect(L - 2, y + th, R - L + 4, Math.max(1.4, 1.8 * k));
    }
    const bot = T + (n - 1) * pe + th;
    ctx.fillStyle = night ? '#46485c' : '#b89a6a'; ctx.fillRect(L - 2, bot, R - L + 4, 9 * k); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(L - 2, bot, R - L + 4, 2.4 * k);
    ctx.strokeStyle = night ? 'rgba(160,170,200,.5)' : 'rgba(120,100,70,.55)'; ctx.lineWidth = Math.max(1.4, 2 * k);
    for (const u of [.2, .8]) { const cx = lerp(L, R, u); ctx.beginPath(); ctx.moveTo(cx, T); ctx.lineTo(cx, bot + 20 * k); ctx.stroke(); }
    ctx.restore();
    onZ(zb, x0 - 26, x1 + 26, y0 - 34, y0 - 12, P.frame, ink, 2);   // the sill
  });
}

// ------------------------------------------------------------------ the wall: wainscot panels, pinstripes, cornice, the pictures
function wallDress(o, P) {
  const zb = LAY.zb, { hw, ch, rail } = LAY, night = o.night;
  // pinstripes on the plaster
  ctx.fillStyle = night ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.05)';
  for (let X = -hw + 10; X < hw; X += 70) onZ(zb, X, X + 26, rail + 8, ch - 50, ctx.fillStyle, null);
  // wainscot: raised panels
  for (let X = -hw + 20, i = 0; X < hw - 100; X += 168, i++) {
    onZ(zb, X, X + 144, 34, rail - 24, lit(P.wain, 1.12), 'rgba(15,8,6,.55)', 1.8);
    onZ(zb, X + 10, X + 134, 44, rail - 34, lit(P.wain, .92), 'rgba(255,220,170,.12)', 1.4);
  }
  // cornice: three bands and a row of dentils
  onZ(zb, -hw, hw, ch - 50, ch - 36, mix(P.wall, '#000000', .18).map(v => v | 0), null);
}

// ------------------------------------------------------------------ the set
function office(o = {}) {
  const night = !!o.night, P = night ? PAL.night : PAL.day, t = o.t ?? 0;
  const layout = { zb: LAY.zb, hw: LAY.hw, ch: LAY.ch, door: LAY.door, win: LAY.win, portrait: LAY.portrait, chart: LAY.chart };
  function back() {
    const zb = LAY.zb;
    shell({ zb, hw: LAY.hw, ch: LAY.ch, wall: P.wall, wain: P.wain, floorA: P.floorA, floorB: P.floorB, ceil: P.ceil, fog: P.fog, fogAmt: night ? .34 : .26, tile: 160, rail: LAY.rail });
    windowBand(o, P);
    wallDress(o, P);
    const pt = LAY.portrait, ch_ = LAY.chart, ps = LAY.poster;
    onWall(art('portrait', pt.w, pt.h, 2, drawPortrait), pt.x0, pt.y0 + pt.h, pt.w, pt.h, zb - 6);
    const pulse = o.chartPulse ?? 0;
    onWall(art('chart', ch_.w, ch_.h, 2, drawChart), ch_.x0, ch_.y1, ch_.w, ch_.h, zb - 6, 1 + .05 * pulse);
    onWall(art('poster', ps.w, ps.h, 3, drawPoster), ps.x0, ps.y1, ps.w, ps.h, zb - 6);
    DIP.forEach((d, i) => onWall(art('dip' + i, i === 0 ? 150 : 120, i === 0 ? 112 : 90, 3, (w, h) => drawDiploma(w, h, i)), -110 + i * 0, 500 - i * 100, i === 0 ? 150 : 120, i === 0 ? 112 : 90, zb - 6));
  }
  return { back, layout, night };
}

window.S10 = { office, LAY, PAL, art, onWall };
})();
