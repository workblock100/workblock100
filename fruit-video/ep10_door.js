'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice. Scenes `door` (11:00 PM, THE FRONT DOOR) and `lot` (11:00 PM, THE PARKING LOT), registered on window.__EP10_SCENES.
 *
 * door (11.0 s): the Episode 9 welcome lobby (red carpet, stanchions, the banner) re-lit as a farewell: warm lamps inside, cold night glass outside. A V of staff lines the aisle (Mango and Mrs. Cranberry in front, Lemon and
 *   Clementine behind, Banana and Pineapple soft at the back); the Administrator and Strawberry stand at the mouth of the aisle, 370 units from the doors.
 *   0.00 to 1.28  open   a macro of the wall clock, its second hand snapping to 11:00:00 on the tick cue (0.20); then a pull-back (2D zoom 7x to 0.92x, with a rack of light) to the wide: the banner (Persimmon's, taped over) hangs above the glass
 *   1.28 to 2.16  two    two-shot, "Your final paycheck." The envelope changes hands on the word (1.99)
 *   2.16 to 4.85  stub   insert: a receipt printer; the pay stub rises out of it a line at a time. CAKE prints on "cake" (3.21), BANNER on "banner" (4.22), the NET PAY $4.17 slaps in at 4.50
 *   4.85 to 6.32  cuS    Strawberry reads it: "That's Persimmon's banner."
 *   6.32 to 7.78  cuA    the Administrator, thumb up, "We're reusing it."; the camera tilts up and the focus racks to the banner behind him (the proof)
 *   7.78 to 9.22  two2   "Thank you for your service!" a salute, and Strawberry's turn (a squeeze through the profile, then her back to us)
 *   9.22 to 11.0  out    wide, a slow dolly: the staff clap (cheer9 0.20 -> 9.46), the doors slide on the cue (slidedoor 0.10 -> 9.36), cold light spills across the carpet, Strawberry walks into it as a silhouette with a long shadow;
 *                        the doors close behind her on the Administrator's wave and the picture goes to black.
 * Every world position is (X, Z) through V2.at(X, Z) (X right, Z forward); camera, cuts and clock are functions of lt only. */
(() => {
if (!window.TIMELINE_EP10) return;
const { person, runner, zoomTo, faceC, drawBg, inB, localOf, confetti } = window.H6;
const A7 = window.A7, A9 = window.A9, S6 = window.S6, S7 = window.S7;
const { straw, mango, lemon, cran, banana, pine } = A7, melon = A9.melon;
const { onZ, kz, box3 } = S6;
const { p2, poly } = V2;
window.__EP10_SCENES = window.__EP10_SCENES || {};

// ------------------------------------------------------------------ helpers (copies of the Episode 9 ones)
// scene-relative time of a spoken word, from the recorded line's word timings (a fallback keeps a missing line from throwing)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// a route through keyed positions [t, X, Z, ease]
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? easeIn(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const ez = (t, a, b) => easeIO(seg(t, a, b));
const eo = (t, a, b) => easeOut(seg(t, a, b));
// aim a hand: blend from a resting grip (local coordinates) toward a point in scene coordinates (copy of the Episode 9 handoff helper)
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}
// frame a face for a close-up: the face lands `up` pixels above the frame centre and dx pixels right of it
const camFace = (o, z, up = 80, dx = 0) => { const [fx, fy] = faceC(o); zoomTo(fx - dx / z, fy + up / z, z); };
// a glowing four-point glint (copy of the Episode 9 one)
function glint(x, y, r, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.fillStyle = `rgba(255,250,220,${a})`;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .12, -r * .12, r, 0); ctx.quadraticCurveTo(r * .12, r * .12, 0, r); ctx.quadraticCurveTo(-r * .12, r * .12, -r, 0); ctx.quadraticCurveTo(-r * .12, -r * .12, 0, -r); ctx.fill(); ctx.restore();
}
// a big white glove (the Episode 6 hand, scaled) whose fingertip lands on (tx, ty); the arm trails off the far side (copy of the Episode 9 one)
function glove(tx, ty, ang, sc, o = {}) {
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-44, 5);
  ctx.fillStyle = LIMB; ctx.beginPath(); ctx.roundRect(-230, -9, 232, 18, 8); ctx.fill();
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand(o.kind ?? 'point', 1, {});
  ctx.restore();
}
const mixc = (a, b, k) => V2.rgba(V2.mix(a, b, k), 1);

// ------------------------------------------------------------------ props
// the final-pay envelope: a long cream business envelope with a window, a red stripe and a seal. Origin: where the hand grips its lower edge
Object.assign(PROP_BOX, { envelope10: [-58, -62, 58, 14] });
EXT.prop.envelope10 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.14); ctx.translate(0, -26);
  ctx.fillStyle = '#fbf3d8'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; rr(-52, -32, 104, 64, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(190,150,80,.2)'; ctx.beginPath(); ctx.moveTo(-50, -30); ctx.lineTo(0, 4); ctx.lineTo(50, -30); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(29,26,34,.7)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-50, -30); ctx.lineTo(0, 4); ctx.lineTo(50, -30); ctx.stroke();
  ctx.fillStyle = '#d62a3a'; rr(-52, 12, 104, 14, 0); ctx.fill();
  text('FINAL PAY', 0, 19, { size: 11, fill: '#fff', weight: 900, spacing: 1.5 });
  ctx.fillStyle = '#e8193a'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ell(0, 4, 8, 8); ctx.fill(); ctx.stroke();
  ctx.restore();
};

