'use strict';
/* SHIFT HAPPENS, Episode 20, "The Snow Day": the LOT builder's art kit, window.A20 (ep20_art.js). Contract: /tmp/shift_tools/briefs/A20_API.md; usage, options and traps: GUIDE_ART20.md in this folder.
 * Registers through the engine's EXT hooks (kinds `turnip` and `eggplant`, everything else prefixed fp20_). Every function is a pure function of its arguments and `t`: no Math.random, no Date, no state.
 *
 * AS BUILT (signatures; the options are in GUIDE_ART20.md)
 *   A20.winter(o, g)          dress ANY drawChar options (A6..A15, A7, A20) in winter gear: g = { hat 'beanie'|'earflap'|'hood'|'none', hatColor, cuffColor, stripeColor, pom, pomColor, scarf, scarfColor, scarf2,
 *                             mittens, mitten, boots, boot, coat, coatColor, wind -1..1, snow 0..1, shiver 0..1, breath }. Returns o (o.acc gets fp20_hat / fp20_scarf / fp20_coat / fp20_boots / fp20_breath,
 *                             o.w20 = the resolved gear, o.shiverDx / o.shiverDy = the tremble the caller adds to x / y). Defaults per o.who (A20.GEAR).
 *   A20.car(ctx, o)           a small hatchback, side view: { x, y (ground centre), s, color, snow 0..1, facing, lights, seed, t } -> box [x0, y0, x1, y1]. A20.carInfo(o) gives the same box and the key points
 *                             (mirror, antenna tip, roof, door) in world units without drawing.
 *   A20.plowTruck(ctx, o)     a pickup with a plow blade, side view: { x, y, s, facing, t, blade, load, beacon, headlights, cab } -> { box, cab, blade, exhaust, beacon, bladeTip }. A20.truck = the same function.
 *   A20.eggplant(o) / A20.turnip(o) / A20.ditchPicture(ctx, o) / A20.snowman(ctx, o) / A20.shovelThrow(o, t, t0): see the sections below.
 *   Held props: fp20_mug, fp20_phone, fp20_slice, fp20_shovel. Accessories: fp20_hat, fp20_scarf, fp20_coat, fp20_boots, fp20_breath, fp20_hivis, fp20_scrubs, fp20_cap, fp20_calyx.
 */
