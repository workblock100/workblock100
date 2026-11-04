'use strict';
/* SHIFT HAPPENS, Episode 18: "The Fire Drill". Builder E18-STATION.
 * Scenes `notice` (7:40 PM, THE NOTICE, 31.9 s) and `clear` (8:25 PM, ALL CLEAR, 31.2 s) at the nurses' station, and the three props that go into window.P18.
 *
 * ================================================================== PROPS (added to window.P18; pure functions of their fields; all text through the UI kit; `ctx` is the current context)
 *   Convention: P18.name(ctx, o), o.x / o.y = anchor, o.s = scale (1 = natural size at zoom 1), o.rot = tilt in radians. Text is hero when it comes out at 31 px or more on the screen (the
 *   prop reads the transform in force), set dressing below that; o.hero (true | false) overrides it for all the prop's text.
 *
 *   P18.drillLog(ctx, o)       a clipboard with the printed form FIRE DRILL LOG (DATE MONDAY, TIME 7:00 PM, FIRE NONE, EVACUATION TIME 0 MIN, SIGNED + a scrawl). Anchor: the centre of the board.
 *                              Natural size 520 x 724. o.stamp 0..1 drops a red PASS stamp onto the empty band at the bottom (it lands at 1: scale 1.25 to 1, ink fades in),
 *                              o.stampAge = seconds since it landed (the board dips and settles, an ink ring spreads). o.fill 0..1 shows the values only partly (default 1).
 *   P18.evacMap(ctx, o)        a printed evacuation map, anchor = the centre of the sheet, natural size 520 x 700: header EVACUATION MAP, a six-floor stack of the tower with the Executive
 *                              Suite (a small crown-topped box) on the roof, a stairwell, a dashed EXIT ROUTE from the YOU ARE HERE pin up the stairwell to the roof, a NEAREST EXIT note, a legend.
 *                              o.reveal 0..1 prints it from the top in 14-px lines (the sheet exists only down to the print head, text appears when its line is printed; the caller moves the sheet
 *                              out of the printer), o.t = seconds (the printer's shudder, marching ants on the route), o.flame 0..1 = a tiny flame icon rising along the route (0 = none),
 *                              o.march (default 1) animates the dashes.
 *   P18.smokeDetector(ctx, o)  a round white ceiling detector seen from below: vent slots, a raised cap with a TEST button and a small LED. Anchor: the centre; natural radius 90.
 *                              o.led 0..1 = the LED (0 off, 1 full red + glow, through FX18.glow when it exists), o.sq = squash of the disc for a ceiling seen at an angle (default 1),
 *                              o.dim 0..1 darkens it (a shadowed ceiling), o.shadow (default 1) the soft contact shadow on the ceiling.
 *   P18.drillClip: registered as a HELD prop for characters, `hold: { l: 'fp18_drillclip' }` (the same clipboard in a hand: o.clipScale, o.clipAt [.5, .5], o.clipRot, o.clipStamp, o.clipAge).
 *
 * ================================================================== SCENES: shot lists are at the top of each scene's section below.
 */
(() => {
if (!window.TIMELINE_EP18) return;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
window.P18 = window.P18 || {};
const P18 = window.P18;
/* the scale at which things are drawn on the screen right now (camera zoom x parent scales): text is hero when it is at least 31 px on the screen */
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
const heroFor = (o, scr) => size => o.hero !== undefined ? !!o.hero : size * scr >= 31;
const glowAt = (c, x, y, r, rgb, a, core) => {   /* FX18.glow when the kit has landed, else the engine's glow */
  if (a <= 0.003) return;
  if (window.FX18 && typeof FX18.glow === 'function') FX18.glow(c, { x, y, r, color: 'rgb(' + rgb + ')', alpha: a, core: core ?? .6 });
  else V2.glow(x, y, r, rgb, a, 'screen', .35);
};

// ------------------------------------------------------------------ P18.drillLog: a clipboard with the FIRE DRILL LOG form
const DL = { w: 520, h: 724, px0: -224, px1: 224, py0: -306, py1: 338 };       /* o.content(c, H, cap) draws on the paper instead of the form (the policy page of the flow gag) */       /* the board, the paper's rectangle (board-local; the origin is the board's centre) */
const DL_ROWS = [['DATE', 'MONDAY'], ['TIME', '7:00 PM'], ['FIRE', 'NONE'], ['EVACUATION TIME', '0 MIN'], ['SIGNED', null]];
function scrawl(c, x0, y, w, k) {   /* a signature: a loop, a run of spikes and a flourish, in blue ink; k 0..1 draws it on */
  const pts = [[0, 10], [.05, -14], [.1, 14], [.16, -16], [.21, 10], [.27, -8], [.33, 12], [.4, -14], [.46, 8], [.55, -6], [.62, 10], [.7, -10], [.78, 4], [.88, -4], [1, 2]];
  c.save(); c.strokeStyle = '#23408e'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); const n = pts.length;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1); if (u > k + .0001) break;
    const px = x0 + pts[i][0] * w, py = y + pts[i][1];
    if (i === 0) c.moveTo(px, py); else { const q = pts[i - 1], mx = x0 + (q[0] + pts[i][0]) / 2 * w, my = y + (q[1] + pts[i][1]) / 2 + (i % 2 ? -5 : 5); c.quadraticCurveTo(mx, my, px, py); }
  }
  c.stroke();
  if (k >= 1) { c.lineWidth = 2.6; c.beginPath(); c.moveTo(x0 + w * .04, y + 24); c.quadraticCurveTo(x0 + w * .5, y + 33, x0 + w * 1.02, y + 20); c.stroke(); }
  c.restore();
}
function drillLogDraw(c, o) {
  const st = c01(o.stamp ?? 0), age = o.stampAge ?? 0, fill = o.fill ?? 1, t = o.t ?? 0;
  const scr = scrOf(c), H = heroFor(o, scr);
  const dip = age > 0 ? Math.sin(age * 42) * Math.exp(-age * 15) * 6 : 0;
  c.save(); c.translate(0, dip); c.lineJoin = 'round'; c.lineCap = 'round';
  /* the board: hardboard, a steel clip with a dark slot, a soft shadow */
  c.save(); c.shadowColor = 'rgba(0,0,0,.34)'; c.shadowBlur = 22; c.shadowOffsetY = 10;
  c.fillStyle = V2.grad(-DL.w / 2, -DL.h / 2, DL.w / 2, DL.h / 2, [[0, '#c4925a'], [1, '#93673a']]); rr(-DL.w / 2, -DL.h / 2, DL.w, DL.h, 24); c.fill(); c.restore();
  c.strokeStyle = 'rgba(30,16,8,.85)'; c.lineWidth = 4; rr(-DL.w / 2, -DL.h / 2, DL.w, DL.h, 24); c.stroke();
  c.strokeStyle = 'rgba(255,230,190,.28)'; c.lineWidth = 3; rr(-DL.w / 2 + 8, -DL.h / 2 + 8, DL.w - 16, DL.h - 16, 18); c.stroke();
  /* the paper */
  c.save(); c.shadowColor = 'rgba(40,24,10,.28)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
  c.fillStyle = '#f8f5ea'; c.fillRect(DL.px0, DL.py0, DL.px1 - DL.px0, DL.py1 - DL.py0); c.restore();
  c.strokeStyle = 'rgba(70,60,40,.5)'; c.lineWidth = 2; c.strokeRect(DL.px0, DL.py0, DL.px1 - DL.px0, DL.py1 - DL.py0);
  c.fillStyle = '#b3261e'; c.fillRect(DL.px0, DL.py0, DL.px1 - DL.px0, 10);                                   /* the red top bar of the form */
  UI.container('drillpaper', 'page', [DL.px0, DL.py0, DL.px1, DL.py1], 6);
  const cap = { cid: 'drillpaper' };
  if (typeof o.content === 'function') o.content(c, H, cap);
  else {
  UI.label('FIRE DRILL LOG', 0, -246, Object.assign({ size: 58, font: 'Bangers', weight: 400, fill: '#b3261e', spacing: 2, maxW: 400, hero: H(58) }, cap));
  UI.label('FRUIT SALAD REHAB & NURSING', 0, -200, Object.assign({ size: 19, weight: 900, fill: '#6b6458', spacing: 1.4, maxW: 400, hero: false }, cap));
  c.strokeStyle = '#b3261e'; c.lineWidth = 3; c.beginPath(); c.moveTo(DL.px0 + 20, -176); c.lineTo(DL.px1 - 20, -176); c.stroke();
  DL_ROWS.forEach(([lab, val], i) => {
    const cy = -126 + i * 70, fk = c01(fill * DL_ROWS.length - i);
    UI.label(lab, -202, cy, Object.assign({ size: 21, weight: 900, fill: '#6b6458', spacing: 1, align: 'left', maxW: 214, hero: H(21) }, cap));
    if (val != null) { if (fk > 0) UI.label(val, 28, cy, Object.assign({ size: 40, weight: 800, italic: true, fill: '#23408e', align: 'left', maxW: 180, alpha: fk, hero: H(40) }, cap)); }
    else scrawl(c, 28, cy - 4, 170, fk);
    c.strokeStyle = 'rgba(80,70,50,.32)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(DL.px0 + 18, cy + 35); c.lineTo(DL.px1 - 18, cy + 35); c.stroke();
  });
  }
  /* the PASS stamp, in the empty band under the last row */
  if (st > 0 && typeof o.content !== 'function') {
    const k = eo(sg(st, 0, 1)), sc = lerp(1.25, 1, k), cx = 10, cy = 266;
    c.save(); c.globalAlpha *= c01(st * 3); c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);
    UI.stamp('PASS', cx, cy, { size: 84, color: '#d6203a', rot: -.14, alpha: .94, hero: st >= 1 && H(84) });
    c.restore();
    if (age > 0 && age < .45) V2.ring(cx, cy, age / .45, { r0: 60, r1: 230, color: '214,32,58', lw: 6, alpha: .5, bloom: 0 });
  }
  /* the steel clip last, so it lies over the top edge of the paper */
  c.fillStyle = V2.grad(0, -DL.h / 2 - 8, 0, -DL.h / 2 + 62, [[0, '#eef2f8'], [1, '#98a2b0']]); c.strokeStyle = 'rgba(30,36,50,.9)'; c.lineWidth = 3.4;
  rr(-96, -DL.h / 2 - 12, 192, 68, 14); c.fill(); c.stroke();
  c.fillStyle = '#4a5260'; rr(-60, -DL.h / 2 + 8, 120, 14, 7); c.fill();
  c.restore();
}
P18.drillLog = (ctx, o = {}) => {
  ctx.save(); ctx.translate(o.x ?? 0, o.y ?? 0); if (o.rot) ctx.rotate(o.rot); ctx.scale(o.s ?? 1, o.s ?? 1);
  drillLogDraw(ctx, o);
  ctx.restore();
};
/* the same clipboard in a hand (small): hold: { l: 'fp18_drillclip' }, grip the board's upper-left; its text is set dressing at this size */
EXT.prop.fp18_drillclip = (side, o, t) => {
  const S = o.clipScale || .15, at = o.clipAt || [.5, .5];
  ctx.save(); ctx.rotate(o.clipRot || 0); ctx.translate(-DL.w * S * (at[0] - .5), -DL.h * S * (at[1] - .5)); ctx.scale(S, S);
  drillLogDraw(ctx, { hero: false, stamp: o.clipStamp, stampAge: o.clipAge, t, fill: o.clipFill });
  ctx.restore();
};
PROP_BOX.fp18_drillclip = o => { const S = o.clipScale || .15, at = o.clipAt || [.5, .5], w = DL.w * S, h = DL.h * S; return Object.assign([-w * at[0], -h * at[1], w * (1 - at[0]), h * (1 - at[1])], { nearFace: true }); };