// ------------------------------------------------------------------ the lobby: the Episode 9 welcome lobby (carpet, stanchions, banner, balloons), re-lit for a farewell
const ZB = 1750, HW = 640, CH = 720, DX0 = -300, DX1 = 300, DY1 = 520, CARPET_HW = 118;
const BANNER_TOP = 'BYE', BANNER_NAME = 'STRAWBERY';   // the two patches taped over WELCOME PERSIMMON (the party scene's banner is the same one: keep the words in step)
// a wall clock with a second hand (S0 = seconds past 22:58:00); the second hand snaps on every whole second (copy of the Episode 9 dial)
function dial(R, S0) {
  const tot = 22 * 3600 + 58 * 60 + S0, hr = (tot / 3600) % 12, mn = (tot / 60) % 60;
  const sAng = (Math.floor(S0) - 1 + easeBack(clamp((S0 % 1) / .18))) * 6;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = R * .12; ctx.shadowOffsetY = R * .05; ctx.fillStyle = '#242a38'; ell(0, 0, R * 1.1, R * 1.1); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fffdf6'; ell(0, 0, R, R); ctx.fill();
  ctx.strokeStyle = '#242a38'; ctx.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0, r0 = R * (big ? .78 : .88); ctx.lineWidth = R * (big ? .045 : .016); ctx.beginPath(); ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0); ctx.lineTo(Math.sin(a) * R * .94, -Math.cos(a) * R * .94); ctx.stroke(); }
  for (const n of [12, 3, 6, 9]) { const a = n / 12 * TAU; text(String(n), Math.sin(a) * R * .6, -Math.cos(a) * R * .6 + R * .02, { size: R * .2, font: 'Bangers', weight: 400, fill: '#242a38' }); }
  const hand = (ang, len, lw, col, tail = .12) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-Math.sin(ang) * len * tail, Math.cos(ang) * len * tail); ctx.lineTo(Math.sin(ang) * len, -Math.cos(ang) * len); ctx.stroke(); };
  hand(hr / 12 * TAU, R * .5, R * .07, '#242a38'); hand(mn / 60 * TAU, R * .76, R * .05, '#242a38'); hand(sAng * PI / 180, R * .86, R * .022, '#e8193a', .22);
  ctx.fillStyle = '#e8193a'; ell(0, 0, R * .05, R * .05); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.beginPath(); ctx.ellipse(-R * .28, -R * .42, R * .5, R * .2, -.7, 0, TAU); ctx.fill();
  ctx.restore();
}
// the red carpet from the entrance to the camera, with its gold edges and weave lines (copy of the Episode 9 one)
function carpet() {
  const zN = V2.P.cz + 70, zF = 1748, a = p2(-CARPET_HW, 0, zF), c = p2(CARPET_HW, 0, zN);
  V2.quad3([-CARPET_HW, 0, zF], [CARPET_HW, 0, zF], [CARPET_HW, 0, zN], [-CARPET_HW, 0, zN], V2.grad(0, a[1], 0, Math.max(c[1], H), [[0, '#d42a3c'], [.5, '#b3152c'], [1, '#8a0f22']]), 'rgba(40,0,10,.55)', 2);
  for (const s of [-1, 1]) { V2.quad3([s * (CARPET_HW - 13), .4, zF], [s * CARPET_HW, .4, zF], [s * CARPET_HW, .4, zN], [s * (CARPET_HW - 13), .4, zN], '#e9c34c'); V2.quad3([s * (CARPET_HW - 22), .4, zF], [s * (CARPET_HW - 19), .4, zF], [s * (CARPET_HW - 19), .4, zN], [s * (CARPET_HW - 22), .4, zN], 'rgba(233,195,76,.8)'); }
  ctx.strokeStyle = 'rgba(70,0,14,.28)';
  for (let z = 1700; z > zN; z -= 90) { const l = p2(-CARPET_HW + 24, .4, z), r = p2(CARPET_HW - 24, .4, z); ctx.lineWidth = Math.max(1, 2.4 * kz(z)); ctx.beginPath(); ctx.moveTo(...l); ctx.lineTo(...r); ctx.stroke(); }
  for (const s of [-1, 1]) V2.quad3([s * CARPET_HW, 0, zF], [s * (CARPET_HW + 12), 0, zF], [s * (CARPET_HW + 12), 0, zN], [s * CARPET_HW, 0, zN], 'rgba(60,20,20,.16)');
}
function stanchion(X, Z) {
  const k = kz(Z), [x, y] = p2(X, 0, Z);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(30,10,10,.25)'; ell(8, 4, 34, 9); ctx.fill();
  ctx.fillStyle = V2.grad(-14, 0, 14, 0, [[0, '#a8801c'], [.4, '#ffe58a'], [1, '#8a6410']]); ctx.strokeStyle = 'rgba(30,18,6,.75)'; ctx.lineWidth = 2.6;
  ell(0, -4, 28, 10); ctx.fill(); ctx.stroke(); rr(-5.5, -96, 11, 92, 3); ctx.fill(); ctx.stroke(); ell(0, -100, 12, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(-4, -104, 3.5, 3.5); ctx.fill();
  ctx.restore();
}
function rope(X, Z0, Z1) {
  const a = p2(X, 90, Z0), b = p2(X, 90, Z1), m = p2(X, 66, (Z0 + Z1) / 2), k = kz((Z0 + Z1) / 2);
  ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2, ...b);
  ctx.strokeStyle = 'rgba(30,0,8,.8)'; ctx.lineWidth = 9 * k + 2; ctx.stroke(); ctx.strokeStyle = '#c4162f'; ctx.lineWidth = 7 * k; ctx.stroke(); ctx.restore();
}
// the balloons from the welcome, a day later: lower and softer than they were
function balloons(Xc, Zc, t, seed) {
  const cols = ['#ff4f6d', '#ffd23a', '#4aa8ff', '#58c85a', '#c25bd6', '#ff9f1c'], k = kz(Zc), w = p2(Xc, 0, Zc);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(w[0], w[1]); ctx.scale(k, k); rr(-22, -26, 44, 26, 5); ctx.fill(); ctx.stroke(); ctx.restore();
  const list = [];
  for (let i = 0; i < 6; i++) { const bob = Math.sin(t * 1.5 + i * 1.3 + seed) * 9, sway = Math.sin(t * 1.05 + i * .9 + seed) * 7; list.push({ i, x: Xc + (i - 2.5) * 34 + sway, y: 250 + (i % 3) * 46 + (i === 1 || i === 4 ? 30 : 0) + bob, z: Zc + (i % 2) * 20 }); }
  list.sort((a, b) => b.z - a.z);
  for (const b of list) {
    const q = p2(b.x, b.y, b.z), kk = kz(b.z), R = 58 * kk;
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kk); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * k); ctx.quadraticCurveTo(lerp(w[0], q[0], .5) + 14 * Math.sin(t + b.i), lerp(w[1], q[1], .6), q[0], q[1] + R * 1.12); ctx.stroke();
    ctx.fillStyle = V2.radial(q[0] - R * .3, q[1] - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, cols[b.i]], [1, mixc(cols[b.i], '#2a1030', .45)]]);
    ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = Math.max(2, 2.6 * kk); ell(q[0], q[1], R * .8, R); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cols[b.i]; ctx.beginPath(); ctx.moveTo(q[0] - 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0] + 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0], q[1] + R * 1.0 + 11 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ell(q[0] - R * .34, q[1] - R * .44, R * .13, R * .25, -.5); ctx.fill();
  }
  ctx.restore();
}
// Persimmon's welcome banner, reused: WELCOME PERSIMMON with a patch of paper taped over each word (the letters still stick out at both ends)
function banner(t) {
  const Z = 1500, X0 = -470, X1 = 470, Y0 = 612, Y1 = 692, k = kz(Z), wv = x => 4 * k * Math.sin(x * .009 + t * 1.8);
  const tl = p2(X0, Y1, Z), tr = p2(X1, Y1, Z), bl = p2(X0, Y0, Z), br = p2(X1, Y0, Z);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(50,40,40,.7)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, X0], [tr, X1]]) { const c = p2(X, CH, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = V2.grad(0, tl[1], 0, bl[1], [[0, '#e93a8a'], [1, '#b0185f']]); ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = Math.max(4, 8 * k);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0)); for (let i = 1; i <= 24; i++) ctx.lineTo(lerp(tl[0], tr[0], i / 24), tl[1] + wv(i * 36)); for (let i = 24; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / 24), bl[1] + wv(i * 36 + 90)); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  const cx = (tl[0] + tr[0]) / 2, cy = (tl[1] + bl[1]) / 2 + 1.5 * k, sz = 78 * k, maxW = (tr[0] - tl[0]) * .9;
  ctx.save(); ctx.translate(cx, cy);
  text('WELCOME PERSIMMON', 0, 0, { size: sz, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 7 * k, stroke: '#6a0c3a', spacing: 3, maxW });
  // where the two words sit, from the same measurement the text used
  ctx.font = `400 ${sz}px Bangers`; ctx.letterSpacing = '3px'; const wW = ctx.measureText('WELCOME').width, wS = ctx.measureText(' ').width, wP = ctx.measureText('PERSIMMON').width, tot = wW + wS + wP, sc = Math.min(1, maxW / tot); ctx.letterSpacing = '0px';
  const lx = -tot * sc / 2, patch = (x0, w, str, rot, fs) => {
    ctx.save(); ctx.translate(x0 + w / 2, sz * .13); ctx.rotate(rot); const h = sz * .66;   // shorter than the letters: the old lettering still shows above the patch
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 5 * k; ctx.shadowOffsetY = 3 * k; ctx.fillStyle = '#fbf6e6'; ctx.strokeStyle = 'rgba(60,40,30,.5)'; ctx.lineWidth = 1.6; rr(-w / 2, -h / 2, w, h, 2); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
    text(str, 0, 2 * k, { size: fs, font: 'Bangers', weight: 400, fill: '#1b2a6b', spacing: 2, maxW: w * .94 });
    ctx.fillStyle = 'rgba(244,232,168,.7)'; for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * (w / 2 - 6 * k), -h / 2 + 2 * k); ctx.rotate(sx * .7); ctx.fillRect(-14 * k, -5 * k, 28 * k, 10 * k); ctx.restore(); }
    ctx.restore();
  };
  patch(lx - wW * sc * .02, wW * sc * 1.04, BANNER_TOP, -.03, sz * .62);
  patch(lx + (wW + wS) * sc - wP * sc * .02, wP * sc * 1.04, BANNER_NAME, .025, sz * .62);
  ctx.restore();
  for (let i = 0; i < 11; i++) { const u = (i + .5) / 11, px = lerp(bl[0], br[0], u), py = bl[1] + wv(u * 24 * 36 + 90) + 3; ctx.fillStyle = ['#ffd23a', '#4aa8ff', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 16 * k, py); ctx.lineTo(px + 16 * k, py); ctx.lineTo(px, py + 34 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
// the lot through the glass: a bright cold night (moon, stars, a pale lit lot, lamp posts, one old car waiting), bright enough that anyone in the doorway is a silhouette
function exterior(t) {
  const hy = V2.P.hy;
  ctx.fillStyle = V2.grad(0, 440, 0, hy + 80, [[0, '#14226a'], [.5, '#3558b4'], [1, '#a9ccff']]); ctx.fillRect(-100, 400, W + 200, hy - 320);
  A7.stars(t, 840, { n: 90, seed: 11, a: .85 });
  { const [mx, my] = p2(170, 480, 3800), r = 150 * kz(3800); V2.glow(mx, my, r * 4.2, '200,225,255', .55, 'screen', .6); ctx.fillStyle = '#f6f3df'; ell(mx, my, r, r); ctx.fill(); ctx.fillStyle = 'rgba(160,150,170,.35)'; for (const [dx, dy, q] of [[-.3, -.2, .26], [.28, .2, .2], [-.05, .4, .14], [.34, -.32, .1]]) { ell(mx + dx * r, my + dy * r, q * r, q * r); ctx.fill(); } }
  onZ(3800, -1700, 1700, 0, 480, '#1d2a5a');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 16; c++) if (hash(r * 16 + c + 7) > .42) { const x0 = -1500 + c * 190; onZ(3800, x0, x0 + 80, 90 + r * 130, 160 + r * 130, 'rgba(255,224,150,.9)'); }
  const yh = p2(0, 0, 3800)[1];
  ctx.fillStyle = V2.grad(0, yh, 0, 1250, [[0, '#6f88c8'], [.4, '#34447e'], [1, '#1c2754']]); ctx.fillRect(-100, yh, W + 200, 1250 - yh);
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineCap = 'butt';
  for (const x of [-900, -450, 0, 450, 900]) { const a = p2(x, 0, 1800), b = p2(x, 0, 3700); ctx.lineWidth = Math.max(1.5, 8 * kz(2000)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  S6.lampPost(-250, 1950, { on: .8 }); S6.lampPost(380, 2850, { on: .8 });
  S6.car3(-520, 2250, { color: '#7d8796', brake: .1 });
  const [gx, gy] = p2(0, 60, 2000); V2.glow(gx, gy, 700 * kz(2000), '190,220,255', .4, 'screen', .4);   // the cold light on the ground just outside
}
// the lobby: shell, glass entrance (the leaves come back as glass(), drawn in the right order against anyone walking through), the sign, the banner, the carpet, the lamps and the light.
// o: t (seconds), open (0..1 door leaves), S0 (clock seconds), cold (0..1: the night coming in)
function lobby(o) {
  const t = o.t ?? 0, open = o.open ?? 0, cold = o.cold ?? 0, P = V2.P, k = kz(ZB);
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#dcc59f', wain: '#6b4a3a', floorA: '#bb9f74', floorB: '#7c6650', fog: '#46303a', fogAmt: .3, tile: 160, rail: 120, ceil: '#d6c9b4' });
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = V2.radial(540, 1000, 240, 1350, [[0, 'rgba(255,247,230,1)'], [.55, 'rgba(216,182,148,1)'], [1, 'rgba(110,84,82,1)']]); ctx.fillRect(-400, -400, W + 800, H + 800); ctx.restore();
  // the glass entrance: frame, the lot beyond it
  onZ(ZB, DX0 - 26, DX1 + 26, 0, DY1 + 26, '#222a38', 'rgba(10,8,20,.75)', 2.6);
  { const f = [p2(DX0, 0, ZB), p2(DX1, 0, ZB), p2(DX1, DY1, ZB), p2(DX0, DY1, ZB)];
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); exterior(t); ctx.restore(); }
  onZ(ZB, DX0 - 26, DX1 + 26, DY1 + 26, DY1 + 100, '#1d2330', 'rgba(255,226,170,.5)', 2); onZ(ZB, -40, 40, DY1 + 6, DY1 + 22, '#0e1018');
  { const [sx, sy] = p2(0, DY1 + 63, ZB); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${30 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '3px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  // plants, the wall clock
  S6.plant3(-600, 1500, 1.0); S6.plant3(600, 1560, 1.0);
  for (const z of [300, 900, 1500]) if (z + 150 > P.cz + 150) { S6.ceilingLamp(-260, z, CH, 1, '255,226,170'); S6.ceilingLamp(260, z, CH, 1, '255,226,170'); }
  { const [cx, cy] = p2(480, 560, ZB); ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); dial(70, o.S0 ?? 0); ctx.restore(); }
  banner(t);
  balloons(-575, 1610, t, 0); balloons(575, 1610, t, 2.3);
  // light: a cool spill from the glass across the floor (it grows when the doors open), laid down before the carpet so the carpet stays crimson, then a faint second pass over it
  const fa = p2(DX0, 0, ZB), fb = p2(DX1, 0, ZB), fc = p2(560, 0, P.cz + 260), fd = p2(-560, 0, P.cz + 260), cl = .12 + .16 * open + .1 * cold;
  const spill = m => { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, fa[1], 0, fc[1], [[0, `rgba(110,164,255,${cl * m})`], [.6, `rgba(110,164,255,${(.05 + .08 * open + .06 * cold) * m})`], [1, 'rgba(110,164,255,0)']]);
    ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore(); };
  spill(1.25);
  carpet();
  spill(.3);
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const Z = 1660 - i * 140; if (i) rope(s * 150, Z + 140, Z); stanchion(s * 150, Z); }
  for (const [X, Z] of [[-260, 540], [260, 540], [-260, 1140], [260, 1140], [-260, 1620], [260, 1620]]) if (Z > P.cz + 150) { const [gx, gy] = p2(X, 0, Z); V2.glow(gx, gy, 330 * kz(Z), '255,214,150', .12 * (1 - .5 * cold), 'screen', 0); }
  const [dxx, dyy] = p2(0, 240, ZB); V2.glow(dxx, dyy, 700 * k, '150,200,255', .14 + .34 * open, 'screen', .6);
  if (open > .02) V2.glow(dxx, dyy - 20, 420 * k, '225,240,255', .8 * open, 'screen', .85);
  return {
    door: [dxx, dyy],
    // the door leaves slide aside over the fixed panes
    glass() {
      const sh = open * 150;
      for (const [a, b] of [[-300, -150], [150, 300]]) onZ(ZB, a, b, 0, DY1, 'rgba(190,215,240,.10)', '#222a38', 4);
      for (const [a, b, s] of [[-150 - sh, -sh, 1], [sh, 150 + sh, -1]]) {
        onZ(ZB, a, b, 0, DY1, 'rgba(190,215,240,.13)', '#222a38', 5); onZ(ZB, a, b, 250, 262, 'rgba(255,255,255,.3)');
        const e = s > 0 ? b : a; onZ(ZB, e - 12 + (s > 0 ? 0 : 0), e - 4 + (s > 0 ? 0 : 0), 190, 330, '#c9ced6', '#222a38', 1.5);
      }
    },
  };
}

// ------------------------------------------------------------------ the pay stub: a receipt printer, the paper rising out of its slot a line at a time
const SLOT_Y = 1130, YV = SLOT_Y - 26, PX0 = 196, PX1 = 884;   // YV: where the paper disappears behind the lid
// the lines of the stub and when each prints (the CAKE line lands on the word "cake", BANNER on "banner", NET PAY slaps in just after); the figures add up: 2720.00 - 2715.83 = 4.17
function stubRows() {
  const tc = wordT('s1', 'cake', 3.21), tb = wordT('a2', 'banner', 4.22);
  return [
    { kind: 'lead', pitch: 30, t: 2.20 },
    { kind: 'head', txt: 'FRUIT BOWL REHAB & NURSING', pitch: 46, t: 2.27 },
    { kind: 'title', txt: 'FINAL PAY STUB', pitch: 80, t: 2.34 },
    { kind: 'info', l: 'STRAWBERRY, RN', r: '80 HRS x $34.00', pitch: 46, t: 2.42 },
    { kind: 'rule', pitch: 28, t: 2.49 },
    { kind: 'item', l: 'GROSS PAY', r: '$2,720.00', pitch: 56, t: 2.57 },
    { kind: 'item', l: 'TAXES', r: '-$544.00', pitch: 56, t: 2.69 },
    { kind: 'item', l: 'PIZZA FUND', r: '-$1,800.00', pitch: 56, t: 2.81 },
    { kind: 'item', l: 'MISC. FEES (POLICY)', r: '-$141.33', pitch: 56, t: 2.93 },
    { kind: 'item', l: 'CAKE (MISSING AN R)', r: '-$112.50', pitch: 56, t: tc - .02, hl: tc + .12 },
    { kind: 'item', l: 'BANNER (PERSIMMON\'S)', r: '-$118.00', pitch: 56, t: tb - .02, hl: tb + .12 },
    { kind: 'rule', pitch: 28, t: tb + .12 },
    { kind: 'item', l: 'TOTAL DEDUCTIONS', r: '-$2,715.83', pitch: 56, t: tb + .2 },
    { kind: 'net', pitch: 170, t: 4.5 },
  ];
}
const INKC = '#2b3040';
function stubRow(r, y0, lt) {   // one printed line, y0 is its top edge
  const cx = (PX0 + PX1) / 2, cy = y0 + r.pitch / 2, L = PX0 + 34, R = PX1 - 34;
  if (r.kind === 'head') text(r.txt, cx, cy, { size: 29, fill: INKC, weight: 900, spacing: 2, maxW: PX1 - PX0 - 50 });
  else if (r.kind === 'title') { text(r.txt, cx, cy + 2, { size: 78, font: 'Bangers', weight: 400, fill: INKC, spacing: 3, maxW: PX1 - PX0 - 50 }); }
  else if (r.kind === 'info') { text(r.l, L, cy, { size: 27, fill: '#4a5064', weight: 900, align: 'left', spacing: 1 }); text(r.r, R, cy, { size: 27, fill: '#4a5064', weight: 900, align: 'right', spacing: 1 }); }
  else if (r.kind === 'rule') { ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.setLineDash([12, 9]); ctx.beginPath(); ctx.moveTo(L, cy); ctx.lineTo(R, cy); ctx.stroke(); ctx.setLineDash([]); }
  else if (r.kind === 'item') {
    const hl = r.hl != null ? seg(lt, r.hl, r.hl + .22) : 0, red = hl > .5;
    ctx.font = '900 33px Nunito'; ctx.letterSpacing = '1px'; const wl = ctx.measureText(r.l).width, wr = ctx.measureText(r.r).width; ctx.letterSpacing = '0px';
    if (hl > 0) { ctx.fillStyle = 'rgba(255,226,53,.78)'; ctx.fillRect(L - 8, cy - 25, (wl + 16) * easeOut(hl), 50); }
    text(r.l, L, cy, { size: 33, fill: red ? '#8a0f22' : INKC, weight: 900, align: 'left', spacing: 1 });
    ctx.fillStyle = '#7a8094'; for (let x = L + wl + 14; x < R - wr - 14; x += 11) { ell(x, cy + 10, 1.8, 1.8); ctx.fill(); }
    text(r.r, R, cy, { size: 33, fill: red ? '#d62a3a' : INKC, weight: 900, align: 'right', spacing: 1 });
    if (hl > .3) { ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; const q = easeOut(clamp((hl - .3) / .7)); ctx.beginPath(); ctx.moveTo(R - wr - 8, cy + 26); ctx.lineTo(lerp(R - wr - 8, R + 6, q), cy + 24); ctx.stroke(); }
  } else if (r.kind === 'net') {
    const k = seg(lt, r.t - .02, r.t + .16), sc = lerp(1.55, 1, easeOut(k)), sh = (1 - k) * 6 * Math.sin(lt * 90);
    text('NET PAY', L, y0 + 66, { size: 62, font: 'Bangers', weight: 400, fill: INKC, align: 'left', spacing: 2 });
    ctx.save(); ctx.translate(R - 120 + sh, y0 + 64); ctx.scale(sc, sc);
    text('$4.17', 120, 0, { size: 154, font: 'Bangers', weight: 400, fill: '#d62a3a', lw: 12, stroke: '#150f22', align: 'right', spacing: 2 });
    ctx.restore();
    ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; const ul = ez(lt, r.t + .2, r.t + .45);
    ctx.beginPath(); ctx.moveTo(L + 150, y0 + 124); ctx.lineTo(lerp(L + 150, R + 4, ul), y0 + 122 - 4 * ul); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(L + 190, y0 + 136); ctx.lineTo(lerp(L + 190, R - 20, ul), y0 + 134 - 3 * ul); ctx.stroke();
  }
}
// the printer's body, drawn over the paper's foot so the paper comes out of the slot
function printer(lt, o = {}) {
  const x0 = 130, x1 = 950, ty = SLOT_Y - 30, by = SLOT_Y + 250, busy = o.busy ?? 0;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18; ctx.fillStyle = '#c9c3b2'; rr(x0, SLOT_Y - 6, x1 - x0, by - SLOT_Y + 6, 34); ctx.fill(); ctx.shadowColor = 'transparent';
  // the body
  ctx.fillStyle = V2.grad(0, SLOT_Y, 0, by, [[0, '#ddd8ca'], [.6, '#c4beac'], [1, '#a7a08c']]); rr(x0, SLOT_Y - 6, x1 - x0, by - SLOT_Y + 6, 34); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  // the lid with the slot
  ctx.fillStyle = V2.grad(0, ty, 0, SLOT_Y + 10, [[0, '#f0ece0'], [1, '#d3cdbc']]); rr(x0 - 8, ty, x1 - x0 + 16, 52, 22); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#15121a'; rr(PX0 - 8, SLOT_Y - 16, PX1 - PX0 + 16, 17, 6); ctx.fill();
  // the serrated tear bar
  ctx.fillStyle = '#b9bec8'; ctx.beginPath(); ctx.moveTo(PX0 - 8, SLOT_Y + 3); for (let x = PX0 - 8; x < PX1 + 8; x += 12) { ctx.lineTo(x + 6, SLOT_Y + 14); ctx.lineTo(x + 12, SLOT_Y + 3); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(25,16,30,.6)'; ctx.lineWidth = 1.6; ctx.stroke();
  // the LCD, the LEDs, the big button, the plate
  ctx.fillStyle = '#0c1a10'; rr(190, SLOT_Y + 52, 250, 78, 10); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  text(busy > .5 ? 'PRINTING...' : 'READY', 315, SLOT_Y + 91, { size: 40, font: 'Bangers', weight: 400, fill: busy > .5 ? '#ffd23a' : '#58ff7a', spacing: 3 });
  V2.emit(315, SLOT_Y + 91, 70, busy > .5 ? '255,210,60' : '88,255,122', .3);
  for (let i = 0; i < 3; i++) { const on = i === 0 ? 1 : i === 1 ? (Math.sin(lt * 18) > 0 ? busy : 0) : 0; ctx.fillStyle = on > .5 ? ['#58ff7a', '#ffd23a', '#ff4a52'][i] : '#3a3a40'; ell(480 + i * 38, SLOT_Y + 70, 10, 10); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); if (on > .5) V2.emit(480 + i * 38, SLOT_Y + 70, 36, ['88,255,122', '255,210,60', '255,70,80'][i], .45); }
  const bp = o.press ?? 0;
  ctx.fillStyle = '#7a0f1e'; ell(790, SLOT_Y + 108, 56, 56); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = V2.grad(0, SLOT_Y + 60 + bp * 6, 0, SLOT_Y + 150, [[0, '#ff6a78'], [1, '#d6203a']]); ell(790, SLOT_Y + 104 + bp * 6, 46, 44 - bp * 4); ctx.fill(); ctx.stroke();
  text('PRINT', 790, SLOT_Y + 104 + bp * 6, { size: 30, font: 'Bangers', weight: 400, fill: '#fff', spacing: 2 });
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ell(774, SLOT_Y + 84, 12, 6, -.5); ctx.fill();
  ctx.fillStyle = '#2a2736'; rr(250, SLOT_Y + 160, 580, 64, 10); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  text('PAY-O-MATIC 3000', 540, SLOT_Y + 193, { size: 46, font: 'Bangers', weight: 400, fill: '#ffd23a', spacing: 4 });
  ctx.strokeStyle = 'rgba(40,30,20,.35)'; ctx.lineWidth = 4; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(180, SLOT_Y + 160 + i * 12); ctx.lineTo(230, SLOT_Y + 160 + i * 12); ctx.moveTo(850, SLOT_Y + 160 + i * 12); ctx.lineTo(900, SLOT_Y + 160 + i * 12); ctx.stroke(); }
  ctx.restore();
}
function insStub(lt, bg) {
  V2.dof(16, bg); ctx.save(); ctx.fillStyle = 'rgba(10,6,14,.52)'; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  const rows = stubRows(); let A = 0, S = 0; const adv = rows.map(r => r.pitch * ez(lt, r.t - .02, r.t + (r.kind === 'net' ? .16 : .08)));
  A = adv.reduce((a, b) => a + b, 0);
  const top = YV - A, busy = rows.some(r => lt > r.t - .05 && lt < r.t + .16) ? 1 : 0;
  // each print step jolts the paper a hair
  let jx = 0; for (const r of rows) { const u = lt - r.t; if (u > 0 && u < .2) jx += Math.exp(-u * 24) * 2.2 * Math.sin(u * 80 + r.t * 9); }
  if (A > 1) {
    ctx.save(); ctx.translate(jx, 0); ctx.beginPath(); ctx.rect(PX0 - 30, 0, PX1 - PX0 + 60, YV + 4); ctx.clip();
    // the sheet: a torn leading edge, soft shading toward both sides, a faint curl at the top
    const sheet = new Path2D(); sheet.moveTo(PX0, YV + 20); sheet.lineTo(PX0, top + 4); for (let x = PX0; x <= PX1; x += 14) sheet.lineTo(x, top + ((x / 14 | 0) % 2 ? 5 : -2)); sheet.lineTo(PX1, top + 4); sheet.lineTo(PX1, YV + 20); sheet.closePath();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 12; ctx.fillStyle = '#fbf9ef'; ctx.fill(sheet); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.clip(sheet);
    ctx.fillStyle = V2.grad(PX0, 0, PX1, 0, [[0, 'rgba(120,110,90,.22)'], [.08, 'rgba(120,110,90,0)'], [.92, 'rgba(120,110,90,0)'], [1, 'rgba(120,110,90,.26)']]); ctx.fillRect(PX0, top, PX1 - PX0, A + 20);
    ctx.fillStyle = V2.grad(0, top, 0, top + 70, [[0, 'rgba(120,110,90,.2)'], [1, 'rgba(120,110,90,0)']]); ctx.fillRect(PX0, top, PX1 - PX0, 70);
    rows.forEach((r, j) => { const y0 = YV + (S - A); S += r.pitch; if (y0 + r.pitch > 0 && y0 < YV) stubRow(r, y0, lt); });
    ctx.restore(); ctx.restore();
  }
  // Strawberry's boss presses the button, and takes his hand away
  const gp = seg(lt, 2.12, 2.2) * (1 - seg(lt, 2.34, 2.56));
  printer(lt, { busy, press: lt > 2.18 && lt < 2.3 ? 1 : 0 });
  if (gp > 0) glove(790 + 20 * (1 - gp) + 4, SLOT_Y + 100 + 40 * (1 - gp), -2.55, 2.6);
  // the NET PAY slap: a ring, a flash and a few coins
  const nt = rows[rows.length - 1].t, nk = lt - nt;
  if (nk > 0 && nk < .8) { const ny = YV - 170 + 66; V2.ring(540, ny, nk / .7, { color: '255,214,120', r0: 80, r1: 520, lw: 14, alpha: .8 }); V2.glow(540, ny, 520, '255,200,110', .3 * (1 - nk / .8), 'screen', .5); }
  reg('overlay', [130, Math.min(Math.max(top - 6, 252), SLOT_Y - 30), 950, SLOT_Y + 250], { id: 'stub' });
}

