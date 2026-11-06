'use strict';
/* SHIFT HAPPENS, Episode 5 sets: the sunset lot, the break room, the night hallway, the supply-closet temple and the lobby,
 * plus the carts and set pieces that live in them. Added to window.A5 (see ep5_art.js). */
(() => {
const A = window.A5;
const { glow, stars } = A;
const wrap = (x0, P, off, lo = 0) => (((x0 - off) % P) + P) % P + lo;   // repeat x0 every P px as the world scrolls by `off`

// ------------------------------------------------------------------ the sunset lot (title and post-credits)
function skyDusk(p, dawn = false) {
  const g = ctx.createLinearGradient(0, -PAD, 0, 1300);
  if (dawn) { g.addColorStop(0, mixColor('#0d1236', '#5a6fb8', p)); g.addColorStop(.55, mixColor('#2a2f6a', '#f08a7a', p)); g.addColorStop(1, mixColor('#4a3f88', '#ffd08a', p)); }
  else { g.addColorStop(0, mixColor('#4a2f7a', '#0b1030', p)); g.addColorStop(.55, mixColor('#e0587a', '#222c62', p)); g.addColorStop(1, mixColor('#ffb066', '#3a3f88', p)); }
  ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1300 + PAD);
}
function cloudStreaks(p, lt) {
  for (let i = 0; i < 5; i++) {
    const x = ((srand(i) * 1400 + lt * (6 + i * 3)) % 1500) - 200, y = 300 + i * 120 + srand(i + 8) * 40;
    ctx.fillStyle = `rgba(255,${150 + i * 14},${150 + i * 10},${.34 * (1 - p * .8)})`;
    ell(x, y, 170 + i * 20, 18); ctx.fill(); ell(x + 90, y - 12, 110, 14); ctx.fill();
  }
}
function car(x, y, col, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(0, 36, 122, 14); ctx.fill();
  ctx.fillStyle = col; ctx.strokeStyle = '#0c0c20'; ctx.lineWidth = 4; rr(-110, -30, 220, 60, 22); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-70, -30); ctx.quadraticCurveTo(-60, -76, -20, -76); ctx.lineTo(40, -76); ctx.quadraticCurveTo(76, -72, 86, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fc6ff';
  ctx.beginPath(); ctx.moveTo(-54, -34); ctx.quadraticCurveTo(-46, -66, -18, -66); ctx.lineTo(8, -66); ctx.lineTo(8, -34); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(20, -34); ctx.lineTo(20, -66); ctx.lineTo(40, -66); ctx.quadraticCurveTo(66, -62, 74, -34); ctx.closePath(); ctx.fill();
  for (const wx of [-62, 64]) { ctx.fillStyle = '#12122a'; ell(wx, 30, 24, 24); ctx.fill(); ctx.fillStyle = '#9aa3b2'; ell(wx, 30, 10, 10); ctx.fill(); }
  ctx.fillStyle = '#ffe9a8'; rr(98, -12, 16, 14, 4); ctx.fill();
  ctx.restore();
}
function lotLayer() {
  cached('e5-lot', () => {
    ctx.fillStyle = '#15163a'; ctx.beginPath(); ctx.moveTo(-PAD, 1100);
    for (let x = -PAD; x <= W + PAD; x += 36) ctx.lineTo(x, 1032 - Math.abs(Math.sin(x * .021)) * 34 - srand(x * .1) * 22);
    ctx.lineTo(W + PAD, 1100); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1b2a3e'; ctx.fillRect(-PAD, 1212, W + PAD * 2, 70);
    const ag = ctx.createLinearGradient(0, 1270, 0, 1500); ag.addColorStop(0, '#2c2c48'); ag.addColorStop(1, '#17172e');
    ctx.fillStyle = ag; ctx.fillRect(-PAD, 1272, W + PAD * 2, 400);
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let x = -20; x < W + 80; x += 160) { ctx.beginPath(); ctx.moveTo(x, 1326); ctx.lineTo(x - 50, 1480); ctx.stroke(); }
    ctx.fillStyle = '#2a2a52'; ctx.fillRect(-10, 1014, 400, 220); ctx.fillRect(690, 1014, 400, 220);
    ctx.fillStyle = '#34346a'; ctx.fillRect(330, 932, 420, 302);
    ctx.fillStyle = '#1c1c3e'; ctx.fillRect(-10, 1004, 400, 14); ctx.fillRect(690, 1004, 400, 14); ctx.fillRect(322, 922, 436, 14);
    const win = (x, y, lit) => {
      ctx.fillStyle = lit ? '#ffd27a' : '#1a1d44'; ctx.fillRect(x, y, 54, 66); ctx.strokeStyle = '#14163a'; ctx.lineWidth = 4; ctx.strokeRect(x, y, 54, 66);
      if (lit) { ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + 4, y + 4, 20, 58); }
    };
    for (let i = 0; i < 6; i++) { win(26 + i * 62, 1062, srand(i * 3) > .3); win(706 + i * 62, 1062, srand(i * 3 + 9) > .3); }
    for (let i = 0; i < 5; i++) { win(26 + i * 62, 1152, srand(i * 5 + 2) > .45); win(706 + i * 62, 1152, srand(i * 5 + 4) > .45); }
    for (let i = 0; i < 4; i++) win(364 + i * 90, 1002, srand(i * 7 + 1) > .35);
    ctx.fillStyle = '#fff6e0'; ctx.strokeStyle = '#5a3d2b'; ctx.lineWidth = 8; rr(372, 946, 336, 46, 12); ctx.fill(); ctx.stroke();
    text('FRUIT BOWL REHAB & NURSING', 540, 970, { size: 21, fill: '#c0392b', maxW: 316 });
    ctx.fillStyle = '#ffd98a'; ctx.fillRect(458, 1102, 164, 132); ctx.fillStyle = '#5a3d2b'; ctx.fillRect(537, 1102, 6, 132);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(430, 1088, 220, 20);
    for (const x of [150, 930]) { ctx.fillStyle = '#0f1030'; ctx.fillRect(x - 5, 1100, 10, 190); ctx.fillStyle = '#ffe9a8'; ell(x, 1092, 18, 12); ctx.fill(); }
    car(250, 1340, '#c0392b'); car(830, 1376, '#2a9d8f', 1.1);
  });
  glow(150, 1092, 170, '255,226,140', .3); glow(930, 1092, 170, '255,226,140', .3);
}

