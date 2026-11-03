'use strict';
/* SHIFT HAPPENS, Episode 15: "The Merger". Scene module: announce (3:00 PM, THE ANNOUNCEMENT, 25.24 s). Builder E15-B. Registers window.__EP15_SCENES.announce.
 *
 * The all-hands in the activity room: a one-point-perspective set of its own (peach walls, sage wainscot, a braided rug, folding chairs, a window wall with afternoon light, a WELCOME banner,
 * a corkboard) with a rolling TV cart at the far end and Melon beside it. The audience (Mango, Lemon, Strawberry, Clementine, two background staff) is seen FROM BEHIND (yaw PI) in a row of folding
 * chairs; heads turn to each other on the lines (headYaw); the reverse angle (from the TV end) shows three-quarter faces lit by the TV. The TV shows a laggy video call (SH15.call): Mr. Artichoke's
 * tile (A15.artichoke), a field-guide tag, his layers peeling, a freeze, a screen share of the sheet (two cells), Binder (A15.binder) in the corner, the warning dialog, the merge.
 *
 * (every number is a world unit; the room is built in ROOM coordinates: xr right, y up, zr toward the TV wall; fwd = the camera behind the audience looking at the TV, rev = the camera at the
 *  TV end looking back at the faces: X = -xr, Z = ZTV - zr)
 */
(() => {
if (!window.TIMELINE_EP15 || !window.H6 || !window.S6 || !window.V2) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A15 = window.A15, SH15 = window.SH15;
const S6 = window.S6, PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP15, SCN = TLX.scenes.find(s => s.id === 'announce'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'announce') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];      /* scene-local start of the i-th word of a spoken line (words are line-relative in the timeline) */
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));                        /* linear 0..1 between a and b */
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };   /* smoothstep */
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };   /* ease out back */
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const rgba = (c, a = 1) => V2.rgba(c, a);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rg = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
const snapT = t => Math.round((START + t) * 30) / 30 - START;            /* the scene-local time of the video frame nearest to t: a picture event lands on this frame */
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);   /* a damped wobble that starts at t0 (copied from ep12_room.js) */
/* piecewise keys [[t, v], ...] (v a number or an array), eased between neighbours; held before the first and after the last */
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);

/* the sound cues of the scene (scene-local seconds, from script_ep15.json: beat start + offset; python3 /tmp/shift_tools/cues.py 15 announce) */
const CUE = { connect: .4, peel: 7.365, heart: 7.965, glitch: 10.861, spinner: 12.45, binderpop: 13.05, dialog: 16.95, grin: 17.058, click: 23.017, merge: 23.243, whoosh: 23.693 };
for (const k in CUE) CUE[k] = Math.round((START + CUE[k]) * 30) / 30 - START;   /* the picture hits the video frame nearest each sound cue */

// ------------------------------------------------------------------ the room: ROOM coordinates (xr right when facing the TV, y up, zr toward the TV wall) mapped through the shot's direction
const RM = { hw: 900, ch: 900, zTV: 1500, zRear: -1100, rail: 150 };
const D = { dir: 'f' };                                                      /* the shot's direction: 'f' (behind the audience, looking at the TV) or 'r' (from the TV end, looking back) */
const mapX = xr => D.dir === 'f' ? xr : -xr;
const mapZ = zr => D.dir === 'f' ? zr : RM.zTV - zr;
const P = (xr, y, zr) => V2.p2(mapX(xr), y, mapZ(zr));                       /* the screen point of a room point */
const kAt = zr => V2.P.f / (mapZ(zr) - V2.P.cz);                              /* the scale at room depth zr */
/* a polygon of room points, clipped at the camera's near plane first (a point behind the lens would project to garbage) */
function polyW(pts, fill, stroke, lw) {
  const near = V2.P.cz + 90, out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= near, ib = b[2] >= near;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (near - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), near]); }
  }
  if (out.length >= 3) V2.poly(out.map(p => V2.p2(p[0], p[1], p[2])), fill, stroke, lw);
}
const polyR = (pts, fill, stroke, lw) => polyW(pts.map(p => [mapX(p[0]), p[1], mapZ(p[2])]), fill, stroke, lw);
const depthOf = zr => mapZ(zr) - V2.P.cz;
const wallR = (side, y0, y1, z0, z1, fill, stroke, lw) => polyR([[side * RM.hw, y0, z0], [side * RM.hw, y1, z0], [side * RM.hw, y1, z1], [side * RM.hw, y0, z1]], fill, stroke, lw);   /* a rectangle on a side wall */
const lit = (c, f) => S6.lit(c, f);
/* a box in room coordinates (sorted, so box3 sees its x0 < x1 and z0 < z1 in the shot's direction) */
function boxR(xa, xb, y0, y1, za, zb, o) {
  const xs = [mapX(xa), mapX(xb)].sort((a, b) => a - b), zs = [mapZ(za), mapZ(zb)].sort((a, b) => a - b);
  return S6.box3(Object.assign({ x0: xs[0], x1: xs[1], y0, y1, z0: zs[0], z1: zs[1] }, o));
}
const ROOMC = { wall: '#f1d8b4', wain: '#7ea08c', floorA: '#c8ad84', floorB: '#9d8561', ceil: '#efe9dd', fog: '#c4a98a' };

/* the shell: walls, wainscot, floor and ceiling in perspective, two rows of ceiling lamps (the near ones fade out as the camera passes them) */
function shell(lt) {
  const far = D.dir === 'f' ? RM.zTV : RM.zTV - RM.zRear;
  S6.shell({ zb: far, hw: RM.hw, ch: RM.ch, rail: RM.rail, wall: ROOMC.wall, wain: ROOMC.wain, floorA: ROOMC.floorA, floorB: ROOMC.floorB, ceil: ROOMC.ceil, fog: ROOMC.fog, fogAmt: .22, tile: 150, bright: 1 });
  const zs = D.dir === 'f' ? [-100, 360, 820, 1280] : [140, 600, 1060, 1520, 1980];
  for (const X of [-300, 300]) for (const Z of zs) if (Z > V2.P.cz + 260) S6.ceilingLamp(X, Z, RM.ch, 1, '255,240,208', 110, 190);
}

/* a plain frame with a pane: a window or a picture on a FACING wall (the far wall): x0 x1 y0 y1 in room coordinates at room depth zr */
const facing = (x0, x1, y0, y1, zr) => { const a = P(x0, y1, zr), b = P(x1, y0, zr); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) }; };
const flatR = (x0, x1, y0, y1, zr, fill, stroke, lw, r = 0) => { const q = facing(x0, x1, y0, y1, zr); if (depthOf(zr) < 140) return q; if (r) { rr(q.x, q.y, q.w, q.h, r * kAt(zr)); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } } else polyR([[x0, y0, zr], [x1, y0, zr], [x1, y1, zr], [x0, y1, zr]], fill, stroke, lw); return q; };

/* hero:false lettering for set dressing, placed on a facing wall; hidden unless it is whole in the frame (the camera zooms in and out) */
function dress(str, xr, y, zr, o = {}) {
  if (depthOf(zr) < 140) return;
  const k = kAt(zr), [x, yy] = P(xr, y, zr), size = (o.size || 40) * k;
  if (size < 7) return;
  UI.label(str, x, yy, Object.assign({ size, hero: false, crop: true, weight: 900 }, o, { size }));
}

