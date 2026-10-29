'use strict';
/* SHIFT HAPPENS, Episode 13: The Float Pool. Scene module E13-A (1 of 2): the scenes `title` (5.2 s) and `end` (8.0 s), registered on window.__EP13_SCENES.
 * Exports on window.E13A (this file loads first): charTo(cv, ox, oy, o) and flatten(cv, color) (used by ep13_crew.js), and titleClicks (the scene-local times of the dial's ratchet clicks).
 * All text goes through the UI kit (UI.stack / UI.write / UI.pill / UI.sign / UI.panel / UI.label), drawn live; the caches hold flat art only (wall, door, fog, silhouettes, shadows).
 *
 * TITLE (noChyron, noScrim): a heist-film title. A huge steel combination dial on a vault door, in a dark teal room under a hard spotlight and haze. World 1080x1920, dial and door centred on (540, 960).
 *   shot list, scene-local seconds (cues: vaultdial 0.2, clunk 2.6, textding 2.7, theme7 0.2):
 *   0.00-0.10  fade in from black.   0.10-0.34  the spotlight stutters on: on .10, out .17, on .23, dim .30, steady .34 (the room goes dark between).
 *   0.20       the dial is spun hard and coasts. It steps 4 numbered ticks at each of the 26 ratchet clicks the score builds (build_music13.dial_times: 44 ms apart at first, 185 ms near the end, the last at
 *              0.2 + 2.27 = 2.47), so every click is a visible step; the red index pawl flicks on each click (every fifth and the last, the heavy teeth, harder). Shutter 10 samples while it is fast.
 *   2.47-2.60  the dial stands on 30 (thirty minutes) for a held breath.
 *   2.60       clunk: three-frame white flash (.85 / .5 / .2), chromatic aberration burst, camera shake 14 px and roll, a cyan shock ring, twelve bolts withdraw 78 px (staggered, easeBack), sparks at every
 *              bolt, gold light leaks out of the empty sockets and round the rim, the 30 lights up cyan.
 *   2.70       textding: UI.stack (centre x 540, top y 150, max width 960): SHIFT HAPPENS pops 1.3 -> 1.0 (Bangers 132, gold), the EPISODE 13 pill drops in 2.90-3.25 with a bounce (Bangers 58 on a red 88 px pill),
 *              THE FLOAT POOL rises from 130 px below with a stretch and a squash landing at 3.02-3.18 (Bangers 190, white, never wider than 1.03x), a ring of gold light behind it 3.18-3.70,
 *              the gold shine sweeps across it 3.92-4.92, the tagline "Every nurse deserves thirty minutes." rises 3.55-3.95 (Nunito 900 46).
 *   2.74-4.00  camera pull-back and tilt down (zoom 1.0 -> 0.74, centre y 960 -> 730) that finds the crew: five silhouettes (Lemon, Strawberry, Mango, Clementine, Mr. Banana) on one floor line
 *              (y 1850, UI.rowX(5, 40, 1040, w 200): equal centres), rim-lit gold from behind, rising in 3.15-4.21, 0.09 s apart.
 *   3.00-3.60  a lens flare from the lamp above the frame.   3.80-4.80  a sheen of light crosses the steel.   4.00-5.20  a slow push (+1.8%).
 *   Blur: 1 sample to 0.2, 10 to 1.5, 6 to the lock, 5 to 4.2, then 2.
 *
 * END (noChyron, noScrim, label THANKS FOR WATCHING): a police lineup in front of a height-chart wall: pale green cinder block, lit by a hard overhead lamp on a ceiling conduit (lamp at (540, 622), the wall
 *   dark outside the cone). Six characters on one floor line (y 1330, UI.rowX(6, 84, 996, w 152) so equal centres, one scale .88 for all): Lemon, Strawberry, Mango, Clementine, Mr. Banana, Brenda. Each holds an
 *   equal 144x120 placard (UI.sign, Bangers 31) in front of their feet on one baseline: LEMON / CONSPIRACY TO HYDRATE, STRAWBERRY / ATTEMPTED SITTING, MANGO / LOITERING (TALKING), CLEMENTINE / SAID SURE,
 *   MR. BANANA / SLIPPING (48), BRENDA / TIME SERVED. Height chart: a line every inch from 4'0" to 6'0" (58 px per foot), labelled every six inches at x 56 and x 1028 (set dressing). A gilt frame on a nail
 *   top right holds the Moon (eyes wander, smirks every 5 s); a wall clock reads 7:44; yellow tape marks and the numbers 1-6 on the floor; soft wall shadows behind the six (cached silhouettes).
 *   0.00-0.36  fade in; the lamp flickers on (on .12, out .20, on .26, dim .31, steady .36).
 *   0.22-0.78  UI.stack (centre x 540, top y 128, max width 960): THANKS FOR WATCHING slides up (.22), SHIFT HAPPENS pops 1.3 -> 1.0 (.34), THE FLOAT POOL comes down on a stamp with a squash and spring (.62).
 *   0.90-1.8   the six raise their placards into their hands one after another, 0.11 s apart, with an overshoot. Idle: engine bob, blinks, gaze; Banana shifts his feet (2.6-3.5, 5.2-6.1) and slips at 3.6-4.4
 *              (hop, kick, shock; his placard goes with him); Brenda shakes the dust off herself at 2.0 and 5.1 (puffs, her dust falls .55 -> .29) and smiles from 5.2 (time served).
 *   1.15, 2.30, 3.45, 4.60, 5.75, 6.90  the photographer's flash: everyone squints, a white wash over the lineup that fades out above and below (it never reaches the lettering); confetti from 1.15, only
 *              between the conduit and the gag line.
 *   3.00-3.34  BREAKS TAKEN TODAY: 0 pops in (Nunito 900 58, yellow, centred on x 540 at y 1548); 4.25-4.60 the 0 turns into a 1 with a ring of light.
 *   4.90-5.35  the teaser pill rises in: NEXT: EPISODE 14 / THE SURVEY (clipboard icon, y 1726, 168 px high).
 *   7.60-8.00  fade to dark. Camera: a slow push 1.0 -> 1.012 over the whole scene. Blur 1 (nothing moves fast).
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
const hexMix = (a, b, k) => '#' + V2.mix(a, b, k).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

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
const R_DIAL = 300, R_PLATE = 334, R_DOOR = 440, R_FRAME = 580, R_CACHE = R_FRAME + 16;
const TICK = TAU / 100;                // one tick of the dial
const LOCK_AT = 30;                    // the number the dial lands on: thirty minutes

// the ratchet: the dial is spun hard and left to coast. It clicks over DIAL_D numbered ticks at every click of the sound (the 26 clicks the score builds, build_music13.dial_times: about 45 ms apart at first, stretching to 185 ms, then one long final tick), so every click you hear is a step you see.
const DIAL_CLICKS = [0.0442, 0.0941, 0.1411, 0.1881, 0.2369, 0.2916, 0.3473, 0.4043, 0.4595, 0.5149, 0.5735, 0.6337, 0.6999, 0.7664, 0.8377, 0.9086, 0.9828, 1.0645, 1.1476, 1.237, 1.3342, 1.4404, 1.5724, 1.7121, 1.8972, 2.27];   /* seconds after the vaultdial cue */
const DIAL_D = 4;
let SCHED = null;
function sched() {
  if (SCHED) return SCHED;
  const t0 = B('logo').s, clicks = DIAL_CLICKS.map(c => t0 + c);
  const sd = clicks.map((c, j) => Math.min(.05, .6 * (c - (j ? clicks[j - 1] : t0))));     /* how long each snap takes: up to 60% of the gap before its click */
  const heavy = clicks.map((c, j) => (j + 1) % 5 === 0 || j === clicks.length - 1);        /* the sound's heavier teeth: every fifth and the last */
  SCHED = { t0, clicks, sd, heavy, M: clicks.length };
  E.titleClicks = clicks.map(c => +c.toFixed(3));
  return SCHED;
}
/* the dial reading in ticks (decreasing: the dial turns clockwise); the index at the top reads this number. It lands on LOCK_AT with the last click. */
function dialVal(lt) {
  const S = sched();
  let v = LOCK_AT;
  for (let j = 0; j < S.M; j++) {
    const c = S.clicks[j], p = easeOut(easeOut(seg(lt, c - S.sd[j], c)));
    v += DIAL_D * (1 - p);
    if (lt > c) v -= .10 * Math.exp(-(lt - c) / .035) * Math.sin((lt - c) * 85) * (j > S.M - 6 ? 1 : .3);   /* the ring-out of the detent */
  }
  return v;
}
/* how far the index pawl is pushed out by the tooth passing under it (0..1.3: the heavy teeth push harder) */
function pawlK(lt) {
  const S = sched();
  let k = 0;
  for (let j = 0; j < S.M; j++) {
    const c = S.clicks[j], h = S.heavy[j] ? 1.3 : 1;
    if (lt >= c - S.sd[j] && lt < c) k = Math.max(k, h * seg(lt, c - S.sd[j], c));
    else if (lt >= c && lt < c + .04) k = Math.max(k, h * (1 - seg(lt, c, c + .04)));
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
  const S = 1.25, N = 2 * R_CACHE;
  DOOR = mkCv(Math.round(N * S), Math.round(N * S));
  intoCv(DOOR, g => {
    g.scale(S, S); g.translate(R_CACHE, R_CACHE);
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
  V2.emit(DC[0], DC[1] - R_DIAL + 10, 60, '255,59,78', .5 + .5 * lit + .35 * k);
}
// the lock bolts: twelve steel pins in the rim of the door, shot into the frame until the dial lands
function drawBolts(lt, t0) {
  /* light from the vault leaks through the empty sockets and round the rim once the bolts are drawn */
  const li = easeOut(seg(lt, t0 + .04, t0 + .45));
  if (li > 0) {
    ctx.save(); ctx.translate(DC[0], DC[1]); ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = `rgba(255,214,130,${.5 * li})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, R_DOOR + 3, 0, TAU); ctx.stroke();
    for (let j = 0; j < 12; j++) {
      ctx.save(); ctx.rotate((j + .5) * PI / 6);
      const g = ctx.createLinearGradient(R_DOOR + 6, 0, R_DOOR + 102, 0);
      g.addColorStop(0, `rgba(255,228,160,${.8 * li})`); g.addColorStop(.55, `rgba(255,190,90,${.34 * li})`); g.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = g; rr(R_DOOR + 6, -36, 96, 72, 10); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
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
const FEET_W = 1850, SIL_S = .86;
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
  if (gl > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, 400, 40, 760, [[0, `rgba(255,200,100,${.2 * gl})`], [1, 'rgba(255,200,100,0)']]); ctx.fillRect(0, 0, W, 1200); ctx.restore(); }
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
    const k = seg(lt, ding + .2, ding + .55), sc = lerp(1.35, 1, easeBack(k)), b = L.pill, it = T_ITEMS[1];
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
/* the spotlight stutters on: dark, on, out, on, a flicker, steady */
const spotK = lt => lt < .1 ? 0 : lt < .17 ? 1 : lt < .23 ? .12 : lt < .3 ? 1 : lt < .34 ? .3 : 1;
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
    const sp = spotK(lt);
    V2.beam(540, -900, 540, 1500, 330, 1180, '190,245,255', .30 * sp, 'screen');
    V2.beam(540, -900, 540, 1500, 380, 1300, '150,230,250', .16 * sp, 'screen');
    haze(lt, .5, 300, 1100, 14, 0); haze(lt, .32, 900, 900, -9, 1);
    // the door: glow behind it first (it leaks light round its rim once the bolts are in), then the door and its frame
    if (lit > 0) { V2.glow(DC[0], DC[1], R_DOOR + 200, '255,200,90', .42 * lit, 'screen', 0); for (let j = 0; j < 12; j++) { const [x, y] = rad(DC[0], DC[1], (j + .5) * PI / 6, R_DOOR + 40); V2.emit(x, y, 110, '255,196,90', .28 * lit); } }
    ctx.drawImage(DOOR, DC[0] - R_CACHE, DC[1] - R_CACHE, R_CACHE * 2, R_CACHE * 2);
    V2.glow(DC[0], DC[1] - 200, 520, '210,245,255', .30 * sp, 'screen', .3);   // the spot's hot centre on the steel
    // a sheen of light crosses the steel in the hold
    { const sh = seg(lt, 3.8, 4.8);
      if (sh > 0 && sh < 1) {
        ctx.save(); ctx.beginPath(); ctx.arc(DC[0], DC[1], R_DOOR - 6, 0, TAU); ctx.clip(); ctx.globalCompositeOperation = 'screen';
        const bx = lerp(DC[0] - 560, DC[0] + 560, easeIO(sh)), g = ctx.createLinearGradient(bx - 110, DC[1] - 110, bx + 110, DC[1] + 110);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(235,250,255,.26)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(DC[0] - R_DOOR, DC[1] - R_DOOR, R_DOOR * 2, R_DOOR * 2); ctx.restore();
      } }
    drawBolts(lt, lk);
    drawDial(lt, val, lit);
    drawIndex(lt, lit);
    drawCrew(lt);
    // dust in the beam
    V2.dust(160, -200, 920, 1900, lt, { n: 70, alpha: .55 * sp, size: 3.4, speed: 9, color: '200,245,255' });
    // the clunk: a flash of light round the dial and a ring of sparks at every bolt
    if (lt >= lk) {
      V2.glow(DC[0], DC[1], 700, '255,244,210', .8 * ring(lt, lk, .09), 'screen', .9);
      for (let j = 0; j < 12; j++) { const a = (j + .5) * PI / 6, [x, y] = rad(DC[0], DC[1], a, 470); V2.sparks(x, y, lt, lk + .03, { n: 7, speed: 360, life: .5, color: '255,206,120', size: 4, seed: 40 + j, g: 900 }); }
      V2.ring(DC[0], DC[1], seg(lt, lk, lk + .7), { r0: 260, r1: 980, color: '77,227,255', lw: 14, alpha: .9 });
    }
    if (sp < 1) { ctx.fillStyle = `rgba(1,5,8,${(1 - sp) * .9})`; ctx.fillRect(-1200, -1200, 3600, 6000); }
    if (sp > 0 && lt > 3.0) V2.flare(540, 30, .2 * sp * seg(lt, 3.0, 3.6), '190,235,255');   // the lamp above the frame, as a lens would see it
  },
  fx(lt) {
    const lk = lockT();
    const flash = lt >= lk && lt < lk + .1 ? (lt < lk + .034 ? .85 : lt < lk + .067 ? .5 : .2) : 0;
    const fin = lt < .1 ? 1 - lt / .1 : 0;
    return { bloom: .7, vignette: .55, grain: .05, contrast: .16, sat: .02, aberr: 9 * ring(lt, lk, .08) * (lt >= lk), tint: [['#0a6a80', .22, 'soft-light']], fade: Math.max(fin, flash), fadeColor: fin > flash ? '3,8,12' : '255,255,255' };
  },
  blur(lt) {
    const lk = lockT();
    if (lt < .2) return 1;
    if (lt < 1.5) return 10;
    if (lt < lk) return 6;
    if (lt < lk + 1.6) return 5;
    return 2;
  },
  over(lt) { overTitle(lt); },
};
window.__EP13_SCENES.title = TITLE;

// ============================================================================ end: the police lineup
const A7 = window.A7, A10 = window.A10, A11 = window.A11, A13 = window.A13;
const E_FEET = 1330;                       // the floor line all six stand on
const E_PX_FT = 58;                        // the height chart: pixels per foot
const E_S = .88;                           // one scale for everyone (they stand at one distance from the lens)
const E_SLOT = 152, E_X0 = 84, E_X1 = 996;
const E_BW = 144, E_BH = 120, E_BOTTOM = E_FEET - 10, E_TOP = E_BOTTOM - E_BH;   // the placards: equal size, one baseline
const LAMP = [540, 622], PIPE_Y = LAMP[1] - 114;   /* the conduit the lamp hangs from sits clear of the lettering above it */
const INK_GREEN = '#17372a';
const slotX = () => UI.rowX(6, E_X0, E_X1, { w: E_SLOT, centers: true });
const LINEUP = [
  { id: 'lemon',  ctor: A7.lemon,   name: 'LEMON',      charge: ['CONSPIRACY', 'TO HYDRATE'], expr: 'dead',    look: [.35, .1] },
  { id: 'straw',  ctor: A11.straw,  name: 'STRAWBERRY', charge: ['ATTEMPTED', 'SITTING'],     expr: 'dead',    look: [-.2, .2], lid: .38, acc: ['steth', 'bandage7'] },
  { id: 'mango',  ctor: A7.mango,   name: 'MANGO',      charge: ['LOITERING', '(TALKING)'],   expr: 'smug',    look: [.5, 0] },
  { id: 'clem',   ctor: A10.clem,   name: 'CLEMENTINE', charge: ['SAID SURE'],                expr: 'hopeful', look: [-.3, 0], acc: ['steth', 'badge7'] },
  { id: 'banana', ctor: A7.banana,  name: 'MR. BANANA', charge: ['SLIPPING', '(48)'],         expr: 'happy',   look: [.2, .1] },
  { id: 'brenda', ctor: A13.brenda, name: 'BRENDA',     charge: ['TIME SERVED'],              expr: 'weak',    look: [-.5, .3] },
];
const FLASHES = [1.15, 2.3, 3.45, 4.6, 5.75, 6.9];
const flashK = lt => { let k = 0; for (const t of FLASHES) if (lt >= t) k = Math.max(k, lt < t + .033 ? 1 : lt < t + .067 ? .6 : Math.exp(-(lt - t - .067) / .07) * .5); return k; };

// the wall: pale green cinder block, painted once in two tones (lit and in shadow). No text is ever painted into a cache.
let E_WALL = null;
function paintWall(g, tone) {
  const c = (hex) => hexMix(hex, '#07140e', tone), R = V2.rng(321);
  g.fillStyle = c('#a9cfb5'); g.fillRect(0, 0, 1080, 1500);
  const BW = 150, BH = 72;
  for (let r = -1; r < 22; r++) {
    for (let x = -BW; x < 1080 + BW; x += BW) {
      const xx = x + (r & 1 ? BW / 2 : 0), yy = r * BH + 8, v = R() - .5;
      g.fillStyle = c(hexMix('#c4e6cf', '#b3d9c0', .5 + v)); g.fillRect(xx + 3, yy + 3, BW - 6, BH - 6);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(xx + 3, yy + 3, BW - 6, 3);        // the lit top edge of each block
      g.fillStyle = 'rgba(0,30,16,.14)'; g.fillRect(xx + 3, yy + BH - 7, BW - 6, 4);       // its shaded underside
      for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(30,70,50,${.05 + R() * .06})`; g.beginPath(); g.arc(xx + 10 + R() * (BW - 20), yy + 10 + R() * (BH - 20), 1 + R() * 2, 0, TAU); g.fill(); }
    }
  }
  g.fillStyle = c('#2f5a44'); g.fillRect(0, E_FEET - 40, 1080, 26);                        // the rubber baseboard
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, E_FEET - 40, 1080, 3);
}
function buildEndArt() {
  E_WALL = { lit: mkCv(1080, 1500), dark: mkCv(1080, 1500) };
  intoCv(E_WALL.lit, g => paintWall(g, 0));
  intoCv(E_WALL.dark, g => paintWall(g, .84));
}

