'use strict';
/* SHIFT HAPPENS, Episode 12 set: the conference room, a perspective room built on the Episode 6 kit (S6). Exposed as window.S12room.
 * Used by the Episode 12 scenes `signin` (2:58 PM, the sign-in table) and `slides` (3:02 PM, the projected screen and the audience).
 *
 * HOW TO CALL IT (world units: X right, Y up, Z forward; the camera is yours: S12room.cam() sets the shared lens, shots zoom with zoomTo)
 *   S12room.cam({ cx, cy, cz })          // V2.setCam with the room lens (f 1400, hy 860); cx/cy/cz override the camera position
 *   S12room.light(extra)                 // the warm fluorescent preset (V2.setLight); call before drawChar
 *   S12room.shell({ flick })             // FIRST: walls, wainscot, floor tiles, ceiling and its two rows of panels (one row flickers with flick, default 0..1 seconds)
 *   S12room.back({ min, hr })            // the back wall: whiteboard, cork board with flyers, wall clock, the door and the cooler and plant
 *   S12room.screen({ down, drawSlide, t })  // the projector screen on the far wall: down 0 = rolled up in its case, 1 = down. drawSlide(x, y, w, h, t) paints the picture in scene px
 *   S12room.projector({ t, beam })       // the projector on its cart at the left, its fan turning, and the light beam to the screen (beam 0..1)
 *   S12room.table({ t })                 // the long folding table (white cloth) across the room: draw it BEFORE anybody seated behind it
 *   S12room.chair(X, Z, { color })       // one folding chair (the seated character sits in it: lift = seat height in px, see S12room.seatPt)
 *   S12room.pizza({ boxes, t })          // the pizza cart near the door with a stack of boxes (boxes = how many are stacked, the top one may be lifted)
 *   S12room.seatPt(X, Z)                 // {x, y, s} of a seat at X, Z with the body on the seat (Y 120): pass it into a character's options
 *   S12room.pt(X, Y, Z)                  // the screen point of a world point, with its scale: {x, y, s}
 *   S12room.silhouettes(fn, col)         // draws whatever fn draws (characters, props) and fills all of it with one flat dark colour (an audience seen from behind)
 *   S12room.sfxWord, S12room.wordT, S12room.route, S12room.pulse, S12room.sk, S12room.lerpA   // the small helpers the scenes share (copied from ep9_floor.js and ep11_orient.js)
 *
 * LAYOUT (every number is a world coordinate; the sign-in scene and the slides scene use the same room):
 *   back wall   Z = LAY.zb (1320). Whiteboard at X -700..-440 (left), the cork board and the wall clock at X 640..900 (right), the pizza door at X 620..860.
 *   screen      Z = LAY.screen.z (1296), picture X -420..560. Bottom Y = 290 when down, Y 880 when up (rolled into the case above).
 *   table       X -500..480, Z 760..1000, top Y 190. Chairs: far side at Z 1110 (X -440, -180, 80, 340), near side at Z 640 (same X).
 *   projector   on a cart at X -460, Z 980 (the shelf at Y 470, the lens at Y 510): its beam crosses the room to the screen.
 *   camera      f 1100, cz -650, cy 700, hy 860 (LAY.cam). The room is seen from the near side of the table, so the far-side seats face the camera.
 */
