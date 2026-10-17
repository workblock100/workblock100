'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice. Scene module: office (2:58 PM, THE ADMINISTRATOR'S OFFICE) and exit (10:30 PM, THE EXIT INTERVIEW).
 *
 * Both play in the Administrator's office (ep10_set.js, window.S10): he sits behind his desk at the right in his tall tufted chair, Strawberry stands in front of the desk at the left beside the low guest chair, the FY BUDGET
 * chart hangs between them. Every position is a world coordinate (X right, Z forward) through V2.at(X, Z); the desk, the chairs and the wall come from the set.
 *
 * office shot list (scene-local seconds)
 *   0.00  wide, a slow dolly: the Administrator eats a slice (the cheese stretches), THREE KNOCKS ring on the pocket door (0.32, 0.56, 0.80), the door slides open (1.15): Strawberry, backlit, a letter in her hand
 *   1.60  walk: medium, she comes through the door saying "I'm giving you"
 *   1.95  letter: top-down on the desk, the typed header and a handwriting reveal in sync with her words (stroke by stroke through "two weeks' notice.")
 *   3.55  a1: close on the Administrator, guilty, one eye on the pen cup (the pen gleams on "pen?")    4.55  s2: Strawberry's flat stare, the chart behind her, the $118/HR slap on "eighteen"
 *   7.40  a2: dolly zoom, the blinds snap shut on "agency", red pulse, thunder flash (under a second)    8.55  s3: low hero angle, sun stripes, a flare
 *   9.95  think: a thought bubble inflates with a pizza and gears (boing 10.29)    11.27  a3: the bubble pops, the first box slams onto the desk (steam)    12.18  s4: tight on her, "No."
 *   12.80 a4: "Two pizzas.", the second box lands on the first (the receipt appears)    13.99  s5: "I want a raise", then a whip pan to the chart    15.17  a5: the empty wallet, the chart behind him
 *   16.55 s6: she points; the tower with its receipt, her glove in frame    18.30  a6: he gestures at the chart, the pizza pulses    19.95  s7: eyes close, one long exhale
 *   21.20 stamp: top-down, the giant stamp lands on the letter at 21.51 (RECEIVED, splatter, a paper flutter)    22.40  end: wide, she walks out (WAH WAH 22.51), he takes a bite    22.95  the still life: slice and cheese string, stamp mark, pen cup
 *
 * exit shot list: see the EXIT scene object further down. */
(() => {
if (!window.TIMELINE_EP10) return;
const { person, zoomTo, faceZoom, drawBg, faceC, localOf, pathDist } = window.H6;
const A7 = window.A7, A9 = window.A9, S10 = window.S10, { kz } = window.S6;
const straw = A7.straw;
const { p2 } = V2;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 ones, plus a few of our own)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z$0-9]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? easeIn(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const nbr = o => V2.dof(6, () => drawBg(o));
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const eo = (lt, a, b) => easeOut(seg(lt, a, b));
const lerpA = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const toScr = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
const near = (lt, list, d) => list.some(t => Math.abs(lt - t) < d);
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
// aim a hand at a point in scene coordinates: blend from a resting grip (local coordinates) toward it
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}
// a big white glove (the Episode 6 hand, scaled) whose fingertip lands on (tx, ty); the arm trails off the far side (a copy of the Episode 9 one)
function glove(tx, ty, ang, sc, o = {}) {
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-44, 5);
  ctx.fillStyle = LIMB; ctx.beginPath(); ctx.roundRect(-300, -9, 302, 18, 8); ctx.fill();
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand(o.kind ?? 'point', 1, {});
  ctx.restore();
}
const goldLine = (x, y, w, h, r, lw = 5) => { ctx.strokeStyle = V2.grad(x, y, x + w, y + h, [[0, '#fff0a8'], [.35, '#c99a2e'], [.7, '#8a6414'], [1, '#e8c458']]); ctx.lineWidth = lw; rr(x, y, w, h, r); ctx.stroke(); };
const star = (x, y, L, a, col = '255,255,255') => {   // a four point sparkle
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = V2.radial(0, 0, 0, L * 1.1, [[0, `rgba(${col},${.8 * a})`], [1, `rgba(${col},0)`]]); ctx.fillRect(-L * 1.2, -L * 1.2, L * 2.4, L * 2.4);
  ctx.fillStyle = `rgba(${col},${.95 * a})`; ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(L * .1, -L * .1); ctx.lineTo(L, 0); ctx.lineTo(L * .1, L * .1); ctx.lineTo(0, L); ctx.lineTo(-L * .1, L * .1); ctx.lineTo(-L, 0); ctx.lineTo(-L * .1, -L * .1); ctx.closePath(); ctx.fill();
  ctx.restore();
};

// ------------------------------------------------------------------ props
Object.assign(PROP_BOX, { slice10: Object.assign([-125, -70, 22, 50], { nearFace: true }), letter10: [-46, -96, 46, 26], wallet10: Object.assign([-82, -98, 86, 38], { nearFace: true }) });
// a pizza slice held by the crust. The tip always points at the mouth (the mouth is found from the body, so it follows however the hand moves); a strand of cheese
// joins the tip to the lip and thins as the hand pulls away
EXT.prop.slice10 = (side, o, t) => {
  const key = side < 0 ? 'l' : 'r', g = (o.grip && o.grip[key]) || [100, 30], k = KINDS[o.kind], mouth = [-g[0], k.mouthY + 12 - g[1]];
  const aim = Math.atan2(mouth[1], mouth[0]) + (o.sliceTilt || 0), L = 112;
  ctx.save(); ctx.rotate(aim);
  ctx.fillStyle = '#b97a2c'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -36); ctx.quadraticCurveTo(-24, 0, -10, 36); ctx.quadraticCurveTo(4, 42, 16, 34); ctx.lineTo(L, 4); ctx.quadraticCurveTo(L + 6, 0, L, -4); ctx.lineTo(16, -34); ctx.quadraticCurveTo(4, -42, -10, -36); ctx.closePath(); ctx.fill(); ctx.stroke();   // crust and body
  ctx.fillStyle = V2.grad(10, 0, L, 0, [[0, '#ffd85a'], [.7, '#f6bf3f'], [1, '#e9a92e']]); ctx.beginPath(); ctx.moveTo(10, -29); ctx.lineTo(L - 6, -2); ctx.lineTo(L - 6, 2); ctx.lineTo(10, 29); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,250,210,.6)'; ell(44, -8, 14, 4, .2); ctx.fill(); ell(72, 5, 9, 3, .1); ctx.fill();
  ctx.fillStyle = '#b3261e'; for (const [x, y, r] of [[34, -9, 9], [48, 11, 8.5], [66, -4, 7.5], [84, 3, 6]]) { ell(x, y, r, r); ctx.fill(); ctx.strokeStyle = 'rgba(70,8,4,.65)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.22)'; ell(x - r * .3, y - r * .3, r * .35, r * .3); ctx.fill(); ctx.fillStyle = '#b3261e'; }
  ctx.restore();
  const tip = [Math.cos(aim) * L, Math.sin(aim) * L], d = Math.hypot(mouth[0] - tip[0], mouth[1] - tip[1]);
  if ((o.cheese ?? 1) > 0 && d > 7) {   // the strand: a sagging curve from the tip to the lip, thinner the longer it is, with a droplet at the low point
    const th = clamp(40 / d, .32, 1) * 8.2 + 2.8, sag = Math.min(80, d * .3 + 12) * (o.cheeseSag ?? 1), wob = Math.sin(t * 5.3) * 3;
    const mx = (tip[0] + mouth[0]) / 2 + wob, my = (tip[1] + mouth[1]) / 2 + sag;
    ctx.save(); ctx.globalAlpha *= clamp(o.cheese ?? 1); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(70,40,10,.6)'; ctx.lineWidth = th + 2.6; ctx.beginPath(); ctx.moveTo(...tip); ctx.quadraticCurveTo(mx, my, ...mouth); ctx.stroke();
    ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = th; ctx.beginPath(); ctx.moveTo(...tip); ctx.quadraticCurveTo(mx, my, ...mouth); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = Math.max(1, th * .3); ctx.beginPath(); ctx.moveTo(tip[0], tip[1] - 1); ctx.quadraticCurveTo(mx, my - 2, mouth[0], mouth[1] - 2); ctx.stroke();
    const bx = (tip[0] + 2 * mx + mouth[0]) / 4, by = (tip[1] + 2 * my + mouth[1]) / 4;   // the curve's midpoint
    ctx.fillStyle = '#ffd94a'; ctx.strokeStyle = 'rgba(70,40,10,.6)'; ctx.lineWidth = 2; ell(bx, by + th * .7, th * .95, th * 1.25); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
};
// the resignation, held up at the chest: a typed sheet with a few lines of blue ink
EXT.prop.letter10 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.1 + .03 * Math.sin(t * 2.1));
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-42, -92, 84, 112, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#20202c'; ctx.fillRect(-32, -80, 64, 5); ctx.fillStyle = '#9aa0b4'; ctx.fillRect(-32, -70, 40, 2.4);
  ctx.fillStyle = 'rgba(30,63,168,.75)'; for (let i = 0; i < 5; i++) ctx.fillRect(-32, -56 + i * 11, 62 - (i % 3) * 14, 3.4);
  ctx.fillStyle = 'rgba(30,63,168,.85)'; ctx.beginPath(); ctx.moveTo(-30, 6); ctx.bezierCurveTo(-20, -4, -10, 10, 0, 2); ctx.bezierCurveTo(8, -3, 14, 8, 26, 3); ctx.lineTo(26, 5); ctx.bezierCurveTo(12, 11, 8, 0, 0, 5); ctx.bezierCurveTo(-10, 13, -20, -1, -30, 8); ctx.closePath(); ctx.fill();
  ctx.restore();
};
// a bi-fold wallet held open and turned out: nothing in it but a cobweb and a pizza loyalty card with nine punches. Drawn large (the beat is a close-up)
EXT.prop.wallet10 = (side, o, t) => {
  const op = clamp(o.walletOpen ?? 1);
  ctx.save(); ctx.rotate(-.1); ctx.scale(1.5, 1.5);
  ctx.fillStyle = '#6a3e22'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
  rr(-50, -62, 52, 84, 6); ctx.fill(); ctx.stroke();   // the left leaf, in the hand
  ctx.fillStyle = '#2a1810'; rr(-45, -56, 42, 20, 3); ctx.fill();   // the empty bill pocket
  ctx.strokeStyle = 'rgba(210,218,236,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-44, -55); ctx.lineTo(-30, -44); ctx.moveTo(-44, -55); ctx.lineTo(-36, -38); ctx.moveTo(-44, -55); ctx.lineTo(-18, -52); ctx.moveTo(-30, -44); ctx.lineTo(-30, -52); ctx.stroke();   // a cobweb
  ctx.save(); ctx.translate(2, -62); ctx.scale(Math.max(.04, op), 1);   // the right leaf swings open
  ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(0, 0, 52, 84, 6); ctx.fill(); ctx.stroke();
  if (op > .55) {
    ctx.fillStyle = '#2a1810'; rr(5, 6, 42, 26, 3); ctx.fill();
    ctx.fillStyle = '#f6f2e6'; rr(6, 38, 40, 34, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#d6202e'; ctx.fillRect(6, 38, 40, 8);
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i < 9 ? '#3a2a1a' : 'rgba(0,0,0,.16)'; ell(12 + (i % 5) * 7, 56 + Math.floor(i / 5) * 9, 2.5, 2.5); ctx.fill(); }
  }
  ctx.restore();
  ctx.restore();
};

