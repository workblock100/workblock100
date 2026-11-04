'use strict';
/* SHIFT HAPPENS, Episode 19: "The Potluck". Builder E19-SIGNUP. Scenes `signup` (3:15 PM, THE SIGN-UP, 25.7 s) and `thanks` (10:40 PM, THE LAST ROUND, 24.2 s). Registers window.__EP19_SCENES.signup / .thanks.
 *
 * ================================================================== SIGNUP: the lobby hall, afternoon, drawn with a small camera of its own (a look-at camera with a pitch: `pj(X, Y, Z)`; the world is X right, Y up, Z away from the
 * camera). The table runs along Z (a banquet table seen end-on), Tomato stands at its head in front of the sign-up board, the cast makes a loose line round her. Close-ups are a 2D zoom on a face over the same stage; the crane
 * is the camera itself: it rises and tilts until it looks straight down on the table (the pitch goes from 3 to 90 degrees), where eleven baskets of rolls sit in a 2 x 6 grid.
 * Shots (scene-local s): open 0-1.2 wide, the lights click on (.5) | t1a 1.2-2.05 Tomato, the popper | t1b 2.05-2.75 the flat line-up, the banner unrolls | m1 2.75-3.76 Mango | t2 3.76-4.58 Tomato (basket 1 at 4.306) |
 * l1 4.58-5.67 Lemon | t3 5.67-6.50 Tomato (basket 2 at 6.225) | s1 6.50-7.42 Strawberry | t4 7.42-8.34 Tomato (basket 3 at 7.968) | crane 8.34-9.89 wide, then up to the plan; eight baskets pop (8.339 .. 9.389) |
 * o1a 9.89-10.9 Onion | o1b 10.9-12.13 the label printer, labels print, a tear (sniffle 11.789) | m2 12.13-13.12 Mango | o2a 13.12-13.9 Onion | o2b 13.9-14.51 plan: the label sweep (sniffle 14.023) |
 * pop 14.51-14.76 the board, Binder pops (binderpop 14.606) | b1 14.76-17.21 the bubble | s2 17.21-17.76 Strawberry "No." | b2 17.76-18.31 the bubble, the No button runs | grin 18.31-18.70 (grin 18.309) |
 * dd 18.70-20.75 the split: the sheet and its Remove Duplicates dialog at the left, the plan at the right, six poofs (19.0 .. 20.0) | b3 20.75-21.55 the plan, ROLLS: 1 | l2 21.55-23.16 Lemon's long look |
 * t5 23.16-24.29 Tomato "Efficiency.", a confetti pop | end 24.29-25.74 the plan, the single basket, the sting (24.385).
 *
 * ================================================================== THANKS: second IIFE below (the day room at night).
 */
