'use strict';
/* SHIFT HAPPENS, Episode 22: "The Secret Santa". Builder E22-SANTA. Scene `santa` (7:30 PM, SANTA'S VISIT, 27.641 s). Registers window.__EP22_SCENES.santa. Everything is a pure function of the scene time `lt`.
 *
 * THE SET is one flat front elevation of the day room (world px; the back wall meets the floor at WALLB 1180, the cast stands on the feet line FY 1300; a standing character is about 380 to 490 tall). Left to right:
 * a night window (x 130..430) behind two residents in wheelchairs in Santa hats (Mr. Pear x 40, Mrs. Cranberry x 270), Tomato (x 560) by the gift pile (x 610..900) at the foot of the lit tree (centre x 900,
 * top 455), Santa's low armchair in front of the tree (x 1150), Onion (x 1460, until she leaves at 10.4), a TV playing a fireplace video on the wall (x 1520..1760), the Hoyer lift parked off right with Lemon.
 * String lights swag along the top of the wall. Light: L20.pass (warm lamps, the tree's glow, the TV's fire, a cool window), the bulbs as slow, out-of-phase lamps (never over 1 Hz, never in sync, never off).
 * THE SOFT BODIES (ep22_santa_sim.js, SOFT2D, baked once and sampled with world.at(lt)): the gait belt (a strap round a circle collider: his waist seen from above, projected onto the front view), the paper
 * torn off four gifts in the search, the Hoyer sling (a band hung from the spreader bar's hooks round a circle collider that is Santa). Until the library lands each is a hand-animated stand-in, checked at
 * draw time; the kit pieces (A22.santa, santaHat, tree, gift, dentureCup, hoyer, gaitBelt, stringLights) likewise.
 *
 * SHOTS (scene-local s; every start snapped to a frame; the boundary frame belongs to the NEW shot)
 *   open 0-2.43 the hero bauble on the tree at (540, 520), 258 px, still to 0.30 (the match cut in); the pull back to the room (sleighbells 0.30: Santa shakes his strap of bells); "Ho ho ho!" belly bounce |
 *   o1 2.43-5.20 two-shot, Onion with the clipboard: "Santa, have you fallen in the last ninety days?" | me2 5.20-7.40 Santa: "Every Christmas Eve. Down a chimney." (the chimney mime) |
 *   o2 7.40-8.50 Onion "Gait belt." (she snaps it taut) | belt 8.50-9.97 two-shot: the belt flies round his middle, buckle 8.96, tug 9.46 (his eyes widen), he sits down hard in the low chair |
 *   cr1 9.97-11.42 Mrs. Cranberry, gummy: "Santa, I want my teeth." | me3 11.42-12.50 Santa in the chair: "Ho ho... what?" | t1 12.50-14.36 Tomato, proud: "I wrapped everything on the counter." |
 *   search 14.36-16.90 Strawberry tears through the pile (paperrip 14.66 stapler, 15.26 candle, 15.86 gloves, 16.46 the denture cup) | cup 16.90-17.86 the cup: the lid pops, the teeth clack 17.26 |
 *   s1 17.86-18.63 "Found them." | cr2 18.63-19.80 "Merry Christmas!" with teeth (ding 19.02: the glint) | me4 19.80-20.84 Santa sunk in the chair: "I can't get up." | l1 20.84-21.93 Lemon: "Get the Hoyer." |
 *   hoyer 21.93-23.93 the wide: the roll in (hoyerroll 22.08), the loops hooked (slingrustle 22.68), the lift (hoyerlift 23.18) | rise 23.93-26.15 Santa rising, swinging: "This is the best Christmas." |
 *   end 26.15-27.64 the sling with Santa in it; still from 27.30 (the match cut out: the U of the sling centred at (540, 980), about 520 px wide).
 */
(() => {
if (!window.TIMELINE_EP22 || !window.H6 || !window.UI || !window.V2 || !window.A7 || !window.A9 || !window.A11 || !window.A15) return;
const { zoomTo, faceC } = window.H6;
const A7 = window.A7, A9 = window.A9, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const sr = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
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
const shade = (c, f) => { const [r, g, b] = V2.rgb(c); const q = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${q(r)},${q(g)},${q(b)})`; };
const mixc = (a, b, k) => { const A = V2.rgb(a), B = V2.rgb(b); return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`; };
const INKC = 'rgba(25,16,30,.82)';
const poly = (pts, fill, stroke, lw) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 3; ctx.lineJoin = 'round'; ctx.stroke(); } };
const hasK = (k, n) => !!(k && typeof k[n] === 'function');
const glow = (x, y, r, color, a, core) => { if (a <= .003) return; if (hasK(window.FX18, 'glow')) FX18.glow(ctx, { x, y, r, color, alpha: a, core: core ?? .5 }); else V2.glow(x, y, r, V2.rgb(color).join(','), Math.min(1, a), 'screen', .3); };
const damp = (t, t0, f, tau) => t < t0 ? 0 : Math.sin((t - t0) * f) * Math.exp(-(t - t0) / tau);

// ------------------------------------------------------------------ the frozen timeline: beats, words, cues, frame snapping (as ep21_closet.js)
const TLX = window.TIMELINE_EP22;
const SCN = TLX.scenes.find(s => s.id === 'santa'), START = SCN.start, LN = {};
for (const l of TLX.lines) if (l.scene === 'santa') LN[l.id] = l;
const bS = b => SCN.beats[b].s, bE = b => SCN.beats[b].e;
const ls = id => LN[id].s - START, le = id => LN[id].e - START;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1], wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const CUE = { bells: .3, buckle: 8.961, tug: 9.461, rip1: 14.659, rip2: 15.259, rip3: 15.859, rip4: 16.459, clack: 17.259, ding: 19.02, roll: 22.082, rustle: 22.682, lift: 23.182, sting: 26.291 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);
const RIPS = [CUE.rip1, CUE.rip2, CUE.rip3, CUE.rip4];
const spk = (id, lt, a = .08, b = .2) => !!LN[id] && lt >= ls(id) - a && lt < le(id) + b;
/* the loudness of a recorded line at scene time lt (0..1, from its mouth track) */
function voice(id, lt) {
  const l = LN[id]; if (!l) return 0;
  const f = (lt - (l.s - START)) * 30; if (f < 0 || f >= l.mouth.length) return 0;
  const i = Math.floor(f), j = Math.min(l.mouth.length - 1, i + 1), u = f - i, dg = n => (l.mouth.charCodeAt(n) - 48) / 9;
  return lerp(dg(i), dg(j), u);
}

// ------------------------------------------------------------------ the layout (world px)
const FY = 1300, WALLB = 1180, CEIL = 236;
const TREE = { x: 900, base: 1222, top: 455, hw: 285, s: 1.45 };
const BAUBLE = { x: 790, y: 760, r: 43 };                 /* the hero bauble of the match cut: 86 px across, at zoom 3 it is 258 px at (540, 520) */
const CHAIR = { x: 1150, seat: 1204, back: 924, armTop: 1114, hw: 192, iw: 146 };     /* A22.lowChair at (1150, FY): seat top FY-96, back top FY-376, arms x +-146..192 from FY-186 */
const PILE = { x0: 610, x1: 900 };
const WIN = { x0: 130, x1: 430, y0: 430, y1: 900 };
const TV = { x0: 1530, x1: 1770, y0: 640, y1: 800 };
const POS = { pear: { x: 40, s: 1.0 }, cran: { x: 270, s: 1.06 }, tom: { x: 600, s: .9 }, straw: { x: 762, s: .9 }, santa: { x: 1150, s: 1.0 }, onion: { x: 1460, s: .95 }, lemon: { x: 1990, s: .9 } };
const HOY = { park: 1915, home: 1462, boom: 420, a0: -.24, a1: .36, mastH: 640, bar: 150 };   /* mast x parked / at the chair; boom length; boom angle down / up; the bar's half length */
const T_SIT = [9.56, 9.86];                               /* he sits down hard after the tug */
const T_EXIT_ONION = 10.35;                               /* Onion leaves (off right) while we are on Mrs. Cranberry */