// ------------------------------------------------------------------ P18.evacMap: the printed evacuation map (sheet-local coordinates, origin = the middle of the sheet)
const EM = { w: 520, h: 700 };
const EM_T = { x0: -110, x1: 110, yb: 150, fh: 46, n: 6 };                         /* the tower: left, right, floor line of floor 1, floor height, floors */
const EM_ROUTE = [[-83, 56], [134, 56], [134, -146], [102, -146]];                 /* the dashed exit route: the pin, along floor 3, up the stairwell, into the Executive Suite */
const routeLen = (() => { const L = [0]; for (let i = 1; i < EM_ROUTE.length; i++) L.push(L[i - 1] + Math.hypot(EM_ROUTE[i][0] - EM_ROUTE[i - 1][0], EM_ROUTE[i][1] - EM_ROUTE[i - 1][1])); return L; })();
function routeAt(u) {   /* the point at u (0..1) of the way along the route */
  const d = c01(u) * routeLen[routeLen.length - 1];
  for (let i = 1; i < routeLen.length; i++) if (d <= routeLen[i]) { const k = (d - routeLen[i - 1]) / (routeLen[i] - routeLen[i - 1]); return [lerp(EM_ROUTE[i - 1][0], EM_ROUTE[i][0], k), lerp(EM_ROUTE[i - 1][1], EM_ROUTE[i][1], k)]; }
  return EM_ROUTE[EM_ROUTE.length - 1];
}
function flameIcon(c, x, y, r, t, a = 1) {   /* a small cartoon flame: a teardrop with an inner tongue; the tip sways */
  const sw = Math.sin(t * 15) * r * .12;
  c.save(); c.globalAlpha *= a; c.lineJoin = 'round';
  c.fillStyle = '#ff6a1a'; c.strokeStyle = '#8a2a06'; c.lineWidth = Math.max(1.6, r * .14);
  c.beginPath(); c.moveTo(x + sw, y - r * 1.6); c.bezierCurveTo(x + r * .5, y - r * .9, x + r * 1.05, y - r * .1, x + r * .8, y + r * .5); c.bezierCurveTo(x + r * .55, y + r * 1.0, x - r * .55, y + r * 1.0, x - r * .8, y + r * .5);
  c.bezierCurveTo(x - r * 1.05, y - r * .1, x - r * .35, y - r * .5, x - r * .3, y - r * 1.0); c.bezierCurveTo(x - r * .1, y - r * .8, x + sw * .5, y - r * 1.2, x + sw, y - r * 1.6); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#ffd23a'; c.beginPath(); c.moveTo(x - sw * .5, y - r * .5); c.bezierCurveTo(x + r * .4, y - r * .1, x + r * .5, y + r * .4, x, y + r * .7); c.bezierCurveTo(x - r * .5, y + r * .4, x - r * .35, y - r * .1, x - sw * .5, y - r * .5); c.closePath(); c.fill();
  c.restore();
}
function pinIcon(c, x, y, r, col = '#d62a2a') {   /* a map pin whose tip is at (x, y) */
  c.save(); c.fillStyle = col; c.strokeStyle = '#6a0e0e'; c.lineWidth = Math.max(1.6, r * .2); c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - r * .5, y - r * 1.1, x - r * 1.1, y - r * 1.5, x - r * 1.1, y - r * 2.1); c.arc(x, y - r * 2.1, r * 1.1, PI, 0); c.bezierCurveTo(x + r * 1.1, y - r * 1.5, x + r * .5, y - r * 1.1, x, y); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - r * 2.1, r * .42, 0, TAU); c.fill(); c.restore();
}
P18.evacMap = (ctx, o = {}) => {
  const c = ctx, rv = o.reveal ?? 1, t = o.t ?? 0, full = rv >= 1;
  c.save(); c.translate(o.x ?? 0, o.y ?? 0); if (o.rot) c.rotate(o.rot); c.scale(o.s ?? 1, o.s ?? 1);
  const scr = scrOf(c), H = heroFor(o, scr), x0 = -EM.w / 2, y0 = -EM.h / 2, STEP = 14;
  const limit = full ? y0 + EM.h : y0 + Math.floor(rv * EM.h / STEP) * STEP;
  if (limit <= y0 + 2) { c.restore(); return; }
  if (!full) c.translate(Math.sin(t * 95) * .9, 0);                                /* the printer's shudder */
  const T = EM_T, march = (o.march ?? 1) * t * 30;
  const fl = i => { const b = T.yb - i * T.fh; return [b - T.fh + 2, b]; };       /* floor i (0 = floor 1): [top, bottom] */
  c.save(); c.beginPath(); c.rect(x0 - 24, y0 - 24, EM.w + 48, limit - y0 + 24 + (full ? 20 : 0)); c.clip();
  c.lineJoin = 'round'; c.lineCap = 'round';
  /* the paper */
  c.save(); c.shadowColor = 'rgba(20,20,30,.4)'; c.shadowBlur = 14; c.shadowOffsetY = 4; c.fillStyle = '#faf8ef'; rr(x0, y0, EM.w, EM.h, 7); c.fill(); c.restore();
  c.strokeStyle = 'rgba(60,56,48,.55)'; c.lineWidth = 2.4; rr(x0, y0, EM.w, EM.h, 7); c.stroke();
  /* header band */
  c.fillStyle = '#1c5a3c'; rr(x0, y0, EM.w, 76, 7); c.fill(); c.fillRect(x0, y0 + 40, EM.w, 36);
  c.fillStyle = '#1faa59'; c.fillRect(x0, y0 + 76, EM.w, 5);
  /* the tower: six floors of four rooms, a stairwell to the right, the roof, the Executive Suite with a crown */
  for (let i = 0; i < T.n; i++) {
    const [fy0, fy1] = fl(i), here = i === 2;
    c.fillStyle = here ? '#ffecb8' : (i % 2 ? '#e3ece6' : '#eef3ef'); c.fillRect(T.x0, fy0, T.x1 - T.x0, fy1 - fy0);
    c.strokeStyle = '#27402f'; c.lineWidth = 2.2; c.strokeRect(T.x0, fy0, T.x1 - T.x0, fy1 - fy0);
    for (let k = 0; k < 4; k++) {
      if (k) { c.beginPath(); c.moveTo(T.x0 + k * 55, fy0); c.lineTo(T.x0 + k * 55, fy1); c.stroke(); }
      c.fillStyle = '#a9cbe6'; c.fillRect(T.x0 + k * 55 + 30, fy0 + 9, 16, 11); c.strokeStyle = 'rgba(39,64,47,.7)'; c.lineWidth = 1.4; c.strokeRect(T.x0 + k * 55 + 30, fy0 + 9, 16, 11);
    }
  }
  c.fillStyle = '#d3dbd8'; c.fillRect(118, -168, 32, T.yb + 168); c.strokeStyle = '#27402f'; c.lineWidth = 2.2; c.strokeRect(118, -168, 32, T.yb + 168);   /* the stairwell */
  c.strokeStyle = 'rgba(70,86,78,.8)'; c.lineWidth = 2;
  for (let i = 0; i < T.n + 1; i++) { const b = T.yb - i * T.fh; c.beginPath(); c.moveTo(121, b - 2); c.lineTo(147, b - T.fh / 2); c.lineTo(121, b - T.fh + 2); c.stroke(); }
  c.strokeStyle = '#27402f'; c.lineWidth = 4; c.beginPath(); c.moveTo(T.x0 - 14, T.yb + 2); c.lineTo(164, T.yb + 2); c.stroke();                                    /* the ground */
  c.fillStyle = '#f4d878'; c.strokeStyle = '#27402f'; c.lineWidth = 2.4; c.fillRect(24, -168, 76, 44); c.strokeRect(24, -168, 76, 44);                              /* the Executive Suite */
  c.fillStyle = '#c99a2c'; c.fillRect(54, -150, 16, 26); c.strokeRect(54, -150, 16, 26);
  c.fillStyle = '#f0b92a'; c.strokeStyle = '#6a4a08'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(38, -168); c.lineTo(38, -186); c.lineTo(50, -176); c.lineTo(62, -192); c.lineTo(74, -176); c.lineTo(86, -186); c.lineTo(86, -168); c.closePath(); c.fill(); c.stroke();
  for (const [cx2, cy2] of [[38, -188], [62, -194], [86, -188]]) { c.fillStyle = '#d6203a'; c.beginPath(); c.arc(cx2, cy2, 3, 0, TAU); c.fill(); }
  c.fillStyle = '#1faa59'; c.fillRect(80, -162, 18, 11); c.strokeStyle = '#0e5a2c'; c.lineWidth = 1.2; c.strokeRect(80, -162, 18, 11);                                        /* an EXIT sign on the suite's wall */
  /* the pin of this floor (the station) and its pulse */
  const pr = 12 + 7 * ((t * 1.1) % 1);
  c.strokeStyle = 'rgba(214,42,42,' + (.5 * (1 - ((t * 1.1) % 1))) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(-83, 56, pr, 0, TAU); c.stroke();
  /* the exit route: a dashed line, marching */
  c.save(); c.strokeStyle = '#d62a2a'; c.lineWidth = 6; c.setLineDash([14, 10]); c.lineDashOffset = -march; c.lineCap = 'butt';
  c.beginPath(); EM_ROUTE.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore();
  c.fillStyle = '#d62a2a'; c.beginPath(); c.moveTo(100, -146); c.lineTo(116, -156); c.lineTo(116, -136); c.closePath(); c.fill();
  pinIcon(c, -83, 56, 8.5);
  /* the flame that rises along the route (Fire rises!) */
  const fu = c01(o.flame ?? 0);
  if (fu > 0) { const [fx, fy] = routeAt(ss(fu, 0, 1)); glowAt(c, fx, fy, 36, '255,150,40', .55, .5); flameIcon(c, fx, fy - 6, 13 + 3 * Math.sin(t * 9), t, c01(fu * 8)); }
  c.restore();
  /* the text: a line appears when the print head has passed it (so nothing is ever cut) */
  const ok = (yy, size) => limit >= yy + size * .62;
  const L = (str, x, y, size, o2 = {}) => { if (ok(y, size)) UI.label(str, x, y, Object.assign({ size, weight: 900, hero: H(size) }, o2)); };
  if (limit > y0 + 6) UI.container('evacmap', 'page', [x0, y0, x0 + EM.w, y0 + EM.h], 6);
  L('EVACUATION MAP', 0, -318, 44, { fill: '#fff', spacing: 3, maxW: 440, cid: 'evacmap' });
  L('FRUIT SALAD REHAB & NURSING', 0, -289, 16, { fill: '#bfe6cf', spacing: 1.4, maxW: 420, hero: false, cid: 'evacmap' });
  L('EXECUTIVE SUITE', 62, -216, 17, { fill: '#7a5408', spacing: .6, maxW: 190, hero: false, cid: 'evacmap' });
  for (let i = 0; i < T.n; i++) L(String(i + 1), T.x0 + 12, fl(i)[0] + 14, 13, { fill: '#4a5a50', hero: false, cid: 'evacmap' });
  L('ROOF', -126, -124, 14, { fill: '#4a5a50', hero: false, align: 'right', cid: 'evacmap' });
  L('STAIRS', 200, 30, 14, { fill: '#4a5a50', hero: false, cid: 'evacmap' });
  L('LOBBY: BELOW THE SHEET', 0, 168, 13, { fill: '#6b6458', hero: false, spacing: .8, maxW: 300, cid: 'evacmap' });
  if (ok(66, 0)) UI.sign([-246, 22, 100, 50], ['YOU ARE', 'HERE'], { fill: '#d62a2a', ink: '#fff', size: 16, weight: 900, r: 8, pad: 5, id: 'evacpin', hero: H(16) });
  if (limit >= 52) { c.strokeStyle = '#d62a2a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-146, 48); c.lineTo(-96, 54); c.stroke(); }
  if (ok(278, 0)) {
    UI.panel([-226, 186, 452, 98], { r: 10, fill: '#fff1ee', stroke: '#d62a2a', lw: 4, id: 'evacnote', pad: 6, shadow: 0 });
    UI.label('NEAREST EXIT', 0, 208, { size: 20, weight: 900, fill: '#6b6458', spacing: 3, maxW: 400, hero: H(20), cid: 'evacnote' });
    UI.label('EXECUTIVE SUITE', 0, 250, { size: 40, weight: 900, fill: '#b3261e', maxW: 420, hero: H(40), cid: 'evacnote' });
  }
  if (limit >= 330) {
    c.save(); c.strokeStyle = '#d62a2a'; c.lineWidth = 5; c.setLineDash([10, 7]); c.lineCap = 'butt'; c.beginPath(); c.moveTo(-226, 308); c.lineTo(-184, 308); c.stroke(); c.restore();
    L('EXIT ROUTE', -176, 308, 15, { fill: '#3a362e', align: 'left', hero: false, cid: 'evacmap' });
    c.save(); pinIcon(c, -24, 316, 6); c.restore();
    L('YOU ARE HERE', -8, 308, 15, { fill: '#3a362e', align: 'left', hero: false, cid: 'evacmap' });
    L('IN CASE OF FIRE USE THE STAIRS', 0, 334, 14, { fill: '#6b6458', spacing: .8, maxW: 440, hero: false, cid: 'evacmap' });
  }
  /* the print head: a dark last line and a soft shade above it while the sheet is still coming out */
  if (!full) { c.save(); c.beginPath(); c.rect(x0 - 24, y0 - 24, EM.w + 48, limit - y0 + 24); c.clip(); c.fillStyle = V2.grad(0, limit - 22, 0, limit, [[0, 'rgba(30,30,40,0)'], [1, 'rgba(30,30,40,.22)']]); c.fillRect(x0, limit - 22, EM.w, 22); c.fillStyle = 'rgba(30,30,40,.55)'; c.fillRect(x0, limit - 2.5, EM.w, 2.5); c.restore(); }
  c.restore();
};

// ------------------------------------------------------------------ P18.smokeDetector: a round white detector seen from below
P18.smokeDetector = (ctx, o = {}) => {
  const c = ctx, s = o.s ?? 1, sq = o.sq ?? 1, led = c01(o.led ?? 0), dim = c01(o.dim ?? 0), R = 90;
  c.save(); c.translate(o.x ?? 0, o.y ?? 0); if (o.rot) c.rotate(o.rot); c.scale(s, s);
  const ledA = -.95, lx = Math.cos(ledA) * R * .8, ly = Math.sin(ledA) * R * .8 * sq;
  c.save(); c.scale(1, sq); c.lineCap = 'round';
  if (o.shadow !== 0) { c.fillStyle = V2.radial(0, 0, R * .92, R * 1.55, [[0, 'rgba(30,24,40,.32)'], [1, 'rgba(30,24,40,0)']]); c.beginPath(); c.arc(0, 0, R * 1.55, 0, TAU); c.fill(); }
  c.fillStyle = V2.radial(-R * .35, -R * .4, R * .1, R * 1.15, [[0, '#ffffff'], [.6, '#eceeee'], [1, '#c4c9cd']]); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(40,34,50,.58)'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = 'rgba(70,72,84,.3)'; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, R * .86, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, R * .66, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(32,36,46,.66)'; c.lineWidth = 7;
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * R * .42, Math.sin(a) * R * .42); c.lineTo(Math.cos(a) * R * .6, Math.sin(a) * R * .6); c.stroke(); }
  c.lineWidth = 5;
  for (let i = 0; i < 20; i++) { const a = (i + .5) / 20 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * R * .69, Math.sin(a) * R * .69); c.lineTo(Math.cos(a) * R * .82, Math.sin(a) * R * .82); c.stroke(); }
  c.fillStyle = V2.radial(-R * .08, -R * .1, 2, R * .3, [[0, '#ffffff'], [1, '#d3d7da']]); c.beginPath(); c.arc(0, 0, R * .3, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,34,50,.5)'; c.lineWidth = 2.4; c.stroke();
  c.fillStyle = '#e4e7ea'; c.beginPath(); c.arc(0, 0, R * .19, 0, TAU); c.fill(); c.strokeStyle = 'rgba(60,64,74,.55)'; c.lineWidth = 2.2; c.stroke();
  c.fillStyle = led > .05 ? 'rgb(' + Math.round(150 + 105 * led) + ',' + Math.round(30 + 30 * led) + ',' + Math.round(24 + 24 * led) + ')' : '#5a1a18'; c.strokeStyle = '#3a0a0a'; c.lineWidth = 2;
  c.beginPath(); c.arc(Math.cos(ledA) * R * .8, Math.sin(ledA) * R * .8, R * .075, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(Math.cos(ledA) * R * .8 - 2, Math.sin(ledA) * R * .8 - 2, R * .025, 0, TAU); c.fill();
  if (dim > 0) { c.fillStyle = 'rgba(18,14,34,' + (.55 * dim) + ')'; c.beginPath(); c.arc(0, 0, R + 1, 0, TAU); c.fill(); }
  c.restore();
  UI.label('TEST', 0, 0, { size: 13, weight: 900, fill: '#4a4f58', spacing: .6, maxW: R * .28, hero: false });
  if (led > .02) { glowAt(c, lx, ly, R * (1.0 + .5 * led), '255,50,36', .95 * led, .9); }
  c.restore();
};

})();