// ------------------------------------------------------------------ top-down inserts: the leather desk, the letter, the stamp
function deskTop() {
  ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#6a4630'], [1, '#3a2418']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.strokeStyle = 'rgba(20,10,6,.28)'; ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = hash(i + 1) * W; ctx.beginPath(); ctx.moveTo(x, -20); ctx.bezierCurveTo(x + (hash(i + 5) - .5) * 60, 600, x + (hash(i + 9) - .5) * 60, 1300, x + (hash(i + 3) - .5) * 40, H + 20); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, 140, 0, 1380, [[0, '#2c5a46'], [1, '#1c3c2e']]); rr(40, 130, 1000, 1240, 26); ctx.fill();
  goldLine(58, 148, 964, 1204, 18, 5); goldLine(70, 160, 940, 1180, 12, 1.6);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(40, 130, 1000, 14);
}
// handwriting, glyph by glyph up to the fraction p of the line (each glyph has its own small tilt and wobble); returns where the ink front is
function hand(str, x, y, size, p, o = {}) {
  ctx.save();
  const font = s => `italic ${o.weight || 700} ${s}px Nunito`;
  ctx.font = font(size); const full = ctx.measureText(str).width;
  if (o.maxW && full > o.maxW) { size *= o.maxW / full; ctx.font = font(size); }
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = o.color || '#1d3fa8';
  const ws = [...str].map(c => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0), shown = tot * p;
  let cx = x, pen = [x, y - size * .3];
  for (let i = 0; i < str.length; i++) {
    if (cx - x >= shown) break;
    const w = ws[i], wob = Math.sin(i * 1.7 + (o.seed || 0)) * size * .035, rot = Math.sin(i * 2.3 + (o.seed || 0)) * .05, part = clamp((shown - (cx - x)) / w);
    ctx.save(); ctx.translate(cx, y + wob); ctx.rotate(rot);
    if (part < 1) { ctx.beginPath(); ctx.rect(-3, -size * 1.2, w * part + 3, size * 1.7); ctx.clip(); }
    ctx.fillText(str[i], 0, 0); ctx.restore();
    pen = [cx + w * part, y + wob - size * .3]; cx += w;
  }
  ctx.restore();
  return pen;
}
// the resignation letter. prog: how much of each line is written (0 to 1) [Dear, body, effective, reason, sincerely, signature]; o.stamp: strength of the RECEIVED imprint; returns the ink front
const LET = { x: 190, y: 250, w: 700, h: 900 };
const LETTER_LINES = [['Dear Administrator,', 232, 46], ["I am giving my two weeks' notice.", 318, 40], ['Effective in 14 days.', 404, 44], ['Reason: see $118.', 490, 46], ['Sincerely,', 742, 44]];
function paper(prog, o = {}) {
  const { x, y, w, h } = LET;
  ctx.save();
  if (!o.flat) { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18; }
  ctx.fillStyle = '#fffef8'; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = V2.grad(x, y, x, y + h, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(180,170,140,.2)']]); ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + h * .33); ctx.lineTo(x + w, y + h * .33); ctx.moveTo(x, y + h * .66); ctx.lineTo(x + w, y + h * .66); ctx.stroke();
  text('NOTICE OF RESIGNATION', x + w / 2, y + 74, { size: 48, fill: '#20202c', weight: 900, spacing: 3, maxW: w - 60 });
  text('FRUIT BOWL REHAB & NURSING  /  FORM 14-B', x + w / 2, y + 120, { size: 19, fill: '#8a90a4', weight: 800, spacing: 2, maxW: w - 50 });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x + 40, y + 148); ctx.lineTo(x + w - 40, y + 148); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,110,190,.2)'; ctx.lineWidth = 1.6; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + 36, y + 244 + i * 86); ctx.lineTo(x + w - 36, y + 244 + i * 86); ctx.stroke(); }
  let pen = null;
  LETTER_LINES.forEach(([s, dy, sz], i) => { const p = prog[i] ?? 0; if (p > 0) { const q = hand(s, x + 48, y + dy, sz, p, { seed: i * 3, maxW: w - 100 }); if (p < 1) pen = q; } });
  const sg = prog[5] ?? 0;
  if (sg > 0) {   // the signature: her name in a quick hand, then one long flourish under it
    const q = hand('Strawberry', x + 70, y + 826, 62, Math.min(1, sg * 1.5), { seed: 11, weight: 800 });
    if (sg < .67) pen = q;
    const f = clamp((sg - .55) / .45);
    if (f > 0) { ctx.save(); ctx.strokeStyle = '#1d3fa8'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.setLineDash([900, 900]); ctx.lineDashOffset = 900 * (1 - f); ctx.beginPath(); ctx.moveTo(x + 60, y + 858); ctx.bezierCurveTo(x + 200, y + 880, x + 330, y + 838, x + 470, y + 864); ctx.stroke(); ctx.restore(); if (f < 1) pen = [x + lerp(60, 470, f), y + 862]; }
  }
  if ((o.stamp ?? 0) > 0) stampMark(x + w / 2 + 10, y + 598, o.stamp, o);
  ctx.restore();
  return pen;
}
// the RECEIVED imprint: a double ruled box, uneven ink, a small line of type under the word
function stampMark(cx, cy, a, o = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.16); ctx.globalAlpha *= .94 * clamp(a); ctx.globalCompositeOperation = 'multiply';
  const w = o.mw ?? 560, h = o.mh ?? 190;
  ctx.strokeStyle = '#d6202e'; ctx.lineWidth = 12; rr(-w / 2, -h / 2, w, h, 14); ctx.stroke(); ctx.lineWidth = 4; rr(-w / 2 + 20, -h / 2 + 20, w - 40, h - 40, 8); ctx.stroke();
  text('RECEIVED', 0, -8, { size: 128, font: 'Bangers', weight: 400, fill: '#d6202e', spacing: 5, maxW: w - 64 });
  text('FRUIT BOWL REHAB  *  2:58 PM', 0, h / 2 - 38, { size: 21, fill: '#d6202e', weight: 900, spacing: 3, maxW: w - 80 });
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,254,248,.6)';   // ink never lands evenly: little pale gaps
  for (let i = 0; i < 80; i++) { ell((hash(i + 3) - .5) * (w - 20), (hash(i + 77) - .5) * (h - 20), 1.2 + hash(i + 9) * 2.6, 1.1 + hash(i + 11) * 1.8); ctx.fill(); }
  ctx.restore();
}
// the writing reveal: lines are written in sync with Strawberry's words. Anchors map time to progress along the line
const reveal = (lt, pts) => { if (lt <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (lt < pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (lt - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])); return pts[pts.length - 1][1]; };
function insLetter(lt) {
  const t0 = 1.95, slide = eo(lt, t0, t0 + .24), py = lerp(190, 0, slide);
  deskTop();
  const w = id => wordT('s1', id, 0), tG = w('giving') || 1.75, tM = w('my') || 2.23, tTwo = w('two') || 2.38, tWk = w('weeks') || 2.56, tN = w('notice') || 2.82, tE = tN + .45;
  const prog = [1, reveal(lt, [[1.6, 0], [tG, .15], [tM, .36], [tTwo, .45], [tWk, .58], [tN, .79], [tE - .12, 1]]), seg(lt, 3.24, 3.36), seg(lt, 3.32, 3.44), seg(lt, 3.4, 3.47), seg(lt, 3.44, 3.55)];
  ctx.save(); ctx.translate(540, 700 + py); ctx.rotate(lerp(.05, -.01, slide)); ctx.translate(-540, -700);
  const pen = paper(prog);
  if (pen && lt < 3.55) star(pen[0], pen[1], 22 + 6 * Math.sin(lt * 40), .9, '170,200,255');   // the ink front glints
  ctx.restore();
  // the glove that lays the letter down: it pushes the sheet in, then slips away to the lower right
  const out = sk(lt, t0 + .26, t0 + .6), gx = 700 + 380 * out, gy = 1230 + py - 120 + 260 * out;
  if (out < 1) glove(gx, gy, -2.3, 4.4, { kind: 'flat' });
}
// the stamp: a big wooden knob comes down out of the camera onto the letter; impact is the scene-local time it lands
function insStamp(lt, impact) {
  const k = lt - impact, down = easeIn(seg(lt, impact - .3, impact)), lift = easeOut(seg(lt, impact + .24, impact + .66));
  deskTop();
  const flut = k >= 0 ? Math.exp(-k * 9) * Math.sin(k * 44) : 0, jump = k >= 0 ? 16 * Math.exp(-k * 14) : 0;
  ctx.save(); ctx.translate(540, 700); ctx.rotate(-.012 + flut * .012); ctx.translate(-540, -700 - jump);
  paper([1, 1, 1, 1, 1, 1], { stamp: k >= 0 ? clamp(k * 14) : 0 });
  ctx.restore();
  // ink splatter: dots thrown out from the box at the moment of impact
  if (k >= 0) { const u = easeOut(seg(k, 0, .28)); ctx.save(); ctx.fillStyle = '#d6202e'; for (let i = 0; i < 38; i++) { const an = hash(i + 4) * TAU, d = (230 + hash(i + 19) * 330) * u, r = (3 + hash(i + 8) * 10) * (.5 + .5 * u); ctx.globalAlpha = .5 + .5 * hash(i + 2); ell(540 + Math.cos(an) * d * 1.15, 848 + Math.sin(an) * d * .8 - jump, r, r * (.7 + .3 * hash(i))); ctx.fill(); } ctx.restore(); }
  // the stamp itself, from above: it grows as it nears the camera
  const sc = down < 1 ? lerp(2.5, 1, down) : lerp(1, 2.2, lift);
  if (lift < 1) {
    ctx.save(); ctx.translate(540 + 10, 848 - jump * .5); ctx.rotate(-.16 + (1 - down) * .05); ctx.scale(sc, sc); ctx.globalAlpha *= 1 - seg(lift, .55, 1);
    ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.filter = 'blur(' + (1 + (1 - down) * 14) + 'px)'; rr(-282, -82 + 30 * (1 - down) + 10, 584, 184, 14); ctx.fill(); ctx.filter = 'none';
    ctx.fillStyle = '#2a1a12'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-286, -96, 572, 192, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = V2.grad(0, -96, 0, 96, [[0, '#4a3022'], [1, '#2a1a12']]); rr(-270, -82, 540, 164, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,225,180,.1)'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-262, i * 21); ctx.bezierCurveTo(-100, i * 21 + 7, 100, i * 21 - 7, 262, i * 21); ctx.stroke(); }
    ctx.fillStyle = V2.radial(-40, -50, 20, 190, [[0, '#9a6a44'], [.55, '#6a4630'], [1, '#34200f']]); ell(0, 0, 150, 150); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,190,.25)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 118, 3.6, 5.2); ctx.stroke();
    ctx.fillStyle = V2.grad(-60, -60, 60, 60, [[0, '#f4d878'], [1, '#8a6414']]); ell(0, 0, 54, 54); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-18, -22, 18, 8, -.6); ctx.fill();
    ctx.restore();
  }
}
// the aftermath, from above: the stamped letter, the pen cup with its one pen, and the slice with a bite out of it and a string of cheese still stretching up and away to its owner
function insStill(lt, t0) {
  const k = lt - t0, push = 1 + .045 * seg(lt, t0, t0 + .9);
  deskTop();
  ctx.save(); ctx.translate(540, 760); ctx.scale(push, push); ctx.translate(-540, -760);
  ctx.save(); ctx.translate(430, 610); ctx.rotate(-.09); ctx.scale(.7, .7); ctx.translate(-540, -700); paper([1, 1, 1, 1, 1, 1], { stamp: 1 }); ctx.restore();
  // the pen cup, seen from above: a dark ring, the black mouth, one pen leaning out of it
  const pa = .8, PL = 215;
  ctx.save(); ctx.translate(215, 1130);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(14, 18, 84, 78); ctx.fill();
  ctx.fillStyle = V2.radial(-14, -16, 8, 80, [[0, '#4a4258'], [1, '#171320']]); ell(0, 0, 76, 76); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = '#d4a834'; ctx.lineWidth = 6; ell(0, 0, 68, 68); ctx.stroke();
  ctx.fillStyle = '#0a0810'; ell(0, 0, 56, 56); ctx.fill();
  ctx.save(); ctx.rotate(pa); ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-10, -PL, 20, PL + 20, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#eef1f7'; rr(-10, -PL, 20, 56, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8ced8'; rr(8, -PL + 14, 6, 70, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.restore();
  star(215 + Math.sin(pa) * PL * .96, 1130 - Math.cos(pa) * PL * .96, 40 * (.8 + .2 * Math.sin(k * 7)), .75 + .25 * Math.sin(k * 7), '255,248,214');   // the pen's end gleams
  // the plate, the slice and the string
  ctx.save(); ctx.translate(815, 1075);
  ctx.fillStyle = 'rgba(0,0,0,.34)'; ell(10, 16, 188, 176); ctx.fill();
  ctx.fillStyle = '#fbfbf6'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ell(0, 0, 184, 172); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,170,190,.55)'; ctx.lineWidth = 3; ell(0, 0, 150, 140); ctx.stroke();
  ctx.save(); ctx.rotate(-1.85);   // the slice: crust at the bottom, tip pointing up, bitten
  ctx.fillStyle = '#b97a2c'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-30, -92); ctx.quadraticCurveTo(-58, 0, -30, 92); ctx.quadraticCurveTo(0, 104, 34, 90); ctx.lineTo(230, 10); ctx.lineTo(230, -10); ctx.lineTo(34, -90); ctx.quadraticCurveTo(0, -104, -30, -92); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(10, 0, 230, 0, [[0, '#ffd85a'], [1, '#e9a92e']]); ctx.beginPath(); ctx.moveTo(6, -76); ctx.lineTo(214, -6); ctx.lineTo(214, 6); ctx.lineTo(6, 76); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b3261e'; for (const [x, y, r] of [[60, -30, 21], [100, 34, 19], [150, -10, 17], [48, 36, 15]]) { ell(x, y, r, r); ctx.fill(); ctx.strokeStyle = 'rgba(70,8,4,.65)'; ctx.lineWidth = 2.4; ctx.stroke(); }
  ctx.fillStyle = '#fbfbf6'; ctx.strokeStyle = INK; ctx.lineWidth = 5; for (let i = 0; i < 3; i++) { ell(222, -8 + i * 8, 18, 15); ctx.fill(); }   // the bite out of the tip, scalloped
  ctx.restore();
  // the string: from the bite out to the top right, drooping and wobbling, then up out of the picture
  const sx = -58, sy = -214, wob = Math.sin(k * 3.1) * 14;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bz = u => { const m = 1 - u; return [m * m * m * sx + 3 * m * m * u * (sx + 70 + wob) + 3 * m * u * u * (sx - 20 - wob) + u * u * u * (sx + 80 + wob * .6), m * m * m * sy + 3 * m * m * u * (sy - 170) + 3 * m * u * u * (sy - 400) + u * u * u * (sy - 800)]; };
  for (const [col, w0, w1, dy] of [['rgba(70,40,10,.65)', 17, 8, 0], ['#ffd94a', 12, 4.5, 0], ['rgba(255,255,255,.55)', 3.4, 1.4, -2]]) {   // thick at the bite, thin as it stretches away
    for (let i = 0; i < 40; i++) { const a = bz(i / 40), b = bz((i + 1) / 40); ctx.strokeStyle = col; ctx.lineWidth = lerp(w0, w1, i / 40); ctx.beginPath(); ctx.moveTo(a[0], a[1] + dy); ctx.lineTo(b[0], b[1] + dy); ctx.stroke(); }
  }
  for (const u of [.2, .46]) { const q = bz(u); ctx.fillStyle = '#ffd94a'; ctx.strokeStyle = 'rgba(70,40,10,.65)'; ctx.lineWidth = 3; ell(q[0], q[1], 9 - u * 6, 12 - u * 8); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}

