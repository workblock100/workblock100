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
  const sc = (k.mw || 26) / 26, ys = k.mouthY + 55 * sc + 3 + (g.scarfLift || 0);
  const th = Math.min(g.scarfH || 34, Math.max(20, k.ry + 8 - ys));
  return { ys, th, wt: Math.max(30, halfW(o.kind, ys + 2) + 7), wb: Math.max(30, halfW(o.kind, ys + th - 2) + 9) };
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
    const xk = Math.min(S.wt * .66, 70) * dsin(lonK + yw), yk = S.ys + S.th * .5, len = g.tailLen || 70, w0 = 25, segs = 7;
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
  const Y = yawsOf(o), fa = V2C.faceAng ? V2C.faceAng(Y.h) : Y.h, side = Math.abs(dsin(fa)) > .45 ? (dsin(fa) < 0 ? -1 : 1) : (g.breathDir || ((o.look && o.look[0] < -.2) ? -1 : (o.look && o.look[0] > .2) ? 1 : ((o.seed || 0) % 2 ? -1 : 1)));
  const mx = (Math.abs(dsin(fa)) > .45 ? 0 : side * ((k.mw || 26) * .8 + 6)), my = k.mouthY + 6;
  const size = (g.breathSize || 17), phase = g.breathPhase || 0;
  if (window.SN20 && typeof SN20.breath === 'function') SN20.breath(ctx, { x: mx, y: my, t, seed: (o.seed || 0) + 7, dir: side, size, alpha: g.breathAlpha ?? .9, period: 1.9, phase });
  else puffStandIn(mx, my, t, side, (o.seed || 0) + 7, size, g.breathAlpha ?? .9, 1.9, phase);
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
  if (D.breath && !('breathSize' in D)) D.breathSize = 17;
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
/* @@A20-PART3 */

// ================================================================== E15-TURN integration: the gear turns with the head / body (it reads o.yaw / o.headYaw itself through yawInfo)
(() => {
  if (!V2C.YAW_ACC || !V2C.YAW_TEX || !V2C.YAW_TOP || !V2C.ACC_CLS) return;
  const own = (name, cls) => { const f = (o, k, t, layer) => EXT.acc[name](o, k, t, layer); f.cls = cls; V2C.YAW_ACC[name] = f; };
  own('fp20_hat', 'head'); own('fp20_scarf', 'wrap'); own('fp20_coat', 'wrap'); own('fp20_boots', 'chest'); own('fp20_breath', 'face');
  /* @@A20-TURN */
})();
})();
