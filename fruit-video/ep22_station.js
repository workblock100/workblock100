'use strict';
/* SHIFT HAPPENS, Episode 22: "The Secret Santa". Builder E22-STATION. Scenes `draw` (3:15 PM, THE DRAW, 30.09 s) and `swap` (9:00 PM, THE EXCHANGE, 26.89 s), both at the nurses' station.
 * Registers window.__EP22_SCENES.draw / .swap. Holiday wear and props come from window.A22 (ep22_art.js) and the soft bodies from window.SOFT2D (soft2d.js) when they have landed; until then this file
 * draws its own stand-ins (every kit call is checked at DRAW time, never at load). The gift pile is a baked PHYS2D sim (ep22_swap_rigid_sim.js); the paper torn off the five gifts is a baked SOFT2D sim
 * (ep22_swap_sim.js) once SOFT2D has landed, a hand-animated tear until then.
 *
 * THE STATION (both scenes): one flat stage, world px, floor line FL 1250. Left to right: the end of the hall (a window: the winter afternoon, or the night), the nurses' station (the counter x 260-1470,
 * top 1040: the small tree at the left end, the jar candles, the monitor, the laptop where Binder lives at the right end), the wall behind it (a shelf with string lights and named stockings, the
 * NURSES' STATION sign, the round wall clock), then Brenda's closet (NOT A CLOSET, x 1560-1740) and the hall. Tinsel hangs along the counter's front edge.
 * Speakers are drawn sharp and 300 px or taller while they speak; V2.dof is only ever used for the room and for silent listeners. Text only through the UI kit.
 */
