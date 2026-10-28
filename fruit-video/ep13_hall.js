'use strict';
/* SHIFT HAPPENS, Episode 13: ep13_hall (scene `hall`, 7:14 PM, THE HALL, 11.87 s). WORK IN PROGRESS (builder E13-D). */
(() => {
if (!window.TIMELINE_EP13) return;
const A11 = window.A11, UI = window.UI;
const rgba = V2.rgba, mix = V2.mix;
const clamp01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = clamp01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const pulse = (t, t0, w) => Math.exp(-Math.pow((t - t0) / w, 2));
const hexOf = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const RED = '255,59,78', CYAN = '77,227,255';

// ================================================================== the camera: a real 3D view (position, yaw, pitch, focal length) so the hall can orbit
// World units as in Episode 6: X right, Y up, Z along the hall (toward the break room door). A point at camera depth D is drawn at scale F / D.
const VIEW = { x: 0, y: 300, z: -180, yaw: 0, pitch: 0, F: 1400, cx: W / 2, cy: 800 };
let cYaw = 1, sYaw = 0, cPit = 1, sPit = 0;
function setView(v) {
  Object.assign(VIEW, v);
  cYaw = Math.cos(VIEW.yaw); sYaw = Math.sin(VIEW.yaw); cPit = Math.cos(VIEW.pitch); sPit = Math.sin(VIEW.pitch);
}
const NEAR = 24;
function toCam(X, Y, Z) {
  const dx = X - VIEW.x, dy = Y - VIEW.y, dz = Z - VIEW.z;
  const x1 = cYaw * dx - sYaw * dz, z1 = sYaw * dx + cYaw * dz;
  return [x1, dy * cPit + z1 * sPit, -dy * sPit + z1 * cPit];
}
const scr = c => { const k = VIEW.F / c[2]; return [VIEW.cx + c[0] * k, VIEW.cy - c[1] * k, k]; };
/* a world point to [sx, sy, k, depth], or null behind the lens */
function P3(X, Y, Z) { const c = toCam(X, Y, Z); if (c[2] < NEAR) return null; const k = VIEW.F / c[2]; return [VIEW.cx + c[0] * k, VIEW.cy - c[1] * k, k, c[2]]; }
function clipPolyCam(pts) {   /* Sutherland-Hodgman against the near plane */
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
  }
  return out;
}
function path3(pts) {
  const c = pts.map(p => toCam(p[0], p[1], p[2])), cl = clipPolyCam(c);
  if (cl.length < 3) return false;
  ctx.beginPath();
  for (let i = 0; i < cl.length; i++) { const s = scr(cl[i]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }
  ctx.closePath(); return true;
}
function poly3(pts, fill, stroke, lw) {
  if (!path3(pts)) return false;
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.lineJoin = 'round'; ctx.stroke(); }
  return true;
}
/* a line segment clipped to the near plane: returns [a, b] in camera space or null */
function clipSeg(a, b) {
  const ia = a[2] >= NEAR, ib = b[2] >= NEAR;
  if (!ia && !ib) return null;
  if (ia && ib) return [a, b];
  const t = (NEAR - a[2]) / (b[2] - a[2]), m = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR];
  return ia ? [a, m] : [m, b];
}
function line3(A, B, stroke, lw) {
  const s = clipSeg(toCam(...A), toCam(...B)); if (!s) return;
  const p = scr(s[0]), q = scr(s[1]);
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
}
/* a flat glow at a world point; r in world units */
function glow3(X, Y, Z, r, color, a, bloom = .35) {
  const p = P3(X, Y, Z); if (!p || a <= 0) return null;
  V2.glow(p[0], p[1], Math.max(4, r * p[2]), color, a, 'screen', bloom);
  return p;
}
/* a pool of light lying on the floor: the circle of radius R on the plane y, drawn as the ellipse its projection makes (affine from the projected axes) */
function floorPool(X, Z, R, color, a, y = .5) {
  if (a <= 0) return;
  const c = P3(X, y, Z), e1 = P3(X + R, y, Z), e2 = P3(X - R, y, Z), f1 = P3(X, y, Z + R), f2 = P3(X, y, Z - R);
  if (!c || !e1 || !e2 || !f1 || !f2) return;
  const ux = (e1[0] - e2[0]) / 2, uy = (e1[1] - e2[1]) / 2, vx = (f1[0] - f2[0]) / 2, vy = (f1[1] - f2[1]) / 2;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.transform(ux, uy, vx, vy, c[0], c[1]);
  ctx.fillStyle = V2.radial(0, 0, 0, 1, [[0, rgba(color, a)], [.45, rgba(color, a * .4)], [1, rgba(color, 0)]]);
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
}

