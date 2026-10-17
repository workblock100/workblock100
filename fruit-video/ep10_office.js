'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice. Scene module: office (2:58 PM, THE ADMINISTRATOR'S OFFICE) and exit (10:30 PM, THE EXIT INTERVIEW).
 *
 * Both play in the Administrator's office (ep10_set.js, window.S10): he sits behind his desk at the right in his tall tufted chair, the low guest chair is at the left, the FY BUDGET chart hangs between them.
 * Every position is a world coordinate (X right, Z forward) through V2.at(X, Z); the desk, the chairs and the wall come from the set.
 *
 * office shot list (scene-local seconds)
 *   0.00  wide, a slow dolly: the Administrator eats a slice (the cheese stretches), THREE KNOCKS ring on the pocket door (0.32, 0.56, 0.80), the door slides open (1.15): Strawberry, backlit, a letter in her hand
 *   1.60  walk: medium, she comes in saying "I'm giving you my two weeks' notice"
 *   1.95  letter: top-down on the desk, the typed header and a handwriting reveal in sync with her words
 *   3.55  a1: close on the Administrator, guilty, one eye on the pen cup (the pen gleams)    4.55  her flat stare, then s2 with the chart behind her and the $118/HR slap on "eighteen"
 *   7.40  a2: dolly zoom, the blinds snap shut on "agency", red pulse and a thunder flash (under a second)    8.55  s3: low hero angle, sun stripes, a flare
 *   9.95  think: a thought bubble inflates with a pizza and gears (boing 10.29)    11.27  a3: the bubble pops, the first box slams down (steam)    12.18  s4: tight on her
 *   12.80 a4: the second box lands on the first    13.95 s5: "I want a raise", then a whip pan to the chart    15.05 a5: the empty wallet, the chart behind him
 *   16.55 s6: she points; the tower with its receipt, her glove in frame    18.30 a6: he gestures at the chart, the pizza pulses    19.95 s7: eyes close, one long exhale
 *   21.20 stamp: top-down, the giant stamp lands on the letter at 21.51 (RECEIVED, splatter, a paper flutter)    22.40 end: wide, she walks out (WAH WAH), a bite, then the still life: pizza string, stamp mark, pen cup */
(() => {
if (!window.TIMELINE_EP10) return;
const { person, zoomTo, faceZoom, drawBg, inB, faceC, localOf, pathDist } = window.H6;
const A7 = window.A7, A9 = window.A9, S10 = window.S10, { kz } = window.S6;
const straw = A7.straw;
const { p2 } = V2;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 ones)
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
// a big glove coming in from the edge of the picture, for the inserts (a copy of the Episode 9 one)
function glove(tx, ty, ang, sc, o = {}) {
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-44, 5);
  ctx.fillStyle = LIMB; ctx.beginPath(); ctx.roundRect(-230, -9, 232, 18, 8); ctx.fill();
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand(o.kind ?? 'point', 1, {});
  ctx.restore();
}
const goldLine = (x, y, w, h, r, lw = 5) => { ctx.strokeStyle = V2.grad(x, y, x + w, y + h, [[0, '#fff0a8'], [.35, '#c99a2e'], [.7, '#8a6414'], [1, '#e8c458']]); ctx.lineWidth = lw; rr(x, y, w, h, r); ctx.stroke(); };

// ------------------------------------------------------------------ props
Object.assign(PROP_BOX, { slice10: Object.assign([-66, -96, 66, 14], { nearFace: true }), env10: [-50, -64, 50, 10], wallet10: [-54, -64, 54, 44], clip10: [-30, -70, 30, 12] });
// a pizza slice held by the crust: cheese, pepperoni, and a strand of cheese that stretches from the tip to the mouth (the mouth is found from the body, so the strand follows however the hand moves)
EXT.prop.slice10 = (side, o, t) => {
  const key = side < 0 ? 'l' : 'r', g = (o.grip && o.grip[key]) || [120, 40], k = KINDS[o.kind], mouth = [-g[0], k.mouthY + 14 - g[1]];
  const ang = o.sliceAng ?? -2.45;   // the tip points up and toward the face
  ctx.save(); ctx.rotate(ang);
  ctx.fillStyle = '#c28a3e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.quadraticCurveTo(-14, 0, -6, 30); ctx.quadraticCurveTo(6, 36, 14, 30); ctx.lineTo(112, 0); ctx.lineTo(14, -30); ctx.quadraticCurveTo(6, -36, -6, -30); ctx.closePath(); ctx.fill(); ctx.stroke();   // crust and body
  ctx.fillStyle = V2.grad(14, 0, 112, 0, [[0, '#ffd85a'], [1, '#f2b640']]); ctx.beginPath(); ctx.moveTo(10, -26); ctx.lineTo(104, 0); ctx.lineTo(10, 26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,248,200,.55)'; ell(46, -6, 10, 4, .15); ctx.fill(); ell(70, 4, 7, 3, .1); ctx.fill();
  ctx.fillStyle = '#b3261e'; for (const [x, y] of [[34, -8], [52, 10], [66, -2], [82, 4]]) { ell(x, y, 8.4 - x * .03, 8.2 - x * .03); ctx.fill(); ctx.strokeStyle = 'rgba(80,10,6,.6)'; ctx.lineWidth = 1.4; ctx.stroke(); }
  ctx.restore();
  if ((o.cheese ?? 1) > 0) {   // the strand, from the tip to the mouth, sagging; it thins as it stretches
    const tip = [Math.cos(ang) * 112, Math.sin(ang) * 112], d = Math.hypot(mouth[0] - tip[0], mouth[1] - tip[1]), rest = 26, th = clamp(rest / Math.max(d, 1), .12, 1) * 7 + 1.6;
    if (d > 5) {
      const mx = (tip[0] + mouth[0]) / 2, my = (tip[1] + mouth[1]) / 2 + Math.min(70, d * .26 + 10) * (o.cheeseSag ?? 1);
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(70,40,10,.55)'; ctx.lineWidth = th + 2.4; ctx.beginPath(); ctx.moveTo(...tip); ctx.quadraticCurveTo(mx, my, ...mouth); ctx.stroke();
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = th; ctx.beginPath(); ctx.moveTo(...tip); ctx.quadraticCurveTo(mx, my, ...mouth); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1, th * .3); ctx.beginPath(); ctx.moveTo(tip[0] - 1, tip[1] - 1); ctx.quadraticCurveTo(mx - 1, my - 2, mouth[0] - 1, mouth[1] - 2); ctx.stroke(); ctx.restore();
    }
  }
};
// the resignation, held at the chest: a white envelope with a red seal
EXT.prop.env10 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .06 * -1 + .04 * Math.sin(t * 1.9));
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-46, -58, 92, 62, 5); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-46, -58); ctx.lineTo(0, -22); ctx.lineTo(46, -58); ctx.stroke();
  ctx.fillStyle = '#d6202e'; ell(0, -22, 9, 9); ctx.fill(); ctx.strokeStyle = 'rgba(80,0,10,.7)'; ctx.lineWidth = 2; ctx.stroke();
  text('NOTICE', 0, -4, { size: 11, fill: '#6a6488', weight: 900, spacing: 1 });
  ctx.restore();
};
// an open wallet with nothing in it but a loyalty card: SLICE CLUB, nine punches out of ten
EXT.prop.wallet10 = (side, o, t) => {
  const op = o.walletOpen ?? 1;
  ctx.save(); ctx.rotate(-.08);
  ctx.fillStyle = '#6a3e22'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-52 - 4 * op, -56, 58, 82, 6); ctx.fill(); ctx.stroke();   // the left leaf, in the hand
  ctx.save(); ctx.translate(6, -56); ctx.scale(Math.max(.05, op), 1); ctx.fillStyle = '#7a4a2a'; rr(0, 0, 50, 82, 6); ctx.fill(); ctx.stroke();   // the right leaf swings open
  if (op > .5) { ctx.fillStyle = '#2a1810'; rr(4, 6, 42, 24, 3); ctx.fill(); ctx.fillStyle = '#f6f2e6'; rr(5, 36, 40, 32, 3); ctx.fill(); ctx.fillStyle = '#d6202e'; ctx.fillRect(5, 36, 40, 7); for (let i = 0; i < 10; i++) { ctx.fillStyle = i < 9 ? '#3a2a1a' : 'rgba(0,0,0,.14)'; ell(11 + (i % 5) * 7.2, 52 + Math.floor(i / 5) * 9, 2.4, 2.4); ctx.fill(); } }
  ctx.restore();
  ctx.fillStyle = '#2a1810'; rr(-48 - 4 * op, -50, 46, 22, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(230,236,250,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-46 - 4 * op, -49); ctx.lineTo(-34 - 4 * op, -40); ctx.moveTo(-46 - 4 * op, -49); ctx.lineTo(-40 - 4 * op, -32); ctx.moveTo(-46 - 4 * op, -49); ctx.lineTo(-24 - 4 * op, -49); ctx.stroke();   // a cobweb in the bill slot
  ctx.restore();
};

