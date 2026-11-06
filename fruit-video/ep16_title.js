'use strict';
/* SHIFT HAPPENS, Episode 16: The Vote. Scene module CARDS-16: `title` (6.2 s) and `end` (7.0 s), registered on window.__EP16_SCENES. Prefix for anything new: fp16a_. Built on the Episode 15 sheet kit (SH15) and the UI kit; every
 * string goes through UI.label / UI.pill / UI.stamp, live each frame (no text in caches). The lettering follows ep15_title.js (copied, with a navy extrusion); the idea of each card is its own.
 *
 * TITLE (noChyron, noScrim): a survey form. A soft green poll card on a dark navy desk (a ghosted bubble sheet behind it): SHIFT HAPPENS small in the header, the question, five options as radio buttons, SUBMIT.
 *   Cues (scene-local s): theme15 .2 | click 1.2 | click 2.4 | stamp 2.8 | textding 4.0.
 *   0.00-0.20  fade up.   0.20-1.15  the form builds itself (logo types in, the question, the options pop one by one, SUBMIT).
 *   0.62-1.20  the pointer comes in from the left and arrives on Strawberry's radio exactly on the click (1.2): the dot ticks, then SNAPS BACK (1.34), the row shakes, the lock rattles, (ineligible) flashes red; Binder stays ticked.
 *   1.30-2.40  the pointer slips down the margin to SUBMIT and presses it on the click (2.4: the button sinks, a ring).
 *   2.42-2.78  the rows fly into the middle one after the other, the question follows, the card shrinks to a ballot slip, SHIFT HAPPENS climbs out of the header and grows.
 *   2.80       STAMP: VOTE CAST slams on the slip (a ring, a flash, a shake of the camera).   3.04  the slip bursts into ballots, the stamp fades,
 *   3.10-3.50  THE VOTE swells from the stamp (a 3 frame overshoot at 3.40, a ring), the EPISODE 16 pill pops (3.22), the tagline types in (3.52-3.95).   4.00 textding: a gloss crosses THE VOTE and SHIFT HAPPENS, stars.
 *   4.0-6.0 a held, centred card with a slow push-in and ballots drifting down behind the lettering; 6.08-6.2 a dip to black.
 * END: see the second half of this file. */
