'use strict';
/* SHIFT HAPPENS, Episode 20: "The Snow Day". Builder E20-FORECAST. Scenes `forecast` (2:00 PM, THE FORECAST, 28.8 s) and `dayroom` (8:40 PM, THE DAY ROOM, 20.9 s). Registers window.__EP20_SCENES.forecast / .dayroom.
 *
 * FORECAST: the nurses' station beside the front entrance, drawn as one flat stage (world units, floor line y 1250, the camera is zoomTo on a point or a face). Left to right: a pair of windows onto the
 * blizzard, the wall TV (CHANNEL 12 STORM WATCH, a radar swirl that pulses with the anchor's voice), the staffing board and the Fun Committee poster, a desk with the conference speakerphone and a monitor, the
 * glass sliding front doors with a WELCOME mat and a WET FLOOR sign. Cast (feet on 1250): Mango, Tomato, Strawberry (med cart), Lemon, Onion. The object shots (TV, phone, slide, board) draw the object sharp
 * over a blurred room with the cast left out; every face shot blurs the room and draws only characters that are wholly inside the frame.
 * Shots (scene-local s; a boundary frame is the NEW shot):
 *   open 0-1.60 wide, the TV jingle (0.40), first snow on the sill | w1a 1.60-3.00 the TV push-in, the swirl pulses with "Thirty inches by morning." | w1b 3.00-4.20 reaction two-shot, "Travel is not advised." |
 *   t1 4.20-5.17 Tomato "Snow day!" (popper 4.60) | o1 5.17-7.46 Onion "Per policy, healthcare is essential." (binder up, sniffle 7.27) | l1 7.46-8.21 Lemon "Essential." |
 *   ar1a 8.21-9.90 the speakerphone lights (click 8.21) | ar1b 9.90-11.70 slow push-in on the slide | ar1c 11.70-12.60 Strawberry's blank stare | ar1d 12.60-13.71 Onion crying |
 *   s1 13.71-14.68 Strawberry "Is there hazard pay?" | me1a 14.68-15.35 the phone (click 14.68) | me1b 15.35-16.07 the slide changes to HAZARD PAY (pizza 15.35) | s2 16.07-16.94 Strawberry "Of course." |
 *   m1a 16.94-17.70 Mango | m1b 17.70-18.66 the day shift frozen at the door | l2a 18.66-19.20 Lemon | l2b 19.20-20.55 the board, four red X's | s3 20.55-21.46 Strawberry "Who is working?" |
 *   o2 21.46-22.52 the group: Onion "You are.", the board flips (21.51), every head turns to Strawberry | door 22.52-24.57 Onion pulls the handle (gust 22.82), the wall of snow (dump 23.02) buries her |
 *   o3 24.57-26.20 Onion's head in the snow | t2 26.20-27.37 Tomato "Snow day!" (popper 26.55) | end 27.37-28.82 hold on Onion in her pile and the open door onto white (sting 27.47).
 *
 * DAYROOM: the day room on the generator, a long back wall with a bay of three windows (frost, snow, deep sills), residents in a row facing us (Pear, Banana, Cranberry, Goji) with lap blankets, trays and an LED
 * candle each, Lemon with the clipboard and Mango at the open sill. Lit by L20.pass (warm candle and lamp points, cool window rects).
 * Shots: open 0-2.50 slow wide push-in | pe1 2.50-3.72 | ba1 3.72-4.54 | cr1 4.54-6.92 | go1 6.92-8.56 | l1 8.56-9.59 | m1 9.59-9.94 Mango scoops (cupset 9.94) | go2 9.94-11.66 Goji (slurp 10.10) |
 * cups 11.66-13.71 three quick cups down the row (set 11.86 / 12.56 / 13.16, slurp 12.16 / 12.86) | l2 13.71-15.55 Lemon (tick 15.01) | plow 15.55-17.00 the amber sweep, the room turns (plowdist 15.75) |
 * mo1 17.00-19.10 the Moon behind the weather | end 19.10-20.95 a last wide, the sill deeper (sting 19.20).
 */
(() => {
if (!window.TIMELINE_EP20 || !window.H6 || !window.UI || !window.A7 || !window.A11 || !window.A15 || !window.FX18) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const ei = k => k * k;
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
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
const INKC = 'rgba(25,16,30,.82)';

// ------------------------------------------------------------------ the frozen timeline: beats, words, frame snapping (helpers as in ep18_station.js)
const TLX = window.TIMELINE_EP20;
function tl(id) {
  const SCN = TLX.scenes.find(s => s.id === id), START = SCN.start, LN = {};
  for (const l of TLX.lines) if (l.scene === id) LN[l.id] = l;
  return { SCN, START, LN, bS: b => SCN.beats[b].s, bE: b => SCN.beats[b].e, ls: b => LN[b].s - START, le: b => LN[b].e - START,
    wS: (b, i) => LN[b].s - START + LN[b].words[i][1], wE: (b, i) => LN[b].s - START + LN[b].words[i][2], snapT: t => Math.round((START + t) * 30) / 30 - START };
}
/* the loudness of a recorded line at scene time lt (0..1, from the mouth track the characters use): it drives the pulse of the TV swirl and the speakerphone */
function voice(T0, id, lt) {
  const l = T0.LN[id]; if (!l) return 0;
  const f = (lt - (l.s - T0.START)) * 30; if (f < 0 || f >= l.mouth.length) return 0;
  const i = Math.floor(f), j = Math.min(l.mouth.length - 1, i + 1), u = f - i, dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
  return lerp(dg(i), dg(j), u);
}
const TF = tl('forecast'), TD = tl('dayroom');

// ------------------------------------------------------------------ text: hero only where it is safe (the viewer can read it, it is clear of the frame edge, the caption zone and the clock pill)
let SOFT = 0;                                              /* > 0 while the blurred background is drawn: its text is never hero */
let HEROMODE = false;                                      /* true only while an object shot draws its subject sharp (the TV, the slide, the board): every other piece of set text is dressing */
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
const heroBox = (size, x, y, w, h) => o => o;   /* (kept for symmetry with the other scene files) */

// ------------------------------------------------------------------ the weather kit with stand-ins for what has not landed (checked at DRAW time)
const SNk = () => window.SN20, L2k = () => window.L20;
const hasK = (k, n) => k && typeof k[n] === 'function';
const rn = (s, k) => FX18.rnd(s, k);
function snowStand(c, o) {
  const x0 = o.x0 ?? 0, y0 = o.y0 ?? 0, x1 = o.x1 ?? W, y1 = o.y1 ?? H, w = x1 - x0, h = y1 - y0, t = o.t || 0, seed = o.seed || 1, dn = o.density ?? 1;
  const n = Math.round(150 * dn * Math.max(.05, w * h / (W * H)) * 3) + 12;
  c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip(); c.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const r1 = rn(seed, i * 4), r2 = rn(seed, i * 4 + 1), r3 = rn(seed, i * 4 + 2), r4 = rn(seed, i * 4 + 3), sp = (50 + r3 * 140) * (o.fall ?? 1), sz = (1.6 + r3 * 4.4) * (o.size ?? 1);
    const x = x0 + (((r1 * w + t * ((o.wind || 0) * (.4 + r3) + 16 * Math.sin(t * .9 + r4 * 6))) % w) + w) % w, y = y0 + (((r2 * h + t * sp) % h) + h) % h;
    c.globalAlpha = (o.alpha ?? 1) * (.4 + .5 * r4); c.beginPath(); c.arc(x, y, sz, 0, TAU); c.fill();
  }
  c.restore();
}
function snow(o) { const k = SNk(); if (hasK(k, 'snow')) k.snow(ctx, o); else snowStand(ctx, o); }
function fern(c, x, y, a, len, d, seed) {
  if (d <= 0 || len < 3) return;
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  c.lineWidth = Math.max(.9, d * .85); c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
  for (let i = 1; i <= 3; i++) { const u = i / 4, sd = i % 2 ? 1 : -1; fern(c, x + (x2 - x) * u, y + (y2 - y) * u, a + sd * (.8 + .25 * rn(seed, d * 7 + i)), len * (.46 - .06 * i), d - 1, seed + i); }
  fern(c, x2, y2, a + (rn(seed, d) - .5) * .5, len * .5, d - 1, seed + 9);
}
function frostStand(c, o) {
  const { x, y, w, h } = o, am = c01(o.amount ?? .5), seed = o.seed || 1; if (am < .02) return;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const m = Math.min(w, h) * (.1 + .16 * am);
  for (const [gx0, gy0, gx1, gy1] of [[x, y, x + m, y], [x + w, y, x + w - m, y], [x, y + h, x, y + h - m * 1.6], [x, y, x, y + m]]) { c.fillStyle = lg(gx0, gy0, gx1, gy1, [[0, 'rgba(235,245,255,' + (.5 * am) + ')'], [1, 'rgba(235,245,255,0)']]); c.fillRect(x, y, w, h); }
  c.strokeStyle = 'rgba(240,248,255,' + (.35 + .5 * am) + ')'; c.lineCap = 'round';
  const L = Math.min(w, h) * (.16 + .5 * am);
  [[x, y + h, -.9], [x + w, y + h, -2.2], [x, y, .75], [x + w, y, 2.4], [x + w * .5, y + h, -1.57]].forEach(([fx, fy, a], i) => fern(c, fx, fy, a, L * (i === 4 ? .6 : 1), 3, seed * 7 + i));
  c.restore();
}
function frost(o) { const k = SNk(); if (hasK(k, 'frost')) k.frost(ctx, o); else frostStand(ctx, o); }
function sillStand(c, o) {
  const { x0, x1, y } = o, d = o.depth || 6, seed = o.seed || 1, n = 28; if (d < .8) return;
  c.save(); c.beginPath(); c.moveTo(x0, y + 1);
  for (let i = 0; i <= n; i++) { const u = i / n, p = Math.pow(Math.sin(PI * u), .55) * (.7 + .22 * Math.sin(u * 13 + seed) + .1 * Math.sin(u * 37 + seed * 2)); c.lineTo(x0 + (x1 - x0) * u, y - d * p); }
  c.lineTo(x1, y + 1); c.closePath(); c.fillStyle = lg(0, y - d, 0, y, [[0, '#ffffff'], [.6, '#eef3fb'], [1, '#c5d3ea']]); c.fill(); c.strokeStyle = 'rgba(120,140,180,.35)'; c.lineWidth = 1.6; c.stroke();
  c.fillStyle = 'rgba(120,150,210,.28)'; c.fillRect(x0, y + 1, x1 - x0, 5); c.restore();
}
function sill(o) { const k = SNk(); if (hasK(k, 'sill')) k.sill(ctx, o); else sillStand(ctx, o); }
function breathStand(c, o) {
  const t = o.t || 0, per = o.period || 1.9, dir = o.dir || 1, sz = (o.size || 1) * 26, a0 = o.alpha ?? 1, ph = o.phase || 0;
  c.save();
  for (let i = 0; i < 3; i++) {
    const age = (((t / per + ph + i / 3) % 1) + 1) % 1, r = sz * (.45 + 1.5 * age), px = o.x + dir * (age * 70 + i * 4), py = o.y - age * 26 - 2, al = a0 * Math.sin(PI * Math.min(1, age * 1.15)) * .62;
    if (al < .01) continue;
    c.fillStyle = rg(px, py, r * .1, r, [[0, 'rgba(255,255,255,' + al + ')'], [.7, 'rgba(236,244,255,' + al * .75 + ')'], [1, 'rgba(120,140,176,0)']]); c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(110,130,170,' + al * .4 + ')'; c.lineWidth = 2; c.beginPath(); c.arc(px, py, r * .86, 0, TAU); c.stroke();
  }
  c.restore();
}
function breath(o) { const k = SNk(); if (hasK(k, 'breath')) k.breath(ctx, o); else breathStand(ctx, o); }
function flurryStand(c, o) {
  const age = ((o.t || 0) - (o.t0 || 0)) / (o.life || 1.2); if (age < 0 || age > 1) return;
  const n = o.n || 40, R = o.r || 120; c.save(); c.fillStyle = '#fff';
  for (let i = 0; i < n; i++) { const a = rn(o.seed || 1, i * 3) * TAU, v = (.35 + .65 * rn(o.seed || 1, i * 3 + 1)) * R * 2.2, e = 1 - Math.pow(1 - age, 2.4); c.globalAlpha = (1 - age) * (.5 + .5 * rn(o.seed || 1, i * 3 + 2)); c.beginPath(); c.arc(o.x + Math.cos(a) * v * e, o.y + Math.sin(a) * v * e * .8 + 60 * age * age, 3 + 7 * rn(o.seed || 1, i), 0, TAU); c.fill(); }
  c.restore();
}
function flurry(o) { const k = SNk(); if (hasK(k, 'flurry')) k.flurry(ctx, o); else flurryStand(ctx, o); }
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; if (hasK(window.FX18, 'glow')) FX18.glow(ctx, { x, y, r, color, alpha: a, core: core ?? .5 }); else V2.glow(x, y, r, V2.rgb(color).join(','), Math.min(1, a), 'screen', .3); };
const lightPass = o => { const k = L2k(); return hasK(k, 'pass') ? k.pass(ctx, o) : 0; };

