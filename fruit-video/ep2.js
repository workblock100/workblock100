'use strict';
/* SHIFT HAPPENS, Episode 2: Survey Says
 *
 * Layout contract for this episode (stage is 1080x1480, captions live in the panel below it):
 *   y 150-520   key band: signs and boards the jokes depend on (never covered)
 *   y 548-816   overlay band: cards, banners, stamps (never over a face or a key sign)
 *   y 830-1400  characters, feet on G = 1400
 * `node render.js audit` checks every frame against this contract. */
(() => {
if (!window.TIMELINE_EP2) return;
const G = 1400, SC = 1.35;
const OV = 548, OV_B = 816;
const STRAW_ACC = ['steth', 'badge', 'bandage'];
const KIWI_CAPS = ['#2a9d8f', '#7a3fb0', '#2a6fdb', '#e76f51', '#d4a017'];

const straw = o => Object.assign({ kind: 'straw', id: 'straw', who: 'straw', s: SC, y: G, acc: STRAW_ACC }, o);
const lemon = o => Object.assign({ kind: 'lemon', id: 'lemon', who: 'lemon', s: SC, y: G, acc: ['readers', 'lanyard'], hold: { l: 'clipboard' }, arms: { l: 'hold', r: 'rest' }, clipText: 'STAFFING', expr: 'sour' }, o);
const star = o => Object.assign({ kind: 'star', id: 'star', who: 'star', s: 1.15, y: G, acc: ['glasses', 'statecap'], hold: { l: 'clipboard', r: 'pen' }, arms: { l: 'hold', r: [.75, 1.25] }, clipText: 'STATE', expr: 'dead' }, o);
const melon = o => Object.assign({ kind: 'melon', id: 'melon', who: 'melon', s: 1.22, y: G, acc: ['suit', 'nametag'], tag: 'ADMINISTRATOR', expr: 'happy' }, o);
const kiwi = (i, o) => Object.assign({ kind: 'kiwi', id: 'kiwi' + i, who: 'kiwis', s: .95, y: G, acc: ['bouffant', 'agency'], capColor: KIWI_CAPS[i], expr: 'happy', seed: 40 + i * 9 }, o);
const gfruit = o => Object.assign({ kind: 'gfruit', id: 'gfruit', who: 'gfruit', s: .9, expr: 'smug', acc: ['sunglasses', 'chain'], hold: { r: 'yogurt' }, arms: { l: 'rest', r: 'hold' }, look: [-.6, 0] }, o);

// ------------------------------------------------------------------ overlay kit (screen space, all registered)
function card(p, title, rows, accent = '#2a9d4a', reveal = rows.length) {
  if (p <= 0) return;
  const w = 900, h = 84 + rows.length * 58 + 14, x = 90, y = OV + (OV_B - OV - h) / 2;
  reg('overlay', [x, y, x + w, y + h], { id: 'card:' + title });
  const a = clamp(p * 1.6), s = lerp(.94, 1, easeOut(clamp(p)));
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(540, y + h / 2); ctx.scale(s, s); ctx.translate(-540, -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#fffdf6'; rr(x, y, w, h, 22); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = accent; rr(x, y, w, 70, [22, 22, 0, 0]); ctx.fill();
  text(title, 540, y + 37, { size: 40, fill: '#fff', font: 'Bangers', weight: 400, spacing: 2 });
  rows.forEach(([k, v], i) => {
    const ry = y + 70 + 36 + i * 58, ra = i < reveal ? 1 : 0;
    if (!ra) return;
    text(k, x + 34, ry, { size: 27, fill: accent, align: 'left', weight: 900 });
    text(v, x + w - 34, ry, { size: 30, fill: INK, align: 'right', weight: 800, italic: true, maxW: 540 });
    if (i < rows.length - 1) { ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(x + 30, ry + 29, w - 60, 2); }
  });
  ctx.restore();
}
function banner2(p, str, bg = '#e8193a', fg = '#fff', size = 86, cy = (OV + OV_B) / 2) {
  if (p <= 0) return;
  ctx.font = `400 ${size}px Bangers`; ctx.letterSpacing = '3px';
  const w = Math.min(1000, ctx.measureText(str).width + 80); ctx.letterSpacing = '0px';
  const h = size * 1.45;
  reg('overlay', [540 - w / 2, cy - h / 2, 540 + w / 2, cy + h / 2], { id: 'banner:' + str });
  const s = lerp(.85, 1, easeBack(clamp(p)));
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(540, cy); ctx.scale(s, s);
  ctx.fillStyle = bg; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 8; rr(-w / 2, -h / 2, w, h, 20); ctx.fill(); ctx.stroke();
  text(str, 0, 4, { size, font: 'Bangers', weight: 400, fill: fg, spacing: 3, maxW: w - 50 });
  ctx.restore();
}
function stamp2(p, lines, cy = (OV + OV_B) / 2, rot = -.08) {
  if (p <= 0) return;
  const s = lerp(1.25, 1, easeOut(clamp(p * 2.2)));
  ctx.save(); ctx.translate(540, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 5);
  regLocal('overlay', -330, -112, 330, 112, { id: 'stamp:' + lines[0][0] });
  ctx.fillStyle = 'rgba(255,250,245,.92)'; rr(-330, -112, 660, 224, 20); ctx.fill();
  ctx.strokeStyle = '#d62828'; ctx.lineWidth = 12; rr(-330, -112, 660, 224, 20); ctx.stroke();
  ctx.lineWidth = 4; rr(-310, -94, 620, 188, 14); ctx.stroke();
  lines.forEach(([str, size, dy]) => text(str, 0, dy, { size, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 4, maxW: 580 }));
  ctx.restore();
}
function tag(x, y, str, bg, fg = '#fff', icon) {
  ctx.font = '900 30px Nunito';
  const w = ctx.measureText(str).width + 48 + (icon ? 44 : 0), h = 60;
  reg('overlay', [x, y, x + w, y + h], { id: 'tag:' + str });
  ctx.fillStyle = bg; rr(x, y, w, h, 14); ctx.fill();
  let tx = x + 24;
  if (icon === 'rew') { ctx.fillStyle = fg; for (const dx of [0, 18]) { ctx.beginPath(); ctx.moveTo(tx + dx + 16, y + 16); ctx.lineTo(tx + dx, y + 30); ctx.lineTo(tx + dx + 16, y + 44); ctx.fill(); } tx += 44; }
  if (icon === 'pause') { ctx.fillStyle = fg; ctx.fillRect(tx, y + 16, 9, 28); ctx.fillRect(tx + 17, y + 16, 9, 28); tx += 44; }
  text(str, tx, y + h / 2 + 1, { size: 30, fill: fg, align: 'left' });
}
function logo2(x, y, s, a = 1) {
  reg('overlay', [x - 470 * s, y - 196 * s, x + 470 * s, y + 262 * s], { id: 'logo' });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-.05); ctx.globalAlpha *= a;
  text('SHIFT', 0, -80, { size: 200, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 22, stroke: '#2a0010', spacing: 6, shadow: 20 });
  text('HAPPENS', 0, 90, { size: 200, font: 'Bangers', weight: 400, fill: '#ff3b55', lw: 22, stroke: '#2a0010', spacing: 6, shadow: 20 });
  ctx.fillStyle = '#15111a'; rr(-270, 190, 540, 64, 32); ctx.fill();
  text('EPISODE 2: SURVEY SAYS', 0, 223, { size: 36, fill: '#fff', spacing: 2 });
  ctx.restore();
}
function redWash(a) { ctx.fillStyle = `rgba(255,20,40,${a})`; ctx.fillRect(0, 0, W, STAGE_H); }

// ------------------------------------------------------------------ sets
function bgStation2() {
  cached('station2', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1000); g.addColorStop(0, '#c7e6db'); g.addColorStop(1, '#a3d1c1');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1300);
    ceiling();
    ctx.fillStyle = '#c89f6d'; ctx.fillRect(-PAD, 862, W + PAD * 2, 18);
    ctx.fillStyle = '#8fbcae'; ctx.fillRect(-PAD, 880, W + PAD * 2, 70);
    // counter
    ctx.fillStyle = '#6f9d8f'; ctx.fillRect(-PAD, 968, W + PAD * 2, 250);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < W; x += 180) ctx.fillRect(x, 980, 6, 220);
    ctx.fillStyle = '#efe5d1'; ctx.fillRect(-PAD, 938, W + PAD * 2, 32);
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(-PAD, 970, W + PAD * 2, 8);
    ctx.fillStyle = '#4f7a6d'; ctx.fillRect(-PAD, 1196, W + PAD * 2, 22);
    floorPaint(1218, '#ddd5c4', '#b9af9b');
    // counter-top items (kept below the overlay band)
    ['#d62828', '#2a6fdb', '#2a9d8f', '#f4a300'].forEach((c, i) => { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(40 + i * 34, 872 - (i % 2) * 8, 30, 68 + (i % 2) * 8, 3); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(210, 900, 120, 40, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; rr(930, 880, 70, 58, 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(1003, 908, 15, -PI / 2, PI / 2); ctx.stroke();
    // bulletin board frame
    ctx.fillStyle = '#8a5a2b'; rr(40, 168, 432, 354, 10); ctx.fill();
    ctx.fillStyle = '#d4a26a'; ctx.fillRect(54, 182, 404, 326);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 220; i++) { ell(54 + srand(i) * 404, 182 + srand(i + 3) * 326, 2, 2); ctx.fill(); }
    // staffing board frame
    ctx.fillStyle = '#b7bec7'; rr(608, 168, 432, 354, 12); ctx.fill();
    ctx.fillStyle = '#fdfdfd'; ctx.fillRect(622, 182, 404, 326);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(622, 182, 404, 52);
    text("TODAY'S STAFFING", 824, 209, { size: 30, fill: '#fff' });
    [['NURSES', 290], ['RESIDENTS', 370], ['RATIO', 450]].forEach(([k, y]) => text(k, 646, y, { size: 32, fill: '#1f3b8f', align: 'left', weight: 900 }));
    ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(640, 328, 370, 3); ctx.fillRect(640, 408, 370, 3);
    // clock frame
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 9; ell(540, 244, 56, 56); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = INK; ell(540 + Math.sin(a) * 43, 244 - Math.cos(a) * 43, 3.5, 3.5); ctx.fill(); }
    // ceiling PA speaker
    ctx.fillStyle = '#dfe3e6'; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 3; ell(360, 118, 34, 20); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a95a3'; for (let i = -2; i <= 2; i++) { ell(360 + i * 10, 118, 2.5, 2.5); ctx.fill(); }
  });
}
function paper2(x, y, w, h, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e8193a'; ell(0, -h / 2 + 9, 6, 6); ctx.fill();
}
function stationDyn2(o) {
  // clock
  const [hh, mm] = o.clock.split(':').map(Number);
  const ma = mm / 60 * TAU, ha = ((hh % 12) / 12 + mm / 720) * TAU;
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(540, 244); ctx.lineTo(540 + Math.sin(ha) * 26, 244 - Math.cos(ha) * 26); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(540, 244); ctx.lineTo(540 + Math.sin(ma) * 40, 244 - Math.cos(ma) * 40); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ell(540, 244, 6, 6); ctx.fill();
  // bulletin: employee of the month (the jar), Gary memorial, pizza party
  paper2(150, 300, 176, 216, -.04, '#fff');
  text('EMPLOYEE OF', 0, -80, { size: 20, fill: INK }); text('THE MONTH', 0, -58, { size: 20, fill: INK });
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 5; ctx.strokeRect(-58, -40, 116, 128);
  ctx.save(); ctx.beginPath(); ctx.rect(-56, -38, 112, 124); ctx.clip(); ctx.fillStyle = '#ffe9ef'; ctx.fillRect(-56, -38, 112, 124);
  jamJar(0, 84, .25, { noReg: true, label: false, eyes: 'open', lid: 1 }); ctx.restore();
  ctx.restore();
  paper2(352, 282, 170, 180, .05, '#2b2233');
  ctx.strokeStyle = '#fff6c2'; ctx.lineWidth = 4; ell(0, -44, 32, 8); ctx.stroke();
  ctx.fillStyle = '#5a2a6a'; ell(0, -8, 36, 40); ctx.fill();
  ctx.fillStyle = '#fff'; ell(-12, -14, 8, 9); ctx.fill(); ell(12, -14, 8, 9); ctx.fill();
  ctx.fillStyle = INK; ell(-12, -12, 4, 4); ctx.fill(); ell(12, -12, 4, 4); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 2, 12, .3, PI - .3); ctx.stroke();
  text('R.I.P. GARY', 0, 60, { size: 22, fill: '#fff6c2', font: 'Bangers', weight: 400, spacing: 2 });
  ctx.restore();
  const pf = o.pizzaFlip ?? (o.pizza === 'ON' ? 1 : 0), fs = Math.abs(Math.cos(pf * PI));
  const pz = pf < .5 ? (o.pizzaFrom || 'CANCELLED') : (o.pizza);
  ctx.save(); ctx.translate(256, 462); ctx.scale(1, Math.max(.02, fs));
  ctx.fillStyle = pz === 'ON' ? '#fff27a' : '#ffd1e3'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 6; ctx.fillRect(-190, -42, 380, 84); ctx.shadowColor = 'transparent';
  text('PIZZA PARTY:', -84, 1, { size: 26, fill: INK });
  if (pz === 'ON') text("IT'S ON!", 106, 1, { size: 34, fill: '#2a9d4a', font: 'Bangers', weight: 400, spacing: 2 });
  else { ctx.save(); ctx.translate(106, 1); ctx.rotate(-.1); ctx.strokeStyle = '#d62828'; ctx.lineWidth = 4; ctx.strokeRect(-66, -17, 132, 34); text('CANCELLED', 0, 1, { size: 22, fill: '#d62828' }); ctx.restore(); }
  ctx.restore();
  if (o.keyBoard) regKey('bulletin', 40, 168, 472, 522);
  // staffing numbers (flip like a departure board when they change)
  const sf = o.staffFlip ?? 1, ss = Math.abs(Math.cos(sf * PI));
  const row = (y, v, flipping) => { ctx.save(); ctx.translate(930, y); if (flipping) ctx.scale(1, Math.max(.02, ss)); text(v, 0, 2, { size: 58, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 }); ctx.restore(); };
  row(290, String(sf < .5 && o.staffFrom != null ? o.staffFrom : o.staff), o.staffFrom != null);
  row(370, '40', false);
  row(450, sf < .5 && o.ratioFrom ? o.ratioFrom : o.ratio, !!o.ratioFrom);
  if (o.keyStaff) regKey('staffing', 608, 168, 1040, 522);
  // PA speaker waves
  if (o.pa > .05) { ctx.strokeStyle = `rgba(40,60,90,${.3 + .5 * o.pa})`; ctx.lineWidth = 4; for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(360, 118, 34 + i * 16, .3, PI - .3); ctx.stroke(); } }
  // survey alarm beacon
  if (o.alarm) {
    const a = T * 7;
    ctx.fillStyle = '#b3001f'; rr(512, 130, 56, 30, 8); ctx.fill();
    ctx.fillStyle = '#ff2d3d'; ell(540, 130, 22, 18); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const off of [0, PI]) { ctx.fillStyle = 'rgba(255,40,40,.18)'; ctx.beginPath(); ctx.moveTo(540, 130); ctx.arc(540, 130, 900, a + off - .25, a + off + .25); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
}

