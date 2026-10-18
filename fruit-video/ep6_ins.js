'use strict';
/* Episode 6 inserts: macro close-ups of the things that make the noise (IV pump, pulse oximeter, door clock, smoke detector,
 * 9-volt battery, stethoscope on a wall, hearing aid) and the full-screen UI cards (floor plan, alarm library).
 * Each insert draws a complete picture in scene coordinates, over a bokeh backdrop, so a cut to it reads instantly. */
(() => {
const A = window.A6;
const { grad, radial, rgba } = V2;

// out-of-focus lights drifting behind a macro object
A.bokeh = (lt, pal = ['255,170,60', '80,165,255', '90,230,130', '255,90,90'], base = ['#101433', '#1d1a3a']) => {
  ctx.fillStyle = grad(0, 0, 0, H, [[0, base[0]], [1, base[1]]]); ctx.fillRect(-100, -100, W + 200, H + 200);
  for (let i = 0; i < 26; i++) {
    const r = 40 + hash(i + 3) * 110, x = (hash(i) * 1.3 - .15) * W + Math.sin(lt * .25 + i) * 30, y = 200 + hash(i + 9) * 1200 + Math.cos(lt * .2 + i * 2) * 24;
    const c = pal[i % pal.length], a = .05 + .09 * hash(i + 21) + .04 * Math.sin(lt * 2 + i);
    ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(c, a * 1.4); ctx.lineWidth = 3; ctx.stroke();
  }
};
const shadow = (x, y, w, h, a = .4) => { ctx.save(); ctx.fillStyle = V2.radial(x, y, 0, w, [[0, `rgba(0,0,0,${a})`], [1, 'rgba(0,0,0,0)']]); ctx.translate(0, y); ctx.scale(1, h / w); ctx.translate(0, -y); ctx.beginPath(); ctx.arc(x, y, w, 0, TAU); ctx.fill(); ctx.restore(); };
const plate = (x, y, w, h, r, c0, c1, edge = 'rgba(20,14,30,.9)', lw = 6) => { ctx.fillStyle = grad(x, y, x, y + h, [[0, c0], [1, c1]]); rr(x, y, w, h, r); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.stroke(); };

// ---------------------------------------------------------------- the IV pump: OCCLUSION, with a kinked line
A.insPump = (lt, on = 1, k = 0) => {
  A.bokeh(lt, ['80,165,255', '255,170,60', '90,230,130']);
  const cx = 540, top = 360, w = 600, h = 760;
  // pole and tubing
  ctx.fillStyle = '#c3ccd6'; ctx.fillRect(cx + w / 2 + 30, 120, 26, 1500); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(cx + w / 2 + 34, 120, 8, 1500);
  ctx.strokeStyle = 'rgba(210,235,250,.9)'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 170, top); ctx.bezierCurveTo(cx - 170, top - 170, cx - 380, top - 190, cx - 360, top - 330); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 160, top + h); ctx.bezierCurveTo(cx + 160, top + h + 120, cx - 90, top + h + 170, cx - 140, top + h + 330); ctx.stroke();
  // the kink
  ctx.strokeStyle = '#8fb6cf'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(cx - 140, top + h + 330); ctx.lineTo(cx - 100, top + h + 350); ctx.lineTo(cx - 150, top + h + 372); ctx.lineTo(cx - 108, top + h + 396); ctx.stroke();
  shadow(cx, top + h + 40, w * .62, 70, .5);
  // the unit
  plate(cx - w / 2, top, w, h, 54, '#eef2f6', '#b9c3cf');
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(cx - w / 2 + 14, top + 14, 28, h - 28, 14); ctx.fill();
  ctx.fillStyle = '#e8eef4'; rr(cx - 130, top - 70, 260, 90, 30); ctx.fill(); ctx.strokeStyle = 'rgba(20,14,30,.9)'; ctx.lineWidth = 6; ctx.stroke();   // drip chamber
  ctx.fillStyle = 'rgba(130,190,240,.55)'; rr(cx - 100, top - 60, 200, 60, 20); ctx.fill();
  const drip = (lt * 1.6) % 1; ctx.fillStyle = 'rgba(190,225,250,.9)'; ell(cx, top - 70 + drip * 90, 8, 11); ctx.fill();
  // screen
  const sx = cx - 240, sy = top + 90, sw = 480, sh = 280, flash = on ? (Math.sin(lt * 9) > -.2 ? 1 : .25) : 0;
  ctx.fillStyle = '#06151f'; rr(sx, sy, sw, sh, 18); ctx.fill(); ctx.strokeStyle = '#1b2a3a'; ctx.lineWidth = 8; ctx.stroke();
  ctx.fillStyle = on ? `rgba(255,60,60,${.18 * flash})` : 'rgba(255,255,255,0)'; rr(sx, sy, sw, sh, 18); ctx.fill();
  text(on ? 'OCCLUSION' : 'RUNNING', cx, sy + 84, { size: 76, font: 'Bangers', weight: 400, fill: on ? `rgba(255,${90 + 60 * (1 - flash) | 0},80,${.55 + .45 * flash})` : '#59e08b', spacing: 3 });
  text(on ? 'DOWNSTREAM  -  CHECK LINE' : 'INFUSING', cx, sy + 142, { size: 28, fill: '#9fd0ff', spacing: 2 });
  text('125', sx + 120, sy + 220, { size: 64, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 }); text('mL/hr', sx + 120, sy + 262, { size: 24, fill: '#9fb3c8' });
  text('VTBI 500', sx + 340, sy + 232, { size: 30, fill: '#9fd0ff', spacing: 1 });
  V2.glow(cx, sy + sh / 2, 420, on ? '255,70,70' : '90,230,130', .28 * (on ? flash : .6), 'screen', .5);
  // keys
  const keys = [['START', '#58b83a'], ['STOP', '#e8193a'], ['SILENCE', '#ffb703']];
  keys.forEach(([t, c], i) => { const kx = cx - 230 + i * 160, ky = top + h - 190, press = i === 2 ? k : 0; plate(kx, ky + press * 8, 140, 84, 22, c, '#00000055', 'rgba(20,14,30,.85)', 5); text(t, kx + 70, ky + 44 + press * 8, { size: 28, fill: '#fff', spacing: 1 }); });
  ctx.fillStyle = '#9aa4b0'; rr(cx - 120, top + h - 78, 240, 30, 15); ctx.fill(); text('FRUIT BOWL  PUMP 4', cx, top + h - 62, { size: 20, fill: '#3a4250', spacing: 2 });
  if (on) for (let i = 0; i < 4; i++) A.ring(cx, sy + sh / 2, ((lt * 1.5) - i * .25) % 1 < 0 ? 0 : (((lt * 1.5) - i * .25) % 1 + 1) % 1, 'pump', { r0: 260, r1: 640, lw: 8, alpha: .55 * (1 - i * .2) });
};

