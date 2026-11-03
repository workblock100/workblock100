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
/* @@NEXT@@ */
})();