(() => {
/* the title of the next episode, shown in the end card's teaser banner under NEXT: EPISODE 17 (the lead confirms it: change this one constant) */
const TEASER17 = 'THE MODULE';
if (!window.TIMELINE_EP16 || !window.SH15 || !window.UI || !window.H6) return;
const SH = window.SH15, { zoomTo } = window.H6;
window.__EP16_SCENES = window.__EP16_SCENES || {};

// ------------------------------------------------------------------ palette and small maths (the episode's: navy desk, ballot gold, poll green, episode red)
const NAVY = '#0f1d38', NAVY_D = '#08122a', NAVY_L = '#1b3366', GOLD = '#ffd23a', YEL = '#ffe135', INK = '#07101f', RED = '#d93025', CREAM = '#f6efd2', GREEN = '#1e8e5a', DGREEN = '#14513b', TXT = '#14382a', PAPER = '#e6f5ea', ORANGE = '#e8782c';
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const eIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eO = k => 1 - Math.pow(1 - k, 3);
const eI = k => k * k * k;
const back = (k, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mixh = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (s) => Math.round(lp((A >> s) & 255, (B >> s) & 255, k)); return `rgb(${f(16)},${f(8)},${f(0)})`; };
const ringK = (age, tau) => age < 0 ? 0 : Math.exp(-age / tau);
const vgrad = (cap, stops, y0 = -1.03, y1 = .04) => { const g = ctx.createLinearGradient(0, cap * y0, 0, cap * y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
const FACE = [[0, '#fffbd0'], [.2, '#fff06a'], [.47, '#ffd21a'], [.5, '#ffb300'], [1, '#ff8a00']];
const FACE_LOGO = [[0, '#fff7a8'], [.46, '#ffe135'], [.5, '#ffc800'], [1, '#ffb000']];
/* measuring on a private canvas (ep15_title.js does the same): ink box and advance of a string, for the shine of the lettering */
const mcv = document.createElement('canvas'); mcv.width = mcv.height = 8; mcv.__txOK = true;
const mctx = mcv.getContext('2d'), MM = new Map();
function meas(str, size, font, weight, spacing) {
  const spec = `${weight} ${size}px ${font}`, key = spec + '|' + spacing + '|' + str, hit = MM.get(key);
  if (hit) return hit;
  mctx.font = spec; mctx.letterSpacing = spacing ? spacing + 'px' : '0px'; mctx.textAlign = 'left'; mctx.textBaseline = 'alphabetic';
  const m = mctx.measureText(str), r = { l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, adv: m.width };
  let ok = true; try { ok = document.fonts.check(spec); } catch (e) { /* no font api */ }
  if (ok) { if (MM.size > 3000) MM.clear(); MM.set(key, r); }
  return r;
}

/* Bangers lettering with a body (ep15_title.js, with a navy extrusion): soft drop shadow, a slab of extrusion, dark outline, gold rim, bright gradient face, gloss, sweeping shine. Only the face is the string the viewer
 * reads (hero when `hero`); every other layer is a decorative copy (hero:false, crop:true, one group). */
function bevelText(str, cx, cy, size, o = {}) {
  const font = 'Bangers', sp = o.spacing ?? size * .018, cap = UI.metrics(font).cap * size, alpha = o.alpha ?? 1, ex = o.extr ?? 1, lw = size * (o.lwK ?? .125), reveal = o.reveal ?? 1;
  if (alpha <= .004 || reveal <= 0 || size < 2) return null;
  const common = { font, size, spacing: sp, grp: o.grp || 'bv:' + str, tilt: .3, reveal, hero: false, crop: true };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv, alpha }, extra));
  const ext = o.ext || ['#2f5fd6', '#050d22'];
  if (o.shadow !== false) L(size * .03, size * .15 * ex + size * .03, 'rgba(1,4,12,.45)', 'rgba(1,4,12,.45)', lw * 1.45, { shadow: size * .14 });
  const n = Math.round(ex * size * .07);
  for (let i = n; i >= 1; i--) { const c = mixh(ext[0], ext[1], 1 - i / n * .6); L(i * .28, i, c, c, lw); }
  L(0, 0, INK, INK, lw);
  L(0, 0, o.rim || '#c47f0a', o.rim || '#c47f0a', lw * .55);
  const box = UI.label(str, cx, cy, Object.assign({}, common, { fill: vgrad(cap, o.face || FACE), lw: 0, alpha, hero: !!o.hero, crop: !o.hero }));
  L(0, 0, vgrad(cap, [[0, 'rgba(255,255,255,.46)'], [.4, 'rgba(255,255,255,.06)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), undefined, 0, {});
  if (o.shine != null && o.shine > -.3 && o.shine < 1.3) {
    const m = meas(str, size, font, 400, sp), x = lp(m.l - cap * .6, m.r + cap * .6, o.shine), g = ctx.createLinearGradient(x - cap * .5, -cap, x + cap * .5, 0);
    for (const [s, a] of [[0, 0], [.36, 0], [.5, o.shineA ?? .95], [.64, 0], [1, 0]]) g.addColorStop(s, `rgba(255,255,255,${a})`);
    L(0, 0, g, undefined, 0, {});
  }
  return box;
}
/* the red EPISODE pill (UI.pill: centred by construction) */
function episodePill(str, cx, cy, size, h, o = {}) {
  const a = o.alpha ?? 1, s = o.scale ?? 1;
  if (a <= .01 || s <= .01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  UI.pill(str, cx, cy, { font: 'Bangers', size, spacing: size * .09, fill: RED, ink: CREAM, stroke: INK, lw: Math.max(3, size * .12), h, padX: size * .62, tstroke: INK, tlw: size * .09, shadow: size * .1, hero: !!o.hero, crop: !o.hero, id: 'fp16a.pill' });
  ctx.restore();
}
function star(x, y, r, a, rot = 0) {
  if (a <= .01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(255,250,214,1)'; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const ang = i * PI / 4, rr2 = i % 2 ? r * .2 : r; ctx.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2); }
  ctx.closePath(); ctx.fill();
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .9); g.addColorStop(0, 'rgba(255,244,190,.8)'); g.addColorStop(1, 'rgba(255,244,190,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, TAU); ctx.fill();
  ctx.restore();
}
/* a soft shadow with no body: the shape is drawn 4000 px away and only its shadow lands here (ep15_title.js) */
function shadowOf(pathFn, a, blur = 64, dy = 26) {
  const m = ctx.getTransform(), D = 4000, k = D / (m.a || 1);
  ctx.save(); ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = -D; ctx.shadowOffsetY = dy; ctx.fillStyle = '#000';
  ctx.translate(k, 0); pathFn(); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ the desk: navy, a pool of light, and a bubble sheet (ballot ovals) ghosted behind everything; a few bubbles get filled in, one at a time
function stage(lt, o = {}) {
  const k = o.k ?? 1;
  ctx.save();
  const g = ctx.createLinearGradient(0, -300, 0, H + 300);
  g.addColorStop(0, '#09142b'); g.addColorStop(.45, NAVY); g.addColorStop(1, '#0a1630');
  ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800);
  const br = 1 + .03 * Math.sin(lt * 1.6);
  ctx.globalCompositeOperation = 'screen';
  let r = ctx.createRadialGradient(540, 960, 0, 540, 960, 1000 * br);
  r.addColorStop(0, rgba('#5b86ff', .27 * k)); r.addColorStop(.35, rgba('#2f5bd0', .15 * k)); r.addColorStop(1, rgba('#2f5bd0', 0));
  ctx.fillStyle = r; ctx.fillRect(-400, -400, W + 800, H + 800);
  r = ctx.createRadialGradient(540, 1720, 0, 540, 1720, 760);
  r.addColorStop(0, rgba('#ffd23a', .10 * k)); r.addColorStop(1, rgba('#ffd23a', 0));
  ctx.fillStyle = r; ctx.fillRect(-400, 900, W + 800, H);
  ctx.globalCompositeOperation = 'source-over';
  for (let row = -2; row <= 25; row++) for (let col = -1; col <= 9; col++) {
    const x = 60 + col * 120, y = 8 + row * 84, d = Math.hypot(x - 540, y - 960), a = .12 * cl(1 - d / 1150) * k;
    if (a <= .004) continue;
    const idx = (row + 3) * 17 + col, base = rnd(idx * 5.9) < .2, later = rnd(idx * 3.3) < .12 && lt > 3.4 + rnd(idx) * 2.6;   /* some bubbles are filled from the start; a few more get filled in as time passes */
    ctx.lineWidth = 2.5; ctx.strokeStyle = `rgba(160,190,255,${a})`;
    ctx.beginPath(); ctx.ellipse(x, y, 30, 17, 0, 0, TAU); ctx.stroke();
    if (base || later) { ctx.fillStyle = `rgba(160,190,255,${a * .8})`; ctx.fill(); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ effects: the flash and rings of a landing, the ballots that burst, the stars of the shimmer, the ballots that drift down behind the lettering
function ballot(x, y, s, rot, a, tick = true) {
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#f4f7ff'; ctx.beginPath(); ctx.roundRect(-18, -24, 36, 48, 4); ctx.fill();
  ctx.fillStyle = '#2f5fd6'; ctx.fillRect(-18, -24, 36, 8);
  if (tick) { ctx.strokeStyle = GREEN; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(-2, 11); ctx.lineTo(10, -4); ctx.stroke(); }
  ctx.restore();
}
function burst(age, cx, cy, n = 34) {
  if (age < 0 || age > 1.3) return;
  const cols = [YEL, '#ffffff', '#f4f7ff', GOLD, '#8fb0ff', '#ff6a5a'];
  for (let i = 0; i < n; i++) {
    const a = rnd(i * 3.7) * TAU, v = 380 + rnd(i * 5.1) * 1000, s0 = 8 + rnd(i * 7.3) * 20;
    const x = cx + Math.cos(a) * v * age * .9 * (1 - .35 * sg(age, 0, 1.3)), y = cy + Math.sin(a) * v * age * .9 + 1500 * age * age * (.4 + .6 * rnd(i * 1.3)) - 90 * Math.sin(age * 3);
    const fade = 1 - sg(age, .45, 1.25);
    if (fade <= .01) continue;
    if (i % 3 === 0) { ballot(x, y, .5 + rnd(i * 9.1) * .5, rnd(i * 2.2) * 6 + age * (rnd(i) - .5) * 14, fade); continue; }
    ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = cols[i % cols.length]; ctx.translate(x, y); ctx.rotate(rnd(i * 2.2) * 6 + age * (rnd(i) - .5) * 14);
    ctx.beginPath(); ctx.roundRect(-s0 / 2, -s0 * .35, s0, s0 * .7, 3); ctx.fill(); ctx.restore();
  }
}
function flashRing(age, cx, cy, o = {}) {
  const pre = o.pre ?? 0, post = age >= 0 ? ringK(age, o.tau ?? .12) : 0, a = Math.max(pre * .55, post) * (o.k ?? 1);
  if (a > .01) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r ?? 900); g.addColorStop(0, `rgba(255,255,255,${.78 * a})`); g.addColorStop(.28, `rgba(255,236,160,${.38 * a})`); g.addColorStop(1, 'rgba(255,236,160,0)');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
    V2.emit(cx, cy, 520, '255,236,150', .9 * a);
  }
  if (age >= 0 && age < .8) { ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(cx, cy, age / .8, { r0: 160, r1: o.r1 ?? 980, lw: 20, color: o.c1 || '255,244,176', alpha: .95, bloom: .6 }); V2.ring(cx, cy, Math.max(0, age - .09) / .8, { r0: 120, r1: (o.r1 ?? 980) * .78, lw: 10, color: o.c2 || '150,190,255', alpha: .7, bloom: .3 }); ctx.restore(); }
}
function drift(lt, t0) {
  if (lt < t0) return;
  for (let i = 0; i < 9; i++) {
    const per = 7.5 + rnd(i * 4.1) * 3, ph = ((lt - t0) / per + rnd(i * 9.3)) % 1, x = 90 + ((i * 117 + rnd(i * 2.7) * 140) % 900), y = lp(-80, 2000, ph);
    ballot(x, y, .75 + rnd(i * 6.1) * .5, Math.sin(lt * .8 + i) * .6 + rnd(i) * 3, .26 * sg(lt, t0, t0 + .8), i % 2 === 0);
  }
}
function sparkles(lt, T, ding, spots) {
  const age = lt - ding;
  if (age < -.05 || age > 2.2) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [dx, dy, r, d] of spots) { const k = sg(age, d, d + .5); star(540 + dx, T.cy + dy, r * Math.sin(Math.PI * k), 1, k * .8); }
  ctx.restore();
}
function twinkles(lt, T, tw) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [t0, dx, dy, r] of tw) { const k = sg(lt, t0, t0 + .5); if (k > 0 && k < 1) star(540 + dx, T.cy + dy, r * Math.sin(Math.PI * k), 1, k * .8); }
  ctx.restore();
}

// ------------------------------------------------------------------ the title: cues, the card's final layout (every element ink-centred on x 540) and the poll card's geometry
const CLICK1 = 1.2, CLICK2 = 2.4, STAMP = 2.8, BURST = 3.04, LAND = 3.40, DING = 4.0, TAG0 = 3.52, TAG1 = 3.95;
const CARD = { cx: 540, shift: { cy: 718, size: 128 }, pill: { cy: 852, size: 54, h: 88 }, title: { cy: 1046, size: 280 }, tag: { cy: 1232, size: 46 } };
const PC = { x: 60, y: 372, w: 960, h: 1176, r: 44, hdr: 130 };               /* the poll card */
const ROW = { x: 108, w: 864, h: 112, y0: 730, pitch: 126 };                 /* the option rows */
const BTN = { cx: 540, cy: 1450, w: 480, h: 96 };                            /* SUBMIT */
const LOGO0 = { y: 437, size: 64 };                                          /* the small SHIFT HAPPENS in the header band */
const SLIP = { x0: 170, y0: 800, x1: 910, y1: 1136 };                        /* the ballot slip the card shrinks to */
const SLIPC = [540, (SLIP.y0 + SLIP.y1) / 2];
const OPTS = [{ n: 'Lemon', ok: false }, { n: 'Mango', ok: false }, { n: 'Strawberry', ok: false }, { n: 'Clementine', ok: false }, { n: 'Binder (only candidate)', ok: true }];
const rowTop = i => ROW.y0 + i * ROW.pitch, rowCy = i => rowTop(i) + ROW.h / 2;
const RADIO_X = ROW.x + 62;

// ------------------------------------------------------------------ the pointer (screen coordinates): in from the left, onto Strawberry's radio on click 1, down the margin, onto SUBMIT on click 2
function pointer(lt) {
  const sb = [RADIO_X, rowCy(2)], aim = [BTN.cx - BTN.w / 2 + 84, BTN.cy];
  const c = SH.cursorPath([
    { t: .62, x: -40, y: 1000, kind: 'arrow' },
    { t: CLICK1, x: sb[0], y: sb[1], kind: 'arrow', click: [CLICK1 - .09, CLICK1 + .1], over: .04 },
    { t: 1.80, x: 100, y: 1296, kind: 'arrow' },
    { t: CLICK2, x: aim[0], y: aim[1], kind: 'arrow', click: [CLICK2 - .09, CLICK2 + .1], over: .05 },
    { t: 2.76, x: aim[0] + 70, y: aim[1] + 96, kind: 'arrow' },
  ], lt);
  const a1 = lt - CLICK1, a2 = lt - CLICK2;
  const ripple = a1 >= 0 && a1 < .45 ? sg(a1, 0, .45) : a2 >= 0 && a2 < .45 ? sg(a2, 0, .45) : 0;
  return { x: c.x, y: c.y, press: c.press, kind: c.kind, alpha: sg(lt, .62, .8) * (1 - sg(lt, 2.52, 2.74)), ripple };
}

// ------------------------------------------------------------------ small drawn icons (no text): the padlock and the radio
function lock(x, y, s, col, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(-9, -11); ctx.arc(0, -11, 9, PI, 0); ctx.lineTo(9, -3); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-15, -4, 30, 24, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(0, 6, 3.4, 0, TAU); ctx.fill(); ctx.fillRect(-1.6, 6, 3.2, 8);
  ctx.restore();
}
function radio(x, y, ring, dot, dotK) {
  ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = ring; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill(); ctx.stroke();
  if (dotK > .01) { ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(x, y, 14 * dotK, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the card: panel (shrinks to a ballot slip), question, rows, SUBMIT
function slipRect(lt) {
  const u = eIO(sg(lt, 2.46, 2.78));
  return { x0: lp(PC.x, SLIP.x0, u), y0: lp(PC.y, SLIP.y0, u), x1: lp(PC.x + PC.w, SLIP.x1, u), y1: lp(PC.y + PC.h, SLIP.y1, u), r: lp(PC.r, 28, u), band: lp(PC.hdr, 46, u), u };
}
function drawCard(lt) {
  if (lt >= BURST + .14) return;
  const s = slipRect(lt), bk = eO(sg(lt, BURST, BURST + .14)), cx = (s.x0 + s.x1) / 2, cy = (s.y0 + s.y1) / 2, w = s.x1 - s.x0, h = s.y1 - s.y0;
  ctx.save(); ctx.globalAlpha *= 1 - bk; ctx.translate(cx, cy); ctx.scale(1 + .16 * bk, 1 + .16 * bk); ctx.translate(-cx, -cy);
  shadowOf(() => { ctx.beginPath(); ctx.roundRect(s.x0, s.y0, w, h, s.r); }, .6, 70, 28);
  ctx.beginPath(); ctx.roundRect(s.x0, s.y0, w, h, s.r); ctx.save(); ctx.clip();
  const g = ctx.createLinearGradient(0, s.y0, 0, s.y1); g.addColorStop(0, '#edf8f0'); g.addColorStop(1, '#d4ecdc'); ctx.fillStyle = g; ctx.fillRect(s.x0, s.y0, w, h);
  ctx.fillStyle = '#16306b'; ctx.fillRect(s.x0, s.y0, w, s.band);
  ctx.fillStyle = GOLD; ctx.fillRect(s.x0, s.y0 + s.band - 5, w, 5);
  if (s.u > .3) {   /* the slip: a perforated edge and three bubbles, the middle one filled */
    ctx.globalAlpha *= sg(s.u, .3, .9); ctx.strokeStyle = 'rgba(20,56,42,.35)'; ctx.lineWidth = 3; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(s.x0 + 30, s.y1 - 40); ctx.lineTo(s.x1 - 30, s.y1 - 40); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(cx + (i - 1) * 74, s.y1 - 80, 26, 15, 0, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,56,42,.45)'; ctx.stroke(); if (i === 1) { ctx.fillStyle = 'rgba(20,56,42,.5)'; ctx.fill(); } }
  }
  ctx.restore();
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.roundRect(s.x0 + 2, s.y0 + 2, w - 4, h - 4, s.r - 2); ctx.stroke();
  ctx.restore();
}
function drawQuestion(lt) {
  const col = eIO(sg(lt, 2.50, 2.74)), lines = [['Who should be', 586, .30, .56], ['Employee of the Month?', 662, .42, .84]];
  if (col >= 1) return;
  const calm = lt < 2.46;
  ctx.save(); const k = lp(1, .3, col), px = lp(540, SLIPC[0], col), py = lp(624, SLIPC[1], col);
  ctx.globalAlpha *= 1 - sg(col, .35, 1); ctx.translate(px, py); ctx.scale(k, k); ctx.translate(-540, -624);
  for (const [t, y, a, b] of lines) { const r = sg(lt, a, b); if (r > 0) UI.label(t, 540, y, { size: 56, weight: 900, fill: TXT, reveal: r, hero: calm && r >= 1, crop: !(calm && r >= 1), maxW: 860 }); }
  ctx.restore();
}
function drawRow(i, lt) {
  const o = OPTS[i], p = sg(lt, .50 + i * .09, .72 + i * .09), pop = back(p, 2.0), col = eIO(sg(lt, 2.42 + i * .035, 2.66 + i * .035));
  if (p <= .01 || col >= 1) return;
  const calm = p >= 1 && col <= 0, top = rowTop(i), cy = rowCy(i), rcx = ROW.x + ROW.w / 2;
  const age = lt - CLICK1, straw = i === 2, ageB = lt - (CLICK1 + .2);
  const shake = straw && age > .14 ? Math.sin((age - .14) * 74) * 9 * Math.exp(-(age - .14) / .13) : 0, flash = straw && age >= .14 ? Math.exp(-(age - .14) / .4) : 0;
  const tick = straw ? (age < 0 ? 0 : age < .16 ? back(sg(age, 0, .07), 2.2) : 1 - eO(sg(age, .16, .23))) : 0;
  const k = lp(.55, 1, pop) * lp(1, .22, col);
  ctx.save(); ctx.globalAlpha *= sg(p, 0, .4) * (1 - sg(col, .45, 1));
  ctx.translate(lp(rcx, SLIPC[0], col) + shake, lp(cy, SLIPC[1], col)); ctx.scale(k, k); ctx.translate(-rcx, -cy);
  ctx.save();   /* the body */
  if (o.ok) { ctx.shadowColor = 'rgba(30,142,90,.45)'; ctx.shadowBlur = 24 + 8 * Math.sin(lt * 3); }
  ctx.fillStyle = o.ok ? '#ffffff' : '#dbe6e0'; ctx.strokeStyle = o.ok ? GREEN : '#c2d1c9'; ctx.lineWidth = o.ok ? 5 : 3;
  ctx.beginPath(); ctx.roundRect(ROW.x, top, ROW.w, ROW.h, ROW.h / 2); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  if (flash > .02) { ctx.fillStyle = `rgba(217,48,37,${.22 * flash})`; ctx.fill(); ctx.strokeStyle = `rgba(217,48,37,${.9 * flash})`; ctx.lineWidth = 5; ctx.stroke(); }
  ctx.restore();
  const dotK = o.ok ? 1 + .06 * Math.sin(lt * 3.2) + (lt >= CLICK1 + .2 ? .32 * Math.exp(-(lt - CLICK1 - .2) / .18) : 0) : tick;
  radio(RADIO_X, cy, o.ok ? GREEN : '#9aa8a1', GREEN, dotK);
  UI.label(o.n, ROW.x + 128, cy, { align: 'left', size: 42, weight: 900, fill: o.ok ? TXT : '#74837c', hero: calm, crop: !calm, maxW: o.ok ? 600 : 360 });
  if (!o.ok) {
    UI.label('(ineligible)', ROW.x + ROW.w - 118, cy, { align: 'right', size: 31, weight: 800, italic: true, fill: mixh('#a8554a', '#d93025', flash), hero: calm, crop: !calm, maxW: 240 });
    lock(ROW.x + ROW.w - 62, cy - 4, 1.0 + .1 * flash, mixh('#8a9892', '#d93025', flash), straw ? Math.sin(age * 58) * .34 * Math.exp(-Math.max(0, age) / .22) * (age > 0 ? 1 : 0) : 0);
  } else binderChip(ROW.x + ROW.w - 62, cy, lt);
  ctx.restore();
}
/* Binder's little avatar in his own row: a black clip with googly eyes on a pale disc (drawn, no sprite call: a tiny icon) */
function binderChip(x, y, lt) {
  ctx.save(); ctx.fillStyle = '#e5e8ec'; ctx.beginPath(); ctx.arc(x, y, 40, 0, TAU); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#5b6470'; ctx.stroke();
  ctx.fillStyle = '#15171c'; ctx.beginPath(); ctx.roundRect(x - 20, y - 18, 40, 38, [12, 12, 8, 8]); ctx.fill();
  ctx.strokeStyle = '#9aa2ad'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y - 22, 14, PI, 0); ctx.stroke();
  const pp = pointer(lt), seek = pp.alpha > .05 ? 1 : 0, lx = seek ? cl((pp.x - x) / 260, -1, 1) * 2.6 : Math.sin(lt * 1.3) * 2.2, ly = seek ? cl((pp.y - y) / 260, -1, 1) * 2 : 0, look = lx, blink = (lt % 2.6) > 2.5 ? .15 : 1;   /* his eyes follow the pointer */
  for (const dx of [-8, 8]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + dx, y - 4, 6.5, 7 * blink, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + dx + look * 1.1, y - 3 + ly, 3, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y + 5, 8, .15 * PI, .85 * PI); ctx.stroke();
  ctx.restore();
}
function drawSubmit(lt) {
  const p = sg(lt, 1.0, 1.2), col = eIO(sg(lt, 2.52, 2.76));
  if (p <= .01 || col >= 1) return;
  const pr = SH.cursorPath ? pointer(lt) : { press: 0 }, press = lt > 2.1 && lt < 2.62 ? pr.press : 0, a2 = lt - CLICK2;
  const hover = eIO(sg(lt, 2.2, 2.36)) * (1 - sg(lt, 2.5, 2.6));
  const calm = p >= 1 && col <= 0;
  ctx.save(); ctx.globalAlpha *= sg(p, 0, .5) * (1 - sg(col, .45, 1));
  const k = lp(.7, 1, back(p, 2)) * lp(1, .22, col); ctx.translate(lp(BTN.cx, SLIPC[0], col), lp(BTN.cy, SLIPC[1], col)); ctx.scale(k, k); ctx.translate(-BTN.cx, -BTN.cy);
  ctx.fillStyle = '#0f5c3a'; ctx.beginPath(); ctx.roundRect(BTN.cx - BTN.w / 2, BTN.cy - BTN.h / 2 + 8, BTN.w, BTN.h, BTN.h / 2); ctx.fill();   /* the button's base */
  UI.pill('SUBMIT', BTN.cx, BTN.cy + 8 * press, { font: 'Nunito', weight: 900, size: 44, spacing: 5, fill: mixh(GREEN, '#3fc784', hover * .6 + (a2 >= 0 && a2 < .2 ? .4 : 0)), ink: '#ffffff', h: BTN.h, minW: BTN.w, id: 'fp16a.submit', hero: calm, crop: !calm });
  ctx.restore();
}
function drawLogo(lt) {
  const e = eIO(sg(lt, 2.50, 3.1)), k = sg(lt, .20, .52), size = lp(LOGO0.size, CARD.shift.size, e), y = lp(LOGO0.y, CARD.shift.cy, e), ds = lt - DING;
  if (k <= 0) return;
  const settled = (lt >= .52 && lt < 2.5) || lt >= 3.1;
  bevelText('SHIFT HAPPENS', 540, y, size, { face: FACE_LOGO, extr: .35, lwK: .13, reveal: k, hero: settled && k >= 1, shine: ds > .12 ? eIO(sg(ds, .12, .85)) : -1, shineA: .8, grp: 'bv:logo' });
}
function drawStamp(lt) {
  const age = lt - STAMP;
  if (lt < STAMP - .1 || lt > BURST + .15) return;
  const k = sg(lt, STAMP - .09, STAMP), a = 1 - sg(lt, BURST - .01, BURST + .1), settle = lt >= STAMP ? 1 + .06 * Math.sin(Math.min(1, age / .16) * PI) * (1 - Math.min(1, age / .16)) * 2 : 1;
  const sc = lt < STAMP ? lp(2.1, 1, eI(k)) : 1 / settle;
  if (a <= .01) return;
  const hero = lt >= STAMP + .17 && lt < BURST - .02;
  ctx.save(); ctx.globalAlpha *= a * (lt < STAMP ? sg(k, 0, .5) : 1);
  ctx.translate(SLIPC[0], SLIPC[1]); ctx.scale(sc, sc); ctx.translate(-SLIPC[0], -SLIPC[1]);
  UI.stamp('VOTE CAST', SLIPC[0], SLIPC[1] - 6, { font: 'Bangers', size: 112, color: '#c4271f', rot: -.1, lw: 10, padX: 50, padY: 32, alpha: .95, hero, crop: !hero, grp: 'swap', id: 'fp16a.stamp' });
  ctx.restore();
}
function drawTitle(lt) {
  const e = eIO(sg(lt, 3.10, LAND)), a = sg(lt, 3.10, 3.2);
  if (a <= 0) return;
  const grow = lt < LAND - .02 ? eIO(sg(lt, 3.10, LAND - .02)) * 1.06 : lp(1.06, 1, eO(sg(lt, LAND - .02, LAND + .12)));
  const size = lp(CARD.title.size * .35, CARD.title.size, grow) * (1 + .03 * (lt >= LAND ? ringK(lt - LAND, .09) : 0)), rest = lt >= LAND + .14, ds = lt - DING;
  bevelText('THE VOTE', 540, lp(SLIPC[1], CARD.title.cy, e) - 24 * Math.sin(PI * e), size, { extr: sg(size, 90, 260), alpha: a, hero: rest, shine: ds > 0 ? eIO(sg(ds, 0, .78)) : -1, grp: 'swap' });
}
function drawPillTag(lt) {
  const p = sg(lt, 3.30, 3.54);
  if (p > 0) episodePill('EPISODE 16', 540, CARD.pill.cy, CARD.pill.size, CARD.pill.h, { alpha: sg(p, 0, .25), scale: lp(.5, 1, back(p, 2.2)), hero: lt >= 3.58 });
  const tg = sg(lt, TAG0, TAG1);
  if (tg > 0) UI.label('Every vote counts. Pending.', 540, CARD.tag.cy, { font: 'Nunito', weight: 900, italic: true, size: CARD.tag.size, fill: CREAM, stroke: NAVY_D, lw: 8, shadow: 12, reveal: tg, hero: tg >= 1, crop: tg < 1 });
}

// ------------------------------------------------------------------ the title scene
function titleDraw(lt) {
  stage(lt);
  drift(lt, LAND + .1);
  drawCard(lt);
  drawQuestion(lt);
  for (let i = 0; i < OPTS.length; i++) drawRow(i, lt);
  drawSubmit(lt);
  burst(lt - BURST, SLIPC[0], SLIPC[1]);
  drawStamp(lt);
  drawLogo(lt);
  drawTitle(lt);
  drawPillTag(lt);
  flashRing(lt - STAMP, 540, SLIPC[1], { pre: lt < STAMP ? Math.pow(sg(lt, STAMP - .1, STAMP), 2) : 0, tau: .1, r: 760, r1: 760, k: .8, c1: '255,196,170', c2: '255,140,120' });
  flashRing(lt - LAND, 540, CARD.title.cy, { pre: lt < LAND ? Math.pow(sg(lt, LAND - .16, LAND), 2) : 0 });
  sparkles(lt, CARD.title, DING, [[-340, -90, 38, 0], [-130, -110, 30, .13], [150, -104, 34, .24], [330, -72, 30, .36], [24, 100, 26, .48], [-270, 96, 22, .6], [250, 100, 24, .7]]);
  twinkles(lt, CARD.title, [[4.6, -300, -98, 26], [5.0, 280, 94, 24], [5.45, -50, -112, 28], [5.8, 330, -70, 22]]);
  if (lt < 2.8) {
    const pp = pointer(lt);
    if (pp.alpha > .01) { ctx.save(); ctx.globalAlpha *= pp.alpha; SH.pointer(pp.x, pp.y, { kind: pp.kind, press: pp.press, s: 1.25, ripple: pp.ripple }); ctx.restore(); }
  }
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'poll'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .014 * sg(lt, 0, STAMP) + .05 * eIO(sg(lt, LAND, 6.2)));
    CAM.shake = 7 * (lt >= STAMP ? ringK(lt - STAMP, .05) : 0) + 4 * (lt >= LAND ? ringK(lt - LAND, .05) : 0);
  },
  draw: titleDraw,
  fx(lt) {
    const land = lt >= LAND ? ringK(lt - LAND, .12) : 0, st = lt >= STAMP ? ringK(lt - STAMP, .1) : 0, fin = lt < .2 ? 1 - lt / .2 : 0, fout = sg(lt, 6.06, 6.2);
    return { bloom: .42 + .4 * land + .3 * st + .25 * sg(lt, LAND, 4.2), vignette: lp(.14, .4, sg(lt, 2.8, 3.8)), grain: .05, contrast: .12, sat: .06, aberr: 5 * land + 3 * st, tint: [['#ffb86b', .06 * sg(lt, LAND, 4.4), 'soft-light']], fade: Math.max(fin, fout), fadeColor: '2,6,16' };
  },
  blur(lt) { return lt < .2 ? 1 : (lt > 1.0 && lt < 1.22) ? 5 : (lt > 2.3 && lt < 2.45) ? 5 : (lt > 2.45 && lt < 2.8) ? 7 : (lt > 3.0 && lt < 3.56) ? 8 : 2; },
  over() {},
};
window.__EP16_SCENES.title = TITLE;

// =====================================================================================================================================================================================================
// END (7.0 s, noScrim, noChyron): THE RESULTS. The same floating GridSheet window as Episode 15's end card on the navy desk; tab Results: NAME | VOTES | STATUS with the portraits, the votes drawn as bars (the winner's gold,
// Strawberry's one real ballot a sliver). Layout (window-local): title block A1:D2 (84 + 116, navy: THANKS FOR WATCHING over SHIFT HAPPENS), header row 56, nine rows of 116 (portrait 96 | NAME 288 | VOTES 224 | STATUS 432
// = 1040, symmetric about the frame's centre), a footnote row of 52; the zone under the table is the stamp's, then the teaser banner's.
//   Cues (scene-local s): theme15 .10 | typing 1.10 | click 3.10 | stamp 4.00 | textding 5.10.
//   0.00-0.10 fade up.   0.12-0.85 THANKS FOR WATCHING types in, SHIFT HAPPENS pops in (the theme), the header row types.
//   1.10-2.36 the roster types in, one row every 0.14 s (the portrait pops, then NAME, VOTES with its bar, STATUS), the selection hops along the cells being typed, the formula bar follows.
//   2.50 the Save As dialog pops in over the dimmed sheet; 2.66-2.98 the file name types in; the pointer arrives and PRESSES SAVE on the click (3.10); 3.14-3.32 the dialog closes, the title bar reads ELECTION_FINAL_v2_VOID.
//   4.00 STAMP: CERTIFIED? slams down in the empty zone under the table (a ring, a shake of the camera), gone by 4.5.
//   4.46-4.76 a new tab, Sheet17 (amber), grows at the end of the tab bar, glows, and LIFTS OFF (4.76-5.04) as the banner NEXT: EPISODE 17 / THE MODULE.   5.10 textding: a gloss sweeps across THE MODULE and SHIFT HAPPENS, stars.
//   Idle to 6.8: the portraits breathe and blink, Tomato changes her mind every 1.6 s, the winner's row glows, the tab glows, a light sweeps the window.   6.8-7.0 fade to dark. */
const WIN = { x: 20, y: 20, w: 1040, h: 1880, r: 28 };
const EC = { A: 96, B: 288, C: 224, D: 432 };
const ER = (() => { const r = { 1: 84, 2: 116, 3: 56, 13: 52 }; for (let i = 4; i <= 12; i++) r[i] = 116; return r; })();
const TONE = {
  err: { color: '#d93025', fill: '#fde7e5' }, amber: { color: '#8f5600', fill: '#fff1c4' }, green: { color: '#0f6b3c', fill: '#e3f4ea' }, blue: { color: '#1f55c8', fill: '#dbe7ff' }, plain: { color: '#22262b', fill: null },
  gold: { color: '#6b4200', fill: '#ffe08a' },
};
const ROSTER = [
  { name: 'Binder', votes: 48, status: 'WINNER (INCUMBENT)', tone: 'gold', bg: '#e5e8ec', ring: '#5b6470', ctor: 'bind', expr: null, s: .3, bar: '#ffb800' },
  { name: 'Strawberry', votes: 1, status: 'PENDING', tone: 'amber', bg: '#ffe2cf', ring: ORANGE, ctor: 'straw', expr: 'weak', s: .27, bar: '#ff5a3c' },
  { name: 'Lemon', votes: 0, status: 'INELIGIBLE', tone: 'err', bg: '#fff3b8', ring: ORANGE, ctor: 'lemon', expr: 'sour', s: .27 },
  { name: 'Mango', votes: 0, status: 'INELIGIBLE', tone: 'err', bg: '#ffe7c2', ring: ORANGE, ctor: 'mango', expr: 'neutral', s: .25 },
  { name: 'Clementine', votes: 0, status: 'INELIGIBLE', tone: 'err', bg: '#ffe2cf', ring: ORANGE, ctor: 'clem', expr: 'happy', s: .29 },
  { name: 'Melon', votes: 0, status: 'ABSTAINED', tone: 'plain', bg: '#f4ead2', ring: ORANGE, ctor: 'melon', expr: 'smug', s: .27 },
  { name: 'Onion', votes: 0, status: 'COUNTING', tone: 'blue', bg: '#e6e2fb', ring: '#6d5bd0', ctor: 'onion', expr: null, s: .26 },
  { name: 'Tomato', votes: 0, status: 'EFFICIENCY', tone: 'amber', bg: '#e6e2fb', ring: '#6d5bd0', ctor: 'tomato', expr: null, s: .26 },
  { name: 'Unassigned (40)', votes: 40, status: 'COUNTED', tone: 'blue', bg: '#ffe2cf', ring: '#8a96a6', ctor: 'straw', expr: 'weak', s: .17, clones: [-17, 17, 0], bar: '#2b6cff' },
];
const E = { type0: 1.10, dt: .14, dlgIn: 2.50, nameA: 2.66, nameB: 2.98, click: 3.10, dlgOut: 3.14, dlgGone: 3.34, stamp: 4.0, stampOut: 4.4, tab: 4.46, lift: 5.04, ding: 5.10, out: 6.8 };
const rowT = i => E.type0 + i * E.dt;
const STAMP_TXT = 'CERTIFIED?', STAMP_COL = '#1e8e5a', STAMP_RING = '120,235,170', BANNER = ['#1b3a80', '#0f2250'], TEASER_A = 'NEXT: EPISODE 17', TEASER_B = TEASER17;
const FILES = ['ELECTION_FINAL_v1.gsx', 'ELECTION_FINAL_v2.gsx', 'BALLOTS_48_COUNTED_ONCE.gsx', 'RESULTS_DO_NOT_RECOUNT.gsx'], FOLDER = 'Election';
const FILE = 'ELECTION_FINAL_v2_VOID', NEWTAB = 'Sheet17', TABS = ['Ballots', 'Results'];
const EBASE = {
  w: WIN.w, h: WIN.h, doc: 'EMPLOYEE_OF_THE_MONTH_RESULTS', saved: false, cols: EC, rows: ER, merges: ['A1:D2', 'A13:D13'], handle: false,
  ribbon: { collapsed: true, tab: 'Home' }, show: { title: true, ribbon: true, formula: true, headers: false, sheetTabs: true, status: true },
};
let EGEO = null;
function egeo() {
  if (EGEO) return EGEO;
  const o = Object.assign({}, EBASE, { tabs: TABS }), L = SH.layout(o);
  EGEO = { L, o, rc: ref => SH.cellRect(ref, o), gx0: L.gx0, gy0: L.gy0, gx1: L.gx1, gy1: L.gy1 };
  return EGEO;
}
const prefix = (s, k) => k >= 1 ? s : s.slice(0, Math.ceil(s.length * k));
const tabsFor = lt => TABS.concat(lt >= E.tab ? [{ name: NEWTAB, u: eIO(sg(lt, E.tab, E.tab + .3)), color: '#ffbf1f' }] : []);
/* the window-local rectangle of a sheet tab (the kit's own formulas) */
function tabRect(name, lt) {
  const G = egeo(), tabs = tabsFor(lt), y0 = G.L.stabs[0], h = G.L.stabs[1];
  let x = 84;
  for (const tb of tabs) { const n = typeof tb === 'object' ? tb.name : tb, w = UI.sizeOf(n, { size: 22, weight: 800 }).w + 44; if (n === name) return { x, y: y0, w, h, cx: x + w / 2, cy: y0 + h / 2 }; x += w; }
  return null;
}

/* the cells of the moment: the title block, the header, the roster typing in; the selection hops along the cell being typed */
function endState(lt) {
  const cells = { A1: { v: '', fill: '#13285a' } }, hero = !(lt >= E.dlgIn && lt < E.dlgGone);   /* under the dim of the dialog nothing is hero */
  const hk = sg(lt, .55, .85), hdr = { fill: '#13285a', color: CREAM, size: 26, weight: 900, spacing: 3, hero: false };
  cells.A3 = { v: '', fill: '#13285a' }; cells.B3 = Object.assign({ v: 'NAME', typed: hk }, hdr); cells.C3 = Object.assign({ v: 'VOTES', typed: hk, pad: 22 }, hdr); cells.D3 = Object.assign({ v: 'STATUS', typed: hk, pad: 16 }, hdr);   /* header text starts where the cell text starts */
  cells.A13 = { v: '* 40 unassigned voters were eligible. Per policy.', typed: sg(lt, 2.2, 2.5), italic: true, size: 30, weight: 700, color: '#5b6470', align: 'center', hero: hero && !(lt >= E.stamp - .16 && lt < E.stampOut + .1), fill: '#ffffff' };
  let active = 'A1', ftxt = '', fk = 1;
  ROSTER.forEach((p, i) => {
    const r = 4 + i, t0 = rowT(i), zebra = lt < t0 ? undefined : i % 2 ? '#f2f5fb' : '#ffffff', tn = TONE[p.tone];
    const kB = sg(lt, t0 + .02, t0 + .12), kC = sg(lt, t0 + .06, t0 + .16), kD = sg(lt, t0 + .10, t0 + .22);
    cells['A' + r] = { v: '', fill: zebra };
    cells['B' + r] = { v: p.name, typed: kB, fill: zebra, size: 30, weight: 900, color: '#0d1b3a', hero, pad: 12 };
    cells['C' + r] = { v: String(p.votes), typed: kC, fill: zebra, size: 32, weight: 900, color: p.votes ? '#0d1b3a' : '#7b8794', hero, pad: 22, align: 'left' };
    cells['D' + r] = { v: p.status, typed: kD, fill: lt < t0 + .1 ? zebra : tn.fill || zebra, size: 30, weight: 900, color: tn.color, hero, pad: 16, align: 'left' };
    if (lt >= t0 + .02) { const pick = lt < t0 + .06 ? ['B', p.name, kB] : lt < t0 + .10 ? ['C', String(p.votes), kC] : ['D', p.status, kD]; active = pick[0] + r; ftxt = pick[1]; fk = pick[2]; }
  });
  return { cells, active, ftxt, fk };
}
function endOpts(lt) {
  const st = endState(lt), dlg = lt >= E.dlgIn && lt < E.dlgGone, last = 4 + ROSTER.length - 1;
  const o = Object.assign({}, EBASE, {
    cells: st.cells, tabs: tabsFor(lt), tab: 'Results', status: 'Ready', stats: lt > E.type0 + ROSTER.length * E.dt ? ['Count: 9'] : [],
    sel: st.active, active: st.active, nameBox: st.active, formula: { text: st.ftxt, typed: st.fk }, selFill: false,
  });
  const saved = lt >= E.dlgOut;
  o.doc = saved ? FILE : EBASE.doc; o.saved = saved ? 'Saved' : false;
  if (lt >= E.type0 + ROSTER.length * E.dt + .1) { o.sel = 'D' + last; o.active = 'D' + last; o.nameBox = 'D' + last; o.formula = { text: 'COUNTED', typed: 1 }; }
  if (lt >= E.dlgIn) { o.sel = 'D' + last; o.selK = 0; }
  if (dlg) o.dressing = true;
  return o;
}

// ------------------------------------------------------------------ the portraits: the sprites at small scale, cropped to a disc, centred in column A of their row (ep15_title.js, with clones for the unassigned voters)
const PORT_FALLBACK = new Set();
function portraitCtor(key) {
  const g = window;
  return { straw: () => (g.A11 && g.A11.straw) || (g.A7 && g.A7.straw), lemon: () => g.A7 && g.A7.lemon, mango: () => g.A7 && g.A7.mango, clem: () => g.A10 && g.A10.clem, melon: () => g.A9 && g.A9.melon,
    arti: () => g.A15 && g.A15.artichoke, onion: () => g.A15 && g.A15.onion, tomato: () => g.A15 && g.A15.tomato, bind: () => g.A15 && g.A15.binder }[key]();
}
function portrait(p, i, lt) {
  const t0 = rowT(i), k = sg(lt, t0, t0 + .2);
  if (k <= 0) return;
  const R = egeo().rc('A' + (4 + i)), cx = WIN.x + R.cx, cy = WIN.y + R.cy, rad = 40, pop = back(k, 2.4);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy); ctx.globalAlpha *= sg(k, 0, .35);
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fillStyle = p.bg; ctx.fill();
  const ctor = portraitCtor(p.ctor);
  if (ctor) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rad - 1, 0, TAU); ctx.clip();
    for (const dx of (p.clones || [0])) {
      try {
        const x = { t: lt + (dx ? dx * .013 : 0), noLegs: true, noShadow: true, noReflect: true, s: p.s, x: 0, y: 0 };
        if (p.ctor === 'tomato') { const ph = Math.max(0, lt - t0 - .3), n = Math.floor(ph / 1.6), pose = n % 2 ? 'veg' : 'fruit'; Object.assign(x, { tomPose: pose, tomFrom: n % 2 ? 'fruit' : 'veg', flipT: n > 0 || ph > 0 ? Math.min(.6, ph - n * 1.6) : 1 }); }
        if (p.ctor === 'bind') Object.assign(x, { grin: .55, glint: .5 + .5 * Math.sin(lt * 2.4), center: true, bob: 0, hover: 0 });
        if (p.expr) x.expr = p.expr;
        if (p.ctor === 'onion') x.pose = 'rest';
        if (p.ctor === 'tomato') x.formsN = 0;
        const o = Object.assign(ctor(x), x);
        if (p.ctor === 'tomato' || p.ctor === 'onion') o.hold = {};   /* a portrait carries no props: they would cover the small faces */
        if (p.ctor === 'bind') { o.x = cx; o.y = cy - 12 * p.s; }
        else { const [fx, fy] = window.H6.faceC(o); o.x = cx - fx + dx; o.y = cy - fy + 4 + (dx ? Math.abs(dx) * .12 : 0); }
        drawChar(o);
      } catch (e) { if (!PORT_FALLBACK.has(p.name)) { PORT_FALLBACK.add(p.name); console.error('CARDS16 portrait ' + p.name + ': ' + e.message); } }
    }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = p.ring; ctx.stroke();
  ctx.restore();
}
/* the votes as bars in the VOTES cell, right of the number; the winner's row glows gold */
function rowExtras(lt) {
  const G = egeo();
  ROSTER.forEach((p, i) => {
    const t0 = rowT(i), R = G.rc('C' + (4 + i)), x0 = WIN.x + R.x + 96, x1 = WIN.x + R.x + R.w - 18, y = WIN.y + R.cy, k = eO(sg(lt, t0 + .12, t0 + .55));
    if (lt < t0 + .1) return;
    ctx.save(); ctx.fillStyle = 'rgba(30,50,90,.09)'; ctx.beginPath(); ctx.roundRect(x0, y - 12, x1 - x0, 24, 8); ctx.fill();
    if (p.votes > 0) { const w = Math.max(5, (x1 - x0) * p.votes / 48 * k); ctx.fillStyle = p.bar; ctx.beginPath(); ctx.roundRect(x0, y - 12, w, 24, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.roundRect(x0 + 2, y - 10, Math.max(1, w - 4), 8, 4); ctx.fill(); }
    ctx.restore();
  });
  if (lt >= rowT(0) + .55) {   /* the incumbent's crown, tilted on his clip */
    const R = G.rc('A4'), k = back(sg(lt, rowT(0) + .55, rowT(0) + .8), 2.4), bob = Math.sin(lt * 2.6) * 1.2;
    ctx.save(); ctx.translate(WIN.x + R.cx - 25, WIN.y + R.cy - 38 + bob); ctx.rotate(-.42); ctx.scale(k, k);
    ctx.fillStyle = '#ffc800'; ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-18, 10); ctx.lineTo(-22, -14); ctx.lineTo(-9, -3); ctx.lineTo(0, -19); ctx.lineTo(9, -3); ctx.lineTo(22, -14); ctx.lineTo(18, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5a3c'; ctx.beginPath(); ctx.arc(0, 2, 3.6, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (lt >= rowT(0) + .5) {
    const a = rowT(0), R = G.rc('B4'), R2 = G.rc('D4'), pulse = .5 + .5 * Math.sin(lt * 3.2);
    ctx.save(); ctx.strokeStyle = `rgba(255,184,0,${.65 + .3 * pulse})`; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(255,184,0,.7)'; ctx.shadowBlur = 14 + 10 * pulse; ctx.globalAlpha *= sg(lt, a + .5, a + .8);
    ctx.beginPath(); ctx.roundRect(WIN.x + R.x + 2, WIN.y + R.y + 2, R2.x1 - R.x - 4, R.h - 4, 10); ctx.stroke(); ctx.restore();
  }
}

// ------------------------------------------------------------------ the title block, the stamp, the teaser banner
let ZC = null;
const zoneCy = () => ZC ?? (ZC = Math.round((WIN.y + egeo().rc('A13').y1 + WIN.y + egeo().L.stabs[0]) / 2));   /* the empty zone under the table (screen): the stamp lands here, then the banner lifts into it */
function endTitle(lt, dim) {
  const gy = WIN.y + egeo().gy0, k1 = sg(lt, .12, .42), p = sg(lt, .2, .6), pop = back(p, 2.0), ds = lt - E.ding;
  if (k1 > 0) UI.label('THANKS FOR WATCHING', 540, gy + 45, { font: 'Nunito', weight: 900, size: 32, spacing: 7, fill: CREAM, reveal: k1, hero: k1 >= 1 && !dim, crop: k1 < 1 || dim, maxW: 900 });
  if (p > 0) {
    const cy = gy + 118, sc = lp(1.28, 1, pop);
    ctx.save(); ctx.translate(540, cy); ctx.scale(sc, sc); ctx.translate(-540, -cy);
    bevelText('SHIFT HAPPENS', 540, cy, 104, { face: FACE_LOGO, extr: .35, lwK: .13, alpha: sg(p, 0, .3), hero: p >= 1 && !dim, shine: ds > .15 ? eIO(sg(ds, .15, .85)) : -1, shineA: .8, grp: 'bv:end-logo' });
    ctx.restore();
  }
}
function stampFx(lt) {
  const age = lt - E.stamp, Z = zoneCy();
  if (lt < E.stamp - .1 || lt > E.tab + .3) return;
  const k = sg(lt, E.stamp - .09, E.stamp), a = 1 - sg(lt, E.stampOut, E.stampOut + .15), settle = lt >= E.stamp ? 1 + .06 * Math.sin(Math.min(1, age / .16) * PI) * (1 - Math.min(1, age / .16)) * 2 : 1;
  const sc = lt < E.stamp ? lp(1.4, 1, eI(k)) : 1 / settle, hero = lt >= E.stamp + .17 && lt < E.stampOut - .02;
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a * (lt < E.stamp ? sg(k, 0, .5) : 1);
  ctx.translate(540, Z); ctx.scale(sc, sc); ctx.translate(-540, -Z);
  UI.stamp(STAMP_TXT, 540, Z, { font: 'Bangers', size: 118, color: STAMP_COL, rot: -.1, lw: 11, padX: 62, padY: 37, alpha: .94, hero, crop: !hero, id: 'fp16a.stamp' });
  ctx.restore();
  if (age >= 0 && age < .7) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(540, Z, age / .7, { r0: 90, r1: 560, lw: 14, color: STAMP_RING, alpha: .85, bloom: .5, squash: .55 }); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const f = ringK(age, .09), g = ctx.createRadialGradient(540, Z, 0, 540, Z, 520); g.addColorStop(0, `rgba(${STAMP_RING},${.45 * f})`); g.addColorStop(1, `rgba(${STAMP_RING},0)`); ctx.fillStyle = g; ctx.fillRect(0, Z - 520, W, 1040); ctx.restore();
  }
}
function tabGlow(lt) {
  if (lt < E.tab) return;
  const t = tabRect(NEWTAB, lt), ku = eIO(sg(lt, E.tab, E.tab + .3));
  if (!t || ku <= .02) return;
  const x = WIN.x + t.x, y = WIN.y + t.y, w = t.w * eO(ku), pulse = .5 + .5 * Math.sin(lt * 5.2);
  ctx.save();
  ctx.fillStyle = '#ffbf1f'; ctx.beginPath(); ctx.roundRect(x, y + 1, w, t.h - 1, [0, 0, 10, 10]); ctx.fill();   /* a solid amber tab over the kit's own: same rectangle */
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.roundRect(x, y + 1, w, 6, 3); ctx.fill();
  if (ku >= .6) UI.label(NEWTAB, x + w / 2, y + t.h / 2 + 2, { size: 22, weight: 900, fill: '#3b2a00', alpha: sg(ku, .6, 1), hero: false, crop: true, maxW: w - 24 });
  ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x + w / 2, y + t.h / 2, 0, x + w / 2, y + t.h / 2, 130); g.addColorStop(0, `rgba(255,200,60,${.4 * ku * (.55 + .45 * pulse)})`); g.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 130, y - 110, w + 260, 240);
  ctx.restore();
}
function nextBanner(lt) {
  const t = tabRect(NEWTAB, lt), Z = zoneCy();
  if (!t || lt < E.tab + .1) return;
  const p = sg(lt, E.tab + .1, E.lift), e = back(p, 1.5), bw = 880, bh = 168, bx = 540 - bw / 2, by = Z - bh / 2 + 2 * Math.sin(lt * 2.2) * sg(lt, E.lift, E.lift + .3);
  const tx = WIN.x + t.x, ty = WIN.y + t.y, X = lp(tx, bx, e), Y = lp(ty, by, e), Wd = lp(t.w, bw, e), Hd = lp(t.h, bh, e), r = lp(10, 26, Math.min(1, e));
  const rest = p >= 1;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 36 * Math.min(1, e); ctx.shadowOffsetY = 14 * Math.min(1, e);
  const g = ctx.createLinearGradient(0, Y, 0, Y + Hd); g.addColorStop(0, BANNER[0]); g.addColorStop(1, BANNER[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(X, Y, Wd, Hd, r); ctx.fill(); ctx.restore();
  ctx.save(); ctx.strokeStyle = '#ffbf1f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(X + 2, Y + 2, Wd - 4, Hd - 4, r - 2); ctx.stroke(); ctx.restore();
  const ta = sg(p, .5, .9);
  if (ta > 0) {
    const ds = lt - E.ding, cy1 = Y + 46, cy2 = Y + 114;
    UI.label(TEASER_A, 540, cy1, { font: 'Nunito', weight: 900, size: 34, spacing: 6, fill: CREAM, alpha: ta, hero: rest, crop: !rest, maxW: 800 });
    bevelText(TEASER_B, 540, cy2, 96, { face: FACE, extr: .3, lwK: .12, alpha: ta, hero: rest, shine: ds > 0 ? eIO(sg(ds, 0, .8)) : -1, grp: 'bv:teaser' });
  }
}
function endFx(lt) {
  const ds = lt - E.ding, Z = zoneCy(), top = WIN.y + egeo().gy0 + 118;
  if (ds < -.05 || ds > 2.2) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const spots = [[-300, Z - 74, 30, 0], [-120, Z - 108, 24, .1], [170, Z - 102, 28, .2], [330, Z - 46, 26, .32], [40, Z + 84, 22, .42], [-380, top - 30, 30, .05], [350, top - 60, 28, .25]];
  for (const [dx, y, r, d] of spots) { const k = sg(ds, d, d + .5); star(540 + dx, y, r * Math.sin(Math.PI * k), 1, k * .8); }
  ctx.restore();
}

// ------------------------------------------------------------------ the Save As dialog and its pointer
function dlgOpts(lt) {
  const n = Math.round(FILE.length * sg(lt, E.nameA, E.nameB)), p = savePointer(lt);
  return { kind: 'saveAs', w: WIN.w, h: WIN.h, at: [WIN.w / 2, 700], name: [FILE, SH.typed(n, FILE.length)], press: { id: 'save', k: p.press }, btnFocus: 'save', t: lt, files: FILES, folder: FOLDER, path: 'Documents  /  ' + FOLDER };
}
function savePointer(lt) {
  const aim = SH.dialogRect({ kind: 'saveAs', w: WIN.w, h: WIN.h, at: [WIN.w / 2, 700] }, 'save').aim;
  const c = SH.cursorPath([{ t: 2.52, x: 900, y: 1190, kind: 'arrow' }, { t: 3.04, x: aim[0] + 46, y: aim[1] + 10, kind: 'arrow', click: [E.click - .09, E.click + .1], over: .04 }, { t: 3.4, x: aim[0] + 58, y: aim[1] + 18, kind: 'arrow' }], lt);
  return { x: c.x, y: c.y, press: c.press, alpha: sg(lt, 2.52, 2.7) * (1 - sg(lt, 3.2, 3.33)) };
}
function endDraw(lt) {
  stage(lt);
  const o = endOpts(lt), dlgOn = lt >= E.dlgIn && lt < E.dlgGone;
  ctx.save(); ctx.translate(WIN.x, WIN.y);
  shadowOf(() => { ctx.beginPath(); ctx.roundRect(0, 0, WIN.w, WIN.h, WIN.r); }, .6);
  SH.sheet(Object.assign({}, o, { r: WIN.r }), lt);
  ctx.restore();
  ROSTER.forEach((p, i) => portrait(p, i, lt));
  rowExtras(lt);
  endTitle(lt, dlgOn);
  tabGlow(lt);
  if (dlgOn) {
    ctx.save(); ctx.translate(WIN.x, WIN.y);
    const u = Math.min(sg(lt, E.dlgIn, E.dlgIn + .16), 1 - sg(lt, E.dlgOut, E.dlgOut + .2));
    SH.dialog(dlgOpts(lt), u);
    ctx.restore();
  }
  stampFx(lt);
  nextBanner(lt);
  endFx(lt);
  // a soft light sweeps the window now and then
  const sw = ((lt - 5.6) % 3.4 + 3.4) % 3.4 / 1.1;
  if (lt > 5.6 && sw < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const x = lp(-200, 1280, eIO(sw)), g = ctx.createLinearGradient(x - 160, 0, x + 160, 380); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); ctx.fill(); ctx.restore(); }
  if (lt >= 2.5 && lt < 3.62) {
    const pp = savePointer(lt);
    if (pp.alpha > .01) { ctx.save(); ctx.translate(WIN.x, WIN.y); ctx.globalAlpha *= pp.alpha; SH.pointer(pp.x, pp.y, { kind: 'arrow', press: pp.press, s: 1.25 }); ctx.restore(); }
  }
}
const END = {
  noChyron: true, noScrim: true,
  shot() { return 'sheet'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .022 * eIO(sg(lt, 0, 7)));
    CAM.shake = 5 * (lt >= E.stamp ? ringK(lt - E.stamp, .05) : 0);
  },
  draw: endDraw,
  fx(lt) {
    const fin = lt < .1 ? 1 - lt / .1 : 0, fout = sg(lt, E.out, 7), st = lt >= E.stamp ? ringK(lt - E.stamp, .1) : 0, dd = lt >= E.ding ? ringK(lt - E.ding, .5) : 0;
    return { bloom: .4 + .35 * st + .25 * dd, vignette: .16, grain: .045, contrast: .1, sat: .05, aberr: 3 * st, tint: [['#ffb86b', .05, 'soft-light']], fade: Math.max(fin, fout), fadeColor: '2,6,16' };
  },
  blur(lt) { return (lt > 2.7 && lt < 3.1) ? 4 : (lt > E.stamp - .12 && lt < E.stamp + .12) ? 6 : (lt > E.tab && lt < E.lift + .05) ? 5 : 2; },
  over() {},
  label: () => 'THANKS FOR WATCHING',
};
window.__EP16_SCENES.end = END;
})();
