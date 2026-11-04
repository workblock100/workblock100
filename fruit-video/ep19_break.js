'use strict';
/* SHIFT HAPPENS, Episode 19: "The Potluck". Builder E19-BREAK. Scene `breakroom` (8:00 PM, THE BREAK ROOM, 30.327 s). Registers window.__EP19_SCENES.breakroom. Everything is a pure function of the scene time `lt`.
 *
 * THE SET: the break room at 7:59 PM in flat fluorescent light, in one-point perspective (V2.setCam per shot, V2.p2 projects; the 2D camera frames on top, as in Episodes 13 and 18). Room HW 760, back wall at Z 2200.
 * Back wall, left to right: Brenda's refrigerator (labels: DO NOT EAT / BRENDA 2019 / PLEASE LABEL; a dark gap behind it, cobwebs), the counter with THE microwave (display, DONE flash), the FOOD SAFETY: TWO HOURS poster,
 * the digital wall clock (7:59 -> 8:00), the doorway the queue comes out of. Foreground: the long potluck table (Z 1050-1170) with the leftovers, a trash can with a bag at its right end (the sweep lands there).
 * THE QUEUE: eleven staff in a lateral line along the back wall from the microwave (Mango, Lemon, ..., Strawberry with her plate) plus three who are served and leave on the three beeps; paper party hats from q4 on.
 * Characters that are not the cast are crowd extras: drawn without the layout audit (REG.suppress), like the soft neighbours of Episodes 10 and 12; the named cast is always audited.
 * FOOD: window.F19 (ep19_food.js, F19_API.md) when it has landed (checked at draw time), else the stand-ins in this file (same anchors and sizes).
 *
 * SHOTS (scene-local s; every cut is snapped to a frame; see SHOTS below for the framing):
 *  open 0-1.50 wide (beeps .3 .65 1.0: DONE flashes, the queue steps, the served leave) | q1 1.50-3.55 Lemon "Who is next" | q2a 3.55-4.20 Mango sets 90 s | q2b 4.20-4.83 the display 1:30 | q3 4.83-6.42 the line of plates, the chip |
 *  q4a 6.42-7.05 Tomato's party hats | q4b 7.05-7.62 the queue in hats | o1a 7.62-8.55 Onion, the stopwatch | o1b 8.55-9.12 the probe, 78 F | o1c 9.12-9.64 Onion sobs (sniffle 9.424) | t1 9.64-10.90 Tomato "party" |
 *  o2a 10.90-12.10 Onion "Per policy" | o2b 12.10-13.07 "discarded", Strawberry clutches the plate | s1 13.07-14.13 Strawberry "I have not eaten" | tm1 14.13-14.62 the stopwatch hits 2:00:00 (ding 14.429) |
 *  tm2 14.62-14.93 the wall clock 8:00 | tm3 14.93-15.18 everyone looks at Onion | sw 15.18-16.50 THE SWEEP (bagsweep 15.279, bin 16.079, bin 16.429) | bag 16.50-17.03 the bag, the plate on top |
 *  s2 17.03-18.25 Strawberry "That was my break." | b1a 18.25-19.25 Brenda behind the fridge | b1b 19.25-20.43 the room turns | m1 20.43-21.10 Mango | l1 21.10-22.45 Lemon |
 *  b2a 22.45-23.95 Brenda | b2b 23.95-25.15 the lunchbox, 2019 | b2c 25.15-25.85 Strawberry and Brenda | s3 25.85-26.61 Strawberry "Is it good?" | b3a 26.61-27.85 Brenda | b3b 27.85-28.88 the sandwich is torn in two |
 *  end 28.88-30.33 the last image (sting 28.977): Strawberry and Brenda side by side eating the 2019 sandwich, the queue still waiting behind them with empty plates.
 */
