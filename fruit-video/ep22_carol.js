'use strict';
/* SHIFT HAPPENS, Episode 22: "The Secret Santa". Builder E22-CAROL. Scene `carol` (10:55 PM, THE CAROL, 30.927 s). Registers window.__EP22_SCENES.carol. Everything is a pure function of the scene time `lt`.
 *
 * THE SET: the day room at 10:55 PM, lamps low, drawn as ONE flat stage (world units are screen px at zoom 1; the camera is zoomTo on a point or a face). The back wall (base FLW 1200, ceiling edge CEIL 250),
 * left to right: the Christmas tree behind the left end of the row (x -310, lit through L20), the big window in the middle with the Moon (pane x 330-750, y 400-800; the Moon at (540, 600), s 1.1 = 330 px),
 * a shelf of stockings, a floor lamp, the door to the corridor (x 2020-2300) with a wreath and THE wall clock above it (2160, 560; it reads 10:55). The dozen glove balloons from 6 PM are still on the
 * ceiling; string lights sag along the top of the wall.
 * THE ROW (wheel line FL 1330): seven seats facing us, the residents in wheelchairs in Santa hats with song sheets, and in the middle the armchair with a bow they saved for the nurse:
 *   S1 Banana -480 | S2 Cranberry -140 (the pitch pipe) | S3 Pear 200 (the conductor) | S4 STRAWBERRY 540 (under the Moon) | S5 Apple 880 (asleep until "applesauce") | S6 Goji 1220 | S7 Lime 1560.
 * Every resident is scaled so the seated figure is about 315 px tall: speaking size at zoom .96 and up. They sing TO her (heads turned in), sway on the bar, bob on beats 1 and 3; Pear's hand beats 4/4.
 *
 * THE BEAT GRID (frozen): 112 bpm, a bar every 2.142857 s, the intro bar at 4.047; c1 .. c7 start exactly on the next seven downbeats (6.190 8.333 10.476 12.619 14.762 16.905 19.048), s2 on the eighth (21.190).
 * Every cut on the grid is snapped to the nearest frame (snapT). THE COUNT: each named thing pops in near the choir as it is sung (5 pudding cups round the Moon, 4 warm blankets, 3 call bells, 2 grip socks,
 * 1 spoon of applesauce with the pill). The sing-along caption is the engine's (capBall); nothing of this file draws a caption.
 *
 * SHOTS (scene-local s; a boundary frame is the NEW shot):
 *  open 0-1.20 MATCH CUT IN: the round wall clock (10:55) centred at (540, 980), 300 px, still to .5, then a slow pull back to the door and its wreath | pe1 1.20-2.80 Pear: "Nurse. We made you something.",
 *  he points at the armchair with the bow | s1 2.80-4.05 Strawberry at the chair: "You didn't have to.", she sits (finally) | pp 4.05-5.12 (intro beat 1) Cranberry's pitch pipe (pitchpipe 4.147) |
 *  up 5.12-6.19 (beat 3) Pear raises his hands, the choir breathes on beat 4 (5.654) | c1 6.19 the left trio (Banana, Cranberry, Pear) | c2 8.33 Pear, Strawberry, Apple: "my nurse", a push in on her |
 *  c3 10.48 THE GRAND ONE: the centre and the window, a slow push and rise, five pudding cups arch round the Moon | c4 12.62 the right trio (Apple, Goji, Lime): four warm blankets |
 *  c5 14.76 the left trio: three call bells | rx 15.83 (beat 3) Strawberry's nurse reflex at the bells: she half rises, Pear pats her down | c6 16.90 Goji and Lime: two grippy socks |
 *  c7a 19.05 Pear's spoon, the pill lands on "pill" | c7b 20.12 (beat 3) the finale wide: Apple wakes on "applesauce!", arms up, the cutoff | s2 21.19 Strawberry "That's not a carol." (touched) |
 *  pe2 22.28 Pear "It's a care plan." (the song sheet is a CARE PLAN) | eg1 23.31 the door bursts open (doorchime 23.307), Eggplant, snow on her hat: "I'm here! On time!" (the clock: 10:55) |
 *  s3 25.12 Strawberry "A Christmas miracle." (the smallest smile) | mo1 26.33 the Moon: "Merry Christmas, three to eleven." | end 28.98 (sting 29.077) the warm wide, then a slow push to the window:
 *  MATCH CUT OUT: the Moon centred at (540, 760), 300 px, still for the last .45 s.
 * Kits checked at DRAW time with stand-ins: A22 (santaHat, tree, gloveBalloon, pudding, gripSocks, bow, wreath, stocking), L20 (the light pass), FX18 (glow), SN20 (the snow outside), A20 (Eggplant).
 */