// ---------------------------------------------------------------- the pulse oximeter, fallen off, being dramatic
A.insPulse = (lt, swoon = 0, thumbs = 0) => {
  A.bokeh(lt, ['90,230,130', '255,170,60', '80,165,255'], ['#0c1a22', '#143040']);
  // bedsheet with folds
  ctx.fillStyle = grad(0, 760, 0, H, [[0, '#5fa6ae'], [1, '#3d7e88']]); ctx.fillRect(-100, 760, W + 200, H);
  ctx.strokeStyle = 'rgba(20,60,70,.35)'; ctx.lineWidth = 10; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-60, 840 + i * 110); ctx.bezierCurveTo(300, 780 + i * 110, 700, 900 + i * 110, 1140, 830 + i * 110); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 6; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-60, 826 + i * 110); ctx.bezierCurveTo(300, 766 + i * 110, 700, 886 + i * 110, 1140, 816 + i * 110); ctx.stroke(); }
  // the monitor: NO SIGNAL
  const mx = 640, my = 250, mw = 360, mh = 260, fl = Math.sin(lt * 7) > -.1 ? 1 : .3;
  plate(mx, my, mw, mh, 30, '#2a3038', '#14181e'); ctx.fillStyle = '#031a0e'; rr(mx + 22, my + 22, mw - 44, mh - 44, 14); ctx.fill();
  text('SpO2', mx + 62, my + 66, { size: 30, fill: '#5ae682', spacing: 2, align: 'left' });
  text('--', mx + mw - 54, my + 150, { size: 120, font: 'Bangers', weight: 400, fill: `rgba(90,230,130,${.4 + .6 * fl})`, align: 'right' });
  text('NO SIGNAL', mx + mw / 2, my + 214, { size: 30, fill: `rgba(255,110,110,${.4 + .6 * fl})`, spacing: 2 });
  V2.glow(mx + mw / 2, my + mh / 2, 360, '90,230,130', .22 * fl, 'screen', .5);
  for (let i = 0; i < 3; i++) A.ring(mx + mw / 2, my + mh / 2, ((lt * 1.4) - i * .33 + 3) % 1, 'pulse', { r0: 150, r1: 520, lw: 7, alpha: .5 });
  // a hand resting on the sheet, giving a thumbs-up when asked about the finger
  const hx = 300, hy = 1130;
  shadow(hx + 10, hy + 90, 200, 40, .35);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.14); ctx.scale(5, 5);
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-90, 18); ctx.lineTo(-30, 8); ctx.stroke();
  V2C.hand(thumbs > .5 ? 'thumb' : 'fist', 1, {}); ctx.restore();
  // the probe, lying beside the hand with its cable
  const px = 700, py = 1180 + 8 * swoon;
  shadow(px, py + 92, 210, 36, .4);
  ctx.strokeStyle = '#2a2f36'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + 90, py + 20); ctx.bezierCurveTo(px + 300, py - 80, px + 420, py + 160, px + 520, py + 40); ctx.stroke();
  ctx.save(); ctx.translate(px, py); ctx.rotate(-.18 - .22 * swoon);
  plate(-150, -64, 300, 128, 50, '#d8dde4', '#98a2ae'); ctx.fillStyle = '#2a2f36'; rr(-110, -20, 220, 40, 20); ctx.fill();
  const led = Math.sin(lt * 10) > 0 ? '#ff3030' : '#601010'; ctx.fillStyle = led; ell(98, -4, 11, 11); ctx.fill(); V2.emit(px + 98, py - 4, 60, '255,48,48', .5);
  // a face: closed eyes, a frown, a hand to the forehead
  ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 46, -34, 15, .15 * PI, .85 * PI, true); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 54, 22, 1.15 * PI, 1.85 * PI); ctx.stroke();
  if (swoon > .05) { ctx.strokeStyle = '#2a2f36'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-96, 20); ctx.quadraticCurveTo(-130, -40 - 20 * swoon, -62, -74); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(-56, -78, 17, 15); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  if (swoon > .5) text('...ahh', 780, py - 150, { size: 54, fill: '#cfe9ff', italic: true, alpha: seg(swoon, .5, .9), weight: 800 });
};

