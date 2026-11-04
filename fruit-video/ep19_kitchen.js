'use strict';
/* SHIFT HAPPENS, Episode 19: "The Potluck". Scene `kitchen` (5:00 PM, THE KITCHEN, 42.8 s). Builder E19-KITCHEN. Registers window.__EP19_SCENES.kitchen.
 *
 * Dietary, a stainless kitchen seen in a flat frontal elevation (units = pixels at zoom 1; every shot is a camera, zoomTo, plus the cast placed at their stations; the background is dimmed by V2.dof in close-ups).
 * ONE long counter runs left to right: the diet board and Chef Cabbage (x 60..900), the TEXTURE LINE (a conveyor with five stations, X1..X5), the end tray (X6), the prep counter with the coffee (x 4300..5500),
 * the service window to the corridor (x 5900..6900). Characters stand behind the counter (body bottoms hidden: noLegs), so a cut moves the camera along it.
 *
 * Shots (scene-local s; the lines are frozen, python3 /tmp/shift_tools/scene_info.py 19 kitchen):
 *  open 0-1.40 wide, clatter .4 and .9 | c1a 1.40-3.20 Chef MCU "Thanksgiving." | c1b 3.20-5.56 the diet board lights row by row, Chef at its edge | m1 5.56-6.74 Mango CU | c2a 6.74-8.30 the turkey on the pass, golden |
 *  c2b 8.30-10.08 Chef MCU "Six textures.", the knife goes down, the line starts | carve 10.08-13.53 ONE tracking shot along the texture line: carve 10.276, chop 11.076, mince, blender 11.676, moldpress 13.076 |
 *  s1 13.53-14.49 Strawberry CU | c3 14.49-17.28 Chef presents the beige turkey | pr1 17.28-18.23 the coffee pours (pourcoffee 17.284) | pr2 18.23-19.90 nectar, honey (glop 18.534, 19.134) |
 *  pr3 19.90-20.98 pudding (glop 19.734) | s2 20.98-21.88 Strawberry turns the cup over | c5 21.88-24.50 Chef CU, held | w1 24.50-26.58 the service window: the bell (doorbell 24.580), Pineapple |
 *  s3 26.58-27.70 | p2 27.70-29.03 | s4 29.03-30.58 she takes the pie | sm1 30.58-32.00 the pie in the blender (blender 30.577) | sm2 32.00-33.03 the mold is pressed (moldpress 32.477) |
 *  c6 33.03-34.71 | p3 34.71-36.37 | c7 36.37-38.52 the two-shot, held | p4 38.52-39.50 | c8 39.50-41.34 the plate, close | end 41.34-42.80 the hold (sting 41.445).
 */
(() => {
if (!window.TIMELINE_EP19 || !window.H6 || !window.V2 || !window.UI || !window.A7 || !window.A19) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A11 = window.A11 || window.A7, A19 = window.A19;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP19, SCN = TLX.scenes.find(s => s.id === 'kitchen'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'kitchen') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const scrOf = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };   /* the zoom now: text is hero when it comes out at 31 px or more on the screen */
const OUTL = 'rgba(28,20,14,.78)';
const mixc = (a, b, k) => 'rgb(' + V2.mix(a, b, k).map(v => Math.round(v)).join(',') + ')';

/* the sound cues (scene-local seconds from script_ep19.json: python3 /tmp/shift_tools/cues.py 19 kitchen), snapped to the video frame nearest each: the picture hits on the same frame */
const CUE = { clatter1: .4, clatter2: .9, carve: 10.276, chop: 11.076, blender1: 11.676, mold1: 13.076, pour: 17.284, glop1: 18.534, glop2: 19.134, glop3: 19.734, bell: 24.58, blender2: 30.577, mold2: 32.477, sting: 41.445 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);

// ------------------------------------------------------------------ geometry of the kitchen (world units; y runs down)
const CT = 1040, FY = 1330;                       /* the counter's top edge and the floor */
const BODY_Y = CT + 26;                           /* body bottoms of characters standing behind the counter (noLegs) */
const BOARD = { x: 60, y: 380, w: 500, h: 470 }; /* the diet board */
const HOME = { chef: 650, mango: 1120, tk: 890 };   /* the open: Chef, the turkey under its cloche, Mango (s .9) */
const LINE = { x0: 760, X1: 1700, X2: 2140, X3: 2470, X4: 2800, X5: 3360, x1: 4120, row: 3790 };   /* the belt, the five stations, the end belt and the row of samples */
const PX = 5200;                                    /* the THICK-IT dispenser: three spouts at PX - 210, PX, PX + 210; the prep counter runs x 4500..5900 */
const PREP = { x0: 4500, x1: 5900 };
const WIN = { x: 6340, y: 560, w: 560, h: 450, cx: 6620 };   /* the service window (opening): x 6340..6900, y 560..1010 */
const DIETS = [['REGULAR', 9], ['MECHANICAL SOFT', 11], ['MINCED', 7], ['PUREE', 8], ['THICKENED', 4], ['NPO', 1]];   /* 40 residents */

// ------------------------------------------------------------------ the food: F19 when the dish exists, a stand-in of mine when it does not (same anchor convention: x, y = the bottom centre, s = 1 is about 300 px wide)
const hasF = k => !!(window.F19 && typeof F19.dish === 'function' && (!F19.kinds || F19.kinds[k]));
const BEIGE = '#d9c7a3', BEIGE_D = '#c4ad84', BEIGE_L = '#ece0c6';
function ink(c, lw = 3, col = OUTL) { c.lineWidth = lw; c.strokeStyle = col; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function platterSI(c, x, y, s) {   /* a steel platter: an ellipse with a rim */
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(20,16,12,.28)'; c.beginPath(); c.ellipse(0, 4, 150, 16, 0, 0, TAU); c.fill();
  c.fillStyle = lg(-150, 0, 150, 0, [[0, '#b9c1cd'], [.5, '#eef2f7'], [1, '#98a1af']]); c.beginPath(); c.ellipse(0, -10, 148, 20, 0, 0, TAU); c.fill(); ink(c, 3.4);
  c.fillStyle = '#dfe5ee'; c.beginPath(); c.ellipse(0, -13, 128, 14, 0, 0, TAU); c.fill(); c.restore();
}
const SIKIND = {
  turkey(c, o) { const cv = o.carve || 0;
    c.fillStyle = lg(0, -118, 0, -14, [[0, '#f0b04a'], [.5, '#c8741f'], [1, '#8a4410']]); c.beginPath(); c.ellipse(0, -62, 104, 56, 0, 0, TAU); c.fill(); ink(c, 3.6);
    c.fillStyle = '#d98a2c'; c.beginPath(); c.ellipse(-92, -34, 30, 22, -.6, 0, TAU); c.fill(); ink(c, 3); c.beginPath(); c.ellipse(92, -34, 30, 22, .6, 0, TAU); c.fill(); ink(c, 3);
    c.fillStyle = 'rgba(255,236,170,.65)'; c.beginPath(); c.ellipse(-30, -92, 36, 11, -.2, 0, TAU); c.fill();
    if (cv > .02) { c.fillStyle = '#f2dcae'; for (let i = 0; i < 5; i++) { if (cv * 5 < i) break; c.beginPath(); c.ellipse(30 + i * 9, -70 + i * 5, 10, 24, .3, 0, TAU); c.fill(); ink(c, 2); } } },
  turkeySlices(c, o) { for (let i = 0; i < 7; i++) { c.save(); c.translate(-70 + i * 24, -32); c.rotate(-.5 + i * .16); c.fillStyle = i % 2 ? '#f0d7a4' : '#f6e2b8'; c.beginPath(); c.ellipse(0, -22, 19, 40, 0, 0, TAU); c.fill(); ink(c, 2.4); c.fillStyle = '#c47a28'; c.beginPath(); c.ellipse(0, -52, 14, 6, 0, 0, TAU); c.fill(); c.restore(); } },
  turkeyChop(c, o) { for (let i = 0; i < 16; i++) { const a = sr(i, 1), b = sr(i, 2); c.save(); c.translate(-72 + a * 144, -24 - 34 * b * (1 - Math.abs(a - .5) * 1.3)); c.rotate(sr(i, 3) * PI); c.fillStyle = i % 3 ? '#e8c27a' : '#c98a3c'; rr(-14, -9, 28, 18, 4); c.fill(); ink(c, 2.2); c.restore(); } },
  turkeyMince(c, o) { c.fillStyle = '#d8b077'; c.beginPath(); c.moveTo(-96, -16); c.bezierCurveTo(-80, -86, 80, -86, 96, -16); c.closePath(); c.fill(); ink(c, 3.4);
    for (let i = 0; i < 60; i++) { c.fillStyle = i % 3 ? '#caa062' : '#e6c690'; c.beginPath(); c.arc(-80 + sr(i, 4) * 160, -22 - sr(i, 5) * 46 * (1 - Math.abs(sr(i, 4) - .5) * 1.6), 3 + sr(i, 6) * 3, 0, TAU); c.fill(); } },
  turkeyPuree(c, o) { c.fillStyle = BEIGE; c.beginPath(); c.moveTo(-90, -16); c.bezierCurveTo(-84, -86, 84, -86, 90, -16); c.closePath(); c.fill(); ink(c, 3.4); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-30, -56, 26, 8, -.3, 0, TAU); c.fill(); },
  turkeyMold(c, o) { c.fillStyle = lg(-100, 0, 100, 0, [[0, BEIGE_L], [.55, BEIGE], [1, BEIGE_D]]); c.beginPath(); c.ellipse(0, -52, 98, 42, 0, 0, TAU); c.fill(); ink(c, 3.6);
    c.beginPath(); c.ellipse(-86, -30, 26, 18, -.5, 0, TAU); c.fill(); ink(c, 3); c.beginPath(); c.ellipse(86, -30, 26, 18, .5, 0, TAU); c.fill(); ink(c, 3);
    c.beginPath(); c.ellipse(96, -92, 20, 22, 0, 0, TAU); c.fill(); ink(c, 3);   /* the neck and head of a very neat turkey */
    c.strokeStyle = 'rgba(170,140,96,.7)'; c.lineWidth = 2.4; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 20, -78); c.quadraticCurveTo(i * 22, -58, i * 18, -36); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-28, -76, 34, 8, -.15, 0, TAU); c.fill(); },
  pie(c, o) { c.fillStyle = lg(0, -60, 0, 0, [[0, '#d9a45a'], [1, '#a8662c']]); c.beginPath(); c.ellipse(0, -30, 140, 34, 0, 0, TAU); c.fill(); ink(c, 3.6);
    c.fillStyle = '#7a3f16'; c.beginPath(); c.ellipse(0, -38, 112, 24, 0, 0, TAU); c.fill(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.fillStyle = i % 2 ? '#c98a4a' : '#a8662c'; c.beginPath(); c.ellipse(Math.cos(a) * 82, -38 + Math.sin(a) * 15, 17, 8, a, 0, TAU); c.fill(); ink(c, 2); } },
  pieMold(c, o) { c.fillStyle = lg(0, -60, 0, 0, [[0, BEIGE_L], [1, BEIGE_D]]); c.beginPath(); c.ellipse(0, -28, 134, 32, 0, 0, TAU); c.fill(); ink(c, 3.6);
    c.fillStyle = BEIGE; c.beginPath(); c.ellipse(0, -36, 108, 22, 0, 0, TAU); c.fill(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.fillStyle = BEIGE_L; c.beginPath(); c.ellipse(Math.cos(a) * 80, -36 + Math.sin(a) * 13, 15, 7, a, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-34, -44, 40, 7, -.1, 0, TAU); c.fill(); },
};
/* dish(kind, o): draw a food kind at o.x, o.y (bottom centre) at scale o.s; F19 if it has the kind, else the stand-in on a steel platter (kinds the platter carries) */
function dish(kind, o) {
  const s = o.s ?? 1; if (s < .02 || o.alpha === 0) return null;
  if (!o.stand && hasF(kind)) return F19.dish(ctx, kind, Object.assign({ t: o.t }, o));
  ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.plat !== false && kind !== 'pie' && kind !== 'pieMold') platterSI(ctx, o.x, o.y, s);
  ctx.translate(o.x, o.y); ctx.scale(s, s); if (o.rot) ctx.rotate(o.rot);
  if (SIKIND[kind]) SIKIND[kind](ctx, o);
  ctx.restore(); return { w: 300 * s, h: 120 * s, top: [o.x, o.y - 100 * s], hot: [o.x, o.y - 70 * s] };
}
/* steam: F19.steam when it exists, else FX18.smoke at a low density (never over text or faces: keep it to the food) */
function steam(o) {
  if (window.F19 && typeof F19.steam === 'function') return F19.steam(ctx, o);
  if (window.FX18 && typeof FX18.smoke === 'function') FX18.smoke(ctx, { x: o.x, y: o.y, w: (o.w || 40) * .6, h: o.h || 150, t: o.t, t0: -3, seed: o.seed || 1, density: .16 * (o.power ?? .7), rise: o.h || 150, color: '#f4efe6', life: 2.6, rate: 4 });
}