(() => {
if (!window.TIMELINE_EP22 || !window.H6 || !window.V2 || !window.UI || !window.A7) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const sr = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const lg = (x0, y0, x1, y1, st) => V2.grad(x0, y0, x1, y1, st);
const rg = (x, y, r0, r1, st) => V2.radial(x, y, r0, r1, st);
const INKC = 'rgba(25,16,30,.82)';
const shade = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${q(r)},${q(g)},${q(b)})`; };
function key(keys, lt, ease = easeIO) {                                   /* keyframes [[t, v]] (v a number or an array): eased between neighbours */
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
/* the kits, checked at DRAW time (the load order is not ours) */
const KIT = (name, fn) => { const k = window[name]; return !!(k && typeof k === 'object' && (!fn || typeof k[fn] === 'function')); };
const glow = (x, y, r, color, a, core = .3) => { if (a <= .003 || r <= 1) return; if (KIT('FX18', 'glow')) FX18.glow(ctx, { x, y, r, color, alpha: a, core }); else V2.glow(x, y, r, V2.rgb(color).join(','), Math.min(1, a), 'screen', core); };

// ------------------------------------------------------------------ the frozen timeline: beats, words, cues, frame snapping (helpers as in ep16_prize.js / ep18_station.js)
const TLX = window.TIMELINE_EP22, SCN = TLX.scenes.find(s => s.id === 'carol'), START = SCN.start, DUR = SCN.dur;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'carol') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const ls = id => LN[id].s - START, le = id => LN[id].e - START;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1], wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
/* the sound cues of the scene (python3 /tmp/shift_tools/cues.py 22 carol), snapped to the video frame nearest each */
const CUE = { pitchpipe: 4.147, doorchime: 23.307, sting: 29.077 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);
/* THE GRID: 112 bpm; DB(k) is downbeat k (0 the intro bar, 1 .. 7 the carol lines c1 .. c7, 8 "That's not a carol."); beatsAt counts beats since the intro's downbeat */
const BAR = 240 / 112, BEAT = BAR / 4, B0 = bS('intro');
const DB = k => B0 + k * BAR;
const beatsAt = lt => (lt - B0) / BEAT;
const CAROL = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
const singing = lt => CAROL.some(id => lt >= ls(id) - .02 && lt < le(id) + .02);
const inLine = (lt, id, a = .05, b = .12) => !!LN[id] && lt >= ls(id) - a && lt < le(id) + b;
/* the choir's motion on the grid: carolK fades the sway in for the breath (beat 4 of the intro) and out after the cutoff; sway leans left on beats 1 and right on beats 3; dip is the nod on beats 1 and 3 */
const carolK = lt => ss(lt, DB(1) - .55, DB(1) - .1) * (1 - ss(lt, le('c7') + .1, le('c7') + .7));
function swayAt(lt) { const u = (lt - B0) / BAR; return -Math.cos(2 * PI * u); }
function dipAt(lt) { const v = (lt - B0) / (BAR / 2), f = (v - Math.round(v)) * BAR / 2; return Math.exp(-(f / .09) * (f / .09)) * (f > -.04 ? 1 : .35); }

// ------------------------------------------------------------------ the stage: numbers (world units)
const FLW = 1200, FL = 1330, CEIL = 250;
const WIN = { x0: 330, x1: 750, y0: 400, y1: 800 };                     /* the window's pane; the frame is 22 px round it, the sill below */
const MOON = { x: 540, y: 600, s: 1.0 };                                /* A7.moon: radius 150 x s: 300 px across at zoom 1 (the match cut out) */
const DOOR = { x0: 2020, x1: 2300, y0: 660 };                           /* the door to the corridor, hinged on its right edge, opening into the room */
const CLOCK = { x: 2160, y: 560, r: 70 };                               /* THE clock (10:55): 140 px across, so 300 px on screen at zoom 2.14 */
const TREE = { x: -310, y: FLW + 10, h: 830, w: 500 };
/* scale s: the seated figure (head top to body bottom, no hat) is about 310 px at zoom 1.08 (speaking size); sheet: the hand that holds the song sheet (the one toward the middle of the row) */
const SEATS = [
  { n: 1, id: 'banana', x: -480, s: .95, col: '#3b6aa8', blank: ['#d8a83a', 'rgba(120,70,10,.45)'], yaw: .3, sing: 1, sheet: 'r' },
  { n: 2, id: 'cran', x: -140, s: 1.45, col: '#5f7f4f', blank: ['#e88aa0', 'rgba(255,240,240,.55)'], yaw: .3, sing: 1, sheet: 'l' },
  { n: 3, id: 'pear', x: 200, s: 1.12, col: '#8a3b3b', blank: ['#4a6fa8', 'rgba(255,255,255,.5)'], yaw: .4, sing: 1, sheet: '' },
  { n: 5, id: 'apple', x: 880, s: 1.1, col: '#6a5a8a', blank: ['#c8d8a0', 'rgba(70,90,40,.4)'], yaw: -.22, sing: 0, sheet: 'l' },
  { n: 6, id: 'goji', x: 1220, s: 1.34, col: '#6a6a78', blank: ['#8a8f9c', 'rgba(40,44,60,.4)'], yaw: -.3, sing: 1, sheet: 'l' },
  { n: 7, id: 'lime', x: 1560, s: 1.22, col: '#7a6a48', blank: ['#b05a6a', 'rgba(255,230,230,.45)'], yaw: -.34, sing: 1, sheet: 'l' },
];
const SEAT = {}; for (const S of SEATS) SEAT[S.id] = S;
const STR = { x: 540, s: 1.0 };                                         /* Strawberry's armchair (S4) */
const seatYOf = s => FL - 62 * s;                                        /* a sitter's body bottom (noLegs: the body centre is .9 ry s above it) */
const CTOR = { banana: o => A7.banana(o), cran: o => A7.cran(o), pear: o => A7.pear(o), apple: o => A7.apple(o), goji: o => A7.goji(o), lime: o => (window.A6 && A6.lime ? A6.lime(o) : A7.banana(o)) };

// ------------------------------------------------------------------ the room, back to front. One-point perspective painted on the flat stage: the ceiling tiles and the floor planks run to VP.
const VP = [540, 720];
let LIGHTS = [];                                                         /* the lights of the frame, collected while the room is drawn, handed to L20.pass at the end of draw() */
const addLight = l => LIGHTS.push(l);
function drawCeiling(lt) {
  const y0 = -900, y1 = CEIL;
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#3c3046'], [.55, '#5a4858'], [1, '#86685c']]); ctx.fillRect(-1600, y0, 4800, y1 - y0 + 2);
  /* ceiling tiles: rows spaced in perspective, seams running away from VP */
  ctx.save(); ctx.strokeStyle = 'rgba(30,20,30,.28)'; ctx.lineWidth = 2;
  for (let i = 1; i < 9; i++) { const y = y1 - 46 * (Math.pow(1.42, i) - 1); if (y < y0) break; ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(3200, y); ctx.stroke(); }
  for (let x = -1500; x <= 3000; x += 190) { const dx = x - VP[0], dy = y1 - VP[1], k = (y0 - VP[1]) / dy; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(VP[0] + dx * k, y0); ctx.stroke(); }
  ctx.restore();
  /* the crown moulding where the wall meets the ceiling */
  ctx.fillStyle = '#efe2cc'; ctx.fillRect(-1600, y1 - 4, 4800, 22); ctx.fillStyle = 'rgba(40,24,20,.35)'; ctx.fillRect(-1600, y1 + 18, 4800, 6);
}
function drawWall(lt) {
  /* warm wallpaper with a soft stripe, a green wainscot under a chair rail, a baseboard */
  ctx.fillStyle = lg(0, CEIL, 0, FLW, [[0, '#d2b083'], [.5, '#dcbc90'], [1, '#c8a274']]); ctx.fillRect(-1600, CEIL + 20, 4800, FLW - CEIL - 20);
  ctx.save(); ctx.globalAlpha = .07; ctx.fillStyle = '#8a5a3a'; for (let x = -1600; x < 3200; x += 68) ctx.fillRect(x, CEIL + 24, 22, 760 - CEIL); ctx.restore();
  ctx.fillStyle = lg(0, 1000, 0, FLW, [[0, '#3f6b5a'], [1, '#2f5446']]); ctx.fillRect(-1600, 1000, 4800, FLW - 1000);
  ctx.save(); ctx.strokeStyle = 'rgba(15,30,25,.35)'; ctx.lineWidth = 3; for (let x = -1590; x < 3200; x += 170) { ctx.strokeRect(x + 14, 1030, 142, FLW - 1060); } ctx.restore();
  ctx.fillStyle = '#9a6a42'; ctx.fillRect(-1600, 990, 4800, 16); ctx.fillStyle = 'rgba(30,16,10,.35)'; ctx.fillRect(-1600, 1006, 4800, 5);
  ctx.fillStyle = '#5a3a26'; ctx.fillRect(-1600, FLW - 26, 4800, 26);
}
function drawFloor(lt) {
  ctx.fillStyle = lg(0, FLW, 0, 2700, [[0, '#7a5236'], [.35, '#8a6040'], [1, '#5a3c28']]); ctx.fillRect(-1600, FLW, 4800, 1600);
  ctx.save(); ctx.strokeStyle = 'rgba(25,12,6,.3)'; ctx.lineWidth = 2;
  for (let x = -1700; x <= 3300; x += 120) { const dx = x - VP[0], k = (2800 - VP[1]) / (FLW - VP[1]); ctx.beginPath(); ctx.moveTo(x, FLW); ctx.lineTo(VP[0] + dx * k, 2800); ctx.stroke(); }
  for (let i = 1; i < 12; i++) { const y = FLW + 30 * (Math.pow(1.38, i) - 1); ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(3200, y); ctx.stroke(); }
  ctx.restore();
  /* the rug under the row: a long oval, deep red with a cream border and a ring of diamonds */
  ctx.save(); ctx.translate(560, 1370); ctx.scale(1, .16);
  ctx.fillStyle = '#6e2420'; ctx.beginPath(); ctx.arc(0, 0, 1400, 0, TAU); ctx.fill(); ctx.fillStyle = '#e2cfa4'; ctx.beginPath(); ctx.arc(0, 0, 1340, 0, TAU); ctx.fill(); ctx.fillStyle = '#8e3026'; ctx.beginPath(); ctx.arc(0, 0, 1290, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e2cfa4'; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, x = Math.cos(a) * 1180, y = Math.sin(a) * 1180; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x, y + 60); ctx.lineTo(x + 40, y); ctx.lineTo(x, y - 60); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
/* the window: a deep blue night with stars and falling snow, the Moon in it, red drapes tied back, a garland swag on the valance */
function drawWindow(lt, o = {}) {
  const w = WIN, F = 22;
  ctx.fillStyle = 'rgba(20,10,10,.3)'; rr(w.x0 - F + 8, w.y0 - F + 10, w.x1 - w.x0 + 2 * F, w.y1 - w.y0 + 2 * F, 6); ctx.fill();
  ctx.fillStyle = '#efe6d6'; ctx.strokeStyle = INKC; ctx.lineWidth = 3.4; rr(w.x0 - F, w.y0 - F, w.x1 - w.x0 + 2 * F, w.y1 - w.y0 + 2 * F, 6); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0); ctx.clip();
  ctx.fillStyle = lg(0, w.y0, 0, w.y1, [[0, '#0b1434'], [.55, '#18285a'], [1, '#33507e']]); ctx.fillRect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
  for (let i = 0; i < 40; i++) { const x = w.x0 + 10 + sr(i, 1) * (w.x1 - w.x0 - 20), y = w.y0 + 10 + sr(i, 2) * (w.y1 - w.y0 - 90), tw = .55 + .45 * Math.sin(lt * (.6 + sr(i, 3) * .9) + i * 2.1); ctx.fillStyle = `rgba(255,250,232,${.3 + .45 * tw})`; ctx.beginPath(); ctx.arc(x, y, 1.2 + 1.8 * sr(i, 4), 0, TAU); ctx.fill(); }
  /* the town far below: a warm glow and a few roofs under snow */
  ctx.fillStyle = rg(540, w.y1 + 40, 10, 360, [[0, 'rgba(255,200,140,.35)'], [1, 'rgba(255,200,140,0)']]); ctx.fillRect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
  ctx.fillStyle = '#1a2240'; ctx.beginPath(); ctx.moveTo(w.x0, w.y1); for (let i = 0; i <= 8; i++) { const x = w.x0 + i * (w.x1 - w.x0) / 8; ctx.lineTo(x, w.y1 - 30 - 26 * sr(i, 7)); ctx.lineTo(x + 26, w.y1 - 44 - 26 * sr(i, 7)); } ctx.lineTo(w.x1, w.y1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8eefa'; for (let i = 0; i < 8; i++) { const x = w.x0 + i * (w.x1 - w.x0) / 8; ctx.fillRect(x + 4, w.y1 - 36 - 26 * sr(i, 7), 30, 5); }
  ctx.fillStyle = 'rgba(255,214,140,.9)'; for (let i = 0; i < 8; i++) { const x = w.x0 + 16 + i * (w.x1 - w.x0) / 8; if (sr(i, 9) > .35) ctx.fillRect(x, w.y1 - 20 - 10 * sr(i, 7), 7, 8); }
  if (o.moon !== false) drawMoon(lt);
  if (KIT('SN20', 'snow')) SN20.snow(ctx, { x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1, t: lt, seed: 22, layers: 2, density: 4, wind: -18, tone: 'dark', fore: false, alpha: .8 });
  else for (let i = 0; i < 60; i++) { const sp = 40 + 70 * sr(i, 3), x = w.x0 + (((sr(i, 1) * 420 + lt * (-14 + 12 * Math.sin(lt * .7 + i))) % 420) + 420) % 420, y = w.y0 + (((sr(i, 2) * 400 + lt * sp) % 400) + 400) % 400; ctx.fillStyle = `rgba(255,255,255,${.4 + .4 * sr(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + 2.5 * sr(i, 5), 0, TAU); ctx.fill(); }
  if (KIT('SN20', 'frost')) SN20.frost(ctx, { x: w.x0, y: w.y0, w: w.x1 - w.x0, h: w.y1 - w.y0, amount: .32, seed: 7, t: lt, tone: 'dark', fade: .7 });
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(w.x0 + 40, w.y0); ctx.lineTo(w.x0 + 150, w.y0); ctx.lineTo(w.x0, w.y0 + 170); ctx.lineTo(w.x0, w.y0 + 70); ctx.closePath(); ctx.fill();
  ctx.restore();
  /* paper snowflakes taped in the lower corners (clear of the Moon) */
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.88)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (const [fx, fy, r] of [[w.x0 + 34, w.y1 - 120, 20], [w.x1 - 36, w.y1 - 150, 17], [w.x0 + 58, w.y0 + 46, 14], [w.x1 - 52, w.y0 + 40, 16]]) { ctx.save(); ctx.translate(fx, fy); ctx.rotate(.3 * Math.sin(fx)); for (let k = 0; k < 6; k++) { ctx.rotate(PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.moveTo(0, -r * .55); ctx.lineTo(r * .3, -r * .8); ctx.moveTo(0, -r * .55); ctx.lineTo(-r * .3, -r * .8); ctx.stroke(); } ctx.restore(); }
  ctx.restore();
  /* the sill */
  ctx.fillStyle = 'rgba(20,10,10,.3)'; ctx.fillRect(w.x0 - 46, w.y1 + F + 22, w.x1 - w.x0 + 92, 10);
  ctx.fillStyle = '#e6dac4'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(w.x0 - 46, w.y1 + F - 2, w.x1 - w.x0 + 92, 26, 4); ctx.fill(); ctx.stroke();
  addLight({ kind: 'rect', x: (w.x0 + w.x1) / 2, y: (w.y0 + w.y1) / 2, w: w.x1 - w.x0, h: w.y1 - w.y0, color: '#8fb0ff', power: .45 });
}
/* the Moon in the window: the series' Moon (A7.moon, who 'moon': his mouth follows his line). He watches the room, sways a little with the carol, smiles; on mo1 he speaks */
function drawMoon(lt) {
  if (!A7.moon) return;
  const sway = .5 * carolK(lt) * swayAt(lt), look = lt < 2.8 ? [.0, .25] : lt < bS('mo1') ? [lerp(-.15, .15, .5 + .5 * Math.sin(lt * .4)), .45] : [0, .2];
  const happy = lt >= DB(3) - .2, ex = lt >= ls('mo1') - .3 ? 'happy' : happy ? 'happy' : 'neutral';
  const bob = 3 * Math.sin(lt * .8) * c01((END_HOLD - .3 - lt) / .6);
  A7.moon(MOON.x + 4 * sway, MOON.y + bob, MOON.s, { t: lt, halo: true, haloA: .7, warm: .18, suppress: !(FR && FR.moonAud), char: { expr: ex, look, rot: .02 * sway } });
  addLight({ kind: 'point', x: MOON.x, y: MOON.y, r: 420, color: '#dfe8ff', power: .38 });
}
/* the drapes: red velvet, tied back with gold cords, a garland swag over the top */
function drawDrapes(lt) {
  const w = WIN;
  for (const sd of [-1, 1]) {
    const xi = sd < 0 ? w.x0 - 10 : w.x1 + 10, xo = xi + sd * 120, top = w.y0 - 70, bot = FLW - 4, tie = 900;
    ctx.save(); ctx.beginPath(); ctx.moveTo(xo, top); ctx.lineTo(xi, top);
    ctx.quadraticCurveTo(xi - sd * 6, tie - 120, xi + sd * 70, tie); ctx.quadraticCurveTo(xi + sd * 40, tie + 140, xi + sd * 30, bot); ctx.lineTo(xo + sd * 30, bot); ctx.quadraticCurveTo(xo, tie + 60, xo + sd * 10, tie); ctx.lineTo(xo, top); ctx.closePath();
    ctx.fillStyle = lg(xi, 0, xo, 0, [[0, '#b0283a'], [.5, '#8a1a2a'], [1, '#5e101c']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke(); ctx.clip();
    ctx.strokeStyle = 'rgba(40,0,10,.35)'; ctx.lineWidth = 6; for (let i = 1; i < 4; i++) { const x = lerp(xi, xo, i / 4); ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(lerp(x, xi + sd * 60, .5), tie - 60, lerp(x, xi + sd * 60, .9), tie); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#e8b73a'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(xi + sd * 62, tie, 16, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e8b73a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xi + sd * 62, tie + 8); ctx.quadraticCurveTo(xi + sd * 58, tie + 40, xi + sd * 66, tie + 70); ctx.stroke();
  }
  /* the valance: a swag of evergreen garland with red bows over the window */
  const gx0 = w.x0 - 150, gx1 = w.x1 + 150, gy = w.y0 - 64;
  ctx.save(); ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i <= 40; i++) {
    const u = i / 40, x = lerp(gx0, gx1, u), y = gy + 46 * Math.sin(u * PI * 2) * Math.sin(u * PI * 2) * (u < .5 ? 1 : 1) + 6 * Math.sin(u * 37);
    ctx.fillStyle = pass ? (i % 3 ? '#2f7a3e' : '#3e9150') : '#1d4a26'; ctx.beginPath(); ctx.arc(x + (pass ? 0 : 3), y + (pass ? 0 : 4), pass ? 15 : 17, 0, TAU); ctx.fill();
  }
  for (const u of [0, .5, 1]) { const x = lerp(gx0, gx1, u), y = gy; ribbonBow(x, y, 1.0, '#d22a3a'); }
  ctx.restore();
}
/* a ribbon bow (two loops and two tails), (x, y) its knot */
function ribbonBow(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.fillStyle = col; ctx.strokeStyle = INKC; ctx.lineWidth = 2.6;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(sd * 30, -30, sd * 46, -6, sd * 34, 8); ctx.bezierCurveTo(sd * 24, 16, sd * 10, 8, 0, 0); ctx.fill(); ctx.stroke(); }
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(sd * 18, 40); ctx.lineTo(sd * 8, 36); ctx.lineTo(sd * 2, 44); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 1, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ the holiday light: every bulb breathes on its own slow sine (0.3 to 0.8 Hz), never in sync, never fully off (PHOTOSENSITIVITY)
const BULB = ['#ff4a4a', '#ffd23a', '#4ad05a', '#4aa8ff', '#ff8a2a', '#fff0c0'];
const twinkle = (t, phase) => (KIT('A22', 'twinkle') ? A22.twinkle(t, phase) : .72 + .28 * Math.sin(t * TAU * (.3 + .5 * ((phase * 7.13) % 1)) + phase * 6.1));
/* the world rectangle the camera sees (no roll), with a margin: lights outside it are not handed to the pass */
const view = (m = 200) => { const hw = 540 / CAM.z + m, hh = 960 / CAM.z + m; return [CAM.x - hw, CAM.y - hh, CAM.x + hw, CAM.y + hh]; };
const inView = (x, y, v) => x > v[0] && x < v[2] && y > v[1] && y < v[3];
function bulb(x, y, col, tw, r = 7) {
  glow(x, y, r * 4.5, col, .32 * tw, .35);
  ctx.fillStyle = col; ctx.strokeStyle = 'rgba(20,12,16,.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y + r * .35, r * .8, r * 1.15, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${.35 + .5 * tw})`; ctx.beginPath(); ctx.ellipse(x - r * .25, y, r * .28, r * .45, 0, 0, TAU); ctx.fill();
}
/* the Christmas tree: A22.tree when it lands (it returns its bulbs), else this stand-in with the same anchors (base centre x, y; height h) */
function drawTree(lt) {
  const T0 = TREE, v = view();
  let bulbs = [];
  if (KIT('A22', 'tree')) {
    const r = A22.tree(ctx, { x: T0.x, y: T0.y, h: T0.h, t: lt, lights: true, glow: .35, gifts: 4, seed: 22 });
    bulbs = (r && r.lights) || [];
  } else {
    const { x, y, h, w } = T0;
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 26, y - 70, 52, 70);
    ctx.fillStyle = '#b22a2a'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(x - 70, y - 40, 140, 44, 8); ctx.fill(); ctx.stroke();
    const tiers = 5;
    for (let i = 0; i < tiers; i++) {
      const u0 = i / tiers, top = y - 60 - h * (1 - u0) * .98, bw = w * (1 - u0 * .78) / 2, by = y - 60 - h * (tiers - 1 - i) / tiers * .9 + (i === 0 ? 0 : 0), yb = y - 60 - (h * .82) * (i / tiers) ;
      const ty = y - 60 - h * ((i + 1.55) / (tiers + .7));
      ctx.fillStyle = lg(x - bw, 0, x + bw, 0, [[0, '#1d5a2c'], [.45, '#2e7d3c'], [1, '#174a24']]);
      ctx.beginPath(); ctx.moveTo(x, ty - 40); ctx.quadraticCurveTo(x - bw * .4, yb - (yb - ty) * .45, x - bw, yb); for (let j = 0; j <= 6; j++) ctx.lineTo(x - bw + j * bw / 3, yb + (j % 2 ? 14 : 0)); ctx.quadraticCurveTo(x + bw * .4, yb - (yb - ty) * .45, x, ty - 40); ctx.closePath();
      ctx.fill(); ctx.strokeStyle = 'rgba(8,24,12,.75)'; ctx.lineWidth = 3; ctx.stroke();
    }
    /* tinsel: gold scallops across the tiers */
    ctx.strokeStyle = '#e8c45a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const yy = y - 160 - i * h * .19, hw = w * (.46 - i * .09); ctx.beginPath(); ctx.moveTo(x - hw, yy - 30); ctx.quadraticCurveTo(x, yy + 26, x + hw, yy - 40); ctx.stroke(); }
    /* baubles */
    for (let i = 0; i < 16; i++) { const u = sr(i, 31), hh = .1 + .78 * sr(i, 32), hw = w * .45 * (1 - hh * .9), bx = x + (u * 2 - 1) * hw * .85, by = y - 70 - hh * h * .9; const col = ['#d8263a', '#e8b73a', '#3a7ad8', '#c8c8d8'][i % 4];
      ctx.fillStyle = rg(bx - 4, by - 4, 1, 15, [[0, '#ffffff'], [.25, col], [1, shade(col, .55)]]); ctx.beginPath(); ctx.arc(bx, by, 12, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke(); }
    /* the star */
    const sx = x, sy = y - 60 - h * .98 - 10;
    ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#8a6d00'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 16 : 38; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
    glow(sx, sy, 150, '#ffe08a', .45 + .1 * Math.sin(lt * 1.3), .5);
    ctx.restore();
    /* the string of lights spiralling down: positions and colours (phase per bulb) */
    for (let i = 0; i < 34; i++) { const u = (i + .5) / 34, hh = .06 + .86 * u, hw = w * .47 * (1 - (1 - hh) * 0) * (hh), bx = x + Math.sin(u * PI * 7.2) * w * .44 * (1 - u * .82), by = y - 70 - (1 - u) * h * .86 - 14 * Math.cos(u * PI * 7.2); bulbs.push({ x: bx, y: by, color: BULB[i % 5], phase: sr(i, 41) }); }
    for (const b of bulbs) bulb(b.x, b.y, b.color, twinkle(lt, b.phase), 7);
  }
  /* the tree lights the room: one big warm soft light, and its bulbs as small points (only the ones the camera sees) */
  addLight({ kind: 'point', x: T0.x, y: T0.y - T0.h * .5, r: 640, color: '#ffcf8a', power: .75 });
  let n = 0; for (const b of bulbs) if (inView(b.x, b.y, v) && (n++ % 2 === 0)) addLight({ kind: 'point', x: b.x, y: b.y, r: 90, color: b.color, power: .55 * twinkle(lt, b.phase) });
}
/* a floor lamp standing against the wall (its pole hides behind the row): the shade glows, the light falls warm on the wall and the singers' backs */
function drawLamp(x, lt, seed, y0 = 650) {
  const f = .96 + .04 * Math.sin(lt * 1.1 + seed);
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, FLW); ctx.lineTo(x, y0 + 70); ctx.stroke();
  ctx.fillStyle = '#3a2c20'; ctx.beginPath(); ctx.ellipse(x, FLW - 4, 44, 10, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 52, y0 + 80); ctx.lineTo(x + 52, y0 + 80); ctx.lineTo(x + 78, y0); ctx.lineTo(x - 78, y0); ctx.closePath();
  ctx.fillStyle = lg(0, y0, 0, y0 + 80, [[0, '#ffe8b4'], [1, '#f2c27a']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  glow(x, y0 + 50, 260 * f, '#ffc480', .5 * f, .5);
  addLight({ kind: 'point', x, y: y0 + 60, r: 560, color: '#ffc884', power: .9 * f });
}
/* the stockings on a shelf over the right end of the row (A22.stocking when it lands); the names are dressing */
const STOCK = [['NURSE', '#c8263a', '#f4efe2'], ['GOJI', '#2e7d3c', '#f4efe2'], ['APPLE', '#c8263a', '#2e7d3c'], ['LIME', '#3a6ad0', '#f4efe2'], ['BRENDA', '#c8263a', '#f4efe2']];
function drawStockings(lt) {
  const y = 440, x0 = 990, x1 = 1730;
  ctx.fillStyle = 'rgba(20,10,10,.3)'; ctx.fillRect(x0 + 6, y + 18, x1 - x0, 10);
  ctx.fillStyle = lg(0, y, 0, y + 20, [[0, '#b58a56'], [1, '#7a5634']]); rr(x0, y, x1 - x0, 20, 3); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  STOCK.forEach(([name, col, cuff], i) => {
    const x = x0 + 80 + i * 145, sw = .03 * Math.sin(lt * .9 + i * 1.7), yy = y + 20;
    if (KIT('A22', 'stocking')) { A22.stocking(ctx, { x, y: yy, s: .6, rot: sw, t: lt, name, color: col, dir: i % 2 ? -1 : 1 }); return; }
    ctx.save(); ctx.translate(x, yy); ctx.rotate(sw); ctx.scale(.75, .75); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-26, 20); ctx.lineTo(-26, 110); ctx.quadraticCurveTo(-28, 150, 10, 152); ctx.lineTo(44, 150); ctx.quadraticCurveTo(66, 132, 40, 118); ctx.lineTo(26, 112); ctx.lineTo(26, 20); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = cuff; rr(-34, 0, 68, 30, 8); ctx.fill(); ctx.stroke();
    UI.label(name, 0, 15, { size: 13, weight: 900, fill: '#3a2230', maxW: 60, hero: false, crop: true });
    ctx.restore();
  });
}
/* string lights sagging along the top of the wall, hook to hook */
function drawStringLights(lt) {
  const v = view(), y = CEIL + 44, step = 340;
  ctx.save(); ctx.strokeStyle = 'rgba(20,30,20,.75)'; ctx.lineWidth = 2.4;
  let n = 0;
  for (let hx = -1300; hx < 2900; hx += step) {
    if (hx + step < v[0] - 100 || hx > v[2] + 100) continue;
    const sag = 34 + 8 * sr(hx, 2);
    if (KIT('A22', 'stringLights')) {
      const r = A22.stringLights(ctx, { a: [hx, y], b: [hx + step, y], sag, n: 8, s: .9, t: lt, seed: 7 + Math.round(hx / step), glow: .45 });
      for (const L of (r && r.lights) || []) if (inView(L.x, L.y, v) && (n++ % 3 === 0)) addLight({ kind: 'point', x: L.x, y: L.y, r: 120, color: L.color, power: .4 * twinkle(lt, L.phase) });
      continue;
    }
    ctx.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16; ctx.lineTo(hx + u * step, y + sag * Math.sin(u * PI)); } ctx.stroke();
    for (let i = 1; i < 9; i++) {
      const u = i / 9, bx = hx + u * step, by = y + sag * Math.sin(u * PI) + 8, idx = Math.round((hx + 1300) / step) * 9 + i, col = BULB[idx % 6], ph = sr(idx, 9), tw = twinkle(lt, ph);
      bulb(bx, by, col, tw, 6);
      if (inView(bx, by, v) && (n++ % 3 === 0)) addLight({ kind: 'point', x: bx, y: by, r: 120, color: col, power: .4 * tw });
    }
  }
  ctx.restore();
}
/* THE wall clock over the door: 10:55 and the second hand sweeping (the match cut in: 300 px at zoom 2.14) */
function drawClock(lt) {
  const { x, y, r } = CLOCK, sec = 12 + lt, min = 55 + sec / 60, hr = 10 + min / 60;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(20,10,10,.32)'; ctx.beginPath(); ctx.arc(5, 8, r + 8, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(0, -r, 0, r, [[0, '#8a2a2a'], [1, '#5e1616']]); ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = rg(-r * .3, -r * .3, 4, r * 1.3, [[0, '#fffef8'], [1, '#ece4d2']]); ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a2530'; ctx.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; ctx.lineWidth = big ? 3.6 : 1.4; const r0 = big ? r - 15 : r - 9; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); ctx.lineTo(Math.sin(a) * (r - 5), -Math.cos(a) * (r - 5)); ctx.stroke(); }
  const hand = (a, len, wd, col) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(-Math.sin(a) * len * .16, Math.cos(a) * len * .16); ctx.lineTo(Math.sin(a) * len, -Math.cos(a) * len); ctx.stroke(); };
  hand(hr / 12 * TAU, r * .5, 7, '#1e1a24'); hand(min / 60 * TAU, r * .78, 5, '#1e1a24');
  const sa = Math.floor(sec) / 60 * TAU + (1 / 60 * TAU) * eb(c01((sec % 1) / .18));
  hand(sa, r * .84, 2.2, '#d22a3a');
  ctx.fillStyle = '#d22a3a'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
  ctx.restore();
  /* a sprig of holly on top */
  ctx.save(); ctx.translate(x - 8, y - r - 6); ctx.fillStyle = '#2e7d3c'; ctx.strokeStyle = INKC; ctx.lineWidth = 2;
  for (const sd of [-1, 1]) { ctx.save(); ctx.rotate(sd * .5); ctx.beginPath(); ctx.ellipse(sd * 18, -6, 20, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#d22a3a'; for (const [bx, by] of [[0, -8], [9, -4], [-7, -2]]) { ctx.beginPath(); ctx.arc(bx, by, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the door to the corridor: it bursts open on the door chime (hinged on its right edge, it swings into the room, toward us)
const doorAng = lt => { const t0 = CUE.doorchime - .04; if (lt < t0) return 0; const u = (lt - t0) / .2; return u < 1 ? 1.32 * eo(u) : 1.32 - .16 * Math.sin(Math.min(1, (u - 1) * .2 / .35) * PI) * Math.exp(-(u - 1) * .4); };
function drawCorridor(lt, th) {
  const { x0, x1, y0 } = DOOR, cx = (x0 + x1) / 2, f = .42;                        /* the far end of the corridor: a smaller rectangle inside the doorway */
  const fx0 = lerp(cx, x0, f), fx1 = lerp(cx, x1, f), fy0 = lerp(FLW - 260, y0, f), fy1 = lerp(FLW - 260, FLW, f);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, FLW - y0); ctx.clip();
  const q = (pts, fill) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  q([[x0, y0], [x1, y0], [fx1, fy0], [fx0, fy0]], '#c9cfd8');                                      /* ceiling */
  q([[x0, FLW], [x1, FLW], [fx1, fy1], [fx0, fy1]], lg(0, fy1, 0, FLW, [[0, '#9aa4ae'], [1, '#c6ccd2']]));   /* the polished floor */
  q([[x0, y0], [fx0, fy0], [fx0, fy1], [x0, FLW]], '#dfe3e6'); q([[x1, y0], [fx1, fy0], [fx1, fy1], [x1, FLW]], '#d2d8dc');
  q([[fx0, fy0], [fx1, fy0], [fx1, fy1], [fx0, fy1]], '#eef1f2');
  ctx.fillStyle = '#7a5a40'; ctx.fillRect(lerp(fx0, fx1, .35), lerp(fy0, fy1, .25), (fx1 - fx0) * .3, (fy1 - fy0) * .75);   /* a far door */
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(lerp(x0, fx0, .5) + 20, lerp(y0, fy0, .5) + 4, (x1 - x0) * .5, 8);  /* a ceiling tube */
  ctx.restore();
  addLight({ kind: 'rect', x: cx, y: (y0 + FLW) / 2, w: x1 - x0, h: FLW - y0, color: '#e8f0ff', power: .5 * c01(th / .5), facing: PI / 2, spill: 500 });
}
function drawDoor(lt) {
  const th = doorAng(lt), { x0, x1, y0 } = DOOR, w = x1 - x0;
  /* the frame */
  ctx.fillStyle = '#e6dac4'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.fillRect(x0 - 22, y0 - 22, w + 44, FLW - y0 + 22); ctx.strokeRect(x0 - 22, y0 - 22, w + 44, FLW - y0 + 22);
  if (th > .01) drawCorridor(lt, th); else { ctx.fillStyle = '#1a1418'; ctx.fillRect(x0, y0, w, FLW - y0); }
  const c = Math.cos(th), sn = Math.sin(th), xf = x1 - w * c, yt = y0 - 46 * sn, yb = FLW + 70 * sn;
  const P = (u, v) => [lerp(xf, x1, u), lerp(lerp(yt, y0, u), lerp(yb, FLW, u), v)];          /* a point of the panel: u across from the free edge to the hinge, v down */
  const quad = (u0, v0, u1, v1) => { const a = P(u0, v0), b = P(u1, v0), cc = P(u1, v1), d = P(u0, v1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(cc[0], cc[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
  ctx.save(); ctx.lineJoin = 'round';
  quad(0, 0, 1, 1); ctx.fillStyle = lg(xf, 0, x1, 0, th > .05 ? [[0, '#9a6a44'], [1, '#6a4428']] : [[0, '#8a5a38'], [1, '#7a4c2e']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  quad(.18, .1, .82, .38); ctx.fillStyle = th > .05 ? '#c8d4e4' : '#30384a'; ctx.fill(); ctx.strokeStyle = 'rgba(30,20,20,.7)'; ctx.lineWidth = 3; ctx.stroke();       /* the wired glass */
  ctx.save(); quad(.18, .1, .82, .38); ctx.clip(); ctx.strokeStyle = 'rgba(200,210,220,.4)'; ctx.lineWidth = 1.2; for (let i = 0; i < 8; i++) { const a = P(.18 + i * .08, .1), b = P(.18 + i * .08, .38); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } ctx.restore();
  quad(.06, .9, .94, .97); ctx.fillStyle = '#b8bcc4'; ctx.fill();                                    /* the kick plate */
  const hd = P(.08, .55); ctx.fillStyle = '#c8ccd4'; ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(hd[0], hd[1], 10 * Math.max(.3, c), 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
  /* the wreath on the door (A22.wreath when it lands): it turns with the panel */
  const wc = P(.5, .52), sx = Math.max(.15, c);
  ctx.save(); ctx.translate(wc[0], wc[1]); ctx.scale(sx, 1 + .1 * sn);
  if (KIT('A22', 'wreath')) A22.wreath(ctx, { x: 0, y: 0, s: .85, t: lt });
  else { ctx.lineWidth = 26; ctx.strokeStyle = '#1d5a2c'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.stroke(); ctx.lineWidth = 14; ctx.strokeStyle = '#2e7d3c'; ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#d22a3a'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 62, Math.sin(a) * 62, 7, 0, TAU); ctx.fill(); }
    ribbonBow(0, 58, .9, '#d22a3a'); }
  ctx.restore();
  return th;
}
// ------------------------------------------------------------------ the glove balloons from 6 PM, still bumping along the ceiling (A22.gloveBalloon when it lands)
const BALL = [[-860, 170, 1.05, '#7e57c2', 1], [-610, 120, 1.2, '#4a7ad8', 0], [-330, 196, .95, '#7e57c2', 1], [-60, 140, 1.15, '#7e57c2', 0], [190, 205, .92, '#4a7ad8', 1], [450, 118, 1.25, '#7e57c2', 1],
  [800, 188, 1.0, '#4a7ad8', 0], [1060, 132, 1.18, '#7e57c2', 1], [1330, 200, .95, '#7e57c2', 0], [1590, 126, 1.12, '#4a7ad8', 1], [1880, 182, 1.0, '#7e57c2', 1], [2150, 140, 1.1, '#4a7ad8', 0], [2440, 196, .96, '#7e57c2', 1]];
function gloveStand(x, y, s, rot, col, face) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const dk = shade(col, .55), lt2 = shade(col, 1.35);
  const fing = [[-34, -58, -.32, 46], [-12, -70, -.1, 54], [12, -70, .1, 54], [34, -58, .32, 46]];
  ctx.fillStyle = col; ctx.strokeStyle = '#2b1a4a'; ctx.lineWidth = 3;
  for (const [fx, fy, a, L] of fing) { ctx.save(); ctx.translate(fx, fy + 20); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -L * .45, 14, L * .55, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(-54, -4); ctx.rotate(-1.0); ctx.beginPath(); ctx.ellipse(0, -18, 15, 30, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();       /* the thumb */
  ctx.beginPath(); ctx.ellipse(0, 0, 50, 46, 0, 0, TAU); ctx.fill(); ctx.stroke();                                                                         /* the palm */
  ctx.fillStyle = lt2; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(-18, -16, 12, 20, -.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-14, 42); ctx.lineTo(14, 42); ctx.lineTo(9, 58); ctx.lineTo(-9, 58); ctx.closePath(); ctx.fill(); ctx.stroke();   /* the cuff, tied */
  ctx.beginPath(); ctx.arc(0, 62, 6, 0, TAU); ctx.fill(); ctx.stroke();
  if (face) { ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 3.2; ctx.fillStyle = '#1a1030'; ctx.beginPath(); ctx.arc(-14, -4, 3.6, 0, TAU); ctx.arc(14, -4, 3.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, 4, 16, .25 * PI, .75 * PI); ctx.stroke(); }
  ctx.restore();
}
function drawBalloons(lt) {
  const v = view(300);
  BALL.forEach(([x, y, s, col, face], i) => {
    if (x < v[0] || x > v[2]) return;
    const ph = i * 1.37, bx = x + 8 * Math.sin(lt * .31 + ph), by = y + 5 * Math.sin(lt * .53 + ph * 1.7) - 4 * Math.max(0, Math.sin(lt * .9 + ph)), rot = .07 * Math.sin(lt * .4 + ph) + (sr(i, 3) - .5) * .5;
    /* the curling ribbon string hangs from the knot */
    const kx = bx - Math.sin(rot) * 62 * s, ky = by + Math.cos(rot) * 62 * s, len = 170 + 90 * sr(i, 5);
    if (KIT('A22', 'gloveBalloon')) { A22.gloveBalloon(ctx, { x: bx, y: by, s: s * .72, rot, t: lt, puff: 1, face: !!face, color: col, side: i % 2 ? -1 : 1, string: len * .9, seed: i }); return; }
    ctx.save(); ctx.strokeStyle = ['#e8c45a', '#d22a3a', '#f0f0f0'][i % 3]; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(kx, ky);
    for (let j = 1; j <= 24; j++) { const u = j / 24; ctx.lineTo(kx + 10 * Math.sin(u * 14 + lt * .8 + ph) * u + 14 * Math.sin(lt * .5 + ph) * u * u, ky + u * len); } ctx.stroke(); ctx.restore();
    gloveStand(bx, by, s, rot, col, face);
  });
}

// ------------------------------------------------------------------ chairs (after ep20_forecast.js's day room, which drew the same residents): (x, y) = the sitter's body bottom, s = scale, fl = the floor; narrower wheels so seven seats fit the row
function chairBack(kind, x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(8,4,16,.38)'; ctx.beginPath(); ctx.ellipse(x, fl, (rxS + 50) * s, 22 * s, 0, 0, TAU); ctx.fill();
  if (kind === 'arm') {                                              /* an upholstered armchair: a tall tufted back */
    const top = y - (ryS * 2 + 64) * s, bw = (rxS + 30) * s;
    ctx.beginPath(); ctx.moveTo(x - bw, y + 24 * s); ctx.lineTo(x - bw, top + 60 * s); ctx.quadraticCurveTo(x - bw, top, x - bw + 60 * s, top); ctx.lineTo(x + bw - 60 * s, top); ctx.quadraticCurveTo(x + bw, top, x + bw, top + 60 * s); ctx.lineTo(x + bw, y + 24 * s); ctx.closePath();
    ctx.fillStyle = lg(0, top, 0, y, [[0, shade(col, 1.25)], [1, shade(col, .8)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke();
    ctx.fillStyle = shade(col, .6); for (const fx of [-.5, 0, .5]) for (const fy of [.3, .55]) { ctx.beginPath(); ctx.arc(x + fx * bw, lerp(top, y, fy), Math.max(2, 4.5 * s), 0, TAU); ctx.fill(); }
  } else {                                                           /* a wheelchair: a dark vinyl back, push handles, big wheels at the sides seen edge on */
    const bh = (ryS * 1.5 + 30) * s, tx = y - bh, hx = rxS * .8;
    for (const [c2, lw] of [['#1a1a22', 10], ['#8d96a4', 6]]) { ctx.strokeStyle = c2; ctx.lineWidth = Math.max(3, lw * s); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * hx * s, y - 30 * s); ctx.lineTo(x + sd * hx * s, tx - 30 * s); ctx.lineTo(x + sd * (hx + 26) * s, tx - 34 * s); ctx.stroke(); } }
    rr(x - hx * s, tx, hx * 2 * s, bh + 20 * s, 14 * s); ctx.fillStyle = lg(0, tx, 0, y, [[0, shade(col, 1.15)], [1, shade(col, .7)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke();
    for (const sd of [-1, 1]) { const wx = x + sd * (rxS + 14) * s, wy = (y + fl) / 2 - 10 * s, wr = (fl - y) * .5 + 60 * s;
      ctx.fillStyle = '#16181e'; ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.beginPath(); ctx.ellipse(wx, wy, 11 * s, wr, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c4cad6'; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.ellipse(wx + sd * 8 * s, wy, 3.5 * s, wr * .86, 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}
function chairFront(kind, x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; const aw = 36 * s;
  if (kind === 'arm') {
    for (const sd of [-1, 1]) { const ax = x + sd * (rxS + 26) * s; rr(ax - aw / 2, y - 112 * s, aw, 142 * s, 18 * s); ctx.fillStyle = lg(ax - aw / 2, 0, ax + aw / 2, 0, [[0, shade(col, 1.2)], [1, shade(col, .78)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke(); }
    rr(x - (rxS + 10) * s, y + 4 * s, (rxS + 10) * 2 * s, 40 * s, 14 * s); ctx.fillStyle = lg(0, y, 0, y + 44 * s, [[0, shade(col, 1.1)], [1, shade(col, .7)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.stroke();
    ctx.fillStyle = '#3a2418'; for (const sd of [-1, 1]) { rr(x + sd * (rxS - 6) * s - 9 * s, y + 42 * s, 18 * s, Math.max(6, fl - y - 40 * s), 4 * s); ctx.fill(); }
  } else {
    for (const sd of [-1, 1]) { const ax = x + sd * (rxS + 2) * s; rr(ax - 16 * s, y - 96 * s, 32 * s, 20 * s, 8 * s); ctx.fillStyle = '#2a2a33'; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.stroke();
      ctx.strokeStyle = '#8d96a4'; ctx.lineWidth = Math.max(3, 6 * s); ctx.beginPath(); ctx.moveTo(ax, y - 78 * s); ctx.lineTo(ax, y + 40 * s); ctx.lineTo(ax + sd * 6 * s, fl - 20 * s); ctx.stroke();
      ctx.fillStyle = '#16181e'; ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.beginPath(); ctx.ellipse(ax + sd * 8 * s, fl - 6 * s, 14 * s, 11 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
      rr(ax - 20 * s + sd * 4 * s, fl - 30 * s, 40 * s, 10 * s, 4 * s); ctx.fillStyle = '#3a3f4a'; ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
/* a knitted lap blanket over the knees */
function lapBlanket(x, y, s, rxS, col, pat) {
  ctx.save(); ctx.lineJoin = 'round'; const w = (rxS + 4) * s, ty = y - 34 * s;
  ctx.beginPath(); ctx.moveTo(x - w, ty); ctx.quadraticCurveTo(x, ty - 14 * s, x + w, ty); ctx.lineTo(x + w * 1.05, y + 50 * s); for (let i = 6; i >= 0; i--) ctx.lineTo(x - w * 1.05 + (i / 6) * w * 2.1, y + 50 * s + (i % 2 ? 9 : 0) * s); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.4 * s); ctx.stroke(); ctx.clip();
  ctx.strokeStyle = pat; ctx.lineWidth = Math.max(2, 6 * s); for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / 4, ty - 30 * s); ctx.lineTo(x + i * w / 4, y + 70 * s); ctx.stroke(); } for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.moveTo(x - w * 1.1, ty + 6 * s + j * 20 * s); ctx.lineTo(x + w * 1.1, ty + 6 * s + j * 20 * s); ctx.stroke(); }
  ctx.restore();
}
/* the big red bow the residents tied on the nurse's chair (A22.bow when it lands) */
function chairBow(x, y, s, lt) { if (KIT('A22', 'bow')) A22.bow(ctx, { x, y, s: s * .9, r: 60, t: lt, color: '#d22a3a' }); else ribbonBow(x, y, s * 1.25, '#d22a3a'); }

// ------------------------------------------------------------------ held props (prefix fp22c_): the song sheet, the pitch pipe, the spoon of applesauce, the CARE PLAN
EXT.prop.fp22c_sheet = (side, o, t) => {                                /* a song sheet: a red title bar, staves and notes */
  const S = o.sheetScale || 1;
  ctx.save(); ctx.rotate((o.sheetRot || 0) - .12); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-20, -52, 46, 60);
  ctx.fillStyle = '#fbf8ee'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-24, -56); ctx.lineTo(22, -58); ctx.lineTo(24, 2); ctx.lineTo(-22, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8263a'; ctx.fillRect(-19, -52, 38, 9);
  ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const y = -36 + i * 9; ctx.beginPath(); ctx.moveTo(-18, y); ctx.lineTo(19, y - .5); ctx.stroke(); }
  ctx.fillStyle = '#2a2236'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-13 + i * 6, -36 + ((i * 5) % 4) * 4.5, 2.4, 1.8, -.4, 0, TAU); ctx.fill(); }
  ctx.restore();
};
PROP_BOX.fp22c_sheet = Object.assign([-34, -70, 34, 14], { nearFace: true });
EXT.prop.fp22c_pipe = (side, o, t) => {                                 /* a round chromatic pitch pipe */
  const S = o.pipeScale || 1;
  ctx.save(); ctx.scale(S, S); ctx.fillStyle = rg(-3, -3, 1, 15, [[0, '#ffffff'], [.4, '#c8ccd6'], [1, '#7a8090']]); ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a2a36'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 9.5, Math.sin(a) * 9.5, 1.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#d22a3a'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
  ctx.restore();
};
PROP_BOX.fp22c_pipe = Object.assign([-18, -18, 18, 18], { nearFace: true });
EXT.prop.fp22c_spoon = (side, o, t) => {                                /* a spoon of applesauce; o.spoonPill 0..1 drops the pill into it */
  const S = o.spoonScale || 1, p = o.spoonPill ?? -1;
  ctx.save(); ctx.rotate(o.spoonRot || -.5); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#9aa2b0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -34); ctx.stroke();
  ctx.fillStyle = lg(-16, 0, 16, 0, [[0, '#e8ecf2'], [1, '#9aa2b0']]); ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -48, 15, 19, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2d98a'; ctx.beginPath(); ctx.ellipse(0, -51, 12, 11, 0, PI, 0); ctx.quadraticCurveTo(10, -44, 0, -42); ctx.quadraticCurveTo(-10, -44, -12, -51); ctx.fill(); ctx.strokeStyle = 'rgba(150,110,40,.6)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-4, -56, 3.5, 2, -.4, 0, TAU); ctx.fill();
  if (p >= 0) { const y = -62 - 70 * (1 - eb(c01(p))) , a = c01(p * 4); ctx.globalAlpha *= a; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(2, y, 7, 4.2, .3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(120,120,140,.7)'; ctx.beginPath(); ctx.moveTo(-1, y - 3); ctx.lineTo(5, y + 3); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp22c_spoon = Object.assign([-34, -112, 34, 14], { nearFace: true });
EXT.prop.fp22c_plan = (side, o, t) => {                                 /* the song sheet held up: it is a CARE PLAN (hero text when it is big on the screen) */
  const S = o.planScale || 1, hero = !!o.planHero;
  ctx.save(); ctx.rotate(o.planRot || -.06); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-58, -146, 120, 150);
  ctx.fillStyle = '#fbf8ee'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 3; rr(-62, -152, 124, 156, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8263a'; ctx.fillRect(-56, -146, 112, 34);
  ctx.strokeStyle = 'rgba(40,40,60,.45)'; ctx.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const y = -96 + i * 18; ctx.strokeRect(-50, y - 6, 9, 9); ctx.beginPath(); ctx.moveTo(-34, y); ctx.lineTo(48, y); ctx.stroke(); }
  ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { const y = -96 + i * 18; ctx.beginPath(); ctx.moveTo(-49, y - 1); ctx.lineTo(-46, y + 3); ctx.lineTo(-40, y - 6); ctx.stroke(); }
  UI.label('CARE PLAN', 0, -129, { size: 21, weight: 900, fill: '#ffffff', maxW: 104, hero, crop: !hero, tilt: .2 });
  ctx.restore();
};
PROP_BOX.fp22c_plan = Object.assign([-70, -160, 70, 10], { nearFace: true });

// ------------------------------------------------------------------ THE COUNT: each named thing pops in near the choir on its word, holds through its bar (never over a face: they sit above the hats)
const COUNT = [
  { line: 'c3', k: 3, kind: 'pudding', s: 1.8, col: '#ffd36a', pts: [[232, 655], [322, 445], [540, 352], [758, 445], [848, 655]], at: [wS('c3', 0), wS('c3', 1), wS('c3', 1) + .27, wS('c3', 2), wS('c3', 2) + .27] },
  { line: 'c4', k: 4, kind: 'blanket', s: 1.0, col: '#ffb070', pts: [[905, 700], [1100, 690], [1300, 700], [1495, 690]], at: [wS('c4', 0), wS('c4', 1), wS('c4', 2), wS('c4', 2) + .37] },
  { line: 'c5', k: 5, kind: 'bell', s: 1.0, col: '#ff6a5a', pts: [[-480, 690], [-140, 668], [200, 690]], at: [wS('c5', 0), wS('c5', 1), wS('c5', 2)] },
  { line: 'c6', k: 6, kind: 'socks', s: 1.0, col: '#ffe14a', pts: [[1390, 600]], at: [wS('c6', 0)] },
];
function puddingCup(x, y, s, lt) {
  if (KIT('A22', 'pudding')) { A22.pudding(ctx, { x, y, s, t: lt, anchor: 'centre' }); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(-26, 0, 26, 0, [[0, '#f6f2ea'], [1, '#d8d2c6']]); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(-28, -24); ctx.lineTo(28, -24); ctx.lineTo(22, 26); ctx.lineTo(-22, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.ellipse(0, -24, 28, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a6ad0'; ctx.fillRect(-24, -6, 48, 12);                       /* the label band */
  ctx.fillStyle = lg(0, -60, 0, -24, [[0, '#ffffff'], [1, '#b8bcc8']]); ctx.beginPath(); ctx.moveTo(18, -28); ctx.quadraticCurveTo(34, -52, 8, -62); ctx.quadraticCurveTo(-2, -46, 18, -28); ctx.fill(); ctx.stroke();   /* the foil lid, peeled back */
  ctx.restore();
}
function blanketItem(x, y, s, lt, i) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const col = ['#c8394a', '#3a7ad8', '#2e8a4a', '#e0a030'][i % 4];
  ctx.fillStyle = col; ctx.strokeStyle = INKC; ctx.lineWidth = 2.8; rr(-46, -22, 92, 46, 12); ctx.fill(); ctx.stroke();
  ctx.save(); rr(-46, -22, 92, 46, 12); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 5; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 16, -30); ctx.lineTo(k * 16, 30); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.stroke(); ctx.restore();
  ctx.fillStyle = shade(col, .75); rr(-46, 6, 92, 18, 9); ctx.fill(); ctx.stroke();       /* the folded edge */
  ctx.strokeStyle = 'rgba(255,170,90,.8)'; ctx.lineWidth = 3;                              /* warm: heat rising */
  for (let k = -1; k <= 1; k++) { ctx.beginPath(); for (let j = 0; j <= 10; j++) { const u = j / 10; ctx.lineTo(k * 22 + 5 * Math.sin(u * 9 + lt * 4 + k), -28 - u * 34); } ctx.stroke(); }
  ctx.restore();
}
function bellItem(x, y, s, lt, t0) {                                    /* a nurse call bell: the pendant with the big red button (a bell on it) and its cord; it rings when it lands */
  const ring = c01(1 - (lt - t0) / .9), wob = .12 * Math.sin((lt - t0) * 18) * ring;
  ctx.save(); ctx.translate(x, y); ctx.rotate(wob); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#d8d0bc'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 50); for (let j = 0; j <= 12; j++) ctx.lineTo(8 * Math.sin(j * 1.7), 50 + j * 6); ctx.stroke();
  ctx.fillStyle = lg(-24, 0, 24, 0, [[0, '#f2ecdc'], [1, '#cfc6b0']]); ctx.strokeStyle = INKC; ctx.lineWidth = 2.8; rr(-24, -54, 48, 106, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rg(-5, -24, 2, 20, [[0, '#ff8a7a'], [1, '#c8262a']]); ctx.beginPath(); ctx.arc(0, -20, 17, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff4e8'; ctx.beginPath(); ctx.moveTo(-8, -14); ctx.quadraticCurveTo(-8, -30, 0, -30); ctx.quadraticCurveTo(8, -30, 8, -14); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, -11, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#9a9488'; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(-9 + j * 9, 18, 3, 0, TAU); ctx.fill(); }
  if (ring > .02) { ctx.strokeStyle = `rgba(255,236,190,${.85 * ring})`; ctx.lineWidth = 3; for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) { const r = 34 + j * 14 + 10 * (1 - ring); ctx.beginPath(); ctx.arc(0, -20, r, sd < 0 ? PI - .5 : -.5, sd < 0 ? PI + .5 : .5); ctx.stroke(); } }
  ctx.restore();
}
function socksItem(x, y, s, lt) {                                     /* "two grippy socks": the pair, held up by the cuffs, kicking on the beat */
  const kick = .1 * Math.sin(lt * PI / BEAT);
  if (KIT('A22', 'gripSocks')) { A22.gripSocks(ctx, { x, y, s, t: lt, rot: .5 * kick }); return; }
  sockItem(x - 50 * s, y + 60 * s, s, lt, 0); sockItem(x + 50 * s, y + 60 * s, s, lt, 1);
}
function sockItem(x, y, s, lt, i) {
  const kick = .14 * Math.sin(lt * PI / BEAT + i * PI);              /* the sock kicks on the beat */
  ctx.save(); ctx.translate(x, y); ctx.rotate((i ? .2 : -.2) + kick); ctx.scale(i ? -s : s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-18, -54); ctx.lineTo(18, -54); ctx.lineTo(18, 14); ctx.quadraticCurveTo(20, 34, 44, 34); ctx.quadraticCurveTo(64, 36, 62, 52); ctx.quadraticCurveTo(58, 64, 36, 62); ctx.lineTo(-4, 62); ctx.quadraticCurveTo(-20, 60, -18, 40); ctx.closePath();
  ctx.fillStyle = '#ffd92a'; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.8; ctx.stroke();
  ctx.fillStyle = '#f4f0e0'; rr(-21, -60, 42, 16, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (const [dx, dy] of [[-6, 54], [6, 54], [18, 54], [30, 54], [42, 54], [0, 46], [12, 46], [24, 46], [36, 46], [-10, 30], [-10, 18]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.6, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function sparkles(x, y, r, lt, t0, col) {                              /* a little burst of four-point stars as a thing pops in */
  const u = (lt - t0) / .45; if (u < 0 || u > 1) return;
  ctx.save(); ctx.globalAlpha *= 1 - u; ctx.fillStyle = col;
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .4, d = r * (.6 + .9 * eo(u)), sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d, q = 9 * (1 - u * .5);
    ctx.beginPath(); ctx.moveTo(sx, sy - q); ctx.quadraticCurveTo(sx, sy, sx + q, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + q); ctx.quadraticCurveTo(sx, sy, sx - q, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - q); ctx.fill(); }
  ctx.restore();
}
function drawCount(lt) {
  for (const C of COUNT) {
    if (lt < C.at[0] - .05 || lt >= DB(C.k + 1) - .02) continue;
    C.pts.forEach(([x, y], i) => {
      const t0 = C.at[i], u = sg(lt, t0, t0 + .3), sc = eb(u) * C.s; if (sc < .02 * C.s) return;
      const bob = -5 * dipAt(lt) - 3 * Math.sin((lt - t0) * 2.2 + i);
      const gl = C.kind === 'pudding' ? .55 + .2 * ss(lt, C.at[4], C.at[4] + .6) : .3;
      glow(x, y + bob, (C.kind === 'pudding' ? 120 : 90) * C.s, C.col, gl * c01(u * 2), .35);
      if (C.kind === 'pudding') puddingCup(x, y + bob, sc, lt);
      else if (C.kind === 'blanket') blanketItem(x, y + bob, sc, lt, i);
      else if (C.kind === 'bell') bellItem(x, y + bob, sc, lt, t0);
      else socksItem(x, y + bob, sc, lt);
      sparkles(x, y + bob, 60 * C.s, lt, t0, C.kind === 'pudding' ? '#fff2b0' : '#ffffff');
      if (C.kind === 'pudding') addLight({ kind: 'point', x, y, r: 200, color: '#ffd77a', power: .5 * c01(u * 2) });
    });
  }
}

// ------------------------------------------------------------------ the cast of a frame
/* a Santa hat on any cast member: A22.santaHat when it lands (called right after the constructor, like A20.winter), else the engine's own 'santa' hat */
const C7B = snapT(DB(7) + 2 * BEAT);                                        /* beat 3 of the c7 bar: the finale cut, Apple wakes on it */
function hat(o, flop) {
  if (KIT('A22', 'santaHat')) return A22.santaHat(o, { hatFlop: flop }) || o;
  o.acc = (o.acc || []).filter(a => !['newsboy', 'nightcap', 'curlers', 'wolfears', 'partyhat', 'partyhat10'].includes(a)).concat(['santa']);
  return o;
}
/* Pear conducts: 4/4, the ictus of each beat at a point (local px of his body, screen space), a rebound between them; the left hand mirrors it smaller */
const ICT = [[128, 14], [92, -8], [168, -8], [130, -76]];
function conduct(lt) {
  const b = beatsAt(lt), i = Math.floor(b), u = b - i, P = ICT[((i % 4) + 4) % 4], Q = ICT[(((i + 1) % 4) + 4) % 4];
  const x = lerp(P[0], Q[0], ss(u, 0, 1)), y = lerp(P[1], Q[1], u * u) - 26 * Math.sin(PI * u) * (1 - .4 * u);
  return [x, y];
}
function pearArms(o, lt) {
  const prep = ss(lt, DB(0) + 2 * BEAT - .12, DB(0) + 2 * BEAT + .2), up = ss(lt, DB(0) + 3 * BEAT - .1, DB(0) + 3 * BEAT + .15) * (1 - ss(lt, DB(1) - .12, DB(1)));
  const cut = le('c7'), on = lt >= DB(1) - .12 && lt < cut + .1, done = ss(lt, cut + .1, cut + .7);
  o.arms = { l: 'rest', r: 'rest' }; o.hand = {};
  if (lt >= wS('pe1', 4) - .1 && lt < ls('s1') + 1.0) { const k = ss(lt, wS('pe1', 4) - .1, wS('pe1', 4) + .2) * (1 - ss(lt, ls('s1') + .7, ls('s1') + 1.0)); if (k > .02) { o.arms.r = 'point'; o.armScale = 1.12; } }
  if (prep > 0 && !on && lt < cut) {                                          /* intro beat 3: both hands rise, beat 4: the upbeat */
    o.arms = { l: 'hold', r: 'hold' }; o.grip = { r: [lerp(110, 140, prep), lerp(60, -56, prep) - 30 * up], l: [lerp(-110, -134, prep), lerp(60, -50, prep) - 24 * up] }; o.hand = { r: 'point', l: 'open' };
  }
  if (on) {
    const [x, y] = conduct(lt), big = Math.max(ss(lt, DB(3) - .1, DB(3) + .3) * (1 - ss(lt, DB(4) - .3, DB(4))), ss(lt, DB(7) + 2 * BEAT - .1, DB(7) + 2 * BEAT + .15));
    o.arms = { l: 'hold', r: 'hold' }; o.hand = { r: 'point', l: 'open' };
    o.grip = { r: [x, y - 24 * big], l: [lerp(-x * .82, -138, big), lerp(y * .7 - 12, -92, big)] };
    const nu = ss(lt, wS('c2', 1) - .12, wS('c2', 1) + .1) * (1 - ss(lt, wE('c2', 1) + .35, wE('c2', 1) + .6));
    if (nu > .02) { o.arms.r = 'point'; delete o.grip.r; o.hand.r = 'point'; }                     /* "my NURSE": the baton hand points at her */
    if (lt >= DB(7) - .05 && lt < cut + .1) {                                   /* c7: the spoon of applesauce held up in the right hand, the left keeps the beat */
      const hold = ss(lt, DB(7) - .05, DB(7) + .2);
      o.hold = { r: 'fp22c_spoon' }; o.spoonScale = 1.35; o.spoonRot = -.25; o.spoonPill = lt >= wS('c7', 2) - .3 ? sg(lt, wS('c7', 2) - .3, wS('c7', 2) + .05) : -1;
      o.grip.r = [lerp(x, 142, hold), lerp(y, -60, hold) - 34 * big]; o.hand.r = 'grip';
      if (lt > cut - .05) o.grip.r = [142, -94];
    }
  }
  if (done > 0 && lt < ls('pe2') - .3) {                                       /* the cutoff: a small loop, then the hands settle */
    const k = 1 - done; o.arms = { l: 'hold', r: 'hold' }; o.hand = { r: 'fist', l: 'fist' };
    o.grip = { r: [lerp(110, 140, k), lerp(60, -94, k)], l: [lerp(-110, -136, k), lerp(60, -90, k)] };
    if (done >= 1) { o.arms = { l: 'rest', r: 'rest' }; o.hand = {}; }
  }
  if (lt >= ls('pe2') - .3 && lt < le('pe2') + .6) {                          /* "It's a care plan.": the song sheet held up beside his face */
    const k = ss(lt, ls('pe2') - .3, ls('pe2') + .05) * (1 - ss(lt, le('pe2') + .2, le('pe2') + .6));
    o.arms = { l: 'rest', r: 'hold' }; o.hand = { r: 'grip' }; o.hold = { r: 'fp22c_plan' }; o.planScale = .95; o.planRot = lerp(.3, -.05, k); o.planHero = k > .9;
    o.grip = { r: [lerp(96, 150, k), lerp(70, -30, k)] };
  }
}
/* one resident: the options for drawChar, and the chair, blanket and sheet around it */
function resOpts(S, lt) {
  const sing = S.sing ? singing(lt) : (S.id === 'apple' && lt >= C7B && lt < le('c7') + .02);
  const ck = carolK(lt), sway = ck * swayAt(lt), dip = ck * dipAt(lt), breath = ss(lt, DB(0) + 3 * BEAT - .12, DB(0) + 3 * BEAT + .1) * (1 - ss(lt, DB(1) - .1, DB(1) + .05));
  let o = CTOR[S.id]({ t: lt, seed: S.n * 13 });
  o = hat(o, .45 + .15 * (S.n % 3));
  const toward = S.x < STR.x ? 1 : -1, rx = KINDS[o.kind].rx, sh = S.sheet;
  Object.assign(o, { x: S.x + 3 * S.s * sway, y: seatYOf(S.s) + 6 * S.s * dip, s: S.s, t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true,
    yaw: S.yaw, headYaw: S.yaw * 1.15 + .05 * sway, rot: .03 * sway, look: [.55 * toward, .05], expr: 'happy', lid: .18, who: sing ? 'rall' : undefined,
    arms: { l: sh === 'l' ? 'hold' : 'rest', r: sh === 'r' ? 'hold' : 'rest' }, hold: sh ? { [sh]: 'fp22c_sheet' } : {}, grip: sh ? { [sh]: [(sh === 'l' ? -1 : 1) * rx * .95, 72] } : {}, sheetScale: 1.45, sheetRot: (sh === 'l' ? -1 : 1) * .12, browUp: 8 * breath });
  if (breath > .05 && S.sing) o.talk = .45 * breath;
  if (S.id === 'cran') {                                                        /* the pitch pipe: up to her mouth for the intro's first beat */
    const k = ss(lt, CUE.pitchpipe - .32, CUE.pitchpipe - .06) * (1 - ss(lt, CUE.pitchpipe + .5, CUE.pitchpipe + .85));
    if (k > .02) { const kk = KINDS.cran; o.arms.r = 'hold'; o.hold = Object.assign({}, o.hold, { r: 'fp22c_pipe' }); o.pipeScale = 1.2; o.grip = Object.assign({}, o.grip, { r: [lerp(110, 26, k), lerp(70, kk.mouthY + 4, k)] }); o.hand = { r: 'grip' };
      if (lt >= CUE.pitchpipe - .04 && lt < CUE.pitchpipe + .5) { o.lid = .85; o.face = { curve: .02 }; } }
  }
  if (S.id === 'pear') { o.yaw = .16; o.headYaw = lt >= DB(1) - .2 && lt < le('c7') ? .16 + .28 * Math.sin((lt - DB(1)) * PI / BAR) : .34; o.look = [.4, .02]; o.hold = {}; pearArms(o, lt); o.who = sing ? 'rall' : (inLine(lt, 'pe1') ? 'pear' : inLine(lt, 'pe2') ? 'pear' : undefined); if (inLine(lt, 'pe2', .3, .5)) { o.expr = 'smug'; o.look = [.7, .05]; } }
  if (S.id === 'apple') {                                                       /* asleep through the whole carol; she wakes on "applesauce!" and sings the last word */
    const wake = C7B, awake = ss(lt, wake - .03, wake + .12);
    if (awake < .5) { o.expr = 'sleep'; o.shut = 1; o.shutStyle = 'sleep'; o.acc = (o.acc || []).concat(['fp13_shut']); o.rot = -.07 + .01 * Math.sin(lt * 1.4); o.headYaw = -.1; o.look = [0, .3]; o.hold = { l: 'fp22c_sheet' }; o.sheetRot = .6; }
    else { o.expr = lt < wake + .5 ? 'shock' : 'happy'; o.look = [-.5, 0]; if (lt < le('c7') + .5) { o.arms = { l: 'cheer', r: 'cheer' }; o.hold = {}; } }
  }
  if (S.sheet && S.id !== 'apple' && lt >= wS('c2', 1) - .15 && lt < le('c2') + .15) {                       /* "my NURSE": the song sheets swing toward her */
    const k = ss(lt, wS('c2', 1) - .15, wS('c2', 1) + .12) * (1 - ss(lt, le('c2') - .1, le('c2') + .15)), sd = S.sheet === 'l' ? -1 : 1;
    o.grip[S.sheet] = [sd * lerp(rx * .95, rx * 1.12, k), lerp(72, -18, k)]; o.sheetRot = sd * lerp(.12, -.3, k);
  }
  if (S.id === 'banana' && lt >= DB(7) + 2 * BEAT - .05 && lt < le('c7') + .4) { o.arms = { l: 'cheer', r: 'cheer' }; o.hold = {}; }
  if (lt >= ls('mo1') - .1) { o.look = [toward * .1, -.85]; o.headYaw = S.yaw * .6; }      /* everyone looks up at the Moon */
  return o;
}
function drawRes(S, lt) {
  const o = resOpts(S, lt), k = KINDS[o.kind], y = o.y, s = S.s;
  chairBack('wheel', S.x, y, s, S.col, k.ry, k.rx, FL);
  drawChar(o);
  lapBlanket(S.x, y, s, k.rx, S.blank[0], S.blank[1]);
  chairFront('wheel', S.x, y, s, S.col, k.ry, k.rx, FL);
  if (S.id === 'apple' && o.expr === 'sleep') zzz(S.x + 60 * s, y - (k.ry * 1.6 + 120) * s, lt);
  return o;
}
function zzz(x, y, lt) {                                                       /* snores: three little Z strokes drifting up (drawn, not text) */
  ctx.save(); ctx.strokeStyle = 'rgba(240,236,255,.85)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) { const u = ((lt * .45 + i / 3) % 1), zx = x + 30 * u + 8 * Math.sin(u * 6 + i), zy = y - 90 * u, r = 8 + 10 * u; ctx.globalAlpha = Math.sin(u * PI) * .9; ctx.lineWidth = 3 + 2 * u;
    ctx.beginPath(); ctx.moveTo(zx - r, zy - r); ctx.lineTo(zx + r, zy - r); ctx.lineTo(zx - r, zy + r); ctx.lineTo(zx + r, zy + r); ctx.stroke(); }
  ctx.restore();
}
/* Strawberry: standing at her chair, she sits on "to." (finally); the call bells pull her half up by reflex; the smallest smile at the end */
const SIT0 = wS('s1', 3) - .25, SIT1 = wS('s1', 3) + .2;
const RX = snapT(DB(5) + 2 * BEAT);
function strawOpts(lt) {
  const sit = ss(lt, SIT0, SIT1), seated = lt >= SIT1 - .06, s = STR.s, kk = KINDS.straw, seat = seatYOf(s);
  const o = (window.A11 ? A11.straw : A7.straw)({ t: lt });
  const crouch = seated ? 0 : sit, feet = FL + 16 + 14 * crouch;
  const land = seated ? Math.exp(-(lt - SIT1) * 9) * Math.sin((lt - SIT1) * 26) : 0;
  const reflex = ss(lt, RX + .02, RX + .2) * (1 - ss(lt, RX + .62, RX + .95));
  Object.assign(o, { x: STR.x, s, t: lt, who: inLine(lt, 's1') || inLine(lt, 's2') || inLine(lt, 's3') ? 'straw' : undefined, plant: true, noShadow: seated, noReflect: true, noLegs: seated,
    y: seated ? seat - 16 * reflex : feet, squash: seated ? .05 * land : .03 * crouch, expr: 'dead', lid: .45, yaw: 0, headYaw: 0, look: [0, .05], arms: { l: 'rest', r: 'rest' } });
  if (!seated) { o.headYaw = lerp(-.25, -.5, ss(lt, ls('s1') + .1, ls('s1') + .4)); o.look = [-.7, .2]; if (lt < ls('s1')) { o.headYaw = -.35; o.look = [-.8, .05]; o.lid = .5; } }
  else {
    const cs = lt - DB(1);
    o.look = lt < DB(1) ? [-.5, .05] : [.45 * Math.sin(cs * .9), .02];
    if (lt >= DB(3) && lt < DB(4)) { o.look = [0, -.75]; o.expr = 'neutral'; o.lid = .3; o.browUp = 6; }                    /* the pudding cups over her head */
    if (lt >= wS('c2', 1) - .1 && lt < le('c2') + .2) { o.look = [-.6, .05]; o.expr = 'neutral'; }
    if (reflex > .02) { o.expr = 'shock'; o.lid = .05; o.look = [-.3, -.1]; o.arms = { l: 'rest', r: 'reach' }; }
    if (lt >= DB(7) && lt < le('c7') + .3) { o.look = [-.6, -.1]; o.expr = 'neutral'; }
    if (lt >= ls('s2') - .1) { o.expr = 'neutral'; o.lid = .38; o.look = [-.15, .05]; o.sparkle = true; o.face = { curve: .03 }; }
    if (lt >= ls('eg1') - .4 && lt < ls('s3') - .05) { o.look = [.9, -.05]; o.headYaw = .45; o.expr = 'shock'; o.lid = .1; }
    if (lt >= ls('s3') - .05) { o.expr = 'neutral'; o.lid = .32; o.look = [.35, 0]; o.headYaw = .2; o.face = { curve: .06 + .1 * ss(lt, wS('s3', 2), wE('s3', 2) + .3) }; o.sparkle = true; }
    if (lt >= ls('mo1') - .1) { o.look = [0, -.9]; o.headYaw = 0; }
  }
  return o;
}
function drawStraw(lt, part) {
  const s = STR.s, kk = KINDS.straw, seat = seatYOf(s), col = '#6a5a8a';
  if (part === 'back') { chairBack('arm', STR.x, seat, s, col, kk.ry, kk.rx, FL); chairBow(STR.x - 104 * s, seat - (kk.ry * 2 + 40) * s, s, lt); return; }
  if (part === 'front') { chairFront('arm', STR.x, seat, s, col, kk.ry, kk.rx, FL); return; }
}
/* Eggplant bursts in at the door on the chime, snow on her hat and shoulders: "I'm here! On time!" (she points up at the clock) */
function eggOpts(lt) {
  if (lt < CUE.doorchime - .02 || !window.A20 || typeof A20.eggplant !== 'function') return null;
  const u = ss(lt, CUE.doorchime + .04, CUE.doorchime + .62), x = lerp(2120, 2070, u), y = lerp(FLW + 8, FL + 30, u), s = lerp(.98, 1.08, u);
  const o = A20.eggplant({ t: lt, pose: 'rest', expr: lt < wS('eg1', 2) - .1 ? 'egg_calm' : 'egg_cosy', gear: { snow: .9, wind: .2 * (1 - u) } });
  Object.assign(o, { x, y, s, plant: true, who: 'egg', look: [-.5, .02], yaw: lerp(-.1, -.3, u), headYaw: -.3, arms: { l: 'rest', r: 'rest' } });
  if (u > 0 && u < 1) { o.gait = (2120 - x) * 3 / s; o.dir = -1; o.stride = 30; }
  if (lt >= wS('eg1', 1) - .15 && lt < wS('eg1', 2) - .05) { o.arms = { l: 'cheer', r: 'cheer' }; }
  if (lt >= wS('eg1', 2) - .05) { const k = ss(lt, wS('eg1', 2) - .05, wS('eg1', 2) + .2); o.arms = { l: 'rest', r: 'hold' }; o.hand = { r: 'point' }; o.grip = { r: [lerp(80, 110, k), lerp(40, -86, k)] }; o.look = [.3, -.8]; o.headYaw = .1; }
  if (lt >= ls('s3') - .1) { o.look = [-.8, .05]; o.headYaw = -.35; o.arms = { l: 'rest', r: 'rest' }; o.hand = {}; }
  return o;
}

// ------------------------------------------------------------------ the shots (scene-local starts, snapped to frames; a boundary frame is the NEW shot). k: 'clock' the match cut in, 'face' a face framed by faceC,
// 'pt' a point (x, y: values or [from, to] eased over the shot), 'end' the warm wide that pushes into the window. dof: px of soft focus for the room and every character that is not speaking and not the subject.
const ROW = ['pear', 'straw', 'apple', 'moon'];                            /* the centre: Pear, Strawberry, Apple and the Moon in the window above her */
const SH = [
  { id: 'open', s: 0, k: 'clock', show: [] },
  { id: 'pe1', s: 1.20, k: 'pt', x: 380, y: [960, 970], z: [1.4, 1.44], show: ['pear', 'straw', 'moon'] },
  { id: 's1', s: 2.80, k: 'pt', x: 540, y: [1000, 1010], z: [1.5, 1.54], dof: 6, show: ['straw'] },
  { id: 'pp', s: DB(0), k: 'face', foc: 'cran', z: [1.6, 1.66], up: -60, dx: 0, dof: 6, show: ['cran'] },
  { id: 'up', s: DB(0) + 2 * BEAT, k: 'pt', x: 546, y: 950, z: [1.04, 1.07], show: ROW },
  { id: 'c1', s: DB(1), k: 'pt', x: [-118, -108], y: 950, z: [1.1, 1.12], show: ['banana', 'cran', 'pear'] },
  { id: 'c2', s: DB(2), k: 'pt', x: [546, 540], y: [950, 975], z: [1.06, 1.2], show: ROW },
  { id: 'c3', s: DB(3), k: 'pt', x: 546, y: [1000, 930], z: [1.0, 1.06], show: ROW },
  { id: 'c4', s: DB(4), k: 'pt', x: [1210, 1240], y: 950, z: [1.1, 1.13], show: ['apple', 'goji', 'lime'] },
  { id: 'c5', s: DB(5), k: 'pt', x: [-108, -118], y: 950, z: [1.1, 1.12], show: ['banana', 'cran', 'pear'] },
  { id: 'rx', s: RX, k: 'pt', x: 620, y: [975, 985], z: [1.6, 1.64], dof: 6, show: ['straw'] },
  { id: 'c6', s: DB(6), k: 'pt', x: [1410, 1418], y: 960, z: [1.25, 1.28], show: ['goji', 'lime'] },
  { id: 'c7a', s: DB(7), k: 'pt', x: 370, y: 970, z: [1.35, 1.38], show: ['pear', 'straw', 'moon'] },
  { id: 'c7b', s: C7B, k: 'pt', x: 546, y: [950, 940], z: [1.07, 1.09], show: ROW },
  { id: 's2', s: DB(8), k: 'pt', x: 540, y: [1010, 1020], z: [1.5, 1.55], dof: 6, show: ['straw'] },
  { id: 'pe2', s: ls('pe2'), k: 'pt', x: 348, y: 1000, z: [1.55, 1.58], show: ['pear', 'straw', 'moon'] },
  { id: 'eg1', s: CUE.doorchime, k: 'pt', x: 2150, y: [1000, 1010], z: [1.2, 1.24], show: ['egg'] },
  { id: 's3', s: ls('s3'), k: 'pt', x: 540, y: [1020, 1030], z: [1.55, 1.62], dof: 6, show: ['straw'] },
  { id: 'mo1', s: 26.33, k: 'pt', x: 540, y: [880, 860], z: [1.16, 1.22], show: ROW },
  { id: 'end', s: bS('end'), k: 'end', show: ROW },
];
for (const sh of SH) sh.s = sh.s === 0 ? 0 : snapT(sh.s);
SH.forEach((sh, i) => { sh.e = i + 1 < SH.length ? SH[i + 1].s : DUR; });
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const MZ = 1 / MOON.s, MCY = MOON.y + 200 / MZ;                          /* the match cut out: the Moon 300 px across, centred at (540, 760) */
const END_IN = snapT(bS('end') + .02), END_HOLD = snapT(DUR - .45);
const OPEN_Z = 300 / (2 * CLOCK.r);
let FR = null;
function camC(lt) {
  const sh = shotAt(lt), C = { res: {} };
  for (const S of SEATS) C.res[S.id] = resOpts(S, lt);
  C.straw = strawOpts(lt); C.egg = eggOpts(lt);
  const u = c01((lt - sh.s) / Math.max(.1, sh.e - sh.s)), ev = (v, e = easeIO) => Array.isArray(v) ? lerp(v[0], v[1], e(u)) : v;
  let still = false;
  if (sh.k === 'clock') {                                                    /* still for .5 s, then a slow pull back from the clock to the door and its wreath */
    const k = ss(lt, .5, 1.6), z = lerp(OPEN_Z, 1.78, k);
    zoomTo(CLOCK.x, lerp(CLOCK.y - 20 / OPEN_Z, 640, k), z); still = lt < .55;
  } else if (sh.k === 'end') {                                               /* the warm wide, then a slow push into the window; still for the last .45 s */
    const k = ss(lt, END_IN, END_HOLD), z = lerp(.7, MZ, k);
    zoomTo(540, lerp(980, MCY, k), z); still = lt >= END_HOLD - .02;
  } else if (sh.k === 'face') {
    const o = sh.foc === 'straw' ? C.straw : C.res[sh.foc], z = lerp(sh.z[0], sh.z[1], easeIO(u)), [fx, fy] = faceC(o);
    zoomTo(fx - (sh.dx || 0) / z, fy + sh.up / z, z);
  } else zoomTo(ev(sh.x), ev(sh.y), lerp(sh.z[0], sh.z[1], easeIO(u)));
  if (!still) { const w = c01(lt / .9) * c01((DUR - lt - .5) / .5); CAM.x += 1.8 * hn(lt, 1.2, 4) * w; CAM.y += 1.3 * hn(lt, 1.0, 5) * w; CAM.r += .0009 * hn(lt, .8, 6) * w; }
  FR = { C, sh };
}
// ------------------------------------------------------------------ one frame
function roomDraw(lt) {
  drawCeiling(lt); drawWall(lt); drawFloor(lt);
  drawBalloons(lt); drawStringLights(lt);
  drawWindow(lt); drawDrapes(lt);
  drawTree(lt); drawLamp(30, lt, 1); drawLamp(1050, lt, 2); drawLamp(1820, lt, 3, 640);
  drawStockings(lt); drawDoor(lt); drawClock(lt);
}
const speaking = o => !!o && !!o.who && TLX.lines.some(l => l.scene === 'carol' && l.who === o.who && (START + FR.lt) >= l.s - .1 && (START + FR.lt) < l.e + .1);
function drawC(lt) {
  const { C, sh } = FR; FR.lt = lt;
  LIGHTS = [];
  V2.setLight({ key: [-.35, -.55], keyColor: '#ffd9a0', keyA: .28, rim: '#9fc4ff', rimA: .32, shadow: '#1a1230', shadowA: .36, bounce: '#ffb870', bounceA: .2, amb: '#6a5a90', ambA: .1, frontDark: .04 }); V2.opts.reflect = false;
  /* who is audited (the shot's show list: framed whole), who is soft (dof shots: anyone not speaking and not framed), and the rest: sharp, drawn, not held to the layout audit (a neighbour at the edge) */
  const mode = id => sh.show.includes(id) ? 'aud' : (sh.dof && !speaking(id === 'straw' ? C.straw : C.res[id])) ? 'soft' : 'bg';
  const all = SEATS.map(S => [S.id, S.x]).concat([['straw', STR.x]]).sort((a, b) => a[1] - b[1]);
  const drawOne = id => { const bg = mode(id) !== 'aud'; if (bg) REG.suppress++; if (id === 'straw') { drawStraw(lt, 'back'); drawChar(C.straw); drawStraw(lt, 'front'); } else drawRes(SEAT[id], lt); if (bg) REG.suppress--; };
  FR.moonAud = sh.show.includes('moon');
  if (sh.dof) V2.dof(sh.dof, () => { REG.suppress++; roomDraw(lt); for (const [id] of all) if (mode(id) === 'soft') drawOne(id); REG.suppress--; });
  else roomDraw(lt);
  for (const [id] of all) if (mode(id) !== 'soft') drawOne(id);
  if (C.egg) { const bg = !sh.show.includes('egg'); if (bg) REG.suppress++; drawChar(C.egg); if (bg) REG.suppress--; }
  drawCount(lt);
  /* the light: a lamp-lit night room (never a dark one), the tree and the string lights glowing, the window cool */
  if (KIT('L20', 'pass')) L20.pass(ctx, { ambient: .64, tint: '#151a3c', lights: LIGHTS, bloom: .5, vignette: .24, lift: .1, t: lt, glow: .3 });
}
const CAROLSC = {
  shot: lt => shotAt(lt).id,
  cam: camC,
  draw: drawC,
  fx: lt => ({ bloom: .5 + .22 * ss(lt, CUE.sting - .05, CUE.sting + .35) * (1 - ss(lt, CUE.sting + .9, CUE.sting + 1.6)), vignette: .34, grain: .04, contrast: .07, sat: .1, tint: [['#ffb87a', .05, 'soft-light']] }),
  blur: lt => 1,
  over() {},
  clock: () => SCN.clock, label: () => SCN.label,
  capBall: CAROL.slice(),
};
window.__EP22_SCENES = window.__EP22_SCENES || {}; window.__EP22_SCENES.carol = CAROLSC;

/*@@END@@*/
})();