// ------------------------------------------------------------------ the letter and the stamp (full frame, from above)
// handwriting: glyph by glyph, each with its own small tilt and wobble, up to the fraction p of the line's width; returns where the pen is
function hand(str, x, y, size, p, o = {}) {
  ctx.save(); ctx.font = `italic 800 ${size}px Nunito`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = o.color || '#1d3fa8';
  const ws = [...str].map(c => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0), shown = tot * p;
  let cx = x, pen = [x, y];
  for (let i = 0; i < str.length; i++) {
    if (cx - x >= shown) break;
    const w = ws[i], wob = Math.sin(i * 1.7 + (o.seed || 0)) * size * .035, rot = Math.sin(i * 2.3 + (o.seed || 0)) * .05, part = clamp((shown - (cx - x)) / w);
    ctx.save(); ctx.translate(cx, y + wob); ctx.rotate(rot);
    if (part < 1) { ctx.beginPath(); ctx.rect(-3, -size * 1.2, w * part + 3, size * 1.7); ctx.clip(); }
    ctx.fillText(str[i], 0, 0); ctx.restore();
    pen = [cx + w * part, y + wob - size * .2]; cx += w;
  }
  ctx.restore();
  return pen;
}
function deskTop() {
  ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#6a4630'], [1, '#3a2418']]); ctx.fillRect(-100, -100, W + 200, H + 200);
  ctx.strokeStyle = 'rgba(20,10,6,.28)'; ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = hash(i + 1) * W; ctx.beginPath(); ctx.moveTo(x, -20); ctx.bezierCurveTo(x + (hash(i + 5) - .5) * 60, 600, x + (hash(i + 9) - .5) * 60, 1300, x + (hash(i + 3) - .5) * 40, H + 20); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, 140, 0, 1380, [[0, '#2c5a46'], [1, '#1c3c2e']]); rr(70, 150, 940, 1190, 26); ctx.fill();
  goldLine(88, 168, 904, 1154, 18, 5); goldLine(100, 180, 880, 1130, 12, 1.6);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(70, 150, 940, 14);
}
// the letter on its desk. k0 is seconds since the insert began; prog says how much of each line is written (0 to 1)
const LETTER = { x: 214, y: 300, w: 652, h: 800 };
function paper(prog, o = {}) {
  const { x, y, w, h } = LETTER;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18; ctx.fillStyle = '#fffef8'; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = V2.grad(x, y, x, y + h, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(180,170,140,.18)']]); ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + h * .33); ctx.lineTo(x + w, y + h * .33); ctx.moveTo(x, y + h * .66); ctx.lineTo(x + w, y + h * .66); ctx.stroke();
  text('NOTICE OF RESIGNATION', x + w / 2, y + 62, { size: 40, fill: '#20202c', weight: 900, spacing: 3, maxW: w - 60 });
  text('FRUIT BOWL REHAB & NURSING  /  FORM 14-B', x + w / 2, y + 100, { size: 17, fill: '#8a90a4', weight: 800, spacing: 2, maxW: w - 60 });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x + 40, y + 124); ctx.lineTo(x + w - 40, y + 124); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,110,190,.22)'; ctx.lineWidth = 1.6; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + 36, y + 214 + i * 78); ctx.lineTo(x + w - 36, y + 214 + i * 78); ctx.stroke(); }
  let pen = null;
  const L = [['Dear Administrator,', 214, 40, prog[0] ?? 0], ["I am giving my two weeks' notice.", 292, 36, prog[1] ?? 0], ['Effective in 14 days.', 370, 38, prog[2] ?? 0], ['Reason: see $118.', 448, 40, prog[3] ?? 0], ['Sincerely,', 600, 40, prog[4] ?? 0]];
  L.forEach(([s, yy, sz, p], i) => { if (p > 0) { const q = hand(s, x + 44, y + yy, sz, p, { seed: i * 3 }); if (p < 1) pen = q; } });
  if ((prog[3] ?? 0) >= 1 && (o.circle ?? 0) > 0) { ctx.strokeStyle = '#d6202e'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); const cx = x + 44 + 296, cy = y + 440, a1 = o.circle * TAU * 1.05; for (let a = 0; a <= a1; a += .12) { const r = 1 + .05 * Math.sin(a * 2); a ? ctx.lineTo(cx + Math.cos(a - 1.2) * 76 * r, cy + Math.sin(a - 1.2) * 32 * r) : ctx.moveTo(cx + Math.cos(a - 1.2) * 76 * r, cy + Math.sin(a - 1.2) * 32 * r); } ctx.stroke(); }
  // the signature: one long loop
  const sg = prog[5] ?? 0;
  if (sg > 0) {
    ctx.save(); ctx.strokeStyle = '#1d3fa8'; ctx.lineWidth = 5.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([2000, 2000]); ctx.lineDashOffset = 2000 * (1 - sg) * .62;
    ctx.beginPath(); ctx.moveTo(x + 60, y + 700); ctx.bezierCurveTo(x + 90, y + 640, x + 130, y + 700, x + 150, y + 664); ctx.bezierCurveTo(x + 170, y + 630, x + 190, y + 700, x + 230, y + 676); ctx.bezierCurveTo(x + 270, y + 650, x + 270, y + 712, x + 316, y + 684); ctx.bezierCurveTo(x + 360, y + 660, x + 360, y + 716, x + 410, y + 686); ctx.bezierCurveTo(x + 450, y + 664, x + 470, y + 700, x + 520, y + 676); ctx.bezierCurveTo(x + 440, y + 724, x + 300, y + 740, x + 80, y + 732); ctx.stroke(); ctx.restore();
    if (sg < 1) pen = [x + lerp(60, 520, sg), y + 690];
  }
  ctx.restore();
  return pen;
}
function insLetter(lt) {
  const t0 = 1.95, k = lt - t0, wTwo = wordT('s1', 'two', 2.38), wNotice = wordT('s1', 'notice', 2.82), end = wNotice + .45;
  deskTop();
  // the paper slides in and settles; the pen is a glove coming from below right
  const slide = eo(lt, t0, t0 + .22), py = lerp(120, 0, slide), tilt = lerp(.05, -.012, slide);
  const prog = [seg(lt, t0 + .12, t0 + .3), seg(lt, t0 + .3, wTwo - .1) * .46 + seg(lt, wTwo - .1, wNotice) * .3 + seg(lt, wNotice, end - .1) * .24, seg(lt, end - .08, end + .18), 0, 0, 0];
  ctx.save(); ctx.translate(540, 700 + py); ctx.rotate(tilt); ctx.translate(-540, -700);
  const pen = paper(prog);
  ctx.restore();
  const pp = pen ? [pen[0], pen[1] + py] : [LETTER.x + 540, LETTER.y + 150];
  const hover = Math.sin(k * 30) * 3;
  ctx.save(); ctx.translate(pp[0] + hover, pp[1]);
  ctx.save(); ctx.rotate(-2.15); ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-4, -10, 150, 20, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#eef1f7'; rr(88, -10, 40, 20, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c0c6cf'; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-24, 0); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill(); ctx.restore();
  glove(160, 150, -2.15 + .1, 3.4, { kind: 'grip' });
  ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, 0, 0, 0); ctx.restore();
}
// the stamp: a big wooden knob comes down out of the camera onto the letter. impact is the scene-local time it lands
function insStamp(lt, impact) {
  const k = lt - impact, down = easeIn(seg(lt, impact - .3, impact)), lift = easeOut(seg(lt, impact + .22, impact + .62));
  deskTop();
  const flut = k >= 0 ? Math.exp(-k * 9) * Math.sin(k * 44) : 0, jump = k >= 0 ? 16 * Math.exp(-k * 14) : 0;
  ctx.save(); ctx.translate(540, 700); ctx.rotate(-.012 + flut * .012); ctx.translate(-540, -700 - jump);
  paper([1, 1, 1, 1, 1, 1], { circle: 1 });
  if (k >= 0) {   // the imprint: double-ruled box, RECEIVED, uneven ink
    const a = clamp(k * 12);
    ctx.save(); ctx.translate(540, 770); ctx.rotate(-.17); ctx.globalAlpha *= .92 * a; ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = '#d6202e'; ctx.lineWidth = 12; rr(-290, -96, 580, 192, 14); ctx.stroke(); ctx.lineWidth = 4; rr(-268, -76, 536, 152, 8); ctx.stroke();
    text('RECEIVED', 0, 4, { size: 134, font: 'Bangers', weight: 400, fill: '#d6202e', spacing: 5, maxW: 520 });
    text('FRUIT BOWL REHAB  2:58 PM', 0, 74, { size: 22, fill: '#d6202e', weight: 900, spacing: 3 });
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,254,248,.55)'; for (let i = 0; i < 90; i++) { ell((hash(i + 3) - .5) * 560, (hash(i + 77) - .5) * 180, 1.4 + hash(i + 9) * 2.6, 1.2 + hash(i + 11) * 1.8); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
  // ink splatter: dots thrown out from the box at the moment of impact
  if (k >= 0) { const u = easeOut(seg(k, 0, .28)), a = clamp(1 - seg(k, .6, 1.1) * .0); ctx.save(); ctx.fillStyle = '#d6202e'; for (let i = 0; i < 34; i++) { const an = hash(i + 4) * TAU, d = (200 + hash(i + 19) * 320) * u, r = (3 + hash(i + 8) * 10) * (.5 + .5 * u); ctx.globalAlpha = a * (.5 + .5 * hash(i + 2)); ell(540 + Math.cos(an) * d * 1.15, 770 + Math.sin(an) * d * .8 - jump, r, r * (.7 + .3 * hash(i))); ctx.fill(); } ctx.restore(); }
  // the stamp itself, from above: it grows as it nears the camera
  const sc = down < 1 ? lerp(2.5, 1, down) : lerp(1, 2.2, lift), al = lift >= 1 ? 0 : 1;
  if (al > 0) {
    ctx.save(); ctx.translate(540, 770 - jump * .5); ctx.rotate(-.17 + (1 - down) * .05); ctx.scale(sc, sc); ctx.globalAlpha *= 1 - seg(lift, .6, 1);
    ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.filter = 'blur(' + (1 + (1 - down) * 14) + 'px)'; rr(-282, -82 + 30 * (1 - down) + 10, 584, 184, 14); ctx.fill(); ctx.filter = 'none';
    ctx.fillStyle = '#2a1a12'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(-286, -96, 572, 192, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = V2.grad(0, -96, 0, 96, [[0, '#4a3022'], [1, '#2a1a12']]); rr(-270, -82, 540, 164, 10); ctx.fill();
    ctx.fillStyle = V2.radial(-40, -50, 20, 190, [[0, '#9a6a44'], [.55, '#6a4630'], [1, '#34200f']]); ell(0, 0, 150, 150); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,190,.25)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 118, 3.6, 5.2); ctx.stroke();
    ctx.fillStyle = V2.grad(-60, -60, 60, 60, [[0, '#f4d878'], [1, '#8a6414']]); ell(0, 0, 54, 54); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-18, -22, 18, 8, -.6); ctx.fill();
    ctx.restore();
  }
}