(() => {
if (!window.TIMELINE_EP22 || !window.H6 || !window.UI || !window.A7 || !window.A11 || !window.A15) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rg = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : (v => v - Math.floor(v))(Math.sin(s * 127.1 + k * 311.7) * 43758.5453);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const mixc = (a, b, k) => '#' + V2.mix(a, b, c01(k)).map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${q(r)},${q(g)},${q(b)})`; };
const shadeH = (c, f) => '#' + V2.rgb(c).map(v => Math.round(Math.max(0, Math.min(255, v * f))).toString(16).padStart(2, '0')).join('');
const rgbaH = (c, a) => { const [r, g, b] = V2.rgb(c); return `rgba(${r},${g},${b},${a})`; };
const INKC = 'rgba(25,16,30,.82)';
const pulse = (lt, t0, hz = 30, tau = .1) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } };
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; if (window.FX18 && typeof FX18.glow === 'function') FX18.glow(ctx, { x, y, r, color: 'rgb(' + V2.rgb(color).join(',') + ')', alpha: a, core: core ?? .4 }); else V2.glow(x, y, r, V2.rgb(color).join(','), Math.min(1, a), 'screen', .3); };
const puff = (x, y, r, lt, t0, o = {}) => { if (lt < t0 || lt > t0 + (o.life || .8) + .05) return; if (window.FX18 && typeof FX18.puff === 'function') FX18.puff(ctx, Object.assign({ x, y, r, t: lt, t0 }, o)); else { const k = sg(lt, t0, t0 + (o.life || .8)); ctx.save(); ctx.globalAlpha *= .7 * (1 - k); ctx.fillStyle = o.color || '#efe6d6'; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, d = r * .55 * eo(k); ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * .6, r * (.3 + .4 * eo(k)), 0, TAU); ctx.fill(); } ctx.restore(); } };
/* a four-point twinkle star */
function star4(x, y, r, a, col = '255,250,220') {
  if (r < .8 || a <= .01) return;
  ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r * .38, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r * .38, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - r * .7, y); ctx.quadraticCurveTo(x, y, x, y - r * .16); ctx.quadraticCurveTo(x, y, x + r * .7, y); ctx.quadraticCurveTo(x, y, x, y + r * .16); ctx.quadraticCurveTo(x, y, x - r * .7, y); ctx.fill();
}

// ------------------------------------------------------------------ the frozen timeline: beats, words, frame snapping (helpers as in ep21_arrive.js / ep18_station.js)
const TLX = window.TIMELINE_EP22;
function tl(id) {
  const SCN = TLX.scenes.find(s => s.id === id), START = SCN.start, LN = {};
  for (const l of TLX.lines) if (l.scene === id) LN[l.id] = l;
  return { SCN, START, LN, bS: b => SCN.beats[b].s, bE: b => SCN.beats[b].e, ls: b => LN[b].s - START, le: b => LN[b].e - START,
    wS: (b, i) => LN[b].s - START + LN[b].words[i][1], wE: (b, i) => LN[b].s - START + LN[b].words[i][2], snapT: t => Math.round((START + t) * 30) / 30 - START };
}
/* the loudness of a recorded line at scene time lt (0..1, from the mouth track) */
function voice(T0, id, lt) {
  const l = T0.LN[id]; if (!l) return 0;
  const f = (lt - (l.s - T0.START)) * 30; if (f < 0 || f >= l.mouth.length) return 0;
  const i = Math.floor(f), j = Math.min(l.mouth.length - 1, i + 1), u = f - i, dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
  return lerp(dg(i), dg(j), u);
}
const TD = tl('draw'), TS = tl('swap');
/* is line `id` being spoken at lt (with a little lead and tail for the acting) */
const talking = (T0, id, lt, a = .08, b = .18) => !!T0.LN[id] && lt >= T0.ls(id) - a && lt < T0.le(id) + b;
/* a shot table: starts snapped to frames, ends filled in, lookup with an epsilon (the boundary frame is the NEW shot) */
function shots(T0, list) {
  for (const sh of list) sh.s = sh.s === 0 ? 0 : T0.snapT(sh.s);
  list.forEach((sh, i) => { sh.e = i + 1 < list.length ? list[i + 1].s : T0.SCN.dur + .1; });
  return lt => { let r = list[0]; for (const sh of list) if (lt >= sh.s - 1e-6) r = sh; return r; };
}

// ------------------------------------------------------------------ text: hero only where it is safe (big enough, clear of the edges, the caption zone and the clock pill)
let SOFT = 0;                                              /* > 0 while a blurred background is drawn: its text is never hero */
let HEROMODE = false;                                      /* true only while a shot draws its subject sharp */
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
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: o.crop !== undefined ? o.crop : !hero }));
}

// ------------------------------------------------------------------ frame tests (as ep21_arrive.js): is a character wholly / partly inside the frame?
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s - (o.topExtra || 0) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function inFrame(o, pad = 0) {
  const b = boxOf(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
/* draw a character only when it is wholly inside the frame, or (a camera move carrying it through an edge) as a body in transit; never at scale 0 */
/* the face box of a character on the screen (as v2_char registers it) */
function faceScr(o) {
  const k = KINDS[o.kind], s = o.s || 1, cy = o.y - (o.lift || 0) - ((o.noLegs ? 0 : (k.leg || 90)) + k.ry * .9) * s, er = (k.er || 20), hw = (k.eyeX + er * 1.45) * s;
  const a = toScr(o.x - hw, cy + (k.eyeY - er * 1.42 - 14) * s), b = toScr(o.x + hw, cy + (k.mouthY + 55 * (k.mw || 26) / 26) * s);
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}
function drawIn(o, pad = 12) {
  if (!o || (o.s || 0) < .02) return;
  const f = inFrame(o, pad);
  if (!f.inter) return;
  if (!f.whole) {
    o = Object.assign({}, o, { transit: true });
    /* our own gate (audit only): a face that straddles the frame edge in a shot that is not a move through the edge */
    if (REG.on && !REG.suppress && !o.edgeOK) { const b = faceScr(o); if (b[2] > 0 && b[0] < W && b[3] > 0 && b[1] < H && (b[0] < 0 || b[2] > W || b[1] < 0)) REG.errors.push(`fp22s: half face at the frame edge: ${o.id || o.kind} [${b.map(Math.round)}]`); }
  }
  drawChar(o);
}
const sorted = list => list.filter(Boolean).sort((a, b) => (a.y + (a.dz || 0)) - (b.y + (b.dz || 0)));
/* the screen point of a world point under the current transform */
const toScr = (x, y) => { const m = ctx.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };

// ------------------------------------------------------------------ the kits: A22 (holiday wear and props) and SOFT2D (soft bodies), checked at DRAW time; stand-ins until they land
const hasA = n => !!(window.A22 && typeof A22[n] === 'function');
const hasSoft = () => !!(window.SOFT2D && typeof SOFT2D.world === 'function' && typeof SOFT2D.drawCloth === 'function');
/* a Santa hat on any cast member: A22.santaHat, else a red beanie with a white cuff and pom (A20.winter, hat only), else the options unchanged */
function santa(o, g = {}) {
  if (hasA('santaHat')) { const r = A22.santaHat(Object.assign(o, g.hatColor ? { hatColor: g.hatColor } : {}, g.hatFlop != null ? { hatFlop: g.hatFlop } : {})); return r || o; }
  if (window.A20 && typeof A20.winter === 'function') return A20.winter(o, { hat: 'beanie', hatColor: g.hatColor || '#d3262e', cuffColor: '#fbf8f0', pom: true, pomColor: '#ffffff', scarf: false, mittens: false, boots: false, coat: false, wind: g.wind || 0 });
  return o;
}
/* Binder wears the kit's hat only (the stand-in beanie does not fit a flat clip) */
const binderHat = b => (hasA('santaHat') ? santa(b, { hatColor: '#d3262e' }) : b);
/* Tomato's ugly holiday sweater, when the kit has it (no stand-in: the knit would cover her face, which is most of her) */
const sweater = o => (hasA('sweater') ? (A22.sweater(o) || o) : o);

// ================================================================== PROPS: A22 when it has landed, our stand-ins until then (pure functions of their arguments and t; ctx saved and restored)
/* slow twinkle for one bulb: .3 to .8 Hz, its own phase, never fully off (photosensitivity: never in sync, never a flash) */
const twk = (t, ph) => .62 + .38 * Math.sin(TAU * (.3 + .5 * ((ph * 7.31) % 1)) * t + ph * TAU);
const BULB = ['#ff4d4d', '#ffd23f', '#4dd2ff', '#7dff7a', '#ff8ae6', '#ffa94d'];
/* the wrapping paper prints (a cached tile, drawn as a pattern): stripes, dots, trees, candy, plain */
const TILES = {};
function printTile(kind, c1, c2) {
  const id = kind + c1 + c2; if (TILES[id]) return TILES[id];
  const cv = V2.mk(64, 64), g = cv.getContext('2d'); cv.__txOK = true;
  g.fillStyle = c1; g.fillRect(0, 0, 64, 64);
  if (kind === 'stripes') { g.fillStyle = c2; for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * 32, 64); g.lineTo(i * 32 + 14, 64); g.lineTo(i * 32 + 78, 0); g.lineTo(i * 32 + 64, 0); g.closePath(); g.fill(); } }
  else if (kind === 'dots') { g.fillStyle = c2; for (const [x, y] of [[16, 16], [48, 48], [48, 16 - 64], [16, 48 + 64]]) { g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); } g.beginPath(); g.arc(48, 16, 4, 0, TAU); g.arc(16, 48, 4, 0, TAU); g.fill(); }
  else if (kind === 'trees') { for (const [x, y] of [[18, 26], [50, 58], [50, -6]]) { g.fillStyle = c2; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 10, y + 8); g.lineTo(x - 10, y + 8); g.closePath(); g.fill(); g.fillStyle = '#7a4a2a'; g.fillRect(x - 2, y + 8, 4, 5); g.fillStyle = '#ffe36b'; g.beginPath(); g.arc(x, y - 14, 2.4, 0, TAU); g.fill(); } g.fillStyle = 'rgba(255,255,255,.8)'; for (const [x, y] of [[44, 18], [10, 52], [34, 40]]) { g.beginPath(); g.arc(x, y, 1.8, 0, TAU); g.fill(); } }
  else if (kind === 'candy') { g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.lineCap = 'round'; for (const [x, y] of [[14, 10], [46, 42]]) { g.beginPath(); g.moveTo(x, y + 20); g.lineTo(x, y + 4); g.arc(x + 6, y + 4, 6, PI, 0); g.stroke(); } g.strokeStyle = c2; g.lineWidth = 2.6; for (const [x, y] of [[14, 10], [46, 42]]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x - 3.5, y + 8 + k * 5); g.lineTo(x + 3.5, y + 5 + k * 5); g.stroke(); } }
  g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, 0, 64, 32);
  return (TILES[id] = cv);
}
/* the print callback (ctx, w, h) the soft cloth uses, so a simulated paper and a drawn gift look the same (A22.paperPrint when the kit has it) */
function paperPrint(kind, c1, c2) {
  if (hasA('paperPrint')) { const f = A22.paperPrint(kind, c1, c2); if (typeof f === 'function') return f; }
  return (c, w, h) => { const p = c.createPattern(printTile(kind, c1, c2), 'repeat'); c.fillStyle = p || c1; c.fillRect(0, 0, w, h); };
}
const ribbonPath = (x0, y0, x1, y1, w) => { ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); };
/* a stick-on bow: loops of satin ribbon round a knot. o = { x, y (the knot), s, color, t, droop 0..1 (the loops sag into a U), seed } */
function bowP(o) {
  if (hasA('bow') && !o.droop) return A22.bow(ctx, { x: o.x, y: o.y, s: (o.s || 1) * 1.3, color: o.color, t: o.t, seed: o.seed });
  const s = o.s || 1, col = o.color || '#d6202c', dk = shade(col, .66), lt2 = mixc(col, '#ffffff', .35), dr = o.droop || 0, sw = .04 * Math.sin((o.t || 0) * 1.6 + (o.seed || 0));
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.rotate(sw); ctx.lineJoin = 'round';
  const loop = (dir, up) => {                          /* one loop: a teardrop from the knot out to the side; `up` 1 rises, 0 droops */
    const ex = dir * 74, ey = lerp(26, -38, up) + 14 * dr, cx1 = dir * 18, cy1 = lerp(46, -70, up) + 30 * dr, cx2 = dir * 96, cy2 = lerp(60, -14, up) + 20 * dr;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(cx1, cy1, cx2 + dir * 20, cy2 - 30, ex, ey); ctx.bezierCurveTo(cx2 + dir * 6, cy2 + 26, dir * 30, 30 + 12 * dr, 0, 0); ctx.closePath();
    ctx.fillStyle = lg(0, -40, 0, 60, [[0, lt2], [.6, col], [1, dk]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dir * 14, lerp(18, -12, up)); ctx.quadraticCurveTo(dir * 46, lerp(30, -34, up) + 10 * dr, dir * 62, ey - 4); ctx.stroke();
  };
  /* the tails */
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 4, 6); ctx.quadraticCurveTo(d * 30, 40, d * 22 + d * 10 * Math.sin((o.t || 0) * 2 + d), 78); ctx.lineTo(d * 38, 70); ctx.quadraticCurveTo(d * 38, 36, d * 10, 4); ctx.closePath(); ctx.fillStyle = dk; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; ctx.stroke(); }
  loop(-1, 1 - dr); loop(1, 1 - dr); loop(-1, .25 * (1 - dr)); loop(1, .25 * (1 - dr));
  ctx.fillStyle = lg(-14, -14, 14, 14, [[0, lt2], [1, dk]]); ctx.beginPath(); ctx.ellipse(0, 2, 17, 14, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.restore();
}
/* a wrapped gift: o = { x, y (bottom centre), w, h, paper, color, color2, ribbon (colour | false), bow (colour | false), t, rot, seed, lid 0..1 (the lid lifts), tear: { k 0..1, t (s since it began) } (the hand-animated rip),
 * inside (fn(x0, y0, x1, y1) draws what is in the box), noBow } . Returns the box [x0, y0, x1, y1] in the current frame. */
function giftP(o) {
  if (hasA('gift') && !o.tear && !o.inside && !o.bowBig && !o.mine) { const r = A22.gift(ctx, Object.assign({}, o, { ribbon: o.ribbon !== false, ribbonColor: typeof o.ribbon === 'string' ? o.ribbon : undefined, bow: !!o.bow && !o.noBow, bowColor: typeof o.bow === 'string' ? o.bow : undefined })); if (r) return r; }
  const w = o.w || 140, h = o.h || 110, c1 = o.color || '#c62828', c2 = o.color2 || '#f4f1ea', rib = o.ribbon === undefined ? '#ffd23f' : o.ribbon;
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.lineJoin = 'round';
  const x0 = -w / 2, y0 = -h, tk = o.tear ? c01(o.tear.k) : 0;
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.beginPath(); ctx.ellipse(0, 2, w * .56, 9, 0, 0, TAU); ctx.fill();
  /* the open box under the paper: brown cardboard, the thing inside */
  if (tk > 0) { ctx.fillStyle = '#c9a26a'; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = '#7a5a34'; ctx.fillRect(x0 + 8, y0 + 6, w - 16, 16); if (o.inside) o.inside(x0, y0, w / 2, 0); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(x0, y0, w, h); }
  /* the paper: whole, or torn in strips that peel away from the top (ragged white edges) */
  const n = 4, sw = w / n, pat = ctx.createPattern(printTile(o.paper || 'stripes', c1, c2), 'repeat');
  for (let i = 0; i < n; i++) {
    const ki = tk > 0 ? c01((tk - i * .1) / .62) : 0, sx = x0 + i * sw, dir = i < n / 2 ? -1 : 1;
    if (ki >= 1) continue;
    ctx.save();
    if (ki > 0) { ctx.translate(sx + sw / 2, y0 + h); ctx.rotate(dir * (.5 + .3 * rnd(o.seed || 1, i)) * eo(ki) * 2.2); ctx.translate(-(sx + sw / 2), -(y0 + h)); ctx.globalAlpha *= 1 - ss(ki, .75, 1); }
    ctx.beginPath(); ctx.moveTo(sx, y0 + h);
    const jag = k => (rnd((o.seed || 1) * 3 + i, k) - .5) * 9;
    for (let k = 0; k <= 8; k++) ctx.lineTo(sx + (i ? jag(k) * (tk > 0 ? 1 : 0) : 0), y0 + h - h * k / 8);
    for (let k = 0; k <= 8; k++) ctx.lineTo(sx + sw + (i < n - 1 ? jag(k + 20) * (tk > 0 ? 1 : 0) : 0), y0 + h * k / 8);
    ctx.closePath(); ctx.fillStyle = pat || c1; ctx.fill();
    if (tk > 0) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.4; ctx.stroke(); }
    ctx.restore();
  }
  if (tk <= 0) {
    ctx.fillStyle = lg(x0, 0, x0 + w, 0, [[0, 'rgba(255,255,255,.12)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.18)']]); ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x0, y0 + 16, w, 3);                                            /* the lid's edge */
    if (rib) { ctx.fillStyle = rib; ctx.fillRect(-9, y0, 18, h); ctx.fillRect(x0, y0 + h * .46 - 9, w, 18); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-9, y0, 5, h); }
    ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(x0, y0, w, h);
    if (o.bow && !o.noBow) bowP(o.bowBig ? { x: 0, y: y0 + 10, s: o.bowS || 1.3, droop: .85, color: o.bow, t: o.t, seed: o.seed } : { x: 0, y: y0 + 4, s: Math.min(w, 160) / 200, color: o.bow || rib || '#d6202c', t: o.t, seed: o.seed });
  }
  ctx.restore();
  return [o.x - w / 2, o.y - h, o.x + w / 2, o.y];
}
/* the jar candle: VANILLA SUGAR COOKIE, the same candle every time. o = { x, y (bottom centre), s, lit 0..1, t } */
function candleP(o) {
  if (hasA('candle')) return A22.candle(ctx, o);
  const s = o.s || 1;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.beginPath(); ctx.ellipse(0, 2, 50, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(-44, 0, 44, 0, [[0, '#e9dcc2'], [.4, '#fff7e8'], [1, '#d8c7a6']]); rr(-44, -112, 88, 112, 12); ctx.fill();                       /* the wax in the jar */
  ctx.fillStyle = 'rgba(190,220,235,.35)'; rr(-46, -118, 92, 118, 13); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();      /* the glass */
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(-36, -108, 9, 90, 4); ctx.fill();
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-46, -78, 92, 46); ctx.fillStyle = '#f6e7c8'; ctx.fillRect(-46, -73, 92, 36); ctx.strokeStyle = INKC; ctx.lineWidth = 1.6; ctx.strokeRect(-46, -78, 92, 46);
  ctx.fillStyle = '#8a4b2a'; ctx.beginPath(); ctx.arc(-20, -55, 7, 0, TAU); ctx.arc(20, -55, 7, 0, TAU); ctx.fill();                                /* two little cookies on the label */
  ctx.fillStyle = '#3a2a20'; ctx.fillRect(-1.5, -126, 3, 12);
  const lit = c01(o.lit || 0);
  if (lit > .01) { const fl = 1 + .06 * Math.sin((o.t || 0) * 7.3) + .04 * Math.sin((o.t || 0) * 11.1); ctx.fillStyle = `rgba(255,190,80,${.9 * lit})`; ctx.beginPath(); ctx.moveTo(0, -152 * fl); ctx.quadraticCurveTo(9, -132, 0, -124); ctx.quadraticCurveTo(-9, -132, 0, -152 * fl); ctx.fill(); glow(0, -134, 60, '#ffcf7a', .5 * lit, .5); }
  ctx.restore();
  return [o.x - 46 * s, o.y - 126 * s, o.x + 46 * s, o.y];
}
/* YELLOW grip socks (non-skid dots), a pair. o = { x, y (the cuffs' centre), s, rot, t } */
function socksP(o) {
  if (hasA('gripSocks')) return A22.gripSocks(ctx, o);
  const s = o.s || 1;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.rotate(o.rot || 0); ctx.lineJoin = 'round';
  for (const [dx, r] of [[-30, -.12], [30, .1]]) {
    ctx.save(); ctx.translate(dx, 0); ctx.rotate(r + .05 * Math.sin((o.t || 0) * 2.2 + dx));
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-26, 120); ctx.quadraticCurveTo(-28, 160, 6, 162); ctx.quadraticCurveTo(44, 164, 46, 136); ctx.quadraticCurveTo(44, 116, 26, 108); ctx.lineTo(26, 0); ctx.closePath();
    ctx.fillStyle = lg(-26, 0, 46, 0, [[0, '#ffe45c'], [1, '#f2b705']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-26, 0, 52, 16); ctx.strokeRect(-26, 0, 52, 16);
    ctx.fillStyle = 'rgba(255,255,255,.95)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-14 + (i % 3) * 14 + (i > 5 ? 10 : 0), 118 + Math.floor(i / 3) * 13, 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}
/* the white mug, WORLD'S OKAYEST NURSE on its face (UI kit text, hero when held up big). o = { x, y (bottom centre), s, t, hero, id } */
function mugP(o) {
  if (hasA('mug')) return A22.mug(ctx, Object.assign({ text: "WORLD'S OKAYEST NURSE" }, o));
  const s = o.s || 1, w = 220, h = 210;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.strokeStyle = '#e9edf2'; ctx.lineWidth = 26; ctx.beginPath(); ctx.ellipse(w / 2 + 6, -h * .52, 44, 58, 0, -1.25, 1.25); ctx.stroke();
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(w / 2 + 6, -h * .52, 57, 71, 0, -1.2, 1.2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(w / 2 + 6, -h * .52, 31, 45, 0, -1.3, 1.3); ctx.stroke();
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#dfe5ec'], [.35, '#ffffff'], [1, '#cfd6df']]); ctx.beginPath(); ctx.moveTo(-w / 2, -h); ctx.lineTo(w / 2, -h); ctx.lineTo(w / 2 - 6, -14); ctx.quadraticCurveTo(w / 2 - 8, 0, w / 2 - 28, 0); ctx.lineTo(-w / 2 + 28, 0); ctx.quadraticCurveTo(-w / 2 + 8, 0, -w / 2 + 6, -14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#c9d0d9'; ctx.beginPath(); ctx.ellipse(0, -h, w / 2, 16, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6b4a32'; ctx.beginPath(); ctx.ellipse(0, -h + 2, w / 2 - 12, 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8193a'; ctx.beginPath(); ctx.arc(0, -h * .5 - 2, 4, 0, TAU); ctx.fill();
  UI.container(o.id || 'fp22s_mug', 'board', [-w / 2 + 14, -h + 26, w / 2 - 14, -12], 4);
  const hero = !!o.hero;
  TXT("WORLD'S", 0, -h + 62, { size: 30, fill: '#c2185b', weight: 900, spacing: 1, maxW: w - 40, hero, cid: o.id || 'fp22s_mug' });
  TXT('OKAYEST', 0, -h + 106, { size: 38, font: 'Bangers', weight: 400, fill: '#1f3166', spacing: 2, maxW: w - 34, hero, cid: o.id || 'fp22s_mug' });
  TXT('NURSE', 0, -h + 150, { size: 34, fill: '#c2185b', weight: 900, spacing: 2, maxW: w - 40, hero, cid: o.id || 'fp22s_mug' });
  ctx.restore();
  return [o.x - (w / 2 + 64) * s, o.y - (h + 16) * s, o.x + (w / 2 + 64) * s, o.y];
}

/* a drawn (not simulated) inflated purple nitrile glove with its knot. o = { x, y (the knot), s, rot, t, puff 0..1, color, face, seed } */
function gloveB(o) {
  if (hasA('gloveBalloon')) return A22.gloveBalloon(ctx, Object.assign({}, o, { y: o.y - 104 * (o.s || 1) }));
  const s = o.s || 1, pf = c01(o.puff ?? 1), col = o.color || '#8e6cd8', dk = shade(col, .62), sw = .06 * Math.sin((o.t || 0) * 1.3 + (o.seed || 0) * 2);
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.rotate((o.rot || 0) + sw); ctx.lineJoin = 'round';
  const R = lerp(22, 40, pf), fl = lerp(26, 46, pf), fr = lerp(7, 12, pf);
  ctx.fillStyle = lg(-R, -110, R, 0, [[0, mixc(col, '#ffffff', .35)], [.55, col], [1, dk]]);
  ctx.beginPath(); ctx.ellipse(0, -62, R * 1.05, R * 1.0, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) { const a = -2.3 + i * .48, fx = Math.cos(a) * R * .95, fy = -62 + Math.sin(a) * R * .95; ctx.save(); ctx.translate(fx, fy); ctx.rotate(a + PI / 2); ctx.beginPath(); ctx.ellipse(0, -fl * .5, fr, fl * .62, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(-R * .98, -54); ctx.rotate(-1.05); ctx.beginPath(); ctx.ellipse(0, -fl * .36, fr * .95, fl * .5, 0, 0, TAU); ctx.fill(); ctx.restore();   /* the thumb */
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, -62, R * 1.05, R, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-R * .35, -62 - R * .45, R * .28, R * .16, -.5, 0, TAU); ctx.fill();
  ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(-9, -24); ctx.lineTo(9, -24); ctx.lineTo(5, -6); ctx.lineTo(-5, -6); ctx.closePath(); ctx.fill(); ctx.stroke();   /* the cuff */
  ctx.beginPath(); ctx.arc(0, -3, 6, 0, TAU); ctx.fill(); ctx.stroke();                                                                                       /* the knot */
  if (o.face) { ctx.strokeStyle = 'rgba(20,20,40,.75)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(-9, -66, 2.4, 0, TAU); ctx.arc(9, -66, 2.4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -60, 10, .3, PI - .3); ctx.stroke(); }
  ctx.restore();
}
/* Strawberry's gift: a pudding cup wrapped in a blue Chux pad (quilted), paper tape, a glove-balloon bow on a string. o = { x, y (bottom centre), s, t, seed, rise (the balloon's string length) } */
function pudGift(o) {
  const s = o.s || 1, t = o.t || 0, sd = o.seed || 1;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const bx = 3 * Math.sin(t * 1.1 + sd), by = -(o.rise ?? 150);
  ctx.strokeStyle = 'rgba(240,240,250,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -78); ctx.quadraticCurveTo(10, by * .5 - 40, bx, by - 40); ctx.stroke();
  gloveB({ x: bx, y: by - 36, s: .75, t, seed: sd, face: sd % 2 === 1 });
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.beginPath(); ctx.ellipse(0, 2, 52, 8, 0, 0, TAU); ctx.fill();
  /* the Chux bundle: a quilted blue pad gathered round the cup, the white border showing at the gather */
  ctx.beginPath(); ctx.moveTo(-48, 0); ctx.quadraticCurveTo(-54, -44, -30, -68); ctx.lineTo(-12, -86); ctx.lineTo(0, -74); ctx.lineTo(12, -88); ctx.lineTo(30, -68); ctx.quadraticCurveTo(54, -44, 48, 0); ctx.closePath();
  ctx.fillStyle = lg(-50, 0, 50, 0, [[0, '#5d9be0'], [.45, '#8cc0f2'], [1, '#3f78bf']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.6; for (let i = -6; i < 8; i++) { ctx.beginPath(); ctx.moveTo(i * 14, 0); ctx.lineTo(i * 14 + 60, -90); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 14, 0); ctx.lineTo(i * 14 - 60, -90); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.moveTo(-14, -84); ctx.lineTo(0, -72); ctx.lineTo(14, -86); ctx.lineTo(10, -94); ctx.lineTo(0, -82); ctx.lineTo(-10, -92); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f1e6cf'; ctx.save(); ctx.rotate(-.08); ctx.fillRect(-40, -38, 80, 13); ctx.restore(); ctx.strokeStyle = 'rgba(80,60,40,.4)'; ctx.lineWidth = 1.2; ctx.save(); ctx.rotate(-.08); ctx.strokeRect(-40, -38, 80, 13); ctx.restore();   /* the paper tape */
  ctx.restore();
  return [o.x - 54 * s, o.y + (by - 110) * s, o.x + 54 * s, o.y];
}
/* a sagging string of coloured bulbs from a to b; returns the bulbs [{ x, y, color, phase }] so the scene can light them (A22.stringLights when the kit has it) */
function lightsP(o) {
  if (hasA('stringLights')) { const r = A22.stringLights(ctx, o); if (r && r.lights) return r.lights; if (Array.isArray(r)) return r; }
  const [ax, ay] = o.a, [bx, by] = o.b, n = o.n || 12, sag = o.sag || 40, t = o.t || 0, L = [];
  const at = u => [lerp(ax, bx, u), lerp(ay, by, u) + sag * 4 * u * (1 - u)];
  ctx.save(); ctx.strokeStyle = '#2f4a2a'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const [x, y] = at(i / 24); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, [x, y] = at(u), ph = rnd(o.seed || 3, i), col = BULB[(i + (o.seed || 0)) % BULB.length], b = twk(t, ph) * (o.power ?? 1);
    ctx.fillStyle = '#3a4a34'; ctx.fillRect(x - 4, y, 8, 8);
    ctx.fillStyle = mixc(shadeH(col, .5), col, b);
    ctx.beginPath(); ctx.ellipse(x, y + 17, 7.5, 11, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(20,20,30,.5)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${.35 + .4 * b})`; ctx.beginPath(); ctx.ellipse(x - 2.5, y + 13, 2.2, 3.6, 0, 0, TAU); ctx.fill();
    L.push({ x, y: y + 17, color: col, phase: ph, b });
  }
  ctx.restore();
  return L;
}
/* the glow of the bulbs (a lit scene: L20.lamps, else our glows); slow, unsynced twinkle */
function lightsGlow(L, t, a = 1, r = 46) {
  if (!L || !L.length) return;
  if (window.L20 && typeof L20.lamps === 'function') { L20.lamps(ctx, L.map(b => ({ x: b.x, y: b.y, r, color: b.color, alpha: .55 * a * (b.b ?? twk(t, b.phase)), core: .5 })), { t }); return; }
  for (const b of L) glow(b.x, b.y, r, b.color, .45 * a * (b.b ?? twk(t, b.phase)), .5);
}
/* a small decorated tabletop tree (A22.tree when the kit has it): o = { x, y (the base on the counter), h, t, lights } -> { box, lights } */
function treeP(o) {
  if (hasA('tree')) { const r = A22.tree(ctx, Object.assign({ lights: true, skirt: false, gifts: 0, glow: o.glow ?? .55, s: (o.h || 300) / 520 }, o, { h: 520 })); if (r) return { box: r.box, lights: r.lights || [] }; }
  const h = o.h || 300, t = o.t || 0, w = h * .62, L = [];
  ctx.save(); ctx.translate(o.x, o.y); ctx.lineJoin = 'round';
  ctx.fillStyle = '#b5523a'; rr(-w * .2, -h * .14, w * .4, h * .14, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();      /* the pot */
  ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-8, -h * .2, 16, h * .08);
  for (let k = 0; k < 3; k++) {                                                                                                                       /* three tiers */
    const yb = -h * (.18 + k * .24), yt = yb - h * .42, ww = w * (1 - k * .24) / 2;
    ctx.beginPath(); ctx.moveTo(-ww, yb); for (let j = 0; j <= 6; j++) ctx.lineTo(-ww + ww * 2 * j / 6, yb + (j % 2 ? 10 : 0)); ctx.lineTo(0, yt); ctx.closePath();
    ctx.fillStyle = lg(-ww, 0, ww, 0, [[0, '#2f8f4e'], [.5, '#3fae5f'], [1, '#1f6b39']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  }
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { const y = -h * (.3 + k * .22); ctx.beginPath(); ctx.moveTo(-w * (.42 - k * .1), y + 8); ctx.quadraticCurveTo(0, y + 26, w * (.42 - k * .1), y - 6); ctx.stroke(); }
  const B = [[-.26, .3], [.22, .36], [-.08, .48], [.16, .58], [-.18, .66], [.06, .76], [-.3, .24], [.3, .24]];
  B.forEach(([u, v], i) => { const x = u * w, y = -h * v, col = ['#d6202c', '#2b6cff', '#ffd23f', '#e8e8f0'][i % 4]; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(20,20,30,.5)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x - 2.5, y - 2.5, 2.4, 0, TAU); ctx.fill(); });
  const LB = [[-.34, .26], [.1, .3], [.36, .22], [-.2, .44], [.24, .46], [-.06, .62], [.14, .7], [-.14, .78]];
  LB.forEach(([u, v], i) => { const ph = rnd(41, i), b = twk(t, ph) * (o.power ?? 1), col = BULB[(i * 2 + 1) % BULB.length], x = u * w, y = -h * v; ctx.fillStyle = mixc('#555555', col, .4 + .6 * b); ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); L.push({ x: o.x + x, y: o.y + y, color: col, phase: ph, b }); });
  ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#a77a00'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 9 : 22; ctx.lineTo(Math.cos(a) * r, -h * .96 + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
  glow(o.x, o.y - h * .96, 70, '#fff1a8', .3 + .1 * Math.sin(t * 1.7), .4);
  ctx.restore();
  return { box: [o.x - w / 2, o.y - h, o.x + w / 2, o.y], lights: L };
}
/* tinsel along a polyline (A22.tinsel for a SOFT2D rope's points when the kit has it): fluffy strands, a slow sparkle */
function tinselP(pts, o = {}) {
  if (hasA('tinsel')) return A22.tinsel(ctx, pts, o);
  const col = o.color || '#d9b23a', t = o.t || 0, w = o.width || 22;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = shade(col, .7); ctx.lineWidth = w * .55; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 6));
    for (let k = 0; k < n; k++) {
      const u = k / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u), id = i * 97 + k, a = rnd(o.seed || 5, id) * TAU, L = w * (.35 + .4 * rnd(o.seed || 5, id + 3));
      ctx.strokeStyle = rnd(o.seed || 5, id + 7) > .5 ? col : mixc(col, '#fff6c0', .45); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * .8 + 3); ctx.stroke();
    }
  }
  for (let i = 0; i < 9; i++) { const j = Math.floor(rnd(o.seed || 5, 300 + i) * (pts.length - 1)), [x, y] = pts[j], tw = Math.max(0, Math.sin(t * (1.1 + .8 * rnd(9, i)) + i * 2.1)); star4(x + (rnd(7, i) - .5) * w, y + (rnd(8, i) - .5) * w * .6, 9 * tw, .8 * tw); }
  ctx.restore();
}
/* a named stocking hanging from a hook (A22.stocking when the kit has it): o = { x, y (the hook), s, name, color, t, seed } */
function stockingP(o) {
  if (hasA('stocking')) {                                /* the kit's stocking without its name; the name ours (dressing that may be cropped at a frame edge) */
    const k = .5 * (o.s || 1); A22.stocking(ctx, { x: o.x, y: o.y + 4, s: k, color: o.color, t: o.t, seed: o.seed, dir: 1 });
    if (o.name) TXT(o.name, o.x, o.y + 4 + 19 * k, { size: 17 * k * 1.1, fill: '#8a1622', weight: 900, maxW: 84 * k, hero: false, crop: true });
    return;
  }
  const s = o.s || 1, col = o.color || '#c62828', sw = .03 * Math.sin((o.t || 0) * 1.2 + (o.seed || 0));
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(sw); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-30, 30); ctx.lineTo(-30, 118); ctx.quadraticCurveTo(-30, 150, 2, 150); ctx.lineTo(34, 150); ctx.quadraticCurveTo(56, 148, 56, 128); ctx.quadraticCurveTo(54, 110, 30, 106); ctx.lineTo(30, 30); ctx.closePath();
  ctx.fillStyle = lg(-30, 0, 56, 0, [[0, mixc(col, '#ffffff', .15)], [1, shade(col, .8)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#fbfaf4'; rr(-36, 4, 72, 34, 10); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8a8f9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -6); ctx.stroke();
  if (o.name) { UI.container(o.id || 'fp22s_stk', 'board', [-34, 6, 34, 36], 2); TXT(o.name, 0, 21, { size: 16, fill: '#7a1e1e', weight: 900, maxW: 62, hero: false, cid: o.id || 'fp22s_stk' }); }
  ctx.restore();
}
/* a folded name slip: o = { x, y, s, rot, unfold 0..1, name (UI-kit text, shown when open), t, hero } */
function slipP(o) {
  if (hasA('nameSlip')) return A22.nameSlip(ctx, o);
  const s = o.s || 1, u = c01(o.unfold || 0), w = 120, h = lerp(30, 58, u);
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,20,30,.18)'; ctx.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  ctx.fillStyle = '#fffdf5'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = 'rgba(60,50,40,.55)'; ctx.lineWidth = 1.6; ctx.strokeRect(-w / 2, -h / 2, w, h);
  if (u < .9) { ctx.strokeStyle = 'rgba(60,50,40,.35)'; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke(); ctx.fillStyle = 'rgba(220,214,196,.8)'; ctx.fillRect(-w / 2, -h / 2, w, h * .5 * (1 - u)); }
  else ctx.fillStyle = 'rgba(60,50,40,.18)', ctx.fillRect(-w / 2 + 10, h / 2 - 9, w - 20, 2);
  ctx.restore();
}

/* Tomato's Santa hat used as the draw hat: held upside down by the fur brim, the red cone hanging below with its pom, folded name slips poking up out of it. o = { x, y (the brim's centre), s, t, slips (how many
 * are left, 0..14), shake (s since the shake began, or -1), tilt, glow 0..1 (Binder's magic) } (A22.secretSantaHat when the kit has it) */
const HATW = 210;                                          /* the brim's width at s = 1 */
function hatNamesP(o) {
  if (hasA('secretSantaHat')) return A22.secretSantaHat(ctx, Object.assign({}, o, { slips: Math.round(o.slips ?? 12) }));
  const s = o.s || 1, t = o.t || 0, sh = o.shake ?? -1, jig = sh >= 0 && sh < 1.1 ? Math.sin(sh * 26) * Math.exp(-sh * 2.6) : 0, n = Math.round(o.slips ?? 12);
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s); ctx.rotate((o.tilt || 0) + .05 * jig); ctx.lineJoin = 'round';
  const rx = HATW / 2, ry = 30, sway = 8 * Math.sin(t * 1.3) + 18 * jig;
  /* the cone hanging below the brim, its tip and pom flopping to one side */
  ctx.beginPath(); ctx.moveTo(-rx + 6, 4); ctx.bezierCurveTo(-rx + 10, 120, -10 + sway, 170, 60 + sway, 196); ctx.bezierCurveTo(30 + sway, 150, rx - 4, 100, rx - 6, 4); ctx.closePath();
  ctx.fillStyle = lg(-rx, 0, rx, 0, [[0, '#ff5a52'], [.5, '#d3262e'], [1, '#8e1418']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-rx + 30, 30); ctx.quadraticCurveTo(-rx + 34, 110, 10 + sway, 160); ctx.stroke();
  const px = 64 + sway, py = 204;
  ctx.fillStyle = rg(px - 8, py - 8, 4, 34, [[0, '#ffffff'], [1, '#d9dce6']]); ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = 28 + 3 * Math.sin(i * 2.7); ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.55)'; ctx.lineWidth = 2; ctx.stroke();
  /* the opening, the slips standing in it, then the front of the fur brim */
  ctx.fillStyle = '#5a0c10'; ctx.beginPath(); ctx.ellipse(0, 0, rx - 8, ry - 8, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / 14, x = (u - .5) * (rx * 1.5), h = 30 + 22 * rnd(17, i), bounce = 16 * Math.abs(Math.sin(sh * 20 + i * 1.7)) * Math.exp(-Math.max(0, sh) * 3) * (sh >= 0 ? 1 : 0), r = (rnd(19, i) - .5) * .7 + .3 * jig * (rnd(23, i) - .5);
    ctx.save(); ctx.translate(x, 2 - bounce * (rnd(29, i) > .4 ? 1 : 0)); ctx.rotate(r);
    ctx.fillStyle = i % 3 ? '#fffdf4' : '#fff4c8'; ctx.fillRect(-15, -h, 30, h); ctx.strokeStyle = 'rgba(60,50,40,.55)'; ctx.lineWidth = 1.6; ctx.strokeRect(-15, -h, 30, h);
    ctx.strokeStyle = 'rgba(60,50,40,.3)'; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, 0); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = lg(0, -ry, 0, ry + 14, [[0, '#ffffff'], [1, '#d4d8e2']]);
  ctx.beginPath(); ctx.ellipse(0, 0, rx + 10, ry + 12, 0, 0, PI); ctx.ellipse(0, 0, rx - 10, ry - 10, 0, PI, 0, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.55)'; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, rx + 10, ry + 12, 0, PI, TAU); ctx.lineWidth = 16; ctx.strokeStyle = '#f2f3f8'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * (rx + 2), Math.sin(a) * (ry + 2) + 4, 7, 0, TAU); ctx.fill(); }
  if ((o.glow || 0) > .01) glow(0, -20, 220, '#c8ffe0', .5 * o.glow, .3);
  ctx.restore();
  return [o.x - (rx + 18) * s, o.y - 60 * s, o.x + (rx + 18) * s, o.y + 232 * s];
}

