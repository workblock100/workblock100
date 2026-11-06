'use strict';
/* SHIFT HAPPENS, Episode 3: The Holiday Schedule
 *
 * Uses the panel-layout kit in engine.js (key band, overlay band, character band);
 * `node render.js audit` checks every frame against that layout contract. */
(() => {
if (!window.TIMELINE_EP3) return;

const cherry = o => Object.assign({ kind: 'cherry', id: 'cherry', who: 'cherry', s: SC, y: G, expr: 'happy', acc: ['sunglassesHead', 'lei'] }, o);
const fig = o => Object.assign({ kind: 'fig', id: 'fig', who: 'sched', s: 1.2, center: true, noLegs: true, noBob: true, expr: 'smug',
  acc: ['suit', 'rose', 'fedora'], suitColor: '#18181e', lapelColor: '#0b0b0e', tieColor: '#101014' }, o);
const pine = o => Object.assign({ kind: 'pine', id: 'pine', who: 'pine', s: 1.3, y: G, acc: ['sunglassesHead'], hold: { r: 'purse' } }, o);
const EP3_LABEL = 'EPISODE 3: THE HOLIDAY SCHEDULE';

// scene-local start time of each word of a line
// ------------------------------------------------------------------ station, holiday edition
function bulletin3(mode) {
  paper2(150, 300, 176, 216, -.04, '#fff');
  text('EMPLOYEE OF', 0, -80, { size: 20, fill: INK }); text('THE MONTH', 0, -58, { size: 20, fill: INK });
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 5; ctx.strokeRect(-58, -40, 116, 128);
  ctx.save(); ctx.beginPath(); ctx.rect(-56, -38, 112, 124); ctx.clip(); ctx.fillStyle = '#ffe9ef'; ctx.fillRect(-56, -38, 112, 124);
  jamJar(0, 84, .25, { noReg: true, label: false, eyes: 'open', lid: 1 }); ctx.restore();
  ctx.restore();
  memorial(352, 282, 'GARY', -.05);
  if (mode === 'oct') {
    paper2(256, 462, 380, 84, .02, '#fff27a');
    text('HOLIDAY REQUESTS:', -60, 1, { size: 24, fill: INK });
    ctx.save(); ctx.translate(118, 1); ctx.rotate(-.08); ctx.strokeStyle = '#d62828'; ctx.lineWidth = 4; ctx.strokeRect(-58, -17, 116, 34); text('CLOSED', 0, 1, { size: 22, fill: '#d62828' }); ctx.restore();
    ctx.restore();
  } else if (mode === 'nye') {
    paper2(256, 462, 380, 84, -.02, '#1d2b53');
    text('HAPPY NEW YEAR!', 0, 3, { size: 44, font: 'Bangers', weight: 400, fill: '#ffe135', spacing: 3 });
    ctx.restore();
  } else {
    paper2(150, 462, 176, 84, -.03, '#c1121f');
    text('HAPPY', 0, -14, { size: 22, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 }); text('HOLIDAYS! -MGMT', 0, 14, { size: 17, fill: '#ffe7a0' });
    ctx.restore();
    ctx.save(); ctx.translate(352, 470); ctx.rotate(.04);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6; ctx.fillStyle = '#2b2233'; ctx.fillRect(-80, -38, 160, 76); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#e8193a'; ell(0, -30, 5, 5); ctx.fill();
    ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 3; ell(-44, -12, 16, 5); ctx.stroke();
    ctx.fillStyle = '#b3001f'; rr(-58, -6, 28, 34, 5); ctx.fill();
    text('R.I.P. DORIS', 22, 10, { size: 21, font: 'Bangers', weight: 400, fill: '#fff6c2', spacing: 1 });
    ctx.restore();
  }
}
const HOLIDAYS = ['THANKSGIVING', 'CHRISTMAS EVE', 'CHRISTMAS', "NEW YEAR'S EVE", "NEW YEAR'S DAY"];
const HOLIDAYS27 = ["NEW YEAR'S DAY", 'EASTER', 'MEMORIAL DAY', 'JULY 4TH', 'LABOR DAY', 'THANKSGIVING', 'CHRISTMAS'];
function boardSchedule(year, rows) {
  boardFace();
  ctx.fillStyle = '#d62828'; ctx.fillRect(BX0, BY0, BX1 - BX0, 52);
  text(`HOLIDAY SCHEDULE ${year}`, 824, BY0 + 27, { size: 28, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 });
  const h = (BY1 - BY0 - 64) / rows.length;
  rows.forEach((r, i) => {
    const y = BY0 + 60 + h * (i + .5);
    text(r, 640, y, { size: Math.min(22, h * .52), fill: '#1f3b8f', align: 'left', weight: 900 });
    text('STRAWBERRY', 1010, y, { size: Math.min(21, h * .5), fill: '#d62828', align: 'right', weight: 900 });
    if (i) { ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(636, y - h / 2, 376, 2); }
  });
}
function newBurst(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(.2 + Math.sin(T * 3) * .05);
  ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rr0 = i % 2 ? r * .7 : r; ctx.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  text('NEW!', 0, 2, { size: r * .55, font: 'Bangers', weight: 400, fill: '#d62828' });
  ctx.restore();
}
// 40 call lights; lit 0..40 switch on in a fixed shuffled order, xmas alternates red and green.
function garland() {
  const pins = [30, 256, 472, 540, 608, 824, 1050];
  for (let i = 0; i < pins.length - 1; i++) {
    const a = pins[i], b = pins[i + 1];
    for (let k = 0; k <= 16; k++) {
      const u = k / 16, x = lerp(a, b, u), y = 160 + Math.sin(u * PI) * 12;
      ctx.fillStyle = k % 2 ? '#1e6b34' : '#2a8a45'; ell(x, y, 16, 11, u * 2); ctx.fill();
    }
    ctx.fillStyle = ['#d62828', '#ffd60a', '#2a6fdb'][i % 3]; ctx.strokeStyle = INK; ctx.lineWidth = 2; ell(a, 168, 10, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(a - 3, 165, 3, 3); ctx.fill();
  }
}
function counterLights(frantic) {
  ctx.strokeStyle = '#1e3a22'; ctx.lineWidth = 3; ctx.beginPath();
  for (let x = -20; x <= 1100; x += 10) ctx.lineTo(x, 948 + Math.sin(x * .045) * 9);
  ctx.stroke();
  const cols = ['#ff3b55', '#ffd60a', '#2bd45a', '#4aa3ff'];
  for (let i = 0; i < 28; i++) {
    const x = 10 + i * 40, y = 948 + Math.sin(x * .045) * 9 + 12;
    const on = frantic ? Math.sin(T * 14 + i * 2.1) > 0 : Math.sin(T * 2 + i * 1.3) > -.6;
    ctx.fillStyle = on ? cols[i % 4] : '#3a3a3a'; ell(x, y, 6, 9); ctx.fill();
  }
}
function miniTree(x, y, lit) {
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - 8, y - 22, 16, 22);
  ctx.fillStyle = '#b3001f'; rr(x - 26, y - 12, 52, 14, 3); ctx.fill();
  for (let i = 0; i < 3; i++) {
    const w = 70 - i * 18, top = y - 22 - (i + 1) * 40;
    ctx.fillStyle = i % 2 ? '#1f7a3a' : '#2a8f45'; ctx.strokeStyle = '#0f3d1d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - w, top + 52); ctx.lineTo(x, top - 6); ctx.lineTo(x + w, top + 52); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for (let i = 0; i < 9; i++) { const on = lit ? Math.sin(T * (lit > 1 ? 14 : 3) + i) > -.3 : false; ctx.fillStyle = on ? ['#ff3b55', '#ffd60a', '#4aa3ff'][i % 3] : '#8a8a8a'; ell(x + (hash(i) - .5) * 80 * (1 - i / 12), y - 50 - i * 12, 5, 5); ctx.fill(); }
  ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = '#8a6d00'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 7 : 16; ctx.lineTo(x + Math.cos(a) * r, y - 158 + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
}
function streamers() {
  const cols = ['#ff3b55', '#ffd60a', '#2a6fdb', '#2bd45a'];
  [490, 590, 20, 1060].forEach((x, i) => {
    ctx.strokeStyle = cols[i]; ctx.lineWidth = 7; ctx.beginPath();
    for (let y = 150; y < 150 + (i < 2 ? 34 : 300); y += 6) ctx.lineTo(x + Math.sin(y * .12 + T * 2 + i) * 7, y);
    ctx.stroke();
  });
}
function balloons(x, y) {
  [['#ff3b55', -40, -250], ['#ffd60a', 10, -290], ['#2a6fdb', 40, -220]].forEach(([c, dx, dy], i) => {
    const bx = x + dx + Math.sin(T * 1.2 + i) * 6, by = y + dy + Math.cos(T * 1.4 + i) * 5;
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * .5, y - 100, bx, by + 50); ctx.stroke();
    ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(bx, by, 40, 50); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(bx - 14, by - 18, 9, 14, -.4); ctx.fill();
  });
}
function station3(o) {
  bgStation2();
  if (o.night) nightShade();
  stationClock(o.clock);
  bulletin3(o.bulletin || 'oct');
  if (o.board === 'sched') { boardSchedule(2026, HOLIDAYS); newBurst(990, 222, 34); }
  else if (o.board === 'sched27') { boardSchedule(2027, HOLIDAYS27); newBurst(990, 222, 34); }
  else if (o.board === 'calls') callPanel(o.lit || 0, o.deco === 'xmas');
  else staffNumbers();
  if (o.keyBoard) regKey('board', 608, 168, 1040, 522);
  if (o.keyClock) regKey('clock', 480, 184, 600, 304);
  if (o.deco === 'xmas') { garland(); miniTree(1000, 938, o.frantic ? 2 : 1); counterLights(o.frantic); }
  if (o.deco === 'nye') { streamers(); balloons(1010, 938); }
}

// ------------------------------------------------------------------ the big schedule (close-up)
function bigSchedule(lt, rowOn, circle) {
  const x0 = 70, y0 = 160, x1 = 1010, y1 = 812;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#fffef8'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
  ctx.fillStyle = 'rgba(40,80,160,.08)'; for (let y = y0 + 40; y < y1; y += 34) ctx.fillRect(x0, y, x1 - x0, 2);
  for (const x of [x0 + 40, x1 - 40]) { ctx.fillStyle = '#d62828'; ell(x, y0 + 22, 11, 11); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(x - 3, y0 + 18, 4, 4); ctx.fill(); }
  text('HOLIDAY SCHEDULE 2026', 540, y0 + 62, { size: 60, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 3 });
  text('3-11 SHIFT  ·  POSTED OCT 1  ·  NO SWAPS', 540, y0 + 110, { size: 24, fill: '#555', italic: true, weight: 800 });
  const cy = [y0 + 160, 0], colS = 612, colC = 870;
  text('HOLIDAY', 100, cy[0], { size: 26, fill: '#1f3b8f', align: 'left' });
  text('STRAWBERRY', colS, cy[0], { size: 26, fill: '#1f3b8f' });
  text('CHERRY', colC, cy[0], { size: 26, fill: '#1f3b8f' });
  ctx.fillStyle = '#1f3b8f'; ctx.fillRect(90, cy[0] + 22, 900, 4);
  HOLIDAYS.forEach((h, i) => {
    const y = y0 + 222 + i * 74;
    const hl = rowOn[i] || 0;
    if (hl > 0) { ctx.fillStyle = 'rgba(255,230,0,.55)'; ctx.fillRect(86, y - 28, 908 * easeOut(hl), 56); }
    text(h, 100, y, { size: 32, fill: INK, align: 'left' });
    text(i === 4 ? 'DOUBLE' : 'WORKING', colS, y + 2, { size: 44, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 });
    text('OFF', colC - 18, y + 2, { size: 44, font: 'Bangers', weight: 400, fill: '#2a9d4a', spacing: 2 });
    palm(colC + 42, y + 20, .55);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(90, y + 36, 900, 2);
  });
  text("AGENCY: unavailable (it's a holiday)", 540, y1 - 30, { size: 24, fill: '#777', italic: true, weight: 800 });
  if (circle > 0) {
    ctx.save(); ctx.strokeStyle = '#e8193a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(colS, y0 + 370, 150, 216, -.03, -PI / 2, -PI / 2 + TAU * easeOut(circle)); ctx.stroke(); ctx.restore();
  }
  regKey('schedule', x0, y0, x1, y1);
}
function palm(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -30, 0, -60); ctx.stroke();
  for (const a of [-1.3, -.5, .3, 1.1]) leaf(0, -60, a, 40, 12, '#2a9d4a');
  ctx.restore();
}

// ------------------------------------------------------------------ other sets
const FALL = {
  key: 'fall', sky: ['#ff8a5c', '#ffd9a8'], sun: '#fff1c9', grass: '#9aa83f', bush: ['#c8512a', '#e38b2c'],
  behind() {
    for (const [x, s] of [[70, 1.1], [1010, 1.2]]) {
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 14 * s, 700, 28 * s, 680);
      ['#d9622b', '#f2a33a', '#c0392b', '#e8851f'].forEach((c, i) => { ctx.fillStyle = c; ell(x + (i - 1.5) * 50 * s, 640 - (i % 2) * 70, 130 * s, 110 * s); ctx.fill(); });
    }
  },
  front() {
    for (const [x, s] of [[330, 1], [380, .7], [720, .85]]) {
      ctx.fillStyle = '#f28c28'; ctx.strokeStyle = '#8a4a10'; ctx.lineWidth = 3;
      for (const dx of [-18, 0, 18]) { ell(x + dx * s, 1352 - 30 * s, 26 * s, 30 * s); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#4a7a2a'; ctx.fillRect(x - 4 * s, 1352 - 68 * s, 8 * s, 14 * s);
    }
  },
};
function fallingLeaves(lt, n = 26) {
  const cols = ['#e8851f', '#c0392b', '#f2c13a', '#d9622b'];
  for (let i = 0; i < n; i++) {
    const x = hash(i) * 1200 - 60 + Math.sin(T * 1.3 + i) * 50;
    const y = ((hash(i + 7) * 1700 + lt * (110 + hash(i + 3) * 90)) % 1700) - 120;
    ctx.save(); ctx.translate(x, y); ctx.rotate(T * (1 + hash(i + 5)) + i);
    leaf(0, 0, 0, 34 + hash(i + 2) * 16, 13, cols[i % 4], 'rgba(90,40,0,.6)');
    ctx.restore();
  }
}
function fallingPaper(x, y, rot, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8;
  ctx.fillStyle = '#fffef8'; ctx.fillRect(-80, -100, 160, 200); ctx.shadowColor = 'transparent';
  text('HOLIDAY', 0, -70, { size: 26, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 1 });
  text('SCHEDULE', 0, -42, { size: 26, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 1 });
  ctx.fillStyle = 'rgba(31,59,143,.35)'; for (let i = 0; i < 6; i++) ctx.fillRect(-60, -14 + i * 18, 120 - (i % 2) * 30, 6);
  ctx.restore();
}

function bgOffice() {
  cached('office3', () => {
    const g = ctx.createLinearGradient(0, 0, 0, 1260); g.addColorStop(0, '#3b2a24'); g.addColorStop(1, '#22160f');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1260 + PAD);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < W; x += 120) ctx.fillRect(x, 0, 6, 1260);
    ctx.fillStyle = '#2d1d15'; ctx.fillRect(-PAD, 940, W + PAD * 2, 18);
    floorPaint(1260, '#4a2a30', '#23121a');
    // window with blinds
    ctx.fillStyle = '#ffe7b0'; ctx.fillRect(60, 170, 380, 350);
    ctx.fillStyle = '#5a4030'; for (let y = 176; y < 520; y += 24) ctx.fillRect(60, y, 380, 15);
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 14; ctx.strokeRect(60, 170, 380, 350);
    // board frame
    ctx.fillStyle = '#6b4a2a'; rr(598, 164, 446, 362, 10); ctx.fill();
    ctx.fillStyle = '#f7f1e3'; ctx.fillRect(612, 178, 418, 334);
    ctx.fillStyle = '#6b1d2a'; ctx.fillRect(612, 178, 418, 52);
    text('STAFFING', 821, 205, { size: 32, font: 'Bangers', weight: 400, fill: '#ffe7a0', spacing: 3 });
    text('OPEN SHIFTS', 712, 262, { size: 24, fill: '#6b1d2a' });
    text('312', 712, 340, { size: 100, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 });
    text('CALL-OUTS: 9', 712, 418, { size: 21, fill: INK });
    text('HOLIDAY REQUESTS:', 712, 456, { size: 16, fill: INK });
    ctx.save(); ctx.translate(712, 488); ctx.rotate(-.06); ctx.strokeStyle = '#d62828'; ctx.lineWidth = 4; ctx.strokeRect(-62, -16, 124, 32); text('DENIED', 0, 1, { size: 22, fill: '#d62828' }); ctx.restore();
    for (const [x, y, r, s1, s2] of [[905, 290, -.06, 'call out?', 'again??'], [915, 420, .05, 'hey :)', 'u up?']]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = '#fff176'; ctx.fillRect(-80, -52, 160, 104);
      text(s1, 0, -14, { size: 24, fill: '#2a3b8f', italic: true }); text(s2, 0, 20, { size: 22, fill: '#2a3b8f', italic: true }); ctx.restore();
    }
    // door (Strawberry comes in from the left)
    ctx.fillStyle = '#1a100b'; ctx.fillRect(-PAD, 600, 150 + PAD, 660);
    ctx.fillStyle = '#e8d2a0'; ctx.fillRect(-PAD, 600, 60 + PAD, 660);
    // framed photo + filing cabinet
    ctx.fillStyle = '#c9a227'; rr(210, 620, 150, 120, 6); ctx.fill(); ctx.fillStyle = '#2a2a33'; ctx.fillRect(222, 632, 126, 96);
    REG.suppress++; drawChar({ kind: 'cherry', x: 285, y: 690, s: .3, center: true, noLegs: true, noArms: true, expr: 'happy', t: 0, acc: ['sunglassesHead'] }); REG.suppress--;
    text('EMPLOYEE OF THE YEAR', 285, 758, { size: 13, fill: '#ffe7a0' });
    ctx.fillStyle = '#4a4f57'; rr(170, 860, 170, 380, 8); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#5c626b'; rr(180, 876 + i * 120, 150, 104, 6); ctx.fill(); ctx.fillStyle = '#c0c6cf'; rr(235, 916 + i * 120, 40, 12, 5); ctx.fill(); }
    text('CALL-OUTS', 255, 900, { size: 15, fill: '#e8e8e8' });
  });
}
function blindBeams() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const y = 180 + i * 48;
    ctx.fillStyle = 'rgba(255,220,150,.045)';
    ctx.beginPath(); ctx.moveTo(440, y); ctx.lineTo(440, y + 14); ctx.lineTo(1100, y + 560 + i * 20); ctx.lineTo(1100, y + 520 + i * 20); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function bossChair(x, y, back, sx) {
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(.02, sx), 1);
  ctx.fillStyle = back ? '#4a1620' : '#5a1d28'; ctx.strokeStyle = '#1a0508'; ctx.lineWidth = 6;
  rr(-150, -300, 300, 420, [90, 90, 20, 20]); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { ell(-90 + c * 60 + (r % 2) * 30, -220 + r * 70, 6, 6); ctx.fill(); }
  if (!back) { ctx.fillStyle = '#6b2330'; rr(-190, -40, 60, 160, 20); ctx.fill(); ctx.stroke(); rr(130, -40, 60, 160, 20); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function desk(paperX) {
  const top = 1160;
  regLocal('fg', 430, top, 1080, STAGE_H, { id: 'desk' });
  regLocal('fg', 900, top - 92, 1024, top, { id: 'lamp' });
  regLocal('fg', 462, top - 64, 588, top, { id: 'desk-phone' });
  // lamp + phone + espresso sit on the desk top
  ctx.fillStyle = '#b08d2a'; ctx.fillRect(958, top - 60, 10, 60); rr(930, top - 8, 66, 10, 4); ctx.fill();
  ctx.fillStyle = '#1f6b3a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(900, top - 60); ctx.lineTo(1024, top - 60); ctx.lineTo(1004, top - 92); ctx.lineTo(920, top - 92); ctx.closePath(); ctx.fill(); ctx.stroke();
  const lg = ctx.createRadialGradient(962, top - 40, 10, 962, top, 180); lg.addColorStop(0, 'rgba(255,230,160,.45)'); lg.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = lg; ctx.fillRect(780, top - 60, 360, 200);
  ctx.fillStyle = '#16161a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; rr(470, top - 40, 110, 40, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e8e8'; ell(525, top - 22, 13, 13); ctx.fill(); ctx.fillStyle = '#16161a'; ell(525, top - 22, 5, 5); ctx.fill();
  ctx.fillStyle = '#16161a'; rr(462, top - 64, 126, 22, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(830, top - 30, 36, 30, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a2210'; ell(848, top - 27, 14, 4); ctx.fill();
  // desk body
  ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = '#2a160a'; ctx.lineWidth = 5; ctx.fillRect(430, top, 700, 34); ctx.strokeRect(430, top, 700, 34);
  const g = ctx.createLinearGradient(0, top + 34, 0, STAGE_H); g.addColorStop(0, '#5a321b'); g.addColorStop(1, '#3a1f10');
  ctx.fillStyle = g; ctx.fillRect(440, top + 34, 680, STAGE_H - top);
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4; for (const x of [470, 790]) ctx.strokeRect(x, top + 70, 290, 180);
  ctx.fillStyle = '#16161a'; rr(640, top + 96, 240, 50, 6); ctx.fill();
  text('THE SCHEDULER', 760, top + 122, { size: 24, font: 'Bangers', weight: 400, fill: '#e8c56a', spacing: 2 });
  if (paperX != null) {
    ctx.save(); ctx.translate(paperX, top + 12); ctx.rotate(-.08); ctx.fillStyle = '#fffef8'; ctx.strokeStyle = '#999'; ctx.lineWidth = 2; ctx.fillRect(-60, -14, 120, 28); ctx.strokeRect(-60, -14, 120, 28);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-48, -6, 70, 4); ctx.fillRect(-48, 3, 90, 4); ctx.restore();
  }
}

function bgDining() {
  cached('dining3', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1240); g.addColorStop(0, '#f6e3c6'); g.addColorStop(1, '#ebcfa6');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1340 + PAD);
    ceiling('#f5efe6');
    ctx.fillStyle = '#c98f5a'; ctx.fillRect(-PAD, 960, W + PAD * 2, 280);
    ctx.fillStyle = '#a8703f'; ctx.fillRect(-PAD, 948, W + PAD * 2, 18);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 90) ctx.fillRect(x, 966, 5, 274);
    floorPaint(1240, '#d9c7a8', '#b09a78');
    // window (autumn outside)
    const wx = 690, wy = 450, ww = 320, wh = 330;
    const sg = ctx.createLinearGradient(0, wy, 0, wy + wh); sg.addColorStop(0, '#ffb07a'); sg.addColorStop(1, '#ffe0b0');
    ctx.fillStyle = sg; ctx.fillRect(wx, wy, ww, wh);
    ['#d9622b', '#f2a33a', '#c0392b'].forEach((c, i) => { ctx.fillStyle = c; ell(wx + 60 + i * 110, wy + wh - 60, 80, 70); ctx.fill(); });
    ctx.strokeStyle = '#f6f6f2'; ctx.lineWidth = 16; ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    // hand turkeys (resident crafts)
    [[150, 560, '#ff8a3d', -.1], [330, 610, '#8e44ad', .08], [520, 560, '#2a9d8f', -.05]].forEach(([x, y, c, r]) => handTurkey(x, y, c, r));
  });
}
function handTurkey(x, y, col, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#fffef8'; ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 6; ctx.fillRect(-70, -80, 140, 160); ctx.shadowColor = 'transparent';
  ['#e63946', '#f4a300', '#2a9d4a', '#2a6fdb'].forEach((c, i) => { ctx.fillStyle = c; ctx.save(); ctx.translate(-6, 8); ctx.rotate(-1.1 + i * .55); rr(-9, -64, 18, 56, 9); ctx.fill(); ctx.restore(); });
  ctx.fillStyle = col; ell(-6, 16, 30, 34); ctx.fill();
  ctx.fillStyle = col; ell(28, 0, 12, 16); ctx.fill();
  ctx.fillStyle = '#fff'; ell(30, -4, 4, 4); ctx.fill(); ctx.fillStyle = INK; ell(31, -4, 2, 2); ctx.fill();
  ctx.fillStyle = '#f4a300'; ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(48, 4); ctx.lineTo(38, 7); ctx.fill();
  text('Thankful!', 0, 64, { size: 16, fill: '#555', italic: true });
  ctx.restore();
}
function dinnerTable(dorisWobble, halo) {
  const top = 1150;
  regLocal('fg', 480, top - 16, 1080, STAGE_H, { id: 'table' });
  regLocal('fg', 566, top - 122, 674, top, { id: 'doris' });
  // plate: turkey + mash
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#999'; ctx.lineWidth = 3; ell(840, top + 6, 90, 20); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c98a4a'; ell(815, top - 2, 36, 14); ctx.fill(); ctx.fillStyle = '#fbf2dc'; ell(866, top - 4, 28, 14); ctx.fill();
  // Doris (a can-shaped cranberry sauce) on her own little plate
  ctx.fillStyle = '#fff'; ell(620, top + 6, 76, 15); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(620, top + 2);
  const w = 1.3 * (1 + dorisWobble * .08 * Math.sin(T * 40)), h = 1.3 * (1 - dorisWobble * .06 * Math.sin(T * 40));
  ctx.scale(w, h);
  ctx.fillStyle = '#9b0f35'; ctx.strokeStyle = '#4a0014'; ctx.lineWidth = 3; rr(-34, -84, 68, 84, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c21a48'; ell(0, -84, 34, 9); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,0,10,.45)'; ctx.lineWidth = 3; for (const y of [-62, -40, -18]) { ctx.beginPath(); ctx.moveTo(-34, y); ctx.lineTo(34, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-24, -76, 10, 64, 5); ctx.fill();
  ctx.strokeStyle = '#2a0008'; ctx.lineWidth = 3; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 12, -50, 6, .2, PI - .2); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, -36, 7, .3, PI - .3); ctx.stroke();
  ctx.restore();
  if (halo > 0) { ctx.save(); ctx.globalAlpha = halo; ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 6; ell(620, top - 136 - Math.sin(T * 3) * 4, 34, 9); ctx.stroke(); ctx.restore(); }
  // table + cloth
  ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#8a6a48'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(480, top + 22); ctx.lineTo(1100, top + 22); ctx.lineTo(1100, STAGE_H + 10); ctx.lineTo(470, STAGE_H + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8851f'; ctx.fillRect(480, top + 22, 620, 40);
  ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 500; x < 1100; x += 60) ctx.fillRect(x, top + 62, 30, STAGE_H - top);
  ctx.fillStyle = '#b3541a'; for (let x = 490; x < 1100; x += 40) { ell(x, top + 64, 8, 6); ctx.fill(); }
}