// ------------------------------------------------------------------ the break room
function appleCore(x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.tilt || 0);
  regLocal('key', -90, -150, 90, 130, { id: 'gala' });
  ctx.save(); ctx.translate(0, Math.sin(t * 1.1) * 1.2);
  const flesh = '#f4ebc8';
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  // the exposed core in the middle, with seeds
  ctx.fillStyle = '#8a5a2b'; rr(-30, -26, 60, 60, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3b2412'; for (const [sx, sy, a] of [[-11, -6, .5], [11, -2, -.5], [-5, 16, .2]]) { ell(sx, sy, 5, 9, a); ctx.fill(); }
  // two lobes of what is left of the apple
  const lobe = (cy, rx, ry, bite) => {
    ctx.fillStyle = flesh; ell(0, cy, rx, ry); ctx.fill(); ctx.stroke();
    ctx.save(); ell(0, cy, rx, ry); ctx.clip();
    ctx.fillStyle = 'rgba(190,130,60,.40)'; ell(0, cy + bite * ry * .78, rx * .9, ry * .34); ctx.fill();
    ctx.fillStyle = 'rgba(180,180,195,.35)'; ell(-rx * .45, cy - bite * ry * .1, rx * .3, ry * .22); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(160,100,40,.85)'; ctx.strokeStyle = 'rgba(90,50,10,.8)'; ctx.lineWidth = 2.5;
    for (let i = -3; i <= 3; i++) { ell(i * 17, cy + bite * (ry - 4 - (Math.abs(i) % 2) * 3), 10, 7); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 5;
  };
  lobe(-76, 80, 58, 1); lobe(80, 74, 52, -1);
  // stem
  ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -130); ctx.quadraticCurveTo(10, -150, -2, -166); ctx.stroke();
  // X eyes and a flat mouth
  ctx.strokeStyle = INK; ctx.lineWidth = 6;
  for (const sd of [-1, 1]) { const ex = sd * 34, ey = -86; ctx.beginPath(); ctx.moveTo(ex - 11, ey - 11); ctx.lineTo(ex + 11, ey + 11); ctx.moveTo(ex + 11, ey - 11); ctx.lineTo(ex - 11, ey + 11); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-14, -52); ctx.lineTo(14, -52); ctx.stroke();
  // lanyard around the waist, badge on the lower lobe
  ctx.strokeStyle = '#2a6fdb'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-50, -36); ctx.quadraticCurveTo(-30, 18, 0, 26); ctx.quadraticCurveTo(30, 18, 50, -36); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-34, 40, 68, 46, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ctx.fillRect(-28, 45, 56, 12);
  text('GALA RN', 0, 72, { size: 14, fill: INK, maxW: 60 });
  ctx.restore();
  // cobwebs and a spider
  ctx.strokeStyle = 'rgba(235,235,245,.7)'; ctx.lineWidth = 2;
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sd * 52, -128); ctx.lineTo(sd * 140, -196); ctx.moveTo(sd * 60, -112); ctx.quadraticCurveTo(sd * 102, -124, sd * 132, -166); ctx.moveTo(sd * 72, -98); ctx.quadraticCurveTo(sd * 114, -106, sd * 144, -140); ctx.stroke();
  }
  const sp = 70 + 30 * Math.sin(t * .8);
  ctx.beginPath(); ctx.moveTo(34, -214); ctx.lineTo(34, -214 + sp); ctx.stroke();
  ctx.fillStyle = '#15151c'; ell(34, -214 + sp + 6, 7, 6); ctx.fill();
  ctx.strokeStyle = '#15151c'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { if (!i) continue; ctx.beginPath(); ctx.moveTo(34, -214 + sp + 6); ctx.lineTo(34 + i * 7, -214 + sp + 6 + Math.abs(i) * 3 + 6); ctx.stroke(); }
  ctx.restore();
}
// the door to the hall: warm light behind it, the leaf swinging into the room (hinged on the left)
function breakDoor(open) {
  const x = 30, y = 338, w = 198, h = 962;
  if (open > 0) {
    const g = ctx.createLinearGradient(x, y, x + w, y); g.addColorStop(0, '#fff0b8'); g.addColorStop(1, '#ffc46b');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(120,80,30,.35)'; ctx.fillRect(x + 90, y + 560, 108, 402);
  }
  const lw = w * (1 - open * .8), sk = open * 22;
  ctx.fillStyle = '#a07c54'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + lw, y + sk); ctx.lineTo(x + lw, y + h - sk); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x + lw * .12, y + 60 + sk * .6, lw * .76, 360); ctx.fillRect(x + lw * .12, y + 500, lw * .76, 400 - sk);
  ctx.fillStyle = '#d9dde2'; rr(x + lw - 34 * (lw / w), y + 520, 20 * (lw / w), 14, 5); ctx.fill();
}
function bgBreak() {
  cached('e5-break', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1300); g.addColorStop(0, '#d2c08e'); g.addColorStop(1, '#b09c6a');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ctx.fillStyle = '#e6e0cc'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 150 + PAD); ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(-PAD, 146, W + PAD * 2, 6);
    ctx.fillStyle = '#7c9484'; ctx.fillRect(-PAD, 900, W + PAD * 2, 400); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-PAD, 890, W + PAD * 2, 16);
    ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.lineWidth = 3; for (let x = 0; x < W; x += 140) { ctx.beginPath(); ctx.moveTo(x, 910); ctx.lineTo(x, 1300); ctx.stroke(); }
    floorPaint(1300, '#8a7f6a', '#5f5646');
    // door frame (the leaf is drawn live)
    ctx.fillStyle = '#6d5a3d'; ctx.fillRect(14, 322, 230, 986);
    ctx.fillStyle = '#10131f'; ctx.fillRect(30, 338, 198, 962);
    ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(34, 260, 190, 48, 8); ctx.fill(); ctx.stroke();
    text('BREAK ROOM', 129, 285, { size: 28, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2, maxW: 170 });
    // wellness poster
    ctx.fillStyle = '#8a5a2b'; rr(292, 186, 292, 292, 10); ctx.fill();
    ctx.fillStyle = '#fffdf4'; ctx.fillRect(304, 198, 268, 268);
    ctx.fillStyle = '#ffd22e'; ell(438, 292, 52, 52); ctx.fill(); ctx.strokeStyle = '#e98a00'; ctx.lineWidth = 6;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(438 + Math.cos(a) * 64, 292 + Math.sin(a) * 64); ctx.lineTo(438 + Math.cos(a) * 84, 292 + Math.sin(a) * 84); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(438, 300, 24, .2, PI - .2); ctx.stroke(); ctx.fillStyle = INK; ell(422, 284, 5, 7); ctx.fill(); ell(454, 284, 5, 7); ctx.fill();
    text('WE VALUE YOUR', 438, 392, { size: 26, font: 'Bangers', weight: 400, fill: '#2a9d4a', spacing: 2, maxW: 250 });
    text('WELLNESS', 438, 424, { size: 36, font: 'Bangers', weight: 400, fill: '#2a9d4a', spacing: 3, maxW: 250 });
    text('*breaks subject to census', 438, 452, { size: 16, fill: '#777', italic: true, maxW: 250 });
    // kitchenette
    ctx.fillStyle = '#b79a6a'; ctx.fillRect(280, 560, 370, 190); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(280, 560, 370, 190);
    ctx.beginPath(); ctx.moveTo(465, 560); ctx.lineTo(465, 750); ctx.stroke();
    ctx.fillStyle = '#d9c9a0'; for (const x of [440, 490]) { rr(x, 640, 14, 40, 5); ctx.fill(); }
    ctx.fillStyle = '#9fb0b8'; ctx.fillRect(270, 1130, 390, 22); ctx.fillStyle = '#7e8c94'; ctx.fillRect(270, 1152, 390, 150);
    ctx.fillStyle = '#d8dde0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(296, 1010, 150, 120, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b2230'; rr(310, 1024, 92, 92, 6); ctx.fill(); ctx.fillStyle = '#8a95a3'; for (let i = 0; i < 3; i++) { ell(424, 1040 + i * 26, 7, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(210,205,190,.45)'; ctx.fillRect(296, 1010, 150, 18);
    ctx.fillStyle = '#2b2b33'; rr(500, 1040, 70, 90, 8); ctx.fill(); ctx.fillStyle = 'rgba(240,235,220,.5)'; ctx.fillRect(508, 1044, 54, 12);
    ctx.fillStyle = '#e8e2d0'; ell(535, 1110, 22, 24); ctx.fill(); ctx.fillStyle = '#7a5a3a'; ell(535, 1116, 14, 10); ctx.fill();
  });
}
// The live part of the room: window, flickering tube, dust.
function breakLight(lt, on) {
  const flick = on <= 0 ? 0 : on >= 1 ? 1 : (Math.sin(lt * 70) > 0 ? .9 : .15);
  ctx.fillStyle = flick > .5 ? '#fffbe8' : '#8a897c'; rr(380, 46, 320, 36, 8); ctx.fill();
  if (flick > .5) glow(540, 90, 600, '255,246,214', .22 * flick);
  return flick;
}
function tableSet(x0, x1, yTop, cloud = '#6fa8a0') {
  ctx.fillStyle = '#c9a46c'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(x0 - 14, yTop - 6, x1 - x0 + 28, 30, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = cloud; ctx.fillRect(x0, yTop + 22, x1 - x0, 300);
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 4; for (let x = x0 + 30; x < x1; x += 56) { ctx.beginPath(); ctx.moveTo(x, yTop + 24); ctx.lineTo(x - 6, yTop + 320); ctx.stroke(); }
  const g = ctx.createLinearGradient(0, yTop + 22, 0, yTop + 200); g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x0, yTop + 22, x1 - x0, 180);
}
function chairBack(x, y, col = '#c8742e', w = 190) {
  ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(x - w / 2, y, w, 250, 34); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.16)'; rr(x - w / 2 + 14, y + 16, w - 28, 150, 26); ctx.fill();
}