// ------------------------------------------------------------------ the room: ceiling, tiled wall, stainless splash, counter, floor (drawn for the visible x range only)
const brushed = (x0, x1, y0, y1, a, b) => { ctx.fillStyle = lg(x0, y0, x0, y1, [[0, a], [1, b]]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); };
function roomBack(x0, x1, lt) {
  const w = x1 - x0;
  /* ceiling and upper wall */
  brushed(x0, x1, -620, 0, '#8e9aa0', '#b4c0c2');
  brushed(x0, x1, 0, 250, '#b8d3c6', '#cfe3d8');
  ctx.fillStyle = 'rgba(40,70,60,.14)'; ctx.fillRect(x0, 0, w, 6);
  /* the tiled wall: white subway tile, a mint border band, grout lines */
  brushed(x0, x1, 250, 880, '#e9f1ea', '#dce8df');
  ctx.fillStyle = '#9cc7b0'; ctx.fillRect(x0, 250, w, 22); ctx.fillStyle = 'rgba(20,60,40,.18)'; ctx.fillRect(x0, 272, w, 4);
  ctx.strokeStyle = 'rgba(70,100,90,.2)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let y = 336; y < 880; y += 64) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  for (let r = 0, y = 276; y < 880; r++, y += 64) for (let x = Math.floor(x0 / 128) * 128 + (r % 2 ? 64 : 0); x < x1; x += 128) { ctx.moveTo(x, y); ctx.lineTo(x, y + 64); }
  ctx.stroke();
  /* the stainless splash behind the counter: brushed steel with panel seams and a light streak */
  brushed(x0, x1, 880, CT, '#c3ccd6', '#9aa5b2');
  ctx.fillStyle = 'rgba(255,255,255,.22)'; for (let x = Math.floor(x0 / 260) * 260; x < x1; x += 260) ctx.fillRect(x + 40, 880, 70, CT - 880);
  ctx.strokeStyle = 'rgba(40,50,64,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, 880); ctx.lineTo(x1, 880); for (let x = Math.floor(x0 / 260) * 260; x < x1; x += 260) { ctx.moveTo(x, 880); ctx.lineTo(x, CT); } ctx.stroke();
  ctx.fillStyle = 'rgba(30,36,48,.25)'; ctx.fillRect(x0, 880, w, 10);
  /* fluorescent fixtures on the ceiling: long white tubes with a warm spill on the wall below */
  for (let x = Math.floor((x0 - 260) / 560) * 560 + 160; x < x1 + 260; x += 560) {
    rr(x - 190, -120, 380, 34, 8); ctx.fillStyle = '#d9dee4'; ctx.fill(); ink(ctx, 3.4);
    rr(x - 176, -112, 352, 16, 8); ctx.fillStyle = '#fffbea'; ctx.fill();
    V2.glow(x, -40, 360, '255,244,214', .14, 'screen', .16);
  }
}
function roomFront(x0, x1, lt) {
  const w = x1 - x0;
  /* the counter: a top edge with a highlight, a brushed front with door seams and handles, a kick plate, the floor */
  brushed(x0, x1, CT, CT + 22, '#f4f7fb', '#b9c2ce'); ctx.fillStyle = 'rgba(30,36,48,.5)'; ctx.fillRect(x0, CT + 22, w, 4);
  brushed(x0, x1, CT + 26, FY - 34, '#aab4c1', '#7d8896');
  ctx.fillStyle = 'rgba(255,255,255,.16)'; for (let x = Math.floor(x0 / 340) * 340; x < x1; x += 340) ctx.fillRect(x + 30, CT + 40, 60, FY - CT - 90);
  ctx.strokeStyle = 'rgba(30,36,48,.5)'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = Math.floor(x0 / 340) * 340; x < x1; x += 340) { ctx.moveTo(x, CT + 28); ctx.lineTo(x, FY - 34); } ctx.stroke();
  ctx.fillStyle = '#5b6573'; for (let x = Math.floor(x0 / 340) * 340; x < x1; x += 340) { rr(x + 150, CT + 70, 40, 9, 4); ctx.fill(); rr(x + 190 + 0, CT + 70, 0, 0, 0); }
  brushed(x0, x1, FY - 34, FY, '#2b303a', '#1b1e26');
  const fg = lg(0, FY, 0, FY + 700, [[0, '#a56e4c'], [.45, '#8a583c'], [1, '#6a4330']]); ctx.fillStyle = fg; ctx.fillRect(x0, FY, w, 760);
  ctx.strokeStyle = 'rgba(40,20,10,.35)'; ctx.lineWidth = 3; ctx.beginPath(); for (let y = FY + 70; y < FY + 760; y += 70 + (y - FY) * .12) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); } ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0, FY, w, 10);
}
/* the pan rail: hung with pans, a ladle, a whisk; each swings with a damped wobble after the clatter cues (a pure function of time) */
const RAIL_ITEMS = [['pan', 0], ['ladle', 1], ['pot', 2], ['whisk', 3], ['pan', 4], ['colander', 5], ['spat', 6], ['pot', 7], ['pan', 8], ['ladle', 9]];
function swingAt(lt, i) { let a = 0; for (const c of [CUE.clatter1, CUE.clatter2]) if (lt >= c) { const tt = lt - c; a += Math.sin(tt * (7 + i % 3) + i) * Math.exp(-tt * 2.2) * (.2 + .06 * (i % 4)); } return a + Math.sin(lt * .9 + i * 1.7) * .012; }
function rail(x0, x1, lt, y = 60) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#6a7380'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x0 - 40, y); ctx.lineTo(x1 + 40, y); ctx.stroke(); ctx.strokeStyle = '#d8dee8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 - 40, y - 2); ctx.lineTo(x1 + 40, y - 2); ctx.stroke();
  for (let k = Math.floor((x0 - 100) / 150) - 1; k * 150 < x1 + 100; k++) {
    const x = k * 150 + 60 + sr(k, 5) * 30, [kind, ix] = RAIL_ITEMS[((k % 10) + 10) % 10], sw = swingAt(lt, ix + k * 3);
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.stroke();
    const fill = V2.grad(-50, 0, 50, 0, [[0, '#cfd6e0'], [.5, '#8d97a6'], [1, '#6a7380']]);
    if (kind === 'pan') { ctx.translate(0, 34); ctx.fillStyle = '#3a3f4a'; ctx.beginPath(); ctx.ellipse(0, 70, 60, 64, 0, 0, TAU); ctx.fill(); ink(ctx, 3.4); ctx.fillStyle = '#2a2e38'; ctx.beginPath(); ctx.ellipse(0, 70, 48, 52, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a4f5c'; rr(-7, -34, 14, 44, 6); ctx.fill(); ink(ctx, 3); }
    else if (kind === 'pot') { ctx.translate(0, 34); ctx.fillStyle = fill; rr(-44, 0, 88, 84, 10); ctx.fill(); ink(ctx, 3.4); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-34, 8, 10, 66); ctx.fillStyle = '#5a6270'; rr(-56, 14, 14, 10, 4); ctx.fill(); rr(42, 14, 14, 10, 4); ctx.fill(); }
    else if (kind === 'ladle') { ctx.translate(0, 34); ctx.strokeStyle = OUTL; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 100); ctx.stroke(); ctx.strokeStyle = '#d2d8e2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 100); ctx.stroke(); ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(-24, 98); ctx.bezierCurveTo(-24, 148, 24, 148, 24, 98); ctx.closePath(); ctx.fill(); ink(ctx, 3.4); }
    else if (kind === 'whisk') { ctx.translate(0, 34); ctx.strokeStyle = '#8d96a3'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.stroke(); ctx.strokeStyle = '#c3cad6'; ctx.lineWidth = 2.6; for (let j = -3; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(0, 44); ctx.bezierCurveTo(j * 14, 70, j * 14, 110, 0, 130); ctx.stroke(); } }
    else if (kind === 'colander') { ctx.translate(0, 34); ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(-54, 20); ctx.bezierCurveTo(-54, 110, 54, 110, 54, 20); ctx.closePath(); ctx.fill(); ink(ctx, 3.4); ctx.fillStyle = 'rgba(30,36,48,.45)'; for (let a = 0; a < 18; a++) { ctx.beginPath(); ctx.arc(-38 + (a % 6) * 15, 34 + Math.floor(a / 6) * 20, 3, 0, TAU); ctx.fill(); } }
    else { ctx.translate(0, 34); ctx.strokeStyle = OUTL; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 80); ctx.stroke(); ctx.strokeStyle = '#2b2f3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 80); ctx.stroke(); ctx.fillStyle = '#d34a2a'; rr(-22, 78, 44, 54, 8); ctx.fill(); ink(ctx, 3); }
    ctx.restore();
  }
  ctx.restore();
}
/* the exhaust hood over the line: a steel canopy with a filter strip, a warm lamp, and steam drifting into it (the steam is drawn by the caller where it matters) */
function hood(x0, x1, lt) {
  const y0 = 300, y1 = 440;
  ctx.save(); ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#d5dbe4'], [1, '#98a2b0']]); ctx.beginPath(); ctx.moveTo(x0 + 40, y0); ctx.lineTo(x1 - 40, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath(); ctx.fill(); ink(ctx, 3.6);
  ctx.fillStyle = '#6a7380'; ctx.fillRect(x0 + 8, y1 - 26, x1 - x0 - 16, 26); ctx.strokeStyle = 'rgba(20,26,36,.7)'; ctx.lineWidth = 2.4; for (let x = x0 + 24; x < x1 - 20; x += 22) { ctx.beginPath(); ctx.moveTo(x, y1 - 24); ctx.lineTo(x - 6, y1 - 2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x0 + 60, y0 + 24, x1 - x0 - 120, 14); ctx.restore();
}
/* a round wall clock at five o'clock (the hour hand at 5, the minute hand at 12) */
function clock(cx, cy, r, lt) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, TAU); ctx.fill(); ink(ctx, 3.4);
  ctx.fillStyle = '#fbfbf4'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2b2f3a'; ctx.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, l = i % 3 ? 6 : 12; ctx.lineWidth = i % 3 ? 3 : 5; ctx.beginPath(); ctx.moveTo(Math.sin(a) * (r - 6), -Math.cos(a) * (r - 6)); ctx.lineTo(Math.sin(a) * (r - 6 - l), -Math.cos(a) * (r - 6 - l)); ctx.stroke(); }
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(5 / 12 * TAU) * r * .5, -Math.cos(5 / 12 * TAU) * r * .5); ctx.stroke(); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * .78); ctx.stroke();
  const sa = (lt % 60) / 60 * TAU; ctx.strokeStyle = '#c33a2e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(sa) * r * .8, -Math.cos(sa) * r * .8); ctx.stroke();
  ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); ctx.restore();
}


// ------------------------------------------------------------------ text helpers: hero or dressing decided from where the string lands on the screen (the camera zoom and the safe area)
function scrBox(x0, y0, x1, y1) {
  const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f], q = [p(x0, y0), p(x1, y0), p(x0, y1), p(x1, y1)];
  return [Math.min(...q.map(v => v[0])), Math.min(...q.map(v => v[1])), Math.max(...q.map(v => v[0])), Math.max(...q.map(v => v[1]))];
}
/* the options for a string of font size `size` whose ink fits a w x h box centred on (cx, cy): hero when it is 31 px or more on the screen and wholly inside the safe area, else dressing (cropped only when it leaves the frame) */
let BGMODE = 0;   /* 1 while the blurred background is drawn: its lettering is dressing */
function hh(size, cx, cy, w, h = size) {
  const b = scrBox(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), px = size * scrOf();
  const inside = b[0] >= 46 && b[2] <= W - 46 && b[1] >= 252 && b[3] <= 1372;
  const out = b[0] < 2 || b[2] > W - 2 || b[1] < 2 || b[3] > H - 2;
  return !BGMODE && inside && px >= 31 ? { hero: true } : (out ? { hero: false, crop: true } : { hero: false });
}

// ------------------------------------------------------------------ the diet board: six rows that light one by one; the counts add up to 40
function dietBoard(lt, o = {}) {
  const B = BOARD, lit = o.lit || [0, 0, 0, 0, 0, 0], head = o.head ?? 1, cx = B.x + B.w / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
  ctx.fillStyle = lg(B.x, B.y, B.x, B.y + B.h, [[0, '#1d4a36'], [1, '#12301f']]); rr(B.x, B.y, B.w, B.h, 16); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#b9c2ce'; ctx.lineWidth = 9; rr(B.x, B.y, B.w, B.h, 16); ctx.stroke(); ctx.strokeStyle = 'rgba(30,36,48,.7)'; ctx.lineWidth = 3; rr(B.x - 5, B.y - 5, B.w + 10, B.h + 10, 19); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(B.x + 14, B.y + 12); ctx.lineTo(B.x + 230, B.y + 12); ctx.lineTo(B.x + 14, B.y + 200); ctx.closePath(); ctx.fill();
  UI.panel([B.x, B.y, B.w, B.h], { fill: false, id: 'dietboard', pad: 0 });
  const t1 = hh(44, cx, B.y + 38, 300), t2 = hh(30, cx, B.y + 76, 260);
  UI.label('DIET ORDERS', cx, B.y + 40, Object.assign({ size: 44, font: 'Bangers', weight: 400, fill: '#d6f7e2', spacing: 3, maxW: B.w - 80, cid: 'dietboard' }, t1));
  if (head > .02) UI.label('RESIDENTS: 40', cx, B.y + 78, Object.assign({ size: 28, weight: 900, fill: '#ffe08a', spacing: 2, maxW: B.w - 120, cid: 'dietboard', alpha: c01(head) }, t2));
  const y0 = B.y + 98, rh = 56, gap = 6;
  DIETS.forEach(([name, n], i) => {
    const y = y0 + i * (rh + gap), x = B.x + 22, w = B.w - 44, u = lit[i] || 0, id = 'drow' + i;
    ctx.save();
    ctx.fillStyle = u > .02 ? mixc('#2b6a4a', '#ffe9a6', u) : 'rgba(255,255,255,.07)';
    rr(x, y, w, rh, 12); ctx.fill(); ctx.strokeStyle = u > .02 ? 'rgba(255,240,190,' + (.3 + .6 * u) + ')' : 'rgba(255,255,255,.14)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    UI.panel([x, y, w, rh], { fill: false, id, pad: 0 });
    const ink2 = u > .5 ? '#2a1a08' : 'rgba(226,240,230,' + (.42 + .4 * u) + ')', hs = hh(34, x + 190, y + rh / 2, 330, 40);
    UI.label(name, x + 18, y + rh / 2, Object.assign({ size: 34, weight: 900, fill: ink2, spacing: 1.2, align: 'left', maxW: 330, cid: id }, hs));
    UI.label(String(n), x + w - 20, y + rh / 2, Object.assign({ size: 40, font: 'Bangers', weight: 400, fill: ink2, align: 'right', maxW: 70, cid: id }, hh(40, x + w - 50, y + rh / 2, 60, 44)));
    if (u > .02 && u < 1) V2.glow(x + w / 2, y + rh / 2, 260, '255,226,150', .5 * Math.sin(u * PI), 'screen', .2);
  });
}

