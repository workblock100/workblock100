'use strict';
/* SHIFT HAPPENS, Episode 21: "The Inspection". Builder E21-CLOSET. Scene `closet` (7:10 PM, THE POLICY CLOSET, 27.163 s). Registers window.__EP21_SCENES.closet. Everything is a pure function of the scene time `lt`.
 *
 * THE SET is one flat front elevation of the corridor by the nurses' station (world px, the floor line FY 1250, a character about 380 tall), left to right: the POLICY CLOSET (x -40..520, top 560: tall double
 * doors, five rows of binders), the NOT A CLOSET door (Brenda's, x 700..920), a wall sanitizer (1010), the crash cart (1080..1280), the med fridge with its temp log (1340..1520), the end of the station counter
 * with labeled things (1580..2060). Evening: warm ceiling pools, the window light gone.
 * THE AVALANCHE is a baked rigid-body sim (ep21_closet_sim.js, PHYS2D, 98 binders in three depth slabs, built once and sampled with world.at(lt)): the back slab is drawn behind Mr. Radish, the middle and front
 * slabs in front of him; only his face is a body, so the pile buries him to the chin and nothing ever rests on his face. The last binder lands flat on his head at 7.71. At 8.40 Onion pulls the 7.4 binder out
 * of the heap (the sim drags it to her hand; her hand follows it).
 * THE SCANNER (12.28-14.53 and 23.60-24.16) is his POV: the world desaturated to cyan, H21.hudFrame, H21.scan, H21.reticle on the station's objects (drawn in over() through the camera matrix saved by draw(),
 * so they ride the camera move), a thermal silhouette of Brenda behind her door, the red lock, then the DEFICIENCY stamp. Stand-ins are drawn until the kit's functions exist (checked at draw time).
 *
 * SHOTS (scene-local s; every start snapped to a frame; the boundary frame belongs to the NEW shot)
 *   open 0-1.30 wide: both closets, Radish and Onion | ra1 1.30-2.90 Radish "I would like to see your policy..." | o1 2.90-5.38 Onion: the gasp of joy at "policy on breaks", "Of course." (4.33), she turns to the doors |
 *   aval 5.38-8.03 ONE SHOT: she pulls the handle and zips out of frame, the doors burst (closetopen 5.48), a beat of stillness, the pour (binderavalanche 5.68), the heap, the last binder bonks his head (7.71) |
 *   o2a 8.03-9.45 Onion plucks the right binder without looking (8.40): "Policy seven point four." | o2b 9.45-10.82 the binder by her face, POLICY 7.4 BREAKS, REVISED TUESDAY | ra2 10.82-12.28 his head in the pile:
 *   "Impressive." (the scanner glasses light up at 11.9) | scan 12.28-14.53 HIS POV (scanbeep 12.48, 12.98, tags typing in 12.48 / 12.73 / 12.98 / 13.23, the door, the thermal figure, scanlock 13.68: UNKNOWN) |
 *   ra3 14.53-16.70 "Who is in the closet?" | br1 16.70-18.34 the door, "Nobody." (muffled: the door hums, a crumb) | ra4 18.34-20.74 "How long have you been on break?" | br2 20.74-23.10 the door opens a crack:
 *   Brenda's eye, her glasses, the 2019 sandwich: "Since twenty nineteen." | ra5 23.10-23.60 "Noted." | stamp 23.60-24.16 his POV: DEFICIENCY (penscratch 23.60) | o3 24.16-25.51 Onion wails "Not Brenda." (sniffle 24.96) |
 *   end 25.51-27.16 the tableau (sting 25.61).
 */
