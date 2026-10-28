'use strict';
/* SHIFT HAPPENS, Episode 14: "The Survey". Scene module: arrive (3:09 PM, THE ENTRANCE CONFERENCE, 24.15 s). Builder E14-C.
 *
 * The lobby of Fruit Bowl as a full-frame perspective set of its own (a one-point room in the v2 renderer, built with V2.proj; nothing is borrowed from the Episode 9 and 11 lobbies).
 * A guard of honour: the staff stand rigid in two pairs either side of an aisle that leads back to the sliding glass doors; Mr. Stateman walks down the aisle out of a blaze of afternoon light.
 * The reception desk and the wall of forty SURVEY READY binders are on the right; the banner WELCOME BACK STRAWBERY (one R short) hangs over the door.
 *
 * STRUCTURE (top to bottom): helpers and layout; the scene object SCN (cam, draw, fx, blur, over); the shell (ceiling, floor, back wall); the doors and the lot; what hangs on the wall (banner, clock, notice
 * board, the wall of forty binders, with the text gate's gateOf); the furniture (desk, cart, stool, plant, rack); the cast (routes, Stateman, Kumquat, Melon, the guard of honour); lighting and the frame
 * cache; the world drawn back to front; the shot table (SH) with who is in which shot (VIS); the overlays (field-guide tags, THUD, the notes page, the circle page, the binocular view); light in the air
 * (floor pool, sun rays, the thud's dust, the room's breath).
 *
 * LAYOUT (world X right, Z forward; camera f 1000, height 380, horizon at screen y 830; a sprite at distance D from the camera is drawn at scale 1000 / D)
 *   back wall Z 1750 (X -1400..1400, 0..860), the doors centred at X 0 (520 wide, 480 high) with the banner above them, the wall of binders X 300..900 (ten columns, four rows, a SURVEY READY header board),
 *   the reception desk X 330..840 at Z 1600 with Melon behind it at (740, 1715), the Kumquat's stool at (905, 1690), the binder cart at (1150, 1540), the plant at (-560, 1380).
 *   The guard of honour at Z 1450: Lemon -445, Mango -275, Clementine 275, Strawberry 445. Stateman walks the aisle (X 0) from the doors (Z 1795) to Z 1190; the Kumquat trots behind and then beside him.
 *   Characters are front-facing sprites, so the shots are built around that: wide tableaux, close-ups from a different angle on the room (VIS lists who is in each shot), and a binocular view.
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
const gust = t => t > 22.1 ? Math.sin((t - 22.1) * 8) * Math.exp(-(t - 22.1) * 2.4) : 0;     /* the breath of the room: the banner, the balloons and the plant stir when everybody exhales */
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
const POS = { lemon: -445, mango: -275, clem: 275, straw: 445 };      /* their X (all at Z ROW) */
const DESK = { x0: 330, x1: 840, z: 1600, h: 125 };
const MELON = [740, 1715];
const SHELF = { x0: 300, x1: 900, y0: 150, rows: 4, cols: 10 };
const STOOL = [905, 1690], CART = [1150, 1540], PLANT = [-560, 1380];

// the camera: a perspective camera (cx, cz slide it) and a 2D crop on top of it (CAM.x/y/z through zoomTo)
function setCamera(cx, cz, cy = CY, hy = HY) { V2.setCam({ f: F, cx, cy, cz, hy }); }
const K = (Z, cz = V2.P.cz) => F / (Z - cz);                           /* the scale of something at world depth Z under the current camera */

// ------------------------------------------------------------------ the scene object: the camera, the world, the grade, the shutter, the overlays
const SCN = {
  shot: lt => shotAt(lt).id,
  cam(lt) {
    const sh = shotAt(lt), [cx, cz] = sh.p(lt);
    setCamera(cx, cz);
    const F = frame(lt), [x, y, z] = sh.c(lt, F);
    zoomTo(x + 2.5 * Math.sin(lt * .8), y + 2 * Math.sin(lt * .63 + 1), z);          /* a hint of drift, nothing like handheld */
    CAM.shake = (lt >= THUD.t && lt < THUD.t + .5 ? 15 * Math.exp(-(lt - THUD.t) * 10) : 0) + (lt >= STING && lt < STING + .5 ? 14 * Math.exp(-(lt - STING) * 9) : 0);   /* the thud and the sting */
  },
  draw(lt) { drawWorld(lt); },
  fx(lt) {
    const sh = shotAt(lt).id, back = 1 - sk(lt, 1.0, 2.8);
    if (sh === 'binoc') return { bloom: .35, vignette: .1, grain: .06, contrast: .22, sat: .12, tint: [['#9fd4ff', .12, 'soft-light']] };
    return { bloom: .5 + .1 * back, vignette: .36, grain: .05, contrast: .17, sat: .13, tint: [['#ffc98a', .16, 'soft-light'], ['#8fb4ff', .07 * back, 'soft-light']] };
  },
  blur(lt) { const sh = shotAt(lt); if (lt - sh.t0 < .06 || sh.id === 'binoc') return 1; return sh.id === 'walk' || sh.id === 'wide' ? 2 : 1; },
  over(lt) { overlays(lt); },
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
  ctx.fillStyle = `rgba(255,252,240,${o.burn ?? .34})`; ctx.fillRect(x, y, w, h);   /* the sun burns the picture out */
  if (o.core) { ctx.fillStyle = radial(x + w / 2, y + h * .5, 0, h * .78, [[0, `rgba(255,252,236,${o.core})`], [.55, `rgba(255,246,214,${o.core * .55})`], [1, 'rgba(255,240,200,0)']]); ctx.fillRect(x, y, w, h); }   /* a hot core behind the figure */
  if (o.between) o.between(r);
}
// the entrance: frame, header, sidelights and the two sliding glass leaves (open 0 shut .. 1 wide open). o.between draws something between the lot and the glass (the visitor outside)
function drawDoors(open = 0, o = {}) {
  const r = R(-260, 0, 260, DOOR.h);
  { const [cx, cy, k] = proj(0, 240, WALL); V2.glow(cx, cy, 520 * k + 160, '255,244,214', (.3 + .5 * easeIO(c01(open))) * (o.glare ?? 1), 'screen', .1); }   /* the halo the doors throw on the wall around them */
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
}
// ------------------------------------------------------------------ what hangs on the back wall (chunk 4): banner, clock, notice board, the wall of binders
// where a rectangle of the current drawing frame lands on the screen
const scrBox = (x0, y0, x1, y1) => {
  const m = ctx.getTransform(), pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};
/* what to tell the text gate about a string on a surface whose screen box is b: a string the viewer has to read is hero only when it is whole, 40 px inside the frame and clear of the caption zone and the
   clock pill; anything else is dressing, and dressing that the frame edge cuts (a camera move or a zoom) says so with crop */