(() => {
const { p2, poly, quad3, grad, radial, rgba, mix } = V2;
const S6 = window.S6;
const { box3, onZ, kz, lit } = S6;

// ------------------------------------------------------------------ layout: every number is a world coordinate, shared with the scenes through S12room.LAY
const LAY = {
  zb: 1320, hw: 1000, ch: 960, rail: 150,                         // back wall depth, half width, ceiling height, wainscot top
  screen: { x0: -420, x1: 560, z: 1296, yBot: 290, yTop: 880, caseH: 40 },   // the picture: yBot when down, yTop when rolled up
  board: { x0: -700, x1: -440, y0: 500, y1: 880, z: 1316 },        // the whiteboard on the back wall, left
  clock: { X: 790, Y: 900, r: 46 },                               // the wall clock, right of the screen
  cork: { x0: 640, x1: 900, y0: 580, y1: 820, z: 1316 },          // the cork board under the clock
  door: { x0: 620, x1: 860, y1: 540, z: 1316 },                   // the pizza door, far right (its frame and glass panel)
  table: { x0: -500, x1: 480, z0: 760, z1: 1000, top: 190 },      // the long folding table
  seats: { far: 1110, near: 640, xs: [-440, -180, 80, 340] },    // chair rows: far side (behind the table) and near side (between camera and table)
  projector: { X: -460, Z: 980, Y: 520 },
  pizza: { X: 540, Z: 1230 },
  cooler: { X: -700, Z: 1150 },
  seatY: 120,                                                    // a seated body rests on this height (the chair seat)
  cam: { f: 1100, cz: -650, cy: 700, hy: 860 },
};
const CAMB = LAY.cam;

// ------------------------------------------------------------------ small helpers
const kzP = z => CAMB.f / (z - CAMB.cz);   // the scale at depth z for the room lens
const clamp01 = x => Math.max(0, Math.min(1, x));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const sk = (t, a, b) => { const k = seg(t, a, b); return k * k * (3 - 2 * k); };
const lerpA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
// a pulse: a damped wobble that starts at t0 (a hand tapping a clicker, a tap on a cart)
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
// a route through keyed positions [t, X, Z, ease]
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// scene-relative time of a spoken word, from the recorded line's word timings (a word is line-relative in the timeline)
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// an onomatopoeia that pops in, holds and fades (copied from ep9_floor.js sfxWord)
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
// a billboard standing on the world point (X, Y, Z): its origin is its base centre, 1 unit is 1 world unit, up is -y
const stand = (X, Y, Z, fn, s = 1) => { const [x, y] = p2(X, Y, Z), k = kzP(Z) * s; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(); ctx.restore(); };
// a flat panel lying in the plane of depth Z (whiteboard, flyers, the screen frame): (X, Y) is its centre, w and h are world units, rot in radians
const flat = (X, Y, Z, w, h, rot, fn) => { const [x, y] = p2(X, Y, Z), k = kzP(Z); ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(k, k); fn(-w / 2, -h / 2, w, h); ctx.restore(); };
const shade = (c, f) => lit(c, f);

// ------------------------------------------------------------------ the camera and the light
function cam(o = {}) { V2.setCam({ f: CAMB.f, cz: CAMB.cz, cy: CAMB.cy, hy: CAMB.hy, ...o }); }
function light(extra = {}) {
  V2.setLight(Object.assign({ key: [-.3, -.85], keyColor: '#fff1d6', keyA: .26, rim: '#9fc0ff', rimA: .32, shadow: '#2a2038', shadowA: .3, bounce: '#ffe2b0', bounceA: .12, amb: '#fff0d8', ambA: .07 }, extra));
}

// ------------------------------------------------------------------ the room shell: walls, wainscot, floor tiles, ceiling, and two rows of fluorescent panels
const ROOMCOL = { wall: '#ebe3cc', wain: '#4e8086', floorA: '#c2b59c', floorB: '#968a74', ceil: '#e9e7e0', fog: '#a7adbb' };
function shell(o = {}) {
  S6.shell({ zb: LAY.zb, hw: LAY.hw, ch: LAY.ch, rail: LAY.rail, wall: ROOMCOL.wall, wain: ROOMCOL.wain, floorA: ROOMCOL.floorA, floorB: ROOMCOL.floorB, ceil: ROOMCOL.ceil, fog: ROOMCOL.fog, fogAmt: .22, tile: 130, bright: 1 });
  // two rows of ceiling panels; the left row flickers (a pure function of the flick time)
  const f = o.flick ?? 0, hs = hash(Math.floor(f * 14) * 3.7);
  const on = hs > .3 ? 1 : .35;   // a few frames of dimming, in steps
  for (const [X, flick] of [[-330, 1], [330, on]]) for (let Z = 60; Z < LAY.zb - 220; Z += 260) S6.ceilingLamp(X, Z, LAY.ch, flick === 1 ? 1 : flick, '255,244,214', 110, 200);
}

// ------------------------------------------------------------------ the back wall: whiteboard, cork board with flyers, wall clock, the door, the cooler and the plant
function whiteboard(lt) {
  const b = LAY.board, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, w = b.x1 - b.x0, h = b.y1 - b.y0;
  flat(cx, cy, b.z, w + 26, h + 26, 0, (x, y, ww, hh) => { ctx.fillStyle = '#c9ccd2'; rr(x, y, ww, hh, 8); ctx.fill(); });
  flat(cx, cy, b.z, w, h, 0, (x, y, ww, hh) => { ctx.fillStyle = '#fbfbf7'; rr(x, y, ww, hh, 4); ctx.fill(); });
  const L = (t, row, o = {}) => flat(cx, b.y1 - 40 - row * 72, b.z, w, 1, 0, (x, y) => text(t, x + 24, y, { size: o.size || 36, font: 'Nunito', weight: 900, fill: o.fill || '#2a3f8a', align: 'left', base: 'middle' }));
  L('IN-SERVICE:', 0, { size: 38, fill: '#1d1a2a' });
  L('DIGNITY FIRST', 1, { size: 40, fill: '#d6202e' });
  L('1. Residents are people', 2, { size: 30, fill: '#2a3f8a' });
  L('2. Breaks are optional', 3, { size: 30, fill: '#2a3f8a' });
  L('3. Pizza is always funded', 4, { size: 30, fill: '#2a3f8a' });
  // the one item crossed out: a red line through "Breaks are optional" (its text is drawn in the plane, so the line lands on it)
  flat(cx, b.y1 - 40 - 3 * 72, b.z, w, 1, 0, (x, y) => { ctx.strokeStyle = '#d6202e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 18, y - 1); ctx.lineTo(x + 330, y - 3); ctx.stroke(); });
  flat(cx, b.y1 - 40 - 5 * 72, b.z, w, 1, 0, (x, y) => text('(all staff)', x + 24, y, { size: 26, font: 'Nunito', weight: 800, fill: '#6b6578', align: 'left' }));
  // marker tray
  flat(cx, b.y0 - 14, b.z, w * .6, 14, 0, (x, y, ww, hh) => { ctx.fillStyle = '#b8bcc4'; rr(x, y, ww, hh, 4); ctx.fill(); });
}
function corkBoard() {
  const c = LAY.cork, cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2, w = c.x1 - c.x0, h = c.y1 - c.y0;
  flat(cx, cy, c.z, w + 22, h + 22, 0, (x, y, ww, hh) => { ctx.fillStyle = '#7d5c3e'; rr(x, y, ww, hh, 6); ctx.fill(); });
  flat(cx, cy, c.z, w, h, 0, (x, y, ww, hh) => { ctx.fillStyle = '#c59a64'; rr(x, y, ww, hh, 3); ctx.fill(); });
  const flyers = [
    { t: ['LOST CAT', 'answers to "Mr. Biscuit"'], x: -.62, y: .30, rot: -.05, col: '#fff6d8', hi: '#d6202e' },
    { t: ['WHO TOOK', 'MY YOGURT?'], x: .05, y: .26, rot: .06, col: '#ffffff', hi: '#2a5ac8' },
    { t: ["Luigi's Pizza", 'Tuesdays: half off'], x: -.2, y: -.22, rot: .03, col: '#fff0f0', hi: '#e8852a' },
  ];
  for (const f of flyers) flat(cx + f.x * w / 2 * 1.0, cy + f.y * h / 2, c.z, 128, 96, f.rot, (x, y, ww, hh) => {
    ctx.fillStyle = f.col; ctx.strokeStyle = 'rgba(40,24,20,.5)'; ctx.lineWidth = 1.2; rr(x, y, ww, hh, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = f.hi; ctx.fillRect(x, y, ww, 16);
    text(f.t[0], x + ww / 2, y + 34, { size: 17, font: 'Bangers', weight: 400, fill: '#1d1a2a', align: 'center' });
    text(f.t[1], x + ww / 2, y + 60, { size: 13, font: 'Nunito', weight: 800, fill: '#1d1a2a', align: 'center' });
    ctx.fillStyle = '#e8e0cc'; ell(x + ww - 10, y + 10, 4, 4); ctx.fill();
  });
}
function backWall(o = {}) {
  whiteboard(o.t || 0);
  corkBoard();
  // the wall clock: the time on the clock matches the scene's clock pill (min and hr from the caller)
  S6.wallClock(LAY.clock.X, LAY.clock.Y, LAY.zb - 6, 1, o.min ?? 58, o.hr ?? 2, LAY.clock.r);
  // the pizza door: a frame with a glass panel, far right on the back wall
  const d = LAY.door, dw = d.x1 - d.x0, dx = (d.x0 + d.x1) / 2;
  flat(dx, (d.y1 + 0) / 2 + 0, d.z, dw + 24, d.y1 + 24, 0, (x, y, ww, hh) => { ctx.fillStyle = '#e8e2d2'; ctx.fillRect(x, y, ww, hh); });
  flat(dx, d.y1 / 2, d.z, dw, d.y1, 0, (x, y, ww, hh) => { ctx.fillStyle = '#9fb4bd'; ctx.fillRect(x, y, ww, hh); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x + 14, y + 14, ww - 28, hh * .6); ctx.strokeStyle = '#6c7f87'; ctx.lineWidth = 5; ctx.strokeRect(x + 6, y + 6, ww - 12, hh - 12); });
  flat(d.x1 - 40, d.y1 * .48, d.z, 10, 64, 0, (x, y, ww, hh) => { ctx.fillStyle = '#7b7b84'; rr(x, y, ww, hh, 4); ctx.fill(); });
  // the water cooler and the plant in the back corners
  cooler(LAY.cooler.X, LAY.cooler.Z);
}
// a water cooler: a white body, a blue bottle on top, a tap
function cooler(X, Z) {
  const k = kzP(Z);
  stand(X, 0, Z, () => {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 4, 90, 16); ctx.fill();
    ctx.fillStyle = '#eef0f2'; ctx.strokeStyle = 'rgba(25,16,30,.6)'; ctx.lineWidth = 3; rr(-60, -360, 120, 360, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d9dde3'; rr(-60, -140, 120, 22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4d8fd6'; ctx.beginPath(); ctx.moveTo(-40, -360); ctx.lineTo(40, -360); ctx.lineTo(44, -430); ctx.lineTo(-44, -430); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8d8ea'; rr(-44, -420, 88, 38, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8ecf2'; rr(-28, -210, 56, 14, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3f4c'; ell(-26, -196, 6, 6); ctx.fill(); ell(26, -196, 6, 6); ctx.fill();
  }, 1.0);
  void k;
}

// ------------------------------------------------------------------ the projector screen: a white picture rolled into a case, and the picture's paint hook
// down 0 rolls the picture up into its case; down 1 hangs it full size. The bottom corners sag a little (a few units lower than the middle)
function screen(o = {}) {
  const s = LAY.screen, down = o.down ?? 1, yB = lerp(s.yTop, s.yBot, down), x0 = s.x0, x1 = s.x1, z = s.z;
  // the case, above the picture
  quad3([x0 - 16, s.yTop + s.caseH, z - 6], [x1 + 16, s.yTop + s.caseH, z - 6], [x1 + 16, s.yTop, z], [x0 - 16, s.yTop, z], '#3d3a46', 'rgba(25,16,30,.7)', 3);
  quad3([x0 - 16, s.yTop, z - 6], [x1 + 16, s.yTop, z - 6], [x1 + 16, s.yTop, z], [x0 - 16, s.yTop, z], '#55515f');
  if (down < .01) return;
  // the picture: a white rectangle from yTop down to yB, with a sag at the corners
  const sag = down > .02 ? 8 : 0;
  const pts = [p2(x0, s.yTop, z), p2(x1, s.yTop, z), p2(x1, yB - sag, z), p2((x0 + x1) / 2, yB, z), p2(x0, yB - sag, z)];
  poly(pts, '#f7f6ef', 'rgba(60,56,70,.55)', 3);
  // the screen's own shadow along the case and a soft white glow (the projector's light on the screen)
  const sa = p2(x0, s.yTop, z), sb = p2(x1, s.yTop, z);
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = grad(0, sa[1], 0, sa[1] + 36, [[0, 'rgba(40,36,48,.36)'], [1, 'rgba(40,36,48,0)']]); ctx.fillRect(sa[0], sa[1], sb[0] - sa[0], 36); ctx.restore();
  // the picture: the paint hook gets the screen rectangle in scene px (the slides scene draws the slide here)
  const A = p2(x0, s.yTop, z), B2 = p2(x1, yB - sag, z);
  const rx = A[0], ry = A[1], rw = B2[0] - A[0], rh = B2[1] - A[1];
  ctx.save(); ctx.beginPath(); ctx.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]); ctx.closePath(); ctx.clip();
  if (o.drawSlide) o.drawSlide(rx, ry, rw, rh, o.t || 0);
  ctx.restore();
  return { x: rx, y: ry, w: rw, h: rh };
}

// ------------------------------------------------------------------ the projector on its cart, its fan, and the light beam to the screen
function projector(o = {}) {
  const P = LAY.projector, t = o.t || 0, k = kzP(P.Z), shelfY = P.Y - 50;
  const lens = [P.X + 100, shelfY + 40, P.Z + 90], [lx, ly] = p2(...lens), [sx, sy] = p2(0, 470, LAY.screen.z);
  // the beam: a faint trapezoid from the lens to the screen (screen blend, drawn behind the audience)
  if ((o.beam ?? 0) > 0) {
    const a = o.beam;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad(lx, ly, sx, sy, [[0, `rgba(255,250,236,${.10 * a})`], [.8, `rgba(255,250,236,${.16 * a})`], [1, `rgba(255,250,236,${.05 * a})`]]);
    ctx.beginPath(); ctx.moveTo(lx, ly - 6); ctx.lineTo(sx - 360 * kzP(LAY.screen.z), sy + 200); ctx.lineTo(sx + 360 * kzP(LAY.screen.z), sy + 200); ctx.lineTo(lx, ly + 16); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // the cart: four legs to a shelf, two wheels a leg, the projector on the shelf
  for (const dx of [-120, 120]) for (const dz of [-70, 70]) box3({ x0: P.X + dx - 6, x1: P.X + dx + 6, y0: 0, y1: shelfY, z0: P.Z + dz - 6, z1: P.Z + dz + 6, color: '#4d4f58', top: '#6b6e78', front: '#3c3e47', side: '#34363e', lw: 1 });
  for (const dx of [-120, 120]) for (const dz of [-70, 70]) { const [x, y] = p2(P.X + dx, 0, P.Z + dz); ctx.fillStyle = '#2c2d34'; ell(x, y + 2, 9 * k, 6 * k); ctx.fill(); }
  box3({ x0: P.X - 150, x1: P.X + 150, y0: shelfY - 10, y1: shelfY, z0: P.Z - 90, z1: P.Z + 90, color: '#8c8f9a', top: '#a8abb6', front: '#7a7d88', side: '#6a6d78', lw: 2 });
  // the projector body, on the shelf
  box3({ x0: P.X - 150, x1: P.X + 150, y0: shelfY, y1: shelfY + 80, z0: P.Z - 90, z1: P.Z + 90, color: '#c9cbd3', top: '#e6e8ee', front: '#b8bac3', side: '#9b9da8', edge: 'rgba(25,16,30,.62)' });
  // the lens on the front face (toward the screen, +Z)
  const [ex, ey] = p2(...lens);
  ctx.fillStyle = '#2a2c36'; ell(ex, ey, 26 * k, 26 * k); ctx.fill();
  ctx.fillStyle = '#6b6fb8'; ell(ex, ey, 13 * k, 13 * k); ctx.fill();
  // the fan: a grille on the side, blades turning at a steady rate
  const [fx, fy] = p2(P.X - 150, shelfY + 40, P.Z);
  ctx.save(); ctx.translate(fx, fy); ctx.scale(k, k);
  ctx.fillStyle = '#20222a'; ell(0, 0, 36, 36); ctx.fill();
  ctx.rotate(t * 22);
  ctx.fillStyle = '#7a7e90'; for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(18, 0, 16, 5, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the folding table: a white cloth to the floor, a top slab, and two metal legs at each end
function table(o = {}) {
  const T = LAY.table, top = T.top, cloth = o.cloth || '#f6f4ee';
  // the skirt (the cloth hangs in front), then the top
  box3({ x0: T.x0 + 14, x1: T.x1 - 14, y0: 44, y1: top - 16, z0: T.z0 + 14, z1: T.z1 - 14, color: cloth, top: cloth, front: '#e5e1d6', side: '#d7d2c4', edge: 'rgba(25,16,30,.45)', lw: 1.8 });
  box3({ x0: T.x0, x1: T.x1, y0: top - 16, y1: top, z0: T.z0, z1: T.z1, color: '#fbfaf5', top: '#ffffff', front: '#eeeae0', side: '#dcd7c9', edge: 'rgba(25,16,30,.55)', lw: 2 });
  // the metal legs (visible under the cloth at each end)
  for (const X of [T.x0 + 60, T.x1 - 60]) for (const Z of [T.z0 + 70, T.z1 - 70]) box3({ x0: X - 7, x1: X + 7, y0: 0, y1: 50, z0: Z - 7, z1: Z + 7, color: '#4d4f58', top: '#6b6e78', front: '#3c3e47', side: '#34363e', lw: 1 });
}
// one folding chair: the seat at seatY, a back behind the sitter, folding metal legs
function chair(X, Z, o = {}) {
  S6.chair3(X, Z, { w: 58, d: 56, seat: LAY.seatY, back: o.back ?? 250, color: o.color || '#3e5b8a' });
}
// the screen point of a seat: the body rests on the seat (lift = seatY in px), so a seated character's options take x, y and s from here
function seatPt(X, Z) { const k = kzP(Z); const [x, y] = p2(X, LAY.seatY, Z); return { x, y, s: k, lift: 0 }; }
// the screen point of any world point, with its scale
function pt(X, Y, Z) { const [x, y] = p2(X, Y, Z); return { x, y, s: kzP(Z) }; }

// ------------------------------------------------------------------ the pizza cart by the door: a rolling cart and a stack of boxes (the top one may be lifted by `lift` px)
function pizza(o = {}) {
  const P = o.at || LAY.pizza, n = o.boxes ?? 4, lift = o.lift || 0, tap = o.tap || 0;
  const k = kzP(P.Z);
  // the cart: a shelf at 60, the frame, wheels
  box3({ x0: P.X - 150, x1: P.X + 150, y0: 58, y1: 70, z0: P.Z - 90, z1: P.Z + 90, color: '#9a9ca6', top: '#b5b8c2', front: '#8a8d97', side: '#7b7e88', lw: 2 });
  for (const [dx, dz] of [[-120, -70], [120, -70], [-120, 70], [120, 70]]) { const [x, y] = p2(P.X + dx, 0, P.Z + dz); ctx.fillStyle = '#2c2d34'; ell(x, y + 2, 9 * k, 6 * k); ctx.fill(); }
  // the boxes: each a cardboard box with a red lid label, stacked from the shelf upward
  for (let i = 0; i < n; i++) {
    const y0 = 70 + i * 34 + (i === n - 1 ? lift : 0) - (i === n - 1 ? tap * 8 : 0);
    box3({ x0: P.X - 118, x1: P.X + 118, y0, y1: y0 + 30, z0: P.Z - 84, z1: P.Z + 84, color: '#e9cfa3', top: '#f2dcb5', front: '#dcb98a', side: '#c9a574', lw: 2 });
    const [cx, cy] = p2(P.X, y0 + 30, P.Z);
    ctx.fillStyle = '#d6402e'; ell(cx, cy, 16 * k, 6 * k); ctx.fill();
  }
}

// ------------------------------------------------------------------ silhouettes: whatever fn draws (characters, props) is painted into a scratch picture and filled with one flat dark colour
const SIL = V2.mk(W, H);
function silhouettes(fn, col = '#1b1427', alpha = 1) {
  const prev = ctx, g = SIL.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  g.setTransform(prev.getTransform());
  ctx = g;
  try { fn(); } finally { ctx = prev; }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alpha; g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore();
  prev.save(); prev.setTransform(1, 0, 0, 1, 0, 0); prev.drawImage(SIL, 0, 0); prev.restore();
}

// ------------------------------------------------------------------ export
window.S12room = { LAY, CAM: CAMB, cam, light, shell, back: backWall, screen, projector, table, chair, seatPt, pt, pizza, cooler, silhouettes, stand, flat, kzP, sfxWord, wordT, route, pulse, sk, lerpA, shade };
})();
