'use strict';
/* SHIFT HAPPENS, Episode 13: scene `plan` (7:09 PM, THE BRIEFING), Charge Nurse Lemon briefs the crew over a hologram blueprint of the facility.
 * WORK IN PROGRESS (v0: blueprint only).
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
const FLAT = { f: (u, v) => [PL.cx + u, PL.cy + v], s: 1, k: 1 };
let M = FLAT;   /* the map in force while a frame is drawn */
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
const wordT = (id, word) => { const l = TX().L[id]; if (!word) return l.s; const w = l.w.find(q => q.t.toLowerCase().replace(/[^a-z0-9]/g, '').includes(word)); return w ? w.s : l.s; };

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
    const yD = PL.cy + BV0 - 20, lab = "113'-6\"", lw = UI.sizeOf(lab, { size: 20, weight: 800, spacing: 1 }).w;
    ctx.strokeStyle = 'rgba(77,227,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(PL.cx - BU, yD); ctx.lineTo(PL.cx - lw / 2 - 12, yD); ctx.moveTo(PL.cx + lw / 2 + 12, yD); ctx.lineTo(PL.cx + BU, yD);
    for (const x of [PL.cx - BU, PL.cx + BU]) { ctx.moveTo(x - 7, yD + 7); ctx.lineTo(x + 7, yD - 7); ctx.moveTo(x, yD - 12); ctx.lineTo(x, yD + 12); }
    ctx.stroke();
    UI.label(lab, PL.cx, yD, { size: 20, weight: 800, spacing: 1, fill: HI, hero: false });
    // compass and scale bar in the parking aisle
    const vA = PL.cy + (PV0 + STALL + PV1 - STALL) / 2;
    ctx.strokeStyle = CY; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(PL.cx - 400, vA, 20, 0, TAU); ctx.stroke();
    ctx.fillStyle = HI; ctx.beginPath(); ctx.moveTo(PL.cx - 400, vA - 15); ctx.lineTo(PL.cx - 394, vA + 8); ctx.lineTo(PL.cx - 400, vA + 3); ctx.lineTo(PL.cx - 406, vA + 8); ctx.closePath(); ctx.fill();
    UI.label('N', PL.cx - 360, vA, { size: 22, weight: 900, fill: HI, hero: false });
    const sx0 = PL.cx + 250, seg4 = 40;
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? 'rgba(77,227,255,.2)' : CY; ctx.fillRect(sx0 + i * seg4, vA - 5, seg4, 10); }
    ctx.strokeStyle = CY; ctx.lineWidth = 1.5; ctx.strokeRect(sx0, vA - 5, seg4 * 4, 10);
    UI.label('0', sx0, vA + 26, { size: 17, weight: 800, fill: HI, hero: false });
    UI.label('10', sx0 + seg4 * 2, vA + 26, { size: 17, weight: 800, fill: HI, hero: false });
    UI.label('20 FT', sx0 + seg4 * 4, vA + 26, { size: 17, weight: 800, fill: HI, hero: false });
    UI.label('ENTRANCE', PL.cx, PL.cy + PV0 + STALL + 26, { size: 19, weight: 900, spacing: 3, fill: HI, hero: false });
  });
}

// ------------------------------------------------------------------ plates: dark glass with an accent edge, drawn through the UI kit
const PLATE = { w: 400, h: 120 };   /* the three OBSTACLE plates share one size */
const SLOT = { top: [0, -296], mid: [0, -124] };   /* where plates sit in the courtyard */
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
    trace0: 1.25, trace1: 2.1, ping0: 1.7, ping1: 2.75, lot0: 2.15, lot1: 2.75,
    pips: L.l2.s + .15,                                   /* the `pips` cue: 32 rooms in 0.9 s */
    nurse1: wordT('l2', 'two'), nurse2: wordT('l2', 'nurses'), grey: wordT('l2', 'called'), stamp: wordT('l2', 'out'), tilesOut: L.l3.s,
    route0: L.l3.s + .1, vault: wordT('l3', 'vault'), vaultLabel: L.l3.s + .35,
    policy: L.l4.s + .2, policyOut: L.c1.s + .5,
    ob1: L.l5.s + .2, ob1Out: L.c2.s - .15, laser: L.l5.s + .9,
    staff0: 18.72, staff1: 19.85, straw0: 19.35, straw1: 20.65, card: L.l7.s + .6, cardRow2: wordT('l7', 'system'), cardOut: L.l8.s - .1,
    ob2: L.l8.s + .2, ob2Out: L.m2.s - .15, loop0: L.l8.s + .2, loop1: L.l8.s + .9, lap1a: 21.45, lap1b: 24.45, lap2a: 24.6, lap2b: 26.45,
    timer: L.l9.s - .03, forty: wordT('m3', 'forty'), ob3: L.l10.s, ob3Out: 29.6,
  };
}

