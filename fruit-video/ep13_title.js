'use strict';
/* SHIFT HAPPENS, Episode 13: The Float Pool. Scene module E13-A (1 of 2): the scenes `title` and `end` (registered on window.__EP13_SCENES).
 * (placeholder header: the shot lists are written at the end of the build)
 */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo } = window.H6;
window.__EP13_SCENES = window.__EP13_SCENES || {};
const E = window.E13A = window.E13A || {};   /* helpers shared with ep13_crew.js (this file loads first) */

// the episode's graphic palette
const CYAN = '#4de3ff', ALARM = '#ff3b4e', GOLD = '#ffc83d', INKC = '#15111a';
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const ring = (lt, t0, tau) => lt < t0 ? 0 : Math.exp(-(lt - t0) / tau);
const mixC = (a, b, k) => V2.rgba(V2.mix(a, b, k), 1);

// ------------------------------------------------------------------ offscreen helpers (flat art only: no text is ever drawn into a cache)
const mkCv = (w, h) => { const c = V2.mk(w, h); c.__txOK = true; return c; };
function intoCv(cv, fn) {
  const prev = ctx, g = cv.getContext('2d');
  ctx = g; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  try { fn(g); } finally { g.restore(); ctx = prev; }
}
/* draw a character into a buffer: the buffer's pixel (ox, oy) is where the character's feet are (o.x and o.y are ignored) */
E.charTo = (cv, ox, oy, o) => intoCv(cv, g => {
  REG.suppress++;
  try { g.translate(ox, oy); drawChar(Object.assign({}, o, { x: 0, y: 0, noShadow: true, noReflect: true, transit: false })); } finally { REG.suppress--; }
});
/* flatten a buffer to one colour (keeps its alpha): a silhouette */
E.flatten = (cv, color) => intoCv(cv, g => { g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, cv.width, cv.height); });

// ============================================================================ title: the combination dial
const DC = [540, 960];                 // the centre of the vault door and of its dial (world coordinates)
const R_DIAL = 300, R_PLATE = 334, R_DOOR = 440, R_FRAME = 580;
const TICK = TAU / 100;                // one tick of the dial
const LOCK_AT = 30;                    // the number the dial lands on: thirty minutes

// the ratchet: the dial turns fast and blurred, then clicks over one tick at a time, each click later than the last, and the final click lands just before the clunk
let SCHED = null;
function sched() {
  if (SCHED) return SCHED;
  const t0 = B('logo').s, tL = t0 + 2.38;
  const clicks = [tL];
  for (let d = .30, t = tL; d >= .04; d *= .8) { t -= d; clicks.unshift(t); }
  const sd = clicks.map((c, j) => j ? Math.min(.05, .6 * (c - clicks[j - 1])) : .03);   // how long each snap takes
  const tB0 = clicks[0] - sd[0], T_A = tB0 - t0, wB = 30, w0 = 520;                       // phase A runs t0 .. tB0 and ends at 30 ticks per second
  SCHED = { t0, tL, clicks, sd, M: clicks.length, tB0, T_A, wB, w0 };
  E.titleClicks = clicks.map(c => +c.toFixed(3));
  return SCHED;
}
/* the dial reading in ticks (decreasing: the dial turns clockwise); the index at the top reads this number */
function dialVal(lt) {
  const S = sched();
  if (lt < S.tB0) {
    const s = seg(lt, S.t0, S.tB0), DA = S.wB * (S.tB0 - lt) + (S.w0 - S.wB) * S.T_A * Math.pow(1 - s, 3) / 3;
    return LOCK_AT + S.M + DA;
  }
  let v = LOCK_AT;
  for (let j = 0; j < S.M; j++) {
    const c = S.clicks[j], p = easeOut(easeOut(seg(lt, c - S.sd[j], c)));
    v += 1 - p;
    if (lt > c) v -= .10 * Math.exp(-(lt - c) / .035) * Math.sin((lt - c) * 85) * (j > S.M - 6 ? 1 : .3);   // the ring-out of the detent
  }
  return v;
}
/* how far the index pawl is pushed out by the tooth passing under it (0..1) */
function pawlK(lt) {
  const S = sched();
  let k = 0;
  for (let j = 0; j < S.M; j++) {
    const c = S.clicks[j];
    if (lt >= c - S.sd[j] && lt < c) k = Math.max(k, seg(lt, c - S.sd[j], c));
    else if (lt >= c && lt < c + .04) k = Math.max(k, 1 - seg(lt, c, c + .04));
  }
  return k;
}
// the lock: bolts shoot at the clunk
const lockT = () => B('logo').s + 2.4;

