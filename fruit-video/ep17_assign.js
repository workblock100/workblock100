'use strict';
/* SHIFT HAPPENS, Episode 17: "The Module". Scene module: assign (9:15 PM, THE ASSIGNMENT, 13.87 s). Builder E1617-VIDEO. Registers window.__EP17_SCENES.assign.
 *
 * The nurses' station at night (the Episode 15 tower, S15, sunk one floor with the Executive Suite on top; the station room lit by its own lamps). Tomato (HR, headset) stands behind the counter with a
 * tablet that holds the assignment (a learning-platform card: MODULE 7 OF 7, HOW TO TAKE A BREAK SAFELY, 4:00:00, DUE BEFORE CLOCK-OUT). Mango, Lemon and Strawberry stand in front of the counter,
 * three-quarter views. Binder pops out of the tablet, offers help, "No thanks" runs away from Strawberry's pointer, "Great! I'll help.", the DUE 11:00 PM chip stamps onto the card.
 *
 * Shots (scene-local seconds, see SHOTS below): wide push-in (0-1.1) / Tomato (1.1-3.1) / Mango (3.1-3.9) / tablet card insert, 4:00:00 (3.9-4.9) / Lemon + the call light glance (4.9-7.0) /
 * Tomato "Efficiency." (7.0-7.85) / Binder out of the tablet + the bubble (7.85-9.88) / Strawberry "No." + the pointer chase (9.88-10.42) / Binder grin (10.42-11.42) / the card, the DUE chip (11.42-12.9) / wide.
 */
