'use strict';
/* SHIFT HAPPENS, Episode 13: ep13_hall (scene `hall`, 7:14 PM, THE HALL, 11.87 s; builder E13-D).
 * The night hall of the nursing home: the call-light domes over the doors are the lasers (a web of red beams from the domes to sensors on the opposite wall, each with a small room/need plate),
 * a HUD plate (OPERATION BREAK / T MINUS and a running clock), a radio tag, Strawberry (per diem badge, earpiece) and a slow-motion walk through the grid (time warp on her, the beams' packets, the sparks).
 * Camera: a private 3D view (VIEW: position, yaw, pitch, focal length) so the hall can orbit; she is a billboard placed at her projected foot point (scale F / depth). The engine camera only carries the roll and the heartbeat pulse.
 * Shots (scene-local s):
 *   open   0.00-1.40  wide down the hall from behind her (a silhouette), slow dolly in; three countdown beeps (.30 .55 .80: HUD pips + earpiece LED), the beams switch on one by one from .52
 *   lr1    1.40-3.60  close-up, low front three-quarter (orbit 14 deg, slow push), a hand on the earpiece, red light flicker, radio tag, GHOST call sign pops on her name
 *   sr1    3.60-4.38  tighter close-up, a little dutch roll, "Copy."
 *   L1     4.38-5.48  the slow walk begins (white blip, aberration, blur on the ramp): low front three-quarter arc, first crossing at 5.18 (badge tag, glitch band, ring, sparks)
 *   L2     5.48-6.53  whip + white flash cut: lateral three-quarter track with a dutch roll, second crossing at 5.98
 *   L3     6.53-8.00  whip + white flash cut: high wide crane and push, lens flare as a beam passes the lens, third crossing at 6.78, the clock speeds back up to 1x over the last 0.6 s (aberration, blur)
 *   lr2    8.00-9.58  medium tracking shot (the camera backs away as she walks on), glance, smug on "you."
 *   sr2    9.58-10.60 close-up push, "Nobody can." (smug on "can.")
 *   end    10.60-11.87 telephoto push on the far steel door (S13.breakDoor) with her silhouette walking off, the sting at 10.72 (bloom surge, beams surge, ring, bolts)
 * Text: all through UI (HUD plate, radio tag, BADGE tags and the GHOST pill are hero text in over(); the room/need plates are UI.sign hero:false set dressing in the world).
 */
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
const HW = 380, CH = 700, ZN = -900, ZF = 5600, RAIL = 108;
const FOG = [30, 16, 44];
const fogK = zc => 1 - Math.exp(-Math.max(0, zc) / 3200);

/* doors and their call-light domes: the right wall (X +HW) and the left wall (X -HW), staggered, one every 520 units */
const DOORS = [];
for (let n = 0; n < 10; n++) { DOORS.push({ side: 1, z: 40 + 520 * n, n }); DOORS.push({ side: -1, z: 300 + 520 * n, n }); }
DOORS.sort((a, b) => a.z - b.z);
const DOOR_TONE = [[59, 42, 68], [42, 63, 74], [74, 51, 40], [45, 58, 82], [56, 48, 63], [44, 68, 56]];
DOORS.forEach((d, i) => { d.i = i; d.tone = DOOR_TONE[(i * 5 + 1) % DOOR_TONE.length]; d.tv = (i === 5 || i === 12) ? 1 : 0; d.ph = hash(i * 1.7 + .3) * 6.28; });
const DOME_Y0 = 440, DOME_Y1 = 516, DOME_HW = 62;
/* the domes come on with the countdown: the near ones on the first beep, each beam's dome as its beam starts, the far ones last */
const T_ON = i => .52 + .062 * i;                  /* the beams switch on one after another (scene-local s) */
const doorOnT = d => { const j = BEAM_DEF.findIndex(q => q[0] === d.side && q[1] === d.z); return j >= 0 ? T_ON(j) - .04 : d.z < 1000 ? .3 + .05 * d.i : .95 + .06 * (d.i - 16); };
/* brightness of a dome: an ember before its time, a flash as it comes on, then a slow pulse */
function doorI(d, lt, ctt) {
  const t0 = d.tOn ?? (d.tOn = doorOnT(d));
  return (.12 + .88 * sstep(lt, t0, t0 + .08)) * (.8 + .2 * Math.sin(ctt * 2.4 + d.ph)) + .9 * pulse(lt, t0 + .04, .05) * (lt > t0 ? 1 : 0);
}

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

function hallShell(DI) {
  const wall = [22, 30, 54], wain = [20, 40, 54], floor = [13, 15, 26], ceil = [11, 13, 24];
  const step = 100, zS = Math.floor(ZN / step) * step;
  for (let z = zS; z < ZF; z += step) {
    const z1 = z + step + 1, zm = z + step / 2, dep = Math.max(0, toCam(0, VIEW.y, zm)[2]);
    let rl = 0;
    for (const d of DOORS) { const dz = (zm - d.z) / 170; if (Math.abs(dz) < 2.5) rl += Math.exp(-dz * dz) * Math.min(1.4, DI[d.i]); }
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

function drawDoor(d, lit, tv = 0) {
  const s = d.side, z = d.z, zc = toCam(s * HW, 200, z)[2];
  if (zc < NEAR && toCam(s * HW, 200, z + 200)[2] < NEAR) return;
  const fk = fogK(Math.max(zc, 0)), tone = mix(d.tone, FOG, fk * .85);
  wallQuad(s, 0, 450, z - 82, z + 82, hexOf(mix(tone, [8, 6, 14], .5)), 'rgba(6,4,12,.7)', 2);   // frame
  wallQuad(s, 0, 430, z - 68, z + 68, hexOf(mix(tone, [190, 40, 60], .14 * lit)));              // leaf
  const dk = hexOf(mix(tone, [0, 0, 0], .34));
  wallQuad(s, 50, 205, z - 50, z + 50, dk, 'rgba(6,4,12,.45)', 1.4);
  wallQuad(s, 245, 395, z - 50, z + 50, tv > 0 ? hexOf(mix([20, 30, 50], [120, 170, 255], .55 * tv)) : dk, 'rgba(6,4,12,.45)', 1.4);
  wallQuad(s, 228, 244, z + 46, z + 62, hexOf(mix([150, 154, 164], FOG, fk * .8)));           // lever handle
}

/* a polygon filled with a vertical gradient between two world heights */
function gradQuad(pts, yTop, yBot, x, z, c0, c1) {
  const a = P3(x, yTop, z), b = P3(x, yBot, z); if (!a || !b) return poly3(pts, c1);
  if (!path3(pts)) return false;
  const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, c0); g.addColorStop(1, c1);
  ctx.fillStyle = g; ctx.fill(); return true;
}
const rectZ = (x0, x1, y0, y1, z) => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];

/* the near end of the hall (behind the camera in the first shot): the nurses' station through a doorway, a warm light against the red (nested panes of light, so its edge is soft) */
function drawNearEnd(ctt) {
  const z = ZN, dep = toCam(0, 250, z)[2];
  if (dep < NEAR) return;
  const fk = fogK(dep) * .5, k = 1 - fk * .5;
  poly3(rectZ(-HW, HW, 0, CH, z), hexOf(mix([24, 17, 30], FOG, fk)));
  poly3(rectZ(-232, 232, 0, 480, z + 1), hexOf(mix([8, 6, 12], FOG, fk)));
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [hx, y0, y1, c, a] of [[226, 0, 470, '255,140,70', .2], [200, 0, 440, '255,170,96', .32], [172, 10, 418, '255,200,130', .5], [132, 70, 372, '255,226,176', .6]]) poly3(rectZ(-hx, hx, y0, y1, z + 2), rgba(c, a * k));
  ctx.restore();
  poly3(rectZ(-190, 190, 0, 150, z + 3), rgba('36,22,28', .85 * k));                                // the counter
  poly3(rectZ(96, 178, 214, 392, z + 4), rgba('40,26,40', .7 * k));                                 // the call-light board, a dark slab with a few lit dots
  for (let i = 0; i < 12; i++) { const cx = 112 + (i % 4) * 20, cy = 238 + Math.floor(i / 4) * 52; if (i % 3 !== 2) poly3(rectZ(cx - 5, cx + 5, cy - 5, cy + 5, z + 5), i % 3 === 0 ? rgba('255,74,94', .9 * k) : rgba('255,190,70', .9 * k)); }
  glow3(0, 230, z + 80, 620, '255,176,96', .34 * k, .6);
  floorPool(0, z + 420, 620, '255,176,100', .2 * k);
}