(() => {
if (!window.TIMELINE_EP21 || !window.H6 || !window.UI || !window.V2) return;
const { zoomTo, faceC } = window.H6;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const sr = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rg = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const shade = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${q(r)},${q(g)},${q(b)})`; };
const INKC = 'rgba(25,16,30,.82)';
const poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } };
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; if (window.FX18 && typeof FX18.glow === 'function') FX18.glow(ctx, { x, y, r, color, alpha: a, core: core ?? .5 }); else V2.glow(x, y, r, V2.rgb(color).join(','), Math.min(1, a), 'screen', .3); };

// ------------------------------------------------------------------ the frozen timeline: beats, words, cues, frame snapping (as ep20_forecast.js)
const TLX = window.TIMELINE_EP21;
const SCN = TLX.scenes.find(s => s.id === 'closet'), START = SCN.start, LN = {};
for (const l of TLX.lines) if (l.scene === 'closet') LN[l.id] = l;
const bS = b => SCN.beats[b].s, bE = b => SCN.beats[b].e;
const ls = id => LN[id].s - START, le = id => LN[id].e - START;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1], wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const CUE = { closetopen: 5.48, binderavalanche: 5.68, beep1: 12.476, beep2: 12.976, scanlock: 13.676, penscratch: 23.598, sniffle: 24.957, sting: 25.613 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);
/* the loudness of a recorded line at scene time lt (0..1, from its mouth track): the muffled voice hums in Brenda's door */
function voice(id, lt) {
  const l = LN[id]; if (!l) return 0;
  const f = (lt - (l.s - START)) * 30; if (f < 0 || f >= l.mouth.length) return 0;
  const i = Math.floor(f), j = Math.min(l.mouth.length - 1, i + 1), u = f - i, dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
  return lerp(dg(i), dg(j), u);
}

// ------------------------------------------------------------------ the avalanche sim (DOM-free module ep21_closet_sim.js), built once, lazily; sampled with world.at(lt) (numbers copied out: at() reuses its buffers)
let SIM = null, SIMERR = null;
function simInit() {
  if (SIM || SIMERR) return SIM;
  try {
    const M = window.__EP21_SIMS && window.__EP21_SIMS.closet;
    if (!M) { SIMERR = 'no sim'; return null; }
    SIM = M.build({});
    const ev = SIM.world.events, ids = SIM.meta.ids;
    SIM.bonks = ev.filter(e => e.kind === 'hit' && (e.a === ids.face || e.b === ids.face || e.a === ids.crown || e.b === ids.crown) && e.mag > .12).map(e => e.t);   /* every binder that hits his head: a squint */
  } catch (e) { SIMERR = String(e && e.stack || e); console.error('closet sim: ' + SIMERR); }
  return SIM;
}
function simState(lt) {
  const S = simInit(); if (!S) return null;
  return S.world.at(Math.max(0, Math.min(S.T, lt)));
}
const SL = (window.__EP21_SIMS && window.__EP21_SIMS.closet && window.__EP21_SIMS.closet.L) || null;
const ST = (window.__EP21_SIMS && window.__EP21_SIMS.closet && window.__EP21_SIMS.closet.T) || { doors: 5.48, pour: 5.68, last: 7.3, pluck: 8.4, lift: .52 };

// ------------------------------------------------------------------ the layout (world px)
const FY = 1250, CEIL = 470;
const CL = { x0: -40, x1: 520, ix0: -20, ix1: 500, top: 560, itop: 580, seam: 240, shelves: [1244, 1100, 968, 836, 704] };
const DOOR = { x0: 700, x1: 920, top: 800, cx: 810 };
const OBJ = { san: [1010, 880], cart: [1180, FY], fridge: [1430, FY], counter: [1580, 2060], pitcher: [1700, 0] };
const RAD = { x: 300, s: 1.12, cyBuried: 1060 };
const ONI = { x0: 90, s: .95 };
const BRN = { x: 846, y: 1250, s: .9 };
const PAL = ['#27407a', '#b5262e', '#1f6b45', '#26262c', '#2f6fd0', '#7a2340', '#7b818b', '#167a7c'];

// ------------------------------------------------------------------ text: hero only where it is safe (as ep20_forecast.js: big enough, clear of the frame edge, the caption zone and the clock pill)
let SOFT = 0, HEROMODE = false;
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
function scrBox(cx, cy, hw, hh) {
  const m = ctx.getTransform(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [u, v] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) { const X = m.a * (cx + u) + m.c * (cy + v) + m.e, Y = m.b * (cx + u) + m.d * (cy + v) + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return { x0: a, y0: b, x1: c, y1: d };
}
function heroOK(size, cx, cy, w, h = size) {
  if (SOFT || !HEROMODE || size * scrOf(ctx) < 31) return false;
  const b = scrBox(cx, cy, w / 2 + 10, h * .5 + 10);
  return b.x0 >= 50 && b.x1 <= W - 50 && b.y0 >= 50 && b.y1 <= 1372 && !(b.x0 < 506 && b.y0 < 250 && b.x1 > 40 && b.y1 > 108);
}
/* a label: hero when heroOK says so (or o.hero), else set dressing (crop allowed) */
function TXT(str, cx, cy, o = {}) {
  const size0 = o.size || 30, fit = o.maxW ? UI.fit(str, o.maxW, { size: size0, font: o.font, weight: o.weight, italic: o.italic, spacing: o.spacing, lw: o.lw }) : null, size = fit ? fit.size : size0;
  const wd = (fit ? fit.w : UI.sizeOf(str, o).w) || size * str.length * .6, mid = o.align === 'left' ? cx + wd / 2 : o.align === 'right' ? cx - wd / 2 : cx;
  const hero = o.hero !== undefined ? !!o.hero : heroOK(size, mid, cy, wd);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: o.crop !== undefined ? o.crop : !hero }));
}

// ------------------------------------------------------------------ the set: wall, ceiling, floor (world px). Light: warm ceiling panels with pools on the wall
const LIGHTS = [-420, 240, 810, 1260, 1760, 2240];
function setWall(lt) {
  ctx.fillStyle = lg(0, CEIL, 0, FY, [[0, '#f3e8d0'], [.55, '#eadcbf'], [1, '#dccdab']]); ctx.fillRect(-2400, CEIL, 5200, FY - CEIL);
  for (const x of LIGHTS) { ctx.fillStyle = rg(x, CEIL + 10, 10, 520, [[0, 'rgba(255,246,222,.55)'], [.45, 'rgba(255,240,210,.18)'], [1, 'rgba(255,240,210,0)']]); ctx.fillRect(x - 540, CEIL, 1080, 600); }
  ctx.fillStyle = lg(0, 1016, 0, FY, [[0, '#a6b79a'], [1, '#93a688']]); ctx.fillRect(-2400, 1016, 5200, FY - 1016);   /* the sage wainscot */
  ctx.fillStyle = 'rgba(60,80,50,.12)'; for (let x = -2400; x < 2800; x += 96) ctx.fillRect(x, 1016, 2, FY - 1016);
  /* the handrail along the wall (broken at the closet, the door, the fridge and the counter) */
  const gaps = [[CL.x0 - 14, CL.x1 + 14], [DOOR.x0 - 22, DOOR.x1 + 22], [1330, 2100]];
  let x = -2400;
  for (const [a, b] of gaps.concat([[2800, 2800]])) {
    if (a > x) { ctx.fillStyle = 'rgba(40,30,20,.18)'; ctx.fillRect(x, 1022, a - x, 10); ctx.fillStyle = lg(0, 996, 0, 1018, [[0, '#c69a68'], [.5, '#a77a4a'], [1, '#7c5530']]); rr(x, 996, a - x, 20, 9); ctx.fill(); ctx.fillStyle = 'rgba(255,240,210,.35)'; ctx.fillRect(x, 999, a - x, 3); for (let bx = x + 40; bx < a - 20; bx += 260) { ctx.fillStyle = '#8a8e96'; ctx.fillRect(bx, 1016, 10, 14); } }
    x = b;
  }
  ctx.fillStyle = '#6e5b49'; ctx.fillRect(-2400, FY - 14, 5200, 14); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-2400, FY - 14, 5200, 2);
}
function setCeiling(lt) {
  /* the ceiling seen from below: a plane that comes toward us as we look up (rows widen upward, seams fan out from the camera's x) */
  const vx = CAM.x, top = CEIL - 1700;
  ctx.fillStyle = lg(0, top, 0, CEIL, [[0, '#a59c8b'], [.7, '#cbc3b3'], [1, '#e6dfd1']]); ctx.fillRect(-2400, top, 5200, CEIL - top);
  ctx.strokeStyle = 'rgba(110,100,85,.3)'; ctx.lineWidth = 2;
  ctx.beginPath(); let y = CEIL, step = 30; while (y > top) { y -= step; step *= 1.3; ctx.moveTo(-2400, y); ctx.lineTo(2800, y); } ctx.stroke();
  ctx.beginPath(); for (let x = -2400; x <= 2800; x += 120) { ctx.moveTo(x, CEIL); ctx.lineTo(x + (x - vx) * 1.5, top); } ctx.stroke();
  ctx.fillStyle = '#b9b0a0'; ctx.fillRect(-2400, CEIL - 8, 5200, 8);
  for (const x of LIGHTS) {
    const k = (x - vx) * .09;
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(x - 104, CEIL - 22); ctx.lineTo(x + 104, CEIL - 22); ctx.lineTo(x + 118 + k, CEIL - 70); ctx.lineTo(x - 118 + k, CEIL - 70); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,140,120,.6)'; ctx.lineWidth = 3; ctx.stroke();
    glow(x + k * .5, CEIL - 46, 150, '#fff2d6', .55, .4);
  }
}
function setFloor(lt) {
  ctx.fillStyle = lg(0, FY, 0, FY + 900, [[0, '#d9cfbb'], [.3, '#cdc2ab'], [1, '#b5a98f']]); ctx.fillRect(-2400, FY, 5200, 1600);
  ctx.strokeStyle = 'rgba(110,95,70,.22)'; ctx.lineWidth = 2;
  for (let i = 1; i < 14; i++) { const y = FY + 16 * i * i * .55 + 10 * i; ctx.beginPath(); ctx.moveTo(-2400, y); ctx.lineTo(2800, y); ctx.stroke(); }
  for (let x = -2400; x <= 2800; x += 120) { ctx.beginPath(); ctx.moveTo(x, FY); ctx.lineTo(x + (x - 540) * 1.4, FY + 900); ctx.stroke(); }
  /* a soft sheen of the ceiling lights on the vinyl */
  for (const x of LIGHTS) { ctx.fillStyle = rg(x, FY + 60, 6, 260, [[0, 'rgba(255,250,235,.28)'], [1, 'rgba(255,250,235,0)']]); ctx.save(); ctx.translate(x, FY + 60); ctx.scale(1, .22); ctx.translate(-x, -(FY + 60)); ctx.fillRect(x - 280, FY - 220, 560, 560); ctx.restore(); }
}
const shadowAt = (x, y, w, a = .28) => { ctx.save(); ctx.translate(x, y); ctx.scale(1, .16); ctx.fillStyle = rg(0, 0, 4, w, [[0, 'rgba(40,30,20,' + a + ')'], [1, 'rgba(40,30,20,0)']]); ctx.beginPath(); ctx.arc(0, 0, w, 0, TAU); ctx.fill(); ctx.restore(); };

// ------------------------------------------------------------------ the policy closet: frame, plate, the inside (back, side walls, shelves), and two doors that swing about their hinges
/* the doors' open angle (radians; 0 shut, past PI/2 they show their inner face): Onion's tug cracks the left door, then the pressure bursts both (closetopen 5.48) with an overshoot and a bounce */
function doorAng(lt, side) {
  const t0 = CUE.closetopen;
  if (lt < t0) { const tug = side < 0 ? .16 * ss(lt, t0 - .1, t0) : 0; return tug + .012 * Math.sin(lt * 23) * ss(lt, t0 - .35, t0 - .05) * (side < 0 ? 1 : -1); }   /* the doors strain, then the tug */
  const u = lt - t0, A = side < 0 ? 1.98 : 1.9;
  return A * (1 - Math.exp(-u * 8.5) * Math.cos(u * 17)) + .03 * Math.exp(-u * 3) * Math.sin(u * 30);
}
function closetBack(lt) {
  /* the moulding frame and the plate above it */
  ctx.fillStyle = 'rgba(40,25,15,.22)'; ctx.fillRect(CL.x0 + 10, CL.top + 12, CL.x1 - CL.x0, FY - CL.top - 12);
  ctx.fillStyle = lg(CL.x0, 0, CL.x1, 0, [[0, '#5e3d24'], [.5, '#6d482b'], [1, '#553620']]); rr(CL.x0, CL.top, CL.x1 - CL.x0, FY - CL.top, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(20,10,5,.6)'; ctx.lineWidth = 3; ctx.stroke();
  /* the inside: back panel, side walls (a deep box), shelves with their front edges */
  ctx.fillStyle = lg(0, CL.itop, 0, FY, [[0, '#3a281b'], [1, '#2c1f16']]); ctx.fillRect(CL.ix0, CL.itop, CL.ix1 - CL.ix0, FY - CL.itop);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(CL.ix0, CL.itop, 26, FY - CL.itop); ctx.fillRect(CL.ix1 - 26, CL.itop, 26, FY - CL.itop); ctx.fillRect(CL.ix0, CL.itop, CL.ix1 - CL.ix0, 20);
  ctx.fillStyle = rg(CL.seam, CL.itop + 40, 10, 420, [[0, 'rgba(255,235,200,.16)'], [1, 'rgba(255,235,200,0)']]); ctx.fillRect(CL.ix0, CL.itop, CL.ix1 - CL.ix0, FY - CL.itop);
  for (let r = 1; r < 5; r++) {
    const y = CL.shelves[r];
    ctx.fillStyle = '#9a7448'; ctx.fillRect(CL.ix0, y - 6, CL.ix1 - CL.ix0, 6); ctx.fillStyle = lg(0, y, 0, y + 12, [[0, '#c49a66'], [1, '#8e6a42']]); ctx.fillRect(CL.ix0, y, CL.ix1 - CL.ix0, 12);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(CL.ix0, y + 12, CL.ix1 - CL.ix0, 8);
  }
  ctx.fillStyle = '#7a5836'; ctx.fillRect(CL.ix0, CL.shelves[0], CL.ix1 - CL.ix0, FY - CL.shelves[0]);
}
function closetPlate(lt) {
  const cx = CL.seam, cy = CL.top - 38, w = 470, h = 54;
  ctx.fillStyle = 'rgba(40,25,10,.25)'; rr(cx - w / 2 + 4, cy - h / 2 + 5, w, h, 8); ctx.fill();
  ctx.fillStyle = lg(0, cy - h / 2, 0, cy + h / 2, [[0, '#f1d48a'], [.5, '#c99a3c'], [1, '#9c7426']]); rr(cx - w / 2, cy - h / 2, w, h, 8); ctx.fill(); ctx.strokeStyle = '#6b4c12'; ctx.lineWidth = 3; ctx.stroke();
  for (const sx of [-1, 1]) { ctx.fillStyle = '#7a5a1c'; ctx.beginPath(); ctx.arc(cx + sx * (w / 2 - 16), cy, 5, 0, TAU); ctx.fill(); }
  const sb = scrBox(cx, cy, w / 2, h / 2); if (sb.x0 < 44 || sb.x1 > W - 44 || sb.y0 < 44 || sb.y1 > 1370 || (sb.x0 < 506 && sb.y0 < 250)) return;   /* cut by the frame or under the clock: no lettering */
  UI.container('cl_plate', 'sign', [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], 14);
  TXT('POLICIES & PROCEDURES', cx, cy, { size: 32, fill: '#3a2608', spacing: 2, maxW: w - 50, cid: 'cl_plate', center: true });
}
/* one door: hinge at hx, width w (side -1: the left door, its free edge to the right of the hinge; +1 the right door), opened by angle a. Drawn as a quad whose free edge comes toward us (a little taller). */
function closetDoor(lt, side) {
  const a = doorAng(lt, side), w = (CL.ix1 - CL.ix0) / 2, hx = side < 0 ? CL.ix0 : CL.ix1, dir = -side, y0 = CL.itop - 6, y1 = FY - 4;
  const c = Math.cos(a), sn = Math.sin(a), fx = hx + dir * w * c, grow = 1 + .09 * sn, ym = (y0 + y1) / 2, fy0 = ym + (y0 - ym) * grow, fy1 = ym + (y1 - ym) * grow;
  const quad = [[hx, y0], [fx, fy0], [fx, fy1], [hx, y1]];
  if (Math.abs(c) > .02) {
    const front = c > 0, lit = front ? 1 : .78 + .12 * sn;
    poly(quad, front ? lg(hx, 0, fx, 0, [[0, '#7c4f2c'], [1, '#8d5c34']]) : lg(hx, 0, fx, 0, [[0, '#6b4528'], [1, '#5a3a22']]), 'rgba(25,12,5,.7)', 3);
    /* panels (outer face) or the plain back with the shelf of hooks (inner face) */
    const P = (u, v) => [hx + dir * w * c * u, lerp(lerp(y0, fy0, u), lerp(y1, fy1, u), v)];
    if (front) {
      for (const [v0, v1] of [[.06, .46], [.54, .94]]) poly([P(.14, v0), P(.86, v0), P(.86, v1), P(.14, v1)], 'rgba(255,220,170,.10)', 'rgba(30,15,5,.45)', 2.4);
      const hp = P(.9, .66); ctx.fillStyle = '#e2c27a'; ctx.beginPath(); ctx.ellipse(hp[0], hp[1], Math.max(2, 7 * Math.abs(c)), 26, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6b4c12'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      poly([P(.08, .05), P(.92, .05), P(.92, .95), P(.08, .95)], 'rgba(0,0,0,.12)', null);
      const hp = P(.5, .16); ctx.fillStyle = '#c8ccd2'; ctx.beginPath(); ctx.arc(hp[0], hp[1], 5, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,' + (.25 * (1 - lit)) + ')'; ctx.beginPath(); quad.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  }
  /* the edge of the door (its thickness) shows as it turns toward us */
  const th = 16 * sn; if (th > 1) poly([[fx, fy0], [fx + dir * th * (c >= 0 ? 1 : -1) * .0 + (c >= 0 ? -side : side) * th, fy0 + 3], [fx + (c >= 0 ? -side : side) * th, fy1 - 3], [fx, fy1]], '#4a2e18', 'rgba(20,10,5,.6)', 2);
}

// ------------------------------------------------------------------ Brenda's closet (as ep21_prep.js draws it: a plain door, a vision window under the NOT A CLOSET sign, a lever, a crumb), opening a crack in br2
function notACloset(cx, cy, s, rot, id, hero) {                                /* the paper sign, hand-lettered in marker (the same sign as ep21_prep.js) */
  const w = 132 * s, h = 92 * s;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(-w / 2 + 4 * s, -h / 2 + 6 * s, w, h);
  ctx.fillStyle = '#fffdf6'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = 'rgba(60,50,40,.45)'; ctx.lineWidth = 1.6 * s; ctx.strokeRect(-w / 2, -h / 2, w, h);
  UI.container(id, 'sign', [-w / 2, -h / 2, w / 2, h / 2], 5 * s);
  TXT('NOT A', 0, -h * .2, { size: 28 * s, font: 'Lucky', weight: 400, fill: '#1e2230', spacing: 1.5 * s, cid: id, maxW: w - 20 * s, hero });
  TXT('CLOSET', 0, h * .2, { size: 32 * s, font: 'Lucky', weight: 400, fill: '#d4202c', spacing: 1.5 * s, cid: id, maxW: w - 16 * s, hero });
  ctx.fillStyle = 'rgba(236,226,168,.85)'; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * (w / 2 - 8 * s), -h / 2 + 2 * s); ctx.rotate(sd * .5); ctx.fillRect(-16 * s, -6 * s, 32 * s, 12 * s); ctx.restore(); }
  ctx.restore();
}
/* the door's open angle: shut until "Since" (br2), then a crack (and it stays ajar) */
const bDoorAng = lt => .95 * ss(lt, snapT(bS('br2')) + .05, snapT(bS('br2')) + .42) - .05 * Math.sin(Math.max(0, lt - bS('br2') - .42) * 9) * Math.exp(-Math.max(0, lt - bS('br2') - .42) * 4) * (lt > bS('br2') + .42 ? 1 : 0);
/* the hum of the muffled voice in the shut door (br1): a 1 px rattle */
const bRattle = lt => (lt > bS('br1') - .05 && lt < bE('br1') + .1) ? voice('br1', lt) * Math.sin(lt * 61) : 0;
function brendaDoor(lt, o = {}) {
  const D = DOOR, fy = FY, a = bDoorAng(lt), c = Math.cos(a), sn = Math.sin(a), dw = D.x1 - D.x0 - 24, hx = D.x0 + 12, y0 = D.top + 12, rat = bRattle(lt);
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.fillRect(D.x0 + 8, D.top + 8, D.x1 - D.x0, fy - D.top - 8);
  ctx.fillStyle = '#e9e2d2'; ctx.fillRect(D.x0, D.top, D.x1 - D.x0, fy - D.top); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(D.x0, D.top, D.x1 - D.x0, fy - D.top);
  /* the inside, seen through the gap: a dark little room lit by her battery lantern; Brenda (o.inside draws her, clipped) */
  if (a > .01) {
    const gx0 = hx + dw * c;
    ctx.save(); ctx.beginPath(); ctx.rect(hx, y0, dw, fy - y0); ctx.clip();
    ctx.fillStyle = lg(0, y0, 0, fy, [[0, '#2c2433'], [1, '#1d1822']]); ctx.fillRect(hx, y0, dw, fy - y0);
    ctx.fillStyle = rg(BRN.x + 34, 1150, 10, 260, [[0, 'rgba(255,196,120,.55)'], [.5, 'rgba(255,170,90,.18)'], [1, 'rgba(255,170,90,0)']]); ctx.fillRect(hx, y0, dw, fy - y0);
    ctx.fillStyle = '#4a4458'; ctx.fillRect(hx, 980, dw, 6); ctx.fillStyle = '#e8e6de'; for (let i = 0; i < 4; i++) ctx.fillRect(hx + 12 + i * 22, 952, 18, 28);
    if (o.inside) { ctx.save(); ctx.beginPath(); ctx.rect(gx0, y0, hx + dw - gx0, fy - y0); ctx.clip(); o.inside(); ctx.restore(); }
    ctx.restore();
  }
  /* the door leaf about its left hinge (it swings toward us: the free edge grows a little); the sign rides it: foreshortened paper, uniformly scaled lettering */
  ctx.save(); ctx.translate(rat * 1.4, 0);
  const fx = hx + dw * c, grow = 1 + .08 * sn, ym = (y0 + fy) / 2, P = (u, v) => [hx + dw * c * u, lerp(lerp(y0, ym + (y0 - ym) * grow, u), lerp(fy, ym + (fy - ym) * grow, u), v)];
  poly([P(0, 0), P(1, 0), P(1, 1), P(0, 1)], lg(hx, 0, fx, 0, [[0, '#d8cdb8'], [.5, '#e6dcc8'], [1, '#c9bda6']]), INKC, 2.6);
  poly([P(.12, .06), P(.88, .06), P(.88, .5), P(.12, .5)], null, 'rgba(80,60,40,.25)', 2);
  const wc = P(.5, .3), ww = 72 * c, wh = 124;
  if (ww > 4) {
    ctx.fillStyle = '#3a3f50'; ctx.fillRect(wc[0] - ww / 2, wc[1] - wh / 2, ww, wh); ctx.strokeStyle = '#9aa0ac'; ctx.lineWidth = 5; ctx.strokeRect(wc[0] - ww / 2, wc[1] - wh / 2, ww, wh);
    if (c > .97) notACloset(wc[0], wc[1] + 2, 1, -.035 + .03 * rat, 'nac', o.hero);
    else { ctx.save(); ctx.translate(wc[0], wc[1] + 2); ctx.scale(c, 1); ctx.fillStyle = '#fffdf6'; ctx.fillRect(-66, -46, 132, 92); ctx.strokeStyle = 'rgba(60,50,40,.45)'; ctx.lineWidth = 1.6; ctx.strokeRect(-66, -46, 132, 92); ctx.restore();
      ctx.save(); ctx.translate(wc[0], wc[1] + 2); ctx.scale(c, c); TXT('NOT A', 0, -18, { size: 28, font: 'Lucky', weight: 400, fill: '#1e2230', spacing: 1.5, hero: false }); TXT('CLOSET', 0, 18, { size: 32, font: 'Lucky', weight: 400, fill: '#d4202c', spacing: 1.5, hero: false }); ctx.restore(); }
  }
  const lh = P(.9, .62); ctx.fillStyle = '#b9bec9'; rr(lh[0] - 10 * c, lh[1] - 20, 20 * c + 1, 40, 6); ctx.fill(); ctx.fillStyle = '#e4e7ee'; rr(lh[0] - 26 * c, lh[1] - 8, 32 * c + 1, 12, 6); ctx.fill();
  if (sn > .05) poly([P(1, 0), [P(1, 0)[0] + 14 * sn, P(1, 0)[1] + 3], [P(1, 1)[0] + 14 * sn, P(1, 1)[1] - 3], P(1, 1)], '#b3a891', INKC, 2);   /* its edge */
  ctx.restore();
  /* the light under the door, the crumb */
  ctx.fillStyle = 'rgba(255,200,130,.75)'; ctx.fillRect(hx + 6, fy - 4, dw - 12, 4); glow(D.cx, fy, 90, '#ffc88a', .18, .3);
  ctx.fillStyle = '#d9b57a'; ctx.beginPath(); ctx.ellipse(D.cx + 46, fy + 4, 6, 3.4, .3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1.4; ctx.stroke();
}

// ------------------------------------------------------------------ the station's survey-ready things (stand-ins drawn here; the reticles of the scan use their boxes)
function sanitizer(lt) {
  const [x, y] = OBJ.san;
  if (window.A21 && typeof A21.sanitizer === 'function') { const bx = A21.sanitizer(ctx, { x, y, s: .5, t: lt, level: .95, label: false }); return bx || [x - 32, y - 57, x + 32, y + 57]; }
  ctx.fillStyle = lg(x - 34, 0, x + 34, 0, [[0, '#ffffff'], [1, '#d8dde6']]); rr(x - 34, y - 58, 68, 116, 10); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = '#4fb6e2'; rr(x - 18, y - 30, 36, 40, 5); ctx.fill(); ctx.fillStyle = '#7d8696'; rr(x - 24, y + 26, 48, 18, 6); ctx.fill();
  return [x - 34, y - 58, x + 34, y + 58];
}
function crashCart(lt) {
  const [cx] = OBJ.cart;
  shadowAt(cx, FY, 120, .3);
  if (window.A21 && typeof A21.crashCart === 'function') { const bx = A21.crashCart(ctx, { x: cx, y: FY, s: .68, t: lt, sealed: true, seal: '0042137' }); return { box: bx || [cx - 102, FY - 380, cx + 102, FY] }; }
  const x0 = cx - 100, x1 = cx + 100, y1 = FY - 22, y0 = FY - 340;
  ctx.fillStyle = lg(x0, 0, x1, 0, [[0, '#e0353d'], [1, '#a91d26']]); rr(x0, y0, x1 - x0, y1 - y0, 8); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  for (let i = 0; i < 5; i++) { const y = y0 + 16 + i * 60; ctx.strokeStyle = 'rgba(60,0,10,.55)'; ctx.lineWidth = 2.4; rr(x0 + 12, y, x1 - x0 - 24, 50, 5); ctx.stroke(); }
  for (const wx of [x0 + 20, x1 - 20]) { ctx.fillStyle = '#2b2b30'; ctx.beginPath(); ctx.arc(wx, FY - 12, 12, 0, TAU); ctx.fill(); }
  return { box: [x0, y0, x1, y1] };
}
function medFridge(lt) {
  const x0 = 1340, x1 = 1520, y0 = FY - 300, cx = (x0 + x1) / 2;
  shadowAt(cx, FY, 110, .26);
  ctx.fillStyle = lg(x0, 0, x1, 0, [[0, '#ffffff'], [1, '#d5dbe4']]); rr(x0, y0, x1 - x0, 300, 10); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#aab2c0'; rr(x1 - 22, y0 + 40, 10, 120, 5); ctx.fill();
  /* the dial thermometer and the taped temperature log */
  const tx = cx - 34, ty = y0 + 70;
  if (window.A21 && typeof A21.fridgeThermo === 'function') A21.fridgeThermo(ctx, { x: tx, y: ty, s: .4, deg: 38, t: lt });
  else { ctx.fillStyle = '#f7f8fb'; ctx.beginPath(); ctx.arc(tx, ty, 30, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a4050'; ctx.lineWidth = 3.4; ctx.stroke(); }
  const lx = cx - 56, ly = y0 + 116; ctx.fillStyle = '#fffdf4'; ctx.fillRect(lx, ly, 104, 136); ctx.strokeStyle = 'rgba(60,60,80,.5)'; ctx.lineWidth = 1.6; ctx.strokeRect(lx, ly, 104, 136);
  ctx.fillStyle = '#2f6fd0'; ctx.fillRect(lx + 6, ly + 6, 92, 12); ctx.strokeStyle = 'rgba(60,60,80,.35)'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(lx + 6, ly + 30 + i * 15); ctx.lineTo(lx + 98, ly + 30 + i * 15); ctx.stroke(); }
  ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 2.4; for (let i = 0; i < 6; i++) { const y = ly + 26 + i * 15; ctx.beginPath(); ctx.moveTo(lx + 76, y); ctx.lineTo(lx + 80, y + 4); ctx.lineTo(lx + 88, y - 4); ctx.stroke(); }
  ctx.fillStyle = 'rgba(236,226,168,.85)'; ctx.fillRect(lx + 30, ly - 6, 44, 12);
  return { thermo: [tx - 32, ty - 32, tx + 32, ty + 32], log: [lx, ly, lx + 104, ly + 136] };
}
/* a white survey label with fake lettering (A21.label when the kit has it) */
function surveyLabel(x, y, s, rot) {
  if (window.A21 && typeof A21.label === 'function') { A21.label(ctx, { x, y, s: s * .22, rot, text: 'OPENED 11/6 3:04P SB', t: 0 }); return; }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-26, -10, 52, 20); ctx.strokeStyle = 'rgba(60,60,80,.45)'; ctx.lineWidth = 1.2; ctx.strokeRect(-26, -10, 52, 20);
  ctx.fillStyle = '#d4202c'; ctx.fillRect(-22, -6, 18, 3.4); ctx.fillStyle = 'rgba(40,40,60,.6)'; ctx.fillRect(-22, 0, 40, 2.6); ctx.fillRect(-22, 4.4, 28, 2.6);
  ctx.restore();
}
function counter(lt) {
  const x0 = OBJ.counter[0], x1 = OBJ.counter[1], top = 990;
  shadowAt((x0 + x1) / 2, FY, 300, .22);
  ctx.fillStyle = lg(0, top, 0, FY, [[0, '#3f6fa8'], [1, '#2f5584']]); ctx.fillRect(x0, top + 18, x1 - x0, FY - top - 18); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(x0, top + 18, x1 - x0, FY - top - 18);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let x = x0 + 30; x < x1; x += 110) ctx.fillRect(x, top + 40, 70, FY - top - 70);
  ctx.fillStyle = lg(0, top, 0, top + 18, [[0, '#e8d3b0'], [1, '#bf9f74']]); rr(x0 - 14, top, x1 - x0 + 28, 20, 4); ctx.fill(); ctx.stroke();
  /* on top: a pitcher, a stapler, a plant, a box of gloves; every one of them labeled */
  const px = OBJ.pitcher[0]; ctx.fillStyle = 'rgba(200,230,255,.75)'; ctx.beginPath(); ctx.moveTo(px - 30, top); ctx.lineTo(px - 36, top - 96); ctx.lineTo(px + 30, top - 96); ctx.lineTo(px + 26, top); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = 'rgba(255,190,90,.55)'; ctx.fillRect(px - 31, top - 54, 58, 52); ctx.strokeStyle = INKC; ctx.beginPath(); ctx.arc(px + 36, top - 56, 18, -1.2, 1.2); ctx.stroke();
  surveyLabel(px - 2, top - 74, 1, -.04);
  ctx.fillStyle = '#2b2e36'; rr(1810, top - 26, 70, 24, 6); ctx.fill(); ctx.fillStyle = '#5a6070'; rr(1806, top - 36, 64, 14, 6); ctx.fill(); surveyLabel(1846, top - 14, .7, .05);
  ctx.fillStyle = '#b07a4a'; ctx.beginPath(); ctx.moveTo(1930, top); ctx.lineTo(1924, top - 46); ctx.lineTo(1986, top - 46); ctx.lineTo(1980, top); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * .32; ctx.fillStyle = i % 2 ? '#3e8f4a' : '#2f7a3c'; ctx.beginPath(); ctx.ellipse(1955 + Math.cos(a) * 30, top - 66 + Math.sin(a) * 30, 12, 26, a + PI / 2, 0, TAU); ctx.fill(); }
  surveyLabel(1955, top - 22, .8, -.06);
  ctx.fillStyle = '#e9edf3'; rr(2000, top - 40, 50, 40, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#5ab0e0'; ctx.fillRect(2004, top - 34, 42, 8); surveyLabel(2025, top - 14, .6, .03);
  return { pitcher: [px - 36, top - 96, px + 30, top] };
}

// ------------------------------------------------------------------ binders: one policy binder seen on its spine (the physics bodies are its footprint), A21.binder when the kit has it
const GOLD = '#e8b21c';
function binderSpine(x, y, ang, hw, hh, col, o = {}) {
  if (window.A21 && typeof A21.binder === 'function') {
    A21.binder(ctx, { x, y, w: hw * 2, h: hh * 2, rot: ang, color: col, spine: o.spine || false, view: 'spine', hero: false });
    if (o.dim) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = 'rgba(20,12,30,' + o.dim + ')'; rr(-hw, -hh, hw * 2, hh * 2, Math.min(4, hw * .35)); ctx.fill(); ctx.restore(); }
    return;
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = col; rr(-hw, -hh, hw * 2, hh * 2, Math.min(4, hw * .35)); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(-hw + 1.5, -hh + 3, Math.max(1, hw * .55), hh * 2 - 6);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-hw, -hh, hw * 2, 3); ctx.fillRect(-hw, hh - 3, hw * 2, 3);
  if (hw >= 6.5) {   /* the clear pocket with its insert (fake lettering) and the finger hole */
    ctx.fillStyle = o.label || '#f4f1e8'; ctx.fillRect(-hw + 2.5, -hh * .66, hw * 2 - 5, hh * .56);
    ctx.fillStyle = 'rgba(40,40,60,.55)'; const n = hw > 12 ? 3 : 2; for (let i = 0; i < n; i++) ctx.fillRect(-hw + 5, -hh * .58 + i * hh * .15, (hw * 2 - 10) * (i === n - 1 ? .6 : 1), Math.max(1.4, hh * .05));
    ctx.fillStyle = 'rgba(10,10,20,.55)'; ctx.beginPath(); ctx.ellipse(0, hh * .55, Math.min(hw * .42, 6), Math.min(hw * .42, 6) * 1.4, 0, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(15,10,20,.75)'; ctx.lineWidth = 1.8; rr(-hw, -hh, hw * 2, hh * 2, Math.min(4, hw * .35)); ctx.stroke();
  if (o.dim) { ctx.fillStyle = 'rgba(20,12,30,' + o.dim + ')'; rr(-hw, -hh, hw * 2, hh * 2, Math.min(4, hw * .35)); ctx.fill(); }
  ctx.restore();
}
/* which layer a binder is drawn in at lt: 'closet' (still on its shelf: behind the doors and everybody), 'back' (slab 0: behind Radish), 'front' (slabs 1 and 2: in front of him) */
function binderLayer(S, b, lt) {
  if (lt < b.tRel) return 'closet';
  if (b.id === S.meta.ids.last) return 'front';
  return b.slab === 0 ? 'back' : 'front';
}
const isPluck = (S, b) => S.meta.pluck && b.id === S.meta.pluck.id;
function drawBinders(lt, layer, o = {}) {
  const S = simInit(); if (!S) return;
  const st = simState(lt); if (!st) return;
  for (const slab of [0, 1, 2, 3]) for (const b of S.meta.binders) {
    const bs = b.id === S.meta.ids.last ? 3 : b.slab;                       /* the last binder is drawn after everything (it ends up on his head) */
    if (bs !== slab || binderLayer(S, b, lt) !== layer) continue;
    if (isPluck(S, b) && o.skipPluck) continue;
    const e = st.by[b.id], col = isPluck(S, b) ? GOLD : b.id === S.meta.ids.last ? '#2f6fd0' : PAL[b.col % PAL.length];
    const dim = layer === 'closet' ? .12 : b.slab === 0 ? .2 : b.slab === 1 ? .05 : 0;
    binderSpine(e.x, e.y, e.angle, b.hw, b.hh, col, { dim, t: lt });
  }
}
/* the 7.4 binder in Onion's hand, cover to us (EXT.prop: drawn in the hand's frame; the hand holds the spine's top corner): POLICY 7.4 / BREAKS, a sticky note REVISED TUESDAY */
EXT.prop.fp21c_b74 = (side, o, t) => {
  const S = o.b74Scale || 1, w = 110, h = 126, tilt = o.b74Rot || 0;
  ctx.save(); ctx.rotate(tilt); ctx.scale(S, S); ctx.translate(-10, -14);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(4, 8, w, h, 7); ctx.fill();
  ctx.fillStyle = lg(0, 0, w, 0, [[0, '#c8920e'], [.12, GOLD], [1, '#d9a417']]); rr(0, 0, w, h, 7); ctx.fill(); ctx.strokeStyle = 'rgba(40,25,5,.85)'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(12, 0, 3, h);
  ctx.fillStyle = '#fffaf0'; rr(20, 10, w - 28, 72, 4); ctx.fill(); ctx.strokeStyle = 'rgba(60,50,30,.5)'; ctx.lineWidth = 1.4; ctx.stroke();
  UI.container('b74', 'sign', [20, 10, w - 8, 82], 3);
  const lx = 20 + (w - 28) / 2;
  if (o.b74Text !== false) { TXT('POLICY', lx, 23, { size: 13, fill: '#1e2230', spacing: 1, cid: 'b74', maxW: w - 36, hero: o.b74Hero }); TXT('7.4', lx, 46, { size: 22, fill: '#1e2230', cid: 'b74', maxW: w - 36, hero: o.b74Hero });
    TXT('BREAKS', lx, 68, { size: 13, fill: '#b5262e', spacing: 1, cid: 'b74', maxW: w - 36, hero: o.b74Hero }); }
  /* the sticky note, a little crooked */
  ctx.save(); ctx.translate(64, 104); ctx.rotate(-.05);
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(-38, -20, 80, 44); ctx.fillStyle = '#ff9ec2'; ctx.fillRect(-40, -22, 80, 44); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-40, -22, 80, 7);
  UI.container('b74n', 'sign', [-40, -22, 40, 22], 3);
  if (o.b74Text !== false) { TXT('REVISED', 0, -8, { size: 12.5, fill: '#5a1030', cid: 'b74n', maxW: 72, hero: o.b74Hero }); TXT('TUESDAY', 0, 9, { size: 12.5, fill: '#5a1030', cid: 'b74n', maxW: 72, hero: o.b74Hero }); }
  ctx.restore();
  ctx.restore();
};
PROP_BOX.fp21c_b74 = o => { const S = o.b74Scale || 1; return Object.assign([-24 * S, -30 * S, 120 * S, 150 * S], { nearFace: true }); };
/* Brenda's 2019 sandwich (held by the bottom crust): bread, lettuce gone to paper, a bite out of the corner */
EXT.prop.fp21c_sandwich = (side, o, t) => {
  const S = o.sandScale || 1;
  ctx.save(); ctx.scale(S, S); ctx.rotate(o.sandRot || -.1); ctx.lineJoin = 'round';
  const bread = (y, h) => { ctx.fillStyle = '#e9c98e'; ctx.beginPath(); ctx.moveTo(-34, y + h); ctx.lineTo(-34, y + 6); ctx.quadraticCurveTo(-34, y, -26, y); ctx.lineTo(18, y); ctx.lineTo(24, y + 6); ctx.arc(28, y + 9, 5, -PI / 2, PI / 2); ctx.lineTo(34, y + h); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#a67a3c'; ctx.lineWidth = 2.6; ctx.stroke(); };
  bread(-14, 14); ctx.fillStyle = '#9fbf5a'; ctx.beginPath(); ctx.moveTo(-36, -16); for (let i = 0; i <= 8; i++) ctx.lineTo(-36 + i * 9, -16 - (i % 2 ? 5 : 0)); ctx.lineTo(36, -10); ctx.lineTo(-36, -10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2c94c'; ctx.fillRect(-32, -22, 62, 6); bread(-40, 18);
  ctx.restore();
};
PROP_BOX.fp21c_sandwich = Object.assign([-40, -48, 40, 10], { nearFace: true });
/* Brenda in her closet: on an upturned bucket by her lantern, the sandwich up by her face; seated (no legs), her body centre at y 1100 */
function brendaOpts(lt, o = {}) {
  if (!window.A13 || !A13.brenda) return null;
  const sp = lt >= ls('br2') - .1 && lt < le('br2') + .25, chew = lt > le('br2') + .4 ? Math.max(0, Math.sin((lt - le('br2')) * 7)) * .35 : 0;
  const b = A13.brenda({ t: lt, id: 'brenda', who: 'brenda', expr: A13.expr(sp ? 'wake' : 'weak'), lid: sp ? .12 : .35, dust: .3, specsDrop: .5, look: o.look || [.75, .05], yaw: -.18, headYaw: -.12,
    noLegs: true, noShadow: true, noReflect: true, arms: { l: 'rest', r: 'hold' }, hold: { r: 'fp21c_sandwich' }, hand: { r: 'grip' }, grip: { r: [70, 18] }, sandScale: 1.05, mouthOpen: chew || undefined });
  b.acc = b.acc.filter(a => a !== 'badge7');                  /* no badge: its lettering would sit behind the door's edge */
  return Object.assign(b, { x: BRN.x, y: 1100 + 124 * .9 * BRN.s, s: BRN.s });
}
function bucket(x, y) { ctx.fillStyle = '#e8b52a'; ctx.beginPath(); ctx.moveTo(x - 58, y); ctx.lineTo(x - 48, y - 86); ctx.lineTo(x + 48, y - 86); ctx.lineTo(x + 58, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x - 50, y - 60, 100, 8); }
function lantern(x, y, lt) { ctx.fillStyle = '#3a3d48'; rr(x - 16, y - 54, 32, 54, 6); ctx.fill(); ctx.fillStyle = '#fff1c8'; rr(x - 11, y - 46, 22, 32, 4); ctx.fill(); glow(x, y - 30, 120, '#ffc27a', .55 + .04 * Math.sin(lt * 3.1), .5); }
function brendaInside(lt) {
  bucket(BRN.x - 6, 1214);
  lantern(BRN.x + 64, 1214, lt);
  const b = brendaOpts(lt); if (b) drawChar(b);
  glow(BRN.x + 30, 1070, 170, '#ffcf9a', .3, .3);
}
/* what the scanner sees through her door: the cold door, a hot seated figure, the lantern white-hot, the sandwich cooler (a thermal palette, no lettering) */
function thermal(lt, k) {
  if (k <= .01) return;
  const D = DOOR, x0 = D.x0 + 12, x1 = D.x1 - 12, y0 = D.top + 12;
  ctx.save(); ctx.globalAlpha *= k; ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, FY - y0); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, FY, [[0, '#1b0b44'], [1, '#2a0d52']]); ctx.fillRect(x0, y0, x1 - x0, FY - y0);
  const pulse = .5 + .5 * Math.sin(lt * 5.2), bx = BRN.x - 10, by = 1092;
  const HOT = [[0, '#fff7cf'], [.28, '#ffd23a'], [.6, '#ff5a1e'], [.86, '#c0187a'], [1, 'rgba(120,10,110,0)']], WARM = [[0, '#ff8a30'], [.55, '#d3247a'], [1, 'rgba(120,10,110,0)']];
  const blob = (x, y, rx, ry, a, st) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(1, ry / rx); ctx.fillStyle = rg(0, 0, rx * .08, rx, st); ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); };
  const limb = (x0, y0, x1, y1, w, st) => { const n = 7; for (let i = 0; i <= n; i++) blob(lerp(x0, x1, i / n), lerp(y0, y1, i / n), w, w, 0, st); };
  blob(bx - 4, 1214, 74, 36, 0, WARM);                                      /* the bucket, warm where she sits */
  limb(bx + 30, 1176, bx + 92, 1196, 30, WARM); limb(bx + 92, 1196, bx + 98, 1246, 24, WARM);   /* a knee forward, a shin down */
  blob(bx, by, 104, 116, 0, HOT);                                           /* her: one round prune */
  limb(bx + 72, by + 20, bx + 96, by - 34, 24, HOT);                         /* the arm up, the sandwich at her mouth */
  ctx.fillStyle = rg(bx + 108, by - 44, 4, 46, [[0, '#56e0c0'], [.7, 'rgba(40,150,180,.85)'], [1, 'rgba(40,150,180,0)']]); ctx.beginPath(); ctx.ellipse(bx + 108, by - 44, 46, 22, -.15, 0, TAU); ctx.fill();   /* the sandwich (cooler than she is) */
  for (const ex of [-30, 30]) { ctx.fillStyle = 'rgba(40,0,70,.55)'; ctx.beginPath(); ctx.ellipse(bx + ex, by - 26, 21, 15, 0, 0, TAU); ctx.fill(); }   /* the glasses read cold */
  blob(bx + 78, 1180, 30, 30, 0, HOT); ctx.fillStyle = rg(bx + 78, 1180, 2, 22, [[0, '#ffffff'], [1, 'rgba(255,255,220,0)']]); ctx.fillRect(bx + 50, 1152, 56, 56);   /* the lantern, white-hot */
  ctx.fillStyle = 'rgba(255,255,255,' + (.08 + .06 * pulse) + ')'; for (let y = y0; y < FY; y += 6) ctx.fillRect(x0, y, x1 - x0, 1.6);
  ctx.restore();
}

// ------------------------------------------------------------------ the cast at scene time lt
const T_BURY = snapT(5.86);                                   /* the bottom row is over his feet: from here he is A21.radish 'radish_buried' (no legs, the clipboard arm up) */
const T_ZIP = [5.44, 5.74];                                   /* Onion pulls the handle and zips out of the frame to the left (she knows) */
const T_B74 = snapT(9.45);                                    /* the cut to the close-up: from here the 7.4 binder is her held prop, cover to us (the sim's body is no longer drawn) */
const radCentreY = lt => lt < T_BURY ? FY - 173.6 * RAD.s : RAD.cyBuried;
function radishOpts(lt) {
  const S = simInit(), bonk = S && S.bonks ? S.bonks.some(t => lt >= t && lt < t + .14) : false;
  const spk = id => lt >= ls(id) - .08 && lt < le(id) + .2;
  const scanner = lt < 11.9 ? 0 : lt < 12.2 ? ss(lt, 11.9, 12.15) : lt < 23.0 ? 1 : .85;
  let expr = 'radish_flat', look = [-.55, 0], yaw = -.3, head = -.25;
  if (lt >= 5.46 && lt < T_BURY) { look = [0, -.95]; yaw = -.1; head = -.05; }             /* the doors bang open behind him: his eyes go up. Nothing else moves. */
  if (lt >= T_BURY) { expr = 'radish_buried'; look = [-.5, -.05]; yaw = -.18; head = -.15; }
  if (spk('ra2')) { expr = 'radish_impressed'; look = [-.65, 0]; }
  if (lt >= bS('scan')) { look = [.75, 0]; yaw = .15; head = .2; }                          /* from the scan on he looks at her door */
  if (lt >= ls('ra5') - .05 && lt < le('ra5') + .4) { look = [-.3, .55]; }                  /* "Noted.": eyes down to the board */
  if (lt >= bS('end')) { look = [-.6, .05]; yaw = -.1; head = -.12; }
  const o = A21.radish({ t: lt, expr: expr === 'radish_impressed' && lt >= T_BURY ? 'radish_buried' : expr, pose: lt < T_BURY ? 'clip' : 'free', scanner, seed: 331 });
  if (expr === 'radish_impressed') { o.browUp = (o.browUp || 0) + 2 * ss(lt, ls('ra2') + .1, ls('ra2') + .35); }      /* eyebrows up 2 px: the most he moves */
  Object.assign(o, { x: RAD.x, s: RAD.s, look, yaw, headYaw: head, lid: bonk ? .95 : undefined });
  if (lt < T_BURY) { o.y = FY; }
  else {
    o.y = RAD.cyBuried + .9 * 104 * RAD.s;
    /* the clipboard arm comes up out of the pile (the same hand that held it at his side) and stays up; "Noted.": the pen hand comes up and writes */
    const up = ss(lt, T_BURY, T_BURY + .3), a1 = lerp(.5, 2.5, up), a2 = lerp(.3, .32, up);
    const write = false;
    o.arms = { l: [a1, a2], r: write ? 'hold' : 'none' }; o.hold = write ? { l: 'fp21_clipboard', r: 'fp21_pen' } : { l: 'fp21_clipboard' }; o.hand = { l: 'grip', r: 'grip' };
    o.cbScale = .82; o.cbRot = -.12; o.cbItems = ['FRONT DOOR', 'STAFFING', 'LABELS', 'MED PASS', 'BREAKS']; o.cbTicks = lt >= bS('scan') ? 4 : 3;
    if (lt >= CUE.penscratch) { o.cbFail = 4; o.cbFailK = ss(lt, CUE.penscratch, CUE.penscratch + .18); }
    if (lt >= ls('ra5') - .1 && lt < CUE.penscratch + .25) { o.cbRot = -.12 + .1 * ss(lt, ls('ra5'), ls('ra5') + .25) - .05 * Math.sin(Math.max(0, lt - CUE.penscratch) * 40) * (lt > CUE.penscratch ? 1 : 0); }   /* he turns the board to himself and scrawls */
    if (write) { const j = Math.sin((lt - CUE.penscratch) * 34) * 5 * (lt >= CUE.penscratch && lt < CUE.penscratch + .4 ? 1 : 0); o.grip = { r: [-112 + j, -98 + j * .4] }; o.gripSpace = 'body'; o.penAng = .5; }
    o.noLegs = true; o.noShadow = true;
  }
  return o;
}
/* Onion: by the left door until she pulls it (and zips off to the left); back at the heap for the pluck (where the sim's chosen binder is); then the wail */
function onionX(lt) {
  const S = simInit(), px = S && S.meta.pluck ? S.meta.pluck.onionX : -250;
  if (lt < T_ZIP[0]) return ONI.x0;
  if (lt < bS('o2') - .06) return lerp(ONI.x0, -820, Math.pow(sg(lt, T_ZIP[0], T_ZIP[1]), 1.6));
  return px;
}
function onionOpts(lt) {
  const S = simInit(), st = S ? simState(lt) : null, P = S && S.meta.pluck;
  const spk = id => lt >= ls(id) - .08 && lt < le(id) + .25;
  const x = onionX(lt), s = ONI.s, cy = FY - (78 + .9 * 124) * s;
  let yaw = .35, head = .3, look = [.6, -.05], expr = 'onion_cry', cry = .45, sob = 0, arms = { l: 'hold', r: 'rest' }, hold = { l: 'fp15_tabletclip' }, grip = { l: [-74, 104] }, extra = {};
  /* o1: the gasp of joy at "policy on breaks", then "Of course.", then she turns to the doors and takes the handle */
  if (lt >= 2.9 && lt < 5.38) { cry = lerp(.45, .85, ss(lt, wS('ra1', 6), wE('ra1', 8))); if (lt > wS('ra1', 6)) extra.browUp = 6 * ss(lt, wS('ra1', 6), wS('ra1', 6) + .25); }
  if (lt >= 4.95 && lt < T_ZIP[0] + .02) {
    const k = ss(lt, 4.95, 5.3); yaw = lerp(.35, 1.25, k); head = lerp(.3, .9, k);
    const hx = CL.ix0 + (CL.ix1 - CL.ix0) / 2 * .9 * Math.cos(doorAng(lt, -1)), hy = 1015;
    const k2 = ss(lt, 5.05, 5.3); arms.r = 'hold'; grip.r = [lerp(70, (hx - x) / s, k2), lerp(40, (hy - cy) / s, k2)]; extra.hand = { r: 'grip' };
  }
  if (lt >= T_ZIP[0] && lt < bS('o2') - .06) { yaw = -1.35; head = -1.2; look = [-.4, 0]; extra.transit = true; extra.gait = (ONI.x0 - x) / s; extra.dir = -1; extra.stride = 60; extra.vx = -1600 * s; arms.r = 'run'; }
  /* the pluck: she reaches into the heap WITHOUT LOOKING (her eyes stay on him); her hand follows the binder the sim drags out */
  if (lt >= bS('o2') - .06 && lt < bS('ra2')) {
    yaw = .55; head = .45; look = [.7, -.08];
    if (P && st) {
      const e = st.by[P.id], ca = Math.cos(e.angle), sa = Math.sin(e.angle), ax = e.x - sa * P.end, ay = e.y + ca * P.end;   /* the dragged end of the binder (local (0, end)) */
      const reach = ss(lt, P.t0 - .3, P.t0), rx = lerp(70, (ax - x) / s, reach), ry = lerp(40, (ay - cy) / s, reach);
      arms.r = 'hold'; grip.r = [rx, ry]; extra.hand = { r: 'grip' };
    }
  }
  if (lt >= T_B74 && lt < bS('ra2') + .5) { arms.r = 'hold'; hold.r = 'fp21c_b74'; grip.r = [108, -104]; extra.b74Hero = true; extra.b74Rot = -.04; extra.b74Scale = 1.24; extra.hand = { r: 'grip' }; }
  /* the wail: "Not Brenda." (the binder hugged to her) */
  if (lt >= bS('o3') - .1) { expr = 'onion_wail'; cry = 1; sob = lt >= CUE.sniffle - .05 ? .9 * Math.exp(-(lt - CUE.sniffle) * 1.2) + .3 : .35; yaw = .3; head = .2; look = [.5, -.05]; arms.r = 'hold'; hold.r = 'fp21c_b74'; grip.r = [78, 98]; extra.b74Rot = -.14; extra.b74Scale = .88; extra.b74Text = false; extra.hand = { r: 'grip' }; }
  if (spk('o1') || spk('o2')) cry = Math.max(cry, .8);
  if (lt >= 2.9 && lt < bS('ra2') + .5) extra.face = { curve: lerp(-.2, .62, ss(lt, wS('ra1', 6), wS('ra1', 6) + .3)), ang: -.25 };   /* tears of joy: the State asked for a policy */
  const o = A15.onion(Object.assign({ x, y: FY, s, t: lt, pose: 'clip', yaw, headYaw: head, look, who: 'onion', expr, cry, sob, arms, hold, grip }, extra));
  return o;
}

// ------------------------------------------------------------------ the shots (scene-local; every start snapped to a frame; the boundary frame is the NEW shot)
const SH = [
  { id: 'open', s: 0, k: 'wide', x: 430, y: 1050, z: [1.06, 1.1], hero: true },
  { id: 'ra1', s: 1.30, k: 'face', foc: 'radish', z: [2.0, 2.12], up: 150, dx: 80 },
  { id: 'o1', s: 2.90, k: 'face', foc: 'onion', z: [1.9, 2.06], up: 140, dx: -80 },
  { id: 'aval', s: 5.38, k: 'aval' },
  { id: 'o2a', s: 8.03, k: 'two', x: 31, y: 1030, z: [1.2, 1.24] },
  { id: 'o2b', s: 9.45, k: 'face', foc: 'onion', z: [2.34, 2.44], up: 60, dx: -170 },
  { id: 'ra2', s: 10.82, k: 'face', foc: 'radish', z: [2.3, 2.42], up: 130, dx: 40 },
  { id: 'scan', s: 12.28, k: 'pov' },
  { id: 'ra3', s: 14.53, k: 'face', foc: 'radish', z: [2.45, 2.56], up: 120, dx: 40 },
  { id: 'br1', s: 16.70, k: 'door', x: 810, y: 1010, z: [1.45, 1.55], hero: true },
  { id: 'ra4', s: 18.34, k: 'wide', x: 300, y: 1095, z: [1.66, 1.74], foc: 'radish' },
  { id: 'br2', s: 20.74, k: 'door', x: 868, y: 1062, z: [2.3, 2.45] },
  { id: 'ra5', s: 23.10, k: 'face', foc: 'radish', z: [2.3, 2.36], up: 110, dx: 20 },
  { id: 'stamp', s: 23.80, k: 'pov2' },
  { id: 'o3', s: 24.16, k: 'face', foc: 'onion', z: [2.2, 2.35], up: 110, dx: -40 },
  { id: 'end', s: 25.51, k: 'wide', x: 288, y: 1066, z: [.78, .8] },
];
for (const sh of SH) sh.s = sh.s === 0 ? 0 : snapT(sh.s);
SH.forEach((sh, i) => { sh.e = i + 1 < SH.length ? SH[i + 1].s : SCN.dur + .5; });
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const isPov = sh => sh.k === 'pov' || sh.k === 'pov2';
/* a trapezoid move from a to b over [t0, t1] with ramps r: the peak speed stays near the mean (the scanner's pan) */
function trap(t, t0, t1, a, b, r) {
  const T = t1 - t0, u = Math.max(0, Math.min(T, t - t0)), v = 1 / (T - r);
  let k; if (u < r) k = .5 * v / r * u * u; else if (u < T - r) k = .5 * v * r + v * (u - r); else k = 1 - .5 * v / r * (T - u) * (T - u);
  return lerp(a, b, k);
}
function camOf(lt, sh, C) {
  const dur = Math.min(sh.e, SCN.dur) - sh.s, u = c01((lt - sh.s) / dur);
  if (sh.k === 'face') { const z = lerp(sh.z[0], sh.z[1], easeIO(u)), [fx, fy] = faceC(C[sh.foc]); return { x: fx - (sh.dx || 0) / z, y: fy + sh.up / z, z }; }
  if (sh.k === 'aval') return { x: K([[5.38, 240], [6.6, 244], [8.03, 288]], lt), y: K([[5.38, 1040], [6.6, 1042], [8.03, 1046]], lt), z: K([[5.38, 1.12], [6.6, 1.14], [8.03, 1.27]], lt) };
  if (sh.k === 'pov') return { x: lt < 12.9 ? lerp(1420, 1352, sg(lt, 12.28, 12.9)) : trap(lt, 12.9, 13.75, 1352, 900, .22), y: 1060, z: .9 + .08 * ss(lt, 12.9, 13.75) + .04 * ss(lt, 13.75, 14.53) };
  if (sh.k === 'pov2') return { x: 812, y: 1060, z: lerp(1.0, 1.04, easeIO(u)) };
  return { x: sh.x, y: sh.y, z: lerp(sh.z[0], sh.z[1], easeIO(u)) };
}
/* frame tests (as ep20_forecast.js): a character is drawn only when wholly inside the frame, or on purpose through its edge (transit) */
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inBox(b) {
  const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys);
  return { inter: x1 > 0 && x0 < W, whole: x0 >= 8 && x1 <= W - 8 && y0 >= 8 };
}
function inFrame(o, pad = 0) {
  const b = boxOf(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys);
  return { inter: x1 > 0 && x0 < W, whole: x0 >= 8 && x1 <= W - 8 && y0 >= 8 };
}

// ------------------------------------------------------------------ dust of the burst and the pour, papers that slip out of the binders (pure functions of lt)
function dust(lt) {
  for (const [t0, x, y, n, R, seed] of [[CUE.closetopen, CL.seam, 900, 26, 260, 4], [CUE.binderavalanche + .25, 260, 1180, 34, 420, 9], [CUE.binderavalanche + .55, 120, 1210, 20, 300, 13]]) {
    const ag = lt - t0; if (ag < 0 || ag > 1.6) continue;
    for (let i = 0; i < n; i++) {
      const a = sr(i, seed) * TAU, v = (.3 + .7 * sr(i, seed + 1)) * R, e = 1 - Math.exp(-ag * 3.2), px = x + Math.cos(a) * v * e, py = y + Math.sin(a) * v * e * .45 - 60 * ag, r = 14 + 40 * sr(i, seed + 2) * (.4 + ag);
      const al = .16 * (1 - ag / 1.6) * (.5 + .5 * sr(i, seed + 3));
      ctx.fillStyle = rg(px, py, 1, r, [[0, 'rgba(236,226,206,' + al + ')'], [1, 'rgba(236,226,206,0)']]); ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
    }
  }
}
const PAPER_X = [10, 40, 130, 470, 560, 640, -240, 520];
function papers(lt, layer) {
  const t0 = CUE.binderavalanche + .15; if (lt < t0) return;
  for (let i = 0; i < PAPER_X.length; i++) {
    if ((i % 2 === 0) !== (layer === 'back')) continue;
    const ag = lt - t0 - i * .07, dur = 1.3 + .6 * sr(i, 21); if (ag < 0) continue;
    const u = Math.min(1, ag / dur), x1 = PAPER_X[i], x0 = lerp(30, 450, sr(i, 22)), y0 = 640 + 260 * sr(i, 23), x = lerp(x0, x1, u) + 26 * Math.sin(ag * 5 + i) * (1 - u), y = lerp(y0, 1150 + 70 * sr(i, 25) - (layer === 'back' ? 40 : 0), 1 - (1 - u) * (1 - u));
    const rot = (sr(i, 26) - .5) * 2.4 + Math.sin(ag * 6 + i) * .6 * (1 - u), sq = .35 + .65 * Math.abs(Math.cos(ag * 7 + i) * (1 - u) + u);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, sq); ctx.fillStyle = '#fbfaf2'; ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 1.6; ctx.fillRect(-22, -28, 44, 56); ctx.strokeRect(-22, -28, 44, 56);
    ctx.fillStyle = 'rgba(60,70,100,.4)'; for (let j = 0; j < 5; j++) ctx.fillRect(-16, -20 + j * 10, 30 - (j % 2) * 8, 3); ctx.restore();
  }
}

// ------------------------------------------------------------------ the frame: camera, world, grade, HUD
let FR = null, CAMM = null, BOXES = {};
function camC(lt) {
  const sh = shotAt(lt), C = { radish: window.A21 && A21.radish ? radishOpts(lt) : null, onion: window.A15 && A15.onion ? onionOpts(lt) : null };
  if (sh.k === 'face' && !C[sh.foc]) { zoomTo(540, 960, 1); FR = { sh, C }; return; }
  const c = camOf(lt, sh, C);
  zoomTo(c.x, c.y, c.z);
  CAM.x += 1.8 * hnoise(lt, 1.2, 1); CAM.y += 1.4 * hnoise(lt, 1.0, 2); CAM.r = .001 * hnoise(lt, .8, 3);
  if (sh.k === 'aval') CAM.shake = 6 * Math.exp(-Math.max(0, lt - CUE.closetopen) * 6) * (lt >= CUE.closetopen ? 1 : 0) + 4 * Math.exp(-Math.max(0, lt - CUE.binderavalanche - .3) * 2.2) * (lt >= CUE.binderavalanche ? 1 : 0) + 2.5 * Math.exp(-Math.max(0, lt - 7.71) * 9) * (lt >= 7.71 ? 1 : 0);
  if (isPov(sh)) CAM.shake = .8;
  FR = { sh, C };
}
function drawC(lt) {
  const { sh, C } = FR, pov = isPov(sh);
  V2.setLight({ key: [-.35, -.7], keyColor: '#fff1dc', keyA: .22, rim: '#ffe6c0', rimA: .26, shadow: '#3a2a20', shadowA: .26, bounce: '#ffe0b0', bounceA: .1, amb: '#fff2de', ambA: .06, frontDark: .02 }); V2.opts.reflect = false;
  setCeiling(lt); setWall(lt); setFloor(lt);
  shadowAt(250, FY, 520, .3 * ss(lt, 5.9, 6.8));                       /* the heap's soft shadow on the floor */
  HEROMODE = !!sh.hero && sh.id === 'open';
  closetBack(lt);
  drawBinders(lt, 'closet');
  drawBinders(lt, 'back');
  closetDoor(lt, -1); closetDoor(lt, 1);
  closetPlate(lt);
  HEROMODE = !!sh.hero && sh.k === 'door';
  const ajar = bDoorAng(lt) > .01, thermK = sh.k === 'pov' ? ss(lt, 13.25, 13.6) : sh.k === 'pov2' ? 1 : 0;
  brendaDoor(lt, { inside: ajar && !pov ? () => brendaInside(lt) : null, hero: HEROMODE && !ajar });
  HEROMODE = false;
  BOXES = { san: sanitizer(lt), cart: crashCart(lt).box, fridge: medFridge(lt), counter: counter(lt) };
  /* the cast (not in his own point of view): only what is wholly in the frame, or leaving it on purpose */
  if (!pov) {
    for (const n of ['radish', 'onion']) {
      const o = C[n]; if (!o) continue;
      const f = n === 'radish' && lt >= T_BURY ? inBox([RAD.x - 220, 820, RAD.x + 140, 1190]) : inFrame(o, 10);
      if (sh.foc === n || f.whole || (o.transit && f.inter)) drawChar(o);
    }
  }
  papers(lt, 'back');
  drawBinders(lt, 'front', { skipPluck: lt >= T_B74 });
  dust(lt); papers(lt, 'front');
  if (pov) {
    /* the scanner's view: desaturated, cyan, the blacks lifted to teal (not in the text gate's mask pass: a grade is not an object), then the heat it sees through her door */
    if (!(window.TXA && TXA.mask)) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = .85; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 1; ctx.fillStyle = '#a6eef6'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(0,70,90,.32)'; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    thermal(lt, thermK);
  }
  CAMM = ctx.getTransform();
}
/* the HUD of his scanner (his point of view only): the frame, the sweep, the reticles that ride the camera (drawn through the camera matrix saved by draw), the lock, the stamp */
const RET = [
  { key: 'pitcher', t0: CUE.beep1, label: 'LABELED' },
  { key: 'fridge', t0: snapT(12.726), label: 'TEMP LOG OK' },
  { key: 'san', t0: CUE.beep2, label: 'SANITIZER FULL' },
  { key: 'cart', t0: snapT(13.226), label: 'CRASH CART SEALED' },
];
function boxFor(key) {
  if (key === 'pitcher') return BOXES.counter && BOXES.counter.pitcher;
  if (key === 'fridge') { const f = BOXES.fridge; return f && [Math.min(f.thermo[0], f.log[0]), f.thermo[1], Math.max(f.thermo[2], f.log[2]), f.log[3]]; }
  return BOXES[key];
}
function overC(lt) {
  const { sh } = FR || {}; if (!sh || !isPov(sh) || !window.H21 || !CAMM) return;
  const mode = sh.k === 'pov2' ? 'deficiency' : lt >= CUE.scanlock ? 'lock' : 'scan';
  H21.hudFrame(ctx, { t: lt, mode, count: sh.k === 'pov2' ? 1 : 0, alpha: sh.k === 'pov' ? ss(lt, 12.28, 12.45) : 1 });
  if (sh.k === 'pov') H21.scan(ctx, { t: lt, t0: 12.30, dur: 1.0, dir: 'down', alpha: .9 });
  ctx.save(); ctx.setTransform(CAMM);
  const m = CAMM, sx = x => m.a * x + m.e, sz = m.a;
  if (sh.k === 'pov') for (const r of RET) {
    const b = boxFor(r.key); if (!b || lt < r.t0 - .02) continue;
    const cx = (b[0] + b[2]) / 2, w = UI.sizeOf(r.label, { size: 32 }).w, X = sx(cx), half = Math.max(w / 2 + 30, (b[2] - b[0]) * sz / 2 + 26);
    const al = Math.min(1, (W - 50 - (X + half)) / 70, (X - half - 50) / 70) * (1 - ss(lt, CUE.scanlock - .1, CUE.scanlock + .25));
    if (al < .55) continue;
    H21.reticle(ctx, { x: cx, y: (b[1] + b[3]) / 2, w: b[2] - b[0] + 16, h: b[3] - b[1] + 16, t: lt, t0: r.t0, label: r.label, alpha: al, id: 'ret_' + r.key });
  }
  const D = DOOR, dX = sx(D.cx);
  if ((sh.k === 'pov' && lt >= CUE.scanlock - .45) || sh.k === 'pov2') {
    const t0 = sh.k === 'pov2' ? sh.s - .6 : CUE.scanlock - .55;   /* the red reticle closes on the door and locks on the cue */
    if (Math.abs(dX - 540) < 300) H21.reticle(ctx, { x: D.cx, y: 1060, w: D.x1 - D.x0 - 30, h: 380, t: lt, t0, color: H21.RED, label: sh.k === 'pov2' ? 'BRENDA' : 'UNKNOWN', sub: sh.k === 'pov2' ? 'ON BREAK SINCE 2019' : undefined, id: 'ret_door' });
  }
  ctx.restore();
  if (sh.k === 'pov2') H21.stamp(ctx, { x: 540, y: 1060, s: 1.15, rot: -.1, text: 'DEFICIENCY', t: lt, t0: snapT(23.88), id: 'stamp_def' });
}
const SCENE = {
  shot: lt => shotAt(lt).id,
  cam: camC,
  draw: drawC,
  fx: lt => isPov(shotAt(lt)) ? { bloom: .45, vignette: .12, grain: .05, contrast: .08, sat: 0, tint: [] } : { bloom: .34, vignette: .28, grain: .04, contrast: .08, sat: .08, tint: [['#ffd7a0', .05, 'soft-light']] },
  blur: lt => { const sh = shotAt(lt); if (lt - sh.s < .034) return 1; if (sh.k === 'aval' && lt > 5.42 && lt < 7.0) return 3; return 1; },
  over: overC,
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP21_SCENES = window.__EP21_SCENES || {}; window.__EP21_SCENES.closet = SCENE;
})();