let NOW = 0;                                                         /* the scene-local time of the frame being drawn (set by drawWorld) */
const hits = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
let HIDE = () => [];                                                 /* the screen rectangles (and the circle) that cover the picture at NOW: filled in with the overlays (chunk 9) */
const gateOf = (b, px, want = false, own = '') => {
  { const m = ctx.getTransform(); px *= Math.hypot(m.a, m.b); }          /* px arrives in the units of the current drawing frame: the camera's zoom makes them bigger on the screen */
  const hid = HIDE(NOW, own), pts = [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]], [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]];
  if (hid.some(r => r.circle ? (b[0] + b[2]) / 2 > 0 && Math.hypot((b[0] + b[2]) / 2 - r.cx, (b[1] + b[3]) / 2 - r.cy) > r.r - 8 : r.ell ? !want && pts.some(q => ((q[0] - r.cx) / r.rx) ** 2 + ((q[1] - r.cy) / r.ry) ** 2 < 1) : hits(b, r))) return { skip: true };
  const cut = b[0] < 1 || b[1] < 1 || b[2] > W - 1 || b[3] > H - 1, safe = b[0] >= 44 && b[1] >= 44 && b[2] <= W - 44 && b[3] <= H - 44;
  const cap = b[3] > 1380 && b[1] < 1700, pill = b[2] > 48 && b[0] < 500 && b[3] > 116 && b[1] < 244;
  if (cut || pill) return { skip: true };   /* no text is ever shown sliced by the frame or half under the clock pill (a sign that does not fit the shot simply is not lettered in it) */
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
      if (g.skip) { ctx.restore(); return; }
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
  const hb = R(x0 + 38, top + 40, x1 - 38, top + 150, WALL - 14), W2 = hb[2], H2 = hb[3], b = scrBox(hb[0], hb[1], hb[0] + W2, hb[1] + H2), px = 92 * K(WALL - 14);
  const hg = gateOf(b, px * .7, true);
  if (!hg.skip) UI.sign([hb[0], hb[1], W2, H2], 'SURVEY READY', Object.assign({ fill: PAL.slate, stroke: PAL.gold, lw: Math.max(2, 5 * kk), font: 'Bangers', size: 92 * K(WALL - 14), ink: '#f4f7fc', spacing: 4 * kk, r: 10 * kk, shadow: 8, id: 'headsign' }, hg));
}
// the banner over the doors: WELCOME BACK STRAWBERY (one R short), a scalloped pink cloth with balloons on its ends
function drawBanner(lt) {
  const Z = WALL - 10, kk = K(Z), sway = Math.sin(lt * 1.3) * 2 + 7 * gust(lt);
  const bx0 = -470, bx1 = 190, by0 = 600, by1 = 706, a = R(bx0, by0, bx1, by1, Z);
  const [x, y, w, h] = a;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = '#7a5a3c'; ctx.lineWidth = Math.max(2, 4 * kk); ctx.beginPath(); ctx.moveTo(x - 30 * kk, y - 14 * kk); ctx.quadraticCurveTo(x + w / 2, y + 12 * kk + sway, x + w + 30 * kk, y - 14 * kk); ctx.stroke();
  ctx.fillStyle = '#f0709c'; ctx.strokeStyle = '#8f1f45'; ctx.lineWidth = Math.max(2, 3.5 * kk);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y + 12 * kk + sway, x + w, y); ctx.lineTo(x + w, y + h - 8 * kk);
  const n = 14; for (let i = n; i >= 0; i--) { const px = x + w * i / n; ctx.lineTo(px, y + h - 8 * kk + (i % 2 ? 12 : 0) * kk + sway * .5); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + 6 * kk, y + 12 * kk, w - 12 * kk, 5 * kk);
  const tb = scrBox(x + 24 * kk, y + 14 * kk, x + w - 24 * kk, y + h - 14 * kk), size = 62 * kk;
  const bg = gateOf(tb, size * .62, true);
  if (!bg.skip) UI.label('WELCOME BACK STRAWBERY', x + w / 2, y + h * .5 + 3 * kk + sway * .3, Object.assign({ size, font: 'Lucky', fill: '#fff8dc', stroke: '#8f1f45', lw: Math.max(3, 8 * kk), spacing: 1.5 * kk, maxW: w - 52 * kk, id: 'banner' }, bg));
  // two balloons tied to the ends
  for (const [bxx, col, dy] of [[x - 46 * kk, '#ffd23f', 0], [x + w + 46 * kk, '#79c7ff', 14], [x - 74 * kk, '#ff6f91', 30]]) {
    const by = y - 70 * kk + dy * kk + Math.sin(lt * 1.1 + bxx) * 3 + 9 * gust(lt + bxx * .001);
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
  const sb = R(x0 + 306, 28, x0 + 500, 98, z), g = gateOf(scrBox(sb[0], sb[1], sb[0] + sb[2], sb[1] + sb[3]), 14 * kk);
  if (!g.skip) UI.sign([sb[0], sb[1], sb[2], sb[3]], [{ t: 'ALL VISITORS', size: 22 * kk, weight: 900 }, { t: 'PLEASE SIGN IN', size: 22 * kk, weight: 900 }], Object.assign({ fill: '#f7f4e8', stroke: '#33527a', lw: Math.max(1.5, 3 * kk), ink: '#1d2a4a', r: 6 * kk, id: 'deskSign' }, g));
  ctx.restore();
}
// the things on the desk (drawn after Melon, so he stands behind them): monitor, keyboard, phone, bell, pen cup, the pizza box, the sign-in clipboard. st.dy bounce, st.bell = how far the bell dings
function drawDeskTop(st = {}, lt = 0) {
  const { z, h } = DESK, top = h + 22, dy = st.dy || 0, kk = K(z + 20), b = (X, Y, Zz = z + 50) => p2(X, Y, Zz);
  ctx.save(); ctx.translate(0, dy);
  // the pizza box, lid up a little, a slice gone (the budget)
  { const [x, y] = b(772, top - 20, z + 36), s = K(z + 36); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#d6a86a'; ctx.strokeStyle = 'rgba(60,36,16,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(70, 0); ctx.lineTo(62, 20); ctx.lineTo(-62, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e7bf84'; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-52, -34); ctx.lineTo(52, -34); ctx.lineTo(70, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6203a'; ell(0, -17, 22, 9); ctx.fill(); ctx.restore(); }
  // (no monitor: it would stand in front of the Administrator's smile)
  { const [x, y] = b(560, top, z + 80), s = K(z + 80); ctx.save(); ctx.translate(x, y); ctx.scale(s * .7, s * .7); ctx.fillStyle = '#e9e1d0'; ctx.strokeStyle = 'rgba(30,26,20,.8)'; ctx.lineWidth = 2.4; rr(-34, -22, 68, 22, 6); ctx.fill(); ctx.stroke(); rr(-40, -34, 80, 14, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // the bell: a silver dome on a little plate; st.bell jumps it and rings two arcs
  { const [x, y] = b(655, top, z + 18), s = K(z + 18), j = (st.bell || 0); ctx.save(); ctx.translate(x, y - j * 7 * s); ctx.scale(s, s);
    ctx.fillStyle = '#b9bfc8'; ctx.strokeStyle = 'rgba(30,34,44,.85)'; ctx.lineWidth = 2.4; ell(0, -2, 26, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = V2.grad(-20, 0, 20, 0, [[0, '#8f98a6'], [.4, '#f4f6fa'], [1, '#7d8696']]); ctx.beginPath(); ctx.moveTo(-22, -4); ctx.quadraticCurveTo(-22, -34, 0, -34); ctx.quadraticCurveTo(22, -34, 22, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6203a'; ell(0, -38, 4.5, 4.5); ctx.fill();
    if (j > .05) { for (const [col, lw] of [[`rgba(30,40,70,${j * .85})`, 7], [`rgba(255,255,255,${j * .95})`, 3.4]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; for (const sd of [-1, 1]) for (const rr2 of [36, 50]) { ctx.beginPath(); ctx.arc(0, -22, rr2, sd < 0 ? PI * 1.12 : -PI * .38, sd < 0 ? PI * 1.38 : -PI * .12); ctx.stroke(); } } }   /* the ding: arcs either side, dark under light so they show on the cream wall */
    ctx.restore(); }
  // the pen cup and the sign-in clipboard on the ledge
  { const [x, y] = b(420, top, z + 70), s = K(z + 70); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#33527a'; ctx.strokeStyle = 'rgba(14,20,36,.85)'; ctx.lineWidth = 2.4; rr(-16, -34, 32, 34, 5); ctx.fill(); ctx.stroke();
    for (const [dx, c] of [[-7, '#d6203a'], [0, '#2a6fdb'], [7, '#1d1a22']]) { ctx.fillStyle = c; ctx.save(); ctx.translate(dx, -34); ctx.rotate(dx * .02); ctx.fillRect(-2.4, -26, 4.8, 28); ctx.restore(); } ctx.restore(); }
  { const [x, y] = p2(372, top + 14, z + 12), s = K(z + 12); ctx.save(); ctx.translate(x, y); ctx.scale(s * .9, s * .9); ctx.rotate(-.12); A14.clip(0, -40, { clipPage: .7, clipScale: 1 }); ctx.restore(); }
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
  const [X, Z] = STOOL, w = 92, d = 62;
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
    const a = -PI / 2 + (hash(i * 1.9) - .5) * 2.7, L = 62 + hash(i * 3.3) * 48, bx = (hash(i * 5.1) - .5) * 36, by = -120 - hash(i * 7.7) * 70, sw = Math.sin(lt * 1.2 + i) * .03 + .05 * gust(lt + i * .02);
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
// ------------------------------------------------------------------ the cast (chunk 6a): where everybody is and what they do, as functions of the scene-local time
const { person, pathDist } = window.H6;
const atY = (X, Y, Z) => { const q = proj(X, Y, Z); return { x: q[0], y: q[1], s: q[2] }; };      /* like V2.at, for something standing at height Y (a stool) */
const LEG = { melon: 90, kumquat: 50, star14: 70, lemon: 90, mango: 90, clem: 86, straw: 92 };
// the face centre in drawChar's frame, and the conversion of a point on the screen into a character's own frame (for hands that must meet a thing in the room)
const toLocal = (o, sx, sy) => { const k = KINDS[o.kind], leg = o.noLegs ? 0 : (k.leg || 90); return [(sx - o.x) / o.s, (sy - (o.y - (o.lift || 0) - (leg + k.ry * .9) * o.s)) / o.s]; };

// Stateman: out in the glare at the doors, then down the aisle, stopping on the runner with the guard of honour behind him
const ST_END = [0, 1190];
const ST_ROUTE = route([[0, 0, 1795], [1.0, 0, 1795], [1.3, 0, 1738, 'io'], [5.95, ST_END[0], ST_END[1], 'io']]);
// the Kumquat: two steps behind him, then beside him, then across the lobby to the stool at the wall of binders (the camera is on others while he goes)
const KQ_ROUTE = route([[0, -125, 1812], [1.2, -125, 1812], [1.6, -140, 1750, 'io'], [5.85, -200, 1280, 'io'], [6.3, -190, 1135, 'io'], [6.9, -120, 1100, 'io'], [7.5, 380, 1150, 'io'], [8.3, 780, 1320, 'io'], [8.85, STOOL[0] - 20, STOOL[1] - 96, 'io'], [9.05, STOOL[0], STOOL[1] - 28, 'io']]);
const KQ_UP = 70;                                                       /* the stool's top step */
// a dark figure against the light: the body path, two legs, two arms, a rim of sun (the doors are behind it)
function silhouette(o, a = 1) {
  if (a <= .01) return;
  const k = KINDS[o.kind], s = o.s, P = PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)), leg = k.leg || 80, hipY = k.shape === 'star' ? k.ry * .74 : k.ry * .8;
  ctx.save(); ctx.translate(o.x, o.y); ctx.globalAlpha *= a; ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.translate(0, -(leg + k.ry * .9));
  const dark = '#06080d';
  ctx.strokeStyle = dark; ctx.lineWidth = 13; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * (k.hip || 30), hipY - 12); ctx.lineTo(sd * (k.hip || 30), hipY + leg); ctx.stroke(); ctx.fillStyle = dark; ell(sd * (k.hip || 30) + sd * 8, hipY + leg + 4, 26, 13); ctx.fill(); }
  ctx.lineWidth = 14; for (const sd of [-1, 1]) { const sx = sd * k.rx * (k.shape === 'star' ? .58 : .92), sy = k.shape === 'star' ? -k.ry * .1 : k.ry * .1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx * 1.18, sy + 74); ctx.lineTo(sx * (sd < 0 ? .55 : .8), sy + 120); ctx.stroke(); }
  if (o.kind === 'star14') { ctx.fillStyle = dark; ctx.fillRect(-62, 30, 52, 76); }   /* the clipboard against his belly */
  ctx.fillStyle = dark; ctx.fill(P);
  if (o.kind === 'kumquat') { ctx.strokeStyle = dark; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -k.ry); ctx.lineTo(2, -k.ry - 14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, -k.ry - 12); ctx.quadraticCurveTo(26, -k.ry - 24, 10, -k.ry - 52); ctx.quadraticCurveTo(-8, -k.ry - 30, 2, -k.ry - 12); ctx.fill(); }
  ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = 'rgba(255,244,214,.9)'; ctx.lineWidth = 9; ctx.stroke(P);
  ctx.restore();
}

function stateO(lt) {
  const [X, Z] = ST_ROUTE(lt), q = V2.at(X, Z);
  const moving = lt > 1.05 && lt < 5.95, rise = sk(lt, 13.95, 14.75), down = sk(lt, 17.4, 17.72), bk = rise * (1 - down), pt = sk(lt, 17.5, 17.72) * (1 - sk(lt, 18.1, 18.4));
  const writing = lt >= 12.45 && lt < 13.3 || lt >= 22.0, reading = lt >= 19.5 && lt < 21.15;
  let pose = writing ? 'write' : reading ? 'read' : 'carry', look = [.6 * Math.sin(lt * .8 + 1), .04], expr = 'stateman';
  if (lt >= B('st2').s) look = [.9, .04];                                                       /* to the desk: "I'll need your staffing sheet." */
  if (lt >= B('a2').s) look = [-.1, .05];
  if (lt >= B('st3').s - .1) look = [.1, .15];
  if (lt >= B('st4').s - .05) { look = [-.05, .02]; expr = 'stateman_brow'; }
  if (lt >= B('st5').s - .05 && lt < B('s2').s) { look = lt < B('st5').s + 1.1 ? [-.15, .5] : [-.05, .02]; expr = 'stateman_brow'; }     /* reads the sheet, then looks up at her */
  if (lt >= B('s2').s + .55) { look = [.05, .03]; expr = 'stateman'; }
  const extra = { pose, look, expr, stride: 36, plant: true, seed: 141, writing: lt >= 22.0 ? 1 : lt >= 12.45 && lt < 13.3 ? .6 : 0, clipPage: lt < 12.4 ? .2 : lt < 22 ? .4 : .5,
    noted: seg(lt, B('st3').s, B('st3').e) * (lt < B('st3').e ? 1 : 0) || (lt >= 22.12 && lt < 22.9 ? seg(lt, 22.12, 22.88) : 0) };
  if (bk > .01 || pt > .01) {   /* the binoculars come out of the jacket and go to his eyes; the clipboard folds away into his hand meanwhile. On "You." they drop and the right hand points */
    const gl = [lerp(-72, -62, bk), lerp(72, -4, bk)], gb = [lerp(84, 62, bk), lerp(98, -4, bk)], gr = [lerp(gb[0], 172, pt), lerp(gb[1], -6, pt)];
    Object.assign(extra, { pose: 'free', arms: { l: 'hold', r: 'hold' }, grip: { l: gl, r: gr }, hold: { l: bk > .35 ? 'fp14_binocs' : 'fp14_clip' }, clipScale: lerp(1, .01, sk(bk, 0, .3)), clipAt: [.2, .1], clipRot: -.1, binocK: sk(bk, .3, 1), binocA: sk(bk, .25, .5), focus: sk(lt, 15.0, 17.2), hand: { r: pt > .3 ? 'point' : 'grip' } });
    if (bk > .35) extra.hold.r = undefined;
  }
  return person(A14.stateman, ST_ROUTE, lt, extra);
}
function kumO(lt) {
  const onStool = lt >= 9.05, [X, Z] = onStool ? STOOL : KQ_ROUTE(lt), q = onStool ? V2.at(STOOL[0], STOOL[1] - 28) : V2.at(X, Z), s = q.s * .72;
  const hop = sk(lt, 8.88, 9.2), lift = (onStool ? KQ_UP * q.s * hop : 0) + 26 * q.s * bump(lt, 8.9, 9.2);
  let look = [.5 * Math.sin(lt * 1.3), .15], expr = 'kum_eager', pose = 'carry', tongue = 0, writing = 0;
  if (lt >= 6.3 && lt < 8.9) look = [.8, .1];
  if (onStool) { look = [.9 * Math.sin((lt - 9.1) * 1.7), -.75]; expr = lt < 9.22 ? 'kum_eager' : 'kum_puzzled'; }
  if (lt >= wordT('k1', 'binder', 10.9)) look = [-.9, .1];                                    /* "...in the binder?" to Melon */
  if (lt >= B('a2').s) { look = [-.9, .05]; expr = 'kum_eager'; }
  if (lt >= B('st3').s) { look = [0, .75]; expr = 'kum_eager'; }                               /* down at his board */
  if (lt >= 13.05 && lt < 14.4) { pose = 'write'; tongue = sk(lt, 13.1, 13.3); writing = 1; look = [.1, .85]; }
  if (lt >= 14.4) { look = [-.3, .05]; pose = 'carry'; expr = 'kum_eager'; }
  if (lt >= B('st5').s) { look = [-.4, .2]; expr = 'kum_puzzled'; }
  if (lt >= 22.1) { pose = 'write'; tongue = 1; writing = lt < 22.9 ? .8 : 0; look = [0, .8]; expr = 'kum_eager'; }
  const extra = { pose, look, expr, tongue, writing, s, lift, stride: 22, plant: true, seed: 142, clipPage: lt < 13 ? .1 : .4 };
  const r = onStool ? A14.kumquat(Object.assign(q, extra)) : person(A14.kumquat, KQ_ROUTE, lt, extra);
  if (r.gaitW != null) r.gaitW /= .72;                                                          /* the gait counts the walker's own units */
  return r;
}
// the Administrator behind the desk (his legs are hidden: the body stands where it would if he did)
const BIND = { x: 480, z: 1655, w: 176, h: 66 };
const binderY = lt => lt < 7.95 ? -90 : lt < 8.55 ? lerp(-40, 250, easeOut(seg(lt, 7.95, 8.55))) : lt < 8.70 ? 250 : lt < 8.84 ? lerp(250, DESK.h, easeIn(seg(lt, 8.70, 8.84))) : DESK.h + 18 * Math.max(0, pulse(lt, 8.84, 22, .12));
function melonO(lt) {
  const q = V2.at(MELON[0], MELON[1]), s = q.s * 1.12, B0 = B('a1').s;
  const dip = bump(lt, 7.5, 8.05) * .5, held = lt >= 7.98 && lt < 8.71, landed = lt >= 8.84;
  const o0 = { x: q.x, y: q.y - LEG.melon * s, s, noLegs: true, noShadow: true, kind: 'melon' };
  const by = binderY(lt), bl = p2(BIND.x + BIND.w / 2 + 12, by + BIND.h * .5, BIND.z - 70);
  let arms = { l: 'rest', r: 'rest' }, grip = {}, hold = {}, expr = 'happy', look = [.4, -.05], sauce = lt < 2.2 ? .6 : 0, smile = sk(lt, 2.8, 3.1) * (1 - sk(lt, 6.2, 6.8)) * .8, lid = undefined;
  if (lt < 1.9) { look = [.1, 0]; }
  // 1.9 to 3.3: the napkin: up to the mouth, three wipes, down; what it leaves is a red smile across his face
  const nap = sk(lt, 1.9, 2.25) * (1 - sk(lt, 3.0, 3.35)), wipe = Math.sin((lt - 2.25) * 15) * 26 * (lt > 2.25 && lt < 3.0 ? 1 : 0);
  if (nap > .01) { arms = { l: 'rest', r: 'hold' }; hold = { r: 'fp14_napkin' }; grip = { r: [lerp(110, 26 + wipe, nap), lerp(96, 30, nap)] }; sauce = lerp(.6, .2, sk(lt, 2.4, 3.0)); look = [.3, -.1]; }
  if (lt >= B('st2').s) look = [-.5, -.05];
  if (lt >= B0 - .55 && lt < B0 + .2) { look = [0, .4]; }                                       /* glances down to where the binder lives */
  if (lt >= 7.5 && !landed) {   /* bends, comes up with the binder in both hands, drops it */
    const gl = toLocal(o0, bl[0], bl[1]);
    if (lt >= 7.9 && held) { arms = { l: 'hold', r: 'rest' }; grip = { l: gl }; }
    else if (lt >= 8.7) { arms = { l: 'up', r: 'rest' }; }   /* the hand that let go flicks up */
  }
  if (landed) { arms = { l: 'rest', r: 'rest' }; expr = 'happy'; }
  if (lt >= wordT('a1', 'binder', 8.67) - .05) expr = 'happy';
  const prow = lt >= 8.84;
  return A9.melon(Object.assign({}, o0, { expr, look, arms, grip, hold, acc: ['suit', 'fp14_sauce'], sauce, sauceSmile: smile, squash: .1 * dip + (prow ? .05 * pulse(lt, 8.84, 20, .15) : 0) + .09 * exh(lt, .1), plant: true, id: 'melon', seed: 93, rot: .02 * Math.sin(lt * 1.1) }));
}
// ------------------------------------------------------------------ the staff (chunk 6b): a guard of honour that is not at ease
const EXH = 22.15;                                                      /* "Perfect." and the whole room breathes out, one after the other */
const exh = (lt, d = 0) => bump(lt, EXH + d, EXH + d + 1.0);
const gaze = (o, st, amp = 1) => [clamp((st.x - o.x) / (230 * (o.s || 1) * 1.25), -1, 1) * amp, clamp(((st.y - 190 * st.s) - (o.y - 200 * o.s)) / (320 * (o.s || 1)), -.5, .5)];
const stiff = (lt, a = 0) => ({ arms: { l: 'down', r: 'down' }, plant: true });
function lemonO(lt, st) {
  const q = V2.at(POS.lemon, ROW), side = sk(lt, 13.45, 14.25) * (1 - sk(lt, 22.35, 22.95));                                         /* she sidles left, behind the plant */
  const o = Object.assign(V2.at(POS.lemon - 112 * side, ROW + 0));
  let look = lt < 1.1 ? [0, 0] : gaze(o, st, .9), expr = 'happy', lid = 0, squash = 0, rot = 0;
  const fl = wordT('a2', 'staff', 11.74) + .2, flinch = bump(lt, fl, fl + .5);
  if (flinch > 0 && lt < fl + .5) { expr = 'shock'; squash = .14 * flinch; rot = -.05 * flinch; look = [.2, .1]; }
  if (side > .02) { expr = 'chill'; look = [.4, -.3]; squash = Math.max(squash, .16 * side); lid = .35; }
  if (lt >= 22.12) { squash = .1 * exh(lt, 0); expr = 'chill'; lid = .3; }
  return A7.lemon(Object.assign(o, { t: lt, look, expr, lid, squash, rot, plant: true, arms: { l: 'down', r: 'down' }, id: 'lemon', face: expr === 'happy' ? { curve: 1.2 } : undefined, seed: 11 }));
}
function mangoO(lt, st) {
  const o = V2.at(POS.mango, ROW), fr = sk(lt, 13.7, 14.3);
  let look = lt < 1.1 ? [0, 0] : gaze(o, st, .9), expr = 'happy', lid = 0, extra = {};
  if (fr > .01) { look = [0, 0]; expr = 'neutral'; lid = .1; extra = { arms: { l: 'hold', r: 'hold' }, grip: { l: [-92, 14], r: [92, 14] }, hold: { l: 'fp14_frame' }, frameA: fr }; }
  if (lt >= 22.12) { extra = { frameA: 1 - sk(lt, 22.12, 22.5), arms: { l: 'hold', r: 'hold' }, grip: { l: [-92, 14], r: [92, 14] }, hold: { l: 'fp14_frame' } }; if (lt >= 22.5) extra = {}; expr = 'chill'; look = [.3, .1]; }
  return A7.mango(Object.assign(o, { t: lt, look, expr, lid, plant: true, arms: { l: 'down', r: 'down' }, id: 'mango', face: expr === 'happy' ? { curve: 1.2 } : undefined, seed: 22, squash: .1 * exh(lt, .06) }, extra));
}
function clemO(lt, st) {
  const o = V2.at(POS.clem, ROW), fr = sk(lt, 14.0, 14.35), nod = fr * (1 - sk(lt, 22.1, 22.4));
  let look = lt < 1.1 ? [0, 0] : gaze(o, st, .9), expr = 'happy', lid = 0;
  if (fr > .02) { look = [0, .45]; expr = 'hopeful'; }
  const t = lt < 14 ? lt : 14.0;                                                                         /* frozen mid-nod: her clock stops */
  return A10.clem(Object.assign(o, { t: lt, look, expr, lid, plant: true, arms: { l: 'down', r: 'down' }, id: 'clem', rot: .04 * nod, squash: .1 * nod + .1 * exh(lt, .12), face: expr === 'happy' ? { curve: 1.2 } : undefined, seed: 33 }));
}
function strawO(lt, st) {
  const o = V2.at(POS.straw, ROW);
  let look = lt < 1.1 ? [0, 0] : gaze(o, st, .9), expr = 'happy', lid = .22;
  if (lt >= 13.5) { expr = 'dead'; lid = .5; look = [-.5, .05]; }
  if (lt >= B('st4').s - .3) { look = [-.15, .02]; }
  if (lt >= B('s1').s) { look = [-.1, .0]; lid = .5; }
  if (lt >= 22.12) { lid = .45; }
  return A11.straw(Object.assign(o, { t: lt, look, expr, lid, plant: true, arms: { l: 'down', r: 'down' }, id: 'straw', badgeSwing: 0, face: expr === 'happy' ? { curve: .9 } : undefined, seed: 44 }));
}

// ------------------------------------------------------------------ lighting and the frame (chunk 6c)
function lightFor(lt) {
  const back = 1 - sk(lt, 1.15, 2.8);                                 /* the backlight of the open doors gives way to the room's own light as the visitor walks in */
  V2.setLight({ key: [lerp(-.5, -.35, back), -.72], keyColor: '#fff0d6', keyA: .24, rim: '#c4dcff', rimA: .5, shadow: '#241a30', shadowA: .34, bounce: '#ffe3b0', bounceA: .2, amb: '#fff0d8', ambA: .05,
    back: back > .03 ? { color: '255,238,200', a: .9 * back, w: 22 } : null, frontDark: .5 * back, shadowLong: .8 * back });
  V2.opts.reflect = true;
}
let FR = null;
function frame(lt) {
  if (FR && FR.lt === lt && FR.cz === V2.P.cz && FR.cx === V2.P.cx) return FR;
  const st = stateO(lt), kq = kumO(lt), me = melonO(lt);
  FR = { lt, cz: V2.P.cz, cx: V2.P.cx, st, kq, me, le: lemonO(lt, st), ma: mangoO(lt, st), cl: clemO(lt, st), sw: strawO(lt, st) };
  for (const id of ALL) FR[id].reflectA = .38;
  if (lt < 6.4 || lt >= 6.9 && lt < 9.3) kq.transit = true;                                      /* he walks in behind the visitor (the guard hides him in turn), then crosses the lobby and leaves the shot */
  if (shotAt(lt).id === 'binoc') for (const id of ['le', 'ma', 'cl', 'sw']) FR[id].transit = true;   /* the view slides along the guard: faces pass through the frame edge */
  return FR;
}
// the big binder, lying on the desk, seen from the front: a navy spine with its label, a cover on top, pages along the edge. Hidden below the desk top until it rises.
function drawBigBinder(lt, kq) {
  const by = binderY(lt); if (by < -60) return;
  const { x, z, w, h } = BIND, hov = by - DESK.h;
  ctx.save();
  if (hov < -4) { const yy = proj(0, DESK.h + 22, DESK.z)[1]; ctx.beginPath(); ctx.rect(-100, -100, W + 200, yy + 100); ctx.clip(); }   /* still behind the desk's front */
  const Y0 = by + 2, kk = K(z);
  quad3([x - w / 2, Y0 + h, z - 70], [x + w / 2, Y0 + h, z - 70], [x + w / 2, Y0 + h, z + 70], [x - w / 2, Y0 + h, z + 70], '#3a5f94', 'rgba(10,14,28,.85)', 2.4);   /* the cover, seen from above */
  quad3([x - w / 2, Y0 + h, z - 70], [x + w / 2, Y0 + h, z - 70], [x + w / 2, Y0, z - 70], [x - w / 2, Y0, z - 70], '#27456f', 'rgba(10,14,28,.9)', 2.6);   /* the spine, facing us */
  if (V2.P.cx < x - w / 2) quad3([x - w / 2, Y0 + h, z - 70], [x - w / 2, Y0 + h, z + 70], [x - w / 2, Y0, z + 70], [x - w / 2, Y0, z - 70], '#1c3556', 'rgba(10,14,28,.85)', 2);
  const lab = R(x - w * .38, Y0 + h * .18, x + w * .38, Y0 + h * .82, z - 70);
  ctx.fillStyle = '#f6f2e2'; ctx.strokeStyle = 'rgba(10,14,28,.8)'; ctx.lineWidth = Math.max(1.5, 2.4 * K(z - 70)); ctx.fillRect(...lab); ctx.strokeRect(...lab);
  const bb = scrBox(lab[0], lab[1], lab[0] + lab[2], lab[1] + lab[3]), px = h * .5 * K(z - 70);
  const subj = ['melon', 'melon2'].includes(shotAt(NOW).id), bgt = gateOf(bb, px, subj, 'bigbinder');
  if (!bgt.skip) UI.container('bigbinder', 'label', [lab[0], lab[1], lab[0] + lab[2], lab[1] + lab[3]], 3);
  if (!bgt.skip) UI.label('THE BINDER', lab[0] + lab[2] / 2, lab[1] + lab[3] / 2, Object.assign({ size: h * .5 * K(z - 70), fill: '#1b2540', font: 'Bangers', maxW: lab[2] - 10, cid: 'bigbinder', center: true }, bgt));
  ctx.restore();
}
// ------------------------------------------------------------------ the world, back to front (chunk 7)
function drawWorld(lt) {
  NOW = lt;
  const F = frame(lt);
  lightFor(lt);
  ctx.fillStyle = '#cfc6b0'; ctx.fillRect(-1200, -1200, W + 2400, H + 2400);
  const open = sk(lt, .3, 1.0), back = 1 - sk(lt, 1.15, 2.8);
  drawCeiling(); drawFloor(); drawBackWall(); drawClockAndBoard(); drawShelves(); drawBanner(lt);
  drawDoors(open, { burn: .34 + .3 * back, core: .9 * back * (.4 + .6 * open), between: () => { if (lt < 1.3) { silhouette(F.st, 1); silhouette(F.kq, 1); } } });
  drawPanels(1);
  drawRack();
  floorLight(lt, open, back);
  const dy = 5 * Math.max(0, pulse(lt, 8.84, 26, .13)), desk = { dy, bell: Math.max(0, pulse(lt, 8.88, 30, .22)) };
  const items = [
    { z: 1715, fn: () => { if (shows(lt, 'me')) drawChar(F.me); } },
    { z: 1690, fn: drawStool },
    { z: 1688, fn: () => { if (lt >= 8.85 && shows(lt, 'kq')) drawChar(F.kq); } },
    { z: 1600, fn: () => drawDeskBody(desk) },
    { z: 1599, fn: () => { drawDeskTop(desk, lt); drawBigBinder(lt, F.kq); } },
    { z: 1540, fn: drawCart },
    { z: ROW, fn: () => { for (const id of ['le', 'ma', 'sw', 'cl']) if (shows(lt, id)) drawChar(F[id]); } },   /* (Clementine last: her NEW badge stays whole beside Strawberry's arm) */
    { z: PLANT[1], fn: () => { if (shotAt(lt).id !== 'lemon') drawPlant(lt); } },   /* (the close-up of Lemon is shot from where the plant is not) */
    { z: ST_ROUTE(lt)[1], fn: () => { if (lt >= 1.3 && shows(lt, 'st')) { drawChar(F.st); silhouette(F.st, 1 - sk(lt, 1.3, 1.75)); } } },
    { z: lt < 8.85 ? KQ_ROUTE(lt)[1] : 0, fn: () => { if (lt >= 1.3 && lt < 8.85 && shows(lt, 'kq')) { drawChar(F.kq); silhouette(F.kq, 1 - sk(lt, 1.3, 1.75)); } } },
  ];
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.fn();
  thudDust(lt);
  breathPuffs(lt, F);
  sunRays(lt, open, back);
}
// ------------------------------------------------------------------ the shots (chunk 8): a perspective camera that can slide (cx) and dolly (cz), and a 2D crop on top of it
const face = (o, z, up = 150) => { const [fx, fy] = faceC(o); return [fx, fy + up / z, z]; };      /* the crop that puts a face `up` px above the centre of the frame */
const body = (o, z, up = 0, dy = 0) => { const k = KINDS[o.kind]; return [o.x, o.y - ((k.leg || 80) + k.ry) * o.s * .9 + dy + up / z, z]; };
const SH = [];
const shot = (id, t0, t1, p, c) => SH.push({ id, t0, t1, p, c });
// the guard of honour, whole, backlit: a very slow push from a wide lens
shot('wide', 0, 1.30, lt => [76, 24 * sk(lt, 0, 1.3)], lt => [540, 930, 1.1]);
// the walk down the aisle: the camera lets him grow, dollying in while the crop tightens
shot('walk', 1.30, 6.35, lt => [76, lerp(24, 44, sk(lt, 1.3, 6.3))], lt => [540, lerp(930, 975, sk(lt, 1.3, 6.3)), 1.1]);
shot('ask', 6.35, 8.14, lt => [0, 150 + 10 * sk(lt, 6.35, 8.14)], (lt, F) => face(F.st, lerp(1.85, 1.95, sk(lt, 6.35, 8.14)), 170));
shot('melon', 8.14, 9.22, lt => [0, 150], (lt, F) => { const [mx, my] = faceC(F.me), z = lerp(1.62, 1.7, sk(lt, 8.14, 9.22)); return [mx - lerp(110, 90, sk(lt, 8.14, 9.22)), my + 90 / z, z]; });
shot('kum', 9.22, 11.54, lt => [0, 150], (lt, F) => face(F.kq, lerp(3.1, 3.3, sk(lt, 9.22, 11.54)), 30));
shot('melon2', 11.54, 11.98, lt => [0, 150], (lt, F) => face(F.me, 2.3, 90));
shot('lemon', 11.98, 12.43, lt => [0, 150], (lt, F) => face(F.le, lerp(2.3, 2.4, sk(lt, 11.98, 12.43)), 150));
shot('noted', 12.43, 13.09, lt => [0, 150], (lt, F) => face(F.st, lerp(2.2, 2.35, sk(lt, 12.43, 13.09)), 170));
shot('kumw', 13.09, 13.95, lt => [0, 150], (lt, F) => face(F.kq, 3.3, 30));
shot('rise', 13.95, 14.9, lt => [0, 150], (lt, F) => face(F.st, lerp(1.9, 2.1, sk(lt, 13.95, 14.9)), 150));
// the binocular view: a sweep along the guard, one face at a time, then the slow whoosh to Strawberry and the lock on her badge
const BINZ = 1.9;
shot('binoc', 14.9, 17.43, lt => [0, 150], (lt, F) => {
  const CC = H / 2 - 800, f = o => { const [x, y] = faceC(o); return [x, y + CC / BINZ]; };   /* the circle's centre (800) is above the middle of the frame (960): the crop centres below the subject to put it in the reticle */
  const L = f(F.le), M = f(F.ma), C = f(F.cl), S = f(F.sw);
  const a = sk(lt, 15.5, 15.85), b = sk(lt, 16.0, 16.3), c = sk(lt, 16.48, 17.22);
  let x = lerp(lerp(lerp(L[0], M[0], a), C[0], b), S[0], c), y = lerp(lerp(lerp(L[1], M[1], a), C[1], b), S[1], c), z = BINZ;
  const lock = sk(lt, 17.28, 17.43);          /* the click: the HUD zooms in on the PER DIEM badge */
  const [sx0, sy0] = faceC(F.sw), bx = sx0 + 64 * F.sw.s, by = sy0 + 104 * F.sw.s;
  return [lerp(x, bx, lock), lerp(y, by + CC / 4.4, lock), lerp(z, 4.4, lock)];
});
shot('you', 17.43, 18.06, lt => [0, 150], (lt, F) => face(F.st, 2.3, 170));
shot('straw1', 18.06, 19.56, lt => [0, 150], (lt, F) => face(F.sw, lerp(2.4, 2.5, sk(lt, 18.06, 19.56)), 160));
shot('sheet', 19.56, 21.21, lt => [0, 150], (lt, F) => face(F.st, lerp(2.15, 2.25, sk(lt, 19.56, 21.21)), 170));
shot('straw2', 21.21, 22.11, lt => [0, 150], (lt, F) => face(F.sw, lerp(2.5, 2.8, sk(lt, 21.21, 22.11)), 160));
shot('exhale', 22.11, 23.2, lt => [140, -100], lt => [540, 960, 1]);
shot('hit', 23.2, 99, lt => [0, 150], (lt, F) => face(F.sw, lerp(3.0, 3.15, sk(lt, 23.2, 24.15)) + .55 * (1 - easeOut(seg(lt, 23.2, 23.42))), 150));   /* a slam in, then a slow push */
const shotAt = lt => SH.find(s => lt < s.t1) || SH[SH.length - 1];
/* who is in each shot: a close-up is a different angle on the room, so the neighbours that the crop would slice are simply not in it (a character is whole in a shot, or out of it) */
const ALL = ['st', 'kq', 'me', 'le', 'ma', 'cl', 'sw'];
const VIS = { wide: ALL, walk: ALL, ask: ['st', 'kq'], melon: ['me', 'kq'], kum: ['kq'], melon2: ['me', 'kq'], lemon: ['le'], noted: ['st'], kumw: ['kq'], rise: ['st'], binoc: ['le', 'ma', 'cl', 'sw'], you: ['st'], straw1: ['sw'], sheet: ['st'], straw2: ['sw'], exhale: ALL, hit: ['sw'] };
const shows = (lt, id) => VIS[shotAt(lt).id].includes(id) && !(shotAt(lt).id === 'binoc' && lt >= 17.3 && id !== 'sw');   /* at the lock the red flash covers the others leaving the view */
// ------------------------------------------------------------------ the overlays (chunk 9): field-guide tags, the THUD, the notes, the binocular view
const toScreen = (x, y) => [(x - CAM.x) * CAM.z + W / 2, (y - CAM.y) * CAM.z + H / 2];
const FG = { cream: '#f2e8cf', green: '#24402e', ochre: '#c98b2c', ink: '#1d1a16', red: '#c23a2b', slate: '#33527a' };
const TAGS = [
  { id: 'tagS', t0: 2.05, t1: 4.2, w: 560, h: 214, x: 745, y: 420, who: 'st', lines: ['MR. STATEMAN', 'Averrhoa carambola', 'STATE SURVEYOR'], behind: true },
  { id: 'tagK', t0: 4.35, t1: 6.2, w: 560, h: 214, x: 330, y: 420, who: 'kq', lines: ['THE KUMQUAT', 'Citrus japonica', 'TRAINEE'], behind: true, anchor: .2, bend: -.2 },
  { id: 'tagF', t0: 18.15, t1: 19.5, w: 560, h: 214, x: 540, y: 380, who: 'sw', lines: ['STRAWBERRY', 'Fragaria per diem', 'NURSE · UNSCHEDULED'] },
];
const NOTE = { t0: 13.1, t1: 14.5, rect: [250, 290, 580, 284] };
const CIRC = { t0: 22.3, t1: 23.2, rect: [500, 280, 540, 330] };
const THUD = { t: 8.84, x: 330, y: 1190 };
const STING = 23.2;                                                   /* the hard cut to her face */
const BIN = { cx: 540, cy: 800, r: 450, t0: 14.9, t1: 17.43 };
// where the bodies are on the screen (an ellipse each): a wall label behind one is not drawn half-covered
const bodyEll = o => { const k = KINDS[o.kind]; if (!k) return null; const leg = o.noLegs ? 0 : (k.leg || 90), c = toScreen(o.x, o.y - (o.lift || 0) - (leg + k.ry * .9) * o.s); return { ell: true, cx: c[0], cy: c[1], rx: k.rx * o.s * CAM.z * 1.1, ry: k.ry * o.s * CAM.z * 1.1 }; };
HIDE = (lt, own = '') => {
  const out = [], Fr = frame(lt);
  for (const id of ALL) if (shows(lt, id)) { const e = bodyEll(Fr[id]); if (e) out.push(e); }
  if (shotAt(lt).id === 'binoc') out.push({ circle: true, cx: BIN.cx, cy: BIN.cy, r: BIN.r });
  for (const tg of TAGS) if (lt >= tg.t0 && lt < tg.t1) out.push([tg.x - tg.w / 2 - 12, tg.y - tg.h / 2 - 12, tg.x + tg.w / 2 + 12, tg.y + tg.h / 2 + 12]);
  if (lt >= NOTE.t0 && lt < NOTE.t1) out.push([NOTE.rect[0] - 20, NOTE.rect[1] - 40, NOTE.rect[0] + NOTE.rect[2] + 20, NOTE.rect[1] + NOTE.rect[3] + 20]);
  if (lt >= CIRC.t0 && lt < CIRC.t1) out.push([CIRC.rect[0] - 20, CIRC.rect[1] - 20, CIRC.rect[0] + CIRC.rect[2] + 20, CIRC.rect[1] + CIRC.rect[3] + 20]);
  if (lt >= THUD.t && lt < THUD.t + .9) out.push([THUD.x - 260, THUD.y - 130, THUD.x + 260, THUD.y + 130]);
  if (lt >= 7.9 && own !== 'bigbinder') {   /* the big binder hides the labels of the binders behind it */
    const by = binderY(lt), { x, z, w, h } = BIND, pts = [];
    for (const X of [x - w / 2 - 6, x + w / 2 + 6]) for (const Y of [by - 4, by + h + 6]) for (const Z of [z - 70, z + 70]) pts.push(toScreen(...p2(X, Y, Z)));   /* all eight corners of the box */
    out.push([Math.min(...pts.map(q => q[0])) - 2, Math.min(...pts.map(q => q[1])) - 2, Math.max(...pts.map(q => q[0])) + 2, Math.max(...pts.map(q => q[1])) + 2]);
  }
  return out;
};
// the banner's box on the screen (the field-guide strings pass behind it)
const bannerBox = () => { const a = R(-478, 590, 198, 722, WALL - 10), p = toScreen(a[0], a[1]), q = toScreen(a[0] + a[2], a[1] + a[3]); return [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])]; };
// a field-guide tag that pops in beside its subject, with a leader line to it
function fieldTag(lt, tg, F) {
  const k = easeOut(seg(lt, tg.t0, tg.t0 + .3)) * (1 - seg(lt, tg.t1 - .22, tg.t1));
  if (k <= .01) return;
  const [fx, fy] = faceC(F[tg.who]), [sx, sy] = toScreen(fx, fy - 40), dy = (1 - easeOut(seg(lt, tg.t0, tg.t0 + .3))) * -46;
  ctx.save(); ctx.translate(0, dy); ctx.globalAlpha *= clamp(k * 1.6);
  const ax = tg.x + tg.w * (tg.anchor ?? -.32), ay = tg.y + tg.h / 2 - 4;
  ctx.save();
  if (tg.behind) { const b = bannerBox(); ctx.beginPath(); ctx.rect(-60, -500, W + 120, H + 1000); ctx.rect(b[0], b[1] - dy, b[2] - b[0], b[3] - b[1]); ctx.clip('evenodd'); }   /* the string passes behind the banner, never across its lettering */
  ctx.strokeStyle = FG.green; ctx.lineWidth = 4; ctx.setLineDash([2, 9]); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax + tg.w * (tg.bend ?? -.02), (ay + sy) / 2, sx, sy - 14); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  ctx.fillStyle = FG.green; ctx.beginPath(); ctx.arc(sx, sy - 14, 7, 0, TAU); ctx.fill();
  UI.tag([{ t: tg.lines[0], size: 46, weight: 900, fill: FG.ink }, { t: tg.lines[1], size: 36, italic: true, weight: 800, fill: '#3f6b3a' }, { t: tg.lines[2], size: 32, weight: 900, fill: FG.slate, spacing: 1.5 }],
    tg.x, tg.y, { fill: FG.cream, stroke: FG.green, lw: 5, w: tg.w, h: tg.h, id: tg.id, rot: -.025, shadow: 12 });
  ctx.restore();
}
// "THUD!" and the dust it throws
function thudWord(lt) {
  const t0 = THUD.t, k = seg(lt, t0, t0 + .12), f = 1 - seg(lt, t0 + .55, t0 + .85);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(THUD.x, THUD.y); const sc = lerp(1.35, 1, easeOut(k)); ctx.scale(sc, sc); ctx.translate(-THUD.x, -THUD.y);
  UI.label('THUD!', THUD.x, THUD.y, { size: 150, font: 'Bangers', fill: '#ffe135', stroke: '#150f22', lw: 14, spacing: 4, shadow: 14, rot: -.08, id: 'thud' });
  ctx.restore();
}
// the notes: a ruled page that slides in over the Kumquat shot; his handwriting appears as he writes
function notePage(lt) {
  const a = sk(lt, NOTE.t0, NOTE.t0 + .22) * (1 - sk(lt, NOTE.t1 - .2, NOTE.t1)); if (a <= .01) return;
  const [x, y, w, h] = NOTE.rect, dy = (1 - a) * -90;
  ctx.save(); ctx.translate(0, dy); ctx.globalAlpha *= a;
  const pg = UI.page([x, y, w, h], { pitch: 104, top: 112, rot: -.03, id: 'notes', marginLine: false, rule: '#a8bfe0' });
  UI.onRule('NOT IN THE BINDER:', x + 40, 0, pg, { size: 36, italic: false, weight: 900, fill: '#7a2f35', hero: true });
  UI.onRule('THE STAFF', x + 40, 1, pg, { size: 76, fill: '#23408e', reveal: seg(lt, 13.3, 13.95), hero: true });
  ctx.restore();
}
// "OBSERVED: STRAWBERRY" and the red circle the Kumquat draws round her name
function circlePage(lt) {
  const a = sk(lt, CIRC.t0, CIRC.t0 + .2); if (a <= .01) return;
  const [x, y, w, h] = CIRC.rect, dy = (1 - a) * -80;
  ctx.save(); ctx.translate(0, dy); ctx.globalAlpha *= a;
  const pg = UI.page([x, y, w, h], { pitch: 120, top: 108, rot: .03, id: 'obs', rule: '#a8bfe0' });
  UI.onRule('OBSERVED:', x + 40, 0, pg, { size: 36, italic: false, weight: 900, fill: '#7a2f35', hero: true });
  const b = UI.onRule('STRAWBERRY', x + 40, 1, pg, { size: 70, fill: '#23408e', hero: true });
  const prog = sk(lt, 22.5, 22.98);
  if (b && prog > .01) {
    pg.apply();
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, rx = (b.x1 - b.x0) / 2 * 1.1 + 22, ry = (b.y1 - b.y0) / 2 * 1.5 + 14;
    ctx.strokeStyle = FG.red; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, -.05, -PI * .7, -PI * .7 + TAU * 1.04 * prog); ctx.stroke();
    pg.restore();
  }
  ctx.restore();
}
// the binocular view: a round window on the room, a reticle with mil-dots, corner brackets that close on the subject, a rangefinder and a heart-rate readout in the dark corners
const HUD = '#8dff9a';
const READ = [[14.9, 'LEMON', 168, '041'], [15.55, 'MANGO', 142, '047'], [16.05, 'CLEMENTINE', 204, '052'], [16.48, 'STRAWBERRY', 58, '058']];
function binocView(lt, F) {
  const { cx, cy } = BIN, r = BIN.r * lerp(.62, 1, easeOut(seg(lt, BIN.t0, BIN.t0 + .2)));
  const lock = sk(lt, 17.0, 17.28), after = seg(lt, 17.28, 17.6);
  ctx.save();
  ctx.fillStyle = '#03080a'; ctx.beginPath(); ctx.rect(-10, -10, W + 20, H + 20); ctx.arc(cx, cy, r, 0, TAU, true); ctx.fill('evenodd');
  const g = ctx.createRadialGradient(cx, cy, r * .84, cx, cy, r); g.addColorStop(0, 'rgba(3,8,10,0)'); g.addColorStop(1, 'rgba(3,8,10,.72)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#141a1e'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(170,205,225,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r - 1.5, 0, TAU); ctx.stroke();
  // reticle: a cross with a gap, mil-dot ticks, a fine ring
  const col = after > 0 ? '#ff6a5a' : HUD;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'butt'; ctx.globalAlpha *= .9;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 36, cy); ctx.lineTo(cx + sd * (r - 40), cy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, cy + sd * 36); ctx.lineTo(cx, cy + sd * (r - 40)); ctx.stroke(); }
  for (let i = 1; i < 10; i++) for (const sd of [-1, 1]) { const d = 36 + i * 44, h = i % 3 === 0 ? 18 : 9; ctx.beginPath(); ctx.moveTo(cx + sd * d, cy - h); ctx.lineTo(cx + sd * d, cy + h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - h, cy + sd * d); ctx.lineTo(cx + h, cy + sd * d); ctx.stroke(); }
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r * .93, 0, TAU); ctx.stroke();
  // the brackets: wide while it hunts, tight on the lock
  const hb = lerp(190, 84, lock) + 12 * Math.sin(lt * 7) * (1 - lock), bl = 34;
  ctx.lineWidth = 6; ctx.globalAlpha = 1;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sx * hb, cy + sy * (hb - bl)); ctx.lineTo(cx + sx * hb, cy + sy * hb); ctx.lineTo(cx + sx * (hb - bl), cy + sy * hb); ctx.stroke(); }
  if (after > 0) { ctx.globalAlpha = 1 - after; V2.ring(cx, cy, after, { color: '255,106,90', r0: 90, r1: 360, lw: 10, alpha: .95 }); ctx.globalAlpha = 1; }
  // the dark corners: rangefinder, bearing, heart rate, subject
  let rd = READ[0]; for (const q of READ) if (lt >= q[0]) rd = q;
  const hr = rd[2] + Math.round(4 * Math.sin(lt * 9)) , rng = (6.2 - .9 * seg(lt, 16.5, 17.28) + .06 * Math.sin(lt * 3)).toFixed(1);
  const base = { size: 40, fill: col, stroke: '#03080a', lw: 8, font: 'Nunito', weight: 900, spacing: 1 };
  UI.label(after > 0 ? 'LOCK' : 'RNG ' + rng + ' M', 1010, 306, Object.assign({}, base, { align: 'right', id: 'hudR' }));
  UI.label('BRG ' + rd[3] + '°', 64, 306, Object.assign({}, base, { align: 'left', id: 'hudL' }));
  UI.label('BPM ' + hr, 64, 1318, Object.assign({}, base, { align: 'left', id: 'hudB' }));
  UI.label(rd[1], 1010, 1318, Object.assign({}, base, { align: 'right', id: 'hudS' }));
  // a heart trace under the circle
  ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath();
  const per = 60 / hr, x0 = 300, w = 440;
  for (let i = 0; i <= 80; i++) { const u = i / 80, ph = (((lt - u * 1.4) / per) % 1 + 1) % 1, v = ph < .08 ? -Math.sin(ph / .08 * PI) * .35 : ph < .16 ? Math.sin((ph - .08) / .08 * PI) * 1 : ph < .24 ? -Math.sin((ph - .16) / .08 * PI) * .4 : 0; i ? ctx.lineTo(x0 + u * w, 1286 - v * 34) : ctx.moveTo(x0 + u * w, 1286 - v * 34); }
  ctx.stroke();
  if (lt >= 17.28 && lt < 17.4) { ctx.fillStyle = `rgba(255,120,100,${.32 * (1 - seg(lt, 17.28, 17.4))})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}
function overlays(lt) {
  const F = frame(lt);
  for (const tg of TAGS) if (lt >= tg.t0 - .01 && lt < tg.t1) fieldTag(lt, tg, F);
  thudWord(lt);
  if (lt >= NOTE.t0 && lt < NOTE.t1) notePage(lt);
  if (lt >= CIRC.t0 && lt < CIRC.t1) circlePage(lt);
  if (shotAt(lt).id === 'binoc') binocView(lt, F);
  if (lt >= STING && lt < STING + .14) { ctx.fillStyle = `rgba(255,252,240,${.62 * (1 - seg(lt, STING, STING + .14))})`; ctx.fillRect(0, 0, W, H); }   /* the sting: one white frame */
}
// ------------------------------------------------------------------ light in the air and on the floor, and the thud's dust (chunk 10)
// the sun that comes in through the open doors: a warm pool on the floor striped by the door frame's shadows, fanned rays in the haze, motes, and a flare while the doors slide
function floorLight(lt, open, back) {
  const a = (.5 * open + .1) * (.4 + .6 * back);
  if (a < .02) return;
  const zA = WALL - 6, zB = Math.max(zNear() + 60, 760), top = proj(0, 0, zA)[1], bot = proj(0, 0, zB)[1];
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const g = grad(0, top, 0, bot, [[0, `rgba(255,238,196,${a})`], [.5, `rgba(255,226,170,${a * .45})`], [1, 'rgba(255,220,160,0)']]);
  V2.poly([p2(-300, 0, zA), p2(300, 0, zA), p2(820, 0, zB), p2(-820, 0, zB)], g);
  ctx.globalCompositeOperation = 'multiply';   /* the shadows of the door frame's bars lie across the pool */
  for (const X0 of [-282, -220, 0, 220, 282]) { const w0 = X0 === 0 ? 8 : 5, g2 = grad(0, top, 0, bot, [[0, `rgba(70,50,30,${.3 * open * back + .08})`], [1, 'rgba(70,50,30,0)']]); V2.poly([p2(X0 - w0, 0, zA), p2(X0 + w0, 0, zA), p2(X0 * 3 + w0 * 2.4, 0, zB), p2(X0 * 3 - w0 * 2.4, 0, zB)], g2); }
  ctx.restore();
}
function sunRays(lt, open, back) {
  const a = open * back; if (a < .02) return;
  const [cx, cy] = p2(0, 250, WALL - 20), dr = R(-266, 0, 266, DOOR.h + 10);
  ctx.save();
  ctx.beginPath(); ctx.rect(-2400, -2400, W + 4800, H + 4800); ctx.rect(dr[0], dr[1], dr[2], dr[3]); ctx.clip('evenodd');   /* the visitor stands in the opening: the haze never veils him */
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 11; i++) {
    const ang = PI / 2 + (i - 5) * .27 + Math.sin(lt * .5 + i * 1.7) * .02, L = 1500, w = 40 + 28 * ((i * 7) % 5), al = .11 * a * (.55 + .45 * Math.sin(lt * .9 + i));
    const x1 = cx + Math.cos(ang) * L, y1 = cy + Math.sin(ang) * L, nx = -Math.sin(ang), ny = Math.cos(ang);
    ctx.fillStyle = grad(cx, cy, x1, y1, [[0, `rgba(255,240,200,${al})`], [.6, `rgba(255,232,180,${al * .45})`], [1, 'rgba(255,230,170,0)']]);
    ctx.beginPath(); ctx.moveTo(cx + nx * 6, cy + ny * 6); ctx.lineTo(x1 + nx * w, y1 + ny * w); ctx.lineTo(x1 - nx * w, y1 - ny * w); ctx.lineTo(cx - nx * 6, cy - ny * 6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  { const k0 = K(WALL - 20); ctx.save(); ctx.beginPath(); ctx.rect(-2400, -2400, W + 4800, H + 4800); ctx.rect(dr[0], dr[1], dr[2], dr[3]); ctx.clip('evenodd'); V2.glow(cx, cy + 40 * k0, 660 * k0 + 200, '255,244,214', .34 * a, 'screen', .3); ctx.restore(); }   /* the blaze bleeds out of the doorway into the haze */
  V2.dust(cx - 520, cy - 150, cx + 520, cy + 760, lt, { n: 46, seed: 14, alpha: .6 * a, size: 3.4, speed: 9 });
  const fl = bump(lt, .3, 1.7); if (fl > 0) { const [fx, fy] = toScreen(...p2(-210, 430, WALL - 20)); V2.flare(fx, fy, .4 * fl); }   /* the sun itself glints in the top corner of the glass */
}
// the dust the binder throws up where it lands, a ring of shock, and the bell's little hop (drawn over the desk top)
function thudDust(lt) {
  const k = lt - THUD.t; if (k < 0 || k > 1.4) return;
  const { x, z, w } = BIND, [sx, sy] = p2(x, DESK.h + 20, z - 70), kk = K(z - 70);
  ctx.save();
  V2.ring(sx, sy - 10, k / .5, { color: '255,246,224', r0: 30 * kk, r1: 260 * kk, lw: 10, alpha: .6, squash: .35, bloom: .12 });
  for (let i = 0; i < 14; i++) {   /* puffs of paper dust slide out along the desk top on both sides and lift */
    const dir = i < 7 ? -1 : 1, r = hash(i * 3.3 + 1), t = k - .02 * (i % 4);
    if (t < 0 || t > 1.2) continue;
    const px = sx + dir * (w / 2 * kk + (10 + 200 * easeOut(clamp(t / 1.2)) * (.45 + r)) * kk), py = sy + 4 - (14 + 64 * r) * easeOut(clamp(t / .7)) * kk - 10 * t, rad = (26 + 46 * r) * kk * (.5 + t * 1.4), al = .42 * seg(t, 0, .12) * (1 - seg(t, .3, 1.2));
    ctx.fillStyle = V2.radial(px, py, 0, rad, [[0, `rgba(214,200,176,${al})`], [1, 'rgba(214,200,176,0)']]); ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  ctx.restore();
}
// the room breathes out: two cartoon puffs leave each mouth, staggered along the line
function cloud(x, y, r, al) {
  const C = [[-.55, .12, .7], [0, -.15, .9], [.6, .1, .72]];
  ctx.fillStyle = `rgba(108,122,158,${al})`; for (const [dx, dy, rr] of C) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r + Math.max(1.6, r * .11), 0, TAU); ctx.fill(); }
  ctx.fillStyle = `rgba(255,255,255,${al})`; for (const [dx, dy, rr] of C) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); ctx.fill(); }
}
function breathPuffs(lt, F) {
  if (lt < EXH || lt > EXH + 1.6 || shotAt(lt).id !== 'exhale') return;
  ctx.save();
  for (const [id, d] of [['le', 0], ['ma', .06], ['me', .1], ['cl', .12]]) {
    const o = F[id]; if (!o) continue;
    const k = KINDS[o.kind], [fx, fy] = faceC(o), sc = o.s / .6;
    for (let j = 0; j < 2; j++) {
      const a = lt - (EXH + d + .1 + .22 * j); if (a < 0 || a > .95) continue;
      const u = a / .95, e = easeOut(u), r = (7 + 15 * e) * sc, al = .92 * Math.pow(1 - u, 1.3) * Math.min(1, a * 10);
      cloud(fx + (j ? 22 : -16) * sc * (.4 + e), fy + (k.mouthY + 10) * o.s + (2 + 30 * e) * sc, r, al);
    }
  }
  ctx.restore();
}
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.arrive = SCN;
})();