// ------------------------------------------------------------------ blocking
const ADMIN = { x: 330, z: 1560 };
const SPOT = [-300, 1040];   // where she stands to quit
const T_KNOCK = [.32, .56, .80], T_DOOR = 1.15, T_WALK = 1.36;
const T_BOX1 = 11.46, T_BOX2 = 13.18, T_STAMP = 21.51;
const strawPath = route([[0, -640, 1708], [T_WALK, -640, 1708], [3.45, SPOT[0], SPOT[1], 'io'], [22.34, SPOT[0], SPOT[1]], [23.76, -470, 1500, 'io']]);
const SHOTS = lt => {
  const b = id => B(id);
  return [['wide', 1.6], ['walk', 1.95], ['letter', b('a1').s - .02], ['cuA', 4.55], ['cuS', 7.4], ['cuA2', b('s3').s - .1], ['hero', 9.95], ['think', b('a3').s + .0], ['slam', b('s4').s - .05], ['cuS4', b('a4').s - .07], ['two', b('s5').s - .0], ['cuS5', 14.78],
    ['whip', 15.1], ['cuA5', b('s6').s - .05], ['cuS6', 17.2], ['tower', b('a6').s - .07], ['cuA6', b('s7').s - .07], ['cuS7', b('stamp').s - .06], ['stamp', b('end').s - .01], ['end', 22.95], ['still', 1e9]];
};
const shotOf = lt => { let t0 = 0; for (const [n, e] of SHOTS(lt)) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'still', t0, t1: CUR.dur }; };
const CRISP = { cuA: ['ad'], cuA2: ['ad'], cuA5: ['ad'], cuA6: ['ad'], think: ['ad'], cuS: ['sp'], cuS4: ['sp'], cuS5: ['sp'], cuS6: ['sp'], cuS7: ['sp'], hero: ['sp'] };
const ALLC = ['ad', 'sp'];