// ---------------------------------------------------------------- the clock above the exit: three twenty
A.insClock = (lt, alarm = 1, tick = 0) => {
  A.bokeh(lt, ['255,70,70', '255,170,60'], ['#1a0f14', '#2a1620']);
  const cx = 540, cy = 860, r = 330;
  shadow(cx + 14, cy + r + 40, r * .9, 54, .5);
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 18; ell(cx, cy, r, r); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, r - 24, PI * 1.05, PI * 1.55); ctx.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = big ? 10 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * (r - 28), cy - Math.cos(a) * (r - 28)); ctx.lineTo(cx + Math.sin(a) * (r - (big ? 62 : 44)), cy - Math.cos(a) * (r - (big ? 62 : 44))); ctx.stroke(); }
  for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU; text(String(i), cx + Math.sin(a) * (r - 100), cy - Math.cos(a) * (r - 100) + 4, { size: 58, fill: '#2a2530', font: 'Bangers', weight: 400 }); }
  const mins = 20 + tick * 0, secs = Math.floor(lt * 1) % 60;
  ctx.lineCap = 'round'; ctx.strokeStyle = '#2a2530';
  ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin((3 + mins / 60) / 12 * TAU) * r * .5, cy - Math.cos((3 + mins / 60) / 12 * TAU) * r * .5); ctx.stroke();
  ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(mins / 60 * TAU) * r * .78, cy - Math.cos(mins / 60 * TAU) * r * .78); ctx.stroke();
  const sa = secs / 60 * TAU + Math.sin(lt * 20) * .01; ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - Math.sin(sa) * 60, cy + Math.cos(sa) * 60); ctx.lineTo(cx + Math.sin(sa) * r * .86, cy - Math.cos(sa) * r * .86); ctx.stroke();
  ctx.fillStyle = '#c1121f'; ell(cx, cy, 20, 20); ctx.fill();
  const fl = alarm ? (Math.sin(lt * 8) > 0 ? 1 : .2) : 0;
  V2.glow(cx, cy, 900, '255,50,50', .22 * fl, 'screen', .4);
  A.tag(cx, 1340, 'door', 'EXIT DOOR  3:20', alarm, {});
};

