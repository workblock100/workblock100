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
const F = 1000, CY = 380, HY = 640;                                   /* the lens, the camera's height above the floor, the horizon on the screen */
const WALL = 1750, CEIL = 860;                                        /* the back wall's depth and the ceiling's height */
const DOOR = { x: 0, w: 520, h: 480 };
const ROW = 1450;                                                      /* the depth of the guard of honour */
const POS = { lemon: -430, mango: -270, clem: 270, straw: 430 };      /* their X (all at Z ROW) */
const DESK = { x0: 480, x1: 900, z: 1600, h: 125 };
const MELON = [720, 1668];
const SHELF = { x0: 420, x1: 1100, y0: 150, rows: 4, cols: 10 };
const STOOL = [1010, 1690], CART = [990, 1540], PLANT = [-560, 1380];

// the camera: a perspective camera (cx, cz slide it) and a 2D crop on top of it (CAM.x/y/z through zoomTo)
function setCamera(cx, cz, cy = CY, hy = HY) { V2.setCam({ f: F, cx, cy, cz, hy }); }
const K = (Z, cz = V2.P.cz) => F / (Z - cz);                           /* the scale of something at world depth Z under the current camera */

// ------------------------------------------------------------------ placeholder scene (replaced chunk by chunk; the module is loadable at every step)
const SCN = {
  shot: () => 'wide',
  cam() { setCamera(0, 0); zoomTo(540, 960, 1); },
  draw(lt) { ctx.fillStyle = '#d9c9a6'; ctx.fillRect(-100, -100, W + 200, H + 200); drawCeiling(); drawFloor(); drawBackWall(); drawDoors(Math.min(1, Math.max(0, (lt - .3) / .7)), {}); drawPanels(1); },
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
  drawSedan(x + w * (.3 + (o.carX || 0)), hy + (y + h - hy) * .42, k);
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
/*@@CHUNKS@@*/
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.arrive = SCN;
})();