// ------------------------------------------------------------------ the office scene
const OFFICE = {
  opts(lt) {
    const a2 = B('a2'), s3 = B('s3'), snap = wordT('a2', 'agency', 7.83) - .03, ch = SCENES_OFFICE.pulse(lt);
    let blinds = .45;
    if (lt >= snap && lt < s3.s - .1) blinds = lerp(.45, 1, easeOut(seg(lt, snap, snap + .1)));
    else if (lt >= s3.s - .1) blinds = lerp(1, .3, easeBack(seg(lt, s3.s - .1, s3.s + .2)));
    const boxes = [T_BOX1, T_BOX2].map(t0 => { if (lt < t0 - .24) return null; const u = clamp((lt - (t0 - .24)) / .24), k = lt - t0; return { y: lt < t0 ? 900 * (1 - easeIn(u)) ** 2 * 0 + 820 * (1 - u) * (1 - u) : 0, sq: lt >= t0 ? clamp(.55 * Math.exp(-k * 11) * Math.cos(k * 34), -.2, .6) : 0 }; }).filter(Boolean);
    const steam = Math.max(seg(lt, T_BOX1 + .02, T_BOX1 + .3) * (1 - seg(lt, T_BOX1 + 1.2, T_BOX1 + 3)), seg(lt, T_BOX2 + .02, T_BOX2 + .3)) * (lt < B('a5').s ? 1 : .55);
    return { night: false, t: lt + 3, blinds, door: sk(lt, T_DOOR, T_DOOR + .5), chartPulse: ch, tower: boxes, steamK: lt >= T_BOX1 ? steam : 0, penGlint: SCENES_OFFICE.glint(lt), sun: 1 };
  },
  pulse(lt) { const a6 = B('a6'), ts = [wordT('a6', 'pizza', a6.s + .46) - .02, wordT('a6', 'budget', a6.s + .73) - .02, T_BOX1 + .0]; let v = 0; for (const t0 of ts.slice(0, 2)) { const k = lt - t0; if (k > 0 && k < 1) v = Math.max(v, Math.exp(-k * 4) * (.5 + .5 * Math.cos(k * 17))); } return v; },
  glint(lt) { const a1 = B('a1'), w = wordT('a1', 'pen', a1.s + .82); return Math.max(.0, Math.exp(-Math.abs(lt - w - .1) * 4)) * .9 + .16 * (.5 + .5 * Math.sin(lt * 3)); },
  cast(lt) {
    const b = id => B(id), off = S10.office(OFFICE.opts(lt)), sh = shotOf(lt).n, walking = lt > T_WALK && lt < 3.5;
    const sp0 = strawPath(lt);
    // ---- the Administrator, seated: the slice, the cheese, the guilty eye, the wallet, the gesture at the chart
    const eating = lt < T_DOOR + .9, chew = eating && lt < T_KNOCK[0] ? .5 * Math.abs(Math.sin(lt * 10)) : 0;
    const ad = off.admin({ look: [0, 0], expr: 'happy', hold: {}, grip: {}, hand: {}, arms: { l: 'rest', r: 'rest' } });
    // knocks: he freezes, looks up, the slice stays where it was
    if (lt < T_DOOR + 1.0) { ad.hold.r = 'slice10'; ad.grip.r = [136, 6 - 30 * sk(lt, T_KNOCK[2], T_DOOR)]; ad.arms.r = 'hold'; ad.hand.r = 'grip'; ad.look = lt < T_KNOCK[0] ? [0, .55] : lerpA([0, .55], [-.85, -.1], sk(lt, T_KNOCK[0], T_KNOCK[0] + .12)); ad.mouthOpen = chew; ad.expr = lt < T_KNOCK[0] ? 'happy' : 'shock'; ad.sliceAng = -2.5 + .5 * sk(lt, T_KNOCK[0], T_KNOCK[0] + .1); }
    else if (lt < b('a1').s) { ad.look = [-.8, .1]; ad.expr = 'neutral'; ad.hold.r = 'slice10'; ad.grip.r = [156, 40]; ad.arms.r = 'hold'; ad.hand.r = 'grip'; ad.sliceAng = -1.2; ad.cheese = .7; }
    // a1: guilty, eyes on the pen cup
    if (lt >= b('a1').s && lt < b('s2').s - .2) { ad.expr = 'sour'; ad.look = [-.7, .8]; ad.hold.r = 'slice10'; ad.grip.r = [160, 54]; ad.arms.r = 'hold'; ad.hand.r = 'grip'; ad.sliceAng = -1.15; ad.cheese = 0; }
    if (lt >= b('s2').s - .2 && lt < b('a2').s - .05) { ad.expr = lt >= wordT('s2', 'eighteen', 6) ? 'shock' : 'neutral'; ad.look = [-.8, .05]; }
    // a2: the recoil
    const rc = seg(lt, wordT('a2', 'agency', 7.83) - .04, wordT('a2', 'agency', 7.83) + .12) * (1 - seg(lt, 8.35, 8.62));
    if (lt >= b('a2').s - .05 && lt < b('s3').s) { ad.expr = lt >= wordT('a2', 'agency', 7.83) - .04 ? 'panic' : 'shock'; ad.look = [-.5, -.2]; ad.sx = 1 - .16 * rc; ad.sy = 1 + .22 * rc; ad.rot = -.08 * rc; ad.arms = { l: 'up', r: 'up' }; ad.shake = 5 * rc; }
    if (lt >= b('s3').s && lt < b('think').s) { ad.expr = 'sour'; ad.look = [-.8, 0]; }
    // think: straining, eyes up
    if (lt >= b('think').s - .05 && lt < b('a3').s) { ad.expr = 'sour'; ad.look = [.3, -.9]; ad.lid = .25; ad.browUp = 8 * sk(lt, b('think').s, b('think').s + .3); ad.arms = { l: 'hips', r: [2.4, .6] }; ad.hand = { r: 'point' }; ad.shake = 1.5 * seg(lt, b('think').s + .2, b('think').e); }
    if (lt >= b('a3').s && lt < b('s4').s) { ad.expr = 'happy'; ad.look = [-.6, -.2]; ad.arms = { l: 'hips', r: [2.3, .5] }; ad.hand = { r: 'point' }; }
    if (lt >= b('s4').s && lt < b('a4').s) { ad.expr = 'sour'; ad.look = [-.8, 0]; ad.arms = { l: 'hips', r: 'rest' }; }
    if (lt >= b('a4').s && lt < b('s5').s) { ad.expr = 'happy'; ad.look = [-.6, -.1]; ad.arms = { l: 'hips', r: [2.1, .7] }; ad.hand = { r: 'thumb' }; }
    if (lt >= b('s5').s && lt < b('a5').s) { ad.expr = 'neutral'; ad.look = [-.8, 0]; ad.arms = { l: 'rest', r: 'rest' }; }
    // a5: the empty wallet
    if (lt >= b('a5').s && lt < b('s6').s) { const k = sk(lt, b('a5').s - .08, b('a5').s + .25); ad.expr = 'sour'; ad.look = [-.5, .5]; ad.hold.r = 'wallet10'; ad.walletOpen = sk(lt, b('a5').s + .12, b('a5').s + .36); ad.grip.r = [lerp(120, 150, k), lerp(70, 20, k)]; ad.arms.r = 'hold'; ad.hand.r = 'grip'; ad.arms.l = 'shrug'; }
    if (lt >= b('s6').s && lt < b('a6').s) { ad.expr = 'sour'; ad.look = [-.8, .1]; }
    // a6: he gestures at the chart
    if (lt >= b('a6').s && lt < b('s7').s) { const k = sk(lt, b('a6').s - .06, b('a6').s + .2), pc = off.at.chart(); ad.expr = 'smug'; ad.look = [-.9, -.2]; ad.arms = { l: 'hold', r: 'hips' }; handTo(ad, -1, pc[0], pc[1] + 90, k, [-120, 60]); ad.hand = { l: 'point' }; }
    if (lt >= b('s7').s && lt < b('end').s) { ad.expr = 'smug'; ad.look = [-.7, .2]; ad.arms = { l: 'rest', r: 'rest' }; }
    // the end: a bite
    const bite = seg(lt, b('end').s + .35, b('end').s + .6) * (1 - seg(lt, b('end').s + .9, b('end').s + 1.2));
    if (lt >= b('end').s) { ad.expr = 'happy'; ad.look = [0, .4]; ad.hold.r = 'slice10'; ad.arms.r = 'hold'; ad.hand.r = 'grip'; ad.grip.r = [lerp(160, 60, bite), lerp(52, 6, bite)]; ad.sliceAng = lerp(-1.2, -2.5, bite); ad.mouthOpen = .55 * bite; ad.cheese = 1; ad.cheeseSag = 1.4; }
    // ---- Strawberry
    const dist = pathDist(strawPath, lt), sw = [.28 + .35 * Math.sin(dist / 84 * PI), .25];
    const out = lt >= B('end').s + .05;
    const door = lt < T_WALK + .6;
    const sp = person(straw, strawPath, lt, { stride: 40, acc: out ? [] : ['steth', 'badge7', 'bandage7'], look: [.7, .05], expr: 'neutral', lid: .3, arms: { l: walking ? sw : 'rest', r: 'rest' }, id: 'straw', transit: lt < T_DOOR + .6 });
    if (lt < 3.5) { sp.hold = { r: 'env10' }; sp.grip = { r: [112, 24] }; sp.arms.r = 'hold'; sp.hand = { r: 'grip' }; sp.arms.l = walking ? sw : 'rest'; }
    if (lt < T_WALK) sp.look = [0, 0];
    if (lt >= b('a1').s) { sp.look = [.8, .1]; sp.expr = 'dead'; sp.lid = .5; }
    if (lt >= b('s2').s && lt < b('a2').s) { sp.expr = 'dead'; sp.lid = .45; }
    if (lt >= b('a2').s && lt < b('s3').s) { sp.expr = 'dead'; sp.lid = .55; sp.look = [.8, 0]; }
    if (lt >= b('s3').s && lt < b('think').s) { sp.expr = 'smug'; sp.lid = .35; sp.look = [.7, -.1]; }
    if (lt >= b('think').s && lt < b('s4').s) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.8, -.05]; }
    if (lt >= b('s4').s && lt < b('s5').s) { sp.expr = 'angry'; sp.lid = .2; sp.look = [.8, 0]; }
    if (lt >= b('s5').s && lt < b('a5').s) { sp.expr = 'hopeful'; sp.lid = undefined; sp.look = [.7, 0]; sp.arms.l = 'hold'; sp.grip = { l: [-96, 18] }; sp.hand = { l: 'open' }; }
    if (lt >= b('a5').s && lt < b('s6').s) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.8, .1]; }
    if (lt >= b('s6').s && lt < b('a6').s) { sp.expr = 'angry'; sp.lid = .25; sp.look = [.9, .1]; sp.arms.r = 'point'; sp.hand = { r: 'point' }; }
    if (lt >= b('a6').s && lt < b('s7').s) { sp.expr = 'dead'; sp.lid = .55; sp.look = [.8, 0]; }
    if (lt >= b('s7').s && lt < b('stamp').s) { const cl = sk(lt, b('s7').s + .15, b('s7').s + .4); sp.expr = 'dead'; sp.lid = lerp(.55, 1, cl); sp.look = [.5, .2]; }
    if (lt >= b('stamp').s && lt < b('end').s) { sp.expr = 'dead'; sp.lid = .6; }
    if (out) { sp.noFace = true; sp.look = [0, 0]; sp.arms = { l: sw, r: [.28 - .35 * Math.sin(dist / 84 * PI), .25] }; sp.hold = {}; sp.grip = undefined; sp.hand = undefined; sp.transit = true; }
    return { off, ad, sp };
  },
  shot: lt => shotOf(lt).n,
  cam(lt) {
    const sh = shotOf(lt), C = OFFICE.cast(lt), k = seg(lt, sh.t0, sh.t1), b = id => B(id), F = (o, z, up = 100) => faceZoom({ kind: o.kind, x: o.x, y: o.y, s: o.s, lift: o.lift, noLegs: o.noLegs }, z, up);
    const base = { f: 1400, cy: 400, hy: 860, cz: -100 };
    V2.setCam(base);
    switch (sh.n) {
      case 'wide': V2.setCam(Object.assign({}, base, { cy: 420, hy: 900, cz: lerp(-640, -560, sk(lt, 0, 1.6)) })); zoomTo(540, 1050, 1.1); break;
      case 'walk': V2.setCam(Object.assign({}, base, { cz: -260 })); { const o = C.sp; zoomTo(o.x + 80, o.y - 170 * o.s, lerp(1.1, 1.18, k)); } break;
      case 'letter': case 'stamp': zoomTo(540, 960, 1); break;
      case 'cuA': F(C.ad, lerp(1.7, 1.82, k), 130); break;
      case 'cuS': { const o = C.sp; const c = C.off.at.chart(); zoomTo(lerp(o.x + 150, o.x + 130, k), o.y - 215 * o.s, lerp(1.32, 1.44, k)); void c; } break;
      case 'cuA2': { V2.setCam(Object.assign({}, base, dollyZ(lt, base))); F(C.ad, 1.75 + .05 * k, 120); CAM.shake = 4 * Math.max(0, 1 - Math.abs(lt - (wordT('a2', 'agency', 7.83) + .08)) * 6); } break;
      case 'hero': V2.setCam(Object.assign({}, base, { cy: 150, hy: 1010, cz: -300 })); { const o = C.sp; F(o, lerp(1.45, 1.55, k), 140); } break;
      case 'think': F(C.ad, lerp(1.45, 1.6, k), 90); break;
      case 'slam': zoomTo(lerp(660, 640, k), 1010, 1.2); { const sx = Math.max(0, T_BOX1 - lt); } CAM.shake = 7 * Math.exp(-(lt - T_BOX1) * 9) * (lt >= T_BOX1 ? 1 : 0); break;
      case 'cuS4': F(C.sp, lerp(1.9, 2.0, k), 120); break;
      case 'two': zoomTo(lerp(600, 620, k), 1010, 1.18); CAM.shake = 7 * Math.exp(-(lt - T_BOX2) * 9) * (lt >= T_BOX2 ? 1 : 0); break;
      case 'cuS5': { const o = C.sp; zoomTo(o.x + 130, o.y - 215 * o.s, lerp(1.34, 1.42, k)); } break;
      case 'whip': { const o = C.sp, a = [o.x + 130, o.y - 215 * o.s], c = C.off.at.chart(), e = easeIO(k); zoomTo(lerp(a[0], c[0] + 100, e), lerp(a[1], c[1] + 140, e), lerp(1.4, 1.3, e)); } break;
      case 'cuA5': { const c = C.off.at.chart(); const o = C.ad; zoomTo(lerp(c[0] + 220, o.x - 120, easeIO(seg(lt, b('a5').s - .05, b('a5').s + .6))), o.y - 190 * o.s, 1.42); } break;
      case 'cuS6': { const o = C.sp; zoomTo(o.x + 120, o.y - 210 * o.s, lerp(1.34, 1.4, k)); } break;
      case 'tower': { const t = C.off.at.towerTop(2); zoomTo(t[0] - 40, t[1] + 20, lerp(2.3, 2.45, k)); } break;
      case 'cuA6': { const c = C.off.at.chart(), o = C.ad; zoomTo((c[0] + o.x) / 2 + 40, o.y - 170 * o.s, lerp(1.1, 1.2, k)); } break;
      case 'cuS7': F(C.sp, lerp(1.85, 2.15, k), 110); break;
      case 'end': V2.setCam(Object.assign({}, base, { cy: 420, hy: 900, cz: -600 })); zoomTo(540, 1050, 1.1); break;
      case 'still': { V2.setCam(Object.assign({}, base, { cy: 620, hy: 940, cz: -60 })); const p = C.off.at.pen(), t = C.off.at.towerTop(2); zoomTo(lerp(p[0] + 160, p[0] + 190, k), lerp(p[1] - 110, p[1] - 130, k), lerp(1.5, 1.6, k)); void t; } break;
    }
  },
  draw(lt) {
    const sh = shotOf(lt), n = sh.n;
    if (n === 'letter') { insLetter(lt); return; }
    if (n === 'stamp') { insStamp(lt, T_STAMP); return; }
    const C = OFFICE.cast(lt), off = C.off, crisp = CRISP[n] || ALLC, subjS = crisp.length === 1 && crisp[0] === 'sp', subjA = crisp.length === 1 && crisp[0] === 'ad';
    const door = off.layout.door, hallA = lt < T_WALK + .5 ? 1 : 0;
    // light: a day look; Strawberry is backlit by the hall while she stands in the doorway; the horror beat reddens it
    const sil = lt >= T_DOOR && lt < T_WALK + .5 ? 1 - seg(lt, T_WALK, T_WALK + .5) : 0, hz = OFFICE.horror(lt);
    const lightFor = who => off.setLight(who === 'sp' && sil > 0 ? { back: { color: '255,240,200', a: .85 * sil, w: 22 }, frontDark: .4 * sil, shadowLong: .9 * sil } : who === 'ad' && n === 'cuA2' ? { rim: '#ff5a50', rimA: .6, keyColor: '#ffb0a0' } : {});
    V2.opts.reflect = false;
    const blurBack = { cuA: 8, cuA2: 8, cuS: 8, hero: 8, think: 7, cuS4: 9, cuS5: 8, cuA5: 7, cuS6: 8, cuA6: 5, cuS7: 9 }[n] || 0;
    V2.dof(blurBack, () => { off.back(); off.sunFloor(); });
    // the Administrator, then the desk, then the guest side
    lightFor('ad');
    (subjS ? nbr : drawChar)(C.ad);
    if (subjS) V2.dof(7, () => off.desk()); else off.desk();
    SCENES_OFFICE.deskExtras(lt, off);
    lightFor('sp');
    off.visitor();
    (subjA && n !== 'cuA6' ? nbr : drawChar)(C.sp);
    OFFICE.fxWorld(lt, C, off);
    off.over();
  },
  horror(lt) { const t0 = wordT('a2', 'agency', 7.83) - .04; return seg(lt, t0, t0 + .06) * (1 - seg(lt, t0 + .2, t0 + .85)); },
  fxWorld(lt, C, off) {
    // the thought bubble: it inflates over the Administrator's head on the boing, with a pizza and two gears; it pops on "Pizza."
    const th = B('think'), t0 = th.s + .12, tp = B('a3').s + .16;
    if (lt >= t0 && lt < tp + .35) {
      const o = C.ad, x = o.x + 150 * o.s, y = o.y - 560 * o.s, S = o.s * 1.0, kk = lt < tp ? easeElastic(seg(lt, t0, t0 + .5)) : 0, pop = seg(lt, tp, tp + .3);
      if (kk > 0.01) bubble(x, y, S * kk * (1 + .04 * Math.sin(lt * 9)), lt - t0, o);
      if (pop > 0) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + .3, d = (60 + 200 * hash(i + 3)) * S * easeOut(pop); ctx.save(); ctx.globalAlpha = 1 - pop; ctx.fillStyle = i % 3 ? '#ffffff' : '#ffe135'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(x + Math.cos(a) * d, y + Math.sin(a) * d * .8, (14 - 9 * pop) * S, (14 - 9 * pop) * S); ctx.fill(); ctx.stroke(); ctx.restore(); }
      if (pop > 0 && pop < .7) { ctx.save(); ctx.globalAlpha = 1 - pop / .7; ctx.strokeStyle = '#ffe135'; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r0 = 150 * S * (.6 + pop), r1 = r0 + 60 * S; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .8); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * .8); ctx.stroke(); } ctx.restore(); }
    }
    // the knock marks on the door: three rings that pop on the wood
    { const [dx, dy] = off.at.door(), kd = kz(off.layout.zb); for (let i = 0; i < 3; i++) { const k = (lt - T_KNOCK[i]) / .5; if (k > 0 && k < 1) { V2.ring(dx + 30 * kd, dy - 20 * kd, k, { r0: 14, r1: 150 * kd + 40, lw: 9, color: '255,244,200', alpha: .95, bloom: .3 }); V2.ring(dx + 30 * kd, dy - 20 * kd, k * .8, { r0: 8, r1: 90 * kd + 20, lw: 5, color: '255,255,255', alpha: .8, bloom: 0 }); } } }
    // the horror beat: a flash and a red pulse in the frame (the grade carries the rest)
  },
  fx(lt) {
    const hz = OFFICE.horror(lt), t0 = wordT('a2', 'agency', 7.83) - .04, flash = lt >= t0 && lt < t0 + .09 ? 1 - (lt - t0) / .09 : 0, k = shotOf(lt).n;
    return { bloom: .55 + .3 * flash, vignette: .42 + .22 * hz, grain: .045, contrast: .14, sat: .12 - .1 * hz, tint: [['#ffe9b8', .1, 'soft-light'], ...(hz > 0 ? [['#ff1a30', .55 * hz, 'soft-light']] : [])], aberr: hz > .1 ? 7 * hz : 0,
      fade: Math.max(lt < .25 ? 1 - lt / .25 : 0, flash * .55, seg(lt, CUR.dur - .25, CUR.dur - .02)), fadeColor: flash > 0 ? '255,255,255' : '0,0,10' };
  },
  blur: lt => { const n = shotOf(lt).n; return n === 'whip' ? 8 : n === 'cuA2' ? 3 : (lt > T_WALK && lt < 3.6) ? 2 : (n === 'stamp' && lt > T_STAMP - .06 && lt < T_STAMP + .25) ? 3 : n === 'slam' || n === 'two' ? 2 : 1; },
  over(lt) {
    // $118/HR lands on "eighteen"
    const t1 = wordT('s2', 'eighteen', 6.0) - .02, k = (lt - t1);
    if (k > 0 && k < 1.5) {
      const e = easeOut(seg(k, 0, .14)), f = 1 - seg(k, 1.15, 1.5), sc = lerp(2.2, 1, e);
      ctx.save(); ctx.globalAlpha *= f; ctx.translate(676, 470); ctx.rotate(-.07); ctx.scale(sc, sc);
      text('$118/HR', 0, 0, { size: 150, font: 'Bangers', weight: 400, fill: '#ffe135', lw: 20, stroke: '#150f22', spacing: 3, shadow: 18 });
      ctx.restore();
    }
    sfxWord(lt, B('end').s + .1, 'WAH WAH', 540, 330, { fill: '#cfe9ff', size: 78, rot: -.04, hold: .75 });
  },
};
const SCENES_OFFICE = {
  glint: lt => OFFICE.glint(lt), pulse: lt => OFFICE.pulse(lt),
  // anything that sits on the desk and belongs to this scene: the letter before the stamp, the receipt on the tower
  deskExtras(lt, off) {
    const d = off.layout.desk;
    if (lt >= T_BOX2 - .1) { const tz = d.z0 + 96 - 104, tx = d.x0 + 412 - 40; S10.stand(tx, d.top + 52, tz, () => receipt(lt)); }
  },
};
// the receipt on the tower: a strip of thermal paper hanging off the top box
function receipt(lt) {
  const w = 74, h = 150, sway = Math.sin(lt * 2.1) * .03;
  ctx.save(); ctx.rotate(sway);
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2, h);
  for (let i = 0; i < 8; i++) ctx.lineTo(w / 2 - (i + .5) * w / 8, h - (i % 2 ? 0 : 7)); ctx.lineTo(-w / 2, h); ctx.closePath(); ctx.fill(); ctx.stroke();
  const rows = [['SLICE & CO', 14, '#2a2a36', 900, 22], ['2 LARGE PIZZA', 9, '#3a3a4a', 800, 44], ['39.98', 9, '#3a3a4a', 800, 56], ['TOTAL', 10, '#2a2a36', 900, 76], ['$39.98', 18, '#b3261e', 900, 94], ['CHARGED TO:', 8.5, '#6a6a7a', 800, 114], ['STAFFING', 12, '#2a2a36', 900, 128]];
  for (const [s, sz, c, wt, y] of rows) text(s, 0, y, { size: sz, fill: c, weight: wt, spacing: .4, maxW: w - 8 });
  ctx.restore();
}
// the thought bubble: a cloud of circles, three small ones trailing down, a pizza and two turning gears inside
function bubble(x, y, S, t, o) {
  ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
  const lumps = [[-120, 20, 70], [-60, -40, 80], [20, -62, 88], [100, -30, 76], [128, 30, 66], [60, 64, 74], [-40, 66, 72]];
  ctx.lineJoin = 'round'; ctx.fillStyle = INK; for (const [cx, cy, r] of lumps) { ell(cx, cy, r + 6, r + 6); ctx.fill(); }
  for (const [cx, cy, r] of [[-170, 150, 22], [-210, 205, 15], [-236, 246, 9]]) { ell(cx, cy, r + 5, r + 5); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; for (const [cx, cy, r] of lumps) { ell(cx, cy, r, r); ctx.fill(); }
  for (const [cx, cy, r] of [[-170, 150, 22], [-210, 205, 15], [-236, 246, 9]]) { ell(cx, cy, r, r); ctx.fill(); }
  ctx.fillStyle = 'rgba(160,170,210,.25)'; ell(0, 40, 150, 50); ctx.fill();
  // the pizza (a slice with a bite taken) and the gears
  ctx.save(); ctx.translate(-40, 10); ctx.rotate(-.5); ctx.fillStyle = '#c28a3e'; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-60, -14); ctx.quadraticCurveTo(0, -34, 60, -14); ctx.lineTo(0, 100); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd85a'; ctx.beginPath(); ctx.moveTo(-48, -10); ctx.quadraticCurveTo(0, -24, 48, -10); ctx.lineTo(0, 82); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#b3261e'; for (const [px, py] of [[-14, 8], [16, 14], [0, 42], [-4, 66]]) { ell(px, py, 11, 11); ctx.fill(); } ctx.restore();
  for (const [gx, gy, gr, dir] of [[78, -6, 34, 1], [118, 38, 24, -1]]) { ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * 3.2 * dir); ctx.fillStyle = '#8a92a4'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr0 = i % 2 ? gr * .82 : gr * 1.06; ctx.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ell(0, 0, gr * .32, gr * .32); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
// the dolly zoom on "agency": the camera moves in while the lens widens, so the Administrator keeps his size and the room stretches away behind him
function dollyZ(lt, base) {
  const t0 = wordT('a2', 'agency', 7.83) - .1, d = sk(lt, t0, t0 + .5) * (1 - sk(lt, 8.4, 8.58)), Z = ADMIN.z, cz = lerp(-100, 700, d);
  return { cz, f: 1400 * (Z - cz) / (Z + 100), cy: base.cy, hy: base.hy };
}

window.__EP10_SCENES = window.__EP10_SCENES || {};
window.__EP10_SCENES.office = OFFICE;
})();