// ------------------------------------------------------------------ timing and blocking
const T_KNOCK = [.32, .56, .80], T_DOOR = 1.15, T_WALK = 1.48, T_ARRIVE = 3.9;
const T_BOX1 = 11.46, T_BOX2 = 13.18, T_STAMP = 21.51, T_LEAVE = 21.0, T_OUT = 22.52;
const ADMIN = { x: 330, z: 1560 };
const SPOT = [-300, 1040];   // where she stands to quit
const DOOR = [-640, 1790];   // she waits in the hall, behind the wall plane (Z 1750), and is seen through the opening
const strawPath = route([[0, DOOR[0], DOOR[1]], [T_WALK, DOOR[0], DOOR[1]], [1.95, -622, 1700, 'in'], [3.66, -330, 1090], [T_ARRIVE, SPOT[0], SPOT[1], 'out'], [T_LEAVE - .05, SPOT[0], SPOT[1]], [T_LEAVE + .12, -318, 1080, 'in'], [T_OUT - .02, -600, 1700], [T_OUT + .2, -612, 1810]]);
const doorOpen = lt => lt < T_DOOR ? 0 : lt < T_OUT + .12 ? sk(lt, T_DOOR, T_DOOR + .45) : 1 - sk(lt, T_OUT + .12, T_OUT + .42);
const CUTS = [['wide', 1.6], ['walk', 1.95], ['letter', 3.55], ['cuA', 4.55], ['cuS', 7.4], ['cuA2', 8.55], ['hero', 9.95], ['think', 11.27], ['slam', 12.18], ['cuS4', 12.8], ['two', 13.99], ['cuS5', 14.92], ['whip', 15.17], ['cuA5', 16.55],
  ['cuS6', 17.2], ['tower', 18.3], ['cuA6', 19.95], ['cuS7', 21.2], ['stamp', 22.4], ['end', 22.95], ['still', 1e9]];
const HARD = [1.6, 1.95, 3.55, 4.55, 7.4, 8.55, 9.95, 11.27, 12.18, 12.8, 13.99, 16.55, 17.2, 18.3, 19.95, 21.2, 22.4, 22.95];   // true cuts: no shutter samples across them
const shotOf = lt => { let t0 = 0; for (const [n, e] of CUTS) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'still', t0, t1: CUR.dur }; };
// who is in focus in each shot (everyone else is a soft neighbor, drawn out of focus and left out of the audit)
const CRISP = { cuA: ['ad'], cuA2: ['ad'], cuA5: ['ad'], cuA6: ['ad', 'sp'], think: ['ad'], cuS: ['sp'], cuS4: ['sp'], cuS5: ['sp'], cuS6: ['sp'], cuS7: ['sp'], hero: ['sp'], slam: ['ad'], two: ['ad'], whip: ['sp'], tower: [] };
const BASE = { f: 1400, cy: 400, hy: 860, cz: -100 };

