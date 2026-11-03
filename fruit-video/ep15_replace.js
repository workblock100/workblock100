'use strict';
/* SHIFT HAPPENS, Episode 15: "The Merger". Scene module: replace (5:05 PM, FIND AND REPLACE, 23.28 s). Builder E15-B. Registers window.__EP15_SCENES.replace.
 *
 * The consultants have taken over the nurses' station (the tower is sunk one floor, the Executive Suite on top: S15 with sink 1, exec 1, dusk): Onion cries over the policy comparison on the laptop, Tomato reads
 * it out, Compliance cannot decide, Binder offers help from the laptop, Strawberry says "Don't." and Replace All is pressed. Then the world obeys: a whip-pan tour of the building where every BREAK is flipped to
 * PENDING letter by letter (SH15.flipText: the break room's door plate and room label, the lobby poster, Strawberry's own name tag, the staff schedule board, the clock sign, the vending machine) while a
 * REPLACEMENTS counter ticks up to 214, the dialog "Done. 214 replacements made.", and a rhythm of three question-and-answer close-ups (three-quarter views, Binder in the corner): "My break?" "Pending!"
 * "Mine?" "Pending!" "How long is pending?" "Pending!" and a last grin.
 *
 * (tower coordinates: S15; characters at S15.S = .44; the sheet window is the laptop's screen grown to full size, as in model1)
 */