// ------------------------------------------------------------------ materials
function steelConic(cx, cy, a0, stops) {
  const g = ctx.createConicGradient(a0, cx, cy);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
const STEEL = [[0, '#9db0bc'], [.1, '#e9f2f6'], [.22, '#72848f'], [.34, '#c3d2da'], [.47, '#566673'], [.6, '#cfdce3'], [.72, '#6f808c'], [.86, '#e4eef2'], [1, '#9db0bc']];
const DARK_STEEL = [[0, '#44525d'], [.1, '#7f919c'], [.22, '#2c3842'], [.34, '#6b7c88'], [.47, '#222c35'], [.6, '#76878f'], [.72, '#303c46'], [.86, '#7b8d98'], [1, '#44525d']];

// ------------------------------------------------------------------ the wall, the door and its frame: painted once
let WALL = null, DOOR = null, FOG = null;
const WALL_X0 = -320, WALL_Y0 = -1000, WALL_W = 1720, WALL_H = 3500, WALL_K = .6;
function buildWall() {
  WALL = mkCv(Math.round(WALL_W * WALL_K), Math.round(WALL_H * WALL_K));
  intoCv(WALL, g => {
    g.scale(WALL_K, WALL_K); g.translate(-WALL_X0, -WALL_Y0);
    const FLOOR = 1800;
    g.fillStyle = V2.grad(0, WALL_Y0, 0, FLOOR, [[0, '#03131a'], [.45, '#0a3039'], [.72, '#0d3b46'], [1, '#07242c']]); g.fillRect(WALL_X0, WALL_Y0, WALL_W, FLOOR - WALL_Y0);
    // big steel wall panels: a seam every 280 px, a bevel on each, rivets along it
    for (let x = WALL_X0 - 40; x < WALL_X0 + WALL_W + 40; x += 280) {
      g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x, WALL_Y0, 5, FLOOR - WALL_Y0);
      g.fillStyle = 'rgba(160,230,240,.09)'; g.fillRect(x + 5, WALL_Y0, 3, FLOOR - WALL_Y0);
      for (let y = WALL_Y0 + 60; y < FLOOR - 40; y += 150) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 22, y + 2, 7, 0, TAU); g.fill(); g.fillStyle = 'rgba(190,240,250,.2)'; g.beginPath(); g.arc(x + 21, y, 6, 0, TAU); g.fill(); }
    }
    // horizontal weld lines and grime streaks so the panels are not flat
    const R = V2.rng(131);
    for (let i = 0; i < 90; i++) {
      const x = WALL_X0 + R() * WALL_W, y = WALL_Y0 + R() * (FLOOR - WALL_Y0), h = 80 + R() * 400, w = 6 + R() * 26;
      g.fillStyle = V2.grad(0, y, 0, y + h, [[0, 'rgba(0,0,0,0)'], [.5, `rgba(0,0,0,${.05 + R() * .12})`], [1, 'rgba(0,0,0,0)']]); g.fillRect(x, y, w, h);
    }
    for (const y of [-300, 420, 1300]) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(WALL_X0, y, WALL_W, 4); g.fillStyle = 'rgba(160,230,240,.07)'; g.fillRect(WALL_X0, y + 4, WALL_W, 3); }
    // the floor: a dark glossy slab, a baseboard where it meets the wall
    g.fillStyle = '#0a1c23'; g.fillRect(WALL_X0, FLOOR - 46, WALL_W, 46);
    g.fillStyle = 'rgba(150,230,240,.16)'; g.fillRect(WALL_X0, FLOOR - 46, WALL_W, 3);
    g.fillStyle = V2.grad(0, FLOOR, 0, WALL_Y0 + WALL_H, [[0, '#071a21'], [.25, '#04101a'], [1, '#020609']]); g.fillRect(WALL_X0, FLOOR, WALL_W, WALL_Y0 + WALL_H - FLOOR);
    for (let i = 0; i < 14; i++) { const y = FLOOR + 30 + Math.pow(i / 13, 1.7) * 520; g.fillStyle = 'rgba(120,200,215,.06)'; g.fillRect(WALL_X0, y, WALL_W, 2); }
  });
}
function buildDoor() {
  const S = 1.25, N = 2 * R_FRAME;
  DOOR = mkCv(Math.round(N * S), Math.round(N * S));
  intoCv(DOOR, g => {
    g.scale(S, S); g.translate(R_FRAME, R_FRAME);
    const circle = (r, a0 = 0, a1 = TAU) => { g.beginPath(); g.arc(0, 0, r, a0, a1); };
    // the frame: a recessed ring, dark, with twelve sockets for the bolts
    circle(R_FRAME); g.fillStyle = V2.radial(0, 0, R_DOOR, R_FRAME, [[0, '#050b10'], [.15, '#13202a'], [.7, '#22333f'], [1, '#101b23']]); g.fill();
    circle(R_FRAME - 3); g.strokeStyle = 'rgba(190,235,245,.28)'; g.lineWidth = 4; g.stroke();
    circle(R_FRAME + 4); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 8; g.stroke();
    for (let j = 0; j < 12; j++) {
      g.save(); g.rotate((j + .5) * PI / 6);
      g.fillStyle = '#04080b'; rr(R_DOOR + 6, -36, 96, 72, 10); g.fill();
      g.fillStyle = 'rgba(160,230,245,.1)'; g.fillRect(R_DOOR + 10, -36, 88, 3);
      g.strokeStyle = '#0c141a'; g.lineWidth = 4; rr(R_DOOR + 6, -36, 96, 72, 10); g.stroke();
      g.restore();
    }
    for (let j = 0; j < 12; j++) { const a = j * PI / 6; g.fillStyle = V2.radial(Math.cos(a) * 520 - 2, Math.sin(a) * 520 - 2, 1, 9, [[0, '#9fb3bf'], [1, '#2b3943']]); g.beginPath(); g.arc(Math.cos(a) * 520, Math.sin(a) * 520, 8, 0, TAU); g.fill(); }
    // the door: a brushed steel disc, lit from above
    circle(R_DOOR + 4); g.fillStyle = 'rgba(0,0,0,.55)'; g.fill();
    circle(R_DOOR); g.fillStyle = steelConic(0, 0, -PI / 2, STEEL); g.fill();
    circle(R_DOOR); g.fillStyle = V2.radial(0, 0, 180, R_DOOR, [[0, 'rgba(10,22,30,0)'], [.7, 'rgba(10,22,30,.22)'], [1, 'rgba(6,14,20,.62)']]); g.fill();
    g.fillStyle = V2.grad(0, -R_DOOR, 0, R_DOOR, [[0, 'rgba(255,255,255,.2)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,10,20,.4)']]); circle(R_DOOR); g.fill();
    // lathe marks: hundreds of concentric hairlines
    const R = V2.rng(77);
    g.save(); circle(R_DOOR - 2); g.clip();
    for (let i = 0; i < 260; i++) { const r = 340 + R() * 98; g.strokeStyle = R() > .5 ? `rgba(255,255,255,${.03 + R() * .05})` : `rgba(0,10,20,${.04 + R() * .07})`; g.lineWidth = .6 + R() * 1.1; circle(r, R() * TAU, R() * TAU); g.stroke(); }
    g.restore();
    // the rim bevel and two engraved rings
    circle(R_DOOR - 7); g.strokeStyle = V2.grad(0, -R_DOOR, 0, R_DOOR, [[0, 'rgba(255,255,255,.75)'], [.5, 'rgba(255,255,255,.1)'], [1, 'rgba(0,0,0,.6)']]); g.lineWidth = 12; g.stroke();
    for (const r of [412, 388]) { circle(r); g.strokeStyle = 'rgba(0,8,16,.55)'; g.lineWidth = 3; g.stroke(); circle(r + 2.5); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.6; g.stroke(); }
    // the bolt guides: dark housings across the rim, one per bolt
    for (let j = 0; j < 12; j++) {
      g.save(); g.rotate((j + .5) * PI / 6);
      g.fillStyle = '#0c151c'; rr(R_DOOR - 58, -34, 74, 68, 8); g.fill();
      g.fillStyle = V2.grad(0, -34, 0, 34, [[0, '#3a4954'], [.5, '#1a252d'], [1, '#0a1217']]); rr(R_DOOR - 56, -32, 70, 64, 7); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 3; rr(R_DOOR - 56, -32, 70, 64, 7); g.stroke();
      g.restore();
    }
    // the dial plate: a darker raised disc with eight screws
    circle(R_PLATE + 6); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    circle(R_PLATE); g.fillStyle = steelConic(0, 0, PI / 4, DARK_STEEL); g.fill();
    circle(R_PLATE); g.fillStyle = V2.radial(0, 0, R_DIAL, R_PLATE, [[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]); g.fill();
    circle(R_PLATE - 3); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; g.stroke();
    for (let j = 0; j < 8; j++) {
      const a = (j + .5) * PI / 4 + .15; g.save(); g.translate(Math.cos(a) * (R_PLATE - 16), Math.sin(a) * (R_PLATE - 16)); g.rotate(j * 1.3);
      g.fillStyle = V2.radial(-2, -2, 1, 9, [[0, '#d9e6ec'], [1, '#4d5d69']]); g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); g.strokeStyle = '#0c151c'; g.lineWidth = 2; g.stroke();
      g.strokeStyle = '#15202a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.stroke(); g.restore();
    }
  });
}
function buildFog() {
  FOG = mkCv(2048, 1024);
  intoCv(FOG, g => {
    const R = V2.rng(9);
    for (let i = 0; i < 46; i++) {
      const x = R() * 2048, y = 100 + R() * 824, r = 140 + R() * 260, a = .05 + R() * .09;
      for (const dx of [-2048, 0, 2048]) { g.fillStyle = V2.radial(x + dx, y, 0, r, [[0, `rgba(200,240,250,${a})`], [1, 'rgba(200,240,250,0)']]); g.fillRect(x + dx - r, y - r, r * 2, r * 2); }
    }
  });
}
function haze(lt, a, y, h, speed, seed) {
  if (!FOG || a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a;
  const off = ((lt * speed + seed * 700) % 2048 + 2048) % 2048;
  for (const dx of [-2048, 0]) ctx.drawImage(FOG, 0, 0, 2048, 1024, -off + dx + 0, y, 2048, h);
  ctx.drawImage(FOG, 0, 0, 2048, 1024, -off + 2048, y, 2048, h);
  ctx.restore();
}

// ------------------------------------------------------------------ the dial itself
const KEY_ANG = -PI / 2 - .35;
function dialBase() {   // the parts that look the same however the dial is turned: bezel, face, hub (cached)
  if (dialBase.cv) return dialBase.cv;
  const S = 1.5, N = (R_DIAL + 24) * 2, cv = dialBase.cv = mkCv(Math.round(N * S), Math.round(N * S));
  intoCv(cv, g => {
    g.scale(S, S); g.translate(N / 2, N / 2);
    const circle = (r, a0 = 0, a1 = TAU) => { g.beginPath(); g.arc(0, 0, r, a0, a1); };
    circle(R_DIAL + 16); g.fillStyle = V2.radial(0, 10, R_DIAL - 6, R_DIAL + 22, [[0, 'rgba(0,0,0,.6)'], [1, 'rgba(0,0,0,0)']]); g.fill();   // its shadow on the plate
    circle(R_DIAL); g.fillStyle = steelConic(0, 0, -PI / 2, STEEL); g.fill();                                    // the knurled bezel (its grooves are drawn live)
    circle(R_DIAL - 1); g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 3; g.stroke();
    circle(R_DIAL - 14); g.fillStyle = '#05090c'; g.fill();                                                      // the face
    circle(R_DIAL - 14); g.fillStyle = V2.radial(-40, -90, 20, R_DIAL, [[0, 'rgba(70,100,115,.55)'], [.5, 'rgba(20,34,42,.35)'], [1, 'rgba(0,0,0,.25)']]); g.fill();
    circle(R_DIAL - 15); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.stroke();
    circle(122); g.fillStyle = 'rgba(0,0,0,.6)'; g.fill();                                                       // the hub
    circle(116); g.fillStyle = steelConic(0, 0, -PI / 2.3, STEEL); g.fill();
    circle(116); g.fillStyle = V2.radial(0, 0, 20, 116, [[0, 'rgba(255,255,255,.1)'], [.8, 'rgba(0,0,0,.05)'], [1, 'rgba(0,0,0,.4)']]); g.fill();
    const R = V2.rng(5);
    g.save(); circle(114); g.clip();
    for (let i = 0; i < 90; i++) { circle(10 + R() * 104, R() * TAU, R() * TAU); g.strokeStyle = R() > .5 ? `rgba(255,255,255,${.04 + R() * .08})` : `rgba(0,0,0,${.05 + R() * .1})`; g.lineWidth = .7 + R() * 1.3; g.stroke(); }
    g.restore();
    circle(116); g.strokeStyle = V2.grad(0, -116, 0, 116, [[0, 'rgba(255,255,255,.8)'], [1, 'rgba(0,0,0,.6)']]); g.lineWidth = 4; g.stroke();
    circle(54); g.fillStyle = V2.grad(0, -54, 0, 54, [[0, '#2b3841'], [1, '#0e161c']]); g.fill();               // the knob cap
    circle(54); g.strokeStyle = V2.grad(0, -54, 0, 54, [[0, 'rgba(255,255,255,.7)'], [1, 'rgba(0,0,0,.7)']]); g.lineWidth = 4; g.stroke();
    circle(36); g.fillStyle = steelConic(0, 0, 0, STEEL); g.fill(); circle(36); g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 2.5; g.stroke();
  });
  return cv;
}
const rad = (cx, cy, a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
/* the live parts of the dial: knurling that catches the light as it turns, the engraved ticks and numbers, the knob's grip notch */
function drawDial(lt, val, lit) {
  const cv = dialBase(), S = 1.5, N = cv.width / S;
  ctx.save(); ctx.translate(DC[0], DC[1]);
  ctx.drawImage(cv, -N / 2, -N / 2, N, N);
  const rot = -val * TICK;     // the dial's own turn
  // knurling: 120 grooves round the bezel; the ones facing the light flash, so the turn can be seen at any speed
  const buckets = [[], [], [], []];
  for (let i = 0; i < 120; i++) {
    const a = rot + i * TAU / 120, f = .5 + .5 * Math.cos(a - KEY_ANG), sp = hash(i * 3.7) > .93 ? .35 : 0;
    buckets[Math.min(3, Math.floor(clamp(f + sp) * 4))].push(a);
  }
  const cols = ['rgba(0,0,0,.55)', 'rgba(40,56,68,.55)', 'rgba(210,230,240,.55)', 'rgba(255,255,255,.9)'];
  ctx.lineCap = 'butt';
  buckets.forEach((arr, bi) => {
    ctx.beginPath();
    for (const a of arr) { const [x0, y0] = rad(0, 0, a, R_DIAL - 12), [x1, y1] = rad(0, 0, a, R_DIAL - 2); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
    ctx.strokeStyle = cols[bi]; ctx.lineWidth = 3; ctx.stroke();
  });
  // the engraved ticks (a hundred of them) and the figures every five
  const tickA = a => rot + a * TICK - 0;   // tick n sits at rot + n * TICK, so with val = n the tick n is at the top after the quarter turn below
  ctx.save(); ctx.rotate(-PI / 2 * 0);   // (the top of the dial is angle -PI/2: the reading is added below)
  ctx.beginPath(); ctx.strokeStyle = 'rgba(200,222,232,.55)'; ctx.lineWidth = 2.2;
  for (let n = 0; n < 100; n++) if (n % 5) { const a = -PI / 2 + (n - val) * TICK, [x0, y0] = rad(0, 0, a, R_DIAL - 56), [x1, y1] = rad(0, 0, a, R_DIAL - 40); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
  ctx.stroke();
  ctx.beginPath(); ctx.strokeStyle = 'rgba(235,246,250,.95)'; ctx.lineWidth = 3.4;
  for (let n = 0; n < 100; n += 5) { const a = -PI / 2 + (n - val) * TICK, [x0, y0] = rad(0, 0, a, R_DIAL - 66), [x1, y1] = rad(0, 0, a, R_DIAL - 38); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
  ctx.stroke();
  ctx.restore();
  // the numbers stand upright whatever the dial does (text is never turned): they ride round the ring
  const na = (.4 + .6 * seg(lt, 1.0, 1.7)) * (1 - .6 * lit);
  for (let n = 0; n < 100; n += 5) {
    const a = -PI / 2 + (n - val) * TICK, [x, y] = rad(0, 0, a, R_DIAL - 100), on = n === LOCK_AT && lit > 0;
    if (on) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(x, y, 2, 60, [[0, `rgba(77,227,255,${.55 * lit})`], [1, 'rgba(77,227,255,0)']]); ctx.fillRect(x - 60, y - 60, 120, 120); ctx.restore(); V2.emit(x + DC[0], y + DC[1], 80, '77,227,255', .5 * lit); }
    UI.label(String(n), x, y, { size: on ? 40 : 34, fill: on ? '#ffffff' : '#d4e6ee', weight: 900, hero: false, alpha: on ? 1 : na, crop: true, id: 'dialnum' + n });
  }
  // the knob: a grip notch that turns with the dial
  ctx.save(); ctx.rotate(rot);
  ctx.fillStyle = '#0a1116'; rr(-6, -112, 12, 52, 5); ctx.fill();
  ctx.fillStyle = 'rgba(77,227,255,.9)'; rr(-2.5, -108, 5, 44, 2.5); ctx.fill();
  for (let j = 0; j < 3; j++) { ctx.save(); ctx.rotate(j * TAU / 3 + .5); ctx.fillStyle = V2.radial(-2, -2, 1, 11, [[0, '#cfdde5'], [1, '#3b4a55']]); ctx.beginPath(); ctx.arc(0, 84, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#0a1116'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}
/* the fixed red index and the pawl that rides the teeth */
function drawIndex(lt, lit) {
  const k = pawlK(lt), off = 9 * k;
  ctx.save(); ctx.translate(DC[0], DC[1] - R_DIAL + 6 - off);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  ctx.fillStyle = V2.grad(0, -34, 0, 22, [[0, '#ff6a78'], [1, '#c2142a']]);
  ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(-17, -28); ctx.lineTo(17, -28); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#2a0610'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(-9, -22); ctx.lineTo(-3, 4); ctx.lineTo(-2, -22); ctx.closePath(); ctx.fill();
  ctx.restore();
  // the hairline on the face
  ctx.save(); ctx.strokeStyle = 'rgba(255,59,78,.95)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(DC[0], DC[1] - R_DIAL + 18); ctx.lineTo(DC[0], DC[1] - R_DIAL + 36); ctx.stroke(); ctx.restore();
  V2.emit(DC[0], DC[1] - R_DIAL + 10, 60, '255,59,78', .5 + .5 * lit);
}
// the lock bolts: twelve steel pins in the rim of the door, shot into the frame until the dial lands
function drawBolts(lt, t0) {
  for (let j = 0; j < 12; j++) {
    const a = (j + .5) * PI / 6, k = easeBack(seg(lt, t0 + .02 + (j % 4) * .014 + (j >> 2) * .02, t0 + .22 + (j % 4) * .014 + (j >> 2) * .02)), d = 78 * clamp(k, 0, 1.04);
    ctx.save(); ctx.translate(DC[0], DC[1]); ctx.rotate(a);
    const r0 = 380 - d, r1 = 524 - d, hw = 29;
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = -3; ctx.shadowOffsetY = 8;
    ctx.fillStyle = V2.grad(0, -hw, 0, hw, [[0, '#2a363f'], [.2, '#d8e5ec'], [.42, '#98a9b5'], [.8, '#4a5864'], [1, '#1b252d']]);
    rr(r0, -hw, r1 - r0, hw * 2, 9); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#0a1116'; ctx.lineWidth = 4; rr(r0, -hw, r1 - r0, hw * 2, 9); ctx.stroke();
    ctx.fillStyle = 'rgba(8,16,22,.55)'; ctx.fillRect(r1 - 26, -hw + 3, 20, hw * 2 - 6);          // the chamfered tip
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(r0 + 10, -hw + 5, r1 - r0 - 40, 4);
    for (const x of [r0 + 24, r0 + 54]) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, -hw + 2, 3, hw * 2 - 4); }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ the crew, in silhouette: five flat shapes standing on the floor in front of the door (painted once, drawn lit from behind)
const FEET_W = 1850, SIL_S = 1.0;
let CREW = null;
function buildCrew() {
  const SW = 620, SH = 780, FX = SW / 2, FY = SH - 40;
  const specs = [
    [A7.lemon, { arms: { l: 'hips', r: 'hold' }, hold: { r: 'clipboard' }, expr: 'smug', seed: 11 }],
    [A11.straw, { arms: { l: 'hips', r: 'rest' }, expr: 'dead', seed: 12, lift: 0 }],
    [A7.mango, { arms: { l: 'rest', r: 'hold' }, hold: { r: 'suitcase' }, expr: 'happy', seed: 13 }],
    [A10.clem, { arms: { l: 'hips', r: 'hips' }, expr: 'hopeful', seed: 14 }],
    [A7.banana, { arms: { l: 'rest', r: 'rest' }, expr: 'smug', seed: 15, rot: .05 }],
  ];
  CREW = specs.map(([ctor, extra]) => {
    const cv = mkCv(SW, SH);
    E.charTo(cv, FX, FY, ctor(Object.assign({ s: 1.5, t: 2 }, extra)));
    E.flatten(cv, '#03080c');
    return { cv, fx: FX, fy: FY, w: SW, h: SH };
  });
}
function drawCrew(lt) {
  const a = seg(lt, lockT() + .55, lockT() + 1.6);
  if (a <= 0) return;
  if (!CREW) buildCrew();
  const xs = UI.rowX(5, 40, 1040, { w: 200, centers: true });
  // the light on the floor behind and under them, and their reflection
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = a;
  ctx.fillStyle = V2.radial(540, FEET_W - 20, 10, 700, [[0, 'rgba(255,200,110,.32)'], [.5, 'rgba(255,200,110,.1)'], [1, 'rgba(255,200,110,0)']]);
  ctx.save(); ctx.translate(540, FEET_W - 20); ctx.scale(1, .2); ctx.translate(-540, -(FEET_W - 20)); ctx.fillRect(-200, FEET_W - 760, 1480, 1500); ctx.restore();
  ctx.restore();
  CREW.forEach((c, i) => {
    const k = easeOut(seg(lt, lockT() + .55 + i * .09, lockT() + 1.25 + i * .09)), s = SIL_S / 1.5, br = 1 + .006 * Math.sin(lt * 2.2 + i * 1.7);
    ctx.save(); ctx.globalAlpha = k;
    ctx.translate(xs[i], FEET_W + 30 * (1 - k));
    ctx.save(); ctx.scale(s, -s * .8); ctx.globalAlpha *= .18; ctx.drawImage(c.cv, -c.fx, -c.fy); ctx.restore();      // reflection on the glossy floor
    ctx.scale(s, s * br);
    ctx.shadowColor = 'rgba(255,196,96,.9)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = -5;
    ctx.drawImage(c.cv, -c.fx, -c.fy);
    ctx.restore();
  });
}

// ------------------------------------------------------------------ the lettering: laid out by UI.stack (centred on x 540), then drawn item by item so each one lands on its own beat
const T_ITEMS = [
  { t: 'SHIFT HAPPENS', font: 'Bangers', size: 132, fill: '#ffd60a', stroke: INKC, lw: 22, spacing: 6, shadow: 22, gap: 44 },
  { pill: 'EPISODE 13', font: 'Bangers', size: 58, spacing: 6, bg: ALARM, ink: '#ffffff', stroke: INKC, lw: 7, h: 88, gap: 40 },
  { t: 'THE FLOAT POOL', font: 'Bangers', size: 190, fill: '#ffffff', stroke: INKC, lw: 28, spacing: 6, shadow: 28, gap: 50 },
  { t: 'Every nurse deserves thirty minutes.', size: 46, weight: 900, fill: '#c9f6ff', stroke: INKC, lw: 9 },
];
const T_STACK = { cx: 540, top: 150, maxW: 960 };
let T_LAY = null;
function titleLayout() {
  if (T_LAY) return T_LAY;
  ctx.save(); ctx.globalAlpha = 0;
  const r = UI.stack(T_ITEMS, T_STACK);
  ctx.restore();
  T_LAY = { shift: r.boxes[0][0], pill: r.boxes[1], float: r.boxes[2][0], tag: r.boxes[3][0], y0: r.y0, y1: r.y1 };
  return T_LAY;
}
/* run fn with the transform of an element that pops: scale (sx, sy) about its centre, shifted dy, faded by a */
function popAbout(cx, cy, sx, sy, dy, a, fn) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy + dy); ctx.scale(sx, sy); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
function vgrad(size, font, stops) {   // a vertical gradient in the text's own frame (origin on the baseline)
  const m = UI.metrics(font, font === 'Nunito' ? 900 : 400), g = ctx.createLinearGradient(0, -m.cap * size, 0, 0);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function overTitle(lt) {
  const L = titleLayout(), ding = lockT() + .1;
  const cyOf = b => (b.y0 + b.y1) / 2;
  // a soft warm light behind the lettering, so it sits on the door's glow
  const gl = easeOut(seg(lt, ding, ding + .6));
  if (gl > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, 400, 40, 760, [[0, `rgba(255,200,100,${.2 * gl})`], [1, 'rgba(255,200,100,0)']]); ctx.fillRect(0, 0, W, 900); ctx.restore(); }
  // the shock of THE FLOAT POOL landing: a ring of light, drawn behind all the lettering
  {
    const r = seg(lt, ding + .48, ding + 1.0), b = L.float;
    if (r > 0 && r < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,214,120,${.5 * (1 - r)})`; ctx.lineWidth = 10 * (1 - r) + 2; ctx.beginPath(); ctx.ellipse(540, (b.y0 + b.y1) / 2, 200 + 520 * easeOut(r), 40 + 150 * easeOut(r), 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  }
  // 1. SHIFT HAPPENS lands on the text ding (it may not grow wider than the frame, so the pop starts at 1.3)
  {
    const k = seg(lt, ding, ding + .34), sc = lerp(1.3, 1, easeBack(k)), b = L.shift, it = T_ITEMS[0];
    if (k > 0) popAbout(b.cx, cyOf(b), sc, sc, 0, clamp(k * 4), () => UI.write(it.t, b.cx, b.base, Object.assign({}, it, { align: 'center', maxW: T_STACK.maxW, fill: vgrad(it.size, it.font, [[0, '#fff6a8'], [.55, '#ffd60a'], [1, '#ffb400']]) })));
  }
  // 2. the EPISODE pill drops in with a bounce
  {
    const k = seg(lt, ding + .2, ding + .55), sc = clamp(easeBack(k), 0, 1.25), b = L.pill, it = T_ITEMS[1];
    if (k > 0) popAbout(b.cx, b.cy, sc, sc, -30 * (1 - easeOut(k)), clamp(k * 4), () => UI.pill(it.pill, b.cx, b.cy, Object.assign({}, it, { fill: it.bg, ink: it.ink, maxW: T_STACK.maxW })));
  }
  // 3. THE FLOAT POOL comes up out of the vault: it stretches as it rises and squashes as it lands (it is as wide as the frame allows, so it never grows)
  {
    const t0 = ding + .32, fall = seg(lt, t0, t0 + .16), b = L.float, it = T_ITEMS[2];
    if (fall > 0) {
      const land = lt - (t0 + .16), spring = lt < t0 + .16 ? 0 : Math.exp(-land / .09) * Math.cos(land * 38);
      const dy = lt < t0 + .16 ? 130 * (1 - easeOut(fall)) : -9 * spring, sy = lt < t0 + .16 ? 1 + .2 * (1 - fall) : 1 - .12 * spring, sx = lt < t0 + .16 ? 1 - .03 * (1 - fall) : 1 + .03 * spring;
      popAbout(b.cx, cyOf(b), Math.min(sx, 1.03), sy, dy, clamp(fall * 6), () => {
        UI.write(it.t, b.cx, b.base, Object.assign({}, it, { align: 'center', maxW: T_STACK.maxW, fill: vgrad(it.size, it.font, [[0, '#ffffff'], [.5, '#e8f6fb'], [1, '#9fcbd9']]) }));
        // the gold shine: the same glyphs again, in a band of gold that sweeps across
        const sw = seg(lt, t0 + .9, t0 + 1.9);
        if (sw > 0 && sw < 1) {
          const m = UI.metrics(it.font, 400), wd = b.x1 - b.x0, bx = lerp(-150, wd + 150, easeIO(sw)), cyy = -m.cap * b.size * .5;
          const g = ctx.createLinearGradient(bx - 110, cyy - 70, bx + 110, cyy + 70);
          g.addColorStop(0, 'rgba(255,200,61,0)'); g.addColorStop(.5, 'rgba(255,214,90,.95)'); g.addColorStop(1, 'rgba(255,200,61,0)');
          UI.write(it.t, b.cx, b.base, Object.assign({}, it, { align: 'center', maxW: T_STACK.maxW, fill: g, lw: 0, shadow: 0 }));
        }
      });
    }
  }
  // 4. the tagline rises
  {
    const t0 = ding + .85, k = seg(lt, t0, t0 + .4), b = L.tag, it = T_ITEMS[3];
    if (k > 0) popAbout(b.cx, cyOf(b), 1, 1, 16 * (1 - easeOut(k)), easeOut(k), () => UI.write(it.t, b.cx, b.base, Object.assign({}, it, { align: 'center', maxW: T_STACK.maxW })));
  }
}

// ============================================================================ title: the scene
const CAM_Z0 = 1.0, CAM_Z1 = .74, CAM_Y1 = 730;
function camAt(lt) {
  const t0 = B('logo').s, lk = lockT();
  const push = .04 * seg(lt, 0, lk);
  const k = sk(lt, lk + .14, lk + 1.4), k2 = seg(lt, lk + 1.4, 5.2);
  const z = lerp(CAM_Z0 + push, CAM_Z1, k) + .018 * easeOut(k2) * k, y = lerp(DC[1], CAM_Y1, k);
  return { x: 540, y, z };
}
const TITLE = {
  noChyron: true, noScrim: true,
  cam(lt) {
    const c = camAt(lt), lk = lockT();
    zoomTo(c.x, c.y, c.z);
    CAM.shake = 14 * ring(lt, lk, .1) * (lt >= lk);
    CAM.r = .012 * ring(lt, lk, .12) * Math.sin((lt - lk) * 40) * (lt >= lk);
  },
  draw(lt) {
    if (!WALL) buildWall(); if (!DOOR) buildDoor(); if (!FOG) buildFog();
    const t0 = B('logo').s, lk = lockT(), val = dialVal(lt), lit = easeOut(seg(lt, lk, lk + .35));
    // the room
    ctx.fillStyle = '#02080c'; ctx.fillRect(-1200, -1200, 3600, 6000);
    V2.dof(lt < lk ? 0 : 0, () => ctx.drawImage(WALL, WALL_X0, WALL_Y0, WALL_W, WALL_H));
    // the hard spotlight from above, with haze in it
    V2.beam(540, -900, 540, 1500, 330, 1180, '190,245,255', .30, 'screen');
    V2.beam(540, -900, 540, 1500, 380, 1300, '150,230,250', .16, 'screen');
    haze(lt, .5, 300, 1100, 14, 0); haze(lt, .32, 900, 900, -9, 1);
    // the door: glow behind it first (it leaks light round its rim once the bolts are in), then the door and its frame
    if (lit > 0) { V2.glow(DC[0], DC[1], R_DOOR + 200, '255,200,90', .42 * lit, 'screen', 0); for (let j = 0; j < 12; j++) { const [x, y] = rad(DC[0], DC[1], (j + .5) * PI / 6, R_DOOR + 40); V2.emit(x, y, 110, '255,196,90', .28 * lit); } }
    ctx.drawImage(DOOR, DC[0] - R_FRAME, DC[1] - R_FRAME, R_FRAME * 2, R_FRAME * 2);
    V2.glow(DC[0], DC[1] - 200, 520, '210,245,255', .30, 'screen', .3);   // the spot's hot centre on the steel
    drawBolts(lt, lk);
    drawDial(lt, val, lit);
    drawIndex(lt, lit);
    drawCrew(lt);
    // dust in the beam
    V2.dust(160, -200, 920, 1900, lt, { n: 70, alpha: .55, size: 3.4, speed: 9, color: '200,245,255' });
    // the clunk: a flash of light round the dial and a ring of sparks at every bolt
    if (lt >= lk) {
      V2.glow(DC[0], DC[1], 700, '255,244,210', .8 * ring(lt, lk, .09), 'screen', .9);
      for (let j = 0; j < 12; j++) { const a = (j + .5) * PI / 6, [x, y] = rad(DC[0], DC[1], a, 470); V2.sparks(x, y, lt, lk + .03, { n: 7, speed: 360, life: .5, color: '255,206,120', size: 4, seed: 40 + j, g: 900 }); }
      V2.ring(DC[0], DC[1], seg(lt, lk, lk + .7), { r0: 260, r1: 980, color: '77,227,255', lw: 14, alpha: .9 });
    }
  },
  fx(lt) {
    const lk = lockT();
    const flash = lt >= lk && lt < lk + .1 ? (lt < lk + .034 ? .85 : lt < lk + .067 ? .5 : .2) : 0;
    const fin = lt < .3 ? 1 - lt / .3 : 0;
    return { bloom: .7, vignette: .55, grain: .05, contrast: .16, sat: .02, tint: [['#0a6a80', .22, 'soft-light']], fade: Math.max(fin, flash), fadeColor: fin > flash ? '3,8,12' : '255,255,255' };
  },
  blur(lt) {
    const lk = lockT();
    if (lt < .35) return 1;
    if (lt < 1.2) return 10;
    if (lt < lk) return 4;
    if (lt < lk + 1.6) return 5;
    return 2;
  },
  over(lt) { overTitle(lt); },
};
window.__EP13_SCENES.title = TITLE;
})();
