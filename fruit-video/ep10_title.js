'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice. The title and the end card (scenes `title` and `end`, registered on window.__EP10_SCENES).
 *
 * title (5.2 s, no pills, no scrim): "the flyer". A tear-off flyer is pinned to a cork notice board among the other notices (a lost cat, a yogurt accusation, a pizza menu, the Q-word sign).
 *   0.00  the sheet is thrown at the board and slaps onto it on the sting (0.20): a camera knock, the pins pop in
 *   0.32  the text ding: a glint on the left pin, the EPISODE chip bounces
 *   0.65 to 3.51  fourteen tabs tear off, one per cue (every 0.22 s), left to right: the strip peels back, the tab drops (sway, tumble, flutter, a shadow that follows it down the cork)
 *                 and leaves a ragged edge, a few paper specks fly; the counter on the flyer ticks 14 to 0
 *   3.55  a marker ring closes round the 0; 3.9 a sheen crosses the logo; from 3.6 s to the end nothing moves over the logo and everything is fully legible
 *   Camera: a slow push-in (1.00 to 1.065) with a hair of drift; warm key from the upper left, blinds light across the board, dust in the beam.
 *   Layout (scene coordinates): the flyer is 826 x 1338 at (127, 262), the tear-off strip is its bottom 210 px (14 tabs of 59 px); the other notices live in the margins above and below it.
 * end (8.0 s, no pills, no scrim): a very large donut rises over the skyline like a sun, the cast cheers in front of it, the sign-off lines type in over it
 *   (the five R coins echo Episode 9's five stars), and the teaser for Episode 11 rolls out its red carpet under a banner that is one R short.
 */
(() => {
if (!window.TIMELINE_EP10) return;
const { zoomTo, confetti, grad2 } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10;
window.__EP10_SCENES = window.__EP10_SCENES || {};
const ez = (t, a, b) => easeIO(seg(t, a, b));
const eo = (t, a, b) => easeOut(seg(t, a, b));
const mixc = (a, b, k) => V2.rgba(V2.mix(a, b, k), 1);
// a glowing four-point glint (copy of the Episode 9 one)
function glint(x, y, r, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.fillStyle = `rgba(255,250,220,${a})`;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .12, -r * .12, r, 0); ctx.quadraticCurveTo(r * .12, r * .12, 0, r); ctx.quadraticCurveTo(-r * .12, r * .12, -r, 0); ctx.quadraticCurveTo(-r * .12, -r * .12, 0, -r); ctx.fill();
  ctx.fillStyle = `rgba(255,236,190,${a * .5})`; ctx.beginPath(); ctx.arc(0, 0, r * .22, 0, TAU); ctx.fill(); ctx.restore();
}

// ============================================================================ title: the flyer on the cork board
// the cork: a warm tan base, soft light and dark patches, a few thousand granules and dark pits, painted once into a canvas (seeded, so every frame is the same board)
let CORK = null;
function corkTex() {
  if (CORK) return CORK;
  const w = 1400, h = 2240, c = V2.mk(w, h), g = c.getContext('2d'), R = V2.rng(10);
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#d29c62'); bg.addColorStop(.5, '#c48b52'); bg.addColorStop(1, '#a9733f');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 170; i++) {
    const x = R() * w, y = R() * h, r = 40 + R() * 130, lightPatch = R() > .5, rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, lightPatch ? 'rgba(238,194,134,.22)' : 'rgba(86,48,18,.17)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const cols = ['#8a5a2c', '#9c6a34', '#b07a42', '#d6a468', '#e6bc80', '#6a4220', '#c28a52', '#f0cc94'];
  for (let i = 0; i < 17000; i++) {
    const x = R() * w, y = R() * h, r = 1.1 + R() * 3.8; g.globalAlpha = .22 + R() * .5; g.fillStyle = cols[(R() * cols.length) | 0];
    g.beginPath(); g.ellipse(x, y, r, r * (.55 + R() * .5), R() * 3, 0, TAU); g.fill();
  }
  g.fillStyle = '#4a2a10';
  for (let i = 0; i < 700; i++) { g.globalAlpha = .18 + R() * .34; const r = .8 + R() * 2.1; g.beginPath(); g.ellipse(R() * w, R() * h, r, r * .8, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1; return (CORK = c);
}

// a sheet of paper on the board: the cast shadow falls away from the key (lower right), the content callback draws in the sheet's own coordinates (origin at its centre)
function sheet(x, y, w, h, rot, fill, content, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(40,18,6,.52)'; ctx.shadowBlur = o.blur ?? 15; ctx.shadowOffsetX = o.dx ?? 7; ctx.shadowOffsetY = o.dy ?? 11;
  ctx.fillStyle = fill; rr(-w / 2, -h / 2, w, h, o.r ?? 3); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(-w / 2, -h / 2, w, h, o.r ?? 3); ctx.clip();
  ctx.fillStyle = V2.grad(-w / 2, -h / 2, w / 2, h / 2, [[0, 'rgba(255,255,255,.30)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(110,80,40,.14)']]); ctx.fillRect(-w / 2, -h / 2, w, h);
  content(w, h); ctx.restore();
  ctx.strokeStyle = 'rgba(90,64,34,.4)'; ctx.lineWidth = 1.6; rr(-w / 2, -h / 2, w, h, o.r ?? 3); ctx.stroke();
  ctx.restore();
}
// a push pin: a dome with a highlight, a collar, and the shadow of its head and needle on the paper
function pushPin(x, y, col, r = 20, o = {}) {
  const k = o.k ?? 1; if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(30,14,4,.36)'; ctx.beginPath(); ctx.ellipse(r * .62, r * .78, r * 1.02, r * .6, .55, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(30,14,4,.34)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r * .1, r * .2); ctx.lineTo(r * 1.35, r * 1.25); ctx.stroke();
  ctx.fillStyle = '#b9bec8'; ctx.strokeStyle = 'rgba(25,10,20,.75)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, r * .22, r * .98, r * .55, 0, 0, TAU); ctx.fill(); ctx.stroke();
  const g = ctx.createRadialGradient(-r * .36, -r * .42, r * .08, 0, 0, r * 1.05);
  g.addColorStop(0, mixc(col, '#ffffff', .6)); g.addColorStop(.5, col); g.addColorStop(1, mixc(col, '#150a14', .5));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -r * .06, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.ellipse(-r * .38, -r * .46, r * .27, r * .15, -.6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(r * .3, r * .26, r * .12, 0, TAU); ctx.fill();
  ctx.restore();
}
// a strip of translucent tape across a corner
function tape(x, y, w, h, rot, col = 'rgba(244,232,168,.62)') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.shadowColor = 'rgba(40,18,6,.25)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); for (let i = 0; i <= 5; i++) ctx.lineTo(-w / 2 + (i % 2) * 5, -h / 2 + h * i / 5); ctx.lineTo(w / 2, h / 2); for (let i = 5; i >= 0; i--) ctx.lineTo(w / 2 - (i % 2) * 5, -h / 2 + h * i / 5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ---- the other notices on the board (set dressing, kept inside the frame even at the end of the push-in)
function noticeLostCat() {
  sheet(220, 232, 276, 304, -.07, '#fdfcf4', (w, h) => {
    text('LOST CAT', 0, -h / 2 + 58, { size: 66, font: 'Bangers', weight: 400, fill: '#15111a', spacing: 3, maxW: w - 24 });
    ctx.save(); ctx.translate(0, 38);   // a ginger cat, drawn like a child would have drawn it
    ctx.fillStyle = '#f0a444'; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-52, -26); ctx.lineTo(-48, -74); ctx.lineTo(-14, -48); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(52, -26); ctx.lineTo(48, -74); ctx.lineTo(14, -48); ctx.closePath(); ctx.fill(); ctx.stroke();
    ell(0, 0, 62, 54); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ell(-24, -8, 14, 16); ctx.fill(); ctx.stroke(); ell(24, -8, 14, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1a10'; ell(-22, -6, 5, 9); ctx.fill(); ell(26, -6, 5, 9); ctx.fill();
    ctx.fillStyle = '#e8737f'; ctx.beginPath(); ctx.moveTo(-7, 12); ctx.lineTo(7, 12); ctx.lineTo(0, 21); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 21); ctx.quadraticCurveTo(-10, 34, -20, 26); ctx.moveTo(0, 21); ctx.quadraticCurveTo(10, 34, 20, 26); ctx.stroke();
    ctx.lineWidth = 2.4; for (const s of [-1, 1]) for (const a of [-.2, .12]) { ctx.beginPath(); ctx.moveTo(s * 34, 16 + a * 40); ctx.lineTo(s * 84, 10 + a * 110); ctx.stroke(); }
    ctx.restore();
    text('ANSWERS TO "KALE"', 0, h / 2 - 46, { size: 24, fill: '#2a2530', weight: 900, maxW: w - 30 });
    text('LAST SEEN: 3RD FLOOR', 0, h / 2 - 18, { size: 20, fill: '#6a6488', weight: 900, maxW: w - 30 });
  });
  pushPin(220, 96, '#2a8fe8', 17);
}
function noticeYogurt() {
  sheet(838, 184, 232, 232, .06, '#ffe56e', (w, h) => {
    ctx.fillStyle = 'rgba(190,150,20,.18)'; ctx.fillRect(-w / 2, h / 2 - 34, w, 34);
    text('WHO TOOK MY', 0, -62, { size: 42, font: 'Bangers', weight: 400, fill: '#1b2a6b', spacing: 2, rot: -.03, maxW: w - 20 });
    text('YOGURT', 0, -6, { size: 78, font: 'Bangers', weight: 400, fill: '#c1121f', spacing: 2, rot: -.04, maxW: w - 20 });
    text('(it had my name on it)', 0, 52, { size: 22, fill: '#1b2a6b', weight: 900, italic: true, maxW: w - 24 });
  }, { r: 2, dx: 5, dy: 8, blur: 11 });
  tape(838, 79, 90, 28, .06);
}
function noticePizza() {
  sheet(238, 1706, 306, 236, .05, '#fff6e2', (w, h) => {
    ctx.fillStyle = '#d6202e'; ctx.fillRect(-w / 2, -h / 2, w, 40); ctx.fillStyle = '#fff';
    for (let i = 0; i < 12; i++) if (i % 2) ctx.fillRect(-w / 2 + i * w / 12, -h / 2, w / 12, 20); else ctx.fillRect(-w / 2 + i * w / 12, -h / 2 + 20, w / 12, 20);
    text('LUIGI\'S PIZZA', 0, -h / 2 + 70, { size: 50, font: 'Bangers', weight: 400, fill: '#d6202e', spacing: 2, maxW: w - 24 });
    ctx.save(); ctx.translate(-80, 22); ctx.fillStyle = '#f3b94a'; ctx.strokeStyle = '#8a4a14'; ctx.lineWidth = 4; ell(0, 0, 46, 46); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d6353a';
    for (const [x, y] of [[-16, -14], [14, -18], [20, 12], [-12, 17], [2, -1]]) { ell(x, y, 8, 8); ctx.fill(); }
    ctx.restore();
    text('2 FOR 1', 62, 8, { size: 56, font: 'Bangers', weight: 400, fill: '#15111a', spacing: 2 });
    text('FRIDAY ONLY', 62, 46, { size: 22, fill: '#6a6488', weight: 900 });
    ctx.strokeStyle = '#8a7a60'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(-w / 2, h / 2 - 34); ctx.lineTo(w / 2, h / 2 - 34); ctx.stroke(); ctx.setLineDash([]);
    text('FREE DELIVERY TO THE ADMINISTRATOR', 0, h / 2 - 15, { size: 14, fill: '#2a2530', weight: 900, maxW: w - 20 });
  });
  pushPin(238, 1606, '#58b83a', 17);
}
function noticeQ() {
  sheet(808, 1708, 330, 150, -.035, '#fffdf4', (w, h) => {
    text('QUIET', 0, -6, { size: 112, font: 'Bangers', weight: 400, fill: '#15111a', spacing: 6 });
    // the Q is crossed out, as at the station: the cross is centred on the measured Q
    ctx.font = '400 112px Bangers'; ctx.letterSpacing = '6px'; const tot = ctx.measureText('QUIET').width, qw = ctx.measureText('Q').width; ctx.letterSpacing = '0px';
    const qx = -tot / 2 + qw / 2 + 3;
    ctx.strokeStyle = 'rgba(214,32,46,.92)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(qx - 40, -58); ctx.lineTo(qx + 40, 48); ctx.moveTo(qx + 38, -60); ctx.lineTo(qx - 42, 44); ctx.stroke();
    text('DO NOT SAY IT', 0, h / 2 - 22, { size: 24, fill: '#d6202e', weight: 900, spacing: 4 });
  });
  pushPin(808, 1648, '#e8193a', 17);
}

// ---- the flyer's geometry (scene coordinates, before the camera): the sheet and its tear-off strip
const FX = 127, FY = 262, FW = 826, FH = 1338, TH = 210, BH = FH - TH, NT = 14, TW = FW / NT, FROT = -.014;
const PEEL = .11;                                   // seconds a tab spends curling off the strip before it lets go
const tearAt = i => B('logo').s + .45 + i * .22;    // the audio cues: fourteen tears, every 0.22 s
const tornAt = lt => { let n = 0; for (let i = 0; i < NT; i++) if (lt >= tearAt(i)) n++; return n; };
// the ragged edge each tear leaves: 13 points along the tab's width, seeded per tab (so the sheet and the tab it lost match exactly)
const JAG = Array.from({ length: NT }, (_, i) => { const r = V2.rng(100 + i * 7); return Array.from({ length: 13 }, (_, k) => (r() - .42) * 15 * (k % 2 ? 1 : .55)); });
// the sheet's silhouette with its first n tabs gone
function silhouette(n) {
  const p = new Path2D(); p.moveTo(0, 0); p.lineTo(FW, 0); p.lineTo(FW, FH); p.lineTo(n * TW, FH);
  if (n > 0) { p.lineTo(n * TW, BH + JAG[n - 1][12]); for (let c = n - 1; c >= 0; c--) for (let k = 12; k >= 0; k--) p.lineTo(c * TW + k * TW / 12, BH + JAG[c][k]); } else p.lineTo(0, FH);
  p.closePath(); return p;
}
// a tab in its own frame: origin at its top-right corner, x to the left, y down
const TAB_PATH = Array.from({ length: NT }, (_, i) => { const p = new Path2D(); p.moveTo(-TW, TH); p.lineTo(-TW, JAG[i][0]); for (let k = 1; k <= 12; k++) p.lineTo(-TW + k * TW / 12, JAG[i][k]); p.lineTo(0, TH); p.closePath(); return p; });
const PAPER = '#fbf4e2';
function tabInk(i) {   // the printed countdown on one tab: the number in red, DAYS in ink, reading bottom to top like a phone-number tab
  const N = NT - i, num = String(N), word = N === 1 ? ' DAY' : ' DAYS';
  ctx.save(); ctx.translate(-TW / 2 + 1, TH / 2 + 10); ctx.rotate(-PI / 2);
  ctx.font = '400 50px Bangers'; ctx.letterSpacing = '1px'; const w1 = ctx.measureText(num).width; ctx.font = '400 34px Bangers'; const w2 = ctx.measureText(word).width; ctx.letterSpacing = '0px';
  const x0 = -(w1 + w2) / 2;
  text(num, x0, 0, { size: 50, font: 'Bangers', weight: 400, fill: '#d62a3a', align: 'left', spacing: 1 });
  text(word, x0 + w1, 3, { size: 34, font: 'Bangers', weight: 400, fill: '#2a2448', align: 'left', spacing: 1 });
  ctx.restore();
}
function tabFace(i, front, shadowK) {
  ctx.save();
  if (shadowK != null) { ctx.shadowColor = `rgba(40,18,6,${.46 - .2 * shadowK})`; ctx.shadowBlur = 10 + 30 * shadowK; ctx.shadowOffsetX = 6 + 44 * shadowK; ctx.shadowOffsetY = 10 + 66 * shadowK; }
  ctx.fillStyle = front ? PAPER : '#e4d9bf'; ctx.fill(TAB_PATH[i]); ctx.restore();
  ctx.save(); ctx.clip(TAB_PATH[i]);
  if (front) { tabInk(i); ctx.fillStyle = V2.grad(-TW, 0, 0, TH, [[0, 'rgba(255,255,255,.25)'], [1, 'rgba(110,80,40,.12)']]); ctx.fillRect(-TW, 0, TW, TH); }
  else { ctx.globalAlpha = .1; ctx.scale(-1, 1); ctx.translate(TW, 0); tabInk(i); }   // the ink bleeds faintly through to the back
  ctx.restore();
  // the torn fibres along the top edge
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,250,.95)'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const x = -TW + k * TW / 12, y = JAG[i][k] + 2; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  ctx.strokeStyle = 'rgba(120,96,60,.55)'; ctx.lineWidth = 1.4; ctx.stroke(TAB_PATH[i]); ctx.restore();
}
// the sheet's pose: the throw and slap at the sting, then a small jolt on every tear
function flyerPose(lt) {
  const land = .20, k0 = seg(lt, 0, land);
  let k = lt < land ? lerp(1.22, 1, easeIn(k0)) : 1 - .014 * Math.exp(-(lt - land) * 17) * Math.cos((lt - land) * 38);
  let rot = FROT + (lt < land ? lerp(-.1, 0, easeOut(k0)) : .006 * Math.exp(-(lt - land) * 12) * Math.sin((lt - land) * 30)), dx = 0, dy = 0;
  for (let i = 0; i < NT; i++) { const u = lt - tearAt(i); if (u > 0 && u < .3) { const a = Math.exp(-u * 26) * 3.2; dx += a * Math.sin(u * 70 + i); dy += a * Math.cos(u * 64 + i * 2) * .7; } }
  return { k, rot, dx, dy, h: lt < land ? 1 - k0 : 0, a: seg(lt, 0, .07) };
}
const toWorld = (P, u, v) => { const c = Math.cos(P.rot), s = Math.sin(P.rot), x = (u - FW / 2) * P.k, y = (v - FH / 2) * P.k; return [FX + FW / 2 + P.dx + x * c - y * s, FY + FH / 2 + P.dy + x * s + y * c]; };

// the tabs in the air: the peel (hinged at the top-right corner), then the fall, a pure function of time since the tear
function tabState(i, lt) {
  const u = lt - tearAt(i); if (u < 0) return null;
  const r = V2.rng(500 + i * 13), A = 36 + r() * 34, w = 7.6 + r() * 3.4, ph = r() * TAU, dir = r() > .5 ? 1 : -1, Om = (4.2 + r() * 3) * dir, ps = r() * TAU;
  const P0 = flyerPose(tearAt(i) + PEEL), th0 = P0.rot + .46;
  if (u < PEEL) { const th = P0.rot + .46 * easeOut(u / PEEL), hinge = toWorld(flyerPose(lt), (i + 1) * TW, BH); return { peel: true, hx: hinge[0], hy: hinge[1], th, h: .15 * u / PEEL }; }
  const hinge = toWorld(P0, (i + 1) * TW, BH), c = Math.cos(th0), s = Math.sin(th0), cx0 = hinge[0] + (-TW / 2) * c - (TH / 2) * s, cy0 = hinge[1] + (-TW / 2) * s + (TH / 2) * c;
  const t = u - PEEL, ramp = 1 - Math.exp(-3 * t);
  const x = cx0 - 34 * t + A * Math.sin(w * t + ph) * ramp, y = cy0 + 40 * t + 1150 * (t - .4 * (1 - Math.exp(-t / .4)));
  const th = th0 + .5 * dir * (Math.sin(w * t + ph + 1.1) - Math.sin(ph + 1.1)) + .05 * Math.sin(34 * t + ps) * ramp - .5 * t * dir;
  const psi = Om * t, cs = Math.cos(psi);
  return { peel: false, x, y, th, sx: (cs < 0 ? -1 : 1) * Math.max(.1, Math.abs(cs)), front: cs >= 0, h: Math.min(1, t * 4) * (.3 + .7 * (.5 + .5 * Math.sin(w * t + ph + .6))), skew: .12 * Math.sin(psi) * dir };
}
function drawFalling(lt) {
  for (let i = 0; i < NT; i++) {
    const S = tabState(i, lt); if (!S) continue;
    ctx.save();
    if (S.peel) { ctx.translate(S.hx, S.hy); ctx.rotate(S.th); }
    else { ctx.translate(S.x, S.y); ctx.rotate(S.th); ctx.transform(S.sx, 0, S.skew, 1, 0, 0); ctx.translate(TW / 2, -TH / 2); if (S.y > H + 400) { ctx.restore(); continue; } }
    tabFace(i, S.peel || S.front, S.h);
    ctx.restore();
    // paper specks thrown off by the tear
    const u = lt - tearAt(i);
    if (u > 0 && u < .55) {
      const r = V2.rng(900 + i * 5), hinge = toWorld(flyerPose(tearAt(i)), i * TW + TW / 2, BH);
      for (let q = 0; q < 6; q++) { const vx = (r() - .5) * 260, vy = -60 - r() * 170, sz = 2.2 + r() * 3.2, a = 1 - u / .55, px = hinge[0] + vx * u, py = hinge[1] + vy * u + 900 * u * u; ctx.save(); ctx.globalAlpha = a; ctx.translate(px, py); ctx.rotate(u * 9 * (r() - .5) * 4); ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(100,80,50,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-sz, -sz * .6); ctx.lineTo(sz, 0); ctx.lineTo(-sz * .3, sz); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    }
  }
}

// the printed sheet: a violet poster panel with the series mark and the episode lockup, the ID photo, the counter, the strip
function flyer(lt) {
  const P = flyerPose(lt), n = tornAt(lt), count = NT - n;
  if (P.a <= 0) return;
  ctx.save(); ctx.globalAlpha *= P.a; ctx.translate(FX + FW / 2 + P.dx, FY + FH / 2 + P.dy); ctx.rotate(P.rot); ctx.scale(P.k, P.k); ctx.translate(-FW / 2, -FH / 2);
  const sil = silhouette(n), h = P.h;
  // the paper, with its shadow on the cork (long and soft while the sheet is still in the air)
  ctx.save(); ctx.shadowColor = `rgba(40,18,6,${.52 - .16 * h})`; ctx.shadowBlur = 20 + 40 * h; ctx.shadowOffsetX = 9 + 50 * h; ctx.shadowOffsetY = 14 + 80 * h;
  ctx.fillStyle = V2.grad(0, 0, FW, FH, [[0, '#fffaf0'], [.6, '#f8f0dc'], [1, '#efe5cb']]); ctx.fill(sil); ctx.restore();
  ctx.save(); ctx.clip(sil);
  // paper grain: a few faint fibres
  ctx.strokeStyle = 'rgba(120,96,60,.07)'; ctx.lineWidth = 1.2; for (let i = 0; i < 90; i++) { const x = hash(i * 3.1) * FW, y = hash(i * 5.7 + 2) * FH, a = hash(i + 9) * PI; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); ctx.stroke(); }
  // ---- the violet panel
  const px = 28, py = 86, pw = FW - 56, ph = 656;
  ctx.save(); rr(px, py, pw, ph, 26); ctx.clip();
  ctx.fillStyle = V2.grad(0, py, 0, py + ph, [[0, '#4a3a96'], [.55, '#2e2268'], [1, '#1d1548']]); ctx.fillRect(px, py, pw, ph);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(FW / 2, 440); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + .2; ctx.fillStyle = 'rgba(255,214,120,.045)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 760, a, a + .1); ctx.closePath(); ctx.fill(); } ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let r = 0; r < 20; r++) for (let c = 0; c < 28; c++) { ell(px + 14 + c * 28 + (r % 2) * 14, py + 14 + r * 33, 3, 3); ctx.fill(); }   // halftone dots
  ctx.restore();
  ctx.strokeStyle = '#150f22'; ctx.lineWidth = 5; rr(px, py, pw, ph, 26); ctx.stroke();
  // the series mark and the lockup
  const cx = FW / 2;
  text('SHIFT HAPPENS', cx, 190, { size: 126, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 16, stroke: '#150f22', spacing: 4 });
  const chipK = easeBack(seg(lt, .30, .52));
  if (chipK > 0) { ctx.save(); ctx.translate(cx, 296); ctx.scale(chipK, chipK); ctx.fillStyle = '#7b61ff'; rr(-150, -34, 300, 68, 34); ctx.fill(); ctx.strokeStyle = '#150f22'; ctx.lineWidth = 6; ctx.stroke(); text('EPISODE 10', 0, 3, { size: 42, font: 'Bangers', weight: 400, fill: '#fff', spacing: 3 }); ctx.restore(); }
  text('TWO WEEKS\'', cx, 430, { size: 150, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 18, stroke: '#150f22', spacing: 5 });
  text('NOTICE', cx, 614, { size: 266, font: 'Bangers', weight: 400, fill: '#ff9a3c', lw: 22, stroke: '#150f22', spacing: 8 });
  // the sheen that crosses the panel once the last tab is gone
  const sh = seg(lt, tearAt(NT - 1) + .4, tearAt(NT - 1) + .95);
  if (sh > 0 && sh < 1) { ctx.save(); rr(px, py, pw, ph, 26); ctx.clip(); ctx.globalCompositeOperation = 'screen'; const sx = lerp(-260, FW + 160, sh); ctx.fillStyle = V2.grad(sx - 90, 0, sx + 90, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,248,214,.30)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.moveTo(sx - 60, py); ctx.lineTo(sx + 130, py); ctx.lineTo(sx + 60, py + ph); ctx.lineTo(sx - 130, py + ph); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // ---- the ID photo: a tired nurse against the blue wall
  ctx.save(); ctx.translate(170, 930); ctx.rotate(-.035);
  ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(40,18,6,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; rr(-130, -158, 260, 316, 4); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(-116, -144, 232, 262, 2); ctx.clip();
  ctx.fillStyle = V2.grad(0, -144, 0, 118, [[0, '#8dbcf0'], [1, '#5686c8']]); ctx.fillRect(-116, -144, 232, 262);
  const keep = Object.assign({}, V2.LIGHT); V2.setLight({ key: [-.2, -.7], keyColor: '#ffffff', keyA: .2, rimA: 0, shadow: '#3a2a50', shadowA: .2, bounceA: .05 });
  REG.suppress++; drawChar(A7.straw({ x: 0, y: 36, s: .62, noLegs: true, noArms: true, center: true, noShadow: true, noReflect: true, who: null, lift: 0, expr: 'dead', lid: .5, look: [0, .05], acc: ['steth'], id: 'flyer-photo' })); REG.suppress--;
  Object.assign(V2.LIGHT, keep);
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.fillRect(-116, 118, 232, 40); text('STRAWBERRY, RN', 0, 138, { size: 26, fill: '#2a2448', weight: 900, spacing: 1, maxW: 220 });
  tape(-96, -158, 70, 24, -.5); tape(100, -150, 70, 24, .6);
  ctx.restore();
  // ---- the counter: NURSE AVAILABLE IN n DAYS, ticking down with the tabs
  text('NURSE AVAILABLE IN', 330, 796, { size: 38, font: 'Bangers', weight: 400, fill: '#2a2448', align: 'left', spacing: 2 });
  const numX = 616, numY = 956;
  ctx.font = '400 232px Bangers'; ctx.letterSpacing = '2px'; const nw = ctx.measureText(String(count)).width; ctx.letterSpacing = '0px';
  const pop = lt >= tearAt(0) ? lerp(1.2, 1, easeOut(seg(lt - (n ? tearAt(n - 1) : 0), 0, .16))) : 1, pvx = numX - nw / 2;
  ctx.save(); ctx.translate(pvx, numY); ctx.scale(pop, pop); ctx.translate(-pvx, -numY);
  text(String(count), numX, numY, { size: 232, font: 'Bangers', weight: 400, fill: count === 0 ? '#1f9a52' : '#d62a3a', lw: 12, stroke: '#150f22', align: 'right', spacing: 2 });
  ctx.restore();
  text(count === 1 ? 'DAY' : 'DAYS', 646, 994, { size: 84, font: 'Bangers', weight: 400, fill: '#2a2448', align: 'left', spacing: 2 });
  text('AGENCY ONLY. NO PIZZA.', 330, 1074, { size: 30, fill: '#6a6488', weight: 900, align: 'left', spacing: 1, maxW: 470 });
  // the marker ring that closes round the 0
  const rk = ez(lt, tearAt(NT - 1) + .06, tearAt(NT - 1) + .5);
  if (rk > 0) {
    ctx.save(); ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha *= .95; ctx.beginPath();
    const ncx = numX - nw / 2, ncy = numY - 8, steps = 90;
    for (let j = 0; j <= steps * rk; j++) { const t = j / steps * 2.25 * PI - PI * .6, rad = 1 + .035 * Math.sin(t * 3) + .05 * (j / steps); const x = ncx + Math.cos(t) * 82 * rad, y = ncy + Math.sin(t) * 104 * rad - 6 * (j / steps); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  // ---- the strip: the dashed cut lines, the perforation and the tabs still attached
  ctx.strokeStyle = 'rgba(110,86,52,.6)'; ctx.lineWidth = 2; ctx.setLineDash([9, 7]);
  for (let c = n; c <= NT; c++) { ctx.beginPath(); ctx.moveTo(c * TW, BH); ctx.lineTo(c * TW, FH); ctx.stroke(); }
  ctx.setLineDash([4, 5]); ctx.lineWidth = 2.4; if (n < NT) { ctx.beginPath(); ctx.moveTo(n * TW, BH); ctx.lineTo(FW, BH); ctx.stroke(); }
  ctx.setLineDash([]);
  for (let c = n; c < NT; c++) { ctx.save(); ctx.translate((c + 1) * TW, BH); tabInk(c); ctx.restore(); }
  // the sheet's own light: a soft gloss from the upper left
  ctx.fillStyle = V2.grad(0, 0, FW, FH * .7, [[0, 'rgba(255,255,255,.22)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, FW, FH);
  ctx.restore();   // end of the paper clip
  // the torn edge: white fibres just inside the ragged border
  if (n > 0) { ctx.strokeStyle = 'rgba(255,255,250,.95)'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath(); for (let c = 0; c < n; c++) for (let k = 0; k <= 12; k++) { const x = c * TW + k * TW / 12, y = BH + JAG[c][k] - 2; (c || k) ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,96,60,.5)'; ctx.lineWidth = 1.6; ctx.stroke(sil);
  // the audit boxes: the mark and the lockup must stay whole and inside the frame at every frame (the push-in is checked here)
  if (lt >= .2) { regLocal('overlay', cx - 350, 118, cx + 350, 262, { id: 'title-mark' }); regLocal('overlay', cx - 350, 330, cx + 350, 700, { id: 'title-lockup' }); }
  // ---- the pins
  const pk = easeBack(seg(lt, .30, .46));
  pushPin(70, 40, '#e8193a', 22, { k: pk }); pushPin(FW - 70, 40, '#2a8fe8', 22, { k: pk });
  ctx.restore();
}

// light through blinds laid across the board (the next scene is the office the blinds belong to), warm and slow
function blinds(lt) {
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(540, 960); ctx.rotate(-.2); ctx.translate(-540, -960);
  for (let i = -9; i < 12; i++) {
    const y = 960 + i * 150 + 8 * Math.sin(lt * .5), g = ctx.createLinearGradient(0, y, 0, y + 96);
    g.addColorStop(0, 'rgba(255,226,170,0)'); g.addColorStop(.3, 'rgba(255,226,170,.12)'); g.addColorStop(.7, 'rgba(255,226,170,.12)'); g.addColorStop(1, 'rgba(255,226,170,0)'); ctx.fillStyle = g; ctx.fillRect(-700, y, 2500, 96);
  }
  ctx.restore();
}

const TITLE = {
  noChyron: true, noScrim: true,   // no spoken lines: the scrim would only dim the board
  cam(lt) {
    const z = 1 + .065 * ez(lt, 0, 5.2);
    zoomTo(540 + 7 * Math.sin(lt * .7), 940 + 5 * Math.sin(lt * .55 + 1), z);
    CAM.shake = lt > .2 && lt < .5 ? 7 * (1 - (lt - .2) / .3) : 0;   // the knock of the sheet hitting the board
  },
  draw(lt) {
    ctx.fillStyle = '#6a4220'; ctx.fillRect(-300, -300, W + 600, H + 600);
    ctx.drawImage(corkTex(), -160, -160);
    // the key light: warm, from the upper left, falling off toward the lower right
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = V2.radial(300, 420, 120, 1700, [[0, 'rgba(255,248,236,1)'], [.55, 'rgba(226,190,150,1)'], [1, 'rgba(120,84,64,1)']]); ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
    noticeLostCat(); noticeYogurt(); noticePizza(); noticeQ();
    flyer(lt);
    drawFalling(lt);
    blinds(lt);
    V2.glow(180, 120, 1100, '255,214,150', .22, 'screen', .3);
    V2.dust(0, 0, W, H, lt, { n: 46, alpha: .5, size: 3.4, speed: 9, color: '255,240,210' });
    // thumbtack glints: the left pin at the ding, the right pin when the last tab is gone
    { const P = flyerPose(lt), a = toWorld(P, 70, 40), b = toWorld(P, FW - 70, 40);
      const g1 = 1 - seg(lt, .32, .78), g2 = Math.sin(clamp((lt - 3.7) / .55) * PI);
      if (lt >= .32) glint(a[0] - 6, a[1] - 9, lerp(26, 62, easeOut(seg(lt, .32, .45))) * (.5 + .5 * g1), clamp(g1));
      if (g2 > 0) glint(b[0] - 6, b[1] - 9, 22 + 40 * g2, g2); }
  },
  fx: lt => ({ bloom: .4, vignette: .28, grain: .05, contrast: .14, sat: .06, tint: [['#ffd9a0', .13, 'soft-light']], fade: lt < .26 ? 1 - lt / .26 : 0, fadeColor: '0,0,0' }),
  blur: lt => lt > .1 && lt < 4.7 ? 3 : 1,
  over() {},
};
window.__EP10_SCENES.title = TITLE;

// ============================================================================ end card: a very large donut for a sun
// wrap a sentence into lines no wider than maxW at the given font (measured, so nothing is ever squeezed)
function wrapLines(str, font, maxW) {
  ctx.save(); ctx.font = font; const out = []; let line = '';
  for (const w of str.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  ctx.restore(); out.push(line); return out;
}
// a glazed donut seen face on: dough ring, wavy pink glaze, sprinkles, a gloss, and the paper flag that says ONE
function donut(cx, cy, R, t) {
  const r = R * .34, wob = (a, k) => 1 + .035 * Math.sin(7 * a + k) + .024 * Math.sin(13 * a + 2 * k) + .02 * Math.sin(3 * a + k * .5);
  ctx.save(); ctx.translate(cx, cy);
  ctx.lineJoin = 'round';
  // dough
  const ring = new Path2D(); ring.arc(0, 0, R, 0, TAU); ring.moveTo(r, 0); ring.arc(0, 0, r, 0, TAU, true);
  ctx.fillStyle = V2.radial(-R * .3, -R * .35, R * .1, R * 1.1, [[0, '#f7cd86'], [.5, '#dc9a48'], [1, '#a35f28']]); ctx.fill(ring, 'evenodd');
  // glaze
  const gl = new Path2D();
  for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, rad = R * .9 * wob(a, 1); i ? gl.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : gl.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  gl.closePath(); gl.moveTo(r * 1.34, 0);
  for (let i = 0; i <= 80; i++) { const a = -i / 80 * TAU, rad = r * 1.34 * wob(a, 3); gl.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  gl.closePath();
  ctx.fillStyle = V2.radial(-R * .32, -R * .38, R * .08, R * .95, [[0, '#ffc2dc'], [.45, '#ff7db8'], [1, '#e8438f']]); ctx.fill(gl, 'evenodd');
  ctx.save(); ctx.clip(gl, 'evenodd');
  // sprinkles
  const cols = ['#ffffff', '#ffe135', '#52b8ff', '#5ae682', '#ff9a3c', '#b684ff', '#ff4d5e'];
  for (let i = 0; i < 90; i++) {
    const a = hash(i * 3.3) * TAU, rad = r * 1.55 + Math.sqrt(hash(i * 7.1 + 4)) * (R * .86 - r * 1.55), x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i * 5.9 + 1) * PI); ctx.fillStyle = cols[i % cols.length]; ctx.strokeStyle = 'rgba(90,20,60,.4)'; ctx.lineWidth = 1.6; rr(-9, -3.2, 18, 6.4, 3.2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  // gloss on the lit shoulder
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, R * .74, PI * 1.08, PI * 1.42); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R * .74, PI * 1.47, PI * 1.55); ctx.stroke();
  // outlines
  ctx.strokeStyle = 'rgba(70,26,14,.9)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  // the flag: ONE donut per nurse
  ctx.save(); ctx.translate(R * .5, -R * .66); ctx.rotate(.38);
  ctx.strokeStyle = '#d9b27a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(0, -88); ctx.stroke();
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(70, -88 + 9 * Math.sin(t * 5)); ctx.lineTo(66, -50 + 7 * Math.sin(t * 5 + 1)); ctx.lineTo(0, -52); ctx.closePath(); ctx.fill(); ctx.stroke();
  text('1', 32, -69, { size: 38, font: 'Bangers', weight: 400, fill: '#d62a3a' });
  ctx.restore();
  ctx.restore();
}
// a gold coin with a big R on it: the five that take the place of Episode 9's five stars
function rCoin(x, y, r, k) {
  if (k <= 0) return;
  const pop = 1 + .3 * Math.sin(clamp(k) * PI), sc = easeBack(clamp(k)) * pop / (1 + .3 * 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = V2.radial(-r * .3, -r * .35, r * .1, r * 1.1, [[0, '#fff6b0'], [.5, '#ffcd32'], [1, '#c98a12']]); ell(0, 0, r, r); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#150f22'; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = 'rgba(140,84,10,.7)'; ctx.lineWidth = 3; ell(0, 0, r * .8, r * .8); ctx.stroke();
  text('R', 0, 4, { size: r * 1.5, font: 'Bangers', weight: 400, fill: '#5a2c06', lw: 0 });
  ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.ellipse(-r * .42, -r * .5, r * .2, r * .1, -.7, 0, TAU); ctx.fill();
  ctx.restore();
}
// the red carpet roll for the teaser: a roll seen end on, and the runner it has already let out
function carpetRoll(x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 5; ell(0, 0, r, r); ctx.fill(); ctx.stroke();
  const rings = ['#d42a3c', '#a8142a', '#d42a3c', '#a8142a', '#d42a3c', '#8a0f22'];
  rings.forEach((c, i) => { ctx.fillStyle = c; ell(0, 0, r * (.9 - i * .15), r * (.9 - i * .15)); ctx.fill(); ctx.strokeStyle = 'rgba(40,0,10,.55)'; ctx.lineWidth = 2.4; ctx.stroke(); });
  ctx.fillStyle = '#2a0610'; ell(0, 0, r * .1, r * .1); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-r * .4, -r * .5, r * .22, r * .1, -.7, 0, TAU); ctx.fill();
  ctx.restore();
}
// a skyline in two hazes, windows lit, the nearer row darker
function skyline(base, lt) {
  const layers = [{ col: '#6a3f86', win: 'rgba(255,214,150,.55)', n: 15, hMin: 100, hMax: 250, seed: 40, dy: 0 }, { col: '#2c1f58', win: 'rgba(255,224,150,.9)', n: 14, hMin: 120, hMax: 330, seed: 7, dy: 16 }];
  for (const L of layers) {
    for (let i = 0; i < L.n; i++) {
      const bw = 70 + hash(i + L.seed) * 70, bh = L.hMin + hash(i + L.seed + 9) * (L.hMax - L.hMin), x = i * (W + 80) / L.n - 30, y = base + L.dy - bh;
      ctx.fillStyle = L.col; rr(x, y, bw, bh + 8, 6); ctx.fill();
      ctx.fillStyle = V2.grad(0, y, 0, y + 60, [[0, 'rgba(255,170,120,.35)'], [1, 'rgba(255,170,120,0)']]); rr(x, y, bw, 60, 6); ctx.fill();   // the sun catches the roofs
      for (let j = 0; j < 7; j++) for (let k = 0; k < 3; k++) if (hash(i * 31 + j * 5 + k + L.seed) > .55) { const wx = x + 12 + k * (bw - 24) / 2.4, wy = y + 22 + j * 38; if (wy + 20 < y + bh) { ctx.fillStyle = L.win; ctx.fillRect(wx, wy, 11, 17); } }
    }
  }
}
const CAST = [   // the ensemble in front of the sun: kind, x, scale and look (everyone hops a little, out of step)
  ['clem', { x: 150, s: .76, acc: ['steth', 'pricetag', 'badge7'], badgeText: 'NEW', expr: 'hopeful' }],
  ['mango', { x: 322, s: .84, acc: ['badge7', 'gaitbelt7', 'keys7'], badgeText: 'CNA', expr: 'happy' }],
  ['straw', { x: 540, s: .98, acc: ['steth', 'badge7', 'bandage7'], expr: 'chill', lashes: true, lid: .35 }],
  ['lemon', { x: 758, s: .84, acc: ['readers', 'lanyard7'], expr: 'happy' }],
  ['melon', { x: 915, s: .6, acc: ['suit', 'nametag9'], tag: 'ADMINISTRATOR', expr: 'happy', both: 'cheer' }],
];
const END = {
  noChyron: true, noScrim: true,
  cam() {},
  draw(lt) {
    // dawn: the night is over, tomorrow is at three
    ctx.fillStyle = V2.grad(0, 0, 0, 1500, [[0, '#1b1a5a'], [.34, '#4c2f86'], [.62, '#a8449a'], [.84, '#ff8a70'], [1, '#ffd08a']]); ctx.fillRect(-100, -100, W + 200, H + 200);
    A7.stars(lt, 760, { n: 90, a: .75 * (1 - ez(lt, 0, 6)) + .25 });
    A7.clouds(lt, 600, 1300, { n: 5, tint: '255,196,170', belly: '110,60,130', a: .5, speed: 10, seed: 3, scale: 1.3 });
    const R = 236, cy = lerp(1700, 1112, eo(lt, 0, 3.8)) + 5 * Math.sin(lt * 1.3);
    V2.glow(540, cy, R * 3.2, '255,160,110', .55, 'screen', .9);
    A7.rays(540, cy, R * .9, 1900, lt, { n: 18, color: '255,214,160', a: .1, spin: .018 });
    donut(540, cy, R, lt);
    skyline(1524, lt);
    A7.birds(lt, 640, 980, { n: 4, color: 'rgba(40,24,70,.6)', speed: 34, seed: 5, size: 1.1 });
    confetti(lt, .5, 70);
    // the stage: a warm pool under the cast
    const fy = 1524;
    ctx.fillStyle = V2.grad(0, fy - 20, 0, H, [[0, 'rgba(36,20,80,0)'], [.08, 'rgba(40,24,92,.92)'], [1, 'rgba(10,6,28,1)']]); ctx.fillRect(0, fy - 20, W, H - fy + 20);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, fy + 6, 10, 560, [[0, 'rgba(255,190,130,.32)'], [1, 'rgba(255,190,130,0)']]); ctx.beginPath(); ctx.ellipse(540, fy + 6, 560, 70, 0, 0, TAU); ctx.fill(); ctx.restore();
    V2.setLight({ key: [-.4, -.8], keyColor: '#fff0d8', keyA: .26, rim: '#ffd9a0', rimA: .6, shadow: '#1a1236', shadowA: .45, amb: '#ffb890', ambA: .1, back: { color: '255,196,140', a: .35, w: 14 }, frontDark: .1 });
    V2.opts.reflect = true;
    REG.suppress++;
    CAST.forEach(([kind, extra], i) => {
      const hop = Math.abs(Math.sin(lt * 4.2 + i)) * 14, pop = easeBack(seg(lt, .6 + i * .12, .95 + i * .12));
      if (pop <= 0) return;
      const o = Object.assign({ kind, id: kind, y: fy - hop, lift: kind === 'straw' ? -11.8 * extra.s * pop : 0, arms: { l: 'cheer', r: extra.both || 'wave' }, t: lt + i, transit: lt < 2.4 }, extra, { s: extra.s * pop });
      if (kind === 'clem') Object.assign(o, A10.clem({ x: extra.x, y: fy - hop, s: extra.s * pop, arms: o.arms, t: o.t, transit: o.transit, expr: extra.expr, lift: 0 }));
      drawChar(o);
    });
    REG.suppress--;
  },
  fx: lt => ({ bloom: .7, vignette: .42, grain: .05, contrast: .12, sat: .08, tint: [['#ffb890', .1, 'soft-light']], fade: lt < .25 ? 1 - lt / .25 : 0 }),
  blur: lt => 1,
  over(lt) {
    const lock = easeBack(seg(lt, .1, .55));
    text('THANKS FOR WATCHING', 540, 140, { size: 34, fill: '#ffd1e6', weight: 900, spacing: 10, lw: 8, alpha: seg(lt, .5, .85), maxW: 940 });
    if (lock > .06) { ctx.save(); ctx.translate(540, 0); ctx.scale(lock, lock);
      text('SHIFT HAPPENS', 0, 250, { size: 92, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 18, stroke: '#150f22', spacing: 4, shadow: 20 });
      text('TWO WEEKS\' NOTICE', 0, 366, { size: 116, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 18, stroke: '#150f22', spacing: 4, shadow: 24 });
      ctx.restore(); }
    // the sign-off: a yellow line, the dedication, the promise
    const pop = (at, y) => { const k = easeOut(seg(lt, at, at + .3)); return { alpha: k, y: y + 14 * (1 - k) }; };
    { const q = pop(1.0, 500); text('It was a very large donut.', 540, q.y, { size: 56, fill: '#ffe135', weight: 900, lw: 10, alpha: q.alpha, maxW: 960 }); }
    wrapLines('For every nurse who gave two weeks\' notice and worked a month.', '900 42px Nunito', 900).forEach((ln, i) => { const q = pop(2.3 + i * .15, 582 + i * 54); text(ln, 540, q.y, { size: 42, fill: '#ffffff', weight: 900, lw: 9, alpha: q.alpha, maxW: 960 }); });
    { const q = pop(3.9, 728); text('You are worth every R.', 540, q.y, { size: 64, fill: '#ffd1e6', weight: 900, lw: 11, alpha: q.alpha, maxW: 960 }); }
    for (let i = 0; i < 5; i++) rCoin(540 + (i - 2) * 106, 818, 42, (lt - (4.15 + i * .17)) / .4);
    // the teaser: the banner (one R short, as ever) over a strip that rolls out its own red carpet
    const tk = easeBack(seg(lt, 5.2, 5.7));
    if (tk > 0) {
      const sw = Math.sin(lt * 2.1) * .012;
      ctx.save(); ctx.translate(540, 1612); ctx.scale(tk, tk); ctx.rotate(sw);
      { const q = Math.min(tk, 1); reg('overlay', [540 - 320 * q, 1612 - 40 * q, 540 + 320 * q, 1612 + 68 * q], { id: 'teaser-banner' }); }
      ctx.strokeStyle = 'rgba(255,230,190,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-290, -34); ctx.lineTo(-266, -62); ctx.moveTo(290, -34); ctx.lineTo(266, -62); ctx.stroke();
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
      ctx.fillStyle = V2.grad(0, -34, 0, 34, [[0, '#e93a8a'], [1, '#b0185f']]); ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = 6; rr(-310, -34, 620, 68, 8); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
      text('WELCOME BACK STRAWBERY', 0, 3, { size: 46, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 7, stroke: '#6a0c3a', spacing: 2, maxW: 580 });
      for (let i = 0; i < 12; i++) { const px = -290 + i * 52.7; ctx.fillStyle = ['#ffd23a', '#4aa8ff', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 16, 36); ctx.lineTo(px + 16, 36); ctx.lineTo(px, 62 + 3 * Math.sin(lt * 3 + i)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.translate(540, 1768); ctx.scale(tk, tk);
      { const q = Math.min(tk, 1); reg('overlay', [540 - 480 * q, 1768 - 80 * q, 540 + 480 * q, 1768 + 80 * q], { id: 'teaser' }); }
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgba(14,10,36,.92)'; rr(-480, -80, 960, 160, 80); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,214,150,.9)'; ctx.lineWidth = 4; rr(-480, -80, 960, 160, 80); ctx.stroke();
      ctx.font = '900 30px Nunito'; ctx.letterSpacing = '6px'; const w1 = ctx.measureText('NEXT TIME').width; ctx.letterSpacing = '0px';
      ctx.font = '400 62px Bangers'; ctx.letterSpacing = '2px'; const w2 = ctx.measureText('EPISODE 11: WELCOME BACK').width; ctx.letterSpacing = '0px';
      const cx0 = -(120 + 36 + Math.max(w1, w2)) / 2 + 60, tx0 = cx0 + 60 + 36;
      // the runner unrolls from the roll along the bottom of the strip
      const rk = ez(lt, 5.6, 6.8), x0 = cx0 + 30, x1 = lerp(x0, 440, rk);
      ctx.save(); rr(-480, -80, 960, 160, 80); ctx.clip(); ctx.fillStyle = '#c4162f'; ctx.fillRect(x0, 46, x1 - x0, 22); ctx.fillStyle = '#e9c34c'; ctx.fillRect(x0, 46, x1 - x0, 4); ctx.fillRect(x0, 64, x1 - x0, 4); ctx.restore();
      ctx.save(); ctx.translate(cx0, -6); ctx.rotate(-rk * 5.2); ctx.translate(-cx0, 6); carpetRoll(cx0, -6, 48); ctx.restore();
      text('NEXT TIME', tx0, -34, { size: 30, fill: '#ffd1e6', weight: 900, align: 'left', spacing: 6 });
      text('EPISODE 11: WELCOME BACK', tx0, 14, { size: 62, font: 'Bangers', weight: 400, fill: '#ffffff', align: 'left', lw: 10, stroke: '#150f22', spacing: 2 });
      ctx.restore();
    }
  },
  label: () => 'THANKS FOR WATCHING',
};
window.__EP10_SCENES.end = END;
})();
