'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scene: arrival (2:58 PM, THE FRONT DOOR).  [blocking pass 2: the set]
 * The mirror of Episode 9's arrival: the same lobby dressed for a party, but now the guest of honour is Strawberry, back as per diem,
 * and the one watching with somebody else's badge on her chest is Clementine. Every position is a world coordinate: X right, Z forward (V2.at). */
(() => { if (!window.TIMELINE_EP11) return;
const { person, zoomTo, faceZoom, drawBg, inB, faceC, localOf, localToScreen } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S6 = window.S6;
const { mango } = A7, persimmon = A9.persimmon, melon = A9.melon, straw = A11.straw, clem = A11.clem;
const { p2, poly, quad3, grad, radial } = V2;
const { box3, onZ, kz, shell, backWindow, ceilingLamp, plant3, table3, wallClock } = S6;

// ---- helpers -------------------------------------------------------------------------------------------------------------------------------------------
const wordT = (id, word) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return l.s - CUR.start + w[1]; };
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const nbr = o => V2.dof(6, () => drawBg(o));
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const lerpA2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const toScr = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
// an onomatopoeia that pops in and fades (as in ep9.js)
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}

// ---- props ---------------------------------------------------------------------------------------------------------------------------------------------
// a wicker gift basket with cellophane, a red bow and fruit (copied from ep9_arrival.js). Origin: bottom centre; about 190 units tall
function drawBasket(t) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#c8924e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(44, 0); ctx.lineTo(54, -56); ctx.lineTo(-54, -56); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(100,56,14,.55)'; ctx.lineWidth = 3; for (const y of [-14, -28, -42]) { ctx.beginPath(); ctx.moveTo(-60, y); ctx.lineTo(60, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,230,170,.35)'; for (let r = 0; r < 4; r++) for (let x = -50 + (r % 2) * 9; x < 56; x += 18) { ctx.beginPath(); ctx.moveTo(x, -r * 14); ctx.lineTo(x, -r * 14 - 12); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = '#a8702e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-58, -66, 116, 13, 5); ctx.fill(); ctx.stroke();
  const fr = (x, y, r, c1, c2) => { ctx.fillStyle = V2.grad(x - r, y - r, x + r, y + r, [[0, c1], [1, c2]]); ell(x, y, r, r * .96); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(x - r * .35, y - r * .4, r * .22, r * .14); ctx.fill(); };
  fr(-28, -78, 19, '#ff7a86', '#d4182c'); fr(16, -82, 18, '#ffc15a', '#f07c10'); fr(-2, -96, 15, '#e6f58a', '#8ab824');
  ctx.strokeStyle = '#6b8a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-28, -97); ctx.quadraticCurveTo(-26, -106, -20, -108); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.fillStyle = '#f7d84a'; ctx.beginPath(); ctx.moveTo(36, -68); ctx.quadraticCurveTo(54, -84, 50, -110); ctx.quadraticCurveTo(40, -90, 28, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(232,244,255,.34)'; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-54, -62); ctx.bezierCurveTo(-72, -96, -42, -128, -12, -150); ctx.lineTo(12, -150); ctx.bezierCurveTo(42, -128, 72, -96, 54, -62); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 30, -70); ctx.quadraticCurveTo(s * 34, -110, s * 8, -146); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -150); ctx.lineTo(i * 9, -176 - (i % 2 ? 0 : 8)); ctx.stroke(); }
  ctx.fillStyle = '#e8283a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
  ctx.save(); ctx.translate(0, -150); for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * .5); ell(s * 24, 0, 24, 12); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-24, 36); ctx.lineTo(-12, 32); ctx.lineTo(-6, 42); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(22, 34); ctx.lineTo(12, 30); ctx.lineTo(8, 40); ctx.lineTo(-3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8101f'; ell(0, 0, 9, 9); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(-50, -62); ctx.bezierCurveTo(-58, -200, 58, -200, 50, -62); ctx.stroke();
  ctx.strokeStyle = '#c8924e'; ctx.lineWidth = 8; ctx.stroke();
  const tw = .5 + .5 * Math.sin(t * 4.2); ctx.fillStyle = `rgba(255,255,255,${.35 + .6 * tw})`; ctx.save(); ctx.translate(-26, -112); ctx.rotate(.4); ctx.fillRect(-1.8, -8 * tw - 3, 3.6, 16 * tw + 6); ctx.fillRect(-8 * tw - 3, -1.8, 16 * tw + 6, 3.6); ctx.restore();
  ctx.restore();
}

