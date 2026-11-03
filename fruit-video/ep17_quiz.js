'use strict';
/* SHIFT HAPPENS, Episode 17: "The Module". Scene module: quiz (10:59 PM, THE QUIZ, 22.75 s). Builder E1617-COUNT. Registers window.__EP17_SCENES.quiz.
 *
 * The activity room at night, two cameras (the device of ep15_announce.js / ep16_count.js: ROOM coordinates xr right / y up / zr toward the TV wall mapped through the shot's direction):
 *   'f' = from behind the group looking at the TV wall (the LearnWell quiz on the rolling TV, the wall clock above it at 10:59, the printer stand, the punch clock by the door),
 *   'r' = from the TV end looking back (faces: Mango, Lemon, Onion, Tomato, Strawberry standing around the TV, the rear wall).
 * The TV (a 1280 x 720 window, UI kit text): page 0 START QUIZ, page 1 the question and four options (A, B, C spin, D ticks), page 2 the result ring (100 percent) and confetti, then the break
 * tracker (BREAK: PENDING) and the loop diagram; Binder (A15.binder) and Strawberry's webcam tile live in the page. A printer on a stand beside the TV prints the certificate (VALID UNTIL 11:00 PM, a timer).
 * Shots (scene-local seconds): w0 0 wide f, click .4 | b1 .9 TV question | m1 2.9 Mango | b2 4.41 TV options read | s1 7.39 TV, D then SUBMIT | cert 7.97 printer, ring, confetti | c1 9.66 certificate timer
 *  | o1 11.3 Onion (sniffle) | l1 11.97 Lemon | t1 13.21 Tomato | s2 14.7 Strawberry | pc 15.46 punch clock | o2 16.6 Onion | trk 17.67 break tracker | loop 18.83 loop diagram | pc2 20.2 punch clock, beep red
 *  | clk 20.7 push-in on the wall clock (10:59, second hand ticking, spinner, BREAK PENDING).
 * Cues: click .4 (START QUIZ pressed), click 7.541 (D pressed; SUBMIT a beat later), textding 8.068 (ring 100, confetti, the certificate printed), sniffle 11.362 (Onion), error 20.402 (punch clock flashes red),
 *  pending 20.702 (the spinner ring over the wall clock, the label flips), sting 21.202 (flash, a glint). */
(() => {
if (!window.TIMELINE_EP17 || !window.H6 || !window.S6 || !window.V2 || !window.A15) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, SH15 = window.SH15, S6 = window.S6, PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP17, SCN = TLX.scenes.find(s => s.id === 'quiz'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'quiz') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];      /* scene-local start of the i-th word of a spoken line (the words are line-relative in the timeline) */
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };   /* ease out back */
const rgba = (c, a = 1) => V2.rgba(c, a);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
function key(keys, lt, ease = easeIO) {   /* piecewise keys [[t, v], ...] (v a number or an array), eased between neighbours, held outside */
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}

const CUE = { click0: .4, click: 7.541, textding: 8.068, sniffle: 11.362, error: 20.402, pending: 20.702, sting: 21.202 };
for (const k in CUE) CUE[k] = Math.round((START + CUE[k]) * 30) / 30 - START;   /* the picture hits the video frame nearest each sound cue */

// ------------------------------------------------------------------ the room: ROOM coordinates (xr right when facing the TV, y up, zr toward the TV wall) mapped through the shot's direction
const RM = { hw: 900, ch: 1000, zTV: 1500, zRear: -1100, rail: 150 };
const D = { dir: 'f' };
const mapX = xr => D.dir === 'f' ? xr : -xr;
const mapZ = zr => D.dir === 'f' ? zr : RM.zTV - zr;
const P = (xr, y, zr) => V2.p2(mapX(xr), y, mapZ(zr));
const kAt = zr => V2.P.f / (mapZ(zr) - V2.P.cz);
const depthOf = zr => mapZ(zr) - V2.P.cz;
function polyW(pts, fill, stroke, lw) {   /* a polygon of world points, clipped at the camera's near plane first */
  const near = V2.P.cz + 90, out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= near, ib = b[2] >= near;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (near - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), near]); }
  }
  if (out.length >= 3) V2.poly(out.map(p => V2.p2(p[0], p[1], p[2])), fill, stroke, lw);
}
const polyR = (pts, fill, stroke, lw) => polyW(pts.map(p => [mapX(p[0]), p[1], mapZ(p[2])]), fill, stroke, lw);
const wallR = (side, y0, y1, z0, z1, fill, stroke, lw) => polyR([[side * RM.hw, y0, z0], [side * RM.hw, y1, z0], [side * RM.hw, y1, z1], [side * RM.hw, y0, z1]], fill, stroke, lw);
function boxR(xa, xb, y0, y1, za, zb, o) {   /* a box in room coordinates (sorted so box3 sees x0 < x1 and z0 < z1 in the shot's direction) */
  const xs = [mapX(xa), mapX(xb)].sort((a, b) => a - b), zs = [mapZ(za), mapZ(zb)].sort((a, b) => a - b);
  return S6.box3(Object.assign({ x0: xs[0], x1: xs[1], y0, y1, z0: zs[0], z1: zs[1] }, o));
}
const facing = (x0, x1, y0, y1, zr) => { const a = P(x0, y1, zr), b = P(x1, y0, zr); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) }; };
const flatR = (x0, x1, y0, y1, zr, fill, stroke, lw, r = 0) => { const q = facing(x0, x1, y0, y1, zr); if (depthOf(zr) < 140) return q; if (r) { rr(q.x, q.y, q.w, q.h, r * kAt(zr)); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } } else polyR([[x0, y0, zr], [x1, y0, zr], [x1, y1, zr], [x0, y1, zr]], fill, stroke, lw); return q; };
function dress(str, xr, y, zr, o = {}) {   /* hero:false lettering for set dressing on a facing wall; hidden unless wholly in the frame */
  if (depthOf(zr) < 140) return;
  const k = kAt(zr), [x, yy] = P(xr, y, zr), size = (o.size || 40) * k;
  if (size < 7) return;
  UI.label(str, x, yy, Object.assign({ size, hero: false, crop: true, weight: 900 }, o, { size }));
}
// ------------------------------------------------------------------ hero-text helpers for anything drawn in a scaled frame (the TV): hero only when big enough and wholly in the safe area
let TVH = true;
const scaleNow = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };
function safeBox(x0, y0, x1, y1, mg = 44) {
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}
function tvLabel(str, cx, cy, o = {}) {
  const sc = scaleNow(), size = o.size || 40, ink = UI.sizeOf(str, { size, weight: o.weight || 900, font: o.font }), left = o.align === 'left', right = o.align === 'right';
  const x0 = left ? cx : right ? cx - ink.w : cx - ink.w / 2, hero = o.hero !== false && TVH && size * sc >= 31 && safeBox(x0, cy - size * .4, x0 + ink.w, cy + size * .4, 44);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: !hero }));
}