function drawPlan(lt, map, o = {}) {
  M = map;
  const T = PT(), flat = map.k >= .999, text = flat && !o.noText;
  const lot = sstep(lt, T.lot0, T.lot1), ping = sstep(lt, T.ping0, T.ping1), tr = sstep(lt, T.trace0, T.trace1);
  const ent = mp(0, BV1), rad = 1000 * ping * M.s;
  // --- the building and the parking lot, revealed by a ring that spreads from the entrance
  saved(() => {
    if (ping < .999) { ctx.beginPath(); ctx.arc(ent[0], ent[1], Math.max(.1, rad), 0, TAU); ctx.clip(); }
    drawParking(lot);
    drawBuilding({});
  });
  if (ping > 0 && ping < .999) saved(() => { ctx.strokeStyle = `rgba(200,250,255,${.85 * (1 - ping)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ent[0], ent[1], rad, 0, TAU); ctx.stroke(); });
  // --- the outer wall draws itself
  if (tr > 0) saved(() => {
    const d = OUTER_LEN * tr, sl = pathSlice(PG.outer, 0, d), sl2 = pathSlice(PG.inner, 0, pathLen(PG.inner) * tr);
    if (sl.length > 1) { trace(sl, false); ink(CY, 5, 1); neon(5, 1); }
    if (sl2.length > 1) { trace(sl2, false); ink(CY, 1.6, .7); ctx.stroke(); }
    if (tr < .999) { const h = pathAt(PG.outer, d), [hx, hy] = mp(h[0], h[1]); V2.glow(hx, hy, 70 * M.s, '200,250,255', .8, 'screen', .8); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 5 * M.s, 0, TAU); ctx.fill(); }
  });
  // --- the courtyard: a radar target under everything that happens in the middle
  saved(() => {
    const cu = 0, cv = (CNL + CSL) / 2, a = ping;
    ctx.globalAlpha *= a; ink(CY, 1.2, .16);
    for (const r of [56, 112, 168, 224]) { circleP(cu, cv, r, 48); ctx.stroke(); }
    lineSet([[CWL + 8, cv, CEL - 8, cv], [cu, CNL + 8, cu, CSL - 8]]); ink(CY, 1.2, .1, [10, 8]); ctx.stroke();
  });
  if (!flat) return;

  // ---------------------------------------------------------------- everything below happens on the flat plan
  const rooms = PG.rooms;
  // --- 32 rooms light one by one: a fill, a ring and the number
  const age = n => lt - (T.pips + (n - 1) * .028);
  saved(() => {
    for (const r of rooms) {
      const g = age(r.n); if (g < 0) continue;
      const flash = Math.exp(-g / .22);
      rectP(r.x0 + 2, r.y0 + 2, r.x1 - 2, r.y1 - 2); ctx.fillStyle = `rgba(${CYR},${.075 + .22 * flash})`; ctx.fill();
      if (g < .3) { const [x, y] = mp(r.cx, r.cy); ctx.strokeStyle = `rgba(200,250,255,${.8 * (1 - g / .3)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 8 + 34 * easeOut(g / .3), 0, TAU); ctx.stroke(); }
    }
  });
  // --- the call-light hall: lasers
  const trig = [];
  const hall = PG.hall, nSeg = hall.length - 1;
  for (let j = 0; j < nSeg; j++) {
    const vc = (hall[j][1] + hall[j + 1][1]) / 2, dc = 498 + (MID_S - vc);   /* route distance at which a marker on the hall's centre line crosses this beam */
    const tStaff = T.staff0 + (T.staff1 - T.staff0) * seg(dc / ROUTE_LEN, 0, 1);
    trig.push(lt >= tStaff ? Math.exp(-(lt - tStaff) / .3) : 0);
  }
  const laser = sstep(lt, T.laser, T.laser + .3);
  if (laser > 0) {
    saved(() => {
      for (let j = 0; j < nSeg; j++) {
        const fr = clamp01(laser * 1.5 - j * .05), hot = trig[j]; if (fr <= 0) continue;
        const a = hall[j], b = hall[j + 1], c = [lerp(a[0], b[0], fr), lerp(a[1], b[1], fr)];
        const fl = .82 + .18 * Math.sin(lt * 41 + j * 2.1);
        ctx.globalAlpha = 1; lineSet([[a[0], a[1], c[0], c[1]]]);
        ink(`rgb(255,${Math.round(59 + 160 * hot)},${Math.round(78 + 140 * hot)})`, 2.6 + 1.6 * hot, fl); neon(2.6 + 1.6 * hot, fl, 3.6 + 2 * hot);
        if (hot > .05) { const m = mp((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); V2.glow(m[0], m[1], 80, '255,90,90', .5 * hot, 'screen', .6); }
      }
      for (let i = 0; i < rooms.length; i++) { /* the domes on the east wall glow red, brighter when a beam fires */ }
      PG.rooms.filter(r => r.side === 'E').forEach((r, i) => { const hot = Math.max(trig[2 * i] || 0, trig[2 * i - 1] || 0), [x, y] = mp(r.dome[0], r.dome[1]); V2.glow(x, y, 34 + 40 * hot, REDR, laser * (.45 + .5 * hot), 'screen', .5); ctx.fillStyle = `rgba(255,${100 + 120 * hot},${110 + 110 * hot},${laser})`; ctx.beginPath(); ctx.arc(x, y, 5.6 + 2 * hot, 0, TAU); ctx.fill(); });
    });
  }
  // --- the route to the vault: gold dots marching from the entrance, ending exactly on the vault's door
  const rk = sstep(lt, T.route0, T.vault);
  if (rk > 0) saved(() => {
    const sl = pathSlice(PG.route, 0, ROUTE_LEN * rk);
    if (sl.length > 1) { trace(sl, false); ink(GOLD, 4, .95, [.1, 13]); ctx.lineDashOffset = -(lt * 26) * M.s; ctx.stroke(); }
  });
  // --- the vault: gold, a padlock, a flare when the voice says "vault"
  const vk = sstep(lt, T.vault - .3, T.vault + .12);
  if (vk > 0) saved(() => {
    const V = PG.vault, pulse = .5 + .5 * Math.sin(lt * 4.2);
    rectP(V.x0 + 2, V.y0 + 2, V.x1 - 2, V.y1 - 2); ctx.fillStyle = `rgba(${GOLDR},${vk * (.26 + .12 * pulse)})`; ctx.fill();
    rectP(V.x0, V.y0, V.x1, V.y1); ink(GOLD, 3.6, vk); neon(3.6, vk, 3);
    const [x, y] = mp(V.cx, V.cy); V2.glow(x, y, 120 + 40 * Math.exp(-(lt - T.vault) / .4) * (lt > T.vault ? 1 : 0), GOLDR, vk * (.45 + .2 * pulse), 'screen', .8);
    padlock(V.cx, V.cy + 2, lt < T.vault + .12 ? 1.6 - .6 * easeOut(seg(lt, T.vault - .1, T.vault + .12)) : 1, vk);
  });
  // --- the Administrator's patrol loop and the Administrator
  const lk = sstep(lt, T.loop0, T.loop1);
  if (lk > 0) saved(() => {
    const sl = pathSlice(PG.loop, 0, LOOP_LEN * lk); if (sl.length > 1) { trace(sl, false); ink('#ffe9a6', 3.6, .95, [18, 12]); ctx.lineDashOffset = -(lt * 60) * M.s; ctx.stroke(); }
  });
  const dM = lt < T.lap1a ? -1 : lt < T.lap1b ? LOOP_LEN * seg(lt, T.lap1a, T.lap1b) : lt < T.lap2a ? 0 : LOOP_LEN * easeIO(seg(lt, T.lap2a, T.lap2b));
  if (lt >= T.lap1a - .25) {
    const dd = dM < 0 ? 0 : dM, p = pathAt(PG.loop, dd % LOOP_LEN), sp = lt >= T.lap2a && lt < T.lap2b ? 1 : 0;
    if (sp) for (let i = 4; i >= 1; i--) { const q = pathAt(PG.loop, ((dd - i * 40) % LOOP_LEN + LOOP_LEN) % LOOP_LEN); melonMarker(q[0], q[1], .12 * (5 - i)); }
    melonMarker(p[0], p[1], sstep(lt, T.lap1a - .25, T.lap1a));
  }
  // --- markers: a staff marker lights every beam, Strawberry walks through untouched
  const dS = ROUTE_LEN * seg(lt, T.staff0, T.staff1), dP = ROUTE_LEN * easeIO(seg(lt, T.straw0, T.straw1));
  if (lt >= T.staff0 - .15 && lt < T.staff1 + .9) { const p = pathAt(PG.route, dS), hot = Math.max(0, ...trig.slice(-0)); staffMarker(p[0], p[1], Math.max(0, ...trig.map((v, j) => v))); }
  if (lt >= T.straw0 - .15 && lt < T.straw1 + 1.2) { const p = pathAt(PG.route, dP); strawMarker(p[0], p[1]); }

  // --- labels and plates (text): everything below goes through the UI kit
  const label = (str, u, v, o2) => { const [x, y] = mp(u, v); return UI.label(str, x, y, o2); };
  for (const r of rooms) { const g = age(r.n); if (g < 0) continue; label(String(r.n), r.cx + r.nrm[0] * 9, r.cy + r.nrm[1] * 9, { size: 30, fill: '#d8faff', weight: 900, alpha: clamp01(g / .1) }); }
  // the counter in the courtyard: ROOMS 00 -> 32
  const cnt = Math.min(32, Math.floor(clamp01((lt - T.pips) / (.028 * 31 + .05)) * 32 + 1e-6)), ca = seg(lt, T.pips - .05, T.pips + .1) * (1 - sstep(lt, T.tilesOut, T.tilesOut + .25));
  if (ca > 0) { saved(() => { ctx.globalAlpha *= ca; label('ROOMS', 0, -322, { size: 30, weight: 900, spacing: 12, fill: '#7fe6ff' }); label(String(cnt).padStart(2, '0'), 0, -246, { size: 132, font: 'Bangers', weight: 400, spacing: 4, fill: '#ffffff' }); V2.glow(...mp(0, -246), 150, CYR, .25 * ca, 'screen', .4); }); }
  // two nurses; one is called out
  const n1 = easeBack(seg(lt, T.nurse1, T.nurse1 + .35)), n2 = easeBack(seg(lt, T.nurse2, T.nurse2 + .35)), gk = sstep(lt, T.grey, T.grey + .3), na = 1 - sstep(lt, T.tilesOut, T.tilesOut + .25);
  for (const [i, k, u] of [[0, n1, -112], [1, n2, 112]]) if (k > 0 && na > 0) saved(() => {
    const [x, y] = mp(u, -90 - 46 * (1 - k)), grey = i === 1 ? gk : 0;
    ctx.globalAlpha *= clamp01(k * 2) * na;
    ctx.fillStyle = GLASS; ctx.strokeStyle = grey > .5 ? '#6f7d86' : CY; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 88, y - 78, 176, 156, 14); ctx.fill(); ctx.stroke();
    ctx.translate(x - 0, y + 4); ctx.scale(1, 1); ctx.translate(-x, -y); nurseIcon(u, -90 - 46 * (1 - k) + 4, grey > .5);
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
      UI.sign([x - 300, y - 150, 600, 300], [{ t: 'POLICY 14.3', size: 104, font: 'Bangers', weight: 400, spacing: 4, fill: GOLD }, { t: 'STAFF MAY NOT USE THIS ROOM', size: 36, spacing: 1, fill: '#fff', gap: 10 }, { t: 'DURING THE SHIFT', size: 36, spacing: 1, fill: '#fff', gap: 2 }],
        { fill: GLASS, stroke: GOLD, lw: 5, r: 18, pad: 22, id: 'plate-policy' });
    }); }
  // OBSTACLE 1 / CALL LIGHTS (leader to the east hall)
  drawPlate(lt, { t0: T.ob1, t1: T.ob1Out, u: SLOT.top[0], v: SLOT.top[1], lines: [{ t: 'OBSTACLE 1', size: 30, spacing: 6, fill: '#ff7684' }, { t: 'CALL LIGHTS', size: 64, font: 'Bangers', weight: 400, spacing: 3, fill: '#fff', gap: 4 }], leader: { from: [PLATE.w / 2, SLOT.top[1]], to: [MID_E, SLOT.top[1]] }, id: 'plate-ob1' });
  // BADGE SCAN card
  { const a = plateIn(lt, T.card, T.cardOut);
    if (a > 0) saved(() => {
      const [x, y] = mp(0, -124), sc = 1 + .12 * (1 - easeOut(seg(lt, T.card, T.card + .24))), r2 = seg(lt, T.cardRow2, T.cardRow2 + .1), bad = lt >= T.cardRow2 ? .55 + .45 * Math.sin(lt * 22) : 0;
      ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
      UI.table([x - 250, y - 108, 500, 216], [{ w: .4, align: 'left' }, { align: 'left' }],
        [['BADGE', 'PER DIEM'], ['SYSTEM', { t: r2 > 0 ? 'NO MATCH' : '...', fill: r2 > 0 ? `rgb(255,${Math.round(90 + 60 * (1 - bad))},${Math.round(100 + 60 * (1 - bad))})` : '#7fc9dc' }]],
        { header: ['BADGE SCAN', ''], fill: GLASS, stroke: CY, lw: 3, r: 14, headFill: 'rgba(77,227,255,.28)', size: 38, grid: 'rgba(77,227,255,.35)', id: 'card-badge', text: { fill: '#fff', weight: 900 }, headText: { fill: HI, size: 30, spacing: 5 } });
    }); }
  // OBSTACLE 2 / THE ADMINISTRATOR (leader to the patrol loop)
  drawPlate(lt, { t0: T.ob2, t1: T.ob2Out, u: SLOT.top[0], v: SLOT.top[1], lines: [{ t: 'OBSTACLE 2', size: 30, spacing: 6, fill: '#ff7684' }, { t: 'THE ADMINISTRATOR', size: 52, font: 'Bangers', weight: 400, spacing: 3, fill: '#fff', gap: 4 }], leader: { from: [0, SLOT.top[1] - PLATE.h / 2], to: [0, MID_N] }, id: 'plate-ob2' });
  // OBSTACLE 3 / ???
  drawPlate(lt, { t0: T.ob3, t1: T.ob3Out, u: SLOT.top[0], v: SLOT.top[1], lines: [{ t: 'OBSTACLE 3', size: 30, spacing: 6, fill: '#ff7684' }, { t: '???', size: 64, font: 'Bangers', weight: 400, spacing: 8, fill: '#fff', gap: 4 }], id: 'plate-ob3' });

  // --- the pointer (Lemon's pen-light)
  const pt = pointerAt(lt);
  if (pt) { const [x, y] = mp(pt[0], pt[1]), a = seg(lt, POINTER[0][0], POINTER[0][0] + .2) * (1 - seg(lt, POINTER[POINTER.length - 1][0], POINTER[POINTER.length - 1][0] + .5));
    saved(() => { V2.glow(x, y, 46, '255,236,170', .6 * a, 'screen', .6); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill(); ctx.strokeStyle = `rgba(255,224,120,${.9 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 11 + 2 * Math.sin(lt * 9), 0, TAU); ctx.stroke(); }); }
}

// ------------------------------------------------------------------ the scene object (v0: the plan alone, for looking at the drawing)
function planShot(lt) {
  ctx.drawImage(paper(), 0, 0);
  drawPlan(lt, FLAT);
  drawFrame(sstep(lt, 1.8, 2.4));
  drawDressing(sstep(lt, 2.2, 2.9));
  saved(() => { ctx.globalAlpha *= .22; ctx.fillStyle = scanPattern(); ctx.globalCompositeOperation = 'screen'; ctx.fillRect(0, 0, W, H); });
}
const SCENE = {
  shot() { return 'plan'; },
  cam() { zoomTo(540, 960, 1); },
  draw(lt) { planShot(lt); },
  fx: () => ({ bloom: .6, vignette: .4 }),
  blur: () => 1,
  over() {},
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.plan = SCENE;
})();