// ------------------------------------------------------------------ the office scene
const OFFICE = {
  opts(lt) {
    const tH = wordT('a2', 'agency', 7.83) - .03, s3 = 8.55;
    let blinds = .45;
    if (lt >= tH && lt < s3 - .05) blinds = lerp(.45, 1, easeOut(seg(lt, tH, tH + .08)));
    else if (lt >= s3 - .05) blinds = lerp(1, .35, easeBack(seg(lt, s3 - .05, s3 + .3)));
    const boxes = [T_BOX1, T_BOX2].map(t0 => { if (lt < t0 - .24) return null; const u = clamp((lt - (t0 - .24)) / .24), k = lt - t0; return { y: lt < t0 ? 820 * (1 - u) * (1 - u) : 0, sq: lt >= t0 ? clamp(.55 * Math.exp(-k * 11) * Math.cos(k * 34), -.2, .6) : 0 }; }).filter(Boolean);
    const steam = Math.max(seg(lt, T_BOX1 + .02, T_BOX1 + .3) * (1 - seg(lt, T_BOX1 + 1.2, T_BOX1 + 3)), seg(lt, T_BOX2 + .02, T_BOX2 + .3)) * (lt < 15.1 ? 1 : .55);
    return { night: false, t: lt + 3, blinds, door: doorOpen(lt), chartPulse: OFFICE.pulse(lt), tower: boxes, steamK: lt >= T_BOX1 ? steam : 0, penGlint: OFFICE.glint(lt), sun: 1, coatLate: true };
  },
  pulse(lt) {
    const ts = [wordT('a6', 'pizza', 18.83) - .02, wordT('a6', 'budget', 19.1) - .02]; let v = 0;
    for (const t0 of ts) { const k = lt - t0; if (k > 0 && k < 1) v = Math.max(v, Math.exp(-k * 4) * (.5 + .5 * Math.cos(k * 17))); }
    return v;
  },
  glint(lt) { const w = wordT('a1', 'pen', 4.39); return Math.exp(-Math.abs(lt - w - .08) * 5) * .95 + .12 * (.5 + .5 * Math.sin(lt * 3)); },
  cast(lt) {
    const b = id => B(id), off = S10.office(OFFICE.opts(lt));
    const walking = (lt > T_WALK && lt < T_ARRIVE + .1) || (lt > T_LEAVE && lt < T_OUT + .5);
    // ---- the Administrator, seated behind the desk. Gaze, arms and the slice are blended from beat to beat so nothing pops
    const ad = off.admin({ look: [0, 0], expr: 'neutral', hold: {}, grip: {}, hand: {}, arms: { l: 'rest', r: 'rest' } });
    const eat = lt < T_KNOCK[0] ? .5 * Math.abs(Math.sin(lt * 11)) : 0;
    const pull = sk(lt, T_KNOCK[0] + .02, T_KNOCK[0] + .26), lower = sk(lt, 1.75, 2.6);
    if (lt < 3.0) {   // the slice: at his mouth, then yanked away mid-bite on the first knock, then lowered out of sight behind the desk
      ad.hold.r = 'slice10'; ad.arms.r = 'hold'; ad.hand.r = 'grip';
      ad.grip.r = [lerp(lerp(98, 176, pull), 150, lower), lerp(lerp(34, -6, pull), 150, lower)];
      ad.mouthOpen = eat; ad.cheeseSag = 1.1;
      ad.cheese = 1 - lower * .8;
      ad.expr = lt < T_KNOCK[0] ? 'happy' : lt < T_DOOR + .3 ? 'shock' : 'neutral';
      ad.look = lt < T_KNOCK[0] ? [0, .55] : lerpA([0, .55], [-.9, -.1], sk(lt, T_KNOCK[0] + .02, T_KNOCK[0] + .14));
      if (lt >= 1.75) ad.look = lerpA(ad.look, [-.7, .15], sk(lt, 1.75, 2.3));
    }
    if (lt >= 3.0 && lt < b('a1').s + 1.2) { ad.expr = 'weak'; ad.look = lerpA([-.7, .15], [-.75, .85], sk(lt, 3.3, 3.62)); if (lt > wordT('a1', 'pen', 4.39) - .1) ad.look = lerpA(ad.look, [-.8, .2], sk(lt, 4.3, 4.5)); }
    if (lt >= 4.7 && lt < 7.45) { ad.expr = lt >= wordT('s2', 'eighteen', 6.0) ? 'shock' : 'weak'; ad.look = [-.8, .1]; }
    // a2: the recoil on "agency"
    const tH = wordT('a2', 'agency', 7.83) - .03, rc = seg(lt, tH, tH + .12) * (1 - seg(lt, 8.35, 8.62));
    if (lt >= 7.4 && lt < 8.55) { ad.expr = lt >= tH ? 'panic' : 'shock'; ad.look = [-.55, -.1]; ad.sx = 1 - .16 * rc; ad.sy = 1 + .22 * rc; ad.rot = -.08 * rc; ad.arms = { l: 'up', r: 'up' }; ad.hand = { l: 'open', r: 'open' }; ad.shake = 5 * rc; }
    if (lt >= 8.55 && lt < 9.95) { ad.expr = 'sour'; ad.look = [-.8, 0]; ad.arms = { l: 'hips', r: 'hips' }; }
    // think: straining, eyes up, one finger raised
    const th = b('think');
    if (lt >= th.s - .05 && lt < 11.27) { ad.expr = 'sour'; ad.look = [.3, -.9]; ad.lid = .25; ad.browUp = 8 * sk(lt, th.s, th.s + .3); ad.arms = { l: 'hips', r: [2.4, .6] }; ad.hand = { r: 'point' }; ad.shake = 1.5 * seg(lt, th.s + .2, th.e); }
    if (lt >= 11.27 && lt < 12.23) { ad.expr = 'happy'; ad.look = [-.6, -.2]; ad.arms = { l: 'hips', r: [2.3, .5] }; ad.hand = { r: 'point' }; }
    if (lt >= 12.23 && lt < 12.87) { ad.expr = 'sour'; ad.look = [-.8, 0]; ad.arms = { l: 'hips', r: 'rest' }; }
    if (lt >= 12.87 && lt < 13.99) { ad.expr = 'happy'; ad.look = [-.6, -.1]; ad.arms = { l: [2.45, .5], r: [2.45, .5] }; ad.hand = { l: 'point', r: 'point' }; }   // two fingers up: "Two pizzas."
    if (lt >= 13.99 && lt < 15.0) { ad.expr = 'neutral'; ad.look = [-.8, 0]; ad.arms = { l: 'rest', r: 'rest' }; }
    // a5: the empty wallet
    if (lt >= 15.0 && lt < 16.55) { const k = sk(lt, 15.0, 15.4); ad.expr = 'sad'; ad.look = lerpA([-.8, 0], [-.3, .55], k); ad.hold.r = 'wallet10'; ad.walletOpen = sk(lt, 15.5, 15.75); ad.grip.r = [lerp(120, 190, sk(lt, 15.3, 15.7)), lerp(70, 6, sk(lt, 15.3, 15.7))]; ad.arms.r = 'hold'; ad.hand.r = 'grip'; ad.arms.l = 'shrug'; }
    if (lt >= 16.55 && lt < 18.37) { ad.expr = 'sour'; ad.look = [-.8, .1]; }
    // a6: he gestures at the chart
    if (lt >= 18.3 && lt < 19.95) { const k = sk(lt, 18.3, 18.56), pc = off.at.chart(); ad.expr = 'smug'; ad.look = [-.9, -.2]; ad.arms = { l: 'hold', r: 'hips' }; handTo(ad, -1, pc[0], pc[1] + 90, k, [-120, 60]); ad.hand = { l: 'point' }; }
    if (lt >= 19.95 && lt < T_OUT) { ad.expr = 'smug'; ad.look = [-.7, .2]; ad.arms = { l: 'rest', r: 'rest' }; }
    // the end: a bite, and the cheese
    if (lt >= T_OUT) {
      const bite = seg(lt, T_OUT + .1, T_OUT + .34) * (1 - seg(lt, T_OUT + .5, T_OUT + .72)), pu = sk(lt, T_OUT + .5, T_OUT + 1.0);
      ad.expr = 'happy'; ad.look = [0, .4]; ad.hold.r = 'slice10'; ad.arms.r = 'hold'; ad.hand.r = 'grip';
      ad.grip.r = [lerp(lerp(150, 98, bite), 190, pu), lerp(lerp(60, 34, bite), -10, pu)]; ad.mouthOpen = .55 * bite; ad.cheese = 1; ad.cheeseSag = 1.3;
    }
    // ---- Strawberry
    const sp = person(straw, strawPath, lt, { stride: 40, acc: ['steth', 'badge7', 'bandage7'], look: [.7, .05], expr: 'neutral', lid: .3, arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {}, id: 'straw', transit: lt < 2.4 || lt > T_OUT - .6 || (lt > 14.88 && lt < 15.3) });
    const dist = pathDist(strawPath, lt), sw = [.28 + .35 * Math.sin(dist / 84 * PI), .25], sw2 = [.28 - .35 * Math.sin(dist / 84 * PI), .25];
    if (lt < T_ARRIVE + .15) { sp.hold.r = 'letter10'; sp.grip.r = [120, 74]; sp.arms.r = 'hold'; sp.hand.r = 'grip'; sp.arms.l = walking ? sw : 'rest'; sp.lid = .2; }
    if (lt < T_WALK) sp.look = [0, 0];
    if (lt >= T_ARRIVE && lt < 4.55) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.8, .1]; }
    if (lt >= 4.55 && lt < 7.4) { sp.expr = 'dead'; sp.lid = .45; sp.look = [.8, .05]; }
    if (lt >= 7.4 && lt < 8.65) { sp.expr = 'dead'; sp.lid = .55; sp.look = [.8, 0]; }
    if (lt >= 8.65 && lt < 9.95) { sp.expr = 'smug'; sp.lid = .35; sp.look = [.7, -.1]; sp.arms = { l: 'hips', r: 'hips' }; }
    if (lt >= 9.95 && lt < 12.23) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.8, -.05]; }
    if (lt >= 12.23 && lt < 13.99) { sp.expr = 'angry'; sp.lid = .2; sp.look = [.8, 0]; }
    if (lt >= 13.99 && lt < 15.2) { sp.expr = 'hopeful'; sp.lid = undefined; sp.look = [.7, 0]; sp.arms.l = 'hold'; sp.grip.l = [-92, 24]; sp.hand.l = 'open'; }
    if (lt >= 15.2 && lt < 16.6) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.8, .1]; }
    if (lt >= 16.6 && lt < 18.37) { sp.expr = 'angry'; sp.lid = .25; sp.look = [.9, .1]; sp.arms.r = 'point'; sp.hand.r = 'point'; }
    if (lt >= 18.37 && lt < 20.02) { sp.expr = 'dead'; sp.lid = .55; sp.look = [.8, 0]; }
    if (lt >= 20.02 && lt < T_LEAVE) { const tt = wordT('s7', 'it', 20.47), cl = sk(lt, tt - .05, tt + .2); sp.expr = 'dead'; sp.lid = lerp(.55, 1, cl); sp.look = [.5, .2]; }
    if (lt >= T_LEAVE) { sp.expr = 'dead'; sp.lid = lerp(1, .5, sk(lt, T_LEAVE, T_LEAVE + .2)); sp.look = [-.6, 0]; sp.arms = { l: walking ? sw : 'rest', r: walking ? sw2 : 'rest' }; }
    if (lt >= T_LEAVE + .3) sp.noFace = true;
    return { off, ad, sp, dist };
  },
  cam(lt) {
    const sh = shotOf(lt), k = seg(lt, sh.t0, sh.t1), n = sh.n;
    // the camera first (the cast is placed through it), then the cast, then the framing
    let cam = BASE;
    if (n === 'wide' || n === 'end') cam = { f: 1400, cy: 420, hy: 900, cz: n === 'wide' ? lerp(-640, -560, sk(lt, 0, 1.6)) : lerp(-560, -520, k) };
    else if (n === 'walk') cam = { f: 1400, cy: 400, hy: 860, cz: -260 };
    else if (n === 'hero') cam = { f: 1400, cy: 90, hy: 1010, cz: -300 };
    else if (n === 'cuA2') { const t0 = wordT('a2', 'agency', 7.83) - .1, d = sk(lt, t0, t0 + .5) * (1 - sk(lt, 8.35, 8.55)), Z = ADMIN.z, cz = lerp(-100, 700, d); cam = { f: 1400 * (Z - cz) / (Z + 100), cy: 400, hy: 860, cz }; }
    V2.setCam(cam);
    CAM.shake = 0;
    const C = OFFICE.cast(lt), F = (o, z, up = 100, dx = 0) => { const [fx, fy] = faceC(o); zoomTo(fx + dx / z, fy + up / z, z); };
    switch (n) {
      case 'wide': zoomTo(455, 900, 1.15); break;
      case 'walk': { const o = C.sp; zoomTo(o.x + 10, o.y - 150 * o.s, lerp(1.85, 1.98, k)); } break;
      case 'letter': case 'stamp': case 'still': zoomTo(540, 960, 1); break;
      case 'cuA': F(C.ad, lerp(1.7, 1.8, k), 130, -190); break;
      case 'cuS': F(C.sp, lerp(1.45, 1.6, k), 250, 190); break;
      case 'cuA2': F(C.ad, lerp(1.7, 1.78, k), 120); { const tt = wordT('a2', 'agency', 7.83); CAM.shake = 5 * Math.max(0, 1 - Math.abs(lt - tt - .06) * 6); } break;
      case 'hero': F(C.sp, lerp(1.45, 1.55, k), -150); CAM.r = lerp(-.035, -.015, k); break;
      case 'think': F(C.ad, lerp(1.25, 1.38, k), 40, -40); break;
      case 'slam': zoomTo(780, 880, 1.15); CAM.shake = lt >= T_BOX1 ? 8 * Math.exp(-(lt - T_BOX1) * 9) : 0; break;
      case 'cuS4': F(C.sp, lerp(1.85, 1.95, k), 140); break;
      case 'two': zoomTo(780, 880, 1.15); CAM.shake = lt >= T_BOX2 ? 8 * Math.exp(-(lt - T_BOX2) * 9) : 0; break;
      case 'cuS5': F(C.sp, lerp(1.6, 1.7, k), 200, 120); break;
      case 'whip': { const o = C.sp, [fx, fy] = faceC(o), c = C.off.at.chart(), e = easeIO(k); zoomTo(lerp(fx + 120 / 1.7, c[0] + 150, e), lerp(fy + 200 / 1.7, c[1] + 120, e), lerp(1.7, 1.3, e)); } break;
      case 'cuA5': { const c = C.off.at.chart(), o = C.ad, e = easeIO(seg(lt, 15.17, 15.62)), [fx, fy] = faceC(o); zoomTo(lerp(c[0] + 150, fx - 50, e), lerp(c[1] + 120, fy + 40, e), lerp(1.3, 1.5, e)); } break;
      case 'cuS6': F(C.sp, lerp(1.45, 1.55, k), 190, 250); break;
      case 'tower': { const t = C.off.at.towerTop(2), z = lerp(2.1, 2.25, k); zoomTo(t[0] - 40, t[1] - 40 + 190 / z, z); } break;
      case 'cuA6': { const o = C.ad; zoomTo(484, o.y - 160 * o.s, lerp(1.0, 1.04, k)); } break;
      case 'cuS7': F(C.sp, lerp(1.8, 2.05, k), 110); break;
      case 'end': zoomTo(455, 900, 1.15); break;
    }
  },
  draw(lt) {
    const sh = shotOf(lt), n = sh.n;
    if (n === 'letter') { insLetter(lt); return; }
    if (n === 'stamp') { insStamp(lt, T_STAMP); return; }
    if (n === 'still') { insStill(lt, 22.95); return; }
    const C = OFFICE.cast(lt), off = C.off, crisp = n in CRISP ? CRISP[n] : ['ad', 'sp'], only = crisp.length === 1 ? crisp[0] : null, isC = id => crisp.includes(id);
    // light: a day look; Strawberry is backlit by the hall while she stands in the doorway; the horror beat reddens the Administrator
    const sil = lt >= T_DOOR && lt < T_WALK + .8 ? 1 - seg(lt, T_WALK + .2, T_WALK + .8) : lt > T_OUT - .3 ? seg(lt, T_OUT - .3, T_OUT + .1) * (1 - seg(lt, T_OUT + .3, T_OUT + .4)) : 0;
    const lightFor = who => off.setLight(who === 'sp' && sil > 0 ? { back: { color: '255,240,200', a: .85 * sil, w: 22 }, frontDark: .4 * sil, shadowLong: .9 * sil } : who === 'ad' && n === 'cuA2' ? { rim: '#ff5a50', rimA: .6, keyColor: '#ffb0a0' } : {});
    V2.opts.reflect = false;
    const bgBlur = { cuA: 8, cuA2: 8, cuS: 6, hero: 8, think: 5, cuS4: 9, cuS5: 6, cuA5: 7, cuS6: 6, cuA6: 4, cuS7: 8, whip: 8 }[n] || 0;
    V2.dof(bgBlur, () => { off.back(); off.sunFloor(); });
    // the Administrator, then the desk, then the guest side
    lightFor('ad');
    (isC('ad') ? drawChar : nbr)(C.ad);
    if (only === 'sp') V2.dof(6, () => off.desk()); else off.desk();
    OFFICE.deskExtras(lt, C);
    lightFor('sp');
    if (only === 'ad') V2.dof(n === 'slam' || n === 'two' ? 14 : 11, () => off.visitor()); else off.visitor();
    // Strawberry: while she is behind the wall plane (the hall) she is only visible through the open part of the doorway
    const dr = off.layout.door, zb = off.layout.zb, behind = C.sp.z > 0 ? false : false;
    const Zs = strawPath(lt)[1], hall = Zs > zb - 8;
    if (lt >= T_DOOR && lt < T_OUT + .6) {
      ctx.save();
      if (hall) { const a = p2(dr.x0 - 4, dr.y1 + 60, zb), c = p2(dr.x1 + 4, -60, zb), open = doorOpen(lt), xr = p2(dr.x0 + open * (dr.x1 - dr.x0 + 20), 0, zb)[0]; ctx.beginPath(); ctx.rect(a[0], a[1], Math.min(c[0], xr + 6) - a[0], c[1] - a[1]); ctx.clip(); }
      (isC('sp') ? drawChar : nbr)(C.sp);
      ctx.restore();
    }
    off.coat();
    OFFICE.fxWorld(lt, C, off);
    off.over();
    if (n === 'hero') V2.flare(170, 250, .55 * (.8 + .2 * Math.sin(lt * 5)));
  },
  deskExtras(lt, C) {
    const d = C.off.layout.desk;
    if (lt >= T_BOX2 - .1) S10.stand(d.x0 + 412 - 40, d.top + 52, d.z0 + 96 - 104, () => receipt(lt));
  },
  fxWorld(lt, C, off) {
    const n = shotOf(lt).n;
    // the thought bubble: it inflates over the Administrator's head on the boing, with a pizza and two gears; it pops when he says "Pizza."
    const th = B('think'), t0 = th.s + .12, tp = 11.43;
    if (((n === 'think') || (n === 'slam')) && lt >= t0 && lt < tp + .4) {
      const o = C.ad, S = o.s * .86, x = o.x + 150 * o.s, y = o.y - 540 * o.s, kk = lt < tp ? easeElastic(seg(lt, t0, t0 + .5)) : 0, pop = seg(lt, tp, tp + .3);
      if (kk > .01) bubble(x, y, S * kk * (1 + .03 * Math.sin(lt * 9)), lt - t0);
      if (pop > 0) {
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + .3, d = (60 + 200 * hash(i + 3)) * S * easeOut(pop); ctx.save(); ctx.globalAlpha = 1 - pop; ctx.fillStyle = i % 3 ? '#ffffff' : '#ffe135'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, (14 - 9 * pop) * S, (14 - 9 * pop) * S); ctx.fill(); ctx.stroke(); ctx.restore(); }
        if (pop < .7) { ctx.save(); ctx.globalAlpha = 1 - pop / .7; ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r0 = 150 * S * (.6 + pop), r1 = r0 + 60 * S; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .8); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * .8); ctx.stroke(); } ctx.restore(); }
      }
    }
    // the knock marks on the door: rings that pop on the wood
    if (lt < 1.7) { const [dx, dy] = off.at.door(), kd = kz(off.layout.zb); for (let i = 0; i < 3; i++) { const k = (lt - T_KNOCK[i]) / .5; if (k > 0 && k < 1) { V2.ring(dx + 62 * kd, dy - 20 * kd, k, { r0: 14, r1: 150 * kd + 40, lw: 9, color: '255,244,200', alpha: .95, bloom: .3 }); V2.ring(dx + 62 * kd, dy - 20 * kd, k * .8, { r0: 8, r1: 90 * kd + 20, lw: 5, color: '255,255,255', alpha: .8, bloom: 0 }); } } }
    // the hero shot: sun stripes across her
    if (n === 'hero') {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(540, 960); ctx.rotate(-.5);
      for (let i = -9; i <= 9; i++) { const x = i * 150 + 20 * Math.sin(lt * .6 + i); ctx.fillStyle = V2.grad(x, -1300, x, 1300, [[0, 'rgba(255,238,190,0)'], [.5, 'rgba(255,238,190,.2)'], [1, 'rgba(255,238,190,0)']]); ctx.fillRect(x - 38, -1300, 76, 2600); }
      ctx.restore();
    }
    // the exhale
    if (n === 'cuS7') {
      const o = C.sp, kd = KINDS[o.kind], yc = o.y - (o.lift || 0) - ((o.noLegs ? 0 : (kd.leg || 90)) + kd.ry * .9) * o.s, tt = wordT('s7', 'is', 20.62) - .02;
      sigh(o.x - 10 * o.s, yc + kd.mouthY * o.s + 14 * o.s, lt - tt, o.s);
    }
  },
  fx(lt) {
    const tH = wordT('a2', 'agency', 7.83) - .03, hz = seg(lt, tH, tH + .06) * (1 - seg(lt, tH + .2, tH + .85)), flash = lt >= tH && lt < tH + .09 ? 1 - (lt - tH) / .09 : 0, n = shotOf(lt).n;
    const gold = n === 'hero' ? .2 : 0;
    return { bloom: .55 + .3 * flash + .2 * gold, vignette: .42 + .22 * hz, grain: .045, contrast: .14, sat: .12 - .1 * hz, tint: [['#ffe9b8', .1 + gold, 'soft-light'], ...(hz > 0 ? [['#ff1a30', .55 * hz, 'soft-light']] : [])], aberr: hz > .1 ? 7 * hz : 0,
      fade: Math.max(lt < .25 ? 1 - lt / .25 : 0, flash * .6, seg(lt, CUR.dur - .25, CUR.dur - .02)), fadeColor: flash > 0 ? '255,255,255' : '0,0,10' };
  },
  blur(lt) {
    if (near(lt, HARD, .035)) return 1;
    const n = shotOf(lt).n;
    return n === 'whip' ? 8 : n === 'cuA2' ? 3 : (lt > T_WALK && lt < T_ARRIVE + .2 && n !== 'letter') ? 2 : n === 'slam' || n === 'two' ? 2 : (n === 'stamp' && lt > T_STAMP - .06 && lt < T_STAMP + .25) ? 3 : 1;
  },
  over(lt) {
    // $118/HR lands on "eighteen"
    const t1 = wordT('s2', 'eighteen', 6.0) - .02, k = lt - t1;
    if (k > 0 && k < 1.5 && lt < 7.4) {
      const e = easeOut(seg(k, 0, .14)), f = 1 - seg(k, 1.15, 1.5), sc = lerp(1.4, 1, e);
      ctx.save(); ctx.globalAlpha *= f; ctx.translate(700, 330); ctx.rotate(-.07); ctx.scale(sc, sc);
      text('$118/HR', 0, 0, { size: 132, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 18, stroke: '#150f22', spacing: 3, shadow: 18 });
      ctx.restore();
    }
    sfxWord(lt, T_OUT - .01, 'WAH WAH', 540, 330, { fill: '#cfe9ff', size: 84, rot: -.04, hold: .3 });
    // her glove, big in the frame, pointing at the receipt on the tower
    if (shotOf(lt).n === 'tower') {
      const C = OFFICE.cast(lt), d = C.off.layout.desk, kr = kz(d.z0 - 8), rp = toScr(...p2(d.x0 + 372, d.top + 52, d.z0 - 8)), tj = wordT('s6', 'pizza', 17.66), jab = lt > tj ? Math.exp(-(lt - tj) * 7) * Math.cos((lt - tj) * 26) * 22 : 0, come = eo(lt, 17.2, 17.55);
      const tx = rp[0] - 37 * kr * CAM.z - 36, ty = rp[1] + 70 * kr * CAM.z;   // the fingertip rests just left of the receipt, half way down it
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 1380); ctx.clip();
      glove(lerp(-260, tx + jab, come), lerp(ty + 260, ty + jab * .25, come), -.3, 4.4, { kind: 'point' });
      ctx.restore();
    }
  },
};
// a cartoon sigh: three puffs of breath leave the mouth one after another, growing and fading as they drift up and away
function sigh(x, y, k, s) {
  if (k < 0 || k > 1.7) return;
  for (let i = 0; i < 3; i++) {
    const a = (k - i * .2) / 1.15; if (a <= 0 || a >= 1) continue;
    const px = x + (26 + 60 * a + i * 34) * s, py = y + (14 + 120 * a + i * 12) * s, r = (16 + 30 * a) * s, al = Math.min(1, a * 5) * (1 - a) * .95;
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(px, py);
    for (const [dx, dy, rr0] of [[-.55, .1, .62], [.1, -.3, .85], [.7, .15, .6], [0, .35, .7]]) { ctx.fillStyle = INK; ell(dx * r, dy * r, rr0 * r + 3.4, rr0 * r + 3.4); ctx.fill(); }
    for (const [dx, dy, rr0] of [[-.55, .1, .62], [.1, -.3, .85], [.7, .15, .6], [0, .35, .7]]) { ctx.fillStyle = '#eef3ff'; ell(dx * r, dy * r, rr0 * r, rr0 * r); ctx.fill(); }
    ctx.restore();
  }
}
// the receipt on the tower: a strip of thermal paper hanging off the top box
function receipt(lt) {
  const w = 74, h = 150, sway = Math.sin(lt * 2.1) * .03;
  ctx.save(); ctx.rotate(sway);
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2, h);
  for (let i = 0; i < 8; i++) ctx.lineTo(w / 2 - (i + .5) * w / 8, h - (i % 2 ? 0 : 7)); ctx.lineTo(-w / 2, h); ctx.closePath(); ctx.fill(); ctx.stroke();
  const rows = [['SLICE & CO', 12, '#2a2a36', 900, 22], ['2 LARGE PIZZA', 9, '#3a3a4a', 800, 44], ['39.98', 9, '#3a3a4a', 800, 56], ['TOTAL', 10, '#2a2a36', 900, 76], ['$39.98', 18, '#b3261e', 900, 94], ['CHARGED TO:', 8.5, '#6a6a7a', 800, 114], ['STAFFING', 12, '#2a2a36', 900, 128]];
  for (const [s, sz, c, wt, y] of rows) text(s, 0, y, { size: sz, fill: c, weight: wt, spacing: .4, maxW: w - 8 });
  ctx.restore();
}
// the thought bubble: a cloud of circles, three small ones trailing down, a pizza and two turning gears inside
function bubble(x, y, S, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
  const lumps = [[-120, 20, 70], [-60, -40, 80], [20, -62, 88], [100, -30, 76], [128, 30, 66], [60, 64, 74], [-40, 66, 72]], tail = [[-170, 150, 22], [-210, 205, 15], [-236, 246, 9]];
  ctx.lineJoin = 'round'; ctx.fillStyle = INK; for (const [cx, cy, r] of lumps) { ell(cx, cy, r + 6, r + 6); ctx.fill(); }
  for (const [cx, cy, r] of tail) { ell(cx, cy, r + 5, r + 5); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; for (const [cx, cy, r] of lumps) { ell(cx, cy, r, r); ctx.fill(); }
  for (const [cx, cy, r] of tail) { ell(cx, cy, r, r); ctx.fill(); }
  ctx.fillStyle = 'rgba(160,170,210,.25)'; ell(0, 40, 150, 50); ctx.fill();
  ctx.save(); ctx.translate(-40, 10); ctx.rotate(-.5); ctx.fillStyle = '#c28a3e'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-60, -14); ctx.quadraticCurveTo(0, -34, 60, -14); ctx.lineTo(0, 100); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd85a'; ctx.beginPath(); ctx.moveTo(-48, -10); ctx.quadraticCurveTo(0, -24, 48, -10); ctx.lineTo(0, 82); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#b3261e'; for (const [px, py] of [[-14, 8], [16, 14], [0, 42], [-4, 66]]) { ell(px, py, 11, 11); ctx.fill(); } ctx.restore();
  for (const [gx, gy, gr, dir] of [[78, -6, 34, 1], [118, 38, 24, -1]]) { ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * 3.2 * dir); ctx.fillStyle = '#8a92a4'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r0 = i % 2 ? gr * .82 : gr * 1.06; ctx.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ell(0, 0, gr * .32, gr * .32); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}

