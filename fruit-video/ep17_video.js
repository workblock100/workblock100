'use strict';
/* SHIFT HAPPENS, Episode 17: "The Module". Scene module: video (9:50 PM, THE VIDEO, 23.30 s). Builder E1617-VIDEO. Registers window.__EP17_SCENES.video.
 *
 * The activity room at night (the one-point-perspective set of ep15_announce.js, copied and re-dressed: night windows, dim ceiling lamps, the rolling TV as the only bright thing, an open door in the left
 * wall onto the lit corridor where a CALL LIGHT over a resident's door pulses red). Strawberry, Lemon and Mango sit in folding chairs (backs from behind, three-quarter faces from the TV end), Strawberry at the
 * end of the row next to the door. The TV plays the mandatory training video: Mr. Artichoke narrates from a corporate-training set (desk, plant, a crooked poster) on a laggy feed, inside a player (title,
 * PROCTORED badge, a play bar whose progress strip is stuck at 99 percent with -3:59:51, a pause icon) with a proctor window: Strawberry's webcam, a frame that is green while her eyes are on the screen and red
 * when they are not, Binder's gaze dot.
 *
 * Shots (scene-local seconds): see SHOTS below. Cues: callconnect 0.3 (the TV joins), textding 6.55 (the call light chimes: she looks), glitch 10.94 (the feed slices), sting 22.45.
 * (room coordinates: xr right when facing the TV, y up, zr toward the TV wall; fwd = the camera behind the audience, rev = the camera at the TV end looking back: X = -xr, Z = ZTV - zr)
 */
(() => {
if (!window.TIMELINE_EP17 || !window.H6 || !window.S6 || !window.V2 || !window.SH15 || !window.A15 || !window.UI) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, SH15 = window.SH15;
const S6 = window.S6, PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP17, SCN = TLX.scenes.find(s => s.id === 'video'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'video') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
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
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
/* the sound cues of the scene (scene-local seconds; python3 /tmp/shift_tools/cues.py 17 video), snapped to the video frame nearest each */
const CUE = { connect: .3, ding: 6.549, glitch: 10.941, sting: 22.448 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);
const T_PAUSE = snapT(7.54), T_RESUME = snapT(9.04);      /* the video pauses when Binder says "Looking away pauses the video!", resumes when Mr. Artichoke speaks again */

// ------------------------------------------------------------------ the room: ROOM coordinates mapped through the shot's direction
const RM = { hw: 900, ch: 900, zTV: 1500, zRear: -1100, rail: 150 };
const D = { dir: 'f' };                                                      /* 'f' (behind the audience, looking at the TV) or 'r' (from the TV end, looking back) */
const mapX = xr => D.dir === 'f' ? xr : -xr;
const mapZ = zr => D.dir === 'f' ? zr : RM.zTV - zr;
const P = (xr, y, zr) => V2.p2(mapX(xr), y, mapZ(zr));
const kAt = zr => V2.P.f / (mapZ(zr) - V2.P.cz);
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
const wallR = (side, y0, y1, z0, z1, fill, stroke, lw) => polyR([[side * RM.hw, y0, z0], [side * RM.hw, y1, z0], [side * RM.hw, y1, z1], [side * RM.hw, y0, z1]], fill, stroke, lw);
function boxR(xa, xb, y0, y1, za, zb, o) {
  const xs = [mapX(xa), mapX(xb)].sort((a, b) => a - b), zs = [mapZ(za), mapZ(zb)].sort((a, b) => a - b);
  return S6.box3(Object.assign({ x0: xs[0], x1: xs[1], y0, y1, z0: zs[0], z1: zs[1] }, o));
}
const ROOMC = { wall: '#b39d7e', wain: '#52705f', floorA: '#8f7a58', floorB: '#715e42', ceil: '#8f8c87', fog: '#1a1830' };
function shell(lt) {
  const far = D.dir === 'f' ? RM.zTV : RM.zTV - RM.zRear;
  S6.shell({ zb: far, hw: RM.hw, ch: RM.ch, rail: RM.rail, wall: ROOMC.wall, wain: ROOMC.wain, floorA: ROOMC.floorA, floorB: ROOMC.floorB, ceil: ROOMC.ceil, fog: ROOMC.fog, fogAmt: .46, tile: 150, bright: .44 });
  const zs = D.dir === 'f' ? [-100, 360, 820, 1280] : [140, 600, 1060, 1520, 1980];
  for (const X of [-300, 300]) for (const Z of zs) if (Z > V2.P.cz + 260) S6.ceilingLamp(X, Z, RM.ch, .32, '255,226,176', 110, 190);
}
const facing = (x0, x1, y0, y1, zr) => { const a = P(x0, y1, zr), b = P(x1, y0, zr); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) }; };
const flatR = (x0, x1, y0, y1, zr, fill, stroke, lw, r = 0) => { const q = facing(x0, x1, y0, y1, zr); if (depthOf(zr) < 140) return q; if (r) { rr(q.x, q.y, q.w, q.h, r * kAt(zr)); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } } else polyR([[x0, y0, zr], [x1, y0, zr], [x1, y1, zr], [x0, y1, zr]], fill, stroke, lw); return q; };
function dress(str, xr, y, zr, o = {}) {
  if (depthOf(zr) < 140) return;
  const k = kAt(zr), [x, yy] = P(xr, y, zr), size = (o.size || 40) * k;
  if (size < 7) return;
  UI.label(str, x, yy, Object.assign({ size, hero: false, crop: true, weight: 900 }, o, { size }));
}