(() => {
if (!window.TIMELINE_EP19 || !window.H6 || !window.V2 || !window.UI) return;
const { person, zoomTo, faceC, faceZoom, localOf } = window.H6;
const A7 = window.A7, A11 = window.A11, A13 = window.A13, A15 = window.A15, S6 = window.S6;
const { p2, poly, quad3, grad, radial } = V2;
const { box3, onZ, lit } = S6;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const mixv = (a, b, k) => a + (b - a) * k;
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const sr = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const kz = Z => V2.P.f / (Z - V2.P.cz);                                  /* screen px per world unit at depth Z under the current perspective camera */

// ------------------------------------------------------------------ the timeline (frozen), the sound cues, helpers
const TLX = window.TIMELINE_EP19, SCN = TLX.scenes.find(s => s.id === 'breakroom'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'breakroom') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
/* the sound cues of the scene (scene-local seconds; python3 /tmp/shift_tools/cues.py 19 breakroom), snapped to the video frame nearest each */
const CUE = { beep: [.3, .65, 1.0], sniffle: 9.424, ding: 14.429, sweep: 15.279, bin: [16.079, 16.429], sting: 28.977 };
for (const k in CUE) CUE[k] = Array.isArray(CUE[k]) ? CUE[k].map(snapT) : snapT(CUE[k]);
function key(keys, lt, ease = easeIO) {                                   /* keyframes [[t, v]] (v a number or an array): eased between neighbours */
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const pick = (lt, list) => { for (const [e, v] of list) if (lt < e) return v; return list[list.length - 1][1]; };   /* the first entry whose end time is still ahead */
const F19 = () => (window.F19 && typeof window.F19 === 'object') ? window.F19 : null;
const has19 = name => { const F = F19(); return !!(F && typeof F[name] === 'function'); };
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };       /* the scale at which things are drawn on the screen right now */
/* a screen-space probe of the current transform: where does the point (x, y) land on the frame? */
const toScr = (x, y) => { const m = ctx.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
/* hero text only where the viewer can read it (31 px or more on the screen) and it is clear of the frame edge, the caption zone and the clock pill; everything else is dressing */
function heroAt(x, y, w, h, px) {
  if (px * scrOf(ctx) < 31) return false;
  const a = toScr(x - w / 2, y - h / 2), b = toScr(x + w / 2, y + h / 2), x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
  if (x0 < 56 || x1 > W - 56 || y0 < 56) return false;
  if (y1 > 1368 && y0 < 1712) return false;
  if (x0 < 520 && y0 < 256 && y1 > 104) return false;
  return true;
}

// ------------------------------------------------------------------ the room: constants
const ZB = 2200, HW = 900, CH = 800;
const PERSP = { f: 1400, cy: 760, hy: 880 };
const FRIDGE = { x0: -892, x1: -716, z0: 1950, z1: 2104, h: 478 };
const COUNTER = { x0: -640, x1: -330, z0: 2036, z1: 2192, h: 190 };
const MW = { x: -510, w: 240, h: 128, z0: 2048, d: 128 };                 /* the microwave: centre X, width, height, front plane Z, depth */
const TBL = { x0: -300, x1: 340, z0: 1050, z1: 1172, h: 190 };
const TBL_Z = (TBL.z0 + TBL.z1) / 2;
const CAN = { x: 392, z: 1110, r: 56, h: 160 };
const DOOR = { x0: 716, x1: 880, h: 452 };

// ------------------------------------------------------------------ the room, back to front (every function draws under the perspective camera that is set when it runs)
const wq = (Z, x0, y0, x1, y1) => { const a = p2(x0, y1, Z), b = p2(x1, y0, Z); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; };   /* screen rect [x, y, w, h] of a world rect on the plane Z */
const wpoly = (Z, x0, y0, x1, y1) => [p2(x0, y0, Z), p2(x1, y0, Z), p2(x1, y1, Z), p2(x0, y1, Z)];
/* the state of the room's lights and clock at scene time lt */
function roomState(lt) {
  const ding = lt >= CUE.ding;
  /* the tube over the fridge stutters once Brenda's hand comes round it (b1a), then settles */
  const fl = lt < bS('br1') - .02 ? 1 : (lt < bS('br1') + .9 ? (sr(Math.floor(lt * 14), 5) > .55 ? .35 : 1) : 1);
  const mw = mwState(lt);
  return { lt, ding, flick: fl, clock: ding ? '8:00' : '7:59', mw };
}
/* the microwave: the display text and the lit window. Beeps at CUE.beep: DONE flashes (0.2 s each); idle 0:00; Mango keys in 1:30 while she says "Ninety seconds each." */
function mwState(lt) {
  const be = CUE.beep;
  for (let i = 0; i < be.length; i++) if (lt >= be[i] && lt < be[i] + .2) return { text: 'DONE', lit: 1, flash: 1 - (lt - be[i]) / .2, beep: i };
  if (lt < be[0]) return { text: '0:01', lit: .75, flash: 0 };
  if (lt < be[2] + .2) return { text: '', lit: .15, flash: 0 };          /* between the flashes the display is blank */
  const k0 = bS('q2') + .45, step = .17, n = Math.floor((lt - k0) / step);
  if (lt < k0) return { text: '0:00', lit: 0, flash: 0 };
  return { text: ['0:01', '0:13', '1:30'][Math.min(2, n)], lit: 0, flash: 0, press: n < 4 ? n : -1 };
}
/* dressing text on the room (never hero unless asked: the viewer reads the clock and the display in their own shots) */
const dres = (str, cx, cy, size, o) => UI.label(str, cx, cy, Object.assign({ size, weight: 900, hero: false, crop: true }, o));

function drawShell(ST) {
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#e2e9d8', wain: '#6f9a96', floorA: '#dcd6c3', floorB: '#b4ad96', ceil: '#f1f1eb', fog: '#cbd5c6', fogAmt: .16, tile: 140, bright: 1, rail: 108 });
  /* the ceiling troffers (fluorescent tubes) and the pools they throw on the floor */
  for (const z of [800, 1300, 1800]) for (const x of [-440, 0, 440]) {
    const fl = (x === -440 && z === 1800) ? ST.flick : 1;
    S6.ceilingLamp(x, z, CH, fl, '236,255,244', 118, 190);
    if (fl > .5) { const [fx, fy] = p2(x, 0, z + 95), k = kz(z + 95); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = radial(fx, fy, 0, 330 * k, [[0, 'rgba(236,255,240,.10)'], [1, 'rgba(236,255,240,0)']]); ctx.beginPath(); ctx.ellipse(fx, fy, 330 * k, 70 * k, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  }
}
function drawBackWall(ST) {
  /* a shadow band in the corners and above the wainscot: the wall is flat, the light is flat, so give it a little dirt */
  const [wx, wy, ww, wh] = wq(ZB, -HW, 0, HW, 120);
  ctx.save(); ctx.fillStyle = 'rgba(40,50,40,.05)'; ctx.fillRect(wx, wy + wh * .0, ww, wh * .18); ctx.restore();
}
function drawFridge(ST) {
  const F = FRIDGE, lt = ST.lt;
  box3({ x0: F.x0, x1: F.x1, y1: F.h, z0: F.z0, z1: F.z1, color: '#dfe5e8', top: '#f6f8f8', front: '#eef2f4', side: '#a9b4ba', edge: 'rgba(30,24,30,.6)', lw: 2.4, frontGrad: [[0, '#f6f9fa'], [1, '#d9e0e3']] });
  const Z = F.z0;
  onZ(Z, F.x0, F.x1, 294, 302, 'rgba(70,80,88,.5)');                                   /* the seam between the freezer door and the fridge door */
  onZ(Z, F.x1 - 24, F.x1 - 15, 322, 436, '#8a959c', 'rgba(30,24,30,.5)', 1.6);       /* the two handles */
  onZ(Z, F.x1 - 24, F.x1 - 15, 120, 250, '#8a959c', 'rgba(30,24,30,.5)', 1.6);
  onZ(Z, F.x0, F.x1, 0, 18, '#8d979d');                                                /* the kick plate */
  /* the notes: DO NOT EAT (a printed sheet with a red border), BRENDA 2019 (masking tape across the door, marker), PLEASE LABEL (a printed notice), a few magnets */
  const sc = kz(Z);
  const sheet = (x0, y0, x1, y1, fill, stroke, rot = 0) => { const [x, y, w, h] = wq(Z, x0, y0, x1, y1); ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h); ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(2, 5 * sc); ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4); } ctx.restore(); return [x, y, w, h]; };
  const a = sheet(F.x0 + 22, 336, F.x1 - 40, 420, '#fffdf4', '#c4283a', -.03);
  dres('DO NOT', a[0] + a[2] / 2, a[1] + a[3] * .34, 30 * sc, { fill: '#c4283a', maxW: a[2] * .86 }); dres('EAT', a[0] + a[2] / 2, a[1] + a[3] * .72, 36 * sc, { fill: '#c4283a', maxW: a[2] * .86 });
  const b = sheet(F.x0 + 8, 168, F.x1 - 34, 218, '#e9dba6', null, .025);
  dres('BRENDA 2019', b[0] + b[2] / 2, b[1] + b[3] / 2, 27 * sc, { fill: '#2a2230', font: 'Lucky', weight: 400, maxW: b[2] * .92 });
  const c = sheet(F.x0 + 34, 238, F.x1 - 48, 286, '#f4f7fb', '#3a5fa8', .02);
  dres('PLEASE', c[0] + c[2] / 2, c[1] + c[3] * .33, 17 * sc, { fill: '#3a5fa8', maxW: c[2] * .8 }); dres('LABEL', c[0] + c[2] / 2, c[1] + c[3] * .72, 21 * sc, { fill: '#3a5fa8', maxW: c[2] * .8 });
  for (const [mx, my, col] of [[F.x0 + 20, 428, '#e8433a'], [F.x1 - 46, 322, '#3a7be0'], [F.x0 + 14, 228, '#f2c230']]) { const [px, py] = p2(mx, my, Z); ctx.fillStyle = col; ctx.strokeStyle = 'rgba(30,24,30,.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 7 * sc, 0, TAU); ctx.fill(); ctx.stroke(); }
}
const KEYPOS = [[0, 0], [0, 2], [2, 1], [2, 2]];      /* the four presses (1, 3, 0, START) as [row, col] of the 3 x 3 keypad */
function keyWorld(i) { const X0 = MW.x - MW.w / 2, px0 = X0 + 172, [r, c] = KEYPOS[Math.max(0, Math.min(3, i))]; return [px0 + 9 + c * 18 + 6.5, COUNTER.h + 16 + r * 17 + 5.5]; }
function drawCounter(ST) {
  const C = COUNTER, Z = C.z0;
  box3({ x0: C.x0, x1: C.x1, y1: C.h, z0: C.z0, z1: C.z1, color: '#c8b697', top: '#e9e4d6', front: '#cbb99b', side: '#a89678', edge: 'rgba(30,24,30,.55)', lw: 2.2 });
  for (let i = 0; i < 3; i++) { const x0 = C.x0 + 14 + i * 90, x1 = x0 + 82; onZ(Z, x0, x1, 22, 158, 'rgba(255,255,255,.12)', 'rgba(60,44,30,.45)', 1.6); onZ(Z, x1 - 18, x1 - 12, 96, 130, '#7a6a58'); }
  onZ(Z, C.x0, C.x1, C.h - 14, C.h, 'rgba(255,255,255,.38)');
  /* the coffee maker at the right-hand end: a dark body, a glass pot with a black crust in it, a red power light */
  { const x0 = -372, x1 = -334;
    box3({ x0, x1, y0: C.h, y1: C.h + 112, z0: 2118, z1: 2182, color: '#3a3f48', front: '#454b56', side: '#2a2e36', top: '#4f5662', edge: 'rgba(10,8,14,.7)', lw: 2 });
    onZ(2118, x0 + 8, x1 - 8, C.h + 10, C.h + 62, 'rgba(150,200,210,.5)', 'rgba(10,8,14,.7)', 1.6); onZ(2118, x0 + 10, x1 - 10, C.h + 10, C.h + 22, '#2a1608');
    const [lx, ly] = p2(x1 - 10, C.h + 92, 2118); ctx.fillStyle = '#ff4030'; ctx.beginPath(); ctx.arc(lx, ly, 3.6 * kz(2118), 0, TAU); ctx.fill(); V2.glow(lx, ly, 22 * kz(2118), '255,70,50', .5, 'screen', .2); }
  drawMicrowave(ST);
}
function drawMicrowave(ST) {
  const m = ST.mw, X0 = MW.x - MW.w / 2, X1 = MW.x + MW.w / 2, Y0 = COUNTER.h, Y1 = COUNTER.h + MW.h, Z = MW.z0, k = kz(Z);
  box3({ x0: X0, x1: X1, y0: Y0, y1: Y1, z0: Z, z1: Z + MW.d, color: '#d6dadf', front: '#e8ebee', side: '#a8b0b8', top: '#f0f2f4', edge: 'rgba(30,24,30,.6)', lw: 2.2 });
  const wx0 = X0 + 12, wx1 = X0 + 150, wy0 = Y0 + 14, wy1 = Y1 - 14, win = wpoly(Z, wx0, wy0, wx1, wy1);
  poly(win, grad(0, win[2][1], 0, win[0][1], [[0, '#1b2028'], [1, '#2d343e']]), '#15171c', 3);
  { const [cx, cy] = p2((wx0 + wx1) / 2, wy0 + 12, Z); ctx.fillStyle = 'rgba(210,220,230,.5)'; ctx.beginPath(); ctx.ellipse(cx, cy, 44 * k, 7 * k, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(10,10,14,.6)'; ctx.lineWidth = 1.4; ctx.stroke(); }
  if (m.lit > .01) { ctx.save(); ctx.beginPath(); win.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); const [cx, cy] = p2((wx0 + wx1) / 2, (wy0 + wy1) / 2, Z); ctx.fillStyle = radial(cx, cy, 0, 90 * k, [[0, `rgba(255,214,140,${.8 * m.lit})`], [1, `rgba(255,170,80,${.15 * m.lit})`]]); ctx.fillRect(cx - 100 * k, cy - 70 * k, 200 * k, 140 * k); ctx.restore(); V2.glow(...p2((wx0 + wx1) / 2, (wy0 + wy1) / 2, Z), 190 * k, '255,190,110', .4 * m.lit, 'screen', .3); }
  const hn = wpoly(Z, X0 + 156, Y0 + 14, X0 + 164, Y1 - 14); poly(hn, '#7d868f', 'rgba(20,20,26,.6)', 1.6);
  const px0 = X0 + 172, px1 = X1 - 10, pan = wpoly(Z, px0, Y0 + 12, px1, Y1 - 12); poly(pan, '#2a2e36', '#15171c', 2);
  const dsp = wq(Z, px0 + 8, Y1 - 44, px1 - 8, Y1 - 22); ctx.fillStyle = '#06130a'; ctx.fillRect(dsp[0], dsp[1], dsp[2], dsp[3]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const bx = px0 + 9 + c * 18, by = Y0 + 16 + r * 17, pr = m.press != null && m.press >= 0 && KEYPOS[m.press][0] === r && KEYPOS[m.press][1] === c; const b = wq(Z, bx, by, bx + 13, by + 11); ctx.fillStyle = pr ? '#ffe9a8' : '#8d97a2'; ctx.fillRect(b[0], b[1], b[2], b[3]); }
  if (m.text) { const cx = dsp[0] + dsp[2] / 2, cy = dsp[1] + dsp[3] / 2, size = 21, col = m.text === 'DONE' ? '#ffe46a' : '#58ff7a';
    UI.label(m.text, cx, cy, { size: size * k, weight: 900, font: 'Bangers', fill: col, spacing: 1, maxW: dsp[2] * .9, hero: heroAt(cx, cy, dsp[2], dsp[3], size * k), crop: true, alpha: m.text === 'DONE' ? .55 + .45 * (m.flash || 0) : 1 });
    V2.glow(cx, cy, 40 * k, col === '#58ff7a' ? '88,255,122' : '255,228,106', .45 * (m.text === 'DONE' ? m.flash || 0 : 1), 'screen', .25); }
  if (m.beep != null) { const [bx, by] = p2(MW.x + (m.beep - 1) * 56, COUNTER.h + MW.h + 78 + 8 * m.beep, Z), a = eb(c01((ST.lt - CUE.beep[m.beep]) / .12)); if (a > .05) { ctx.save(); ctx.translate(bx, by); ctx.scale(a, a); UI.label('BEEP', 0, 0, { size: 38 * k, font: 'Bangers', weight: 400, fill: '#ffe135', stroke: '#2a2230', lw: 6 * k + 2, hero: false, crop: true }); ctx.restore(); } }
}
function drawPoster(ST) {
  const r = wq(ZB, -262, 392, -52, 668), k = kz(ZB);
  UI.sign(r, [{ t: 'FOOD SAFETY', size: 25, fill: '#fff', weight: 900 }, { t: 'TWO', size: 62, fill: '#ffe135', font: 'Bangers', weight: 400, gap: 0 }, { t: 'HOURS', size: 62, fill: '#ffe135', font: 'Bangers', weight: 400, gap: 6 }, { t: 'THEN IT IS DISCARDED', size: 12, fill: '#d7f0e0', weight: 900 }],
    { fill: '#1f5a46', stroke: '#fdf6e3', lw: 5, r: 8, pad: 10, id: 'bposter', hero: false, crop: true, shadow: 0 });
  const [cx, cy] = p2(-157, 410, ZB); ctx.save(); ctx.strokeStyle = '#fdf6e3'; ctx.lineWidth = 3.4 * k; ctx.beginPath(); ctx.arc(cx, cy, 15 * k, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 10 * k); ctx.moveTo(cx, cy); ctx.lineTo(cx + 8 * k, cy + 2 * k); ctx.stroke(); ctx.restore();
}
function drawClock(ST) {
  const lt = ST.lt, r = wq(ZB, 128, 548, 372, 676), cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2, k = kz(ZB), pop = lt >= CUE.ding ? Math.max(0, 1 - (lt - CUE.ding) / .22) : 0;
  UI.panel(r, { fill: '#25272d', stroke: '#c9ccd2', lw: 5 * k + 1, r: 10, id: 'bclock', pad: 4, shadow: 0, hero: false });
  ctx.save(); ctx.translate(cx, cy); const sc = 1 + .2 * pop; ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  const size = 84 * k, hero = heroAt(cx, cy, r[2] * .8, r[3] * .6, size);
  V2.glow(cx, cy, 130 * k, '255,70,50', .22 + .35 * pop, 'screen', .3);
  UI.label(ST.clock, cx, cy, { size, font: 'Bangers', weight: 400, fill: pop > .01 ? '#ffd8c8' : '#ff4a3a', spacing: 3, cid: 'bclock', center: true, maxW: r[2] * .84, hero, crop: !hero });
  ctx.restore();
}
function drawDoor(ST) {
  const D = DOOR, k = kz(ZB);
  onZ(ZB, D.x0 - 16, D.x1 + 16, 0, D.h + 16, '#d9d4c2', 'rgba(25,16,30,.55)', 2.4);
  const f = wpoly(ZB, D.x0, 0, D.x1, D.h);
  poly(f, grad(0, f[2][1], 0, f[0][1], [[0, '#fbfff6'], [1, '#dfe9d8']]));
  { const a = p2(D.x0, 120, ZB), b = p2(D.x1, 120, ZB); ctx.strokeStyle = 'rgba(90,110,90,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  { const [gx, gy] = p2((D.x0 + D.x1) / 2, D.h * .55, ZB); V2.glow(gx, gy, 300 * k, '236,255,236', .38, 'screen', .35); }
  { const fa = p2(D.x0, 0, ZB), fb = p2(D.x1, 0, ZB), fc = p2(D.x1 - 40, 0, 1700), fd = p2(D.x0 - 200, 0, 1700); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = grad(0, fa[1], 0, fc[1], [[0, 'rgba(236,255,236,.30)'], [1, 'rgba(236,255,236,0)']]); ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
function drawRoomBase(ST) {
  drawShell(ST); drawBackWall(ST); drawPoster(ST); drawClock(ST); drawDoor(ST);
  /* the nook behind the fridge: a dark slot on the back wall, where Brenda has been since 2019 */
  const F = FRIDGE, [x, y, w, h] = wq(ZB, F.x1 - 12, 0, F.x1 + 62, 420); ctx.save(); ctx.fillStyle = grad(x, 0, x + w, 0, [[0, 'rgba(18,16,24,.62)'], [1, 'rgba(18,16,24,0)']]); ctx.fillRect(x, y, w, h); ctx.restore();
}
// ------------------------------------------------------------------ food: F19 when it has the kind, else a stand-in of the same size and anchors (x, y = bottom centre; s = 1 is about 300 px wide)
const OUT = 'rgba(28,20,14,.78)';
function standIn(kind, o) {
  const s = o.s ?? 1, t = o.t || 0;
  ctx.save(); ctx.translate(o.x || 0, o.y || 0); if (o.rot) ctx.rotate(o.rot); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ink = (lw = 4) => { ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke(); };
  const fillInk = (f, lw) => { ctx.fillStyle = f; ctx.fill(); ink(lw); };
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(24,14,8,.26)'; ctx.beginPath(); ctx.ellipse(0, 2, 136, 14, 0, 0, TAU); ctx.fill(); }
  const BE = '#d9c7a3', BD = '#c4ad84';
  switch (kind) {
    case 'slowcooker': {
      const lid = o.lid || 0;
      rr(-132, -122, 264, 112, 26); fillInk(lg(0, -122, 0, -10, ['#f1ebd9', '#cfc6ae']), 4);
      ctx.fillStyle = '#3d3a40'; ctx.fillRect(-130, -50, 260, 14);
      ctx.beginPath(); ctx.arc(84, -66, 17, 0, TAU); fillInk('#26242a', 3); ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(84, -66); ctx.lineTo(94, -76); ctx.stroke();
      ctx.save(); ctx.translate(lid * 5, -6 * Math.abs(lid) * 1.5); ctx.beginPath(); ctx.moveTo(-120, -120); ctx.quadraticCurveTo(-118, -214, 0, -218); ctx.quadraticCurveTo(118, -214, 120, -120); ctx.closePath(); fillInk('rgba(210,236,244,.55)', 4);
      ctx.fillStyle = '#2a2a30'; rr(-14, -234, 28, 18, 6); ctx.fill(); ctx.restore(); break; }
    case 'turkeyMold': {
      ctx.beginPath(); ctx.ellipse(-8, -78, 110, 62, 0, 0, TAU); fillInk(lg(0, -140, 0, -16, [BE, BD]), 4);
      ctx.beginPath(); ctx.ellipse(104, -134, 24, 28, 0, 0, TAU); fillInk(BE, 4); ctx.beginPath(); ctx.moveTo(124, -134); ctx.lineTo(146, -126); ctx.lineTo(124, -120); ctx.closePath(); fillInk('#c9a56a', 3);
      for (const x of [-64, -14]) { ctx.beginPath(); ctx.ellipse(x, -22, 30, 17, .3, 0, TAU); fillInk(BD, 3.4); }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-30, -112, 56, 14, -.15, 0, TAU); ctx.fill(); break; }
    case 'pieMold': {
      ctx.beginPath(); ctx.moveTo(-130, -56); ctx.lineTo(-122, -6); ctx.quadraticCurveTo(0, 14, 122, -6); ctx.lineTo(130, -56); ctx.closePath(); fillInk(BD, 4);
      ctx.beginPath(); ctx.ellipse(0, -56, 130, 36, 0, 0, TAU); fillInk(lg(0, -92, 0, -20, ['#ece0c6', BE]), 4);
      ctx.strokeStyle = 'rgba(165,143,104,.7)'; ctx.lineWidth = 3; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 30 - 20, -80); ctx.lineTo(i * 30 + 20, -34); ctx.stroke(); } break; }
    case 'casserole': {
      rr(-130, -74, 260, 74, 14); fillInk('rgba(214,238,244,.62)', 4);
      ctx.beginPath(); ctx.moveTo(-136, -74); ctx.lineTo(-118, -104); ctx.lineTo(118, -104); ctx.lineTo(136, -74); ctx.closePath(); fillInk(lg(0, -104, 0, -74, ['#f4f6f8', '#aab2bc']), 3.4);
      ctx.strokeStyle = 'rgba(80,90,100,.5)'; ctx.lineWidth = 2; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 28, -102); ctx.lineTo(i * 31, -76); ctx.stroke(); } break; }
    case 'pizzaBox': {
      ctx.beginPath(); ctx.moveTo(-142, -34); ctx.lineTo(142, -34); ctx.lineTo(142, 0); ctx.lineTo(-142, 0); ctx.closePath(); fillInk('#c99d62', 4);
      ctx.beginPath(); ctx.moveTo(-142, -34); ctx.lineTo(-118, -58); ctx.lineTo(166, -58); ctx.lineTo(142, -34); ctx.closePath(); fillInk('#e4c48f', 4);
      ctx.fillStyle = '#c4283a'; ctx.fillRect(-100, -22, 200, 8); ctx.fillStyle = 'rgba(120,70,20,.3)'; ctx.beginPath(); ctx.ellipse(30, -48, 40, 6, 0, 0, TAU); ctx.fill(); break; }
    case 'salad': {
      ctx.beginPath(); ctx.moveTo(-124, -66); ctx.quadraticCurveTo(-110, 0, 0, 0); ctx.quadraticCurveTo(110, 0, 124, -66); ctx.closePath(); fillInk(lg(0, -66, 0, 0, ['#b98048', '#8c5a2c']), 4);
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-100 + i * 25, -72 - 14 * Math.sin(i * 1.3), 30, 18, (i % 3 - 1) * .5, 0, TAU); fillInk(['#58b83a', '#7ad04a', '#3f9a3a'][i % 3], 3); }
      ctx.fillStyle = '#e8433a'; ctx.beginPath(); ctx.arc(-30, -96, 9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(40, -90, 8, 0, TAU); ctx.fill(); break; }
    case 'rolls': case 'basket': {
      ctx.beginPath(); ctx.moveTo(-130, -70); ctx.lineTo(-108, 0); ctx.lineTo(108, 0); ctx.lineTo(130, -70); ctx.closePath(); fillInk('#b8863f', 4);
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-92 + i * 46, -84 - (i % 2) * 12, 30, 24, 0, 0, TAU); fillInk('#e2a95a', 3.4); }
      ctx.beginPath(); ctx.moveTo(-130, -70); ctx.lineTo(130, -70); ctx.lineTo(124, -44); ctx.lineTo(-124, -44); ctx.closePath(); fillInk('#d9433a', 3.4); break; }
    default: { ctx.beginPath(); ctx.ellipse(0, -30, 80, 30, 0, 0, TAU); fillInk(BE, 4); }
  }
  ctx.restore();
}
function lg(x0, y0, x1, y1, cols) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); return g; }
const SIZE_CACHE = {};
function dishInfo(kind) {                         /* native width and height at s = 1 */
  const F = F19();
  if (F && F.kinds && F.kinds[kind]) { const k = 'F' + kind; return SIZE_CACHE[k] || (SIZE_CACHE[k] = F.info(kind, { s: 1 })); }
  return { w: 300, h: kind === 'slowcooker' ? 236 : kind === 'pizzaBox' ? 60 : kind === 'pieMold' || kind === 'casserole' ? 100 : kind === 'rolls' || kind === 'basket' ? 120 : 150 };
}
function dishAt(kind, o) {
  const F = F19();
  if (F && F.kinds && F.kinds[kind]) return F.dish(ctx, kind, o);
  return standIn(kind, o);
}
/* a billboard standing on a world point: origin at its base, 1 unit = 1 world unit, up is -y */
function atWorld(X, Y, Z, fn) { const [x, y] = p2(X, Y, Z), k = kz(Z); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(k); ctx.restore(); }