// ------------------------------------------------------------------ held props (prefix fp20f_): drawn around the hand, in the character's own scaled frame
/* the party popper: a striped cone held at the narrow end, mouth up and out. o.popAge < 0 / undefined = not fired; >= 0 = seconds since the pop (the pull ring flies, a puff at the mouth) */
const POP_MOUTH = [0, -92];
EXT.prop.fp20f_popper = (side, o, t) => {
  const ag = o.popAge ?? -1, S = o.popScale || 1.15;
  ctx.save(); ctx.rotate((o.popRot ?? .24) * side); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const pull = ag >= 0 ? ss(ag, 0, .09) : 0, rx = 6 + 16 * pull, ry = 28 + 30 * pull + (ag > .25 ? 10 * Math.sin((ag - .25) * 9) * Math.exp(-(ag - .25) * 3) : 0);
  ctx.strokeStyle = '#e9d27a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(rx * .3, ry * .55, rx, ry); ctx.stroke();
  ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rx + 1, ry + 5, 5, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-11, 6); ctx.lineTo(11, 6); ctx.lineTo(30, -84); ctx.lineTo(-30, -84); ctx.closePath();
  ctx.fillStyle = lg(-30, 0, 30, 0, [[0, '#ff6b9a'], [.55, '#e8346c'], [1, '#a81848']]); ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#ffd23a' : '#4cc9d8'; ctx.beginPath(); ctx.moveTo(-34, -6 - i * 24); ctx.lineTo(34, -26 - i * 24); ctx.lineTo(34, -14 - i * 24); ctx.lineTo(-34, 6 - i * 24); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-11, 6); ctx.lineTo(11, 6); ctx.lineTo(30, -84); ctx.lineTo(-30, -84); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#3a1230'; ctx.beginPath(); ctx.ellipse(0, -84, 30, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 3.4; ctx.stroke();
  if (ag >= 0 && ag < .14) { const k = ag / .14; ctx.fillStyle = 'rgba(255,252,236,' + (.95 * (1 - k)) + ')'; ctx.beginPath(); ctx.arc(0, -90, 22 + 44 * k, 0, TAU); ctx.fill(); }
  ctx.restore();
};
PROP_BOX.fp20f_popper = Object.assign([-36, -112, 66, 18], { nearFace: true, mirror: true });
/* Onion's policy binder: a navy vinyl ring binder; o.binOpen 0..1 swings the cover open to show a page (red header, ruled lines). Held by the bottom edge, shown out to the side. */
EXT.prop.fp20f_binder = (side, o, t) => {
  const op = c01(o.binOpen ?? 0), S = o.binScale || 1, w = 104, h = 136;
  ctx.save(); ctx.rotate((o.binRot ?? -.1) * side); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.translate(-w * .5 * side, 0);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(w * .5, 4, w * .5, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(0, -h, w, 0, [[0, '#35508f'], [1, '#1f3166']]); rr(0, -h, w, h, 7); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.2; ctx.stroke();
  ctx.fillStyle = '#16224a'; rr(0, -h, 14, h, 5); ctx.fill();
  const pw = w * .86, ph = h * .88, px = w * .07 + 6, py = -h + h * .06;
  if (op > .02) {   /* the open page: the cover has swung away to the left */
    ctx.fillStyle = '#fbfaf2'; rr(px, py, pw - 6, ph, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.globalAlpha *= c01(op * 2 - .4);
    ctx.fillStyle = '#c2272d'; ctx.fillRect(px + 6, py + 7, pw - 18, 17);
    TXT('14.9', px + pw / 2 - 3, py + 15.5, { size: 14, font: 'Bangers', weight: 400, fill: '#fff', spacing: 1, hero: false, maxW: pw - 26 });
    ctx.fillStyle = 'rgba(50,50,70,.55)'; for (let i = 0; i < 7; i++) ctx.fillRect(px + 9, py + 34 + i * 13, (pw - 24) * (i === 6 ? .5 : i % 3 === 1 ? .84 : 1), 4.5);
    ctx.beginPath(); ctx.moveTo(px + 12, py + 34 + 3 * 13 + 2); ctx.lineTo(px + pw - 22, py + 34 + 3 * 13 + 2); ctx.lineWidth = 2.4; ctx.strokeStyle = '#c2272d'; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#c9ced6'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(px - 2, py + 22 + i * 38, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 1.8; ctx.stroke(); }
  } else {
    ctx.fillStyle = '#e9ecf2'; rr(w * .16, -h * .66, w * .68, h * .3, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.fillStyle = '#c2272d'; ctx.fillRect(w * .22, -h * .6, w * .56, 6); ctx.fillStyle = 'rgba(40,40,70,.5)'; ctx.fillRect(w * .22, -h * .5, w * .4, 5);
  }
  ctx.restore();
};
PROP_BOX.fp20f_binder = Object.assign([-60, -150, 60, 12], { nearFace: true });
/* Lemon's clipboard (a checklist; o.tick 0..1 draws a tick in the last box), as fp19s_clip of Episode 19 */
EXT.prop.fp20f_clip = (side, o, t) => {
  const S = o.clipScale || 1.5, k = c01(o.tick || 0);
  ctx.save(); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#c4925a'; ctx.strokeStyle = 'rgba(30,16,8,.85)'; ctx.lineWidth = 2.6; rr(-28, -56, 56, 76, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f8f5ea'; ctx.fillRect(-23, -48, 46, 62); ctx.strokeStyle = 'rgba(70,60,40,.45)'; ctx.lineWidth = 1.6; ctx.strokeRect(-23, -48, 46, 62);
  ctx.fillStyle = '#98a2b0'; rr(-12, -62, 24, 12, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,60,40,.4)'; ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const y = -36 + i * 13; ctx.beginPath(); ctx.moveTo(-8, y); ctx.lineTo(18, y); ctx.stroke(); ctx.strokeRect(-19, y - 5, 8, 8); }
  if (k > 0) { ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-18, 12); ctx.lineTo(lerp(-18, -14, c01(k * 2)), lerp(12, 17, c01(k * 2))); if (k > .5) ctx.lineTo(lerp(-14, -5, c01((k - .5) * 2)), lerp(17, 3, c01((k - .5) * 2))); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp20f_clip = Object.assign([-44, -96, 44, 32], { nearFace: true });
/* a paper cup, held by the base: o.cupSnow 0..1 a heap of snow in it, o.cupTip tips it about its middle (PI = upside down), o.cupScale */
function paperCup(S, snowK, tip) {
  ctx.save(); ctx.translate(0, -22 * S); ctx.rotate(tip || 0); ctx.translate(0, 22 * S); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = '#f7f7f1'; ctx.strokeStyle = 'rgba(25,16,30,.88)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-17, -44); ctx.lineTo(17, -44); ctx.lineTo(12, 0); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a8ad8'; ctx.beginPath(); ctx.moveTo(-15.6, -33); ctx.lineTo(15.6, -33); ctx.lineTo(14.2, -22); ctx.lineTo(-14.2, -22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8e2d2'; ctx.beginPath(); ctx.ellipse(0, -44, 17, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (snowK > .02) { const h = 17 * snowK; ctx.fillStyle = lg(0, -44 - h, 0, -42, [[0, '#ffffff'], [1, '#d6e2f6']]); ctx.beginPath(); ctx.moveTo(-15, -43); ctx.bezierCurveTo(-17, -44 - h * .8, -6, -46 - h * 1.15, 1, -44 - h * 1.05); ctx.bezierCurveTo(9, -44 - h * 1.1, 17, -44 - h * .6, 15, -43); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(120,150,200,.6)'; ctx.lineWidth = 1.6; ctx.stroke(); }
  ctx.restore();
}
EXT.prop.fp20f_cup = (side, o, t) => { paperCup(o.cupScale || 1.7, o.cupSnow ?? 0, o.cupTip || 0); };
PROP_BOX.fp20f_cup = Object.assign([-40, -90, 40, 30], { nearFace: true });
/* Mango's tray: a small round tray, three cups with snow in them (o.trayN how many are left, o.traySnow 0..1) */
EXT.prop.fp20f_tray = (side, o, t) => {
  const S = o.trayScale || 1.5, n = o.trayN ?? 3;
  ctx.save(); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 6, 56, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(0, -12, 0, 6, [[0, '#d9dee6'], [1, '#98a2b0']]); ctx.beginPath(); ctx.ellipse(0, -6, 58, 11, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(-30 + i * 30, -4 - (i === 1 ? 5 : 0)); ctx.scale(.62, .62); paperCup(1, o.traySnow ?? 1, 0); ctx.restore(); }
  ctx.restore();
};
PROP_BOX.fp20f_tray = Object.assign([-86, -92, 86, 14], { nearFace: true });
/* a tote bag hanging from the hand (the day shift's bags) */
EXT.prop.fp20f_bag = (side, o, t) => {
  const S = o.bagScale || 1.2, c = o.bagCol || '#3a7a6a';
  ctx.save(); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = shade(c, .7); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, 6); ctx.quadraticCurveTo(0, -22, 14, 6); ctx.stroke();
  ctx.fillStyle = lg(0, 8, 0, 66, [[0, shade(c, 1.15)], [1, shade(c, .8)]]); ctx.beginPath(); ctx.moveTo(-30, 10); ctx.lineTo(30, 10); ctx.lineTo(34, 64); ctx.lineTo(-34, 64); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-26, 22, 52, 7);
  ctx.restore();
};
PROP_BOX.fp20f_bag = Object.assign([-44, -20, 44, 80], { nearFace: false });

// ------------------------------------------------------------------ party confetti and streamers: a pure function of the time since the pop, drawn behind the cast (the first instants in front)
const CONF_COL = ['#ff4d6d', '#ffd23a', '#3ec6e0', '#7ad94a', '#ff8a3a', '#b46cff', '#ffffff'];
function confetti(t, t0, ox, oy, o = {}) {
  const ag = t - t0; if (ag < 0 || ag > 3.2) return;
  const n = o.n ?? 70, sc = o.s ?? 1, seed = o.seed ?? 3, dir = o.dir ?? -1.1, spread = o.spread ?? 1.1, sp0 = o.speed ?? 700, part = o.part || 'all';
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = dir + (rn(seed, i * 5) - .5) * spread, v = sp0 * (.35 + .75 * rn(seed, i * 5 + 1)) * sc, kd = 1.7 + 1.5 * rn(seed, i * 5 + 2), life = 1.9 + 1.2 * rn(seed, i * 5 + 3);
    if (ag > life) continue;
    if (part === 'front' && ag > .26) continue; if (part === 'back' && ag <= .26) continue;
    const e = (1 - Math.exp(-kd * ag)) / kd, wob = Math.sin(ag * (5 + 5 * rn(seed, i * 5 + 4)) + i) * 10 * sc * Math.min(1, ag * 2);
    const x = ox + Math.cos(a) * v * e + wob, y = oy + Math.sin(a) * v * e + 330 * sc * ag * ag * .55 + 40 * sc * ag;
    const rot = ag * (4 + 8 * rn(seed, i * 5 + 4)) + i, fl = Math.cos(rot * 1.3), al = ag > life - .5 ? (life - ag) / .5 : 1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .25 + .75 * Math.abs(fl)); ctx.globalAlpha = al * .95; ctx.fillStyle = CONF_COL[i % CONF_COL.length];
    ctx.fillRect(-6 * sc, -3.5 * sc, 12 * sc, 7 * sc); ctx.restore();
  }
  for (let i = 0; i < 7; i++) {   /* streamers: a ribbon that trails the path of its head */
    const a = dir + (rn(seed + 9, i) - .5) * spread * 1.2, v = sp0 * (.7 + .5 * rn(seed + 9, i + 20)) * sc, kd = 1.5 + .5 * rn(seed + 9, i + 40);
    ctx.strokeStyle = CONF_COL[(i * 2) % 6]; ctx.lineWidth = 5.5 * sc; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = c01((3.0 - ag) / .6);
    ctx.beginPath();
    for (let j = 0; j <= 14; j++) {
      const tt = ag - j * .028; if (tt < 0) break;
      const e = (1 - Math.exp(-kd * tt)) / kd, px = ox + Math.cos(a) * v * e + Math.sin(j * .9 + i * 2 + ag * 3) * 9 * sc, py = oy + Math.sin(a) * v * e + 300 * sc * tt * tt * .6;
      j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ====================================================================================================================================================================================
// FORECAST: the set. World units; the floor line is y 1250; the stage runs from x -300 to 1800 (the wall and the floor are drawn far past the frame).
// ====================================================================================================================================================================================
const FL = 1250;
const FWIN = { x0: 12, x1: 340, y0: 408, y1: 892 };                              /* the pair of windows: the outer frame */
const FTV = { cx: 545, cy: 515, w: 372, h: 226 };                                /* the wall TV: the black bezel; the screen is inset 16 px */
const FBOARD = { x: 782, y: 548, w: 216, h: 372 };                               /* the staffing board (top-left corner) */
const FPOSTER = { x: 792, y: 352, w: 196, h: 150 };
const FDESK = { x0: 410, x1: 880, top: 1085 };
const FPHONE = { x: 508, y: 1076 }, FMON = { x: 705, y: 1074, w: 214, h: 140 };    /* the monitor: x = centre, y = the desk top under its foot; the screen is w x h */
const FDOOR = { x0: 1110, x1: 1400, y0: 640, y1: 1250, mx: 1255 };               /* the doorway: two sliding leaves meeting at mx */
const FSTAND = { mango: [610, 1250], tom: [400, 1252], straw: [140, 1250], lemon: [810, 1250], onion: [1000, 1252] };   /* where everybody stands (Strawberry at her cart, far left) */
const FSC = { mango: .88, tom: .96, straw: .82, lemon: .88, onion: .8 };           /* a character's scale: about 320 px tall */
const GUSTS_F = [[22.817, 1.5, .8]];
function fstate(lt) {
  return { blue: .5 * ss(lt, 0, 28), sillD: 3 + 12 * ss(lt, .4, 28), frostA: .12 + .3 * ss(lt, 2, 28), drift: .16 + .2 * ss(lt, 0, 18) + .63 * ss(lt, 18, 22.6) };
}
const poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } };

function fWall(lt, st) {
  const b = st.blue, top = mixc('#e6dfd0', '#c5d0e2', b), bot = mixc('#d6cdb9', '#aebbd2', b), wain = mixc('#6d8c88', '#4f6f78', b);
  ctx.fillStyle = lg(0, -400, 0, FL, [[0, mixc('#f0ede6', '#cfd8e8', b)], [.3, top], [1, bot]]); ctx.fillRect(-1600, -600, 4400, FL + 600);
  ctx.fillStyle = lg(0, 1010, 0, FL, [[0, wain], [1, shade(wain, .86)]]); ctx.fillRect(-1600, 1010, 4400, FL - 1010);          /* the wainscot */
  ctx.fillStyle = mixc('#f4f0e4', '#d6dded', b); ctx.fillRect(-1600, 1002, 4400, 12); ctx.fillStyle = 'rgba(30,20,30,.28)'; ctx.fillRect(-1600, 1014, 4400, 4);   /* the chair rail */
  ctx.fillStyle = mixc('#efe9dc', '#cdd5e4', b); ctx.fillRect(-1600, FL - 26, 4400, 26); ctx.fillStyle = 'rgba(30,20,30,.3)'; ctx.fillRect(-1600, FL - 26, 4400, 3);   /* the skirting */
  ctx.strokeStyle = 'rgba(60,44,40,.10)'; ctx.lineWidth = 2; for (let x = -1400; x < 2800; x += 220) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 1000); ctx.stroke(); }   /* faint panel seams */
  ctx.fillStyle = mixc('#cfc8ba', '#a9b6cb', b); ctx.fillRect(-1600, -600, 4400, 930);                                             /* the ceiling band */
  ctx.fillStyle = 'rgba(40,30,40,.18)'; ctx.fillRect(-1600, 326, 4400, 6);
  /* the ceiling in perspective: tile lines fan out from the wall top toward the camera, light panels between them */
  const VX = 660, VY = 980, sc = y => (VY - y) / (VY - 326), px = (x, y) => VX + (x - VX) * sc(y);
  ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 3;
  for (let x = -2000; x <= 3400; x += 200) { ctx.beginPath(); ctx.moveTo(x, 326); ctx.lineTo(px(x, -700), -700); ctx.stroke(); }
  for (let j = 1; j <= 9; j++) { const y = 326 - 38 * j * (1 + j * .2); ctx.beginPath(); ctx.moveTo(-2400, y); ctx.lineTo(3600, y); ctx.stroke(); }
  for (const lx of [-40, 460, 960, 1460]) for (const [ya, yb] of [[250, 288], [96, 168]]) {
    poly([[px(lx - 90, yb), yb], [px(lx + 90, yb), yb], [px(lx + 90, ya), ya], [px(lx - 90, ya), ya]], 'rgba(255,255,246,.92)', INKC, 2.4);
    glow(lx, yb + 24, 280, '255,248,225', ya > 200 ? .2 : .1, .1);
  }
}
function fFloor(lt, st) {
  const b = st.blue, a = mixc('#cdc6b8', '#aab6c8', b), c = mixc('#b8b0a0', '#97a4b8', b);
  ctx.fillStyle = lg(0, FL, 0, 2400, [[0, a], [1, c]]); ctx.fillRect(-1600, FL, 4400, 1300);
  ctx.strokeStyle = 'rgba(60,46,50,.16)'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 9; i++) { const y = FL + 10 + Math.pow(i / 8, 1.7) * 900; ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(2800, y); ctx.stroke(); }
  for (let x = -2400; x <= 3600; x += 190) { ctx.beginPath(); ctx.moveTo(x * .42 + 380, FL); ctx.lineTo(x * 1.55 - 120, 2300); ctx.stroke(); }
  ctx.fillStyle = lg(0, FL, 0, FL + 70, [[0, 'rgba(30,20,30,.2)'], [1, 'rgba(30,20,30,0)']]); ctx.fillRect(-1600, FL, 4400, 70);
}
/* the window pair: sky, drift of snow outside the glass, falling snow, frost at the edges, the sill */
function fWindows(lt, st) {
  const w = FWIN, panes = [[w.x0 + 14, w.x1 - 14 - 148 - 8], [w.x0 + 14 + 148 + 8 + 8, w.x1 - 14]].map(([a, b]) => [a, b]);
  ctx.fillStyle = mixc('#ffffff', '#dde4ee', st.blue); ctx.strokeStyle = INKC; ctx.lineWidth = 3.4; rr(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0, 8); ctx.fill(); ctx.stroke();
  const gl = [[w.x0 + 14, w.y0 + 14, 148, w.y1 - w.y0 - 28], [w.x0 + 14 + 148 + 8 + 8, w.y0 + 14, 148, w.y1 - w.y0 - 28]];
  gl.forEach(([x, y, ww, hh], i) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, ww, hh); ctx.clip();
    ctx.fillStyle = lg(0, y, 0, y + hh, [[0, mixc('#9aa7bd', '#6a7893', st.blue)], [.6, mixc('#c4ccd9', '#939fb5', st.blue)], [1, mixc('#e8ecf3', '#b8c2d3', st.blue)]]); ctx.fillRect(x, y, ww, hh);
    ctx.fillStyle = 'rgba(120,132,156,.28)';                                                                            /* the lot and the trees, hardly there */
    for (const [tx, ty, tw, th] of [[.1, .62, .34, .2], [.5, .58, .36, .24], [.82, .66, .3, .16]]) { ctx.beginPath(); ctx.ellipse(x + ww * (tx + tw / 2), y + hh * (ty + th), ww * tw * .6, hh * th, 0, PI, 0); ctx.fill(); }
    sill({ x0: x - 4, x1: x + ww + 4, y: y + hh - 2, depth: 3 + st.sillD * 1.1, seed: 4 + i, tone: 'light' });
    snow({ x0: x, y0: y, x1: x + ww, y1: y + hh, t: lt, seed: 21 + i * 3, layers: 3, density: 16, wind: -70, gusts: GUSTS_F, tone: 'light', fore: false });
    frost({ x, y, w: ww, h: hh, amount: st.frostA, seed: 5 + i, t: lt, tone: 'light' });
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(x + ww * .15, y); ctx.lineTo(x + ww * .5, y); ctx.lineTo(x + ww * .1, y + hh * .5); ctx.lineTo(x, y + hh * .5); ctx.closePath(); ctx.fill();   /* the reflection */
    ctx.restore();
    ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(x, y, ww, hh);
  });
  ctx.fillStyle = mixc('#fbfaf4', '#d5ddeb', st.blue); rr(w.x0 - 12, w.y1 - 2, w.x1 - w.x0 + 24, 18, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();   /* the sill */
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(w.x0 - 6, w.y1 + 16, w.x1 - w.x0 + 12, 8);
}
// ------------------------------------------------------------------ the wall TV: CHANNEL 12 STORM WATCH, a map of Long Island, a radar swirl that pulses with the anchor, a ticker
const TV_IN = { w: 340, h: 205 };
function tvSwirl(cx, cy, R, rot, pulse) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1 + .07 * pulse, 1 + .07 * pulse); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  ctx.fillStyle = rg(0, 0, 4, R * 1.15, [[0, 'rgba(210,170,255,' + (.5 + .35 * pulse) + ')'], [.5, 'rgba(130,60,230,.25)'], [1, 'rgba(110,40,220,0)']]); ctx.beginPath(); ctx.arc(0, 0, R * 1.15, 0, TAU); ctx.fill();
  for (let arm = 0; arm < 3; arm++) {
    for (const [wk, col, al] of [[2.3, '150,70,255', .3], [1, '238,226,255', .72]]) {
      ctx.strokeStyle = 'rgba(' + col + ',' + al + ')';
      let prev = null;
      for (let r = 6; r <= R; r += 3.5) {
        const a = rot + arm * TAU / 3 + r * .058, x = Math.cos(a) * r, y = Math.sin(a) * r * .92;
        if (prev) { ctx.lineWidth = Math.max(1.4, (13 * (1 - r / (R * 1.12)) + 2.5) * wk); ctx.globalAlpha = c01(1.1 - r / (R * 1.1)) * .9 + .1; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y); ctx.stroke(); }
        prev = [x, y];
      }
    }
  }
  ctx.globalAlpha = 1; ctx.fillStyle = rg(0, 0, 1, 15, [[0, 'rgba(255,255,255,1)'], [.55, 'rgba(230,205,255,.9)'], [1, 'rgba(160,90,255,0)']]); ctx.beginPath(); ctx.arc(0, 0, 15 + 4 * pulse, 0, TAU); ctx.fill();
  ctx.restore();
}
const LI_PATH = (c) => { c.moveTo(-118, 20); c.bezierCurveTo(-96, -2, -64, -12, -30, -12); c.bezierCurveTo(8, -12, 40, -26, 82, -34); c.bezierCurveTo(112, -40, 132, -34, 150, -24); c.lineTo(122, -20); c.bezierCurveTo(112, -14, 104, -6, 98, 0); c.bezierCurveTo(116, -2, 138, 2, 156, 8); c.lineTo(126, 12); c.bezierCurveTo(98, 14, 66, 6, 40, 12); c.bezierCurveTo(8, 20, -30, 22, -64, 26); c.bezierCurveTo(-86, 28, -104, 30, -118, 20); c.closePath(); };
function tvScreen(lt) {
  const w = TV_IN.w, h = TV_IN.h, V = voice(TF, 'w1', lt), pop = ss(lt, .4, .62), tag = ss(lt, .4, .75);
  ctx.save(); rr(0, 0, w, h, 10); ctx.clip();
  ctx.fillStyle = lg(0, 0, 0, h, [[0, '#0d2a63'], [1, '#1a4a9c']]); ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(150,190,255,.14)'; ctx.lineWidth = 1.4; for (let r = 40; r <= 160; r += 40) { ctx.beginPath(); ctx.arc(w * .56, h * .5, r, 0, TAU); ctx.stroke(); }
  ctx.save(); ctx.translate(w * .5, h * .56); ctx.beginPath(); LI_PATH(ctx); ctx.fillStyle = '#3c6f5c'; ctx.fill(); ctx.strokeStyle = 'rgba(200,236,220,.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  tvSwirl(w * .54, h * .5, 80, lt * (.34 + .5 * V) + pop * 1.6, V);
  ctx.fillStyle = lg(0, h - 52, 0, h, [[0, 'rgba(8,16,40,0)'], [1, 'rgba(8,16,40,.6)']]); ctx.fillRect(0, h - 52, w, 52);
  if (pop < 1) { ctx.fillStyle = 'rgba(255,255,255,' + (.55 * (1 - pop) * ss(lt, .38, .42)) + ')'; ctx.fillRect(0, 0, w, h); }
  /* the lower third: CHANNEL 12 and STORM WATCH, then the ticker */
  const slide = eo(tag), nm = 'CHANNEL 12', sw = 'STORM WATCH';
  UI.pill(nm, 12 + 62 - 90 * (1 - slide), 20, { size: 15, fill: '#ffffff', ink: '#17408c', anchor: 'left', padX: 9, h: 22, hero: heroOK(15, 12 + 62, 20, 124, 24), crop: false });
  UI.pill(sw, 12 + 70 - 100 * (1 - slide), 46, { size: 17, fill: '#d92a3a', ink: '#ffffff', anchor: 'left', padX: 10, h: 26, hero: heroOK(17, 12 + 70, 46, 140, 28), crop: false });
  TXT('LIVE  2:00 PM', w - 10, 18, { size: 13, fill: '#e8f0ff', align: 'right', weight: 800, spacing: .6, hero: false });
  TXT('LONG ISLAND', 28, h - 64, { size: 12, fill: '#bfe4d3', align: 'left', weight: 900, spacing: 1, hero: false });
  ctx.fillStyle = '#f4f7ff'; rr(8, h - 36, w - 16, 28, 6); ctx.fill(); ctx.fillStyle = '#d92a3a'; rr(8, h - 36, 54, 28, 6); ctx.fill();
  UI.container('tvtick', 'sign', [8, h - 36, w - 8, h - 8], 3);
  TXT('ALERT', 35, h - 22, { size: 12, fill: '#fff', weight: 900, spacing: .6, cid: 'tvtick', hero: false, maxW: 44 });
  const msgs = lt < 1.6 ? ['WINTER STORM WARNING IN EFFECT', 1] : lt < 2.9 ? ['THIRTY INCHES BY MORNING', sg(lt, 1.6, 2.6)] : ['TRAVEL IS NOT ADVISED', sg(lt, 2.9, 3.7)];
  if (msgs[1] > .02) TXT(msgs[0], 72, h - 22, { size: 14, fill: '#10224f', align: 'left', weight: 900, cid: 'tvtick', reveal: msgs[1], maxW: w - 90, spacing: .2 });
  ctx.restore();
}
function fTV(lt, st) {
  const t = FTV, x0 = t.cx - t.w / 2, y0 = t.cy - t.h / 2;
  ctx.fillStyle = 'rgba(30,20,30,.2)'; rr(x0 + 8, y0 + 14, t.w, t.h, 14); ctx.fill();
  ctx.fillStyle = '#15161c'; rr(x0, y0, t.w, t.h, 14); ctx.fill(); ctx.strokeStyle = '#8f96a6'; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.translate(x0 + (t.w - TV_IN.w) / 2, y0 + (t.h - TV_IN.h) / 2 - 2); tvScreen(lt); ctx.restore();
  ctx.fillStyle = '#35ff8a'; ctx.beginPath(); ctx.arc(t.cx + t.w / 2 - 22, y0 + t.h - 7, 2.6, 0, TAU); ctx.fill();
  glow(t.cx, t.cy, 360, '120,160,255', .22 * ss(lt, .3, .6), .1);
}
function fPoster(lt, st) {
  const p = FPOSTER, fl = SNk() && hasK(SNk(), 'GUST') ? SNk().GUST(lt, GUSTS_F) : 0;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-.05 * fl * Math.sin(lt * 14)); ctx.translate(-p.x, -p.y);
  ctx.fillStyle = 'rgba(30,20,30,.18)'; rr(p.x + 6, p.y + 8, p.w, p.h, 6); ctx.fill();
  ctx.fillStyle = lg(0, p.y, 0, p.y + p.h, [[0, '#cfe7ff'], [1, '#f3f9ff']]); rr(p.x, p.y, p.w, p.h, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  UI.container('poster', 'sign', [p.x, p.y, p.x + p.w, p.y + p.h], 3);
  TXT('FUN COMMITTEE', p.x + p.w / 2, p.y + 18, { size: 14, fill: '#6a3fb0', weight: 900, spacing: 1.4, cid: 'poster', maxW: p.w - 24 });
  TXT('SNOW DAY', p.x + p.w / 2 + 28, p.y + 50, { size: 36, font: 'Bangers', weight: 400, fill: '#d92a3a', stroke: '#ffffff', lw: 6, spacing: 1, cid: 'poster', maxW: 124 });
  TXT('SOCIAL!', p.x + p.w / 2 + 28, p.y + 84, { size: 36, font: 'Bangers', weight: 400, fill: '#d92a3a', stroke: '#ffffff', lw: 6, spacing: 1, cid: 'poster', maxW: 124 });
  TXT('HOT COCOA  3 PM  MANDATORY FUN', p.x + p.w / 2, p.y + p.h - 12, { size: 10, fill: '#3a4a7a', weight: 900, spacing: .5, cid: 'poster', maxW: p.w - 20, hero: false });
  /* a snowman in a party hat */
  const sx = p.x + 46, sy = p.y + 112;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(70,90,130,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(sx, sy, 17, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(sx, sy - 27, 12, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff5aa5'; ctx.beginPath(); ctx.moveTo(sx - 9, sy - 36); ctx.lineTo(sx + 9, sy - 36); ctx.lineTo(sx + 1, sy - 62); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#222'; ctx.fillRect(sx - 5, sy - 30, 3, 3); ctx.fillRect(sx + 3, sy - 30, 3, 3); ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(sx, sy - 26); ctx.lineTo(sx + 11, sy - 24); ctx.lineTo(sx, sy - 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d92a3a'; ctx.beginPath(); ctx.arc(p.x + 12, p.y + 12, 4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(p.x + p.w - 12, p.y + 12, 4, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ the cues and word times of the scene (snapped to the frame the picture will hit)
const FC = { tvjingle: .4, popper: 4.597, sniffle: 7.269, click1: 8.208, click2: 14.68, boardflip: 21.514, doorgust: 22.817, snowdump: 23.017, popper2: 26.551, sting: 27.473 };
for (const k in FC) FC[k] = TF.snapT(FC[k]);
const XT = [19.45, 19.7, 19.95, 20.2].map(TF.snapT);                       /* the four red X's on the NIGHT SHIFT names */
const T_PIZZA = TF.snapT(TF.wS('me1', 2)), T_W1 = TF.snapT(TF.wS('ar1', 9)), T_W2 = TF.snapT(TF.wS('ar1', 10)), T_W3 = TF.snapT(TF.wS('ar1', 11));

// ------------------------------------------------------------------ the staffing board: a pivoting whiteboard (DAY SHIFT / NIGHT SHIFT with names; the back says NURSES ON DUTY 1, RESIDENTS 40)
const DAYN = ['LEMON', 'STRAWBERRY', 'MANGO', 'CARROT', 'LIME', 'CHERRY'], NIGHTN = ['EGGPLANT RN', 'DRAGON CNA', 'APPLE CNA', 'KIWI LPN'];
function strawIcon(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
  ctx.fillStyle = '#e8193a'; ctx.strokeStyle = 'rgba(60,10,20,.85)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, r); ctx.bezierCurveTo(-r * 1.1, r * .55, -r * 1.1, -r * .5, -r * .45, -r * .72); ctx.lineTo(r * .45, -r * .72); ctx.bezierCurveTo(r * 1.1, -r * .5, r * 1.1, r * .55, 0, r); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3aa64a'; ctx.beginPath(); ctx.moveTo(-r * .6, -r * .7); ctx.lineTo(-r * .2, -r * 1.05); ctx.lineTo(0, -r * .78); ctx.lineTo(r * .2, -r * 1.05); ctx.lineTo(r * .6, -r * .7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe3a0'; for (const [dx, dy] of [[-.4, -.1], [.1, .1], [.42, -.15], [-.1, .5], [.3, .52]]) { ctx.beginPath(); ctx.arc(dx * r, dy * r, r * .07, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function boardFace(lt, side, st, xs) {
  const B = FBOARD, w = B.w, h = B.h;
  ctx.fillStyle = lg(0, 0, w, h, [[0, '#fbfdff'], [1, '#e9eff7']]); rr(8, 8, w - 16, h - 34, 4); ctx.fill();
  if (side === 0) {
    UI.container('board', 'sign', [8, 8, w - 8, h - 26], 3);
    TXT('STAFFING', w / 2, 34, { size: 32, font: 'Bangers', weight: 400, fill: '#1c3b7a', spacing: 2, cid: 'board', maxW: w - 40 });
    TXT('TODAY  2:00 PM', w / 2, 58, { size: 13, fill: '#6a7898', weight: 900, spacing: 1.2, cid: 'board', hero: false });
    UI.panel([18, 72, w - 36, 28], { fill: '#2f6fc4', r: 8, id: 'bdA', pad: 4 }); TXT('DAY SHIFT: 6', w / 2, 86, { size: 19, fill: '#fff', cid: 'bdA', center: true, maxW: w - 56 });
    DAYN.forEach((n, i) => TXT(n, 24 + (i % 2) * 84, 118 + Math.floor(i / 2) * 20, { size: 13, fill: '#243b73', italic: true, weight: 800, align: 'left', cid: 'board', maxW: 82 }));
    UI.panel([18, 190, w - 36, 28], { fill: '#7a3fb8', r: 8, id: 'bdB', pad: 4 }); TXT('NIGHT SHIFT: 4', w / 2, 204, { size: 19, fill: '#fff', cid: 'bdB', center: true, maxW: w - 56 });
    NIGHTN.forEach((n, i) => {
      const cy = 240 + i * 27, k = c01((lt - XT[i]) / .26);
      TXT(n, 26, cy, { size: 18, fill: '#243b73', italic: true, weight: 800, align: 'left', cid: 'board', maxW: 118, k, line: '#d4202c', thickness: 3.6, lineAlpha: .95 });
      if (k > 0) {
        const a = c01(k * 2), b = c01(k * 2 - 1), x0 = w - 60, x1 = w - 32, y0 = cy - 11, y1 = cy + 11;
        ctx.save(); ctx.strokeStyle = '#d4202c'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, a), lerp(y0, y1, a)); ctx.stroke();
        if (b > 0) { ctx.beginPath(); ctx.moveTo(x1, y0 + 1); ctx.lineTo(lerp(x1, x0, b), lerp(y0 + 1, y1 - 1, b)); ctx.stroke(); }
        ctx.restore();
      }
    });
  } else {
    UI.container('boardb', 'sign', [8, 8, w - 8, h - 26], 3);
    TXT('NURSES ON DUTY', w / 2, 34, { size: 22, fill: '#1c3b7a', weight: 900, spacing: 1, cid: 'boardb', maxW: w - 40 });
    TXT('1', w / 2 - 14, 112, { size: 118, font: 'Bangers', weight: 400, fill: '#d4202c', stroke: '#ffffff', lw: 6, cid: 'boardb' });
    strawIcon(w / 2 + 52, 118, 24);
    ctx.fillStyle = '#c3cde0'; ctx.fillRect(28, 178, w - 56, 3);
    TXT('RESIDENTS', w / 2, 206, { size: 22, fill: '#1c3b7a', weight: 900, spacing: 1, cid: 'boardb', maxW: w - 40 });
    TXT('40', w / 2, 280, { size: 112, font: 'Bangers', weight: 400, fill: '#1c3b7a', stroke: '#ffffff', lw: 6, cid: 'boardb', maxW: w - 60 });
  }
}
function fBoard(lt, st) {
  const B = FBOARD, fk = sg(lt, FC.boardflip, FC.boardflip + .28), sx = Math.abs(Math.cos(fk * PI)), side = fk < .5 ? 0 : 1;
  ctx.save(); ctx.translate(B.x + B.w / 2, 0); ctx.scale(Math.max(.04, sx), 1); ctx.translate(-(B.x + B.w / 2), 0); ctx.translate(B.x, B.y);
  ctx.fillStyle = 'rgba(30,20,30,.2)'; rr(7, 10, B.w, B.h, 8); ctx.fill();
  ctx.fillStyle = lg(0, 0, B.w, 0, [[0, '#cfd6e2'], [.5, '#f0f3f8'], [1, '#aab4c6']]); rr(0, 0, B.w, B.h, 8); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.2; ctx.stroke();
  if (fk > .1 && fk < .9) { ctx.fillStyle = '#f4f8fd'; rr(8, 8, B.w - 16, B.h - 34, 4); ctx.fill(); } else boardFace(lt, side, st);
  ctx.fillStyle = '#9aa4b8'; rr(14, B.h - 24, B.w - 28, 14, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
  for (const [mx, col] of [[40, '#d4202c'], [66, '#1c3b7a'], [92, '#111']]) { ctx.fillStyle = col; rr(mx, B.h - 28, 22, 8, 3); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#7a8396'; for (const yy of [B.y - 5, B.y + B.h + 5]) { ctx.beginPath(); ctx.arc(B.x + B.w / 2, yy, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke(); }
}
// ------------------------------------------------------------------ the desk, the speakerphone (a three-lobed star), the monitor and the slides
function fDesk(lt, st) {
  const D = FDESK, w = D.x1 - D.x0, b = st.blue;
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.fillRect(D.x0 - 6, D.top + 14, w + 12, FL - D.top - 8);
  ctx.fillStyle = lg(0, D.top, 0, FL, [[0, mixc('#c49a68', '#aaa5a8', b * .6)], [1, mixc('#8a6a44', '#716a6c', b * .6)]]); ctx.fillRect(D.x0, D.top + 12, w, FL - D.top - 12); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(D.x0, D.top + 12, w, FL - D.top - 12);
  ctx.strokeStyle = 'rgba(40,24,20,.5)'; ctx.lineWidth = 2.4; for (const dx of [D.x0 + w / 3, D.x0 + 2 * w / 3]) { ctx.beginPath(); ctx.moveTo(dx, D.top + 14); ctx.lineTo(dx, FL - 4); ctx.stroke(); }
  ctx.fillStyle = '#6a4c30'; for (const dx of [D.x0 + w / 6, D.x0 + w / 2, D.x0 + 5 * w / 6]) { rr(dx - 22, D.top + 50, 44, 8, 4); ctx.fill(); }
  ctx.fillStyle = lg(0, D.top - 2, 0, D.top + 14, [[0, '#e8caa0'], [1, '#c49a68']]); rr(D.x0 - 8, D.top - 2, w + 16, 16, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();   /* the top */
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; for (let i = 0; i < 3; i++) { rr(780 + i * 2, D.top - 9 - i * 4, 70, 8, 2); ctx.fill(); ctx.stroke(); }   /* a stack of papers */
  ctx.fillStyle = '#e8eef6'; rr(760, D.top - 40, 22, 30, 4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#d4202c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(766, D.top - 40); ctx.lineTo(764, D.top - 54); ctx.moveTo(772, D.top - 40); ctx.lineTo(776, D.top - 56); ctx.stroke();   /* a cup of pens */
}
function fPhone(lt, st, lvl) {
  const P = FPHONE, on = ss(lt, FC.click1, FC.click1 + .05), pulse = Math.max(voice(TF, 'ar1', lt), voice(TF, 'me1', lt)), lit = on * (.42 + .58 * pulse) * (lvl ?? 1), R = 76;
  ctx.save(); ctx.translate(P.x, P.y);
  ctx.fillStyle = 'rgba(20,14,24,.3)'; ctx.beginPath(); ctx.ellipse(4, 12, R * 1.12, R * .5, 0, 0, TAU); ctx.fill();
  const star = (dy, fill, outline) => {
    ctx.save(); ctx.translate(0, dy); ctx.scale(1, .5); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const a of [-PI / 2, PI / 6, 5 * PI / 6]) { ctx.strokeStyle = outline; ctx.lineWidth = 50; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke(); }
    for (const a of [-PI / 2, PI / 6, 5 * PI / 6]) { ctx.strokeStyle = fill; ctx.lineWidth = 43; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke(); }
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
    ctx.restore();
  };
  star(15, '#14171d', '#0a0c10'); star(0, '#2f343e', '#101318');
  ctx.save(); ctx.scale(1, .5); ctx.lineCap = 'round';
  for (const a of [-PI / 2, PI / 6, 5 * PI / 6]) {            /* the speaker grille dots and the light bar at the tip of each lobe */
    ctx.fillStyle = 'rgba(8,10,14,.65)'; for (let i = 0; i < 6; i++) for (let j = -1; j <= 1; j++) { const r = 34 + i * 6, px = Math.cos(a) * r - Math.sin(a) * j * 9, py = Math.sin(a) * r + Math.cos(a) * j * 9; ctx.beginPath(); ctx.arc(px, py, 1.8, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(' + V2.mix('40,70,76', '60,255,226', lit).map(v => v | 0).join(',') + ',1)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, R + 8, a - .3, a + .3); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(' + V2.mix('40,70,76', '60,255,226', lit).map(v => v | 0).join(',') + ',1)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#1a1d24'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(' + V2.mix('90,100,110', '80,255,230', lit).map(v => v | 0).join(',') + ',1)'; ctx.beginPath(); ctx.ellipse(0, -1, 5.5, 3, 0, 0, TAU); ctx.fill();
  ctx.restore();
  if (lit > .02) { glow(P.x, P.y - 6, 120 + 90 * pulse, '40,240,215', .5 * lit, .4); }
  const ck = lt - FC.click1, ck2 = lt - FC.click2;                                                                                    /* the click of the connect button: a quick ring */
  for (const k of [ck, ck2]) if (k >= 0 && k < .5) V2.ring(P.x, P.y - 6, k / .5, { r0: 30, r1: 150, color: '80,255,230', lw: 5, alpha: .55, squash: .5, bloom: 0 });
}
function pizzaArt(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
  ctx.fillStyle = '#d9a35a'; ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f6c744'; ctx.beginPath(); ctx.arc(0, 0, r * .84, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d6302a'; for (const [a, d] of [[.3, .5], [1.5, .55], [2.6, .5], [3.7, .58], [4.8, .5], [5.7, .56], [0, 0]]) { ctx.beginPath(); ctx.arc(Math.cos(a) * r * d, Math.sin(a) * r * d, r * .13, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#e8f2f8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 1.02, -.28, .28); ctx.closePath(); ctx.fill();                 /* the slice that is gone */
  ctx.restore();
}
function starArt(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr2 = i % 2 ? r * .46 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  ctx.closePath(); ctx.fillStyle = lg(0, -r, 0, r, [[0, '#ffe36a'], [1, '#e8a417']]); ctx.fill(); ctx.strokeStyle = '#8a5a08'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-r * .22, -r * .25, r * .14, 0, TAU); ctx.fill();
  ctx.restore();
}
function flakeArt(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#2f7bd0'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { ctx.rotate(PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.moveTo(0, -r * .55); ctx.lineTo(r * .26, -r * .8); ctx.moveTo(0, -r * .55); ctx.lineTo(-r * .26, -r * .8); ctx.stroke(); }
  ctx.restore();
}
function slideDraw(lt) {
  const w = 214, h = 140, ch = ss(lt, T_PIZZA, T_PIZZA + .18);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  ctx.fillStyle = '#f9fbfd'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1f9d8a'; ctx.fillRect(0, 0, 12, h); ctx.fillStyle = '#e8f1f5'; ctx.fillRect(12, 0, w - 12, 30);
  ctx.fillStyle = '#2f9a4a'; ctx.beginPath(); ctx.ellipse(32, 15, 10, 5.5, -.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(40, 15, 10, 5.5, .6, 0, TAU); ctx.fill();
  TXT('GREENLEAF  Q4 UPDATE', 54, 15, { size: 9, fill: '#3a5a6a', align: 'left', weight: 900, spacing: .8, hero: false });
  flakeArt(190, 100, 15);
  UI.container('slide1', 'sign', [14, 32, w - 4, h - 8], 3);
  const ws = [['WEATHER-RELATED', T_W1, 17, 54], ['PRODUCTIVITY', T_W2, 23, 80], ['OPPORTUNITY', T_W3, 23, 106]];
  if (ch < 1) for (const [s, t0, sz, yy] of ws) { const k = ss(lt, t0 - .02, t0 + .16); if (k > .02) TXT(s, 24, yy, { size: sz, fill: '#16336b', align: 'left', weight: 900, cid: 'slide1', maxW: w - 34, alpha: k, spacing: .3, hero: ch > 0 ? false : undefined }); }
  TXT('(SYNERGY ALIGNED)', w - 12, h - 8, { size: 7.5, fill: '#7a8aa0', align: 'right', weight: 800, hero: false });
  if (ch > 0) {   /* slide two: HAZARD PAY, a pizza and a gold star */
    ctx.save(); ctx.translate((1 - eo(ch)) * w, 0);
    ctx.fillStyle = lg(0, 0, 0, h, [[0, '#fff3c4'], [1, '#ffe08a']]); ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#d4202c'; ctx.fillRect(0, 0, 12, h);
    pizzaArt(62, 80, 44); starArt(92, 42, 22, .2);
    UI.container('slide2', 'sign', [108, 24, w - 4, h - 4], 3);
    TXT('HAZARD', 158, 70, { size: 25, fill: '#7a1a14', weight: 900, cid: 'slide2', maxW: 84, spacing: .4, hero: ch < 1 ? false : undefined });
    TXT('PAY', 158, 100, { size: 34, fill: '#d4202c', weight: 900, cid: 'slide2', maxW: 84, spacing: 1, hero: ch < 1 ? false : undefined });
    TXT('1 SLICE PER EMPLOYEE*', 158, h - 14, { size: 8, fill: '#7a4a1a', weight: 900, spacing: .3, cid: 'slide2', hero: false, maxW: 92 });
    ctx.restore();
  }
  ctx.restore();
}
function fMonitor(lt, st) {
  const M = FMON, x = M.x, y = M.y, w = M.w, h = M.h, by = y - 24 - h - 12;
  ctx.fillStyle = 'rgba(20,14,24,.3)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 6, 70, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2e38'; rr(x - 8, y - 28, 16, 28, 3); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = lg(0, y - 8, 0, y + 2, [[0, '#4a505e'], [1, '#2a2e38']]); ctx.beginPath(); ctx.ellipse(x, y - 2, 56, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1b1e25'; rr(x - w / 2 - 8, by, w + 16, h + 18, 8); ctx.fill(); ctx.strokeStyle = '#8f96a6'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.save(); ctx.translate(x - w / 2, by + 8); slideDraw(lt); ctx.restore();
  ctx.fillStyle = '#35ff8a'; ctx.beginPath(); ctx.arc(x + w / 2 - 6, by + h + 12, 2, 0, TAU); ctx.fill();
  glow(x, by + h / 2, 230, '210,230,255', .13, .1);
}
function fKeyboard() {
  ctx.fillStyle = '#d5dae2'; rr(FMON.x - 62, FDESK.top - 10, 124, 10, 3); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(60,70,90,.4)'; for (let i = 0; i < 12; i++) ctx.fillRect(FMON.x - 56 + i * 9.4, FDESK.top - 8, 7, 3);
}

// ------------------------------------------------------------------ the front doors: a doorway with two sliding glass leaves, the blizzard and the drift outside, then the wall of snow, the pile
const T_OPEN = FC.doorgust, T_DUMP = FC.snowdump;
const doorOpen = lt => eo(sg(lt, T_OPEN, T_OPEN + .28));
/* the crest of the heap in the lobby (world y) at x, once it has fully fallen: it climbs from a little drift at the foot to the doorway */
const CREST = [[820, 1346], [880, 1326], [925, 1322], [975, 1262], [1020, 1204], [1062, 1160], [1130, 1088], [1200, 1008], [1290, 924], [1400, 884], [1700, 876]];
function crestFinal(x) {
  if (x <= CREST[0][0]) return CREST[0][1];
  for (let i = 1; i < CREST.length; i++) if (x <= CREST[i][0]) { const a = CREST[i - 1], b = CREST[i], u = ss(x, a[0], b[0]); return lerp(a[1], b[1], u * .5 + sg(x, a[0], b[0]) * .5) + 5 * Math.sin(x * .09) + 3 * Math.sin(x * .23 + 1); }
  return CREST[CREST.length - 1][1];
}
const pileG = (x, lt) => { const d = x <= 1300 ? (1300 - x) / 700 * .6 : 0; return ss(lt, T_DUMP + d, T_DUMP + d + .62); };
const crestAt = (x, lt) => lerp(1424, crestFinal(x), pileG(x, lt));
function fOutside(lt, st, x0, y0, x1, y1, dk) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, mixc('#a7b3c8', '#7f8da8', st.blue)], [.7, mixc('#d6dce8', '#a9b4c8', st.blue)], [1, '#eef2f8']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  snow({ x0, y0, x1, y1, t: lt, seed: 41, layers: 3, density: 18, wind: -110, gusts: GUSTS_F, tone: 'light', fore: false });
  const top = y1 - (y1 - y0) * dk;                                                                       /* the drift against the glass */
  ctx.beginPath(); ctx.moveTo(x0, y1); for (let i = 0; i <= 24; i++) { const u = i / 24, xx = lerp(x0, x1, u); ctx.lineTo(xx, top + 10 * Math.sin(u * 9 + 1) + 6 * Math.sin(u * 23)); } ctx.lineTo(x1, y1); ctx.closePath();
  ctx.fillStyle = lg(0, top, 0, y1, [[0, '#ffffff'], [.5, '#f1f5fc'], [1, '#d3deef']]); ctx.fill(); ctx.strokeStyle = 'rgba(130,150,190,.4)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
function fDoors(lt, st) {
  const D = FDOOR, w = D.x1 - D.x0, open = doorOpen(lt), wallOn = lt >= T_OPEN - .01;
  ctx.fillStyle = 'rgba(30,20,30,.16)'; ctx.fillRect(D.x0 - 22, D.y0 - 40, w + 44, D.y1 - D.y0 + 40);
  ctx.fillStyle = mixc('#f0ece0', '#d3dbea', st.blue); ctx.fillRect(D.x0 - 22, D.y0 - 40, w + 44, 40); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(D.x0 - 22, D.y0 - 40, w + 44, 40);   /* the header */
  /* what is outside: the blizzard and the drift, or, once the leaves part, the wall of snow */
  fOutside(lt, st, D.x0, D.y0, D.x1, D.y1, wallOn ? .02 : st.drift);
  if (wallOn) snowWall(lt);
  for (const sd of [-1, 1]) {                                                                              /* the two leaves, sliding into the wall */
    const a = sd < 0 ? D.x0 : D.mx, b = sd < 0 ? D.mx : D.x1, sh = sd * open * (b - a);
    ctx.save(); ctx.beginPath(); ctx.rect(D.x0, D.y0, w, D.y1 - D.y0); ctx.clip(); ctx.translate(sh, 0);
    ctx.fillStyle = 'rgba(235,244,255,.20)'; ctx.fillRect(a, D.y0, b - a, D.y1 - D.y0);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(a + 18, D.y0 + 10); ctx.lineTo(a + 62, D.y0 + 10); ctx.lineTo(a + 10, D.y0 + 190); ctx.lineTo(a + 10, D.y0 + 130); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#aeb6c4'; ctx.lineWidth = 12; ctx.strokeRect(a + 6, D.y0 + 6, b - a - 12, D.y1 - D.y0 - 6); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(a, D.y0, b - a, D.y1 - D.y0);
    ctx.fillStyle = lg(0, D.y1 - 60, 0, D.y1, [[0, '#c9cfda'], [1, '#98a1b2']]); ctx.fillRect(a + 8, D.y1 - 60, b - a - 16, 52);                  /* the kick plate */
    const hx = sd < 0 ? b - 16 : a + 16; ctx.fillStyle = lg(hx - 5, 0, hx + 5, 0, [[0, '#f4f6fa'], [1, '#8f98a8']]); rr(hx - 5, D.y0 + 330, 10, 140, 5); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();   /* the pull handle */
    ctx.restore();
  }
  ctx.fillStyle = '#8f98a8'; ctx.fillRect(D.x0 - 22, D.y0, 22, D.y1 - D.y0); ctx.fillRect(D.x1, D.y0, 22, D.y1 - D.y0); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(D.x0 - 22, D.y0, 22, D.y1 - D.y0); ctx.strokeRect(D.x1, D.y0, 22, D.y1 - D.y0);
  ctx.fillStyle = '#35e07a'; rr(D.mx - 30, D.y0 - 34, 60, 26, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();                          /* the EXIT sign over the door */
  TXT('EXIT', D.mx, D.y0 - 21, { size: 18, fill: '#08381c', weight: 900, spacing: 2, hero: false, maxW: 52 });
}
/* the packed wall of snow in the doorway: lumpy, blue in the shade, a groove where each handle pressed into it; from the dump it slumps into the lobby */
function snowWall(lt) {
  const D = FDOOR, x0 = D.x0, x1 = D.x1, y0 = D.y0 - 8, yB = D.y1, sl = ss(lt, T_DUMP, T_DUMP + 1.0);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, D.y0 - 40, x1 - x0, yB - D.y0 + 40); ctx.clip();
  const topAt = x => { const g = ss(lt, T_DUMP + (x - x0) / (x1 - x0) * .18, T_DUMP + (x - x0) / (x1 - x0) * .18 + .75); return lerp(y0 - 10, crestFinal(Math.max(x, 1100)) - 6, g) + 7 * Math.sin(x * .13) + 4 * Math.sin(x * .31 + 2); };
  ctx.beginPath(); ctx.moveTo(x0, yB); for (let x = x0; x <= x1; x += 10) ctx.lineTo(x, topAt(x)); ctx.lineTo(x1, yB); ctx.closePath();
  ctx.fillStyle = lg(0, y0, 0, yB, [[0, '#fbfdff'], [.45, '#eaf0fa'], [1, '#c9d7ee']]); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = lg(x0, 0, x0 + 90, 0, [[0, 'rgba(100,126,184,.45)'], [1, 'rgba(100,126,184,0)']]); ctx.fillRect(x0, y0, 90, yB - y0);
  ctx.fillStyle = lg(x1 - 90, 0, x1, 0, [[0, 'rgba(100,126,184,0)'], [1, 'rgba(100,126,184,.4)']]); ctx.fillRect(x1 - 90, y0, 90, yB - y0);
  for (let i = 0; i < 26; i++) { const cx = x0 + sr(i, 1) * (x1 - x0), cy = y0 + 40 + sr(i, 2) * (yB - y0 - 60), r = 26 + sr(i, 3) * 46; ctx.fillStyle = rg(cx - r * .2, cy - r * .3, r * .1, r, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(190,205,235,0)']]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(120,145,196,.28)'; ctx.lineWidth = 2.4; for (let i = 0; i < 6; i++) { const yy = y0 + 90 + i * 84; ctx.beginPath(); ctx.moveTo(x0, yy + 6 * Math.sin(i)); ctx.bezierCurveTo(x0 + 90, yy - 8, x0 + 190, yy + 10, x1, yy - 4); ctx.stroke(); }
  for (const hx of [D.mx - 16, D.mx + 16]) { ctx.fillStyle = 'rgba(88,112,170,.55)'; rr(hx - 7, D.y0 + 326, 14, 148, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; rr(hx - 7, D.y0 + 326, 3.5, 148, 2); ctx.fill(); }   /* the handles' prints */
  ctx.restore(); ctx.restore();
}
/* the heap that falls into the lobby: drawn over the cast (it buries Onion), its crest rises to the doorway */
function fPile(lt) {
  if (lt < T_DUMP) return;
  const xs = []; for (let x = 800; x <= 1640; x += 14) xs.push(x);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(xs[0], 1420); xs.forEach(x => ctx.lineTo(x, crestAt(x, lt) + 4 * Math.sin(x * .17 + lt * 1.5) * (1 - pileG(x, lt)))); ctx.lineTo(1640, 1420); ctx.closePath();
  ctx.fillStyle = lg(0, 880, 0, 1420, [[0, '#ffffff'], [.35, '#f1f5fc'], [.75, '#d5e0f2'], [1, '#aebfdc']]); ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 22; i++) { const cx = 850 + sr(i, 5) * 780, cy = crestAt(cx, lt) + 20 + sr(i, 6) * 90, r = 22 + sr(i, 7) * 40; ctx.fillStyle = rg(cx - r * .2, cy - r * .3, r * .1, r, [[0, 'rgba(255,255,255,.6)'], [1, 'rgba(176,196,232,0)']]); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(120,150,205,.4)'; ctx.lineWidth = 3; ctx.beginPath(); xs.forEach((x, i) => { const y = crestAt(x, lt) + 18; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  ctx.fillStyle = lg(0, 1330, 0, 1420, [[0, 'rgba(110,134,190,0)'], [1, 'rgba(110,134,190,.5)']]); ctx.fillRect(780, 1330, 900, 90);
  ctx.restore();
  ctx.beginPath(); xs.forEach((x, i) => { const y = crestAt(x, lt); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.strokeStyle = 'rgba(150,170,210,.7)'; ctx.lineWidth = 2.4; ctx.stroke();
  /* sparkles on the crest */
  ctx.fillStyle = '#fff'; for (let i = 0; i < 10; i++) { const x = 900 + sr(i, 9) * 700, tw = .5 + .5 * Math.sin(lt * 3 + i * 2); if (tw < .6) continue; ctx.globalAlpha = tw * .8; ctx.beginPath(); ctx.arc(x, crestAt(x, lt) + 6, 2.4, 0, TAU); ctx.fill(); }
  ctx.restore();
}
/* chunks of the wall tumbling out of the doorway while it slumps: lumpy clusters, white on top and blue underneath (not bubbles) */
function fChunks(lt) {
  const age = lt - T_DUMP; if (age < 0 || age > 1.8) return;
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const a = age - sr(i, 11) * .35; if (a < 0) continue;
    const x0 = 1130 + sr(i, 12) * 260, y0 = 690 + sr(i, 13) * 170, vx = -(120 + 380 * sr(i, 14)), r = 10 + 20 * sr(i, 15), x = x0 + vx * a, y = y0 + 60 * a + 700 * a * a, land = crestAt(x, lt) - r * .2;
    if (y > land) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a * (2 + 3 * sr(i, 16)));
    for (const [dx, dy, k, shade] of [[.35, .3, .85, 1], [-.4, .15, .8, 1], [0, .5, .7, 1], [.05, -.25, .95, 0], [-.25, -.2, .7, 0]]) { ctx.fillStyle = shade ? '#aebfe0' : lg(0, -r, 0, r, [[0, '#ffffff'], [1, '#dbe5f6']]); ctx.beginPath(); ctx.arc(dx * r, dy * r, r * k, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}
/* the WELCOME mat and the sandwich-board WET FLOOR sign (it is blown over by the gust) */
function fMat(lt) {
  const x0 = 1128, x1 = 1392, y0 = 1262, y1 = 1330;
  ctx.fillStyle = '#5a3a30'; poly([[x0 + 8, y0], [x1 - 8, y0], [x1 + 10, y1], [x0 - 10, y1]], '#5a3a30', INKC, 3);
  ctx.fillStyle = '#7a5648'; poly([[x0 + 22, y0 + 8], [x1 - 22, y0 + 8], [x1 - 4, y1 - 8], [x0 + 4, y1 - 8]], '#7a5648');
  TXT('WELCOME', (x0 + x1) / 2, (y0 + y1) / 2 + 1, { size: 30, fill: '#f3e6cf', weight: 900, spacing: 4, hero: false, maxW: 200 });
}
function fSign(lt) {
  const cx = 1092, by = 1266, fall = eb(sg(lt, T_OPEN + .1, T_OPEN + .62)), ang = -1.5 * fall + (fall >= 1 ? .06 * Math.sin((lt - T_OPEN - .62) * 14) * Math.exp(-(lt - T_OPEN - .62) * 4) : 0);
  ctx.save(); ctx.translate(cx - 38, by); ctx.rotate(ang); ctx.translate(-(cx - 38), -by);
  ctx.fillStyle = 'rgba(20,14,24,.25)'; ctx.beginPath(); ctx.ellipse(cx, by + 4, 46, 8, 0, 0, TAU); ctx.fill();
  poly([[cx - 38, by], [cx + 38, by], [cx + 26, by - 146], [cx - 26, by - 146]], '#ffd21f', INKC, 3.4);
  poly([[cx - 26, by - 146], [cx + 26, by - 146], [cx + 31, by - 158], [cx - 21, by - 158]], '#e8b800', INKC, 3);
  ctx.fillStyle = '#17141c'; ctx.fillRect(cx - 28, by - 132, 56, 20); if (Math.abs(ang) < .1) TXT('CAUTION', cx, by - 122, { size: 13, fill: '#ffd21f', weight: 900, spacing: 1, hero: false, maxW: 50 });
  if (Math.abs(ang) < .1) TXT('WET FLOOR', cx, by - 56, { size: 13, fill: '#17141c', weight: 900, hero: false, maxW: 60 });
  ctx.strokeStyle = '#17141c'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - 3, by - 102); ctx.lineTo(cx + 2, by - 86); ctx.lineTo(cx - 8, by - 70); ctx.moveTo(cx + 2, by - 86); ctx.lineTo(cx + 14, by - 78); ctx.moveTo(cx - 3, by - 100); ctx.lineTo(cx - 14, by - 92); ctx.stroke();
  ctx.fillStyle = '#17141c'; ctx.beginPath(); ctx.arc(cx - 6, by - 108, 4.5, 0, TAU); ctx.fill();
  ctx.restore();
}
/* Strawberry's med cart, behind the cast */
function fCart(lt, x, y, S) {
  ctx.save(); ctx.translate(x, y); ctx.scale(S, S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(8,4,16,.28)'; ctx.beginPath(); ctx.ellipse(0, 4, 100, 14, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1b1c22'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; for (const sx of [-76, 76]) { ctx.beginPath(); ctx.arc(sx, -12, 12, 0, TAU); ctx.fill(); ctx.stroke(); }
  rr(-98, -232, 196, 212, 10); ctx.fillStyle = lg(0, -232, 0, -20, [[0, '#dce6f0'], [1, '#a9b8c8']]); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 3; i++) { rr(-86, -216 + i * 62, 172, 52, 6); ctx.fillStyle = '#eef3f8'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8d96a4'; rr(-24, -196 + i * 62, 48, 8, 4); ctx.fill(); }
  rr(-106, -248, 212, 22, 6); ctx.fillStyle = '#7fa0c0'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f7f7f1'; for (const cx2 of [-62, -32, -2, 28]) { ctx.beginPath(); ctx.moveTo(cx2 - 11, -282); ctx.lineTo(cx2 + 11, -282); ctx.lineTo(cx2 + 8, -248); ctx.lineTo(cx2 - 8, -248); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#c0392b'; rr(56, -298, 42, 42, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(72, -288, 10, 24); ctx.fillRect(65, -281, 24, 10);
  ctx.restore();
}
/* sheets of paper torn off Onion's clipboard by the gust */
function fPapers(lt) {
  const a0 = T_OPEN + .04, age = lt - a0; if (age < 0 || age > 2.2) return;
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const a = age - i * .06; if (a < 0) continue;
    const x = 1110 - (330 + 300 * sr(i, 1)) * a + 36 * Math.sin(a * 7 + i), y = 1040 - 140 * sr(i, 2) * a + 120 * Math.sin(a * 4.4 + i * 1.7) * a, rot = a * (5 + 5 * sr(i, 3)) + i;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .35 + .65 * Math.abs(Math.cos(a * 6 + i))); ctx.globalAlpha = c01((2.1 - a) / .5);
    ctx.fillStyle = '#fbfaf2'; ctx.strokeStyle = 'rgba(40,40,60,.55)'; ctx.lineWidth = 2; ctx.fillRect(-22, -29, 44, 58); ctx.strokeRect(-22, -29, 44, 58);
    ctx.fillStyle = 'rgba(60,70,100,.4)'; for (let j = 0; j < 5; j++) ctx.fillRect(-16, -21 + j * 10, 32 - (j % 2) * 8, 3); ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the shots (scene-local seconds; every start is snapped to a frame; the boundary frame is the NEW shot)
const ALLF = ['mango', 'tom', 'straw', 'lemon', 'onion'];
const FSH = [
  { id: 'open', s: 0, k: 'wide', x: 655, y: 950, z: [.8, .86], show: ALLF },
  { id: 'w1a', s: 1.60, k: 'pt', x: 545, y: 515, z: [1.8, 2.6], obj: 'tv', dof: 12, show: [] },
  { id: 'w1b', s: 3.00, k: 'wide', x: 378, y: 1110, z: [1.4, 1.5], dof: 5, show: ['mango', 'tom', 'straw'] },
  { id: 't1', s: 4.20, k: 'face', foc: 'tom', z: [2.0, 2.2], up: 120, dof: 9, show: ['tom'], bg: ['mango', 'straw'] },
  { id: 'o1', s: 5.17, k: 'face', foc: 'onion', z: [2.0, 2.25], up: 120, dx: -50, dof: 9, show: ['onion'], bg: ['lemon'] },
  { id: 'l1', s: 7.46, k: 'face', foc: 'lemon', z: [2.2, 2.3], up: 120, dof: 9, show: ['lemon'], bg: ['onion', 'mango'] },
  { id: 'ar1a', s: 8.21, k: 'pt', x: 508, y: 1050, z: [3.0, 3.5], obj: 'phone', dof: 12, show: [] },
  { id: 'ar1b', s: 9.90, k: 'pt', x: 705, y: 985, z: [2.0, 3.55], obj: 'monitor', dof: 12, show: [] },
  { id: 'ar1c', s: 11.70, k: 'face', foc: 'straw', z: [2.2, 2.32], up: 110, dof: 9, show: ['straw'], bg: ['tom'] },
  { id: 'ar1d', s: 12.60, k: 'face', foc: 'onion', z: [2.2, 2.4], up: 110, dof: 9, show: ['onion'], bg: ['lemon'] },
  { id: 's1', s: 13.71, k: 'face', foc: 'straw', z: [2.3, 2.45], up: 110, dof: 9, show: ['straw'], bg: ['tom'] },
  { id: 'me1a', s: 14.68, k: 'pt', x: 508, y: 1050, z: [3.4, 3.6], obj: 'phone', dof: 12, show: [] },
  { id: 'me1b', s: 15.35, k: 'pt', x: 705, y: 985, z: [3.55, 3.6], obj: 'monitor', dof: 12, show: [] },
  { id: 's2', s: 16.07, k: 'face', foc: 'straw', z: [2.6, 2.72], up: 110, dof: 9, show: ['straw'], bg: ['tom'] },
  { id: 'm1a', s: 16.94, k: 'face', foc: 'mango', z: [2.2, 2.32], up: 110, dof: 9, show: ['mango'], bg: ['tom', 'lemon'] },
  { id: 'm1b', s: 17.70, k: 'pt', x: 1255, y: 1080, z: [1.75, 1.85], obj: 'door', show: [], day: true },
  { id: 'l2a', s: 18.66, k: 'face', foc: 'lemon', z: [2.3, 2.36], up: 110, dof: 9, show: ['lemon'], bg: ['mango', 'onion'] },
  { id: 'l2b', s: 19.20, k: 'pt', x: 890, y: 735, z: [2.0, 2.25], obj: 'board', dof: 12, show: [] },
  { id: 's3', s: 20.55, k: 'face', foc: 'straw', z: [2.4, 2.5], up: 110, dof: 9, show: ['straw'], bg: ['tom'] },
  { id: 'o2', s: 21.46, k: 'wide', x: 570, y: 1060, z: [.96, .98], show: ALLF },
  { id: 'door', s: 22.52, k: 'wide', x: 1165, y: 1020, z: [1.5, 1.4], show: ['onion'] },
  { id: 'o3', s: 24.57, k: 'face', foc: 'onion', z: [2.25, 2.4], up: 120, dx: 40, dof: 9, show: ['onion'] },
  { id: 't2', s: 26.20, k: 'wide', x: 272, y: 1110, z: [1.7, 1.78], show: ['tom', 'straw'], bg: ['mango'] },
  { id: 'end', s: 27.37, k: 'wide', x: 1112, y: 1060, z: [1.8, 1.95], show: ['onion'] },
];
for (const sh of FSH) sh.s = sh.s === 0 ? 0 : TF.snapT(sh.s);
FSH.forEach((sh, i) => { sh.e = i + 1 < FSH.length ? FSH[i + 1].s : 99; });
const fShot = lt => { let r = FSH[0]; for (const sh of FSH) if (lt >= sh.s - 1e-6) r = sh; return r; };

// ------------------------------------------------------------------ gaze: who each character looks at, smoothly handed over (targets: a character, or tv / phone / board / door)
const GAZE = [[0, 4.2, 'tv'], [4.2, 5.12, 'tom'], [5.12, 7.4, 'onion'], [7.4, 8.2, 'lemon'], [8.2, 13.65, 'phone'], [13.65, 14.8, 'straw'], [14.8, 16.0, 'phone'], [16.0, 16.9, 'straw'], [16.9, 18.62, 'mango'],
  [18.62, 20.5, 'lemon'], [20.5, 21.4, 'straw'], [21.4, 21.9, 'onion'], [21.9, 22.6, 'straw'], [22.6, 24.5, 'door'], [24.5, 26.15, 'onion'], [26.15, 27.2, 'tom'], [27.2, 99, 'onion']];
const GOBJ = { tv: [545, -.75], phone: [508, .1], board: [890, -.45], door: [1250, 0] };
function gazeOf(n, lt) {
  let idx = GAZE.findIndex(g => lt < g[1]); if (idx < 0) idx = GAZE.length - 1;
  const cur = GAZE[idx], prev = GAZE[Math.max(0, idx - 1)], me = FSTAND[n][0], k = ss(lt, cur[0], cur[0] + .2);
  const pick = g => g[2] === n ? [me, 0, true] : FSTAND[g[2]] ? [FSTAND[g[2]][0], .02, false] : [GOBJ[g[2]][0], GOBJ[g[2]][1], false];
  const a = pick(prev), b = pick(cur), x = lerp(a[0], b[0], k), ly = lerp(a[1], b[1], k), dx = x - me, self = lerp(a[2] ? 1 : 0, b[2] ? 1 : 0, k);
  const head = Math.max(-.6, Math.min(.6, dx / 480)) * (1 - self), look = [Math.max(-1, Math.min(1, dx / 260)) * .9 * (1 - self), ly * (1 - self * .6)];
  return { head, yaw: head * .5, look };
}
// ------------------------------------------------------------------ the cast: options for drawChar at scene time lt
const hopAt = ag => ag < 0 || ag > .84 ? 0 : 38 * Math.abs(Math.sin(PI * ag / .42)) * Math.exp(-ag * 2.4);
const pulseAt = (lt, t0, hz = 14, tau = .18) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
function castF(lt) {
  const C = {}, st = fstate(lt);
  /* Mango */
  { const g = gazeOf('mango', lt), tm = lt >= TF.ls('m1') - .1 && lt < TF.le('m1') + .3, sh = lt >= TF.wS('m1', 3) - .1 && lt < TF.le('m1') + .4;
    C.mango = A7.mango({ x: FSTAND.mango[0], y: FSTAND.mango[1], s: FSC.mango, t: lt, yaw: g.yaw, headYaw: g.head, look: g.look, expr: tm ? 'dead' : 'neutral', lid: tm ? .5 : undefined, who: 'mango', plant: true, arms: { l: 'rest', r: sh ? 'shrug' : 'rest' } }); }
  /* Tomato: the party popper (pop at 4.60 and again at 26.55), she bounces */
  { const g = gazeOf('tom', lt), a1 = lt - FC.popper, a2 = lt - FC.popper2, ag = lt >= 20 ? a2 : a1, hop = hopAt(a1) + hopAt(a2), sq = (a1 >= 0 && a1 < 1 ? .07 * Math.sin(a1 * 16) * Math.exp(-a1 * 3.4) : 0) + (a2 >= 0 && a2 < 1 ? .07 * Math.sin(a2 * 16) * Math.exp(-a2 * 3.4) : 0);
    const grip = K([[0, [-98, 44]], [4.15, [-98, 44]], [4.5, [-112, -98]], [4.62, [-114, -92]], [5.3, [-104, -30]], [5.9, [-98, 40]], [26.0, [-98, 40]], [26.38, [-110, -98]], [26.58, [-112, -92]], [27.4, [-104, -30]]], lt);
    C.tom = A15.tomato({ x: FSTAND.tom[0], y: FSTAND.tom[1] - hop, s: FSC.tom, t: lt, tomPose: 'fruit', yaw: g.yaw, headYaw: g.head, look: g.look, who: 'tom', plant: true, squash: sq,
      arms: { l: 'hold', r: 'rest' }, hold: { l: 'fp20f_popper' }, grip: { l: grip }, popAge: ag, popRot: .24 }); C.tom.formsN = 0; }
  /* Strawberry, per diem, at her cart: flat, tired; a slow blink on "Of course." */
  { const g = gazeOf('straw', lt), sp = lt >= TF.ls('s3') - .1 && lt < TF.le('s3') + .2, bl = K([[0, 0], [16.2, 0], [16.5, 1], [16.85, 0]], lt), fall = ss(lt, TF.ls('o2') + .55, TF.ls('o2') + 1.0);
    C.straw = A11.straw({ x: FSTAND.straw[0], y: FSTAND.straw[1], s: FSC.straw, t: lt, yaw: g.yaw, headYaw: g.head, look: g.look, expr: sp && !fall ? 'neutral' : 'dead', lid: lerp(sp ? .32 : .5, .9, bl), who: 'straw', plant: true,
      arms: { l: 'hold', r: 'rest' }, hold: { l: 'fp18_medcup' }, cupScale: 1.25, cupTip: .3 * Math.sin(lt * 1.3), grip: { l: [-112, 38] } }); }
  /* Lemon: the flat look; the clipboard stays down */
  { const g = gazeOf('lemon', lt), sp = (lt >= TF.ls('l1') - .1 && lt < TF.le('l1') + .3) || (lt >= TF.ls('l2') - .1 && lt < TF.le('l2') + .2);
    C.lemon = A7.lemon({ x: FSTAND.lemon[0], y: FSTAND.lemon[1], s: FSC.lemon, t: lt, yaw: g.yaw, headYaw: g.head, look: g.look, expr: sp ? 'dead' : 'neutral', lid: sp ? .52 : .3, face: { curve: .02 }, acc: ['readers', 'lanyard7'], who: 'lemon', plant: true, arms: { l: 'rest', r: 'rest' } }); }
  /* Onion: the policy binder at "Per policy"; the walk to the doors; the gust; the snow; her head and the raised clipboard */
  { const g = gazeOf('onion', lt), walk = ss(lt, 22.3, T_OPEN), push = ss(lt, T_DUMP + .05, T_DUMP + .95), x = lerp(FSTAND.onion[0], 1120, walk) - 63 * push;
    const bin = K([[0, [100, 40]], [5.55, [100, 40]], [5.95, [172, -4]], [7.45, [172, -4]], [7.9, [100, 40]]], lt), op = ss(lt, 6.05, 6.5) * (1 - ss(lt, 7.45, 7.8));
    const tabG = K([[0, [-74, 104]], [T_OPEN + .05, [-74, 104]], [T_OPEN + .2, [-150, 66]], [T_DUMP + .5, [-150, 66]], [T_DUMP + .9, [-136, -52]]], lt);
    const handle = K([[0, [100, 40]], [22.5, [100, 40]], [T_OPEN - .12, [150, -74]], [T_OPEN + .1, [122, -70]], [T_OPEN + .22, [130, 0]], [T_OPEN + .5, [100, 40]]], lt);
    const buried = lt >= T_DUMP, sob = Math.max(0, 1 - Math.abs(lt - FC.sniffle - .1) / .4);
    const yaw = K([[0, g.yaw], [22.0, g.yaw], [22.25, 1.15], [T_OPEN, .95], [T_DUMP + .3, .5], [T_DUMP + 1.2, 0]], lt), head = lt < 22.0 ? g.head : K([[22.0, g.head], [22.25, 1.0], [T_DUMP, .8], [T_DUMP + 1.1, 0]], lt);
    const rArm = lt < 5.4 ? ['rest', null] : lt < 7.9 ? ['hold', 'fp20f_binder'] : lt < T_OPEN - .3 ? ['rest', null] : lt < T_OPEN + .6 ? ['hold', null] : ['rest', null];
    const o = A15.onion({ x, y: FSTAND.onion[1] - (lt >= T_DUMP ? 0 : 0), s: FSC.onion, t: lt, pose: 'clip', yaw, headYaw: head, look: lt < T_DUMP ? g.look : [.1, .05], who: 'onion', sob: sob * (lt < 8 ? 1 : 0) + (lt > 24.5 ? .35 : 0),
      cry: lt >= T_DUMP + .9 ? .9 : .62, expr: lt >= T_DUMP + .08 && lt < T_DUMP + 1.0 ? 'shock' : 'onion_cry', arms: { l: 'hold', r: rArm[0] }, hold: { l: 'fp15_tabletclip' }, grip: { l: tabG } });
    if (rArm[1] === 'fp20f_binder') { o.hold.r = 'fp20f_binder'; o.grip.r = bin; o.binOpen = op; }
    else if (lt >= T_OPEN - .3 && lt < T_OPEN + .6) { o.grip.r = handle; }
    if (walk > 0 && walk < 1) { o.gait = Math.abs(x - FSTAND.onion[0]) + 0; o.dir = 1; o.stride = 40; o.vx = 200 * FSC.onion; }
    if (lt >= T_DUMP && lt < T_DUMP + .9) { o.arms.r = 'flail'; o.rot = .06 * Math.sin((lt - T_DUMP) * 22) * (1 - ss(lt, T_DUMP + .5, T_DUMP + .9)); }
    C.onion = o; }
  return C;
}
// ------------------------------------------------------------------ the day shift at the door (coats, hats, bags), seen from behind: a stand-in dress until A20.winter is there
function dayShift(lt) {
  const mk = (kind, x, y, s, yaw, col, extra) => {
    const o = Object.assign({ kind, id: 'ds' + kind, x, y, s, t: lt, yaw, headYaw: yaw, expr: 'sad', lid: .45, plant: true, arms: { l: 'rest', r: 'hold' }, hold: { r: 'fp20f_bag' }, grip: { r: [104, 46] }, bagCol: col, acc: [] }, extra || {});
    if (window.A20 && typeof A20.winter === 'function') A20.winter(o, { hat: 'beanie', hatColor: col === '#3a7a6a' ? '#c43a3a' : '#2f6fc4', pom: true, scarf: true, scarfColor: '#f2c230', mittens: true, boots: true, coat: true, coatColor: col === '#3a7a6a' ? '#3a4a6a' : '#6a3a4a', breath: false });
    return o;
  };
  const br = Math.sin(lt * 1.9) * .012;
  return [mk('cherry', 1168, 1262, .84, 2.55 + br, '#3a7a6a'), mk('blue', 1262, 1250, .8, 3.14 + br, '#a8486a'), mk('grape', 1352, 1264, .82, -1.45, '#3a7a6a', { expr: 'sad' })];
}

// ------------------------------------------------------------------ frame tests (as ep18_station.js): is a character wholly / partly inside the frame?
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inFrame(o, pad = 0) {
  const b = boxOf(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
/* where the popper's mouth is, in world units (from the character's options: the hand is the grip, the cone leans by popRot) */
function popMouth(o) {
  const k = KINDS[o.kind], s = o.s, g = o.grip.l, hx = o.x + g[0] * s, hy = o.y - s * ((k.leg || 90) + k.ry * .9) + g[1] * s, S = 1.15, a = o.popRot ?? .24;
  return [hx - Math.sin(a) * 92 * S * s, hy - Math.cos(a) * 92 * S * s];
}

// ------------------------------------------------------------------ the room, the camera, the draw
function roomF(lt, st, skip) {
  fWall(lt, st); fWindows(lt, st); fPoster(lt, st);
  if (!skip.tv) fTV(lt, st);
  if (!skip.board) fBoard(lt, st);
  fDoors(lt, st);
  if (!skip.desk) fDesk(lt, st);
  if (!skip.desk) fKeyboard();
  if (!skip.monitor) fMonitor(lt, st);
  if (!skip.phone) fPhone(lt, st);
  fFloor(lt, st); fCart(lt, 40, 1246, .8); fMat(lt); fSign(lt);
}
let FR = null;
function camF(lt) {
  const sh = fShot(lt), C = castF(lt), st = fstate(lt), dur = sh.e > 90 ? TF.SCN.dur - sh.s : sh.e - sh.s, u = c01((lt - sh.s) / dur), z = lerp(sh.z[0], sh.z[1], easeIO(u));
  let cx = sh.x, cy = sh.y;
  if (sh.k === 'face') { const o = Object.assign({}, C[sh.foc]); if (sh.foc === 'tom') o.y = FSTAND.tom[1]; const [fx, fy] = faceC(o); cx = fx - (sh.dx || 0) / z; cy = fy + sh.up / z; }
  zoomTo(cx, cy, z);
  const sway = { x: 2.2 * hnoise(lt, 1.3, 1), y: 1.6 * hnoise(lt, 1.1, 2), r: .0012 * hnoise(lt, .9, 3) };
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
  if (sh.id === 'door' || sh.id === 'o3') CAM.shake = 4.5 * Math.exp(-Math.max(0, lt - T_DUMP) * 4.5) * (lt >= T_DUMP ? 1 : 0) + 1.6 * Math.exp(-Math.max(0, lt - T_OPEN) * 7) * (lt >= T_OPEN ? 1 : 0);
  FR = { C, sh, st };
}
function drawF(lt) {
  const { C, sh, st } = FR;
  V2.setLight({ key: [-.45, -.6], keyColor: '#fff4e2', keyA: .2, rim: '#bcd4ff', rimA: .34, shadow: '#1a2038', shadowA: .3, bounce: '#ffe6bc', bounceA: .1, amb: '#dde8ff', ambA: .06, frontDark: .02 }); V2.opts.reflect = false;
  const skip = {}; if (sh.obj === 'tv') skip.tv = 1; if (sh.obj === 'phone') { skip.desk = 1; skip.phone = 1; } if (sh.obj === 'monitor') { skip.desk = 1; skip.monitor = 1; } if (sh.obj === 'board') skip.board = 1;
  const bgCast = () => { if (!sh.bg) return; REG.suppress++; for (const n of sh.bg) if (inFrame(C[n], 20).inter) drawChar(C[n]); REG.suppress--; };
  if (sh.dof) { SOFT++; V2.dof(sh.dof, () => { roomF(lt, st, skip); bgCast(); }); SOFT--; } else roomF(lt, st, skip);
  HEROMODE = !!sh.obj && sh.obj !== 'door';
  if (sh.obj === 'tv') fTV(lt, st);
  if (sh.obj === 'phone') { fDesk(lt, st); fKeyboard(); fPhone(lt, st); }
  if (sh.obj === 'monitor') { fDesk(lt, st); fKeyboard(); fMonitor(lt, st); }
  if (sh.obj === 'board') fBoard(lt, st);
  HEROMODE = false;
  /* behind the cast: the blown-in snow, the papers, the back of the confetti */
  const gust = ss(lt, T_OPEN, T_OPEN + .3) * (1 - ss(lt, 26.2, 28)) * .9 + .25 * ss(lt, 27.3, 27.6);
  if (gust > .02 && (sh.id === 'door' || sh.id === 'o3' || sh.id === 'end')) snow({ x0: 800, y0: 400, x1: 1700, y1: 1320, t: lt, seed: 77, layers: 2, density: 5, wind: -380, gusts: GUSTS_F, tone: 'light', fore: false, alpha: gust });
  fPapers(lt);
  if (lt >= T_DUMP && lt < T_DUMP + 1.4 && (sh.id === 'door' || sh.id === 'o3')) {      /* the powder of the dump, behind everybody */
    flurry({ x: 1215, y: 820, r: 80, t: lt, t0: T_DUMP, life: 1.2, seed: 5, n: 70 });
  }
  if (lt >= FC.sting && lt < FC.sting + 1.1 && sh.id === 'end') flurry({ x: 1290, y: 900, r: 70, t: lt, t0: FC.sting, life: 1.0, seed: 9, n: 50 });
  for (const [t0, o] of [[FC.popper, C.tom], [FC.popper2, C.tom]]) { const [mx, my] = popMouth(o); const oo = Object.assign({}, o, { y: FSTAND.tom[1] }); const [bx, by] = popMouth(oo); confetti(lt, t0, bx, by, { s: FSC.tom, seed: t0 > 10 ? 8 : 3, part: 'back', dir: -2.04 }); }
  if (sh.day) {
    const ds = dayShift(lt).sort((a, b) => a.y - b.y); for (const o of ds) drawChar(o);
  }
  const order = sh.show.map(n => [n, C[n]]).sort((a, b) => a[1].y - b[1].y);
  for (const [n, o] of order) drawChar(o);
  fChunks(lt); fPile(lt);
  for (const t0 of [FC.popper, FC.popper2]) { const oo = Object.assign({}, C.tom, { y: FSTAND.tom[1] }); const [bx, by] = popMouth(oo); confetti(lt, t0, bx, by, { s: FSC.tom, seed: t0 > 10 ? 8 : 3, part: 'front', dir: -2.04 }); }
  if (lt > 24.4 && sh.show.includes('onion') && (sh.id === 'o3' || sh.id === 'end')) { const o = C.onion, [fx, fy] = faceC(o); breath({ x: fx + 52 * o.s, y: fy + 30 * o.s, t: lt, seed: 3, dir: 1, size: 1.5 * o.s / .8, alpha: 1, period: 1.7 }); }
}
const FORECAST = {
  shot: lt => fShot(lt).id,
  cam: camF,
  draw: drawF,
  fx: lt => { const b = fstate(lt).blue; return { bloom: .4, vignette: .3, grain: .045, contrast: .1, sat: .1, tint: [['#a8c0ff', .04 + .08 * b, 'soft-light']] }; },
  blur: lt => ((lt > FC.popper - .02 && lt < FC.popper + .3) || (lt > FC.popper2 - .02 && lt < FC.popper2 + .3) || (lt > T_DUMP - .02 && lt < T_DUMP + .5)) ? 3 : 1,
  over() {},
  clock: () => TF.SCN.clock, label: () => TF.SCN.label,
};
window.__EP20_SCENES = window.__EP20_SCENES || {}; window.__EP20_SCENES.forecast = FORECAST;

// ====================================================================================================================================================================================
// DAYROOM (8:40 PM, THE DAY ROOM). One flat stage, floor line y 1300: a bay of three windows on the back wall (frost, snow, the Moon behind the weather in the middle one, a raised sash and a heap on the
// sill at the left end), a long shelf of LED candles above the residents' heads, four residents in a row (Goji, Pear, Banana, Cranberry; chairs, blankets, a tray with a candle and a cup each), Mango at the
// sill on the left, Lemon with the clipboard on the right. Lit by L20.pass: warm candle points, cool window rects, dim downlights.
// ====================================================================================================================================================================================
const DFL = 1300, DSHELF = 950, DSILL = 1060;
const DBAY = [[20, 340], [390, 710], [760, 1080]];                        /* the three windows: outer frame x0, x1 */
const DWY = { y0: 300, y1: 1060 };                                         /* the frame runs from y0 to the sill */
const DSEAT = { goji: { x: 470, s: 1.12, kind: 'wheel', col: '#6a6a78' }, pear: { x: 650, s: .96, kind: 'arm', col: '#8a3b3b' }, banana: { x: 830, s: .95, kind: 'wheel', col: '#3b6aa8' }, cran: { x: 1000, s: 1.08, kind: 'arm', col: '#5f7f4f' } };
const DSTAND = { mango: [255, DFL], lemon: [1165, DFL] };
const DRES = ['goji', 'pear', 'banana', 'cran'];
const DC = { cupset1: 9.938, slurp1: 10.095, cupset2: 11.859, slurp2: 12.159, cupset3: 12.559, slurp3: 12.859, cupset4: 13.159, pentick: 15.009, plowdist: 15.754, sting: 19.196 };
for (const k in DC) DC[k] = TD.snapT(DC[k]);
const D_MO = TD.ls('mo1'), D_MOE = TD.le('mo1');
const dstate = lt => ({ sillD: 30 + 26 * ss(lt, 0, 20.5) + 60 * (SNk() && hasK(SNk(), 'depthAt') ? SNk().depthAt(1240 + lt / 60) - .45 : 0), cloud: lt < 16.6 ? 1 : lt < 17.6 ? lerp(1, .58, ss(lt, 16.6, 17.6)) : lt < 18.3 ? .58 : lerp(.58, .98, ss(lt, 18.25, 18.75)) });
const DGUSTS = [[15.6, 1.4, .5]];
function dSky(x, y, w, h, lt, seed, o = {}) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = lg(0, y, 0, y + h, [[0, '#19244e'], [.55, '#334a7e'], [1, '#7a8fbe']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rg(x + w * .5, y + h * 1.02, 10, h * .9, [[0, 'rgba(190,210,255,.5)'], [1, 'rgba(190,210,255,0)']]); ctx.fillRect(x, y, w, h);
  snow({ x0: x, y0: y, x1: x + w, y1: y + h, t: lt, seed, layers: 3, density: 16, wind: -55, gusts: DGUSTS, tone: 'dark', fore: false });
  ctx.restore();
}
function dWindow(lt, i, st) {
  const [x0, x1] = DBAY[i], w = x1 - x0, y0 = DWY.y0, y1 = DWY.y1, open = i === 0 ? 86 : 0;
  ctx.fillStyle = '#d9d0bd'; ctx.strokeStyle = INKC; ctx.lineWidth = 3.4; rr(x0, y0, w, y1 - y0, 6); ctx.fill(); ctx.stroke();
  const up = [x0 + 14, y0 + 14, w - 28, 336], lo = [x0 + 14, y0 + 14 + 336 + 26 - open, w - 28, y1 - y0 - 14 - 336 - 26 - 14];
  /* the sky is behind everything (the opening under a raised sash shows it too) */
  dSky(x0 + 14, y0 + 14, w - 28, y1 - y0 - 28, lt, 61 + i * 5);
  if (i === 1 && window.P20 && typeof P20.moon === 'function') {                                         /* the Moon, behind the weather, in the middle window's upper pane */
    P20.moon(ctx, { x: up[0] + up[2] / 2, y: up[1] + up[3] / 2, w: up[2], h: up[3], r: 62, t: lt, cloud: st.cloud, rise: .12, rad: 3, expr: lt > 18.2 ? 'sad' : 'neutral' });
    snow({ x0: up[0], y0: up[1], x1: up[0] + up[2], y1: up[1] + up[3], t: lt, seed: 66, layers: 3, density: 16, wind: -55, gusts: DGUSTS, tone: 'dark', fore: false });
  }
  for (const [px, py, pw, ph, sd] of [[up[0], up[1], up[2], up[3], 1], [lo[0], lo[1], lo[2], lo[3], 2]]) {
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.fillStyle = 'rgba(190,210,255,.07)'; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(px + pw * .12, py); ctx.lineTo(px + pw * .42, py); ctx.lineTo(px, py + ph * .45); ctx.lineTo(px, py + ph * .25); ctx.closePath(); ctx.fill();
    frost({ x: px, y: py, w: pw, h: ph, amount: .5, seed: 11 + i * 3 + sd, t: lt, tone: 'dark' });
    ctx.restore();
    ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(px, py, pw, ph);
  }
  ctx.fillStyle = '#cfc6b2'; ctx.fillRect(x0 + 8, y0 + 14 + 336 + 2, w - 16, 22 - 2 - (open ? 0 : 0)); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.strokeRect(x0 + 8, y0 + 14 + 336 + 2, w - 16, 20);   /* the meeting rail */
  if (open) {
    ctx.fillStyle = '#cfc6b2'; ctx.fillRect(lo[0] - 6, lo[1] + lo[3] - 2, lo[2] + 12, 12); ctx.strokeRect(lo[0] - 6, lo[1] + lo[3] - 2, lo[2] + 12, 12);          /* the bottom rail of the raised sash */
    snow({ x0: x0 + 14, y0: lo[1] + lo[3] + 10, x1: x1 - 14, y1: y1 - 14, t: lt, seed: 77, layers: 2, density: 26, wind: 160, gusts: DGUSTS, tone: 'dark', fore: false });
  }
  /* paper snowflakes taped to the glass */
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (const [fx, fy, r] of [[.22, .16, 22], [.74, .3, 17], [.4, .12, 14]]) { if (i === 1 && fx > .3 && fx < .6) continue; ctx.save(); ctx.translate(up[0] + up[2] * fx, up[1] + up[3] * fy + (i === 1 ? 70 : 0)); for (let k = 0; k < 6; k++) { ctx.rotate(PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.moveTo(0, -r * .55); ctx.lineTo(r * .3, -r * .8); ctx.moveTo(0, -r * .55); ctx.lineTo(-r * .3, -r * .8); ctx.stroke(); } ctx.restore(); }
  ctx.restore();
}
function dSill(lt, st) {
  ctx.fillStyle = 'rgba(10,6,16,.3)'; ctx.fillRect(-300, DSILL + 24, 1900, 14);
  ctx.fillStyle = lg(0, DSILL - 4, 0, DSILL + 24, [[0, '#a07c52'], [1, '#6a4c30']]); rr(-300, DSILL - 4, 1900, 28, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  sill({ x0: 30, x1: 330, y: DSILL - 3, depth: st.sillD, seed: 7, tone: 'dark' });                         /* the heap under the raised sash, deeper through the scene */
}
const DCANDLE = [[44, 'tea'], [96, 'pil'], [150, 'tea'], [205, 'pil'], [262, 'tea'], [410, 'pil'], [466, 'tea'], [520, 'pil'], [578, 'tea'], [790, 'pil'], [846, 'tea'], [962, 'pil'], [1020, 'tea'], [1072, 'pil'], [1128, 'tea'], [1190, 'pil'], [1244, 'tea']];
let DCL = [];                                                                     /* the candle flames of the frame (for the light pass) */
function dShelf(lt, st) {
  ctx.fillStyle = 'rgba(10,6,16,.3)'; ctx.fillRect(-300, DSHELF + 14, 1900, 10);
  ctx.fillStyle = lg(0, DSHELF, 0, DSHELF + 16, [[0, '#b58a56'], [1, '#7a5634']]); rr(-300, DSHELF, 1900, 16, 3); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.fillStyle = '#6a4c30'; for (let x = 20; x < 1260; x += 240) { poly([[x, DSHELF + 16], [x + 22, DSHELF + 16], [x + 3, DSHELF + 54]], '#6a4c30', INKC, 2); }
  DCL = [];
  for (let i = 0; i < DCANDLE.length; i++) {
    const [cx, kind] = DCANDLE[i], hasP = window.P20 && typeof P20.ledCandle === 'function';
    if (hasP) { const r = P20.ledCandle(ctx, { x: cx, y: DSHELF + 2, s: kind === 'pil' ? .68 : .9, on: 1, t: lt, seed: i * 3 + 1, kind: kind === 'pil' ? 'pillar' : 'tea' }); if (r) DCL.push({ x: r.fx, y: r.fy, r: r.r, seed: i }); }
    else { ctx.fillStyle = '#f2ead6'; rr(cx - 12, DSHELF - 50, 24, 52, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke(); glow(cx, DSHELF - 56, 60, '255,190,100', .6, .5); DCL.push({ x: cx, y: DSHELF - 56, r: 100, seed: i }); }
  }
}
function dWall(lt, st) {
  ctx.fillStyle = lg(0, -200, 0, DFL, [[0, '#b79a82'], [.3, '#cdb08e'], [1, '#b49470']]); ctx.fillRect(-1600, -600, 4600, DFL + 600);
  ctx.fillStyle = lg(0, 1070, 0, DFL, [[0, '#4d7872'], [1, '#3a5f5a']]); ctx.fillRect(-1600, 1070, 4600, DFL - 1070); ctx.fillStyle = '#8a6a46'; ctx.fillRect(-1600, 1064, 4600, 8); ctx.fillStyle = 'rgba(20,12,16,.3)'; ctx.fillRect(-1600, 1072, 4600, 4);
  ctx.fillStyle = '#8a6a46'; ctx.fillRect(-1600, DFL - 22, 4600, 22); ctx.fillStyle = 'rgba(20,12,16,.3)'; ctx.fillRect(-1600, DFL - 22, 4600, 3);
  ctx.fillStyle = '#4a3f52'; ctx.fillRect(-1600, -600, 4600, 920);                                            /* the ceiling, dim */
  ctx.fillStyle = '#5a4c64'; ctx.fillRect(-1600, 300, 4600, 10); ctx.fillStyle = 'rgba(20,12,16,.25)'; ctx.fillRect(-1600, 310, 4600, 14);
  for (const lx of [330, 700, 1070]) { ctx.fillStyle = '#e9dfc8'; ctx.beginPath(); ctx.ellipse(lx, 330, 34, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke(); }   /* three dim downlights */
}
function dFloor(lt) {
  ctx.fillStyle = lg(0, DFL, 0, 2500, [[0, '#8a6244'], [1, '#50382a']]); ctx.fillRect(-1600, DFL, 4600, 1400);
  ctx.strokeStyle = 'rgba(20,10,4,.28)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const y = DFL + 8 + Math.pow(i / 8, 1.7) * 900; ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(3000, y); ctx.stroke(); }
  for (let x = -2200; x <= 3600; x += 170) { ctx.beginPath(); ctx.moveTo(x * .45 + 330, DFL); ctx.lineTo(x * 1.55 - 100, 2400); ctx.stroke(); }
  ctx.save(); ctx.translate(740, DFL + 70); ctx.scale(1, .26);                                                   /* the rug under the row */
  ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.arc(0, 0, 640, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8c49a'; ctx.beginPath(); ctx.arc(0, 0, 590, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a4a34'; ctx.beginPath(); ctx.arc(0, 0, 548, 0, TAU); ctx.fill();
  ctx.restore();
}
function dArt(lt) {
  const x = 1118, y = 400, w = 150, h = 112;                                                                   /* a framed photograph: NINETEEN SIXTY-TWO */
  ctx.fillStyle = 'rgba(10,6,16,.3)'; rr(x + 6, y + 8, w, h, 4); ctx.fill();
  ctx.fillStyle = '#6a4a30'; rr(x, y, w, h, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(x + 9, y + 9, w - 18, h - 18); ctx.clip();
  ctx.fillStyle = lg(0, y, 0, y + h, [[0, '#d8c4a0'], [1, '#b89a70']]); ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x + 20, y + 52, 52, 40); ctx.beginPath(); ctx.moveTo(x + 14, y + 54); ctx.lineTo(x + 46, y + 30); ctx.lineTo(x + 78, y + 54); ctx.closePath(); ctx.fill();   /* the house */
  ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.moveTo(x + 4, y + h); ctx.bezierCurveTo(x + 20, y + 40, x + 60, y + 22, x + 100, y + 56); ctx.bezierCurveTo(x + 126, y + 74, x + 140, y + 90, x + w, y + h); ctx.closePath(); ctx.fill();   /* the drift over the roof */
  ctx.fillStyle = '#3a2a20'; ctx.fillRect(x + 118, y + 76, 4, 14); ctx.beginPath(); ctx.arc(x + 120, y + 72, 4, 0, TAU); ctx.fill();   /* a tiny person */
  ctx.restore();
  TXT('1962', x + w / 2, y + h + 14, { size: 14, fill: '#e8d8b8', weight: 900, spacing: 2, hero: false });
}
function dLamp(x, lt, seed) {
  const f = .95 + .05 * Math.sin(lt * 1.3 + seed);
  ctx.fillStyle = 'rgba(10,6,16,.32)'; ctx.beginPath(); ctx.ellipse(x, DFL + 6, 56, 12, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, DFL); ctx.lineTo(x, 760); ctx.stroke();
  ctx.fillStyle = '#3a2c20'; ctx.beginPath(); ctx.ellipse(x, DFL - 4, 38, 9, 0, 0, TAU); ctx.fill();
  poly([[x - 44, 760], [x + 44, 760], [x + 70, 668], [x - 70, 668]], lg(0, 668, 0, 760, [[0, '#ffe8b4'], [1, '#f0c27a']]), INKC, 3);
  glow(x, 740, 220 * f, '255,196,120', .5 * f, .5);
}

// ------------------------------------------------------------------ chairs, blankets, trays (copied in spirit from ep19_signup.js, which drew the same four residents): (x, y) = the sitter's body bottom, s = scale, fl = the floor
function chairBack(kind, x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(8,4,16,.4)'; ctx.beginPath(); ctx.ellipse(x, fl, (rxS + 64) * s, 26 * s, 0, 0, TAU); ctx.fill();
  const top = y - (ryS * 2 + 80) * s, bw = (rxS + 36) * s;
  if (kind === 'arm') {
    ctx.beginPath(); ctx.moveTo(x - bw, y + 24 * s); ctx.lineTo(x - bw, top + 60 * s); ctx.quadraticCurveTo(x - bw, top, x - bw + 60 * s, top); ctx.lineTo(x + bw - 60 * s, top); ctx.quadraticCurveTo(x + bw, top, x + bw, top + 60 * s); ctx.lineTo(x + bw, y + 24 * s); ctx.closePath();
    ctx.fillStyle = lg(0, top, 0, y, [[0, shade(col, 1.25)], [1, shade(col, .8)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke();
    ctx.fillStyle = shade(col, .6); for (const fx of [-.5, 0, .5]) for (const fy of [.3, .55]) { ctx.beginPath(); ctx.arc(x + fx * bw, lerp(top, y, fy), Math.max(2, 4.5 * s), 0, TAU); ctx.fill(); }
  } else {
    const bh = (ryS * 1.6 + 40) * s, tx = y - bh;
    ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = Math.max(5, 10 * s); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * (rxS * .86) * s, y - 30 * s); ctx.lineTo(x + sd * (rxS * .86) * s, tx - 36 * s); ctx.lineTo(x + sd * (rxS * .86 + 30) * s, tx - 40 * s); ctx.stroke(); }
    ctx.strokeStyle = '#8d96a4'; ctx.lineWidth = Math.max(3, 6 * s); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * (rxS * .86) * s, y - 30 * s); ctx.lineTo(x + sd * (rxS * .86) * s, tx - 36 * s); ctx.lineTo(x + sd * (rxS * .86 + 30) * s, tx - 40 * s); ctx.stroke(); }
    rr(x - rxS * .86 * s, tx, rxS * 1.72 * s, bh + 20 * s, 14 * s); ctx.fillStyle = lg(0, tx, 0, y, [[0, shade(col, 1.15)], [1, shade(col, .7)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke();
    for (const sd of [-1, 1]) { const wx = x + sd * (rxS + 40) * s, wy = (y + fl) / 2 - 8 * s, wr = (fl - y) * .5 + 56 * s;
      ctx.fillStyle = '#16181e'; ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.beginPath(); ctx.ellipse(wx, wy, 13 * s, wr, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c4cad6'; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.ellipse(wx + sd * 9 * s, wy, 4 * s, wr * .86, 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}
function chairFront(kind, x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; const aw = 40 * s;
  if (kind === 'arm') {
    for (const sd of [-1, 1]) { const ax = x + sd * (rxS + 34) * s; rr(ax - aw / 2, y - 120 * s, aw, 150 * s, 18 * s); ctx.fillStyle = lg(ax - aw / 2, 0, ax + aw / 2, 0, [[0, shade(col, 1.2)], [1, shade(col, .78)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke(); }
    rr(x - (rxS + 14) * s, y + 4 * s, (rxS + 14) * 2 * s, 40 * s, 14 * s); ctx.fillStyle = lg(0, y, 0, y + 44 * s, [[0, shade(col, 1.1)], [1, shade(col, .7)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.stroke();
    ctx.fillStyle = '#3a2418'; for (const sd of [-1, 1]) { rr(x + sd * (rxS - 6) * s - 9 * s, y + 42 * s, 18 * s, Math.max(6, fl - y - 40 * s), 4 * s); ctx.fill(); }
  } else {
    for (const sd of [-1, 1]) { const ax = x + sd * (rxS + 2) * s; rr(ax - 17 * s, y - 100 * s, 34 * s, 22 * s, 8 * s); ctx.fillStyle = '#2a2a33'; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.stroke();
      ctx.strokeStyle = '#8d96a4'; ctx.lineWidth = Math.max(3, 6 * s); ctx.beginPath(); ctx.moveTo(ax, y - 80 * s); ctx.lineTo(ax, y + 40 * s); ctx.lineTo(ax + sd * 8 * s, fl - 20 * s); ctx.stroke();
      ctx.fillStyle = '#16181e'; ctx.beginPath(); ctx.ellipse(ax + sd * 10 * s, fl - 6 * s, 15 * s, 12 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
      rr(ax - 22 * s + sd * 6 * s, fl - 32 * s, 44 * s, 10 * s, 4 * s); ctx.fillStyle = '#3a3f4a'; ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
/* a knitted lap blanket; up 0..1 pulls it from the lap toward the chin (top edge) */
function lapBlanket(x, y, s, rxS, col, pat, topY) {
  ctx.save(); ctx.lineJoin = 'round'; const w = (rxS + 6) * s, ty = topY ?? (y - 38 * s);
  ctx.beginPath(); ctx.moveTo(x - w, ty); ctx.quadraticCurveTo(x, ty - 16 * s, x + w, ty); ctx.lineTo(x + w * 1.06, y + 52 * s); for (let i = 6; i >= 0; i--) ctx.lineTo(x - w * 1.06 + (i / 6) * w * 2.12, y + 52 * s + (i % 2 ? 9 : 0) * s); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.6 * s); ctx.stroke(); ctx.clip();
  ctx.strokeStyle = pat; ctx.lineWidth = Math.max(2, 7 * s); for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / 4, ty - 40 * s); ctx.lineTo(x + i * w / 4, y + 70 * s); ctx.stroke(); } for (let j = 0; j < 8; j++) { ctx.beginPath(); ctx.moveTo(x - w * 1.1, ty + j * 22 * s); ctx.lineTo(x + w * 1.1, ty + j * 22 * s); ctx.stroke(); }
  ctx.restore();
}
function lapTray(x, y, s, rxS) {
  const w = (rxS + 24) * s, h = 30 * s;
  ctx.save(); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(10,6,18,.35)'; ctx.beginPath(); ctx.ellipse(x + 4 * s, y + 18 * s, w * 1.02, 16 * s, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y, w, h * .5, 0, 0, TAU); ctx.fillStyle = lg(0, y - h / 2, 0, y + h / 2, [[0, '#7fc8c0'], [1, '#4a948c']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.6 * s); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y + 4 * s, w * .9, h * .36, 0, 0, TAU); ctx.fillStyle = '#9fded6'; ctx.fill(); ctx.strokeStyle = 'rgba(28,20,14,.35)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
const BLANKET = { pear: ['#4a6fa8', 'rgba(255,255,255,.5)'], banana: ['#d8a83a', 'rgba(120,70,10,.45)'], cran: ['#e88aa0', 'rgba(255,240,240,.55)'], goji: ['#8a8f9c', 'rgba(40,44,60,.4)'] };

// ------------------------------------------------------------------ the cast of the day room
const DSPK = { goji: [['go1', 0], ['go2', 0]], pear: [['pe1', 0]], banana: [['ba1', 0]], cran: [['cr1', 0]], lemon: [['l1', 0], ['l2', 0]], mango: [['m1', 0]] };
const dSpeaks = (n, lt, a = .1, b = .25) => (DSPK[n] || []).some(([id]) => lt >= TD.ls(id) - a && lt < TD.le(id) + b);
/* drinking: Pear, Banana, Cranberry take a cup at their cupset and lift it at the slurp (Cranberry sips on her own, a beat after the cup lands); Goji lifts at 10.10 */
const DRINK = { goji: [DC.cupset1, DC.slurp1 - .1, 10.42, 10.6], pear: [DC.cupset2, DC.slurp2 - .12, 12.45, 12.62], banana: [DC.cupset3, DC.slurp3 - .12, 13.1, 13.3], cran: [DC.cupset4, DC.cupset4 + .38, 13.78, 14.0] };   /* [set down, cup lifted, lowered, put back] */
const drinkK = (n, lt) => { const d = DRINK[n]; return ss(lt, d[1], d[1] + .16) * (1 - ss(lt, d[2], d[3])); };
const cupOnTray = (n, lt) => { const d = DRINK[n]; return lt >= d[0] && (lt < d[1] || lt >= d[3]); };
function castD(lt) {
  const C = { res: {} }, plow = ss(lt, 15.85, 16.7), wake = 1 - ss(lt, 16.8, 17.0);
  for (const n of DRES) {
    const S = DSEAT[n], s = S.s, seatY = DFL - 62 * s, sp = dSpeaks(n, lt), dk = drinkK(n, lt), watch = 1 - ss(lt, 2.0, 2.5) * 0;
    const turn = sp ? 1 : 0, hy0 = lerp(-.95, -.3, sp ? ss(lt, TD.ls(DSPK[n][0][0]) - .15, TD.ls(DSPK[n][0][0]) + .05) : 0);
    let head = sp ? -.3 : -.92, yaw = -.4, look = sp ? [-.15, 0] : [-.75, -.2], expr = { pear: 'happy', banana: 'sour', cran: 'happy', goji: 'hopeful' }[n], lid = n === 'banana' ? .32 : n === 'goji' ? .28 : .2;
    if (n === 'goji') { const had = ss(lt, DC.slurp1 - .1, DC.slurp1 + .3); expr = lt < 9.9 ? 'hopeful' : dk > .3 ? 'chill' : lt >= DRINK.goji[2] ? 'chill' : 'hopeful'; if (lt > 10.4) expr = 'chill'; }
    if (n === 'pear') expr = lt >= DRINK.pear[1] && lt < DRINK.pear[2] ? 'chill' : 'happy';
    if (n === 'banana') { expr = lt >= DRINK.banana[1] && lt < DRINK.banana[2] ? 'shock' : lt >= DRINK.banana[2] && lt < 13.7 ? 'sour' : lt >= 3.7 && lt < 4.6 ? 'weak' : 'sour'; }
    if (n === 'cran') expr = lt >= DRINK.cran[1] ? 'smug' : 'happy';
    if (lt >= 15.6 && lt < 17.0) { head = lerp(-.92, .55, plow); look = [lerp(-.8, .8, plow), -.25]; yaw = lerp(-.4, .2, plow); }
    if (lt >= 12.0 && lt < 12.5 && n === 'pear') look = [-.3, .4];
    const o = Object.assign(A7[n]({}), { x: S.x, y: seatY, s, t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true, yaw, headYaw: head, look, expr, lid, who: n, arms: { l: 'rest', r: 'rest' } });
    const R = { o, y: seatY, s, n, up: 0 };
    if (n === 'pear') { o.acc = (o.acc || []).filter(a => a !== 'unionpin7' || true); }
    if (n === 'banana') {                                                           /* "It is cold.": he pulls the blanket up under his chin */
      R.up = ss(lt, TD.ls('ba1') + .1, TD.ls('ba1') + .42) * (1 - ss(lt, 6.6, 7.0)); const k2 = KINDS.banana, g = (px, py) => [px, py];
      if (R.up > .02) { o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: [-74, lerp(40, 30, R.up) - 14 * R.up], r: [88, lerp(40, 30, R.up) - 14 * R.up] }; }
    }
    if (n === 'cran') {                                                            /* "a hundred inches": her hand measures the air */
      const m = ss(lt, TD.wS('cr1', 6) - .2, TD.wS('cr1', 6) + .25) * (1 - ss(lt, TD.wE('cr1', 7) + .3, TD.wE('cr1', 7) + .7));
      if (m > .02) { o.arms = { l: 'rest', r: 'hold' }; o.grip = { r: [lerp(80, 150, m), lerp(60, -120, m)] }; o.hand = { r: 'flat' }; }
    }
    if (n === 'goji') {                                                            /* the empty cup upside down; then the cup of snow */
      const cup = lt < DRINK.goji[0] ? [1, PI, 0] : [1, 0, 1], lift = lt < DRINK.goji[0] ? ss(lt, 7.0, 7.5) * (1 - ss(lt, 9.3, 9.8)) : dk;
      o.arms = { l: 'rest', r: 'hold' }; o.hold = { r: 'fp20f_cup' }; o.cupScale = 1.5; o.cupTip = cup[1]; o.cupSnow = cup[2]; o.grip = { r: [lerp(92, 112, lift) - 30 * dk, lerp(18, 4, lift) + 30 * dk - 40 * dk * dk] };
      if (lt < DRINK.goji[0]) o.grip = { r: [lerp(92, 100, lift), lerp(30, -34, lift)] };
      else o.grip = { r: [lerp(96, 30, dk), lerp(40, 22, dk)] };
    }
    if (dk > .02 && n !== 'goji') {                                                   /* the cup comes up to the mouth */
      const k = KINDS[o.kind]; o.arms = { l: o.arms.l, r: 'hold' }; o.hold = { r: 'fp20f_cup' }; o.cupScale = 1.35; o.cupSnow = .8; o.cupTip = 0;
      o.grip = { r: [lerp(k.rx * .75, k.rx * .3, dk), lerp(k.mouthY + 50, k.mouthY + 18, dk)] };
    }
    C.res[n] = R;
  }
  /* Lemon: the clipboard, a flat look; the tick on the pen cue */
  { const sp = dSpeaks('lemon', lt), tick = ss(lt, DC.pentick - .05, DC.pentick + .28), plowH = lt >= 15.6 && lt < 17.0 ? lerp(-.9, .5, plow) : -.7;
    C.lemon = A7.lemon({ x: DSTAND.lemon[0], y: DSTAND.lemon[1], s: .88, t: lt, yaw: -.35, headYaw: sp ? -.25 : plowH, look: sp ? [-.1, .05] : [plowH, -.1], expr: sp ? 'dead' : 'neutral', lid: sp ? .5 : .3, face: { curve: .02 }, acc: ['readers', 'lanyard7'], who: 'lemon', plant: true,
      arms: { l: 'hold', r: 'rest' }, hold: { l: 'fp20f_clip' }, clipScale: 1.45, tick, grip: { l: [-102, 8] } }); }
  /* Mango: the tray of cups on her right; she scoops snow from the heap on the sill (left window) with her left hand at 9.59 to 9.94 */
  { const sc = ss(lt, 9.3, 9.6), dip = ss(lt, 9.62, 9.76), up = ss(lt, 9.76, 9.92), sp = dSpeaks('mango', lt), reach = sc * (1 - ss(lt, 10.0, 10.4)), lift = 14 * reach;
    const hx = 150, hy = 1034, k = KINDS.mango, s = .88, cy = DSTAND.mango[1] - lift - s * ((k.leg || 90) + k.ry * .9);
    const gx = lerp(-70, (hx - DSTAND.mango[0]) / s, sc), gy = lerp(40, (hy - cy) / s + 8 * (1 - dip) - 6 * up, sc);
    C.mango = A7.mango({ x: DSTAND.mango[0], y: DSTAND.mango[1], s, t: lt, lift, yaw: lerp(-.3, -.75, sc), headYaw: sp ? -.3 : lerp(-.4, -.55, sc), look: sp ? [-.3, .2] : [-.6, .15], expr: sp ? 'dead' : 'neutral', lid: sp ? .5 : undefined, who: 'mango', plant: true, armScale: lerp(1.12, 1.38, sc),
      arms: { l: sc > .02 ? 'hold' : 'rest', r: 'hold' }, hold: { l: sc > .02 ? 'fp20f_cup' : undefined, r: 'fp20f_tray' }, grip: { l: [gx, gy], r: [92, 50] }, cupScale: 1.6, cupSnow: dip * (1 - ss(lt, 9.95, 10.0)) * 1 + 0, cupTip: -.15, trayN: lt < DRINK.pear[0] ? 3 : lt < DRINK.banana[0] ? 2 : lt < DRINK.cran[0] ? 1 : 0, trayScale: 1.2, traySnow: 1 });
    if (sc <= .02) { C.mango.hold = { r: 'fp20f_tray' }; C.mango.arms = { l: 'rest', r: 'hold' }; C.mango.grip = { r: [92, 50] }; } }
  return C;
}
/* Mango's arm coming in from the left with a cup of snow (the shots on the residents): the hand lands at (tx, ty) on the cue and withdraws */
function dArm(lt, tSet, tx, ty, s) {
  const a = (lt - (tSet - .32)) / .32, b = (lt - tSet) / .34, k = a < 0 ? 0 : a < 1 ? eo(a) : 1 - ss(b, 0, 1) * 1;
  if (k <= .005) return;
  const hx = lerp(tx - 380 * s, tx, k), hy = lerp(ty - 70 * s, ty, k) - 22 * s * Math.sin(PI * c01(a)) * (a < 1 ? 1 : 0), sx = hx - 360 * s, sy = hy - 50 * s, ex = hx - 170 * s, ey = hy + 34 * s;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,6,16,.5)'; ctx.lineWidth = 22 * s; ctx.beginPath(); ctx.moveTo(sx, sy + 6); ctx.quadraticCurveTo(ex, ey + 6, hx, hy + 6); ctx.stroke();
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 18 * s; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ex, ey, hx, hy); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(sx, sy - 5 * s); ctx.quadraticCurveTo(ex, ey - 5 * s, hx, hy - 5 * s); ctx.stroke();
  ctx.fillStyle = '#4a4258'; rr(hx - 34 * s, hy - 11 * s, 14 * s, 22 * s, 4 * s); ctx.fill();
  ctx.save(); ctx.translate(hx, hy + 8 * s); paperCup(1.3 * s, lt < tSet + .12 ? 1 : .0, 0); ctx.restore();                                  /* the cup of snow */
  ctx.fillStyle = '#fbfaf6'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.ellipse(hx - 4 * s, hy, 19 * s, 16 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(hx + 2 * s, hy - 10 * s, 10 * s, 6 * s, -.3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ the shots of the day room
const DALL = ['mango', 'goji', 'pear', 'banana', 'cran', 'lemon'];
const DSH = [
  { id: 'open', s: 0, k: 'wide', x: 640, y: 1010, z: [.82, .98], show: DALL },
  { id: 'pe1', s: 2.50, k: 'face', foc: 'pear', z: [2.0, 2.12], up: 130, dx: -50, dof: 9, show: ['pear'], bg: ['goji', 'banana'] },
  { id: 'ba1', s: 3.72, k: 'face', foc: 'banana', z: [2.0, 2.12], up: 130, dx: -50, dof: 9, show: ['banana'], bg: ['pear', 'cran'] },
  { id: 'cr1', s: 4.54, k: 'face', foc: 'cran', z: [2.0, 2.15], up: 130, dx: -40, dof: 9, show: ['cran'], bg: ['banana', 'lemon'] },
  { id: 'go1', s: 6.92, k: 'face', foc: 'goji', z: [2.05, 2.2], up: 130, dx: 0, dof: 9, show: ['goji'], bg: ['mango', 'pear'] },
  { id: 'l1', s: 8.56, k: 'face', foc: 'lemon', z: [2.1, 2.2], up: 120, dof: 9, show: ['lemon'], bg: ['cran'] },
  { id: 'm1a', s: 9.59, k: 'pt', x: 215, y: 1060, z: [1.75, 1.85], dof: 9, show: ['mango'], bg: ['goji'] },
  { id: 'go2', s: 9.94, k: 'face', foc: 'goji', z: [2.1, 2.22], up: 130, dx: 20, dof: 9, show: ['goji'], bg: ['pear'], arm: ['goji', DC.cupset1] },
  { id: 'cp1', s: 11.66, k: 'face', foc: 'pear', z: [2.0, 2.1], up: 130, dx: 0, dof: 9, show: ['pear'], bg: ['goji', 'banana'], arm: ['pear', DC.cupset2] },
  { id: 'cp2', s: 12.42, k: 'face', foc: 'banana', z: [2.0, 2.1], up: 130, dx: 0, dof: 9, show: ['banana'], bg: ['pear', 'cran'], arm: ['banana', DC.cupset3] },
  { id: 'cp3', s: 13.02, k: 'face', foc: 'cran', z: [2.0, 2.1], up: 130, dx: 0, dof: 9, show: ['cran'], bg: ['banana', 'lemon'], arm: ['cran', DC.cupset4] },
  { id: 'l2', s: 13.71, k: 'face', foc: 'lemon', z: [2.2, 2.3], up: 120, dof: 9, show: ['lemon'], bg: ['cran'] },
  { id: 'plow', s: 15.55, k: 'wide', x: 640, y: 1030, z: [.86, .9], show: DALL },
  { id: 'mo1', s: 17.00, k: 'pt', x: 550, y: 486, z: [2.3, 2.5], obj: 'moon', show: [] },
  { id: 'end', s: 19.10, k: 'wide', x: 640, y: 1000, z: [.92, .86], show: DALL },
];
for (const sh of DSH) sh.s = sh.s === 0 ? 0 : TD.snapT(sh.s);
DSH.forEach((sh, i) => { sh.e = i + 1 < DSH.length ? DSH[i + 1].s : 99; });
const dShot = lt => { let r = DSH[0]; for (const sh of DSH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const charD = (C, n) => C.res[n] ? C.res[n].o : C[n];
let DR = null, DLT = [];
function camD(lt) {
  const sh = dShot(lt), C = castD(lt), st = dstate(lt), dur = sh.e > 90 ? TD.SCN.dur - sh.s : sh.e - sh.s, u = c01((lt - sh.s) / dur), z = lerp(sh.z[0], sh.z[1], easeIO(u));
  let cx = sh.x, cy = sh.y;
  if (sh.k === 'face') { const [fx, fy] = faceC(charD(C, sh.foc)); cx = fx - (sh.dx || 0) / z; cy = fy + sh.up / z; }
  zoomTo(cx, cy, z);
  const sway = { x: 2.2 * hnoise(lt, 1.3, 4), y: 1.6 * hnoise(lt, 1.1, 5), r: .0012 * hnoise(lt, .9, 6) };
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
  DR = { C, sh, st };
}
/* one resident with the chair, the blanket, the tray, the candle and the cup: back, the sitter, the front */
function drawResD(n, lt, R) {
  const S = DSEAT[n], k = KINDS[R.o.kind], rx = k.rx, ry = k.ry, s = S.s, x = S.x, y = R.y, up = R.up || 0, mouth = k.mouthY;
  chairBack(S.kind, x, y, s, S.col, ry, rx, DFL);
  drawChar(R.o);
  lapBlanket(x, y, s, rx, BLANKET[n][0], BLANKET[n][1], up > .01 ? lerp(y - 38 * s, y - (.9 * ry - mouth - 36) * s, up) : undefined);
  lapTray(x, y + 6 * s, s, rx);
  const ty = y + 8 * s;
  if (window.P20 && typeof P20.ledCandle === 'function') { const r = P20.ledCandle(ctx, { x: x - rx * .52 * s, y: ty, s: .78 * s, on: 1, t: lt, seed: 40 + DRES.indexOf(n), kind: 'tea' }); if (r) DLT.push({ kind: 'point', x: r.fx, y: r.fy, r: 250 * s, color: '#ffb468', power: .95, flicker: { seed: 40 + DRES.indexOf(n), amt: .1, rate: 1 } }); }
  if (cupOnTray(n, lt)) { ctx.save(); ctx.translate(x + rx * .5 * s, ty + 4 * s); paperCup(1.15 * s, lt < DRINK[n][1] ? 1 : .15, 0); ctx.restore(); }
  chairFront(S.kind, x, y, s, S.col, ry, rx, DFL);
}
function roomD(lt, st) {
  dWall(lt, st); dFloor(lt);
  for (let i = 0; i < 3; i++) dWindow(lt, i, st);
  dSill(lt, st); dShelf(lt, st); dArt(lt);
  dLamp(-30, lt, 1); dLamp(1275, lt, 2);
}
function drawD(lt) {
  const { C, sh, st } = DR;
  V2.setLight({ key: [-.4, -.55], keyColor: '#ffd9a0', keyA: .26, rim: '#9fc4ff', rimA: .36, shadow: '#14102a', shadowA: .38, bounce: '#ffb870', bounceA: .2, amb: '#6a5a90', ambA: .1, frontDark: .04 }); V2.opts.reflect = false;
  DLT = [];
  const bgCast = () => { if (!sh.bg) return; REG.suppress++; for (const n of sh.bg) { const o = charD(C, n); if (!o) continue; const f = inFrame(Object.assign({}, o, { y: o.y }), 20); if (f.inter) { if (C.res[n]) drawResD(n, lt, C.res[n]); else drawChar(o); } } REG.suppress--; };
  const stand = n => { const o = C[n]; if (o) drawChar(o); };
  if (sh.dof) { SOFT++; V2.dof(sh.dof, () => { roomD(lt, st); bgCast(); }); SOFT--; } else roomD(lt, st);
  /* the row, left to right, then the two standing nurses */
  const order = sh.show.filter(n => C.res[n]).sort((a, b) => DSEAT[a].x - DSEAT[b].x);
  const showM = sh.show.includes('mango'), showL = sh.show.includes('lemon');
  if (showM) stand('mango');
  for (const n of order) drawResD(n, lt, C.res[n]);
  if (showL) stand('lemon');
  /* Mango's arm and the cup of snow, in the close-ups on the residents */
  if (sh.arm) { const n = sh.arm[0], S = DSEAT[n], k = KINDS[C.res[n].o.kind]; dArm(lt, sh.arm[1], S.x + k.rx * .5 * S.s, C.res[n].y + 8 * S.s - 6, S.s); }
  /* the lights: warm candles and lamps, the cool windows, three dim downlights */
  const lights = DLT.slice();
  for (const c of DCL) lights.push({ kind: 'point', x: c.x, y: c.y, r: 190, color: '#ffbe70', power: .55, flicker: { seed: c.seed + 3, amt: .1, rate: 1 } });
  for (const lx of [-30, 1275]) lights.push({ kind: 'point', x: lx, y: 740, r: 520, color: '#ffc884', power: .9 });
  for (const [x0, x1] of DBAY) lights.push({ kind: 'rect', x: (x0 + x1) / 2, y: 690, w: x1 - x0 - 30, h: 640, color: '#8fb0ff', power: .5 });
  for (const lx of [330, 700, 1070]) lights.push({ kind: 'cone', x: lx, y: 336, ang: PI / 2, spread: 1.2, len: 900, color: '#ffe6c0', power: .42 });
  lightPass({ ambient: .56, tint: '#10163a', lights, bloom: .5, vignette: .3, lift: .1, t: lt, glow: .3 });
  /* the amber beacon of the plow crossing the room: one slow pass, never a strobe */
  const pw = ss(lt, 15.55, 15.95) * (1 - ss(lt, 16.5, 16.95));
  if (pw > .01) {
    const bx = lerp(-380, 1560, ss(lt, 15.55, 16.95)); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(bx, 1000); ctx.rotate(.28);
    ctx.fillStyle = lg(-300, 0, 300, 0, [[0, 'rgba(255,170,60,0)'], [.5, 'rgba(255,170,60,' + .25 * pw + ')'], [1, 'rgba(255,170,60,0)']]); ctx.fillRect(-300, -1500, 600, 3000); ctx.restore();
  }
}
const DAYROOM = {
  shot: lt => dShot(lt).id,
  cam: camD,
  draw: drawD,
  fx: lt => ({ bloom: .55 + .45 * Math.max(0, 1 - Math.abs(lt - DC.sting - .05) / .25), vignette: .4, grain: .045, contrast: .08, sat: .08, tint: [['#ffb87a', .05, 'soft-light']] }),
  blur: lt => 1,
  over() {},
  clock: () => TD.SCN.clock, label: () => TD.SCN.label,
};
window.__EP20_SCENES = window.__EP20_SCENES || {}; window.__EP20_SCENES.dayroom = DAYROOM;

/*@@END@@*/
})();