function bgRoom2(v) {
  cached('room2-' + v.num, () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1230); g.addColorStop(0, v.wall[0]); g.addColorStop(1, v.wall[1]);
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1330 + PAD);
    ceiling('#f3f1ec');
    ctx.fillStyle = '#9a8f80'; ctx.fillRect(-PAD, 1212, W + PAD * 2, 22);
    floorPaint(1232, '#e2d9c6', '#bfb39c');
    ctx.fillStyle = '#b7bec7'; rr(598, 168, 444, 354, 12); ctx.fill();
    ctx.fillStyle = '#fdfdfd'; ctx.fillRect(612, 182, 416, 326);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(612, 182, 416, 52);
    text('ROOM ' + v.num, 820, 209, { size: 30, fill: '#fff' });
    v.board.forEach(([s, c], i) => text(s, 634, 284 + i * 60, { size: 30, fill: c || '#1f3b8f', align: 'left', weight: 800, italic: true, maxW: 376 }));
    ctx.fillStyle = '#dfe5ea'; rr(890, 560, 140, 100, 10); ctx.fill();
    ctx.fillStyle = '#2a9d4a'; ell(930, 600, 14, 14); ctx.fill(); text('O2', 930, 632, { size: 15, fill: '#2a9d4a' });
    ctx.fillStyle = '#e0e0e0'; ctx.strokeStyle = '#777'; ctx.lineWidth = 3; ell(990, 600, 14, 14); ctx.fill(); ctx.stroke(); text('VAC', 990, 632, { size: 13, fill: '#555' });
    ctx.fillStyle = '#9ad1c9';
    ctx.beginPath(); ctx.moveTo(-PAD, 150); ctx.lineTo(34, 150);
    for (let y = 150; y <= 1180; y += 40) ctx.lineTo(28 + Math.sin(y * .05) * 8, y);
    ctx.lineTo(-PAD, 1180); ctx.fill();
  });
}
const bedTop = (cy, k, s) => cy + k.ry * s * .96;