// ------------------------------------------------------------------ confetti cannon (a copy of the Episode 9 burst): thrown up and inward from one side of the frame, falling back under gravity
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

// ============================================================================ the front door, 11:00 PM
// a long lens from the back of the lobby for the whole scene: depth is compressed, so the line-up reads as a funnel running into the glass. Where everyone stands (X, Z):
// Mango and Mrs. Cranberry at the front of the funnel, Lemon inside Mango, the principals at the apex (250 units from the glass); Clementine, Banana and Pineapple soft behind
const CAMB = { f: 2100, cy: 360, hy: 860 }, CZ0 = -1100;
const ST = .9;   // the staff stand a little smaller than the principals, so the funnel fits the frame without anyone standing on anyone's face
const POS = { mango: [-440, 1000], cran: [345, 1000], lemon: [240, 1250], admin: [-250, 1450], straw: [85, 1450], banana: [400, 1580], pine: [-390, 1520] };
const T_TURN = 8.7, T_WALK = 9.0, T_DOOR = 10.35, T_CLAP = 9.42;   // Strawberry turns, walks, reaches the glass; the staff start to clap
const SP = route([[0, ...POS.straw], [T_WALK, ...POS.straw], [T_WALK + .3, 15, 1480, 'io'], [T_DOOR, 15, ZB + 4], [T_DOOR + .55, 15, ZB + 160]]);
const D = {};
D.ends = () => [['clk', B('a1').s - .02], ['two', B('a1').e - .33], ['stub', B('s2').s - .07], ['cuS', B('a3').s - .1], ['cuA', B('a4').s - .03], ['two2', B('out').s - .04], ['out', 1e9]];
D.shot = lt => D.ends().find(([, e]) => lt < e)[0];
D.cz = lt => lt >= B('out').s - .04 ? lerp(CZ0, CZ0 + 90, ez(lt, B('out').s - .04, CUR.dur)) : CZ0;
D.open = lt => ez(lt, 9.36, 9.98) * (1 - ez(lt, 10.6, 10.96));          // the glass slides on the slidedoor cue (9.36) and closes behind her
D.cold = lt => ez(lt, 9.3, 10.4) * (1 - .6 * ez(lt, 10.6, 10.96));
D.S0 = lt => 120 + (lt - .2);                                             // clock seconds: exactly 11:00:00 on the tick cue