// ------------------------------------------------------------------ the TV wall: corkboard, a clock at ten to ten, the picture and the plant, a MANDATORY sign over the TV
function tvWall(lt) {
  const z = RM.zTV - 4;
  { const x0 = -840, x1 = -520, y0 = 300, y1 = 600, zz = z;
    flatR(x0 - 14, x1 + 14, y0 - 14, y1 + 14, zz, '#7a5a3c', 'rgba(25,16,30,.6)', 2, 6);
    flatR(x0, x1, y0, y1, zz, '#c9a06a', 'rgba(40,24,16,.5)', 1.5, 4);
    const notes = [[-815, 520, -700, 580, '#fff6d8', '#d6202e'], [-680, 530, -560, 585, '#ffffff', '#2a5ac8'], [-810, 420, -690, 495, '#e9f5ff', '#3a9a5a'], [-665, 410, -545, 500, '#fff0f0', '#e8852a'], [-760, 320, -600, 392, '#fffbe0', '#7a3fb0']];
    notes.forEach(([a, b, c, d, f, hi]) => {
      flatR(a, c, b, d, zz, f, 'rgba(60,40,20,.45)', 1, 2);
      flatR(a + 3, c - 3, d - 14, d - 3, zz, hi, null, 0);
      for (let j = 0; j < 3; j++) polyR([[a + 10, b + 14 + j * 15, zz], [c - 10 - (j % 2) * 18, b + 14 + j * 15, zz], [c - 10 - (j % 2) * 18, b + 16 + j * 15, zz], [a + 10, b + 16 + j * 15, zz]], 'rgba(40,40,60,.38)');
    });
    dress('ACTIVITIES', -680, 632, zz, { size: 34, fill: '#fff6d8', stroke: '#5a3a22', lw: 5 });
  }
  { const k = kAt(z); if (k * 46 > 6) S6.wallClock(mapX(-680), 740, z - 2, 1, 50, 9, 46); }
  flatR(560, 790, 470, 650, z, '#6b4a2a', 'rgba(25,16,30,.6)', 2, 5);
  { const q = flatR(576, 774, 486, 634, z, '#27345e', null, 0, 3); ctx.save(); ctx.beginPath(); ctx.rect(q.x, q.y, q.w, q.h); ctx.clip();
    ctx.fillStyle = '#3d5c4a'; ctx.beginPath(); ctx.moveTo(q.x, q.y + q.h * .62); ctx.quadraticCurveTo(q.x + q.w * .3, q.y + q.h * .5, q.x + q.w * .6, q.y + q.h * .6); ctx.quadraticCurveTo(q.x + q.w * .85, q.y + q.h * .66, q.x + q.w, q.y + q.h * .55); ctx.lineTo(q.x + q.w, q.y + q.h); ctx.lineTo(q.x, q.y + q.h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e2b0'; ell(q.x + q.w * .78, q.y + q.h * .22, q.w * .07, q.w * .07); ctx.fill(); ctx.restore(); }
  S6.plant3(mapX(690), z - 60, 1.2);
}
function banner(lt) {
  const z = RM.zTV - 6, sway = Math.sin(lt * .9) * .004;
  const [ax, ay] = P(-470, 888, z), [bx, by] = P(470, 888, z), k = kAt(z);
  ctx.save(); ctx.translate((ax + bx) / 2, (ay + by) / 2); ctx.rotate(-.012 + sway); ctx.translate(-(ax + bx) / 2, -(ay + by) / 2);
  const bw = bx - ax, bh = 96 * k, cx = (ax + bx) / 2, cy = ay + bh * .55;
  ctx.strokeStyle = 'rgba(70,50,30,.8)'; ctx.lineWidth = Math.max(1.5, 2 * k); ctx.beginPath(); ctx.moveTo(ax, ay - 30 * k); ctx.lineTo(ax + 20 * k, cy - bh / 2); ctx.moveTo(bx, by - 30 * k); ctx.lineTo(bx - 20 * k, cy - bh / 2); ctx.stroke();
  ctx.save(); ctx.shadowColor = 'rgba(10,10,30,.4)'; ctx.shadowBlur = 8 * k; ctx.shadowOffsetY = 4 * k; ctx.fillStyle = '#e4ecef'; rr(ax + 14 * k, cy - bh / 2, bw - 28 * k, bh, 8 * k); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = Math.max(2, 5 * k); rr(ax + 22 * k, cy - bh / 2 + 8 * k, bw - 44 * k, bh - 16 * k, 5 * k); ctx.stroke();
  UI.label('MANDATORY TRAINING', cx, cy, { size: 64 * k, font: 'Bangers', weight: 400, fill: '#14683f', stroke: '#e4ecef', lw: 0, spacing: 8 * k, hero: false, crop: true });
  ctx.restore();
}

// ------------------------------------------------------------------ the side walls: night windows on the right; on the left the open door onto the corridor (the call light) and a bookcase
const NIGHT = { skyTop: '#141c3a', skyBot: '#33437a' };
function windowsWall(lt) {
  const s = 1, X = s * RM.hw;
  for (const [z0, z1] of [[300, 720], [880, 1300]]) {
    wallR(s, 130, 640, z0 - 24, z1 + 24, '#cfc4ac', 'rgba(25,16,30,.55)', 2.4);
    const sky = [P(s * RM.hw, 140, z0), P(s * RM.hw, 630, z1)], okD = depthOf(z0) > 160 && depthOf(z1) > 160;
    wallR(s, 150, 620, z0, z1, okD ? V2.grad(0, Math.min(sky[0][1], sky[1][1]), 0, Math.max(sky[0][1], sky[1][1]), [[0, NIGHT.skyTop], [1, NIGHT.skyBot]]) : NIGHT.skyTop);
    for (let i = 0; i < 6; i++) { const zz = lerp(z0 + 30, z1 - 30, hash(i * 3.1 + z0)), yy = 330 + 270 * hash(i * 5.3 + z0); polyR([[X, yy, zz], [X, yy + 5, zz], [X, yy + 5, zz + 5], [X, yy, zz + 5]], 'rgba(255,255,230,.8)'); }
    for (const f of [.5]) { const zz = lerp(z0, z1, f); polyR([[X, 150, zz - 6], [X, 620, zz - 6], [X, 620, zz + 6], [X, 150, zz + 6]], '#cfc4ac'); }
    polyR([[X, 385 - 6, z0], [X, 385 + 6, z0], [X, 385 + 6, z1], [X, 385 - 6, z1]], '#cfc4ac');
    wallR(s, 118, 132, z0 - 40, z1 + 40, '#bdb299', 'rgba(25,16,30,.5)', 2);
    wallR(s, 110, 690, z0 - 70, z0 - 8, '#7c4f4a', 'rgba(60,24,20,.35)', 1.6); wallR(s, 110, 690, z1 + 8, z1 + 70, '#7c4f4a', 'rgba(60,24,20,.35)', 1.6);
  }
}
const DOOR = { z0: 300, z1: 700, h: 340 };
const callPulse = lt => .55 + .45 * Math.sin(lt * 5.2);
/* the doorway in the left wall: a frame, the lit corridor behind it (a far wall, a resident's door with the call light over it) */
function doorWall(lt) {
  const s = -1, X = s * RM.hw, { z0, z1, h } = DOOR, pk = callPulse(lt);
  wallR(s, 0, h + 34, z0 - 26, z1 + 26, '#5a3c22', 'rgba(25,16,30,.6)', 2.2);
  if (depthOf(z0) > 160 && depthOf(z1) > 160) {
    const a = P(s * RM.hw, h * .5, z0), b = P(s * RM.hw, h * .5, z1);
    wallR(s, 0, h, z0, z1, V2.grad(a[0], a[1], b[0], b[1], [[0, '#efe3c6'], [1, '#bfae8a']]), 'rgba(25,16,30,.55)', 2);
  } else wallR(s, 0, h, z0, z1, '#e6d9b8');
  /* inside: the corridor's far wall, a resident's door and the lamp over it */
  const zf = lerp(z0, z1, .72);
  wallR(s, 0, 36, z0 + 8, z1 - 8, 'rgba(60,44,30,.35)');
  wallR(s, 20, 232, zf - 54, zf + 46, '#8a6a46', 'rgba(25,16,30,.6)', 1.6);
  wallR(s, 20, 218, zf - 44, zf + 36, '#a98a62');
  const [lx, ly] = P(X, 262, zf - 4);
  if (depthOf(zf) > 160) {
    const k = kAt(zf);
    ctx.save(); ctx.fillStyle = rgba('#ff6a58', .5 + .5 * pk); ell(lx, ly, 15 * k, 11 * k); ctx.fill(); ctx.strokeStyle = 'rgba(60,10,10,.8)'; ctx.lineWidth = Math.max(1.4, 2.2 * k); ctx.stroke(); ctx.restore();
    V2.glow(lx, ly, 120 * k * (.8 + .5 * pk), '255,60,50', .55 + .4 * pk, 'screen', .3);
  }
  /* the red light spills into the room */
  if (D.dir === 'f') V2.addLight({ x: lx, y: ly + 40, r: 900, color: '255,70,60', a: .22 * pk }); else V2.addLight({ x: lx, y: ly + 40, r: 1100, color: '255,70,60', a: .26 * pk });
  /* sign: ROOM 12 on the door */
  dress('12', s * RM.hw, 150, zf - 4, { size: 40, fill: '#2a1a0c' });
}
function bookcaseWall(lt) {
  const s = -1;
  wallR(s, 0, 330, 760, 1360, '#7c5530', 'rgba(25,16,30,.55)', 2.2);
  const cols = ['#c04a3c', '#3a6bb5', '#d8b83a', '#4f9f5a', '#a76ad0', '#e08a3c', '#3aa4a4'];
  for (let r = 0; r < 2; r++) {
    const y0 = 24 + r * 156;
    wallR(s, y0, y0 + 134, 780, 1340, '#563a22');
    for (let i = 0; i < 7; i++) { const z0 = 792 + i * 78; wallR(s, y0 + 6, y0 + 6 + 70 + ((i * 7) % 3) * 16, z0, z0 + 62 - (i % 2) * 6, cols[(i + r * 3) % 7], 'rgba(25,16,30,.5)', 1.4); }
  }
}
function rug(lt) {
  const x0 = -640, x1 = 640, z0 = 120, z1 = 1240;
  polyR([[x0 - 22, 0, z0 - 22], [x1 + 22, 0, z0 - 22], [x1 + 22, 0, z1 + 22], [x0 - 22, 0, z1 + 22]], '#5d3b2c', 'rgba(25,16,30,.45)', 1.6);
  polyR([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], '#2f6069');
  polyR([[x0 + 40, 0, z0 + 40], [x1 - 40, 0, z0 + 40], [x1 - 40, 0, z1 - 40], [x0 + 40, 0, z1 - 40]], '#397780');
  polyR([[x0 + 52, 0, z0 + 52], [x1 - 52, 0, z0 + 52], [x1 - 52, 0, z1 - 52], [x0 + 52, 0, z1 - 52]], null, 'rgba(255,236,190,.35)', 2);
  for (let i = 0; i < 5; i++) { const zc = lerp(z0 + 160, z1 - 160, i / 4); polyR([[-110, 0, zc], [0, 0, zc - 52], [110, 0, zc], [0, 0, zc + 52]], i % 2 ? '#a8893f' : '#9f4f42', 'rgba(25,16,30,.3)', 1.2); }
}

// ------------------------------------------------------------------ folding chairs (steel tube, navy vinyl), as in the all-hands
const CH = { hw: 104, hd: 72, seat: 118, pad: 16, backY0: 170, backY1: 236 };
const CHC = { tube: '#6b707c', tubeTop: '#9aa0ac', vinyl: '#4a5f86', vinylTop: '#6a80a8', vinylFront: '#3d4f74', vinylSide: '#2f3e5e' };
function chairLayer(xr, zr, layer, o = {}) {
  const w = o.w ?? CH.hw, d = CH.hd, s = CH.seat, tube = { color: CHC.tube, top: CHC.tubeTop, front: '#4a4f5a', side: '#3c4049', lw: .9 };
  const vinyl = { color: CHC.vinyl, top: CHC.vinylTop, front: CHC.vinylFront, side: CHC.vinylSide, lw: 1.6 };
  if (layer === 'seat') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxR(xr + sx * (w - 10) - 3, xr + sx * (w - 10) + 3, 0, s, zr + sz * (d - 10) - 3, zr + sz * (d - 10) + 3, tube);
    { const zb = D.dir === 'f' ? zr - d + 10 : zr + d - 10, zf = zb, x0 = xr - w + 10, x1 = xr + w - 10, a = P(x0, 14, zf), b = P(x1, s - 22, zf), c = P(x1, 14, zf), e = P(x0, s - 22, zf);
      ctx.strokeStyle = '#6b707c'; ctx.lineWidth = Math.max(1.5, 5 * kAt(zr)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); }
    boxR(xr - w, xr + w, s - 2, s + CH.pad - 2, zr - d, zr + d, vinyl);
    if (D.dir === 'r') { boxR(xr - w - 2, xr + w + 2, CH.backY0, CH.backY1, zr - d + 2, zr - d + 18, vinyl); for (const sx of [-1, 1]) boxR(xr + sx * (w - 14) - 3, xr + sx * (w - 14) + 3, s + CH.pad - 2, CH.backY0, zr - d + 6, zr - d + 12, tube); }
  } else if (layer === 'back' && D.dir === 'f') {
    for (const sx of [-1, 1]) boxR(xr + sx * (w - 14) - 3, xr + sx * (w - 14) + 3, s + CH.pad - 2, CH.backY0, zr - d + 6, zr - d + 12, tube);
    boxR(xr - w - 2, xr + w + 2, CH.backY0, CH.backY1, zr - d + 2, zr - d + 18, vinyl);
  } else if (layer === 'lip' && D.dir === 'r') {
    boxR(xr - w, xr + w, s - 2, s + CH.pad - 2, zr + d - 10, zr + d, vinyl);
  }
}

// ------------------------------------------------------------------ the rolling TV cart and the TV (fwd only): the screen's rectangle is returned for the picture to paint
const TVG = { cx: 0, bot: 262, w: 720, h: 405, bez: 26 };
function tvCart(lt, paint) {
  const z = RM.zTV - 90, k = kAt(z), cx = TVG.cx, top = TVG.bot + TVG.h;
  { const [sx, sy] = P(cx, 0, z); ctx.fillStyle = 'rgba(10,8,20,.34)'; ell(sx, sy + 6 * k, 420 * k, 38 * k); ctx.fill(); }
  const steel = { color: '#4e5360', top: '#8d94a3', front: '#434856', side: '#363a46', lw: 1.4 };
  boxR(cx - 330, cx + 330, 26, 52, z - 40, z + 40, steel);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [px, py] = P(cx + sx * 300, 0, z + sz * 30); ctx.fillStyle = '#23252c'; ell(px, py - 12 * k, 16 * k, 14 * k); ctx.fill(); ctx.fillStyle = '#8a8f9a'; ell(px, py - 12 * k, 6 * k, 6 * k); ctx.fill(); }
  boxR(cx - 320, cx + 320, 236, 252, z - 44, z + 44, { color: '#5d6270', top: '#a6adbb', front: '#4a4f5c', side: '#3c404c', lw: 1.6 });
  boxR(cx - 230, cx - 40, 252, 262, z - 30, z + 30, { color: '#2c2f38', top: '#454a58', front: '#23262e', side: '#1d1f26', lw: 1.2 });
  boxR(cx + 60, cx + 290, 252, 266, z - 28, z + 28, { color: '#c9ccd6', top: '#eceef4', front: '#b8bcc8', side: '#9ca0ae', lw: 1.2 });
  { const [lx, ly] = P(cx + 250, 258, z - 28); ctx.fillStyle = '#4a9a5a'; ell(lx, ly, 3.5 * k, 3.5 * k); ctx.fill(); }
  for (const sx of [-1, 1]) boxR(cx + sx * 260 - 9, cx + sx * 260 + 9, 40, top - 30, z - 12, z + 12, steel);
  boxR(cx - 290, cx + 290, TVG.bot - 22, TVG.bot - 4, z - 14, z + 14, steel);
  const bz = TVG.bez, x0 = cx - TVG.w / 2, x1 = cx + TVG.w / 2, y0 = TVG.bot, y1 = top, zf = z - 20;
  boxR(x0 - bz, x1 + bz, y0 - bz, y1 + bz, z - 18, z + 18, { color: '#17181d', top: '#2b2d35', front: '#101116', side: '#0b0c10', lw: 2, edge: 'rgba(0,0,0,.8)' });
  const scr = facing(x0, x1, y0, y1, zf);
  boxR(cx - 70, cx + 70, y1 + bz, y1 + bz + 24, z - 16, z + 8, { color: '#1b1c22', top: '#31333c', front: '#14151a', side: '#0e0f13', lw: 1.6 });
  { const [lx, ly] = P(cx, y1 + bz + 12, z - 17); ctx.fillStyle = '#16181e'; ell(lx, ly, 9 * k, 9 * k); ctx.fill(); ctx.fillStyle = '#5a6ad8'; ell(lx, ly, 4 * k, 4 * k); ctx.fill(); const on = lt > CUE.connect; ctx.fillStyle = on ? '#58ff8c' : '#5a1e1e'; ell(lx + 40 * k, ly, 3.2 * k, 3.2 * k); ctx.fill(); if (on) V2.emit(lx + 40 * k, ly, 26 * k, '90,255,150', .5); }
  if (paint) paint(scr);
  return scr;
}
function tvCable() {
  const z = RM.zTV - 90, [ax, ay] = P(TVG.cx + 330, 250, z), [bx, by] = P(860, 40, RM.zTV - 40), [mx, my] = P(520, 0, z - 160);
  ctx.strokeStyle = '#1b1c22'; ctx.lineWidth = Math.max(2, 5 * kAt(z)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.bezierCurveTo(ax + 20, my + 40, mx - 60, my + 30, mx, my); ctx.bezierCurveTo(mx + 120, my - 6, bx - 40, by + 20, bx, by); ctx.stroke();
}

// ------------------------------------------------------------------ hero-text helpers for anything drawn in a scaled frame (the TV): hero only when it is big enough and wholly in the safe area
const scaleNow = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };
function safeBox(x0, y0, x1, y1, mg = 44) {
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}
function tvLabel(str, cx, cy, o = {}) {
  const sc = scaleNow(), size = o.size || 40, ink = UI.sizeOf(str, { size, weight: o.weight || 900, font: o.font });
  const x0 = o.align === 'left' ? cx : o.align === 'right' ? cx - ink.w : cx - ink.w / 2;
  const hero = o.hero !== false && size * sc >= 31 && safeBox(x0, cy - size * .4, x0 + ink.w, cy + size * .4, 44);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: !hero }));
}