function bgHall2() {
  cached('hall2', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1240); g.addColorStop(0, '#f2ead8'); g.addColorStop(1, '#e2d6bd');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1340 + PAD);
    ceiling('#f6f3ea');
    ctx.fillStyle = '#b9d3c9'; ctx.fillRect(-PAD, 1012, W + PAD * 2, 228);
    floorPaint(1240, '#e8e2d4', '#bdb3a0');
    for (const [x, num] of [[50, '14'], [790, '15']]) {
      ctx.fillStyle = '#8a6a48'; ctx.fillRect(x - 10, 588, 260, 652);
      const g3 = ctx.createLinearGradient(x, 0, x + 240, 0); g3.addColorStop(0, '#caa27a'); g3.addColorStop(1, '#b08660');
      ctx.fillStyle = g3; ctx.fillRect(x, 600, 240, 640);
      ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 7; i++) ctx.fillRect(x + 20 + i * 32, 610, 3, 620);
      ctx.fillStyle = '#d9dde2'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(x + 190, 900, 36, 16, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#555'; rr(x + 60, 540, 120, 40, 8); ctx.fill(); ctx.stroke();
      text('ROOM ' + num, x + 120, 561, { size: 20, fill: INK });
    }
    ctx.fillStyle = '#b8895a'; ctx.strokeStyle = '#6e4d2c'; ctx.lineWidth = 3;
    ctx.fillRect(-PAD, 990, W + PAD * 2, 22); ctx.strokeRect(-PAD, 990, W + PAD * 2, 22);
    ctx.fillStyle = '#8a8f96'; for (let x = 20; x < W; x += 180) ctx.fillRect(x, 1012, 12, 26);
    // falls sign frame
    ctx.fillStyle = '#1d2b53'; rr(356, 168, 368, 330, 16); ctx.fill();
    ctx.fillStyle = '#fffdf2'; rr(372, 184, 336, 298, 10); ctx.fill();
    text('DAYS WITHOUT', 540, 236, { size: 38, font: 'Bangers', weight: 400, fill: '#1d2b53', spacing: 2 });
    text('A FALL', 540, 280, { size: 38, font: 'Bangers', weight: 400, fill: '#1d2b53', spacing: 2 });
  });
}
function fallSign(n, flip, key) {
  const s = Math.abs(Math.cos(flip * PI));
  ctx.save(); ctx.translate(540, 390); ctx.scale(1, Math.max(.02, s));
  ctx.fillStyle = '#1d2b53'; rr(-70, -76, 140, 152, 12); ctx.fill();
  text(String(n), 0, 6, { size: 130, font: 'Bangers', weight: 400, fill: n ? '#7dff9a' : '#ff3b55' });
  ctx.restore();
  if (key) regKey('fall-sign', 356, 168, 724, 498);
}

