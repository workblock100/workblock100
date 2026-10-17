'use strict';
/* SHIFT HAPPENS, Episode 10 set: the Administrator's office, a perspective room built on the Episode 6 kit (S6). Exposed as window.S10.
 * Used by the Episode 10 scenes `office` (day, 2:58 PM) and `exit` (night, 10:30 PM) and by the Episode 11 scene `vault` (night, 10:55 PM).
 *
 * HOW TO CALL IT (world units: X right, Y up, Z forward; the camera is yours: V2.setCam(...) before drawing, the set follows it)
 *   const off = S10.office({ night, t: lt, ...options });   // cheap: build one per frame; every method below draws with these options
 *   off.setLight({ ...extra });         // V2.setLight with the preset for this look (day: warm sun, cool shadow; night: cold lamp on the right). Call it before drawChar
 *   off.back();                         // FIRST: ceiling beams, windows with blinds, wall, wainscot, pocket door, portrait + vault, FY BUDGET chart, poster, diplomas, rug, credenza and
 *                                       //        pizza stash, plant, coat stand, the Administrator's tufted chair. Wrap it in V2.dof(px, ...) for a close-up.
 *   off.sunFloor();                     // the sun's stripes on the carpet (day) or moonlight (night): after back()
 *   drawChar(off.admin({ ...extra }));  // the Administrator seated: A9.melon, noLegs, the bottom of his body resting on his chair (extra is merged: expr, look, arms, hold, grip ...)
 *   off.desk();                         // the executive desk with its props and the pizza tower: drawn in FRONT of him and behind anybody standing or sitting on the visitor side
 *   off.visitor('back'); drawChar(off.guest(A7.straw, { ...extra })); off.visitor('front');   // the low guest chair around a sitter (off.visitor() with no argument draws it whole)
 *   off.over();                         // dust drifting in the sun's beams: after the cast (day)
 *
 * OPTIONS  night | t (seconds, drives stars, clouds, dust) | blinds (0 slats open .. 1 shut; day .45, night .5) | blindsUp (0..1 stack raised; night .78) | sun (0..1 strength of the stripes) | dust (0..1)
 *   door (0..1: the pocket door slides into the wall, hall light floods in) | paintingOpen (0..1: the portrait swings out on its LEFT hinge, past .8 you see its back)
 *   vaultOpen (0..1: the round door swings open on its left hinge) | vaultBolts (1 locked, 0 retracted) | wheelRot (radians, the spoked wheel) | vaultDraw(c) paints the vault's INSIDE (c = {x, y, r, k, open} in screen
 *   coordinates, clipped to the round opening: gold goes here; without it you get a dark steel chamber) | chartPulse (0..1: the pizza on the FY BUDGET chart swells) | tower [{ y: lift, sq: squash, a: alpha }, ...] pizza
 *   boxes stacked on the desk (bottom first; y > 0 means still falling) | steamK (0..1 steam off the tower) | penGlint (0..1 the pen in the pen cup gleams) | lampOn (0..1 the banker's lamp and the night pool, for flickers) | lampGlow (0..1, default 1: the soft screen-blend glow over the desk; lower it in a close-up of the Administrator)
 *   chairShift (world X, rolls the Administrator's chair aside) | visitorX, visitorZ (move the guest chair) | coatLate (back() leaves the coat stand out; draw it yourself with off.coat() after a character
 *   who passes it from behind, e.g. someone coming through the door) | pens (0 or 1: pens in the pen cup, default 1)
 *
 * LAYOUT  off.layout = { zb, hw, ch, door, win, portrait, recess {x, y, r, w, h, z}, chart, desk {x0, x1, z0, z1, top}, admin {x, z, seat}, visitor, credenza, bin }, all in world units.
 *   off.at.<name>() gives the point on the screen (scene coordinates, current camera) of: chart, portrait, recess, door, pen, penTop, towerTop(n), lamp, nameplate, desk, deskFront, bin.
 *   off.deskPt(X, Z) is the point on the desk top. S10.stand(X, Y, Z, fn, s) runs fn in a billboard frame standing on a world point (origin at its base, 1 unit = 1 world unit, up is -y).
 *
 * FOR THE VAULT SCENE: the recess is the square steel frame behind the portrait, at world X about -355, Y about 450, radius 104, on the back wall (Z = zb). The portrait hinges on its left edge and swings toward the
 *   camera, the door swings the same way, so a character who opens them stands to the RIGHT of the portrait (the Administrator's chair is at X about 330: a walk of about 600 units along the back of the desk).
 *   Strawberry's usual spot is X about -300, Z about 1040; the low guest chair is at X -60. The night lamp is at the right end of the desk. Everything here is drawn per frame from options: nothing keeps state. */
(() => {
const { p2, poly, quad3, grad, radial, rgba, mix } = V2;
const S6 = window.S6, A7 = window.A7, A9 = window.A9;
const { box3, shell, onZ, kz, ceilingLamp, lit } = S6;
const ink = 'rgba(25,16,30,.62)';
const mixc = (a, b, t) => rgba(mix(a, b, t), 1);

// ------------------------------------------------------------------ layout: every number is a world coordinate (X right, Y up, Z forward), shared with the scenes through office.layout
const LAY = {
  zb: 1750, hw: 900, ch: 940,                                   // back wall depth, half width, ceiling height
  rail: 170,                                                    // top of the wainscot
  door: { x0: -770, x1: -510, y1: 470 },                        // the pocket door in the back wall, far left
  win: { y0: 690, y1: 870, panes: [[-660, -270], [-220, 170], [220, 610]] },   // a ribbon of three panes high on the wall: above every head, so faces never sit against the glare
  portrait: { x0: -490, y0: 252, w: 270, h: 370 },              // the framed portrait (hinged on its left edge); the vault recess sits behind it
  chart: { x0: -205, y1: 648, w: 340, h: 310 },                 // the FY BUDGET board: in the gap between the two of them, so it is behind both of them in every two-shot
  poster: { x0: 660, y1: 620, w: 130, h: 190 },
  dips: { x0: 515, y1: 640 },                                   // three diplomas stacked at the right
  desk: { x0: -40, x1: 580, z0: 1200, z1: 1460, top: 232 },     // the executive desk: its front face toward the visitor
  admin: { x: 330, z: 1560, seat: 255 },                        // where the Administrator sits (his body bottom rests at y = seat)
  visitor: { x: -60, z: 1020, seat: 58 },                       // the low guest chair
  credenza: { x0: 440, x1: 700, z0: 1650, z1: 1735, top: 150 }, // the pizza stash
  bin: { x: -150, z: 1300, top: 86 },                           // the wire wastebasket at the desk's left end
};
LAY.recess = { x: LAY.portrait.x0 + LAY.portrait.w / 2, y: LAY.portrait.y0 + LAY.portrait.h / 2 + 12, w: 230, h: 230, r: 104, z: LAY.zb };

// ------------------------------------------------------------------ palettes: day (2:58 PM) and night (10:30 PM, 10:55 PM)
const PAL = {
  day: { wall: '#a9b8a4', wain: '#6b4630', floorA: '#2f4260', floorB: '#1f2b45', ceil: '#efe9db', fog: '#b9c4b4', frame: '#f0ead8', slat: ['#f6f1e2', '#cfc6ae'], wood: '#5a3a28', woodHi: '#7a5238', beam: '#6a4630', rug: ['#1d4a50', '#12353a'], leather: '#7a2a30', desk: '#4e3022' },
  night: { wall: '#3d4a6a', wain: '#2e211f', floorA: '#1b2340', floorB: '#10162c', ceil: '#2c3452', fog: '#141a34', frame: '#b8b4aa', slat: ['#8c92ac', '#5a6080'], wood: '#3a2519', woodHi: '#4e3322', beam: '#241a16', rug: ['#0f2c32', '#0a1e24'], leather: '#5a2028', desk: '#3a2418' },
};

// ------------------------------------------------------------------ art that never changes is painted once into a small canvas (the world is redrawn every frame, and a frame must stay cheap)
const CACHE = {};
function art(key, w, h, sc, draw) {
  let c = CACHE[key];
  if (!c) {
    c = V2.mk(Math.ceil(w * sc), Math.ceil(h * sc));
    const g = c.getContext('2d'), prev = ctx;
    ctx = g; g.save(); g.scale(sc, sc); REG.suppress++;
    try { draw(w, h); } finally { REG.suppress--; ctx = prev; g.restore(); }
    CACHE[key] = c;
  }
  return c;
}
// lay a cached picture on a frontal plane at depth z: (x0, y1) is its top left corner in world units, w and h its size; sx scales it about its centre
function onWall(c, x0, y1, w, h, z, sx = 1) {
  const a = p2(x0, y1, z), b = p2(x0 + w, y1 - h, z), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.translate(cx, cy); ctx.scale(sx, sx); ctx.drawImage(c, -(b[0] - a[0]) / 2, -(b[1] - a[1]) / 2, b[0] - a[0], b[1] - a[1]); ctx.restore();
}
// a billboard standing on the world point (X, Y, Z): its origin is its base centre, 1 unit is 1 world unit, up is -y
const stand = (X, Y, Z, fn, s = 1) => { const [x, y] = p2(X, Y, Z), k = kz(Z) * s; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); fn(); ctx.restore(); };
const goldEdge = (x, y, w, h, r, lw = 5) => { ctx.strokeStyle = V2.grad(x, y, x + w, y + h, [[0, '#fff0a8'], [.35, '#c99a2e'], [.7, '#8a6414'], [1, '#e8c458']]); ctx.lineWidth = lw; rr(x, y, w, h, r); ctx.stroke(); };
const softShadow = (x, y, rx, ry, a = .3) => { ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.fillStyle = V2.radial(0, 0, 0, rx, [[0, `rgba(8,4,12,${a})`], [.7, `rgba(8,4,12,${a * .5})`], [1, 'rgba(8,4,12,0)']]); ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); };