// ============================================================================ the exit interview, 10:30 PM
/* exit shot list (scene-local seconds)
 *   0.00  open: wide, night: the lamp pool, the moon in the blinds; he reads FORM 27-B on a clipboard and flips the page (paper 0.30); she sits in the low chair with her tote on her lap
 *   1.20  a1: low on him ("Exit interview.")    2.15 form insert: question 1    3.50 her pen ticks OTHER and writes MONEY with the word
 *   4.25  a2: low on him, "Please explain."     5.40 form insert: question 2, MONEY again, bigger, underlined twice
 *   6.36  a3: "Would you recommend Fruit Bowl to a friend?"    7.45 form insert: question 3; "(as agency)" is written in the margin on "As agency."; he circles it in red and slams N/A on "option."
 *   11.20 s4: high on her, "It's the only option."    12.81 stamp: EXIT INTERVIEW COMPLETE lands at 13.01 (the same wooden stamp as the office scene)
 *   13.73 a5: "Please return all company property."    15.15 her reaction    15.80 property: top-down, she empties the tote (clatter 16.15, rattle 16.55); he ticks the inventory list: everything but PEN
 *   17.35 a6: "Pen."    18.19 s5: she takes the pen out of her leaf    19.27 a7: "To share."    20.24 s6: "I shared it for four years."
 *   21.62 she slides the pen across the desk: it rolls off the edge    22.05 it drops into the wastebasket (clink 22.25, the sting)    22.55 end: wide, the pen among the other resignations */
const FY = { head: -428, title: -366, q1: -274, o1: -214, o2: -150, q2: -58, l1: 42, l2: 106, q3: 196, q3b: 236, o3: 310, q4: 414, sig: 486 };
const INK_B = '#1d3fa8', INK_R = '#d6202e';
// FORM 27-B on a clipboard, seen from above. The origin is the middle of the sheet (700 x 1060), x to the right, y down. S carries what has been written so far; returns the ink front of the active line, in form coordinates
function formArt(S = {}) {
  const x0 = -350;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18;
  ctx.fillStyle = V2.grad(-392, 0, 392, 0, [[0, '#a8743e'], [.5, '#c48c52'], [1, '#966634']]); ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-394, -606, 788, 1204, 24); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = '#fffef8'; ctx.fillRect(x0, -530, 700, 1060);
  ctx.fillStyle = V2.grad(0, -530, 0, 530, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(180,170,140,.2)']]); ctx.fillRect(x0, -530, 700, 1060);
  ctx.fillStyle = V2.grad(-100, 0, 100, 0, [[0, '#8a92a4'], [.4, '#f2f5fa'], [1, '#7a8498']]); ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-100, -622, 200, 92, 16); ctx.fill(); ctx.stroke();   // the clip
  ctx.fillStyle = '#5a6278'; rr(-64, -604, 128, 30, 8); ctx.fill();
  const L = (str, x, y, o) => text(str, x, y, Object.assign({ size: 28, fill: '#20202c', weight: 900, align: 'left' }, o));
  text('FRUIT BOWL REHAB & NURSING', -310, FY.head, { size: 19, fill: '#8a90a4', weight: 800, spacing: 2, align: 'left', maxW: 400 });
  text('FORM 27-B', 310, FY.head, { size: 19, fill: '#8a90a4', weight: 900, spacing: 2, align: 'right', maxW: 200 });
  text('EXIT INTERVIEW', 0, FY.title, { size: 66, fill: '#20202c', weight: 900, spacing: 3, maxW: 640 });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-310, -318); ctx.lineTo(310, -318); ctx.stroke();
  const box = (x, y) => { ctx.strokeStyle = '#20202c'; ctx.lineWidth = 3.4; ctx.strokeRect(x, y - 15, 30, 30); };
  L('1.  REASON FOR LEAVING', -310, FY.q1, { size: 32, maxW: 560 });
  box(-310, FY.o1); L('Better opportunity', -266, FY.o1, { weight: 700, maxW: 280 }); box(30, FY.o1); L('Relocation', 74, FY.o1, { weight: 700, maxW: 240 });
  box(-310, FY.o2); L('Retirement', -266, FY.o2, { weight: 700, maxW: 240 }); box(30, FY.o2); L('Other:', 74, FY.o2, { weight: 700, maxW: 120 });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(176, FY.o2 + 16); ctx.lineTo(320, FY.o2 + 16); ctx.stroke();
  L('2.  PLEASE EXPLAIN', -310, FY.q2, { size: 32, maxW: 560 });
  ctx.strokeStyle = 'rgba(32,32,44,.55)'; ctx.lineWidth = 2.4; for (const y of [FY.l1 + 22, FY.l2 + 22]) { ctx.beginPath(); ctx.moveTo(-310, y); ctx.lineTo(310, y); ctx.stroke(); }
  L('3.  WOULD YOU RECOMMEND', -310, FY.q3, { size: 32, maxW: 600 }); L('FRUIT BOWL TO A FRIEND?', -310, FY.q3b, { size: 32, maxW: 600 });
  box(-310, FY.o3); L('YES', -266, FY.o3, { weight: 700, maxW: 100 }); box(-120, FY.o3); L('NO', -76, FY.o3, { weight: 700, maxW: 100 });
  L('4.  RETURN ALL COMPANY PROPERTY', -310, FY.q4, { size: 30, maxW: 620 });
  text('SIGNED', -310, FY.sig, { size: 18, fill: '#8a90a4', weight: 800, spacing: 2, align: 'left', maxW: 120 });
  ctx.strokeStyle = 'rgba(32,32,44,.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-220, FY.sig + 14); ctx.lineTo(120, FY.sig + 14); ctx.stroke();
  // what has been written: her answers in blue ink (a sparkle rides the ink front), his red marker and stamps
  let pen = null;
  if ((S.tick ?? 0) > 0) { const t = S.tick; ctx.save(); ctx.strokeStyle = INK_B; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(34, FY.o2 - 2); ctx.lineTo(lerp(34, 50, clamp(t * 2)), lerp(FY.o2 - 2, FY.o2 + 14, clamp(t * 2))); if (t > .5) ctx.lineTo(lerp(50, 66, (t - .5) * 2), lerp(FY.o2 + 14, FY.o2 - 22, (t - .5) * 2)); ctx.stroke(); ctx.restore(); if (t < 1) pen = [lerp(34, 66, t), FY.o2]; }
  if ((S.money1 ?? 0) > 0) { const q = hand('MONEY', 186, FY.o2 + 6, 56, S.money1, { weight: 800, seed: 3, color: INK_B }); if (S.money1 < 1) pen = q; }
  if ((S.money2 ?? 0) > 0) {
    const q = hand('MONEY', -296, FY.l1 + 14, 110, Math.min(1, S.money2 * 1.25), { weight: 800, seed: 7, color: INK_B }); if (S.money2 < .8) pen = q;
    const u = clamp((S.money2 - .8) / .2); if (u > 0) { ctx.save(); ctx.strokeStyle = INK_B; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (const [dy, a] of [[34, 0], [48, 1]]) { ctx.beginPath(); ctx.moveTo(-300 + 6 * a, FY.l1 + dy); ctx.quadraticCurveTo(-120, FY.l1 + dy + 6 - 10 * a, lerp(-300, 120, u) + 10 * a, FY.l1 + dy - 2 + 4 * a); ctx.stroke(); } ctx.restore(); if (u < 1) pen = [lerp(-300, 120, u), FY.l1 + 44]; }
  }
  if ((S.asag ?? 0) > 0) { ctx.save(); ctx.translate(60, FY.o3 + 38); ctx.rotate(-.06); const q = hand('(as agency)', 0, 0, 44, S.asag, { weight: 700, seed: 5, color: INK_B }); ctx.restore(); if (S.asag < 1) pen = [60 + q[0] - 0, FY.o3 + 38 + q[1] - 0]; }
  if ((S.circle ?? 0) > 0) {   // his red marker: one lap around the margin note, a little uneven
    ctx.save(); ctx.strokeStyle = INK_R; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); const cx = 188, cy = FY.o3 + 26, a1 = clamp(S.circle) * TAU * 1.08;
    for (let a = 0; a <= a1; a += .1) { const r = 1 + .05 * Math.sin(a * 2.2), px = cx + Math.cos(a - 1.9) * 158 * r, py = cy + Math.sin(a - 1.9) * 54 * r; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.restore();
  }
  if ((S.na ?? 0) > 0) {   // N/A: a red rubber stamp over the margin note
    ctx.save(); ctx.translate(176, FY.o3 + 6); ctx.rotate(-.2); ctx.globalAlpha *= .94 * clamp(S.na * 1.5); ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = INK_R; ctx.lineWidth = 11; rr(-138, -62, 276, 124, 14); ctx.stroke(); ctx.lineWidth = 3.6; rr(-120, -46, 240, 92, 8); ctx.stroke();
    text('N/A', 0, 4, { size: 112, font: 'Bangers', weight: 400, fill: INK_R, spacing: 6, maxW: 230 });
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,254,248,.55)'; for (let i = 0; i < 50; i++) { ell((hash(i + 13) - .5) * 250, (hash(i + 91) - .5) * 110, 1.2 + hash(i + 5) * 2.4, 1 + hash(i + 7) * 1.6); ctx.fill(); }
    ctx.restore();
  }
  if ((S.done ?? 0) > 0) {   // the verdict, in the same ink as the office RECEIVED
    ctx.save(); ctx.translate(0, 236); ctx.rotate(-.1); ctx.globalAlpha *= .94 * clamp(S.done * 1.5); ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = INK_R; ctx.lineWidth = 12; rr(-318, -132, 636, 264, 16); ctx.stroke(); ctx.lineWidth = 4; rr(-296, -110, 592, 220, 10); ctx.stroke();
    text('EXIT INTERVIEW', 0, -52, { size: 92, font: 'Bangers', weight: 400, fill: INK_R, spacing: 4, maxW: 560 });
    text('COMPLETE', 0, 36, { size: 112, font: 'Bangers', weight: 400, fill: INK_R, spacing: 6, maxW: 560 });
    text('FRUIT BOWL REHAB  *  10:30 PM', 0, 92, { size: 20, fill: INK_R, weight: 900, spacing: 3, maxW: 520 });
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,254,248,.6)'; for (let i = 0; i < 90; i++) { ell((hash(i + 3) - .5) * 600, (hash(i + 77) - .5) * 240, 1.2 + hash(i + 9) * 2.8, 1.1 + hash(i + 11) * 1.8); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
  return pen;
}
// a writing glove: a fist holding a pen, the pen's tip on (tx, ty); the arm trails off the far side. col is the pen's body
function penHand(tx, ty, ang, sc, col = '#2a6fdb') {
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-44, 5);
  ctx.fillStyle = LIMB; ctx.beginPath(); ctx.roundRect(-300, -9, 302, 18, 8); ctx.fill();
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  ctx.save(); ctx.translate(44, -5); ctx.rotate(.42);   // the pen: tip at the origin, running back over the fist
  ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; rr(-96, -5.5, 84, 11, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eef1f7'; rr(-96, -5.5, 24, 11, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8ced8'; ctx.beginPath(); ctx.moveTo(-12, -4.5); ctx.lineTo(-12, 4.5); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  V2C.hand('grip', 1, {});
  ctx.restore();
}