// ------------------------------------------------------------------ the potluck table, its leftovers, THE SWEEP, and the trash can the sweep lands in
const ITEMS = [   /* left to right; w = the width on the table; the leftmost is pushed first and falls last (the slow cooker: the bin at 16.079) */
  { id: 'slow',   kind: 'slowcooker', x: -259, w: 86, hh: 76, spin: -.05 },
  { id: 'rolls',  kind: 'rolls',      x: -167, w: 80, hh: 56, spin: 1.7 },
  { id: 'turkey', kind: 'turkeyMold', x: -75, w: 88, hh: 66, spin: -2.1 },
  { id: 'pie',    kind: 'pieMold',    x: 17, w: 84, hh: 40, spin: 2.6 },
  { id: 'cass',   kind: 'casserole',  x: 109, w: 88, hh: 46, spin: -1.6 },
  { id: 'pizza',  kind: 'pizzaBox',   x: 201, w: 92, hh: 22, spin: 1.1 },
  { id: 'salad',  kind: 'salad',      x: 293, w: 80, hh: 48, spin: -2.4 },
];
const PILE = [[0, 62], [12, 50], [-8, 38], [14, 27], [-12, 16], [8, 4], [-6, -6]];     /* where each lands in the can, by ITEMS index: [x offset from the can's axis, height above the can's mouth] */
const SW = { t0: CUE.sweep, dur: .9, pf0: -352, pf1: 372, wind: .1 };
const swS = u => 1 - (1 - c01(u)) * (1 - c01(u));
const pfAt = lt => SW.pf0 + (SW.pf1 - SW.pf0) * swS((lt - SW.t0) / SW.dur);
function chainL(pf) {                                         /* left edges of the items when the plow's face is at pf: each is pushed by its left neighbour */
  const E = []; let right = pf;
  for (let i = 0; i < ITEMS.length; i++) { const it = ITEMS[i], L = Math.max(it.x - it.w / 2, right + 2); E.push(L); right = L + it.w; }
  return E;
}
const DEP = (() => {                                          /* the time each item's centre crosses the table's right end (it tips off), found once by stepping the plow */
  const out = ITEMS.map(() => SW.t0 + SW.dur);
  for (let t = SW.t0; t < SW.t0 + SW.dur + .4; t += 1 / 480) { const E = chainL(pfAt(t)); ITEMS.forEach((it, i) => { if (out[i] >= SW.t0 + SW.dur && E[i] + it.w / 2 > TBL.x1 - 8) out[i] = t; }); }
  return out;
})();
const LAND = ITEMS.map((it, i) => i === 0 ? CUE.bin[0] : Math.min(CUE.bin[0] - .02, DEP[i] + .12 + .03 * i));
const PLATE_LAND = CUE.bin[1];
/* one item at scene time lt: its place on the table, or in flight, or in the heap */
function itemAt(i, lt) {
  const it = ITEMS[i];
  if (lt < SW.t0) return { x: it.x, y: 0, rot: 0, st: 'table', on: true };
  const E = chainL(pfAt(lt)), xT = E[i] + it.w / 2, td = DEP[i], tl = LAND[i];
  if (lt < td) { const sp = Math.abs(pfAt(lt + .02) - pfAt(lt - .02)) / .04; return { x: xT, y: 0, rot: -Math.min(.05, sp / 24000), st: 'push', on: true }; }
  const pl = PILE[i], tx = CAN.x + pl[0], ty = CAN.h + pl[1] - 4, u = c01((lt - td) / (tl - td)), xd = TBL.x1 - 8;
  if (lt < tl) return { x: mixv(xd, tx, ease3(u)), y: mixv(0, ty - TBL.h, u * u) + 24 * Math.sin(PI * u) * (i > 0 ? 1 : .15), rot: it.spin * u, st: 'fly', on: true, u, lid: i === 0 ? Math.sin(u * 40) * (1 - u * .4) : 0 };
  const a = lt - tl, hop = a < .22 ? 9 * Math.sin(PI * a / .22) * (1 - a / .22) * (i === 0 ? 1.6 : 1) : 0;
  return { x: tx, y: ty - TBL.h + hop, rot: it.spin + (i % 2 ? .1 : -.12), st: 'heap', on: true, lid: i === 0 && a < .5 ? Math.sin(a * 46) * Math.exp(-a * 6) * 1.4 : 0, a };
}
const ease3 = u => 1 - Math.pow(1 - c01(u), 2.2);

function drawTable(ST) {
  const T = TBL, lt = ST.lt;
  for (const x of [T.x0 + 26, T.x1 - 26]) for (const z of [T.z0 + 12, T.z1 - 12]) box3({ x0: x - 5, x1: x + 5, y1: T.h - 6, z0: z - 5, z1: z + 5, color: '#585e66', lw: 1 });
  box3({ x0: T.x0, x1: T.x1, y0: 34, y1: T.h, z0: T.z0, z1: T.z1, color: '#f2f0e6', top: '#fbfaf5', front: '#ece9dd', side: '#d1cec1', edge: 'rgba(40,30,30,.5)', lw: 2.2 });
  const Z = T.z0, k = kz(Z);
  /* the cloth: a red check along the hem, a scalloped lip, a paper banner taped on the front (dressing) */
  for (let i = 0; i < 40; i++) { const x0 = T.x0 + i * 16; onZ(Z, x0, x0 + 16, 34, 50, i % 2 ? '#d9433a' : '#f7d8d2'); }
  onZ(Z, T.x0, T.x1, 50, 53, 'rgba(120,40,30,.4)'); onZ(Z, T.x0, T.x1, T.h - 10, T.h, 'rgba(255,255,255,.45)');
  const bn = wq(Z, T.x0 + 150, 76, T.x0 + 500, 150);
  UI.sign(bn, [{ t: 'FUN COMMITTEE POTLUCK', size: 21, fill: '#7a2f10', weight: 900 }, { t: 'BRING A DISH. BRING ROLLS.', size: 14, fill: '#a0521f', weight: 800 }], { fill: '#ffe9b0', stroke: '#d9792b', lw: 4, r: 6, pad: 6, id: 'btable', hero: false, crop: true, shadow: 0 });
}
function drawItems(ST) {
  const lt = ST.lt;
  for (let i = 0; i < ITEMS.length; i++) {
    const it = ITEMS[i], st = itemAt(i, lt), inf = dishInfo(it.kind), s = it.w / inf.w, hh = inf.h * s * .5;
    atWorld(st.x, TBL.h + st.y, TBL_Z, () => {
      ctx.translate(0, -hh); ctx.rotate(st.rot); ctx.translate(0, hh);
      dishAt(it.kind, { x: 0, y: 0, s, t: lt, seed: 3 + i, lid: st.lid || 0, steam: it.kind === 'slowcooker' || it.kind === 'turkeyMold' ? .35 : 0, shadow: st.st === 'table' || st.st === 'push' });
      if (it.id === 'turkey') probe(st);
    });
  }
}
/* the probe thermometer standing in the turkey: a steel rod and a small digital head reading 78 F (world units of the item's frame, so it travels with the item; the text is drawn only while the item is nearly level: no tilted text) */
function probe(st) {
  ctx.save(); ctx.translate(-6, -46); ctx.rotate(-.02);
  ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 5.2; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -34); ctx.stroke(); ctx.strokeStyle = '#c9ced4'; ctx.lineWidth = 2.8; ctx.stroke();
  ctx.fillStyle = '#2a2e36'; rr(-20, -64, 40, 30, 5); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.fillStyle = '#9fd9a8'; rr(-16, -60, 32, 16, 3); ctx.fill();
  ctx.fillStyle = '#ff5a40'; ctx.beginPath(); ctx.arc(-11, -38.5, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#7e8a96'; ctx.beginPath(); ctx.arc(2, -38.5, 2.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11, -38.5, 2.2, 0, TAU); ctx.fill();
  if (st.st === 'table' || st.st === 'push') { const hero = heroAt(0, -52, 30, 14, 13); UI.label('78 F', 0, -52, { size: 13, weight: 900, font: 'Bangers', fill: '#0c2a14', spacing: .5, maxW: 29, hero, crop: !hero }); }
  ctx.restore();
}