// ------------------------------------------------------------------ the TV wall (fwd): corkboard, clock, banner, window light, plant
function tvWall(lt) {
  const z = RM.zTV - 4;
  // a pale panel behind the TV (a projector-screen wall patch) is not needed: the wall is the wall. The corkboard on the left, with five notes
  { const x0 = -840, x1 = -520, y0 = 300, y1 = 600, zz = z;
    flatR(x0 - 14, x1 + 14, y0 - 14, y1 + 14, zz, '#7a5a3c', 'rgba(25,16,30,.6)', 2, 6);
    flatR(x0, x1, y0, y1, zz, '#c9a06a', 'rgba(40,24,16,.5)', 1.5, 4);
    const notes = [[-815, 520, -700, 580, '#fff6d8', '#d6202e'], [-680, 530, -560, 585, '#ffffff', '#2a5ac8'], [-810, 420, -690, 495, '#e9f5ff', '#3a9a5a'], [-665, 410, -545, 500, '#fff0f0', '#e8852a'], [-760, 320, -600, 392, '#fffbe0', '#7a3fb0']];
    notes.forEach(([a, b, c, d, f, hi], i) => {
      flatR(a, c, b, d, zz, f, 'rgba(60,40,20,.45)', 1, 2);
      flatR(a + 3, c - 3, d - 14, d - 3, zz, hi, null, 0);
      polyR([[(a + c) / 2 - 4, d - 6, zz], [(a + c) / 2 + 4, d - 6, zz], [(a + c) / 2 + 4, d + 2, zz], [(a + c) / 2 - 4, d + 2, zz]], '#d94a3a');
      for (let j = 0; j < 3; j++) polyR([[a + 10, b + 14 + j * 15, zz], [c - 10 - (j % 2) * 18, b + 14 + j * 15, zz], [c - 10 - (j % 2) * 18, b + 16 + j * 15, zz], [a + 10, b + 16 + j * 15, zz]], 'rgba(40,40,60,.38)');
    });
    dress('ACTIVITIES', -680, 632, zz, { size: 34, fill: '#fff6d8', stroke: '#5a3a22', lw: 5 });
  }
  // the wall clock reads three
  { const k = kAt(z); if (k * 46 > 6) S6.wallClock(mapX(-680), 740, z - 2, 1, 0, 3, 46); }
  // a plant on the right of the TV, a framed picture of a sunny meadow above it
  flatR(560, 790, 470, 650, z, '#6b4a2a', 'rgba(25,16,30,.6)', 2, 5);
  { const q = flatR(576, 774, 486, 634, z, '#bfe3f4', null, 0, 3); ctx.save(); ctx.beginPath(); ctx.rect(q.x, q.y, q.w, q.h); ctx.clip();
    ctx.fillStyle = '#8cc65a'; ctx.beginPath(); ctx.moveTo(q.x, q.y + q.h * .62); ctx.quadraticCurveTo(q.x + q.w * .3, q.y + q.h * .5, q.x + q.w * .6, q.y + q.h * .6); ctx.quadraticCurveTo(q.x + q.w * .85, q.y + q.h * .66, q.x + q.w, q.y + q.h * .55); ctx.lineTo(q.x + q.w, q.y + q.h); ctx.lineTo(q.x, q.y + q.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ell(q.x + q.w * .78, q.y + q.h * .22, q.w * .09, q.w * .09); ctx.fill(); ctx.restore(); }
  S6.plant3(mapX(690), z - 60, 1.2);
}
/* the WELCOME banner over the TV: a printed sheet on two strings with a bunting line on each side (the lettering is set dressing) */
function banner(lt) {
  const z = RM.zTV - 6, sway = Math.sin(lt * .9) * .004;
  const [ax, ay] = P(-470, 888, z), [bx, by] = P(470, 888, z), k = kAt(z);
  ctx.save(); ctx.translate((ax + bx) / 2, (ay + by) / 2); ctx.rotate(-.012 + sway); ctx.translate(-(ax + bx) / 2, -(ay + by) / 2);
  // bunting lines
  for (const [x0, x1] of [[-860, -480], [480, 860]]) {
    const [pa, qa] = [P(x0, 890, z), P(x1, 890, z)], sag = 40 * k;
    ctx.strokeStyle = 'rgba(70,50,30,.8)'; ctx.lineWidth = Math.max(1.5, 2 * k); ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.quadraticCurveTo((pa[0] + qa[0]) / 2, pa[1] + sag * 1.8, qa[0], qa[1]); ctx.stroke();
    const cols = ['#ef5a5a', '#ffd84a', '#5ac2ef', '#7ad06a', '#c77af0'];
    for (let i = 1; i <= 7; i++) { const u = i / 8, px = lerp(pa[0], qa[0], u), py = lerp(pa[1], qa[1], u) + sag * 4 * u * (1 - u) * 1.0 * 1.8 * .5 + 0; ctx.fillStyle = cols[i % 5]; ctx.strokeStyle = 'rgba(40,24,30,.55)'; ctx.lineWidth = Math.max(1, 1.6 * k); ctx.beginPath(); ctx.moveTo(px - 17 * k, py); ctx.lineTo(px + 17 * k, py); ctx.lineTo(px, py + 40 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  // the banner itself
  const bw = bx - ax, bh = 96 * k, cx = (ax + bx) / 2, cy = ay + bh * .55;
  ctx.strokeStyle = 'rgba(70,50,30,.8)'; ctx.lineWidth = Math.max(1.5, 2 * k); ctx.beginPath(); ctx.moveTo(ax, ay - 30 * k); ctx.lineTo(ax + 20 * k, cy - bh / 2); ctx.moveTo(bx, by - 30 * k); ctx.lineTo(bx - 20 * k, cy - bh / 2); ctx.stroke();
  ctx.save(); ctx.shadowColor = 'rgba(40,20,10,.35)'; ctx.shadowBlur = 8 * k; ctx.shadowOffsetY = 4 * k; ctx.fillStyle = '#fff6e0'; rr(ax + 14 * k, cy - bh / 2, bw - 28 * k, bh, 8 * k); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#e8503c'; ctx.lineWidth = Math.max(2, 5 * k); rr(ax + 22 * k, cy - bh / 2 + 8 * k, bw - 44 * k, bh - 16 * k, 5 * k); ctx.stroke();
  UI.label('WELCOME', cx, cy, { size: 76 * k, font: 'Bangers', weight: 400, fill: '#e8503c', stroke: '#fff6e0', lw: 0, spacing: 14 * k, hero: false, crop: true });
  ctx.restore();
}

// ------------------------------------------------------------------ the side walls: windows with afternoon light (the room's right), a bookcase of puzzle boxes and a coat rail (the room's left)
function windowsWall(lt) {
  const s = 1, X = s * RM.hw;
  for (const [z0, z1] of [[300, 720], [880, 1300]]) {
    wallR(s, 130, 640, z0 - 24, z1 + 24, '#efe6d2', 'rgba(25,16,30,.55)', 2.4);
    const sky = [P(s * RM.hw, 140, z0), P(s * RM.hw, 630, z1)], okD = depthOf(z0) > 160 && depthOf(z1) > 160;
    wallR(s, 150, 620, z0, z1, okD ? V2.grad(0, Math.min(sky[0][1], sky[1][1]), 0, Math.max(sky[0][1], sky[1][1]), [[0, '#bfe0ff'], [1, '#fff4d6']]) : '#dcecff');
    // two mullions and a sill
    for (const f of [.5]) { const zz = lerp(z0, z1, f); polyR([[X, 150, zz - 6], [X, 620, zz - 6], [X, 620, zz + 6], [X, 150, zz + 6]], '#efe6d2'); }
    polyR([[X, 385 - 6, z0], [X, 385 + 6, z0], [X, 385 + 6, z1], [X, 385 - 6, z1]], '#efe6d2');
    wallR(s, 118, 132, z0 - 40, z1 + 40, '#e1d6bd', 'rgba(25,16,30,.5)', 2);
    // curtains
    wallR(s, 110, 690, z0 - 70, z0 - 8, '#d98a6a', 'rgba(60,24,20,.35)', 1.6); wallR(s, 110, 690, z1 + 8, z1 + 70, '#d98a6a', 'rgba(60,24,20,.35)', 1.6);
  }
}
function bookcaseWall(lt) {
  const s = -1;
  wallR(s, 0, 330, 560, 1360, '#9a6c3e', 'rgba(25,16,30,.55)', 2.2);
  const cols = ['#e8503c', '#3a7bd5', '#ffd84a', '#5fbf6a', '#c77af0', '#ff9a3c', '#4ac4c4'];
  for (let r = 0; r < 2; r++) {
    const y0 = 24 + r * 156;
    wallR(s, y0, y0 + 134, 580, 1340, '#6b4a2c');
    for (let i = 0; i < 9; i++) { const z0 = 592 + i * 82; wallR(s, y0 + 6, y0 + 6 + 70 + ((i * 7) % 3) * 16, z0, z0 + 64 - (i % 2) * 6, cols[(i + r * 3) % 7], 'rgba(25,16,30,.5)', 1.4); }
  }
}

// ------------------------------------------------------------------ the floor: a braided rug under the audience, and the window light lying on it
function rug(lt) {
  const x0 = -640, x1 = 640, z0 = 120, z1 = 1240;
  polyR([[x0 - 22, 0, z0 - 22], [x1 + 22, 0, z0 - 22], [x1 + 22, 0, z1 + 22], [x0 - 22, 0, z1 + 22]], '#7b4f3a', 'rgba(25,16,30,.45)', 1.6);
  polyR([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], '#3f7f8a');
  polyR([[x0 + 40, 0, z0 + 40], [x1 - 40, 0, z0 + 40], [x1 - 40, 0, z1 - 40], [x0 + 40, 0, z1 - 40]], '#4d93a0');
  polyR([[x0 + 52, 0, z0 + 52], [x1 - 52, 0, z0 + 52], [x1 - 52, 0, z1 - 52], [x0 + 52, 0, z1 - 52]], null, 'rgba(255,236,190,.5)', 2);
  // a lozenge pattern down the middle
  for (let i = 0; i < 5; i++) { const zc = lerp(z0 + 160, z1 - 160, i / 4); polyR([[-110, 0, zc], [0, 0, zc - 52], [110, 0, zc], [0, 0, zc + 52]], i % 2 ? '#d8b25a' : '#cf6a58', 'rgba(25,16,30,.3)', 1.2); }
}
/* the sun through the right-hand windows: two skewed parallelograms on the floor and the rug, with the mullion shadow, and faint beams in the air */
function sunOnFloor(lt, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [z0, z1] of [[330, 720], [900, 1290]]) {
    if (depthOf(Math.min(z0, z1)) < 420 || depthOf(Math.max(z0, z1)) < 420) continue;
    const sh = -.9;   /* how far the patch slides toward the room's left per unit of depth (the sun is low) */
    const q = [[RM.hw * .96, 0, z0], [RM.hw * .96, 0, z1], [RM.hw * .96 - 1250, 0, z1 + 90], [RM.hw * .96 - 1250, 0, z0 + 90]]; void sh;
    polyR(q, lg(...P(q[0][0], 0, q[0][2]), ...P(q[2][0], 0, q[2][2]), [[0, `rgba(255,226,150,${.5 * a})`], [.65, `rgba(255,226,150,${.26 * a})`], [1, 'rgba(255,226,150,0)']]));
  }
  ctx.restore();
}
function sunBeams(lt, a = 1) {
  if (a <= 0) return;
  const [wx, wy] = P(RM.hw, 440, 510), [wx2, wy2] = P(RM.hw, 440, 1090);
  for (const [x, y, zz] of [[wx, wy, 510], [wx2, wy2, 1090]]) if (depthOf(zz) > 500) V2.beam(x, y, x - 760, y + 880, 150, 470, '255,232,170', .12 * a);
  V2.dust(0, 300, W, 1500, lt, { n: 70, seed: 4, size: 2.8, alpha: .55 * a, speed: 9 });
}

// ------------------------------------------------------------------ folding chairs: the frame is steel tube, the seat and back are padded navy vinyl; they face the TV (+zr)
const CH = { hw: 104, hd: 72, seat: 118, pad: 16, backY0: 170, backY1: 236 };
const CHC = { tube: '#6b707c', tubeTop: '#9aa0ac', vinyl: '#4a5f86', vinylTop: '#6a80a8', vinylFront: '#3d4f74', vinylSide: '#2f3e5e' };
function chairLayer(xr, zr, layer, o = {}) {
  const w = o.w ?? CH.hw, d = CH.hd, s = CH.seat, tube = { color: CHC.tube, top: CHC.tubeTop, front: '#4a4f5a', side: '#3c4049', lw: .9 };
  const vinyl = { color: CHC.vinyl, top: CHC.vinylTop, front: CHC.vinylFront, side: CHC.vinylSide, lw: 1.6 };
  if (layer === 'seat') {   /* behind the sitter: four legs, a cross brace, the seat; in the rev view also the back */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxR(xr + sx * (w - 10) - 3, xr + sx * (w - 10) + 3, 0, s, zr + sz * (d - 10) - 3, zr + sz * (d - 10) + 3, tube);
    /* the X brace between the two legs nearer the camera (fwd: the rear pair, rev: the front pair) */
    { const zb = D.dir === 'f' ? zr - d + 10 : zr + d - 10, zf = zb, x0 = xr - w + 10, x1 = xr + w - 10, a = P(x0, 14, zf), b = P(x1, s - 22, zf), c = P(x1, 14, zf), e = P(x0, s - 22, zf);
      ctx.strokeStyle = '#6b707c'; ctx.lineWidth = Math.max(1.5, 5 * kAt(zr)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); }
    boxR(xr - w, xr + w, s - 2, s + CH.pad - 2, zr - d, zr + d, vinyl);
    if (D.dir === 'r') { boxR(xr - w - 2, xr + w + 2, CH.backY0, CH.backY1, zr - d + 2, zr - d + 18, vinyl); for (const sx of [-1, 1]) boxR(xr + sx * (w - 14) - 3, xr + sx * (w - 14) + 3, s + CH.pad - 2, CH.backY0, zr - d + 6, zr - d + 12, tube); }
  } else if (layer === 'back' && D.dir === 'f') {   /* in front of the sitter, seen from behind: the backrest and its two posts */
    for (const sx of [-1, 1]) boxR(xr + sx * (w - 14) - 3, xr + sx * (w - 14) + 3, s + CH.pad - 2, CH.backY0, zr - d + 6, zr - d + 12, tube);
    boxR(xr - w - 2, xr + w + 2, CH.backY0, CH.backY1, zr - d + 2, zr - d + 18, vinyl);
  } else if (layer === 'lip' && D.dir === 'r') {   /* in front of the sitter, seen from the front: the seat's front edge */
    boxR(xr - w, xr + w, s - 2, s + CH.pad - 2, zr + d - 10, zr + d, vinyl);
  }
}
/* an empty chair, whole */
function chairEmpty(xr, zr, o) { chairLayer(xr, zr, 'seat', o); chairLayer(xr, zr, D.dir === 'f' ? 'back' : 'lip', o); }

// ------------------------------------------------------------------ the rolling TV cart and the TV (fwd only): the screen's rectangle is returned for the call to paint
const TVG = { cx: 0, bot: 262, w: 720, h: 405, bez: 26 };
function tvCart(lt, paint) {
  const z = RM.zTV - 90, k = kAt(z), cx = TVG.cx, top = TVG.bot + TVG.h;
  // the floor shadow and the base: a steel T on four casters
  { const [sx, sy] = P(cx, 0, z); ctx.fillStyle = 'rgba(30,18,10,.28)'; ell(sx, sy + 6 * k, 420 * k, 38 * k); ctx.fill(); }
  const steel = { color: '#4e5360', top: '#8d94a3', front: '#434856', side: '#363a46', lw: 1.4 };
  boxR(cx - 330, cx + 330, 26, 52, z - 40, z + 40, steel);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [px, py] = P(cx + sx * 300, 0, z + sz * 30); ctx.fillStyle = '#23252c'; ell(px, py - 12 * k, 16 * k, 14 * k); ctx.fill(); ctx.fillStyle = '#8a8f9a'; ell(px, py - 12 * k, 6 * k, 6 * k); ctx.fill(); }
  // the AV shelf with a laptop, a hub and a power strip
  boxR(cx - 320, cx + 320, 236, 252, z - 44, z + 44, { color: '#5d6270', top: '#a6adbb', front: '#4a4f5c', side: '#3c404c', lw: 1.6 });
  boxR(cx - 230, cx - 40, 252, 262, z - 30, z + 30, { color: '#2c2f38', top: '#454a58', front: '#23262e', side: '#1d1f26', lw: 1.2 });
  boxR(cx + 60, cx + 290, 252, 266, z - 28, z + 28, { color: '#c9ccd6', top: '#eceef4', front: '#b8bcc8', side: '#9ca0ae', lw: 1.2 });
  { const [lx, ly] = P(cx + 250, 258, z - 28); ctx.fillStyle = '#4a9a5a'; ell(lx, ly, 3.5 * k, 3.5 * k); ctx.fill(); }
  // the two poles and the mount
  for (const sx of [-1, 1]) boxR(cx + sx * 260 - 9, cx + sx * 260 + 9, 40, top - 30, z - 12, z + 12, steel);
  boxR(cx - 290, cx + 290, TVG.bot - 22, TVG.bot - 4, z - 14, z + 14, steel);
  // the TV: a black bezel, the screen, a webcam bar on top
  const bz = TVG.bez, x0 = cx - TVG.w / 2, x1 = cx + TVG.w / 2, y0 = TVG.bot, y1 = top;
  const zf = z - 20;
  boxR(x0 - bz, x1 + bz, y0 - bz, y1 + bz, z - 18, z + 18, { color: '#17181d', top: '#2b2d35', front: '#101116', side: '#0b0c10', lw: 2, edge: 'rgba(0,0,0,.8)' });
  const scr = facing(x0, x1, y0, y1, zf);
  boxR(cx - 70, cx + 70, y1 + bz, y1 + bz + 24, z - 16, z + 8, { color: '#1b1c22', top: '#31333c', front: '#14151a', side: '#0e0f13', lw: 1.6 });
  { const [lx, ly] = P(cx, y1 + bz + 12, z - 17); ctx.fillStyle = '#16181e'; ell(lx, ly, 9 * k, 9 * k); ctx.fill(); ctx.fillStyle = '#5a6ad8'; ell(lx, ly, 4 * k, 4 * k); ctx.fill(); const on = lt > CUE.connect; ctx.fillStyle = on ? '#58ff8c' : '#5a1e1e'; ell(lx + 40 * k, ly, 3.2 * k, 3.2 * k); ctx.fill(); if (on) V2.emit(lx + 40 * k, ly, 26 * k, '90,255,150', .5); }
  if (paint) paint(scr);
  return scr;
}
/* the TV's cable: loops to the floor and runs to the wall outlet (set dressing) */
function tvCable() {
  const z = RM.zTV - 90, [ax, ay] = P(TVG.cx + 330, 250, z), [bx, by] = P(860, 40, RM.zTV - 40), [mx, my] = P(520, 0, z - 160);
  ctx.strokeStyle = '#1b1c22'; ctx.lineWidth = Math.max(2, 5 * kAt(z)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(ax + 20, my + 40, mx - 60, my + 30, mx, my); ctx.bezierCurveTo(mx + 120, my - 6, bx - 40, by + 20, bx, by); ctx.stroke();
}

// ------------------------------------------------------------------ the cast: seats and the turn conventions
const ROW1 = 450, ROW2 = 850;                                                 /* zr of the two rows of chairs */
const SEATX = { mango: -405, lemon: -135, straw: 135, clem: 405 };            /* xr, the audience from the room's left to its right (the screen's left to right in fwd) */
const MELONP = [-480, 1370];                                                  /* Melon beside the TV (xr, zr) */
const NEUT = () => D.dir === 'f' ? PI : .42;                                 /* the yaw of someone watching the TV: the back (fwd) or a three-quarter face toward the TV off to the screen's right (rev) */
const turnTo = psi => NEUT() - psi;                                           /* psi: the turn toward the room's right (the sitter's own right): fwd the face goes toward the screen right; rev toward the screen left */
/* the options that put a seated body on the chair at (xr, zr): feet are hidden (noLegs), the body rests on the cushion */
function seatOpts(xr, zr, k = .9) {
  const X = mapX(xr), Z = mapZ(zr), q = V2.at(X, Z), y = V2.p2(X, CH.seat + CH.pad - 6, Z)[1];
  return { x: q.x, y, s: q.s * k, noLegs: true, noShadow: true, noReflect: true, plant: true };
}
/* the people of the audience, as drawChar options, with the acting (head turns and faces) from the shot's script; lt is scene-local */
/* merge b into a, skipping the keys of b that are undefined (an acting function leaves a key out by returning undefined) */
/* the IK targets of two hands held in front of the chest (screen space: from behind the 'l' arm is on the screen's right) */
const GRIP = () => D.dir === 'f' ? { l: [26, 14], r: [-26, 14] } : { l: [-26, 14], r: [26, 14] };
function defined(a, b) { if (b) for (const k in b) if (b[k] !== undefined) a[k] = b[k]; return a; }
const ACT = {};   /* filled in by the acting section: ACT[name](lt) -> { psiB, psiH, expr, look, lid, arms, ... } */
function person(name, lt) {
  const base = { mango: [A7.mango, SEATX.mango], lemon: [A7.lemon, SEATX.lemon], straw: [A11.straw, SEATX.straw], clem: [A10.clem, SEATX.clem] }[name];
  const a = ACT[name] ? ACT[name](lt) : {};
  const o = defined(Object.assign(seatOpts(base[1], ROW1, a.k ?? .84), { t: lt, expr: 'neutral', arms: { l: 'hold', r: 'hold' }, grip: GRIP() }), a.o);
  o.yaw = turnTo(a.psiB ?? 0); o.headYaw = turnTo(a.psiH ?? a.psiB ?? 0);
  o.x += (a.dx || 0) * o.s; o.y += (a.dy || 0) * o.s;
  const DB = window.__B15; if (DB && DB.expr && DB.who === name) o.expr = DB.expr;
  return base[0](o);
}
const EXTRA = [
  { id: 'xp', kind: 'pine', xr: -590, zr: ROW2, acc: ['lanyard7'], seed: 31, c: null },
  { id: 'xk', kind: 'kiwi', xr: 570, zr: ROW2, acc: ['badge7'], seed: 47, c: null },
];
function extra(i, lt) {
  const e = EXTRA[i], a = ACT.extra ? ACT.extra(i, lt) : {};
  const o = defined(Object.assign(seatOpts(e.xr, e.zr, .86), { kind: e.kind, id: e.id, acc: e.acc, seed: e.seed, t: lt, expr: 'neutral', arms: { l: 'hold', r: 'hold' }, grip: GRIP() }), a.o);
  o.yaw = turnTo(a.psiB ?? 0); o.headYaw = turnTo(a.psiH ?? a.psiB ?? 0); o.x += (a.dx || 0) * o.s; o.y += (a.dy || 0) * o.s;
  return o;
}
function melonOpts(lt) {
  const X = mapX(MELONP[0]), Z = mapZ(MELONP[1]), q = V2.at(X, Z), a = ACT.melon ? ACT.melon(lt) : {};
  return A9.melon(Object.assign({ x: q.x, y: q.y, s: q.s * 1.12, t: lt, expr: 'happy', look: [0, 0], arms: { l: 'rest', r: 'rest' } }, a));
}

// ------------------------------------------------------------------ the shot table: each shot is a camera (lens, position, then a 2D zoom) and the set of people on screen
/* cam fields: dir ('f' | 'r'), f cz cy hy cx (the V2 camera), z (the 2D zoom) and fx fy (the scene point put at the frame centre by zoomTo; default the frame centre) */
const SHOTS = [];
const shot = (id, s, e, cam, o = {}) => SHOTS.push(Object.assign({ id, s, e, cam }, o));
function shotAt(lt) { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s) r = sh; return r; }
const BASEF = 1100;
const lens = o => Object.assign({ dir: 'f', f: BASEF, cz: -850, cy: 400, hy: 760, cx: 0, z: 1, fx: W / 2, fy: H / 2 }, o);

// ------------------------------------------------------------------ the light
function setLight(sh, lt) {
  const rev = D.dir === 'r';
  V2.setLight(rev
    ? { key: [.66, -.28], keyColor: '#cfe0ff', keyA: .3, rim: '#ffd9a0', rimA: .42, shadow: '#2a2038', shadowA: .34, bounce: '#ffe2b0', bounceA: .14, amb: '#fff0d8', ambA: .06 }
    : { key: [.55, -.55], keyColor: '#ffe2b0', keyA: .24, rim: '#bcd4ff', rimA: .55, shadow: '#2a2038', shadowA: .32, bounce: '#ffe2b0', bounceA: .12, amb: '#fff0d8', ambA: .07, back: { color: '176,206,255', a: .7, w: 14 } });
}

// ------------------------------------------------------------------ the world: one function draws the room for either direction, far to near
const HAS = (sh, n) => !sh.cast || sh.cast === 'all' || sh.cast.indexOf(n) >= 0;
/* the artichoke's petals that slip out of the TV and flutter down over the cart (the tile's own petals fall inside the picture; these cross the bezel) */
function petals(lt, scr) {
  if (lt < CUE.peel + .05 || lt > CUE.peel + 2.2 || !scr) return;
  const sc = scr.w / 1000;
  for (let i = 0; i < 26; i++) {
    const t0 = CUE.peel + .12 + i * .035 + hash(i * 7.1) * .12, age = lt - t0; if (age < 0 || age > 1.9) continue;
    const x0 = scr.x + scr.w * (.08 + .42 * hash(i * 3.3 + 1)), y0 = scr.y + scr.h * (.9 + .1 * hash(i * 5.7)), sw = (hash(i * 2.9) - .5) * 2;
    const x = x0 + Math.sin(age * 4 + i) * 38 * sc * (.5 + Math.abs(sw)) + sw * 90 * sc * age, y = y0 + (60 * age + 620 * age * age) * sc, rot = Math.sin(age * 5 + i * 2) * 1.2 + i;
    const a = 1 - sg(age, 1.3, 1.9), L = (30 + 18 * hash(i * 1.9)) * Math.max(.5, sc);
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = V2.mix('#7fae4a', '#b9dd86', hash(i * 4.1)).map(Math.round).join(',').replace(/^(.*)$/, 'rgb($1)'); ctx.strokeStyle = 'rgba(30,60,20,.75)'; ctx.lineWidth = Math.max(1.5, 2.4 * sc);
    ctx.beginPath(); ctx.moveTo(0, -L); ctx.quadraticCurveTo(L * .62, -L * .2, 0, L * .7); ctx.quadraticCurveTo(-L * .62, -L * .2, 0, -L); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,70,20,.45)'; ctx.lineWidth = Math.max(1, 1.4 * sc); ctx.beginPath(); ctx.moveTo(0, -L * .8); ctx.lineTo(0, L * .45); ctx.stroke();
    ctx.restore();
  }
}
function drawWorld(lt, sh) {
  const c = sh.cc;
  D.dir = c.dir;
  setLight(sh, lt);
  V2.opts.reflect = false;
  const back = () => { shell(lt); if (D.dir === 'f') { tvWall(lt); banner(lt); } else rearWall(lt); windowsWall(lt); bookcaseWall(lt); rug(lt); sunOnFloor(lt, sh.sun ?? 1); };
  if (D.dir === 'r') V2.dof(sh.dof ?? 7, back); else back();
  tvGlow(lt, sh);
  if (D.dir === 'f') { tvCable(); const scrR = tvCart(lt, scr => { TVR = scr; paintTV(lt, scr, sh); }); petals(lt, scrR); if (HAS(sh, 'melon')) drawChar(melonOpts(lt)); }
  // row 2 (the background staff): seats, people, chair backs; then row 1 (the main cast)
  if (sh.rows2 !== false && mapZ(ROW2) - V2.P.cz > 450) {
    const xs = [-590, -350, -110, 130, 340, 570];
    for (const xr of xs) chairLayer(xr, ROW2, 'seat');
    if (HAS(sh, 'extras')) EXTRA.forEach((e, i) => drawChar(extra(i, lt)));
    for (const xr of xs) chairLayer(xr, ROW2, D.dir === 'f' ? 'back' : 'lip');
  }
  const mains = ['mango', 'lemon', 'straw', 'clem'].filter(n => HAS(sh, n));
  for (const n of mains) chairLayer(SEATX[n], ROW1, 'seat');
  for (const n of mains) drawChar(person(n, lt));
  for (const n of mains) chairLayer(SEATX[n], ROW1, D.dir === 'f' ? 'back' : 'lip');
  sunBeams(lt, sh.beams ?? 1);
}
/* the rear wall seen from the TV end: double doors with wired glass, an EXIT sign, a fire extinguisher, a hand-sanitiser dispenser (all dressing) */
function rearWall(lt) {
  const z = RM.zRear + 4;
  flatR(-300, 300, 0, 470, z, '#c9a06a', 'rgba(25,16,30,.6)', 3, 4);
  for (const [a, b] of [[-292, -6], [6, 292]]) { flatR(a, b, 8, 462, z, '#d8b27c', 'rgba(25,16,30,.5)', 2, 3); flatR(a + 60, b - 60, 250, 420, z, '#9fc1c6', 'rgba(25,16,30,.5)', 2, 3); }
  flatR(-14, 14, 160, 190, z, '#8a8f9a', null, 0, 4);
  flatR(-80, 80, 540, 600, z, '#1f8a4a', 'rgba(10,40,20,.8)', 2.5, 6); dress('EXIT', 0, 570, z, { size: 40, fill: '#eafff0', hero: false });
  flatR(-520, -470, 40, 210, z, '#c43a2a', 'rgba(60,10,10,.8)', 2, 8);
  flatR(420, 470, 200, 300, z, '#e8ecef', 'rgba(25,16,30,.5)', 2, 6);
}
// ------------------------------------------------------------------ hero-text helpers for anything drawn in a scaled frame (the TV): hero only when it is big enough and wholly in the safe area
const scaleNow = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };
function safeBox(x0, y0, x1, y1, mg = 44) {   /* is a box (current frame) wholly inside the frame, clear of the caption zone (y 1380..1700) and the clock pill (x 48..500, y 116..244)? */
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}
function tvLabel(str, cx, cy, o = {}) {
  const sc = scaleNow(), size = o.size || 40, ink = UI.sizeOf(str, { size, weight: o.weight || 900, font: o.font });
  const hero = o.hero !== false && size * sc >= 31 && safeBox(cx - ink.w / 2, cy - size * .4, cx + ink.w / 2, cy + size * .4, 44);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: !hero }));
}