// ------------------------------------------------------------------ the video: the feed's clock (stops while paused, stutters in the glitch), Mr. Artichoke's acting, the training set
const paused = lt => lt >= T_PAUSE && lt < T_RESUME;
function vclock(lt) {   /* the feed's own time: the pause holds it, the glitch stutters it (4 fps for a moment, then a jump) */
  let t = lt;
  if (lt >= T_RESUME) t -= (T_RESUME - T_PAUSE); else if (lt >= T_PAUSE) t = T_PAUSE;
  if (lt >= CUE.glitch && lt < CUE.glitch + 1.0) t = Math.floor(t * 5) / 5 - .15 * sg(lt, CUE.glitch, CUE.glitch + .3);
  return t;
}
const TV = { w: 1280, h: 720 };
/* arm poses as [shoulder, elbow] (rest .28 .25, open 1.6 .08, hands together .78 .95): the narration gestures follow the lines */
function artiArms(lt) {
  const talk = (a, b) => lt >= a && lt < b ? 1 : 0, w = (f, p) => .5 + .5 * Math.sin(lt * f + p);
  const sp = Math.max(talk(bS('ar1'), bE('ar1')), talk(bS('ar2'), bE('ar2')), talk(bS('ar3'), bE('ar3')), talk(bS('ar4'), bE('ar4')));
  let r = K([[0, [.28, .25]], [1.0, [.28, .25]], [1.5, [1.25, .3]], [4.5, [1.25, .3]], [4.9, [1.3, .28]], [9.0, [1.3, .28]], [9.4, [1.0, .35]], [13.6, [1.0, .35]], [14.0, [1.7, .1]], [16.0, [1.7, .1]], [16.5, [.28, .25]], [17.3, [.28, .25]], [17.9, [.78, .95]], [30, [.78, .95]]], lt);
  let l = K([[0, [.28, .25]], [1.4, [.28, .25]], [2.0, [.72, .38]], [4.5, [.72, .38]], [4.9, [.28, .25]], [9.2, [.28, .25]], [9.8, [.8, .4]], [11.6, [.8, .4]], [12.2, [.28, .25]], [13.8, [.28, .25]], [14.3, [1.1, .3]], [16, [1.1, .3]], [16.5, [.28, .25]], [17.3, [.28, .25]], [17.9, [.78, .95]], [30, [.78, .95]]], lt);
  if (sp && lt < 17.3) { r = [r[0] + .22 * Math.sin(lt * 4.1), r[1] + .12 * Math.sin(lt * 3.3)]; l = [l[0] + .16 * Math.sin(lt * 3.4 + 1), l[1]]; }
  void w;
  return { l, r };
}
function trainingBack(lt) {   /* the corporate-training set behind him, drawn at the TV's 1280 x 720 */
  ctx.fillStyle = lg(0, 0, 0, 720, [[0, '#2f6b73'], [1, '#1d4a53']]); ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 22; i++) ctx.fillRect(i * 60, 0, 6, 720);
  /* a window of night, a crooked poster, a shelf */
  ctx.fillStyle = lg(0, 90, 0, 330, [[0, '#142a4a'], [1, '#3a5a8a']]); rr(760, 90, 190, 230, 10); ctx.fill(); ctx.strokeStyle = '#efe6d0'; ctx.lineWidth = 10; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(855, 90); ctx.lineTo(855, 320); ctx.moveTo(760, 205); ctx.lineTo(950, 205); ctx.stroke();
  const ph = lt > 1.2 && !paused(lt) && !(lt >= T_RESUME && lt < T_RESUME + .2) && !(lt >= CUE.glitch && lt < CUE.glitch + .9);   /* the poster's lettering is hero only while nothing is over it */
  ctx.save(); ctx.translate(176, 330); ctx.rotate(-.07);
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.fillStyle = '#f7f1dc'; rr(-170, -170, 340, 340, 12); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 8; rr(-156, -156, 312, 312, 8); ctx.stroke();
  ctx.fillStyle = '#3f9a5c'; ctx.beginPath(); ctx.ellipse(0, -96, 22, 34, .5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1f5a36'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -70); ctx.lineTo(12, -122); ctx.stroke();
  tvLabel('YOUR BREAK', 0, -22, { size: 52, weight: 900, fill: '#103a2c', maxW: 300, hero: ph }); tvLabel('IS IMPORTANT', 0, 40, { size: 48, weight: 900, fill: '#103a2c', maxW: 300, hero: ph }); tvLabel('TO US', 0, 102, { size: 52, weight: 900, fill: '#b3261e', maxW: 300, hero: ph });
  ctx.restore();
}
function trainingFront(lt) {   /* the desk in front of him and the plant */
  ctx.fillStyle = '#7a4f2a'; ctx.fillRect(0, 560, 1280, 160); ctx.fillStyle = lg(0, 560, 0, 600, [[0, '#a8743e'], [1, '#7a4f2a']]); ctx.fillRect(0, 560, 1280, 34);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, 594, 1280, 6);
  ctx.fillStyle = '#c9a15e'; rr(430, 566, 230, 30, 4); ctx.fill();
  /* the plant */
  ctx.fillStyle = '#b9703a'; rr(1090, 440, 100, 120, 10); ctx.fill(); ctx.fillStyle = '#9a5a2c'; ctx.fillRect(1090, 440, 100, 18);
  ctx.fillStyle = '#4f8f45'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(1140 + (i - 3) * 20, 380 - Math.abs(i - 3) * -10 - 24 - (i % 2) * 20, 22, 70, (i - 3) * .28, 0, TAU); ctx.fill(); }
}
function artiTile(lt) {
  const vt = vclock(lt), fz = paused(lt), gl = lt >= CUE.glitch && lt < CUE.glitch + .9 ? { k: 1 - sg(lt, CUE.glitch, CUE.glitch + .9), y: .46, h: .13, dx: 34 + 22 * Math.sin(lt * 31), seed: Math.floor(lt * 12) } : null;
  const arms = artiArms(vt), s = 2.0, x = 700 + (fz ? 0 : Math.sin(vt * .9) * 3);
  const happy = lt >= bS('ar4') - .05 && lt < bE('ar4') + .5;
  REG.suppress++;
  try {
    const o = A15.artichoke({ x, y: 500, s, noLegs: true, anchor: 'centre', peel: 0, t: vt, frozen: fz, frozenAt: T_PAUSE, expr: happy ? 'arti_warm' : 'arti_ceo', arms, look: [0, 0] });
    if (gl) o.glitch = gl;
    A15.draw(o);
  } finally { REG.suppress--; }
}