/* the can and its bag. canBack = the inside and the bag's back; the heap (drawItems for landed items) goes between; canFront = the body and the bag's drape over the rim. Hits at 16.079 and 16.429 squash it. */
const heapCount = lt => ITEMS.filter((_, i) => lt >= LAND[i]).length + (lt >= PLATE_LAND ? 1 : 0);
function canK(lt) {
  const hit = (t0, a) => lt < t0 ? 0 : a * Math.sin((lt - t0) * 34) * Math.exp(-(lt - t0) / .11);
  return hit(CUE.bin[0], .07) + hit(CUE.bin[1], .045);
}
function drawCanBack(ST) {
  const lt = ST.lt, q = canK(lt);
  atWorld(CAN.x, 0, CAN.z, () => {
    const r = CAN.r, h = CAN.h, ry = r * .28;
    ctx.fillStyle = 'rgba(20,14,10,.28)'; ctx.beginPath(); ctx.ellipse(0, 4, r * 1.25, ry * .9, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(0, -h); ctx.scale(1 - q * .6, 1 + q);
    ctx.fillStyle = '#16141a'; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.02, ry, 0, 0, TAU); ctx.fill();
    /* the bag's back: a crumpled black dome standing up behind the heap */
    const bagH = 44 + 5 * heapCount(lt);
    ctx.beginPath(); ctx.moveTo(-r * 1.08, 0); ctx.bezierCurveTo(-r * 1.2, -bagH * .9, -r * .5, -bagH * 1.1, -r * .2, -bagH * .96); ctx.bezierCurveTo(r * .1, -bagH * 1.12, r * .9, -bagH * .9, r * 1.1, 0); ctx.closePath();
    ctx.fillStyle = grad(0, -bagH, 0, 0, [[0, '#4a4650'], [1, '#17151b']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  });
}
function drawCanFront(ST) {
  const lt = ST.lt, q = canK(lt);
  atWorld(CAN.x, 0, CAN.z, () => {
    const r = CAN.r, h = CAN.h, ry = r * .28;
    ctx.save(); ctx.scale(1 + q * .5, 1 - q * .25);
    /* the steel body, narrowing a little toward the floor, with the front half of the rim and the bag folded over it */
    ctx.beginPath(); ctx.moveTo(-r, -h); ctx.lineTo(-r * .9, -6); ctx.ellipse(0, -6, r * .9, ry * .8, 0, PI, 0, true); ctx.lineTo(r, -h); ctx.ellipse(0, -h, r, ry, 0, 0, PI); ctx.closePath();
    ctx.fillStyle = grad(-r, 0, r, 0, [[0, '#b9c1c8'], [.45, '#e6eaee'], [1, '#8d969e']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(60,70,80,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -h * .55, r * .96, ry * .9, 0, 0, PI); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -h * .2, r * .93, ry * .85, 0, 0, PI); ctx.stroke();
    ctx.fillStyle = '#26272d'; ctx.fillRect(-4, -h * .9, 8, 14);
    /* the bag's drape over the front of the rim */
    ctx.beginPath(); ctx.moveTo(-r * 1.04, -h - 2); ctx.bezierCurveTo(-r * .6, -h + ry * 2.4, -r * .2, -h + ry * 2.9, 0, -h + ry * 2.6); ctx.bezierCurveTo(r * .3, -h + ry * 3.1, r * .7, -h + ry * 2.3, r * 1.04, -h - 2); ctx.bezierCurveTo(r * .6, -h + ry * 1.1, -r * .6, -h + ry * 1.1, -r * 1.04, -h - 2); ctx.closePath();
    ctx.fillStyle = grad(0, -h, 0, -h + ry * 3, [[0, '#4b4750'], [1, '#17151b']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  });
}
// ------------------------------------------------------------------ accessories and held props (names fp19b_*; text only through the UI kit, set dressing unless the prop is drawn big in an insert)
const YI = o => (window.V2C && V2C.yawInfo) ? V2C.yawInfo(o) : null;
const yawOf = o => { const Y = YI(o); return Y ? Y.y : (o.yaw || 0); };
const SCRUBS = { teal: ['#86d8cf', '#3aa398', '#22685f'], navy: ['#8aa3dc', '#3a5bb0', '#223a78'], plum: ['#cfa4e0', '#9348b0', '#5e2a78'], pink: ['#f8b3cb', '#e0568a', '#9a2f5c'], maroon: ['#df8f98', '#a8323f', '#6a1a24'], orange: ['#ffc891', '#f08a2a', '#a8530f'], green: ['#a6e096', '#4cae4a', '#2b742c'], gray: ['#c7ced6', '#7e8896', '#4c5460'] };
/* coloured scrubs that fit ANY kind (they hang off mouthY / mw / the shoulders and turn with the yaw): o.scrubs names the colour */
EXT.acc.fp19b_scrubs = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  const yaw = yawOf(o), ca = Math.cos(yaw), sa = Math.sin(yaw), top = o.scrubsTop ?? (k.mouthY + Math.max(22, (k.mw || 24) * .9) + 14), R = k.rx, cx = R * .9 * sa, X = x => cx + x * ca;
  const [c0, c1, c2] = SCRUBS[o.scrubs || 'teal'] || SCRUBS.teal, dk = 'rgba(12,20,30,.62)', hi = 'rgba(255,255,255,.7)';
  ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  ctx.fillStyle = V2.grad(0, top, 0, Math.max(k.ry, top + 40), [[0, c0], [.5, c1], [1, c2]]); ctx.beginPath();
  const bot = k.ry * 1.4 + 40;
  if (ca > .05) { ctx.moveTo(-R * 1.3, top + 12); ctx.lineTo(X(-24), top); ctx.lineTo(X(0), top + 36); ctx.lineTo(X(24), top); ctx.lineTo(R * 1.3, top + 12); }
  else { ctx.moveTo(-R * 1.3, top + 10); ctx.quadraticCurveTo(cx, top - 14, R * 1.3, top + 10); }
  ctx.lineTo(R * 1.3, bot); ctx.lineTo(-R * 1.3, bot); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,20,30,.22)'; ctx.lineWidth = 2; for (let x = -R; x <= R; x += 15) { ctx.beginPath(); ctx.moveTo(x, top + 26); ctx.lineTo(x * 1.03, k.ry * 1.3); ctx.stroke(); }
  if (ca > .05) {
    ctx.strokeStyle = dk; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(-24), top); ctx.lineTo(X(0), top + 36); ctx.lineTo(X(24), top); ctx.stroke();
    ctx.strokeStyle = hi; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(-18), top + 3); ctx.lineTo(X(0), top + 27); ctx.lineTo(X(18), top + 3); ctx.stroke();
    ctx.save(); ctx.translate(X(-R * .46), top + 50); ctx.fillStyle = c1; ctx.strokeStyle = dk; ctx.lineWidth = 2.4; rr(-19 * ca - 1, -4, 38 * ca + 2, 32, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8e2d0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; rr(-6 * ca, -17, 4.4, 28, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a6fdb'; ctx.fillRect(-6 * ca, -13, 4.4, 4); ctx.restore();
  }
  ctx.restore();
};
/* a paper party hat that pops onto the head: o.hat = { c1, c2, rot, dx, dy, s }, o.hatPop 0..1 (overshoots; nothing under .02) */
EXT.acc.fp19b_hat = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const h = o.hat || {}, pop = o.hatPop == null ? 1 : o.hatPop, pk = eb(c01(pop)); if (pk < .03) return;
  const sc = (h.s || 1) * k.rx / 110 * pk, c1 = h.c1 || '#ff4f9a', c2 = h.c2 || '#ffe135';
  ctx.save(); ctx.translate((h.dx ?? .3) * k.rx, -k.ry * (h.dy ?? .92)); ctx.rotate((h.rot ?? .3) + .03 * Math.sin(t * 2.1 + (o.seed || 0)) + (1 - c01(pop)) * .8);
  ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath();
  ctx.fillStyle = V2.grad(-31 * sc, 0, 31 * sc, 0, [[0, V2.rgba(V2.mix(c1, '#ffffff', .25), 1)], [.5, c1], [1, V2.rgba(V2.mix(c1, '#2a1030', .35), 1)]]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = c2; ctx.lineWidth = 9 * sc; for (let i = -3; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-40 * sc, i * 24 * sc); ctx.lineTo(40 * sc, i * 24 * sc - 34 * sc); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * Math.max(.8, sc); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = c2; ell(0, 3 * sc, 33 * sc, 6 * sc); ctx.fill(); ctx.stroke();
  const pr = 9 * sc; ctx.fillStyle = V2.radial(-3 * sc, -100 * sc, 1, pr * 1.4, [[0, '#ffffff'], [1, c2]]); ell(0, -97 * sc, pr, pr); ctx.fill(); ctx.stroke();
  ctx.restore();
};
(() => {
  if (!(window.V2C && V2C.YAW_ACC && V2C.ACC_CLS)) return;
  const own = (name, cls) => { const f = (o, k, t, layer) => EXT.acc[name](o, k, t, layer); f.cls = cls; V2C.YAW_ACC[name] = f; };
  own('fp19b_scrubs', 'wrap'); V2C.ACC_CLS.fp19b_hat = 'head';
})();

/* a paper plate in the hand: o.plateItems (kinds), o.plateStickers (F19.sticker records), o.plateScale. F19.dish('plate') when it has landed, else a plate and three blobs */
EXT.prop.fp19b_plate = (side, o, t) => {
  const S = o.plateScale || 1, items = o.plateItems || [], F = F19();
  ctx.save(); ctx.rotate(o.plateTilt || 0); ctx.scale(S, S);
  if (F && F.kinds && F.kinds.plate) F.dish(ctx, 'plate', { x: 0, y: 8, s: 120 / 300, t, items, itemScale: o.plateItemScale || 1, stickers: o.plateStickers || [], seed: o.plateSeed || 1, steam: 0, shadow: false });
  else {
    ctx.lineJoin = 'round'; ctx.fillStyle = '#fbfbf8'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ell(0, 2, 60, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ecece4'; ell(0, 1, 42, 7); ctx.fill();
    items.slice(0, 3).forEach((it, i) => { ctx.fillStyle = it === 'roll' ? '#e2a95a' : '#d9c7a3'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ell(-26 + i * 26, -12 - (i % 2) * 5, 17, 11); ctx.fill(); ctx.stroke(); });
  }
  ctx.restore();
};
PROP_BOX.fp19b_plate = o => { const S = o.plateScale || 1; return Object.assign([-66 * S, -62 * S, 66 * S, 18 * S], { nearFace: true }); };

/* Onion's stopwatch: a silver case, a crown, a white face with the running time (set dressing at this size; the insert draws it big) */
function drawStopwatch(c, o) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = '#aab3bd'; rr(-7, -62, 14, 14, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
  c.fillStyle = '#aab3bd'; c.save(); c.translate(26, -50); c.rotate(.7); rr(-4, -9, 8, 16, 3); c.fill(); c.stroke(); c.restore();
  c.beginPath(); c.arc(0, -20, 34, 0, TAU); c.fillStyle = V2.grad(-34, -54, 34, 14, [[0, '#f4f6f8'], [1, '#848f9b']]); c.fill(); c.lineWidth = 3; c.stroke();
  c.beginPath(); c.arc(0, -20, 27, 0, TAU); c.fillStyle = o.flash ? '#fff4c8' : '#fbfbf6'; c.fill(); c.lineWidth = 1.8; c.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.strokeStyle = 'rgba(30,30,40,.6)'; c.lineWidth = i % 3 ? 1.2 : 2.2; c.beginPath(); c.moveTo(Math.sin(a) * 22, -20 - Math.cos(a) * 22); c.lineTo(Math.sin(a) * 26, -20 - Math.cos(a) * 26); c.stroke(); }
  const sa = (o.sec || 0) / 60 * TAU; c.strokeStyle = '#d6203a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -20); c.lineTo(Math.sin(sa) * 22, -20 - Math.cos(sa) * 22); c.stroke();
  c.restore();
}
EXT.prop.fp19b_stopwatch = (side, o, t) => {
  const S = o.swScale || 1; ctx.save(); ctx.rotate(o.swTilt || 0); ctx.scale(S, S);
  drawStopwatch(ctx, { sec: o.swSec, flash: o.swFlash });
  UI.label(o.swText || '1:59:50', 0, -20, { size: 12, weight: 900, font: 'Bangers', fill: '#1a1a22', spacing: .4, maxW: 42, hero: false });
  ctx.restore();
};
PROP_BOX.fp19b_stopwatch = o => { const S = o.swScale || 1; return Object.assign([-36 * S, -66 * S, 36 * S, 16 * S], { nearFace: true }); };

/* Tomato's sheet of paper party hats: a printed page with six cones and a dotted cut line */
EXT.prop.fp19b_hatsheet = (side, o, t) => {
  const S = o.hatsScale || 1; ctx.save(); ctx.rotate(o.hatsRot ?? -.1); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-35, -88, 76, 100); ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.6; ctx.fillRect(-38, -92, 76, 100); ctx.strokeRect(-38, -92, 76, 100);
  const cols = ['#ff4f9a', '#4aa8ff', '#ffe135', '#58c85a', '#c25bd6', '#ff9a2a'];
  for (let i = 0; i < 6; i++) { const cx = -20 + (i % 2) * 40, cy = -66 + Math.floor(i / 2) * 30; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.moveTo(cx - 12, cy + 10); ctx.lineTo(cx, cy - 16); ctx.lineTo(cx + 12, cy + 10); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke(); }
  ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(60,60,70,.55)'; ctx.lineWidth = 1.2; ctx.strokeRect(-34, -88, 68, 92); ctx.setLineDash([]);
  ctx.restore();
};
PROP_BOX.fp19b_hatsheet = o => { const S = o.hatsScale || 1; return Object.assign([-42 * S, -96 * S, 42 * S, 12 * S], { nearFace: true }); };

/* Brenda's lunchbox (a faded tin box, a date sticker: 2019, dust and a cobweb) and the sandwich in it. Local frame: origin = the middle of the bottom edge, up is -y. o.open 0..1 lifts the lid. o.hero for the big insert */
function drawLunchbox(c, o = {}) {
  const hero = o.hero === true, open = c01(o.open || 0);
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = '#6a6a72'; c.lineWidth = 6; c.beginPath(); c.moveTo(-26, -60); c.quadraticCurveTo(0, -88 - 4 * open, 26, -60); c.stroke(); c.strokeStyle = '#a4a4ac'; c.lineWidth = 3; c.stroke();   /* the handle */
  c.save(); if (open > 0) { c.translate(-52, -52); c.rotate(-open * 1.9); c.translate(52, 52); }
  rr(-52, -64, 104, 16, 5); c.fillStyle = V2.grad(0, -64, 0, -48, [[0, '#7fb4c2'], [1, '#5a8e9c']]); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke(); c.restore();   /* the lid */
  rr(-52, -50, 104, 50, 6); c.fillStyle = V2.grad(0, -50, 0, 0, [[0, '#6aa3b2'], [1, '#456f7c']]); c.fill(); c.stroke();
  c.fillStyle = 'rgba(150,80,40,.35)'; c.beginPath(); c.ellipse(-30, -8, 14, 6, .2, 0, TAU); c.fill(); c.beginPath(); c.ellipse(34, -40, 8, 4, -.3, 0, TAU); c.fill();   /* rust */
  c.fillStyle = '#d9d2c0'; rr(-8, -52, 16, 8, 2); c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();                                         /* the clasp */
  c.save(); c.translate(0, -26); c.rotate(-.05); c.fillStyle = '#fffdf2'; c.strokeStyle = OUT; c.lineWidth = 2.6; rr(-34, -20, 68, 40, 3); c.fill(); c.stroke();   /* the date sticker */
  if (!o.noText) { UI.label('2019', 0, -6, { size: 26, font: 'Lucky', weight: 400, fill: '#c4283a', maxW: 60, hero, crop: !hero, id: o.id });
  UI.label('BRENDA', 0, 13, { size: 9, weight: 900, fill: '#2a2230', spacing: 1.4, maxW: 58, hero: false, crop: true }); }
  c.restore();
  c.fillStyle = 'rgba(210,205,196,.5)'; c.beginPath(); c.moveTo(-52, -64); c.lineTo(52, -64); c.lineTo(52, -56); c.quadraticCurveTo(0, -48, -52, -56); c.closePath(); c.fill();     /* dust on the lid */
  c.strokeStyle = 'rgba(236,240,238,.7)'; c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-52 + i * 4, -64); c.quadraticCurveTo(-30 + i * 6, -30 + i * 6, -44, 2 + i * 3); c.stroke(); }
  c.restore();
}
EXT.prop.fp19b_lunch = (side, o, t) => { const S = o.lunchScale || .75; ctx.save(); ctx.rotate(o.lunchTilt || 0); ctx.scale(S, S); drawLunchbox(ctx, { open: o.lunchOpen || 0, noText: o.lunchNoText }); ctx.restore(); };
PROP_BOX.fp19b_lunch = o => { const S = o.lunchScale || .75; return Object.assign([-56 * S, -90 * S, 56 * S, 4 * S], { nearFace: true }); };
/* the 2019 sandwich: two slices of toast-coloured bread with lettuce gone to paper, cheese and a tomato slice. Local frame: origin = the middle of the bottom edge. o.half 'L' | 'R' draws one torn half (its torn edge zig-zags down the middle, o.pull spreads the two) */
function drawSandwich(c, o = {}) {
  const whole = () => {
    c.fillStyle = '#d6b27a'; c.strokeStyle = OUT; c.lineWidth = 3; rr(-38, -12, 76, 14, 5); c.fill(); c.stroke();                       /* the lower slice */
    c.fillStyle = '#c9a85a'; c.beginPath(); c.moveTo(-36, -12); for (let i = 0; i <= 9; i++) c.lineTo(-36 + i * 8, -12 - 6 - (i % 2) * 4); c.lineTo(36, -12); c.closePath(); c.fill(); c.stroke();   /* lettuce, dried */
    c.fillStyle = '#e8923a'; rr(-37, -22, 74, 6, 2); c.fill(); c.stroke();                                                               /* cheese */
    c.fillStyle = '#bb6a52'; rr(-32, -28, 64, 6, 3); c.fill(); c.stroke();                                                               /* tomato, gone brown */
    c.fillStyle = '#dcb982'; rr(-39, -42, 78, 15, 6); c.fill(); c.stroke();                                                              /* the top slice */
    c.fillStyle = 'rgba(255,255,255,.28)'; rr(-30, -39, 46, 4, 2); c.fill();
  };
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  if (!o.half) whole();
  else {
    const L = o.half === 'L', zig = []; for (let i = 0; i <= 8; i++) zig.push([(i % 2 ? 3 : -3), -46 + i * 6.5]);
    c.save(); c.beginPath(); c.moveTo(L ? -60 : 60, -50); zig.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(L ? -60 : 60, 8); c.closePath(); c.clip(); c.translate(L ? -(o.pull || 0) : (o.pull || 0), 0); whole(); c.restore();
    c.strokeStyle = 'rgba(120,80,40,.6)'; c.lineWidth = 2; c.beginPath(); zig.forEach(([x, y], i) => i ? c.lineTo(x + (L ? -(o.pull || 0) : (o.pull || 0)), y) : c.moveTo(x + (L ? -(o.pull || 0) : (o.pull || 0)), y)); c.stroke();
  }
  c.restore();
}
EXT.prop.fp19b_sandwich = (side, o, t) => {
  const S = o.sandScale || .9, m = o.sandMode || 'whole', h = m === 'torn' ? (side < 0 ? 'L' : 'R') : (m === 'L' || m === 'R' ? m : null);
  ctx.save(); ctx.rotate(o.sandTilt || 0); ctx.scale(S, S); ctx.translate(h === 'L' ? 18 : h === 'R' ? -18 : 0, 0); drawSandwich(ctx, { half: h, pull: o.sandPull || 0 }); ctx.restore();
};
PROP_BOX.fp19b_sandwich = o => { const S = o.sandScale || .9, w = (o.sandMode && o.sandMode !== 'whole') ? 28 : 42; return Object.assign([-w * S, -46 * S, w * S, 6 * S], { nearFace: true }); };