// ------------------------------------------------------------------ the TV picture (a 1280 x 720 window mapped onto the screen): standby, joining, the call, the shared sheet
const TVT = { pop: 4.375, share: 12.9, shareFade: .22 };
const UIS = 1.4;                                        /* the call's chrome scale: big enough that its pills pass 30 px on screen when the TV fills the frame */
const SHARE = { x: 16 * UIS, y: 72 * UIS, w: 1280 - 32 * UIS, h: 720 - 168 * UIS };       /* where the shared sheet sits inside the call window (SH15.call: top bar 60, control bar 84, margins 16 and 12, all x ui; no strip while sharing) */
function tvStandby(lt) {
  ctx.fillStyle = '#07090c'; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = rgba('#2a3a4a', .55 + .25 * Math.sin(lt * 3)); ell(640, 360, 7, 7); ctx.fill();
}
/* the joining screen: a calm dark blue, a ring of dots turning, "Joining..." */
function tvJoining(lt, u, dress) {
  ctx.fillStyle = lg(0, 0, 0, 720, [[0, '#0c1c2c'], [1, '#17394d']]); ctx.fillRect(0, 0, 1280, 720);
  ctx.save(); ctx.globalAlpha *= .12; ctx.strokeStyle = '#7fb4d8'; ctx.lineWidth = 2; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.arc(640, 330, 90 + i * 70, 0, TAU); ctx.stroke(); } ctx.restore();
  const t = lt - CUE.connect;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - t * 5.4, al = ((i / 12 - t * .9) % 1 + 1) % 1; ctx.fillStyle = rgba('#bfe6ff', .18 + .82 * (1 - al)); ctx.beginPath(); ctx.arc(640 + Math.cos(a) * 86, 300 + Math.sin(a) * 86, 12, 0, TAU); ctx.fill(); }
  tvLabel('Greenleaf All-Hands', 640, 120, { size: 40, weight: 800, fill: '#8fb8d2', hero: !dress });
  tvLabel('Joining...', 640, 470, { size: 84, weight: 900, fill: '#eaf6ff', hero: !dress });
  const pw = 420, px = 640 - pw / 2; ctx.fillStyle = 'rgba(255,255,255,.12)'; rr(px, 560, pw, 12, 6); ctx.fill(); ctx.fillStyle = '#58d4a0'; rr(px, 560, pw * (.2 + .6 * ((t * .35) % 1)), 12, 6); ctx.fill();
}
/* the Greenleaf office behind the CEO: bamboo slats, a window of sky, a rubber plant, a framed leaf; drawn at the tile's size */
function officeBack(r) {
  ctx.fillStyle = lg(r.x, r.y, r.x, r.y + r.h, [[0, '#d6e6c2'], [1, '#a9c58a']]); ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(70,100,50,.18)'; for (let i = 0; i < 18; i++) ctx.fillRect(r.x + i * r.w / 18, r.y, 5, r.h);
  const wx = r.x + r.w * .62, wy = r.y + r.h * .12, ww = r.w * .3, wh = r.h * .46;
  ctx.fillStyle = lg(0, wy, 0, wy + wh, [[0, '#bfe4ff'], [1, '#f2f8e8']]); rr(wx, wy, ww, wh, 8); ctx.fill(); ctx.strokeStyle = '#f4efe0'; ctx.lineWidth = 9; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
  ctx.fillStyle = '#5a8f45'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(r.x + r.w * (.08 + i * .015), r.y + r.h * (.78 - i * .09), 62, 20, -1 + i * .45, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#b9703a'; rr(r.x + r.w * .05, r.y + r.h * .84, r.w * .09, r.h * .2, 8); ctx.fill();
  ctx.fillStyle = '#f6efd8'; rr(r.x + r.w * .24, r.y + r.h * .16, r.w * .13, r.h * .3, 6); ctx.fill(); ctx.fillStyle = '#6aa653'; ctx.beginPath(); ctx.ellipse(r.x + r.w * .305, r.y + r.h * .31, r.w * .03, r.h * .11, .5, 0, TAU); ctx.fill();
}
/* Mr. Artichoke in his tile (drawn by SH15.call into the tile's rect; tt is the call's own, possibly stuttering, clock). The peel, the glitch cut and the freeze are all functions of tt */
function artiPeelAt(tt) {   /* the layers peel over a second (7.365 .. 8.4), the heart holds, then he is whole again with a glitch cut at 8.45 */
  if (tt < CUE.peel) return 0;
  if (tt < 8.45) return ss(tt, CUE.peel, CUE.peel + 1.0);
  return 0;
}
function artiTile(r, tt, big) {
  officeBack(r);
  const frozen = tt >= CUE.glitch + .02, peel = artiPeelAt(tt), gl = tt >= 8.4 && tt < 8.8 ? { k: 1 - sg(tt, 8.45, 8.8), y: .42, h: .16, dx: 40, seed: 3 } : (tt >= CUE.glitch - .02 && tt < CUE.glitch + .3 ? { k: 1 - sg(tt, CUE.glitch, CUE.glitch + .3), y: .46, h: .13, dx: 34, seed: 9 } : null);
  const s = r.h / 345, cx = r.x + r.w * .38, cy = r.y + r.h * .6;
  REG.suppress++;
  try {
    const o = A15.artichoke({ x: cx, y: cy, s, noLegs: true, anchor: 'centre', peel, t: tt, frozen, frozenAt: CUE.glitch + .02, expr: tt < 8.5 && tt > 7.4 ? 'arti_heart' : 'arti_warm', arms: { l: 'rest', r: 'rest' }, peelFloor: r.y + r.h * 1.02 - cy + 0, look: [0, 0] });
    if (gl) o.glitch = gl;
    A15.draw(o);
  } finally { REG.suppress--; }
}
const OTHERS = [{ name: 'G. Broccoli', initials: 'GB', color: '#2d4f3b' }, { name: 'Greenleaf Legal', initials: 'GL', color: '#3d3558', muted: true }, { name: 'Greenleaf Care', initials: 'GC', color: '#4d3f2b' }];
function tvCall(lt, sh, fade) {
  const lag = ss(lt, 9.7, 10.8) * .85, fr = ss(lt, CUE.glitch, CUE.glitch + .1);
  const hero = sh.tvHero ? ['freeze'] : [];
  SH15.call({ w: 1280, h: 720, ui: UIS, r: 0, dressing: !sh.tvHero, hero, title: 'Greenleaf All-Hands', time: 41 + Math.floor(lt), signal: fr > 0 ? 1 : lag > .4 ? 2 : 4, main: { name: 'Mr. Artichoke', speaking: !fr && ((lt > 5.865 && lt < 8.155) || (lt > 9.31 && lt < 11.36)), color: '#18382a', draw: (r, tt) => artiTile(r, tt, true) }, others: OTHERS, lag: fr > 0 ? 0 : lag, freeze: fr, frozenAt: CUE.glitch + .02 }, lt);
}

// ------------------------------------------------------------------ the shared screen: two cells, Binder's bubble, the pointer that chases "No thanks", the warning dialog, the merge
/* when Mr. Artichoke shares, the TV goes full screen on his sheet: a slim presenting bar on top, the sheet window below it (1280 x 666), his frozen picture as a small tile in the top right corner */
const SHW = { x: 0, y: 54, w: 1280, h: 666 };
const BTXT = "It looks like you're merging two facilities. Would you like help?";
/* the bubble's text typed in step with the spoken words of a line: the share of the letters shown at time lt */
function typedAt(id, text, lt) {
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
const BUB = { at: [268, 352], w: 740, s: 1.12 };
const BINDER_AT = [150, 520];                                           /* Binder's centre in the sheet window */
function noRect(o, u) {   /* the current rect of the "No thanks" button as it hops (the same formula as SH15.binder) */
  const g = SH15.binderRect(Object.assign({ text: BTXT }, o), 'no'); if (!g) return null;
  const RP = o.runPath || [[0, 0], [190, 36], [24, 150], [-190, 112]], s = o.s ?? 1, nH = RP.length - 1, i = Math.min(nH - 1, Math.floor(c01(u) * nH)), kk = easeIO(sg(c01(u), i / nH, (i + 1) / nH));
  return { x: g.x + lerp(RP[i][0], RP[i + 1][0], kk) * s, y: g.y + lerp(RP[i][1], RP[i + 1][1], kk) * s - Math.sin(PI * kk) * 52 * s, w: g.w, h: g.h };
}
const RUN = { t0: 16.42, t1: 17.0 };                                    /* the three hops of "No thanks" */
const runU = lt => sg(lt, RUN.t0 + .1, RUN.t1);
const DLG = { kind: 'warn', w: SHW.w, h: SHW.h, at: [SHW.w / 2, 474], s: 1.0 };
const dlgU = lt => eb(sg(lt, CUE.dialog, CUE.dialog + .32));
const dlgOut = lt => 1 - sg(lt, CUE.click + .06, CUE.click + .2);
function bubbleOpts(lt, sh) {
  const o = Object.assign({}, BUB, { name: 'Binder', size: 33, dressing: !sh.tvHero || lt >= CUE.dialog - .08 });
  o.buttons = [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }]; o.runaway = runU(lt); o.runPath = [[0, 0], [230, 50], [-50, 110], [-300, 70]]; o.pop = ss(lt, CUE.binderpop, CUE.binderpop + .3);
  if (lt < bS('b2')) { o.text = BTXT; o.typed = typedAt('b1', BTXT, lt); } else { o.text = "Great! I'll help."; o.typed = typedAt('b2', o.text, lt); }
  o.fade = 1 - sg(lt, 17.2, 17.45);
  o.tail = [BINDER_AT[0] + 84, BINDER_AT[1] - 6];
  return o;
}
function sheetOpts(lt, sh) {
  const hero = !!sh.tvHero && lt < CUE.dialog - .05, mu = c01((lt - CUE.merge) / 1.0), trem = lt >= bS('b4') && lt < CUE.click ? Math.sin(lt * 80) * 6 * (1 - .3 * sg(lt, bS('b4'), bE('b4'))) : 0;
  const strike = sg(lt, bS('b4') + .35, bS('b4') + .8);
  const so = { w: SHW.w, h: SHW.h, ui: 1, show: { title: false, ribbon: false, formula: false, status: false, sheetTabs: false }, cols: { A: 500, B: 500, C: 200 }, rows: { 1: 200, 2: 56 },
    sel: 'A1:B1', cells: {
      A1: { v: 'GREENLEAF', size: 72, bold: true, align: 'center', color: '#17613f', fill: '#e1f3e8', font: 'Nunito', weight: 900, hero, pulse: lt >= bS('b3') && lt < bS('b3') + .7 ? sg(lt, bS('b3') + .02, bS('b3') + .7) : undefined, pulseColor: '#2b6cff' },
      B1: { v: 'FRUIT BOWL', size: 72, bold: true, align: 'center', color: '#b3261e', fill: '#fdeceb', font: 'Nunito', weight: 900, hero, dy: trem, strike: strike > 0 ? strike : undefined, strikeColor: '#7a1210' },
      A2: { v: 'acquirer', size: 28, align: 'center', color: '#5b6470' }, B2: { v: 'acquired', size: 28, align: 'center', color: '#5b6470' },
    } };
  if (mu > 0) so.merge = { range: 'A1:B1', u: mu, final: { text: 'GREENLEAF', font: 'Bangers', fill: '#ffe135', bg: '#103a2c', size: 150, hero }, after: Math.max(0, lt - CUE.merge - 1.0) };
  return so;
}
function tvShare(lt, sh) {
  const so = sheetOpts(lt, sh), hero = !!sh.tvHero;
  ctx.fillStyle = '#0c0f12'; ctx.fillRect(0, 0, 1280, 720);
  ctx.save(); ctx.translate(SHW.x, SHW.y); ctx.beginPath(); ctx.rect(0, 0, SHW.w, SHW.h); ctx.clip();
  SH15.sheet(Object.assign(so, { dressing: true }), lt);
  const bo = bubbleOpts(lt, sh);
  // the bubble first, then the pointer's target; the warning dialog (modal, dims the sheet and the bubble); Binder and the pointer are above everything
  if (lt < 17.46) { ctx.save(); ctx.globalAlpha *= bo.fade; SH15.binder(bo, lt); ctx.restore(); }
  const nr = noRect(bo, runU(lt)) || { x: 700, y: 500, w: 200, h: 60 }, nrPrev = noRect(bo, runU(lt - .07)) || nr;
  let ptr;
  if (lt < RUN.t0) ptr = SH15.cursorPath([{ t: 12.95, x: 1010, y: 330 }, { t: 14.4, x: 1040, y: 320 }, { t: RUN.t0 - .02, x: nr.x + nr.w * .72, y: nr.y + nr.h * .8 }], lt);
  else if (lt < RUN.t1 + .25) ptr = { x: nrPrev.x + nrPrev.w * .72, y: nrPrev.y + nrPrev.h * .8, press: lt < RUN.t0 + .22 ? Math.sin(PI * sg(lt, RUN.t0 - .02, RUN.t0 + .2)) : 0, kind: 'arrow' };
  else { const okr = SH15.dialogRect(DLG, 'ok'); ptr = SH15.cursorPath([{ t: RUN.t1 + .25, x: nrPrev.x + nrPrev.w * .72, y: nrPrev.y + nrPrev.h * .8 }, { t: CUE.click - .1, x: okr.x + okr.w * .93, y: okr.y + okr.h * .9, click: [CUE.click - .15, CUE.click + .14] }], lt); }
  const du = dlgU(lt) * dlgOut(lt);
  if (du > 0) SH15.dialog(Object.assign({}, DLG, { dressing: !hero, press: lt > CUE.click - .15 ? { id: 'ok', k: ptr.press } : undefined }), lt >= CUE.click + .06 ? du : dlgU(lt));
  // Binder, over the dialog: he points a handle at A1 on "Greenleaf!", grins on "I'll help"
  const bpop = ss(lt, CUE.binderpop, CUE.binderpop + .3), grin = ss(lt, CUE.grin - .05, CUE.grin + .5), pointing = lt >= bS('b3') - .05 && lt < bE('b3') + .45;
  const pk = ss(lt, bS('b3') - .05, bS('b3') + .2) * (1 - ss(lt, bE('b3') + .1, bE('b3') + .45));
  const at = [lerp(BINDER_AT[0], 520, pk), lerp(BINDER_AT[1], 262, pk)];
  const bi = A15.binder({ x: at[0], y: at[1], s: lerp(.78, .62, pk) * eb(bpop), center: true, noLegs: true, who: 'bind', t: lt, pose: lt > bS('b2') ? 'helpful' : 'rest', handles: pk > .01 ? { l: [lerp(106, 150, pk), lerp(-34, -70, pk), lerp(118, 232, pk), lerp(36, -128, pk)], r: [106, -34, 118, 36] } : undefined, grin, glint: grin > .9 ? sg(lt, CUE.grin + .4, CUE.grin + .7) : 0, look: [.25, .1], hover: 6 });
  if (bpop > 0 && lt < CUE.click + .3) { REG.suppress++; try { drawChar(bi); } finally { REG.suppress--; } }
  if (lt > 12.95 && lt < CUE.click + .5) SH15.pointer(ptr.x, ptr.y, { kind: 'arrow', press: ptr.press, s: 1.2 });
  ctx.restore();
  // the slim presenting bar and his frozen picture in the corner (the call's own furniture, dressing)
  ctx.fillStyle = '#10161d'; ctx.fillRect(0, 0, 1280, SHW.y);
  tvLabel('Mr. Artichoke is presenting', 28, 28, { size: 26, weight: 800, fill: '#cfe3f0', align: 'left', hero: false });
  tvLabel('Greenleaf All-Hands', 1252, 28, { size: 22, weight: 700, fill: '#6f8797', align: 'right', hero: false });
  { const r = { x: 1076, y: 62, w: 188, h: 106 }; ctx.save(); rr(r.x, r.y, r.w, r.h, 10); ctx.clip(); ctx.fillStyle = '#18382a'; ctx.fillRect(r.x, r.y, r.w, r.h); artiTile(r, CUE.glitch + .1, false); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; rr(r.x, r.y, r.w, r.h, 10); ctx.stroke(); }
}

/* how bright the TV is at lt (the light it throws on the room): standby dim, joining mid, the call bright, the sheet white, the merge flash full */
const tvBright = lt => lt < CUE.connect ? .05 : lt < TVT.pop ? .5 : lt < TVT.share ? .75 : .9 + .1 * ss(lt, CUE.merge + .6, CUE.merge + 1.1);
function paintTV(lt, scr, sh) {
  const k = scr.w / 1280;
  ctx.save(); ctx.beginPath(); ctx.rect(scr.x, scr.y, scr.w, scr.h); ctx.clip();
  ctx.translate(scr.x, scr.y); ctx.scale(k, k);
  if (lt < CUE.connect) tvStandby(lt);
  else if (lt < TVT.pop) tvJoining(lt);
  else if (lt < TVT.share) {
    const u = sg(lt, TVT.pop, TVT.pop + .32);
    if (u < 1) { tvJoining(lt, 0, true); ctx.save(); ctx.globalAlpha *= ss(u, 0, .6); ctx.translate(640, 360); ctx.scale(lerp(.8, 1, eb(u)), lerp(.8, 1, eb(u))); ctx.translate(-640, -360); tvCall(lt, sh); ctx.restore(); } else tvCall(lt, sh);
  } else {
    const u = sg(lt, TVT.share, TVT.share + TVT.shareFade);
    tvShare(lt, sh);
    if (u < 1) { ctx.fillStyle = rgba('#dff3ff', .85 * (1 - u)); ctx.fillRect(0, 0, 1280, 720); }   /* the share cuts in with a flash of light */
  }
  if (lt >= CUE.connect && lt < CUE.connect + .22) { ctx.fillStyle = rgba('#e8f6ff', .9 * (1 - sg(lt, CUE.connect, CUE.connect + .22))); ctx.fillRect(0, 0, 1280, 720); }
  { const f = ss(lt, CUE.merge + .72, CUE.merge + 1.08); if (f > 0) { ctx.fillStyle = rgba('#ffffff', f); ctx.fillRect(0, 0, 1280, 720); } }
  ctx.restore();
  if (!sh.tvHero) {   /* the glass: a pale diagonal reflection (dressing only: it would sit on top of hero text) */
    ctx.save(); ctx.beginPath(); ctx.rect(scr.x, scr.y, scr.w, scr.h); ctx.clip(); ctx.fillStyle = lg(scr.x, scr.y, scr.x + scr.w * .5, scr.y + scr.h, [[0, 'rgba(255,255,255,.10)'], [.45, 'rgba(255,255,255,.02)'], [1, 'rgba(255,255,255,0)']]);
    ctx.beginPath(); ctx.moveTo(scr.x, scr.y); ctx.lineTo(scr.x + scr.w * .55, scr.y); ctx.lineTo(scr.x + scr.w * .22, scr.y + scr.h); ctx.lineTo(scr.x, scr.y + scr.h); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
/* the TV's light: a cool halo on the wall, the banner and the faces (added before the cart is drawn, so it sits behind the TV) */
function tvGlow(lt, sh) {
  const b = tvBright(lt), fl = ss(lt, CUE.merge + .72, CUE.merge + 1.1);
  if (D.dir === 'f') {
    const [x, y] = P(TVG.cx, TVG.bot + TVG.h / 2, RM.zTV - 110), k = kAt(RM.zTV - 110);
    V2.glow(x, y, 560 * k * (1 + fl * .7), fl > .01 ? '255,255,255' : '150,196,255', (.24 * b + .5 * fl), 'screen', .5);
    V2.addLight({ x, y: y + 160, r: 1300, color: '150,196,255', a: .5 * b + .3 * fl });
  } else V2.addLight({ x: W + 160, y: 700, r: 1500, color: '150,196,255', a: .55 * b + .3 * fl });
}

// ------------------------------------------------------------------ the acting: what each person does when (psi = the turn toward the room's right: + toward the sitter's own right)
const K = (a, lt) => key(a, lt, easeIO);
ACT.mango = lt => {
  const psiH = K([[0, 0], [.35, 0], [.75, .55], [1.5, .5], [1.9, 0], [2.84, 0], [3.1, .85], [3.7, .8], [4.2, 0], [11.3, 0], [11.55, -.1], [12.5, -.1], [12.8, .6], [13.4, .5], [13.9, 0], [19.8, 0], [20.1, -.08], [21.0, -.06], [21.6, 0]], lt);
  const shock = lt > 2.9 && lt < 3.7;
  const expr = shock ? 'shock' : lt > 11.4 && lt < 12.5 ? 'dead' : lt > 19.9 && lt < 21.7 ? 'sad' : lt > 12.5 && lt < 13.2 ? 'sour' : 'neutral';
  const sh = sg(lt, 12.45, 12.6) * (1 - sg(lt, 12.95, 13.1));
  return { psiB: psiH * .35, psiH, dx: sh * 5 * Math.sin((lt - 12.45) * 9), dy: sh * 3 * Math.sin((lt - 12.45) * 13), o: { expr, look: [lt > 12.5 && lt < 13.2 ? .5 : .1, 0] } };
};
ACT.lemon = lt => {
  const psiH = K([[0, 0], [.6, 0], [.9, -.4], [1.4, -.4], [1.8, 0], [2.84, 0], [3.1, -.7], [3.55, -.7], [3.75, 0], [12.5, 0], [12.6, .1], [12.75, -.35], [13.2, -.3], [13.5, 0], [17.4, 0], [17.7, .5], [18.6, .4], [19.0, 0]], lt);
  const cough = lt > 12.62 && lt < 12.95, expr = lt > 3.2 && lt < 4.4 ? 'shock' : cough ? 'sour' : lt > 17.5 && lt < 19.2 ? 'sad' : 'neutral';
  return { psiB: psiH * .3, psiH, dy: cough ? -5 * Math.max(0, Math.sin((lt - 12.62) * 22)) : 0, dx: cough ? 2 * Math.sin((lt - 12.62) * 22) : 0, o: Object.assign({ expr, look: [0, 0] }, cough ? { arms: { l: 'phone', r: 'hold' }, grip: { r: GRIP().r } } : {}) };
};
ACT.straw = lt => {
  const psiH = K([[0, 0], [1.2, 0], [1.5, -.3], [2.0, -.3], [2.3, 0], [8.2, 0], [8.5, -.35], [9.1, -.3], [9.4, 0], [12.7, 0], [12.9, -.35], [13.3, -.3], [13.6, 0], [14.9, 0], [15.3, -.25], [16.1, -.1], [16.5, 0]], lt);
  const expr = lt > 8.3 && lt < 9.6 ? 'dead' : lt > 6.5 && lt < 7.4 ? 'sour' : lt > 14.9 && lt < 17.0 ? 'sour' : 'chill';
  return { psiB: psiH * .3, psiH, o: { expr, look: [0, 0], lid: lt > 8.3 && lt < 9.6 ? .5 : lt > 6.5 && lt < 7.4 ? .5 : lt > 14.9 && lt < 16.6 ? .45 : undefined } };
};
ACT.clem = lt => {
  const waving = lt > 12.5 && lt < 13.15, wv = waving ? Math.sin((lt - 12.5) * 14) : 0;
  const psiH = K([[0, 0], [.5, .3], [1.0, 0], [11.9, 0], [12.4, -.5], [12.7, -.5], [13.1, 0], [22.6, 0], [22.8, .25], [23.2, 0]], lt);
  const expr = waving ? 'happy' : lt > 22.6 ? 'happy' : lt > 4.4 && lt < 4.9 ? 'hopeful' : 'hopeful';
  const nod = lt > 6.6 && lt < 7.3 ? 5 * Math.max(0, Math.sin((lt - 6.6) * 11)) : 0;
  return { psiB: psiH * .3, psiH, dy: nod, o: { expr, look: [0, 0], arms: waving ? { l: 'wave', r: 'hold' } : lt > 22.6 ? { l: 'hold', r: 'cheer' } : { l: 'hold', r: 'hold' }, grip: waving ? { r: GRIP().r } : lt > 22.6 ? { l: GRIP().l } : undefined, hand: waving ? { l: 'wave' } : undefined } };
};
ACT.melon = lt => {
  /* 0..0.7 he checks the TV's cable (his right hand toward it, eyes on it); 0.7..1.1 he turns to the room; then the arms open wide on "Team. Big news.", pump on "news", and the hands meet on "merging" */
  const reach = 1 - ss(lt, .55, .95), open = ss(lt, .95, 1.3) * (1 - ss(lt, 2.7, 2.95)), pump = Math.sin(PI * sg(lt, 1.6, 1.95)) * .28, meet = ss(lt, 2.7, 2.95) * (1 - ss(lt, 3.5, 3.9));
  let l = [.28, .25], r = [.28, .25];
  if (reach > 0) r = mixA(r, [1.35, .3], reach);
  if (open > 0) { l = mixA(l, [1.62 + pump, .08], open); r = mixA(r, [1.62 + pump, .08], open); }
  if (meet > 0) { l = mixA(l, [.78, .95], meet); r = mixA(r, [.78, .95], meet); }
  if (lt > 4.3 && lt < 5.9) r = mixA([.28, .25], [1.5, .05], ss(lt, 4.3, 4.6) * (1 - ss(lt, 5.5, 5.9)));
  return { expr: lt < .8 ? 'neutral' : lt < 3.6 ? 'happy' : 'happy', arms: { l, r }, look: [lt < .75 ? .85 : 0, lt < .75 ? -.15 : .05] };
};
ACT.extra = (i, lt) => {
  const psiH = i ? K([[0, 0], [2.7, 0], [3.0, -.5], [3.7, -.4], [4.1, 0], [12.5, 0], [12.9, .4], [13.5, 0]], lt) : K([[0, 0], [.4, .3], [.9, 0], [12.6, 0], [12.9, -.3], [13.4, 0]], lt);
  return { psiB: psiH * .3, psiH };
};

/* @@ACT2@@ */

// ------------------------------------------------------------------ the cameras
/* a camera that frames the TV's screen as `wpx` px wide with its centre at screen y = yc (dx: slide along the wall in world units, so a tile off-centre in the picture can be centred) */
const TVC = { z: RM.zTV - 110, yc: TVG.bot + TVG.h / 2 };
const tvCam = (wpx, yc = 760, o = {}) => Object.assign({ dir: 'f', cz: TVC.z - 720 * BASEF / wpx, cy: TVC.yc, hy: yc, cx: 0 }, o);
/* a camera that frames a seated person of the audience (rev: faces; xr the sitter's seat) at scale k (the distance follows), the face at screen height yf, the frame slid by dx (screen px of the room's X) */
const faceCam = (xr, k, yf = 800, o = {}) => { const d = BASEF / k; return Object.assign({ dir: 'r', cz: (RM.zTV - ROW1) - d, cy: 292, hy: yf, cx: -xr + (o.dx || 0) }, o); };
const WIDE = { cz: -900, cy: 760, hy: 620, fx: 540, fy: 880 };

// the shot list (scene-local seconds; every cut is on a beat start or inside a held line on a spoken word)
shot('open', 0, 1.10, u => Object.assign({}, WIDE, { z: lerp(1.16, 1.22, u / 1.1) }));
shot('a1a', 1.10, 2.62, u => Object.assign(lens({ cz: 540, cy: 330, hy: 700, cx: -430, z: lerp(1, 1.05, u / 1.5) }), {}), { cast: ['melon'] });
shot('a1b', 2.62, 3.58, u => faceCam(-270, 1.5, 800, { z: 1 }), { cast: ['mango', 'lemon'], rows2: false });
shot('l1', 3.58, 4.38, u => faceCam(-135, 1.95, 800, { z: lerp(1, 1.06, u / .8) }), { cast: ['lemon'], rows2: false });
shot('a2', 4.38, 6.60, u => tvCam(lerp(840, 980, u / 2.22), 740), { cast: [], tvHero: false });
shot('react1', 6.60, 7.30, u => faceCam(270, 1.45, 800, { z: lerp(1, 1.04, u / .7) }), { cast: ['straw', 'clem'], rows2: false });
shot('peel', 7.30, 8.36, u => tvCam(lerp(1380, 1500, u / 1.06), 760, { cx: -70 }), { cast: [], tvHero: false });
shot('s1', 8.36, 9.31, u => faceCam(135, 1.95, 800, { z: lerp(1, 1.05, u / .95) }), { cast: ['straw'], rows2: false });
shot('ar2', 9.31, 10.86, u => tvCam(lerp(1200, 1320, u / 1.55), 760, { cx: -70 }), { cast: [], tvHero: false });
shot('frz', 10.86, 11.46, u => tvCam(lerp(1440, 1500, u / .6), 760, { cx: -70 }), { cast: [], tvHero: true });
shot('m1', 11.46, 12.40, u => faceCam(-405, 1.95, 800, { z: lerp(1, 1.05, u / .94) }), { cast: ['mango'], rows2: false });
shot('stuck', 12.40, 13.15, u => Object.assign({}, WIDE, { cz: lerp(-700, -650, u / .75), cy: 700, hy: 640, z: 1, fx: 540, fy: 960 }));
shot('b1a', 13.15, 14.95, u => tvCam(lerp(1130, 1190, u / 1.8), 760, { cx: -32 }), { cast: [], tvHero: true });
shot('s2', 14.95, 16.45, u => faceCam(135, 1.95, 800, { z: lerp(1.02, 1.08, u / 1.5) }), { cast: ['straw'], rows2: false });
shot('run', 16.45, 17.55, u => tvCam(lerp(1200, 1250, u / 1.1), 760, { cx: -32 }), { cast: [], tvHero: true });
shot('l2', 17.55, 18.50, u => faceCam(-135, 1.95, 800, { z: lerp(1, 1.05, u / .95) }), { cast: ['lemon'], rows2: false });
shot('l2b', 18.50, 19.25, u => tvCam(lerp(1230, 1270, u / .75), 760, { cx: -32 }), { cast: [], tvHero: true });
shot('b3', 19.25, 19.96, u => tvCam(1250, 760, { cx: -32 }), { cast: [], tvHero: true });
shot('m2', 19.96, 21.62, u => faceCam(-405, 1.95, 800, { z: lerp(1.02, 1.08, u / 1.66) }), { cast: ['mango'], rows2: false });
shot('b4', 21.62, 22.67, u => tvCam(lerp(1230, 1270, u / 1.05), 760, { cx: -32 }), { cast: [], tvHero: true });
shot('c1', 22.67, 22.97, u => faceCam(405, 1.95, 800, { z: 1.04 }), { cast: ['clem'], rows2: false });
shot('click', 22.97, 23.69, u => tvCam(1250, 760, { cx: -32 }), { cast: [], tvHero: true });
shot('whoosh', 23.69, 25.3, u => tvCam(lerp(1250, 6400, easeIn(sg(u, 0, 1.0))), lerp(760, 700, u / 1.1), { cx: lerp(-32, 0, u / .8) }), { cast: [], tvHero: false });

// ------------------------------------------------------------------ overlays (screen space, after the grade): the field-guide tag, the tiny Binder in the room, the white of the merge
let TVR = null;                                                   /* the TV screen's rectangle of the frame being drawn (set by tvCart's paint) */
function pillTag(lines, cx, cy, t0, t1, lt, o = {}) {
  const k = c01((lt - t0) / .24), out = c01((t1 - lt) / .18);
  if (lt < t0 || lt > t1) return null;
  const a = Math.min(k, out), pop = k >= 1 ? 1 : easeBack(k), hero = k >= 1 && out >= 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
  const r = UI.tag(lines, cx, cy, Object.assign({ fill: '#f7ecc8', stroke: '#1f3a28', lw: 5, ink: '#1f3a28', size: 34, hero, crop: !hero, alpha: a, holeFill: '#1f3a28', shadow: 20 }, o));
  ctx.restore();
  return r;
}
/* Mr. Artichoke's tag: his first appearance, in the field-guide style of Episode 14; the LAYERS count follows his peel (11 .. 0) */
function artiTag(lt) {
  const n = Math.max(0, Math.round(A15.layersLeft({ peel: artiPeelAt(lt), t: lt }))), tg = A15.tagFor('arti', n);
  const lines = [{ t: 'MR. ARTICHOKE', size: 46, weight: 900, fill: '#1f3a28' }, { t: tg.latin, size: 34, italic: true, weight: 800, fill: '#3f6b3a' }, { t: 'CEO OF GREENLEAF  (LAYERS: ' + n + ')', size: 30, weight: 900, fill: '#7a5a12', spacing: 1 }];
  pillTag(lines, 540, 1234, 4.62, 8.32, lt, { w: 800, id: 'artitag', lh: 1.14 });
}
/* the tiny Binder: it floats out of the TV on the grin and then hovers in the corner of the room shots */
const TINY = { corner: [900, 380] };
function tinyBinder(lt) {
  if (lt < CUE.grin + .02) return;
  const u = ss(lt, CUE.grin + .02, CUE.grin + .7), sh = shotAt(lt);
  const from = TVR && sh.tvHero ? [TVR.x + (SHW.x + BINDER_AT[0]) * TVR.w / 1280, TVR.y + (SHW.y + BINDER_AT[1]) * TVR.w / 1280] : [200, 1100];
  const mid = [lerp(from[0], TINY.corner[0], .5) - 160, Math.max(from[1], TINY.corner[1]) + 120];
  const a = 1 - u, x = a * a * from[0] + 2 * a * u * mid[0] + u * u * TINY.corner[0], y = a * a * from[1] + 2 * a * u * mid[1] + u * u * TINY.corner[1];
  const sc = lerp(.62, .42, u), bob = Math.sin(lt * 2.3) * 7 * u, grin = .55 + .45 * Math.sin(lt * 1.7) ** 2;
  if (lt < 24.4) {
    ctx.save(); ctx.shadowColor = 'rgba(10,8,16,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
    const o = A15.binderSmall({ x: x, y: y + bob, s: sc, center: true, noLegs: true, who: 'bind', t: lt, pose: 'wave', grin, glint: Math.max(0, Math.sin(lt * 1.7 - 1.2)) ** 8, look: [.4, .3], hover: 4, rot: -.12 * (1 - u) });
    drawChar(o); ctx.restore();
  }
}
const whiteK = lt => ss(lt, 24.32, 24.78);

const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), c = Object.assign(lens({}), sh.cam(lt - sh.s, lt, sh), (window.__B15 && window.__B15.cam) || {});
    sh.cc = c;
    V2.setCam({ f: c.f, cz: c.cz, cy: c.cy, hy: c.hy, cx: c.cx });
    const punch = sh.id === 'peel' ? .035 * (Math.exp(-Math.max(0, lt - CUE.heart) * 14) * (lt >= CUE.heart ? 1 : 0) + .6 * Math.exp(-Math.max(0, lt - CUE.heart - .27) * 14) * (lt >= CUE.heart + .27 ? 1 : 0)) : 0;
    zoomTo(c.fx, c.fy, c.z * (1 + punch));
  },
  draw(lt) { TVR = null; drawWorld(lt, shotAt(lt)); },
  fx(lt) {
    const sh = shotAt(lt), rev = sh.cc && sh.cc.dir === 'r', k = whiteK(lt);
    const fx = { bloom: .42 + .5 * k, vignette: .36, grain: .045, contrast: .12, sat: .1 };
    if (lt < .3) { fx.fade = 1 - sg(lt, 0, .3); fx.fadeColor = '16,58,44'; }
    return fx;
  },
  blur(lt) {
    if (lt > 23.74 && lt < 24.62) return 16;
    for (const sh of SHOTS) if (Math.abs(lt - sh.s) < .045) return 1;
    return 1;
  },
  over(lt) {
    artiTag(lt);
    tinyBinder(lt);
    const k = whiteK(lt); if (k > 0) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP15_SCENES = window.__EP15_SCENES || {};
window.__EP15_SCENES.announce = SC;
})();