D.cast = lt => {
  const b = id => B(id), q = k => V2.at(...POS[k]);
  const hT = wordT('a1', 'paycheck', 1.87) + .12;                        // the envelope changes hands just after "pay"
  const tr = lt < 1.3;                                                     // anyone the pull-back crops is entering the picture, not cut off
  const clap = lt >= T_CLAP && lt < 10.95, cp = .5 + .5 * Math.sin(lt * 17), hop = clap ? Math.abs(Math.sin(lt * 9)) * 16 : 0;
  const qa = q('admin'), sa = qa.s * 1.2, qs = q('straw');
  const M = [lerp(qa.x, qs.x, .5), qa.y - 205 * sa];                       // where the envelope changes hands: chest height, halfway between them
  // ---- the Administrator
  const adm = melon(Object.assign(qa, { s: sa, look: lt < 1.3 ? [.5, .05] : inB(lt, 'a3') ? [.1, -.15] : lt >= b('out').s ? [.55, -.25] : [.3, .03], expr: 'happy', hold: {}, grip: {}, hand: {}, arms: { l: 'hips', r: 'hips' }, transit: tr }));
  const give = ez(lt, 1.3, 1.82) * (1 - ez(lt, hT + .03, hT + .42));
  if (give > .01) { if (lt < hT) adm.hold = { r: 'envelope10' }; handTo(adm, 1, M[0], M[1], give, [150, 76]); }
  else if (lt < 1.3) { adm.hold = { r: 'envelope10' }; adm.grip = { r: [150, 76] }; adm.arms = { l: 'hips', r: 'hold' }; }
  if (lt >= b('a3').s - .05 && lt < b('a3').e + .3) { adm.arms.r = 'hold'; adm.grip = { r: [156, -30] }; adm.hand = { r: 'thumb' }; }
  if (lt >= b('a4').s - .1 && lt < b('out').s + .1) { adm.arms.r = 'hold'; adm.grip = { r: [96, -72] }; adm.hand = { r: 'flat' }; }
  if (lt >= b('out').s + .25) { adm.arms = { l: 'wave', r: 'hips' }; adm.hand = { l: 'wave' }; }
  // ---- Strawberry: tired, deadpan; a squeeze through the profile turns her round on "service"; from behind she is a backlit silhouette
  const turnK = seg(lt, T_TURN, T_TURN + .3), back = turnK >= .5 && lt >= T_TURN;
  const sw = Math.sin(window.H6.pathDist(SP, lt) / 84 * PI), walking = lt >= T_WALK;
  const sp = person(straw, SP, lt, { id: 'straw', stride: 46, expr: inB(lt, 's2') && lt > wordT('s2', 'persimmon', 5.19) - .05 ? 'sour' : 'dead', lid: .5, noFace: back, acc: back ? [] : ['steth', 'badge7', 'bandage7'],
    look: lt < hT ? [-.3, .35] : inB(lt, 's2') ? [-.4, -.1] : lt < b('a4').s ? [.45, 0] : [.2, 0], sx: lt >= T_TURN && lt < T_TURN + .3 ? Math.max(.1, Math.abs(Math.cos(turnK * PI))) : undefined, arms: { l: 'rest', r: 'rest' }, transit: tr });
  const reach = ez(lt, 1.6, 2.0) * (1 - ez(lt, hT + .03, hT + .42));
  if (reach > .01) handTo(sp, -1, M[0], M[1], reach, [-100, 40]);
  if (lt >= hT) { sp.hold = { l: 'envelope10' }; sp.arms = { l: 'hold', r: 'rest' }; if (lt >= hT + .4) sp.grip = { l: [-134, 62] }; }
  if (walking) { sp.arms.r = [.28 - .35 * sw, .25]; sp.arms.l = 'hold'; sp.grip = { l: [-134, 62] }; sp.hold = { l: 'envelope10' }; }
  { const dk = ez(lt, T_WALK, T_DOOR - .3), c0 = KINDS.straw.c; if (dk > 0) { sp.colors = [mixc(c0[0], '#3a2450', dk), mixc(c0[1], '#1e1236', dk), mixc(c0[2], '#0b0620', dk)]; sp.shadowA = lerp(.5, .95, dk); } }
  // ---- the staff
  const mg = mango(Object.assign(q('mango'), { s: q('mango').s * ST, id: 'mango', expr: lt >= T_CLAP ? 'happy' : 'sad', look: lt >= b('out').s ? [.5, -.15] : [.6, 0], arms: { l: 'rest', r: 'rest' }, lift: hop * .6, transit: tr }));
  const lm = lemon(Object.assign(q('lemon'), { s: q('lemon').s * ST, id: 'lemon', expr: 'neutral', look: lt >= b('out').s ? [-.4, -.1] : [-.55, 0], grip: { l: [-16, 78], r: [16, 78] }, hand: { l: 'grip', r: 'grip' }, arms: { l: 'hold', r: 'hold' }, transit: tr }));   // hands folded in front of her: formal, and nothing tall beside her face
  const qc = q('cran'), cr = cran({ x: qc.x, y: qc.y - 118 * qc.s * ST, s: qc.s * ST, id: 'cran', noLegs: true, noShadow: true, noReflect: true, expr: 'happy', look: lt >= b('out').s ? [-.5, -.2] : [-.6, 0], arms: { l: 'rest', r: 'rest' }, transit: tr });
  if (clap) {
    mg.grip = { l: [-lerp(8, 56, cp), 74], r: [lerp(8, 56, cp), 74] }; mg.arms = { l: 'hold', r: 'hold' }; mg.hand = { l: 'flat', r: 'flat' };
    cr.grip = { l: [-lerp(6, 46, cp), 54], r: [lerp(6, 46, cp), 54] }; cr.arms = { l: 'hold', r: 'hold' }; cr.hand = { l: 'flat', r: 'flat' };
    { const lc = .5 + .5 * Math.sin(lt * 7); lm.hand = {}; lm.grip = { l: [-lerp(16, 34, lc), 72], r: [lerp(16, 34, lc), 72] }; lm.arms = { l: 'hold', r: 'hold' }; lm.hand = { l: 'flat', r: 'flat' }; }   // a slow, small, entirely sincere golf clap
  }
  const bn = banana(Object.assign(q('banana'), { s: q('banana').s * ST, id: 'banana', expr: 'happy', look: lt >= b('out').s ? [-.35, -.2] : [-.5, 0], transit: tr, arms: clap ? { l: 'cheer', r: 'wave' } : { l: 'rest', r: 'rest' }, lift: clap ? hop * .8 : 0 }));
  const pn = pine(Object.assign(q('pine'), { id: 'pine', who: null, acc: [], expr: 'happy', look: [.5, 0], arms: clap ? { l: 'wave', r: 'cheer' } : { l: 'rest', r: 'rest' }, lift: clap ? hop : 0 }));
  return { adm, sp, mg, lm, cr, bn, pn, qc, M, hT };
};

D.cam = function (lt) {
  const sh = D.shot(lt), b = id => B(id);
  V2.setCam(Object.assign({ cz: D.cz(lt) }, CAMB));
  const c = D.cast(lt); CAM.shake = 0;
  const faceY = o => faceC(o)[1];
  if (sh === 'clk') {   // a macro of the wall clock, then the pull-back to the wide: a 2D zoom, so the whole lobby (and the cast waiting in it) comes into the frame at once
    const [cx, cy] = V2.p2(480, 560, ZB), k = ez(lt, .42, 1.25), z = Math.exp(lerp(Math.log(8), Math.log(.96), k));
    zoomTo(lerp(cx, 540, k), lerp(cy, 1010, k), z);
  } else if (sh === 'two' || sh === 'two2') {
    const k = seg(lt, sh === 'two' ? b('a1').s - .02 : b('a4').s - .03, sh === 'two' ? b('a1').e : b('out').s), z = lerp(1.6, 1.72, k);
    zoomTo((c.adm.x + c.sp.x) / 2, (faceY(c.adm) + faceY(c.sp)) / 2 + 150 / z, z);
  } else if (sh === 'cuS') camFace(c.sp, lerp(2.4, 2.55, seg(lt, b('s2').s, b('s2').e)), 150);
  else if (sh === 'cuA') {   // the Administrator, then a tilt up to the banner behind him
    const k = ez(lt, 6.8, 7.28), by = V2.p2(0, 652, 1500)[1], z = lerp(lerp(2.0, 2.1, seg(lt, b('a3').s, b('a3').e)), 1.3, k), [fx, fy] = faceC(c.adm);
    zoomTo(lerp(fx, 540, k), lerp(fy + 130 / 2.05, by + 250 / 1.3, k), z);
  } else if (sh === 'out') { const k = ez(lt, b('out').s - .04, CUR.dur); zoomTo(540, lerp(1010, 980, k), lerp(.96, .99, k)); }
};