// ------------------------------------------------------------------ the queue: slot j stands at X = QX0 + QDX * j along the back wall; three beeps move everybody up one slot (STEP_T each); the first three are served and walk away
const QX0 = -330, QDX = 92, QZ = 1990, STEP_T = .3;
const stepsAt = lt => CUE.beep.reduce((s, b) => s + ss(lt, b, b + STEP_T), 0);                    /* 0..3 */
const qX = u => QX0 + QDX * u;
const qZf = u => QZ - 22 * (.5 - .5 * Math.cos(PI * u)) + 44 * Math.max(0, u - 10);
const qPos = (j, lt) => { const u = j - stepsAt(lt); return [qX(u), qZf(u)]; };
const lerpPts = (pts, k) => { const n = pts.length - 1, f = c01(k) * n, i = Math.min(n - 1, Math.floor(f)), r = f - i; return [mixv(pts[i][0], pts[i + 1][0], r), mixv(pts[i][1], pts[i + 1][1], r)]; };
/* the served: stand at the head of the line until their beep, then leave toward the camera and out of the frame at the left */
const exitRoute = (j, lt) => { const b = CUE.beep[j]; if (lt < b) return qPos(j, lt); const k = (lt - b) / 1.7; return lerpPts([[qX(0), qZf(0)], [-440, 1790], [-610, 1570], [-840, 1490], [-1060, 1470]], easeIO(c01(k)) * .4 + c01(k) * .6); };
const EXTRAS = [   /* [kind, scrubs, seed, start slot, hat colours, plate items]; Mango stands at slot 3, Lemon at 5, Strawberry at 9: the audited cast is never shoulder to shoulder */
  { id: 'e1', kind: 'apple', scrubs: 'teal', seed: 301, slot: 0, leaver: 0, items: ['turkeySlices', 'roll'], hat: ['#ff4f9a', '#ffe135'] },
  { id: 'e2', kind: 'grape', scrubs: 'navy', seed: 302, slot: 1, leaver: 1, items: ['roll', 'pieMold'], hat: ['#4aa8ff', '#ffffff'] },
  { id: 'e3', kind: 'kiwi', scrubs: 'maroon', seed: 303, slot: 2, leaver: 2, items: ['turkeyMold'], hat: ['#58c85a', '#ffe135'] },
  { id: 'e4', kind: 'cherry', scrubs: 'plum', seed: 304, slot: 4, items: ['roll', 'turkeyMold'], hat: ['#ffe135', '#ff4f9a'] },
  { id: 'e5', kind: 'blue', scrubs: 'orange', seed: 305, slot: 5, items: ['pieMold'], hat: ['#c25bd6', '#ffe135'] },
  { id: 'e6', kind: 'fig', scrubs: 'green', seed: 306, slot: 7, items: ['roll', 'roll', 'pieMold'], hat: ['#ff9a2a', '#ffffff'] },
  { id: 'e7', kind: 'gfruit', scrubs: 'pink', seed: 307, slot: 8, items: ['turkeyMold', 'roll'], hat: ['#4aa8ff', '#ffe135'] },
  { id: 'e8', kind: 'coco', scrubs: 'gray', seed: 308, slot: 10, items: ['roll'], hat: ['#ff4f9a', '#ffffff'] },
  { id: 'e9', kind: 'pine', scrubs: 'teal', seed: 309, slot: 11, items: ['pieMold', 'roll'], hat: ['#58c85a', '#ff4f9a'] },
  { id: 'e10', kind: 'banana', scrubs: 'navy', seed: 310, slot: 12, items: ['roll', 'turkeyMold'], hat: ['#ffe135', '#c25bd6'] },
  { id: 'e11', kind: 'lime', scrubs: 'plum', seed: 311, slot: 13, items: ['turkeySlices'], hat: ['#ff9a2a', '#4aa8ff'] },
];
/* the crowd's heads: facing the microwave; at the ding everyone looks at Onion (the table, to the right); at 18.30 the whole room snaps round to the fridge */
const T_LOOK = snapT(CUE.ding + .2), T_SNAP = snapT(bS('br1') + .05), T_HAT = wS('q4', 2);
function crowdHead(lt, ph) {
  return key([[0, -.95], [T_LOOK + ph, -.95], [T_LOOK + ph + .28, .55], [T_SNAP + ph * .5, .55], [T_SNAP + ph * .5 + .16, -1.05]], lt);
}
function mkExtra(d, i, lt, sh) {
  const route = d.leaver != null ? (t => exitRoute(d.leaver, t)) : (t => qPos(d.slot, t)), ph = (i % 5) * .035 + (i % 3) * .02;
  const [X, Z] = route(lt), leaving = d.leaver != null && lt >= CUE.beep[d.leaver];
  const hatK = lt < T_HAT ? 0 : ss(lt, T_HAT + i * .035, T_HAT + i * .035 + .3);
  const hy = leaving ? -1.1 : crowdHead(lt, ph), yaw = leaving ? -1.2 : -1.05 + .12 * Math.sin(i * 2.3);
  const o = person(c => Object.assign({ kind: d.kind, id: d.id, who: null, s: .44, y: 1316, expr: 'dead', seed: d.seed, acc: ['fp19b_scrubs', 'fp19b_hat'], lashes: i % 3 === 0 }, c), route, lt, {
    t: lt + i * .37, stride: 28, yaw, headYaw: hy, look: [clamp(hy * .35, -.5, .5), .05], scrubs: d.scrubs, expr: pick(lt, [[T_HAT + .1, 'dead'], [T_LOOK, i % 2 ? 'sour' : 'dead'], [T_SNAP, 'sad'], [T_END_EMPTY, 'shock'], [99, 'dead']]), lid: lt < T_SNAP ? .42 : undefined,
    arms: { l: 'hold', r: 'rest' }, grip: { l: [-70, 62] }, hold: { l: 'fp19b_plate' }, hand: { l: 'flat' }, plateItems: lt >= T_END_EMPTY ? [] : d.items, plateScale: 1.25, plateSeed: d.seed, plateSteam: leaving ? 1 : 0,
    hat: { c1: d.hat[0], c2: d.hat[1], rot: .22 - .1 * (i % 3), dx: .12 + .1 * (i % 2), dy: .9 }, hatPop: hatK,
  });
  o.z = Z; o.crowd = true; o.hatK = hatK; o.goneAway = d.leaver != null && lt >= CUE.beep[d.leaver] + 1.7;
  return o;
}
const T_END_EMPTY = snapT(bS('end') - .001);
// ------------------------------------------------------------------ the named cast: where they stand and what they do, as functions of scene time
const keyRoute = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = c01((lt - a[0]) / (b[0] - a[0])), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const walkYaw = (route, lt, stand, m = 1.05) => { const v = (route(lt + .06)[0] - route(lt - .06)[0]) / .12; return lerp(stand, Math.sign(v || 1) * m, ss(Math.abs(v), 40, 120)); };
/* aim an arm at a screen point: the hand goes exactly there when it can reach, else as far as it reaches (H6.pointAt's maths, with the hand shape given) */
function reach(o, side, x, y, hand = 'flat', frac = .96) {
  const k = KINDS[o.kind], [sx, sy] = shoulder(k, side), [u, v] = localOf(o, x, y), L = ((k.arm1 || 56) + (k.arm2 || 52)) * (o.armScale || 1.12) * frac;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, L / d), key2 = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key2]: [sx + dx * f, sy + dy * f] }); o.hand = Object.assign(o.hand || {}, { [key2]: hand }); o.arms = Object.assign(o.arms || {}, { [key2]: 'hold' });
  return d <= L;
}
/* Strawberry's plate exactly as the PLATE scene left it (ep19_plate.js ITEMS and stickers) plus Binder's clip on the rim */
const STICKERS = [{ kind: 'note', text: 'HOLD', at: [(74 + 150) / 300, (-38 + 56) / 76], s: .62, rot: .1 }, { kind: 'sticker', text: 'FUN COMMITTEE', at: [(-92 + 150) / 300, (-20 + 56) / 76], s: .5, rot: -.12 }, { kind: 'label', text: 'CONTAINS: BREAD', at: [(-8 + 150) / 300, (20 + 56) / 76], s: .6, rot: .03 }, { kind: 'clip', at: [.5, .02], s: .7 }];
const PLATE_ITEMS = [{ kind: 'pieMold', dx: -26, dy: 22 }, { kind: 'roll', dx: 42, dy: -7 }, { kind: 'turkeyMold', shine: .8, dx: 32, dy: 5 }, { kind: 'coffee', thick: 1, fill: .92, k: .66, dx: -38, dy: -6 }];
const SW_SEC = lt => 7200 - 10 + (lt - 7.62) * 10 / (CUE.ding - 7.62);                                     /* the stopwatch: 1:59:50 at o1, 2:00:00 on the ding */
const swText = lt => { const t = lt >= CUE.ding ? 7200 : Math.max(0, Math.min(7199, Math.floor(SW_SEC(lt)))), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };

