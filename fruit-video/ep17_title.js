'use strict';
/* SHIFT HAPPENS, Episode 17: The Module. Scene module CARDS-17: `title` (6.2 s) and `end` (7.0 s), registered on window.__EP17_SCENES. Prefix for anything new: fp17a_. Built on the Episode 15 sheet kit (SH15) and the UI kit;
 * every string goes through UI.label / UI.pill / UI.stamp, live each frame (no text in caches). The lettering follows ep15_title.js (copied, with an indigo extrusion); the idea of each card is its own.
 *
 * TITLE (noChyron, noScrim): a learning-platform page, LearnWell (an invented app). Top bar with its logo and an avatar, a course card: MANDATORY: MODULE 7 OF 7, a thumbnail, the course name, Estimated time 4:00:00, a progress
 *   bar, START, and a greyed SKIP. Cues (scene-local s): theme15 .2 | click 1.2 | spinner 1.8 | click 2.8 | textding 4.0.
 *   0.00-0.20  fade up.   0.20-1.10  the page builds itself, one element after the other (the top bar drops in, the card rises, the rows slide up).
 *   0.62-1.20  the pointer comes in from the left and arrives on START exactly on the click (1.2): the button sinks, then shrinks into a round loader, the spinner starts to turn, the thumbnail dims.
 *   1.80       SPINNER cue: the bar zips from 0 to 99 percent, the figure jumps 0% to 99%, and STOPS: the spinner keeps turning.   1.95-2.80 the pointer slides down to SKIP.
 *   2.80       click on SKIP (greyed, with a lock): it shakes, a toast drops in from the top bar: Skipping is not available.
 *   2.92-3.50  the page is eaten by an iris that grows from the loader; the loader and its 99% glide into their place under the tagline; SHIFT HAPPENS pops (3.12), THE MODULE types in and swells (3.08-3.46, a 3 frame
 *              overshoot at 3.46, a ring, a burst of pixels), the EPISODE 17 pill pops (3.26), the tagline types in (3.52-3.95).   4.00 textding: a gloss crosses THE MODULE and SHIFT HAPPENS, stars.
 *   4.0-6.0 a held, centred card with a slow push-in, the loader still turning (the joke), a page-load bar stuck at 99 percent along the bottom edge; 6.08-6.2 a dip to black.
 * END: see the second half of this file. */
const TEASER18 = 'THE FIRE DRILL';
(() => {
if (!window.TIMELINE_EP17 || !window.SH15 || !window.UI || !window.H6 || !window.FP15A) return;
const SH = window.SH15, { zoomTo } = window.H6;
window.__EP17_SCENES = window.__EP17_SCENES || {};

// ------------------------------------------------------------------ palette and small maths (the episode's: indigo desk, LearnWell indigo, mandatory red, episode red, title gold)
const DESK = '#120d38', DESK_D = '#0a0724', INDIGO = '#4a3fe0', INDIGO_D = '#2a2478', VIOLET = '#7a6cff', CYAN = '#58e6ff', GOLD = '#ffd23a', YEL = '#ffe135', INK = '#07101f', RED = '#d93025', CREAM = '#f6efd2', GREEN = '#1e8e5a', ORANGE = '#e8782c', PINK = '#e5402e', PAGE = '#f3f2fb', PTXT = '#1b1848', PGREY = '#5b5780';
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
const meas = (...a) => window.FP15A.meas(...a);

/* Bangers lettering with a body (ep15_title.js, with an indigo extrusion): soft drop shadow, a slab of extrusion, dark outline, gold rim, bright gradient face, gloss, sweeping shine. Only the face is the string the viewer
 * reads (hero when `hero`); every other layer is a decorative copy (hero:false, crop:true, one group). */
function bevelText(str, cx, cy, size, o = {}) {
  const font = 'Bangers', sp = o.spacing ?? size * .018, cap = UI.metrics(font).cap * size, alpha = o.alpha ?? 1, ex = o.extr ?? 1, lw = size * (o.lwK ?? .125), reveal = o.reveal ?? 1;
  if (alpha <= .004 || reveal <= 0 || size < 2) return null;
  const common = { font, size, spacing: sp, grp: o.grp || 'bv:' + str, tilt: .3, reveal, hero: false, crop: true };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv, alpha }, extra));
  const ext = o.ext || ['#7a5cf5', '#0a0522'];
  if (o.shadow !== false) L(size * .03, size * .15 * ex + size * .03, 'rgba(2,0,14,.45)', 'rgba(2,0,14,.45)', lw * 1.45, { shadow: size * .14 });
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
  UI.pill(str, cx, cy, { font: 'Bangers', size, spacing: size * .09, fill: RED, ink: CREAM, stroke: INK, lw: Math.max(3, size * .12), h, padX: size * .62, tstroke: INK, tlw: size * .09, shadow: size * .1, hero: !!o.hero, crop: !o.hero, id: 'fp17a.pill' });
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
/* the loader: a track ring and an arc that turns (a pure function of time) */
function spinnerRing(cx, cy, r, lt, o = {}) {
  const lw = o.lw ?? r * .26, a0 = lt * (o.speed ?? 6.6);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = o.track || 'rgba(255,255,255,.22)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = o.color || '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + 1.9); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ the desk: deep indigo, a pool of light, giant ghost loaders turning slowly behind everything
function stage(lt, o = {}) {
  const k = o.k ?? 1;
  ctx.save();
  const g = ctx.createLinearGradient(0, -300, 0, H + 300);
  g.addColorStop(0, '#0a0724'); g.addColorStop(.45, DESK); g.addColorStop(1, '#0c0830');
  ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800);
  const br = 1 + .03 * Math.sin(lt * 1.6);
  ctx.globalCompositeOperation = 'screen';
  let r = ctx.createRadialGradient(540, 960, 0, 540, 960, 1000 * br);
  r.addColorStop(0, rgba('#8a7cff', .30 * k)); r.addColorStop(.35, rgba('#5a4bd8', .16 * k)); r.addColorStop(1, rgba('#5a4bd8', 0));
  ctx.fillStyle = r; ctx.fillRect(-400, -400, W + 800, H + 800);
  r = ctx.createRadialGradient(540, 1720, 0, 540, 1720, 760);
  r.addColorStop(0, rgba('#58e6ff', .09 * k)); r.addColorStop(1, rgba('#58e6ff', 0));
  ctx.fillStyle = r; ctx.fillRect(-400, 900, W + 800, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round';
  [[430, 16, .11, 1.1], [640, 12, .08, -.8], [860, 9, .06, .6], [1090, 7, .05, -.45]].forEach(([rad, lw, a, sp], i) => {
    ctx.strokeStyle = `rgba(170,160,255,${a * .5 * k})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(540, 960, rad, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(170,160,255,${a * k})`; ctx.beginPath(); ctx.arc(540, 960, rad, lt * sp + i, lt * sp + i + 1.8); ctx.stroke();
  });
  const vg = ctx.createRadialGradient(540, 960, 480, 540, 960, 1300); vg.addColorStop(0, 'rgba(3,1,16,0)'); vg.addColorStop(1, 'rgba(3,1,16,.55)'); ctx.fillStyle = vg; ctx.fillRect(-400, -400, W + 800, H + 800);   /* the card's own vignette: the engine's would grey the white page */
  ctx.restore();
}

