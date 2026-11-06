'use strict';
/* SHIFT HAPPENS, Episode 22: "The Secret Santa". Builder E22-WRAP. Scene `wrap` (6:00 PM, THE WRAPPING, 26.234 s). Registers window.__EP22_SCENES.wrap. Every frame is a pure function of the scene time `lt`.
 *
 * THE SET is one flat front elevation of the hall by the med cart (world px, the floor line FY 1250, the ceiling line CEIL 480; a standing character is about 370 tall), left to right: the door of Room 2
 * (x 0..240), the med cart (x 330..630, top 1030: blue drawers, PUDDING CUPS on the second drawer, on its top the tape roll, the pudding's box and the box of nitrile gloves), Strawberry at its right end
 * (x 730), the door of Room 3 (Mr. Pear's, x 966..1206, his call light above it; he rolls into the doorway in his wheelchair before he speaks). Holiday dressing: string lights along the top of the wall
 * (slow twinkle, every bulb its own phase), a tinsel garland on the handrail, paper snowflakes, a wreath on Room 3. The ceiling is seen from below above CEIL (tiles, two lamps): the balloons bump along it.
 * THE INSERTS (the wrap, the snap) are their own compositions in screen units: the cart top in close-up, the hall behind it soft with the string lights as bokeh, Strawberry's arms in from the upper right
 * (her dark arms, purple nitrile gloves; after the snap her left hand is her own white glove).
 * SOFT BODIES (ep22_wrap_sim.js, SOFT2D): the Chux dropped over the box, the paper tape, the glove she blows up for the bow, the dozen glove balloons. Until the library has landed (status file), each is a
 * hand-animated stand-in on the same hand paths (HAND / BOW / BAL in the sim module), so the picture never waits for the sim.
 *
 * SHOTS (scene-local s; every start snapped to a frame; the boundary frame belongs to the NEW shot)
 *   open  0-2.48  MATCH CUT IN: the white PUDDING CUPS label on the cart's drawer at (540, 900), 420 px wide, still to 0.30; then the pull back to the two-shot: Strawberry at the cart (a pudding cup into
 *                 its box), Mango in from the left, stops: "Did you go shopping?" (1.30); Strawberry's head turns to her on "shopping"
 *   s1    2.48-3.26  close: "When?" (flat), Mr. Pear's call light pulsing on the wall behind her
 *   wrapA 3.26-6.93  INSERT, the cart top: the pudding in its box; chuxrustle 3.46 the Chux shaken out; dropped over the box (it drapes, quilting and all); chuxfold 4.46 / 5.16 the left and right sides
 *                 folded in; tapepull 5.86 / 6.46 two strips of paper tape pulled off the roll, torn and pressed down
 *   wrapB1 6.93-7.43 INSERT, her hands: glovesnap 7.26 the purple glove snapped off her left hand
 *   wrapB2 7.43-9.26 close two-shot of Strawberry and the gift: gloveinflate 7.56 she blows the glove up (three breaths, the fingers puff out), glovesqueak 8.66 she ties it, sets it on top: the bow
 *   m2    9.26-10.36 Mango: "Is that a Chux?" | s2 10.36-11.33 Strawberry with the gift: "It's festive." | m3 11.33-12.20 two-shot: "What's in it?" | s2b 12.20-13.58 "Pudding. Sugar free."
 *   o1   13.58-14.81 Onion has arrived (Mango has gone on): "Is it labeled?" (the tears well up) | s3 14.81-16.50 two-shot over the gift: labelgun 14.94 the label slapped on; DATED, TIMED, INITIALED print on it with
 *                 the words (hero text), Onion weeps with joy | pe1 16.50-17.82 Strawberry and Mr. Pear in his doorway: "Can I have a balloon?" | s4 17.82-19.12 "You can have twelve." (the glove box up)
 *   balA 19.12-20.32 THE BALLOONS: two gloves at a time out of the box, blown up over her head, let go (gloveinflate 19.22, 19.62, then faster) | balB 20.32-21.57 the whole wall: they rise and bump along
 *                 the ceiling, pushing each other (glovesqueak 20.32, balloonbonk 20.92 on the lamp), Mr. Pear delighted below
 *   o2   21.57-23.60 Onion, the balloons above her: "Balloons are a latex hazard." | s5 23.60-24.78 two-shot: "They're nitrile." (deadpan), Onion's relief
 *   end  24.78-26.23 the ceiling over Room 3: the balloons bumping, Mr. Pear below; MATCH CUT OUT: one glove balloon at (540, 520), about 260 px wide, still from 25.93
 */