// the eight things in her tote, drawn from above (about 120 to 190 px long); the origin is the middle of each
function itemArt(kind, t) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  switch (kind) {
    case 'badge':
      ctx.fillStyle = '#fff'; rr(-50, -74, 100, 148, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8193a'; rr(-32, -50, 64, 54, 6); ctx.fill(); ctx.stroke(); text('NURSE', 0, 38, { size: 18, fill: '#243a5e', weight: 900, maxW: 84 });
      ctx.fillStyle = '#c9d2f0'; rr(-14, -66, 28, 9, 4); ctx.fill(); ctx.stroke(); break;
    case 'keys': {
      ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 7; ell(0, -40, 30, 30); ctx.stroke();
      const cols = ['#d4af37', '#c0c6cf', '#d4af37', '#b87333', '#c0c6cf'];
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(0, -40); ctx.rotate(-1.1 + i * .55); ctx.fillStyle = cols[i]; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-6, 14, 12, 78 + (i % 2) * 14, 4); ctx.fill(); ctx.stroke(); ell(0, 100 + (i % 2) * 14, 11, 11); ctx.fill(); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.translate(36, 20); ctx.rotate(.4); ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-30, -20, 60, 40, 5); ctx.fill(); ctx.stroke(); text('ALL KEYS', 0, 0, { size: 12, fill: '#d62828', weight: 900, maxW: 54 }); ctx.restore(); break; }
    case 'light':
      ctx.fillStyle = V2.grad(0, -24, 0, 24, [[0, '#eef1f7'], [.5, '#9aa4b8'], [1, '#5a6278']]); rr(-86, -22, 130, 44, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2a2a36'; rr(-90, -26, 24, 52, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = V2.grad(44, 0, 90, 0, [[0, '#8a92a4'], [1, '#c8ced8']]); ctx.beginPath(); ctx.moveTo(44, -30); ctx.lineTo(88, -40); ctx.lineTo(88, 40); ctx.lineTo(44, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffe135'; ell(88, 0, 10, 38); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d6202e'; rr(-30, -8, 26, 16, 5); ctx.fill(); ctx.stroke(); break;
    case 'scissors':
      for (const sd of [-1, 1]) { ctx.save(); ctx.rotate(sd * .17); ctx.fillStyle = V2.grad(0, -6, 0, 6, [[0, '#eef1f7'], [1, '#8a92a4']]); ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(74, -8 * sd); ctx.lineTo(96, 0); ctx.lineTo(74, 10 * sd); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#ff8a1c'; ctx.lineWidth = 12; ell(-80, sd * 12, 22, 17); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(-80, sd * 12, 28, 23); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#6a7080'; ell(-30, 0, 7, 7); ctx.fill(); ctx.stroke(); break;
    case 'glove': ctx.save(); ctx.scale(2.6, 2.6); ctx.translate(-14, 0); ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-30, -9, 36, 18, 6); ctx.fill(); V2C.hand('open', 1, {}); ctx.restore(); break;
    case 'lanyard':
      ctx.strokeStyle = INK; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(0, 70); ctx.bezierCurveTo(-96, 20, -70, -80, 0, -84); ctx.bezierCurveTo(70, -80, 96, 20, 0, 70); ctx.stroke();
      ctx.strokeStyle = '#e8193a'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(0, 70); ctx.bezierCurveTo(-96, 20, -70, -80, 0, -84); ctx.bezierCurveTo(70, -80, 96, 20, 0, 70); ctx.stroke();
      ctx.fillStyle = '#c0c6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-14, 62, 28, 34, 6); ctx.fill(); ctx.stroke(); break;
    case 'steth':
      ctx.strokeStyle = INK; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(-64, -80); ctx.bezierCurveTo(-70, 10, -10, 40, 0, 20); ctx.bezierCurveTo(10, 40, 70, 10, 64, -80); ctx.moveTo(0, 20); ctx.bezierCurveTo(0, 70, 40, 90, 70, 96); ctx.stroke();
      ctx.strokeStyle = '#5a3a8a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-64, -80); ctx.bezierCurveTo(-70, 10, -10, 40, 0, 20); ctx.bezierCurveTo(10, 40, 70, 10, 64, -80); ctx.moveTo(0, 20); ctx.bezierCurveTo(0, 70, 40, 90, 70, 96); ctx.stroke();
      ctx.fillStyle = V2.grad(-24, 0, 24, 0, [[0, '#eef1f7'], [1, '#8a92a4']]); ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(76, 98, 26, 26); ctx.fill(); ctx.stroke(); ell(76, 98, 11, 11); ctx.fillStyle = '#5a6278'; ctx.fill();
      ctx.fillStyle = '#c0c6cf'; ell(-64, -84, 9, 9); ctx.fill(); ctx.stroke(); ell(64, -84, 9, 9); ctx.fill(); ctx.stroke(); break;
    case 'pop':
      ctx.fillStyle = '#fff'; rr(-8, 20, 16, 100, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5fa8'; ell(0, -30, 46, 46); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; for (let a = 0; a < 2.2; a += .16) { ctx.beginPath(); ctx.arc(0, -30, 6 + a * 16, a * 4.4, a * 4.4 + 1.6); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ell(0, -30, 46, 46); ctx.stroke(); break;
  }
}
// a thrown item: it arcs out of the tote, lands at `land`, then bounces three times (lower each time) and settles on `to`. k is seconds since it lands (negative before)
function flyItem(it, k) {
  const T1 = .2;
  if (k < -T1) return null;
  if (k < 0) { const u = (k + T1) / T1; return { x: lerp(it.from[0], it.land[0], u), y: lerp(it.from[1], it.land[1], u), z: 190 * 4 * u * (1 - u) + 30 * (1 - u), a: lerp(it.a0, it.a1, u) }; }
  const ph = [[.14, 40, 0, .6], [.1, 16, .6, .9], [.07, 6, .9, 1]];
  let t0 = 0, p0 = it.land;
  for (const [d, h, f0, f1] of ph) { if (k < t0 + d) { const v = (k - t0) / d, q0 = lerp(it.land[0], it.to[0], f0), r0 = lerp(it.land[1], it.to[1], f0), q1 = lerp(it.land[0], it.to[0], f1), r1 = lerp(it.land[1], it.to[1], f1); return { x: lerp(q0, q1, v), y: lerp(r0, r1, v), z: h * 4 * v * (1 - v), a: lerp(it.a1, it.a2, easeOut(clamp(k / .3))) }; } t0 += d; }
  return { x: it.to[0], y: it.to[1], z: 0, a: it.a2 };
}
const TOTE_MOUTH = [330, 1210];
const ITEM_LIST = [
  { id: 'badge', to: [200, 560], a: .25, w: 1 }, { id: 'keys', to: [470, 470], a: -.55, w: 1 }, { id: 'light', to: [270, 880], a: 1.25, w: 1 }, { id: 'scissors', to: [510, 800], a: .7, w: 1 },
  { id: 'glove', to: [150, 1090], a: -.3, w: 2 }, { id: 'lanyard', to: [470, 1080], a: .9, w: 2 }, { id: 'steth', to: [330, 700], a: .15, w: 2 }, { id: 'pop', to: [150, 270], a: 2.2, w: 2 }].map((it, i) => {
  const wave = it.w === 1 ? 16.15 : 16.55, off = hash(i * 7 + 3);
  return Object.assign(it, { tL: wave + (i % 4) * .012, from: [TOTE_MOUTH[0] + (hash(i + 1) - .5) * 60, TOTE_MOUTH[1] - 20], land: [it.to[0] + (hash(i + 20) - .5) * 70, it.to[1] + 36 + off * 30], a0: (hash(i + 5) - .5) * 4, a1: it.a + (hash(i + 9) - .5) * 1.4, a2: it.a });
});
const INV_ROWS = ['NAME BADGE', 'KEYS (ALL OF THEM)', 'FLASHLIGHT', 'BANDAGE SCISSORS', 'GLOVE (ONE)', 'LANYARD', 'STETHOSCOPE', 'LOLLIPOP (OPENED)', 'PEN'];
// the Administrator's inventory: a list on a clipboard; nt = how many rows are ticked so far (a float: the last tick is being drawn). Returns the centre of the next row's box
function invList(nt) {
  ctx.save(); ctx.translate(838, 640);
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 14; ctx.fillStyle = '#a8743e'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(-196, -420, 392, 840, 20); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = '#fffef8'; ctx.fillRect(-168, -376, 336, 780);
  ctx.fillStyle = V2.grad(-60, 0, 60, 0, [[0, '#8a92a4'], [.4, '#f2f5fa'], [1, '#7a8498']]); rr(-62, -440, 124, 56, 12); ctx.fill(); ctx.stroke();
  text('COMPANY PROPERTY', 0, -322, { size: 26, fill: '#20202c', weight: 900, spacing: 1, maxW: 300 }); ctx.strokeStyle = '#20202c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-140, -296); ctx.lineTo(140, -296); ctx.stroke();
  INV_ROWS.forEach((r, i) => {
    const y = -240 + i * 74, last = i === INV_ROWS.length - 1;
    if (last) { ctx.fillStyle = 'rgba(255,225,53,.55)'; ctx.fillRect(-160, y - 30, 320, 60); }
    ctx.strokeStyle = '#20202c'; ctx.lineWidth = 3; ctx.strokeRect(-146, y - 15, 30, 30);
    text(r, -100, y, { size: 22, fill: '#20202c', weight: 800, align: 'left', maxW: 250 });
    const tk = clamp(nt - i);
    if (tk > 0 && !last) { ctx.strokeStyle = INK_R; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-142, y); ctx.lineTo(lerp(-142, -128, clamp(tk * 2)), lerp(y, y + 12, clamp(tk * 2))); if (tk > .5) ctx.lineTo(lerp(-128, -106, (tk - .5) * 2), lerp(y + 12, y - 20, (tk - .5) * 2)); ctx.stroke(); }
  });
  ctx.restore();
  return [838 - 131, 640 - 240 + Math.min(nt, 8) * 74];
}
// the tote, from above (a teal bag with two handles), tipped by rot
function toteTop(rot) {
  ctx.save(); ctx.translate(TOTE_MOUTH[0], TOTE_MOUTH[1] + 90); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(12, 18, 150, 40); ctx.fill();
  ctx.strokeStyle = '#1f6f67'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-60, 40); ctx.bezierCurveTo(-60, 150, 60, 150, 60, 40); ctx.stroke();
  ctx.fillStyle = '#2ec4b6'; ctx.strokeStyle = INK; ctx.lineWidth = 5; rr(-130, -50, 260, 220, 22); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0c3d3a'; rr(-110, -42, 220, 60, 14); ctx.fill();   // the open mouth
  ctx.fillStyle = '#fff'; rr(-70, 50, 140, 76, 8); ctx.fill(); ctx.lineWidth = 3.4; ctx.stroke(); text('PER DIEM', 0, 74, { size: 24, fill: '#d62828', weight: 900, maxW: 120 }); text('$118/HR', 0, 106, { size: 26, fill: INK, weight: 900, maxW: 120 });
  ctx.restore();
}
function insProp(lt) {
  const t0 = 15.8;
  deskTop();
  // the tote tips twice: out come four things, then four more on a shake
  const rot1 = -.55 * sk(lt, 15.84, 15.98) * (1 - sk(lt, 16.1, 16.3)), rot2 = -.5 * sk(lt, 16.34, 16.44) * (1 - sk(lt, 16.5, 16.66)), rot = rot1 + rot2, gone = sk(lt, 16.95, 17.15);
  ITEM_LIST.forEach(it => { const f = flyItem(it, lt - it.tL); if (!f) return; ctx.save(); ctx.translate(f.x + f.z * .1, f.y - f.z * .3); ctx.save(); ctx.translate(f.z * .22, f.z * .5); ctx.globalAlpha *= .3 * Math.max(0, 1 - f.z / 240); ctx.fillStyle = '#000'; ell(0, 0, 70, 26); ctx.fill(); ctx.restore(); const sc = (1 + f.z / 520) * 1.3; ctx.scale(sc, sc); ctx.rotate(f.a); itemArt(it.id, lt); ctx.restore(); });
  ctx.save(); ctx.translate(0, 340 * gone); toteTop(rot); ctx.restore();
  // the inventory, and his marker
  const nt = reveal(lt, [[16.62, 0], [17.2, 8]]), nxt = invList(nt);
  if (lt > 16.5 && lt < 17.36) {
    const come = eo(lt, 16.5, 16.66), tap = lt > 17.2 ? Math.abs(Math.sin((lt - 17.2) * 30)) * 14 : 0;
    const tx = lerp(1180, nxt[0] + 22, come), ty = lerp(-150, Math.min(nxt[1], 940) - 10 - tap, come);
    penHand(tx, ty, 2.2, 4.0, '#d6202e');
  }
  // impacts: a ring where the first things land, and a shake
  for (const t of [16.15, 16.55]) { const k = (lt - t) / .4; if (k > 0 && k < 1) V2.ring(330, 840, k, { r0: 40, r1: 520, lw: 7, color: '255,236,180', alpha: .5, bloom: 0 }); }
}
// the pen: she slides it across the desk and it rolls off the left edge
function penTop(x, y, a, sc = 1, glint = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(8, 16, 130, 14); ctx.fill();
  ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round'; rr(-120, -13, 220, 26, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eef1f7'; rr(-120, -13, 60, 26, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8ced8'; rr(-110, 4, 80, 7, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; ctx.beginPath(); ctx.moveTo(100, -11); ctx.lineTo(100, 11); ctx.lineTo(132, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-50, -9, 140, 5, 2); ctx.fill();
  ctx.restore();
  if (glint > 0) star(x - 70 * Math.cos(a) * sc, y - 70 * Math.sin(a) * sc, 36 * glint, glint, '255,248,214');
}
function insSlide(lt) {
  const t0 = 21.62, u = clamp((lt - t0) / .43);
  deskTop();
  // the leather's left edge is at x 40: the pen leaves it at u about .8 and tips over
  const x = lerp(900, 30, easeOut(u)), y = 760 + 24 * Math.sin(u * 5), a = Math.PI + (u > .75 ? -(u - .75) * 5 : 0) + .05, fall = Math.max(0, (u - .78) / .22);
  ctx.save(); ctx.globalAlpha *= 1 - .8 * fall; penTop(x, y + 120 * fall * fall, a + fall * 1.8, 1 - .25 * fall, 0); ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.restore();
}

// a rubber stamp seen from above: it grows as it comes down (down 0..1), and after the hit it lifts away (lift 0..1) and fades
function stampTool(x, y, rot, w, h, down, lift) {
  if (lift >= 1) return;
  const sc = down < 1 ? lerp(2.4, 1, down) : lerp(1, 2.2, lift);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot + (1 - down) * .05); ctx.scale(sc, sc); ctx.globalAlpha *= 1 - seg(lift, .55, 1);
  ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.filter = 'blur(' + (1 + (1 - down) * 14) + 'px)'; rr(-w / 2 + 4, -h / 2 + 10 + 30 * (1 - down), w, h, 14); ctx.fill(); ctx.filter = 'none';
  ctx.fillStyle = '#2a1a12'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -h / 2, 0, h / 2, [[0, '#4a3022'], [1, '#2a1a12']]); rr(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 10); ctx.fill();
  const r = Math.min(h * .78, 150);
  ctx.fillStyle = V2.radial(-r * .27, -r * .33, r * .13, r * 1.25, [[0, '#9a6a44'], [.55, '#6a4630'], [1, '#34200f']]); ell(0, 0, r, r); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = V2.grad(-r * .4, -r * .4, r * .4, r * .4, [[0, '#f4d878'], [1, '#8a6414']]); ell(0, 0, r * .36, r * .36); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-r * .12, -r * .15, r * .12, r * .06, -.6); ctx.fill();
  ctx.restore();
}
// the form insert: the clipboard on the desk, framed on one question (view: z, cy, sy), with her pen hand and his marker hand
const FORM_Q = { q1: { z: 1.3, cx: 70, cy: -210, sy: 760 }, q2: { z: 1.3, cx: 0, cy: -10, sy: 780 }, q3: { z: 1.3, cx: 60, cy: 250, sy: 720 }, all: { z: 1.0, cx: 0, cy: 70, sy: 800 } };
function insForm(lt, view) {
  deskTop();
  const S = { tick: seg(lt, 3.44, 3.56), money1: seg(lt, 3.5, 3.97), money2: seg(lt, 5.47, 6.25), asag: seg(lt, 8.66, 9.49), circle: seg(lt, 9.86, 10.42), na: lt >= 10.56 ? clamp((lt - 10.56) * 14) : 0, done: lt >= 13.01 ? clamp((lt - 13.01) * 14) : 0 };
  const z = view.z, cy = view.cy, sx = 540, sy = view.sy, shk = (lt >= 10.56 && lt < 10.9 ? Math.exp(-(lt - 10.56) * 14) * 7 * Math.sin((lt - 10.56) * 70) : 0) + (lt >= 13.01 && lt < 13.4 ? Math.exp(-(lt - 13.01) * 12) * 9 * Math.sin((lt - 13.01) * 70) : 0);
  const cx0 = view.cx ?? 0, to = (fx, fy) => [sx + (fx - cx0) * z, sy + (fy - cy) * z + shk];
  ctx.save(); ctx.translate(sx, sy + shk); ctx.scale(z, z); ctx.translate(-cx0, -cy);
  const pen = formArt(S);
  ctx.restore();
  // her pen hand: it comes in from the lower right when she writes, follows the ink, and leaves
  const win = lt < 5 ? [3.2, 4.2] : lt < 7 ? [5.3, 6.45] : [8.5, 9.7];
  if (pen && lt >= win[0] && lt < win[1]) {
    const come = sk(lt, win[0], win[0] + .2), go = sk(lt, win[1] - .22, win[1]), P = to(pen[0], pen[1]);
    penHand(P[0] + 420 * (1 - come) + 420 * go, P[1] + 520 * (1 - come) + 520 * go, -2.12, 4.3, '#2a6fdb');
  }
  // his red marker: it circles the note, then he stamps it
  if (lt >= 9.6 && lt < 10.6) {
    const come = sk(lt, 9.6, 9.86), go = sk(lt, 10.4, 10.6), a = clamp(S.circle) * TAU * 1.08, r = 1 + .05 * Math.sin(a * 2.2), P = to(188 + Math.cos(a - 1.9) * 158 * r, FY.o3 + 26 + Math.sin(a - 1.9) * 54 * r);
    penHand(P[0] + 520 * (1 - come) + 520 * go, P[1] - 700 * (1 - come) - 700 * go, 2.2, 4.1, '#d6202e');
  }
  if (lt >= 10.34 && lt < 11.1) { const P = to(176, FY.o3 + 6); stampTool(P[0], P[1] + shk, -.2, 276 * z, 124 * z, easeIn(seg(lt, 10.34, 10.56)), easeOut(seg(lt, 10.78, 11.08))); }
  if (lt >= 12.8 && lt < 13.75) { const P = to(0, 236); stampTool(P[0], P[1] + shk, -.1, 636 * z, 264 * z, easeIn(seg(lt, 12.81, 13.01)), easeOut(seg(lt, 13.25, 13.65))); }
  ctx.save(); ctx.fillStyle = V2.grad(0, 1230, 0, 1392, [[0, 'rgba(8,6,14,0)'], [1, 'rgba(8,6,14,.96)']]); ctx.fillRect(0, 1230, W, H - 1230); ctx.restore();   // the paper sinks into the dark where the captions sit
  // ink dots at the stamps
  for (const [t0, cx2, cy2, n] of [[10.56, 176, FY.o3 + 6, 22], [13.01, 0, 236, 40]]) { const k = lt - t0; if (k >= 0 && k < .6) { const P = to(cx2, cy2), u = easeOut(seg(k, 0, .28)); ctx.save(); ctx.fillStyle = INK_R; ctx.globalAlpha = 1 - seg(k, .3, .6); for (let i = 0; i < n; i++) { const an = hash(i + 4 + t0) * TAU, d = (140 + hash(i + 19) * 260) * u, r = (3 + hash(i + 8) * 8) * (.5 + .5 * u); ell(P[0] + Math.cos(an) * d * 1.1, P[1] + Math.sin(an) * d * .8, r, r); ctx.fill(); } ctx.restore(); } }
}