(() => {
if (typeof KINDS === 'undefined' || typeof EXT === 'undefined' || typeof V2 === 'undefined' || typeof V2C === 'undefined') return;
const A = window.A20 = window.A20 || {};
const SC = .44, G = 1316;
const OUT = 'rgba(25,10,20,.92)';
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : hash(s * 3.17 + k * 11.3 + 1.3);
const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const tOf = o => (o && o.t != null ? o.t : (typeof T === 'number' ? T : 0));
const mixc = (a, b, k) => V2.rgba(V2.mix(a, b, k), 1);
const mixa = (a, b, k, al) => V2.rgba(V2.mix(a, b, k), al);
const yawsOf = o => { const Y = V2C.yawInfo ? V2C.yawInfo(o) : null; return Y ? { y: Y.y, h: Y.h } : { y: o.yaw || 0, h: o.headYaw != null ? o.headYaw : (o.yaw || 0) }; };
const keyX = () => V2.LIGHT.key[0];
const dsin = Math.sin, dcos = Math.cos;
A.PLATES = A.PLATES || {};

// ================================================================== the silhouette of a kind: half width at a height (cached once per kind, from the engine's own path)
const HW = {};
let hwCtx = null;
function halfW(kind, y) {
  let tab = HW[kind];
  if (!tab) {
    const k = KINDS[kind], p = PATHS[kind] || (PATHS[kind] = bodyPath(k));
    if (!hwCtx) hwCtx = document.createElement('canvas').getContext('2d');
    const y0 = -Math.ceil(k.ry * 1.25), n = Math.ceil(k.ry * 2.6 / 4) + 2, arr = new Float32Array(n);
    for (let i = 0; i < n; i++) { const yy = y0 + i * 4; let w = 0; for (let x = 0; x <= k.rx * 1.3; x += 2) if (hwCtx.isPointInPath(p, x, yy)) w = x; arr[i] = w; }
    tab = HW[kind] = { y0, arr };
  }
  const f = (y - tab.y0) / 4, i = Math.floor(f), u = f - i;
  if (i < 0 || i >= tab.arr.length - 1) return 0;
  return lerp(tab.arr[i], tab.arr[i + 1], u);
}
A.halfW = halfW;
function crownY(kind) { const k = KINDS[kind]; for (let y = -k.ry * 1.25; y < k.ry; y += 2) if (halfW(kind, y) > 3) return y; return -k.ry; }

// ================================================================== defaults per character (the cast in winter gear)
const GEAR = {
  straw: { hat: 'beanie', hatColor: '#c7162f', cuffColor: '#f3ebe4', stripeColor: '#c7162f', pom: true, pomColor: '#ffffff', scarfColor: '#f3ebe4', scarf2: '#c7162f', mitten: '#a31029', boot: '#4a2f2a' },
  mango: { hat: 'earflap', hatColor: '#ff7d1f', cuffColor: '#ffe7b8', stripeColor: '#1fa89b', pom: false, scarfColor: '#1fa89b', scarf2: '#ffe7b8', mitten: '#1f9f95', boot: '#3f3a46' },
  lemon: { hat: 'beanie', hatColor: '#efb40c', cuffColor: '#25407f', stripeColor: '#fff3b0', pom: true, pomColor: '#25407f', scarfColor: '#25407f', scarf2: '#f5d03a', mitten: '#25407f', boot: '#3a3446' },
  onion: { hat: 'beanie', hatColor: '#ead7a4', cuffColor: '#4f9d4a', stripeColor: '#f6ecc9', pom: false, scarfColor: '#4f9d4a', scarf2: '#f6ecc9', mitten: '#3f8a45', boot: '#4b3b2d' },
  tom: { hat: 'beanie', hatColor: '#7a47c2', cuffColor: '#c9b0f0', stripeColor: '#ffffff', pom: true, pomColor: '#e6d8ff', scarfColor: '#c9b0f0', scarf2: '#7a47c2', mitten: '#7a47c2', boot: '#3c2f55' },
  bind: { hat: 'none', scarfColor: '#d93a3a', scarf2: '#ffffff', mitten: '#d93a3a' },
  egg: { hat: 'beanie', hatColor: '#1f9a8f', cuffColor: '#f2dba0', stripeColor: '#1f9a8f', pom: false, scarfColor: '#e8aa1c', scarf2: '#f6e3a8', mitten: '#e8aa1c', boot: '#3d3345' },
  turnip: { hat: 'none', scarf: false, mitten: '#a6824a', boot: '#3b3026' },
  other: { hat: 'beanie', hatColor: '#3b82c4', cuffColor: '#e9f1f8', stripeColor: '#3b82c4', pom: true, pomColor: '#ffffff', scarfColor: '#e9f1f8', scarf2: '#3b82c4', mitten: '#3b82c4', boot: '#46382e' },
};
A.GEAR = GEAR;
const HAT_CLASH = ['fp15_visor_badge', 'fp15_headset', 'fp15_hardhat', 'bandage', 'bandage7', 'bun', 'curlers', 'bouffant', 'fedora', 'santa', 'partyhat', 'partyhat10', 'newsboy', 'nightcap', 'firehelmet', 'statecap', 'fp13_cap', 'fp14_cap', 'fp20_hat', 'fp20_scarf', 'fp20_coat', 'fp20_boots', 'fp20_breath'];

// ================================================================== the hat: a knit beanie / trapper hat / hood that sits ABOVE the brows (mid layer: the face is drawn over it)
function hatGeo(o, k, g) {
  const yb = k.eyeY - k.er * 1.42 - 21 - (o.browUp || 0) - (g.hatLift || 0);   /* the lowest point of the band: clear of the brows even when they rise */
  const ev = 9, hc = g.cuffH || 24, yTe = yb - ev - hc;
  const wb = clamp(halfW(o.kind, yb - 4) + 7, 62, g.hatMaxW || 100);
  const top = crownY(o.kind), apex = Math.min(top - 30, yTe - 36) - (g.hatTall || 0);
  return { yb, ev, hc, yTe, wb, wd: wb - 4, apex, top };
}
const cuffB = (G, x) => G.yb - G.ev * (1 - Math.sqrt(Math.max(0, 1 - (x / G.wb) * (x / G.wb))));
const cuffT = (G, x) => cuffB(G, x) - G.hc;
function fluff(x, y, r, fill, sh, n = 11, seed = 1) {   /* a pom-pom: a ball of soft bumps, inked outline, a pale highlight */
  ctx.save(); ctx.lineJoin = 'round';
  const bumps = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd(seed, i) * .5; bumps.push([x + dcos(a) * r * .72, y + dsin(a) * r * .72, r * (.4 + rnd(seed, i + 9) * .14)]); }
  ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(x, y, r * .86 + 2.2, 0, TAU); ctx.fill();
  for (const b of bumps) { ctx.beginPath(); ctx.arc(b[0], b[1], b[2] + 2.2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r * .86, 0, TAU); ctx.fill();
  for (const b of bumps) { ctx.beginPath(); ctx.arc(b[0], b[1], b[2], 0, TAU); ctx.fill(); }
  ctx.fillStyle = V2.radial(x + (keyX() < 0 ? -r * .35 : r * .35), y - r * .3, 1, r * 1.15, [[0, 'rgba(255,255,255,.5)'], [.5, 'rgba(255,255,255,0)'], [1, sh]]);
  ctx.beginPath(); ctx.arc(x, y, r * 1.02, 0, TAU); ctx.fill();
  ctx.restore();
}
function snowLumps(pts, seed, amt, col = '#f7fbff') {   /* snow lying along a polyline (hat top, scarf top, shoulders): lumpy white caps with a pale blue underside */
  if (amt <= .02 || pts.length < 2) return;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const th = (5 + 6 * rnd(seed, i)) * amt, nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len, up = (ny < 0 ? 1 : -1);
    ctx.fillStyle = 'rgba(150,176,214,.9)'; ctx.beginPath(); ctx.ellipse(mx - nx * up * 0, my + 1.6, len * .62, th * .72, Math.atan2(b[1] - a[1], b[0] - a[0]), 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(mx + nx * up * th * .15, my - th * .25 * Math.abs(ny), len * .62, th * .72, Math.atan2(b[1] - a[1], b[0] - a[0]), 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function hatDraw(o, k, t, layer) {
  const g = o.w20; if (layer !== 'mid' || !g || !g.hat || g.hat === 'none') return;
  const hy = yawsOf(o).h, G = hatGeo(o, k, g), kx = keyX(), lightL = kx < 0, wind = g.wind || 0, snow = g.snow || 0;
  const base = g.hatColor, cuff = g.cuffColor || mixc(base, '#ffffff', .55), stripe = g.stripeColor || cuff;
  const dk = mixc(base, '#10142a', .38), lt = mixc(base, '#ffffff', .3), mid = mixc(base, '#ffffff', .05);
  const sway = dsin(t * 2.6 + (o.seed || 0)) * 1.2 + wind * 5, tilt = (g.hatTilt || 0) + wind * .03;
  ctx.save(); ctx.translate(0, G.yb); ctx.rotate(tilt); ctx.translate(0, -G.yb); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const hood = g.hat === 'hood', wd = hood ? G.wb + 5 : G.wd, apexY = G.apex + (hood ? 8 : 0);
  if (g.poke) g.poke(o, k, t, G, apexY);   /* a stem or sprout that comes up through the crown (drawn first: the dome hides its base) */
  /* the ear flaps hang behind the cuff */
  const flaps = g.hat === 'earflap' || hood;
  if (flaps) for (const sd of [-1, 1]) {
    const fx = sd * (G.wb - 2), top = cuffB(G, fx) - 6, len = hood ? 96 : 74, w = hood ? 30 : 25, sw2 = wind * 7 * (sd > 0 ? 1 : .6) + dsin(t * 3.1 + sd) * 1.2;
    ctx.beginPath(); ctx.moveTo(fx - w / 2, top); ctx.lineTo(fx + w / 2, top); ctx.bezierCurveTo(fx + w / 2 + 3 + sw2 * .3, top + len * .55, fx + w * .38 + sw2, top + len * .9, fx + sw2, top + len); ctx.bezierCurveTo(fx - w * .38 + sw2, top + len * .9, fx - w / 2 - 3 + sw2 * .3, top + len * .55, fx - w / 2, top); ctx.closePath();
    ctx.fillStyle = V2.grad(fx - w / 2, 0, fx + w / 2, 0, lightL ? [[0, lt], [1, dk]] : [[0, dk], [1, lt]]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 2; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(fx + j * 7, top); ctx.lineTo(fx + j * 7 + sw2 * .8, top + len); ctx.stroke(); } ctx.restore();
    /* the fleece lining: a pale scalloped rim down the inside edge */
    ctx.strokeStyle = 'rgba(255,246,228,.95)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(fx - sd * w * .36, top + 8); ctx.quadraticCurveTo(fx - sd * w * .4 + sw2 * .3, top + len * .6, fx - sd * w * .16 + sw2, top + len - 4); ctx.stroke();
    if (!hood) {   /* the tie: a cord with a little ball */
      ctx.strokeStyle = mixc(cuff, '#000000', .25); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx + sw2, top + len - 2); ctx.quadraticCurveTo(fx + sw2 + sd * 4 + wind * 6, top + len + 14, fx + sw2 - sd * 2 + wind * 10, top + len + 26); ctx.stroke();
      ctx.fillStyle = cuff; ctx.beginPath(); ctx.arc(fx + sw2 - sd * 2 + wind * 10, top + len + 28, 5, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }
  /* the dome */
  ctx.beginPath(); ctx.moveTo(-wd, G.yTe + 3);
  ctx.bezierCurveTo(-wd - 2, G.yTe - (G.yTe - apexY) * .62, -wd * .56 + sway * .2, apexY, sway * .3, apexY);
  ctx.bezierCurveTo(wd * .56 + sway * .2, apexY, wd + 2, G.yTe - (G.yTe - apexY) * .62, wd, G.yTe + 3);
  for (let i = 10; i >= -10; i--) { const x = i / 10 * wd; ctx.lineTo(x, cuffT(G, x) + 4); }
  ctx.closePath();
  ctx.fillStyle = V2.grad(-wd, 0, wd, 0, lightL ? [[0, lt], [.38, mid], [1, dk]] : [[0, dk], [.62, mid], [1, lt]]); ctx.fill();
  ctx.save(); ctx.clip();
  /* knit: meridian ribs that turn with the head, a soft shine on the lit side */
  const span = .46;
  for (let i = -8; i <= 8; i++) {
    const a = i * span + ((hy % span) + span) % span - span / 2; if (dcos(a) < .12) continue;
    const xb = wd * dsin(a); ctx.strokeStyle = 'rgba(10,14,40,.22)'; ctx.lineWidth = 2.6; ctx.beginPath();
    for (let j = 0; j <= 8; j++) { const u = j / 8, x = xb * dcos(u * PI / 2) + sway * .3 * u, y = lerp(G.yTe + 4, apexY, dsin(u * PI / 2)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.13)'; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let j = 0; j <= 8; j++) { const u = j / 8, x = xb * dcos(u * PI / 2) + 3 + sway * .3 * u, y = lerp(G.yTe + 4, apexY, dsin(u * PI / 2)); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  }
  ctx.fillStyle = V2.radial(-kx * wd * .4, apexY + (G.yTe - apexY) * .3, 2, wd * .75, [[0, 'rgba(255,255,255,.42)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-wd - 6, apexY - 8, wd * 2 + 12, G.yTe - apexY + 14);
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 4.4;
  ctx.beginPath(); ctx.moveTo(-wd, G.yTe + 3); ctx.bezierCurveTo(-wd - 2, G.yTe - (G.yTe - apexY) * .62, -wd * .56 + sway * .2, apexY, sway * .3, apexY); ctx.bezierCurveTo(wd * .56 + sway * .2, apexY, wd + 2, G.yTe - (G.yTe - apexY) * .62, wd, G.yTe + 3); ctx.stroke();
  if (snow > .02) {   /* snow along the crown */
    const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8, a = lerp(-1.15, 1.15, u); pts.push([wd * dsin(a) * 1.0 + sway * .3 * (1 - Math.abs(a) / 1.2), lerp(G.yTe - 6, apexY, dcos(a) * dcos(a) * .98)]); }
    snowLumps(pts, (o.seed || 0) + 5, clamp(snow * 1.1));
  }
  /* the cuff: a rolled ribbed band with a stripe */
  const N = 14, topE = [], botE = [];
  for (let i = 0; i <= N; i++) { const x = lerp(-G.wb, G.wb, i / N); topE.push([x, cuffT(G, x)]); botE.push([x, cuffB(G, x)]); }
  ctx.beginPath(); topE.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = N; i >= 0; i--) ctx.lineTo(botE[i][0], botE[i][1]); ctx.closePath();
  const cd = mixc(cuff, '#10142a', .3), cl = mixc(cuff, '#ffffff', .25);
  ctx.fillStyle = V2.grad(-G.wb, 0, G.wb, 0, lightL ? [[0, cl], [.4, cuff], [1, cd]] : [[0, cd], [.6, cuff], [1, cl]]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = stripe; ctx.beginPath(); for (let i = 0; i <= N; i++) { const x = topE[i][0]; const y = cuffT(G, x) + G.hc * .34; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } for (let i = N; i >= 0; i--) { const x = topE[i][0]; ctx.lineTo(x, cuffT(G, x) + G.hc * .64); } ctx.closePath(); ctx.fill();
  for (let i = -12; i <= 12; i++) { const a = i * .24 + ((hy % .24) + .24) % .24 - .12; if (dcos(a) < .1) continue; const x = G.wb * dsin(a); ctx.strokeStyle = 'rgba(10,14,40,.26)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, cuffT(G, x) - 2); ctx.lineTo(x, cuffB(G, x) + 2); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, G.yTe, 0, G.yb, [[0, 'rgba(255,255,255,.28)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(10,14,40,.3)']]); ctx.fillRect(-G.wb - 4, G.yTe - 12, G.wb * 2 + 8, G.hc + 26);
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 4.2; ctx.beginPath(); topE.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineTo(botE[N][0] + 2, botE[N][1]); for (let i = N; i >= 0; i--) ctx.lineTo(botE[i][0], botE[i][1]); ctx.lineTo(topE[0][0], topE[0][1]); ctx.stroke();
  if (hood) {   /* the fur ring round the face: a fat pale band over the brow, down both sides */
    ctx.fillStyle = 'rgba(255,248,236,.96)'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.4;
    for (const sd of [-1, 1]) for (let j = 0; j < 7; j++) { const yy = G.yb - 6 + j * 13, xx = sd * (G.wb + 3 - Math.abs(j - 2) * .3); ctx.beginPath(); ctx.arc(xx, yy, 9, 0, TAU); ctx.fill(); ctx.stroke(); }
  }
  /* the pom-pom */
  if (g.pom && !hood) fluff(sway * .5, apexY - 8, 19, g.pomColor || '#ffffff', 'rgba(120,140,190,.5)', 11, (o.seed || 0) + 3);
  if (snow > .02 && g.pom && !hood) { ctx.fillStyle = 'rgba(247,251,255,.95)'; ctx.beginPath(); ctx.ellipse(sway * .5 - 2, apexY - 22, 9 * snow + 3, 4 * snow + 2, -.2, 0, TAU); ctx.fill(); }
  ctx.restore();
}
EXT.acc.fp20_hat = (o, k, t, layer) => hatDraw(o, k, t, layer);
// ================================================================== the scarf: a thick knit band under the mouth with a tail that flaps in the wind (mid layer, under the face)
function scarfGeo(o, k, g) {
  const flat = o.kind === 'bind';   /* the Binder has no neck: a tiny band round the foot of the cover, right under its smile */
  const sc = (k.mw || 26) / 26, ys = flat ? k.mouthY + 33 + (g.scarfLift || 0) : k.mouthY + 55 * sc + 3 + (g.scarfLift || 0);
  const th = flat ? Math.max(12, Math.min(g.scarfH || 17, k.ry - ys + 3)) : Math.min(g.scarfH || 34, Math.max(20, k.ry + 8 - ys));
  const cw = flat ? Math.max(.24, Math.abs(Math.cos(o.yaw15 != null ? o.yaw15 : yawsOf(o).y))) : 1;   /* the flat Binder narrows to its spine in profile (its own yaw15) */
  return { ys, th, wt: Math.max(30 * cw, (halfW(o.kind, ys + 2) + 7) * cw), wb: Math.max(30 * cw, (halfW(o.kind, ys + th - 2) + 9) * cw) };
}
function scarfDraw(o, k, t, layer) {
  const g = o.w20; if (layer !== 'mid' || !g || g.scarf === false) return;
  const yw = yawsOf(o).y, S = scarfGeo(o, k, g), kx = keyX(), lightL = kx < 0, wind = g.wind || 0, snow = g.snow || 0;
  const c1 = g.scarfColor || '#d93a3a', c2 = g.scarf2 || '#ffffff', ev1 = 4, ev2 = 8;
  const yT = x => S.ys - ev1 * (1 - Math.sqrt(Math.max(0, 1 - (x / S.wt) * (x / S.wt))));
  const yB = x => S.ys + S.th - ev2 * (1 - Math.sqrt(Math.max(0, 1 - (x / S.wb) * (x / S.wb))));
  const N = 16, top = [], bot = [];
  for (let i = 0; i <= N; i++) { const u = i / N; top.push([S.wt * lerp(-1, 1, u), yT(S.wt * lerp(-1, 1, u))]); bot.push([S.wb * lerp(-1, 1, u), yB(S.wb * lerp(-1, 1, u))]); }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
  const cd = mixc(c1, '#10142a', .34), cl = mixc(c1, '#ffffff', .26);
  ctx.fillStyle = V2.grad(-S.wb, 0, S.wb, 0, lightL ? [[0, cl], [.4, c1], [1, cd]] : [[0, cd], [.6, c1], [1, cl]]); ctx.fill();
  ctx.save(); ctx.clip();
  /* stripes that wrap round (a longitude each, so they travel when the body turns) */
  const span = .62;
  for (let i = -6; i <= 6; i++) {
    const a = i * span + ((yw % span) + span) % span - span / 2, a2 = a + span * .36; if (dcos(a) < .06 && dcos(a2) < .06) continue;
    const xa = Math.max(-1, Math.min(1, dsin(a))), xb = Math.max(-1, Math.min(1, dsin(a2)));
    ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(xa * S.wt, yT(xa * S.wt) - 2); ctx.lineTo(xb * S.wt, yT(xb * S.wt) - 2); ctx.lineTo(xb * S.wb, yB(xb * S.wb) + 2); ctx.lineTo(xa * S.wb, yB(xa * S.wb) + 2); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(10,14,40,.2)'; ctx.lineWidth = 2.6; ctx.beginPath();
  for (let i = 0; i <= N; i++) { const x = lerp(-S.wb, S.wb, i / N), y = lerp(yT(x * S.wt / S.wb), yB(x), .5) + 1; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  ctx.fillStyle = V2.grad(0, S.ys, 0, S.ys + S.th, [[0, 'rgba(255,255,255,.26)'], [.45, 'rgba(255,255,255,0)'], [1, 'rgba(10,14,40,.34)']]); ctx.fillRect(-S.wb - 6, S.ys - 10, S.wb * 2 + 12, S.th + 24);
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 4.2; ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.lineTo(bot[N][0], bot[N][1]); for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath(); ctx.stroke();
  if (snow > .02) snowLumps(top.filter((_, i) => i % 2 === 0).map(p => [p[0] * .96, p[1] + 1]), (o.seed || 0) + 21, clamp(snow * .9));
  /* the tail: a ribbon from the knot, hanging down and streaming with the wind */
  const lonK = .72, ck = dcos(lonK + yw);
  if (ck > -.1 && g.tail !== false) {
    const tiny = o.kind === 'bind', xk = Math.min(S.wt * .66, 70) * dsin(lonK + yw), yk = S.ys + S.th * .5, len = g.tailLen || (tiny ? 34 : 70), w0 = tiny ? 15 : 25, segs = 7;
    const base = .07 + wind * 1.0, fl = (.16 + Math.abs(wind) * .3);
    const P = [[xk, yk]], Wd = [w0];
    let ang = base, px = xk, py = yk;
    for (let i = 1; i <= segs; i++) { ang = base + fl * dsin(t * 6.2 - i * .85 + (o.seed || 0)) * (i / segs) + (wind * .35) * (i / segs); px += dsin(ang) * len / segs; py += dcos(ang) * len / segs; P.push([px, py]); Wd.push(w0 * (1 - .12 * i / segs)); }
    const L = [], R = [];
    for (let i = 0; i <= segs; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(segs, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = Wd[i] / 2 * (.55 + ck * .45); L.push([P[i][0] - dy / l * w, P[i][1] + dx / l * w]); R.push([P[i][0] + dy / l * w, P[i][1] - dx / l * w]); }
    const pathTail = () => { ctx.beginPath(); L.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = segs; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); };
    pathTail(); ctx.fillStyle = c1; ctx.fill();
    ctx.save(); pathTail(); ctx.clip();
    for (let i = 1; i < segs; i += 2) { ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(L[i][0], L[i][1]); ctx.lineTo(R[i][0], R[i][1]); ctx.lineTo(R[i + 1][0], R[i + 1][1]); ctx.lineTo(L[i + 1][0], L[i + 1][1]); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = V2.grad(xk - 14, 0, xk + 14, 0, lightL ? [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(10,14,40,.28)']] : [[0, 'rgba(10,14,40,.28)'], [1, 'rgba(255,255,255,.22)']]); ctx.fillRect(xk - 80, yk - 10, 160, 140);
    ctx.restore();
    pathTail(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
    /* the fringe at the free end */
    ctx.strokeStyle = c2; ctx.lineWidth = 3.4; const e = P[segs], ea = ang;
    for (let j = -2; j <= 2; j++) { const fx = e[0] + dcos(ea) * j * 4.4 * (.55 + ck * .45), fy = e[1] - dsin(ea) * j * 4.4; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + dsin(ea + j * .12) * 10, fy + dcos(ea + j * .12) * 10); ctx.stroke(); }
    /* the knot */
    ctx.fillStyle = c1; ctx.strokeStyle = OUT; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.ellipse(xk, yk - 2, 17, 12, .2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(10,14,40,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xk - 8, yk - 6); ctx.lineTo(xk + 7, yk + 2); ctx.stroke();
  }
  ctx.restore();
}
EXT.acc.fp20_scarf = (o, k, t, layer) => scarfDraw(o, k, t, layer);

// ================================================================== a quilted vest (coat: true) and the boots' fur cuffs (back layer, over the legs and shoes, under the body)
EXT.acc.fp20_coat = (o, k, t, layer) => {
  const g = o.w20; if (layer !== 'mid' || !g || !g.coat) return;
  const S = scarfGeo(o, k, g), col = g.coatColor || '#3b6fb6', yw = yawsOf(o).y, kx = keyX();
  ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  const y0 = S.ys + S.th * .72, y1 = k.ry + 10, R = k.rx * 1.2;
  ctx.fillStyle = V2.grad(-R, 0, R, 0, kx < 0 ? [[0, mixc(col, '#ffffff', .22)], [.5, col], [1, mixc(col, '#10142a', .4)]] : [[0, mixc(col, '#10142a', .4)], [.5, col], [1, mixc(col, '#ffffff', .22)]]);
  ctx.beginPath(); ctx.moveTo(-R, y0); ctx.quadraticCurveTo(0, y0 + 14, R, y0); ctx.lineTo(R, y1); ctx.lineTo(-R, y1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,14,40,.3)'; ctx.lineWidth = 3;
  for (let j = 1; j < 4; j++) { const yy = y0 + j * (y1 - y0) / 4; ctx.beginPath(); ctx.moveTo(-R, yy); ctx.quadraticCurveTo(0, yy + 12, R, yy); ctx.stroke(); }
  if (dcos(yw) > 0) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); const zx = dsin(yw) * halfW(o.kind, y0 + 20) * .3; ctx.moveTo(zx, y0 + 6); ctx.lineTo(zx, y1); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-halfW(o.kind, y0) - 2, y0); ctx.quadraticCurveTo(0, y0 + 14, halfW(o.kind, y0) + 2, y0); ctx.stroke();
};
function footXY(o, k, t, side) {   /* where legs() in v2_char.js puts the ankle of one leg (the same formulas; used for the boot cuffs) */
  const hipY = k.shape === 'straw' ? k.ry * .7 : k.shape === 'banana' ? k.ry * .78 : k.shape === 'star' ? k.ry * .74 : k.ry * .8;
  const hx = k.hip || k.rx * .32, L = k.leg || 90, St = o.stride || 30;
  let fx = side * hx, fy = hipY + L, lift = 0;
  if (o.gait != null || o.gaitW != null) {
    const dir = o.dir || 1, cyc = (o.gaitW != null ? o.gaitW : o.gait / (o.s || 1)) / (4 * St), ph = ((cyc + (side > 0 ? 0 : .5)) % 1 + 1) % 1;
    const off = ph < .5 ? St - 2 * St * (ph / .5) : -St + 2 * St * easeIO((ph - .5) / .5);
    if (o.axis === 'z') fy += dir * off * .5; else fx += dir * off;
    if (ph >= .5) lift = dsin((ph - .5) / .5 * PI) * 17;
  } else if (o.walk != null) { const a = dsin(o.walk + (side > 0 ? 0 : PI)) * .55; fx += dsin(a) * L; fy = hipY + dcos(a) * L; }
  if (o.legs === 'kick') { const a = side * .5 + .35 * dsin(t * 22 + side * 2); fx = side * hx + dsin(a) * L; fy = hipY + dcos(a) * L; }
  if (o.legs === 'splay') { const a = side * .55; fx = side * hx + dsin(a) * L; fy = hipY + dcos(a) * L; }
  if (o.legs === 'tap' && side > 0) lift = Math.max(0, dsin(t * 16)) * 11;
  if (!o.walk && o.gait == null && o.gaitW == null && !o.legs) fx += dsin(t * .9 + (o.seed || 0)) * 1.2 * side;
  return [fx, fy - lift];
}
EXT.acc.fp20_boots = (o, k, t, layer) => {
  const g = o.w20; if (layer !== 'back' || !g || !g.boots || o.noLegs) return;
  const yw = yawsOf(o).y; if (Math.abs(yw) > .05) return;
  const col = g.boot || '#4a2f2a', fur = g.bootFur || '#f6efe2';
  for (const side of [-1, 1]) {
    const [fx, fy] = footXY(o, k, t, side);
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = V2.grad(fx - 16, 0, fx + 16, 0, keyX() < 0 ? [[0, mixc(col, '#ffffff', .2)], [1, mixc(col, '#000000', .3)]] : [[0, mixc(col, '#000000', .3)], [1, mixc(col, '#ffffff', .2)]]);
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.roundRect(fx - 15, fy - 30, 30, 32, [9, 9, 4, 4]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fur; ctx.beginPath(); ctx.roundRect(fx - 18, fy - 36, 36, 12, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,100,80,.5)'; ctx.lineWidth = 1.6; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(fx + j * 9, fy - 35); ctx.lineTo(fx + j * 9 + 1, fy - 26); ctx.stroke(); }
    ctx.restore();
  }
};

// ================================================================== cold breath at the mouth (front layer); SN20.breath when the weather kit has landed, a small stand-in until then
function puffStandIn(x, y, t, dir, seed, size, alpha, period, phase) {
  const u = (((t / period + phase + rnd(seed, 1)) % 1) + 1) % 1, e = sm(0, .2, u) * (1 - sm(.45, 1, u)), r0 = size * (.5 + 1.5 * u);
  if (e <= .01) return;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const uu = clamp(u - i * .045), r = size * (.45 + 1.1 * uu) * (1 - i * .08), px = x + dir * (uu * size * 2.6 + i * 3), py = y - uu * size * .9 - i * 1.5 + dsin(uu * 6 + seed) * 2;
    ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(255,255,255,${.78 * alpha * e})`], [.62, `rgba(236,243,252,${.5 * alpha * e})`], [.9, `rgba(120,140,176,${.22 * alpha * e})`], [1, 'rgba(120,140,176,0)']]);
    ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
EXT.acc.fp20_breath = (o, k, t, layer) => {
  const g = o.w20; if (layer !== 'front' || !g || !g.breath) return;
  const Y = yawsOf(o), fa = V2C.faceAng ? V2C.faceAng(Y.h) : Y.h, prof = Math.abs(dsin(fa)) > .45;
  const side = prof ? (dsin(fa) < 0 ? -1 : 1) : (g.breathDir || ((o.look && o.look[0] < -.2) ? -1 : (o.look && o.look[0] > .2) ? 1 : ((o.seed || 0) % 2 ? -1 : 1)));
  const mx = prof ? 0 : side * ((k.mw || 26) * .8 + 6), my = k.mouthY + 6, size = g.breathSize || 1, phase = g.breathPhase || 0, dirW = side * (o.flip ? -1 : 1);
  if (window.SN20 && typeof SN20.breath === 'function') SN20.breath(ctx, { x: mx, y: my, t, seed: (o.seed || 0) + 7, dir: dirW, size, alpha: g.breathAlpha ?? .95, period: 1.9, phase });
  else puffStandIn(mx, my, t, side, (o.seed || 0) + 7, size * 17, g.breathAlpha ?? .9, 1.9, phase);
};

// ================================================================== A20.winter(o, g)
A.winter = function (o, g) {
  o = o || {}; g = Object.assign({}, g || {}); for (const key in g) if (g[key] === undefined) delete g[key];   /* an undefined option means "the default" */
  const who = o.who || 'other', D = Object.assign({ hat: 'beanie', scarf: true, mittens: true, boots: true, coat: false, wind: 0, snow: 0, shiver: 0, breath: false }, GEAR[who] || GEAR.other, g);
  if (D.hat === 'beanie' && g.pom == null && GEAR[who] && GEAR[who].pom == null) D.pom = false;
  if (D.hatColor == null && D.hat !== 'none') D.hatColor = GEAR.other.hatColor;
  o.w20 = D;
  const list = [];
  if (D.hat !== 'none') list.push('fp20_hat');
  if (D.scarf !== false) list.push('fp20_scarf');
  if (D.coat) list.push('fp20_coat');
  if (D.boots) list.push('fp20_boots');
  if (D.breath) list.push('fp20_breath');
  const clash = D.hat !== 'none' ? HAT_CLASH : HAT_CLASH.filter(a => a.indexOf('fp20_') === 0);
  o.acc = (o.acc || []).filter(a => clash.indexOf(a) < 0).concat(list);
  if (o.kind === 'straw' && D.hat !== 'none') o.cap = false;
  if (D.hat !== 'none' && KINDS[o.kind]) {   /* the audit's head box has to include the hat and the pom */
    const k = KINDS[o.kind], G2 = hatGeo(o, k, D), need = -G2.apex + (D.pom ? 30 : 8), have = (TOPS[o.kind] ?? k.ry * 1.05) - (o.kind === 'straw' ? 20 : 0);
    o.topExtra = Math.max(o.topExtra || 0, Math.max(0, need - have));
  }
  const t = tOf(o), sd = o.seed || 0;
  o.shiverDx = D.shiver ? D.shiver * 2.6 * vnoise(t * 47 + sd) : 0;
  o.shiverDy = D.shiver ? D.shiver * 1.5 * vnoise(t * 53 + sd + 4) : 0;
  if (D.shiver) o.shake = (o.shake || 0) + D.shiver * 1.4;
  return o;
};

// ================================================================== mittens and boots reach the hands and shoes through ONE wrapper of the global drawChar (the engine draws white gloves and the kind's own shoes):
// for a character carrying o.w20, V2.grad's glove gradient and KINDS[kind].shoe / shoe2 are swapped for the duration of that one call and restored in `finally`. Any other character passes straight through.
if (!window.__A20_DC && typeof window.drawChar === 'function') {
  window.__A20_DC = true;
  const dc0 = window.drawChar;
  window.drawChar = function (o) {
    const g = o && o.w20;
    if (!g || !((g.mittens && g.mitten) || (g.boots && g.boot))) return dc0.apply(this, arguments);
    const k = KINDS[o.kind], s1 = k && k.shoe, s2 = k && k.shoe2, vg = V2.grad;
    if (k && g.boots && g.boot) { k.shoe = g.boot; k.shoe2 = g.bootSole || '#e8e0d0'; }
    if (g.mittens && g.mitten) {
      const c1 = mixc(g.mitten, '#ffffff', .24), c2 = mixc(g.mitten, '#10142a', .26);
      V2.grad = function (x0, y0, x1, y1, stops) { if (y0 === -16 && y1 === 16 && x0 === 0 && x1 === 0 && stops && stops.length === 2 && stops[0][1] === '#ffffff') stops = [[0, c1], [1, c2]]; return vg(x0, y0, x1, y1, stops); };
    }
    try { return dc0.apply(this, arguments); } finally { if (k) { k.shoe = s1; k.shoe2 = s2; } V2.grad = vg; }
  };
}
// ================================================================== A20.car: a small hatchback, side view, that the plow buries (snow 0 clean .. .35 a cap .. .7 a mound .. 1 a smooth hill)
const vn = (seed, x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(rnd(seed, i), rnd(seed, i + 1), u) * 2 - 1; };   /* smooth value noise -1..1 */
const CAR_PTS = [[-246, -24], [-251, -70], [-250, -104], [-240, -122], [-218, -130], [-198, -178], [-182, -198], [-150, -206], [-60, -210], [20, -208], [60, -190], [100, -142], [118, -122], [150, -114], [210, -106], [244, -96], [256, -80], [258, -52], [254, -28]];
function catmull(pts, n = 8) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let j = 0; j < n; j++) { const u = j / n, u2 = u * u, u3 = u2 * u; out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]); } } out.push(pts[pts.length - 1]); return out; }
const CAR_OUT = catmull(CAR_PTS);
const X0 = -258, X1 = 262, XN = Math.round((X1 - X0) / 4);
const carTopTab = (() => {   /* the roofline as a table every 4 px (y of the top surface, negative up) */
  const tab = new Float32Array(XN + 1).fill(0);
  for (let i = 0; i <= XN; i++) { const x = X0 + i * 4; let best = 0; for (let j = 0; j < CAR_OUT.length - 1; j++) { const a = CAR_OUT[j], b = CAR_OUT[j + 1]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0] && a[1] < -60 && b[1] < -60 || (a[0] === b[0] && a[0] === x)) { const u = (x - a[0]) / ((b[0] - a[0]) || 1); const y = lerp(a[1], b[1], clamp(u)); if (y < best) best = y; } } tab[i] = best; }
  /* the two ends are the vertical faces: give them their corner heights so the snow cap has something to lie on */
  for (let i = 0; i <= XN; i++) if (tab[i] === 0) tab[i] = i < XN / 2 ? -100 : -88;
  return tab;
})();
const carTop = x => { const f = (x - X0) / 4, i = Math.floor(f); if (i < 0) return carTopTab[0]; if (i >= XN) return carTopTab[XN]; return lerp(carTopTab[i], carTopTab[i + 1], f - i); };
const hillTab = (() => {   /* the mound of snow that buries the car: the roofline dilated at the angle of repose (a sloped skirt reaching the ground), then rounded */
  const L = 430, n = Math.round(2 * L / 4) + 1, raw = new Float32Array(n), m = 1.05;
  const carH = x => -carTop(x) + 24;
  for (let i = 0; i < n; i++) { const x = -L + i * 4; let best = 0; for (let xp = -252; xp <= 258; xp += 6) { const v = carH(xp) - m * Math.abs(x - xp); if (v > best) best = v; } raw[i] = best; }
  let h = Float32Array.from(raw);
  for (let it = 0; it < 3; it++) { const g = new Float32Array(n), r = 10; for (let i = 0; i < n; i++) { let a = 0; for (let j = -r; j <= r; j++) { const q = i + j; a += (q >= 0 && q < n) ? h[q] : 0; } g[i] = a / (2 * r + 1); } for (let i = 0; i < n; i++) h[i] = Math.max(raw[i] * .985, g[i]); }
  return { L, h };
})();
const hillY = x => { const f = (x + hillTab.L) / 4, i = Math.floor(f); if (i < 0 || i >= hillTab.h.length - 1) return 0; return -lerp(hillTab.h[i], hillTab.h[i + 1], f - i); };
const CAR_COLORS = { red: '#d9304f', teal: '#2c8f9a', yellow: '#e8b830', grey: '#8a919c', white: '#eceff3', plum: '#7a3a68' };
A.CAR_COLORS = CAR_COLORS;
function carInfoOf(o) {
  const s = o.s ?? 1, f = o.facing || 1, X = (lx, ly) => [o.x + f * s * lx, o.y + s * ly];
  const p0 = X(-300, -276), p1 = X(300, 0);
  return { box: [Math.min(p0[0], p1[0]), p0[1], Math.max(p0[0], p1[0]), p1[1]], mirror: X(100, -134), antenna: X(-172, -250), roof: X(-60, -210), door: X(50, -112), handle: X(44, -108), front: X(258, -90), rear: X(-250, -90), hood: X(190, -108), wheelF: X(150, -40), wheelR: X(-148, -40), ground: X(0, 0) };
}
A.carInfo = carInfoOf;
function carWindow(x0, x1, belt, topPad) { const pts = []; for (let x = x0; x <= x1; x += 8) pts.push([x, carTop(x) + topPad]); pts.push([x1, carTop(x1) + topPad]); const top = pts, w = new Path2D(); w.moveTo(x0, belt); top.forEach(([x, y]) => w.lineTo(x, Math.min(y, belt - 18))); w.lineTo(x1, belt); w.closePath(); return w; }
function carDraw(c, o) {
  const s = o.s ?? 1, f = o.facing || 1, snow = clamp(o.snow ?? 0), col = o.color || CAR_COLORS.red, t = o.t || 0, seed = o.seed || 7;
  const body = new Path2D(); CAR_OUT.forEach(([x, y], i) => i ? body.lineTo(x, y) : body.moveTo(x, y)); body.closePath();
  const lit = (keyX() * f) < 0 ? -1 : 1;   /* the side of the key light in the car's own frame (-1 left, 1 right; the car may be mirrored) */
  c.save(); c.translate(o.x, o.y); c.scale(f * s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  /* contact shadow */
  c.fillStyle = 'rgba(8,14,40,.30)'; c.beginPath(); c.ellipse(0, 3, 276, 17, 0, 0, TAU); c.fill();
  /* the body */
  c.fillStyle = V2.grad(0, -210, 0, -22, [[0, mixc(col, '#ffffff', .3)], [.45, col], [1, mixc(col, '#10142a', .4)]]); c.fill(body);
  c.save(); c.clip(body);
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 5; c.beginPath(); c.moveTo(-232, -118); c.quadraticCurveTo(0, -128, 236, -112); c.stroke();
  c.fillStyle = 'rgba(10,14,40,.2)'; c.beginPath(); c.moveTo(-260, -60); c.lineTo(260, -60); c.lineTo(260, 0); c.lineTo(-260, 0); c.closePath(); c.fill();
  c.fillStyle = 'rgba(30,26,40,.82)'; c.fillRect(-260, -38, 520, 16);   /* the plastic sill */
  c.fillStyle = V2.grad(-260, 0, 260, 0, [[0, `rgba(255,255,255,${lit < 0 ? .22 : 0})`], [.5, 'rgba(255,255,255,0)'], [1, `rgba(255,255,255,${lit < 0 ? 0 : .22})`]]); c.fillRect(-260, -214, 520, 200);
  c.restore();
  /* the glass: two side windows and the hatch */
  const wA = carWindow(-186, -34, -126, 14), wB = carWindow(-10, 100, -126, 14);
  for (const w of [wA, wB]) {
    c.fillStyle = V2.grad(0, -200, 0, -126, [[0, '#8fb3d3'], [.6, '#4d6d90'], [1, '#2d4666']]); c.fill(w);
    c.save(); c.clip(w); c.fillStyle = 'rgba(255,255,255,.34)'; c.beginPath(); c.moveTo(-90, -210); c.lineTo(-62, -210); c.lineTo(-100, -120); c.lineTo(-128, -120); c.closePath(); c.fill(); c.beginPath(); c.moveTo(20, -210); c.lineTo(34, -210); c.lineTo(6, -120); c.lineTo(-8, -120); c.closePath(); c.fill(); c.restore();
    c.strokeStyle = OUT; c.lineWidth = 4; c.stroke(w);
  }
  /* seams, handles, the character line */
  c.strokeStyle = 'rgba(25,10,20,.55)'; c.lineWidth = 2.6; for (const x of [-204, -22, 112]) { c.beginPath(); c.moveTo(x, -124); c.lineTo(x + (x === 112 ? 4 : 0), -40); c.stroke(); }
  for (const x of [-62, 40]) { c.fillStyle = mixc(col, '#ffffff', .35); c.strokeStyle = OUT; c.lineWidth = 2.6; c.beginPath(); c.roundRect(x - 13, -112, 26, 7, 3.5); c.fill(); c.stroke(); }
  /* lamps */
  c.fillStyle = '#fff4c8'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.roundRect(226, -112, 30, 18, 7); c.fill(); c.stroke();
  c.fillStyle = '#d6242c'; c.beginPath(); c.roundRect(-256, -120, 12, 30, 5); c.fill(); c.stroke();
  c.fillStyle = 'rgba(30,26,40,.9)'; c.beginPath(); c.roundRect(236, -62, 24, 18, 4); c.fill(); c.beginPath(); c.roundRect(-258, -62, 20, 18, 4); c.fill();
  c.strokeStyle = OUT; c.lineWidth = 5; c.stroke(body);
  /* wheels */
  for (const wx of [-148, 150]) {
    c.fillStyle = '#15111a'; c.beginPath(); c.ellipse(wx, -40, 50, 50, 0, PI, TAU); c.lineTo(wx + 50, -20); c.lineTo(wx - 50, -20); c.closePath(); c.fill();
    c.fillStyle = '#1d1a22'; c.strokeStyle = OUT; c.lineWidth = 3.4; c.beginPath(); c.arc(wx, -38, 39, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = V2.radial(wx - 6, -44, 2, 26, [[0, '#f1f4f8'], [1, '#8d96a4']]); c.beginPath(); c.arc(wx, -38, 24, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(40,46,60,.7)'; c.lineWidth = 3.4; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .3; c.beginPath(); c.moveTo(wx + dcos(a) * 6, -38 + dsin(a) * 6); c.lineTo(wx + dcos(a) * 22, -38 + dsin(a) * 22); c.stroke(); }
    c.fillStyle = '#55606f'; c.beginPath(); c.arc(wx, -38, 6, 0, TAU); c.fill();
  }
  /* the snow */
  const k1 = sm(.3, .95, snow), kb = sm(.34, .86, snow), cap = 13 * sm(0, .35, snow) * (1 + .25 * sm(.35, .7, snow)), ext = 120 * sm(.5, 1, snow);
  if (snow > .02) {
    const xa = -252 - ext, xb = 258 + ext, N = Math.round((xb - xa) / 6), top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const x = xa + i * 6, edge = Math.min(1, Math.min(x - xa, xb - x) / 22), lump = vn(seed, x / 34) * (4.5 * (1 - k1) + 1.2) * sm(0, .15, snow);
      const cTop = (x >= -252 && x <= 258 ? carTop(x) : 0) - cap * edge, hTop = hillY(x);
      const inCar = x >= -252 && x <= 258, edgeE = Math.min(1, Math.min(x - xa, xb - x) / 40);
      let yT = inCar ? lerp(cTop, Math.min(hTop, cTop), k1) : lerp(0, hTop, k1) * sm(0, 1, edgeE);
      yT = Math.min(0, yT + lump);
      const cBot = (x >= -252 && x <= 258 ? carTop(x) + 9 : -4), yBotG = -26 + 26 * sm(.86, 1, snow), yBot = lerp(cBot, yBotG, kb);
      top.push([x, yT]); bot.push([x, Math.max(yT + 3, yBot + vn(seed + 3, x / 22) * 3 * kb)]);
    }
    c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = N; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath();
    const topY = Math.min(...top.map(p => p[1]));
    c.fillStyle = V2.grad(0, topY, 0, 0, [[0, '#f8fbff'], [.5, '#e4edf9'], [1, '#b8c8e4']]); c.fill();
    c.save(); c.clip();
    c.fillStyle = V2.grad(-330, 0, 330, 0, [[0, `rgba(120,146,196,${lit < 0 ? 0 : .4})`], [.5, 'rgba(120,146,196,0)'], [1, `rgba(120,146,196,${lit < 0 ? .4 : 0})`]]); c.fillRect(-480, topY - 10, 960, -topY + 12);
    c.strokeStyle = 'rgba(120,146,196,.55)'; c.lineWidth = 9; c.beginPath(); bot.forEach(([x, y], i) => i ? c.lineTo(x, y - 4) : c.moveTo(x, y - 4)); c.stroke();   /* the blue shadow under the lip of the cap */
    c.restore();
    c.strokeStyle = 'rgba(70,92,150,.55)'; c.lineWidth = 3; c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(x, y + 2.5) : c.moveTo(x, y + 2.5)); c.stroke();
    c.strokeStyle = 'rgba(80,100,160,.35)'; c.lineWidth = 2.4; c.beginPath(); bot.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) { const x = xa + 20 + rnd(seed + 9, i) * (xb - xa - 40), y = (carTop(clamp(x, -250, 256)) + hillY(x)) / 2 * (.3 + .7 * k1) - 4 * (1 - k1) - 6; if (snow < .3) continue; const tw = .5 + .5 * dsin(t * 2.2 + i * 1.9); c.globalAlpha = .55 * tw; c.beginPath(); c.arc(x, Math.min(-10, y), 2 + rnd(seed, i) * 1.4, 0, TAU); c.fill(); } c.globalAlpha = 1;
  }
  /* the mirror and the antenna stay on top of the snow: at the hill stage they are all that shows of the car */
  const bury = sm(.5, 1, snow);
  { const mx = 100, my = -132 + 6 * bury, w = 30, h = 19;
    c.fillStyle = V2.grad(0, my - h / 2, 0, my + h / 2, [[0, mixc(col, '#ffffff', .25)], [1, mixc(col, '#10142a', .3)]]); c.strokeStyle = OUT; c.lineWidth = 3.6; c.beginPath(); c.roundRect(mx - w / 2, my - h / 2, w, h, 7); c.fill(); c.stroke();
    c.fillStyle = 'rgba(180,210,236,.8)'; c.beginPath(); c.roundRect(mx - w / 2 + 14, my - h / 2 + 3, 12, h - 6, 4); c.fill();
    c.strokeStyle = OUT; c.lineWidth = 3.4; c.beginPath(); c.moveTo(mx - 6, my + h / 2 - 1); c.lineTo(mx - 14, my + h / 2 + 7); c.stroke();
    if (snow > .3) { c.fillStyle = '#f7fbff'; c.beginPath(); c.ellipse(mx - 2, my - h / 2 + 1, 15, 5, 0, PI, TAU); c.fill(); c.strokeStyle = 'rgba(120,146,196,.8)'; c.lineWidth = 2; c.stroke(); } }
  { const ax = -172, ay = (snow > .6 ? Math.min(carTop(ax) , hillY(ax)) : carTop(ax)) + 4, ah = 52 + 18 * bury, sw = dsin(t * 1.7 + seed) * 1.6 * (.4 + bury);
    c.strokeStyle = OUT; c.lineWidth = 5; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(ax - 2 + sw * .4, ay - ah * .5, ax - 5 + sw, ay - ah); c.stroke();
    c.strokeStyle = '#c9d0dc'; c.lineWidth = 2.4; c.stroke(); c.fillStyle = '#d6242c'; c.strokeStyle = OUT; c.lineWidth = 2.6; c.beginPath(); c.arc(ax - 5 + sw, ay - ah, 5, 0, TAU); c.fill(); c.stroke(); }
  c.restore();
}
A.car = (c, o = {}) => {
  o = Object.assign({ x: 0, y: 0, s: 1, facing: 1, snow: 0, t: tOf(o) }, o);
  const info = carInfoOf(o), f = o.facing, s = o.s;
  if (o.lights && (o.snow ?? 0) < .6) {   /* headlights: a warm lamp and a beam in the falling snow (the weather kit's beam when it exists) */
    const L = [o.x + f * s * 250, o.y - s * 100];
    if (window.SN20 && typeof SN20.beam === 'function') SN20.beam(c, { x: L[0], y: L[1], ang: f > 0 ? .03 : PI - .03, spread: .5, len: 560 * s, color: '#fff2c4', alpha: .5, t: o.t, seed: (o.seed || 7) + 1 });
    else if (window.FX18 && FX18.cone) FX18.cone(c, { x: L[0], y: L[1], ang: f > 0 ? .03 : PI - .03, spread: .5, len: 560 * s, color: '#fff2c4', alpha: .45, soft: .8 });
  }
  carDraw(c, o);
  if (o.lights && (o.snow ?? 0) < .6 && window.FX18 && FX18.glow) FX18.glow(c, { x: o.x + f * s * 244, y: o.y - s * 103, r: 46 * s, color: '#fff3c8', alpha: .8, core: .7 });
  return info.box;
};
// ================================================================== A20.plowTruck: a pickup with a plow blade and an amber beacon, side view (facing +1 = to the right)
function capOver(c, pts, thick, seed, k = 1) {   /* snow lying on a polyline (a roof, a hood, a bed rail): lumpy top, a soft blue underside, thinner at both ends */
  if (thick <= .5) return;
  const n = pts.length, top = [], bot = [];
  for (let i = 0; i < n; i++) { const e = Math.min(1, Math.min(i, n - 1 - i) / 2), th = thick * e * (1 + .28 * vn(seed, pts[i][0] / 30)); top.push([pts[i][0], pts[i][1] - th]); bot.push([pts[i][0], pts[i][1] + 2.5]); }
  c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = n - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath();
  c.fillStyle = V2.grad(0, Math.min(...top.map(p => p[1])), 0, Math.max(...bot.map(p => p[1])), [[0, '#f9fcff'], [.6, '#e3ecf8'], [1, '#b4c4e2']]); c.fill();
  c.strokeStyle = 'rgba(90,112,168,.6)'; c.lineWidth = 2.4; c.stroke();
}
const TRUCK_CAB = [-100, -312, 44, -196];
const TRUCK_BODY = (() => {   /* the body outline: straight runs with rounded corners (a spline overshoots the cab's square corners) */
  const p = new Path2D();
  p.moveTo(-384, -38); p.lineTo(-388, -176); p.quadraticCurveTo(-388, -190, -374, -190); p.lineTo(-152, -190); p.lineTo(-150, -292); p.quadraticCurveTo(-150, -328, -124, -329);
  p.lineTo(8, -333); p.quadraticCurveTo(24, -333, 32, -318); p.lineTo(98, -224); p.quadraticCurveTo(106, -210, 124, -209); p.lineTo(300, -201); p.quadraticCurveTo(338, -198, 345, -160); p.lineTo(347, -92); p.quadraticCurveTo(347, -44, 330, -38);
  p.closePath(); return p;
})();
function truckInfoOf(o) {
  const s = o.s ?? 1, f = o.facing || 1, X = (lx, ly) => [o.x + f * s * lx, o.y + s * ly], bl = o.blade ?? .14, bx = 456, by = 0;
  const cabA = X(TRUCK_CAB[0], TRUCK_CAB[1]), cabB = X(TRUCK_CAB[2], TRUCK_CAB[3]), p0 = X(-400, -372), p1 = X(520, 0);
  const lip = [bx + dsin(bl) * 142 + 18, by - dcos(bl) * 142];
  return { box: [Math.min(p0[0], p1[0]), p0[1], Math.max(p0[0], p1[0]), p1[1]], cab: [Math.min(cabA[0], cabB[0]), Math.min(cabA[1], cabB[1]), Math.max(cabA[0], cabB[0]), Math.max(cabA[1], cabB[1])], blade: X(lip[0] + 10, lip[1] + 10), bladeTip: X(bx + 14, -4), exhaust: X(-136, -392), beacon: X(-60, -352), headlight: X(340, -140), door: X(10, -190) };
}
A.truckInfo = truckInfoOf;
function truckDraw(c, o) {
  const s = o.s ?? 1, f = o.facing || 1, t = o.t || 0, col = o.color || '#3d5f92', bl = o.blade ?? .14, load = clamp(o.load ?? 0), snow = clamp(o.snow ?? .25), seed = o.seed || 11, lit = (keyX() * f) < 0 ? -1 : 1;
  c.save(); c.translate(o.x, o.y); c.scale(f * s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(8,14,40,.32)'; c.beginPath(); c.ellipse(20, 4, 430, 20, 0, 0, TAU); c.fill();
  /* the plow: push frame, hydraulic ram, then (after the body) the blade */
  c.strokeStyle = OUT; c.lineWidth = 17; c.beginPath(); c.moveTo(322, -74); c.lineTo(446, -50); c.stroke(); c.beginPath(); c.moveTo(322, -48); c.lineTo(446, -34); c.stroke();
  c.strokeStyle = '#59627a'; c.lineWidth = 9; c.beginPath(); c.moveTo(322, -74); c.lineTo(446, -50); c.stroke(); c.beginPath(); c.moveTo(322, -48); c.lineTo(446, -34); c.stroke();
  c.strokeStyle = OUT; c.lineWidth = 11; c.beginPath(); c.moveTo(330, -150); c.lineTo(450, -96 - bl * 70); c.stroke(); c.strokeStyle = '#c3cad6'; c.lineWidth = 5; c.stroke();
  /* the body */
  const body = TRUCK_BODY;
  c.fillStyle = V2.grad(0, -332, 0, -38, [[0, mixc(col, '#ffffff', .24)], [.5, col], [1, mixc(col, '#10142a', .42)]]); c.fill(body);
  c.save(); c.clip(body);
  c.fillStyle = 'rgba(10,14,40,.22)'; c.fillRect(-400, -78, 760, 60);
  c.fillStyle = 'rgba(30,26,40,.85)'; c.fillRect(-400, -52, 760, 14);
  c.strokeStyle = 'rgba(255,255,255,.34)'; c.lineWidth = 5; c.beginPath(); c.moveTo(-376, -176); c.lineTo(-156, -176); c.moveTo(-146, -196); c.quadraticCurveTo(20, -208, 326, -190); c.stroke();
  c.fillStyle = V2.grad(-400, 0, 400, 0, [[0, `rgba(255,255,255,${lit < 0 ? .2 : 0})`], [.5, 'rgba(255,255,255,0)'], [1, `rgba(255,255,255,${lit < 0 ? 0 : .2})`]]); c.fillRect(-400, -340, 800, 320);
  /* the bed: a darker inside rim, ribs and the tailgate seam */
  c.fillStyle = 'rgba(10,14,40,.3)'; c.fillRect(-388, -190, 238, 12); c.strokeStyle = 'rgba(10,14,40,.4)'; c.lineWidth = 3; for (let x = -340; x < -160; x += 48) { c.beginPath(); c.moveTo(x, -170); c.lineTo(x, -90); c.stroke(); }
  c.restore();
  /* the exhaust stack behind the cab */
  c.fillStyle = V2.grad(-148, 0, -124, 0, [[0, '#e3e8f0'], [.5, '#a2abba'], [1, '#6a7384']]); c.strokeStyle = OUT; c.lineWidth = 3.6; c.beginPath(); c.roundRect(-150, -384, 18, 196, 6); c.fill(); c.stroke();
  c.fillStyle = '#1b1822'; c.beginPath(); c.ellipse(-141, -384, 9, 4, 0, 0, TAU); c.fill();
  /* the cab window: an empty, dim interior for the driver (the scene draws him through the clip), the windshield glass with its wiper at the front edge */
  const [wx0, wy0, wx1, wy1] = TRUCK_CAB, wp = new Path2D(); wp.moveTo(wx0, wy1); wp.lineTo(wx0 + 8, wy0 + 8); wp.quadraticCurveTo(wx0 + 12, wy0, wx0 + 26, wy0); wp.lineTo(wx1 - 12, wy0); wp.lineTo(wx1 + 10, wy1); wp.closePath();
  c.save(); c.fillStyle = V2.grad(0, wy0, 0, wy1, [[0, '#3c3a52'], [1, '#1f1c2e']]); c.fill(wp); c.clip(wp);
  if (o.cab !== false) {   /* inside: the far seat back, the dash edge and the windshield seen at a slant with a wiper sweeping across it */
    c.fillStyle = '#2a2638'; c.fillRect(wx0, wy1 - 34, wx1 - wx0, 34);
    c.fillStyle = V2.grad(wx1 - 34, 0, wx1 + 14, 0, [[0, 'rgba(170,200,226,.06)'], [1, 'rgba(170,200,226,.5)']]); c.fillRect(wx1 - 34, wy0, 50, wy1 - wy0);
    const sw = dsin(t * 4.4 + 1) * .62, px = wx1 - 4, py = wy1 - 6; c.strokeStyle = 'rgba(12,10,18,.9)'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(px, py); c.lineTo(px - dsin(sw + .5) * 58, py - dcos(sw + .5) * 58); c.stroke();
  }
  c.restore();
  c.strokeStyle = OUT; c.lineWidth = 4.4; c.stroke(wp);
  c.strokeStyle = mixc(col, '#10142a', .5); c.lineWidth = 7; c.beginPath(); c.moveTo(wx0 - 5, wy0 - 1); c.lineTo(wx0 - 5, wy1 + 3); c.stroke();
  /* door seams, handle, the big tow mirror, a fuel cap */
  c.strokeStyle = 'rgba(25,10,20,.6)'; c.lineWidth = 2.8; c.beginPath(); c.moveTo(-148, -296); c.lineTo(-148, -44); c.moveTo(60, -272); c.lineTo(62, -44); c.stroke();
  c.fillStyle = mixc(col, '#ffffff', .35); c.strokeStyle = OUT; c.lineWidth = 2.8; c.beginPath(); c.roundRect(-16, -180, 40, 9, 4); c.fill(); c.stroke();
  c.fillStyle = '#1f1c2a'; c.strokeStyle = OUT; c.lineWidth = 3.4; c.beginPath(); c.roundRect(60, -290, 22, 50, 6); c.fill(); c.stroke(); c.strokeStyle = '#59627a'; c.lineWidth = 4; c.beginPath(); c.moveTo(52, -262); c.lineTo(62, -262); c.stroke();
  /* lamps and the grille bumper */
  c.fillStyle = '#fff4c8'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.roundRect(322, -178, 24, 36, 7); c.fill(); c.stroke();
  c.fillStyle = '#d6242c'; c.beginPath(); c.roundRect(-392, -178, 12, 38, 5); c.fill(); c.stroke();
  c.fillStyle = '#2a2d3a'; c.strokeStyle = OUT; c.lineWidth = 3.6; c.beginPath(); c.roundRect(324, -128, 32, 66, 8); c.fill(); c.stroke();
  c.strokeStyle = '#59627a'; c.lineWidth = 3; for (let y = -118; y < -70; y += 14) { c.beginPath(); c.moveTo(330, y); c.lineTo(350, y); c.stroke(); }
  c.strokeStyle = OUT; c.lineWidth = 5; c.stroke(body);
  /* wheels (big tires with chunky tread; o.wheelRot spins them) */
  const wr = o.wheelRot || 0;
  for (const wx of [-250, 215]) {
    c.fillStyle = '#15111a'; c.beginPath(); c.ellipse(wx, -62, 74, 74, 0, PI, TAU); c.lineTo(wx + 74, -30); c.lineTo(wx - 74, -30); c.closePath(); c.fill();
    c.fillStyle = '#1d1a22'; c.strokeStyle = OUT; c.lineWidth = 3.6; c.beginPath(); c.arc(wx, -58, 58, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(70,76,92,.9)'; c.lineWidth = 6; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + wr; c.beginPath(); c.moveTo(wx + dcos(a) * 50, -58 + dsin(a) * 50); c.lineTo(wx + dcos(a) * 57, -58 + dsin(a) * 57); c.stroke(); }
    c.fillStyle = V2.radial(wx - 6, -64, 2, 34, [[0, '#eef2f7'], [1, '#8691a2']]); c.strokeStyle = OUT; c.lineWidth = 3.4; c.beginPath(); c.arc(wx, -58, 31, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(40,46,60,.7)'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + wr; c.beginPath(); c.moveTo(wx + dcos(a) * 8, -58 + dsin(a) * 8); c.lineTo(wx + dcos(a) * 28, -58 + dsin(a) * 28); c.stroke(); }
    c.fillStyle = '#55606f'; c.beginPath(); c.arc(wx, -58, 8, 0, TAU); c.fill();
  }
  /* snow on the roof, the hood and the bed rail */
  if (snow > .02) { const roof = [], hood = [], bed = []; for (let x = -128; x <= 14; x += 16) roof.push([x, x < -110 ? -318 : -330]); for (let x = 108; x <= 330; x += 24) hood.push([x, lerp(-214, -190, (x - 108) / 222)]); for (let x = -380; x <= -154; x += 20) bed.push([x, -188]); capOver(c, roof, 15 * snow, seed); capOver(c, hood, 11 * snow, seed + 3); capOver(c, bed, 14 * snow, seed + 5); }
  /* the blade: a curved yellow moldboard hinged at the cutting edge, leaning by `bl` */
  c.save(); c.translate(456, 0); c.rotate(bl); c.scale(1.16, 1.16);
  const bp = new Path2D(); bp.moveTo(-14, 0); bp.lineTo(-18, -64); bp.quadraticCurveTo(-20, -112, -8, -124); bp.lineTo(14, -124); bp.quadraticCurveTo(34, -122, 38, -100); bp.quadraticCurveTo(10, -90, 8, -60); bp.quadraticCurveTo(10, -20, 22, 0); bp.closePath();
  c.fillStyle = V2.grad(-20, 0, 40, 0, lit < 0 ? [[0, '#ffd75a'], [.5, '#f0b01a'], [1, '#b87a08']] : [[0, '#b87a08'], [.5, '#f0b01a'], [1, '#ffd75a']]); c.fill(bp); c.strokeStyle = OUT; c.lineWidth = 4.4; c.stroke(bp);
  c.save(); c.clip(bp); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-2, -116); c.quadraticCurveTo(-8, -70, 2, -16); c.stroke(); c.restore();
  c.fillStyle = '#2a2d3a'; c.strokeStyle = OUT; c.lineWidth = 3.4; c.beginPath(); c.roundRect(-18, -14, 44, 14, 3); c.fill(); c.stroke();
  c.fillStyle = '#f0b01a'; c.beginPath(); c.moveTo(-8, -13); c.lineTo(4, -13); c.lineTo(-4, -1); c.lineTo(-16, -1); c.closePath(); c.fill(); c.beginPath(); c.moveTo(16, -13); c.lineTo(26, -13); c.lineTo(20, -1); c.lineTo(8, -1); c.closePath(); c.fill();
  c.restore();
  /* the heap of snow in front of the blade */
  if (load > .02) {
    const w = 40 + 120 * load, h = 18 + 92 * load, bx = 466, pts = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14, x = bx + u * w, y = -h * Math.pow(dsin(PI * Math.pow(u, .8)), .8) * (1 + .1 * vn(seed + 9, u * 5)); pts.push([x, y]); }
    c.beginPath(); c.moveTo(bx - 14, 0); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(bx + w + 20, 0); c.closePath();
    c.fillStyle = V2.grad(0, -h, 0, 0, [[0, '#f9fcff'], [.6, '#dfe9f6'], [1, '#aabbdc']]); c.fill(); c.strokeStyle = 'rgba(90,112,168,.55)'; c.lineWidth = 2.6; c.stroke();
  }
  /* the beacon on the cab roof: a housing and an amber dome whose glow swells slowly (a swell about every 2.2 s, never a strobe) */
  if (o.beacon !== false) {
    const ph = ((t / 2.2) % 1 + 1) % 1, sw = .5 + .5 * dcos(ph * TAU), on = o.beaconOn ?? 1;
    c.fillStyle = '#2a2d3a'; c.strokeStyle = OUT; c.lineWidth = 3.4; c.beginPath(); c.roundRect(-80, -344, 40, 14, 3); c.fill(); c.stroke();
    c.fillStyle = V2.radial(-62, -360, 1, 24, [[0, mixc('#ffe8a0', '#ffffff', sw * .5)], [.5, '#ffb21c'], [1, '#c56a08']]); c.beginPath(); c.moveTo(-76, -344); c.quadraticCurveTo(-76, -372, -60, -372); c.quadraticCurveTo(-44, -372, -44, -344); c.closePath(); c.fill(); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = V2.radial(-60, -358, 2, 120, [[0, `rgba(255,178,40,${(.35 + .5 * sw) * on})`], [.4, `rgba(255,150,30,${(.14 + .2 * sw) * on})`], [1, 'rgba(255,140,20,0)']]); c.beginPath(); c.arc(-60, -358, 120, 0, TAU); c.fill(); c.restore();
  }
  c.restore();
}
A.plowTruck = (c, o = {}) => {
  o = Object.assign({ x: 0, y: 0, s: 1, facing: 1, blade: .14, load: 0, beacon: true, headlights: true, cab: true, t: tOf(o) }, o);
  const info = truckInfoOf(o), f = o.facing, s = o.s;
  if (o.headlights && o.lamp !== false) {   /* the headlight beam in the falling snow (the weather kit's beam when it exists) */
    const L = [o.x + f * s * 346, o.y - s * 160];
    if (window.SN20 && typeof SN20.beam === 'function') SN20.beam(c, { x: L[0], y: L[1], ang: f > 0 ? .06 : PI - .06, spread: .55, len: 700 * s, color: '#fff2c4', alpha: .55, t: o.t, seed: (o.seed || 11) + 2 });
    else if (window.FX18 && FX18.cone) FX18.cone(c, { x: L[0], y: L[1], ang: f > 0 ? .06 : PI - .06, spread: .55, len: 700 * s, color: '#fff2c4', alpha: .5, soft: .8 });
  }
  truckDraw(c, o);
  if (o.headlights && window.FX18 && FX18.glow) FX18.glow(c, { x: o.x + f * s * 336, y: o.y - s * 160, r: 60 * s, color: '#fff3c8', alpha: .85, core: .7 });
  return info;
};
A.truck = A.plowTruck;
/* clip to the cab window's real outline (rounded top-left corner, slanted windshield edge) in world units: A20.cabClip(ctx, { x, y, s, facing }) then ctx.save() before / ctx.restore() after the driver */
A.cabClip = (c, o = {}) => {
  const s = o.s ?? 1, f = o.facing || 1, X = (lx, ly) => [o.x + f * s * lx, o.y + s * ly], [x0, y0, x1, y1] = TRUCK_CAB, P = [X(x0, y1), X(x0 + 8, y0 + 8), X(x0 + 26, y0), X(x1 - 12, y0), X(x1 + 10, y1)];
  c.beginPath(); c.moveTo(...P[0]); c.lineTo(...P[1]); c.quadraticCurveTo(...X(x0 + 12, y0), ...P[2]); c.lineTo(...P[3]); c.lineTo(...P[4]); c.closePath(); c.clip();
};
/* the glass of the cab window drawn AFTER the driver: a sheen, a few streaks, a sliver of snow on the sill */
A.cabGlass = (c, o = {}) => {
  const s = o.s ?? 1, f = o.facing || 1, t = o.t || 0;
  c.save(); c.translate(o.x, o.y); c.scale(f * s, s);
  const [x0, y0, x1, y1] = TRUCK_CAB;
  c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
  c.fillStyle = 'rgba(190,214,236,.13)'; c.beginPath(); c.moveTo(x0 + 16, y0); c.lineTo(x0 + 46, y0); c.lineTo(x0 + 8, y1); c.lineTo(x0 - 22, y1); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x0 + 70, y0); c.lineTo(x0 + 80, y0); c.lineTo(x0 + 42, y1); c.lineTo(x0 + 32, y1); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(200,222,240,.35)'; c.lineWidth = 1.6; for (let i = 0; i < 6; i++) { const x = x0 + 14 + rnd(41, i) * (x1 - x0 - 28), y = y0 + 10 + ((rnd(43, i) * 80 + t * (4 + 2 * i)) % (y1 - y0 - 30)); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y + 10); c.stroke(); }
  c.restore();
  c.fillStyle = V2.grad(0, y1 - 8, 0, y1 + 4, [[0, '#f4f8ff'], [1, '#b8c8e4']]); c.beginPath(); c.moveTo(x0 - 4, y1 + 3); c.quadraticCurveTo((x0 + x1) / 2, y1 - 11, x1 + 12, y1 + 3); c.closePath(); c.fill();
  c.restore();
};
// ================================================================== two new kinds: `eggplant` (EGGPLANT, the 11-to-7 nurse) and `turnip` (TURNIP, the plow driver)
Object.assign(KINDS, {
  eggplant: { rx: 100, ry: 134, shape: 'eggplant', tex: 'eggplant', c: ['#a874c8', '#55267d', '#1f0c33'], eyeY: -20, eyeX: 33, mouthY: 22, er: 20, mw: 22, leg: 76, hip: 34, arm1: 54, arm2: 50, shoe: '#2e2140', shoe2: '#8a64ad' },
  turnip: { rx: 106, ry: 100, shape: 'turnip', tex: 'turnip', c: ['#fdf8ff', '#ece0f6', '#b8a0cf'], eyeY: -32, eyeX: 36, mouthY: 6, er: 21, mw: 22, leg: 84, hip: 36, arm1: 56, arm2: 52, shoe: '#4a3a2a', shoe2: '#cfc4ae' },
});
Object.assign(TOPS, { eggplant: 200, turnip: 238 });
Object.assign(EXPR, {
  egg_stuck: { ang: -.34, raise: 5, curve: -.1, lid: .3, wide: 1, pup: .95, bags: true },     /* tired, patient, a little worried: "I am stuck." */
  egg_calm: { ang: -.1, raise: 2, curve: .5, lid: .42, wide: 1, pup: 1, bags: true },        /* settled: "Spring." */
  egg_cosy: { ang: -.04, raise: 3, curve: .95, lid: .5, wide: 1, pup: 1, bags: true },       /* happy, chewing */
  turnip_flat: { ang: .05, raise: -5, curve: 0, lid: .38, wide: .94, pup: .78 },             /* unbothered */
  turnip_deadpan: { ang: .1, raise: -7, curve: -.05, lid: .5, wide: .92, pup: .72 },          /* a plow driver explaining the plow */
  turnip_proud: { ang: -.04, raise: 1, curve: .28, lid: .3, wide: 1, pup: .85 },             /* a very small pride */
});
EXT.shape.eggplant = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(0, -ry);
  p.bezierCurveTo(rx * .38, -ry, rx * .66, -ry * .6, rx * .9, -ry * .12);
  p.bezierCurveTo(rx * 1.08, ry * .36, rx * .84, ry * 1.0, 0, ry);
  p.bezierCurveTo(-rx * .84, ry * 1.0, -rx * 1.08, ry * .36, -rx * .9, -ry * .12);
  p.bezierCurveTo(-rx * .66, -ry * .6, -rx * .38, -ry, 0, -ry);
};
EXT.shape.turnip = (p, k) => {
  const { rx, ry } = k;
  p.moveTo(0, -ry * .98);
  p.bezierCurveTo(rx * .62, -ry * 1.02, rx * 1.04, -ry * .56, rx * 1.0, ry * .04);
  p.bezierCurveTo(rx * .96, ry * .62, rx * .52, ry * 1.0, 0, ry * 1.02);
  p.bezierCurveTo(-rx * .52, ry * 1.0, -rx * .96, ry * .62, -rx * 1.0, ry * .04);
  p.bezierCurveTo(-rx * 1.04, -ry * .56, -rx * .62, -ry * 1.02, 0, -ry * .98);
};
EXT.tex.eggplant = (o, k, t) => {   /* a glossy skin: a long window highlight down the lit side, a soft dark belly, faint vertical sheen */
  const { rx, ry } = k, lit = keyX() < 0 ? -1 : 1;
  ctx.fillStyle = V2.grad(0, -ry, 0, ry, [[0, 'rgba(210,170,240,.22)'], [.45, 'rgba(210,170,240,0)'], [1, 'rgba(10,0,20,.34)']]); ctx.fillRect(-rx * 1.2, -ry * 1.1, rx * 2.4, ry * 2.2);
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * rx * .34, -ry * .8); ctx.bezierCurveTo(i * rx * .5, -ry * .1, i * rx * .52, ry * .5, i * rx * .3, ry * .95); ctx.stroke(); }
  ctx.save(); ctx.translate(lit * rx * .66, -ry * .18); ctx.rotate(-lit * .16);
  ctx.fillStyle = 'rgba(255,255,255,.46)'; ctx.beginPath(); ctx.ellipse(0, 0, rx * .075, ry * .36, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(lit * rx * .05, ry * .46, rx * .035, ry * .09, 0, 0, TAU); ctx.fill();
  ctx.restore();
};
EXT.tex.turnip = (o, k, t) => {   /* white skin, a purple shoulder that fades down, faint ribs, a few rootlet freckles */
  const { rx, ry } = k;
  ctx.fillStyle = V2.grad(0, -ry, 0, ry * .1, [[0, 'rgba(120,52,160,1)'], [.5, 'rgba(160,84,190,.9)'], [.74, 'rgba(198,138,220,.4)'], [1, 'rgba(230,200,240,0)']]); ctx.fillRect(-rx * 1.2, -ry * 1.1, rx * 2.4, ry * 1.2);
  ctx.strokeStyle = 'rgba(120,80,150,.2)'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * rx * .3, -ry * .3); ctx.bezierCurveTo(i * rx * .46, ry * .1, i * rx * .44, ry * .5, i * rx * .2, ry * .98); ctx.stroke(); }
  ctx.fillStyle = 'rgba(110,80,60,.3)'; for (let i = 0; i < 9; i++) { const a = PI * (.25 + .5 * rnd(31, i)), r = ry * (.78 + .16 * rnd(32, i)); ctx.beginPath(); ctx.ellipse(dcos(a) * rx * .8 * (rnd(33, i) - .5) * 2, dsin(a) * r * .9, 2 + rnd(34, i) * 2, 1.6, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(110,80,60,.4)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const x = (rnd(35, i) - .5) * rx * 1.1; ctx.beginPath(); ctx.moveTo(x, ry * .96); ctx.quadraticCurveTo(x + 6, ry * 1.05, x + 2 + rnd(36, i) * 8, ry * 1.12); ctx.stroke(); }
  const lit = keyX() < 0 ? -1 : 1; ctx.fillStyle = 'rgba(255,255,255,.34)'; ctx.save(); ctx.translate(lit * rx * .58, -ry * .3); ctx.rotate(-lit * .5); ctx.beginPath(); ctx.ellipse(0, 0, rx * .06, ry * .2, 0, 0, TAU); ctx.fill(); ctx.restore();
};
function leafBlade(x, y, ang, len, w, c1, c2, lw = 3.4) {   /* a pointed leaf with a vein: base at (x, y), pointing along ang (0 = up) */
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(w, -len * .25, w * .9, -len * .72, 0, -len); ctx.bezierCurveTo(-w * .9, -len * .72, -w, -len * .25, 0, 0); ctx.closePath();
  ctx.fillStyle = V2.grad(-w, 0, w, 0, [[0, c1], [1, c2]]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = lw; ctx.stroke();
  ctx.strokeStyle = 'rgba(230,250,200,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -len * .85); ctx.stroke(); ctx.restore();
}
EXT.top.eggplant = (o, k, t, layer) => {   /* the calyx: five sepals hugging the shoulders, a short curved stalk; a beanie hides the sepals and lets the stalk poke through (fp20_hat poke) */
  if (layer !== 'front' || o.calyx === false || (o.w20 && o.w20.hat && o.w20.hat !== 'none')) return;
  const ry = k.ry, kx = keyX();
  const sep = [[-62, -ry + 34, -1.25, 44, 17], [62, -ry + 34, 1.25, 44, 17], [-34, -ry + 30, -.72, 50, 19], [34, -ry + 30, .72, 50, 19], [0, -ry + 28, 0, 52, 21]];
  ctx.save();
  for (const [x, y, a, L, w] of sep) { ctx.save(); ctx.translate(x * .62, y - 16); ctx.rotate(PI + a * .5); leafBlade(0, 0, 0, L, w, kx < 0 ? '#8bcb62' : '#4a9a3e', kx < 0 ? '#3d8a3a' : '#7cc058'); ctx.restore(); }
  ctx.restore();
  stalk(o, k, t);
};
function stalk(o, k, t) {
  const ry = k.ry, sw = dsin(t * 1.9 + (o.seed || 0)) * 1.4;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(0, -ry + 8); ctx.quadraticCurveTo(4, -ry - 22, 20 + sw, -ry - 40); ctx.stroke();
  ctx.strokeStyle = '#5da545'; ctx.lineWidth = 13; ctx.stroke(); ctx.strokeStyle = 'rgba(210,245,160,.55)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-3, -ry + 4); ctx.quadraticCurveTo(0, -ry - 24, 14 + sw, -ry - 38); ctx.stroke();
  ctx.fillStyle = '#d9e8a8'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(21 + sw, -ry - 41, 8, 5, -.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
EXT.top.turnip = (o, k, t, layer) => {   /* his leafy top (only when he is bareheaded; under the cap fp20_cap draws the tuft that pokes out) */
  if (layer !== 'front' || o.cap !== false) return;
  leafTuft(o, k, t, -k.ry * .94, 1);
};
function leafTuft(o, k, t, y, sc) {
  const sw = dsin(t * 2.1 + (o.seed || 0)) * .04, bl = [[-.95, 50, 17], [-.5, 62, 19], [-.12, 72, 20], [.3, 64, 19], [.78, 54, 18], [1.12, 40, 15]];
  ctx.save(); ctx.translate(0, y); ctx.scale(sc, sc);
  for (const [a, L, w] of bl) leafBlade(a * 8, 2, a * .62 + sw * (1 + Math.abs(a)), L, w, '#8acb5a', '#3a8a34', 3.2);
  ctx.restore();
}
// ================================================================== TURNIP's trucker cap with ear flaps (head class: mid layer) and his hi-vis vest over a work jacket (wrap class: mid layer); EGGPLANT's scrubs
function capGeo(o, k) { const yb = k.eyeY - k.er * 1.42 - 17 - (o.browUp || 0) - (o.capLift || 0); return { yb, wb: clamp(halfW(o.kind, yb - 4) + 6, 70, 106), apex: yb - 80 }; }
function capDraw(o, k, t, layer) {
  if (layer !== 'mid' || o.cap === false) return;
  const hy = yawsOf(o).h, G2 = capGeo(o, k), kx = keyX(), lightL = kx < 0, wb = G2.wb, yb = G2.yb, ap = G2.apex, base = o.capColor || '#34425e', dk = mixc(base, '#0c1024', .45), lt2 = mixc(base, '#ffffff', .22), ca = dcos(hy);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  leafTuft(o, k, t, ap + 6, 1.05);   /* his greens poke out of the crown: drawn first, the dome hides their roots */
  /* ear flaps with a fleece lining and a tie, behind the dome's lower edge */
  for (const sd of [-1, 1]) {
    const fx = sd * (wb - 6), top = yb - 14, len = 82, w = 30, sw = dsin(t * 2.4 + sd * 1.3) * 1.2;
    ctx.beginPath(); ctx.moveTo(fx - w / 2, top); ctx.lineTo(fx + w / 2, top); ctx.bezierCurveTo(fx + w / 2 + 3, top + len * .55, fx + w * .36 + sw, top + len * .92, fx + sw, top + len); ctx.bezierCurveTo(fx - w * .36 + sw, top + len * .92, fx - w / 2 - 3, top + len * .55, fx - w / 2, top); ctx.closePath();
    ctx.fillStyle = V2.grad(fx - w / 2, 0, fx + w / 2, 0, lightL ? [[0, lt2], [1, dk]] : [[0, dk], [1, lt2]]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,244,222,.96)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(fx - sd * w * .34, top + 10); ctx.quadraticCurveTo(fx - sd * w * .4, top + len * .6, fx - sd * w * .14 + sw, top + len - 5); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx + sd * 5, top + 4); ctx.lineTo(fx + sd * 5 + sw, top + len - 8); ctx.stroke();
    ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx + sw, top + len - 2); ctx.quadraticCurveTo(fx + sw + sd * 4, top + len + 12, fx + sw - sd * 2, top + len + 24); ctx.stroke();
    ctx.fillStyle = '#ff7a12'; ctx.beginPath(); ctx.arc(fx + sw - sd * 2, top + len + 26, 5, 0, TAU); ctx.fill(); ctx.stroke();
  }
  /* the dome: a stiff, slightly flat crown */
  const dome = () => { ctx.beginPath(); ctx.moveTo(-wb + 3, yb - 8); ctx.bezierCurveTo(-wb - 4, yb - 46, -wb * .62, ap + 2, -wb * .28, ap); ctx.lineTo(wb * .28, ap); ctx.bezierCurveTo(wb * .62, ap + 2, wb + 4, yb - 46, wb - 3, yb - 8); ctx.quadraticCurveTo(0, yb + 4, -wb + 3, yb - 8); ctx.closePath(); };
  dome(); ctx.fillStyle = V2.grad(-wb, 0, wb, 0, lightL ? [[0, lt2], [.4, base], [1, dk]] : [[0, dk], [.6, base], [1, lt2]]); ctx.fill();
  ctx.save(); dome(); ctx.clip();
  /* panel seams that turn with the head, the soft sheen */
  ctx.strokeStyle = 'rgba(8,12,30,.34)'; ctx.lineWidth = 2.8;
  for (const a0 of [-.62, .62, -1.25, 1.25]) { const a = a0 + hy; if (dcos(a) < .12) continue; const xb = wb * dsin(a); ctx.beginPath(); ctx.moveTo(xb, yb - 4); ctx.bezierCurveTo(xb * 1.02, yb - 44, xb * .55, ap + 8, xb * .3, ap); ctx.stroke(); }
  ctx.fillStyle = V2.radial(-kx * wb * .4, ap + 24, 2, wb * .9, [[0, 'rgba(255,255,255,.34)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-wb - 6, ap - 6, wb * 2 + 12, yb - ap + 14);
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 4.4; dome(); ctx.stroke();
  /* the patch: an orange shield with a snowflake (no lettering), centred on the front panel (it slides round with the head) */
  if (ca > .25) {
    const px = dsin(hy) * wb * .5, pw = 40 * ca, py = yb - 36;
    ctx.fillStyle = '#ff7a12'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(px - pw, py - 22); ctx.lineTo(px + pw, py - 22); ctx.lineTo(px + pw, py + 4); ctx.quadraticCurveTo(px + pw, py + 22, px, py + 26); ctx.quadraticCurveTo(px - pw, py + 22, px - pw, py + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const a = i * PI / 3; ctx.beginPath(); ctx.moveTo(px - dcos(a) * 15 * ca, py - 4 - dsin(a) * 15); ctx.lineTo(px + dcos(a) * 15 * ca, py - 4 + dsin(a) * 15); ctx.stroke(); }
  }
  /* the bill seen head on: a dark curved underside across the brow, its edge well above the brows */
  ctx.beginPath(); ctx.moveTo(-wb - 2, yb - 12); ctx.quadraticCurveTo(0, yb + 2, wb + 2, yb - 12); ctx.quadraticCurveTo(wb * .74, yb + 15, 0, yb + 17); ctx.quadraticCurveTo(-wb * .74, yb + 15, -wb - 2, yb - 12); ctx.closePath();
  ctx.fillStyle = V2.grad(0, yb - 12, 0, yb + 17, [[0, '#2b3350'], [1, '#12162a']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-wb * .6, yb + 8); ctx.quadraticCurveTo(0, yb + 14, wb * .6, yb + 8); ctx.stroke();
  ctx.restore();
}
EXT.acc.fp20_cap = (o, k, t, layer) => capDraw(o, k, t, layer);
/* garments that wrap round the body are drawn on the sphere: a front x is a longitude, the turn moves it to R sin(lon + yaw), and only the visible half (cos(lon + yaw) > 0) is drawn */
function sph(o) { const yw = yawsOf(o).y; return { yw, lo: -PI / 2 - yw, hi: PI / 2 - yw, X: (lon, R) => R * dsin(lon + yw), c: lon => dcos(lon + yw) }; }
const wrapLon = l => ((l + PI) % TAU + TAU) % TAU - PI, FULL = 2 * PI;
function ringPts(S, lonA, lonB, yFn, R, n = 18) {   /* the visible part of a ring edge: yFn(lon) -> y, R the radius there */
  const a = Math.max(lonA, S.lo), b = Math.min(lonB, S.hi), out = [];
  if (b <= a) return out;
  for (let i = 0; i <= n; i++) { const lon = lerp(a, b, i / n); out.push([S.X(lon, R), yFn(lon)]); }
  return out;
}
function fillRing(top, bot, fill, stroke, lw = 3.6, strokeEdges = true) {
  if (top.length < 2 || bot.length < 2) return;
  ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; if (strokeEdges) { ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.beginPath(); bot.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); } else { ctx.stroke(); } }
}
const shadeX = (o, W0, c0, c1, c2) => V2.grad(-W0, 0, W0, 0, keyX() < 0 ? [[0, c0], [.5, c1], [1, c2]] : [[0, c2], [.5, c1], [1, c0]]);
EXT.acc.fp20_hivis = (o, k, t, layer) => {
  if (layer !== 'mid' || o.hivis === false) return;
  const S = sph(o), ry = k.ry, y0 = k.mouthY + 55 * (k.mw || 26) / 26 + 5, y1 = ry + 8, vy = y0 + 14, R0 = halfW(o.kind, y0 + 6) + 11, R1 = halfW(o.kind, vy + 24) + 12, R2 = halfW(o.kind, y1 - 12) + 12;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const VO = '#ff6a10', VOd = '#c9470a', VOl = '#ff9a4a', W0 = 110;
  /* the work jacket's collar: a brown canvas ring round the neck with a pale fleece edge */
  { const top = ringPts(S, -FULL, FULL, lon => y0 - 3 + 10 * dcos(lon), R0), bot = ringPts(S, -FULL, FULL, lon => y0 + 20 + 8 * dcos(lon), R0 + 3);
    fillRing(top, bot, shadeX(o, W0, '#b08850', '#8b6a3e', '#5a4326'), OUT, 3.6);
    ctx.strokeStyle = 'rgba(255,240,210,.95)'; ctx.lineWidth = 6; ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y + 1) : ctx.moveTo(x, y + 1)); ctx.stroke(); }
  /* the vest: a ring from under the collar to the hem, a V at the front, side straps up over the shoulders */
  { const vTop = lon => vy - 4 + 8 * dcos(lon) + 24 * Math.max(0, 1 - Math.abs(wrapLon(lon)) / .36), top = ringPts(S, -FULL, FULL, vTop, R1, 28), bot = ringPts(S, -FULL, FULL, lon => y1 + 4, R2, 28);
    fillRing(top, bot, shadeX(o, W0, VOl, VO, VOd), OUT, 3.6);
    /* two silver reflective bands round the hem */
    for (const yy of [y1 - 24, y1 - 9]) { const bt = ringPts(S, -FULL, FULL, lon => yy, halfW(o.kind, yy) + 12, 28), bb = ringPts(S, -FULL, FULL, lon => yy + 8, halfW(o.kind, yy + 8) + 12, 28); fillRing(bt, bb, '#e8eef6', 'rgba(120,130,150,.8)', 2, true); }
    /* a short silver stripe down each side of the V (the suspender-style reflective strips) */
    for (const sd of [-1, 1]) { const a = sd * .42, bt = ringPts(S, a - .05, a + .05, lon => vy + 8, halfW(o.kind, vy + 8) + 12, 2), bb = ringPts(S, a - .05, a + .05, lon => y1 - 26, halfW(o.kind, y1 - 26) + 12, 2); fillRing(bt, bb, '#e8eef6', null); }
    if (S.c(PI) > .1) { ctx.strokeStyle = '#e8eef6'; ctx.lineWidth = 6; const xb = S.X(PI, 40); ctx.beginPath(); ctx.moveTo(xb - 26, vy + 14); ctx.lineTo(xb + 26, y1 - 26); ctx.moveTo(xb + 26, vy + 14); ctx.lineTo(xb - 26, y1 - 26); ctx.stroke(); } }
  ctx.restore();
};
EXT.acc.fp20_scrubs = (o, k, t, layer) => {
  if (layer !== 'mid' || o.scrubs === false) return;
  const S = sph(o), ry = k.ry, y0 = k.mouthY + 55 * (k.mw || 26) / 26 + 7, y1 = ry + 8, R0 = halfW(o.kind, y0 + 8) + 10, R1 = halfW(o.kind, y1 - 10) + 10, B = '#58b4d8', Bd = '#2f7ea6', Bl = '#8fd4ee';
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const top = ringPts(S, -FULL, FULL, lon => y0 + 2 * dcos(lon) + 24 * Math.max(0, 1 - Math.abs(wrapLon(lon)) / .5), R0, 28), bot = ringPts(S, -FULL, FULL, lon => y1 + 6, R1, 28);
  fillRing(top, bot, shadeX(o, 110, Bl, B, Bd), OUT, 3.6);
  const front = S.c(0);
  if (front > .15) {   /* a centre seam, a chest pocket with a pen, the lanyard from the neckline to the badge */
    const xs = S.X(0, 30);
    ctx.strokeStyle = 'rgba(10,50,80,.4)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(xs, y0 + 24); ctx.lineTo(xs, y1 + 4); ctx.stroke();
    const px = S.X(.55, R0 * .9), pw = 28 * front; ctx.fillStyle = 'rgba(10,50,80,.16)'; ctx.strokeStyle = 'rgba(10,50,80,.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.roundRect(px - pw / 2, y0 + 20, pw, 22, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2a2d3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + pw * .2, y0 + 14); ctx.lineTo(px + pw * .2, y0 + 28); ctx.stroke();
    ctx.strokeStyle = '#27a36a'; ctx.lineWidth = 6; for (const sd of [-1, 1]) { const lx = S.X(sd * 1.0, R0 + 2), lc = S.c(sd * 1.0); if (lc > .05) { ctx.beginPath(); ctx.moveTo(lx, y0 + 2); ctx.quadraticCurveTo(S.X(sd * .5, R0 * .8), y0 + 14, xs, y0 + 28); ctx.stroke(); } }
    ctx.fillStyle = '#f8f8fb'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; const bw = 28 * front; ctx.beginPath(); ctx.roundRect(xs - bw / 2, y0 + 26, bw, 36, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7e57a0'; ctx.fillRect(xs - bw / 2 + 4, y0 + 31, bw - 8, 14); ctx.fillStyle = '#c8ccd6'; ctx.fillRect(xs - bw / 2 + 4, y0 + 49, bw - 8, 3); ctx.fillRect(xs - bw / 2 + 4, y0 + 55, (bw - 8) * .6, 3);
  }
  ctx.restore();
};

// ================================================================== held props: fp20_mug (Turnip's travel mug), fp20_phone (a phone with a lit call screen), fp20_slice (a pizza slice with bites); the hand is the origin
Object.assign(PROP_BOX, { fp20_mug: Object.assign([-24, -86, 38, 22], { nearFace: true }), fp20_phone: Object.assign([-26, -72, 26, 18], { nearFace: true }), fp20_slice: Object.assign([-36, -92, 36, 14], { nearFace: true }) });
EXT.prop.fp20_mug = (side, o, t) => {   /* a tall travel mug: black body, an orange band, a steel lid with a sip hole, a D handle; o.mugTilt (radians, a sip), o.steam (0..1, default 1) */
  ctx.save(); ctx.rotate(o.mugTilt ?? 0); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const steam = o.steam ?? 1;
  if (steam > .02) { ctx.strokeStyle = `rgba(240,246,255,${.55 * steam})`; ctx.lineWidth = 5; for (let i = 0; i < 3; i++) { const ph = t * 1.4 + i * 2.1, u = ((ph % 3) + 3) % 3 / 3, x = (i - 1) * 8 + dsin(ph * 2.3) * 5 * u; ctx.globalAlpha = (1 - u) * Math.min(1, u * 5) * steam; ctx.beginPath(); ctx.moveTo(x, -82 - u * 4); ctx.quadraticCurveTo(x + 6 * dsin(ph * 3), -96 - u * 22, x - 2, -108 - u * 40); ctx.stroke(); } ctx.globalAlpha = 1; }
  ctx.strokeStyle = OUT; ctx.lineWidth = 4;
  ctx.fillStyle = '#2a2d3a'; ctx.beginPath(); ctx.moveTo(-16, -66); ctx.lineTo(16, -66); ctx.lineTo(13, 16); ctx.quadraticCurveTo(0, 21, -13, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff6a10'; ctx.beginPath(); ctx.moveTo(-15.6, -38); ctx.lineTo(15.4, -38); ctx.lineTo(14.6, -16); ctx.lineTo(-14.6, -16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-11, -62, 5, 74);
  ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(16, -52); ctx.bezierCurveTo(36, -52, 36, -14, 14, -14); ctx.stroke(); ctx.strokeStyle = '#2a2d3a'; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.fillStyle = V2.grad(-18, 0, 18, 0, [[0, '#eef2f8'], [.5, '#b4bdc9'], [1, '#7c8696']]); ctx.strokeStyle = OUT; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.roundRect(-18, -80, 36, 16, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1b1822'; ctx.beginPath(); ctx.ellipse(5, -78, 8, 3, 0, 0, TAU); ctx.fill();
  ctx.restore();
};
EXT.prop.fp20_phone = (side, o, t) => {   /* a phone seen from the front, screen lit with a call: an avatar disc, a green and a red button (no lettering); o.phoneLit 0..1, o.phoneBuzz 0..1 (a ring shake), o.phoneRot */
  const lit = clamp(o.phoneLit ?? 1), bz = clamp(o.phoneBuzz ?? 0), sh = bz * dsin(t * 46) * .07;
  ctx.save(); ctx.rotate((o.phoneRot ?? 0) + sh); ctx.translate(bz * dsin(t * 53) * 1.5, 0); ctx.lineJoin = 'round';
  if (lit > .05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = V2.radial(0, -34, 4, 74, [[0, `rgba(150,200,255,${.34 * lit})`], [1, 'rgba(150,200,255,0)']]); ctx.beginPath(); ctx.arc(0, -34, 74, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#17141f'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.roundRect(-20, -70, 40, 82, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -66, 0, 8, [[0, mixc('#1e2a46', '#a9d0ff', lit * .75)], [1, mixc('#141a2e', '#5f8fd0', lit * .7)]]); ctx.beginPath(); ctx.roundRect(-16.5, -65, 33, 72, 4); ctx.fill();
  ctx.fillStyle = `rgba(190,150,235,${.35 + .6 * lit})`; ctx.beginPath(); ctx.arc(0, -46, 9, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(190,150,235,${.25 + .5 * lit})`; ctx.beginPath(); ctx.ellipse(0, -28, 14, 7, 0, PI, TAU); ctx.fill();
  ctx.fillStyle = `rgba(80,210,120,${.4 + .6 * lit})`; ctx.beginPath(); ctx.arc(-9, -4, 6, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(235,80,80,${.4 + .6 * lit})`; ctx.beginPath(); ctx.arc(9, -4, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(-14, -63); ctx.lineTo(-2, -63); ctx.lineTo(-14, -24); ctx.closePath(); ctx.fill();
  ctx.restore();
};
function sliceShape(L, W, bite) {   /* a pizza slice outline: the wide crust end at the origin, the tip at (0, -L); bites scoop scallops out of the tip (bite 0..1) */
  const p = new Path2D(), cutY = L * (1 - .82 * bite), wAt = y => W / 2 * (1 - y / L);
  p.moveTo(-W / 2, 0); p.lineTo(W / 2, 0);
  if (bite < .03) p.lineTo(0, -L);
  else { const w = wAt(cutY), y = -cutY, n = 3; p.lineTo(w, y); for (let i = 0; i < n; i++) { const x0 = w - 2 * w * i / n, x1 = w - 2 * w * (i + 1) / n; p.quadraticCurveTo((x0 + x1) / 2, y + 11, x1, y); } }
  p.closePath(); return p;
}
EXT.prop.fp20_slice = (side, o, t) => {   /* a slice of pizza held by the crust, tip up and leaning to the face; o.bite 0..1 (how much is eaten), o.sliceRot */
  const bite = clamp(o.bite ?? 0), L = 80, W = 58, seed = 12;
  ctx.save(); ctx.rotate(o.sliceRot ?? -.3 * side); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.translate(0, 8);
  const sp = sliceShape(L, W, bite);
  ctx.fillStyle = V2.grad(0, -L, 0, 0, [[0, '#ffd55c'], [1, '#f2a92e']]); ctx.fill(sp);
  ctx.save(); ctx.clip(sp);
  for (const [x, y, r] of [[-12, -14, 9], [10, -30, 8.5], [-6, -46, 8], [14, -12, 7.5], [-3, -66, 6.5]]) { ctx.fillStyle = '#b8332a'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7a1c18'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,170,120,.4)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, r * .4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#e6b84a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-20 + i * 8, -8 - (i % 3) * 18, 4, 2.4, .4, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 3.8; ctx.stroke(sp);
  ctx.fillStyle = '#d28a3e'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.8; ctx.beginPath(); ctx.roundRect(-W / 2 - 3, -9, W + 6, 17, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,170,.5)'; ctx.beginPath(); ctx.roundRect(-W / 2 + 4, -6, W - 20, 5, 2.5); ctx.fill();
  if (bite > .04 && bite < .96) { const tipY = -L * (1 - .82 * bite); ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, tipY); ctx.bezierCurveTo(-8, tipY + 20, -2 + dsin(t * 2) * 2, tipY + 30, -6, tipY + 40); ctx.stroke(); }
  ctx.restore();
};
// ================================================================== constructors: A20.turnip(o), A20.eggplant(o)
A.turnip = o => {
  o = o || {};
  const seed = o.seed ?? 241, t = tOf(o), pose = o.pose || 'mug', up = clamp(o.mugUp ?? 0);
  const P = pose === 'mug' ? { arms: { l: 'rest', r: 'hold' }, grip: { r: [lerp(98, 96, up), lerp(58, -6, up)] }, hold: { r: 'fp20_mug' } } : pose === 'rest' ? { arms: { l: 'rest', r: 'rest' } } : {};
  const r = Object.assign({ kind: 'turnip', id: 'turnip', who: 'turnip', s: SC, y: G, seed, expr: 'turnip_flat', browW: 14, browColor: '#2b2133' }, P, o);
  r.t = t; r.acc = ['fp20_cap', 'fp20_hivis'].concat((o.acc || []).filter(a => a !== 'fp20_cap' && a !== 'fp20_hivis'));
  if (o.mugUp != null && pose === 'mug') { r.mugTilt = o.mugTilt ?? -.35 * up; r.steam = o.steam ?? 1; }
  if (o.gear !== false) A.winter(r, Object.assign({ hat: 'none', scarf: false, mittens: true, boots: true }, o.gear || {}));
  r.topExtra = Math.max(r.topExtra || 0, 0);
  return r;
};
function eggPoke(o, k, t, G, apexY) {   /* her stem comes up through the crown of the beanie */
  const sw = dsin(t * 1.9 + (o.seed || 0)) * 1.4;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 21; ctx.beginPath(); ctx.moveTo(0, apexY + 16); ctx.quadraticCurveTo(5, apexY - 14, 20 + sw, apexY - 34); ctx.stroke();
  ctx.strokeStyle = '#5da545'; ctx.lineWidth = 14; ctx.stroke(); ctx.strokeStyle = 'rgba(210,245,160,.55)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-3, apexY + 12); ctx.quadraticCurveTo(1, apexY - 14, 14 + sw, apexY - 32); ctx.stroke();
  ctx.fillStyle = '#d9e8a8'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(21 + sw, apexY - 36, 8, 5, -.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
A.eggplant = o => {
  o = o || {};
  const seed = o.seed ?? 251, t = tOf(o), pose = o.pose || 'rest', bite = o.bite ?? 0;
  const P = pose === 'phone' ? { arms: { l: 'rest', r: 'hold' }, grip: { r: [96, -24] }, hold: { r: 'fp20_phone' } } : pose === 'slice' ? { arms: { l: 'rest', r: 'hold' }, grip: { r: [88, 6] }, hold: { r: 'fp20_slice' } } : pose === 'rest' ? { arms: { l: 'rest', r: 'rest' } } : {};
  const r = Object.assign({ kind: 'eggplant', id: 'egg', who: 'egg', s: SC, y: G, seed, expr: 'egg_stuck', browW: 9, browColor: '#1c0b2e', lashes: true }, P, o);
  r.t = t; r.acc = ['fp20_scrubs'].concat((o.acc || []).filter(a => a !== 'fp20_scrubs'));
  if (pose === 'slice') r.bite = bite;
  if (o.winter !== false) A.winter(r, Object.assign({ hat: 'beanie', scarf: true, scarfH: 26, scarfLift: -5, poke: eggPoke, mittens: true, boots: true }, o.gear || {}));
  return r;
};
// ================================================================== A20.ditchPicture(ctx, o): Eggplant in her small car, nose down in a snowy ditch, at night, seen from the front through the windshield
// o = { x, y (centre), w, h, t, eat 0..1, phoneRing 0..1, point 0..1, settle 0..1, frame, zoom (>= 1), fx, fy (design-space focus, default the windshield), hazards (default true), label (default true) }
// The picture is designed on 600 x 720 and fitted to the box (cover). eat: 0 = the pizza box is still shut (nothing to see), then it opens and the slices go (a slice with a growing bite in her hand), 1 = the whole pie is gone, crumbs, a very happy Eggplant.
const DP = { W: 600, H: 720 };
function dpSnowfall(t, seed, n, w, h, alpha = .85) {
  ctx.save(); ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const sp = 28 + 52 * rnd(seed, i), sz = .9 + 2.4 * rnd(seed + 1, i), x = (rnd(seed + 2, i) * w + 22 * dsin(t * .8 + i) + t * 12) % w, y = (rnd(seed + 3, i) * h + t * sp) % h;
    ctx.globalAlpha = alpha * (.35 + .65 * rnd(seed + 4, i)); ctx.beginPath(); ctx.arc((x + w) % w, y, sz, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function dpCar(t, o, hz, eatK) {
  const mint = '#86cfae', mintD = mixc(mint, '#10142a', .42), mintL = mixc(mint, '#ffffff', .35);
  ctx.save(); ctx.translate(300, 640); ctx.rotate(-.07); ctx.translate(-300, -640); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the lower body: fenders and the sunk hood */
  ctx.beginPath(); ctx.moveTo(90, 650); ctx.lineTo(96, 476); ctx.quadraticCurveTo(100, 436, 150, 432); ctx.lineTo(450, 432); ctx.quadraticCurveTo(500, 436, 504, 476); ctx.lineTo(510, 650); ctx.closePath();
  ctx.fillStyle = V2.grad(0, 432, 0, 650, [[0, mintL], [.5, mint], [1, mintD]]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = V2.grad(0, 440, 0, 610, [[0, 'rgba(255,255,255,.34)'], [1, 'rgba(255,255,255,.04)']]); ctx.beginPath(); ctx.moveTo(172, 442); ctx.lineTo(428, 442); ctx.lineTo(486, 610); ctx.lineTo(114, 610); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(25,10,20,.4)'; ctx.lineWidth = 3; ctx.stroke();
  /* the cabin: A-pillars, the roof */
  ctx.beginPath(); ctx.moveTo(122, 440); ctx.lineTo(172, 228); ctx.quadraticCurveTo(176, 176, 232, 170); ctx.lineTo(368, 170); ctx.quadraticCurveTo(424, 176, 428, 228); ctx.lineTo(478, 440); ctx.closePath();
  ctx.fillStyle = V2.grad(0, 170, 0, 440, [[0, mintL], [1, mint]]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.stroke();
  /* the windshield glass: the interior, dim and warm, drawn by the caller through clip(); here the frame */
  ctx.beginPath(); ctx.moveTo(150, 430); ctx.lineTo(450, 430); ctx.lineTo(416, 244); ctx.quadraticCurveTo(412, 226, 392, 226); ctx.lineTo(208, 226); ctx.quadraticCurveTo(188, 226, 184, 244); ctx.closePath();
  const WS = new Path2D(); WS.moveTo(150, 430); WS.lineTo(450, 430); WS.lineTo(416, 244); WS.quadraticCurveTo(412, 226, 392, 226); WS.lineTo(208, 226); WS.quadraticCurveTo(188, 226, 184, 244); WS.closePath();
  ctx.fillStyle = V2.grad(0, 226, 0, 430, [[0, '#3a3552'], [1, '#1c1830']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();
  return WS;
}
function dpFront(t, o, hz) {   /* what stands in front of the driver: the dash, the wheel, the pizza box; the glass, the wipers, the lamps and the snow heaps */
  ctx.save(); ctx.translate(300, 640); ctx.rotate(-.07); ctx.translate(-300, -640); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the dash and the pizza box on it */
  ctx.fillStyle = V2.grad(0, 396, 0, 436, [[0, '#2a2640'], [1, '#14122a']]); ctx.beginPath(); ctx.moveTo(146, 438); ctx.lineTo(154, 404); ctx.quadraticCurveTo(300, 388, 446, 404); ctx.lineTo(454, 438); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke();
  const eat = clamp(o.eat ?? 0);
  ctx.save(); ctx.translate(600, 0); ctx.scale(-1, 1);   /* the box rides on the passenger side of the dash (the viewer's left: the driver is on the right) */
  if (eat <= 0) { ctx.fillStyle = '#f0ece2'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(326, 402); ctx.lineTo(430, 402); ctx.lineTo(438, 424); ctx.lineTo(320, 424); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(120,100,70,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(334, 412); ctx.lineTo(422, 412); ctx.stroke(); }
  else {
    /* the open box: a cardboard base seen from the front, the lid up behind it; the pie on top in perspective (a flat ellipse), eight slices, the eaten ones gone */
    ctx.fillStyle = '#d9b98a'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(316, 372); ctx.lineTo(446, 372); ctx.lineTo(452, 330); ctx.lineTo(310, 330); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9a572'; ctx.fillRect(316, 336, 130, 8);
    ctx.fillStyle = '#f2e3c4'; ctx.beginPath(); ctx.moveTo(310, 424); ctx.lineTo(452, 424); ctx.lineTo(446, 372); ctx.lineTo(316, 372); ctx.closePath(); ctx.fill(); ctx.stroke();
    const left = Math.round(8 * (1 - eat)), cx = 381, cy = 386, rx = 56, ry = 17;
    ctx.save(); ctx.beginPath(); ctx.rect(300, 340, 160, 90); ctx.clip();
    for (let i = 0; i < 8; i++) { if (i >= left) continue; const a0 = i / 8 * TAU - PI / 2, a1 = (i + 1) / 8 * TAU - PI / 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.ellipse(cx, cy, rx, ry, 0, a0, a1); ctx.closePath(); ctx.fillStyle = i % 2 ? '#f5b535' : '#f2a92e'; ctx.fill(); ctx.strokeStyle = '#b8782a'; ctx.lineWidth = 1.6; ctx.stroke(); const am = (a0 + a1) / 2; ctx.fillStyle = '#b8332a'; ctx.beginPath(); ctx.ellipse(cx + dcos(am) * rx * .56, cy + dsin(am) * ry * .56, 7, 3.4, 0, 0, TAU); ctx.fill(); }
    if (left === 0) { ctx.fillStyle = 'rgba(160,110,50,.5)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(350 + rnd(61, i) * 62, 392 + rnd(62, i) * 16, 3 + rnd(63, i) * 3, 2, 0, 0, TAU); ctx.fill(); } }
    ctx.restore();
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(cx, cy, rx + 3, ry + 2, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
  /* the steering wheel: the upper rim in front of her chest, a hub */
  ctx.strokeStyle = OUT; ctx.lineWidth = 17; ctx.beginPath(); ctx.ellipse(352, 466, 78, 38, .1, PI * 1.08, PI * 1.92); ctx.stroke(); ctx.strokeStyle = '#2a2d3a'; ctx.lineWidth = 10; ctx.stroke();
  /* the glass in front of everything inside: a sheen, snow melting in streaks, a slim ridge of snow on the cowl; the wipers parked */
  ctx.save(); ctx.beginPath(); ctx.moveTo(150, 430); ctx.lineTo(450, 430); ctx.lineTo(416, 244); ctx.quadraticCurveTo(412, 226, 392, 226); ctx.lineTo(208, 226); ctx.quadraticCurveTo(188, 226, 184, 244); ctx.closePath(); ctx.clip();
  ctx.fillStyle = 'rgba(200,220,245,.12)'; ctx.beginPath(); ctx.moveTo(206, 226); ctx.lineTo(262, 226); ctx.lineTo(196, 430); ctx.lineTo(150, 430); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(290, 226); ctx.lineTo(304, 226); ctx.lineTo(252, 430); ctx.lineTo(238, 430); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(210,226,246,.32)'; ctx.lineWidth = 1.8; for (let i = 0; i < 9; i++) { const x = 190 + rnd(51, i) * 220, y = 236 + ((rnd(52, i) * 150 + t * (3 + i % 4)) % 180); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1, y + 12); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(20,16,30,.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(196, 424); ctx.lineTo(300, 408); ctx.moveTo(300, 424); ctx.lineTo(412, 408); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = V2.grad(0, 424, 0, 446, [[0, '#f6faff'], [1, '#b8c8e4']]); ctx.beginPath(); ctx.moveTo(146, 440); ctx.quadraticCurveTo(300, 420, 454, 440); ctx.lineTo(456, 450); ctx.quadraticCurveTo(300, 436, 144, 450); ctx.closePath(); ctx.fill();
  /* the lamps: dark headlights half in the snow, the hazards at the fender corners (amber, a slow 1 Hz blink, dim) */
  for (const sd of [-1, 1]) { ctx.fillStyle = '#2b2a38'; ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(300 + sd * 142, 556, 38, 24, sd * .08, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(190,210,235,.2)'; ctx.beginPath(); ctx.ellipse(300 + sd * 142 - 8, 550, 18, 8, 0, 0, TAU); ctx.fill(); }
  for (const sd of [-1, 1]) { const x = 300 + sd * 196, y = 500; ctx.fillStyle = mixc('#7a4a10', '#ffb21c', hz); ctx.strokeStyle = OUT; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.roundRect(x - 13, y - 9, 26, 18, 6); ctx.fill(); ctx.stroke(); }
  /* side mirrors */
  for (const sd of [-1, 1]) { const x = 300 + sd * 190, y = 392; ctx.fillStyle = '#86cfae'; ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x - (sd > 0 ? -8 : 34), y - 18, 26, 34, 9); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function dpSnow(t, hz) {   /* the ditch: banks on both sides, the heap the nose is buried in, a cap on the roof */
  ctx.save(); ctx.lineJoin = 'round';
  const fillSnow = (path, y0, y1) => { ctx.fillStyle = V2.grad(0, y0, 0, y1, [[0, '#f4f9ff'], [.5, '#cfdcf0'], [1, '#8fa3cc']]); ctx.fill(path); ctx.strokeStyle = 'rgba(70,92,150,.6)'; ctx.lineWidth = 3; ctx.stroke(path); };
  const P1 = new Path2D(); P1.moveTo(-20, 720); P1.lineTo(-20, 424); P1.bezierCurveTo(40, 390, 96, 430, 112, 520); P1.bezierCurveTo(150, 640, 90, 700, 40, 720); P1.closePath(); fillSnow(P1, 400, 720);
  const P2 = new Path2D(); P2.moveTo(620, 720); P2.lineTo(620, 410); P2.bezierCurveTo(560, 384, 506, 428, 490, 520); P2.bezierCurveTo(452, 640, 510, 700, 560, 720); P2.closePath(); fillSnow(P2, 400, 720);
  const P3 = new Path2D(); P3.moveTo(40, 724); P3.bezierCurveTo(60, 620, 120, 580, 190, 588); P3.bezierCurveTo(260, 566, 340, 566, 410, 588); P3.bezierCurveTo(480, 580, 540, 620, 560, 724); P3.closePath(); fillSnow(P3, 560, 724);
  /* the roof cap */
  const P4 = new Path2D(); P4.moveTo(170, 226); P4.bezierCurveTo(158, 172, 232, 146, 300, 146); P4.bezierCurveTo(368, 146, 442, 172, 430, 226);
  for (let i = 0; i < 6; i++) { const x0 = 430 - i * 43.3, x1 = x0 - 43.3; P4.quadraticCurveTo((x0 + x1) / 2, 232 + (i % 2) * 3, x1, 226); }
  P4.closePath(); fillSnow(P4, 146, 236);
  /* hazard glow on the snow: amber, soft, in step with the lamps */
  if (hz > .01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const sd of [-1, 1]) { ctx.fillStyle = V2.radial(300 + sd * 200, 500, 4, 130, [[0, `rgba(255,170,40,${.34 * hz})`], [1, 'rgba(255,140,20,0)']]); ctx.fillRect(300 + sd * 200 - 130, 370, 260, 260); } ctx.restore(); }
  ctx.restore();
}
A.ditchPicture = (c, o = {}) => {
  o = Object.assign({ x: 540, y: 960, w: 600, h: 720, t: tOf(o), eat: 0, phoneRing: 0, frame: true }, o);
  const { x, y, w, h, t } = o, sc = Math.max(w / DP.W, h / DP.H) * Math.max(1, o.zoom ?? 1.25), fx = o.fx ?? 300, fy = o.fy ?? 392;
  const hzP = ((t % 1) + 1) % 1, hz = o.hazards === false ? 0 : .12 + .88 * sm(0, .1, hzP) * (1 - sm(.46, .58, hzP)) * .8;
  const L0 = Object.assign({}, V2.LIGHT), lights0 = V2.lights ? V2.lights.slice() : [], ctx0 = ctx;
  ctx = c;
  try {
  c.save();
  c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, o.frame ? Math.min(w, h) * .05 : 0); c.clip();
  c.translate(x, y); c.scale(sc, sc); c.translate(-fx, -fy);
  /* night sky and the far bank */
  c.fillStyle = V2.grad(0, -120, 0, 420, [[0, '#070d24'], [.55, '#13254a'], [1, '#2a3f6c']]); c.fillRect(-300, -300, 1200, 1400);
  c.fillStyle = V2.grad(0, 250, 0, 400, [[0, '#33496f'], [1, '#6f86b2']]); c.beginPath(); c.moveTo(-300, 330); c.bezierCurveTo(-60, 290, 160, 340, 300, 312); c.bezierCurveTo(440, 290, 560, 320, 900, 300); c.lineTo(900, 700); c.lineTo(-300, 700); c.closePath(); c.fill();
  dpSnowfall(t, 7, 90, 600, 720, .55);
  const WS = dpCar(t, o, hz);
  /* the interior through the windshield: a dome light, her */
  c.save(); c.clip(WS);
  c.fillStyle = V2.grad(0, 226, 0, 430, [[0, '#4a4266'], [1, '#2c2644']]); c.fillRect(150, 226, 300, 210);
  c.fillStyle = '#5a5278'; c.beginPath(); c.roundRect(268, 236, 136, 72, 16); c.fill();   /* her headrest */
  c.fillStyle = '#4f4870'; c.beginPath(); c.roundRect(170, 262, 90, 80, 14); c.fill();   /* the empty passenger headrest */
  c.fillStyle = V2.radial(320, 262, 6, 210, [[0, 'rgba(255,230,180,.62)'], [1, 'rgba(255,230,180,0)']]); c.fillRect(120, 226, 360, 220);
  const settle = clamp(o.settle ?? 0), pr = clamp(o.phoneRing ?? 0), pt = clamp(o.point ?? 0), eat = clamp(o.eat ?? 0);
  const phoneOn = pr > .02, sliceOn = eat > 0 && !phoneOn && pt < .5 && eat < 1.01;
  const egg = A.eggplant({ t, expr: o.expr || (eat > .02 ? 'egg_cosy' : settle > .5 ? 'egg_calm' : 'egg_stuck'), pose: 'rest', noLegs: true, noShadow: true, noReflect: true, hivis: false, x: 336, y: 412 + 22 * settle, s: .64, id: 'egg', seed: 251,
    gear: { scarfH: 24, boots: false, mittens: true, wind: 0, breath: o.breath !== false, breathDir: 1, breathSize: .8, breathAlpha: .6 } });
  egg.arms = { l: 'rest', r: 'hold' }; egg.grip = { r: [58, 112] };   /* the right hand on the wheel (the viewer's right) */
  const bk = .5 + .5 * dsin(t * 1.4);
  if (phoneOn) { egg.arms.l = 'hold'; egg.grip.l = [lerp(-70, -60, pr), lerp(100, -50, pr)]; egg.hold = { l: 'fp20_phone' }; egg.phoneLit = 1; }
  else if (pt > .02) { egg.arms.r = 'hold'; egg.grip.r = [lerp(76, 126, pt), lerp(96, -22, pt)]; egg.hand = { r: 'point' }; }
  else if (eat > 0) { egg.arms.l = 'hold'; egg.grip.l = [lerp(-88, -56, bk), lerp(62, 6, bk)]; egg.hold = { l: 'fp20_slice' }; egg.bite = Math.min(.96, (eat * 8) % 1 || eat); egg.sliceRot = .22; }
  if (settle > .01 && !phoneOn) { egg.lid = .42 + .2 * settle; }
  const Lp = { key: [0, -1], keyColor: '#ffe4b0', keyA: .42, rim: '#ffb040', rimA: .3 * hz + .1, shadow: '#120a26', shadowA: .4, bounce: '#9ab4ff', bounceA: .12 };
  V2.setLight(Lp);
  drawChar(egg);
  c.restore();
  V2.setLight(L0); if (V2.lights) { V2.lights.length = 0; for (const l of lights0) V2.addLight(l); }
  dpSnow(t, hz);
  dpFront(t, o, hz);
  dpSnowfall(t, 19, 40, 600, 720, .85);
  c.restore();
  } finally { ctx = ctx0; V2.setLight(L0); if (V2.lights) { V2.lights.length = 0; for (const l of lights0) V2.addLight(l); } }
  if (o.frame) {   /* a rounded video-call frame: a thin pale border, a soft inner vignette and a LIVE chip (text through the UI kit) */
    c.save(); c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * .05); c.clip();
    c.fillStyle = V2.radial(x, y, Math.min(w, h) * .3, Math.max(w, h) * .75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(4,8,24,.45)']]); c.fillRect(x - w / 2, y - h / 2, w, h);
    c.restore();
    c.save(); c.strokeStyle = 'rgba(230,240,255,.9)'; c.lineWidth = Math.max(3, w * .012); c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * .05); c.stroke(); c.restore();
    if (o.label !== false && window.UI) { const sz = Math.max(16, w * .052); UI.pill('LIVE', x + w / 2 - w * .13, y - h / 2 + h * .06, { size: sz, fill: '#d93a3a', ink: '#ffffff', hero: false, id: 'ditchlive' }); }
  }
  return { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2, cx: x, cy: y, w, h };
};
// ================================================================== A20.snowman(ctx, o): a charming lopsided snowman that Tomato builds (three balls rising, then the face and the arms, then the party hat)
// o = { x, y (ground centre), s (1 = 266 px tall), build 0..1, lean (radians), hat 'party' | 'none', nose 'carrot', t, seed, part 'all' | 'body' | 'head' (head: x, y = the head's centre, o.rot rolls it), rot, wave 0..1 }
const popK = k => { k = clamp(k); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function snowBall(x, y, r, seed, rot = 0, lit = -1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; pts.push([dcos(a) * r * (1 + .035 * dsin(a * 3 + seed) + .025 * dsin(a * 5 + seed * 2)), dsin(a) * r * (1 + .035 * dsin(a * 3 + seed) + .025 * dsin(a * 5 + seed * 2))]); }
  const path = new Path2D(); pts.forEach(([px, py], i) => i ? path.lineTo(px, py) : path.moveTo(px, py)); path.closePath();
  ctx.fillStyle = V2.radial(-lit * r * .35, -r * .4, r * .08, r * 1.25, [[0, '#ffffff'], [.5, '#e9f1fb'], [1, '#a9bddd']]); ctx.fill(path);
  ctx.save(); ctx.clip(path);
  ctx.strokeStyle = 'rgba(120,146,200,.3)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { const a = rnd(seed, i) * TAU, rr2 = r * (.45 + .4 * rnd(seed + 1, i)); ctx.beginPath(); ctx.arc(0, 0, rr2, a, a + .7 + rnd(seed + 2, i) * .5); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((rnd(seed + 3, i) - .5) * r * 1.3, (rnd(seed + 4, i) - .5) * r * 1.3, 1.6 + rnd(seed + 5, i) * 1.4, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(52,70,130,.9)'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke(path);
  ctx.restore();
}
function snowHead(o, cx, cy, r, bf, t, seed, rot) {   /* the head with its face and the party hat (bf: the face 0..1, hat 0..1) */
  const sc = o.hat === 'none' ? 0 : 1;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0); ctx.translate(-cx, -cy);
  snowBall(cx, cy, r, seed + 7, 0);
  const fk = clamp(bf.face);
  if (fk > .02) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sm(0, 1, fk), sm(0, 1, fk)); ctx.fillStyle = '#1f1b26';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * r * .36, -r * .16, r * .12, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(sd * r * .36 - 1.2, -r * .2, r * .035, 0, TAU); ctx.fill(); ctx.fillStyle = '#1f1b26'; }
    for (let i = 0; i < 5; i++) { const a = lerp(.15, .85, i / 4) * PI; ctx.beginPath(); ctx.arc(dcos(a) * r * .46, r * .24 + dsin(a) * r * .16, r * .06, 0, TAU); ctx.fill(); }
    /* the carrot nose: a short orange cone pointing out to one side and down */
    const nk = popK(clamp((fk - .3) / .7)); ctx.save(); ctx.translate(r * .04, r * .06); ctx.rotate(.38); ctx.scale(nk, nk);
    ctx.fillStyle = V2.grad(0, -r * .12, 0, r * .12, [[0, '#ff9b3a'], [1, '#d9570f']]); ctx.strokeStyle = 'rgba(70,30,10,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -r * .11); ctx.lineTo(r * .78, 0); ctx.lineTo(0, r * .11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,50,10,.5)'; ctx.lineWidth = 2; for (const x of [.22, .42, .6]) { ctx.beginPath(); ctx.moveTo(r * x, -r * .08 * (1 - x)); ctx.lineTo(r * x, r * .08 * (1 - x)); ctx.stroke(); } ctx.restore();
    ctx.restore();
  }
  const hk = clamp(bf.hat);
  if (sc && hk > .02) {   /* a party hat that lands with a bounce: pink cone, white stripes, a yellow pom, an elastic under the chin */
    const drop = (1 - popK(hk)) * -40 * (hk < 1 ? 1 : 0), tilt = -.2 + .05 * dsin(t * 3 + seed);
    ctx.save(); ctx.translate(cx + r * .12, cy - r * .86 + drop); ctx.rotate(tilt);
    ctx.fillStyle = V2.grad(-r * .5, 0, r * .5, 0, [[0, '#ff6fa8'], [.6, '#e83a82'], [1, '#b52a68']]); ctx.strokeStyle = 'rgba(52,20,50,.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-r * .56, 0); ctx.lineTo(r * .56, 0); ctx.lineTo(0, -r * 1.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 5; for (let i = 0; i < 4; i++) { const yy = -r * (.28 + i * .34); ctx.beginPath(); ctx.moveTo(-r * .6, yy + r * .14); ctx.lineTo(r * .6, yy - r * .14); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = 'rgba(52,20,50,.95)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(0, -r * 1.7, r * .17, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
A.snowman = (c, o = {}) => {
  o = Object.assign({ x: 540, y: 1200, s: 1, build: 1, lean: 0, hat: 'party', nose: 'carrot', t: tOf(o), seed: 5, part: 'all', rot: 0 }, o);
  const b = clamp(o.build), t = o.t, seed = o.seed, lit = keyX() < 0 ? -1 : 1, ctx0 = ctx; ctx = c;
  try {
    c.save(); c.translate(o.x, o.y); c.scale(o.s, o.s); c.lineJoin = 'round'; c.lineCap = 'round';
    const k0 = sm(0, .3, b), k1 = popK((b - .3) / .26), k2 = popK((b - .55) / .22), kf = clamp((b - .74) / .14), ka = clamp((b - .84) / .12), kh = clamp((b - .9) / .1);
    const R0 = 62, R1 = 46, R2 = 34, y0 = -R0 * .96, y1 = y0 - R0 * .8 - R1 * .7, y2 = y1 - R1 * .78 - R2 * .62;
    if (o.part === 'head') { snowHead(o, 0, 0, R2, { face: 1, hat: o.hat === 'none' ? 0 : 1 }, t, seed, o.rot); c.restore(); return; }
    c.fillStyle = 'rgba(40,60,120,.28)'; c.beginPath(); c.ellipse(4, 2, R0 * 1.15 * Math.max(.3, k0), 10, 0, 0, TAU); c.fill();
    /* the lean sways the whole stack about its base */
    c.rotate(o.lean + .018 * dsin(t * 1.3 + seed));
    const r0 = R0 * (.34 + .66 * k0);
    snowBall(0, -r0 * .96, r0, seed, 0, lit);
    if (b > .3) { const r1 = R1 * Math.max(.05, k1); if (r1 > 2) snowBall(5, y1 + (k1 < 1 ? (1 - k1) * -26 : 0), r1, seed + 1, .1, lit); }
    if (b > .55 && o.part !== 'body') { const r2 = R2 * Math.max(.05, k2); if (r2 > 2) { const dy = k2 < 1 ? (1 - k2) * -30 : 0; snowHead(o, -6, y2 + dy, r2, { face: kf, hat: kh }, t, seed, 0); } }
    if (b > .74) {   /* coal buttons down the middle ball */
      c.fillStyle = '#1f1b26'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(4, y1 - 20 + i * 22, 4.2 * kf, 0, TAU); c.fill(); }
    }
    if (ka > .02) {   /* twig arms: two brown branches with a fork each; the right one waves a little */
      const wv = (o.wave ?? 1) * dsin(t * 4.2 + seed) * .12;
      for (const sd of [-1, 1]) {
        c.save(); c.translate(5 + sd * R1 * .88, y1 - 4); c.rotate(sd * (1.0 + .3 * (1 - ka)) + (sd > 0 ? wv : 0)); c.scale(1, ka);
        c.strokeStyle = 'rgba(50,28,12,.95)'; c.lineWidth = 8.5; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(4 * sd, -34, 0, -66); c.moveTo(1, -38); c.lineTo(16 * sd, -56); c.moveTo(0, -56); c.lineTo(-12 * sd, -72); c.stroke();
        c.strokeStyle = '#7a5530'; c.lineWidth = 4.6; c.stroke(); c.restore();
      }
    }
    c.restore();
  } finally { ctx = ctx0; }
  return [o.x - 90 * o.s, o.y - 290 * o.s, o.x + 90 * o.s, o.y];
};
A.snowmanInfo = o => { const s = o.s ?? 1; return { head: [o.x - 6 * s, o.y - 232 * s], body: [o.x, o.y - 110 * s], top: [o.x, o.y - 270 * s], base: [o.x, o.y] }; };

// ================================================================== the snow shovel: the prop fp20_shovel and A20.shovelThrow(o, t, t0)
// held one-handed near the top of the shaft (a short-armed fruit cannot reach a second grip without the shaft crossing its face): the D-handle end stays at hip height, the blade swings out to the side.
Object.assign(PROP_BOX, { fp20_shovel: Object.assign([-34, -64, 38, 216], { nearFace: true }) });
EXT.prop.fp20_shovel = (side, o, t) => {   /* o.shovelAng (radians from vertical; the blade leans toward o.shovelDir, default +1), o.shovelLoad 0..1 (a heap of snow on the blade) */
  const dir = o.shovelDir || 1, ang = o.shovelAng ?? 1, load = clamp(o.shovelLoad ?? 0);
  ctx.save(); ctx.rotate(-dir * ang); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, 168); ctx.stroke(); ctx.strokeStyle = '#c99a5a'; ctx.lineWidth = 6.4; ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(-17, -32); ctx.quadraticCurveTo(-24, -62, 0, -62); ctx.quadraticCurveTo(24, -62, 17, -32); ctx.stroke(); ctx.strokeStyle = '#2a2d3a'; ctx.lineWidth = 6; ctx.stroke();
  const bl = new Path2D(); bl.moveTo(-34, 152); bl.quadraticCurveTo(-40, 192, -28, 214); bl.lineTo(28, 214); bl.quadraticCurveTo(40, 192, 34, 152); bl.quadraticCurveTo(0, 166, -34, 152); bl.closePath();
  ctx.fillStyle = V2.grad(-36, 0, 36, 0, [[0, '#ff8a6a'], [.5, '#e0453a'], [1, '#a82a24']]); ctx.fill(bl); ctx.strokeStyle = OUT; ctx.lineWidth = 4.4; ctx.stroke(bl);
  ctx.strokeStyle = '#c3cad6'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-28, 214); ctx.lineTo(28, 214); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, 166); ctx.quadraticCurveTo(-27, 192, -20, 206); ctx.stroke();
  if (load > .02) { ctx.fillStyle = V2.grad(0, 120, 0, 166, [[0, '#f9fcff'], [1, '#c3d2ea']]); ctx.strokeStyle = 'rgba(70,92,150,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-32, 158); ctx.bezierCurveTo(-38, 130 - 26 * load, 38, 130 - 26 * load, 34, 156); ctx.quadraticCurveTo(0, 166, -32, 158); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
A.SHOVEL = { period: .6, release: .46, L: 214 };
function shovelKeys(u) {   /* one dig-and-throw cycle, u 0..1: plunge (0), loaded (.1), lifted (.38), the flick forward and up (.46, the snow leaves the blade), swinging back, plunge again: [shaft angle, load] */
  const K = [[0, 1.0, 0], [.1, 1.04, 1], [.38, 1.34, 1], [.45, 1.72, 1], [.48, 1.78, 0], [.78, 1.3, 0], [1, 1.0, 0]];
  for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i], k = easeIO(clamp((u - a[0]) / (b[0] - a[0]))); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
  return [K[0][1], K[0][2]];
}
A.shovelThrow = (o, t, t0) => {
  /* sets the character's shovel pose on o (arms, grip, hold, shovelAng, shovelLoad, shovelDir) and returns the blade tip in WORLD units: { x, y, ang, load, u, release } (release = 1 on the frame the snow leaves the blade).
   The hand sits at hip height beside the body, 100 px out (the right shoulder's reach is 121 px): the shaft swings about it. */
  o = o || {}; const dir = o.shovelDir || 1, k = KINDS[o.kind] || KINDS.straw, s = o.s || 1, P = A.SHOVEL;
  const u = t < t0 ? 0 : (((t - t0) / P.period) % 1 + 1) % 1, [phi, load] = t < t0 ? [.85, 0] : shovelKeys(u);
  const gx = Math.min(100, k.rx * .86), gy = Math.min(100, k.ry * .78);
  o.arms = Object.assign({ l: 'rest' }, o.arms, { r: 'hold' }); o.hold = Object.assign({}, o.hold, { r: 'fp20_shovel' }); o.shovelAng = phi; o.shovelLoad = load; o.shovelDir = dir;
  const G1 = [dir * gx, gy];
  o.grip = Object.assign({}, o.grip, { r: G1 });
  const d = [dsin(phi) * dir, dcos(phi)], bob = o.noBob ? 0 : dsin(t * 2.6 + (o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7))) * 2.2, leg = o.noLegs ? 0 : (k.leg || 90), cy = o.y - (o.lift || 0) - s * (leg + k.ry * .9) + s * bob, fl = o.flip ? -1 : 1;
  const tip = [G1[0] + d[0] * P.L, G1[1] + d[1] * P.L];
  const rel = t >= t0 && Math.abs(u - P.release) < .5 / (P.period * 30) ? 1 : 0;
  return { x: o.x + fl * s * tip[0], y: cy + s * tip[1], ang: dir * phi, load, u, release: rel };
};

// ================================================================== fp20_ice: tears frozen into tiny ice beads on the cheeks (face class, front layer); o.iceBeads 0..1
EXT.acc.fp20_ice = (o, k, t, layer) => {
  const kk = clamp(o.iceBeads ?? 0); if (layer !== 'front' || kk < .04) return;
  const n = Math.max(1, Math.round(kk * 9));
  ctx.save();
  for (let i = 0; i < n; i++) {
    const sd = i % 2 ? 1 : -1, j = Math.floor(i / 2), x = sd * (k.eyeX + k.er * (.45 + .16 * rnd(81, i))), y = k.eyeY + k.er * (1.55 + j * .62 + .25 * rnd(82, i)), r = 3.4 + 2.6 * rnd(83, i);
    ctx.fillStyle = 'rgba(206,238,255,.9)'; ctx.strokeStyle = 'rgba(70,120,190,.9)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .35, r * .32, 0, TAU); ctx.fill();
  }
  ctx.restore();
};
/* @@A20-PART4E */
/* @@A20-PART3 */

// ================================================================== E15-TURN integration: the gear turns with the head / body (it reads o.yaw / o.headYaw itself through yawInfo)
(() => {
  if (!V2C.YAW_ACC || !V2C.YAW_TEX || !V2C.YAW_TOP || !V2C.ACC_CLS) return;
  const own = (name, cls) => { const f = (o, k, t, layer) => EXT.acc[name](o, k, t, layer); f.cls = cls; V2C.YAW_ACC[name] = f; };
  own('fp20_hat', 'head'); own('fp20_scarf', 'wrap'); own('fp20_coat', 'wrap'); own('fp20_boots', 'chest'); own('fp20_breath', 'face');
  own('fp20_cap', 'head'); own('fp20_hivis', 'wrap'); own('fp20_scrubs', 'wrap'); V2C.ACC_CLS.fp20_ice = 'face';
  /* @@A20-TURN */
})();
})();
