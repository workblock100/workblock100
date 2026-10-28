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
    rectP(-BU - 8, PV0, BU + 8, PV1); ctx.fillStyle = `rgba(${CYR},.04)`; ctx.fill();
    ink(CY, 2, .55, [14, 10]); ctx.stroke();
    const stalls = [];
    for (let i = 0; i <= 14; i++) { const u = -BU - 8 + 8 + i * (BU * 2 / 14); if (Math.abs(u) < 36) continue; stalls.push([u, PV0, u, PV0 + STALL]); stalls.push([u, PV1 - STALL, u, PV1]); }
    lineSet(stalls); ink(CY, 1.6, .4); ctx.stroke();
    // cars, seen from above: outline, a fill and a windscreen line
    const cars = [[-1, -386, 0], [-1, -258, 1], [-1, -130, 0], [-1, 194, 1], [-1, 322, 0], [1, -322, 0], [1, -66, 1], [1, 66, 0], [1, 258, 1], [1, 386, 0]];
    for (const [row, u, tall] of cars) {
      const v0 = row < 0 ? PV0 + 6 : PV1 - 6 - 46, w = 34, h = 46 - (tall ? 0 : 4), ws = row < 0 ? v0 + h - 15 : v0 + 15;
      saved(() => { rectP(u - w / 2, v0, u + w / 2, v0 + h); ctx.fillStyle = `rgba(${CYR},.07)`; ctx.fill(); ink(CY, 1.8, .62); ctx.stroke(); lineSet([[u - w / 2 + 5, ws, u + w / 2 - 5, ws]]); ink(CY, 1.4, .5); ctx.stroke(); });
    }
    // the walk from the entrance
    lineSet([[-30, BV1 + 34, -30, PV0], [30, BV1 + 34, 30, PV0]]); ink(CY, 1.8, .6, [6, 6]); ctx.stroke();
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
  saved(() => {
    ctx.globalAlpha *= a; ctx.lineCap = 'butt';
    const x0 = 60, y0 = 280, x1 = 1020, y1 = 1360, L = 40;
    ctx.strokeStyle = CY; ctx.lineWidth = 3;
    for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke(); }
    // edge ticks every 24 px, long ones every 96 px, along the left and right sides
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(77,227,255,.55)'; ctx.beginPath();
    for (let y = y0 + 24; y < y1 - 20; y += 24) { const major = ((y - PL.cy) % 96 + 96) % 96 === 0, l = major ? 14 : 7; ctx.moveTo(x0, y); ctx.lineTo(x0 + l, y); ctx.moveTo(x1, y); ctx.lineTo(x1 - l, y); }
    ctx.stroke();
    // registration marks at the middle of the top and bottom edges
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(77,227,255,.8)'; ctx.beginPath();
    for (const y of [y0, y1]) { ctx.moveTo(540 - 14, y); ctx.lineTo(540 + 14, y); ctx.moveTo(540, y - 14); ctx.lineTo(540, y + 14); }
    ctx.stroke();
  });
}

// ------------------------------------------------------------------ the scene object (v0: the plan alone, everything lit, for looking at the drawing)
function planAll(lt) {
  ctx.drawImage(paper(), 0, 0);
  M = FLAT;
  drawParking(1);
  drawBuilding({});
  saved(() => { trace(PG.outer, false); ink(CY, 5, 1); neon(5, 1); trace(PG.inner, false); ink(CY, 1.6, .7); ctx.stroke(); });
  drawFrame(1);
  for (const r of PG.rooms) UI.label(String(r.n), PL.cx + r.cx, PL.cy + r.cy, { size: 30, fill: '#d8faff', weight: 900 });
}
const SCENE = {
  shot() { return 'plan'; },
  cam() { zoomTo(540, 960, 1); },
  draw(lt) { planAll(lt); },
  fx: () => ({ bloom: .6, vignette: .4 }),
  blur: () => 1,
  over() {},
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.plan = SCENE;
})();
