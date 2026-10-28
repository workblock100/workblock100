'use strict';
/* SHIFT HAPPENS, Episode 13: scene `plan` (41.646 s, clock 7:09 PM, label THE BRIEFING). Charge Nurse Lemon briefs the crew in the med room turned war room (one swinging lamp, a holo-table);
 * registered as window.__EP13_SCENES.plan. The blueprint is the hero: it is drawn live from one plan model and appears twice, as a full-frame flat graphic and as the hologram above the table.
 *
 * SHOTS (scene-local seconds; ROOM shots keep every character sharp and complete, PLAN shots are the flat blueprint)
 *   wide0   0.00- 1.20  the dark room powers up: pen-light, lamp swing, hologram grid draws; the first frames come up from black
 *   dive    1.20- 2.05  camera pushes over the table into the hologram (characters dissolve, the plan unfolds and fills the frame; the outline traces itself)
 *   plan    2.05- 8.30  l1 outline + parking lot + entrance ping, l2 the 32 rooms light one by one (numbers, counter, two nurse tiles, CALLED OUT stamp), l3 the vault (gold, padlock, route)
 *   mango1  8.30- 9.50  "Why is it locked?" hand up like a student                          plan 9.50-11.42  POLICY 14.3 plate slams on (held to about 12.0)
 *   clem1  11.42-12.04  "Sure!" nod, fist, sparks                                          plan 12.04-14.30 OBSTACLE 1 / CALL LIGHTS: red beams across the east hall, staff marker trips them
 *   clem2  14.30-15.74  "I can't ignore a call light." red call-light blink off to the side
 *   straw1 15.74-18.58  spotlight finds Strawberry: "Nobody can. Except her." / "Per diem."
 *   plan   18.58-23.33  BADGE SCAN card (BADGE PER DIEM / SYSTEM NO MATCH), her marker walks the beams untouched; OBSTACLE 2 / THE ADMINISTRATOR, the patrol loop, melon marker
 *   mango2 23.33-24.46  "I'll talk to him."        plan 24.46-26.60  ring timer 00:00 to 14:00 around the loop (lap 2 fast, afterimages)
 *   mango3 26.60-27.55  "I can hold him for forty."        plan 27.55-29.50  the ring stretches to 40:00 (gold), ON HOLD, OBSTACLE 3 / ???
 *   quiet  29.50-30.55  silent: the room goes quiet, red wash from the Q-word sign, a slow pan from Mango and Clementine to the sign and Strawberry and Lemon, dutch roll
 *   lemon1 30.55-31.74  "The Q word."   clem3 31.74-32.40 "What's the..."   shh 32.40-33.62 Mango leaps and clamps a hand over Clementine's mouth, whip to Lemon and Strawberry, fingers to lips
 *   lemon2 33.62-34.42  "Moon. You're on the window."   whip 34.42-35.17 whip pan to the window, the Moon rises   moon 35.17-36.80 "I see everything." (eye roll)
 *   straw2 36.80-37.80  "And if we're caught?"   lemon3 37.80-38.70 "Then it was a..."   plan 38.70-39.70 MANDATORY IN-SERVICE stamp slams (shake, shockwave, sparks)
 *   undive 39.70-40.30  the plan folds back into the hologram, the crew is revealed   end 40.30-41.70 the hologram collapses to a point, the room goes dark (fade to black)
 *
 * LAYOUT (plan coordinates (u, v): origin at the drawing's centre, v south; flat shot screen = (540 + u, 820 + v); usable area x 60..1020, y 280..1360, all labels above y 1370)
 *   building 908 x 776 (x 86..994, y 308..1084), parking lot to y 1340, courtyard 620 x 488 centred (0, -124); rooms 68 wide, 30 px numbers, one size, offset away from each door arc
 *   plates (OBSTACLE 1/2/3): one size 440 x 120 at one slot (0, -288), dark glass, accent edge, corner brackets, leader line ending in a ring exactly on its target (hall / patrol loop)
 *   POLICY 14.3 plate 600 x 288 and the BADGE SCAN card 500 x 272 are centred on the courtyard; about 40 px of padding on all four sides of the policy plate
 * TEXT: every string goes through the UI kit (ui.js); nothing is drawn into a cached canvas; the text layer fades before the plan folds into the hologram (tilted text is never drawn).
 * CHARACTERS: A7.lemon (pen-light prop fp13_penlight), A11.straw, A7.mango, A10.clem (fp13_tag: the price tag whose price dissolves into the caption zone), the Moon in the window (A7.moon).
 * Gate notes: o.transit exempts a character crossing the frame edge; o.fast (cast drawn unaudited) is used only for the 0.25 s of a whip pan that is faster than the text gate can follow.
 */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo, faceZoom, faceC } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S6 = window.S6, S7 = window.S7, UI = window.UI;
const clamp01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = seg(t, a, b); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------------ palette (Episode 13 graphics)
const CY = '#4de3ff', CYR = '77,227,255', HI = '#c8f6ff', RED = '#ff3b4e', REDR = '255,59,78', GOLD = '#ffc83d', GOLDR = '255,200,61', GLASS = 'rgba(8,10,20,.78)', INKC = '#15111a';

// ------------------------------------------------------------------ the plan model
/* Plan coordinates (u, v) are px with the origin at the centre of the drawing and v pointing south. In the flat shot the screen position is (540 + u, 820 + v), so the whole drawing sits in
 * the usable area x 60..1020, y 280..1360: building 908 x 776 (x 86..994, y 308..1084), parking lot below it (to y 1340). Everything is a multiple of 4 and the drawing is symmetric
 * about x = 540.
 *   bands:      room band 80 deep on all four sides, ring corridor 64 wide inside it, courtyard 620 x 488 in the middle (centre 0, -124)
 *   N / S rows: rooms 68 wide x 80 deep.  W / E columns: rooms 80 wide x 88 tall (7 each).  Stair towers (hatched) in the four corners.
 *   32 rooms numbered clockwise from the lobby: 1-4 south-west row (outwards), 5-11 west column (northwards), 12-21 north row (eastwards), the vault (the break room, not numbered)
 *   closes the north row in the north-east, 22-28 east column (southwards), 29-32 south-east row (back to the lobby).
 */
const PL = { cx: 540, cy: 820 };
const BU = 454, BV0 = -512, BV1 = 264, BAND = 80, COR = 64, RW = 68, RH = 88, LOB = 102, DG = 11;
const WI = -BU + BAND, EI = BU - BAND, NI = BV0 + BAND, SI = BV1 - BAND;      /* -374 374 -432 184: inner edge of the room bands */
const CWL = WI + COR, CEL = EI - COR, CNL = NI + COR, CSL = SI - COR;           /* -310 310 -368 120: the courtyard */
const MID_W = (WI + CWL) / 2, MID_E = (EI + CEL) / 2, MID_N = (NI + CNL) / 2, MID_S = (SI + CSL) / 2;   /* corridor centre lines -342 342 -400 152 */
const PV0 = 312, PV1 = 520, STALL = 56;                                          /* parking lot */
const PG = (() => {
  const rooms = [];
  const add = (n, side, x0, y0, x1, y1) => {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const door = side === 'S' ? [cx, SI] : side === 'N' ? [cx, NI] : side === 'W' ? [WI, cy] : [EI, cy];
    const nrm = side === 'S' ? [0, 1] : side === 'N' ? [0, -1] : side === 'W' ? [-1, 0] : [1, 0];   /* into the room */
    const dome = [door[0] - nrm[0] * 12, door[1] - nrm[1] * 12];
    rooms.push({ n, side, x0, y0, x1, y1, cx, cy, door, nrm, dome });
  };
  for (let i = 0; i < 4; i++) add(1 + i, 'S', -LOB - RW * (i + 1), SI, -LOB - RW * i, BV1);                 /* 1-4 */
  for (let j = 0; j < 7; j++) add(5 + j, 'W', -BU, SI - RH * (j + 1), WI, SI - RH * j);                     /* 5-11 */
  for (let i = 0; i < 10; i++) add(12 + i, 'N', WI + RW * i, BV0, WI + RW * (i + 1), NI);                   /* 12-21 */
  for (let j = 0; j < 7; j++) add(22 + j, 'E', EI, NI + RH * j, BU, NI + RH * (j + 1));                     /* 22-28 */
  for (let i = 0; i < 4; i++) add(29 + i, 'S', EI - RW * (i + 1), SI, EI - RW * i, BV1);                    /* 29-32 */
  const vault = { x0: EI - RW, y0: BV0, x1: EI, y1: NI, cx: EI - RW / 2, cy: (BV0 + NI) / 2, door: [EI - RW / 2, NI] };
  // room walls with a gap for the door; door leaf and swing arc; a window tick on the outer wall
  const walls = [], doors = [], wins = [];
  for (const r of rooms.concat([Object.assign({ side: 'N', n: 0, nrm: [0, -1] }, vault)])) {
    const { x0, y0, x1, y1, cx, cy } = r, side = r.side;
    const top = side === 'S' ? [[x0, y0, cx - DG, y0], [cx + DG, y0, x1, y0]] : [[x0, y0, x1, y0]];
    const bot = side === 'N' ? [[x0, y1, cx - DG, y1], [cx + DG, y1, x1, y1]] : [[x0, y1, x1, y1]];
    const lef = side === 'E' ? [[x0, y0, x0, cy - DG], [x0, cy + DG, x0, y1]] : [[x0, y0, x0, y1]];
    const rig = side === 'W' ? [[x1, y0, x1, cy - DG], [x1, cy + DG, x1, y1]] : [[x1, y0, x1, y1]];
    walls.push(...top, ...bot, ...lef, ...rig);
    const t = side === 'S' || side === 'N' ? [1, 0] : [0, 1], dc = side === 'S' ? [cx, y0] : side === 'N' ? [cx, y1] : side === 'W' ? [x1, cy] : [x0, cy];
    const hinge = [dc[0] - t[0] * DG, dc[1] - t[1] * DG], a0 = Math.atan2(t[1], t[0]), a1 = Math.atan2(r.nrm[1], r.nrm[0]);
    doors.push({ hinge, a0, a1, r: 2 * DG, vault: r.n === 0 });
    const wc = side === 'S' ? [cx, y1] : side === 'N' ? [cx, y0] : side === 'W' ? [x0, cy] : [x1, cy];
    wins.push(side === 'S' || side === 'N' ? [wc[0] - 14, wc[1], wc[0] + 14, wc[1]] : [wc[0], wc[1] - 14, wc[0], wc[1] + 14]);
  }
  // the call-light hall: the east corridor (u 310..374). Lasers zig-zag from each dome on the east wall to a receiver on the courtyard wall, half a room further on
  const east = rooms.filter(r => r.side === 'E');
  const hall = [];
  east.forEach((r, i) => { hall.push([EI - 12, r.cy]); if (i < 6) hall.push([CEL + 10, r.cy + RH / 2]); });
  // the route from the entrance to the vault door: lobby door, south corridor east, east corridor north, up to the vault's door
  const route = [[0, BV1 + 44], [0, BV1], [0, MID_S], [MID_E, MID_S], [MID_E, vault.door[1] + 36], [vault.door[0], vault.door[1] + 36], [vault.door[0], vault.door[1]]];
  // the Administrator's patrol loop: the ring corridor's centre line, clockwise from the south corridor
  const loop = [[0, MID_S], [MID_W, MID_S], [MID_W, MID_N], [MID_E, MID_N], [MID_E, MID_S], [0, MID_S]];
  // the outer wall, from the right of the entrance round the building to the left of the entrance
  const outer = [[28, BV1], [BU, BV1], [BU, BV0], [-BU, BV0], [-BU, BV1], [-28, BV1]];
  const inset = 7, inner = [[28 + 2, BV1 - inset], [BU - inset, BV1 - inset], [BU - inset, BV0 + inset], [-BU + inset, BV0 + inset], [-BU + inset, BV1 - inset], [-28 - 2, BV1 - inset]];
  return { rooms, vault, hall, route, loop, walls, doors, wins, outer, inner };
})();
const pathLen = pts => pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
const pathAt = (pts, d) => {   /* the point d px along a polyline (clamped), with its heading */
  for (let i = 1; i < pts.length; i++) { const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= L || i === pts.length - 1) { const k = L ? clamp01(d / L) : 0; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; } d -= L; }
  return [...pts[pts.length - 1], 0];
};
const pathSlice = (pts, a, b) => {   /* the part of a polyline from distance a to distance b */
  const out = []; let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (L > 0 && d + L >= a && d <= b) {
      const k0 = clamp01((a - d) / L), k1 = clamp01((b - d) / L);
      if (!out.length) out.push([lerp(pts[i - 1][0], pts[i][0], k0), lerp(pts[i - 1][1], pts[i][1], k0)]);
      out.push([lerp(pts[i - 1][0], pts[i][0], k1), lerp(pts[i - 1][1], pts[i][1], k1)]);
    }
    d += L;
  }
  return out;
};
const OUTER_LEN = pathLen(PG.outer), ROUTE_LEN = pathLen(PG.route), LOOP_LEN = pathLen(PG.loop);