D.draw = function (lt) {
  const b = id => B(id), sh = D.shot(lt), c = D.cast(lt), open = D.open(lt), cold = D.cold(lt), S0 = D.S0(lt);
  const rig = back => {   // warm key, cool rim from the glass; a backlit variant for the walk into the night
    V2.setLight(Object.assign({ key: [-.35, -.8], keyColor: '#ffe3b8', keyA: .26, rim: '#8fb8ff', rimA: .5, shadow: '#1a1030', shadowA: .42, amb: '#ffd9b0', ambA: .07, bounce: '#ffcf99', bounceA: .2 }, back ? { back: { color: '190,222,255', a: .9, w: 24 }, frontDark: .78, shadow: '#070a24', shadowA: .6, shadowLong: 1.1 } : {}));
    V2.addLight({ x: 540, y: 960, r: 1000, color: '150,196,255', a: .16 + .26 * open });
  };
  V2.opts.reflect = true;
  const lobbyArgs = { t: lt + 3, open, cold, S0 };
  if (sh === 'stub') { rig(false); insStub(lt, () => { const L = lobby(lobbyArgs); L.glass(); }); return; }
  const focus = { two: ['adm', 'sp'], two2: ['adm', 'sp'], cuS: ['sp'], cuA: ['adm'] }[sh] || null, wide = !focus;
  const rack = ez(lt, 6.8, 7.3), blurPx = { two: 5, two2: 5, cuS: 8, cuA: lerp(8, 0, rack) }[sh] || 0;
  let L; V2.dof(blurPx, () => { L = lobby(lobbyArgs); if (!wide) L.glass(); });
  burst(lt, 9.46, 1, 64); burst(lt, 9.5, -1, 64);
  rig(false);
  // the cast, far to near. Background fruit are always soft (a long lens) and never audited; in a close-up everything nearer than the subject is simply left out of the frame
  const softPx = wide ? 3 : 9, soft = o => V2.dof(softPx, () => drawBg(o));
  const items = [
    { z: POS.pine[1], id: 'pn', main: false, draw: () => soft(c.pn) }, { z: POS.banana[1], id: 'bn', main: false, draw: () => soft(c.bn) },
    { z: POS.lemon[1], id: 'lm', main: true, draw: () => drawChar(c.lm) }, { z: POS.mango[1], id: 'mg', main: true, draw: () => drawChar(c.mg) },
    { z: POS.cran[1], id: 'cr', main: true, draw: () => { const q = c.qc; S7.wheelchairBack(q.x, q.y, q.s * ST); drawChar(c.cr); S7.wheelchairFront(q.x, q.y, q.s * ST); } },
    { z: POS.admin[1], id: 'adm', main: true, draw: () => (focus && focus.includes('adm') && sh === 'cuA' && rack > .55 ? soft : drawChar)(c.adm) },
    { z: SP(lt)[1], id: 'sp', main: true, draw: () => { if (c.sp.noFace && lt >= T_WALK) { rig(true); drawChar(c.sp); rig(false); } else drawChar(c.sp); } },
  ];
  if (wide) items.push({ z: ZB, id: 'glass', main: true, draw: () => L.glass() });
  const zf = focus ? Math.min(...items.filter(it => focus.includes(it.id)).map(it => it.z)) : 0;
  items.filter(it => wide || focus.includes(it.id) || (!it.main && it.z >= zf)).sort((a, d) => (focus && !focus.includes(a.id) ? 0 : 1) - (focus && !focus.includes(d.id) ? 0 : 1) || d.z - a.z).forEach(it => it.draw());
  V2.dust(60, 600, 1020, 1400, lt, { n: 22, alpha: .25, color: '255,226,180' });
};
D.fx = lt => {
  const sh = D.shot(lt), c = ez(lt, 9.3, 10.7);
  return { bloom: sh === 'stub' ? .22 : .62 + .1 * c, vignette: .5, grain: .05, contrast: .16, sat: .1, tint: [['#ffd9a0', .13 * (1 - c), 'soft-light'], ['#3a54c8', .24 * c, 'soft-light']],
    fade: Math.max(lt < .2 ? 1 - lt / .2 : 0, seg(lt, CUR.dur - .32, CUR.dur - .02)), fadeColor: '0,0,10', aberr: lt > 9.36 && lt < 9.5 ? 3 : 0 };
};
D.blur = lt => { const sh = D.shot(lt); return sh === 'clk' && lt > .4 && lt < 1.3 ? 4 : sh === 'stub' ? 3 : sh === 'out' ? 3 : 1; };
D.over = function (lt) {
  sfxWord(lt, .2, 'TICK', 540, 520, { size: 130, hold: .45, fill: '#fff', rot: .05 });
  sfxWord(lt, 9.36, 'SHHHK', 300, 400, { size: 96, hold: .5, fill: '#bfe4ff', rot: -.07 });
  sfxWord(lt, 9.46, 'YAAAY!', 700, 330, { size: 120, hold: .6, fill: '#ffe135', rot: .05 });
};
window.__EP10_SCENES.door = D;

// ============================================================================ the parking lot, 11:00 PM
// Not Episode 9's blue-violet lot: a teal night, sodium-orange lamps, wet asphalt. A long lens from across the lot (the whole front of the building sits right behind whoever walks toward us),
// and the phone inserts look straight down at the phone while the ground slides under it.
//   0.00 to 1.40  open    the lot: crickets, WE'RE HIRING flapping, a SHIFTGO van pulling in; Strawberry walks out of the glass doors toward us with the envelope
//   1.40 to 2.98  ping    the phone from above (textding 1.40): the notification drops in and grows into the job card; "Fruit Bowl?" begins over it
//   2.98 to 3.80  cuS1    Strawberry, lit by the phone: "...Bowl?"
//   3.80 to 5.40  moonC1  the Moon: "That was fast."
//   5.40 to 6.76  cuS2    Strawberry: "It's short notice."
//   6.76 to 8.16  tap     the phone again: her thumb lands on ACCEPT (click 6.89), sparkle (7.24), YOU'RE BOOKED and five stars (7.39)
//   8.16 to 9.88  moonC2  the Moon: "See you tomorrow."
//   9.88 to 11.45 fin     a held wide under the Moon: "At three." and she walks to her car; the picture fades
const LF = { f: 2400, cy: 330, hy: 1000 }, LZ0 = -1000, ZBL = 2500, CAR = [560, 1560], CARW = 165;
const LAMPS = [[-600, 2230], [700, 2070]];
Object.assign(PROP_BOX, { phone10: Object.assign([-34, -68, 34, 32], { nearFace: true }) });
EXT.prop.phone10 = (side, o, t) => {   // the SHIFTGO lock screen in her hand: a lit violet screen, the app tile, a green button
  ctx.rotate(side * .3);
  ctx.fillStyle = '#16121e'; ctx.strokeStyle = '#4a4458'; ctx.lineWidth = 3; rr(-23, -62, 46, 88, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -54, 0, 18, [[0, '#6c4bff'], [1, '#ff4fa3']]); rr(-18, -54, 36, 72, 6); ctx.fill();
  A9.appIcon(0, -30, 22);
  ctx.fillStyle = '#12c37a'; rr(-13, -2, 26, 11, 5.5); ctx.fill();
};