// ================================================================== the hall
const HW = 380, CH = 700, ZN = -700, ZF = 5600, RAIL = 108;
const FOG = [30, 16, 44];
const fogK = zc => 1 - Math.exp(-Math.max(0, zc) / 3200);

/* doors and their call-light domes: the right wall (X +HW) and the left wall (X -HW), staggered, one every 520 units */
const DOORS = [];
for (let n = 0; n < 10; n++) { DOORS.push({ side: 1, z: 40 + 520 * n, n }); DOORS.push({ side: -1, z: 300 + 520 * n, n }); }
DOORS.sort((a, b) => a.z - b.z);
const DOOR_TONE = [[59, 42, 68], [42, 63, 74], [74, 51, 40], [45, 58, 82], [56, 48, 63], [44, 68, 56]];
DOORS.forEach((d, i) => { d.i = i; d.tone = DOOR_TONE[(i * 5 + 1) % DOOR_TONE.length]; d.tv = (i === 5 || i === 12) ? 1 : 0; d.ph = hash(i * 1.7 + .3) * 6.28; });
const DOME_Y0 = 440, DOME_Y1 = 516, DOME_HW = 62;

// ================================================================== the laser grid: a web of beams from the call-light domes to sensors on the opposite wall
/* [dome side, dome z, sensor y, sensor z, room, need] */
const BEAM_DEF = [
  [1, 1080, 110, 1450, 'RM 12', 'WATER'],
  [-1, 1340, 330, 1130, 'RM 7', 'BATHROOM'],
  [1, 1600, 380, 1900, 'RM 21', 'PILLOW'],
  [-1, 1860, 120, 1690, 'RM 4', '“I NEED SOMETHING”'],
  [1, 2120, 60, 2330, 'RM 9', 'BLANKET'],
  [-1, 2380, 290, 2790, 'RM 15', 'TV REMOTE'],
  [1, 2640, 420, 2400, 'RM 3', 'ONE MORE PILLOW'],
  [-1, 2900, 150, 3220, 'RM 26', 'PAIN MEDS'],
  [1, 3160, 340, 2990, 'RM 18', 'WHAT TIME IS IT'],
  [-1, 3420, 80, 3700, 'RM 11', 'WATER'],
  [1, 3680, 250, 3430, 'RM 5', 'JUST ONE THING'],
  [-1, 3940, 380, 4230, 'RM 24', 'BATHROOM'],
];
const BEAMS = BEAM_DEF.map(([side, z, yB, zB, room, need], i) => ({
  i, side, A: [side * HW, 490, z], B: [-side * HW, yB, zB], room, need, ph: hash(i * 3.1) * 6.28, dome: DOORS.find(d => d.side === side && d.z === z),
}));

// ================================================================== time-warp (slow motion): the lasers beat only, everything else runs at 1x
const SLOW = .2;
const WARP = { s: -1, D: 0, tab: null };
function speedAt(u) {   /* the clock's speed inside the lasers beat: ease down to SLOW, hold, ease back to 1 over the last half second */
  const D = WARP.D, dn = sstep(u, 0, .55), up = sstep(u, D - .62, D - .02);
  return lerp(1, SLOW, dn) * (1 - up) + up;
}
function warpTable() {
  const L = B('lasers');
  if (WARP.tab && WARP.s === L.s) return WARP.tab;
  WARP.s = L.s; WARP.D = L.e - L.s; WARP.tab = [0];
  const n = 720, h = WARP.D / n;
  for (let i = 1; i <= n; i++) WARP.tab.push(WARP.tab[i - 1] + speedAt((i - .5) * h) * h);
  return WARP.tab;
}
/* character time: scene-local seconds, but slowed inside the lasers beat */
function ct(lt) {
  const L = B('lasers'), tab = warpTable();
  if (lt <= L.s) return lt;
  const u = lt - L.s;
  if (u >= WARP.D) return L.s + tab[tab.length - 1] + (u - WARP.D);
  const f = u / WARP.D * (tab.length - 1), i = Math.floor(f);
  return L.s + lerp(tab[i], tab[Math.min(tab.length - 1, i + 1)], f - i);
}