// ---------------------------------------------------------------- the smoke detector, from below
A.insDetector = (lt, o = {}) => {
  const { led = 1, open = 0, nobatt = 0 } = o;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d7d8dc'); g.addColorStop(1, '#a9abb4'); ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200);
  ctx.strokeStyle = 'rgba(60,60,70,.18)'; ctx.lineWidth = 3; for (let x = -200; x < W + 200; x += 260) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 80; y < H; y += 260) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const cx = 540, cy = 760, r = 330;
  shadow(cx + 10, cy + r * .1 + 20, r * 1.15, r * .9, .25);
  ctx.fillStyle = grad(cx - r, cy - r, cx + r, cy + r, [[0, '#ffffff'], [1, '#c8ccd3']]); ctx.strokeStyle = 'rgba(40,40,50,.7)'; ctx.lineWidth = 8; ell(cx, cy, r, r); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,60,70,.45)'; ctx.lineWidth = 6; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * .46, cy + Math.sin(a) * r * .46); ctx.lineTo(cx + Math.cos(a) * r * .88, cy + Math.sin(a) * r * .88); ctx.stroke(); }
  ctx.fillStyle = '#e8ebf0'; ell(cx, cy, r * .3, r * .3); ctx.fill(); ctx.stroke();
  text('TEST', cx, cy + 4, { size: 40, fill: '#7a828c', spacing: 4 });
  const on = led > 0 ? (Math.sin(lt * 12) > .3 ? led : led * .1) : 0;
  ctx.fillStyle = on > .05 ? `rgba(255,50,50,${.3 + .7 * on})` : '#4a1a1a'; ell(cx + r * .62, cy - r * .5, 22, 22); ctx.fill(); V2.glow(cx + r * .62, cy - r * .5, 150, '255,60,60', .8 * on, 'screen', .8);
  if (on > .5) for (let i = 0; i < 3; i++) A.ring(cx + r * .62, cy - r * .5, (((lt * 1.2) - i * .3) % 1 + 1) % 1, 'chirp', { r0: 30, r1: 600, lw: 8, alpha: .6 });
  if (open > .01) {   // the cover swings open to show the battery bay
    ctx.save(); ctx.translate(cx, cy + r * .84); ctx.rotate(-open * .5);
    plate(-r * .5, 0, r, 150 * open + 4, 26, '#dfe3e8', '#b4bac2'); ctx.restore();
    plate(cx - 130, cy + r * .4, 260, 190, 18, '#2a2e36', '#14161c'); ctx.fillStyle = '#3a4552'; rr(cx - 108, cy + r * .4 + 22, 216, 146, 12); ctx.fill();
    ctx.strokeStyle = '#c93a3a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx - 70, cy + r * .4 + 22); ctx.quadraticCurveTo(cx - 40, cy + r * .4 - 30, cx - 10, cy + r * .4 + 22); ctx.stroke();
    if (nobatt) text('NO  BATTERY', cx, cy + r * .4 + 108, { size: 34, fill: '#ff7a7a', spacing: 2 });
  }
};

// ---------------------------------------------------------------- the 9V battery, being pulled
A.insBattery = (lt, k = 0) => {
  A.insDetector(lt, { led: 1 - k, open: 1, nobatt: 0 });
  const bx = 540, by = 1300 - 140 * easeOut(k) + 6 * Math.sin(lt * 30) * (1 - k);
  ctx.save(); ctx.translate(bx, by); ctx.rotate(-.12 * k);
  ctx.fillStyle = '#3b4552'; ctx.strokeStyle = INK; ctx.lineWidth = 8; rr(-110, -150, 220, 300, 20); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2f8fe0'; ctx.fillRect(-110, -70, 220, 120);
  ctx.fillStyle = '#d6dde6'; rr(-60, -204, 120, 60, 12); ctx.fill(); ctx.stroke(); ell(54, -178, 26, 22); ctx.fill(); ctx.stroke();
  text('9V', 0, 6, { size: 110, font: 'Bangers', weight: 400, fill: '#fff' });
  ctx.fillStyle = 'rgba(255,255,255,.3)'; rr(-92, -140, 22, 280, 10); ctx.fill();
  ctx.restore();
  // a gloved thumb and finger pinching it
  ctx.save(); ctx.translate(bx + 150, by - 20); ctx.rotate(-.5); ctx.scale(3.4, 3.4); V2C.hand('grip', 1, {}); ctx.restore();
  if (k > .6 && k < .95) V2.sparks(bx, by - 180, T, T - (k - .6) * 1.5, { n: 8, speed: 220, life: .35, size: 4 });
};