// ------------------------------------------------------------------ overlays
// Tear-off calendar that flips from October to the holiday; full-stage, used as a montage transition.
function dateCard(lt, pages, name, bg) {
  const d = B('date'), q = seg(lt, d.s, d.e - .1), out = seg(lt, d.e - .08, d.e + .2);
  if (lt > d.e + .2) return;
  reg('overlay', [0, 0, W, STAGE_H], { id: 'datecard', full: true });
  ctx.save(); ctx.globalAlpha = 1 - out;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, STAGE_H);
  for (let i = 0; i < 16; i++) { ctx.fillStyle = `rgba(255,255,255,${.05 + .03 * (i % 2)})`; ctx.beginPath(); ctx.moveTo(540, 740); const a0 = i / 16 * TAU + T * .4; ctx.lineTo(540 + Math.cos(a0) * 1600, 740 + Math.sin(a0) * 1600); ctx.lineTo(540 + Math.cos(a0 + .2) * 1600, 740 + Math.sin(a0 + .2) * 1600); ctx.fill(); }
  const n = pages.length, f = seg(q, 0, .5) * (n - 1), idx = Math.min(n - 1, Math.floor(f)), frac = f - idx;
  const page = ([mon, day], x, y, rot, a) => {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; ctx.fillStyle = '#fffef8'; rr(-250, -280, 500, 560, 22); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#d62828'; rr(-250, -280, 500, 130, [22, 22, 0, 0]); ctx.fill();
    text(mon, 0, -212, { size: 84, font: 'Bangers', weight: 400, fill: '#fff', spacing: 6 });
    text(String(day), 0, 20, { size: 250, font: 'Bangers', weight: 400, fill: INK });
    ctx.fillStyle = '#555'; for (const x0 of [-150, -50, 50, 150]) { ell(x0, -262, 12, 12); ctx.fill(); }
    ctx.restore();
  };
  const cy = 720;
  if (idx < n - 1) { page(pages[idx + 1], 540, cy, 0, 1); REG.suppress++; page(pages[idx], 540 - frac * 700, cy - frac * 900, -frac * .9, 1 - frac * .8); REG.suppress--; }
  else page(pages[n - 1], 540, cy, 0, 1);
  const final = seg(q, .5, .75);
  if (final > 0) {
    const s = lerp(1.5, 1, easeOut(final));
    ctx.save(); ctx.translate(540, 1150); ctx.scale(s, s); ctx.rotate(-.04);
    text(name, 0, 0, { size: 110, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 16, stroke: '#1d0a00', spacing: 4, alpha: clamp(final * 3) });
    ctx.restore();
  }
  ctx.restore();
}
function slamNum(p, str, cx = 740, cy = (OV + OV_B) / 2) {
  if (p <= 0) return;
  const s = lerp(1.7, 1, easeOut(clamp(p * 1.6)));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  regLocal('overlay', -110, -118, 110, 118, { id: 'count' });
  text(str, 0, 8, { size: 230, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 20, stroke: '#1d0a2a', alpha: clamp(p * 4) * (1 - seg(p, .8, 1)) });
  ctx.restore();
}
function penReveal(lt, up, rot) {
  if (up <= 0) return;
  const x = lerp(690, 540, easeOut(up)), y = lerp(1040, 660, easeOut(up));
  const settled = up >= 1;
  if (settled) reg('overlay', [425, 528, 655, 800], { id: 'pen-reveal' });
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + T * .6; ctx.fillStyle = 'rgba(255,240,170,.12)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 175 * up, a, a + .18); ctx.closePath(); ctx.fill(); }
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 170 * up); g.addColorStop(0, 'rgba(255,250,200,.8)'); g.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = g; ctx.fillRect(-175, -175, 350, 350);
  ctx.restore();
  ctx.rotate(-.6 + rot); ctx.scale(lerp(.5, 1.35, up), lerp(.5, 1.35, up));
  ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-16, -110, 32, 170, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9d2dc'; rr(-16, 60, 32, 26, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#444'; ctx.beginPath(); ctx.moveTo(-8, 86); ctx.lineTo(8, 86); ctx.lineTo(0, 106); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9d2dc'; rr(10, -104, 10, 90, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; rr(-12, -40, 24, 60, 4); ctx.fill();
  ctx.save(); ctx.translate(0, -10); ctx.rotate(-PI / 2); text('FRUIT BOWL', 0, 0, { size: 11, fill: '#d62828' }); ctx.restore();
  ctx.restore();
  for (let i = 0; i < 6; i++) { const a = T * 2 + i * 1.3, r = 150 + 20 * Math.sin(T * 3 + i); ctx.fillStyle = `rgba(255,255,220,${.5 + .5 * Math.sin(T * 7 + i)})`; ell(x + Math.cos(a) * r, y + Math.sin(a) * r * .7, 4, 4); ctx.fill(); }
}
function fightCloud(x, y, t, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  const step = Math.floor(t * 7);
  for (let i = 0; i < 7; i++) { const q = (t * 1.1 + i / 7) % 1; ctx.fillStyle = `rgba(225,212,188,${.7 * (1 - q)})`; ell(x + (i - 3) * 90 + (hash(i) - .5) * 40, y + 150 - q * 40, 60 + q * 70, 30 + q * 20); ctx.fill(); }
  for (let i = 0; i < 18; i++) {
    const a0 = i / 18 * TAU + t * 1.5, r = 200 + 34 * Math.sin(t * 9 + i);
    ctx.fillStyle = i % 2 ? '#f5eddc' : '#e6dcc6'; ctx.strokeStyle = 'rgba(120,100,70,.35)'; ctx.lineWidth = 3;
    ell(x + Math.cos(a0) * r, y + Math.sin(a0) * r * .52, 104 + 22 * Math.sin(t * 7 + i), 76 + 16 * Math.cos(t * 8 + i)); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#efe6d2'; ell(x, y, 250, 142); ctx.fill();
  for (let i = 0; i < 7; i++) {
    const ang = hash(step + i * 7) * TAU, len = 210 + 60 * hash(i + step * 3);
    const bx = x + Math.cos(ang) * 120, by = y + Math.sin(ang) * 70, ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len * .6;
    ctx.strokeStyle = LIMB; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
    if (i % 3 === 0) { ctx.fillStyle = '#fff'; ell(ex, ey, 17, 17); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = i % 3 === 1 ? '#f7f7fb' : '#ffffff'; ell(ex + Math.cos(ang) * 8, ey, 27, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = i % 3 === 1 ? '#ff8fb1' : '#ff5f7e'; ctx.beginPath(); ctx.ellipse(ex + Math.cos(ang) * 8, ey + 5, 25, 6, 0, 0, PI); ctx.fill(); }
  }
  const words = ['POW!', 'BAM!', 'MINE!', 'OOF!', 'MY XMAS!'];
  const wd = words[step % 5];
  ctx.save(); ctx.translate(x + (hash(step) - .5) * 160, y + (hash(step + 1) - .5) * 70); ctx.rotate((hash(step + 2) - .5) * .5);
  text(wd, 0, 0, { size: 78, font: 'Bangers', weight: 400, fill: '#ff3b55', lw: 11, stroke: INK, spacing: 2 }); ctx.restore();
  for (let i = 0; i < 5; i++) { const q = (t * 1.3 + i / 5) % 1, sx = x + (hash(i + 11) - .5) * 440, sy = y - 110 - q * 120; ctx.fillStyle = `rgba(255,225,53,${1 - q})`; ctx.beginPath(); for (let j = 0; j < 10; j++) { const aa = -PI / 2 + j * PI / 5, rr0 = j % 2 ? 9 : 22; ctx.lineTo(sx + Math.cos(aa) * rr0, sy + Math.sin(aa) * rr0); } ctx.fill(); }
  ctx.restore();
  regLocal('fg', x - 300, y - 200, x + 300, y + 190, { id: 'fight' });
}
function textThread(lt, msgs) {
  // msgs: [side ('in' | 'out'), text, at]
  const shown = msgs.filter(m => lt >= m[2]);
  if (!shown.length) return;
  const x = 70, y = 60, w = 940;
  let h = 110;
  ctx.font = '800 36px Nunito';
  const lay = shown.map(([side, str, at]) => { const tw = Math.min(640, ctx.measureText(str).width); const bh = 76; const r = { side, str, at, tw, bh, y: y + h }; h += bh + 18; return r; });
  h += 10;
  reg('overlay', [x, y, x + w, y + h], { id: 'texts' });
  ctx.save();
  ctx.fillStyle = 'rgba(248,248,252,.97)'; rr(x, y, w, h, 34); ctx.fill();
  ctx.fillStyle = '#8e4a7e'; ell(x + 60, y + 54, 32, 32); ctx.fill();
  REG.suppress++; drawChar({ kind: 'fig', x: x + 60, y: y + 60, s: .22, center: true, noLegs: true, noArms: true, expr: 'smug', t: T, acc: ['fedora'] }); REG.suppress--;
  text('STAFFING', x + 110, y + 44, { size: 32, fill: '#111', align: 'left' });
  text('Today 3:00 AM', x + 110, y + 78, { size: 22, fill: '#888', align: 'left', weight: 700 });
  for (const m of lay) {
    const pop = easeBack(seg(lt, m.at, m.at + .25));
    const bw = m.tw + 56, bx = m.side === 'in' ? x + 30 : x + w - 30 - bw;
    ctx.save(); ctx.translate(bx + (m.side === 'in' ? 0 : bw), m.y + m.bh / 2); ctx.scale(pop, pop); ctx.translate(-(m.side === 'in' ? 0 : bw), -m.bh / 2);
    ctx.fillStyle = m.side === 'in' ? '#e5e5ea' : '#2a7cf6'; rr(0, 0, bw, m.bh, 36); ctx.fill();
    text(m.str, bw / 2, m.bh / 2 + 1, { size: 36, fill: m.side === 'in' ? '#111' : '#fff', weight: 800, maxW: 640 });
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ scenes
const SCENES = {
  title: {
    cam(lt) { const p = easeIO(seg(lt, 0, CUR.dur)); CAM.z = 1.02 + .05 * p; CAM.y = 740 + 30 * p; },
    draw(lt) {
      bgExterior(FALL); exteriorDyn();
      fallingLeaves(lt);
      const n1 = B('n1'), n2 = B('n2'), p = seg(lt, n1.s - .4, n2.e);
      if (p > 0) fallingPaper(lerp(540, 250, easeOut(p)) + Math.sin(lt * 2.4) * 190 * (1 - p), lerp(-160, 1330, easeIn(p) * .4 + p * .6), Math.sin(lt * 3.1) * .6 * (1 - p) + p * 1.35, 1);
    },
    over(lt) {
      const n2 = B('n2'), p = seg(lt, n2.e - .15, n2.e + .15);
      if (p > 0) logo2(540, 300, lerp(1.06, .82, easeOut(p)) * (1 + .012 * Math.sin(lt * 6)), clamp(p * 3), EP3_LABEL, labelWidth(EP3_LABEL));
    },
  },

  posted: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const l1 = B('l1'), ru = B('rush');
      station3({ clock: '3:00', board: 'sched', bulletin: 'oct', keyBoard: true });
      const fighting = lt > ru.s + .3;
      drawChar(lemon({ x: 230, hold: {}, expr: fighting ? 'shock' : 'neutral', look: fighting ? [.9, 0] : [.7, -.7],
        arms: lt < l1.e + .1 ? { l: 'rest', r: 'cheer' } : fighting ? { l: 'down', r: 'down' } : { l: 'rest', r: 'rest' }, acc: fighting ? ['readers', 'lanyard', 'sweat'] : ['readers', 'lanyard'] }));
      if (!fighting) {
        const run = t0 => easeIn(seg(lt, t0, ru.s + .32));
        const pc = run(ru.s), ps = run(ru.s + .06);
        if (pc > 0) { drawChar(cherry({ who: null, x: lerp(1330, 800, pc), transit: true, walk: lt * 30, expr: 'angry', look: [-.9, 0], arms: { l: 'run', r: 'run' }, rot: -.15 })); speedLines(lerp(1330, 800, pc) + 420, 1150, 300, .8); }
        if (ps > 0) drawChar(straw({ who: null, x: lerp(1460, 790, ps), transit: true, walk: lt * 30, expr: 'angry', look: [-.9, 0], arms: { l: 'run', r: 'run' }, rot: -.15 }));
      } else {
        fightCloud(780, 1150, lt, 1);
        for (let i = 0; i < 3; i++) {
          const q = seg(lt, ru.s + .6 + i * .45, ru.s + 1.3 + i * .45);
          if (q > 0 && q < 1) { ctx.save(); ctx.translate(790 + (i - 1) * 260 * q, 1100 - Math.sin(q * PI) * 380); ctx.rotate(q * 8); ctx.globalAlpha = 1 - seg(q, .8, 1);
            if (i === 0) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-30, -18, 60, 30, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8193a'; ctx.fillRect(-4, -14, 8, 22); ctx.fillRect(-11, -7, 22, 8); }
            else if (i === 1) { ctx.fillStyle = '#ff5fa2'; for (let p2 = 0; p2 < 5; p2++) { ell(Math.cos(p2 * 1.26) * 10, Math.sin(p2 * 1.26) * 10, 9, 9); ctx.fill(); } }
            else { ctx.strokeStyle = '#2f3a4a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 22, .3, PI * 1.7); ctx.stroke(); ctx.fillStyle = '#c9d2dc'; ell(20, 12, 10, 10); ctx.fill(); }
            ctx.restore(); }
        }
      }
    },
    over() {},
  },

  board: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const s1 = B('s1'), s2 = B('s2'), l1 = B('l1'), s3 = B('s3');
      bgStation2();
      const wt = wordTimes('s1'), starts = [0, 1, 3, 4, 7].map(i => wt[i] ?? 99);
      const rowOn = starts.map(t => seg(lt, t - .05, t + .3));
      bigSchedule(lt, rowOn, seg(lt, s2.s + .1, s2.e + .2));
      const reading = lt < s1.e + .1, panic = lt > s2.s && lt < l1.s, argue = lt > s3.s && lt < s3.e + .3;
      drawChar(straw({ x: 250, look: reading ? [.6, -1] : [.8, 0], expr: panic ? 'panic' : argue ? 'angry' : lt > l1.s ? 'dead' : 'neutral',
        arms: panic ? { l: 'up', r: 'up' } : argue ? { l: 'flail', r: 'flail' } : { l: 'rest', r: 'rest' }, shake: panic ? 2 : 0, acc: panic ? [...STRAW_ACC, 'sweat'] : STRAW_ACC }));
      drawChar(lemon({ x: 830, hold: {}, look: [-.8, 0], expr: lt > l1.s ? 'chill' : 'sour', arms: lt > l1.s ? { l: 'shrug', r: 'shrug' } : { l: 'hips', r: 'hips' } }));
    },
    over() {},
  },

  cherry: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const en = B('enter'), c1 = B('c1'), s1 = B('s1'), c2 = B('c2');
      station3({ clock: '3:02', board: 'sched', bulletin: 'oct' });
      drawChar(straw({ x: 250, look: [.8, 0], expr: lt > s1.s ? 'angry' : lt > c1.s + .8 ? 'shock' : 'neutral', arms: lt > s1.s && lt < s1.e + .3 ? { l: 'shrug', r: 'shrug' } : { l: 'rest', r: 'rest' } }));
      const inP = easeOut(seg(lt, en.s, en.e)), outP = easeIn(seg(lt, c2.e, c2.e + .35));
      const x = lerp(1400, 750, inP) + 760 * outP;
      if (outP < 1) {
        if (inP < 1) speedLines(x + 380, 1150, 420, 1 - inP);
        if (outP > 0) speedLines(x - 60, 1150, 500, 1 - outP);
        drawChar(cherry({ x, transit: inP < 1 || outP > 0, walk: inP < 1 || outP > 0 ? lt * 30 : null, look: [-.8, 0], rot: outP * .2,
          hold: { r: 'suitcase' }, arms: { l: lt > c2.s ? 'wave' : lt > c1.s ? 'thumb' : 'rest', r: [.35, .1] } }));
      }
      const dp = seg(lt, c2.e, c2.e + .8);
      if (dp > 0 && dp < 1) { ctx.fillStyle = `rgba(230,220,200,${.8 * (1 - dp)})`; for (let i = 0; i < 6; i++) { ell(750 + (i - 2.5) * 50 * (1 + dp), G - 20 - hash(i) * 60 * dp, 40 + 50 * dp, 30 + 30 * dp); ctx.fill(); } }
    },
    over(lt) {
      const c1 = B('c1');
      card(seg(lt, c1.s + 1.3, c1.s + 1.6), 'HOLIDAY REQUEST', [['SUBMITTED', 'Jan 1, 12:01 AM'], ['FOR', 'Every. Single. Holiday.'], ['DESTINATION', 'Aruba']], '#c2003a');
    },
  },

  office: {
    cam(lt) { const f1 = B('f1'), z = easeIO(seg(lt, f1.s, f1.e)); CAM.z = 1 + .04 * z; CAM.x = lerp(540, 580, z); },
    draw(lt) {
      const en = B('enter'), f1 = B('f1'), s1 = B('s1'), f2 = B('f2'), of = B('offer'), s2 = B('s2'), f3 = B('f3');
      bgOffice();
      regKey('open-shifts', 598, 164, 1044, 526);
      blindBeams();
      const spin = seg(lt, en.s + .95, en.s + 1.4), turned = spin >= .5;
      const sx = Math.abs(Math.cos(spin * PI));
      bossChair(700, 1040, !turned, sx);
      if (turned) drawChar(fig({ x: 700, y: 1012, sx: spin < 1 ? sx : 1, transit: spin < 1, look: lt > f1.s ? [-.8, 0] : [-.4, 0],
        expr: lt > f3.s ? 'smug' : lt > s2.s ? 'grumpy' : 'smug', arms: lt > f2.s && lt < of.e ? { l: [1.2, .4], r: 'rest' } : { l: 'rest', r: [1.1, 1.3 + .2 * Math.sin(lt * 3)] } }));
      const slide = seg(lt, of.s, of.s + .5);
      desk(slide > 0 ? lerp(700, 520, easeOut(slide)) : null);
      const walk = easeOut(seg(lt, en.s, en.s + .9));
      drawChar(straw({ x: lerp(-160, 250, walk), transit: walk < 1, walk: walk < 1 ? lt * 16 : null, look: [.8, lt < f1.s ? 0 : -.1],
        expr: lt > s2.s && lt < f3.s ? 'angry' : lt > f3.s + .2 ? 'dead' : lt > s1.s && lt < s1.e ? 'hopeful' : 'neutral',
        arms: lt > s1.s && lt < s1.e + .2 ? { l: [1.5, .9], r: [1.5, .9] } : lt > s2.s && lt < s2.e + .2 ? { l: 'hips', r: 'hips' } : { l: 'rest', r: 'rest' } }));
    },
    over(lt) {
      const of = B('offer');
      card(seg(lt, of.s + .3, of.s + .6), 'THE OFFER', [['CHRISTMAS', 'Off!'], ['IF YOU WORK', 'Black Friday + every weekend'], ['AND', "A double on New Year's"]], '#5a1d4a');
    },
  },

  pen: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const en = B('enter'), m1 = B('m1'), op = B('open'), s1 = B('s1'), m2 = B('m2');
      station3({ clock: '4:00', board: 'sched', bulletin: 'oct' });
      const pop = lt > op.s + 1.2;
      drawChar(straw({ x: 250, look: pop ? [.6, -.8] : [.8, 0], expr: lt > m2.s ? 'dead' : lt > s1.s ? 'sour' : pop ? 'shock' : lt > op.s ? 'hopeful' : 'neutral',
        arms: lt > op.s && !pop ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' } }));
      const mp = easeOut(seg(lt, en.s, en.e));
      drawChar(melon({ x: lerp(1350, 800, mp), transit: mp < 1, walk: mp < 1 ? lt * 14 : null, look: [-.8, pop ? -.6 : 0], hold: { l: 'gift' }, giftOpen: seg(lt, op.s + 1.15, op.s + 1.7),
        arms: { l: 'offer', r: lt > m2.s && lt < m2.e + .3 ? 'thumb' : lt > m1.s && lt < m1.e ? 'wave' : 'rest' } }));
    },
    over(lt) {
      const op = B('open');
      penReveal(lt, seg(lt, op.s + 1.2, op.s + 1.7), Math.sin(lt * 2) * .08);
    },
  },

  thanks: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const s1 = B('s1'), c1 = B('c1'), n1 = B('n1');
      bgDining();
      pennants(330, 174, 750, 'HAPPY', ['#e8851f', '#c0392b', '#f2c13a', '#8a5a2b'], 42);
      pennants(70, 282, 1010, 'THANKSGIVING', ['#c0392b', '#f2c13a', '#8a5a2b', '#e8851f'], 42);
      regKey('banner', 60, 168, 1020, 372);
      const frantic = lt > c1.s - .05 && lt < c1.e + .3;
      drawChar({ kind: 'cran', id: 'cran', who: 'cran', x: 820, y: 1010, s: 1.3, noLegs: true, center: true, noBob: true, expr: frantic ? 'panic' : lt > c1.e ? 'sad' : 'happy', look: frantic ? [-.9, .5] : [-.8, 0],
        acc: ['curlers', 'glasses', 'pearls'], arms: frantic ? { l: 'up', r: 'flail' } : { l: 'rest', r: 'rest' }, shake: frantic ? 3 : 0 });
      dinnerTable(frantic ? 1 : 0, seg(lt, n1.s, n1.s + .5));
      drawChar(straw({ x: 250, look: [.8, lt > s1.s && lt < s1.e ? .4 : 0], expr: lt > c1.s ? 'shock' : 'happy', arms: lt > s1.s && lt < s1.e ? { l: 'rest', r: 'offer' } : lt > c1.s ? { l: 'down', r: 'down' } : { l: 'rest', r: 'rest' } }));
    },
    over(lt) {
      const n1 = B('n1');
      stamp2(seg(lt, n1.s + .1, n1.s + .4), [['R.I.P. DORIS', 100, -28], ['SHE WAS JELLIED', 46, 60]], 660);
      dateCard(lt, [['OCT', 1], ['OCT', 18], ['NOV', 2], ['NOV', 14], ['NOV', 26]], 'THANKSGIVING', '#b8561f');
    },
  },

  xmas: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const d = B('date'), p1 = B('p1'), s1 = B('s1'), r1 = B('r1');
      station3({ clock: '3:00', board: 'calls', lit: 0, bulletin: 'xmas', deco: 'xmas' });
      drawChar(straw({ x: 210, look: [.8, 0], expr: lt > s1.s ? 'dead' : 'neutral', arms: { l: 'rest', r: 'rest' } }));
      wheelchair(500, G);
      drawChar({ kind: 'raisin', id: 'raisin', who: 'raisin', x: 522, y: 1148, s: 1.5, noLegs: true, center: true, noBob: true, acc: ['bun', 'glasses', 'santa'], look: lt > r1.s - .3 ? [-.2, -.3] : [.8, 0],
        expr: lt > r1.s - .2 ? 'weak' : 'neutral', arms: lt > r1.s && lt < r1.e ? { l: 'rest', r: [1.6 + .1 * Math.sin(lt * 5), .3] } : { l: 'rest', r: 'rest' } });
      const inP = easeOut(seg(lt, d.e - .3, p1.s + .5));
      const worried = lt > p1.s + 1.4;
      drawChar(pine({ x: lerp(1330, 800, inP), transit: inP < 1, walk: inP < 1 ? lt * 14 : null, flip: true, look: worried ? [-.9, .3] : [-.8, 0], hold: { l: 'purse' },
        expr: worried ? 'shock' : 'happy', arms: inP < 1 ? { l: [.25, .15], r: 'rest' } : worried ? { l: [.25, .15], r: 'point' } : { l: [.25, .15], r: 'wave' } }));
    },
    over(lt) { dateCard(lt, [['NOV', 26], ['DEC', 5], ['DEC', 14], ['DEC', 20], ['DEC', 25]], 'CHRISTMAS', '#1f6b3a'); },
  },

  quiet: {
    cam(lt) { const f = B('freeze'), l1 = B('l1'), z = easeIO(seg(lt, f.s, f.s + .5)) * (1 - easeIO(seg(lt, B('s1').e, B('s1').e + .3))); CAM.z = 1 + .03 * z; CAM.x = lerp(540, 470, z); const li = B('lights'); if (lt > li.s && lt < li.s + .5) CAM.shake = 8 * (1 - seg(lt, li.s, li.s + .5)); },
    draw(lt) {
      const en = B('enter'), m1 = B('m1'), fl = B('flash'), m2 = B('m2'), fr = B('freeze'), l1 = B('l1'), s1 = B('s1'), li = B('lights');
      const chaos = lt > li.s;
      station3({ clock: '3:30', board: 'calls', lit: 40 * easeIn(seg(lt, li.s, li.s + 1.4)), bulletin: 'xmas', deco: 'xmas', frantic: chaos, keyBoard: chaos });
      const posing = lt > m1.s + .6 && lt < m2.s;
      const frozen = lt > fr.s;
      drawChar(straw({ x: 220, look: frozen ? [.9, 0] : posing ? [.3, -.2] : [.8, 0], expr: chaos ? 'panic' : frozen ? 'shock' : posing ? 'happy' : 'neutral', twitch: posing,
        arms: chaos ? { l: 'up', r: 'up' } : posing ? { l: 'rest', r: 'thumb' } : { l: 'rest', r: 'rest' }, shake: chaos ? 3 : 0, acc: chaos ? [...STRAW_ACC, 'sweat'] : STRAW_ACC }));
      drawChar(lemon({ x: 510, hold: {}, look: frozen ? [.9, 0] : posing ? [.2, -.2] : [.8, 0], expr: chaos ? 'panic' : frozen ? 'dead' : posing ? 'happy' : 'sour',
        arms: chaos ? { l: 'flail', r: 'flail' } : posing ? { l: 'thumb', r: 'rest' } : { l: 'rest', r: 'rest' }, shake: chaos ? 3 : 0 }));
      const mIn = easeOut(seg(lt, en.s, en.e)), mOut = easeIn(seg(lt, m2.e, m2.e + .35));
      if (mOut < 1) {
        if (mOut > 0) speedLines(820 + 700 * mOut - 60, 1150, 500, 1 - mOut);
        drawChar(melon({ x: lerp(1350, 820, mIn) + 700 * mOut, transit: mIn < 1 || mOut > 0, walk: mIn < 1 || mOut > 0 ? lt * 16 : null, look: [-.8, 0], acc: ['suit', 'nametag', 'santa'],
          hold: lt < m2.s ? { r: 'cell' } : {}, arms: lt < m2.s ? { l: 'rest', r: [2.35, .75] } : { l: 'wave', r: 'rest' } }));
      }
    },
    over(lt) {
      const fl = B('flash'), fr = B('freeze'), s1 = B('s1'), li = B('lights'), n1 = B('n1');
      flash(seg(lt, fl.s + .05, fl.s + .5));
      if (lt > fr.s && lt < li.s) { ctx.fillStyle = 'rgba(40,50,90,.2)'; ctx.fillRect(0, 0, W, STAGE_H); }
      if (lt > li.s) { const a = .07 + .05 * Math.sin(T * 10); ctx.fillStyle = Math.sin(T * 5) > 0 ? `rgba(255,30,50,${a})` : `rgba(30,200,80,${a})`; ctx.fillRect(0, 0, W, STAGE_H); }
      card(seg(lt, n1.s + .2, n1.s + .5), 'INCIDENT REPORT', [['CALL LIGHTS', '40 of 40'], ['NURSES', '1'], ['CAUSE', 'The Q word']], '#d62828');
    },
  },

  nye: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const d = B('date'), co = B('count'), pp = B('pop'), s1 = B('s1'), rg = B('ring'), a1 = B('a1'), s2 = B('s2'), a2 = B('a2');
      const midnight = lt >= pp.s;
      station3({ clock: midnight ? '12:00' : '11:59', board: 'staff', bulletin: 'nye', deco: 'nye', night: true, keyClock: lt < pp.s + 1 });
      const ringing = lt > rg.s && lt < a1.s, onPhone = lt >= a1.s;
      deskPhone(700, 938, ringing, onPhone);
      confetti(lt, pp.s);
      const blow = seg(lt, pp.s + .15, pp.s + .5) * (1 - seg(lt, pp.s + .75, pp.s + 1.1));
      const hornUp = lt > pp.s + .05 && lt < pp.s + 1.15;
      drawChar(straw({ x: 360, acc: [...STRAW_ACC, 'partyhat'], look: ringing ? [.9, .3] : onPhone ? [.5, 0] : [.3, -.3],
        expr: lt > a2.s ? 'angry' : lt > s2.s ? 'dead' : onPhone ? 'sour' : ringing ? 'shock' : lt > s1.s ? 'dead' : lt > co.s ? 'neutral' : 'dead',
        hold: onPhone ? { r: 'handset' } : { r: 'horn' }, hornBlow: blow, arms: onPhone || hornUp ? { l: 'rest', r: 'phone' } : { l: 'rest', r: 'rest' } }));
      ctx.fillStyle = 'rgba(14,18,54,.14)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
    },
    over(lt) {
      const co = B('count'), pp = B('pop'), rg = B('ring'), a1 = B('a1'), s2 = B('s2');
      const wt = wordTimes('count');
      if (lt < pp.s) wt.forEach((t, i) => { if (lt >= t && lt < (wt[i + 1] ?? pp.s)) slamNum(seg(lt, t, t + .7), String(3 - i)); });
      banner2(seg(lt, pp.s, pp.s + .3) * (1 - seg(lt, rg.s - .3, rg.s - .02)), 'HAPPY NEW YEAR!', '#1d2b53', '#ffe135', 92);
      callCard(seg(lt, rg.s, rg.s + .3) * (1 - seg(lt, s2.e - .1, s2.e + .15)), 'DR. APPLE', lt > a1.s ? 'Returning your page (from Thanksgiving)' : 'Incoming call (12:00 AM)', '#e53935');
      stamp2(seg(lt, s2.e + .18, s2.e + .48), [['RESPONSE TIME', 58, -52], ['5 WEEKS', 116, 42]]);
      dateCard(lt, [['DEC', 25], ['DEC', 27], ['DEC', 29], ['DEC', 30], ['DEC', 31]], "NEW YEAR'S EVE", '#1b1f4a');
    },
    panelClock: lt => lt >= B('pop').s ? '12:00 AM' : '11:59 PM',
    panelLabel: lt => lt >= B('pop').s ? "NEW YEAR'S DAY" : "NEW YEAR'S EVE",
  },

  next: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const l1 = B('l1'), s1 = B('s1'), l2 = B('l2'), jr = B('jar');
      station3({ clock: '12:05', board: 'sched27', bulletin: 'nye', deco: 'nye', night: true, keyBoard: true });
      const into = seg(lt, jr.s, jr.s + .7);
      jamJar(540, G, .72, { lid: into < .6 ? 0 : easeOut(seg(into, .6, 1)) * .7 + (into >= 1 ? .3 : 0), eyes: into >= 1 ? 'dead' : null, level: into >= 1 ? 1 : .4, sub: 'employee of the month' });
      drawChar(lemon({ x: 860, hold: {}, look: [-.8, lt < l1.e ? -.5 : 0], expr: lt > l2.s ? 'chill' : 'happy', arms: lt < l1.e ? { l: 'rest', r: 'cheer' } : lt > l2.s ? { l: 'shrug', r: 'shrug' } : { l: 'rest', r: 'rest' } }));
      if (into < 1) {
        const inJ = into > 0;
        drawChar(straw({ x: lerp(220, 540, easeIO(into)), y: G - Math.sin(into * PI) * 320 + into * 40, s: SC * (1 - .55 * into), transit: inJ, rot: into * .5,
          acc: [...STRAW_ACC, 'partyhat'], expr: lt > s1.s ? 'dead' : 'shock', look: lt < l1.e ? [.7, -.6] : [.8, 0], arms: inJ ? { l: 'up', r: 'up' } : { l: 'down', r: 'down' } }));
      }
      ctx.fillStyle = 'rgba(14,18,54,.14)'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
    },
    over() {},
  },

  end: {
    cam() {},
    draw(lt) {
      const g = ctx.createLinearGradient(0, 0, 0, STAGE_H); g.addColorStop(0, '#0f3d24'); g.addColorStop(1, '#5a0f1f');
      ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
      for (let i = 0; i < 80; i++) { const x = hash(i) * W + Math.sin(T * .8 + i) * 30, y = ((hash(i + 9) * STAGE_H + lt * (60 + hash(i + 4) * 90)) % (STAGE_H + 60)) - 30; ctx.fillStyle = `rgba(255,255,255,${.5 + .5 * hash(i + 2)})`; ell(x, y, 3 + hash(i + 1) * 4, 3 + hash(i + 1) * 4); ctx.fill(); }
      const cast = [['fig', { acc: ['suit', 'fedora'], suitColor: '#18181e', lapelColor: '#0b0b0e', tieColor: '#101014' }], ['cherry', { acc: ['sunglassesHead', 'lei'] }], ['melon', { acc: ['suit', 'santa'] }], ['pine', { acc: ['sunglassesHead'] }], ['raisin', { acc: ['bun', 'glasses', 'santa'] }], ['cran', { acc: ['curlers'] }],
        ['lemon', { acc: ['readers'] }], ['blue', { acc: ['glasses', 'mustache', 'santa'], browColor: '#eee' }], ['apple', { acc: ['sunglasses'] }], ['banana', {}], ['kiwi', { acc: ['bouffant'], capColor: '#2a9d8f' }], ['gfruit', { acc: ['sunglasses'] }]];
      cast.forEach(([kind, extra], i) => {
        const row = i < 6 ? 0 : 1, col = i % 6;
        const x = 105 + col * 174, y = row ? 1440 : 1250;
        const hop = Math.abs(Math.sin(lt * 5 + i)) * 20, pop = easeBack(seg(lt, .8 + i * .07, 1.1 + i * .07));
        if (pop > 0) { REG.suppress++; drawChar(Object.assign({ kind, x, y: y - hop, s: .5 * pop, expr: 'happy', arms: { l: 'cheer', r: 'wave' }, t: lt + i }, extra)); REG.suppress--; }
      });
    },
    over(lt) {
      logo2(540, 330, easeBack(seg(lt, 0, .35)) * .74, 1, EP3_LABEL, labelWidth(EP3_LABEL));
      const lines = [['For every nurse working the holidays:', 34, '#fff', .9], ['"It\'s the rotation."', 44, '#ffe135', 1.3], ["Happy holidays. You're on the schedule.", 32, '#9fd8ff', 2.0], ['NEXT TIME: The New Grad', 36, '#ff8fa3', 2.7]];
      lines.forEach(([s, size, c, at], i) => text(s, 540, 640 + i * 62, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 8 }));
    },
    panelLabel: () => 'THANKS FOR WATCHING',
  },

  post: {
    cam(lt) { const f2 = B('f2'); const z = easeOut(seg(lt, f2.e + .1, f2.e + .4)); CAM.z = lerp(1, 1.3, z); CAM.x = lerp(540, 660, z); CAM.y = lerp(740, 900, z); CAM.shake = z * 6; },
    draw(lt) {
      const bz = B('buzz'), f2 = B('f2'), ra = B('rattle');
      bgBedroom();
      ctx.fillStyle = '#3a3566'; rr(40, 1180, 470, 230, 26); ctx.fill();
      ctx.fillStyle = '#5b4fa0'; ctx.strokeStyle = '#231c4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40, 1400); ctx.lineTo(40, 1200); ctx.quadraticCurveTo(250, 1160, 510, 1210); ctx.lineTo(510, 1400); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e9e4f5'; ell(160, 1180, 110, 40); ctx.fill();
      ctx.fillStyle = '#4a3b2a'; rr(560, 1160, 480, 250, 12); ctx.fill();
      ctx.fillStyle = '#3a2d20'; ctx.fillRect(560, 1160, 480, 18);
      const angry = lt > ra.s, rattle = angry ? Math.sin(lt * 70) * .04 : 0;
      jamJar(690, 1160, .68, { rot: rattle, eyes: lt < bz.s + .3 ? 'sleep' : angry ? 'open' : 'dead', sub: 'do not disturb', key: true });
      if (angry) { ctx.fillStyle = 'rgba(255,0,0,.18)'; rr(690 - 95, 1160 - 258, 190, 258, 26); ctx.fill(); for (let i = 0; i < 5; i++) { const q = (lt * 1.6 + i / 5) % 1; ctx.fillStyle = `rgba(255,255,255,${.6 * (1 - q)})`; ell(690 + (i % 2 ? 1 : -1) * (40 + q * 50), 820 - q * 160, 24 + q * 30, 18 + q * 24); ctx.fill(); } }
      const buzzing = lt > bz.s && lt < bz.e + .2, bzz = buzzing ? Math.sin(lt * 60) * 4 : 0;
      ctx.save(); ctx.translate(955 + bzz, 1150);
      if (buzzing) { const gl = ctx.createRadialGradient(0, 0, 10, 0, 0, 240); gl.addColorStop(0, 'rgba(120,200,255,.5)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = gl; ctx.fillRect(-240, -240, 480, 480); }
      ctx.fillStyle = '#111'; rr(-44, -18, 88, 30, 6); ctx.fill(); ctx.fillStyle = lt > bz.s ? '#7fd3ff' : '#223'; rr(-38, -14, 76, 22, 4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#111'; rr(900, 1052, 110, 60, 8); ctx.fill(); text('3:00', 955, 1083, { size: 40, fill: '#ff3030', font: 'Bangers', weight: 400 });
    },
    over(lt) {
      const f1 = B('f1'), s1 = B('s1'), f2 = B('f2'), ra = B('rattle');
      const wt = wordTimes('f1');
      if (lt < ra.s + .2) textThread(lt, [['in', 'hey :)', wt[0] ?? f1.s], ['in', 'any chance u can pick up christmas?', wt[3] ?? f1.s + 1], ['out', "i'm already working christmas", s1.s], ['in', "perfect so ur already there!! double? :)", f2.s]]);
      const f = seg(lt, CUR.dur - .7, CUR.dur);
      if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, STAGE_H); }
    },
  },
};

EPISODES[3] = { num: 3, title: 'Episode 3: The Holiday Schedule', TL: window.TIMELINE_EP3, SCENES, layout: 'panel', audio: 'build/ep3/audio.m4a' };
})();