// ================================================================== drawing the hall
function wallQuad(side, y0, y1, z0, z1, fill, stroke, lw) { const X = side * HW; return poly3([[X, y0, z0], [X, y1, z0], [X, y1, z1], [X, y0, z1]], fill, stroke, lw); }
function flatQuad(x0, x1, z0, z1, y, fill) { return poly3([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], fill); }

function hallShell() {
  const wall = [22, 30, 54], wain = [20, 40, 54], floor = [13, 15, 26], ceil = [11, 13, 24];
  const step = 100, zS = Math.floor(ZN / step) * step;
  for (let z = zS; z < ZF; z += step) {
    const z1 = z + step + 1, zm = z + step / 2, dep = Math.max(0, toCam(0, VIEW.y, zm)[2]);
    let rl = 0;
    for (const d of DOORS) { const dz = (zm - d.z) / 170; if (Math.abs(dz) < 2.5) rl += Math.exp(-dz * dz); }
    rl = clamp01(rl);
    const fk = fogK(dep);
    for (const side of [-1, 1]) {
      wallQuad(side, RAIL, CH, z, z1, hexOf(mix(mix(wall, FOG, fk * .9), [120, 22, 40], rl * .2 * (1 - fk * .6))));
      wallQuad(side, 0, RAIL, z, z1, hexOf(mix(mix(wain, FOG, fk * .9), [120, 22, 40], rl * .24 * (1 - fk * .6))));
    }
    flatQuad(-HW, HW, z, z1, 0, hexOf(mix(mix(floor, FOG, fk * .85), [100, 20, 38], rl * .12)));
    flatQuad(-HW, HW, z, z1, CH, hexOf(mix(mix(ceil, FOG, fk * .85), [50, 12, 28], rl * .08)));
  }
  poly3([[-HW, 0, ZF], [HW, 0, ZF], [HW, CH, ZF], [-HW, CH, ZF]], hexOf(mix([30, 40, 66], FOG, .6)));
  poly3([[-HW, 0, ZN], [HW, 0, ZN], [HW, CH, ZN], [-HW, CH, ZN]], '#2a1c26');
}

function drawDome(d, I) {
  const s = d.side;
  wallQuad(s, DOME_Y0, DOME_Y1, d.z - DOME_HW - 6, d.z + DOME_HW + 6, '#160810', 'rgba(8,4,12,.85)', 2);
  wallQuad(s, DOME_Y0 + 8, DOME_Y1 - 8, d.z - DOME_HW + 4, d.z + DOME_HW - 4, rgba('230,30,52', .45 + .55 * I));
  wallQuad(s, DOME_Y0 + 19, DOME_Y1 - 19, d.z - 26, d.z + 26, rgba('255,150,160', .35 + .5 * I));
}

function drawDoor(d, lit) {
  const s = d.side, z = d.z, zc = toCam(s * HW, 200, z)[2];
  if (zc < NEAR && toCam(s * HW, 200, z + 200)[2] < NEAR) return;
  const fk = fogK(Math.max(zc, 0)), tone = mix(d.tone, FOG, fk * .85);
  wallQuad(s, 0, 450, z - 82, z + 82, hexOf(mix(tone, [8, 6, 14], .5)), 'rgba(6,4,12,.7)', 2);   // frame
  wallQuad(s, 0, 430, z - 68, z + 68, hexOf(mix(tone, [190, 40, 60], .14 * lit)));              // leaf
  const dk = hexOf(mix(tone, [0, 0, 0], .34));
  wallQuad(s, 50, 205, z - 50, z + 50, dk, 'rgba(6,4,12,.45)', 1.4);
  wallQuad(s, 245, 395, z - 50, z + 50, dk, 'rgba(6,4,12,.45)', 1.4);
  wallQuad(s, 228, 244, z + 46, z + 62, hexOf(mix([150, 154, 164], FOG, fk * .8)));           // lever handle
}