// ------------------------------------------------------------------ effects: the flash and rings of the landing, the pixels that burst, the stars of the shimmer, small loaders that drift up behind the lettering
function burst(age, cx, cy, n = 36) {
  if (age < 0 || age > 1.3) return;
  const cols = [CYAN, '#ffffff', VIOLET, GOLD, '#b3a8ff', YEL];
  for (let i = 0; i < n; i++) {
    const a = rnd(i * 3.7) * TAU, v = 380 + rnd(i * 5.1) * 1000, s0 = 10 + rnd(i * 7.3) * 26;
    const x = cx + Math.cos(a) * v * age * .9 * (1 - .35 * sg(age, 0, 1.3)), y = cy + Math.sin(a) * v * age * .9 + 900 * age * age * (.4 + .6 * rnd(i * 1.3)) - 90 * Math.sin(age * 3);
    const fade = 1 - sg(age, .45, 1.25);
    if (fade <= .01) continue;
    ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(Math.round(x - s0 / 2), Math.round(y - s0 / 2), Math.round(s0), Math.round(s0)); ctx.restore();   /* square pixels: snapped to the grid, no spin */
  }
}
function flashRing(age, cx, cy, o = {}) {
  const pre = o.pre ?? 0, post = age >= 0 ? ringK(age, o.tau ?? .12) : 0, a = Math.max(pre * .55, post) * (o.k ?? 1);
  if (a > .01) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r ?? 900); g.addColorStop(0, `rgba(255,255,255,${.78 * a})`); g.addColorStop(.28, `rgba(210,200,255,${.38 * a})`); g.addColorStop(1, 'rgba(210,200,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
    V2.emit(cx, cy, 520, '200,190,255', .9 * a);
  }
  if (age >= 0 && age < .8) { ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(cx, cy, age / .8, { r0: 160, r1: o.r1 ?? 980, lw: 20, color: o.c1 || '220,214,255', alpha: .95, bloom: .6 }); V2.ring(cx, cy, Math.max(0, age - .09) / .8, { r0: 120, r1: (o.r1 ?? 980) * .78, lw: 10, color: o.c2 || '110,230,255', alpha: .7, bloom: .3 }); ctx.restore(); }
}
function drift(lt, t0) {
  if (lt < t0) return;
  for (let i = 0; i < 9; i++) {
    const per = 7 + rnd(i * 4.1) * 3, ph = ((lt - t0) / per + rnd(i * 9.3)) % 1, x = 90 + ((i * 117 + rnd(i * 2.7) * 140) % 900), y = lp(2000, -80, ph), rr = 9 + rnd(i * 6.1) * 14;
    ctx.save(); ctx.globalAlpha *= .3 * sg(lt, t0, t0 + .8); spinnerRing(x, y, rr, lt + i * .7, { color: 'rgba(190,182,255,1)', track: 'rgba(190,182,255,.3)', lw: 4, speed: 4 + rnd(i) * 3 }); ctx.restore();
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

// ------------------------------------------------------------------ the title: cues, the final card's layout (every element ink-centred on x 540) and the LearnWell page's geometry
const CLICK1 = 1.2, SPIN = 1.8, CLICK2 = 2.8, IRIS0 = 2.98, IRIS1 = 3.46, T0 = 3.20, LAND = 3.54, DING = 4.0, TAG0 = 3.58, TAG1 = 3.97;
const CARD = { cx: 540, shift: { cy: 698, size: 128 }, pill: { cy: 832, size: 54, h: 88 }, title: { cy: 1002, size: 208 }, tag: { cy: 1168, size: 46 }, load: { cy: 1254, r: 26, size: 44 } };
const PG = { x: 60, y: 236, w: 960, h: 1368, r: 36 };                         /* the course card */
const TH = { x: 100, y: 356, w: 880, h: 560 };                                /* the thumbnail */
const STARTB = { cx: 540, cy: 1334, w: 880, h: 116 }, SKIPB = { cx: 540, cy: 1486, w: 360, h: 84 };
const TRACK = { x: 100, y: 1190, w: 880, h: 28 };
const ent = (lt, t0, d = .22) => { const a = sg(lt, t0, t0 + d); return { a, dy: (1 - eO(a)) * 30, done: a >= 1 }; };
const w99 = () => UI.sizeOf('99%', { size: CARD.load.size, weight: 900 }).w;
const loadX = () => 540 - (59 + 14 + w99()) / 2 + 29.5;                          /* the loader's ring centre in the final row: ring + gap + 99% is one group centred on x 540 */

// ------------------------------------------------------------------ the pointer (screen coordinates): in from the left onto START on click 1, down to the greyed SKIP on click 2
function pointer(lt) {
  const c = SH.cursorPath([
    { t: .62, x: -40, y: 1300, kind: 'arrow' },
    { t: CLICK1, x: 250, y: STARTB.cy, kind: 'arrow', click: [CLICK1 - .09, CLICK1 + .1], over: .04 },
    { t: 2.1, x: 330, y: 1424, kind: 'arrow' },
    { t: CLICK2, x: 404, y: SKIPB.cy, kind: 'arrow', click: [CLICK2 - .09, CLICK2 + .1], over: .05 },
    { t: 3.2, x: 470, y: 1580, kind: 'arrow' },
  ], lt);
  const a1 = lt - CLICK1, a2 = lt - CLICK2;
  return { x: c.x, y: c.y, press: c.press, kind: c.kind, alpha: sg(lt, .62, .8) * (1 - sg(lt, 3.0, 3.14)), ripple: a1 >= 0 && a1 < .45 ? sg(a1, 0, .45) : a2 >= 0 && a2 < .45 ? sg(a2, 0, .45) : 0 };
}

// ------------------------------------------------------------------ small drawn icons (no text)
function lockIcon(x, y, s, col, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(-9, -11); ctx.arc(0, -11, 9, PI, 0); ctx.lineTo(9, -3); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-15, -4, 30, 24, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(0, 6, 3.4, 0, TAU); ctx.fill(); ctx.fillRect(-1.6, 6, 3.2, 8);
  ctx.restore();
}
function navIcon(kind, x, y, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'home') { ctx.beginPath(); ctx.moveTo(-22, 4); ctx.lineTo(0, -20); ctx.lineTo(22, 4); ctx.lineTo(16, 4); ctx.lineTo(16, 22); ctx.lineTo(-16, 22); ctx.lineTo(-16, 4); ctx.closePath(); ctx.stroke(); }
  else if (kind === 'book') { ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 22); ctx.moveTo(0, -14); ctx.quadraticCurveTo(-14, -22, -26, -16); ctx.lineTo(-26, 16); ctx.quadraticCurveTo(-14, 10, 0, 22); ctx.quadraticCurveTo(14, 10, 26, 16); ctx.lineTo(26, -16); ctx.quadraticCurveTo(14, -22, 0, -14); ctx.stroke(); }
  else if (kind === 'bell') { ctx.beginPath(); ctx.moveTo(-20, 12); ctx.quadraticCurveTo(-18, -2, -16, -8); ctx.quadraticCurveTo(-10, -22, 0, -22); ctx.quadraticCurveTo(10, -22, 16, -8); ctx.quadraticCurveTo(18, -2, 20, 12); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 20, 5, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, -10, 11, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-22, 22); ctx.quadraticCurveTo(-22, 4, 0, 4); ctx.quadraticCurveTo(22, 4, 22, 22); ctx.stroke(); }
  ctx.restore();
}
/* the thumbnail: a break room (window, wall clock at 10:59, a table with a steaming mug, a sofa) and a play button */
function thumb(lt, dim) {
  const { x, y, w, h } = TH, A0 = ctx.globalAlpha;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 28); ctx.clip();
  let g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#d6eef5'); g.addColorStop(1, '#a6d6e4'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#7fb6c8'; ctx.fillRect(x, y + h * .72, w, h * .28);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x + 56, y + 54, 230, 262, 12); ctx.fill();   /* the window */
  g = ctx.createLinearGradient(0, y + 66, 0, y + 304); g.addColorStop(0, '#8fd0ff'); g.addColorStop(1, '#d9f1ff'); ctx.fillStyle = g; ctx.fillRect(x + 68, y + 66, 98, 114); ctx.fillRect(x + 176, y + 66, 98, 114); ctx.fillRect(x + 68, y + 190, 98, 114); ctx.fillRect(x + 176, y + 190, 98, 114);
  const cx = x + w - 140, cy = y + 128;   /* the wall clock: 10:59 */
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, TAU); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#2a2478'; ctx.stroke();
  ctx.strokeStyle = '#2a2478'; ctx.lineCap = 'round'; ctx.lineWidth = 7; const ha = (10 + 59 / 60) / 12 * TAU - PI / 2, ma = 59 / 60 * TAU - PI / 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * 36, cy + Math.sin(ha) * 36); ctx.stroke(); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * 52, cy + Math.sin(ma) * 52); ctx.stroke();
  ctx.fillStyle = '#9a6a45'; ctx.beginPath(); ctx.roundRect(x + 250, y + h * .64, 330, 22, 6); ctx.fill(); ctx.fillRect(x + 280, y + h * .64 + 20, 16, 110); ctx.fillRect(x + 534, y + h * .64 + 20, 16, 110);   /* the table */
  const mx = x + 420, my = y + h * .64;   /* the mug and its steam */
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(mx - 34, my - 62, 68, 62, 10); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx + 36, my - 32, 17, -1.3, 1.3); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 6;
  for (let i = 0; i < 3; i++) { const ph = (lt * .8 + i * .33) % 1; ctx.globalAlpha = A0 * (1 - ph) * .9; ctx.beginPath(); for (let j = 0; j <= 12; j++) { const t = j / 12, yy = my - 72 - ph * 40 - t * 56, xx = mx - 18 + i * 18 + Math.sin(t * 6 + lt * 3 + i) * 7; j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
  ctx.globalAlpha = A0;
  ctx.fillStyle = '#ff8d74'; ctx.beginPath(); ctx.roundRect(x + 640, y + h * .5, 190, 150, [40, 40, 10, 10]); ctx.fill(); ctx.fillStyle = '#ff775a'; ctx.beginPath(); ctx.roundRect(x + 630, y + h * .5 + 70, 210, 78, 22); ctx.fill();   /* the sofa */
  const sh = ((lt * .5) % 2.4) / 1.2; if (sh < 1) { g = ctx.createLinearGradient(x + lp(-300, w + 100, sh) - 90, y, x + lp(-300, w + 100, sh) + 90, y + h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
  if (dim > 0) { ctx.fillStyle = `rgba(20,16,70,${.42 * dim})`; ctx.fillRect(x, y, w, h); }
  const pr = 74 * (1 + .03 * Math.sin(lt * 3)) * (1 - .35 * dim), pcx = x + w / 2, pcy = y + h / 2;   /* the play button */
  ctx.save(); ctx.shadowColor = 'rgba(20,16,70,.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.globalAlpha *= 1 - .6 * dim; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(pcx, pcy, pr, 0, TAU); ctx.fill(); ctx.restore();
  ctx.globalAlpha *= 1 - .6 * dim; ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.moveTo(pcx - 22, pcy - 34); ctx.lineTo(pcx + 38, pcy); ctx.lineTo(pcx - 22, pcy + 34); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* the account's avatar: Strawberry's face in a disc (a sprite at small scale, cropped to the disc) */
function avatar(cx, cy, lt) {
  ctx.save(); ctx.fillStyle = '#ffe2cf'; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, TAU); ctx.fill();
  const ctor = (window.A11 && window.A11.straw) || (window.A7 && window.A7.straw);
  if (ctor) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 39, 0, TAU); ctx.clip();
    try { const x = { t: lt, noLegs: true, noShadow: true, noReflect: true, s: .27, x: 0, y: 0, expr: 'weak' }, o = Object.assign(ctor(x), x), [fx, fy] = window.H6.faceC(o); o.x = cx - fx; o.y = cy - fy + 4; drawChar(o); } catch (e) { /* the plain disc stays */ }
    ctx.restore();
  }
  ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, TAU); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ the page: top bar, the course card and its rows, the bottom bar
function topBar(lt) {
  const e = ent(lt, .2, .26), calm = lt >= .46 && lt < IRIS0 - .02;
  ctx.save(); ctx.translate(0, -(1 - eO(e.a)) * 150);
  shadowOf(() => { ctx.beginPath(); ctx.rect(0, 0, W, 140); }, .35, 30, 10);
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#3a2fb8'); g.addColorStop(1, INDIGO_D); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 140);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(60, 36, 68, 68, 18); ctx.fill();   /* the logo mark: an open book */
  ctx.save(); ctx.translate(94, 72); ctx.strokeStyle = INDIGO; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 18); ctx.moveTo(0, -12); ctx.quadraticCurveTo(-11, -18, -22, -13); ctx.lineTo(-22, 13); ctx.quadraticCurveTo(-11, 8, 0, 18); ctx.quadraticCurveTo(11, 8, 22, 13); ctx.lineTo(22, -13); ctx.quadraticCurveTo(11, -18, 0, -12); ctx.stroke(); ctx.restore();
  UI.label('LearnWell', 152, 74, { align: 'left', size: 54, weight: 900, fill: '#ffffff', hero: calm, crop: !calm, maxW: 420 });
  if (lt >= .46) { ctx.save(); ctx.globalAlpha *= sg(lt, .46, .62); avatar(940, 72, lt); ctx.restore(); }   /* the sprite only appears once the bar has landed (a head must not cross the frame edge) */
  ctx.restore();
}
function drawBanner(lt) {
  const e = ent(lt, .40), calm = e.done && lt < IRIS0 - .02;
  ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
  ctx.save(); ctx.beginPath(); ctx.roundRect(PG.x, PG.y, PG.w, 84, [PG.r, PG.r, 0, 0]); ctx.clip(); ctx.fillStyle = PINK; ctx.fillRect(PG.x, PG.y, PG.w, 84);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let i = -2; i < 14; i++) { ctx.beginPath(); ctx.moveTo(PG.x + i * 90 + ((lt * 24) % 90), PG.y); ctx.lineTo(PG.x + i * 90 + 40 + ((lt * 24) % 90), PG.y); ctx.lineTo(PG.x + i * 90 - 14 + ((lt * 24) % 90), PG.y + 84); ctx.lineTo(PG.x + i * 90 - 54 + ((lt * 24) % 90), PG.y + 84); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  UI.label('MANDATORY: MODULE 7 OF 7', 540, PG.y + 42, { size: 40, weight: 900, spacing: 3, fill: '#ffffff', hero: calm, crop: !calm, maxW: 880 });
  ctx.restore();
}
function drawCardBody(lt) {
  const e = ent(lt, .3, .3);
  ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
  shadowOf(() => { ctx.beginPath(); ctx.roundRect(PG.x, PG.y, PG.w, PG.h, PG.r); }, .38, 60, 24);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(PG.x, PG.y, PG.w, PG.h, PG.r); ctx.fill();
  ctx.restore();
}
function drawRows(lt) {
  const dim = eIO(sg(lt, 1.26, 1.5)), tt = (t0, str, y, o) => {
    const e = ent(lt, t0), calm = e.done && lt < IRIS0 - .02;
    ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy); UI.label(str, o.x ?? 540, y, Object.assign({ hero: calm, crop: !calm }, o)); ctx.restore();
  };
  { const e = ent(lt, .45, .26); ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy); thumb(lt, dim); ctx.restore(); }
  tt(.60, 'How to Take a Break Safely', 984, { size: 52, weight: 900, fill: PTXT, maxW: 860 });
  tt(.68, 'Estimated time 4:00:00', 1046, { size: 38, weight: 800, fill: PGREY, maxW: 860 });
  tt(.74, 'Due: before clock-out', 1096, { size: 32, weight: 800, fill: '#c9302c', maxW: 860 });
  { const e = ent(lt, .80), calm = e.done && lt < IRIS0 - .02;
    ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
    UI.label('Progress', TRACK.x, 1164, { align: 'left', size: 30, weight: 800, fill: PGREY, hero: calm, crop: !calm });
    ctx.fillStyle = '#dedcf2'; ctx.beginPath(); ctx.roundRect(TRACK.x, TRACK.y, TRACK.w, TRACK.h, 14); ctx.fill();
    const v = lt < SPIN ? 0 : Math.min(1, .99 * back(sg(lt, SPIN, SPIN + .16), 1.5));
    if (v > .002) {
      const w = Math.max(TRACK.h, TRACK.w * v), g = ctx.createLinearGradient(TRACK.x, 0, TRACK.x + TRACK.w, 0); g.addColorStop(0, INDIGO); g.addColorStop(1, '#58a8ff');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(TRACK.x, TRACK.y, w, TRACK.h, 14); ctx.fill();
      const sx = TRACK.x + ((lt * 260) % (TRACK.w + 200)) - 100; ctx.save(); ctx.beginPath(); ctx.roundRect(TRACK.x, TRACK.y, w, TRACK.h, 14); ctx.clip(); const sg2 = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0); sg2.addColorStop(0, 'rgba(255,255,255,0)'); sg2.addColorStop(.5, 'rgba(255,255,255,.55)'); sg2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg2; ctx.fillRect(TRACK.x, TRACK.y, w, TRACK.h); ctx.restore();
    }
    ctx.restore(); }
  skipButton(lt);
  startButton(lt);
}
function skipButton(lt) {
  const e = ent(lt, .94), calm = e.done && lt < IRIS0 - .02, age = lt - CLICK2;
  const shake = age > 0 ? Math.sin(age * 82) * 10 * Math.exp(-age / .12) : 0, flash = age > 0 ? Math.exp(-age / .45) : 0;
  ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(shake, e.dy);
  UI.pill('SKIP', SKIPB.cx, SKIPB.cy, { font: 'Nunito', weight: 900, size: 40, spacing: 4, fill: mixh('#e6e5f4', '#ffd6d0', flash), ink: mixh('#a09dbd', '#d93025', flash), h: SKIPB.h, minW: SKIPB.w, id: 'fp17a.skip', hero: calm, crop: !calm });
  lockIcon(SKIPB.cx - SKIPB.w / 2 + 58, SKIPB.cy - 4, 1.0 + .12 * flash, mixh('#a09dbd', '#d93025', flash), age > 0 ? Math.sin(age * 60) * .34 * Math.exp(-age / .22) : 0);
  ctx.restore();
}
/* START: a wide button that sinks on the click and shrinks into the round loader (the loader itself is drawn above the page, by loader()) */
function startButton(lt) {
  const e = ent(lt, .86), m = eIO(sg(lt, 1.24, 1.44));
  if (m >= 1) return;
  const calm = e.done && lt < 1.12, press = lt > 1.05 && lt < 1.4 ? pointer(lt).press : 0, w = lp(STARTB.w, STARTB.h, m);
  ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
  ctx.fillStyle = '#2a2478'; ctx.beginPath(); ctx.roundRect(STARTB.cx - w / 2, STARTB.cy - STARTB.h / 2 + 8, w, STARTB.h, STARTB.h / 2); ctx.fill();
  const g = ctx.createLinearGradient(0, STARTB.cy - 58, 0, STARTB.cy + 58); g.addColorStop(0, '#6a5cf2'); g.addColorStop(1, INDIGO);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(STARTB.cx - w / 2, STARTB.cy - STARTB.h / 2 + 8 * press, w, STARTB.h, STARTB.h / 2); ctx.fill();
  if (m < .4) UI.label('START', STARTB.cx, STARTB.cy + 8 * press, { size: 48, weight: 900, spacing: 7, fill: '#ffffff', alpha: 1 - sg(m, 0, .35), hero: calm, crop: !calm });
  ctx.restore();
}
function bottomNav(lt) {
  const e = ent(lt, .3, .3);
  ctx.save(); ctx.globalAlpha *= e.a;
  shadowOf(() => { ctx.beginPath(); ctx.rect(0, 1792, W, 128); }, .25, 30, -8);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 1792, W, 128);
  ctx.fillStyle = '#e4e1fb'; ctx.beginPath(); ctx.roundRect(330, 1810, 140, 92, 30); ctx.fill();
  navIcon('home', 150, 1856, '#8e8ab0'); navIcon('book', 400, 1856, INDIGO); navIcon('bell', 680, 1856, '#8e8ab0'); navIcon('user', 930, 1856, '#8e8ab0');
  ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(700, 1830, 9, 0, TAU); ctx.fill();
  ctx.restore();
}
function toast(lt) {
  const t = sg(lt, CLICK2 + .02, CLICK2 + .16);
  if (t <= 0) return;
  const tw = UI.sizeOf('Skipping is not available', { size: 36, weight: 900 }).w, w = tw + 2 * 76, y = lp(-60, 188, back(t, 1.6)), hero = t >= 1 && lt < IRIS0 + .02;
  shadowOf(() => { ctx.beginPath(); ctx.roundRect(540 - w / 2, y - 42, w, 84, 42); }, .4, 30, 12);
  UI.pill('Skipping is not available', 540, y, { font: 'Nunito', weight: 900, size: 36, fill: PTXT, ink: '#ffffff', h: 84, padX: 76, id: 'fp17a.toast', hero, crop: !hero });
  lockIcon(540 - w / 2 + 44, y - 4, .9, '#ffb4ab');
}
function drawPage(lt) {
  const ir = lp(0, 2300, eIO(sg(lt, IRIS0, IRIS1)));
  if (ir >= 2299) return;
  ctx.save();
  if (ir > 0) { ctx.beginPath(); ctx.rect(-200, -200, W + 400, H + 400); ctx.moveTo(540 + ir, STARTB.cy); ctx.arc(540, STARTB.cy, ir, 0, TAU); ctx.clip('evenodd'); }
  ctx.fillStyle = PAGE; ctx.fillRect(-200, -200, W + 400, H + 400);
  bottomNav(lt);
  drawCardBody(lt);
  drawBanner(lt);
  drawRows(lt);
  toast(lt);
  topBar(lt);   /* the toast slides out from under the bar */
  ctx.restore();
  if (ir > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(200,192,255,${.75 * (1 - sg(ir, 1700, 2300))})`; ctx.lineWidth = 12; ctx.shadowColor = 'rgba(160,150,255,.9)'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(540, STARTB.cy, ir, 0, TAU); ctx.stroke(); ctx.restore(); }
}

// ------------------------------------------------------------------ the loader and its figure: START turns into a round loader that never finishes; both glide to their place under the tagline
function loaderState(lt) {
  const lk = eIO(sg(lt, IRIS0, 3.5));
  return { cx: lp(STARTB.cx, loadX(), lk), cy: lp(STARTB.cy, CARD.load.cy, lk), discR: lp(58, 36, lk), discA: 1 - lk, ringR: lp(28, CARD.load.r, lk), lk };
}
function loader(lt) {
  if (lt < 1.44) return;
  const s = loaderState(lt), pop = 1 + .12 * ringK(lt - 1.44, .08);
  ctx.save();
  if (s.discA > .01) {
    ctx.save(); ctx.globalAlpha *= s.discA; ctx.translate(s.cx, s.cy); ctx.scale(pop, pop); ctx.translate(-s.cx, -s.cy);
    ctx.fillStyle = '#2a2478'; ctx.beginPath(); ctx.arc(s.cx, s.cy + 8, s.discR, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, s.cy - s.discR, 0, s.cy + s.discR); g.addColorStop(0, '#6a5cf2'); g.addColorStop(1, INDIGO); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.cx, s.cy, s.discR, 0, TAU); ctx.fill();
    ctx.restore();
  }
  spinnerRing(s.cx, s.cy, s.ringR, lt, { color: mixh('#ffffff', CYAN, s.lk), lw: lp(8, 7, s.lk), track: 'rgba(255,255,255,.24)' });
  ctx.restore();
}
function percent(lt) {
  const e = ent(lt, .80), lk = eIO(sg(lt, IRIS0, 3.5)), size = lp(34, CARD.load.size, lk), finalRight = 540 + (59 + 14 + w99()) / 2, rx = lp(TRACK.x + TRACK.w, finalRight, lk), y = lp(1164, CARD.load.cy, lk);
  if (e.a <= .01) return;
  const str = lt < SPIN ? '0%' : '99%', bump = lt >= SPIN ? 1 + .35 * ringK(lt - SPIN, .09) : 1, calm = (e.done && lt < IRIS0 - .02 && !(lt >= SPIN && lt < SPIN + .3)) || lk >= 1;
  ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(rx, y + (lk > 0 ? 0 : e.dy)); ctx.scale(bump, bump); ctx.translate(-rx, -y);
  UI.label(str, rx, y, { align: 'right', size, weight: 900, fill: mixh(PTXT, '#ffffff', lk), stroke: DESK_D, lw: lp(0, 6, lk), hero: calm, crop: !calm, grp: 'pct' });
  ctx.restore();
}
function pageLoadBar(lt) {
  const a = sg(lt, 3.3, 3.6);
  if (a <= .01) return;
  const x = 90, w = 900, y = 1830, v = .99;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.roundRect(x, y, w, 10, 5); ctx.fill();
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, VIOLET); g.addColorStop(1, CYAN); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w * v, 10, 5); ctx.fill();
  const sx = x + ((lt * 300) % (w + 240)) - 120; ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w * v, 10, 5); ctx.clip(); const sh = ctx.createLinearGradient(sx - 70, 0, sx + 70, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,.8)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(x, y, w, 10); ctx.restore();
  ctx.restore();
}

// ------------------------------------------------------------------ the title card's lettering
function drawLogo(lt) {
  const p = sg(lt, T0 + .04, T0 + .32), pop = back(p, 2.0), ds = lt - DING;
  if (p <= 0) return;
  ctx.save(); ctx.translate(540, CARD.shift.cy); ctx.scale(lp(1.28, 1, pop), lp(1.28, 1, pop)); ctx.translate(-540, -CARD.shift.cy);
  bevelText('SHIFT HAPPENS', 540, CARD.shift.cy, CARD.shift.size, { face: FACE_LOGO, extr: .35, lwK: .13, alpha: sg(p, 0, .3), hero: p >= 1, shine: ds > .12 ? eIO(sg(ds, .12, .85)) : -1, shineA: .8, grp: 'bv:logo' });
  ctx.restore();
}
function drawTitle(lt) {
  const k = sg(lt, T0, T0 + .32), a = sg(lt, T0, T0 + .06);
  if (a <= 0) return;
  const grow = lt < LAND - .02 ? eIO(sg(lt, T0, LAND - .02)) * 1.06 : lp(1.06, 1, eO(sg(lt, LAND - .02, LAND + .12)));
  const size = lp(CARD.title.size * .72, CARD.title.size, grow) * (1 + .03 * (lt >= LAND ? ringK(lt - LAND, .09) : 0)), rest = lt >= LAND + .14, ds = lt - DING;
  bevelText('THE MODULE', 540, CARD.title.cy, size, { extr: sg(size, 90, 190), alpha: a, reveal: k, hero: rest, shine: ds > 0 ? eIO(sg(ds, 0, .78)) : -1, grp: 'bv:tm' });
}
function drawPillTag(lt) {
  const p = sg(lt, T0 + .14, T0 + .36);
  if (p > 0) episodePill('EPISODE 17', 540, CARD.pill.cy, CARD.pill.size, CARD.pill.h, { alpha: sg(p, 0, .25), scale: lp(.5, 1, back(p, 2.2)), hero: lt >= T0 + .4 });
  const tg = sg(lt, TAG0, TAG1);
  if (tg > 0) UI.label('Please do not close this window.', 540, CARD.tag.cy, { font: 'Nunito', weight: 900, italic: true, size: CARD.tag.size, fill: CREAM, stroke: DESK_D, lw: 8, shadow: 12, reveal: tg, hero: tg >= 1, crop: tg < 1 });
}

// ------------------------------------------------------------------ the title scene
function titleDraw(lt) {
  stage(lt);
  drift(lt, LAND + .1);
  drawPage(lt);
  for (const [t0, x, y] of [[CLICK1, 250, STARTB.cy], [CLICK2, 404, SKIPB.cy]]) { const k = sg(lt, t0, t0 + .42); if (k > 0 && k < 1 && lt < 3.1) { ctx.save(); ctx.strokeStyle = `rgba(74,63,224,${.75 * (1 - k)})`; ctx.lineWidth = 7 * (1 - k) + 2; ctx.beginPath(); ctx.arc(x, y, lp(12, 78, eO(k)), 0, TAU); ctx.stroke(); ctx.restore(); } }
  loader(lt);
  percent(lt);
  burst(lt - LAND, 540, CARD.title.cy);
  drawLogo(lt);
  drawTitle(lt);
  drawPillTag(lt);
  pageLoadBar(lt);
  flashRing(lt - LAND, 540, CARD.title.cy, { pre: lt < LAND ? Math.pow(sg(lt, LAND - .16, LAND), 2) : 0 });
  sparkles(lt, CARD.title, DING, [[-372, -78, 38, 0], [-120, -104, 30, .13], [152, -98, 34, .24], [352, -66, 30, .36], [24, 92, 26, .48], [-290, 88, 22, .6], [262, 94, 24, .7]]);
  twinkles(lt, CARD.title, [[4.6, -330, -96, 26], [5.0, 300, 92, 24], [5.45, -60, -108, 28], [5.8, 380, -70, 22]]);
  if (lt < 3.3) {
    const pp = pointer(lt);
    if (pp.alpha > .01) { ctx.save(); ctx.globalAlpha *= pp.alpha; SH.pointer(pp.x, pp.y, { kind: pp.kind, press: pp.press, s: 1.25 }); ctx.restore(); }
  }
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'page'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .05 * eIO(sg(lt, LAND, 6.2)));
    CAM.shake = 2 * (lt >= CLICK1 ? ringK(lt - CLICK1, .05) : 0) + 2 * (lt >= CLICK2 ? ringK(lt - CLICK2, .05) : 0) + 5 * (lt >= LAND ? ringK(lt - LAND, .05) : 0);
  },
  draw: titleDraw,
  fx(lt) {
    const land = lt >= LAND ? ringK(lt - LAND, .12) : 0, fin = lt < .2 ? 1 - lt / .2 : 0, fout = sg(lt, 6.06, 6.2);
    return { bloom: .42 + .5 * land + .25 * sg(lt, LAND, 4.2), vignette: 0, grain: .05, contrast: .12, sat: .06, aberr: 5 * land, tint: [['#b9a8ff', .07 * sg(lt, LAND, 4.4), 'soft-light']], fade: Math.max(fin, fout), fadeColor: '4,2,14' };
  },
  blur(lt) { return lt < .2 ? 1 : (lt > 1.0 && lt < 1.22) ? 5 : (lt > 2.6 && lt < 2.82) ? 5 : (lt > 2.98 && lt < 3.6) ? 8 : 2; },
  over() {},
};
window.__EP17_SCENES.title = TITLE;

// =====================================================================================================================================================================================================
// END (7.0 s, noScrim, noChyron): THE COMPLETION ROSTER. The same floating GridSheet window as Episode 15's end card on the indigo desk; tab Completion: NAME | MODULE 7 | BREAK with the portraits and a status icon in front of
// every MODULE 7 entry (icon and text centred as one group) (a check, a clock for the expired certificate, a loader that never finishes for the 99 percent rows, a signal meter for the laggy CEO). Layout (window-local): title block A1:D2 (84 + 116, indigo:
// THANKS FOR WATCHING over SHIFT HAPPENS), header row 56, nine rows of 116 (portrait 96 | NAME 232 | MODULE 7 456 | BREAK 256 = 1040, symmetric about the frame's centre), a footnote row of 52; the zone under the table is
// the stamp's, then the teaser banner's.
//   Cues (scene-local s): theme15 .10 | typing 1.10 | click 3.10 | stamp 4.00 | textding 5.10.
//   0.00-0.10 fade up.   0.12-0.85 THANKS FOR WATCHING types in, SHIFT HAPPENS pops in (the theme), the header row types.
//   1.10-2.36 the roster types in, one row every 0.14 s (the portrait pops, then NAME, MODULE 7 with its icon, BREAK), the selection hops along the cells being typed, the formula bar follows.
//   2.50 the Save As dialog pops in over the dimmed sheet; 2.64-2.98 the file name types in; the pointer arrives and PRESSES SAVE on the click (3.10); 3.14-3.32 the dialog closes, the title bar reads MODULE7_FINAL_REAL_v3.
//   4.00 STAMP: CERTIFICATE EXPIRED slams down in the empty zone under the table (a ring, a shake of the camera), gone by 4.5.
//   4.46-4.76 a new tab, Sheet18 (amber), grows at the end of the tab bar, glows, and LIFTS OFF (4.76-5.04) as the banner NEXT: EPISODE 18 / THE FIRE DRILL.   5.10 textding: a gloss sweeps across THE FIRE DRILL and SHIFT HAPPENS, stars.
//   Idle to 6.8: the portraits breathe and blink, Tomato changes her mind every 1.6 s, Mr. Artichoke glitches (the laggy call), the loaders turn, Strawberry's expired row pulses red, the tab glows, a light sweeps the window.   6.8-7.0 fade to dark. */
const WIN = { x: 20, y: 20, w: 1040, h: 1880, r: 28 };
const EC = { A: 96, B: 232, C: 456, D: 256 };
const ER = (() => { const r = { 1: 84, 2: 116, 3: 56, 13: 52 }; for (let i = 4; i <= 12; i++) r[i] = 116; return r; })();
const TONE = {
  err: { color: '#d93025', fill: '#fde7e5' }, amber: { color: '#8f5600', fill: '#fff1c4' }, green: { color: '#0f6b3c', fill: '#e3f4ea' }, blue: { color: '#2f35b8', fill: '#e1e2fb' }, plain: { color: '#22262b', fill: null },
  grey: { color: '#6b7380', fill: '#eef0f3' },
};
const ROSTER = [
  { name: 'Strawberry', mod: 'COMPLETE (EXPIRED)', mt: 'err', icon: 'clock', brk: 'PENDING', bt: 'amber', bg: '#ffe2cf', ring: ORANGE, ctor: 'straw', expr: 'weak', s: .27 },
  { name: 'Lemon', mod: 'IN PROGRESS (99%)', mt: 'blue', icon: 'spin', brk: 'PENDING', bt: 'amber', bg: '#fff3b8', ring: ORANGE, ctor: 'lemon', expr: 'sour', s: .27 },
  { name: 'Mango', mod: 'IN PROGRESS (99%)', mt: 'blue', icon: 'spin', brk: 'PENDING', bt: 'amber', bg: '#ffe7c2', ring: ORANGE, ctor: 'mango', expr: 'neutral', s: .25 },
  { name: 'Clementine', mod: 'NOT STARTED', mt: 'grey', icon: 'dash', brk: 'SURE!', bt: 'green', bg: '#ffe2cf', ring: ORANGE, ctor: 'clem', expr: 'happy', s: .29 },
  { name: 'Melon', mod: 'EXEMPT', mt: 'plain', icon: 'dash', brk: 'PIZZA', bt: 'plain', bg: '#f4ead2', ring: ORANGE, ctor: 'melon', expr: 'smug', s: .27 },
  { name: 'Onion', mod: 'COMPLETE', mt: 'green', icon: 'check', brk: 'CRYING', bt: 'blue', bg: '#e6e2fb', ring: '#6d5bd0', ctor: 'onion', expr: null, s: .26 },
  { name: 'Tomato', mod: 'ASSIGNED', mt: 'amber', icon: 'dash', brk: 'EFFICIENCY', bt: 'amber', bg: '#e6e2fb', ring: '#6d5bd0', ctor: 'tomato', expr: null, s: .26 },
  { name: 'Binder', mod: 'COMPLETE (PROCTOR)', mt: 'green', icon: 'check', brk: 'HERE TO HELP', bt: 'blue', bg: '#e5e8ec', ring: '#5b6470', ctor: 'bind', expr: null, s: .3 },
  { name: 'Mr. Artichoke', mod: 'UNAVAILABLE (LAGGY)', mt: 'amber', icon: 'bars', brk: 'VALUED', bt: 'green', bg: '#d9f3e4', ring: '#2fa36b', ctor: 'arti', expr: null, s: .27 },
];
const STAMP_SIZE = 88, STAMP_TXT = 'CERTIFICATE EXPIRED', STAMP_COL = '#d93025', STAMP_RING = '255,130,110', BANNER = ['#2f2a8a', '#17134f'], TEASER_A = 'NEXT: EPISODE 18', TEASER_B = TEASER18;
const FILES = ['MODULE7_FINAL_REAL_v2.gsx', 'MODULE7_FINAL_REAL.gsx', 'QUIZ_ANSWERS_PENDING.gsx', 'CERTIFICATE_EXPIRED_COPY.gsx'], FOLDER = 'Training';
const E = { type0: 1.10, dt: .14, dlgIn: 2.50, nameA: 2.66, nameB: 2.98, click: 3.10, dlgOut: 3.14, dlgGone: 3.34, stamp: 4.0, stampOut: 4.4, tab: 4.46, lift: 5.04, ding: 5.10, out: 6.8 };
const rowT = i => E.type0 + i * E.dt;
const FILE = 'MODULE7_FINAL_REAL_v3', NEWTAB = 'Sheet18', TABS = ['Roster', 'Completion'];
const EBASE = {
  w: WIN.w, h: WIN.h, doc: 'MODULE_7_COMPLETION', saved: false, cols: EC, rows: ER, merges: ['A1:D2', 'A13:D13'], handle: false,
  ribbon: { collapsed: true, tab: 'Home' }, show: { title: true, ribbon: true, formula: true, headers: false, sheetTabs: true, status: true },
};
let EGEO = null;
function egeo() {
  if (EGEO) return EGEO;
  const o = Object.assign({}, EBASE, { tabs: TABS }), L = SH.layout(o);
  EGEO = { L, o, rc: ref => SH.cellRect(ref, o), gx0: L.gx0, gy0: L.gy0, gx1: L.gx1, gy1: L.gy1 };
  return EGEO;
}
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
  const cells = { A1: { v: '', fill: '#1a1450' } }, hero = !(lt >= E.dlgIn && lt < E.dlgGone);   /* under the dim of the dialog nothing is hero */
  const hk = sg(lt, .55, .85), hdr = { fill: '#1a1450', color: CREAM, size: 26, weight: 900, spacing: 3, hero: false };
  cells.A3 = { v: '', fill: '#1a1450' }; cells.B3 = Object.assign({ v: 'NAME', typed: hk }, hdr); cells.C3 = Object.assign({ v: 'MODULE 7', typed: hk, align: 'center' }, hdr); cells.D3 = Object.assign({ v: 'BREAK', typed: hk }, hdr);
  cells.A13 = { v: '* Clock-out requires a taken break. Breaks are pending.', typed: sg(lt, 2.2, 2.5), italic: true, size: 30, weight: 700, color: '#5b6470', align: 'center', hero: hero && !(lt >= E.stamp - .16 && lt < E.stampOut + .1), fill: '#ffffff' };
  let active = 'A1', ftxt = '', fk = 1;
  ROSTER.forEach((p, i) => {
    const r = 4 + i, t0 = rowT(i), zebra = lt < t0 ? undefined : i % 2 ? '#f4f3fb' : '#ffffff', tm = TONE[p.mt], tb = TONE[p.bt];
    const kB = sg(lt, t0 + .02, t0 + .12), kC = sg(lt, t0 + .06, t0 + .18), kD = sg(lt, t0 + .10, t0 + .22);
    cells['A' + r] = { v: '', fill: zebra };
    cells['B' + r] = { v: p.name, typed: kB, fill: zebra, size: 30, weight: 900, color: '#15123a', hero, pad: 12 };
    cells['C' + r] = { v: p.mod, typed: kC, fill: lt < t0 + .1 ? zebra : tm.fill || zebra, size: 30, weight: 900, color: tm.color, hero, pad: 12, align: 'center' };
    cells['D' + r] = { v: p.brk, typed: kD, fill: lt < t0 + .1 ? zebra : tb.fill || zebra, size: 30, weight: 900, color: tb.color, hero, pad: 16, align: 'left' };
    if (lt >= t0 + .02) { const pick = lt < t0 + .06 ? ['B', p.name, kB] : lt < t0 + .10 ? ['C', p.mod, kC] : ['D', p.brk, kD]; active = pick[0] + r; ftxt = pick[1]; fk = pick[2]; }
  });
  return { cells, active, ftxt, fk };
}
function endOpts(lt) {
  const st = endState(lt), dlg = lt >= E.dlgIn && lt < E.dlgGone, last = 4 + ROSTER.length - 1;
  const o = Object.assign({}, EBASE, {
    cells: st.cells, tabs: tabsFor(lt), tab: 'Completion', status: 'Ready', stats: lt > E.type0 + ROSTER.length * E.dt ? ['Count: 9'] : [],
    sel: st.active, active: st.active, nameBox: st.active, formula: { text: st.ftxt, typed: st.fk }, selFill: false,
  });
  const saved = lt >= E.dlgOut;
  o.doc = saved ? FILE : EBASE.doc; o.saved = saved ? 'Saved' : false;
  if (lt >= E.type0 + ROSTER.length * E.dt + .1) { o.sel = 'D' + last; o.active = 'D' + last; o.nameBox = 'D' + last; o.formula = { text: 'VALUED', typed: 1 }; }
  if (lt >= E.dlgIn) { o.sel = 'D' + last; o.selK = 0; }
  if (dlg) o.dressing = true;
  return o;
}

// ------------------------------------------------------------------ the portraits: the sprites at small scale, cropped to a disc, centred in column A of their row (ep15_title.js; Mr. Artichoke glitches: the laggy call)
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
    try {
      const x = { t: lt, noLegs: true, noShadow: true, noReflect: true, s: p.s, x: 0, y: 0 };
      if (p.ctor === 'tomato') { const ph = Math.max(0, lt - t0 - .3), n = Math.floor(ph / 1.6), pose = n % 2 ? 'veg' : 'fruit'; Object.assign(x, { tomPose: pose, tomFrom: n % 2 ? 'fruit' : 'veg', flipT: n > 0 || ph > 0 ? Math.min(.6, ph - n * 1.6) : 1 }); }
      if (p.ctor === 'bind') Object.assign(x, { grin: .55, glint: .5 + .5 * Math.sin(lt * 2.4), center: true, bob: 0, hover: 0 });
      if (p.expr) x.expr = p.expr;
      if (p.ctor === 'onion') x.pose = 'rest';
      if (p.ctor === 'tomato') x.formsN = 0;
      const o = Object.assign(ctor(x), x);
      if (p.ctor === 'tomato' || p.ctor === 'onion') o.hold = {};   /* a portrait carries no props: they would cover the small faces */
      if (p.ctor === 'bind') { o.x = cx; o.y = cy - 12 * p.s; }
      else { const [fx, fy] = window.H6.faceC(o); o.x = cx - fx; o.y = cy - fy + 4; }
      if (p.ctor === 'arti' && window.A15 && window.A15.draw) { const ph = (lt - t0) % 1.5; if (ph > 0 && ph < .16) o.glitch = { k: 1 - ph / .16, y: .46, h: .13, dx: 34, seed: Math.floor((lt - t0) / 1.5) }; window.A15.draw(o); }
      else drawChar(o);
    } catch (e) { if (!PORT_FALLBACK.has(p.name)) { PORT_FALLBACK.add(p.name); console.error('CARDS17 portrait ' + p.name + ': ' + e.message); } }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = p.ring; ctx.stroke();
  ctx.restore();
}
/* the status icons in front of the MODULE 7 entries, and the red alarm pulse round Strawberry's expired row */
function statusIcon(kind, x, y, lt, k) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const disc = c => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill(); };
  if (kind === 'check') { disc('#1e8e5a'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(-3, 8); ctx.lineTo(10, -7); ctx.stroke(); }
  else if (kind === 'clock') { disc('#d93025'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 0); ctx.lineTo(8, 5); ctx.stroke(); }
  else if (kind === 'spin') { spinnerRing(0, 0, 14, lt, { color: '#2f35b8', track: 'rgba(47,53,184,.22)', lw: 5, speed: 6.6 }); }
  else if (kind === 'bars') { disc('#f0a800'); ctx.fillStyle = '#fff'; [[-10, 6], [-3, 11], [4, 16], [11, 21]].forEach(([bx, bh], i) => { ctx.globalAlpha = i === 0 ? 1 : .35; ctx.fillRect(bx - 2.5, 10 - bh, 5, bh); }); ctx.globalAlpha = 1; }
  else { disc('#c4cad3'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); }
  ctx.restore();
}
function rowExtras(lt) {
  const G = egeo();
  ROSTER.forEach((p, i) => {
    const t0 = rowT(i), R = G.rc('C' + (4 + i)), k = back(sg(lt, t0 + .1, t0 + .3), 2.2);
    if (lt < t0 + .1) return;
    const tw = UI.sizeOf(p.mod, { size: 30, weight: 900 }).w;   /* the icon and the text are one group, centred in the cell */
    statusIcon(p.icon, WIN.x + R.x + R.w / 2 - tw / 2 - 27, WIN.y + R.cy, lt, k * .86);
  });
  if (lt >= rowT(0) + .5) {
    const R = G.rc('B4'), R2 = G.rc('D4'), pulse = .5 + .5 * Math.sin(lt * 4.2);
    ctx.save(); ctx.strokeStyle = `rgba(217,48,37,${.55 + .35 * pulse})`; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(217,48,37,.6)'; ctx.shadowBlur = 12 + 10 * pulse; ctx.globalAlpha *= sg(lt, rowT(0) + .5, rowT(0) + .8);
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
  const sc = lt < E.stamp ? lp(1.8, 1, eI(k)) : 1 / settle, hero = lt >= E.stamp + .17 && lt < E.stampOut - .02;
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a * (lt < E.stamp ? sg(k, 0, .5) : 1);
  ctx.translate(540, Z); ctx.scale(sc, sc); ctx.translate(-540, -Z);
  UI.stamp(STAMP_TXT, 540, Z, { font: 'Bangers', size: STAMP_SIZE, color: STAMP_COL, rot: -.1, lw: STAMP_SIZE * .093, padX: STAMP_SIZE * .56, padY: STAMP_SIZE * .32, alpha: .94, hero, crop: !hero, id: 'fp17a.stamp' });
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
  const c = SH.cursorPath([{ t: 2.52, x: 900, y: 1190, kind: 'arrow' }, { t: 3.04, x: aim[0], y: aim[1], kind: 'arrow', click: [E.click - .09, E.click + .1], over: .04 }, { t: 3.4, x: aim[0] + 14, y: aim[1] + 10, kind: 'arrow' }], lt);
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
    return { bloom: .4 + .35 * st + .25 * dd, vignette: .16, grain: .045, contrast: .1, sat: .05, aberr: 3 * st, tint: [['#ffb86b', .05, 'soft-light']], fade: Math.max(fin, fout), fadeColor: '4,2,14' };
  },
  blur(lt) { return (lt > 2.7 && lt < 3.1) ? 4 : (lt > E.stamp - .12 && lt < E.stamp + .12) ? 6 : (lt > E.tab && lt < E.lift + .05) ? 5 : 2; },
  over() {},
  label: () => 'THANKS FOR WATCHING',
};
window.__EP17_SCENES.end = END;
})();