// ---------------------------------------------------------------- a stethoscope pressed to the wall, sound rings inside the plaster
A.insSteth = (lt, listening = 1) => {
  // plaster, lit from the upper left
  ctx.fillStyle = grad(0, 0, W, H, [[0, '#e6dcc6'], [1, '#a99c84']]); ctx.fillRect(-100, -100, W + 200, H + 200);
  ctx.strokeStyle = 'rgba(80,60,40,.06)'; ctx.lineWidth = 3; for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.moveTo(hash(i) * W, hash(i + 1) * H); ctx.lineTo(hash(i) * W + 70, hash(i + 1) * H + 24); ctx.stroke(); }
  const cx = 540, cy = 860, X0 = 70, Y0 = 520, WW = 940, HH = 760;
  // the wall cut open: studs, insulation, a copper pipe, a cable run
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; ctx.fillStyle = '#2a2230'; rr(X0, Y0, WW, HH, 40); ctx.fill(); ctx.restore();
  ctx.save(); rr(X0, Y0, WW, HH, 40); ctx.clip();
  ctx.fillStyle = grad(0, Y0, 0, Y0 + HH, [[0, '#4a3a44'], [1, '#2a2230']]); ctx.fillRect(X0, Y0, WW, HH);
  ctx.fillStyle = 'rgba(255,190,200,.16)'; for (let i = 0; i < 150; i++) { const x = X0 + hash(i) * WW, y = Y0 + hash(i + 31) * HH; ell(x, y, 14 + 12 * hash(i + 3), 5 + 4 * hash(i + 9), hash(i) * 3); ctx.fill(); }
  for (const x of [X0 + 70, X0 + WW / 2, X0 + WW - 70]) { ctx.fillStyle = grad(x - 34, 0, x + 34, 0, [[0, '#8a6638'], [.5, '#b98a52'], [1, '#7a5630']]); ctx.fillRect(x - 34, Y0, 68, HH); ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let g = 0; g < 8; g++) ctx.fillRect(x - 28 + hash(g + x) * 50, Y0 + 20 + g * 94, 3, 60); }
  const py = Y0 + HH - 170;
  ctx.strokeStyle = '#a8672e'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X0, py); ctx.lineTo(X0 + WW, py); ctx.stroke();
  ctx.strokeStyle = '#e8a766'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(X0, py - 9); ctx.lineTo(X0 + WW, py - 9); ctx.stroke();
  ctx.strokeStyle = '#17141c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(X0, Y0 + 150); ctx.bezierCurveTo(X0 + 300, Y0 + 70, X0 + 640, Y0 + 260, X0 + WW, Y0 + 130); ctx.stroke();
  // sounds from all over the building, drifting along the pipe and the cable to the listener
  const cols = ['255,170,40', '80,165,255', '90,230,130', '255,205,70', '255,70,70', '255,255,255'];
  for (let i = 0; i < 18; i++) {
    const k = (((lt * .35) + hash(i + 2)) % 1 + 1) % 1, onPipe = i % 2, sx = onPipe ? (i % 4 < 2 ? X0 + 20 : X0 + WW - 20) : (i % 4 < 2 ? X0 + 20 : X0 + WW - 20);
    const x = lerp(sx, cx + 230, easeIn(k)), y = onPipe ? lerp(py, cy + 60, easeIn(k)) : lerp(Y0 + 150 + 30 * Math.sin(i), cy + 60, easeIn(k));
    ctx.fillStyle = `rgba(${cols[i % 6]},${.9 * Math.sin(k * Math.PI)})`; ctx.beginPath(); ctx.arc(x, y, 9 + 5 * (1 - k), 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 3; rr(X0 + 2, Y0 + 2, WW - 4, HH - 4, 38); ctx.stroke();
  for (let i = 0; i < 5; i++) { const k = (((lt * .9) - i * .2) % 1 + 1) % 1; A.ring(cx + 230, cy + 60, k, 'chirp', { r0: 30, r1: 560, lw: 8, alpha: .5 * (1 - k) * listening }); }
  // the stethoscope: a chrome chest piece pressed to the plaster, its tube going up and out of the frame to the ears
  const hx = cx + 230, hy2 = cy + 60;
  ctx.save(); ctx.fillStyle = 'rgba(20,14,20,.34)'; ctx.beginPath(); ctx.ellipse(hx + 14, hy2 + 176, 150, 24, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#15121a'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy2 - 150); ctx.bezierCurveTo(hx, hy2 - 330, hx - 330, hy2 - 270, hx - 360, hy2 - 620); ctx.bezierCurveTo(hx - 380, hy2 - 780, hx - 260, hy2 - 900, hx - 300, hy2 - 1100); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(hx - 8, hy2 - 150); ctx.bezierCurveTo(hx - 8, hy2 - 330, hx - 338, hy2 - 270, hx - 368, hy2 - 620); ctx.stroke();
  ctx.fillStyle = grad(hx - 40, hy2 - 200, hx + 40, hy2 - 130, [[0, '#d8dee6'], [1, '#7b8694']]); ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(hx - 34, hy2 - 190, 68, 70, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = grad(hx - 160, hy2 - 160, hx + 160, hy2 + 160, [[0, '#f2f5f8'], [.55, '#b6c0cc'], [1, '#6c7886']]); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(hx, hy2, 160, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8edf2'; ctx.strokeStyle = 'rgba(40,50,70,.55)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hx, hy2, 118, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(hx - 60, hy2 - 62, 34, 17, -.7); ctx.fill();
  ctx.strokeStyle = 'rgba(60,70,90,.25)'; ctx.lineWidth = 3; for (let r = 40; r < 118; r += 26) { ctx.beginPath(); ctx.arc(hx, hy2, r, 0, TAU); ctx.stroke(); }
};

// ---------------------------------------------------------------- a hearing aid that chirps
A.insHearing = (lt) => {
  A.bokeh(lt, ['155,220,60', '255,170,60'], ['#14230f', '#233a16']);
  // Lime's cheek, huge, with the temple of her readers running back to the ear
  const ex = 700, ey = 900;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = grad(120, ey - 640, ex, ey + 640, [[0, '#e4f79a'], [.55, '#a9d23a'], [1, '#6a9a1e']]); ctx.strokeStyle = 'rgba(25,40,10,.7)'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.ellipse(250, ey, 640, 760, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = 'rgba(40,70,10,.16)'; for (let i = 0; i < 34; i++) { ctx.beginPath(); ctx.ellipse(hash(i) * 560, ey - 560 + hash(i + 9) * 1120, 5 + 7 * hash(i + 3), 3 + 4 * hash(i + 5), .3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ell(210, ey - 330, 130, 64, -.3); ctx.fill();
  ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(30, ey - 200); ctx.bezierCurveTo(300, ey - 215, 520, ey - 235, ex - 30, ey - 215); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,170,.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(30, ey - 210); ctx.bezierCurveTo(300, ey - 225, 520, ey - 245, ex - 30, ey - 225); ctx.stroke();
  // the ear: outer rim, inner fold, canal
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = grad(ex - 150, ey - 250, ex + 150, ey + 250, [[0, '#f6cfa4'], [1, '#d99a64']]); ctx.strokeStyle = '#a8683a'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(ex + 40, ey, 160, 262, -.08, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(150,90,50,.7)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(ex + 52, ey + 6, 100, 190, -.08, 0.3, TAU - .3); ctx.stroke();
  ctx.fillStyle = '#7a4524'; ctx.beginPath(); ctx.ellipse(ex + 38, ey + 62, 40, 72, -.08, 0, TAU); ctx.fill();
  // the hearing aid hooked over the top of the ear, its tube running into the canal
  ctx.strokeStyle = 'rgba(235,240,245,.8)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(ex + 130, ey - 150); ctx.bezierCurveTo(ex + 140, ey - 20, ex + 110, ey + 20, ex + 60, ey + 52); ctx.stroke();
  ctx.fillStyle = grad(ex, ey - 330, ex + 220, ey - 100, [[0, '#f2e4cc'], [1, '#c9b08a']]); ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(ex - 30, ey - 232); ctx.bezierCurveTo(ex + 20, ey - 330, ex + 170, ey - 330, ex + 200, ey - 200); ctx.bezierCurveTo(ex + 215, ey - 140, ex + 170, ey - 110, ex + 130, ey - 150); ctx.bezierCurveTo(ex + 140, ey - 220, ex + 60, ey - 250, ex + 10, ey - 200); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(ex + 90, ey - 290, 52, 12, -.18); ctx.fill();
  const led = Math.sin(lt * 12) > .3, lx = ex + 138, ly = ey - 262;
  ctx.fillStyle = led ? '#ff3a3a' : '#601818'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(lx, ly, 15, 15); ctx.fill(); ctx.stroke();
  if (led) V2.glow(lx, ly, 200, '255,58,58', .85, 'screen', .7);
  for (let i = 0; i < 4; i++) A.ring(lx, ly, (((lt * 1.6) - i * .25) % 1 + 1) % 1, 'chirp', { r0: 22, r1: 520, lw: 8, alpha: .65 });
};

// ---------------------------------------------------------------- UI cards
// the floor plan: rooms, the long hall, each alarm a pulsing dot, with a route drawn between them
A.mapCard = (lt, o = {}) => {
  const { appear = 1, route = null, dots = [], pos = null } = o;
  if (appear <= 0) return;
  const x0 = 60, y0 = 470, w = 960, h = 860, a = clamp(appear * 2);
  ctx.save(); ctx.globalAlpha *= a;
  const s = lerp(.92, 1, easeOut(clamp(appear * 1.4))); ctx.translate(540, y0 + h / 2); ctx.scale(s, s); ctx.translate(-540, -(y0 + h / 2));
  reg('overlay', [x0, y0, x0 + w, y0 + h], { id: 'map-card' });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 12; ctx.fillStyle = 'rgba(8,12,34,.94)'; rr(x0, y0, w, h, 36); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(120,170,255,.6)'; ctx.lineWidth = 4; rr(x0, y0, w, h, 36); ctx.stroke();
  ctx.save(); ctx.beginPath(); rr(x0, y0, w, h, 36); ctx.clip(); ctx.strokeStyle = 'rgba(120,170,255,.07)'; ctx.lineWidth = 2;
  for (let gx = x0; gx <= x0 + w; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx, y0 + h); ctx.stroke(); }
  for (let gy = y0; gy <= y0 + h; gy += 60) { ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + w, gy); ctx.stroke(); }
  ctx.restore();
  text('FRUIT BOWL  -  FLOOR PLAN', x0 + 40, y0 + 56, { size: 36, fill: '#c4d4e8', align: 'left', spacing: 3, weight: 900 });
  text('WEST WING', x0 + w - 40, y0 + 56, { size: 26, fill: '#7f96b4', align: 'right', spacing: 4 });
  // plan: a long central hall with rooms on both sides
  const hx0 = x0 + 70, hx1 = x0 + w - 70, hy = y0 + h / 2 + 30, hh = 90;
  ctx.fillStyle = 'rgba(80,110,170,.16)'; ctx.strokeStyle = 'rgba(150,190,255,.55)'; ctx.lineWidth = 3; ctx.fillRect(hx0, hy - hh / 2, hx1 - hx0, hh); ctx.strokeRect(hx0, hy - hh / 2, hx1 - hx0, hh);
  const rooms = [];
  const hot = d => dots.find(q => Math.abs(q.x - d[0]) < 20 && Math.abs(q.y - d[1]) < 20);
  for (let i = 0; i < 8; i++) { const rx = hx0 + 10 + i * 108, tp = [rx + 48, hy - hh / 2 - 100], bt = [rx + 48, hy + hh / 2 + 100];
    rooms.push([...tp, String(2 + i * 2)]); rooms.push([...bt, String(1 + i * 2)]);
    for (const [pt, ry0] of [[tp, hy - hh / 2 - 190], [bt, hy + hh / 2]]) { const dq = hot(pt); if (dq) { ctx.fillStyle = `rgba(${A.ALARM[dq.kind].rgb},${.12 + .06 * Math.sin(lt * 6 + i)})`; ctx.fillRect(rx, ry0, 96, 190); } ctx.strokeRect(rx, ry0, 96, 190); } }
  for (const [rx, ry, n] of rooms) text(n, rx, ry + (ry < hy ? -56 : 56), { size: 30, fill: 'rgba(190,212,240,.9)', spacing: 1, weight: 900 });
  ctx.fillStyle = 'rgba(150,190,255,.28)'; for (let i = 0; i < 9; i++) { const ax = hx0 + 60 + i * 90; ctx.beginPath(); ctx.moveTo(ax, hy - 16); ctx.lineTo(ax + 22, hy); ctx.lineTo(ax, hy + 16); ctx.lineTo(ax + 8, hy); ctx.closePath(); ctx.fill(); }
  // legend
  { const lg = [['chair', 'CHAIR'], ['pump', 'PUMP'], ['pulse', 'PULSE OX'], ['bed', 'BED'], ['door', 'DOOR'], ['call', 'CALL']]; let lx = x0 + 50; const ly = y0 + h - 56;
    for (const [kd, nm] of lg) { ctx.fillStyle = `rgb(${A.ALARM[kd].rgb})`; ctx.beginPath(); ctx.arc(lx, ly, 10, 0, TAU); ctx.fill(); text(nm, lx + 20, ly + 2, { size: 24, fill: '#9fb3c8', align: 'left', spacing: 1 }); lx += 20 + nm.length * 15.5 + 34; } }
  ctx.fillStyle = 'rgba(255,200,90,.18)'; ctx.fillRect(hx1 - 120, hy - hh / 2 - 190, 120, 190); text('BREAK', hx1 - 60, hy - hh / 2 - 36, { size: 22, fill: '#ffd88a', spacing: 2 });
  // route
  if (route && route.length > 1) {
    ctx.strokeStyle = 'rgba(120,255,170,.9)'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.setLineDash([22, 12]); ctx.lineDashOffset = -lt * 60; ctx.beginPath(); route.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
  }
  // alarm dots
  for (const d of dots) {
    const al = A.ALARM[d.kind], r = 11 + 4 * Math.sin(lt * 7 + d.x);
    for (let i = 0; i < 2; i++) ctx.beginPath(), ctx.strokeStyle = `rgba(${al.rgb},${.6 * (1 - ((lt * 1.2 + i * .5 + d.x) % 1))})`, ctx.lineWidth = 4, ctx.arc(d.x, d.y, 14 + ((lt * 1.2 + i * .5 + d.x) % 1) * 34, 0, TAU), ctx.stroke();
    ctx.fillStyle = `rgb(${al.rgb})`; ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, TAU); ctx.fill();
  }
  if (pos) { ctx.fillStyle = '#ff3b55'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(pos[0], pos[1], 20, 0, TAU); ctx.fill(); ctx.stroke(); text('N', pos[0], pos[1] + 2, { size: 22, fill: '#fff' }); }
  ctx.restore();
  return { hx0, hx1, hy, hh };
};
// the library of known alarms: 31 tiles, then the unknown 32nd
A.libraryCard = (lt, o = {}) => {
  const { appear = 1, checked = 31, unknown = 0 } = o;
  if (appear <= 0) return;
  const x0 = 60, y0 = 400, w = 960, h = 1000, a = clamp(appear * 2);
  ctx.save(); ctx.globalAlpha *= a;
  const s = lerp(.92, 1, easeOut(clamp(appear * 1.4))); ctx.translate(540, y0 + h / 2); ctx.scale(s, s); ctx.translate(-540, -(y0 + h / 2));
  reg('overlay', [x0, y0, x0 + w, y0 + h], { id: 'library-card' });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 12; ctx.fillStyle = 'rgba(8,12,34,.94)'; rr(x0, y0, w, h, 36); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = unknown > 0 ? 'rgba(255,90,90,.85)' : 'rgba(120,170,255,.6)'; ctx.lineWidth = 4; rr(x0, y0, w, h, 36); ctx.stroke();
  text('KNOWN ALARMS', x0 + 40, y0 + 56, { size: 32, fill: '#9fb3c8', align: 'left', spacing: 3 });
  text(`${Math.min(checked, 31)} / 31 IDENTIFIED`, x0 + w - 40, y0 + 56, { size: 30, fill: '#5ae682', align: 'right', spacing: 2 });
  const kinds = ['chair', 'pump', 'pulse', 'bed', 'door', 'call'], cols = 6, tw = 128, gap = 20, gx = x0 + (w - (cols * tw + (cols - 1) * gap)) / 2;
  for (let i = 0; i < 31; i++) {
    const c = i % cols, r = Math.floor(i / cols), tx = gx + c * (tw + gap), ty = y0 + 110 + r * (tw + gap), al = A.ALARM[kinds[i % kinds.length]];
    const k = easeBack(seg(lt - (o.t0 ?? 0), i * .03, i * .03 + .25)); if (k <= 0) continue;
    ctx.save(); ctx.translate(tx + tw / 2, ty + tw / 2); ctx.scale(k, k);
    ctx.fillStyle = `rgba(${al.rgb},.16)`; rr(-tw / 2, -tw / 2, tw, tw, 22); ctx.fill(); ctx.strokeStyle = `rgba(${al.rgb},.85)`; ctx.lineWidth = 3.5; rr(-tw / 2, -tw / 2, tw, tw, 22); ctx.stroke();
    ctx.fillStyle = `rgb(${al.rgb})`; const g = i % 5;
    if (g === 0) { ctx.beginPath(); ctx.moveTo(-26, 18); ctx.quadraticCurveTo(-26, -26, 0, -26); ctx.quadraticCurveTo(26, -26, 26, 18); ctx.closePath(); ctx.fill(); ctx.fillRect(-32, 16, 64, 7); }
    else if (g === 1) { ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(34, 14, 0, 30); ctx.quadraticCurveTo(-34, 14, 0, -30); ctx.fill(); }
    else if (g === 2) { ctx.lineWidth = 6; ctx.strokeStyle = `rgb(${al.rgb})`; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-16, 0); ctx.lineTo(-8, -24); ctx.lineTo(6, 26); ctx.lineTo(14, 0); ctx.lineTo(34, 0); ctx.stroke(); }
    else if (g === 3) { ctx.fillRect(-26, -8, 52, 24); ctx.fillRect(-26, -22, 12, 14); ctx.fillRect(-26, 16, 6, 12); ctx.fillRect(20, 16, 6, 12); }
    else { ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill(); ctx.fillStyle = '#0b1030'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); }
    if (i < checked) { ctx.fillStyle = '#5ae682'; ell(tw / 2 - 20, -tw / 2 + 20, 15, 15); ctx.fill(); ctx.strokeStyle = '#06210f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tw / 2 - 27, -tw / 2 + 20); ctx.lineTo(tw / 2 - 21, -tw / 2 + 27); ctx.lineTo(tw / 2 - 12, -tw / 2 + 14); ctx.stroke(); }
    ctx.restore();
  }
  if (unknown > 0) {
    const k = easeBack(clamp(unknown)), tx = gx + ((31) % cols) * (tw + gap), ty = y0 + 110 + Math.floor(31 / cols) * (tw + gap), fl = Math.sin(lt * 14) > 0 ? 1 : .55;
    ctx.save(); ctx.translate(tx + tw / 2, ty + tw / 2); ctx.scale(k, k);
    ctx.fillStyle = `rgba(255,70,70,${.22 * fl})`; rr(-tw / 2, -tw / 2, tw, tw, 22); ctx.fill(); ctx.strokeStyle = `rgba(255,90,90,${.95 * fl})`; ctx.lineWidth = 5; rr(-tw / 2, -tw / 2, tw, tw, 22); ctx.stroke();
    text('?', 0, 6, { size: 120, font: 'Bangers', weight: 400, fill: `rgba(255,110,110,${fl})` });
    ctx.restore();
    text('#32  UNKNOWN', x0 + 40, y0 + h - 58, { size: 34, fill: `rgba(255,120,120,${fl})`, align: 'left', spacing: 3 });
  }
  ctx.restore();
};
})();