// ------------------------------------------------------------------ the night hallway
// World coordinates scroll left by `off`; closet door at X 50-260, exit doors at X 700-1040 when asked for.
function hallBG(off = 0, o = {}) {
  const g = ctx.createLinearGradient(0, 120, 0, 480); g.addColorStop(0, '#0b1030'); g.addColorStop(1, '#27306a');
  ctx.fillStyle = g; ctx.fillRect(-PAD, 120, W + PAD * 2, 360);
  stars(1, 5, 40, 450);
  if (o.moon) o.moon();
  ctx.fillStyle = '#c9c3b3';
  for (let k = 0; k < 4; k++) ctx.fillRect(wrap(100 + k * 440, 1760, off) - 300, 120, 14, 360);
  ctx.fillRect(-PAD, 120, W + PAD * 2, 12); ctx.fillRect(-PAD, 476, W + PAD * 2, 14);
  const wg = ctx.createLinearGradient(0, 488, 0, 1010); wg.addColorStop(0, '#6e7aa2'); wg.addColorStop(1, '#58638e');
  ctx.fillStyle = wg; ctx.fillRect(-PAD, 490, W + PAD * 2, 530);
  ctx.fillStyle = '#41707a'; ctx.fillRect(-PAD, 1010, W + PAD * 2, 264); ctx.fillStyle = '#d8d2c0'; ctx.fillRect(-PAD, 1002, W + PAD * 2, 16);
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 3; for (let k = -1; k < 10; k++) { const x = wrap(0, 120, off) + k * 120 - 120; ctx.beginPath(); ctx.moveTo(x, 1022); ctx.lineTo(x, 1272); ctx.stroke(); }
  ctx.fillStyle = '#b8895a'; ctx.fillRect(-PAD, 1090, W + PAD * 2, 20);
  ctx.fillStyle = '#7d8087'; for (let k = -1; k < 8; k++) ctx.fillRect(wrap(40, 180, off) + k * 180 - 180, 1110, 12, 24);
  const fg = ctx.createLinearGradient(0, 1274, 0, 1500); fg.addColorStop(0, '#7d80a4'); fg.addColorStop(1, '#4a4d72');
  ctx.fillStyle = fg; ctx.fillRect(-PAD, 1274, W + PAD * 2, 400);
  ctx.fillStyle = '#272a52'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 120 + PAD);
  for (let k = 0; k < 4; k++) {
    const x = wrap(130 + k * 420, 1680, off) - 220, lit = !(o.flicker && k === 1 && Math.sin(T * 60) > .3);
    ctx.fillStyle = lit ? '#fff4d6' : '#4a4a58'; rr(x - 100, 40, 200, 34, 8); ctx.fill();
    if (lit) { const lg = ctx.createLinearGradient(0, 74, 0, 700); lg.addColorStop(0, 'rgba(255,244,214,.16)'); lg.addColorStop(1, 'rgba(255,244,214,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - 90, 74); ctx.lineTo(x + 90, 74); ctx.lineTo(x + 220, 1260); ctx.lineTo(x - 220, 1260); ctx.fill(); }
  }
  // doors, skipping the world X ranges used by the closet and exit set pieces
  const skip = (X) => (o.closet && X > 0 && X < 330) || (o.exit && X > 620 && X < 1060);
  for (let k = -2; k < 24; k++) {
    const X = 330 + k * 560, x = X - off;
    if (x < -260 || x > W + 60 || skip(X)) continue;
    ctx.fillStyle = '#4e3a28'; ctx.fillRect(x - 10, 540, 230, 740);
    ctx.fillStyle = '#85674a'; ctx.fillRect(x, 552, 210, 728);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 18 + i * 38, 566, 3, 700);
    ctx.fillStyle = '#d9dde2'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x + 164, 900, 30, 16, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#555'; rr(x + 50, 496, 110, 40, 8); ctx.fill(); ctx.stroke();
    text('ROOM ' + (10 + 2 * (k + 3)), x + 105, 516, { size: 19, fill: INK });
  }
  if (o.closet) {
    const x = 50 - off;
    if (x > -300 && x < W + 100) {
      ctx.fillStyle = '#3d2f45'; ctx.fillRect(x - 12, 460, 234, 820);
      ctx.fillStyle = '#6a5a74'; ctx.fillRect(x, 472, 210, 808);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3; rr(x + 10, 500, 190, 120, 8); ctx.fill(); ctx.stroke();
      text('SUPPLY', x + 105, 534, { size: 38, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 });
      text('DO NOT ENTER', x + 105, 572, { size: 24, font: 'Bangers', weight: 400, fill: INK, spacing: 1, maxW: 176 });
      text('(REALLY)', x + 105, 602, { size: 20, fill: '#555', italic: true });
      if (o.closetOpen) { ctx.fillStyle = '#10101a'; ctx.fillRect(x + 10, 640, 190, 640); const gl = ctx.createLinearGradient(x, 0, x + 220, 0); gl.addColorStop(0, 'rgba(255,214,120,.55)'); gl.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = gl; ctx.fillRect(x + 10, 640, 190, 640); }
      if (o.closetKey) regKey('closet-sign', x + 10, 500, x + 200, 620);
    }
  }
  if (o.exit) {
    const x = 700 - off;
    ctx.fillStyle = '#4a4f5a'; ctx.fillRect(x - 12, 500, 364, 780);
    ctx.fillStyle = '#9aa4b2'; ctx.fillRect(x, 512, 164, 768); ctx.fillRect(x + 176, 512, 164, 768);
    ctx.fillStyle = '#c9e4ff'; ctx.fillRect(x + 20, 560, 124, 200); ctx.fillRect(x + 196, 560, 124, 200);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 28, 568, 28, 184); ctx.fillRect(x + 204, 568, 28, 184);
    ctx.fillStyle = '#c9d2dc'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x + 14, 920, 142, 26, 8); ctx.fill(); ctx.stroke(); rr(x + 184, 920, 142, 26, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b3a1b'; rr(x + 80, 330, 180, 70, 8); ctx.fill();
    ctx.fillStyle = `rgba(80,255,120,${.85 + .15 * Math.sin(T * 7)})`; rr(x + 90, 340, 160, 50, 6); ctx.fill();
    text('EXIT', x + 170, 366, { size: 44, fill: '#eaffea', font: 'Bangers', weight: 400 });
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d62828'; ctx.lineWidth = 4; rr(x + 60, 414, 220, 58, 8); ctx.fill(); ctx.stroke();
    text('DOOR IS ALARMED', x + 170, 434, { size: 22, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 1, maxW: 200 });
    text('(YES, THIS ONE)', x + 170, 458, { size: 17, fill: INK, italic: true, maxW: 200 });
    if (o.exitKey) regKey('exit-sign', x + 60, 330, x + 280, 472);
    ctx.fillStyle = '#3a3f4a'; rr(x - 70, 640, 44, 90, 6); ctx.fill(); ctx.fillStyle = '#9fb3c8'; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { ctx.fillRect(x - 64 + i * 12, 650 + j * 14, 8, 8); }
    if (o.alarm) { glow(x + 170, 500, 260, '255,50,60', .5 * (Math.sin(T * 14) > 0 ? 1 : .2)); }
    ctx.fillStyle = o.alarm && Math.sin(T * 14) > 0 ? '#ff2d3d' : '#5a1d22'; ell(x - 48, 600, 14, 14); ctx.fill();
  }
}
function vitalsCart(x, y, err, lt = 0, transit = false) {
  ctx.save(); ctx.translate(x, y);
  regLocal('prop', -90, -470, 90, 14, { id: 'vitals-cart', owner: 'set', transit });
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 6, 100, 14); ctx.fill();
  ctx.fillStyle = '#8a95a3'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-12, -400, 24, 380, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6d7a88'; rr(-84, -40, 168, 28, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#222'; for (const dx of [-66, 66]) { ell(dx, -2, 16, 16); ctx.fill(); }
  ctx.fillStyle = '#dfe5ea'; rr(-96, -440, 192, 130, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0b0f14'; rr(-82, -428, 164, 94, 8); ctx.fill();
  const on = err && Math.sin(lt * 9) > -.3;
  if (err) { text('ERR 3', 0, -396, { size: 54, font: 'Bangers', weight: 400, fill: on ? '#ff4040' : '#702020', spacing: 2 }); }
  else text('120/80', 0, -396, { size: 50, font: 'Bangers', weight: 400, fill: '#7dff9a', spacing: 2 });
  ctx.strokeStyle = '#15151c'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(96, -390); ctx.bezierCurveTo(150, -360, 140, -250, 104, -214); ctx.stroke();
  ctx.fillStyle = '#6d7a88'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(86, -226, 40, 18, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7d8a99'; rr(24, -250, 66, 60, 8); ctx.fill(); ctx.stroke();   // basket
  ctx.restore();
}
function laundryCart(x, y, s, rot, lt) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(0, 8, 190, 16); ctx.fill();
  // heap of sheets
  ctx.fillStyle = '#f4f6fb'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  for (const [sx, sy, rw, rh] of [[-80, -250, 90, 60], [10, -285, 100, 70], [90, -240, 86, 56], [-10, -230, 120, 50]]) { ell(sx, sy, rw, rh); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#dbe3f2'; ell(-40, -262, 40, 18); ctx.fill(); ell(70, -250, 36, 16); ctx.fill();
  // bin
  ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-170, -230); ctx.lineTo(170, -230); ctx.lineTo(150, -40); ctx.lineTo(-150, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = -3; i <= 3; i++) ctx.fillRect(i * 44 - 4, -222, 8, 176);
  ctx.fillStyle = '#fff'; rr(-80, -170, 160, 70, 10); ctx.fill(); ctx.stroke();
  text('LAUNDRY', 0, -146, { size: 36, font: 'Bangers', weight: 400, fill: '#2a6fdb', spacing: 2, maxW: 144 });
  text('(unattended)', 0, -114, { size: 17, fill: INK, italic: true, maxW: 140 });
  ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-170, -230); ctx.lineTo(-200, -300); ctx.stroke();
  ctx.fillStyle = '#222'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (const dx of [-120, 120]) { ell(dx, -24, 26, 26); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx, -24); ctx.lineTo(dx + 20 * Math.cos(lt * 30), -24 + 20 * Math.sin(lt * 30)); ctx.stroke(); ctx.strokeStyle = INK; }
  ctx.restore();
}