// ------------------------------------------------------------------ the player: title, PROCTORED badge, the proctor window (Strawberry's webcam), the play bar stuck at 99 percent, the pause icon, the lower thirds
const awayAt = lt => K([[0, 0], [6.55, 0], [6.8, 1], [8.55, 1], [8.9, 0], [40, 0]], lt);      /* how far Strawberry's eyes are off the screen (toward the door) */
const PR = { x: 902, y: 92, w: 340, h: 236 };                                                  /* the proctor window, in TV coordinates */
const BAR = { x0: 130, x1: 1000, y: 664 };
function proctor(lt, sh) {
  const away = awayAt(lt), red = away > .5, pk = .5 + .5 * Math.sin(lt * 9), col = red ? '#ff3b30' : '#34d17a';
  ctx.save();
  if (red) V2.glow(PR.x + PR.w / 2, PR.y + PR.h / 2, 230, '255,60,48', .3 + .25 * pk, 'screen', .3);
  rr(PR.x - 8, PR.y - 8, PR.w + 16, PR.h + 16, 18); ctx.fillStyle = col; ctx.fill();
  rr(PR.x, PR.y, PR.w, PR.h, 12); ctx.save(); ctx.clip();
  ctx.fillStyle = lg(0, PR.y, 0, PR.y + PR.h, [[0, '#2a2f42'], [1, '#14161f']]); ctx.fillRect(PR.x, PR.y, PR.w, PR.h);
  ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(PR.x + 40 + i * 70, PR.y + 60 + (i % 2) * 40, 26, 0, TAU); ctx.fill(); }
  REG.suppress++;
  try {
    const st = A11.straw({ x: PR.x + PR.w / 2 + 6 * away, y: PR.y + PR.h + 58, s: .98, noLegs: true, noShadow: true, noReflect: true, t: lt, yaw: .0, headYaw: away * 1.0, look: [away * .9, .05], expr: red ? 'sour' : 'dead', lid: red ? undefined : .5, arms: { l: 'rest', r: 'rest' } });
    drawChar(st);
  } finally { REG.suppress--; }
  /* Binder's gaze dot: a reticle on the screen's plane (green when on it, red and off to the side when not) */
  { const gx = PR.x + PR.w / 2 + 6 * away + away * 118, gy = PR.y + 118 + away * 6;
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(gx, gy, 30, 0, TAU); ctx.moveTo(gx - 40, gy); ctx.lineTo(gx - 20, gy); ctx.moveTo(gx + 20, gy); ctx.lineTo(gx + 40, gy); ctx.moveTo(gx, gy - 40); ctx.lineTo(gx, gy - 20); ctx.moveTo(gx, gy + 20); ctx.lineTo(gx, gy + 40); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(gx, gy, 7 + (red ? 2 * pk : 0), 0, TAU); ctx.fill(); }
  /* the proctor's name bar with its mascot */
  ctx.fillStyle = 'rgba(8,14,18,.7)'; ctx.fillRect(PR.x, PR.y, PR.w, 44);
  REG.suppress++; try { drawChar(A15.binderSmall({ x: PR.x + 28, y: PR.y + 24, s: .2, center: true, noLegs: true, who: 'bind', t: lt, pose: 'rest', grin: .6, look: [away * .6, 0], hover: 0 })); } finally { REG.suppress--; }
  tvLabel('PROCTOR: BINDER', PR.x + 56, PR.y + 23, { size: 28, weight: 900, fill: '#fff', align: 'left', maxW: 270 });
  ctx.restore();
  /* the status pill under the window */
  const lab = 'EYES ON SCREEN', pw = 330, py = PR.y + PR.h + 22;
  rr(PR.x + (PR.w - pw) / 2, py, pw, 54, 27); ctx.fillStyle = red ? '#d93025' : '#103a2c'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.stroke();
  tvLabel(lab, PR.x + PR.w / 2, py + 27, { size: 34, weight: 900, fill: red ? '#fff' : '#9fe8bf', maxW: pw - 30, alpha: red ? .6 + .4 * pk : 1 });
  ctx.restore();
}
function playBar(lt, sh, big) {
  const fz = paused(lt), prog = .99, hx = BAR.x0 + (BAR.x1 - BAR.x0) * prog;
  ctx.fillStyle = 'rgba(8,14,18,.74)'; rr(30, 620, 1220, 80, 20); ctx.fill();
  /* play / pause control */
  ctx.fillStyle = '#fff';
  if (fz) { ctx.beginPath(); ctx.moveTo(62, 646); ctx.lineTo(62, 676); ctx.lineTo(90, 661); ctx.closePath(); ctx.fill(); } else { rr(62, 646, 10, 30, 3); ctx.fill(); rr(80, 646, 10, 30, 3); ctx.fill(); }
  rr(BAR.x0, BAR.y - 10, BAR.x1 - BAR.x0, 20, 10); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
  rr(BAR.x0, BAR.y - 10, hx - BAR.x0, 20, 10); ctx.fillStyle = '#2fd07c'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, BAR.y, 13, 0, TAU); ctx.fill();
  const sp = fz ? 0 : lt * 6.2;   /* the spinner circling the head: it is buffering at 99 percent, and it stops with the picture */
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(hx, BAR.y, 25, sp, sp + 4.2); ctx.stroke();
  tvLabel('-3:59:51', 1204, BAR.y, { size: 42, weight: 900, fill: '#fff', align: 'right', maxW: 170 });
  /* Binder on "Ninety-nine percent complete!": he pops up over the head of the strip */
  { const bk = sg(lt, bS('b3') - .05, bS('b3') + .2) * (1 - sg(lt, bE('b3') + .3, bE('b3') + .6)); if (bk > .01) { REG.suppress++; try { drawChar(A15.binderSmall({ x: hx - 150, y: BAR.y - 118 - 14 * Math.sin(lt * 5), s: .62 * eb(bk), center: true, noLegs: true, who: 'bind', t: lt, pose: 'cheer', grin: .8, look: [.5, .3], hover: 0 })); } finally { REG.suppress--; } } }
  /* the 99% chip over the head */
  const cw = 108, cx = hx - 4, cy = BAR.y - 56;
  rr(cx - cw / 2, cy - 24, cw, 48, 24); ctx.fillStyle = '#2fd07c'; ctx.fill();
  tvLabel('99%', cx, cy, { size: 40, weight: 900, fill: '#0b2418', maxW: cw - 16 });
}
function lowerThird(lt, str, t0, t1, fill, ink, y = 512) {
  if (lt < t0 || lt > t1) return;
  const a = Math.min(sg(lt, t0, t0 + .3), 1 - sg(lt, t1 - .25, t1)), sz = 46, w = UI.sizeOf(str, { size: sz, weight: 900 }).w + 80, x = lerp(-w, 36, eo(sg(lt, t0, t0 + .3)));
  ctx.save(); ctx.globalAlpha *= a; rr(x, y, w, 78, 14); ctx.fillStyle = fill; ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.fillRect(x, y, 10, 78);
  tvLabel(str, x + 40, y + 39, { size: sz, weight: 900, fill: ink, align: 'left', maxW: w - 60 });
  ctx.restore();
}
function tvJoining(lt) {
  ctx.fillStyle = lg(0, 0, 0, 720, [[0, '#0c1c2c'], [1, '#17394d']]); ctx.fillRect(0, 0, 1280, 720);
  const t = lt - CUE.connect;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - t * 5.4, al = ((i / 12 - t * .9) % 1 + 1) % 1; ctx.fillStyle = rgba('#bfe6ff', .18 + .82 * (1 - al)); ctx.beginPath(); ctx.arc(640 + Math.cos(a) * 86, 300 + Math.sin(a) * 86, 12, 0, TAU); ctx.fill(); }
  tvLabel('Connecting...', 640, 470, { size: 84, weight: 900, fill: '#eaf6ff' });
  tvLabel('Module 7: Break Safety', 640, 120, { size: 44, weight: 800, fill: '#8fb8d2' });
}
function tvPlayer(lt, sh) {
  const fz = paused(lt);
  trainingBack(lt); artiTile(lt); trainingFront(lt);
  if (fz) { ctx.fillStyle = 'rgba(10,16,24,.34)'; ctx.fillRect(0, 0, 1280, 720); }
  /* title and the badge */
  if (sh.id !== 'bar') {
    ctx.fillStyle = 'rgba(8,14,18,.62)'; rr(36, 30, 480, 70, 16); ctx.fill();
    tvLabel('BREAK SAFETY', 276, 65, { size: 46, weight: 900, fill: '#fff', spacing: 3, maxW: 450 });
    ctx.fillStyle = 'rgba(8,14,18,.62)'; rr(36, 106, 230, 44, 14); ctx.fill();
    ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(62, 128, 8 + 2 * Math.sin(lt * 6), 0, TAU); ctx.fill();
    tvLabel('PROCTORED', 82, 128, { size: 30, weight: 900, fill: '#ffd0cc', align: 'left', maxW: 170 });
  }
  if (sh.id !== 'bar') proctor(lt, sh);
  lowerThird(lt, 'YOUR BREAK: 11:00 PM', 14.35, 16.1, '#ffd23f', '#2a1c04');
  lowerThird(lt, 'FEEDBACK RECEIVED: PENDING', 17.75, 19.5, '#103a2c', '#fff');
  playBar(lt, sh);
  if (fz || (lt >= T_RESUME && lt < T_RESUME + .15)) {   /* the big pause icon pops on, and goes with the resume */
    const u = fz ? eb(sg(lt, T_PAUSE, T_PAUSE + .2)) : 1 - sg(lt, T_RESUME, T_RESUME + .15);
    ctx.save(); ctx.globalAlpha *= Math.min(1, u * 1.5); ctx.translate(176, 330); ctx.scale(u, u);
    ctx.fillStyle = 'rgba(8,14,18,.78)'; ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#fff'; rr(-40, -52, 28, 104, 6); ctx.fill(); rr(12, -52, 28, 104, 6); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= Math.min(1, u * 1.5); tvLabel('PAUSED', 176, 478, { size: 56, weight: 900, fill: '#fff', spacing: 6 }); ctx.restore();
  }
  /* the glitch: coloured slices over the whole picture while the feed breaks up */
  if (lt >= CUE.glitch && lt < CUE.glitch + .9) {
    const k = 1 - sg(lt, CUE.glitch, CUE.glitch + .9);
    ctx.save(); for (let i = 0; i < 9; i++) { const y = hash(i * 7.7 + Math.floor(lt * 14)) * 640, h = 6 + hash(i * 3.3 + Math.floor(lt * 14)) * 40; ctx.fillStyle = i % 2 ? 'rgba(255,60,90,' + (.22 * k) + ')' : 'rgba(60,220,255,' + (.2 * k) + ')'; ctx.fillRect(0, y, 1280, h); } ctx.restore();
  }
}
const tvBright = lt => lt < CUE.connect ? .05 : lt < .95 ? .5 : paused(lt) ? .62 : .95;
function paintTV(lt, scr, sh) {
  const k = scr.w / 1280;
  ctx.save(); ctx.beginPath(); ctx.rect(scr.x, scr.y, scr.w, scr.h); ctx.clip();
  ctx.translate(scr.x, scr.y); ctx.scale(k, k);
  if (lt < CUE.connect) { ctx.fillStyle = '#07090c'; ctx.fillRect(0, 0, 1280, 720); ctx.fillStyle = rgba('#2a3a4a', .55 + .25 * Math.sin(lt * 3)); ell(640, 360, 7, 7); ctx.fill(); }
  else if (lt < .95) tvJoining(lt);
  else tvPlayer(lt, sh);
  if (lt >= CUE.connect && lt < CUE.connect + .22) { ctx.fillStyle = rgba('#e8f6ff', .9 * (1 - sg(lt, CUE.connect, CUE.connect + .22))); ctx.fillRect(0, 0, 1280, 720); }
  if (lt >= .95 && lt < 1.15) { ctx.fillStyle = rgba('#e8f6ff', .5 * (1 - sg(lt, .95, 1.15))); ctx.fillRect(0, 0, 1280, 720); }
  ctx.restore();
  if (!sh.tvHero) {
    ctx.save(); ctx.beginPath(); ctx.rect(scr.x, scr.y, scr.w, scr.h); ctx.clip(); ctx.fillStyle = lg(scr.x, scr.y, scr.x + scr.w * .5, scr.y + scr.h, [[0, 'rgba(255,255,255,.08)'], [.45, 'rgba(255,255,255,.02)'], [1, 'rgba(255,255,255,0)']]);
    ctx.beginPath(); ctx.moveTo(scr.x, scr.y); ctx.lineTo(scr.x + scr.w * .55, scr.y); ctx.lineTo(scr.x + scr.w * .22, scr.y + scr.h); ctx.lineTo(scr.x, scr.y + scr.h); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
function tvGlow(lt, sh) {
  const b = tvBright(lt), fl = lt >= CUE.glitch && lt < CUE.glitch + .9 ? .25 * Math.sin(lt * 40) : 0;
  if (D.dir === 'f') {
    const [x, y] = P(TVG.cx, TVG.bot + TVG.h / 2, RM.zTV - 110), k = kAt(RM.zTV - 110);
    V2.glow(x, y, 640 * k * (1 + fl * .3), '150,196,255', .3 * b, 'screen', .5);
    V2.addLight({ x, y: y + 160, r: 1400, color: '150,196,255', a: .55 * b });
  } else V2.addLight({ x: W + 160, y: 700, r: 1500, color: '150,196,255', a: .5 * b });
}

// ------------------------------------------------------------------ the corridor beyond the door (an insert: the whip lands here): doors both sides, one call light pulsing red over a resident's door
const COR = { hw: 170, ch: 330, zb: 2300 };
function corridorWorld(lt) {
  const hw = COR.hw, pk = callPulse(lt);
  D.dir = 'f';
  S6.shell({ zb: COR.zb, hw, ch: COR.ch, rail: 120, wall: '#d4cab0', wain: '#6c8f7e', floorA: '#bdb292', floorB: '#a39877', ceil: '#d9d4c8', fog: '#2c2a3a', fogAmt: .42, tile: 100, bright: .7 });
  for (const Z of [300, 900, 1500, 2100]) S6.ceilingLamp(0, Z, COR.ch, .5, '255,226,176', 70, 120);
  const door = (side, z0, z1) => {
    polyW([[side * hw, 0, z0 - 12], [side * hw, 262, z0 - 12], [side * hw, 262, z1 + 12], [side * hw, 0, z1 + 12]], '#5a3c22', 'rgba(25,16,30,.55)', 1.6);
    polyW([[side * hw, 0, z0], [side * hw, 250, z0], [side * hw, 250, z1], [side * hw, 0, z1]], '#a98a62', 'rgba(25,16,30,.5)', 1.4);
    polyW([[side * hw, 120, z1 - 26], [side * hw, 132, z1 - 26], [side * hw, 132, z1 - 14], [side * hw, 120, z1 - 14]], '#d8c27a');
  };
  for (const [a, b] of [[420, 560], [900, 1040], [1380, 1520], [1860, 2000]]) door(1, a, b);
  for (const [a, b] of [[640, 780], [1120, 1260], [1600, 1740]]) door(-1, a, b);
  /* the call light over the door at z 1120..1260 on the left wall: a red dome, a glow, its light on the door and the floor */
  const zl = 1190, [lx, ly] = V2.p2(-hw + 6, 292, zl), kk = V2.P.f / (zl - V2.P.cz);
  polyW([[-hw, 262, 1100], [-hw, 330, 1100], [-hw, 330, 1280], [-hw, 262, 1280]], 'rgba(255,60,50,' + (.1 + .16 * pk) + ')');
  polyW([[-hw, 0, 1060], [hw * .3, 0, 1060], [hw * .3, 0, 1340], [-hw, 0, 1340]], 'rgba(255,60,50,' + (.05 + .09 * pk) + ')');
  ctx.save(); ctx.fillStyle = rgba('#ff6a58', .55 + .45 * pk); ell(lx, ly, 30 * kk, 22 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(60,10,10,.85)'; ctx.lineWidth = Math.max(1.5, 4 * kk); ctx.stroke(); ctx.restore();
  V2.glow(lx, ly, 300 * kk * (.8 + .4 * pk), '255,60,50', .6 + .4 * pk, 'screen', .3);
  const ph = (lt * .9) % 1; V2.ring(lx, ly, ph, { r0: 20 * kk, r1: 260 * kk, color: '255,90,80', lw: 4, alpha: .7 * (1 - ph) });
  V2.addLight({ x: lx, y: ly + 100, r: 1200, color: '255,70,60', a: .3 * pk });
}

// ------------------------------------------------------------------ the cast: seats and the turn conventions
const ROW1 = 450, ROW2 = 850;
const SEATX = { straw: -300, lemon: -60, mango: 180 };                       /* xr: the room's left (the door side) to its right; Strawberry's chair is the end one, next to the door */
const NEUT = () => D.dir === 'f' ? PI : .42;
const turnTo = psi => NEUT() - psi;                                           /* psi: the turn toward the room's right: negative = toward the door */
function seatOpts(xr, zr, k = .9) {
  const X = mapX(xr), Z = mapZ(zr), q = V2.at(X, Z), y = V2.p2(X, CH.seat + CH.pad - 6, Z)[1];
  return { x: q.x, y, s: q.s * k, noLegs: true, noShadow: true, noReflect: true, plant: true };
}
const GRIP = () => D.dir === 'f' ? { l: [26, 14], r: [-26, 14] } : { l: [-26, 14], r: [26, 14] };
function defined(a, b) { if (b) for (const k in b) if (b[k] !== undefined) a[k] = b[k]; return a; }
const ACT = {};
ACT.straw = lt => {
  const psiH = K([[0, 0], [6.5, 0], [6.85, -1.0], [8.55, -1.0], [8.95, 0], [16.3, 0], [16.5, .12], [17.2, .1], [17.5, 0], [30, 0]], lt);
  const away = awayAt(lt) > .5, s2 = lt >= bS('s2') && lt < bE('s2') + .3, s3 = lt >= bS('s3') - .05;
  const sigh = lt > 8.9 && lt < 9.5 ? 4 * Math.sin(PI * sg(lt, 8.9, 9.5)) : 0;
  return { psiB: psiH * .35, psiH, dy: sigh, o: { expr: away ? 'neutral' : s2 ? 'sour' : 'dead', look: [away ? -.5 : 0, 0], lid: away ? undefined : s2 ? .55 : s3 ? .42 : .5 } };
};
ACT.lemon = lt => {
  const psiH = K([[0, 0], [12.0, 0], [12.25, -.75], [13.5, -.7], [13.85, 0], [30, 0]], lt);
  const l1 = lt >= bS('l1') && lt < bE('l1');
  return { psiB: psiH * .3, psiH, o: { expr: l1 ? 'sour' : lt > 17.4 && lt < 19.5 ? 'sad' : 'neutral', look: [0, 0] } };
};
ACT.mango = lt => {
  const nod = lt < CUE.glitch ? 5 * Math.max(0, Math.sin(lt * 1.3)) ** 3 : 0, jolt = lt >= CUE.glitch && lt < CUE.glitch + .45 ? 7 * Math.exp(-(lt - CUE.glitch) * 7) : 0;
  const psiH = K([[0, 0], [10.9, 0], [11.1, .35], [11.8, .3], [12.3, 0], [30, 0]], lt);
  return { psiB: psiH * .3, psiH, dy: nod - jolt, o: { expr: lt >= CUE.glitch && lt < CUE.glitch + 1.0 ? 'shock' : 'neutral', look: [0, 0], lid: lt < CUE.glitch ? .38 : lt > 12.5 ? .4 : undefined } };
};
function person(name, lt) {
  const base = { mango: [A7.mango, SEATX.mango], lemon: [A7.lemon, SEATX.lemon], straw: [A11.straw, SEATX.straw] }[name];
  const a = ACT[name] ? ACT[name](lt) : {};
  const o = defined(Object.assign(seatOpts(base[1], ROW1, a.k ?? .84), { t: lt, expr: 'neutral', arms: { l: 'hold', r: 'hold' }, grip: GRIP() }), a.o);
  o.yaw = turnTo(a.psiB ?? 0); o.headYaw = turnTo(a.psiH ?? a.psiB ?? 0);
  o.x += (a.dx || 0) * o.s; o.y += (a.dy || 0) * o.s;
  return base[0](o);
}

// ------------------------------------------------------------------ the shot table: a camera (lens, position, then a 2D zoom) and the set of people on screen
const SHOTS = [];
const shot = (id, s, e, cam, o = {}) => SHOTS.push(Object.assign({ id, s, e, cam }, o));
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s - 1e-6) r = sh; return r; };
const BASEF = 1100;
const lens = o => Object.assign({ dir: 'f', f: BASEF, cz: -850, cy: 400, hy: 760, cx: 0, z: 1, fx: W / 2, fy: H / 2 }, o);
const TVC = { z: RM.zTV - 110, yc: TVG.bot + TVG.h / 2 };
const tvCam = (wpx, yc = 760, o = {}) => Object.assign({ dir: 'f', cz: TVC.z - 720 * BASEF / wpx, cy: TVC.yc, hy: yc, cx: 0 }, o);
const faceCam = (xr, k, yf = 800, o = {}) => { const d = BASEF / k; return Object.assign({ dir: 'r', cz: (RM.zTV - ROW1) - d, cy: 292, hy: yf, cx: -xr + (o.dx || 0) }, o); };
const WIDE = { cz: -900, cy: 760, hy: 620, fx: 540, fy: 880 };
/* a TV shot aims at a point of the TV's own 1280 x 720 picture at a given scale (screen px per TV px): the camera frames the whole TV at .8, the 2D zoom does the rest */
const tvAim = (tx, ty, sc, o = {}) => Object.assign(tvCam(1280 * .8, 760, o.cam), { aim: [tx, ty, sc] });
const ALL3 = ['straw', 'lemon', 'mango'];
shot('open', 0, 1.0, u => Object.assign({}, WIDE, { z: lerp(1.16, 1.24, u) }), { cast: ALL3 });
shot('tv1', 1.0, 3.2, u => tvAim(640, 380, lerp(.78, .83, u)), { cast: [] });
shot('aud1', 3.2, 4.89, u => faceCam(SEATX.lemon, 1.32, 790, { z: lerp(1, 1.04, u) }), { cast: ALL3, rows2: false });
shot('proc', 4.89, 6.45, u => tvAim(1072, 250, lerp(2.1, 2.3, u)), { cast: [], tvHero: true });
shot('s1', 6.45, 6.95, u => faceCam(SEATX.straw, 1.95, 800, { z: lerp(1.02, 1.08, u) }), { cast: ['straw'], rows2: false });
shot('door', 6.95, 7.54, u => lens({ f: BASEF, cz: 120, cy: 160, hy: 780, cx: lerp(-40, -10, u), z: lerp(1.5, 1.9, u), lamp: true }), { cast: [], corridor: true });
shot('pause', 7.54, 8.55, u => tvAim(640, 380, lerp(.8, .84, u)), { cast: [], tvHero: true });
shot('s1b', 8.55, 9.04, u => faceCam(SEATX.straw, 1.95, 800, { z: lerp(1.05, 1.0, u) }), { cast: ['straw'], rows2: false });
shot('tv2', 9.04, 10.5, u => tvAim(640, 380, lerp(.8, .84, u)), { cast: [] });
shot('glitch', 10.5, 12.1, u => tvAim(640, 380, lerp(.82, .88, u)), { cast: [], tvHero: true });
shot('l1', 12.1, 13.8, u => faceCam(SEATX.lemon, 1.95, 800, { z: lerp(1, 1.06, u) }), { cast: ['lemon'], rows2: false });
shot('tv3', 13.8, 16.29, u => tvAim(640, 380, lerp(.8, .86, u)), { cast: [] });
shot('s2', 16.29, 17.41, u => faceCam(SEATX.straw, 2.05, 800, { z: lerp(1.0, 1.06, u) }), { cast: ['straw'], rows2: false });
shot('tv4', 17.41, 19.58, u => tvAim(640, 380, lerp(.8, .86, u)), { cast: [], tvHero: true });
shot('bar', 19.58, 20.97, u => tvAim(880, 640, lerp(1.4, 1.5, u)), { cast: [], tvHero: true });
shot('s3', 20.97, 22.35, u => faceCam(-500, lerp(1.2, 1.3, u), 800, { z: 1 }), { cast: ['straw'], rows2: false });
shot('wide2', 22.35, 23.4, u => faceCam(-330, lerp(.84, .78, u), 790, { z: 1 }), { cast: ALL3, rows2: false });
for (const sh of SHOTS) sh.s = sh.s === 0 ? 0 : snapT(sh.s);

// ------------------------------------------------------------------ the light and the world: one function draws the room for either direction, far to near
function setLight(sh, lt) {
  const rev = D.dir === 'r', pk = callPulse(lt);
  V2.setLight(rev
    ? { key: [.66, -.28], keyColor: '#b9d0ff', keyA: .3, rim: '#ff8070', rimA: .22 + .2 * pk, shadow: '#1a1430', shadowA: .4, bounce: '#ffd9a0', bounceA: .1, amb: '#ffe8c8', ambA: .04 }
    : { key: [.55, -.55], keyColor: '#b9d0ff', keyA: .3, rim: '#9fc0ff', rimA: .5, shadow: '#1a1430', shadowA: .38, bounce: '#ffd9a0', bounceA: .1, amb: '#ffe8c8', ambA: .04, back: { color: '150,190,255', a: .6, w: 14 } });
}
function rearWall(lt) {
  const z = RM.zRear + 4;
  flatR(-300, 300, 0, 470, z, '#9c7a50', 'rgba(25,16,30,.6)', 3, 4);
  for (const [a, b] of [[-292, -6], [6, 292]]) { flatR(a, b, 8, 462, z, '#ad8a5c', 'rgba(25,16,30,.5)', 2, 3); flatR(a + 60, b - 60, 250, 420, z, '#6f9096', 'rgba(25,16,30,.5)', 2, 3); }
  flatR(-80, 80, 540, 600, z, '#1f8a4a', 'rgba(10,40,20,.8)', 2.5, 6); dress('EXIT', 0, 570, z, { size: 40, fill: '#eafff0', hero: false });
  flatR(-520, -470, 40, 210, z, '#c43a2a', 'rgba(60,10,10,.8)', 2, 8);
}
let TVR = null;
const HAS = (sh, n) => (sh.cast || []).indexOf(n) >= 0;
function drawWorld(lt, sh) {
  const c = sh.cc;
  D.dir = c.dir;
  if (sh.corridor) { setLight(sh, lt); V2.opts.reflect = false; corridorWorld(lt); return; }
  setLight(sh, lt);
  V2.opts.reflect = false;
  const back = () => { shell(lt); if (D.dir === 'f') { tvWall(lt); banner(lt); } else rearWall(lt); windowsWall(lt); doorWall(lt); bookcaseWall(lt); rug(lt); };
  if (D.dir === 'r') V2.dof(sh.dof ?? 7, back); else back();
  tvGlow(lt, sh);
  if (D.dir === 'f') { tvCable(); tvCart(lt, scr => { TVR = scr; paintTV(lt, scr, sh); }); }
  if (sh.rows2 !== false && mapZ(ROW2) - V2.P.cz > 450) {
    const xs = [-590, -350, -110, 130, 340, 570];
    for (const xr of xs) chairLayer(xr, ROW2, 'seat');
    for (const xr of xs) chairLayer(xr, ROW2, D.dir === 'f' ? 'back' : 'lip');
  }
  const seats = ['straw', 'lemon', 'mango'];
  const dressed = sh.cast && sh.cast.length ? sh.cast : (D.dir === 'f' && sh.chairs !== false ? [] : []);
  for (const n of seats) if (HAS(sh, n) || (D.dir === 'f' && !sh.rows2)) chairLayer(SEATX[n], ROW1, 'seat');
  for (const n of seats) if (HAS(sh, n)) drawChar(person(n, lt));
  for (const n of seats) if (HAS(sh, n) || (D.dir === 'f' && !sh.rows2)) chairLayer(SEATX[n], ROW1, D.dir === 'f' ? 'back' : 'lip');
  void dressed;
}

// ------------------------------------------------------------------ the scene object
const BANDY = 148;
const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), u = sg(lt, sh.s, sh.e), c = Object.assign(lens({}), sh.cam(u));
    sh.cc = c; D.dir = c.dir;
    V2.setCam({ f: c.f, cz: c.cz, cy: c.cy, hy: c.hy, cx: c.cx });
    let fx = c.fx, fy = c.fy, z = c.z;
    if (c.lamp) { const [lx, ly] = V2.p2(-COR.hw + 6, 292, 1190); fx = lx + 150; fy = ly + 190; }   /* the corridor shot pushes in on the call light */
    if (c.aim) {
      const scr = facing(TVG.cx - TVG.w / 2, TVG.cx + TVG.w / 2, TVG.bot, TVG.bot + TVG.h, RM.zTV - 110), s0 = scr.w / 1280;
      z = c.aim[2] / s0; fx = scr.x + scr.w * c.aim[0] / 1280; fy = scr.y + scr.h * c.aim[1] / 720 + BANDY / z;
    }
    const sk = lt >= CUE.glitch && lt < CUE.glitch + .45 ? Math.exp(-(lt - CUE.glitch) * 9) * Math.sin((lt - CUE.glitch) * 62) : 0;
    zoomTo(fx + sk * 10 / z, fy + sk * 4 / z, z);
  },
  draw(lt) { TVR = null; drawWorld(lt, shotAt(lt)); },
  fx(lt) {
    const fx = { bloom: .55, vignette: .5, grain: .05, contrast: .13, sat: .08, tint: [['#1e2f78', .2, 'soft-light']] };
    const f = Math.max(0, 1 - Math.abs(lt - CUE.sting - .05) / .25);
    if (f > 0) fx.bloom += .7 * f;
    if (lt < .3) { fx.fade = 1 - sg(lt, 0, .3); fx.fadeColor = '10,12,24'; }
    return fx;
  },
  blur: () => 1,
  over(lt) {
    /* the call light's chime: a red pulse over the picture on the ding, and again with the sting */
    const a = lt >= CUE.ding ? .22 * Math.exp(-(lt - CUE.ding) * 5) : 0, b = lt >= CUE.sting ? .2 * Math.exp(-(lt - CUE.sting) * 6) : 0;
    if (shotAt(lt).cc && shotAt(lt).cc.dir === 'r' && !shotAt(lt).corridor) { const pk = callPulse(lt), g = V2.radial(W + 40, 860, 0, 760, [[0, 'rgba(255,60,50,' + (.3 * pk * (lt > CUE.ding ? 1 : .5)) + ')'], [1, 'rgba(255,60,50,0)']]); ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (a + b > .004) { ctx.save(); ctx.fillStyle = 'rgba(255,50,40,' + (a + b) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP17_SCENES = window.__EP17_SCENES || {};
window.__EP17_SCENES.video = SC;

})();
