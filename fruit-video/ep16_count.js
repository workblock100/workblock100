'use strict';
/* SHIFT HAPPENS, Episode 16: "The Vote". Scene module: count (7:30 PM, THE COUNT, 23.79 s). Builder E1617-COUNT. Registers window.__EP16_SCENES.count.
 *
 * The break room, one table, two cameras (the same device as ep15_announce.js: ROOM coordinates xr right / y up / zr toward the TV wall, mapped through the shot's direction):
 *   'f' = from behind the main cast looking at the TV wall (the chart on the rolling TV, Tomato beside it, the four ballot sorters across the table face us, the cast's backs);
 *   'r' = from the TV end looking back (the cast's faces, the rear wall with the double doors; the forty Strawberries pop in behind them: Fill Down, Episode 15).
 * The table: Mango, Lemon, Onion (clicker, ballots), Strawberry on the far side facing the TV; four sorters on the near side; a laptop at the middle (Binder, crowned, rises out of it on "Binder.").
 * Shots (scene-local seconds): w0 0 wide f | hands 1.0 Onion counting (r) | tv1 2.12 chart surges to 48 (f) | lem1 3.41 Lemon (r) | nine 4.10 pan across nine heads, numbers (f) | rev 5.60 crane up, the crowd pops (r)
 *  | st1 7.59 Strawberry (r) | on1 8.50 Onion (r) | crowd 10.0 the crowd blinks in unison, Onion sobs (r wide) | tv2 10.9 PENDING bar blips to 1 (f) | bal 12.0 her ballot (r) | tv3 12.91 VOID stamp, dialog (f)
 *  | on2 14.1 Onion (r) | tom3 15.64 Tomato, INCUMBENT line (f) | man 17.69 Mango (r) | turn 18.98 Binder rises, everyone turns (f) | st2 19.98 Strawberry (r) | bnd 21.55 Binder, the grin (f) | end 22.94 confetti (r wide).
 * Cues: typing .3 (the TV title types in), sob 10.096 (Onion's sob, the crowd blinks), dialog 12.914 (VOID stamp slams, dialog pops), grin 22.749 (Binder's grin, confetti), sting 22.94 (flash, glint, cut to the wide). */