// ------------------------------------------------------------------ the supply-closet temple
function bgTemple() {
  cached('e5-temple', () => {
    const g = ctx.createLinearGradient(0, -PAD, 0, 1480); g.addColorStop(0, '#1d1530'); g.addColorStop(1, '#0f0b1c');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1660);
    ctx.fillStyle = '#2a2040'; ctx.beginPath(); ctx.moveTo(300, 1260); ctx.lineTo(300, 540); ctx.arc(540, 540, 240, PI, 0); ctx.lineTo(780, 1260); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4b3a6e'; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = 'rgba(224,180,70,.5)'; ctx.lineWidth = 8; rr(450, 390, 180, 66, 16); ctx.stroke(); ell(540, 330, 44, 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(540, 330); ctx.lineTo(560, 310); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = -PI + .5 + i * .43; ctx.beginPath(); ctx.moveTo(540 + Math.cos(a) * 190, 540 + Math.sin(a) * 190); ctx.lineTo(540 + Math.cos(a) * 214, 540 + Math.sin(a) * 214); ctx.stroke(); }
    const labels = ['GLOVES', 'WIPES', 'GAUZE', 'BRIEFS', 'T.P.', 'TOWELS', 'SALINE', 'GOWNS'];
    const shelf = (x0, x1) => {
      ctx.fillStyle = '#4a3a2c'; ctx.fillRect(x0, 280, 16, 990); ctx.fillRect(x1 - 16, 280, 16, 990);
      for (let r = 0; r < 5; r++) {
        const y = 400 + r * 190;
        ctx.fillStyle = '#6b5440'; ctx.fillRect(x0, y, x1 - x0, 18);
        let x = x0 + 24;
        for (let i = 0; x < x1 - 70; i++) {
          const w = 56 + srand(i + r * 9 + x0) * 36, h = 60 + srand(i * 3 + r * 5 + x0) * 70;
          const cols = ['#e9e4d6', '#cfd8e6', '#f2e8c8', '#bcd3c9'];
          ctx.fillStyle = cols[(i + r) % 4]; ctx.strokeStyle = '#14101e'; ctx.lineWidth = 3; ctx.fillRect(x, y - h, w, h); ctx.strokeRect(x, y - h, w, h);
          if (w > 66) text(labels[(i + r * 3) % 8], x + w / 2, y - h / 2, { size: 12, fill: '#3a3550', weight: 800, maxW: w - 4 });
          x += w + 10;
        }
      }
    };
    shelf(10, 290); shelf(790, 1070);
    ctx.fillStyle = '#2b2438'; ctx.fillRect(-PAD, 1262, W + PAD * 2, 400);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 3; for (let x = -100; x < W + 100; x += 90) { ctx.beginPath(); ctx.moveTo(x, 1262); ctx.lineTo(x - (x - 540) * .5, 1500); ctx.stroke(); }
    // pedestal
    ctx.fillStyle = '#5b5068'; ctx.strokeStyle = '#14101e'; ctx.lineWidth = 5; rr(430, 1000, 220, 262, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#74688a'; rr(412, 976, 256, 34, 8); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(430, 1030); ctx.lineTo(650, 1030); ctx.moveTo(430, 1240); ctx.lineTo(650, 1240); ctx.stroke();
    ctx.fillStyle = '#f2e6c8'; ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 4; rr(456, 1092, 168, 128, 8); ctx.fill(); ctx.stroke();
    text('PROPERTY OF', 540, 1118, { size: 20, fill: '#5a3a10', maxW: 150 });
    text('11-7', 540, 1160, { size: 52, font: 'Bangers', weight: 400, fill: '#b3001f', spacing: 3 });
    text('HANDS OFF', 540, 1200, { size: 22, fill: '#5a3a10', maxW: 150 });
  });
}
function spotlight(a, lt) {
  if (a <= 0) return;
  const g = ctx.createLinearGradient(0, 120, 0, 1000); g.addColorStop(0, `rgba(255,236,170,${.55 * a})`); g.addColorStop(1, `rgba(255,236,170,${.14 * a})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(500, 120); ctx.lineTo(580, 120); ctx.lineTo(690, 990); ctx.lineTo(390, 990); ctx.closePath(); ctx.fill();
  glow(540, 975, 260, '255,226,130', .5 * a);
  for (let i = 0; i < 26; i++) {
    const q = (lt * .12 + srand(i)) % 1, x = 540 + (srand(i + 40) - .5) * (160 + q * 240), y = 130 + q * 860;
    ctx.fillStyle = `rgba(255,248,210,${.6 * a * Math.sin(q * PI)})`; ell(x, y, 2.6, 2.6); ctx.fill();
  }
}
function goodCuff(x, y, glowA, lt) {
  glow(x, y - 40, 190, '255,226,120', .85 * glowA);
  ctx.save(); ctx.translate(x, y - 6 + Math.sin(lt * 2.4) * 4);
  ctx.fillStyle = '#2a3f7a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-52, -64, 104, 46, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a62a8'; rr(-44, -58, 88, 12, 5); ctx.fill(); ctx.fillStyle = '#e6edf7'; ctx.fillRect(-48, -38, 96, 5);
  ctx.fillStyle = '#0b0f14'; rr(14, -56, 32, 20, 4); ctx.fill(); text('0:00', 30, -46, { size: 11, font: 'Bangers', weight: 400, fill: '#7dff9a' });
  ctx.strokeStyle = '#15151c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-36, -18); ctx.bezierCurveTo(-70, 12, -30, 28, 0, 8); ctx.stroke();
  ctx.fillStyle = '#15151c'; ell(10, 12, 11, 15); ctx.fill();
  ctx.restore();
  for (let i = 0; i < 6; i++) { const q = (lt * .7 + i / 6) % 1, a = i * 1.05 + lt; ctx.fillStyle = `rgba(255,246,190,${.9 * Math.sin(q * PI)})`; const sx = x + Math.cos(a) * (50 + q * 40), sy = y - 40 + Math.sin(a) * (34 + q * 30); ctx.beginPath(); for (let j = 0; j < 8; j++) { const aa = j * PI / 4, r = j % 2 ? 2 : 9; ctx.lineTo(sx + Math.cos(aa) * r, sy + Math.sin(aa) * r); } ctx.fill(); }
}

// ------------------------------------------------------------------ the lobby
function bgLobby() {
  cached('e5-lobby', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1250); g.addColorStop(0, '#2d3860'); g.addColorStop(1, '#212a4c');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ctx.fillStyle = '#1a2040'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 150 + PAD);
    for (const x of [200, 540, 880]) { ctx.fillStyle = '#e9e4cc'; rr(x - 70, 52, 140, 28, 8); ctx.fill(); }
    ctx.fillStyle = '#34476f'; ctx.fillRect(-PAD, 990, W + PAD * 2, 270); ctx.fillStyle = '#c9c3b3'; ctx.fillRect(-PAD, 982, W + PAD * 2, 16);
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 3; for (let x = 0; x < W; x += 140) { ctx.beginPath(); ctx.moveTo(x, 1002); ctx.lineTo(x, 1260); ctx.stroke(); }
    floorPaint(1260, '#4c5078', '#2e3150');
    // reception desk
    ctx.fillStyle = '#6b4a33'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(20, 1100, 610, 170, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#845c40'; for (let x = 50; x < 620; x += 90) { rr(x, 1124, 66, 120, 8); ctx.fill(); }
    ctx.fillStyle = '#c9a46c'; rr(8, 1074, 634, 36, 10); ctx.fill(); ctx.stroke();
    // lamp and bell on the desk
    ctx.fillStyle = '#c9d2dc'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(120, 1068, 22, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd60a'; ell(120, 1056, 6, 6); ctx.fill();
    ctx.strokeStyle = '#5a4a30'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(240, 1070); ctx.lineTo(244, 990); ctx.lineTo(290, 960); ctx.stroke(); ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.moveTo(272, 950); ctx.lineTo(318, 970); ctx.lineTo(300, 992); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(40, 1010, 150, 52, 6); ctx.fill(); ctx.stroke(); text('PLEASE RING', 115, 1028, { size: 15, fill: '#2a6fdb', maxW: 130 }); text('(WE WILL NOT HEAR IT)', 115, 1048, { size: 11, fill: INK, italic: true, maxW: 134 });
    // plant by the window
    ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1000, 1170); ctx.lineTo(1050, 1170); ctx.lineTo(1040, 1250); ctx.lineTo(1010, 1250); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const a of [-1.1, -.55, 0, .55, 1.1]) leaf(1025, 1170, a, 130, 20, '#2f8f3a');
  });
}
function lobbyDoors(open) {
  const x = 800, y = 420, w = 250, h = 850;
  ctx.fillStyle = '#9aa4b2'; ctx.fillRect(x - 14, y - 14, w + 28, h + 14);
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0a0f2a'); g.addColorStop(1, '#1a2248'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  glow(x + 90, y + 360, 160, '255,226,140', .35);
  ctx.fillStyle = '#ffe9a8'; ell(x + 90, y + 340, 14, 10); ctx.fill(); ctx.fillStyle = '#0f1030'; ctx.fillRect(x + 85, y + 346, 10, 400);
  const pw = w / 2 * (1 - open * .92);
  for (const sd of [-1, 1]) {
    const px = sd < 0 ? x : x + w - pw;
    ctx.fillStyle = 'rgba(190,215,240,.34)'; ctx.fillRect(px, y, pw, h); ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 6; ctx.strokeRect(px, y, pw, h);
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(px + pw * .2, y + h); ctx.lineTo(px + pw * .55, y + 80); ctx.lineTo(px + pw * .75, y + 80); ctx.lineTo(px + pw * .4, y + h); ctx.fill();
  }
  ctx.fillStyle = '#1b3a1b'; rr(x + 60, y - 80, 130, 52, 8); ctx.fill(); text('EXIT', x + 125, y - 53, { size: 34, fill: '#7dff9a', font: 'Bangers', weight: 400 });
}
function bigClock(x, y, h, m) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 10; ell(x, y, 92, 92); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = INK; ell(x + Math.sin(a) * 74, y - Math.cos(a) * 74, i % 3 ? 4 : 7, i % 3 ? 4 : 7); ctx.fill(); }
  const ma = m / 60 * TAU, ha = ((h % 12) / 12 + m / 720) * TAU;
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ha) * 44, y - Math.cos(ha) * 44); ctx.stroke();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(ma) * 66, y - Math.cos(ma) * 66); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ell(x, y, 8, 8); ctx.fill();
  regKey('lobby-clock', x - 98, y - 98, x + 98, y + 98);
}
// Computer on wheels: a cow-print cart with horns and ears on the monitor. state: 'ok' | 'dying' | 'dead'
function cow(x, y, state, lt) {
  ctx.save(); ctx.translate(x, y);
  regLocal('prop', -120, -470, 120, 14, { id: 'cow', owner: 'set' });
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(0, 6, 110, 14); ctx.fill();
  ctx.fillStyle = '#f4f4f0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-16, -330, 32, 300, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4f4f0'; rr(-90, -44, 180, 30, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#222'; for (const dx of [-70, 70]) { ell(dx, -2, 17, 17); ctx.fill(); }
  ctx.fillStyle = '#15151c'; for (const [sx, sy, rw, rh] of [[-8, -250, 12, 22], [6, -180, 10, 18], [-6, -110, 11, 16]]) { ell(sx, sy, rw, rh, .3); ctx.fill(); }
  // keyboard tray
  ctx.fillStyle = '#e9e9e4'; rr(-80, -262, 160, 24, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a8f98'; for (let i = 0; i < 9; i++) ctx.fillRect(-70 + i * 17, -256, 12, 7);
  // monitor head
  const sh = state === 'dying' ? Math.sin(lt * 50) * 3 : 0;
  ctx.save(); ctx.translate(sh, 0);
  ctx.fillStyle = '#f4f4f0'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(-118, -470, 236, 150, 16); ctx.fill(); ctx.stroke();
  const droop = state === 'ok' ? 0 : 1;
  ctx.fillStyle = '#ffd5dc'; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 118, -450); ctx.rotate(sd * (.5 + droop * .7)); rr(-4, -10, 56 * sd > 0 ? 56 : -60, 26, 13); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#fff6dc'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 70, -470); ctx.quadraticCurveTo(sd * 96, -510 + droop * 20, sd * 78, -540 + droop * 30); ctx.quadraticCurveTo(sd * 54, -508, sd * 50, -470); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#15151c'; for (const [sx, sy, rw, rh] of [[-96, -440, 14, 20], [88, -346, 16, 13], [-8, -332, 10, 8]]) { ell(sx, sy, rw, rh, .4); ctx.fill(); }
  const dead = state === 'dead', dy = state === 'dying';
  ctx.fillStyle = dead ? '#3a1018' : '#1b5fa8'; rr(-100, -456, 200, 122, 8); ctx.fill();
  if (dead) { text('SESSION', 0, -420, { size: 30, font: 'Bangers', weight: 400, fill: '#ff6b78', spacing: 2 }); text('EXPIRED', 0, -386, { size: 30, font: 'Bangers', weight: 400, fill: '#ff6b78', spacing: 2 }); text('x_x', 0, -352, { size: 28, fill: '#ffd0d4' }); }
  else { ctx.fillStyle = '#fff'; ctx.fillRect(-88, -444, 90, 8); ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) ctx.fillRect(-88, -426 + i * 16, 170 - (i % 3) * 34, 7); if (dy) { ctx.fillStyle = '#ff3030'; rr(52, -448, 40, 18, 4); ctx.fill(); text('3%', 72, -439, { size: 13, fill: '#fff' }); } }
  ctx.restore();
  ctx.restore();
}

Object.assign(A, { skyDusk, cloudStreaks, lotLayer, car, appleCore, breakDoor, bgBreak, breakLight, tableSet, chairBack, hallBG, vitalsCart, laundryCart, bgTemple, spotlight, goodCuff, bgLobby, lobbyDoors, bigClock, cow, wrap });
})();