/* Mango: second... first in line at the microwave; keys in 1:30 on "Ninety seconds each." */
function actMango(lt) {
  const route = t => qPos(3, t), q2 = bS('q2'), keyOn = lt >= q2 && lt < q2 + .95;
  const hy = key([[0, -1.0], [wS('q2', 0) - .25, -1.0], [wS('q2', 0) + .1, -.3], [wS('q2', 2) + .1, -.3], [wS('q2', 2) + .35, -.95], [bS('q3') + .8, -.9], [bS('q4') + .6, -.2], [bS('o1') - .1, .35], [T_SNAP, .35], [T_SNAP + .14, -1.05], [bS('m1') - .1, -1.0], [bS('m1') + .1, -.6], [bS('l1') - .1, -.6], [bS('l1') + .3, -1.0]], lt);
  const yaw = key([[0, -1.15], [q2 - .1, -1.15], [q2 + .3, -.85], [bS('q3'), -.85], [bS('o1'), -.7], [T_SNAP, -.7], [T_SNAP + .2, -1.1], [bS('m1'), -1.1], [bS('m1') + .2, -.8], [bS('l1'), -.8]], lt);
  const o = person(A7.mango, route, lt, { t: lt, stride: 28, yaw, headYaw: hy, look: [clamp(hy * .4, -.5, .5), .05], who: 'mango', hat: { c1: '#4aa8ff', c2: '#ffffff', rot: .25, dx: .12, dy: .94 }, hatPop: lt < T_HAT ? 0 : ss(lt, T_HAT, T_HAT + .3), acc: ['badge7', 'gaitbelt7', 'keys7', 'fp19b_hat'],
    expr: pick(lt, [[q2, 'sour'], [bS('q3'), 'neutral'], [T_HAT + .2, 'sour'], [bS('o2') + 1.2, 'sad'], [CUE.ding, 'shock'], [T_SNAP, 'shock'], [bS('m1'), 'shock'], [bS('m1') + .7, 'hopeful'], [T_END_EMPTY, 'sad'], [99, 'dead']]), lid: lt < q2 ? .4 : undefined,
    arms: { l: 'hold', r: 'rest' }, grip: { l: [-104, 52] }, hold: { l: 'fp19b_plate' }, hand: { l: 'flat' }, plateItems: lt >= T_END_EMPTY ? [] : ['turkeySlices', 'roll'], plateSeed: 11, plateScale: 1 });
  if (keyOn) {                                  /* the plate goes down on the counter; her near hand presses the keypad (x -392, y 242), three presses and Start */
    o.hold = {}; const m = mwState(lt), pr = m.press ?? -1, tapY = pr >= 0 && pr < 4 ? -5 * Math.sin(PI * c01(((lt - (q2 + .25)) / .17) % 1)) : 0;
    const kw = keyWorld(pr >= 0 ? pr : 0), [kx, ky] = p2(kw[0], kw[1], MW.z0 - 4); reach(o, -1, kx, ky + tapY, 'point');
  }
  o.z = route(lt)[1];
  return o;
}
/* Lemon: second in line; turns to the queue and asks "Who is next for the microwave?" with the free hand out along the line */
function actLemon(lt) {
  const route = t => qPos(6, t), q1 = bS('q1'), ask = lt >= q1 - .1 && lt < bE('q1') + .4;
  const yaw = key([[0, -1.05], [q1 - .35, -1.05], [q1, .55], [bE('q1') + .2, .55], [bS('q2') + .1, -.5], [bS('o1'), -.5], [T_SNAP, -.5], [T_SNAP + .2, -.95], [bS('l1') - .2, -.95], [bS('l1'), -.6]], lt);
  const hy = key([[0, -1.0], [q1 - .3, -1.0], [q1, .85], [bE('q1') + .1, .85], [bS('q2'), -.3], [wS('q3', 2) - .3, -.3], [wS('q3', 2) + .2, .25], [bE('q3') + .2, .25], [bS('o1') - .1, .3], [CUE.ding, .3], [T_SNAP, .3], [T_SNAP + .14, -1.0], [bS('m1') + .3, -.7], [bS('l1') + .05, .05], [bE('l1') - .2, .05], [bE('l1') + .2, -.7]], lt);
  const o = person(A7.lemon, route, lt, { t: lt, stride: 28, yaw, headYaw: hy, look: [clamp(hy * .4, -.5, .5), 0], who: 'lemon', hat: { c1: '#4aa8ff', c2: '#ffe135', rot: -.25, dx: -.3, dy: .94 }, hatPop: lt < T_HAT ? 0 : ss(lt, T_HAT + .04, T_HAT + .34), acc: ['readers', 'lanyard7', 'fp19b_hat'],
    expr: pick(lt, [[q1, 'neutral'], [bE('q1'), 'neutral'], [bS('q3'), 'neutral'], [T_HAT + .25, 'sour'], [CUE.ding, 'neutral'], [T_SNAP, 'shock'], [bS('l1') - .1, 'shock'], [bE('l1') + .3, 'sour'], [T_END_EMPTY, 'sad'], [99, 'dead']]), lid: lt < T_HAT ? .3 : undefined,
    arms: { l: 'rest', r: 'hold' }, grip: { r: [100, 54] }, hold: { r: 'fp19b_plate' }, hand: { r: 'flat' }, plateItems: lt >= T_END_EMPTY ? [] : ['roll', 'pieMold'], plateSeed: 12, plateScale: 1 });
  if (ask) { const g = ss(lt, q1 + .15, q1 + .45) * (1 - ss(lt, bE('q1') - .1, bE('q1') + .3)); if (g > .02) { o.arms.l = 'hold'; o.grip = Object.assign(o.grip || {}, { l: [lerp(-70, -150, g), lerp(60, -6, g)] }); o.hand = Object.assign(o.hand || {}, { l: 'open' }); } }
  o.z = route(lt)[1];
  return o;
}
/* Tomato: perky, in front of the queue with the Fun Committee's sheet of paper party hats; the hats pop onto every head on "bonding!" */
const TOMATO_AT = [300, 1470], TOMATO_R = keyRoute([[0, 300, 1470], [snapT(10.4), 300, 1470], [snapT(11.9), 980, 1150, 'io']]);
function actTomato(lt) {
  const q4 = bS('q4'), up = key([[q4 - .15, 0], [q4 + .15, 1], [bE('q4') + .2, 1], [bE('q4') + .6, 0]], lt);
  const hy = key([[0, -.35], [q4 - .2, -.35], [q4, .15], [bE('q4') + .3, .15], [bS('o1'), -.35], [bS('t1') - .1, -.35], [bS('t1'), .1], [bE('t1') + .1, .1], [bS('o2'), -.45]], lt);
  const tp = TOMATO_R(lt), gone = lt > snapT(11.9) + .05, leave = ss(lt, snapT(10.4), snapT(10.8));
  const o = person(A15.tomato, TOMATO_R, lt, { t: lt, stride: 36, tomPose: 'fruit', yaw: lerp(key([[0, -.25], [q4, .1], [bE('t1'), .1], [bS('o2'), -.35]], lt), 1.0, leave), headYaw: lerp(hy, 1.0, leave), look: [clamp(hy * .4, -.5, .5), .05], who: 'tom', arms: { l: 'hold', r: lt >= bS('t1') && lt < bE('t1') ? 'cheer' : (up > .5 ? 'cheer' : 'rest') },
    grip: { l: [lerp(-96, -80, up), lerp(70, -46, up)] }, hold: { l: 'fp19b_hatsheet' }, hatsScale: 1.05, hatsRot: lerp(-.1, .12, up), hand: { l: 'grip' },
    hat: { c1: '#ff4f9a', c2: '#ffe135', rot: .5, dx: .5, dy: .9 }, hatPop: lt < T_HAT + .1 ? 0 : ss(lt, T_HAT + .1, T_HAT + .4), acc: ['fp19b_hat'] });
  o.z = tp[1]; o.gone = gone;
  return o;
}
/* Strawberry: in the queue with her plate, walks out of line to the can when Onion says two hours, is robbed of the plate, trudges to Brenda and eats */
const T_S_LEAVE = snapT(9.9), T_GRAB = snapT(16.1), T_REL = snapT(CUE.bin[1] - .075), T_TAKE = snapT(27.97);
const STRAW_AT = [525, 1110], EX_S = [250, 1600], EX_B = [-70, 1600], SEAT_S = [236, 1600], SEAT_B = [26, 1600];
const STRAW_R = (() => { const q0 = qPos(9, T_S_LEAVE), k = keyRoute([[T_S_LEAVE, q0[0], q0[1]], [snapT(11.4), 250, 1760, 'io'], [snapT(12.15), 400, 1530, 'io'], [snapT(12.95), STRAW_AT[0], STRAW_AT[1], 'io'], [snapT(19.4), STRAW_AT[0], STRAW_AT[1]], [snapT(22.5), 360, 1400, 'io'], [snapT(25.0), EX_S[0], EX_S[1], 'io']]); return lt => lt < T_S_LEAVE ? qPos(9, lt) : k(lt); })();
function actStraw(lt, sh) {
  const route = STRAW_R, walking = lt >= T_S_LEAVE && lt < snapT(12.95) + .1, back = lt >= snapT(19.4);
  const yaw0 = key([[0, -1.05], [T_S_LEAVE - .4, -1.05], [T_S_LEAVE, 1.0], [snapT(12.7), 1.0], [snapT(13.0), -.22], [snapT(19.3), -.22], [snapT(19.7), -1.0], [snapT(24.8), -1.0], [snapT(25.6), -.5], [99, -.5]], lt);
  const yaw = (walking || (back && lt < snapT(25.1))) ? walkYaw(route, lt, yaw0) : yaw0;
  const hy = key([[0, -.9], [bS('o1'), -.9], [bS('o1') + .6, -.2], [T_S_LEAVE, 0], [snapT(13.0), -.1], [bS('timer'), -.1], [CUE.ding, -.5], [bS('sweep'), -.5], [CUE.sweep + .3, -.35], [T_GRAB, -.3], [bS('s2') - .05, -.3], [bS('s2') + .5, -.55], [bS('s2') + .75, -.05], [T_SNAP, -.05], [T_SNAP + .15, -1.0], [bS('br2') - .1, -.9], [snapT(25.8), .5], [99, .5]], lt);
  const o = person(A11.straw, route, lt, { t: lt, stride: lt > snapT(19.4) ? 20 : 40, yaw, headYaw: hy, who: 'straw', expr: pick(lt, [[bS('o2') + 1.2, 'dead'], [bS('s1'), 'shock'], [CUE.sweep - .1, 'dead'], [bS('s2'), 'shock'], [bS('s2') + 1.0, 'dead'], [T_SNAP, 'dead'], [bS('s3'), 'sad'], [bS('br3'), 'hopeful'], [T_TAKE, 'neutral'], [T_END_EMPTY, 'happy'], [99, 'chill']]), lid: (lt < CUE.sweep - .1 || (lt >= bS('s2') && lt < bS('s2') + 1.0)) ? .5 : (lt >= T_SNAP && lt < bS('br3') ? .45 : undefined),
    look: key([[0, [-.5, .05]], [bS('s1'), [-.5, .3]], [CUE.sweep, [-.55, .1]], [T_GRAB, [-.7, .15]], [bS('s2'), [-.75, .55]], [bS('s2') + .55, [-.75, .6]], [bS('s2') + .8, [0, 0]], [T_SNAP, [0, 0]], [T_SNAP + .15, [-.7, 0]], [bS('s3'), [-.4, -.1]], [99, [-.4, -.15]]], lt),
    arms: { l: 'hold', r: 'rest' }, grip: { l: [-104, 54] }, hold: { l: 'fp19b_plate' }, hand: { l: 'flat' }, plateItems: PLATE_ITEMS, plateItemScale: 1.04, plateStickers: STICKERS, plateSeed: 7, plateScale: 1.12 + .2 * ss(lt, bS('s1') - .15, bS('s1') + .05) - .2 * ss(lt, bE('s1') - .1, bE('s1') + .3), plateTilt: -.04 });
  /* the plate: held out in the queue, clutched to the chest at "discarded" and while the sweep runs, up in her hand for the close-up */
  const clutch = Math.max(ss(lt, wS('o2', 4) - .1, wS('o2', 4) + .25), ss(lt, bS('s1') - .5, bS('s1') - .1)) * (1 - ss(lt, T_GRAB + .3, T_GRAB + .5));
  if (lt >= T_S_LEAVE && lt < T_GRAB) o.grip = { l: [lerp(-104, -34, c01(clutch + ss(lt, T_S_LEAVE, T_S_LEAVE + .3))), lerp(54, 62, c01(clutch + ss(lt, T_S_LEAVE, T_S_LEAVE + .3)))] };
  if (lt >= T_GRAB) { o.hold = {}; o.grip = { l: [-70, 20] }; o.arms.l = lt < T_GRAB + .4 ? 'hold' : 'rest'; if (lt >= T_GRAB + .4) o.grip = {}; }
  if (lt >= T_TAKE) {                                     /* takes Brenda's half with her near hand, then eats it, eyes shut */
    o.hold = { l: 'fp19b_sandwich' }; o.sandMode = 'R'; o.sandScale = 1.25; o.arms.l = 'hold'; o.hand.l = 'grip'; o.grip = { l: [-96, 50] };
    if (lt >= T_TAKE + .6) { o.mouthOpen = Math.max(0, .18 * Math.sin((lt - T_TAKE) * 9)); }
  }
  o.acc = (o.acc || []).concat(['fp13_shut']);
  if (lt >= T_END_EMPTY) { const q = V2.at(SEAT_S[0], SEAT_S[1]); Object.assign(o, { x: q.x, y: q.y - 98 * q.s, s: q.s, noLegs: true, noShadow: true, noReflect: true, yaw: -.3, headYaw: -.25, gaitW: undefined, axis: undefined, stride: undefined, mouthOpen: Math.max(0, .18 * Math.sin((lt - T_END_EMPTY) * 9)), shut: 1, shutStyle: 'happy', lid: 1 }); o.hold = { l: 'fp19b_sandwich' }; o.sandMode = 'R'; o.sandScale = 1.25; o.arms = { l: 'hold', r: 'rest' }; o.hand = { l: 'grip' }; o.grip = { l: [-34, 16] }; o.z = SEAT_S[1]; o.seated = true; }
  else o.z = route(lt)[1];
  return o;
}
/* Onion: Compliance. At the table's left end with the stopwatch; sweeps the table into the bag in one motion; takes Strawberry's plate and drops it in */
const ONION_HOME = [-470, 1205];
const onionX = lt => lt < SW.t0 - SW.wind ? ONION_HOME[0] : lt < SW.t0 ? lerp(ONION_HOME[0], pfAt(SW.t0) - 170, ss(lt, SW.t0 - SW.wind, SW.t0)) : pfAt(lt) - 170 + 10 * ss(lt, SW.t0 + .62, T_GRAB);
const ONION_R = lt => lt >= T_END_EMPTY ? [560, 1205] : [onionX(lt), ONION_HOME[1]];
function actOnion(lt, sh, straw) {
  const route = ONION_R, sob = Math.max(0, 1 - Math.abs(lt - CUE.sniffle - .08) / .45);
  const sweeping = lt >= SW.t0 - SW.wind && lt < T_GRAB, took = lt >= T_GRAB;
  const yaw = key([[0, .3], [bS('o2') + .8, .3], [wS('o2', 4) - .1, .1], [CUE.ding, .1], [SW.t0 - .25, .55], [T_REL + .2, .55], [T_END_EMPTY - .01, .3], [T_END_EMPTY, -.3]], lt);
  const hy = key([[0, -.2], [bS('o1'), .1], [bS('o2'), 0], [CUE.ding + .3, -.1], [SW.t0 - .1, .35], [T_GRAB, .3], [T_REL, .1]], lt);
  const base = V2.at(route(lt)[0], route(lt)[1]);
  const o = A15.onion(Object.assign(base, { t: lt, pose: 'free', yaw, headYaw: hy, sob, who: 'onion', cry: .62 + .2 * Math.max(0, 1 - Math.abs(lt - CUE.sniffle) / .6), look: [clamp(hy * .5, -.5, .5), .05],
    arms: { l: 'hold', r: 'rest' }, grip: { l: [-84, 46] }, hold: { l: 'fp19b_stopwatch' }, swScale: 1.05, swText: swText(lt), swSec: lt % 60, swFlash: lt >= CUE.ding && lt < CUE.ding + .25 ? 1 : 0, hand: { l: 'grip' } }));
  o.z = route(lt)[1];
  /* o2: the free hand points at the table on "discarded" */
  if (lt >= wS('o2', 4) - .05 && lt < CUE.ding) { const g = ss(lt, wS('o2', 4) - .05, wS('o2', 4) + .2); o.arms.r = 'hold'; o.hand.r = 'point'; o.grip = Object.assign(o.grip || {}, { r: [lerp(80, 150, g), lerp(40, 4, g)] }); }
  if (sweeping) {                                          /* the sweep: the arm out along the tabletop, its hand at the plow's face; wound back for a tenth of a second before */
    const pf = lt < SW.t0 ? lerp(pfAt(SW.t0) - 60, pfAt(SW.t0), 0) : pfAt(lt), wind = ss(lt, SW.t0 - SW.wind, SW.t0), [hx, hy2] = p2(pf, TBL.h + 14, TBL.z0 + 22);
    const wx = lt < SW.t0 ? o.x + 70 * o.s : hx;                      /* drawn back (close to her shoulder) in the wind-up */
    reach(o, 1, wx, lt < SW.t0 ? hy2 - 10 * o.s : hy2, 'flat'); o.hold = { l: 'fp19b_stopwatch' }; void wind;
  }
  if (took) {                                              /* the plate: from Strawberry's hand over to the can */
    const sp = lscrPlate(straw), k = ease3((lt - T_GRAB) / (T_REL - T_GRAB)), hover = p2(CAN.x + 10, CAN.h + 150, CAN.z);
    const tx = lt < T_REL ? lerp(sp[0], hover[0], k) : hover[0], ty = lt < T_REL ? lerp(sp[1], hover[1], k) : hover[1];
    if (lt < T_REL) { reach(o, 1, tx, ty, 'grip'); o.hold = { l: 'fp19b_stopwatch', r: 'fp19b_plate' }; o.plateItems = PLATE_ITEMS; o.plateItemScale = 1.04; o.plateStickers = STICKERS; o.plateSeed = 7; o.plateTilt = -.04; o.plateScale = lerp(1.12 * straw.s, kz(CAN.z), k) * 1.0 / o.s; }
    else { reach(o, 1, hover[0] - 14, hover[1] + 30, 'open'); o.hold = { l: 'fp19b_stopwatch' }; }
  }
  if (lt >= T_END_EMPTY) { o.arms = { l: 'hold', r: 'rest' }; o.grip = { l: [-84, 46] }; o.hold = { l: 'fp19b_stopwatch' }; o.swText = '2:00:00'; }
  return o;
}
/* where Strawberry's plate is on the screen right now (the hand's target, in screen coordinates) */
function lscrPlate(straw) { const g = straw.grip && straw.grip.l ? straw.grip.l : [-34, 62]; return window.H6.localToScreen(straw, g[0], g[1]); }
/* the free plate after Onion lets go: it drops from over the can onto the heap and lies on top, nearly level */
function plateFree(lt) {
  if (lt < T_REL) return null;
  const hover = p2(CAN.x + 10, CAN.h + 150, CAN.z), rest = p2(CAN.x - 4, CAN.h + 108, CAN.z), u = c01((lt - T_REL) / (PLATE_LAND - T_REL));
  const a = lt - PLATE_LAND, hop = a > 0 && a < .2 ? 7 * Math.sin(PI * a / .2) * (1 - a / .2) : 0;
  return { x: mixv(hover[0], rest[0], u), y: mixv(hover[1], rest[1], u * u) - hop * kz(CAN.z), k: kz(CAN.z), tilt: mixv(-.04, .1, u) };
}
/* Brenda: behind the refrigerator since 2019. Her hand with the lunchbox comes round the fridge first; the cobweb across her mouth snaps on "have" */
const BR_R = keyRoute([[0, -806, 2150], [snapT(bS('br1') - .02), -806, 2150], [snapT(bS('br1') + .7), -745, 2112, 'io'], [snapT(bS('br1') + 1.3), -696, 2060, 'io'], [snapT(bS('br1') + 2.15), -640, 1960, 'io'], [snapT(22.4), -640, 1960], [snapT(25.0), EX_B[0], EX_B[1], 'io'], [99, EX_B[0], EX_B[1]]]);
function actBrenda(lt, sh) {
  const route = BR_R, b1 = bS('br1'), wsnap = wS('br1', 3), out = lt >= b1 + 1.9;
  const hy = key([[0, .2], [b1, .2], [b1 + 1, .45], [bE('br1'), .45], [bS('m1'), -.1], [bS('br2'), .35], [bE('br2') + .2, .35], [bS('br3'), .5], [99, .5]], lt);
  const yaw = key([[0, .2], [b1 + 1.5, .35], [bS('br2'), .5], [99, .55]], lt);
  const o = person(A13.brenda, route, lt, { t: lt, stride: 22, yaw: walkYaw(route, lt, yaw, .45), headYaw: hy, who: 'brenda', expr: A13.expr(lt < bS('br3') + 1.0 ? (lt < b1 + 1.5 ? 'wake' : 'weak') : 'relief'), lid: lt < b1 + 1.2 ? .26 : .34, look: [clamp(hy * .6, -.55, .55), .05],
    web: lt < wsnap ? 1 : 0, webT: lt < wsnap ? -1 : lt - wsnap, dust: lt < bS('br2') ? .8 : lerp(.8, .5, ss(lt, bS('br2'), bS('br3'))), specsDrop: .75,
    arms: { l: 'rest', r: 'hold' }, grip: { r: [100, 40] }, hold: { r: 'fp19b_lunch' }, lunchScale: .85, hand: { r: 'grip' } });
  if (lt < b1 + 1.0) {                                     /* the hand comes round the fridge's edge with the lunchbox, held out at arm's length */
    const [hx, hy2] = p2(-676, 236, 2060); reach(o, 1, hx, hy2, 'grip'); o.lunchTilt = .1;
  }
  const up = ss(lt, wS('br2', 5) - .2, wS('br2', 5) + .1) * (1 - ss(lt, bE('br2') + .1, bE('br2') + .5));        /* "twenty nineteen": the lunchbox up beside her face */
  if (up > .02) { o.grip = { r: [lerp(100, 78, up), lerp(40, -64, up)] }; o.lunchScale = lerp(.85, 1.0, up); }
  o.lunchNoText = lt >= SHOTS.find(x => x.id === 'b2b').s - .02 && lt < SHOTS.find(x => x.id === 'b2b').e + .02;       /* the insert shows the sticker big: the one in her hand is left blank while it is up */
  const tearK = ss(lt, wS('br3', 3) - .05, wS('br3', 3) + .22), give = ss(lt, wS('br3', 3) + .24, T_TAKE - .02);
  if (lt >= snapT(25.45) && lt < wS('br3', 3) - .05) { o.hold = { l: 'fp19b_sandwich' }; o.sandMode = 'whole'; o.sandScale = 1.1; o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: [-36, 80], r: [40, 82] }; o.hand = { l: 'grip', r: 'grip' }; }
  else if (lt >= wS('br3', 3) - .05 && lt < T_TAKE) { o.hold = { l: 'fp19b_sandwich', r: 'fp19b_sandwich' }; o.sandMode = 'torn'; o.sandPull = 10 * tearK; o.sandScale = 1.1; o.arms = { l: 'hold', r: 'hold' }; o.hand = { l: 'grip', r: 'grip' }; o.grip = { l: [-46 - 12 * tearK, 80], r: [lerp(46 + 12 * tearK, 150, give), lerp(82, 64, give)] }; }
  else if (lt >= T_TAKE) { o.hold = { l: 'fp19b_sandwich' }; o.sandMode = 'L'; o.sandScale = 1.1; o.arms = { l: 'hold', r: 'rest' }; o.hand = { l: 'grip' }; o.grip = { l: [-44, 80] }; }
  if (lt >= T_END_EMPTY) {                                 /* the last image: seated, the lunchbox open in her lap... eating her half with her eyes shut */
    const q = V2.at(SEAT_B[0], SEAT_B[1]); Object.assign(o, { x: q.x, y: q.y - 98 * q.s, s: q.s, noLegs: true, noShadow: true, noReflect: true, yaw: .3, headYaw: .25, expr: A13.expr('relief'), lid: .2, web: 0, webT: -1, gaitW: undefined, axis: undefined });
    o.hold = { l: 'fp19b_sandwich' }; o.sandMode = 'L'; o.sandScale = 1.2; o.arms = { l: 'hold', r: 'rest' }; o.grip = { l: [lerp(-96, -34, ss(lt, T_END_EMPTY + .5, T_END_EMPTY + .85)), 18] }; o.hand = { l: 'grip' };
    o.mouthOpen = Math.max(0, .16 * Math.sin((lt - T_END_EMPTY) * 8 + 1)); o.shut = 1; o.shutStyle = 'happy'; o.z = SEAT_B[1]; o.seated = true;
  } else o.z = route(lt)[1];
  return o;
}
// ------------------------------------------------------------------ the cast of a frame, the painter's list, and the shots
function castAt(lt, sh) {
  const C = {};
  C.mango = actMango(lt); C.lemon = actLemon(lt); C.tomato = actTomato(lt); if (C.tomato.gone) C.tomato = null;
  C.straw = actStraw(lt, sh); C.onion = actOnion(lt, sh, C.straw);
  C.brenda = lt >= bS('br1') - .3 ? actBrenda(lt, sh) : null;
  C.extras = EXTRAS.map((d, i) => mkExtra(d, i, lt, sh)).filter(o => !o.goneAway);
  /* the hand-over: Strawberry's near hand goes to the half Brenda holds out (her hand at local [150, 64]), takes it at T_TAKE (same place: no jump) and brings it to her mouth */
  if (C.brenda && !C.straw.seated && lt >= T_TAKE - .4 && lt < T_END_EMPTY) {
    const bh = window.H6.localToScreen(C.brenda, 150, 64), sp = window.H6.localToScreen(C.straw, -96, 60), k = ss(lt, T_TAKE - .4, T_TAKE - .02);
    if (lt < T_TAKE) reach(C.straw, -1, lerp(sp[0], bh[0], k), lerp(sp[1], bh[1], k), 'open', .995);
    else { const g0 = localOf(C.straw, bh[0], bh[1]), eat = ss(lt, T_TAKE + .2, T_TAKE + .65); C.straw.grip = { l: [lerp(g0[0], -36, eat), lerp(g0[1], 18, eat)] }; C.straw.arms.l = 'hold'; }
  }
  return C;
}
/* every character is wholly inside the frame, or left out of the shot (no half faces at the edge); the subject of a close-up is always drawn */
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inFrame(o) {
  const b = boxOf(o, 96), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
/* the clip of the tabletop (screen polygon): Onion is drawn a second time inside it, over the cloth, so her sweeping arm lies ON the table */
function tabletopClip(pad = 6) { const q = [p2(TBL.x0 - pad, TBL.h, TBL.z0 - pad), p2(TBL.x1 + pad, TBL.h, TBL.z0 - pad), p2(TBL.x1 + pad, TBL.h, TBL.z1 + pad), p2(TBL.x0 - pad, TBL.h, TBL.z1 + pad)]; ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); }
function drawCharAt(o, sup) { if (sup) REG.suppress++; drawChar(o); if (sup) REG.suppress--; }
function chairs(lt) {
  for (const [sx, sz, col] of [[SEAT_B[0], SEAT_B[1], '#3a7be0'], [SEAT_S[0], SEAT_S[1], '#e0563a']]) S6.chair3(sx, sz + 40, { w: 52, d: 40, seat: 108, back: 250, color: col });
}
/* the painter's list: [id, z, draw]; far to near. Close-ups blur what is not sharp; a character nearer than the subject is left out. */
function worldItems(lt, sh, C) {
  const ST = roomState(lt), L = [];
  L.push(['room', 1e9, () => drawRoomBase(ST)]); L.push(['fridge', FRIDGE.z0 + 1, () => drawFridge(ST)]); L.push(['counter', COUNTER.z0, () => drawCounter(ST)]);
  if (lt >= T_END_EMPTY) L.push(['chairs', SEAT_B[1] + 60, () => chairs(lt)]);
  for (const o of C.extras) L.push(['x:' + o.id, o.z, () => { const f = inFrame(o); if (f.inter) drawCharAt(o, true); }]);
  for (const k of ['mango', 'lemon', 'tomato', 'onion', 'straw', 'brenda']) { const o = C[k]; if (!o) continue; L.push([k, k === 'straw' && o.z >= 1105 && o.z < 1112 ? 1105 : o.z, () => { const f = inFrame(o); if (f.inter && (f.whole || k === sh.foc)) drawCharAt(o, false); else if (f.inter) drawCharAt(o, true); }]); }
  L.push(['tbl', TBL_Z, () => {
    drawTable(ST);
    const sweepBox = lt >= SW.t0 - SW.wind - .02 && lt < T_GRAB + .12;
    if (sweepBox && C.onion) { ctx.save(); tabletopClip(); drawCharAt(C.onion, false); ctx.restore(); }
    drawCanBack(ST); drawItems(ST); drawPlateFree(ST); drawCanFront(ST);
  }]);
  return L;
}
function drawPlateFree(ST) {
  const p = plateFree(ST.lt); if (!p) return;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.k, p.k); ctx.rotate(p.tilt);
  const F = F19(); if (F && F.kinds && F.kinds.plate) F.dish(ctx, 'plate', { x: 0, y: 8, s: 1.12 * 120 / 300, t: ST.lt, items: PLATE_ITEMS, itemScale: 1.04, stickers: STICKERS, seed: 7, shadow: false });
  else { ctx.fillStyle = '#fbfbf8'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ell(0, 2, 62, 12); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawWorld(lt, sh, C) {
  const L = worldItems(lt, sh, C).sort((a, b) => b[1] - a[1]);
  if (!sh.dof) { for (const it of L) if ((sh.hide || []).indexOf(it[0]) < 0) it[2](); return; }
  const sharp = new Set(sh.sharp || []), subj = L.filter(it => sharp.has(it[0])), zmin = subj.length ? Math.min(...subj.map(it => it[1])) : 0;
  const isChar = id => ['mango', 'lemon', 'tomato', 'onion', 'straw', 'brenda'].indexOf(id) >= 0 || id.indexOf('x:') === 0;
  let run = [];
  const flush = () => { if (!run.length) return; const r = run; run = []; REG.suppress++; V2.dof(sh.dof, () => { for (const it of r) it[2](); }); REG.suppress--; };
  for (const it of L) {
    if (sharp.has(it[0])) { flush(); it[2](); }
    else if (isChar(it[0]) && it[1] < zmin - 1) continue;                   /* a character nearer than the subject: not in this shot */
    else if ((sh.hide || []).indexOf(it[0]) >= 0) continue;
    else if (it[1] < zmin - 1 && subj.length) continue;                     /* nothing nearer than the subject is left out of focus in front of it */
    else run.push(it);
  }
  flush();
}
const SHOT_DEFS = [   /* id, start, framing: p = perspective camera [cx0, cz0, cx1, cz1]; foc = a face; pt = world points [from, to]; c = screen centre [x0, y0, x1, y1]; z = zoom [from, to]; dof + sharp = the close-up's focus */
  ['open', 0, { p: [-250, 0, -330, 0], pt: [[-200, 230, 1750], [-330, 150, 1990]], z: [1.05, 1.3], sharpAll: true, blur: 3 }],
  ['q1', 1.50, { p: [-300, 0, -300, 0], foc: 'lemon', z: [2.1, 2.3], up: 175, dof: 9, sharp: ['lemon'] }],
  ['q2a', 3.55, { p: [-380, 0, -380, 0], foc: 'mango', z: [2.5, 2.6], up: 165, dof: 9, sharp: ['mango'] }],
  ['q2b', 3.98, { p: [-380, 0, -380, 0], foc: 'mango', z: [2.0, 2.05], up: 470, dof: 12, sharp: ['mango'], insert: 'microwave' }],
  ['q3', 4.83, { p: [-100, 0, -100, 0], pt: [[330, 300, 1990], [-290, 300, 1990]], z: [1.8, 1.9], sharpAll: true, chip: 1, blur: 4, hide: ['tbl', 'tomato', 'onion'] }],
  ['q4a', 6.42, { p: [60, 0, 60, 0], foc: 'tomato', z: [2.0, 2.1], up: 160, dof: 8, sharp: ['tomato'] }],
  ['q4b', 7.05, { p: [-100, 0, -100, 0], pt: [[-30, 255, 1990]], z: [1.45, 1.5], sharpAll: true }],
  ['o1a', 7.62, { p: [-300, 0, -300, 0], foc: 'onion', z: [2.0, 2.15], up: 165, dof: 9, sharp: ['onion', 'tbl'] }],
  ['o1b', 8.55, { p: [-300, 0, -300, 0], pt: [[-80, 262, TBL_Z]], z: [4.2, 4.5], dof: 10, sharp: ['tbl'] }],
  ['o1c', 9.12, { p: [-300, 0, -300, 0], foc: 'onion', z: [2.35, 2.45], up: 150, dof: 10, sharp: ['onion', 'tbl'] }],
  ['t1', 9.645, { p: [60, 0, 60, 0], foc: 'tomato', z: [2.05, 2.2], up: 160, dof: 8, sharp: ['tomato'] }],
  ['o2a', 10.90, { p: [-300, 0, -300, 0], foc: 'onion', z: [2.3, 2.5], up: 150, dof: 10, sharp: ['onion', 'tbl'] }],
  ['o2b', 12.10, { p: [330, 0, 330, 0], c: [540, 1400, 540, 1400], z: [1.12, 1.16], sharpAll: true }],
  ['s1', 13.07, { p: [200, 0, 200, 0], foc: 'straw', z: [2.0, 2.15], up: 165, dof: 9, sharp: ['straw'] }],
  ['tm1', 14.13, { p: [-300, 0, -300, 0], foc: 'onion', z: [2.8, 2.8], up: 150, dof: 14, sharp: [], insert: 'stopwatch' }],
  ['tm2', 14.62, { p: [0, 0, 0, 0], pt: [[250, 612, ZB]], z: [3.2, 3.3], sharpAll: true }],
  ['tm3', 14.93, { p: [-100, 0, -100, 0], c: [540, 1410, 540, 1410], z: [1.02, 1.06], sharpAll: true }],
  ['sw', 15.18, { p: [-120, 0, 90, 0], ptf: lt => [Math.max(-250, Math.min(215, onionX(lt) + 165)), 300, 1200], z: [1.12, 1.12], sharpAll: true, blur: 6 }],
  ['plate', 16.15, { p: [150, 0, 150, 0], pt: [[330, 250, 1150]], z: [1.5, 1.6], sharpAll: true }],
  ['bag', 16.50, { p: [200, 0, 200, 0], pt: [[CAN.x, CAN.h + 95, CAN.z]], z: [2.9, 3.1], dof: 12, sharp: ['tbl'] }],
  ['s2', 17.03, { p: [200, 0, 200, 0], foc: 'straw', z: [2.1, 2.35], up: 165, dof: 9, sharp: ['straw'] }],
  ['b1a', 18.25, { p: [-450, 0, -450, 0], pt: [[-700, 290, 2000]], z: [1.9, 2.0], sharpAll: true }],
  ['b1b', 19.25, { p: [-420, 0, -420, 0], c: [540, 1300, 540, 1300], z: [1.3, 1.4], sharpAll: true }],
  ['m1', 20.43, { p: [-380, 0, -380, 0], foc: 'mango', z: [3.0, 3.1], up: 175, dof: 10, sharp: ['mango'] }],
  ['l1', 21.10, { p: [-300, 0, -300, 0], foc: 'lemon', z: [2.2, 2.35], up: 170, dof: 10, sharp: ['lemon'] }],
  ['b2a', 22.45, { p: [-300, 0, -150, 0], foc: 'brenda', z: [2.0, 2.15], up: 165, dof: 10, sharp: ['brenda'] }],
  ['b2b', 23.95, { p: [-150, 0, -150, 0], foc: 'brenda', z: [2.0, 2.0], up: 165, dof: 14, sharp: [], insert: 'lunch' }],
  ['b2c', 25.15, { p: [60, 0, 60, 0], pt: [[90, 270, 1620]], z: [1.5, 1.6], dof: 7, sharp: ['brenda', 'straw'] }],
  ['s3', 25.85, { p: [0, 0, 0, 0], foc: 'straw', z: [2.2, 2.3], up: 165, dof: 9, sharp: ['straw'] }],
  ['b3a', 26.61, { p: [-40, 0, -40, 0], foc: 'brenda', z: [2.2, 2.3], up: 165, dof: 9, sharp: ['brenda'] }],
  ['b3b', 27.85, { p: [60, 0, 60, 0], pt: [[90, 215, 1600]], z: [2.05, 2.15], dof: 7, sharp: ['brenda', 'straw'] }],
  ['end', 28.88, { p: [20, 0, 40, 0], cy: 330, pt: [[130, 290, 1500]], z: [1.5, 1.62], up: 10, sharpAll: true }],
];
const SHOTS = SHOT_DEFS.map(([id, s, d], i) => Object.assign({ id, s: i === 0 ? 0 : snapT(s), n: i }, d));
SHOTS.forEach((sh, i) => { sh.e = i + 1 < SHOTS.length ? SHOTS[i + 1].s : SCN.dur; });
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s - 1e-6) r = sh; return r; };

