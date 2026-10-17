'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scene module: title (the punch clock, 5.2 s) and end (the thanks card, 8.0 s).
 *
 * title: a wall-mounted time clock (steel case, a ticking dial, a rack of time cards, a red IN / OUT lever). A gloved hand carries the time card PER DIEM, S. BERRY in from the right
 * (the rack's last pocket is empty) and feeds it into the bay. At the punchclock cue (beat logo + 1.50) the clock CLUNKS: the card jolts down, the lever snaps to IN and every needle kicks.
 * At the stamp7 cue (+ 1.62) the stamp lands, IN 2:58 PM in bleeding red ink, the minute hand jumps to 58, and the series logo is stamped onto the wall: WELCOME letter by letter, then BACK,
 * then the EPISODE chip (finished by 3.0 s), while the camera pushes in slowly. SHIFT HAPPENS pops in first, on the textding cue (+ 0.12).
 * end: the family night card (sky, stars, skyline, confetti, the cast hopping), the dedication, the bookend time card stamped OUT 11:00 PM, the sign-off and the teaser with a projector slide.
 * Everything is drawn in screen space (the title uses the world camera only for the slow push-in and the shake). */
(() => {
if (!window.TIMELINE_EP11) return;
const { grad2, confetti } = window.H6;
const A7 = window.A7, A9 = window.A9, A11 = window.A11;
const { lemon, mango } = A7;
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const lerpA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
// a damped shake that starts at t0
const ring = (lt, t0, tau) => lt < t0 ? 0 : Math.exp(-(lt - t0) / tau);

// ------------------------------------------------------------------ the time card (262 x 440 units, drawn centred) and its stamps
const CARD_W = 262, CARD_H = 440;
// ink that bleeds: the text is laid down three times, a wide soft halo first, then the body
function inkText(str, x, y, o, bleed) {
  const col = o.fill || '#c4162a';
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  ctx.font = `400 ${o.size}px Bangers`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = (o.spacing || 0) + 'px';
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.shadowColor = col; ctx.shadowBlur = 1.5 + 4 * bleed; ctx.fillStyle = col; ctx.fillText(str, 0, 0);
  ctx.shadowBlur = 0; ctx.globalAlpha *= .4; ctx.fillText(str, .7 * bleed, .7 * bleed); ctx.globalAlpha /= .4;
  ctx.fillText(str, 0, 0);
  // the border of the stamp pad
  const w = ctx.measureText(str).width + 26, h = o.size * .98;
  ctx.strokeStyle = col; ctx.lineWidth = 4 + 1 * bleed; rr(-w / 2, -h / 2, w, h, 9); ctx.stroke();
  ctx.restore(); ctx.letterSpacing = '0px';
}
// the card itself. st: { inK, inBleed, outK, outBleed, in: 'IN 2:58 PM', out: 'OUT 11:00 PM' }
function timeCard(st = {}) {
  ctx.save();
  ctx.fillStyle = V2.grad(0, -CARD_H / 2, 0, CARD_H / 2, [[0, '#fbf5e2'], [1, '#efe5c8']]); ctx.strokeStyle = INK; ctx.lineWidth = 5;
  rr(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10); ctx.fill(); ctx.stroke();
  ctx.save(); rr(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10); ctx.clip();
  ctx.fillStyle = '#e4d8b4'; ctx.fillRect(-CARD_W / 2, -CARD_H / 2, CARD_W, 92);
  ctx.strokeStyle = 'rgba(40,36,70,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-CARD_W / 2, -CARD_H / 2 + 92); ctx.lineTo(CARD_W / 2, -CARD_H / 2 + 92); ctx.stroke();
  // the two punch holes at the top
  ctx.fillStyle = '#2a2236'; for (const hx of [-86, 86]) { ell(hx, -CARD_H / 2 + 14, 7, 7); ctx.fill(); }
  ctx.restore();
  const ta = st.textA ?? 1;   // the printing only shows once the card is well inside the frame
  const T = (s, x, y, size, col, wt = 900, al = 'center', maxW = 0) => { if (ta < .01) return; ctx.save(); ctx.globalAlpha *= ta; ctx.scale(.1, .1); text(s, x * 10, y * 10, { size: size * 10, fill: col, weight: wt, align: al, maxW: maxW * 10 }); ctx.restore(); };   // drawn at 10x and scaled down: tiny sizes keep their spacing
  T('EMPLOYEE TIME CARD', 0, -CARD_H / 2 + 38, 14, '#6a6488', 900);
  T('PER DIEM,', 0, -CARD_H / 2 + 60, 31, '#22285a', 900, 'center', 236);
  T('S. BERRY', 0, -CARD_H / 2 + 87, 31, '#22285a', 900, 'center', 236);
  // the grid: DAY | IN | OUT | IN | OUT, seven rows
  const X = [-118, -64, -19, 26, 71, 118], y0 = -102, rh = 31;
  ctx.strokeStyle = 'rgba(70,90,150,.55)'; ctx.lineWidth = 1.6;
  for (let r = 0; r <= 8; r++) { ctx.beginPath(); ctx.moveTo(X[0], y0 + r * rh - (r ? 8 : 0)); ctx.lineTo(X[5], y0 + r * rh - (r ? 8 : 0)); ctx.stroke(); }
  for (const x of X) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + 8 * rh - 8); ctx.stroke(); }
  ['DAY', 'IN', 'OUT', 'IN', 'OUT'].forEach((s, i) => T(s, (X[i] + X[i + 1]) / 2, y0 + 8, 11, '#4a4f7a', 900));
  ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach((s, i) => T(s, (X[0] + X[1]) / 2, y0 + 8 + (i + 1) * rh - 8 + 0, 12, '#6a6488', 800));
  // totals and the line that says it all
  ctx.strokeStyle = 'rgba(70,90,150,.55)'; rr(-118, 138, 236, 34, 6); ctx.stroke();
  T('TOTAL HOURS', -64, 155, 11, '#6a6488', 900);
  T('NO CARD, NO PAY. (SEE CONTRACT)', 0, 192, 11, '#8a7a5a', 800, 'center', 236);
  ctx.strokeStyle = 'rgba(70,90,150,.5)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(-100, 214); ctx.lineTo(100, 214); ctx.stroke(); ctx.setLineDash([]);
  T('SIGNED', -80, 205, 10, '#8a8fa6', 900);
  // the stamps: IN on the first rows, OUT beneath it
  if ((st.inK ?? 0) > 0) { ctx.save(); const k = st.inK, sc = lerp(1.55, 1, easeOut(clamp(k))); ctx.translate(-3, -64); ctx.scale(sc, sc); inkText(st.in || 'IN 2:58 PM', 0, 0, { size: 44, rot: -.05, alpha: clamp(k * 4), spacing: 1 }, st.inBleed ?? 0); ctx.restore(); }
  if ((st.outK ?? 0) > 0) { ctx.save(); const k = st.outK, sc = lerp(1.55, 1, easeOut(clamp(k))); ctx.translate(2, 20); ctx.scale(sc, sc); inkText(st.out || 'OUT 11:00 PM', 0, 0, { size: 38, rot: .04, alpha: clamp(k * 4), spacing: 1, fill: '#1f3fb8' }, st.outBleed ?? 0); ctx.restore(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the title: the punch clock
const BX0 = 240, BX1 = 840, BY0 = 880, BY1 = 1810;   // the steel case
const DCX = 540, DCY = 1085;                          // the dial
const BAY = { x0: 392, x1: 688, y0: 1304, y1: 1764 }; // where the card sits: centre (540, 1534)
const clunkT = () => B('logo').s + 1.5, stampT = () => B('logo').s + 1.62;   // the punchclock and stamp7 cues

function rivet(x, y) { ctx.fillStyle = V2.radial(x - 2, y - 2, 1, 9, [[0, '#f2f5fb'], [1, '#6d7690']]); ell(x, y, 8, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(21,15,34,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.lineTo(x + 4, y - 2); ctx.stroke(); }
function steel(x, y, w, h, r, lw = 9, hi = true) {
  ctx.fillStyle = V2.grad(x, y, x + w, y + h, [[0, '#cdd5e6'], [.45, '#8d97b0'], [1, '#5a637e']]); rr(x, y, w, h, r); ctx.fill();
  if (hi) { ctx.save(); rr(x, y, w, h, r); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 12, y + h - 26); ctx.lineTo(x + 12, y + 12); ctx.lineTo(x + w - 26, y + 12); ctx.stroke(); ctx.strokeStyle = 'rgba(20,14,40,.28)'; ctx.beginPath(); ctx.moveTo(x + w - 10, y + 26); ctx.lineTo(x + w - 10, y + h - 10); ctx.lineTo(x + 26, y + h - 10); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = INK; ctx.lineWidth = lw; rr(x, y, w, h, r); ctx.stroke();
}
// the dial: minute ticks, numerals, three hands. mins is the minute hand position in minutes (57 then 58), kick a damped wobble in radians
function dial(lt, mins, secs, kick) {
  ctx.save(); ctx.translate(DCX, DCY);
  ctx.fillStyle = V2.grad(-172, -172, 172, 172, [[0, '#f1f4fb'], [.5, '#9ca6bf'], [1, '#566080']]); ell(0, 0, 172, 172); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke();
  ctx.fillStyle = '#fffdf3'; ell(0, 0, 148, 148); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU - PI / 2, big = i % 5 === 0, r0 = big ? 126 : 134, r1 = 142; ctx.strokeStyle = big ? '#22285a' : 'rgba(34,40,90,.55)'; ctx.lineWidth = big ? 4 : 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); }
  for (let h = 1; h <= 12; h++) { const a = h / 12 * TAU - PI / 2; text(String(h), Math.cos(a) * 100, Math.sin(a) * 100 + 1, { size: 33, fill: '#22285a', weight: 900 }); }
  text('SHIFT CO.', 0, 34, { size: 13, fill: '#8a8fa6', weight: 900, spacing: 2 });
  text('PM', 0, 58, { size: 17, fill: '#c4162a', weight: 900, spacing: 2 });
  const hand = (ang, len, w, col, tail) => { ctx.save(); ctx.rotate(ang - PI / 2); ctx.beginPath(); ctx.moveTo(-tail, -w / 2); ctx.lineTo(len * .18, -w / 2); ctx.lineTo(len, 0); ctx.lineTo(len * .18, w / 2); ctx.lineTo(-tail, w / 2); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); };
  const hr = (2 + mins / 60) / 12 * TAU + kick * .5, mn = mins / 60 * TAU + kick, sc = secs / 60 * TAU + kick * 1.4;
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
  hand(hr, 78, 17, '#2a2448', 16); hand(mn, 118, 12, '#2a2448', 20);
  ctx.save(); ctx.rotate(sc - PI / 2); ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(132, 0); ctx.stroke(); ctx.strokeStyle = '#e8193a'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#e8193a'; ell(-30, 0, 7, 7); ctx.fill(); ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#e4e8f2'; ell(0, 0, 14, 14); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(-4, -4, 4, 3); ctx.fill();
  // the glass
  ctx.save(); ell(0, 0, 148, 148); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-40, -78, 118, 52, -.55, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
}
// the rack of other people's time cards on the right of the case; the last pocket is Strawberry's and it is empty
function rack(lt) {
  const X0 = 850, Y0 = 1262, W2 = 156, H2 = 480;
  steel(X0, Y0, W2, H2, 16, 8);
  const rows = [['M. MANGO', '#ffb347'], ['L. LEMON', '#ffe135'], ['MELON', '#7be0a0'], ['PERSIMMON', '#ff8a5c'], ['C. CLEM', '#7ad0ff']];
  for (let i = 0; i < 6; i++) {
    const y = Y0 + 20 + i * 74;
    ctx.fillStyle = '#1d1829'; rr(X0 + 12, y, W2 - 24, 62, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
    if (i < 5) {
      const [nm, col] = rows[i]; ctx.fillStyle = '#f6efd9'; rr(X0 + 18, y - 14, W2 - 36, 60, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; rr(X0 + 18, y - 14, W2 - 36, 20, [6, 6, 0, 0]); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(X0 + 18, y - 14, W2 - 36, 20, [6, 6, 0, 0]); ctx.stroke();
      text(nm, X0 + W2 / 2, y + 24, { size: 17, fill: '#22285a', weight: 900, maxW: W2 - 48 });
    } else {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 3; rr(X0 + 22, y + 8, W2 - 44, 44, 6); ctx.stroke(); ctx.restore();
      text('S. BERRY', X0 + W2 / 2, y + 31, { size: 17, fill: '#ffe135', weight: 900, maxW: W2 - 52 });
    }
  }
}
// the IN / OUT lever on the left of the case: a red handle in a slot, OUT at the top, IN at the bottom
function lever(lt, k) {
  const X0 = 96, Y0 = 1262, W2 = 130, H2 = 480;
  steel(X0, Y0, W2, H2, 16, 8);
  text('OUT', X0 + W2 / 2, Y0 + 42, { size: 30, font: 'Bangers', weight: 400, fill: '#ff7a8a', lw: 6, stroke: INK, spacing: 2 });
  text('IN', X0 + W2 / 2, Y0 + H2 - 42, { size: 30, font: 'Bangers', weight: 400, fill: '#7be0a0', lw: 6, stroke: INK, spacing: 2 });
  const sx = X0 + W2 / 2, s0 = Y0 + 84, s1 = Y0 + H2 - 84;
  ctx.fillStyle = '#17121f'; rr(sx - 17, s0 - 14, 34, s1 - s0 + 28, 17); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
  const ky = lerp(s0 + 24, s1 - 24, k);
  ctx.save(); ctx.translate(sx, ky); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
  ctx.fillStyle = V2.grad(-40, -22, 40, 22, [[0, '#ff6a7a'], [1, '#b30f26']]); rr(-44, -22, 88, 44, 16); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(-32, -14, 44, 8, 4); ctx.fill(); ctx.restore();
  // the lamp over IN
  const on = k > .6, lc = on ? '#38d86a' : '#27402f';
  if (on) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(sx, Y0 + H2 - 100, 4, 70, [[0, 'rgba(80,255,130,.55)'], [1, 'rgba(80,255,130,0)']]); ctx.fillRect(sx - 80, Y0 + H2 - 180, 160, 160); ctx.restore(); }
  ctx.fillStyle = lc; ell(sx + 38, Y0 + H2 - 84, 8, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
}
// a glove that holds the card by its top right corner, the sleeve running up and out of the frame
function glove(x, y, open) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ax = x + 560, ay = y - 560;
  ctx.strokeStyle = INK; ctx.lineWidth = 92; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x + 34, y - 34); ctx.stroke();
  ctx.strokeStyle = LIMB; ctx.lineWidth = 72; ctx.stroke();
  ctx.save(); ctx.translate(x + 52, y - 52); ctx.rotate(-.78); ctx.fillStyle = '#4a4258'; ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-26, -58, 52, 116, 14); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.translate(x, y); ctx.rotate(.15 - .35 * open); ctx.scale(3.3, 3.3); V2C.hand(open > .5 ? 'open' : 'grip', 1, {});
  ctx.restore();
}

function wall(lt) {
  ctx.fillStyle = grad2(0, 0, 0, H, '#30245a', '#171128'); ctx.fillRect(-100, -100, W + 200, H + 200);
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 2;
  for (let r = 0, y = -30; y < 1560; y += 110, r++) for (let x = (r % 2 ? 0 : 55) - 55; x < W + 60; x += 110) { ctx.beginPath(); ctx.moveTo(x, y - 36); ctx.lineTo(x + 36, y); ctx.lineTo(x, y + 36); ctx.lineTo(x - 36, y); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
  // the wainscot below the chair rail
  ctx.fillStyle = '#1b1432'; ctx.fillRect(-100, 1568, W + 200, 600);
  ctx.fillStyle = '#4a3b80'; ctx.fillRect(-100, 1552, W + 200, 18); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-100, 1552, W + 200, 4);
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 3; for (let x = 20; x < W; x += 180) { rr(x, 1600, 140, 240, 8); ctx.stroke(); }
  // the warm spot on the clock and its glow on the wall
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, 1120, 40, 860, [[0, 'rgba(255,208,140,.30)'], [1, 'rgba(255,208,140,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
}

const SC_TITLE = {
  noChyron: true, noScrim: true,   // nothing is spoken here: no captions
  cam(lt) {
    const k = seg(lt, 0, CUR.dur), cl = clunkT(), st = stampT();
    CAM.x = 540; CAM.y = 960; CAM.z = lerp(1, 1.06, k);
    CAM.shake = 10 * ring(lt, cl, .09) * (lt >= cl) + 15 * ring(lt, st, .16) * (lt >= st) + 8 * ring(lt, st + .12, .08) * (lt >= st + .12) + 15 * ring(lt, st + .42, .1) * (lt >= st + .42);
  },
  draw(lt) {
    const cl = clunkT(), st = stampT(), fed = easeOut(seg(lt, .3, 1.2));
    wall(lt);
    // the case kicks on the clunk and again on the stamp
    const jx = (Math.sin(lt * 80) * 6) * ring(lt, cl, .08) * (lt >= cl) + Math.sin(lt * 95) * 4 * ring(lt, st, .1) * (lt >= st), jy = 7 * ring(lt, cl, .07) * (lt >= cl);
    ctx.save(); ctx.translate(jx, jy);
    // shadow of the case on the wall
    ctx.fillStyle = 'rgba(8,4,22,.45)'; rr(BX0 + 24, BY0 + 26, BX1 - BX0, BY1 - BY0, 44); ctx.fill();
    rack(lt);
    // the case
    steel(BX0, BY0, BX1 - BX0, BY1 - BY0, 44, 10);
    for (const [rx, ry] of [[BX0 + 30, BY0 + 30], [BX1 - 30, BY0 + 30], [BX0 + 30, BY1 - 30], [BX1 - 30, BY1 - 30]]) rivet(rx, ry);
    text('FRUIT BOWL  ·  TIME RECORDER', 540, BY0 + 24, { size: 21, fill: '#39425a', weight: 900, spacing: 4, maxW: 440 });
    // the needles: the seconds tick once a second, the minute hand sits on 57 until the stamp and then jumps to 58 with an overshoot
    const sNow = (lt + 58.18) % 60, sf = sNow % 1, tk = clamp(sf / .14), secs = Math.floor(sNow) + (1 - Math.pow(1 - tk, 3)) + .28 * Math.sin(tk * PI) * (1 - tk);
    const jump = easeElastic(seg(lt, st, st + .5)), mins = 57 + jump;
    const kick = .09 * Math.sin((lt - cl) * 60) * ring(lt, cl, .1) * (lt >= cl) + .12 * Math.sin((lt - st) * 50) * ring(lt, st, .12) * (lt >= st);
    dial(lt, mins, secs, kick);
    // the bay: a dark recess in a steel frame, a lip over it
    steel(BAY.x0 - 22, BAY.y0 - 34, BAY.x1 - BAY.x0 + 44, BAY.y1 - BAY.y0 + 64, 20, 8, false);
    ctx.fillStyle = V2.grad(0, BAY.y0, 0, BAY.y1, [[0, '#0e0b16'], [1, '#262033']]); rr(BAY.x0, BAY.y0, BAY.x1 - BAY.x0, BAY.y1 - BAY.y0, 10); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
    // the lip of the bay above the card (the card sits just under it)
    steel(BAY.x0 - 22, BAY.y0 - 34, BAY.x1 - BAY.x0 + 44, 36, [20, 20, 6, 6], 8);
    ctx.fillStyle = '#15101e'; rr(BAY.x0 + 8, BAY.y0 - 20, BAY.x1 - BAY.x0 - 16, 8, 4); ctx.fill();
    // the card: carried in by the glove, held in front of the bay, then seated
    const hover = 1 - easeIO(seg(lt, cl - .22, cl)), seatDrop = (lt >= cl ? 18 * ring(lt, cl, .1) * Math.cos((lt - cl) * 36) : 0);
    const cx = lerp(1290, 540, fed) + 8 * Math.sin(lt * 7) * (1 - fed), cy = 1534 - 12 * hover + seatDrop - (lt < cl - .22 ? 10 * Math.sin(lt * 5) * fed : 0), sc = lerp(1, 1.1, hover), rot = (-.09 * (1 - fed) + .05 * hover * Math.sin(lt * 6)) * (lt < cl ? 1 : 0);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc);
    if (hover > .02) { ctx.save(); ctx.shadowColor = `rgba(0,0,0,${.5 * hover})`; ctx.shadowBlur = 30 * hover; ctx.shadowOffsetX = 14 * hover; ctx.shadowOffsetY = 26 * hover; ctx.fillStyle = '#000'; rr(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10); ctx.fill(); ctx.restore(); }
    const bleed = seg(lt, st, st + 1.4);
    timeCard({ inK: lt >= st ? seg(lt, st, st + .1) : 0, inBleed: bleed, textA: clamp((925 - cx) / 60) });
    ctx.restore();
    // the lever snaps to IN on the clunk
    const lk = lt < cl ? 0 : clamp(easeBack(seg(lt, cl - .02, cl + .12)), 0, 1.06);
    lever(lt, Math.min(1, lk));
    // a sweep of light over the steel late in the hold
    const sw = seg(lt, 3.3, 4.2); if (sw > 0 && sw < 1) { ctx.save(); rr(BX0, BY0, BX1 - BX0, BY1 - BY0, 44); ctx.clip(); const sx = lerp(BX0 - 200, BX1 + 100, sw); ctx.fillStyle = V2.grad(sx - 90, 0, sx + 90, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(sx - 90, BY0, 180, BY1 - BY0); ctx.restore(); }
    ctx.restore();
    // the glove brings the card in, lets go on the clunk and slides away
    const gOut = easeIn(seg(lt, cl + .06, cl + .75));
    if (lt < cl + .8) glove(cx + 108 + 600 * gOut + (rot * 130), cy - 205 - 600 * gOut * 0 - 180 * gOut, seg(lt, cl + .02, cl + .12));
    // the stamp lands: a shock ring, ink flying off the pad
    for (let i = 0; i < 3; i++) { const r = (lt - st - i * .1) / 1.1; if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(255,${i ? 214 : 245},${i ? 10 : 200},${.8 * (1 - r)})`; ctx.lineWidth = 14 - i * 4; ctx.beginPath(); ctx.arc(537, 1470, 60 + 640 * easeOut(r), 0, TAU); ctx.stroke(); } }
    if (lt >= st && lt < st + .7) { const u = lt - st; for (let i = 0; i < 18; i++) { const a = hash(i * 3.1) * TAU, v = 220 + hash(i * 7.7) * 420, px = 537 + Math.cos(a) * v * u, py = 1470 + Math.sin(a) * v * u + 900 * u * u, f = 1 - u / .7; ctx.fillStyle = `rgba(196,22,42,${.9 * f})`; ell(px, py, 3 + 6 * hash(i + 9) * f, 3 + 6 * hash(i + 9) * f); ctx.fill(); } }
    V2.dust(60, 300, 1020, 1700, lt, { n: 30, alpha: .22 });
    // the logo: SHIFT HAPPENS on the ding, then the clock stamps the rest onto the wall
    const k0 = seg(lt, .32, .72);
    if (k0 > 0) { const s0 = lerp(1.5, 1, easeOut(k0)); ctx.save(); ctx.globalAlpha *= clamp(k0 * 3); ctx.translate(540, 250); ctx.scale(s0, s0); text('SHIFT HAPPENS', 0, 0, { size: 96, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 16, stroke: INK, spacing: 4, shadow: 20 }); ctx.restore(); }
    // WELCOME, letter by letter (the print wheel), then BACK, then the chip
    const word = 'WELCOME', sz = 168, sp = 6;
    ctx.save(); ctx.font = `400 ${sz}px Bangers`; const ws = [...word].map(ch => ctx.measureText(ch).width + sp), tot = ws.reduce((a, b) => a + b, 0); ctx.restore();
    let lx = 540 - tot / 2;
    [...word].forEach((ch, i) => {
      const t0 = st + .1 + i * .045, k = seg(lt, t0, t0 + .2), cxl = lx + ws[i] / 2; lx += ws[i];
      if (k <= 0) return;
      const s1 = lerp(1.6, 1, easeOut(k));
      ctx.save(); ctx.globalAlpha *= clamp(k * 4); ctx.translate(cxl, 522 + 22 * (1 - easeOut(k))); ctx.scale(s1, s1); ctx.rotate((hash(i + 3) - .5) * .12 * (1 - k));
      text(ch, 0, 0, { size: sz, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 20, stroke: INK, shadow: 26 }); ctx.restore();
    });
    const kb = seg(lt, st + .42, st + .82);
    if (kb > 0) {
      const e = easeOut(kb), sq = 1 + .12 * Math.max(0, Math.sin(kb * PI * 1.4)) * (1 - kb);
      ctx.save(); ctx.globalAlpha *= clamp(kb * 3); ctx.translate(540, 715 + 14 * (1 - e)); ctx.scale(lerp(1.5, 1, e) * sq, lerp(1.5, 1, e) / sq);
      text('BACK', 0, 0, { size: 270, font: 'Bangers', weight: 400, fill: '#ff9a3c', lw: 24, stroke: INK, spacing: 8, shadow: 34 }); ctx.restore();
      V2.glow(540, 640, 800, '255,170,90', .3 * clamp(kb * 3), 'screen', .8);
    }
    const chip = easeBack(seg(lt, st + .78, st + 1.18));
    if (chip > 0) { ctx.save(); ctx.translate(540, 384); ctx.scale(chip, chip); ctx.fillStyle = '#7b61ff'; rr(-150, -34, 300, 68, 34); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke(); text('EPISODE 11', 0, 3, { size: 40, fill: '#fff', spacing: 3 }); ctx.restore(); }
  },
  fx(lt) {
    const st = stampT(), cl = clunkT();
    return { bloom: .5, vignette: .32, grain: .04, aberr: 8 * ring(lt, st, .12) * (lt >= st) + 4 * ring(lt, cl, .08) * (lt >= cl),
      fade: lt < .3 ? 1 - lt / .3 : (lt >= st && lt < st + .12 ? .55 * (1 - (lt - st) / .12) : 0), fadeColor: '255,244,228' };
  },
  blur: lt => lt > clunkT() - .1 && lt < stampT() + .9 ? 3 : 1,
  over() {},
};

// ------------------------------------------------------------------ the end card
const FY = 1540;   // the ground line
// the teaser's icon: a little projector throwing a slide (a header, three bullets, a tick) onto a screen. (0, 0) is the middle of the icon, about 190 wide
function slideIcon(lt) {
  ctx.save();
  // the beam, flickering a little
  const fl = .32 + .05 * Math.sin(lt * 13) + .03 * Math.sin(lt * 31);
  ctx.fillStyle = `rgba(255,240,180,${fl})`; ctx.beginPath(); ctx.moveTo(-34, -8); ctx.lineTo(10, -46); ctx.lineTo(10, 46); ctx.lineTo(-34, 8); ctx.closePath(); ctx.fill();
  // the projector
  ctx.fillStyle = V2.grad(0, -28, 0, 28, [[0, '#cfd6e6'], [1, '#7b86a2']]); ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; rr(-96, -26, 66, 52, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a2530'; ell(-28, 0, 13, 17); ctx.fill(); ctx.fillStyle = '#fff6c8'; ell(-28, 0, 7, 10); ctx.fill();
  ctx.fillStyle = '#e8193a'; ell(-80, -14, 4.5, 4.5); ctx.fill();
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-76, 26); ctx.lineTo(-84, 40); ctx.moveTo(-50, 26); ctx.lineTo(-42, 40); ctx.stroke();
  // the slide
  ctx.save(); ctx.translate(12, -44); ctx.rotate(.02 * Math.sin(lt * 2.4));
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; rr(0, 0, 84, 88, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7b61ff'; rr(0, 0, 84, 22, [7, 7, 0, 0]); ctx.fill(); ctx.strokeStyle = '#2a2530'; rr(0, 0, 84, 22, [7, 7, 0, 0]); ctx.stroke();
  ctx.fillStyle = '#fff'; rr(10, 8, 40, 6, 3); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i === 2 ? '#e8193a' : '#7b61ff'; ell(13, 36 + i * 17, 3.4, 3.4); ctx.fill(); ctx.fillStyle = '#b5b0cc'; rr(22, 33 + i * 17, 46 - i * 8, 6, 3); ctx.fill(); }
  ctx.strokeStyle = '#1f9a52'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(67, 77); ctx.lineTo(79, 62); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

const SC_END = {
  noChyron: true, noScrim: true,
  cam() {},
  draw(lt) {
    // the night after the escape: a deep sky, a low skyline, a lamp-lit ground, the Moon who said Nice, the confetti
    ctx.fillStyle = grad2(0, 0, 0, H, '#0e1038', '#3a2a6a'); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 1100, { n: 110, a: .9 });
    ctx.fillStyle = '#1a1540'; for (let i = 0; i < 16; i++) { const bw = 70 + hash(i + 31) * 70, bh = 110 + hash(i + 40) * 250; rr(i * 70 - 20, FY - bh, bw, bh + 4, 6); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,214,120,.8)'; for (let i = 0; i < 16; i++) for (let j = 0; j < 5; j++) if (hash(i * 7 + j + 31) > .55) { const bh = 110 + hash(i + 40) * 250; if (j * 40 + 24 < bh - 10) ctx.fillRect(i * 70 - 20 + 14 + (j % 2) * 24, FY - bh + 18 + j * 40, 12, 18); }
    confetti(lt, .5);
    A7.moon(805, 1065, .8, { t: lt, suppress: true, char: { expr: 'happy', look: [-.5, .4] } });
    ctx.fillStyle = V2.grad(0, FY - 20, 0, H, [[0, 'rgba(26,18,70,0)'], [.08, 'rgba(30,22,84,.9)'], [1, 'rgba(8,6,24,1)']]); ctx.fillRect(0, FY - 20, W, H - FY + 20);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, FY + 6, 10, 560, [[0, 'rgba(255,200,140,.28)'], [1, 'rgba(255,200,140,0)']]); ctx.beginPath(); ctx.ellipse(540, FY + 6, 560, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
    // the bookend: Strawberry's time card, stamped OUT at eleven
    const tOut = 4.5, kOut = seg(lt, tOut, tOut + .1), pk = easeBack(seg(lt, 3.9, 4.35));
    if (pk > 0.01) {
      ctx.save(); ctx.translate(250, 1050 + 6 * Math.sin(lt * 1.7)); ctx.rotate(-.1 + .02 * Math.sin(lt * 1.3)); ctx.scale(.62 * pk, .62 * pk);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 18; ctx.fillStyle = '#000'; rr(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10); ctx.fill(); ctx.restore();
      timeCard({ inK: 1, inBleed: 1, outK: lt >= tOut ? kOut : 0, outBleed: seg(lt, tOut, tOut + 1.2) });
      ctx.restore();
      for (let i = 0; i < 2; i++) { const r = (lt - tOut - i * .1) / .9; if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(255,230,160,${.7 * (1 - r)})`; ctx.lineWidth = 10 - i * 4; ctx.beginPath(); ctx.arc(252, 1068, 40 + 300 * easeOut(r), 0, TAU); ctx.stroke(); } }
    }
    V2.setLight({ key: [-.4, -.8], keyColor: '#fff0d8', keyA: .26, rim: '#ffd9a0', rimA: .6, shadow: '#1a1236', shadowA: .45, amb: '#b0a0e0', ambA: .1 });
    V2.opts.reflect = true;
    // the cast, hopping: Strawberry (per diem), Clementine (new), Lemon, Mango, and the Administrator
    const row = [[A11.straw, { x: 170, s: .82, expr: 'dead', lid: .5 }], [A11.clem, { x: 345, s: .82, expr: 'happy' }], [lemon, { x: 540, s: .86, expr: 'happy' }], [mango, { x: 730, s: .82, expr: 'happy' }], [A9.melon, { x: 890, s: .64, expr: 'happy' }]];
    REG.suppress++;
    row.forEach(([ctor, extra], i) => { const hop = Math.abs(Math.sin(lt * 4.2 + i)) * 14, pop = easeBack(seg(lt, .6 + i * .12, .95 + i * .12)), isS = i === 0;
      if (pop > 0) drawChar(ctor(Object.assign({ y: FY - hop, lift: isS ? -11.8 * extra.s * pop : 0, arms: { l: 'cheer', r: 'wave' }, t: lt + i, transit: lt < 2.4 }, extra, { s: extra.s * pop }))); });
    REG.suppress--;
  },
  fx: lt => ({ bloom: .7, vignette: .5, grain: .05, fade: lt < .25 ? 1 - lt / .25 : 0 }),
  blur: lt => 1,
  over(lt) {
    const k = easeBack(seg(lt, 0, .45));
    if (k > .06) { ctx.save(); ctx.translate(540, 0); ctx.scale(k, k);
      text('SHIFT HAPPENS', 0, 330, { size: 92, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 18, stroke: '#150f22', spacing: 4, shadow: 20 });
      text('WELCOME BACK', 0, 450, { size: 112, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 18, stroke: '#150f22', spacing: 4, shadow: 24 });
      ctx.restore(); }
    const L = (s2, y, size, c, at) => text(s2, 540, y, { size, fill: c, alpha: seg(lt, at, at + .3), weight: 900, lw: 9, maxW: 1000 });
    L('For every nurse who helped', 586, 42, '#ffffff', .8); L("when it wasn't in their contract.", 642, 42, '#ffffff', .8);
    L('It was an add-on.', 728, 50, '#ffe135', 2.3); L('Two hundred an hour.', 788, 50, '#ffe135', 3.0);
    L('You are worth every R.', 880, 48, '#ffd1e6', 4.8);
    // the teaser: a projector throwing the next episode's slide
    const tk = easeBack(seg(lt, 5.4, 5.8));
    if (tk > 0) {
      ctx.save(); ctx.translate(540, 1710); ctx.scale(tk, tk);
      reg('overlay', [540 - 440 * tk, 1710 - 80 * tk, 540 + 440 * tk, 1710 + 80 * tk], { id: 'teaser' });
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(14,10,36,.92)'; rr(-440, -80, 880, 160, 80); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,214,150,.9)'; ctx.lineWidth = 4; rr(-440, -80, 880, 160, 80); ctx.stroke();
      ctx.font = '900 30px Nunito'; ctx.letterSpacing = '5px'; const w1 = ctx.measureText('NEXT: EPISODE 12').width; ctx.letterSpacing = '0px';
      ctx.font = '400 62px Bangers'; ctx.letterSpacing = '2px'; const w2 = ctx.measureText('The In-Service').width; ctx.letterSpacing = '0px';
      const IW = 196, GAP = 36, tw = Math.max(w1, w2), x0 = -(IW + GAP + tw) / 2, icx = x0 + IW / 2, tx0 = x0 + IW + GAP;
      ctx.save(); ctx.translate(icx, 0); slideIcon(lt); ctx.restore();
      text('NEXT: EPISODE 12', tx0, -34, { size: 30, fill: '#ffd1e6', weight: 900, align: 'left', spacing: 5 });
      text('The In-Service', tx0, 22, { size: 62, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'left', lw: 10, stroke: '#150f22', spacing: 2 });
      ctx.restore();
    }
  },
  label: () => 'THANKS FOR WATCHING',
};

window.__EP11_SCENES = window.__EP11_SCENES || {};
window.__EP11_SCENES.title = SC_TITLE;
window.__EP11_SCENES.end = SC_END;
})();
