'use strict';
/* Episode 6 rooms: a box-room shell in perspective, true 3D boxes for furniture (so every table, counter and bed obeys the
 * same camera), and the four sets built from them: the lobby, a resident's room, the break room and the parking lot. */
(() => {
const { proj, p2, poly, quad3, grad, radial, rgba, mix } = V2;
const clampc = v => Math.max(0, Math.min(255, v));
const lit = (c, f) => { const [r, g, b] = V2.rgb(c); return `rgb(${clampc(r * f) | 0},${clampc(g * f) | 0},${clampc(b * f) | 0})`; };
const fogc = (c, fog, amt, z, zFar) => V2.rgba(mix(c, fog, clamp((z - V2.P.cz) / Math.max(1, zFar - V2.P.cz)) ** .85 * amt), 1);

// ------------------------------------------------------------------ a box in the world, drawn with the faces the camera can see
function box3(b) {
  const { x0, x1, y0 = 0, y1, z0, z1 } = b, P = V2.P;
  const base = b.color ?? '#b8946a', top = b.top ?? lit(base, 1.14), front = b.front ?? base, side = b.side ?? lit(base, .78);
  const edge = b.edge ?? 'rgba(25,16,30,.62)', lw = b.lw ?? 2.2, F = b.fog;
  const fc = c => F ? fogc(c, F.color, F.amt, (z0 + z1) / 2, F.zFar) : c;
  if (P.cx < x0) quad3([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], fc(side), edge, lw);
  if (P.cx > x1) quad3([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], fc(side), edge, lw);
  if (P.cy > y1) quad3([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], fc(top), edge, lw);
  const f = [p2(x0, y0, z0), p2(x1, y0, z0), p2(x1, y1, z0), p2(x0, y1, z0)];
  poly(f, b.frontGrad ? grad(f[0][0], f[3][1], f[0][0], f[0][1], b.frontGrad.map(([o, c]) => [o, fc(c)])) : fc(front), edge, lw);
  return f;   // the front face corners, for decoration
}
// a thin rectangle on the front face of a box or on a back wall: coordinates in world units at depth z
function onZ(z, x0, x1, y0, y1, fill, stroke, lw) { poly([p2(x0, y0, z), p2(x1, y0, z), p2(x1, y1, z), p2(x0, y1, z)], fill, stroke, lw); }
const kz = z => V2.P.f / (z - V2.P.cz);

// ------------------------------------------------------------------ the room shell
function shell(o) {
  const P = V2.P, z0 = P.cz + 60, { zb, hw, ch } = o;
  const fog = o.fog ?? '#a9b4c8', fa = o.fogAmt ?? .3, bright = o.bright ?? 1, rail = o.rail ?? 96;
  const wall = o.wall ?? '#e8dfc9', wain = o.wain ?? '#58878e', floorA = o.floorA ?? '#cfc4ae', floorB = o.floorB ?? '#a89c86', ceil = o.ceil ?? '#efede6';
  ctx.fillStyle = V2.rgba(fog, 1); ctx.fillRect(-300, -300, W + 600, H + 600);
  // back wall
  const bw = [p2(-hw, 0, zb), p2(hw, 0, zb), p2(hw, ch, zb), p2(-hw, ch, zb)];
  poly(bw, grad(0, bw[2][1], 0, bw[0][1], [[0, lit(wall, 1.04)], [1, lit(wall, .9)]]));
  onZ(zb, -hw, hw, 0, rail, lit(wain, .95));
  onZ(zb, -hw, hw, rail - 5, rail + 5, '#b98a5a');
  onZ(zb, -hw, hw, 0, 26, '#7d6a5a');
  // ceiling
  quad3([-hw, ch, z0], [hw, ch, z0], [hw, ch, zb], [-hw, ch, zb], grad(0, p2(0, ch, z0)[1], 0, p2(0, ch, zb)[1], [[0, lit(ceil, .97)], [1, lit(ceil, .86)]]));
  ctx.strokeStyle = 'rgba(80,80,90,.15)'; ctx.lineWidth = 1.4;
  for (let z = Math.ceil(z0 / 120) * 120; z < zb; z += 120) { const a = p2(-hw, ch, z), b = p2(hw, ch, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (let x = -hw + 120; x < hw; x += 120) { const a = p2(x, ch, z0), b = p2(x, ch, zb); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // floor
  const fgd = grad(0, p2(0, 0, z0)[1], 0, p2(0, 0, zb)[1], [[0, lit(floorA, 1.03)], [1, lit(floorB, .92)]]);
  quad3([-hw, 0, z0], [hw, 0, z0], [hw, 0, zb], [-hw, 0, zb], fgd);
  ctx.save(); ctx.beginPath(); [p2(-hw, 0, z0), p2(hw, 0, z0), p2(hw, 0, zb), p2(-hw, 0, zb)].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  const ts = o.tile ?? 120; ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(50,40,50,.11)';
  for (let z = Math.ceil(z0 / ts) * ts; z < zb; z += ts) { const a = p2(-hw, 0, z), b = p2(hw, 0, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  for (let x = -hw + ts; x < hw; x += ts) { const a = p2(x, 0, z0), b = p2(x, 0, zb); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  ctx.restore();
  // side walls
  for (const side of [-1, 1]) {
    const X = side * hw, wallQ = (y0, y1, fill, st, lw2) => poly([p2(X, y0, z0), p2(X, y1, z0), p2(X, y1, zb), p2(X, y0, zb)], fill, st, lw2);
    const xa = p2(X, ch / 2, z0)[0], xb = p2(X, ch / 2, zb)[0];
    const gw = (c, f) => { const g = ctx.createLinearGradient(xa, 0, xb, 0); g.addColorStop(0, lit(c, f * 1.0)); g.addColorStop(1, lit(c, f * .8)); return g; };
    wallQ(rail, ch, gw(wall, side < 0 ? .92 : .84)); wallQ(0, rail, gw(wain, side < 0 ? .9 : .8));
    wallQ(rail - 5, rail + 5, lit('#b98a5a', side < 0 ? .95 : .85)); wallQ(0, 24, lit('#7d6a5a', .85));
  }
  // soft occlusion in the corners and along the ceiling
  for (const side of [-1, 1]) { const a = p2(side * hw, 0, zb), b = p2(side * hw, ch, zb); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = grad(a[0], 0, a[0] - side * 90 * kz(zb), 0, [[0, 'rgba(70,60,80,.55)'], [1, 'rgba(255,255,255,1)']]); ctx.fillRect(Math.min(a[0], a[0] - side * 90 * kz(zb)), b[1], 90 * kz(zb), a[1] - b[1]); ctx.restore(); }
  return { z0 };
}

// windows on the back wall: frame, sky, mullions, optional curtains, and a beam of light into the room
function backWindow(zb, w, hasSun = false) {
  const { x0, x1, y0, y1 } = w, sky = w.sky ?? ['#9fd0ff', '#e9f6ff'];
  const g = ctx.createLinearGradient(0, p2(0, y1, zb)[1], 0, p2(0, y0, zb)[1]); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
  onZ(zb, x0 - 14, x1 + 14, y0 - 14, y1 + 14, '#f2eee4', 'rgba(25,16,30,.55)', 2.4);
  const f = [p2(x0, y0, zb), p2(x1, y0, zb), p2(x1, y1, zb), p2(x0, y1, zb)]; poly(f, g);
  if (w.draw) { ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); w.draw(f); ctx.restore(); }
  const mx = w.mull ?? 2;
  ctx.strokeStyle = '#f2eee4'; ctx.lineWidth = Math.max(3, 8 * kz(zb));
  for (let i = 1; i < mx; i++) { const x = lerp(x0, x1, i / mx); const a = p2(x, y0, zb), b = p2(x, y1, zb); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  { const a = p2(x0, (y0 + y1) / 2, zb), b = p2(x1, (y0 + y1) / 2, zb); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  if (w.sill !== false) onZ(zb, x0 - 22, x1 + 22, y0 - 26, y0 - 8, '#e8e0cf', 'rgba(25,16,30,.5)', 2);
  if (w.curtains) for (const [a0, a1] of [[x0 - 30, x0 + (x1 - x0) * .18], [x1 - (x1 - x0) * .18, x1 + 30]]) onZ(zb, a0, a1, y0 - 20, y1 + 24, w.curtains, 'rgba(25,16,30,.35)', 1.6);
  if (hasSun || w.beam) {
    const c = w.beam ?? '255,236,170', k = kz(zb), A = V2.P;
    const [cx0, cy0] = p2((x0 + x1) / 2, (y0 + y1) / 2, zb), len = w.beamLen ?? 900;
    V2.beam(cx0, cy0, cx0 + (w.beamDx ?? 120), cy0 + len * .9, (x1 - x0) * k * .9, (x1 - x0) * k * 1.8, c, w.beamA ?? .22);
    V2.glow(cx0, cy0, (x1 - x0) * k * 1.3, c, (w.beamA ?? .22) * 1.6, 'screen', .7); void A;
  }
}
const onZwin = backWindow;

// a ceiling light panel and its glow
function ceilingLamp(X, Z, ch, on = 1, color = '255,248,226', w = 90, d = 150) {
  const pts = [p2(X - w, ch - 2, Z), p2(X + w, ch - 2, Z), p2(X + w, ch - 2, Z + d), p2(X - w, ch - 2, Z + d)];
  poly(pts, on > .5 ? '#f4f2e8' : '#9a98a0', 'rgba(110,110,125,.55)', 1.6);
  if (on > 0) poly([p2(X - w * .78, ch - 3, Z + d * .15), p2(X + w * .78, ch - 3, Z + d * .15), p2(X + w * .78, ch - 3, Z + d * .85), p2(X - w * .78, ch - 3, Z + d * .85)], `rgba(255,252,238,${.5 + .4 * on})`);
  const [lx, ly] = p2(X, ch - 2, Z + d / 2), k = kz(Z + d / 2);
  if (on > 0) { V2.glow(lx, ly, 230 * k, color, .14 * on, 'screen', .35); }
}

// ------------------------------------------------------------------ furniture
function chair3(X, Z, o = {}) {
  const w = o.w ?? 46, d = o.d ?? 46, seat = o.seat ?? 120, back = o.back ?? 230, c = o.color ?? '#8a5a34', leg = '#3a3a44';
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box3({ x0: X + dx * (w - 6) - 4, x1: X + dx * (w - 6) + 4, y1: seat, z0: Z + dz * (d - 6) - 4, z1: Z + dz * (d - 6) + 4, color: leg, lw: 1 });
  box3({ x0: X - w, x1: X + w, y0: seat, y1: seat + 16, z0: Z - d, z1: Z + d, color: c });
  box3({ x0: X - w, x1: X + w, y0: seat + 16, y1: back, z0: Z + d - 10, z1: Z + d, color: c, top: lit(c, 1.1) });
}
function table3(X, Z, o = {}) {
  const w = o.w ?? 190, d = o.d ?? 110, h = o.h ?? 190, c = o.color ?? '#c9a26a';
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box3({ x0: X + dx * (w - 16) - 7, x1: X + dx * (w - 16) + 7, y1: h, z0: Z + dz * (d - 16) - 7, z1: Z + dz * (d - 16) + 7, color: '#6a5a4a', lw: 1 });
  box3({ x0: X - w, x1: X + w, y0: h, y1: h + 16, z0: Z - d, z1: Z + d, color: c, top: lit(c, 1.18) });
}
function plant3(X, Z, s = 1) {
  const k = kz(Z), [x, y] = p2(X, 0, Z), sc = k * s;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 4, 56, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b5683a'; ctx.strokeStyle = 'rgba(25,16,30,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-34, -70); ctx.lineTo(34, -70); ctx.lineTo(26, 0); ctx.lineTo(-26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 9; i++) { const a = -2.5 + i * .62, L = 120 + (i % 3) * 36; ctx.save(); ctx.translate(0, -70); ctx.rotate(a * .55); ctx.fillStyle = i % 2 ? '#3f9a3a' : '#58b83a'; ctx.strokeStyle = '#143d12'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -L * .5, 0, -L); ctx.quadraticCurveTo(-26, -L * .5, 0, 0); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
function wallClock(X, Y, Z, side, min, hr, r = 46) {
  const k = kz(Z), [x, y] = p2(X, Y, Z);
  ctx.save(); ctx.translate(x, y); ctx.scale(k * r / 46, k * r / 46);
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; ell(0, 0, 46, 46); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = i % 3 ? 2 : 4; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 36, -Math.cos(a) * 36); ctx.lineTo(Math.sin(a) * 42, -Math.cos(a) * 42); ctx.stroke(); }
  ctx.strokeStyle = '#2a2530'; ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(min / 60 * TAU) * 32, -Math.cos(min / 60 * TAU) * 32); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin((hr + min / 60) / 12 * TAU) * 21, -Math.cos((hr + min / 60) / 12 * TAU) * 21); ctx.stroke();
  ctx.fillStyle = '#c1121f'; ell(0, 0, 4, 4); ctx.fill();
  ctx.restore();
}

// the smoke detector on the ceiling: a white disc, a blinking LED, and (optionally) its empty battery bay
function detector(X, Z, ch, o = {}) {
  const k = kz(Z), [x, y] = p2(X, ch, Z), r = 58 * k, sq = V2.P.cy < ch ? Math.min(1, (ch - V2.P.cy) / (Z - V2.P.cz) * 1.2) : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, Math.max(.28, Math.min(1, sq * 2.2)));
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.arc(2 * k, 4 * k, r * 1.1, 0, TAU); ctx.fill();
  ctx.fillStyle = grad(-r, -r, r, r, [[0, '#ffffff'], [1, '#cfd3d9']]); ctx.strokeStyle = 'rgba(40,40,50,.6)'; ctx.lineWidth = Math.max(1.5, 3 * k); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,60,70,.45)'; ctx.lineWidth = Math.max(1, 2 * k);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .5, Math.sin(a) * r * .5); ctx.lineTo(Math.cos(a) * r * .86, Math.sin(a) * r * .86); ctx.stroke(); }
  ctx.fillStyle = '#e4e7ec'; ctx.beginPath(); ctx.arc(0, 0, r * .32, 0, TAU); ctx.fill(); ctx.stroke();
  const led = o.led ?? 0;
  ctx.fillStyle = led > .05 ? `rgba(255,50,50,${.4 + .6 * led})` : '#4a1a1a'; ctx.beginPath(); ctx.arc(r * .62, -r * .18, Math.max(2.5, 6 * k), 0, TAU); ctx.fill();
  ctx.restore();
  if (led > .05) { V2.glow(x + r * .62, y - r * .18 * .6, 70 * k + 30, '255,60,60', .7 * led, 'screen', 1.2); }
  return [x, y, r];
}

// ------------------------------------------------------------------ the lobby, golden hour
function lobby(o = {}) {
  const zb = 1750, hw = 640, ch = 720, sun = o.sun ?? 1, doorOpen = o.doorOpen ?? 0, P = V2.P;
  shell({ zb, hw, ch, wall: '#f2dfbb', wain: '#7a5a46', floorA: '#e0cba2', floorB: '#b8996a', fog: '#f0c98e', fogAmt: .3, tile: 160, bright: 1.05, rail: 120, ceil: '#f3e6cc' });
  // the glass entrance: blown-out sun, a tree line and two cars as silhouettes
  const dx0 = -300, dx1 = 300, dy1 = 520;
  backWindow(zb, { x0: dx0, x1: dx1, y0: 0, y1: dy1, sky: ['#ffb36a', '#fff0cc'], mull: 4, sill: false, beam: '255,214,140', beamA: .0, curtains: false,
    draw: f => {
      const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
      ctx.fillStyle = grad(0, fy1, 0, fy0, [[0, '#ffb36a'], [.5, '#ffe2a8'], [1, '#fff6dc']]); ctx.fillRect(fx0, fy1, w, h);
      ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.moveTo(fx0, fy0 - h * .26); for (let i = 0; i <= 16; i++) ctx.lineTo(fx0 + w * i / 16, fy0 - h * (.26 + .1 * Math.sin(i * 1.9) + .05 * Math.sin(i * 4.1))); ctx.lineTo(fx1, fy0); ctx.lineTo(fx0, fy0); ctx.fill();
      ctx.fillStyle = '#3a2a2a'; ctx.fillRect(fx0, fy0 - h * .12, w, h * .12);
      ctx.fillStyle = '#b93a1c'; rr(fx0 + w * .1, fy0 - h * .22, w * .26, h * .12, h * .04); ctx.fill(); ctx.fillStyle = '#26427a'; rr(fx0 + w * .66, fy0 - h * .21, w * .24, h * .11, h * .04); ctx.fill();
            ctx.fillStyle = '#fff3d2'; ctx.beginPath(); ctx.arc(fx0 + w * .55, fy1 + h * .46, w * .075, 0, TAU); ctx.fill();
    } });
  { const pw = (dx1 - dx0) / 4, shift = doorOpen * pw * 1.15;
    for (const [a2, b2] of [[dx0, dx0 + pw * 2], [dx0 + pw * 2, dx1]]) { const s2 = a2 < 0 ? -shift : shift; onZ(zb, a2 + s2, b2 + s2, 0, dy1, 'rgba(205,228,240,.14)', 'rgba(25,16,30,.55)', 3.4); }
    onZ(zb, dx0 - 40, dx1 + 40, dy1 + 4, dy1 + 74, '#6d4b38', 'rgba(25,16,30,.55)', 2.4); }
  { const [sx, sy] = p2(0, dy1 + 39, zb), kk = kz(zb); ctx.fillStyle = '#f6e6c4'; ctx.font = `900 ${30 * kk}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '3px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.letterSpacing = '0px'; }
  // reception on the right, a bench and plants on the left
  box3({ x0: 230, x1: 590, y1: 200, z0: 960, z1: 1240, color: '#7a5a46', top: '#ecdcb4', frontGrad: [[0, '#8a6a52'], [1, '#6a4a36']], fog: { color: '#f0c98e', amt: .25, zFar: zb } });
  box3({ x0: 250, x1: 560, y0: 200, y1: 262, z0: 1040, z1: 1110, color: '#d9d4c8' });
  box3({ x0: -560, x1: -330, y1: 100, z0: 980, z1: 1180, color: '#a2503e', top: '#c0624c', fog: { color: '#f0c98e', amt: .25, zFar: zb } });
  plant3(-590, 1500, 1.0); plant3(590, 1550, 1.0);
  for (let i = 0; i < 7; i++) { const x = -520 + i * 173, [px, py] = p2(x, ch - 40, zb), k2 = kz(zb); ctx.fillStyle = ['#e8193a', '#ffd23a', '#58b83a', '#4a8ae8', '#ff9f1c', '#c25bd6', '#e8193a'][i]; ctx.beginPath(); ctx.moveTo(px - 34 * k2, py); ctx.lineTo(px + 34 * k2, py); ctx.lineTo(px, py + 80 * k2); ctx.closePath(); ctx.fill(); }
  for (const z of [300, 900, 1500]) { ceilingLamp(-260, z, ch, .8, '255,226,170'); ceilingLamp(260, z, ch, .8, '255,226,170'); }
  // the sun on the floor: a long bright wedge from the doors toward the camera, plus rays and a bloom at the opening
  const z0 = P.cz + 60;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const fa = p2(-300, 0, zb), fb = p2(300, 0, zb), fc2 = p2(520, 0, z0 + 200), fd = p2(-520, 0, z0 + 200);
  ctx.fillStyle = grad(0, fa[1], 0, fc2[1], [[0, `rgba(255,226,160,${.34 * sun})`], [.5, `rgba(255,214,140,${.14 * sun})`], [1, 'rgba(255,214,140,0)']]);
  ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc2); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore();
  const [bx, by] = p2(0, 240, zb), kb = kz(zb);
  V2.beam(bx, by, bx, by + 560, 560 * kb, 1100 * kb, '255,222,160', .13 * sun);
  V2.glow(bx, by, 700 * kb, '255,226,170', .3 * sun, 'screen', .5);
  // the interior falls into warm shadow away from the doors, so the sun reads as the only bright thing in the room
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = radial(bx, by + 100, 150, 1100, [[0, 'rgba(255,255,255,1)'], [.5, 'rgba(214,176,142,1)'], [1, 'rgba(118,84,72,1)']]); ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  return { zb, hw, ch, door: [bx, by] };
}

// ------------------------------------------------------------------ a resident's room (Room 12)
function patientRoom(o = {}) {
  const zb = 1900, hw = 420, ch = 600, T_ = o.t ?? 0;
  shell({ zb, hw, ch, wall: '#e6dcc4', wain: '#6c8f8a', floorA: '#cbbfa8', floorB: '#a39780', fog: '#c8b79c', fogAmt: .25, tile: 100, bright: 1.0, rail: 100 });
  backWindow(zb, { x0: -190, x1: 190, y0: 180, y1: 470, sky: ['#f6a65e', '#ffe3ae'], mull: 2, curtains: '#c25b4a', beam: '255,206,130', beamA: .26, beamLen: 800, beamDx: -60 });
  // bed on the right: frame, mattress, pillow, blanket; TV on the left wall; nightstand
  box3({ x0: 120, x1: 380, y1: 74, z0: 980, z1: 1560, color: '#7a6a5a', top: '#8a7a68' });
  box3({ x0: 126, x1: 374, y0: 74, y1: 134, z0: 990, z1: 1550, color: '#e7eef5', top: '#f4f8fb', side: '#cfd9e4' });
  box3({ x0: 126, x1: 374, y0: 134, y1: 150, z0: 1180, z1: 1550, color: '#5f9ea8', top: '#7cc0ca', side: '#4a8a94' });
  box3({ x0: 150, x1: 350, y0: 134, y1: 164, z0: 1000, z1: 1130, color: '#fff', top: '#fff', side: '#e8ecf2' });
  box3({ x0: 126, x1: 374, y0: 74, y1: 250, z0: 1550, z1: 1566, color: '#6a5a4a' });
  box3({ x0: 20, x1: 100, y1: 150, z0: 1420, z1: 1520, color: '#a98a62', top: '#c8a878' });
  // a wall-mounted TV and a call box
  { const z = 1000, X = -hw, a = [p2(X, 300, 1180), p2(X, 300, 1500), p2(X, 460, 1500), p2(X, 460, 1180)]; poly(a, '#15131c', 'rgba(255,255,255,.18)', 2); const g = ctx.createLinearGradient(...a[0], ...a[2]); g.addColorStop(0, 'rgba(120,150,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,.05)'); poly(a, g); void z; }
  ceilingLamp(0, 700, ch, .9, '255,236,200', 80, 130);
  return { zb, hw, ch };
}

// ------------------------------------------------------------------ the break room
function breakRoom(o = {}) {
  const zb = 2200, hw = 460, ch = 600, door = o.door ?? 0;
  shell({ zb, hw, ch, wall: '#e9dfc7', wain: '#c47a52', floorA: '#d2c6ad', floorB: '#a89c84', fog: '#bdb3a0', fogAmt: .22, tile: 110, bright: .98, rail: 100 });
  backWindow(zb, { x0: 80, x1: 320, y0: 200, y1: 470, sky: o.sky ?? ['#2b3a78', '#e98a5a'], mull: 2, beam: '255,170,110', beamA: .16, beamLen: 700, beamDx: -140 });
  // the doorway into the hall: closed it is a wood door, open it is a bright slab of hallway light
  { const x0 = -250, x1 = -110, y1 = 430;
    onZ(zb, x0 - 14, x1 + 14, 0, y1 + 14, '#e8dfc9', 'rgba(25,16,30,.6)', 2.4);
    if (door > .02) { const f = [p2(x0, 0, zb), p2(x1, 0, zb), p2(x1, y1, zb), p2(x0, y1, zb)]; poly(f, grad(0, f[2][1], 0, f[0][1], [[0, '#fff6dc'], [1, '#ffe9b8']])); V2.glow((f[0][0] + f[1][0]) / 2, (f[0][1] + f[2][1]) / 2, 420 * kz(zb), '255,240,200', .45 * door, 'screen', .6); }
    else { onZ(zb, x0, x1, 0, y1, '#a8744f', 'rgba(25,16,30,.6)', 2); onZ(zb, x0 + 14, x1 - 14, 60, 200, '#96623e', 'rgba(25,16,30,.35)', 1.4); onZ(zb, x0 + 14, x1 - 14, 250, 400, '#96623e', 'rgba(25,16,30,.35)', 1.4); } }
  // vending machine back left, fridge back right, counter along the right wall, a bulletin board and a clock on the left wall
  box3({ x0: -440, x1: -300, y1: 430, z0: 2000, z1: 2130, color: '#2f5fb0', front: '#3a6fc4', side: '#244a8a' });
  onZ(2000, -424, -318, 150, 400, 'rgba(210,235,255,.55)', 'rgba(15,20,40,.8)', 2);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) onZ(2000, -414 + c * 32, -394 + c * 32, 180 + r * 58, 212 + r * 58, ['#e8193a', '#ffd23a', '#58b83a', '#ff9f1c'][(r + c) % 4]);
  box3({ x0: 340, x1: 450, y1: 480, z0: 2040, z1: 2180, color: '#e9eef2', front: '#f4f7fa', side: '#c9d2d9' });
  onZ(2040, 350, 440, 235, 239, 'rgba(0,0,0,.25)'); onZ(2040, 352, 360, 300, 420, '#aab4bd');
  box3({ x0: 250, x1: 450, y1: 200, z0: 1100, z1: 2030, color: '#d9cdb4', top: '#6a5a4a', front: '#cbbd9e', side: '#a89a7e' });
  { const X = -hw, q = [p2(X, 250, 1250), p2(X, 250, 1750), p2(X, 450, 1750), p2(X, 450, 1250)]; poly(q, '#b98a5a', 'rgba(25,16,30,.7)', 3);
    const q2 = [p2(X, 262, 1262), p2(X, 262, 1738), p2(X, 438, 1738), p2(X, 438, 1262)]; poly(q2, '#d7b98a');
    for (const [z, y, c] of [[1330, 380, '#fff3a6'], [1470, 340, '#ffb3c6'], [1600, 390, '#bfe3ff'], [1690, 330, '#d8ffb0'], [1400, 290, '#ffe0a0']]) { const a2 = [p2(X, y, z - 36), p2(X, y, z + 36), p2(X, y + 56, z + 36), p2(X, y + 56, z - 36)]; poly(a2, c, 'rgba(25,16,30,.35)', 1.4); } }
  return { zb, hw, ch };
}

// the microwave itself (so a scene can light it and animate its display)
function microwave(X, Z, o = {}) {
  const w = 120, h = 80, y0 = 200, d = 70, on = o.on ?? 0, door = o.door ?? 0;
  const f = box3({ x0: X - w, x1: X + w, y0, y1: y0 + h * 2, z0: Z, z1: Z + d * 2, color: '#d5d9de', front: '#e6e9ed', side: '#a9b0b8', top: '#f0f2f4' });
  const win = [p2(X - w * .78, y0 + 22, Z), p2(X + w * .2, y0 + 22, Z), p2(X + w * .2, y0 + h * 2 - 22, Z), p2(X - w * .78, y0 + h * 2 - 22, Z)];
  poly(win, door > .02 ? '#2a1a12' : `rgb(${40 + 190 * on | 0},${30 + 150 * on | 0},${20 + 40 * on | 0})`, '#1a1820', 3);
  if (door > .02) {   // the cavity with a black bag of popcorn, and the door swung wide on its left hinge
    const cx = (win[0][0] + win[1][0]) / 2, cy = (win[0][1] + win[2][1]) / 2, k = kz(Z);
    ctx.fillStyle = '#15110e'; ctx.beginPath(); ctx.moveTo(cx - 52 * k, cy + 36 * k); ctx.lineTo(cx - 40 * k, cy - 40 * k); ctx.lineTo(cx + 40 * k, cy - 40 * k); ctx.lineTo(cx + 52 * k, cy + 36 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e2d2'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx - 30 * k + i * 12 * k, cy - 44 * k - (i % 2) * 6 * k, 7 * k, 6 * k, 0, 0, TAU); ctx.fill(); }
    const dw = (win[1][0] - win[0][0]) * door;
    poly([win[0], [win[0][0] - dw * .8, win[0][1] - 18 * k * door], [win[3][0] - dw * .8, win[3][1] + 18 * k * door], win[3]], 'rgba(60,64,72,.9)', '#1a1820', 3);
  } else if (on > 0) { const cx = (win[0][0] + win[1][0]) / 2, cy = (win[0][1] + win[2][1]) / 2; V2.glow(cx, cy, 340 * kz(Z) * 1.2, '255,190,90', .75 * on, 'screen', .5); }
  const panel = [p2(X + w * .3, y0 + 22, Z), p2(X + w * .94, y0 + 22, Z), p2(X + w * .94, y0 + h * 2 - 22, Z), p2(X + w * .3, y0 + h * 2 - 22, Z)];
  poly(panel, '#2b2f38', '#15171c', 2.2);
  const [dx, dy] = p2(X + w * .62, y0 + h * 2 - 52, Z), k = kz(Z);
  ctx.fillStyle = '#071a0c'; ctx.fillRect(dx - 34 * k, dy - 16 * k, 68 * k, 32 * k);
  ctx.fillStyle = '#58ff7a'; ctx.font = `900 ${28 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.display ?? '0:00', dx, dy + 1);
  if (o.display && on > 0) V2.emit(dx, dy, 60 * k, '88,255,122', .4);
  return { win, panel, disp: [dx, dy], k };
}

// ------------------------------------------------------------------ the parking lot at dusk
// a parked car seen from behind: body, cabin, rear glass, tail lights, plate and wheels, all true boxes so it sits in the same perspective
function car3(X, Z, o = {}) {
  const w = o.w ?? 165, len = o.len ?? 440, c = o.color ?? '#2c8f9a', brake = o.brake ?? .35, fog = { color: '#4a3a7a', amt: .5, zFar: 2200 };
  for (const sx of [-1, 1]) box3({ x0: sx < 0 ? X - w - 6 : X + w - 34, x1: sx < 0 ? X - w + 34 : X + w + 6, y1: 64, z0: Z + 70, z1: Z + 160, color: '#16141c', lw: 1.2, fog });
  box3({ x0: X - w, x1: X + w, y0: 30, y1: 120, z0: Z, z1: Z + len, color: c, front: lit(c, 1.0), side: lit(c, .66), top: lit(c, 1.24), fog });
  box3({ x0: X - w * .74, x1: X + w * .74, y0: 120, y1: 204, z0: Z + len * .16, z1: Z + len * .66, color: c, front: lit(c, .92), side: lit(c, .64), top: lit(c, 1.3), fog });
  { const a = [p2(X - w * .64, 128, Z + len * .16), p2(X + w * .64, 128, Z + len * .16), p2(X + w * .64, 196, Z + len * .16), p2(X - w * .64, 196, Z + len * .16)];
    poly(a, grad(0, a[2][1], 0, a[0][1], [[0, '#2a3a66'], [1, '#101628']]), 'rgba(10,8,20,.7)', 2); }
  box3({ x0: X - w - 2, x1: X + w + 2, y0: 22, y1: 46, z0: Z - 14, z1: Z + 6, color: lit(c, .5), lw: 1.4 });
  const k = kz(Z);
  for (const [a, b] of [[X - w + 8, X - w + 66], [X + w - 66, X + w - 8]]) { onZ(Z - 14, a, b, 62, 100, `rgb(${255},${58 + 120 * (1 - brake) | 0},${58 + 120 * (1 - brake) | 0})`, 'rgba(20,8,12,.7)', 1.6); const [gx, gy] = p2((a + b) / 2, 81, Z - 14); V2.glow(gx, gy, 90 * k, '255,50,50', .5 + .5 * brake, 'screen', .7); }
  onZ(Z - 14, X - 34, X + 34, 48, 78, '#f0eee4', 'rgba(20,16,24,.7)', 1.6);
}
// a tall lamp post with an arm toward the lot: a hot lamp head, a bloom and a pool of light on the asphalt
function lampPost(X, Z, o = {}) {
  const h = o.h ?? 760, side = X < 0 ? 1 : -1, k = kz(Z), on = o.on ?? 1;
  box3({ x0: X - 8, x1: X + 8, y1: h, z0: Z, z1: Z + 16, color: '#2a2833', front: '#35333f', side: '#1d1b25', lw: 1.2 });
  box3({ x0: Math.min(X, X + side * 100), x1: Math.max(X, X + side * 100), y0: h - 8, y1: h + 8, z0: Z - 6, z1: Z + 22, color: '#2a2833', lw: 1.2 });
  const hx = X + side * 104, [lx, ly] = p2(hx, h - 12, Z + 8);
  ctx.fillStyle = `rgba(255,246,214,${.4 + .6 * on})`; ctx.beginPath(); ctx.ellipse(lx, ly + 2 * k, 30 * k, 9 * k, 0, 0, TAU); ctx.fill();
  V2.glow(lx, ly, 420 * k, '255,226,160', .8 * on, 'screen', .9);
  const [gx, gy] = p2(hx, 0, Z + 8);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = radial(gx, gy, 10, 440 * k, [[0, `rgba(255,226,170,${.3 * on})`], [1, 'rgba(255,226,170,0)']]);
  ctx.beginPath(); ctx.ellipse(gx, gy, 470 * k, 96 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
}
// ------------------------------------------------------------------ the parking lot, dusk: sky and moon, the building, cars, lamps and a wash of fire-engine light
function lot(o = {}) {
  const t = o.t ?? 0, flash = o.flash ?? 0, ph = o.ph ?? Math.sin(t * 9) > 0, Zb = 2100, hy = V2.P.hy;
  // sky: indigo to rose to a low orange glow, stars, and the full moon coming up over the roof
  ctx.fillStyle = grad(0, 0, 0, hy + 120, [[0, '#121846'], [.45, '#4a3a86'], [.8, '#b5588f'], [1, '#ff9f7a']]); ctx.fillRect(-100, -100, W + 200, hy + 340);
  ctx.fillStyle = '#f3e6ff'; for (let i = 0; i < 46; i++) { const x = hash(i) * W, y = hash(i + 70) * 560; ctx.globalAlpha = (.25 + .55 * hash(i + 9)) * (.75 + .25 * Math.sin(t * 2 + i)); ctx.fillRect(x, y, 3, 3); } ctx.globalAlpha = 1;
  { const mx = 862, my = 410, r = 118;
    V2.glow(mx, my, r * 3.4, '255,236,200', .55, 'screen', 1.1);
    ctx.fillStyle = grad(mx - r, my - r, mx + r, my + r, [[0, '#fffbe8'], [1, '#f2dcae']]); ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(190,160,120,.28)'; for (const [dx, dy, rr2] of [[-40, -30, 30], [34, 18, 24], [-6, 52, 18], [52, -48, 14], [-62, 30, 12]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, rr2, 0, TAU); ctx.fill(); } }
  // the building across the lot
  const k = kz(Zb), hw = 1500, bh = 640;
  { const a = p2(-hw, 0, Zb), b = p2(hw, bh, Zb);
    onZ(Zb, -hw, hw, 0, bh, grad(0, b[1], 0, a[1], [[0, '#3c3858'], [1, '#6a6488']]));
    onZ(Zb, -hw, hw, bh - 36, bh + 20, '#2c2842', 'rgba(10,8,20,.6)', 2);
    onZ(Zb, -hw, hw, 0, 34, '#58526f'); }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
    const x0 = -1120 + c * 250, y0 = [130, 310, 490][r], litw = hash(r * 9 + c + 3) > .22 ? 1 : 0;
    if (Math.abs(x0 + 62) < 260 && r === 0) continue;
    onZ(Zb, x0, x0 + 124, y0, y0 + 110, litw ? (hash(r * 9 + c + 40) > .5 ? '#ffe2a0' : '#ffd07a') : '#26243e', 'rgba(10,8,20,.65)', 2.2);
    if (litw) { onZ(Zb, x0 + 60, x0 + 64, y0, y0 + 110, 'rgba(60,40,70,.5)'); onZ(Zb, x0, x0 + 124, y0 + 52, y0 + 56, 'rgba(60,40,70,.5)'); const [gx, gy] = p2(x0 + 62, y0 + 55, Zb); V2.glow(gx, gy, 150 * k, '255,200,120', .26, 'screen', .5); }
  }
  // the entrance: warm glass doors under a canopy, and the sign
  onZ(Zb, -190, 190, 0, 260, grad(0, p2(0, 260, Zb)[1], 0, p2(0, 0, Zb)[1], [[0, '#ffd890'], [1, '#fff2cc']]), 'rgba(10,8,20,.7)', 3);
  onZ(Zb, -4, 4, 0, 260, 'rgba(60,40,70,.6)'); onZ(Zb, -190, 190, 128, 132, 'rgba(60,40,70,.5)');
  { const [gx, gy] = p2(0, 120, Zb); V2.glow(gx, gy, 420 * k, '255,220,150', .5, 'screen', .8); }
  box3({ x0: -270, x1: 270, y0: 268, y1: 296, z0: Zb - 170, z1: Zb, color: '#2c2842', top: '#3c3858', lw: 1.6 });
  for (const x of [-380, 380]) onZ(Zb, x - 12, x + 12, bh + 12, bh + 52, '#2c2842');
  onZ(Zb, -440, 440, bh + 44, bh + 134, '#1e1a34', 'rgba(255,226,170,.55)', 2.6);
  { const [sx, sy] = p2(0, bh + 89, Zb); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 16; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${42 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${4 * k}px`; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  // asphalt, with stall lines in true perspective
  { const yb = p2(0, 0, Zb)[1]; ctx.fillStyle = grad(0, yb - 2, 0, H, [[0, '#4a4660'], [.5, '#2d2a3d'], [1, '#1a1826']]); ctx.fillRect(-100, yb - 2, W + 200, H - yb + 120); }
  ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 7; ctx.lineCap = 'butt';
  for (const x of [-780, -390, 0, 390, 780]) { const a = p2(x, 0, 1350), b = p2(x, 0, Zb - 60); ctx.lineWidth = Math.max(2, 9 * kz(1350)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  { const a = p2(-1100, 0, 1350), b = p2(1100, 0, 1350); ctx.lineWidth = Math.max(2, 9 * kz(1350)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  // cars in their stalls and the lamp posts
  car3(-585, 1480, { color: '#2c8f9a', brake: .2 }); car3(195, 1560, { color: '#8a2d46', brake: .2, w: 160 }); car3(-195, 1700, { color: '#c9a23a', brake: .2, w: 150 }); car3(780, 1500, { color: '#3b4a9a', brake: .2 });
  lampPost(-720, 1250, {}); lampPost(720, 1300, {});
  // the fire engine's lights wash the lot alternately red and blue
  if (flash > 0) { const c = ph ? '255,40,50' : '60,120,255', c2 = ph ? '60,120,255' : '255,40,50';
    V2.glow(ph ? 40 : 1040, 1040, 640, c, .7 * flash, 'screen', 1.0); V2.glow(ph ? 1040 : 40, 1100, 380, c2, .22 * flash, 'screen', .6);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = ph ? `rgba(255,40,50,${.09 * flash})` : `rgba(50,110,255,${.09 * flash})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// the nurses' station: a counter along the left wall of the hall with a monitor, a phone, and the call-light panel on the wall
function stationDesk(o = {}) {
  const X0 = -330, X1 = -190, Z0 = 560, Z1 = 1500, lamps = o.lamps ?? [];
  if (Z0 < V2.P.cz + 150) return;   // the camera has dollied past the desk
  box3({ x0: X0, x1: X1, y1: 205, z0: Z0, z1: Z1, color: '#c9a26a', top: '#ecdcb4', front: '#b88c58', side: '#9a7444' });
  box3({ x0: X0, x1: X1 - 24, y0: 205, y1: 232, z0: Z0 + 20, z1: Z1 - 20, color: '#8a6a44', top: '#a9835a' });
  // monitor and phone on the counter
  box3({ x0: -300, x1: -240, y0: 232, y1: 330, z0: 880, z1: 905, color: '#20242c', front: '#1a1d24' });
  { const a = [p2(-292, 240, 878), p2(-248, 240, 878), p2(-248, 322, 878), p2(-292, 322, 878)]; poly(a, grad(0, a[2][1], 0, a[0][1], [[0, '#1c4a7a'], [1, '#2a78b8']])); }
  box3({ x0: -296, x1: -250, y0: 232, y1: 250, z0: 1080, z1: 1130, color: '#d9d9de', front: '#e8e8ee' });
  // the call-light panel: rows of numbered lamps that follow the domes
  const px0 = 640, px1 = 1160, py0 = 300, py1 = 470, X = -HW_ ;
  const pts = [p2(X, py0, px0), p2(X, py0, px1), p2(X, py1, px1), p2(X, py1, px0)];
  poly(pts, '#20242c', 'rgba(255,255,255,.18)', 2.4);
  const nRooms = 12;
  for (let i = 0; i < nRooms; i++) {
    const zz = px0 + 40 + (i % 6) * 85, yy = i < 6 ? 425 : 345, l = lamps[i] ?? 0, c = o.colors?.[i] ?? '255,170,60';
    const [lx, ly] = p2(X, yy, zz), k = kz(zz);
    ctx.fillStyle = l > 0 ? `rgb(${c})` : '#3a3f48'; ctx.beginPath(); ctx.ellipse(lx, ly, 16 * k * .62, 22 * k, 0, 0, TAU); ctx.fill();
    if (l > 0) V2.glow(lx, ly, 70 * k, c, .8 * l, 'screen', .5);
  }
}
const HW_ = 330;

Object.assign(window.S6, { car3, lampPost, stationDesk, box3, shell, backWindow, ceilingLamp, chair3, table3, plant3, wallClock, detector, lobby, patientRoom, breakRoom, microwave, lot, lit, onZ, kz });
})();