const lit = (c, f) => S6.lit(c, f);
const ROOMC = { wall: '#e7d5bf', wain: '#6f8f86', floorA: '#bfae8e', floorB: '#968563', ceil: '#e8e2d6', fog: '#6b6585' };
function shell(lt) {
  const far = D.dir === 'f' ? RM.zTV : RM.zTV - RM.zRear;
  S6.shell({ zb: far, hw: RM.hw, ch: RM.ch, rail: RM.rail, wall: ROOMC.wall, wain: ROOMC.wain, floorA: ROOMC.floorA, floorB: ROOMC.floorB, ceil: ROOMC.ceil, fog: ROOMC.fog, fogAmt: .24, tile: 150, bright: .9 });
  const zs = D.dir === 'f' ? [-100, 360, 820, 1280] : [140, 600, 1060, 1520, 1980];
  for (const X of [-300, 300]) for (const Z of zs) if (Z > V2.P.cz + 260) S6.ceilingLamp(X, Z, RM.ch, 1, '255,226,180', 110, 190);
}
/* the side walls: a night window with curtains on the left, a bulletin board and a stack of folding chairs on the right */
function sides(lt) {
  wallR(-1, 236, 800, 296, 764, '#e8e0cf', 'rgba(25,16,30,.6)', 3);
  wallR(-1, 262, 774, 322, 738, '#12204a', null, 0);
  wallR(-1, 262, 774, 524, 536, '#e8e0cf'); wallR(-1, 508, 520, 322, 738, '#e8e0cf');
  for (const [z, y] of [[360, 700], [450, 620], [640, 720], [690, 560], [400, 330], [600, 400]]) wallR(-1, y, y + 6, z, z + 6, 'rgba(255,255,230,.85)');
  wallR(-1, 262, 810, 296, 350, '#7a4a58', 'rgba(25,16,30,.4)', 1.6); wallR(-1, 262, 810, 712, 766, '#7a4a58', 'rgba(25,16,30,.4)', 1.6);
  wallR(1, 250, 470, -380, -120, '#b98a5a', 'rgba(25,16,30,.7)', 3);
  for (const [z, y, c] of [[-340, 400, '#fff3a6'], [-260, 330, '#ffb3c6'], [-190, 410, '#bfe3ff'], [-160, 300, '#d8ffb0']]) wallR(1, y, y + 54, z - 34, z + 34, c, 'rgba(25,16,30,.35)', 1.4);
  const ch = { color: '#4a5f86', top: '#6a80a8', front: '#3d4f74', side: '#2f3e5e', lw: 1.4 };
  for (let i = 0; i < 4; i++) boxR(790, 888, i * 46, i * 46 + 40, 660 + i * 6, 800 + i * 6, ch);
}
const TVG = { cx: -120, bot: 262, w: 720, h: 405, bez: 26 };
const CLK = { x: TVG.cx, y: 850, R: 100 };
const PCK = { x: 715, y: 250, w: 150, h: 200 };
const PRT = { x: 380, z: 1380 };