// ------------------------------------------------------------------ props of the pass: the steel cloche over the turkey, the heat lamp, the stockpot, the tray cart
function cloche(x, y, lift, lt) {   /* a domed steel lid on the pass: lift 0..1 raises it (and tips it away); the platter underneath is the caller's */
  ctx.save(); ctx.translate(x + lift * 18, y - lift * 640); ctx.rotate(lift * .18);
  ctx.fillStyle = lg(-160, 0, 160, 0, [[0, '#aeb7c3'], [.35, '#f4f7fb'], [.6, '#c3cad6'], [1, '#7d8794']]); ctx.beginPath(); ctx.moveTo(-160, 0); ctx.bezierCurveTo(-160, -150, 160, -150, 160, 0); ctx.closePath(); ctx.fill(); ink(ctx, 3.8);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-60, -98, 54, 12, -.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c3cad6'; ctx.beginPath(); ctx.arc(0, -134, 16, 0, TAU); ctx.fill(); ink(ctx, 3.4); ctx.fillStyle = '#9aa3b0'; rr(-8, -122, 16, 14, 3); ctx.fill();
  ctx.restore();
}
function heatLamp(x, lt, on = 1) {
  ctx.save(); ctx.fillStyle = '#5a6270'; rr(x - 150, 640, 300, 16, 6); ctx.fill(); ink(ctx, 3); ctx.fillStyle = '#9aa3b0'; rr(x - 8, 560, 16, 84, 4); ctx.fill();
  for (const dx of [-80, 80]) { ctx.fillStyle = '#3a3f4a'; ctx.beginPath(); ctx.moveTo(x + dx - 40, 656); ctx.lineTo(x + dx + 40, 656); ctx.lineTo(x + dx + 28, 700); ctx.lineTo(x + dx - 28, 700); ctx.closePath(); ctx.fill(); ink(ctx, 3); ctx.fillStyle = on > .02 ? '#ffb43a' : '#6a4a2a'; ctx.beginPath(); ctx.ellipse(x + dx, 700, 28, 6, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  if (on > .02) { V2.glow(x, 740, 380, '255,170,70', .4 * on, 'screen', .3); V2.beam(x - 80, 702, x - 130, CT, 50, 170, '255,170,70', .26 * on, 'screen'); V2.beam(x + 80, 702, x + 130, CT, 50, 170, '255,170,70', .26 * on, 'screen'); }
}
function stockpot(x, lt) {   /* a big steel stockpot with a lid that jumps when the ladle hits it (clatter cues) */
  const j = Math.max(pulse(lt, CUE.clatter1, 30, .1), pulse(lt, CUE.clatter2, 30, .1));
  ctx.save(); ctx.translate(x, CT - 2); ctx.fillStyle = 'rgba(20,16,12,.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 98, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(-84, 0, 84, 0, [[0, '#9aa3b0'], [.35, '#eef2f7'], [.7, '#b8c0cc'], [1, '#737d8b']]); rr(-82, -150, 164, 148, 12); ctx.fill(); ink(ctx, 3.8);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-64, -140, 14, 126); ctx.fillStyle = '#5a6270'; rr(-100, -118, 24, 14, 6); ctx.fill(); ink(ctx, 3); rr(76, -118, 24, 14, 6); ctx.fill(); ink(ctx, 3);
  ctx.save(); ctx.translate(0, -150 - Math.abs(j) * 9); ctx.rotate(j * .03); ctx.fillStyle = lg(-90, 0, 90, 0, [[0, '#aeb7c3'], [.4, '#f4f7fb'], [1, '#7d8794']]); ctx.beginPath(); ctx.ellipse(0, 0, 90, 14, 0, 0, TAU); ctx.fill(); ink(ctx, 3.6); ctx.beginPath(); ctx.arc(0, -10, 12, PI, TAU); ctx.fillStyle = '#5a6270'; ctx.fill(); ink(ctx, 3); ctx.restore();
  ctx.restore();
}
function trayCart(x, lt) {   /* a rolling rack of meal trays with tray tickets clipped to their edges (background dressing) */
  const top = 700, bot = FY - 20, w = 250;
  ctx.save(); ctx.fillStyle = 'rgba(20,16,12,.22)'; ctx.beginPath(); ctx.ellipse(x, FY + 2, w * .6, 14, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7d8794'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x - w / 2, bot); ctx.moveTo(x + w / 2, top); ctx.lineTo(x + w / 2, bot); ctx.stroke(); ctx.strokeStyle = '#d8dee8'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(x - w / 2 - 2, top); ctx.lineTo(x - w / 2 - 2, bot); ctx.moveTo(x + w / 2 - 2, top); ctx.lineTo(x + w / 2 - 2, bot); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const y = top + 30 + i * 90; ctx.fillStyle = i % 2 ? '#8fb8d8' : '#a8c9a0'; rr(x - w / 2 + 6, y, w - 12, 40, 6); ctx.fill(); ink(ctx, 3);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - w / 2 + 16, y + 6, w - 40, 6);
    ctx.fillStyle = '#fffbe8'; ctx.strokeStyle = 'rgba(25,20,16,.7)'; ctx.lineWidth = 2; ctx.save(); ctx.translate(x - w / 2 + 34 + (i % 3) * 66, y + 40); ctx.rotate(-.04 + .02 * i); ctx.fillRect(-18, -4, 36, 24); ctx.strokeRect(-18, -4, 36, 24); ctx.fillStyle = 'rgba(60,60,80,.5)'; ctx.fillRect(-12, 2, 24, 2.4); ctx.fillRect(-12, 8, 16, 2.4); ctx.restore();
  }
  ctx.fillStyle = '#5a6270'; for (const dx of [-w / 2, w / 2]) { ctx.beginPath(); ctx.arc(x + dx, bot + 8, 11, 0, TAU); ctx.fill(); }
  ctx.restore();
}


// ------------------------------------------------------------------ the cast: bodies anchored behind the counter at x, scale s; acting is a function of scene time
const S0 = .9;                                           /* every character is drawn at this scale; the zoom does the framing */
function mk(ctor, lt, p) {
  const o = ctor(Object.assign({ t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true }, p.o));
  o.s = p.s ?? S0; o.x = p.x; o.y = p.y ?? BODY_Y; o.lift = p.lift ?? 0;
  if (p.yaw != null) { o.yaw = p.yaw; o.headYaw = p.headYaw ?? p.yaw; }
  return o;
}
const tapAt = (lt, t0) => ss(lt, t0 - .16, t0) * (1 - ss(lt, t0, t0 + .12));
const W3 = (id, i) => wS(id, i);
const PB = { x: 6410, bs: .8 };   /* the pie box in s4, and the tin Strawberry lifts out of it */
const pieTin = lt => ({ x: PB.x, y: CT - 20 * PB.bs - 72 * ss(lt, 29.62, 30.0) });   /* the pie in its tin: lifted out of the box by Strawberry in s4 */
/* Chef: flat; the ladle taps the cloche twice at the open (the clatter), then it stands like a sceptre; the knife in c2; one finger at the beige turkey in c3 */
function actChef(lt, id) {
  const tap = Math.max(tapAt(lt, CUE.clatter1), tapAt(lt, CUE.clatter2)), A = { expr: 'chef_flat', look: [-.1, .05] };
  const sway = Math.sin(lt * 1.3) * 3;
  if (id === 'open') Object.assign(A, { look: [.55, .1], ladleRot: .18 + .78 * tap, grip: { r: [128 + 20 * tap, 58 - 36 * tap] } });
  if (id === 'c1a') Object.assign(A, { look: [.2, .05], grip: { r: [128, 58 + sway] }, browUp: 3 + 6 * ss(lt, 1.5, 1.7) * (1 - ss(lt, 2.4, 2.7)) });
  if (id === 'c1b') Object.assign(A, { look: [-.6, -.1], grip: { r: [128, 58 + sway] } });
  if (id === 'c2a') Object.assign(A, { expr: 'chef_proud', look: [.45, .1], arms: { l: 'rest', r: 'hold' }, grip: { r: [118, 20] }, hold: { r: 'fp19_knife' }, knifeRot: -.25 });
  if (id === 'c2b') { const dn = ss(lt, wS('c2', 3), wE('c2', 3)); Object.assign(A, { look: [.3 + .2 * dn, .1 + .35 * dn], arms: { l: 'rest', r: 'hold' }, grip: { r: [118 + 6 * dn, 20 + 52 * dn] }, hold: { r: 'fp19_knife' }, knifeRot: lerp(-.25, 1.35, dn) }); }
  if (id === 'c3') { const up = ss(lt, wS('c3', 2), wS('c3', 3)) * (1 - ss(lt, wE('c3', 4) - .25, wE('c3', 4) + .3)); Object.assign(A, { look: [-.55, .15], arms: { l: 'hold', r: 'hold' }, grip: { l: [lerp(-96, -150, up), lerp(86, -22, up)], r: [128, 58] }, hand: { l: 'point' }, hold: { r: 'fp19_ladle' } }); }
  if (id === 'pr3') Object.assign(A, { look: [.4, .35], expr: 'chef_flat', grip: { r: [128, 58] } });
  if (id === 'c5') Object.assign(A, { look: lt > 24.2 ? [.7, .05] : [.05, .05], grip: { r: [128, 58 + sway] }, lid: .36 });
  if (id === 'c6') Object.assign(A, { expr: 'chef_proud', look: [-.5, .3], arms: { l: 'hold', r: 'hold' }, grip: { l: [-100, 80], r: [128, 58] }, hold: { r: 'fp19_ladle' } });
  if (id === 'c7') Object.assign(A, { expr: 'chef_dry', look: [-.7, 0], arms: { l: 'rest', r: 'rest' } });
  if (id === 'c8' || id === 'end') Object.assign(A, { expr: 'chef_weary', look: [-.4, .45], arms: { l: 'rest', r: 'rest' } });
  return A;
}
function actMango(lt, id) {
  const A = { expr: 'neutral', look: [-.6, 0], arms: { l: 'rest', r: 'rest' } };
  if (id === 'm1') Object.assign(A, { look: [-.7, .02 + .02 * Math.sin(lt * 3)], lid: .18, browUp: 6 });
  return A;
}
function actStraw(lt, id) {
  const A = { expr: 'dead', lid: .5, look: [-.55, .05], arms: { l: 'hold', r: 'rest' }, grip: { l: [-130, 72 + 3 * Math.sin(lt * 1.4)] }, hold: { l: 'fp19_tray' }, trayItems: 'ticket', trayTilt: -.02 };
  if (id === 's1') Object.assign(A, { look: [.85, .15], lid: .4, browUp: 8 });
  if (id === 'pr3') Object.assign(A, { look: [-.6, .3] });
  if (id === 's2') { const fl = ss(lt, 20.98, 21.3), shk = lt > 21.3 && lt < 21.78 ? Math.sin((lt - 21.3) * 38) * 3 * (1 - ss(lt, 21.6, 21.78)) : 0;
    Object.assign(A, { look: [-.2, .55], lid: .5, arms: { l: 'rest', r: 'hold' }, grip: { r: [160, -62 - 12 * Math.sin(fl * PI) + shk] }, hold: { r: 'fp19_cup' }, cupRot: PI * fl, trayItems: null }); }
  if (id === 's3') Object.assign(A, { look: [.85, .05], lid: .5 });
  if (id === 's4') { const tk = pieTin(lt), reach = ss(lt, 29.4, 29.62);
    Object.assign(A, { look: lt < 29.9 ? [.85, .05] : [.1, .5], lid: .5, expr: 'dead', arms: { l: 'rest', r: 'hold' }, hold: {}, grip: { r: [lerp(112, (tk.x - 40 - WS.straw) / S0, reach), lerp(62, (tk.y - 44 - 959) / S0, reach)] }, hand: { r: 'grip' } }); }
  if (id === 'w1') Object.assign(A, { look: lt < CUE.bell + .1 ? [-.3, .1] : [.85, .05], lid: .45, arms: { l: 'rest', r: 'rest' }, hold: {} });
  return A;
}
EXT.prop.fp19_cup = (side, o, t) => {   /* a paper cup of coffee pudding in a hand; o.cupRot turns it over (the pudding does not move) */
  ctx.save(); ctx.rotate(o.cupRot || 0); dish('coffee', { x: 0, y: 66, s: 1, thick: 1, fill: 1, t, seed: 3, steam: 0 }); ctx.restore();
};
PROP_BOX.fp19_cup = [-64, -66, 64, 66];
const CHEFO = (lt, p, id) => mk(A19.chef, lt, Object.assign({ o: actChef(lt, id) }, p));
const MANGO = (lt, p, id) => mk(A7.mango, lt, Object.assign({ o: actMango(lt, id) }, p));
const STRAW = (lt, p, id) => mk(o => A19.apron(A11.straw(o)), lt, Object.assign({ o: actStraw(lt, id) }, p));
const PINE = (lt, p, id) => mk(o => A7.pine(Object.assign({ who: 'pine', acc: ['fp19_visitor'] }, o)), lt, Object.assign({ o: actPine(lt, id) }, p));
/* a VISITOR sticker on Pineapple's chest (a blank plate: lettered by the scene, dressing) */
EXT.acc.fp19_visitor = (o, k, t, layer) => { if (layer !== 'front') return; ctx.save(); ctx.translate(-k.rx * .5, k.ry * .42); ctx.rotate(-.12); ctx.fillStyle = '#fbfaf2'; ctx.strokeStyle = 'rgba(25,10,20,.85)'; ctx.lineWidth = 3; rr(-34, -18, 68, 36, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2f6fd0'; ctx.fillRect(-31, -15, 62, 9); ctx.restore(); };
if (typeof V2C !== 'undefined' && V2C.ACC_CLS) V2C.ACC_CLS.fp19_visitor = 'decal';
/* the Chef's name plate: lettered live (the sprite has none); hero when it comes out readable */
function chefTag(o) {
  const pl = A19.plate(o, 'chef_tag'); if (!pl || Math.abs(o.yaw || 0) > .45) return;
  const sz = Math.min(24, pl.w / 6.6), h = hh(sz, pl.x, pl.y, pl.w - 12, sz);
  ctx.save(); ctx.translate(pl.x, pl.y); ctx.rotate(pl.rot); UI.label('CHEF CABBAGE', 0, 2, Object.assign({ size: sz, weight: 900, fill: '#2a2a32', spacing: .6, maxW: pl.w - 14 }, h)); ctx.restore();
}
function inFrame(o) {   /* wholly inside the frame (with a margin)? a character that would be cut is left out of the shot instead: no slivers */
  const k = KINDS[o.kind], s = o.s || 1, top = o.y - (o.lift || 0) - ((o.noLegs ? 0 : 90) + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12) * s + 10;
  const b = scrBox(o.x - half, top, o.x + half, o.y + 30 * s);
  return b[0] >= 8 && b[2] <= W - 8 && b[1] >= 4 && b[3] > 0 && b[1] < H;
}
function drawCast(list) {   /* [ctor result, name] back to front; the Chef also gets his name plate */
  const drawn = {};
  for (const [o, nm] of list) { if (!o || (o.s ?? 1) < .02) continue; if (!inFrame(o)) continue; drawChar(o); drawn[nm] = o; if (nm === 'chef') chefTag(o); }
  return drawn;
}

// ------------------------------------------------------------------ THE TEXTURE LINE: a conveyor with five stations; the platter rides it, the camera rides with the platter
const STN = [
  { X: LINE.X1, name: 'REGULAR', col: '#58b274' }, { X: LINE.X2, name: 'MECH SOFT', col: '#e0b23a' }, { X: LINE.X3, name: 'MINCED', col: '#e8863a' },
  { X: LINE.X4, name: 'PUREE', col: '#b486d2' }, { X: LINE.X5, name: 'MOLD', col: '#d9c7a3' }];
const HEAD = 566;   /* the underside of the gantry header */
/* the platter's x along the belt: waypoints (time, x), each leg eased; the camera follows */
const TKW = [[8.9, LINE.X1 - 1000], [10.076, LINE.X1 - 120], [CUE.carve, LINE.X1], [10.62, LINE.X1 + 28], [11.04, LINE.X2 - 8], [11.12, LINE.X2 + 10], [11.62, LINE.X4 - 8], [CUE.blender1 + .04, LINE.X4], [12.40, LINE.X4 + 26],
  [13.00, LINE.X5 - 8], [CUE.mold1, LINE.X5], [13.30, LINE.X5 + 12], [13.60, LINE.X5 + 70], [14.6, LINE.X5 + 90]];
const TKE = [easeOut, easeIO, easeIO, easeIO, easeIO, t => t, easeIO, easeIO, easeIO, easeIO, easeIO, easeIO, t => t];
function tkX(lt) {
  if (lt <= TKW[0][0]) return TKW[0][1];
  for (let i = 1; i < TKW.length; i++) if (lt < TKW[i][0]) { const a = TKW[i - 1], b = TKW[i]; return lerp(a[1], b[1], (TKE[i - 1] || easeIO)(c01((lt - a[0]) / (b[0] - a[0])))); }
  return TKW[TKW.length - 1][1];
}
const camX = lt => { let a = 0; for (let i = 0; i < 6; i++) a += tkX(lt - i * .022); return a / 6; };   /* a short moving average: the camera does not copy every corner of the belt */
const EMPTY = (x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = 'rgba(20,16,12,.25)'; ctx.beginPath(); ctx.ellipse(0, 6, 150, 17, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#eeeae0'; ctx.beginPath(); ctx.ellipse(0, -10, 150, 22, 0, 0, TAU); ctx.fill(); ink(ctx, 3.2); ctx.fillStyle = '#fbf8ee'; ctx.beginPath(); ctx.ellipse(0, -12, 124, 15, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d6b45a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -12, 134, 17, 0, 0, TAU); ctx.stroke(); ctx.restore(); };
/* what the platter holds at time lt: the kind, the clip that grows a pile, a squash */
function platterState(lt) {
  const x = tkX(lt), s = { x, y: CT + 8, kind: 'turkey', carve: sg(lt, CUE.carve, CUE.carve + .36), jig: 0, grow: 1, hide: 0 };
  if (lt >= 30.3) {   /* the pie: an empty plate under the blender's spigot, a flat beige puddle that grows, then under the press, then the beige pie */
    if (lt < 32.0) { s.x = LINE.X4 + 26; s.kind = 'puddle'; s.grow = ss(lt, 31.82, 32.02); }
    else if (lt < CUE.mold2 + .09) { s.x = LINE.X5; s.kind = 'puddle'; s.grow = 1; }
    else { s.x = lt < 33.03 ? LINE.X5 : LINE.X5 + 90; s.kind = 'pieMold'; s.jig = F19jig(lt, CUE.mold2 + .09, .07, 5, 8); }
    return s;
  }
  if (lt >= CUE.carve + .5) s.kind = 'turkeySlices';
  if (lt >= CUE.chop) { s.kind = 'turkeyChop'; s.jig = F19jig(lt, CUE.chop, .16, 5, 7); }
  if (x >= LINE.X3 - 40 && lt > CUE.chop) { s.kind = 'turkeyMince'; if (lt < 11.62) s.jig = F19jig(lt, 11.4, .08, 6, 8); }
  if (lt >= CUE.blender1 - .1) { s.kind = 'empty'; }
  if (lt >= 12.16) { s.kind = 'turkeyPuree'; s.grow = ss(lt, 12.16, 12.5); }
  if (lt >= CUE.mold1 - .08) { s.kind = 'turkeyPuree'; s.grow = 1; }
  if (lt >= CUE.mold1 + .09) { s.kind = 'turkeyMold'; s.grow = 1; s.jig = F19jig(lt, CUE.mold1 + .09, .08, 5, 8); }
  return s;
}
function F19jig(lt, t0, amp, freq, damp) { if (lt < t0) return 0; const tt = lt - t0; return amp * Math.exp(-damp * tt) * Math.sin(TAU * freq * tt); }
function drawPlatter(lt, o = {}) {
  const st = platterState(lt), y = st.y;
  if (st.kind === 'empty') { EMPTY(st.x, y, 1); return st; }
  if (st.kind === 'puddle') {   /* the pie's puree: a flat glossy beige disc on the plate */
    EMPTY(st.x, y, 1); const g = st.grow; if (g > .02) { ctx.save(); ctx.translate(st.x, y - 12); ctx.fillStyle = lg(0, -16, 0, 10, [[0, BEIGE_L], [1, BEIGE_D]]); ctx.beginPath(); ctx.ellipse(0, 0, 118 * g, 15 * g + 3, 0, 0, TAU); ctx.fill(); ink(ctx, 3); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-30, -4, 40 * g, 4, -.1, 0, TAU); ctx.fill(); ctx.restore(); }
    return st;
  }
  ctx.save(); ctx.translate(st.x, y); ctx.transform(1 - st.jig * .5, 0, 0, 1 + st.jig, 0, 0); ctx.translate(-st.x, -y);
  if (st.grow < 1) { EMPTY(st.x, y, 1); ctx.beginPath(); ctx.rect(st.x - 200, y - 6 - 130 * st.grow, 400, 130 * st.grow + 10); ctx.clip(); }
  if (st.kind === 'pieMold') { EMPTY(st.x, y, 1); dish('pieMold', { x: st.x, y: y - 8, s: .84, t: lt, steam: .3, seed: 6 }); }
  else dish(st.kind, { x: st.x, y, s: 1, t: lt, steam: st.kind === 'turkeyMold' ? .5 : .7, seed: 5, carve: st.carve });
  ctx.restore();
  return st;
}
/* a puff of steam: the swap from one texture to the next hides in it */
function puffAt(lt, x, y, t0, r = 110, col = '#fbf4e4') { if (window.FX18 && FX18.puff) FX18.puff(ctx, { x, y, r, t: lt, t0, life: .55, color: col, n: 6, flat: .1, seed: Math.round(t0 * 10) }); }
function crumbs(lt, x, y, t0, n = 14, col = '#d9a05a', speed = 360) { if (window.FX18 && FX18.sparks) FX18.sparks(ctx, { x, y, t: lt, t0, count: n, speed, life: .5, gravity: 1100, seed: Math.round(t0 * 7), color: col }); }

function gantryBack(st, lt) {   /* two steel posts, a painted header with the station's colour stripe, a small lamp */
  const X = st.X;
  for (const dx of [-150, 150]) { ctx.fillStyle = lg(X + dx - 10, 0, X + dx + 10, 0, [[0, '#8d97a5'], [.4, '#e4e9f0'], [1, '#8d97a5']]); ctx.fillRect(X + dx - 10, HEAD - 40, 20, CT - HEAD + 40); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.strokeRect(X + dx - 10, HEAD - 40, 20, CT - HEAD + 40); }
  ctx.fillStyle = lg(0, HEAD - 46, 0, HEAD, [[0, '#dfe5ee'], [1, '#98a2b0']]); rr(X - 170, HEAD - 46, 340, 46, 8); ctx.fill(); ink(ctx, 3.6);
  ctx.fillStyle = st.col; ctx.fillRect(X - 160, HEAD - 14, 320, 8); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(X - 150, HEAD - 40, 300, 6);
}
function chip(st, lt, on = 1) {
  const sz = 38, h = hh(sz, st.X, 482, 250, 52);
  UI.pill(st.name, st.X, 482, Object.assign({ size: sz, fill: st.col, ink: '#1c1408', stroke: 'rgba(25,16,8,.85)', lw: 4, maxW: 280, weight: 900, spacing: 1.2 }, h));
}
function beltDraw(x0, x1, lt) {   /* the belt: a dark rubber strip with steel side rails and quiet chevrons that move with the platter */
  ctx.fillStyle = '#2a2d34'; ctx.fillRect(x0, CT - 6, x1 - x0, 14); ctx.fillStyle = lg(0, CT - 6, 0, CT + 8, [[0, '#3a3e48'], [1, '#22252c']]); ctx.fillRect(x0, CT - 6, x1 - x0, 6);
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 3; const off = tkX(lt) - LINE.X1, p = 150;
  ctx.beginPath(); for (let x = Math.floor((x0 - off) / p) * p + off; x < x1; x += p) { ctx.moveTo(x, CT - 2); ctx.lineTo(x + 10, CT + 1); ctx.lineTo(x, CT + 4); } ctx.stroke();
  ctx.fillStyle = lg(0, CT + 8, 0, CT + 18, [[0, '#cfd6e0'], [1, '#7e8794']]); ctx.fillRect(x0, CT + 8, x1 - x0, 12); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x0, CT + 9, x1 - x0, 3);
}
/* ---- S1 the carver: a long knife on a rod that saws across the bird while it comes down */
function knifeHead(st, lt) {
  const c = CUE.carve, u = sg(lt, c - .1, c + .42), dn = u < 1 ? ss(lt, c - .1, c + .08) * .35 + ss(lt, c + .08, c + .42) * .65 : 1 - ss(lt, c + .46, c + .7);
  const yb = lerp(742, 972, dn), sx = Math.sin((lt - c) * 46) * 58 * (lt > c - .02 && lt < c + .5 ? 1 : 0) + 6 * Math.sin(lt * 2), X = st.X + sx;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(X - 6, 0, X + 6, 0, [[0, '#8d97a5'], [.4, '#eef2f7'], [1, '#8d97a5']]); ctx.fillRect(st.X - 7, HEAD, 14, 30); ctx.fillRect(X - 7, HEAD + 30, 14, yb - HEAD - 62); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.strokeRect(X - 7, HEAD + 30, 14, yb - HEAD - 62);
  ctx.fillStyle = '#5a6270'; rr(st.X - 24, HEAD + 22, 48, 16, 5); ctx.fill(); ink(ctx, 3);
  ctx.translate(X, yb); ctx.rotate(Math.sin((lt - c) * 46 + 1) * .035 * (lt > c ? 1 : 0));
  ctx.fillStyle = '#2b2f3a'; rr(-150, -14, 56, 28, 8); ctx.fill(); ink(ctx, 3.2); ctx.fillStyle = '#5a6270'; rr(-104, -18, 14, 36, 4); ctx.fill(); ink(ctx, 3);
  ctx.fillStyle = lg(0, -14, 0, 14, [[0, '#f6f9fc'], [.5, '#c8cfda'], [1, '#8d97a5']]); ctx.beginPath(); ctx.moveTo(-92, -14); ctx.lineTo(112, -14); ctx.quadraticCurveTo(150, -6, 142, 14); ctx.lineTo(-92, 14); ctx.closePath(); ctx.fill(); ink(ctx, 3.4);
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-84, -7); ctx.lineTo(112, -7); ctx.stroke();
  ctx.restore();
}
/* ---- S2 the chopper: a pneumatic piston with a cleaver; one hard stroke at the chop cue, a bounce */
function cleaverHead(st, lt) {
  const c = CUE.chop, X = st.X, dn = ss(lt, c - .12, c), up = ss(lt, c + .1, c + .36), bounce = lt > c ? Math.sin((lt - c) * 40) * Math.exp(-(lt - c) * 14) * 7 : 0;
  const yb = lerp(790, 1012, dn) - (lt > c ? 200 * up : 0) - Math.abs(bounce);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(X - 40, 0, X + 40, 0, [[0, '#7e8794'], [.4, '#d8dee8'], [1, '#6a7380']]); rr(X - 38, HEAD, 76, 84, 8); ctx.fill(); ink(ctx, 3.6); ctx.fillStyle = st.col; ctx.fillRect(X - 38, HEAD + 54, 76, 8);
  ctx.fillStyle = lg(X - 8, 0, X + 8, 0, [[0, '#9aa3b0'], [.4, '#f4f7fb'], [1, '#8d97a5']]); ctx.fillRect(X - 8, HEAD + 84, 16, yb - 118 - HEAD - 84 + 22); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.strokeRect(X - 8, HEAD + 84, 16, yb - 118 - HEAD - 84 + 22);
  ctx.translate(X, yb);
  ctx.fillStyle = '#2b2f3a'; rr(-12, -150, 24, 40, 6); ctx.fill(); ink(ctx, 3);
  ctx.fillStyle = lg(-80, 0, 80, 0, [[0, '#8d97a5'], [.45, '#f2f5fa'], [1, '#98a2b0']]); ctx.beginPath(); ctx.moveTo(-80, -110); ctx.lineTo(76, -110); ctx.quadraticCurveTo(86, -108, 86, -96); ctx.lineTo(86, 0); ctx.lineTo(-80, 0); ctx.closePath(); ctx.fill(); ink(ctx, 3.6);
  ctx.fillStyle = 'rgba(30,36,48,.5)'; ctx.beginPath(); ctx.arc(52, -84, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-72, -4); ctx.lineTo(80, -4); ctx.stroke();
  ctx.restore();
}
/* ---- S3 the grinder: a hopper, a body with a crank, a nozzle that drops crumbly strands while the platter passes */
function grinder(st, lt) {
  const X = st.X, a = lt * 14;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(X - 110, 0, X + 110, 0, [[0, '#7e8794'], [.35, '#e4e9f0'], [1, '#7e8794']]); rr(X - 110, 700, 220, 168, 14); ctx.fill(); ink(ctx, 3.8); ctx.fillStyle = st.col; ctx.fillRect(X - 110, 740, 220, 10);
  ctx.fillStyle = lg(0, 600, 0, 700, [[0, '#cfd6e0'], [1, '#98a2b0']]); ctx.beginPath(); ctx.moveTo(X - 100, 596); ctx.lineTo(X + 100, 596); ctx.lineTo(X + 56, 702); ctx.lineTo(X - 56, 702); ctx.closePath(); ctx.fill(); ink(ctx, 3.8);
  ctx.fillStyle = '#d8a35a'; ctx.beginPath(); ctx.ellipse(X, 598 + 4 * Math.sin(lt * 20), 70, 12, 0, 0, TAU); ctx.fill(); ink(ctx, 3);
  ctx.fillStyle = '#5a6270'; rr(X - 22, 868, 44, 40, 6); ctx.fill(); ink(ctx, 3.2);
  ctx.save(); ctx.translate(X + 118, 790); ctx.fillStyle = '#c3cad6'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill(); ink(ctx, 3.4); ctx.rotate(a); ctx.fillStyle = '#5a6270'; rr(-6, -62, 12, 62, 5); ctx.fill(); ink(ctx, 3); ctx.fillStyle = '#d34a2a'; ctx.beginPath(); ctx.arc(0, -66, 12, 0, TAU); ctx.fill(); ink(ctx, 3); ctx.restore();
  ctx.restore();
}
/* ---- S4 the blender: an upright jar on a steel shelf; the platter's mince flies in, the motor whines up, a smooth beige pours out of the spigot. The same machine takes the pie (30.4 .. 32.0) */
function blenderState(lt) {   /* { on, fill, color, lid, spig } */
  if (lt >= 30.3) {
    const drop = ss(lt, 30.43, 30.53), pour = ss(lt, 31.82, 32.0);
    return { on: ss(lt, CUE.blender2, CUE.blender2 + .12) * (1 - ss(lt, 31.78, 31.86)), fill: lt < 30.43 ? 0 : lerp(0, .62, drop) * (1 - pour), color: mixc('#8a5a2c', BEIGE, ss(lt, 30.95, 31.6)), lid: lt < 30.43 ? 1 : 1 - ss(lt, 30.5, 30.56), spig: [31.78, 32.05], pie: true };
  }
  const swirl = mixc('#a8723a', BEIGE, ss(lt, CUE.blender1 + .6, 12.1));
  return { on: ss(lt, CUE.blender1, CUE.blender1 + .12) * (1 - ss(lt, 12.2, 12.3)), fill: lt < CUE.blender1 - .02 ? 0 : lt < 12.2 ? .6 : .6 * (1 - ss(lt, 12.2, 12.42)), color: swirl, lid: Math.max(0, pulse(lt, 11.6, 30, .06)) * .35, spig: [12.12, 12.52] };
}
function blenderStation(st, lt) {
  const X = st.X, B = blenderState(lt), sh = B.on * Math.sin(lt * 90) * 1.6;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(0, 840, 0, 860, [[0, '#dfe5ee'], [1, '#8d97a5']]); rr(X - 150, 840, 300, 18, 5); ctx.fill(); ink(ctx, 3.4);
  if (hasF('blender')) dish('blender', { x: X + sh, y: 840, s: .94, fill: B.fill, color: B.color, on: B.on, lid: B.lid, t: lt, seed: 2 });
  else { ctx.fillStyle = 'rgba(214,236,246,.4)'; ctx.fillRect(X - 70, 590, 140, 250); ink(ctx, 3); }
  ctx.restore();
  /* the spigot under the shelf and the ribbon it pours onto the plate */
  ctx.fillStyle = '#5a6270'; rr(X - 18, 858, 36, 30, 6); ctx.fill(); ink(ctx, 3.2);
  const [p0, p1] = B.spig;
  if (lt > p0 && lt < p1 + .12) { const k = sg(lt, p0, p0 + .08), e = sg(lt, p1, p1 + .12), yb = lerp(888, 936, k), yt = lerp(888, 946, e), w = 20 + 6 * Math.sin(lt * 40);
    ctx.fillStyle = BEIGE; ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X - w / 2, yt); ctx.lineTo(X + w / 2, yt); ctx.lineTo(X + w / 2 - 3, yb); ctx.lineTo(X - w / 2 + 3, yb); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}
/* ---- S5 the mould press: a silicone turkey mould on a piston; down with a thump at the cue, up with a wet suction */
function moldPress(st, lt, c = CUE.mold1, kind = 'turkey') {
  const X = st.X, dn = ss(lt, c - .2, c), up = ss(lt, c + .12, c + .4), yb = lerp(800, 986, dn) - 190 * up, stretch = lt > c + .1 && lt < c + .3 ? Math.sin((lt - c - .1) / .2 * PI) * 16 : 0, squash = lt > c ? Math.max(0, 1 - (lt - c) / .12) * 10 : 0;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(X - 44, 0, X + 44, 0, [[0, '#7e8794'], [.4, '#d8dee8'], [1, '#6a7380']]); rr(X - 44, HEAD, 88, 90, 10); ctx.fill(); ink(ctx, 3.6); ctx.fillStyle = st.col; ctx.fillRect(X - 44, HEAD + 58, 88, 8);
  ctx.fillStyle = lg(X - 10, 0, X + 10, 0, [[0, '#9aa3b0'], [.4, '#f4f7fb'], [1, '#8d97a5']]); ctx.fillRect(X - 10, HEAD + 90, 20, Math.max(0, yb - 130 - HEAD - 90 + 30)); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.strokeRect(X - 10, HEAD + 90, 20, Math.max(0, yb - 130 - HEAD - 90 + 30));
  ctx.translate(X, yb); ctx.scale(1 + squash * .012, 1 - squash * .01);
  ctx.fillStyle = '#6a7380'; rr(-110, -150, 220, 30, 8); ctx.fill(); ink(ctx, 3.4);
  ctx.fillStyle = lg(-170, 0, 170, 0, [[0, '#d9c7a3'], [.5, '#f1e6cd'], [1, '#bfa97e']]);
  if (kind === 'pie') { ctx.beginPath(); ctx.moveTo(-170, -26); ctx.bezierCurveTo(-176, -52, -150, -60, -120, -58); ctx.lineTo(120, -58); ctx.bezierCurveTo(150, -60, 176, -52, 170, -26); ctx.lineTo(166, stretch); ctx.lineTo(-166, stretch); ctx.closePath(); ctx.fill(); ink(ctx, 3.8); ctx.fillStyle = BEIGE_D; for (let i = 0; i < 17; i++) { ctx.beginPath(); ctx.arc(-160 + i * 20, stretch - 2, 9, 0, PI); ctx.fill(); } ctx.fillStyle = '#6a7380'; rr(-60, -86, 120, 30, 8); ctx.fill(); ink(ctx, 3); }
  else { ctx.beginPath(); ctx.moveTo(-176, 0 + stretch * .5); ctx.bezierCurveTo(-182, -90, -110, -128, -70, -122); ctx.bezierCurveTo(-30, -138, 30, -138, 70, -122); ctx.bezierCurveTo(110, -128, 182, -90, 176, 0 + stretch * .5); ctx.lineTo(176, stretch); ctx.lineTo(-176, stretch); ctx.closePath(); ctx.fill(); ink(ctx, 3.8);
  ctx.strokeStyle = 'rgba(150,120,80,.6)'; ctx.lineWidth = 3; for (const dx of [-110, -66, -22, 22, 66, 110]) { ctx.beginPath(); ctx.moveTo(dx, -112); ctx.quadraticCurveTo(dx * 1.05, -60, dx * .95, -14); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-80, -100, 50, 8, -.2, 0, TAU); ctx.fill();
  ctx.restore();
}
/* the row of samples on the pass at the end of the line: the five textures, golden to beige, tidy (a tray of small plates) */
function sampleRow(x, lt, appear = 1) {
  ctx.save(); ctx.fillStyle = lg(0, CT + 52, 0, CT + 70, [[0, '#e4e9f0'], [1, '#98a2b0']]); rr(x - 320, CT + 52, 640, 18, 6); ctx.fill(); ink(ctx, 3.4); ctx.fillStyle = 'rgba(30,36,48,.25)'; ctx.fillRect(x - 316, CT + 70, 632, 8); ctx.restore();
  ['turkey', 'turkeySlices', 'turkeyChop', 'turkeyMince', 'turkeyPuree'].forEach((k, i) => { dish(k, { x: x - 250 + i * 125, y: CT + 54, s: .32, t: lt, seed: 7 + i, alpha: appear, steam: 0 }); });
}
function lineFront(lt) {   /* the heads, drawn over the platter */
  knifeHead(STN[0], lt); cleaverHead(STN[1], lt); moldPress(STN[4], lt, lt > 20 ? CUE.mold2 : CUE.mold1, lt > 20 ? 'pie' : 'turkey');
}
function lineMid(lt, x0, x1) {   /* the grinder and the blender sit behind the platter (drawn before it) */
  grinder(STN[2], lt); blenderStation(STN[3], lt);
}


// ------------------------------------------------------------------ THE VISCOSITY GAG: the THICK-IT dispenser: coffee in at the top, a scoop of powder, three taps; nectar, honey and pudding race into three cups
const SPOUT = [{ x: PX - 210, v: .25, w: 22, cue: CUE.glop1, name: 'NECTAR', col: '#d9a23a', word: wS('c4', 0) }, { x: PX, v: .5, w: 26, cue: CUE.glop2, name: 'HONEY', col: '#e8b83a', word: wS('c4', 1) }, { x: PX + 210, v: 1, w: 40, cue: CUE.glop3, name: 'PUDDING', col: '#c9a870', word: wS('c4', 2) }];
const SPY = 758, CUPY = CT - 2, CUPS = .92;           /* the spout tips, the counter the cups stand on, the cups' scale */
const RIMY = CUPY - 134 * CUPS;                       /* about where the surface sits in a full cup */
const LEVER = CUE.pour + .9;                          /* the lever is pulled at 18.18: the taps open */
function pourTimes(sp, i) {
  const probe = F19pour({ x0: sp.x, y0: SPY, x1: sp.x, y1: RIMY + 24, t: -9, t0: 0, t1: sp.v >= 1 ? 1.2 : .6, visc: sp.v, width: sp.w }) || { lands: sp.v >= 1 ? 1.2 : .4 };
  const t0 = sp.cue - probe.lands;
  return { t0, t1: t0 + (sp.v >= 1 ? 1.2 : .6), lands: sp.cue, ends: t0 + probe.ends };
}
function F19pour(o) {   /* F19.pour when it exists; else a plain tapered ribbon (a stand-in: the lump of pudding is a fat drop) */
  if (window.F19 && typeof F19.pour === 'function') return F19.pour(ctx, o);
  const lands = o.t0 + (o.visc >= 1 ? 1.1 : .3 + .2 * o.visc), ends = o.t1 + .3;
  if (o.t > lands - .3 && o.t < ends) { ctx.fillStyle = o.visc >= 1 ? '#b88a52' : '#5a3418'; ctx.fillRect(o.x0 - (o.width || 14) / 2, o.y0, o.width || 14, Math.max(0, (o.y1 - o.y0) * c01((o.t - o.t0) / (lands - o.t0)))); }
  return { lands, ends };
}
let PT_ = null; const getPT = () => PT_ || (PT_ = SPOUT.map(pourTimes));
function cupFill(i, lt) {   /* the fill level of cup i: a little to start, up with the pour (landing .. ending) */
  const sp = SPOUT[i], pt = getPT()[i], u = sg(lt, pt.lands, pt.ends);
  return sp.v >= 1 ? lerp(.18, .95, ss(lt, pt.lands - .05, pt.lands + .2)) : lerp(.18, .86, u);
}
function drawCups(lt, o = {}) {
  SPOUT.forEach((sp, i) => { if (i === 2 && lt >= 20.98 && lt < 30) return; dish('coffee', { x: sp.x, y: CUPY, s: CUPS, thick: i === 0 ? .35 : i === 1 ? .7 : 1, fill: o.fill ? o.fill(i, lt) : cupFill(i, lt), t: lt, seed: 11 + i, steam: i === 2 ? 0 : .5 * ss(lt, getPT()[i].lands, getPT()[i].lands + .4) }); });
}
function drawStreams(lt) {
  SPOUT.forEach((sp, i) => { const pt = getPT()[i]; if (lt < pt.t0 - .01 || (i === 2 && lt >= 20.98 && lt < 30)) return; F19pour({ x0: sp.x, y0: SPY, x1: sp.x, y1: RIMY + 24, t: lt, t0: pt.t0, t1: pt.t1, visc: sp.v, width: sp.w, keep: sp.v >= 1 }); });
}
/* the dispenser: a steel box on the wall with a clear hopper on top, a display, three spouts with coloured rings, a lever on the right, three labels that light as the words are spoken */
function dispenser(lt, o = {}) {
  const x0 = PX - 330, x1 = PX + 330, y0 = 470, y1 = 722, lev = ss(lt, LEVER - .1, LEVER + .05) * (1 - ss(lt, LEVER + .25, LEVER + .5));
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#d8dee8'], [.5, '#b4bdca'], [1, '#8d97a5']]); rr(x0, y0, x1 - x0, y1 - y0, 16); ctx.fill(); ink(ctx, 4);
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x0 + 16, y0 + 12, 120, 8); ctx.fillStyle = '#2b2f3a'; rr(PX - 110, y0 + 18, 220, 56, 10); ctx.fill(); ink(ctx, 3);
  UI.label('THICK-IT', PX, y0 + 47, Object.assign({ size: 40, font: 'Bangers', weight: 400, fill: '#9ff0b8', spacing: 3, maxW: 200 }, hh(40, PX, y0 + 47, 190, 44)));
  /* the hopper: a clear funnel; the level of coffee in it and a cloud of powder when the scoop tips */
  const hl = lt < CUE.pour ? 0 : lt < LEVER ? ss(lt, CUE.pour + .2, CUE.pour + .85) * .8 : .8 * (1 - ss(lt, LEVER, LEVER + 1.6));
  ctx.fillStyle = 'rgba(214,236,246,.34)'; ctx.beginPath(); ctx.moveTo(PX - 110, 378); ctx.lineTo(PX + 110, 378); ctx.lineTo(PX + 64, y0 + 2); ctx.lineTo(PX - 64, y0 + 2); ctx.closePath(); ctx.fill();
  if (hl > .02) { ctx.save(); ctx.beginPath(); ctx.moveTo(PX - 106, 382); ctx.lineTo(PX + 106, 382); ctx.lineTo(PX + 62, y0); ctx.lineTo(PX - 62, y0); ctx.closePath(); ctx.clip(); const top = lerp(y0, 396, hl); ctx.fillStyle = lt > 18.1 ? mixc('#4a2a14', '#c9a56e', ss(lt, 18.1, 18.2)) : '#4a2a14'; ctx.fillRect(PX - 120, top, 240, y0 - top + 4); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(PX - 120, top, 240, 5); ctx.restore(); }
  ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PX - 110, 378); ctx.lineTo(PX + 110, 378); ctx.lineTo(PX + 64, y0 + 2); ctx.lineTo(PX - 64, y0 + 2); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#5a6270'; rr(PX - 120, 368, 240, 14, 6); ctx.fill(); ink(ctx, 3);
  /* the three spouts, each with a coloured ring */
  for (const sp of SPOUT) { ctx.fillStyle = lg(sp.x - 28, 0, sp.x + 28, 0, [[0, '#7e8794'], [.4, '#e4e9f0'], [1, '#6a7380']]); rr(sp.x - 28, y1 - 4, 56, 44, 8); ctx.fill(); ink(ctx, 3.4); ctx.fillStyle = sp.col; ctx.fillRect(sp.x - 28, y1 + 10, 56, 8); ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.ellipse(sp.x, y1 + 40, 18, 5, 0, 0, TAU); ctx.fill(); }
  /* the lever on the right: pulled down at LEVER */
  ctx.save(); ctx.translate(x1 + 4, 586); ctx.rotate(lev * .9 - .3); ctx.fillStyle = '#8d97a5'; rr(-8, -8, 16, 92, 7); ctx.fill(); ink(ctx, 3); ctx.fillStyle = '#d63a2e'; ctx.beginPath(); ctx.arc(0, 92, 20, 0, TAU); ctx.fill(); ink(ctx, 3.4); ctx.restore();
  ctx.restore();
  if (lt > LEVER) V2.glow(PX, 740, 280, '160,255,190', .22 * (1 - ss(lt, LEVER + 1.5, LEVER + 3)), 'screen', .2);
}
function dispLabels(lt) {   /* NECTAR / HONEY / PUDDING appear as the words are spoken: chips under the display (hero text) */
  for (const sp of SPOUT) { const k = ss(lt, sp.word - .05, sp.word + .12); if (k < .02) continue;
    const y = 650, sz = 34, h = hh(sz, sp.x, y, 190, 48);
    ctx.save(); ctx.translate(sp.x, y); const pop = 1 + .12 * Math.sin(k * PI); ctx.scale(pop, pop); ctx.translate(-sp.x, -y);
    UI.pill(sp.name, sp.x, y, Object.assign({ size: sz, fill: sp.col, ink: '#1c1408', stroke: 'rgba(25,16,8,.9)', lw: 4, maxW: 206, weight: 900, spacing: .6 }, h)); ctx.restore(); }
}
/* a gloved arm from outside the frame to a hand at (hx, hy): the series' dark limb and white glove; ang = the direction the arm comes from */
function gloveArm(hx, hy, fromAng, o = {}) {
  const L = o.len ?? 900, w = o.w ?? 30, dx = Math.cos(fromAng), dy = Math.sin(fromAng), sx = hx + dx * L, sy = hy + dy * L;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx + dx * 14, hy + dy * 14); ctx.stroke();
  ctx.fillStyle = '#4a4258'; ctx.save(); ctx.translate(hx + dx * 18, hy + dy * 18); ctx.rotate(fromAng + PI); rr(-6, -w * .6, 14, w * 1.2, 4); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#f6f7fb'; ctx.strokeStyle = 'rgba(29,26,34,.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(hx, hy, 26, 24, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(hx - 4, hy + 20, 11, 8, .5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* the coffee pot (a steel pot with a black handle and a spout) held by a glove at its handle; returns where the spout tip is */
function potDraw(hx, hy, tilt, o = {}) {
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(tilt); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(-70, 0, 70, 0, [[0, '#737d8b'], [.55, '#f1f4f9'], [1, '#8d97a5']]); ctx.beginPath(); ctx.moveTo(-60, -122); ctx.lineTo(50, -122); ctx.lineTo(62, 6); ctx.lineTo(-74, 6); ctx.closePath(); ctx.fill(); ink(ctx, 3.8);
  ctx.beginPath(); ctx.moveTo(50, -122); ctx.lineTo(104, -144); ctx.lineTo(58, -102); ctx.closePath(); ctx.fillStyle = '#c3cad6'; ctx.fill(); ink(ctx, 3.4);   /* the spout, to the right */
  ctx.fillStyle = '#2b2f3a'; rr(-88, -114, 26, 100, 12); ctx.fill(); ink(ctx, 3); ctx.fillStyle = '#e8ecf3'; rr(-50, -140, 90, 22, 8); ctx.fill(); ink(ctx, 3.4); ctx.beginPath(); ctx.arc(-5, -146, 9, 0, TAU); ctx.fill(); ink(ctx, 3);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(24, -112, 10, 100);
  ctx.restore();
  const c = Math.cos(tilt), sn = Math.sin(tilt), rot = (lx, ly) => [hx + lx * c - ly * sn, hy + lx * sn + ly * c];
  return { spout: rot(104, -144), handle: rot(-75, -64) };
}
function scoopDraw(hx, hy, rot, fill) {   /* a powder scoop with a long handle in a glove; (hx, hy) = the hand */
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUTL; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-96, 0); ctx.stroke(); ctx.strokeStyle = '#dfe5ee'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-96, 0); ctx.stroke();
  ctx.translate(-110, 0); ctx.fillStyle = lg(0, -30, 0, 30, [[0, '#f4f7fb'], [1, '#98a2b0']]); ctx.beginPath(); ctx.moveTo(8, -26); ctx.bezierCurveTo(-52, -34, -62, 34, 8, 26); ctx.closePath(); ctx.fill(); ink(ctx, 3.4);
  if (fill > .02) { ctx.fillStyle = '#fbfaf4'; ctx.beginPath(); ctx.ellipse(-8, -8, 30 * fill + 6, 12 + 12 * fill, -.2, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(25,10,20,.55)'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
}
function shelfTub(x, lt) {   /* the tub on a steel shelf on the back wall (behind whoever stands at the counter) */
  ctx.save(); ctx.fillStyle = lg(0, 856, 0, 872, [[0, '#dfe5ee'], [1, '#8d97a5']]); rr(x - 130, 856, 260, 16, 5); ctx.fill(); ink(ctx, 3.4); ctx.strokeStyle = '#7e8794'; ctx.lineWidth = 6; for (const dx of [-110, 110]) { ctx.beginPath(); ctx.moveTo(x + dx, 872); ctx.lineTo(x + dx, 930); ctx.stroke(); } ctx.restore();
  tubDraw(x, 856, lt);
}
function tubDraw(x, y, lt) {   /* the THICK-IT tub: a white tub with a blue lid and a label */
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(20,16,12,.22)'; ctx.beginPath(); ctx.ellipse(0, 4, 100, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(-92, 0, 92, 0, [[0, '#cdd5e0'], [.4, '#ffffff'], [1, '#b4bdcb']]); ctx.beginPath(); ctx.moveTo(-84, -176); ctx.lineTo(84, -176); ctx.lineTo(92, 0); ctx.lineTo(-92, 0); ctx.closePath(); ctx.fill(); ink(ctx, 3.8);
  ctx.fillStyle = '#2f6fd0'; rr(-92, -214, 184, 42, 10); ctx.fill(); ink(ctx, 3.8); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-80, -208, 160, 8);
  ctx.fillStyle = '#2f6fd0'; ctx.fillRect(-84, -150, 168, 80); ctx.restore();
  UI.label('THICK-IT', x, y - 110, Object.assign({ size: 38, font: 'Bangers', weight: 400, fill: '#ffffff', spacing: 3, maxW: 150, crop: true }, hh(38, x, y - 110, 150, 40)));
  UI.label('FOOD THICKENER', x, y - 78, { size: 14, weight: 900, fill: '#dfeaff', spacing: 1, maxW: 150, hero: false, crop: true });
}
/* the pr1 action: the pot pours thin coffee into the hopper, the scoop tips its powder in, a glove pulls the lever */
function pr1Action(lt) {
  const t0 = CUE.pour, tEnd = 18.0;
  /* the pot: held by a glove from the left, tipping clockwise over the hopper so the spout hangs right above it; it lifts away when the pour is done */
  const tilt = .08 + .6 * ss(lt, t0 - .12, t0 + .1) * (1 - ss(lt, tEnd, tEnd + .14)), lift = ss(lt, tEnd + .02, tEnd + .22) * 220 + (1 - ss(lt, t0 - .3, t0 - .1)) * 160;
  const hx = PX - 214, hy = 392 - lift + 5 * Math.sin(lt * 3);
  const pot = potDraw(hx, hy, tilt); gloveArm(pot.handle[0], pot.handle[1], PI * 1.02, { len: 800 });
  if (lt > t0 - .02 && lt < tEnd + .5) F19pour({ x0: pot.spout[0], y0: pot.spout[1] + 4, x1: pot.spout[0], y1: 452, t: lt, t0, t1: tEnd, visc: 0, width: 14 });
  /* the scoop: from the tub (upper right) over to the hopper, tips at 17.9; then the glove goes for the lever */
  const a = ss(lt, CUE.pour + .1, CUE.pour + .45), b = ss(lt, 17.62, 17.9), tip = ss(lt, 17.9, 18.04), toLev = ss(lt, 18.06, 18.18), pull = ss(lt, LEVER - .06, LEVER + .06);
  const sx = lerp(lerp(PX + 570, PX + 150, b), PX + 400, toLev), sy = lerp(lerp(650, 330, b), 560 + 40 * pull, toLev) - 20 * Math.sin(a * PI);
  const full = (1 - tip) * ss(lt, CUE.pour + .35, CUE.pour + .5);
  if (lt < 18.2) { gloveArm(sx, sy, -.05 + .1 * (1 - toLev), { len: 700 }); scoopDraw(sx - 14, sy - 6, -.3 + .9 * tip, full); }
  else gloveArm(PX + 380, 600 + 52 * (pull < 1 ? pull : 1 - ss(lt, LEVER + .25, LEVER + .5)), .1, { len: 800 });
  if (lt > 17.93 && lt < 18.5) { puffAt(lt, PX, 420, 17.95, 70, '#ffffff'); for (let i = 0; i < 16; i++) { const age = lt - 17.92 - i * .008; if (age < 0 || age > .35) continue; ctx.fillStyle = 'rgba(255,255,255,' + (.9 * (1 - age / .35)) + ')'; ctx.beginPath(); ctx.arc(PX - 20 + sr(i, 1) * 80 - 40, 330 + age * 380 + sr(i, 2) * 20, 3 + sr(i, 3) * 3, 0, TAU); ctx.fill(); } }
}

// ------------------------------------------------------------------ THE SERVICE WINDOW: a hatch in the wall to the corridor; Pineapple stands outside, the bell and the pie box on the sill
const WH = { x0: WIN.x, y0: WIN.y, x1: WIN.x + WIN.w, y1: WIN.y + WIN.h };   /* the opening */
function corridor(lt) {   /* seen through the hatch: a warm hallway, a door, a handrail, ceiling lights (the caller blurs it) */
  const { x0, y0, x1, y1 } = WH; ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#efdcc0'], [1, '#d9c09a']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#b98a5a'; ctx.fillRect(x0, 830, x1 - x0, 200); ctx.fillStyle = 'rgba(60,30,10,.25)'; ctx.fillRect(x0, 830, x1 - x0, 8);
  ctx.fillStyle = '#8a5a30'; ctx.fillRect(x0, 760, x1 - x0, 14); ctx.fillStyle = '#d9a86a'; ctx.fillRect(x0, 760, x1 - x0, 5);   /* the handrail */
  ctx.fillStyle = '#7a5a3a'; rr(x0 + 40, y0 + 40, 120, 300, 6); ctx.fill(); ink(ctx, 3); ctx.fillStyle = '#d9c18a'; ctx.fillRect(x0 + 60, y0 + 70, 80, 120);   /* a door */
  ctx.fillStyle = '#f4efe0'; rr(x1 - 190, y0 + 90, 130, 100, 6); ctx.fill(); ink(ctx, 3); ctx.fillStyle = '#a8c9a0'; ctx.fillRect(x1 - 178, y0 + 104, 106, 72);   /* a framed picture */
  V2.glow((x0 + x1) / 2, y0 + 10, 360, '255,236,200', .5, 'screen', .2);
  ctx.restore();
}
function hatchWall(x0, x1, lt, drawWall) {   /* draw the wall everywhere except the opening (an even-odd clip) */
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 100, -700, x1 - x0 + 200, 3000); ctx.rect(WH.x0, WH.y0, WH.x1 - WH.x0, WH.y1 - WH.y0); ctx.clip('evenodd'); drawWall(); ctx.restore();
  /* the frame: a steel surround, the rolled-up shutter box at the top, the sill */
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = lg(0, WH.y0 - 20, 0, WH.y1 + 20, [[0, '#e4e9f0'], [1, '#8d97a5']]); ctx.lineWidth = 22; ctx.strokeRect(WH.x0 - 6, WH.y0 - 6, WH.x1 - WH.x0 + 12, WH.y1 - WH.y0 + 12); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.strokeRect(WH.x0 - 17, WH.y0 - 17, WH.x1 - WH.x0 + 34, WH.y1 - WH.y0 + 34); ctx.strokeRect(WH.x0 + 5, WH.y0 + 5, WH.x1 - WH.x0 - 10, WH.y1 - WH.y0 - 10);
  ctx.fillStyle = lg(0, WH.y0 - 52, 0, WH.y0 - 14, [[0, '#c3cad6'], [1, '#7e8794']]); rr(WH.x0 - 20, WH.y0 - 56, WH.x1 - WH.x0 + 40, 40, 8); ctx.fill(); ink(ctx, 3.6);
  ctx.fillStyle = '#c33a2e'; ctx.fillRect(WH.x0 + 20, WH.y0 - 44, 90, 12); ctx.restore();
}
function bellDraw(x, lt, hit) {   /* the service bell: a steel dome with a plunger; it dips and rings at the cue */
  const k = lt >= hit ? Math.exp(-(lt - hit) * 7) : 0, dip = lt >= hit && lt < hit + .12 ? 7 * (1 - (lt - hit) / .12) : 0, sh = Math.sin((lt - hit) * 70) * 3 * k;
  ctx.save(); ctx.translate(x + sh, CT + 4); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(20,16,12,.22)'; ctx.beginPath(); ctx.ellipse(0, 2, 52, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6a7380'; rr(-48, -12, 96, 12, 5); ctx.fill(); ink(ctx, 3);
  ctx.fillStyle = lg(-44, 0, 44, 0, [[0, '#aeb7c3'], [.35, '#f6f9fc'], [1, '#8d97a5']]); ctx.beginPath(); ctx.moveTo(-44, -12); ctx.bezierCurveTo(-44, -66, 44, -66, 44, -12); ctx.closePath(); ctx.fill(); ink(ctx, 3.6);
  ctx.fillStyle = '#d8dee8'; ctx.beginPath(); ctx.arc(0, -64 + dip, 11, 0, TAU); ctx.fill(); ink(ctx, 3); ctx.restore();
  if (lt >= hit && lt < hit + .55) { V2.ring(x, CT - 40, (lt - hit) / .55, { r0: 30, r1: 190, color: '255,236,190', lw: 6, alpha: .7 }); V2.ring(x, CT - 40, Math.max(0, (lt - hit - .1) / .55), { r0: 20, r1: 140, color: '255,255,255', lw: 4, alpha: .5 }); }
}
function emptyTin(x, y, s) {   /* the foil pie tin, empty: a few crumbs and a pecan */
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.fillStyle = lg(-150, 0, 150, 0, [[0, '#aeb7c3'], [.4, '#eef2f7'], [1, '#8d97a5']]); ctx.beginPath(); ctx.moveTo(-150, -34); ctx.lineTo(150, -34); ctx.lineTo(118, 6); ctx.lineTo(-118, 6); ctx.closePath(); ctx.fill(); ink(ctx, 3.6);
  ctx.fillStyle = '#c9d0db'; ctx.beginPath(); ctx.ellipse(0, -34, 150, 22, 0, 0, TAU); ctx.fill(); ink(ctx, 3.6); ctx.fillStyle = '#9aa3b0'; ctx.beginPath(); ctx.ellipse(0, -32, 124, 15, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a5a2c'; for (const [cx, cy, r] of [[-60, -30, 7], [22, -26, 6], [70, -33, 5], [-20, -36, 5]]) { ctx.beginPath(); ctx.ellipse(cx, cy, r, r * .6, .4, 0, TAU); ctx.fill(); } ctx.restore();
}
function pieBoxDraw(x, lt, o = {}) {   /* the bakery box on the sill: its lid open behind (part 'back'), the body and the pie in its foil tin in front (part 'front'); bs scales it */
  const op = o.open ?? 1, bs = o.bs ?? 1, part = o.part;
  if (part !== 'front') {
    ctx.save(); ctx.translate(x, CT + 2); ctx.scale(bs, bs); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(244,236,216,.98)'; ctx.beginPath(); ctx.moveTo(-112, -52); ctx.lineTo(112, -52); ctx.lineTo(96, -52 - 150 * op); ctx.lineTo(-96, -52 - 150 * op); ctx.closePath(); ctx.fill(); ink(ctx, 3.6 / bs);
    ctx.fillStyle = 'rgba(214,236,246,.5)'; rr(-72, -52 - 130 * op, 144, 90 * op, 6); ctx.fill(); ctx.restore();
  }
  if (part !== 'back') {
    ctx.save(); ctx.translate(x, CT + 2); ctx.scale(bs, bs); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(20,16,12,.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 118, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(0, -50, 0, 0, [[0, '#f4ecd8'], [1, '#d9ccb0']]); rr(-112, -52, 224, 52, 8); ctx.fill(); ink(ctx, 3.6 / bs);
    ctx.fillStyle = '#c33a2e'; ctx.fillRect(-112, -34, 224, 7); ctx.restore();
    if (o.pie !== false) dish('pie', { x, y: CT - 20 * bs, s: (o.ps ?? .52) * bs, t: lt, steam: 0, seed: 4, plat: false });
  }
}
/* Pineapple: outside the hatch; the bell on the sill and the box beside it; her acting by line */
function actPine(lt, id) {
  const A = { expr: 'neutral', look: [-.4, .1], arms: { l: 'rest', r: 'rest' }, who: 'pine' };
  const bell = CUE.bell;
  if (lt < bell + .45) { const reach = ss(lt, bell - .25, bell - .02) * (1 - ss(lt, bell + .08, bell + .4)); Object.assign(A, { arms: { l: 'hold', r: 'rest' }, grip: { l: [lerp(-80, -118, reach), lerp(50, 74, reach)] }, hand: { l: 'flat' } }); }
  if (id === 'w1') Object.assign(A, { look: [-.5, .05], expr: lt < bell + .1 ? 'neutral' : 'happy' });
  if (id === 'p2') Object.assign(A, { expr: 'angry', arms: { l: 'hips', r: 'hips' }, look: [-.2, 0], browUp: 4 });
  if (id === 'p3') Object.assign(A, { expr: 'angry', arms: { l: 'hips', r: 'up' }, look: [.1, -.05] });
  if (id === 'p4') Object.assign(A, { expr: 'hopeful', arms: { l: 'rest', r: 'rest' }, look: [.35, .25] });
  if (id === 'c7') Object.assign(A, { expr: 'angry', arms: { l: 'hips', r: 'hips' }, look: [.4, 0], yaw: .5 });
  if (id === 'c8' || id === 'end') Object.assign(A, { expr: lt < CUE.sting ? 'hopeful' : 'sad', look: [.05, .45], lid: lt >= CUE.sting ? .3 : undefined });
  return A;
}

/* @@KITCHEN-PART8 */



// ------------------------------------------------------------------ the shots: a camera (zoomTo: the world point at the frame centre, and the zoom), the cast and where it stands
const SHOTS = [];
const shot = (id, s, e, cam, o) => SHOTS.push(Object.assign({ id, s, e, cam }, o));
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s - 1e-6) r = sh; return r; };
function faceCam(o, z, up = 120, dx = 0) { const [fx, fy] = faceC(o); return [fx + dx / z, fy + up / z, z]; }   /* the world point that puts the face at (540 + dx, 960 - up) on the screen */
const WIDE = u => [655, 800, lerp(.88, .91, u)];
const CE = LINE.X5 + 90;                                      /* where the finished platter stands at the end of the line */
const SX = { straw: 3150, chef: 3860 };                       /* Strawberry and Chef at the end of the line */
const WS = { straw: 6200, pine: 6540, chef: 6990 };           /* ... and at the service window */
const PC = { chef: PX - 340, straw: PX + 330 };               /* ... and at the dispenser */
shot('open', 0, 1.40, WIDE, { z: 'T', cast: { chef: { x: HOME.chef, yaw: .25 }, mango: { x: HOME.mango, yaw: -.3 } }, cloche: 1 });
shot('c1a', 1.40, 3.20, (u, lt, C) => faceCam(C.chef, 1.75 + .1 * u, 110), { z: 'T', cast: { chef: { x: HOME.chef, yaw: .18 } }, dof: 6, cloche: 1 });
shot('c1b', 3.20, 5.56, u => [425 + 6 * u, 792, 1.28 + .04 * u], { z: 'T', cast: { chef: { x: HOME.chef, yaw: -.35 } }, cloche: 1 });
shot('m1', 5.56, 6.74, (u, lt, C) => faceCam(C.mango, 2.2 + .12 * u, 150), { z: 'T', cast: { mango: { x: HOME.mango, yaw: -.5 } }, dof: 7, cloche: 1 });
shot('c2a', 6.74, 8.30, u => [880 + 12 * u, 840, 1.4 + .04 * u], { z: 'T', cast: { chef: { x: HOME.chef, yaw: .5 }, mango: { x: HOME.mango, yaw: -.3 } }, lamp: 1, cloche: 'lift' });
shot('c2b', 8.30, 10.08, (u, lt, C) => faceCam(C.chef, 1.7 + .1 * u, 100, 250), { z: 'T', cast: { chef: { x: HOME.chef, yaw: .55 } }, dof: 5, lamp: 1, cloche: 0, slide: 1 });
shot('carve', 10.08, 13.53, (u, lt) => [camX(lt) + K([[10.08, 80], [13.0, 80], [13.53, 400]], lt), K([[10.08, 872], [13.0, 872], [13.53, 900]], lt), K([[10.08, 1.34], [13.0, 1.34], [13.53, .98]], lt)], { z: 'L', line: 1, chips: 1 });
shot('s1', 13.53, 14.49, (u, lt, C) => { const c = faceCam(C.straw, 1.4 + .05 * u, 170); c[0] += 60; return c; }, { z: 'L', line: 1, cast: { straw: { x: SX.straw, yaw: .55 } }, dof: 5 });
shot('c3', 14.49, 17.28, (u, lt, C) => { const c = faceCam(C.chef, 1.55 + .08 * u, 190); c[0] -= 215 / 1.55; return c; }, { z: 'L', line: 1, cast: { chef: { x: SX.chef, yaw: -.5 } }, dof: 5 });
shot('pr1', 17.28, 18.23, u => [PX + 130, 700, 1.05], { z: 'P' });
shot('pr2', 18.23, 20.00, u => [PX, 850 + 20 * u, 1.42 + .04 * u], { z: 'P' });
shot('pr3', 20.00, 20.98, u => [PX, 800, 1.04], { z: 'P', cast: { chef: { x: PC.chef, yaw: .45 }, straw: { x: PC.straw, yaw: -.45 } } });
shot('s2', 20.98, 21.88, (u, lt, C) => faceCam(C.straw, 1.9, 130, -90), { z: 'P', cast: { straw: { x: PC.straw, yaw: -.35 } }, dof: 6 });
shot('c5', 21.88, 24.50, (u, lt, C) => faceCam(C.chef, 1.85 + .1 * u, 105, 40), { z: 'P', cast: { chef: { x: PC.chef, yaw: .3 } }, dof: 6 });
shot('w1', 24.50, 26.58, u => [6480, 840, lerp(1.08, 1.14, u)], { z: 'W', cast: { straw: { x: WS.straw, yaw: .5 }, pine: { x: WS.pine, lift: 40 } }, box: 1 });
shot('s3', 26.58, 27.70, (u, lt, C) => faceCam(C.straw, 2.0 + .06 * u, 130, 80), { z: 'W', cast: { straw: { x: WS.straw, yaw: .55 } }, dof: 6, noWin: 1 });
shot('p2', 27.70, 29.03, (u, lt, C) => faceCam(C.pine, 1.8 + .06 * u, 150), { z: 'W', cast: { pine: { x: WS.pine, lift: 40, yaw: -.1 } }, dof: 5, box: 1 });
shot('s4', 29.03, 30.43, (u, lt, C) => faceCam(C.straw, 2.0, 130, 80), { z: 'W', cast: { straw: { x: WS.straw, yaw: .55 } }, dof: 6, pieTin: 1 });
shot('sm1', 30.43, 32.00, u => [LINE.X4 + 10, 840, 1.45], { z: 'L', line: 2, chips: 0 });
shot('sm2', 32.00, 33.03, u => [LINE.X5, 860, 1.36], { z: 'L', line: 2, chips: 0 });
shot('c6', 33.03, 34.71, (u, lt, C) => { const c = faceCam(C.chef, 1.4 + .04 * u, 150); c[0] -= 300 / 1.4; return c; }, { z: 'L', line: 2, cast: { chef: { x: SX.chef, yaw: -.4 } }, dof: 5, boxEnd: 1 });
shot('p3', 34.71, 36.37, (u, lt, C) => faceCam(C.pine, 1.85 + .05 * u, 150), { z: 'W', cast: { pine: { x: WS.pine, lift: 40, yaw: .1 } }, dof: 5, plate: 1 });
shot('c7', 36.37, 38.52, u => [6735, 850, 1.4 + .03 * u], { z: 'W', cast: { pine: { x: WS.pine, lift: 40, yaw: .4 }, chef: { x: 6940, yaw: -.55, lift: 36 } }, plate: 1 });
shot('p4', 38.52, 39.50, (u, lt, C) => faceCam(C.pine, 1.85, 150), { z: 'W', cast: { pine: { x: WS.pine, lift: 40, yaw: .15 } }, dof: 5, plate: 1 });
shot('c8', 39.50, 41.34, u => [6650, 920, lerp(1.7, 1.9, u)], { z: 'W', cast: { pine: { x: WS.pine, lift: 40, yaw: .2 } }, plate: 1, sheen: 1 });
shot('end', 41.34, 42.80, u => [6650 + 20 * u, 910, lerp(1.9, 1.6, u)], { z: 'W', cast: { pine: { x: WS.pine, lift: 40, yaw: .2 } }, plate: 1 });
for (const sh of SHOTS) sh.s = sh.s === 0 ? 0 : snapT(sh.s);
for (let i = 0; i < SHOTS.length - 1; i++) SHOTS[i].e = SHOTS[i + 1].s;

