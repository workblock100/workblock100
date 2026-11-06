'use strict';
/* SHIFT HAPPENS, Episode 21: "The Inspection". Builder E21-PREP. Scene `prep` (3:05 PM, SURVEY MODE, 31.64 s). Registers window.__EP21_SCENES.prep.
 *
 * THE STATION: one flat stage, world units, floor line FL 1250 (the camera is zoomTo on a point or a face), in the same left-to-right order as the ARRIVE builder's station: the crash cart and the med fridge
 * (x 120-560), the nurses' station counter (x 600-1190; the staff stand BEHIND it, so it hides their legs; on its top the coffee maker, the juice carton, the laminator, the banana and the cups), the wall
 * behind it (the NURSES' STATION sign, the clock, the FUN COMMITTEE poster that flips to HAND HYGIENE, the shelf of policy binders), Brenda's closet (x 1240-1420: NOT A CLOSET), then the hall (the handrail,
 * the sanitizer dispenser). The state of every object follows the montage (labelled, padlocked, wiped, logged, aligned, mopped, flipped, hidden, refilled, sealed): ST(lt).
 * THE HALL: S6.corridor in one-point perspective (as Episode 15's model2) for Melon and the forty agency Strawberries (34 cached sprites behind, a front row of six real characters at speaking size).
 * THE MONTAGE: twelve inserts of exactly 1.0 s on the 120 bpm grid, drawn in screen units (zoomTo 540, 960, 1), each its own composition; the main action lands on the shot's first frame (the cue) and a
 * smaller second hit on the off-beat 0.5 s later; a 2 px camera punch on every cut.
 *
 * SHOTS (scene-local s; every start snapped to a frame; the boundary frame is the NEW shot):
 *   open 0-1.03 the station in panic (wide) | t1 1.03-2.24 Tomato, the label gun up: "Label everything!" (a burst of labels on "everything") |
 *   o1 2.24-4.19 Onion labels the banana (Date 2.30), the cup (Time 2.87) and Tomato's forehead (Initial 3.43) | t2 4.19-5.90 Tomato, labelled, in her party hat: "Should I cancel the Fun Committee?" |
 *   o1b 5.90-7.20 Onion feeds the party hat into the laminator ("Laminate" 5.96); it comes out flat and shiny on "it" (6.54) |
 *   MONTAGE (cut k at 7.211 + k, snapped to frame 1160 + 30k of the episode = scene 7.197 + k): 1 labelgun 2 padlock 3 spray 4 thermobeep 5 binderslam 6 mop 7 posterflip 8 closetslam 9 coffeehide
 *     10 sanitizer 11 crashcart 12 sparkle |
 *   me1 19.20-20.36 the empty hall, Melon: "Where is our staffing?" | agency 20.36-21.58 the poofs (20.49 far, 20.74 middle, 20.99 front): forty Strawberries fill the hall |
 *   ch1 21.58-22.68 the front row: "Agency!" | s1 22.68-23.48 Strawberry faces forty of herself: "Who are they?" | l1 23.48-25.26 Lemon: "Agency. For one day." |
 *   br1a 25.26-26.72 the closet door (NOT A CLOSET, a crumb under the door), the voice from inside | br1b 26.72-27.62 Onion and Tomato turn to the closet | br1c 27.62-28.72 the crumb is pulled in |
 *   o2 28.72-30.19 Onion: "Survey ready." (sparkle 29.29: the station gleams) | end 30.19-31.64 the perfect, terrifyingly clean station (sting 30.29).
 */
(() => {
if (!window.TIMELINE_EP21 || !window.H6 || !window.UI || !window.A7 || !window.A11 || !window.A15 || !window.FX18) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eo3 = k => 1 - Math.pow(1 - c01(k), 3);
const ei = k => k * k;
const eb = k => { k = c01(k); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const rn = (s, k) => FX18.rnd(s, k);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rg = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
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
const INKC = 'rgba(25,16,30,.86)';
const poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } };
const ink = (lw = 3) => { ctx.strokeStyle = INKC; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };

// ------------------------------------------------------------------ the frozen timeline: beats, words, frame snapping (helpers as in ep18_station.js / ep20_forecast.js)
const TLX = window.TIMELINE_EP21;
function tl(id) {
  const SCN = TLX.scenes.find(s => s.id === id), START = SCN.start, LN = {};
  for (const l of TLX.lines) if (l.scene === id) LN[l.id] = l;
  return { SCN, START, LN, bS: b => SCN.beats[b].s, bE: b => SCN.beats[b].e, ls: b => LN[b].s - START, le: b => LN[b].e - START,
    wS: (b, i) => LN[b].s - START + LN[b].words[i][1], wE: (b, i) => LN[b].s - START + LN[b].words[i][2], snapT: t => Math.round((START + t) * 30) / 30 - START };
}
const TP = tl('prep');
/* the loudness of a recorded line at scene time lt (0..1, from the mouth track the characters use): the closet door trembles with Brenda's voice */
function voice(id, lt) {
  const l = TP.LN[id]; if (!l) return 0;
  const f = (lt - (l.s - TP.START)) * 30; if (f < 0 || f >= l.mouth.length) return 0;
  const i = Math.floor(f), j = Math.min(l.mouth.length - 1, i + 1), u = f - i, dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
  return lerp(dg(i), dg(j), u);
}
const speaking = (id, lt, a = .08, b = .2) => !!TP.LN[id] && lt >= TP.ls(id) - a && lt < TP.le(id) + b;
/* the cues (python3 /tmp/shift_tools/cues.py 21 prep), snapped to the frame the picture hits */
const MCUE = ['labelgun', 'padlock', 'spray', 'thermobeep', 'binderslam', 'mop', 'posterflip', 'closetslam', 'coffeehide', 'sanitizer', 'crashcart', 'sparkle'];
const M0 = TP.snapT(7.211);
const MT = MCUE.map((_, k) => TP.snapT(7.211 + k));                          /* the twelve cuts: frame 1160 + 30 k of the episode */
const MOFF = MT.map(t => TP.snapT(t + .5 + .0143) );                         /* the off-beat of each shot (frame 15 of the shot) */
const M_END = TP.snapT(7.211 + 12);
const CUE = { poof: [20.494, 20.744, 20.994].map(TP.snapT), sparkle2: TP.snapT(29.289), sting: TP.snapT(30.291) };
const W_DATE = TP.snapT(TP.wS('o1', 0)), W_TIME = TP.snapT(TP.wS('o1', 2)), W_INIT = TP.snapT(TP.wS('o1', 4));
const W_LAM = TP.snapT(TP.wS('o1b', 0)), W_LAMIT = TP.snapT(TP.wS('o1b', 1)), W_EVERY = TP.snapT(TP.wS('t1', 1));
const W_FUN = TP.snapT(TP.wS('t2', 4)), W_ONE = TP.snapT(TP.wS('l1', 2)), W_2019 = TP.snapT(TP.wS('br1', 5)), W_READY = TP.snapT(TP.wS('o2', 1));

// ------------------------------------------------------------------ text: hero only where it is safe (the viewer can read it, clear of the frame edge, the caption zone and the clock pill)
let SOFT = 0;                                              /* > 0 while a blurred background is drawn: its text is never hero */
let HEROMODE = false;                                      /* true while an insert or an object shot draws its subject sharp: every other piece of set text is dressing */
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
function scrBox(cx, cy, hw, hh) {
  const m = ctx.getTransform(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [u, v] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) { const X = m.a * (cx + u) + m.c * (cy + v) + m.e, Y = m.b * (cx + u) + m.d * (cy + v) + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return { x0: a, y0: b, x1: c, y1: d };
}
function heroOK(size, cx, cy, w, h = size) {
  if (SOFT || !HEROMODE || size * scrOf(ctx) < 31) return false;
  const b = scrBox(cx, cy, w / 2 + 10, h * .5 + 10);
  return b.x0 >= 50 && b.x1 <= W - 50 && b.y0 >= 50 && b.y1 <= 1372 && !(b.x0 < 506 && b.y0 < 250 && b.x1 > 40 && b.y1 > 108);
}
/* a label: hero when heroOK says so (or o.hero), else set dressing (crop allowed). o.align 'left' | 'right' anchors the ink edge at cx. */
function TXT(str, cx, cy, o = {}) {
  const size0 = o.size || 30, fit = o.maxW ? UI.fit(str, o.maxW, { size: size0, font: o.font, weight: o.weight, italic: o.italic, spacing: o.spacing, lw: o.lw }) : null, size = fit ? fit.size : size0;
  const wd = (fit ? fit.w : UI.sizeOf(str, o).w) || size * str.length * .6, mid = o.align === 'left' ? cx + wd / 2 : o.align === 'right' ? cx - wd / 2 : cx;
  const hero = o.hero !== undefined ? !!o.hero : heroOK(size, mid, cy, wd);
  return (o.k !== undefined ? UI.strike : UI.label)(str, cx, cy, Object.assign({}, o, { hero, crop: o.crop !== undefined ? o.crop : !hero }));
}
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; if (typeof FX18.glow === 'function') FX18.glow(ctx, { x, y, r, color, alpha: a, core: core ?? .5 }); };
function star4(x, y, r, rot, fill, a = 1) {                                 /* a four-point twinkle */
  if (a <= .01 || r <= .5) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= c01(a); ctx.fillStyle = fill;
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr2 = i % 2 ? r * .2 : r, a2 = i * PI / 4; ctx.lineTo(Math.cos(a2) * rr2, Math.sin(a2) * rr2); } ctx.closePath(); ctx.fill();
  ctx.restore();
}
function twinkle(x, y, r, age, life = .5, col = '#ffffff') {                   /* a star that grows, spins a little and fades: age in seconds */
  if (age < 0 || age > life) return;
  const k = age / life, sz = r * Math.sin(PI * Math.min(1, k * 1.25));
  glow(x, y, r * 2.2, col === '#ffffff' ? '#fffbe8' : col, .35 * (1 - k), .4);
  star4(x, y, sz, k * .8, col, 1 - k * .6);
}
function burst(x, y, age, R, n = 8, col = 'rgba(255,255,255,.95)', lw = 6, life = .22, rot = 0) {   /* impact lines that fly out from a hit */
  if (age < 0 || age > life) return;
  const k = age / life; ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = lw * (1 - k * .7);
  for (let i = 0; i < n; i++) { const a = rot + i * TAU / n, r0 = R * (.55 + .5 * k), r1 = R * (.8 + .7 * k); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); }
  ctx.restore();
}
const puff = (x, y, r, t, t0, o = {}) => { if (typeof FX18.puff === 'function') FX18.puff(ctx, Object.assign({ x, y, r, t, t0, life: .7, color: '#e9e4da', seed: 3 }, o)); };

// ------------------------------------------------------------------ the A21 survey props, with stand-ins until the kit's batch 3 lands (checked at DRAW time)
const has21 = n => !!(window.A21 && typeof window.A21[n] === 'function');
/* a white survey label (red band, two lines of ink): o = { x, y (centre), s, rot, text, t, hero }; returns its box in the current units */
function labelStand(o) {
  const s = o.s || 1, w = 236 * s, h = 92 * s, words = String(o.text || 'OPENED 11/6 3:05P SB').split(' '), cut = Math.min(2, words.length - 1), l1 = words.slice(0, cut || 1).join(' '), l2 = words.slice(cut || 1).join(' ');
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
  ctx.fillStyle = 'rgba(30,20,30,.18)'; rr(-w / 2 + 3 * s, -h / 2 + 5 * s, w, h, 9 * s); ctx.fill();
  ctx.fillStyle = lg(0, -h / 2, 0, h / 2, [[0, '#ffffff'], [1, '#eef0f2']]); rr(-w / 2, -h / 2, w, h, 9 * s); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.55)'; ctx.lineWidth = Math.max(1, 2.2 * s); ctx.stroke();
  ctx.save(); rr(-w / 2, -h / 2, w, h, 9 * s); ctx.clip(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-w / 2, -h / 2, w, 13 * s); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(w / 2 - 22 * s, h / 2); ctx.lineTo(w / 2, h / 2 - 22 * s); ctx.lineTo(w / 2, h / 2); ctx.closePath(); ctx.fill();   /* a peeled corner */
  const sz = 30 * s, base = { size: sz, weight: 900, fill: '#1e2230', maxW: w - 30 * s, hero: o.hero, spacing: 1 * s };
  if (l2) { TXT(l1, 0, -h / 2 + 13 * s + (h - 13 * s) * .3, base); TXT(l2, 0, -h / 2 + 13 * s + (h - 13 * s) * .72, Object.assign({}, base, { weight: 800, fill: '#2a3550' })); }
  else TXT(l1, 0, 6 * s, base);
  ctx.restore();
  return [o.x - w / 2, o.y - h / 2, o.x + w / 2, o.y + h / 2];
}
const surveyLabel = o => { if (has21('label')) return A21.label(ctx, Object.assign({}, o, { s: (o.s || 1) * 236 / 250 })); if (o.t0 != null && (o.t ?? 0) < o.t0) return null; return labelStand(o); };
/* a padlock (brass body, steel shackle): o = { x, y (centre of the body), s, shut 0..1, swing (radians about the shackle top), t } */
function padlockStand(o) {
  const s = o.s || 1, sh = c01(o.shut ?? 1), lift = (1 - sh) * 46 * s;
  ctx.save(); ctx.translate(o.x, o.y - 70 * s); ctx.rotate(o.swing || 0); ctx.translate(0, 70 * s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.save(); ctx.translate(0, -lift); ctx.rotate(-(1 - sh) * .5);                                                   /* the shackle */
  ctx.strokeStyle = '#3a3e48'; ctx.lineWidth = 26 * s; ctx.beginPath(); ctx.moveTo(-38 * s, -10 * s); ctx.lineTo(-38 * s, -62 * s); ctx.arc(0, -62 * s, 38 * s, PI, 0); ctx.lineTo(38 * s, -10 * s); ctx.stroke();
  ctx.strokeStyle = lg(-50 * s, 0, 50 * s, 0, [[0, '#d9dde6'], [.45, '#ffffff'], [1, '#8e95a3']]); ctx.lineWidth = 19 * s; ctx.stroke();
  ctx.restore();
  ctx.fillStyle = lg(-60 * s, -40 * s, 60 * s, 60 * s, [[0, '#ffe28a'], [.5, '#e3b03a'], [1, '#9a6a12']]); rr(-60 * s, -34 * s, 120 * s, 104 * s, 18 * s); ctx.fill(); ink(4 * s);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-50 * s, -26 * s, 22 * s, 84 * s, 10 * s); ctx.fill();
  ctx.fillStyle = '#3a2a10'; ctx.beginPath(); ctx.arc(0, 8 * s, 11 * s, 0, TAU); ctx.fill(); ctx.fillRect(-4.5 * s, 8 * s, 9 * s, 26 * s);
  ctx.restore();
}
const padlockP = o => has21('padlock') ? A21.padlock(ctx, { x: o.x, y: o.y, s: (o.s || 1) * 1.72, rot: o.swing || 0, t: o.t, open: 1 - c01(o.shut ?? 1), t0: o.t0, color: 'brass' }) : padlockStand(o);
/* the wall sanitizer dispenser: o = { x, y (centre), s, pump 0..1 (the bar pressed, a dollop leaves the nozzle), level 0..1, t } -> { nozzle: [x, y] } */
function sanitizerStand(o) {
  const s = o.s || 1, p = c01(o.pump || 0), lv = c01(o.level ?? 1);
  ctx.save(); ctx.translate(o.x, o.y); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.2)'; rr(-70 * s, -116 * s, 150 * s, 250 * s, 26 * s); ctx.fill();
  ctx.fillStyle = '#c9ced8'; rr(-58 * s, -132 * s, 116 * s, 20 * s, 8 * s); ctx.fill(); ink(3 * s);                           /* the wall bracket */
  ctx.fillStyle = lg(-75 * s, 0, 75 * s, 0, [[0, '#ffffff'], [.6, '#f3f6fa'], [1, '#c8d0dc']]); rr(-75 * s, -120 * s, 150 * s, 236 * s, 30 * s); ctx.fill(); ink(4 * s);
  ctx.fillStyle = '#16233a'; rr(-30 * s, -78 * s, 60 * s, 92 * s, 10 * s); ctx.fill();                                         /* the level window */
  ctx.fillStyle = lg(0, 14 * s, 0, 14 * s - 92 * s * lv, [[0, '#7fd3ff'], [1, '#c8f0ff']]); rr(-26 * s, 10 * s - 84 * s * lv, 52 * s, 84 * s * lv, 7 * s); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(-22 * s, -74 * s, 8 * s, 80 * s, 4 * s); ctx.fill();
  ctx.save(); ctx.translate(0, 70 * s + p * 14 * s);                                                                          /* the push bar */
  ctx.fillStyle = lg(0, -16 * s, 0, 22 * s, [[0, '#4aa3df'], [1, '#1f6fae']]); rr(-62 * s, -16 * s, 124 * s, 40 * s, 14 * s); ctx.fill(); ink(3.4 * s); ctx.restore();
  ctx.fillStyle = '#9aa3b2'; rr(-12 * s, 112 * s, 24 * s, 18 * s, 5 * s); ctx.fill(); ink(2.6 * s);                         /* the nozzle */
  ctx.restore();
  return { nozzle: [o.x, o.y + 130 * s] };
}
const sanitizerP = o => { if (has21('sanitizer')) { const k = (o.s || 1) * 1.17; A21.sanitizer(ctx, { x: o.x, y: o.y, s: k, t: o.t, pump: o.pump || 0, level: o.level ?? 1, t0: o.t0, label: o.label }); return { nozzle: [o.x, o.y + 113 * k] }; } return sanitizerStand(o); };
/* the fridge thermometer: a round dial (blue too cold, green 36-46 F, red too warm), o = { x, y, s, deg, t, beep 0..1 } */
const DEG_A = d => lerp(-2.2, 2.2, c01((d - 26) / 40)) - PI / 2;              /* 26 F at the lower left, 66 F at the lower right */
function thermoStand(o) {
  const s = o.s || 1, R = 150 * s;
  ctx.save(); ctx.translate(o.x, o.y); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.beginPath(); ctx.arc(8 * s, 12 * s, R + 18 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(0, -R, 0, R, [[0, '#f1f4f8'], [1, '#aab3c2']]); ctx.beginPath(); ctx.arc(0, 0, R + 16 * s, 0, TAU); ctx.fill(); ink(4 * s);
  ctx.fillStyle = '#fbfcfd'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ink(2.5 * s);
  for (const [d0, d1, col] of [[26, 36, '#3d8ff0'], [36, 46, '#2dbb5a'], [46, 66, '#e2333f']]) { ctx.strokeStyle = col; ctx.lineWidth = 26 * s; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(0, 0, R - 26 * s, DEG_A(d0), DEG_A(d1)); ctx.stroke(); }
  ctx.strokeStyle = '#2a2f3a'; ctx.lineCap = 'round';
  for (let d = 26; d <= 66; d += 2) { const a = DEG_A(d), r0 = R - (d % 10 === 6 ? 62 : 50) * s; ctx.lineWidth = (d % 10 === 6 ? 4 : 2) * s; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (R - 42 * s), Math.sin(a) * (R - 42 * s)); ctx.stroke(); }
  for (const d of [36, 46]) { const a = DEG_A(d); TXT(String(d), Math.cos(a) * (R - 90 * s), Math.sin(a) * (R - 90 * s), { size: 26 * s, weight: 900, fill: '#2a2f3a', hero: o.hero }); }
  TXT('°F', 0, 62 * s, { size: 24 * s, weight: 900, fill: '#5a6070', hero: false });
  const a = DEG_A(o.deg ?? 40);
  ctx.save(); ctx.rotate(a + PI / 2); ctx.fillStyle = '#d4202c'; ctx.beginPath(); ctx.moveTo(-6 * s, 16 * s); ctx.lineTo(0, -(R - 30 * s)); ctx.lineTo(6 * s, 16 * s); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.arc(0, 0, 14 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-50 * s, -70 * s, 70 * s, 34 * s, -.6, 0, TAU); ctx.fill();   /* the glass */
  ctx.restore();
}
const thermoP = o => has21('fridgeThermo') ? A21.fridgeThermo(ctx, { x: o.x, y: o.y, s: (o.s || 1) * 2.07, deg: o.deg, t: o.t, wobble: o.wobble || 0, hero: o.hero }) : thermoStand(o);
const SAFE_DEG = () => has21('fridgeThermo') ? 37 : 40, HOT_DEG = () => has21('fridgeThermo') ? 50 : 52;
/* the crash cart (red, five drawers, a hasp on the top drawer with a numbered breakaway seal): o = { x, y (bottom centre), s, open 0..1 (the top drawer ajar), seal 0..1 (the tag on), tagSwing, t } */
function crashCartStand(o) {
  const s = o.s || 1, w = 300 * s, h = 430 * s, x0 = o.x - w / 2, y0 = o.y - h - 26 * s, op = c01(o.open || 0);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(20,10,20,.25)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + 2 * s, w * .56, 16 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2730'; for (const dx of [-.38, .38]) { ctx.beginPath(); ctx.arc(o.x + dx * w, o.y - 13 * s, 13 * s, 0, TAU); ctx.fill(); }
  ctx.fillStyle = lg(x0, 0, x0 + w, 0, [[0, '#ff4a4f'], [.5, '#e3232b'], [1, '#a5121a']]); rr(x0, y0, w, h, 14 * s); ctx.fill(); ink(4 * s);
  ctx.fillStyle = '#d7dbe3'; rr(x0 - 10 * s, y0 - 14 * s, w + 20 * s, 22 * s, 8 * s); ctx.fill(); ink(3.4 * s);                    /* the top tray */
  const dh = (h - 30 * s) / 5;
  for (let i = 0; i < 5; i++) {
    const dy = y0 + 14 * s + i * dh, out = i === 0 ? op * 30 * s : 0;
    ctx.fillStyle = i % 2 ? '#e8262f' : '#f03a42'; rr(x0 + 12 * s - out * .2, dy + out * .1, w - 24 * s + out * .4, dh - 10 * s, 8 * s); ctx.fill(); ink(3 * s);
    ctx.fillStyle = '#f4f5f7'; rr(o.x - 46 * s, dy + dh * .5 - 9 * s, 92 * s, 14 * s, 6 * s); ctx.fill(); ink(2.4 * s);           /* the handle bar */
  }
  /* the hasp and the seal on the top drawer's right side */
  const hx = x0 + w - 34 * s, hy = y0 + 14 * s + dh * .45;
  ctx.fillStyle = '#c3c8d2'; rr(hx - 12 * s, hy - 16 * s, 24 * s, 32 * s, 5 * s); ctx.fill(); ink(2.6 * s);
  if ((o.seal ?? 1) > .02) { ctx.save(); ctx.translate(hx, hy + 8 * s); ctx.rotate(o.tagSwing || 0); ctx.globalAlpha *= c01((o.seal ?? 1) * 3);
    ctx.strokeStyle = '#ffd21f'; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(0, -4 * s); ctx.quadraticCurveTo(8 * s, 20 * s, 0, 34 * s); ctx.stroke();
    ctx.fillStyle = '#ffd21f'; rr(-16 * s, 34 * s, 32 * s, 46 * s, 6 * s); ctx.fill(); ink(2.4 * s); ctx.restore(); }
  ctx.restore();
  return { x0, y0, x1: x0 + w, y1: o.y, hasp: [hx, hy] };
}
const crashCartP = o => { if (has21('crashCart')) { const s = o.s || 1; A21.crashCart(ctx, { x: o.x, y: o.y, s, t: o.t, open: o.open || 0, sealed: (o.seal ?? 1) > .5, seal: '0042137', t0: o.sealT0 }); return { hasp: [o.x + 129 * s, o.y - 350 * s], kit: true }; } return crashCartStand(o); };
const crashCartBox = o => { const s = o.s || 1; return { x0: o.x - 150 * s, y0: o.y - 456 * s, x1: o.x + 150 * s, y1: o.y, hasp: [o.x + 116 * s, o.y - 456 * s + 14 * s + 80 * s * .45] }; };
/* one policy binder seen from its spine: o = { x, y (centre), w, h, rot, color, spine (text), t } */
function binderStand(o) {
  const w = o.w || 60, h = o.h || 220, col = o.color || '#2f5fa8';
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, shade(col, 1.25)], [.5, col], [1, shade(col, .7)]]); rr(-w / 2, -h / 2, w, h, Math.min(10, w * .16)); ctx.fill(); ink(Math.max(1.5, w * .05));
  ctx.fillStyle = '#f7f6f0'; rr(-w * .38, -h * .34, w * .76, h * .32, 3); ctx.fill();                                            /* the spine label window */
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-w * .42, -h * .46, w * .12, h * .92);
  ctx.fillStyle = shade(col, .5); ctx.beginPath(); ctx.arc(0, h * .3, w * .14, 0, TAU); ctx.fill();                           /* the finger hole */
  if (o.spine) TXT(o.spine, 0, -h * .18, { size: Math.min(w * .36, 44), weight: 900, fill: '#1e2230', maxW: w * .68, hero: o.hero });
  ctx.restore();
}
const binderP = o => has21('binder') ? A21.binder(ctx, o) : binderStand(o);
/* the AGENCY sticker badge (accessory on the chest): A21.agencyBadge when it lands, else this stand-in. o.agNoText: no lettering (for the cached crowd sprites) */
EXT.acc.fp21p_agency = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .44, k.ry * .26); ctx.rotate(-.1);
  ctx.fillStyle = '#ffffff'; rr(-35, -15, 70, 30, 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.save(); rr(-35, -15, 70, 30, 6); ctx.clip(); ctx.fillStyle = '#7a3fb0'; ctx.fillRect(-35, -15, 70, 7); ctx.restore();
  if (!o.agNoText) TXT('AGENCY', 0, 3.5, { size: 14, weight: 900, fill: '#5a2a90', maxW: 62, hero: false });
  else { ctx.fillStyle = 'rgba(90,42,144,.55)'; ctx.fillRect(-22, 1, 45, 5); }
  ctx.restore();
};
function agencyOn(o) {
  const A = window.A21;
  if (A && typeof A.agencyBadge === 'function') { const r = A.agencyBadge(o); return r && typeof r === 'object' ? r : o; }
  if (A && typeof A.agencyBadge === 'string') { o.acc = (o.acc || []).concat([A.agencyBadge]); return o; }
  o.acc = (o.acc || []).filter(a => a !== 'perdiem9').concat(['fp21p_agency']); return o;
}