// a parked car seen from behind: the Episode 6 car with true colours (that one blends its faces through a fog that cannot read rgb() strings, which drops their red)
const lit10 = (c, f) => { const [r, g, b] = V2.rgb(c), q = v => Math.max(0, Math.min(255, v)) | 0; return `rgb(${q(r * f)},${q(g * f)},${q(b * f)})`; };
function car10(X, Z, o = {}) {
  const w = o.w ?? 165, len = o.len ?? 440, c = o.color ?? '#2c8f9a', brake = o.brake ?? .35, bx = S6.box3;
  for (const sx of [-1, 1]) bx({ x0: sx < 0 ? X - w - 6 : X + w - 34, x1: sx < 0 ? X - w + 34 : X + w + 6, y1: 64, z0: Z + 70, z1: Z + 160, color: '#16141c', lw: 1.2 });
  bx({ x0: X - w, x1: X + w, y0: 30, y1: 120, z0: Z, z1: Z + len, color: c, front: lit10(c, 1.0), side: lit10(c, .66), top: lit10(c, 1.24) });
  bx({ x0: X - w * .74, x1: X + w * .74, y0: 120, y1: 204, z0: Z + len * .16, z1: Z + len * .66, color: c, front: lit10(c, .92), side: lit10(c, .64), top: lit10(c, 1.3) });
  { const a = [p2(X - w * .64, 128, Z + len * .16), p2(X + w * .64, 128, Z + len * .16), p2(X + w * .64, 196, Z + len * .16), p2(X - w * .64, 196, Z + len * .16)];
    poly(a, V2.grad(0, a[2][1], 0, a[0][1], [[0, '#2a3a66'], [1, '#101628']]), 'rgba(10,8,20,.7)', 2); }
  bx({ x0: X - w - 2, x1: X + w + 2, y0: 22, y1: 46, z0: Z - 14, z1: Z + 6, color: lit10(c, .5), lw: 1.4 });
  const k = kz(Z);
  for (const [a, b] of [[X - w + 8, X - w + 66], [X + w - 66, X + w - 8]]) { onZ(Z - 14, a, b, 62, 100, `rgb(255,${58 + 120 * (1 - brake) | 0},${58 + 120 * (1 - brake) | 0})`, 'rgba(20,8,12,.7)', 1.6); const [gx, gy] = p2((a + b) / 2, 81, Z - 14); V2.glow(gx, gy, 90 * k, '255,50,50', .5 + .5 * brake, 'screen', .7); }
  onZ(Z - 14, X - 34, X + 34, 48, 78, '#f0eee4', 'rgba(20,16,24,.7)', 1.6);
}
// a sodium lamp post with its pool of light and a wet streak running toward the camera
function lamp(X, Z, o = {}) {
  const h = o.h ?? 700, side = X < 0 ? 1 : -1, k = kz(Z), on = o.on ?? 1;
  S6.box3({ x0: X - 9, x1: X + 9, y1: h, z0: Z, z1: Z + 18, color: '#1c2a30', front: '#2a3a42', side: '#122026', lw: 1.2 });
  S6.box3({ x0: Math.min(X, X + side * 110), x1: Math.max(X, X + side * 110), y0: h - 8, y1: h + 8, z0: Z - 6, z1: Z + 24, color: '#1c2a30', lw: 1.2 });
  const hx = X + side * 112, [lx, ly] = p2(hx, h - 12, Z + 8);
  ctx.fillStyle = `rgba(255,214,150,${.5 + .5 * on})`; ctx.beginPath(); ctx.ellipse(lx, ly + 2 * k, 36 * k, 10 * k, 0, 0, TAU); ctx.fill();
  V2.glow(lx, ly, 330 * k, '255,168,70', .5 * on, 'screen', .2);
  const [gx, gy] = p2(hx, 0, Z + 8);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = V2.radial(gx, gy, 10, 620 * k, [[0, `rgba(255,170,80,${.24 * on})`], [1, 'rgba(255,170,80,0)']]); ctx.beginPath(); ctx.ellipse(gx, gy, 700 * k, 120 * k, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = V2.grad(0, gy, 0, gy + 560 * k, [[0, `rgba(255,190,110,${.2 * on})`], [1, 'rgba(255,190,110,0)']]); ctx.fillRect(gx - 18 * k, gy, 36 * k, 560 * k);
  ctx.restore();
}
// a puddle on the asphalt: a patch of sky, a lamp streak, and a ring now and then where a drop lands
function puddle(X, Z, rx, rz, t, seed) {
  const pts = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, wob = 1 + .09 * Math.sin(a * 3 + seed) + .05 * Math.sin(a * 5 + seed * 2); pts.push(p2(X + Math.cos(a) * rx * wob, 0, Z + Math.sin(a) * rz * wob)); }
  const c = p2(X, 0, Z), k = kz(Z), hh = rz * k;
  ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.fillStyle = V2.grad(0, c[1] - hh, 0, c[1] + hh, [[0, 'rgba(140,215,210,.62)'], [.55, 'rgba(60,130,138,.5)'], [1, 'rgba(14,40,48,.7)']]); ctx.fill();
  ctx.strokeStyle = 'rgba(190,240,236,.35)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  ctx.fillStyle = V2.grad(0, c[1] - hh, 0, c[1] + hh, [[0, 'rgba(255,196,120,.0)'], [.5, 'rgba(255,196,120,.28)'], [1, 'rgba(255,196,120,0)']]); ctx.fillRect(c[0] - rx * k * .25, c[1] - hh, rx * k * .5, hh * 2);
  const q = ((t * .6 + seed * .37) % 1), a = 1 - q;
  ctx.strokeStyle = `rgba(230,250,250,${.5 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c[0] + rx * k * .2 * Math.sin(seed), c[1], rx * k * .55 * q + 2, hh * .55 * q + 1, 0, 0, TAU); ctx.stroke();
  ctx.restore();
}
// the WE'RE HIRING banner over the doors: yellow vinyl, tied at the corners, the bottom edge flapping in the wind (the small print is the joke)
function hireBanner(t) {
  const Z = ZBL - 6, X0 = -440, X1 = 440, Y1 = 720, Y0 = 500, k = kz(Z);
  const wv = (x, ph) => 11 * k * Math.sin(x * .0115 + t * 3.2 + ph) + 5 * k * Math.sin(x * .029 - t * 4.9 + ph * 2);
  const tl = p2(X0, Y1, Z), tr = p2(X1, Y1, Z), bl = p2(X0, Y0, Z), br = p2(X1, Y0, Z), N = 26;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,14,16,.75)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, X0], [tr, X1]]) { const c = p2(X + (X < 0 ? -60 : 60), Y1 + 70, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 14 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = V2.grad(0, tl[1], 0, bl[1], [[0, '#ffe34a'], [1, '#f4b800']]); ctx.strokeStyle = '#3a2a08'; ctx.lineWidth = Math.max(3, 6 * k);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0, 0) * .15); for (let i = 1; i <= N; i++) ctx.lineTo(lerp(tl[0], tr[0], i / N), tl[1] + wv(i * 34, 0) * .15); for (let i = N; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / N), bl[1] + wv(i * 34, 1.3)); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  const cx = (tl[0] + tr[0]) / 2, cy = lerp(tl[1], bl[1], .42), sz = 134 * k;
  ctx.save(); ctx.translate(cx, cy + wv(440, .7) * .4); ctx.rotate(.012 * Math.sin(t * 3.2));
  text("WE'RE HIRING", 0, 0, { size: sz, font: 'Bangers', weight: 400, fill: '#1a1424', spacing: 4, maxW: (tr[0] - tl[0]) * .92 }); ctx.restore();
  ctx.save(); ctx.translate((tl[0] + tr[0]) / 2, lerp(tl[1], bl[1], .86) + wv(440, 1.3) * .6); text('(AGENCY ONLY)', 0, 0, { size: 46 * k, fill: '#5a1a14', weight: 900, spacing: 3 }); ctx.restore();
  ctx.fillStyle = '#3a2a08'; for (const [a, dy] of [[tl, 0], [tr, 0], [bl, wv(0, 1.3)], [br, wv(880, 1.3)]]) { ell(a[0] + (a === tl || a === bl ? 14 : -14) * k, a[1] + (a === tl || a === tr ? 14 : -14) * k + dy, 5 * k, 5 * k); ctx.fill(); }
  ctx.restore();
}
// the front of the building: brick, warm windows, the lit entrance with its canopy and sign, the banner
function building(t) {
  const hw = 1900, bh = 1100, k = kz(ZBL), yTop = p2(0, bh, ZBL)[1], yBot = p2(0, 0, ZBL)[1];
  onZ(ZBL, -hw, hw, 0, bh, V2.grad(0, yTop, 0, yBot, [[0, '#2f2a3c'], [.5, '#4d3a45'], [1, '#6a4a48']]));
  ctx.strokeStyle = 'rgba(20,8,16,.17)'; ctx.lineWidth = Math.max(1, 1.6 * k);
  for (let y = 36; y < bh; y += 36) { const a = p2(-hw, y, ZBL), b = p2(hw, y, ZBL); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  onZ(ZBL, -hw, hw, bh - 34, bh + 26, '#211a28', 'rgba(8,4,12,.6)', 2); onZ(ZBL, -hw, hw, 0, 40, '#5b4a52');
  for (let r = 0; r < 3; r++) for (let c = -7; c <= 7; c++) {
    const xc = c * 250, y0 = [110, 400, 700][r];
    if (r < 2 && Math.abs(xc) < (r ? 520 : 470)) continue;
    const lit = hash(r * 15 + c + 30) > .3;
    onZ(ZBL, xc - 78, xc + 78, y0, y0 + 190, lit ? V2.grad(0, p2(0, y0 + 190, ZBL)[1], 0, p2(0, y0, ZBL)[1], [[0, '#ffe7ad'], [1, '#ffbe5e']]) : '#16202c', 'rgba(8,4,12,.7)', 2.4);
    ctx.strokeStyle = 'rgba(30,14,10,.5)'; ctx.lineWidth = Math.max(1.4, 3 * k); { const a = p2(xc, y0, ZBL), b = p2(xc, y0 + 190, ZBL), c1 = p2(xc - 78, y0 + 100, ZBL), c2 = p2(xc + 78, y0 + 100, ZBL); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.moveTo(...c1); ctx.lineTo(...c2); ctx.stroke(); }
    if (lit) { const [gx, gy] = p2(xc, y0 + 95, ZBL); V2.glow(gx, gy, 230 * k, '255,190,100', .2, 'screen', .08); }
  }
  // the entrance: a lit lobby behind two glass doors
  onZ(ZBL, -330, 330, 0, 340, '#241d2e', 'rgba(8,4,12,.7)', 3);
  onZ(ZBL, -250, 250, 0, 285, V2.grad(0, p2(0, 285, ZBL)[1], 0, p2(0, 0, ZBL)[1], [[0, '#ffd890'], [1, '#fff0c8']]), 'rgba(10,8,20,.7)', 3);
  for (const [a, b] of [[-250, -4], [4, 250]]) onZ(ZBL, a, b, 0, 285, 'rgba(190,225,235,.18)', '#1d1824', 4);
  { const [dx, dy] = p2(0, 140, ZBL); V2.glow(dx, dy, 520 * k, '255,214,150', .45, 'screen', .3); }
  S6.box3({ x0: -400, x1: 400, y0: 345, y1: 395, z0: ZBL - 200, z1: ZBL, color: '#2b2436', front: '#352d42', top: '#443b55', lw: 1.6 });
  { const [sx, sy] = p2(0, 370, ZBL - 200); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${34 * kz(ZBL - 200)}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '2px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  hireBanner(t);
}
// the SHIFTGO van, seen from the side as it drives along the lot: the body, the cab, the app tile and name, the wheels, a beam of headlight and a strobe on the roof
function van(X, Z, t, o = {}) {
  const k = kz(Z), P = (x, y) => p2(X + x, y, Z), lights = o.lights ?? 1;
  const body = [[-300, 48], [-306, 130], [-302, 238], [-284, 256], [168, 256], [212, 250], [292, 156], [320, 140], [326, 76], [312, 48]];
  if (lights > 0) { const f = P(322, 100); V2.beam(f[0], f[1], f[0] + 560 * k, f[1] + 44 * k, 34 * k, 190 * k, '255,236,190', .5 * lights); }
  poly(body.map(([x, y]) => P(x, y)), V2.grad(0, P(0, 256)[1], 0, P(0, 48)[1], [[0, '#8f6bff'], [1, '#4a2fc4']]), '#1b1030', Math.max(2.5, 5 * k));
  poly([[-300, 74], [318, 74], [322, 98], [-304, 98]].map(([x, y]) => P(x, y)), '#ff4fa3');
  poly([[120, 232], [214, 232], [276, 160], [120, 160]].map(([x, y]) => P(x, y)), V2.grad(0, P(0, 232)[1], 0, P(0, 160)[1], [[0, '#9fd0e6'], [1, '#33506a']]), '#1b1030', Math.max(2, 3 * k));
  { const a = P(-30, 236), b = P(-30, 60); ctx.strokeStyle = 'rgba(20,10,40,.7)'; ctx.lineWidth = Math.max(2, 3 * k); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); const h = P(-18, 150); ctx.fillStyle = '#d6d2e4'; rr(h[0] - 3 * k, h[1] - 18 * k, 7 * k, 36 * k, 3 * k); ctx.fill(); }
  { const [lx, ly] = P(-170, 172); ctx.save(); ctx.translate(lx, ly); ctx.scale(k * 1.0, k * 1.0); ctx.fillStyle = '#fff'; rr(-48, -48, 96, 96, 22); ctx.fill(); A9.appIcon(0, 0, 80); ctx.restore();
    const [tx, ty] = P(-12, 176); text('SHIFTGO', tx + 70 * k, ty - 18 * k, { size: 70 * k, font: 'Bangers', weight: 400, fill: '#fff', lw: 5 * k, stroke: '#1b1030', spacing: 3 }); text('NURSES ON DEMAND', tx + 70 * k, ty + 40 * k, { size: 26 * k, fill: '#ffe2f0', weight: 900, spacing: 2 }); }
  for (const wx of [-190, 196]) { const [x, y] = P(wx, 50); ctx.fillStyle = '#0c0a12'; ell(x, y - 2 * k, 58 * k, 58 * k); ctx.fill(); ctx.fillStyle = '#c8cbd6'; ell(x, y - 2 * k, 30 * k, 30 * k); ctx.fill(); ctx.fillStyle = '#6a6e80'; ell(x, y - 2 * k, 11 * k, 11 * k); ctx.fill(); }
  { const [x, y] = P(322, 112); ctx.fillStyle = '#fff6d8'; ell(x, y, 15 * k, 11 * k); ctx.fill(); V2.glow(x, y, 120 * k, '255,236,180', .7 * lights, 'screen', .5); }
  { const [x, y] = P(-306, 118); ctx.fillStyle = `rgb(255,${60 + 100 * (1 - (o.brake ?? .3)) | 0},60)`; rr(x - 7 * k, y - 18 * k, 10 * k, 36 * k, 3 * k); ctx.fill(); V2.glow(x, y, 120 * k, '255,50,50', .25 + .5 * (o.brake ?? .3), 'screen', .5); }
  { const [x, y] = P(-60, 266), on = Math.sin(t * 9) > 0 ? 1 : .25; ctx.fillStyle = `rgba(255,170,40,${.5 + .5 * on})`; rr(x - 26 * k, y - 4 * k, 52 * k, 14 * k, 5 * k); ctx.fill(); V2.glow(x, y, 190 * k, '255,170,40', .55 * on, 'screen', .4); }
}
// the whole lot. o: t, vanX, vanBrake, carLights, moon {x, y, s, expr, look, suppress}
function lotSet(o = {}) {
  const t = o.t ?? 0, ygb = p2(0, 0, ZBL)[1];
  ctx.fillStyle = V2.grad(0, -300, 0, ygb, [[0, '#021a21'], [.45, '#0a3b46'], [.82, '#1a6068'], [1, '#3f8f8e']]); ctx.fillRect(-300, -300, W + 600, ygb + 320);
  A7.stars(t, 520, { n: 110, seed: 31, a: .95 });
  A7.clouds(t, 250, 560, { n: 4, tint: '110,195,195', belly: '12,62,72', a: .26, speed: 8, seed: 5, scale: 1.2 });
  if (o.moon) { const m = o.moon; A7.moon(m.x, m.y, m.s, { t, haloA: .75, suppress: m.suppress !== false, char: { expr: m.expr || 'neutral', look: m.look || [-.5, .4], lid: m.lid } }); }
  building(t);
  // the asphalt, wet: the front of the building mirrored in it, softened and fading with distance, with a few ripples across it
  ctx.fillStyle = V2.grad(0, ygb - 2, 0, H + 200, [[0, '#2c5458'], [.2, '#1d3c42'], [.6, '#10252c'], [1, '#08141a']]); ctx.fillRect(-300, ygb - 2, W + 600, H - ygb + 520);
  ctx.save(); ctx.beginPath(); ctx.rect(-300, ygb, W + 600, H); ctx.clip(); ctx.globalAlpha = .34; ctx.translate(0, 2 * ygb); ctx.scale(1, -1); REG.suppress++; V2.dof(4, () => building(t)); REG.suppress--; ctx.restore();
  ctx.fillStyle = V2.grad(0, ygb, 0, ygb + 800, [[0, 'rgba(8,22,28,0)'], [.5, 'rgba(8,22,28,.45)'], [1, 'rgba(6,16,22,.92)']]); ctx.fillRect(-300, ygb, W + 600, 900);
  ctx.save(); ctx.lineCap = 'round'; for (let i = 0; i < 34; i++) { const y = ygb + 30 + hash(i + 50) * 520, x = (hash(i) * (W + 200) - 100 + t * 14 * (hash(i + 7) - .5)), l = 40 + hash(i + 3) * 150; ctx.strokeStyle = `rgba(190,235,232,${.05 + .08 * hash(i + 11) * (1 - (y - ygb) / 560)})`; ctx.lineWidth = 2 + hash(i + 9) * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke(); } ctx.restore();
  // the sidewalk and its curb, a painted crossing, stall lines
  V2.quad3([-1900, 0, 2330], [1900, 0, 2330], [1900, 0, ZBL], [-1900, 0, ZBL], '#4e666a', 'rgba(6,16,20,.5)', 2);
  S6.box3({ x0: -1900, x1: 1900, y1: 22, z0: 2318, z1: 2334, color: '#6f878b', lw: 1.4 });
  for (let i = -4; i <= 4; i++) V2.quad3([i * 66 - 20, .4, 2190], [i * 66 + 20, .4, 2190], [i * 66 + 20, .4, 2316], [i * 66 - 20, .4, 2316], 'rgba(236,246,246,.82)');
  for (const x of [-1500, -1180, -860, 860, 1180, 1500]) V2.quad3([x - 7, .4, 1500], [x + 7, .4, 1500], [x + 7, .4, 2150], [x - 7, .4, 2150], 'rgba(236,246,246,.55)');
  puddle(-330, 1820, 230, 80, t, 1.3); puddle(420, 2060, 260, 74, t, 2.1); puddle(-90, 2130, 150, 46, t, 3.7); puddle(-760, 1620, 200, 70, t, 4.4);
  // each standing thing is drawn with a faint reflection about its own foot line
  const mirror = (X, Z, fn) => { const by = p2(X, 0, Z)[1]; ctx.save(); ctx.globalAlpha = .22; ctx.translate(0, 2 * by); ctx.scale(1, -1); REG.suppress++; fn(); REG.suppress--; ctx.restore(); fn(); };
  for (const [X, Z] of LAMPS) mirror(X, Z, () => lamp(X, Z, { on: 1 }));
  mirror(-900, 2060, () => car10(-900, 2060, { color: '#2c8f9a', brake: .12 })); mirror(940, 2180, () => car10(940, 2180, { color: '#8a2d46', brake: .12, w: 160 }));
  mirror(CAR[0], CAR[1], () => car10(CAR[0], CAR[1], { color: '#e0883a', brake: o.carBrake ?? .1, w: CARW }));
  if (o.vanX != null) mirror(o.vanX, 2040, () => van(o.vanX, 2040, t, { lights: o.vanLights ?? 1, brake: o.vanBrake ?? .3 }));
}

// ------------------------------------------------------------------ the SHIFTGO phone: lock screen, the notification growing into a job card, then BOOKED (the Episode 9 app, a night later)
const PHW = 600, PHH = 1060, ACC_LY = 800;   // the phone's screen size, and where the ACCEPT button sits in it
// o: t, slide (0..1 the notification drops in), expand (0..1 banner -> job card), press, pulse, done (0..1 booked), stars (0..5)
function uiJob(w, h, o = {}) {
  const t = o.t ?? 0, ex = clamp(o.expand ?? 1), dn = clamp(o.done ?? 0), e = easeIO(ex), stars = o.stars ?? 0;
  ctx.fillStyle = V2.grad(0, 0, w, h, [[0, '#1b1550'], [.6, '#3b1d6e'], [1, '#6a2a86']]); ctx.fillRect(0, 0, w, h);
  V2.glow(w * .75, h * .16, 260, '255,120,200', .25, 'screen', 0);
  text('Friday, October 30', w / 2, 92, { size: 30, fill: 'rgba(255,255,255,.75)', weight: 800 });
  text('11:00', w / 2, 196, { size: 150, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 });
  const x0 = lerp(28, 18, e), top = lerp(330, 40, e), cw = w - 2 * x0, ch = lerp(244, 982, e), R = lerp(38, 46, e);
  ctx.save(); ctx.translate(0, (1 - easeOut(o.slide ?? 1)) * -380);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = 'rgba(255,255,255,.97)'; rr(x0, top, cw, ch, R); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(x0, top, cw, ch, R); ctx.clip(); ctx.translate(x0, top);   // card coordinates from here: (0, 0) is the card's top left, cw wide
  A9.appIcon(70, 62, 70);
  text('SHIFTGO', 120, 52, { size: 30, fill: '#2a1a5a', align: 'left', spacing: 2 }); text('now', cw - 34, 52, { size: 24, fill: '#5f5878', align: 'right', weight: 800 });
  // the notification text, until the card opens
  const nA = 1 - clamp((ex - .06) / .26);
  if (nA > 0) { ctx.save(); ctx.globalAlpha *= nA;
    ['New shift near you:', 'Fruit Bowl Rehab & Nursing', '$118.00/hr, tomorrow 3 PM'].forEach((ln, i) => text(ln, 36, 118 + i * 38, { size: 30, fill: i === 1 ? '#6c4bff' : '#1d1838', align: 'left', weight: 800 }));
    ctx.restore(); }
  // the job card
  const jA = clamp((ex - .35) / .4) * (1 - clamp(dn * 4));
  if (jA > 0) {
    ctx.save(); ctx.globalAlpha *= jA;
    text('NEW SHIFT NEAR YOU', cw / 2, 150, { size: 26, fill: '#6c4bff', spacing: 4, weight: 900 });
    text('FRUIT BOWL', cw / 2, 235, { size: 72, font: 'Bangers', weight: 400, fill: '#2a1a5a', spacing: 3 }); text('REHAB & NURSING', cw / 2, 310, { size: 72, font: 'Bangers', weight: 400, fill: '#2a1a5a', spacing: 3 });
    ctx.fillStyle = '#ece8fb'; rr(cw / 2 - 190, 352, 380, 58, 29); ctx.fill(); text('NURSE (AGENCY)', cw / 2, 382, { size: 30, fill: '#4f3bb0', weight: 900, spacing: 1 });
    text('$118.00', 45, 505, { size: 132, font: 'Bangers', weight: 400, fill: '#6c4bff', align: 'left', spacing: 2 }); text('/HR', 428, 528, { size: 60, font: 'Bangers', weight: 400, fill: '#6c4bff', align: 'left', spacing: 2 });
    text('TOMORROW  3:00 PM', cw / 2, 598, { size: 40, fill: '#1d1838', weight: 900, spacing: 2 });
    text('POSTED 1 MIN AGO', cw / 2, 655, { size: 24, fill: '#8a84a4', weight: 800, spacing: 3 });
    const pk = (t * 1.3) % 1, bp = 1 - (o.press ?? 0) * .08 + (o.pulse ?? 0) * .05;
    ctx.save(); ctx.translate(cw / 2, ACC_LY - top); ctx.strokeStyle = `rgba(18,195,122,${.45 * (1 - pk)})`; ctx.lineWidth = 6; rr(-220 - pk * 36, -52 - pk * 36, 440 + pk * 72, 104 + pk * 72, 52 + pk * 36); ctx.stroke();
    ctx.scale(bp, bp); ctx.fillStyle = V2.grad(-220, 0, 220, 0, [[0, '#12c37a'], [1, '#0a9f66']]); rr(-220, -52, 440, 104, 52); ctx.fill();
    if ((o.press ?? 0) > .5) { ctx.fillStyle = 'rgba(255,255,255,.3)'; rr(-220, -52, 440, 104, 52); ctx.fill(); }
    text('ACCEPT', 0, 4, { size: 66, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 }); ctx.restore();
    text('DECLINE', cw / 2, 872, { size: 34, fill: '#9a94b4', weight: 800, spacing: 2 });
    ctx.restore();
  }
  // booked
  if (dn > 0) {
    const dd = easeOut(dn);
    ctx.save(); ctx.globalAlpha *= dd; ctx.fillStyle = V2.grad(0, 0, 0, ch, [[0, '#14cf84'], [1, '#0b8f5f']]); ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= clamp(dn * 2 - .3);
    const pk = easeBack(clamp(dn * 1.4));
    ctx.save(); ctx.translate(cw / 2, 150); ctx.scale(pk, pk); ctx.fillStyle = '#fff'; ell(0, 0, 76, 76); ctx.fill(); ctx.strokeStyle = '#12c37a'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-34, 4); ctx.lineTo(-8, 30); ctx.lineTo(36, -26); ctx.stroke(); ctx.restore();
    const sc = lerp(1.5, 1, easeOut(clamp(dn * 1.6)));
    ctx.save(); ctx.translate(cw / 2, 290); ctx.scale(sc, sc); text("YOU'RE BOOKED", 0, 0, { size: 82, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 }); ctx.restore();
    text('FRUIT BOWL REHAB & NURSING', cw / 2, 352, { size: 24, fill: 'rgba(255,255,255,.92)', weight: 900, spacing: 2 });
    text('TOMORROW  3:00 PM', cw / 2, 410, { size: 40, fill: '#fff', weight: 900, spacing: 2 });
    // the rating card: Episode 9 left her grey (NOT ELIGIBLE); an agency nurse gets stars
    ctx.save(); ctx.shadowColor = 'rgba(0,40,20,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = '#fff'; rr(28, 480, cw - 56, 360, 34); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(110, 568); ctx.fillStyle = '#e8e4f6'; ell(0, 0, 66, 66); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 66, 0, TAU); ctx.clip();
    REG.suppress++; drawChar(straw({ x: 0, y: 10, s: .4, center: true, noLegs: true, noArms: true, noShadow: true, noReflect: true, expr: stars > 4.5 ? 'happy' : 'dead', who: null, id: 'job-straw', lift: 0, acc: ['steth'] })); REG.suppress--; ctx.restore();
    text('STRAWBERRY', 196, 548, { size: 46, font: 'Bangers', weight: 400, fill: '#2a1a5a', align: 'left', spacing: 2 }); text('Agency RN, per diem', 196, 594, { size: 24, fill: '#7a7490', align: 'left', weight: 800 });
    A9.starRow(cw / 2, 700, 40, stars, { empty: 'rgba(120,110,160,.3)' });
    const ek = seg(stars, 4.2, 5), el = ek > .5, bs = el ? lerp(1.5, 1, easeOut(clamp((ek - .5) * 2))) : 1;
    ctx.save(); ctx.translate(cw / 2, 790); ctx.scale(bs, bs); ctx.fillStyle = el ? '#12c37a' : '#8a86a2'; rr(-150, -22, 300, 44, 22); ctx.fill(); text(el ? 'ELIGIBLE' : 'NOT ELIGIBLE', 0, 2, { size: 28, fill: '#fff', spacing: 3 }); ctx.restore();
    ctx.restore();
  }
  ctx.restore(); ctx.restore();
}
// the ground seen from straight above while she walks: wet asphalt grain, a double yellow line, a white dashed line, a stall end, a puddle with a lamp in it; everything slides with d (pixels walked)
function groundTop(d, t) {
  ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#2a5a63'], [1, '#12303a']]); ctx.fillRect(-100, -100, W + 200, H + 200);
  const M = H + 600, wy = y0 => (((y0 + d) % M) + M) % M - 300;
  ctx.fillStyle = 'rgba(190,230,230,.1)'; for (let i = 0; i < 300; i++) { ell(hash(i * 3 + 1) * W, wy(hash(i * 7 + 2) * M), 2 + hash(i) * 4, 1.5 + hash(i + 5) * 3); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,214,90,.85)'; ctx.fillRect(86, -100, 13, H + 200); ctx.fillRect(114, -100, 13, H + 200);
  ctx.fillStyle = 'rgba(240,248,248,.8)'; for (let i = 0; i < 6; i++) ctx.fillRect(940, wy(i * 420), 15, 230);
  ctx.fillStyle = 'rgba(240,248,248,.7)'; ctx.fillRect(170, wy(900), 640, 15);
  const py = wy(1250);
  ctx.save(); ctx.beginPath(); ctx.ellipse(330, py, 250, 150, -.2, 0, TAU); ctx.fillStyle = V2.grad(0, py - 150, 0, py + 150, [[0, 'rgba(150,220,215,.55)'], [1, 'rgba(20,56,64,.7)']]); ctx.fill(); ctx.clip();
  V2.glow(360, py - 20, 260, '255,190,110', .55, 'screen', 0); ctx.restore();
  V2.glow(790, wy(500), 420, '255,168,70', .3, 'screen', 0);
}
// the phone as the whole picture, the ground sliding by beneath it
function phoneShot10(bg, fn, o = {}) {
  V2.dof(o.blur ?? 12, bg);
  ctx.save(); ctx.fillStyle = 'rgba(2,10,14,.38)'; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  A9.phoneFrame(540 + (o.dx ?? 0), 815 + (o.dy ?? 0), PHW, PHH, fn, { rot: o.rot ?? 0, scale: o.scale ?? 1 });
}
// the Moon's own sky for the close-ups: teal night, stars, a drifting cloud, the roofline of Fruit Bowl at the foot of the frame
function bgMoon(lt) {
  ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#021419'], [.55, '#0a3641'], [1, '#1d6a70']]); ctx.fillRect(-100, -100, W + 200, H + 200);
  A7.stars(lt, 1300, { n: 130, seed: 9, a: 1 });
  A7.clouds(lt, 1150, 1500, { n: 3, tint: '120,205,205', belly: '14,66,76', a: .5, speed: 8, seed: 3, scale: 1.5 });
  ctx.fillStyle = '#0f161d'; ctx.fillRect(-100, 1400, W + 200, 600); ctx.fillStyle = '#1d1726'; ctx.fillRect(-100, 1392, W + 200, 20);
  for (let i = 0; i < 9; i++) if (hash(i + 12) > .35) { ctx.fillStyle = 'rgba(255,214,140,.85)'; ctx.fillRect(60 + i * 118, 1440 + (i % 2) * 70, 62, 44); }
  V2.glow(150, 1360, 260, '255,168,70', .4, 'screen', .3);
}

// ------------------------------------------------------------------ the scene
// Strawberry: out of the glass doors and across the lot, slowing to a stop as she reads the phone (3.0); then, after the Moon's last line, to her car
const LP = route([[0, -45, 2420], [2.0, -28, 1830], [3.0, -25, 1700, 'out'], [9.88, -25, 1700], [11.3, 335, 1790, 'io']]);
const LT = {};
LT.ends = () => [['open', B('ping').s + .2], ['ping', B('s1').s + .28], ['cuS1', B('mo1').s - .04], ['moonC1', B('s2').s - .03], ['cuS2', B('tap').s - .03], ['tap', B('mo2').s - .03], ['moonC2', B('s3').s - .04], ['fin', 1e9]];
LT.shot = lt => LT.ends().find(([, e]) => lt < e)[0];
LT.cz = lt => { const t0 = B('s3').s - .04; return lt >= t0 ? lerp(LZ0, LZ0 - 140, ez(lt, t0, CUR.dur)) : LZ0; };
LT.vanX = lt => lerp(-1900, -430, easeOut(seg(lt, 0, 1.45)));
LT.moon = lt => ({ x: 790, y: 300, s: .95, expr: lt >= B('s3').s ? 'smug' : 'neutral', look: [-.4, .5] });

LT.cast = lt => {
  const b = id => B(id), sw = Math.sin(window.H6.pathDist(LP, lt) / 84 * PI), phone = lt >= 1.4 && lt < b('mo2').e;
  const expr = lt >= b('s3').s - .1 ? 'chill' : lt >= b('s2').s - .25 ? 'dead' : lt >= b('s1').s ? 'sour' : 'dead';
  const lookUp = lt >= b('mo1').e - .2 && lt < b('s2').e - .3;   // she looks up at the Moon to answer it
  const look = lt >= b('mo2').e ? [.4, -.55] : lookUp ? [.25, -.55] : phone ? [.3, .55] : [.1, .15];
  const S = person(straw, LP, lt, { id: 'straw', stride: 46, expr, lid: expr === 'sour' ? .3 : .5, look, acc: ['steth', 'badge7', 'bandage7'], arms: { l: 'hold', r: 'rest' } });
  S.hold = { l: 'envelope10' }; S.grip = { l: [-134, 62] };
  if (phone) { S.hold.r = 'phone10'; S.arms.r = 'hold'; S.grip.r = [92, 56]; } else S.arms.r = [.28 - .35 * sw, .25];
  return { S };
};

LT.cam = function (lt) {
  V2.setCam(Object.assign({ cz: LT.cz(lt) }, LF)); CAM.shake = 0;
  const sh = LT.shot(lt), c = LT.cast(lt), b = id => B(id);
  if (sh === 'open') zoomTo(540, 980, lerp(1.0, 1.05, seg(lt, 0, 1.4)));
  else if (sh === 'cuS1') camFace(c.S, lerp(2.1, 2.25, seg(lt, 2.98, 3.8)), 170);
  else if (sh === 'cuS2') camFace(c.S, lerp(2.0, 2.15, seg(lt, b('s2').s - .03, b('tap').s)), 170);
  else if (sh === 'fin') { const k = ez(lt, b('s3').s - .04, CUR.dur); zoomTo(lerp(600, 560, k), lerp(900, 960, k), lerp(1.08, 1.0, k)); }
};

LT.draw = function (lt) {
  const b = id => B(id), sh = LT.shot(lt), c = LT.cast(lt), S = c.S;
  V2.setLight({ key: [.35, -.7], keyColor: '#ffc78a', keyA: .28, rim: '#7fe6dc', rimA: .6, shadow: '#06161e', shadowA: .5, amb: '#5fb8b0', ambA: .1, bounce: '#ffa860', bounceA: .2 });
  V2.opts.reflect = true;
  if (sh === 'ping') {   // the phone from above while she walks: the ground slides under it
    const x = lt - b('ping').s - .2, pd = window.H6.pathDist(LP, lt), buzz = Math.exp(-Math.max(0, x) * 3.5) * Math.sin(lt * 90), sway = Math.sin(pd / 84 * PI * 2) * 5 * (lt < 3.0 ? 1 : 0);
    phoneShot10(() => groundTop(pd * 1.5, lt), (w, h) => uiJob(w, h, { t: lt, slide: seg(x, .04, .32), expand: ez(x, .55, 1.1), pulse: .5 + .5 * Math.sin(lt * 8) }), { dx: buzz * 14, dy: sway, rot: buzz * .02 + Math.sin(lt * 3) * .004 });
    return;
  }
  if (sh === 'tap') {   // her thumb lands on ACCEPT (click), the card turns BOOKED, glints (sparkle), the stars pop
    const tt = lt - b('tap').s, press = seg(tt, .1, .16) * (1 - seg(tt, .2, .32)), done = easeOut(seg(tt, .1, .17)), stars = clamp((tt - .6) / .4) * 5;
    phoneShot10(() => groundTop(window.H6.pathDist(LP, 3.0) * 1.5, lt), (w, h) => uiJob(w, h, { t: lt, expand: 1, press, pulse: tt < .1 ? .5 + .5 * Math.sin(lt * 8) : 0, done, stars }), { dy: Math.sin(lt * 2.1) * 3 });
    const by = 815 - PHH / 2 + ACC_LY, hover = 90 * (1 - seg(tt, -.03, .1)), away = seg(tt, .3, .6);
    glove(612 + hover * .35 + away * 420, by - 4 + hover * .7 + (tt > .1 && tt < .2 ? 6 : 0) + away * 260, -2.45, 5.0);
    if (tt > .1) { V2.ring(540, by, (tt - .1) / .6, { color: '200,255,230', r0: 40, r1: 420, lw: 12, alpha: .8 }); V2.glow(540, by, 420, '120,255,200', .35 * (1 - seg(tt, .1, .5)), 'screen', .4); }
    if (tt > .45) {
      confetti(tt, .45, 70);
      const q = clamp((tt - .45) / .9);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 1, r = 170 + 230 * easeOut(clamp((tt - .45) / .6)); glint(540 + Math.cos(a) * r, 815 + Math.sin(a) * r * .86, 38 * (1 - q) + 6, 1 - q); }
    }
    for (let i = 0; i < 5; i++) { const q = (tt - (.6 + i * .08)) / .4; if (q > 0 && q < 1) glint(540 + (i - 2) * 94, 815 - PHH / 2 + 740, 44 * (1 - q) + 10, 1 - q); }
    return;
  }
  if (sh === 'moonC1' || sh === 'moonC2') {
    const m1 = sh === 'moonC1', push = m1 ? lerp(2.15, 2.35, seg(lt, b('mo1').s, b('mo1').e)) : lerp(2.2, 2.3, seg(lt, b('mo2').s - .05, b('mo2').e));
    bgMoon(lt);
    A7.moon(540, 790, push, { t: lt, haloA: 1, char: { expr: m1 ? 'smug' : lt > b('mo2').e - .1 ? 'happy' : 'chill', look: m1 ? [-.65, .5 + .1 * Math.sin(lt * 4)] : [0, .1], lid: m1 ? .32 : .2 } });
    return;
  }
  // the lot in the world
  const close = sh === 'cuS1' || sh === 'cuS2';
  V2.dof(close ? 9 : 0, () => lotSet({ t: lt + 5, vanX: LT.vanX(lt), vanBrake: lt < 1.5 ? .9 : .3, carBrake: lt >= 10.85 ? .9 : .1, moon: close ? null : LT.moon(lt) }));
  if (!close && lt > 1.3) { const q = V2.p2(-750, 70, 2040); V2.smoke(q[0], q[1], lt, 1.3, { n: 8, rate: 3, life: 2.2, rise: 60, spread: 26, size: 24, alpha: .2, color: '170,210,210', seed: 3 }); }
  if (close) { const [fx, fy] = faceC(S); V2.addLight({ x: fx + 80 * S.s, y: fy + 110 * S.s, r: 620 * S.s, color: '185,150,255', a: .65 }); }
  V2.dust(60, 600, 1020, 1400, lt, { n: 18, alpha: .18, color: '190,230,230' });
  drawChar(S);
};
LT.fx = lt => {
  const sh = LT.shot(lt), phone = sh === 'ping' || sh === 'tap', moon = sh === 'moonC1' || sh === 'moonC2', tp = B('tap').s;
  return { bloom: phone ? .4 + (sh === 'tap' ? .4 * seg(lt, tp + .4, tp + .6) * (1 - seg(lt, tp + .6, tp + 1.1)) : 0) : moon ? .75 : .7, vignette: .5, grain: .05, contrast: .16, sat: .1,
    tint: [['#18b0a8', .16, 'soft-light'], ['#ff9a40', .05, 'soft-light']], fade: Math.max(lt < .2 ? 1 - lt / .2 : 0, seg(lt, CUR.dur - .32, CUR.dur - .02)), fadeColor: '0,8,10' };
};
LT.blur = lt => { const sh = LT.shot(lt); return sh === 'ping' && lt < 2.2 ? 2 : sh === 'open' ? 2 : 1; };
LT.over = function (lt) {
  const b = id => B(id);
  sfxWord(lt, .25, 'chirp . . . chirp', 330, 1560, { size: 56, hold: .6, fill: '#c9fff0', rot: -.05 });
  sfxWord(lt, b('ping').s + .2, 'DING!', 800, 190, { size: 120, hold: .5, fill: '#ff8ad0', rot: .06 });
  sfxWord(lt, b('tap').s + .1, 'CLICK', 820, 960, { size: 110, hold: .45, fill: '#ffe135', rot: .07 });
};
window.__EP10_SCENES.lot = LT;
})();
