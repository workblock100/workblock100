'use strict';
/* SHIFT HAPPENS, Episode 14: "The Survey". Scene module: arrive (3:09 PM, THE ENTRANCE CONFERENCE, 24.15 s). Builder E14-C.
 *
 * The lobby of Fruit Bowl as a full-frame perspective set of its own (a one-point room in the v2 renderer, built with V2.proj; nothing is borrowed from the Episode 9 and 11 lobbies).
 * A guard of honour: the staff stand rigid in two pairs either side of an aisle that leads back to the sliding glass doors; Mr. Stateman walks down the aisle out of a blaze of afternoon light.
 * The reception desk and the wall of forty SURVEY READY binders are on the right; the banner WELCOME BACK STRAWBERY (one R short) hangs over the door.
 *
 * THIS FILE IS BUILT IN INCREMENTS (each chunk is syntax-checked and the module is loadable after each one). Status: chunk 1 (helpers, layout, camera).
 *
 * LAYOUT (world X right, Z forward; camera f 1000, height cy 380, horizon hy 665; a sprite at distance D is drawn at scale 1000 / D)
 *   back wall Z 1750 (X -1400..1400, 0..700), doors centred at X 0 (width 520, height 480), banner above them, desk (480..900, Z 1600) with Melon behind it (720, 1660), shelves of binders on the
 *   wall X 420..1100, the stool at (1010, 1690), the cart at (990, 1540), the plant (-560, 1380).  The guard of honour at Z 1450: Lemon -430, Mango -270, Clementine 270, Strawberry 430.
 *   Stateman walks the aisle (X 0) from the doors to Z 1180; the Kumquat trots behind and then beside him (X -205).
 */
(() => {
if (!window.TIMELINE_EP14) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A14 = window.A14;
const { grad, radial, rgba, mix, poly, quad3, proj, p2 } = V2;

// ------------------------------------------------------------------ small helpers
const c01 = x => Math.max(0, Math.min(1, x));
const sk = (t, a, b) => easeIO(seg(t, a, b));                       /* a smooth step between two times */
const sk3 = (t, a, b) => { const k = seg(t, a, b); return k * k * (3 - 2 * k); };
const pulse = (t, t0, hz = 36, tau = .07) => t < t0 ? 0 : Math.sin((t - t0) * hz) * Math.exp(-(t - t0) / tau);   /* a damped ring-down after t0 (the thud, the desk, the bell) */
const bump = (t, t0, t1) => Math.sin(c01((t - t0) / (t1 - t0)) * PI);                                             /* 0 .. 1 .. 0 over [t0, t1] */
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
/* the scene-local time a spoken word starts (copied from ep13_station.js S13.wordT; words are matched by their letters) */
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
/* a route through keyed positions [t, X, Z, ease]: linear travel between keys, 'io' or 'out' to ease a leg (copied from ep13_station.js S13.route) */
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = c01((lt - a[0]) / (b[0] - a[0])), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
/* a smooth keyed value: keys [t, v, ease?], eased between keys (ease 'io' default) */
const track = keys => t => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = c01((t - a[0]) / (b[0] - a[0])); return lerp(a[1], b[1], b[2] === 'lin' ? k : b[2] === 'out' ? easeOut(k) : easeIO(k)); }
  return keys[keys.length - 1][1];
};
const mixh = (a, b, t) => { const m = V2.mix(a, b, t); return '#' + m.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); };   /* hex in, hex out */

// ------------------------------------------------------------------ the layout
const F = 1000, CY = 380, HY = 830;                                   /* the lens, the camera's height above the floor, the horizon on the screen */
const WALL = 1750, CEIL = 860;                                        /* the back wall's depth and the ceiling's height */
const DOOR = { x: 0, w: 520, h: 480 };
const ROW = 1450;                                                      /* the depth of the guard of honour */
const POS = { lemon: -430, mango: -270, clem: 270, straw: 430 };      /* their X (all at Z ROW) */
const DESK = { x0: 330, x1: 880, z: 1600, h: 125 };
const MELON = [690, 1715];
const SHELF = { x0: 300, x1: 900, y0: 150, rows: 4, cols: 10 };
const STOOL = [960, 1690], CART = [1010, 1540], PLANT = [-560, 1380];

// the camera: a perspective camera (cx, cz slide it) and a 2D crop on top of it (CAM.x/y/z through zoomTo)
function setCamera(cx, cz, cy = CY, hy = HY) { V2.setCam({ f: F, cx, cy, cz, hy }); }
const K = (Z, cz = V2.P.cz) => F / (Z - cz);                           /* the scale of something at world depth Z under the current camera */

// ------------------------------------------------------------------ placeholder scene (replaced chunk by chunk; the module is loadable at every step)
const SCN = {
  shot: () => 'wide',
  cam() { setCamera(0, 0); zoomTo(540, 960, 1); },
  draw(lt) { ctx.fillStyle = '#d9c9a6'; ctx.fillRect(-100, -100, W + 200, H + 200); drawCeiling(); drawFloor(); drawBackWall(); drawClockAndBoard(); drawShelves(); drawBanner(lt); drawDoors(Math.min(1, Math.max(0, (lt - .3) / .7)), {}); drawPanels(1); drawRack(); drawStool(); drawCart(); drawDeskBody({}); drawDeskTop({}, lt); drawPlant(lt); },
  fx: () => ({ bloom: .3, vignette: .3 }),
  blur: () => 1,
  over() {},
};
// ------------------------------------------------------------------ the shell: ceiling, floor, back wall (chunk 2)
const PAL = { wall: '#f0e4cb', stripe: '#e8dbbf', sage: '#86a98f', sageHi: '#9bbca3', rail: '#a8794e', base: '#6b5640', tileA: '#e2dbc0', tileB: '#a3bb9d', ceil: '#ecebe5', slate: '#33527a', slateLo: '#1f3554', gold: '#d9a93a' };
const zNear = () => V2.P.cz + 140;                                    /* the nearest depth worth drawing (nothing is drawn behind the lens) */
// a rectangle on a plane of constant depth, as screen [x, y, w, h]
const R = (X0, Y0, X1, Y1, Z = WALL) => { const a = proj(X0, Y1, Z), b = proj(X1, Y0, Z); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; };
const fillR = (X0, Y0, X1, Y1, fill, Z = WALL) => { const r = R(X0, Y0, X1, Y1, Z); ctx.fillStyle = fill; ctx.fillRect(r[0], r[1], r[2], r[3]); };