let FR = null;                                            /* { C, sh } of the frame being drawn, built in cam() */
function cam(lt) {
  const sh = shotAt(lt), pu = sh.ease === 'out' ? easeOut(sg(lt, sh.s, sh.e)) : easeIO(sg(lt, sh.s, sh.e)), u = pu;
  V2.setCam(Object.assign({}, PERSP, { cx: lerp(sh.p[0], sh.p[2], pu), cz: lerp(sh.p[1], sh.p[3], pu) }, sh.cy ? { cy: sh.cy } : {}));
  const C = castAt(lt, sh);
  FR = { C, sh, lt };
  const z = lerp(sh.z[0], sh.z[1], u);
  if (sh.foc && C[sh.foc]) { faceZoom(C[sh.foc], z, sh.up ?? 150); CAM.x -= (sh.dx || 0) / z; CAM.y += (sh.dy || 0) / z; }
  else if (sh.ptf) { const [x, y] = p2(...sh.ptf(lt)); zoomTo(x, y + (sh.up || 0) / z, z); }
  else if (sh.pt) { const a = sh.pt[0], b = sh.pt[1] || a, [x, y] = p2(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)); zoomTo(x, y + (sh.up || 0) / z, z); }
  else zoomTo(lerp(sh.c[0], sh.c[2], u), lerp(sh.c[1], sh.c[3], u), z);
  CAM.x += 2.2 * hnoise(lt, 1.3, 1); CAM.y += 1.6 * hnoise(lt, 1.1, 2); CAM.r = (CAM.r || 0) + .0012 * hnoise(lt, .9, 3);
  /* the bin's thuds shake the frame a little */
  const thud = Math.max(0, 1 - Math.abs(lt - CUE.bin[0] - .02) / .12) * 6 + Math.max(0, 1 - Math.abs(lt - CUE.bin[1] - .02) / .1) * 3; CAM.y += thud * Math.sin(lt * 90);
}
function draw(lt) {
  const { C, sh } = FR;
  V2.setLight({ key: [-.3, -.8], keyColor: '#f2fff4', keyA: .16, shadow: '#16222a', shadowA: .32, rim: '#cfeaff', rimA: .3, bounce: '#e6efdc', bounceA: .12, amb: '#ffffff', ambA: 0, back: null, frontDark: 0, shadowLong: 0 });
  V2.opts.reflect = true;
  drawWorld(lt, sh, C);
  /* dust in the air once the fridge opens up: the nook breathes out */
  if (lt > bS('br1') - .1 && lt < bE('br1') + 2) V2.dust(0, 700, 1080, 1500, lt, { n: 36, alpha: .35, size: 2.6, speed: 8 });
}
// ------------------------------------------------------------------ inserts (screen space, drawn in over() after the grade): the chip, the stopwatch, the lunchbox
const veil = a => { ctx.fillStyle = 'rgba(8,12,12,' + a + ')'; ctx.fillRect(0, 0, W, H); const g = V2.radial(540, 860, 220, 1100, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.4)']]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
function insChip(lt) {                                    /* 11 X 90 S = 16 MIN 30 S, building on "eleven" and on "of us" */
  const tA = wS('q3', 2) - .1, tB = wS('q3', 4) - .3, a = eb(sg(lt, tA, tA + .22)), b = eb(sg(lt, tB, tB + .26));
  if (a > .04) { ctx.save(); ctx.translate(540, 330); ctx.scale(a, a); UI.pill('11 X 90 S', 0, 0, { size: 62, font: 'Bangers', weight: 400, fill: '#fff6d8', ink: '#2a2230', stroke: '#2a2230', lw: 5, padX: 38, h: 100, spacing: 2, hero: a > .97 }); ctx.restore(); }
  if (b > .04) { ctx.save(); ctx.translate(540, 462); ctx.scale(b, b); UI.pill('= 16 MIN 30 S', 0, 0, { size: 76, font: 'Bangers', weight: 400, fill: '#ffe135', ink: '#c4283a', stroke: '#2a2230', lw: 5, padX: 42, h: 116, spacing: 2, hero: b > .97 }); ctx.restore(); }
}
const swDisp = lt => lt >= CUE.ding ? '2:00:00.00' : '1:59:59.' + String(Math.min(99, Math.max(0, Math.floor((1 - Math.max(0, CUE.ding - lt)) * 100)))).padStart(2, '0');
function insStopwatch(lt, sh) {
  const k = eb(sg(lt, sh.s, sh.s + .16)); if (k < .04) return;
  const ding = lt >= CUE.ding, since = lt - CUE.ding;
  veil(.5);
  ctx.save(); ctx.translate(540, 820); ctx.rotate(ding ? Math.sin(since * 60) * Math.exp(-since * 8) * .07 : 0); ctx.scale(k, k);
  ctx.save(); ctx.translate(0, 172); ctx.scale(8.6, 8.6); drawStopwatch(ctx, { sec: lt * 6, flash: ding && since < .25 ? 1 : 0 }); ctx.restore();
  UI.container('swface', 'board', [-215, -75, 215, 75], 6);
  UI.label(swDisp(lt), 0, 0, { size: 104, font: 'Bangers', weight: 400, fill: ding ? '#c4283a' : '#1a1a22', spacing: 2, maxW: 420, cid: 'swface', center: true, hero: k > .97 });
  ctx.restore();
  if (ding && since < .6) { V2.ring(540, 820, since / .6, { r0: 250, r1: 520, color: '255,230,140', lw: 10, alpha: .8 }); }
  if (ding && since > .05) { const a = eb(sg(since, .05, .25)); if (a > .05) { ctx.save(); ctx.translate(800, 470); ctx.rotate(.12); ctx.scale(a, a); UI.label('DING!', 0, 0, { size: 96, font: 'Bangers', weight: 400, fill: '#ffe135', stroke: '#2a2230', lw: 12, hero: false, tilt: .2 }); ctx.restore(); } }
}
function insLunch(lt, sh) {
  const k = eb(sg(lt, sh.s, sh.s + .2)); if (k < .04) return;
  veil(.5);
  V2.dust(120, 300, 960, 1500, lt, { n: 30, alpha: .5, size: 2.6, speed: 7 });
  ctx.save(); ctx.translate(540, 1090); ctx.rotate(-.04 + .015 * Math.sin(lt * 2.4)); ctx.scale(k * 5.4, k * 5.4);
  drawLunchbox(ctx, { hero: k > .97, open: 0, id: 'lunchbig' });
  ctx.restore();
}
function insMicrowave(lt, sh) {                            /* the keypad and the display, big: 1, 3, 0, START -> 1:30 */
  const k = eb(sg(lt, sh.s, sh.s + .18)); if (k < .04) return;
  const m = mwState(lt), x0 = 160, y0 = 760, w = 760, h = 570;
  ctx.save(); ctx.translate(540, y0 + h / 2); ctx.scale(k, k); ctx.translate(-540, -(y0 + h / 2));
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(x0 + 8, y0 + 12, w, h, 26); ctx.fill();
  ctx.fillStyle = V2.grad(0, y0, 0, y0 + h, [[0, '#454b55'], [1, '#2a2e36']]); rr(x0, y0, w, h, 26); ctx.fill(); ctx.strokeStyle = '#15171c'; ctx.lineWidth = 6; ctx.stroke();
  const dx = x0 + 34, dy = y0 + 30, dw = w - 68, dh = 170;
  ctx.fillStyle = '#06130a'; rr(dx, dy, dw, dh, 14); ctx.fill(); ctx.strokeStyle = '#0c0f12'; ctx.lineWidth = 4; ctx.stroke();
  UI.container('mwdisp', 'board', [dx, dy, dx + dw, dy + dh], 8);
  const txt = m.text || '0:00', ok = k > .97;
  V2.glow(dx + dw / 2, dy + dh / 2, 260, '88,255,122', .35, 'screen', .2);
  UI.label(txt, dx + dw / 2, dy + dh / 2, { size: 150, font: 'Bangers', weight: 400, fill: '#58ff7a', spacing: 6, maxW: dw * .8, cid: 'mwdisp', center: true, hero: ok });
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'CLEAR', 'START'], pressed = m.press ?? -1, hit = [0, 2, 9, 11][pressed] ?? -1, kw = 216, kh = 70, gx = 14, gy = 12, kx0 = x0 + (w - (3 * kw + 2 * gx)) / 2, ky0 = y0 + dh + 56;
  keys.forEach((kk, i) => {
    const cx0 = kx0 + (i % 3) * (kw + gx), cy0 = ky0 + Math.floor(i / 3) * (kh + gy), on = i === hit && lt < bS('q2') + .45 + .17 * 4 + .1;
    UI.panel([cx0, cy0, kw, kh], { r: 12, fill: on ? '#ffe9a8' : '#8d97a2', stroke: '#15171c', lw: 3, id: 'mwk' + i, shadow: 0, hero: false });
    UI.label(kk, cx0 + kw / 2, cy0 + kh / 2, { size: kk.length > 2 ? 34 : 46, font: 'Nunito', weight: 900, fill: on ? '#4a3a10' : '#1a1c22', cid: 'mwk' + i, center: true, hero: ok && kk.length === 1 });
  });
  ctx.restore();
}
function over(lt) {
  const sh = FR.sh;
  if (sh.chip) insChip(lt);
  if (sh.insert === 'stopwatch') insStopwatch(lt, sh); else if (sh.insert === 'lunch') insLunch(lt, sh); else if (sh.insert === 'microwave') insMicrowave(lt, sh);
}

