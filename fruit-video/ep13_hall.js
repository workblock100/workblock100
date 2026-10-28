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

// ================================================================== Strawberry on the radio: the earpiece with a short coiled wire (accessory fp13_ear)
EXT.acc.fp13_ear = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const sd = o.earSide ?? -1, rx = k.rx, ry = k.ry, led = clamp01(o.earLed || 0);
  ctx.save(); ctx.scale(sd, 1);   /* drawn for the screen-right side, mirrored for the left */
  // the coiled cord: from the bud down the edge of the body to the push-to-talk clip on her chest
  const x0 = rx * .93, y0 = -ry * .12, x1 = rx * .56, y1 = ry * .36;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const N = 34;
  for (let i = 0; i <= N; i++) {
    const u = i / N, bx = lerp(x0, x1, u * u * (3 - 2 * u)) + Math.sin(u * 3) * 8, by = lerp(y0, y1, u);
    const co = Math.sin(u * 62) * 5.2;
    i ? ctx.lineTo(bx + co * .5, by + co) : ctx.moveTo(bx, by);
  }
  ctx.strokeStyle = 'rgba(8,10,20,.92)'; ctx.lineWidth = 4.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(120,140,190,.45)'; ctx.lineWidth = 1.6; ctx.stroke();
  // the clip
  ctx.save(); ctx.translate(x1, y1 + 8); ctx.rotate(-.12);
  ctx.fillStyle = '#12151f'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-9, -4, 18, 28, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = led > .05 ? `rgba(77,227,255,${.5 + .5 * led})` : '#1d4a58'; ell(0, 4, 3.2, 3.2); ctx.fill();
  ctx.fillStyle = '#2a3042'; rr(-5, 11, 10, 8, 2); ctx.fill();
  ctx.restore();
  // the bud: a dark capsule on the side of her head with a little cyan light
  ctx.save(); ctx.translate(rx * .985, y0 + 2); ctx.rotate(.18);
  ctx.fillStyle = '#10131d'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2; rr(-7, -17, 15, 34, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2c3347'; rr(-3, -13, 6, 12, 3); ctx.fill();
  ctx.fillStyle = led > .05 ? `rgba(77,227,255,${.6 + .4 * led})` : '#1d4a58'; ell(0, 9, 2.8, 2.8); ctx.fill();
  ctx.restore();
  ctx.restore();
};

// ================================================================== Strawberry's path and the slow-motion walk
const STRAW_ACC = ['steth', 'bandage7', 'perdiem9', 'fp13_ear'];
const V0 = 290, STRIDE = 48, Z_START = 1300;
const herZ = lt => { const c0 = B('lasers').s; return lt <= c0 ? Z_START : Z_START + V0 * (ct(lt) - c0); };
const herGait = lt => { const c0 = B('lasers').s; return lt <= c0 ? 0 : V0 * (ct(lt) - c0); };
const herX = lt => 0;
/* where a character standing at world (X, Z) is drawn: feet position and scale */
function placeAt(X, Z) { const p = P3(X, 0, Z); return p ? { x: p[0], y: p[1], s: p[2], depth: p[3] } : null; }

/* the camera: a point to look at, the angle around it (0 = straight ahead of her, looking back along the hall), distance, height, focal length, and where on the frame the point lands */
function orbit(px, py, pz, theta, d, h, F, sx, sy) {
  const cx = px + Math.sin(theta) * d, cz = pz + Math.cos(theta) * d;
  const yaw = Math.atan2(px - cx, pz - cz), dh = Math.hypot(px - cx, pz - cz), pitch = Math.atan2(h - py, dh);
  return { x: cx, y: h, z: cz, yaw, pitch, F, cx: sx, cy: sy };
}
const D2R = Math.PI / 180;