// the Moon, framed: a gilt frame hung from a nail by a wire, a little crooked
function moonFrame(lt) {
  const cx = 800, top = 672, w = 214, h = 262, sway = .035 + .006 * Math.sin(lt * .9);
  ctx.save(); ctx.translate(cx, top - 40); ctx.rotate(sway);
  ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-w * .36, 52); ctx.moveTo(0, 0); ctx.lineTo(w * .36, 52); ctx.stroke();
  ctx.fillStyle = '#1c1c20'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
  ctx.translate(0, 40);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 26; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 16;
  ctx.fillStyle = V2.grad(-w / 2, 0, w / 2, h, [[0, '#f6dc86'], [.35, '#c99833'], [.7, '#8f6312'], [1, '#e3c066']]); rr(-w / 2, 0, w, h, 14); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#3a2808'; ctx.lineWidth = 4; rr(-w / 2, 0, w, h, 14); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 3; rr(-w / 2 + 9, 9, w - 18, h - 18, 9); ctx.stroke();
  const ix = -w / 2 + 22, iy = 22, iw = w - 44, ih = h - 44;
  ctx.save(); rr(ix, iy, iw, ih, 5); ctx.clip();
  ctx.fillStyle = V2.grad(0, iy, 0, iy + ih, [[0, '#0c1033'], [1, '#2a2a6a']]); ctx.fillRect(ix, iy, iw, ih);
  for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(255,250,230,${.3 + .6 * hash(i + 4) * (.5 + .5 * Math.sin(lt * 2 + i))})`; ctx.beginPath(); ctx.arc(ix + hash(i) * iw, iy + hash(i + 40) * ih, 1 + hash(i + 9) * 1.6, 0, TAU); ctx.fill(); }
  A7.moon(0, iy + ih * .52, .46, { t: lt, suppress: true, char: { expr: lt % 5 > 3.6 ? 'smug' : 'neutral', lid: .18, look: [-.55, .55 + .1 * Math.sin(lt * .8)] } });
  ctx.restore();
  ctx.restore();
}
function wallClock(lt) {
  const cx = 300, cy = 860, r = 66;
  ctx.save(); ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#1b2420'; ctx.beginPath(); ctx.arc(0, 0, r + 9, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = V2.radial(-14, -18, 4, r, [[0, '#ffffff'], [1, '#dfe7e2']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - PI / 2; ctx.strokeStyle = '#1b2420'; ctx.lineWidth = i % 3 ? 3 : 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 9), Math.sin(a) * (r - 9)); ctx.lineTo(Math.cos(a) * (r - (i % 3 ? 15 : 21)), Math.sin(a) * (r - (i % 3 ? 15 : 21))); ctx.stroke(); }
  const hand = (a, len, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-Math.cos(a) * 8, -Math.sin(a) * 8); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke(); };
  const sec = Math.floor(lt) % 60, tk = easeOut(seg(lt % 1, 0, .12));
  hand(((7 + 44 / 60) / 12) * TAU - PI / 2, r * .5, 6, '#1b2420');            // it is 7:44 PM
  hand((44 / 60) * TAU - PI / 2, r * .76, 4.5, '#1b2420');
  hand(((sec + tk) / 60) * TAU - PI / 2, r * .84, 2.4, ALARM);
  ctx.fillStyle = ALARM; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
  ctx.restore();
}
// the height chart: a line every six inches from 4'0" to 6'0", ticks every inch, figures at both ends (set dressing)
function chartLines() {
  ctx.save();
  for (let q = 0; q <= 24; q++) {                    // inches above 4'0"
    const inch = 48 + q, y = E_FEET - inch / 12 * E_PX_FT, major = q % 6 === 0;
    ctx.strokeStyle = major ? 'rgba(18,52,38,.82)' : 'rgba(18,52,38,.4)'; ctx.lineWidth = major ? 4 : 2;
    ctx.beginPath(); if (major) { ctx.moveTo(14, y); ctx.lineTo(1066, y); } else { ctx.moveTo(64, y); ctx.lineTo(100, y); ctx.moveTo(980, y); ctx.lineTo(1016, y); } ctx.stroke();
  }
  ctx.restore();
}
function chartLabels() {
  for (let q = 0; q <= 24; q += 6) {
    const inch = 48 + q, ft = Math.floor(inch / 12), inn = inch % 12, y = E_FEET - inch / 12 * E_PX_FT, str = `${ft}'${inn}"`;
    UI.label(str, 56, y - 13, { align: 'right', size: 19, fill: INK_GREEN, weight: 900, hero: false, id: 'chartL' + q });
    UI.label(str, 1028, y - 13, { align: 'left', size: 19, fill: INK_GREEN, weight: 900, hero: false, id: 'chartR' + q });
  }
}
// the six: poses and small acts, one function so every figure is built the same way
function lineupOpts(i, lt, xs) {
  const L = LINEUP[i], k = KINDS[L.ctor({}).kind], s = E_S, leg = k.leg || 90;
  const raiseK = easeBack(seg(lt, .9 + i * .11, 1.3 + i * .11)), drop = 44 * (1 - Math.min(1, raiseK)) - 8 * Math.max(0, raiseK - 1);
  const fl = flashK(lt), x = xs[i];
  const o = Object.assign(L.ctor(L.acc ? { acc: L.acc } : {}), { x, y: E_FEET, s, t: lt + i * .7, expr: L.expr, look: L.look, lid: L.lid });
  const baseLift = o.lift || 0;
  const centreY = o.y - (o.lift || 0) - (leg + k.ry * .9) * s;
  const tx = (E_BW / 2 - 16), ty = E_TOP - 10 + drop;
  const toLocal = (px, py) => [(px - x) / s, (py - centreY) / s];
  const reach = (g, side) => { const [sx, sy] = shoulder(k, side), L = ((k.arm1 || 56) + (k.arm2 || 52)) * 1.12 - 2, dx = g[0] - sx, dy = g[1] - sy, d = Math.hypot(dx, dy); return d <= L ? g : [sx + dx * L / d, sy + dy * L / d]; };
  let gl = toLocal(x - tx, ty), gr = toLocal(x + tx, ty);
  o.arms = { l: 'hold', r: 'hold' }; o.hand = { l: 'grip', r: 'grip' };
  // acts
  if (L.id === 'brenda') {      /* every few seconds she shakes the dust off herself like a wet dog, and the placard shakes with her */
    const cyc = (lt - 2.0) % 3.1, on = lt > 2.0 && cyc < .7 ? Math.sin(cyc / .7 * PI) : 0;
    o.shake = 3.4 * on; o.dusting = on;
    o.dust = .55 - .13 * seg(lt, 2.0, 2.7) - .13 * seg(lt, 5.1, 5.8);
    o.puffAt = [x, centreY];
  }
  if (L.id === 'banana') {      // he shifts his weight from foot to foot, and slips on nothing at 3.6 s
    const tap = lt > 1.8 && (lt % 2.6) < .9;
    if (tap) o.legs = 'tap';
    const sl = lt - 3.6; if (sl > 0 && sl < .8) { const k2 = Math.sin(seg(sl, 0, .8) * PI); o.lift = 24 * k2; o.legs = 'kick'; o.expr = 'panic'; o.rot = -.07 * Math.sin(seg(sl, 0, .8) * PI * 2); }
    if (sl >= .8 && sl < 1.6) o.expr = 'shock';
  }
  if (L.id === 'brenda' && lt > 5.2) o.expr = A13.expr('relief');       // time served
  if (L.id === 'mango') o.look = [.5 * Math.sin(lt * .8), .1];
  // the flash: everyone squints
  o.lid = Math.max(o.lid ?? 0, .85 * fl);
  o.grip = { l: reach(gl, -1), r: reach(gr, 1) };
  const seed = o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7), bobPx = Math.sin(o.t * 2.6 + seed) * 2.2 * s;
  const jx = o.shake ? o.shake * s * vnoise(o.t * 50 + seed) : 0, jy = o.shake ? o.shake * s * vnoise(o.t * 47 + seed + 9) : 0;
  o.boardDx = jx; o.boardDy = -((o.lift || 0) - baseLift) + drop + bobPx + jy;
  o.rollOut = raiseK;
  return o;
}
/* the dust she brushes off: grey puffs that rise from her shoulder and thin out */
function dustPuffs(lt, o) {
  if (!o || !o.puffAt) return;
  const [px, py] = o.puffAt, src = [[-84, 8, -1], [84, 8, 1], [0, -84, 0]];
  ctx.save();
  for (let c = 0; c < 3; c++) {
    const t0 = 2.0 + c * 3.1;
    if (lt < t0 || lt > t0 + 1.7) continue;
    src.forEach(([ox, oy, dir], j) => {
      for (let i = 0; i < 4; i++) {
        const a = lt - (t0 + .05 + i * .1 + j * .03);
        if (a < 0 || a > .85) continue;
        const hx = hash(c * 31 + i * 7.3 + j * 11), hy = hash(c * 17 + i * 3.1 + j * 5 + 5);
        const x = px + ox + dir * (20 + 46 * a) + (hx - .5) * 24, y = py + oy - 40 * a - hy * 14 - (dir === 0 ? 30 * a : 0), r = 12 + 26 * a, al = .85 * (1 - a / .85);
        ctx.fillStyle = V2.radial(x, y, 0, r, [[0, `rgba(150,140,122,${al})`], [.6, `rgba(150,140,122,${al * .5})`], [1, 'rgba(150,140,122,0)']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        const sx = x + dir * 40 * a + (hy - .5) * 30, sy = y - 20 * a + 70 * a * a;
        ctx.fillStyle = `rgba(120,110,96,${.9 * (1 - a / .85)})`; ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, TAU); ctx.arc(sx - 9 * dir, sy + 7, 1.8, 0, TAU); ctx.fill();
      }
    });
  }
  ctx.restore();
}
/* the soft shadows the six throw on the wall behind them: built once from each figure's own silhouette, blurred, offset away from the lamp */
let E_SH = null;
function buildEndShadows() {
  const W2 = 440, H2 = 560, FX2 = W2 / 2, FY2 = H2 - 60;
  E_SH = LINEUP.map(L => {
    const cv = mkCv(W2, H2);
    E.charTo(cv, FX2, FY2, Object.assign(L.ctor(L.acc ? { acc: L.acc } : {}), { s: E_S, t: 2, expr: 'neutral', arms: { l: 'rest', r: 'rest' }, look: [0, 0] }));
    E.flatten(cv, '#02100a');
    const out = mkCv(W2, H2);
    intoCv(out, g => { g.filter = 'blur(9px)'; g.drawImage(cv, 0, 0); });
    return { cv: out, fx: FX2, fy: FY2 };
  });
}
function drawWallShadows(xs, lampOn) {
  if (!E_SH) buildEndShadows();
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, E_FEET - 14); ctx.clip();
  ctx.globalAlpha = .4 * lampOn;
  xs.forEach((x, i) => { const dx = (x - 540) * .1, s = E_SH[i]; ctx.drawImage(s.cv, x + dx - s.fx, E_FEET + 30 - s.fy); });
  ctx.restore();
}
function drawBoards(lt, xs, opts) {
  LINEUP.forEach((L, i) => {
    const o = opts[i], raise = o.boardDy, bx = xs[i] - E_BW / 2 + (o.boardDx || 0), by = E_TOP + raise;
    const lines = [{ t: L.name, fill: GOLD }, ...L.charge.map(t => ({ t, fill: '#ffffff' }))];
    UI.sign([bx, by, E_BW, E_BH], lines, { fill: '#17131d', stroke: '#f4f1e8', lw: 4, r: 8, pad: 5, size: 31, font: 'Bangers', spacing: -.4, lh: 1.1, id: 'board-' + L.id, shadow: 10 });
  });
}
function confettiEnd(lt, t0) {
  const k = lt - t0; if (k < 0) return;
  const cols = [GOLD, ALARM, CYAN, '#8dff9e', '#ff9fd0', '#ffffff'];
  ctx.save();
  for (let i = 0; i < 90; i++) {
    const sp = 140 + hash(i + 9) * 180, x = hash(i) * 1080 + Math.sin(k * 1.6 + i) * 34, y = -60 + ((k * sp + hash(i + 4) * 2400) % 2200) - 200;
    const yA = PIPE_Y + 36, yB = 1470;
    if (y < yA || y > yB) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * 5 + i); ctx.scale(1, Math.abs(Math.cos(k * 4 + i * 2)) * .8 + .2);
    ctx.fillStyle = cols[i % 6]; ctx.globalAlpha = .9 * clamp((y - yA) / 50) * clamp((yB - y) / 70); ctx.fillRect(-8, -4, 16, 8); ctx.restore();
  }
  ctx.restore();
}
function drawEndWorld(lt) {
  if (!E_WALL) buildEndArt();
  const xs = slotX();
  // the room: the wall in shadow, then the lit cone of the hard overhead lamp
  ctx.fillStyle = '#03090a'; ctx.fillRect(-300, -300, 1700, 2600);
  ctx.drawImage(E_WALL.dark, 0, 0);
  const lampOn = lt < .12 ? 0 : lt < .2 ? 1 : lt < .26 ? 0 : lt < .31 ? 1 : lt < .36 ? .15 : 1;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(LAMP[0] - 120, LAMP[1] + 14); ctx.lineTo(LAMP[0] - 1420, 1500); ctx.lineTo(LAMP[0] + 1420, 1500); ctx.lineTo(LAMP[0] + 120, LAMP[1] + 14); ctx.closePath(); ctx.clip();
  ctx.globalAlpha = lampOn; ctx.drawImage(E_WALL.lit, 0, 0);
  ctx.globalAlpha = lampOn; ctx.fillStyle = V2.radial(540, 980, 260, 980, [[0, 'rgba(0,8,4,0)'], [1, 'rgba(0,8,4,.5)']]); ctx.fillRect(0, 0, 1080, 1500);
  ctx.restore();
  // the floor: dark linoleum with the lamp's pool on it
  ctx.fillStyle = V2.grad(0, E_FEET - 40, 0, 1960, [[0, '#2a3a33'], [.12, '#16231e'], [1, '#050b09']]); ctx.fillRect(0, E_FEET - 14, 1080, 700);
  ctx.save(); ctx.globalAlpha = lampOn; ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, E_FEET + 80, 10, 640, [[0, 'rgba(210,240,215,.30)'], [.6, 'rgba(210,240,215,.1)'], [1, 'rgba(210,240,215,0)']]);
  ctx.translate(540, E_FEET + 80); ctx.scale(1, .22); ctx.translate(-540, -(E_FEET + 80)); ctx.fillRect(-200, E_FEET - 600, 1480, 1400); ctx.restore();
  // the light itself: the cone as haze, dust in it
  V2.beam(LAMP[0], LAMP[1] + 20, LAMP[0], 1500, 240, 1700, '215,255,225', .13 * lampOn, 'screen');
  V2.dust(120, 620, 960, 1450, lt, { n: 46, alpha: .5, size: 3, speed: 8, color: '230,255,235' });
  // set dressing: the clock and the framed Moon, the chart, tape on the floor
  chartLines();
  drawWallShadows(xs, lampOn);
  wallClock(lt); moonFrame(lt);
  ctx.fillStyle = 'rgba(255,214,10,.85)';
  xs.forEach(x => { ctx.fillRect(x - 46, E_FEET + 22, 92, 7); });
  confettiEnd(lt, 1.15);
  chartLabels();
  xs.forEach((x, i) => UI.label(String(i + 1), x, E_FEET + 86, { size: 30, fill: 'rgba(255,214,10,.85)', weight: 900, hero: false, id: 'tapeno' + i }));
  // the six
  V2.setLight({ key: [0, -.85], keyColor: '#fff7de', keyA: .36, rim: '#a8ffd8', rimA: .32, shadow: '#10261d', shadowA: .45, amb: '#c8f0d8', ambA: .1, bounce: '#e0f4d8', bounceA: .14 });
  V2.opts.reflect = false;
  const opts = LINEUP.map((L, i) => lineupOpts(i, lt, xs));
  for (let i = opts.length - 1; i >= 0; i--) drawChar(opts[i]);
  dustPuffs(lt, opts[5]);
  drawBoards(lt, xs, opts);
  // the lamp: a short rod from a ceiling conduit, the shade and the bulb
  ctx.save();
  ctx.fillStyle = V2.grad(0, PIPE_Y, 0, PIPE_Y + 28, [[0, '#6f8a7e'], [.35, '#2c3d36'], [1, '#0d1512']]); ctx.fillRect(-20, PIPE_Y, 1120, 28);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-20, PIPE_Y + 2, 1120, 3);
  for (const x of [120, 540, 960]) { ctx.fillStyle = '#16201b'; rr(x - 22, PIPE_Y - 8, 44, 44, 6); ctx.fill(); ctx.strokeStyle = '#050807'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#8fa89b'; ctx.beginPath(); for (const [sx, sy] of [[-15, -3], [15, -3], [-15, 27], [15, 27]]) { ctx.moveTo(x + sx + 3.2, PIPE_Y + sy); ctx.arc(x + sx, PIPE_Y + sy, 3.2, 0, TAU); } ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; rr(x - 12, PIPE_Y + 3, 24, 18, 3); ctx.stroke(); }
  ctx.translate(LAMP[0], LAMP[1]);
  ctx.fillStyle = '#18221d'; ctx.fillRect(-7, -78, 14, 20);
  ctx.strokeStyle = '#0a0f0d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, PIPE_Y + 34 - LAMP[1]); ctx.lineTo(0, -74); ctx.stroke();
  ctx.fillStyle = V2.grad(-130, 0, 130, 0, [[0, '#1c2723'], [.3, '#5a6e66'], [.5, '#8ea398'], [.75, '#3a4a43'], [1, '#161f1b']]);
  ctx.beginPath(); ctx.moveTo(-132, 14); ctx.quadraticCurveTo(-132, -64, -26, -74); ctx.lineTo(26, -74); ctx.quadraticCurveTo(132, -64, 132, 14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#06090a'; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = '#c9d6cf'; rr(-138, 8, 276, 12, 6); ctx.fill(); ctx.stroke();
  if (lampOn > 0) { ctx.save(); ctx.globalAlpha = lampOn; ctx.fillStyle = V2.radial(0, 22, 4, 60, [[0, 'rgba(255,255,236,1)'], [.4, 'rgba(255,248,200,.7)'], [1, 'rgba(255,240,170,0)']]); ctx.beginPath(); ctx.arc(0, 22, 60, 0, TAU); ctx.fill(); ctx.restore(); V2.emit(LAMP[0], LAMP[1] + 22, 210, '255,250,210', .8 * lampOn); }
  ctx.restore();
  // the photographer's flash: everything in the room whites out for a moment
  const fk = flashK(lt);
  if (fk > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * fk; const fg = ctx.createLinearGradient(0, 640, 0, 1560); fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(.2, '#ffffff'); fg.addColorStop(.8, '#ffffff'); fg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = fg; ctx.fillRect(0, 640, 1080, 920); ctx.restore(); }
}
// ------------------------------------------------------------------ the text: a stack on top, the gag line under the lineup, the teaser
const END_ITEMS = [
  { t: 'THANKS FOR WATCHING', size: 38, weight: 900, spacing: 12, fill: '#ffd1e6', stroke: INKC, lw: 8, gap: 46 },
  { t: 'SHIFT HAPPENS', font: 'Bangers', size: 104, spacing: 5, fill: '#ffd60a', stroke: INKC, lw: 18, shadow: 20, gap: 30 },
  { t: 'THE FLOAT POOL', font: 'Bangers', size: 140, spacing: 5, fill: '#ffffff', stroke: INKC, lw: 22, shadow: 24 },
];
const END_STACK = { cx: 540, top: 128, maxW: 960 };
let E_LAY = null;
function endLayout() {
  if (E_LAY) return E_LAY;
  ctx.save(); ctx.globalAlpha = 0;
  const r = UI.stack(END_ITEMS, END_STACK);
  ctx.restore();
  E_LAY = { thanks: r.boxes[0][0], shift: r.boxes[1][0], float: r.boxes[2][0], y0: r.y0, y1: r.y1 };
  return E_LAY;
}
const GAG_Y = 1548, TEASER_Y = 1726;
const GAG = { pre: 'BREAKS TAKEN TODAY:', size: 58, weight: 900, spacing: 3, lw: 11, gap: 22 };
function gagLine(lt) {
  const k = seg(lt, 3.0, 3.34); if (k <= 0) return;
  const st = { size: GAG.size, weight: GAG.weight, spacing: GAG.spacing }, ink = Object.assign({ lw: 0 }, st);
  const wPre = UI.sizeOf(GAG.pre, ink).w, slotW = Math.max(UI.sizeOf('0', ink).w, UI.sizeOf('1', ink).w), total = wPre + GAG.gap + slotW, x0 = 540 - total / 2;
  const m = UI.metrics('Nunito', GAG.weight), base = GAG_Y + m.cap * GAG.size / 2, sx = x0 + wPre + GAG.gap + slotW / 2;
  const opts = Object.assign({ fill: '#ffe135', stroke: INKC, lw: GAG.lw, shadow: 14 }, st);
  const sc = lerp(1.3, 1, easeBack(k)), cy = GAG_Y;
  popAbout(540, cy, sc, sc, 0, clamp(k * 4), () => {
    UI.write(GAG.pre, x0, base, Object.assign({ align: 'left' }, opts));
    // the counter: 0 until the heist works, then it ticks over to 1
    const flip = lt - 4.25;
    if (flip < .1) UI.write('0', sx, base, Object.assign({ align: 'center' }, opts, { alpha: 1 - clamp(flip / .1) }));
    if (flip > .1) { const q = seg(lt, 4.35, 4.6), e = easeBack(q); popAbout(sx, cy, 1, 1, 26 * (1 - Math.min(1, e)), clamp(q * 3), () => UI.write('1', sx, base, Object.assign({ align: 'center' }, opts))); }
  });
  // the tick: a ring of light as the digit lands
  const r = seg(lt, 4.4, 4.9);
  if (r > 0 && r < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,225,53,${.7 * (1 - r)})`; ctx.lineWidth = 8 * (1 - r) + 1; ctx.beginPath(); ctx.arc(sx, cy, 30 + 90 * easeOut(r), 0, TAU); ctx.stroke(); ctx.restore(); }
}
// the survey clipboard: the teaser's icon (flat art, no text)
function surveyIcon(lt) {
  ctx.save();
  ctx.fillStyle = '#c28a4a'; ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 5; rr(-46, -62, 92, 124, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffdf6'; rr(-37, -46, 74, 100, 5); ctx.fill();
  ctx.fillStyle = '#9aa0a6'; ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 3.5; rr(-18, -72, 36, 20, 6); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 5; i++) {   // five stars, four lit
    const x = -28 + i * 14, on = i < 4, p = i === 3 ? 1 + .12 * Math.sin(lt * 6) : 1;
    ctx.save(); ctx.translate(x, -26); ctx.scale(p, p); ctx.fillStyle = on ? '#ffc83d' : '#d7d3c7'; ctx.strokeStyle = '#2a1c10'; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let j = 0; j < 10; j++) { const a = -PI / 2 + j * PI / 5, r = j % 2 ? 3.4 : 7.4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  for (let i = 0; i < 3; i++) { ctx.fillStyle = '#b5b0cc'; rr(-26, -4 + i * 17, 52 - i * 10, 7, 3); ctx.fill(); ctx.fillStyle = i === 2 ? ALARM : CYAN; ctx.beginPath(); ctx.arc(-31, -0.5 + i * 17, 3.4, 0, TAU); ctx.fill(); }
  ctx.restore();
}
const TEASER = { next: 'NEXT: EPISODE 14', title: 'THE SURVEY' };
function teaser(lt) {
  const k = seg(lt, 4.9, 5.35); if (k <= 0) return;
  const nx = { size: 32, weight: 900, spacing: 5, fill: '#ffd1e6' }, tt = { size: 84, font: 'Bangers', spacing: 3, fill: '#ffffff', stroke: INKC, lw: 12, gap: 10 };
  const wT = Math.max(UI.sizeOf(TEASER.next, nx).w, UI.sizeOf(TEASER.title, tt).w), padT = 14, boxW = Math.ceil(wT + 2 * padT + 2), IW = 150, GAPI = 36, PADP = 64;
  const pw = UI.snap(PADP * 2 + IW + GAPI + boxW, 2), ph = 168, px = 540 - pw / 2, py = TEASER_Y - ph / 2, s2 = lerp(1.18, 1, easeBack(k));
  popAbout(540, TEASER_Y, s2, s2, 40 * (1 - easeOut(k)), clamp(k * 3), () => {
    UI.panel([px, py, pw, ph], { r: ph / 2, fill: 'rgba(8,10,20,.82)', stroke: GOLD, lw: 4, shadow: 24, id: 'teaser-pill', pad: 20 });
    ctx.save(); ctx.translate(px + PADP + IW / 2, TEASER_Y); surveyIcon(lt); ctx.restore();
    const bx = px + PADP + IW + GAPI;
    UI.sign([bx, py + 18, boxW, ph - 36], [Object.assign({ t: TEASER.next }, nx), Object.assign({ t: TEASER.title }, tt)], { fill: false, pad: 6, id: 'teaser-text', size: 32 });
  });
}
function endOver(lt) {
  const L = endLayout(), it = END_ITEMS, cyOf = b => (b.y0 + b.y1) / 2;
  // THANKS FOR WATCHING: a slide up and a fade
  { const k = seg(lt, .22, .6), b = L.thanks; if (k > 0) popAbout(b.cx, cyOf(b), 1, 1, 18 * (1 - easeOut(k)), easeOut(k), () => UI.write(it[0].t, b.cx, b.base, Object.assign({}, it[0], { align: 'center', maxW: END_STACK.maxW }))); }
  // SHIFT HAPPENS pops (it may not grow past the frame: the start is 1.3)
  { const k = seg(lt, .34, .68), sc = lerp(1.3, 1, easeBack(k)), b = L.shift; if (k > 0) popAbout(b.cx, cyOf(b), sc, sc, 0, clamp(k * 4), () => UI.write(it[1].t, b.cx, b.base, Object.assign({}, it[1], { align: 'center', maxW: END_STACK.maxW }))); }
  // THE FLOAT POOL comes down on a stamp: it squashes a little as it lands, and never grows
  { const t0 = .62, fall = seg(lt, t0, t0 + .16), b = L.float;
    if (fall > 0) {
      const land = lt - (t0 + .16), spring = lt < t0 + .16 ? 0 : Math.exp(-land / .09) * Math.cos(land * 38);
      const dy = lt < t0 + .16 ? 44 * (1 - easeOut(fall)) : -5 * spring, sy = lt < t0 + .16 ? 1 + .18 * (1 - fall) : 1 - .1 * spring, sx = lt < t0 + .16 ? 1 - .03 * (1 - fall) : 1 + .025 * spring;
      popAbout(b.cx, cyOf(b), Math.min(sx, 1.03), sy, dy, clamp(fall * 5), () => UI.write(it[2].t, b.cx, b.base, Object.assign({}, it[2], { align: 'center', maxW: END_STACK.maxW })));
    } }
  gagLine(lt);
  teaser(lt);
}
const END = {
  noChyron: true, noScrim: true,
  cam(lt) { zoomTo(540, 1000, 1 + .012 * easeIO(seg(lt, 0, 8))); },
  draw: drawEndWorld,
  fx: lt => ({ bloom: .55, vignette: .5, grain: .05, contrast: .14, sat: .05, tint: [['#0a5a3a', .12, 'soft-light']], fade: lt < .1 ? 1 - lt / .1 : lt > 7.6 ? seg(lt, 7.6, 8) : 0, fadeColor: '2,6,5' }),
  blur: () => 1,
  over: endOver,
  label: () => 'THANKS FOR WATCHING',
};
window.__EP13_SCENES.end = END;
})();