/* the far end: a pool of cold light on the grey steel door of the break room, the exit sign over it */
function drawFarEnd(ctt, lt, flick) {
  const z = ZF - 1;
  glow3(0, 330, z - 40, 640, '170,210,255', .3 + .5 * pulse(lt, B('end').s + .1, .14), .6);
  floorPool(0, z - 380, 440, '170,210,255', .32);
  const p = P3(0, 0, z);
  if (p && Math.abs(VIEW.yaw) < .25 && p[2] > .12) {
    const kk = p[2] * .95;
    if (window.S13 && S13.breakDoor) { ctx.save(); S13.breakDoor(p[0], p[1], kk, { noReader: true, noWet: true, plaque: false, t: lt, boltT: [B('end').s + .1, B('end').s + .17], sign: kk > .22 }); ctx.restore(); }
    else poly3(rectZ(-185, 185, 0, 504, z), '#8a93a0', 'rgba(8,6,16,.7)', 2);
    // the exit sign
    const ex = P3(0, 590, z - 4);
    if (ex) {
      const sw = 150 * kk, sh = 54 * kk;
      ctx.save(); ctx.fillStyle = '#0c2a18'; rr(ex[0] - sw / 2, ex[1] - sh / 2, sw, sh, 6 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = Math.max(1, 2 * kk); ctx.stroke();
      ctx.fillStyle = '#72ffb0'; rr(ex[0] - sw / 2 + 4 * kk, ex[1] - sh / 2 + 4 * kk, sw - 8 * kk, sh - 8 * kk, 4 * kk); ctx.fill(); ctx.restore();
      V2.glow(ex[0], ex[1], 200 * kk, '110,255,170', .55, 'screen', .8);
      if (sh > 18) UI.label('EXIT', ex[0], ex[1], { size: sh * .56, weight: 900, fill: '#0b3a1e', hero: false, spacing: sh * .05 });
    }
  }
}

/* the ceiling: a duct down the middle, dim emergency units, sprinkler heads */
function drawCeiling(ctt) {
  const y = CH;
  for (let z = 0; z < ZF; z += 520) {
    const dep = toCam(0, y, z)[2]; if (dep < NEAR || dep > 4200) continue;
    const fk = fogK(dep);
    poly3([[-70, y - 2, z], [70, y - 2, z], [70, y - 2, z + 190], [-70, y - 2, z + 190]], hexOf(mix([48, 54, 78], FOG, fk * .8)), 'rgba(6,4,12,.6)', 1.5);
    const lit = .12 + .06 * Math.sin(ctt * 1.3 + z);
    poly3([[-54, y - 3, z + 24], [54, y - 3, z + 24], [54, y - 3, z + 166], [-54, y - 3, z + 166]], rgba('150,190,255', lit * (1 - fk)));
    glow3(0, y - 6, z + 95, 200, '120,160,255', .09 * (1 - fk), .1);
  }
  for (const sx of [-1, 1]) line3([sx * 44, y - 56, 0], [sx * 44, y - 56, ZF], 'rgba(10,8,18,.55)', 5);
  poly3([[-44, y - 58, 0], [44, y - 58, 0], [44, y - 58, ZF], [-44, y - 58, ZF]], 'rgba(34,38,56,.75)');
  poly3([[-44, y, 0], [-44, y - 58, 0], [-44, y - 58, ZF], [-44, y, ZF]], 'rgba(18,20,34,.8)');
  poly3([[44, y, 0], [44, y - 58, 0], [44, y - 58, ZF], [44, y, ZF]], 'rgba(18,20,34,.8)');
}
/* tile seams, so the floor and ceiling carry the orbit */
function drawSeams() {
  ctx.save(); ctx.lineWidth = 1.4;
  const z0 = Math.max(ZN, Math.ceil((VIEW.z - 200) / 110) * 110);
  for (let z = z0 - 110; z < Math.min(ZF, VIEW.z + 3600); z += 110) { const f = 1 - (z - VIEW.z) / 3800; line3([-HW, 0, z], [HW, 0, z], `rgba(150,170,255,${.035 * clamp01(f)})`, 1.4); }
  for (let x = -HW + 126; x < HW; x += 126) line3([x, 0, Math.max(ZN, VIEW.z - 900)], [x, 0, Math.min(ZF, VIEW.z + 3600)], 'rgba(150,170,255,.04)', 1.4);
  ctx.restore();
}
/* things on the walls between the doors: notice boards, extinguisher cabinets, framed pictures, a sanitiser by every door */
function drawWallDecor() {
  for (const d of DOORS) {
    const s = d.side, kind = d.i % 4, z = d.z + 214, dep = toCam(s * HW, 200, z)[2]; if (dep < NEAR || dep > 4600) continue;
    const fk = fogK(dep), mixc = c => hexOf(mix(c, FOG, fk * .85));
    if (kind === 0) {   // a cork board with three notes
      wallQuad(s, 210, 330, z - 62, z + 62, mixc([80, 56, 40]), 'rgba(6,4,12,.7)', 1.6);
      for (let i = 0; i < 3; i++) wallQuad(s, 236 + (i % 2) * 36, 290 + (i % 2) * 24, z - 46 + i * 34, z - 22 + i * 34, mixc([210, 205, 190]));
    } else if (kind === 1) {   // a fire extinguisher cabinet
      wallQuad(s, 90, 270, z - 26, z + 26, mixc([150, 24, 38]), 'rgba(6,4,12,.7)', 1.6);
      wallQuad(s, 112, 246, z - 15, z + 15, mixc([30, 34, 46]));
    } else if (kind === 2) {   // a framed picture
      wallQuad(s, 220, 340, z - 52, z + 52, mixc([36, 28, 40]), 'rgba(6,4,12,.7)', 1.6);
      wallQuad(s, 232, 328, z - 40, z + 40, mixc([70, 110, 120]));
    }
    wallQuad(s, 150, 190, z + 128, z + 150, mixc([170, 178, 190]), 'rgba(6,4,12,.5)', 1.2);   // the sanitiser
  }
}

function drawHallDressing() {
  for (const side of [-1, 1]) {
    line3([side * (HW - 16), 168, ZN], [side * (HW - 16), 168, ZF], 'rgba(150,110,100,.38)', 7);
    line3([side * HW, RAIL, ZN], [side * HW, RAIL, ZF], 'rgba(110,80,90,.4)', 5);
    line3([side * HW, 10, ZN], [side * HW, 10, ZF], 'rgba(10,8,16,.5)', 6);
  }
}

/* a four-point glint (copied from ep11_exit.js) */
function glint(x, y, r, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.fillStyle = `rgba(255,176,182,${Math.min(1, a)})`;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .12, -r * .12, r, 0); ctx.quadraticCurveTo(r * .12, r * .12, 0, r); ctx.quadraticCurveTo(-r * .12, r * .12, -r, 0); ctx.quadraticCurveTo(-r * .12, -r * .12, 0, -r); ctx.fill(); ctx.restore();
}
/* a beam that passes close to the lens throws a flare across the frame */
function lensFlares(states) {
  const m = ctx.getTransform();
  for (const b of BEAMS) {
    const st = states[b.i]; if (!st.on) continue;
    const ca = toCam(...b.A), cb = toCam(...b.B), dx = cb[0] - ca[0], dy = cb[1] - ca[1], dz = cb[2] - ca[2], l2 = dx * dx + dy * dy + dz * dz;
    let t = -(ca[0] * dx + ca[1] * dy + ca[2] * dz) / l2; t = Math.max(0, Math.min(Math.min(1, st.ext), t));
    const p = [ca[0] + dx * t, ca[1] + dy * t, ca[2] + dz * t], d = Math.hypot(p[0], p[1], p[2]);
    if (p[2] < NEAR * 2 || d > 360) continue;
    const q = scr(p), dv = m.transformPoint({ x: q[0], y: q[1] });
    if (dv.x < -80 || dv.x > W + 80 || dv.y < -80 || dv.y > H + 80) continue;
    V2.flare(dv.x, dv.y, Math.pow(1 - d / 360, 1.5) * .75 * st.I, '255,96,118');
  }
}