(() => {
if (!window.TIMELINE_EP17 || !window.S15 || !window.H6 || !window.SH15 || !window.A15 || !window.UI) return;
const { zoomTo, faceC } = window.H6;
const S15 = window.S15, SH15 = window.SH15, A15 = window.A15, A7 = window.A7, A11 = window.A11;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP17, SCN = TLX.scenes.find(s => s.id === 'assign'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'assign') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
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
const K = (a, lt) => key(a, lt, easeIO);
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
/* the sound cues (scene-local seconds; python3 /tmp/shift_tools/cues.py 17 assign), snapped to the video frame nearest each */
const CUE = { click: .5, binderpop: 7.845, grin: 10.974, sting: 13.017 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);

// ------------------------------------------------------------------ the tower's state: night, sunk one floor, the Executive Suite on top; the station lit by its own lamps
let STATE = null;
const R = id => S15.rect(id, STATE);
const CALLS = Array.from({ length: 40 }, (_, i) => i === 19 ? 1 : 0);   /* one call light on the board, lit and pulsing: row 3, dome 4 */
function ST(lt) { return { exec: 1, sink: 1, tod: 1, t: lt, signs: { 'door:rest': 'PENDING ROOM' }, rooms: { station: { lamp: 1, calls: CALLS, time: '9:15' }, rest: { lamp: .7 }, lobby: { lamp: .8 }, dining: { lamp: .6 } } }; }

// ------------------------------------------------------------------ the tablet (a prop in Tomato's hand): a black slab with a lit screen that shows a miniature of the card (no lettering in the sprite)
const TW = 74, TH = 98;
EXT.prop.fp17_tablet = (side, o, t) => {
  const S = o.tabScale || 1, w = TW * S, h = TH * S, at = o.tabAt || [.9, .12], lit = o.tabLit ?? 1;
  ctx.save(); ctx.rotate(o.tabRot ?? -.04); ctx.translate(-w * at[0], -h * at[1]);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8 * S; ctx.shadowOffsetY = 3 * S;
  ctx.fillStyle = '#17181d'; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 2.6 * S; rr(0, 0, w, h, 7 * S); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  const sx = 5 * S, sy = 6 * S, sw = w - 10 * S, sh = h - 12 * S;
  ctx.fillStyle = lit > .02 ? '#f2fbf6' : '#0e1014'; rr(sx, sy, sw, sh, 3 * S); ctx.fill();
  if (lit > .02) {
    ctx.save(); rr(sx, sy, sw, sh, 3 * S); ctx.clip(); ctx.globalAlpha *= lit;
    ctx.fillStyle = '#1e8e5a'; ctx.fillRect(sx, sy, sw, sh * .15);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(sx + sw * .1, sy + sh * .055, sw * .36, sh * .04);
    ctx.fillStyle = '#103a2c'; ctx.fillRect(sx + sw * .1, sy + sh * .26, sw * .8, sh * .07); ctx.fillRect(sx + sw * .1, sy + sh * .36, sw * .6, sh * .05);
    ctx.fillStyle = '#1e8e5a'; ctx.fillRect(sx + sw * .1, sy + sh * .52, sw * .8, sh * .16);
    ctx.fillStyle = 'rgba(40,60,80,.3)'; ctx.fillRect(sx + sw * .1, sy + sh * .76, sw * .7, sh * .035); ctx.fillRect(sx + sw * .1, sy + sh * .83, sw * .5, sh * .035);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * .6, sy); ctx.lineTo(sx, sy + sh * .5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};
PROP_BOX.fp17_tablet = o => { const S = o.tabScale || 1, w = TW * S, h = TH * S, at = o.tabAt || [.9, .12]; return [-w * at[0] - 2, -h * at[1] - 2, w * (1 - at[0]) + 4, h * (1 - at[1]) + 2]; };
/* where the tablet's screen is, in world coordinates, for the glow and Binder's pop (Tomato's left hand, from her options) */

// ------------------------------------------------------------------ the cast: where they stand and what they do (a pure function of scene time)
function cast(lt, st) {
  const who = (room, ctor, u, extra, dy = 0) => { const [x, y] = S15.at(room, u, dy, st); return ctor(Object.assign({ x, y, s: S15.S, t: lt }, extra)); };
  const C = {}, id = shotAt(lt).id, sp = b => lt >= bS(b) && lt < bE(b);
  /* the nurses stand with their backs to us, turned toward Tomato (a face is visible only in the close-ups of their own lines); the last wide turns them to the camera, deflated */
  const BACK = id === 'tom1' || id === 'wide' || id === 'tom2', LAST = id === 'wide2';
  C.tom = who('station', A15.tomato, .8, { yaw: -.55, headYaw: K([[0, -.7], [3, -.55], [7, -.1], [8.2, -.5], [12, -.3]], lt), tomPose: 'fruit', arms: { l: 'rest', r: 'hold' }, grip: { r: [8, 88] }, hold: { r: 'fp17_tablet' }, tabScale: .86, tabAt: [.9, .12], tabLit: lt < CUE.click ? 0 : 1, tabRot: -.06, expr: 'tom_fruit' }, 14);
  C.mango = who('station', A7.mango, .16, { yaw: BACK ? 2.65 : LAST ? .25 : .62, headYaw: BACK ? 2.35 : LAST ? .1 : .5, expr: sp('m1') ? 'sad' : LAST ? 'sad' : 'neutral', lid: LAST ? .45 : undefined }, 14);
  C.lemon = who('station', A7.lemon, .32, { yaw: BACK ? 2.75 : LAST ? .1 : .66, headYaw: BACK ? K([[0, 2.45], [2.2, 2.45], [2.6, 2.1], [3.1, 2.1], [3.3, 2.45]], lt) : id === 'lemon' && lt > 5.5 ? -.95 : LAST ? 0 : .55, expr: 'neutral', lid: LAST ? .5 : undefined }, 14);
  C.straw = who('station', A11.straw, .48, { yaw: BACK ? 2.6 : LAST ? -.12 : .42, headYaw: BACK ? K([[0, 2.3], [1.3, 2.3], [1.7, 2.0], [2.9, 2.0], [3.1, 2.3]], lt) : LAST ? -.05 : .4, expr: id === 'straw' ? 'sour' : 'dead', lid: .5 }, 14);
  return C;
}

// ------------------------------------------------------------------ the shots: id, start, end, kind (world: the station in the tower; card / bubble / binder: full-frame inserts in screen space)
const SHOTS = [
  { id: 'wide',   s: 0,    e: 1.1,   k: 'world', show: 'tmls' },
  { id: 'tom1',   s: 1.1,  e: 3.133, k: 'world', show: 'tls' },
  { id: 'mango',  s: 3.133, e: 3.91, k: 'world', show: 'm' },
  { id: 'card1',  s: 3.91, e: 4.911, k: 'card' },
  { id: 'lemon',  s: 4.911, e: 5.75, k: 'world', show: 'l' },
  { id: 'lights', s: 5.75, e: 6.4,   k: 'world', show: '' },
  { id: 'lemon2', s: 6.4,  e: 7.025, k: 'world', show: 'l' },
  { id: 'tom2',   s: 7.025, e: 7.845, k: 'world', show: 't' },
  { id: 'bub1',   s: 7.845, e: 9.876, k: 'bubble' },
  { id: 'straw',  s: 9.876, e: 10.3, k: 'world', show: 's' },
  { id: 'bub2',   s: 10.3, e: 10.974, k: 'bubble' },
  { id: 'grin',   s: 10.974, e: 11.416, k: 'binder' },
  { id: 'card2',  s: 11.416, e: 12.917, k: 'card' },
  { id: 'wide2',  s: 12.917, e: 13.9, k: 'world', show: 'tmls' },
];
for (const sh of SHOTS) { sh.s = sh.s === 0 ? 0 : snapT(sh.s); }
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s - 1e-6) r = sh; return r; };

// ------------------------------------------------------------------ the world: the tower, the station, the cast
let FRAME = null;                 /* { C: cast options, st: tower state, sh: the shot } of the frame being drawn (built in cam()) */
const handOf = o => { const [cx, cy] = A15.centre(o), g = (o.grip && o.grip.r) || [8, 88]; return [cx + g[0] * o.s, cy + g[1] * o.s]; };
const tabPos = C => { const [hx, hy] = handOf(C.tom), S = C.tom.s * .86; return [hx - .4 * TW * S, hy + .38 * TH * S]; };   /* the tablet's centre in the tower's coordinates */
function drawWorld(lt) {
  const st = FRAME.st, C = FRAME.C, sh = FRAME.sh; STATE = st;
  const dof = sh.dof || 0;
  S15.light(st);
  if (dof > .5) V2.dof(dof, () => S15.tower(lt, st)); else S15.tower(lt, st);
  const has = c => (sh.show || '').indexOf(c) >= 0;
  S15.front(lt, st);
  callLight(lt, sh);
  if (has('m')) drawChar(C.mango);
  if (has('l')) drawChar(C.lemon);
  if (has('s')) drawChar(C.straw);
  if (has('t')) drawChar(C.tom);
  const [tx, ty] = tabPos(C);
  if (has('t') && lt >= CUE.click) {   /* the tablet wakes: a ring of light, then a steady glow on Tomato and the counter */
    const k = (lt - CUE.click) / .5;
    if (k > 0 && k < 1) { V2.ring(tx, ty, k, { r0: 6, r1: 56, color: '170,255,210', lw: 3, alpha: .9 }); }
    V2.glow(tx, ty, 54, '190,255,220', .3 + .18 * Math.sin(lt * 5), 'screen', .3);
  }
  smallBinder(lt, C, sh.id === 'wide2');
}
/* the lit call light on the station's board (room coordinates of S14: the dome at 45 + 13.5 i, 64 + 12.6 j): an extra red glow and a ring on every pulse, so it reads in the close-ups and in the wide */
function callLight(lt, sh) {
  const r = R('station'), x = r.x0 + 45 + 13.5 * 3, y = r.y0 + 64 + 12.6 * 2, ph = (lt * 1.15) % 1, pk = .5 + .5 * Math.sin(lt * 7.2), big = sh.id === 'lights' ? 1 : .55;
  V2.glow(x, y, (34 + 16 * pk) * (sh.id === 'lights' ? 1.4 : 1), '255,60,50', Math.min(1, (.5 + .4 * pk) * big), 'screen', .3);
  ctx.save(); ctx.fillStyle = 'rgba(255,' + Math.round(110 + 90 * pk) + ',' + Math.round(90 + 60 * pk) + ',' + (.55 + .4 * pk) + ')'; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, TAU); ctx.fill(); ctx.restore();
  if (sh.id === 'lights') V2.ring(x, y, ph, { r0: 8, r1: 64, color: '255,90,80', lw: 3, alpha: .8 * (1 - ph) });
}
/* Binder out of the tablet: a hop with a pop ring on the cue, then a hover above the screen */
function smallBinder(lt, C, vis) {
  if (lt < CUE.binderpop) return;
  const [tx, ty] = tabPos(C), k = sg(lt, CUE.binderpop, CUE.binderpop + .16), f = ss(lt, CUE.binderpop + .04, CUE.binderpop + .5), bob = Math.sin(lt * 3.2) * 2.5;
  const [fcx, fcy] = faceC(C.tom), fx = ss(lt, CUE.binderpop + .02, CUE.binderpop + .26), x = lerp(tx, fcx - 78, fx), y = lerp(ty - 8, fcy + 8, f) - Math.sin(PI * f) * 20 + bob * f;   /* he ends in the gap between Strawberry and Tomato, at face height */
  if (vis && k < 1) V2.ring(tx, ty - 4, k, { r0: 6, r1: 50, color: '255,236,160', lw: 4, alpha: .9 });
  const o = A15.binderSmall({ x, y, s: .4 * eb(k), center: true, noLegs: true, who: 'bind', t: lt, pose: lt < 8.3 ? 'ears' : 'helpful', grin: lt >= CUE.grin ? ss(lt, CUE.grin, CUE.grin + .15) : .25, glint: lt >= CUE.sting ? Math.max(0, 1 - (lt - CUE.sting) / .5) : 0, look: [.5, .3], hover: 6 });
  if (vis) drawChar(o);
}