// ---- the lobby ---------------------------------------------------------------------------------------------------------------------------------------
const CARPET_HW = 118;
function carpet() {
  const zN = V2.P.cz + 70, zF = 1748, a = p2(-CARPET_HW, 0, zF), c = p2(CARPET_HW, 0, zN);
  quad3([-CARPET_HW, 0, zF], [CARPET_HW, 0, zF], [CARPET_HW, 0, zN], [-CARPET_HW, 0, zN], grad(0, a[1], 0, Math.max(c[1], H), [[0, '#d42a3c'], [.5, '#b3152c'], [1, '#8a0f22']]), 'rgba(40,0,10,.55)', 2);
  for (const s of [-1, 1]) { quad3([s * (CARPET_HW - 13), .4, zF], [s * CARPET_HW, .4, zF], [s * CARPET_HW, .4, zN], [s * (CARPET_HW - 13), .4, zN], '#e9c34c'); quad3([s * (CARPET_HW - 22), .4, zF], [s * (CARPET_HW - 19), .4, zF], [s * (CARPET_HW - 19), .4, zN], [s * (CARPET_HW - 22), .4, zN], 'rgba(233,195,76,.8)'); }
  ctx.strokeStyle = 'rgba(70,0,14,.28)'; ctx.lineWidth = 2;
  for (let z = 1700; z > zN; z -= 90) { const l = p2(-CARPET_HW + 24, .4, z), r = p2(CARPET_HW - 24, .4, z); ctx.lineWidth = Math.max(1, 2.4 * kz(z)); ctx.beginPath(); ctx.moveTo(...l); ctx.lineTo(...r); ctx.stroke(); }
  for (const s of [-1, 1]) quad3([s * CARPET_HW, 0, zF], [s * (CARPET_HW + 12), 0, zF], [s * (CARPET_HW + 12), 0, zN], [s * CARPET_HW, 0, zN], 'rgba(60,20,20,.16)');
}
function stanchion(X, Z) {
  const k = kz(Z), [x, y] = p2(X, 0, Z);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(30,10,10,.25)'; ell(8, 4, 34, 9); ctx.fill();
  const g = V2.grad(-14, 0, 14, 0, [[0, '#a8801c'], [.4, '#ffe58a'], [1, '#8a6410']]);
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(30,18,6,.75)'; ctx.lineWidth = 2.6;
  ell(0, -4, 28, 10); ctx.fill(); ctx.stroke();
  rr(-5.5, -96, 11, 92, 3); ctx.fill(); ctx.stroke();
  ell(0, -100, 12, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(-4, -104, 3.5, 3.5); ctx.fill();
  ctx.restore();
}
function rope(X, Z0, Z1) {
  const a = p2(X, 90, Z0), b = p2(X, 90, Z1), m = p2(X, 66, (Z0 + Z1) / 2), k = kz((Z0 + Z1) / 2);
  ctx.save(); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2, ...b);
  ctx.strokeStyle = 'rgba(30,0,8,.8)'; ctx.lineWidth = 9 * k + 2; ctx.stroke(); ctx.strokeStyle = '#c4162f'; ctx.lineWidth = 7 * k; ctx.stroke(); ctx.restore();
}
// balloon clusters: six on strings from a gold weight. pops[i] is the scene time balloon i bursts (a ring, scraps and a recoil in its neighbours)
const BAL_COLS = ['#ff4f6d', '#ffd23a', '#4aa8ff', '#58c85a', '#c25bd6', '#ff9f1c'];
const balPos = (Xc, Zc, t, seed, i, pops, lt) => {
  let recoil = 0;
  if (pops) for (let j = 0; j < 6; j++) if (j !== i && pops[j] != null && lt > pops[j]) recoil += Math.exp(-(lt - pops[j]) * 4.5) * Math.sin((lt - pops[j]) * 26 + j) * 15;
  const bob = Math.sin(t * 1.5 + i * 1.3 + seed) * 13, sway = Math.sin(t * 1.05 + i * .9 + seed) * 9 + recoil;
  return { x: Xc + (i - 2.5) * 36 + sway, y: 330 + (i % 3) * 58 + (i === 1 || i === 4 ? 40 : 0) + bob, z: Zc + (i % 2) * 20 };
};
function balloons(Xc, Zc, t, seed, pops, lt) {
  const k = kz(Zc), w = p2(Xc, 0, Zc);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(w[0], w[1]); ctx.scale(k, k); rr(-22, -26, 44, 26, 5); ctx.fill(); ctx.stroke(); ctx.restore();
  const list = [];
  for (let i = 0; i < 6; i++) list.push(Object.assign({ i }, balPos(Xc, Zc, t, seed, i, pops, lt)));
  list.sort((a, b) => b.z - a.z);
  for (const b of list) {
    const q = p2(b.x, b.y, b.z), kk = kz(b.z), R = 62 * kk, pt = pops && pops[b.i] != null ? lt - pops[b.i] : -1;
    if (pt >= 0) {   // burst: a quick ring and four scraps of rubber, then a limp knot on the string
      if (pt < .5) {
        const f = pt / .5; ctx.save(); ctx.globalAlpha = 1 - f;
        ctx.strokeStyle = BAL_COLS[b.i]; ctx.lineWidth = 7 * (1 - f) + 2; ctx.beginPath(); ctx.arc(q[0], q[1], R * (.9 + .9 * easeOut(f)), 0, TAU); ctx.stroke();
        for (let s = 0; s < 5; s++) { const a = s / 5 * TAU + b.i; ctx.save(); ctx.translate(q[0] + Math.cos(a) * R * (.8 + 1.3 * easeOut(f)), q[1] + Math.sin(a) * R * (.8 + 1.3 * easeOut(f)) + 140 * f * f); ctx.rotate(a + f * 5); ctx.fillStyle = BAL_COLS[b.i]; ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -R * .22); ctx.lineTo(R * .2, R * .12); ctx.lineTo(-R * .16, R * .1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kk); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * k); ctx.quadraticCurveTo(lerp(w[0], q[0], .35) + 10 * Math.sin(t + b.i), lerp(w[1], q[1], .35) + 30, lerp(w[0], q[0], .6), lerp(w[1], q[1], .62) + 70 * kk); ctx.stroke();
      continue;
    }
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kk); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * k); ctx.quadraticCurveTo(lerp(w[0], q[0], .5) + 16 * Math.sin(t + b.i), lerp(w[1], q[1], .6), q[0], q[1] + R * 1.12); ctx.stroke();
    ctx.fillStyle = V2.radial(q[0] - R * .3, q[1] - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, BAL_COLS[b.i]], [1, V2.rgba(V2.mix(BAL_COLS[b.i], '#2a1030', .45), 1)]]);
    ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = Math.max(2, 2.6 * kk); ell(q[0], q[1], R * .82, R); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BAL_COLS[b.i]; ctx.beginPath(); ctx.moveTo(q[0] - 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0] + 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0], q[1] + R * 1.0 + 11 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(q[0] - R * .36, q[1] - R * .46, R * .14, R * .26, -.5); ctx.fill();
  }
  ctx.restore();
}
// the banner: one R short, exactly as the cake was. The letters are sized to fit the cloth, so nothing is ever squeezed
const BANNER = 'WELCOME BACK STRAWBERY';
function banner(t) {
  const Z = 1250, X0 = -470, X1 = 470, Y0 = 604, Y1 = 690, k = kz(Z), wv = x => 5 * k * Math.sin(x * .009 + t * 1.8);
  const tl = p2(X0, Y1, Z), tr = p2(X1, Y1, Z), bl = p2(X0, Y0, Z), br = p2(X1, Y0, Z);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(50,40,40,.7)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, X0], [tr, X1]]) { const c = p2(X, 720, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = V2.grad(0, tl[1], 0, bl[1], [[0, '#e93a8a'], [1, '#b0185f']]); ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = Math.max(4, 8 * k);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0)); for (let i = 1; i <= 24; i++) ctx.lineTo(lerp(tl[0], tr[0], i / 24), tl[1] + wv(i * 36)); for (let i = 24; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / 24), bl[1] + wv(i * 36 + 90)); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.save(); ctx.translate((tl[0] + tr[0]) / 2, (tl[1] + bl[1]) / 2 + 1.5 * k);
  { const sz = 74 * k; ctx.font = `400 ${sz}px Bangers`; ctx.letterSpacing = '3px'; const w0 = ctx.measureText(BANNER).width; ctx.letterSpacing = '0px'; const maxW = (tr[0] - tl[0]) * .92;
    text(BANNER, 0, 0, { size: w0 > maxW ? sz * maxW / w0 : sz, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 7 * k, stroke: '#6a0c3a', spacing: 3, maxW: maxW * 1.02 }); }
  ctx.restore();
  for (let i = 0; i < 11; i++) { const u = (i + .5) / 11, px = lerp(bl[0], br[0], u), py = bl[1] + wv(u * 24 * 36 + 90) + 3; ctx.fillStyle = ['#ffd23a', '#4aa8ff', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 16 * k, py); ctx.lineTo(px + 16 * k, py); ctx.lineTo(px, py + 34 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
const TABLE = [360, 1560];
function tableSet(o, t) {
  const [X, Z] = o.at || TABLE, k = kz(Z);
  table3(X, Z, { w: 140, d: 70, h: 160, color: '#b98a5a' });
  box3({ x0: X - 150, x1: X + 150, y0: 112, y1: 176, z0: Z - 78, z1: Z + 78, color: '#f6f2e8', top: '#fffdf6', front: '#f3efe4', side: '#d8d2c4' });
  onZ(Z - 78, X - 150, X + 150, 116, 132, '#d6202e');
  if (o.basket) { const q = p2(X - 62, 176, Z); ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(k * .86, k * .86); drawBasket(t); ctx.restore(); }
}

// a copy of Episode 6's lobby (S6.lobby) in bright daylight, dressed for a party (the Episode 9 version with the Episode 11 banner and a different car at the kerb)
function lobby11(o = {}) {
  const zb = 1750, hw = 640, ch = 720, sun = o.sun ?? 1, doorOpen = o.doorOpen ?? 0, P = V2.P, t = o.t ?? 0;
  shell({ zb, hw, ch, wall: '#f5ead2', wain: '#7a5a46', floorA: '#ead8b0', floorB: '#bfa070', fog: '#f1e4c6', fogAmt: .26, tile: 160, bright: 1.05, rail: 120, ceil: '#f7eedc' });
  const dx0 = -300, dx1 = 300, dy1 = 520;
  backWindow(zb, { x0: dx0, x1: dx1, y0: 0, y1: dy1, sky: ['#6fbaf8', '#f2faff'], mull: 4, sill: false, beam: '255,240,200', beamA: 0, curtains: false,
    draw: f => {
      const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
      ctx.fillStyle = grad(0, fy1, 0, fy0, [[0, '#6fbaf8'], [.55, '#cfeaff'], [1, '#fffbe8']]); ctx.fillRect(fx0, fy1, w, h);
      ctx.fillStyle = '#4b8a42'; ctx.beginPath(); ctx.moveTo(fx0, fy0 - h * .26); for (let i = 0; i <= 16; i++) ctx.lineTo(fx0 + w * i / 16, fy0 - h * (.26 + .1 * Math.sin(i * 1.9) + .05 * Math.sin(i * 4.1))); ctx.lineTo(fx1, fy0); ctx.lineTo(fx0, fy0); ctx.fill();
      ctx.fillStyle = '#4a4650'; ctx.fillRect(fx0, fy0 - h * .12, w, h * .12);
      // the car at the kerb is a SHIFTGO: a black sedan with the violet dome on its roof (the app that took her back); the other one is a blue hatchback
      { const cx = fx0 + w * .1, cy = fy0 - h * .22, cw = w * .3, ch2 = h * .1;
        ctx.fillStyle = '#1b1824'; rr(cx, cy, cw, ch2, h * .035); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + cw * .2, cy + 1); ctx.lineTo(cx + cw * .3, cy - ch2 * .62); ctx.lineTo(cx + cw * .72, cy - ch2 * .62); ctx.lineTo(cx + cw * .84, cy + 1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7f9cc8'; ctx.beginPath(); ctx.moveTo(cx + cw * .26, cy - ch2 * .04); ctx.lineTo(cx + cw * .34, cy - ch2 * .52); ctx.lineTo(cx + cw * .5, cy - ch2 * .52); ctx.lineTo(cx + cw * .5, cy - ch2 * .04); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + cw * .54, cy - ch2 * .04); ctx.lineTo(cx + cw * .54, cy - ch2 * .52); ctx.lineTo(cx + cw * .7, cy - ch2 * .52); ctx.lineTo(cx + cw * .79, cy - ch2 * .04); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6c4bff'; rr(cx + cw * .44, cy - ch2 * .84, cw * .14, ch2 * .24, 3); ctx.fill();
        ctx.fillStyle = '#0d0b14'; for (const fxx of [.22, .76]) { ell(cx + cw * fxx, cy + ch2 * .96, ch2 * .34, ch2 * .34); ctx.fill(); }
        ctx.fillStyle = '#c0c6cf'; for (const fxx of [.22, .76]) { ell(cx + cw * fxx, cy + ch2 * .96, ch2 * .15, ch2 * .15); ctx.fill(); } }
      ctx.fillStyle = '#26427a'; rr(fx0 + w * .66, fy0 - h * .21, w * .24, h * .11, h * .04); ctx.fill();
      ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(fx0 + w * .55, fy1 + h * .46, w * .085, 0, TAU); ctx.fill();
    } });
  if (o.behindDoor) o.behindDoor();   // whoever stands outside is drawn here: in front of the street, behind the glass
  { const pw = (dx1 - dx0) / 4, shift = doorOpen * pw * 1.15;
    for (const [a2, b2] of [[dx0, dx0 + pw * 2], [dx0 + pw * 2, dx1]]) { const s2 = a2 < 0 ? -shift : shift; onZ(zb, a2 + s2, b2 + s2, 0, dy1, 'rgba(205,228,240,.16)', 'rgba(25,16,30,.55)', 3.4); }
    onZ(zb, dx0 - 40, dx1 + 40, dy1 + 4, dy1 + 74, '#6d4b38', 'rgba(25,16,30,.55)', 2.4); }
  { const [sx, sy] = p2(0, dy1 + 39, zb), kk = kz(zb); ctx.fillStyle = '#f6e6c4'; ctx.font = `900 ${30 * kk}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '3px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.letterSpacing = '0px'; }
  wallClock(470, 470, zb, 1, 58, 2, 52);
  plant3(-590, 1500, 1.0); plant3(590, 1550, 1.0);
  for (let i = 0; i < 7; i++) { const x = -520 + i * 173, [px, py] = p2(x, ch - 40, zb), k2 = kz(zb); ctx.fillStyle = ['#e8193a', '#ffd23a', '#58b83a', '#4a8ae8', '#ff9f1c', '#c25bd6', '#e8193a'][i]; ctx.beginPath(); ctx.moveTo(px - 34 * k2, py); ctx.lineTo(px + 34 * k2, py); ctx.lineTo(px, py + 80 * k2); ctx.closePath(); ctx.fill(); }
  for (const z of [300, 900, 1500]) { ceilingLamp(-260, z, ch, .9, '255,240,210'); ceilingLamp(260, z, ch, .9, '255,240,210'); }
  // ---- the party
  carpet();
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const Z = 1650 - i * 150; if (i) rope(s * 150, Z + 150, Z); stanchion(s * 150, Z); }
  tableSet(o.table || {}, t);
  banner(t);
  balloons(-575, 1610, t, 0, o.popsL, o.lt ?? 0); balloons(575, 1610, t, 2.3, o.popsR, o.lt ?? 0);
  if (o.floorItems) o.floorItems();
  // ---- the sun on the floor: a long bright wedge from the doors toward the camera, plus rays and a bloom at the opening
  const z0 = P.cz + 60;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const fa = p2(-300, 0, zb), fb = p2(300, 0, zb), fc2 = p2(520, 0, z0 + 200), fd = p2(-520, 0, z0 + 200);
  ctx.fillStyle = grad(0, fa[1], 0, fc2[1], [[0, `rgba(255,248,214,${.3 * sun})`], [.5, `rgba(255,244,200,${.12 * sun})`], [1, 'rgba(255,240,200,0)']]);
  ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc2); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore();
  const [bx, by] = p2(0, 240, zb), kb = kz(zb);
  V2.beam(bx, by, bx, by + 560, 560 * kb, 1100 * kb, '255,246,214', .12 * sun);
  V2.glow(bx, by, 700 * kb, '255,248,222', .26 * sun, 'screen', .5);
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = radial(bx, by + 100, 150, 1250, [[0, 'rgba(255,255,255,1)'], [.5, 'rgba(240,230,214,1)'], [1, 'rgba(186,166,152,1)']]); ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  return { zb, hw, ch, door: [bx, by] };
}

const SCENES = {};
const SC = SCENES.arrival = {
  shot: lt => 'wide',
  cast(lt) {
    const at = (X, Z, o) => V2.at(X, Z, o);
    const cl = clem(Object.assign(at(330, 1090), { acc: ['steth', 'pricetag', 'badge7'], badgeText: 'NEW', look: [-.5, -.2] }));
    const mg = mango(Object.assign(at(560, 1180), { look: [-.5, 0] }));
    const ad = melon(Object.assign(at(-330, 965), { s: at(-330, 965).s * 1.14, look: [.5, 0] }));
    const pr = persimmon(Object.assign(at(-560, 1010), { look: [.5, 0], acc: ['perdiem9', 'airpods', 'shades9'], hold: { r: 'icedcup' }, grip: { r: [100, 72] }, arms: { l: 'rest', r: 'hold' } }));
    const sp = straw(Object.assign(at(60, 960), { look: [-.4, 0] }));
    return { cl, mg, ad, pr, sp };
  },
  cam(lt) { V2.setCam({ f: 1400, cy: 360, hy: 860, cz: -480 }); zoomTo(540, 975, .9); },
  draw(lt) {
    const C = SC.cast(lt), t = lt + 4;
    V2.setLight({ key: [-.35, -.8], keyColor: '#fff4dc', keyA: .26, rim: '#fff0c8', rimA: .55, shadow: '#3a2a40', shadowA: .3, bounce: '#ffe0b0', bounceA: .2, amb: '#fff6e6', ambA: .04 }); V2.opts.reflect = true;
    lobby11({ sun: 1, doorOpen: 0, t, lt, table: { basket: true }, popsL: [], popsR: [] });
    for (const k of ['pr', 'ad', 'sp', 'cl', 'mg']) drawChar(C[k]);
  },
  fx: lt => ({ bloom: .6, vignette: .38, grain: .045, contrast: .12, sat: .14 }),
  blur: lt => 1,
  over() {},
};
window.__EP11_SCENES = window.__EP11_SCENES || {};
window.__EP11_SCENES.arrival = SC;
})();