// ------------------------------------------------------------------ held props (EXT.prop, drawn at the hand; registered in PROP_BOX for the audit). Local units of the character.
/* the hat of names in both hands: drawn from the LEFT hand, the brim's centre o.hatDx to the right of it */
EXT.prop.fp22s_hat = (side, o, t) => { hatNamesP({ x: o.hatDx ?? 96, y: o.hatDy ?? 0, s: o.hatS || 1, t, slips: o.hatSlips ?? 12, shake: o.hatShake ?? -1, tilt: o.hatTilt || 0, glow: o.hatGlow || 0 }); };
PROP_BOX.fp22s_hat = o => { const s = o.hatS || 1, dx = o.hatDx ?? 96, dy = o.hatDy ?? 0; return [dx - (HATW / 2 + 18) * s, dy - 60 * s, dx + (HATW / 2 + 18) * s, dy + 232 * s]; };
/* a gift held in front in both hands: drawn from the LEFT hand; o.gift = { w, h, paper, color, color2, ribbon, bow, tear, inside, seed }, its bottom centre o.giftDx right of and o.giftDy below the hand */
EXT.prop.fp22s_gift = (side, o, t) => { const g = o.gift || {}; giftP(Object.assign({ x: o.giftDx ?? (g.w || 140) / 2 + 6, y: o.giftDy ?? (g.h || 110) / 2, t }, g)); if (o.giftOver) o.giftOver(t); };
PROP_BOX.fp22s_gift = o => { const g = o.gift || {}, w = g.w || 140, h = g.h || 110, dx = o.giftDx ?? w / 2 + 6, dy = o.giftDy ?? h / 2; return Object.assign([dx - w / 2 - (g.bowBig ? 40 : 0), dy - h - (g.bow ? (g.bowBig ? 28 : 30) : 0), dx + w / 2 + (g.bowBig ? 40 : 0), dy + 8], { nearFace: true }); };
/* a jar candle held up in one hand (its bottom at the hand, a little to the inside) */
EXT.prop.fp22s_candle = (side, o, t) => { candleP({ x: 0, y: 30, s: o.candleS || .9, lit: o.candleLit || 0, t }); };
PROP_BOX.fp22s_candle = o => { const s = o.candleS || .9; return Object.assign([-48 * s, 30 - 128 * s, 48 * s, 30], { nearFace: true }); };
/* the grip socks held up by their cuffs */
EXT.prop.fp22s_socks = (side, o, t) => { socksP({ x: 0, y: -8, s: o.socksS || .8, rot: o.socksRot || 0, t }); };
PROP_BOX.fp22s_socks = o => {                           /* the pair hangs from the cuffs (110 either side, 170 down at s 1), turned by socksRot about the cuffs: the box of the turned corners */
  const s = o.socksS || .8, r = o.socksRot || 0, c = Math.cos(r), n = Math.sin(r), P = [[-110, 0], [110, 0], [-110, 170], [110, 170]].map(([x, y]) => [(x * c - y * n) * s, -8 + (x * n + y * c) * s]);
  return Object.assign([Math.min(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[0])), Math.max(...P.map(p => p[1]))], { nearFace: true }); };
/* the mug held up by its base (the text faces us) */
EXT.prop.fp22s_mug = (side, o, t) => { mugP({ x: o.mugDx || 0, y: o.mugDy ?? 24, s: o.mugS || .6, t, hero: !!o.mugHero, id: 'fp22s_mugh' }); };
PROP_BOX.fp22s_mug = o => { const s = o.mugS || .6, dx = o.mugDx || 0, dy = o.mugDy ?? 24; return Object.assign([dx - 116 * s, dy - 216 * s, dx + 176 * s, dy], { nearFace: true }); };
/* Strawberry's Chux-wrapped pudding with its glove-balloon bow, offered on the palm */
EXT.prop.fp22s_pud = (side, o, t) => { pudGift({ x: 0, y: 26, s: o.pudS || .7, t, seed: side > 0 ? 2 : 1, rise: o.pudRise ?? 120 }); };
PROP_BOX.fp22s_pud = o => { const s = o.pudS || .7, r = o.pudRise ?? 120; return [-56 * s, 26 - (r + 112) * s, 56 * s, 26]; };

// ================================================================== THE STATION (draw by day, swap by night)
const FL = 1250;
const CT = { x0: 260, x1: 1470, top: 1040 };                                       /* the counter of the nurses' station */
const SHELF = { x0: 600, x1: 1460, y: 700 };                                       /* the wall shelf over the counter: string lights under its lip, the stockings hang from it */
const WIN = { x0: -330, x1: 130, y0: 430, y1: 960 };                               /* the window at the end of the hall */
const CLK = { x: 420, y: 560, r: 58 };                                             /* the round wall clock over the tree */
const TREE = { x: 372, h: 318 };                                                   /* the small tree on the counter's left end */
const LAP = { x: 1336, s: 1.5 };                                                   /* the laptop on the counter: Binder lives in it */
const MON = { x: 1010 };                                                           /* the monitor */
const CLOSET = { x0: 1560, x1: 1800, y0: 640, win: [1650, 930, 80, 120] };         /* Brenda's closet (NOT A CLOSET): the frame, the vision window [x, y, w, h] */
const STK = [['TOMATO', '#c62828'], ['ONION', '#2f7a4a'], ['MANGO', '#e8892a'], ['LEMON', '#c9a400'], ['PER DIEM', '#7a4fd8'], ['BRENDA', '#5a3a8a']];
/* st: { night 0..1, t, closet 0..1 (the door open a crack), binderLit 0..1 (the laptop glows), lapDiag (the laptop shows the diagram), lamp 0..1 (the desk lamp) } */
function stWall(st) {
  const n = st.night, top = mixc('#f3ead6', '#9aa9c8', n), bot = mixc('#e4d6ba', '#7f8eb0', n);
  ctx.fillStyle = lg(0, 240, 0, FL, [[0, top], [1, bot]]); ctx.fillRect(-1600, 240, 4800, FL - 240);
  ctx.strokeStyle = n > .5 ? 'rgba(20,30,60,.12)' : 'rgba(60,44,40,.08)'; ctx.lineWidth = 2;
  for (let x = -1400; x < 3000; x += 240) { ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x, FL - 30); ctx.stroke(); }
  ctx.fillStyle = mixc('#f7f1e4', '#a9b6d0', n); ctx.fillRect(-1600, FL - 30, 4800, 30); ctx.fillStyle = 'rgba(30,20,30,.3)'; ctx.fillRect(-1600, FL - 30, 4800, 3);
  /* the ceiling: a soffit band and two light panels */
  ctx.fillStyle = mixc('#ddd3c0', '#7a88a8', n); ctx.fillRect(-1600, -600, 4800, 846); ctx.fillStyle = 'rgba(40,30,40,.2)'; ctx.fillRect(-1600, 240, 4800, 6);
  for (const lx of [300, 900, 1500]) { poly([[lx - 130, 226], [lx + 130, 226], [lx + 118, 196], [lx - 118, 196]], n > .5 ? 'rgba(255,236,200,.9)' : 'rgba(255,255,246,.95)', INKC, 2.2); glow(lx, 240, 300, n > .5 ? '#ffe2b0' : '#fff8e1', .18, .1); }
}
function stWindow(st) {
  const Wn = WIN, n = st.night, w = Wn.x1 - Wn.x0, h = Wn.y1 - Wn.y0;
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(Wn.x0 + 10, Wn.y0 + 12, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(Wn.x0, Wn.y0, w, h); ctx.clip();
  ctx.fillStyle = lg(0, Wn.y0, 0, Wn.y1, [[0, mixc('#c9dcef', '#14244a', n)], [.7, mixc('#eef3f6', '#26386a', n)], [1, mixc('#f4f6f8', '#3a4c7e', n)]]); ctx.fillRect(Wn.x0, Wn.y0, w, h);
  ctx.fillStyle = mixc('#9aa8b4', '#0f1a36', n); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(Wn.x0 + 40 + i * 100, Wn.y1 - 60, 70, 40 + 12 * (i % 2), 0, PI, 0); ctx.fill(); }
  ctx.fillStyle = mixc('#ffffff', '#c9d6ee', n); ctx.fillRect(Wn.x0, Wn.y1 - 64, w, 64);                                  /* snow on the ground outside */
  if (n > .3) { ctx.fillStyle = `rgba(255,255,240,${.8 * n})`; for (let i = 0; i < 14; i++) { const x = Wn.x0 + rnd(31, i) * w, y = Wn.y0 + rnd(32, i) * h * .55, tw = .6 + .4 * Math.sin(st.t * (.4 + rnd(33, i) * .5) + i); ctx.beginPath(); ctx.arc(x, y, 1.6 + 1.2 * tw, 0, TAU); ctx.fill(); } }
  if (window.SN20 && typeof SN20.snow === 'function') SN20.snow(ctx, { x0: Wn.x0, y0: Wn.y0, x1: Wn.x1, y1: Wn.y1, t: st.t, seed: 22, layers: 2, density: 3, fall: .7, wind: 30, size: .7, tone: n > .5 ? 'dark' : 'light', fore: false });
  ctx.restore();
  ctx.strokeStyle = mixc('#f4f0e6', '#b8c4dc', n); ctx.lineWidth = 16; ctx.strokeRect(Wn.x0, Wn.y0, w, h); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo((Wn.x0 + Wn.x1) / 2, Wn.y0); ctx.lineTo((Wn.x0 + Wn.x1) / 2, Wn.y1); ctx.moveTo(Wn.x0, Wn.y0 + h * .48); ctx.lineTo(Wn.x1, Wn.y0 + h * .48); ctx.stroke();
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.strokeRect(Wn.x0 - 8, Wn.y0 - 8, w + 16, h + 16);
  ctx.fillStyle = mixc('#f4f0e6', '#b8c4dc', n); ctx.fillRect(Wn.x0 - 24, Wn.y1 + 6, w + 48, 18); ctx.strokeRect(Wn.x0 - 24, Wn.y1 + 6, w + 48, 18);   /* the sill */
  if (window.SN20 && typeof SN20.sill === 'function') SN20.sill(ctx, { x0: Wn.x0 + 10, x1: Wn.x1 - 10, y: Wn.y1 - 2, depth: 18, seed: 5, t: st.t, tone: 'light' });
}
/* the round wall clock: 3:15 by day, 9:00 at night (ticks, no numerals) */
function stClock(st) {
  const { x: cx, y: cy, r } = CLK, hh = st.night > .5 ? 9 : 3 + 15 / 60, mm = st.night > .5 ? 0 : 15;
  ctx.fillStyle = 'rgba(30,20,30,.18)'; ctx.beginPath(); ctx.arc(cx + 3, cy + 5, r + 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fbfbf6'; ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2b2f3a'; ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = '#2b2f3a'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.lineWidth = i % 3 ? 2 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r * .8, cy - Math.cos(a) * r * .8); ctx.lineTo(cx + Math.sin(a) * r * .95, cy - Math.cos(a) * r * .95); ctx.stroke(); }
  const hand = (a, L, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * L, cy - Math.cos(a) * L); ctx.stroke(); };
  hand(hh / 12 * TAU, r * .5, 5, '#2b2f3a'); hand((mm + st.t / 60) / 60 * TAU, r * .74, 3.4, '#2b2f3a'); hand((st.t % 60) / 60 * TAU, r * .82, 1.6, '#d6202c');
  /* a sprig of holly on top */
  ctx.fillStyle = '#2f8f4e'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + d * 16, cy - r - 8, 16, 7, d * .4, 0, TAU); ctx.fill(); } ctx.fillStyle = '#d6202c'; ctx.beginPath(); ctx.arc(cx - 4, cy - r - 10, 5, 0, TAU); ctx.arc(cx + 5, cy - r - 6, 5, 0, TAU); ctx.fill();
}
/* the sign, the shelf with its string lights and the named stockings; returns the bulbs */
function stDecor(st) {
  const n = st.night;
  if (!st.noSign) {
    ctx.fillStyle = mixc('#2f5f8a', '#24446a', n); rr(800, 440, 420, 80, 10); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(808, 446, 404, 14, 6); ctx.fill();
    UI.container('fp22s_sign', 'board', [800, 440, 1220, 520], 8); TXT("NURSES' STATION", 1010, 480, { size: 40, fill: '#ffffff', weight: 900, spacing: 3, maxW: 380, hero: false, cid: 'fp22s_sign' });
    /* a little wreath on the sign's corner */
    ctx.strokeStyle = '#2f8f4e'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(1236, 446, 30, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#3fae5f'; ctx.lineWidth = 5; ctx.setLineDash([6, 8]); ctx.stroke(); ctx.setLineDash([]); bowP({ x: 1236, y: 474, s: .32, color: '#d6202c', t: st.t, seed: 4 });
  }
  stClock(st);
  /* the shelf */
  ctx.fillStyle = mixc('#a87a50', '#6e5a58', n); rr(SHELF.x0, SHELF.y - 18, SHELF.x1 - SHELF.x0, 20, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = 'rgba(30,20,30,.2)'; ctx.fillRect(SHELF.x0 + 6, SHELF.y + 2, SHELF.x1 - SHELF.x0 - 12, 8);
  /* binders and a basket on the shelf */
  for (let i = 0; i < 7; i++) { ctx.fillStyle = ['#1f3166', '#c2272d', '#2f7a4a', '#7a4fd8'][i % 4]; ctx.fillRect(SHELF.x0 + 30 + i * 26, SHELF.y - 18 - 84, 22, 84); ctx.strokeStyle = INKC; ctx.lineWidth = 1.6; ctx.strokeRect(SHELF.x0 + 30 + i * 26, SHELF.y - 18 - 84, 22, 84); }
  ctx.fillStyle = '#c9a26a'; rr(SHELF.x1 - 210, SHELF.y - 78, 130, 60, 8); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.2; ctx.stroke();
  /* the stockings */
  STK.forEach(([nm, cl], i) => stockingP({ x: 690 + i * 130, y: SHELF.y + 4, s: .82, name: nm, color: cl, t: st.t, seed: i, id: 'fp22s_stk' + i }));
  /* the string lights sag under the shelf's lip in three swags */
  const L = [];
  for (let k = 0; k < 3; k++) { const a = SHELF.x0 + k * (SHELF.x1 - SHELF.x0) / 3, b = SHELF.x0 + (k + 1) * (SHELF.x1 - SHELF.x0) / 3; L.push(...lightsP({ a: [a + 6, SHELF.y + 2], b: [b - 6, SHELF.y + 2], sag: 46, n: 7, t: st.t, seed: 3 + k * 7, power: st.power ?? 1 })); }
  return L;
}
/* the counter: the tree, the monitor, the laptop (Binder's), the pen cup, the desk lamp; the front panel and the tinsel. Returns { lights, lap } */
function stCounter(st) {
  const n = st.night, top = CT.top;
  const tr = treeP({ x: TREE.x, y: top + 2, h: TREE.h, t: st.t, power: st.power ?? 1 });
  /* the monitor */
  ctx.fillStyle = '#2b2f3a'; rr(MON.x - 82, top - 172, 164, 112, 8); ctx.fill(); ctx.fillStyle = mixc('#a8d8ff', '#6fa8e8', n); rr(MON.x - 74, top - 164, 148, 96, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 4; i++) ctx.fillRect(MON.x - 64, top - 154 + i * 20, 80 + 30 * (i % 2), 7);
  ctx.fillStyle = '#3a3f4a'; ctx.fillRect(MON.x - 7, top - 60, 14, 52); rr(MON.x - 36, top - 12, 72, 12, 4); ctx.fill();
  /* the desk lamp at the left of the monitor (warm; on at night) */
  const lx = 820; ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx, top - 4); ctx.lineTo(lx + 30, top - 110); ctx.lineTo(lx - 10, top - 170); ctx.stroke();
  ctx.fillStyle = '#2f5f8a'; poly([[lx - 50, top - 150], [lx + 20, top - 196], [lx + 40, top - 160], [lx - 20, top - 120]], '#2f5f8a', INKC, 2.4); ctx.fillStyle = '#3a3f4a'; rr(lx - 30, top - 10, 60, 10, 4); ctx.fill();
  if ((st.lamp || 0) > .01) { glow(lx - 4, top - 132, 200, '#ffd59a', .5 * st.lamp, .5); if (window.FX18 && FX18.pool) FX18.pool(ctx, { x: lx - 30, y: top - 2, rx: 160, ry: 18, color: '#ffd59a', alpha: .45 * st.lamp }); }
  /* the laptop */
  let lap = null; if (!st.noLap && window.A15 && typeof A15.laptop === 'function') lap = A15.laptop(LAP.x, top + 2, { lapScale: LAP.s, lapScreen: true });
  if (lap && (st.binderLit || 0) > .01) glow(lap.cx, lap.cy, 120, '#beffdc', .35 * st.binderLit, .4);
  /* papers, the pen cup, a candy-cane mug */
  ctx.fillStyle = '#fbfaf2'; ctx.save(); ctx.translate(1150, top - 4); ctx.rotate(-.05); ctx.fillRect(-46, -8, 92, 10); ctx.restore();
  ctx.fillStyle = '#4a6fa8'; rr(1196, top - 56, 34, 54, 5); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
  for (const [dx, cl] of [[-8, '#c2272d'], [0, '#1f3166'], [9, '#2f7a4a']]) { ctx.strokeStyle = cl; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1213 + dx, top - 54); ctx.lineTo(1213 + dx * 1.6, top - 86); ctx.stroke(); }
  if (st.onCounter) st.onCounter(top);
  /* the front panel */
  ctx.fillStyle = lg(0, top, 0, FL, [[0, mixc('#d6c3a0', '#8f8aa0', n)], [1, mixc('#bea783', '#77728a', n)]]); ctx.fillRect(CT.x0, top + 12, CT.x1 - CT.x0, FL - top - 12);
  ctx.fillStyle = mixc('#8a6a4a', '#5e5068', n); rr(CT.x0 - 12, top, CT.x1 - CT.x0 + 24, 16, 5); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(40,30,30,.22)'; ctx.lineWidth = 2; for (let x = CT.x0 + 110; x < CT.x1; x += 110) { ctx.beginPath(); ctx.moveTo(x, top + 22); ctx.lineTo(x, FL - 8); ctx.stroke(); }
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.strokeRect(CT.x0, top + 12, CT.x1 - CT.x0, FL - top - 12);
  /* the tinsel along the front edge: swags between the hooks (the soft rope's points when the sim exists) */
  const tp = st.tinsel || tinselStand(st.t);
  for (const pts of tp) tinselP(pts, { t: st.t, color: '#d9b23a', width: 24, seed: 5 });
  return { lights: tr.lights, lap };
}
const TH_HOOKS = [CT.x0 + 4, 490, 735, 980, 1225, CT.x1 - 4];
/* the stand-in tinsel: catenary-ish swags between the hooks, swaying a little */
function tinselStand(t) {
  const out = [];
  for (let i = 0; i < TH_HOOKS.length - 1; i++) {
    const a = TH_HOOKS[i], b = TH_HOOKS[i + 1], sw = 3 * Math.sin(t * 1.1 + i * 1.7), pts = [];
    for (let k = 0; k <= 14; k++) { const u = k / 14; pts.push([lerp(a, b, u) + sw * Math.sin(PI * u), CT.top + 12 + 48 * 4 * u * (1 - u)]); }
    out.push(pts);
  }
  return out;
}
function stFloor(st) {
  const n = st.night, a = mixc('#d4ccbc', '#8a96ae', n), c = mixc('#bdb3a2', '#727e98', n);
  ctx.fillStyle = lg(0, FL, 0, 2400, [[0, a], [1, c]]); ctx.fillRect(-1600, FL, 4800, 1300);
  ctx.strokeStyle = 'rgba(60,46,50,.14)'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 9; i++) { const y = FL + 10 + Math.pow(i / 8, 1.7) * 900; ctx.beginPath(); ctx.moveTo(-1600, y); ctx.lineTo(3200, y); ctx.stroke(); }
  for (let x = -2400; x <= 4000; x += 190) { ctx.beginPath(); ctx.moveTo(x * .42 + 400, FL); ctx.lineTo(x * 1.55 - 100, 2300); ctx.stroke(); }
  ctx.fillStyle = lg(0, FL, 0, FL + 70, [[0, 'rgba(30,20,30,.2)'], [1, 'rgba(30,20,30,0)']]); ctx.fillRect(-1600, FL, 4800, 70);
}