// ------------------------------------------------------------------ the art on the walls (units are world units, drawn at 2 px per unit)
// the portrait of the Administrator: a gilded frame, drapery, the sitter, a slice raised like a scepter
function drawPortrait(w, h) {
  const fg = V2.grad(0, 0, w, h, [[0, '#f4d878'], [.3, '#c2922c'], [.62, '#8c6216'], [1, '#e2b84a']]);
  ctx.fillStyle = fg; rr(0, 0, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(40,24,6,.8)'; ctx.lineWidth = 3; rr(1.5, 1.5, w - 3, h - 3, 9); ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,170,.5)'; for (let i = 0; i < 18; i++) { ell(10 + i * (w - 20) / 17, 9, 3.2, 3.2); ctx.fill(); ell(10 + i * (w - 20) / 17, h - 9, 3.2, 3.2); ctx.fill(); }
  ctx.fillStyle = 'rgba(70,40,6,.5)'; rr(18, 18, w - 36, h - 36 - 38, 4); ctx.fill();
  const cx0 = 24, cy0 = 24, cw = w - 48, ch = h - 48 - 38;
  ctx.save(); rr(cx0, cy0, cw, ch, 3); ctx.clip();
  ctx.fillStyle = V2.grad(0, cy0, 0, cy0 + ch, [[0, '#183a2c'], [1, '#0d2219']]); ctx.fillRect(cx0, cy0, cw, ch);
  ctx.fillStyle = V2.grad(cx0 + cw * .6, cy0, cx0 + cw, cy0, [[0, 'rgba(255,200,120,0)'], [1, 'rgba(255,200,120,.45)']]); ctx.fillRect(cx0, cy0, cw, ch);
  ctx.strokeStyle = 'rgba(10,30,22,.7)'; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx0 + i * cw / 5, cy0); ctx.quadraticCurveTo(cx0 + i * cw / 5 + 10, cy0 + ch * .5, cx0 + i * cw / 5 - 6, cy0 + ch); ctx.stroke(); }
  const mx = cx0 + cw / 2, my = cy0 + ch * .46, s = cw / 190;
  ctx.save(); ctx.translate(mx, my); ctx.scale(s, s); ctx.translate(-mx, -my);
  ctx.fillStyle = V2.grad(0, my + 30, 0, my + 160, [[0, '#24407a'], [1, '#14264c']]); ctx.beginPath(); ctx.moveTo(mx - 112, my + 164); ctx.quadraticCurveTo(mx - 100, my + 52, mx - 40, my + 46); ctx.lineTo(mx + 40, my + 46); ctx.quadraticCurveTo(mx + 100, my + 52, mx + 112, my + 164); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.moveTo(mx - 20, my + 46); ctx.lineTo(mx + 20, my + 46); ctx.lineTo(mx, my + 100); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c4202c'; ctx.beginPath(); ctx.moveTo(mx - 6, my + 52); ctx.lineTo(mx + 6, my + 52); ctx.lineTo(mx + 10, my + 100); ctx.lineTo(mx, my + 110); ctx.lineTo(mx - 10, my + 100); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8c458'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx - 52, my + 44); ctx.quadraticCurveTo(mx, my + 120, mx + 52, my + 44); ctx.stroke();
  ctx.fillStyle = '#e8c458'; ell(mx, my + 104, 9, 9); ctx.fill();
  ctx.fillStyle = V2.radial(mx - 14, my - 18, 4, 56, [[0, '#fff0c8'], [.6, '#e2b878'], [1, '#a8742e']]); ell(mx, my, 50, 54); ctx.fill();
  ctx.strokeStyle = 'rgba(250,236,200,.55)'; ctx.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(mx + i * 14 - 8, my - 50); ctx.quadraticCurveTo(mx + i * 17, my, mx + i * 14 + 8, my + 50); ctx.stroke(); }
  ctx.fillStyle = '#4a3010'; ell(mx - 17, my - 6, 4.6, 6); ctx.fill(); ell(mx + 17, my - 6, 4.6, 6); ctx.fill();
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx - 25, my - 19); ctx.lineTo(mx - 10, my - 17); ctx.moveTo(mx + 25, my - 19); ctx.lineTo(mx + 10, my - 17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx - 15, my + 20); ctx.quadraticCurveTo(mx, my + 30, mx + 15, my + 19); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,120,.25)'; ell(mx - 30, my + 12, 9, 6); ctx.fill(); ell(mx + 30, my + 12, 9, 6); ctx.fill();
  ctx.save(); ctx.translate(mx + 70, my + 92); ctx.rotate(-.2);   // the slice, held up like a scepter
  ctx.fillStyle = '#c28a3e'; ctx.beginPath(); ctx.moveTo(-18, -80); ctx.quadraticCurveTo(0, -92, 18, -80); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2c440'; ctx.beginPath(); ctx.moveTo(-14, -74); ctx.quadraticCurveTo(0, -84, 14, -74); ctx.lineTo(0, -8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b3261e'; for (const [dx, dy] of [[-5, -62], [6, -48], [-2, -32]]) { ell(dx, dy, 5.4, 5.4); ctx.fill(); }
  ctx.restore(); ctx.restore();
  ctx.strokeStyle = 'rgba(255,240,200,.1)'; ctx.lineWidth = 1; for (let i = 0; i < 22; i++) { const x = cx0 + hash(i + 3) * cw, y = cy0 + hash(i + 40) * ch; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (hash(i) - .5) * 40, y + (hash(i + 8) - .5) * 40); ctx.lineTo(x + (hash(i + 2) - .5) * 60, y + (hash(i + 9) - .5) * 40); ctx.stroke(); }
  ctx.fillStyle = V2.grad(cx0, cy0, cx0 + cw, cy0 + ch, [[0, 'rgba(255,255,255,.2)'], [.35, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(cx0, cy0, cw, ch);
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,18,4,.85)'; ctx.lineWidth = 3; rr(cx0, cy0, cw, ch, 3); ctx.stroke();
  const py = h - 56;
  ctx.fillStyle = V2.grad(0, py, 0, py + 32, [[0, '#f2d67a'], [1, '#b88a22']]); rr(w / 2 - 88, py, 176, 32, 4); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,6,.8)'; ctx.lineWidth = 2; ctx.stroke();
  text('THE ADMINISTRATOR', w / 2, py + 12, { size: 14, fill: '#3a2606', weight: 900, spacing: 1.2 });
  text('(in his own opinion)', w / 2, py + 25, { size: 10, fill: '#5a3e0a', weight: 800, italic: true });
}
// the FY BUDGET board: a real pie, 97 percent pizza, with STAFF, SUPPLIES and DIGNITY pulled out as slivers
const PIE = { cx: 118, cy: 198, R: 92, slivers: [['STAFF', 1.8, '#2f6fd8'], ['SUPPLIES', .9, '#27a064'], ['DIGNITY', .3, '#a24bd6']] };
function drawPizza(R, a0, a1) {   // a pizza painted into the wedge from angle a0 to a1 (clockwise from 3 o'clock), centred on the origin
  ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath(); ctx.clip();
  ctx.fillStyle = V2.radial(-R * .2, -R * .25, R * .1, R * 1.1, [[0, '#f0bc6c'], [.7, '#d8964a'], [1, '#a8662a']]); ell(0, 0, R, R); ctx.fill();
  ctx.fillStyle = 'rgba(255,236,170,.45)'; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + .1, r = R - 8 + (i % 3) * 1.5; ell(Math.cos(a) * r, Math.sin(a) * r, 5.5, 3.2, a + PI / 2); ctx.fill(); }
  ctx.fillStyle = '#c4301c'; ell(0, 0, R - 17, R - 17); ctx.fill();
  ctx.fillStyle = V2.radial(-R * .2, -R * .2, 2, R, [[0, '#ffe27a'], [1, '#f0b43c']]); ell(0, 0, R - 21, R - 21); ctx.fill();
  ctx.fillStyle = 'rgba(255,248,200,.55)'; for (let i = 0; i < 22; i++) { ell((hash(i + 3) - .5) * R * 1.5, (hash(i + 30) - .5) * R * 1.5, 6 + hash(i + 7) * 8, 4 + hash(i + 11) * 5, hash(i) * 3); ctx.fill(); }
  ctx.fillStyle = 'rgba(190,110,30,.4)'; for (let i = 0; i < 16; i++) { ell((hash(i + 60) - .5) * R * 1.5, (hash(i + 90) - .5) * R * 1.5, 3 + hash(i + 5) * 4, 2.5 + hash(i + 9) * 3, hash(i + 2) * 3); ctx.fill(); }
  const pep = [[-.52, -.4], [.12, -.62], [.58, -.28], [-.2, -.04], [.36, .14], [-.62, .22], [.08, .46], [.62, .5], [-.36, .62], [.78, -.02], [-.84, -.1], [-.02, -.3]];
  for (const [px, py] of pep) {
    const x = px * (R - 24), y = py * (R - 24);
    ctx.fillStyle = '#9c1c16'; ell(x, y + 1.6, 13.5, 13); ctx.fill(); ctx.fillStyle = V2.radial(x - 3, y - 4, 1, 14, [[0, '#e0503c'], [1, '#b02a1c']]); ell(x, y, 13, 12.6); ctx.fill();
    ctx.fillStyle = 'rgba(120,20,10,.55)'; for (let q = 0; q < 4; q++) { ell(x + Math.cos(q * 1.7 + px) * 6, y + Math.sin(q * 1.7 + px) * 6, 1.8, 1.8); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(x - 4, y - 5, 4, 2.2, -.5); ctx.fill();
  }
  ctx.fillStyle = '#3f9a3a'; for (const [lx, ly, ra] of [[-.3, .32, .5], [.42, -.46, -.8], [.5, .66, 2.2]]) { ctx.save(); ctx.translate(lx * R, ly * R); ctx.rotate(ra); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(7, -9, 0, -17); ctx.quadraticCurveTo(-7, -9, 0, 0); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(80,44,14,.9)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath(); ctx.stroke();
}
function drawChart(w, h) {
  ctx.fillStyle = '#23262f'; rr(0, 0, w, h, 16); ctx.fill();
  ctx.fillStyle = V2.grad(0, 0, 0, h, [[0, '#ffffff'], [1, '#ebe8dd']]); rr(9, 9, w - 18, h - 18, 9); ctx.fill();
  text('FY BUDGET', w / 2, 44, { size: 50, font: 'Bangers', weight: 400, fill: '#1c3566', spacing: 3 });
  text('ALL DEPARTMENTS, ALL YEAR', w / 2, 76, { size: 14, fill: '#8a90a4', spacing: 2.2 });
  ctx.strokeStyle = '#1c3566'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, 92); ctx.lineTo(w - 30, 92); ctx.stroke();
  const { cx, cy, R, slivers } = PIE, tot = slivers.reduce((s, q) => s + q[1], 0), gap = tot / 100 * TAU;
  let a = -gap / 2;   // the slivers sit around 3 o'clock
  ctx.save(); ctx.translate(cx, cy);
  const spots = [];
  for (const [name, pct, col] of slivers) {
    const da = pct / 100 * TAU, bis = a + da / 2, ox = Math.cos(bis) * 9, oy = Math.sin(bis) * 9;
    ctx.fillStyle = col; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, R + 2, a, a + da); ctx.closePath(); ctx.fill(); ctx.stroke();
    spots.push([name, pct, col, Math.cos(bis) * (R + 13) + ox, Math.sin(bis) * (R + 13) + oy]);
    a += da;
  }
  drawPizza(R, a, -gap / 2 + TAU);
  ctx.restore();
  const lx = 240;
  spots.forEach(([name, pct, col, x, y], i) => {
    const ly = cy - 46 + i * 46;
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx + x, cy + y); ctx.lineTo(cx + x + 8, cy + y); ctx.lineTo(lx - 14, ly); ctx.lineTo(lx - 4, ly); ctx.stroke();
    ctx.fillStyle = col; rr(lx, ly - 17, 9, 34, 3); ctx.fill();
    text(name, lx + 16, ly - 7, { size: 13.5, fill: '#2a2f45', weight: 900, align: 'left', spacing: .3 });
    text(pct.toFixed(1) + '%', lx + 16, ly + 10, { size: 13.5, fill: col, weight: 900, align: 'left' });
  });
  ctx.save(); ctx.translate(cx - 30, cy + 18); ctx.rotate(-.06);
  ctx.fillStyle = '#fff8e6'; ctx.strokeStyle = '#7a1c14'; ctx.lineWidth = 3.4; rr(-50, -25, 100, 50, 13); ctx.fill(); ctx.stroke();
  text('PIZZA', 0, -8, { size: 25, font: 'Bangers', weight: 400, fill: '#b3261e', spacing: 2 });
  text('97%', 0, 14, { size: 22, font: 'Bangers', weight: 400, fill: '#b3261e', spacing: 2 });
  ctx.restore();
  text('SOURCE: THE ADMINISTRATOR', w / 2, h - 22, { size: 11, fill: '#9aa0b2', weight: 800, spacing: 1.6 });
}
function drawPoster(w, h) {
  ctx.fillStyle = '#1b1b24'; rr(0, 0, w, h, 5); ctx.fill();
  ctx.fillStyle = '#f6f2e8'; rr(6, 6, w - 12, h - 12, 3); ctx.fill();
  const px = 14, py = 14, pw = w - 28, ph = h * .55;
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
  ctx.fillStyle = V2.grad(0, py, 0, py + ph, [[0, '#4a3a8a'], [.45, '#e8707a'], [.75, '#ffc07a'], [1, '#ffe8b0']]); ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = '#fff6c8'; ell(px + pw * .62, py + ph * .62, pw * .14, pw * .14); ctx.fill();
  ctx.fillStyle = V2.grad(0, py + ph * .66, 0, py + ph, [[0, '#2a3a6a'], [1, '#101a3a']]); ctx.fillRect(px, py + ph * .66, pw, ph * .34);
  ctx.fillStyle = 'rgba(255,230,160,.4)'; for (let i = 0; i < 5; i++) ctx.fillRect(px + pw * (.42 + i * .03), py + ph * (.7 + i * .055), pw * (.2 - i * .02), 2);
  ctx.fillStyle = '#0c1226'; ctx.beginPath(); ctx.moveTo(px + pw * .08, py + ph * .76); ctx.lineTo(px + pw * .92, py + ph * .74); ctx.lineTo(px + pw * .86, py + ph * .79); ctx.lineTo(px + pw * .14, py + ph * .8); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 4; i++) { const x = px + pw * (.24 + i * .17); ctx.beginPath(); ctx.arc(x, py + ph * .7, pw * .05, 0, TAU); ctx.fill(); ctx.fillRect(x - pw * .035, py + ph * .72, pw * .07, ph * .06); ctx.strokeStyle = '#0c1226'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, py + ph * .75); ctx.lineTo(x - pw * .12, py + ph * .86); ctx.stroke(); }
  ctx.restore();
  text('SYNERGY', w / 2, py + ph + 22, { size: 24, fill: '#1b1b24', weight: 900, spacing: 3, maxW: w - 24 });
  text('TOGETHER, EVERYONE', w / 2, py + ph + 40, { size: 9.4, fill: '#3a3a4a', weight: 900, spacing: 1.1, maxW: w - 20 });
  text('ACHIEVES MONEY*', w / 2, py + ph + 52, { size: 9.4, fill: '#3a3a4a', weight: 900, spacing: 1.1, maxW: w - 20 });
  text('*some of everyone', w / 2, h - 13, { size: 6.4, fill: '#8a8a9a', weight: 800, italic: true });
}
const DIP = [
  { top: 'CERTIFICATE OF EXCELLENCE', big: ['CERTIFIED IN', 'SAYING NO'], sub: 'with distinction (always)', w: 150, h: 112 },
  { top: 'MASTER OF BUSINESS', big: ['M.B.A.', 'BUDGET AVOIDANCE'], sub: 'summa cum laude', w: 126, h: 94 },
  { top: 'PIZZA PARTY PLANNING', big: ['HONORS', 'GRADUATE'], sub: 'class of last friday', w: 126, h: 94 },
];
function drawDiploma(w, h, i) {
  const d = DIP[i];
  ctx.fillStyle = '#2a2018'; rr(0, 0, w, h, 4); ctx.fill();
  ctx.fillStyle = V2.grad(0, 0, w, h, [[0, '#fffaec'], [1, '#efe4c8']]); rr(5, 5, w - 10, h - 10, 2); ctx.fill();
  goldEdge(9, 9, w - 18, h - 18, 2, 2.4); goldEdge(13, 13, w - 26, h - 26, 2, 1);
  text(d.top, w / 2, 24, { size: i === 0 ? 8.4 : 7.2, fill: '#6a5a3a', weight: 900, spacing: .9, maxW: w - 30 });
  text(d.big[0], w / 2, h * .43, { size: i === 0 ? 18 : 14, font: 'Bangers', weight: 400, fill: '#7a1c1c', spacing: 1.2, maxW: w - 30 });
  text(d.big[1], w / 2, h * .43 + (i === 0 ? 22 : 17), { size: i === 0 ? 24 : 14, font: 'Bangers', weight: 400, fill: i === 0 ? '#b3261e' : '#1c3566', spacing: 1.2, maxW: w - 30 });
  text(d.sub, w / 2, h * .76, { size: 7.2, fill: '#7a6a4a', weight: 800, italic: true, maxW: w - 30 });
  ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(w * .2, h - 22); ctx.bezierCurveTo(w * .3, h - 34, w * .36, h - 12, w * .46, h - 24); ctx.stroke();
  const sx = w * .76, sy = h - 26;
  ctx.fillStyle = '#c4202c'; ctx.beginPath(); ctx.moveTo(sx - 4, sy + 6); ctx.lineTo(sx - 7, sy + 17); ctx.lineTo(sx - 2, sy + 13); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx + 4, sy + 6); ctx.lineTo(sx + 7, sy + 17); ctx.lineTo(sx + 2, sy + 13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c4202c'; ell(sx, sy, 9, 9); ctx.fill(); ctx.strokeStyle = '#8a1018'; ctx.lineWidth = 1.4; ctx.stroke();
}
// the desk's front: three sections, raised panels, brass pulls, and a crest with a motto
function drawDeskFront(w, h, night) {
  const wood = night ? '#3a2418' : '#4e3022', hi = night ? '#4e3322' : '#6a4630';
  ctx.fillStyle = V2.grad(0, 0, 0, h, [[0, hi], [.5, wood], [1, mixc(wood, '#000000', .35)]]); ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(20,10,6,.22)'; ctx.lineWidth = 1.4; for (let i = 0; i < 26; i++) { const y = hash(i + 3) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * .3, y + (hash(i) - .5) * 12, w * .6, y + (hash(i + 7) - .5) * 12, w, y + (hash(i + 9) - .5) * 8); ctx.stroke(); }
  const cuts = [170, 450];
  ctx.fillStyle = 'rgba(8,4,2,.5)'; for (const x of cuts) { ctx.fillRect(x - 6, 0, 12, h); ctx.fillStyle = 'rgba(255,220,170,.12)'; ctx.fillRect(x + 6, 0, 2, h); ctx.fillStyle = 'rgba(8,4,2,.5)'; }
  const drawer = (x, y, dw, dh) => {
    ctx.fillStyle = V2.grad(0, y, 0, y + dh, [[0, hi], [1, wood]]); rr(x, y, dw, dh, 5); ctx.fill(); ctx.strokeStyle = 'rgba(10,5,3,.8)'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,170,.22)'; ctx.lineWidth = 1.6; rr(x + 6, y + 6, dw - 12, dh - 12, 3); ctx.stroke();
    const px = x + dw / 2; ctx.fillStyle = V2.grad(0, y + dh / 2 - 6, 0, y + dh / 2 + 6, [[0, '#f4d878'], [1, '#a8781e']]); rr(px - 24, y + dh / 2 - 5, 48, 10, 5); ctx.fill(); ctx.strokeStyle = 'rgba(50,30,6,.8)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#6a4a12'; ell(px - 24, y + dh / 2, 4, 4); ctx.fill(); ell(px + 24, y + dh / 2, 4, 4); ctx.fill();
  };
  for (const x0 of [8, 462]) for (let i = 0; i < 3; i++) drawer(x0, 10 + i * 61, 150, 55);
  // the middle: a raised panel with a gilded edge and the crest
  ctx.fillStyle = V2.grad(0, 12, 0, h - 12, [[0, mixc(wood, '#000000', .15)], [1, mixc(wood, '#000000', .3)]]); rr(184, 12, 252, h - 24 - 10, 8); ctx.fill();
  goldEdge(188, 16, 244, h - 32 - 10, 6, 3.6);
  const cx = 310, cy = 100;
  ctx.fillStyle = V2.radial(cx - 14, cy - 18, 4, 62, [[0, '#fff0a8'], [.55, '#d4a834'], [1, '#8a6414']]); ell(cx, cy, 58, 58); ctx.fill(); ctx.strokeStyle = 'rgba(50,30,6,.85)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,170,.6)'; ctx.lineWidth = 1.6; ell(cx, cy, 50, 50); ctx.stroke();
  ctx.fillStyle = '#7a5410'; ctx.beginPath(); ctx.moveTo(cx - 20, cy - 20); ctx.quadraticCurveTo(cx, cy - 30, cx + 20, cy - 20); ctx.lineTo(cx, cy + 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8c458'; ctx.beginPath(); ctx.moveTo(cx - 15, cy - 17); ctx.quadraticCurveTo(cx, cy - 25, cx + 15, cy - 17); ctx.lineTo(cx, cy + 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7a5410'; for (const [dx, dy] of [[-5, -10], [5, -4], [-1, 3]]) { ell(cx + dx, cy + dy, 3.4, 3.4); ctx.fill(); }
  { const motto = 'IN PIZZA WE TRUST', n = motto.length;
    for (let i = 0; i < n; i++) { const phi = (i - (n - 1) / 2) * .118; ctx.save(); ctx.translate(cx + Math.sin(phi) * 41, cy + Math.cos(phi) * 41); ctx.rotate(-phi); if (motto[i] !== ' ') text(motto[i], 0, 0, { size: 9.6, fill: '#3a2606', weight: 900 }); ctx.restore(); } }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, h - 12, w, 12);
}