// ------------------------------------------------------------------ the wall clock (10:59, the second hand ticks, then the spinner and the flipping label), the punch clock, the printer and the certificate
const SEC0 = 41;
function bigClock(lt, big) {
  const z = RM.zTV - 8, k = kAt(z); if (depthOf(z) < 140) return;
  const [x, y] = P(CLK.x, CLK.y, z), R = CLK.R, sp = ss(lt, CUE.pending, CUE.pending + .35);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,12,30,.25)'; ell(0, 8, R + 12, R + 12); ctx.fill();
  ctx.fillStyle = '#24202c'; ell(0, 0, R + 10, R + 10); ctx.fill();
  ctx.fillStyle = lg(0, -R, 0, R, [[0, '#fffefa'], [1, '#e9e6dc']]); ell(0, 0, R, R); ctx.fill();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big5 = i % 5 === 0; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = big5 ? 4 : 1.6; ctx.beginPath(); ctx.moveTo(Math.sin(a) * (R - (big5 ? 16 : 9)), -Math.cos(a) * (R - (big5 ? 16 : 9))); ctx.lineTo(Math.sin(a) * (R - 4), -Math.cos(a) * (R - 4)); ctx.stroke(); }
  [['12', 0, -62], ['3', 62, 0], ['6', 0, 62], ['9', -62, 0]].forEach(([n, nx, ny]) => UI.label(n, nx, ny, { size: 24, weight: 900, fill: '#2a2530', hero: false, crop: true }));
  const hand = (ang, len, w, col, tail) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-Math.sin(ang) * tail, Math.cos(ang) * tail); ctx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len); ctx.stroke(); };
  hand((10 + 59 / 60) / 12 * TAU, 52, 8, '#2a2530', 10); hand(59 / 60 * TAU, 80, 5.5, '#2a2530', 12);
  const s = SEC0 + lt, tick = eb(c01((s % 1) / .13)); hand((Math.floor(s) + tick) / 60 * TAU, 88, 2.6, '#c1121f', 22);
  ctx.fillStyle = '#c1121f'; ell(0, 0, 6, 6); ctx.fill();
  if (sp > 0) {   /* the spinner ring over the face: a dim wash and twelve dots chasing round */
    ctx.save(); ctx.globalAlpha *= sp; ctx.fillStyle = 'rgba(16,26,56,.52)'; ell(0, 0, R, R); ctx.fill();
    const t = lt - CUE.pending; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - t * 5.4, al = ((i / 12 - t * .9) % 1 + 1) % 1; ctx.fillStyle = rgba('#bfe6ff', .2 + .8 * (1 - al)); ell(Math.cos(a) * R * .74, Math.sin(a) * R * .74, 9, 9); ctx.fill(); }
    ctx.restore();
  }
  /* the plaque under the clock: BREAK IN 1 MIN becomes BREAK PENDING, letter by letter */
  const py = R + 52, pw = 300, ph = 54, u = sg(lt, CUE.pending, CUE.pending + .8);
  UI.panel([-pw / 2, py - ph / 2, pw, ph], { id: 'clkplate', kind: 'sign', fill: '#1d2a3a', stroke: '#e8e0cf', lw: 3, r: 10, pad: 4, hero: false });
  SH15.flipText('BREAK IN 1 MIN', 'BREAK PENDING', u, { cx: 0, cy: py, size: 26, weight: 900, fill: '#eaf6ff', maxW: pw - 24, cid: 'clkplate', center: true, hero: TVH && big });
  ctx.restore();
}
function punchClock(lt) {
  const z = RM.zTV - 12, k = kAt(z); if (depthOf(z) < 140) return;
  const [x, y] = P(PCK.x, PCK.y, z), err = lt >= CUE.error, et = lt - CUE.error, blink = err && et < 1.4 ? (Math.floor(et * 5) % 2 === 0 ? 1 : .35) : (err ? 1 : 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,12,30,.3)'; rr(-PCK.w / 2 + 6, -PCK.h / 2 + 10, PCK.w, PCK.h, 18); ctx.fill();
  ctx.fillStyle = lg(0, -PCK.h / 2, 0, PCK.h / 2, [[0, '#b9bec9'], [1, '#7e8594']]); ctx.strokeStyle = 'rgba(20,22,30,.9)'; ctx.lineWidth = 4; rr(-PCK.w / 2, -PCK.h / 2, PCK.w, PCK.h, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = err ? rgba('#3a0a0a', 1) : '#06140c'; ctx.strokeStyle = '#15171c'; ctx.lineWidth = 4; rr(-60, -88, 120, 58, 6); ctx.fill(); ctx.stroke();
  const lines = lt < bS('o2') ? ['10:59 PM'] : err ? ['ERROR', 'BREAK PENDING'] : ['CLOCK OUT', 'BREAK REQUIRED'], col = err ? rgba('#ff5a4a', blink) : lt < bS('o2') ? '#58ff7a' : '#ffbf1f';
  if (lines.length === 1) tvLabel(lines[0], 0, -59, { size: 24, weight: 900, fill: col, maxW: 108, hero: false });
  else { tvLabel(lines[0], 0, -73, { size: 17, weight: 900, fill: col, maxW: 108 }); tvLabel(lines[1], 0, -49, { size: 13.5, weight: 900, fill: col, maxW: 108 }); }
  ctx.fillStyle = '#15171c'; rr(-44, -14, 88, 14, 4); ctx.fill();
  ctx.fillStyle = '#fbf6e4'; ctx.strokeStyle = 'rgba(30,26,20,.8)'; ctx.lineWidth = 2.4; rr(-30, -46, 60, 66, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c43a2a'; ctx.fillRect(-30, -40, 60, 8); ctx.fillStyle = 'rgba(60,60,80,.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(-22, -22 + i * 9, 44 - (i % 2) * 14, 3);
  ctx.fillStyle = '#15171c'; rr(-44, -8, 88, 20, 4); ctx.fill();
  for (const [bx, c] of [[-28, err ? rgba('#ff3a2a', .55 + .45 * blink) : '#2fbf6a'], [0, '#e8a31f'], [28, '#c43a2a']]) { ctx.fillStyle = c; ctx.strokeStyle = '#15171c'; ctx.lineWidth = 3; ell(bx, 60, 12, 12); ctx.fill(); ctx.stroke(); }
  if (err && et < .6) { ctx.strokeStyle = `rgba(255,70,50,${.8 * (1 - et / .6)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -59, 50 + et * 260, 0, TAU); ctx.stroke(); }
  ctx.restore();
  if (err && blink > .6 && et < 1.4) V2.glow(x, y - 59 * k, 170 * k, '255,80,60', .4, 'screen', .5);
}
const T_PRINT = CUE.textding, T_PEND = 0;
function printerDraw(lt) {
  boxR(PRT.x - 90, PRT.x + 90, 0, 170, PRT.z - 50, PRT.z + 50, { color: '#b98a5a', top: '#d9ae7a', front: '#a8794a', side: '#8a6038', lw: 1.6 });
  boxR(PRT.x - 80, PRT.x + 80, 170, 250, PRT.z - 42, PRT.z + 44, { color: '#d7dbe3', top: '#f1f3f7', front: '#c3c8d3', side: '#9aa1b0', lw: 1.6 });
  const zf = PRT.z - 42; polyR([[PRT.x - 62, 232, zf], [PRT.x + 62, 232, zf], [PRT.x + 62, 240, zf], [PRT.x - 62, 240, zf]], '#262932');
  const [lx, ly] = P(PRT.x + 66, 212, zf), k = kAt(zf); ctx.fillStyle = lt >= T_PRINT && lt < T_PRINT + 1.2 ? '#58ff8c' : '#4a9a5a'; ell(lx, ly, 3.5 * k, 3.5 * k); ctx.fill();
}
const certU = lt => ss(lt, T_PRINT + .1, T_PRINT + .9), T_TIMER = T_PRINT + .8;
const timerOf = lt => Math.max(0, 59 - Math.floor(Math.max(0, lt - T_TIMER)));
function certificate(lt) {
  const u = certU(lt); if (u <= 0) return;
  const z = PRT.z - 46, k = kAt(z), slot = P(PRT.x, 240, z), top = 240 + 230 * u, yc = top - 115, [x, y] = P(PRT.x, yc, z);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, slot[1] + 2); ctx.clip();
  ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#fbf6e4'; ctx.strokeStyle = '#1f6a46'; ctx.lineWidth = 5; rr(-150, -115, 300, 230, 8); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.strokeStyle = 'rgba(31,106,70,.45)'; ctx.lineWidth = 2; rr(-140, -105, 280, 210, 5); ctx.stroke();
  const cid = 'cert', settled = u >= 1;
  UI.container(cid, 'sign', [-150, -115, 150, 115], 10);
  const hz = o => Object.assign({ cid, hero: settled && TVH, crop: !(settled && TVH) }, o);
  tvLabel('CERTIFICATE OF COMPLETION', 0, -78, hz({ size: 19, weight: 900, fill: '#1f3a28', maxW: 262 }));
  tvLabel('BREAK SAFETY', 0, -30, hz({ size: 40, weight: 900, fill: '#1f6a46', maxW: 262 }));
  tvLabel('VALID UNTIL 11:00 PM', 0, 20, hz({ size: 22, weight: 900, fill: '#2a2530', maxW: 262 }));
  const tn = timerOf(lt), pulseT = lt > T_TIMER ? Math.exp(-((lt - T_TIMER) % 1) * 7) : 0;
  ctx.save(); ctx.translate(0, 76); ctx.scale(1 + .1 * pulseT, 1 + .1 * pulseT); ctx.translate(0, -76);
  tvLabel('EXPIRES IN 00:' + String(tn).padStart(2, '0'), 0, 76, hz({ size: 24, weight: 900, fill: tn < 50 ? '#b3261e' : '#8a5a12', maxW: 250, grp: 'timer' }));
  ctx.restore();
  ctx.restore();
}
function tvWall(lt) {
  const z = RM.zTV - 4;
  flatR(-860, -520, 300, 620, z, '#7a5a3c', 'rgba(25,16,30,.6)', 2, 6);
  flatR(-846, -534, 314, 606, z, '#c9a06a', 'rgba(40,24,16,.5)', 1.5, 4);
  const notes = [[-830, 480, -720, 580, '#ffffff', '#d6202e'], [-700, 500, -552, 590, '#fff6d8', '#2a5ac8'], [-830, 340, -720, 450, '#e9f5ff', '#3a9a5a'], [-690, 350, -552, 460, '#fff0f0', '#e8852a']];
  notes.forEach(([a, b, c, d, f, hi]) => { flatR(a, c, b, d, z, f, 'rgba(60,40,20,.45)', 1, 2); flatR(a + 3, c - 3, d - 14, d - 3, z, hi, null, 0); for (let j = 0; j < 3; j++) polyR([[a + 10, b + 14 + j * 15, z], [c - 12, b + 14 + j * 15, z], [c - 12, b + 16 + j * 15, z], [a + 10, b + 16 + j * 15, z]], 'rgba(40,40,60,.38)'); });
  dress('MANDATORY TRAINING', -690, 650, z, { size: 30, fill: '#fff6d8', stroke: '#5a3a22', lw: 5 });
  S6.plant3(mapX(-860), z - 60, 1.2);
  flatR(560, 880, 0, 12, z, 'rgba(0,0,0,.12)');
}
/* the rear wall (r): double doors, an EXIT sign, a fire extinguisher (dressing) */
function rearWall(lt) {
  const z = RM.zRear + 4;
  flatR(-300, 300, 0, 470, z, '#c9a06a', 'rgba(25,16,30,.6)', 3, 4);
  for (const [a, b] of [[-292, -6], [6, 292]]) { flatR(a, b, 8, 462, z, '#d8b27c', 'rgba(25,16,30,.5)', 2, 3); flatR(a + 60, b - 60, 250, 420, z, '#9fc1c6', 'rgba(25,16,30,.5)', 2, 3); }
  flatR(-80, 80, 540, 600, z, '#1f8a4a', 'rgba(10,40,20,.8)', 2.5, 6); dress('EXIT', 0, 570, z, { size: 40, fill: '#eafff0' });
  flatR(-560, -510, 40, 210, z, '#c43a2a', 'rgba(60,10,10,.8)', 2, 8);
  flatR(420, 470, 200, 300, z, '#e8ecef', 'rgba(25,16,30,.5)', 2, 6);
}
// ------------------------------------------------------------------ the rolling TV cart (f): the screen's rectangle is returned for the page to paint
function tvCart(lt, paint) {
  const z = RM.zTV - 90, k = kAt(z), cx = TVG.cx, top = TVG.bot + TVG.h;
  { const [sx, sy] = P(cx, 0, z); ctx.fillStyle = 'rgba(30,18,10,.28)'; ell(sx, sy + 6 * k, 420 * k, 38 * k); ctx.fill(); }
  const steel = { color: '#4e5360', top: '#8d94a3', front: '#434856', side: '#363a46', lw: 1.4 };
  boxR(cx - 330, cx + 330, 26, 52, z - 40, z + 40, steel);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [px, py] = P(cx + sx * 300, 0, z + sz * 30); ctx.fillStyle = '#23252c'; ell(px, py - 12 * k, 16 * k, 14 * k); ctx.fill(); ctx.fillStyle = '#8a8f9a'; ell(px, py - 12 * k, 6 * k, 6 * k); ctx.fill(); }
  boxR(cx - 320, cx + 320, 236, 252, z - 44, z + 44, { color: '#5d6270', top: '#a6adbb', front: '#4a4f5c', side: '#3c404c', lw: 1.6 });
  for (const sx of [-1, 1]) boxR(cx + sx * 260 - 9, cx + sx * 260 + 9, 40, top - 30, z - 12, z + 12, steel);
  boxR(cx - 290, cx + 290, TVG.bot - 22, TVG.bot - 4, z - 14, z + 14, steel);
  const bz = TVG.bez, x0 = cx - TVG.w / 2, x1 = cx + TVG.w / 2, y0 = TVG.bot, y1 = top, zf = z - 20;
  boxR(x0 - bz, x1 + bz, y0 - bz, y1 + bz, z - 18, z + 18, { color: '#17181d', top: '#2b2d35', front: '#101116', side: '#0b0c10', lw: 2, edge: 'rgba(0,0,0,.8)' });
  const scr = facing(x0, x1, y0, y1, zf);
  { const [lx, ly] = P(cx, y1 + bz + 10, z - 17); ctx.fillStyle = '#16181e'; ell(lx, ly, 8 * k, 8 * k); ctx.fill(); ctx.fillStyle = '#5a6ad8'; ell(lx, ly, 3.5 * k, 3.5 * k); ctx.fill(); ctx.fillStyle = '#ff4a3a'; ell(lx + 34 * k, ly, 3 * k, 3 * k); ctx.fill(); }
  if (paint) paint(scr);
  return scr;
}

// ------------------------------------------------------------------ the LearnWell page on the TV (a 1280 x 720 window): start, the question and four options, the result, the break tracker, the loop
const T_P1 = CUE.click0 + .12, T_RES = bS('b3'), T_TRK = bS('s3'), T_LOOP = bS('t2');
const OPT = [['A', 'Pending', wS('b2', 0), wS('b2', 1)], ['B', 'Pending', wS('b2', 2), wS('b2', 3)], ['C', 'Pending', wS('b2', 4), wS('b2', 5)], ['D', 'All of the above', wS('b2', 6), wS('b2', 10)]];
const OPT_END = [OPT[1][2], OPT[2][2], OPT[3][2], wE('b2', 10)];
const ROWY = [292, 374, 456, 538], PTX = { start: [640, 484], d: [104, 538], submit: [700, 646] };
const PTR = [{ t: .02, x: 980, y: 600, kind: 'arrow' }, { t: CUE.click0 - .04, x: PTX.start[0] + 30, y: PTX.start[1] + 8, click: [CUE.click0 - .08, CUE.click0 + .12] }, { t: 1.5, x: 1000, y: 470 }, { t: 3.4, x: 1000, y: 430 },
  { t: CUE.click - .06, x: PTX.d[0] + 6, y: PTX.d[1] + 4, click: [CUE.click - .1, CUE.click + .12] }, { t: 7.86, x: PTX.submit[0] + 40, y: PTX.submit[1] + 10, click: [7.8, 7.96] }];
function spinner(cx, cy, r, t, col = '#2b6cff') { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - t * 6, al = ((i / 10 - t * 1.0) % 1 + 1) % 1; ctx.fillStyle = rgba(col, .15 + .85 * (1 - al)); ell(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * .17, r * .17); ctx.fill(); } }
function quizHeader(lt, hero) {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1280, 80); ctx.fillStyle = '#d9e0ea'; ctx.fillRect(0, 80, 1280, 2);
  ctx.fillStyle = '#1e8e5a'; ell(60, 40, 22, 22); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(52, 50); ctx.quadraticCurveTo(48, 28, 70, 28); ctx.quadraticCurveTo(70, 46, 52, 50); ctx.closePath(); ctx.fill();
  UI.label('LearnWell', 100, 40, { size: 34, weight: 900, fill: '#16202e', align: 'left', hero: false, crop: true });
  UI.label('MODULE 7 OF 7', 760, 40, { size: 26, weight: 900, fill: '#5b6470', align: 'right', hero: false, crop: true });
  for (let i = 0; i < 7; i++) { ctx.fillStyle = '#1e8e5a'; rr(782 + i * 46, 33, 38, 14, 7); ctx.fill(); }
  UI.label('S. STRAWBERRY', 1230, 40, { size: 24, weight: 800, fill: '#5b6470', align: 'right', hero: false, crop: true });
}
function webcamTile(lt) {
  const x = 860, y = 108, w = 380, h = 250;
  ctx.save(); ctx.fillStyle = '#0f1622'; rr(x - 4, y - 4, w + 8, h + 8, 14); ctx.fill(); ctx.beginPath(); rr(x, y, w, h, 10); ctx.clip();
  ctx.fillStyle = lg(x, y, x, y + h, [[0, '#6b7a99'], [1, '#2c3550']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, y + h * .62, w, 4);
  REG.suppress++;
  try { drawChar((A11 || A7).straw({ x: x + w / 2, y: y + h + 112, s: .68, noLegs: true, noShadow: true, noReflect: true, plant: true, t: lt, who: 'straw', expr: 'weak', lid: .3, look: [0, .1], arms: { l: 'rest', r: 'rest' } })); } finally { REG.suppress--; }
  ctx.restore();
  ctx.fillStyle = rgba('#ff3a2a', .6 + .4 * Math.sin(lt * 4)); ell(x + 22, y + 24, 7, 7); ctx.fill();
  UI.label('PROCTOR CAM', x + 40, y + 24, { size: 20, weight: 900, fill: '#ffffff', align: 'left', hero: false, crop: true });
}
function binderTV(lt) {
  REG.suppress++;
  try { drawChar(A15.binder({ x: 1050, y: 540, s: .5, center: true, noLegs: true, who: 'bind', t: lt, pose: 'wave', look: [-.5, .1], hover: false, bob: 1, expr: 'bind_happy' })); } finally { REG.suppress--; }
  UI.label('BINDER IS PROCTORING', 1050, 650, { size: 22, weight: 900, fill: '#5b6470', hero: false, crop: true });
}
function quizWin(lt) {
  const sc = scaleNow();
  ctx.fillStyle = '#f2f5fa'; ctx.fillRect(0, 0, 1280, 720);
  quizHeader(lt);
  if (lt < T_P1) {   /* page 0: the title and START QUIZ */
    tvLabel('MODULE 7: HOW TO TAKE A BREAK SAFELY', 640, 250, { size: 50, weight: 900, fill: '#16202e', maxW: 1100 });
    tvLabel('FINAL QUIZ', 640, 340, { size: 40, weight: 800, fill: '#5b6470' });
    const press = sg(lt, CUE.click0 - .06, CUE.click0), b = UI.pill('START QUIZ', PTX.start[0], PTX.start[1], { size: 40, fill: '#2b6cff', ink: '#fff', minW: 300, h: 78, hero: TVH && sc * 40 >= 31, crop: !(TVH && sc * 40 >= 31), id: 'startq' });
  } else if (lt < T_RES) {   /* page 1: the question, the options, the webcam, Binder, SUBMIT */
    const qk = sg(lt, wS('b1', 2) - .02, wE('b1', 7) - .05), q1 = ss(lt, bS('b1') - .05, bS('b1') + .3);
    ctx.save(); ctx.globalAlpha *= q1; UI.label('QUESTION 1 OF 1', 60, 132, { size: 28, weight: 900, fill: '#2b6cff', align: 'left', hero: false, crop: true }); ctx.restore();
    tvLabel('When should you take a break?', 60, 202, { size: 50, weight: 900, fill: '#16202e', align: 'left', maxW: 770, reveal: qk, hero: qk >= 1 });
    OPT.forEach(([L, txt, t0, tp], i) => {
      const cy = ROWY[i], on = lt >= t0 && lt < OPT_END[i], sel = i === 3 && lt >= CUE.click, spin = i < 3 && lt >= tp, tick = i === 3 && lt >= tp, a = ss(lt, 2.0 + i * .15, 2.4 + i * .15);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = sel ? '#eaf1ff' : on ? '#fff7dd' : '#ffffff'; ctx.strokeStyle = sel ? '#2b6cff' : on ? '#e8a31f' : '#d7dde6'; ctx.lineWidth = sel || on ? 4 : 2; rr(60, cy - 35, 760, 70, 14); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = sel ? '#2b6cff' : '#9aa5b5'; ctx.lineWidth = 3; ell(104, cy, 16, 16); ctx.stroke(); if (sel) { ctx.fillStyle = '#2b6cff'; ell(104, cy, 9, 9); ctx.fill(); }
      tvLabel(L, 152, cy, { size: 38, weight: 900, fill: '#2b6cff', hero: false });
      tvLabel(txt, 200, cy, { size: 40, weight: 800, fill: '#16202e', align: 'left', maxW: 520, hero: a >= 1 });
      if (spin) spinner(768, cy, 17, lt, '#e8a31f');
      if (tick) { const u = eb(sg(lt, tp, tp + .25)); ctx.save(); ctx.translate(768, cy); ctx.scale(u, u); ctx.fillStyle = '#1e8e5a'; ell(0, 0, 20, 20); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(-2, 8); ctx.lineTo(10, -8); ctx.stroke(); ctx.restore(); }
      ctx.restore();
    });
    const sub = lt >= CUE.click, pr = sg(lt, 7.8, 7.88) * (lt < 7.97 ? 1 : 0);
    ctx.save(); ctx.translate(PTX.submit[0], PTX.submit[1] + 2 * pr);
    UI.pill('SUBMIT', 0, 0, { size: 36, fill: sub ? '#2b6cff' : '#aab4c4', ink: '#fff', minW: 230, h: 66, hero: TVH && sc * 36 >= 31 && sub, crop: !(TVH && sc * 36 >= 31 && sub), id: 'submitq' }); ctx.restore();
    webcamTile(lt); binderTV(lt);
  } else {
    const k = c01((lt - T_RES) / .25);
    if (lt < T_TRK) {   /* page 2: the result, a ring filling to 100 percent, PASSED, confetti */
      const rk = ss(lt, CUE.textding, CUE.textding + .8), done = rk >= 1;
      ctx.fillStyle = lg(0, 82, 0, 720, [[0, '#e9f7ef'], [1, '#cdeedb']]); ctx.fillRect(0, 82, 1280, 640);
      UI.ring(640, 300, 150, rk, { lw: 26, track: '#c7dccf', color: '#1e8e5a', text: Math.round(100 * rk) + '%', size: 96, ink: '#0f5a38', hero: done && TVH && sc * 96 >= 31, crop: !(done && TVH), id: 'scorering' });
      if (done) tvLabel('YOU PASSED', 640, 520, { size: 84, weight: 900, fill: '#0f5a38', hero: TVH });
      UI.label('MODULE 7: COMPLETE', 640, 620, { size: 34, weight: 800, fill: '#3d6a50', hero: false, crop: true });
      for (let i = 0; i < 70; i++) { const a = lt - CUE.textding - hash(i * 2.7) * .35; if (a < 0) continue; const x = 60 + hash(i * 3.1) * 1160 + Math.sin(a * 3 + i) * 30, y = 90 + a * (300 + hash(i * 1.3) * 300); if (y > 740) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(a * 4 + i); ctx.fillStyle = ['#ffd23a', '#ff4d6d', '#37c8ff', '#7dff8a', '#b68cff'][i % 5]; ctx.fillRect(-7, -3, 14, 6); ctx.restore(); }
    } else if (lt < T_LOOP) {   /* the break tracker: BREAK: PENDING with a spinner, her webcam in the corner */
      ctx.fillStyle = '#f2f5fa'; ctx.fillRect(0, 82, 1280, 640);
      UI.label('BREAK TRACKER', 60, 132, { size: 28, weight: 900, fill: '#2b6cff', align: 'left', hero: false, crop: true });
      const a = ss(lt, T_TRK, T_TRK + .25);
      ctx.save(); ctx.globalAlpha *= a; UI.panel([60, 190, 760, 250], { id: 'trk', kind: 'sign', fill: '#ffffff', stroke: '#d7dde6', lw: 3, r: 20, pad: 8, hero: false });
      tvLabel('BREAK:', 150, 315, { size: 72, weight: 900, fill: '#16202e', align: 'left', hero: a >= 1, maxW: 260 });
      tvLabel('PENDING', 440, 315, { size: 90, weight: 900, fill: '#c97a00', align: 'left', hero: a >= 1, maxW: 340 });
      spinner(740, 315, 34, lt, '#e8a31f'); ctx.restore();
      UI.label('REQUESTED: SINCE THE MERGER', 60, 500, { size: 28, weight: 800, fill: '#7a8494', align: 'left', hero: false, crop: true });
      webcamTile(lt);
    } else {   /* the loop: CLOCK OUT to BREAK to CLOCK OUT, a dot chasing round it */
      ctx.fillStyle = '#f2f5fa'; ctx.fillRect(0, 82, 1280, 640);
      const a = ss(lt, T_LOOP, T_LOOP + .2), t = lt - T_LOOP;
      ctx.save(); ctx.globalAlpha *= a;
      UI.panel([140, 300, 360, 130], { id: 'lp1', kind: 'sign', fill: '#ffffff', stroke: '#2b6cff', lw: 6, r: 22, pad: 8, hero: false }); tvLabel('CLOCK OUT', 320, 365, { size: 54, weight: 900, fill: '#16202e', maxW: 320, hero: a >= 1, cid: 'lp1', center: true });
      UI.panel([780, 300, 360, 130], { id: 'lp2', kind: 'sign', fill: '#ffffff', stroke: '#e8a31f', lw: 6, r: 22, pad: 8, hero: false }); tvLabel('BREAK', 960, 365, { size: 54, weight: 900, fill: '#16202e', maxW: 320, hero: a >= 1, cid: 'lp2', center: true });
      ctx.strokeStyle = '#7a8494'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(500, 365 + sgn * 30); ctx.bezierCurveTo(600, 365 + sgn * 150, 680, 365 + sgn * 150, 780, 365 + sgn * 30); ctx.stroke(); }
      ctx.fillStyle = '#7a8494'; for (const [px, py, an] of [[780, 395, -.8], [500, 335, 2.35]]) { ctx.save(); ctx.translate(px, py); ctx.rotate(an); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-22, -14); ctx.lineTo(-22, 14); ctx.closePath(); ctx.fill(); ctx.restore(); }
      const ph = t * 1.6 % 2, top = ph < 1, u = top ? ph : ph - 1, bx = lerp(500, 780, u) * (top ? 1 : 1), px = top ? lerp(500, 780, u) : lerp(780, 500, u), py = 365 + (top ? 1 : -1) * (30 + 108 * Math.sin(PI * u));
      ctx.fillStyle = '#ff4d6d'; ell(px, py + (top ? 0 : 0), 14, 14); ctx.fill();
      ctx.restore();
    }
  }
  if (lt < 8.0) { const p = SH15.cursorPath(PTR, lt); SH15.pointer(p.x, p.y, { kind: p.kind, press: p.press, s: 1.8 }); }
}
function paintTV(lt, scr) {
  if (!scr || scr.w < 20) return;
  ctx.save(); ctx.beginPath(); ctx.rect(scr.x, scr.y, scr.w, scr.h); ctx.clip();
  ctx.translate(scr.x, scr.y); ctx.scale(scr.w / 1280, scr.w / 1280);
  quizWin(lt);
  ctx.restore();
  V2.glow(scr.x + scr.w / 2, scr.y + scr.h / 2, scr.w * .9, '170,200,255', .1, 'screen', .5);
}

// ------------------------------------------------------------------ the cast: standing around the TV (all face the TV, +zr), the wireless mouse in Strawberry's hand
EXT.prop.fp17_mouse = (side, o, t) => {
  const pr = o.mouseP || 0;
  ctx.save(); ctx.rotate(o.mouseRot ?? -.3); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(-14, -30, 14, 20, [[0, '#ffffff'], [1, '#b9c0cc']]); ctx.strokeStyle = 'rgba(14,16,24,.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-15, 14); ctx.bezierCurveTo(-19, -10, -12, -32, 0, -32); ctx.bezierCurveTo(12, -32, 19, -10, 15, 14); ctx.bezierCurveTo(10, 24, -10, 24, -15, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(14,16,24,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(0, -10); ctx.moveTo(-16, -10); ctx.lineTo(16, -10); ctx.stroke();
  if (pr > .02) { ctx.fillStyle = `rgba(43,108,255,${.5 * pr})`; ctx.fillRect(-14, -30 + 3 * pr, 13, 20); }
  ctx.fillStyle = '#2fbf6a'; ell(0, 4, 2.6, 2.6); ctx.fill();
  ctx.restore();
};
PROP_BOX.fp17_mouse = [-22, -36, 22, 28];
const SEATS = { straw: [-60, 300], lemon: [-270, 340], mango: [-470, 400], onion: [150, 330], tom: [350, 410] };
const CTOR = { mango: o => A7.mango(o), lemon: o => A7.lemon(o), onion: o => A15.onion(o), straw: o => A11.straw(o), tom: o => A15.tomato(o) };
const ACT = {};
function exprAt(list, lt) { let r = list[0][1]; for (const [t, e] of list) if (lt >= t) r = e; return r; }
function person(name, lt) {
  const [xr, zr] = SEATS[name], a = (ACT[name] ? ACT[name](lt) : null) || {};
  const q = V2.at(mapX(xr), mapZ(zr)), turn = p => D.dir === 'f' ? PI - p : -p;
  const o = Object.assign({ x: q.x, y: q.y, s: q.s * .95, t: lt, expr: 'neutral', arms: { l: 'rest', r: 'rest' } }, a.o || {});
  o.yaw = turn(a.psiB ?? 0); o.headYaw = turn(a.psiH ?? a.psiB ?? 0);
  if (a.look) o.look = a.look; if (a.expr) o.expr = a.expr; if (a.lid !== undefined) o.lid = a.lid;
  return CTOR[name](o);
}
const sw = (lt, f, ph, amp) => Math.sin(lt * f + ph) * amp;
ACT.straw = lt => ({ psiB: 0, psiH: sw(lt, .7, 0, .06), expr: exprAt([[0, 'weak'], [17.6, 'sad']], lt), lid: .3, look: lt > 7 && lt < 8 ? [.2, 0] : [0, 0],
  o: { arms: { l: 'rest', r: 'hold' }, grip: { r: [62, 44] }, hold: { r: 'fp17_mouse' }, mouseP: Math.max(0, 1 - Math.abs(lt - CUE.click) * 9) + (lt > 7.8 && lt < 7.95 ? 1 : 0) + (lt > CUE.click0 - .08 && lt < CUE.click0 + .12 ? 1 : 0) } });
ACT.lemon = lt => ({ psiB: .3, psiH: .3 + sw(lt, .6, 1, .06), expr: exprAt([[0, 'neutral'], [11.97, 'sour'], [13.4, 'neutral']], lt), look: [0, 0] });
ACT.mango = lt => ({ psiB: .4, psiH: .4 + sw(lt, .8, 2, .08), expr: exprAt([[0, 'neutral'], [2.8, 'sour'], [4.5, 'neutral'], [9.6, 'shock'], [12, 'neutral']], lt), look: [.1, 0] });
ACT.onion = lt => ({ psiB: -.35, psiH: -.35 + sw(lt, .5, 3, .05), expr: 'onion_cry', look: [0, .1], o: { sob: Math.max(.12, lt >= CUE.sniffle ? Math.exp(-(lt - CUE.sniffle) / .5) : 0), arms: { l: 'rest', r: 'rest' }, pose: 'rest' } });
ACT.tom = lt => ({ psiB: -.45, psiH: -.45 + sw(lt, .9, 4, .06), expr: exprAt([[0, 'happy']], lt), look: [0, 0], o: { hold: {}, arms: { l: 'rest', r: 'rest' } } });

// ------------------------------------------------------------------ the shot table
const BASEF = 1100;
const lens = o => Object.assign({ dir: 'f', f: BASEF, cz: -1700, cy: 760, hy: 520, cx: 0, z: 1, fx: W / 2, fy: H / 2 }, o);
const wideF = (z = 1, o = {}) => lens(Object.assign({ dir: 'f', cz: -1700, cy: 760, hy: 520, z }, o));
const tvCam = (wpx, yc = 800, o = {}) => lens(Object.assign({ dir: 'f', cz: (RM.zTV - 110) - 720 * BASEF / wpx, cy: TVG.bot + TVG.h / 2, hy: yc, cx: TVG.cx }, o));
const faceCam = (name, k, hy, o = {}) => { const [xr, zr] = SEATS[name]; return lens(Object.assign({ dir: 'r', cz: (RM.zTV - zr) - BASEF / k, cy: 300, hy, cx: -xr }, o)); };
const SHOTS = [];
const shot = (id, s, e, cam, o = {}) => SHOTS.push(Object.assign({ id, s, e, cam }, o));
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s) r = sh; return r; };
const ALL = ['mango', 'lemon', 'straw', 'onion', 'tom'];
const pcCam = u => lens({ dir: 'f', cz: (RM.zTV - 12) - 1100 / 3.1, cy: PCK.y, hy: 880, cx: PCK.x, z: lerp(1, 1.05, u) });
shot('w0', 0, bS('b1'), u => wideF(lerp(1, 1.05, u)), { cast: ALL });
shot('b1', bS('b1'), bS('m1'), u => tvCam(lerp(1000, 1050, u), 800), { cast: [], tvHero: true });
shot('m1', bS('m1'), bS('b2'), u => faceCam('mango', 1.9, 660, { z: lerp(1, 1.05, u) }), { cast: ['mango'], dofBack: 6 });
shot('b2', bS('b2'), bS('s1'), u => tvCam(lerp(1000, 1060, u), 800), { cast: [], tvHero: true });
shot('s1', bS('s1'), bS('b3'), u => tvCam(lerp(1150, 1230, u), 800, { cx: TVG.cx - 120 }), { cast: [], tvHero: true });
shot('cert', bS('b3'), bS('o1'), u => lens({ dir: 'f', cz: 230, cy: 330, hy: 880, cx: 130, z: lerp(1, 1.06, u) }), { cast: [] });
shot('c1', bS('o1'), CUE.sniffle - .06, u => lens({ dir: 'f', cz: PRT.z - 46 - 1100 / 2.9, cy: 359, hy: 900, cx: PRT.x, z: lerp(1, 1.04, u) }), { cast: [], tvHero: true });
shot('o1', CUE.sniffle - .06, bS('l1'), u => faceCam('onion', 2.1, 540, { z: lerp(1, 1.05, u) }), { cast: ['onion'], dofBack: 6 });
shot('l1', bS('l1'), bS('t1'), u => faceCam('lemon', 1.9, 660, { z: lerp(1, 1.05, u) }), { cast: ['lemon'], dofBack: 6 });
shot('t1', bS('t1'), bS('s2'), u => faceCam('tom', 1.9, 620, { z: lerp(1, 1.05, u) }), { cast: ['tom'], dofBack: 6 });
shot('s2', bS('s2'), bS('o2'), u => faceCam('straw', 1.9, 660, { z: lerp(1, 1.04, u) }), { cast: ['straw'], dofBack: 6 });
shot('pc', bS('o2'), bS('o2') + 1.15, pcCam, { cast: [], tvHero: true });
shot('o2', bS('o2') + 1.15, bS('s3'), u => faceCam('onion', 2.0, 540, { z: lerp(1, 1.05, u) }), { cast: ['onion'], dofBack: 6 });
shot('trk', bS('s3'), bS('t2'), u => tvCam(lerp(1000, 1050, u), 800), { cast: [], tvHero: true });
shot('loop', bS('t2'), bE('t2') + .25, u => tvCam(lerp(1000, 1040, u), 800), { cast: [], tvHero: true });
shot('pc2', bE('t2') + .25, CUE.pending, pcCam, { cast: [], tvHero: true });
shot('clk', CUE.pending, 99, u => lens({ dir: 'f', cz: (RM.zTV - 8) - 1100 / lerp(1.55, 2.7, easeIO(u)), cy: 810, hy: 930, cx: CLK.x, z: 1 }), { cast: [], tvHero: true });
SHOTS[SHOTS.length - 1].e = SCN.dur;

// ------------------------------------------------------------------ the world
function setLight(sh) {
  V2.setLight(D.dir === 'r'
    ? { key: [.66, -.28], keyColor: '#cfe0ff', keyA: .3, rim: '#ffd9a0', rimA: .4, shadow: '#1c1832', shadowA: .4, bounce: '#ffe2b0', bounceA: .12, amb: '#fff0d8', ambA: .05 }
    : { key: [.5, -.55], keyColor: '#ffe2b0', keyA: .22, rim: '#9fb8ff', rimA: .55, shadow: '#1c1832', shadowA: .38, bounce: '#ffe2b0', bounceA: .1, amb: '#fff0d8', ambA: .05 });
}
function drawWorld(lt, sh) {
  const c = sh.cc; D.dir = c.dir; setLight(sh); V2.opts.reflect = false; TVH = sh.tvHero === true;
  const back = () => { shell(lt); sides(lt); if (D.dir === 'f') { tvWall(lt); bigClock(lt, sh.tvHero === true); punchClock(lt); } else rearWall(lt); };
  if (sh.dofBack) V2.dof(sh.dofBack, back); else back();
  const items = [], near = V2.P.cz + 100;
  const add = (zr, fn, zNear) => { const z = mapZ(zr); if ((zNear === undefined ? z : zNear) < near) return; items.push({ z, fn }); };
  if (D.dir === 'f') { add(RM.zTV - 90, () => { tvCart(lt, scr => paintTV(lt, scr)); }); add(PRT.z, () => { printerDraw(lt); certificate(lt); }, mapZ(PRT.z + 50) - 2); }
  for (const n of sh.cast) add(SEATS[n][1], () => drawChar(person(n, lt)));
  items.sort((a, b) => b.z - a.z); for (const it of items) it.fn();
}
function roomConfetti(lt) {
  const t0 = CUE.textding; if (lt < t0 || lt > t0 + 2.2 || shotAt(lt).id !== 'cert') return;
  for (let i = 0; i < 110; i++) {
    const a = lt - t0 - hash(i * 2.9) * .4; if (a < 0) continue;
    const x = hash(i * 3.7) * W + Math.sin(a * 3 + i) * 40, y = -30 + a * (520 + hash(i * 1.7) * 380); if (y > H + 30) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a * 5 + i); ctx.scale(1, Math.abs(Math.cos(a * 7 + i)) * .8 + .2); ctx.fillStyle = ['#ffd23a', '#ff4d6d', '#37c8ff', '#7dff8a', '#ffffff', '#b68cff'][i % 6]; const sz = 12 + hash(i * 6.1) * 12; ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2); ctx.restore();
  }
}
const flashK = lt => Math.max(.4 * Math.exp(-Math.max(0, lt - CUE.sting) * 12) * (lt >= CUE.sting ? 1 : 0), .22 * Math.exp(-Math.max(0, lt - CUE.textding) * 10) * (lt >= CUE.textding ? 1 : 0));
const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), u = c01((lt - sh.s) / Math.max(.001, sh.e - sh.s)), c = Object.assign(lens({}), sh.cam(u, lt, sh));
    sh.cc = c;
    V2.setCam({ f: c.f, cz: c.cz, cy: c.cy, hy: c.hy, cx: c.cx });
    const punch = lt >= CUE.error && lt < CUE.error + .5 ? .035 * Math.exp(-(lt - CUE.error) * 12) : lt >= CUE.sting && lt < CUE.sting + .6 ? .03 * Math.exp(-(lt - CUE.sting) * 11) : 0;
    zoomTo(c.fx, c.fy, c.z * (1 + punch));
  },
  draw(lt) { drawWorld(lt, shotAt(lt)); },
  fx(lt) {
    const fx = { bloom: .42 + (lt >= CUE.pending ? .25 * ss(lt, CUE.pending, CUE.pending + 1.2) : 0), vignette: .42, grain: .05, contrast: .12, sat: .08 };
    if (lt < .25) { fx.fade = 1 - sg(lt, 0, .25); fx.fadeColor = '10,14,30'; }
    return fx;
  },
  blur(lt) { for (const sh of SHOTS) if (Math.abs(lt - sh.s) < .045) return 1; return 1; },
  over(lt) {
    roomConfetti(lt);
    const k = flashK(lt); if (k > 0) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (lt >= CUE.error && lt < CUE.error + .5) { ctx.save(); ctx.fillStyle = `rgba(255,40,30,${.22 * Math.exp(-(lt - CUE.error) * 9)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP17_SCENES = window.__EP17_SCENES || {};
window.__EP17_SCENES.quiz = SC;
})();