/* Brenda's closet: a plain door hinged on its RIGHT edge (it swings toward us), a narrow vision window covered by the NOT A CLOSET sign; inside: a dim shelf, a mop, the glow of a bulb.
 * open 0..1 (a crack: about 50 degrees at 1). inside(x0, x1) draws what stands in the gap (Brenda), clipped to it. */
const inkS = w => { ctx.strokeStyle = INKC; ctx.lineWidth = w || 2.4; ctx.stroke(); };
function notACloset(cx, cy, s, rot, id, hero) {                                /* the paper sign, hand-lettered in marker (as Episode 21's) */
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
function stCloset(st, o = {}) {
  const C = CLOSET, x0 = C.x0, x1 = C.x1, y0 = C.y0, w = x1 - x0, op = c01(st.closet || 0), ang = 1.15 * eo(op), cw = Math.cos(ang), grow = 46 * Math.sin(ang);
  const n = st.night;
  ctx.fillStyle = 'rgba(30,20,30,.22)'; ctx.fillRect(x0 + 8, y0 + 8, w + 16, FL - y0 - 8);
  ctx.fillStyle = mixc('#e9e2d2', '#aab4cc', n); ctx.fillRect(x0 - 14, y0 - 14, w + 28, FL - y0 + 14); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.strokeRect(x0 - 14, y0 - 14, w + 28, FL - y0 + 14);
  const gx1 = x1 - w * cw;                                                       /* the gap runs from x0 to the door's free edge */
  if (op > .005) {
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, gx1 - x0 + 2, FL - y0); ctx.clip();
    ctx.fillStyle = lg(0, y0, 0, FL, [[0, '#3a3440'], [1, '#221e28']]); ctx.fillRect(x0, y0, w, FL - y0);
    ctx.fillStyle = '#6a5a4a'; for (const y of [800, 920]) ctx.fillRect(x0, y, w, 9);
    ctx.fillStyle = '#e8e6de'; for (let i = 0; i < 3; i++) ctx.fillRect(x0 + 8 + i * 18, 800 - 30, 15, 30);
    glow(x0 + 50, y0 + 60, 150, '#ffe2a0', .45 * op, .5);
    if (o.inside) o.inside(x0, gx1);
    ctx.restore();
  }
  /* the door: its free edge comes toward us (a little taller), the hinge stays on the right */
  poly([[gx1, y0 - grow], [x1, y0], [x1, FL], [gx1, FL + grow * .5]], lg(gx1, 0, x1, 0, [[0, mixc('#d8cdb8', '#9a9cb0', n)], [1, mixc('#c9bda6', '#8a8ca2', n)]]), INKC, 2.6);
  const k = cw, wx = x1 - (x1 - C.win[0]) * k - C.win[2] * k, ww = C.win[2] * k;
  if (k > .3) {
    ctx.strokeStyle = 'rgba(80,60,40,.25)'; ctx.lineWidth = 2; ctx.strokeRect(lerp(x1, x0 + 16, k), y0 + 30, (w - 32) * k, 220);
    ctx.fillStyle = '#b9bec9'; rr(lerp(x1, x0 + 20, k), 1146, 18 * k + 2, 40, 6); ctx.fill(); inkS(2);                                     /* the lever handle, by the free edge */
    if (k > .85) notACloset(x1 - (x1 - (C.win[0] + C.win[2] / 2)) * k, C.win[1] + C.win[3] / 2, 1, -.035, 'fp22s_nac', o.hero);
    else { ctx.fillStyle = '#fffdf6'; ctx.fillRect(wx, C.win[1] + 14, ww * 1.8, 92); }
  }
  /* a wreath on the frame above the door */
  ctx.strokeStyle = '#2f8f4e'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc((x0 + x1) / 2, y0 - 70, 40, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#3fae5f'; ctx.lineWidth = 6; ctx.setLineDash([7, 9]); ctx.stroke(); ctx.setLineDash([]);
  bowP({ x: (x0 + x1) / 2, y: y0 - 34, s: .4, color: '#d6202c', t: st.t, seed: 9 });
  ctx.fillStyle = '#2a2230'; ctx.fillRect(x0 + 14, FL - 5, w - 28, 5);
  return { gap: [x0, gx1] };
}
/* the sandwich Brenda is always eating (as Episode 21's) */
function sandwichArt(bite = 1) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (bite > 0) { ctx.beginPath(); ctx.rect(-60, -60, 120, 70); ctx.arc(34, -42, 18 * bite, 0, TAU, true); ctx.clip(); }
  ctx.fillStyle = '#e2bd84'; rr(-38, -12, 76, 14, 5); ctx.fill(); inkS(3);
  ctx.fillStyle = '#5fbf4a'; ctx.beginPath(); ctx.moveTo(-37, -12); for (let i = 0; i <= 9; i++) ctx.lineTo(-37 + i * 8.2, -12 - 6 - (i % 2) * 5); ctx.lineTo(37, -12); ctx.closePath(); ctx.fill(); inkS(2.4);
  ctx.fillStyle = '#ffc62e'; rr(-37, -22, 74, 6, 2); ctx.fill(); inkS(2.2);
  ctx.fillStyle = '#e8473a'; rr(-32, -28, 64, 6, 3); ctx.fill(); inkS(2.2);
  ctx.fillStyle = '#e8c58c'; rr(-39, -42, 78, 15, 6); ctx.fill(); inkS(3);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; rr(-30, -39, 40, 4, 2); ctx.fill();
  ctx.restore();
}
EXT.prop.fp22s_sandwich = (side, o, t) => { const S = o.sandScale || .9; ctx.save(); ctx.rotate(o.sandTilt || 0); ctx.scale(S, S); sandwichArt(1); ctx.restore(); };
PROP_BOX.fp22s_sandwich = o => { const S = o.sandScale || .9; return Object.assign([-42 * S, -46 * S, 42 * S, 6 * S], { nearFace: true }); };
/* the whole room behind the cast: back to front (the counter is drawn by the scene after anything that stands behind it) */
function stRoom(st, o = {}) {
  stWall(st); stWindow(st);
  const L = stDecor(st);
  const cl = st.noCloset ? null : stCloset(st, o.closet || {});
  stFloor(st);
  return { lights: L, closet: cl };
}