// ------------------------------------------------------------------ mapping plan coordinates to the screen
const FLAT = { f: (u, v) => [PL.cx + u, PL.cy + v + BOB], s: 1, k: 1 };
let M = FLAT;   /* the map in force while a frame is drawn */
var BOB = 0;
const mp = (u, v) => M.f(u, v);
function trace(pts, close) { ctx.beginPath(); pts.forEach(([u, v], i) => { const [x, y] = mp(u, v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (close) ctx.closePath(); }
function lineSet(segs) { ctx.beginPath(); for (const [a, b, c, d] of segs) { const p = mp(a, b), q = mp(c, d); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } }
function rectP(x0, y0, x1, y1) { trace([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true); }
function arcP(cu, cv, r, a0, a1, ccw, n = 10) {
  const pts = [], d = a1 - a0;
  for (let i = 0; i <= n; i++) { const a = a0 + d * i / n; pts.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
  trace(pts, false);
}
function circleP(cu, cv, r, n = 28) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); } trace(pts, true); }
function ink(col, lw, a = 1, dash = null) {
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(.7, lw * M.s); ctx.globalAlpha *= a; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.setLineDash(dash ? dash.map(d => d * M.s) : []);
}
/* a glowing line: a wide faint pass under a thin bright one (the caller has built the path and set strokeStyle) */
function neon(lw, a = 1, glow = 3.4) {
  const keep = ctx.globalAlpha, w = ctx.lineWidth;
  ctx.globalAlpha = keep * a * .17; ctx.lineWidth = Math.max(1.5, lw * glow * M.s); ctx.stroke();
  ctx.globalAlpha = keep * a; ctx.lineWidth = Math.max(.7, lw * M.s); ctx.stroke();
  ctx.globalAlpha = keep; ctx.lineWidth = w;
}
const saved = fn => { ctx.save(); fn(); ctx.restore(); };

// ------------------------------------------------------------------ timeline index (scene-local seconds of every line and word, read from the frozen timeline)
let TIMES = null;
function TX() {
  if (TIMES && TIMES.start === CUR.start) return TIMES;
  const L = {};
  for (const l of TL.lines) if (l.scene === 'plan') L[l.id] = { s: l.s - CUR.start, e: l.e - CUR.start, w: l.words.map(w => ({ t: w[0], s: l.s - CUR.start + w[1], e: l.s - CUR.start + w[2] })) };
  return TIMES = { start: CUR.start, L, B: CUR.beats };
}
/* scene-local start of the first word of line `id` whose text contains `word` (default: the line's start) */
const wordT = (id, word) => { const l = TX().L[id]; if (!word) return l.s; const norm = q => q.t.toLowerCase().replace(/[^a-z0-9]/g, ''), w = l.w.find(q => norm(q) === word) || l.w.find(q => norm(q).includes(word)); return w ? w.s : l.s; };   /* an exact word wins over a word that merely contains it ("two" is not "thirty-two") */

// ------------------------------------------------------------------ the blueprint paper (cached, no text): navy, a lit centre, a fine grid
let PAPER = null;
function paper() {
  if (PAPER) return PAPER;
  const c = V2.mk(W, H), g = c.getContext('2d');
  const bg = g.createRadialGradient(PL.cx, PL.cy - 40, 60, PL.cx, PL.cy - 40, 1180); bg.addColorStop(0, '#0d3250'); bg.addColorStop(.55, '#07203a'); bg.addColorStop(1, '#030b16');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.lineWidth = 1;
  for (let i = -24; i <= 24; i++) {   /* minor grid every 24 px, major every 96 px, aligned on the drawing's centre */
    const major = i % 4 === 0;
    g.strokeStyle = major ? 'rgba(77,227,255,.105)' : 'rgba(77,227,255,.045)';
    const x = PL.cx + i * 24 + .5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  for (let j = -40; j <= 44; j++) {
    const major = j % 4 === 0; g.strokeStyle = major ? 'rgba(77,227,255,.105)' : 'rgba(77,227,255,.045)';
    const y = PL.cy + j * 24 + .5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  return PAPER = c;
}
let SCAN = null;
const scanPattern = () => {
  if (SCAN) return SCAN;
  const c = V2.mk(4, 4), g = c.getContext('2d'); g.fillStyle = 'rgba(160,240,255,.5)'; g.fillRect(0, 0, 4, 1);
  return SCAN = ctx.createPattern(c, 'repeat');
};

// ------------------------------------------------------------------ the drawing: static linework
function drawParking(a) {
  if (a <= 0) return;
  saved(() => {
    ctx.globalAlpha *= a;
    rectP(-BU - 8, PV0, BU + 8, PV1); ctx.fillStyle = `rgba(${CYR},.06)`; ctx.fill();
    ink(CY, 2, .8, [14, 10]); ctx.stroke();
    const stalls = [];
    for (let i = 0; i <= 14; i++) { const u = -BU - 8 + 8 + i * (BU * 2 / 14); if (Math.abs(u) < 36) continue; stalls.push([u, PV0, u, PV0 + STALL]); stalls.push([u, PV1 - STALL, u, PV1]); }
    lineSet(stalls); ink(CY, 1.8, .6); ctx.stroke();
    // cars, seen from above: outline, a fill and a windscreen line
    const cars = [[-1, -386, 0], [-1, -258, 1], [-1, -130, 0], [-1, 194, 1], [-1, 322, 0], [1, -322, 0], [1, -66, 1], [1, 66, 0], [1, 258, 1], [1, 386, 0]];
    for (const [row, u, tall] of cars) {
      const v0 = row < 0 ? PV0 + 6 : PV1 - 6 - 46, w = 34, h = 46 - (tall ? 0 : 4), ws = row < 0 ? v0 + h - 15 : v0 + 15;
      saved(() => { rectP(u - w / 2, v0, u + w / 2, v0 + h); ctx.fillStyle = `rgba(${CYR},.13)`; ctx.fill(); ink(CY, 2, .9); ctx.stroke(); lineSet([[u - w / 2 + 5, ws, u + w / 2 - 5, ws]]); ink(CY, 1.6, .8); ctx.stroke(); });
    }
    // the walk from the entrance
    lineSet([[-30, BV1 + 34, -30, PV0], [30, BV1 + 34, 30, PV0]]); ink(CY, 2, .85, [6, 6]); ctx.stroke();
  });
}

function drawBuilding(st) {
  const R = PG.rooms;
  saved(() => {
    // footprint fill, corridor ring floor (even-odd), courtyard lawn
    rectP(-BU, BV0, BU, BV1); ctx.fillStyle = `rgba(${CYR},.045)`; ctx.fill();
    ctx.beginPath();
    for (const poly of [[[WI, NI], [EI, NI], [EI, SI], [WI, SI]], [[CWL, CNL], [CEL, CNL], [CEL, CSL], [CWL, CSL]]]) poly.forEach(([u, v], i) => { const [x, y] = mp(u, v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }), ctx.closePath();
    ctx.fillStyle = `rgba(${CYR},.085)`; ctx.fill('evenodd');
    rectP(CWL, CNL, CEL, CSL); ctx.fillStyle = 'rgba(70,255,190,.035)'; ctx.fill();
    // lobby floor
    rectP(-LOB, SI, LOB, BV1); ctx.fillStyle = `rgba(${CYR},.085)`; ctx.fill();
  });
  // stair towers: hatched blocks in the four corners
  for (const [u0, v0] of [[-BU, BV0], [EI, BV0], [-BU, SI], [EI, SI]]) saved(() => {
    const u1 = u0 + BAND, v1 = v0 + BAND, hatch = [];
    for (let c = u0 + v0 + 12; c < u1 + v1; c += 12) { const ua = Math.max(u0, c - v1), ub = Math.min(u1, c - v0); hatch.push([ua, c - ua, ub, c - ub]); }
    lineSet(hatch); ink(CY, 1.3, .3); ctx.stroke();
    rectP(u0, v0, u1, v1); ink(CY, 2, .85); ctx.stroke();
    rectP(u0 + 14, v0 + 14, u1 - 14, v1 - 14); ink(CY, 1.2, .35); ctx.stroke();
  });
  // room walls, doors, windows
  saved(() => { lineSet(PG.walls); ink(CY, 2.2, .85); ctx.stroke(); });
  saved(() => {
    for (const d of PG.doors) { const [x, y] = mp(d.hinge[0], d.hinge[1]); }
    ink(CY, 1.3, .55);
    for (const d of PG.doors) { arcP(d.hinge[0], d.hinge[1], d.r, d.a0, d.a1 > d.a0 + PI ? d.a1 - TAU : d.a1 < d.a0 - PI ? d.a1 + TAU : d.a1, false, 8); ctx.stroke(); lineSet([[d.hinge[0], d.hinge[1], d.hinge[0] + Math.cos(d.a1) * d.r, d.hinge[1] + Math.sin(d.a1) * d.r]]); ctx.stroke(); }
  });
  // courtyard wall (glazing: a double line), nurses' station, lobby
  saved(() => { rectP(CWL, CNL, CEL, CSL); ink(CY, 2.6, .9); ctx.stroke(); rectP(CWL + 6, CNL + 6, CEL - 6, CSL - 6); ink(CY, 1, .35); ctx.stroke(); });
  saved(() => {   // the nurses' station: a counter bulging into the courtyard from the south corridor wall
    trace([[-84, CSL], [-84, CSL - 44], [-52, CSL - 52], [52, CSL - 52], [84, CSL - 44], [84, CSL]], false); ink(CY, 2.4, .9); ctx.stroke(); ctx.fillStyle = `rgba(${CYR},.10)`; ctx.fill();
    trace([[-66, CSL], [-66, CSL - 36], [-44, CSL - 42], [44, CSL - 42], [66, CSL - 36], [66, CSL]], false); ink(CY, 1.1, .4); ctx.stroke();
    for (const u of [-28, 0, 28]) { circleP(u, CSL - 22, 6, 12); ink(CY, 1.4, .6); ctx.stroke(); }
  });
  saved(() => {   // reception desk and benches in the lobby
    rectP(-64, SI + 18, 64, SI + 40); ink(CY, 1.6, .6); ctx.stroke(); ctx.fillStyle = `rgba(${CYR},.08)`; ctx.fill();
    for (const u of [-80, 80]) { rectP(u - 10, SI + 48, u + 10, SI + 72); ink(CY, 1.4, .5); ctx.stroke(); }
  });
  // the outer wall: a heavy line with a thin one inside it (drawn by the caller with the trace progress), and window ticks
  saved(() => { lineSet(PG.wins); ink(HI, 5, .55); ctx.lineCap = 'butt'; ctx.stroke(); });
  // entrance vestibule and its doors
  saved(() => {
    trace([[-30, BV1], [-30, BV1 + 30], [30, BV1 + 30], [30, BV1]], false); ink(CY, 2.2, .85, [8, 5]); ctx.stroke();
    ink(CY, 1.3, .6); arcP(-28, BV1 - 2, 26, 0, -PI / 2, true, 8); ctx.stroke(); arcP(28, BV1 - 2, 26, PI, PI * 1.5, false, 8); ctx.stroke();
  });
  // domes: the call light above every door
  saved(() => {
    for (const r of R) {
      circleP(r.dome[0], r.dome[1], 5.2, 14); ctx.fillStyle = `rgba(${CYR},.35)`; ctx.fill(); ink(HI, 1.4, .8); ctx.stroke();
    }
  });
}

// ------------------------------------------------------------------ the HUD frame around the drawing (corner brackets, edge ticks, registration marks)
function drawFrame(a) {
  if (a <= 0) return;
  saved(() => {
    ctx.globalAlpha *= a; ctx.lineCap = 'butt';
    const x0 = 52, y0 = 268, x1 = 1028, y1 = 1368, L = 34;
    ctx.strokeStyle = CY; ctx.lineWidth = 3;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke(); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(77,227,255,.55)'; ctx.beginPath();
    for (let y = y0 + 24; y < y1 - 20; y += 24) { const major = ((y - PL.cy) % 96 + 96) % 96 === 0, l = major ? 14 : 7; ctx.moveTo(x0, y); ctx.lineTo(x0 + l, y); ctx.moveTo(x1, y); ctx.lineTo(x1 - l, y); }
    ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(77,227,255,.8)'; ctx.beginPath();
    for (const y of [y1]) { ctx.moveTo(540 - 14, y); ctx.lineTo(540 + 14, y); ctx.moveTo(540, y - 14); ctx.lineTo(540, y + 14); }
    ctx.stroke();
  });
}

// ------------------------------------------------------------------ set dressing with text (hero: false): title block, dimension line, compass, scale bar, entrance label
function drawDressing(a) {
  if (a <= 0) return;
  saved(() => {
    ctx.globalAlpha *= a;
    // title block, top right (clear of the clock pill, which ends at x 500)
    UI.sign([536, 124, 484, 112], [{ t: 'FRUIT BOWL REHAB & NURSING', size: 27, spacing: 2, fill: HI }, { t: 'FLOOR PLAN  -  LEVEL 1  -  SCALE 1:400', size: 18, spacing: 1.5, fill: '#7fc9dc', weight: 800, gap: 6 }, { t: 'SHEET A-01  -  3 TO 11 SHIFT', size: 18, spacing: 1.5, fill: '#7fc9dc', weight: 800, gap: 4 }],
      { fill: 'rgba(8,10,20,.55)', stroke: 'rgba(77,227,255,.7)', lw: 2, r: 8, pad: 12, hero: false, id: 'titleblock' });
    // dimension line above the building: the width of the drawing, broken round its label
    const yD = mp(0, BV0 - 20)[1], lab = "113'-6\"", lw = UI.sizeOf(lab, { size: 20, weight: 800, spacing: 1 }).w;
    ctx.strokeStyle = 'rgba(77,227,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(PL.cx - BU, yD); ctx.lineTo(PL.cx - lw / 2 - 12, yD); ctx.moveTo(PL.cx + lw / 2 + 12, yD); ctx.lineTo(PL.cx + BU, yD);
    for (const x of [PL.cx - BU, PL.cx + BU]) { ctx.moveTo(x - 7, yD + 7); ctx.lineTo(x + 7, yD - 7); ctx.moveTo(x, yD - 12); ctx.lineTo(x, yD + 12); }
    ctx.stroke();
    UI.label(lab, PL.cx, yD, { size: 20, weight: 800, spacing: 1, fill: HI, hero: false });
    // compass and scale bar in the parking aisle
    const vA = mp(0, (PV0 + STALL + PV1 - STALL) / 2)[1];
    ctx.strokeStyle = CY; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(PL.cx - 400, vA, 20, 0, TAU); ctx.stroke();
    ctx.fillStyle = HI; ctx.beginPath(); ctx.moveTo(PL.cx - 400, vA - 15); ctx.lineTo(PL.cx - 394, vA + 8); ctx.lineTo(PL.cx - 400, vA + 3); ctx.lineTo(PL.cx - 406, vA + 8); ctx.closePath(); ctx.fill();
    UI.label('N', PL.cx - 360, vA, { size: 22, weight: 900, fill: HI, hero: false });
    const sx0 = PL.cx + 250, seg4 = 40;
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? 'rgba(77,227,255,.2)' : CY; ctx.fillRect(sx0 + i * seg4, vA - 5, seg4, 10); }
    ctx.strokeStyle = CY; ctx.lineWidth = 1.5; ctx.strokeRect(sx0, vA - 5, seg4 * 4, 10);
    UI.label('0', sx0, vA + 26, { size: 17, weight: 800, fill: HI, hero: false });
    UI.label('10', sx0 + seg4 * 2, vA + 26, { size: 17, weight: 800, fill: HI, hero: false });
    UI.label('20 FT', sx0 + seg4 * 4, vA + 26, { size: 17, weight: 800, fill: HI, hero: false });
    UI.label('ENTRANCE', PL.cx, mp(0, PV0 + STALL + 26)[1], { size: 19, weight: 900, spacing: 3, fill: HI, hero: false });
  });
}

// ------------------------------------------------------------------ plates: dark glass with an accent edge, drawn through the UI kit
const PLATE = { w: 440, h: 120 };   /* the three OBSTACLE plates share one size */
const SLOT = { top: [0, -288], mid: [0, -124] };   /* where plates sit in the courtyard */
function plateIn(lt, t0, t1) { return seg(lt, t0, t0 + .14) * (1 - seg(lt, t1, t1 + .18)); }
function drawPlate(lt, o) {
  const a = plateIn(lt, o.t0, o.t1);
  if (a <= 0) return;
  const [x, y] = mp(o.u, o.v), w = o.w ?? PLATE.w, h = o.h ?? PLATE.h, sc = 1 + .16 * (1 - easeOut(seg(lt, o.t0, o.t0 + .24))), acc = o.accent ?? RED, accR = o.accentR ?? REDR;
  // leader line from the plate to its target: it ends exactly on the target, with a ring
  if (o.leader) {
    const [fu, fv] = o.leader.from, [tu, tv] = o.leader.to, k = easeOut(seg(lt, o.t0 + .08, o.t0 + .5));
    saved(() => {
      ctx.globalAlpha *= a;
      const A = mp(fu, fv), Bp = mp(lerp(fu, tu, k), lerp(fv, tv, k));
      ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(Bp[0], Bp[1]); ctx.stroke();
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(A[0], A[1], 5, 0, TAU); ctx.fill();
      if (k >= .999) { ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(Bp[0], Bp[1], 11, 0, TAU); ctx.stroke(); ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(Bp[0], Bp[1], 3.5, 0, TAU); ctx.fill(); }
    });
  }
  saved(() => {
    ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
    V2.glow(x, y, w * .62, accR, .22, 'screen', .25);
    UI.sign([x - w / 2, y - h / 2, w, h], o.lines, { fill: GLASS, stroke: acc, lw: 3, r: 14, pad: o.pad ?? 14, hero: o.hero !== false, id: o.id });
    ctx.strokeStyle = acc; ctx.lineWidth = 4; ctx.lineCap = 'butt';   /* corner brackets just outside the plate */
    for (const [cx, cy, sx, sy] of [[x - w / 2, y - h / 2, 1, 1], [x + w / 2, y - h / 2, -1, 1], [x - w / 2, y + h / 2, 1, -1], [x + w / 2, y + h / 2, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx - sx * 7, cy + sy * 24); ctx.lineTo(cx - sx * 7, cy - sy * 7); ctx.lineTo(cx + sx * 17, cy - sy * 7); ctx.stroke(); }
  });
}

// ------------------------------------------------------------------ icons: the two nurses, the staff marker, Strawberry's marker, the Administrator, the padlock
function nurseIcon(cu, cv, grey) {
  const [x, y] = mp(cu, cv), body = grey ? '#8d9aa3' : '#e9fbff', line = grey ? '#56626b' : '#1b6f86';
  saved(() => {
    ctx.translate(x, y); ctx.lineJoin = 'round';
    ctx.fillStyle = body; ctx.strokeStyle = line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-40, 46); ctx.quadraticCurveTo(-42, 14, 0, 12); ctx.quadraticCurveTo(42, 14, 40, 46); ctx.closePath(); ctx.fill(); ctx.stroke();   /* shoulders */
    ctx.beginPath(); ctx.arc(0, -6, 25, 0, TAU); ctx.fill(); ctx.stroke();                                                                                    /* head */
    ctx.beginPath(); ctx.moveTo(-26, -14); ctx.lineTo(-20, -40); ctx.quadraticCurveTo(0, -48, 20, -40); ctx.lineTo(26, -14); ctx.quadraticCurveTo(0, -24, -26, -14); ctx.closePath(); ctx.fillStyle = grey ? '#a7b2ba' : '#ffffff'; ctx.fill(); ctx.stroke();   /* cap */
    ctx.fillStyle = grey ? '#6c7881' : RED; ctx.fillRect(-3, -39, 6, 17); ctx.fillRect(-8.5, -33.5, 17, 6);                                                   /* red cross */
    ctx.fillStyle = line; ctx.beginPath(); ctx.arc(-9, -3, 2.8, 0, TAU); ctx.arc(9, -3, 2.8, 0, TAU); ctx.fill();                                              /* eyes */
    ctx.strokeStyle = line; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 4, 8, .25, PI - .25); ctx.stroke();
  });
}
function staffMarker(u, v, hot) {
  const [x, y] = mp(u, v);
  saved(() => {
    ctx.translate(x, y);
    if (hot > 0) { V2.glow(x, y, 70, '255,80,90', .5 * hot, 'screen', .5); ctx.strokeStyle = `rgba(255,224,120,${.9 * hot})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 19 + 10 * (1 - hot), 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#f4f7fa'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a73c9'; ctx.fillRect(-7, -6, 14, 12); ctx.fillStyle = '#fff'; ctx.fillRect(-4, -3, 8, 2); ctx.fillRect(-4, 1, 5, 2);   /* an ID badge */
  });
}
function strawMarker(u, v) {
  const [x, y] = mp(u, v);
  saved(() => {
    ctx.translate(x, y); V2.glow(x, y, 60, '255,120,150', .3, 'screen', .4);
    ctx.fillStyle = '#ff4262'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 16); ctx.bezierCurveTo(-18, 10, -18, -10, 0, -12); ctx.bezierCurveTo(18, -10, 18, 10, 0, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe0a0'; for (const [dx, dy] of [[-6, -2], [5, -3], [0, 4], [-8, 6], [8, 5]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4fd36a'; ctx.beginPath(); ctx.ellipse(-5, -14, 6, 3, -.5, 0, TAU); ctx.ellipse(5, -14, 6, 3, .5, 0, TAU); ctx.ellipse(0, -16, 4, 3, 0, 0, TAU); ctx.fill();
  });
}
function melonMarker(u, v, a = 1) {
  const [x, y] = mp(u, v);
  saved(() => {
    ctx.translate(x, y); ctx.globalAlpha *= a;
    ctx.fillStyle = '#f2dfae'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,110,50,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 6, -15); ctx.lineTo(i * 6 + 2, 15); ctx.moveTo(-15, i * 6); ctx.lineTo(15, i * 6 + 2); } ctx.stroke();
    ctx.fillStyle = '#b8864a'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.roundRect(-8, -3, 16, 20, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-5, 0, 10, 14);   /* the clipboard */
  });
}
function padlock(u, v, s, a = 1) {
  const [x, y] = mp(u, v);
  saved(() => {
    ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
    ctx.strokeStyle = '#ffe9a6'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-11, -4); ctx.lineTo(-11, -14); ctx.arc(0, -14, 11, PI, 0); ctx.lineTo(11, -4); ctx.stroke();
    ctx.fillStyle = GOLD; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-17, -6, 34, 28, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a3f00'; ctx.beginPath(); ctx.arc(0, 6, 4.2, 0, TAU); ctx.fill(); ctx.fillRect(-1.8, 7, 3.6, 8);
  });
}

// ------------------------------------------------------------------ the pointer: Lemon's pen-light dot, moving between the things she is talking about
const POINTER = [[2.2, 0, 330], [2.7, 0, 200], [3.05, 0, -150], [3.9, -112, -90], [4.85, 112, -90], [5.9, 0, 200], [7.0, 340, -430], [7.6, 340, -430]];
function pointerAt(lt) {
  const P = POINTER;
  if (lt <= P[0][0] || lt >= P[P.length - 1][0] + .5) return null;
  let i = 1; while (i < P.length - 1 && lt > P[i][0]) i++;
  const a = P[i - 1], b = P[i], k = easeIO(seg(lt, a[0], b[0]));
  return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
}

// ------------------------------------------------------------------ the plan, layer by layer
/* times (scene-local) of every event on the plan, taken from the frozen timeline so they follow the words */
function PT() {
  const t = TX(), L = t.L;
  return {
    trace0: .85, trace1: 1.9, ping0: .95, ping1: 2.15, lot0: 1.45, lot1: 2.25,
    pips: L.l2.s + .15,                                   /* the `pips` cue: 32 rooms in 0.9 s */
    nurse1: wordT('l2', 'two'), nurse2: wordT('l2', 'nurses'), grey: wordT('l2', 'called'), stamp: wordT('l2', 'out'), tilesOut: L.l3.s,
    route0: L.l3.s + .1, vault: wordT('l3', 'vault'), vaultLabel: L.l3.s + .35,
    policy: L.l4.s + .2, policyOut: L.c1.s + .5,
    ob1: L.l5.s + .2, ob1Out: L.c2.s - .15, laser: L.l5.s + .9,
    staff0: 18.72, staff1: 19.85, straw0: 19.35, straw1: 20.65, card: L.l7.s + .6, cardRow2: wordT('l7', 'system'), cardOut: L.l8.s - .1,
    ob2: L.l8.s + .2, ob2Out: L.m2.s - .15, loop0: L.l8.s + .2, loop1: L.l8.s + .9, lap1a: 21.45, lap1b: 24.45, lap2a: 24.6, lap2b: 26.45,
    timer: L.l9.s - .03, forty: wordT('m3', 'forty'), ob3: L.l10.s, ob3Out: 29.6, final: wordT('l13', 'mandatory') + .04,
  };
}

/* the hologram floats: a slow bob of a few px, shared by every part of the drawing (they all go through mp) */

/* every `holoblip` and `cardslam` cue of the scene (scene-local seconds): the hologram answers each with a small glitch */
function BLIPS() {
  const t = TX().L, B = TX().B;
  return [B.open.s + .55, t.l1.s + .25, t.l3.s + .35, t.l5.s + .2, t.l7.s + .6, t.l8.s + .2, B.q.s + .6];
}
const blipK = lt => { let k = 0; for (const b of BLIPS()) if (lt >= b && lt < b + .25) k = Math.max(k, Math.exp(-(lt - b) / .07)); return k; };

function drawPlan(lt, map, o = {}) {
  M = map; BOB = Math.sin(lt * 1.3) * 3;
  const T = PT(), ta = clamp01((map.k - .9) / .1);   /* text exists on the (nearly) flat plan only */
  const lot = sstep(lt, T.lot0, T.lot1), ping = sstep(lt, T.ping0, T.ping1), tr = sstep(lt, T.trace0, T.trace1);
  const ent = mp(0, BV1), rad = 1000 * ping * M.s;
  // --- the building and the parking lot, revealed by a ring that spreads from the entrance
  saved(() => {
    if (ping < .999) { ctx.beginPath(); ctx.arc(ent[0], ent[1], Math.max(.1, rad), 0, TAU); ctx.clip(); }
    drawParking(lot);
    drawBuilding({});
  });
  if (ping > 0 && ping < .999) saved(() => { ctx.strokeStyle = `rgba(200,250,255,${.85 * (1 - ping)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ent[0], ent[1], rad, 0, TAU); ctx.stroke(); });
  // --- the outer wall draws itself, then a pulse of light runs round it now and then
  if (tr > 0) saved(() => {
    const d = OUTER_LEN * tr, sl = pathSlice(PG.outer, 0, d), sl2 = pathSlice(PG.inner, 0, pathLen(PG.inner) * tr);
    if (sl.length > 1) { trace(sl, false); ink(CY, 5, 1); neon(5, 1); }
    if (sl2.length > 1) { trace(sl2, false); ink(CY, 1.6, .7); ctx.stroke(); }
    if (tr < .999) { const h = pathAt(PG.outer, d), [hx, hy] = mp(h[0], h[1]); V2.glow(hx, hy, 70 * M.s, '200,250,255', .8, 'screen', .8); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 5 * M.s, 0, TAU); ctx.fill(); }
    else { const d2 = ((lt * 520) % (OUTER_LEN + 600)) - 300, sl3 = pathSlice(PG.outer, Math.max(0, d2), Math.min(OUTER_LEN, d2 + 140)); if (sl3.length > 1) { trace(sl3, false); ink('#e8fdff', 5.5, .8); ctx.stroke(); } }
  });
  // --- the courtyard: a radar target under everything that happens in the middle
  saved(() => {
    const cv = (CNL + CSL) / 2;
    ctx.globalAlpha *= ping; ink(CY, 1.2, .16);
    for (const r of [56, 112, 168, 224]) { circleP(0, cv, r, 48); ctx.stroke(); }
    lineSet([[CWL + 8, cv, CEL - 8, cv], [0, CNL + 8, 0, CSL - 8]]); ink(CY, 1.2, .1, [10, 8]); ctx.stroke();
    const sw = lt * 1.1, [x, y] = mp(0, cv);   /* a faint radar sweep */
    ctx.globalCompositeOperation = 'screen'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 224 * M.s, sw - .5, sw); ctx.closePath(); ctx.fillStyle = `rgba(${CYR},.05)`; ctx.fill();
  });

  // ---------------------------------------------------------------- everything that happens on the plan follows the map, so the hologram in the room shows the same drawing
  const rooms = PG.rooms;
  const age = n => lt - (T.pips + (n - 1) * .028);
  saved(() => {   /* 32 rooms light one by one: a fill and a ring */
    for (const r of rooms) {
      const g = age(r.n); if (g < 0) continue;
      const flash = Math.exp(-g / .22);
      rectP(r.x0 + 2, r.y0 + 2, r.x1 - 2, r.y1 - 2); ctx.fillStyle = `rgba(${CYR},${.075 + .22 * flash})`; ctx.fill();
      if (g < .3) { const [x, y] = mp(r.cx, r.cy); ctx.strokeStyle = `rgba(200,250,255,${.8 * (1 - g / .3)})`; ctx.lineWidth = 3 * M.s; ctx.beginPath(); ctx.arc(x, y, (24 + 10 * easeOut(g / .3)) * M.s, 0, TAU); ctx.stroke(); }   /* the ping ripples out from just beyond the number and stays inside its own room (68 wide), so it never crosses a digit */
    }
  });
  // lasers across the call-light hall (the east corridor)
  const trig = [], hall = PG.hall, nSeg = hall.length - 1;
  for (let j = 0; j < nSeg; j++) {
    const vc = (hall[j][1] + hall[j + 1][1]) / 2, dc = 498 + (MID_S - vc);   /* route distance at which a marker on the hall's centre line crosses this beam */
    const tStaff = T.staff0 + (T.staff1 - T.staff0) * seg(dc / ROUTE_LEN, 0, 1);
    trig.push(lt >= tStaff ? Math.exp(-(lt - tStaff) / .3) : 0);
  }
  const laser = sstep(lt, T.laser, T.laser + .3);
  if (laser > 0) saved(() => {
    for (let j = 0; j < nSeg; j++) {
      const fr = clamp01(laser * 1.5 - j * .05), hot = trig[j]; if (fr <= 0) continue;
      const a = hall[j], b = hall[j + 1], c = [lerp(a[0], b[0], fr), lerp(a[1], b[1], fr)], fl = .82 + .18 * Math.sin(lt * 41 + j * 2.1);
      ctx.globalAlpha = 1; lineSet([[a[0], a[1], c[0], c[1]]]);
      ink(`rgb(255,${Math.round(59 + 160 * hot)},${Math.round(78 + 140 * hot)})`, 2.6 + 1.6 * hot, fl); neon(2.6 + 1.6 * hot, fl, 3.6 + 2 * hot);
      if (hot > .05) { const m = mp((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); V2.glow(m[0], m[1], 80 * M.s, '255,90,90', .5 * hot, 'screen', .6); }
    }
    rooms.filter(r => r.side === 'E').forEach((r, i) => { const hot = Math.max(trig[2 * i] || 0, trig[2 * i - 1] || 0), [x, y] = mp(r.dome[0], r.dome[1]); V2.glow(x, y, (34 + 40 * hot) * M.s, REDR, laser * (.45 + .5 * hot), 'screen', .5); ctx.fillStyle = `rgba(255,${100 + 120 * hot},${110 + 110 * hot},${laser})`; ctx.beginPath(); ctx.arc(x, y, (5.6 + 2 * hot) * M.s, 0, TAU); ctx.fill(); });
  });
  // the route to the vault: gold dots marching from the entrance, ending exactly on the vault's door
  const rk = sstep(lt, T.route0, T.vault);
  if (rk > 0) saved(() => { const sl = pathSlice(PG.route, 0, ROUTE_LEN * rk); if (sl.length > 1) { trace(sl, false); ink(GOLD, 4, .95, [.1, 13]); ctx.lineDashOffset = -(lt * 26) * M.s; ctx.stroke(); } });
  // the vault: gold, a padlock, a flare when the voice says "vault"
  const vk = sstep(lt, T.vault - .3, T.vault + .12);
  if (vk > 0) saved(() => {
    const V = PG.vault, pulse = .5 + .5 * Math.sin(lt * 4.2);
    rectP(V.x0 + 2, V.y0 + 2, V.x1 - 2, V.y1 - 2); ctx.fillStyle = `rgba(${GOLDR},${vk * (.26 + .12 * pulse)})`; ctx.fill();
    rectP(V.x0, V.y0, V.x1, V.y1); ink(GOLD, 3.6, vk); neon(3.6, vk, 3);
    const [x, y] = mp(V.cx, V.cy); V2.glow(x, y, (120 + 40 * Math.exp(-(lt - T.vault) / .4) * (lt > T.vault ? 1 : 0)) * M.s, GOLDR, vk * (.45 + .2 * pulse), 'screen', .8);
    padlock(V.cx, V.cy + 2, (lt < T.vault + .12 ? 1.6 - .6 * easeOut(seg(lt, T.vault - .1, T.vault + .12)) : 1) * M.s, vk);
  });
  // the Administrator's patrol loop and the Administrator (lap 1 at walking pace, lap 2 in fast forward with the timer, then he is held)
  const lk = sstep(lt, T.loop0, T.loop1);
  if (lk > 0) saved(() => { const sl = pathSlice(PG.loop, 0, LOOP_LEN * lk); if (sl.length > 1) { trace(sl, false); ink('#ffe9a6', 3.6, .95, [18, 12]); ctx.lineDashOffset = -(lt * 60) * M.s; ctx.stroke(); } });
  const HOLD = LOOP_LEN - 190;   /* where Mango stops him: on the south corridor, east of the nurses' station */
  const dM = lt < T.lap1a ? 0 : lt < T.lap1b ? LOOP_LEN * seg(lt, T.lap1a, T.lap1b) : LOOP_LEN + HOLD * easeIO(seg(lt, T.lap2a, T.lap2b)) * (lt >= T.lap2a ? 1 : 0);
  if (lt >= T.lap1a - .25) {
    const dd = dM, p = pathAt(PG.loop, dd % LOOP_LEN), fast = lt >= T.lap2a && lt < T.lap2b;
    if (fast) for (let i = 4; i >= 1; i--) { const q = pathAt(PG.loop, ((dd - i * 40) % LOOP_LEN + LOOP_LEN) % LOOP_LEN); melonMarker(q[0], q[1], .12 * (5 - i)); }
    melonMarker(p[0], p[1], sstep(lt, T.lap1a - .25, T.lap1a));
  }
  // markers: a staff marker lights every beam, Strawberry walks through untouched
  const dS = ROUTE_LEN * seg(lt, T.staff0, T.staff1), dP = ROUTE_LEN * easeIO(seg(lt, T.straw0, T.straw1));
  if (lt >= T.staff0 - .15 && lt < T.staff1 + .9) { const p = pathAt(PG.route, dS); staffMarker(p[0], p[1], Math.max(0, ...trig)); }
  if (lt >= T.straw0 - .15 && lt < T.straw1 + 1.2) { const p = pathAt(PG.route, dP); strawMarker(p[0], p[1]); }
  // the stamp's slab (its text exists on the flat plan only, so the slab dissolves with it as the plan folds back into the hologram)
  if (lt >= T.final) saved(() => {
    const k = seg(lt, T.final, T.final + .08) * clamp01((map.k - .9) / .1), c = Math.cos(-.1), sn = Math.sin(-.1), pts = [[-300, -130], [300, -130], [300, 130], [-300, 130]].map(([x, y]) => [x * c - y * sn, -124 + x * sn + y * c]);
    trace(pts, true); ctx.fillStyle = `rgba(60,6,14,${.8 * k})`; ctx.fill(); ink(RED, 8, k); ctx.stroke();
  });
  // a scan band sweeps down the drawing now and then
  { const per = 5.5, f = ((lt + 1.5) % per) / per, v = lerp(BV0 - 60, PV1 + 60, f), y = mp(0, v)[1], hh = 70 * M.s;
    if (ping > .5) saved(() => { ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(0, y - hh, 0, y + hh); g.addColorStop(0, 'rgba(77,227,255,0)'); g.addColorStop(.7, 'rgba(120,235,255,.07)'); g.addColorStop(.92, 'rgba(200,250,255,.16)'); g.addColorStop(1, 'rgba(77,227,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.rect(70, y - hh, 940, hh * 2); ctx.clip(); ctx.fillRect(70, y - hh, 940, hh * 2); }); }
  // the pointer (Lemon's pen-light dot)
  const pt = pointerAt(lt);
  if (pt) { const [x, y] = mp(pt[0], pt[1]), a = seg(lt, POINTER[0][0], POINTER[0][0] + .2) * (1 - seg(lt, POINTER[POINTER.length - 1][0], POINTER[POINTER.length - 1][0] + .5));
    saved(() => { V2.glow(x, y, 46 * M.s, '255,236,170', .6 * a, 'screen', .6); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, 5.5 * M.s, 0, TAU); ctx.fill(); ctx.strokeStyle = `rgba(255,224,120,${.9 * a})`; ctx.lineWidth = 2 * M.s; ctx.beginPath(); ctx.arc(x, y, (11 + 2 * Math.sin(lt * 9)) * M.s, 0, TAU); ctx.stroke(); }); }
  // --- the text layer: labels, plates, the counter, the timer (flat plan only; it fades as the plan leaves the flat state)
  if (ta > 0) saved(() => { ctx.globalAlpha *= ta; drawPlanText(lt, T, age, ta); });
}

function drawPlanText(lt, T, age, ta) {
  const rooms = PG.rooms;
  const label = (str, u, v, o2) => { const [x, y] = mp(u, v); return UI.label(str, x, y, o2); };
  for (const r of rooms) { const g = age(r.n); if (g < 0) continue; label(String(r.n), r.cx + r.nrm[0] * 9, r.cy + r.nrm[1] * 9, { size: 30, fill: '#d8faff', weight: 900, alpha: clamp01(g / .1) }); }
  // the counter in the courtyard: ROOMS 00 -> 32
  const cnt = Math.min(32, Math.floor(clamp01((lt - T.pips) / (.028 * 31 + .05)) * 32 + 1e-6)), ca = seg(lt, T.pips - .05, T.pips + .1) * (1 - sstep(lt, T.tilesOut, T.tilesOut + .25));
  if (ca > 0) saved(() => { ctx.globalAlpha *= ca; label('ROOMS', 0, -322, { size: 30, weight: 900, spacing: 12, fill: '#7fe6ff' }); label(String(cnt).padStart(2, '0'), 0, -246, { size: 132, font: 'Bangers', weight: 400, spacing: 4, fill: '#ffffff' }); V2.glow(...mp(0, -246), 150, CYR, .25 * ca, 'screen', .4); });
  // two nurses; one is called out
  const n1 = easeBack(seg(lt, T.nurse1, T.nurse1 + .35)), n2 = easeBack(seg(lt, T.nurse2, T.nurse2 + .35)), gk = sstep(lt, T.grey, T.grey + .3), na = 1 - sstep(lt, T.tilesOut, T.tilesOut + .25);
  for (const [i, k, u] of [[0, n1, -112], [1, n2, 112]]) if (k > 0 && na > 0) saved(() => {
    const [x, y] = mp(u, -90 - 46 * (1 - k)), grey = i === 1 ? gk : 0;
    ctx.globalAlpha *= clamp01(k * 2) * na;
    ctx.fillStyle = GLASS; ctx.strokeStyle = grey > .5 ? '#6f7d86' : CY; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 88, y - 78, 176, 156, 14); ctx.fill(); ctx.stroke();
    nurseIcon(u, -90 - 46 * (1 - k) + 4, grey > .5);
  });
  const sk = seg(lt, T.stamp, T.stamp + .1) * na;
  if (sk > 0) { const [x, y] = mp(112, -62), sc = 1 + .9 * (1 - easeOut(seg(lt, T.stamp, T.stamp + .12))); saved(() => { ctx.globalAlpha *= clamp01(sk * 3); ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y); ctx.save(); ctx.translate(x, y); ctx.rotate(-.09); ctx.fillStyle = 'rgba(30,6,12,.82)'; ctx.beginPath(); ctx.roundRect(-112, -34, 224, 68, 10); ctx.fill(); ctx.restore(); UI.stamp('CALLED OUT', x, y, { size: 44, color: '#ff5063', lw: 5, alpha: 1 }); }); }
  // THE VAULT: label plate with a leader to the vault's door
  drawPlate(lt, { t0: T.vaultLabel, t1: T.policy - .1, u: 172, v: -300, w: 232, h: 64, pad: 10, accent: GOLD, accentR: GOLDR, lines: [{ t: 'THE VAULT', size: 38, font: 'Bangers', weight: 400, spacing: 3, fill: '#ffe9a6' }], leader: { from: [288, -318], to: [PG.vault.cx, PG.vault.cy + 38] }, id: 'plate-vault' });
  // POLICY 14.3: slams onto the middle of the plan
  { const k = seg(lt, T.policy, T.policy + .12), a = k * (1 - seg(lt, T.policyOut, T.policyOut + .2));
    if (a > 0) saved(() => {
      const [x, y] = mp(0, -124), sc = 1 + .5 * (1 - easeOut(k));
      ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
      V2.glow(x, y, 360, GOLDR, .22, 'screen', .3);
      UI.sign([x - 300, y - 144, 600, 288], [{ t: 'POLICY 14.3', size: 104, font: 'Bangers', weight: 400, spacing: 4, fill: GOLD }, { t: 'STAFF MAY NOT USE THIS ROOM', size: 31, spacing: .5, fill: '#fff', gap: 10 }, { t: 'DURING THE SHIFT', size: 31, spacing: .5, fill: '#fff', gap: 2 }],
        { fill: GLASS, stroke: GOLD, lw: 5, r: 18, pad: 38, id: 'plate-policy' });   /* about 40 px of padding on all four sides */
    }); }
  // OBSTACLE 1 / CALL LIGHTS (leader to the east hall)
  drawPlate(lt, { t0: T.ob1, t1: T.ob1Out, u: SLOT.top[0], v: SLOT.top[1], lines: [{ t: 'OBSTACLE 1', size: 30, spacing: 6, fill: '#ff7684' }, { t: 'CALL LIGHTS', size: 64, font: 'Bangers', weight: 400, spacing: 3, fill: '#fff', gap: 4 }], leader: { from: [PLATE.w / 2, SLOT.top[1]], to: [MID_E, SLOT.top[1]] }, id: 'plate-ob1' });
  // BADGE SCAN card: a panel, its title strip, and a two-row table (key | value)
  { const a = plateIn(lt, T.card, T.cardOut);
    if (a > 0) saved(() => {
      const [x, y] = mp(0, -124), w = 500, h = 272, top = y - h / 2, sc = 1 + .12 * (1 - easeOut(seg(lt, T.card, T.card + .24))), r2 = seg(lt, T.cardRow2, T.cardRow2 + .1), bad = lt >= T.cardRow2 ? .55 + .45 * Math.sin(lt * 22) : 0;
      ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
      V2.glow(x, y, 330, CYR, .16, 'screen', .2);
      UI.panel([x - w / 2, top, w, h], { fill: GLASS, stroke: CY, lw: 3, r: 14, id: 'card-badge' });
      ctx.fillStyle = 'rgba(77,227,255,.24)'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 1.5, top + 1.5, w - 3, 66, [12.5, 12.5, 0, 0]); ctx.fill();
      UI.label('BADGE SCAN', x, top + 35, { size: 30, spacing: 6, fill: HI, weight: 900 });
      const noMatch = r2 > 0 ? `rgb(255,${Math.round(90 + 70 * (1 - bad))},${Math.round(100 + 70 * (1 - bad))})` : '#7fc9dc';
      UI.table([x - w / 2, top + 68, w, 204], [{ w: .4, align: 'left' }, { align: 'left' }], [['BADGE', 'PER DIEM'], ['SYSTEM', { t: r2 > 0 ? 'NO MATCH' : '...', fill: noMatch }]],
        { fill: 'rgba(0,0,0,0)', lw: 0, r: 0, size: 38, padX: 30, grid: 'rgba(77,227,255,.35)', id: 'card-rows', text: { fill: '#fff', weight: 900 } });
    }); }
  // OBSTACLE 2 / THE ADMINISTRATOR (leader to the patrol loop)
  drawPlate(lt, { t0: T.ob2, t1: T.ob2Out, u: SLOT.top[0], v: SLOT.top[1], lines: [{ t: 'OBSTACLE 2', size: 30, spacing: 6, fill: '#ff7684' }, { t: 'THE ADMINISTRATOR', size: 52, font: 'Bangers', weight: 400, spacing: 3, fill: '#fff', gap: 4 }], leader: { from: [0, SLOT.top[1] - PLATE.h / 2], to: [0, MID_N] }, id: 'plate-ob2' });
  // the ring timer: the Administrator's loop as a 40 minute dial (14:00 is one lap; Mango stretches it to 40:00)
  { const a = seg(lt, T.timer, T.timer + .2) * (1 - sstep(lt, T.final - .03, T.final + .05));
    if (a > 0) saved(() => {
      const mins = lt < T.forty ? 14 * sstep(lt, T.lap2a, T.lap2b) : lerp(14, 40, easeOut(seg(lt, T.forty, T.forty + .55))), [cx, cy] = mp(0, -96), R = 92, lwR = 17, rr0 = R - lwR / 2, gold = lt >= T.forty;
      ctx.globalAlpha *= a;
      ctx.fillStyle = 'rgba(8,10,20,.74)'; ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, TAU); ctx.fill();
      UI.ring(cx, cy, R, 0, { text: String(Math.floor(mins + 1e-6)).padStart(2, '0') + ':00', size: 80, font: 'Bangers', weight: 400, spacing: 2, ink: gold ? '#ffe9a6' : '#ffffff', lw: lwR, track: 'rgba(77,227,255,.22)', id: 'timer' });
      const k = mins / 40, a0 = -PI / 2, kA = Math.min(k, .35);
      ctx.lineCap = 'round'; ctx.lineWidth = lwR; ctx.strokeStyle = CY; ctx.beginPath(); ctx.arc(cx, cy, rr0, a0, a0 + TAU * kA); ctx.stroke();
      if (k > .35) { ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.arc(cx, cy, rr0, a0 + TAU * .35, a0 + TAU * k); ctx.stroke(); V2.glow(cx, cy, 170, GOLDR, .22 * Math.min(1, (k - .35) * 6), 'screen', .5); }
      ctx.lineCap = 'butt'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(200,250,255,.7)'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const an = a0 + TAU * i / 8, l = i === 0 ? 16 : 9; ctx.moveTo(cx + Math.cos(an) * (R + 6), cy + Math.sin(an) * (R + 6)); ctx.lineTo(cx + Math.cos(an) * (R + 6 + l), cy + Math.sin(an) * (R + 6 + l)); }
      ctx.stroke();
      const ta2 = a0 + TAU * .35; ctx.strokeStyle = CY; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ta2) * (R - 26), cy + Math.sin(ta2) * (R - 26)); ctx.lineTo(cx + Math.cos(ta2) * (R + 18), cy + Math.sin(ta2) * (R + 18)); ctx.stroke();
      label('ADMIN LOOP', 0, 33, { size: 30, weight: 900, spacing: 6, fill: gold ? '#ffe9a6' : '#7fe6ff' });
    }); }
  // ON HOLD: Mango has stopped him
  { const a = seg(lt, T.forty + .3, T.forty + .45) * (1 - sstep(lt, T.final - .03, T.final + .05)), [hx, hy] = mp(190, 152);
    if (a > 0) saved(() => {
      const [px, py] = mp(214, 86), sc = 1 + .15 * (1 - easeOut(seg(lt, T.forty + .3, T.forty + .55)));
      ctx.globalAlpha *= a; ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 20, py + 22); ctx.lineTo(hx + 6, hy - 24); ctx.stroke(); ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.arc(hx, hy, 26, 0, TAU); ctx.stroke();
      ctx.translate(px, py); ctx.scale(sc, sc); ctx.translate(-px, -py);
      UI.pill('ON HOLD', px, py, { size: 30, spacing: 4, fill: GLASS, ink: '#ffe9a6', stroke: GOLD, lw: 3, padX: 20, id: 'pill-hold' });
    }); }
  // MANDATORY IN-SERVICE: the stamp slams on the middle of the plan (it sits inside the courtyard, so it never covers a room number)
  if (lt >= T.final) {
    const k = seg(lt, T.final, T.final + .07), sc = lt < T.final + .07 ? lerp(1.18, 1, easeIn(k)) : 1 + .035 * Math.exp(-(lt - T.final - .07) / .09) * Math.sin((lt - T.final - .07) * 34), [x, y] = mp(0, -124);
    saved(() => {
      ctx.globalAlpha *= clamp01(k * 4); ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
      UI.sign([x - 300, y - 130, 600, 260], [{ t: 'MANDATORY', size: 112, font: 'Bangers', weight: 400, spacing: 5, fill: '#ff5063' }, { t: 'IN-SERVICE', size: 112, font: 'Bangers', weight: 400, spacing: 5, fill: '#ff5063', gap: 6 }],
        { fill: 'rgba(0,0,0,0)', stroke: 'rgba(0,0,0,0)', lw: 0, r: 22, pad: 30, rot: -.1, id: 'stamp-final' });
    });
  }
  // OBSTACLE 3 / ???
  drawPlate(lt, { t0: T.ob3, t1: T.ob3Out, u: SLOT.top[0], v: SLOT.top[1], lines: [{ t: 'OBSTACLE 3', size: 30, spacing: 6, fill: '#ff7684' }, { t: '???', size: 64, font: 'Bangers', weight: 400, spacing: 8, fill: '#fff', gap: 4 }], id: 'plate-ob3' });
}