(() => {
if (!window.TIMELINE_EP16 || !window.H6 || !window.S6 || !window.V2 || !window.A15) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, SH15 = window.SH15, S6 = window.S6, PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP16, SCN = TLX.scenes.find(s => s.id === 'count'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'count') LN[l.id] = l;
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
const CUE = { typing: .3, sob: 10.096, dialog: 12.914, grin: 22.749, sting: 22.94 };
for (const k in CUE) CUE[k] = Math.round((START + CUE[k]) * 30) / 30 - START;   /* the picture hits the video frame nearest each sound cue */

// ------------------------------------------------------------------ the room: ROOM coordinates (xr right when facing the TV, y up, zr toward the TV wall) mapped through the shot's direction
const RM = { hw: 900, ch: 900, zTV: 1500, zRear: -1100, rail: 150 };
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
  if (Math.min(zs[0], zs[1]) < V2.P.cz + 100) return;   /* a box behind the lens would project to garbage */
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
const ROOMC = { wall: '#efe3c8', wain: '#b86f4a', floorA: '#cdbf9f', floorB: '#a69677', ceil: '#efe9dd', fog: '#bba98a' };
function shell(lt) {
  const far = D.dir === 'f' ? RM.zTV : RM.zTV - RM.zRear;
  S6.shell({ zb: far, hw: RM.hw, ch: RM.ch, rail: RM.rail, wall: ROOMC.wall, wain: ROOMC.wain, floorA: ROOMC.floorA, floorB: ROOMC.floorB, ceil: ROOMC.ceil, fog: ROOMC.fog, fogAmt: .2, tile: 150, bright: .98 });
  const zs = D.dir === 'f' ? [-100, 360, 820, 1280] : [140, 600, 1060, 1520, 1980];
  for (const X of [-300, 300]) for (const Z of zs) if (Z > V2.P.cz + 260) S6.ceilingLamp(X, Z, RM.ch, 1, '255,240,208', 110, 190);
}
/* the side walls: a counter with a microwave and a fridge on the left, a vending machine and a bulletin board on the right (dressing, drawn before the table and the cast) */
function sides(lt) {
  const steel = { color: '#d9ccb0', top: '#7a6a58', front: '#c9bb9d', side: '#a89a7e', lw: 1.6 };
  boxR(-900, -740, 0, 196, -420, 470, steel);
  boxR(-880, -770, 196, 290, 40, 250, { color: '#d5d9de', front: '#e6e9ed', side: '#a9b0b8', top: '#f0f2f4', lw: 1.6 });
  boxR(-900, -770, 0, 560, 560, 780, { color: '#e9eef2', front: '#f4f7fa', side: '#c9d2d9', top: '#ffffff', lw: 1.6 });
  boxR(740, 900, 0, 520, 420, 620, { color: '#2f5fb0', front: '#3a6fc4', side: '#244a8a', top: '#4a7fd4', lw: 1.6 });
  wallR(1, 250, 470, -380, -120, '#b98a5a', 'rgba(25,16,30,.7)', 3);
  for (const [z, y, c] of [[-340, 400, '#fff3a6'], [-260, 330, '#ffb3c6'], [-190, 410, '#bfe3ff'], [-160, 300, '#d8ffb0']]) wallR(1, y, y + 54, z - 34, z + 34, c, 'rgba(25,16,30,.35)', 1.4);
}
/* the TV wall (f): a corkboard with the election flyer, the clock, a plant */
function tvWall(lt) {
  const z = RM.zTV - 4;
  flatR(486, 846, 300, 620, z, '#7a5a3c', 'rgba(25,16,30,.6)', 2, 6);
  flatR(500, 832, 314, 606, z, '#c9a06a', 'rgba(40,24,16,.5)', 1.5, 4);
  const notes = [[520, 480, 640, 580, '#ffffff', '#d6202e'], [660, 500, 800, 590, '#fff6d8', '#2a5ac8'], [530, 340, 650, 450, '#e9f5ff', '#3a9a5a'], [690, 350, 810, 460, '#fff0f0', '#e8852a']];
  notes.forEach(([a, b, c, d, f, hi]) => { flatR(a, c, b, d, z, f, 'rgba(60,40,20,.45)', 1, 2); flatR(a + 3, c - 3, d - 14, d - 3, z, hi, null, 0); for (let j = 0; j < 3; j++) polyR([[a + 10, b + 14 + j * 15, z], [c - 12, b + 14 + j * 15, z], [c - 12, b + 16 + j * 15, z], [a + 10, b + 16 + j * 15, z]], 'rgba(40,40,60,.38)'); });
  dress('VOTE TODAY', 666, 650, z, { size: 34, fill: '#fff6d8', stroke: '#5a3a22', lw: 5 });
  { const k = kAt(z); if (k * 46 > 6) S6.wallClock(mapX(-640), 740, z - 2, 1, 30, 7, 46); }
  S6.plant3(mapX(-800), z - 60, 1.2);
}
/* the rear wall (r): double doors with wired glass (the right leaf swings in at the reveal, a bright hall behind), EXIT sign, extinguisher */
function rearWall(lt, open) {
  const z = RM.zRear + 4;
  flatR(-262, 262, 0, 478, z, '#c9a06a', 'rgba(25,16,30,.6)', 3, 4);
  const hall = flatR(6, 250, 8, 470, z, '#fff0c8', null, 0);
  if (open > .02) { const [gx, gy] = P(128, 240, z); V2.glow(gx, gy, 420 * kAt(z), '255,236,180', .5 * open, 'screen', .5); }
  flatR(-250, -6, 8, 470, z, '#d8b27c', 'rgba(25,16,30,.5)', 2, 3); flatR(-190, -66, 250, 420, z, '#9fc1c6', 'rgba(25,16,30,.5)', 2, 3);
  if (open < .98) { const a = open * 1.25, hx = 250, ex = hx - 244 * Math.cos(a), ez = z + 244 * Math.sin(a);
    polyR([[hx, 8, z], [hx, 470, z], [ex, 470, ez], [ex, 8, ez]], lit('#d8b27c', .9 - .15 * open), 'rgba(25,16,30,.55)', 2); }
  flatR(-80, 80, 540, 600, z, '#1f8a4a', 'rgba(10,40,20,.8)', 2.5, 6); dress('EXIT', 0, 570, z, { size: 40, fill: '#eafff0' });
  flatR(-560, -510, 40, 210, z, '#c43a2a', 'rgba(60,10,10,.8)', 2, 8);
  flatR(420, 520, 220, 330, z, '#e8ecef', 'rgba(25,16,30,.5)', 2, 6);
}
const lit = (c, f) => S6.lit(c, f);

// ------------------------------------------------------------------ the rolling TV cart (f): the screen's rectangle is returned for the chart to paint
const TVG = { cx: 0, bot: 262, w: 720, h: 405, bez: 26 };
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
  { const [lx, ly] = P(cx, y1 + bz + 10, z - 17); ctx.fillStyle = '#16181e'; ell(lx, ly, 8 * k, 8 * k); ctx.fill(); ctx.fillStyle = '#5a6ad8'; ell(lx, ly, 3.5 * k, 3.5 * k); ctx.fill(); }
  if (paint) paint(scr);
  return scr;
}

// ------------------------------------------------------------------ the tally: the chart's numbers (a pure function of scene-local time)
const T_SURGE = wS('t1', 1) - .02, T_PEND = wS('t2', 1) + .02;      /* "forty-eight." starts the surge, "one." blips the PENDING bar */
function tally(lt) {
  let b = 0;
  if (lt >= 1.0) b = Math.floor(key([[1.0, 0], [2.1, 15]], lt, k => k));
  if (lt >= T_SURGE) b = Math.round(lerp(15, 48, eo(sg(lt, T_SURGE, T_SURGE + .55))));
  return { b, p: lt >= T_PEND ? 1 : 0, surge: sg(lt, T_SURGE, T_SURGE + .55) };
}

// ------------------------------------------------------------------ the table, its paper and the clear box
const LAPX = -20;
let NOLAP = false;
const TB = { x0: -640, x1: 640, z0: 230, z1: 400, h: 174, top: 190 };
function tableDraw(lt) {
  const leg = { color: '#6a5a4a', top: '#8a7a68', front: '#5a4a3c', side: '#4a3c30', lw: 1 };
  for (const sx of [0, 1]) for (const sz of [0, 1]) boxR(sx ? TB.x1 - 54 : TB.x0 + 30, sx ? TB.x1 - 30 : TB.x0 + 54, 0, TB.h, sz ? TB.z1 - 40 : TB.z0 + 16, sz ? TB.z1 - 16 : TB.z0 + 40, leg);
  boxR(TB.x0, TB.x1, TB.h, TB.top, TB.z0, TB.z1, { color: '#c9a06a', top: '#e8c58f', front: '#b08850', side: '#9a7440', lw: 2 });
}
const PAPER = { color: '#f1eee4', top: '#ffffff', front: '#ece8da', side: '#d3cfc0', lw: 1.4 };
const PILES = [[80, 240, 262, 350, 40], [300, 400, 262, 330, 24], [-300, -190, 330, 380, 30], [230, 330, 336, 386, 26], [-540, -450, 276, 340, 16], [520, 590, 300, 360, 14]];
function tableItems(lt) {
  for (const [x0, x1, z0, z1, h] of PILES) { boxR(x0, x1, TB.top, TB.top + h, z0, z1, PAPER); for (let j = 1; j < 4; j++) { const y = TB.top + h * j / 4; polyR([[x0, y, z0], [x1, y, z0], [x1, y + .8, z0], [x0, y + .8, z0]], 'rgba(60,50,40,.28)'); } }
  /* the clear box, emptied and lying on its side: translucent acrylic, a slot on top, a few stray ballots inside */
  { const x0 = -610, x1 = -430, z0 = 270, z1 = 388, h = 104, b = { color: 'rgba(205,232,255,.30)', top: 'rgba(225,242,255,.45)', front: 'rgba(185,218,246,.26)', side: 'rgba(170,206,236,.34)', edge: 'rgba(110,160,205,.95)', lw: 2.2 };
    boxR(x0 + 20, x1 - 20, TB.top + 2, TB.top + 12, z0 + 24, z1 - 24, PAPER);
    boxR(x0, x1, TB.top, TB.top + h, z0, z1, b);
    polyR([[x0 + 60, TB.top + h + .5, z0 + 56], [x1 - 60, TB.top + h + .5, z0 + 56], [x1 - 60, TB.top + h + .5, z0 + 70], [x0 + 60, TB.top + h + .5, z0 + 70]], '#1c2230'); }
  /* the laptop at the middle of the table (its back to the TV end, its screen to the cast); left out of the close-ups, where it would sit between the lens and the face */
  if (!NOLAP) { const [lx, ly] = P(LAPX, TB.top, 336), k = kAt(336); A15.laptop(lx, ly, { lapScale: k * 1.5, lapBack: D.dir === 'r', lapScreen: true, rot: 0 }); }
}
/* the ballots Onion flicks onto the counted pile while she counts (1.0 to 2.2) */
function flicks(lt) {
  if (lt < .98 || lt > 2.6) return;
  for (let i = 0; i < 15; i++) {
    const t0 = 1.0 + i * .078, a = (lt - t0) / .2;
    if (a < 0 || a > 1) continue;
    const xr = lerp(160, 350, a) + (hash(i) - .5) * 24, zr = 302 + (hash(i + 3) - .5) * 40, y = TB.top + 40 + Math.sin(a * PI) * 46;
    const [x, yy] = P(xr, y, zr), k = kAt(zr), w = 64 * k, h = 84 * k * (.45 + .55 * Math.abs(Math.cos(a * 5 + i))), rot = (hash(i + 7) - .5) * 1.4 + a * 2.2;
    ctx.save(); ctx.translate(x, yy); ctx.rotate(rot); ctx.fillStyle = '#fbfaf5'; ctx.strokeStyle = 'rgba(40,30,20,.55)'; ctx.lineWidth = Math.max(1.4, 2 * k); rr(-w / 2, -h / 2, w, h, 2 * k); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}

// ------------------------------------------------------------------ held props: the tally clicker, the ballot (hand-written PENDING), the ballot stub, a pen; Binder's paper crown
EXT.prop.fp16_clicker = (side, o, t) => {
  const n = o.clickN | 0, press = o.clickPress || 0;
  ctx.save(); ctx.translate(0, -6); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = lg(-30, -50, 30, 20, [[0, '#e6e9ef'], [.5, '#9aa3b2'], [1, '#5d6574']]); ctx.strokeStyle = 'rgba(14,16,24,.9)'; ctx.lineWidth = 3;
  rr(-30, -56, 60, 74, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#10161b'; rr(-23, -48, 46, 24, 5); ctx.fill();
  ctx.fillStyle = '#b8f0c8'; UI.label(String(n).padStart(4, '0'), 0, -36, { size: 17, weight: 900, fill: '#9bffb4', hero: false, crop: true, tilt: 1.3 });
  ctx.fillStyle = lg(0, -64 + press * 6, 0, -50, [[0, '#ff6a5a'], [1, '#c2281c']]); ctx.strokeStyle = 'rgba(40,6,6,.9)'; ctx.lineWidth = 2.6; ell(0, -60 + press * 7, 15, 8 - press * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-24, -22, 10, 36, 5); ctx.fill();
  ctx.restore();
};
PROP_BOX.fp16_clicker = [-34, -74, 34, 14];
EXT.prop.fp16_ballot = (side, o, t) => {
  ctx.save(); ctx.rotate(o.ballotRot ?? -.05); ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#fdfcf6'; ctx.strokeStyle = 'rgba(40,36,30,.75)'; ctx.lineWidth = 2.6; rr(-62, -170, 124, 160, 4); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  UI.label('BALLOT', 0, -148, { size: 22, weight: 900, fill: '#22304a', hero: false, crop: true, tilt: 1.2 });
  ctx.strokeStyle = '#22304a'; ctx.lineWidth = 2; ctx.strokeRect(-46, -122, 18, 18);
  UI.label('BINDER', -14, -113, { size: 17, weight: 800, fill: '#5a6070', hero: false, crop: true, tilt: 1.2, align: 'left' });
  UI.label('WRITE-IN:', -50, -80, { size: 13, weight: 800, fill: '#7a7f8c', hero: false, crop: true, tilt: 1.2, align: 'left' });
  ctx.strokeStyle = 'rgba(30,50,120,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-50, -40); ctx.lineTo(50, -40); ctx.stroke();
  UI.label('PENDING', 0, -50, { size: 25, font: 'Lucky', weight: 400, fill: '#1c3fb8', hero: false, crop: true, tilt: 1.2 });
  ctx.restore();
};
PROP_BOX.fp16_ballot = [-66, -176, 66, -4];
EXT.prop.fp16_stub = (side, o, t) => {
  ctx.save(); ctx.rotate(-.12); ctx.fillStyle = '#fdfcf6'; ctx.strokeStyle = 'rgba(40,36,30,.7)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-20, -52); ctx.lineTo(20, -52); ctx.lineTo(20, 0); for (let i = 0; i < 5; i++) ctx.lineTo(20 - (i + .5) * 8, i % 2 ? -4 : 3); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,70,110,.45)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-12, -40 + i * 12); ctx.lineTo(12 - (i % 2) * 8, -40 + i * 12); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp16_stub = [-24, -56, 24, 8];
EXT.prop.fp16_pen = (side, o, t) => {
  ctx.save(); ctx.rotate(o.penRot ?? .9); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(10,14,40,.9)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, -34); ctx.stroke();
  ctx.strokeStyle = '#2a58d8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(0, -34); ctx.stroke();
  ctx.strokeStyle = '#f2f2f6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, -44); ctx.stroke();
  ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.moveTo(-3.5, 22); ctx.lineTo(3.5, 22); ctx.lineTo(0, 34); ctx.closePath(); ctx.fill();
  ctx.restore();
};
PROP_BOX.fp16_pen = [-14, -48, 14, 38];
EXT.acc.fp16_crown = (o, k, t, layer) => {   /* Binder's tiny paper crown, on the top edge of the clip (local y -92) */
  if (layer !== 'front') return;
  const g = c01(o.crownK ?? 1); if (g <= 0) return;
  ctx.save(); ctx.translate(0, -90); ctx.scale(g, g); ctx.rotate(Math.sin(t * 1.4) * .03); ctx.lineJoin = 'round';
  const pts = [[-58, 0], [-58, -34], [-30, -14], [-14, -52], [8, -16], [30, -50], [44, -14], [58, -34], [58, 0]];
  ctx.fillStyle = lg(-58, -52, 58, 0, [[0, '#ffe66a'], [1, '#f1b400']]); ctx.strokeStyle = 'rgba(70,40,0,.95)'; ctx.lineWidth = 3.4;
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d6202e'; ell(-14, -14, 5.5, 5.5); ctx.fill(); ctx.fillStyle = '#2a5ac8'; ell(30, -14, 5.5, 5.5); ctx.fill(); ctx.fillStyle = '#fff'; ell(8, -8, 4, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-52, -30, 20, 4);
  ctx.restore();
};

// ------------------------------------------------------------------ the forty unassigned Strawberries (Fill Down, Episode 15): cached sprites (3 yaws x open/closed eyes x 2 sizes), popped in rows behind the cast
const T_POP = wS('o2', 2) - .08;                                       /* "forty" */
const T_TAGS = wS('o2', 4) - .02;                                      /* "unassigned" */
const CR_ROWS = [[-240, 8], [-430, 8], [-620, 8], [-810, 8], [-980, 8]];
const CS = .8;
const CROWD = (() => {
  const list = [];
  CR_ROWS.forEach(([zr, n], r) => { for (let i = 0; i < n; i++) { const u = (i + .5 + (r % 2 ? .24 : -.24)) / n, h = hash(r * 9 + i * 1.7 + 3); list.push({ xr: lerp(-720, 720, c01(u)) + (hash(r * 31 + i * 7.3) - .5) * 36, zr: zr + (hash(r * 5 + i * 2.1) - .5) * 50, yaw: h < .5 ? 0 : h < .75 ? 1 : 2, ph: hash(i * 3.1 + r) * TAU, per: 2.7 + hash(i + r * 7) * 2.4, r, i }); } });
  list.forEach((c, k) => { c.id = k; c.pop = T_POP + c.r * .085 + hash(k * 1.3) * .1; });
  return list;
})();
const SPR = new Map(), YAWS = [0, .6, -.6], SP_W = 400, SP_H = 470, SP_FX = 200, SP_FY = 452;
function cloneSprite(yawIdx, lid, lod) {
  const key = yawIdx + '|' + lid + '|' + lod; let sp = SPR.get(key); if (sp) return sp;
  const s0 = lod ? .4 : .72, cv = document.createElement('canvas'); cv.width = Math.ceil(SP_W * s0); cv.height = Math.ceil(SP_H * s0); cv.__txOK = true;
  const g = cv.getContext('2d'), prev = ctx, A = A11 || A7;
  ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  REG.suppress++;
  try {
    drawChar(A.straw({ x: SP_FX * s0, y: SP_FY * s0, s: s0, t: 0, yaw: YAWS[yawIdx], headYaw: YAWS[yawIdx], noBob: true, noShadow: true, noReflect: true, who: undefined, look: [yawIdx === 1 ? .3 : yawIdx === 2 ? -.3 : 0, .05],
      expr: 'neutral', lid: lid ? .95 : undefined, arms: { l: 'rest', r: 'hold' }, grip: { r: [86, 30] }, hold: { r: 'fp16_stub' } }));
  } finally { REG.suppress--; ctx = prev; }
  SPR.set(key, cv); return cv;
}
const blinkAt = (lt, c) => (lt >= CUE.sob && lt < CUE.sob + .2) || (((lt + c.ph * 3) % c.per) / c.per < .04 && !(lt > CUE.sob - .8 && lt < CUE.sob + .3));
function star4(x, y, r, rot, fill, a = 1) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = fill; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const an = i * PI / 4, R = i % 2 ? r * .3 : r; ctx.lineTo(Math.cos(an) * R, Math.sin(an) * R); } ctx.closePath(); ctx.fill(); ctx.restore();
}
function ripple(x, y, a, R, lw = 4, dur = .45) { if (a < 0 || a > dur) return; const f = a / dur; ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.9 * (1 - f)})`; ctx.lineWidth = lw * (1 - f * .6); ctx.beginPath(); ctx.arc(x, y, R * (1 - (1 - f) * (1 - f)), 0, TAU); ctx.stroke(); ctx.restore(); }
function drawCrowd(lt) {
  const vis = CROWD.filter(c => lt >= c.pop).sort((a, b) => mapZ(b.zr) - mapZ(a.zr));
  const prevS = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (const c of vis) {
    const X = mapX(c.xr), Z = mapZ(c.zr), q = V2.at(X, Z), age = lt - c.pop, sc = q.s * CS, pop = age < .26 ? eb(age / .26) : 1, hop = age < .26 ? -Math.sin(PI * c01(age / .26)) * 30 * sc : 0;
    if (pop <= .01) continue;
    const lod = sc < .3 ? 1 : 0, spr = cloneSprite(c.yaw, blinkAt(lt, c) ? 1 : 0, lod), br = Math.sin(lt * 2.2 + c.ph), kx = sc * pop * (1 + .004 * br), ky = sc * pop * (1 - .007 * br);
    ctx.fillStyle = 'rgba(30,24,40,.24)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 3 * sc, 112 * sc * pop, 14 * sc * pop, 0, 0, TAU); ctx.fill();
    ctx.drawImage(spr, q.x - SP_FX * kx, q.y - SP_FY * ky + hop, SP_W * kx, SP_H * ky);
    if (age >= 0 && age < .5) { ripple(q.x, q.y - 6 * sc, age, 90 * sc, 4 * sc + 1, .4); star4(q.x + 70 * sc, q.y - 250 * sc * (age / .5 + .3), 14 * sc, age * 8, '#ffe135', 1 - age / .5); star4(q.x - 80 * sc, q.y - 200 * sc * (age / .5 + .3), 11 * sc, -age * 7, '#ffffff', 1 - age / .5); }
  }
  ctx.imageSmoothingEnabled = prevS;
}
/* the UNASSIGNED tags over their heads (live text, dressing): amber pills, no two overlap (each is sized from the spacing of its row) */
function drawTags(lt) {
  if (lt < T_TAGS) return;
  for (const c of CROWD) {
    const u = c01((lt - T_TAGS - c.r * .05 - hash(c.id * 2.3) * .08) / .22); if (u <= 0) continue;
    const q = V2.at(mapX(c.xr), mapZ(c.zr)), sc = q.s * CS, size = Math.min(36 * sc, 185 * q.s * .8 / 7.6), x = q.x, y = q.y - 425 * sc, w = UI.sizeOf('UNASSIGNED', { size, weight: 900 }).w + size * .9, pop = eb(u);
    if (size < 6) continue;
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop); ctx.translate(-x, -y);
    UI.panel([x - w / 2, y - size * .78, w, size * 1.56], { id: 'ctag' + c.id, kind: 'tag', fill: '#ffbf1f', stroke: 'rgba(30,20,30,.85)', lw: Math.max(1, size * .08), r: size * .45, pad: 0, shadow: 0, hero: false, crop: true });
    UI.label('UNASSIGNED', x, y, { size: size * .74, fill: '#22262b', hero: false, crop: true, grp: 'un', cid: 'ctag' + c.id, maxW: w - size * .4 });
    ctx.restore();
  }
}

// ------------------------------------------------------------------ the cast: seats, turns, acting
const SEAT_Y = 128;
const SEATS = { mango: [-330, 130, 1], lemon: [-110, 130, 1], onion: [110, 130, 1], straw: [330, 130, 1], e1: [-720, 700, 1], e2: [-620, 940, 1], e3: [720, 700, 1], e4: [620, 940, 1], tom: [-560, 1330, -1] };
const EXTRA = { e1: { kind: 'pine', acc: ['lanyard7'], seed: 31 }, e2: { kind: 'kiwi', acc: ['badge7'], seed: 47 }, e3: { kind: 'apple', acc: ['lanyard7'], seed: 53 }, e4: { kind: 'grape', acc: ['badge7'], seed: 61 } };
const CTOR = { mango: o => A7.mango(o), lemon: o => A7.lemon(o), onion: o => A15.onion(o), straw: o => A11.straw(o), tom: o => A15.tomato(o) };
const ACT = {};
function exprAt(list, lt) { let r = list[0][1]; for (const [t, e] of list) if (lt >= t) r = e; return r; }
function person(name, lt) {
  const [xr, zr, face] = SEATS[name], a = (window.__ACTOFF ? null : ACT[name] ? ACT[name](lt) : null) || {}, stand = name === 'tom' || name[0] === 'e';
  const toCam = (face > 0) === (D.dir === 'r'), X = mapX(xr), Z = mapZ(zr), q = V2.at(X, Z), y = stand ? q.y : V2.p2(X, SEAT_Y, Z)[1];
  const turn = p => toCam ? (D.dir === 'f' ? p : -p) : PI - (D.dir === 'f' ? p : -p);
  const o = Object.assign({ x: q.x, y, s: q.s * (a.k ?? (stand ? .92 : .86)), t: lt, expr: 'neutral', arms: { l: 'hold', r: 'hold' }, grip: toCam ? { l: [-26, 14], r: [26, 14] } : { l: [26, 14], r: [-26, 14] } },
    stand ? {} : { noLegs: true, noShadow: true, noReflect: true, plant: true }, EXTRA[name] ? Object.assign({ id: name }, EXTRA[name]) : {}, a.o || {});
  o.yaw = turn(a.psiB ?? 0); o.headYaw = turn(a.psiH ?? a.psiB ?? 0);
  if (a.look) o.look = a.look; if (a.expr) o.expr = a.expr; if (a.lid !== undefined) o.lid = a.lid;
  if (a.dx) o.x += a.dx * o.s; if (a.dy) o.y += a.dy * o.s;
  return CTOR[name] ? CTOR[name](o) : o;
}
const TURN = (lt, a, dir, d = .55) => dir * ss(lt, a, a + d);              /* a slow turn toward +xr (dir +1) or -xr (-1) that starts at a */
const T_TURN = bS('o5') + .1;                                               /* "Binder." everyone turns to the laptop */
const sobK = lt => lt < CUE.sob ? .1 : Math.max(.14, Math.exp(-(lt - CUE.sob) / .42));
ACT.onion = lt => {
  const c = Math.floor(tally(lt).b + tally(lt).p), flick = lt > 1.0 && lt < 2.3 ? Math.sin(lt * 17) : lt > 2.3 && lt < 5.5 ? Math.sin(lt * 5) * .35 : 0;
  const psiH = lt < T_TURN ? key([[0, 0], [5.4, 0], [5.9, .15], [8.4, 0], [9.5, .2], [12, 0]], lt) : TURN(lt, T_TURN, -.75);
  return { psiB: lt < T_TURN ? 0 : TURN(lt, T_TURN, -.5), psiH, look: lt < T_TURN ? [lt < 5.5 ? .05 : 0, lt < 5.5 ? .5 : .1] : [-.6, .1], expr: 'onion_cry',
    o: { sob: sobK(lt), arms: { l: 'hold', r: 'hold' }, grip: { l: [-62 + 16 * flick, 64 - 14 * Math.abs(flick)], r: [112, 74] }, hold: window.__noHold ? undefined : { r: 'fp16_clicker' }, clickN: c, clickPress: lt > 1 && lt < 2.3 ? Math.max(0, Math.sin(lt * 17 + 1.4)) : 0 } };
};
ACT.lemon = lt => {
  const psiH = lt < T_TURN ? key([[0, 0], [3.9, 0], [4.1, -.5], [4.45, .5], [4.8, -.3], [5.2, 0]], lt) : TURN(lt, T_TURN, .7);
  return { psiB: lt < T_TURN ? 0 : TURN(lt, T_TURN, .45), psiH, expr: exprAt([[0, 'neutral'], [3.3, 'shock'], [4.1, 'sour'], [5.6, 'shock'], [7.2, 'sour'], [13, 'neutral']], lt), look: lt < 3.4 ? [.1, .3] : [0, 0] };
};
ACT.mango = lt => ({ psiB: lt < T_TURN ? 0 : TURN(lt, T_TURN, .5), psiH: lt < T_TURN ? key([[0, 0], [3.4, 0], [3.8, .35], [4.8, .35], [5.2, 0]], lt) : TURN(lt, T_TURN + .1, .8),
  expr: exprAt([[0, 'neutral'], [5.6, 'shock'], [7.4, 'neutral'], [17.4, 'sour'], [19.2, 'neutral']], lt), look: lt > 17.5 && lt < 19 ? [.3, -.1] : [0, .2] });
const T_BAL = 11.85, T_BAL_E = 13.1;
ACT.straw = lt => {
  const up = ss(lt, T_BAL, T_BAL + .35) * (1 - ss(lt, T_BAL_E, T_BAL_E + .3)), psiH = lt < T_TURN ? key([[0, 0], [7.5, 0], [7.9, -.25], [8.4, 0]], lt) : TURN(lt, T_TURN, -.9);
  return { psiB: lt < T_TURN ? 0 : TURN(lt, T_TURN, -.55), psiH, expr: exprAt([[0, 'weak'], [5.6, 'shock'], [7.6, 'weak']], lt), lid: lt > 7.5 && lt < 12 ? .35 : undefined, look: up > .5 ? [0, .5] : [0, 0],
    o: up > .02 ? { arms: { l: 'hold', r: 'hold' }, grip: { l: [-140, lerp(40, -26, up)], r: [92, lerp(40, 26, up)] }, hold: { l: 'fp16_ballot', r: 'fp16_pen' }, penRot: .7 + Math.sin(lt * 9) * .12 * up } : undefined };
};
ACT.tom = lt => ({ psiB: .35, psiH: lt > 15.6 && lt < 17.6 ? .1 : .3, expr: exprAt([[0, 'happy'], [11.9, 'neutral'], [15.5, 'happy']], lt), look: [.5, 0],
  o: { arms: { l: 'rest', r: 'rest' }, hold: {}, tomPose: lt > 12.9 ? 'veg' : 'fruit' } });
const EDIR = { e1: 1, e2: 1, e3: -1, e4: -1 };   /* the watchers along the side walls: three-quarter to the TV, heads turn to the laptop on "Binder." */
const WATCH = (id, k) => lt => { const d = EDIR[id], ph = k * 1.9, sh = lt < T_TURN ? Math.sin(lt * .8 + ph) * .1 : 0;
  return { psiB: d * .32 + (lt < T_TURN ? 0 : TURN(lt, T_TURN + k * .06, d * .35)), psiH: d * .32 + sh + (lt < T_TURN ? 0 : TURN(lt, T_TURN + k * .06, d * .55)), expr: exprAt([[0, 'neutral'], [5.6, 'shock'], [7.6, 'neutral']], lt), look: [0, 0],
    o: { arms: { l: 'rest', r: 'rest' } } }; };
ACT.e1 = WATCH('e1', 0); ACT.e2 = WATCH('e2', 1); ACT.e3 = WATCH('e3', 2); ACT.e4 = WATCH('e4', 3);

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

// ------------------------------------------------------------------ the TV picture: LIVE RESULTS, a bar chart of two bars (a 1280 x 720 window mapped onto the screen)
const T_INC = wS('t3', 6) - .05, T_GLOW = bS('o5');
const CHT = { bx0: 340, bw: 800, rows: [214, 356], bh: 92 };
function crown(x, y, s, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = 'rgba(70,40,0,.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); [[-30, 0], [-34, -30], [-16, -14], [0, -38], [16, -14], [34, -30], [30, 0]].forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function chartWin(lt) {
  const tl = tally(lt), voidK = lt >= CUE.dialog ? 1 : 0, vt = lt - CUE.dialog, glow = ss(lt, T_GLOW, T_GLOW + .5), quiet = voidK && vt < .24;
  ctx.fillStyle = lg(0, 0, 0, 720, [[0, '#0d1a2b'], [1, '#12304a']]); ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#16405e'; ctx.fillRect(0, 0, 1280, 92);
  ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 4; i++) ctx.fillRect(0, 140 + i * 140, 1280, 2);
  const tk = sg(lt, CUE.typing, CUE.typing + .6);
  tvLabel('EMPLOYEE OF THE MONTH: LIVE RESULTS', 640, 46, { size: 44, fill: '#eaf6ff', reveal: tk, maxW: 900, hero: tk >= 1 && !quiet });
  ctx.fillStyle = '#d93025'; rr(1138, 24, 100, 44, 22); ctx.fill(); ctx.fillStyle = rgba('#ffffff', .6 + .4 * Math.sin(lt * 5)); ell(1162, 46, 7, 7); ctx.fill();
  UI.label('LIVE', 1204, 46, { size: 26, fill: '#fff', hero: false, crop: true });
  const rows = [['BINDER', tl.b, ['#23b367', '#9be564'], glow], ['PENDING', tl.p, ['#ff9f1c', '#ffd36a'], 0]];
  rows.forEach(([name, v, cols, gl], i) => {
    const cy = CHT.rows[i], wBar = v > 0 ? Math.max(18, CHT.bw * v / 48) : 0;
    ctx.save(); if (voidK) ctx.globalAlpha *= lerp(1, .4, ss(vt, 0, .2));
    ctx.fillStyle = 'rgba(255,255,255,.07)'; rr(CHT.bx0, cy - CHT.bh / 2, CHT.bw, CHT.bh, 16); ctx.fill();
    if (wBar > 0) {
      ctx.save(); if (gl > 0) { ctx.shadowColor = rgba('#ffd23a', .9 * gl); ctx.shadowBlur = 50 * gl; }
      const c0 = gl > 0 ? V2.rgba(V2.mix(cols[0], '#e8b800', gl), 1) : cols[0], c1 = gl > 0 ? V2.rgba(V2.mix(cols[1], '#fff1a0', gl), 1) : cols[1];
      ctx.fillStyle = lg(CHT.bx0, 0, CHT.bx0 + wBar, 0, [[0, c0], [1, c1]]);
      rr(CHT.bx0, cy - CHT.bh / 2, wBar, CHT.bh, 16); ctx.fill(); ctx.restore();
    }
    tvLabel(name, 54, cy, { size: 56, align: 'left', fill: '#ffffff', maxW: 270, hero: !quiet });
    const settled = i === 0 ? lt >= T_SURGE + .6 : lt >= T_PEND + .4, inside = wBar > 220, nx = inside ? CHT.bx0 + wBar - 26 : CHT.bx0 + wBar + 28;
    tvLabel(String(v), nx, cy, { size: 76, align: inside ? 'right' : 'left', fill: inside ? '#06281a' : '#ffffff', hero: settled && !quiet });
    if (i === 1 && v === 1) { const a = lt - T_PEND; if (a < .5) { ctx.strokeStyle = `rgba(255,211,106,${1 - a / .5})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(CHT.bx0 + 9, cy, 20 + a * 150, 0, TAU); ctx.stroke(); } }
    if (i === 0 && gl > .3) crown(CHT.bx0 + wBar - 118, cy - CHT.bh / 2 - 6, 1.1 * eb(c01((gl - .3) / .7)));
    ctx.restore();
  });
  if (!voidK) UI.label('BALLOTS COUNTED: ' + (tl.b + tl.p), 640, 470, { size: 34, fill: '#8fb6d6', hero: false, crop: true });
  if (voidK) {   /* the VOID stamp slams on the dialog cue: big, a ring, then it sits */
    const k = c01(vt / .12), sc = lerp(2.6, 1, k * k) + .05 * Math.sin(Math.min(1, vt / .3) * PI) * (vt < .3 ? 1 : 0), cy = 282, a = 1;
    if (vt < .5) { ctx.strokeStyle = `rgba(255,120,100,${.9 * (1 - vt / .5)})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(640, cy, 60 + vt * 900, 0, TAU); ctx.stroke(); }
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(640, cy); ctx.scale(sc, sc); ctx.translate(-640, -cy);
    const sOK = vt >= .14 && TVH;
    UI.stamp('VOID', 640, cy, { size: 190, rot: -.14, color: '#e0332a', alpha: .96, hero: sOK, crop: !sOK });
    ctx.restore();
  }
  if (lt >= CUE.dialog - .034 && lt < 14.5) {
    const u = eb(sg(lt, CUE.dialog - .034, CUE.dialog + .2)), out = 1 - sg(lt, 14.2, 14.45);
    ctx.save(); ctx.globalAlpha *= out; SH15 && SH15.dialog({ kind: 'error', w: 1280, h: 720, at: [640, 592], s: .56, title: 'Tally', text: 'Election void.', buttons: [{ id: 'ok', t: 'OK', def: true }], dressing: true, dim: false, t: lt }, u); ctx.restore();
  }
  if (lt >= T_INC) {
    const u = eb(sg(lt, T_INC, T_INC + .25)); ctx.save(); ctx.translate(640, 590); ctx.scale(u, u); ctx.translate(-640, -590);
    UI.pill('DEFAULT: INCUMBENT WINS', 640, 590, { size: 54, fill: '#ffbf1f', ink: '#22262b', stroke: 'rgba(30,20,30,.8)', lw: 4, hero: u >= 1 && TVH && scaleNow() * 54 >= 31, crop: !(u >= 1 && TVH) }); ctx.restore();
  }
}
function paintTV(lt, scr) {
  if (!scr || scr.w < 20) return;
  ctx.save(); ctx.beginPath(); ctx.rect(scr.x, scr.y, scr.w, scr.h); ctx.clip();
  ctx.translate(scr.x, scr.y); ctx.scale(scr.w / 1280, scr.w / 1280);
  chartWin(lt);
  ctx.restore();
  V2.glow(scr.x + scr.w / 2, scr.y + scr.h / 2, scr.w * .9, '120,190,255', .12, 'screen', .5);
}

// ------------------------------------------------------------------ Binder (the laptop's, crowned), the nine chips, the confetti
const T_BIND = bS('o5') + .02;
function binderOpts(lt) {
  const k = eb(sg(lt, T_BIND, T_BIND + .38)), kk = kAt(336), X = mapX(LAPX), Z = mapZ(336);
  const rise = (1 - k) * 220, base = V2.p2(X, TB.top + 290, Z), grin = ss(lt, CUE.grin - .034, CUE.grin + .07);
  return A15.binder({ x: base[0], y: base[1] + rise * kk, s: kk * 1.0 * Math.max(.01, k), t: lt, who: 'bind', pose: lt < bS('b1') ? 'helpful' : 'wave', grin, glint: Math.max(grin * .5, lt >= CUE.sting ? Math.exp(-(lt - CUE.sting) * 4) : 0), look: [lt < bS('b1') ? .2 : 0, .1], hover: false, bob: 1, acc: ['fp16_crown'], crownK: ss(lt, T_BIND + .15, T_BIND + .4), expr: 'bind_happy' });
}
const HEADS = [['e1', 1], ['e2', 2], ['tom', 3], ['mango', 4], ['lemon', 5], ['onion', 6], ['straw', 7], ['e4', 8], ['e3', 9]];
const T_NINE = wS('l1', 1) - .04;
function nineChips(lt) {
  const placed = [];
  HEADS.forEach(([n, num]) => {
    const [xr, zr] = SEATS[n], k = kAt(zr), [x, y0] = P(xr, n === 'tom' || n[0] === 'e' ? 440 : SEAT_Y + 470 * .86, zr);
    let y = y0 - 44 * k * 1.6; const m = ctx.getTransform();
    for (let it = 0; it < 4; it++) { const sx = m.a * x + m.e, sy = m.d * y + m.f; if (placed.some(q => Math.abs(q[0] - sx) < 92 && Math.abs(q[1] - sy) < 70)) y -= 70 / m.d; }
    const sx = m.a * x + m.e, sy = m.d * y + m.f; placed.push([sx, sy]);
    const t0 = T_NINE + (num - 1) * .075, a = lt - t0; if (a < 0) return;
    const pop = eb(c01(a / .16)), size = 46;
    if (sx < 90 || sx > W - 90 || sy < 270 || sy > 1300) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop); ctx.translate(-x, -y);
    UI.pill(String(num), x, y, { size, fill: num === 9 ? '#ff5a4a' : '#ffbf1f', ink: num === 9 ? '#fff' : '#22262b', stroke: 'rgba(30,20,30,.85)', lw: 4, minW: 70, hero: false, crop: true, id: 'chip' + num });
    ctx.restore();
  });
}
const CONF = Array.from({ length: 150 }, (_, i) => ({ x: hash(i * 3.7) * W, v: 520 + hash(i * 1.9) * 420, sw: 30 + hash(i * 5.3) * 70, ph: hash(i * 2.2) * TAU, sz: 12 + hash(i * 6.1) * 14, d: hash(i * 8.3) * .45, c: ['#ffd23a', '#ff4d6d', '#37c8ff', '#7dff8a', '#ffffff', '#b68cff'][i % 6], rot: (hash(i * 9.1) - .5) * 14 }));
function confetti(lt) {
  const t0 = CUE.grin; if (lt < t0) return;
  for (const c of CONF) {
    const a = lt - t0 - c.d; if (a < 0) continue;
    const x = c.x + Math.sin(a * 3 + c.ph) * c.sw, y = -40 + c.v * a * .9 + 140 * a * a * .5; if (y > H + 40) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(c.rot * a + c.ph); ctx.scale(1, Math.abs(Math.cos(a * 6 + c.ph)) * .8 + .2); ctx.fillStyle = c.c; ctx.fillRect(-c.sz / 2, -c.sz / 4, c.sz, c.sz / 2); ctx.restore();
  }
}

// ------------------------------------------------------------------ the shot table: each shot is a camera (lens, position, then a 2D zoom) and the set of people on screen
const BASEF = 1100;
const lens = o => Object.assign({ dir: 'f', f: BASEF, cz: -1250, cy: 700, hy: 640, cx: 0, z: 1, fx: W / 2, fy: H / 2 }, o);
const wideF = (z = 1, o = {}) => lens(Object.assign({ dir: 'f', cz: -1700, cy: 960, hy: 520, z }, o));
const tvCam = (wpx, yc = 780, o = {}) => lens(Object.assign({ dir: 'f', cz: (RM.zTV - 110) - 720 * BASEF / wpx, cy: TVG.bot + TVG.h / 2, hy: yc, cx: TVG.cx }, o));
const faceCam = (xr, k, hy = 540, o = {}) => lens(Object.assign({ dir: 'r', cz: (RM.zTV - 130) - BASEF / k, cy: 430, hy, cx: -xr }, o));
const wideR = (o = {}) => lens(Object.assign({ dir: 'r', cz: -250, cy: 1100, hy: 470, cx: 0 }, o));
const SHOTS = [];
const shot = (id, s, e, cam, o = {}) => SHOTS.push(Object.assign({ id, s, e, cam }, o));
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s) r = sh; return r; };
const ALLF = ['tom', 'e1', 'e2', 'e3', 'e4', 'mango', 'lemon', 'onion', 'straw'], ALLR = ['mango', 'lemon', 'onion', 'straw'];
const T_REV = bS('o2');
shot('w0', 0, 1.0, u => wideF(lerp(1, 1.05, u)), { cast: ALLF });
shot('hands', 1.0, 2.123, u => faceCam(110, 2.5, 250, { z: lerp(1, 1.05, u) }), { cast: ['onion'], dofBack: 6, tvPeek: false , noLap: true });
shot('tv1', 2.123, 3.412, u => tvCam(lerp(1000, 1060, u), 800), { cast: ['tom'], tvHero: true });
shot('lem1', 3.412, 4.10, u => faceCam(-110, 2.0, 270, { z: lerp(1, 1.05, u) }), { cast: ['lemon'], dofBack: 6 , noLap: true });
shot('nine', 4.10, 5.2, u => wideF(lerp(1.02, 1.06, u), { cx: lerp(-30, 30, u) }), { cast: ALLF, chips: true });
shot('lem2', 5.2, T_REV, u => faceCam(-110, 2.1, 270, { z: lerp(1.02, 1.0, u) }), { cast: ['lemon'], dofBack: 6 , noLap: true });
shot('rev', T_REV, 7.592, u => { const k = ss(u, .08, .6); return lens({ dir: 'r', cz: lerp(212, -250, k), cy: lerp(760, 1100, k), hy: lerp(440, 470, k), cx: lerp(-50, 0, k), z: lerp(1, 1.12, k) }); }, { cast: ALLR, crowd: true, tag: true });
shot('st1', 7.592, 8.496, u => faceCam(330, 2.0, 430, { z: lerp(1, 1.05, u) }), { cast: ['straw'], crowd: true, dofBack: 7, dofCrowd: 7 , noLap: true });
shot('on1', 8.496, 10.0, u => faceCam(110, 2.4, 250, { z: lerp(1, 1.04, u) }), { cast: ['onion'], crowd: true, dofBack: 7, dofCrowd: 7 , noLap: true });
shot('crowd', 10.0, 10.9, u => lens({ dir: 'r', cz: 524, cy: 620, hy: 380, cx: lerp(-110, -100, u), z: lerp(1.15, 1.2, u) }), { cast: ['straw', 'onion', 'lemon'], crowd: true, noLap: true });
shot('tv2', 10.9, 12.0, u => tvCam(lerp(1000, 1040, u), 800), { cast: ['tom'], tvHero: true });
shot('bal', 12.0, CUE.dialog, u => faceCam(330, 1.9, 430, { z: lerp(1, 1.06, u) }), { cast: ['straw'], crowd: true, dofBack: 7, dofCrowd: 7 , noLap: true });
shot('tv3', CUE.dialog, 14.1, u => tvCam(lerp(1040, 1000, ss(u, 0, .25)), 800), { cast: ['tom'], tvHero: true });
shot('on2', 14.1, 15.64, u => faceCam(110, 2.4, 250, { z: lerp(1, 1.05, u) }), { cast: ['onion'], crowd: true, dofBack: 7, dofCrowd: 7 , noLap: true });
shot('tom3a', 15.64, 16.7, u => lens({ dir: 'f', f: 2400, cz: (RM.zTV - 110) - 2400 / 1.5, cy: TVG.bot + TVG.h / 2, hy: 470, cx: lerp(-570, -540, u), z: lerp(1, 1.04, u) }), { cast: ['tom'], tvHero: false, table: false, dofBack: 6 });
shot('tom3b', 16.7, 17.686, u => tvCam(lerp(1000, 1080, u), 780), { cast: [], tvHero: true });
shot('man', 17.686, bS('o5'), u => faceCam(-330, 1.95, 240, { z: lerp(1, 1.05, u) }), { cast: ['mango'], crowd: true, dofBack: 7, dofCrowd: 7 , noLap: true });
shot('turn', bS('o5'), 19.977, u => wideF(lerp(1.1, 1.16, u), { cx: -20, fy: 900 }), { cast: ALLF, binder: true, tvHero: false });
shot('st2', 19.977, 21.549, u => faceCam(330, 2.0, 430, { z: lerp(1, 1.04, u) }), { cast: ['straw'], crowd: true, dofBack: 7, dofCrowd: 7 , noLap: true });
shot('bnd', 21.549, CUE.sting, u => wideF(lerp(1.5, 1.7, u), { cz: -500, cy: 640, hy: 700, cx: 0, fx: 540, fy: 830 }), { cast: [], binder: true });
shot('end', CUE.sting, 23.79, u => wideR({ z: lerp(1.08, 1.14, u) }), { cast: ALLR, crowd: true, binder: true });

// ------------------------------------------------------------------ the world: one function draws the room for either direction, far to near
function setLight(sh) {
  V2.setLight(D.dir === 'r'
    ? { key: [.66, -.28], keyColor: '#cfe0ff', keyA: .3, rim: '#ffd9a0', rimA: .42, shadow: '#2a2038', shadowA: .34, bounce: '#ffe2b0', bounceA: .14, amb: '#fff0d8', ambA: .06 }
    : { key: [.55, -.55], keyColor: '#ffe2b0', keyA: .24, rim: '#bcd4ff', rimA: .5, shadow: '#2a2038', shadowA: .32, bounce: '#ffe2b0', bounceA: .12, amb: '#fff0d8', ambA: .07 });
}
const doorOpen = lt => ss(lt, T_REV + .05, T_REV + .5);
function drawWorld(lt, sh) {
  const c = sh.cc; D.dir = c.dir; setLight(sh); V2.opts.reflect = false; TVH = sh.tvHero === true; NOLAP = !!sh.noLap;
  const back = () => { shell(lt); sides(lt); if (D.dir === 'f') tvWall(lt); else rearWall(lt, doorOpen(lt)); };
  if (sh.dofBack) V2.dof(sh.dofBack, back); else back();
  const items = [], near = V2.P.cz + 100;
  const add = (zr, fn, zNear) => { const z = mapZ(zr); if ((zNear === undefined ? z : zNear) < near) return; items.push({ z, fn }); };
  if (D.dir === 'f') add(RM.zTV - 90, () => { tvCart(lt, scr => paintTV(lt, scr)); });
  if (D.dir === 'r' && sh.crowd && lt >= T_POP) add(-100, () => { const g = () => { drawCrowd(lt); drawTags(lt); }; if (sh.dofCrowd) V2.dof(sh.dofCrowd, g); else g(); });
  if ((typeof sh.cast === 'function' ? sh.cast(lt) : sh.cast).indexOf('tom') >= 0 && D.dir === 'f') add(SEATS.tom[1], () => drawChar(person('tom', lt)));
  for (const n of (typeof sh.cast === 'function' ? sh.cast(lt) : sh.cast)) {
    if (n === 'tom') continue;
    const [xr, zr, face] = SEATS[n], toCam = (face > 0) === (D.dir === 'r');
    if (n[0] === 'e') { add(zr, () => { const po = person(n, lt); drawChar(po); }); continue; }
    add(zr, () => { const w = 118; boxR(xr - w, xr + w, SEAT_Y - 14, SEAT_Y + 4, zr - 70, zr + 70, { color: '#4a5f86', top: '#6a80a8', front: '#3d4f74', side: '#2f3e5e', lw: 1.6 }); }, mapZ(zr) - 70);
    add(zr + (toCam ? -1 : 1) * 2, () => { const w = 96, bz = zr - face * 66; boxR(xr - w, xr + w, SEAT_Y + 4, SEAT_Y + 200, bz - 8, bz + 8, { color: '#4a5f86', top: '#6a80a8', front: '#3d4f74', side: '#2f3e5e', lw: 1.6 }); }, mapZ(zr - face * 66) - 8);
    add(zr + (toCam ? 0 : -3) * 0, () => { ctx.save(); const po = person(n, lt); (window.__cntDbg = window.__cntDbg || {})[n] = { x: po.x, y: po.y, s: po.s, yaw: po.yaw, kind: po.kind }; drawChar(po); if (n === 'onion') { const u = Math.max(sobK(lt) - .1, 0) * (lt >= CUE.sob ? 1 : 0) + (lt > 8.4 && lt < 11 ? .25 : 0); if (u > .02) A15.tearsAura(po.x, po.y - 130 * po.s, Math.min(1, u), { r: 190 * po.s, n: 40, t: lt, size: Math.max(.5, po.s * .9), seed: 4 }); } ctx.restore(); });
  }
  if (sh.table !== false && !window.__NOTABLE) { const tzn = Math.min(mapZ(TB.z0), mapZ(TB.z1)) - 2; add(315, () => tableDraw(lt), tzn); add(314, () => { tableItems(lt); flicks(lt); }, tzn); }
  if (sh.binder && lt >= T_BIND) add(336, () => drawChar(binderOpts(lt)));
  items.sort((a, b) => b.z - a.z); for (const it of items) it.fn();
  if (sh.chips) nineChips(lt);
}

// ------------------------------------------------------------------ overlays (screen space, after the grade): the field-guide tag of the forty, the flashes, the confetti
function pillTag(lines, cx, cy, t0, t1, lt, o = {}) {
  const k = c01((lt - t0) / .24), out = c01((t1 - lt) / .18);
  if (lt < t0 || lt > t1) return null;
  const a = Math.min(k, out), pop = k >= 1 ? 1 : eb(k), hero = k >= 1 && out >= 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
  const r = UI.tag(lines, cx, cy, Object.assign({ fill: '#f7ecc8', stroke: '#1f3a28', lw: 5, ink: '#1f3a28', size: 34, hero, crop: !hero, alpha: a, holeFill: '#1f3a28', shadow: 20 }, o));
  ctx.restore();
  return r;
}
function nameTag(lt) {
  const sh = shotAt(lt); if (sh.id !== 'st1') return;
  pillTag([{ t: 'STRAWBERRY', size: 48, weight: 900, fill: '#1f3a28' }, { t: 'PER DIEM', size: 40, weight: 900, fill: '#b3261e', spacing: 2 }], 540, 1170, bS('s1') + .12, bE('s1') + .4, lt, { w: 560, id: 'perdiem', lh: 1.16 });
}
function crowdTag(lt) {
  const sh = shotAt(lt); if (sh.id !== 'rev') return;
  pillTag([{ t: 'STRAWBERRY  x 40', size: 46, weight: 900, fill: '#1f3a28' }, { t: 'Fragaria per diem', size: 34, italic: true, weight: 800, fill: '#3f6b3a' }, { t: 'UNASSIGNED', size: 30, weight: 900, fill: '#7a5a12', spacing: 1 }], 540, 330, T_TAGS + .12, T_REV + (7.592 - T_REV) - .02, lt, { w: 800, id: 'crowdtag', lh: 1.14 });
}
const flashK = lt => Math.max(.45 * Math.exp(-Math.max(0, lt - CUE.dialog) * 16) * (lt >= CUE.dialog ? 1 : 0), .3 * Math.exp(-Math.max(0, lt - CUE.sting) * 12) * (lt >= CUE.sting ? 1 : 0));

const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), u = c01((lt - sh.s) / Math.max(.001, sh.e - sh.s)), c = Object.assign(lens({}), sh.cam(u, lt, sh));
    sh.cc = c;
    V2.setCam({ f: c.f, cz: c.cz, cy: c.cy, hy: c.hy, cx: c.cx });
    const punch = lt >= CUE.dialog && lt < CUE.dialog + .6 ? .05 * Math.exp(-(lt - CUE.dialog) * 14) : lt >= CUE.sting && lt < CUE.sting + .6 ? .03 * Math.exp(-(lt - CUE.sting) * 12) : 0;
    zoomTo(c.fx, c.fy, c.z * (1 + punch));
  },
  draw(lt) { drawWorld(lt, shotAt(lt)); },
  fx(lt) {
    const fx = { bloom: .4, vignette: .38, grain: .045, contrast: .12, sat: .1 };
    if (lt < .25) { fx.fade = 1 - sg(lt, 0, .25); fx.fadeColor = '16,28,40'; }
    return fx;
  },
  blur(lt) {
    for (const sh of SHOTS) if (Math.abs(lt - sh.s) < .045) return 1;
    if (lt > T_REV + .05 && lt < T_REV + 1.2) return 8;
    return 1;
  },
  over(lt) {
    crowdTag(lt); nameTag(lt);
    confetti(lt);
    const k = flashK(lt); if (k > 0) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP16_SCENES = window.__EP16_SCENES || {};
window.__EP16_SCENES.count = SC;
})();