// ------------------------------------------------------------------ the insert hand: a white cartoon glove on a thin dark arm (the cast's own hands, scaled up for the montage)
/* (x, y) = the wrist, ang = the direction the fingers point, S = scale (the engine hand is about 46 px long at 1), pose 'open' | 'grip' | 'fist' | 'flat' | 'point' | 'thumb', mir = mirror the thumb side */
function glove(x, y, ang, S, pose = 'open', mir = false, armLen = 1600) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#141018'; ctx.lineWidth = 9.5 * S; ctx.beginPath(); ctx.moveTo(-armLen, 0); ctx.lineTo(2 * S, 0); ctx.stroke();       /* the arm */
  ctx.strokeStyle = '#2f2a38'; ctx.lineWidth = 6.5 * S; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.moveTo(-armLen, -1.6 * S); ctx.lineTo(0, -1.6 * S); ctx.stroke();
  ctx.scale(S, mir ? -S : S);
  const gl = lg(0, -16, 0, 16, [[0, '#ffffff'], [1, '#d9deea']]), fs = () => { ctx.fillStyle = gl; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); };
  const seam = (x0, y0, x1, y1) => { ctx.save(); ctx.strokeStyle = 'rgba(30,20,40,.5)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); };
  ctx.fillStyle = gl; rr(-10, -9, 16, 18, 6); fs();                                                                              /* the cuff */
  switch (pose) {
    case 'fist': case 'grip': { const r = pose === 'grip' ? 16 : 14.5; ctx.beginPath(); ctx.ellipse(10, 0, r, r * .97, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(9, r * .62, 9.5, 6.6, .3, 0, TAU); fs(); for (const y2 of [-7, -2.5, 2]) seam(17, y2, 24, y2 + .5); break; }
    case 'point': ctx.beginPath(); ctx.ellipse(8, 0, 13.5, 13, 0, 0, TAU); fs(); ctx.beginPath(); ctx.roundRect(14, -10, 30, 9.5, 4.7); fs(); ctx.beginPath(); ctx.ellipse(8, 11, 8.5, 6, .3, 0, TAU); fs(); break;
    case 'thumb': ctx.beginPath(); ctx.ellipse(9, 0, 14, 13.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.roundRect(1, -34, 10, 26, 5); fs(); for (const y2 of [-6, -1.5, 3]) seam(16, y2, 22, y2); break;
    case 'flat': ctx.beginPath(); ctx.ellipse(16, 0, 22, 10.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(6, 11, 9, 5.5, .35, 0, TAU); fs(); for (const y2 of [-5, 0, 5]) seam(28, y2, 36, y2); break;
    default: ctx.beginPath(); ctx.ellipse(11, 0, 15.5, 13.5, 0, 0, TAU); fs(); ctx.beginPath(); ctx.ellipse(7, 12.5, 8.5, 5.8, .5, 0, TAU); fs(); for (const y2 of [-6, -.5, 5]) seam(19, y2, 25, y2);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ held props (prefix fp21p_), drawn around the hand in the character's own scaled frame
/* the label gun: a chunky grey pistol-grip labeller with a roll of labels on top; o.lgFire 0..1 = a label sticking out of the nose; o.lgScale, o.lgRot */
function labelGunArt(fire) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#4a4f5c'; rr(-10, -6, 22, 48, 8); ctx.fill(); ink(2.6);                                                   /* the grip */
  ctx.fillStyle = '#ffcf2e'; rr(-4, 8, 14, 22, 5); ctx.fill(); ink(2);                                                       /* the trigger lever */
  ctx.fillStyle = lg(0, -34, 0, 4, [[0, '#9aa3b4'], [1, '#5c6474']]); rr(-34, -34, 90, 34, 10); ctx.fill(); ink(2.8);          /* the body */
  ctx.fillStyle = '#f7f6ee'; ctx.beginPath(); ctx.arc(2, -46, 20, 0, TAU); ctx.fill(); ink(2.4); ctx.fillStyle = '#d4202c'; ctx.beginPath(); ctx.arc(2, -46, 7, 0, TAU); ctx.fill();   /* the roll */
  ctx.fillStyle = '#2a2f3a'; rr(50, -26, 14, 20, 4); ctx.fill();                                                               /* the nose */
  if (fire > .02) { ctx.save(); ctx.translate(62, -16); ctx.rotate(.12 * (1 - fire)); ctx.fillStyle = '#ffffff'; rr(0, -9, 34 * fire, 18, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#d4202c'; ctx.fillRect(0, -9, 34 * fire, 4); ctx.restore(); }
}
EXT.prop.fp21p_labelgun = (side, o, t) => { const S = o.lgScale || 1.15; ctx.save(); ctx.rotate((o.lgRot ?? -.2) * side); ctx.scale(S * side, S); labelGunArt(c01(o.lgFire || 0)); ctx.restore(); };
/* where the label gun's nose is, relative to the holding LEFT hand (character units), for a gun angle lgRot and scale S (the prop rotates by lgRot * side and mirrors for side -1) */
function gunNose(rot, S) { const X = -62 * S, Y = -16 * S, a = -rot; return [Math.cos(a) * X - Math.sin(a) * Y, Math.sin(a) * X + Math.cos(a) * Y]; }
PROP_BOX.fp21p_labelgun = o => Object.assign(o && o.lgTight ? [-36, -40, 67, 4] : [-60, -90, 60, 50], { nearFace: true, mirror: true });   /* tight while it tags a forehead: the nose only touches the label above the face */
/* the sandwich (two slices, lettuce, cheese, tomato; a bite out of the top right): origin = the middle of the bottom edge */
function sandwichArt(bite = 1) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (bite > 0) { ctx.beginPath(); ctx.rect(-60, -60, 120, 70); ctx.arc(34, -42, 18 * bite, 0, TAU, true); ctx.clip(); }
  ctx.fillStyle = '#e2bd84'; rr(-38, -12, 76, 14, 5); ctx.fill(); ink(3);
  ctx.fillStyle = '#5fbf4a'; ctx.beginPath(); ctx.moveTo(-37, -12); for (let i = 0; i <= 9; i++) ctx.lineTo(-37 + i * 8.2, -12 - 6 - (i % 2) * 5); ctx.lineTo(37, -12); ctx.closePath(); ctx.fill(); ink(2.4);
  ctx.fillStyle = '#ffc62e'; rr(-37, -22, 74, 6, 2); ctx.fill(); ink(2.2);
  ctx.fillStyle = '#e8473a'; rr(-32, -28, 64, 6, 3); ctx.fill(); ink(2.2);
  ctx.fillStyle = '#e8c58c'; rr(-39, -42, 78, 15, 6); ctx.fill(); ink(3);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; rr(-30, -39, 40, 4, 2); ctx.fill();
  ctx.restore();
}
EXT.prop.fp21p_sandwich = (side, o, t) => { const S = o.sandScale || .9; ctx.save(); ctx.rotate(o.sandTilt || 0); ctx.scale(S, S); sandwichArt(1); ctx.restore(); };
PROP_BOX.fp21p_sandwich = o => { const S = o.sandScale || .9; return Object.assign([-42 * S, -46 * S, 42 * S, 6 * S], { nearFace: true }); };
/* Tomato's party hat (as fp19s_partyhat of Episode 19): o.hat = { c1, c2, rot, dx, dy, s } */
function partyHatArt(sc, c1, c2) {
  ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath();
  ctx.fillStyle = lg(-31 * sc, 0, 31 * sc, 0, [[0, V2.rgba(V2.mix(c1, '#ffffff', .25), 1)], [.5, c1], [1, V2.rgba(V2.mix(c1, '#2a1030', .35), 1)]]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = c2; ctx.lineWidth = 9 * sc; for (let i = -3; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-40 * sc, i * 24 * sc); ctx.lineTo(40 * sc, i * 24 * sc - 34 * sc); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * Math.max(.8, sc); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = c2; ell(0, 3 * sc, 33 * sc, 6 * sc); ctx.fill(); ctx.stroke();
  const pr = 9 * sc; ctx.fillStyle = rg(-3 * sc, -100 * sc, 1, pr * 1.4, [[0, '#ffffff'], [1, c2]]); ell(0, -97 * sc, pr, pr); ctx.fill(); ctx.stroke();
}
EXT.acc.fp21p_partyhat = (o, k, t, layer) => {
  if (layer !== 'front' || o.hatOff) return;
  const h = o.hat || {}, sc = (h.s || 1) * k.rx / 110;
  ctx.save(); ctx.translate((h.dx ?? .2) * k.rx, -k.ry * (h.dy ?? .92)); ctx.rotate((h.rot ?? .22) + .025 * Math.sin(t * 2.1 + (o.seed || 0)));
  partyHatArt(sc, h.c1 || '#ffd23a', h.c2 || '#e8406a'); ctx.restore();
};
/* the label on Tomato's forehead (Onion's initials) */
EXT.acc.fp21p_flabel = (o, k, t, layer) => {
  if (layer !== 'front' || !(o.flabel > 0)) return;
  const pop = eb(c01(o.flabel)), sc = k.rx / 128;
  ctx.save(); ctx.translate(-k.rx * .1, k.eyeY - k.er * 2.9 - 6); ctx.rotate(-.09); ctx.scale(sc * pop, sc * pop);
  ctx.fillStyle = 'rgba(30,20,30,.18)'; rr(-33, -13, 70, 30, 6); ctx.fill();
  ctx.fillStyle = '#ffffff'; rr(-35, -16, 70, 30, 6); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.save(); rr(-35, -16, 70, 30, 6); ctx.clip(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-35, -16, 70, 6); ctx.restore();
  if (pop > .9) TXT('O.N.', 0, 2, { size: 15, weight: 900, fill: '#1e2230', maxW: 56, hero: false });
  ctx.restore();
};
if (typeof V2C !== 'undefined' && V2C.ACC_CLS) { V2C.ACC_CLS.fp21p_partyhat = 'head'; V2C.ACC_CLS.fp21p_flabel = 'face'; }

// ====================================================================================================================================================================================
// THE STATION: the set. World units; floor line FL 1250; the stage runs from x -600 to 2400 (the wall and the floor are drawn far past the frame).
// ====================================================================================================================================================================================
const FL = 1250;
const CTR = { x0: 600, x1: 1190, top: 1176, front: 1198, base: 1342 };          /* the counter: the staff stand behind it (feet on FL) */
const CART = { x: 236, y: 1266, s: .78 };                                        /* the crash cart (bottom centre) */
const FRIDGE = { x0: 392, x1: 552, y0: 880, y1: 1262 };                          /* the glass-door med fridge */
const POSTER = { x: 640, y: 440, w: 200, h: 240 };                               /* the FUN COMMITTEE / HAND HYGIENE poster (top-left corner) */
const SHELF = { x0: 872, x1: 1176, y: 792 };                                     /* the binder shelf (the board's top) */
const CLOCKP = { x: 1030, y: 520, r: 50 }, SIGNP = { x: 880, y: 382, w: 420, h: 58 };
const CLOSET = { x0: 1244, x1: 1416, y0: 712, win: [1294, 1010, 72, 124] };      /* Brenda's closet: the frame, the vision window [x, y, w, h] at the cast's eye level */
const SAN = { x: 1520, y: 880, s: .42 };                                         /* the sanitizer dispenser in the hall */
const STAND = { tom: [752, FL], onion: [968, FL], lemon: [1120, FL], mango: [1330, 1380], straw: [348, 1312], brenda: [1490, 1262] };
const SCL = { tom: .95, onion: .82, lemon: .86, mango: .9, straw: .84, brenda: .76, melon: 1.0 };
/* the state of the station: what the montage has done by scene time lt */
const ST = lt => ({
  labels: lt >= MT[0], lock: lt >= MT[1], wiped: lt >= MOFF[2], logged: lt >= MOFF[3], aligned: lt >= MT[4], wet: lt >= MT[5], wetSign: lt >= MOFF[5], flip: lt >= MT[6] + .12,
  brendaIn: lt >= MT[7], closetSign: lt >= MOFF[7], coffeeGone: lt >= MT[8], full: lt >= MT[9], sealed: lt >= MT[10], gleam: ss(lt, MT[11], MT[11] + .6),
  bananaLab: lt >= W_DATE + .03, cupLab: lt >= W_TIME + .03, lam: lt >= W_LAMIT + .1,
});

function stWall(lt, st) {
  const top = '#efe7d6', bot = '#e4d9c3', wain = '#5f9a96';
  ctx.fillStyle = lg(0, 330, 0, FL, [[0, '#f6f0e3'], [.4, top], [1, bot]]); ctx.fillRect(-1600, 300, 4400, FL - 300);
  ctx.fillStyle = lg(0, 1010, 0, FL, [[0, wain], [1, shade(wain, .84)]]); ctx.fillRect(-1600, 1010, 4400, FL - 1010);                /* the wainscot */
  ctx.fillStyle = '#faf6ec'; ctx.fillRect(-1600, 1002, 4400, 12); ctx.fillStyle = 'rgba(30,20,30,.26)'; ctx.fillRect(-1600, 1014, 4400, 4);   /* the chair rail */
  ctx.fillStyle = '#f2ece0'; ctx.fillRect(-1600, FL - 26, 4400, 26); ctx.fillStyle = 'rgba(30,20,30,.3)'; ctx.fillRect(-1600, FL - 26, 4400, 3);   /* the skirting */
  ctx.strokeStyle = 'rgba(60,44,40,.09)'; ctx.lineWidth = 2; for (let x = -1400; x < 2800; x += 220) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 1000); ctx.stroke(); }
  ctx.fillStyle = '#d9d2c4'; ctx.fillRect(-1600, -900, 4400, 1230);                                                                  /* the ceiling band */
  ctx.fillStyle = 'rgba(40,30,40,.16)'; ctx.fillRect(-1600, 326, 4400, 6);
  const VX = 760, VY = 980, sc = y => (VY - y) / (VY - 326), px = (x, y) => VX + (x - VX) * sc(y);
  ctx.strokeStyle = 'rgba(255,255,255,.36)'; ctx.lineWidth = 3;
  for (let x = -2000; x <= 3400; x += 200) { ctx.beginPath(); ctx.moveTo(x, 326); ctx.lineTo(px(x, -900), -900); ctx.stroke(); }
  for (let j = 1; j <= 10; j++) { const y = 326 - 38 * j * (1 + j * .2); ctx.beginPath(); ctx.moveTo(-2400, y); ctx.lineTo(3600, y); ctx.stroke(); }
  for (const lx of [-240, 260, 760, 1260, 1760]) for (const [ya, yb] of [[250, 288], [96, 168]]) {
    poly([[px(lx - 90, yb), yb], [px(lx + 90, yb), yb], [px(lx + 90, ya), ya], [px(lx - 90, ya), ya]], 'rgba(255,255,248,.95)', INKC, 2.4);
    glow(lx, yb + 24, 280, '#fff8e1', (ya > 200 ? .2 : .1) + .1 * st.gleam, .1);
  }
}
function stFloor(lt, st) {
  ctx.fillStyle = lg(0, FL, 0, 2400, [[0, '#d6cfc1'], [1, '#bdb4a3']]); ctx.fillRect(-1600, FL, 4400, 1300);
  ctx.strokeStyle = 'rgba(60,46,50,.14)'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 9; i++) { const y = FL + 10 + Math.pow(i / 8, 1.7) * 900; ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(2800, y); ctx.stroke(); }
  for (let x = -2400; x <= 3800; x += 190) { ctx.beginPath(); ctx.moveTo(x * .42 + 440, FL); ctx.lineTo(x * 1.55 - 140, 2300); ctx.stroke(); }
  ctx.fillStyle = lg(0, FL, 0, FL + 70, [[0, 'rgba(30,20,30,.18)'], [1, 'rgba(30,20,30,0)']]); ctx.fillRect(-1600, FL, 4400, 70);
  if (st.wet) {                                                                                                                       /* the mopped shine */
    ctx.save(); ctx.globalAlpha = .5 + .2 * st.gleam; ctx.fillStyle = lg(0, 1290, 0, 1500, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
    ctx.beginPath(); ctx.ellipse(980, 1400, 520, 70, -.02, 0, TAU); ctx.fill(); ctx.restore();
  }
}
function stSign() {
  const S = SIGNP; ctx.fillStyle = 'rgba(30,20,30,.18)'; rr(S.x - S.w / 2 + 6, S.y - S.h / 2 + 8, S.w, S.h, 10); ctx.fill();
  UI.panel([S.x - S.w / 2, S.y - S.h / 2, S.w, S.h], { r: 10, fill: ['#2b5f9e', '#1d4478'], stroke: 'rgba(25,16,30,.86)', lw: 3, id: 'nsign', pad: 6 });
  TXT("NURSES' STATION", S.x, S.y, { size: 30, weight: 900, fill: '#ffffff', spacing: 3, cid: 'nsign', maxW: S.w - 40 });
}
function stClock(lt) {
  const C = CLOCKP; ctx.save(); ctx.translate(C.x, C.y);
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.beginPath(); ctx.arc(5, 7, C.r + 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.arc(0, 0, C.r + 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#fbfaf5'; ctx.beginPath(); ctx.arc(0, 0, C.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a2f3a'; ctx.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12, r0 = C.r * (i % 3 ? .82 : .74); ctx.lineWidth = i % 3 ? 2 : 3.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * C.r * .92, Math.sin(a) * C.r * .92); ctx.stroke(); }
  const mm = 5 + lt / 60, hA = ((3 + mm / 60) / 12) * TAU - PI / 2, mA = (mm / 60) * TAU - PI / 2, sA = ((lt + 12) / 60) * TAU - PI / 2;
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hA) * C.r * .5, Math.sin(hA) * C.r * .5); ctx.stroke();
  ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(mA) * C.r * .76, Math.sin(mA) * C.r * .76); ctx.stroke();
  ctx.strokeStyle = '#d4202c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sA) * C.r * .84, Math.sin(sA) * C.r * .84); ctx.stroke();
  ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); ctx.restore();
}
/* the poster: two faces. side 0 FUN COMMITTEE (purple, a party hat), side 1 HAND HYGIENE (green, two hands and the steps). Drawn at (x, y) top-left, w x h; o.k: the flip 0..1 (about the vertical axis) */
function posterFace(side, x, y, w, h, id) {
  if (side === 0) {
    ctx.fillStyle = lg(0, y, 0, y + h, [[0, '#f6e8ff'], [1, '#ffe9f4']]); rr(x, y, w, h, 8); ctx.fill(); ink(3);
    UI.container(id, 'sign', [x, y, x + w, y + h], 4);
    ctx.save(); ctx.translate(x + w * .5, y + h * .88); ctx.rotate(-.18); partyHatArt(h * .0026, '#ffd23a', '#7b4bd6'); ctx.restore();
    for (let i = 0; i < 14; i++) { ctx.fillStyle = ['#ff4d6d', '#ffd23a', '#3ec6e0', '#7ad94a'][i % 4]; ctx.fillRect(x + w * (.08 + .84 * rn(7, i)), y + h * (.6 + .3 * rn(8, i)), w * .028, h * .018); }
    TXT('FUN COMMITTEE', x + w / 2, y + h * .1, { size: h * .07, weight: 900, fill: '#6a3fb0', spacing: 1.2, cid: id, maxW: w * .86 });
    TXT('PARTY', x + w / 2, y + h * .27, { size: h * .2, font: 'Bangers', weight: 400, fill: '#e8406a', stroke: '#ffffff', lw: h * .028, spacing: 2, cid: id, maxW: w * .8 });
    TXT('TIME!', x + w / 2, y + h * .46, { size: h * .2, font: 'Bangers', weight: 400, fill: '#e8406a', stroke: '#ffffff', lw: h * .028, spacing: 2, cid: id, maxW: w * .8 });
    TXT('MANDATORY FUN 3 PM', x + w / 2, y + h * .94, { size: h * .035, weight: 900, fill: '#6a3fb0', cid: id, maxW: w * .86, hero: false });
  } else {
    ctx.fillStyle = lg(0, y, 0, y + h, [[0, '#e6fbf1'], [1, '#d4f2ff']]); rr(x, y, w, h, 8); ctx.fill(); ink(3);
    UI.container(id, 'sign', [x, y, x + w, y + h], 4);
    ctx.fillStyle = '#1e8e5a'; rr(x + w * .06, y + h * .04, w * .88, h * .17, 6); ctx.fill();
    TXT('HAND HYGIENE', x + w / 2, y + h * .125, { size: h * .075, weight: 900, fill: '#ffffff', spacing: 1, cid: id, maxW: w * .8 });
    for (const sd of [-1, 1]) { ctx.save(); ctx.translate(x + w * (.5 + sd * .17), y + h * .43); ctx.rotate(-PI / 2 + sd * .25); ctx.scale(h * .0062, sd * h * .0062); ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(11, 0, 15.5, 13.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1e5a8e'; ctx.lineWidth = 3.4; ctx.stroke(); ctx.beginPath(); ctx.ellipse(7, 12.5, 8.5, 5.8, .5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(120,200,255,.7)'; ctx.beginPath(); ctx.arc(x + w * (.25 + .5 * rn(11, i)), y + h * (.3 + .25 * rn(12, i)), h * (.008 + .012 * rn(13, i)), 0, TAU); ctx.fill(); }
    TXT('CLEAN HANDS', x + w / 2, y + h * .66, { size: h * .1, font: 'Bangers', weight: 400, fill: '#1e5a8e', spacing: 1.5, cid: id, maxW: w * .86 });
    TXT('SAVE LIVES', x + w / 2, y + h * .79, { size: h * .1, font: 'Bangers', weight: 400, fill: '#1e8e5a', spacing: 1.5, cid: id, maxW: w * .86 });
    TXT('WASH  RUB  20 SECONDS', x + w / 2, y + h * .92, { size: h * .035, weight: 900, fill: '#1e5a8e', cid: id, maxW: w * .86, hero: false });
  }
}
function stPoster(lt, st) {
  const P = POSTER;
  ctx.fillStyle = 'rgba(30,20,30,.18)'; rr(P.x + 6, P.y + 8, P.w, P.h, 8); ctx.fill();
  posterFace(st.flip ? 1 : 0, P.x, P.y, P.w, P.h, 'poster');
  ctx.fillStyle = '#d4202c'; for (const [px2, py2] of [[P.x + 12, P.y + 12], [P.x + P.w - 12, P.y + 12]]) { ctx.beginPath(); ctx.arc(px2, py2, 4.5, 0, TAU); ctx.fill(); }
}
/* the binder shelf: messy (leaning, a gap, one lying flat) until the slam, then upright and tight; o.k is the slam's progress 0..1 for the insert */
const BIND = [['#2f5fa8', '1.1'], ['#a8323a', '2.3'], ['#2e8a57', '3.6'], ['#6a3fb0', '4.2'], ['#d98a1a', '5.5'], ['#2a6f86', '6.1'], ['#c2272d', '7.4'], ['#3d4a66', '8.8'], ['#7a5a2a', '9.3']];
function stShelf(lt, st) {
  const S = SHELF, w = S.x1 - S.x0, bw = 30, bh = 150;
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(S.x0 + 4, S.y + 12, w, 10);
  ctx.fillStyle = lg(0, S.y, 0, S.y + 14, [[0, '#d9c29a'], [1, '#a68660']]); rr(S.x0, S.y, w, 14, 3); ctx.fill(); ink(2.6);
  for (const bx of [S.x0 + 30, S.x1 - 30]) { ctx.fillStyle = '#8a95a8'; ctx.beginPath(); ctx.moveTo(bx - 6, S.y + 14); ctx.lineTo(bx + 6, S.y + 14); ctx.lineTo(bx, S.y + 40); ctx.closePath(); ctx.fill(); }
  BIND.forEach(([col, sp], i) => {
    let x = S.x0 + 22 + i * (bw + 2) + bw / 2, rot = 0, y = S.y - bh / 2, h = bh;
    if (!st.aligned) { const mess = [[-6, -.06], [0, 0], [8, .14], [14, .17], [30, -.1], [36, 0], [44, .05], [62, -.17], [66, -.15]][i]; x += mess[0]; rot = mess[1]; if (i === 4) { rot = -PI / 2 + .02; x = S.x1 - 66; } }
    const flat = Math.abs(rot) > .2, by = flat ? S.y - bw / 2 : S.y - Math.cos(rot) * bh / 2, sb = scrBox(x, by, bw / 2, bh / 2);   /* no spine text when lying flat, near the frame edge or under the clock pill */
    const clear = sb.x0 > 46 && sb.x1 < W - 46 && sb.y0 > 46 && sb.y1 < H - 46 && !(sb.x0 < 506 && sb.y0 < 250);
    binderP({ x, y: by, w: bw, h, rot, color: col, spine: flat || !clear ? false : sp, t: lt, hero: false });
  });
}
/* Brenda's closet: a plain door in a frame, a narrow vision window (dark inside: a shelf, a mop) that the NOT A CLOSET sign covers from the off-beat of shot 8 on; a crumb under the door */
function notACloset(cx, cy, s, rot, id, hero) {                                /* the paper sign, hand-lettered in marker: (cx, cy) its centre */
  const w = 132 * s, h = 92 * s;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(-w / 2 + 4 * s, -h / 2 + 6 * s, w, h);
  ctx.fillStyle = '#fffdf6'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = 'rgba(60,50,40,.45)'; ctx.lineWidth = 1.6 * s; ctx.strokeRect(-w / 2, -h / 2, w, h);
  UI.container(id, 'sign', [-w / 2, -h / 2, w / 2, h / 2], 5 * s);
  TXT('NOT A', 0, -h * .2, { size: 28 * s, font: 'Lucky', weight: 400, fill: '#1e2230', spacing: 1.5 * s, cid: id, maxW: w - 20 * s, hero });
  TXT('CLOSET', 0, h * .2, { size: 32 * s, font: 'Lucky', weight: 400, fill: '#d4202c', spacing: 1.5 * s, cid: id, maxW: w - 16 * s, hero });
  ctx.fillStyle = 'rgba(236,226,168,.85)'; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * (w / 2 - 8 * s), -h / 2 + 2 * s); ctx.rotate(sd * .5); ctx.fillRect(-16 * s, -6 * s, 32 * s, 12 * s); ctx.restore(); }
  ctx.restore();
}
function closetInside(x, y, w, h) {                                            /* what the window shows: a dim closet (a shelf of paper towels, the head of a mop) */
  ctx.fillStyle = lg(0, y, 0, y + h, [[0, '#4a4f60'], [1, '#2c3040']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#6a6f80'; ctx.fillRect(x, y + h * .34, w, 5); ctx.fillStyle = '#e8e6de'; for (let i = 0; i < 3; i++) { ctx.fillRect(x + 6 + i * 17, y + h * .34 - 26, 14, 26); }
  ctx.fillStyle = '#8a7a5a'; ctx.fillRect(x + w * .7, y + h * .4, 5, h * .6);
}
function stCloset(lt, st, o = {}) {
  const C = CLOSET, x0 = C.x0, x1 = C.x1, y0 = C.y0, dx0 = x0 + 12, dx1 = x1 - 12, dy0 = y0 + 12, [wx, wy, ww, wh] = C.win, rattle = (o.rattle || 0);
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.fillRect(x0 + 8, y0 + 8, x1 - x0, FL - y0 - 8);
  ctx.fillStyle = '#e9e2d2'; ctx.fillRect(x0, y0, x1 - x0, FL - y0); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, x1 - x0, FL - y0);   /* the frame */
  ctx.save(); ctx.translate(rattle * 1.6, 0);
  ctx.fillStyle = lg(dx0, 0, dx1, 0, [[0, '#d8cdb8'], [.5, '#e6dcc8'], [1, '#c9bda6']]); ctx.fillRect(dx0, dy0, dx1 - dx0, FL - dy0); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(dx0, dy0, dx1 - dx0, FL - dy0);
  ctx.strokeStyle = 'rgba(80,60,40,.25)'; ctx.lineWidth = 2; ctx.strokeRect(dx0 + 16, dy0 + 30, dx1 - dx0 - 32, 220); ctx.strokeRect(dx0 + 16, dy0 + 450, dx1 - dx0 - 32, 50);
  if (!st.closetSign || o.showWin) { ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); closetInside(wx, wy, ww, wh); if (o.inWin) o.inWin(wx, wy, ww, wh); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(wx, wy + wh * .5); ctx.lineTo(wx + ww * .6, wy); ctx.lineTo(wx + ww, wy); ctx.lineTo(wx, wy + wh); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = '#9aa0ac'; ctx.lineWidth = 5; ctx.strokeRect(wx, wy, ww, wh);
  ctx.fillStyle = '#b9bec9'; rr(dx1 - 30, 1146, 20, 40, 6); ctx.fill(); ink(2.2); ctx.fillStyle = '#e4e7ee'; rr(dx1 - 46, 1158, 32, 12, 6); ctx.fill(); ink(2);   /* the lever handle */
  ctx.fillStyle = '#7a8090'; rr(dx0 + 44, dy0 + 270, 60, 18, 4); ctx.fill();                                                         /* a blank room plate */
  if (st.closetSign && o.sign !== false) notACloset(wx + ww / 2, wy + wh / 2 + 2, 1, -.035 + .03 * rattle, 'nac', o.hero);
  ctx.restore();
  if (st.closetSign) {
    ctx.fillStyle = '#2a2230'; ctx.fillRect(CLOSET.x0 + 14, FL - 5, CLOSET.x1 - CLOSET.x0 - 28, 5);                                    /* the gap under the door */
    const cx = o.crumbX ?? 1352, cy = FL + 4 - (o.crumbIn || 0) * 5; if ((o.crumbIn || 0) < 1) { ctx.fillStyle = '#e2bd84'; ctx.beginPath(); ctx.ellipse(cx, cy, 9, 5.5, .3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,30,.7)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#5fbf4a'; ctx.beginPath(); ctx.ellipse(cx + 3, cy - 2, 3.4, 2, .4, 0, TAU); ctx.fill(); }
    if (o.fingers > 0) { ctx.save(); ctx.beginPath(); ctx.rect(CLOSET.x0, FL - 4, CLOSET.x1 - CLOSET.x0, 60); ctx.clip(); ctx.translate(cx + 20, FL - 4 + 16 * o.fingers); ctx.scale(.55, .55);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffffff'; rr(-30 + i * 22, -40, 18, 46, 9); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); } ctx.restore(); }
  }
}
function stCart(lt, st) { crashCartP({ x: CART.x, y: CART.y, s: CART.s, open: st.sealed ? 0 : .7, seal: st.sealed ? 1 : 0, t: lt, hero: false }); }
function stFridge(lt, st) {
  const F = FRIDGE, w = F.x1 - F.x0, h = F.y1 - F.y0;
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.fillRect(F.x0 + 8, F.y0 + 10, w, h - 6);
  ctx.fillStyle = lg(F.x0, 0, F.x1, 0, [[0, '#ffffff'], [1, '#d5dbe4']]); rr(F.x0, F.y0, w, h, 10); ctx.fill(); ink(3);
  const gx = F.x0 + 14, gy = F.y0 + 16, gw = w - 28, gh = h - 70;
  ctx.fillStyle = lg(0, gy, 0, gy + gh, [[0, '#cfe6f5'], [1, '#a8c6dc']]); rr(gx, gy, gw, gh, 6); ctx.fill(); ctx.strokeStyle = 'rgba(40,60,90,.6)'; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 1; i < 4; i++) { const sy = gy + gh * i / 4; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(gx + 4, sy, gw - 8, 4);
    for (let j = 0; j < 4; j++) { ctx.fillStyle = ['#f2a33a', '#e8e6de', '#5fa8e8', '#f2f2f2'][(i + j) % 4]; rr(gx + 10 + j * 31, sy - 30, 20, 30, 4); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.4)'; ctx.lineWidth = 1.4; ctx.stroke(); } }
  ctx.save(); ctx.translate(gx + gw / 2, gy + 34); thermoP({ x: 0, y: 0, s: .14, deg: st.logged ? SAFE_DEG() : HOT_DEG(), t: lt, hero: false }); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(gx, gy + gh * .6); ctx.lineTo(gx + gw * .5, gy); ctx.lineTo(gx + gw * .8, gy); ctx.lineTo(gx, gy + gh); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9aa3b2'; rr(F.x1 - 26, gy + 40, 10, gh - 80, 5); ctx.fill();                                                      /* the handle */
  ctx.fillStyle = '#fbfaf2'; ctx.fillRect(F.x0 + 22, F.y1 - 50, w - 44, 36); ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 1.6; ctx.strokeRect(F.x0 + 22, F.y1 - 50, w - 44, 36);   /* the TEMP LOG */
  ctx.fillStyle = 'rgba(60,70,100,.45)'; for (let j = 0; j < 3; j++) ctx.fillRect(F.x0 + 28, F.y1 - 44 + j * 10, w - 70, 3);
  if (st.logged) { ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(F.x1 - 38, F.y1 - 30); ctx.lineTo(F.x1 - 33, F.y1 - 24); ctx.lineTo(F.x1 - 25, F.y1 - 38); ctx.stroke(); }
}
/* the counter's front: laminate, a kick plate, two drawer stacks and a pair of cabinet doors; the snack drawer is top left (padlocked from shot 2 on) */
function stCounterFront(lt, st) {
  const C = CTR, w = C.x1 - C.x0;
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(C.x0 - 8, C.base - 6, w + 16, 16);
  ctx.fillStyle = lg(0, C.front, 0, C.base, [[0, '#e9d6b8'], [1, '#c9ae86']]); ctx.fillRect(C.x0, C.front, w, C.base - C.front); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(C.x0, C.front, w, C.base - C.front);
  ctx.fillStyle = '#5a4a3a'; ctx.fillRect(C.x0 + 6, C.base - 18, w - 12, 14);
  const dr = (x, y, ww, hh) => { ctx.fillStyle = '#efe0c6'; rr(x, y, ww, hh, 5); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,40,.6)'; ctx.lineWidth = 2.2; ctx.stroke(); ctx.fillStyle = '#9aa3b2'; rr(x + ww / 2 - 18, y + 10, 36, 7, 3.5); ctx.fill(); };
  dr(C.x0 + 20, C.front + 14, 130, 52); dr(C.x0 + 20, C.front + 72, 130, 50);
  dr(C.x1 - 150, C.front + 14, 130, 52); dr(C.x1 - 150, C.front + 72, 130, 50);
  for (const dx of [C.x0 + 175, C.x0 + 300]) { ctx.fillStyle = '#efe0c6'; rr(dx, C.front + 14, 115, 108, 5); ctx.fill(); ctx.strokeStyle = 'rgba(80,60,40,.6)'; ctx.lineWidth = 2.2; ctx.stroke(); ctx.fillStyle = '#9aa3b2'; rr(dx + (dx < C.x0 + 250 ? 98 : 8), C.front + 50, 7, 30, 3.5); ctx.fill(); }
  ctx.fillStyle = '#f5e7a8'; ctx.save(); ctx.translate(C.x0 + 85, C.front + 30); ctx.rotate(-.04); ctx.fillRect(-30, -9, 60, 16); TXT('SNACKS', 0, -1, { size: 11, font: 'Lucky', weight: 400, fill: '#3a2a1a', hero: false, maxW: 54 }); ctx.restore();
  if (st.lock) padlockP({ x: C.x0 + 85, y: C.front + 58, s: .16, shut: 1, swing: .05 * Math.sin(lt * 2), t: lt });
  ctx.fillStyle = lg(0, C.top - 4, 0, C.front, [[0, '#f7ecd8'], [1, '#d9c3a0']]); rr(C.x0 - 12, C.top - 4, w + 24, C.front - C.top + 6, 4); ctx.fill(); ink(3);   /* the top's front edge */
  if (st.wiped) { ctx.save(); ctx.globalAlpha = .5 + .4 * st.gleam; ctx.fillStyle = lg(C.x0, 0, C.x1, 0, [[0, 'rgba(255,255,255,0)'], [.45, 'rgba(255,255,255,.85)'], [.55, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(C.x0, C.top - 2, w, 6); ctx.restore(); }
}
/* the things on the counter top (drawn after the staff: they stand in front of their bodies, never their faces) */
const TOPX = { coffee: 628, banana: 846, cup: 868, carton: 1054, lam: 1136 };
function juiceCarton(x, y, s, labs) {                                          /* a gable-top carton, bottom centre (x, y); labs: how many survey labels are on it */
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.beginPath(); ctx.ellipse(4, 2, 34, 6, 0, 0, TAU); ctx.fill();
  poly([[-28, 0], [28, 0], [28, -96], [-28, -96]], lg(-28, 0, 28, 0, [[0, '#ffffff'], [1, '#dfe3ea']]), INKC, 3);
  poly([[-28, -96], [28, -96], [14, -122], [-14, -122]], '#ff9a2a', INKC, 3); poly([[-14, -122], [14, -122], [14, -134], [-14, -134]], '#ffb24a', INKC, 2.6);
  ctx.fillStyle = '#ff8a1a'; ctx.fillRect(-28, -70, 56, 30); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(-10, -55, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#3aa64a'; ctx.beginPath(); ctx.ellipse(-4, -67, 6, 3, -.5, 0, TAU); ctx.fill();
  if (labs > 0) { ctx.fillStyle = '#ffffff'; rr(-22, -36, 44, 18, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-22, -36, 44, 4); }
  if (labs > 1) { ctx.fillStyle = '#ffffff'; rr(-20, -16, 40, 13, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-20, -16, 40, 3); }
  ctx.restore();
}
function bananaArt(x, y, s, lab) {                                             /* a plain banana (food: no face) lying on the counter */
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.beginPath(); ctx.ellipse(2, 2, 44, 5, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-46, -14); ctx.quadraticCurveTo(-4, 8, 44, -18); ctx.quadraticCurveTo(46, -22, 40, -24); ctx.quadraticCurveTo(-2, -6, -42, -24); ctx.closePath();
  ctx.fillStyle = lg(0, -24, 0, 2, [[0, '#fff08a'], [1, '#e8b81a']]); ctx.fill(); ink(2.8);
  ctx.fillStyle = '#5a4a1a'; ctx.beginPath(); ctx.ellipse(44, -21, 4, 3, .4, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a8a2a'; rr(-52, -22, 9, 6, 2); ctx.fill();
  if (lab) { ctx.save(); ctx.translate(-2, -10); ctx.rotate(.05); ctx.fillStyle = '#ffffff'; rr(-15, -7, 30, 13, 2.5); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-15, -7, 30, 3); ctx.restore(); }
  ctx.restore();
}
function cupArt(x, y, s, lab) {                                                /* a paper coffee cup with a lid, bottom centre */
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.beginPath(); ctx.ellipse(3, 2, 22, 5, 0, 0, TAU); ctx.fill();
  poly([[-17, -52], [17, -52], [13, 0], [-13, 0]], '#f7f4ec', INKC, 2.6); ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-15.6, -36, 31, 14);
  poly([[-20, -52], [20, -52], [18, -60], [-18, -60]], '#ffffff', INKC, 2.4);
  if (lab) { ctx.fillStyle = '#ffffff'; rr(-14, -34, 28, 11, 2); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-14, -34, 28, 3); }
  ctx.restore();
}
function laminatorArt(x, y, s, o = {}) {                                       /* a desktop laminator, bottom centre; o.run 0..1 lights the READY lamp and rolls the rollers */
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.beginPath(); ctx.ellipse(3, 3, 86, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(0, -46, 0, 0, [[0, '#eef0f4'], [1, '#b9c0cc']]); rr(-80, -46, 160, 46, 12); ctx.fill(); ink(3);
  ctx.fillStyle = '#2a2f3a'; rr(-70, -40, 140, 7, 3); ctx.fill();                                                                   /* the feed slot */
  ctx.fillStyle = '#5c6474'; rr(-80, -22, 160, 8, 3); ctx.fill();
  const on = o.run || 0; ctx.fillStyle = on > .5 ? '#3cff7a' : '#2a6a3a'; ctx.beginPath(); ctx.arc(60, -10, 4.5, 0, TAU); ctx.fill(); if (on > .5) glow(x + 60 * s, y - 10 * s, 24 * s, '#3cff7a', .5, .6);
  ctx.restore();
}
function flatHatArt(x, y, s, rot, shine) {                                     /* the laminated party hat: pressed flat, sealed in a glossy clear sleeve */
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(230,240,255,.65)'; rr(-50, -112, 100, 124, 10); ctx.fill(); ctx.strokeStyle = 'rgba(80,100,140,.7)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.save(); ctx.translate(0, 4); ctx.scale(1.3, 1); partyHatArt(1, '#ffd23a', '#e8406a'); ctx.restore();
  ctx.save(); rr(-50, -112, 100, 124, 10); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(-50, -60); ctx.lineTo(-10, -112); ctx.lineTo(10, -112); ctx.lineTo(-50, -30); ctx.closePath(); ctx.fill();
  if (shine > 0 && shine < 1) { const sx = lerp(-90, 90, shine); ctx.fillStyle = lg(sx - 30, 0, sx + 30, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-50, -112, 100, 124); }
  ctx.restore(); ctx.restore();
}
function coffeeMakerP(x, y, s, lt, o = {}) {
  if (window.P20 && typeof P20.coffeeMaker === 'function') return P20.coffeeMaker(ctx, Object.assign({ x, y, s, power: 1, display: '3:05', pot: .6, t: lt, hero: false }, o));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#2a2f3a'; rr(-100, -270, 200, 270, 16); ctx.fill(); ink(3); ctx.fillStyle = 'rgba(200,220,240,.6)'; rr(-70, -110, 140, 100, 20); ctx.fill(); ctx.restore();
}
function stCounterTop(lt, st, o = {}) {
  const T = CTR.top;
  if (!st.coffeeGone && !o.noCoffee) coffeeMakerP(TOPX.coffee, T + 2, .5, lt);
  if (!o.noBanana) bananaArt(TOPX.banana - 6, T + 1, .95, st.bananaLab);
  if (!o.noCup) cupArt(TOPX.cup + 4, T + 1, 1.2, st.cupLab);
  juiceCarton(TOPX.carton, T + 1, .62, st.labels ? 2 : 0);
  laminatorArt(TOPX.lam, T + 2, .72, { run: o.lamRun || 0 });
  if (st.lam && !o.noFlatHat) flatHatArt(TOPX.lam + 4, T - 26, .5, -1.45, 0);
}
/* the hall to the right of the closet: the handrail, the sanitizer, a resident's door */
function stHall(lt, st) {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(1430, 980, 1200, 6);
  ctx.fillStyle = lg(0, 984, 0, 1004, [[0, '#d8b98a'], [1, '#a48056']]); rr(1430, 984, 1200, 18, 8); ctx.fill(); ink(2.4);
  for (const bx of [1500, 1760, 2020]) { ctx.fillStyle = '#9aa3b2'; rr(bx - 5, 1000, 10, 22, 3); ctx.fill(); }
  const dx0 = 1690, dx1 = 1860;
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(dx0 + 8, 760, dx1 - dx0, FL - 760);
  ctx.fillStyle = '#e9e2d2'; ctx.fillRect(dx0 - 10, 748, dx1 - dx0 + 20, FL - 748); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(dx0 - 10, 748, dx1 - dx0 + 20, FL - 748);
  ctx.fillStyle = lg(dx0, 0, dx1, 0, [[0, '#b98a5a'], [1, '#9a6e44']]); ctx.fillRect(dx0, 760, dx1 - dx0, FL - 760); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(dx0, 760, dx1 - dx0, FL - 760);
  ctx.fillStyle = '#e4e7ee'; rr(dx1 - 40, 1018, 30, 12, 6); ctx.fill(); ink(2);
  sanitizerP({ x: SAN.x, y: SAN.y, s: SAN.s, pump: 0, level: st.full ? 1 : .15, t: lt });
}
/* Brenda's chair beside her closet (empty from shot 8 on) */
function brendaChair(x, y) {
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 92, 12, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5c6474'; ctx.lineWidth = 7; ctx.lineCap = 'round'; for (const dx of [-62, 62]) { ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx * .9, y - 106); ctx.stroke(); }
  ctx.fillStyle = '#e07a3a'; rr(x - 82, y - 120, 164, 22, 8); ctx.fill(); ink(3);
  ctx.restore();
}
/* the station drawn whole (o.skip: names of pieces an insert redraws sharp) */
function roomS(lt, st, o = {}) {
  const sk = o.skip || {};
  stWall(lt, st); stFloor(lt, st); stSign(); stClock(lt); stPoster(lt, st); stShelf(lt, st);
  stCart(lt, st); stFridge(lt, st);
  if (!sk.closet) stCloset(lt, st, o.closet || {});
  stHall(lt, st);
  if (!st.brendaIn && !sk.chair) brendaChair(STAND.brenda[0], STAND.brenda[1]);
}

// ------------------------------------------------------------------ the staff at the station: options for drawChar at scene time lt
const hopAt = ag => ag < 0 || ag > .84 ? 0 : 30 * Math.abs(Math.sin(PI * ag / .42)) * Math.exp(-ag * 2.6);
const pulseAt = (lt, t0, hz = 14, tau = .18) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const T_HATIN = W_LAM + .02, T_HATOUT = W_LAMIT - .12;                       /* the hat goes into the laminator / the flat hat is out */
const lamIn = lt => ss(lt, T_HATIN, T_HATIN + .34), lamOut = lt => ss(lt, T_HATOUT, T_HATOUT + .3);
const ONION_STEP = lt => 0;                                                   /* Onion stays put: Tomato leans in to be labelled */
function onionX(lt) { return lt >= 2.2 && lt < 4.19 ? 940 : STAND.onion[0]; }
function castS(lt, shot) {
  const C = {}, id = shot ? shot.id : '';
  /* TOMATO: the label gun (open, t1), labelled on the forehead at "Initial" (3.43), the party hat until Onion takes it (5.90), the laminated hat after */
  { const fire = lt >= W_EVERY && lt < W_EVERY + .5, fk = fire ? pulseAt(lt, W_EVERY, 30, .12) : 0, inT1 = lt < 2.24, labK = ss(lt, W_INIT, W_INIT + .12);
    const lookUp = lt >= W_INIT && lt < 4.15 ? ss(lt, W_INIT + .05, W_INIT + .25) : 0, gasp = ss(lt, T_HATOUT + .1, T_HATOUT + .3);
    const hatOn = lt < 5.9, endLine = lt >= 30.0;
    const gripR = inT1 ? K([[0, [112, 10]], [.9, [112, 10]], [1.12, [118, -96]], [W_EVERY - .05, [126, -112]], [W_EVERY + .06, [120, -88]], [2.2, [122, -104]]], lt) : [104, 40];
    const touch = lt >= W_FUN - .2 && lt < 5.75 ? ss(lt, W_FUN - .2, W_FUN + .1) * (1 - ss(lt, 5.5, 5.75)) : 0;
    const gripL = touch > 0 ? [lerp(-104, -64, touch), lerp(40, -92, touch)] : [-104, 40];
    let expr = 'happy', look = [0, 0], yaw = 0, head = 0;
    if (id === 'open') { expr = 'happy'; look = [.4 * Math.sin(lt * 7), -.2]; head = .15 * Math.sin(lt * 6); }
    if (id === 't1') { expr = 'happy'; look = [.35, -.5]; head = .12; }
    if (id === 'o1') { expr = lt < W_INIT ? 'happy' : 'shock'; look = lt < W_INIT ? [.8, .1] : [.0, -.95 * lookUp]; yaw = .1; head = .16; }
    if (id === 't2') { expr = 'sad'; look = [.3, -.15]; head = .1 * Math.sin(lt * 2); }
    if (id === 'o1b') { expr = gasp > .5 ? 'shock' : 'sad'; look = [.8, .2]; yaw = .35; head = .35; }
    if (id === 'br1b') { expr = 'shock'; look = [.9, -.05]; yaw = .45 * ss(lt, 26.8, 27.1); head = .55 * ss(lt, 26.8, 27.1); }
    if (id === 'o2' || id === 'end') { expr = 'happy'; look = [0, 0]; }
    const lean = ss(lt, 2.98, 3.3) * (1 - ss(lt, 3.85, 4.12));
    const o = A15.tomato({ x: STAND.tom[0] + 20 * lean, y: FL - hopAt(lt - W_EVERY) * .6, s: SCL.tom, t: lt, tomPose: 'fruit', who: 'tom', expr, look, yaw, headYaw: head, plant: true, headset: false,
      arms: { l: touch > 0 ? 'hold' : 'rest', r: (lt < 2.24) ? 'hold' : endLine ? 'hold' : 'rest' }, hold: {}, grip: { l: gripL, r: gripR }, lgFire: fk > 0 ? c01(fk) : (inT1 ? .2 : 0), lgRot: -.6 });
    if (lt < 2.24) o.hold.r = 'fp21p_labelgun';
    if (endLine) { o.hold.r = 'fp21p_flathat'; o.grip.r = [96, -40]; o.expr = 'happy'; o.lid = .05; }
    o.acc = (o.acc || []).concat(['fp21p_flabel']).concat(hatOn ? ['fp21p_partyhat'] : []); o.flabel = labK; o.hat = { c1: '#ffd23a', c2: '#e8406a', rot: .2, dx: .12, dy: .92, s: .95 }; o.formsN = 0;
    if (lt >= W_INIT && lt < W_INIT + .3) o.squash = .05 * pulseAt(lt, W_INIT, 18, .1);
    C.tom = o; }
  /* ONION: the tablet clipboard; the label gun in the left hand for o1; the hat in the right hand for o1b; tears of joy whenever she speaks */
  { const sp = speaking('o1', lt) || speaking('o1b', lt) || speaking('o2', lt), x = onionX(lt);
    const tgt = [[W_DATE, [TOPX.banana + 6, CTR.top - 10]], [W_TIME, [TOPX.cup, CTR.top - 58]], [W_INIT, [STAND.tom[0] + 20 + 18, FL - (84 + 95.4) * SCL.tom - 97 * SCL.tom]]];
    let gl = null; if (id === 'o1' || (lt >= 2.0 && lt < 4.3)) {   /* the label gun's nose goes to each target on its word, with a quick wind-up */
      const up = lt >= W_TIME + .2, nose = gunNose(up ? 0 : .9, 1.05);   /* the gun points down-left at the banana and the cup, up-left at the forehead */
      const toLocal = ([wx, wy]) => [(wx - x) / SCL.onion - nose[0], (wy - (FL - (78 + 111.6) * SCL.onion)) / SCL.onion - nose[1]];
      const rest = [-92, 44], keys = [[0, rest], [W_DATE - .22, toLocal([tgt[0][1][0] + 30, tgt[0][1][1] - 50])], [W_DATE, toLocal(tgt[0][1])], [W_DATE + .14, toLocal([tgt[0][1][0] + 10, tgt[0][1][1] - 30])],
        [W_TIME - .2, toLocal([tgt[1][1][0] + 20, tgt[1][1][1] - 40])], [W_TIME, toLocal(tgt[1][1])], [W_TIME + .14, toLocal([tgt[1][1][0] + 10, tgt[1][1][1] - 20])],
        [W_TIME + .2, toLocal([tgt[2][1][0] + 60, tgt[2][1][1] + 40])], [W_INIT - .2, toLocal([tgt[2][1][0] + 40, tgt[2][1][1] - 10])], [W_INIT, toLocal(tgt[2][1])], [W_INIT + .2, toLocal([tgt[2][1][0] + 62, tgt[2][1][1] - 24])], [3.95, toLocal([tgt[2][1][0] + 112, tgt[2][1][1] + 110])]];
      gl = K(keys, lt); }
    const hatHand = lt >= 5.88 && lt < T_HATIN + .36, feed = lamIn(lt);
    const gripR = hatHand ? K([[5.88, [96, 10]], [T_HATIN - .05, [150, -10]], [T_HATIN + .34, [190, 66]]], lt) : [92, 44];
    let look = [0, 0], yaw = 0, head = 0, expr = 'onion_cry';
    if (id === 'open') { look = [.6 * Math.sin(lt * 5 + 1), -.1]; head = .2 * Math.sin(lt * 4); }
    if (id === 'o1') { const k = lt < W_INIT - .25 ? 0 : 1; look = k ? [-.9, -.45] : [-.85, .55]; yaw = -.3; head = -.35; }
    if (id === 'o1b') { look = [.9, .5]; yaw = .3; head = .25; }
    if (id === 'br1b') { look = [.95, -.05]; yaw = .35 * ss(lt, 26.76, 27.0); head = .6 * ss(lt, 26.76, 27.0); expr = 'shock'; }
    if (id === 'o2') { look = [0, -.1]; expr = 'onion_cry'; }
    const cheer = (id === 'o2' && lt >= W_READY - .1) || id === 'end';
    const o = A15.onion({ x, y: FL, s: SCL.onion, t: lt, pose: gl || hatHand || cheer ? 'free' : 'clip', who: 'onion', yaw, headYaw: head, look, expr, cry: sp ? .9 : .66, sob: sp ? .25 + .25 * Math.max(0, Math.sin(lt * 9)) : .1, plant: true,
      arms: { l: gl ? 'hold' : cheer ? 'cheer' : 'hold', r: hatHand ? 'hold' : cheer ? 'cheer' : 'rest' }, hold: {}, grip: { l: gl || [-74, 104], r: gripR } });
    if (gl) { const up = lt >= W_TIME + .2; o.hold.l = 'fp21p_labelgun'; o.lgRot = up ? 0 : .9; o.lgScale = 1.05; o.lgFire = [W_DATE, W_TIME, W_INIT].some(t0 => lt >= t0 && lt < t0 + .12) ? .9 : 0; o.lgTight = up; o.armScale = 1.12 + .3 * ss(lt, W_INIT - .3, W_INIT - .1) * (1 - ss(lt, W_INIT + .3, W_INIT + .6)); }
    else if (!cheer) o.hold.l = 'fp15_tabletclip';
    if (ONION_STEP(lt) > 0 && ONION_STEP(lt) < 1) { o.gait = Math.abs(x - STAND.onion[0]); o.dir = -1; o.stride = 30; }
    C.onion = o; }
  /* LEMON (the open: carrying a stack of binders across the front), MANGO (the open: mopping at a run), STRAWBERRY (frozen by the fridge with a med cup), BRENDA (on her chair, mid-sandwich) */
  if (id === 'end') C.lemon = A7.lemon({ x: 1150, y: FL, s: SCL.lemon, t: lt, who: 'lemon', expr: 'happy', lid: .1, look: [0, 0], plant: true, noBob: true, acc: ['readers', 'lanyard7'], arms: { l: 'rest', r: 'rest' } });
  else { const x = lerp(640, 500, ss(lt, 0, 1.0));
    C.lemon = A7.lemon({ x, y: 1348, s: SCL.lemon * 1.04, t: lt, who: 'lemon', expr: 'panic', lid: .1, look: [-.6, .1], yaw: -.45, headYaw: -.3, gait: (640 - x) * 1.6, dir: -1, stride: 34, vx: -220,
      arms: { l: 'hold', r: 'hold' }, hold: { l: 'fp21p_binders' }, grip: { l: [-40, 30], r: [30, 34] }, plant: true }); }
  { const x = lerp(1400, 1230, ss(lt, 0, 1.0)), sw = Math.sin(lt * 14);
    C.mango = A7.mango({ x, y: 1392, s: SCL.mango, t: lt, who: 'mango', expr: 'panic', look: [-.5, .3], yaw: -.3, headYaw: -.25, gait: (1400 - x) * 1.3, dir: -1, stride: 34, vx: -260,
      arms: { l: 'hold', r: 'hold' }, hold: { l: 'fp21p_mop' }, grip: { l: [-100 + 24 * sw, 60], r: [-10 + 24 * sw, 40] }, mopSwing: sw, plant: true }); }
  { C.straw = A11.straw({ x: STAND.straw[0], y: STAND.straw[1], s: SCL.straw, t: lt, who: 'straw', expr: 'dead', lid: .5, look: [.5, 0], yaw: .25, headYaw: .2, plant: true,
      arms: { l: 'hold', r: 'rest' }, hold: { l: 'fp18_medcup' }, grip: { l: [-104, 36] }, cupScale: 1.2 }); }
  { const bite = (lt % 2.2) < .3;
    const o = window.A13 && A13.brenda ? A13.brenda({ t: lt, id: 'brenda', who: 'brenda', expr: A13.expr('weak'), lid: .4, dust: .3, specsDrop: .55, look: [-.3, .1], yaw: -.25, headYaw: -.2,
      arms: { l: 'rest', r: 'hold' }, hold: { r: 'fp21p_sandwich' }, grip: { r: bite ? [40, -20] : [70, 40] }, sandScale: .95, sandTilt: -.2, noLegs: true }) : null;
    if (o) { Object.assign(o, { x: STAND.brenda[0], y: STAND.brenda[1] - 112, s: SCL.brenda }); C.brenda = o; } }
  return C;
}
/* props for the open: Lemon's armful of binders, Mango's mop; the hat in Onion's hand (an accessory drawn at her right hand) */
EXT.prop.fp21p_binders = (side, o, t) => {
  ctx.save(); ctx.scale(1.0, 1.0);
  const cols = ['#2f5fa8', '#a8323a', '#2e8a57', '#6a3fb0', '#d98a1a'];
  cols.forEach((c, i) => { ctx.save(); ctx.translate(30 + (i % 2) * 6 - 3, -10 - i * 24); ctx.rotate((i % 2 ? .04 : -.05)); ctx.fillStyle = c; rr(-56, -12, 112, 24, 5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke(); ctx.fillStyle = '#f7f6f0'; rr(-20, -6, 40, 12, 2); ctx.fill(); ctx.restore(); });
  ctx.restore();
};
PROP_BOX.fp21p_binders = Object.assign([-40, -130, 100, 10], { nearFace: true });
EXT.prop.fp21p_mop = (side, o, t) => {
  ctx.save(); ctx.rotate(.5 + .12 * (o.mopSwing || 0));
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 190); ctx.stroke();
  ctx.fillStyle = '#e6e2d6'; for (let i = -5; i <= 5; i++) { ctx.save(); ctx.translate(i * 6, 196); ctx.rotate(i * .08); rr(-4, 0, 8, 46, 4); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#5c6474'; rr(-34, 186, 68, 14, 5); ctx.fill();
  ctx.restore();
};
PROP_BOX.fp21p_mop = Object.assign([-150, -80, 150, 260], { nearFace: false });

// ------------------------------------------------------------------ frame tests (as ep18_station.js): is a character wholly / partly inside the frame?
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + (o.noLegs ? k.ry * .9 : 24) * s];
}
function inFrame(o, pad = 0) {
  const b = boxOf(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
const handAt = (o, side) => { const k = KINDS[o.kind], s = o.s, g = o.grip[side]; return [o.x + g[0] * s, o.y - s * ((o.noLegs ? 0 : (k.leg || 90)) + k.ry * .9) + g[1] * s]; };

// ------------------------------------------------------------------ the shots (scene-local seconds; every start is snapped to a frame; the boundary frame is the NEW shot)
const SH = [
  { id: 'open', s: 0, set: 'st', k: 'wide', x: 920, y: 1050, z: [.74, .77], show: ['straw', 'lemon', 'tom', 'onion', 'mango', 'brenda'] },
  { id: 't1', s: 1.03, set: 'st', k: 'face', foc: 'tom', z: [2.0, 2.14], up: 150, dx: -40, show: ['tom'] },
  { id: 'o1', s: 2.24, set: 'st', k: 'wide', x: 858, y: 1060, z: [1.42, 1.5], show: ['tom', 'onion'] },
  { id: 't2', s: 4.19, set: 'st', k: 'face', foc: 'tom', z: [2.2, 2.34], up: 130, dx: 20, show: ['tom'] },
  { id: 'o1b', s: 5.90, set: 'st', k: 'wide', x: 985, y: 1066, z: [1.2, 1.25], show: ['tom', 'onion'] },
  ...MCUE.map((c, k) => ({ id: 'm' + (k + 1), cue: c, s: 7.211 + k, set: 'ins', ins: k })),
  { id: 'me1', s: 19.211, set: 'hall', k: 'melon' },
  { id: 'agency', s: 20.36, set: 'hall', k: 'agency' },
  { id: 'ch1', s: 21.58, set: 'hall', k: 'front' },
  { id: 's1', s: 22.68, set: 'hall', k: 'straw' },
  { id: 'l1', s: 23.48, set: 'hall', k: 'lemon' },
  { id: 'br1a', s: 25.26, set: 'st', k: 'pt', x: 1330, y: 1078, z: [2.08, 2.2], obj: 'closet', show: [] },
  { id: 'br1b', s: 26.72, set: 'st', k: 'wide', x: 862, y: 1070, z: [1.6, 1.7], show: ['tom', 'onion'] },
  { id: 'br1c', s: 27.62, set: 'st', k: 'pt', x: 1348, y: 1196, z: [3.5, 3.7], obj: 'crumb', show: [] },
  { id: 'o2', s: 28.72, set: 'st', k: 'face', foc: 'onion', z: [2.0, 2.16], up: 140, dx: 0, show: ['onion'] },
  { id: 'end', s: 30.19, set: 'st', k: 'wide', x: 960, y: 1070, z: [.78, .81], show: ['tom', 'onion', 'lemon'], lineup: true },
];
for (const sh of SH) sh.s = sh.s === 0 ? 0 : TP.snapT(sh.s);
SH.forEach((sh, i) => { sh.e = i + 1 < SH.length ? SH[i + 1].s : TP.SCN.dur; });
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const CUTS = SH.map(sh => sh.s).filter(t => t > 0);
const nearCut = (lt, d = .045) => CUTS.some(t => lt > t - d && lt < t + d);

// ------------------------------------------------------------------ the camera and the draw
let FR = null;
function camS(lt, sh) {
  const C = castS(lt, sh), st = ST(lt), u = c01((lt - sh.s) / Math.max(.1, sh.e - sh.s)), z = lerp(sh.z[0], sh.z[1], easeIO(u));
  let cx = sh.x, cy = sh.y;
  if (sh.k === 'face') { const o = Object.assign({}, C[sh.foc]); o.y = FL; const [fx, fy] = faceC(o); cx = (sh.foc === 'onion' ? onionX(lt) : fx) - (sh.dx || 0) / z; cy = fy + sh.up / z; }
  zoomTo(cx, cy, z);
  CAM.x += 2.0 * hnoise(lt, 1.3, 1); CAM.y += 1.5 * hnoise(lt, 1.1, 2); CAM.r += .001 * hnoise(lt, .9, 3);
  if (sh.id === 'open') CAM.shake = 1.2;
  FR = { C, sh, st };
}
function drawS(lt) {
  const { C, sh, st } = FR;
  V2.setLight({ key: [-.4, -.65], keyColor: '#fff6e6', keyA: .2, rim: '#d8e6ff', rimA: .3, shadow: '#2a2038', shadowA: .28, bounce: '#ffeccc', bounceA: .1, amb: '#ffffff', ambA: .06, frontDark: .02 }); V2.opts.reflect = false;
  HEROMODE = !!sh.obj;
  const closetO = { hero: sh.obj === 'closet' || sh.obj === 'crumb' ? undefined : false, rattle: sh.obj === 'closet' || sh.obj === 'crumb' ? (voice('br1', lt) * .9) * Math.sin(lt * 47) : 0 };
  if (sh.obj === 'crumb') { const tf = TP.snapT(TP.wS('br1', 6)) + .12; closetO.fingers = ss(lt, tf, tf + .16) * (1 - ss(lt, tf + .5, tf + .66)); closetO.crumbX = lerp(1352, 1366, ss(lt, tf + .22, tf + .5)); closetO.crumbIn = ss(lt, tf + .4, tf + .52); }
  roomS(lt, st, { closet: closetO });
  HEROMODE = false;
  const order = sh.show.map(n => [n, C[n]]).filter(([n, o]) => o).sort((a, b) => a[1].y - b[1].y);
  const behind = order.filter(([n]) => n === 'tom' || n === 'onion'), front = order.filter(([n]) => n !== 'tom' && n !== 'onion');
  for (const [n, o] of behind) { const f = inFrame(o, 6); if (f.whole || (sh.k === 'face' && n === sh.foc)) drawChar(o); }
  stCounterFront(lt, st);
  stCounterTop(lt, st, { lamRun: sh.id === 'o1b' ? ss(lt, T_HATIN, T_HATIN + .1) * (1 - ss(lt, 6.9, 7.1)) : 0, noFlatHat: sh.id === 'o1b' && lt < T_HATOUT + .32 });
  if (sh.id === 'o1b') drawLaminate(lt, C);
  if (sh.id === 't1' || sh.id === 'open') labelBurst(lt, C.tom);
  for (const [n, o] of front) { const f = inFrame(o, 6); if (f.whole) drawChar(o); }
  if (sh.lineup) drawLineup(lt, st);
  if (st.gleam > 0 && (sh.id === 'o2' || sh.id === 'end')) gleams(lt, sh);
  if (sh.id === 'o2') { const a = lt - CUE.sparkle2, o = C.onion, [fx, fy] = faceC(Object.assign({}, o, { y: FL })); twinkle(fx + 30 * o.s, fy - 14 * o.s, 46, a, .5); twinkle(fx - 30 * o.s, fy - 14 * o.s, 30, a - .06, .45);
    [[SHELF.x0 + 60, SHELF.y - 120], [SHELF.x0 + 200, SHELF.y - 60], [CTR.x0 + 260, CTR.top - 2], [CTR.x1 - 80, CTR.top - 4], [1110, CTR.top - 60]].forEach(([x, y], i) => twinkle(x, y, 34, a - .05 - i * .05, .5)); }
  if (sh.id === 'end') { const a = lt - CUE.sting; [[CTR.x0 + 80, CTR.top], [CTR.x1 - 60, CTR.top], [SIGNP.x, SIGNP.y - 30], [SHELF.x1 - 40, SHELF.y - 150], [CART.x, CART.y - 400], [CLOSET.x1 - 30, CLOSET.y0 + 30], [POSTER.x + 30, POSTER.y + 20]].forEach(([x, y], i) => twinkle(x, y, 44, a - i * .04, .55)); }
  if (sh.id === 'open') panicPapers(lt);
}
/* the hat in Onion's right hand goes into the laminator's slot; the flat, shiny hat slides out of the right side and lies on the counter */
function drawLaminate(lt, C) {
  const o = C.onion, feed = lamIn(lt), out = lamOut(lt), slotY = CTR.top + 2 - 40 * .72;
  if (lt < T_HATIN + .36 && feed < .98) {
    const [hx, hy] = handAt(o, 'r');
    ctx.save(); ctx.beginPath(); ctx.rect(hx - 200, slotY - 400, 400, 400); ctx.clip();
    ctx.translate(hx + 6, hy + 30 + feed * 90); ctx.rotate(.15); partyHatArt(.62, '#ffd23a', '#e8406a'); ctx.restore();
  }
  if (out > 0) { const x = TOPX.lam + 54 + 70 * out; ctx.save(); ctx.beginPath(); ctx.rect(TOPX.lam + 46, CTR.top - 140, 300, 160); ctx.clip(); flatHatArt(x, CTR.top - 6, .5, -PI / 2, ss(lt, T_HATOUT + .3, T_HATOUT + .62)); ctx.restore();
    if (lt > T_HATOUT + .3 && lt < T_HATOUT + .9) twinkle(x - 10, CTR.top - 40, 26, lt - T_HATOUT - .3, .6); }
}
/* "Label everything!": a burst of labels out of Tomato's gun on "everything" (they flutter down) */
function labelBurst(lt, o) {
  const ag = lt - W_EVERY; if (ag < 0 || ag > 1.4 || !o.hold || o.hold.r !== 'fp21p_labelgun') return;
  const [hx, hy] = handAt(o, 'r');
  for (let i = 0; i < 7; i++) {
    const a = -1.1 - .9 * rn(41, i), v = 520 + 260 * rn(42, i), x = hx + 40 + Math.cos(a) * v * ag + 30 * Math.sin(ag * 6 + i), y = hy - 60 + Math.sin(a) * v * ag + 520 * ag * ag, r = ag * (6 + 6 * rn(43, i)) + i;
    if (ag < i * .03) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(1, .3 + .7 * Math.abs(Math.cos(ag * 7 + i))); ctx.globalAlpha = c01((1.4 - ag) / .4);
    ctx.fillStyle = '#ffffff'; rr(-16, -7, 32, 14, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-16, -7, 32, 3.5); ctx.restore();
  }
}
/* the open: the station in a panic: sheets of paper and stray labels fly across (pure functions of time) */
function panicPapers(lt) {
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const a = lt + .9 * rn(211, i) - .2; if (a < 0) continue;
    const x = 560 + 900 * rn(212, i) - (i % 2 ? 1 : -1) * 520 * a, y = 980 - 260 * rn(213, i) + 90 * Math.sin(a * 4 + i) + 160 * a * a, rot = a * (4 + 4 * rn(214, i)) + i, lab = i % 3 === 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .35 + .65 * Math.abs(Math.cos(a * 5 + i)));
    if (lab) { ctx.fillStyle = '#ffffff'; rr(-18, -8, 36, 16, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.6)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#d4202c'; ctx.fillRect(-18, -8, 36, 4); }
    else { ctx.fillStyle = '#fbfaf2'; ctx.strokeStyle = 'rgba(40,40,60,.55)'; ctx.lineWidth = 2; ctx.fillRect(-26, -34, 52, 68); ctx.strokeRect(-26, -34, 52, 68); ctx.fillStyle = 'rgba(60,70,100,.4)'; for (let j = 0; j < 5; j++) ctx.fillRect(-19, -24 + j * 11, 38 - (j % 2) * 9, 3); }
    ctx.restore();
  }
  ctx.restore();
}
function gleams(lt, sh) {                                                      /* the station gleams: twinkles on its edges (the shelf, the counter, the sign, the cart) */
  const pts = [[SHELF.x0 + 30, SHELF.y - 140], [CTR.x0 + 40, CTR.top], [CTR.x1 - 30, CTR.top - 2], [SIGNP.x + 190, SIGNP.y - 24], [CART.x + 100, CART.y - 360], [CLOCKP.x + 40, CLOCKP.y - 40], [FRIDGE.x1 - 20, FRIDGE.y0 + 20], [POSTER.x + POSTER.w - 10, POSTER.y + 10]];
  pts.forEach(([x, y], i) => { const per = 1.3 + .3 * rn(51, i), ph = rn(52, i) * per, ag = ((lt + ph) % per); twinkle(x, y, 22 + 10 * rn(53, i), ag, .55); });
}
/* the end: the terrifyingly clean station; Lemon and Strawberry at attention on the left, Mango by the hall on the right (Tomato and Onion behind the counter); rigid smiles, nobody moves */
EXT.prop.fp21p_flathat = (side, o, t) => { flatHatArt(0, 0, .62, -.08, ss(t, CUE.sting + .05, CUE.sting + .4)); };
PROP_BOX.fp21p_flathat = Object.assign([-36, -76, 36, 10], { nearFace: false });
function drawLineup(lt, st) {
  const still = { noBob: true };
  const S = A11.straw(Object.assign({ x: 470, y: 1338, s: .84, t: lt, who: 'straw', expr: 'dead', lid: .5, look: [0, 0], plant: true, arms: { l: 'rest', r: 'rest' } }, still));
  const M = A7.mango(Object.assign({ x: 1500, y: 1342, s: .9, t: lt, who: 'mango', expr: 'happy', lid: .05, look: [0, 0], plant: true, arms: { l: 'rest', r: 'rest' } }, still));
  for (const o of [S, M]) if (inFrame(o, 6).whole) drawChar(o);
}

const PREP = {
  shot: lt => shotAt(lt).id,
  cam(lt) { const sh = shotAt(lt); if (sh.set === 'ins') camIns(lt, sh); else if (sh.set === 'hall') camHall(lt, sh); else camS(lt, sh); },
  draw(lt) { const sh = FR.sh; if (sh.set === 'ins') drawIns(lt); else if (sh.set === 'hall') drawHallShot(lt); else drawS(lt); },
  fx: lt => ({ bloom: .38, vignette: .26, grain: .04, contrast: .1, sat: .12, tint: [['#fff1d8', .05, 'soft-light']] }),
  blur: lt => 1,
  over(lt) { const sh = shotAt(lt); if (sh.set === 'ins' && sh.ins === 11) wipeOver(lt, lt - MT[11]); if (sh.id === 'o2') wipeOver(lt, lt - CUE.sparkle2); if (sh.id === 'end') wipeOver(lt, lt - CUE.sting); },
  clock: () => TP.SCN.clock, label: () => TP.SCN.label,
};
window.__EP21_SCENES = window.__EP21_SCENES || {}; window.__EP21_SCENES.prep = PREP;

// ====================================================================================================================================================================================
// THE MONTAGE: twelve inserts, 1.0 s each, drawn in screen units (zoomTo 540, 960, 1). a = seconds since the cut (the main hit), b = seconds since the off-beat (the second hit).
// One bright palette for all twelve (cream, teal, white, the props' saturated colours); no shot is dark and nothing flashes the frame.
// ====================================================================================================================================================================================
function insWall(yRail = 1020, o = {}) {                                       /* the station wall: cream above, the chair rail, the teal wainscot below */
  ctx.fillStyle = lg(0, -100, 0, yRail, [[0, '#f8f2e6'], [1, o.wallB || '#eadfc9']]); ctx.fillRect(-300, -300, W + 600, yRail + 300);
  ctx.fillStyle = '#faf6ec'; ctx.fillRect(-300, yRail, W + 600, 30); ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.fillRect(-300, yRail + 30, W + 600, 8);
  ctx.fillStyle = lg(0, yRail + 38, 0, H + 200, [[0, '#5f9a96'], [1, '#467a76']]); ctx.fillRect(-300, yRail + 38, W + 600, H);
}
function insCounterTop(y0, o = {}) {                                           /* the counter top seen from above the front edge: warm laminate with a faint fleck */
  ctx.fillStyle = lg(0, y0, 0, H + 200, [[0, '#f3e4c8'], [1, '#dcc49c']]); ctx.fillRect(-300, y0, W + 600, H + 400);
  ctx.fillStyle = 'rgba(120,90,50,.08)'; for (let i = 0; i < 90; i++) { ctx.beginPath(); ctx.arc(rn(61, i) * W, y0 + rn(62, i) * (H - y0), 2 + 3 * rn(63, i), 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(30,20,30,.18)'; ctx.fillRect(-300, y0, W + 600, 10);
}
function speedLines(x, y, a, ang, n = 7, len = 260, spread = 220, col = 'rgba(255,255,255,.85)', life = .16) {   /* motion lines behind a fast object (the first frames of a hit) */
  if (a < 0 || a > life) return; const k = a / life;
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = 7 * (1 - k);
  for (let i = 0; i < n; i++) { const off = (i / (n - 1) - .5) * spread, px = x - Math.sin(ang) * off, py = y + Math.cos(ang) * off, l = len * (.6 + .4 * rn(71, i)) * (1 - k * .5);
    ctx.beginPath(); ctx.moveTo(px - Math.cos(ang) * 30, py - Math.sin(ang) * 30); ctx.lineTo(px - Math.cos(ang) * (30 + l), py - Math.sin(ang) * (30 + l)); ctx.stroke(); }
  ctx.restore();
}
const hitK = (a, d = .12) => a < 0 ? 0 : Math.exp(-a / d);                    /* 1 on the hit, decays */
const wob = (a, hz = 22, tau = .16) => a < 0 ? 0 : Math.sin(a * hz) * Math.exp(-a / tau);

/* 1 LABELGUN: the juice carton on the counter; the label gun slaps OPENED 11/6 on the cut and DISCARD 11/9 on the off-beat */
function ins1(lt, a, b) {
  insWall(980); insCounterTop(1250);
  ctx.save(); V2.dof(10, () => { coffeeMakerP(150, 1262, 1.1, lt); cupArt(930, 1262, 2.4, true); }); ctx.restore();
  const sq = 1 - .035 * hitK(a, .06) - .02 * hitK(b, .06), S = 6.6;
  ctx.save(); ctx.translate(540, 1262); ctx.scale(1 + (1 - sq) * .6, sq); ctx.translate(-540, -1262); juiceCarton(540, 1262, S, 0); ctx.restore();
  const l1 = 1 + .08 * hitK(a, .05), l2 = b >= 0 ? 1 + .1 * hitK(b, .05) : 0;
  const y1 = 1262 - 55 * S * sq, y2 = 1262 - 20 * S * sq;
  surveyLabel({ x: 540, y: y1, s: 1.32 * l1, rot: -.03, text: 'OPENED 11/6 3:05P', t: lt, hero: true });                 /* the slap is a uniform pop of ours (the kit's t0 pop squashes the lettering for a frame) */
  if (b >= 0) surveyLabel({ x: 548, y: y2, s: 1.12 * l2, rot: .05, text: 'DISCARD 11/9', t: lt, hero: true });
  burst(540, y1, a, 380, 12, 'rgba(255,255,255,.9)', 8, .2);
  if (b >= 0) burst(548, y2, b, 340, 10, 'rgba(255,255,255,.85)', 6, .18);
  /* the gun: its nose on the label's right edge at the cut, recoils up and right, comes back for the off-beat, leaves */
  const gx = K([[0, 728], [.05, 730], [.2, 920], [.4, 770], [.5, 712], [.56, 712], [.72, 990], [1, 1400]], a), gy = K([[0, y1 - 30], [.05, y1 - 30], [.2, y1 - 180], [.4, y2 - 60], [.5, y2 - 14], [.56, y2 - 14], [.72, y2 - 140], [1, y2 - 300]], a);
  const ga = K([[0, 0], [.2, -.3], [.45, 0], [.5, 0], [.7, -.35], [1, -.5]], a), GS = 3.1;
  const gpx = (lx, ly) => [gx - Math.cos(ga) * (lx - 62) * GS - Math.sin(ga) * (ly + 16) * GS, gy - Math.sin(ga) * (lx - 62) * GS + Math.cos(ga) * (ly + 16) * GS];
  const [wx, wy] = gpx(4, 40);
  glove(wx, wy, -PI / 2 - .25 + ga, 3.5, 'grip', false, 1100);
  ctx.save(); ctx.translate(gx, gy); ctx.rotate(ga); ctx.scale(-GS, GS); ctx.translate(-62, 16); labelGunArt(0); ctx.restore();
  speedLines(gx + 120, gy, a - .01, PI, 6, 220, 160, 'rgba(255,255,255,.8)', .12);
  if (a > .2 && a < .7) twinkle(400, y1 - 70, 44, a - .2, .5);
}
/* 2 PADLOCK: the snack drawer; the padlock snaps shut through the hasp on the cut; a second padlock clicks on beside it on the off-beat */
function ins2(lt, a, b) {
  ctx.fillStyle = lg(0, 0, 0, 640, [[0, '#f6ecd8'], [1, '#e2cfa8']]); ctx.fillRect(-300, -300, W + 600, 940);   /* the counter's front panel above the drawer */
  ctx.fillStyle = lg(0, 560, 0, 640, [[0, '#f7ecd8'], [1, '#d9c3a0']]); ctx.fillRect(-300, 560, W + 600, 80); ctx.fillStyle = 'rgba(30,20,30,.25)'; ctx.fillRect(-300, 636, W + 600, 10);
  ctx.fillStyle = '#2a2230'; ctx.fillRect(-300, 646, W + 600, 30);                                                 /* the gap above the drawer, wrappers peeking out */
  [['#e8406a', 160], ['#3d8ff0', 300], ['#ffd23a', 420], ['#7ad94a', 700], ['#ff8a2a', 860]].forEach(([c, x], i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 40, 676); ctx.lineTo(x - 30, 640 - 18 * rn(81, i)); ctx.lineTo(x, 652); ctx.lineTo(x + 26, 636 - 20 * rn(82, i)); ctx.lineTo(x + 40, 676); ctx.closePath(); ctx.fill(); ink(3); });
  ctx.fillStyle = lg(0, 676, 0, 1500, [[0, '#f3e3c6'], [1, '#dcc49c']]); ctx.fillRect(-300, 676, W + 600, 1300); ctx.strokeStyle = 'rgba(120,90,50,.18)'; ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-100, 760 + i * 70); ctx.bezierCurveTo(300, 740 + i * 70 + 20 * Math.sin(i), 700, 780 + i * 70, 1200, 750 + i * 70); ctx.stroke(); }
  ctx.fillStyle = '#9aa3b2'; rr(390, 1250, 300, 34, 17); ctx.fill(); ink(4);                                       /* the drawer pull */
  ctx.save(); ctx.translate(250, 840); ctx.rotate(-.05); ctx.fillStyle = 'rgba(30,20,30,.15)'; ctx.fillRect(-150, -46, 310, 104); ctx.fillStyle = '#f5e7a8'; ctx.fillRect(-156, -54, 312, 104);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-156, -54, 312, 16); TXT('SNACKS', 0, -2, { size: 62, font: 'Lucky', weight: 400, fill: '#3a2a1a', spacing: 3, maxW: 280 }); ctx.restore();
  for (const [hx, hy] of [[540, 880], [800, 900]]) { ctx.fillStyle = '#c3c8d2'; rr(hx - 70, hy - 60, 140, 120, 14); ctx.fill(); ink(4); ctx.fillStyle = '#e8ebf0'; rr(hx - 22, hy - 30, 44, 60, 12); ctx.fill(); ink(3.4); ctx.fillStyle = '#2a2f3a'; rr(hx - 9, hy - 14, 18, 28, 6); ctx.fill(); }
  const sw1 = .26 * wob(a, 13, .3) - .2 * hitK(a, .04), sh1 = c01(a / .02);
  padlockP({ x: 540, y: 1068, s: 1.75, shut: a < 0 ? 0 : .8 + .2 * sh1, swing: sw1, t: lt, t0: MT[1] });
  burst(540, 920, a, 170, 9, 'rgba(255,255,255,.9)', 7, .2);
  if (b >= 0) { const pop = eb(c01(b / .1)); if (pop > .02) padlockP({ x: 800, y: 1082, s: 1.35 * pop, shut: c01(b / .03), swing: .3 * wob(b, 14, .3), t: lt, t0: MOFF[1] }); burst(800, 935, b, 130, 8, 'rgba(255,255,255,.85)', 5, .18); }
  if (a > .25 && a < .8) twinkle(480, 1010, 36, a - .25, .5);
}
/* 3 SPRAY: top-down on the counter: the mist bursts on the cut; a cloth wipes a gleaming lane on the off-beat */
function ins3(lt, a, b) {
  ctx.fillStyle = lg(0, 0, W, H, [[0, '#f5e8cf'], [1, '#e0c9a2']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.fillStyle = 'rgba(120,90,50,.07)'; for (let i = 0; i < 160; i++) { ctx.beginPath(); ctx.arc(rn(91, i) * W, rn(92, i) * 1500, 2 + 3 * rn(93, i), 0, TAU); ctx.fill(); }
  const wipeX = b < 0 ? -400 : lerp(-260, 1420, ss(b, 0, .34)), lane = [700, 1110];
  ctx.save(); ctx.beginPath(); ctx.rect(-300, -300, W + 600, H + 600); ctx.rect(-300, lane[0], wipeX + 300, lane[1] - lane[0]); ctx.clip('evenodd');   /* the mess, minus the wiped lane */
  for (const [x, y, r] of [[300, 820, 90], [720, 940, 70], [520, 1040, 56], [860, 760, 60], [200, 560, 80], [820, 1260, 70]]) { ctx.strokeStyle = 'rgba(120,70,30,.35)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = 'rgba(160,110,60,.55)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.ellipse(120 + rn(94, i) * 840, 650 + rn(95, i) * 560, 5 + 6 * rn(96, i), 3 + 4 * rn(97, i), rn(98, i) * 3, 0, TAU); ctx.fill(); }
  /* the wet spray dots land where the mist reached */
  if (a >= .04) { ctx.fillStyle = 'rgba(160,210,255,.6)'; for (let i = 0; i < 70; i++) { const tt = .04 + .1 * rn(99, i); if (a < tt) continue; ctx.beginPath(); ctx.arc(160 + rn(100, i) * 700, 640 + rn(101, i) * 560, 4 + 8 * rn(102, i), 0, TAU); ctx.fill(); } }
  ctx.restore();
  if (b >= 0) {                                                                                                     /* the wiped lane gleams */
    ctx.save(); ctx.beginPath(); ctx.rect(-300, lane[0], wipeX + 300, lane[1] - lane[0]); ctx.clip();
    ctx.fillStyle = lg(0, lane[0], 0, lane[1], [[0, 'rgba(255,255,255,.25)'], [.4, 'rgba(255,255,255,.8)'], [.6, 'rgba(255,255,255,.8)'], [1, 'rgba(255,255,255,.25)']]); ctx.fillRect(-300, lane[0], W + 600, lane[1] - lane[0]);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(120 + i * 210, lane[0] + 70 + 50 * rn(107, i), 70, 9, -.05, 0, TAU); ctx.fill(); } ctx.restore();
    if (b > .12) for (let i = 0; i < 4; i++) twinkle(180 + i * 230, 820 + 160 * rn(103, i), 46, b - .12 - i * .05, .45);
  }
  /* the bottle: held top right, the nozzle to the lower left; the trigger squeezed on the cut */
  const sq = a < .12 ? 1 : 0, away = ss(a, .3, .55), bx = 790 + 10 * hitK(a, .05) + 520 * away, by = 380 - 12 * hitK(a, .05) - 420 * away;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(.55); ctx.scale(1.5, 1.5); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(-70, 0, 70, 0, [[0, '#a8dcff'], [.5, '#5fb8f2'], [1, '#2f86c8']]); rr(-70, 40, 140, 300, 40); ctx.fill(); ink(5);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-52, 70, 26, 240, 13); ctx.fill();
  ctx.fillStyle = '#f4f6fa'; rr(-44, -20, 88, 70, 14); ctx.fill(); ink(4.4); poly([[-44, -20], [-130, -10], [-136, 22], [-44, 30]], '#f4f6fa', INKC, 4.4);
  ctx.fillStyle = '#ffcf2e'; ctx.save(); ctx.translate(-40, 40); ctx.rotate(sq ? .25 : 0); rr(-18, 0, 30, 90, 12); ctx.fill(); ink(4); ctx.restore();
  ctx.restore();
  glove(bx + 210, by + 200, PI + .9, 4.4, 'grip', false, 900);
  const nx = bx - (Math.cos(.55) * 130 + Math.sin(.55) * 6) * 1.5, ny = by - (Math.sin(.55) * 130 - 4) * 1.5;
  if (a >= 0 && a < .45) {                                                                                         /* the mist: a soft cone and flying droplets */
    const k = a / .45; ctx.save(); ctx.globalAlpha = (1 - k) * .75; ctx.fillStyle = rg(nx - 260 * eo(c01(a / .15)), ny + 300 * eo(c01(a / .15)), 10, 300, [[0, 'rgba(235,248,255,.9)'], [1, 'rgba(235,248,255,0)']]);
    ctx.beginPath(); ctx.arc(nx - 260 * eo(c01(a / .15)), ny + 300 * eo(c01(a / .15)), 300, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(210,236,255,.95)'; for (let i = 0; i < 26; i++) { const an = 2.25 + (rn(104, i) - .5) * .7, v = 900 + 600 * rn(105, i), d = v * a * (1 - a * .8); if (d > 900) continue; ctx.beginPath(); ctx.arc(nx + Math.cos(an) * d, ny + Math.sin(an) * d, 4 + 4 * rn(106, i), 0, TAU); ctx.fill(); }
  }
  if (b >= 0 && b < .5) {                                                                                          /* the cloth: a blue microfiber pad under a flat glove */
    const cx = wipeX - 60, cy = (lane[0] + lane[1]) / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.08); ctx.fillStyle = lg(0, -170, 0, 170, [[0, '#4c8fe8'], [1, '#2a62c0']]); rr(-150, -175, 300, 350, 40); ctx.fill(); ink(5);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 4; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-130, i * 44); ctx.lineTo(130, i * 44 + 10); ctx.stroke(); } ctx.restore();
    glove(cx - 10, cy - 30, -.45, 4.2, 'flat', false, 500);
  }
}
/* 4 THERMOBEEP: the fridge thermometer's needle snaps from the red into the green on the cut (a green LED); the log is signed on the off-beat */
function ins4(lt, a, b) {
  ctx.fillStyle = lg(0, 0, W, 0, [[0, '#ffffff'], [1, '#dfe4ec']]); ctx.fillRect(-300, -300, W + 600, H + 600);     /* the fridge door */
  ctx.fillStyle = lg(0, 140, 0, 1240, [[0, '#d8ecf8'], [1, '#b8d4e8']]); rr(90, 160, 900, 1100, 30); ctx.fill(); ctx.strokeStyle = 'rgba(40,60,90,.55)'; ctx.lineWidth = 5; ctx.stroke();
  ctx.save(); rr(90, 160, 900, 1100, 30); ctx.clip(); SOFT++; V2.dof(8, () => { for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#f2a33a', '#e8e6de', '#5fa8e8', '#f2f2f2', '#e8406a', '#7ad94a'][i]; rr(140 + i * 140, 980, 90, 150, 16); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(90, 1130, 900, 14); }); SOFT--; ctx.restore();
  const safe = SAFE_DEG(), hot = HOT_DEG(), deg = a < 0 ? hot : safe + 2.4 * wob(a, 26, .16) + (hot - safe) * hitK(a, .025);
  ctx.save(); ctx.translate(540, 590); thermoP({ x: 0, y: 0, s: 2.05, deg, t: lt, hero: false }); ctx.restore();
  if (a >= 0 && a < .12 && !has21('fridgeThermo')) { const R = 150 * 2.05 - 30 * 2.05; ctx.save(); ctx.translate(540, 590); ctx.strokeStyle = 'rgba(212,32,44,.35)'; ctx.lineWidth = 30; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, R * .7, DEG_A(40), DEG_A(52)); ctx.stroke(); ctx.restore(); }
  const led = a >= 0 && a < .5 ? 1 : .25;                                                                           /* the green LED beside the dial */
  ctx.fillStyle = '#2a2f3a'; rr(880, 210, 70, 70, 16); ctx.fill(); ctx.fillStyle = led > .5 ? '#3cff7a' : '#1d6a36'; ctx.beginPath(); ctx.arc(915, 245, 22, 0, TAU); ctx.fill(); if (led > .5) glow(915, 245, 110, '#3cff7a', .55, .5);
  /* the TEMP LOG, taped below the dial */
  ctx.save(); ctx.translate(540, 1150); ctx.rotate(-.025);
  ctx.fillStyle = 'rgba(30,20,30,.18)'; ctx.fillRect(-384, -146, 780, 300); ctx.fillStyle = '#fffdf6'; ctx.fillRect(-390, -152, 780, 296); ctx.strokeStyle = 'rgba(60,50,40,.45)'; ctx.lineWidth = 2; ctx.strokeRect(-390, -152, 780, 296);
  UI.container('tlog', 'sign', [-390, -152, 390, 144], 6);
  TXT('TEMP LOG', 0, -118, { size: 36, weight: 900, fill: '#1e2230', spacing: 2, cid: 'tlog', maxW: 400 });
  const rows = [['11/4', '38', 'SB'], ['11/5', '37', 'LM'], ['11/6', '', '']];
  ctx.strokeStyle = 'rgba(40,40,60,.35)'; ctx.lineWidth = 2; for (let i = 0; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-360, -84 + i * 66); ctx.lineTo(360, -84 + i * 66); ctx.stroke(); }
  for (const xx of [-140, 100]) { ctx.beginPath(); ctx.moveTo(xx, -84); ctx.lineTo(xx, 114); ctx.stroke(); }
  rows.forEach((r, i) => { const y = -51 + i * 66; TXT(r[0], -250, y, { size: 34, weight: 800, fill: '#2a3550', cid: 'tlog' }); if (r[1]) TXT(r[1], -20, y, { size: 36, font: 'Lucky', weight: 400, fill: '#2a3550', cid: 'tlog' }); if (r[2]) TXT(r[2], 230, y, { size: 36, font: 'Lucky', weight: 400, fill: '#2a3550', cid: 'tlog' }); });
  if (b >= 0) { const w1 = c01(b / .1), w2 = c01((b - .16) / .1), y = -51 + 2 * 66;
    TXT(String(safe), -20, y, { size: 36, font: 'Lucky', weight: 400, fill: '#1e8e5a', cid: 'tlog', reveal: w1 });
    if (w2 > 0) TXT('ON', 230, y, { size: 36, font: 'Lucky', weight: 400, fill: '#1e8e5a', cid: 'tlog', reveal: w2 }); }
  ctx.restore();
  if (b >= -.1 && b < .42) { const k = c01((b + .1) / .36), px = lerp(470, 990, k), py = 1150 + 81 + 10 * Math.sin(k * 20) - 8;   /* the pen runs just ahead of the ink, its hand below the row */
    ctx.save(); ctx.translate(px, py); ctx.rotate(PI - .7); ctx.fillStyle = '#2b6cff'; rr(-9, -150, 18, 140, 8); ctx.fill(); ink(3); ctx.fillStyle = '#e8ebf0'; poly([[-9, -10], [9, -10], [0, 8]], '#e8ebf0', INKC, 2.6); ctx.restore();
    glove(px + 110, py + 130, PI + .9, 3.2, 'grip', false, 700); }
  burst(540, 590, a, 380, 12, 'rgba(60,255,140,.55)', 6, .2);
}
/* 5 BINDERSLAM: a low, tilted look along the shelf: the row of policy binders slammed tight on the cut (dust jumps out); the proud 7.4 is tapped flush on the off-beat */
function ins5(lt, a, b) {
  insWall(1360, { wallB: '#e6d9be' });
  const sy = 1180, n = 8, bw = 112, bh = 560, x0 = 540 - n * bw / 2 - 20;
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(-300, sy + 30, W + 600, 26);
  ctx.fillStyle = lg(0, sy, 0, sy + 44, [[0, '#e2cba3'], [1, '#a68660']]); ctx.fillRect(-300, sy, W + 600, 44); ctx.strokeStyle = INKC; ctx.lineWidth = 4; ctx.strokeRect(-310, sy, W + 620, 44);
  const comp = 1 - .03 * hitK(a, .05), push = 26 * hitK(a, .07);
  ctx.save(); ctx.translate(x0 + n * bw, sy); ctx.scale(comp, 1); ctx.translate(-(x0 + n * bw), -sy);
  for (let i = 0; i < n; i++) {
    const [col, sp] = BIND[i], proud = i === 6 ? (b < 0 ? 46 : 46 * (1 - eo3(c01(b / .07)))) : 0;
    const bx = x0 + i * bw + bw / 2 + (i === n - 1 ? push * .3 : 0);
    binderP({ x: bx, y: sy - bh / 2 - proud, w: bw - 6, h: bh, rot: 0, color: i === 6 ? '#c2272d' : col, spine: i === 6 ? '7.4' : sp, t: lt, hero: true });
  }
  ctx.restore();
  for (let i = 1; i < n; i += 2) puff(x0 + i * bw, sy - bh - 10, 60, lt, MT[4] + .01, { life: .5, seed: 7 + i, color: '#f4efe4', flat: .3 });
  glove(x0 + n * bw + 70 + push, sy - 300, PI, 4.8, 'flat', true, 900);
  speedLines(x0 + n * bw + 120, sy - 300, a - .005, PI, 7, 300, 380, 'rgba(255,255,255,.85)', .14);
  if (b >= -.1 && b < .26) { const fx = x0 + 6 * bw + bw / 2, topY = sy - bh - (b < 0 ? 46 : 46 * (1 - eo3(c01(b / .07)))), lift = b < 0 ? 60 * (1 - c01((b + .1) / .1)) : 90 * ss(b, .12, .26);
    glove(fx + 8, topY - 192 - lift, PI / 2 + .04, 4.2, 'point', false, 1100); }
  if (b >= 0) burst(x0 + 6 * bw + bw / 2, sy - bh, b, 120, 8, 'rgba(255,255,255,.9)', 5, .18);
}
/* 6 MOP: the floor at mop height: the mop swipes a wet, shining band on the cut; the WET FLOOR sign pops up on the off-beat */
function ins6(lt, a, b) {
  ctx.fillStyle = lg(0, 0, 0, 520, [[0, '#f2ebdd'], [1, '#e2d6bd']]); ctx.fillRect(-300, -300, W + 600, 820);
  ctx.fillStyle = lg(0, 430, 0, 520, [[0, '#5f9a96'], [1, '#467a76']]); ctx.fillRect(-300, 380, W + 600, 140); ctx.fillStyle = '#f2ece0'; ctx.fillRect(-300, 500, W + 600, 36);
  const HY = 536; ctx.fillStyle = lg(0, HY, 0, H, [[0, '#d2cab9'], [1, '#e8e1d2']]); ctx.fillRect(-300, HY, W + 600, H);
  ctx.strokeStyle = 'rgba(70,56,60,.18)'; ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) { const y = HY + Math.pow(i / 11, 1.8) * 1500; ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(W + 300, y); ctx.stroke(); }
  for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(540 + i * 70, HY); ctx.lineTo(540 + i * 420, H + 300); ctx.stroke(); }
  /* the wet band: drawn behind the mop, from the right edge to the mop head; it shines */
  const mx = lerp(800, -460, ss(a, 0, .5)), my = 1080;
  ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = lg(0, my - 120, 0, my + 120, [[0, 'rgba(255,255,255,0)'], [.3, 'rgba(225,240,255,.55)'], [.5, 'rgba(255,255,255,.85)'], [.7, 'rgba(225,240,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  ctx.beginPath(); ctx.moveTo(mx + 60, my - 110); ctx.bezierCurveTo(500, my - 140, 900, my - 90, W + 300, my - 120); ctx.lineTo(W + 300, my + 130); ctx.bezierCurveTo(900, my + 110, 500, my + 140, mx + 60, my + 110); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 8; i++) { const x = mx + 120 + i * 120; if (x > W + 100) continue; ctx.beginPath(); ctx.ellipse(x, my - 60 + 110 * rn(121, i), 40, 6, 0, 0, TAU); ctx.fill(); }   /* glints on the wet */
  if (a < .5) {                                                                                                   /* the mop head and its handle */
    ctx.save(); ctx.translate(mx, my); ctx.rotate(-.1);
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(40, -40); ctx.lineTo(420, -1000); ctx.stroke();
    ctx.fillStyle = '#5c6474'; rr(-150, -60, 300, 54, 14); ctx.fill(); ink(5);
    for (let i = -12; i <= 12; i++) { ctx.save(); ctx.translate(i * 12, -8); ctx.rotate(.5 + i * .02); ctx.fillStyle = '#f0ece2'; rr(-9, 0, 18, 120, 9); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.45)'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore(); }
    ctx.restore(); speedLines(mx + 220, my, a, PI, 7, 340, 240, 'rgba(255,255,255,.9)', .2);
  }
  /* the WET FLOOR sign pops up on the off-beat (an A-frame unfolding) */
  if (b >= 0) { const k = eb(c01(b / .16)), cx = 640, by = 1300, S = 2.7; if (k > .02) {
    ctx.save(); ctx.translate(cx, by); ctx.scale(S, S * k);
    ctx.fillStyle = 'rgba(20,14,24,.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 50, 9, 0, 0, TAU); ctx.fill();
    poly([[-38, 0], [38, 0], [26, -146], [-26, -146]], '#ffd21f', INKC, 3.4); poly([[-26, -146], [26, -146], [31, -158], [-21, -158]], '#e8b800', INKC, 3);
    ctx.fillStyle = '#17141c'; ctx.fillRect(-28, -132, 56, 20);
    ctx.strokeStyle = '#17141c'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-3, -60); ctx.lineTo(2, -44); ctx.lineTo(-8, -28); ctx.moveTo(2, -44); ctx.lineTo(14, -36); ctx.moveTo(-3, -58); ctx.lineTo(-14, -50); ctx.stroke();
    ctx.fillStyle = '#17141c'; ctx.beginPath(); ctx.arc(-6, -66, 4.5, 0, TAU); ctx.fill();
    ctx.restore();
    if (k > .9) { UI.container('wfs', 'sign', [cx - 26 * S, by - 146 * S, cx + 26 * S, by - 20 * S], 4); TXT('CAUTION', cx, by - 122 * S, { size: 14 * S, weight: 900, fill: '#ffd21f', spacing: 1, maxW: 50 * S }); TXT('WET FLOOR', cx, by - 92 * S, { size: 13 * S, weight: 900, fill: '#17141c', maxW: 50 * S }); }
    burst(cx, by - 80 * S, b, 300, 10, 'rgba(255,255,255,.9)', 6, .2); } }
}
/* 7 POSTERFLIP: FUN COMMITTEE is yanked round on its pivot on the cut and lands as HAND HYGIENE; a pushpin goes into its corner on the off-beat */
function ins7(lt, a, b) {
  insWall(1300);
  const P = { x: 220, y: 300, w: 640, h: 820 }, k = c01(a / .2), sx = Math.cos(k * PI), side = k < .5 ? 0 : 1, land = k >= 1 ? 1 + .03 * wob(a - .2, 30, .1) : 1;
  ctx.fillStyle = '#9aa3b2'; rr(530, 250, 20, 50, 6); ctx.fill(); ink(3);                                        /* the pivot clip */
  ctx.save(); ctx.translate(P.x + P.w / 2, P.y); ctx.scale(Math.max(.03, Math.abs(sx)) * land, land); ctx.translate(-(P.x + P.w / 2), -P.y);
  ctx.fillStyle = 'rgba(30,20,30,.2)'; rr(P.x + 14, P.y + 18, P.w, P.h, 12); ctx.fill();
  if (k > .08 && k < .92) { ctx.fillStyle = side ? '#dff6ec' : '#f4e6ff'; rr(P.x, P.y, P.w, P.h, 12); ctx.fill(); ink(4); ctx.fillStyle = side ? '#1e8e5a' : '#e8406a'; rr(P.x + 40, P.y + 50, P.w - 80, 120, 10); ctx.fill(); ctx.fillRect(P.x + 60, P.y + 300, P.w - 120, 90); }
  else posterFace(side, P.x, P.y, P.w, P.h, 'iposter');
  ctx.restore();
  if (a < .2) speedLines(P.x + P.w + 40, P.y + P.h * .5, a, -PI / 2 * 0 + PI, 8, 220, 600, 'rgba(255,255,255,.85)', .2);
  if (a < .22) glove(lerp(P.x + P.w + 30, P.x + P.w * .5, k) + 30, P.y + P.h * .55, PI + .1, 3.8, 'grip', true, 900);
  const pins = [[P.x + 26, P.y + 26], [P.x + P.w - 26, P.y + 26], [P.x + 26, P.y + P.h - 26]];
  if (k >= 1) for (const [px, py] of pins) { ctx.fillStyle = '#d4202c'; ctx.beginPath(); ctx.arc(px, py, 14, 0, TAU); ctx.fill(); ink(3); }
  if (b >= -.08) { const pk = c01((b + .08) / .08), px = P.x + P.w - 26, py = P.y + P.h - 26 + (1 - pk) * 0;
    ctx.fillStyle = '#d4202c'; ctx.beginPath(); ctx.arc(px, py, 14 + 8 * (1 - pk), 0, TAU); ctx.fill(); ink(3);
    if (b < .25) glove(px + 46, py + 30 + 40 * (1 - pk), PI + .55, 3.4, 'thumb', false, 900);
    burst(px, py, b, 70, 8, 'rgba(255,255,255,.9)', 5, .16); }
  if (a > .22 && a < .8) twinkle(P.x + P.w * .78, P.y + 120, 40, a - .22, .5);
}
/* 9 COFFEEHIDE: the big drawer slams shut on the cut and bounces open (the coffee maker inside, its clock still lit, the pot sloshing); a palm slaps it shut on the off-beat; steam escapes the seam */
function ins9(lt, a, b) {
  ctx.fillStyle = lg(0, 0, 0, 520, [[0, '#f7ecd8'], [1, '#e2cfaa']]); ctx.fillRect(-300, -300, W + 600, 820);           /* the counter front above */
  ctx.fillStyle = lg(0, 440, 0, 520, [[0, '#f7ecd8'], [1, '#d9c3a0']]); ctx.fillRect(-300, 440, W + 600, 80); ctx.fillStyle = 'rgba(30,20,30,.25)'; ctx.fillRect(-300, 516, W + 600, 10);
  ctx.fillStyle = '#9aa3b2'; rr(390, 300, 300, 34, 17); ctx.fill(); ink(4);                                          /* the pull of the drawer above */
  const gapY = 526, open = b >= 0 ? 260 * (1 - eo3(c01(b / .06))) : a < .03 ? 0 : 260 * eo(c01((a - .03) / .14)) * (1 - .06 * Math.sin(c01((a - .17) / .3) * PI));
  if (open > 2) {                                                                                                     /* inside the drawer: the coffee maker, seen from above */
    ctx.save(); ctx.beginPath(); ctx.rect(-300, gapY, W + 600, open); ctx.clip();
    ctx.fillStyle = lg(0, gapY, 0, gapY + 260, [[0, '#4a4252'], [1, '#6a6070']]); ctx.fillRect(-300, gapY, W + 600, open);
    const cy = gapY + open - 20, sl = Math.sin(lt * 18) * Math.exp(-Math.max(0, a - .05) * 5);
    ctx.save(); ctx.translate(500, cy); ctx.scale(1.7, 1.7);
    ctx.fillStyle = lg(0, -120, 0, 0, [[0, '#3a404c'], [1, '#22262e']]); rr(-210, -128, 300, 128, 18); ctx.fill(); ink(4);      /* the body, lying in the drawer */
    ctx.fillStyle = '#16233a'; rr(-170, -100, 120, 46, 8); ctx.fill(); ctx.fillStyle = '#5effa0'; for (let i = 0; i < 4; i++) { if (i === 1) continue; rr(-158 + i * 26, -90, 18, 26, 3); ctx.fill(); } ctx.beginPath(); ctx.arc(-117, -84, 3, 0, TAU); ctx.arc(-117, -70, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(-20, -76, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(205,230,250,.85)'; rr(100, -120, 120, 110, 34); ctx.fill(); ink(3.4);                                 /* the glass pot */
    ctx.fillStyle = '#6a3a1a'; ctx.beginPath(); ctx.moveTo(106, -60 + 6 * sl); ctx.quadraticCurveTo(160, -70 - 8 * sl, 214, -60 - 6 * sl); ctx.lineTo(214, -26); ctx.quadraticCurveTo(160, -10, 106, -26); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#22262e'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(232, -66, 22, -1.2, 1.2); ctx.stroke();
    ctx.restore(); glow(500 - 190, cy - 130, 160, '#5effa0', .3 * c01(open / 120), .3); ctx.restore();
  }
  const fy = gapY + open;
  ctx.fillStyle = lg(0, fy, 0, fy + 1500, [[0, '#f3e3c6'], [1, '#d6bd93']]); rr(-40, fy, W + 80, 1600, 10); ctx.fill(); ink(5);
  ctx.strokeStyle = 'rgba(120,90,50,.16)'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-40, fy + 90 + i * 80); ctx.bezierCurveTo(300, fy + 70 + i * 80, 700, fy + 110 + i * 80, W + 40, fy + 80 + i * 80); ctx.stroke(); }
  ctx.fillStyle = '#9aa3b2'; rr(380, fy + 150, 320, 40, 20); ctx.fill(); ink(4);
  burst(540, gapY + 20, a, 280, 10, 'rgba(255,255,255,.9)', 7, .18);
  if (b >= -.07 && b < .28) { const k = c01((b + .07) / .07), back = ss(b, .1, .28); glove(lerp(860, 760, k) + 200 * back, fy + 300 - 40 * k + 160 * back, -PI * .78, 5.0, 'flat', true, 700); }
  if (b >= 0) burst(720, fy + 240, b, 230, 9, 'rgba(255,255,255,.85)', 6, .16);
  if (b > .05 && b < 1) { ctx.save(); for (let i = 0; i < 4; i++) { const ag = b - .05 - i * .07; if (ag < 0) continue; const x = 420 + i * 90 + 50 * Math.sin(ag * 5 + i), y = gapY - 20 - ag * 420, r = 40 + ag * 120;
    ctx.globalAlpha = .85 * Math.sin(PI * c01(ag / .8)); ctx.fillStyle = rg(x, y, 2, r, [[0, 'rgba(255,255,255,1)'], [.7, 'rgba(240,244,250,.8)'], [1, 'rgba(200,210,230,0)']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(110,100,120,.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r * .8, 0, TAU); ctx.stroke(); } ctx.restore(); }
}
/* 10 SANITIZER: the wall dispenser, freshly refilled: the bar is pumped on the cut (foam into a palm); a REFILLED label slaps on on the off-beat */
function ins10(lt, a, b) {
  insWall(1200);
  ctx.fillStyle = lg(0, 1150, 0, 1190, [[0, '#d8b98a'], [1, '#a48056']]); rr(-300, 1150, W + 600, 42, 20); ctx.fill(); ink(4);   /* the handrail */
  const pump = a < 0 ? 0 : a < .04 ? 1 : 1 - ss(a, .1, .3);
  const r = sanitizerP({ x: 540, y: 560, s: 2.5, pump: has21('sanitizer') ? pump * (1 - ss(a, .1, .16)) : pump, level: 1, t: lt, label: false });
  const [nx, ny] = r.nozzle || [540, 885];
  glove(780, 760 + 26 * pump, PI + .05, 4.0, 'flat', true, 900);                                                  /* the hand that pumps the bar */
  const palmY = 1210; glove(380, palmY + 40, -.12, 4.4, 'open', true, 900);                                         /* the palm that catches it */
  const fall = c01((a - .02) / .16), dy = lerp(ny + 20, palmY - 30, eo(fall)), blob = 1 + .25 * hitK(a - .18, .06);
  if (a >= 0) { ctx.fillStyle = rg(nx - 10, dy - 12, 4, 56, [[0, '#ffffff'], [1, '#e6f4ff']]); ctx.beginPath(); ctx.ellipse(nx, dy, 46 * blob, 34 / blob, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,150,200,.6)'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(nx - 30 + 15 * i, dy - 26 - 8 * rn(131, i), 9 + 5 * rn(132, i), 0, TAU); ctx.fill(); } }
  burst(540, ny - 40, a, 200, 9, 'rgba(255,255,255,.9)', 6, .18);
  if (b >= 0) { const l = 1 + .1 * hitK(b, .05); surveyLabel({ x: 540, y: 470, s: 1.3 * l, rot: -.04, text: 'REFILLED 11/6 3:06P', t: lt, hero: true }); burst(540, 470, b, 380, 10, 'rgba(255,255,255,.9)', 5, .18); }
  if (a > .3 && a < .8) twinkle(600, 470, 40, a - .3, .5);
}
/* 11 CRASHCART: the red cart, close and tilted: the numbered seal is pulled tight through the hasp on the cut (the tag swings); the defibrillator lights READY on the off-beat */
function ins11(lt, a, b) {
  ctx.fillStyle = lg(0, 0, 0, H, [[0, '#f6efe1'], [1, '#e6d8bb']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  ctx.fillStyle = lg(0, 1100, 0, H, [[0, '#5f9a96'], [1, '#467a76']]); ctx.fillRect(-300, 1100, W + 600, H); ctx.fillStyle = '#faf6ec'; ctx.fillRect(-300, 1086, W + 600, 20);
  const cs = 3.0, cx = 470, fy = 1850;
  const r = crashCartP({ x: cx, y: fy, s: cs, open: 0, seal: a < 0 ? 0 : 1, tagSwing: .5 * wob(a, 12, .35) + .25 * wob(b, 12, .3), t: lt });
  const [hx, hy] = r.hasp;
  /* READY: a lit chip on the defibrillator's front, under its screen (the kit's defib sits at local x 20..136, y -502..-430) */
  const ready = b >= 0 ? (b < .45 ? 1 : .75) : 0, rx0 = cx + 30 * cs, ry0 = fy - 458 * cs, rw = 96 * cs, rh = 24 * cs;
  ctx.fillStyle = ready ? '#3cff7a' : '#1d4a2e'; rr(rx0, ry0, rw, rh, 10); ctx.fill(); ink(3.4); if (ready) glow(rx0 + rw / 2, ry0 + rh / 2, 200, '#3cff7a', .45 * ready, .4);
  UI.container('ready', 'sign', [rx0, ry0, rx0 + rw, ry0 + rh], 6); TXT('READY', rx0 + rw / 2, ry0 + rh / 2, { size: 46, font: 'Bangers', weight: 400, fill: ready ? '#0c3a1c' : '#3a6a4a', spacing: 2, cid: 'ready', maxW: rw - 30 });
  if (a >= 0 && a < .3) { const k = c01(a / .1); glove(lerp(hx + 130, hx + 400, eo(k)), hy + 150 + 60 * k, PI + .4, 3.8, 'grip', true, 900);
    ctx.strokeStyle = '#d3203a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy + 20); ctx.quadraticCurveTo(hx + 100, hy + 150, lerp(hx + 120, hx + 380, eo(k)), hy + 140 + 60 * k); ctx.stroke(); }
  burst(hx, hy + 40, a, 150, 9, 'rgba(255,255,255,.95)', 6, .18);
  if (b >= 0) burst(rx0 + rw / 2, ry0 + rh / 2, b, 330, 12, 'rgba(120,255,170,.8)', 5, .18);
  if (a > .3 && a < .9) twinkle(hx - 50, hy - 40, 44, a - .3, .55);
}
/* 8 CLOSETSLAM (the station camera): Mango has just pushed Brenda in: the door slams on the cut (Brenda, mid-bite, wide-eyed in the window); Mango slaps NOT A CLOSET over the window on the off-beat */
const MANGO8 = { x: 1180, y: 1352 };
function mango8(lt, a, b) {
  const slap = b >= -.12 ? c01((b + .12) / .12) : 0, back = ss(b, .03, .15);
  const push = [lerp(96, 102, hitK(a, .08)), -54], sign = [lerp(96, 104, slap) - 50 * back, lerp(-54, -96, slap) + 80 * back];
  return A7.mango({ x: MANGO8.x - 18 * back, y: MANGO8.y, s: .9, t: lt, who: 'mango', expr: b >= 0 ? 'happy' : 'smug', look: b >= .3 ? [-.6, 0] : [.8, -.2], yaw: b >= .3 ? -.05 : .25, headYaw: b >= .3 ? -.3 : .45, plant: true,
    arms: { l: 'rest', r: 'hold' }, hand: { r: 'flat' }, grip: { r: b >= -.12 ? sign : push }, squash: .03 * hitK(a, .08) });
}
function brendaIn(lt, a) {                                                     /* Brenda inside the closet, seen through the window: mid-bite, eyes wide */
  if (!window.A13 || !A13.brenda) return null;
  const [wx, wy, ww, wh] = CLOSET.win, s = .5;
  const o = A13.brenda({ t: lt, id: 'brendaW', who: 'brenda', expr: A13.expr('wake'), lid: 0, dust: .2, specsDrop: .4, look: [0, 0], yaw: -.1, headYaw: -.1, noLegs: true,
    arms: { l: 'rest', r: 'hold' }, hold: { r: 'fp21p_sandwich' }, grip: { r: [36, -6] }, sandScale: .95, sandTilt: -.35 });
  const fc = (KINDS.prune.ry * .9 - (KINDS.prune.eyeY + KINDS.prune.mouthY) / 2) * s;
  return Object.assign(o, { x: wx + ww / 2 + 2, y: wy + wh * .42 + fc + 4 * hitK(a, .1), s });
}
function draw8(lt, a, b) {
  const st = ST(lt), C = FR.C;
  V2.setLight({ key: [-.4, -.65], keyColor: '#fff6e6', keyA: .2, rim: '#d8e6ff', rimA: .3, shadow: '#2a2038', shadowA: .28, bounce: '#ffeccc', bounceA: .1, amb: '#ffffff', ambA: .06, frontDark: .02 }); V2.opts.reflect = false;
  const sgn = Object.assign({}, st, { closetSign: b >= 0 });
  const bo = brendaIn(lt, a);
  roomS(lt, sgn, { closet: { rattle: 3 * wob(a, 40, .12), sign: b >= 0, inWin: bo ? () => { REG.suppress++; drawChar(bo); REG.suppress--; } : null, hero: false } });
  stCounterFront(lt, st); stCounterTop(lt, st);
  const [wx, wy, ww, wh] = CLOSET.win;
  puff(CLOSET.x0 + 14, FL - 10, 70, lt, MT[7] + .005, { life: .5, seed: 41, flat: .5, color: '#efe8da' }); puff(CLOSET.x1 - 14, FL - 10, 70, lt, MT[7] + .005, { life: .5, seed: 42, flat: .5, color: '#efe8da' });
  burst(CLOSET.x1 - 20, 960, a, 110, 8, 'rgba(255,255,255,.9)', 4, .18);
  drawChar(mango8(lt, a, b));
  if (b >= 0) { burst(wx + ww / 2, wy + wh / 2, b, 150, 10, 'rgba(255,255,255,.9)', 3.4, .16); if (b > .3) { const ag = b - .3; ctx.fillStyle = '#d9b57a'; ctx.beginPath(); ctx.ellipse(1356 + 4 * ag, Math.min(FL + 3, 1150 + 900 * ag * ag), 6, 3.6, .3, 0, TAU); ctx.fill(); } }
}
/* 12 SPARKLE (the station camera): the empty station, gleaming; a sparkle wipe crosses the frame on the cut; a big twinkle on the counter on the off-beat */
function draw12(lt, a, b) {
  const st = Object.assign(ST(lt), { gleam: 1 });
  V2.setLight({ key: [-.4, -.65], keyColor: '#fff8ee', keyA: .24, rim: '#e8f0ff', rimA: .34, shadow: '#2a2038', shadowA: .24, bounce: '#fff2d8', bounceA: .12, amb: '#ffffff', ambA: .08, frontDark: .02 }); V2.opts.reflect = false;
  roomS(lt, st, {}); stCounterFront(lt, st); stCounterTop(lt, st);
  const pts = [[SHELF.x0 + 40, SHELF.y - 150, 0], [CTR.x0 + 60, CTR.top - 4, .05], [CTR.x1 - 40, CTR.top - 4, .1], [SIGNP.x + 160, SIGNP.y - 26, .02], [CART.x + 90, CART.y - 350, .08], [CLOCKP.x + 34, CLOCKP.y - 34, .12],
    [FRIDGE.x1 - 24, FRIDGE.y0 + 24, .06], [POSTER.x + POSTER.w - 14, POSTER.y + 14, .03], [CLOSET.x1 - 20, CLOSET.y0 + 20, .14], [SAN.x + 20, SAN.y - 40, .1], [TOPX.carton, CTR.top - 90, .16], [TOPX.lam + 40, CTR.top - 30, .18]];
  pts.forEach(([x, y, d], i) => { twinkle(x, y, 40 + 16 * rn(141, i), a - d, .6); twinkle(x + 30, y - 20, 22, a - d - .3, .5); });
  if (b >= 0) { twinkle(895, CTR.top - 40, 120, b, .5); glow(895, CTR.top - 40, 300, '#fffbe8', .25 * (1 - c01(b / .5)), .3); }
}
function wipeOver(lt, a) {                                                      /* the sparkle wipe of shot 12: a soft diagonal band of light that sweeps the frame (screen space, additive, never a flash) */
  if (a < 0 || a > .4) return; const k = a / .4, x = lerp(-500, W + 500, eo(k));
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, H / 2); ctx.rotate(.35);
  ctx.fillStyle = lg(-160, 0, 160, 0, [[0, 'rgba(255,250,230,0)'], [.5, 'rgba(255,250,230,' + (.32 * Math.sin(PI * k)) + ')'], [1, 'rgba(255,250,230,0)']]); ctx.fillRect(-160, -1400, 320, 2800); ctx.restore();
}
const INS = [ins1, ins2, ins3, ins4, ins5, ins6, ins7, draw8, ins9, ins10, ins11, draw12];
const INSCAM = { 7: { x: 1258, y: 1110, z: [2.2, 2.26] }, 11: { x: 900, y: 1000, z: [1.0, 1.04] } };
const INSROLL = [0, .03, 0, -.02, -.06, 0, 0, 0, .025, 0, .03, 0];             /* a dutch angle or two */
function camIns(lt, sh) {
  const k = sh.ins, a = lt - MT[k], b = lt - MOFF[k], u = c01(a / 1.0), c = INSCAM[k];
  if (c) { zoomTo(c.x, c.y, lerp(c.z[0], c.z[1], u)); FR = { sh, C: {} }; }
  else zoomTo(540, 960, 1 + .025 * u);                                          /* a slow push through every insert */
  CAM.r = INSROLL[k];
  const punch = 2 * hitK(a, .06) + 1 * hitK(b, .06);                            /* the 2 px camera punch on the downbeat (1 px on the off-beat) */
  CAM.y += punch / CAM.z; CAM.z *= 1 + .002 * hitK(a, .06);
  FR = { sh, C: {}, a, b };
}
function drawIns(lt) {
  const { sh, a, b } = FR;
  HEROMODE = true; INS[sh.ins](lt, a, b); HEROMODE = false;
}

// ====================================================================================================================================================================================
// THE HALL (S6.corridor, one-point perspective as Episode 15's model2): Melon, then the forty agency Strawberries in three waves (far, middle, the front six), Strawberry, Lemon.
// A character at depth Z is drawn at s = V2.at(X, Z).s * CS (CS .6 for the Strawberries, .72 for Melon, .62 for Lemon).
// ====================================================================================================================================================================================
const HALLC = { f: 1400, cy: 360, hy: 860 };
const CSs = .6, CSm = .72, CSl = .62;
const HDCOL = ['#a8744f', '#7d9a6a', '#6f8fb5', '#b98a5a'], HDOORS = [];
for (let j = 0; j < 9; j++) for (const side of [1, -1]) HDOORS.push({ side, z: (side > 0 ? 1600 : 2000) + 560 * j, n: '', color: HDCOL[(j + (side > 0 ? 0 : 2)) % 4] });
HDOORS.sort((a, b) => a.z - b.z);
function hallSet(lt) {
  V2.setCam(HALLC);
  V2.setLight({ key: [-.3, -.85], keyColor: '#fff4e0', keyA: .2, rim: '#bcd4ff', rimA: .36, shadow: '#1a1030', shadowA: .26, amb: '#ffffff', ambA: .07, frontDark: .02 }); V2.opts.reflect = false;
  if (typeof S6 !== 'undefined' && S6.corridor) S6.corridor({ doors: HDOORS, fog: '#c4ccd8', fogAmt: .45, wall: '#efe7d6', wain: '#5f9a96', bright: 1.06, signs: [] });
  else { ctx.fillStyle = '#e8e0cc'; ctx.fillRect(-300, -300, W + 600, H + 600); }
}
/* the forty: the front six are real characters (speaking size in ch1), the other 34 cached sprites; wave = which poof brings them */
const CROWD = (() => {
  const L = [], rows = [[1500, 6, 3], [1820, 5, 2], [2160, 5, 2], [2560, 6, 2], [3000, 6, 1], [3560, 6, 1], [4250, 6, 1]];
  rows.forEach(([Z, n, wave], r) => { for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, X = r === 0 ? lerp(-280, 280, i / (n - 1)) : lerp(-270, 270, u) + (rn(150 + r, i) - .5) * 30 + (r % 2 ? 14 : -14), h = rn(160 + r, i);
    L.push({ X, Z: Z + (r ? (rn(170 + r, i) - .5) * 60 : 0), wave, front: r === 0, yaw: r === 0 ? [.18, .1, .04, -.04, -.1, -.18][i] : (h < .45 ? 0 : h < .72 ? 1 : 2), ph: rn(180 + r, i) * TAU, d: Math.round(rn(190 + r, i) * 3), r, i }); } });
  L.forEach((c, k) => { c.k = k; c.pop = CUE.poof[3 - c.wave] + (c.front ? c.i * .012 : rn(200, k) * .07); });
  return L;
})();
function chorAt(lt) {                                                          /* the chorus mouth (the engine's lip-sync string of the chor line) */
  const T_ = TP.START + lt;
  for (const l of TLX.lines) if (l.who === 'chor' && l.scene === 'prep' && T_ >= l.s && T_ < l.e) { const i = Math.min(l.mouth.length - 1, Math.floor((T_ - l.s) * 30)); return (l.mouth.charCodeAt(i) - 48) / 9; }
  return 0;
}
const CHEER = lt => lt >= TP.ls('ch1') - .12 && lt < TP.le('ch1') + .25;
const SPR = new Map(), YAWS = [0, .55, -.55], SP_W = 420, SP_H = 470, SP_FX = 210, SP_FY = 452;
function cloneSprite(yi, mouth, cheer, lod) {
  const key = `${yi}|${mouth}|${cheer}|${lod}`; let sp = SPR.get(key); if (sp) return sp;
  const s0 = lod ? .42 : 1, cv = document.createElement('canvas'); cv.width = Math.ceil(SP_W * s0); cv.height = Math.ceil(SP_H * s0); cv.__txOK = true;
  const g = cv.getContext('2d'), prev = ctx; ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  REG.suppress++;
  try { const o = A11.straw({ x: SP_FX * s0, y: SP_FY * s0, s: s0, t: 0, yaw: YAWS[yi], headYaw: YAWS[yi], talk: mouth / 3, noBob: true, noShadow: true, noReflect: true, who: undefined, look: [yi === 1 ? .3 : yi === 2 ? -.3 : 0, .05],
      expr: 'happy', arms: { l: cheer ? 'cheer' : 'rest', r: cheer ? 'cheer' : 'rest' } }); o.acc = (o.acc || []).filter(a => a !== 'perdiem9').concat(['fp21p_agency']); o.agNoText = true; drawChar(o); }
  finally { REG.suppress--; ctx = prev; }
  SPR.set(key, cv); return cv;
}
/* the crowd behind the front row: far to near, each with its pop, its breath and its chorus mouth; o.look: where they all look (a yaw bias) */
function drawCrowd(lt, o = {}) {
  const vis = CROWD.filter(c => !c.front && lt >= c.pop - .001).sort((a, b) => b.Z - a.Z), prevS = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (const c of vis) {
    const q = V2.at(c.X, c.Z), age = lt - c.pop, sc = q.s * CSs, pop = age < .24 ? eb(age / .24) : 1, hop = age < .24 ? -Math.sin(PI * c01(age / .24)) * 30 * sc : 0;
    if (pop <= .02) continue;
    const m = Math.round(c01(chorAt(lt - c.d * .034) * 1.25) * 3), yi = o.yi !== undefined ? o.yi : c.yaw, lod = sc < .3 ? 1 : 0, spr = cloneSprite(yi, m, CHEER(lt - c.d * .03) ? 1 : 0, lod);
    const br = Math.sin(lt * 2.2 + c.ph), kx = sc * pop * (1 + .004 * br), ky = sc * pop * (1 - .006 * br);
    ctx.fillStyle = 'rgba(30,24,40,.2)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 3 * sc, 110 * sc * pop, 13 * sc * pop, 0, 0, TAU); ctx.fill();
    ctx.drawImage(spr, q.x - SP_FX * kx, q.y - SP_FY * ky + hop, SP_W * kx, SP_H * ky);
  }
  ctx.imageSmoothingEnabled = prevS;
}
function frontSix(lt, o = {}) {                                                 /* the front row: real Strawberries with AGENCY badges (who 'chor': their mouths move with "Agency!") */
  return CROWD.filter(c => c.front).map(c => {
    const q = V2.at(c.X, c.Z), age = lt - c.pop, pop = age < .24 ? eb(age / .24) : 1, ch = CHEER(lt - c.i * .02);
    if (pop < .02) return null;
    const yaw = o.yaw !== undefined ? o.yaw : c.yaw * .6;
    const r = agencyOn(A11.straw({ id: 'ag' + c.i, x: q.x, y: q.y + (age < .24 ? -Math.sin(PI * c01(age / .24)) * 24 * q.s : 0), s: q.s * CSs * pop, t: lt + c.i * .7, who: 'chor', seed: 300 + c.i, yaw, headYaw: yaw,
      expr: 'happy', look: o.look || [-yaw * .8, 0], arms: { l: ch ? 'cheer' : 'rest', r: ch ? 'cheer' : 'rest' }, plant: true }));
    return r;
  }).filter(Boolean);
}
function poofs(lt) {                                                            /* one poof per Strawberry, the instant she appears */
  for (const c of CROWD) { const age = lt - c.pop; if (age < -.02 || age > .7) continue; const q = V2.at(c.X, c.Z), sc = q.s * CSs;
    puff(q.x, q.y - 170 * sc, 190 * sc, lt, c.pop - .02, { life: .6, seed: 11 + c.k, color: '#fbf6ff', flat: .05 });
    if (age >= 0 && age < .3) { star4(q.x + 90 * sc, q.y - 300 * sc * (1 + age), 22 * sc, age * 8, '#ffe135', 1 - age / .3); star4(q.x - 100 * sc, q.y - 250 * sc * (1 + age), 16 * sc, -age * 7, '#ffffff', 1 - age / .3); } }
}
/* Melon (the Administrator), Strawberry (the real one, per diem), Lemon, in hall units */
function melonH(lt, X, Z, o = {}) {
  const q = V2.at(X, Z), sp = speaking('me1', lt), shrug = lt >= TP.wS('me1', 3) - .1 && lt < TP.le('me1') + .3, jump = ss(lt, CUE.poof[2] - .02, CUE.poof[2] + .12) * (1 - ss(lt, CUE.poof[2] + .4, CUE.poof[2] + .8));
  const lookAround = sp ? Math.sin((lt - TP.ls('me1')) * 4.2) * .45 : 0;
  return Object.assign(A9.melon({ x: q.x, y: q.y - 30 * jump * q.s, s: q.s * CSm, t: lt, who: 'melon', expr: lt >= CUE.poof[2] ? 'shock' : sp ? 'sad' : 'neutral', look: [lookAround + (o.lx || 0), 0], yaw: (o.yaw || 0) + lookAround * .3, headYaw: (o.yaw || 0) + lookAround,
    arms: { l: shrug ? 'shrug' : jump > .2 ? 'flail' : 'rest', r: shrug ? 'shrug' : jump > .2 ? 'flail' : 'rest' }, plant: true, squash: -.04 * jump }), o.extra || {});
}
function strawH(lt, X, Z, o = {}) {
  const q = V2.at(X, Z), sp = speaking('s1', lt);
  return A11.straw({ x: q.x, y: q.y, s: q.s * CSs, t: lt, who: 'straw', expr: sp ? 'neutral' : 'dead', lid: sp ? .38 : .5, look: o.look || [-.8, 0], yaw: o.yaw ?? -.55, headYaw: o.yaw ?? -.55, plant: true, arms: { l: 'rest', r: sp ? 'point' : 'rest' } });
}
function lemonH(lt, X, Z, o = {}) {
  const q = V2.at(X, Z), sp = speaking('l1', lt), one = lt >= W_ONE - .15 && lt < TP.le('l1') + .3;
  return A7.lemon({ x: q.x, y: q.y, s: q.s * CSl, t: lt, who: 'lemon', expr: 'neutral', lid: .48, face: { curve: .02 }, look: o.look || [.7, 0], yaw: o.yaw ?? .45, headYaw: o.yaw ?? .45, plant: true,
    arms: { l: 'rest', r: one ? 'hold' : 'rest' }, hand: { r: one ? 'point' : 'open' }, grip: { r: [96, -60] } });
}
/* the hall shots: where the speakers stand (X, Z) and the 2D framing on top of the perspective (z = zoom; the frame centre follows the speaker's face) */
const HPOS = { melon: [0, 1180], strawA: [-226, 1080], melonA: [204, 1080], strawS: [170, 980], lemonL: [-170, 980] };
const faceH = o => faceC(o);
function camHall(lt, sh) {
  V2.setCam(HALLC);
  const u = c01((lt - sh.s) / Math.max(.1, sh.e - sh.s)), e = easeIO(u);
  let cx = 540, cy = 1000, z = 1;
  if (sh.k === 'melon') { const [fx, fy] = faceH(melonH(lt, ...HPOS.melon)); cx = fx; cy = fy + 70; z = lerp(1.52, 1.6, e); }
  if (sh.k === 'agency') { cx = 540; cy = 1070; z = lerp(1.14, 1.17, e); }
  if (sh.k === 'front') { cx = 540; cy = 1040; z = lerp(1.46, 1.5, e); }
  if (sh.k === 'straw') { const [fx, fy] = faceH(strawH(lt, ...HPOS.strawS)); cx = fx - 110; cy = fy + 70; z = lerp(1.28, 1.34, e); }
  if (sh.k === 'lemon') { const [fx, fy] = faceH(lemonH(lt, ...HPOS.lemonL)); cx = fx + 110; cy = fy + 70; z = lerp(1.28, 1.36, e); }
  zoomTo(cx, cy, z); CAM.x += 1.6 * hnoise(lt, 1.3, 4); CAM.y += 1.2 * hnoise(lt, 1.1, 5);
  if (sh.k === 'agency') CAM.shake = 2.4 * (hitK(lt - CUE.poof[2], .1) + .6 * hitK(lt - CUE.poof[1], .1) + .4 * hitK(lt - CUE.poof[0], .1));
  FR = { sh, C: {} };
}
function drawHallShot(lt) {
  const sh = FR.sh; hallSet(lt);
  const bgSix = o => { REG.suppress++; for (const c of frontSix(lt, o)) if (inFrame(c).inter) drawChar(c); REG.suppress--; };
  if (sh.k === 'melon') drawChar(melonH(lt, ...HPOS.melon));
  if (sh.k === 'agency') {
    drawCrowd(lt); bgSix({}); poofs(lt);
    const s = strawH(lt, ...HPOS.strawA, { look: [.6, -.15], yaw: .6 }), m = melonH(lt, ...HPOS.melonA, { yaw: -.35, lx: -.6 });
    for (const o of [s, m]) if (inFrame(o, 6).whole) drawChar(o);
  }
  if (sh.k === 'front') { drawCrowd(lt); for (const o of frontSix(lt, {})) if (inFrame(o, 6).whole) drawChar(o); }
  if (sh.k === 'straw') { drawCrowd(lt, { yi: 1 }); bgSix({ yaw: .45, look: [.7, 0] }); drawChar(strawH(lt, ...HPOS.strawS, { look: [-.85, -.05], yaw: -.62 })); }
  if (sh.k === 'lemon') { drawCrowd(lt, { yi: 2 }); bgSix({ yaw: -.45, look: [-.6, 0] }); drawChar(lemonH(lt, ...HPOS.lemonL, { look: [.75, -.05], yaw: .55 })); }
}
/* @@TAIL@@ */
})();