/* beams ------------------------------------------------------------------------------------------------------------------------------------ */
const BW = { halo: 36, glow: 12, core: 2.8 };   /* world units */
function beamState(b, lt, ctt) {
  const k = lt - T_ON(b.i);
  if (k < 0) return { on: 0, ext: 0, I: 0 };
  const ext = easeOut(clamp01(k / .09)), flick = k < .36 ? (hash(Math.floor(k * 38) + b.i * 7.1) > .38 ? 1 : .22) : 1;
  return { on: 1, ext, I: flick * (.88 + .12 * Math.sin(ctt * 3.1 + b.ph)) * (1 + .9 * pulse(lt, B('end').s + .1, .09)) };
}
/* a beam is a cylinder of light: in perspective its outline is a trapezoid (straight edges), wide where it is near the lens */
function strip(p, q, hw0, hw1, fill) {
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
  if (L < .5) return;
  const nx = -dy / L, ny = dx / L;
  ctx.fillStyle = fill; ctx.beginPath();
  ctx.moveTo(p[0] + nx * hw0, p[1] + ny * hw0); ctx.lineTo(q[0] + nx * hw1, q[1] + ny * hw1); ctx.lineTo(q[0] - nx * hw1, q[1] - ny * hw1); ctx.lineTo(p[0] - nx * hw0, p[1] - ny * hw0); ctx.closePath(); ctx.fill();
}
const BEAM_PASS = [[88, .014, RED], [62, .02, RED], [43, .028, RED], [30, .04, RED], [20, .055, RED], [13, .09, RED], [8.6, .17, RED], [5.6, .3, '255,110,125'], [3.6, .55, '255,160,170'], [2.2, .95, '255,226,230']];
const GHOST_PASS = [[7, .16, CYAN], [2.6, .8, '225,248,255']];
/* draw the part [ta, tb] of beam b (t 0 at its dome, 1 at the sensor). o.mirror draws its reflection in the glossy floor, o.k scales the strength, o.ghost draws it as seen through her */
function drawBeamPart(b, ta, tb, I, o = {}) {
  if (tb <= ta || I <= 0) return;
  const m = o.mirror ? -1 : 1, A = b.A, Bp = b.B, kk = o.k ?? 1;
  const wp = t => [A[0] + (Bp[0] - A[0]) * t, (A[1] + (Bp[1] - A[1]) * t) * m, A[2] + (Bp[2] - A[2]) * t];
  const sg = clipSeg(toCam(...wp(ta)), toCam(...wp(tb)));
  if (!sg) return;
  const p = scr(sg[0]), q = scr(sg[1]);
  if (!(Math.abs(p[0]) < 1e5 && Math.abs(p[1]) < 1e5 && Math.abs(q[0]) < 1e5 && Math.abs(q[1]) < 1e5)) return;
  const fade = o.mirror ? Math.exp(-Math.abs((lerp(A[1], Bp[1], (ta + tb) / 2))) / 300) : 1;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const wmax = Math.max(p[2], q[2]) * BEAM_PASS[0][0] / 2, passes = o.ghost ? GHOST_PASS : o.mirror ? BEAM_PASS.slice(0, 7) : wmax < 8 ? BEAM_PASS.slice(4) : wmax > 60 ? BEAM_PASS.filter((_, i) => i % 2 === 1 || i > 7) : BEAM_PASS;
  for (const [w, a, c] of passes) {
    const hw0 = Math.min(130, Math.max(.9, w * p[2] / 2)) * (o.mirror ? .8 : 1), hw1 = Math.min(130, Math.max(.9, w * q[2] / 2)) * (o.mirror ? .8 : 1);
    strip(p, q, hw0, hw1, rgba(c, Math.min(1, a * I * kk * fade)));
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
  const N = o.n ?? 170, R = o.range ?? 3200, zLo = Math.max(VIEW.z - 150, ZN), seed = o.seed ?? 0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const h1 = hash(i * 1.31 + .5 + seed), h2 = hash(i * 2.17 + 3.1 + seed), h3 = hash(i * .77 + 9.9 + seed), h4 = hash(i * 3.31 + 1.2 + seed), h5 = hash(i * 5.7 + 2.2 + seed);
    const X = (h1 * 2 - 1) * (HW - 40) + 26 * Math.sin(ctt * (.3 + h4 * .5) + i);
    const Y = 18 + ((h2 * 660 - ctt * (3 + 6 * h5)) % 660 + 660) % 660 + 14 * Math.sin(ctt * .6 + i * 2.1);
    const Z = zLo + ((h3 * R + ctt * (9 + 20 * h4)) % R);
    const p = P3(X, Y, Z); if (!p) continue;
    if (p[0] < -30 || p[0] > W + 30 || p[1] < -30 || p[1] > H + 30) continue;
    let gain = 0;
    for (let bi = 0; bi < BEAMS.length; bi++) {
      const st = states[bi]; if (!st || !st.on) continue;
      const b = BEAMS[bi], d = segDist([X, Y, Z], b.A, b.B);
      if (d < 90) gain = Math.max(gain, Math.exp(-(d / 38) * (d / 38)) * st.I);
    }
    const tw = .6 + .4 * Math.sin(ctt * (1.1 + h5 * 1.6) + i), far = Math.exp(-p[3] / 3000);
    const big = i % 11 === 0 && p[3] < 1400;   /* a soft mote close to the lens */
    const a = (.22 + .85 * gain) * tw * (.4 + .6 * far), sz = Math.max(1.3, (1.9 + h5 * 1.8) * p[2] * (1 + gain * .9)) * (big ? 3.2 : 1);
    ctx.fillStyle = gain > .2 ? `rgba(255,${200 - 90 * gain | 0},${205 - 100 * gain | 0},${Math.min(1, a) * (big ? .5 : 1)})` : `rgba(190,200,255,${Math.min(1, a) * (big ? .35 : 1)})`;
    ctx.beginPath(); ctx.arc(p[0], p[1], sz, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* drifting billows of mist in the hall: the beams and the domes shine through them */
function drawMist(ctt) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const z0 = Math.floor((VIEW.z - 300) / 800) * 800;
  for (let i = 0; i < 6; i++) {
    const z = z0 + i * 800 + 90 * Math.sin(ctt * .13 + i * 2.1), h = hash(i + Math.floor(z0 / 800) * 9.7);
    const x = (h * 2 - 1) * 260 + 40 * Math.sin(ctt * .21 + i), y = 120 + hash(i * 1.7 + Math.floor(z0 / 800)) * 360;
    const p = P3(x, y, z); if (!p || p[3] > 4800) continue;
    const r = Math.min(430, 480 * p[2]), a = .06 * (1 - p[3] / 5200) * (.7 + .3 * Math.sin(ctt * .4 + i));
    if (r < 30 || p[0] < -r || p[0] > W + r || p[1] < -r || p[1] > H + r) continue;
    ctx.fillStyle = V2.radial(p[0], p[1], 0, r, [[0, rgba('150,60,110', a)], [.6, rgba('120,40,90', a * .5)], [1, rgba('90,30,80', 0)]]);
    ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawHall(lt, ctt, states) {
  const DI = DOORS.map(d => doorI(d, lt, ctt));
  hallShell(DI);
  drawSeams();
  drawNearEnd(ctt);
  drawCeiling(ctt);
  drawHallDressing();
  drawWallDecor();
  const order = DOORS.map(d => [toCam(d.side * HW, 200, d.z)[2], d]).sort((a, b) => b[0] - a[0]);
  for (const [, d] of order) {
    const I = DI[d.i];
    drawDoor(d, Math.min(1.2, I), d.tv ? .5 + .5 * (Math.sin(ctt * 9 + d.z) > .1 ? 1 : .25) * (.8 + .2 * Math.sin(ctt * 23)) : 0);
    drawDome(d, I);
  }
  for (const b of BEAMS) drawSensor(b, states[b.i]);
  drawFarEnd(ctt, lt);
  drawMist(ctt);
  for (const d of DOORS) {
    const I = DI[d.i], X = d.side * HW, dd = toCam(X, 478, d.z)[2];
    if (dd < NEAR || dd > 4300) continue;
    glow3(X - d.side * 14, 478, d.z, 200, RED, .3 * I, .5);
    if (d.tv) floorPool(X - d.side * 100, d.z, 170, '110,160,255', .12 * (.5 + .5 * (Math.sin(ctt * 9 + d.z) > .1 ? 1 : .25)));
    floorPool(X - d.side * 140, d.z, 190, RED, .2 * I);
    const f0 = P3(X - d.side * 8, 1, d.z), f1 = P3(X - d.side * 8, -430, d.z);
    if (f0 && f1) {   // the dome's reflection in the glossy floor: a streak that swells and fades, not a bar
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(f0[0], f0[1], f1[0], f1[1]);
      g.addColorStop(0, rgba(RED, 0)); g.addColorStop(.18, rgba(RED, .3 * I)); g.addColorStop(.45, rgba(RED, .16 * I)); g.addColorStop(1, rgba(RED, 0));
      ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, 15 * f0[2]); ctx.beginPath(); ctx.moveTo(f0[0], f0[1]); ctx.lineTo(f1[0], f1[1]); ctx.stroke();
      ctx.lineWidth = Math.max(8, 46 * f0[2]); ctx.globalAlpha = .28; ctx.stroke(); ctx.restore();
    }
  }
  // haze: a band of mist at the horizon of the hall and a glow at its far end
  const hz = P3(0, VIEW.y, ZF);
  if (hz) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = V2.grad(0, hz[1] - 260, 0, hz[1] + 220, [[0, 'rgba(90,40,100,0)'], [.5, 'rgba(120,40,90,.13)'], [1, 'rgba(60,20,70,0)']]); ctx.fillRect(-200, hz[1] - 260, W + 400, 480);
    ctx.restore();
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

// ================================================================== the three beams that read her badge (the laserpass cues): placed so each touches her body at its cue
const HIT_R = 80;
/* bi: which beam; cue: seconds into the lasers beat; Y: the height at which it first touches her */
const HITS = [{ bi: 0, cue: .8, Y: 132 }, { bi: 2, cue: 1.6, Y: 152 }, { bi: 4, cue: 2.4, Y: 172 }];
let HITS_FOR = -1;
function solveHits() {
  const L = B('lasers');
  if (HITS_FOR === L.s) return;
  HITS_FOR = L.s;
  for (const h of HITS) {
    const b = BEAMS[h.bi], XA = b.A[0], zA = b.A[2], YA = b.A[1];
    h.tc = L.s + h.cue;
    const qx = herX(h.tc), qz = herZ(h.tc);
    /* slope m (dz per dx) of the beam in the floor plan: its distance from her axis at the cue is HIT_R, with the beam ahead of her */
    const dist = m => ((qz - zA) - m * (qx - XA)) / Math.sqrt(1 + m * m);
    const g = m => dist(m) + HIT_R;
    let lo = -6, hi = 6; const g0 = g(lo) > 0;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if ((g(mid) > 0) === g0) lo = mid; else hi = mid; }
    const m = (lo + hi) / 2, XB = -XA, Xf = XA + ((qx - XA) + m * (qz - zA)) / (1 + m * m);
    const yB = Math.max(14, YA + (h.Y - YA) * (XB - XA) / (Xf - XA));
    b.B = [XB, yB, zA + m * (XB - XA)];
    h.m = m; h.P = [Xf, lerp(YA, yB, (Xf - XA) / (XB - XA)), zA + m * (Xf - XA)];
    b.hit = h;
  }
}

// ================================================================== Strawberry's path and the slow-motion walk
const STRAW_ACC = ['steth', 'bandage7', 'perdiem9', 'fp13_ear'];
const V0 = 290, STRIDE = 48, Z_START = 1300;
const herZ = lt => { const c0 = B('lasers').s, e = B('end').s - .02; return lt >= e ? 4300 + V0 * (lt - e) : lt <= c0 ? Z_START : Z_START + V0 * (ct(lt) - c0); };
const herGait = lt => { const c0 = B('lasers').s; return lt <= c0 ? 0 : V0 * (ct(lt) - c0); };
const herX = lt => lt >= B('end').s - .02 ? -300 + 36 * sstep(lt, B('end').s, B('end').s + 1.2) : lt < B('lr1').s ? 0 : -190 + 40 * sstep(ct(lt) - B('lasers').s, 0, 1.3);
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
/* the camera whips sideways into each flash cut of the slow walk and settles out of it (the white flash hides the join) */
function whipDx(lt) {
  const c = CUTS();
  for (const tc of [c.l2, c.l3]) {
    if (lt >= tc - .075 && lt < tc) return -640 * Math.pow(seg(lt, tc - .075, tc), 3);
    if (lt >= tc && lt < tc + .09) return 640 * Math.pow(1 - seg(lt, tc, tc + .09), 4);
  }
  return 0;
}
function viewFor(lt) {
  const sh = shotId(lt), c = CUTS(), L = B('lasers'), zH = herZ(lt), xH = herX(lt);
  const v = { shot: sh, roll: 0, zoom: 1, dof: 0, sil: 0, reflect: true, close: false };
  switch (sh) {
    case 'open': {
      const k = easeIO(clamp01(lt / c.lr1));
      v.view = { x: 0, y: 230, z: lerp(-330, -120, k), yaw: 0, pitch: .0, F: 1400, cx: W / 2, cy: 900 }; v.sil = 1; break;
    }
    case 'lr1': {
      const k = clamp01((lt - c.lr1) / (c.sr1 - c.lr1));
      v.view = orbit(xH, 226, zH, 14 * D2R, lerp(620, 570, easeIO(k)), 205, 1400, 520, 790); v.dof = 9; v.roll = -.012; v.close = true; break;
    }
    case 'sr1': {
      const k = clamp01((lt - c.sr1) / (c.l1 - c.sr1));
      v.view = orbit(xH, 226, zH, 9 * D2R, lerp(590, 545, easeOut(k)), 215, 1400, 560, 785); v.dof = 10; v.roll = .03; v.close = true; break;
    }
    case 'L1': {
      const k = clamp01((lt - c.l1) / (c.l2 - c.l1));
      v.view = orbit(xH, 200, zH, lerp(30, 12, easeIO(k)) * D2R, lerp(580, 540, k), 70, 1000, 540, 870); v.dof = 0; v.roll = lerp(-.035, -.01, k); break;
    }
    case 'L2': {
      const k = clamp01((lt - c.l2) / (c.l3 - c.l2));
      v.view = orbit(xH + 40, 190, zH, lerp(58, 74, easeIO(k)) * D2R, 400, 120, 760, 540, 860); v.roll = lerp(.06, .02, k); v.side = true; break;
    }
    case 'L3': {
      const k = clamp01((lt - c.l3) / (c.lr2 - c.l3)), e = easeIO(k);
      v.view = orbit(xH, 150, zH, lerp(10, 3, e) * D2R, lerp(1250, 1000, e), lerp(430, 280, e), 1300, 540, lerp(800, 850, k)); v.roll = lerp(-.025, 0, k); v.reflect = false; break;
    }
    case 'lr2': {
      const k = clamp01((lt - c.lr2) / (c.sr2 - c.lr2));
      v.view = orbit(xH, 205, zH, lerp(14, 2, k) * D2R, 760, 165, 1300, 540, 790); v.dof = 0; break;
    }
    case 'sr2': {
      const k = clamp01((lt - c.sr2) / (c.end - c.sr2));
      v.view = orbit(xH, 226, zH, 7 * D2R, lerp(610, 565, easeIO(k)), 210, 1400, 540, 790); v.dof = 9; v.close = true; break;
    }
    default: {
      const k = clamp01((lt - c.end) / (CUR.dur - c.end));
      v.view = { x: 0, y: 270, z: lerp(-420, -260, k), yaw: 0, pitch: .008, F: lerp(2500, 3000, easeIO(k)), cx: W / 2, cy: 940 }; v.sil = 1; v.reflect = true; break;
    }
  }
  const wd = whipDx(lt); if (wd) { v.view.cx += wd; v.whip = true; }
  if (v.shot === 'lr1' || v.shot === 'sr1' || v.shot === 'sr2' || v.shot === 'lr2') { v.view.cx += 5 * Math.sin(lt * 1.3) + 3 * Math.sin(lt * 2.9 + 1); v.view.cy += 4 * Math.sin(lt * 1.1 + 2); v.roll += .003 * Math.sin(lt * .9); }
  return v;
}

// ================================================================== layering: a beam is cut where it passes her depth, so it can pass behind, through and in front of her
function beamSplit(b, zc, delta) {
  const za = toCam(b.A[0], b.A[1], b.A[2])[2], zb = toCam(b.B[0], b.B[1], b.B[2])[2], f = t => za + (zb - za) * t, ts = [0, 1];
  if (Math.abs(zb - za) > 1e-6) for (const zz of [zc - delta, zc + delta]) { const t = (zz - za) / (zb - za); if (t > 0 && t < 1) ts.push(t); }
  ts.sort((a, b2) => a - b2);
  const out = [];
  for (let i = 0; i < ts.length - 1; i++) { const z = f((ts[i] + ts[i + 1]) / 2); out.push({ ta: ts[i], tb: ts[i + 1], cls: z < zc - delta ? 'near' : z > zc + delta ? 'far' : 'mid' }); }
  return out;
}
function beamsPass(states, ctt) {
  for (const b of BEAMS) {
    const st = states[b.i]; if (!st.on) continue;
    drawBeamPart(b, 0, st.ext, st.I);
    drawBeamPackets(b, st.I, ctt, st.ext);
  }
}
/* the last shot: the whole grid converges on the door, so the beams are laid in a private layer and a soft hole is cut around the door's sign (the lasers dissolve into the cold glare there and the policy stays readable) */
let BLAY = null;
function beamsClear(states, ctt) {
  const hz = P3(0, 0, ZF - 1);
  if (!hz) { beamsPass(states, ctt); return; }
  if (!BLAY) { BLAY = V2.mk(W, H); BLAY.__txOK = true; }
  const kk = hz[2] * .95, hx = hz[0], hy = hz[1] - 358 * kk, rx = 155 * kk * 1.55, ry = 116 * kk * 1.6;
  const m = ctx.getTransform(), prev = ctx, Lg = BLAY.getContext('2d');
  Lg.setTransform(1, 0, 0, 1, 0, 0); Lg.globalCompositeOperation = 'source-over'; Lg.globalAlpha = 1; Lg.clearRect(0, 0, W, H);
  Lg.setTransform(m);
  ctx = Lg; beamsPass(states, ctt);
  Lg.globalCompositeOperation = 'destination-out';
  Lg.save(); Lg.translate(hx, hy); Lg.scale(1, ry / rx);
  Lg.fillStyle = V2.radial(0, 0, 0, rx, [[0, 'rgba(0,0,0,.95)'], [.6, 'rgba(0,0,0,.82)'], [1, 'rgba(0,0,0,0)']]);
  Lg.beginPath(); Lg.arc(0, 0, rx, 0, TAU); Lg.fill(); Lg.restore();
  Lg.globalCompositeOperation = 'source-over';
  ctx = prev;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(BLAY, 0, 0); ctx.restore();
}

// ================================================================== Strawberry: acting
const LOOKS = [[0, 0, .05], [.25, -.5, .1], [.5, -.15, 0], [.75, .5, .1], [1.0, .2, -.05], [1.22, 0, 0]];   /* her eyes in the slow walk: [character seconds, x, y] */
const keyed = (keys, t) => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = easeIO(clamp01((t - a[0]) / (b[0] - a[0]))); return b.slice(1).map((v, j) => lerp(a[j + 1], v, k)); }
  return keys[keys.length - 1].slice(1);
};
const EAR_GRIP = { l: [-124, -38] };   /* her hand on the earpiece */
function acting(lt, ctt, v) {
  const L = B('lasers'), lr1 = B('lr1'), sr1 = B('sr1'), lr2 = B('lr2'), sr2 = B('sr2'), u = ctt - L.s;
  const a = { expr: 'dead', face: { asym: true }, look: [0, .05], arms: { l: 'rest', r: 'rest' }, who: 'straw' };
  a.earLed = Math.max(talk('lemonr'), talk('strawr'));
  if (lt < lr1.s) {   /* the open: she checks her earpiece at the beeps, then drops her hand */
    const hand = sstep(lt, .22, .4) * (1 - sstep(lt, .95, 1.15));
    a.arms = { l: hand > .5 ? 'hold' : 'rest', r: 'rest' }; if (hand > .5) a.grip = EAR_GRIP;
  } else if (lt < sr1.s) {   /* Lemon on the radio: she listens, a hand on her earpiece */
    a.arms = { l: 'hold', r: 'rest' }; a.grip = EAR_GRIP;
    const gh = wordT('lr1', 'ghost', lr1.s), cl = wordT('lr1', 'clear', lr1.s + .7), en = wordT('lr1', 'enter', lr1.s + 1.2), ha = wordT('lr1', 'hall', lr1.s + 1.7);
    a.look = lt < gh + .1 ? [0, .04] : lt < cl ? [-.38, .12] : lt < en ? [.05, .02] : lt < ha ? [.62, -.04] : [0, .02];
    a.squash = .055 * pulse(lt, gh + .12, .09);
    a.browUp = 7 * sstep(lt, ha - .05, ha + .15) * (1 - sstep(lt, ha + .55, ha + .9));
    a.lid = lt > en && lt < ha ? .42 : lt > ha + .55 ? .6 : undefined;
  } else if (lt < L.s) {   /* "Copy." */
    a.who = 'strawr'; a.arms = { l: 'hold', r: 'rest' }; a.grip = EAR_GRIP;
    a.look = [0, .02];
    a.squash = .07 * pulse(lt, sr1.s + .16, .08);
    a.lid = lt > sr1.e + .02 ? .62 : undefined;
  } else if (lt < B('lr2').s - .03) {   /* the slow walk */
    a.look = keyed(LOOKS, u);
    const ph = herGait(lt) / (4 * STRIDE) * TAU;
    a.arms = { l: [.3 + .3 * Math.sin(ph), .25], r: [.3 + .3 * Math.sin(ph + PI), .25] };
    a.sway = .09 * Math.sin(u * 5.2) * Math.exp(-u * .9) + .05 * Math.sin((u - 1.0) * 6) * (u > 1 ? Math.exp(-(u - 1) * 1.2) : 0);
    a.badgeSwing = .2;
    a.rot = -.025;
  } else if (lt < sr2.s - .05) {   /* "The lights can't see you." */
    const ph = herGait(lt) / (4 * STRIDE) * TAU, se = wordT('lr2', 'see', lr2.s + .85), yo = wordT('lr2', 'you', lr2.s + 1.05);
    a.arms = { l: [.3 + .3 * Math.sin(ph), .25], r: [.3 + .3 * Math.sin(ph + PI), .25] };
    a.look = lt < se ? [-.25, .1] : lt < yo ? [.5, .05] : [0, .0];
    if (lt > yo) { a.expr = 'smug'; a.face = {}; }
    a.badgeSwing = .14;
  } else if (lt < B('end').s - .02) {   /* "Nobody can." */
    a.who = 'strawr';
    const ph = herGait(lt) / (4 * STRIDE) * TAU, ca = wordT('sr2', 'can', sr2.s + .4);
    a.arms = { l: [.3 + .3 * Math.sin(ph), .25], r: [.3 + .3 * Math.sin(ph + PI), .25] };
    a.look = [0, .0];
    a.squash = .06 * pulse(lt, ca + .05, .09);
    if (lt > ca) { a.expr = 'smug'; a.face = {}; }
    a.badgeSwing = .1;
  } else {   /* the silhouette walks on */
    const ph = herGait(lt) / (4 * STRIDE) * TAU;
    a.arms = { l: [.3 + .3 * Math.sin(ph), .25], r: [.3 + .3 * Math.sin(ph + PI), .25] };
  }
  return a;
}

// ================================================================== Strawberry
function strawOpts(lt, ctt, v, pl) {
  const L = B('lasers'), walking = lt >= L.s, gait = herGait(lt), a = acting(lt, ctt, v);
  const o = A11.straw(Object.assign({ x: pl.x, y: pl.y, s: pl.s, id: 'straw', acc: STRAW_ACC, t: ctt, stride: STRIDE, earSide: -1, reflectA: .5 }, a));
  if (walking) { o.gaitW = gait; o.axis = v.side ? 'x' : 'z'; o.dir = v.sil ? -1 : 1; if (v.side) o.look = [o.look[0] * .5 + .55, o.look[1]]; }
  if (v.sil) o.noFace = true;
  if (v.whip) o.transit = true;
  if (a.squash) o.plant = true;
  if (a.grip) o.hand = { l: 'open' };
  return o;
}

/* where the current camera puts a pre-camera point on the real frame (the engine camera: centre, roll, zoom) */
function toDev(x, y) {
  const m = new DOMMatrix().translate(W / 2, H / 2).rotate(CAM.r * 180 / PI).scale(CAM.z).translate(-CAM.x, -CAM.y), p = m.transformPoint({ x, y });
  return [p.x, p.y];
}
/* the badge on her chest, in pre-camera coordinates (the badge card centre in her local frame: 64 right, 91 below the body centre) */
function badgeAt(pl, flip) { const k = KINDS.straw, legLen = k.leg || 92; return [pl.x + 64 * pl.s * (flip ? -1 : 1), pl.y + 11.8 * pl.s + (91 - legLen - k.ry * .9) * pl.s]; }
/* where the scan crosses her: on her torso under the chin, centred on her */
function earAt(pl) { return [pl.x - 116 * pl.s, pl.y + (11.8 - 92 - 118.8 - 5) * pl.s]; }
function scanAt(pl) { const bd = badgeAt(pl, false); return [pl.x, bd[1] - 34 * pl.s]; }
function faceAt(pl) { const k = KINDS.straw, legLen = k.leg || 92; return [pl.x, pl.y + 11.8 * pl.s - (legLen + k.ry * .9 - (k.eyeY + k.mouthY) / 2) * pl.s]; }

/* the three crossings: how far into each one we are, in scene seconds (negative before it) */
const hitK = (h, lt) => lt - h.tc;
let STRIP = null;
/* draw her into the shared scratch canvas at the current camera transform, dress that layer (silhouette, the beams seen through her, the glitch), then lay it on the picture */
function drawStraw(lt, ctt, v, pl, states) {
  const o = strawOpts(lt, ctt, v, pl), m = ctx.getTransform(), s = pl.s;
  const Lcv = V2.dofCv, Lg = Lcv.getContext('2d');
  const c0 = m.transformPoint({ x: pl.x - 230 * s, y: pl.y - 520 * s }), c1 = m.transformPoint({ x: pl.x + 230 * s, y: pl.y + 150 * s });
  const bx = Math.max(0, Math.floor(Math.min(c0.x, c1.x))), by = Math.max(0, Math.floor(Math.min(c0.y, c1.y)));
  const bw = Math.min(W, Math.ceil(Math.max(c0.x, c1.x))) - bx, bh = Math.min(H, Math.ceil(Math.max(c0.y, c1.y))) - by;
  if (bw < 4 || bh < 4) return;
  Lg.setTransform(1, 0, 0, 1, 0, 0); Lg.globalCompositeOperation = 'source-over'; Lg.globalAlpha = 1; Lg.filter = 'none'; Lg.clearRect(bx, by, bw, bh);
  Lg.setTransform(m);
  const prev = ctx; ctx = Lg;
  drawChar(o);
  if (!v.sil && !v.close) {
    // the beams pass through her: wherever one crosses her body it shows as a thin cool line (only where she is opaque), but never across her face
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    const fc = faceAt(pl);
    ctx.beginPath(); ctx.rect(-W, -H, 3 * W, 3 * H); ctx.ellipse(fc[0], fc[1], 96 * s, 76 * s, 0, 0, TAU); ctx.clip('evenodd');
    for (const b of BEAMS) { const st = states[b.i]; if (!st.on) continue; drawBeamPart(b, 0, st.ext, st.I * (b.hit ? 1 : .5), { ghost: true }); }
    ctx.restore();
  }
  if (v.sil) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(8,4,14,.97)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  ctx = prev;
  // the glitch: a band of her at each crossing slips sideways and goes cool
  if (!v.sil && !v.close) for (const h of HITS) {
    const k = hitK(h, lt), g = k >= 0 && k < .6 ? Math.pow(1 - k / .6, 2) : 0;
    if (g <= .02 || !h.P) continue;
    const q = scanAt(pl);
    const dv = m.transformPoint({ x: q[0], y: q[1] }), half = Math.max(8, 15 * s), y0 = Math.max(by, Math.floor(dv.y - half)), y1 = Math.min(by + bh, Math.ceil(dv.y + half));
    if (y1 - y0 < 3) continue;
    if (!STRIP) { STRIP = V2.mk(W, 400); STRIP.__txOK = true; }
    const Sg = STRIP.getContext('2d'), hh = Math.min(400, y1 - y0);
    Sg.setTransform(1, 0, 0, 1, 0, 0); Sg.clearRect(0, 0, W, 400); Sg.drawImage(Lcv, bx, y0, bw, hh, 0, 0, bw, hh);
    Lg.setTransform(1, 0, 0, 1, 0, 0); Lg.globalCompositeOperation = 'source-over'; Lg.clearRect(bx, y0, bw, hh);
    const dx = (hash(Math.floor(lt * 30) + h.bi * 7) - .5) * 2 * 26 * g * Math.max(.6, s);
    Lg.drawImage(STRIP, 0, 0, bw, hh, bx + dx, y0, bw, hh);
    Lg.globalCompositeOperation = 'source-atop'; Lg.fillStyle = rgba(CYAN, .32 * g); Lg.fillRect(bx, y0, bw, hh);
    Lg.globalCompositeOperation = 'source-over';
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (v.sil) { ctx.shadowColor = 'rgba(255,50,76,.85)'; ctx.shadowBlur = 20; }
  ctx.drawImage(Lcv, bx, by, bw, bh, bx, by, bw, bh);
  ctx.restore();
}
/* what a crossing throws: a flash, a ring along her, sparks that fall slowly, a scan line down the badge */
function hitFx(lt, ctt, v, pl) {
  if (v.sil || v.close) return;
  for (const h of HITS) {
    const k = hitK(h, lt); if (k < 0 || k > 1.4 || !h.P) continue;
    const q = scanAt(pl), kc = ct(lt) - ct(h.tc);
    V2.glow(q[0], q[1], 100 * pl.s + 40, '255,110,125', .7 * pulse(k, 0, .1), 'screen', .8);
    V2.ring(q[0], q[1], k / .7, { r0: 10, r1: 150 * pl.s, color: CYAN, lw: 5, alpha: .9, squash: .45 });
    V2.sparks(q[0], q[1], kc, 0, { n: 14, speed: 300 * pl.s, life: .55, color: '255,120,135', g: 420, size: 3, seed: h.bi * 5 + 1 });
    const bd = badgeAt(pl, false), sc = clamp01(k / .5);
    if (sc < 1) {   /* the scan line sweeps down the badge */
      const bw2 = 34 * pl.s, bh2 = 36 * pl.s, yy = bd[1] - bh2 + 2 * bh2 * easeIO(sc);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(CYAN, .95 * (1 - sc * .3)); ctx.lineWidth = Math.max(2, 3 * pl.s); ctx.beginPath(); ctx.moveTo(bd[0] - bw2, yy); ctx.lineTo(bd[0] + bw2, yy); ctx.stroke();
      ctx.strokeStyle = rgba(CYAN, .35); ctx.lineWidth = Math.max(5, 9 * pl.s); ctx.stroke(); ctx.restore();
    }
  }
}

// ================================================================== text: the plates on the domes, the HUD plate, the radio tag, the BADGE tags
const CY = '#4de3ff', REDH = '#ff3b4e', GLASS = 'rgba(8,10,20,.78)';
const BADGE_SLOT = [1318, 1234, 1318];
/* the rectangles the HUD takes this frame (device space), so the world text keeps clear of them */
function hudRects(lt) {
  const r = [[556, 206, 1032, 310]];
  const rt = radioTag(lt); if (rt) r.push(rt.rect);
  for (const t of badgeTags(lt)) r.push(t.rect);
  return r;
}
/* the radio tag windows: it fades in 0.1 s before a radio line and out 0.2 s after (the two voices never share it: the next one waits for the last to clear) */
function radioTag(lt) {
  const W_ = [['lr1', 'LEMON', 'lemonr'], ['sr1', 'STRAWBERRY', 'strawr'], ['lr2', 'LEMON', 'lemonr'], ['sr2', 'STRAWBERRY', 'strawr']].map(([id, name, who]) => ({ id, name, who, s: B(id).s, e: B(id).e }));
  for (let i = 0; i < W_.length; i++) {
    const w = W_[i], nx = W_[i + 1];
    w.in0 = w.s - .1; w.in1 = w.s;
    w.out0 = w.e; w.out1 = w.e + .2;
    if (nx && nx.s - .1 < w.out1 + .02) { const mid = (w.e + nx.s) / 2; w.out1 = mid - .01; nx.in0 = mid + .01; }
  }
  for (const w of W_) {
    const a = sstep(lt, w.in0, w.in1) * (1 - sstep(lt, w.out0, w.out1));
    if (a <= .01) continue;
    const str = 'RADIO / ' + w.name, size = UI.sizeOf(str, { size: 30, weight: 900, spacing: 2 }), pw = size.w + 2 * 76;
    return { w, a, str, rect: [1034 - pw, 118, 1034, 182] };
  }
  return null;
}
/* the BADGE tags: one per crossing, red for a moment and then cyan */
function badgeTags(lt) {
  const out = [];
  HITS.forEach((h, i) => {
    const k = hitK(h, lt), life = i < 2 ? .8 : 1.2;
    if (k < -.02 || k > life || !h.tc) return;
    const a = sstep(k, 0, .08) * (1 - sstep(k, life - .18, life)), size = UI.sizeOf('BADGE: PER DIEM / NO MATCH', { size: 31, weight: 900, spacing: 1 }), pw = size.w + 2 * 26, cy = BADGE_SLOT[i];
    out.push({ h, i, k, a, cy, pw, rect: [540 - pw / 2, cy - 27, 540 + pw / 2, cy + 27] });
  });
  return out;
}
function wave(cx, cy, mirror, who, lvl) {
  for (let i = 0; i < 5; i++) {
    const hh = 6 + 30 * clamp01(lvl * (.45 + .55 * Math.abs(Math.sin(T * 19 + i * 1.7 + (mirror ? 1.1 : 0)))));
    ctx.fillStyle = CY; rr(cx + (mirror ? -1 : 1) * i * 9 - 2.5, cy - hh / 2, 5, hh, 2.5); ctx.fill();
  }
}
function overRadio(lt) {
  const rt = radioTag(lt); if (!rt) return;
  const o = { anchor: 'right', h: 64, size: 30, weight: 900, spacing: 2, ink: '#d9fbff', fill: GLASS, stroke: CY, lw: 3, padX: 76, alpha: rt.a, talpha: rt.a };
  const p = UI.pill(rt.str, 1034, 150, o);
  reg('overlay', [p.x0, p.y0, p.x1, p.y1], { id: 'radiotag' });
  const lvl = talk(rt.w.who);
  ctx.save(); ctx.globalAlpha *= rt.a; wave(p.x0 + 26, 150, false, rt.w.who, lvl); wave(p.x1 - 26, 150, true, rt.w.who, lvl); ctx.restore();
}
function overHud(lt) {
  const x0 = 556, y0 = 206, w = 476, h = 104, a = sstep(lt, .1, .4);
  if (a <= .01) return;
  const ctt = ct(lt), clock = Math.max(0, 112.4 - ctt), mm = Math.floor(clock / 60), ss = Math.floor(clock % 60), cc = Math.floor((clock % 1) * 100);
  ctx.save(); ctx.globalAlpha *= a;
  const pan = UI.panel([x0, y0, w, h], { id: 'hudplate', kind: 'hud', fill: GLASS, stroke: CY, lw: 3, r: 18, pad: 14 });
  reg('overlay', [x0, y0, x0 + w, y0 + h], { id: 'hud' });
  UI.label('OPERATION BREAK', x0 + 26, y0 + 31, { size: 30, weight: 900, spacing: 3, fill: CY, align: 'left', cid: 'hudplate', center: false });
  // three pips: the countdown beeps (the last, higher one, is the go)
  const beeps = [.3, .55, .8];
  beeps.forEach((tb, i) => {
    const on = lt >= tb, fl = pulse(lt, tb, .07), cx2 = x0 + w - 28 - (2 - i) * 26, cy2 = y0 + 31;
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ell(cx2, cy2, 8, 8); ctx.fill();
    if (on) { ctx.fillStyle = i === 2 ? '#e8fdff' : REDH; ell(cx2, cy2, 8, 8); ctx.fill(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(i === 2 ? CYAN : RED, .55 * (.4 + fl)); ell(cx2, cy2, 15 + 10 * fl, 15 + 10 * fl); ctx.fill(); ctx.restore(); }
  });
  UI.label('T MINUS', x0 + 26, y0 + 72, { size: 30, weight: 900, spacing: 2, fill: '#8fb8c8', align: 'left', cid: 'hudplate', center: false });
  // the running clock in fixed cells, so the digits never shuffle sideways
  const chars = [Math.floor(mm / 10), mm % 10, ':', Math.floor(ss / 10), ss % 10, '.', Math.floor(cc / 10), cc % 10], cw = c => (c === ':' || c === '.') ? 14 : 26;
  let xx = x0 + w - 24 - chars.reduce((q, c) => q + cw(c), 0);
  for (const c of chars) { UI.label(String(c), xx + cw(c) / 2, y0 + 72, { size: 40, weight: 900, fill: '#ffffff', cid: 'hudplate', center: false }); xx += cw(c); }
  ctx.restore();
}
/* the call sign pops beside her when Lemon says it */
function overGhost(lt) {
  const t0 = B('lr1').s, a = sstep(lt, t0, t0 + .08) * (1 - sstep(lt, t0 + .62, t0 + .84));
  if (a <= .01) return;
  const k = lerp(1.22, 1, easeOut(clamp01((lt - t0) / .14))), cx = 188, cy = 470;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
  const p = UI.pill('GHOST', cx, cy, { size: 31, weight: 900, spacing: 3, ink: '#d9fbff', fill: GLASS, stroke: CY, lw: 3, padX: 24, alpha: a, talpha: a });
  reg('overlay', [p.x0, p.y0, p.x1, p.y1], { id: 'ghosttag' });
  ctx.restore();
}
function overTags(lt) {
  for (const t of badgeTags(lt)) {
    const pl = placeAt(herX(lt), herZ(lt)); if (!pl) continue;
    const bd = badgeAt(pl, false), dv = toDev(bd[0], bd[1]), cx = clamp(dv[0], 48 + t.pw / 2, 1032 - t.pw / 2);
    const red = t.k < .3, c = red ? REDH : CY, flick = red ? 1 : (t.k < .42 ? .55 + .45 * Math.sin(t.k * 90) : 1);
    ctx.save(); ctx.globalAlpha *= t.a;
    // the leader line from the tag up to the badge
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(cx, t.cy - 27); ctx.lineTo(dv[0], dv[1] + 30 * pl.s); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(dv[0], dv[1], 40 * pl.s, 0, TAU); ctx.stroke();
    const sc = lerp(1.22, 1, easeOut(clamp01(t.k / .16)));
    ctx.translate(cx, t.cy); ctx.scale(sc, sc); ctx.translate(-cx, -t.cy);
    const p = UI.pill('BADGE: PER DIEM / NO MATCH', cx, t.cy, { size: 31, weight: 900, spacing: 1, ink: red ? '#ffd9dd' : '#dffaff', fill: red ? 'rgba(52,6,14,.9)' : 'rgba(6,28,42,.9)', stroke: c, lw: 3, padX: 26, alpha: flick, talpha: flick });
    reg('overlay', [p.x0, p.y0, p.x1, p.y1], { id: 'badgetag' + t.i });
    ctx.restore();
  }
}
/* a small plate under each dome: the room and what it wants (set dressing, so hero:false); it hangs from the dome on a thread and is drawn only while it is whole on the frame and clear of everything else */
const NEED_LINES = n => { if (n.length <= 9) return [n]; const w = n.split(' '); let best = [n], bd = 1e9; for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), d = Math.abs(a.length - b.length); if (d < bd) { bd = d; best = [a, b]; } } return best; };
const PLATE = { w: 176, h: 98 };
function drawPlates(lt, v, states) {
  if (v.close || v.shot === 'end') return;
  const m = ctx.getTransform(), taken = hudRects(lt).map(r => r.slice()), draw = [];
  taken.push([0, 1380, W, 1700], [48, 116, 500, 244]);
  const hp = placeAt(herX(lt), herZ(lt));
  if (hp) { const a0 = m.transformPoint({ x: hp.x - 150 * hp.s, y: hp.y - 450 * hp.s }), a1 = m.transformPoint({ x: hp.x + 150 * hp.s, y: hp.y + 20 * hp.s }); taken.push([Math.min(a0.x, a1.x), Math.min(a0.y, a1.y), Math.max(a0.x, a1.x), Math.max(a0.y, a1.y)]); }
  const order = BEAMS.map(b => [P3(b.A[0], 372, b.A[2]), b]).filter(([p]) => p).sort((a, b) => b[0][2] - a[0][2]);
  for (const [pa, b] of order) {
    const st = states[b.i]; if (!st.on || !b.room) continue;
    const k = pa[2]; if (k < .5 || k > 1.7) continue;
    const sc = k * .9, w = PLATE.w * sc, h = PLATE.h * sc, px = pa[0], py = pa[1];
    const cs = [[px - w / 2, py - h / 2], [px + w / 2, py - h / 2], [px + w / 2, py + h / 2], [px - w / 2, py + h / 2]].map(([x, y]) => m.transformPoint({ x, y }));
    const r = [Math.min(...cs.map(c => c.x)), Math.min(...cs.map(c => c.y)), Math.max(...cs.map(c => c.x)), Math.max(...cs.map(c => c.y))];
    let a = sstep(Math.min(r[0], r[1], W - r[2], H - r[3]), 8, 70) * sstep(lt, T_ON(b.i) + .25, T_ON(b.i) + .45) * sstep(sc, .56, .64);   /* a plate fades in as it comes close enough to read */
    const area = (r[2] - r[0]) * (r[3] - r[1]);
    for (const t of taken) { const iw = Math.min(r[2], t[2] + 14) - Math.max(r[0], t[0] - 14), ih = Math.min(r[3], t[3] + 14) - Math.max(r[1], t[1] - 14); if (iw > 0 && ih > 0) a *= 1 - clamp01(iw * ih / area / .02); }
    if (a <= .26) continue;
    taken.push(r); draw.push({ b, px, py, sc, h, k, a });
  }
  // the threads first, so no thread ever crosses a plate's lettering
  ctx.save(); ctx.lineCap = 'round';
  for (const d of draw) { const q = P3(d.b.A[0], 436, d.b.A[2]); if (!q) continue; ctx.strokeStyle = rgba('255,59,78', .4 * d.a); ctx.lineWidth = Math.max(1.5, 2.4 * d.k); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(d.px, d.py - d.h / 2); ctx.stroke(); }
  ctx.restore();
  for (const d of draw) {
    const b = d.b, quoted = b.need[0] === '\u201c';
    ctx.save(); ctx.globalAlpha *= d.a;
    ctx.translate(d.px, d.py); ctx.scale(d.sc, d.sc);
    const lines = [{ t: b.room, size: 19, fill: CY, spacing: 2 }].concat(NEED_LINES(b.need.replace(/^\u201c|\u201d$/g, '')).map((t, i, arr) => ({ t: (quoted && i === 0 ? '\u201c' : '') + t + (quoted && i === arr.length - 1 ? '\u201d' : ''), size: 25, fill: '#ffffff' })));
    UI.sign([-PLATE.w / 2, -PLATE.h / 2, PLATE.w, PLATE.h], lines, { fill: 'rgba(8,10,20,.82)', stroke: 'rgba(255,59,78,.9)', lw: 2.4, r: 12, weight: 900, hero: false, id: 'plate' + b.i, pad: 7 });
    ctx.restore();
  }
}

// ================================================================== the scene
const heartAt = lt => { const L = B('lasers'), t = lt - L.s; return Math.max(pulse(t, .3, .09), .6 * pulse(t, .5, .09), pulse(t, 1.15, .09), .6 * pulse(t, 1.35, .09), pulse(t, 2.0, .09), .6 * pulse(t, 2.2, .09)); };
const flashAt = lt => {
  const L = B('lasers'), c = CUTS();
  let f = 0;
  for (const [t0, w, a] of [[L.s, .06, .8], [c.l2, .055, 1], [c.l3, .055, 1], [B('end').s + .1, .03, 0]]) f = Math.max(f, a * pulse(lt, t0, w));
  return f;
};
const isCut = lt => { const c = CUTS(); return [c.lr1, c.sr1, c.l1, c.l2, c.l3, c.lr2, c.sr2, c.end].some(t => Math.abs(lt - t) < 1.6 / FPS); };

const SC = {
  shot: lt => shotId(lt),
  cam(lt) {
    solveHits();
    const v = viewFor(lt);
    setView(v.view);
    CAM.r = v.roll; CAM.z = v.zoom * (1 + .006 * heartAt(lt));
  },
  draw(lt) {
    const ctt = ct(lt), v = viewFor(lt), states = BEAMS.map(b => beamState(b, lt, ctt));
    ctx.fillStyle = '#07050d'; ctx.fillRect(-200, -200, W + 400, H + 400);
    const soft = v.dof > 0;
    V2.dof(v.dof, () => {
      drawHall(lt, ctt, states);
      for (const b of BEAMS) { const st = states[b.i]; if (st.on) drawBeamPart(b, 0, st.ext, st.I, { mirror: true, k: .5 }); }
      if (soft) { beamsPass(states, ctt); drawDust(ctt, states); }
    });
    const zH = herZ(lt), pl = placeAt(herX(lt), zH);
    V2.setLight({ key: [.4, -.7], keyColor: '#ff7a88', keyA: .3, rim: '#4de3ff', rimA: .55, shadow: '#0a0618', shadowA: .5, amb: '#2a2f6a', ambA: .12, bounce: '#ff3b4e', bounceA: .22 });
    V2.opts.reflect = v.reflect;
    const fl = v.close ? .6 + .4 * (Math.sin(lt * 17 + 1) > .05 ? 1 : .15) + .12 * (hash(Math.floor(lt * 30)) - .5) : 1;
    for (const d of DOORS) if (Math.abs(d.z - zH) < 800) { const q = P3(d.side * HW, 478, d.z); if (q) V2.addLight({ x: q[0], y: q[1], r: 900, color: RED, a: .55 * fl }); }
    if (v.close && pl) V2.addLight({ x: pl.x - 360, y: pl.y - 300 * pl.s, r: 1100, color: RED, a: .55 * fl });
    if (!soft) { if (v.shot === 'end') beamsClear(states, ctt); else beamsPass(states, ctt); }
    if (pl) { drawStraw(lt, ctt, v, pl, states); hitFx(lt, ctt, v, pl); }
    if (pl && v.shot === 'open') { const e = earAt(pl), bl = Math.max(.25, pulse(lt, .3, .06), pulse(lt, .55, .06), pulse(lt, .8, .06)); V2.glow(e[0], e[1], 30 * pl.s + 8, CYAN, .9 * bl, 'screen', .6); }
    if (!soft) drawDust(ctt, states);
    for (const b of BEAMS) { const q0 = P3(b.A[0], b.A[1], b.A[2]); if (q0 && lt >= T_ON(b.i) && lt < T_ON(b.i) + .5) V2.sparks(q0[0], q0[1], lt, T_ON(b.i), { n: 9, speed: 240 * q0[2] + 40, life: .45, color: '255,130,140', g: 700, size: 2.4, seed: b.i + 11 }); }
    for (const b of BEAMS) { const k = lt - T_ON(b.i); if (k >= 0 && k < .26) { const q = P3(b.A[0], b.A[1], b.A[2]); if (q) glint(q[0], q[1], Math.min(46, 52 * q[2]) * (1 - k / .26) + 8, .8 * (1 - k / .26)); } }
    if (!v.close) lensFlares(states);
    const se = lt - (B('end').s + .1);
    if (se > 0 && se < .8 && v.shot === 'end') { const q = P3(0, 250, ZF); if (q) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; V2.ring(q[0], q[1], se / .8, { r0: 30 * q[2], r1: 900 * q[2], color: '200,235,255', lw: 9, alpha: .8, squash: 1 }); ctx.restore(); } }
    drawPlates(lt, v, states);
  },
  fx: lt => {
    const L = B('lasers'), u = lt - L.s, hb = heartAt(lt), inL = u >= 0 && u < L.e - L.s;
    const ab = inL ? 8 * pulse(u, .05, .22) + 5 * pulse(u, 3.45, .2) + 4 * pulse(u, 1.1, .05) + 4 * pulse(u, 2.15, .05) : 3.5 * pulse(lt, B('end').s + .1, .08);
    return { bloom: .85 + .9 * pulse(lt, B('end').s + .1, .12), vignette: .55 + .11 * hb * (inL ? 1 : 0), grain: .05, contrast: .22, sat: .08,
      aberr: ab < .25 ? 0 : ab,   /* exactly 0 when it cannot be seen: the engine skips the three-channel split then */
      tint: [['#28306a', .22, 'soft-light'], ...(inL ? [['#ff1830', .12 * hb, 'soft-light']] : [])],
      fade: Math.max(flashAt(lt), 1 - sstep(lt, 0, .3)), fadeColor: lt < .35 ? '0,0,0' : '255,255,255' };
  },
  blur: lt => {
    if (isCut(lt)) return 1;
    { const c = CUTS(); for (const tc of [c.l2, c.l3]) if (lt > tc - .065 && lt < tc + .06) return 1; }   /* the whip is hidden in the flash: sharp frames, no ghosting */
    if (whipDx(lt)) return 3;
    const L = B('lasers'), u = lt - L.s;
    if (u >= 0 && u < L.e - L.s && (u < .6 || u > L.e - L.s - .7)) return 3;   /* raised on the two speed ramps */
    return 2;
  },
  over(lt) {
    SC.cam(lt);
    overHud(lt); overRadio(lt); overGhost(lt); overTags(lt);
  },
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.hall = SC;
})();