// ------------------------------------------------------------------ cameras (tower coordinates [x, y, zoom]; the frame centre is the point, lifted into the clear band)
const BAND = 148;
const at = (x, y, z) => [x, y + BAND / z, z];
const faceCam = (o, z, up = 150) => { const [fx, fy] = faceC(o); return [fx, fy + up / z, z]; };
const roomCam = (id, z) => { const c = S15.cam('room:' + id, STATE, z ? { z } : {}); return [c.x, c.y, c.z]; };
const wideCam = () => { const c = S15.cam('tower', STATE, {}); return [c.x, c.y, c.z]; };
const lerpCam = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), k))];
const pushCam = (a, b, lt, sh) => lerpCam(a, b, sg(lt, sh.s, sh.e));
function camAt(lt, C, st, sh) {
  STATE = st;
  const r = R('station'), id = sh.id, u = sg(lt, sh.s, sh.e);
  if (id === 'wide') return lerpCam(wideCam(), roomCam('station', 1.9), eo(lt / 1.1));
  if (id === 'wide2') { const b = at(572, R('station').y0 + 215, 2.15); return lerpCam(roomCam('station', 1.9), b, ss(lt, sh.s, 13.9)); }
  if (id === 'tom1') { const a = faceCam(C.tom, 2.3, 150), b = faceCam(C.tom, 2.55, 150); a[0] = 574; b[0] = 584; return lerpCam(a, b, u); }
  if (id === 'mango') return lerpCam(faceCam(C.mango, 4.4, 150), faceCam(C.mango, 4.8, 150), u);
  if (id === 'lemon' || id === 'lemon2') return lerpCam(faceCam(C.lemon, 4.4, 150), faceCam(C.lemon, 4.8, 150), id === 'lemon' ? u : 1 - u * .5);
  if (id === 'lights') return lerpCam(at(r.x0 + 92, r.y0 + 90, 5.6), at(r.x0 + 92, r.y0 + 90, 6.0), u);
  if (id === 'tom2') { const a = faceCam(C.tom, 3.5, 130), b = faceCam(C.tom, 3.8, 130); a[0] -= 36; b[0] -= 36; return lerpCam(a, b, u); }
  if (id === 'straw') return lerpCam(faceCam(C.straw, 5.0, 150), faceCam(C.straw, 5.3, 150), u);
  return roomCam('station', 1.9);   /* the inserts: the world is under them */
}

