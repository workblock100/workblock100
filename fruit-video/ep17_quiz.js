'use strict';
/* SHIFT HAPPENS, Episode 17: "The Module". Scene module: quiz (10:59 PM, THE QUIZ, 22.75 s). Builder E1617-COUNT. Registers window.__EP17_SCENES.quiz.
 *
 * The activity room at night, two cameras (the device of ep15_announce.js / ep16_count.js: ROOM coordinates xr right / y up / zr toward the TV wall mapped through the shot's direction):
 *   'f' = from behind the group looking at the TV wall (the LearnWell quiz on the rolling TV, the wall clock above it at 10:59, the printer stand, the punch clock by the door),
 *   'r' = from the TV end looking back (faces: Mango, Lemon, Onion, Tomato, Strawberry standing around the TV, the rear wall).
 * The TV (a 1280 x 720 window, UI kit text): page 0 START QUIZ, page 1 the question and four options (A, B, C spin, D ticks), page 2 the result ring (100 percent) and confetti, then the break
 * tracker (BREAK: PENDING) and the loop diagram; Binder (A15.binder) and Strawberry's webcam tile live in the page. A printer on a stand beside the TV prints the certificate (VALID UNTIL 11:00 PM, a timer).
 * Shots (scene-local seconds): w0 0 wide f, click .4 | b1 .9 TV question | m1 2.9 Mango | b2 4.41 TV options read | s1 7.39 TV, D then SUBMIT | cert 7.97 printer, ring, confetti | c1 9.66 certificate timer
 *  | o1 11.3 Onion (sniffle) | l1 11.97 Lemon | t1 13.21 Tomato | s2 14.7 Strawberry | pc 15.46 punch clock | o2 16.6 Onion | trk 17.67 break tracker | loop 18.83 loop diagram | pc2 20.2 punch clock, beep red
 *  | clk 20.7 push-in on the wall clock (10:59, second hand ticking, spinner, BREAK PENDING).
 * Cues: click .4 (START QUIZ pressed), click 7.541 (D pressed; SUBMIT a beat later), textding 8.068 (ring 100, confetti, the certificate printed), sniffle 11.362 (Onion), error 20.402 (punch clock flashes red),
 *  pending 20.702 (the spinner ring over the wall clock, the label flips), sting 21.202 (flash, a glint). */
(() => {
if (!window.TIMELINE_EP17 || !window.H6 || !window.S6 || !window.V2 || !window.A15) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, SH15 = window.SH15, S6 = window.S6, PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP17, SCN = TLX.scenes.find(s => s.id === 'quiz'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'quiz') LN[l.id] = l;
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

// ------------------------------------------------------------------ the room: ROOM coordinates (xr right when facing the TV, y up, zr toward the TV wall) mapped through the shot's direction
const RM = { hw: 900, ch: 1000, zTV: 1500, zRear: -1100, rail: 150 };
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

/* @@NEXT@@ */
})();