(() => {
if (!window.TIMELINE_EP22 || !window.H6 || !window.UI || !window.V2 || !window.A7 || !window.A11 || !window.A15 || !window.__EP22_SIMS || !window.__EP22_SIMS.wrap) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, S7 = window.S7;
const SIMM = window.__EP22_SIMS.wrap, L = SIMM.L, HAND = SIMM.HAND, BOW = SIMM.BOW, BAL = SIMM.BAL;
const PI = Math.PI;

// ------------------------------------------------------------------ small helpers (the models: ep21_closet.js, ep21_prep.js, ep20_night.js)
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - c01(k)) * (1 - c01(k));
const eb = k => { k = c01(k); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const sr = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rg = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
const bump = (t, a, b) => { const k = sg(t, a, b); return Math.sin(PI * k); };
const pulse = (t, t0, hz = 30, tau = .08) => t < t0 ? 0 : Math.sin((t - t0) * hz) * Math.exp(-(t - t0) / tau);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const mixc = (a, b, k) => '#' + V2.mix(a, b, c01(k)).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${q(r)},${q(g)},${q(b)})`; };
const INKC = 'rgba(25,16,30,.84)';
const ink = (lw = 3) => { ctx.strokeStyle = INKC; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
const poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } };
const has22 = n => !!(window.A22 && typeof window.A22[n] === 'function');
const hasSoft = n => !!(window.SOFT2D && typeof window.SOFT2D[n] === 'function');
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; if (window.FX18 && typeof FX18.glow === 'function') FX18.glow(ctx, { x, y, r, color, alpha: a, core: core ?? .5 }); };
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };

// ------------------------------------------------------------------ the frozen timeline: beats, words, frame snapping (as in ep21_closet.js)
const TLX = window.TIMELINE_EP22;
const SCN = TLX.scenes.find(s => s.id === 'wrap'), START = SCN.start, DUR = SCN.dur, LN = {};
for (const l of TLX.lines) if (l.scene === 'wrap') LN[l.id] = l;
const bS = b => SCN.beats[b].s, bE = b => SCN.beats[b].e;
const ls = id => LN[id].s - START, le = id => LN[id].e - START;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1], wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const speaking = (id, lt, a = .06, b = .16) => !!LN[id] && lt >= ls(id) - a && lt < le(id) + b;
/* the loudness of a recorded line at scene time lt (0..1, from the mouth track the characters use) */
function voice(id, lt) {
  const l = LN[id]; if (!l || !l.mouth) return 0;
  const f = (lt - (l.s - START)) * 30; if (f < 0 || f >= l.mouth.length) return 0;
  const i = Math.floor(f), j = Math.min(l.mouth.length - 1, i + 1), u = f - i, dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
  return lerp(dg(i), dg(j), u);
}
/* the sound cues (python3 /tmp/shift_tools/cues.py 22 wrap), snapped to the frame the picture hits */
const CUE = {};
for (const [k, v] of Object.entries({ rustle: 3.462, fold1: 4.462, fold2: 5.162, tape1: 5.862, tape2: 6.462, snap: 7.262, inflate: 7.562, squeak: 8.662, labelgun: 14.939, inf1: 19.217, inf2: 19.617, squeak2: 20.317, bonk: 20.917, sting: 24.884 })) CUE[k] = snapT(v);
const W_DATED = snapT(wS('s3', 0)), W_TIMED = snapT(wS('s3', 1)), W_INIT = snapT(wS('s3', 2)), W_SHOP = snapT(wS('m1', 3)), W_TWELVE = snapT(wS('s4', 3)), W_LATEX = snapT(wS('o2', 3)), W_NITRILE = snapT(wS('s5', 1));

// ------------------------------------------------------------------ text: hero only where it is safe (the viewer can read it, clear of the frame edge, the caption zone and the clock pill)
let HEROMODE = false;                                      /* true while a shot shows a piece of text as its subject; every other piece of set text is dressing */
function scrBox(cx, cy, hw, hh) {
  const m = ctx.getTransform(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [u, v] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) { const X = m.a * (cx + u) + m.c * (cy + v) + m.e, Y = m.b * (cx + u) + m.d * (cy + v) + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return { x0: a, y0: b, x1: c, y1: d };
}
function heroOK(size, cx, cy, w, h = size) {
  if (!HEROMODE || size * scrOf(ctx) < 31) return false;
  const b = scrBox(cx, cy, w / 2 + 10, h * .5 + 10);
  return b.x0 >= 50 && b.x1 <= W - 50 && b.y0 >= 50 && b.y1 <= 1372 && !(b.x0 < 506 && b.y0 < 250 && b.x1 > 40 && b.y1 > 108);
}
/* a label: hero when heroOK says so (or o.hero), else set dressing (crop allowed); too small on screen to matter: not drawn as text at all */
function TXT(str, cx, cy, o = {}) {
  const size0 = o.size || 30, fit = o.maxW ? UI.fit(str, o.maxW, { size: size0, font: o.font, weight: o.weight, italic: o.italic, spacing: o.spacing, lw: o.lw }) : null, size = fit ? fit.size : size0;
  if (size * scrOf(ctx) < 7) return null;
  const wd = (fit ? fit.w : UI.sizeOf(str, o).w) || size * str.length * .6, mid = o.align === 'left' ? cx + wd / 2 : o.align === 'right' ? cx - wd / 2 : cx;
  const hero = o.hero !== undefined ? !!o.hero : heroOK(size, mid, cy, wd);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: o.crop !== undefined ? o.crop : !hero }));
}

// ------------------------------------------------------------------ PROPS. Each is drawn by the A22 kit when it has the function (checked at DRAW time), else by a stand-in of the same look.
const NIT = { fill: '#8d6ad8', hi: '#c3abf4', lo: '#5c3fa6', line: '#2b1a4a' };          /* nitrile purple */
/* a glove balloon: local frame = the knot at (0, 0), the fingers toward -y (rot turns it), s = scale (1: about 150 wide, 180 tall at puff 1), puff 0 (limp, flat, fingers down from the cuff) .. 1 (round,
   five fat fingers), face (a doodled smiley on the palm), squeeze (0..1 a squash along the cuff axis), knot (0..1 the cuff tied off) */
function gloveShape(c, p, o = {}) {
  const pr = .35 + .65 * p, fr = 8 + 7 * p, pw = 38 + 22 * p, ph = 34 + 18 * p, py = -54 - 26 * p, sq = o.squeeze || 0;
  const fing = [[-.62, 56, -12], [-.22, 66, -4], [.12, 68, 3], [.44, 58, 10]], th = [-1.32, 50, -30];
  const parts = [];
  parts.push(['e', 0, py, pw * (1 + .12 * sq), ph * (1 - .1 * sq)]);
  for (const [a, len, ox] of fing) { const L2 = len * (.72 + .28 * p), bx = ox * pr, by = py - ph * .62; parts.push(['f', bx, by, a * (.55 + .45 * p), L2, fr]); }
  { const [a, len, oy] = th, L2 = len * (.7 + .3 * p); parts.push(['f', -pw * .82, py + oy * .3 + 8, a * (.7 + .3 * p), L2, fr * 1.04]); }
  parts.push(['n', 0, -10, 10 + 2 * p, 22]);
  return parts;
}
/* GLOVE GEOMETRY used by the scene's physics (the knot is the anchor): the kit's glove (A22.gloveBalloon) is drawn about its palm, 84 px above the knot at s 1, 180 x 220, its top 194 above
   the knot; the stand-in measures 173 x 194 about (-26.6, -98) */
const GLV = () => has22('gloveBalloon') ? { palm: 84, w: 180, cx: 0, cy: -84, top: 194 } : { palm: 84, w: 173.2, cx: -26.6, cy: -98, top: 194.8 };
function gloveBalloon(c, o = {}) {
  if (has22('gloveBalloon') && !o.stand) {
    const s = o.s || 1, a = o.rot || 0, px = (o.x || 0) + 84 * s * Math.sin(a), py = (o.y || 0) - 84 * s * Math.cos(a), sq = o.squeeze || 0;
    c.save();
    if (sq > .001) { c.translate(px, py); c.scale(1 + .12 * sq, 1 - .1 * sq); c.translate(-px, -py); }
    if (o.alpha != null) c.globalAlpha *= o.alpha;
    const r = A22.gloveBalloon(c, { x: px, y: py, rot: a, s, puff: c01(o.puff ?? 1), face: !!o.face, side: o.side || 1, t: o.still ? 0 : (o.t ?? 0), seed: o.seed || 1, string: false });
    c.restore(); return r;
  }
  const p = c01(o.puff ?? 1), s = o.s || 1, parts = gloveShape(c, p, o), fill = o.fill || NIT.fill;
  c.save(); c.translate(o.x || 0, o.y || 0); c.rotate(o.rot || 0); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
  if (o.alpha != null) c.globalAlpha *= o.alpha;
  const path = () => { c.beginPath(); for (const q of parts) { if (q[0] === 'e') { c.moveTo(q[1] + q[3], q[2]); c.ellipse(q[1], q[2], q[3], q[4], 0, 0, TAU); }
    else if (q[0] === 'f') { const [, bx, by, a, len, r] = q, ex = bx + Math.sin(a) * len, ey = by - Math.cos(a) * len; c.moveTo(bx + r, by); c.arc(bx, by, r, 0, TAU); c.moveTo(ex + r, ey); c.arc(ex, ey, r, 0, TAU);
      const nx = Math.cos(a) * r, ny = Math.sin(a) * r; c.moveTo(bx - nx, by - ny); c.lineTo(ex - nx, ey - ny); c.lineTo(ex + nx, ey + ny); c.lineTo(bx + nx, by + ny); c.closePath(); }
    else { const [, nx, ny, w2, h2] = q; c.moveTo(nx - w2, ny + h2 * .4); c.lineTo(nx - w2 * .7, ny - h2); c.lineTo(nx + w2 * .7, ny - h2); c.lineTo(nx + w2, ny + h2 * .4); c.closePath(); } } };
  /* outline: a thick dark stroke of the union, then the fill over it (only the outer half of the stroke shows) */
  path(); c.strokeStyle = o.line || NIT.line; c.lineWidth = 6.5; c.stroke();
  c.fillStyle = lg(-60, -150, 50, 0, [[0, o.hi || NIT.hi], [.45, fill], [1, o.lo || NIT.lo]]); c.fill('nonzero');
  /* the volume: a soft shadow on the lower right, a shine on the palm and on two fingers (more shine the rounder it is) */
  c.save(); path(); c.clip('nonzero');
  c.fillStyle = rg(30, -20, 10, 120, [[0, 'rgba(40,16,80,.28)'], [1, 'rgba(40,16,80,0)']]); c.fillRect(-120, -200, 240, 220);
  if (p < .55) { c.strokeStyle = 'rgba(40,20,80,' + (.35 * (1 - p / .55)) + ')'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const yy = -30 - i * 14; c.beginPath(); c.moveTo(-30, yy + 4 * Math.sin(i * 1.7)); c.quadraticCurveTo(0, yy - 6, 28, yy + 3 * Math.cos(i)); c.stroke(); } }
  c.restore();
  const shine = .25 + .55 * p, py = -54 - 26 * p;
  c.fillStyle = 'rgba(255,255,255,' + shine + ')'; c.beginPath(); c.ellipse(-16 - 6 * p, py - 14, 9 + 6 * p, 5 + 4 * p, -.5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,' + shine * .7 + ')'; c.beginPath(); c.ellipse(-10, py - 70 - 14 * p, 3 + 2 * p, 7 + 4 * p, -.2, 0, TAU); c.fill();
  /* the knot: the tied cuff rolls into a ring with a nub */
  const kn = c01(o.knot ?? (p > .9 ? 1 : 0));
  if (kn > .02) { c.fillStyle = shade(fill, .8); c.strokeStyle = o.line || NIT.line; c.lineWidth = 2.6; c.beginPath(); c.ellipse(0, -4, 13 * kn + 6, 7, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(0, 6, 6 * kn, 0, TAU); c.fill(); c.stroke(); }
  else { c.fillStyle = shade(fill, .85); c.strokeStyle = o.line || NIT.line; c.lineWidth = 2.4; rr(-13, -14, 26, 16, 5); c.fill(); c.stroke(); }
  /* a smiley in black marker on the palm */
  if (o.face && p > .6) { c.strokeStyle = 'rgba(20,12,30,.85)'; c.lineWidth = 3.2; c.beginPath(); c.arc(-11, py - 6, 2.6, 0, TAU); c.moveTo(15, py - 6); c.arc(13, py - 6, 2.6, 0, TAU); c.stroke(); c.beginPath(); c.arc(1, py + 4, 12, .35, PI - .35); c.stroke(); }
  c.restore();
  return null;
}
/* a nitrile glove worn on a hand (the insert): the same purple mitten shapes as the cast's own hand, local frame = the wrist, +x along the fingers */
function nitHand(pose) {
  const gl = lg(0, -16, 0, 16, [[0, NIT.hi], [.5, NIT.fill], [1, NIT.lo]]), fs = () => { ctx.fillStyle = gl; ctx.fill(); ctx.strokeStyle = NIT.line; ctx.lineWidth = 3.2; ctx.stroke(); };
  const seam = (x0, y0, x1, y1) => { ctx.save(); ctx.strokeStyle = 'rgba(30,10,60,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); };
  ctx.beginPath(); ctx.roundRect(-14, -10, 18, 20, 5); fs();                                           /* the cuff rolled at the wrist */
  switch (pose) {
    case 'grip': case 'fist': ctx.beginPath(); ctx.ellipse(10, 0, 16, 15.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(9, 10, 9.5, 6.6, .3, 0, TAU); fs(); for (const y of [-7, -2.5, 2]) seam(17, y, 24, y + .5); break;
    case 'pinch': ctx.beginPath(); ctx.ellipse(8, 0, 14, 13, 0, 0, TAU); fs(); ctx.beginPath(); ctx.roundRect(14, -9, 22, 8.5, 4.2); fs(); ctx.beginPath(); ctx.roundRect(12, 2, 22, 8.5, 4.2); fs(); break;
    case 'flat': ctx.beginPath(); ctx.ellipse(16, 0, 22, 10.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(6, 11, 9, 5.5, .35, 0, TAU); fs(); for (const y of [-5, 0, 5]) seam(28, y, 36, y); break;
    default: ctx.beginPath(); ctx.ellipse(11, 0, 15.5, 13.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(7, 12.5, 8.5, 5.8, .5, 0, TAU); fs(); for (const y of [-6, -.5, 5]) seam(19, y, 25, y);
  }
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(10, -6, 6, 2.6, -.2, 0, TAU); ctx.fill();
}
/* the cast's white cartoon glove (as v2_char.js draws it), for the bare hand after the snap */
function whiteHand(pose) {
  const gl = lg(0, -16, 0, 16, [[0, '#ffffff'], [1, '#d9deea']]), fs = () => { ctx.fillStyle = gl; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.4; ctx.stroke(); };
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  if (pose === 'wave') { ctx.beginPath(); ctx.ellipse(8, 0, 12.5, 12.5, 0, 0, TAU); fs(); for (const a of [-.62, -.22, .18, .58]) { ctx.save(); ctx.translate(13, a * 11); ctx.rotate(a * .95); ctx.beginPath(); ctx.roundRect(0, -4, 21, 8, 4); fs(); ctx.restore(); } ctx.beginPath(); ctx.ellipse(5, 13, 8, 5.5, .6, 0, TAU); fs(); return; }
  if (pose === 'pinch' || pose === 'grip') { ctx.beginPath(); ctx.ellipse(10, 0, 16, 15.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(9, 10, 9.5, 6.6, .3, 0, TAU); fs(); return; }
  ctx.beginPath(); ctx.ellipse(11, 0, 15.5, 13.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(7, 12.5, 8.5, 5.8, .5, 0, TAU); fs();
}
/* an insert hand: (x, y) the wrist, ang the direction of the fingers, arm the direction from the wrist back to the shoulder (off frame), S the scale */
function insHand(x, y, ang, arm, S, pose, bare = false) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ax = x + Math.cos(arm) * 2400, ay = y + Math.sin(arm) * 2400;
  ctx.strokeStyle = '#141018'; ctx.lineWidth = 11 * S; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x, y); ctx.stroke();
  ctx.strokeStyle = '#2f2a38'; ctx.lineWidth = 7.5 * S; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.moveTo(ax - 2 * S, ay - 2 * S); ctx.lineTo(x - 2 * S, y - 2 * S); ctx.stroke();
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(S, S);
  if (bare) whiteHand(pose); else nitHand(pose);
  ctx.restore();
}
/* the Chux print (A22.chuxPrint when the kit has it): a quilted blue field, diamond channels, a white border */
const CHUX = { field: '#7fb6ea', deep: '#4f8fd2', border: '#f4f7fb', back: '#eef1f4', quilt: 'rgba(30,70,140,.42)' };
function chuxColors() { return { back: (window.A22 && A22.chuxBack) || CHUX.back }; }
/* the roll of paper tape on the cart top (A22.tapeRoll: o.pull 0..1 a strip pulled out) */
function tapeRoll(c, o) {
  if (has22('tapeRoll')) return A22.tapeRoll(c, o);
  const s = o.s || 1; c.save(); c.translate(o.x, o.y); c.scale(s, s); c.lineJoin = 'round';
  c.fillStyle = 'rgba(20,14,30,.25)'; c.beginPath(); c.ellipse(4, 34, 46, 9, 0, 0, TAU); c.fill();
  c.fillStyle = lg(-40, 0, 40, 0, [[0, '#e9e2d0'], [.5, '#fbf8ee'], [1, '#d6ceb8']]); c.beginPath(); c.ellipse(0, 0, 40, 34, 0, 0, TAU); c.fill(); c.strokeStyle = INKC; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#c9b48c'; c.beginPath(); c.ellipse(0, 0, 18, 15, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#6a5a44'; c.beginPath(); c.ellipse(0, 0, 11, 9, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(120,100,70,.35)'; c.lineWidth = 1.4; for (const r of [24, 30, 36]) { c.beginPath(); c.ellipse(0, 0, r, r * .85, 0, PI * 1.1, PI * 1.9); c.stroke(); }
  c.restore(); return [o.x - 40 * s, o.y - 34 * s, o.x + 40 * s, o.y + 34 * s];
}
/* a strip of paper tape from a to b (insert or world px), w wide, with torn (zigzag) ends; alpha; sag (px, the middle hangs while it is carried) */
function tapeStrip(a, b, w, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 2) return;
  const ang = Math.atan2(dy, dx), sag = o.sag || 0;
  ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(ang); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const top = x => -w / 2 + sag * Math.sin(PI * x / len), bot = x => w / 2 + sag * Math.sin(PI * x / len);
  ctx.beginPath(); ctx.moveTo(0, top(0));
  for (let x = 0; x <= len; x += len / 12) ctx.lineTo(x, top(x));
  for (let i = 0; i <= 6; i++) ctx.lineTo(len + (i % 2 ? 4 : -1), lerp(top(len), bot(len), i / 6));
  for (let x = len; x >= 0; x -= len / 12) ctx.lineTo(x, bot(x));
  for (let i = 6; i >= 0; i--) ctx.lineTo((i % 2 ? -4 : 1), lerp(top(0), bot(0), i / 6));
  ctx.closePath();
  ctx.fillStyle = 'rgba(30,20,40,.16)'; ctx.save(); ctx.translate(3, 4); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(250,247,236,.94)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,110,90,.55)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(160,150,120,.22)'; ctx.lineWidth = 1; for (let x = 6; x < len - 4; x += 7) { ctx.beginPath(); ctx.moveTo(x, top(x) + 3); ctx.lineTo(x + 3, bot(x) - 3); ctx.stroke(); }
  ctx.restore();
}
/* the box of nitrile gloves (A22.gloveBox): o = { x, y (the bottom centre), s, t, peek (a glove's fingers out of the slot), label (hero) } */
function gloveBox(c, o) {
  if (has22('gloveBox')) return A22.gloveBox(c, o);
  const s = o.s || 1, w = 120, h = 74, d = 30;
  c.save(); c.translate(o.x, o.y); c.scale(s, s); c.lineJoin = 'round';
  c.fillStyle = 'rgba(20,14,30,.25)'; c.beginPath(); c.ellipse(0, 2, 70, 10, 0, 0, TAU); c.fill();
  c.fillStyle = '#7b52c7'; c.beginPath(); c.moveTo(-w / 2, -h); c.lineTo(-w / 2 + 10, -h - d * .5); c.lineTo(w / 2 + 10, -h - d * .5); c.lineTo(w / 2, -h); c.closePath(); c.fill(); c.strokeStyle = INKC; c.lineWidth = 2.6; c.stroke();
  c.fillStyle = lg(0, -h, 0, 0, [[0, '#f2eefa'], [1, '#ddd5ee']]); c.fillRect(-w / 2, -h, w, h); c.strokeRect(-w / 2, -h, w, h);
  c.fillStyle = '#7b52c7'; c.fillRect(-w / 2, -h * .42, w, h * .42); c.strokeRect(-w / 2, -h * .42, w, h * .42);
  c.fillStyle = '#5a3a9a'; c.beginPath(); c.moveTo(w / 2, -h); c.lineTo(w / 2 + 10, -h - d * .5); c.lineTo(w / 2 + 10, -d * .5); c.lineTo(w / 2, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#3a2a5a'; c.beginPath(); c.ellipse(4, -h - d * .26, 26, 5, 0, 0, TAU); c.fill();                                        /* the slot on top */
  if ((o.peek ?? 1) > .02) { c.save(); c.translate(4, -h - d * .26); c.scale(.42, .42 * (o.peek ?? 1)); gloveBalloon(c, { puff: .05, stand: true, rot: 0 }); c.restore(); }
  c.restore();
  const sb = scrBox(o.x, o.y - h * .5 * s, w * .5 * s + 4, h * .5 * s + 4), whole = sb.x0 >= 4 && sb.x1 <= W - 4 && sb.y0 >= 4 && sb.y1 <= H - 4;
  const lab = o.label !== false && whole ? TXT('NITRILE GLOVES', o.x, o.y - h * .7 * s, { size: 13 * s, fill: '#3b2470', hero: o.hero, maxW: w * .9 * s }) : null;
  if (lab !== null && o.label !== false) TXT('M', o.x, o.y - h * .2 * s, { size: 18 * s, fill: '#ffffff', hero: false });
  return [o.x - w / 2 * s, o.y - (h + d * .5) * s, o.x + (w / 2 + 10) * s, o.y];
}
/* a pudding cup (A22.pudding): a white cup, a foil lid with a stripe; o = { x, y (the bottom centre), s } */
function pudding(c, o) {
  if (has22('pudding')) return A22.pudding(c, o);
  const s = o.s || 1; c.save(); c.translate(o.x, o.y); c.scale(s, s); c.lineJoin = 'round';
  c.fillStyle = lg(-30, 0, 30, 0, [[0, '#f3efe6'], [.5, '#ffffff'], [1, '#d9d3c4']]); c.beginPath(); c.moveTo(-30, -52); c.lineTo(30, -52); c.lineTo(24, 0); c.lineTo(-24, 0); c.closePath(); c.fill(); c.strokeStyle = INKC; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#8a5a34'; c.fillRect(-27, -40, 54, 14);
  c.fillStyle = lg(-34, -60, 34, -50, [[0, '#d7dbe2'], [.5, '#ffffff'], [1, '#aab2be']]); c.beginPath(); c.ellipse(0, -54, 34, 8, 0, 0, TAU); c.fill(); c.stroke();
  c.restore(); return [o.x - 34 * s, o.y - 62 * s, o.x + 34 * s, o.y];
}
/* a white label in the A21.label style (white, a red-orange date band at the left, a ruled line, a soft shadow); lines = [{ t, size, reveal, italic, hand }]; cx, cy = centre; o.pop (a slap: scale overshoot 0..1) */
function wlabel(cx, cy, w, h, lines, o = {}) {
  ctx.save(); ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); const pp = o.pop ? 1 + .22 * Math.sin(PI * c01(o.pop)) * (1 - c01(o.pop)) : 1; ctx.scale(pp, 2 - pp);
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,24,40,.22)'; rr(-w / 2 + 3, -h / 2 + 4, w, h, 7); ctx.fill();
  ctx.fillStyle = '#fdfdfb'; rr(-w / 2, -h / 2, w, h, 7); ctx.fill();
  ctx.save(); rr(-w / 2, -h / 2, w, h, 7); ctx.clip(); ctx.fillStyle = o.band || '#e8542e'; ctx.fillRect(-w / 2, -h / 2, w * .1, h); ctx.restore();
  ctx.strokeStyle = 'rgba(40,50,80,.55)'; ctx.lineWidth = 2; rr(-w / 2, -h / 2, w, h, 7); ctx.stroke();
  ctx.restore();
  const n = lines.length, x0 = cx - w / 2 + w * .1, iw = w * .9, sb = scrBox(cx, cy, w / 2 + 4, h / 2 + 4);
  if (sb.x0 < 4 || sb.x1 > W - 4 || sb.y0 < 4 || sb.y1 > H - 4) return;
  lines.forEach((ln, i) => {
    const y = cy - h / 2 + h * (i + .5) / n + (n > 1 ? (i ? -h * .04 : h * .05) : 0);
    TXT(ln.t, x0 + iw / 2, y, { size: ln.size, fill: ln.fill || '#1d2a6b', weight: 900, italic: !!ln.italic, maxW: iw - 12, reveal: ln.reveal, hero: o.hero, grp: o.grp, cid: undefined });
  });
}
/* the label gun (copied from ep21_prep.js labelGunArt, prefix fp22w_): a chunky grey labeller with a roll on top; fire 0..1 = a label sticking out of the nose */
function labelGunArt(fire) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#4a4f5c'; rr(-10, -6, 22, 48, 8); ctx.fill(); ink(2.6);
  ctx.fillStyle = '#ffcf2e'; rr(-4, 8, 14, 22, 5); ctx.fill(); ink(2);
  ctx.fillStyle = lg(0, -34, 0, 4, [[0, '#9aa3b4'], [1, '#5c6474']]); rr(-34, -34, 90, 34, 10); ctx.fill(); ink(2.8);
  ctx.fillStyle = '#f7f6ee'; ctx.beginPath(); ctx.arc(2, -46, 20, 0, TAU); ctx.fill(); ink(2.4); ctx.fillStyle = '#d4202c'; ctx.beginPath(); ctx.arc(2, -46, 7, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2f3a'; rr(50, -26, 14, 20, 4); ctx.fill();
  if (fire > .02) { ctx.save(); ctx.translate(62, -16); ctx.fillStyle = '#ffffff'; rr(0, -9, 30 * fire, 18, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#e8542e'; ctx.fillRect(0, -9, 30 * fire, 4); ctx.restore(); }
}
EXT.prop.fp22w_labelgun = (side, o, t) => { const S = o.lgScale || 1.1; ctx.save(); ctx.rotate((o.lgRot ?? -.15) * side); ctx.scale(S * side, S); labelGunArt(c01(o.lgFire || 0)); ctx.restore(); };
PROP_BOX.fp22w_labelgun = Object.assign([-46, -72, 74, 46], { mirror: true });
/* the box of gloves held up (s4, balA): a held prop in the left hand */
EXT.prop.fp22w_gbox = (side, o, t) => { const S = o.gbScale || .7; ctx.save(); ctx.scale(S, S); ctx.translate(-4, 40); gloveBox(ctx, { x: 0, y: 0, s: 1, t, peek: 1, hero: false }); ctx.restore(); };
PROP_BOX.fp22w_gbox = o => { const S = o.gbScale || .7; return Object.assign([-88 * S, -86 * S, 88 * S, 44 * S], { nearFace: true }); };

// ------------------------------------------------------------------ THE SET (world px): ceiling, wall, floor, doors, the cart, the holiday dressing
const FY = L.FY, CEIL = L.CEIL, CART = L.cart, GIFT = L.gift;
const LAMPS = [-300, 360, 1020, 1680];
function setCeiling(lt) {                                  /* the ceiling seen from below (after ep21_closet.js setCeiling): rows widen upward, seams fan out from the camera's x */
  const vx = CAM.x, top = CEIL - 1700;
  ctx.fillStyle = lg(0, top, 0, CEIL, [[0, '#a99f8c'], [.7, '#cdc5b4'], [1, '#e9e2d3']]); ctx.fillRect(-2400, top, 5200, CEIL - top);
  ctx.strokeStyle = 'rgba(110,100,85,.28)'; ctx.lineWidth = 2;
  ctx.beginPath(); let y = CEIL, step = 30; while (y > top) { y -= step; step *= 1.3; ctx.moveTo(-2400, y); ctx.lineTo(2800, y); } ctx.stroke();
  ctx.beginPath(); for (let x = -2400; x <= 2800; x += 120) { ctx.moveTo(x, CEIL); ctx.lineTo(x + (x - vx) * 1.5, top); } ctx.stroke();
  ctx.fillStyle = '#b9b0a0'; ctx.fillRect(-2400, CEIL - 8, 5200, 8);
  for (const x of LAMPS) {
    const k = (x - vx) * .09;
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(x - 104, CEIL - 22); ctx.lineTo(x + 104, CEIL - 22); ctx.lineTo(x + 118 + k, CEIL - 70); ctx.lineTo(x - 118 + k, CEIL - 70); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,140,120,.6)'; ctx.lineWidth = 3; ctx.stroke();
    glow(x + k * .5, CEIL - 46, 150, '#fff2d6', .5, .4);
  }
}
const HR_Y = 1006;                                          /* the handrail's top */
function setWall(lt) {
  ctx.fillStyle = lg(0, CEIL, 0, FY, [[0, '#f1e6cf'], [.55, '#e9dcc0'], [1, '#dccdad']]); ctx.fillRect(-2400, CEIL, 5200, FY - CEIL);
  for (const x of LAMPS) { ctx.fillStyle = rg(x, CEIL + 10, 10, 520, [[0, 'rgba(255,246,222,.5)'], [.45, 'rgba(255,240,210,.16)'], [1, 'rgba(255,240,210,0)']]); ctx.fillRect(x - 540, CEIL, 1080, 600); }
  ctx.fillStyle = lg(0, 1030, 0, FY, [[0, '#5f9aa0'], [1, '#4e868c']]); ctx.fillRect(-2400, 1030, 5200, FY - 1030);   /* the teal wainscot */
  ctx.fillStyle = 'rgba(20,50,55,.12)'; for (let x = -2400; x < 2800; x += 96) ctx.fillRect(x, 1030, 2, FY - 1030);
  ctx.fillStyle = '#6e5b49'; ctx.fillRect(-2400, FY - 14, 5200, 14); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-2400, FY - 14, 5200, 2);
}
function setFloor(lt) {                                    /* the vinyl floor (after ep21_closet.js setFloor): rows widen toward us, seams fan out from the camera's x, the lamps' sheen */
  ctx.fillStyle = lg(0, FY, 0, FY + 900, [[0, '#d9cfbb'], [.3, '#cdc2ab'], [1, '#b5a98f']]); ctx.fillRect(-2400, FY, 5200, 1600);
  ctx.strokeStyle = 'rgba(110,95,70,.22)'; ctx.lineWidth = 2;
  for (let i = 1; i < 14; i++) { const y = FY + 16 * i * i * .55 + 10 * i; ctx.beginPath(); ctx.moveTo(-2400, y); ctx.lineTo(2800, y); ctx.stroke(); }
  const vx = CAM.x; for (let x = -2400; x <= 2800; x += 120) { ctx.beginPath(); ctx.moveTo(x, FY); ctx.lineTo(x + (x - vx) * 1.4, FY + 900); ctx.stroke(); }
  for (const x of LAMPS) { ctx.fillStyle = rg(x, FY + 60, 6, 260, [[0, 'rgba(255,250,235,.28)'], [1, 'rgba(255,250,235,0)']]); ctx.save(); ctx.translate(x, FY + 60); ctx.scale(1, .22); ctx.translate(-x, -(FY + 60)); ctx.fillRect(x - 280, FY - 220, 560, 560); ctx.restore(); }
}
function handrail(lt) {                                     /* the handrail along the wall (broken at the doors), with a tinsel garland looped along it */
  const gaps = [[L.doors[0].x0 - 22, L.doors[0].x1 + 22], [L.doors[1].x0 - 22, L.doors[1].x1 + 22]];
  let x = -2400;
  for (const [a, b] of gaps.concat([[2800, 2800]])) {
    if (a > x) {
      ctx.fillStyle = 'rgba(40,30,20,.18)'; ctx.fillRect(x, HR_Y + 26, a - x, 10);
      ctx.fillStyle = lg(0, HR_Y, 0, HR_Y + 22, [[0, '#c69a68'], [.5, '#a77a4a'], [1, '#7c5530']]); rr(x, HR_Y, a - x, 22, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,210,.35)'; ctx.fillRect(x + 6, HR_Y + 3, a - x - 12, 3);
      tinsel(x + 10, a - 10, HR_Y + 6, lt);
    }
    x = b;
  }
}
/* a tinsel garland swagged along the rail (A22.tinsel takes a polyline): gold and silver strands, a slow sparkle (each glint its own phase, under 1 Hz) */
function tinsel(x0, x1, y, lt) {
  const pts = [];
  for (let x = x0; x <= x1; x += 12) { const u = ((x - x0) % 150) / 150; pts.push([x, y + 26 * Math.sin(PI * u)]); }
  if (pts.length < 2) return;
  if (has22('tinsel')) { A22.tinsel(ctx, pts, { t: lt, color: '#e8c04a', width: 16 }); return; }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const line = (dy, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py + dy) : ctx.moveTo(px, py + dy)); ctx.stroke(); };
  line(2, 'rgba(90,60,10,.35)', 15); line(0, '#c99a2e', 13); line(-1, '#f2cf5a', 7);
  ctx.strokeStyle = 'rgba(255,240,180,.7)'; ctx.lineWidth = 1.6;
  for (let i = 0; i < pts.length; i++) { const [px, py] = pts[i], a = (i * 2.3) % PI; ctx.beginPath(); ctx.moveTo(px - 7 * Math.cos(a), py - 7 * Math.sin(a)); ctx.lineTo(px + 7 * Math.cos(a), py + 7 * Math.sin(a)); ctx.stroke(); }
  for (let i = 0; i < pts.length; i += 3) { const f = .3 + .5 * sr(i, 7), lv = .5 + .5 * Math.sin(lt * TAU * f + sr(i, 8) * TAU); if (lv > .8) glow(pts[i][0], pts[i][1], 14, '#fff6d0', .5 * (lv - .8) / .2, .6); }
  ctx.restore();
}
/* the string lights along the top of the wall: a sagging wire, a bulb every 54 px; every bulb twinkles slowly (0.3 to 0.8 Hz) on its own phase, never fully off (PHOTOSENSITIVITY) */
const BULB_C = ['#ff4a4a', '#3fd16a', '#ffc93a', '#4a8cff', '#ff8ad0'];
let BULBS = [];
function stringLights(lt) {
  const y0 = CEIL + 34, span = 216; BULBS = [];
  ctx.save(); ctx.strokeStyle = '#23402a'; ctx.lineWidth = 3; ctx.beginPath();
  for (let x = -1200; x <= 2400; x += 6) { const u = ((x + 1200) % span) / span, y = y0 + 30 * Math.sin(PI * u); x === -1200 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
  for (let x = -1200; x <= 2400; x += span) { ctx.fillStyle = '#5a5248'; ctx.beginPath(); ctx.arc(x, y0, 5, 0, TAU); ctx.fill(); }
  for (let i = 0, x = -1200 + 27; x <= 2400; i++, x += 54) {
    const u = ((x + 1200) % span) / span, y = y0 + 30 * Math.sin(PI * u) + 14, col = BULB_C[i % BULB_C.length], f = .3 + .5 * sr(i, 3), lv = .62 + .38 * Math.sin(lt * TAU * f + sr(i, 4) * TAU);
    ctx.fillStyle = '#2c4a30'; rr(x - 5, y - 18, 10, 9, 2); ctx.fill();
    ctx.fillStyle = mixc(shade(col, .55).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, r, g, b) => '#' + [r, g, b].map(v => (+v).toString(16).padStart(2, '0')).join('')), col, lv);
    ctx.beginPath(); ctx.ellipse(x, y, 7.5, 11, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(30,20,20,.5)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (.35 + .4 * lv) + ')'; ctx.beginPath(); ctx.ellipse(x - 2.4, y - 3.5, 2.2, 3.6, -.3, 0, TAU); ctx.fill();
    BULBS.push({ x, y, col, lv });
  }
  ctx.restore();
}
function bulbGlows(lt) { for (const b of BULBS) glow(b.x, b.y, 46, b.col, .34 * b.lv, .45); }
/* paper snowflakes taped to the wall (cut paper: six arms with side twigs) */
function snowflake(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) { ctx.rotate(PI / 3); ctx.lineWidth = r * .16; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.stroke(); ctx.lineWidth = r * .1; ctx.beginPath(); ctx.moveTo(0, -r * .55); ctx.lineTo(-r * .24, -r * .75); ctx.moveTo(0, -r * .55); ctx.lineTo(r * .24, -r * .75); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(120,140,170,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, r * .18, 0, TAU); ctx.stroke();
  ctx.restore();
}
function wreath(x, y, r, lt) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, rr2 = r * (.92 + .1 * sr(i, 2)); ctx.fillStyle = i % 2 ? '#2f7a3c' : '#245f30'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rr2, Math.sin(a) * rr2, r * .36, r * .2, a + .8, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3; ctx.fillStyle = '#d42a2a'; ctx.beginPath(); ctx.arc(Math.cos(a) * r * .9, Math.sin(a) * r * .9, r * .09, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#d42a2a'; ctx.beginPath(); ctx.moveTo(0, r * .85); ctx.lineTo(-r * .5, r * .6); ctx.lineTo(-r * .45, r * 1.05); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, r * .85); ctx.lineTo(r * .5, r * .6); ctx.lineTo(r * .45, r * 1.05); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* a door in the wall: the trim, the leaf (Room 2, closed) or the open doorway into the room (Room 3: a dim warm room, the bed's foot, the night window), the plaque, the call light above it */
function callLevel(room, lt) { return room === 3 ? .7 + .3 * Math.sin(lt * TAU * .45) : 0; }      /* Room 3's light is on all evening: a slow breathing (0.45 Hz), never a blink */
function doorUnit(d, lt) {
  const x0 = d.x0, x1 = d.x1, top = L.doorTop, cx = (x0 + x1) / 2;
  ctx.fillStyle = '#f6f1e4'; ctx.fillRect(x0 - 20, top - 20, x1 - x0 + 40, FY - top + 20); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.strokeRect(x0 - 20, top - 20, x1 - x0 + 40, FY - top + 20);
  if (d.room === 3) {
    ctx.save(); ctx.beginPath(); ctx.rect(x0, top, x1 - x0, FY - top); ctx.clip();
    ctx.fillStyle = lg(0, top, 0, FY, [[0, '#6b5a68'], [.6, '#857086'], [1, '#5a4a52']]); ctx.fillRect(x0, top, x1 - x0, FY - top);
    ctx.fillStyle = lg(x0, 0, x1, 0, [[0, '#1f2c58'], [1, '#2c3d74']]); rr(x0 + 120, top + 70, 90, 120, 4); ctx.fill();                                 /* the night window inside */
    ctx.fillStyle = 'rgba(255,250,220,.9)'; ctx.beginPath(); ctx.arc(x0 + 182, top + 104, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = rg(x0 + 40, top + 210, 6, 200, [[0, 'rgba(255,200,120,.55)'], [1, 'rgba(255,200,120,0)']]); ctx.fillRect(x0, top, x1 - x0, FY - top);   /* a lamp's warm pool */
    ctx.fillStyle = '#c9b49a'; ctx.fillRect(x0 + 60, FY - 210, 180, 18); ctx.fillStyle = '#e9eef4'; ctx.fillRect(x0 + 66, FY - 230, 174, 22);                    /* the bed's foot */
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x0, top, 26, FY - top);
    ctx.restore();
    ctx.fillStyle = lg(x0, 0, x0 + 30, 0, [[0, '#a07448'], [1, '#b88a5e']]); ctx.fillRect(x0 - 2, top, 22, FY - top); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.strokeRect(x0 - 2, top, 22, FY - top);
  } else {
    ctx.fillStyle = lg(x0, 0, x1, 0, [[0, '#b88a5e'], [1, '#a37a50']]); ctx.fillRect(x0, top, x1 - x0, FY - top); ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; ctx.strokeRect(x0, top, x1 - x0, FY - top);
    ctx.fillStyle = '#cfe0ec'; rr(x0 + 150, top + 60, 34, 150, 4); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.stroke();
    ctx.fillStyle = '#d9dde4'; rr(x0 + 22, top + 238, 46, 12, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x0 + 4, FY - 74, x1 - x0 - 8, 58);
    wreath(cx - 20, top + 150, 54, lt);
  }
  /* the plaque beside the door and the call light above it */
  const px = d.room === 3 ? x1 + 46 : x0 - 50;
  ctx.fillStyle = '#2f5f8f'; rr(px - 30, 850, 60, 40, 6); ctx.fill(); ctx.strokeStyle = '#e8eef6'; ctx.lineWidth = 2.5; ctx.stroke();
  { const sb = scrBox(px, 870, 34, 24); if (sb.x0 >= 4 && sb.x1 <= W - 4 && sb.y0 >= 4) TXT(String(d.room), px, 870, { size: 24, fill: '#ffffff', hero: false }); }
  const lv = callLevel(d.room, lt), dy = top - 44;
  ctx.fillStyle = '#e8e4dc'; rr(cx - 26, dy + 10, 52, 10, 3); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = lv > .02 ? mixc('#f4dcd8', '#ff4a3c', lv) : '#ece9e4'; ctx.beginPath(); ctx.ellipse(cx, dy + 10, 22, 20, 0, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (lv > .02) { glow(cx, dy, 120, '#ff5040', .42 * lv, .5); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(cx - 7, dy - 1, 5, 3, -.4, 0, TAU); ctx.fill(); }
}
/* the med cart (flat front): o = { t, lockLed } -> the points on its top the scene uses */
function medCart(lt) {
  const x0 = CART.x0, x1 = CART.x1, top = CART.top;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = rg((x0 + x1) / 2, FY, 10, 220, [[0, 'rgba(20,14,30,.35)'], [1, 'rgba(20,14,30,0)']]); ctx.save(); ctx.translate((x0 + x1) / 2, FY); ctx.scale(1, .12); ctx.beginPath(); ctx.arc(0, 0, 220, 0, TAU); ctx.fill(); ctx.restore();
  for (const cx of [x0 + 34, x1 - 34]) { ctx.fillStyle = '#23252c'; ctx.beginPath(); ctx.arc(cx, FY - 15, 15, 0, TAU); ctx.fill(); ink(3); ctx.fillStyle = '#9aa3b2'; ctx.beginPath(); ctx.arc(cx, FY - 15, 5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#3a3d46'; ctx.fillRect(x0 + 14, FY - 40, x1 - x0 - 28, 14);
  ctx.fillStyle = lg(x0, 0, x1, 0, [[0, '#2a5ea5'], [.55, '#2f6fb5'], [1, '#4b8ad0']]); rr(x0, top + 6, x1 - x0, FY - 40 - top - 6, 10); ctx.fill(); ink(3.4);
  for (let i = 0; i < 2; i++) {
    const yy = top + 12 + i * 50;
    ctx.fillStyle = lg(0, yy, 0, yy + 44, [[0, '#4f8ad6'], [1, '#3b72bd']]); rr(x0 + 10, yy, x1 - x0 - 20, 44, 7); ctx.fill(); ink(2.4);
    ctx.fillStyle = '#e4e9f0'; rr(x1 - 104, yy + 17, 70, 10, 5); ctx.fill(); ink(1.8);
  }
  ctx.fillStyle = '#e9eef5'; rr(x0 - 8, top - 10, x1 - x0 + 16, 18, 6); ctx.fill(); ink(3);                                  /* the top */
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x0, top - 7, x1 - x0, 4);
  ctx.fillStyle = '#d6203a'; rr(x0 - 28, top + 30, 26, 52, 5); ctx.fill(); ink(2.2); ctx.fillStyle = '#f4f4f4'; rr(x0 - 30, top + 24, 30, 9, 3); ctx.fill(); ink(1.6);   /* the sharps box on its side */
  ctx.restore();
  /* the PUDDING CUPS label on the top drawer (the match cut's label; hero only in the shot that is on it) */
  wlabel(DLAB.x, DLAB.y, DLAB.w, DLAB.h, [{ t: 'PUDDING CUPS', size: 17 }], { hero: HEROMODE && DLAB.hero ? undefined : false });
}
const DLAB = { x: 380, y: 1134, w: 140, h: 40, hero: false };
/* the gift in the hall (world px): an open box (the pudding goes in at PUT), then the Chux-wrapped box (after the insert), its tape, the label (from the slap), the glove bow (from SET) */
const PUT = snapT(1.02);
const GS = GIFT.w / 312;                                    /* the world gift is the insert's box scaled down */
function giftWorld(lt, o = {}) {
  const cx = GIFT.cx, by = GIFT.bottom;
  ctx.save(); ctx.translate(cx, by); ctx.scale(GS, GS); ctx.translate(-540, -L.INS.boxBottom);
  if (lt < CUE.rustle) openBox(lt >= PUT);
  else { wrappedBox(lt); }
  ctx.restore();
  if (lt >= CUE.labelgun - .01 && !o.noLabel) giftLabel(lt);
}
/* the open cardboard box in insert px (x 384..696, top face 902..1012, front 1012..1196), with the pudding cup inside */
function openBox(withCup, o = {}) {
  const I = L.INS;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,14,30,.28)'; ctx.beginPath(); ctx.ellipse(548, I.boxBottom + 4, 190, 16, 0, 0, TAU); ctx.fill();
  poly([[I.boxX0 + 10, I.boxTop], [I.boxX1 - 10, I.boxTop], [I.boxX1, I.boxFront], [I.boxX0, I.boxFront]], '#5e4326', INKC, 3);                                   /* the inside (dark) */
  if (withCup) { ctx.save(); ctx.beginPath(); ctx.rect(I.boxX0, 700, I.boxX1 - I.boxX0, I.boxFront - 700 + 2); ctx.clip(); pudding(ctx, { x: 540, y: I.boxFront + 30, s: 1.25 }); ctx.restore(); }
  poly([[I.boxX0, I.boxFront], [I.boxX1, I.boxFront], [I.boxX1, I.boxBottom], [I.boxX0, I.boxBottom]], lg(0, I.boxFront, 0, I.boxBottom, [[0, '#d9a868'], [1, '#c08e50']]), INKC, 3.4);   /* the front */
  poly([[I.boxX0, I.boxFront], [I.boxX0 - 30, I.boxFront - 60], [I.boxX0 + 10, I.boxTop]], '#e3b676', INKC, 3);                                                     /* the open flaps */
  poly([[I.boxX1, I.boxFront], [I.boxX1 + 30, I.boxFront - 60], [I.boxX1 - 10, I.boxTop]], '#cf9f60', INKC, 3);
  ctx.strokeStyle = 'rgba(90,60,20,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(I.boxX0 + 40, I.boxFront + 90); ctx.lineTo(I.boxX1 - 40, I.boxFront + 90); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ THE CHUX (insert px). SOFT2D cloth when the sim has been built; until then a hand-animated stand-in on the same hand paths:
// a 24 x 20 grid (720 x 600, the far edge held by her hands), brought in bunched, shaken out, lowered over the box: the far part goes behind it, the middle lies on the top face, the near part hangs down
// the front; the sides hang as flared skirts beside it; the folds turn each skirt in over the front face as a triangle (its white plastic back showing); a settle wobble after each move.
const NU = 24, NV = 20, CW = 30, CHV = 30, I = L.INS;
const CHX = new Float64Array((NU + 1) * (NV + 1) * 2), CHB = new Uint8Array(NU * NV);
const at2 = (i, j) => (j * (NU + 1) + i) * 2;
function drapeY(v) { if (v < 120) return I.boxTop - (120 - v) * .06; if (v < 360) return I.boxTop + (v - 120) / 240 * (I.boxFront - I.boxTop); return Math.min(I.boxBottom + 2, I.boxFront + (v - 360) * .8); }
function chuxStand(t) {
  const hl = HAND.at('L', t), hr = HAND.at('R', t), span = hr[0] - hl[0], bunch = 1 - c01((span - 90) / 600), f1 = ss(t, HAND.fold[0][0], HAND.fold[0][1]), f2 = ss(t, HAND.fold[1][0], HAND.fold[1][1]);
  const tr = t - CUE.rustle, wv = tr > 0 ? Math.exp(-tr * 3.2) : 0;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = -360 + i * CW, v = j * CHV, k = at2(i, j), fu = i / NU;
    /* the curtain: the far edge between the hands, the rows hanging below it (folded up while bunched, unfurling from the top row down after the shake) */
    const unf = ss(t, 3.47 + .08 * (j / NV), 3.60 + .1 * (j / NV)), vv = v * lerp(.16, 1, unf);
    let cx = lerp(hl[0], hr[0], fu) + (bunch > .05 ? bunch * 7 * ((j % 2) ? 1 : -1) : 0), cy = lerp(hl[1], hr[1], fu) + vv + bunch * 9 * (i % 2);
    if (tr > 0) { cx += 30 * Math.sin(v / 70 - tr * 15) * wv * (v / 600); cy += 10 * Math.cos(u / 90 + tr * 11) * wv * (v / 600); }
    /* the drape */
    const e = Math.abs(u) - 156, sd = u < 0 ? -1 : 1;
    let dx, dy = drapeY(v);
    if (e <= 0) dx = 540 + u;
    else { const flare = .42 * e * (v < 360 ? .7 + .3 * (v / 360) : 1); dx = 540 + sd * (156 + flare); dy = Math.min(I.boxBottom + 4 + 3 * Math.sin(i * 1.7 + j), dy + e * .62); }
    /* the folds: a skirt turns in over the front face as a triangle (wide at the bottom) */
    if (e > 0) {
      const f = sd < 0 ? f1 : f2, wvv = v >= 360 ? (v - 360) / 240 : 0, fx = 540 + sd * (156 - e * .95 * wvv), fy = v >= 360 ? drapeY(v) : drapeY(v) + e * .2;
      if (f > 0) { const ff = f, ox = dx; dx = lerp(ox, fx, ff); dy = lerp(dy, fy, ff) - 34 * Math.sin(PI * ff) * (e / 204); }
    }
    /* the drop: each row blends from the curtain to the drape (the far rows first), billowing up as it settles */
    const kd = ss(t, 3.72 + .05 * (j / NV), 3.95 + .06 * (j / NV));
    let x = lerp(cx, dx, kd), y = lerp(cy, dy, kd) - 46 * Math.sin(PI * kd) * (j / NV);
    if (t > 3.97 && e > 0) { const ag = t - 3.97; x += sd * 9 * Math.exp(-ag * 5) * Math.sin(ag * 17) * (e / 204); }
    if (t > 3.97) { const ag = t - 3.97; y += 4 * Math.exp(-ag * 6) * Math.sin(ag * 21 + i * .4) * (v > 360 ? 1 : .2); }
    CHX[k] = x; CHX[k + 1] = y;
  }
  /* which quads show their back: the skirt cells once their fold is past half way, and (while bunched) every other column */
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const u = -360 + (i + .5) * CW, e = Math.abs(u) - 156, f = u < 0 ? f1 : f2;
    CHB[j * NU + i] = (e > 0 && f > .5 && (j * CHV >= 300)) ? 1 : (bunch > .3 && i % 2 ? 1 : 0);
  }
  return { pts: CHX, back: CHB, f1, f2, bunch };
}
/* draw the stand-in mesh: far rows first, then the rest, then the folded skirts (the right one, folded last, on top); quilting on the front, a white border, shading from the cell's squash */
function drawChuxStand(st) {
  const P = st.pts, order = [];
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const u = -360 + (i + .5) * CW, e = Math.abs(u) - 156, f = u < 0 ? st.f1 : st.f2; order.push({ i, j, key: j < 4 ? 0 : (e > 0 && f > .02 && j * CHV >= 300) ? (u < 0 ? 2 : 3) : 1 }); }
  order.sort((a, b) => a.key - b.key || a.j - b.j);
  const backC = chuxColors().back;
  ctx.save(); ctx.lineJoin = 'round';
  for (const { i, j } of order) {
    const a = at2(i, j), b = at2(i + 1, j), c = at2(i + 1, j + 1), d = at2(i, j + 1);
    const ax = P[a], ay = P[a + 1], bx = P[b], by = P[b + 1], cx = P[c], cy = P[c + 1], dx = P[d], dy = P[d + 1];
    const area = .5 * ((bx - ax) * (dy - ay) - (by - ay) * (dx - ax) + (cx - bx) * (dy - by) - (cy - by) * (dx - bx)), r = c01(Math.abs(area) / (CW * CHV));
    const back = st.back[j * NU + i], border = !back && (i === 0 || i === NU - 1 || j === 0 || j === NV - 1);
    const yc = (ay + cy) / 2, xc = (ax + cx) / 2, onTop = yc < I.boxFront && xc > I.boxX0 && xc < I.boxX1, skirt = xc < I.boxX0 - 4 || xc > I.boxX1 + 4;
    const lit = (onTop ? 1.07 : 1) * (skirt && !back ? .86 : 1) * lerp(.7, 1, Math.min(1, Math.sqrt(r) * 1.15));
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy); ctx.closePath();
    ctx.fillStyle = shade(back ? backC : border ? CHUX.border : CHUX.field, lit); ctx.fill();
    ctx.strokeStyle = shade(back ? backC : border ? CHUX.border : CHUX.field, lit * .97); ctx.lineWidth = 1; ctx.stroke();
    if (!back && !border && r > .2 && (i + j) % 2 === 0) { ctx.strokeStyle = CHUX.quilt; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx, cy); ctx.moveTo(bx, by); ctx.lineTo(dx, dy); ctx.stroke(); }
  }
  /* the outline of the whole pad */
  ctx.strokeStyle = 'rgba(30,50,90,.55)'; ctx.lineWidth = 2.2; ctx.beginPath();
  for (let i = 0; i <= NU; i++) { const k = at2(i, 0); i ? ctx.lineTo(P[k], P[k + 1]) : ctx.moveTo(P[k], P[k + 1]); }
  for (let j = 1; j <= NV; j++) { const k = at2(NU, j); ctx.lineTo(P[k], P[k + 1]); }
  for (let i = NU - 1; i >= 0; i--) { const k = at2(i, NV); ctx.lineTo(P[k], P[k + 1]); }
  for (let j = NV - 1; j > 0; j--) { const k = at2(0, j); ctx.lineTo(P[k], P[k + 1]); }
  ctx.closePath(); ctx.stroke();
  ctx.restore();
}
/* the tape in the insert (insert px), stand-in on the hand paths; at t past the press the strips stay where they were pressed */
function tapeAt(t) {
  const out = [], hl = HAND.at('L', t), roll = [I.roll[0] + 30, I.roll[1] - 40];
  for (const tp of HAND.tape) {
    if (t < tp.t0) continue;
    const len = Math.hypot(tp.b[0] - tp.a[0], tp.b[1] - tp.a[1]);
    if (t < tp.tear) out.push({ a: roll, b: hl, sag: 10, pressed: 0 });
    else if (t < tp.lay) { const k = ss(t, tp.tear, tp.lay), dir = [hl[0] - roll[0], hl[1] - roll[1]], dl = Math.hypot(...dir) || 1, tail = [hl[0] - dir[0] / dl * len, hl[1] - dir[1] / dl * len];
      out.push({ a: [lerp(tail[0], tp.a[0], k), lerp(tail[1], tp.a[1], k)], b: hl, sag: 14 * (1 - k), pressed: 0 }); }
    else out.push({ a: tp.a, b: tp.b, sag: 0, pressed: ss(t, tp.lay, tp.press) });
  }
  return out;
}
function drawTapes(list) { for (const s of list) tapeStrip(s.a, s.b, 26, { sag: s.sag }); }
/* the wrapped box in insert px (the world gift draws it scaled): the box, the Chux (sim or stand-in) at time t (frozen at the end of the insert), the tape */
const WRAP_DONE = 6.95;
function wrappedBox(t) {
  const tt = Math.min(t, WRAP_DONE), sim = simState(tt), M = SIMW && SIMW.meta;
  if (sim && M && hasSoft('drawCloth')) { SIMDRAW.cloth(sim, tt, 'back'); openBox(true); SIMDRAW.cloth(sim, tt, 'front'); SIMDRAW.tapes(sim, tt); return; }
  openBox(true);
  drawChuxStand(chuxStand(tt));
  drawTapes(tapeAt(tt));
}

// ------------------------------------------------------------------ THE INSERTS (screen units at zoom 1; their own compositions)
/* the hall behind the cart, out of focus: the wall, the wainscot, the handrail and its tinsel as a soft band, the string lights as big slow bokeh discs */
function insertBG(lt, o = {}) {
  const dy = o.dy || 0;
  ctx.fillStyle = lg(0, -200, 0, 1100 + dy, [[0, '#d9cbb0'], [.55, '#e8dbbf'], [.8, '#dccdad'], [1, '#6f9ea2']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.fillStyle = 'rgba(80,130,135,.85)'; ctx.fillRect(-300, 900 + dy, W + 600, 400);
  ctx.fillStyle = rg(540, 820 + dy, 10, 140, [[0, 'rgba(170,120,70,.55)'], [1, 'rgba(170,120,70,0)']]); ctx.save(); ctx.translate(540, 820 + dy); ctx.scale(9, 1); ctx.beginPath(); ctx.arc(0, 0, 140, 0, TAU); ctx.restore(); ctx.fill();
  for (let i = 0; i < 9; i++) { const x = 60 + i * 130 + 40 * sr(i, 9), y = 830 + dy + 16 * Math.sin(i * 1.3), lv = .5 + .5 * Math.sin(lt * TAU * (.3 + .4 * sr(i, 10)) + sr(i, 11) * TAU); ctx.fillStyle = 'rgba(255,214,110,' + (.12 + .1 * lv) + ')'; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 14; i++) {
    const x = -40 + i * 86 + 30 * sr(i, 1), y = 250 + dy + 70 * Math.sin(i * .9) + 40 * sr(i, 2), col = BULB_C[i % BULB_C.length], f = .3 + .5 * sr(i, 3), lv = .62 + .38 * Math.sin(lt * TAU * f + sr(i, 4) * TAU), r = 46 + 26 * sr(i, 5);
    const [cr, cg, cb] = V2.rgb(col);
    ctx.fillStyle = rg(x, y, r * .55, r, [[0, `rgba(${cr},${cg},${cb},${.42 * lv})`], [.85, `rgba(${cr},${cg},${cb},${.3 * lv})`], [1, `rgba(${cr},${cg},${cb},0)`]]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
}
/* the cart top in close-up: the laminate surface from its back edge to its front edge, the drawers below it */
function insertCart(lt) {
  ctx.fillStyle = lg(0, I.cartBack, 0, I.cartFront, [[0, '#cfd6df'], [.25, '#e6ebf1'], [1, '#f4f7fa']]); ctx.fillRect(-300, I.cartBack, W + 600, I.cartFront - I.cartBack);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-300, I.cartFront - 18, W + 600, 6);
  ctx.fillStyle = lg(0, I.cartFront, 0, I.cartFront + 300, [[0, '#3b72bd'], [1, '#2a5ea5']]); ctx.fillRect(-300, I.cartFront, W + 600, 700);
  ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-300, I.cartFront); ctx.lineTo(W + 300, I.cartFront); ctx.stroke();
  ctx.fillStyle = lg(0, I.cartFront + 22, 0, I.cartFront + 140, [[0, '#4f8ad6'], [1, '#3b72bd']]); rr(40, I.cartFront + 22, W - 80, 140, 12); ctx.fill(); ink(3);
  ctx.fillStyle = '#e4e9f0'; rr(W / 2 - 90, I.cartFront + 70, 180, 22, 11); ctx.fill(); ink(2);
}
function insertProps(lt) {
  tapeRoll(ctx, { x: I.roll[0], y: I.roll[1], s: 1.55, t: lt });
  const tab = HAND.tape.every(tp => lt < tp.t0 || lt >= tp.tear);                                 /* the tape's end sticking out of the roll, waiting */
  if (tab) { ctx.fillStyle = 'rgba(250,247,236,.95)'; ctx.strokeStyle = 'rgba(120,110,90,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(I.roll[0] + 46, I.roll[1] - 30); ctx.lineTo(I.roll[0] + 72, I.roll[1] - 22); ctx.lineTo(I.roll[0] + 70, I.roll[1] - 4); ctx.lineTo(I.roll[0] + 50, I.roll[1] - 12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  gloveBox(ctx, { x: I.gbox[0] + 60, y: I.gbox[1], s: 1.05, t: lt, peek: 1, hero: false });
}
/* insert A, the wrap: shake, drop, drape, fold, fold, tape, tape */
function drawInsertA(lt) {
  insertBG(lt); insertCart(lt); insertProps(lt);
  wrappedBox(lt);
  /* the rustle: three short arcs off the swinging edge of the pad; the fold: a puff of air from under each skirt as it turns */
  const tr = lt - CUE.rustle;
  if (tr > 0 && tr < .32) { const k = tr / .32, hl = HAND.at('L', lt), hr = HAND.at('R', lt); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (.85 * (1 - k)) + ')'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const [x, y, s] of [[hl[0] - 30, hl[1] + 200, -1], [hr[0] + 30, hr[1] + 200, 1], [hl[0] - 24, hl[1] + 330, -1], [hr[0] + 24, hr[1] + 330, 1]]) { ctx.beginPath(); ctx.arc(x + s * 40 * k, y, 46, s > 0 ? -.6 : PI - .6 + 1.2, s > 0 ? .6 : PI + .6, s < 0); ctx.stroke(); } ctx.restore(); }
  for (const [t0, sd] of [[CUE.fold1, -1], [CUE.fold2, 1]]) { const ag = lt - t0 - .18; if (ag > 0 && ag < .4) { const k = ag / .4; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (.7 * (1 - k)) + ')'; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const y = 1150 + i * 22, x = 540 + sd * (190 + 50 * k + i * 12); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sd * 40, y + 6); ctx.stroke(); } ctx.restore(); } }
  for (const tp of HAND.tape) { const ag = lt - tp.tear; if (ag > 0 && ag < .2) { const k = ag / .2, x = I.roll[0] + 60, y = I.roll[1] - 26; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i - 2) * .5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (12 + 10 * k), y + Math.sin(a) * (12 + 10 * k)); ctx.lineTo(x + Math.cos(a) * (24 + 18 * k), y + Math.sin(a) * (24 + 18 * k)); ctx.stroke(); } ctx.restore(); } }
  /* her hands (while she folds a flap, the hand is where the flap's corner is in the sim) */
  for (const side of ['L', 'R']) {
    let [x, y] = HAND.at(side, lt); const pose = HAND.pose(side, lt), arm = HAND.arm(side), fp = foldHand(side, lt);
    if (fp) { x = fp[0]; y = fp[1]; }
    insHand(x, y, arm + PI, arm, 2.5, pose === 'flat' ? 'flat' : pose === 'pinch' ? 'pinch' : pose === 'grip' ? 'grip' : 'open');
  }
}
/* insert B1, the snap: her left hand up in its purple glove (her arm in from the lower left), the right hand (in from the lower right) pinches the cuff and pulls; glovesnap: it comes off inside out,
   her own white glove underneath wiggles; the wrapped gift below */
function drawInsertB1(lt) {
  insertBG(lt, { dy: 160 });
  ctx.save(); ctx.translate(0, 180); insertCart(lt); ctx.save(); ctx.translate(540, I.boxBottom); ctx.scale(.8, .8); ctx.translate(-540, -I.boxBottom); wrappedBox(lt); ctx.restore(); ctx.restore();
  const sn = CUE.snap, pre = lt < sn, reachK = ss(lt, 6.94, 7.03), pull = ss(lt, 7.03, sn), ag = lt - sn;
  const lw = [420, 740 + 14 * pull + (pre ? 0 : 8 * Math.sin(ag * 30) * Math.exp(-ag * 8))];                                        /* the left wrist */
  const cuff = [lw[0] + 10, lw[1] + 30];
  const pin = pre ? [lerp(760, cuff[0] + 26, reachK) + 120 * pull, lerp(1020, cuff[1] + 6, reachK) + 90 * pull] : [lerp(cuff[0] + 146, 700, eo(c01(ag / .14))), lerp(cuff[1] + 96, 930, eo(c01(ag / .14)))];
  /* the cuff stretched between the wrist and her pinch (before the snap); the peeled glove dangling from the pinch (after) */
  if (pre && reachK > .9) { const w0 = 34 - 16 * pull; ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = NIT.line; ctx.lineWidth = w0 + 5; ctx.beginPath(); ctx.moveTo(cuff[0], cuff[1]); ctx.lineTo(pin[0] - 8, pin[1] - 4); ctx.stroke(); ctx.strokeStyle = NIT.fill; ctx.lineWidth = w0; ctx.stroke(); ctx.restore(); }
  if (!pre) { const sw = Math.sin(ag * 13) * Math.exp(-ag * 4.5); gloveBalloon(ctx, { x: pin[0] - 4, y: pin[1] + 18, s: 1.25, puff: 0, rot: PI + .5 * sw, stand: true, fill: '#9b7be0' }); }
  insHand(lw[0], lw[1], -PI / 2 + (pre ? 0 : .22 * Math.sin(ag * 22) * Math.exp(-ag * 3)), PI / 2 + .62, 3.3, pre ? 'open' : (ag > .06 ? 'wave' : 'open'), !pre);
  insHand(pin[0], pin[1], pre ? -PI * .78 : -PI * .62, .62, 3.0, 'pinch');
  if (!pre && ag < .24) { const k = ag / .24; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * .42; ctx.beginPath(); ctx.moveTo(cuff[0] + Math.cos(a) * (70 + 40 * k), cuff[1] + Math.sin(a) * (70 + 40 * k)); ctx.lineTo(cuff[0] + Math.cos(a) * (106 + 60 * k), cuff[1] + Math.sin(a) * (106 + 60 * k)); ctx.stroke(); } ctx.restore(); }
}

// ------------------------------------------------------------------ the SOFT2D sim: built once (lazily), sampled with world.at(lt); null until the library and the sim's build have landed
let SIMW = null, SIMTRY = false;
function simState(lt) {
  if (!SIMTRY) { SIMTRY = true; try { const r = SIMM.build(); SIMW = r && r.world ? r : null; } catch (e) { SIMW = null; } }
  if (!SIMW) return null;
  try { return SIMW.world.at(lt); } catch (e) { return null; }
}
let CHUXP = null;
/* the screen point of a flap's folded corner (the outer column, rows 14..18 of the pad) while a fold is under way: her hand holds it there */
function foldHand(side, lt) {
  if (!SIMW || !SIMW.meta) return null;
  const f = side === 'L' ? [CUE.fold1 - .06, CUE.fold1 + .42] : [CUE.fold2 - .06, CUE.fold2 + .42]; if (lt < f[0] || lt > f[1]) return null;
  const st = simState(lt), M = SIMW.meta, c = st && st.by[M.chux]; if (!c) return null;
  const i = side === 'L' ? 0 : M.cols; let x = 0, y = 0, n = 0;
  for (let j = 14; j <= 18; j++) { const k = j * (M.cols + 1) + i; x += c.pts[2 * k]; y += c.pts[2 * k + 1] - M.dy + M.view.ky * c.z[k]; n++; }
  const k = ss(lt, f[0], f[0] + .06) * (1 - ss(lt, f[1] - .08, f[1])), h = HAND.at(side, lt);
  return [lerp(h[0], x / n + (side === 'L' ? -10 : 10), k), lerp(h[1], y / n + 6, k)];
}
const SIMDRAW = {
  /* the Chux: the part behind the box first (zMax), then the box, then the rest (zMin): the kit's print (quilted blue, white border), its white plastic back where it folds over */
  cloth(st, t, part) {
    const M = SIMW.meta, c = st.by[M.chux]; if (!c) return;
    if (!CHUXP && has22('chuxPrint')) CHUXP = A22.chuxPrint();
    const o = { fill: CHUXP || CHUX.field, back: chuxColors().back, shade: .42, view: M.view, edge: { color: 'rgba(30,60,120,.6)', width: 2 }, res: 1.2 };
    if (part === 'back') o.zMax = -M.box.hd; else o.zMin = -M.box.hd;
    ctx.save(); ctx.translate(0, -M.dy); SOFT2D.drawCloth(ctx, c, o); ctx.restore();
  },
  /* the paper tape (ropes in the plane z 150): from the moment each is pulled off the roll */
  tapes(st, t) {
    const M = SIMW.meta;
    M.tapes.forEach((id, n) => { const tp = HAND.tape[n], r = st.by[id]; if (!r || t < tp.t0) return; ctx.save(); ctx.translate(0, -M.dy + M.view.ky * 150); SOFT2D.drawRope(ctx, r, { style: 'tape', width: 26 }); ctx.restore(); });
  },
};

// ------------------------------------------------------------------ THE CAST (world px)
const KIND = k => KINDS[k];
/* a screen point (world px) in a character's body-local px (for grip targets), and the clamp of a target to the arm's reach (as ep21_medpass.js) */
function toLocal(o, sx, sy) { const k = KIND(o.kind), leg = o.noLegs ? 0 : (k.leg || 90), s = o.s || 1; return [(sx - o.x) / s, (sy - o.y + (o.lift || 0)) / s + (leg + k.ry * .9)]; }
function reach(o, side, g, R = 108) {
  const k = KIND(o.kind), sd = side === 'l' ? -1 : 1, yaw = o.yaw || 0, sx = sd * (k.shape === 'straw' ? .88 : .92) * k.rx * Math.cos(yaw), sy = (k.shape === 'straw' ? -.1 : .1) * k.ry;
  const dx = g[0] - sx, dy = g[1] - sy, d = Math.hypot(dx, dy); return d > R ? [sx + dx * R / d, sy + dy * R / d] : g;
}
const grab = (o, side, sx, sy) => reach(o, side, toLocal(o, sx, sy));
function mouthOf(o) { const k = KIND(o.kind), s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), yw = o.headYaw ?? o.yaw ?? 0, fa = window.V2C && V2C.faceAng ? V2C.faceAng(yw) : yw; return [o.x + Math.sin(fa) * k.rx * .85 * s, o.y - (o.lift || 0) - (legLen + k.ry * .9 - k.mouthY) * s]; }
function bodyBox(o, pad = 0) {
  const k = KIND(o.kind), s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05) + (o.topExtra || 0)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inFrame(o, pad = 0) {
  const b = bodyBox(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys);
  return { inter: x1 > 0 && x0 < W, whole: x0 >= 8 && x1 <= W - 8 && y0 >= 8 };
}
const santa = o => has22('santaHat') ? A22.santaHat(o) : o;
const T_STEP = [.50, 1.10], T_MANGO = [.30, 1.25], T_MANGO_GONE = snapT(13.58), T_PEAR = 16.0;
const strawX = lt => lerp(L.pos.straw0, L.pos.straw, ss(lt, T_STEP[0], T_STEP[1]));
/* STRAWBERRY (the per diem look): flat, tired, precise */
function strawOpts(lt, sh) {
  const x = strawX(lt), walking = lt > T_STEP[0] && lt < T_STEP[1];
  const o = A11.straw({ t: lt, x, y: FY, s: 1, who: 'straw', expr: 'dead', lid: .5, look: [-.3, .1], yaw: -.55, headYaw: -.6, arms: { l: 'rest', r: 'rest' }, acc: ['steth', 'bandage7', 'perdiem9'] });
  if (walking) { o.gaitW = (L.pos.straw0 - x); o.dir = -1; }
  const id = sh ? sh.id : '';
  /* the opening: a pudding cup into its box (PUT), her head turns to Mango on "shopping" */
  if (lt < 2.48) {
    if (lt >= .45 && lt < PUT + .1) { o.arms.l = 'hold'; o.hold = { l: 'fp22w_pud' }; o.grip = { l: grab(o, 'l', lerp(620, 520, ss(lt, .6, PUT)), lerp(1060, 1010, ss(lt, .6, PUT))) }; }
    else if (lt < .45) { o.arms.r = 'hold'; o.hold = { r: 'fp22w_pud' }; o.grip = { r: [96, 40] }; }
    o.headYaw = lt < W_SHOP - .1 ? -.55 : lerp(-.55, -1.05, ss(lt, W_SHOP - .1, W_SHOP + .2)); o.look = lt < W_SHOP ? [-.2, .3] : [-.6, 0];
  }
  if (id === 's1') { o.headYaw = -.95; o.look = [-.55, 0]; o.lid = .52; o.browUp = 3; if (lt > 3.06) { o.look = [-.2, .45]; o.headYaw = lerp(-.95, -.6, ss(lt, 3.06, 3.24)); } }
  /* the bow: the limp glove to her mouth, three breaths, the knot, onto the gift */
  if (lt >= 7.40 && lt < 9.40) {
    o.yaw = -.85; o.headYaw = -.85; const m = mouthOf(o), c = BOW.cuff(lt, [m[0] - 6, m[1] + 4]);
    o.arms.l = 'hold'; o.grip = { l: grab(o, 'l', c[0] + 4, c[1] + 10) }; o.hand = { l: 'grip' };
    const br = BOW.breaths.some(([a, b]) => lt >= a - .04 && lt < b);
    if (br) { o.face = { o: true }; o.lid = .3; } else o.lid = .45;
    o.look = lt < BOW.set[0] ? [-.4, -.2] : [-.5, .4];
    if (lt >= BOW.set[1] + .05) { o.arms.l = 'rest'; o.grip = null; o.hand = null; }
  }
  if (id === 's2') { o.yaw = -.55; o.headYaw = -.35; o.look = [.05, .05]; o.arms.l = 'offer'; o.lid = .48; o.browUp = 2 + 4 * bump(lt, 10.62, 11.0); }
  if (id === 'm3') { o.headYaw = -.95; o.look = [-.6, 0]; }
  if (id === 's2b') { o.headYaw = -.5; o.look = [-.1, .1]; o.lid = .5; if (lt < 12.75) { o.arms.l = 'hold'; o.grip = { l: grab(o, 'l', 548, 1020 - 10 * bump(lt, 12.3, 12.55)) }; o.hand = { l: 'flat' }; } }
  /* the label gun: up for "Dated", the slap on the gift's front (labelgun), back */
  if (lt >= 14.70 && lt < 16.60) {
    const slap = ss(lt, CUE.labelgun - .14, CUE.labelgun) * (1 - ss(lt, CUE.labelgun + .22, CUE.labelgun + .5));
    o.arms.l = 'hold'; o.hold = { l: 'fp22w_labelgun' }; o.lgRot = lerp(-.5, .05, slap); o.lgScale = 1.05; o.lgFire = lt >= CUE.labelgun - .02 && lt < CUE.labelgun + .12 ? 1 : 0;
    o.grip = { l: grab(o, 'l', lerp(600, 560, slap), lerp(970, 1046, slap)) };
    o.headYaw = lt < W_INIT ? -.45 : -.95; o.look = lt < W_INIT ? [-.2, .3] : [-.6, 0];
  }
  if (lt >= T_PEAR + .3 && lt < 17.95) { o.yaw = .25; o.headYaw = .8; o.look = [.6, .05]; o.lid = .5; }
  /* "You can have twelve.": she turns to Mr. Pear, the box of gloves up in her right hand; for the balloons the box rests low at her right side and her left hand does two gloves at a time */
  if (lt >= 17.95) {
    const up = ss(lt, 18.0, W_TWELVE) * (1 - ss(lt, 18.95, 19.12)) + (id === 's5' ? ss(lt, W_NITRILE - .3, W_NITRILE) : 0);
    o.arms.r = 'hold'; o.hold = Object.assign({}, o.hold || {}, { r: 'fp22w_gbox' }); o.gbScale = .62;
    o.grip = Object.assign({}, o.grip || {}, { r: grab(o, 'r', lerp(770, 764, up), lerp(1098, 960, up)) });
    o.yaw = .3; o.headYaw = lerp(.6, .75, ss(lt, 18.1, 18.5)); o.look = [.45, 0]; o.lid = .5;
  }
  if (id === 'balA' || id === 'balB') {
    o.yaw = -.15; o.headYaw = -.9; o.look = [-.5, -.5]; o.lid = .38;
    const ph = balPhase(lt); o.arms.l = 'hold'; o.grip = Object.assign({}, o.grip || {}, { l: grab(o, 'l', ph.hand[0], ph.hand[1]) }); o.hand = { l: 'grip' };
    if (ph.blow) { o.face = { o: true }; o.lid = .25; }
    if (id === 'balB') { o.headYaw = -.4; o.look = [-.2, -.8]; }
  }
  if (id === 'o2' || id === 's5') { o.yaw = -.35; o.headYaw = -.75; o.look = [-.55, 0]; o.lid = .55; }
  return o;
}
/* the held pudding cup (the opening) */
EXT.prop.fp22w_pud = (side, o, t) => { ctx.save(); ctx.scale(.55, .55); ctx.translate(-4, 30); REG.suppress++; pudding(ctx, { x: 0, y: 0, s: 1 }); REG.suppress--; ctx.restore(); };
PROP_BOX.fp22w_pud = Object.assign([-22, -20, 22, 20], { nearFace: true });
/* MANGO: in from the left (passing), stops by the cart; gone on her way before Onion arrives */
function mangoOpts(lt, sh) {
  if (lt >= T_MANGO_GONE) return null;
  const x = lerp(-260, L.pos.mango, eo(sg(lt, T_MANGO[0], T_MANGO[1]))), walking = lt < T_MANGO[1];
  const o = A7.mango({ t: lt, x, y: FY, s: 1, who: 'mango', expr: 'neutral', yaw: walking ? 1.2 : .6, headYaw: .65, look: [.5, .1], arms: { l: 'rest', r: 'rest' } });
  if (walking) { o.gaitW = x + 260; o.dir = 1; o.transit = true; }
  const id = sh ? sh.id : '';
  if (speaking('m1', lt)) { o.expr = 'hopeful'; o.browUp = 4; }
  if (id === 'm2' || (lt >= 9.26 && lt < 10.4)) { o.expr = 'neutral'; o.browUp = 10; o.look = [.6, .35]; o.headYaw = .7; }
  if (id === 'm3' || id === 's2') { o.expr = 'hopeful'; o.look = [.6, .3]; o.yaw = .3; o.headYaw = .6; }
  if (id === 's2b' && lt > 13.0) { o.expr = 'happy'; o.look = [.5, .1]; }
  return o;
}
/* ONION: arrives with her tablet; cries whenever policy is in the air (tears of joy) */
function onionOpts(lt, sh) {
  if (lt < T_MANGO_GONE) return null;
  const sp = speaking('o1', lt) || speaking('o2', lt), joy = ss(lt, W_INIT, W_INIT + .3) * (1 - ss(lt, 16.6, 17.2)) + ss(lt, W_NITRILE + .1, W_NITRILE + .4);
  const o = A15.onion({ t: lt, x: L.pos.onion, y: FY, s: 1, who: 'onion', yaw: .55, headYaw: .6, look: [.5, .05], cry: c01(.55 + (sp ? .25 : 0) + .4 * joy), sob: joy > .3 ? .5 + .5 * Math.sin(lt * 9) : 0, expr: 'onion_cry' });
  if (o.grip && o.grip.l) o.grip = Object.assign({}, o.grip, { l: [-64, 110] });                     /* the tablet a little lower than the kit's: clear of her face at a three-quarter turn */
  const id = sh ? sh.id : '';
  if (id === 'o2' && lt > W_LATEX - .25) { o.arms = Object.assign({}, o.arms, { r: 'up' }); o.hand = { r: 'point' }; o.headYaw = .45; o.look = [.25, -.7]; }
  if (id === 'balB' || id === 'end') { o.look = [.3, -.7]; }
  return o;
}
/* MR. PEAR: in his wheelchair in the doorway of Room 3 */
const PEAR_S = .95;
function pearOpts(lt, sh) {
  if (lt < T_PEAR) return null;
  const s = PEAR_S, seat = FY - 118 * s, id = sh ? sh.id : '';
  const o = santa(A7.pear({ t: lt, who: 'pear' }));
  Object.assign(o, { x: L.pos.pear, y: seat, s, noLegs: true, noShadow: true, noReflect: true, plant: true, expr: 'hopeful', yaw: -.5, headYaw: -.55, look: [-.5, .1], arms: { l: 'rest', r: 'rest' } });
  if (lt >= 19.1) { o.expr = 'happy'; o.look = [-.2, -.7]; o.headYaw = -.3; o.arms = { l: 'cheer', r: 'cheer' }; }
  if (lt >= 21.5) { o.arms = { l: 'rest', r: 'up' }; }
  return o;
}
function drawPear(o) {
  const x = o.x, fy = FY, s = o.s;
  if (S7 && S7.wheelchairBack) S7.wheelchairBack(x, fy, s);
  drawChar(o);
  if (S7 && S7.wheelchairFront) S7.wheelchairFront(x, fy, s, { roll: 0 });
  ctx.save(); ctx.fillStyle = '#c9554a'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(x - 112 * s, fy - 150 * s, 224 * s, 64 * s, 16 * s); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,220,.6)'; ctx.lineWidth = 4 * s; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 44 * s, fy - 146 * s); ctx.lineTo(x + i * 44 * s, fy - 90 * s); ctx.stroke(); } ctx.restore();   /* a lap blanket */
}

// ------------------------------------------------------------------ THE BALLOONS (world px). SOFT2D balloons when the sim has them; until then a hand-animated stand-in: each pair puffed at her mouth from its cue,
// swelling as her hand rises over her head, let go; a buoyant rise to the ceiling, a bounce, a slow sway along it. The hero (8) bumps into its place over Room 3 in the last shot and is still from 25.93.
const BCUE = SIMM.BALCUE.map(snapT);
const MOUTH_B = [574, 1064], UP_B = [556, 936];
function pairDur(k) { return k + 1 < BCUE.length ? Math.min(.3, BCUE[k + 1] - BCUE[k]) : .3; }
function balPhase(lt) {
  let k = -1; for (let i = 0; i < BCUE.length; i++) if (lt >= BCUE[i] - 1e-6) k = i;
  if (k < 0) return { hand: [lerp(700, MOUTH_B[0] + 8, ss(lt, 18.95, BCUE[0])), lerp(1010, MOUTH_B[1] - 4, ss(lt, 18.95, BCUE[0]))], blow: false, k };
  const d = pairDur(k), u = lt - BCUE[k];
  if (k === BCUE.length - 1 && u > d) return { hand: [lerp(UP_B[0], 700, ss(u, d, d + .5)), lerp(UP_B[1], 1010, ss(u, d, d + .5))], blow: false, k };
  if (u < d * .34) return { hand: [MOUTH_B[0] + 8, MOUTH_B[1] - 4], blow: true, k };
  const r = ss(u, d * .34, d); return { hand: [lerp(MOUTH_B[0] + 8, UP_B[0], r), lerp(MOUTH_B[1] - 4, UP_B[1], r)], blow: false, k };
}
const BALW = .82;
function balloonAt(b, lt) {
  const k = b.i >> 1, c = BCUE[k]; if (lt < c) return null;
  const d = pairDur(k), rel = c + d, s = b.s * BALW;
  if (lt < rel) {
    const h = balPhase(lt).hand, puff = lt < c + d * .34 ? .3 * sg(lt, c, c + d * .34) : .3 + .7 * ss(lt, c + d * .34, rel);
    return { x: h[0] + b.side * 14, y: h[1] - 6, rot: -.85 + b.side * .38, puff, s, knot: 0, t: lt, seed: b.seed };
  }
  const tau = lt - rel, yc = CEIL + 195 * s + 2, tr = b.i === 4 ? Math.max(.3, CUE.bonk - rel) : b.i === 2 || b.i === 3 ? Math.max(.3, CUE.squeak2 - rel) : .62;
  const x0 = UP_B[0] + b.side * 14, y0 = UP_B[1] - 6;
  let y = lerp(y0, yc, ss(tau, 0, tr)), x = lerp(x0, b.x1, ss(tau, 0, Math.max(tr, 1.5)));
  if (tau > tr) y += 18 * s * Math.exp(-5 * (tau - tr)) * Math.abs(Math.sin(9 * (tau - tr)));
  if (b.i === 2 || b.i === 3) { const m = bump(lt, CUE.squeak2 - .25, CUE.squeak2 + .45); x = lerp(x, 425 + b.side * 70, .6 * m); }
  let squeeze = (b.i === 2 || b.i === 3) ? .5 * bump(lt, CUE.squeak2 - .12, CUE.squeak2 + .3) : 0;
  if (b.i === 8) {                                                                  /* the hero: drifts in along the ceiling in the last shot, bumps, settles; still from 25.93 */
    const e0 = snapT(24.784), still = snapT(25.934);
    const xe = lt < e0 ? lerp(x0, 1188, ss(tau, 0, 1.5)) : lerp(1188, 1260, ss(lt, e0, still - .1));
    x = xe; if (lt >= e0) { const bt = lt - (e0 + .55); y = yc + (bt > 0 ? 14 * Math.exp(-6 * bt) * Math.abs(Math.sin(10 * bt)) * (1 - ss(lt, still - .2, still)) : 0); squeeze = bt > 0 && bt < .2 ? .35 * Math.sin(PI * bt / .2) : 0; }
    if (lt >= still) { x = 1260; y = yc; squeeze = 0; }
  }
  const sway = b.i === 8 && lt >= snapT(24.784) ? 1 - ss(lt, snapT(25.934) - .45, snapT(25.934)) : 1;
  let rot = lerp(-.85 + b.side * .38, .14 * Math.sin(b.seed), ss(tau, 0, .8)) + sway * .07 * Math.sin(lt * 1.1 + b.seed);
  if (b.i === 8 && lt >= snapT(24.784)) rot *= sway;
  return { x: x + sway * 4 * Math.sin(lt * 1.3 + b.seed) * ss(tau, .4, 1.2), y, rot, puff: 1, s, knot: 1, face: b.face, squeeze, t: lt, seed: b.seed, still: b.i === 8 && lt >= snapT(25.934) - .02 };
}
function drawBalloons(lt) {
  const sim = simState(lt);
  if (sim && sim.balloons && sim.balloons.length && hasSoft('drawBalloon')) { SIMDRAW.balloons && SIMDRAW.balloons(sim, lt); return; }
  for (const b of BAL) { const q = balloonAt(b, lt); if (q) gloveBalloon(ctx, q); }
  const bk = lt - CUE.bonk, b4 = balloonAt(BAL[4], lt);                             /* the bonk on the lamp: three short lines off the balloon's top */
  if (b4 && bk > 0 && bk < .3) { const k = bk / .3; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (const a of [-1.1, -1.57, -2.0]) { const r0 = 30 + 30 * k; ctx.beginPath(); ctx.moveTo(b4.x + Math.cos(a) * r0 * 1.6, CEIL + 30 + Math.sin(a) * r0 * .5); ctx.lineTo(b4.x + Math.cos(a) * (r0 + 26) * 1.6, CEIL + 30 + Math.sin(a) * (r0 + 26) * .5); ctx.stroke(); } ctx.restore(); }
}
/* the bow: limp in her hand at her mouth, blown up in three breaths, tied (squeak), set on the gift (knot at BOW.knot), a squash as it lands */
const BOW_S = .66;
function bowState(lt, mouth) {
  if (lt < 7.40) return null;
  const p = BOW.puff(lt), set = ss(lt, BOW.set[0], BOW.set[1]), c = BOW.cuff(lt, mouth);
  const held = lt < BOW.set[1];
  const rotHeld = lerp(PI * .7, -1.45, ss(p, .06, .5)), rot = held ? lerp(rotHeld, -.35, set) : -.35;
  const tie = ss(lt, BOW.tie[0], BOW.tie[1]), sq = .4 * bump(lt, CUE.squeak - .08, CUE.squeak + .16) + (lt > BOW.set[1] ? .3 * bump(lt, BOW.set[1], BOW.set[1] + .2) : 0);
  return { x: c[0], y: c[1], rot: rot + (lt > BOW.tie[0] && lt < BOW.tie[1] + .1 ? .12 * Math.sin((lt - BOW.tie[0]) * 40) : 0), puff: p, s: BOW_S, knot: tie, squeeze: sq, held, t: lt, seed: 5 };
}

// ------------------------------------------------------------------ THE SHOTS (scene-local s, snapped; the boundary frame belongs to the NEW shot)
const SH = [
  { id: 'open', s: 0, k: 'open' },
  { id: 's1', s: 2.48, k: 'fix', cx: 730, cy: 992, z: [1.54, 1.58] },
  { id: 'wrapA', s: 3.262, k: 'insA' },
  { id: 'wrapB1', s: 6.933, k: 'insB' },
  { id: 'wrapB2', s: 7.433, k: 'fix', cx: 588, cy: 1000, z: [2.16, 2.24] },
  { id: 'm2', s: 9.262, k: 'two', who: ['mango', 'straw'], up: 110, label: true },
  { id: 's2', s: 10.362, k: 'fix', cx: 578, cy: 1050, z: [1.84, 1.9] },
  { id: 'm3', s: 11.33, k: 'face', foc: 'mango', cx: 100, z: [1.92, 1.98], up: 150 },
  { id: 's2b', s: 12.20, k: 'fix', cx: 580, cy: 1046, z: [1.94, 1.98] },
  { id: 'o1', s: 13.58, k: 'face', foc: 'onion', cx: 100, z: [1.96, 2.02], up: 150 },
  { id: 's3', s: 14.81, k: 'two', who: ['onion', 'straw'], up: 70, label: true },
  { id: 'pe1', s: 16.50, k: 'face', foc: 'pear', cx: 1060, z: [2.04, 2.1], up: 110 },
  { id: 's4', s: 17.82, k: 'fix', cx: 625, cy: 1000, z: [2.1, 2.14] },
  { id: 'balA', s: 19.117, k: 'fix', cx: 625, cy: 875, z: [2.08, 2.05] },
  { id: 'balB', s: 20.317, k: 'fix', cx: 760, cy: 969, z: [1.35, 1.33] },
  { id: 'o2', s: 21.567, k: 'face', foc: 'onion', cx: 100, z: [1.98, 2.04], up: -40 },
  { id: 's5', s: 23.60, k: 'two', who: ['onion', 'straw'], up: 70, label: true },
  { id: 'end', s: 24.784, k: 'end' },
];
for (const sh of SH) sh.s = sh.s === 0 ? 0 : snapT(sh.s);
SH.forEach((sh, i) => { sh.e = i + 1 < SH.length ? SH[i + 1].s : DUR + .5; });
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const nearCut = lt => SH.some(sh => sh.s > 0 && Math.abs(lt - sh.s) < .045);
const isIns = sh => sh.k === 'insA' || sh.k === 'insB';

/* the cast of a frame (null = not in the scene at this moment) */
function castFor(lt, sh) { return { straw: strawOpts(lt, sh), mango: mangoOpts(lt, sh), onion: onionOpts(lt, sh), pear: pearOpts(lt, sh) }; }
/* the camera of a shot */
const OPEN = { z0: 3.0, z1: 1.25, a: snapT(.30), b: 1.7, c0: [DLAB.x, DLAB.y + 60 / 3.0], c1: [440, 1130] };
/* the last shot: the hero balloon (8) at rest, upright, its knot at (1260, yc): the glove's box is (-113..60, -195..-1) x s, centre (-26.6, -98) x s, 173.2 x s wide (measured): 260 px wide at (540, 520) */
const END = { still: snapT(25.934) };
function endCam() { const g = GLV(), sB = BAL[8].s * BALW, yc = CEIL + 195 * sB + 2, z1 = 260 / (g.w * sB); return { cx: 1260 + g.cx * sB, cy: yc + g.cy * sB + (960 - 520) / z1, z0: z1 * .95, z1 }; }
function camOf(lt, sh, C) {
  const dur = Math.min(sh.e, DUR) - sh.s, u = c01((lt - sh.s) / dur), zz = a => lerp(a[0], a[1], easeIO(u));
  if (sh.k === 'open') { const k = 1 - Math.pow(1 - sg(lt, OPEN.a, OPEN.b), 1.6), z = OPEN.z0 * Math.pow(OPEN.z1 / OPEN.z0, k); return { x: lerp(OPEN.c0[0], OPEN.c1[0], Math.sqrt(k)), y: lerp(OPEN.c0[1], OPEN.c1[1], k), z: z * (1 + .015 * ss(lt, OPEN.b, 2.5)) }; }
  if (sh.k === 'end') { const k = easeIO(sg(lt, sh.s, END.still - .02)), e = endCam(); return { x: e.cx, y: e.cy + 12 * (1 - k), z: lerp(e.z0, e.z1, k) }; }
  if (sh.k === 'fix') return { x: sh.cx, y: sh.cy, z: zz(sh.z) };
  if (sh.k === 'face') { const o = C[sh.foc]; if (!o) return { x: 540, y: 960, z: 1 }; const z = zz(sh.z), [fx, fy] = faceC(o); return { x: sh.cx ?? fx - (sh.dx || 0) / z, y: fy + sh.up / z, z }; }
  if (sh.k === 'two') {
    const os = sh.who.map(n => C[n]).filter(Boolean); if (!os.length) return { x: 540, y: 960, z: 1 };
    let x0 = 1e9, x1 = -1e9, fy = 0; for (const o of os) { const b = bodyBox(o, 10); x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[2]); fy += faceC(o)[1] / os.length; }
    if (sh.label) { x0 = Math.min(x0, GIFT.cx - 100); x1 = Math.max(x1, GIFT.cx + 100); }
    const z = Math.min(1.7, (W - 120) / (x1 - x0)) * (1 + .02 * easeIO(u)); return { x: (x0 + x1) / 2, y: fy + sh.up / z, z };
  }
  return { x: 540, y: 960, z: 1 };
}

// ------------------------------------------------------------------ THE FRAME
let FR = null;
function drawWorld(lt, sh, C) {
  V2.setLight({ key: [-.3, -.75], keyColor: '#fff1dc', keyA: .22, rim: '#ffe2b8', rimA: .26, shadow: '#3a2a20', shadowA: .24, bounce: '#ffd9a8', bounceA: .1, amb: '#fff2de', ambA: .06, frontDark: .02 });
  V2.opts.reflect = false;
  HEROMODE = sh.id === 'open' && lt < .9;
  DLAB.hero = HEROMODE;
  REG.suppress++;
  setCeiling(lt); setWall(lt); setFloor(lt); stringLights(lt);
  for (const [x, y, r, a] of [[300, 640, 30, .2], [560, 600, 22, .9], [780, 690, 26, .4], [1240, 640, 30, .7], [-120, 660, 24, 1.1]]) snowflake(x, y, r, a);
  for (const d of L.doors) doorUnit(d, lt);
  handrail(lt);
  REG.suppress--;
  medCart(lt);
  /* on the cart top: the tape roll, the gift, the glove box (until she picks it up) */
  tapeRoll(ctx, { x: 352, y: CART.top - 22, s: .62, t: lt });
  if (lt < 17.95) gloveBox(ctx, { x: 596, y: CART.top - 2, s: .55, t: lt, peek: 1, hero: false, label: false });
  giftWorld(lt, { noLabel: sh.id === 's3' });
  const m = C.straw ? mouthOf(C.straw) : [575, 1065], bow = bowState(lt, [m[0] - 6, m[1] + 4]);
  if (bow && !bow.held) gloveBalloon(ctx, bow);
  /* the cast: whole in the frame (or walking through its edge); Mr. Pear in the doorway behind, then Onion / Mango, then Strawberry in front of the cart's end */
  const show = o => { if (!o) return false; const f = inFrame(o, 6); return f.whole || (o.transit && f.inter); };
  if (C.pear && show(C.pear)) drawPear(C.pear);
  for (const n of ['mango', 'onion']) if (show(C[n])) drawChar(C[n]);
  if (C.straw) { if (sh.id === 'open' && lt < 1.3) C.straw.transit = true; if (show(C.straw)) drawChar(C.straw); }
  if (bow && bow.held) gloveBalloon(ctx, bow);
  if (lt >= BCUE[0] - .05) drawBalloons(lt);
  bulbGlows(lt);
  if (lt >= CUE.labelgun - .01 && sh.id === 's3') giftLabel(lt);
}
/* the label on the gift: slapped on at labelgun; DATED / TIMED / INITIALED print on it with the words (hero text in the two-shot that is on it) */
function giftLabel(lt) {
  const age = lt - CUE.labelgun, x = GIFT.cx - 4, y = GIFT.bottom - 48, w = 162, h = 72;
  HEROMODE = shotAt(lt).id === 's3';
  const r1 = ss(lt, W_DATED - .05, W_DATED + .25) * .5 + ss(lt, W_TIMED - .05, W_TIMED + .25) * .5;
  wlabel(x, y, w, h, [{ t: '12/22  6:00 PM', size: 24, reveal: Math.max(.001, r1) }, { t: 'SB', size: 26, italic: true, reveal: ss(lt, W_INIT, W_INIT + .3) || .001 }], { pop: age >= 0 && age < .3 ? age / .3 : 0, hero: HEROMODE ? undefined : false, grp: 'fp22w_giftlabel' });
  HEROMODE = false;
}
function drawFrame(lt) {
  const { sh, C } = FR;
  if (sh.k === 'insA') { drawInsertA(lt); return; }
  if (sh.k === 'insB') { drawInsertB1(lt); return; }
  drawWorld(lt, sh, C);
}
const SC22 = {
  shot: lt => shotAt(lt).id,
  cam(lt) {
    const sh = shotAt(lt), C = isIns(sh) ? {} : castFor(lt, sh);
    FR = { sh, C };
    if (isIns(sh)) { const u = sg(lt, sh.s, sh.e); zoomTo(540 + (sh.k === 'insB' ? 0 : 6 * u), 960 - (sh.k === 'insB' ? 0 : 10 * u), sh.k === 'insB' ? 1 + .03 * u : 1 + .04 * u); }
    else { const c = camOf(lt, sh, C); zoomTo(c.x, c.y, c.z); }
    const still = (sh.id === 'open' && lt < OPEN.a) || (sh.k === 'end' && lt >= END.still - .02);
    if (!still) { CAM.x += 1.6 * hnoise(lt, 1.1, 1); CAM.y += 1.2 * hnoise(lt, .9, 2); CAM.r = .0008 * hnoise(lt, .7, 3); } else CAM.r = 0;
  },
  draw(lt) { drawFrame(lt); },
  fx: lt => ({ bloom: .42, vignette: .24, grain: .04, contrast: .08, sat: .08, tint: [['#ffb46a', .06, 'soft-light']] }),
  blur: lt => nearCut(lt) ? 1 : (lt > CUE.rustle && lt < CUE.rustle + .3) || (lt > CUE.snap - .05 && lt < CUE.snap + .2) || (lt > BCUE[0] && lt < 20.7) ? 3 : 2,
  over(lt) {},
};
window.__EP22_SCENES = window.__EP22_SCENES || {};
window.__EP22_SCENES.wrap = SC22;
})();