function drawCeiling() {
  const z0 = zNear(), P = V2.P;
  quad3([-1500, CEIL, z0], [1500, CEIL, z0], [1500, CEIL, WALL], [-1500, CEIL, WALL], PAL.ceil);
  // acoustic tiles: a grid of fine joints that converge on the vanishing point
  ctx.strokeStyle = 'rgba(120,116,104,.2)'; ctx.lineWidth = 1.6;
  for (let x = -1500; x <= 1500; x += 150) { const a = p2(x, CEIL, z0), b = p2(x, CEIL, WALL); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (let z = Math.ceil(z0 / 150) * 150; z <= WALL; z += 150) { const a = p2(-1500, CEIL, z), b = p2(1500, CEIL, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // a shadowed cove where the ceiling meets the back wall
  const top = proj(0, CEIL, WALL)[1];
  ctx.fillStyle = grad(0, top - 90, 0, top, [[0, 'rgba(70,64,56,0)'], [1, 'rgba(70,64,56,.28)']]); ctx.fillRect(-100, top - 90, W + 200, 90);
}
// recessed fluorescent panels (drawn after the wall so the glow lies over it); lamp = 0..1
function drawPanels(lamp = 1) {
  const z0 = zNear();
  for (const zc of [760, 1160, 1560]) for (const xc of [-520, 0, 520]) {
    const zA = zc - 90, zB = zc + 90; if (zA < z0) continue;
    quad3([xc - 150, CEIL - 3, zA], [xc + 150, CEIL - 3, zA], [xc + 150, CEIL - 3, zB], [xc - 150, CEIL - 3, zB], mixh('#cfd3d6', '#fffdf2', lamp), 'rgba(90,92,96,.55)', 2);
    quad3([xc - 128, CEIL - 4, zA + 16], [xc + 128, CEIL - 4, zA + 16], [xc + 128, CEIL - 4, zB - 16], [xc - 128, CEIL - 4, zB - 16], `rgba(255,253,240,${.5 + .45 * lamp})`);
    const [lx, ly, k] = proj(xc, CEIL, zc);
    if (ly > -200 && ly < 700) V2.emit(lx, ly, 150 * k + 40, '255,250,226', .2 * lamp);
  }
}
function drawFloor(o = {}) {
  const z0 = zNear(), Z1 = WALL, tile = 110;
  quad3([-1700, 0, z0], [1700, 0, z0], [1700, 0, Z1], [-1700, 0, Z1], '#cdc7ae');
  const nx = 30, x0 = -1650;
  for (let iz = Math.floor(z0 / tile); iz * tile < Z1; iz++) for (let ix = 0; ix < nx; ix++) {
    const X = x0 + ix * tile, za = Math.max(iz * tile, z0), zb = Math.min((iz + 1) * tile, Z1); if (zb <= za) continue;
    if ((ix + iz) % 2) quad3([X, 0, za], [X + tile, 0, za], [X + tile, 0, zb], [X, 0, zb], PAL.tileB);
    else quad3([X, 0, za], [X + tile, 0, za], [X + tile, 0, zb], [X, 0, zb], PAL.tileA);
  }
  ctx.strokeStyle = 'rgba(70,64,48,.22)'; ctx.lineWidth = 1.6;
  for (let ix = 0; ix <= nx; ix++) { const X = x0 + ix * tile, a = p2(X, 0, z0), b = p2(X, 0, Z1); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (let z = Math.ceil(z0 / tile) * tile; z <= Z1; z += tile) { const a = p2(x0, 0, z), b = p2(x0 + nx * tile, 0, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // the runner: slate blue with a cream border and a gold line, from the doors to the lens
  const RW = 190;
  quad3([-RW - 16, .3, Z1 - 4], [RW + 16, .3, Z1 - 4], [RW + 16, .3, z0], [-RW - 16, .3, z0], '#efe6cd');
  quad3([-RW, .6, Z1 - 4], [RW, .6, Z1 - 4], [RW, .6, z0], [-RW, .6, z0], PAL.slate);
  for (const s of [-1, 1]) quad3([s * (RW - 22), .9, Z1 - 4], [s * (RW - 16), .9, Z1 - 4], [s * (RW - 16), .9, z0], [s * (RW - 22), .9, z0], PAL.gold);
  ctx.strokeStyle = 'rgba(14,26,46,.22)'; ctx.lineWidth = 1.4;
  for (let z = Math.ceil(z0 / 60) * 60; z < Z1; z += 60) { const a = p2(-RW + 24, .9, z), b = p2(RW - 24, .9, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // the welcome mat at the threshold
  quad3([-250, 1, Z1 - 4], [250, 1, Z1 - 4], [250, 1, Z1 - 150], [-250, 1, Z1 - 150], '#4a4f58');
  // the floor goes a little glossy toward the back wall (the doors' light lies on it)
  const fy = proj(0, 0, Z1)[1], by = proj(0, 0, z0)[1];
  ctx.fillStyle = grad(0, fy, 0, Math.min(by, H), [[0, 'rgba(255,248,226,.2)'], [.5, 'rgba(255,248,226,.04)'], [1, 'rgba(60,50,40,.16)']]); ctx.fillRect(0, fy, W, Math.min(by, H) - fy);
}
// the back wall: wallpaper, a sage wainscot with raised panels, the chair rail and the skirting; the door opening is left for drawDoors
function drawBackWall() {
  const X0 = -1500, X1 = 1500;
  fillR(X0, 0, X1, CEIL, PAL.wall);
  for (let x = X0; x < X1; x += 120) fillR(x, 170, x + 36, CEIL, PAL.stripe);
  fillR(X0, 0, X1, 170, PAL.sage);
  for (let x = X0 + 30; x < X1 - 120; x += 230) {   /* raised panels with a lit top edge and a shadowed bottom edge */
    fillR(x, 26, x + 190, 152, PAL.sageHi); fillR(x + 8, 34, x + 182, 144, '#8fb097');
    fillR(x, 144, x + 190, 152, 'rgba(255,255,255,.18)'); fillR(x, 26, x + 190, 34, 'rgba(20,50,30,.2)');
  }
  fillR(X0, 168, X1, 190, PAL.rail); fillR(X0, 184, X1, 190, 'rgba(255,230,190,.35)'); fillR(X0, 168, X1, 174, 'rgba(40,20,10,.35)');
  fillR(X0, 0, X1, 24, PAL.base); fillR(X0, 20, X1, 24, 'rgba(255,255,255,.14)');
  // a soft shade down from the ceiling and up from the floor
  const t = proj(0, CEIL, WALL)[1], b = proj(0, 0, WALL)[1];
  ctx.fillStyle = grad(0, t, 0, t + 120, [[0, 'rgba(80,60,40,.22)'], [1, 'rgba(80,60,40,0)']]); ctx.fillRect(-100, t, W + 200, 120);
  ctx.fillStyle = grad(0, b - 60, 0, b, [[0, 'rgba(60,40,30,0)'], [1, 'rgba(60,40,30,.2)']]); ctx.fillRect(-100, b - 60, W + 200, 60);
}
// ------------------------------------------------------------------ the doors and the lot beyond them (chunk 3)
// the State's white sedan, side view, in its own units (480 long): a slate-blue door panel with a gold star decal
function drawSedan(x, y, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,24,30,.3)'; ell(0, 6, 250, 22); ctx.fill();
  ctx.fillStyle = '#f4f6f8'; ctx.strokeStyle = 'rgba(40,46,58,.8)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-240, -34); ctx.quadraticCurveTo(-246, -64, -214, -70); ctx.lineTo(-120, -76); ctx.lineTo(-84, -118); ctx.quadraticCurveTo(-70, -128, -50, -128); ctx.lineTo(70, -128);
  ctx.quadraticCurveTo(96, -126, 112, -100); ctx.lineTo(136, -76); ctx.lineTo(214, -68); ctx.quadraticCurveTo(246, -62, 242, -32); ctx.lineTo(240, -10); ctx.lineTo(-240, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9fb7cc'; ctx.beginPath(); ctx.moveTo(-70, -112); ctx.lineTo(-58, -120); ctx.lineTo(8, -120); ctx.lineTo(8, -80); ctx.lineTo(-100, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(22, -120); ctx.lineTo(70, -120); ctx.quadraticCurveTo(88, -118, 100, -98); ctx.lineTo(116, -80); ctx.lineTo(22, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAL.slate; ctx.fillRect(-92, -70, 196, 40); ctx.fillStyle = '#f4f6fa'; ctx.fillRect(-92, -52, 196, 3);
  ctx.fillStyle = PAL.gold; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 6 : 14; ctx.lineTo(-62 + Math.cos(a) * r, -50 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  for (const wx of [-150, 150]) { ctx.fillStyle = '#23262c'; ell(wx, -16, 34, 34); ctx.fill(); ctx.fillStyle = '#b9c0c8'; ell(wx, -16, 17, 17); ctx.fill(); }
  ctx.restore();
}
// the lot seen through the glass (screen space, clipped to the opening r): sky blown out by the sun, a tree line, asphalt with bay lines, the sedan
function drawExterior(r, o = {}) {
  const [x, y, w, h] = r, hy = Math.min(Math.max(V2.P.hy, y), y + h);
  ctx.fillStyle = grad(0, y, 0, hy, [[0, '#c4dcf4'], [1, '#f4faff']]); ctx.fillRect(x, y, w, hy - y + 1);
  ctx.fillStyle = '#7f9a86'; ctx.beginPath(); ctx.moveTo(x, hy); for (let i = 0; i <= 12; i++) ctx.lineTo(x + w * i / 12, hy - 14 - 8 * Math.sin(i * 1.9) - 5 * (i % 2)); ctx.lineTo(x + w, hy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = grad(0, hy, 0, y + h, [[0, '#a8b0b8'], [1, '#6a7078']]); ctx.fillRect(x, hy, w, y + h - hy);
  ctx.strokeStyle = 'rgba(250,250,250,.55)'; ctx.lineWidth = Math.max(2, w * .012);
  for (const f of [-1.6, -.8, 0, .8, 1.6]) { ctx.beginPath(); ctx.moveTo(x + w / 2 + f * w * .06, hy + 4); ctx.lineTo(x + w / 2 + f * w * .5, y + h); ctx.stroke(); }
  const k = w / 520 * .62;
  drawSedan(x + w * (.36 + (o.carX || 0)), hy + (y + h - hy) * .4, k * .8);
  if (o.between) o.between(r);
  ctx.fillStyle = 'rgba(255,252,240,.34)'; ctx.fillRect(x, y, w, h);   /* the sun burns the picture out */
}
// the entrance: frame, header, sidelights and the two sliding glass leaves (open 0 shut .. 1 wide open). o.between draws something between the lot and the glass (the visitor outside)
function drawDoors(open = 0, o = {}) {
  const r = R(-260, 0, 260, DOOR.h);
  ctx.save(); ctx.beginPath(); ctx.rect(r[0], r[1], r[2], r[3]); ctx.clip(); drawExterior(r, o);
  // the leaves slide outward, behind the fixed sidelights
  const glass = (X0, X1) => {
    const g = R(X0, 8, X1, DOOR.h - 6);
    ctx.fillStyle = 'rgba(176,212,240,.2)'; ctx.fillRect(...g);
    ctx.save(); ctx.beginPath(); ctx.rect(...g); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.moveTo(g[0] + g[2] * .1, g[1] + g[3]); ctx.lineTo(g[0] + g[2] * .38, g[1] + g[3]); ctx.lineTo(g[0] + g[2] * .9, g[1]); ctx.lineTo(g[0] + g[2] * .62, g[1]); ctx.closePath(); ctx.fill();
    const f = R(X0, 196, X1, 252); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(...f);   /* the frosted safety band */
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 14; i++) { const q = R(X0 + 8 + i * (X1 - X0 - 16) / 13 - 3, 218, X0 + 8 + i * (X1 - X0 - 16) / 13 + 3, 230); ctx.fillRect(...q); }
    ctx.restore();
    const st = fillR; const ink = '#b4bcc6';
    st(X0, 6, X1, 30, ink); st(X0, DOOR.h - 18, X1, DOOR.h - 4, ink); st(X0, 6, X0 + 12, DOOR.h - 4, ink); st(X1 - 12, 6, X1, DOOR.h - 4, ink);
    ctx.strokeStyle = 'rgba(40,50,64,.7)'; ctx.lineWidth = 2; ctx.strokeRect(...g);
  };
  const off = 200 * easeIO(c01(open));
  glass(-220 - off, 0 - off); glass(0 + off, 220 + off);
  ctx.restore();
  // fixed sidelights, jambs, header and threshold, in front of the leaves
  for (const s of [-1, 1]) {
    const a = s < 0 ? -260 : 220, b = s < 0 ? -220 : 260, g = R(a, 8, b, DOOR.h - 6);
    ctx.fillStyle = 'rgba(176,212,240,.34)'; ctx.fillRect(...g); ctx.strokeStyle = 'rgba(40,50,64,.7)'; ctx.lineWidth = 2; ctx.strokeRect(...g);
    fillR(s < 0 ? -282 : 260, 0, s < 0 ? -260 : 282, DOOR.h + 8, '#b7bfc9'); fillR(s < 0 ? -278 : 262, 0, s < 0 ? -272 : 268, DOOR.h + 8, 'rgba(255,255,255,.4)');
  }
  fillR(-300, DOOR.h, 300, DOOR.h + 56, '#8f98a4'); fillR(-300, DOOR.h + 48, 300, DOOR.h + 56, 'rgba(20,28,40,.4)'); fillR(-300, DOOR.h, 300, DOOR.h + 4, 'rgba(255,255,255,.35)');
  fillR(-46, DOOR.h + 14, 46, DOOR.h + 38, '#20262e'); fillR(-8, DOOR.h + 22, 8, DOOR.h + 30, '#ff5a4a');   /* the sensor and its LED */
  fillR(-262, 0, 262, 8, '#6b7480');
  // the light the open doors throw into the room: a halo at the doorway
  const [cx, cy, k] = proj(0, 240, WALL);
  V2.glow(cx, cy, 480 * k + 140, '255,244,214', (.34 + .5 * easeIO(c01(open))) * (o.glare ?? 1), 'screen', .5);
}
// ------------------------------------------------------------------ what hangs on the back wall (chunk 4): banner, clock, notice board, the wall of binders
// where a rectangle of the current drawing frame lands on the screen
const scrBox = (x0, y0, x1, y1) => {
  const m = ctx.getTransform(), pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
/* what to tell the text gate about a string on a surface whose screen box is b: a string the viewer has to read is hero only when it is whole, 40 px inside the frame and clear of the caption zone and the
   clock pill; anything else is dressing, and dressing that the frame edge cuts (a camera move or a zoom) says so with crop */
const gateOf = (b, px, want = false) => {
  const cut = b[0] < 1 || b[1] < 1 || b[2] > W - 1 || b[3] > H - 1, safe = b[0] >= 44 && b[1] >= 44 && b[2] <= W - 44 && b[3] <= H - 44;
  const cap = b[3] > 1380 && b[1] < 1700, pill = b[2] > 48 && b[0] < 500 && b[3] > 116 && b[1] < 244;
  return want && safe && px >= 30 && !cap && !pill ? { hero: true } : { hero: false, crop: cut };
};
// a binder seen from the front of its spine: vinyl in a colour, a label window, the cover edge; the label is live text
const SPINE = ['#27456f', '#2e5f46', '#7a2f35', '#2a2d35', '#4a5a78', '#2b5a6a'];
function spine(X, Y0, wU, hU, i, Z, label, sub, lean = 0) {
  const kk = K(Z), col = SPINE[i % SPINE.length], [sx, sy] = p2(X, Y0 + hU, Z), w = wU * kk, h = hU * kk;
  ctx.save(); ctx.translate(sx + w / 2, sy + h); ctx.rotate(lean); ctx.translate(-w / 2, -h);
  ctx.fillStyle = col; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, 0, w * .12, h); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(w * .86, 0, w * .14, h);
  ctx.strokeStyle = 'rgba(10,10,16,.85)'; ctx.lineWidth = Math.max(1, 2 * kk); ctx.strokeRect(0, 0, w, h);
  const lx = w * .14, ly = h * .12, lw = w * .72, lh = h * .38;
  ctx.fillStyle = '#f6f2e2'; ctx.fillRect(lx, ly, lw, lh); ctx.strokeStyle = 'rgba(10,10,16,.6)'; ctx.lineWidth = Math.max(1, kk); ctx.strokeRect(lx, ly, lw, lh);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(w * .1, h * .88, w * .8, Math.max(1, 3 * kk));
  if (label) {
    const m = ctx.getTransform(), px = 13 * kk, b = scrBox(lx, ly, lx + lw, ly + lh);
    if (px >= 6 && Math.abs(Math.atan2(m.b, m.a)) < .1) {
      const g = gateOf(b, px), id = 'sp' + i;
      UI.container(id, 'label', [lx, ly, lx + lw, ly + lh], 1);
      UI.label(label, lx + lw / 2, ly + lh * .34, Object.assign({ size: 12.5 * kk, fill: '#1b2540', maxW: lw - 4 * kk, cid: id, center: true, centerY: false }, g));
      if (sub) UI.label(sub, lx + lw / 2, ly + lh * .76, Object.assign({ size: 9 * kk, fill: '#7a2f35', maxW: lw - 4 * kk, grp: id }, g));
    }
  }
  ctx.restore();
}
const YEARS = ['2019', '2019', '2020', '2019', '2021', '2019', '2019', '2022', '2019', '2020'];
function drawShelves(st = {}) {
  const Z = WALL - 36, kk = K(Z), x0 = SHELF.x0, x1 = SHELF.x1, pitchX = (x1 - x0 - 24) / SHELF.cols, rowH = 118;
  const top = SHELF.y0 + SHELF.rows * rowH;
  fillR(x0 - 18, SHELF.y0 - 16, x1 + 18, top + 8, '#7a5a3c', WALL - 8);          /* the bookcase's back and uprights */
  fillR(x0, SHELF.y0, x1, top, '#4b3a2a', WALL - 14);
  for (let r = 0; r < SHELF.rows; r++) {
    const y = SHELF.y0 + r * rowH;
    for (let c = 0; c < SHELF.cols; c++) {
      const i = r * SHELF.cols + c, h = 88 + 12 * hash(i * 1.7 + 3), jitter = (hash(i * 3.1) - .5) * 5, lean = (i % 13 === 5 ? .06 : 0) - (i % 17 === 9 ? .05 : 0);
      spine(x0 + 12 + c * pitchX + jitter, y + 12, pitchX - 7, h, i + (r * 2), Z, 'READY', YEARS[(i * 7) % 10], lean);
    }
    fillR(x0 - 14, y, x1 + 14, y + 12, '#a8794e', WALL - 20); fillR(x0 - 14, y + 8, x1 + 14, y + 12, 'rgba(0,0,0,.3)', WALL - 20); fillR(x0 - 14, y, x1 + 14, y + 2.5, 'rgba(255,230,190,.5)', WALL - 20);
  }
  fillR(x0 - 18, top, x1 + 18, top + 18, '#a8794e', WALL - 20); fillR(x0 - 18, SHELF.y0 - 16, x0 - 2, top + 18, '#a8794e', WALL - 20); fillR(x1 + 2, SHELF.y0 - 16, x1 + 18, top + 18, '#a8794e', WALL - 20);
  // the header board above them
  const hb = R(x0 + 38, top + 40, x1 - 38, top + 150, WALL - 14), W2 = hb[2], H2 = hb[3], b = [hb[0], hb[1], hb[0] + W2, hb[1] + H2], px = 92 * K(WALL - 14);
  UI.sign([hb[0], hb[1], W2, H2], 'SURVEY READY', Object.assign({ fill: PAL.slate, stroke: PAL.gold, lw: Math.max(2, 5 * kk), font: 'Bangers', size: 92 * K(WALL - 14), ink: '#f4f7fc', spacing: 4 * kk, r: 10 * kk, shadow: 8, id: 'headsign' }, gateOf(b, px * .7, true)));
}
// the banner over the doors: WELCOME BACK STRAWBERY (one R short), a scalloped pink cloth with balloons on its ends
function drawBanner(lt) {
  const Z = WALL - 10, kk = K(Z), sway = Math.sin(lt * 1.3) * 2;
  const bx0 = -470, bx1 = 190, by0 = 600, by1 = 706, a = R(bx0, by0, bx1, by1, Z);
  const [x, y, w, h] = a;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = '#7a5a3c'; ctx.lineWidth = Math.max(2, 4 * kk); ctx.beginPath(); ctx.moveTo(x - 30 * kk, y - 14 * kk); ctx.quadraticCurveTo(x + w / 2, y + 12 * kk + sway, x + w + 30 * kk, y - 14 * kk); ctx.stroke();
  ctx.fillStyle = '#f7b9cc'; ctx.strokeStyle = '#b3365a'; ctx.lineWidth = Math.max(2, 3.5 * kk);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y + 12 * kk + sway, x + w, y); ctx.lineTo(x + w, y + h - 8 * kk);
  const n = 14; for (let i = n; i >= 0; i--) { const px = x + w * i / n; ctx.lineTo(px, y + h - 8 * kk + (i % 2 ? 12 : 0) * kk + sway * .5); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + 6 * kk, y + 12 * kk, w - 12 * kk, 5 * kk);
  const tb = [x + 24 * kk, y + 14 * kk, x + w - 24 * kk, y + h - 14 * kk], size = 62 * kk;
  UI.label('WELCOME BACK STRAWBERY', x + w / 2, y + h * .5 + 3 * kk + sway * .3, Object.assign({ size, font: 'Lucky', fill: '#fff8dc', stroke: '#b3365a', lw: Math.max(3, 8 * kk), spacing: 1.5 * kk, maxW: w - 52 * kk, id: 'banner' }, gateOf(tb, size * .62, true)));
  // two balloons tied to the ends
  for (const [bxx, col, dy] of [[x - 46 * kk, '#ffd23f', 0], [x + w + 46 * kk, '#79c7ff', 14], [x - 74 * kk, '#ff6f91', 30]]) {
    const by = y - 70 * kk + dy * kk + Math.sin(lt * 1.1 + bxx) * 3;
    ctx.strokeStyle = 'rgba(60,50,60,.7)'; ctx.lineWidth = Math.max(1, 1.6 * kk); ctx.beginPath(); ctx.moveTo(bxx, by + 34 * kk); ctx.quadraticCurveTo(bxx + 8 * kk, by + 80 * kk, x + (bxx < x + w / 2 ? 4 : w - 4) * 1, y + 6 * kk); ctx.stroke();
    ctx.fillStyle = col; ctx.strokeStyle = 'rgba(50,30,40,.6)'; ctx.lineWidth = Math.max(1.5, 2.6 * kk); ell(bxx, by, 28 * kk, 34 * kk); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(bxx - 9 * kk, by - 12 * kk, 7 * kk, 11 * kk, -.5); ctx.fill();
  }
  ctx.restore();
}
// a round wall clock at 3:09 and a cork notice board with pinned papers (dressing)
function drawClockAndBoard() {
  const Z = WALL - 8, kk = K(Z), [cx, cy] = p2(-520, 700, Z), r = 46 * kk;
  ctx.fillStyle = '#f9f6ea'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = Math.max(2, 5 * kk); ell(cx, cy, r, r); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#2a2530'; for (let i = 0; i < 12; i++) { const a = i * PI / 6, r0 = r * (i % 3 ? .82 : .74); ctx.lineWidth = Math.max(1, (i % 3 ? 1.6 : 3) * kk); ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); ctx.lineTo(cx + Math.sin(a) * r * .92, cy - Math.cos(a) * r * .92); ctx.stroke(); }
  const hand = (ang, len, wd) => { ctx.lineWidth = Math.max(1.5, wd * kk); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(ang) * len * r, cy - Math.cos(ang) * len * r); ctx.stroke(); };
  hand((3 + 9 / 60) / 12 * TAU, .5, 5); hand(9 / 60 * TAU, .78, 3.4); ctx.fillStyle = '#2a2530'; ell(cx, cy, 4 * kk, 4 * kk); ctx.fill();
  // the notice board
  const br = R(-1010, 250, -640, 520, Z), [bx, by, bw, bh] = br;
  ctx.fillStyle = '#7a5a3c'; ctx.fillRect(bx - 8 * kk, by - 8 * kk, bw + 16 * kk, bh + 16 * kk); ctx.fillStyle = '#c99a62'; ctx.fillRect(bx, by, bw, bh);
  for (let i = 0; i < 70; i++) { ctx.fillStyle = i % 2 ? 'rgba(120,80,40,.3)' : 'rgba(255,230,180,.28)'; ell(bx + hash(i * 2.1) * bw, by + hash(i * 3.7 + 1) * bh, 2.2 * kk, 1.6 * kk); ctx.fill(); }
  const notes = [[.06, .08, .26, .34, '#fdfaf0', -.03], [.38, .06, .24, .3, '#fff1a8', .04], [.7, .1, .24, .36, '#cfe8ff', -.02], [.1, .52, .3, .38, '#ffd6e0', .03], [.48, .5, .22, .4, '#fdfaf0', -.04], [.74, .56, .2, .3, '#e0f5d2', .02]];
  for (const [fx, fy, fw, fh, col, rot] of notes) {
    ctx.save(); ctx.translate(bx + (fx + fw / 2) * bw, by + (fy + fh / 2) * bh); ctx.rotate(rot); ctx.fillStyle = col; ctx.strokeStyle = 'rgba(60,40,20,.4)'; ctx.lineWidth = Math.max(1, kk);
    ctx.fillRect(-fw * bw / 2, -fh * bh / 2, fw * bw, fh * bh); ctx.strokeRect(-fw * bw / 2, -fh * bh / 2, fw * bw, fh * bh);
    ctx.fillStyle = 'rgba(40,60,100,.45)'; for (let l = 0; l < 4; l++) ctx.fillRect(-fw * bw * .38, -fh * bh * .3 + l * fh * bh * .2, fw * bw * (.76 - (l % 2) * .2), Math.max(1, 2 * kk));
    ctx.fillStyle = '#d6203a'; ell(0, -fh * bh * .46, 3.4 * kk, 3.4 * kk); ctx.fill(); ctx.restore();
  }
}
// ------------------------------------------------------------------ the furniture (chunk 5): desk, cart, stool, plant, pamphlet rack
// a box in the room: its front face, the top (seen from above) and whichever side face the camera can see
function box3(X0, X1, Y0, Y1, Z0, Z1, cF, cT, cS, stroke = 'rgba(30,22,16,.7)') {
  const cx = V2.P.cx, cy = V2.P.cy;
  if (cx < X0) quad3([X0, Y1, Z0], [X0, Y1, Z1], [X0, Y0, Z1], [X0, Y0, Z0], cS, stroke, 2);
  if (cx > X1) quad3([X1, Y1, Z0], [X1, Y1, Z1], [X1, Y0, Z1], [X1, Y0, Z0], cS, stroke, 2);
  if (cy > Y1) quad3([X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1], cT, stroke, 2);
  quad3([X0, Y1, Z0], [X1, Y1, Z0], [X1, Y0, Z0], [X0, Y0, Z0], cF, stroke, 2);
}
// the reception desk: a sage-green front with raised panels and a sign, a cream laminate top, a low ledge on the visitor's side. st.dy = the bounce of the thud (px)
function drawDeskBody(st = {}) {
  const { x0, x1, z, h } = DESK, kk = K(z), dy = (st.dy || 0) * .5;
  ctx.save(); ctx.translate(0, dy);
  const fl = proj(0, 0, z)[1];
  ctx.fillStyle = 'rgba(30,24,18,.28)'; const sh = R(x0 - 20, 0, x1 + 30, 14, z - 10); ctx.fillRect(sh[0], sh[1] - 4, sh[2] + 20, 22 * kk);
  box3(x0, x1, 0, h, z, z + 110, '#6f9a7c', '#efe7d3', '#4f7a5e');
  // raised panels on the front
  const n = 5, pw = (x1 - x0 - 40) / n;
  for (let i = 0; i < n; i++) { fillR(x0 + 20 + i * pw + 8, 18, x0 + 20 + (i + 1) * pw - 8, h - 20, '#7dac8b', z); fillR(x0 + 20 + i * pw + 8, h - 26, x0 + 20 + (i + 1) * pw - 8, h - 20, 'rgba(255,255,255,.2)', z); fillR(x0 + 20 + i * pw + 8, 18, x0 + 20 + (i + 1) * pw - 8, 24, 'rgba(20,50,30,.24)', z); }
  fillR(x0, h - 8, x1, h, '#a8794e', z); fillR(x0, 0, x1, 14, '#6b5640', z);
  // the ledge: a lower shelf along the front edge of the top, where visitors lean
  box3(x0, x1, h, h + 22, z, z + 26, '#e6dcc3', '#f4eedd', '#cbbf9f');
  // the sign on the front
  const sb = R(x0 + 60, 28, x0 + 270, 98, z), g = gateOf([sb[0], sb[1], sb[0] + sb[2], sb[1] + sb[3]], 14 * kk);
  UI.sign([sb[0], sb[1], sb[2], sb[3]], [{ t: 'ALL VISITORS', size: 22 * kk, weight: 900 }, { t: 'PLEASE SIGN IN', size: 22 * kk, weight: 900 }], Object.assign({ fill: '#f7f4e8', stroke: '#33527a', lw: Math.max(1.5, 3 * kk), ink: '#1d2a4a', r: 6 * kk, id: 'deskSign' }, g));
  ctx.restore();
}
// the things on the desk (drawn after Melon, so he stands behind them): monitor, keyboard, phone, bell, pen cup, the pizza box, the sign-in clipboard. st.dy bounce, st.bell = how far the bell dings
function drawDeskTop(st = {}, lt = 0) {
  const { z, h } = DESK, top = h + 22, dy = st.dy || 0, kk = K(z + 20), b = (X, Y, Zz = z + 50) => p2(X, Y, Zz);
  ctx.save(); ctx.translate(0, dy);
  // the pizza box, lid up a little, a slice gone (the budget)
  { const [x, y] = b(790, top - 20, z + 60), s = K(z + 60); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#d6a86a'; ctx.strokeStyle = 'rgba(60,36,16,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(70, 0); ctx.lineTo(62, 20); ctx.lineTo(-62, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e7bf84'; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-52, -34); ctx.lineTo(52, -34); ctx.lineTo(70, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6203a'; ell(0, -17, 22, 9); ctx.fill(); ctx.restore(); }
  // the monitor
  { const [x, y] = b(740, top, z + 80), s = K(z + 80); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#c9c4b4'; ctx.strokeStyle = 'rgba(30,26,20,.85)'; ctx.lineWidth = 2.6; rr(-34, -12, 68, 12, 3); ctx.fill(); ctx.stroke(); ctx.fillRect(-9, -34, 18, 24);
    ctx.fillStyle = '#d8d3c2'; rr(-62, -122, 124, 92, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#16323a'; rr(-52, -112, 104, 72, 4); ctx.fill();
    ctx.fillStyle = 'rgba(120,230,200,.8)'; for (let i = 0; i < 5; i++) ctx.fillRect(-42, -102 + i * 12, 50 + (i % 3) * 14, 4); ctx.restore(); }
  // the keyboard and the old landline phone
  { const [x, y] = b(740, top, z + 40), s = K(z + 40); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#d8d3c2'; ctx.strokeStyle = 'rgba(30,26,20,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.lineTo(56, 14); ctx.lineTo(-56, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  { const [x, y] = b(560, top, z + 60), s = K(z + 60); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = 'rgba(30,26,20,.8)'; ctx.lineWidth = 2.4; rr(-34, -22, 68, 22, 6); ctx.fill(); ctx.stroke(); rr(-40, -34, 80, 14, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // the bell: a silver dome on a little plate; st.bell jumps it and rings two arcs
  { const [x, y] = b(470, top, z + 18), s = K(z + 18), j = (st.bell || 0); ctx.save(); ctx.translate(x, y - j * 7 * s); ctx.scale(s, s);
    ctx.fillStyle = '#b9bfc8'; ctx.strokeStyle = 'rgba(30,34,44,.85)'; ctx.lineWidth = 2.4; ell(0, -2, 26, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = V2.grad(-20, 0, 20, 0, [[0, '#8f98a6'], [.4, '#f4f6fa'], [1, '#7d8696']]); ctx.beginPath(); ctx.moveTo(-22, -4); ctx.quadraticCurveTo(-22, -34, 0, -34); ctx.quadraticCurveTo(22, -34, 22, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6203a'; ell(0, -38, 4.5, 4.5); ctx.fill();
    if (j > .05) { ctx.strokeStyle = `rgba(255,255,255,${j * .9})`; ctx.lineWidth = 3; for (const sd of [-1, 1]) for (const rr2 of [34, 46]) { ctx.beginPath(); ctx.arc(0, -22, rr2, sd < 0 ? PI * 1.12 : -PI * .38, sd < 0 ? PI * 1.38 : -PI * .12); ctx.stroke(); } }
    ctx.restore(); }
  // the pen cup and the sign-in clipboard on the ledge
  { const [x, y] = b(860, top, z + 40), s = K(z + 40); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#33527a'; ctx.strokeStyle = 'rgba(14,20,36,.85)'; ctx.lineWidth = 2.4; rr(-16, -34, 32, 34, 5); ctx.fill(); ctx.stroke();
    for (const [dx, c] of [[-7, '#d6203a'], [0, '#2a6fdb'], [7, '#1d1a22']]) { ctx.fillStyle = c; ctx.save(); ctx.translate(dx, -34); ctx.rotate(dx * .02); ctx.fillRect(-2.4, -26, 4.8, 28); ctx.restore(); } ctx.restore(); }
  { const [x, y] = p2(430, top + 14, z + 12), s = K(z + 12); ctx.save(); ctx.translate(x, y); ctx.scale(s * .9, s * .9); ctx.rotate(-.12); A14.clip(0, -40, { clipPage: .7, clipScale: 1 }); ctx.restore(); }
  ctx.restore();
}
// the rolling cart of binders: a steel frame, three shelves crowded with binders (spines out), a heap on top, four casters
function drawCart(st = {}) {
  const [X, Z] = CART, kk = K(Z), [cx, cy] = p2(X, 0, Z), s = kk;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,24,18,.3)'; ell(0, 6, 160, 18); ctx.fill();
  const shelves = [58, 168, 278];
  for (const [si, y] of shelves.entries()) {
    for (let i = 0; i < 12; i++) { const bw = 17 + (i % 3) * 2, bx = -118 + i * 20, bh = 74 + (hash(i * 2.3 + si * 7) * 16 | 0); ctx.fillStyle = SPINE[(i + si * 2) % SPINE.length]; ctx.strokeStyle = 'rgba(10,10,16,.85)'; ctx.lineWidth = 2; ctx.fillRect(bx, -y - bh, bw, bh); ctx.strokeRect(bx, -y - bh, bw, bh); ctx.fillStyle = '#f6f2e2'; ctx.fillRect(bx + 2.5, -y - bh + 8, bw - 5, 22); }
    ctx.fillStyle = '#c3cad4'; ctx.strokeStyle = 'rgba(30,36,50,.85)'; ctx.lineWidth = 2.6; ctx.fillRect(-134, -y, 268, 10); ctx.strokeRect(-134, -y, 268, 10);
  }
  for (const sx of [-130, 126]) { ctx.fillStyle = '#aab2bd'; ctx.fillRect(sx, -372, 8, 372); ctx.strokeStyle = 'rgba(30,36,50,.85)'; ctx.lineWidth = 2; ctx.strokeRect(sx, -372, 8, 372); }
  ctx.fillStyle = '#c3cad4'; ctx.fillRect(-134, -382, 268, 10); ctx.strokeRect(-134, -382, 268, 10);
  // the heap on top: a leaning stack, one binder fat as a cinder block
  for (const [i, bx, by, bw, bh, r] of [[0, -90, -382, 120, 56, -.02], [1, -70, -438, 112, 50, .03], [2, 24, -382, 90, 44, .02]]) { ctx.save(); ctx.translate(bx + bw / 2, by); ctx.rotate(r); ctx.fillStyle = SPINE[(i * 2 + 1) % SPINE.length]; ctx.strokeStyle = 'rgba(10,10,16,.85)'; ctx.lineWidth = 2.4; ctx.fillRect(-bw / 2, -bh, bw, bh); ctx.strokeRect(-bw / 2, -bh, bw, bh); ctx.fillStyle = '#f6f2e2'; ctx.fillRect(-bw * .38, -bh * .72, bw * .76, bh * .4); ctx.restore(); }
  for (const wx of [-120, 122]) { ctx.fillStyle = '#2a2d35'; ell(wx, -10, 14, 14); ctx.fill(); ctx.fillStyle = '#9aa2ae'; ell(wx, -10, 5, 5); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-134, -372, 12, 372);
  ctx.restore();
}
// a yellow step stool for the trainee
function drawStool() {
  const [X, Z] = STOOL, w = 96, d = 64;
  box3(X - w / 2, X + w / 2, 0, 34, Z - d / 2, Z + d / 2, '#e7b628', '#f6d25a', '#c99a18');
  box3(X - w / 2 + 6, X + w / 2 - 6, 34, 70, Z, Z + d / 2, '#f2c230', '#fbe07a', '#d9a820');
  const t = R(X - w / 2 + 12, 62, X + w / 2 - 12, 70, Z); ctx.fillStyle = 'rgba(30,26,20,.55)'; for (let i = 0; i < 6; i++) ctx.fillRect(t[0] + t[2] * (i + .15) / 6, t[1], t[2] / 10, t[3]);
}
// a potted ficus
function drawPlant(lt) {
  const [X, Z] = PLANT, kk = K(Z), [cx, cy] = p2(X, 0, Z);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(kk, kk); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,24,18,.28)'; ell(0, 6, 90, 14); ctx.fill();
  ctx.fillStyle = V2.grad(-50, 0, 50, 0, [[0, '#a85a36'], [.4, '#d28055'], [1, '#8f4a2b']]); ctx.strokeStyle = 'rgba(50,20,10,.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-52, -92); ctx.lineTo(52, -92); ctx.lineTo(40, 0); ctx.lineTo(-40, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); rr(-58, -106, 116, 20, 6); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -100); ctx.quadraticCurveTo(-6, -150, 4, -190); ctx.stroke();
  for (let i = 0; i < 26; i++) {
    const a = -PI / 2 + (hash(i * 1.9) - .5) * 2.7, L = 62 + hash(i * 3.3) * 48, bx = (hash(i * 5.1) - .5) * 36, by = -120 - hash(i * 7.7) * 70, sw = Math.sin(lt * 1.2 + i) * .03;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(a + sw + PI / 2 - PI / 2);
    ctx.fillStyle = i % 3 ? '#3f8f48' : '#2f7a3c'; ctx.strokeStyle = 'rgba(10,50,20,.85)'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * .3, -L * .22, L, 0); ctx.quadraticCurveTo(L * .3, L * .24, 0, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(200,255,190,.5)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(L * .86, 0); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
// a wire rack of pamphlets standing against the wall
function drawRack() {
  const X = -800, Z = WALL - 70, kk = K(Z), [cx, cy] = p2(X, 0, Z);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(kk, kk); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,24,18,.25)'; ell(0, 6, 80, 12); ctx.fill();
  ctx.strokeStyle = '#4a4f58'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(-52, -300); ctx.moveTo(58, 0); ctx.lineTo(52, -300); ctx.stroke(); ctx.fillStyle = '#4a4f58'; ctx.fillRect(-70, -8, 140, 8);
  for (const [i, y] of [96, 190, 284].entries()) {
    ctx.fillStyle = '#6b7280'; ctx.fillRect(-60, -y, 120, 6);
    for (let j = 0; j < 4; j++) { ctx.fillStyle = ['#ff8a5c', '#5cb8ff', '#ffd23f', '#8fd46a'][(i + j) % 4]; ctx.strokeStyle = 'rgba(30,26,20,.7)'; ctx.lineWidth = 2; ctx.fillRect(-54 + j * 28, -y - 70, 24, 70); ctx.strokeRect(-54 + j * 28, -y - 70, 24, 70); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-50 + j * 28, -y - 58, 16, 5); ctx.fillRect(-50 + j * 28, -y - 46, 12, 3); }
  }
  ctx.restore();
}
/*@@CHUNKS@@*/
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.arrive = SCN;
})();
