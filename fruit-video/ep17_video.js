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
const ROOMC = { wall: '#d9c0a0', wain: '#6d8f7c', floorA: '#b99f78', floorB: '#917a58', ceil: '#d9d4c8', fog: '#2c2a3a' };
function shell(lt) {
  const far = D.dir === 'f' ? RM.zTV : RM.zTV - RM.zRear;
  S6.shell({ zb: far, hw: RM.hw, ch: RM.ch, rail: RM.rail, wall: ROOMC.wall, wain: ROOMC.wain, floorA: ROOMC.floorA, floorB: ROOMC.floorB, ceil: ROOMC.ceil, fog: ROOMC.fog, fogAmt: .34, tile: 150, bright: .62 });
  const zs = D.dir === 'f' ? [-100, 360, 820, 1280] : [140, 600, 1060, 1520, 1980];
  for (const X of [-300, 300]) for (const Z of zs) if (Z > V2.P.cz + 260) S6.ceilingLamp(X, Z, RM.ch, .55, '255,226,176', 110, 190);
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
const DOOR = { z0: 330, z1: 650, h: 340 };
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

/* @@NEXT@@ */
})();