// ------------------------------------------------------------------ the war room: the medication room with the lights off
/* World units as everywhere in the v2 renderer: X right, Y up, Z forward (S6 / V2.proj). One lens for the whole scene; the shots zoom and pan with zoomTo.
 *   the table (the holo table)  X -330..330, Z 900..1500, top at Y 132; the tablet in its middle (Z 1200)
 *   the cast flank the table: Lemon front-left, Strawberry back-left, Clementine front-right, Mango back-right (faces beside the hologram, never behind it; Mango stands next to Clementine for the shush)
 *   the hologram: the plan on a plane tilted 38 degrees, hovering over the table (centre 0, 300, 1250), 0.62 world units per plan px
 *   back wall at Z 2100: the window (the Moon's) on the right, the HOURS SINCE THE Q WORD sign on the left, a string board between them, the med counter below */
const RM = {
  cam: { f: 1400, cz: -900, cy: 950, hy: 330 },
  zb: 2100, hw: 900, ch: 1300, rail: 130,
  table: { x0: -300, x1: 300, z0: 900, z1: 1500, top: 132 },
  lamp: { X: 0, Z: 1250, pivotY: 1300, len: 640 },
  holo: { X: 0, Y: 440, Z: 1250, ws: .62, tilt: 36 * PI / 180 },
  win: { x0: 220, x1: 560, y0: 380, y1: 860 },
  sign: { x0: -640, x1: -250, y0: 520, y1: 700 },
  cast: { lemon: [-400, 920], straw: [-430, 1620], mango: [430, 1620], clem: [400, 920] },
};
function roomCam() { V2.setCam(RM.cam); }
const scenePt = (X, Y, Z) => V2.proj(X, Y, Z);   /* scene (pre-camera) coordinates and scale */
/* a point in scene coordinates -> screen, through the shot's camera (zoomTo and roll) */
function toScreen(p) {
  const dx = (p[0] - CAM.x) * CAM.z, dy = (p[1] - CAM.y) * CAM.z, c = Math.cos(CAM.r), s = Math.sin(CAM.r);
  return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c];
}
/* the hologram plane: plan (u, v) -> scene point */
function holoScene(u, v) {
  const h = RM.holo, sa = Math.sin(h.tilt), ca = Math.cos(h.tilt);
  return V2.proj(h.X + u * h.ws, h.Y - v * h.ws * sa + BOB * .4, h.Z - v * h.ws * ca);
}
function roomMapOf(collapse = 1) {
  const c = toScreen(holoScene(0, 0)), f0 = (u, v) => toScreen(holoScene(u, v));
  const f = (u, v) => { const p = f0(u, v); return [c[0] + (p[0] - c[0]) * collapse, c[1] + (p[1] - c[1]) * collapse]; };
  const a = f(0, 0), b = f(100, 0);
  return { f, s: Math.max(.02, Math.hypot(b[0] - a[0], b[1] - a[1]) / 100), k: 0 };
}
/* blend of the room hologram and the flat plan (k 0 = in the room, 1 = flat, full frame) */
function morphMap(k, collapse = 1) {
  const R = roomMapOf(collapse), e = easeIO(k);
  if (e <= 0) return R;
  if (e >= 1) return FLAT;
  return { f: (u, v) => { const a = R.f(u, v), b = FLAT.f(u, v); return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)]; }, s: lerp(R.s, 1, e), k: e };
}