function bgMed2() {
  cached('med2', () => {
    const g = ctx.createLinearGradient(0, 130, 0, 1300); g.addColorStop(0, '#d5dde8'); g.addColorStop(1, '#b3c0d1');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, 1400 + PAD);
    ceiling('#eef0f4');
    floorPaint(1300, '#d6d9dd', '#a9aeb5');
    for (let r = 0; r < 3; r++) {
      const y = 290 + r * 115;
      ctx.fillStyle = '#f2f2f2'; ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 3; ctx.fillRect(40, y, 460, 12); ctx.strokeRect(40, y, 460, 12);
      for (let i = 0; i < 10; i++) {
        const x = 56 + i * 44, h = 54 + srand(i + r * 20) * 34;
        ctx.fillStyle = 'rgba(255,140,0,.85)'; ctx.fillRect(x + 4, y - h + 14, 30, h - 14); ctx.fillStyle = '#fff'; ctx.fillRect(x + 2, y - h, 34, 16); ctx.fillStyle = '#fdfaf2'; ctx.fillRect(x + 4, y - h * .6, 30, h * .3);
      }
    }
    ctx.fillStyle = '#8fa3bb'; ctx.fillRect(-PAD, 1000, 540 + PAD, 300);
    ctx.fillStyle = '#eceff3'; ctx.fillRect(-PAD, 980, 556 + PAD, 26);
    ctx.fillStyle = '#d62828'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(380, 890, 100, 90, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(390, 906, 80, 22); text('SHARPS', 430, 918, { size: 15, fill: '#d62828' });
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(548, 336, 444, 972);
  });
}
// Floor-standing medication fridge; open 0..1 swings the door out to the left.
function fridge(open, inside, key) {
  const x0 = 560, y0 = 350, w = 420, h = 950;
  ctx.fillStyle = '#e9eef3'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(x0, y0, w, h, 18); ctx.fill(); ctx.stroke();
  if (open > 0) {
    ctx.fillStyle = '#dbe8f4'; ctx.fillRect(x0 + 18, y0 + 18, w - 36, h - 36);
    const gl = ctx.createLinearGradient(0, y0, 0, y0 + 300); gl.addColorStop(0, 'rgba(255,255,255,.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(x0 + 18, y0 + 18, w - 36, 300);
    ctx.strokeStyle = '#a8b8c8'; ctx.lineWidth = 6;
    for (const y of [560, 760]) { ctx.beginPath(); ctx.moveTo(x0 + 22, y); ctx.lineTo(x0 + w - 22, y); ctx.stroke(); }
    ['#8fd3ff', '#fff', '#ffd1e3'].forEach((c, i) => { ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(x0 + 60 + i * 110, 480, 70, 76, 8); ctx.fill(); ctx.stroke(); text('INSULIN', x0 + 95 + i * 110, 520, { size: 12, fill: INK }); });
    inside();
  }
  const ang = open * 1.95, c = Math.cos(ang), far = x0 + w * c, bulge = 36 * Math.sin(ang);
  ctx.fillStyle = c > 0 ? '#f4f7fa' : '#cfd8e2'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(far, y0 - bulge); ctx.lineTo(far, y0 + h + bulge); ctx.lineTo(x0, y0 + h); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (open > 0 && open < 1) regLocal('fg', Math.min(x0, far), y0 - bulge, Math.max(x0, far), y0 + h + bulge, { id: 'fridge-door', transit: true });
  if (c > .6) {
    ctx.save(); ctx.translate(x0, 0); ctx.scale(c, 1);
    ctx.fillStyle = '#9aa3ad'; rr(w - 50, y0 + 360, 16, 200, 8); ctx.fill();
    ctx.fillStyle = '#fff27a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(40, y0 + 60, w - 80, 170); ctx.strokeRect(40, y0 + 60, w - 80, 170);
    text('NO FOOD', w / 2, y0 + 112, { size: 48, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 });
    text('IN MED FRIDGE', w / 2, y0 + 160, { size: 32, font: 'Bangers', weight: 400, fill: '#d62828', spacing: 2 });
    text('(this means you)', w / 2, y0 + 200, { size: 20, fill: INK, italic: true });
    ctx.restore();
    if (key) regKey('fridge-sign', x0 + 40, y0 + 60, x0 + w - 40, y0 + 230);
  }
}

function wheelchair(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#4a4f57'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-70, -330); ctx.lineTo(-60, -150); ctx.lineTo(90, -150); ctx.lineTo(110, -20); ctx.stroke();
  ctx.fillStyle = '#2a6fdb'; rr(-70, -175, 170, 30, 8); ctx.fill(); rr(-78, -330, 26, 170, 8); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 12; ell(-20, -110, 100, 100); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#8a8f96'; for (let i = 0; i < 6; i++) { const a = i / 6 * PI; ctx.beginPath(); ctx.moveTo(-20 + Math.cos(a) * 94, -110 + Math.sin(a) * 94); ctx.lineTo(-20 - Math.cos(a) * 94, -110 - Math.sin(a) * 94); ctx.stroke(); }
  ctx.fillStyle = '#222'; ell(110, -14, 16, 16); ctx.fill();
  ctx.restore();
}

function stateCar(x, y, door) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 0, 250, 20); ctx.fill();
  ctx.fillStyle = '#16181f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
  rr(-240, -110, 480, 86, 26); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-150, -110); ctx.quadraticCurveTo(-110, -190, -30, -192); ctx.lineTo(80, -192); ctx.quadraticCurveTo(140, -190, 170, -110); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a4a62'; ctx.beginPath(); ctx.moveTo(-128, -114); ctx.quadraticCurveTo(-96, -176, -34, -178); ctx.lineTo(18, -178); ctx.lineTo(18, -114); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(32, -114); ctx.lineTo(32, -178); ctx.lineTo(78, -178); ctx.quadraticCurveTo(128, -176, 150, -114); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; rr(-236, -76, 26, 14, 4); ctx.fill(); ctx.fillStyle = '#ff3b3b'; rr(212, -76, 24, 14, 4); ctx.fill();
  ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; rr(160, -52, 70, 26, 3); ctx.fill(); ctx.stroke();
  text('STATE', 195, -38, { size: 16, fill: '#1d2b53' });
  ctx.fillStyle = '#111'; for (const dx of [-150, 150]) { ell(dx, -20, 42, 42); ctx.fill(); ctx.fillStyle = '#8a8f96'; ell(dx, -20, 18, 18); ctx.fill(); ctx.fillStyle = '#111'; }
  if (door > 0) { ctx.fillStyle = '#16181f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(32, -186); ctx.lineTo(32 + 150 * door, -200); ctx.lineTo(32 + 150 * door, -40); ctx.lineTo(32, -30); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

function mortar(x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#e8e2d6'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-86, -64); ctx.quadraticCurveTo(-80, 0, 0, 0); ctx.quadraticCurveTo(80, 0, 86, -64); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#cfc6b5'; ell(0, -64, 86, 12); ctx.fill(); ctx.stroke();
  ctx.restore();
  regLocal('fg', x - 88, y - 78, x + 88, y + 2, { id: 'mortar' });
}

function gameShowBg() {
  cached('gameshow', () => {
    const g = ctx.createLinearGradient(0, 0, 0, STAGE_H); g.addColorStop(0, '#0b1d5c'); g.addColorStop(1, '#241046');
    ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(120,160,255,.06)'; ctx.beginPath(); ctx.moveTo(100 + i * 125, -20); ctx.lineTo(i * 125 - 60, 1500); ctx.lineTo(i * 125 + 260, 1500); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#12093a'; ctx.fillRect(-PAD, 1250, W + PAD * 2, 400);
    for (let i = 0; i < 18; i++) { ctx.fillStyle = i % 2 ? '#ffd60a' : '#ff3b55'; ell(30 + i * 60, 1262, 9, 9); ctx.fill(); }
  });
}
function feudBoard(reveal, bulbT) {
  // frame
  ctx.fillStyle = '#c9951c'; ctx.strokeStyle = '#6b4a00'; ctx.lineWidth = 6; rr(80, 140, 920, 800, 36); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0a2a8a'; rr(110, 170, 860, 740, 24); ctx.fill();
  for (let i = 0; i < 26; i++) { const a = i / 26; const on = Math.sin(bulbT * 10 + i) > 0; ctx.fillStyle = on ? '#fff6a0' : '#8a6a10'; ell(100 + a * 880, 152, 7, 7); ctx.fill(); ell(100 + a * 880, 928, 7, 7); ctx.fill(); }
  text('SURVEY SAYS', 540, 260, { size: 96, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 12, stroke: '#2a0a4a', spacing: 4 });
  // the one answer tile
  const s = Math.abs(Math.cos(reveal * PI)), back = reveal >= .5;
  ctx.save(); ctx.translate(540, 520); ctx.scale(1, Math.max(.02, s));
  ctx.fillStyle = back ? '#f4f7ff' : '#1e4fd6'; ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 6; rr(-400, -110, 800, 220, 16); ctx.fill(); ctx.stroke();
  if (!back) { ctx.fillStyle = '#0a2a8a'; ell(0, 0, 76, 76); ctx.fill(); text('1', 0, 6, { size: 110, font: 'Bangers', weight: 400, fill: '#fff' }); }
  else {
    text('GRAPEFRUIT IN', -40, -38, { size: 64, font: 'Bangers', weight: 400, fill: '#0a2a8a', spacing: 2 });
    text('THE MED FRIDGE', -40, 38, { size: 64, font: 'Bangers', weight: 400, fill: '#0a2a8a', spacing: 2 });
    ctx.fillStyle = '#d62828'; rr(250, -60, 130, 120, 12); ctx.fill();
    text('F-761', 315, 3, { size: 40, font: 'Bangers', weight: 400, fill: '#fff' });
  }
  ctx.restore();
  regKey('answer-tile', 140, 410, 940, 630);
  text('DEFICIENCIES FOUND: 1', 540, 760, { size: 40, fill: '#fff', weight: 900, alpha: seg(reveal, .6, 1) });
  text('(not bad for survey week)', 540, 820, { size: 30, fill: '#9fb3ff', italic: true, alpha: seg(reveal, .8, 1) });
}

// ------------------------------------------------------------------ scenes
const OFFC = document.createElement('canvas'); OFFC.width = W; OFFC.height = H;
const CLIPS = ['r4', 'r3', 'r2', 'r1'];

const SCENES = {
  recap: {
    noTransition: true,
    cam() {},
    draw(lt) {
      ctx.fillStyle = '#07060a'; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
      const hit = CLIPS.map(id => B(id)).find(b => lt >= b.s);
      if (!hit) {
        const a = seg(lt, .1, .5);
        text('PREVIOUSLY ON', 540, 600, { size: 120, font: 'Bangers', weight: 400, fill: '#fff', spacing: 8, alpha: a });
        text('SHIFT HAPPENS', 540, 740, { size: 90, font: 'Bangers', weight: 400, fill: '#ffe135', spacing: 6, alpha: seg(lt, .5, .9) });
      } else {
        const k = lt - hit.s, t1 = hit.src + Math.min(k, hit.e - hit.s - .001);
        renderEpisodeFrame(1, t1, OFFC);
        // monitor: Episode 1 frame (source y 200-1700) shown at 0.8 scale inside a bezel
        const sx = 0, sy = 200, sw = W, sh = 1500, sc = .8, dw = sw * sc, dh = sh * sc, dx = (W - dw) / 2, dy = 150;
        ctx.fillStyle = '#23202b'; rr(dx - 26, dy - 26, dw + 52, dh + 52, 34); ctx.fill();
        ctx.fillStyle = '#3a3646'; rr(dx - 14, dy - 14, dw + 28, dh + 28, 24); ctx.fill();
        ctx.save(); rr(dx, dy, dw, dh, 14); ctx.clip();
        const jit = k < .16 ? (hash(Math.floor(T * 60)) - .5) * 40 : 0;
        ctx.filter = 'saturate(.6) contrast(1.08) sepia(.22)';
        ctx.drawImage(OFFC, sx, sy, sw, sh, dx + jit, dy, dw, dh);
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0,0,0,.16)'; for (let y = dy; y < dy + dh; y += 4) ctx.fillRect(dx, y, dw, 2);
        const by = dy + ((T * 280) % (dh + 200)) - 100;
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(dx, by, dw, 34);
        if (k < .16) { ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 40; i++) ctx.fillRect(dx, dy + hash(i + Math.floor(T * 60)) * dh, dw, 3 + hash(i) * 8); }
        ctx.restore();
        ctx.fillStyle = '#ff2d3d'; ell(dx + dw - 30, dy + dh + 13, 6, 6); ctx.fill();
      }
    },
    over(lt) {
      if (lt > B('r1').s - .1) { tag(64, 40, 'PREVIOUSLY ON', '#2b2735', '#fff', 'rew'); tag(890, 40, 'EP. 1', '#ff3b55'); }
    },
    panelLabel: () => 'PREVIOUSLY ON',
  },

  title: {
    cam(lt) { const p = easeIO(seg(lt, 0, CUR.dur)); CAM.z = 1.02 + .06 * p; CAM.y = 740 + 30 * p; },
    draw(lt) {
      bgExterior(); exteriorDyn();
      const j = B('jingle'), n1 = B('n1'), d = B('door');
      const cp = easeOut(seg(lt, j.s + .2, n1.e));
      const door = easeOut(seg(lt, d.s, d.s + .4));
      stateCar(lerp(1450, 560, cp), 1462, door);
      if (lt > d.s + .1) drawChar(star({ who: null, x: lerp(640, 800, easeOut(seg(lt, d.s + .1, d.s + .7))), y: 1455, s: .82, filter: 'brightness(.1)', transit: true, arms: { l: 'hold', r: 'rest' } }));
    },
    over(lt) {
      const d = B('door'), p = seg(lt, d.s + .55, d.s + .85);
      if (p > 0) logo2(540, 300, lerp(1.06, .82, easeOut(p)) * (1 + .012 * Math.sin(lt * 6)), clamp(p * 3));
    },
  },

  back: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const n1 = B('n1'), w = B('wobble'), s1 = B('s1'), pop = w.s + .85;
      bgStation2();
      stationDyn2({ clock: '2:59', staff: 1, ratio: '1:40', pizza: 'CANCELLED', keyBoard: lt < n1.e + .3, keyStaff: false });
      const wob = lt >= w.s && lt < pop ? Math.sin((lt - w.s) * 34) * .07 * seg(lt, w.s, w.s + .25) : 0;
      jamJar(500, G, .72, { rot: wob, lid: lt < pop ? 1 : 0, fly: lt < pop ? 0 : seg(lt, pop, pop + .45) || .001, eyes: lt < pop ? 'open' : null, level: lt < pop ? 1 : .4, sub: 'employee of the month', key: true });
      const jp = seg(lt, pop, pop + .75);
      if (lt >= pop) {
        if (jp < 1) drawChar(straw({ x: lerp(500, 220, jp), y: lerp(G - 150, G, jp) - Math.sin(jp * PI) * 330, rot: -jp * TAU, transit: true, expr: 'happy', legs: 'kick', arms: { l: 'cheer', r: 'cheer' }, acc: [...STRAW_ACC, 'jam'] }));
        else {
          const land = 1 - seg(lt, pop + .75, pop + 1.05), talking = lt > s1.s;
          drawChar(straw({ x: 220, squash: .45 * land, expr: talking ? 'happy' : 'hopeful', twitch: talking, acc: [...STRAW_ACC, 'jam'], look: [.4, 0], arms: talking ? { l: 'thumb', r: 'rest' } : { l: 'cheer', r: 'cheer' } }));
        }
      }
      drawChar(lemon({ x: 860, hold: {}, arms: { l: 'hips', r: 'hips' }, expr: lt > pop ? 'shock' : 'sour', look: lt > pop ? [-.9, -.2] : [-.3, .6] }));
    },
    over() {},
  },

  code: {
    cam(lt) {
      const f = B('freeze'), l1 = B('l1'), z = easeIO(seg(lt, f.s, f.e)) * (1 - easeIO(seg(lt, l1.e, l1.e + .3)));
      CAM.z = 1 + .04 * z; CAM.y = 740 + 40 * z;
      if (lt > l1.s && lt < l1.e) CAM.shake = 7;
    },
    draw(lt) {
      const f = B('freeze'), l1 = B('l1');
      bgStation2();
      stationDyn2({ clock: '3:01', staff: 1, ratio: '1:40', pizza: 'CANCELLED', pa: talk('pa'), alarm: lt > l1.s });
      const shocked = lt > f.s, panic = lt > l1.s;
      drawChar(straw({ x: 250, expr: panic ? 'panic' : shocked ? 'shock' : 'neutral', look: panic ? [.8, 0] : [.3, -1],
        arms: panic ? { l: 'up', r: 'up' } : shocked ? { l: 'down', r: 'down' } : { l: 'rest', r: 'rest' }, shake: panic ? 3 : 0, acc: shocked ? [...STRAW_ACC, 'sweat'] : STRAW_ACC }));
      const le = easeOut(seg(lt, l1.s - .35, l1.s + .05));
      if (le > 0) drawChar(lemon({ x: lerp(1320, 840, le), transit: le < 1, walk: le < 1 ? lt * 18 : null, expr: 'panic', hold: {}, arms: { l: 'up', r: 'up' }, look: [-.8, 0], shake: panic ? 3 : 0 }));
    },
    over(lt) {
      const l1 = B('l1'), n1 = B('n1');
      if (lt > l1.s) redWash(.1 + .08 * Math.sin(T * 9));
      card(seg(lt, n1.s + .15, n1.s + .45), 'SURVEY WEEK', [['STAFFING', 'Miraculous'], ['SNACKS', 'Hidden'], ['RULES', 'All of them. Suddenly.']], '#d62828');
    },
  },

  chaos: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const l1 = B('l1'), op = B('open'), sl = B('slam');
      bgMed2();
      const open = easeOut(seg(lt, op.s, op.s + .4)) * (1 - easeIn(seg(lt, sl.s + .05, sl.s + .25)));
      fridge(open, () => drawChar(gfruit({ x: 770, y: 1270, look: [-.7, 0] })), open < .02);
      const reach = lt > op.s - .1 && lt < sl.s + .4;
      drawChar(lemon({ x: 290, hold: {}, expr: 'panic', look: [.8, 0], shake: lt < op.s ? 2 : 0,
        arms: lt < op.s - .1 ? { l: 'flail', r: 'flail' } : reach ? { l: 'rest', r: lt > sl.s ? 'stop' : 'reach' } : { l: 'rest', r: 'rest' } }));
    },
    over() {},
  },

  admin: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const en = B('enter'), m1 = B('m1'), s1 = B('s1');
      const flip = seg(lt, m1.e - .7, m1.e - .3);
      bgStation2();
      stationDyn2({ clock: '3:03', staff: 1, ratio: '1:40', pizza: 'ON', pizzaFrom: 'CANCELLED', pizzaFlip: flip, keyBoard: lt > m1.e - .8 });
      const mp = easeOut(seg(lt, en.s, en.e));
      drawChar(straw({ x: 250, expr: lt > s1.s ? 'shock' : mp > .5 ? 'hopeful' : 'neutral', look: [.8, 0], arms: lt > s1.s ? { l: 'shrug', r: 'shrug' } : { l: 'rest', r: 'rest' } }));
      drawChar(melon({ x: lerp(1350, 820, mp), transit: mp < 1, walk: mp < 1 ? lt * 14 : null, look: [-.8, 0], hold: { l: 'pizza' }, arms: { l: 'offer', r: lt > m1.s ? 'wave' : 'rest' } }));
    },
    over(lt) {
      const n1 = B('n1');
      card(seg(lt, n1.s + .15, n1.s + .45), 'FIELD NOTES', [['SPECIES', 'The Administrator'], ['HABITAT', 'An office. Somewhere.'], ['SEEN ON UNIT', 'Survey week only']], '#2a6fdb');
    },
  },

  kiwis: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const sl = B('slide'), fl = B('flip'), s1 = B('s1');
      const fp = seg(lt, fl.s + .1, fl.s + .5);
      bgStation2();
      stationDyn2({ clock: '3:05', staff: 6, staffFrom: 1, ratio: '1:7', ratioFrom: '1:40', staffFlip: fp, pizza: 'ON', keyStaff: true });
      const joy = lt > s1.s;
      drawChar(straw({ x: 220, expr: joy ? 'happy' : 'shock', look: [.8, 0], acc: joy ? [...STRAW_ACC, 'tears'] : STRAW_ACC, arms: joy ? { l: 'cheer', r: 'cheer' } : { l: 'down', r: 'down' } }));
      for (let i = 4; i >= 0; i--) {
        const p = easeOut(seg(lt, sl.s + i * .16, sl.s + .5 + i * .16));
        drawChar(kiwi(i, { x: lerp(1400 + i * 60, 432 + i * 136, p), transit: p < 1, walk: p < 1 ? lt * 16 : null, look: [-.7, 0], arms: lt > B('k1').s && lt < B('k1').e ? { l: 'wave', r: 'rest' } : { l: 'rest', r: 'rest' } }));
      }
    },
    over(lt) {
      const n1 = B('n1');
      card(seg(lt, n1.s + .15, n1.s + .45), 'UNEXPLAINED PHENOMENON', [['STAFFING', 'Appeared from nowhere'], ['CAUSE', 'The State'], ['EXPIRES', '4:45 PM']], '#7a3fb0');
    },
  },

  observe: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const st1 = B('st1'), wa = B('wash'), s1 = B('s1'), b1 = B('b1'), s2 = B('s2'), b2 = B('b2');
      bgRoom2({ num: 12, wall: ['#e2dcf5', '#c9c0ea'], board: [['NURSE: STRAWBERRY', '#d62828'], ['GOAL: stay blue :)'], ['O2: 2L NC'], ['STATE: IN BUILDING', '#d62828']] });
      windowDyn('day', 60, 170, 380, 350);
      regKey('whiteboard', 598, 168, 1042, 522);
      drawBedBack(760, 1150);
      const bk = KINDS.blue, by = 1010;
      drawChar({ kind: 'blue', id: 'blue', who: 'blue', x: 880, y: by, s: 1.3, noLegs: true, center: true, noBob: true, expr: lt > s2.e ? 'sour' : lt > b1.s ? 'chill' : 'neutral', look: [-.8, 0],
        acc: ['glasses', 'mustache', 'cannula'], browColor: '#f0f0f0', browW: 12, arms: lt > b1.s && lt < b1.e + .2 ? { l: [1.3, -1.3 + .3 * Math.sin(lt * 5)], r: 'rest' } : { l: 'rest', r: 'rest' } });
      drawBedFront(760, 1150, '#9fb4ff', bedTop(by, bk, 1.3));
      const writing = lt > b2.s;
      drawChar(star({ x: 575, look: [-.5, 0], arms: { l: 'hold', r: writing ? [.75 + .08 * Math.sin(lt * 24), 1.25] : [.75, 1.25] } }));
      const washing = lt > wa.s - .1 && lt < wa.e + .1;
      const nervous = lt > s1.s;
      drawChar(straw({ x: 250, look: lt < wa.s ? [.9, 0] : [.6, 0], expr: lt > s2.s && lt < s2.e ? 'happy' : lt > b1.s && lt < s2.s ? 'dead' : nervous ? 'happy' : washing ? 'neutral' : 'shock',
        twitch: lt > s2.s && lt < s2.e + .6, acc: nervous ? [...STRAW_ACC, 'sweat'] : STRAW_ACC,
        arms: washing ? { l: [.95, 1.4 + .25 * Math.sin(lt * 26)], r: [.95, 1.4 + .25 * Math.sin(lt * 26 + 1)] } : { l: 'rest', r: 'rest' } }));
      if (washing) { for (let i = 0; i < 6; i++) { const q = (lt * 1.5 + i / 6) % 1; ctx.fillStyle = `rgba(210,240,255,${.8 * (1 - q)})`; ctx.strokeStyle = `rgba(120,180,220,${1 - q})`; ctx.lineWidth = 2; ell(250 + (hash(i) - .5) * 110, 1210 - q * 120, 8 + q * 6, 8 + q * 6); ctx.fill(); ctx.stroke(); } }
    },
    over(lt) {
      const wa = B('wash'), s1 = B('s1');
      const p = seg(lt, wa.s, wa.s + .15) * (1 - seg(lt, s1.s + .8, s1.s + 1.1));
      if (p > 0) {
        const n = Math.round(1 + 46 * easeIn(seg(lt, wa.s + .05, wa.e)));
        const x = 290, y = 580, w = 500, h = 204;
        reg('overlay', [x, y, x + w, y + h], { id: 'hygiene' });
        ctx.save(); ctx.globalAlpha = p;
        ctx.fillStyle = '#0f2f4a'; ctx.strokeStyle = '#6ec3ff'; ctx.lineWidth = 6; rr(x, y, w, h, 20); ctx.fill(); ctx.stroke();
        text('HAND HYGIENE COUNT', 540, y + 44, { size: 32, fill: '#6ec3ff', weight: 900 });
        text(String(n), 540, y + 132, { size: 120, font: 'Bangers', weight: 400, fill: '#fff', spacing: 4 });
        ctx.restore();
      }
    },
  },

  crush: {
    cam(lt) {
      const lo = B('lower'), s1 = B('s1');
      const st1 = B('st1'), z = easeIO(seg(lt, lo.s, lo.e)) * (1 - easeIO(seg(lt, st1.s - .2, st1.s + .15)));
      CAM.z = 1 + .14 * z; CAM.x = lerp(540, 500, z); CAM.y = lerp(740, 900, z);
      const st = B('st1'); const sh = seg(lt, st.s, st.s + .35); if (sh > 0 && sh < 1) CAM.shake = 12 * (1 - sh);
    },
    draw(lt) {
      const lo = B('lower'), st = B('st1'), s1 = B('s1');
      bgHall2(); fallSign(0, 0, false);
      medCart(330, 1180);
      const scared = lt < s1.e + .1;
      drawChar({ kind: 'capsule', id: 'capsule', who: 'capsule', x: 585, y: 1138, s: .92, label: 'ER', expr: scared ? (lt > st.s ? 'panic' : 'shock') : 'happy', look: scared ? [-.3, -1] : [-.8, 0], acc: scared ? ['sweat'] : [], arms: scared ? { l: 'up', r: 'up' } : { l: 'rest', r: 'thumb' } });
      mortar(585, 1168);
      const q = seg(lt, lo.s, lo.e), holding = lt < s1.s + .15;
      drawChar(straw({ x: 250, look: holding ? [.8, -.2] : [.8, 0], expr: lt > s1.s ? 'happy' : lt > st.s ? 'shock' : 'neutral', acc: lt > st.s ? [...STRAW_ACC, 'sweat'] : STRAW_ACC,
        hold: holding ? { r: 'pestle' } : {}, arms: holding ? { l: 'rest', r: [lerp(2.7, 2.95, easeIO(q)), lerp(.25, .05, easeIO(q))] } : { l: 'rest', r: 'rest' } }));
      const pop = easeBack(seg(lt, st.s - .12, st.s + .18));
      if (pop > 0) drawChar(star({ x: 850, s: 1.12 * pop, look: [-.9, -.1], transit: lt < st.s + .3 }));
    },
    over(lt) {
      const n1 = B('n1');
      stamp2(seg(lt, n1.s + .1, n1.s + .4), [['DO NOT CRUSH', 96, -30], ['EXTENDED RELEASE', 54, 58]]);
    },
  },

  banana: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const wb = B('wobble'), sl = B('slow'), ca = B('caught'), n1 = B('n1'), b1 = B('b1');
      bgHall2();
      const fl = seg(lt, n1.s + .5, n1.s + .9);
      fallSign(fl < .5 ? 0 : 1, fl, true);
      const slow = lt >= sl.s && lt < ca.s;
      const k = t => easeIO(seg(t, sl.s + .05, ca.s));
      const chairX = t => lerp(1260, 640, easeOut(seg(t, sl.s + .1, ca.s - .05)));
      const lemonAt = t => { const d = easeOut(seg(t, sl.s + .1, ca.s - .05)); return lemon({ x: chairX(t) + 250, rot: -.18 * Math.sin(d * PI), transit: d < 1, walk: d < 1 ? t * 10 : null, expr: t < ca.s ? 'panic' : 'dead', talk: talk('nooo'), look: [-.9, 0], hold: {}, arms: { l: 'reach', r: 'reach' } }); };
      const strawAt = t => { const d = easeOut(seg(t, sl.s + .15, ca.s + .1)); return straw({ x: lerp(-160, 230, d), rot: .25 * Math.sin(d * PI), transit: d < 1, walk: d < 1 ? t * 10 : null, expr: t < ca.s + .2 ? 'panic' : 'happy', talk: talk('nooo'), look: [.9, 0], legs: d < 1 ? 'kick' : null, arms: d < 1 ? { l: 'reach', r: 'reach' } : { l: 'rest', r: 'thumb' } }); };
      const bananaAt = t => {
        const q = k(t), stand = { x: 560, y: G - 1.12 * (80 + 150 * .9), r: 0 }, seat = { x: 660, y: 1090, r: .14 };
        const wob = t > wb.s && t < sl.s ? .1 * Math.sin((t - wb.s) * 11) * seg(t, wb.s, wb.s + .4) : 0;
        return { kind: 'banana', id: 'banana', who: 'banana', s: 1.12, center: true, noShadow: q > 0,
          x: lerp(stand.x, seat.x, q), y: lerp(stand.y, seat.y, q) - Math.sin(q * PI) * 60, rot: wob + lerp(stand.r, seat.r, q) + .5 * Math.sin(q * PI),
          expr: t < wb.s ? 'happy' : t < ca.e ? 'panic' : 'happy', look: [0, -.6], legs: q > 0 && q < 1 ? 'kick' : null,
          arms: t > wb.s && t < ca.s ? { l: 'flail', r: 'flail' } : t > b1.s ? { l: 'thumb', r: 'rest' } : { l: 'rest', r: 'rest' } };
      };
      const frame = (t, ghost) => {
        if (t > sl.s + .1) drawChar(lemonAt(t));
        wheelchair(chairX(t), G);
        drawChar(bananaAt(t));
        if (t > sl.s + .15) drawChar(strawAt(t));
      };
      if (slow) { REG.suppress++; for (const g of [.34, .17]) { ctx.save(); ctx.globalAlpha = .2; frame(lt - g, true); ctx.restore(); } REG.suppress--; }
      frame(lt, false);
    },
    over(lt) {
      const sl = B('slow'), ca = B('caught'), n1 = B('n1');
      if (lt >= sl.s && lt < ca.s + .2) { ctx.fillStyle = 'rgba(30,40,80,.18)'; ctx.fillRect(0, 0, W, STAGE_H); tag(40, OV + 10, 'SLOW MOTION', '#2b2735', '#fff', 'pause'); }
      banner2(seg(lt, n1.s + .1, n1.s + .35), 'ZERO FALLS!', '#2a9d4a');
    },
  },

  cran: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const c1 = B('c1'), st1 = B('st1'), s1 = B('s1');
      bgRoom2({ num: 7, wall: ['#ffe3d3', '#f5c9b0'], board: [['NURSE: STRAWBERRY', '#d62828'], ['TODAY IS: FRIDAY'], ['YEAR: 2026 (not 1962)'], ['MEALS: 3 + 2 snacks', '#2a9d4a']] });
      windowDyn('golden', 60, 170, 380, 350);
      regKey('whiteboard', 598, 168, 1042, 522);
      drawBedBack(760, 1150);
      const ck = KINDS.cran, cy = 1002, frantic = lt > c1.s - .1 && lt < c1.e + .2;
      drawChar({ kind: 'cran', id: 'cran', who: 'cran', x: 880, y: cy, s: 1.3, noLegs: true, center: true, noBob: true, expr: frantic ? 'panic' : 'neutral', look: [-.8, 0],
        acc: ['curlers', 'glasses', 'pearls'], arms: frantic ? { l: 'reach', r: 'flail' } : { l: 'rest', r: 'rest' }, shake: frantic ? 2 : 0 });
      drawBedFront(760, 1150, '#ffb3c4', bedTop(cy, ck, 1.3));
      drawChar(star({ x: 585, look: lt < st1.s ? [.8, 0] : [.2, .6], arms: { l: 'hold', r: lt > st1.s ? [.75 + .08 * Math.sin(lt * 24), 1.25] : [.75, 1.25] } }));
      const panic = lt > s1.s;
      drawChar(straw({ x: 230, expr: panic ? 'panic' : lt > c1.s ? 'shock' : 'neutral', look: [.8, 0], acc: lt > c1.s ? [...STRAW_ACC, 'sweat'] : STRAW_ACC, arms: panic ? { l: 'flail', r: 'flail' } : { l: 'rest', r: 'rest' } }));
    },
    over(lt) {
      const st1 = B('st1'), s1 = B('s1');
      card(seg(lt, st1.s, st1.s + .3), 'SURVEYOR NOTES', [['RESIDENT SAYS', 'Never fed'], ['ALSO SAYS', 'It is 1962'], ['CHART SAYS', 'Ate lunch. Twice.']], '#1d2b53', lt > s1.s + .6 ? 3 : 2);
    },
  },

  leave: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const st1 = B('st1'), gone = B('gone'), pf = B('poof'), m1 = B('m1'), l1 = B('l1'), s1 = B('s1'), jr = B('jar');
      const shotB = lt >= gone.e;
      const back = seg(lt, pf.s + 1.2, pf.s + 1.5);
      bgStation2();
      stationDyn2({ clock: '4:45', staff: 1, staffFrom: 6, ratio: '1:40', ratioFrom: '1:7', staffFlip: back, pizza: 'CANCELLED', pizzaFrom: 'ON', pizzaFlip: seg(lt, m1.e - .5, m1.e - .1), keyStaff: shotB });
      if (!shotB) {
        drawChar(straw({ x: 250, expr: 'happy', look: [.8, 0], arms: { l: 'rest', r: 'wave' } }));
        const w = seg(lt, st1.e, gone.e);
        drawChar(star({ x: lerp(780, 1340, easeIn(w)), transit: w > 0, walk: w > 0 ? lt * 14 : null, look: [-.7, 0] }));
        return;
      }
      const into = seg(lt, jr.s, jr.s + .7);
      jamJar(470, G, .72, { lid: into < .6 ? 0 : easeOut(seg(into, .6, 1)) * .7 + (into >= 1 ? .3 : 0), eyes: into >= 1 ? 'dead' : null, level: into >= 1 ? 1 : .4, sub: 'do not disturb', key: lt > pf.e });
      for (let i = 4; i >= 0; i--) {
        const at = pf.s + i * .24;
        if (lt < at) drawChar(kiwi(i, { x: 432 + i * 136, look: [-.6, 0], expr: 'neutral' }));
      }
      const mIn = easeOut(seg(lt, m1.s - .6, m1.s)), mOut = easeIn(seg(lt, m1.e, m1.e + .4));
      if (mIn > 0 && mOut < 1) drawChar(melon({ x: lerp(1350, 900, mIn) + 520 * mOut, transit: mIn < 1 || mOut > 0, walk: mIn < 1 || mOut > 0 ? lt * 14 : null, look: [-.8, 0], expr: 'happy', hold: { l: 'pizza' }, arms: { l: 'cheer', r: 'rest' } }));
      const lIn = easeOut(seg(lt, m1.e + .42, l1.s + .35));
      if (lIn > 0) drawChar(lemon({ x: lerp(1330, 860, lIn), transit: lIn < 1, walk: lIn < 1 ? lt * 16 : null, look: [-.8, 0], hold: {}, arms: { l: 'hips', r: 'hips' } }));
      if (into < 1) {
        const inJ = into > 0;
        drawChar(straw({ x: lerp(220, 470, easeIO(into)), y: G - Math.sin(into * PI) * 320 + into * 40, s: SC * (1 - .55 * into), transit: inJ, rot: into * .5,
          expr: lt > l1.e ? 'dead' : 'shock', look: lt > l1.s ? [.8, 0] : [.6, -.3], arms: inJ ? { l: 'up', r: 'up' } : { l: 'down', r: 'down' } }));
      }
      for (let i = 0; i < 5; i++) poof(432 + i * 136, 1150, seg(lt, pf.s + i * .24, pf.s + i * .24 + .5), 110);
    },
    over(lt) {
      const gone = B('gone'), pf = B('poof');
      banner2(seg(lt, gone.s + .15, gone.s + .4) * (1 - seg(lt, pf.s + .9, pf.s + 1.1)), 'THE STATE HAS LEFT THE BUILDING', '#1d2b53', '#ffe135', 60);
    },
  },

  results: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const rv = B('reveal');
      gameShowBg();
      feudBoard(seg(lt, rv.s + .15, rv.s + .5), T);
      drawChar({ kind: 'apple', id: 'apple', who: 'host', x: 230, y: G, s: 1.15, acc: ['sunglasses'], expr: 'happy', hold: { r: 'mic' }, arms: { l: 'cheer', r: 'phone' }, look: [.6, -.4] });
      jamJar(870, G, .6, { eyes: 'open', sub: 'contestant' });
    },
    over() {},
    panelLabel: () => 'SURVEY RESULTS',
  },

  fridge: {
    cam() { CAM.z = 1; },
    draw(lt) {
      const op = B('open');
      bgMed2();
      const open = easeOut(seg(lt, op.s, op.s + .45));
      fridge(open, () => drawChar(gfruit({ x: 770, y: 1270, look: [-.8, 0] })), open < .02);
      drawChar(star({ x: 330, look: [.9, 0], expr: 'dead', arms: { l: 'hold', r: lt > op.s ? 'reach' : [.75, 1.25] }, hold: { l: 'clipboard' } }));
    },
    over(lt) {
      const n1 = B('n1');
      card(seg(lt, n1.s + .1, n1.s + .4), 'CITATION', [['TAG', 'F-761'], ['FINDING', 'Food in the med fridge'], ['THE FOOD', 'Grapefruit. Obviously.']], '#d62828');
    },
  },

  end: {
    cam() {},
    draw(lt) {
      const g = ctx.createLinearGradient(0, 0, 0, STAGE_H); g.addColorStop(0, '#1b0f3a'); g.addColorStop(1, '#4a0d3d');
      ctx.fillStyle = g; ctx.fillRect(-PAD, -PAD, W + PAD * 2, STAGE_H + PAD * 2);
      for (let i = 0; i < 60; i++) { const x = hash(i) * W + Math.sin(T + i) * 30, y = ((hash(i + 9) * STAGE_H + lt * (120 + hash(i + 4) * 200)) % (STAGE_H + 100)) - 50; ctx.save(); ctx.translate(x, y); ctx.rotate(T * 2 + i); ctx.fillStyle = ['#ffe135', '#ff3b55', '#5b6cff', '#2ecc71', '#ff9f1c'][i % 5]; ctx.fillRect(-8, -4, 16, 8); ctx.restore(); }
      const cast = [['star', { acc: ['glasses', 'statecap'] }], ['melon', { acc: ['suit'] }], ['kiwi', { acc: ['bouffant'], capColor: KIWI_CAPS[0] }], ['kiwi', { acc: ['bouffant'], capColor: KIWI_CAPS[1] }], ['capsule', {}], ['lemon', { acc: ['readers'] }],
        ['blue', { acc: ['glasses', 'mustache'], browColor: '#eee' }], ['cran', { acc: ['curlers'] }], ['gfruit', { acc: ['sunglasses'] }], ['banana', {}], ['apple', { acc: ['sunglasses'] }], ['kiwi', { acc: ['bouffant'], capColor: KIWI_CAPS[2] }]];
      cast.forEach(([kind, extra], i) => {
        const row = i < 6 ? 0 : 1, col = i % 6;
        const x = 105 + col * 174, y = row ? 1440 : 1250;
        const hop = Math.abs(Math.sin(lt * 5 + i)) * 20, pop = easeBack(seg(lt, .8 + i * .07, 1.1 + i * .07));
        if (pop > 0) { REG.suppress++; drawChar(Object.assign({ kind, x, y: y - hop, s: .5 * pop, expr: 'happy', arms: { l: 'cheer', r: 'wave' }, t: lt + i }, extra)); REG.suppress--; }
      });
    },
    over(lt) {
      logo2(540, 330, easeBack(seg(lt, 0, .35)) * .74);
      const lines = [['Dedicated to every nurse who has heard:', 34, '#fff', .9], ['"Mr. Stateman is in the lobby."', 40, '#ffe135', 1.3], ['Hand hygiene count: 47', 32, '#9fd8ff', 2.0], ['NEXT TIME: The Holiday Schedule', 36, '#ff8fa3', 2.7]];
      lines.forEach(([s, size, c, at], i) => text(s, 540, 640 + i * 62, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 8 }));
    },
    panelLabel: () => 'THANKS FOR WATCHING',
  },

  post: {
    cam(lt) { const s1 = B('s1'); const z = easeOut(seg(lt, s1.e, s1.e + .3)); CAM.z = lerp(1, 1.3, z); CAM.x = lerp(540, 660, z); CAM.y = lerp(740, 900, z); CAM.shake = z * 6; },
    draw(lt) {
      const r = B('ringing'), a1 = B('a1'), s1 = B('s1');
      bgBedroom();
      ctx.fillStyle = '#3a3566'; rr(40, 1180, 470, 230, 26); ctx.fill();
      ctx.fillStyle = '#5b4fa0'; ctx.strokeStyle = '#231c4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40, 1400); ctx.lineTo(40, 1200); ctx.quadraticCurveTo(250, 1160, 510, 1210); ctx.lineTo(510, 1400); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e9e4f5'; ell(160, 1180, 110, 40); ctx.fill();
      ctx.fillStyle = '#4a3b2a'; rr(560, 1160, 480, 250, 12); ctx.fill();
      ctx.fillStyle = '#3a2d20'; ctx.fillRect(560, 1160, 480, 18);
      const angry = lt > s1.e;
      jamJar(690, 1160, .68, { eyes: lt < r.s + .3 ? 'sleep' : angry ? 'open' : 'dead', sub: 'do not disturb', key: true });
      if (angry) { ctx.fillStyle = 'rgba(255,0,0,.18)'; rr(690 - 95, 1160 - 258, 190, 258, 26); ctx.fill(); for (let i = 0; i < 5; i++) { const q = (lt * 1.6 + i / 5) % 1; ctx.fillStyle = `rgba(255,255,255,${.6 * (1 - q)})`; ell(690 + (i % 2 ? 1 : -1) * (40 + q * 50), 820 - q * 160, 24 + q * 30, 18 + q * 24); ctx.fill(); } }
      const ringing = lt > r.s && lt < a1.s, buzz = ringing ? Math.sin(lt * 60) * 4 : 0;
      ctx.save(); ctx.translate(955 + buzz, 1150);
      if (ringing) { const gl = ctx.createRadialGradient(0, 0, 10, 0, 0, 240); gl.addColorStop(0, 'rgba(120,200,255,.5)'); gl.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = gl; ctx.fillRect(-240, -240, 480, 480); }
      ctx.fillStyle = '#111'; rr(-44, -18, 88, 30, 6); ctx.fill(); ctx.fillStyle = ringing || lt > a1.s ? '#7fd3ff' : '#223'; rr(-38, -14, 76, 22, 4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#111'; rr(900, 1052, 110, 60, 8); ctx.fill(); text('3:00', 955, 1083, { size: 40, fill: '#ff3030', font: 'Bangers', weight: 400 });
    },
    over(lt) {
      const r = B('ringing'), a1 = B('a1');
      const p = seg(lt, r.s, r.s + .3) * (1 - seg(lt, a1.e, a1.e + .3));
      if (p > 0) {
        const y = 60;
        reg('overlay', [70, y, 1010, y + 150], { id: 'call' });
        ctx.save(); ctx.globalAlpha = clamp(p * 1.4);
        ctx.fillStyle = 'rgba(245,245,250,.97)'; rr(70, y, 940, 150, 34); ctx.fill();
        ctx.fillStyle = '#e53935'; rr(100, y + 24, 102, 102, 24); ctx.fill();
        REG.suppress++; drawChar({ kind: 'apple', x: 151, y: y + 82, s: .3, center: true, noLegs: true, noArms: true, expr: 'happy', t: lt, acc: ['sunglasses'] }); REG.suppress--;
        text('DR. APPLE', 230, y + 52, { size: 34, fill: '#111', align: 'left' });
        text(lt > a1.s ? 'Call in progress (3:00 AM)' : 'Incoming call (3:00 AM)', 230, y + 100, { size: 30, fill: '#444', align: 'left', weight: 700 });
        ctx.restore();
      }
      const f = seg(lt, CUR.dur - .7, CUR.dur);
      if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, STAGE_H); }
    },
  },
};

EPISODES[2] = { num: 2, title: 'Episode 2: Survey Says', TL: window.TIMELINE_EP2, SCENES, layout: 'panel', audio: 'build/ep2/audio.m4a' };
})();