// ------------------------------------------------------------------ text: hero only where it is safe (as ep21_closet.js)
let SOFT = 0;
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
function scrBox(cx, cy, hw, hh) {
  const m = ctx.getTransform(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [u, v] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) { const X = m.a * (cx + u) + m.c * (cy + v) + m.e, Y = m.b * (cx + u) + m.d * (cy + v) + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return { x0: a, y0: b, x1: c, y1: d };
}
function heroOK(size, cx, cy, w, h = size) {
  if (SOFT || size * scrOf(ctx) < 31) return false;
  const b = scrBox(cx, cy, w / 2 + 10, h * .5 + 10);
  return b.x0 >= 50 && b.x1 <= W - 50 && b.y0 >= 50 && b.y1 <= 1372 && !(b.x0 < 506 && b.y0 < 250 && b.x1 > 40 && b.y1 > 108);
}
function TXT(str, cx, cy, o = {}) {
  const size0 = o.size || 30, fit = o.maxW ? UI.fit(str, o.maxW, { size: size0, font: o.font, weight: o.weight, italic: o.italic, spacing: o.spacing, lw: o.lw }) : null, size = fit ? fit.size : size0;
  const wd = (fit ? fit.w : UI.sizeOf(str, o).w) || size * str.length * .6, mid = o.align === 'left' ? cx + wd / 2 : o.align === 'right' ? cx - wd / 2 : cx;
  const hero = o.hero !== undefined ? !!o.hero : heroOK(size, mid, cy, wd);
  return UI.label(str, cx, cy, Object.assign({}, o, { hero, crop: o.crop !== undefined ? o.crop : !hero }));
}

// ------------------------------------------------------------------ the room: ceiling, wall, wainscot, floor, rug (world px). Evening: lamps, the tree, the TV's fire; a cool window
function roomShell(lt) {
  ctx.fillStyle = lg(0, CEIL - 900, 0, CEIL, [[0, '#8f8475'], [1, '#c9bda9']]); ctx.fillRect(-2600, CEIL - 900, 6400, 900);
  ctx.strokeStyle = 'rgba(90,80,66,.3)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let y = CEIL - 40, st = 40; y > CEIL - 900; st *= 1.3, y -= st) { ctx.moveTo(-2600, y); ctx.lineTo(3800, y); }
  for (let x = -2600; x <= 3800; x += 150) { ctx.moveTo(x, CEIL); ctx.lineTo(x + (x - 900) * .9, CEIL - 900); }
  ctx.stroke();
  ctx.fillStyle = '#a89a84'; ctx.fillRect(-2600, CEIL - 10, 6400, 10);
  /* the wall: warm cream with a faint stripe, a picture rail, a wood wainscot under a chair rail */
  ctx.fillStyle = lg(0, CEIL, 0, WALLB, [[0, '#f0e2c6'], [.6, '#e9d8b8'], [1, '#dcc7a2']]); ctx.fillRect(-2600, CEIL, 6400, WALLB - CEIL);
  ctx.fillStyle = 'rgba(190,150,100,.10)'; for (let x = -2600; x < 3800; x += 64) ctx.fillRect(x, CEIL, 26, 1000 - CEIL);
  ctx.fillStyle = '#c9ab7e'; ctx.fillRect(-2600, 268, 6400, 8); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-2600, 268, 6400, 2);
  ctx.fillStyle = lg(0, 1000, 0, WALLB, [[0, '#9a6b45'], [1, '#7d5232']]); ctx.fillRect(-2600, 1000, 6400, WALLB - 1000);
  ctx.fillStyle = 'rgba(60,35,18,.25)'; for (let x = -2600; x < 3800; x += 120) ctx.fillRect(x, 1012, 3, WALLB - 1012);
  ctx.fillStyle = lg(0, 988, 0, 1012, [[0, '#d7b98d'], [.5, '#b38a5c'], [1, '#86613d']]); ctx.fillRect(-2600, 988, 6400, 24);
  ctx.fillStyle = '#5e3f27'; ctx.fillRect(-2600, WALLB - 16, 6400, 16);
  /* the floor: warm planks that come toward us (rows widen), a braided rug under the chair */
  ctx.fillStyle = lg(0, WALLB, 0, 2300, [[0, '#9c7350'], [.25, '#b0845c'], [1, '#c79a6c']]); ctx.fillRect(-2600, WALLB, 6400, 2300 - WALLB);
  ctx.strokeStyle = 'rgba(70,40,20,.28)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let y = WALLB + 14, st = 14; y < 2300; st *= 1.22, y += st) { ctx.moveTo(-2600, y); ctx.lineTo(3800, y); }
  for (let x = -2600; x <= 3800; x += 110) { ctx.moveTo(x, WALLB); ctx.lineTo(x + (x - 900) * 1.6, 2300); }
  ctx.stroke();
  ctx.save(); ctx.translate(CHAIR.x - 20, FY + 6); ctx.scale(1, .22);
  for (let i = 0; i < 6; i++) { ctx.strokeStyle = ['#8e2430', '#2f6a3c', '#c9a441', '#8e2430', '#2f6a3c', '#c9a441'][i]; ctx.lineWidth = 26; ctx.beginPath(); ctx.ellipse(0, 0, 420 - i * 34, 300 - i * 34, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#7a1e28'; ctx.beginPath(); ctx.ellipse(0, 0, 210, 100, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
/* the night window behind the residents: deep blue, slow snow, frost in the corners, a wreath */
function nightWindow(lt) {
  const { x0, x1, y0, y1 } = WIN, w = x1 - x0, h = y1 - y0;
  ctx.fillStyle = '#5a3c26'; rr(x0 - 22, y0 - 22, w + 44, h + 44, 8); ctx.fill();
  ctx.save(); rr(x0, y0, w, h, 4); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#1d2f63'], [.6, '#2f4a86'], [1, '#4b6aa6']]); ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#e9eef8'; ctx.beginPath(); ctx.moveTo(x0, y1); ctx.quadraticCurveTo(x0 + w * .3, y1 - 70, x0 + w * .6, y1 - 46); ctx.quadraticCurveTo(x0 + w * .85, y1 - 28, x1, y1 - 60); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,140,.85)'; for (const [px, py] of [[x0 + 60, y1 - 90], [x0 + 200, y1 - 64], [x0 + 250, y1 - 72]]) { ctx.fillRect(px, py, 9, 12); }
  for (let i = 0; i < 46; i++) {
    const sp = 40 + 40 * sr(i, 3), fx = x0 + ((sr(i, 1) * w + 18 * Math.sin(lt * .7 + i)) % w + w) % w, fy = y0 + ((sr(i, 2) * h + lt * sp) % h);
    ctx.fillStyle = 'rgba(240,246,255,' + (.5 + .4 * sr(i, 4)) + ')'; ctx.beginPath(); ctx.arc(fx, fy, 2 + 3 * sr(i, 5), 0, TAU); ctx.fill();
  }
  for (const [cx, cy, a] of [[x0, y0, 0], [x1, y0, PI / 2], [x1, y1, PI], [x0, y1, -PI / 2]]) { ctx.fillStyle = rg(cx, cy, 4, 120, [[0, 'rgba(235,244,255,.55)'], [1, 'rgba(235,244,255,0)']]); ctx.fillRect(cx - 120, cy - 120, 240, 240); }
  ctx.restore();
  ctx.fillStyle = '#6b4a30'; ctx.fillRect(x0 + w / 2 - 6, y0, 12, h); ctx.fillRect(x0, y0 + h * .48 - 6, w, 12);
  ctx.fillStyle = '#e8dcc6'; ctx.fillRect(x0 - 34, y1 + 16, w + 68, 18);
  wreath(x0 + w / 2, y0 + 120, 78, lt);
}
function wreath(x, y, r, lt) {
  if (hasK(window.A22, 'wreath')) { A22.wreath(ctx, { x, y, s: r / 80, t: lt }); return; }
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, rr2 = r + 8 * Math.sin(i * 2.3); ctx.fillStyle = i % 2 ? '#1f5a32' : '#2c7a44'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * rr2 * .82, y + Math.sin(a) * rr2 * .82, 26, 12, a + 1.2, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3; ctx.fillStyle = '#d0263a'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8, 7, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#c62233'; ctx.strokeStyle = INKC; ctx.lineWidth = 2.5;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, y + r * .82); ctx.quadraticCurveTo(x + sd * 44, y + r * .82 - 36, x + sd * 40, y + r * .82 + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + r * .86); ctx.lineTo(x + sd * 26, y + r * .82 + 56); ctx.lineTo(x + sd * 12, y + r * .82 + 50); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(x, y + r * .84, 10, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* a slow twinkle per bulb: .3 to .8 Hz, its own phase, never off (photosensitivity) */
const twinkle = (t, ph, i) => (hasK(window.A22, 'twinkle') ? A22.twinkle(t, ph) : .72 + .28 * Math.sin(t * TAU * (.3 + .5 * sr(i, 61)) + ph * TAU));
const BULB = ['#ff4b4b', '#ffd23f', '#4bd06b', '#4b9bff', '#ff9a3c', '#fff3d6'];
/* the string lights along the top of the wall: swags between hooks; returns the bulbs (world) for the glow pass */
function stringLights(lt, out) {
  const hooks = []; for (let x = -700; x <= 2500; x += 320) hooks.push([x, 300 + 14 * Math.sin(x * .013)]);
  for (let i = 0; i + 1 < hooks.length; i++) {
    const [ax, ay] = hooks[i], [bx, by] = hooks[i + 1], sag = 58 + 10 * sr(i, 7);
    if (hasK(window.A22, 'stringLights')) { const r = A22.stringLights(ctx, { a: [ax, ay], b: [bx, by], sag, n: 6, t: lt, seed: i, glow: 0 }); if (r && r.lights) for (const L of r.lights) out.push({ x: L.x, y: L.y, color: L.color, a: A22.twinkle(lt, L.phase || 0), r: 28 }); continue; }
    const P = u => [lerp(ax, bx, u), lerp(ay, by, u) + sag * 4 * u * (1 - u)];
    ctx.strokeStyle = '#26402a'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k <= 16; k++) { const [x, y] = P(k / 16); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    for (let k = 1; k < 7; k++) {
      const n = i * 7 + k, [x, y] = P(k / 7), c = BULB[n % BULB.length], tw = twinkle(lt, sr(n, 9), n);
      ctx.fillStyle = '#3a4a3a'; ctx.fillRect(x - 3, y - 2, 6, 7);
      ctx.fillStyle = mixc('#5a4a40', c, .45 + .55 * tw); ctx.beginPath(); ctx.ellipse(x, y + 14, 6.5, 10, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (.35 + .4 * tw) + ')'; ctx.beginPath(); ctx.ellipse(x - 2, y + 10, 2, 3.5, 0, 0, TAU); ctx.fill();
      out.push({ x, y: y + 14, color: c, a: tw });
    }
  }
}
/* the TV on its cabinet: a fireplace video (logs, slow flames); its warm light goes into the pass */
function fireTV(lt) {
  const { x0, x1, y0, y1 } = TV, w = x1 - x0, h = y1 - y0;
  ctx.fillStyle = '#6a4a32'; rr(x0 - 40, y1 + 150, w + 80, 230, 8); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x0 - 40, y1 + 260, w + 80, 4);
  ctx.fillStyle = '#16141a'; rr(x0 - 12, y0 - 12, w + 24, h + 24, 10); ctx.fill();
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(x0 + w / 2 - 8, y1 + 12, 16, 138); ctx.fillRect(x0 + w / 2 - 60, y1 + 140, 120, 12);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#1a0c08'], [1, '#3a1a0c']]); ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = '#5a3a2a'; for (let i = 0; i < 9; i++) ctx.fillRect(x0 + (i % 3) * 82 + (i / 3 | 0) * 20 - 10, y0 + (i / 3 | 0) * 26, 78, 22);
  const fy = y1 - 30;
  for (let i = 0; i < 7; i++) {
    const fx = x0 + 40 + i * 27, hh = 50 + 26 * Math.sin(lt * (2.1 + .3 * i) + i * 1.7) + 10 * Math.sin(lt * 3.3 + i);
    ctx.fillStyle = lg(0, fy - hh, 0, fy, [[0, 'rgba(255,220,120,0)'], [.35, 'rgba(255,170,60,.85)'], [1, 'rgba(255,90,20,.95)']]);
    ctx.beginPath(); ctx.moveTo(fx - 20, fy); ctx.quadraticCurveTo(fx - 16, fy - hh * .6, fx + 4 * Math.sin(lt * 2 + i), fy - hh); ctx.quadraticCurveTo(fx + 16, fy - hh * .5, fx + 20, fy); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#4a2a18'; rr(x0 + 30, fy - 4, w - 60, 18, 8); ctx.fill(); rr(x0 + 60, fy + 8, w - 120, 16, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + w * .4, y0); ctx.lineTo(x0, y0 + h * .7); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ the tree (A22.tree when the kit has it; a stand-in otherwise) and the hero bauble of the match cut
const treeHW = y => 14 + (y - TREE.top) / (TREE.base - 40 - TREE.top) * (TREE.hw - 14);
const TIERS = [[455, 610], [560, 760], [700, 920], [860, 1080], [1010, 1190]];
const ORN = (() => { const a = []; for (let i = 0; i < 22; i++) { const y = lerp(560, 1150, sr(i, 31)), w = treeHW(y) * .82, x = TREE.x + (sr(i, 32) * 2 - 1) * w; if (Math.hypot(x - BAUBLE.x, y - BAUBLE.y) < 90) continue; a.push({ x, y, r: 13 + 7 * sr(i, 33), c: ['#c81e32', '#e0b23a', '#2f62c8', '#c8ccd6', '#c81e32'][i % 5] }); } return a; })();
const TLIGHTS = (() => { const a = []; for (let i = 0; i < 34; i++) { const u = i / 34, y = lerp(520, 1170, u), sw = Math.sin(u * 21) , x = TREE.x + sw * treeHW(y) * .86; a.push({ x, y: y + 6, color: BULB[i % 5], phase: sr(i, 41) }); } return a; })();
function bauble(x, y, r, c, o = {}) {
  ctx.save();
  ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = Math.max(1.5, r * .06); ctx.beginPath(); ctx.moveTo(x, y - r - r * .25); ctx.lineTo(x + (o.hx || 0), y - r - (o.hang || r * .9)); ctx.stroke();
  ctx.fillStyle = rg(x - r * .35, y - r * .4, r * .1, r * 1.25, [[0, mixc(c, '#ffffff', .55)], [.45, c], [1, shade(c, .45)]]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(30,10,20,.5)'; ctx.lineWidth = Math.max(1.5, r * .05); ctx.stroke();
  if (o.band) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(255,236,170,.9)'; ctx.fillRect(x - r, y - r * .12, r * 2, r * .24); ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(x + i * r * .28, y, r * .06, 0, TAU); ctx.fill(); } ctx.restore(); }
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x - r * .38, y - r * .42, r * .2, r * .13, -.6, 0, TAU); ctx.fill();
  if (o.lights) for (const [dx, dy, lc] of o.lights) { ctx.fillStyle = lc; ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * .05, 0, TAU); ctx.fill(); }
  ctx.fillStyle = lg(x - r * .25, 0, x + r * .25, 0, [[0, '#8a7036'], [.5, '#f2dc8a'], [1, '#7a6026']]); rr(x - r * .24, y - r - r * .26, r * .48, r * .3, r * .06); ctx.fill();
  ctx.restore();
}
function treeStand(lt, out) {
  const { x, base, top } = TREE;
  ctx.fillStyle = 'rgba(30,15,10,.25)'; ctx.beginPath(); ctx.ellipse(x, base + 6, 300, 34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6a4226'; ctx.fillRect(x - 22, base - 60, 44, 62);
  ctx.fillStyle = '#b8202f'; ctx.beginPath(); ctx.ellipse(x, base, 250, 30, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4efe6'; ctx.beginPath(); ctx.ellipse(x, base - 4, 250, 30, 0, PI * .05, PI * .95); ctx.lineTo(x - 236, base + 6); ctx.fill();
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const [ty, by] = TIERS[i], hw = treeHW(by) + 26, hwT = i === 0 ? 4 : treeHW(ty) * .5;
    ctx.beginPath(); ctx.moveTo(x - hwT, ty); ctx.lineTo(x + hwT, ty);
    ctx.lineTo(x + hw, by);
    for (let k = 1; k <= 8; k++) { const u = k / 8, px = x + hw - u * hw * 2; ctx.quadraticCurveTo(px + hw / 8, by + 22, px, by); }
    ctx.closePath();
    ctx.fillStyle = lg(x - hw, ty, x + hw, by, [[0, '#2d7a45'], [.5, '#1d5c34'], [1, '#123f24']]); ctx.fill();
    ctx.strokeStyle = 'rgba(8,30,14,.6)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,200,130,.25)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k < 16; k++) { const u = sr(k + i * 20, 51), v = sr(k + i * 20, 52), yy = lerp(ty + 10, by - 6, v), ww = treeHW(yy) * .9, xx = x + (u * 2 - 1) * ww; ctx.moveTo(xx, yy); ctx.lineTo(xx + 12, yy + 10); }
    ctx.stroke();
  }
  /* the tinsel garland: gold swags across the tiers */
  ctx.lineCap = 'round';
  for (let g = 0; g < 4; g++) {
    const y0 = 600 + g * 150, y1 = y0 + 120, w0 = treeHW(y0) * .95, w1 = treeHW(y1) * .95;
    const pts = []; for (let k = 0; k <= 14; k++) { const u = k / 14; pts.push([lerp(x - w0, x + w1, u), lerp(y0, y1, u) + 26 * Math.sin(u * PI)]); }
    if (hasK(window.A22, 'tinsel')) { A22.tinsel(ctx, pts, { t: lt, width: 14, color: '#e8c25a' }); continue; }
    ctx.strokeStyle = 'rgba(150,110,30,.9)'; ctx.lineWidth = 12; ctx.beginPath(); pts.forEach(([a, b], k) => k ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,226,130,.95)'; ctx.lineWidth = 6; ctx.stroke();
    for (let k = 0; k < pts.length; k++) { const tw = .5 + .5 * Math.sin(lt * 1.3 + k * 1.9 + g); ctx.fillStyle = 'rgba(255,250,220,' + (.3 + .5 * tw) + ')'; ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1] - 3, 3, 0, TAU); ctx.fill(); }
  }
  for (const b of ORN) bauble(b.x, b.y, b.r, b.c);
  for (let i = 0; i < TLIGHTS.length; i++) {
    const L = TLIGHTS[i], tw = twinkle(lt, L.phase, i + 100);
    ctx.fillStyle = mixc('#4a4030', L.color, .4 + .6 * tw); ctx.beginPath(); ctx.ellipse(L.x, L.y, 6, 9, .3, 0, TAU); ctx.fill();
    out.push({ x: L.x, y: L.y, color: L.color, a: tw });
  }
  /* the star */
  const sx = x, sy = top - 22, R = 44;
  ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, r = k % 2 ? R * .44 : R; ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } ctx.closePath();
  ctx.fillStyle = lg(sx - R, sy - R, sx + R, sy + R, [[0, '#fff3b0'], [.5, '#f2c440'], [1, '#c08a1a']]); ctx.fill(); ctx.strokeStyle = 'rgba(120,80,10,.8)'; ctx.lineWidth = 3; ctx.stroke();
  out.push({ x: sx, y: sy, color: '#ffe08a', a: .85 + .15 * Math.sin(lt * 1.7), r: 130 });
}
/* the tree: the kit's when it exists (its lights come back for the glow pass), the stand-in otherwise; then the hero bauble, always ours (the match cut's geometry) */
function tree(lt, out) {
  let done = false;
  if (hasK(window.A22, 'tree')) {
    try { const r = A22.tree(ctx, { x: TREE.x, y: TREE.base, s: TREE.s, lights: true, glow: 0, t: lt, seed: 22 }); if (r && r.lights) for (const L of r.lights) out.push({ x: L.x, y: L.y, color: L.color, a: A22.twinkle(lt, L.phase || 0), r: 30 }); done = true; } catch (e) { done = false; }
  }
  if (!done) treeStand(lt, out);
  const sw = .012 * Math.sin(lt * 1.1);
  ctx.save(); ctx.translate(BAUBLE.x, BAUBLE.y - BAUBLE.r * 1.9); ctx.rotate(sw); ctx.translate(-BAUBLE.x, -(BAUBLE.y - BAUBLE.r * 1.9));
  bauble(BAUBLE.x, BAUBLE.y, BAUBLE.r, '#c8182c', { band: true, hang: BAUBLE.r * .7, lights: [[-.55, .35, 'rgba(255,230,160,.9)'], [.2, .55, 'rgba(160,220,255,.8)'], [.55, .2, 'rgba(255,170,170,.8)']] });
  ctx.restore();
}

// ------------------------------------------------------------------ Santa's low armchair (red velvet, gold buttons): the back is drawn behind him, the arms and the seat front after him
function chairBack(lt, sunk) {
  if (hasK(window.A22, 'lowChair')) { A22.lowChair(ctx, { x: CHAIR.x, y: FY, s: 1, part: 'back', t: lt }); return; }
  const { x, seat, back, hw } = CHAIR;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(30,10,10,.35)'; ctx.beginPath(); ctx.ellipse(x, FY + 2, hw + 40, 26, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - hw + 20, seat + 30); ctx.lineTo(x - hw + 6, back + 90); ctx.quadraticCurveTo(x - hw - 10, back + 10, x - hw + 60, back); ctx.quadraticCurveTo(x, back - 40, x + hw - 60, back); ctx.quadraticCurveTo(x + hw + 10, back + 10, x + hw - 6, back + 90); ctx.lineTo(x + hw - 20, seat + 30); ctx.closePath();
  ctx.fillStyle = lg(0, back, 0, seat, [[0, '#b52a35'], [1, '#7a1520']]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,200,200,.12)'; ctx.beginPath(); ctx.ellipse(x - 60, back + 90, 50, 120, -.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e2b54a'; for (const fx of [-.55, 0, .55]) for (const fy of [.3, .6]) { ctx.beginPath(); ctx.arc(x + fx * (hw - 40), lerp(back, seat, fy), 6, 0, TAU); ctx.fill(); }
  /* the seat cushion (it gives under him) */
  const cy = seat + 4 + 14 * sunk;
  ctx.fillStyle = lg(0, cy - 30, 0, cy + 40, [[0, '#c23340'], [1, '#86202a']]); rr(x - hw + 40, cy - 30, (hw - 40) * 2, 70, 26); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.restore();
}
function chairFront(lt, sunk) {
  if (hasK(window.A22, 'lowChair')) { A22.lowChair(ctx, { x: CHAIR.x, y: FY, s: 1, part: 'front', t: lt }); return; }
  const { x, seat, armTop, hw } = CHAIR;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = lg(0, seat + 20, 0, FY, [[0, '#9a1f2a'], [1, '#6a121a']]); rr(x - hw + 30, seat + 26, (hw - 30) * 2, FY - seat - 40, 14); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.fillStyle = '#d8b56a'; ctx.fillRect(x - hw + 40, seat + 40, (hw - 40) * 2, 6);
  for (const sd of [-1, 1]) {
    const ax = x + sd * (hw - 34);
    ctx.fillStyle = lg(ax - 40, 0, ax + 40, 0, [[0, sd < 0 ? '#c43442' : '#8e1d28'], [1, sd < 0 ? '#8e1d28' : '#c43442']]);
    rr(ax - 38, armTop, 76, FY - armTop - 14, 30); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = 'rgba(255,210,210,.2)'; ctx.beginPath(); ctx.ellipse(ax - sd * 6, armTop + 22, 26, 12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a2a18'; rr(ax - 20, FY - 16, 40, 16, 4); ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ wrapped gifts: A22.gift when the kit has it, else a stand-in (bottom centre x, y; w, h; paper stripes|dots|trees|candy|plain)
const PRINT = {
  stripes: (c, c2, w, h) => { ctx.fillStyle = c2; for (let i = -h; i < w + h; i += 26) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 12, 0); ctx.lineTo(i + 12 - h, h); ctx.lineTo(i - h, h); ctx.closePath(); ctx.fill(); } },
  candy: (c, c2, w, h) => { ctx.fillStyle = c2; for (let i = -h; i < w + h; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 15, 0); ctx.lineTo(i + 15 + h, h); ctx.lineTo(i + h, h); ctx.closePath(); ctx.fill(); } },
  dots: (c, c2, w, h) => { ctx.fillStyle = c2; for (let y = 8, r = 0; y < h + 10; y += 18, r++) for (let x = (r % 2) * 9 + 6; x < w + 10; x += 18) { ctx.beginPath(); ctx.arc(x, y, 4.2, 0, TAU); ctx.fill(); } },
  trees: (c, c2, w, h) => { ctx.fillStyle = c2; for (let y = 10, r = 0; y < h + 20; y += 28, r++) for (let x = (r % 2) * 16 + 10; x < w + 20; x += 32) { ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 7, y + 6); ctx.lineTo(x - 7, y + 6); ctx.closePath(); ctx.fill(); } },
  plain: () => {},
};
function giftStand(o) {
  const { x, y, w, h } = o, c = o.color || '#c62828', c2 = o.color2 || '#f4f1ea', rc = o.ribbonColor || '#f2c94c';
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,10,10,.22)'; ctx.beginPath(); ctx.ellipse(0, 0, w * .56, 8, 0, 0, TAU); ctx.fill();
  rr(-w / 2, -h, w, h, 4); ctx.fillStyle = c; ctx.fill();
  ctx.save(); ctx.clip(); ctx.translate(-w / 2, -h); (PRINT[o.paper] || PRINT.plain)(c, c2, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, 0, w, h * .18); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(w * .78, 0, w * .22, h); ctx.restore();
  ctx.strokeStyle = INKC; ctx.lineWidth = 3; rr(-w / 2, -h, w, h, 4); ctx.stroke();
  if (o.ribbon !== false) { ctx.fillStyle = rc; ctx.fillRect(-7, -h, 14, h); ctx.fillRect(-w / 2, -h * .55 - 6, w, 12); ctx.strokeStyle = 'rgba(80,50,10,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(-7, -h, 14, h); }
  if (o.bow !== false) { const b = Math.min(w, 70) * .34; ctx.fillStyle = rc; ctx.strokeStyle = 'rgba(80,50,10,.7)'; ctx.lineWidth = 2; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * b * .7, -h - b * .35, b * .75, b * .42, sd * -.5, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, -h - b * .2, b * .3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function gift(o) {
  if (hasK(window.A22, 'gift')) { try { A22.gift(ctx, Object.assign({ s: 1, t: 0 }, o)); return; } catch (e) { /* fall back to the stand-in */ } }
  giftStand(o);
}
/* the pile at the foot of the tree (back row first); the four gifts of the search sit on top and are drawn by the search */
const PILEG = [
  { x: 650, y: 1268, w: 118, h: 96, paper: 'stripes', color: '#c62828', color2: '#f7efe2' }, { x: 770, y: 1262, w: 150, h: 128, paper: 'dots', color: '#2e7d4f', color2: '#f4e9c8', ribbonColor: '#d8263a' },
  { x: 880, y: 1266, w: 104, h: 86, paper: 'trees', color: '#2f5fb0', color2: '#e8f0ff' }, { x: 628, y: 1298, w: 96, h: 62, paper: 'candy', color: '#f6f0e6', color2: '#d32f3a', ribbonColor: '#2e7d4f' },
  { x: 726, y: 1300, w: 120, h: 74, paper: 'plain', color: '#7b3fa0', ribbonColor: '#f2c94c' }, { x: 842, y: 1298, w: 110, h: 84, paper: 'dots', color: '#d8a93a', color2: '#fff6d8', ribbonColor: '#c62828' },
];
/* the four gifts Tomato wrapped off the counter, in the order Strawberry rips them: where each sits on the pile, what is inside */
const SG = [
  { x: 842, y: 1210, w: 112, h: 50, paper: 'candy', color: '#f6f0e6', color2: '#2e7d4f', ribbonColor: '#c62828', item: 'stapler', rot: -.05 },
  { x: 900, y: 1196, w: 80, h: 84, paper: 'stripes', color: '#2f5fb0', color2: '#f2f6ff', ribbonColor: '#f2c94c', item: 'candle', rot: .04 },
  { x: 860, y: 1250, w: 110, h: 70, paper: 'trees', color: '#c62828', color2: '#f7efe2', ribbonColor: '#f2c94c', item: 'gloves', rot: .06 },
  { x: 872, y: 1264, w: 76, h: 64, paper: 'dots', color: '#2e7d4f', color2: '#ffe9a8', ribbonColor: '#d8263a', item: 'cup', rot: -.03 },
];
function stapler(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = '#2a2a30'; rr(-56, -10, 112, 14, 5); ctx.fill();
  ctx.fillStyle = lg(0, -34, 0, -8, [[0, '#4a4a54'], [1, '#1c1c22']]); ctx.beginPath(); ctx.moveTo(-54, -10); ctx.lineTo(-50, -30); ctx.quadraticCurveTo(10, -40, 54, -22); ctx.lineTo(54, -10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-40, -32, 70, 4);
  ctx.restore();
}
function candle(x, y, s, rot) {
  if (hasK(window.A22, 'candle')) { try { A22.candle(ctx, { x, y, s, rot, lit: 0 }); return; } catch (e) { /* stand-in */ } }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(230,240,250,.55)'; rr(-28, -70, 56, 70, 10); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#f3e2c0'; rr(-24, -56, 48, 54, 8); ctx.fill();
  ctx.fillStyle = '#c69a5a'; ctx.fillRect(-24, -40, 48, 22); ctx.fillStyle = '#fff6e2'; ctx.fillRect(-20, -36, 40, 14);
  ctx.fillStyle = '#3a2a20'; ctx.fillRect(-1.5, -66, 3, 10); ctx.fillStyle = '#8a8a90'; rr(-30, -76, 60, 10, 4); ctx.fill();
  ctx.restore();
}
function gloveBox(x, y, s, rot) {
  if (hasK(window.A22, 'gloveBox')) { try { A22.gloveBox(ctx, { x, y, s, rot }); return; } catch (e) { /* stand-in */ } }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.fillStyle = '#7e57c2'; rr(-56, -64, 112, 64, 5); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#f2eefa'; rr(-44, -52, 88, 22, 4); ctx.fill(); ctx.fillStyle = '#5a3a9a'; for (let i = 0; i < 5; i++) ctx.fillRect(-36 + i * 15, -45, 10, 6);
  ctx.fillStyle = '#9c7ae0'; ctx.beginPath(); ctx.moveTo(-14, -64); ctx.quadraticCurveTo(-8, -88, 4, -84); ctx.quadraticCurveTo(14, -92, 18, -64); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* the denture cup: a lidded plastic cup, the lid on a hinge at the back; open 0..1; the plates inside (clack 0..1: the bite snaps) */
function dentures(x, y, s, clack) {
  if (hasK(window.A22, 'dentures')) { try { A22.dentures(ctx, { x, y, s, open: clack }); return; } catch (e) { /* stand-in */ } }
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const gap = 4 + 10 * clack;
  for (const sd of [-1, 1]) {
    const yy = sd * gap;
    ctx.fillStyle = '#e88a9a'; ctx.beginPath(); ctx.ellipse(0, yy + sd * 8, 30, 12, 0, sd < 0 ? PI : 0, sd < 0 ? TAU : PI); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fbfaf2'; for (let i = -3; i <= 3; i++) { rr(i * 8 - 3.6, sd < 0 ? yy - 2 : yy - 8, 7.2, 10, 2.5); ctx.fill(); ctx.strokeStyle = 'rgba(40,30,30,.45)'; ctx.lineWidth = 1; ctx.stroke(); }
  }
  ctx.restore();
}
function dentureCup(x, y, s, rot, open, clack, lt, hero) {
  if (hasK(window.A22, 'dentureCup')) { try { const pop = ss(lt, CUE.clack - .12, CUE.clack - .02) * (open > .5 ? 1 : 0); A22.dentureCup(ctx, { x, y, s, rot, open, teeth: pop < .5, label: 'CRANBERRY', hero: !!hero, t: lt }); if (pop >= .5) { const hop = Math.max(0, Math.sin(Math.min(PI, (lt - CUE.clack + .12) * 6))) * 34 * s; dentures(x, y - 64 * s - hop, s * .95, clack); } return; } catch (e) { /* stand-in */ } }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round';
  const S = s, cw = 40 * S, ch = 62 * S;
  ctx.fillStyle = 'rgba(210,230,245,.55)'; ctx.beginPath(); ctx.moveTo(-cw, -ch); ctx.lineTo(cw, -ch); ctx.lineTo(cw * .86, 0); ctx.lineTo(-cw * .86, 0); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip(); dentures(0, -ch * .5 - 6 * S * clack, S * .95, clack); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-cw * .7, -ch * .9, cw * .2, ch * .8);
  ctx.strokeStyle = INKC; ctx.lineWidth = 2.6 * Math.max(.8, S); ctx.beginPath(); ctx.moveTo(-cw, -ch); ctx.lineTo(cw, -ch); ctx.lineTo(cw * .86, 0); ctx.lineTo(-cw * .86, 0); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#f7f4ea'; rr(-cw * .72, -ch * .42, cw * 1.44, ch * .26, 4 * S); ctx.fill(); ctx.strokeStyle = 'rgba(40,40,60,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
  /* the lid: hinged at the back right, it flips up and over */
  ctx.save(); ctx.translate(cw * 1.02, -ch); ctx.rotate(-2.1 * open);
  ctx.fillStyle = lg(0, -10 * S, 0, 6 * S, [[0, '#8fc4e8'], [1, '#5a9ac8']]); rr(-cw * 2.08, -12 * S, cw * 2.16, 14 * S, 6 * S); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.restore();
  const lab = TXT('CRANBERRY', 0, -ch * .29, { size: Math.max(9, 12 * S), fill: '#7a1530', weight: 900, hero: !!hero, maxW: cw * 1.3 });
  ctx.restore();
  return lab;
}

// ------------------------------------------------------------------ stand-in accessories until A22 lands (drawn in the 'mid' layer, under the face, so the mouth stays readable)
EXT.acc.fp22s_coat = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  const rx = k.rx, ry = k.ry, cin = o.cinch || 0;
  ctx.save(); ell(0, 0, rx, ry); ctx.clip();
  ctx.fillStyle = lg(0, 30, 0, ry, [[0, '#d42a36'], [1, '#9a1622']]); ctx.beginPath(); ctx.moveTo(-rx, 44); ctx.quadraticCurveTo(0, 26, rx, 44); ctx.lineTo(rx, ry + 4); ctx.lineTo(-rx, ry + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fbf8f2'; ctx.fillRect(-16, 40, 32, ry); ctx.fillRect(-rx, ry - 26, rx * 2, 30);
  ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(-rx + i * rx / 6, ry - 12 + (i % 2) * 6, 5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#16141a'; ctx.fillRect(-rx, 70 - cin * 4, rx * 2, 22 + cin * 2);
  ctx.fillStyle = '#e8c04a'; ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 3; rr(-22, 66 - cin * 4, 44, 30, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#16141a'; ctx.fillRect(-12, 74 - cin * 4, 24, 14);
  ctx.restore();
};
EXT.acc.fp22s_beard = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  const rx = k.rx, my = k.mouthY;
  ctx.save(); ctx.fillStyle = '#fbfaf6'; ctx.strokeStyle = 'rgba(120,120,140,.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-rx * .74, my - 34);
  for (let i = 0; i <= 10; i++) { const a = PI * (1 - i / 10), bx = Math.cos(a) * rx * .74, by = my + 26 + Math.sin(a) * 62; ctx.quadraticCurveTo(bx * 1.12, by + 12, bx, by); }
  ctx.lineTo(rx * .74, my - 34); ctx.quadraticCurveTo(rx * .5, my + 30, 0, my + 34); ctx.quadraticCurveTo(-rx * .5, my + 30, -rx * .74, my - 34); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 22, my - 8, 26, 11, sd * .25, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
/* Mrs. Cranberry without her teeth: the white band of the teeth is painted over with gum (front path only: she faces us while she is gummy) */
EXT.acc.fp22s_gums = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), open = Math.max(c01(o.talk || 0), o.mouthOpen || 0);
  const w = k.mw || 26, sc = w / 26;
  ctx.save(); ctx.translate(0, k.mouthY);
  if (open > .04) {
    const spread = o.mouthState ? o.mouthState.spread : .5, ww = w * (.64 + .62 * spread) + 8 * open * sc * .6, h = (7 + 46 * open) * sc * (1.1 - .3 * spread);
    ctx.beginPath(); let topY;
    if (E.curve >= .3) { ctx.moveTo(-ww, 0); ctx.quadraticCurveTo(0, 5, ww, 0); ctx.ellipse(0, 0, ww, h, 0, 0, PI); topY = 0; }
    else if (E.curve <= -.3) { ctx.moveTo(ww, h * .7); ctx.ellipse(0, h * .7, ww, h * .95, 0, 0, PI, true); ctx.quadraticCurveTo(0, h * .55, ww, h * .7); topY = -h * .25; }
    else { ctx.ellipse(0, h * .45, ww * .88, h * .62, 0, 0, TAU); topY = -h * .15; }
    ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#d9707e'; ctx.fillRect(-ww, topY - 6, ww * 2, 6 + 9 * sc + Math.min(13 * sc, h * .34));
    ctx.fillStyle = 'rgba(255,190,200,.6)'; ctx.fillRect(-ww, topY + 2 + 9 * sc, ww * 2, 2);
  } else {
    ctx.strokeStyle = 'rgba(60,20,30,.5)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-w * .5, 4); ctx.quadraticCurveTo(0, 9, w * .5, 4); ctx.stroke();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ the shared geometry and the soft-body world (ep22_santa_sim.js): built once, lazily, only when SOFT2D has the pieces; stand-ins until then
const SIMM = () => window.__EP22_SIMS && window.__EP22_SIMS.santa;
const GEO = () => SIMM() && SIMM().geo;
let SIM = null, SIMERR = null;
function simInit() {
  if (SIM || SIMERR) return SIM;
  const M = SIMM(), S2 = window.SOFT2D;
  if (!M || !S2 || typeof S2.world !== 'function') return null;
  try { SIM = M.build({}); if (!SIM || !SIM.world || typeof SIM.world.at !== 'function') { SIMERR = 'no world'; SIM = null; } } catch (e) { SIMERR = String(e && e.stack || e); console.error('santa sim: ' + SIMERR); }
  return SIM;
}
const simAt = lt => { const S = simInit(); return S ? S.world.at(Math.max(0, Math.min(S.T, lt))) : null; };
const hoyerAt = lt => GEO().hoyer(lt);
const bodyAt = lt => GEO().body(lt);

// ------------------------------------------------------------------ the Hoyer lift (side view): A22.hoyer when the kit has it and its hooks agree with ours; this stand-in otherwise
function hoyerDraw(h, lt, layer) {
  if (hasK(window.A22, 'hoyer')) { A22.hoyer(ctx, { x: h.mastX, y: FY, s: 1, ang: h.ang, theta: h.theta, layer: layer === 'near' ? 'front' : layer, t: lt, wheelRot: (h.mastX - SIMM().L.HOY.park) / 15 }); return; }
  const H = SIMM().L.HOY, { mastX, pivot, tip, bar, hooks } = h, y = FY;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (layer === 'back') {
    /* the far leg of the base, the mast, the actuator, the handle (drawn before Santa: the near leg and the bar come after the chair) */
    ctx.fillStyle = '#9aa6b4'; rr(h.base.x0 + 30, y - 40, h.base.x1 - h.base.x0 - 30, 16, 8); ctx.fill();
    ctx.fillStyle = 'rgba(20,24,30,.3)'; ctx.beginPath(); ctx.ellipse(mastX - 200, y + 4, 300, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = lg(mastX - 18, 0, mastX + 18, 0, [[0, '#f4f6f9'], [.5, '#d6dde6'], [1, '#aeb8c4']]); rr(mastX - 18, pivot[1] - 6, 36, y - 34 - pivot[1] + 6, 8); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#2f6fd0'; ctx.fillRect(mastX - 18, y - 300, 36, 26);
    ctx.fillStyle = '#e8ecf2'; rr(mastX + 14, y - 452, 86, 18, 9); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2b2f38'; rr(mastX + 66, y - 456, 40, 26, 10); ctx.fill();
    /* the hand control on its coiled cord */
    ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 14; i++) { const yy = y - 420 + i * 10, xx = mastX + 26 + 6 * Math.sin(i * 2.2); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
    ctx.fillStyle = '#f2f4f7'; rr(mastX + 14, y - 286, 26, 52, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#2f9a4a'; ctx.beginPath(); ctx.arc(mastX + 27, y - 270, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.arc(mastX + 27, y - 252, 5, 0, TAU); ctx.fill();
    /* the actuator and the boom */
    const bm = [lerp(pivot[0], tip[0], .42), lerp(pivot[1], tip[1], .42)];
    ctx.strokeStyle = '#7d8794'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(mastX - 4, y - 250); ctx.lineTo(bm[0], bm[1]); ctx.stroke();
    ctx.strokeStyle = '#c3cbd6'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(mastX - 4, y - 250); ctx.lineTo(lerp(mastX - 4, bm[0], .55), lerp(y - 250, bm[1], .55)); ctx.stroke();
    ctx.strokeStyle = INKC; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(pivot[0], pivot[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
    ctx.strokeStyle = '#e9edf2'; ctx.lineWidth = 24; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(pivot[0], pivot[1] - 6); ctx.lineTo(tip[0], tip[1] - 6); ctx.stroke();
    ctx.fillStyle = '#2f6fd0'; ctx.beginPath(); ctx.arc(pivot[0], pivot[1], 16, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
  } else if (layer === 'bar') {
    /* the swivel, the spreader bar, its four hooks */
    ctx.strokeStyle = '#5a6270'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.lineTo(bar.x, bar.y); ctx.stroke();
    ctx.fillStyle = '#2f6fd0'; ctx.beginPath(); ctx.arc(tip[0], tip[1], 13, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = INKC; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(bar.a[0], bar.a[1]); ctx.quadraticCurveTo(bar.x, bar.y - 22, bar.b[0], bar.b[1]); ctx.stroke();
    ctx.strokeStyle = '#d6dde6'; ctx.lineWidth = 12; ctx.stroke();
    for (const [hx, hy] of hooks) { ctx.strokeStyle = '#4a5260'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx, hy - 14); ctx.lineTo(hx, hy); ctx.arc(hx + 6, hy, 6, PI, PI * .1, true); ctx.stroke(); }
  } else {
    /* the near leg with its casters (in front of the chair's feet) */
    const x0 = h.base.x0, x1 = h.base.x1;
    ctx.fillStyle = lg(0, y - 30, 0, y - 10, [[0, '#e3e8ee'], [1, '#b5bfcb']]); rr(x0, y - 34, x1 - x0, 20, 10); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke();
    const spin = (mastX - H.park) / 15;
    for (const cx of [x0 + 22, x1 - 22]) { ctx.fillStyle = '#5a6270'; ctx.fillRect(cx - 4, y - 18, 8, 8); ctx.fillStyle = '#1e2128'; ctx.beginPath(); ctx.arc(cx, y - 6, 12, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a929e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, y - 6); ctx.lineTo(cx + 9 * Math.cos(spin), y - 6 + 9 * Math.sin(spin)); ctx.stroke(); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the sling (stand-in: a band round his lower half, a pouch in front of it, the loops up to the hooks)
const SLING = { col: '#2f8fa8', col2: '#1f6a80', edge: '#e9f4f6', loop: ['#3f9a52', '#d9a62a'] };
function slingStand(lt, b, h) {
  const R = b.r + 6, cx = b.x, cy = b.y, hooked = ss(lt, CUE.rustle - .08, CUE.rustle + .1), band = 30;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the straps: before the rustle they hang over the chair arms; then they fly up to the hooks and go taut as he rises */
  const taut = c01(b.lift / 40);
  for (const sd of [-1, 1]) {
    const ex = cx + sd * R * .98, ey = cy + 6;
    for (const [hi, off] of sd < 0 ? [[0, -10], [1, 8]] : [[3, 10], [2, -8]]) {
      const hx = h.hooks[hi][0], hy = h.hooks[hi][1], lx = ex + sd * 40 + off, ly = cy + 150;
      const tx = lerp(lx, hx, hooked), ty = lerp(ly, hy, hooked), mx = (ex + tx) / 2 + sd * lerp(30, 6 + 30 * (1 - taut), hooked), my = (ey + ty) / 2 + lerp(60, 30 * (1 - taut), hooked);
      ctx.strokeStyle = 'rgba(20,30,40,.6)'; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.quadraticCurveTo(mx, my, tx, ty); ctx.stroke();
      ctx.strokeStyle = SLING.loop[hi % 2]; ctx.lineWidth = 9; ctx.stroke();
    }
  }
  /* the pouch: from a sagging rim under his mouth down round his bottom */
  const rimY = cy + 74, rim = (u) => [lerp(cx - R, cx + R, u), rimY + 26 * Math.sin(u * PI) - (1 - Math.sin(u * PI)) * 60];
  ctx.beginPath(); ctx.moveTo(cx - R, cy + 4);
  for (let i = 0; i <= 20; i++) { const a = PI - i / 20 * PI, x = cx + Math.cos(a) * R, y = cy + 4 + Math.sin(a) * (R + 4); ctx.lineTo(x, y); }
  for (let i = 20; i >= 0; i--) { const [x, y] = rim(i / 20); ctx.lineTo(x, y); }
  ctx.closePath();
  ctx.fillStyle = lg(0, rimY - 40, 0, cy + R, [[0, SLING.col], [1, SLING.col2]]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; for (let x = cx - R; x < cx + R; x += 16) { ctx.beginPath(); ctx.moveTo(x, rimY - 70); ctx.lineTo(x + 30, cy + R + 10); ctx.stroke(); } ctx.restore();
  ctx.strokeStyle = INKC; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.strokeStyle = SLING.edge; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i <= 20; i++) { const [x, y] = rim(i / 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  /* the band round the bottom (a little thicker: the padded seat of the sling) */
  ctx.strokeStyle = SLING.col2; ctx.lineWidth = band; ctx.beginPath(); ctx.arc(cx, cy + 4, R + 2, PI * .06, PI * .94); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy + 4, R - 6, PI * .1, PI * .9); ctx.stroke();
  ctx.restore();
}

/* the sling from the sim: the band hangs from the hooks and cradles him; its ends (the loops up to the hooks) are drawn narrower than the seat; drawn BEHIND him (he sits in it, his legs over its front) */
const SLST = { pts: null, o: null };
const SLING_PRINT = (c, w, h) => { c.fillStyle = SLING.col; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 2; for (let x = -h; x < w + h; x += 14) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + h, h); c.stroke(); } c.fillStyle = SLING.edge; c.fillRect(0, 0, w, 3); c.fillRect(0, h - 3, w, 3); c.fillStyle = SLING.loop[0]; c.fillRect(0, 0, w * .2, h); c.fillRect(w * .8, 0, w * .2, h); };
function slingSim(lt, layer, b) {
  const S = simInit(), st = S && simAt(lt), c = st && st.by[S.meta.sling.id]; if (!c) return false;
  const cols = c.cols, rows = c.rows, nt = c.tri.length / 3;
  if (!SLST.pts || SLST.pts.length !== c.pts.length) { SLST.pts = new Float32Array(c.pts.length); SLST.o = {}; SLST.alive = new Uint8Array(nt); SLST.below = new Uint8Array(cols); }
  const P = SLST.pts, Q = c.pts, hooked = ss(lt, 22.7, 22.9);
  for (let i = 0; i < cols; i++) {
    const u = i / (cols - 1), f = lerp(.42, 1, ss(Math.min(u, 1 - u), .1, .28));
    let mx = 0, my = 0; for (let j = 0; j < rows; j++) { const k = j * cols + i; mx += Q[2 * k]; my += Q[2 * k + 1]; } mx /= rows; my /= rows;
    for (let j = 0; j < rows; j++) { const k = j * cols + i; P[2 * k] = mx + (Q[2 * k] - mx) * f; P[2 * k + 1] = my + (Q[2 * k + 1] - my) * f; }
    SLST.below[i] = hooked > 0 && my > b.y + 6 ? 1 : 0;
  }
  /* behind him: the loops (and, before the hooks, all of it); in front: the cradle under his middle */
  for (let t = 0; t < nt; t++) { const col = Math.min(c.tri[3 * t] % cols, c.tri[3 * t + 1] % cols, c.tri[3 * t + 2] % cols), fr = SLST.below[col] && SLST.below[Math.min(cols - 1, col + 1)]; SLST.alive[t] = c.alive[t] && (layer === 'front' ? fr : !fr) ? 1 : 0; }
  const o = Object.assign(SLST.o, c, { pts: P, alive: SLST.alive }); delete o._scr;
  if (layer === 'front' && hooked > 0) {
    /* the pouch: the band's inner edge round his bottom, closed by a rim that dips under his mouth */
    const inner = []; for (let i = 0; i < cols; i++) if (SLST.below[i]) { const k = (rows - 1) * cols + i; inner.push([P[2 * k], P[2 * k + 1]]); }
    if (inner.length > 3) {
      const L0 = inner[0], R0 = inner[inner.length - 1], cx = b.x, rim = [[R0[0], R0[1]], [cx + 112, b.y + 66], [cx + 72, b.y + 86], [cx - 72, b.y + 86], [cx - 112, b.y + 66], [L0[0], L0[1]]];
      ctx.save(); ctx.globalAlpha *= hooked; ctx.lineJoin = 'round';
      ctx.beginPath(); inner.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      for (let i = 1; i < rim.length - 1; i++) ctx.quadraticCurveTo(rim[i][0], rim[i][1], (rim[i][0] + rim[i + 1][0]) / 2, (rim[i][1] + rim[i + 1][1]) / 2);
      ctx.closePath();
      ctx.fillStyle = lg(0, b.y + 40, 0, b.y + b.r + 30, [[0, SLING.col], [1, SLING.col2]]); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2.4; for (let x = cx - 200; x < cx + 200; x += 18) { ctx.beginPath(); ctx.moveTo(x, b.y + 30); ctx.lineTo(x + 70, b.y + b.r + 40); ctx.stroke(); }
      ctx.fillStyle = 'rgba(20,40,50,.18)'; ctx.fillRect(cx - 200, b.y + b.r - 30, 400, 80); ctx.restore();
      ctx.strokeStyle = 'rgba(20,40,50,.85)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rim[0][0], rim[0][1]); for (let i = 1; i < rim.length - 1; i++) ctx.quadraticCurveTo(rim[i][0], rim[i][1], (rim[i][0] + rim[i + 1][0]) / 2, (rim[i][1] + rim[i + 1][1]) / 2); ctx.lineTo(L0[0], L0[1]);
      ctx.strokeStyle = SLING.edge; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = 'rgba(20,40,50,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      SLST.u = { x0: Math.min(L0[0], ...inner.map(p => p[0])), x1: Math.max(R0[0], ...inner.map(p => p[0])), y0: Math.min(L0[1], R0[1]), y1: Math.max(...inner.map(p => p[1])) };
    }
  }
  SOFT2D.drawCloth(ctx, o, { fill: SLING_PRINT, back: SLING.col2, shade: .4, edge: { color: 'rgba(20,40,50,.85)', width: 3 } });
  return true;
}
/* the belt from the sim: the top view of the strap round his waist projected onto the front view; only what is in front of him is drawn (contiguous runs), the buckle at the first particle */
const BRUN = { pts: new Float32Array(160) };
function beltSim(lt, b) {
  const S = simInit(), st = S && simAt(lt), r = st && st.by[S.meta.belt.id]; if (!r) return false;
  const G = GEO(); if (!G.beltWrap(lt).on) return true;
  const n = r.n, P = r.pts, F = []; for (let i = 0; i < n; i++) F.push(G.beltFront(b, P[2 * i], P[2 * i + 1]));
  for (let i = 0; i < n;) {
    if (!F[i][2]) { i++; continue; }
    let j = i; while (j + 1 < n && F[j + 1][2]) j++;
    if (j > i) strap(F.slice(i, j + 1), 22);
    i = j + 1;
  }
  if (F[0][2] && lt >= SIMM().T.belt.hold - .1) buckle(F[0][0], F[0][1], Math.atan2(F[1][1] - F[0][1], F[1][0] - F[0][0]) * .3, 1.1);
  return true;
}
// ------------------------------------------------------------------ the gait belt (stand-in: the front half of a ring round his waist, projected; the buckle; the tail in Onion's hand)
const BELTC = { canvas: '#e9e1cd', stripe: '#2f6fd0', edge: 'rgba(29,26,34,.9)' };
function beltPath(cx, wy, R, e, a0, a1, n = 24) { const p = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([cx + R * Math.cos(a), wy + e * Math.sin(a)]); } return p; }
/* a canvas strap along a polyline (smoothed through the midpoints), as A22.gaitBelt draws it: dark outline, canvas, a blue centre stripe */
function strap(pts, w = 22) {
  if (pts.length < 2) return;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  const go = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); };
  go(); ctx.strokeStyle = 'rgba(20,10,10,.22)'; ctx.lineWidth = w + 9; ctx.save(); ctx.translate(0, 4); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = BELTC.edge; ctx.lineWidth = w + 5; ctx.stroke();
  ctx.strokeStyle = BELTC.canvas; ctx.lineWidth = w; ctx.stroke();
  ctx.strokeStyle = BELTC.stripe; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}
function buckle(x, y, rot, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = lg(-18, -16, 18, 16, [[0, '#f4f6fa'], [.5, '#9aa2ae'], [1, '#5a626e']]); rr(-18, -17, 36, 34, 6); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = '#3a404a'; rr(-10, -10, 20, 20, 3); ctx.fill(); ctx.strokeStyle = '#d8dde6'; ctx.lineWidth = 2; for (let i = -6; i <= 6; i += 4) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i, 8); ctx.stroke(); }
  ctx.restore();
}
/* the belt on him (o: the drawn Santa; hands: Onion's hand points [l, r] world, or null) */
function beltOn(lt, b, hands) {
  const G = GEO(), B = G.beltWrap(lt); if (!B.on) return;
  const cx = b.x, wy = b.y + 40, R = (b.r + 2) * (1 - .055 * B.cinch), e = 30;
  if (!B.buckled) {
    /* the throw: the buckle end goes from her left hand round his right side, behind him, and round his left side to the front */
    const th = lerp(.55, .55 - (2 * PI - (PI / 2 - .55)) * 1.0, eo(B.thr)), tailA = .42;
    if (th > -PI) {
      /* the end is still on the right side or behind: the strap from her right hand to his right side, the rest hidden */
      const vis = beltPath(cx, wy, R, e, tailA, Math.max(0, th), 6); if (hands) vis.unshift(hands[1]); strap(vis);
    } else {
      strap(hands ? [hands[1]].concat(beltPath(cx, wy, R, e, tailA, 0, 6)) : beltPath(cx, wy, R, e, tailA, 0, 6));
      const fr = beltPath(cx, wy, R, e, PI, Math.max(PI / 2, th + 2 * PI), 14); strap(fr);
      const [bx, by] = fr[fr.length - 1]; buckle(bx, by, 0, .9);
    }
    return;
  }
  /* buckled: the whole front arc, the buckle at the front, the tail from the buckle (to her hand while she tugs, then hanging) */
  strap(beltPath(cx, wy, R, e, 0, PI, 28));
  const bx = cx + R * Math.cos(PI / 2 - .12), by = wy + e * Math.sin(PI / 2 - .12);
  const held = hands && lt < CUE.tug + .32;
  const tailEnd = held ? hands[1] : [bx + 44, by + 46 + 4 * Math.sin(lt * 3)];
  strap([[bx + 10, by], [lerp(bx + 10, tailEnd[0], .5), lerp(by, tailEnd[1], .5) + (held ? 4 : 10)], tailEnd], 18);
  buckle(bx, by, -.06, 1);
}

// ------------------------------------------------------------------ torn paper and tossed things of the search (stand-ins: closed-form flights with air drag, landings, rests)
const LAND = [[640, 1350, -.3], [728, 1342, .02], [626, 1316, -.03]];               /* where the stapler, the candle and the glove box come to rest: dropped upright at her feet, in a strip every shot sees whole or not at all */
function flight(i, j, lt) {
  const t0 = RIPS[i], age = lt - t0; if (age < 0) return null;
  const g = SG[i], big = j < 3, k = i * 10 + j;
  const x0 = HOLDP[0] + g.w * .5 + 46 + 24 * sr(k, 1), y0 = HOLDP[1] - g.h * .55 + (sr(k, 2) - .5) * 24;
  const vx = (420 + 520 * sr(k, 3)) * (big ? 1 : 1.15), vy = -(160 + 380 * sr(k, 4)) * (big ? 1 : 1.1), tau = big ? .42 : .3, vt = big ? 210 : 260;
  const yL = (x => (x > PILE.x0 + 20 && x < PILE.x1 - 20 && sr(k, 5) < .4) ? 1190 + 30 * sr(k, 6) : 1306 + 52 * sr(k, 6));
  const X = t => x0 + vx * tau * (1 - Math.exp(-t / tau)) + 12 * Math.sin(t * 5 + k) * (1 - Math.exp(-t / tau)), Y = t => y0 + vt * t + (vy - vt) * tau * (1 - Math.exp(-t / tau));
  let lo = .05, hi = 6, land = yL(X(hi)); if (Y(hi) < land) hi = 99;
  for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (Y(m) >= yL(X(m))) hi = m; else lo = m; }
  const tl = hi, tt = Math.min(age, tl), done = age >= tl;
  const rot = (sr(k, 7) - .5) * 2 + (sr(k, 8) - .5) * 9 * tau * (1 - Math.exp(-tt / tau)) + .5 * Math.sin(tt * 3 + k);
  return { x: X(tt), y: done ? yL(X(tl)) : Y(tt), rot, flip: done ? .42 : Math.cos(tt * (7 + 5 * sr(k, 9)) + k), w: big ? 60 + 26 * sr(k, 10) : 22 + 12 * sr(k, 10), h: big ? 44 + 16 * sr(k, 11) : 16 + 8 * sr(k, 11), g, k, done };
}
function paperPiece(p) {
  const { x, y, rot, w, h, g, k } = p;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, Math.max(.16, Math.abs(p.flip)));
  const pts = []; const n = 9;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, r = .5 + .14 * sr(k * 13 + i, 12); pts.push([Math.cos(a) * w * r * 1.0, Math.sin(a) * h * r]); }
  ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
  const front = p.flip >= 0;
  ctx.fillStyle = front ? g.color : '#f4efe4'; ctx.fill();
  if (front) { ctx.save(); ctx.clip(); ctx.translate(-w / 2, -h / 2); (PRINT[g.paper] || PRINT.plain)(g.color, g.color2, w, h); ctx.restore(); }
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(40,30,30,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}
function paperStand(lt, layer) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) {
    const p = flight(i, j, lt); if (!p) continue;
    if ((layer === 'back') !== (p.done && p.y < 1300)) continue;                /* pieces resting on the pile are drawn with the pile; the rest in front */
    paperPiece(p);
  }
}

// ------------------------------------------------------------------ the cast at scene time lt
/* a Santa hat on anyone: the kit's when it exists, else the engine's own 'santa' hat (what sits where a hat goes is dropped) */
function HAT(o, g) {
  if (hasK(window.A22, 'santaHat')) { try { return A22.santaHat(o, g); } catch (e) { /* the engine's hat */ } }
  o.acc = (o.acc || []).filter(a => !['curlers', 'newsboy', 'fp15_headset', 'bandage7', 'bandage', 'wolfears', 'fp15_visor_badge'].includes(a)).concat(['santa']);
  if (o.kind === 'straw') o.cap = false;
  return o;
}
const usingKitSanta = () => hasK(window.A22, 'santa');
/* where a body-local grip point lands in the world (front view, no yaw): for drawing what a hand holds */
const handW = (o, g) => { const k = KINDS[o.kind], s = o.s || 1, leg = o.noLegs ? 0 : (k.leg || 90); return [o.x + g[0] * s, o.y - (o.lift || 0) - (leg + k.ry * .9) * s + g[1] * s]; };
const toLocal = (o, p) => { const k = KINDS[o.kind], s = o.s || 1, leg = o.noLegs ? 0 : (k.leg || 90); return [(p[0] - o.x) / s, (p[1] - (o.y - (o.lift || 0) - (leg + k.ry * .9) * s)) / s]; };
const HO = [1.5, 1.71, 1.93], HO3 = [11.49, 11.67];                                   /* the "ho"s of me1 and me3 */
const bounce = (lt, ts) => { let v = 0; for (const t0 of ts) if (lt >= t0) v += Math.exp(-(lt - t0) * 9) * Math.sin((lt - t0) * 26); return v; };

function santaOpts(lt) {
  const b = bodyAt(lt), S = SIMM().L.SANTA, s = S.s;
  const sitting = lt >= T_SIT[0], lifted = lt >= CUE.lift + .3, inSling = lt >= CUE.rustle;
  const pose = lifted ? 'hoyer' : sitting ? 'seated' : 'stand';
  let expr = 'happy', look = [0, 0], arms = { l: 'rest', r: 'rest' }, grip = null, hand = null, extra = {};
  /* the bells (0.30): he shakes the strap of sleigh bells in his right hand */
  if (lt < 2.43) { arms = { l: 'rest', r: 'hold' }; grip = { r: [150, 40 - 30 * Math.abs(damp(lt, CUE.bells, 30, .25)) - 10 * ss(lt, .25, .4) * (1 - ss(lt, 1.2, 1.45))] }; hand = { r: 'grip' }; extra.hold = { r: 'fp22s_bells' }; extra.bellsShake = damp(lt, CUE.bells, 34, .3); look = [-.2, -.1]; }
  /* "Ho ho ho!": hands on the belly, head back, a bounce on each ho */
  if (lt >= 1.38 && lt < 2.6) { const k = ss(lt, 1.38, 1.5) * (1 - ss(lt, 2.38, 2.6)); arms = { l: 'hold', r: 'hold' }; grip = { l: [lerp(-150, -96, k), lerp(40, 70, k)], r: [lerp(150, 96, k), lerp(40, 70, k)] }; hand = { l: 'flat', r: 'flat' }; extra.hold = undefined; extra.squash = .09 * bounce(lt, HO); look = [0, -.35 * k]; expr = 'happy'; extra.browUp = 6 * k; }
  if (lt >= 2.6 && lt < 5.2) { look = [.75, -.05]; if (lt > wS('o1', 3)) { extra.browUp = 7 * ss(lt, wS('o1', 3), wS('o1', 3) + .2); } if (lt > wS('o1', 7)) look = [.55, -.55]; }
  /* "Every Christmas Eve. Down a chimney.": a finger up, then both arms up and down the chimney */
  if (lt >= 5.2 && lt < 7.5) {
    look = [.25, -.1]; expr = 'happy';
    if (lt < wS('me2', 3) - .1) { arms = { l: 'rest', r: 'point' }; extra.swing = 0; }
    else { const k = ss(lt, wS('me2', 3) - .12, wS('me2', 3) + .1), d = ss(lt, wS('me2', 5), wE('me2', 5)); arms = { l: 'hold', r: 'hold' }; grip = { l: [-132, lerp(-92, 80, d) - 20 * (1 - k)], r: [132, lerp(-92, 80, d) - 20 * (1 - k)] }; hand = { l: 'open', r: 'open' }; extra.squash = d > .02 && d < .98 ? .06 * Math.sin(d * PI) : 0; }
  }
  /* "Gait belt.": the smile freezes; the belt: arms up out of the way, the tug, eyes wide; then he sits down hard */
  if (lt >= 7.5 && lt < 9.6) { expr = 'happy'; look = [.6, 0]; if (lt > 7.9) { expr = 'neutral'; extra.face = { curve: .25 }; } }
  if (lt >= 8.5 && lt < 9.62) { const k = ss(lt, 8.52, 8.66) * (1 - ss(lt, 9.5, 9.62)); arms = { l: 'hold', r: 'hold' }; grip = { l: [-150, lerp(60, -110, k)], r: [150, lerp(60, -110, k)] }; hand = { l: 'open', r: 'open' }; look = [.35, .45]; }
  if (lt >= CUE.tug - .02 && lt < 10.4) { const k = ss(lt, CUE.tug - .02, CUE.tug + .08) * (1 - ss(lt, 9.95, 10.3)); expr = 'shock'; extra.eyeScale = 1 + .35 * k; extra.browUp = 12 * k; look = [0, -.1]; extra.sx = 1 - .05 * k; extra.sy = 1 + .04 * k; }
  if (sitting) { arms = { l: 'hold', r: 'hold' }; grip = { l: [-(CHAIR.hw - 34) / s, (CHAIR.armTop - 4 - b.y) / s], r: [(CHAIR.hw - 34) / s, (CHAIR.armTop - 4 - b.y) / s] }; hand = { l: 'flat', r: 'flat' }; }
  if (sitting && lt < 10.3) { const k = ss(lt, 9.86, 10.1); expr = k < .5 ? 'shock' : 'happy'; }
  if (lt >= 10.0 && lt < 11.45) { look = [-.75, .05]; expr = 'happy'; }
  /* "Ho ho... what?" */
  if (lt >= 11.42 && lt < 12.6) { expr = lt < wS('me3', 2) - .05 ? 'happy' : 'shock'; extra.squash = .07 * bounce(lt, HO3); look = lt < wS('me3', 2) ? [-.3, -.3] : [-.6, 0]; if (lt >= wS('me3', 2) - .05) { extra.browUp = 10; extra.rot = -.06 * ss(lt, wS('me3', 2) - .05, wS('me3', 2) + .15); } }
  if (lt >= 12.6 && lt < 19.9) { look = [-.8, .1]; expr = lt > CUE.clack ? 'happy' : 'neutral'; }
  /* "I can't get up.": he rocks and pushes on the arms */
  if (lt >= 19.85 && lt < 22.1) { expr = lt < 21.0 ? 'sad' : 'neutral'; const rk = Math.sin((lt - 19.85) * 9) * ss(lt, 19.85, 20.0) * (1 - ss(lt, 20.7, 21.0)); extra.rot = .05 * rk; extra.squash = -.04 * Math.abs(rk); look = lt < 20.9 ? [0, .2] : [.8, -.05]; if (grip) { grip.l[1] -= 14 * Math.abs(rk); grip.r[1] -= 14 * Math.abs(rk); } }
  /* the Hoyer: up he goes; arms up, beaming */
  if (lt >= 22.1) { look = [.6, -.1]; expr = 'shock'; if (lt > CUE.lift + .6) { expr = 'happy'; look = [0, -.15]; } }
  if (lifted) {
    arms = { l: 'hold', r: 'hold' }; grip = { l: [-166, -58], r: [166, -58] }; hand = { l: 'grip', r: 'grip' };
    const wv = ss(lt, wS('me5', 3) - .15, wS('me5', 3) + .1) * (1 - ss(lt, 26.4, 26.9));          /* "best": the right hand lets go and waves */
    if (wv > .02) { grip.r = [lerp(166, 146, wv) + 16 * wv * Math.sin((lt - wS('me5', 3)) * 9), lerp(-58, -96, wv)]; hand.r = 'open'; }
    extra.sparkle = lt > ls('me5');
  }
  if (lt >= CUE.sting - .05) { extra.sparkle = true; look = [0, -.05]; }

  let o = null;
  const kexpr = lt >= 19.85 && lt < 21.0 ? 'santa_stuck' : (expr === 'happy' && (lt < 2.6 || (lt >= 5.2 && lt < 7.5) || lt >= ls('me5') - .2 || (lt >= 11.42 && lt < wS('me3', 2) - .05))) ? 'santa_jolly' : expr;
  if (usingKitSanta()) { try { o = A22.santa({ t: lt, pose, expr: kexpr, who: 'melon', seed: 91 }); } catch (e) { o = null; } }
  const kit = !!o;
  if (!o) o = A9.melon({ t: lt, who: 'melon', expr, seed: 91, acc: ['fp22s_coat', 'fp22s_beard', 'santa'], browColor: '#f6f4ee', browW: 11 });
  Object.assign(o, { x: b.x, s, look, arms, plant: true, noReflect: true });
  if (!kit) o.expr = expr;
  if (grip) o.grip = grip; if (hand) o.hand = hand;
  for (const k in extra) if (extra[k] !== undefined) o[k] = extra[k];
  if (extra.hold === undefined) delete o.hold; else o.hold = extra.hold;
  /* where he is: standing (feet on the floor), seated (the kit's chair: the floor under his boots, shifted by the dip of the sit), in the sling (the centre of his body) */
  if (pose === 'stand') o.y = FY + (b.y - S.standCy);
  else if (kit) { o.y = pose === 'seated' ? FY + (b.y - S.sitCy) : b.y; }
  else { o.noLegs = true; o.noShadow = true; o.y = b.y + S.ry * .9 * s; }
  if (lifted) o.rot = (o.rot || 0) + b.theta * .9;
  o.cinch = GEO().beltWrap(lt).cinch;
  o.__kit = kit; o.__pose = pose; o.__b = b;
  return o;
}
EXT.prop.fp22s_bells = (side, o, t) => {
  const sh = o.bellsShake || 0;
  ctx.save(); ctx.rotate(.3 + .5 * sh); ctx.lineCap = 'round';
  ctx.strokeStyle = '#6a3a1a'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(26, 60 + 20 * sh, 6, 116); ctx.stroke();
  for (let i = 0; i < 5; i++) { const u = .16 + i * .19, x = lerp(0, 6, u) + 26 * 2 * u * (1 - u) + 6 * sh * Math.sin(i), y = lerp(6, 116, u); ctx.fillStyle = rg(x - 3, y - 3, 1, 12, [[0, '#fff4c0'], [.5, '#e8b83a'], [1, '#8a6010']]); ctx.beginPath(); ctx.arc(x + 8, y, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + 13, y + 3); ctx.stroke(); }
  ctx.restore();
};
Object.assign(PROP_BOX, { fp22s_bells: [-20, -10, 50, 130] });

/* Onion: the clipboard; the belt between her hands at "Gait belt."; she steps in, throws it round him, buckles it with her near hand, tugs the tail; steps back; leaves at T_EXIT_ONION */
function onionX(lt) { return lt < 8.25 ? POS.onion.x : lt < 9.6 ? lerp(POS.onion.x, SIMM().L.ONION.belt, ss(lt, 8.25, 8.58)) : lerp(SIMM().L.ONION.belt, POS.onion.x, ss(lt, 9.6, 9.95)); }
function onionOpts(lt) {
  const s = POS.onion.s, x = onionX(lt), sp = spk('o1', lt) || spk('o2', lt);
  let pose = 'clip', expr = 'onion_cry', cry = .5, sob = 0, look = [-.7, 0], yaw = -.3, head = -.35, arms, grip, hold, hand, extra = {};
  if (lt >= 2.4 && lt < 3.3) { look = [-.2, .55]; head = -.15; }                                   /* she reads the question off the clipboard */
  if (lt >= wS('o1', 3)) cry = lerp(.5, .9, ss(lt, wS('o1', 3), wS('o1', 3) + .3));                /* "fallen": a fall screening! */
  if (lt >= 6.38 && lt < 7.5) { sob = .7; cry = 1; look = [-.3, .5]; }                             /* "Down a chimney.": she writes it down, sobbing with joy */
  if (lt >= 7.4) { pose = 'free'; const k1 = ss(lt, 7.5, 7.7), snap = ss(lt, 7.86, 7.94); arms = { l: 'hold', r: 'hold' }; grip = { l: [lerp(-60, -96 - 14 * snap, k1), lerp(90, 40, k1)], r: [lerp(60, 96 + 14 * snap, k1), lerp(90, 40, k1)] }; hand = { l: 'grip', r: 'grip' }; head = -.2; yaw = -.15; look = [-.5, 0]; expr = 'onion_stoic'; cry = .55; }
  if (lt >= 8.25 && lt < 9.95) {
    yaw = -.35; head = -.4; look = [-.6, .3]; expr = 'onion_stoic';
    const o0 = { kind: 'onion', x, y: FY, s }, b = bodyAt(lt), wy = b.y + 40;
    const thr = ss(lt, 8.6, 8.84), back = ss(lt, 8.84, 8.98);
    grip.r = [lerp(110, 70, back) - 30 * thr, lerp(40, -96, thr) + lerp(0, 136, back)];                          /* the throw: up and over, then down */
    const tailSide = [b.x + b.r + 26, wy + 14], front = [b.x + 16, wy + 36], tugTo = [b.x + 110, wy + 30];
    let tgt = lt < 8.62 ? handW(o0, grip.l) : lt < 8.88 ? tailSide : lt < CUE.tug - .02 ? [lerp(front[0], front[0] + 52, ss(lt, 9.1, 9.3)), front[1]] : lt < 9.62 ? [lerp(front[0] + 52, tugTo[0], ss(lt, CUE.tug - .02, CUE.tug + .08)), lerp(front[1], tugTo[1], ss(lt, CUE.tug - .02, CUE.tug + .08))] : handW(o0, [-80, 80]);
    if (lt >= 8.88 && lt < 8.96) tgt = [lerp(tailSide[0], front[0], ss(lt, 8.88, 8.95)), lerp(tailSide[1], front[1], ss(lt, 8.88, 8.95))];
    if (lt >= 8.62) grip.l = toLocal(o0, lt < 9.62 && GEO().tailHand ? GEO().tailHand(lt) : tgt);
    if (lt >= 9.62) { grip.l = [lerp(grip.l[0], -70, ss(lt, 9.62, 9.85)), lerp(grip.l[1], 90, ss(lt, 9.62, 9.85))]; grip.r = [70, 90]; }
    if (lt >= CUE.tug - .05 && lt < 9.7) { extra.squash = -.05 * ss(lt, CUE.tug - .05, CUE.tug + .05) * (1 - ss(lt, 9.5, 9.7)); extra.plant = true; }
  }
  if (lt >= 9.95) { pose = 'clip'; arms = undefined; grip = undefined; hand = undefined; look = [-.7, .1]; expr = 'onion_cry'; cry = .7; }
  const o = A15.onion(Object.assign({ t: lt, x, y: FY, s, pose, expr, cry, sob, look, yaw, headYaw: head, who: 'onion', seed: 171 }, arms ? { arms, grip, hand } : {}, extra));
  if (lt >= 8.25 && lt < 9.95) o.transit = false;
  o.__gripL = grip && grip.l ? handW(o, grip.l) : null; o.__gripR = grip && grip.r ? handW(o, grip.r) : null;
  return o;
}
/* Tomato (Santa hat): claps at the ho ho ho; proud at "I wrapped everything on the counter." (a sweep to the pile at "everything"); steps back for the search */
function tomOpts(lt) {
  const s = POS.tom.s, x = lt < 14.2 ? POS.tom.x : lerp(POS.tom.x, 500, ss(lt, 14.2, 14.5)), sp = spk('t1', lt);
  let arms = { l: 'rest', r: 'rest' }, grip = null, hand = null, look = [.6, -.05], yaw = .35, head = .4, expr = 'tom_fruit';
  if (lt >= 1.45 && lt < 2.6) { const c = Math.abs(Math.sin((lt - 1.45) * 13)); arms = { l: 'hold', r: 'hold' }; grip = { l: [-40 - 30 * c, -10], r: [40 + 30 * c, -10] }; hand = { l: 'flat', r: 'flat' }; }
  if (sp) { look = [lt < wS('t1', 2) ? .1 : .7, -.05]; yaw = .15; head = lt < wS('t1', 2) ? 0 : .35; const sw = ss(lt, wS('t1', 2) - .15, wS('t1', 2) + .12); arms = { l: 'hips', r: sw > .02 ? 'hold' : 'hips' }; if (sw > .02) { grip = { r: [lerp(80, 190, sw), lerp(60, 20, sw)] }; hand = { r: 'open' }; } }
  if (lt >= 14.36 && lt < 17.9) { look = [.8, .2]; head = .5; yaw = .4; expr = lt > RIPS[1] ? 'tom_fruit' : 'tom_fruit'; }
  const o = HAT(A15.tomato({ t: lt, tomPose: 'fruit', headset: false, seed: 181 }));
  o.acc = o.acc.filter(a => a !== 'fp15_formstack');
  return Object.assign(o, { x, y: FY, s, look, yaw, headYaw: head, expr, arms, hold: {}, who: 'tom' }, grip ? { grip } : {}, hand ? { hand } : {});
}
/* Strawberry (per diem, flat): the search at the pile, the cup, "Found them." */
function strawOpts(lt) {
  const s = POS.straw.s, x = 712;
  let arms = { l: 'hold', r: 'hold' }, grip = { l: [-60, 90], r: [60, 90] }, hand = { l: 'grip', r: 'grip' }, look = [.1, .5], yaw = .15, head = .1, expr = 'neutral', lid = .45;
  const o0 = { kind: 'straw', x, y: FY, s, lift: -11.8 * s }, g = searchState(lt);
  if (g) { if (g.l) grip.l = toLocal(o0, g.l); if (g.r) grip.r = toLocal(o0, g.r); look = g.look; }
  if (lt >= SH_CUP && lt < 17.8) { const it = itemAt(3, lt); arms = { l: 'rest', r: 'hold' }; grip = { r: toLocal(o0, [it.x + 30, it.y - 46]) }; hand = { r: 'grip' }; look = [.75, .05]; yaw = .3; head = .35; lid = lt > CUE.clack ? .15 : .45; expr = lt > CUE.clack + .05 ? 'shock' : 'neutral'; }
  if (lt >= 17.8) { arms = { l: 'rest', r: 'hold' }; grip = { r: toLocal(o0, [CUPUP[0] + 30, CUPUP[1] - 46]) }; hand = { r: 'grip' }; look = [-.15, -.05]; yaw = .12; head = .05; expr = 'neutral'; lid = .5; }
  return A11.straw({ t: lt, x, y: FY, s, who: 'straw', expr, lid, look, yaw, headYaw: head, arms, grip, hand, armScale: 1.38, seed: 23 });
}
/* Lemon: flat; "Get the Hoyer." with her hand already on it; she pushes it in */
function lemonOpts(lt) {
  const h = hoyerAt(lt), s = POS.lemon.s, x = h.mastX + 120, sp = spk('l1', lt), push = lt >= CUE.roll - .1 && lt < 22.75;
  const o = A7.lemon({ t: lt, x, y: FY, s, who: 'lemon', expr: sp ? 'dead' : 'neutral', lid: .5, look: [-.8, 0], yaw: -.45, headYaw: sp ? -.15 : -.5, face: { curve: .02 }, acc: ['readers', 'lanyard7'], arms: { l: 'hold', r: 'rest' }, hand: { l: 'grip' }, plant: true });
  const o0 = { kind: 'lemon', x, y: FY, s };
  o.grip = { l: toLocal(o0, [h.mastX + 16, FY - 200]) };
  if (lt >= 22.75) { const pr = ss(lt, 22.8, 23.05); o.arms = { l: 'hold', r: 'rest' }; o.grip = { l: toLocal(o0, [h.mastX + lerp(16, 30, pr), lerp(FY - 200, FY - 252, pr)]) }; o.hand = { l: pr > .5 ? 'point' : 'grip' }; o.look = [-.7, -.4]; o.headYaw = -.35; }
  if (push) { o.gaitW = (x - (SIMM().L.HOY.park + 120)) / s; o.dir = -1; o.stride = 46; o.vx = -600 * s; }
  return o;
}
/* the residents in wheelchairs, in Santa hats: they watch Santa, lean in for the search, cheer the lift */
const RES = { pear: { ctor: o => A7.pear(o), col: '#3b6aa8', blanket: ['#2e7d4f', '#c62828'] }, cran: { ctor: o => A7.cran(o), col: '#7a4a8a', blanket: ['#c62828', '#f4efe6'] } };
function resOpts(n, lt) {
  const P = POS[n], s = P.s, k = KINDS[n], seatY = FY - 62 * s, sp = n === 'cran' && (spk('cr1', lt) || spk('cr2', lt));
  let yaw = .35, head = .4, look = [.6, -.1], expr = 'happy', arms = { l: 'rest', r: 'rest' }, grip = null, hand = null, extra = {};
  if (lt >= 14.36 && lt < 17.9) { look = [.7, .25]; head = .55; extra.rot = .07 * ss(lt, 14.4, 14.8); expr = 'shock'; }   /* they lean in to the search */
  if (lt >= 1.45 && lt < 2.6 && n === 'pear') { const c = Math.abs(Math.sin((lt - 1.45) * 12)); arms = { l: 'hold', r: 'hold' }; grip = { l: [-30 - 30 * c, 0], r: [30 + 30 * c, 0] }; hand = { l: 'flat', r: 'flat' }; }
  const gummy = n === 'cran' && lt < 18.63;
  if (n === 'cran' && sp) { yaw = 0; head = 0; look = [.45, -.05]; expr = 'happy'; }
  if (n === 'cran' && spk('cr1', lt)) { expr = 'sad'; arms = { l: 'rest', r: 'hold' }; grip = { r: [110, -40] }; hand = { r: 'point' }; }
  if (n === 'cran' && lt >= 18.63) { expr = 'happy'; extra.mouthState = undefined; extra.sparkle = true; }
  if (lt >= 23.4) { expr = 'happy'; look = [.6, -.4]; head = .45; if (n === 'pear') { arms = { l: 'cheer', r: 'cheer' }; } }
  const o = HAT(RES[n].ctor({ t: lt, seed: n === 'pear' ? 41 : 43 }));
  if (n === 'cran') o.acc = o.acc.filter(a => a !== 'curlers');
  if (gummy) { o.acc = o.acc.concat(['fp22s_gums']); yaw = 0; head = 0; }
  Object.assign(o, { x: P.x, y: seatY, s, noLegs: true, noShadow: true, noReflect: true, plant: true, yaw, headYaw: head, look, expr, arms, who: n }, grip ? { grip } : {}, hand ? { hand } : {}, extra);
  if (n === 'cran' && lt >= 18.63 && lt < 20.0) { o.mouthState = null; o.teethBoost = 1; }
  return o;
}

// ------------------------------------------------------------------ wheelchairs and lap blankets (after ep20_forecast.js): (x, y) = the sitter's body bottom, s = scale, fl = the floor
function wheelBack(x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(20,10,8,.32)'; ctx.beginPath(); ctx.ellipse(x, fl, (rxS + 64) * s, 24 * s, 0, 0, TAU); ctx.fill();
  const bh = (ryS * 1.6 + 40) * s, tx = y - bh;
  for (const [c, w] of [['#1a1a22', Math.max(5, 10 * s)], ['#8d96a4', Math.max(3, 6 * s)]]) { ctx.strokeStyle = c; ctx.lineWidth = w; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sd * (rxS * .86) * s, y - 30 * s); ctx.lineTo(x + sd * (rxS * .86) * s, tx - 36 * s); ctx.lineTo(x + sd * (rxS * .86 + 30) * s, tx - 40 * s); ctx.stroke(); } }
  rr(x - rxS * .86 * s, tx, rxS * 1.72 * s, bh + 20 * s, 14 * s); ctx.fillStyle = lg(0, tx, 0, y, [[0, shade(col, 1.15)], [1, shade(col, .7)]]); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 4 * s); ctx.stroke();
  for (const sd of [-1, 1]) {
    const wx = x + sd * (rxS + 40) * s, wy = (y + fl) / 2 - 8 * s, wr = (fl - y) * .5 + 56 * s;
    ctx.fillStyle = '#16181e'; ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.beginPath(); ctx.ellipse(wx, wy, 13 * s, wr, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c4cad6'; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.ellipse(wx + sd * 9 * s, wy, 4 * s, wr * .86, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}
function wheelFront(x, y, s, col, ryS, rxS, fl) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const sd of [-1, 1]) {
    const ax = x + sd * (rxS + 2) * s; rr(ax - 17 * s, y - 100 * s, 34 * s, 22 * s, 8 * s); ctx.fillStyle = '#2a2a33'; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3 * s); ctx.stroke();
    ctx.strokeStyle = '#8d96a4'; ctx.lineWidth = Math.max(3, 6 * s); ctx.beginPath(); ctx.moveTo(ax, y - 80 * s); ctx.lineTo(ax, y + 40 * s); ctx.lineTo(ax + sd * 8 * s, fl - 20 * s); ctx.stroke();
    ctx.fillStyle = '#16181e'; ctx.beginPath(); ctx.ellipse(ax + sd * 10 * s, fl - 6 * s, 15 * s, 12 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
    rr(ax - 22 * s + sd * 6 * s, fl - 32 * s, 44 * s, 10 * s, 4 * s); ctx.fillStyle = '#3a3f4a'; ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function lapBlanket(x, y, s, rxS, col, col2, top = 38) {
  ctx.save(); ctx.lineJoin = 'round'; const w = (rxS + 6) * s, ty = y - top * s;
  ctx.beginPath(); ctx.moveTo(x - w, ty); ctx.quadraticCurveTo(x, ty - 16 * s, x + w, ty); ctx.lineTo(x + w * 1.06, y + 52 * s); for (let i = 6; i >= 0; i--) ctx.lineTo(x - w * 1.06 + (i / 6) * w * 2.12, y + 52 * s + (i % 2 ? 9 : 0) * s); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = Math.max(2, 3.6 * s); ctx.stroke(); ctx.clip();
  ctx.strokeStyle = col2; ctx.globalAlpha = .55; ctx.lineWidth = Math.max(2, 9 * s); for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / 4, ty - 40 * s); ctx.lineTo(x + i * w / 4, y + 70 * s); ctx.stroke(); }
  for (let j = 0; j < 6; j++) { ctx.beginPath(); ctx.moveTo(x - w * 1.1, ty + 10 * s + j * 22 * s); ctx.lineTo(x + w * 1.1, ty + 10 * s + j * 22 * s); ctx.stroke(); }
  ctx.restore();
}
function drawResident(n, o, audited) {
  const R = RES[n], k = KINDS[o.kind], s = o.s, x = o.x, y = o.y;
  if (!audited) REG.suppress++;
  wheelBack(x, y, s, R.col, k.ry, k.rx, FY);
  drawChar(o);
  lapBlanket(x, y, s, k.rx, R.blanket[0], R.blanket[1], n === 'cran' ? 4 : 30);
  wheelFront(x, y, s, R.col, k.ry, k.rx, FY);
  if (!audited) REG.suppress--;
}

// ------------------------------------------------------------------ the search: which gift is where, the hands, the tossed things (pure functions of lt)
const HOLDP = [722, 1262];
const CUPUP = [894, 1196];
const SH_CUP = snapT(16.75);                                  /* the cup held up beside her face (bottom centre): the lid pops, the teeth hop clear of her face */                                  /* where she holds each gift: its bottom centre, in front of her belly */
function giftAt(i, lt) {
  const g = SG[i], R = RIPS[i], t0 = R - .26, t1 = R - .05;
  if (lt < t0) return { x: g.x, y: g.y, rot: g.rot, k: 0 };
  const k = ss(lt, t0 + .04, t1), arc = 0;
  return { x: lerp(g.x, HOLDP[0], k), y: lerp(g.y, HOLDP[1], k) - arc, rot: lerp(g.rot, 0, k), k };
}
function itemAt(i, lt) {
  const R = RIPS[i]; if (lt < R) return null;
  if (i === 3) return lt < SH_CUP ? { x: HOLDP[0], y: HOLDP[1] - 4, rot: 0, held: true } : { x: CUPUP[0], y: CUPUP[1], rot: 0, held: true };   /* up by her face from the cut to the cup shot */
  const tT = R + .2, tL = R + .5, [lx, ly, lr] = LAND[i];
  if (lt < tT) return { x: HOLDP[0], y: HOLDP[1] - 4, rot: 0, held: true };
  if (lt < tL) { const u = (lt - tT) / (tL - tT); return { x: lerp(HOLDP[0], lx, u), y: lerp(HOLDP[1] - 4, ly, u * u) - 50 * u * (1 - u), rot: i === 0 ? lerp(0, lr - 2 * PI, u) : lr * u + .06 * Math.sin(u * PI * 3), held: false }; }
  const bt = lt - tL; return { x: lx, y: ly - 12 * Math.abs(Math.sin(bt * 14)) * Math.exp(-bt * 9), rot: lr, held: false };
}
function drawItem(i, it, lt, s = 1) {
  const kind = SG[i].item;
  if (kind === 'stapler') stapler(it.x, it.y, s, it.rot);
  else if (kind === 'candle') candle(it.x, it.y, s * .95, it.rot);
  else if (kind === 'gloves') gloveBox(it.x, it.y, s * .66, it.rot);
  else dentureCup(it.x, it.y, 1.22 * s, it.rot, cupOpen(lt), cupClack(lt), lt, FR && FR.sh.k === 'cup');
}
const cupOpen = lt => ss(lt, 17.02, 17.2);
const cupClack = lt => lt < CUE.clack ? 0 : Math.abs(Math.sin((lt - CUE.clack) * 22)) * Math.exp(-(lt - CUE.clack) * 5);
/* Strawberry's hands for the search (world points), and where she looks */
function searchState(lt) {
  if (lt < 14.3 || lt >= 16.9) return null;
  let i = 0; for (let j = 0; j < 4; j++) if (lt >= RIPS[j] - .3) i = j;
  const R = RIPS[i], g = giftAt(i, lt), G = SG[i], r = { l: null, r: null, look: [.1, .5] };
  const sideL = [g.x - G.w / 2 - 4, g.y - G.h * .45], sideR = [g.x + G.w / 2 + 4, g.y - G.h * .45];
  if (lt < R - .05) { const k = ss(lt, R - .3, R - .2), near = [g.x - G.w / 2 + 10, g.y - G.h * .55]; r.r = g.k === 0 ? [lerp(HOLDP[0] + 60, near[0], k), lerp(HOLDP[1] - 50, near[1], k)] : [lerp(near[0], sideR[0], ss(g.k, .6, 1)), lerp(near[1], sideR[1], ss(g.k, .6, 1))]; r.l = g.k > .3 ? sideL : [HOLDP[0] - 70, HOLDP[1] - 70]; r.look = [.4, .3]; }
  else if (lt < R + .2) { const y = ss(lt, R - .03, R + .09); r.l = [HOLDP[0] - 40, HOLDP[1] - 40]; r.r = [lerp(sideR[0], HOLDP[0] + 150, y), lerp(sideR[1], HOLDP[1] - 120, y)]; r.look = [.15, .55]; }
  else { const k = ss(lt, R + .2, R + .32); r.l = i < 3 ? [lerp(HOLDP[0] - 40, HOLDP[0] - 120, k), lerp(HOLDP[1] - 40, HOLDP[1] - 10, k)] : [HOLDP[0] - 40, HOLDP[1] - 40]; r.r = [HOLDP[0] + 50, HOLDP[1] - 40]; r.look = i < 3 ? [-.3, .5] : [0, .55]; }
  return r;
}

// ------------------------------------------------------------------ the shots (scene-local; every start snapped to a frame; the boundary frame is the NEW shot)
const SH = [
  { id: 'open', s: 0, k: 'open' },
  { id: 'o1', s: 2.43, k: 'fix', x: 1305, y: 1170, z: [1.30, 1.34] },
  { id: 'me2', s: 5.20, k: 'face', foc: 'santa', z: [1.85, 1.95], up: 140, dx: 0, bg: ['onion'] },
  { id: 'o2', s: 7.40, k: 'face', foc: 'onion', z: [1.95, 2.05], up: 130, dx: -100, bg: ['santa'] },
  { id: 'belt', s: 8.50, k: 'fix', x: 1262, y: 1150, z: [1.42, 1.46] },
  { id: 'cr1', s: 9.97, k: 'face', foc: 'cran', z: [2.15, 2.25], up: 120, dx: -30, bg: ['pear', 'tom'] },
  { id: 'me3', s: 11.42, k: 'face', foc: 'santa', z: [1.85, 1.92], up: 140, dx: 0 },
  { id: 't1', s: 12.50, k: 'face', foc: 'tom', z: [1.85, 1.95], up: 120, dx: 70, bg: ['cran'] },
  { id: 'search', s: 14.36, k: 'fix', x: 728, y: 1150, z: [1.58, 1.62] },
  { id: 'cup', s: 16.75, k: 'cup' },
  { id: 's1', s: 17.55, k: 'fix', x: 548, y: 1130, z: [1.28, 1.31] },
  { id: 'cr2', s: 18.63, k: 'face', foc: 'cran', z: [2.2, 2.3], up: 120, dx: 40 },
  { id: 'me4', s: 19.80, k: 'face', foc: 'santa', z: [1.8, 1.88], up: 150, dx: 0 },
  { id: 'l1', s: 20.84, k: 'face', foc: 'lemon', z: [1.95, 2.05], up: 130, dx: 60 },
  { id: 'hoyer', s: 21.93, k: 'fix', x: 1322, y: 1030, z: [1.07, 1.09] },
  { id: 'rise', s: 23.93, k: 'rise' },
  { id: 'end', s: 26.15, k: 'end' },
];
for (const sh of SH) sh.s = sh.s === 0 ? 0 : snapT(sh.s);
SH.forEach((sh, i) => { sh.e = i + 1 < SH.length ? SH[i + 1].s : SCN.dur + .5; });
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
/* the sling's U at the end (the match cut out): its box centred at (540, 980), about 520 px wide */
let ENDF = null;
function endFrame() {
  if (ENDF) return ENDF;
  const b = bodyAt(27.3), S = simInit();
  let x0 = b.x - b.r - 66, x1 = b.x + b.r + 66, y0 = b.y + 6, y1 = b.y + b.r + 66;
  if (S) {
    const c = S.world.at(27.3).by[S.meta.sling.id]; x0 = 1e9; x1 = -1e9; y1 = -1e9;
    for (let i = 0; i < c.pts.length / 2; i++) { const x = c.pts[2 * i], y = c.pts[2 * i + 1]; if (y < b.y + 6) continue; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  const z = 520 / (x1 - x0), cy = (y0 + y1) / 2;
  return (ENDF = { x: (x0 + x1) / 2, y: cy - 20 / z, z, box: [x0, y0, x1, y1] });
}
function camOf(lt, sh, C) {
  const dur = Math.min(sh.e, SCN.dur) - sh.s, u = c01((lt - sh.s) / dur);
  if (sh.k === 'open') return { x: K([[.3, 790], [1.42, 1021], [2.43, 1022]], lt), y: K([[.3, 760 + 440 / 3], [1.42, 1000], [2.43, 1004]], lt), z: 1 / K([[.3, 1 / 3], [1.42, 1 / .94], [2.43, 1 / .955]], lt) };
  if (sh.k === 'face') { const o = C[sh.foc]; if (!o) return { x: 540, y: 960, z: 1 }; const z = lerp(sh.z[0], sh.z[1], easeIO(u)), [fx, fy] = faceOf(o); return { x: fx - (sh.dx || 0) / z, y: fy + sh.up / z, z }; }
  if (sh.k === 'cup') return { x: 762, y: 1176, z: lerp(2.15, 2.28, easeIO(u)) };
  if (sh.k === 'rise') return { x: K([[23.93, 1396], [26.15, 1404]], lt), y: K([[23.93, 1010], [24.7, 960], [26.15, 950]], lt), z: K([[23.93, 1.14], [26.15, 1.18]], lt) };
  if (sh.k === 'end') { const f = endFrame(), a = { x: f.x + 12, y: f.y - 16, z: f.z * 1.08 }, k = ss(lt, sh.s, 27.3); return { x: lerp(a.x, f.x, k), y: lerp(a.y, f.y, k), z: lerp(a.z, f.z, k) }; }
  return { x: sh.x, y: sh.y, z: lerp(sh.z[0], sh.z[1], easeIO(u)) };
}
/* frame tests: a character is drawn sharp when wholly inside; with only a sliver of body in frame (its face well outside) it is drawn but not audited; a face across the edge is not drawn */
/* the face centre (Santa from his body circle: the kit's seated and hoyer poses place him by the floor or by his centre) */
const faceOf = o => { if (o.__b) { const k = KINDS[o.kind], s = o.s || 1; return [o.__b.x, o.__b.y + (k.eyeY + k.mouthY) / 2 * s]; } return faceC(o); };
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, half = (k.rx * 1.12 + pad) * s;
  if (o.__b) { const b = o.__b, bot = o.__pose === 'stand' ? k.ry * .8 + (k.leg || 90) + 22 : k.ry * 1.1; return [b.x - half, b.y - headTop(o, k) * s, b.x + half, b.y + bot * s]; }
  const legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + headTop(o, k)) * s;
  return [o.x - half, top, o.x + half, o.y + (o.noLegs ? k.ry * .1 * s : 24 * s)];
}
function faceBoxOf(o) { const k = KINDS[o.kind], s = o.s || 1, [fx, fy] = faceOf(o), hw = (k.eyeX + k.er * 1.45 + 12) * s; return [fx - hw, fy - (k.er * 2.4 + 20) * s, fx + hw, fy + (k.mouthY + 60) * s]; }
function scr(b) { const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f], q = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])]; return [Math.min(...q.map(a => a[0])), Math.min(...q.map(a => a[1])), Math.max(...q.map(a => a[0])), Math.max(...q.map(a => a[1]))]; }
function place(o) {
  const b = scr(boxOf(o, 6)), f = scr(faceBoxOf(o));
  if (b[2] <= 0 || b[0] >= W || b[3] <= 0 || b[1] >= H) return 'out';
  if (b[0] >= 8 && b[2] <= W - 8 && b[1] >= 8) return 'in';
  if (f[2] < -4 || f[0] > W + 4) return 'sliver';
  return 'cut';
}