function castFor(sh, lt) {
  const C = {}, c = sh.cast || {};
  if (c.straw) C.straw = STRAW(lt, c.straw, sh.id);
  if (c.mango) C.mango = MANGO(lt, c.mango, sh.id);
  if (c.chef) C.chef = CHEFO(lt, c.chef, sh.id);
  if (c.pine) C.pine = PINE(lt, c.pine, sh.id);
  return C;
}

// ------------------------------------------------------------------ the world: far to near
let FR = null;   /* { sh, C } of the frame being drawn, built in cam() */
function setLight() { V2.setLight({ key: [-.25, -.8], keyColor: '#fff4dc', keyA: .26, rim: '#cfe6ff', rimA: .34, shadow: '#1d2a2c', shadowA: .3, bounce: '#ffd9a0', bounceA: .12, amb: '#f2ffe8', ambA: .05 }); }
function litRows(lt) {   /* the diet board: row i lights as the Chef says it (from "Forty" through "diets.") */
  const t0 = [3.2, 3.55, 3.9, wS('c1', 3), wS('c1', 4), wS('c1', 4) + .38];
  return t0.map(t => ss(lt, t, t + .14));
}
function plateOnSill(x, lt, o = {}) {   /* the beige pie on its plate on the sill (F19 pieMold on an empty plate); o.sheen sweeps a glint across it */
  EMPTY(x, CT + 6, .72); dish('pieMold', { x, y: CT - 4, s: .66, t: lt, steam: .3, seed: 6 });
  if (o.sheen != null) { const k = o.sheen; if (k > 0 && k < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const gx = x - 130 + 260 * k; ctx.fillStyle = V2.grad(gx - 40, 0, gx + 40, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,252,240,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.ellipse(x, CT - 34, 120, 24, 0, 0, TAU); ctx.clip(); ctx.fillRect(gx - 40, CT - 90, 80, 90); ctx.restore(); } }
}
function drawWorld(lt) {
  const { sh, C } = FR, m = ctx.getTransform(), z = Math.hypot(m.a, m.b), x0 = CAM.x - 560 / z - 40, x1 = CAM.x + 560 / z + 40, Z = sh.z;
  const inR = (a, b) => x1 > a && x0 < b;
  setLight(); V2.opts.reflect = false; BGMODE = sh.dof > 0 ? 1 : 0;
  const wallLayer = () => {
    roomBack(x0, x1, lt);
    ctx.save(); ctx.translate(CAM.x * .12, 0); rail(x0 - CAM.x * .12, x1 - CAM.x * .12, lt); ctx.restore();
    if (inR(LINE.X1 - 400, LINE.x1 + 200)) hood(Math.max(x0 - 100, LINE.x0), Math.min(x1 + 100, LINE.x1), lt);
    if (x0 < 800) clock(700, 330, 46, lt);
    if (x0 < 700) dietBoard(lt, { lit: litRows(lt), head: ss(lt, wS('c1', 1), wS('c1', 1) + .2) });
    if (inR(1300, 1560)) trayCart(1440, lt);
    if (Z === 'L') { for (const st of STN) if (inR(st.X - 200, st.X + 200)) gantryBack(st, lt); lineMid(lt, x0, x1); if (sh.dof) lineFront(lt); }
    if (Z === 'P') { dispenser(lt); shelfTub(PX + 570, lt); }
  };
  const L = [];
  if (C.straw) L.push([C.straw, 'straw']); if (C.mango) L.push([C.mango, 'mango']); if (C.chef) L.push([C.chef, 'chef']);
  if (Z === 'W') {
    V2.dof(Math.max(sh.dof || 0, 4), () => corridor(lt));
    if (C.pine) drawCast([[C.pine, 'pine']]);
    const wall = () => hatchWall(x0, x1, lt, () => { roomBack(x0, x1, lt); ctx.save(); ctx.translate(CAM.x * .12, 0); rail(x0 - CAM.x * .12, x1 - CAM.x * .12, lt); ctx.restore(); });
    if (sh.dof) V2.dof(sh.dof, wall); else wall();
    if (sh.pieTin) pieBoxDraw(PB.x, lt, { part: 'back', bs: PB.bs, open: .85 });
    drawCast(L);
  } else {
    if (sh.dof) V2.dof(sh.dof, wallLayer); else wallLayer();
    drawCast(L);
  }
  BGMODE = 0;
  roomFront(x0, x1, lt);
  /* what stands on the counter */
  if (Z === 'T') {
    stockpot(1300, lt); steam({ x: 1300, y: CT - 160, w: 100, h: 260, t: lt, seed: 6, power: .9 });
    const lift = sh.cloche === 'lift' ? ss(lt, wS('c2', 1), wS('c2', 1) + .55) : sh.cloche === 1 ? 0 : 1, sl = sh.slide ? ss(lt, 9.9, 10.07) * 1000 : 0;
    if (lift > .02 || sh.cloche === 'lift' || sh.cloche === 0) dish('turkey', { x: HOME.tk + sl, y: CT + 8, s: .96, t: lt, steam: .6, seed: 3 });
    if (sh.cloche !== 0) cloche(HOME.tk, CT + 8, lift, lt);
    heatLamp(HOME.tk, lt, sh.lamp || 0);
    for (const c of [CUE.clatter1, CUE.clatter2]) if (lt >= c && lt < c + .5) { V2.ring(HOME.tk - 40, CT - 150, (lt - c) / .5, { r0: 20, r1: 170, color: '255,255,255', lw: 5, alpha: .6 }); }
    if (lift > .3) steam({ x: HOME.tk + sl, y: CT - 90, w: 120, h: 220, t: lt, seed: 2, power: .8 });
  }
  if (Z === 'L') {
    beltDraw(Math.max(x0, LINE.x0), Math.min(x1, LINE.x1), lt);
    if (inR(LINE.row - 330, LINE.row + 330)) sampleRow(LINE.row, lt);
    const st = drawPlatter(lt);
    if (!sh.dof) lineFront(lt);
    if (sh.chips) for (const s2 of STN) if (inR(s2.X - 200, s2.X + 200)) chip(s2, lt);
    if (lt >= 30.3 && lt < 30.7) {   /* the whole pie in a glove over the open jar: let go, it drops in */
      const X = LINE.X4 + 8, drop = ss(lt, 30.43, 30.55), y = lerp(430, 596, drop * drop), s2 = lerp(.5, .3, drop), al = 1 - ss(lt, 30.52, 30.58);
      if (al > .02) { if (drop < .05) gloveArm(X + 8, y - 60, -.9, { len: 800 }); else gloveArm(X + 8 + 40 * (drop), y - 60 - 400 * ss(lt, 30.5, 30.65), -.9, { len: 800 }); dish('pie', { x: X, y: y + 20, s: s2, t: lt, steam: 0, plat: false, alpha: al, seed: 4 }); }
    }
    puffAt(lt, LINE.X1 + 28, CT - 50, CUE.carve + .5, 120); crumbs(lt, LINE.X2, CT - 70, CUE.chop, 16, '#d9a05a', 420); puffAt(lt, LINE.X3, CT - 40, 11.4, 110, '#efe0c4');
    puffAt(lt, LINE.X4, CT - 60, 11.62, 100); puffAt(lt, LINE.X4 + 26, CT - 40, 12.45, 90); puffAt(lt, LINE.X5, CT - 60, CUE.mold1 + .09, 150, '#f6ecd6');
    puffAt(lt, LINE.X5, CT - 60, CUE.mold2 + .09, 130, '#f6ecd6'); puffAt(lt, LINE.X4 + 26, CT - 60, 31.0, 90, '#e8d4b4');
    steam({ x: st.x, y: CT - 120, w: 90, h: 200, t: lt, seed: 4, power: sh.id === 'carve' ? .6 : .45 });
    if (sh.boxEnd) { pieBoxDraw(LINE.X5 + 296, lt, { pie: false, open: .28 }); emptyTin(LINE.X5 + 296, CT - 22, .55); }
  }
  if (Z === 'P') {
    drawCups(lt); drawStreams(lt);
    if (lt < 18.6) pr1Action(lt);
    dispLabels(lt);
  }
  if (Z === 'W') {
    if (!sh.pieTin) bellDraw(6455, lt, CUE.bell);
    if (sh.box) { const slide = sh.id === 'w1' || sh.id === 'p2' ? 0 : 0; pieBoxDraw(6760 + slide, lt, { open: 1 }); }
    if (sh.plate) plateOnSill(6730, lt, { sheen: sh.sheen ? sg(lt, 40.0, 40.9) : undefined });
    if (sh.pieTin) { const tk = pieTin(lt); pieBoxDraw(PB.x, lt, { part: 'front', bs: PB.bs, pie: false }); dish('pie', { x: tk.x, y: tk.y, s: .52 * PB.bs, t: lt, steam: 0, plat: false, seed: 4 }); }
  }
  return;
}

const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), u = sg(lt, sh.s, sh.e);
    const C = castFor(sh, lt); FR = { sh, C };
    const [x, y, z] = sh.cam(u, lt, C);
    const sway = { x: 2 * vnoise(lt * 1.3 + 3), y: 1.6 * vnoise(lt * 1.1 + 8) };
    zoomTo(x + sway.x, y + sway.y, z);
  },
  draw(lt) { drawWorld(lt); },
  fx(lt) { return { bloom: .4, vignette: .38, grain: .045, contrast: .12, sat: .1, tint: [['#e8f6ea', .12, 'soft-light']] }; },
  blur(lt) { for (const sh of SHOTS) if (Math.abs(lt - sh.s) < .04) return 1; if (lt > 10.1 && lt < 13.5) { const v = Math.abs(tkX(lt + .02) - tkX(lt - .02)) / .04; return Math.round(Math.max(2, Math.min(14, v / 140))); } return 2; },
  over(lt) { },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP19_SCENES = window.__EP19_SCENES || {};
window.__EP19_SCENES.kitchen = SC;
})();