function drawHallDressing() {
  for (const side of [-1, 1]) {
    line3([side * (HW - 16), 168, ZN], [side * (HW - 16), 168, ZF], 'rgba(150,110,100,.38)', 7);
    line3([side * HW, RAIL, ZN], [side * HW, RAIL, ZF], 'rgba(110,80,90,.4)', 5);
  }
}

/* beams ------------------------------------------------------------------------------------------------------------------------------------ */
const BW = { halo: 36, glow: 12, core: 2.8 };   /* world units */
const T_ON = i => .62 + .058 * i;                  /* the beams switch on one after another (scene-local s) */
function beamState(b, lt, ctt) {
  const k = lt - T_ON(b.i);
  if (k < 0) return { on: 0, ext: 0, I: 0 };
  const ext = easeOut(clamp01(k / .09)), flick = k < .36 ? (hash(Math.floor(k * 38) + b.i * 7.1) > .38 ? 1 : .22) : 1;
  return { on: 1, ext, I: flick * (.88 + .12 * Math.sin(ctt * 3.1 + b.ph)) };
}
/* draw the part [ta, tb] of beam b (t 0 at its dome, 1 at the sensor). o.mirror draws its reflection in the glossy floor, o.k scales the strength */
function drawBeamPart(b, ta, tb, I, o = {}) {
  if (tb <= ta || I <= 0) return;
  const m = o.mirror ? -1 : 1, A = b.A, Bp = b.B;
  const at = t => [A[0] + (Bp[0] - A[0]) * t, (A[1] + (Bp[1] - A[1]) * t) * m, A[2] + (Bp[2] - A[2]) * t];
  const sg = clipSeg(toCam(...at(ta)), toCam(...at(tb)));
  if (!sg) return;
  const n = o.n || 9, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n, c = [lerp(sg[0][0], sg[1][0], u), lerp(sg[0][1], sg[1][1], u), lerp(sg[0][2], sg[1][2], u)]; pts.push(scr(c)); }
  const kk = o.k ?? 1, ghost = !!o.ghost;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'butt';
  const passes = ghost ? [[BW.glow * 1.1, `${CYAN}`, .34 * I * kk], [BW.core * 1.1, '230,250,255', .95 * I * kk]]
    : [[BW.halo, RED, .085 * I * kk], [BW.glow, RED, .34 * I * kk], [BW.core, '255,214,220', .95 * I * kk]];
  for (const [w, c, a] of passes) {
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[i + 1], kmid = (p[2] + q[2]) / 2, lw = Math.max(w > BW.core * 2 ? 5 : 1.8, w * kmid * (o.mirror ? .8 : 1));
      ctx.strokeStyle = rgba(c, Math.min(1, a)); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
  }
  ctx.restore();
}
/* the bright packets that run along a beam */
function drawBeamPackets(b, I, ctt, t1 = 1) {
  for (let j = 0; j < 3; j++) {
    const u = (ctt * .55 + j / 3 + b.ph / TAU) % 1;
    if (u > t1) continue;
    drawBeamPart(b, Math.max(0, u - .014), Math.min(t1, u + .014), I * 1.3, { n: 2, k: .8 });
  }
}
function drawSensor(b, st) {
  const s = -b.side, X = s * HW, y = b.B[1], z = b.B[2];
  wallQuad(s, y - 18, y + 18, z - 24, z + 24, '#0d0a14', 'rgba(0,0,0,.8)', 1.5);
  wallQuad(s, y - 5, y + 5, z - 8, z + 8, rgba(RED, .35 + .65 * st.I * st.on));
  if (st.on) glow3(X - s * 10, y, z, 90, RED, .5 * st.I, .6);
}