(() => {
if (!window.TIMELINE_EP19 || !window.H6 || !window.V2 || !window.A15 || !window.UI || !window.A7) return;
const { zoomTo, faceC, drawBg } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, SH15 = window.SH15;
const PI = Math.PI;

// ------------------------------------------------------------------ small helpers (the models: ep16_prize.js, ep18_station.js)
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const mixc = (a, b, k) => '#' + V2.mix(a, b, k).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${q(r)},${q(g)},${q(b)})`; };
/* the timeline of a scene (frozen): beat starts and ends, the start of the i-th word of a line, and snapT (the scene-local time of the video frame nearest to t) */
const TLX = window.TIMELINE_EP19;
function tl(id) {
  const SCN = TLX.scenes.find(s => s.id === id), START = SCN.start, LN = {};
  for (const l of TLX.lines) if (l.scene === id) LN[l.id] = l;
  return { SCN, START, LN, bS: b => SCN.beats[b].s, bE: b => SCN.beats[b].e, wS: (b, i) => LN[b].s - START + LN[b].words[i][1], wE: (b, i) => LN[b].s - START + LN[b].words[i][2], snapT: t => Math.round((START + t) * 30) / 30 - START };
}
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
/* hero when the text comes out at 31 px or more on the screen (the same rule as P18 in ep18_station.js) */
const heroAt = size => size * scrOf(ctx) >= 31;
/* a held prop's audit box needs the engine's registry; frame tests for a character (the model: inFrame in ep18_station.js) */
const TOPSX = typeof TOPS !== 'undefined' ? TOPS : {};
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPSX[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inFrame(o, pad = 34) {
  const b = boxOf(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
/* does the face of o sit wholly inside the frame, clear of the caption zone? (faces must stay above y 1380) */
function faceOK(o, lo = 1360) {
  const [fx, fy] = faceC(o), m = ctx.getTransform(), x = m.a * fx + m.c * fy + m.e, y = m.b * fx + m.d * fy + m.f, r = 130 * (o.s || 1) * Math.hypot(m.a, m.b);
  return x - r > 6 && x + r < W - 6 && y - r > 6 && y + r < lo;
}

// ------------------------------------------------------------------ the camera of the hall: a look-at camera with a pitch. C = the eye, T = the point it looks at (same X as the eye: no yaw), f = the focal length, hy = the screen y of T.
const CAMP = { cx: 0, cy: 470, cz: -420, tx: 0, ty: 330, tz: 2200, f: 1500, hy: 930 };
const PJ = { fx: 0, fy: 0, fz: 1, rx: 1, rz: 0, ux: 0, uy: 1, uz: 0, f: 1500, hy: 930, cx: 0, cy: 0, cz: 0 };
function setPJ(c) {
  const fx = c.tx - c.cx, fy = c.ty - c.cy, fz = Math.max(0, c.tz - c.cz), L = Math.hypot(fx, fy, fz) || 1, hl = Math.hypot(fx, fz), psi = hl > 1e-6 ? Math.atan2(fx, fz) : 0, rx = Math.cos(psi), rz = -Math.sin(psi);
  /* forward f, right r = (cos psi, 0, -sin psi) (psi = the yaw of the look direction), up u = f x r */
  Object.assign(PJ, { fx: fx / L, fy: fy / L, fz: fz / L, rx, rz, ux: (fy / L) * rz, uy: (fz / L) * rx - (fx / L) * rz, uz: -(fy / L) * rx, f: c.f, hy: c.hy, cx: c.cx, cy: c.cy, cz: c.cz });
}
/* project a world point; returns [sx, sy, k, depth] (k = pixels per world unit at that point) */
function pj(X, Y, Z) {
  const dx = X - PJ.cx, dy = Y - PJ.cy, dz = Z - PJ.cz, zc = dx * PJ.fx + dy * PJ.fy + dz * PJ.fz, xc = dx * PJ.rx + dz * PJ.rz, yc = dx * PJ.ux + dy * PJ.uy + dz * PJ.uz, k = PJ.f / Math.max(zc, 1e-3);
  return [W / 2 + xc * k, PJ.hy - yc * k, k, zc];
}
const NEAR = 40;
function depthOf(X, Y, Z) { return (X - PJ.cx) * PJ.fx + (Y - PJ.cy) * PJ.fy + (Z - PJ.cz) * PJ.fz; }
/* clip a 3D polygon against the near plane (Sutherland-Hodgman), then project */
function projPoly(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], da = depthOf(a[0], a[1], a[2]) - NEAR, db = depthOf(b[0], b[1], b[2]) - NEAR;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) { const u = da / (da - db); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]); }
  }
  return out.map(p => pj(p[0], p[1], p[2]));
}
function poly3(pts, fill, stroke, lw) {
  const q = projPoly(pts); if (q.length < 3) return q;
  ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.stroke(); }
  return q;
}
function line3(a, b, stroke, lw) {
  const da = depthOf(...a) - NEAR, db = depthOf(...b) - NEAR; if (da < 0 && db < 0) return;
  let A = a, B = b; if (da < 0) { const u = da / (da - db); A = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; } else if (db < 0) { const u = da / (da - db); B = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
  const p = pj(...A), q = pj(...B); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
}
/* a flat figure standing in the world (a frontal sprite): translate to the foot point and scale by k, draw in world units (y up is negative) */
function stand(X, Y, Z, fn, sc = 1) {
  const p = pj(X, Y, Z); if (p[3] < NEAR) return null;
  ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(p[2] * sc, p[2] * sc); fn(p[2] * sc); ctx.restore(); return p;
}

// ------------------------------------------------------------------ text on the walls and boards: hero only when the whole string is safely in the frame (and not blurred), else dressing that may be cut
function textSafe(str, cx, cy, o) {
  const sz = UI.sizeOf(str, { size: o.size, font: o.font, weight: o.weight ?? 900, spacing: o.spacing }), w = Math.min(sz.w, o.maxW ?? 1e9) + 2 * (o.lw || 0), h = sz.h + 2 * (o.lw || 0);
  const m = ctx.getTransform(), x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T0 = Math.min(...ys), B = Math.max(...ys);
  if (L < 46 || R > W - 46 || T0 < 46 || B > H - 46) return false;
  if (B > 1376 && T0 < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T0 < 248) return false;
  return o.size * Math.hypot(m.a, m.b) >= 31;
}
function WT(str, cx, cy, o = {}) {   /* a wall / board label through the UI kit: hero only if safe, and never when the scene blurs it (o.soft) */
  const safe = !o.soft && textSafe(str, cx, cy, o);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero: safe, crop: !safe }));
}

// ------------------------------------------------------------------ the hall: numbers (world units; X right, Y up, Z away from the camera)
const HW = 800, CH = 900, ZB = 2300, ZN = -1900;
const TH = 130, TW = 220, TZ0 = 700, TZ1 = 1700;                 /* the table: top height, half width (the cloth), near end, far end */
const COLX = [-105, 105], ROWZ = r => 1600 - 150 * r;
const BR = 58, BH = 46;                                          /* a basket: rim radius, body height */
const SL = [[0, 1], [1, 1], [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1]];   /* (row, column) of basket i; the 12th slot, (0, 0), holds the centrepiece */
const SLOT = i => ({ X: COLX[SL[i][1]], Z: ROWZ(SL[i][0]), row: SL[i][0] });
const PRN = { X: COLX[0], Z: ROWZ(0) };
const NAMES = ['MANGO', 'LEMON', 'STRAWBERRY', 'ONION', 'TOMATO', 'BINDER', 'CLEMENTINE', 'MELON', 'CARROT', 'BRENDA', 'CABBAGE'];
const ST = tl('signup'), SLN = ST.LN;
/* the sound cues of the scene (scene-local seconds, from script_ep19.json: python3 /tmp/shift_tools/cues.py 19 signup), snapped to the video frame nearest each */
const SC = { click: .5, basket: [4.306, 6.225, 7.968, 8.339, 8.489, 8.639, 8.789, 8.939, 9.089, 9.239, 9.389], sniffle: [11.789, 14.023], binderpop: 14.606, grin: 18.309, dedupe: 18.701, poof: [19.001, 19.201, 19.401, 19.601, 19.801, 20.001], sting: 24.385 };
for (const k in SC) SC[k] = Array.isArray(SC[k]) ? SC[k].map(ST.snapT) : ST.snapT(SC[k]);
/* which baskets each poof takes away (basket 0 is the one that stays), and when each allergen label lands in the sweep (13.9 .. 14.5, the nearest row first) */
const POOF_SETS = [[1, 2], [3, 4], [5, 6], [7, 8], [9], [10]];
const GONE_AT = {}; POOF_SETS.forEach((set, j) => set.forEach(i => { GONE_AT[i] = SC.poof[j]; }));
const LAB_AT = i => ST.snapT(13.93 + (5 - SLOT(i).row) * .075 + (i % 2) * .03);

/* ---- the floor: warm checkered vinyl, a runner under the table, the sun from the left windows */
function drawFloor(lt) {
  const q = projPoly([[-HW, 0, ZN], [HW, 0, ZN], [HW, 0, ZB], [-HW, 0, ZB]]); if (q.length < 3) return;
  ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  ctx.fillStyle = lg(0, -300, 0, H + 300, [[0, '#d8c2a0'], [1, '#c4a780']]); ctx.fill();
  const TS = 160, NI = 10, NJ = Math.ceil((ZB - ZN) / TS); let any = false;
  ctx.beginPath();
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
    const x0 = -HW + i * TS, x1 = x0 + TS, z0 = ZN + j * TS, z1 = z0 + TS, a = pj(x0, 0, z0), b = pj(x1, 0, z0), c = pj(x1, 0, z1), d = pj(x0, 0, z1);
    if (Math.min(a[3], b[3], c[3], d[3]) < NEAR) continue;
    const mnx = Math.min(a[0], b[0], c[0], d[0]), mxx = Math.max(a[0], b[0], c[0], d[0]), mny = Math.min(a[1], b[1], c[1], d[1]), mxy = Math.max(a[1], b[1], c[1], d[1]);
    if (mxx < -20 || mnx > W + 20 || mxy < -20 || mny > H + 20) continue;
    any = true;
    if ((i + j) & 1) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); }
  }
  if (any) { ctx.fillStyle = 'rgba(122,88,56,.13)'; ctx.fill(); }
  /* the runner: deep teal with a cream border */
  poly3([[-330, 0, TZ0 - 220], [330, 0, TZ0 - 220], [330, 0, TZ1 + 280], [-330, 0, TZ1 + 280]], '#2f6360', 'rgba(20,12,8,.5)', 3);
  poly3([[-300, 0, TZ0 - 190], [300, 0, TZ0 - 190], [300, 0, TZ1 + 250], [-300, 0, TZ1 + 250]], null, '#e8d9b0', 5);
  poly3([[-282, 0, TZ0 - 172], [282, 0, TZ0 - 172], [282, 0, TZ1 + 232], [-282, 0, TZ1 + 232]], '#3b7571');
  for (let z = TZ0 - 100; z < TZ1 + 230; z += 160) poly3([[-40, 0, z], [0, 0, z + 28], [40, 0, z], [0, 0, z - 28]], '#e8d9b0');
  /* the sun through the left windows: warm parallelograms on the floor */
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const zc of [700, 1300, 1900]) poly3([[-HW, 0, zc - 150], [-HW, 0, zc + 150], [-HW + 560, 0, zc + 150 - 330], [-HW + 560, 0, zc - 150 - 330]], 'rgba(255,214,130,.20)');
  ctx.restore();
}
/* ---- the walls: back wall (banner, board and windows are added by the caller), the two side walls with their windows, the ceiling */
function drawWalls(lt, dim) {
  const wall = (pts, c0, c1) => { const q = projPoly(pts); if (q.length < 3) return; let y0 = 1e9, y1 = -1e9; q.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); y0 = Math.max(-300, y0); y1 = Math.min(H + 300, y1);
    ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = lg(0, y0, 0, y1, [[0, c0], [1, c1]]); ctx.fill(); };
  /* back wall */
  wall([[-HW, 0, ZB], [HW, 0, ZB], [HW, CH, ZB], [-HW, CH, ZB]], '#f1dcb8', '#e2c698');
  poly3([[-HW, 0, ZB - 1], [HW, 0, ZB - 1], [HW, 150, ZB - 1], [-HW, 150, ZB - 1]], '#4f8a84');
  poly3([[-HW, 146, ZB - 2], [HW, 146, ZB - 2], [HW, 158, ZB - 2], [-HW, 158, ZB - 2]], '#b98a5a');
  poly3([[-HW, 0, ZB - 2], [HW, 0, ZB - 2], [HW, 22, ZB - 2], [-HW, 22, ZB - 2]], '#6d5a4a');
  /* side walls: the left one in the sun, the right one in shade */
  for (const sd of [-1, 1]) {
    const X = sd * HW, lit = sd < 0 ? 1 : .86;
    wall([[X, 0, ZN], [X, 0, ZB], [X, CH, ZB], [X, CH, ZN]], shade('#f1dcb8', lit * 1.02), shade('#e2c698', lit * .94));
    poly3([[X, 0, ZN], [X, 0, ZB], [X, 150, ZB], [X, 150, ZN]], shade('#4f8a84', lit));
    poly3([[X, 146, ZN], [X, 146, ZB], [X, 158, ZB], [X, 158, ZN]], shade('#b98a5a', lit));
    poly3([[X, 0, ZN], [X, 0, ZB], [X, 22, ZB], [X, 22, ZN]], shade('#6d5a4a', lit));
    for (const zc of [700, 1300, 1900]) {         /* a window: cream frame, glass, mullions, a sill; the left glass is bright with the sun */
      const w = 190, y0 = 270, y1 = 720, xo = X - sd * 2;
      poly3([[xo, y0 - 20, zc - w - 20], [xo, y0 - 20, zc + w + 20], [xo, y1 + 20, zc + w + 20], [xo, y1 + 20, zc - w - 20]], '#f3ecdc', 'rgba(25,16,30,.55)', 2.4);
      const g = projPoly([[xo, y0, zc - w], [xo, y0, zc + w], [xo, y1, zc + w], [xo, y1, zc - w]]);
      if (g.length > 2) { let gy0 = 1e9, gy1 = -1e9; g.forEach(p => { gy0 = Math.min(gy0, p[1]); gy1 = Math.max(gy1, p[1]); });
        ctx.beginPath(); g.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = lg(0, gy0, 0, gy1, sd < 0 ? [[0, '#fff3c8'], [1, '#ffd890']] : [[0, '#a9cff0'], [1, '#d9ecf8']]); ctx.fill(); }
      for (const f of [-1 / 3, 1 / 3]) line3([xo, y0, zc + f * w], [xo, y1, zc + f * w], '#f3ecdc', 7);
      line3([xo, (y0 + y1) / 2, zc - w], [xo, (y0 + y1) / 2, zc + w], '#f3ecdc', 7);
      poly3([[xo, y0 - 30, zc - w - 36], [xo, y0 - 30, zc + w + 36], [xo, y0 - 12, zc + w + 36], [xo, y0 - 12, zc - w - 36]], '#e8dfc9', 'rgba(25,16,30,.5)', 2);
    }
  }
  /* ceiling: tiles and lamp panels, faded out as the crane rises through it */
  const ca = 1 - ss(PJ.cy, 760, 900);
  if (ca > .01) {
    ctx.save(); ctx.globalAlpha *= ca;
    const q = projPoly([[-HW, CH, ZN], [HW, CH, ZN], [HW, CH, ZB], [-HW, CH, ZB]]);
    if (q.length > 2) { ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = lg(0, -300, 0, H, [[0, '#d9cfc0'], [1, '#efe6d6']]); ctx.fill(); }
    ctx.strokeStyle = 'rgba(80,70,60,.16)'; ctx.lineWidth = 1.6;
    for (let z = 0; z < ZB; z += 240) line3([-HW, CH, z], [HW, CH, z], 'rgba(80,70,60,.16)', 1.6);
    for (let x = -HW + 160; x < HW; x += 320) line3([x, CH, 0], [x, CH, ZB], 'rgba(80,70,60,.16)', 1.6);
    const on = lt < SC.click ? 0 : lt < SC.click + .07 ? .35 : 1;
    for (const z of [600, 1300, 2000]) for (const x of [-400, 0, 400]) { poly3([[x - 130, CH - 2, z], [x + 130, CH - 2, z], [x + 130, CH - 2, z + 210], [x - 130, CH - 2, z + 210]], on > .5 ? '#fffbe9' : '#a7a49c', 'rgba(110,110,125,.5)', 1.6); }
    ctx.restore();
  }
}
/* gingham on a flat quad: origin o, side vectors du and dv, ni x nj cells; stripes of the cloth colour in both directions overlap into the darker squares */
function ging3(o, du, dv, ni, nj, col = '214,72,62', a = .34) {
  const P = (i, j) => pj(o[0] + du[0] * i / ni + dv[0] * j / nj, o[1] + du[1] * i / ni + dv[1] * j / nj, o[2] + du[2] * i / ni + dv[2] * j / nj);
  for (const dir of [0, 1]) {
    ctx.beginPath(); let any = false;
    for (let j = 0; j < nj; j++) for (let i = 0; i < ni; i++) if ((dir ? j : i) & 1) {
      const p = P(i, j), q = P(i + 1, j), r = P(i + 1, j + 1), s = P(i, j + 1);
      if (Math.min(p[3], q[3], r[3], s[3]) < NEAR) continue;
      if (Math.max(p[0], q[0], r[0], s[0]) < -40 || Math.min(p[0], q[0], r[0], s[0]) > W + 40 || Math.max(p[1], q[1], r[1], s[1]) < -40 || Math.min(p[1], q[1], r[1], s[1]) > H + 40) continue;
      any = true; ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.lineTo(r[0], r[1]); ctx.lineTo(s[0], s[1]); ctx.closePath();
    }
    if (any) { ctx.fillStyle = `rgba(${col},${a})`; ctx.fill(); }
  }
}
/* ---- the table: a banquet table end-on under a gingham cloth, the skirt on the faces the camera can see */
function drawTable(lt) {
  const X0 = -TW - 22, X1 = TW + 22, Z0 = TZ0 - 22, Z1 = TZ1 + 22, SK = 34;
  poly3([[X0 - 70, 0, Z0 - 60], [X1 + 70, 0, Z0 - 60], [X1 + 70, 0, Z1 + 60], [X0 - 70, 0, Z1 + 60]], 'rgba(36,22,12,.26)');
  if (PJ.cz < Z0) {            /* the near end of the skirt */
    poly3([[X0, TH, Z0], [X1, TH, Z0], [X1, SK, Z0], [X0, SK, Z0]], '#f6e9d4', 'rgba(28,20,14,.7)', 3);
    ging3([X0, TH, Z0], [X1 - X0, 0, 0], [0, SK - TH, 0], 12, 4);
    ctx.save(); for (let i = 1; i < 12; i++) line3([X0 + (X1 - X0) * i / 12, TH, Z0], [X0 + (X1 - X0) * i / 12, SK, Z0], 'rgba(90,40,30,.14)', 2); ctx.restore();
    line3([X0, SK, Z0], [X1, SK, Z0], 'rgba(28,20,14,.55)', 3);
  }
  if (Math.abs(PJ.cx) > X1) {   /* a side face, when the camera stands outside the table */
    const X = Math.sign(PJ.cx) * X1;
    poly3([[X, TH, Z0], [X, TH, Z1], [X, SK, Z1], [X, SK, Z0]], '#ecdcc2', 'rgba(28,20,14,.7)', 3);
  }
  const top = poly3([[X0, TH, Z0], [X1, TH, Z0], [X1, TH, Z1], [X0, TH, Z1]], '#fbf3e3', 'rgba(28,20,14,.75)', 3.4);
  ging3([X0, TH, Z0], [X1 - X0, 0, 0], [0, 0, Z1 - Z0], 12, 26);
  /* a soft sheen along the edge nearest the window */
  ctx.save(); ctx.globalCompositeOperation = 'screen'; poly3([[X0, TH, Z0], [X0 + 70, TH, Z0], [X0 + 70, TH, Z1], [X0, TH, Z1]], 'rgba(255,230,170,.10)'); ctx.restore();
  return top;
}
// ------------------------------------------------------------------ rolls and baskets, drawn for any viewing angle. e = elevation of the line of sight (0 level, PI/2 straight down). Local axes: x right, y up, z away from the camera;
// the screen point of a local point is (cx + x k, cy - (y cos e + z sin e) k). Flat things (rim, cloth) go through the affine map of their plane; text never does.
const INKC = 'rgba(28,20,14,.75)';
const scrP = (cx, cy, k, e, x, y, z) => [cx + x * k, cy - (y * Math.cos(e) + z * Math.sin(e)) * k];
function planeMap(cx, cy, k, e, y) { const se = Math.max(.05, Math.sin(e)); ctx.transform(k, 0, 0, -se * k, cx, cy - y * Math.cos(e) * k); }
/* one dinner roll: a golden dome with a score across the top; sz scales it; ang turns the oval when seen from above */
function roll(cx, cy, k, e, x, y, z, ang, sz, seed) {
  const se = Math.sin(e), [sx, sy] = scrP(cx, cy, k, e, x, y, z), rx = 20.5 * sz * k, ry = rx * lerp(.74, .8, se);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang * se); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(1.5 * k, 3 * k * (1.2 - se * .4), rx, ry, 0, 0, TAU); ctx.fillStyle = 'rgba(40,20,8,.25)'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fillStyle = V2.radial(-rx * .3, -ry * .4, rx * .08, rx * 1.15, [[0, '#fbd58e'], [.38, '#e8a850'], [.8, '#c47a2a'], [1, '#9a5a1c']]); ctx.fill();
  ctx.strokeStyle = 'rgba(58,28,10,.8)'; ctx.lineWidth = Math.max(1.4, 2.4 * k * sz); ctx.stroke();
  ctx.strokeStyle = 'rgba(122,66,20,.6)'; ctx.lineWidth = Math.max(1.2, 2.6 * k * sz); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-rx * .5, ry * .05); ctx.quadraticCurveTo(0, -ry * .42, rx * .5, ry * .1); ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,230,.55)'; ctx.beginPath(); ctx.ellipse(-rx * .36, -ry * .42, rx * .24, ry * .14, -.4, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,250,240,.6)'; ctx.beginPath(); ctx.arc((sr(seed, i) - .5) * rx * 1.1, (sr(seed, i + 9) - .5) * ry * 1.0, Math.max(.8, 1.5 * k * sz), 0, TAU); ctx.fill(); }
  ctx.restore();
}
/* the roll pile of a basket: 6 round the edge, 3 above them, 1 on top */
const PILE = (() => { const a = []; for (let j = 0; j < 6; j++) a.push({ r: 31, a: j * PI / 3 + .3, y: BH - 7, ang: j * 1.3 });
  for (let j = 0; j < 3; j++) a.push({ r: 15, a: j * TAU / 3 + 1.1, y: BH + 7, ang: j * 2.1 + .5 }); a.push({ r: 0, a: 0, y: BH + 19, ang: .4 }); return a; })();
const FLAPS = [.8, 2.4, 3.9, 5.5];   /* the angles the four gingham corners hang over the rim */
function flap(cx, cy, k, e, a) {   /* a gingham corner of the lining, hanging over the rim: a trapezoid from the rim down the outside */
  const R = BR, P = (da, r, y) => scrP(cx, cy, k, e, Math.cos(a + da) * r, y, Math.sin(a + da) * r);
  const p0 = P(-.36, R - 6, BH + 1), p1 = P(.36, R - 6, BH + 1), q1 = P(.3, R + 15, BH - 17), q0 = P(-.3, R + 15, BH - 17), m0 = P(0, R + 1, BH + 3);
  ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(m0[0], m0[1], p1[0], p1[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(q0[0], q0[1]); ctx.closePath();
  ctx.fillStyle = '#fbf3e3'; ctx.fill(); ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(214,72,62,.5)'; ctx.lineWidth = 6 * k;
  for (const f of [-.5, .5]) { const a0 = [lerp(p0[0], p1[0], .5 + f * .5), lerp(p0[1], p1[1], .5 + f * .5)], a1 = [lerp(q0[0], q1[0], .5 + f * .5), lerp(q0[1], q1[1], .5 + f * .5)]; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke(); }
  ctx.restore(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1.4, 2.4 * k); ctx.stroke();
}
/* the basket: o = { pop (size, 1 = rest), name, label (0 none .. 1 stuck), labelAge (s since it landed), seed, wob }. Drawn at (cx, cy), the centre of its base on the table. */
function drawBasket(cx, cy, k, e, o = {}) {
  const pop = o.pop ?? 1; if (pop < .02) return;
  e = Math.max(.07, Math.min(PI / 2, e));
  const se = Math.sin(e), ce = Math.cos(e), R = BR, R0 = 47, kk = k * pop;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate((o.wob || 0)); ctx.translate(-cx, -cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* squash a little while it lands */
  if (o.sq) { ctx.translate(cx, cy); ctx.scale(1 + o.sq * .16, 1 - o.sq * .16); ctx.translate(-cx, -cy); }
  ctx.fillStyle = 'rgba(30,18,8,.24)'; ctx.beginPath(); ctx.ellipse(cx + 4 * kk, cy + 2 * kk, (R + 2) * kk, (R + 2) * kk * Math.max(.3, se), 0, 0, TAU); ctx.fill();
  const yr = cy - BH * ce * kk, rxr = R * kk, ryr = R * kk * se, rxb = R0 * kk, ryb = R0 * kk * se;
  /* the wicker barrel (the front face): visible only when the view is not straight down */
  if (ce > .04) {
    ctx.beginPath(); ctx.moveTo(cx - rxr, yr); ctx.ellipse(cx, yr, rxr, ryr, 0, PI, 0, true); ctx.lineTo(cx + rxb, cy); ctx.ellipse(cx, cy, rxb, ryb, 0, 0, PI, false); ctx.closePath();
    ctx.fillStyle = lg(cx - rxr, 0, cx + rxr, 0, [[0, '#e0b06a'], [.45, '#c48e4a'], [1, '#8c5c2c']]); ctx.fill();
    ctx.save(); ctx.clip();
    for (let b = 1; b <= 3; b++) { const t = b / 4, rr_ = (R0 + (R - R0) * t) * kk, yy = cy - BH * t * ce * kk; ctx.strokeStyle = 'rgba(86,52,18,.55)'; ctx.lineWidth = Math.max(1.2, 2.2 * kk); ctx.beginPath(); ctx.ellipse(cx, yy, rr_, rr_ * se, 0, 0, PI); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(86,52,18,.35)'; ctx.lineWidth = Math.max(1, 1.8 * kk);
    for (let b = 0; b < 4; b++) for (let a = 0.2; a < PI; a += .26) { const aa = a + (b % 2 ? .13 : 0), t0 = b / 4, t1 = (b + 1) / 4, r0 = (R0 + (R - R0) * t0) * kk, r1 = (R0 + (R - R0) * t1) * kk;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(aa) * r0, cy - BH * t0 * ce * kk + Math.sin(aa) * r0 * se); ctx.lineTo(cx + Math.cos(aa) * r1, cy - BH * t1 * ce * kk + Math.sin(aa) * r1 * se); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - rxr, yr); ctx.ellipse(cx, yr, rxr, ryr, 0, PI, 0, true); ctx.lineTo(cx + rxb, cy); ctx.ellipse(cx, cy, rxb, ryb, 0, 0, PI, false); ctx.closePath();
    ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1.6, 3.2 * kk); ctx.stroke();
  }
  /* the rim (a braided ring) and the inside */
  ctx.beginPath(); ctx.ellipse(cx, yr, rxr, ryr, 0, 0, TAU); ctx.fillStyle = lg(cx - rxr, 0, cx + rxr, 0, [[0, '#e6b873'], [1, '#a8763a']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1.6, 3.2 * kk); ctx.stroke();
  ctx.save(); ctx.setLineDash([5 * kk, 4 * kk]); ctx.strokeStyle = 'rgba(86,52,18,.5)'; ctx.lineWidth = Math.max(1.2, 3 * kk); ctx.beginPath(); ctx.ellipse(cx, yr, rxr * .93, ryr * .93, 0, 0, TAU); ctx.stroke(); ctx.restore();
  const ri = (R - 9) * kk;
  ctx.beginPath(); ctx.ellipse(cx, yr, ri, ri * se, 0, 0, TAU); ctx.fillStyle = '#3e2610'; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, yr, ri, ri * se, 0, 0, TAU); ctx.clip();
  planeMap(cx, cy, kk, e, BH - 4);
  ctx.fillStyle = '#fbf3e3'; ctx.fillRect(-60, -60, 120, 120);
  ctx.fillStyle = 'rgba(214,72,62,.4)'; for (let i = -4; i < 4; i++) { if (i & 1) ctx.fillRect(i * 15, -60, 15, 120); if (i & 1) ctx.fillRect(-60, i * 15, 120, 15); }
  ctx.restore();
  /* flaps behind the pile, the pile, flaps in front */
  const fl = FLAPS.map((a, i) => ({ a: a + (o.seed || 0) * .12, z: Math.sin(a + (o.seed || 0) * .12) })).sort((p, q) => q.z - p.z);
  for (const f of fl) if (f.z > 0) flap(cx, cy, kk, e, f.a);
  const seed = o.seed || 0, items = PILE.map((p, i) => ({ x: Math.cos(p.a + seed) * p.r, z: Math.sin(p.a + seed) * p.r * .95, y: p.y, ang: p.ang + seed, i })).sort((p, q) => (p.y * se - p.z * ce) - (q.y * se - q.z * ce));
  for (const it of items) roll(cx, cy, kk, e, it.x, it.y, it.z, it.ang, 1, seed * 7 + it.i);
  for (const f of fl) if (f.z <= 0) flap(cx, cy, kk, e, f.a);
  ctx.restore();
  /* the name sticker (set dressing text: small) and the allergen label slapped on top of the rolls */
  const sk = o.nameShow === false ? 0 : 1;
  if (o.name && sk) {
    const [sx, sy] = scrP(cx, cy, kk, e, 0, BH * (1 - .55 * (1 - se)), -R * .96), w = 70 * kk, h = 21 * kk;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.04); rr(-w / 2, -h / 2, w, h, 6 * kk); ctx.fillStyle = '#fffdf4'; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1.2, 2 * kk); ctx.stroke(); ctx.restore();
    UI.container('bk:' + o.id, 'pill', [sx - w / 2, sy - h / 2, sx + w / 2, sy + h / 2], 1);
    UI.label(o.name, sx, sy, { size: 13.5 * kk, weight: 900, fill: '#2a2018', maxW: w - 8 * kk, hero: false, crop: true, cid: 'bk:' + o.id, center: true });
  }
  if ((o.label || 0) > 0) allergenLabel(cx, cy, kk, e, o);
}
/* the allergen label: white, a barcode and CONTAINS: BREAD; it lands with a slap (scale 1.5 to 1) */
function allergenLabel(cx, cy, k, e, o) {
  const u = o.label, a = o.labelAge ?? 1, [sx, sy] = scrP(cx, cy, k, e, 2, BH + 22, -4), s = a < .12 ? lerp(1.5, 1, eo(sg(a, 0, .12))) : 1;
  if (u < .02) return;
  const w = 80 * k * s, h = 44 * k * s;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.08 + (o.seed || 0) * .03); ctx.globalAlpha *= c01(u * 3);
  ctx.shadowColor = 'rgba(20,10,4,.4)'; ctx.shadowBlur = 5 * k; ctx.shadowOffsetY = 2 * k; rr(-w / 2, -h / 2, w, h, 4 * k); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(60,60,70,.7)'; ctx.lineWidth = Math.max(1, 1.6 * k); ctx.stroke();
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-w / 2 + 2 * k, -h / 2 + 2 * k, w - 4 * k, 5 * k * s);
  ctx.fillStyle = '#222'; for (let i = 0; i < 14; i++) { const bw = (i % 3 ? 1.3 : 2.4) * k * s; ctx.fillRect(-w / 2 + 6 * k * s + i * 3.1 * k * s, h / 2 - 15 * k * s, bw, 9 * k * s); }
  ctx.restore();
  const hero = heroAt(11 * k * s);
  UI.container('lab:' + o.id, 'pill', [sx - w / 2, sy - h / 2, sx + w / 2, sy + h / 2], 1);
  UI.label('CONTAINS: BREAD', sx, sy - 4 * k * s, { size: 10.5 * k * s, weight: 900, fill: '#c0392b', maxW: w - 8 * k, hero: false, crop: true, cid: 'lab:' + o.id, center: false });
}
/* a small pumpkin on the cloth */
function pumpkin(X, Z, e0, r = 26, rot = 0) {
  const [sx, sy, k] = pj(X, TH, Z); if (sy < -200 || sy > H + 200) return;
  const e = Math.max(.1, Math.atan2(PJ.cy - TH, Math.hypot(X - PJ.cx, Z - PJ.cz))), se = Math.sin(e), ce = Math.cos(e), rx = r * k, ry = r * k * lerp(.78, 1, se), cy2 = sy - r * .8 * ce * k;
  ctx.save(); ctx.fillStyle = 'rgba(30,18,8,.28)'; ctx.beginPath(); ctx.ellipse(sx + 3 * k, sy + 2 * k, rx * 1.05, rx * .5 * Math.max(.4, se), 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx, cy2, rx, ry, 0, 0, TAU); ctx.fillStyle = V2.radial(sx - rx * .3, cy2 - ry * .35, rx * .1, rx * 1.2, [[0, '#ffb355'], [.5, '#f08a24'], [1, '#c2551a']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1.4, 2.6 * k); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,60,10,.6)'; ctx.lineWidth = Math.max(1, 2 * k);
  for (const f of [-.55, -.2, .2, .55]) { ctx.beginPath(); ctx.ellipse(sx, cy2, Math.abs(rx * f) + .1, ry * .97, 0, -PI / 2, PI / 2, f < 0); ctx.stroke(); }
  ctx.fillStyle = '#5e7a2c'; ctx.beginPath(); ctx.roundRect(sx - 3.5 * k + rot, cy2 - ry - 4 * k * ce, 7 * k, 9 * k, 3 * k); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// ------------------------------------------------------------------ the back wall: the banner (it unrolls), bunting, the sign-up board, the reception counter, plants, balloons
const BAN = { x0: -430, x1: 430, yT: 880, h: 190 };
let BANNER_U = 1;                                   /* set per frame: how far the banner has unrolled */
function drawBanner(lt, u, soft) {
  const Z = ZB - 4, yb = BAN.yT - BAN.h * u;
  if (u < .02) {   /* still rolled up under its rod */
    line3([BAN.x0 - 20, BAN.yT + 14, Z], [BAN.x1 + 20, BAN.yT + 14, Z], '#6a4a2a', 9);
    const a = pj(BAN.x0, BAN.yT - 6, Z), b = pj(BAN.x1, BAN.yT - 6, Z), r = 14 * a[2];
    ctx.save(); ctx.fillStyle = lg(0, a[1] - r, 0, a[1] + r, [[0, '#f59a5a'], [1, '#b84a18']]); ctx.strokeStyle = 'rgba(60,24,10,.85)'; ctx.lineWidth = 3; rr(a[0], a[1] - r, b[0] - a[0], 2 * r, r); ctx.fill(); ctx.stroke(); ctx.restore();
    return;
  }
  /* the hanging rod and the two strings */
  line3([BAN.x0 - 20, BAN.yT + 14, Z], [BAN.x1 + 20, BAN.yT + 14, Z], '#6a4a2a', 9);
  /* the cloth */
  const q = poly3([[BAN.x0, BAN.yT, Z], [BAN.x1, BAN.yT, Z], [BAN.x1, yb, Z], [BAN.x0, yb, Z]], '#e8672a', 'rgba(60,24,10,.8)', 3.4);
  poly3([[BAN.x0 + 12, BAN.yT - 12, Z - 1], [BAN.x1 - 12, BAN.yT - 12, Z - 1], [BAN.x1 - 12, yb + 12, Z - 1], [BAN.x0 + 12, yb + 12, Z - 1]], null, 'rgba(255,236,190,.8)', 2.4);
  if (u < .98) {   /* the roll at the bottom edge */
    const a = pj(BAN.x0, yb, Z), b = pj(BAN.x1, yb, Z), r = 13 * a[2];
    ctx.save(); ctx.fillStyle = lg(0, a[1] - r, 0, a[1] + r, [[0, '#f59a5a'], [1, '#b84a18']]); ctx.strokeStyle = 'rgba(60,24,10,.85)'; ctx.lineWidth = 3; rr(a[0], a[1] - r, b[0] - a[0], 2 * r, r); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  if (u >= .98) {
    const al = c01((u - .98) / .02);
    stand(0, 0, Z, () => {
      ctx.save(); ctx.globalAlpha *= al;
      WT('FRUIT SALAD FAMILY', 0, -(BAN.yT - 42), { size: 62, weight: 900, fill: '#fff4d6', stroke: '#5a2410', lw: 7, spacing: 1.5, maxW: 760, soft });
      WT('POTLUCK', 0, -(BAN.yT - 122), { size: 104, font: 'Bangers', weight: 400, fill: '#ffe135', stroke: '#5a2410', lw: 10, spacing: 5, maxW: 700, soft });
      ctx.restore();
    });
  }
}
function drawBunting(lt) {
  const Z = ZB - 6, cols = ['#e8672a', '#f0b429', '#5aa469', '#c0392b', '#4a90c8'];
  for (const [xa, ya, xb, yb2, sag] of [[-HW + 60, 760, -80, 880, 70], [80, 880, HW - 60, 760, 70]]) {
    const N = 11; let prev = null;
    for (let i = 0; i <= N; i++) { const u = i / N, x = lerp(xa, xb, u), y = lerp(ya, yb2, u) - sag * Math.sin(u * PI); if (prev) line3([prev[0], prev[1], Z], [x, y, Z], '#6a4a2a', 3); prev = [x, y]; }
    for (let i = 0; i < N; i++) { const u = (i + .5) / N, x = lerp(xa, xb, u), y = lerp(ya, yb2, u) - sag * Math.sin(u * PI), sw = Math.sin(lt * 1.6 + i) * 3; poly3([[x - 26, y, Z], [x + 26, y, Z], [x + sw, y - 62, Z]], cols[i % 5], 'rgba(40,20,10,.65)', 2.2); }
  }
}
/* the sign-up board on the wall behind Tomato: a framed white sheet, NAME and DISH columns; n rows are filled in */
const BOARD = { x0: -250, x1: 250, y0: 330, y1: 650 };
function drawBoard(lt, n, soft) {
  const Z = ZB - 5, B = BOARD;
  poly3([[B.x0 - 14, B.y0 - 14, Z], [B.x1 + 14, B.y0 - 14, Z], [B.x1 + 14, B.y1 + 14, Z], [B.x0 - 14, B.y1 + 14, Z]], '#8a5a30', 'rgba(28,20,14,.8)', 3.4);
  poly3([[B.x0, B.y0, Z - 1], [B.x1, B.y0, Z - 1], [B.x1, B.y1, Z - 1], [B.x0, B.y1, Z - 1]], '#fbf7ec', 'rgba(28,20,14,.5)', 2);
  poly3([[B.x0, B.y1 - 52, Z - 1], [B.x1, B.y1 - 52, Z - 1], [B.x1, B.y1, Z - 1], [B.x0, B.y1, Z - 1]], '#1e8e5a');
  stand((B.x0 + B.x1) / 2, 0, Z, () => {
    WT('POTLUCK SIGN-UP', 0, -(B.y1 - 26), { size: 34, weight: 900, fill: '#ffffff', spacing: 1.5, maxW: 460, soft });
    const rows = [['NAME', 'DISH']].concat(NAMES.slice(0, Math.min(7, n)).map(nm => [nm, 'ROLLS']));
    UI.table([-220, -(B.y1 - 62), 440, 36 * rows.length], [{ w: .56, align: 'left', weight: 900 }, { w: .44, align: 'left', weight: 800 }], rows.slice(1), { header: rows[0], size: 22, rowH: 36, padX: 10, hero: false, text: { crop: true }, grid: true, headFill: '#e1ece6', headText: { fill: '#1d1a22', crop: true }, id: 'board' });
  });
}
function drawCounter(lt) {   /* the reception counter at the left end of the back wall: the lobby is next to the nurses' station */
  const X0 = -760, X1 = -380, Z0 = 2150, Z1 = 2290, H0 = 108;
  poly3([[X0, 0, Z0], [X1, 0, Z0], [X1, H0, Z0], [X0, H0, Z0]], '#9a6a3c', 'rgba(28,20,14,.7)', 3);
  poly3([[X0, H0 - 10, Z0 - 1], [X1, H0 - 10, Z0 - 1], [X1, 14, Z0 - 1], [X0, 14, Z0 - 1]], null, 'rgba(255,230,180,.25)', 2);
  poly3([[X0 - 10, H0, Z0 - 10], [X1 + 10, H0, Z0 - 10], [X1 + 10, H0, Z1], [X0 - 10, H0, Z1]], '#c99a62', 'rgba(28,20,14,.7)', 3);
  stand(-600, H0, Z1 - 30, k => { ctx.fillStyle = '#2b2f3a'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(-60, -120, 120, 84, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7fc4e8'; rr(-52, -112, 104, 68, 4); ctx.fill(); ctx.fillStyle = '#3a3f4c'; ctx.fillRect(-10, -36, 20, 28); });
  stand(-470, H0, Z0 + 40, k => { ctx.fillStyle = '#d8d2c4'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -8, 26, 10, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e2b13c'; ctx.beginPath(); ctx.arc(0, -16, 9, PI, 0); ctx.fill(); ctx.stroke(); });
}
function plantAt(X, Z, sc = 1) {   /* the engine's lobby plant (S6.plant3 in ep6_rooms.js), placed through this scene's camera */
  stand(X, 0, Z, () => {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 4, 56, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b5683a'; ctx.strokeStyle = 'rgba(25,16,30,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-34, -70); ctx.lineTo(34, -70); ctx.lineTo(26, 0); ctx.lineTo(-26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 9; i++) { const a = -2.5 + i * .62, L = 120 + (i % 3) * 36; ctx.save(); ctx.translate(0, -70); ctx.rotate(a * .55); ctx.fillStyle = i % 2 ? '#3f9a3a' : '#58b83a'; ctx.strokeStyle = '#143d12'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -L * .5, 0, -L); ctx.quadraticCurveTo(-26, -L * .5, 0, 0); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }, sc);
}
function balloons(lt, X, Z, seed) {   /* three helium balloons on strings tied to a table corner */
  const cols = ['#e8503a', '#f0b429', '#4a90c8'], p0 = pj(X, TH, Z);
  if (p0[3] < NEAR) return;
  cols.forEach((c, i) => {
    const bx = X + (i - 1) * 46 + Math.sin(lt * 1.1 + seed + i) * 9, by = TH + 250 + i * 34 + Math.sin(lt * 1.3 + seed * 2 + i * 1.7) * 7, p = pj(bx, by, Z), k = p[2];
    ctx.strokeStyle = 'rgba(40,30,30,.6)'; ctx.lineWidth = Math.max(1, 1.8 * k); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(lerp(p0[0], p[0], .5) + 10 * k, lerp(p0[1], p[1], .5), p[0], p[1] + 44 * k); ctx.stroke();
    ctx.fillStyle = V2.radial(p[0] - 14 * k, p[1] - 18 * k, 3 * k, 60 * k, [[0, shade(c, 1.35)], [.6, c], [1, shade(c, .62)]]); ctx.beginPath(); ctx.ellipse(p[0], p[1], 36 * k, 46 * k, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1.5, 3 * k); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(p[0] - 13 * k, p[1] - 18 * k, 7 * k, 12 * k, -.5, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(c, .7); ctx.beginPath(); ctx.moveTo(p[0], p[1] + 46 * k); ctx.lineTo(p[0] - 6 * k, p[1] + 55 * k); ctx.lineTo(p[0] + 6 * k, p[1] + 55 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
  });
}
// ------------------------------------------------------------------ confetti and the party cannon: world-space, deterministic (a pure function of the age)
const CONF_COLS = ['#ff5a8a', '#ffd23a', '#4aa8ff', '#5ae682', '#c25bd6', '#ffffff', '#ff8a3a'];
function confetti(lt, t0, X0, Y0, Z0, o = {}) {
  const age = lt - t0; if (age < 0 || age > 6) return;
  const n = o.n ?? 120, tau = .42, seed = o.seed ?? 1;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const h = j => sr(seed * 100 + i, j), th = .12 + .52 * h(1), az = h(2) * TAU, v0 = (o.v ?? 760) * (.55 + .8 * h(3)), vt = 70 + 110 * h(4), w = 3 + 5 * h(5), ph = h(6) * TAU, ex = 1 - Math.exp(-age / tau);
    const x = X0 + Math.sin(th) * Math.cos(az) * v0 * tau * ex + 22 * Math.sin(w * age + ph) * ss(age, .1, .7), z = Z0 + Math.sin(th) * Math.sin(az) * v0 * tau * ex * .8;
    let y = Y0 + Math.cos(th) * v0 * tau * ex - vt * age;
    const surf = (Math.abs(x) < TW && z > TZ0 && z < TZ1) ? TH : 0;
    let landed = 0; if (y <= surf) { y = surf + 1.5; landed = 1; }
    const p = pj(x, y, z); if (p[3] < NEAR) continue;
    const k = p[2], cw = (11 + 9 * h(7)) * k, ch = (6 + 5 * h(8)) * k, fl = landed ? .22 : Math.cos(age * (4 + 6 * h(9)) + ph);
    const fade = landed ? 1 - ss(age, 4.2, 5.8) : 1;
    ctx.save(); ctx.globalAlpha *= fade; ctx.translate(p[0], p[1]); ctx.rotate(landed ? h(10) * PI : age * (2 + 7 * h(10)) + ph); ctx.scale(1, fl); ctx.fillStyle = CONF_COLS[i % CONF_COLS.length]; ctx.fillRect(-cw / 2, -ch / 2, cw, ch); ctx.restore();
  }
  ctx.restore();
}
function streamers(lt, t0, X0, Y0, Z0) {
  const k = lt - t0; if (k < 0 || k > 2.4) return;
  const cols = ['#ff5a8a', '#ffd23a', '#4aa8ff', '#5ae682'];
  ctx.save(); ctx.lineCap = 'round';
  for (let j = 0; j < 4; j++) {
    const L = 330 + 80 * sr(j, 40), u = eo(c01(k / .45)), a = (j - 1.5) * .22, pts = [];
    for (let q0 = 0; q0 <= 22; q0++) { const q = q0 / 22 * u, r = L * q, wob = Math.sin(q * 13 + j * 2 + k * 5) * 26 * q; pts.push(pj(X0 + Math.sin(a) * r + wob, Y0 + Math.cos(a) * r - 150 * q * q * k, Z0)); }
    ctx.strokeStyle = cols[j]; ctx.lineWidth = Math.max(2, 6 * pts[0][2]); ctx.globalAlpha = 1 - ss(k, 1.5, 2.4);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  }
  ctx.restore();
}
/* the party cannon: a striped cardboard tube with a cone of coloured paper, a pull string; it stands in the alley between the two columns of baskets */
const CAN = { X: -192, Z: 1630 };
function drawCannon(lt, fired) {
  stand(CAN.X, TH, CAN.Z, k => {
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(30,18,8,.25)'; ctx.beginPath(); ctx.ellipse(4, 2, 26, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(-22, 0, 22, 0, [[0, '#ff8aa8'], [.5, '#e8406a'], [1, '#a0204a']]); ctx.strokeStyle = INKC; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-16, -92); ctx.lineTo(16, -92); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 8; for (let i = -2; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-30, i * 20); ctx.lineTo(30, i * 20 - 30); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.ellipse(0, -92, 16, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    if (!fired) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(-14, -92); ctx.lineTo(0, -128); ctx.lineTo(14, -92); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(18, -60); ctx.quadraticCurveTo(44, -50, 36, -16); ctx.stroke(); ctx.fillStyle = '#ffe135'; ctx.beginPath(); ctx.arc(36, -14, 5, 0, TAU); ctx.fill();
    ctx.restore();
  });
}

// ------------------------------------------------------------------ the cast of the hall
/* a paper party hat (the engine's partyhat10 of ep10_party.js, copied): o.hat = { c1, c2, rot, dx, dy, s } */
EXT.acc.fp19s_partyhat = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const h = o.hat || {}, sc = (h.s || 1) * k.rx / 110, c1 = h.c1 || '#ff4f9a', c2 = h.c2 || '#ffe135';
  ctx.save(); ctx.translate((h.dx ?? .34) * k.rx, -k.ry * (h.dy ?? .8)); ctx.rotate((h.rot ?? .36) + .025 * Math.sin(t * 2.1 + (o.seed || 0)));
  ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath();
  ctx.fillStyle = V2.grad(-31 * sc, 0, 31 * sc, 0, [[0, V2.rgba(V2.mix(c1, '#ffffff', .25), 1)], [.5, c1], [1, V2.rgba(V2.mix(c1, '#2a1030', .35), 1)]]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = c2; ctx.lineWidth = 9 * sc; for (let i = -3; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-40 * sc, i * 24 * sc); ctx.lineTo(40 * sc, i * 24 * sc - 34 * sc); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(-14 * sc, -2 * sc); ctx.lineTo(-3 * sc, -86 * sc); ctx.lineTo(-8 * sc, -86 * sc); ctx.lineTo(-24 * sc, -2 * sc); ctx.fill(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * Math.max(.8, sc); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = c2; ell(0, 3 * sc, 33 * sc, 6 * sc); ctx.fill(); ctx.stroke();
  const pr = 9 * sc; ctx.fillStyle = V2.radial(-3 * sc, -100 * sc, 1, pr * 1.4, [[0, '#ffffff'], [1, c2]]); ell(0, -97 * sc, pr, pr); ctx.fill(); ctx.stroke();
  ctx.restore();
};
if (typeof V2C !== 'undefined' && V2C.ACC_CLS) V2C.ACC_CLS.fp19s_partyhat = 'head';
const SS = .95;                                                                       /* a character's scale at k = 1 */
const CP = { straw: [-420, 1790], mango: [-225, 1860], tom: [0, 1930], onion: [240, 1830], lemon: [440, 1790] };
const HATS = { mango: { c1: '#ff4f9a', c2: '#ffe135', rot: .3, dx: .3, dy: .95, s: .9 }, lemon: { c1: '#4aa8ff', c2: '#ffe135', rot: -.25, dx: -.3, dy: .95, s: .9 }, straw: { c1: '#7b4bd6', c2: '#ffe135', rot: .5, dx: .45, dy: 1.45, s: .8 },
  onion: { c1: '#5ae682', c2: '#ffffff', rot: -.3, dx: -.3, dy: .95, s: .85 }, tom: { c1: '#ffd23a', c2: '#e8406a', rot: .2, dx: .15, dy: .95, s: .95 } };
const placeAt = (name, lt) => { const [X, Z] = CP[name], p = pj(X, 0, Z); return { X, Z, x: p[0], y: p[1], s: p[2] * SS, t: lt, k: p[2] }; };
/* every character of the hall as drawChar options, for scene time lt (the frame's camera is already set) */
function castS(lt) {
  const C = {}, inB = (id, a = 0, b = 0) => lt >= ST.bS(id) - a && lt < ST.bE(id) + b, L = (id, i) => ST.wS(id, i);
  const sob = Math.max(0, 1 - Math.abs(lt - SC.sniffle[0] - .12) / .5, 1 - Math.abs(lt - SC.sniffle[1] - .12) / .5);
  let q = placeAt('tom', lt);
  const popArm = lt >= 1.1 && lt < 2.1;
  C.tom = A15.tomato(Object.assign({ x: q.x, y: q.y, s: q.s, t: lt, tomPose: 'fruit', yaw: 0, headYaw: K([[0, 0], [2.75, 0], [3.0, -.4], [4.7, -.4], [4.9, .4], [6.5, .4], [6.7, -.5], [8.3, -.5]], lt), look: [0, .05], expr: 'happy', who: 'tom',
    arms: { l: 'hold', r: popArm ? 'cheer' : 'rest' }, hold: { l: 'fp15_tabletclip' }, tabLit: 1, tabScale: .85, browUp: popArm ? 6 : 2 }));
  C.tom.acc = (C.tom.acc || []).concat(['fp19s_partyhat']); C.tom.hat = HATS.tom;
  q = placeAt('mango', lt);
  C.mango = A7.mango({ x: q.x, y: q.y, s: q.s, t: lt, yaw: .3, headYaw: .35, look: [.7, 0], expr: 'neutral', lid: .35, who: 'mango', arms: { l: 'rest', r: inB('m2') ? 'shrug' : 'rest' }, hat: HATS.mango });
  C.mango.acc = (C.mango.acc || []).concat(['fp19s_partyhat']);
  q = placeAt('lemon', lt);
  C.lemon = A7.lemon({ x: q.x, y: q.y, s: q.s, t: lt, yaw: -.4, headYaw: -.4, look: [-.7, 0], expr: 'neutral', lid: .3, face: { curve: .02 }, who: 'lemon', arms: { l: 'rest', r: 'rest' }, hat: HATS.lemon });
  C.lemon.acc = (C.lemon.acc || []).concat(['fp19s_partyhat']);
  q = placeAt('straw', lt);
  C.straw = A11.straw({ x: q.x, y: q.y, s: q.s, t: lt, yaw: .4, headYaw: .4, look: [.7, .05], expr: 'dead', lid: .5, plant: true, who: 'straw', arms: { l: 'rest', r: 'rest' }, hat: HATS.straw });
  C.straw.acc = (C.straw.acc || []).concat(['fp19s_partyhat']);
  q = placeAt('onion', lt);
  C.onion = A15.onion({ x: q.x, y: q.y, s: q.s, t: lt, yaw: -.35, headYaw: -.3, look: [-.5, .1], expr: 'onion_cry', cry: .62, sob, who: 'onion', hat: HATS.onion });
  C.onion.acc = (C.onion.acc || []).concat(['fp19s_partyhat']);
  return C;
}
// ------------------------------------------------------------------ the label printer on a card table beside the long table, the centrepiece, the paper labels
const CT = { x0: 310, x1: 470, z0: 1540, z1: 1710, h: 118 };       /* the card table */
const PRT = { x0: 330, x1: 450, z0: 1625, z1: 1700, h: 44 };       /* the printer on it */
const PRINT = { t0: ST.snapT(10.36), speed: 128, labW: 100, labH: 56 };   /* the strip creeps out toward the camera at `speed` units/s: three labels by 11.4 */
const stripLen = lt => Math.max(0, Math.min(3 * PRINT.labH + 18, (lt - PRINT.t0) * PRINT.speed));
/* the label text, drawn upright at the label's centre (cx, cy) in the current transform; hero only when it comes out large enough and is whole in the frame */
function labelText(cx, cy, sc, id, hero) {
  UI.container(id, 'pill', [cx - 50 * sc, cy - 28 * sc, cx + 50 * sc, cy + 28 * sc], 1);
  const o = { weight: 900, fill: '#b3261e', cid: id, hero: !!hero, crop: !hero };
  UI.label('CONTAINS:', cx, cy - 13 * sc, Object.assign({ size: 12 * sc, maxW: 88 * sc, spacing: .3 }, o));
  UI.label('BREAD', cx, cy + 4.5 * sc, Object.assign({ size: 18 * sc, maxW: 88 * sc }, o));
}
const labelHero = (cx, cy, sc) => { const m = ctx.getTransform(), s = Math.hypot(m.a, m.b), x = m.a * cx + m.c * cy + m.e, y = m.b * cx + m.d * cy + m.f, w = 50 * sc * s, h = 28 * sc * s; return 13 * sc * s >= 31 && x - w > 46 && x + w < W - 46 && y - h > 46 && y + h < 1370; };
function drawCardTable(lt) {
  const { x0, x1, z0, z1, h } = CT;
  poly3([[x0 - 30, 0, z0 - 30], [x1 + 30, 0, z0 - 30], [x1 + 30, 0, z1 + 30], [x0 - 30, 0, z1 + 30]], 'rgba(36,22,12,.2)');
  for (const [X, Z] of [[x0 + 8, z0 + 8], [x1 - 8, z0 + 8]]) line3([X, 0, Z], [X, h, Z], '#4a3a34', 7);
  poly3([[x0, h, z0], [x1, h, z0], [x1, h - 10, z0], [x0, h - 10, z0]], '#ddd2bc', 'rgba(28,20,14,.7)', 2.4);
  poly3([[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], '#f2ead8', 'rgba(28,20,14,.75)', 3);
}
function drawPrinter(lt) {
  const { x0, x1, z0, z1, h } = PRT, y0 = CT.h;
  poly3([[x0 - 8, y0, z0 - 8], [x1 + 8, y0, z0 - 8], [x1 + 8, y0, z1 + 4], [x0 - 8, y0, z1 + 4]], 'rgba(30,20,10,.22)');
  poly3([[x0, y0, z0], [x1, y0, z0], [x1, y0 + h, z0], [x0, y0 + h, z0]], '#d9d4c6', 'rgba(28,20,14,.8)', 3);                 /* the front face */
  poly3([[x0, y0 + h, z0], [x1, y0 + h, z0], [x1, y0 + h, z1], [x0, y0 + h, z1]], '#f4efe2', 'rgba(28,20,14,.8)', 3);                 /* the top */
  poly3([[x0 + 10, y0 + h * .62, z0 - .5], [x1 - 10, y0 + h * .62, z0 - .5], [x1 - 10, y0 + h * .5, z0 - .5], [x0 + 10, y0 + h * .5, z0 - .5]], '#2a2d36');   /* the slot */
  const p = pj((x0 + x1) / 2, y0 + h, (z0 + z1) / 2 + 8), k = p[2];
  { const t = pj((x0 + x1) / 2 + 34, y0 + h, (z0 + z1) / 2 - 10); tearFall(lt, SC.sniffle[0], t[0], t[1], t[2], 1); }
  if (k > 0) { ctx.save(); ctx.fillStyle = '#1d3a2a'; rr(p[0] - 30 * k, p[1] - 14 * k, 60 * k, 20 * k, 4 * k); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1.4, 2.2 * k); ctx.stroke(); ctx.fillStyle = lt >= PRINT.t0 && lt < 12.3 ? '#7dff9a' : '#3a6a4a'; ctx.fillRect(p[0] - 24 * k, p[1] - 9 * k, 28 * k * (lt >= PRINT.t0 ? 1 : .4), 4 * k);
    ctx.fillStyle = lt >= PRINT.t0 - .5 ? '#ff4a3a' : '#7a2a24'; ctx.beginPath(); ctx.arc(p[0] + 34 * k, p[1] - 4 * k, 3.4 * k, 0, TAU); ctx.fill(); ctx.restore(); }
}
/* the label strip lying on the card table and hanging over its front edge: labels are paper rectangles in the table plane (drawn through the plane map: the text is not) */
function drawStrip(lt, tear) {
  const len = stripLen(lt); if (len < 4) return;
  const y = CT.h + PRT.h * .5 + 2, X = (PRT.x0 + PRT.x1) / 2, e = Math.max(.1, Math.atan2(PJ.cy - y, Math.hypot(X - PJ.cx, PRT.z0 - PJ.cz)));
  const p = pj(X, y, PRT.z0 - 2), k = p[2], se = Math.sin(e), W0 = PRINT.labW, H0 = PRINT.labH;
  ctx.save(); ctx.beginPath(); ctx.rect(p[0] - W0 * k, p[1] - 4 * k, 2 * W0 * k, len * se * k + 4 * k); ctx.clip();
  planeMap(p[0], p[1], k, e, 0);
  ctx.fillStyle = '#f8f8f4'; ctx.strokeStyle = 'rgba(60,60,70,.6)'; ctx.lineWidth = 1.4 / k; ctx.fillRect(-W0 / 2, -len, W0, len); ctx.strokeRect(-W0 / 2, -len, W0, len);
  ctx.restore();
}
function stripLabels(lt) {
  const len = stripLen(lt); if (len < 10) return;
  const y = CT.h + PRT.h * .5 + 2, X = (PRT.x0 + PRT.x1) / 2, p = pj(X, y, PRT.z0 - 2), k = p[2], e = Math.max(.1, Math.atan2(PJ.cy - y, Math.hypot(X - PJ.cx, PRT.z0 - PJ.cz))), se = Math.sin(e);
  for (let j = 0; j < 3; j++) {
    if (len < (j + 1) * PRINT.labH - 6) continue;
    const c = scrP(p[0], p[1], k, e, 0, 0, -(j + .5) * PRINT.labH);
    if (c[0] < -400 || c[0] > W + 400 || c[1] < -400 || c[1] > H + 400) continue;
    ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(k, k * se);
    ctx.strokeStyle = 'rgba(60,60,70,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-PRINT.labW / 2, PRINT.labH / 2); ctx.lineTo(PRINT.labW / 2, PRINT.labH / 2); ctx.stroke();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-PRINT.labW / 2 + 3, -PRINT.labH / 2 + 2, PRINT.labW - 6, 4.5); ctx.fillStyle = '#222'; for (let i = 0; i < 20; i++) ctx.fillRect(-PRINT.labW / 2 + 9 + i * 4, PRINT.labH / 2 - 14.5, (i % 3 ? 1.5 : 2.8), 10);
    ctx.restore();
    const hh = labelHero(c[0], c[1], k);
    ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(k, k); labelText(0, 0, 1, 'strip' + j, hh); ctx.restore();
  }
}
/* a tear falls from the top of the picture onto (cx, cy) and lands at tHit: the drop, then a ring, a splash of droplets and a wet blot that dries slowly */
function tearFall(lt, tHit, cx, cy, k, seed = 0) {
  const a = lt - tHit; if (a < -.24 || a > 1.4) return;
  ctx.save();
  if (a < 0) {
    const u = (a + .24) / .24, y = lerp(cy - 520 * k, cy, u * u), r = 11 * k;
    ctx.fillStyle = 'rgba(176,222,255,.95)'; ctx.strokeStyle = 'rgba(70,120,180,.9)'; ctx.lineWidth = Math.max(1.5, 2.4 * k);
    ctx.beginPath(); ctx.moveTo(cx, y - r * 2.1); ctx.quadraticCurveTo(cx + r * 1.25, y, cx, y + r); ctx.quadraticCurveTo(cx - r * 1.25, y, cx, y - r * 2.1); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(cx - r * .35, y - r * .1, r * .26, r * .5, 0, 0, TAU); ctx.fill();
  } else {
    const blot = 1 - ss(a, .5, 1.4);
    ctx.fillStyle = `rgba(120,176,232,${.42 * blot})`; ctx.strokeStyle = `rgba(80,140,210,${.55 * blot})`; ctx.lineWidth = Math.max(1, 1.6 * k);
    ctx.beginPath(); ctx.ellipse(cx, cy, 22 * k * (1 + .5 * eo(c01(a / .2))), 15 * k * (1 + .5 * eo(c01(a / .2))), .2, 0, TAU); ctx.fill(); ctx.stroke();
    if (a < .4) V2.ring(cx, cy, a / .4, { r0: 8 * k, r1: 70 * k, color: '190,225,255', lw: 4, alpha: .8, squash: .8, bloom: 0 });
    for (let i = 0; i < 6; i++) { const aa = i / 6 * TAU + seed, r = eo(c01(a / .35)) * (34 + 16 * sr(i, seed)) * k, f = 1 - ss(a, .15, .4); ctx.fillStyle = `rgba(176,222,255,${.9 * f})`; ctx.beginPath(); ctx.arc(cx + Math.cos(aa) * r, cy + Math.sin(aa) * r * .8 - 14 * k * Math.sin(c01(a / .35) * PI), Math.max(1, 3 * k), 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
function drawCentrepiece(lt) {   /* a pumpkin and two gourds in the 12th slot */
  pumpkin(PRN.X, PRN.Z, 0, 40, 0); pumpkin(PRN.X - 36, PRN.Z - 40, 0, 20, 1); pumpkin(PRN.X + 34, PRN.Z - 44, 0, 17, -1);
}
// ------------------------------------------------------------------ shots and cameras
const WIDE = { cx: 0, cy: 640, cz: -500, tx: 0, ty: 230, tz: 1700, f: 1500, hy: 1000 };
const PLAN = { cx: 0, cy: 1500, cz: 1200, tx: 0, ty: TH, tz: 1200, f: 1500, hy: 800 };
const CRANE = { t0: 8.339, t1: 9.62 };
const SHOTS = [
  { id: 'open', s: 0, e: 1.2, k: 'wide', z: 1.3, dz: .08 },
  { id: 't1a', s: 1.2, e: 1.98, k: 'cu', foc: 'tom', z: 2.5, dz: .3, up: 20 },
  { id: 't1b', s: 1.98, e: 2.75, k: 'wide', z: 1.42, dz: -.05 },
  { id: 'm1', s: 2.75, e: 3.76, k: 'cu', foc: 'mango', z: 3.5, dz: .25, up: 130, dx: -140 },
  { id: 't2', s: 3.76, e: 4.58, k: 'cu', foc: 'tom', z: 2.7, dz: .25, up: 20 },
  { id: 'l1', s: 4.58, e: 5.67, k: 'cu', foc: 'lemon', z: 3.4, dz: .25, up: 130, dx: 140 },
  { id: 't3', s: 5.67, e: 6.50, k: 'cu', foc: 'tom', z: 3.1, dz: .25, up: 20 },
  { id: 's1', s: 6.50, e: 7.42, k: 'cu', foc: 'straw', z: 3.4, dz: .25, up: 130, dx: -60 },
  { id: 't4', s: 7.42, e: 8.34, k: 'cu', foc: 'tom', z: 3.5, dz: .3, up: 20 },
  { id: 'crane', s: 8.34, e: 9.89, k: 'crane' },
  { id: 'o1a', s: 9.89, e: 10.9, k: 'cu', foc: 'onion', z: 3.3, dz: .25, up: 110, dx: 120 },
  { id: 'o1b', s: 10.9, e: 12.13, k: 'prn' },
  { id: 'm2', s: 12.13, e: 13.12, k: 'cu', foc: 'mango', z: 3.2, dz: .2, up: 120, dx: -90 },
  { id: 'o2a', s: 13.12, e: 13.9, k: 'cu', foc: 'onion', z: 3.0, dz: .2, up: 110, dx: 60 },
  { id: 'o2b', s: 13.9, e: 14.51, k: 'plan', z: 1.0, dz: .1 },
  { id: 'pop', s: 14.51, e: 14.76, k: 'board' },
  { id: 'b1', s: 14.76, e: 17.21, k: 'bubble', n: 1 },
  { id: 's2', s: 17.21, e: 17.76, k: 'cu', foc: 'straw', z: 4.2, dz: .1, up: 120 },
  { id: 'b2', s: 17.76, e: 18.31, k: 'bubble', n: 2 },
  { id: 'grin', s: 18.31, e: 18.70, k: 'binder' },
  { id: 'dd', s: 18.70, e: 20.75, k: 'split' },
  { id: 'b3', s: 20.75, e: 21.55, k: 'one' },
  { id: 'l2a', s: 21.55, e: 22.40, k: 'cu', foc: 'lemon', z: 3.2, dz: .2, up: 120, dx: 60 },
  { id: 'l2b', s: 22.40, e: 23.16, k: 'lone' },
  { id: 't5', s: 23.16, e: 24.29, k: 'cu', foc: 'tom', z: 3.0, dz: .3, up: 20 },
  { id: 'end', s: 24.29, e: 99, k: 'end' },
];
for (const sh of SHOTS) sh.s = sh.s === 0 ? 0 : ST.snapT(sh.s);
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s - 1e-6) r = sh; return r; };
CRANE.t0 = ST.snapT(CRANE.t0); CRANE.t1 = ST.snapT(CRANE.t1);
const lerpPose = (a, b, u) => { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], u); return o; };
const POSE_FOR = (lt, sh) => {
  const u = sg(lt, sh.s, Math.min(sh.e, sh.s + 3));
  switch (sh.k) {
    case 'crane': return lerpPose(WIDE, PLAN, easeIO(sg(lt, CRANE.t0, CRANE.t1)));
    case 'split': return Object.assign({}, PLAN, { cx: -266, tx: -266, cy: PLAN.cy + 70 * sg(lt, 9.6, 25.7) });
    case 'prn': case 'plan': case 'one': case 'end': return Object.assign({}, PLAN, { cy: PLAN.cy + 70 * sg(lt, 9.6, 25.7) });
    default: return Object.assign({}, WIDE, { cz: WIDE.cz + 40 * u, cx: 3 * Math.sin(lt * .6) });
  }
};
const faceZoom0 = (o, z, up = 90) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };
const BASKET_P = i => { const s = SLOT(i); return pj(s.X, TH, s.Z); };
/* the screen point of a world point under the 2D camera now (zoomTo has been called) */
const toScr = (x, y) => [540 + (x - CAM.x) * CAM.z, 960 + (y - CAM.y) * CAM.z];
let FRS = null;                                   /* { C, sh } of the frame being drawn, built in cam() */
function camS(lt) {
  const sh = shotAt(lt), u = sg(lt, sh.s, Math.min(sh.e, sh.s + 3));
  Object.assign(CAMP, POSE_FOR(lt, sh)); setPJ(CAMP);
  const C = castS(lt); FRS = { C, sh, lt };
  const sway = { x: 2 * hnoise(lt, 1.3, 1), y: 1.4 * hnoise(lt, 1.1, 2), r: .0012 * hnoise(lt, .9, 3) };
  switch (sh.k) {
    case 'wide': zoomTo(540, 1050, sh.z + sh.dz * u); break;
    case 'cu': { faceZoom0(C[sh.foc], sh.z + sh.dz * u, sh.up); CAM.x -= (sh.dx || 0) / CAM.z; break; }
    case 'crane': { const cu = sg(lt, CRANE.t0, CRANE.t1); zoomTo(540, lerp(1010, 960, ss(cu, 0, .6)), lerp(1.34, 1, ss(cu, 0, .55))); break; }
    case 'prn': { const p = pj(CT.x0 + 90, CT.h, CT.z0 + 70); zoomTo(p[0] - 4, p[1] + 18, 2.7 + .45 * u); break; }
    case 'plan': zoomTo(540, 960, sh.z + sh.dz * u); break;
    case 'split': zoomTo(540, 960, .92); break;
    case 'one': { const p = pj(0, TH, 1580); zoomTo(p[0], p[1] + 30, 1.9 + .25 * u); break; }
    case 'lone': { const p = BASKET_P(0); zoomTo(p[0] + 20, p[1] - 70, 2.5 + .25 * u); break; }
    case 'board': { const p = pj(0, (BOARD.y0 + BOARD.y1) / 2 + 40, ZB); zoomTo(p[0], p[1], 2.5); break; }
    case 'end': { const p = BASKET_P(0); zoomTo(p[0], p[1] - 10, 1.85 + .3 * sg(lt, sh.s, 25.7)); break; }
    default: zoomTo(540, 1010, 1.2);
  }
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
}
/* ---- the world of a frame */
const heroOK = () => true;
function setLightS(lt) { V2.setLight({ key: [-.55, -.5], keyColor: '#ffe6b8', keyA: .28, rim: '#ffd9a0', rimA: .42, shadow: '#2a1a28', shadowA: .34, bounce: '#ffd9a0', bounceA: .16, amb: '#ffe8c8', ambA: .06, frontDark: .06 }); V2.opts.reflect = false; }
function worldBack(lt, soft) {
  drawFloor(lt); drawWalls(lt); drawBunting(lt);
  const bu = lt < 1.62 ? 0 : eb(sg(lt, 1.62, 2.3)) * 1;
  drawBanner(lt, Math.min(1, bu), soft); drawBoard(lt, SC.basket.filter(t => t <= lt).length, soft); drawCounter(lt);
  plantAt(-650, 2200, 1); plantAt(650, 2200, 1);
  if (PJ.cy < 920) { balloons(lt, -250, 1750, 1); balloons(lt, 250, 1750, 2); }
}
function basketState(i, lt) {
  const t0 = SC.basket[i]; if (lt < t0) return null;
  const tg = GONE_AT[i], a = lt - t0;
  let pop = eb(sg(lt, t0, t0 + .26)); const sq = a < .5 ? Math.exp(-a * 8) * Math.sin(a * 26) : 0;
  if (tg !== undefined && lt >= tg) pop *= 1 - eo(sg(lt, tg, tg + .1));
  if (pop < .02) return null;
  const tL = LAB_AT(i), lab = lt >= tL ? 1 : 0;
  return { pop, sq, label: lab, labelAge: lt - tL };
}
function worldTable(lt, o = {}) {
  drawTable(lt); drawCardTable(lt); drawPrinter(lt); drawStrip(lt); stripLabels(lt);
  drawCentrepiece(lt);
  pumpkin(192, 1120, 0, 24, 0); pumpkin(-192, 1010, 0, 22, 0); pumpkin(192, 780, 0, 26, 0);
  drawCannon(lt, lt >= SC_POP);
  /* baskets back to front */
  const list = [];
  for (let i = 0; i < 11; i++) { const st = basketState(i, lt); if (st) list.push([i, st]); }
  list.sort((a, b) => SLOT(b[0]).Z - SLOT(a[0]).Z);
  for (const [i, st] of list) {
    const s = SLOT(i), p = pj(s.X, TH, s.Z), e = Math.atan2(PJ.cy - TH, Math.hypot(s.X - PJ.cx, s.Z - PJ.cz));
    const t0 = SC.basket[i];
    if (lt - t0 < .35) V2.ring(p[0], p[1] - 30 * p[2] * Math.cos(e), (lt - t0) / .35, { r0: 14 * p[2], r1: 120 * p[2], color: '255,236,190', lw: 5, alpha: .6, squash: Math.max(.4, Math.sin(e)), bloom: 0 });
    drawBasket(p[0], p[1], p[2], e, Object.assign({ name: NAMES[i], id: 'b' + i, seed: (i % 3) * 3 + 1, wob: (sr(i, 3) - .5) * .04, nameShow: o.names !== false }, st));
    if (st.label && st.labelAge >= 0 && st.labelAge < .45 && o.fx !== false) V2.ring(p[0], p[1] - 62 * p[2] * Math.cos(e), st.labelAge / .45, { r0: 10 * p[2], r1: 70 * p[2], color: '255,255,255', lw: 3, alpha: .5, squash: Math.max(.4, Math.sin(e)), bloom: 0 });
  }
  /* the allergen labels fly from the printer to the baskets: a quick sweep, nearest row first */
  for (let i = 0; i < 11; i++) {
    const tL = LAB_AT(i), a = (lt - (tL - .26)) / .26; if (a <= 0 || a >= 1) continue;
    const st = SLOT(i), p1 = pj(st.X, TH + 62, st.Z), p0 = pj((PRT.x0 + PRT.x1) / 2, CT.h + PRT.h + 6, PRT.z0 - 6), u = easeIO(a), x = lerp(p0[0], p1[0], u), y = lerp(p0[1], p1[1], u) - 130 * Math.sin(PI * u) * p1[2], sc = lerp(1.55, 1, u) * p1[2];
    ctx.save(); ctx.translate(x, y); ctx.rotate((1 - u) * (1.1 + .25 * i) * (i % 2 ? -1 : 1)); ctx.scale(sc, sc * Math.max(.35, Math.abs(Math.cos(u * 5 + i)))); ctx.shadowColor = 'rgba(20,10,4,.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    rr(-40, -22, 80, 44, 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(60,60,70,.7)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#c0392b'; ctx.fillRect(-38, -20, 76, 5);
    ctx.fillStyle = '#222'; for (let b = 0; b < 14; b++) ctx.fillRect(-34 + b * 4.6, 6, (b % 3 ? 1.4 : 2.6), 11); ctx.restore();
  }
  { const s4 = SLOT(4), p4 = pj(s4.X, TH + 40, s4.Z); tearFall(lt, SC.sniffle[1], p4[0] + 10 * p4[2], p4[1] + 4 * p4[2], p4[2], 3); }
  /* the poofs: a puff of flour and a floating roll for every basket the Remove Duplicates takes away */
  for (let i = 1; i < 11; i++) {
    const tg = GONE_AT[i]; if (lt < tg || lt > tg + 1.0) continue;
    const s = SLOT(i), p = pj(s.X, TH + 30, s.Z), a = lt - tg;
    if (window.FX18 && FX18.puff) FX18.puff(ctx, { x: p[0], y: p[1], r: 82 * p[2] / 1.1, t: lt, t0: tg, life: .7, color: '#fff3dc', seed: i, flat: 0 });
    ctx.save(); ctx.globalAlpha *= 1 - ss(a, .4, .95); roll(p[0] + 6 * Math.sin(a * 6 + i), p[1] - 40 - 150 * eo(c01(a / .9)), p[2], PI / 2, 0, 0, 0, i, 1, i); ctx.restore();
  }
}
let SC_POP = SC.basket[0];                         /* the first pop is the cannon's: the cannon fires on "Potluck!" (set below) */
SC_POP = ST.snapT(1.26);
/*@@S3@@*/
/* ---- the cast in a frame: who is drawn, sharp, and whether it is whole */
const NAMES5 = ['straw', 'mango', 'tom', 'onion', 'lemon'];
function drawCastFor(C, sh, lt) {
  const order = NAMES5.map(n => [n, C[n]]).sort((a, b) => a[1].y - b[1].y);
  for (const [n, o] of order) {
    if (sh.k === 'crane') { const a = 1 - ss(sg(lt, CRANE.t0, CRANE.t1), .55, .78); if (a < .02) continue; o.transit = true; ctx.save(); ctx.globalAlpha *= a; drawChar(o); ctx.restore(); continue; }
    const f = inFrame(o, 20);
    if (sh.k === 'cu' && n !== sh.foc && (!f.whole || !faceOK(o))) continue;
    if (sh.k === 'wide' && (!f.whole || !faceOK(o))) continue;
    if (sh.k === 'lone' && (!f.whole || !faceOK(o))) continue;
    drawChar(o);
  }
}
const SHOWCAST = { wide: 1, cu: 1, crane: 1, lone: 1 };
function drawS(lt) {
  const { C, sh } = FRS, kd = sh.k;
  setLightS(lt);
  const dim = lt < SC.click ? .5 : lt < SC.click + .07 ? .25 : 0;
  if (kd === 'bubble' || kd === 'binder') { V2.dof(16, () => { worldBack(lt, true); }); return; }
  if (kd === 'board') { worldBack(lt, true); boardPop(lt); return; }
  const tom = sh.foc === 'tom', conf = () => {
    if (lt >= SC_POP) { confetti(lt, SC_POP, CAN.X, TH + 95, CAN.Z, { seed: 1, n: 130 }); streamers(lt, SC_POP, CAN.X, TH + 95, CAN.Z); }
    if (lt >= T5_POP) confetti(lt, T5_POP, 70, 170, 1890, { seed: 7, n: 130, v: 640 });
  };
  if (kd === 'cu') {
    V2.dof(tom ? 8 : 9, () => worldBack(lt, true));
    conf(); drawCastFor(C, sh, lt);
    if (tom) worldTable(lt); else V2.dof(9, () => worldTable(lt, { names: false, fx: false }));
  } else if (SHOWCAST[kd]) {
    worldBack(lt, false); conf(); drawCastFor(C, sh, lt); worldTable(lt);
  } else { worldBack(lt, false); worldTable(lt); conf(); }
  if (lt >= SC_POP && lt < SC_POP + .18) { const p = pj(CAN.X, TH + 100, CAN.Z); V2.glow(p[0], p[1], 150 * p[2], '255,240,200', .8 * (1 - (lt - SC_POP) / .18), 'screen', .3); }
  if (dim > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(52,62,104,${dim})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
const T5_POP = ST.snapT(23.2);
/* Binder pops out of the sign-up sheet (binderpop 14.606): a ring, a flash, the little clip flies up out of the board's top edge */
function boardPop(lt) {
  const t0 = SC.binderpop; if (lt < t0 - .05) return;
  const g = pj(0, BOARD.y1 + 4, ZB - 8), k = g[2], u = sg(lt, t0, t0 + .14), f = ss(lt, t0 + .02, t0 + .6);
  if (u < 1) V2.ring(g[0], g[1], u, { r0: 12, r1: 170, color: '255,236,160', lw: 8, alpha: .9 });
  V2.glow(g[0], g[1] - 20, 170, '190,255,220', .5 * (1 - .4 * f), 'screen', .4);
  const sc = .9 * eb(u); if (sc < .03) return;
  drawChar(A15.binderSmall({ x: g[0], y: lerp(g[1] + 20, g[1] - 150 * k * 1.3, f), s: sc, center: true, noLegs: true, who: 'bind', t: lt, pose: 'ears', grin: .25, look: [.3, .2], hover: 6 }));
}
/* ---- screen-space layers: the count chip */
function countChip(lt, sh) {
  const shown = SC.basket.map((t, i) => lt >= t - .02 && !(GONE_AT[i] !== undefined && lt >= GONE_AT[i] + .05)).filter(Boolean).length;
  const a = ss(lt, SC.basket[3] - .05, SC.basket[3] + .3);
  if (a < .02) return;
  const w = 400, h = 150, x = 636, y = 126, k = eb(c01((lt - SC.basket[3]) / .3));
  ctx.save(); ctx.globalAlpha *= c01(a * 2); ctx.translate(x + w / 2, y + h / 2); ctx.scale(Math.max(.05, k), Math.max(.05, k)); ctx.translate(-(x + w / 2), -(y + h / 2));
  UI.sign([x, y, w, h], [{ t: 'ROLLS  ' + shown, size: 60, fill: '#1e6a44' }, { t: 'MAIN DISH  0', size: 44, fill: '#b3261e', weight: 900 }], { fill: '#fffdf4', stroke: '#2a2018', lw: 5, r: 24, pad: 16, id: 'chip', shadow: 18 });
  ctx.restore();
}
// ------------------------------------------------------------------ Binder's bubble (the kit of Episode 15: SH15.binder, A15.binder; the staging of ep18_station.js, copied and retimed)
const veil = a => { ctx.fillStyle = 'rgba(8,14,18,' + a + ')'; ctx.fillRect(0, 0, W, H); const g = V2.radial(540, 800, 200, 1100, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
const BTXT1 = "It looks like you're planning a potluck. Would you like help?", BTXT2 = "Great! I'll help.";
function typedAtL(T0, id, text, lt) {   /* the share of the letters of `text` shown at lt, in step with the spoken words of line `id` */
  const L = T0.LN[id]; if (!L) return 1;
  const words = L.words, n = text.length; let shown = 0, pos = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i][0].replace(/[^A-Za-z']/g, ''), w = text.indexOf(clean, pos), ws = T0.wS(id, i) - .04, we = T0.wE(id, i); if (w < 0) continue;
    if (lt < ws) break;
    const end = w + clean.length;
    shown = Math.max(shown, lerp(w, end, c01((lt - ws) / Math.max(.05, we - ws))));
    pos = end;
  }
  return lt >= T0.wE(id, words.length - 1) ? 1 : c01(shown / n);
}
const BIG = { x: 350, y: 1060, s: 1.75 };
const BUBX = 110, BUBW = 860, BUBBOT = 760, RP = [[0, 0], [230, 50], [150, 190], [190, 330]];
const RUN = { t0: ST.snapT(17.80), t1: ST.snapT(18.30) };
const runU = lt => sg(lt, RUN.t0 + .04, RUN.t1);
function bubbleOpts(lt) {
  const o = { w: BUBW, s: 1, size: 42, name: 'Binder', buttons: [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }], runPath: RP };
  const second = lt >= ST.bS('b2'); o.text = second ? BTXT2 : BTXT1;
  const h = SH15.binderRect(Object.assign({ at: [0, 0] }, o)).h; o.at = [BUBX, BUBBOT - h];
  o.typed = second ? typedAtL(ST, 'b2', BTXT2, lt) : typedAtL(ST, 'b1', BTXT1, lt);
  o.runaway = runU(lt); o.pop = ss(lt, ST.bS('b1'), ST.bS('b1') + .3);
  o.tail = [BIG.x + 40 * BIG.s, BIG.y - 70 * BIG.s];
  return o;
}
function noRect(o, u) {   /* the current rectangle of "No thanks" as it hops (the same formula as SH15.binder) */
  const g = SH15.binderRect(Object.assign({}, o), 'no'); if (!g) return null;
  const s = o.s ?? 1, nH = RP.length - 1, i = Math.min(nH - 1, Math.floor(c01(u) * nH)), kk = easeIO(sg(c01(u), i / nH, (i + 1) / nH));
  return { x: g.x + lerp(RP[i][0], RP[i + 1][0], kk) * s, y: g.y + lerp(RP[i][1], RP[i + 1][1], kk) * s - Math.sin(PI * kk) * 52 * s, w: g.w, h: g.h };
}
function bigBinder(lt, o) {
  const b = A15.binder(Object.assign({ x: BIG.x, y: BIG.y + Math.sin(lt * 3) * 6, s: BIG.s, center: true, noLegs: true, who: 'bind', t: lt, yaw: -.25, pose: 'rest', look: [.45, -.35], hover: 8 }, o));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; drawChar(b); ctx.restore();
}
function insBubble(lt, sh) {
  veil(.56);
  V2.glow(540, 960, 760, '150,205,255', .14, 'screen', .2);
  const second = lt >= ST.bS('b2');
  bigBinder(lt, { grin: second ? .5 : .15, pose: second ? 'rest' : 'helpful', look: [.5, -.4] });
  const bo = bubbleOpts(lt);
  SH15.binder(bo, lt);
  if (sh.id === 'b2') {   /* the pointer has just pressed "No thanks" and the button runs; the pointer goes after it */
    const nr = noRect(bo, runU(lt)) || { x: 600, y: 600, w: 270, h: 62 }, nrPrev = noRect(bo, runU(lt - .07)) || nr, home = SH15.binderRect(bo, 'no');
    let px, py, press = 0;
    if (lt < RUN.t0 + .04) { px = home.x + home.w * .7; py = home.y + home.h * .8; press = Math.sin(PI * sg(lt, RUN.t0 - .12, RUN.t0 + .2)); }
    else { px = nrPrev.x + nrPrev.w * .7; py = nrPrev.y + nrPrev.h * .8; press = lt < RUN.t0 + .22 ? Math.sin(PI * sg(lt, RUN.t0 - .12, RUN.t0 + .2)) : 0; }
    SH15.pointer(px, py, { kind: 'arrow', press, s: 1.7 });
  }
}
function insBinder(lt, sh) {   /* Binder's grin, full frame: ear to ear, a glint of tooth */
  veil(.8);
  const k = sg(lt, sh.s, Math.min(sh.e, sh.s + 3)), g = ss(lt, SC.grin, SC.grin + .14);
  V2.glow(540, 900, 640, '120,255,180', .16 + .12 * g, 'screen', .3);
  const b = A15.binder({ x: 540, y: 930, s: lerp(1.9, 2.15, k), center: true, noLegs: true, who: 'bind', t: lt, yaw: 0, pose: 'cheer', grin: g, glint: g > .9 ? Math.max(0, Math.sin((lt - SC.grin - .12) * 14)) ** 2 : 0, look: [.1, .1], hover: 8 });
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16; drawChar(b); ctx.restore();
}
// ------------------------------------------------------------------ the split: the sign-up sheet and its Remove Duplicates dialog (SH15) at the left, the plan at the right with the poofs
const SPL = { x: 22, y: 332, s: .5, w: 1080, h: 1280 };
const OKT = { press: ST.snapT(18.92), done: SC.poof[0] };            /* the pointer presses OK just before the first poof */
function splitSheetOpts(lt) {
  const cells = { A1: { v: 'NAME', bold: true, size: 40, fill: '#e1ece6' }, B1: { v: 'DISH', bold: true, size: 40, fill: '#e1ece6' } }, rows = { 1: 92 }, fills = [];
  NAMES.forEach((nm, i) => {
    const r = i + 2, tg = GONE_AT[i];
    cells['A' + r] = { v: nm, size: 38 }; cells['B' + r] = { v: 'ROLLS', size: 38 }; rows[r] = 84;
    if (tg !== undefined) {
      const ks = eo(sg(lt, tg - .1, tg));
      fills.push({ range: `A${r}:B${r}`, color: '#ffbf1f', a: .55 * eo(sg(lt, SC.dedupe + .1, SC.dedupe + .35)) });
      if (ks > 0) for (const c of ['A', 'B']) Object.assign(cells[c + r], { strike: ks, strikeColor: '#d93025' });
      rows[r] = 84 * (1 - easeIO(sg(lt, tg, tg + .16)));
    }
  });
  return { w: SPL.w, h: SPL.h, doc: 'POTLUCK_SIGNUP_v3', saved: false, show: { ribbon: false, formula: false, sheetTabs: false, status: false }, cols: { A: 600, B: 420 }, rows, cells, fills, renumber: true, dressing: true, active: 'A2', r: 14, shadow: 24 };
}
function insSplit(lt, sh) {
  const sl = eb(sg(lt, SC.dedupe, SC.dedupe + .25)), so = splitSheetOpts(lt), q = lerp(.78, 1, Math.min(1, sl));
  ctx.save(); ctx.globalAlpha *= c01(sl * 2.5); ctx.translate(SPL.x, SPL.y); ctx.scale(SPL.s * q, SPL.s * q);
  SH15.sheet(so, lt);
  const dOpen = lt < OKT.done ? eb(sg(lt, SC.dedupe, SC.dedupe + .22)) : 1 - eo(sg(lt, OKT.done, OKT.done + .1));
  const dopt = { kind: 'removeDuplicates', w: SPL.w, h: SPL.h, at: [540, 470], columns: [['NAME', false], ['DISH', true]], dressing: true, t: lt };
  if (dOpen > .02) {
    const press = sg(lt, OKT.press - .1, OKT.press + .1) * (1 - sg(lt, OKT.done - .02, OKT.done + .1));
    SH15.dialog(Object.assign({}, dopt, press > 0 ? { pressed: 'ok', press: { id: 'ok', k: press } } : {}), Math.max(.02, Math.min(1, dOpen)));
    const ok = SH15.dialogRect(dopt, 'ok').aim || [700, 700];
    const cp = SH15.cursorPath([{ t: SC.dedupe, x: 900, y: 1040, kind: 'arrow' }, { t: OKT.press, x: ok[0], y: ok[1], kind: 'arrow', click: [OKT.press - .08, OKT.press + .1] }, { t: OKT.done + .2, x: ok[0] + 60, y: ok[1] + 120 }], lt);
    if (lt < OKT.done + .12) SH15.pointer(cp.x, cp.y, { kind: 'arrow', press: cp.press, s: 2.2 });
  }
  ctx.restore();
}
// ------------------------------------------------------------------ ROLLS: 1 (b3) and the last picture (end)
function stampAt(lt, t0, cy, size, landed) {
  const u = landed ? 1 : sg(lt, t0 - .1, t0), sc = lerp(1.4, 1, eo(u)), cx = 540;
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha *= c01(u * 3); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.1); ctx.shadowColor = 'rgba(20,10,4,.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 7; rr(-310, -88, 620, 176, 16); ctx.fillStyle = '#fff8e6'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(70,46,22,.55)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  UI.stamp('ROLLS: 1', cx, cy, { size, color: '#d6203a', rot: -.1, alpha: .95, hero: u >= 1 });
  ctx.restore();
  if (!landed && lt >= t0 && lt < t0 + .45) V2.ring(cx, cy, (lt - t0) / .45, { r0: 90, r1: 360, color: '214,32,58', lw: 6, alpha: .5, bloom: 0 });
}
function insOne(lt, sh) {
  const t0 = ST.snapT(ST.wS('b3', 1) - .02), pop = eb(sg(lt, sh.s, sh.s + .3)), bob = Math.sin(lt * 3) * 6;
  if (pop > .03) {
    const g = ss(lt, sh.s + .1, sh.s + .4);
    drawChar(A15.binder({ x: 880, y: 690 + bob, s: .6 * pop, center: true, noLegs: true, who: 'bind', t: lt, yaw: -.25, pose: lt >= t0 ? 'cheer' : 'helpful', grin: g, look: [-.5, .2], hover: 8 }));
  }
  stampAt(lt, t0, 500, 100, false);
}
function insEnd(lt, sh) {
  stampAt(lt, 0, 500, 92, true);
  const t = lt - SC.sting;
  if (t > -.02 && t < .5) {   /* the sting: a glint on the basket, a four-point star */
    const p = BASKET_P(0), q = toScr(p[0], p[1] - 70 * p[2]), a = c01(1 - Math.abs(t - .1) / .4);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.glow(q[0], q[1], 180, '255,240,190', .7 * a, 'screen', .3);
    ctx.strokeStyle = `rgba(255,250,220,${a})`; ctx.lineWidth = 4; ctx.lineCap = 'round'; const r = 90 * a;
    ctx.beginPath(); ctx.moveTo(q[0] - r, q[1]); ctx.lineTo(q[0] + r, q[1]); ctx.moveTo(q[0], q[1] - r); ctx.lineTo(q[0], q[1] + r); ctx.stroke(); ctx.restore();
  }
}
function overS(lt, sh) {
  if (sh.k === 'bubble') insBubble(lt, sh);
  else if (sh.k === 'binder') insBinder(lt, sh);
  else if (sh.k === 'split') insSplit(lt, sh);
  else if (sh.k === 'one') insOne(lt, sh);
  else if (sh.k === 'end') insEnd(lt, sh);
}
/*@@OVER3@@*/
const SIGN = {
  shot: lt => shotAt(lt).id,
  cam: camS,
  draw: drawS,
  fx: lt => ({ bloom: .45 + .5 * Math.max(0, 1 - Math.abs(lt - SC.sting - .05) / .25), vignette: .34, grain: .045, contrast: .1, sat: .1, tint: [['255,200,140', .05, 'screen']], fade: lt < .25 ? 1 - lt / .25 : 0, fadeColor: '20,14,10' }),
  blur: lt => { const sh = shotAt(lt); return (lt - sh.s) < .04 ? 1 : sh.k === 'crane' ? 6 : 1; },
  over: lt => { const { sh } = FRS; if (sh.k === 'plan' || sh.k === 'one' || sh.k === 'end' || sh.k === 'split' || (sh.k === 'crane' && lt > CRANE.t1 - .45)) countChip(lt, sh); overS(lt, sh); },
  clock: () => ST.SCN.clock, label: () => ST.SCN.label,
};
window.__EP19_SCENES = window.__EP19_SCENES || {}; window.__EP19_SCENES.signup = SIGN;
/* the helpers the second scene of this file (thanks) shares: the small look-at camera and the timeline tools */
window.__S19 = { c01, sg, ss, eo, eb, lg, sr, pulse, hnoise, key, K, mixc, shade, tl, inFrame, faceOK, scrOf, heroAt, setPJ, PJ, CAMP, pj, projPoly, poly3, line3, stand, NEAR, depthOf, WT, textSafe, INKC, boxOf, scrP, planeMap };

})();
// ====================================================================================================================================================================================
// THANKS (10:40 PM, THE LAST ROUND, 24.2 s): the day room at night, drawn with the same small camera. Warm lamps and string lights, paper hand-turkeys on the wall, the window with the night and (from 19.3) the Moon;
// a semicircle of residents in armchairs and wheelchairs with a plate of beige pie and a cup of nectar-thick cider each; Lemon with a clipboard; Strawberry in the doorway at the med cart; Mango at the back.
// Shots (scene-local s): open 0-1.30 slow wide, steam off the cups | pe1 1.30-3.11 Pear | ba1 3.11-4.52 Banana | cr1 4.52-6.47 Cranberry | go1 6.47-9.17 Goji, the cup turned over | l1 9.17-10.71 Lemon, the tick |
// r1 10.71-12.03 the heads turn to the doorway | s0 12.03-13.25 Strawberry "I am on med pass." | r2 13.25-14.17 "Sit.", Mango rolls a chair | lk 14.17-16.02 Strawberry looks chair, cart, chair; "A chair." |
// sit 16.02-17.67 she sits (chairsit 16.122), the camera pushes in, her eyes close | lamp 17.67-17.98 the call lamp lights in the corridor (callchime 17.772) | eyes 17.98-18.62 her eyes open | ok 18.62-19.48 "Okay.", she stands |
// mo1a 19.48-20.74 the Moon in the window | mo1b 20.74-22.21 the window light falls across the room, the residents wave, Strawberry leaves with the cart | end 22.21-24.16 a last wide: the room, the Moon (sting 22.306).
// ====================================================================================================================================================================================
(() => {
if (!window.TIMELINE_EP19 || !window.__S19 || !window.A7 || !window.H6 || !window.UI) return;
const { c01, sg, ss, eo, eb, lg, sr, pulse, hnoise, key, K, mixc, shade, tl, inFrame, faceOK, scrOf, heroAt, setPJ, PJ, CAMP, pj, projPoly, poly3, line3, stand, NEAR, WT, INKC } = window.__S19;
const { zoomTo, faceC, drawBg } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, PI = Math.PI;
const TT = tl('thanks'), TLN = TT.LN;
const TC = { chairsit: 16.122, callchime: 17.772, sting: 22.306 };
for (const k in TC) TC[k] = TT.snapT(TC[k]);
const F = () => (window.F19 && typeof F19.dish === 'function') ? F19 : null;
const FXL = () => (window.FX18 && typeof FX18.glow === 'function') ? FX18 : null;
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; const X = FXL(); if (X) X.glow(ctx, { x, y, r, color, alpha: a, core: core ?? .3 }); else V2.glow(x, y, r, V2.rgb(color).join(','), Math.min(1, a), 'screen', .3); };

// ------------------------------------------------------------------ the day room: numbers (world units, X right, Y up, Z away)
const RW = 780, RC = 960, RB = 2000, RN = -1800;
const DOOR = { x0: 470, x1: 700, y1: 470 };                        /* the doorway in the back wall, at the right */
const WIN = { x0: -580, x1: -180, y0: 430, y1: 900 };              /* the window, high on the back wall, left */
const COR = { z1: RB + 1100, hw: 300, ch: 560 };                   /* the corridor behind the doorway: far end, half width, height */
const TCAM = { cx: 0, cy: 820, cz: -1000, tx: 0, ty: 150, tz: 1500, f: 1300, hy: 800 };
const DCAM = { cx: 340, cy: 470, cz: 860, tx: 560, ty: 250, tz: 1960, f: 1300, hy: 960 };        /* the view from inside the room toward the doorway: Strawberry, the chair, the corridor behind them */
const SEAT_Y = 62;                                                  /* the height of a seat: the sitter's body bottom */
const SEAT = {
  pear: { X: -520, Z: 1100, kind: 'arm', col: '#8a3b3b', who: 'pear' },
  banana: { X: -260, Z: 1230, kind: 'wheel', col: '#3b6aa8', who: 'banana' },
  cran: { X: 0, Z: 1230, kind: 'arm', col: '#5f7f4f', who: 'cran' },
  goji: { X: 260, Z: 1100, kind: 'wheel', col: '#6a6a78', who: 'goji' },
};
const POS = { lemon: [500, 960] }, MANGO_HOME = [-560, 1986];
const SSR = .95;                                                     /* a character's scale at k = 1 */

// ------------------------------------------------------------------ the room
function wallQ(pts, c0, c1) {
  const q = projPoly(pts); if (q.length < 3) return;
  let y0 = 1e9, y1 = -1e9; q.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); y0 = Math.max(-300, y0); y1 = Math.min(H + 300, y1);
  ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = lg(0, y0, 0, y1, [[0, c0], [1, c1]]); ctx.fill();
}
function drawRoomFloor(lt) {
  wallQ([[-RW, 0, RN], [RW, 0, RN], [RW, 0, RB], [-RW, 0, RB]], '#6a4a32', '#4a3222');
  ctx.save();
  for (let x = -RW + 130; x < RW; x += 130) line3([x, 0, RN], [x, 0, RB], 'rgba(20,10,4,.28)', 2);     /* planks along Z */
  for (let z = 0; z < RB; z += 260) line3([-RW, 0, z], [RW, 0, z], 'rgba(20,10,4,.12)', 1.6);
  ctx.restore();
  /* the rug under the circle: a big oval, rust with a cream border and a tile of diamonds */
  const ov = (r, y) => { const pts = []; for (let i = 0; i < 36; i++) { const a = i / 36 * 2 * PI; pts.push([Math.cos(a) * r[0], y, 1170 + Math.sin(a) * r[1]]); } return pts; };
  poly3(ov([760, 640], 0), '#8a3a2a', 'rgba(20,10,4,.5)', 3); poly3(ov([700, 585], 0), '#d8c49a'); poly3(ov([655, 545], 0), '#9a4a34');
  for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI, x = Math.cos(a) * 560, z = 1170 + Math.sin(a) * 460; poly3([[x - 34, 0, z], [x, 0, z + 26], [x + 34, 0, z], [x, 0, z - 26]], '#d8c49a'); }
}
function drawRoomWalls(lt) {
  /* the back wall in pieces round the doorway */
  const bw = (x0, x1, y0, y1, c0, c1) => wallQ([[x0, y0, RB], [x1, y0, RB], [x1, y1, RB], [x0, y1, RB]], c0, c1);
  const wc0 = '#c9a584', wc1 = '#a98466';
  bw(-RW, DOOR.x0, 0, RC, wc0, wc1); bw(DOOR.x1, RW, 0, RC, wc0, wc1); bw(DOOR.x0, DOOR.x1, DOOR.y1, RC, wc0, wc1);
  bw(-RW, DOOR.x0, 0, 150, '#3e5f5a', '#34524e'); bw(DOOR.x1, RW, 0, 150, '#3e5f5a', '#34524e');
  for (const sd of [-1, 1]) {
    const X = sd * RW; wallQ([[X, 0, RN], [X, 0, RB], [X, RC, RB], [X, RC, RN]], sd < 0 ? '#c4a07e' : '#b58f70', sd < 0 ? '#9c7a5c' : '#8d6c52');
    poly3([[X, 0, RN], [X, 0, RB], [X, 150, RB], [X, 150, RN]], '#3a5a55');
    poly3([[X, 146, RN], [X, 146, RB], [X, 158, RB], [X, 158, RN]], '#8a6a46');
  }
  poly3([[-RW, 146, RB - 1], [RW, 146, RB - 1], [RW, 158, RB - 1], [-RW, 158, RB - 1]], '#8a6a46');
  wallQ([[-RW, RC, RN], [RW, RC, RN], [RW, RC, RB], [-RW, RC, RB]], '#3a3040', '#51465a');                 /* the ceiling, dark */
}
/* the corridor behind the doorway: a lit floor, two walls with doors, the far wall with a door and the call lamp above it (lit by callchime) */
const LAMP = { X: 560, Y: 420, Z: COR.z1 - 6 };
function drawCorridor(lt) {
  const z0 = RB, z1 = COR.z1, cx = (DOOR.x0 + DOOR.x1) / 2, hw = COR.hw, ch = COR.ch;
  wallQ([[cx - hw, 0, z0], [cx + hw, 0, z0], [cx + hw, 0, z1], [cx - hw, 0, z1]], '#8a7a62', '#5a4c3c');
  wallQ([[cx - hw, 0, z0], [cx - hw, ch, z0], [cx - hw, ch, z1], [cx - hw, 0, z1]], '#9c8a74', '#6a5a48');
  wallQ([[cx + hw, 0, z0], [cx + hw, ch, z0], [cx + hw, ch, z1], [cx + hw, 0, z1]], '#8a7864', '#5e4e40');
  wallQ([[cx - hw, ch, z0], [cx + hw, ch, z0], [cx + hw, ch, z1], [cx - hw, ch, z1]], '#2e2836', '#463e50');
  wallQ([[cx - hw, 0, z1], [cx + hw, 0, z1], [cx + hw, ch, z1], [cx - hw, ch, z1]], '#a8957a', '#8a7860');
  for (const [sd, zs] of [[-1, [z0 + 260, z0 + 700]], [1, [z0 + 440, z0 + 880]]]) for (const zc of zs) poly3([[cx + sd * hw * .995, 0, zc - 70], [cx + sd * hw * .995, 0, zc + 70], [cx + sd * hw * .995, 330, zc + 70], [cx + sd * hw * .995, 330, zc - 70]], '#6a4a36', 'rgba(20,10,4,.6)', 2.4);
  poly3([[cx - 90, 0, z1 - 2], [cx + 90, 0, z1 - 2], [cx + 90, 330, z1 - 2], [cx - 90, 330, z1 - 2]], '#6a4a36', 'rgba(20,10,4,.6)', 2.4);                   /* the far door */
  const on = lt >= TC.callchime ? 1 : 0, p = pj(cx, 395, z1 - 4), k = p[2];
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#d8d2c4'; ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1, 3 * k); rr(p[0] - 34 * k, p[1] - 6 * k, 68 * k, 14 * k, 4 * k); ctx.fill(); ctx.stroke();
  ctx.fillStyle = on ? '#ff3a30' : '#5a2420'; ctx.beginPath(); ctx.arc(p[0], p[1] - 4 * k, 24 * k, PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (on) { ctx.fillStyle = 'rgba(255,220,210,.7)'; ctx.beginPath(); ctx.ellipse(p[0] - 8 * k, p[1] - 16 * k, 8 * k, 5 * k, -.5, 0, 2 * PI); ctx.fill(); }
  ctx.restore();
  { const q = pj(cx + 70, 250, z1 - 3), kk = q[2]; ctx.save(); ctx.fillStyle = '#f2ecdc'; ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(1, 2.4 * kk); rr(q[0] - 22 * kk, q[1] - 14 * kk, 44 * kk, 28 * kk, 3 * kk); ctx.fill(); ctx.stroke(); ctx.restore(); UI.label('12', q[0], q[1], { size: 20 * kk, weight: 900, fill: '#3a2a20', hero: false, crop: true }); }
  for (let z = z0 + 150; z < z1; z += 300) { const q = pj(cx, ch - 4, z); glow(q[0], q[1], 120 * q[2], '200,215,255', .12, .1); }
}
/* a window with the night in it: a deep blue sky, stars that twinkle, a pale glow low down */
function drawWindow(lt, o = {}) {
  const Z = RB - 2, w = WIN;
  poly3([[w.x0 - 22, w.y0 - 22, Z], [w.x1 + 22, w.y0 - 22, Z], [w.x1 + 22, w.y1 + 22, Z], [w.x0 - 22, w.y1 + 22, Z]], '#6a5038', 'rgba(20,10,4,.7)', 3);
  const q = projPoly([[w.x0, w.y0, Z - 1], [w.x1, w.y0, Z - 1], [w.x1, w.y1, Z - 1], [w.x0, w.y1, Z - 1]]);
  ctx.save(); ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip();
  const a = pj(w.x0, w.y1, Z), b = pj(w.x0, w.y0, Z); ctx.fillStyle = lg(0, a[1], 0, b[1], [[0, '#081030'], [.6, '#16224a'], [1, '#2a3a6a']]); ctx.fillRect(a[0] - 4, a[1] - 4, (pj(w.x1, 0, Z)[0] - a[0]) + 8, b[1] - a[1] + 8);
  for (let i = 0; i < 46; i++) { const sx = w.x0 + 14 + sr(i, 1) * (w.x1 - w.x0 - 28), sy = w.y0 + 40 + sr(i, 2) * (w.y1 - w.y0 - 60), p = pj(sx, sy, Z), tw = .45 + .55 * Math.sin(lt * (1 + sr(i, 3) * 2.4) + i * 2.1); ctx.fillStyle = `rgba(255,250,230,${.35 + .5 * tw})`; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1, (1.4 + 2 * sr(i, 4)) * p[2]), 0, 2 * PI); ctx.fill(); }
  if (o.moon) o.moon();
  ctx.restore();
  const m = (w.x0 + w.x1) / 2;
  line3([m, w.y0, Z - 2], [m, w.y1, Z - 2], '#6a5038', 8); line3([w.x0, (w.y0 + w.y1) / 2, Z - 2], [w.x1, (w.y0 + w.y1) / 2, Z - 2], '#6a5038', 8);
  poly3([[w.x0 - 34, w.y0 - 30, Z - 4], [w.x1 + 34, w.y0 - 30, Z - 4], [w.x1 + 34, w.y0 - 12, Z - 4], [w.x0 - 34, w.y0 - 12, Z - 4]], '#7a5c3c', 'rgba(20,10,4,.6)', 2);
}
/* children's drawings: a traced hand is a turkey (palm = body, fingers = feathers), in crayon, taped to the wall. o = { X, Y, Z, s, rot, hue } */
function handTurkey(X, Y, Z, sc, rot, seed) {
  stand(X, Y, Z, k => {
    ctx.save(); ctx.rotate(rot); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const cols = ['#e8503a', '#f0a02a', '#f4d23a', '#5aa469', '#4a8ac8'], paper = ['#fff6dc', '#ffeccc', '#f6f2e4', '#fdf0d8'][seed % 4];
    ctx.fillStyle = paper; ctx.strokeStyle = 'rgba(70,50,30,.55)'; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; rr(-92, -96, 184, 192, 6); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
    for (let i = 0; i < 5; i++) { const a = -2.5 + i * .5 + (sr(seed, i) - .5) * .12, L = 66 + 10 * sr(seed, i + 5); ctx.save(); ctx.translate(0, 26); ctx.rotate(a + PI / 2 - PI / 2); ctx.fillStyle = cols[(i + seed) % 5]; ctx.strokeStyle = 'rgba(60,30,20,.7)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-11, -L); ctx.quadraticCurveTo(0, -L - 14, 11, -L); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#9a6a3a'; ctx.strokeStyle = 'rgba(60,30,20,.7)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(0, 36, 30, 28, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f08a2a'; ctx.beginPath(); ctx.moveTo(-4, 30); ctx.lineTo(6, 36); ctx.lineTo(-4, 42); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d0302a'; ctx.beginPath(); ctx.ellipse(-2, 47, 4, 6, 0, 0, 2 * PI); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-10, 26, 5, 0, 2 * PI); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-9, 26, 2.2, 0, 2 * PI); ctx.fill();
    ctx.strokeStyle = '#d89a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 62); ctx.lineTo(-10, 80); ctx.moveTo(8, 62); ctx.lineTo(10, 80); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,180,.6)'; ctx.fillRect(-16, -104, 32, 14); ctx.restore();
  }, sc);
}
function drawWallArt(lt) {
  /* a corkboard between the window and the door, with the paper turkeys; more turkeys on the left wall */
  const Z = RB - 4;
  poly3([[-100, 330, Z], [400, 330, Z], [400, 790, Z], [-100, 790, Z]], '#a07a48', 'rgba(20,10,4,.7)', 4); poly3([[-84, 346, Z - 1], [384, 346, Z - 1], [384, 774, Z - 1], [-84, 774, Z - 1]], '#c99a62');
  [[10, 520, -.08, 1], [150, 640, .06, 2], [290, 520, -.04, 3], [60, 700, .1, 0], [230, 410, .08, 1], [330, 690, -.1, 2]].forEach(([x, y, r, sd]) => handTurkey(x, y, Z - 3, .62, r, sd + 1));
  for (const [z, y, r, sd] of [[1500, 560, 0, 3], [1900, 600, 0, 4]]) { const p = pj(-RW + 4, y, z); if (p[3] > NEAR) { ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(p[2] * .55, p[2] * .55); ctx.restore(); } }
  /* the clock above the doorway: 10:40 */
  const c = pj((DOOR.x0 + DOOR.x1) / 2, 620, RB - 3), k = c[2];
  ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(k, k); ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; ell(0, 0, 50, 50); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI; ctx.lineWidth = i % 3 ? 2 : 4; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 40, -Math.cos(a) * 40); ctx.lineTo(Math.sin(a) * 46, -Math.cos(a) * 46); ctx.stroke(); }
  ctx.lineCap = 'round'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(40 / 60 * 2 * PI) * 36, -Math.cos(40 / 60 * 2 * PI) * 36); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin((10 + 40 / 60) / 12 * 2 * PI) * 24, -Math.cos((10 + 40 / 60) / 12 * 2 * PI) * 24); ctx.stroke(); ctx.restore();
}
/* string lights: warm bulbs on a sagging wire; they breathe */
function drawStringLights(lt) {
  const strands = [[[-RW, 760, RB - 8], [RW, 760, RB - 8], 80, 0], [[-RW, 820, RB - 30], [DOOR.x0 - 20, 700, RB - 30], 50, 1], [[-RW + 6, 840, 1000], [-RW + 6, 840, RB - 20], 60, 2]];
  for (const [a, b, sag, sd] of strands) {
    const N = 16; let prev = null;
    for (let i = 0; i <= N; i++) { const u = i / N, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) - sag * Math.sin(u * PI), z = lerp(a[2], b[2], u), p = pj(x, y, z); if (prev) { ctx.strokeStyle = 'rgba(20,12,6,.6)'; ctx.lineWidth = Math.max(1, 2 * p[2]); ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } prev = p;
      if (i > 0 && i < N && p[3] > NEAR) { const f = .78 + .22 * Math.sin(lt * 1.7 + i * 1.3 + sd), col = ['255,220,150', '255,196,120', '255,236,190'][i % 3]; glow(p[0], p[1] + 8 * p[2], 34 * p[2] * f + 10, col, .55 * f, .5); } }
  }
}
// ------------------------------------------------------------------ chairs: drawn in front view round a seated sitter. (x, y) = the sitter's body bottom on screen, s = the sitter's scale, fl = the floor y under the chair
function chairBack(kind, x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(8,4,16,.4)'; ctx.beginPath(); ctx.ellipse(x, fl, (rxS + 64) * s, 26 * s, 0, 0, 2 * PI); ctx.fill();
  const top = y - (ryS * 2 + 110) * s, bw = (rxS + 36) * s;
  if (kind === 'arm') {                                              /* an upholstered armchair: a tall tufted back */
    ctx.beginPath(); ctx.moveTo(x - bw, y + 24 * s); ctx.lineTo(x - bw, top + 60 * s); ctx.quadraticCurveTo(x - bw, top, x - bw + 60 * s, top); ctx.lineTo(x + bw - 60 * s, top); ctx.quadraticCurveTo(x + bw, top, x + bw, top + 60 * s); ctx.lineTo(x + bw, y + 24 * s); ctx.closePath();
    ctx.fillStyle = lg(0, top, 0, y, [[0, shade(col, 1.25)], [1, shade(col, .8)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke();
    ctx.fillStyle = shade(col, .6); for (const fx of [-.5, 0, .5]) for (const fy of [.3, .55]) { ctx.beginPath(); ctx.arc(x + fx * bw, lerp(top, y, fy), Math.max(2, 4.5 * s), 0, 2 * PI); ctx.fill(); }
  } else {                                                           /* a wheelchair: a dark vinyl back, push handles, big wheels at the sides */
    const bh = (ryS * 1.6 + 60) * s, tx = y - bh;
    ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = Math.max(5, 10 * s); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * (rxS * .86) * s, y - 30 * s); ctx.lineTo(x + sd * (rxS * .86) * s, tx - 36 * s); ctx.lineTo(x + sd * (rxS * .86 + 30) * s, tx - 40 * s); ctx.stroke(); }
    ctx.strokeStyle = '#8d96a4'; ctx.lineWidth = Math.max(3, 6 * s); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * (rxS * .86) * s, y - 30 * s); ctx.lineTo(x + sd * (rxS * .86) * s, tx - 36 * s); ctx.lineTo(x + sd * (rxS * .86 + 30) * s, tx - 40 * s); ctx.stroke(); }
    rr(x - rxS * .86 * s, tx, rxS * 1.72 * s, bh + 20 * s, 14 * s); ctx.fillStyle = lg(0, tx, 0, y, [[0, shade(col, 1.15)], [1, shade(col, .7)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke();
    for (const sd of [-1, 1]) { const wx = x + sd * (rxS + 40) * s, wy = (y + fl) / 2 - 8 * s, wr = (fl - y) * .5 + 56 * s;      /* the wheel, edge-on */
      ctx.fillStyle = '#16181e'; ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.beginPath(); ctx.ellipse(wx, wy, 13 * s, wr, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c4cad6'; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.ellipse(wx + sd * 9 * s, wy, 4 * s, wr * .86, 0, 0, 2 * PI); ctx.stroke(); }
  }
  ctx.restore();
}
function chairFront(kind, x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const aw = 40 * s;
  if (kind === 'arm') {
    for (const sd of [-1, 1]) { const ax = x + sd * (rxS + 34) * s; rr(ax - aw / 2, y - 120 * s, aw, 150 * s, 18 * s); ctx.fillStyle = lg(ax - aw / 2, 0, ax + aw / 2, 0, [[0, shade(col, 1.2)], [1, shade(col, .78)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke(); }
    rr(x - (rxS + 14) * s, y + 4 * s, (rxS + 14) * 2 * s, 40 * s, 14 * s); ctx.fillStyle = lg(0, y, 0, y + 44 * s, [[0, shade(col, 1.1)], [1, shade(col, .7)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.stroke();
    ctx.fillStyle = '#3a2418'; for (const sd of [-1, 1]) { rr(x + sd * (rxS - 6) * s - 9 * s, y + 42 * s, 18 * s, Math.max(6, fl - y - 40 * s), 4 * s); ctx.fill(); }
  } else {
    for (const sd of [-1, 1]) { const ax = x + sd * (rxS + 2) * s; rr(ax - 17 * s, y - 100 * s, 34 * s, 22 * s, 8 * s); ctx.fillStyle = '#2a2a33'; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.stroke();
      ctx.strokeStyle = '#8d96a4'; ctx.lineWidth = Math.max(3, 6 * s); ctx.beginPath(); ctx.moveTo(ax, y - 80 * s); ctx.lineTo(ax, y + 40 * s); ctx.lineTo(ax + sd * 8 * s, fl - 20 * s); ctx.stroke();
      ctx.fillStyle = '#16181e'; ctx.beginPath(); ctx.ellipse(ax + sd * 10 * s, fl - 6 * s, 15 * s, 12 * s, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
      rr(ax - 22 * s + sd * 6 * s, fl - 32 * s, 44 * s, 10 * s, 4 * s); ctx.fillStyle = '#3a3f4a'; ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
/* a knitted lap blanket and the lap tray: a flat teal board with a raised edge, seen from slightly above; the plate and the cup stand on it */
function lapBlanket(x, y, s, rxS, col, pat) {
  ctx.save(); ctx.lineJoin = 'round'; const w = (rxS + 6) * s;
  ctx.beginPath(); ctx.moveTo(x - w, y - 38 * s); ctx.quadraticCurveTo(x, y - 54 * s, x + w, y - 38 * s); ctx.lineTo(x + w * 1.06, y + 52 * s); for (let i = 6; i >= 0; i--) ctx.lineTo(x - w * 1.06 + (i / 6) * w * 2.12, y + 52 * s + (i % 2 ? 9 : 0) * s); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.6 * s); ctx.stroke(); ctx.clip();
  ctx.strokeStyle = pat; ctx.lineWidth = Math.max(2, 7 * s); for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / 4, y - 60 * s); ctx.lineTo(x + i * w / 4, y + 70 * s); ctx.stroke(); } for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x - w * 1.1, y - 20 * s + j * 22 * s); ctx.lineTo(x + w * 1.1, y - 20 * s + j * 22 * s); ctx.stroke(); }
  ctx.restore();
}
function lapTray(x, y, s, rxS) {
  const w = (rxS + 24) * s, h = 30 * s;
  ctx.save(); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(10,6,18,.35)'; ctx.beginPath(); ctx.ellipse(x + 4 * s, y + 18 * s, w * 1.02, 16 * s, 0, 0, 2 * PI); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, w, h * .5, 0, 0, 2 * PI); ctx.fillStyle = lg(0, y - h / 2, 0, y + h / 2, [[0, '#7fc8c0'], [1, '#4a948c']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.6 * s); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y + 4 * s, w * .9, h * .36, 0, 0, 2 * PI); ctx.fillStyle = '#9fded6'; ctx.fill(); ctx.strokeStyle = 'rgba(28,20,14,.35)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
/* the dinner on the tray: the plate of beige pie (F19.pieMold) and the cup of nectar-thick cider; stand-ins until the kit answers */
function pieStand(x, y, sc, t, seed) {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.lineJoin = 'round';
  ctx.fillStyle = '#f6f3ea'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -10, 150, 40, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9c7a3'; ctx.beginPath(); ctx.moveTo(-70, -12); ctx.quadraticCurveTo(-60, -90, 0, -92); ctx.quadraticCurveTo(60, -90, 70, -12); ctx.quadraticCurveTo(0, 6, -70, -12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ece0c6'; for (const [px, py] of [[-34, -50], [0, -70], [34, -50]]) { ctx.beginPath(); ctx.arc(px, py, 14, 0, 2 * PI); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function dinner(x, y, s, t, seed, o = {}) {   /* (x, y) = the middle of the tray top, s = the sitter's scale */
  const K = F(), sp = .4 * s;
  if (o.plate !== false) { if (K) K.dish(ctx, 'plate', { x: x - 26 * s, y: y + 10 * s, s: sp, items: ['pieMold'], t, seed, steam: .15 }); else pieStand(x - 20 * s, y + 8 * s, sp * .5, t, seed); }
  if (o.cup !== false) {
    const cx = x + 84 * s, cy = y + 14 * s;
    if (K) K.dish(ctx, 'coffee', { x: cx, y: cy, s: .36 * s, thick: .35, fill: .8, steam: .9, t, seed: seed + 5 });
    else { ctx.save(); ctx.fillStyle = '#f3f0e6'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 14 * s, cy - 40 * s); ctx.lineTo(cx + 14 * s, cy - 40 * s); ctx.lineTo(cx + 10 * s, cy); ctx.lineTo(cx - 10 * s, cy); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (K && K.steam) { glow(cx, cy - 70 * s, 70 * s, '255,225,190', .1, .2); K.steam(ctx, { x: cx, y: cy - 36 * s, w: 36 * s, h: 190 * s, t, seed: seed + 11, power: 1, curl: .7 }); }
  }
}
// ------------------------------------------------------------------ props and accessories of the day room (the prefix fp19s_ keeps them apart from every other episode)
EXT.prop.fp19s_medcup = (side, o, t) => {      /* Strawberry's paper med cup with three pills (the engine's fp18_medcup of ep18_station.js, copied) */
  const S = o.cupScale || 1.6;
  ctx.save(); ctx.rotate((o.cupTip || 0) - .08); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = '#f7f7f1'; ctx.strokeStyle = 'rgba(25,16,30,.88)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(14, -20); ctx.lineTo(10, 3); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,120,130,.55)'; ctx.lineWidth = 1.2; for (const x of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x * 1.2, -18); ctx.lineTo(x * .8, 1); ctx.stroke(); }
  for (const [x, y, c] of [[-6, -21, '#f4a3b8'], [2, -23, '#ffffff'], [8, -20, '#7fc8f8']]) { ctx.fillStyle = c; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y, 4.4, 3.2, .3, 0, 2 * PI); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp19s_medcup = Object.assign([-30, -50, 30, 12], { nearFace: true });
/* Mr. Goji's empty paper cup: o.cupTip turns it (PI = upside down); a last drop hangs from the rim and falls once it is over */
EXT.prop.fp19s_cup = (side, o, t) => {
  const S = o.cupScale || 1.7, tip = o.cupTip || 0;
  ctx.save(); ctx.translate(0, -22 * S); ctx.rotate(tip); ctx.translate(0, 22 * S); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = '#f7f7f1'; ctx.strokeStyle = 'rgba(25,16,30,.88)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-17, -44); ctx.lineTo(17, -44); ctx.lineTo(12, 0); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9a063'; ctx.beginPath(); ctx.moveTo(-15, -30); ctx.lineTo(15, -30); ctx.lineTo(13, -10); ctx.lineTo(-13, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.ellipse(0, -44, 17, 4.5, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
  ctx.restore();
  const dr = o.cupDrop ?? -1;       /* 0..1: the drop leaves the rim and falls (screen down) */
  if (dr >= 0) { ctx.save(); const y = 20 * S + 120 * dr * dr, a = 1 - dr * .6; ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(170,215,250,.95)'; ctx.strokeStyle = 'rgba(70,120,180,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y - 11); ctx.quadraticCurveTo(7, y + 2, 0, y + 7); ctx.quadraticCurveTo(-7, y + 2, 0, y - 11); ctx.fill(); ctx.stroke(); ctx.restore(); }
};
PROP_BOX.fp19s_cup = Object.assign([-40, -80, 40, 30], { nearFace: true });
/* Lemon's clipboard with the checklist: o.tick 0..1 draws a tick in the last box */
EXT.prop.fp19s_clip = (side, o, t) => {
  const S = o.clipScale || 1.5, k = c01(o.tick || 0);
  ctx.save(); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#c4925a'; ctx.strokeStyle = 'rgba(30,16,8,.85)'; ctx.lineWidth = 2.6; rr(-28, -56, 56, 76, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f8f5ea'; ctx.fillRect(-23, -48, 46, 62); ctx.strokeStyle = 'rgba(70,60,40,.45)'; ctx.lineWidth = 1.6; ctx.strokeRect(-23, -48, 46, 62);
  ctx.fillStyle = '#98a2b0'; rr(-12, -62, 24, 12, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,60,40,.4)'; ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const y = -36 + i * 13; ctx.beginPath(); ctx.moveTo(-8, y); ctx.lineTo(18, y); ctx.stroke(); ctx.strokeRect(-19, y - 5, 8, 8); }
  if (k > 0) { ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-18, 12); ctx.lineTo(lerp(-18, -14, c01(k * 2)), lerp(12, 17, c01(k * 2))); if (k > .5) ctx.lineTo(lerp(-14, -5, c01((k - .5) * 2)), lerp(17, 3, c01((k - .5) * 2))); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp19s_clip = Object.assign([-44, -96, 44, 32], { nearFace: true });
/* a paper pilgrim hat (black, a white band, a gold buckle) and a feather headband: children's craft, worn by two residents */
EXT.acc.fp19s_pilgrim = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const sc = k.rx / 112, y0 = -k.ry * (o.pilY ?? .98);
  ctx.save(); ctx.translate((o.pilX ?? 0) * k.rx, y0); ctx.rotate(o.pilRot ?? -.08); ctx.lineJoin = 'round';
  ctx.fillStyle = '#26222c'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-42 * sc, 4 * sc); ctx.lineTo(-32 * sc, -64 * sc); ctx.lineTo(32 * sc, -64 * sc); ctx.lineTo(42 * sc, 4 * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#26222c'; ctx.beginPath(); ctx.ellipse(0, 4 * sc, 64 * sc, 11 * sc, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4efe0'; ctx.fillRect(-40 * sc, -18 * sc, 80 * sc, 16 * sc); ctx.strokeRect(-40 * sc, -18 * sc, 80 * sc, 16 * sc);
  ctx.fillStyle = '#f2c11b'; ctx.fillRect(-12 * sc, -21 * sc, 24 * sc, 22 * sc); ctx.strokeRect(-12 * sc, -21 * sc, 24 * sc, 22 * sc); ctx.fillStyle = '#f4efe0'; ctx.fillRect(-6 * sc, -15 * sc, 12 * sc, 10 * sc);
  ctx.restore();
};
EXT.acc.fp19s_feathers = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const sc = k.rx / 110, y0 = -k.ry * (o.fthY ?? .92);
  ctx.save(); ctx.translate((o.fthX ?? 0) * k.rx, y0); ctx.lineJoin = 'round';
  [['#e8503a', -.62], ['#f0a02a', -.2], ['#f4d23a', .2], ['#5aa469', .62]].forEach(([c, a], i) => { ctx.save(); ctx.rotate(a + .04 * Math.sin(t * 1.3 + i)); ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8 * sc, 4 * sc); ctx.quadraticCurveTo(-18 * sc, -44 * sc, 0, -86 * sc); ctx.quadraticCurveTo(18 * sc, -44 * sc, 8 * sc, 4 * sc); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(60,30,20,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -76 * sc); ctx.stroke(); ctx.restore(); });
  ctx.fillStyle = '#8a5a30'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 6 * sc, 40 * sc, 8 * sc, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();
  ctx.restore();
};
if (typeof V2C !== 'undefined' && V2C.ACC_CLS) { V2C.ACC_CLS.fp19s_pilgrim = 'head'; V2C.ACC_CLS.fp19s_feathers = 'head'; }

// ------------------------------------------------------------------ the cast: who sits where, the beats of the scene
const T = { r1: TT.bS('r1'), r2: TT.bS('r2'), s0: TT.bS('s0'), beat: TT.bS('beat'), s1: TT.bS('s1'), sit: TT.bS('sit'), call: TT.bS('call'), s2: TT.bS('s2'), mo1: TT.bS('mo1'), end: TT.bS('end') };
const AT = 13.25, ROLL1 = 14.17;                                      /* the chair rolls from AT to ROLL1 */
const CHAIR0 = [-10, 1962], CHAIR1 = [580, 1948];
const chairPos = lt => { const u = easeIO(sg(lt, AT, ROLL1)), v = ss(lt, 19.5, 20.5); return [lerp(lerp(CHAIR0[0], CHAIR1[0], u), 120, v), lerp(CHAIR0[1], CHAIR1[1], u) + 30 * Math.sin(PI * u) + 14 * v]; };
const SIT_T = TC.chairsit - .1, UP_T = T.s2 + .05;                    /* she lowers from SIT_T, lands on the cue; she rises on "Okay." */
const STR_STAND = [585, 1840], STR_SIT = [CHAIR1[0] + 2, CHAIR1[1] - 20], CART = [735, 1920];
const sitK = lt => lt < SIT_T ? 0 : lt < TC.chairsit ? eo(sg(lt, SIT_T, TC.chairsit)) : lt < UP_T ? 1 : 1 - ss(lt, UP_T, UP_T + .45);
const strPos = lt => {
  if (lt < UP_T) { const sk = sitK(lt); return [lerp(STR_STAND[0], STR_SIT[0], sk), lerp(STR_STAND[1], STR_SIT[1], sk)]; }
  const a = ss(lt, UP_T, UP_T + .45), w = ss(lt, 19.2, 22.6);        /* she stands and steps to the cart, then walks it away down the corridor */
  const x = lerp(STR_SIT[0], 640, a), z = lerp(STR_SIT[1], 1930, a);
  return [x + (600 - x) * w, z + (RB + 880 - z) * w];
};
const RES_BASE = {
  pear: { yaw: .5, head: .55, expr: 'happy', acc: ['unionpin7', 'suspenders', 'fp19s_pilgrim'], strip: ['newsboy'] },
  banana: { yaw: .2, head: .2, expr: 'neutral', acc: ['fp19s_feathers'] },
  cran: { yaw: -.15, head: -.15, expr: 'happy', acc: ['curlers', 'glasses'] },
  goji: { yaw: -.45, head: -.45, expr: 'sad', acc: ['wolfears', 'gown'] },
};
const SPK = { pear: 'pe1', banana: 'ba1', cran: 'cr1', goji: 'go1' };
const inBeat = (lt, id, a = 0, b = 0) => lt >= TT.bS(id) - a && lt < TT.bE(id) + b;
function resOpts(name, lt) {
  const S = SEAT[name], B0 = RES_BASE[name], p = pj(S.X, SEAT_Y, S.Z), k = p[2], s = k * SSR, f = pj(S.X, 0, S.Z);
  const spk = inBeat(lt, SPK[name]), chor = (lt >= T.r1 && lt < TT.bE('r1') + .05) || (lt >= T.r2 && lt < TT.bE('r2') + .05);
  const door = .78 + (name === 'goji' ? .1 : 0), turn = ss(lt, T.r1 + .02 + .05 * Object.keys(SEAT).indexOf(name), T.r1 + .45), hy = lerp(B0.head, door, turn);
  const lk = turn > .5 ? [.8, .1] : name === 'goji' && lt > 8.4 ? [.35, .65] : [.0, .05];
  const o = Object.assign((A7[name] || A7.pear)({}), { x: p[0], y: p[1], s, t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true, yaw: B0.yaw, headYaw: hy, look: lk, expr: B0.expr, who: chor ? 'rall' : spk ? name : undefined,
    arms: { l: 'rest', r: 'rest' }, lid: name === 'goji' || name === 'banana' ? .35 : .22 });
  o.acc = (o.acc || []).filter(a => (B0.strip || []).indexOf(a) < 0 && !(name === 'pear' && a === 'newsboy'));
  for (const a of B0.acc) if (o.acc.indexOf(a) < 0) o.acc.push(a);
  if (name === 'pear') o.pilY = .96;
  return { o, S, p, k, s, fl: f[1] };
}
function gojiCup(lt, R) {   /* "water.": the empty cup comes up, turns over and the last drop falls */
  const t0 = TLN.go1 ? TT.wS('go1', 4) - .35 : 8;
  const up = ss(lt, t0, t0 + .5), tip = PI * ss(lt, t0 + .35, t0 + .95), dr = lt > t0 + 1.0 ? c01((lt - (t0 + 1.0)) / .5) : -1;
  const o = R.o; o.arms = { l: 'rest', r: 'hold' }; o.hold = { r: 'fp19s_cup' }; o.cupScale = 1.6; o.cupTip = tip; o.cupDrop = dr; o.grip = { r: [lerp(110, 62, up), lerp(70, 6, up)] };
}
// ------------------------------------------------------------------ the med cart, the rolling chair, the lamps
function medCart(X, Z, lt, extra = {}) {
  const p = pj(X, 0, Z); if (p[3] < NEAR) return; const k = p[2] * (extra.s ?? 1);
  ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(8,4,16,.4)'; ctx.beginPath(); ctx.ellipse(0, 4, 96, 16, 0, 0, 2 * PI); ctx.fill();
  ctx.fillStyle = '#1b1c22'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; for (const sx of [-80, 80]) { ctx.beginPath(); ctx.arc(sx, -12, 12, 0, 2 * PI); ctx.fill(); ctx.stroke(); }
  rr(-98, -230, 196, 210, 10); ctx.fillStyle = lg(0, -230, 0, -20, [[0, '#d9e4ee'], [1, '#a9b8c8']]); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 3; i++) { rr(-86, -214 + i * 62, 172, 52, 6); ctx.fillStyle = '#eef3f8'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8d96a4'; rr(-24, -194 + i * 62, 48, 8, 4); ctx.fill(); }
  rr(-106, -246, 212, 22, 6); ctx.fillStyle = '#7fa0c0'; ctx.fill(); ctx.stroke();
  for (const [cx2, col] of [[-60, '#f7f7f1'], [-30, '#f7f7f1'], [0, '#f7f7f1'], [30, '#f7f7f1']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx2 - 11, -280); ctx.lineTo(cx2 + 11, -280); ctx.lineTo(cx2 + 8, -246); ctx.lineTo(cx2 - 8, -246); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = '#8d96a4'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(98, -226); ctx.lineTo(120, -226); ctx.lineTo(120, -150); ctx.stroke();
  ctx.fillStyle = '#c0392b'; rr(54, -296, 42, 42, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(70, -286, 10, 24); ctx.fillRect(63, -279, 24, 10);
  ctx.restore();
}
function sideTable(X, Z, lt) {   /* a small round table by Strawberry's chair, with a plate of beige pie and a steaming cup of cider */
  const f = pj(X, 0, Z), t = pj(X, 105, Z), k = f[2]; if (f[3] < NEAR) return;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(8,4,16,.4)'; ctx.beginPath(); ctx.ellipse(f[0], f[1], 64 * k, 15 * k, 0, 0, 2 * PI); ctx.fill();
  ctx.strokeStyle = '#3a2418'; ctx.lineWidth = Math.max(3, 10 * k); ctx.beginPath(); ctx.moveTo(f[0], f[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(f[0], f[1] - 4 * k, 40 * k, 9 * k, 0, 0, 2 * PI); ctx.fillStyle = '#4a3020'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(t[0], t[1], 66 * k, 21 * k, 0, 0, 2 * PI); ctx.fillStyle = lg(0, t[1] - 21 * k, 0, t[1] + 21 * k, [[0, '#b08a5a'], [1, '#86603a']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.4 * k); ctx.stroke();
  ctx.restore();
  dinner(t[0] + 4 * k, t[1] - 4 * k, k * .62, lt, 13);
}
function floorLamp(X, Z, lt, seed) {
  const p = pj(X, 0, Z), t = pj(X, 360, Z); if (p[3] < NEAR) return; const k = p[2];
  ctx.save(); ctx.fillStyle = 'rgba(8,4,16,.35)'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 50 * k, 12 * k, 0, 0, 2 * PI); ctx.fill();
  ctx.strokeStyle = '#2a2018'; ctx.lineWidth = Math.max(2, 7 * k); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(t[0], t[1]); ctx.stroke();
  ctx.fillStyle = '#3a2c20'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 4 * k, 36 * k, 9 * k, 0, 0, 2 * PI); ctx.fill();
  const f = .93 + .07 * Math.sin(lt * 2.3 + seed * 3);
  ctx.beginPath(); ctx.moveTo(t[0] - 40 * k, t[1]); ctx.lineTo(t[0] + 40 * k, t[1]); ctx.lineTo(t[0] + 66 * k, t[1] - 92 * k); ctx.lineTo(t[0] - 66 * k, t[1] - 92 * k); ctx.closePath();
  ctx.fillStyle = lg(0, t[1] - 92 * k, 0, t[1], [[0, '#ffe2a8'], [1, '#e8b870']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.4 * k); ctx.stroke();
  ctx.restore();
  glow(t[0], t[1] - 70 * k, 340 * k * f, '255,196,120', .62 * f, .5);
}
// ------------------------------------------------------------------ the cast of a frame
const BLANKET = { pear: ['#4a6fa8', 'rgba(255,255,255,.5)'], banana: ['#d8a83a', 'rgba(120,70,10,.45)'], cran: ['#e88aa0', 'rgba(255,240,240,.55)'], goji: ['#8a8f9c', 'rgba(40,44,60,.4)'] };
const lookStr = lt => lt < T.s0 + .5 ? [-.7, .12] : lt < T.beat ? [-.5, .15] : lt < T.beat + .4 ? [-.95, .3] : lt < T.beat + .8 ? [.95, .22] : lt < T.s1 ? [-.95, .3] : lt < SIT_T ? [-.45, .25] : lt < TC.chairsit + .15 ? [-.1, .35] : lt >= 18.3 ? [.1, .05] : [0, .3];
function castT(lt) {
  const C = { res: {} };
  for (const n of ['pear', 'banana', 'cran', 'goji']) {
    const R = resOpts(n, lt);
    if (n === 'goji') gojiCup(lt, R);
    if (lt >= 20.9 && lt < 22.6) { R.o.arms = { l: 'rest', r: 'wave' }; R.o.hand = { r: 'wave' }; }
    C.res[n] = R;
  }
  const lp = pj(POS.lemon[0], 0, POS.lemon[1]), tick = ss(lt, TT.wS('l1', 3), TT.wS('l1', 3) + .35);
  C.lemon = A7.lemon({ x: lp[0], y: lp[1], s: lp[2] * SSR, t: lt, yaw: -.5, headYaw: inBeat(lt, 'l1', .1) ? -.2 : -.5, look: inBeat(lt, 'l1', .1) ? [-.15, .05] : [-.85, .1], expr: 'neutral', lid: .3, face: { curve: .02 }, who: 'lemon',
    arms: { l: 'hold', r: 'rest' }, hold: { l: 'fp19s_clip' }, clipScale: 1.45, tick, grip: { l: [-100, 6] } });
  const cp = chairPos(lt), walkIn = ss(lt, AT - .8, AT - .05), away = ss(lt, ROLL1 - .25, ROLL1 + 1.0), ru = easeIO(sg(lt, AT, ROLL1));
  const mxz = [lerp(lerp(MANGO_HOME[0], cp[0] - 185, walkIn), MANGO_HOME[0], away), 1986 - 20 * away], mp = pj(mxz[0], 0, mxz[1]);
  const walking = (lt >= AT - .8 && lt < AT - .02) || (lt >= AT && lt < ROLL1 + 1.0), pushing = lt >= AT - .05 && lt < ROLL1 + .25;
  const dist = Math.abs(CHAIR0[0] - 185 - MANGO_HOME[0]) * walkIn + Math.hypot(CHAIR1[0] - CHAIR0[0], CHAIR1[1] - CHAIR0[1]) * ru + 760 * away;
  C.mango = A7.mango({ x: mp[0], y: mp[1], s: mp[2] * SSR, t: lt, yaw: away > .05 && away < .95 ? -.55 : .55, headYaw: .5, look: [.6, .05], expr: 'neutral', lid: .3, who: 'mango', arms: { l: 'rest', r: pushing ? 'hold' : 'rest' }, grip: { r: [128, 36] },
    gaitW: walking ? dist : undefined, axis: walking ? 'x' : undefined, dir: walking ? (away > .05 ? -1 : 1) : undefined, vx: walking ? 120 * (away > .05 ? -1 : 1) : undefined });
  /* Strawberry: standing with the med cup, sits on the cue, rises on "Okay.", takes the cart and walks it away down the corridor */
  const sp = strPos(lt), sk = sitK(lt), W0 = lt >= T.s2 + .5, walk = sg(lt, 19.2, 22.6), walking2 = lt >= 19.2 && lt < 22.65;
  const f = pj(sp[0], 0, sp[1]), k = f[2], s = k * SSR, legs = sk < .001, seatY = pj(sp[0], SEAT_Y, sp[1])[1], bodyBottom = f[1] - 92 * s;
  const yy = legs ? f[1] : lerp(bodyBottom, seatY, sk);
  const lid = lt < TC.chairsit + .1 ? .5 : lt < 16.5 ? lerp(.5, 1, ss(lt, TC.chairsit + .1, 16.5)) : lt < 17.95 ? 1 : lerp(1, .5, ss(lt, 17.95, 18.4));
  const yawS = lt < 19.1 ? (sk > .5 ? -.35 : 0) : lerp(0, PI, ss(lt, 19.1, 19.55));
  C.straw = A11.straw({ x: f[0], y: yy, s, t: lt, yaw: yawS, headYaw: lt < 19.1 ? (sk > .5 ? -.3 : (lt < T.s0 ? -.2 : 0)) : yawS, look: lookStr(lt), expr: 'dead', lid, plant: true, who: 'straw', noLegs: !legs, noShadow: !legs, noReflect: true,
    arms: { l: lt < 18.7 ? 'hold' : 'rest', r: 'rest' }, hold: lt < 18.7 ? { l: 'fp19s_medcup' } : {}, cupScale: 1.5, grip: { l: [-104, -14] },
    gaitW: walking2 ? walk * 1500 : undefined, axis: walking2 ? 'z' : undefined, dir: walking2 ? -1 : undefined, vx: 0, squash: lt > TC.chairsit && lt < TC.chairsit + .3 ? .05 * Math.sin((lt - TC.chairsit) / .3 * PI) : 0 });
  /* the closed eyes of the sit beat: the engine's lid at 1 only fills the eye with skin (a blank disc); the Episode 13 kit's fp13_shut wipes it and draws a relaxed U with lashes */
  const shutK = lt < 17.95 ? ss(lid, .82, .98) : 1 - ss(lt, 18.0, 18.3);
  if (shutK > .01) { C.straw.shut = shutK; C.straw.shutStyle = 'sleep'; C.straw.acc = (C.straw.acc || []).concat(['fp13_shut']); }
  C.sp = sp; C.sk = sk;
  return C;
}
/* one resident with the chair, the blanket, the tray, the pie and the cider: back, the sitter, the front */
function drawRes(n, lt, R, o = {}) {
  const S = R.S, k = KINDS[R.o.kind], rx = k.rx, ry = k.ry, s = R.s, x = R.p[0], y = R.p[1];
  if (o.bg) REG.suppress++;
  chairBack(S.kind, x, y, s, S.col, ry, rx, R.fl);
  drawChar(R.o);
  lapBlanket(x, y, s, rx, BLANKET[n][0], BLANKET[n][1]);
  lapTray(x, y + 6 * s, s, rx);
  dinner(x, y + 6 * s, s, lt, { pear: 1, banana: 4, cran: 7, goji: 10 }[n], { cup: n !== 'goji' });
  chairFront(S.kind, x, y, s, S.col, ry, rx, R.fl);
  if (o.bg) REG.suppress--;
}
function drawStraw(lt, C, part) {
  const sp = C.sp, sk = C.sk, f = pj(sp[0], 0, sp[1]), k = f[2], s = k * SSR, col = '#6a5a8a', ry = KINDS.straw.ry, rx = KINDS.straw.rx;
  const cp = chairPos(lt), cf = pj(cp[0], SEAT_Y, cp[1]), cfl = pj(cp[0], 0, cp[1])[1], cs = cf[2] * SSR;
  if (part === 'chairBack') chairBack('arm', cf[0], cf[1], cs, col, ry, rx, cfl);
  else if (part === 'chairFront') chairFront('arm', cf[0], cf[1], cs, col, ry, rx, cfl);
}
// ------------------------------------------------------------------ the Moon in the window
const MOON_IN = 19.0;
function moonInWindow(lt) {
  const a = ss(lt, MOON_IN, MOON_IN + .9); if (a < .02) return;
  const cx = (WIN.x0 + WIN.x1) / 2, cy = (WIN.y0 + WIN.y1) / 2, rise = 1 - eo(sg(lt, MOON_IN, MOON_IN + 1.3)), p = pj(cx, cy - 120 * rise, RB - 3), s = p[2] * .86;
  if (A7.moon) A7.moon(p[0], p[1], s, { alpha: a, halo: true, t: lt, warm: .25, suppress: false });
}
// ------------------------------------------------------------------ shots and cameras
const TSH = [
  { id: 'open', s: 0, e: 1.30, k: 'wide', z: 1.1, dz: .1, ty: 1010 },
  { id: 'pe1', s: 1.30, e: 3.11, k: 'cu', foc: 'pear', z: 2.5, dz: .3, up: 120, dx: -250 },
  { id: 'ba1', s: 3.11, e: 4.52, k: 'cu', foc: 'banana', z: 2.6, dz: .3, up: 120, dx: -230 },
  { id: 'cr1', s: 4.52, e: 6.47, k: 'cu', foc: 'cran', z: 2.7, dz: .35, up: 120, dx: -230 },
  { id: 'go1', s: 6.47, e: 9.17, k: 'cu', foc: 'goji', z: 3.4, dz: .6, up: 110, dx: 0 },
  { id: 'l1', s: 9.17, e: 10.71, k: 'cu', foc: 'lemon', z: 3.3, dz: .3, up: 120, dx: -60 },
  { id: 'r1', s: 10.71, e: 12.03, k: 'wide', z: 1.25, dz: .1, ty: 1010 },
  { id: 's0', dc: 1, s: 12.03, e: 13.25, k: 'cu', foc: 'straw', z: 2.0, dz: .15, up: 150 },
  { id: 'r2', s: 13.25, e: 14.17, k: 'wide', z: 1.15, dz: .1, ty: 1010 },
  { id: 'lk', dc: 1, s: 14.17, e: 16.02, k: 'cu', foc: 'straw', z: 2.1, dz: .2, up: 150 },
  { id: 'sit', dc: 1, s: 16.02, e: 17.67, k: 'cu', foc: 'straw', z: 2.3, dz: .6, up: 150 },
  { id: 'lamp', dc: 1, s: 17.67, e: 17.98, k: 'lamp' },
  { id: 'eyes', dc: 1, s: 17.98, e: 18.62, k: 'cu', foc: 'straw', z: 3.0, dz: .15, up: 150 },
  { id: 'ok', dc: 1, s: 18.62, e: 19.48, k: 'cu', foc: 'straw', z: 2.0, dz: -.2, up: 150 },
  { id: 'mo1a', s: 19.48, e: 20.74, k: 'moon' },
  { id: 'mo1b', s: 20.74, e: 22.21, k: 'wide', z: 1.15, dz: .05, ty: 1010 },
  { id: 'end', s: 22.21, e: 99, k: 'wide', z: 1.0, dz: .1, ty: 1000 },
];
for (const sh of TSH) sh.s = sh.s === 0 ? 0 : TT.snapT(sh.s);
const tShot = lt => { let r = TSH[0]; for (const sh of TSH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const faceZ = (o, z, up = 90) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };
let FRT = null;
function camT(lt) {
  const sh = tShot(lt), u = sg(lt, sh.s, Math.min(sh.e, sh.s + 3));
  if (sh.dc) Object.assign(CAMP, DCAM, { cx: DCAM.cx + 10 * Math.sin(lt * .5) + 24 * u, cz: DCAM.cz + 30 * u }); else Object.assign(CAMP, TCAM, { cz: TCAM.cz + 70 * sg(lt, 0, 24), cx: 6 * Math.sin(lt * .5) });
  setPJ(CAMP);
  const C = castT(lt); FRT = { C, sh };
  const sway = { x: 2 * hnoise(lt, 1.3, 4), y: 1.4 * hnoise(lt, 1.1, 5), r: .001 * hnoise(lt, .9, 6) };
  switch (sh.k) {
    case 'wide': zoomTo(540, sh.ty ?? 1010, sh.z + sh.dz * u); break;
    case 'cu': { const o = sh.foc === 'straw' ? C.straw : sh.foc === 'lemon' ? C.lemon : C.res[sh.foc].o; faceZ(o, sh.z + sh.dz * u, sh.up); CAM.x -= (sh.dx || 0) / CAM.z; break; }
    case 'lamp': { const cx = (DOOR.x0 + DOOR.x1) / 2, p = pj(cx, 395, COR.z1 - 4); zoomTo(p[0], p[1] + 12, 4.6 + .3 * u); break; }
    case 'moon': { const cx = (WIN.x0 + WIN.x1) / 2, p = pj(cx, (WIN.y0 + WIN.y1) / 2 + 10, RB); zoomTo(p[0], p[1], 4.0 + .45 * u); break; }
    default: zoomTo(540, 1060, 1.2);
  }
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
}
function lightT(lt) {
  const warm = 1 + .16 * ss(lt, 16.1, 17.6) - .16 * ss(lt, 17.9, 18.6);
  V2.setLight({ key: [-.5, -.45], keyColor: '#ffd9a0', keyA: .26 * warm, rim: '#9fc4ff', rimA: .36, shadow: '#14102a', shadowA: .4, bounce: '#ffb870', bounceA: .18 * warm, amb: '#6a5a90', ambA: .1, frontDark: .06 });
  V2.opts.reflect = false;
}
const dim = (a, rgb = '66,58,108') => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(${rgb},${a})`; ctx.fillRect(-3000, -3000, 8000, 8000); ctx.restore(); };
function roomT(lt, soft) {
  drawRoomFloor(lt); drawRoomWalls(lt); drawCorridor(lt);
  drawWindow(lt, { moon: () => moonInWindow(lt) });
  drawWallArt(lt);
  dim(.5);
  drawStringLights(lt);
  floorLamp(-700, 1380, lt, 1); floorLamp(520, 1560, lt, 2); floorLamp(-250, 1800, lt, 3);
  /* the glow of the room's lamps on the floor round the circle */
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [X, Z, r, a] of [[-700, 1380, 420, .2], [520, 1560, 380, .16], [-80, 1180, 700, .1]]) { const p = pj(X, 0, Z), k = p[2]; ctx.fillStyle = V2.radial(p[0], p[1], 10, r * k, [[0, `rgba(255,190,110,${a})`], [1, 'rgba(255,190,110,0)']]); ctx.beginPath(); ctx.ellipse(p[0], p[1], r * k, r * k * .32, 0, 0, 2 * PI); ctx.fill(); }
  ctx.restore();
}
function drawT(lt) {
  const { C, sh } = FRT, kd = sh.k;
  lightT(lt);
  if (kd === 'lamp') {
    roomT(lt); const cx = (DOOR.x0 + DOOR.x1) / 2, p = pj(cx, 395, COR.z1 - 4);
    if (lt >= TC.callchime) { const a = c01((lt - TC.callchime) / .08), fl = .85 + .15 * Math.sin((lt - TC.callchime) * 9); glow(p[0], p[1] - 10, 150 * p[2] * 4.6, '255,60,50', .6 * a * fl, .5); glow(p[0], p[1] - 10, 44 * p[2] * 4.6, '255,210,200', .8 * a, .9); }
    return;
  }
  if (kd === 'moon') { roomT(lt); moonShaft(lt); return; }
  const near = o => { const f = inFrame(o, 50); return f.whole && faceOK(o); };
  const items = [], bg = [];
  const focus = sh.foc, cu = kd === 'cu', fz = focus === 'straw' ? C.sp[1] : focus === 'lemon' ? POS.lemon[1] : focus ? SEAT[focus].Z : 0;
  const put = (z, fn, o, name) => { if (!cu) { items.push({ z, fn }); return; } if (name === focus || (o && near(o) && Math.abs(z - fz) < 450)) items.push({ z, fn }); else if (z > fz + 450) bg.push({ z, fn }); };
  ['pear', 'banana', 'cran', 'goji'].forEach(n => put(SEAT[n].Z, () => drawRes(n, lt, C.res[n]), C.res[n].o, n));
  put(POS.lemon[1], () => drawChar(C.lemon), C.lemon, 'lemon');
  const cp = chairPos(lt), sitting = C.sk > .001 && lt < UP_T + .45, strZ = sitting ? cp[1] : C.sp[1];
  if (!sh.dc) put(chairPos(lt)[1] - 13, () => drawChar(C.mango), C.mango, 'mango');
  put(cp[1] + .5, () => drawStraw(lt, C, 'chairBack'), C.straw, focus === 'straw' ? 'straw' : 'x');
  put(strZ, () => drawChar(C.straw), C.straw, 'straw');
  put(cp[1] - .5, () => drawStraw(lt, C, 'chairFront'), C.straw, focus === 'straw' ? 'straw' : 'x');
  const cartP = lt < 19.2 ? CART : [C.sp[0] + 20, C.sp[1] + 110];
  put(cartP[1], () => medCart(cartP[0], cartP[1], lt), null, 'cart');
  put(1868, () => sideTable(445, 1868, lt), null, sh.dc ? focus : 'table');
  items.sort((a, b) => b.z - a.z); bg.sort((a, b) => b.z - a.z);
  if (cu) V2.dof(8, () => { roomT(lt); REG.suppress++; for (const it of bg) it.fn(); REG.suppress--; }); else roomT(lt);
  for (const it of items) it.fn();
  moonShaft(lt);
  /* warm light on everyone, the room breathing a little warmer through the sit */
  const wa = .1 + .07 * ss(lt, 16.1, 17.6) - .06 * ss(lt, 17.9, 18.6);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, 1000, 80, 1100, [[0, `rgba(255,186,110,${wa})`], [1, 'rgba(255,186,110,0)']]); ctx.fillRect(-2000, -2000, 5000, 5000); ctx.restore();
}
/* the moonlight: a cool shaft from the window across the room, growing from 19.5 */
function moonShaft(lt) {
  const a = ss(lt, 19.4, 20.9) * .24; if (a < .01) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  poly3([[WIN.x0, WIN.y0, RB], [WIN.x1, WIN.y0, RB], [WIN.x1 + 700, 0, RB - 1100], [WIN.x0 + 620, 0, RB - 1100]], `rgba(160,190,255,${a})`);
  poly3([[WIN.x0 + 40, 0, RB - 20], [WIN.x1 - 40, 0, RB - 20], [WIN.x1 + 760, 0, RB - 1500], [WIN.x0 + 560, 0, RB - 1500]], `rgba(150,180,255,${a * .8})`);
  ctx.restore();
  const w = pj((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, RB); glow(w[0], w[1], 520 * w[2], '170,200,255', a * 1.6, .1);
}
const THANKS = {
  shot: lt => tShot(lt).id,
  cam: camT,
  draw: drawT,
  fx: lt => ({ bloom: .55 + .5 * Math.max(0, 1 - Math.abs(lt - TC.sting - .05) / .25), vignette: .42, grain: .045, contrast: .08, sat: .08, tint: [['255,170,110', .05, 'screen']], fade: lt < .25 ? 1 - lt / .25 : lt > 23.6 ? ss(lt, 23.6, 24.1) : 0, fadeColor: '20,12,10' }),
  blur: lt => 1,
  over() {},
  clock: () => TT.SCN.clock, label: () => TT.SCN.label,
};
window.__EP19_SCENES = window.__EP19_SCENES || {}; window.__EP19_SCENES.thanks = THANKS;
})();