// ------------------------------------------------------------------ the grade, the shutter, the scene
function fx(lt) {
  const sting = Math.max(0, 1 - Math.abs(lt - CUE.sting - .05) / .25), warm = ss(lt, CUE.sting, CUE.sting + .5);
  return { bloom: .38 + .6 * sting, vignette: .4 + .1 * warm, grain: .045, contrast: .1, sat: .02 + .08 * warm, tint: warm > .01 ? [['#ffd9a8', .2 * warm, 'soft-light'], ['#d6f0e2', .1 * (1 - warm), 'soft-light']] : [['#d6f0e2', .1, 'soft-light']], fade: lt < .25 ? 1 - lt / .25 : 0, fadeColor: '14,18,16' };
}
function blur(lt) {
  const sh = shotAt(lt);
  if (SHOTS.some(s => s.n && Math.abs(lt - s.s) < .034)) return 1;                     /* a cut inside the shutter would double-expose */
  if (lt >= CUE.sweep - .02 && lt < T_GRAB + .1) return 6;
  if (lt >= CUE.beep[0] && lt < CUE.beep[2] + STEP_T + .05) return 3;
  return sh.blur || 1;
}
const SC = { shot: lt => shotAt(lt).id, cam, draw, fx, blur, over, clock: () => SCN.clock, label: () => SCN.label };
window.__EP19_SCENES = window.__EP19_SCENES || {};
window.__EP19_SCENES.breakroom = SC;
window.__EP19_BREAK_DEBUG = { fr: () => FR, shotAt, CUE, SHOTS, START };
})();