// ================================================================== DRAW: the cues, the cast, the choreography
const DC = { jingle: .3, sniffle: 5.058, pop: 11.437, shuffle: 14.87, whoosh: [15.57, 15.87, 16.17, 16.47], ding: 17.97, grin: 21.969, sting: 28.74 };
for (const k in DC) DC[k] = Array.isArray(DC[k]) ? DC[k].map(TD.snapT) : TD.snapT(DC[k]);
const DFL = FL + 20;                                                               /* the back row stands just in front of the counter */
const DX = { straw: 222, mango: 410, tom: 800, onion: 1124, lemon: 1316 };          /* the row at the station (Tomato a step forward in the middle) */
const DY = { straw: DFL, mango: DFL, tom: FL + 104, onion: DFL, lemon: DFL };
const DS = { straw: .84, mango: .86, tom: .9, onion: .84, lemon: .84 };
const DLAP = { x: 640 };                                                           /* the laptop sits between Mango and Tomato in this scene */
/* Tomato holds the hat of names out to her left (screen left) at chest height: the hand's local grip and the hat's offset from it */
const HAT = { grip: [-150, 34], dx: -112, dy: 8, s: .86 };
/* the hat's world point (its brim centre) for Tomato's options o (used by the camera and by the flight of the slips) */
function hatWorld(o) { const s = o.s, k = KINDS.tomato, cy = o.y - (o.lift || 0) - (k.leg + k.ry * .9) * s; return [o.x + (o.hatGrip ? o.hatGrip[0] : HAT.grip[0]) * s + (o.hatDx ?? HAT.dx) * s, cy + (o.hatGrip ? o.hatGrip[1] : HAT.grip[1]) * s + (o.hatDy ?? HAT.dy) * s]; }
/* how many slips are still in the hat at lt (they leave during the draw) */
const LAUNCH = [];                                                                 /* filled below: the launch time of each of the 12 slips */
const slipsLeft = lt => 12 - LAUNCH.filter(t0 => lt >= t0).length;
const lookAt = (o, tx, ty = 0, k = 1) => { const dx = tx - o.x; o.look = [Math.max(-1, Math.min(1, dx / 260)) * k, ty]; o.headYaw = Math.max(-.32, Math.min(.32, dx / 900)) * k; o.yaw = o.headYaw * .4; return o; };
function tomD(lt, sh) {
  let o = A15.tomato({ x: DX.tom, y: DY.tom, s: DS.tom, t: lt, who: 'tom', tomPose: 'fruit', plant: true, headset: false, hold: {}, arms: { l: 'rest', r: 'rest' } });
  o = santa(sweater(o), { wind: .1 * Math.sin(lt * .7) });
  Object.assign(o, { x: DX.tom, y: DY.tom, s: DS.tom });
  /* the hat of names in the left hand */
  const shake = lt - DC.jingle;
  o.arms = { l: 'hold', r: 'rest' }; o.hold = { l: 'fp22s_hat' }; o.grip = { l: HAT.grip.slice() }; o.hatDx = HAT.dx; o.hatDy = HAT.dy; o.hatS = HAT.s; o.hatSlips = slipsLeft(lt);
  o.hatShake = shake >= 0 && shake < 1.4 ? shake : (lt >= DC.shuffle && lt < DC.shuffle + 1.2 ? lt - DC.shuffle : -1);
  if (shake >= 0 && shake < 1.2) { const j = Math.sin(shake * 24) * Math.exp(-shake * 2.4); o.grip.l[0] += 10 * j; o.grip.l[1] += 7 * Math.abs(j); }
  o.expr = 'tom_fruit'; o.look = [-.2, 0];
  if (talking(TD, 't1', lt)) { const k = ss(lt, TD.wS('t1', 3) - .1, TD.wS('t1', 3) + .15); o.arms.r = k > .5 ? 'cheer' : 'wave'; o.lift = 10 * Math.abs(Math.sin((lt - TD.ls('t1')) * 7)) * k; o.look = [.1, -.05]; }
  if (sh.id === 'o1' || sh.id === 'm1') lookAt(o, sh.id === 'o1' ? DX.onion : DX.mango, 0);
  if (sh.id === 's1' || sh.id === 't2') { lookAt(o, DX.straw, .05); o.expr = sh.id === 't2' ? 'happy' : 'tom_fruit'; }
  if (sh.id === 't2') { o.arms.r = talking(TD, 't2', lt) ? 'point' : 'rest'; o.grip.l = [-120, 60]; o.hatTilt = .12; }
  if (lt >= DC.pop - .05 && lt < TD.ls('t3') - .2) { lookAt(o, DLAP.x, -.3); }
  if (sh.id === 't3') { const k = eb(sg(lt, TD.ls('t3') - .06, TD.ls('t3') + .2)); o.arms.r = 'cheer'; o.expr = 'happy'; o.lift = 22 * Math.max(0, Math.sin(PI * sg(lt, TD.ls('t3') - .05, TD.ls('t3') + .45))); o.grip.l = [lerp(-150, -136, k), lerp(34, -10, k)]; o.look = [-.6, -.3]; }
  if (sh.id === 'draw') { const g = ss(lt, DC.shuffle - .1, DC.shuffle + .3); o.grip.l = [lerp(-136, -140, g), lerp(-10, 0, g)]; o.look = [-.7, -.5]; o.expr = 'happy'; o.hatGlow = ss(lt, DC.shuffle, DC.shuffle + .3) * (1 - ss(lt, 17.4, 18.2)); }
  if (lt >= 18.8) { o.grip.l = HAT.grip.slice(); o.look = [0, -.35]; o.expr = 'tom_fruit'; }
  if (sh.id === 'l1' || sh.id === 'o2') lookAt(o, sh.id === 'l1' ? DX.lemon : DX.onion, -.1);
  if (sh.id === 's2' || sh.id === 's3') lookAt(o, DX.straw, 0);
  if (talking(TD, 't4', lt)) { o.arms.r = 'cheer'; o.expr = 'happy'; o.lift = 12 * Math.abs(Math.sin((lt - TD.ls('t4')) * 6)); o.look = [.2, -.1]; }
  if (sh.id === 't5') { const a = lt - TD.wS('t5', 1); o.expr = 'happy'; o.arms.r = 'cheer'; o.lift = 18 * Math.max(0, Math.sin(PI * c01(a / .5))); o.look = [.1, -.2];
    o.grip.l = [lerp(-150, -120, ss(lt, TD.ls('t5'), TD.wS('t5', 1))), lerp(34, -24, ss(lt, TD.ls('t5'), TD.wS('t5', 1)))]; o.hatTilt = -1.9 * ss(lt, TD.ls('t5') + .05, TD.wS('t5', 1)); o.hatSlips = 0; }
  return o;
}
function onionD(lt, sh) {
  const o = A15.onion({ x: DX.onion, y: DY.onion, s: DS.onion, t: lt, who: 'onion', pose: 'rest', cry: .55, plant: true });
  o.expr = 'onion_cry'; lookAt(o, DX.tom, 0);
  if (talking(TD, 'o1', lt)) { const sob = Math.max(0, 1 - Math.abs(lt - DC.sniffle - .08) / .3); Object.assign(o, { pose: 'free', arms: { l: 'cheer', r: 'rest' }, expr: 'happy', cry: .95, sob, look: [-.15, -.1], headYaw: -.12 }); o.joy = 1; }
  if (sh.id === 'b1' || sh.id === 'pop') lookAt(o, DLAP.x, -.3);
  if (lt > 18.8) lookAt(o, DX.tom, -.25);
  if (sh.id === 's2' || sh.id === 's3') lookAt(o, DX.straw, 0);
  if (talking(TD, 'o2', lt)) { const k = ss(lt, TD.ls('o2'), TD.ls('o2') + .3); Object.assign(o, { pose: 'free', arms: { l: 'hold', r: 'hold' }, hold: { l: 'fp22s_hug' }, grip: { l: [-52, 106], r: [54, 100] }, hugScale: .74, expr: 'happy', cry: 1, sob: .25 + .2 * Math.sin(lt * 9), look: [-.1, -.2], headYaw: -.1 + .05 * Math.sin(lt * 1.4) }); o.joy = k; }
  return o;
}
function mangoD(lt, sh) {
  const o = A7.mango({ x: DX.mango, y: DY.mango, s: DS.mango, t: lt, who: 'mango', expr: 'neutral', plant: true, arms: { l: 'rest', r: 'rest' } });
  lookAt(o, DX.tom, 0);
  if (sh.id === 'm1' || sh.id === 'l0') { const k = ss(lt, TD.ls('m1') - .3, TD.ls('m1') + .2); o.arms = { l: 'rest', r: 'hold' }; o.hold = { r: 'fp22s_candle' }; o.grip = { r: [lerp(70, 120, k), lerp(90, -10, k)] }; o.candleS = .82; o.expr = talking(TD, 'm1', lt) ? 'sad' : 'neutral'; o.look = [.4, -.05]; o.headYaw = .12;
    if (sh.id === 'l0') { lookAt(o, DX.lemon, 0); o.expr = 'shock'; } }
  if (sh.id === 'pop' || sh.id === 'b1') lookAt(o, DLAP.x, -.4);
  if (sh.id === 's2' || sh.id === 's3' || sh.id === 's1') lookAt(o, DX.straw, 0);
  if (lt > 18.8 && (sh.id === 'l1')) lookAt(o, DX.lemon, 0);
  return o;
}
function lemonD(lt, sh) {
  const o = A7.lemon({ x: DX.lemon, y: DY.lemon, s: DS.lemon, t: lt, who: 'lemon', expr: 'neutral', lid: .35, plant: true, arms: { l: 'rest', r: 'rest' } });
  lookAt(o, DX.tom, 0);
  if (sh.id === 'm1') lookAt(o, DX.mango, 0);
  if (sh.id === 'l0') { const k = ss(lt, TD.ls('l0') - .1, TD.ls('l0') + .35); o.arms = { l: 'hold', r: 'rest' }; o.hold = { l: 'fp22s_candle' }; o.grip = { l: [lerp(-60, -118, k), lerp(110, -6, k)] }; o.candleS = .82; o.lid = .5; o.look = [0, .05]; o.headYaw = 0; o.yaw = 0; }
  if (sh.id === 'pop' || sh.id === 'b1') lookAt(o, DLAP.x, -.4);
  if (talking(TD, 'l1', lt)) { o.arms = { l: 'point', r: 'rest' }; o.look = [-.5, -.3]; o.headYaw = -.14; o.lid = .3; o.expr = 'neutral'; }
  if (sh.id === 's2' || sh.id === 's3') lookAt(o, DX.straw, 0);
  return o;
}
function strawD(lt, sh) {
  const o = A11.straw({ x: DX.straw, y: DY.straw, s: DS.straw, t: lt, who: 'straw', expr: 'dead', lid: .5, plant: true, arms: { l: 'rest', r: 'rest' } });
  lookAt(o, DX.tom, 0);
  if (talking(TD, 's1', lt)) { o.expr = 'hopeful'; o.lid = .28; o.look = [.6, -.05]; o.browUp = 5; }
  if (sh.id === 't2' && lt > TD.wS('t2', 1)) { o.expr = 'dead'; o.lid = lerp(.28, .62, ss(lt, TD.wS('t2', 1), TD.wS('t2', 1) + .3)); o.look = [.1, .05]; o.headYaw = 0; }
  if (sh.id === 'pop' || sh.id === 'b1') lookAt(o, DLAP.x, -.4);
  if (talking(TD, 's2', lt)) { o.expr = 'neutral'; o.lid = .3; o.look = [.2, -.2]; o.browUp = 3; }
  if (sh.id === 'b2') { o.expr = 'shock'; }
  if (sh.id === 'o2' || sh.id === 't4') { o.expr = 'dead'; o.lid = .55; lookAt(o, sh.id === 'o2' ? DX.onion : DX.tom, 0); }
  if (talking(TD, 's3', lt)) { o.expr = 'dead'; o.lid = .42; o.look = [0, .1]; o.headYaw = 0; o.yaw = 0; const k = ss(lt, TD.wS('s3', 3) - .1, TD.wS('s3', 3) + .2); o.arms = { l: 'rest', r: k > .5 ? 'up' : 'rest' }; }
  if (sh.id === 't5') { o.expr = 'dead'; o.lid = .6; o.look = [.5, 0]; }
  return o;
}
/* Onion's policy binder hugged to her chest (as Episode 21's) */
EXT.prop.fp22s_hug = (side, o, t) => {
  const S = o.hugScale || 1, w = 112, h = 140;
  ctx.save(); ctx.scale(S, S); ctx.translate(52, 6); ctx.rotate(-.08); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(-w / 2, -h / 2, w / 2, h / 2, [[0, '#3d5aa0'], [1, '#1f3166']]); rr(-w / 2, -h / 2, w, h, 8); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.2; ctx.stroke();
  ctx.fillStyle = '#16224a'; rr(-w / 2, -h / 2, 16, h, 6); ctx.fill();
  ctx.fillStyle = '#e9ecf2'; rr(-w / 2 + 24, -h / 2 + 22, w - 40, 40, 4); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#c2272d'; ctx.fillRect(-w / 2 + 30, -h / 2 + 30, w - 52, 7); ctx.fillStyle = 'rgba(40,40,70,.5)'; ctx.fillRect(-w / 2 + 30, -h / 2 + 44, (w - 52) * .7, 6);
  ctx.restore();
};
PROP_BOX.fp22s_hug = Object.assign([-20, -70, 120, 90], { nearFace: true });
/* Onion's joy: little four-point sparkles round her face and a warm glow (as Episode 21's) */
function sparkles(o, k, lt, seed) {
  if (k <= .01) return;
  const [fx, fy] = faceC(o), s = o.s;
  glow(fx, fy, 260 * s, '#fff1b8', .3 * k, .2);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) {
    const ph = rnd(seed, i), a = ph * TAU + lt * (.3 + .2 * rnd(seed, i + 9)), d = (150 + 60 * rnd(seed, i + 20)) * s, tw = Math.max(0, Math.sin(lt * (2.4 + rnd(seed, i + 30) * 2) + ph * 9));
    star4(fx + Math.cos(a) * d, fy - 30 * s + Math.sin(a) * d * .7, (10 + 12 * tw) * s * k, .85 * tw * k, '255,248,210');
  }
  ctx.restore();
}