// ====================================================================================================================================================================================
// SCENES `notice` and `clear`: the nurses' station of Episode 13 (S13, a one-point-perspective room, back wall at Z 1900) at night, with the Unit B hall through the doorway at the left, a fire alarm panel on
// the back wall where the whiteboard was (the whiteboard rectangle is painted over with wall), an EXIT sign over the doorway, a horn and strobe, a pull station, the counter with a laptop (the station computer
// Binder lives in) and a small printer, the med cart. Close-ups are a zoom on the face with the room blurred behind it; a character that would be cut by the frame is left out of the shot.
// Inserts (the loop on the clipboard, Binder's bubble, the map, the log with its stamp, the ceiling detector) are drawn in screen space in over(), above the dimmed, blurred room.
// ====================================================================================================================================================================================
(() => {
if (!window.TIMELINE_EP18 || !window.S13 || !window.S6 || !window.A15 || !window.A7 || !window.A11 || !window.H6 || !window.UI || !window.SH15) return;
const { zoomTo, faceC, drawBg, person } = window.H6;
const S13 = window.S13, S6 = window.S6, A6 = window.A6, A7 = window.A7, A11 = window.A11, A14 = window.A14, A15 = window.A15, SH15 = window.SH15;
const LAY = S13.LAY, ZB = LAY.zb, kzP = S13.kzP;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP18;
function tl(id) {
  const SCN = TLX.scenes.find(s => s.id === id), START = SCN.start, LN = {};
  for (const l of TLX.lines) if (l.scene === id) LN[l.id] = l;
  return { SCN, START, LN, bS: b => SCN.beats[b].s, bE: b => SCN.beats[b].e, wS: (b, i) => LN[b].s - START + LN[b].words[i][1], wE: (b, i) => LN[b].s - START + LN[b].words[i][2], snapT: t => Math.round((START + t) * 30) / 30 - START };
}
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const route = S13.route;

// ------------------------------------------------------------------ the room: S13's station with the whiteboard turned into a fire alarm panel and the fire dressing around it
const PANEL = { X: 95, Y: 300, s: .64 };          /* world position of the panel's centre on the back wall, and its scale in world units (440 x 580 natural) */
const PULL = { X: -178, Y: 430, s: .4 }, EXITS = { X: -500, Y: 716, s: .6 }, HORN = { X: -40, Y: 838, s: .8 };
const CALLB = { x0: 230, y0: 870, x1: 520, y1: 1030 };
/* the screen position and scale of a wall-mounted prop (world X, Y on the back wall, natural size scaled by `s` world units) under the current camera */
const wallAt = (X, Y, s) => { const [x, y] = V2.p2(X, Y, ZB); return { x, y, s: s * kzP(ZB) }; };
/* paint the blank whiteboard out (wall gradient exactly as S6.shell draws it), then hang the dressing; returns the S13.station lights */
function drawRoom(lt, o = {}) {
  const sky = o.sky ?? 1, k = kzP(ZB);
  const st = S13.station(lt, { t: lt, sky, sun: 0, bare: true, min: o.min ?? 40, hr: o.hr ?? 7, lampsOn: o.lampsOn ?? 1 });
  const wc = S13.mixh(S13.PAL.eve.wall, S13.PAL.dusk.wall, sky), top = V2.p2(0, LAY.ch, ZB)[1], bot = V2.p2(0, 0, ZB)[1];
  const [bx, by, bw, bh] = S13.wallBox(ZB, -282, 364, 302, 772);
  ctx.fillStyle = lg(0, top, 0, bot, [[0, S6.lit(wc, 1.04)], [1, S6.lit(wc, .9)]]); ctx.fillRect(bx, by, bw, bh);
  /* the call-light board (top right) with a couple of domes lit, the horn and strobe, the EXIT sign, the pull station, the panel */
  const cb = S13.wallBox(ZB, CALLB.x0, CALLB.y0, CALLB.x1, CALLB.y1);
  S13.callBoard(cb[0], cb[1], cb[2], cb[3], o.calls || (() => null), { t: lt, hero: false, title: o.callTitle ?? '' });
  const P = window.P18 || {};
  if (P.exitSign) { const e = wallAt(EXITS.X, EXITS.Y, EXITS.s); P.exitSign(ctx, { x: e.x, y: e.y, s: e.s, t: lt, glow: o.exitGlow ?? 1, halo: o.exitHalo ?? .7, hero: false }); }
  if (P.hornStrobe) { const h = wallAt(HORN.X, HORN.Y, HORN.s); P.hornStrobe(ctx, { x: h.x, y: h.y, s: h.s, level: o.strobe ?? 0, t: lt, hero: false }); }
  if (P.pullStation) { const p = wallAt(PULL.X, PULL.Y, PULL.s); P.pullStation(ctx, { x: p.x, y: p.y, s: p.s, pulled: o.pulled ?? 1, t: lt, hero: false }); }
  let pr = null;
  if (P.panel) { const p = wallAt(PANEL.X, PANEL.Y, PANEL.s); pr = P.panel(ctx, Object.assign({ x: p.x, y: p.y, s: p.s, t: lt, hero: false }, o.panel || { state: 'normal' })); }
  /* the lights of the room (pools for the light map): the panel's own spot is lit */
  const pc = V2.p2(PANEL.X, PANEL.Y, ZB), lights = st.lights.concat([{ x: pc[0], y: pc[1], r: 700 * k, color: '255,236,214', a: .85 }]);
  return { st, lights, panel: pr, panelAt: { x: pc[0], y: pc[1] } };
}
/* the counter's laptop (the station computer: Binder's home) facing us, and the small printer; both stand on the counter top (Y 190) behind the visitors' ledge */
const LAPTOP = { X: 405, Z: 1446 }, PRINTER = { X: -10, Z: 1436, w: 200 };
const lapScaleAt = Z => .72 * kzP(Z) / .44 * .62;
function laptopOnCounter(lt, o = {}) {
  const [x, y] = V2.p2(LAPTOP.X, 190, LAPTOP.Z), ls = lapScaleAt(LAPTOP.Z);
  ctx.save(); ctx.translate(0, 0);
  A15.laptop(x, y - 2, { lapScale: ls, lapScreen: o.screen !== false, rot: 0 });
  ctx.restore();
  const sr2 = A15.laptopScreen({ lapScale: ls });
  return { x: x + (sr2[0] + sr2[2]) / 2, y: y + (sr2[1] + sr2[3]) / 2 - 2, w: sr2[2] - sr2[0], h: sr2[3] - sr2[1], base: [x, y] };
}
/* the printer: a cream box, a paper tray on the back, a slot on top the sheet comes out of (the sheet is drawn by the caller between printerBack and printerFront), an LED, two buttons */
function printerAt() { const [x, y] = V2.p2(PRINTER.X, 190, PRINTER.Z), k = kzP(PRINTER.Z); return { x, y, k, w: PRINTER.w * k, h: 86 * k }; }
function printerBack(P) {
  const { x, y, w, h } = P;
  ctx.save(); ctx.fillStyle = 'rgba(15,10,20,.28)'; ctx.beginPath(); ctx.ellipse(x, y + 2, w * .62, h * .13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c9ccd2'; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = Math.max(2, h * .04);                    /* the paper tray, tilted up at the back */
  ctx.beginPath(); ctx.moveTo(x - w * .34, y - h * .8); ctx.lineTo(x + w * .34, y - h * .8); ctx.lineTo(x + w * .4, y - h * 1.38); ctx.lineTo(x - w * .4, y - h * 1.38); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function printerFront(P, o = {}) {
  const { x, y, w, h } = P, led = o.led || 'off', lw = Math.max(2, h * .04);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(0, y - h, 0, y, [[0, '#f1ece0'], [1, '#d4cdbd']]); ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = lw;
  rr(x - w / 2, y - h, w, h, h * .16); ctx.fill(); ctx.stroke();                                                         /* the body */
  ctx.fillStyle = '#2a2d36'; rr(x - w * .42, y - h * .95, w * .84, h * .12, h * .05); ctx.fill();                      /* the slot */
  ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(x - w * .46, y - h * .5, w * .92, h * .05, h * .02); ctx.fill();
  ctx.fillStyle = '#5a5f6b'; rr(x - w * .34, y - h * .42, w * .68, h * .26, h * .06); ctx.fill();                      /* the output flap */
  ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = lw * .7; ctx.stroke();
  const lc = led === 'green' ? '#37f07a' : led === 'amber' ? '#ffb43a' : '#4a4f58';
  ctx.fillStyle = lc; ctx.beginPath(); ctx.arc(x + w * .38, y - h * .72, h * .06, 0, TAU); ctx.fill();
  ctx.fillStyle = '#9aa1ad'; ctx.beginPath(); ctx.arc(x + w * .26, y - h * .72, h * .05, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + w * .14, y - h * .72, h * .05, 0, TAU); ctx.fill();
  ctx.restore();
  if (led !== 'off') V2.glow(x + w * .38, y - h * .72, h * 1.4, led === 'green' ? '60,255,130' : '255,180,60', .7 * (o.ledA ?? 1), 'screen', .5);
}

// ------------------------------------------------------------------ placing the cast: world (X, Z) in the room's one-point perspective; frame test
const wpos = (X, Z) => V2.at(X, Z);
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
/* is this character entirely inside the frame? (one cut by the frame edge is left out of the shot instead: no slivers, no blurred shoulders) */
function inFrame(o) {
  const b = boxOf(o, 34), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
/* zoom and centre so that a group of characters fits the frame with margin mx; ty = where the middle of the group's box lands on the screen (y) */
function frameGroup(list, o = {}) {
  const bs = list.map(([q, pad]) => boxOf(q, pad)), x0 = Math.min(...bs.map(v => v[0])), x1 = Math.max(...bs.map(v => v[2])), y0 = Math.min(...bs.map(v => v[1])), y1 = Math.max(...bs.map(v => v[3]));
  const z = Math.min((W - 2 * (o.mx ?? 80)) / (x1 - x0), (o.hMax ?? 1100) / (y1 - y0), o.zMax ?? 3) * (o.k ?? 1), cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * (o.at ?? .5);
  zoomTo(cx, cy + (960 - (o.ty ?? 760)) / z, z);
  return z;
}
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);

// ====================================================================================================================================================================================
// NOTICE (7:40 PM, THE NOTICE, 31.9 s). Shots (scene-local s): open 0-1.30 wide, Onion walks in, the click | o1 1.30-3.25 Onion "Fire drill at eight o'clock." (sniffle 2.5) | l1 3.25-5.32 Lemon | o2 5.32-6.5 Onion |
// l1b 6.5-7.3 Lemon's flat look | s1 7.3-8.52 Strawberry at the cart | o3 8.52-9.45 Onion | insA 9.45-10.81 the clipboard loop, arrow 1 | s2 10.81-11.39 "Good." | o4 11.39-12.2 Onion | insB 12.2-13.73 the loop closes |
// s3 13.73-14.66 "Which one wins?" | insC 14.66-16.24 spinner, PER POLICY stamp | t1 16.24-17.65 Tomato | m1 17.65-19.45 Mango (held on "Efficiency.") | lap 19.45-19.98 the laptop, Binder pops out (19.83) |
// bub1 19.98-22.59 Binder's bubble | s4 22.59-23.04 "No." | bub2 23.04-23.69 the No button runs | grin 23.69-24.08 | prn 24.08-25.83 the printer (printer 24.08, click 25.63) | map1 25.83-27.92 the map |
// l2 27.92-29.35 Lemon "That is on the roof." | map2 29.35-30.17 the flame rises ("Fire rises!") | end 30.17-31.92 Strawberry, tired, the sting (30.567).
// ====================================================================================================================================================================================
const NT = tl('notice'), NLN = NT.LN;
const NC = { click: .5, sniffle: [2.5, 15.713], binderpop: 19.827, grin: 23.688, printer: 24.08, click2: 25.63, sting: 30.567 };
for (const k in NC) NC[k] = Array.isArray(NC[k]) ? NC[k].map(NT.snapT) : NT.snapT(NC[k]);
const NPOS = { onion: [-345, 1190], cart: [-215, 1345], straw: [-92, 1285], lemon: [118, 1300], tom: [318, 1240], mango: [505, 1180] };
const ONION_IN = route([[0, -470, 1840], [1.30, NPOS.onion[0], NPOS.onion[1], 'out']]);
const NSH = [
  { id: 'open', s: 0, e: 1.30, k: 'w' },
  { id: 'o1', s: 1.30, e: 3.25, k: 'w', foc: 'onion', z: 2.15, up: 130, cz: -150 },
  { id: 'l1', s: 3.25, e: 5.32, k: 'w', foc: 'lemon', z: 2.3, up: 150, cz: -150 },
  { id: 'o2', s: 5.32, e: 6.5, k: 'w', foc: 'onion', z: 1.9, up: 130, cz: -150, dx: -60 },
  { id: 'l1b', s: 6.5, e: 7.3, k: 'w', foc: 'lemon', z: 2.7, up: 150, cz: -150 },
  { id: 's1', s: 7.3, e: 8.52, k: 'w', foc: 'straw', z: 1.85, up: 150, cz: -150, dx: -125, cart: 1 },
  { id: 'o3', s: 8.52, e: 9.45, k: 'w', foc: 'onion', z: 2.15, up: 130, cz: -150 },
  { id: 'insA', s: 9.45, e: 10.81, k: 'flow', n: 1 },
  { id: 's2', s: 10.81, e: 11.39, k: 'w', foc: 'straw', z: 2.2, up: 150, cz: -150, dx: -95, cart: 1 },
  { id: 'o4', s: 11.39, e: 12.2, k: 'w', foc: 'onion', z: 2.3, up: 130, cz: -150 },
  { id: 'insB', s: 12.2, e: 13.73, k: 'flow', n: 2 },
  { id: 's3', s: 13.73, e: 14.66, k: 'w', foc: 'straw', z: 2.1, up: 150, cz: -150, dx: -95, cart: 1 },
  { id: 'insC', s: 14.66, e: 16.24, k: 'flow', n: 3 },
  { id: 't1', s: 16.24, e: 17.65, k: 'w', foc: 'tom', z: 2.1, up: 130, cz: -150 },
  { id: 'm1', s: 17.65, e: 19.45, k: 'w', foc: 'mango', z: 2.3, up: 140, cz: -150 },
  { id: 'lap', s: 19.45, e: 19.98, k: 'w', foc: 'lap', z: 3.3, cz: -150 },
  { id: 'bub1', s: 19.98, e: 22.59, k: 'bubble' },
  { id: 's4', s: 22.59, e: 23.04, k: 'w', foc: 'straw', z: 2.8, up: 150, cz: -150 },
  { id: 'bub2', s: 23.04, e: 23.69, k: 'bubble' },
  { id: 'grin', s: 23.69, e: 24.08, k: 'binder' },
  { id: 'prn', s: 24.08, e: 25.83, k: 'w', foc: 'prn', z: 3.1, cz: -150 },
  { id: 'map1', s: 25.83, e: 27.92, k: 'map', n: 1 },
  { id: 'l2', s: 27.92, e: 29.35, k: 'w', foc: 'lemon', z: 2.4, up: 150, cz: -150 },
  { id: 'map2', s: 29.35, e: 30.17, k: 'map', n: 2 },
  { id: 'end', s: 30.17, e: 99, k: 'w', foc: 'straw', z: 2.3, up: 150, cz: -150 },
];
for (const sh of NSH) sh.s = sh.s === 0 ? 0 : NT.snapT(sh.s);
const nShot = lt => { let r = NSH[0]; for (const sh of NSH) if (lt >= sh.s - 1e-6) r = sh; return r; };

// ------------------------------------------------------------------ the cast of `notice`
function castN(lt, sh) {
  const b = NT.bS, e = NT.bE, inB = id => lt >= b(id) && lt < e(id), C = {};
  const id = sh.id, front = !sh.foc || sh.id === 'open';
  /* Onion: walks in from Unit B, then talks to the group, crying throughout (the sniffles at 2.5 and 15.7 shake her) */
  const sob = Math.max(0, 1 - Math.abs(lt - NC.sniffle[0] - .12) / .5, 1 - Math.abs(lt - NC.sniffle[1] - .12) / .5);
  const wlk = lt < 1.30;
  C.onion = person(A15.onion, ONION_IN, lt, { t: lt, pose: 'free', arms: { l: 'hold', r: wlk ? 'rest' : (inB('o3') || inB('o4') ? 'offer' : 'rest') }, grip: { l: [-70, 66] }, hold: { l: 'fp18_drillclip' }, clipScale: .26, clipAt: [.04, .88], clipRot: -.05,
    yaw: wlk ? 0 : K([[1.3, .1], [2.0, .5], [8, .5], [12, .55]], lt), headYaw: wlk ? 0 : K([[1.3, .2], [2.0, .55]], lt), expr: 'onion_cry', cry: .62, sob, look: [.5, .1], who: 'onion' });
  /* Lemon: arms crossed in spirit (down), the flat look; eyes follow the speaker */
  const lookL = lt < 3.25 ? [-.8, .1] : lt < 5.32 ? [-.2, 0] : lt < 7.3 ? [-.7, 0] : lt < 8.5 ? [.7, .05] : [-.75, .05];
  C.lemon = person(A7.lemon, () => NPOS.lemon, lt, { t: lt, yaw: -.3, headYaw: -.3 + (lookL[0] > 0 ? .3 : 0), look: lookL, expr: 'neutral', lid: id === 'l1b' ? .42 : .3, acc: ['readers', 'lanyard7'], face: { curve: .02 }, who: 'lemon', arms: { l: 'rest', r: 'rest' } });
  /* Strawberry: pours meds at the cart (her left hand over the tray), tired; she looks at whoever speaks */
  const sip = lt < 7.3 ? 0 : 1, pour = Math.sin(lt * 3.1) * .5 + .5;
  C.straw = person(A11.straw, () => NPOS.straw, lt, { t: lt, yaw: K([[0, -.2], [7, -.2], [8.5, -.1], [13.5, -.1]], lt), headYaw: K([[0, -.6], [6.5, -.6], [7.4, -.25], [8.6, -.45], [11, -.2], [13.7, -.15]], lt), look: lt < 7.3 ? [-.55, .45] : lt < 10.8 ? [-.7, .05] : [.1, .05], expr: 'dead', lid: lt > 30.3 ? K([[30.3, .48], [30.567, .46], [30.7, .04], [30.98, .04], [31.25, .44]], lt) : .5, squash: .05 * ss(lt, 30.45, 30.75) * (1 - ss(lt, 30.95, 31.45)), plant: true, who: 'straw',
    arms: { l: lt < 14 ? 'hold' : 'rest', r: 'rest' }, hold: lt < 14 ? { l: 'fp18_medcup' } : {}, cupScale: 1.25, cupTip: .55 * Math.sin(lt * 3.1) * (lt < 7.3 ? .6 : 1), grip: { l: [-158, -6 + 14 * pour] } });
  C.tom = person(A15.tomato, () => NPOS.tom, lt, { t: lt, tomPose: 'fruit', yaw: K([[0, -.45], [16, -.3]], lt), headYaw: lt < 16.2 ? -.5 : -.2, look: lt < 16.2 ? [-.6, .05] : [-.3, .05], who: 'tom', arms: { l: 'hold', r: inB('t1') ? 'offer' : 'rest' } });
  const mx = inB('m1');
  C.mango = person(A7.mango, () => NPOS.mango, lt, { t: lt, yaw: -.4, headYaw: lt < 17.7 ? -.5 : -.2, look: lt < 17.7 ? [-.7, .05] : [-.2, .05], expr: lt < 18.85 ? (mx ? 'shock' : 'neutral') : 'dead', lid: lt >= 18.85 ? .5 : undefined, who: 'mango', arms: { l: 'rest', r: mx && lt < 18.8 ? 'shrug' : 'rest' } });
  return C;
}

// ------------------------------------------------------------------ cameras and the draw of the world
let NFR = null;                                          /* { C, sh } of the frame being drawn, built in cam() */
function camN(lt) {
  const sh = nShot(lt), u = sg(lt, sh.s, Math.min(sh.e, sh.s + 3)), wide = sh.k !== 'w' || sh.id === 'open';
  /* the perspective camera FIRST (V2.at places the cast under it), then the cast, then the 2D framing */
  if (sh.id === 'open') { const e = easeIO(sg(lt, 0, 1.3)); S13.cam('station', { cz: lerp(-470, -390, e), cx: lerp(60, 85, e), cy: 380 }); }
  else if (wide) S13.cam('station', { cz: -390, cx: 85, cy: 380 });
  else S13.cam('station', { cz: sh.cz ?? -150 });
  const C = castN(lt, sh);
  NFR = { C, sh };
  const sway = { x: 2.2 * hnoise(lt, 1.3, 1), y: 1.6 * hnoise(lt, 1.1, 2), r: .0015 * hnoise(lt, .9, 3) };
  if (wide) zoomTo(540, sh.id === 'open' ? 960 : 1120, 1);
  else if (sh.foc === 'lap') { const g = lapGeom(); zoomTo(g.x, g.y - 30, sh.z + .25 * u); }
  else if (sh.foc === 'prn') { const P = printerAt(); zoomTo(P.x + 20 * P.k, P.y - 150 * P.k, sh.z + .3 * u); }
  else { faceZoom0(C[sh.foc], sh.z + .22 * u, sh.up); CAM.x -= (sh.dx || 0) / CAM.z; }
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
}
const faceZoom0 = (o, z, up = 90) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };

function drawRoomBlock(lt, sh, extra = {}) {   /* extra.noCart: the cart is drawn sharp by the caller */
  const calls = i => (i === 9 || i === 22) ? [S13.CALLCOL.amber, .6 + .4 * Math.sin(lt * 2.2 + i)] : null;
  const lampsN = lt < NC.click ? .45 : lt < NC.click + .07 ? .25 : 1;
  const R = drawRoom(lt, { sky: 1, min: 40, hr: 7, calls, exitGlow: 1, lampsOn: lampsN, panel: { state: 'normal', lcd: ['SYSTEM NORMAL', 'DRILL  8:00 PM'] } });
  S13.counter({ t: lt, phoneRing: 0, plaque: false });
  if (!sh.cart) S13.medCart(NPOS.cart[0], NPOS.cart[1], { t: lt });
  extra.counterProps && extra.counterProps(lt);
  S13.lightMap({ ambient: 'rgb(92,84,112)', lights: R.lights.concat([{ x: 540, y: 1180, r: 1100, color: '255,214,170', a: .3, sy: .5 }]) });
  return R;
}
function drawN(lt) {
  const { C, sh } = NFR;
  S13.light('dusk', { keyA: .3, rimA: .5, shadowA: .38, back: { color: '255,176,110', a: .22, w: 12 }, frontDark: .04 });
  V2.opts.reflect = true;
  const dofPx = sh.k !== 'w' ? 14 : sh.id === 'open' ? 0 : sh.foc === 'lap' || sh.foc === 'prn' ? 9 : 10;
  const hideAll = sh.foc === 'lap' || sh.foc === 'prn' || sh.k !== 'w';
  const showLap = sh.foc !== 'lap', showPrn = sh.foc !== 'prn';
  const printerAll = l => {
    const Pr = printerAt();
    printerBack(Pr);
    const pm = printerMap(l);
    if (pm) { ctx.save(); ctx.beginPath(); ctx.rect(Pr.x - Pr.w, Pr.y - Pr.h * 4, Pr.w * 2, Pr.h * 4 - Pr.h * .92); ctx.clip(); window.P18.evacMap(ctx, pm); ctx.restore(); }
    printerFront(Pr, { led: l < NC.printer ? 'off' : l < NC.click2 ? 'amber' : 'green' });
    if (l >= NC.printer && l < NC.click2) V2.glow(Pr.x, Pr.y - Pr.h * .92, Pr.w * .5, '255,190,90', .35, 'screen', .3);
  };
  const counterProps = l => { if (showLap) laptopOnCounter(l, {}); if (showPrn) printerAll(l); };
  const block = () => drawRoomBlock(lt, sh, { counterProps });
  if (dofPx) V2.dof(dofPx, block); else block();
  if (hideAll) {   /* a close-up of the laptop or the printer: the subject is drawn sharp over the blurred room */
    if (sh.foc === 'lap') { laptopOnCounter(lt, {}); lapGlow(lt); } else if (sh.foc === 'prn') { printerAll(lt); binderAtPrinter(lt); }
    return;
  }
  if (sh.cart) S13.medCart(NPOS.cart[0], NPOS.cart[1], { t: lt, rimA: .3 });
  const order = ['onion', 'lemon', 'straw', 'tom', 'mango'].map(n => [n, C[n]]).sort((a, b) => a[1].y - b[1].y);
  for (const [n, o] of order) {
    const f = inFrame(o);
    if (n !== sh.foc && sh.id !== 'open' && (!f.inter || !f.whole)) continue;
    drawChar(o);
  }
}
const lapGlow = lt => lapGlowN(lt);
const printerMap = printerMapN;

// ------------------------------------------------------------------ inserts (screen space, drawn in over() above the dimmed, blurred room)
const veil = a => { ctx.fillStyle = 'rgba(8,14,18,' + a + ')'; ctx.fillRect(0, 0, W, H); const g = V2.radial(540, 800, 200, 1100, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
/* ---- the loop on the clipboard: POLICY 14.9, two boxes that each DO NOT INTERRUPT the other, Onion's pen draws it, a spinner turns, PER POLICY is stamped */
const FLOW = { x: 540, y: 806, s: 1.5 };
const FL = { a1: [9.55, 10.3], l1: [10.3, 10.75], a2: [12.3, 13.05], l2: [13.05, 13.55], spin0: 14.7 };
const STAMP_N = NT.snapT(NT.wS('o5', 1) - .02);                    /* PER POLICY lands on the word "policy" (the script has no sound for it here: it lands silently) */
function spinner(c, x, y, r, t, a = 1) {
  c.save(); c.translate(x, y); c.rotate(t * 5.2); c.lineCap = 'round'; c.globalAlpha *= a;
  for (let i = 0; i < 10; i++) { const k = i / 10; c.strokeStyle = 'rgba(35,64,142,' + (.12 + .88 * k) + ')'; c.lineWidth = r * .2; c.beginPath(); c.arc(0, 0, r, k * TAU, k * TAU + .5); c.stroke(); }
  c.restore();
}
function inkArrow(c, x0, y0, x1, y1, k, wob = 5) {   /* a hand-drawn arrow from (x0, y0) to (x1, y1), drawn to fraction k; returns the pen tip */
  c.save(); c.strokeStyle = '#23408e'; c.fillStyle = '#23408e'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
  const L = k * 1, px = u => x0 + (x1 - x0) * u + Math.sin(u * 7 + x0) * wob, py = u => y0 + (y1 - y0) * u;
  const shaft = c01(L / .88);
  c.beginPath(); c.moveTo(px(0), py(0)); for (let i = 1; i <= 24; i++) { const u = shaft * i / 24 * .88; c.lineTo(px(u), py(u)); } c.stroke();
  if (L > .88) { const h = c01((L - .88) / .12), tx = px(.88), ty = py(.88), dir = Math.sign(y1 - y0), ex = lerp(tx, x1, h), ey = lerp(ty, y1, h);
    c.beginPath(); c.moveTo(tx - 14, ty - dir * 4); c.lineTo(ex, ey); c.lineTo(tx + 14, ty - dir * 4); c.stroke(); }
  c.restore();
  const u = Math.min(1, shaft * .88 + (k > .88 ? (k - .88) : 0)); return [px(Math.min(.98, u)), py(Math.min(.98, u))];
}
function flowContent(lt) {
  return (c, H, cap) => {
    UI.label('POLICY 14.9', 0, -262, Object.assign({ size: 48, font: 'Bangers', weight: 400, fill: '#b3261e', spacing: 2, maxW: 380, hero: H(48) }, cap));
    UI.label('DRILLS AND MED PASS', 0, -222, Object.assign({ size: 22, weight: 900, fill: '#6b6458', spacing: 1.4, maxW: 390, hero: H(22) }, cap));
    c.strokeStyle = '#b3261e'; c.lineWidth = 3; c.beginPath(); c.moveTo(-204, -198); c.lineTo(204, -198); c.stroke();
    for (const [by, txt] of [[-176, 'DRILL'], [104, 'MED PASS']]) {
      c.fillStyle = '#fff'; c.strokeStyle = '#23408e'; c.lineWidth = 5; rr(-118, by, 236, 72, 12); c.fill(); c.stroke();
      UI.label(txt, 0, by + 36, Object.assign({ size: 38, weight: 900, fill: '#23408e', maxW: 210, hero: H(38) }, cap));
    }
    const k1 = sg(lt, FL.a1[0], FL.a1[1]), k2 = sg(lt, FL.a2[0], FL.a2[1]);
    if (k1 > 0) inkArrow(c, -64, -104, -64, 104, k1);
    if (k2 > 0) inkArrow(c, 64, 104, 64, -104, k2);
    const t1 = sg(lt, FL.l1[0], FL.l1[1]), t2 = sg(lt, FL.l2[0], FL.l2[1]);
    for (const [cx, tt, lines] of [[-146, t1, ['DOES NOT', 'INTERRUPT']], [146, t2, ['DOES NOT', 'INTERRUPT']]]) {
      if (tt <= 0) continue;
      lines.forEach((ln, i) => UI.label(ln, cx, -14 + i * 29, Object.assign({ size: 23, weight: 900, italic: true, fill: '#23408e', maxW: 142, reveal: c01(tt * 2 - i), hero: H(23) }, cap)));
    }
    const sp = lt >= FL.spin0 && lt < STAMP_N + .1 ? 1 : 0;
    if (sp) spinner(c, 0, 0, 30, lt, c01((lt - FL.spin0) / .1) * c01(1 - (lt - STAMP_N) / .1));
    if (lt >= STAMP_N - .12) {
      const u = sg(lt, STAMP_N - .12, STAMP_N), sc = lerp(1.3, 1, eo(u)), cy = 254;
      c.save(); c.globalAlpha *= c01(u * 3); c.translate(0, cy); c.scale(sc, sc); c.translate(0, -cy);
      UI.stamp('PER POLICY', 0, cy, { size: 58, color: '#d6203a', rot: -.1, alpha: .94, hero: u >= 1 && H(58) });
      c.restore();
    }
  };
}
function insFlow(lt, sh) {
  veil(.66);
  const age = lt - STAMP_N;
  ctx.save(); ctx.globalAlpha *= c01((lt - sh.s) / .06 + .4);
  P18x().drillLog(ctx, { x: FLOW.x, y: FLOW.y, s: FLOW.s, rot: -.02, content: flowContent(lt), t: lt, stampAge: -1 });
  ctx.restore();
  /* Onion's pen: its tip follows the arrow being inked, then rests to the right of the board, wobbling */
  const pg = (x, y) => [FLOW.x + x * FLOW.s, FLOW.y + y * FLOW.s];
  let tip = pg(210, 150 + 6 * Math.sin(lt * 3)), writing = 0;
  const a1 = sg(lt, FL.a1[0], FL.a1[1]), a2 = sg(lt, FL.a2[0], FL.a2[1]);
  if (a1 > 0 && a1 < 1) { tip = pg(-64, lerp(-104, 104, a1)); writing = 1; }
  else if (a2 > 0 && a2 < 1) { tip = pg(64, lerp(104, -104, a2)); writing = 1; }
  else if (lt >= FL.l1[0] && lt < FL.l1[1] + .2) tip = pg(-84 + 3 * Math.sin(lt * 25), 40);
  else if (lt >= FL.l2[0] && lt < FL.l2[1] + .2) tip = pg(214 + 3 * Math.sin(lt * 25), 40);
  else if (lt >= STAMP_N - .1) tip = pg(215, 120);
  ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(1.85 + (writing ? .04 * Math.sin(lt * 30) : 0));
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#c3cad4'; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-9, -26); ctx.lineTo(9, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#23408e'; rr(-12, -190, 24, 168, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-6, -182, 5, 150);
  ctx.fillStyle = '#e9edf4'; rr(-12, -250, 24, 60, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b3261e'; ctx.fillRect(6, -244, 4, 46);
  ctx.restore();
  /* the sniffle at 15.713: a tear falls out of the top of the frame onto the page, a wet patch and a ring */
  const TT = NC.sniffle[1];
  if (lt > TT - .3 && lt < TT + .7) {
    const fy = lerp(150, 598, easeIn(c01((lt - (TT - .3)) / .3)));
    if (lt < TT) { ctx.fillStyle = 'rgba(190,220,255,.92)'; ctx.strokeStyle = 'rgba(70,110,170,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(742, fy - 30); ctx.quadraticCurveTo(758, fy - 2, 742, fy + 12); ctx.quadraticCurveTo(726, fy - 2, 742, fy - 30); ctx.fill(); ctx.stroke(); }
    else { const q = c01((lt - TT) / .6); ctx.save(); ctx.fillStyle = 'rgba(110,150,210,' + (.3 * (1 - q * .6)) + ')'; ctx.beginPath(); ctx.ellipse(742, 612, 34 + 16 * q, 20 + 8 * q, 0, 0, TAU); ctx.fill(); ctx.restore(); V2.ring(742, 612, c01((lt - TT) / .45), { r0: 10, r1: 70, color: '190,220,255', lw: 4, alpha: .8, squash: .55, bloom: 0 }); }
  }
}
const P18x = () => window.P18;

/* ---- Binder's bubble (the Episode 15 kit): the offer, the No button that runs from the pointer, "Great! I'll help." */
const BTXT1 = "It looks like you're preparing for a fire. Would you like help?", BTXT2 = "Great! I'll help.";
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
const RUN = { t0: NT.snapT(23.14), t1: NT.snapT(23.66) };
const runU = lt => sg(lt, RUN.t0 + .04, RUN.t1);
function bubbleOpts(lt) {
  const o = { w: BUBW, s: 1, size: 42, name: 'Binder', buttons: [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }], runPath: RP };
  const second = lt >= NT.bS('b2'); o.text = second ? BTXT2 : BTXT1;
  const h = SH15.binderRect(Object.assign({ at: [0, 0] }, o)).h; o.at = [BUBX, BUBBOT - h];
  o.typed = second ? typedAtL(NT, 'b2', BTXT2, lt) : typedAtL(NT, 'b1', BTXT1, lt);
  o.runaway = runU(lt); o.pop = ss(lt, NT.bS('b1'), NT.bS('b1') + .3);
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
  const second = lt >= NT.bS('b2');
  bigBinder(lt, { grin: second ? .5 : .15, pose: second ? 'rest' : 'helpful', look: [.5, -.4] });
  const bo = bubbleOpts(lt);
  SH15.binder(bo, lt);
  if (sh.id === 'bub2') {   /* the pointer goes for "No thanks" and the button runs */
    const nr = noRect(bo, runU(lt)) || { x: 600, y: 600, w: 270, h: 62 }, nrPrev = noRect(bo, runU(lt - .07)) || nr, home = SH15.binderRect(bo, 'no');
    let px, py, press = 0;
    if (lt < RUN.t0 + .04) { const q = easeIO(sg(lt, sh.s, RUN.t0 - .02)); px = lerp(900, home.x + home.w * .7, q); py = lerp(900, home.y + home.h * .8, q); press = Math.sin(PI * sg(lt, RUN.t0 - .02, RUN.t0 + .2)); }
    else { px = nrPrev.x + nrPrev.w * .7; py = nrPrev.y + nrPrev.h * .8; press = lt < RUN.t0 + .22 ? Math.sin(PI * sg(lt, RUN.t0 - .02, RUN.t0 + .2)) : 0; }
    SH15.pointer(px, py, { kind: 'arrow', press, s: 1.7 });
  }
}
function insBinder(lt, sh, t0, glint0) {   /* Binder's grin, full frame: ear to ear, a glint of tooth */
  veil(.8);
  const k = sg(lt, sh.s, Math.min(sh.e, sh.s + 3)), g = ss(lt, t0, t0 + .14);
  V2.glow(540, 900, 640, '120,255,180', .16 + .12 * g, 'screen', .3);
  const b = A15.binder({ x: 540, y: 930, s: lerp(1.9, 2.15, k), center: true, noLegs: true, who: 'bind', t: lt, yaw: 0, pose: 'cheer', grin: g, glint: g > .9 ? Math.max(0, Math.sin((lt - (glint0 ?? t0) - .12) * 14)) ** 2 : 0, look: [.1, .1], hover: 8 });
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16; drawChar(b); ctx.restore();
}
/* ---- the evacuation map (b3, b4): the printed sheet grows out of the printer to fill the frame, the route climbs to the roof, a flame rises along it */
const MAPX = { x: 540, y: 806, s: 1.5 };
function insMap(lt, sh) {
  veil(.72);
  const pop = eo(sg(lt, sh.s, sh.s + .28)), flame = sh.n === 2 ? ss(lt, NT.bS('b4') + .1, NT.bS('b4') + .72) : 0;
  ctx.save();
  if (sh.n === 1) { ctx.translate(540, 806); ctx.scale(lerp(.74, 1, pop), lerp(.74, 1, pop)); ctx.translate(-540, -806 + lerp(60, 0, pop)); }
  window.P18.evacMap(ctx, { x: MAPX.x, y: MAPX.y, s: MAPX.s, t: lt, flame, march: 1 });
  ctx.restore();
  /* Binder hovers in the corner, beaming */
  const g = sh.n === 2 ? 1 : ss(lt, sh.s + .1, sh.s + .5) * .6;
  const b = A15.binder({ x: 918, y: 1292 + 6 * Math.sin(lt * 3), s: .56 * lerp(.6, 1, eb(sg(lt, sh.s, sh.s + .3))), center: true, noLegs: true, who: 'bind', t: lt, yaw: -.2, pose: sh.n === 2 ? 'cheer' : 'helpful', grin: g, glint: sh.n === 2 ? Math.max(0, Math.sin((lt - NT.bS('b4')) * 12)) ** 2 : 0, look: [-.5, -.1], hover: 8 });
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; drawChar(b); ctx.restore();
}
/* ---- the laptop and the printer in the world: the screen glows, Binder pops out of it (binderpop 19.83); the sheet rises out of the printer (printer 24.08 to click 25.63) */
function lapGeom() {
  const [x, y] = V2.p2(LAPTOP.X, 190, LAPTOP.Z), ls = lapScaleAt(LAPTOP.Z), r = A15.laptopScreen({ lapScale: ls });
  return { x: x + (r[0] + r[2]) / 2, y: y + (r[1] + r[3]) / 2 - 2, w: r[2] - r[0], h: r[3] - r[1] };
}
function lapGlowN(lt, hideChars) {
  if (lt < 19.2) return;
  const g = lapGeom(), ant = ss(lt, 19.45, NC.binderpop), k = sg(lt, NC.binderpop, NC.binderpop + .5);
  V2.glow(g.x, g.y, 80 + 70 * ant + 40 * (1 - k), '190,255,220', Math.min(1, .25 + .6 * ant) * (1 - .5 * k), 'screen', .4);
  if (lt >= NC.binderpop) {
    const kk = sg(lt, NC.binderpop, NC.binderpop + .16), f = ss(lt, NC.binderpop + .04, NC.binderpop + .5), bob = Math.sin(lt * 3.2) * 3;
    if (kk < 1) V2.ring(g.x, g.y - 6, kk, { r0: 8, r1: 90, color: '255,236,160', lw: 6, alpha: .9 });
    const o = A15.binderSmall({ x: g.x, y: lerp(g.y + 10, g.y - g.h * .75, f) - Math.sin(PI * f) * 20 + bob * f, s: .72 * g.w / 300 * eb(kk), center: true, noLegs: true, who: 'bind', t: lt, pose: 'ears', grin: .25, look: [.3, .2], hover: 6 });
    drawChar(o);
  }
}
const PR_T0 = NC.printer, PR_T1 = NC.click2;
function printerMapN(lt) {
  if (lt < PR_T0) return null;
  const Pr = printerAt(), rv = lt >= PR_T1 ? 1 : sg(lt, PR_T0, PR_T1) * .985, s = .84 * Pr.w / 520, slotY = Pr.y - Pr.h * .92;
  const settle = lt >= PR_T1 ? pulse(lt, PR_T1, 40, .08) * 3 : 0;
  return { x: Pr.x, y: slotY - rv * 700 * s + 350 * s + settle, s, reveal: rv, t: lt, march: 0, hero: false };
}

//@@NOTICEINS2@@
/* a paper med cup with pills, held in the hand (Strawberry's med pass); o.cupScale, o.cupTip (radians: she tips it) */
EXT.prop.fp18_medcup = (side, o, t) => {
  const S = o.cupScale || 1;
  ctx.save(); ctx.rotate((o.cupTip || 0) - .08); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = '#f7f7f1'; ctx.strokeStyle = 'rgba(25,16,30,.88)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(14, -20); ctx.lineTo(10, 3); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,120,130,.55)'; ctx.lineWidth = 1.2; for (const x of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x * 1.2, -18); ctx.lineTo(x * .8, 1); ctx.stroke(); }
  for (const [x, y, c] of [[-6, -21, '#f4a3b8'], [2, -23, '#ffffff'], [8, -20, '#7fc8f8']]) { ctx.fillStyle = c; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y, 4.4, 3.2, .3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp18_medcup = [-20, -34, 20, 8];
function binderAtPrinter(lt) {
  if (lt < PR_T0) return;
  const Pr = printerAt(), k = ss(lt, PR_T0, PR_T0 + .3), x = Pr.x + Pr.w * .68, y = Pr.y - Pr.h * 2.0 + 4 * Math.sin(lt * 3);
  const g = lt >= PR_T1 ? ss(lt, PR_T1, PR_T1 + .2) : .3;
  drawChar(A15.binderSmall({ x, y, s: .5 * Pr.w / 300 * eb(k), center: true, noLegs: true, who: 'bind', t: lt, yaw: -.3, pose: lt >= PR_T1 ? 'cheer' : 'helpful', grin: g, look: [-.5, .3], hover: 6 }));
}

const NSC = {
  shot: lt => nShot(lt).id,
  cam: camN,
  draw: drawN,
  fx: lt => ({ bloom: .5 + .8 * Math.max(0, 1 - Math.abs(lt - NC.sting - .05) / .25), vignette: .42 + .1 * ss(lt, 30.2, 31.5), grain: .045, contrast: .13, sat: .1, fade: lt < .25 ? 1 - lt / .25 : 0, fadeColor: '16,12,24' }),
  blur: lt => 1,
  over: lt => { const sh = NFR.sh; if (sh.k === 'flow') insFlow(lt, sh); else if (sh.k === 'bubble') insBubble(lt, sh); else if (sh.k === 'binder') insBinder(lt, sh, NC.grin); else if (sh.k === 'map') insMap(lt, sh); },
  clock: () => NT.SCN.clock, label: () => NT.SCN.label,
};
window.__EP18_SCENES = window.__EP18_SCENES || {};
window.__EP18_SCENES.notice = NSC;
// ====================================================================================================================================================================================
// CLEAR (8:25 PM, ALL CLEAR, 31.2 s). Shots (scene-local s): pan 0-1.30 the Marshal presses SILENCE at the alarm panel (click .45, hornstop .5: the red pulse dies, the room warms), the State walks in at the left |
// st1a 1.30-3.05 Stateman and Kumquat, two-shot | st1b 3.05-4.83 Stateman CU | st2 4.83-6.38 Stateman and Onion, the clipboard changes hands (6.08) | o1 6.38-7.58 Onion "Signed Monday." | st3 7.58-8.34 Stateman reads |
// o2 8.34-9.95 Onion (sniffle 9.54) | st4 9.95-11.57 Stateman | o3 11.57-12.74 Onion | l1 12.74-13.95 Lemon "It took twenty." | o4 13.95-15.71 Onion | pass 15.71-16.49 the log, PASS stamped (15.81) |
// s1 16.49-17.09 Strawberry "Pass?" | st6 17.09-18.55 Stateman | kw 18.55-19.0 Kumquat writes | frz 19.0-19.39 everyone freezes | ceil1 19.39-20.45 the detector, chirp 19.44 | k1 20.45-21.82 Kumquat | l2 21.82-22.83 Lemon |
// k2 22.83-24.12 Kumquat | o5 24.12-25.27 Onion | s2 25.27-26.41 Strawberry, the detector inset chirps (25.52) | t1 26.41-27.39 the sweep of heads | s3 27.39-27.94 "No." Binder pops out of the laptop (27.54) |
// b1 27.94-28.88 Binder "Great! I'll help." (grin 28.49) | fin 28.88-31.23 Binder hops onto the detector, the third chirp (29.38), the sting (29.88), Strawberry's resigned face.
// ====================================================================================================================================================================================
const CT = tl('clear');
const CC = { click: .45, hornstop: .5, clipboard: 6.081, sniffle: 9.541, stamp: 15.813, chirp: [19.448, 25.523, 29.384], binderpop: 27.542, grin: 28.492, sting: 29.884 };
for (const k in CC) CC[k] = Array.isArray(CC[k]) ? CC[k].map(CT.snapT) : CT.snapT(CC[k]);
const CPOS = { stateman: [-250, 1232], kum: [-30, 1338], onion: [170, 1242], lemon: [380, 1314], straw: [580, 1202], tom: [842, 1282], marshal: [336, 1690], cart: [-560, 1500] };
const ST_IN = route([[0, -430, 1480], [1.3, CPOS.stateman[0], CPOS.stateman[1], 'out']]);
const KQ_IN = route([[0, -520, 1520], [1.4, CPOS.kum[0], CPOS.kum[1], 'out']]);
const CSH = [
  { id: 'pan', s: 0, e: 1.30, k: 'w', pan: 1 },
  { id: 'st1a', s: 1.30, e: 3.05, k: 'w', two: ['stateman', 'kum'], z: 1.0, ty: 700 },
  { id: 'st1b', s: 3.05, e: 4.83, k: 'w', foc: 'stateman', z: 2.3, up: 150, cz: -150 },
  { id: 'st2', s: 4.83, e: 6.38, k: 'w', two: ['stateman', 'onion'], z: 1.0, ty: 720 },
  { id: 'o1', s: 6.38, e: 7.58, k: 'w', foc: 'onion', z: 2.1, up: 130, cz: -150 },
  { id: 'st3', s: 7.58, e: 8.34, k: 'w', foc: 'stateman', z: 2.6, up: 150, cz: -150 },
  { id: 'o2', s: 8.34, e: 9.95, k: 'w', foc: 'onion', z: 2.3, up: 130, cz: -150 },
  { id: 'st4', s: 9.95, e: 11.57, k: 'w', foc: 'stateman', z: 2.3, up: 150, cz: -150 },
  { id: 'o3', s: 11.57, e: 12.74, k: 'w', foc: 'onion', z: 2.2, up: 130, cz: -150 },
  { id: 'l1', s: 12.74, e: 13.95, k: 'w', foc: 'lemon', z: 2.4, up: 150, cz: -150 },
  { id: 'o4', s: 13.95, e: 15.71, k: 'w', foc: 'onion', z: 2.2, up: 130, cz: -150 },
  { id: 'pass', s: 15.71, e: 16.49, k: 'pass' },
  { id: 's1', s: 16.49, e: 17.09, k: 'w', foc: 'straw', z: 2.7, up: 150, cz: -150 },
  { id: 'st6', s: 17.09, e: 18.4, k: 'w', foc: 'stateman', z: 2.2, up: 150, cz: -150 },
  { id: 'kw', s: 18.4, e: 19.0, k: 'tag' },
  { id: 'frz', s: 19.0, e: 19.39, k: 'w', wide: 1 },
  { id: 'ceil1', s: 19.39, e: 20.45, k: 'ceil', n: 1 },
  { id: 'k1', s: 20.45, e: 21.82, k: 'w', foc: 'kum', z: 2.6, up: 110, cz: -150 },
  { id: 'l2', s: 21.82, e: 22.83, k: 'w', foc: 'lemon', z: 2.5, up: 150, cz: -150 },
  { id: 'k2', s: 22.83, e: 24.12, k: 'w', foc: 'kum', z: 2.5, up: 110, cz: -150 },
  { id: 'o5', s: 24.12, e: 25.27, k: 'w', foc: 'onion', z: 2.2, up: 130, cz: -150 },
  { id: 's2', s: 25.27, e: 26.41, k: 'w', foc: 'straw', z: 2.5, up: 150, cz: -150, inset: 1 },
  { id: 't1', s: 26.41, e: 27.39, k: 'w', wide: 1, sweep: 1 },
  { id: 's3', s: 27.39, e: 27.94, k: 'w', two: ['straw'], lap: 1, z: 1.9, ty: 760 },
  { id: 'b1', s: 27.94, e: 28.88, k: 'binder' },
  { id: 'fin', s: 28.88, e: 99, k: 'w', fin: 1 },
];
for (const sh of CSH) sh.s = sh.s === 0 ? 0 : CT.snapT(sh.s);
const cShot = lt => { let r = CSH[0]; for (const sh of CSH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const DET = { X: CPOS.straw[0], Z: 1880 };                                    /* the smoke detector on the ceiling (world X, Z; Y = the ceiling) */
const HORN_ON = lt => lt < CC.hornstop ? 1 : 0;

// ------------------------------------------------------------------ the cast of `clear`
const panelBtnAt = () => { const p = wallAt(PANEL.X, PANEL.Y, PANEL.s); return [p.x + 153 * p.s, p.y - 11 * p.s]; };   /* the SILENCE button's centre on the screen (the panel's own layout: 106..200, -40..18) */
const sweepYaw = (lt, t0, a, b) => lerp(a, b, easeIO(sg(lt, t0, t0 + .22)));   /* a head turns from a to b starting at t0 (the sweep of heads at "diem") */
function castC(lt, sh) {
  const C = {}, b = CT.bS, e = CT.bE, inB = id => lt >= b(id) && lt < e(id), id = sh.id;
  const frozen = lt >= 19.0 && lt < 20.45, tt = frozen ? 19.0 : lt, hand = lt >= 6.081, fly = lt >= 5.72 && lt < 6.081;
  /* the Marshal: reaches for SILENCE, presses it on the click, backs off; then stands by the panel, arms folded in spirit */
  const [bx, by] = panelBtnAt(), qm = wpos(CPOS.marshal[0], CPOS.marshal[1]);
  const mo = Object.assign({}, qm, { t: tt, yaw: -.75, headYaw: -.7, who: 'marshal', look: [-.8, .1], expr: 'neutral' });
  const mc = A15.centre(Object.assign({ kind: 'pom' }, qm)), reach = ss(lt, .08, .4) * (1 - ss(lt, .62, .95)), poke = pulse(lt, CC.click, 26, .09) * 8;
  let tx = (bx - mc[0]) / qm.s, ty = (by - mc[1]) / qm.s; const tm = Math.hypot(tx, ty), RMAX = 150; if (tm > RMAX) { tx *= RMAX / tm; ty *= RMAX / tm; }
  C.marshal = A6.pom(Object.assign(mo, { arms: { l: 'hold', r: 'rest' }, hand: { l: 'point' }, grip: { l: [lerp(-70, tx - 6 + poke, reach), lerp(40, ty, reach)] } }));
  /* the State: in through the doorway, then standing */
    const sIdle = { t: tt, who: 'star', yaw: K([[0, .2], [1.5, .55], [4.8, .6], [8, .5]], lt), headYaw: lt > 26 ? sweepYaw(lt, 26.85, .6, .95) : K([[0, .3], [1.5, .6]], lt), expr: (inB('st3') || inB('st5') || (lt >= 10.1 && lt < 11.4)) ? 'stateman_brow' : 'neutral', noted: ss(lt, 18.0, 18.8) < 1 && lt > 18.0 ? sg(lt, 18.0, 18.8) : 0, brow: undefined };
  C.stateman = person(A14.stateman, ST_IN, lt, Object.assign(sIdle, hand ? { pose: 'read', hold: { l: 'fp18_drillclip', r: 'fp14_pen' }, clipScale: .25, clipAt: [.02, .55] } : fly ? { pose: 'read', hold: { r: 'fp14_pen' } } : { pose: 'carry' }));
  const wr = lt >= 22.9 && lt < 24.1;
  C.kum = person(A14.kumquat, KQ_IN, lt, { t: tt, who: 'kum', pose: wr || (lt >= 18.55 && lt < 19.0) ? 'write' : 'carry', writing: wr || (lt >= 18.55 && lt < 19.0) ? 1 : 0, tongue: wr ? 1 : 0,
    yaw: K([[0, .3], [1.65, -.45]], lt), headYaw: lt > 26 ? sweepYaw(lt, 26.93, -.4, .8) : lt < 20.4 ? -.4 : K([[20.4, -.4], [21.0, -.1]], lt), expr: lt >= 20.45 && lt < 21.8 ? 'kum_puzzled' : lt >= 22.8 && lt < 24.1 ? 'kum_eager' : 'kum_eager', look: lt >= 19.45 && lt < 21.0 ? [0, -.9] : [.3, .1] });
  /* Onion: holds the log until it changes hands (6.08), then talks with her hands; crying throughout */
  const sob = Math.max(0, 1 - Math.abs(lt - CC.sniffle - .12) / .5);
  C.onion = A15.onion(Object.assign(wpos(CPOS.onion[0], CPOS.onion[1]), { t: tt, pose: 'free', arms: { l: hand ? 'rest' : (lt > 5.2 ? 'offer' : 'hold'), r: inB('o4') ? 'offer' : 'rest' }, grip: { l: [-70, 66] }, hold: hand || fly ? {} : { l: 'fp18_drillclip' }, clipScale: .26, clipAt: [.04, .88], clipRot: -.05,
    yaw: -.5, headYaw: sweepYaw(lt, 26.95, -.4, .55), expr: 'onion_cry', cry: .62, sob, look: [-.6, .1], who: 'onion' }));
  C.lemon = person(A7.lemon, () => CPOS.lemon, lt, { t: tt, yaw: -.35, headYaw: lt > 26 ? sweepYaw(lt, 27.09, -.3, .5) : -.3, look: inB('l1') || inB('l2') ? [-.2, 0] : [-.7, 0], expr: 'neutral', lid: .32, acc: ['readers', 'lanyard7'], face: { curve: .02 }, who: 'lemon', arms: { l: 'rest', r: 'rest' } });
  const sA = lt >= 16.49 && lt < 17.09;
  C.straw = person(A11.straw, () => CPOS.straw, lt, { t: tt, yaw: -.25, headYaw: K([[0, -.4], [26.6, -.3], [27.2, -.1]], lt), look: lt < 16.4 ? [-.7, .1] : sA ? [-.9, .15] : (lt >= 19.45 && lt < 21.0) || (lt >= 25.5 && lt < 25.95) ? [0, -.8] : lt >= 28.0 ? [.05, .05] : [-.5, .1], expr: 'dead', lid: sA ? .3 : lt > 29.5 ? K([[29.5, .5], [29.9, .46], [30.12, .04], [30.45, .04], [30.75, .46]], lt) : .5, squash: .05 * ss(lt, 29.95, 30.3) * (1 - ss(lt, 30.5, 31.0)), plant: true, who: 'straw', arms: { l: 'rest', r: 'rest' }, browUp: sA ? 8 : 0 });
  C.tom = person(A15.tomato, () => CPOS.tom, lt, { t: tt, tomPose: 'fruit', yaw: -.4, headYaw: lt < 26.8 ? -.4 : -.55, look: [-.6, .05], who: 'tom', arms: { l: 'hold', r: lt >= 26.5 && lt < 27.6 ? 'offer' : 'rest' } });
  return C;
}

// ------------------------------------------------------------------ cameras and the draw of the world
let CFR = null;
function camC(lt) {
  const sh = cShot(lt), u = sg(lt, sh.s, Math.min(sh.e, sh.s + 3));
  const wide = sh.wide || sh.sweep;
  if (sh.pan) S13.cam('station', { cz: -300, cx: lerp(250, 270, u), cy: 380 });
  else if (sh.fin) S13.cam('station', { cz: -390, cx: CPOS.straw[0], cy: 380 });
  else if (wide) S13.cam('station', { cz: -700, cx: 275, cy: 380 });
  else if (sh.two) S13.cam('station', { cz: -300, cx: sh.lap ? 500 : 0 + (sh.two[1] === 'onion' ? 60 : -40), cy: 380 });
  else S13.cam('station', { cz: sh.cz ?? -150 });
  const C = castC(lt, sh);
  CFR = { C, sh };
  const sway = { x: 2.2 * hnoise(lt, 1.3, 1), y: 1.6 * hnoise(lt, 1.1, 2), r: .0015 * hnoise(lt, .9, 3) };
  if (sh.k === 'pass' || sh.k === 'ceil' || sh.k === 'binder' || sh.k === 'tag') zoomTo(540, 960, 1);
  else if (sh.pan) { const bb = panelBtnAt(); zoomTo(bb[0] + 20, bb[1] + 170, 1.6 + .06 * u); }
  else if (sh.wide) zoomTo(540, 860, 1);
  else if (sh.fin) { zoomTo(540, 700, 1.4 + .05 * u);
  } else if (sh.two && sh.lap) { const g = lapGeom(); const [fx, fy] = faceC(C.straw); zoomTo((g.x + fx) / 2, (g.y + fy) / 2 + 40, sh.z + .12 * u); }
  else if (sh.two) frameGroup(sh.two.map(n => [C[n], 30]), { mx: 40, ty: sh.ty, zMax: 2.1, k: 1 + .05 * u });
  else { faceZoom0(C[sh.foc], sh.z + .2 * u, sh.up); CAM.x -= (sh.dx || 0) / CAM.z; }
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
}
function drawRoomC(lt, sh, noCounter) {
  const k = lt;
  const strobe = lt < CC.hornstop && window.FX18 ? FX18.strobe(lt) : 0;
  const press = lt >= CC.click - .06 && lt < CC.click + .3 ? { id: 'silence', k: ss(lt, CC.click - .06, CC.click) * (1 - ss(lt, CC.click + .12, CC.click + .3)) } : null;
  const panel = lt < CC.hornstop ? { state: 'alarm', blink: HORN_ON(lt), press, lcd: ['CODE RED', 'UNIT B   ALARM'] } : { state: 'trouble', lcd: ['TROUBLE ZONE 3', 'PENDING'], leds: { power: 1, trouble: 1, silenced: 1 }, press };
  const calls = i => (i === 9 || i === 22) ? [S13.CALLCOL.amber, .6 + .4 * Math.sin(lt * 2.2 + i)] : null;
  const R = drawRoom(lt, { sky: 1, min: 25, hr: 8, calls, exitGlow: 1, lampsOn: 1, strobe, panel });
  if (!noCounter) S13.counter({ t: lt, phoneRing: 0, plaque: false });
  S13.medCart(CPOS.cart[0], CPOS.cart[1], { t: lt });
  if (!noCounter && !sh.lap) laptopOnCounter(lt, {});
  const warm = ss(lt, CC.hornstop, CC.hornstop + .8);
  S13.lightMap({ ambient: 'rgb(' + Math.round(88 + 12 * warm) + ',' + Math.round(80 + 12 * warm) + ',' + Math.round(108 - 4 * warm) + ')', lights: R.lights.concat([{ x: 540, y: 1180, r: 1100, color: '255,214,170', a: .3 + .15 * warm, sy: .5 }]) });
  return R;
}
function drawC(lt) {
  const { C, sh } = CFR;
  const warm = ss(lt, CC.hornstop, CC.hornstop + .8);
  S13.light('dusk', { keyA: .3 + .06 * warm, keyColor: warm > .5 ? '#ffe2bc' : '#ffd9b0', rimA: .5, shadowA: .38, back: { color: '255,176,110', a: .22, w: 12 }, frontDark: .04 });
  V2.opts.reflect = true;
  const insertK = sh.k !== 'w';
  const dofPx = insertK ? 14 : sh.pan ? 0 : sh.wide ? 0 : sh.fin ? 7 : 10;
  const block = () => drawRoomC(lt, sh);
  if (dofPx) V2.dof(dofPx, block); else block();
  if (insertK) return;
  const ord = ['marshal', 'stateman', 'kum', 'onion', 'lemon', 'straw', 'tom'];
  const show = n => {
    if (sh.pan) return n === 'marshal' || n === 'stateman' || n === 'kum';
    if (n === 'marshal') return false;
    if (sh.fin || sh.lap) return n === 'straw';
    return true;
  };
  const list = ord.filter(show).map(n => [n, C[n]]).sort((a, b) => a[1].y - b[1].y);
  for (const [n, o] of list) {
    const f = inFrame(o), focus = n === sh.foc || (sh.two && sh.two.indexOf(n) >= 0);
    if (!focus && !sh.pan && !sh.wide && !sh.fin && (!f.inter || !f.whole)) continue;
    if ((n === 'stateman' || n === 'kum') && o.y < wpos(0, 1890).y) { ctx.save(); S13.clipPoly(S13.wallPoly(ZB, LAY.doorway.x0, 0, LAY.doorway.x1, LAY.doorway.y1)); drawBg(o); ctx.restore(); continue; }
    if (sh.pan && !f.inter) continue;
    if (n === 'stateman' || n === 'kum') o.transit = lt < 1.6;
    drawChar(o);
  }
  if (lt >= 5.72 && lt < CC.clipboard && (sh.two || sh.wide)) drawClipFlight(lt, C);
  if (sh.lap) { laptopOnCounter(lt, {}); lapPopC(lt); }
  if (sh.fin) finExtras(lt);
}

// ------------------------------------------------------------------ inserts of `clear`
/* ---- the drill log with the PASS stamp: a rubber stamp comes down, lands on 15.81, lifts and leaves PASS */
const PASSX = { x: 540, y: 806, s: 1.5 };
function stampTool(c, x, y, lift) {   /* a rubber stamp in a glove: (x, y) = the contact point; lift 0..1 raises it */
  const yy = y - lift * 1400;
  c.save(); c.translate(x, yy); c.lineJoin = 'round'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 18 + 26 * lift; c.shadowOffsetY = 10 + 18 * lift;
  c.fillStyle = '#8a1a22'; c.strokeStyle = '#15111a'; c.lineWidth = 4; rr(-132, -30, 264, 30, 8); c.fill(); c.stroke();
  c.fillStyle = lg(-110, 0, 110, 0, [[0, '#d6a265'], [.5, '#f0c68a'], [1, '#b98348']]); rr(-110, -92, 220, 64, 12); c.fill(); c.stroke();
  c.fillStyle = lg(-34, 0, 34, 0, [[0, '#b98348'], [.5, '#f0c68a'], [1, '#a2713c']]); rr(-34, -204, 68, 116, 16); c.fill(); c.stroke();
  c.fillStyle = '#f0c68a'; c.beginPath(); c.ellipse(0, -210, 54, 26, 0, 0, TAU); c.fill(); c.stroke();
  c.shadowColor = 'transparent'; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -246, 62, 40, 0, 0, TAU); c.fill(); c.stroke();    /* the glove over the knob */
  for (const dx of [-36, -12, 12, 36]) { c.beginPath(); c.ellipse(dx, -214, 13, 18, 0, 0, TAU); c.fill(); c.stroke(); }
  c.restore();
}
function insPass(lt, sh) {
  veil(.66);
  const T0 = CC.stamp, u = sg(lt, T0 - .12, T0), drift = 1 + .02 * sg(lt, sh.s, sh.e);
  ctx.save(); ctx.translate(PASSX.x, PASSX.y); ctx.scale(drift, drift); ctx.translate(-PASSX.x, -PASSX.y);
  window.P18.drillLog(ctx, { x: PASSX.x, y: PASSX.y, s: PASSX.s, rot: -.02, stamp: u, stampAge: lt - T0, t: lt });
  const sx = PASSX.x + 10 * PASSX.s, sy = PASSX.y + 266 * PASSX.s;
  const down = eo(sg(lt, sh.s, T0)), lift = ss(lt, T0 + .05, T0 + .22);
  if (lt < T0 + .26) stampTool(ctx, sx, sy, (1 - down) * .9 + lift);
  ctx.restore();
  if (lt >= T0 && lt < T0 + .5) { const q = c01((lt - T0) / .5); V2.glow(sx, sy, 300 * q + 80, '255,60,60', .22 * (1 - q), 'screen', .2); }
}
/* ---- the ceiling and the detector in screen space: an insert (the whole frame) and a round inset in a corner */
function ceilingBack(c, cx, cy, r, push) {   /* acoustic tiles, a lamp panel glowing at one corner */
  c.save();
  c.fillStyle = lg(0, cy - r, 0, cy + r, [[0, '#d8d2c6'], [1, '#aaa59c']]); c.fillRect(cx - r - 4, cy - r - 4, 2 * r + 8, 2 * r + 8);
  c.strokeStyle = 'rgba(70,66,60,.3)'; c.lineWidth = 3 * push;
  for (let i = -6; i <= 6; i++) { const o = i * 190 * push; c.beginPath(); c.moveTo(cx - r - 10, cy + o + 60 * push); c.lineTo(cx + r + 10, cy + o + 60 * push); c.stroke(); c.beginPath(); c.moveTo(cx + o + 90 * push, cy - r - 10); c.lineTo(cx + o + 90 * push, cy + r + 10); c.stroke(); }
  c.fillStyle = 'rgba(255,248,226,.9)'; rr(cx - r * 1.05, cy - r * 1.05, r * .72, r * .5, 8); c.fill(); V2.glow(cx - r * .7, cy - r * .8, r * 1.3, '255,236,200', .3, 'screen', .2);
  c.restore();
}
const CHIRP_AGE = lt => { for (const t0 of CC.chirp) if (lt >= t0 && lt < t0 + .6) return lt - t0; return -1; };
const ledAt = lt => { const a = CHIRP_AGE(lt); return a >= 0 && a < .16 ? 1 : a >= .16 && a < .22 ? .4 : 0; };
function insCeil(lt, sh) {
  const u = sg(lt, sh.s, sh.e), s = lerp(3.2, 3.5, u);
  ceilingBack(ctx, 540, 900, 1100, 1);
  const a = CHIRP_AGE(lt);
  if (a >= 0) { V2.ring(540 + 112 * s * .8, 900 - 160 * s * .55, c01(a / .5), { r0: 40, r1: 520, color: '255,200,160', lw: 6, alpha: .55, bloom: 0 }); }
  window.P18.smokeDetector(ctx, { x: 540, y: 900, s, led: ledAt(lt), t: lt, sq: 1 });
  veilEdges();
}
const veilEdges = () => { const g = V2.radial(540, 900, 420, 1200, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,8,20,.55)']]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
function insetDet(lt) {   /* the round inset over Strawberry's close-up: the detector, chirping */
  const t0 = CC.chirp[1] - .08, t1 = CC.chirp[1] + .42;
  if (lt < t0 || lt > t1 + .15) return;
  const k = eb(sg(lt, t0, t0 + .12)) * (1 - ss(lt, t1, t1 + .15)), cx = 858, cy = 372, r = 136 * Math.max(.01, k);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
  ceilingBack(ctx, cx, cy, r, .3);
  window.P18.smokeDetector(ctx, { x: cx, y: cy, s: 1.2 * Math.max(.01, k), led: ledAt(lt), t: lt, sq: 1 });
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  const a = CHIRP_AGE(lt); if (a >= 0 && a < .45) V2.ring(cx, cy, a / .45, { r0: r, r1: r + 90, color: '255,210,170', lw: 6, alpha: .5, bloom: 0 });
}
/* ---- the world extras: Binder pops out of the laptop (27.54); on `fin` he hops up to the detector on the ceiling and the LED answers */
function lapPopC(lt, big) {
  if (lt < CC.binderpop) return;
  const g = lapGeom(), kk = sg(lt, CC.binderpop, CC.binderpop + .16), f = ss(lt, CC.binderpop + .04, CC.binderpop + .5), ant = ss(lt, CC.binderpop - .3, CC.binderpop);
  V2.glow(g.x, g.y, 80 + 70 * ant, '190,255,220', Math.min(1, .25 + .6 * ant) * (1 - .5 * f), 'screen', .4);
  if (kk < 1) V2.ring(g.x, g.y - 6, kk, { r0: 8, r1: 90, color: '255,236,160', lw: 6, alpha: .9 });
  drawChar(A15.binderSmall({ x: g.x, y: lerp(g.y + 10, g.y - g.h * .75, f) - Math.sin(PI * f) * 20 + 3 * Math.sin(lt * 3.2) * f, s: .72 * g.w / 300 * eb(kk), center: true, noLegs: true, who: 'bind', t: lt, pose: 'ears', grin: .25, look: [-.6, .2], hover: 6 }));
}
function finExtras(lt) {
  const dp = V2.p2(DET.X, LAY.ch, DET.Z), k = kzP(DET.Z), led = ledAt(lt) + .85 * Math.max(0, 1 - Math.abs(lt - CC.sting - .05) / .18), sq = Math.max(.42, (LAY.ch - V2.P.cy) / (DET.Z - V2.P.cz));
  window.P18.smokeDetector(ctx, { x: dp[0], y: dp[1], s: k * 1.9, sq, led: Math.min(1, led), t: lt });
  /* Binder floats in from the left of the frame along an arc and clips himself onto the detector on the third chirp (29.38); the LED answers, then the sting */
  const t1 = CC.chirp[2] - .02, u = sg(lt, 28.9, t1), e = u * u * (3 - 2 * u), land = lt >= t1;
  const sx = dp[0] - 560, sy = dp[1] + 420, sb = .62 * k * 1.7;
  const bx = lerp(sx, dp[0] - 46 * k * 1.9 * (land ? 1 : e), e), by = lerp(sy, dp[1] - 62 * k, e) - 150 * Math.sin(PI * u) - 36 * Math.abs(Math.sin(u * PI * 3)) * (1 - u);
  if (lt >= CC.chirp[2] && lt < CC.chirp[2] + .5) V2.ring(dp[0], dp[1], (lt - CC.chirp[2]) / .5, { r0: 20, r1: 280, color: '255,200,170', lw: 5, alpha: .6, bloom: 0 });
  const bump = land ? Math.max(0, Math.sin(PI * c01((lt - t1) / .22))) : 0;
  const grin = land ? ss(lt, t1, t1 + .2) : .35, glint = lt >= CC.sting ? Math.max(0, 1 - (lt - CC.sting) / .5) : 0;
  ctx.save(); ctx.translate(bx, by); ctx.scale(1 + .1 * bump, 1 - .16 * bump); ctx.translate(-bx, -by);
  drawChar(A15.binderSmall({ x: bx, y: by, s: sb * (land ? 1 : eb(c01(u * 3))), center: true, noLegs: true, who: 'bind', t: lt, yaw: 0, pose: land ? 'cheer' : 'ears', grin, glint, look: [.1, .5], hover: 4, transit: !land }));
  ctx.restore();
}
const handOf = (o, g) => { const [cx, cy] = A15.centre(o); return [cx + g[0] * o.s, cy + g[1] * o.s]; };
function drawClipFlight(lt, C) {   /* the log in the air between Onion's hand and the Stateman's (the clipboard sound is at 6.08) */
  const u = sg(lt, 5.72, CC.clipboard), e = u * u * (3 - 2 * u), ho = handOf(C.onion, [-70, 66]), hs = handOf(C.stateman, [-46, 70]);
  const S = lerp(.26 * C.onion.s, .25 * C.stateman.s, e), at = [lerp(.04, .02, e), lerp(.88, .55, e)];
  const hx = lerp(ho[0], hs[0], e), hy = lerp(ho[1], hs[1], e) - 30 * Math.sin(PI * e);
  window.P18.drillLog(ctx, { x: hx + (.5 - at[0]) * 520 * S, y: hy + (.5 - at[1]) * 724 * S, s: S, rot: -.05 + .12 * Math.sin(PI * e), hero: false });
}

/* ---- Kumquat's field notes: he writes TAG? (pencil on the State's form) */
const TAGT = { t0: 18.46, t1: 18.86 };
function insTag(lt, sh) {
  veil(.7);
  const k = sg(lt, TAGT.t0, TAGT.t1);
  const content = (c, H, cap) => {
    UI.label('SURVEY NOTES', 0, -246, Object.assign({ size: 50, font: 'Bangers', weight: 400, fill: '#33527a', spacing: 2, maxW: 380, hero: H(50) }, cap));
    c.strokeStyle = '#33527a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-204, -214); c.lineTo(204, -214); c.stroke();
    c.strokeStyle = 'rgba(70,80,110,.3)'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-204, -140 + i * 76); c.lineTo(204, -140 + i * 76); c.stroke(); }
    UI.label('TAG?', -10, -106, Object.assign({ size: 124, weight: 900, italic: true, fill: '#3a3a46', maxW: 360, reveal: k, hero: H(124) }, cap));
    if (k >= 1) { c.strokeStyle = '#3a3a46'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.ellipse(-8, -108, 178, 64, -.03, 0, TAU * c01((lt - TAGT.t1) / .14)); c.stroke(); }
  };
  P18x().drillLog(ctx, { x: 540, y: 806, s: 1.5, rot: .03, content, t: lt });
  /* the pencil, writing */
  const tx = 540 + (-200 + 390 * k) * 1.5 * .93, ty = 806 + (-96) * 1.5;
  ctx.save(); ctx.translate(k < 1 ? tx : 540 + 190, k < 1 ? ty : 806 - 100); ctx.rotate(1.85 + .05 * Math.sin(lt * 32));
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#e9c590'; ctx.strokeStyle = '#15111a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -28); ctx.lineTo(10, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a3340'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, -11); ctx.lineTo(4, -11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2c230'; rr(-11, -230, 22, 204, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b9bfc8'; ctx.fillRect(-11, -236, 22, 12); ctx.fillStyle = '#e8a0a0'; rr(-11, -262, 22, 28, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}

//@@CLEARINS2@@
const CSC = {
  shot: lt => cShot(lt).id,
  cam: camC,
  draw: drawC,
  fx: lt => {
    const warm = ss(lt, CC.hornstop, CC.hornstop + 1.0);
    return { bloom: .5 + .8 * Math.max(0, 1 - Math.abs(lt - CC.sting - .05) / .25), vignette: .42, grain: .045, contrast: .13, sat: .1, tint: [['#ffb878', .1 * warm, 'soft-light']], fade: lt < .25 ? 1 - lt / .25 : 0, fadeColor: '16,12,24' };
  },
  blur: lt => (lt > 5.78 && lt < 6.08) || (lt > 28.99 && lt < 29.37) || (lt > .1 && lt < .5 && cShot(lt).pan) ? 4 : 1,
  over: lt => {
    const sh = CFR.sh;
    if (sh.k === 'pass') insPass(lt, sh); else if (sh.k === 'tag') insTag(lt, sh); else if (sh.k === 'ceil') insCeil(lt, sh); else if (sh.k === 'binder') insBinder(lt, sh, CC.grin);
    if (sh.inset) insetDet(lt);
    if (window.FX18 && lt < CC.hornstop + .3) {   /* the last red pulse of the horn, then the strobes are dead */
      const env = lt < CC.hornstop ? 1 : 1 - (lt - CC.hornstop) / .3, k = FX18.strobe(lt);
      FX18.wash(ctx, { color: '#ff2020', alpha: .3 * env * (.75 + .25 * FX18.hornOn(lt)), mode: 'multiply' });
      if (lt < CC.hornstop) FX18.wash(ctx, { color: '#ffeedd', alpha: .26 * k, mode: 'add' });
    }
  },
  clock: () => CT.SCN.clock, label: () => CT.SCN.label,
};
window.__EP18_SCENES.clear = CSC;
})();