/* dust motes: a pure function of time, spread around the camera; the ones in a beam catch it */
function segDist(P, A, Bp) {
  const dx = Bp[0] - A[0], dy = Bp[1] - A[1], dz = Bp[2] - A[2], l2 = dx * dx + dy * dy + dz * dz;
  let t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy + (P[2] - A[2]) * dz) / l2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(P[0] - A[0] - dx * t, P[1] - A[1] - dy * t, P[2] - A[2] - dz * t);
}
function drawDust(ctt, states, o = {}) {
  const N = o.n ?? 150, R = o.range ?? 3200, zLo = Math.max(VIEW.z - 150, ZN), seed = o.seed ?? 0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const h1 = hash(i * 1.31 + .5 + seed), h2 = hash(i * 2.17 + 3.1 + seed), h3 = hash(i * .77 + 9.9 + seed), h4 = hash(i * 3.31 + 1.2 + seed), h5 = hash(i * 5.7 + 2.2 + seed);
    const X = (h1 * 2 - 1) * (HW - 40) + 26 * Math.sin(ctt * (.3 + h4 * .5) + i);
    const Y = 18 + ((h2 * 660 - ctt * (3 + 6 * h5)) % 660 + 660) % 660 + 14 * Math.sin(ctt * .6 + i * 2.1);
    const Z = zLo + ((h3 * R + ctt * (9 + 20 * h4)) % R);
    const p = P3(X, Y, Z); if (!p) continue;
    if (p[0] < -20 || p[0] > W + 20 || p[1] < -20 || p[1] > H + 20) continue;
    let gain = 0;
    for (let bi = 0; bi < BEAMS.length; bi++) {
      const st = states[bi]; if (!st || !st.on) continue;
      const b = BEAMS[bi], d = segDist([X, Y, Z], b.A, b.B);
      if (d < 70) gain = Math.max(gain, Math.exp(-(d / 30) * (d / 30)) * st.I);
    }
    const tw = .55 + .45 * Math.sin(ctt * (1.1 + h5 * 1.6) + i), far = Math.exp(-p[3] / 2600);
    const a = (.16 + .8 * gain) * tw * (.35 + .65 * far), sz = Math.max(1.1, (1.7 + h5 * 1.6) * p[2] * (1 + gain * .8));
    ctx.fillStyle = gain > .25 ? `rgba(255,${190 - 80 * gain | 0},${200 - 90 * gain | 0},${Math.min(1, a)})` : `rgba(190,200,255,${Math.min(1, a)})`;
    ctx.beginPath(); ctx.arc(p[0], p[1], sz, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawHall(lt, ctt, states) {
  hallShell();
  drawHallDressing();
  const order = DOORS.map(d => [toCam(d.side * HW, 200, d.z)[2], d]).sort((a, b) => b[0] - a[0]);
  for (const [, d] of order) {
    const I = .8 + .2 * Math.sin(ctt * 2.4 + d.ph);
    drawDoor(d, I);
    drawDome(d, I);
  }
  for (const b of BEAMS) drawSensor(b, states[b.i]);
  for (const d of DOORS) {
    const I = .8 + .2 * Math.sin(ctt * 2.4 + d.ph), X = d.side * HW;
    glow3(X - d.side * 14, 478, d.z, 200, RED, .3 * I, .5);
    floorPool(X - d.side * 140, d.z, 190, RED, .2 * I);
    glow3(X, -478, d.z, 130, RED, .1 * I, .2);
  }
}

// ================================================================== the scene
const DBG = () => window.__HALLDBG || null;
const SC = {
  shot: lt => 'wide',
  cam(lt) {
    const dbg = DBG();
    setView(dbg && dbg.view ? dbg.view : { x: 0, y: 330, z: -180, yaw: 0, pitch: 0, F: 1400, cx: W / 2, cy: 800 });
  },
  draw(lt) {
    const ctt = ct(lt), dbg = DBG(), states = BEAMS.map(b => beamState(b, dbg && dbg.lt != null ? dbg.lt : lt, ctt));
    ctx.fillStyle = '#07050d'; ctx.fillRect(-200, -200, W + 400, H + 400);
    drawHall(lt, ctt, states);
    for (const b of BEAMS) { const st = states[b.i]; if (!st.on) continue; drawBeamPart(b, 0, st.ext, st.I, { mirror: true, k: .35, n: 6 }); }
    for (const b of BEAMS) { const st = states[b.i]; if (!st.on) continue; drawBeamPart(b, 0, st.ext, st.I); drawBeamPackets(b, st.I, ctt, st.ext); }
    drawDust(ctt, states);
  },
  fx: lt => ({ bloom: .8, vignette: .55, grain: .05, contrast: .22 }),
  blur: lt => 1,
  over(lt) {},
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.hall = SC;
})();