// ------------------------------------------------------------------ small things that stand on the desk (billboards: base centre at the origin, up is -y)
function penCup(o) {
  const w = 54, h = 64;
  softShadow(4, 2, 40, 9, .35);
  ctx.fillStyle = V2.grad(-w / 2, 0, w / 2, 0, [[0, '#171320'], [.35, '#3a3446'], [1, '#12101a']]); ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-w / 2, -h); ctx.lineTo(w / 2, -h); ctx.lineTo(w / 2 - 4, -2); ctx.quadraticCurveTo(0, 6, -w / 2 + 4, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.16)'; rr(-w / 2 + 7, -h + 8, 7, h - 20, 3); ctx.fill();
  ctx.fillStyle = V2.grad(0, -h * .62, 0, -h * .5, [[0, '#f4d878'], [1, '#a8781e']]); ctx.fillRect(-w / 2 + 1, -h * .6, w - 2, 7);
  ctx.fillStyle = V2.grad(0, -h * .1 - 6, 0, -h * .1 + 2, [[0, '#f4d878'], [1, '#a8781e']]); ctx.fillRect(-w / 2 + 4, -h * .12, w - 8, 6);
  // exactly one pen
  ctx.save(); ctx.translate(2, -h + 4); ctx.rotate(.14);
  ctx.fillStyle = '#12101a'; ell(0, 2, w / 2 - 3, 7); ctx.fill();
  if ((o.pens ?? 1) > 0) {
    ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-5.5, -78, 11, 80, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eef1f7'; rr(-5.5, -78, 11, 20, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9ab4f0'; ctx.fillRect(-3, -54, 2.6, 52);
    ctx.fillStyle = '#c8ced8'; rr(3.4, -74, 3.6, 34, 1.6); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#0e0c14'; ell(0, 3, w / 2 - 5, 5.4); ctx.fill();
  ctx.restore();
  const g = (o.pens ?? 1) > 0 ? (o.penGlint ?? 0) : 0;
  if (g > 0) {   // the gleam: a cross flare on the clip and a soft glow
    ctx.save(); ctx.translate(8, -h - 58); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = V2.radial(0, 0, 0, 34 * (.6 + .4 * g), [[0, `rgba(255,252,220,${.85 * g})`], [1, 'rgba(255,252,220,0)']]); ctx.fillRect(-40, -40, 80, 80);
    const L = 26 * g; ctx.fillStyle = `rgba(255,255,255,${.95 * g})`; ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(3, -3); ctx.lineTo(L, 0); ctx.lineTo(3, 3); ctx.lineTo(0, L); ctx.lineTo(-3, 3); ctx.lineTo(-L, 0); ctx.lineTo(-3, -3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
function nameplate() {
  const w = 176, h = 44;
  softShadow(0, 3, 100, 9, .35);
  ctx.fillStyle = '#2a1a12'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2 - 10, 0); ctx.lineTo(w / 2 + 10, 0); ctx.lineTo(w / 2 + 4, -10); ctx.lineTo(-w / 2 - 4, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -h - 8, 0, -8, [[0, '#f6dc82'], [.5, '#d4a834'], [1, '#a8781e']]); ctx.beginPath(); ctx.moveTo(-w / 2, -8); ctx.lineTo(w / 2, -8); ctx.lineTo(w / 2 - 6, -h - 8); ctx.lineTo(-w / 2 + 6, -h - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,248,200,.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-w / 2 + 12, -h - 2); ctx.lineTo(w / 2 - 12, -h - 2); ctx.stroke();
  text('DIRECTOR OF NO', 0, -h / 2 - 2, { size: 15, fill: '#2a1c06', weight: 900, spacing: 1.2, maxW: w - 20 });   /* not his title: that is on his own tag, and one ADMINISTRATOR per shot is enough */
  text('the buck stops elsewhere', 0, -h / 2 - 20, { size: 8.4, fill: '#4a340a', weight: 800, italic: true, maxW: w - 40 });
}
function phone() {
  softShadow(0, 3, 70, 9, .3);
  ctx.fillStyle = '#e8dcc0'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-54, 0); ctx.lineTo(54, 0); ctx.lineTo(44, -24); ctx.lineTo(-44, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d4c6a4'; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { ell(-24 + c * 16, -9 - r * 8, 4, 3); ctx.fill(); }
  ctx.fillStyle = '#e8dcc0'; rr(-52, -44, 104, 20, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d4c6a4'; rr(-50, -44, 22, 20, 8); ctx.fill(); ctx.stroke(); rr(28, -44, 22, 20, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(-24, -40, 46, 4, 2); ctx.fill();
  ctx.fillStyle = '#c4202c'; ell(40, -12, 3.2, 3.2); ctx.fill();
}
function trays(night) {
  const w = 124;
  softShadow(0, 3, 84, 10, .32);
  for (let L = 0; L < 2; L++) {
    const y = -L * 46;
    ctx.fillStyle = '#20222c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); ctx.lineTo(w / 2 - 6, y - 36); ctx.lineTo(-w / 2 + 6, y - 36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,196,214,.55)'; ctx.lineWidth = 1.4; for (let i = 1; i < 14; i++) { const x = -w / 2 + i * w / 14; ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x * .95, y - 34); ctx.stroke(); } for (const yy of [-12, -24]) { ctx.beginPath(); ctx.moveTo(-w / 2 + 2, y + yy); ctx.lineTo(w / 2 - 2, y + yy); ctx.stroke(); }
  }
  // IN: a tall, leaning stack of forms with a sticky note; OUT: empty, with a cobweb
  for (let i = 0; i < 6; i++) { const lean = Math.sin(i * 1.3) * 4 + i * .8, py = -46 - 4 - i * 6.2; ctx.fillStyle = ['#fffdf5', '#ffe9a8', '#dff0ff', '#ffd9e4'][i % 4]; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.save(); ctx.translate(lean, py); ctx.rotate((hash(i + 5) - .5) * .06); rr(-48, -7, 96, 8, 1.4); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#fff176'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2; ctx.save(); ctx.translate(30, -86); ctx.rotate(.14); rr(-12, -12, 24, 22, 1.5); ctx.fill(); ctx.stroke(); ctx.restore();
  text('IN', -40, -56 - 14, { size: 12, fill: '#f4d878', weight: 900, spacing: 1 });
  ctx.strokeStyle = 'rgba(230,236,250,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w / 2 - 6, -2); ctx.lineTo(w / 2 - 22, -28); ctx.moveTo(w / 2 - 6, -2); ctx.lineTo(w / 2 - 34, -14); ctx.moveTo(w / 2 - 6, -2); ctx.lineTo(w / 2 - 10, -30); for (let i = 1; i < 4; i++) { ctx.moveTo(w / 2 - 6 - i * 6, -2 - i * 6); ctx.quadraticCurveTo(w / 2 - 12 - i * 7, -2 - i * 3, w / 2 - 6 - i * 10, -2 - i * 3); } ctx.stroke();
  ctx.fillStyle = '#f4d878'; rr(-w / 2 + 6, -34, 26, 12, 2); ctx.fill(); text('OUT', -w / 2 + 19, -28, { size: 9, fill: '#3a2606', weight: 900 });
}
function mug() {
  softShadow(2, 2, 36, 7, .3);
  ctx.fillStyle = V2.grad(-24, 0, 24, 0, [[0, '#d8dae6'], [.3, '#ffffff'], [1, '#c8cadc']]); ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-24, -56, 48, 56, 7); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = '#d8dae6'; ctx.beginPath(); ctx.arc(26, -30, 13, -PI / 2, PI / 2); ctx.stroke(); ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(26, -30, 16, -PI / 2, PI / 2); ctx.stroke(); ctx.beginPath(); ctx.arc(26, -30, 10, -PI / 2, PI / 2); ctx.stroke();
  ctx.fillStyle = '#4a2c14'; ell(0, -54, 22, 5.6); ctx.fill(); ctx.fillStyle = 'rgba(200,170,130,.5)'; ell(-3, -54.5, 14, 3); ctx.fill();   // cold: a skin on the coffee, no steam
  text("WORLD'S", 0, -40, { size: 7.5, fill: '#c4202c', weight: 900 }); text('BEST BOSS', 0, -30, { size: 8.2, fill: '#c4202c', weight: 900, maxW: 42 });
  ctx.strokeStyle = 'rgba(120,80,40,.4)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-1, -6, 22, .3, .9 * PI); ctx.stroke();
}
function bankerLamp(night, on) {
  softShadow(0, 3, 60, 9, .35);
  ctx.fillStyle = V2.grad(-26, 0, 26, 0, [[0, '#8a6414'], [.4, '#f4d878'], [1, '#7a5410']]); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -6, 30, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  rr(-6, -86, 12, 82, 4); ctx.fill(); ctx.stroke(); ell(0, -88, 11, 11); ctx.fill(); ctx.stroke();
  const sh = V2.grad(0, -150, 0, -92, [[0, '#2f8a62'], [1, '#14543a']]);
  ctx.fillStyle = sh; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-64, -96); ctx.quadraticCurveTo(-60, -150, 0, -152); ctx.quadraticCurveTo(60, -150, 64, -96); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(-50, -102); ctx.quadraticCurveTo(-48, -136, -14, -144); ctx.lineTo(-24, -138); ctx.quadraticCurveTo(-40, -126, -40, -102); ctx.closePath(); ctx.fill();
  ctx.fillStyle = V2.grad(0, -98, 0, -92, [[0, '#f4d878'], [1, '#a8781e']]); rr(-66, -99, 132, 8, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#d4a834'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(34, -92); ctx.lineTo(34, -70); ctx.stroke(); ctx.fillStyle = '#f4d878'; ell(34, -68, 3, 3); ctx.fill();
  if (on > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(0, -96, 2, 70, [[0, night ? `rgba(220,246,236,${.9 * on})` : `rgba(255,236,170,${.55 * on})`], [1, 'rgba(255,236,170,0)']]); ctx.fillRect(-80, -110, 160, 80); ctx.restore(); }
}

// ------------------------------------------------------------------ a pizza box on the tower: perspective box, a red label on the lid and the front
function pizzaBox(cx, cz, y0, o = {}) {
  const hw = 104, hd = 104, h = 26, y = y0 + (o.lift || 0), sq = o.sq || 0, hh = h * (1 - .25 * sq);
  const c = o.color ?? '#d9a85a';
  box3({ x0: cx - hw * (1 + .06 * sq), x1: cx + hw * (1 + .06 * sq), y0: y, y1: y + hh, z0: cz - hd, z1: cz + hd, color: c, top: lit(c, 1.12), front: lit(c, .94), side: lit(c, .74), lw: 2.4 });
  const q = [p2(cx - 60, y + hh * .5 + 7, cz - hd), p2(cx + 18, y + hh * .5 + 7, cz - hd), p2(cx + 18, y + hh * .5 - 8, cz - hd), p2(cx - 60, y + hh * .5 - 8, cz - hd)];
  poly(q, '#c4202c');
  const t = p2(cx - 21, y + hh * .5, cz - hd), k = kz(cz - hd); text('PIZZA', t[0], t[1] + 1, { size: 15 * k, font: 'Bangers', weight: 400, fill: '#fff6e0', spacing: 1.4 });
  quad3([cx - 70, y + hh + .5, cz - 60], [cx + 70, y + hh + .5, cz - 60], [cx + 70, y + hh + .5, cz + 40], [cx - 70, y + hh + .5, cz + 40], 'rgba(196,32,44,.22)');
}
// soft wisps of steam rising from (x, y) in screen space: a pure function of time
function steam(x, y, t, a, k = 1) {
  if (a <= 0) return;
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const u = ((t * .42 + i / 12 + hash(i) * .3) % 1), px = x + (hash(i + 4) - .5) * 70 * k + Math.sin(u * 5 + i) * 16 * k, py = y - u * 150 * k, r = (12 + 34 * u) * k, al = .3 * a * Math.sin(u * PI);
    ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(255,255,255,${al})`], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the window ribbon: sky, skyline, moon, blinds
function stars(x0, y0, x1, y1, t, n, seed, a) {
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i + seed)), y = lerp(y0, y1, hash(i + seed + 70) ** 1.3), tw = .5 + .5 * Math.sin(t * (1.1 + hash(i + 5) * 2) + i), r = 1.1 + hash(i + 9) * 1.6;
    ctx.fillStyle = `rgba(255,252,235,${a * (.3 + .7 * tw)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
}
function windowBand(o, P) {
  const zb = LAY.zb, k = kz(zb), W_ = LAY.win, night = o.night, t = o.t ?? 0;
  const tilt = clamp(o.blinds ?? (night ? .5 : .45)), up = clamp(o.blindsUp ?? (night ? .78 : 0));
  W_.panes.forEach(([x0, x1], pi) => {
    const y0 = W_.y0, y1 = W_.y1;
    onZ(zb, x0 - 20, x1 + 20, y0 - 20, y1 + 24, P.frame, ink, 2.6);
    const f = [p2(x0, y0, zb), p2(x1, y0, zb), p2(x1, y1, zb), p2(x0, y1, zb)], L = f[3][0], R = f[2][0], T = f[3][1], B_ = f[0][1], Hh = B_ - T;
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    ctx.fillStyle = grad(0, T, 0, B_, night ? [[0, '#04061a'], [.6, '#101a42'], [1, '#233470']] : [[0, '#6fb8f4'], [.65, '#b5dcf8'], [1, '#eaf6fd']]); ctx.fillRect(L - 2, T - 2, R - L + 4, Hh + 4);
    if (night) stars(L, T, R, B_ - Hh * .3, t, 16, pi * 31 + 5, .9);
    else {
      A7.clouds(t, T + Hh * .12, T + Hh * .55, { n: 2, a: .92, speed: 5, seed: pi * 3 + 1, scale: .5 * k });
      V2.glow(R - (R - L) * .2, T + Hh * .18, (R - L) * .7, '255,244,214', .5, 'screen', 0);
    }
    for (let i = 0; i < 9; i++) {   // the town: pale blocks by day, a dark skyline with a few lit windows at night
      const bw = (R - L) / 9 * (1 + hash(i + pi * 9) * .4), bx = L + (R - L) * (i / 9) - bw * .1, bh = Hh * (.14 + .2 * hash(i + pi * 17 + 3));
      ctx.fillStyle = night ? '#0a0e26' : '#a9bfd6'; ctx.fillRect(bx, B_ - bh, bw, bh + 2);
      if (night) { for (let q = 0; q < 6; q++) if (hash(i * 7 + q + pi * 13) > .55) { ctx.fillStyle = hash(q + i) > .5 ? 'rgba(255,214,130,.85)' : 'rgba(255,236,170,.7)'; ctx.fillRect(bx + 5 + (q % 3) * bw * .28, B_ - bh + 8 + Math.floor(q / 3) * bh * .38, 5, 7); } }
      else { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let q = 0; q < 4; q++) ctx.fillRect(bx + 5 + (q % 2) * bw * .4, B_ - bh + 7 + Math.floor(q / 2) * bh * .4, 6, 8); }
    }
    if (night && pi === 1) {   // the Moon, high in the middle pane
      const mx = (L + R) / 2 + (R - L) * .12, my = T + Hh * .42, mr = Hh * .27;
      V2.glow(mx, my, mr * 3.4, '190,210,255', .42, 'screen', .5);
      ctx.fillStyle = grad(mx - mr, my - mr, mx + mr, my + mr, [[0, '#fffdf0'], [1, '#e6dcb8']]); ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(160,140,100,.22)'; for (const [dx, dy, rr2] of [[-.35, -.25, .22], [.3, .12, .17], [-.05, .4, .12], [.4, -.38, .1]]) { ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, rr2 * mr, 0, TAU); ctx.fill(); }
    }
    const n = 11, pitch = Hh / n, pe = pitch * (1 - .86 * up), th = pe * (.2 + .82 * tilt);   // blinds: slats stacked from the top; up raises the stack, tilt (0 open to 1 shut) widens each slat
    for (let i = 0; i < n; i++) {
      const y = T + i * pe;
      ctx.fillStyle = grad(0, y, 0, y + th, [[0, P.slat[0]], [1, P.slat[1]]]); ctx.fillRect(L - 2, y, R - L + 4, th);
      ctx.fillStyle = 'rgba(30,24,40,.34)'; ctx.fillRect(L - 2, y + th, R - L + 4, Math.max(1.4, 1.8 * k));
    }
    const bot = T + (n - 1) * pe + th;
    ctx.fillStyle = night ? '#46485c' : '#b89a6a'; ctx.fillRect(L - 2, bot, R - L + 4, 9 * k); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(L - 2, bot, R - L + 4, 2.4 * k);
    ctx.strokeStyle = night ? 'rgba(160,170,200,.5)' : 'rgba(120,100,70,.55)'; ctx.lineWidth = Math.max(1.4, 2 * k);
    for (const u of [.2, .8]) { const cx = lerp(L, R, u); ctx.beginPath(); ctx.moveTo(cx, T); ctx.lineTo(cx, bot + 20 * k); ctx.stroke(); }
    ctx.restore();
    onZ(zb, x0 - 26, x1 + 26, y0 - 34, y0 - 12, P.frame, ink, 2);
  });
}

// ------------------------------------------------------------------ the room: ceiling beams, cornice, wall, wainscot
function ceilingDress(o, P) {
  const { hw, ch, zb } = LAY, night = o.night, z0 = V2.P.cz + 60, edge = 'rgba(12,6,6,.55)';
  for (let z = Math.ceil((z0 + 60) / 380) * 380; z < zb - 60; z += 380) quad3([-hw, ch, z - 20], [hw, ch, z - 20], [hw, ch, z + 20], [-hw, ch, z + 20], P.beam, edge, 1.2);
  for (let x = -hw + 100; x < hw; x += 400) quad3([x - 20, ch, z0], [x + 20, ch, z0], [x + 20, ch, zb], [x - 20, ch, zb], P.beam, edge, 1.2);
  for (const [X, Z] of [[-200, 190], [200, 190], [-200, 570], [200, 570], [-200, 950], [200, 950], [-200, 1330], [200, 1330]]) if (Z > z0 + 100) ceilingLamp(X, Z, ch, night ? 0 : .9, '255,246,224', 110, 160);
}
function wallDress(o, P) {
  const zb = LAY.zb, { hw, ch, rail } = LAY, night = o.night;
  for (let X = -hw + 10; X < hw; X += 70) onZ(zb, X, X + 26, rail + 8, ch - 40, night ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.05)', null);   // pinstripes on the plaster
  for (let X = -hw + 20; X < hw - 100; X += 168) {   // wainscot: raised panels
    onZ(zb, X, X + 144, 34, rail - 24, lit(P.wain, 1.12), 'rgba(15,8,6,.55)', 1.8);
    onZ(zb, X + 10, X + 134, 44, rail - 34, lit(P.wain, .92), 'rgba(255,220,170,.12)', 1.4);
  }
  // cornice: three bands and a row of dentils
  onZ(zb, -hw, hw, ch - 36, ch - 24, night ? '#1a1412' : '#6a4a34', 'rgba(10,6,6,.5)', 1.2);
  onZ(zb, -hw, hw, ch - 24, ch - 10, night ? '#2e231d' : '#8a6446', 'rgba(10,6,6,.4)', 1.2);
  onZ(zb, -hw, hw, ch - 10, ch, night ? '#3a2e26' : '#a07a58', 'rgba(10,6,6,.4)', 1.2);
  ctx.fillStyle = night ? 'rgba(0,0,0,.4)' : 'rgba(40,20,10,.35)';
  for (let X = -hw + 8; X < hw; X += 22) { const a = p2(X, ch - 22, zb), b = p2(X + 10, ch - 12, zb); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
}

// ------------------------------------------------------------------ the pocket door, far left: closed it is a wood door with a PLEASE KNOCK plate; open it is a slab of hall light
function pocketDoor(o, P) {
  const { x0, x1, y1 } = LAY.door, zb = LAY.zb, open = clamp(o.door ?? 0), k = kz(zb), night = o.night;
  onZ(zb, x0 - 30, x1 + 30, 0, y1 + 34, P.wood, ink, 2.6);
  onZ(zb, x0 - 30, x1 + 30, y1 + 6, y1 + 34, lit(P.wood, 1.25), ink, 2);
  const f = [p2(x0, 0, zb), p2(x1, 0, zb), p2(x1, y1, zb), p2(x0, y1, zb)];
  ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  // the hall beyond: a warm white slab with a floor and a far door
  const hallTop = night ? '#cdd8ec' : '#fff6dc', hallBot = night ? '#aebbd6' : '#ffe6b0';
  ctx.fillStyle = grad(0, f[3][1], 0, f[0][1], [[0, hallTop], [1, hallBot]]); ctx.fillRect(f[0][0] - 2, f[3][1] - 2, f[1][0] - f[0][0] + 4, f[0][1] - f[3][1] + 4);
  ctx.fillStyle = night ? '#8f9cb8' : '#d9caa0'; ctx.fillRect(f[0][0] - 2, f[0][1] - 62 * k, f[1][0] - f[0][0] + 4, 64 * k);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(f[0][0] - 2, f[0][1] - 62 * k, f[1][0] - f[0][0] + 4, 4 * k);
  ctx.fillStyle = night ? '#6f86a8' : '#9cc4c0'; ctx.fillRect(f[0][0] - 2, f[0][1] - 150 * k, f[1][0] - f[0][0] + 4, 88 * k);   // the hall's own wainscot
  ctx.restore();
  // the leaf slides right into the wall; only the part still inside the opening is visible
  const w = x1 - x0, XL = x0 + open * (w + 20);
  if (XL < x1) {
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    onZ(zb - 3, XL, XL + w, 0, y1, grad(0, p2(0, y1, zb)[1], 0, p2(0, 0, zb)[1], [[0, lit(P.woodHi, 1.15)], [1, lit(P.wood, .9)]]), ink, 2.6);
    for (const [a, b] of [[.08, .47], [.53, .92]]) for (const [c, d] of [[.62, .94], [.34, .58], [.05, .30]]) {
      onZ(zb - 3, XL + w * a, XL + w * b, y1 * c, y1 * d, lit(P.wood, .86), 'rgba(10,6,4,.6)', 1.8);
      onZ(zb - 3, XL + w * a + 8, XL + w * b - 8, y1 * c + 8, y1 * d - 8, lit(P.woodHi, 1.0), 'rgba(255,220,170,.18)', 1.4);
    }
    const [px, py] = p2(XL + w * .5, 292, zb - 3), kk = kz(zb - 3);   // the brass plate: PLEASE KNOCK
    ctx.save(); ctx.translate(px, py); ctx.scale(kk, kk);
    ctx.fillStyle = V2.grad(0, -20, 0, 20, [[0, '#f6dc82'], [1, '#a8781e']]); rr(-52, -20, 104, 40, 5); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,6,.85)'; ctx.lineWidth = 2.4; ctx.stroke();
    text('PLEASE', 0, -7, { size: 15, fill: '#2a1c06', weight: 900, spacing: 1.6 }); text('KNOCK', 0, 10, { size: 15, fill: '#2a1c06', weight: 900, spacing: 1.6 });
    ctx.restore();
    const [hx, hy] = p2(XL + 16, 240, zb - 3); ctx.fillStyle = V2.grad(hx, hy - 30 * kk, hx + 8 * kk, hy, [[0, '#f4d878'], [1, '#8a6414']]); rr(hx - 4 * kk, hy - 36 * kk, 9 * kk, 72 * kk, 4 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,4,.8)'; ctx.lineWidth = 1.6; ctx.stroke();
    if (open > 0) { ctx.fillStyle = 'rgba(8,4,2,.45)'; const e = p2(XL, 0, zb - 3), e2 = p2(XL, y1, zb - 3); ctx.fillRect(e[0] - 3, e2[1], 3, e[1] - e2[1]); }
    ctx.restore();
  }
  onZ(zb - 2, x0 - 30, x1 + 30, y1 + 4, y1 + 12, '#2a2022', null);   // the brass track the leaf runs on
  ctx.fillStyle = '#c9a040'; { const a = p2(x0 - 30, y1 + 6, zb - 2), b = p2(x1 + 30, y1 + 10, zb - 2); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
  if (open > 0) {   // hall light: a bloom at the opening and a wedge across the carpet
    const [cx, cy] = p2((x0 + x1) / 2, y1 * .45, zb);
    V2.glow(cx, cy, 440 * k, night ? '200,220,255' : '255,238,190', .5 * open, 'screen', .9);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const a = p2(x0, 0, zb), b = p2(x1, 0, zb), c = p2(x1 + 640, 0, zb - 900), d = p2(x0 + 60, 0, zb - 900);
    ctx.fillStyle = grad(0, a[1], 0, c[1], [[0, `rgba(255,240,200,${.4 * open})`], [1, 'rgba(255,240,200,0)']]); poly([a, b, c, d], ctx.fillStyle);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ the vault: a recess in the wall behind the portrait, and a round steel door that can swing open
function vaultDoor(o) {
  const rc = LAY.recess, zb = LAY.zb - 2, open = clamp(o.vaultOpen ?? 0), bolts = clamp(o.vaultBolts ?? 1), a = open * 1.8, wheel = o.wheelRot ?? 0;
  const x0 = rc.x - rc.w / 2, x1 = rc.x + rc.w / 2, y0 = rc.y - rc.h / 2, y1 = rc.y + rc.h / 2, R = rc.r, kk = kz(zb), c0 = p2(rc.x, rc.y, zb);
  onZ(zb, x0 - 16, x1 + 16, y0 - 16, y1 + 16, V2.grad(0, p2(0, y1, zb)[1], 0, p2(0, y0, zb)[1], [[0, '#b4bcc8'], [1, '#6a7280']]), 'rgba(10,12,18,.8)', 2.6);
  onZ(zb, x0, x1, y0, y1, '#0c0e14', 'rgba(0,0,0,.8)', 2);
  for (const [bx, by] of [[x0 - 8, y0 - 8], [x1 + 8, y0 - 8], [x0 - 8, y1 + 8], [x1 + 8, y1 + 8]]) { const q = p2(bx, by, zb); ctx.fillStyle = '#d4dae4'; ell(q[0], q[1], 5 * kk, 5 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(20,20,30,.8)'; ctx.lineWidth = 1.4; ctx.stroke(); }
  // the cavity: whatever the scene wants inside it (gold), clipped to the round opening
  ctx.fillStyle = '#05060a'; ell(c0[0], c0[1], (R + 2) * kk, (R + 2) * kk); ctx.fill();
  if (open > 0) { ctx.save(); ell(c0[0], c0[1], (R - 6) * kk, (R - 6) * kk); ctx.clip();
    if (o.vaultDraw) o.vaultDraw({ x: c0[0], y: c0[1], r: (R - 6) * kk, k: kk, open });
    else { ctx.fillStyle = V2.radial(c0[0], c0[1], 0, R * kk, [[0, '#2a3040'], [1, '#0a0c12']]); ctx.fillRect(c0[0] - R * kk, c0[1] - R * kk, 2 * R * kk, 2 * R * kk); ctx.strokeStyle = 'rgba(140,150,170,.22)'; ctx.lineWidth = 2 * kk; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(c0[0] - R * kk, c0[1] + i * 30 * kk); ctx.lineTo(c0[0] + R * kk, c0[1] + i * 30 * kk); ctx.stroke(); } }
    ctx.restore(); }
  ctx.strokeStyle = V2.grad(c0[0] - R * kk, c0[1] - R * kk, c0[0] + R * kk, c0[1] + R * kk, [[0, '#d4dae6'], [.5, '#5a6272'], [1, '#aab2c2']]); ctx.lineWidth = 12 * kk; ell(c0[0], c0[1], (R + 4) * kk, (R + 4) * kk); ctx.stroke();
  // the leaf, hinged on its left edge: points are mapped through the swing so it foreshortens with the camera
  const H = rc.x - R, ca = Math.cos(a), sa = Math.sin(a);
  const pt = (rr, th) => { const s = R + rr * Math.cos(th), Y = rc.y + rr * Math.sin(th); return p2(H + s * ca, Y, zb - s * sa); };
  const ring = (rr, n = 40) => { const q = []; for (let i = 0; i < n; i++) q.push(pt(rr, i / n * TAU)); return q; };
  const back = a > 1.5708;
  // locking bolts: they stand out of the rim into the frame while locked
  if (bolts > 0 && open < .05) for (let i = 0; i < 8; i++) { const th = i / 8 * TAU + .39, p0 = pt(R - 4, th), p1 = pt(R + 14 * bolts, th); ctx.strokeStyle = '#8a92a2'; ctx.lineWidth = 12 * kk; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3 * kk; ctx.beginPath(); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.stroke(); }
  const rim = ring(R), mid = ring(R * .84), inn = ring(R * .52);
  poly(rim, V2.grad(c0[0] - R * kk, c0[1] - R * kk, c0[0] + R * kk, c0[1] + R * kk, back ? [[0, '#7a8294'], [1, '#3c4250']] : [[0, '#c4ccd8'], [.45, '#7a8496'], [1, '#444c5c']]), 'rgba(10,12,20,.9)', 3.4 * kk);
  poly(mid, null, 'rgba(255,255,255,.28)', 2.4 * kk); poly(mid, null, 'rgba(10,12,20,.45)', 1 * kk);
  poly(inn, V2.grad(c0[0] - R * kk * .5, c0[1] - R * kk * .5, c0[0] + R * kk * .5, c0[1] + R * kk * .5, back ? [[0, '#6a7284'], [1, '#383e4c']] : [[0, '#aab4c4'], [1, '#5a6478']]), 'rgba(10,12,20,.9)', 2.4 * kk);
  for (let i = 0; i < 12; i++) { const th = i / 12 * TAU, q = pt(R * .92, th); ctx.fillStyle = back ? '#4a5262' : '#dfe5ee'; ell(q[0], q[1], 4.4 * kk, 4.4 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(10,12,20,.8)'; ctx.lineWidth = 1.2 * kk; ctx.stroke(); }
  if (!back) {   // the wheel: a hub, four spokes with knobs and a rim, turned by wheelRot
    const hub = pt(0, 0);
    ctx.strokeStyle = '#d4dae6'; ctx.lineWidth = 9 * kk; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const th = wheel + i * PI / 2, q = pt(R * .46, th); ctx.beginPath(); ctx.moveTo(...hub); ctx.lineTo(...q); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(20,24,36,.8)'; ctx.lineWidth = 2.4 * kk; for (let i = 0; i < 4; i++) { const th = wheel + i * PI / 2, q = pt(R * .46, th); ctx.beginPath(); ctx.moveTo(...hub); ctx.lineTo(...q); ctx.stroke(); }
    const wr = []; for (let i = 0; i < 40; i++) wr.push(pt(R * .46, wheel + i / 40 * TAU)); poly(wr, null, '#c4ccd8', 6 * kk);
    for (let i = 0; i < 4; i++) { const th = wheel + i * PI / 2, q = pt(R * .5, th); ctx.fillStyle = '#e8c458'; ell(q[0], q[1], 7 * kk, 7 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,4,.8)'; ctx.lineWidth = 1.8 * kk; ctx.stroke(); }
    ctx.fillStyle = '#e8c458'; ell(hub[0], hub[1], 12 * kk, 12 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(40,24,4,.85)'; ctx.lineWidth = 2.4 * kk; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); const hl = [pt(R * .96, -2.6), pt(R * .96, -2.2), pt(R * .5, -1.8), pt(R * .5, -2.6)]; hl.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fill();
  }
  for (const sy of [-.5, .5]) { const q = pt(0, 0), h0 = p2(H - 6 * ca, rc.y + sy * R, zb - 6 * sa); void q; ctx.fillStyle = '#9aa2b2'; ell(h0[0], h0[1], 7 * kk, 12 * kk); ctx.fill(); ctx.strokeStyle = 'rgba(10,12,20,.8)'; ctx.lineWidth = 1.8 * kk; ctx.stroke(); }   // the hinges
}
// the portrait swings open on its left hinge: a strip at a time so the picture foreshortens in true perspective; past 90 degrees we see its plain back
function portraitSwing(o) {
  const pt = LAY.portrait, zp = LAY.zb - 7, a = clamp(o.paintingOpen ?? 0) * 1.95, ca = Math.cos(a), sa = Math.sin(a), y1 = pt.y0 + pt.h, y0 = pt.y0, hx = pt.x0;
  const c = art('portrait', pt.w, pt.h, 2, drawPortrait), HP = c.height, N = 18, sw = c.width / N;
  if (a < .001) { onWall(c, pt.x0, y1, pt.w, pt.h, zp); return; }
  const at = u => [hx + u * pt.w * ca, zp - u * pt.w * sa];
  if (a > 1.5708) {   // the back of the canvas
    const P0 = at(0), P1 = at(1);
    poly([p2(P0[0], y1, P0[1]), p2(P1[0], y1, P1[1]), p2(P1[0], y0, P1[1]), p2(P0[0], y0, P0[1])], '#4a3624', 'rgba(15,8,4,.85)', 3);
    const I0 = at(.07), I1 = at(.93); poly([p2(I0[0], y1 - 26, I0[1]), p2(I1[0], y1 - 26, I1[1]), p2(I1[0], y0 + 26, I1[1]), p2(I0[0], y0 + 26, I0[1])], '#6a5038', 'rgba(15,8,4,.5)', 2);
    const L0 = at(.3), L1 = at(.7), my = (y0 + y1) / 2; poly([p2(L0[0], my + 18, L0[1]), p2(L1[0], my + 18, L1[1]), p2(L1[0], my - 18, L1[1]), p2(L0[0], my - 18, L0[1])], '#eee6d2', 'rgba(15,8,4,.5)', 1.6);
    return;
  }
  for (let i = 0; i < N; i++) {
    const A = at(i / N), B_ = at((i + 1) / N), t0 = p2(A[0], y1, A[1]), t1 = p2(B_[0], y1, B_[1]), b0 = p2(A[0], y0, A[1]);
    const ex = [(t1[0] - t0[0]) / sw, (t1[1] - t0[1]) / sw], ey = [(b0[0] - t0[0]) / HP, (b0[1] - t0[1]) / HP], sx0 = i * sw;
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.transform(ex[0], ex[1], ey[0], ey[1], t0[0] - sx0 * ex[0], t0[1] - sx0 * ex[1]);
    ctx.drawImage(c, sx0, 0, Math.min(sw + 1, c.width - sx0), HP, sx0, 0, Math.min(sw + 1, c.width - sx0), HP);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ furniture
function adminChair(night, X, Z) {
  const P = night ? PAL.night : PAL.day, S = LAY.admin.seat, lc = P.leather, hiL = mixc(lc, '#ffffff', .22), loL = mixc(lc, '#000000', .45);
  stand(X, 0, Z, () => {
    softShadow(0, 4, 230, 26, .35);
    ctx.fillStyle = '#2a2a34'; ctx.strokeStyle = INK; ctx.lineWidth = 4;   // the base: a gas-lift post and five feet on casters
    rr(-9, -(S - 20), 18, S - 40, 5); ctx.fill(); ctx.stroke();
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(i * 64, -8); ctx.lineTo(i * 64 + 4, -2); ctx.lineTo(0, -12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#12121a'; ell(i * 64 + 2, -3, 9, 6); ctx.fill(); ctx.fillStyle = '#2a2a34'; }
    // the back: a tall tufted leather panel with a rounded top
    const bb = S - 26, bt = S + 415, bm = S + 200;
    ctx.fillStyle = V2.grad(-210, -bt, 210, -bb, [[0, hiL], [.5, lc], [1, loL]]); ctx.strokeStyle = INK; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-205, -bb); ctx.lineTo(-200, -bm); ctx.quadraticCurveTo(-196, -(bt - 30), -90, -(bt - 14)); ctx.quadraticCurveTo(0, -bt - 6, 90, -(bt - 14)); ctx.quadraticCurveTo(196, -(bt - 30), 200, -bm); ctx.lineTo(205, -bb); ctx.quadraticCurveTo(0, -(bb - 22), -205, -bb); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 3;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) { const bx = -140 + c * 70 + (r % 2) * 35, by = -(S + 24 + r * 62); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 35, by - 31); ctx.moveTo(bx, by); ctx.lineTo(bx + 35, by + 31); ctx.stroke(); }
    for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) { const bx = -175 + c * 70 + (r % 2) * 35, by = -(S + 24 + r * 62); ctx.fillStyle = loL; ell(bx, by + 2, 7, 7); ctx.fill(); ctx.fillStyle = '#e8c458'; ell(bx, by, 5, 5); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.moveTo(-190, -(bb + 12)); ctx.lineTo(-186, -bm); ctx.quadraticCurveTo(-180, -(bt - 50), -100, -(bt - 34)); ctx.lineTo(-96, -(bt - 40)); ctx.quadraticCurveTo(-170, -(bt - 60), -172, -bm); ctx.lineTo(-176, -(bb + 12)); ctx.fill();
    ctx.restore();
    // the seat cushion in front of the back, and an arm pad on each side
    ctx.fillStyle = V2.grad(0, -(S + 6), 0, -(S - 38), [[0, hiL], [1, loL]]); rr(-182, -(S + 6), 364, 46, 18); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#e8c458'; ctx.lineWidth = 2.4; ctx.setLineDash([2, 9]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-170, -(S - 30)); ctx.lineTo(170, -(S - 30)); ctx.stroke(); ctx.setLineDash([]);
    for (const sd of [-1, 1]) { ctx.fillStyle = lc; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(sd * 230 - 21, -(S + 96), 42, 138, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = hiL; rr(sd * 230 - 14, -(S + 90), 11, 90, 5); ctx.fill(); ctx.fillStyle = '#e8c458'; for (let i = 0; i < 4; i++) { ell(sd * 230 + 10, -(S + 70) + i * 26, 2.8, 2.8); ctx.fill(); } }
  });
}
function visitorChair(o, P, part) {
  const v = LAY.visitor, X = o.visitorX ?? v.x, Z = o.visitorZ ?? v.z, S = v.seat, night = o.night, back = part !== 'front', front = part !== 'back';
  const vin = night ? '#4a4228' : '#8c7c4e', vinHi = night ? '#6a6040' : '#b4a266', vinLo = night ? '#2c2616' : '#5a4e2c', chrome = ['#e8edf4', '#7a8498'];
  const tube = (x, y0, y1, w = 9) => { ctx.fillStyle = V2.grad(x - w / 2, 0, x + w / 2, 0, [[0, chrome[1]], [.4, chrome[0]], [1, chrome[1]]]); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; rr(x - w / 2, -y1, w, y1 - y0, 3); ctx.fill(); ctx.stroke(); };
  if (back) stand(X, 0, Z + 26, () => {
    softShadow(0, 4, 140, 14, .32);
    tube(-78, 0, S - 8); tube(78, 0, S - 8);                                  // the rear legs
    tube(-82, S, S + 178, 8); tube(82, S, S + 178, 8);                        // the back posts
    ctx.fillStyle = V2.grad(0, -(S + 176), 0, -(S + 44), [[0, vinHi], [.5, vin], [1, vinLo]]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
    rr(-96, -(S + 176), 192, 130, 26); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-60, -(S + 168)); ctx.lineTo(-60, -(S + 54)); ctx.moveTo(60, -(S + 168)); ctx.lineTo(60, -(S + 54)); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(-86, -(S + 166), 14, 100, 6); ctx.fill();
    ctx.save(); ctx.translate(52, -(S + 108)); ctx.rotate(-.35); ctx.fillStyle = 'rgba(150,152,160,.8)'; ctx.fillRect(-26, -10, 52, 20); ctx.strokeStyle = 'rgba(40,40,50,.45)'; ctx.lineWidth = 1.2; ctx.strokeRect(-26, -10, 52, 20); ctx.restore();   // a strip of duct tape
  });
  if (front) stand(X, 0, Z, () => {
    tube(-78, 0, S - 16); tube(78, 0, S - 16);                                // the front legs
    ctx.fillStyle = '#1a1a22'; rr(-86, -4, 16, 6, 3); ctx.fill(); rr(70, -4, 16, 6, 3); ctx.fill();
    ctx.fillStyle = V2.grad(0, -(S + 4), 0, -(S - 32), [[0, vinHi], [.4, vin], [1, vinLo]]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-104, -(S + 4), 208, 40, 16); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-96, -(S - 24)); ctx.lineTo(96, -(S - 24)); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(-92, -(S + 1), 90, 7, 3); ctx.fill();
  });
}
// a ficus in a terracotta pot, a coat stand with a trench coat and a fedora, a wire wastebasket with two more resignations in it
function drawFicus(night) {   // billboard: base at the origin
  softShadow(0, 4, 90, 12, .3);
  ctx.fillStyle = V2.grad(-46, 0, 46, 0, [[0, '#8a4a30'], [.4, '#c4704a'], [1, '#7a3e28']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-50, -118); ctx.lineTo(50, -118); ctx.lineTo(38, -4); ctx.quadraticCurveTo(0, 6, -38, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9854e'; rr(-56, -134, 112, 22, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a1a10'; ell(0, -128, 46, 6); ctx.fill();
  ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -130); ctx.quadraticCurveTo(-18, -240, 8, -330); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-6, -220); ctx.quadraticCurveTo(-60, -260, -90, -300); ctx.moveTo(4, -250); ctx.quadraticCurveTo(60, -280, 96, -320); ctx.stroke();
  const leaves = []; for (let i = 0; i < 26; i++) { const a = hash(i + 3) * TAU, r = 40 + hash(i + 9) * 110; leaves.push([Math.cos(a) * r * 1.1 + (i % 2 ? 6 : -6), -300 - Math.sin(a) * r * .9 - 40 + (hash(i) - .5) * 40, a + 1.2]); }
  leaves.sort((p, q) => q[1] - p[1]);
  leaves.forEach(([x, y, a], i) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = V2.grad(0, -28, 0, 28, [[0, night ? '#2e6a42' : '#58b04a'], [1, night ? '#163a24' : '#2a7a34']]); ctx.strokeStyle = night ? '#0c2216' : '#14461c'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(0, 0, 21, 34, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.stroke(); ctx.restore(); });
}
function drawCoatStand(night) {
  softShadow(0, 4, 90, 12, .3);
  ctx.fillStyle = '#6a4a18'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
  for (const sd of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(sd * 76, -8); ctx.lineTo(sd * 76, 0); ctx.lineTo(0, -10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = V2.grad(-8, 0, 8, 0, [[0, '#8a6414'], [.4, '#f4d878'], [1, '#7a5410']]); rr(-8, -560, 16, 540, 6); ctx.fill(); ctx.stroke(); ell(0, -566, 12, 12); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#d4a834'; ctx.lineWidth = 8; ctx.lineCap = 'round'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -520); ctx.quadraticCurveTo(sd * 46, -520, sd * 52, -486); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -470); ctx.quadraticCurveTo(sd * 40, -470, sd * 46, -440); ctx.stroke(); }
  // the trench coat
  ctx.fillStyle = V2.grad(0, -520, 0, -180, [[0, night ? '#6a5a3a' : '#c4a468'], [1, night ? '#3a3020' : '#8a7040']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(-14, -500); ctx.quadraticCurveTo(-74, -496, -86, -430); ctx.lineTo(-96, -190); ctx.quadraticCurveTo(0, -170, 96, -190); ctx.lineTo(86, -430); ctx.quadraticCurveTo(74, -496, 14, -500); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -498); ctx.lineTo(0, -178); ctx.moveTo(-60, -440); ctx.lineTo(-52, -200); ctx.moveTo(60, -440); ctx.lineTo(52, -200); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-90, -346, 180, 12); ctx.fillStyle = '#d4a834'; rr(-10, -350, 20, 20, 3); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; for (let i = 0; i < 3; i++) { ell(-18, -470 + i * 50, 5, 5); ctx.fill(); ell(18, -470 + i * 50, 5, 5); ctx.fill(); }
  // the fedora, on the top hook
  ctx.save(); ctx.translate(0, -590); ctx.fillStyle = night ? '#1a1a1e' : '#34343e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ell(0, 6, 54, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-32, 4); ctx.lineTo(-28, -34); ctx.quadraticCurveTo(0, -42, 28, -34); ctx.lineTo(32, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c4202c'; ctx.fillRect(-31, -12, 62, 8); ctx.restore();
}
function drawBin(night) {
  softShadow(0, 3, 60, 8, .3);
  ctx.fillStyle = night ? '#12131a' : '#2a2c36'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, -86); ctx.lineTo(40, -86); ctx.lineTo(32, -2); ctx.lineTo(-32, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(190,196,214,.5)'; ctx.lineWidth = 1.4; for (let i = 1; i < 8; i++) { const x = -40 + i * 10; ctx.beginPath(); ctx.moveTo(x, -84); ctx.lineTo(x * .8, -4); ctx.stroke(); } for (const y of [-64, -44, -24]) { ctx.beginPath(); ctx.moveTo(-38 + (86 + y) * .1, y); ctx.lineTo(38 - (86 + y) * .1, y); ctx.stroke(); }
  ctx.strokeStyle = '#8a92a4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -86, 41, 8, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#f6f2e6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.save(); ctx.translate(-12, -94); ctx.rotate(-.4); ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-10, -12); ctx.lineTo(4, -16); ctx.lineTo(14, -4); ctx.lineTo(10, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();   // a crumpled paper
  ctx.save(); ctx.translate(14, -96); ctx.rotate(.5); ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(-14, -8); ctx.lineTo(0, -14); ctx.lineTo(14, -6); ctx.lineTo(8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}

// ------------------------------------------------------------------ the set
function office(o = {}) {
  const night = !!o.night, P = night ? PAL.night : PAL.day, t = o.t ?? 0, D = LAY.desk, lampOn = o.lampOn ?? (night ? 1 : .35);
  const layout = { zb: LAY.zb, hw: LAY.hw, ch: LAY.ch, door: LAY.door, win: LAY.win, portrait: LAY.portrait, recess: LAY.recess, chart: LAY.chart, desk: D, admin: LAY.admin, visitor: LAY.visitor, credenza: LAY.credenza, bin: LAY.bin };
  const adminX = LAY.admin.x + (o.chairShift ?? 0);
  // where things are on the screen under the current camera
  const deskPt = (X, Z) => p2(X, D.top, Z);
  const at = {   // anchors in scene coordinates under the current camera: whip pans, pulses and effects aim at these
    chart: () => p2(LAY.chart.x0 + LAY.chart.w / 2, LAY.chart.y1 - LAY.chart.h / 2, LAY.zb - 6),
    portrait: () => p2(LAY.portrait.x0 + LAY.portrait.w / 2, LAY.portrait.y0 + LAY.portrait.h / 2, LAY.zb - 7),
    recess: () => p2(LAY.recess.x, LAY.recess.y, LAY.zb - 2),
    door: () => p2((LAY.door.x0 + LAY.door.x1) / 2, LAY.door.y1 / 2, LAY.zb),
    penTop: () => p2(D.x0 + 52, D.top + 142, D.z0 + 62),
    pen: () => p2(D.x0 + 44, D.top + 30, D.z0 + 62),
    towerTop: (n = 2) => p2(D.x0 + 412, D.top + n * 26, D.z0 + 96),
    lamp: () => p2(D.x1 - 96, D.top + 100, D.z1 - 44),
    nameplate: () => p2(D.x0 + 190, D.top + 30, D.z0 + 34),
    desk: () => p2((D.x0 + D.x1) / 2, D.top, (D.z0 + D.z1) / 2),
    deskFront: () => p2((D.x0 + D.x1) / 2, D.top, D.z0),
    bin: () => p2(LAY.bin.x, LAY.bin.top, LAY.bin.z),
  };
  // the Administrator, seated: no legs, the bottom of his body resting on his chair; extra is merged into the character options
  const admin = extra => { const A = LAY.admin, q = V2.at(adminX, A.z); return A9.melon(Object.assign(q, { s: q.s * 1.22, noLegs: true, y: V2.proj(adminX, A.seat, A.z)[1], id: 'melon' }, extra)); };
  // a guest seated in the low chair (ctor is the character constructor, e.g. A7.straw): no legs, body on the seat
  const guest = (ctor, extra) => { const v = LAY.visitor, X = o.visitorX ?? v.x, Z = o.visitorZ ?? v.z, q = V2.at(X, Z); return ctor(Object.assign(q, { noLegs: true, y: V2.proj(X, v.seat, Z)[1] }, extra)); };
  function back() {
    const zb = LAY.zb;
    shell({ zb, hw: LAY.hw, ch: LAY.ch, wall: P.wall, wain: P.wain, floorA: P.floorA, floorB: P.floorB, ceil: P.ceil, fog: P.fog, fogAmt: night ? .34 : .26, tile: 160, rail: LAY.rail });
    ceilingDress(o, P);
    windowBand(o, P);
    wallDress(o, P);
    pocketDoor(o, P);
    const pt = LAY.portrait, ch_ = LAY.chart, ps = LAY.poster;
    vaultDoor(o);
    portraitSwing(o);
    const pulse = o.chartPulse ?? 0;
    onWall(art('chart', ch_.w, ch_.h, 2, drawChart), ch_.x0, ch_.y1, ch_.w, ch_.h, zb - 6, 1 + .05 * pulse);
    onWall(art('poster', ps.w, ps.h, 3, drawPoster), ps.x0, ps.y1, ps.w, ps.h, zb - 6);
    let dy = LAY.dips.y1; DIP.forEach((d, i) => { onWall(art('dip' + i, d.w, d.h, 3, (w, h) => drawDiploma(w, h, i)), LAY.dips.x0, dy, d.w, d.h, zb - 6); dy -= d.h + 8; });
    // floor: a rug under the desk
    const rg = { x0: -560, x1: 760, z0: 420, z1: 1700 }, pr = P.rug;   /* the near edge is far in front of the guest chair, so the lower frame is carpet and not bare floor */
    quad3([rg.x0, .5, rg.z0], [rg.x1, .5, rg.z0], [rg.x1, .5, rg.z1], [rg.x0, .5, rg.z1], grad(0, p2(0, 0, rg.z1)[1], 0, p2(0, 0, rg.z0)[1], [[0, pr[0]], [1, pr[1]]]), 'rgba(10,6,8,.6)', 2);
    for (const [e, col, lw] of [[26, '#d4a834', 6], [46, 'rgba(212,168,52,.7)', 2.4]]) quad3([rg.x0 + e, .6, rg.z0 + e], [rg.x1 - e, .6, rg.z0 + e], [rg.x1 - e, .6, rg.z1 - e], [rg.x0 + e, .6, rg.z1 - e], null, col, lw * kz(1100));
    ctx.strokeStyle = 'rgba(240,220,170,.5)'; ctx.lineWidth = Math.max(1.4, 2 * kz(rg.z0)); for (let X = rg.x0 + 10; X < rg.x1; X += 22) { const a = p2(X, .6, rg.z0), b = p2(X, .6, rg.z0 - 26); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }   // fringe along the near edge
    // furniture on the back wall side: the credenza and the pizza stash
    const cz = LAY.credenza, cw = cz.x1 - cz.x0;
    softShadow(...p2((cz.x0 + cz.x1) / 2, 0, cz.z0), cw * .6 * kz(cz.z0), 12 * kz(cz.z0), .3);
    box3({ x0: cz.x0, x1: cz.x1, y0: 0, y1: cz.top, z0: cz.z0, z1: cz.z1, color: P.desk, top: lit(P.woodHi, 1.1), front: lit(P.desk, 1.04), side: lit(P.desk, .7), lw: 2.4 });
    for (let i = 0; i < 3; i++) onZ(cz.z0, cz.x0 + 12 + i * (cw - 24) / 3, cz.x0 + (i + 1) * (cw - 24) / 3 + 4, 14, cz.top - 14, lit(P.desk, .84), 'rgba(10,6,4,.6)', 1.8);
    for (let i = 0; i < 5; i++) pizzaBox((cz.x0 + cz.x1) / 2 + (i % 2 ? 7 : -5) + (i === 3 ? 6 : 0), (cz.z0 + cz.z1) / 2, cz.top + i * 26, { color: ['#d9a85a', '#e0b468', '#d09c4c', '#e4bc74', '#d4a252'][i] });
    stand(760, 0, 1630, () => drawFicus(night), .82);
    if (!o.coatLate) stand(-840, 0, 1530, () => drawCoatStand(night));   /* coatLate: the scene draws it with off.coat() after a character who walks past it from behind */
    adminChair(night, adminX, LAY.admin.z + 80);
    lightsBack();
  }
  const coat = () => stand(-840, 0, 1530, () => drawCoatStand(night));
  // light that belongs behind the cast: the day's sun on the floor, the night's cold pool
  function lightsBack() {
    const zb = LAY.zb;
    if (night) {
      const [lx, ly] = p2(D.x1 - 96, D.top + 110, D.z1 - 44);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = radial(lx - 120, ly + 90, 40 + 110 * lampOn, 560 + 540 * lampOn, [[0, 'rgba(255,255,255,1)'], [.45, 'rgba(158,178,222,1)'], [1, 'rgba(58,70,122,1)']]); ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
    } else {
      V2.glow(540, 780, 760, '255,236,190', .1, 'screen', .2);
      const sun = o.sun ?? 1, wb = p2(0, LAY.win.y0, zb)[1], kw = kz(zb);
      for (const [x0, x1] of LAY.win.panes) { const cx = p2((x0 + x1) / 2, 0, zb)[0]; V2.beam(cx, wb, cx + 90, wb + 560, (x1 - x0) * kw * .9, (x1 - x0) * kw * 1.5, '255,244,214', .06 * sun); }
    }
  }
  // the desk, drawn in front of the Administrator: top, front, props, and the tower of pizza boxes
  function desk() {
    const d = D;
    softShadow(...p2((d.x0 + d.x1) / 2, 0, d.z0 + 60), (d.x1 - d.x0) * .62 * kz(d.z0), 20 * kz(d.z0), .38);
    // the body, then the slab
    onWall(art('deskfront' + (night ? 'N' : 'D'), d.x1 - d.x0, d.top - 24, 2, (w, h) => drawDeskFront(w, h, night)), d.x0, d.top - 24, d.x1 - d.x0, d.top - 24, d.z0);
    box3({ x0: d.x0 - 16, x1: d.x1 + 16, y0: d.top - 24, y1: d.top, z0: d.z0 - 16, z1: d.z1, color: P.wood, top: P.woodHi, front: lit(P.woodHi, .96), side: lit(P.wood, .7), lw: 2.4 });
    quad3([d.x0 + 18, d.top + .4, d.z0 + 8], [d.x1 - 18, d.top + .4, d.z0 + 8], [d.x1 - 18, d.top + .4, d.z1 - 12], [d.x0 + 18, d.top + .4, d.z1 - 12], night ? '#1a3a2c' : '#2a5a42', '#d4a834', 1.8 * kz(d.z0));
    // the sun's stripes on the desk top
    if (!night && (o.sun ?? 1) > 0) sunBands(o, d.top, [[d.x0 + 18, d.z0 + 8], [d.x1 - 18, d.z0 + 8], [d.x1 - 18, d.z1 - 12], [d.x0 + 18, d.z1 - 12]], .3 * (o.sun ?? 1));
    stand(LAY.bin.x, 0, LAY.bin.z, () => drawBin(night));
    // props, back to front
    stand(d.x0 + 80, d.top, d.z1 - 64, () => trays(night));
    stand(d.x0 + 270, d.top, d.z1 - 50, phone);
    stand(d.x1 - 96, d.top, d.z1 - 44, () => bankerLamp(night, lampOn));
    stand(d.x1 - 42, d.top, d.z0 + 100, mug);
    stand(d.x0 + 44, d.top, d.z0 + 62, () => penCup(o));
    stand(d.x0 + 190, d.top, d.z0 + 34, nameplate);
    // the tower
    const tw = o.tower || [], tx = d.x0 + 412, tz = d.z0 + 96;
    tw.forEach((b, i) => { if (b.a === 0) return; ctx.save(); if (b.a != null) ctx.globalAlpha *= b.a; pizzaBox(tx + (i % 2 ? 4 : -3), tz, d.top + i * 26, { lift: b.y || 0, sq: b.sq || 0, color: ['#d9a85a', '#e0b468', '#d09c4c'][i % 3] }); ctx.restore(); });
    if (o.steamK > 0 && tw.length) { const top = p2(tx, d.top + tw.length * 26 + 6, tz); steam(top[0], top[1], t, o.steamK, kz(tz)); }
    if (night) lightsDesk();
  }
  function lightsDesk() {
    const lampXZ = [D.x1 - 96, D.z1 - 44], [lx, ly] = p2(lampXZ[0], D.top + 112, lampXZ[1]), kk = kz(lampXZ[1]);
    const gl = o.lampGlow ?? 1;   /* scales the soft light laid over the desk and over whoever sits behind it: lower it in close-ups so it never washes a face */
    V2.glow(lx, ly, 380 * kk, '215,244,232', .55 * lampOn * gl, 'screen', .8);
    ctx.save(); ctx.globalCompositeOperation = 'screen';   // the lamp's pool on the desk top and the front panel: a wide soft ellipse
    const [px, py] = p2(lampXZ[0] - 60, D.top, D.z0 + 90);
    ctx.translate(px, py + 40); ctx.scale(1, .42); ctx.fillStyle = radial(0, 0, 0, 430 * kk, [[0, `rgba(215,244,232,${.3 * lampOn * gl})`], [.6, `rgba(215,244,232,${.12 * lampOn * gl})`], [1, 'rgba(215,244,232,0)']]); ctx.beginPath(); ctx.arc(0, 0, 430 * kk, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // stripes of sun on a horizontal plane (the floor or the desk top): each slit between two slats throws a band, further from the window the higher the slit
  function sunBands(o2, planeY, poly4, a, col = '255,238,190') {
    const W_ = LAY.win, zb = LAY.zb, tilt = clamp(o2.blinds ?? .45), up = clamp(o2.blindsUp ?? 0), n = 11, pitch = (W_.y1 - W_.y0) / n, pe = pitch * (1 - .86 * up), gap = pe * (1 - (.2 + .82 * tilt));
    if (gap < 1 || a <= 0) return;
    const sy = .85, sx = .1;
    ctx.save(); ctx.beginPath(); poly4.forEach(([X, Z], i) => { const q = p2(X, planeY, Z); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.clip(); ctx.globalCompositeOperation = 'screen';
    for (const [x0, x1] of W_.panes) for (let i = 0; i < n; i++) {
      const yc = W_.y1 - (i * pe + (pe - gap) * .5 + gap * .5) , yt = yc + gap / 2, yb = yc - gap / 2;
      if (yb < planeY) continue;
      const zn = zb - (yt - planeY) / sy, zf = zb - (yb - planeY) / sy, dn = (yt - planeY) / sy * sx, df = (yb - planeY) / sy * sx;
      quad3([x0 + dn, planeY, zn], [x1 + dn, planeY, zn], [x1 + df, planeY, zf], [x0 + df, planeY, zf], `rgba(${col},${a})`);
    }
    if (up > .02) for (const [x0, x1] of W_.panes) {   // below a raised stack the glass is open: one wide band
      const yt = W_.y1 - n * pe, yb = Math.max(W_.y0, planeY + 1); if (yt <= yb) continue;
      const zn = zb - (yt - planeY) / sy, zf = zb - (yb - planeY) / sy, dn = (yt - planeY) / sy * sx, df = (yb - planeY) / sy * sx;
      quad3([x0 + dn, planeY, zn], [x1 + dn, planeY, zn], [x1 + df, planeY, zf], [x0 + df, planeY, zf], `rgba(${col},${a * .8})`);
    }
    ctx.restore();
  }
  // the carpet's share of the sun and the dust in the beams, drawn after the floor furniture so they lie on top of it
  function sunFloor() {
    if ((o.sun ?? 1) <= 0) return;
    if (night) { sunBands(o, 0, [[-LAY.hw, V2.P.cz + 60], [LAY.hw, V2.P.cz + 60], [LAY.hw, LAY.zb - 20], [-LAY.hw, LAY.zb - 20]], .07 * (o.sun ?? 1), '150,180,255'); return; }
    sunBands(o, 0, [[-LAY.hw, V2.P.cz + 60], [LAY.hw, V2.P.cz + 60], [LAY.hw, LAY.zb - 20], [-LAY.hw, LAY.zb - 20]], .2 * (o.sun ?? 1));
  }
  // the visitor's low chair: part 'back' before the sitter, 'front' after; no part draws both
  const visitor = part => visitorChair(o, P, part);
  function over() {
    if (!night && (o.dust ?? 1) > 0) V2.dust(120, 640, 1000, 1300, t, { n: 46, alpha: .55 * (o.dust ?? 1), size: 3.4, speed: 9, seed: 4 });
  }
  const lightPreset = night
    ? { key: [.45, .2], keyColor: '#d8f4e8', keyA: .3, rim: '#6f8cff', rimA: .5, shadow: '#050a1e', shadowA: .5, bounce: '#9fb4e8', bounceA: .1, amb: '#9aa8e0', ambA: .1 }
    : { key: [-.3, -.8], keyColor: '#fff2d6', keyA: .24, rim: '#ffd9a0', rimA: .5, shadow: '#2a2038', shadowA: .32, bounce: '#e9c9a0', bounceA: .16, amb: '#fff4e0', ambA: .04 };
  return { back, desk, visitor, over, sunFloor, coat, lightPreset, layout, night, deskPt, at, admin, guest, adminX, setLight: extra => V2.setLight(Object.assign({}, lightPreset, extra || {})) };
}

window.S10 = { office, LAY, PAL, art, onWall, stand, steam, softShadow, pizzaBox };
})();