// ------------------------------------------------------------------ the frame
let FR = null;
function cast(lt) {
  return { santa: santaOpts(lt), onion: lt < T_EXIT_ONION ? onionOpts(lt) : null, tom: tomOpts(lt), straw: lt >= 14.3 ? strawOpts(lt) : null, lemon: lt >= 20.6 ? lemonOpts(lt) : null, pear: resOpts('pear', lt), cran: resOpts('cran', lt) };
}
function camS(lt) {
  const sh = shotAt(lt), C = cast(lt), c = camOf(lt, sh, C);
  zoomTo(c.x, c.y, c.z);
  const still = (sh.k === 'open' && lt < .3) || (sh.k === 'end' && lt >= 27.3);
  if (!still) { CAM.x += 1.6 * hnoise(lt, 1.1, 1) / c.z; CAM.y += 1.2 * hnoise(lt, .9, 2) / c.z; CAM.r = .0008 * hnoise(lt, .7, 3); } else CAM.r = 0;
  if (sh.id === 'hoyer' && lt >= CUE.lift && lt < CUE.lift + .5) CAM.shake = 1.2 * (1 - sg(lt, CUE.lift, CUE.lift + .5));
  FR = { sh, C };
}
function knees(o, lt) {
  if (o.__kit || o.__pose !== 'seated') return;
  const b = o.__b, rk = (o.rot || 0) * 60;
  ctx.save(); ctx.lineJoin = 'round';
  for (const sd of [-1, 1]) {
    const kx = b.x + sd * 60 + rk, ky = b.y + 104, fx = b.x + sd * 74, fy = FY - 8;
    ctx.strokeStyle = INKC; ctx.lineWidth = 48; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy - 40); ctx.stroke();
    ctx.strokeStyle = '#b81f2c'; ctx.lineWidth = 42; ctx.stroke();
    ctx.fillStyle = '#fbf8f2'; rr(fx - 30, fy - 64, 60, 22, 10); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#16141a'; ctx.beginPath(); ctx.ellipse(fx + sd * 8, fy - 20, 36, 24, 0, PI, TAU); ctx.lineTo(fx + sd * 8 + 36, fy); ctx.lineTo(fx + sd * 8 - 36, fy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(fx + sd * 2, fy - 30, 12, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c81e2c'; ctx.beginPath(); ctx.ellipse(kx, ky, 46, 36, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,200,200,.22)'; ctx.beginPath(); ctx.ellipse(kx - 10, ky - 12, 18, 10, -.3, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
/* the belt in Onion's hands before she throws it (o2 and the step in) */
function beltInHands(lt, o) {
  if (!o || lt < 7.5 || lt >= 8.64 || !o.__gripL || !o.__gripR) return;
  const a = o.__gripL, b = o.__gripR, snap = ss(lt, 7.86, 7.94), sag = lerp(46, 4, snap) + (lt > 7.94 ? 5 * Math.sin((lt - 7.94) * 30) * Math.exp(-(lt - 7.94) * 8) : 0);
  const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + sag * 4 * u * (1 - u)]); }
  if (hasK(window.A22, 'gaitBelt')) { A22.gaitBelt(ctx, { mode: 'strap', a: [b[0] + 6, b[1]], b: [a[0] - 6, a[1]], sag, w: 22, t: lt }); return; }
  strap(pts, 18); buckle(b[0] + 8, b[1] + 2, .2, .9);
}
function drawS(lt) {
  const { sh, C } = FR, bulbs = [];
  V2.setLight({ key: [-.3, -.6], keyColor: '#ffe2b8', keyA: .24, rim: '#ffd7a8', rimA: .3, shadow: '#2a1820', shadowA: .3, bounce: '#ffb880', bounceA: .14, amb: '#fff0dc', ambA: .08, frontDark: .02 }); V2.opts.reflect = false;
  const bg = new Set(sh.bg || []);
  const room = () => { roomShell(lt); nightWindow(lt); stringLights(lt, bulbs); fireTV(lt); tree(lt, bulbs); };
  const bgCast = () => { REG.suppress++; for (const n of bg) { const o = C[n]; if (!o) continue; if (n === 'pear' || n === 'cran') drawResident(n, o, false); else drawChar(o); } REG.suppress--; };
  if (bg.size) { SOFT++; V2.dof(5, room); SOFT--; } else room();
  const H = lt >= 20.6 ? hoyerAt(lt) : null;
  if (H) hoyerDraw(H, lt, 'back');
  /* the pile, the paper and the gifts still on it */
  for (const g of PILEG) gift(g);
  paperStand(lt, 'back');
  for (let i = 0; i < 4; i++) if (lt < RIPS[i] - .26) gift(SG[i]);
  const moving = sh.k === 'open' && lt > .28 && lt < 1.46;
  const drawIf = (n, fn) => { const o = C[n]; if (!o || bg.has(n)) return; if (moving) o.transit = true; const p = place(o); o.__drawn = false; if (p === 'in' || (o.transit && p !== 'out')) { fn(o, true); o.__drawn = true; } else if (p === 'sliver') { fn(o, false); o.__drawn = true; } };
  const plain = (o, audited) => { if (!audited) REG.suppress++; drawChar(o); if (!audited) REG.suppress--; };
  drawIf('pear', (o, a) => drawResident('pear', o, a));
  drawIf('cran', (o, a) => drawResident('cran', o, a));
  if (lt >= 18.63 && lt < 18.63 + .4 && false) {}
  drawIf('tom', plain);
  /* Santa, the chair, the belt, the sling (the order depends on whether he is standing, sitting or lifted) */
  const so = C.santa, b = so.__b, seated = so.__pose === 'seated', lifted = so.__pose === 'hoyer', slingOn = lt >= 21.9, sim = !!simInit();
  chairBack(lt, seated || lifted ? 1 - ss(lt, CUE.lift + .3, CUE.lift + .9) : 0);
  if (!seated) chairFront(lt, 0);
  if (bg.size) { SOFT++; V2.dof(5, bgCast); SOFT--; }                              /* the neighbours out of focus, in front of the set */
  if (H) hoyerDraw(H, lt, 'bar');
  if (slingOn && sim) slingSim(lt, 'back', b);                                        /* the loops of the sling behind him */
  const santa = (o, a) => {
    plain(o, a);
    if (!(sim && beltSim(lt, b))) beltOn(lt, b, C.onion && C.onion.__gripL && lt < 9.62 ? C.onion.__gripL : null);
    if (slingOn && !sim) slingStand(lt, b, H);
    if (slingOn && sim) slingSim(lt, 'front', b);                                      /* the cradle round his bottom and its pouch, in front */
  };
  drawIf('santa', santa);
  if (seated) { chairFront(lt, 1); drawIf('santa', o => knees(o, lt)); }
  if (H) hoyerDraw(H, lt, 'near');
  drawIf('onion', (o, a) => { plain(o, a); beltInHands(lt, o); });
  /* Strawberry and what is in her hands */
  drawIf('straw', plain);
  for (let i = 0; i < 4; i++) {
    if (lt >= RIPS[i] - .26 && lt < RIPS[i]) gift(Object.assign({}, SG[i], giftAt(i, lt)));
    const it = itemAt(i, lt); if (it && !(i === 3 && (lt >= 17.8 || !(C.straw && C.straw.__drawn)))) drawItem(i, it, lt);
  }
  if (lt >= 17.8 && C.straw && C.straw.__drawn) dentureCup(CUPUP[0], CUPUP[1], 1.22, 0, 1, cupClack(lt), lt, false);
  drawIf('lemon', plain);
  paperStand(lt, 'front');
  /* light: the tree's glow, the TV's fire, the window, warm downlights; then the bulbs */
  const lights = [
    { kind: 'point', x: TREE.x, y: 820, r: 760, color: '#ffc27a', power: .9 },
    { kind: 'point', x: TREE.x - 30, y: 1080, r: 520, color: '#ffb46a', power: .55 },
    { kind: 'rect', x: (TV.x0 + TV.x1) / 2, y: (TV.y0 + TV.y1) / 2, w: TV.x1 - TV.x0, h: TV.y1 - TV.y0, color: '#ff9a48', power: .7, facing: PI / 2, spill: 520, flicker: { seed: 7, amt: .08, rate: .8 } },
    { kind: 'rect', x: (WIN.x0 + WIN.x1) / 2, y: (WIN.y0 + WIN.y1) / 2, w: WIN.x1 - WIN.x0, h: WIN.y1 - WIN.y0, color: '#8fb0ff', power: .45, facing: PI / 2, spill: 500 },
  ];
  for (const lx of [200, 700, 1200, 1700]) lights.push({ kind: 'cone', x: lx, y: CEIL + 6, ang: PI / 2, spread: 1.1, len: 1150, color: '#ffe6c0', power: .5 });
  if (hasK(window.L20, 'pass')) L20.pass(ctx, { ambient: .66, tint: '#2a1a2e', lights, bloom: .45, vignette: .22, lift: .12, t: lt, glow: .28 });
  if (!(window.TXA && TXA.mask)) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const m = ctx.getTransform();
    for (const L of bulbs) {
      const X = m.a * L.x + m.c * L.y + m.e, Y = m.b * L.x + m.d * L.y + m.f; if (X < -60 || X > W + 60 || Y < -60 || Y > H + 60) continue;
      const r = L.r || 34, [cr, cg, cb] = V2.rgb(L.color), a = .32 * L.a;
      ctx.fillStyle = rg(L.x, L.y, 0, r, [[0, `rgba(${cr},${cg},${cb},${a})`], [.4, `rgba(${cr},${cg},${cb},${a * .35})`], [1, `rgba(${cr},${cg},${cb},0)`]]); ctx.beginPath(); ctx.arc(L.x, L.y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  /* the ding: a glint on her new teeth */
  if (lt >= CUE.ding - .03 && lt < CUE.ding + .5 && C.cran) {
    const o = C.cran, k = KINDS.cran, [fx, fy] = faceC(o), gx = fx + 22 * o.s, gy = fy + (k.mouthY - (k.eyeY + k.mouthY) / 2 + 6) * o.s, a = Math.exp(-(lt - CUE.ding) * 5) * ss(lt, CUE.ding - .03, CUE.ding + .03), r = 26 * (1 + .3 * Math.sin((lt - CUE.ding) * 8));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,240,${.9 * a})`; ctx.beginPath(); ctx.moveTo(gx, gy - r); ctx.quadraticCurveTo(gx + r * .12, gy - r * .12, gx + r, gy); ctx.quadraticCurveTo(gx + r * .12, gy + r * .12, gx, gy + r); ctx.quadraticCurveTo(gx - r * .12, gy + r * .12, gx - r, gy); ctx.quadraticCurveTo(gx - r * .12, gy - r * .12, gx, gy - r); ctx.fill(); ctx.restore();
  }
}
const SCENE = {
  shot: lt => shotAt(lt).id,
  cam: camS,
  draw: drawS,
  fx: lt => ({ bloom: .4 + .25 * Math.max(0, 1 - Math.abs(lt - CUE.sting - .05) / .3), vignette: .24, grain: .04, contrast: .07, sat: .1, tint: [['#ffcf9a', .05, 'soft-light']] }),
  blur: lt => { const sh = shotAt(lt); if (lt - sh.s < .034) return 1; if (sh.k === 'open' && lt > .32 && lt < 1.4) return 3; if (sh.id === 'hoyer' && lt > CUE.roll && lt < 22.6) return 3; return 1; },
  over() {},
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP22_SCENES = window.__EP22_SCENES || {}; window.__EP22_SCENES.santa = SCENE;
})();