// ------------------------------------------------------------------ the learning-platform card on the tablet (screen space, drawn in over(): crisp, after the grade)
const CX0 = 54, CY0 = 270, CW = 972, CH = 1060;                 /* the tablet's rectangle on screen (clear of the pill above and the caption zone below) */
const digitsAt = lt => {
  const secs = lt < 3.95 ? 0 : Math.round(14400 * eo(sg(lt, 3.95, 4.5))), h = Math.floor(secs / 3600), m = Math.floor(secs % 3600 / 60), s = secs % 60;
  return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};
const STAMP_T = snapT(12.13) - .04;                               /* the DUE chip lands on the word "clock" */
function cardDraw(lt, o) {
  const hero = o.hero !== false, k = o.k ?? 1, thump = lt > STAMP_T ? Math.sin((lt - STAMP_T) * 38) * Math.exp(-(lt - STAMP_T) / .09) * 7 : 0;
  ctx.save(); ctx.translate(540, 800 + thump); ctx.scale(k, k); ctx.translate(-540, -800);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 54; ctx.shadowOffsetY = 22; rr(CX0, CY0, CW, CH, 54); ctx.fillStyle = '#14161b'; ctx.fill(); ctx.restore();
  rr(CX0, CY0, CW, CH, 54); ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 4; ctx.stroke();
  const sx = CX0 + 30, sy = CY0 + 30, sw = CW - 60, sh = CH - 60, cx = 540;
  ctx.save(); rr(sx, sy, sw, sh, 28); ctx.clip();
  ctx.fillStyle = lg(0, sy, 0, sy + sh, [[0, '#f8faf9'], [1, '#e6f1ea']]); ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = '#1e8e5a'; ctx.fillRect(sx, sy, sw, 100);                                                       /* the app's header */
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(sx + 62, sy + 50, 20, 30, .6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(sx + 50, sy + 68); ctx.lineTo(sx + 74, sy + 32); ctx.stroke();
  ctx.restore();
  if (o.blank) { ctx.restore(); return; }
  UI.container('card:head', 'panel', [sx, sy, sx + sw, sy + 100], 4);
  UI.label('GREENLEAF LEARN', sx + 104, sy + 50, { size: 38, weight: 900, fill: '#fff', align: 'left', spacing: 2, hero, cid: 'card:head', maxW: 420 });
  UI.pill('STRAWBERRY, RN', sx + sw - 24, sy + 50, { size: 30, weight: 800, fill: '#14683f', ink: '#e4f6ec', anchor: 'right', hero, cid: 'card:head', maxW: 360 });
  UI.pill('MODULE 7 OF 7', cx, 468, { size: 46, weight: 900, fill: '#d7eee0', ink: '#14683f', stroke: '#1e8e5a', lw: 4, hero, padX: 38, h: 78, maxW: 700 });
  UI.label('HOW TO TAKE A', cx, 596, { size: 96, weight: 900, fill: '#103a2c', hero, maxW: sw - 80 });
  UI.label('BREAK SAFELY', cx, 704, { size: 96, weight: 900, fill: '#103a2c', hero, maxW: sw - 80 });
  UI.label('RUN TIME', cx, 806, { size: 32, weight: 800, fill: '#5b6470', spacing: 8, hero, maxW: 500 });
  /* the run time rolls up to 4:00:00 on "Four hours" (fixed cells: nothing shifts while the digits change) */
  const dg = digitsAt(lt), cw = 108, x0d = cx - cw * 3.5 + cw / 2, pop = lt >= 4.4 ? 1 + .06 * Math.max(0, Math.sin(PI * sg(lt, 4.4, 4.7))) : 1;
  ctx.save(); ctx.translate(cx, 936); ctx.scale(pop, pop); ctx.translate(-cx, -936);
  for (let i = 0; i < 7; i++) {
    const ch = dg[i], colon = ch === ':', blink = colon && lt > 4.6 ? (Math.sin(lt * 6.28) > 0 ? 1 : .35) : 1;
    UI.label(ch, x0d + i * cw, 936, { size: 236, font: 'Bangers', weight: 400, fill: lt >= 4.4 ? '#103a2c' : '#2b6e50', alpha: blink, hero: hero && pop <= 1.001 && lt >= 4.4, grp: 'digits' });
  }
  ctx.restore();
  UI.pill('UNSKIPPABLE', cx, 1066, { size: 32, weight: 900, fill: '#fdeceb', ink: '#b3261e', stroke: '#d93025', lw: 3, hero, padX: 28, h: 56, maxW: 520 });
  UI.label('DUE BEFORE CLOCK-OUT', cx, 1148, { size: 52, weight: 900, fill: '#b3261e', hero, maxW: sw - 80 });
  if (o.stamp) {
    const u = sg(lt, STAMP_T, STAMP_T + .13), p = lerp(1.5, 1, eo(u)), cy = 1238;
    ctx.save(); ctx.globalAlpha *= ss(u, 0, .3); ctx.translate(cx, cy); ctx.scale(p, p); ctx.translate(-cx, -cy);
    UI.stamp('DUE 11:00 PM', cx, cy, { size: 54, color: '#d6203a', rot: -.07, alpha: .95, hero: hero && u >= 1 });
    ctx.restore();
    if (u > 0 && u < 1.6) V2.ring(cx, cy, c01((lt - STAMP_T - .05) / .3), { r0: 40, r1: 300, color: '214,32,58', lw: 4, alpha: .5 });
  }
  ctx.restore();
}

// ------------------------------------------------------------------ Binder's bubble, big Binder, the pointer that chases "No thanks"
const BTXT1 = "It looks like you're learning. Would you like help?", BTXT2 = "Great! I'll help.";
function typedAt(id, text, lt) {   /* the share of the letters shown at lt, in step with the spoken words of a line */
  const L = LN[id]; if (!L) return 1;
  const words = L.words, n = text.length; let shown = 0, pos = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i][0].replace(/[^A-Za-z']/g, ''), w = text.indexOf(clean, pos), ws = wS(id, i) - .04, we = wE(id, i); if (w < 0) continue;
    if (lt < ws) break;
    const end = w + clean.length;
    shown = Math.max(shown, lerp(w, end, c01((lt - ws) / Math.max(.05, we - ws))));
    pos = end;
  }
  return lt >= wE(id, words.length - 1) ? 1 : c01(shown / n);
}
const BIG = { x: 350, y: 1060, s: 1.75 };                        /* Binder in the bubble inserts */
const BUBX = 110, BUBW = 860, BUBBOT = 760, RP = [[0, 0], [230, 50], [150, 190], [190, 330]];
const RUN = { t0: 10.37, t1: 10.95 };
const runU = lt => sg(lt, RUN.t0 + .04, RUN.t1);
function bubbleOpts(lt) {
  const o = { w: BUBW, s: 1, size: 42, name: 'Binder', buttons: [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }], runPath: RP };
  const second = lt >= bS('b2'); o.text = second ? BTXT2 : BTXT1;
  const h = SH15.binderRect(Object.assign({ at: [0, 0] }, o)).h; o.at = [BUBX, BUBBOT - h];     /* bottom-anchored: the buttons stay where they are when the text gets shorter */
  o.typed = second ? typedAt('b2', BTXT2, lt) : typedAt('b1', BTXT1, lt);
  o.runaway = runU(lt); o.pop = ss(lt, bS('b1'), bS('b1') + .3);   /* the bubble grows out of its tail as he starts to speak */
  o.tail = [BIG.x + 40 * BIG.s, BIG.y - 70 * BIG.s];
  return o;
}
function noRect(o, u) {   /* the current rectangle of "No thanks" as it hops (the same formula as SH15.binder) */
  const g = SH15.binderRect(Object.assign({}, o), 'no'); if (!g) return null;
  const s = o.s ?? 1, nH = RP.length - 1, i = Math.min(nH - 1, Math.floor(c01(u) * nH)), kk = easeIO(sg(c01(u), i / nH, (i + 1) / nH));
  return { x: g.x + lerp(RP[i][0], RP[i + 1][0], kk) * s, y: g.y + lerp(RP[i][1], RP[i + 1][1], kk) * s - Math.sin(PI * kk) * 52 * s, w: g.w, h: g.h };
}
function bigBinder(lt, o) {
  const b = A15.binder(Object.assign({ x: BIG.x, y: BIG.y + Math.sin(lt * 3) * 6, s: BIG.s, center: true, noLegs: true, who: 'bind', t: lt, yaw: -.25, pose: 'rest', look: [.45, -.35], hover: 8 }, o));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; drawChar(b); ctx.restore();
}
function veil(a) { ctx.fillStyle = 'rgba(8,14,18,' + a + ')'; ctx.fillRect(0, 0, W, H); const g = V2.radial(540, 800, 200, 1100, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function insertCard(lt, sh) {
  veil(.62);
  const k = 1 + .028 * sg(lt, sh.s, sh.e), pop = sh.id === 'card1' ? eb(sg(lt, sh.s, sh.s + .22)) : 1;
  ctx.save(); ctx.globalAlpha *= Math.min(1, pop * 3); cardDraw(lt, { k: k * lerp(.92, 1, Math.min(1, pop)), stamp: sh.id === 'card2', hero: pop >= .999 }); ctx.restore();
}
function insertBubble(lt, sh) {
  veil(.74);
  cardDraw(lt, { k: 1.0, blank: true });
  ctx.fillStyle = 'rgba(8,14,18,.62)'; ctx.fillRect(0, 0, W, H);   /* the tablet is pushed back: its screen is lit but empty, Binder has just left it */
  const bo = bubbleOpts(lt);
  /* Binder pops out of the tablet's screen on the cue: a ring and a flash on the glass, he grows out of it with an overshoot and rises to his place */
  const pk = sg(lt, CUE.binderpop, CUE.binderpop + .34), mv = ss(pk, .12, 1), grow = eb(sg(lt, CUE.binderpop, CUE.binderpop + .24));
  if (lt >= CUE.binderpop && lt < CUE.binderpop + .5) { const q = (lt - CUE.binderpop) / .5; V2.ring(540, 800, q, { r0: 30, r1: 360, color: '170,255,210', lw: 8, alpha: .8 * (1 - q) }); V2.glow(540, 800, 420 * (1 - .4 * q), '190,255,220', .5 * (1 - q), 'screen', .3); }
  if (lt >= CUE.binderpop) {
    const px = lerp(540, BIG.x, mv), py = lerp(800, BIG.y, mv) - Math.sin(PI * mv) * 150;
    bigBinder(lt, { x: px, y: py + Math.sin(lt * 3) * 6 * mv, s: BIG.s * grow, grin: lt >= bS('b2') ? .5 : .15, pose: lt < bS('b2') ? (mv < 1 ? 'ears' : 'helpful') : 'rest', look: [.5, -.4] });
  }
  const bub = SH15.binder(bo, lt);
  // the pointer chases "No thanks"
  if (sh.id === 'bub2') {
    const nr = noRect(bo, runU(lt)) || { x: 600, y: 600, w: 270, h: 62 }, nrPrev = noRect(bo, runU(lt - .07)) || nr;
    const home = SH15.binderRect(bo, 'no');
    let px, py, press = 0;
    if (lt < RUN.t0 + .04) { const q = easeIO(sg(lt, sh.s, RUN.t0 - .02)); px = lerp(900, home.x + home.w * .7, q); py = lerp(900, home.y + home.h * .8, q); press = Math.sin(PI * sg(lt, RUN.t0 - .02, RUN.t0 + .2)); }
    else { px = nrPrev.x + nrPrev.w * .7; py = nrPrev.y + nrPrev.h * .8; press = lt < RUN.t0 + .22 ? Math.sin(PI * sg(lt, RUN.t0 - .02, RUN.t0 + .2)) : 0; }
    SH15.pointer(px, py, { kind: 'arrow', press, s: 1.7 });
  }
}
function insertBinder(lt, sh) {
  veil(.8);
  const k = sg(lt, sh.s, sh.e), g = ss(lt, CUE.grin, CUE.grin + .14);
  V2.glow(540, 900, 640, '120,255,180', .16 + .12 * g, 'screen', .3);
  const p = lerp(1.9, 2.15, k), by = 930;
  const b = A15.binder({ x: 540, y: by, s: p, center: true, noLegs: true, who: 'bind', t: lt, yaw: 0, pose: 'cheer', grin: g, glint: g > .9 ? Math.max(0, Math.sin((lt - CUE.grin - .12) * 14)) ** 2 : 0, look: [.1, .1], hover: 8 });
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16; drawChar(b); ctx.restore();
}

// ------------------------------------------------------------------ the scene object
const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const st = ST(lt); STATE = st; const C = cast(lt, st), sh = shotAt(lt); FRAME = { C, st, sh };
    const [x, y, z] = camAt(lt, C, st, sh);
    sh.dof = sh.k !== 'world' ? 14 : z > 3.4 ? 3 + (z - 3.4) * 2.2 : 0;
    zoomTo(x, y, z);
  },
  draw(lt) { drawWorld(lt); },
  fx(lt) {
    const fx = { bloom: .5 + .9 * Math.max(0, 1 - Math.abs(lt - CUE.sting - .05) / .22), vignette: .42, grain: .045, contrast: .13, sat: .1 };
    if (lt < .25) { fx.fade = 1 - sg(lt, 0, .25); fx.fadeColor = '16,12,24'; }
    return fx;
  },
  blur(lt) { return 1; },
  over(lt) {
    const sh = FRAME.sh;
    if (sh.k === 'card') insertCard(lt, sh); else if (sh.k === 'bubble') insertBubble(lt, sh); else if (sh.k === 'binder') insertBinder(lt, sh);
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP17_SCENES = window.__EP17_SCENES || {};
window.__EP17_SCENES.assign = SC;
})();