// ---- the set
const STEEL = { color: '#202a3e', top: '#334159', front: '#18202f', side: '#121926' };
function roomShell() {
  S6.shell({ zb: RM.zb, hw: RM.hw, ch: RM.ch, rail: RM.rail, wall: '#16223a', wain: '#0e1828', floorA: '#162033', floorB: '#080d17', ceil: '#0a101c', fog: '#04070d', fogAmt: .32, tile: 150, bright: 1 });
}
const FOGB = { color: '#04070d', amt: .3, zFar: 2200 };
function roomDressing(lt) {
  const zb = RM.zb, { box3, onZ } = S6;
  // the med counter along the back wall, wall cabinets at both ends, a fridge
  box3(Object.assign({ x0: -900, x1: 900, y0: 0, y1: 200, z0: zb - 230, z1: zb, fog: FOGB, lw: 1.5 }, STEEL));
  box3({ x0: -900, x1: 900, y0: 200, y1: 214, z0: zb - 236, z1: zb, color: '#3a4a66', top: '#5a6e90', front: '#2c3850', side: '#222c40', fog: FOGB, lw: 1.5 });
  for (const [x0, x1] of [[-890, -690], [690, 890]]) { box3({ x0, x1, y0: 640, y1: 960, z0: zb - 130, z1: zb, color: '#1d2a44', top: '#2b3b5c', front: '#223150', side: '#162036', fog: FOGB, lw: 1.5 }); onZ(zb - 130, x0 + 14, (x0 + x1) / 2 - 7, 654, 946, 'rgba(255,255,255,.04)', 'rgba(150,190,255,.3)', 1.6); onZ(zb - 130, (x0 + x1) / 2 + 7, x1 - 14, 654, 946, 'rgba(255,255,255,.04)', 'rgba(150,190,255,.3)', 1.6); }
  box3({ x0: 610, x1: 760, y0: 214, y1: 330, z0: zb - 190, z1: zb - 60, color: '#6d2230', top: '#8a2c3d', front: '#5a1a28', side: '#431320', fog: FOGB, lw: 1.5 });   /* a red sharps bin */
  box3({ x0: -760, x1: -640, y0: 214, y1: 300, z0: zb - 190, z1: zb - 80, color: '#cfd8e6', top: '#e8eef8', front: '#b8c4d6', side: '#8fa0b8', fog: FOGB, lw: 1.5 });   /* a cardboard-white box of gloves */
  // a sink basin set into the counter
  { const q = [V2.p2(-420, 214, zb - 190), V2.p2(-240, 214, zb - 190), V2.p2(-240, 214, zb - 50), V2.p2(-420, 214, zb - 50)]; V2.poly(q, '#0c1220', 'rgba(150,190,255,.35)', 2); }
  // the string board between the sign and the window: cork, photos, red string
  const bx0 = -190, bx1 = 150, by0 = 420, by1 = 800, bz = zb - 6;
  onZ(bz, bx0 - 14, bx1 + 14, by0 - 14, by1 + 14, '#2a2030', 'rgba(0,0,0,.5)', 2); onZ(bz, bx0, bx1, by0, by1, '#4a3a38', 'rgba(0,0,0,.5)', 2);
  const photos = [[-120, 720, '#c9b8a8'], [20, 740, '#b8c6a8'], [100, 640, '#c8a8b8'], [-60, 600, '#a8b8c8'], [-130, 500, '#c8c0a0'], [30, 500, '#b0a8c8']];
  for (const [x, y, c] of photos) { onZ(bz - 2, x - 34, x + 34, y - 30, y + 38, '#e8e2d4', 'rgba(0,0,0,.5)', 1.5); onZ(bz - 3, x - 28, x + 28, y - 18, y + 32, c); const [ex, ey] = V2.p2(x, y + 8, bz - 4), k = S6.kz(bz); ctx.fillStyle = 'rgba(30,20,40,.7)'; ctx.beginPath(); ctx.arc(ex - 9 * k, ey, 3.4 * k, 0, TAU); ctx.arc(ex + 9 * k, ey, 3.4 * k, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.strokeStyle = 'rgba(255,70,80,.8)'; ctx.lineWidth = Math.max(1.4, 2.6 * S6.kz(bz)); ctx.lineCap = 'round';
  const pts = photos.map(([x, y]) => V2.p2(x, y + 36, bz - 6)); ctx.beginPath(); [0, 1, 2, 5, 4, 3, 0, 5].forEach((i, n) => n ? ctx.lineTo(...pts[i]) : ctx.moveTo(...pts[i])); ctx.stroke(); ctx.restore();
}
/* the window: dusk sky, treeline, stars, and the Moon (rises into it when Lemon calls her) */
function roomWindow(lt, moonK, o = {}) {
  const zb = RM.zb - 4;
  return S7.winPane(zb, RM.win, f => {
    const [bx, by] = f[0], [tx2, ty] = f[2], cx = (f[0][0] + f[1][0]) / 2, ww = f[1][0] - f[0][0], hh = by - ty;
    A7.stars(lt, ty + hh * .7, { n: 70, seed: 3, a: .8 });
    ctx.fillStyle = 'rgba(255,150,90,.28)'; ctx.fillRect(bx, by - hh * .22, ww, hh * .22);
    ctx.fillStyle = '#070b1c'; ctx.beginPath(); ctx.moveTo(bx, by); for (let i = 0; i <= 14; i++) ctx.lineTo(bx + ww * i / 14, by - hh * (.1 + .05 * Math.sin(i * 1.7) + .04 * Math.sin(i * 3.9))); ctx.lineTo(bx + ww, by); ctx.closePath(); ctx.fill();
    if (moonK > 0) {
      const rise = 1 - easeOut(clamp01(moonK)), cy = (by + ty) / 2 + rise * hh * .85;
      A7.moon(cx, cy, .8 * ww / 295, Object.assign({ t: lt, alpha: 1, char: Object.assign({ expr: 'neutral', look: [0, 0] }, o.char || {}) }, o.moon || {}));
    }
  }, { sky: [[0, '#070a22'], [.55, '#141f52'], [1, '#2e3f86']], frame: '#26324e', curtains: false, sill: false });
}
function roomSign(lt, flash, flicker, transit, alpha = 1) {
  const zb = RM.zb - 4, r = RM.sign, f = S7.qSign(zb, r, 99, { flash, flicker, title: '' });
  const w = f[1][0] - f[0][0], h = f[0][1] - f[2][1], cx = (f[0][0] + f[1][0]) / 2, size = h * .17, str = 'HOURS SINCE THE Q WORD', o = { size, weight: 900, spacing: size * .1, maxW: w * .92 };
  const fit = UI.fit(str, o.maxW, Object.assign({ quiet: true }, o)), px = fit.size * CAM.z;
  /* set dressing: it may sweep through the pill and caption zones while the camera whips past; during the dive it dissolves under the plan instead of being covered by it */
  if (alpha > .02) UI.label(str, cx, f[2][1] + h * .19, Object.assign(o, { fill: 'rgba(255,255,255,.9)', hero: px >= 31, transit: !!transit, zone: !!transit, alpha, id: 'qsign' }));
  return f;
}
/* the holo table: a slab on a pedestal, the tablet in its middle, rings of light on the surface */
function roomTable(lt, power) {
  const T = RM.table, { box3 } = S6, cx = 0, cz = 1200, top = T.top;
  box3(Object.assign({ x0: -110, x1: 110, y0: 0, y1: 100, z0: cz - 110, z1: cz + 110, lw: 1.5 }, { color: '#111a2a', top: '#1c2a42', front: '#0e1624', side: '#0a111c' }));
  box3({ x0: T.x0, x1: T.x1, y0: top - 36, y1: top, z0: T.z0, z1: T.z1, color: '#2a3b5a', top: '#2d4166', front: '#1f2d46', side: '#18243a', edge: `rgba(77,227,255,${.45 + .4 * power})`, lw: 2 });
  // the top: a dark glass inset and a cyan edge line that powers up
  const q = [V2.p2(T.x0 + 18, top, T.z0 + 18), V2.p2(T.x1 - 18, top, T.z0 + 18), V2.p2(T.x1 - 18, top, T.z1 - 18), V2.p2(T.x0 + 18, top, T.z1 - 18)];
  V2.poly(q, '#0d1628', `rgba(77,227,255,${.3 + .6 * power})`, 2.4);
  // the tablet and its lens
  const t = [V2.p2(-70, top + 1, cz - 46), V2.p2(70, top + 1, cz - 46), V2.p2(70, top + 1, cz + 46), V2.p2(-70, top + 1, cz + 46)];
  V2.poly(t, '#05080f', 'rgba(150,200,255,.5)', 1.6);
  const [lx, ly, lk] = V2.proj(0, top + 2, cz);
  ctx.fillStyle = `rgba(160,245,255,${.2 + .8 * power})`; ctx.beginPath(); ctx.ellipse(lx, ly, 22 * lk, 11 * lk, 0, 0, TAU); ctx.fill();
  // rings of light spreading over the table
  ctx.save(); ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    const ph = ((lt * .5 + i / 3) % 1), r = 70 + 220 * ph, a = power * (1 - ph) * .8, pts = [];
    for (let n = 0; n <= 48; n++) { const an = n / 48 * TAU; pts.push(V2.p2(Math.cos(an) * r, top + 1, cz + Math.sin(an) * r * .9)); }
    ctx.strokeStyle = `rgba(110,235,255,${a})`; ctx.beginPath(); pts.forEach((p, n) => n ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke();
  }
  ctx.restore();
  V2.glow(lx, ly, 330 * lk, CYR, .55 * power, 'screen', .6);
  { const b = lt - (TX().B.open.s + .55); if (b >= 0 && b < .5) { const k = b / .5, pts = []; for (let n = 0; n <= 48; n++) { const an = n / 48 * TAU; pts.push(V2.p2(Math.cos(an) * (60 + 360 * k), top + 1, cz + Math.sin(an) * (60 + 360 * k) * .9)); } ctx.save(); ctx.strokeStyle = `rgba(220,252,255,${.9 * (1 - k)})`; ctx.lineWidth = 4; ctx.beginPath(); pts.forEach((p, n) => n ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); ctx.restore(); V2.glow(lx, ly, 420 * lk, '200,250,255', .6 * (1 - k), 'screen', .8); } }
}
/* the pendant lamp: a cord from the ceiling, a shade, a warm bulb and a cone of light; it sways, and hangs still while the room is quiet */
function lampAmp(lt) { const tl = TX().L; return (1 - sstep(lt, TX().B.q.s, TX().B.q.s + .35)) + sstep(lt, tl.l12.s, tl.l12.s + .3); }
function lampPose(lt) {
  const L = RM.lamp, amp = clamp01(lampAmp(lt)) * sstep(lt, .1, .5), th = .085 * amp * Math.sin(lt * 2.1 + .3) + .02 * Math.sin(lt * 5.3);
  const X = L.X + Math.sin(th) * L.len, Y = L.pivotY - Math.cos(th) * L.len;
  return { th, head: V2.proj(X, Y, L.Z), pivot: V2.proj(L.X, L.pivotY, L.Z), X, Y };
}
function roomLamp(lt, power) {
  const P = lampPose(lt), [hx, hy, k] = P.head, [px, py] = P.pivot;
  ctx.save(); ctx.strokeStyle = '#0a0e18'; ctx.lineWidth = Math.max(2, 4 * k); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(hx, hy - 30 * k); ctx.stroke(); ctx.restore();
  // the cone of light
  const dx = Math.sin(P.th), dy = Math.cos(P.th), tip = [hx + dx * 560 * k, hy + dy * 560 * k];
  V2.beam(hx, hy + 10 * k, tip[0], tip[1], 70 * k, 520 * k, '255,196,120', .2 * (.55 + .45 * power));
  // the shade (a cone) and its bulb
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(P.th);
  ctx.fillStyle = '#1a2236'; ctx.strokeStyle = 'rgba(160,190,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26 * k, -52 * k); ctx.lineTo(26 * k, -52 * k); ctx.lineTo(84 * k, 8 * k); ctx.lineTo(-84 * k, 8 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,224,170,.95)'; ctx.beginPath(); ctx.ellipse(0, 8 * k, 60 * k, 9 * k, 0, 0, TAU); ctx.fill();
  ctx.restore();
  V2.glow(hx, hy + 16 * k, 150 * k, '255,200,130', .6, 'screen', .8);
}
// ------------------------------------------------------------------ the cast
/* Lemon's pen-light: a slim torch held in the hand, aimed by o.penAng (radians, 0 = along +x of the character), with its beam running o.penLen px to the hologram */
EXT.prop.fp13_penlight = (side, o, t) => {
  ctx.save(); ctx.rotate(o.penAng ?? -.6);
  ctx.fillStyle = '#2b2f3a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-8, -6, 58, 12, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9ced8'; ctx.fillRect(34, -6, 6, 12); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(52, 0, 6, 0, TAU); ctx.fill();
  if ((o.penOn ?? 1) > 0) {
    const L = o.penLen ?? 300, a = o.penOn ?? 1;
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(52, 0, 52 + L, 0); g.addColorStop(0, `rgba(255,244,200,${.75 * a})`); g.addColorStop(1, `rgba(255,244,200,${.25 * a})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(52, -3); ctx.lineTo(52 + L, -7); ctx.lineTo(52 + L, 7); ctx.lineTo(52, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,250,220,${.9 * a})`; ctx.beginPath(); ctx.arc(52 + L, 0, 9, 0, TAU); ctx.fill();
  }
  ctx.restore();
};
Object.assign(PROP_BOX, { fp13_penlight: [-14, -22, 64, 22] });
/* Clementine's price tag (the engine's 'pricetag', copied): its price dissolves as the tag sinks into the caption zone of a close-up, where the captions would cover it anyway */
EXT.acc.fp13_tag = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.translate(18, k.ry * .77 + 12); ctx.rotate(Math.sin(t * 3) * .12);
  ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 22); ctx.stroke();
  ctx.fillStyle = '#fffdf0'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(40, 20); ctx.lineTo(40, 42); ctx.lineTo(4, 42); ctx.lineTo(-4, 31); ctx.closePath(); ctx.fill(); ctx.stroke();
  const m = ctx.getTransform(), a = clamp01((1355 - (m.b * 22 + m.d * 31 + m.f)) / 50);
  if (a > .01) text('$89', 22, 31, { size: 12, fill: '#d62828', weight: 900, alpha: a, hero: false });
};

const KIND_OF = { lemon: A7.lemon, straw: A11.straw, mango: o => A7.mango(Object.assign({ acc: ['badge7', 'gaitbelt7'] }, o)), clem: o => A10.clem(Object.assign({ acc: ['steth', 'fp13_tag', 'badge7'] }, o)) };
function castO(name, extra) {
  const [X, Z] = RM.cast[name];
  return KIND_OF[name](Object.assign(V2.at(X, Z), extra));
}
/* light one character: the cyan key comes up from the hologram on the table, a warm rim from the lamp, and two practical lights so the colour spills onto the body */
let ROOMLIGHTS = [];   /* lights a shot adds on top of the room's own (the red call light, the spot) */
function lightFor(lt, o, power, extra) {
  const hc = holoScene(0, 0), lp = lampPose(lt).head;
  const fx = hc[0] - o.x, d = Math.max(1, Math.abs(fx) + 140);
  V2.setLight(Object.assign({ key: [clamp(fx / d, -.9, .9) * .75, .68], keyColor: '#8ff0ff', keyA: .85 * power, rim: '#ffac62', rimA: .9, shadow: '#030812', shadowA: .45, bounce: '#3fc8ff', bounceA: .45 * power, amb: '#0e1a38', ambA: .08, back: null }, extra));
  V2.addLight({ x: hc[0], y: hc[1], r: 720, color: CYR, a: .72 * power });
  V2.addLight({ x: lp[0], y: lp[1], r: 900, color: '255,190,110', a: .5 });
  const rk = redK(lt); if (rk > 0) { const sp = SIGNPT(); V2.addLight({ x: sp[0], y: sp[1], r: 1200, color: REDR, a: .85 * rk }); }
  for (const l of ROOMLIGHTS) V2.addLight(l);
}
/* o.fast: the camera is whipping past faster than the text gate can follow a badge across the frame edge (over about 2000 px/s), so the cast is drawn unaudited for those few blurred frames, as a character in transit is */
function putChar(lt, o, power, extra) { lightFor(lt, o, power, extra); if (o.fast) REG.suppress++; try { drawChar(o); } finally { if (o.fast) REG.suppress--; } }

// ------------------------------------------------------------------ acting helpers
const lerpE = (a, b, k) => { const A = EXPR[a], B = EXPR[b]; return { ang: lerp(A.ang, B.ang, k), raise: lerp(A.raise, B.raise, k), curve: lerp(A.curve, B.curve, k), lid: lerp(A.lid, B.lid, k), wide: lerp(A.wide, B.wide, k), pup: lerp(A.pup, B.pup, k), o: k > .5 ? B.o : A.o, smirk: k > .5 ? B.smirk : A.smirk, asym: k > .5 ? B.asym : A.asym }; };
const inL = (lt, id) => lt >= TX().L[id].s && lt < TX().L[id].e;
const bump = (lt, a, b) => Math.sin(clamp01((lt - a) / (b - a)) * PI);                   /* 0 -> 1 -> 0 over [a, b] */
const holdK = (lt, a, b, c, d) => sstep(lt, a, b) * (1 - sstep(lt, c, d));                /* ramps up over [a, b], holds, ramps down over [c, d] */
/* a pulse on every stressed word of a spoken line (the body bobs a little with the speech) */
function stress(lt, id, min = 4) { const l = TX().L[id]; if (!l) return 0; let k = 0; for (const w of l.w) if (w.t.replace(/[^A-Za-z]/g, '').length >= min && lt >= w.s) k = Math.max(k, Math.exp(-(lt - w.s) / .13)); return k; }
const bodyCenter = o => { const k = KINDS[o.kind], leg = o.noLegs ? 0 : (k.leg || 90); return [o.x, o.y - (o.lift || 0) - (leg + k.ry * .9) * (o.s || 1)]; };
const toLocal = (o, sx, sy) => { const c = bodyCenter(o), s = o.s || 1; return [(sx - c[0]) / s * (o.flip ? -1 : 1), (sy - c[1]) / s]; };
/* eyes toward a scene point: the look vector (-1..1 each way) for a face at (o) */
function gaze(o, tx, ty) { const c = faceC(o); return [clamp((tx - c[0]) / 240, -1, 1), clamp((ty - c[1]) / 240, -1, 1)]; }
const SIGNPT = () => scenePt(-445, 610, RM.zb - 4), WINPT = () => scenePt(390, 640, RM.zb - 4), HOLOPT = () => holoScene(0, -60);
const faceOfName = name => faceC(castO(name));
/* how much the red of the sign is on the room: it comes up when the room goes quiet and decays */
const redK = lt => { const q = TX().B.q, l11 = TX().L.l11; return sstep(lt, q.s, q.s + .25) * (1 - .55 * sstep(lt, l11.e, l11.e + .6)) * (1 - sstep(lt, TX().L.l12.s, TX().L.l12.s + .5)); };
const SHH = () => TX().L.a1.s;   /* the "Shh!" */

// ---- Lemon: the brains. Front left, pen-light in her right hand
function penTarget(lt) {
  const pt = pointerAt(lt);
  if (pt) return holoScene(pt[0], pt[1]);
  const t = TX().L;
  if (lt >= t.l12.s - .1 && lt < t.l12.e + .3) { const w = WINPT(); return w; }
  return holoScene(0, -124);
}
function actLemon(lt) {
  const t = TX().L, B = TX().B, base = castO('lemon');
  let expr = 'neutral', look = gaze(base, ...HOLOPT()), arms = { l: 'rest', r: 'hold' }, hand = {}, grip = {}, penOn = 1, rot = 0, squash = 0, face = null, penAngOverride = null;
  const sp = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12', 'l13'].find(id => inL(lt, id));
  squash += .05 * stress(lt, sp || 'l1');
  // 0 - 1.2: she watches the table come alive, then turns her eyes on the crew
  if (lt < .25) look = [.3, .6]; else if (lt < 1.05) look = gaze(base, ...HOLOPT()); else look = lerp2(gaze(base, ...HOLOPT()), [.1, -.05], sstep(lt, 1.05, 1.25));
  // the pen-light follows the pointer; she nods with each stressed word
  const tg = penTarget(lt), loc = toLocal(base, tg[0], tg[1]), sh = shoulder(KINDS.lemon, 1), ang = Math.atan2(loc[1] - sh[1], loc[0] - sh[0]), reach = 78;
  grip.r = [sh[0] + Math.cos(ang) * reach, sh[1] + Math.sin(ang) * reach];
  const tipX = grip.r[0] + Math.cos(ang) * 52, tipY = grip.r[1] + Math.sin(ang) * 52;
  let penAng = ang, penLen = Math.max(40, Math.hypot(loc[0] - tipX, loc[1] - tipY));
  hand.r = 'grip';
  if (lt >= t.l4.s && lt < t.l4.e) { expr = 'grumpy'; face = lerpE('neutral', 'grumpy', .5); }                      /* "Policy fourteen point three." the voice of the rule book */
  if (lt >= t.l6.s && lt < t.l7.e) { expr = 'smug'; face = lerpE('neutral', 'smug', .6); }
  if (lt >= t.l10.s && lt < B.q.e + .2) { face = lerpE('neutral', 'dead', .5); }
  // the room goes quiet: pen-light off, she looks at the sign, then back at the crew
  const q = B.q;
  if (lt >= q.s - .1) { look = lt < t.l11.s + .25 ? gaze(base, ...SIGNPT()) : lt < t.l11.s + .5 ? [-.2, -.1] : lt < t.l11.s + .62 ? gaze(base, ...SIGNPT()) : [.1, 0]; }
  if (lt >= q.s - .15 && lt < t.l12.s - .1) { penOn = 0; const k = sstep(lt, q.s - .15, q.s + .2); arms = { l: 'rest', r: 'rest' }; grip = {}; hand.r = 'grip'; if (k >= 1) penAngOverride = 1.3; }
  // l11: she says it in a whisper, lowering her head toward the crew
  if (lt >= t.l11.s - .1 && lt < t.l11.e + .1) { rot = .04 * bump(lt, t.l11.s - .1, t.l11.e + .1); squash += .04; }
  // the shush: a finger to her lips, eyes on Clementine
  const shh = SHH();
  if (lt >= shh && lt < shh + 1.1 + .2) {
    const k = sstep(lt, shh + .6, shh + .74), fk = 1 - sstep(lt, shh + 1.08, shh + 1.28), kk = k * fk, ml = [0, KINDS.lemon.mouthY + 30];
    arms = { l: 'rest', r: 'rest' }; grip = {}; if (kk > 0) { arms.l = 'hold'; grip.l = [lerp(-105, 6, kk), lerp(20, ml[1] + 4, kk)]; hand.l = 'point'; }
    look = gaze(base, ...faceOfName('clem'));
    penOn = 0; penAngOverride = 1.3;
  }
  // l12: "Moon. You're on the window.", she points the pen-light at the window
  if (lt >= t.l12.s - .1 && lt < t.l12.e) { expr = 'neutral'; look = gaze(base, ...WINPT()); }
  // l13: deadpan to the end
  if (lt >= t.l13.s - .2) { face = lerpE('neutral', 'smug', .4); look = lt < t.l13.s + .9 ? [.05, -.05] : [.05, 0]; }
  if (lt >= t.s2.s - .1) { penOn = 0; arms = { l: 'rest', r: 'rest' }; grip = {}; penAngOverride = 1.3; }
  if (lt >= B.end.s - .6) { look = [.0, 0]; penOn = 0; }
  if (penAngOverride != null) penAng = penAngOverride;
  return castO('lemon', Object.assign({ expr, face: face || undefined, look, arms, hand, grip, hold: { r: 'fp13_penlight' }, penAng, penLen, penOn, rot: rot + .012 * Math.sin(lt * 1.3), squash, plant: true, t: lt }));
}
function lerp2(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }

// ---- Strawberry: the ghost. Back left, deadpan, per diem badge
function actStraw(lt) {
  const t = TX().L, B = TX().B, base = castO('straw');
  let expr = 'dead', look = gaze(base, ...HOLOPT()), arms = { l: 'rest', r: 'rest' }, hand = {}, grip = {}, squash = 0, face = null, badgeSwing = 0, lid = .5;
  const shrug = holdK(lt, t.s1.s + .35, t.s1.s + .55, t.s1.e - .1, t.s1.e + .2);
  // l6 / s1: the spotlight finds her: she looks away, then slowly at the camera, then the little shrug of "per diem"
  if (lt >= t.l6.s - .3 && lt < t.s1.e + .8) {
    look = lt < t.l6.s + .9 ? gaze(base, ...faceOfName('lemon')) : lt < t.l6.s + 1.0 ? lerp2(gaze(base, ...faceOfName('lemon')), [0, 0], sstep(lt, t.l6.s + .9, t.l6.s + 1.0)) : [0, .02];
    lid = lerp(.5, .3, sstep(lt, t.l6.s + .8, t.l6.s + 1.5));
  }
  if (shrug > 0) { arms = { l: 'shrug', r: 'shrug' }; badgeSwing = .16 * shrug; squash += .04 * shrug; }
  // s2 "And if we're caught?": worried, eyes going to Lemon at the end
  if (lt >= t.s2.s - .15 && lt < t.s2.e + .3) { face = lerpE('dead', 'weak', .8); lid = .22; look = lt < t.s2.s + .55 ? [0, -.02] : gaze(base, ...faceOfName('lemon')); }
  // q: eyes to the sign, the shush: a finger to her lips
  if (lt >= B.q.s - .05 && lt < t.l12.s) look = gaze(base, ...SIGNPT());
  const shh = SHH();
  if (lt >= shh + .1 && lt < shh + 1.3) { const kk = sstep(lt, shh + .7, shh + .85) * (1 - sstep(lt, shh + 1.1, shh + 1.3)); arms = { l: 'rest', r: 'rest' }; if (kk > 0) { arms.r = 'hold'; grip.r = [lerp(105, 8, kk), lerp(30, KINDS.straw.mouthY + 28, kk)]; hand.r = 'point'; } look = gaze(base, ...faceOfName('clem')); }
  if (lt >= B.end.s - .5) { look = [.3, .0]; }
  return castO('straw', Object.assign({ expr, face: face || undefined, lid, look, arms, hand, grip, squash, badgeSwing, plant: true, rot: .01 * Math.sin(lt * 1.1 + 1), t: lt }));
}

// ---- Mango: the talker. Back right, next to Clementine
function actMango(lt, o2 = {}) {
  const t = TX().L, B = TX().B, base = castO('mango');
  let expr = 'neutral', look = gaze(base, ...HOLOPT()), arms = { l: 'rest', r: 'rest' }, hand = {}, grip = {}, squash = 0, rot = 0, face = null, who;
  // m1 "Why is it locked?": a hand up like a student, brows up, head tilting on "locked"
  if (lt >= t.m1.s - .5 && lt < t.m1.e + .5) { const k = holdK(lt, t.m1.s - .3, t.m1.s - .05, t.m1.e + .1, t.m1.e + .4); arms = { l: 'rest', r: 'up' }; face = lerpE('neutral', 'hopeful', .9 * clamp01(sstep(lt, t.m1.s - .3, t.m1.s))); rot = .07 * sstep(lt, t.m1.s + .45, t.m1.s + .75); look = [-.15 * rot * 10, -.1]; if (k <= 0) arms = { l: 'rest', r: 'rest' }; squash += .04 * stress(lt, 'm1', 3); }
  // m2 "I'll talk to him.": thumb to her chest, chin up
  if (lt >= t.m2.s - .2 && lt < t.m2.e + .4) { const k = sstep(lt, t.m2.s + .05, t.m2.s + .25) * (1 - sstep(lt, t.m2.e - .05, t.m2.e + .3)); face = lerpE('neutral', 'smug', .75); look = [-.05, -.1]; if (k > 0) { arms = { l: 'hold', r: 'rest' }; grip.l = [lerp(-100, -22, k), lerp(20, 30, k)]; hand.l = 'thumb'; } rot = -.04; squash += .05 * stress(lt, 'm2', 3); }
  // m3 "I can hold him for forty.": both fists clenched in front of her, a squeeze on "hold"
  if (lt >= t.m3.s - .2 && lt < t.m3.e + .3) { const k = sstep(lt, t.m3.s, t.m3.s + .22) * (1 - sstep(lt, t.m3.e, t.m3.e + .3)), sq = bump(lt, wordT('m3', 'hold'), wordT('m3', 'hold') + .25); face = lerpE('neutral', 'angry', .45); look = [0, 0]; if (k > 0) { arms = { l: 'hold', r: 'hold' }; grip.l = [lerp(-100, -34, k), lerp(20, 36, k)]; grip.r = [lerp(100, 34, k), lerp(20, 36, k)]; hand = { l: 'fist', r: 'fist' }; } squash += .08 * sq + .03 * stress(lt, 'm3', 3); }
  // q: eyes to the sign. The shush: she clamps a hand over Clementine's mouth (drawn as an overlay: see shushHand)
  if (lt >= B.q.s - .05 && lt < t.l12.s) look = gaze(base, ...SIGNPT());
  const shh = SHH();
  if (lt >= t.c3.s && lt < shh + 1.3) look = gaze(base, ...faceOfName('clem'));
  if (lt >= shh - .1 && lt < shh + 1.5) { arms = { l: 'rest', r: 'none' }; face = lerpE('neutral', 'angry', .5); }
  if (lt >= B.end.s - .5) look = [-.3, 0];
  return castO('mango', Object.assign({ expr, face: face || undefined, look, arms, hand, grip, squash, rot: rot + .012 * Math.sin(lt * 1.2 + 2), plant: true, t: lt }, o2));
}

// ---- Clementine: the muscle. Front right, new hire
function actClem(lt) {
  const t = TX().L, B = TX().B, base = castO('clem');
  let expr = 'hopeful', look = gaze(base, ...HOLOPT()), arms = { l: 'rest', r: 'rest' }, hand = {}, grip = {}, squash = 0, rot = 0, face = null, sparkle = false;
  // c1 "Sure!": a bright nod and a fist at her chest
  if (lt >= t.c1.s - .2 && lt < t.c1.e + .5) { const k = bump(lt, t.c1.s - .05, t.c1.e + .25); face = lerpE('hopeful', 'happy', .8); sparkle = true; squash += .12 * bump(lt, t.c1.s, t.c1.s + .2) + .06 * bump(lt, t.c1.s + .2, t.c1.s + .4); look = [-.2, -.05]; arms = { l: 'hold', r: 'rest' }; grip.l = [lerp(-95, -34, sstep(lt, t.c1.s - .05, t.c1.s + .12)), lerp(30, 74, sstep(lt, t.c1.s - .05, t.c1.s + .12))]; hand.l = 'fist'; }
  // c2 "I can't ignore a call light.": earnest, eyes catching the red blink off to the side, hands clasped
  if (lt >= t.c2.s - .15 && lt < t.c2.e + .3) { face = lerpE('hopeful', 'sad', .6); look = lt < t.c2.s + .6 ? [-.5, -.15] : [-.2, .1]; arms = { l: 'hold', r: 'hold' }; const k = sstep(lt, t.c2.s - .1, t.c2.s + .2); grip.l = [lerp(-100, -20, k), lerp(20, 40, k)]; grip.r = [lerp(100, 20, k), lerp(20, 40, k)]; hand = { l: 'grip', r: 'grip' }; squash += .04 * stress(lt, 'c2', 3); rot = -.03; }
  // q: looks at the sign; c3 "What's the...": leaning in, mouth open; then Mango's hand
  if (lt >= B.q.s - .05 && lt < t.c3.s - .1) look = gaze(base, ...SIGNPT());
  if (lt >= t.c3.s - .1 && lt < t.c3.e + .15) { face = lerpE('hopeful', 'shock', .35); rot = -.05 * sstep(lt, t.c3.s, t.c3.s + .3); look = [-.05, -.1]; squash += .05 * stress(lt, 'c3', 3); }
  const shh = SHH();
  if (lt >= shh - .02 && lt < shh + 1.3) { face = lerpE('shock', 'panic', .3); look = gaze(base, ...faceC(castO('mango', SHH_POS(lt)))); rot = .025 * Math.sin(lt * 46) * sstep(lt, shh + .1, shh + .2); arms = { l: 'rest', r: 'rest' }; }
  if (lt >= B.end.s - .5) look = [-.3, .1];
  return castO('clem', Object.assign({ expr, face: face || undefined, look, arms, hand, grip, squash, rot: rot + .012 * Math.sin(lt * 1.4 + 3), sparkle, plant: true, t: lt }));
}

// ------------------------------------------------------------------ a room shot: the set, the cast, the hologram
const powerAt = lt => { const B = TX().B, q = B.q, e = B.end; return sstep(lt, .22, .75) * (1 - .6 * (sstep(lt, q.s, q.s + .2) - sstep(lt, q.e + .1, q.e + .5))) * (1 - sstep(lt, e.s + .05, e.s + .45)); };
function drawHolo(lt, k, power, collapse) {
  if (power <= 0 || collapse <= 0) return;
  const map = morphMap(k, collapse);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const e = map.k;
  // the projection field: a grid on the hologram plane (the paper's grid takes over as the plan fills the frame)
  if (e < .98) { ctx.save(); M = map; ctx.globalAlpha = (1 - e) * power;
    ctx.fillStyle = 'rgba(77,227,255,.05)'; rectP(-BU - 10, BV0 - 10, BU + 10, PV1 + 10); ctx.fill();
    ink(CY, 1.4, .5); rectP(-BU - 10, BV0 - 10, BU + 10, PV1 + 10); ctx.stroke();
    const g = []; for (let u = -432; u <= 432; u += 96) g.push([u, BV0 - 10, u, PV1 + 10]); for (let v = -480; v <= 480; v += 96) g.push([-BU - 10, v, BU + 10, v]); lineSet(g); ink(CY, 1, .22); ctx.stroke(); ctx.restore(); }
  ctx.globalAlpha = Math.min(1, power * 1.2);
  drawPlan(lt, map);
  ctx.restore();
}
function roomDraw(lt, o = {}) {
  const power = o.power ?? powerAt(lt), B = TX().B, tr = !!o.transit;
  V2.opts.reflect = true;
  const flash = o.flash ?? 0, flick = o.flick ?? 1, objs = o.objs || {};
  const mk = n => { const c = objs[n]; if (c === false) return null; const x = c || (n === 'lemon' ? actLemon(lt) : n === 'straw' ? actStraw(lt) : n === 'mango' ? actMango(lt) : actClem(lt)); if (tr) x.transit = true; if (o.who && !x.keepWho) x.who = o.who; if (o.fast) x.fast = true; return x; };
  V2.dof(o.dof ?? 3, () => {
    roomShell(); roomDressing(lt);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = V2.radial(540, 800, 260, 1150, [[0, 'rgba(255,255,255,1)'], [.6, 'rgba(120,140,190,1)'], [1, 'rgba(14,20,40,1)']]); ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore();
    const fh = scenePt(0, 0, 1250); V2.glow(fh[0], fh[1] + 30, 520 * fh[2], CYR, .16 * power, 'screen', .2);
    if (!o.signSharp) roomSign(lt, flash, flick, true, o.signA ?? 1);   /* part of the soft background, except when the sign is the subject */
  });
  roomWindow(lt, o.moonK ?? 0, o.moonOpt || {});
  if (o.signSharp) roomSign(lt, flash, flick, o.transit);
  if (o.mid) o.mid();
  for (const n of (o.mangoFront ? ['straw'] : ['straw', 'mango'])) { const c = mk(n); if (c) putChar(lt, c, power, o.light); }
  if (!o.noTable) V2.dof(o.dof2 ?? 0, () => {
    roomTable(lt, power);
    { const a = scenePt(0, 134, 1200), b = holoScene(0, 100); V2.beam(a[0], a[1], b[0], b[1] - 10, 50 * a[2], 360 * b[2], CYR, .2 * power); }
    if (!o.noHolo) drawHolo(lt, o.k ?? 0, power * (o.holoA ?? 1), o.collapse ?? 1);
  });
  for (const n of (o.mangoFront ? ['mango', 'clem', 'lemon'] : ['clem', 'lemon'])) { const c = mk(n); if (c) putChar(lt, c, power, o.light); }
  if (o.after) o.after();
  roomLamp(lt, power);
  V2.dust(220, 260, 900, 1100, lt, { n: 60, color: '150,235,255', alpha: .5, size: 2.6, speed: 12, seed: 4 });
}
/* Mango's hand over Clementine's mouth, drawn after both of them so it lies on top of Clementine's face: an arm from Mango's shoulder, an open glove */
function shushHand(lt, m, c, k) {
  if (k <= 0) return;
  const ms = m.s || 1, mc = bodyCenter(m), sh = shoulder(KINDS.mango, 1), sx = mc[0] + sh[0] * ms, sy = mc[1] + sh[1] * ms;
  const cc = bodyCenter(c), cs = c.s || 1, tx = cc[0], ty = cc[1] + (KINDS.clem.mouthY + 4) * cs;
  /* the palm lands on the mouth: a big mitten (x1.5), its centre on the mouth, the wrist a palm's length back along the forearm (two passes: the forearm's direction depends on the wrist) */
  const HS = 1.5, back = 11 * HS * ms, px = lerp(sx + (tx - sx) * .3, tx, k), py = lerp(sy + (ty - sy) * .3, ty, k), L1 = 56 * 1.12 * ms, L2 = 52 * 1.12 * ms;
  let wx = px, wy = py, sol = V2C.ik2(sx, sy, wx, wy, L1, L2, 1, 'shush');
  for (let i = 0; i < 2; i++) { const dx = sol.hx - sol.ex, dy = sol.hy - sol.ey, d = Math.hypot(dx, dy) || 1; wx = px - dx / d * back; wy = py - dy / d * back; sol = V2C.ik2(sx, sy, wx, wy, L1, L2, 1, 'shush'); }
  ctx.save();
  V2C.limb([[sx, sy], [sol.ex, sol.ey], [sol.hx, sol.hy]], [17 * ms, 14.5 * ms, 12.5 * ms], LIMB);
  ctx.fillStyle = '#3a3342'; ctx.beginPath(); ctx.arc(sx, sy, 9.5 * ms, 0, TAU); ctx.fill();
  ctx.translate(sol.hx, sol.hy); ctx.rotate(Math.atan2(sol.hy - sol.ey, sol.hx - sol.ex)); ctx.scale(ms, ms);
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  ctx.scale(HS, HS); V2C.hand('open', 1, {});
  ctx.restore();
}

// ------------------------------------------------------------------ the scene object (v0: the plan alone, for looking at the drawing)
function planShot(lt) {
  ctx.drawImage(paper(), 0, 0);
  drawPlan(lt, FLAT);
  drawFrame(sstep(lt, 1.8, 2.4));
  drawDressing(sstep(lt, 2.2, 2.9));
  saved(() => { ctx.globalAlpha *= .22; ctx.fillStyle = scanPattern(); ctx.globalCompositeOperation = 'screen'; ctx.fillRect(0, 0, W, H); });
}
// ------------------------------------------------------------------ the shots
/* every cut of the scene, scene-local seconds. 'plan' is the flat blueprint; the others are the war room. Cuts land a hair before the line they serve. */
const SHOTS = [
  [0.00, 1.20, 'wide0'], [1.20, 2.05, 'dive'], [2.05, 8.30, 'plan'], [8.30, 9.50, 'mango1'], [9.50, 11.42, 'plan'], [11.42, 12.04, 'clem1'], [12.04, 14.30, 'plan'], [14.30, 15.74, 'clem2'],
  [15.74, 18.58, 'straw1'], [18.58, 23.33, 'plan'], [23.33, 24.46, 'mango2'], [24.46, 26.60, 'plan'], [26.60, 27.55, 'mango3'], [27.55, 29.50, 'plan'], [29.50, 30.55, 'quiet'],
  [30.55, 31.74, 'lemon1'], [31.74, 32.40, 'clem3'], [32.40, 33.62, 'shh'], [33.62, 34.42, 'lemon2'], [34.42, 35.17, 'whip'], [35.17, 36.80, 'moon'], [36.80, 37.80, 'straw2'],
  [37.80, 38.70, 'lemon3'], [38.70, 39.70, 'plan'], [39.70, 40.30, 'undive'], [40.30, 41.70, 'end'],
];
function shotAt(lt) { for (const sh of SHOTS) if (lt < sh[1]) return { t0: sh[0], t1: sh[1], id: sh[2] }; const l = SHOTS[SHOTS.length - 1]; return { t0: l[0], t1: l[1], id: l[2] }; }
const isCut = lt => SHOTS.some(([a]) => a > 0 && Math.abs(lt - a) < .04);

/* close-ups: [who, on-screen scale of the character (zoom x her own perspective scale), px the face sits above the frame centre]: every face is framed the same size whether she stands near or far */
const SING = { mango1: ['mango', 1.9, 170], mango2: ['mango', 2.0, 190], mango3: ['mango', 2.0, 190], clem1: ['clem', 2.1, 200], clem2: ['clem', 2.0, 200], clem3: ['clem', 2.0, 200], straw1: ['straw', 2.0, 200], straw2: ['straw', 2.05, 200], lemon1: ['lemon', 1.85, 190], lemon2: ['lemon', 1.7, 160], lemon3: ['lemon', 1.95, 190] };
const WIDE = { x: 540, y: 730, z: 1.14 };
const holoCenter = () => holoScene(0, 0);
const dutch = lt => { const q = TX().B.q; return .08 * sstep(lt, q.s - .05, q.s + .3) * (1 - sstep(lt, TX().L.l11.s + .6, TX().L.l11.e)); };

function camFor(lt, sh) {
  const k = seg(lt, sh.t0, sh.t1);
  if (sh.id === 'plan') { zoomTo(540, 960, 1); const f = PT().final, a = lt - f, c = PT().policy, b = lt - c; CAM.shake = a >= 0 && a < .4 ? 16 * Math.exp(-a / .09) : b >= 0 && b < .3 ? 9 * Math.exp(-b / .08) : 0; return; }
  roomCam();
  if (sh.id === 'wide0') { zoomTo(WIDE.x, WIDE.y, lerp(1.08, 1.14, k)); return; }
  if (sh.id === 'dive' || sh.id === 'undive') {
    const e = easeIO(sh.id === 'dive' ? k : 1 - k), hc = holoCenter();
    zoomTo(lerp(WIDE.x, hc[0], e), lerp(WIDE.y, hc[1], e), lerp(1.14, 2.3, e)); return;
  }
  if (sh.id === 'end') { zoomTo(WIDE.x, WIDE.y, lerp(1.14, 1.18, k)); return; }
  if (sh.id === 'quiet') { const e = sstep(lt, 29.6, 30.38), a = faceOfName('clem'), sg = SIGNPT(); zoomTo(lerp(a[0] - 60, 330, e), lerp(a[1] - 90, 700, e), lerp(1.75, 1.95, e) + .05 * k); CAM.r = dutch(lt); return; }
  if (sh.id === 'shh') { const e = easeIO(seg(lt, SHH() + .5, SHH() + .82)), c = faceOfName('clem'), m = faceOfName('mango'), l = faceOfName('lemon'), st = faceOfName('straw'); zoomTo(lerp((c[0] + m[0]) / 2 - 10, (l[0] + st[0]) / 2 + 10, e), lerp((c[1] + m[1]) / 2 + 10, (l[1] + st[1]) / 2 + 10, e), lerp(1.9, 1.95, e) + .06 * k); return; }
  if (sh.id === 'whip' || sh.id === 'moon') {
    const f0 = faceOfName('lemon'), w = WINPT(), e = easeIO(seg(lt, 34.42, 34.80));
    zoomTo(lerp(f0[0], w[0], e), lerp(f0[1] - 20, w[1] + 10, e), lerp(2.0, 4.2, e) + .22 * seg(lt, 34.8, 36.8)); return;
  }
  const [who, sc0, up] = SING[sh.id], o = castO(who), z0 = sc0 / o.s, z = lerp(z0, z0 * 1.07, k);
  faceZoom(o, z, up);
}
function fxFor(lt, sh) {
  const plan = sh.id === 'plan', e = TX().B.end, rk = redK(lt);
  const f = { bloom: plan ? .62 : .72, vignette: plan ? .4 : .6, contrast: .13, sat: .1, grain: .05 };
  f.tint = plan ? null : [['#1a7a9a', .2, 'soft-light']];
  if (rk > 0) f.tint = (f.tint || []).concat([['#ff2a3a', .22 * rk, 'soft-light']]);
  // a cut into the plan: a short colour split and a cyan flash; the first frames of the scene come up from black
  const into = plan ? seg(lt, sh.t0, sh.t0 + .12) : 1;
  const ab = Math.max(plan ? 5 * (1 - into) : 0, 4.5 * blipK(lt));
  f.aberr = ab >= .7 ? ab : 0;   /* the colour-split pass is expensive: only when it can be seen */
  f.fade = Math.max(1 - sstep(lt, 0, .32), sstep(lt, e.s + .5, e.e + .5));
  f.fadeColor = '0,0,0';
  // the Moon is called: a flash of cool light
  return f;
}

function drawPlanShot(lt, a = 1) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(paper(), 0, 0); ctx.restore();
  M = FLAT; BOB = Math.sin(lt * 1.3) * 3;
}
function planFrame(lt, a) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  M = FLAT; drawFrame(a * sstep(lt, 1.8, 2.4)); drawDressing(a * sstep(lt, 2.2, 2.9));
  ctx.globalAlpha *= .2 * a; ctx.fillStyle = scanPattern(); ctx.globalCompositeOperation = 'screen'; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* a wall call-light dome (the red lamp over a resident's door), lit by k 0..1: a dark housing, a half-dome lens, a hot core, short rays; drawn in screen space */
function callLight(x, y, k) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#262b39'; ctx.strokeStyle = '#0b0e18'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 62, y, 124, 24, 9); ctx.fill(); ctx.stroke();
  const g = ctx.createRadialGradient(x, y - 20, 4, x, y - 14, 56);
  g.addColorStop(0, `rgb(255,${150 + 90 * k | 0},${150 + 80 * k | 0})`); g.addColorStop(.45, `rgb(${185 + 70 * k | 0},${24 + 40 * k | 0},${36 + 34 * k | 0})`); g.addColorStop(1, 'rgb(70,8,20)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 52, 50, 0, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,120,130,${.8 * k})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const a = PI + (i + .5) / 7 * PI, r0 = 66, r1 = 66 + 22 * k; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .96); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * .96); ctx.stroke(); }
  ctx.restore();
}
const SCENE = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) { camFor(lt, shotAt(lt)); },
  draw(lt) {
    const sh = shotAt(lt), id = sh.id;
    if (id === 'plan') {
      drawPlanShot(lt); drawHolo(lt, 1, 1, 1); planFrame(lt, 1);
      V2.dust(60, 280, 1020, 1360, lt, { n: 48, color: '150,235,255', alpha: .5, size: 2.4, speed: 16, seed: 9 }); V2.dust(60, 280, 1020, 1360, lt, { n: 14, color: '255,255,255', alpha: .35, size: 3.6, speed: 9, seed: 31 });
      { const a = lt - PT().final; if (a >= 0 && a < .5) { const c = FLAT.f(0, -124); ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(c[0], c[1], a / .5, { r0: 80, r1: 620, color: '255,90,104', lw: 12, alpha: .9 }); ctx.restore(); V2.sparks(c[0] - 290, c[1] + 120, lt, PT().final, { n: 14, color: '255,110,120', speed: 420, life: .5, g: 900, size: 5, seed: 21 }); V2.sparks(c[0] + 290, c[1] + 120, lt, PT().final, { n: 14, color: '255,200,200', speed: 420, life: .5, g: 900, size: 5, seed: 22 });
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,200,210,${.28 * Math.max(0, 1 - a / .09)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
    } else if (id === 'dive' || id === 'undive') {
      const k = seg(lt, sh.t0, sh.t1), e = id === 'dive' ? k : 1 - k, ee = easeIO(e);
      if (ee < .93) { const fade = 1 - sstep(ee, .25, .6), objs = {}; for (const n of ['lemon', 'straw', 'mango', 'clem']) objs[n] = fade > 0 ? Object.assign(n === 'lemon' ? actLemon(lt) : n === 'straw' ? actStraw(lt) : n === 'mango' ? actMango(lt) : actClem(lt), { alpha: fade }) : false;
        roomDraw(lt, { noHolo: true, dof: ee > .3 ? 0 : 3, transit: true, objs, signA: 1 - sstep(ee, .16, .28), power: id === 'dive' ? powerAt(lt) : undefined }); }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(2,8,16,${.95 * sstep(ee, .12, .85)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      drawPlanShot(lt, sstep(ee, .5, 1)); drawHolo(lt, e, 1, 1); planFrame(lt, clamp01((ee - .9) / .1));
    } else if (id === 'end') {
      const e = TX().B.end, col = 1 - easeIn(seg(lt, e.s + .05, e.s + .42));
      roomDraw(lt, { collapse: col, dof: 3 });
      if (col < .12 && lt > e.s + .3) { const c = toScreen(holoScene(0, 0)); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); V2.glow(c[0], c[1], 160 * (1 - seg(lt, e.s + .3, e.s + .6)), '220,250,255', 1, 'screen', 1); ctx.restore(); }
    } else {
      const sing = SING[id], objs = {}, t = TX().L;
      let o = { dof: sing ? 9 : 3, dof2: sing ? 5 : 0 };
      ROOMLIGHTS = [];
      if (sing) for (const n of ['lemon', 'straw', 'mango', 'clem']) if (n !== sing[0]) objs[n] = false;
      o.objs = objs;
      if (id === 'quiet' || id === 'lemon1') { const rk = redK(lt); o.flash = rk * (.5 + .5 * Math.sin(lt * 9)); o.flick = rk > .5 ? (hash(Math.floor(lt * 18)) > .3 ? 1 : .35) : 1; }
      if (id === 'quiet') { o.transit = lt > 29.58 && lt < 30.42; o.power = powerAt(lt); o.signSharp = true; }
      if (id === 'clem1') { o.after = () => { const f = faceC(castO('clem')); V2.sparks(f[0] + 30, f[1] - 190, lt, t.c1.s, { n: 18, color: '255,214,120', speed: 300, life: .6, g: 500, size: 5, seed: 8 }); V2.sparks(f[0] - 40, f[1] - 170, lt, t.c1.s + .06, { n: 10, color: '255,255,230', speed: 220, life: .5, g: 300, size: 4, seed: 12 }); }; }
      if (id === 'clem2') {
        const f = faceC(castO('clem')), blink = Math.max(0, Math.sin(lt * 15.7)) * (.5 + .5 * sstep(lt, t.c2.s, t.c2.s + .3));
        ROOMLIGHTS = [{ x: f[0] - 300, y: f[1] - 60, r: 1000, color: REDR, a: .95 * blink }];
        o.mid = () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); V2.glow(100, 330, 720, REDR, .5 * blink, 'screen', .9); V2.dof(4, () => callLight(100, 352, blink)); ctx.restore(); };
      }
      if (id === 'straw1') {
        o.noHolo = true; o.noTable = true;
        const f = faceC(castO('straw')), sp = sstep(lt, t.l6.s + .85, t.l6.s + 1.12);
        ROOMLIGHTS = [{ x: f[0] - 40, y: f[1] - 160, r: 520, color: '255,244,220', a: .55 * sp }];
        o.mid = () => {
          const c = toScreen(f), r = lerp(1400, 430, sp), da = lerp(.4, .9, sp);
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply';
          const g = ctx.createRadialGradient(c[0], c[1] + 40, r * .3, c[0], c[1] + 40, r); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, `rgb(${255 * (1 - da) | 0},${255 * (1 - da) | 0},${255 * (1 - da * .9) | 0})`);
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
          if (sp > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); V2.beam(-80, c[1] + 460, c[0] - 70, c[1] + 10, 30, 230, '255,244,214', .3 * sp); ctx.restore(); }
        };
      }
      if (id === 'whip' || id === 'moon' || id === 'lemon2') { o.moonK = seg(lt, 33.75, 34.95); const roll = seg(lt, 36.15, 36.62), a = roll * TAU - PI / 2; o.moonOpt = { char: { who: 'moon', expr: lt < t.mo1.s ? 'neutral' : 'smug', look: lt < t.mo1.s ? [-.5, .5] : roll > 0 && roll < 1 ? [Math.cos(a) * .85, Math.sin(a) * .85] : [-.1, -.1] } }; }
      if (id === 'moon') { o.noHolo = true; o.noTable = true; o.objs = { lemon: false, straw: false, mango: false, clem: false }; }
      if (id === 'whip') { o.transit = true; o.dof = 0; o.dof2 = 0; o.moonOpt.char.transit = true; o.fast = lt > 34.48 && lt < 34.74; }
      if (id === 'shh') { o.who = 'all'; o.mangoFront = true; o.transit = lt > SHH() + .45 && lt < SHH() + .9; o.fast = lt > SHH() + .54 && lt < SHH() + .78; const m = actMango(lt, SHH_POS(lt)), c = actClem(lt); c.keepWho = true; c.who = 'clem'; o.objs = { mango: m, clem: c }; o.after = () => shushHand(lt, m, c, sstep(lt, SHH() + .05, SHH() + .2) * (1 - sstep(lt, SHH() + 1.15, SHH() + 1.28))); }
      roomDraw(lt, o);
    }
  },
  fx(lt) { return fxFor(lt, shotAt(lt)); },
  /* shutter samples: more on every fast move (the dive, the whip, the pan to the sign, the rack of faces, Mango's leap), one on every cut so no frame holds a double exposure */
  blur(lt) {
    const sh = shotAt(lt); if (isCut(lt)) return 1;
    if (sh.id === 'dive' || sh.id === 'undive') return 3;
    if (sh.id === 'whip') return 4;
    if (sh.id === 'quiet') { const k = seg(lt, 29.6, 30.38), d = 6 * k * (1 - k); return d > 1 ? 3 : d > .5 ? 2 : 1; }
    if (sh.id === 'shh') { const t = SHH(), k = seg(lt, t + .5, t + .82), d = k <= 0 || k >= 1 ? 0 : 4 * Math.min(k, 1 - k); return d > 1.4 ? 5 : d > .8 ? 4 : d > .3 ? 2 : lt < t + .16 ? 3 : 1; }
    return 1;
  },
  over() {},
};
/* Mango lunges across the table to Clementine for the shush (Z 1500 -> 1190), then steps back */
function SHH_POS(lt) { const t = SHH(), go = sstep(lt, t - .14, t + .1), back = sstep(lt, t + 1.25, t + 1.7), k = go * (1 - back), p = V2.at(lerp(430, 214, easeIO(k)), lerp(1620, 920, easeIO(k))); p.lift = 70 * Math.sin(PI * clamp01(k)) * (go < 1 || back > 0 ? 1 : 0); return p; }
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.plan = SCENE;
})();