// ================================================================== shots
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const CUTS = () => { const L = B('lasers'); return { lr1: B('lr1').s, sr1: B('sr1').s - .04, l1: L.s, l2: L.s + 1.1, l3: L.s + 2.15, lr2: B('lr2').s - .03, sr2: B('sr2').s - .05, end: B('end').s - .02 }; };
function shotId(lt) {
  const c = CUTS();
  return lt < c.lr1 ? 'open' : lt < c.sr1 ? 'lr1' : lt < c.l1 ? 'sr1' : lt < c.l2 ? 'L1' : lt < c.l3 ? 'L2' : lt < c.lr2 ? 'L3' : lt < c.sr2 ? 'lr2' : lt < c.end ? 'sr2' : 'end';
}
/* the whole camera for a moment: { view, roll, zoom, shot, ... } */
function viewFor(lt) {
  const dbg = window.__HALLDBG; if (dbg && dbg.view) return Object.assign({ shot: 'dbg', roll: 0, zoom: 1, dof: 0, sil: 0, reflect: false }, dbg);
  const sh = shotId(lt), c = CUTS(), L = B('lasers'), zH = herZ(lt), u = lt - L.s;
  const v = { shot: sh, roll: 0, zoom: 1, dof: 0, sil: 0, reflect: true };
  switch (sh) {
    case 'open': {
      const k = easeIO(clamp01(lt / c.lr1));
      v.view = { x: 0, y: 330, z: lerp(-300, -90, k), yaw: 0, pitch: .02, F: 1400, cx: W / 2, cy: 800 }; v.sil = 1; break;
    }
    case 'lr1': {
      const k = clamp01((lt - c.lr1) / (c.sr1 - c.lr1));
      v.view = orbit(0, 226, zH, -14 * D2R, lerp(620, 540, easeIO(k)), 205, 1400, 560, 760); v.dof = 9; v.roll = -.012; break;
    }
    case 'sr1': {
      const k = clamp01((lt - c.sr1) / (c.l1 - c.sr1));
      v.view = orbit(0, 226, zH, 11 * D2R, lerp(500, 430, easeOut(k)), 215, 1400, 520, 760); v.dof = 10; v.roll = .03; break;
    }
    case 'L1': {
      const k = clamp01((lt - c.l1) / (c.l2 - c.l1));
      v.view = orbit(0, 200, zH, lerp(-30, -12, easeIO(k)) * D2R, lerp(640, 600, k), 70, 1000, 540, 800); v.dof = 3; v.roll = lerp(-.035, -.01, k); break;
    }
    case 'L2': {
      const k = clamp01((lt - c.l2) / (c.l3 - c.l2));
      v.view = orbit(-40, 190, zH, lerp(58, 74, easeIO(k)) * D2R, 430, 120, 760, 540, 790); v.roll = lerp(.06, .02, k); v.side = true; break;
    }
    case 'L3': {
      const k = clamp01((lt - c.l3) / (c.lr2 - c.l3));
      v.view = orbit(0, 150, zH, lerp(34, 14, easeIO(k)) * D2R, lerp(1500, 1100, easeIO(k)), lerp(380, 250, easeIO(k)), 1400, 540, lerp(740, 800, k)); v.roll = lerp(-.02, 0, k); v.reflect = false; break;
    }
    case 'lr2': {
      const k = clamp01((lt - c.lr2) / (c.sr2 - c.lr2));
      v.view = orbit(0, 205, zH, lerp(-9, 6, k) * D2R, 760, 165, 1300, 540, 790); v.dof = 2; break;
    }
    case 'sr2': {
      const k = clamp01((lt - c.sr2) / (c.end - c.sr2));
      v.view = orbit(0, 226, zH, -6 * D2R, lerp(600, 520, easeIO(k)), 210, 1400, 540, 760); v.dof = 9; break;
    }
    default: {
      const k = clamp01((lt - c.end) / (CUR.dur - c.end));
      v.view = { x: 0, y: 300, z: lerp(-500, -380, k), yaw: 0, pitch: .01, F: lerp(2100, 2400, easeIO(k)), cx: W / 2, cy: 790 }; v.sil = 1; break;
    }
  }
  return v;
}

// ================================================================== the scene
const SC = {
  shot: lt => shotId(lt),
  cam(lt) {
    const v = viewFor(lt);
    setView(v.view);
    CAM.r = v.roll; CAM.z = v.zoom;
  },
  draw(lt) {
    const ctt = ct(lt), v = viewFor(lt), states = BEAMS.map(b => beamState(b, lt, ctt));
    ctx.fillStyle = '#07050d'; ctx.fillRect(-200, -200, W + 400, H + 400);
    V2.dof(v.dof, () => {
      drawHall(lt, ctt, states);
      for (const b of BEAMS) { const st = states[b.i]; if (st.on) drawBeamPart(b, 0, st.ext, st.I, { mirror: true, k: .22, n: 6 }); }
    });
    // her
    const zH = herZ(lt), pl = placeAt(herX(lt), zH);
    V2.setLight({ key: [.4, -.7], keyColor: '#ff7a88', keyA: .3, rim: '#4de3ff', rimA: .55, shadow: '#0a0618', shadowA: .5, amb: '#2a2f6a', ambA: .12, bounce: '#ff3b4e', bounceA: .22 });
    V2.opts.reflect = v.reflect;
    for (const b of BEAMS) { const st = states[b.i]; if (st.on) drawBeamPart(b, 0, st.ext, st.I); }
    if (pl) drawStraw(lt, ctt, v, pl);
    drawDust(ctt, states);
  },
  fx: lt => ({ bloom: .85, vignette: .56, grain: .05, contrast: .22, tint: [['#28306a', .22, 'soft-light']] }),
  blur: lt => 1,
  over(lt) {},
};
function drawStraw(lt, ctt, v, pl) {
  const L = B('lasers'), walking = lt >= L.s, gait = herGait(lt);
  const o = A11.straw({ x: pl.x, y: pl.y, s: pl.s, id: 'straw', who: 'straw', acc: STRAW_ACC, expr: 'dead', t: ctt, stride: STRIDE, look: [0, .04], earSide: -1 });
  if (walking) { o.gaitW = gait; o.axis = v.side ? 'x' : 'z'; o.dir = 1; }
  if (v.sil) o.noFace = true;
  drawChar(o);
}
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.hall = SC;
})();