const EXIT_CUTS = [['open', 1.2], ['cuA1', 2.15], ['q1', 4.25], ['cuA2', 5.4], ['q2', 6.36], ['cuA3', 7.45], ['q3', 11.2], ['cuS4', 12.81], ['stamp', 13.73], ['cuA5', 15.15], ['cuS5', 15.8], ['prop', 17.35], ['cuA6', 18.19],
  ['cuS6', 19.27], ['cuA7', 20.24], ['cuS7', 21.62], ['slide', 22.05], ['bin', 22.55], ['cuA8', 23.0], ['end', 1e9]];
const EX_HARD = [1.2, 2.15, 4.25, 5.4, 6.36, 7.45, 11.2, 12.81, 13.73, 15.15, 15.8, 17.35, 18.19, 19.27, 20.24, 21.62, 22.05, 22.55, 23.0];
const exShot = lt => { let t0 = 0; for (const [n, e] of EXIT_CUTS) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'end', t0, t1: CUR.dur }; };
const BIN_CAM = { f: 1400, cy: 330, hy: 880, cz: -200, cx: -420 };
// her legs, for a guest in the low chair: hidden behind the seat front, the shoes on the floor between the chair's front legs
function sitLegs(off) {
  const v = off.layout.visitor;
  S10.stand(v.x, 0, v.z + 8, () => {
    for (const side of [-1, 1]) {
      ctx.strokeStyle = LIMB; ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(side * 34, -(v.seat + 6)); ctx.lineTo(side * 38, -16); ctx.stroke();
      ctx.save(); ctx.translate(side * 38 + side * 8 + 6, -12); ctx.rotate(side * .06);
      ctx.fillStyle = '#ff8fb1'; ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.ellipse(0, 6, 28, 8.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = V2.grad(0, -14, 0, 12, [[0, '#f7f7fb'], [1, '#c8c8d8']]); ctx.beginPath(); ctx.ellipse(0, 0, 27.5, 14.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(-8, -6, 11, 3.8); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (const dx of [-8, 2, 12]) { ell(dx, -1, 2.5, 2.5); ctx.fill(); }
      ctx.restore();
    }
  });
}
const EXIT = {
  opts(lt) {
    const fl = 1 - .06 * Math.max(0, Math.sin(lt * 31)) * Math.max(0, Math.sin(lt * 7.3));
    return { night: true, t: lt + 7, blinds: .5, pens: 0, tower: [{}, {}, {}], lampOn: fl, lampGlow: exShot(lt).n.startsWith('cuA') ? .3 : .8, sun: 1, coatLate: true };
  },
  cast(lt) {
    const b = id => B(id), off = S10.office(EXIT.opts(lt));
    // ---- the Administrator
    const ad = off.admin({ look: [-.6, .1], expr: 'neutral', hold: {}, grip: {}, hand: {}, arms: { l: 'rest', r: 'rest' } });
    const clip = lt < 2.15;
    if (clip) { ad.hold.l = 'clipboard6'; ad.clipText = '27-B'; ad.arms.l = 'hold'; ad.grip.l = [lerp(-134, -190, sk(lt, 1.85, 2.15)), lerp(44, 10, sk(lt, 1.85, 2.15))]; ad.hand.l = 'grip'; ad.look = lt < 1.2 ? [-.2, .8] : [-.55, .2]; ad.expr = 'neutral'; }
    if (lt >= 1.2 && lt < 4.25) ad.expr = 'neutral';
    if (lt >= 4.25 && lt < 5.47) { ad.expr = 'neutral'; ad.look = [-.6, .1]; ad.browUp = 4; }
    if (lt >= 6.36 && lt < 8.4) { ad.expr = 'happy'; ad.look = [-.6, -.05]; ad.arms = { l: 'rest', r: 'rest' }; }
    if (lt >= 9.79 && lt < 11.2) { ad.expr = 'sour'; ad.look = [-.7, .1]; }
    if (lt >= 12.8 && lt < 13.76) { ad.expr = 'smug'; ad.look = [-.5, .5]; }
    if (lt >= 13.73 && lt < 15.7) { ad.expr = 'neutral'; ad.look = [-.7, 0]; ad.arms.l = [1.1, .5]; ad.hand.l = 'flat'; ad.browUp = 3; }
    if (lt >= 15.7 && lt < 17.4) { ad.expr = 'neutral'; ad.look = [-.5, .6]; }
    if (lt >= 17.35 && lt < 18.3) { ad.expr = 'angry'; ad.look = [-.8, 0]; ad.arms.l = [1.15, .35]; ad.hand.l = 'flat'; }
    if (lt >= 18.3 && lt < 19.27) { ad.expr = 'neutral'; ad.look = [-.8, 0]; ad.arms.l = [1.15, .35]; ad.hand.l = 'flat'; }
    if (lt >= 19.27 && lt < 20.3) { ad.expr = 'smug'; ad.look = [-.7, 0]; ad.arms = { l: [1.9, .8], r: [1.9, .8] }; ad.hand = { l: 'open', r: 'open' }; }
    if (lt >= 20.3 && lt < 21.7) { ad.expr = 'neutral'; ad.look = [-.8, 0]; ad.arms = { l: 'rest', r: 'rest' }; }
    if (lt >= 21.7) { ad.expr = lt < 22.25 ? 'neutral' : lt < 22.95 ? 'shock' : 'dead'; ad.look = lt < 22.25 ? [-.8, .3] : lerpA([-.8, .3], [-.9, .75], sk(lt, 22.25, 22.5)); ad.arms.l = lt < 22.9 ? [1.15, .35] : 'rest'; ad.hand.l = 'flat'; if (lt >= 22.9) ad.lid = .6; }
    // ---- Strawberry, seated in the low chair, the tote on her lap
    const sp = off.guest(straw, { look: [.8, -.1], expr: 'dead', lid: .45, hold: {}, grip: {}, hand: {}, arms: { l: 'rest', r: 'rest' }, id: 'straw', acc: ['steth', 'badge7', 'bandage7'] });
    if (lt < 16.9) { sp.hold.l = 'tote9'; sp.arms.l = 'hold'; sp.grip.l = [-86, 74]; sp.hand.l = 'grip'; sp.arms.r = 'hold'; sp.grip.r = [70, 80]; sp.hand.r = 'open'; }
    if (lt >= 3.4 && lt < 4.3) sp.lid = .35;
    if (lt >= 6.36 && lt < 8.7) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.7, .2]; }
    if (lt >= 8.66 && lt < 9.8) { sp.expr = 'smug'; sp.lid = .4; }
    if (lt >= 10.9 && lt < 12.9) { sp.expr = 'angry'; sp.lid = .25; sp.look = [.8, 0]; }
    if (lt >= 15.0 && lt < 16.9) { sp.expr = 'sad'; sp.lid = .3; sp.look = [0, .5]; }
    // the pen: out of the leaf at "Pen.", shown on "gift", held to her chest through the last line, then pushed across the desk
    const pt = sk(lt, 17.9, 18.15), pl = sk(lt, 18.25, 18.6);
    if (lt >= 17.85 && lt < 21.62) { sp.hold.r = 'pen9'; sp.arms.r = 'hold'; sp.hand.r = 'grip'; sp.grip.r = lt < 18.15 ? [lerp(70, 104, pt), lerp(-118, 6, pt)] : [lerp(104, 96, pl), lerp(6, 28, pl)]; sp.look = [.6, .1]; }
    if (lt >= 18.19 && lt < 19.27) { sp.expr = 'sad'; sp.lid = .3; }
    if (lt >= 20.24 && lt < 21.7) { sp.expr = 'sad'; sp.lid = .2; sp.look = [.3, .5]; }
    if (lt >= 21.62) { sp.expr = 'dead'; sp.lid = .55; sp.look = [.8, 0]; sp.arms = { l: 'rest', r: 'rest' }; }
    return { off, ad, sp };
  },
  cam(lt) {
    const sh = exShot(lt), n = sh.n, k = seg(lt, sh.t0, sh.t1), INS = ['q1', 'q2', 'q3', 'stamp', 'prop', 'slide'];
    let cam = BASE;
    if (n === 'open') cam = { f: 1400, cy: 420, hy: 900, cz: lerp(-600, -540, k) };
    else if (n.startsWith('cuA')) cam = { f: 1400, cy: 268, hy: 880, cz: -100 };
    else if (n.startsWith('cuS')) cam = { f: 1400, cy: 520, hy: 780, cz: -100 };
    else if (n === 'bin') cam = BIN_CAM;
    else if (n === 'end') cam = { f: 1400, cy: 420, hy: 900, cz: lerp(-540, -500, k) };
    V2.setCam(cam); CAM.shake = 0;
    if (INS.includes(n)) { zoomTo(540, 960, 1); return; }
    const C = EXIT.cast(lt), F = (o, z, up = 100, dx = 0) => { const [fx, fy] = faceC(o); zoomTo(fx + dx / z, fy + up / z, z); };
    switch (n) {
      case 'open': zoomTo(620, 900, 1.2); break;
      case 'cuA1': F(C.ad, lerp(1.6, 1.72, k), 120, 70); break;
      case 'cuA2': F(C.ad, lerp(1.75, 1.88, k), 120, 120); break;
      case 'cuA3': F(C.ad, lerp(1.7, 1.85, k), 120, 130); break;
      case 'cuS4': F(C.sp, lerp(1.65, 1.8, k), 150, 70); break;
      case 'cuA5': F(C.ad, lerp(1.55, 1.68, k), 110, 110); break;
      case 'cuS5': F(C.sp, lerp(1.6, 1.7, k), 160, 70); break;
      case 'cuA6': F(C.ad, lerp(1.8, 1.95, k), 120, 100); break;
      case 'cuS6': F(C.sp, lerp(1.7, 1.82, k), 150, 150); break;
      case 'cuA7': F(C.ad, lerp(1.7, 1.8, k), 120, 120); break;
      case 'cuS7': F(C.sp, lerp(1.75, 1.95, k), 140, 60); break;
      case 'bin': zoomTo(670, 1010, lerp(1.5, 1.62, k)); CAM.shake = lt >= 22.25 ? 6 * Math.exp(-(lt - 22.25) * 10) : 0; break;
      case 'cuA8': F(C.ad, lerp(1.6, 1.7, k), 120, 110); break;
      case 'end': zoomTo(620, 900, 1.15); break;
    }
  },
  draw(lt) {
    const sh = exShot(lt), n = sh.n;
    if (n === 'q1') { insForm(lt, FORM_Q.q1); return; }
    if (n === 'q2') { insForm(lt, FORM_Q.q2); return; }
    if (n === 'q3') { insForm(lt, FORM_Q.q3); return; }
    if (n === 'stamp') { insForm(lt, FORM_Q.all); return; }
    if (n === 'prop') { insProp(lt); return; }
    if (n === 'slide') { insSlide(lt); return; }
    const C = EXIT.cast(lt), off = C.off, A = n.startsWith('cuA'), S = n.startsWith('cuS');
    V2.opts.reflect = false;
    V2.dof(A || S ? 7 : n === 'bin' ? 6 : 0, () => { off.back(); off.sunFloor(); });
    off.setLight({ shadowLong: .45 });
    (S ? nbr : drawChar)(C.ad);
    if (!S && lt > .3 && lt < .8 && C.ad.hold.l) {   // the page he flips over the top of the clipboard (the paper rustle at 0.30)
      const o = C.ad, kd = KINDS[o.kind], g = o.grip.l, a = easeIO(seg(lt, .3, .62)) * PI, hx = o.x + (g[0] - 44) * o.s, hy = o.y - (o.lift || 0) - .9 * kd.ry * o.s + (g[1] - 126) * o.s;
      ctx.save(); ctx.translate(hx, hy); ctx.globalAlpha *= 1 - seg(lt, .62, .8); ctx.scale(1, Math.cos(a)); ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 3 * o.s; rr(-40 * o.s, 0, 80 * o.s, 104 * o.s, 4 * o.s); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(30,63,168,.5)'; for (let i = 0; i < 5; i++) ctx.fillRect(-30 * o.s, (14 + i * 14) * o.s, (60 - (i % 3) * 14) * o.s, 3 * o.s); ctx.restore();
    }
    if (S) V2.dof(6, () => off.desk()); else off.desk();
    EXIT.binPen(lt, C, 'behind');
    off.setLight({ shadowLong: .55 });
    off.visitor('back'); sitLegs(off);
    (A ? nbr : drawChar)(C.sp);
    off.visitor('front');
    off.coat();
    EXIT.binPen(lt, C, 'front');
    off.over();
  },
  // the pen's last trip, in the world: off the desk's left edge, into the wastebasket (it lands at 22.25, the sting), and stays there with the two other resignations
  binPen(lt, C, layer) {
    if (lt < 22.0 || layer !== 'front') return;
    const off = C.off, bin = off.layout.bin, d = off.layout.desk, T0 = 22.05, T1 = 22.25;
    const u = clamp((lt - T0) / (T1 - T0)), land = lt >= T1;
    const X = lerp(d.x0 - 8, bin.x + 6, u), Y = lerp(d.top + 4, bin.top + 8, u * u) + 40 * u * (1 - u) * 0, ang = land ? -.3 + .04 * Math.exp(-(lt - T1) * 9) * Math.sin((lt - T1) * 40) : lerp(-.1, 2.9, easeOut(u));
    const q = V2.p2(X, Y, bin.z), k = kz(bin.z), rim = V2.p2(bin.x, bin.top, bin.z)[1];
    ctx.save();
    if (land) { ctx.beginPath(); ctx.rect(q[0] - 400, rim - 600, 800, 600 + 14 * k); ctx.clip(); }
    ctx.translate(q[0], q[1] + (land ? 70 * k : 0)); ctx.scale(k, k); ctx.rotate(ang + (land ? Math.PI / 2 * 0 : 0));
    const L = 140;
    ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = 'round'; rr(-6, -L, 15, L, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#eef1f7'; rr(-6, -L, 15, 38, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8ced8'; rr(5, -L + 8, 5, 52, 2); ctx.fill();
    ctx.fillStyle = '#c0c6cf'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(9, 0); ctx.lineTo(1.5, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (land) { const kk = (lt - T1) / .5; if (kk > 0 && kk < 1) V2.ring(...V2.p2(bin.x + 6, bin.top + 6, bin.z), kk, { r0: 20, r1: 190 * k, lw: 7, color: '255,244,200', alpha: .95, bloom: .4 }); star(...V2.p2(bin.x + 8, bin.top + 150, bin.z), 40 * k * Math.exp(-(lt - T1) * 4), Math.exp(-(lt - T1) * 4), '255,248,214'); }
  },
  fx(lt) {
    const n = exShot(lt).n;
    return { bloom: .62, vignette: n === 'open' || n === 'end' ? .4 : .5, grain: .05, contrast: .14, sat: .08, tint: [['#9fb4ff', .14, 'soft-light']], aberr: 0, fade: Math.max(lt < .25 ? 1 - lt / .25 : 0, seg(lt, CUR.dur - .3, CUR.dur - .02)), fadeColor: '0,0,10' };
  },
  blur(lt) { if (near(lt, EX_HARD, .035)) return 1; const n = exShot(lt).n; return n === 'prop' ? 3 : 1; },
  over(lt) { },
};


/* EXIT_SCENE_HERE */
window.__EP10_SCENES = window.__EP10_SCENES || {};
window.__EP10_SCENES.office = OFFICE;
window.__EP10_SCENES.exit = EXIT;
})();
