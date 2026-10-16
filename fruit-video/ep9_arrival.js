'use strict';
/* SHIFT HAPPENS, Episode 9: The Agency Nurse. Scene: arrival (2:58 PM, THE FRONT DOOR).
 *
 * The Fruit Bowl lobby is dressed for a welcome party: red carpet with stanchions, a banner, balloons, a table with a gift basket and a pizza box.
 * The doors slide open, a sun flare, confetti, and Persimmon (the per diem agency nurse) strolls in sipping an iced coffee.
 * The Administrator hands her a basket, a parking pass and lunch; the staff get a pen. Every position is a world coordinate: X right, Z forward (V2.at). */
(() => { if (!window.TIMELINE_EP9) return;
const { person, zoomTo, faceZoom, drawBg, inB, faceC, localOf, confetti } = window.H6;
const A7 = window.A7, A9 = window.A9, S6 = window.S6;
const { straw, mango, lemon } = A7, persimmon = A9.persimmon, melon = A9.melon;
const { p2, poly, quad3, grad, radial } = V2;
const { box3, onZ, kz, shell, backWindow, ceilingLamp, plant3, table3, wallClock } = S6;

// ---- helpers (copies of the ep8 ones) -------------------------------------------------------------------------------------------------------------
// scene-relative time of a spoken word, from the recorded line's word timings
const wordT = (id, word) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return l.s - CUR.start + w[1]; };
// a route through keyed positions [t, X, Z, ease]
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
// a point in scene coordinates -> where it lands on the screen with the current 2D camera
const toScr = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const lerpA2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
// the 3D dolly: a slow push from the entrance while the doors open, held through the welcome, then pulled back for the dialogue and the final stare
const czAt = lt => { const d = B('door'), st = B('sting'); return lt >= B('a2').s - .06 ? (-470) : lt < d.s ? lerp(-510, -480, seg(lt, 0, d.s)) : lt < d.s + 1.5 ? lerp(-480, -465, sk(lt, d.s + .2, d.s + 1.5)) : lerp(-465, -380, sk(lt, d.s + 1.5, d.s + 3)); };
const a3x = a2 => B('a3').s;

// ---- new props and accessories ----------------------------------------------------------------------------------------------------------------------
// a wicker gift basket: cellophane, a red bow, fruit, a handle. Origin: bottom centre; about 190 units tall
function drawBasket(t) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#c8924e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(44, 0); ctx.lineTo(54, -56); ctx.lineTo(-54, -56); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(100,56,14,.55)'; ctx.lineWidth = 3; for (const y of [-14, -28, -42]) { ctx.beginPath(); ctx.moveTo(-60, y); ctx.lineTo(60, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,230,170,.35)'; for (let r = 0; r < 4; r++) for (let x = -50 + (r % 2) * 9; x < 56; x += 18) { ctx.beginPath(); ctx.moveTo(x, -r * 14); ctx.lineTo(x, -r * 14 - 12); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = '#a8702e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-58, -66, 116, 13, 5); ctx.fill(); ctx.stroke();
  // fruit peeking out of the cellophane
  const fr = (x, y, r, c1, c2) => { ctx.fillStyle = V2.grad(x - r, y - r, x + r, y + r, [[0, c1], [1, c2]]); ell(x, y, r, r * .96); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(x - r * .35, y - r * .4, r * .22, r * .14); ctx.fill(); };
  fr(-28, -78, 19, '#ff7a86', '#d4182c'); fr(16, -82, 18, '#ffc15a', '#f07c10'); fr(-2, -96, 15, '#e6f58a', '#8ab824');
  ctx.strokeStyle = '#6b8a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-28, -97); ctx.quadraticCurveTo(-26, -106, -20, -108); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.fillStyle = '#f7d84a'; ctx.beginPath(); ctx.moveTo(36, -68); ctx.quadraticCurveTo(54, -84, 50, -110); ctx.quadraticCurveTo(40, -90, 28, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the cellophane: a tall gathered cone with a frilled top
  ctx.fillStyle = 'rgba(232,244,255,.34)'; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-54, -62); ctx.bezierCurveTo(-72, -96, -42, -128, -12, -150); ctx.lineTo(12, -150); ctx.bezierCurveTo(42, -128, 72, -96, 54, -62); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 30, -70); ctx.quadraticCurveTo(s * 34, -110, s * 8, -146); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -150); ctx.lineTo(i * 9, -176 - (i % 2 ? 0 : 8)); ctx.stroke(); }
  // the bow
  ctx.fillStyle = '#e8283a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
  ctx.save(); ctx.translate(0, -150); for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * .5); ell(s * 24, 0, 24, 12); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-24, 36); ctx.lineTo(-12, 32); ctx.lineTo(-6, 42); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(22, 34); ctx.lineTo(12, 30); ctx.lineTo(8, 40); ctx.lineTo(-3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8101f'; ell(0, 0, 9, 9); ctx.fill(); ctx.stroke(); ctx.restore();
  // the handle
  ctx.strokeStyle = INK; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(-50, -62); ctx.bezierCurveTo(-58, -200, 58, -200, 50, -62); ctx.stroke();
  ctx.strokeStyle = '#c8924e'; ctx.lineWidth = 8; ctx.stroke();
  // a twinkle on the cellophane
  const tw = .5 + .5 * Math.sin(t * 4.2); ctx.fillStyle = `rgba(255,255,255,${.35 + .6 * tw})`; ctx.save(); ctx.translate(-26, -112); ctx.rotate(.4); ctx.fillRect(-1.8, -8 * tw - 3, 3.6, 16 * tw + 6); ctx.fillRect(-8 * tw - 3, -1.8, 16 * tw + 6, 3.6); ctx.restore();
  ctx.restore();
}
// a cardboard pizza box seen from a little above: lid, front edge, a grease spot and a name. Origin: bottom centre of the front edge
function drawPizzaBox() {
  ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
  ctx.fillStyle = '#b9893f'; rr(-84, -8, 168, 18, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c88e'; ctx.beginPath(); ctx.moveTo(-70, -42); ctx.lineTo(70, -42); ctx.lineTo(84, -8); ctx.lineTo(-84, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(190,120,30,.25)'; ell(26, -22, 15, 6); ctx.fill(); ell(-34, -28, 9, 4); ctx.fill();
  ctx.fillStyle = '#d6202e'; ctx.beginPath(); ctx.moveTo(-34, -35); ctx.lineTo(-12, -35); ctx.lineTo(-4, -16); ctx.lineTo(-40, -16); ctx.closePath(); ctx.fill();
  text('PIZZA', 20, -26, { size: 24, font: 'Bangers', weight: 400, fill: '#d6202e', spacing: 2, maxW: 70 });
  ctx.restore();
}
Object.assign(PROP_BOX, { pen9: [-18, -110, 18, 14], basket9: [-38, -8, 38, 122], passcard9: [-36, -76, 36, 6], pizzabox9: [-62, -34, 62, 9] });
EXT.prop.basket9 = (side, o, t) => { ctx.save(); ctx.rotate(.04 * Math.sin(t * 2.4)); ctx.scale(.62, .62); ctx.translate(0, 186); drawBasket(t); ctx.restore(); };
EXT.prop.pizzabox9 = (side, o, t) => { ctx.save(); ctx.globalAlpha *= side < 0 ? (o.pzL ?? 1) : (o.pzR ?? 1); ctx.scale(.72, .72); ctx.translate(0, -8); drawPizzaBox(); ctx.restore(); };   // pzL and pzR dissolve the box from one hand to the other
EXT.prop.pen9 = (side, o, t) => {   // the staff's one pen, held up like a trophy: a big blue ballpoint with a silver clip and a twinkle
  ctx.save(); ctx.rotate(side * .2); ctx.lineJoin = 'round';
  ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-9, -92, 18, 88, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eef1f7'; rr(-9, -92, 18, 24, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; rr(5, -86, 5, 40, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, -4); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  const tw = .5 + .5 * Math.sin(t * 5); ctx.fillStyle = `rgba(255,255,255,${.4 + .6 * tw})`; ctx.save(); ctx.translate(-16, -74); ctx.fillRect(-1.6, -7 * tw - 3, 3.2, 14 * tw + 6); ctx.fillRect(-7 * tw - 3, -1.6, 14 * tw + 6, 3.2); ctx.restore();
  ctx.restore();
};
EXT.prop.passcard9 = (side, o, t) => {   // the parking pass, pinched between two fingers: a white card, a blue P, a hole and a lanyard clip
  ctx.save(); ctx.rotate(side * -.1); ctx.lineJoin = 'round';
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-36, -76, 72, 52, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a5ac8'; rr(-36, -76, 72, 14, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a5ac8'; ell(-12, -42, 13, 13); ctx.fill(); text('P', -12, -41, { size: 20, font: 'Bangers', weight: 400, fill: '#fff' });
  ctx.fillStyle = INK; rr(6, -50, 24, 5, 2); ctx.fill(); rr(6, -40, 18, 5, 2); ctx.fill();
  ctx.fillStyle = '#c9d2f0'; ell(0, -70, 4, 4); ctx.fill(); ctx.restore();
};
// sunglasses that slide from the eyes up onto the head: o.shadeK 0 (on the face) to 1 (pushed up)
EXT.acc.shades9 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const kk = easeIO(clamp(o.shadeK ?? 0)), ex = k.eyeX, er = k.er, y = lerp(k.eyeY, -k.ry * .72, kk);
  ctx.save(); ctx.fillStyle = '#121218'; ctx.strokeStyle = '#121218'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(s * ex - er * 1.3, y - er * .8, er * 2.6, er * 1.7, [6, 6, 20, 20]); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-ex + er, y - er * .5); ctx.lineTo(ex - er, y - er * .5); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * ex - er * .9, y - er * .5); ctx.lineTo(s * ex - er * .3, y - er * .5); ctx.lineTo(s * ex - er * .8, y + er * .4); ctx.fill(); }
  ctx.restore();
};
EXT.acc.perdiem9 = (o, k, t, layer) => {   // the clip-on PER DIEM badge (the A9 one), swinging with her stride and a little farther out from the mouth
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(k.rx * .54, k.ry * .38); ctx.rotate(.05 * Math.sin(t * 2.1) + (o.badgeSwing || 0) * Math.sin(t * 6.4));
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-9, -7, 18, 12, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.lineWidth = 3; rr(-26, 12, 52, 58, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-26, 12, 52, 18, 6); ctx.fill(); ctx.stroke();
  text('PER DIEM', 0, 22, { size: 9, fill: '#fff', weight: 900, spacing: .4, maxW: 50 });
  ctx.fillStyle = '#c9d2f0'; ell(0, 44, 11, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; rr(-18, 59, 36, 5, 2); ctx.fill();
  if (o.passA > 0) {   // the parking pass, clipped under the badge
    ctx.save(); ctx.globalAlpha *= clamp(o.passA * 2); ctx.translate(8, 66 + 4 * (1 - o.passA)); ctx.rotate(.14); ctx.scale(.5 + .5 * o.passA, .5 + .5 * o.passA);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-24, 0, 48, 34, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a5ac8'; rr(-24, 0, 48, 9, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a5ac8'; ell(-9, 21, 8, 8); ctx.fill(); text('P', -9, 21, { size: 12, font: 'Bangers', weight: 400, fill: '#fff' });
    ctx.restore();
  }
  ctx.restore();
};

// ---- the lobby, dressed for a party -------------------------------------------------------------------------------------------------------------------
const CARPET_HW = 118;
function carpet() {
  const zN = V2.P.cz + 70, zF = 1748, a = p2(-CARPET_HW, 0, zF), c = p2(CARPET_HW, 0, zN);
  quad3([-CARPET_HW, 0, zF], [CARPET_HW, 0, zF], [CARPET_HW, 0, zN], [-CARPET_HW, 0, zN], grad(0, a[1], 0, Math.max(c[1], H), [[0, '#d42a3c'], [.5, '#b3152c'], [1, '#8a0f22']]), 'rgba(40,0,10,.55)', 2);
  for (const s of [-1, 1]) { quad3([s * (CARPET_HW - 13), .4, zF], [s * CARPET_HW, .4, zF], [s * CARPET_HW, .4, zN], [s * (CARPET_HW - 13), .4, zN], '#e9c34c'); quad3([s * (CARPET_HW - 22), .4, zF], [s * (CARPET_HW - 19), .4, zF], [s * (CARPET_HW - 19), .4, zN], [s * (CARPET_HW - 22), .4, zN], 'rgba(233,195,76,.8)'); }
  ctx.strokeStyle = 'rgba(70,0,14,.28)'; ctx.lineWidth = 2;
  for (let z = 1700; z > zN; z -= 90) { const l = p2(-CARPET_HW + 24, .4, z), r = p2(CARPET_HW - 24, .4, z); ctx.lineWidth = Math.max(1, 2.4 * kz(z)); ctx.beginPath(); ctx.moveTo(...l); ctx.lineTo(...r); ctx.stroke(); }
  // a soft shadow along the gold edges, where the carpet meets the floor
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
function balloons(Xc, Zc, t, seed) {
  const cols = ['#ff4f6d', '#ffd23a', '#4aa8ff', '#58c85a', '#c25bd6', '#ff9f1c'], k = kz(Zc), w = p2(Xc, 0, Zc);
  ctx.save(); ctx.lineJoin = 'round';
  // the weight
  ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(w[0], w[1]); ctx.scale(k, k); rr(-22, -26, 44, 26, 5); ctx.fill(); ctx.stroke(); ctx.restore();
  const list = [];
  for (let i = 0; i < 6; i++) {
    const bob = Math.sin(t * 1.5 + i * 1.3 + seed) * 13, sway = Math.sin(t * 1.05 + i * .9 + seed) * 9;
    list.push({ i, x: Xc + (i - 2.5) * 36 + sway, y: 330 + (i % 3) * 58 + (i === 1 || i === 4 ? 40 : 0) + bob, z: Zc + (i % 2) * 20 });
  }
  list.sort((a, b) => b.z - a.z);
  for (const b of list) {
    const q = p2(b.x, b.y, b.z), kk = kz(b.z), R = 62 * kk;
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kk); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * k); ctx.quadraticCurveTo(lerp(w[0], q[0], .5) + 16 * Math.sin(t + b.i), lerp(w[1], q[1], .6), q[0], q[1] + R * 1.12); ctx.stroke();
    ctx.fillStyle = V2.radial(q[0] - R * .3, q[1] - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, cols[b.i]], [1, V2.rgba(V2.mix(cols[b.i], '#2a1030', .45), 1)]]);
    ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = Math.max(2, 2.6 * kk); ell(q[0], q[1], R * .82, R); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cols[b.i]; ctx.beginPath(); ctx.moveTo(q[0] - 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0] + 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0], q[1] + R * 1.0 + 11 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(q[0] - R * .36, q[1] - R * .46, R * .14, R * .26, -.5); ctx.fill();
  }
  ctx.restore();
}
function banner(t) {
  const Z = 1250, X0 = -470, X1 = 470, Y0 = 604, Y1 = 690, k = kz(Z), wv = x => 5 * k * Math.sin(x * .009 + t * 1.8);
  const tl = p2(X0, Y1, Z), tr = p2(X1, Y1, Z), bl = p2(X0, Y0, Z), br = p2(X1, Y0, Z);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(50,40,40,.7)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, X0], [tr, X1]]) { const c = p2(X, 720, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = V2.grad(0, tl[1], 0, bl[1], [[0, '#e93a8a'], [1, '#b0185f']]); ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = Math.max(4, 8 * k);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0)); for (let i = 1; i <= 24; i++) ctx.lineTo(lerp(tl[0], tr[0], i / 24), tl[1] + wv(i * 36)); for (let i = 24; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / 24), bl[1] + wv(i * 36 + 90)); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.save(); ctx.translate((tl[0] + tr[0]) / 2, (tl[1] + bl[1]) / 2 + 1.5 * k);
  text('WELCOME PERSIMMON', 0, 0, { size: 78 * k, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 7 * k, stroke: '#6a0c3a', spacing: 3, maxW: (tr[0] - tl[0]) * .9 });
  ctx.restore();
  // a stripe of pennants under the banner
  for (let i = 0; i < 11; i++) { const u = (i + .5) / 11, px = lerp(bl[0], br[0], u), py = bl[1] + wv(u * 24 * 36 + 90) + 3; ctx.fillStyle = ['#ffd23a', '#4aa8ff', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 16 * k, py); ctx.lineTo(px + 16 * k, py); ctx.lineTo(px, py + 34 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
const TABLE = [360, 1560];
function tableSet(haveBasket, havePizza, t) {
  const [X, Z] = TABLE, k = kz(Z);
  table3(X, Z, { w: 140, d: 70, h: 160, color: '#b98a5a' });
  box3({ x0: X - 150, x1: X + 150, y0: 112, y1: 176, z0: Z - 78, z1: Z + 78, color: '#f6f2e8', top: '#fffdf6', front: '#f3efe4', side: '#d8d2c4' });
  onZ(Z - 78, X - 150, X + 150, 116, 132, '#d6202e');
  if (haveBasket) { const q = p2(X - 62, 176, Z); ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(k * .86, k * .86); drawBasket(t); ctx.restore(); }
  if (havePizza) { const q = p2(X + 78, 176, Z - 6); ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(k * .78, k * .78); drawPizzaBox(); ctx.restore(); }
}

// a copy of Episode 6's lobby (S6.lobby) in bright daylight, with the party dressing laid in before the light falls across the room
function lobby9(o = {}) {
  const zb = 1750, hw = 640, ch = 720, sun = o.sun ?? 1, doorOpen = o.doorOpen ?? 0, P = V2.P, t = o.t ?? 0;
  shell({ zb, hw, ch, wall: '#f5ead2', wain: '#7a5a46', floorA: '#ead8b0', floorB: '#bfa070', fog: '#f1e4c6', fogAmt: .26, tile: 160, bright: 1.05, rail: 120, ceil: '#f7eedc' });
  const dx0 = -300, dx1 = 300, dy1 = 520;
  backWindow(zb, { x0: dx0, x1: dx1, y0: 0, y1: dy1, sky: ['#6fbaf8', '#f2faff'], mull: 4, sill: false, beam: '255,240,200', beamA: 0, curtains: false,
    draw: f => {
      const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
      ctx.fillStyle = grad(0, fy1, 0, fy0, [[0, '#6fbaf8'], [.55, '#cfeaff'], [1, '#fffbe8']]); ctx.fillRect(fx0, fy1, w, h);
      ctx.fillStyle = '#4b8a42'; ctx.beginPath(); ctx.moveTo(fx0, fy0 - h * .26); for (let i = 0; i <= 16; i++) ctx.lineTo(fx0 + w * i / 16, fy0 - h * (.26 + .1 * Math.sin(i * 1.9) + .05 * Math.sin(i * 4.1))); ctx.lineTo(fx1, fy0); ctx.lineTo(fx0, fy0); ctx.fill();
      ctx.fillStyle = '#4a4650'; ctx.fillRect(fx0, fy0 - h * .12, w, h * .12);
      ctx.fillStyle = '#c0392b'; rr(fx0 + w * .1, fy0 - h * .22, w * .26, h * .12, h * .04); ctx.fill(); ctx.fillStyle = '#26427a'; rr(fx0 + w * .66, fy0 - h * .21, w * .24, h * .11, h * .04); ctx.fill();
      ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(fx0 + w * .55, fy1 + h * .46, w * .085, 0, TAU); ctx.fill();
    } });
  { const pw = (dx1 - dx0) / 4, shift = doorOpen * pw * 1.15;
    for (const [a2, b2] of [[dx0, dx0 + pw * 2], [dx0 + pw * 2, dx1]]) { const s2 = a2 < 0 ? -shift : shift; onZ(zb, a2 + s2, b2 + s2, 0, dy1, 'rgba(205,228,240,.16)', 'rgba(25,16,30,.55)', 3.4); }
    onZ(zb, dx0 - 40, dx1 + 40, dy1 + 4, dy1 + 74, '#6d4b38', 'rgba(25,16,30,.55)', 2.4); }
  { const [sx, sy] = p2(0, dy1 + 39, zb), kk = kz(zb); ctx.fillStyle = '#f6e6c4'; ctx.font = `900 ${30 * kk}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '3px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.letterSpacing = '0px'; }
  wallClock(470, 470, zb, 1, 58, 2, 52);
  box3({ x0: 230, x1: 590, y1: 200, z0: 960, z1: 1240, color: '#7a5a46', top: '#ecdcb4', frontGrad: [[0, '#8a6a52'], [1, '#6a4a36']], fog: { color: '#f1e4c6', amt: .2, zFar: zb } });
  box3({ x0: 250, x1: 560, y0: 200, y1: 262, z0: 1040, z1: 1110, color: '#d9d4c8' });
  box3({ x0: -560, x1: -330, y1: 100, z0: 980, z1: 1180, color: '#a2503e', top: '#c0624c', fog: { color: '#f1e4c6', amt: .2, zFar: zb } });
  plant3(-590, 1500, 1.0); plant3(590, 1550, 1.0);
  for (let i = 0; i < 7; i++) { const x = -520 + i * 173, [px, py] = p2(x, ch - 40, zb), k2 = kz(zb); ctx.fillStyle = ['#e8193a', '#ffd23a', '#58b83a', '#4a8ae8', '#ff9f1c', '#c25bd6', '#e8193a'][i]; ctx.beginPath(); ctx.moveTo(px - 34 * k2, py); ctx.lineTo(px + 34 * k2, py); ctx.lineTo(px, py + 80 * k2); ctx.closePath(); ctx.fill(); }
  for (const z of [300, 900, 1500]) { ceilingLamp(-260, z, ch, .9, '255,240,210'); ceilingLamp(260, z, ch, .9, '255,240,210'); }
  // ---- the party
  carpet();
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const Z = 1650 - i * 150; if (i) rope(s * 150, Z + 150, Z); stanchion(s * 150, Z); }
  tableSet(o.basketOnTable ?? true, o.pizzaOnTable ?? true, t);
  banner(t);
  balloons(-575, 1610, t, 0); balloons(575, 1610, t, 2.3);
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

// ---- confetti cannon: a burst from one side of the frame, thrown up and inward, falling back under gravity ---------------------------------------
function burst(lt, t0, side, n = 70) {
  const k = lt - t0; if (k < 0 || k > 3.4) return;
  const cols = ['#ffaa28', '#50a5ff', '#5ae682', '#ffcd46', '#ff4646', '#ffffff', '#ff7ad9'], z = CAM.z, x0 = CAM.x - side * (W / 2 - 20) / z, y0 = CAM.y + 380 / z, tau = .5;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + side * (.14 + .85 * hash(i + 5 + side * 31)), v = 1500 + 2400 * hash(i + 17 + side * 7), u = tau * (1 - Math.exp(-k / tau));
    const x = x0 + (Math.cos(a) * v * u + 30 * Math.sin(k * 3 + i) * seg(k, .3, 1)) / z, y = y0 + (Math.sin(a) * v * u + 90 * k + .5 * 640 * k * k) / z;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * (3 + 7 * hash(i + 2)) + i); ctx.scale(1, Math.cos(k * (5 + 5 * hash(i + 9)) + i)); ctx.globalAlpha = 1 - seg(k, 2.6, 3.4);
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-13 / z, -8 / z, 26 / z, 16 / z); ctx.restore();
  }
  ctx.restore();
}

// ---- the scene -----------------------------------------------------------------------------------------------------------------------------------------
const MK = { lemon: [-466, 1180], admin: [-215, 930], straw: [335, 1090], mango: [570, 1250], pers: [112, 930] };
const persPath = lt => { const d = B('door'), a2 = B('a2'); return route([[0, 0, 1748], [d.s + .45, 0, 1748], [a2.s - .55, MK.pers[0] * .85, 1000], [a2.s - .1, MK.pers[0], MK.pers[1], 'out']])(lt); };
const strawPath = route([[0, 560, 800], [1.0, 420, 1010], [1.5, MK.straw[0], MK.straw[1], 'out']]);
const mangoPath = route([[0, 800, 950], [.25, 800, 950], [1.25, 640, 1210], [1.65, MK.mango[0], MK.mango[1], 'out']]);
// aim a hand: blend from a resting grip (local coordinates) toward a point in scene coordinates
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}
const SHOT_ORDER = () => { const b = id => B(id), d = b('door'); return [['wide', b('s1').s - .05], ['cuS', b('l1').s - .05], ['cuL', b('m1').s - .05], ['cuM', b('l2').s - .05], ['cuL2', b('m2').s - .05], ['cuM2', b('l3').s - .05], ['cuL3', d.s - .02],
  ['door', d.s + 1.5], ['doorB', b('a1').s - .02], ['cuA', b('a2').s - .06], ['two', b('p1').s - .05], ['cuP', b('s2').s - .05], ['cuS2', b('a3').s - .05], ['cuA2', b('s3').s - .05], ['cuS3', b('a4').s - .05], ['cuA3', b('p2').s - .05],
  ['cuP2', b('s4').s - .05], ['xcuS', b('a5').s - .05], ['xcuA', b('sting').s - .02], ['sting', 1e9]]; };
const shotOf = lt => { const o = SHOT_ORDER(); let t0 = 0; for (const [n, e] of o) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'sting', t0, t1: CUR.dur }; };
// who is in focus in each shot (everyone else is a soft neighbor, drawn out of focus and left out of the audit)
const CRISP = { cuS: ['straw'], cuS2: ['straw'], cuS3: ['straw'], xcuS: ['straw'], cuL: ['lemon'], cuL2: ['lemon'], cuL3: ['lemon'], cuM: ['mango'], cuM2: ['mango'], cuA: ['admin'], cuA2: ['admin'], cuA3: ['admin'], xcuA: ['admin'], cuP: ['pers'], cuP2: ['pers'],
  two: ['admin', 'pers'], doorB: ['admin', 'pers'] };
const ALLC = ['lemon', 'admin', 'pers', 'straw', 'mango'];

const SCENES = {};
SCENES.arrival = {
  cast(lt) {
    const b = id => B(id), d = b('door'), a1 = b('a1'), a2 = b('a2'), p1 = b('p1'), p2t = b('p2'), a4 = b('a4'), st = b('sting');
    const open = sk(lt, d.s + .1, d.s + .75);
    // handoff times: the word is said, the item changes hands a moment later
    const tB = wordT('a2', 'basket'), tP = wordT('a2', 'parking'), tL = wordT('a2', 'lunch'), hB = tB + .3, hP = tP + .3, hL = tL + .25, dB = tP + .02;
    const grabbed = lt >= a2.s - .2;
    const qA = V2.at(...MK.admin), qL = V2.at(...MK.lemon), pp = persPath(lt), qP = V2.at(pp[0], pp[1]);
    const M = [lerp(qA.x, qP.x, .5), qA.y - 185 * qA.s];   // where a handoff happens: chest height, halfway between the two of them
    const reachA = (ti, hi) => sk(lt, ti - .22, ti + .04) * (1 - sk(lt, hi + .02, hi + .22));
    const look2cam = sk(lt, st.s + .1, st.s + .62);
    // ---- Lemon (clipboard, readers, lanyard): deadpan, and a polite golf clap for the guest of honour
    const lmClap = lt >= d.s + 1.4 && lt < a1.e + .2;
    const lm = lemon(Object.assign(qL, { look: lerpA2(inB(lt, 's1') ? [.35, .05] : lt < d.s ? [.55, -.05] : [.4, -.1], [0, 0], look2cam), expr: inB(lt, 'l3') || lt >= st.s ? 'dead' : lmClap ? 'happy' : 'neutral', lid: inB(lt, 'l3') ? .5 : undefined,
      hold: { r: 'clipboard6' }, grip: { r: [100, 30] }, clipText: 'ROSTER', arms: { l: 'rest', r: 'hold' } }));
    if (lmClap) { lm.grip.l = [-lerp(36, 84, .5 + .5 * Math.sin(lt * 17)), 44]; lm.arms.l = 'hold'; lm.hand = { l: 'flat' }; }
    // ---- the Administrator: bigger and more important, with his own gestures
    const ad = melon(Object.assign(qA, { s: qA.s * 1.14, look: lerpA2(inB(lt, 's2') || inB(lt, 'a3') ? [.7, -.05] : lt >= a2.s - .2 && lt < p1.e ? [.55, 0] : [.25, -.12], [0, 0], look2cam), expr: 'happy', hold: {}, grip: {}, hand: {}, arms: { l: 'rest', r: 'rest' } }));
    const shake = Math.sin(lt * 21);
    if (lt >= d.s + 1.3 && lt < a1.e + .1) { ad.arms = { l: [2.35 + .12 * shake, .55 + .3 * shake], r: [2.35 - .12 * shake, .55 - .3 * shake] }; ad.hand = { l: 'wave', r: 'wave' }; }   // jazz hands
    else if (lt >= a2.s - .2 && lt < hL + .3) {                 // the handoff: the right hand brings the basket and then the pass, the left hand carries the pizza box until it is offered
      const pa = Math.max(reachA(tB, hB), reachA(tP, hP), reachA(tL, hL)), MM = lt >= hP ? [M[0] + 12, M[1] + 34] : M;
      if (lt < hB) ad.hold.r = 'basket9'; else if (lt >= tP - .22 && lt < hP) ad.hold.r = 'passcard9'; else if (lt >= hP && lt < hL) { ad.hold.r = 'pizzabox9'; ad.pzR = sk(lt, hP, hP + .14); }
      handTo(ad, 1, MM[0], MM[1], pa, [148, 92]);
      if (lt < hP + .14) { ad.hold.l = 'pizzabox9'; ad.grip.l = [-176, 100]; ad.arms.l = 'hold'; ad.pzL = 1 - sk(lt, hP, hP + .14); }   // the pizza box rides at his left side until it moves to the hand that offers it
    } else if (inB(lt, 'p1') || inB(lt, 's2') || lt >= hL + .3 && lt < a3x(a2)) ad.arms = { l: 'hips', r: 'hips' };
    else if (inB(lt, 'a3')) ad.arms = { l: 'hips', r: 'point' };
    else if (inB(lt, 'a4')) ad.arms = { l: 'shrug', r: 'shrug' };
    else if (inB(lt, 'p2')) ad.arms = { l: 'hips', r: 'rest' };
    // ---- Persimmon: sunglasses, earbuds, a badge, an iced coffee held low, and nothing hurries her
    const walking = lt > d.s + .5 && lt < a2.s - .1;
    const sipAt = (t0, t1) => sk(lt, t0, t0 + .28) * (1 - sk(lt, t1 - .25, t1));
    const sip = Math.max(sipAt(tP + .05, tP + .95), sipAt(p2t.s + .15, p2t.e - .15));
    const shadeK = sk(lt, p1.s + .12, p1.s + .42), pushing = sk(lt, p1.s - .02, p1.s + .14) * (1 - sk(lt, p1.s + .44, p1.s + .66));
    const pr = person(persimmon, persPath, lt, { look: lerpA2([0, .04], [0, 0], look2cam), expr: lt >= p1.s ? 'chill' : 'neutral', lid: .3, acc: ['perdiem9', 'airpods', 'shades9'], shadeK, badgeSwing: walking ? .12 : 0, passA: lt >= hP + .3 ? sk(lt, hP + .3, hP + .6) : 0,
      hold: { r: 'icedcup' }, grip: { r: [lerp(100, 135, sip), lerp(72, -64, sip)] }, arms: { l: 'rest', r: 'hold' }, stride: 36, transit: lt < d.s + 1.0 });
    const REST = [-118, 62], RESTP = [-150, 100], recv = (ti, hi) => sk(lt, ti - .06, ti + .14) * (1 - sk(lt, hi, hi + .22));
    const left = (prop, rest, k, m = M) => { pr.hold = Object.assign({}, pr.hold); if (prop) pr.hold.l = prop; handTo(pr, -1, m[0], m[1], k, rest); pr.hand = { l: prop ? 'grip' : 'open' }; };
    const M2 = [M[0] + 12, M[1] + 34];
    if (lt >= tB - .1 && lt < hB) left(null, REST, recv(tB, hB));
    else if (lt >= hB && lt < dB) left('basket9', REST, 1 - sk(lt, hB, hB + .22));
    else if (lt >= dB && lt < hP) left(null, REST, recv(tP, hP));
    else if (lt >= hP && lt < hP + .32) left('passcard9', REST, 1 - sk(lt, hP, hP + .32));
    else if (lt >= tL - .1 && lt < hL) left(null, REST, recv(tL, hL), M2);
    else if (lt >= hL && lt < p1.s - .02) left('pizzabox9', RESTP, 1 - sk(lt, hL, hL + .25), M2);
    else if (lt >= p1.s - .02 && lt < p1.s + .72) { pr.arms.l = 'hold'; pr.hand = { l: pushing > .05 ? 'point' : 'open' }; pr.grip.l = [lerp(RESTP[0], -72, pushing), lerp(RESTP[1], lerp(-28, -78, shadeK), pushing)]; }
    // ---- Strawberry and Mango walk in from the right, clocking in
    const sw = lt < 1.6;
    const sp = person(straw, strawPath, lt, { stride: 40, look: lerpA2(sw ? [-.6, .05] : inB(lt, 's1') ? [-.5 + .5 * Math.sin(lt * 2.6), -.25] : [-.5, -.05], [0, 0], look2cam),
      expr: inB(lt, 's1') ? 'hopeful' : inB(lt, 's2') ? 'dead' : lt >= st.s ? 'dead' : inB(lt, 's4') ? 'dead' : lt >= a4.s ? 'dead' : 'sour',
      lid: inB(lt, 's4') ? lerp(.3, .62, seg(lt, b('s4').s, b('s4').e)) : inB(lt, 's2') ? .55 : lt >= b('l1').s ? .42 : .3,
      hold: { r: 'mug7' }, grip: { r: [78, 48] }, arms: { l: sw ? [.28 + .35 * Math.sin(lt * 7), .25] : 'rest', r: 'hold' }, transit: sw });
    if (lt >= b('s2').s - .2 && lt < b('a3').e + .1) { const up = sk(lt, b('s2').s - .2, b('s2').s + .2) * (1 - sk(lt, b('a3').e - .3, b('a3').e)); sp.hold.l = 'pen9'; sp.grip.l = [lerp(-110, -146, up), lerp(40, -36, up)]; sp.arms.l = 'hold'; }
    const clapM = lt >= d.s + 1.4 && lt < a1.e + .2;
    const mg = person(mango, mangoPath, lt, { stride: 36, look: lerpA2(sw ? [-.6, .05] : [-.5, 0], [0, 0], look2cam), expr: sw ? 'happy' : inB(lt, 'm1') ? 'hopeful' : inB(lt, 'm2') ? 'shock' : clapM ? 'happy' : lt >= st.s ? 'dead' : 'neutral',
      arms: { l: sw ? [.28 + .35 * Math.sin(lt * 7 + 2), .25] : 'rest', r: 'rest' }, transit: lt < 1.8 });
    if (clapM) { const c = .5 + .5 * Math.sin(lt * 17); mg.grip = { l: [-lerp(8, 56, c), 74], r: [lerp(8, 56, c), 74] }; mg.arms = { l: 'hold', r: 'hold' }; mg.hand = { l: 'flat', r: 'flat' }; }
    return { lm, ad, pr, sp, mg, z: { lm: MK.lemon[1], ad: MK.admin[1], pr: pp[1], sp: strawPath(lt)[1], mg: mangoPath(lt)[1] }, pz: { basketFloor: lt >= dB + .2, pizzaFloor: lt >= p1.s - .02, grabbed, open, qP, dB, hB, hP, hL, tB, tP, tL } };
  },
  cam(lt) {
    const sh = shotOf(lt), d = B('door'), a2 = B('a2'), k = seg(lt, sh.t0, sh.t1);
    V2.setCam({ f: 1400, cy: 360, hy: 860, cz: czAt(lt) });
    const C = SCENES.arrival.cast(lt), F = (o, z, up = 100) => faceZoom({ kind: o.kind, x: o.x, y: o.y, s: o.s, lift: o.lift, noLegs: o.noLegs }, z, up);
    switch (sh.n) {
      case 'wide': zoomTo(540, lerp(985, 975, k), 1); break;
      case 'cuS': F(C.sp, lerp(1.75, 1.85, k), 110); break;
      case 'cuL': F(C.lm, lerp(1.85, 1.95, k), 110); break;
      case 'cuM': F(C.mg, lerp(1.9, 2.0, k), 110); break;
      case 'cuL2': F(C.lm, lerp(2.0, 2.1, k), 110); break;
      case 'cuM2': F(C.mg, lerp(2.05, 2.15, k), 110); break;
      case 'cuL3': F(C.lm, lerp(2.2, 2.6, k), 100); break;
      case 'door': zoomTo(540, lerp(990, 975, k), 1); CAM.shake = lt > d.s + .4 && lt < d.s + 1.3 ? 3 * seg(lt, d.s + .4, d.s + 1.25) : (lt >= d.s + 1.3 ? 6 * Math.max(0, 1 - (lt - d.s - 1.3) / .3) : 0); break;
      case 'doorB': zoomTo(lerp(470, 480, k), 975, lerp(1.3, 1.45, k)); break;
      case 'cuA': F(C.ad, lerp(1.45, 1.55, k), 100); break;
      case 'two': { const mx = (C.ad.x + C.pr.x) / 2; zoomTo(mx - 70, C.ad.y - 190 * C.ad.s, lerp(1.28, 1.34, k)); break; }
      case 'cuP': F(C.pr, lerp(2.0, 2.15, k), 100); break;
      case 'cuS2': F(C.sp, lerp(1.8, 1.95, k), 90); break;
      case 'cuA2': F(C.ad, lerp(1.5, 1.6, k), 100); break;
      case 'cuS3': F(C.sp, lerp(1.9, 2.0, k), 100); break;
      case 'cuA3': F(C.ad, lerp(1.55, 1.8, k), 100); break;
      case 'cuP2': F(C.pr, lerp(1.6, 1.72, k), 90); break;
      case 'xcuS': F(C.sp, lerp(2.7, 3.1, k), 80); break;
      case 'xcuA': F(C.ad, lerp(2.0, 2.25, k), 90); break;
      case 'sting': zoomTo(540, lerp(985, 975, k), 1); break;
    }
  },
  draw(lt) {
    const sh = shotOf(lt), d = B('door'), C = SCENES.arrival.cast(lt), P = C.pz, crisp = CRISP[sh.n] || ALLC, t = lt + 4;
    const horn = d.s + 1.3, popL = d.s + 1.35, popR = d.s + 1.45;
    const L0 = { key: [-.35, -.8], keyColor: '#fff4dc', keyA: .26, rim: '#fff0c8', rimA: .55, shadow: '#3a2a40', shadowA: .3, bounce: '#ffe0b0', bounceA: .2, amb: '#fff6e6', ambA: .04 };
    V2.setLight(L0); V2.opts.reflect = true;
    const blurPx = crisp.length === 1 ? 9 : (crisp.length < 5 ? 4 : 0);
    const flash = lt >= horn && lt < horn + .28 ? 1 - (lt - horn) / .28 : 0;
    const dropT = P.dB + .02;
    V2.dof(blurPx, () => {
      const r = lobby9({ sun: 1 + .6 * P.open, doorOpen: P.open, t, basketOnTable: !P.grabbed, pizzaOnTable: !P.grabbed, floorItems: () => {
        if (P.basketFloor) { const Z = MK.pers[1] + 10, q = p2(MK.pers[0] - 150, 0, Z), kk = kz(Z), drop = Math.max(0, 1 - (lt - dropT) / .16); ctx.save(); ctx.translate(q[0], q[1] - 70 * drop * drop * kk); ctx.fillStyle = 'rgba(30,10,10,.22)'; ell(0, 2, 56 * kk, 11 * kk); ctx.fill(); ctx.scale(kk * .8, kk * .8); drawBasket(t); ctx.restore(); }
        if (P.pizzaFloor) { const Z = MK.pers[1] - 30, q = p2(MK.pers[0] + 150, 0, Z), kk = kz(Z); ctx.save(); ctx.translate(q[0], q[1]); ctx.fillStyle = 'rgba(30,10,10,.22)'; ell(0, 2, 84 * kk, 12 * kk); ctx.fill(); ctx.scale(kk * .9, kk * .9); drawPizzaBox(); ctx.restore(); }
      } });
      // the sun and the party: glare behind the doorway, confetti behind the cast
      const k = kz(1750);
      V2.glow(r.door[0], r.door[1] + 10, 620 * k, '255,246,220', .5 * P.open * (1 - .7 * seg(lt, d.s + 1.6, d.s + 4.0)), 'screen', .7);
      V2.dust(60, 600, 1020, 1400, lt, { n: 28, alpha: .5, color: '255,246,214' });
      burst(lt, popL, 1, 74); burst(lt, popR, -1, 74);
      confetti(lt, d.s + 1.5, 46);
    });
    // balloon pops at the top of the scene, from the two corner clusters
    V2.sparks(...p2(-575, 520, 1610), lt, .35, { n: 14, speed: 380, life: .5, color: '255,236,160', g: 900, size: 4, seed: 3 }); V2.sparks(...p2(575, 520, 1610), lt, .6, { n: 14, speed: 380, life: .5, color: '255,210,230', g: 900, size: 4, seed: 8 });
    // the cast, back to front; everyone but the subject of a close-up is a soft neighbor
    const order = [['lm', 'lemon'], ['ad', 'admin'], ['pr', 'pers'], ['sp', 'straw'], ['mg', 'mango']].filter(([, id]) => id !== 'pers' || lt >= d.s + .3).sort((a, b) => (crisp.length === 1 ? (crisp.includes(a[1]) ? 1 : 0) - (crisp.includes(b[1]) ? 1 : 0) : 0) || C.z[b[0]] - C.z[a[0]]);
    for (const [key, id] of order) {
      const o = C[key], bg = !crisp.includes(id), sil = id === 'pers' ? 1 - seg(lt, d.s + .65, d.s + 1.25) : 0;
      V2.setLight(sil > 0 ? Object.assign({}, L0, { back: { color: '255,240,200', a: .6 * sil, w: 20 }, frontDark: .28 * sil, shadowLong: .5 * sil }) : L0);
      if (id === 'pers') o.alpha = seg(lt, d.s + .3, d.s + .75);
      (bg ? nbr : drawChar)(o);
    }
    V2.setLight(L0);
    // the Administrator's sweat drop, after the budget
    { const tb = wordT('a4', 'budget') - .05; if (lt >= tb && lt < B('p2').s + 1.6 && crisp.includes('admin')) {
      const o = C.ad, fall = seg(lt, tb, tb + .9), x = o.x + 84 * o.s, y = o.y + (-84 + 60 * easeIn(fall) - 205) * o.s, r = 11 * o.s, grow = easeOut(seg(lt, tb, tb + .25));
      ctx.save(); ctx.globalAlpha *= 1 - seg(lt, B('p2').s + 1.0, B('p2').s + 1.6); ctx.translate(x, y); ctx.scale(grow, grow); ctx.fillStyle = '#8fd4ff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * o.s;
      ctx.beginPath(); ctx.moveTo(0, -r * 1.9); ctx.bezierCurveTo(r * 1.1, -r * .4, r * 1.1, r * 1.1, 0, r * 1.1); ctx.bezierCurveTo(-r * 1.1, r * 1.1, -r * 1.1, -r * .4, 0, -r * 1.9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(-r * .35, r * .1, r * .22, r * .4, .2); ctx.fill(); ctx.restore(); } }
    // the sun's lens flare, in front of everything
    if (P.open > 0 && lt < d.s + 2.6) V2.flare(...toScr(...p2(0, 250, 1750)), .26 * P.open * (1 - seg(lt, d.s + .9, d.s + 2.3)));   // it fades before she is close, so her colors read
    if (flash > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,252,240,${.4 * flash})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
  fx(lt) {
    const d = B('door'), horn = d.s + 1.3, tune = lt > d.s && lt < d.e + 1.5 ? 1 : 0;
    const flash = lt >= horn && lt < horn + .3 ? 1 - (lt - horn) / .3 : 0, st = B('sting'), stK = seg(lt, st.s, st.e);
    return { bloom: .6 + .06 * tune * seg(lt, d.s, horn) + .16 * flash, vignette: .38 + .25 * stK, grain: .045, contrast: .12 + .04 * tune, sat: .14 + .1 * tune - .1 * stK, tint: [['#ffe9b8', .12 - .08 * tune, 'soft-light']], aberr: lt > horn && lt < horn + .25 ? 6 * (1 - (lt - horn) / .25) : 0,
      fade: Math.max(lt < .25 ? 1 - lt / .25 : 0, seg(lt, CUR.dur - .3, CUR.dur - .02)), fadeColor: '0,0,10' };
  },
  blur: lt => { const d = B('door'); return lt > d.s + .3 && lt < d.e + 1.2 ? 3 : 1; },
  over(lt) {
    const d = B('door'), horn = d.s + 1.3, C = SCENES.arrival.cast(lt), sh = shotOf(lt);
    sfxWord(lt, horn, 'TA-DAAA!', 540, 340, { size: 150, rot: -.05, hold: .45, fill: '#ffe135' });
    // the item labels: each pops as the Administrator names it
    const items = [['GIFT BASKET', wordT('a2', 'basket') - .22, '#e93a8a'], ['PARKING PASS', wordT('a2', 'parking') - .05, '#2a5ac8'], ['LUNCH', wordT('a2', 'lunch') - .05, '#f08a1c']];
    if (sh.n === 'two') for (const [lab, t0, col] of items) {
      const life = lt - t0, k = easeBack(seg(life, 0, .2)), f = 1 - seg(life, .38, .56);
      if (k <= 0 || f <= 0) continue;
      const a = toScr(C.ad.x, C.ad.y), p = toScr(C.pr.x, C.pr.y), mx = (a[0] + p[0]) / 2, ty = Math.min(a[1], p[1]) - 520 * Math.min(C.ad.s, C.pr.s) * CAM.z;
      ctx.save(); ctx.globalAlpha *= f; ctx.translate(mx, ty); ctx.scale(k, k); ctx.rotate(-.04);
      ctx.font = '400 54px Bangers'; ctx.letterSpacing = '2px'; const w = ctx.measureText(lab).width + 56; ctx.letterSpacing = '0px';
      reg('overlay', [mx - w / 2 * k, ty - 38 * k, mx + w / 2 * k, ty + 38 * k], { id: 'item-' + lab });
      ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = col; rr(-w / 2, -38, w, 76, 38); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#150f22'; ctx.lineWidth = 6; ctx.stroke();
      text(lab, 0, 3, { size: 54, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 }); ctx.restore();
    }
    // the rate tag: $118/HR, a gold price tag with a cha-ching pulse
    const tag = wordT('p2', 'eighteen') - .05, life = lt - tag;
    if (life > -.02 && (sh.n === 'cuP2' || sh.n === 'cuS3' && false)) {
      const k = easeBack(seg(life, 0, .26)), f = 1 - seg(lt, B('p2').e + .3, B('p2').e + .6);
      if (k > 0 && f > 0) {
        const pulse = 1 + .1 * Math.max(0, Math.sin(life * 15)) * Math.exp(-life * 1.8), o = C.pr, fc = toScr(...faceC(o)), cx = clamp(fc[0] - 20, 340, 700), cy = fc[1] - 410;
        ctx.save(); ctx.globalAlpha *= f; ctx.translate(cx, cy); ctx.rotate(-.1); ctx.scale(k * pulse, k * pulse);
        reg('overlay', [cx - 190 * k * pulse, cy - 100 * k * pulse, cx + 190 * k * pulse, cy + 100 * k * pulse], { id: 'rate-tag' });
        ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
        ctx.fillStyle = V2.grad(-170, -70, 170, 70, [[0, '#fff2a0'], [.45, '#ffd23a'], [1, '#d99a0c']]); ctx.beginPath(); ctx.moveTo(-170, -22); ctx.lineTo(-128, -74); ctx.lineTo(170, -74); ctx.lineTo(170, 74); ctx.lineTo(-128, 74); ctx.lineTo(-170, 22); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#150f22'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke(); ctx.fillStyle = '#150f22'; ell(-130, 0, 11, 11); ctx.fill();
        text('$118/HR', 14, 4, { size: 92, font: 'Bangers', weight: 400, fill: '#150f22', spacing: 2, maxW: 280 });
        ctx.restore();
        // coins and sparkles at the first pulse
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, r = 150 + 130 * easeOut(seg(life, 0, .5)), al = 1 - seg(life, .1, .7); if (al <= 0) continue; ctx.save(); ctx.globalAlpha *= al * f; ctx.fillStyle = i % 2 ? '#fff6b0' : '#ffd23a'; ctx.translate(cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * .55); ctx.rotate(life * 6 + i); ctx.fillRect(-5, -5, 10, 10); ctx.restore(); }
      }
    }
  },
};
window.__EP9_SCENES = window.__EP9_SCENES || {};
window.__EP9_SCENES.arrival = SCENES.arrival;
})();