// ------------------------------------------------------------------ DRAW: Binder's assignment graph (screen space, drawn in over() over the veiled, blurred station)
/* the hub STRAWBERRY at (540, 900), about 420 px wide (the match cut into the wrap scene); twelve names round it on an ellipse (centre (540, 880), 388 x 440), clear of the caption zone and the clock pill */
const HUB = { x: 540, y: 900, w: 420, h: 112 };
const NODES = [
  ['MRS. CRANBERRY', 0, '#b0122e'], ['TOMATO', 30, '#e6321f'], ['EGGPLANT', 60, '#5b2a86'], ['LEMON', 90, '#e8c20a'], ['ONION', 120, '#c99a4a'], ['MR. GOJI', 150, '#ff5a3a'],
  ['MR. PEAR', 180, '#9bb52e'], ['BINDER', 210, '#22232a'], ['MANGO', 240, '#ff9d1c'], ['MELON', 270, '#c9985a'], ['BANANA', 300, '#e6c42a'], ['BRENDA', 330, '#5a3a8a'],
].map(([name, a, col], i) => ({ name, a, col, i, x: 540 + 388 * Math.sin(a * PI / 180), y: 880 - 440 * Math.cos(a * PI / 180) }));
const NODE_SIZE = 40, NODE_H = 62;
/* the order the slips leave the hat: the four in the room on the four whooshes, then the other eight at once */
const FIRST4 = ['TOMATO', 'ONION', 'MANGO', 'LEMON'];
NODES.forEach(n => { const f = FIRST4.indexOf(n.name); n.t0 = f >= 0 ? DC.whoosh[f] - .1 : TD.snapT(16.74) + .04 * NODES.filter(m => FIRST4.indexOf(m.name) < 0).indexOf(n); n.solo = f >= 0; LAUNCH.push(n.t0); });
const FLY = .44, UNF = .16;                                                        /* the flight of a slip and its unfolding */
const T_HUB = TD.snapT(15.22), T_LOCK = DC.ding, T_REV = TD.snapT(TD.ls('b2') + .02);
const nodeLand = n => n.t0 + FLY + UNF;
const arrowK = (n, lt) => n.solo ? ss(lt, nodeLand(n) - .02, nodeLand(n) + .24) : ss(lt, TD.snapT(17.3), TD.snapT(17.72));
/* the reversal on "Everyone.": each arrowhead slides from the hub's end back to the name's end (staggered round the ring), and a second head grows at the name */
const revK = (n, lt) => ss(lt, T_REV + .03 * n.i, T_REV + .03 * n.i + .34);
let HUBFIT = null;
function hubFit() { if (HUBFIT) return HUBFIT; let size = 56; const w = UI.sizeOf('STRAWBERRY', { size, weight: 900, spacing: 2 }).w; if (w > 0) size = 56 * (HUB.w - 56) / w; HUBFIT = { size: Math.max(40, Math.min(66, size)) }; return HUBFIT; }
const nodeW = n => (n.w || (n.w = UI.sizeOf(n.name, { size: NODE_SIZE, weight: 900, spacing: 1 }).w + 44));
/* where the segment from a box's centre toward (tx, ty) leaves the box (half sizes hw, hh) */
function boxExit(cx, cy, hw, hh, tx, ty) { const dx = tx - cx, dy = ty - cy, k = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : 1e9); return [cx + dx * k, cy + dy * k]; }
function arrowHead(x, y, ang, s, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-24 * s, -13 * s); ctx.lineTo(-18 * s, 0); ctx.lineTo(-24 * s, 13 * s); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore(); }
/* one arrow from a name to the hub: k draws it on (0..1 from the name), rev 0..1 slides the head back to the name (and grows one at the hub's end again when both = .5 .. the two-way end state) */
function drawArrow(n, k, rev, twoWay, lt) {
  if (k <= .005) return;
  const a = boxExit(n.x, n.y, nodeW(n) / 2 + 8, NODE_H / 2 + 8, HUB.x, HUB.y), b = boxExit(HUB.x, HUB.y, HUB.w / 2 + 10, HUB.h / 2 + 10, n.x, n.y);
  const ex = lerp(a[0], b[0], k), ey = lerp(a[1], b[1], k), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const col = '#1e8e5a', glowA = .5 * (1 - ss(lt, T_LOCK, T_LOCK + .5)) * ss(lt, T_LOCK - .05, T_LOCK + .02);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke();
  if (glowA > .01) { ctx.strokeStyle = `rgba(160,255,200,${glowA})`; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(ex, ey); ctx.stroke(); }
  /* the moving dot that travels along a fresh arrow */
  if (k < 1) { ctx.fillStyle = '#b8ffd6'; ctx.beginPath(); ctx.arc(ex, ey, 9, 0, TAU); ctx.fill(); }
  else {
    const r = c01(rev), hx = lerp(b[0], a[0], r), hy = lerp(b[1], a[1], r);
    if (!twoWay || r < 1) arrowHead(twoWay && r >= 1 ? b[0] : hx, twoWay && r >= 1 ? b[1] : hy, r > .5 ? ang + PI : ang, 1, col);
    if (twoWay && r >= 1) { arrowHead(a[0], a[1], ang + PI, 1, col); arrowHead(b[0], b[1], ang, .85, col); }
  }
  ctx.restore();
}
/* a name node: a white rounded label with a coloured dot; pop 0..1 (it grows out of the unfolded slip), hero only when it is at rest and big enough */
function drawNode(n, pop, hero, lt) {
  if (pop <= .02) return;
  const w = nodeW(n), s = eb(c01(pop));
  ctx.save(); ctx.translate(n.x, n.y); ctx.scale(s, s); ctx.translate(-n.x, -n.y);
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff'; rr(n.x - w / 2, n.y - NODE_H / 2, w, NODE_H, NODE_H / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.fillStyle = n.col; ctx.beginPath(); ctx.arc(n.x - w / 2 + 16, n.y, 6, 0, TAU); ctx.fill();
  UI.container('fp22s_n' + n.i, 'pill', [n.x - w / 2, n.y - NODE_H / 2, n.x + w / 2, n.y + NODE_H / 2], 6);
  UI.label(n.name, n.x + 6, n.y, { size: NODE_SIZE, weight: 900, spacing: 1, fill: '#1d1a22', hero: hero && pop >= 1, crop: !(hero && pop >= 1), cid: 'fp22s_n' + n.i, maxW: w - 30 });
  ctx.restore();
}
/* the hub: STRAWBERRY in a big red label; on the ding it locks (a gold star badge, a ring) */
function drawHub(pop, lt, hero) {
  if (pop <= .02) return;
  const s = eb(c01(pop)), f = hubFit(), { x, y, w, h } = HUB, lock = lt >= T_LOCK;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y);
  if (lt > T_LOCK && lt < T_LOCK + .9) V2.ring(x, y, sg(lt, T_LOCK, T_LOCK + .9), { r0: 120, r1: 460, color: '255,226,120', lw: 10, alpha: .8, squash: .5 });
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = lg(0, y - h / 2, 0, y + h / 2, [[0, '#ff5a6e'], [1, '#c8102e']]); rr(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.4; rr(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, h / 2 + 4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; rr(x - w / 2 + 26, y - h / 2 + 10, w - 52, 18, 9); ctx.fill();
  UI.container('fp22s_hub', 'pill', [x - w / 2, y - h / 2, x + w / 2, y + h / 2], 8);
  UI.label('STRAWBERRY', x, y + 1, { size: f.size, weight: 900, spacing: 2, fill: '#ffffff', stroke: '#7a0718', lw: 6, hero: hero && pop >= 1, crop: !(hero && pop >= 1), cid: 'fp22s_hub', center: true, maxW: w - 50 });
  if (lock) { const k = eb(sg(lt, T_LOCK, T_LOCK + .25)), sx = x + w / 2 - 18, sy = y - h / 2 + 6; ctx.save(); ctx.translate(sx, sy); ctx.scale(k, k); ctx.rotate(.2 * Math.sin(lt * 1.3)); ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 16 : 38; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
/* a slip in flight from the hat (sx, sy on the screen at its launch) to its node, fluttering, then unfolding */
function drawSlip(n, lt, from) {
  const a = lt - n.t0; if (a < 0 || a > FLY + UNF + .02) return;
  const u = eo(c01(a / FLY)), [sx, sy] = from, tx = n.x, ty = n.y;
  const c1 = [sx + (tx - sx) * .1, sy - 420], c2 = [tx, ty - 160], q = 1 - u;
  const x = q * q * q * sx + 3 * q * q * u * c1[0] + 3 * q * u * u * c2[0] + u * u * u * tx, y = q * q * q * sy + 3 * q * q * u * c1[1] + 3 * q * u * u * c2[1] + u * u * u * ty;
  const fl = (1 - u) * 1.2 * Math.sin(lt * 15 + n.i * 1.7), s = lerp(.45, 1.05, u), unf = c01((a - FLY) / UNF);
  slipP({ x, y, s: s * (1 + .5 * unf), rot: fl * (1 - unf), unfold: unf, t: lt, hero: true });
}
/* the whole graph at lt; o = { k: scale about (px, py), px, py, hero, twoWay } */
function graph(lt, o = {}) {
  const k = o.k || 1, px = o.px ?? HUB.x, py = o.py ?? HUB.y, hero = !!o.hero && k >= .76;
  ctx.save(); ctx.translate(px, py); ctx.scale(k, k); ctx.translate(-px, -py);
  for (const n of NODES) drawArrow(n, arrowK(n, lt), revK(n, lt), !!o.twoWay, lt);
  drawHub(ss(lt, T_HUB, T_HUB + .28), lt, hero);
  for (const n of NODES) drawNode(n, ss(lt, n.t0 + FLY + UNF * .4, n.t0 + FLY + UNF + .06), hero, lt);
  ctx.restore();
}
/* the backdrop of every graph insert: a veil over the blurred station, Binder's faint dotted canvas, the title */
function graphBack(lt, a = 1, hero = true) {
  ctx.fillStyle = `rgba(12,22,30,${.42 * a})`; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = V2.radial(540, 880, 200, 1100, [[0, 'rgba(40,120,90,0)'], [1, `rgba(0,0,0,${.3 * a})`]]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(190,255,220,${.14 * a})`; for (let y = 300; y < 1380; y += 44) for (let x = 40; x < 1060; x += 44) { ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
  if (a > .9) UI.pill('SECRET SANTA', 540, 318, { size: 40, font: 'Bangers', weight: 400, spacing: 3, fill: '#1e8e5a', ink: '#ffffff', stroke: '#ffffff', lw: 3, padX: 30, h: 66, hero, crop: !hero, id: 'fp22s_title' });
}

// ------------------------------------------------------------------ DRAW: Binder's bubble (screen space, over the blurred station; the staging of ep21_arrive.js, retimed)
const BTXT1 = "It looks like you're drawing names. Would you like help?";
function typedAtL(T0, id, text, lt) {   /* the share of the letters of `text` shown at lt, in step with the spoken words of line `id` */
  const L = T0.LN[id]; if (!L) return 1;
  const words = L.words, n = text.length; let shown = 0, pos = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i][0].replace(/[^A-Za-z']/g, ''), w = text.indexOf(clean, pos), ws = T0.wS(id, i) - .04, we = T0.wE(id, i); if (w < 0) continue;
    if (lt < ws) break;
    const end = w + clean.length;
    shown = Math.max(shown, lerp(w, end, c01((lt - ws) / Math.max(.05, we - ws))));
    pos = end;
  }
  return lt >= T0.wE(id, words.length - 1) ? 1 : c01(shown / n);
}
const BIG = { x: 300, y: 1090, s: 1.6 }, BUBX = 110, BUBW = 860, BUBBOT = 780;
const veil = a => { ctx.fillStyle = 'rgba(14,20,26,' + a + ')'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = V2.radial(540, 820, 260, 1150, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.3)']]); ctx.fillRect(0, 0, W, H); };
function insBubble(lt, sh) {
  if (!window.SH15) return;
  veil(.3);
  V2.glow(540, 900, 760, '150,205,255', .12, 'screen', .2);
  const b = A15.binder({ x: BIG.x, y: BIG.y + Math.sin(lt * 3) * 6, s: BIG.s, center: true, noLegs: true, who: 'bind', t: lt, yaw: -.25, pose: 'helpful', grin: .15, look: [.5, -.4], hover: 8 });
  const bb = binderHat(b);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12; drawChar(bb); ctx.restore();
  const bo = { w: BUBW, s: 1, size: 42, name: 'Binder', buttons: [{ id: 'yes', t: 'YES', def: true }, { id: 'no', t: 'NO' }], text: BTXT1 };
  const h = SH15.binderRect(Object.assign({ at: [0, 0] }, bo)).h; bo.at = [BUBX, BUBBOT - h];
  bo.typed = typedAtL(TD, 'b1', BTXT1, lt); bo.pop = ss(lt, sh.s, sh.s + .3); bo.tail = [BIG.x + 46 * BIG.s, BIG.y - 74 * BIG.s];
  const yes = SH15.binderRect(bo, 'yes'), wk = ss(lt, TD.wS('b1', TD.LN.b1.words.length - 1) - .05, TD.wS('b1', TD.LN.b1.words.length - 1) + .25);
  if (yes && wk > 0) V2.glow(yes.x + yes.w / 2, yes.y + yes.h / 2, 150, '120,255,170', .25 * wk * (.7 + .3 * Math.sin(lt * 4)), 'screen', .3);
  SH15.binder(bo, lt);
}

// ------------------------------------------------------------------ DRAW: the shots (scene-local s; every start snapped to a frame; the boundary frame is the NEW shot)
const ALLD = ['straw', 'mango', 'tom', 'onion', 'lemon'];
const DSH = [
  { id: 'hat', s: 0, k: 'hat', show: ['mango', 'tom'] },                                                                  /* the match cut: the hat of names at (540, 760), still; the pull back from 0.30 */
  { id: 't1', s: 1.40, k: 'pt', x: 712, y: 1128, z: [1.3, 1.36], show: ['mango', 'tom'], dof: 3 },
  { id: 'o1', s: 3.40, k: 'face', foc: 'onion', z: [1.72, 1.8], up: 130, dx: -110, show: ['tom', 'onion', 'lemon'], dof: 4 },
  { id: 'm1', s: 6.00, k: 'face', foc: 'mango', z: [1.66, 1.72], up: 120, dx: -70, show: ['straw', 'mango'], dof: 4 },
  { id: 'l0', s: 7.72, k: 'face', foc: 'lemon', z: [1.62, 1.68], up: 110, dx: 50, show: ['onion', 'lemon'], dof: 4 },
  { id: 's1', s: 9.25, k: 'face', foc: 'straw', z: [1.6, 1.66], up: 110, dx: -60, show: ['straw', 'mango'], dof: 4 },
  { id: 't2', s: 10.38, k: 'face', foc: 'tom', z: [1.42, 1.46], up: 90, dx: 120, show: ['mango', 'tom'], dof: 4 },
  { id: 'sbeat', s: 11.00, k: 'face', foc: 'straw', z: [1.78, 1.84], up: 120, dx: 0, show: ['straw', 'mango'], dof: 4 },
  { id: 'pop', s: 11.40, k: 'lap', z: [2.7, 2.78], show: [], dof: 3 },
  { id: 'b1', s: 11.90, k: 'lap', ins: 'bubble', z: [2.78, 2.8], show: [], dof: 12 },
  { id: 't3', s: 13.76, k: 'face', foc: 'tom', z: [1.4, 1.46], up: 40, dx: 150, show: ['mango', 'tom'], dof: 4 },
  { id: 'draw', s: 14.70, k: 'draw', show: ['mango', 'tom'] },
  { id: 'l1', s: 18.80, k: 'face', foc: 'lemon', z: [1.6, 1.66], up: 120, dx: 60, show: ['onion', 'lemon'], dof: 4 },
  { id: 's2', s: 20.38, k: 'face', foc: 'straw', z: [1.7, 1.76], up: 120, dx: -40, show: ['straw', 'mango'], dof: 4 },
  { id: 'b2', s: 21.40, k: 'draw', ins: 'graph', show: ['straw', 'mango', 'tom'], still: true },
  { id: 'o2', s: 22.24, k: 'face', foc: 'onion', z: [1.72, 1.8], up: 120, dx: -110, show: ['tom', 'onion', 'lemon'], dof: 4 },
  { id: 't4', s: 24.16, k: 'face', foc: 'tom', z: [1.48, 1.54], up: 60, dx: 130, show: ['tom'], dof: 4 },
  { id: 's3', s: 25.38, k: 'face', foc: 'straw', z: [1.55, 1.6], up: -10, dx: -40, show: ['straw', 'mango'], dof: 4 },
  { id: 't5', s: 27.24, k: 'pt', x: 760, y: 1116, z: [1.06, 1.1], show: ['mango', 'tom', 'onion'], dof: 2 },
  { id: 'end', s: 28.56, k: 'draw', ins: 'graph', show: ['straw', 'mango', 'tom'], still: true },
];
const dShot = shots(TD, DSH);
const SH_OF = id => DSH.find(s => s.id === id);
/* the camera of the draw (one move, pure function of lt): from Tomato and the hat to a push onto the hat */
const camDraw = lt => ({ x: K([[14.7, 660], [16.3, 610]], lt), y: K([[14.7, 1150], [16.3, 1170]], lt), z: K([[14.7, 1.22], [16.3, 1.42]], lt) });
/* the hat's match cut: the brim at (540, 760) on the screen, about 300 px wide, still until the jingle; then the pull back */
function camHat(lt, hw) {
  const z0 = 300 / (HATW * HAT.s * DS.tom + 20), p0 = [hw[0], hw[1] + 200 / z0], u = ss(lt, DC.jingle, 1.45);
  return { x: lerp(p0[0], 712, u), y: lerp(p0[1], 1128, u), z: lerp(z0, 1.3, u) };
}
let DFR = null;
function castD(lt, sh) { return { straw: strawD(lt, sh), mango: mangoD(lt, sh), tom: tomD(lt, sh), onion: onionD(lt, sh), lemon: lemonD(lt, sh) }; }
function lapGeomD() { return A15.laptopScreen ? (r => ({ x: DLAP.x + (r[0] + r[2]) / 2, y: CT.top + 2 + (r[1] + r[3]) / 2, w: r[2] - r[0], h: r[3] - r[1] }))(A15.laptopScreen({ lapScale: LAP.s })) : { x: DLAP.x, y: CT.top - 70, w: 160, h: 100 }; }
function camD(lt) {
  const sh = dShot(lt), C = castD(lt, sh), u = c01((lt - sh.s) / (sh.e - sh.s));
  let cx = 540, cy = 960, z = 1;
  if (sh.k === 'hat') { const c = camHat(lt, hatWorld(C.tom)); cx = c.x; cy = c.y; z = c.z; }
  else if (sh.k === 'pt') { z = lerp(sh.z[0], sh.z[1], easeIO(u)); cx = sh.x; cy = sh.y; }
  else if (sh.k === 'face') { z = lerp(sh.z[0], sh.z[1], easeIO(u)); const [fx, fy] = faceC(C[sh.foc]); cx = fx - (sh.dx || 0) / z; cy = fy + sh.up / z; }
  else if (sh.k === 'lap') { const g = lapGeomD(); z = lerp(sh.z[0], sh.z[1], easeIO(u)); cx = g.x; cy = g.y - 70; }
  else if (sh.k === 'draw') { const c = camDraw(sh.still ? 16.3 : lt); cx = c.x; cy = c.y; z = c.z; }
  zoomTo(cx, cy, z);
  const quiet = sh.k === 'hat' && lt < DC.jingle || sh.still;                        /* the match-cut frames hold still */
  if (!quiet) { CAM.x += 2 * hn(lt, 1.3, 1); CAM.y += 1.5 * hn(lt, 1.1, 2); CAM.r += .001 * hn(lt, .9, 3); }
  DFR = { C, sh };
}
/* Binder, out of the laptop since the pop: it hovers over the counter and conducts the draw over the hat (small, in the world) */
function binderWorld(lt, C) {
  const g = lapGeomD(), t0 = DC.pop; if (lt < t0) return;
  const kk = sg(lt, t0, t0 + .16), f = ss(lt, t0 + .04, t0 + .5), s0 = .72 * g.w / 300;
  const hw = hatWorld(C.tom), toHat = ss(lt, 14.6, 15.1) * (1 - ss(lt, 18.2, 18.6)), home = ss(lt, 18.45, 18.75); if (home >= 1) return;
  const x = lerp(g.x, hw[0] + 70, toHat), y = lerp(lerp(g.y + 10, g.y - g.h * .75, f) - Math.sin(PI * f) * 20, hw[1] - 190, toHat) + Math.sin(lt * 3.2) * 3 * f;
  if (kk < 1) V2.ring(g.x, g.y - 6, kk, { r0: 8, r1: 90, color: '255,236,160', lw: 6, alpha: .9 });
  const s = s0 * eb(kk) * lerp(1, .8, toHat) * (1 - home); if (s < .02) return;
  const pose = lt > DC.shuffle - .2 && lt < 18.5 ? 'wave' : lt > TD.ls('t3') - .1 && lt < 14.7 ? 'thumb' : 'ears';
  const b = A15.binderSmall({ x, y, s, center: true, noLegs: true, who: 'bind', t: lt, pose, grin: .25, look: toHat > .5 ? [-.4, .6] : [.4, .2], hover: 6 });
  drawChar(binderHat(b));
}
function drawD(lt) {
  const { C, sh } = DFR, ins = sh.k === 'draw' || sh.k === 'lap';
  const st = { night: 0, t: lt, noCloset: true, binderLit: lt > DC.pop - .5 ? .6 + .4 * ss(lt, DC.pop - .5, DC.pop) : 0 };
  V2.setLight({ key: [-.5, -.62], keyColor: '#fff4e2', keyA: .22, rim: '#ffe2b8', rimA: .3, shadow: '#2a1c30', shadowA: .26, bounce: '#ffe6c8', bounceA: .12, amb: '#fff6ec', ambA: .06, frontDark: .02 }); V2.opts.reflect = false;
  /* the room (blurred in inserts and behind the close shots), then the counter, Binder, the cast */
  const blurDraw = sh.k === 'draw' ? 14 * ss(lt, 15.0, 15.45) + (sh.still ? 14 : 0) : 0;
  const px = Math.min(16, (sh.dof || 0) + blurDraw);
  let L = [], tr = null;
  const room = () => { const r = stRoom(st); L = r.lights; const ct = stCounterAt(st, DLAP.x); tr = ct.lights; };
  if (px > .5) { SOFT++; REG.suppress++; V2.dof(px, room); REG.suppress--; SOFT--; } else room();
  const cast = () => {
    HEROMODE = false;
    if (sh.k !== 'lap') binderWorld(lt, C);
    const list = sorted(sh.show.map(n => C[n]));
    for (const o of list) { if (o.joy > .01) sparkles(o, o.joy, lt, 7); drawIn(o); }
    if (talking(TD, 'o1', lt) || talking(TD, 'o2', lt)) { const o = C.onion, [fx, fy] = faceC(o); if (A15.tearsAura) A15.tearsAura(fx, fy, 1, { r: 150 * o.s, n: 16, t: lt, size: 1.1 * o.s, seed: 5 }); }
    if (sh.id === 't5') confettiHat(lt, C.tom);
  };
  if (sh.k === 'draw' && blurDraw > .5) { SOFT++; REG.suppress++; V2.dof(Math.min(16, blurDraw), cast); REG.suppress--; SOFT--; }
  else if (sh.k === 'lap') { if (sh.id === 'pop') binderLap(lt); }
  else cast();
  lightsGlow(L.concat(tr || []), lt, px > 6 ? .6 : 1);
}
/* the counter, with the laptop where this scene puts it */
function stCounterAt(st, lapX) { const keep = LAP.x; LAP.x = lapX; const r = stCounter(st); LAP.x = keep; return r; }
/* the close-up of the laptop: the screen glows, a ring, Binder pops out big (binderpop) and starts to speak */
function binderLap(lt) {
  const g = lapGeomD(), t0 = DC.pop, ant = ss(lt, t0 - .4, t0);
  glow(g.x, g.y, 80 + 70 * ant, '#beffdc', Math.min(1, .2 + .5 * ant), .4);
  if (lt < t0) return;
  const kk = sg(lt, t0, t0 + .16), f = ss(lt, t0 + .04, t0 + .45), s = .62 * eb(kk);
  if (kk < 1) V2.ring(g.x, g.y - 6, kk, { r0: 8, r1: 120, color: '255,236,160', lw: 6, alpha: .9 });
  if (s < .02) return;
  HEROMODE = true;
  const b = A15.binder({ x: g.x, y: lerp(g.y + 10, g.y - g.h * .62, f) - Math.sin(PI * f) * 16 + Math.sin(lt * 3.2) * 3 * f, s, center: true, noLegs: true, who: 'bind', t: lt, pose: lt > TD.ls('b1') ? 'helpful' : 'ears', grin: .2, look: [.1, .2], hover: 6 });
  drawChar(binderHat(b));
  HEROMODE = false;
}
/* "Merry Christmas!": she tips the empty hat and a shower of confetti and glitter pours out of it */
function confettiHat(lt, o) {
  const t0 = TD.wS('t5', 1) - .1; if (lt < t0) return;
  const [hx, hy] = hatWorld(o), cols = ['#ff4646', '#2fb86a', '#ffd23f', '#4dd2ff', '#ffffff', '#ff8ae6'];
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const b = t0 + .5 * rnd(61, i), a = lt - b; if (a < 0 || a > 2.4) continue;
    const vx = (rnd(62, i) - .5) * 520, vy = -620 - 380 * rnd(63, i), x = hx + vx * a, y = hy - 40 + vy * a + 700 * a * a;
    ctx.save(); ctx.translate(x + 18 * Math.sin(a * 6 + i), y); ctx.rotate(a * (4 + 4 * rnd(64, i)) + i); ctx.scale(1, Math.cos(a * (5 + 3 * rnd(65, i)) + i));
    ctx.globalAlpha = 1 - ss(a, 1.6, 2.4); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-9, -5, 18, 10); ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ DRAW: the overlays (screen space): the slips and the graph, the reversal, the end card hold, the math
/* the hat's screen point at time t inside the draw shot (the camera and Tomato are pure functions of t; the small sway is left out) */
function hatScreenAt(t) { const c = camDraw(t), o = tomD(t, SH_OF('draw')), [hx, hy] = hatWorld(o); return [540 + (hx - c.x) * c.z, 960 + (hy - c.y) * c.z]; }
function overDraw(lt, sh) {
  const a = ss(lt, 15.0, 15.42);
  if (a > .01) graphBack(lt, a, a > .99);
  /* the shuffle: a swirl of sparkles over the hat */
  if (lt > DC.shuffle - .05 && lt < 17.2) { const [hx, hy] = hatScreenAt(lt), k = ss(lt, DC.shuffle - .05, DC.shuffle + .2) * (1 - ss(lt, 16.8, 17.2));
    for (let i = 0; i < 10; i++) { const an = lt * 5 + i / 10 * TAU, r = 90 + 20 * Math.sin(lt * 7 + i); star4(hx + Math.cos(an) * r, hy - 60 + Math.sin(an) * r * .4, 12 * k, .8 * k, '200,255,225'); } }
  graph(lt, { hero: true });
  for (const n of NODES) if (lt >= n.t0) drawSlip(n, lt, hatScreenAt(n.t0));
  if (lt >= T_LOCK && lt < T_LOCK + .8) { const k = sg(lt, T_LOCK, T_LOCK + .8); for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + .3, r = 230 + 160 * eo(k); star4(HUB.x + Math.cos(an) * r, HUB.y + Math.sin(an) * r * .55, 22 * (1 - k), .9 * (1 - k)); } }
}
/* "Everyone.": the graph steps back and up, Binder (big, sharp) points and grins while every arrow turns round */
const B2G = { k: .8, px: 540, py: 700 }, B2B = { x: 905, y: 1262, s: 1.5 };
function overB2(lt, sh) {
  graphBack(lt, 1, true);
  const g = ss(lt, DC.grin - .06, DC.grin + .1);
  const b = A15.binder({ x: B2B.x, y: B2B.y + Math.sin(lt * 3) * 5, s: B2B.s, center: true, noLegs: true, who: 'bind', t: lt, yaw: .2, pose: lt < T_REV ? 'helpful' : 'point', grin: .2 + .8 * g, glint: g > .9 ? Math.max(0, Math.sin((lt - DC.grin - .1) * 9)) ** 2 : 0, look: [-.6, -.5], hover: 8 });
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; drawChar(b); ctx.restore();
  graph(lt, { k: B2G.k, px: B2G.px, py: B2G.py, hero: true });
}
/* the end: the whole two-way graph, a slow push onto STRAWBERRY that comes to rest at (540, 900) (the match cut into the wrap scene, held still for the last half second) */
const T_ENDREST = TD.snapT(29.56);
function overEnd(lt, sh) {
  graphBack(lt, 1, true);
  const k = lerp(.94, 1, ss(lt, sh.s, T_ENDREST));
  graph(lt, { k, px: HUB.x, py: HUB.y, hero: true, twoWay: true });
  if (lt >= DC.sting && lt < DC.sting + .9) { const u = sg(lt, DC.sting, DC.sting + .9); for (let i = 0; i < 10; i++) { const an = i / 10 * TAU, r = 240 + 120 * eo(u); star4(HUB.x + Math.cos(an) * r, HUB.y + Math.sin(an) * r * .45, 20 * (1 - u), .9 * (1 - u)); } }
}
/* "That's a hundred and twenty dollars.": Binder's sum pops up over her head */
function mathCard(lt) {
  const t0 = TD.wS('s3', 2) - .05, k = ss(lt, t0, t0 + .22); if (k <= .01) return;
  const s = eb(c01((lt - t0) / .3)), bump = 1 + .08 * Math.max(0, Math.sin(PI * sg(lt, TD.wS('s3', 5), TD.wS('s3', 5) + .3)));
  ctx.save(); ctx.translate(540, 380); ctx.scale(s * bump, s * bump); ctx.translate(-540, -380); ctx.globalAlpha *= k;
  UI.pill('12 x $10 = $120', 540, 380, { size: 54, font: 'Bangers', weight: 400, spacing: 2, fill: '#1e8e5a', ink: '#ffffff', stroke: '#ffffff', lw: 4, padX: 36, h: 92, hero: k > .99 && s > .99, crop: !(k > .99 && s > .99), id: 'fp22s_math' });
  ctx.restore();
}
const DRAW = {
  shot: lt => dShot(lt).id,
  cam: camD,
  draw: drawD,
  fx: lt => ({ bloom: .32, vignette: .24, grain: .04, contrast: .06, sat: .1, tint: [['#ffe2b8', .05, 'soft-light']] }),
  blur: lt => { const sh = dShot(lt); if (lt - sh.s < .04) return 1; if (sh.id === 'hat' && lt > DC.jingle) return 2; if (sh.id === 't5' && lt > TD.wS('t5', 1) - .1) return 2; return 1; },
  over(lt) {
    const sh = DFR ? DFR.sh : dShot(lt);
    if (sh.ins === 'bubble') insBubble(lt, sh);
    else if (sh.id === 'draw') overDraw(lt, sh);
    else if (sh.id === 'b2') overB2(lt, sh);
    else if (sh.id === 'end') overEnd(lt, sh);
    else if (sh.id === 's3') mathCard(lt);
  },
};
window.__EP22_SCENES = window.__EP22_SCENES || {}; window.__EP22_SCENES.draw = DRAW;

// ================================================================== SWAP: the cues, the cast, the choreography
const SC = { rip: [2.976, 3.126, 3.276, 3.426], zip: 3.776, crinkle: 4.276, sniffle: 7.86, pile: 15.613, thump: 16.613, sting: 25.538 };
for (const k in SC) SC[k] = Array.isArray(SC[k]) ? SC[k].map(TS.snapT) : TS.snapT(SC[k]);
const SFL = FL + 30;
/* blocking A (the open to "all of ours"): Strawberry at the left by the tree, the staff in a row; blocking B (after the pile): the staff stand right of the heap */
const XA = { straw: 400, tom: 640, lemon: 860, mango: 1080, onion: 1300 };
const XB = { onion: 930, lemon: 1130, tom: 1330, mango: 1520 };
const XC = { tom: 640, lemon: 860, mango: 1080, onion: 1300 };                 /* "It's the same candle.": each holds the candle up beside the face, four in a row at one height */
const blockC = lt => lt >= TS.snapT(8.05) && lt < TS.snapT(13.15);
const xOf = (n, lt) => blockB(lt) ? XB[n] : blockC(lt) ? XC[n] : XA[n];
const SSC = { straw: .86, tom: .88, lemon: .84, mango: .86, onion: .84 };
const PILE = (window.__EP22_SIMS && window.__EP22_SIMS.swapPile && window.__EP22_SIMS.swapPile.L) || { SX: 400, FY: 1324, S: .9 };
/* the five gifts of the exchange (the paper of each) and when each is torn: the four rips, then Tomato's ribbon zips off and her paper crinkles off */
const GPAP = { lemon: ['trees', '#c62828', '#2f8f4e'], mango: ['dots', '#2b6cff', '#ffffff'], onion: ['candy', '#2f8f4e', '#d6202c'], straw: ['stripes', '#7a4fd8', '#ffd23f'], tom: ['stripes', '#d6202c', '#f4ead8'] };
const RIPT = { lemon: SC.rip[0], mango: SC.rip[1], onion: SC.rip[2], straw: SC.rip[3], tom: SC.crinkle - .1 };
const T_BLOCKB = TS.snapT(15.38);
const blockB = lt => lt >= T_BLOCKB;
const candleIn = (x0, y0, hw, y1) => candleP({ x: 0, y: y1 - 6, s: .62, t: 0 });
/* a held gift that tears open on its cue (until SOFT2D lands: a hand-animated tear in strips) */
function giftHold(o, n, lt, g = null) {
  const kd = KINDS[o.kind], fb = kd.mouthY + 55 * (kd.mw || 26) / 26, big = n === 'tom';
  let paper, c1, c2, tear = null;
  if (g) { [paper, c1, c2] = g; } else { [paper, c1, c2] = GPAP[n]; const a = lt - RIPT[n]; tear = a >= 0 ? { k: c01(a / .55), t: a } : null; }
  const w = big ? 150 : 128, h = big ? 106 : 96, top = fb + 6 + (big && !g ? 22 : 0), hy = top + 22;
  o.arms = { l: 'hold', r: 'hold' }; o.hold = { l: 'fp22s_gift' };
  o.grip = { l: [-w / 2 - 6, hy], r: [w / 2 + 6, hy] };
  const zipped = big && !g && lt >= SC.zip;
  o.gift = { w, h, paper, color: c1, color2: c2, ribbon: zipped ? false : '#ffd23f', bow: big && !g && !zipped ? '#ffd23f' : false, bowBig: big && !g, tear, seed: n.length * 7, inside: g ? null : candleIn, t: lt };
  o.giftDx = w / 2 + 6; o.giftDy = h - 22;
  if (tear && tear.k > 0 && tear.k < 1) { const j = Math.sin(tear.t * 40) * (1 - tear.k); o.grip.l[0] -= 8 * j; o.grip.r[0] += 8 * j; }
  return o;
}
/* the candle held up beside the face, flat */
function candleUp(o, side = 'r', k = 1, front = false) { o.arms = { l: 'rest', r: 'rest' }; o.arms[side] = 'hold'; o.hold = { [side]: 'fp22s_candle' }; const fb = KINDS[o.kind].mouthY + 55; o.grip = { [side]: front ? [(side === 'r' ? 1 : -1) * 34, fb + 10] : [(side === 'r' ? 1 : -1) * lerp(80, 128, k), lerp(110, -2, k)] }; o.candleS = front ? 1.15 : 1.05; return o; }
function tomS(lt, sh) {
  const B = blockB(lt), x = xOf('tom', lt);
  let o = A15.tomato({ x, y: SFL, s: SSC.tom, t: lt, who: lt > 24 ? 'staff' : 'tom', tomPose: 'fruit', plant: true, headset: false, hold: {}, arms: { l: 'rest', r: 'rest' } });
  o = santa(sweater(o), { wind: 0 }); Object.assign(o, { x, y: SFL, s: SSC.tom });
  o.expr = 'tom_fruit'; o.look = [-.3, 0];
  if (!B && lt < 5.3) giftHold(o, 'tom', lt);
  if (talking(TS, 't1', lt)) { o.expr = 'happy'; o.lift = 10 * Math.abs(Math.sin((lt - TS.ls('t1')) * 7)); o.look = [.2, -.1]; }
  if (!B && lt >= 5.3 && lt < 13.0) { candleUp(o, 'r', ss(lt, 5.3, 5.7)); o.look = [.5, -.1]; o.headYaw = .15; }
  if (sh.id === 't2') { o.expr = 'happy'; o.look = [.7, -.05]; o.headYaw = .2; }
  if (sh.id === 'br1b' || sh.id === 'br1c') { o.look = [1, -.05]; o.headYaw = .3; o.expr = 'shock'; }
  if (sh.id === 'l2') { giftHold(o, 'tom2', lt, ['dots', '#ffd23f', '#d6202c']); o.look = [-1, 0]; o.headYaw = -.3; }
  if (B) { o.look = [-1, .05]; o.headYaw = -.25; }
  if (sh.id === 'st1') { const k = ss(lt, TS.ls('st1') - .2, TS.ls('st1') + .1); o.expr = 'happy'; o.arms = { l: 'cheer', r: 'cheer' }; o.rot = -.08 * k; o.x -= 30 * k; o.lift = 14 * Math.max(0, Math.sin(PI * sg(lt, TS.ls('st1'), TS.ls('st1') + .5))); }
  return o;
}
function lemonS(lt, sh) {
  const B = blockB(lt), x = xOf('lemon', lt);
  const o = A7.lemon({ x, y: SFL, s: SSC.lemon, t: lt, who: lt > 24 ? 'staff' : 'lemon', expr: 'neutral', lid: .35, plant: true, arms: { l: 'rest', r: 'rest' } });
  lookAt(o, B ? PILE.SX : XA.tom, 0);
  if (!B && lt < 5.2) giftHold(o, 'lemon', lt);
  if (!B && lt >= 5.2 && lt < 13.0) { candleUp(o, 'r', ss(lt, 5.2, 5.5)); o.look = [0, .05]; o.headYaw = 0; o.lid = .5; }
  if (sh.id === 't2') { o.look = [-.6, 0]; o.headYaw = -.15; }
  if (sh.id === 'br1b' || sh.id === 'br1c') { o.look = [1, -.05]; o.headYaw = .3; }
  if (sh.id === 'l2') { giftHold(o, 'lemon2', lt, ['stripes', '#2f8f4e', '#ffffff']); o.look = [-1, 0]; o.headYaw = -.3; o.lid = .3; }
  if (talking(TS, 'l3', lt)) { o.arms = { l: 'point', r: 'rest' }; o.look = [-1, .05]; o.headYaw = -.3; o.lid = .25; }
  if (sh.id === 'st1') { o.expr = 'happy'; o.lid = 0; o.arms = { l: 'cheer', r: 'cheer' }; o.rot = -.06; o.x -= 24; }
  return o;
}
function mangoS(lt, sh) {
  const B = blockB(lt), x = xOf('mango', lt);
  const o = A7.mango({ x, y: SFL, s: SSC.mango, t: lt, who: lt > 24 ? 'staff' : 'mango', expr: 'neutral', plant: true, arms: { l: 'rest', r: 'rest' } });
  lookAt(o, B ? PILE.SX : XA.tom, 0);
  if (!B && lt < 5.2) giftHold(o, 'mango', lt);
  if (!B && lt >= 5.2 && lt < 13.0) { candleUp(o, 'r', ss(lt, 6.0, 6.35)); o.expr = 'sad'; o.look = [0, .05]; }
  if (sh.id === 'br1b' || sh.id === 'br1c') { o.look = [1, -.05]; o.headYaw = .3; o.expr = 'shock'; }
  if (sh.id === 'l2') { giftHold(o, 'mango2', lt, ['trees', '#7a4fd8', '#3fae5f']); o.look = [-1, 0]; o.headYaw = -.3; }
  if (sh.id === 'st1') { o.expr = 'happy'; o.arms = { l: 'cheer', r: 'cheer' }; o.rot = -.07; o.x -= 26; }
  return o;
}
function onionS(lt, sh) {
  const B = blockB(lt), x = xOf('onion', lt);
  const o = A15.onion({ x, y: SFL, s: SSC.onion, t: lt, who: lt > 24 ? 'staff' : 'onion', pose: 'rest', cry: .55, plant: true });
  o.expr = 'onion_cry'; lookAt(o, B ? PILE.SX : XA.tom, 0);
  if (!B && lt < 5.2) { o.pose = 'free'; giftHold(o, 'onion', lt); }
  if (!B && lt >= 5.2 && lt < 13.0) { o.pose = 'free'; candleUp(o, 'r', ss(lt, 6.9, 7.2)); }
  if (talking(TS, 'o1', lt)) { const sob = Math.max(0, 1 - Math.abs(lt - SC.sniffle - .08) / .3); Object.assign(o, { expr: 'happy', cry: .95, sob, look: [-.2, -.1] }); o.joy = 1; }
  if (sh.id === 't2') { o.look = [-.8, 0]; o.headYaw = -.2; }
  if (sh.id === 'br1b' || sh.id === 'br1c') { o.look = [1, -.05]; o.headYaw = .3; o.expr = 'shock'; o.cry = .3; }
  if (sh.id === 'l2') { o.pose = 'free'; giftHold(o, 'onion2', lt, ['candy', '#c62828', '#ffffff']); o.look = [-1, 0]; o.headYaw = -.3; }
  if (talking(TS, 'o2', lt)) { Object.assign(o, { pose: 'free', arms: { l: 'point', r: 'rest' }, expr: 'happy', cry: 1, sob: .2 + .2 * Math.sin(lt * 8), look: [-1, -.05], headYaw: -.3 }); o.joy = 1; }
  if (sh.id === 'st1') { o.pose = 'free'; o.expr = 'happy'; o.cry = .9; o.arms = { l: 'cheer', r: 'cheer' }; o.rot = -.06; o.x -= 22; o.joy = 1; }
  return o;
}
/* Strawberry: in blocking A with her own gift (a candle too); from the pile on, buried to the chin (her feet on the pile's floor line), one arm out */
function strawS(lt, sh) {
  const B = blockB(lt);
  const o = A11.straw({ x: B ? PILE.SX : XA.straw, y: B ? PILE.FY : SFL, s: B ? PILE.S : SSC.straw, t: lt, who: 'straw', expr: 'dead', lid: .5, plant: true, arms: { l: 'rest', r: 'rest' } });
  lookAt(o, XA.tom, 0);
  if (!B && lt < 5.2) giftHold(o, 'straw', lt);
  if (!B && lt >= 5.2 && lt < 13.0) { candleUp(o, 'r', ss(lt, 5.4, 5.8)); o.lid = .6; o.look = [.3, .05]; }
  if (sh.id === 'l2') { o.expr = 'neutral'; o.lid = .3; o.look = [.8, 0]; o.headYaw = .2; }
  if (B) {
    o.look = [0, 0]; o.headYaw = 0; o.yaw = 0;
    const hits = [SC.pile, SC.pile + .3, SC.pile + .6, SC.thump];
    let flinch = 0; for (const h of hits) flinch = Math.max(flinch, lt >= h && lt < h + .25 ? 1 - (lt - h) / .25 : 0);
    if (lt < 17.3) { o.expr = lt < SC.pile ? 'shock' : 'dead'; o.lid = lerp(.1, .55, ss(lt, 16.8, 17.3)); o.look = [.6 * Math.sin(lt * 3), -.2]; o.squash = .04 * flinch; }
    const arm = ss(lt, 17.2, 17.6);
    o.arms = { l: 'rest', r: arm > .01 ? 'hold' : 'rest' }; o.grip = { r: [lerp(80, 96, arm), lerp(60, -135, arm)] };
    if (sh.id === 's1' || sh.id === 'o2') { o.hold = { r: 'fp22s_socks' }; o.socksS = .8; o.socksRot = -.9 + .05 * Math.sin(lt * 2); o.lid = .55; }
    if (sh.id === 's2' || sh.id === 'l3' || sh.id === 's3' || sh.id === 'end') {
      const up = sh.id === 's2' ? ss(lt, TS.ls('s2') - .1, TS.ls('s2') + .25) : 1;
      o.hold = { r: 'fp22s_mug' }; o.mugS = sh.id === 's2' || sh.id === 'l3' ? .85 : 1; o.mugHero = sh.id === 's3' || sh.id === 'end'; o.grip = { r: [96, lerp(40, -95, up)] }; o.mugDx = 92; o.mugDy = 26;
      o.lid = sh.id === 's3' ? .62 : .5; o.look = sh.id === 's3' ? [.6, .2] : [.2, 0];
      if (sh.id === 'end') { o.lid = .35; o.expr = 'chill'; o.look = [.4, .3]; }
    }
    if (sh.id === 's4' || sh.id === 'st1') { o.hold = { r: 'fp22s_pud' }; o.pudS = 1; o.pudRise = 90; o.grip = { r: [96, -120] }; o.expr = sh.id === 'st1' ? 'happy' : 'neutral'; o.lid = sh.id === 'st1' ? .2 : .4; o.look = [.7, -.1]; }
  }
  return o;
}
/* Brenda inside her closet (as Episode 21: dusty, the glasses sliding, a sandwich); she bites at bite0 */
function brendaS(lt, bite0) {
  if (!window.A13 || !A13.brenda) return null;
  const bite = lt >= bite0 && lt < bite0 + .35;
  const o = A13.brenda({ t: lt, id: 'brenda', who: 'brenda', expr: A13.expr('weak'), lid: .35, dust: .35, specsDrop: .55, look: [-.6, .05], yaw: -.25, headYaw: -.2,
    arms: { l: 'rest', r: 'hold' }, hold: { r: 'fp22s_sandwich' }, grip: { r: bite ? [30, -14] : [70, 30] }, sandScale: .95, sandTilt: -.2 });
  return Object.assign(o, { x: BRX, y: FL, s: .8, plant: true });
}
const BRX = 1640;

// ------------------------------------------------------------------ SWAP: the pile (PHYS2D, ep22_swap_rigid_sim.js: built once, lazily; sampled with world.at(lt))
let PSIM = null, PERR = null;
function pileSim() {
  if (PSIM || PERR) return PSIM;
  try { const M = window.__EP22_SIMS && window.__EP22_SIMS.swapPile; if (!M) { PERR = 'no sim'; return null; } PSIM = M.build({}); }
  catch (e) { PERR = String(e && e.stack || e); console.error('pile sim: ' + PERR); }
  return PSIM;
}
const PILEPAL = [['stripes', '#c62828', '#f4ead8'], ['dots', '#2b6cff', '#ffffff'], ['trees', '#2f8f4e', '#ffffff'], ['candy', '#f4f1ea', '#d6202c'], ['plain', '#7a4fd8', '#ffd23f'], ['stripes', '#ffd23f', '#d6202c'],
  ['dots', '#d6202c', '#ffd23f'], ['trees', '#1f3166', '#e8e8f0'], ['candy', '#2f8f4e', '#ffffff'], ['plain', '#ff8ae6', '#ffffff'], ['stripes', '#2b6cff', '#ffd23f'], ['dots', '#3fae5f', '#d6202c'], ['plain', '#d6202c', '#ffd23f']];
/* the gifts of one slab at lt (1 the side heaps, 2 the front, 3 the big one), each registered as foreground for the audit (a gift may never cover a face) */
function drawPile(lt, slab) {
  const S = pileSim(); if (!S) return;
  const st = S.world.at(Math.max(0, Math.min(S.T, lt)));
  for (const g of S.meta.gifts) {
    if (g.slab !== slab || lt < g.t0) continue;
    const b = st.by[g.id]; if (!b) continue;
    const [paper, c1, c2] = PILEPAL[g.pal % PILEPAL.length], top = slab === 3 || g.i === 6 || g.i === 7 || g.i === 8 || g.i === 9;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
    if (hasA('gift')) A22.gift(ctx, { x: 0, y: g.h / 2, w: g.w, h: g.h * .8, d: g.h * .2, paper, color: c1, color2: c2, bow: top, ribbon: true, t: lt, seed: g.i + 3, s: 1 });
    else giftP({ x: 0, y: g.h / 2, w: g.w, h: g.h, paper, color: c1, color2: c2, ribbon: '#ffd23f', bow: top ? '#ffd23f' : false, t: lt, seed: g.i + 3 });
    regLocal('fg', -g.w / 2 + 4, -g.h / 2 + 4, g.w / 2 - 4, g.h / 2 - 4, { id: 'gift' + g.i });
    ctx.restore();
  }
}
/* the paper scraps of the hand-animated rip: they fly up off each gift, flutter, and settle on the floor (pure functions of time) */
function scraps(lt, C) {
  const list = [['lemon', SC.rip[0]], ['mango', SC.rip[1]], ['onion', SC.rip[2]], ['straw', SC.rip[3]], ['tom', SC.crinkle - .1]];
  for (const [n, t0] of list) {
    const a0 = lt - t0; if (a0 < 0) continue;
    const o = C[n], [paper, c1, c2] = GPAP[n], kd = KINDS[o.kind], x0 = (o.x0 ?? o.x), y0 = o.y - (kd.leg + kd.ry * .9) * o.s + (kd.mouthY + 100) * o.s;
    for (let i = 0; i < 7; i++) {
      const sd = n.length * 13 + i, a = a0 - .03 * i; if (a < 0) continue;
      const vx = (rnd(sd, 1) - .5) * 620, vy = -380 - 260 * rnd(sd, 2), kk = 2.4, g = 1500, e = 1 - Math.exp(-kk * a);
      let x = x0 + vx * e / kk + 26 * Math.sin(a * 6 + i), y = y0 + (vy + g / kk) * e / kk - g * a / kk;
      const fl = SFL + 6 + 26 * rnd(sd, 3), landed = y >= fl; if (landed) y = fl;
      const r = (rnd(sd, 4) - .5) * 2 + (landed ? 0 : a * (5 + 4 * rnd(sd, 5))), sq = landed ? .45 : .5 + .5 * Math.abs(Math.cos(a * 7 + i)), sz = 16 + 14 * rnd(sd, 6);
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(1, sq);
      ctx.beginPath(); for (let k = 0; k < 7; k++) { const an = k / 7 * TAU, rr2 = sz * (.7 + .5 * rnd(sd, 10 + k)); ctx.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2 * .8); } ctx.closePath();
      ctx.fillStyle = i % 2 ? c1 : c2; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.restore();
    }
  }
  /* Tomato's ribbon zips off and the big bow flies away */
  const z = lt - SC.zip;
  if (z >= 0 && z < .75 && C.ripShot) { const o = C.tom, kd = KINDS[o.kind], bx = o.x - 260 * z, by = o.y - (kd.leg + kd.ry * .9) * o.s + (kd.mouthY + 70) * o.s - 1100 * z + 700 * z * z;
    ctx.save(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const u = k / 12; ctx.lineTo(bx - 120 * u + 30 * Math.sin(u * 9 + z * 20), by + 140 * u * (1 - z)); } ctx.stroke(); ctx.restore();
    bowP({ x: bx, y: by, s: 1.1, droop: .5, color: '#ffd23f', t: lt, seed: 2 }); }
}
/* Strawberry's twelve Chux-wrapped puddings on the counter, each with a glove-balloon bow on a string (she wrapped them in the wrap scene) */
function puddingRow(top, lt) {
  for (let i = 0; i < 5; i++) pudGift({ x: 950 + i * 70, y: top + 2, s: .58, t: lt, seed: i + 1, rise: 104 + 30 * (i % 2) });
}

/* the Secret Santa gifts for Strawberry, stacked on the counter (gone once they are piled on her); the top one wears the big drooping bow of the match cut */
const STACK = [[580, 0, 124, 92, 0], [706, 0, 128, 100, 1], [828, 0, 112, 84, 2], [640, 1, 112, 80, 3], [764, 1, 104, 78, 4], [702, 2, 124, 88, 5]];
const STACKTOP = { x: 702, knot: 0 };
function giftTower(top, lt) {
  if (lt >= TS.snapT(15.38)) return;
  let rowTop = [top, 0, 0];
  const lv = [top, 0, 0]; lv[1] = top - 100; lv[2] = lv[1] - 80;
  for (const [x, r, w, h, pal] of STACK) {
    const [paper, c1, c2] = PILEPAL[(pal + 5) % PILEPAL.length], y = lv[r] + 1;
    if (r === 2) { giftP({ x, y, w, h, paper, color: c1, color2: c2, ribbon: '#ffd23f', bow: '#d6202c', bowBig: true, bowS: 1.9, mine: true, t: lt, seed: 7 }); STACKTOP.knot = y - h + 10; }
    else giftP({ x, y, w, h, paper, color: c1, color2: c2, ribbon: '#ffd23f', bow: false, mine: true, t: lt, seed: pal + 2 });
  }
}

// ------------------------------------------------------------------ SWAP: the shots
const ALLS = ['straw', 'tom', 'lemon', 'mango', 'onion'];
const SSH = [
  { id: 'bow', s: 0, k: 'bow', show: [] },                                                     /* the match cut: Tomato's big drooping bow, a U at (540, 980); the pull back from 0.30 */
  { id: 't1', s: 1.25, k: 'face', foc: 'tom', z: [1.38, 1.42], up: 60, dx: 40, show: ['straw', 'tom', 'lemon'], dof: 3 },
  { id: 'rip', s: 2.84, k: 'pt', x: 850, y: 1110, z: [.9, .93], show: ALLS, dof: 2 },
  { id: 'ripr', s: 4.40, k: 'pt', x: 970, y: 1130, z: [1.32, 1.36], show: ['lemon', 'mango', 'onion'], dof: 3 },
  { id: 'l1', s: 5.30, k: 'face', foc: 'lemon', z: [1.75, 1.8], up: 120, dx: 0, show: ['lemon'], dof: 4 },
  { id: 'm1', s: 6.23, k: 'face', foc: 'mango', z: [1.75, 1.8], up: 120, dx: 0, show: ['mango'], dof: 4 },
  { id: 'o1', s: 7.00, k: 'face', foc: 'onion', z: [1.72, 1.78], up: 120, dx: -20, show: ['onion'], dof: 4 },
  { id: 't2', s: 8.05, k: 'pt', x: 990, y: 1080, z: [1.08, 1.1], show: ['tom', 'lemon', 'mango', 'onion'], dof: 3 },
  { id: 'br1a', s: 9.45, k: 'pt', x: 1650, y: 1050, z: [2.0, 2.06], show: [], closet: true },
  { id: 'br1b', s: 11.05, k: 'pt', x: 1020, y: 1110, z: [1.12, 1.15], show: ['tom', 'lemon', 'mango', 'onion'], dof: 3 },
  { id: 'br1c', s: 12.20, k: 'pt', x: 1650, y: 1050, z: [2.06, 2.1], show: [], closet: true },
  { id: 'l2', s: 13.15, k: 'face', foc: 'lemon', z: [1.45, 1.5], up: 100, dx: 150, show: ['tom', 'lemon'], dof: 3 },
  { id: 'pile', s: 15.38, k: 'pt', x: 400, y: 1090, z: [1.14, 1.18], show: ['straw'], pile: true, dof: 2 },
  { id: 's1', s: 17.62, k: 'pt', x: 430, y: 1060, z: [1.62, 1.68], show: ['straw'], pile: true, dof: 3 },
  { id: 'o2', s: 18.48, k: 'face', foc: 'onion', z: [1.72, 1.78], up: 120, dx: -40, show: ['onion', 'lemon'], dof: 4 },
  { id: 's2', s: 20.05, k: 'pt', x: 430, y: 1060, z: [1.6, 1.64], show: ['straw'], pile: true, dof: 3 },
  { id: 'l3', s: 20.74, k: 'face', foc: 'lemon', z: [1.7, 1.75], up: 120, dx: -30, show: ['onion', 'lemon', 'tom'], dof: 4 },
  { id: 's3', s: 21.58, k: 'pt', x: 440, y: 1050, z: [1.9, 1.96], show: ['straw'], pile: true, dof: 3 },
  { id: 's4', s: 23.10, k: 'pt', x: 500, y: 1010, z: [1.5, 1.55], show: ['straw'], pile: true, dof: 2 },
  { id: 'st1', s: 24.36, k: 'pt', x: 1210, y: 1110, z: [1.02, 1.05], show: ['onion', 'lemon', 'tom', 'mango'], dof: 2 },
  { id: 'end', s: 25.30, k: 'mug', show: ['straw'], pile: true },
];
const sShot = shots(TS, SSH);
let SFR = null;
function castS(lt, sh) { return { straw: strawS(lt, sh), tom: tomS(lt, sh), lemon: lemonS(lt, sh), mango: mangoS(lt, sh), onion: onionS(lt, sh) }; }
/* the world point of a held prop's anchor: the hand (local grip) plus the prop's offset (local) */
function handWorld(o, side, dx = 0, dy = 0) { const k = KINDS[o.kind], s = o.s, cy = o.y - (o.lift || 0) - (k.leg + k.ry * .9) * s, g = o.grip[side]; return [o.x + (g[0] + dx) * s, cy + (g[1] + dy) * s]; }
/* the match cut in: Tomato's big drooping bow (the knot at the gift's top centre) at (540, 980), about 480 px wide, still until 0.30; then the pull back to Tomato */
const BOWZ = 1.4;                                              /* the drooping bow (s 1.3, droop .85) is about 255 px wide in the world: 500 px at this zoom */
function camBow(lt, C) {
  const bx = STACKTOP.x, by = CT.top + 1 - 100 - 80 - 88 + 10 + 34, u = ss(lt, .3, 1.25);
  return { x: bx, y: by - 20 / BOWZ + 60 * u, z: lerp(BOWZ, 1.5, u) };
}
/* the end: the mug in her hand, pushed in to (540, 980) about 300 px wide, still for the last half second */
const T_MUGREST = TS.snapT(26.5);
function camMug(lt, C) {
  const o = C.straw, [mx, my] = handWorld(o, 'r', o.mugDx || 0, (o.mugDy ?? 24) - 105 * o.mugS), z1 = 300 / (220 * o.mugS * o.s), z0 = z1 * .82, u = ss(lt, 25.3, T_MUGREST);
  return { x: lerp(mx + 40, mx, u), y: lerp(my - 60, my - 20 / z1 - 13, u), z: lerp(z0, z1, u) };
}
function camS(lt) {
  const sh = sShot(lt), C = castS(lt, sh), u = c01((lt - sh.s) / (sh.e - sh.s));
  let cx = 540, cy = 960, z = 1;
  if (sh.k === 'bow') { const c = camBow(lt, C); cx = c.x; cy = c.y; z = c.z; }
  else if (sh.k === 'mug') { const c = camMug(lt, C); cx = c.x; cy = c.y; z = c.z; }
  else if (sh.k === 'pt') { z = lerp(sh.z[0], sh.z[1], easeIO(u)); cx = sh.x; cy = sh.y; }
  else if (sh.k === 'face') { z = lerp(sh.z[0], sh.z[1], easeIO(u)); const [fx, fy] = faceC(C[sh.foc]); cx = fx - (sh.dx || 0) / z; cy = fy + sh.up / z; }
  zoomTo(cx, cy, z);
  const quiet = (sh.k === 'bow' && lt < .3) || (sh.k === 'mug' && lt >= T_MUGREST - .02);
  if (!quiet) { CAM.x += 2 * hn(lt, 1.3, 4); CAM.y += 1.5 * hn(lt, 1.1, 5); CAM.r += .001 * hn(lt, .9, 6); }
  SFR = { C, sh };
}

// ------------------------------------------------------------------ SWAP: the picture (the station at night, lit by the lamp, the string lights and the tree through L20)
const T_CRACK = TS.snapT(9.8), T_BITE = TS.snapT(12.62), T_SHUT = TS.snapT(12.78);
const closetOpen = lt => ss(lt, T_CRACK, T_CRACK + .3) * (1 - ss(lt, T_SHUT, T_SHUT + .22));
function drawS(lt) {
  const { C, sh } = SFR;
  const st = { night: 1, t: lt, lamp: 1, closet: closetOpen(lt), power: 1, noLap: true };
  st.onCounter = top => { puddingRow(top, lt); giftTower(top, lt); };
  V2.setLight({ key: [-.35, -.7], keyColor: '#ffe9c8', keyA: .2, rim: '#bcd0ff', rimA: .32, shadow: '#1c1830', shadowA: .3, bounce: '#ffd9a8', bounceA: .14, amb: '#e8eeff', ambA: .05, frontDark: .02 }); V2.opts.reflect = false;
  let L = [], tr = [], lap = null;
  const brenda = sh.closet ? brendaS(lt, T_BITE) : null;
  const closetO = { hero: false, inside: brenda ? (x0, x1) => { HEROMODE = true; drawChar(brenda); HEROMODE = false; } : null };
  const room = () => { const r = stRoom(st, { closet: closetO }); L = r.lights; const ct = stCounter(st); tr = ct.lights; lap = ct.lap; };
  const px = sh.dof || 0;
  if (px > .5) { SOFT++; REG.suppress++; V2.dof(px, room); REG.suppress--; SOFT--; } else room();
  const list = sorted(sh.show.map(n => C[n]));
  for (const o of list) { if (o.joy > .01) sparkles(o, o.joy, lt, 9); drawIn(o); }
  if (sh.pile) { drawPile(lt, 1); drawPile(lt, 2); drawPile(lt, 3); }
  C.ripShot = sh.id === 'rip'; if (lt < 6.5 && !blockB(lt)) scraps(lt, C);
  if (talking(TS, 'o1', lt) || talking(TS, 'o2', lt) || sh.id === 'st1') { const o = C.onion, [fx, fy] = faceC(o); if (A15.tearsAura && sh.show.includes('onion')) A15.tearsAura(fx, fy, 1, { r: 150 * o.s, n: 16, t: lt, size: 1.1 * o.s, seed: 5 }); }
  /* the glow of the bulbs, then the night light pass */
  lightsGlow(L.concat(tr), lt, 1.2, 54);
  if (window.L20 && typeof L20.pass === 'function') {
    const pl = [{ kind: 'point', x: 800, y: CT.top - 140, r: 760, color: '#ffd59a', power: 1.0, soft: .8 },
      { kind: 'point', x: 300, y: 260, r: 900, color: '#ffe8c8', power: .55 }, { kind: 'point', x: 900, y: 260, r: 900, color: '#ffe8c8', power: .55 }, { kind: 'point', x: 1500, y: 260, r: 900, color: '#ffe8c8', power: .5 },
      { kind: 'point', x: PILE.SX, y: 980, r: 520, color: '#ffe0f0', power: .55 },
      { kind: 'rect', x: (WIN.x0 + WIN.x1) / 2, y: (WIN.y0 + WIN.y1) / 2, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0, color: '#8fb0ff', power: .35 }];
    L.filter((b, i) => i % 3 === 1).forEach(b => pl.push({ kind: 'point', x: b.x, y: b.y, r: 120, color: b.color, power: .5 * twk(lt, b.phase) }));
    tr.filter((b, i) => i % 3 === 0).forEach(b => pl.push({ kind: 'point', x: b.x, y: b.y, r: 110, color: b.color, power: .45 * (hasA('twinkle') ? A22.twinkle(lt, b.phase) : twk(lt, b.phase)) }));
    if (st.closet > .02) pl.push({ kind: 'point', x: CLOSET.x0 + 60, y: CLOSET.y0 + 80, r: 420, color: '#ffe2a0', power: .7 * st.closet });
    L20.pass(ctx, { ambient: .62, tint: '#16224a', lights: pl, bloom: .45, vignette: .2, t: lt, glow: .26 });
  }
}
const SWAP = {
  shot: lt => sShot(lt).id,
  cam: camS,
  draw: drawS,
  fx: lt => ({ bloom: .4, vignette: .26, grain: .04, contrast: .07, sat: .1, tint: [['#ffd6a0', .05, 'soft-light']] }),
  blur: lt => { const sh = sShot(lt); if (lt - sh.s < .04) return 1; if (sh.id === 'bow' && lt > .3) return 2; if (sh.id === 'rip' && lt > SC.rip[0] - .05 && lt < 4.6) return 3; if (sh.id === 'pile' && lt < 16.9) return 3; return 1; },
  over(lt) {},
};
window.__EP22_SCENES.swap = SWAP;
})();