(() => {
if (!window.TIMELINE_EP15 || !window.S15 || !window.H6 || !window.SH15 || !window.A15) return;
const { zoomTo, faceC } = window.H6;
const S15 = window.S15, SH15 = window.SH15, A15 = window.A15, A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP15, SCN = TLX.scenes.find(s => s.id === 'replace'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'replace') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const rgba = (c, a = 1) => V2.rgba(c, a);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const snapT = t => Math.round((START + t) * 30) / 30 - START;
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
/* the sound cues of the scene (scene-local seconds; python3 /tmp/shift_tools/cues.py 15 replace), snapped to the video frame nearest each */
const CUE = { sniffle: 1.70, sob: 7.164, type1: 8.626, type2: 10.126, click: 11.055, flip: [11.474, 11.874, 12.324, 12.824, 13.324, 13.824], counter: 11.524, dialog: 15.124, sting: 22.325 };
for (const k in CUE) CUE[k] = Array.isArray(CUE[k]) ? CUE[k].map(snapT) : snapT(CUE[k]);

// ------------------------------------------------------------------ the tower's state: sunk one floor, the Executive Suite on top, dusk; the signs flip through st.signs
const SIGNS = {};     /* filled in below: id -> a function (box) that draws the label for the flip progress of this frame */
const FLIP = { u: [0, 0, 0, 0, 0, 0] };   /* the flip progress 0..1 of each of the six replacements at the frame being drawn (set in draw) */
const flipU = i => c01((CUR_LT - CUE.flip[i]) / .5);
let CUR_LT = 0;
function ST(lt) { return { stack: 1, exec: 1, sink: 1, tod: .74, t: lt, signs: { 'door:rest': box => flipLabel(box, 0, 'BREAK ROOM', 'PENDING ROOM', { size: 11 }), 'plate:rest': box => flipLabel(box, 0, 'BREAK ROOM', 'PENDING ROOM', { size: 7.4, spacing: .4 }) }, rooms: { rest: { lamp: .75 } } }; }
/* a flipping label inside a plate box (SH15.flipText: the old letters roll away, the new ones roll in, upright and exact at rest) */
function flipLabel(box, i, from, to, o = {}) {
  const u = flipU(i), size = o.size || 11;
  SH15.flipText(from, to, u, { cx: box.cx, cy: box.cy, size, weight: 900, fill: o.fill || '#3a2a10', spacing: o.spacing ?? .8, maxW: box.w - 4, hero: false, crop: true, dur: .5, ...o.extra });
}

// ------------------------------------------------------------------ the set dressing that carries the six replacements (room-local coordinates of S14 rooms, shifted by the room's rect)
const OUT = 'rgba(38,24,40,.8)';
let STATE = null;                                                   /* the tower state of the frame being drawn */
const R = id => S15.rect(id, STATE);
/* the staff schedule board over the station's whiteboard: a fresh sheet with the line that flips */
function scheduleBoard(lt) {
  const r = R('station'), x = r.x0 + 172, y = r.y0 + 38, w = 104, h = 84;
  UI.panel([x, y, w, h], { r: 3, fill: '#fdfdfb', stroke: '#c9ced6', lw: 3.4, id: 'sched', kind: 'board', pad: 4, shadow: 0, hero: false });
  const ink = { hero: false, crop: true, cid: 'sched', maxW: w - 12 };
  UI.label('STAFF SCHEDULE', x + w / 2, y + 11, Object.assign({ size: 9.2, weight: 900, fill: '#2b5fc2' }, ink));
  ctx.fillStyle = '#c9ced6'; ctx.fillRect(x + 8, y + 18, w - 16, 1.2);
  UI.label('SHIFT 3 TO 11', x + w / 2, y + 30, Object.assign({ size: 8.6, weight: 800, fill: '#3a3f4a' }, ink));
  SH15.flipText('30 MIN BREAK', '30 MIN PENDING', flipU(3), { cx: x + w / 2, cy: y + 49, size: 10.4, weight: 900, fill: '#c23a2b', spacing: .2, maxW: w - 10, hero: false, crop: true, dur: .5 });
  UI.label('LEMON  MANGO  CLEM', x + w / 2, y + 68, Object.assign({ size: 7.4, weight: 800, fill: '#5b6470' }, ink));
  ctx.fillStyle = '#2b5fc2'; ctx.fillRect(x + 22, y + 78, 12, 2.4); ctx.fillStyle = '#c23a2b'; ctx.fillRect(x + 40, y + 78, 12, 2.4);
}
/* the sign under the station's clock: BREAKS: 7:00 */
function clockSign(lt) {
  const r = R('station'), cx = r.x0 + 318, cy = r.y0 + 100, w = 86, h = 15;
  UI.panel([cx - w / 2, cy - h / 2, w, h], { r: 3, fill: '#f6ecd0', stroke: '#6a4a24', lw: 1.3, id: 'clocksign', kind: 'sign', pad: 1, shadow: 0, hero: false });
  SH15.flipText('BREAKS: 7:00', 'PENDING: 7:00', flipU(4), { cx, cy, size: 9.2, weight: 900, fill: '#3a2a10', spacing: .3, maxW: w - 6, hero: false, crop: true, dur: .5 });
}
/* the vending machine in the dining room: a lit header (BREAK TIME / SNACKS), a glass front with rows of snacks, a coin slot and the tray */
function vending(lt) {
  const r = R('dining'), x = r.x0 + 172, y = r.y0 + 122, w = 66, h = 160;
  ctx.save();
  ctx.fillStyle = 'rgba(25,14,30,.3)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h + 2, w * .62, 4, 0, 0, TAU); ctx.fill();
  rr(x, y, w, h, 5); ctx.fillStyle = lg(x, y, x + w, y, [[0, '#a8322a'], [.5, '#d0473a'], [1, '#8e2a24']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  rr(x + 5, y + 5, w - 10, 26, 3); ctx.fillStyle = '#fff4c8'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
  V2.glow(x + w / 2, y + 18, 54, '255,240,180', .22, 'screen', .2);
  SH15.flipText('BREAK TIME', 'PENDING TIME', flipU(5), { cx: x + w / 2, cy: y + 13, size: 8.6, weight: 900, fill: '#a8322a', spacing: .3, maxW: w - 14, hero: false, crop: true, dur: .5 });
  UI.label('SNACKS', x + w / 2, y + 25, { size: 6.4, weight: 800, fill: '#5a3a14', hero: false, crop: true, spacing: 1.2 });
  rr(x + 6, y + 36, w - 24, 92, 3); ctx.fillStyle = '#243040'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
  const cols = ['#f0a43a', '#e0583d', '#59b36b', '#4c7bd9', '#c25fa0', '#f2d36a'];
  for (let j = 0; j < 4; j++) { ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + 8, y + 52 + j * 21, w - 28, 1.6); for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[(i + j * 2) % 6]; rr(x + 10 + i * 10.4, y + 40 + j * 21, 8, 11, 1.6); ctx.fill(); } }
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(x + 8, y + 38); ctx.lineTo(x + 28, y + 38); ctx.lineTo(x + 8, y + 90); ctx.closePath(); ctx.fill();
  rr(x + w - 15, y + 40, 10, 50, 2); ctx.fillStyle = '#2a2f38'; ctx.fill(); for (let i = 0; i < 5; i++) { ctx.fillStyle = '#9aa3b0'; ctx.fillRect(x + w - 13, y + 44 + i * 9, 6, 5); }
  rr(x + 8, y + 134, w - 16, 18, 3); ctx.fillStyle = '#1a1d24'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#4a4f5a'; ctx.fillRect(x + w - 14, y + 106, 7, 14);
  ctx.restore();
}
/* the Greenleaf poster in the lobby: TAKE A / BREAK (the word that flips), a leaf */
function lobbyPoster(lt) {
  const r = R('lobby'), x = r.x0 + 150, y = r.y0 + 84, w = 88, h = 104;
  ctx.save(); ctx.shadowColor = 'rgba(25,14,30,.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  UI.panel([x, y, w, h], { r: 4, fill: '#f6f3e2', stroke: '#2f6b46', lw: 2.4, id: 'poster', kind: 'board', pad: 4, shadow: 0, hero: false }); ctx.restore();
  ctx.fillStyle = '#3f9a5c'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 26, 13, 19, .5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1f5a36'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w / 2 - 6, y + 40); ctx.lineTo(x + w / 2 + 6, y + 12); ctx.stroke();
  const ink = { hero: false, crop: true, cid: 'poster', maxW: w - 12 };
  UI.label('TAKE A', x + w / 2, y + 56, Object.assign({ size: 11, weight: 800, fill: '#2f6b46' }, ink));
  SH15.flipText('BREAK', 'PENDING', flipU(1), { cx: x + w / 2, cy: y + 74, size: 17, weight: 900, fill: '#c23a2b', spacing: .6, maxW: w - 10, hero: false, crop: true, dur: .5 });
  UI.label('GREENLEAF CARES', x + w / 2, y + 93, Object.assign({ size: 6.4, weight: 800, fill: '#5b6470', spacing: .8 }, ink));
}
/* Strawberry's badge: STRAWBERRY, RN and the line that flips (BREAKS: 30 MIN to BREAKS: PENDING); drawn at her chest, upright, from her options (the badge turns with nothing: a plastic card on a clip) */
function nameBadge(o, lt) {
  const s = o.s || 1, [cx, cy] = A15.centre(o), k = KINDS[o.kind], bx = cx + (o.flipX ? -1 : 1) * 30 * s, by = cy + 30 * s, w = 78 * s, h = 46 * s;
  ctx.save(); ctx.translate(bx, by);
  ctx.strokeStyle = '#4a4f5a'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(0, -h / 2 - 8 * s); ctx.lineTo(0, -h / 2 + 3 * s); ctx.stroke();
  ctx.shadowColor = 'rgba(20,10,20,.4)'; ctx.shadowBlur = 6 * s; ctx.shadowOffsetY = 2 * s;
  rr(-w / 2, -h / 2, w, h, 5 * s); ctx.fillStyle = '#fbfaf2'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#2a2f38'; ctx.lineWidth = 2 * s; ctx.stroke();
  ctx.fillStyle = '#d6384c'; ctx.fillRect(-w / 2 + 2 * s, -h / 2 + 2 * s, w - 4 * s, 9 * s);
  ctx.restore();
  const id = 'badge';
  UI.container(id, 'tag', [bx - w / 2, by - h / 2, bx + w / 2, by + h / 2], 2 * s);
  const ink = { hero: false, crop: true, cid: id, maxW: w - 8 * s };
  UI.label('STRAWBERRY, RN', bx, by - h / 2 + 6.5 * s, Object.assign({ size: 6.6 * s, weight: 900, fill: '#fff' }, ink));
  UI.label('PER DIEM', bx, by - 2 * s, Object.assign({ size: 8.4 * s, weight: 800, fill: '#3a3f4a' }, ink));
  SH15.flipText('BREAKS: 30 MIN', 'BREAKS: PENDING', flipU(2), { cx: bx, cy: by + 14 * s, size: 7.6 * s, weight: 900, fill: '#c23a2b', spacing: .2 * s, maxW: w - 8 * s, hero: false, crop: true, dur: .5 });
}

// ------------------------------------------------------------------ the cast: where they stand and what they do (a pure function of scene time)
const K = (a, lt) => key(a, lt, easeIO);
/* the options for every character at lt: placed in the tower's rooms with S15.who (feet on the room's floor line, scale S15.S) */
function cast(lt, st) {
  const who = (room, ctor, u, extra) => S15.who(room, ctor, u, Object.assign({ t: lt }, extra), st);
  const C = {};
  // Onion (Compliance): turned toward the laptop, crying; the sniffle (1.70) and the sob (7.16) shake her
  const sn = Math.max(0, 1 - Math.abs(lt - CUE.sniffle - .15) / .45), sb = lt >= CUE.sob ? Math.max(0, 1 - (lt - CUE.sob) / 1.4) : 0;
  const cry = lerp(.55, .95, Math.max(sn, ss(lt, 5.96, 7.2))) * 1, sob = Math.max(sn * .7, sb);
  C.onion = who('station', A15.onion, .3, { yaw: K([[0, .4], [1.2, .55], [6.2, .55], [7.0, .3]], lt), headYaw: K([[0, .5], [.9, .62], [3, .3], [5.6, .6]], lt), cry, sob, expr: lt > 5.9 ? 'onion_wail' : 'onion_cry', look: [.5, .25] });
  // Tomato (HR): a bright fruit while she reads Fruit Bowl's policy, a stern vegetable for Greenleaf's (the face flips at 4.33); she tears up when Onion sobs
  const tf = lt - 4.33, tcry = ss(lt, 7.1, 7.9) * .8;
  C.tom = who('station', A15.tomato, .62, { yaw: K([[0, -.5], [2.3, -.5], [3.0, -.25], [4.2, -.5]], lt), headYaw: K([[0, -.5], [2.3, -.5], [3.0, -.2], [4.3, -.5]], lt), tomPose: lt < 4.33 ? 'fruit' : 'veg', flipT: tf >= 0 && tf < .6 ? tf : undefined, look: [-.5, .2], cry: tcry });
  if (tcry > 0.01) C.tom.acc = (C.tom.acc || []).concat(['fp15_tears']), C.tom.cry = tcry;
  // Lemon behind the counter at the left; Strawberry arrives at the station's right (and is in the lobby for the tour); Mango waits at the break room's door
  C.lemon = who('station', A7.lemon, .12, { yaw: .5, headYaw: .35, expr: lt > 7 ? 'sad' : 'neutral' });
  C.straw = lt < 11.3 ? who('station', A11.straw, .93, { yaw: -.55, headYaw: -.6, expr: lt < 9.95 ? 'chill' : 'dead', lid: lt > 9.9 ? .5 : undefined }) : who('lobby', A11.straw, .42, { yaw: .5, headYaw: .55, expr: 'dead', lid: .5 });
  C.mango = who('rest', A7.mango, .34, { yaw: .55, headYaw: .6, expr: 'sad' });
  C.clem = who('dining', A10.clem, .5, { yaw: .4, headYaw: .5, expr: 'happy' });
  return C;
}

// ------------------------------------------------------------------ the laptop on the counter, Binder, the sheet window
const LAPS = .72;
const lapPos = () => { const r = R('station'); return [r.x0 + r.w * .46, r.y0 + 249]; };
function laptopDrawW(lt) {
  const [x, y] = lapPos();
  A15.laptop(x, y, { lapScale: LAPS, lapScreen: false, rot: 0 });
  const sr = A15.laptopScreen({ lapScale: LAPS }), sx = x + sr[0], sy = y + sr[1], sw = sr[2] - sr[0], sh = sr[3] - sr[1];
  return { x: sx, y: sy, w: sw, h: sh };
}

// ------------------------------------------------------------------ the sheet window: the laptop's screen grown to the size of the frame (drawn in over(): crisp, after the grade)
const WIN = { x: 0, y: 200, w: 1080, h: 1176 };               /* the full-size window (screen px): below the pill, above the caption zone */
let LAPR = null;                                                /* the laptop screen's rectangle in SCREEN px for the frame being drawn (set while the world is drawn) */
/* the comparison sheet: Fruit Bowl's policy against Greenleaf's, the conflicting cells highlighted, the conflict marker */
function diffCells(lt, hero) {
  const sel2 = lt >= wS('t1', 3) - .04 && lt < wS('t2', 1) - .04, sel3 = lt >= wS('t2', 1) - .04;
  const cf = ss(lt, 5.35, 5.6), amb = '#fff1c2', red = '#fde2df';
  const cells = {
    A1: { v: 'POLICY', bold: true, size: 28, color: '#5b6470', fill: '#f1f3f5' }, B1: { v: 'FRUIT BOWL', bold: true, size: 36, color: '#b3261e', fill: '#fdeceb', align: 'center' }, C1: { v: 'GREENLEAF', bold: true, size: 36, color: '#17613f', fill: '#e1f3e8', align: 'center' }, D1: { v: 'STATUS', bold: true, size: 28, color: '#5b6470', fill: '#f1f3f5', align: 'center' },
    A2: { v: '14.3', size: 30, color: '#5b6470' }, B2: { v: 'BREAK: 30 MIN', size: 34, bold: true, align: 'center', hero, fill: sel2 || sel3 ? amb : undefined }, C2: { v: 'BREAK: AS NEEDED', size: 34, bold: true, align: 'center', hero, fill: sel3 ? amb : undefined },
    A3: { v: '14.4', size: 30, color: '#5b6470' }, B3: { v: 'PIZZA: FRIDAYS', size: 32, align: 'center', color: '#3a3f4a' }, C3: { v: 'PIZZA: A VEGETABLE', size: 32, align: 'center', color: '#3a3f4a' },
    A4: { v: '14.5', size: 30, color: '#5b6470' }, B4: { v: 'STAFF: 4', size: 32, align: 'center', color: '#3a3f4a' }, C4: { v: 'STAFF: 40', size: 32, align: 'center', color: '#3a3f4a' },
  };
  if (cf > 0) { cells.D2 = { v: 'CONFLICT', size: 28, bold: true, align: 'center', color: '#d93025', fill: red, hero: false }; cells.D3 = { v: 'CONFLICT', size: 28, bold: true, align: 'center', color: '#d93025', fill: red }; cells.D4 = { v: 'CONFLICT', size: 28, bold: true, align: 'center', color: '#d93025', fill: red }; }
  return cells;
}
function sheetOpts(lt, hero) {
  const typedFind = typedN('break', CUE.type1, .075), typedRep = typedN('pending', CUE.type2, .075);
  const o = { w: WIN.w, h: WIN.h, ui: 1, dressing: !hero, r: 18, shadow: 40, doc: 'POLICY_COMPARE_v3_FINAL', saved: false, show: { ribbon: false }, cols: { A: 150, B: 360, C: 400, D: 106 }, rows: { 1: 78, 2: 96, 3: 84, 4: 84 }, cells: diffCells(lt, hero && lt < 7.9),
    active: lt >= wS('t2', 1) - .04 ? 'C2' : lt >= wS('t1', 3) - .04 ? 'B2' : 'B1', sel: lt >= wS('t2', 1) - .04 ? 'C2' : lt >= wS('t1', 3) - .04 ? 'B2' : 'B1', formula: lt >= wS('t2', 1) - .04 ? 'BREAK: AS NEEDED' : lt >= wS('t1', 3) - .04 ? 'BREAK: 30 MIN' : 'FRUIT BOWL', status: 'Ready' };
  o.nameBox = o.active;
  void typedFind; void typedRep;
  return o;
}
/* exactly n letters typed by time t at `rate` seconds a letter from t0 (SH15.typed(n, len)) */
function typedN(str, t0, rate) { return lt => SH15.typed(Math.max(0, Math.min(str.length, Math.floor((lt - t0) / rate) + 1)), str.length); }
const nTyped = (str, t0, rate, lt) => lt < t0 ? 0 : Math.min(str.length, Math.floor((lt - t0) / rate) + 1);
/* the window's growth progress (0 = on the laptop, 1 = full size): a pop out of the laptop and a fold back into it */
function winK(lt) {
  const o = (a, b) => ss(lt, a, b), i = (a, b) => 1 - ss(lt, a, b);
  return Math.max(o(3.0, 3.28) * i(4.26, 4.33), o(4.88, 4.9) * i(5.9, 5.96) + (lt >= 4.33 && lt < 4.9 ? 0 : 0), o(8.02, 8.3) * i(9.9, 9.95), o(10.46, 10.52) * i(11.14, 11.3));
}

/* @@NEXT@@ */
})();
