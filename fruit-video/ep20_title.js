'use strict';
/* SHIFT HAPPENS, Episode 20: The Snow Day. Scene module WX cards: `title` (6.8 s) and `end` (7.5 s), registered on window.__EP20_SCENES. Prefix for anything new: fp20t_. Every string goes through the UI kit, live each frame (no
 * text in caches). The lettering recipe (bevelText) is copied from ep19_title.js / ep17_title.js; the cards themselves are new. The weather and the light are SN20 and L20 (ep20_fx.js), guarded at draw time.
 *
 * TITLE (noChyron, noScrim): a warm night desk. A big snow globe (about 680 px across) of the Fruit Salad building stands on a walnut pedestal with a brass plaque (FRUIT SALAD / NURSING AND REHAB) on a crocheted doily; a
 * gooseneck lamp at the left; a frosted window behind with real falling snow. Cues (scene-local s, python3 /tmp/shift_tools/cues.py 20 title, snapped to the nearest video frame): theme20 .2 | globeshake 1.1 | snowsettle 2.8 | textding 5.4.
 *   0.00-0.20  fade up from black. The window snow falls, the lamp breathes, dust drifts in its cone, the little building's windows glow.
 *   0.65-1.00  a red-mittened hand (Strawberry's) comes in from the right and takes hold of the pedestal.
 *   1.10       globeshake: the first jolt. The globe and pedestal shake and tilt (about 1.1 s), the snow inside whirls up in a vortex, and a swirl of snow bursts out in front of the globe.
 *   2.15-2.60  the hand lets go and leaves.   2.80 snowsettle: the whirl subsides, the swirl in front flies to the letters of SHIFT HAPPENS and lands (about 3.8 s); the snow inside settles.
 *   3.55-4.00  the solid title (frosty white, deep blue outline) takes over from the flakes.   4.20 EPISODE 20 / THE SNOW DAY slides in.
 *   5.40       textding: a glint travels across the title, the globe's windows blink once, three stars.   6.62-6.80 a dip to black.
 * END: see the second half of this file. */
(() => {
/* the title of the next episode, shown in the end card's teaser (the lead confirms it: change this one constant) */
const TEASER21 = 'THE INSPECTION';
if (!window.TIMELINE_EP20 || !window.UI || !window.H6) return;
const { zoomTo } = window.H6;
window.__EP20_SCENES = window.__EP20_SCENES || {};
const TLX = window.TIMELINE_EP20;
const PI = Math.PI, TAU = PI * 2;

// ------------------------------------------------------------------ small maths and helpers
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const ss = k => { k = cl(k); return k * k * (3 - 2 * k); };
const eIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eO = k => 1 - Math.pow(1 - k, 3);
const eI = k => k * k * k;
const back = (k, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mixh = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (s) => Math.round(lp((A >> s) & 255, (B >> s) & 255, k)); return `rgb(${f(16)},${f(8)},${f(0)})`; };
const ringK = (age, tau) => age < 0 ? 0 : Math.exp(-age / tau);
const vgrad = (cap, stops, y0 = -1.03, y1 = .04) => { const g = ctx.createLinearGradient(0, cap * y0, 0, cap * y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
const rrect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
const OUTL = 'rgba(20,14,30,.78)';
const outline = (lw = 3.5, col = OUTL) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); };
const FXn = () => (typeof FX18 !== 'undefined' && FX18) || null;
const SNn = () => (typeof SN20 !== 'undefined' && SN20) || null;
const Ln = () => (typeof L20 !== 'undefined' && L20) || null;
const A20n = () => (typeof A20 !== 'undefined' && A20) || null;
/* scene start (absolute seconds) and the snap of a cue time to the video frame nearest to it: a picture event lands on its own frame */
const startOf = id => (TLX.scenes.find(s => s.id === id) || { start: 0 }).start;
const snapOf = id => { const S0 = startOf(id); return t => Math.round((S0 + t) * 30) / 30 - S0; };
const mkcv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.__txOK = true; return c; };
/* measuring on a private canvas (ep15_title.js does the same): ink box and advance of a string; false when the font is not loaded yet (nothing is cached then) */
const mcv = mkcv(8, 8), mctx = mcv.getContext('2d'), MM = new Map();
function meas(str, size, font, weight, spacing) {
  const spec = `${weight} ${size}px ${font}`, key = spec + '|' + spacing + '|' + str, hit = MM.get(key);
  if (hit) return hit;
  mctx.font = spec; mctx.letterSpacing = spacing ? spacing + 'px' : '0px'; mctx.textAlign = 'left'; mctx.textBaseline = 'alphabetic';
  const m = mctx.measureText(str), r = { l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, adv: m.width };
  let ok = true; try { ok = document.fonts.check(spec); } catch (e) { /* no font api */ }
  if (ok) { if (MM.size > 3000) MM.clear(); MM.set(key, r); }
  return r;
}
const fontReady = f => { try { return document.fonts.check('400 100px ' + f); } catch (e) { return true; } };
/* Bangers lettering with a body (ep19_title.js / ep17_title.js): soft drop shadow, a slab of extrusion, dark outline, rim, bright gradient face, gloss, sweeping shine. Only the face is the string the viewer reads
 * (hero when `hero`); every other layer is a decorative copy (hero:false, crop:true, one group). `ink` is the outline colour (default a deep blue). */
const FACE_ICE = [[0, '#ffffff'], [.34, '#f4fbff'], [.5, '#d3ebfb'], [.52, '#a8d2f3'], [1, '#e6f5ff']];
function bevelText(str, cx, cy, size, o = {}) {
  const font = o.font || 'Bangers', sp = o.spacing ?? size * .018, cap = UI.metrics(font).cap * size, alpha = o.alpha ?? 1, ex = o.extr ?? 1, lw = size * (o.lwK ?? .125), reveal = o.reveal ?? 1, ink = o.ink || '#0a1f4d';
  if (alpha <= .004 || reveal <= 0 || size < 2) return null;
  const common = { font, size, spacing: sp, grp: o.grp || 'bv:' + str, tilt: .3, reveal, hero: false, crop: true };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv, alpha }, extra));
  const ext = o.ext || ['#2f6fb5', '#0b2652'];
  if (o.shadow !== false) L(size * .03, size * .15 * ex + size * .03, 'rgba(2,6,30,.5)', 'rgba(2,6,30,.5)', lw * 1.45, { shadow: size * .14 });
  const n = Math.round(ex * size * .07);
  for (let i = n; i >= 1; i--) { const c = mixh(ext[0], ext[1], 1 - i / n * .6); L(i * .28, i, c, c, lw); }
  L(0, 0, ink, ink, lw);
  L(0, 0, o.rim || '#5aa6e8', o.rim || '#5aa6e8', lw * .55);
  const box = UI.label(str, cx, cy, Object.assign({}, common, { fill: vgrad(cap, o.face || FACE_ICE), lw: 0, alpha, hero: !!o.hero, crop: !o.hero }));
  L(0, 0, vgrad(cap, [[0, 'rgba(255,255,255,.5)'], [.4, 'rgba(255,255,255,.08)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), undefined, 0, {});
  if (o.shine != null && o.shine > -.3 && o.shine < 1.3) {
    const m = meas(str, size, font, 400, sp), x = lp(m.l - cap * .6, m.r + cap * .6, o.shine), g = ctx.createLinearGradient(x - cap * .5, -cap, x + cap * .5, 0);
    for (const [s, a] of [[0, 0], [.36, 0], [.5, o.shineA ?? .95], [.64, 0], [1, 0]]) g.addColorStop(s, `rgba(255,255,255,${a})`);
    L(0, 0, g, undefined, 0, {});
  }
  return box;
}
/* a four-point star (additive): a glint on the lettering */
function star(x, y, r, a, rot = 0) {
  if (a <= .01 || r <= .5) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(235,248,255,1)'; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const ang = i * PI / 4, rr2 = i % 2 ? r * .2 : r; ctx.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2); }
  ctx.closePath(); ctx.fill();
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .9); g.addColorStop(0, 'rgba(210,236,255,.8)'); g.addColorStop(1, 'rgba(210,236,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, TAU); ctx.fill();
  ctx.restore();
}
/* a soft glow: FX18.glow when it is there, else the engine's own */
function glowAt(x, y, r, color, a, core) {
  const F = FXn();
  if (F && typeof F.glow === 'function') F.glow(ctx, { x, y, r, color, alpha: a, core: core || 0 });
  else if (window.V2) { const n = parseInt(color.slice(1), 16); V2.glow(x, y, r, `${n >> 16},${(n >> 8) & 255},${n & 255}`, Math.min(1, a), 'screen', .3); }
}

// ====================================================================================================================================================================
// TITLE
// ====================================================================================================================================================================
const SN = snapOf('title');
const CUE = { shake: SN(1.1), settle: SN(2.8), ding: SN(5.4) };
const GL = { x: 540, y: 1180, r: 340 };                                           /* the globe */
const BS = { top: 1478, bot: 1700, hwTop: 236, hwBot: 304 };                      /* the pedestal: y range and half widths at the top and the bottom */
const PIV = { x: 540, y: 1700 };                                                  /* the pedestal's foot: the globe and its stand tilt about it */
const WP = { x: 110, y: 120, w: 860, h: 650 };                                    /* the window pane (inside its frame) */
const LAMPH = { x: 196, y: 928 };                                                 /* the lamp's head */
const TY = { shift: 256, happens: 436, pill: 574, snow: 682, size: 190 };
const T_LAND = 3.8;

/* the static art (wall, window frame, desk, doily, the lamp's stand, the mug) is painted once into a cached canvas; no text in it */
let STATIC = null;
function staticArt() {
  if (STATIC) return STATIC;
  const cv = mkcv(1080, 1920), g = cv.getContext('2d');
  /* the wall: a deep teal-blue wallpaper with a quiet stripe and a diamond, a darker wainscot below */
  let gr = g.createLinearGradient(0, 0, 0, 1400); gr.addColorStop(0, '#34588a'); gr.addColorStop(.6, '#2f5282'); gr.addColorStop(1, '#294772'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
  g.fillStyle = 'rgba(255,255,255,.045)'; for (let x = 0; x < 1080; x += 72) g.fillRect(x, 0, 30, 1400);
  g.fillStyle = 'rgba(255,255,255,.06)'; for (let r = 0; r < 20; r++) for (let c = 0; c < 16; c++) { const x = c * 72 + 51 + (r % 2 ? 36 : 0), y = 20 + r * 70; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 7, y); g.lineTo(x, y + 9); g.lineTo(x - 7, y); g.closePath(); g.fill(); }
  gr = g.createLinearGradient(0, 1250, 0, 1400); gr.addColorStop(0, '#3a2a22'); gr.addColorStop(1, '#2a1d17'); g.fillStyle = gr; g.fillRect(0, 1290, 1080, 130);
  g.fillStyle = 'rgba(255,214,150,.18)'; g.fillRect(0, 1290, 1080, 5); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 1296, 1080, 8);
  for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; g.strokeRect(24 + i * 180, 1316, 160, 84); g.strokeStyle = 'rgba(255,214,150,.1)'; g.strokeRect(28 + i * 180, 1320, 152, 76); }
  /* the window frame: a white-painted wood frame with a deep sill, a sky-blue placeholder pane (the pane is repainted live) */
  const fx = WP.x - 34, fy = WP.y - 34, fw = WP.w + 68, fh = WP.h + 68;
  g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 26; g.shadowOffsetY = 10; g.fillStyle = '#e8dfc8'; g.beginPath(); g.roundRect(fx, fy, fw, fh, 14); g.fill(); g.restore();
  g.lineWidth = 4; g.strokeStyle = OUTL; g.beginPath(); g.roundRect(fx, fy, fw, fh, 14); g.stroke();
  g.fillStyle = '#f5eedb'; g.beginPath(); g.roundRect(fx - 26, fy + fh - 6, fw + 52, 36, 8); g.fill(); g.stroke();
  g.fillStyle = '#1c3466'; g.fillRect(WP.x, WP.y, WP.w, WP.h);
  /* the desk: warm planks in perspective, a lit front edge */
  gr = g.createLinearGradient(0, 1390, 0, 1920); gr.addColorStop(0, '#9a6232'); gr.addColorStop(.4, '#b87b42'); gr.addColorStop(1, '#8a5428'); g.fillStyle = gr; g.fillRect(0, 1390, 1080, 530);
  for (let i = -2; i < 14; i++) { const xb = 540 + (i - 6) * 96, xf = 540 + (xb - 540) * 1.5; g.strokeStyle = 'rgba(40,20,6,.32)'; g.lineWidth = 3; g.beginPath(); g.moveTo(xb, 1390); g.lineTo(xf, 1920); g.stroke(); }
  for (let i = 0; i < 40; i++) { const a = rnd(i * 2.3) * 1200 - 60, y = lp(1396, 1900, rnd(i * 5.1 + 1)); g.strokeStyle = `rgba(255,226,170,${.05 + .06 * rnd(i)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(a, y); g.lineTo(a + 160 + 140 * rnd(i * 3.3), y + 3); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 1390, 1080, 14); g.fillStyle = 'rgba(255,230,180,.22)'; g.fillRect(0, 1404, 1080, 3);
  /* the crocheted doily: a cream disc with a scalloped edge, rings of eyelets and a darker stitch line */
  const DX = 540, DY = 1736, DRX = 452, DRY = 104;
  g.save(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(DX + 8, DY + 16, DRX + 6, DRY + 4, 0, 0, TAU); g.fill(); g.restore();
  g.fillStyle = '#f4ebd6'; g.beginPath(); for (let i = 0; i < 44; i++) { const a0 = i / 44 * TAU, a1 = (i + 1) / 44 * TAU, am = (a0 + a1) / 2, k = 1.045; g.arc(DX + Math.cos(am) * DRX * .985, DY + Math.sin(am) * DRY * .985, Math.hypot(Math.cos(a1) * DRX - Math.cos(a0) * DRX, Math.sin(a1) * DRY - Math.sin(a0) * DRY) * .56 * k, 0, TAU); } g.fill();
  g.beginPath(); g.ellipse(DX, DY, DRX * .975, DRY * .975, 0, 0, TAU); g.fill();
  for (const [k, n, r] of [[.9, 36, 7], [.74, 28, 6], [.58, 22, 5]]) for (let i = 0; i < n; i++) { const a = i / n * TAU + k; g.fillStyle = 'rgba(150,120,80,.32)'; g.beginPath(); g.ellipse(DX + Math.cos(a) * DRX * k, DY + Math.sin(a) * DRY * k, r, r * .5, 0, 0, TAU); g.fill(); }
  for (const k of [.96, .82, .66]) { g.strokeStyle = 'rgba(160,130,90,.34)'; g.lineWidth = 2.4; g.beginPath(); g.ellipse(DX, DY, DRX * k, DRY * k, 0, 0, TAU); g.stroke(); }
  /* the gooseneck lamp's stand: a round base and a bent neck up to the head (the head and its light are live) */
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(104, 1548, 88, 22, 0, 0, TAU); g.fill();
  g.fillStyle = '#3a342c'; g.beginPath(); g.ellipse(100, 1530, 72, 20, 0, 0, TAU); g.fill(); g.fillStyle = '#5a5246'; g.beginPath(); g.ellipse(100, 1522, 72, 18, 0, 0, TAU); g.fill(); g.lineWidth = 3; g.strokeStyle = OUTL; g.stroke();
  g.lineCap = 'round'; g.strokeStyle = '#2a251f'; g.lineWidth = 17; g.beginPath(); g.moveTo(100, 1516); g.bezierCurveTo(90, 1300, 70, 1100, LAMPH.x - 60, LAMPH.y + 70); g.stroke();
  g.strokeStyle = '#6a6254'; g.lineWidth = 11; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 3; g.beginPath(); g.moveTo(96, 1516); g.bezierCurveTo(86, 1300, 66, 1100, LAMPH.x - 66, LAMPH.y + 70); g.stroke();
  /* a mug of cocoa at the left of the doily */
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(176, 1744, 62, 15, 0, 0, TAU); g.fill();
  g.fillStyle = '#f4efe4'; g.beginPath(); g.roundRect(120, 1650, 110, 92, [8, 8, 24, 24]); g.fill(); g.lineWidth = 3.4; g.strokeStyle = OUTL; g.stroke();
  g.lineWidth = 12; g.strokeStyle = '#f4efe4'; g.beginPath(); g.arc(238, 1695, 24, -1.2, 1.2); g.stroke(); g.lineWidth = 3.4; g.strokeStyle = OUTL; g.beginPath(); g.arc(238, 1695, 30, -1.2, 1.2); g.stroke(); g.beginPath(); g.arc(238, 1695, 18, -1.2, 1.2); g.stroke();
  g.fillStyle = '#6a3a22'; g.beginPath(); g.ellipse(175, 1654, 48, 9, 0, 0, TAU); g.fill();
  g.fillStyle = '#d93025'; g.beginPath(); g.roundRect(134, 1690, 82, 18, 4); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(148 + i * 16, 1699, 3.4, 0, TAU); g.fill(); }
  return STATIC = cv;
}

// ------------------------------------------------------------------ the window, the lamp
/* the pane: a night sky that is lighter toward the snow-glow at the bottom, far roofs with warm windows, real falling snow (SN20.snow), snow piled on the outer sill, frost growing in from the edges, the muntins */
function windowPane(lt) {
  const P = WP, S = SNn();
  ctx.save(); ctx.beginPath(); ctx.rect(P.x, P.y, P.w, P.h); ctx.clip();
  const g = ctx.createLinearGradient(0, P.y, 0, P.y + P.h); g.addColorStop(0, '#1d3d7c'); g.addColorStop(.5, '#2f5a9a'); g.addColorStop(.86, '#6f9bd2'); g.addColorStop(1, '#a4c6ea');
  ctx.fillStyle = g; ctx.fillRect(P.x, P.y, P.w, P.h);
  for (let i = 0; i < 26; i++) { const sx = P.x + 20 + rnd(i * 3.1) * (P.w - 40), sy = P.y + 16 + rnd(i * 5.7) * P.h * .4, tw = .5 + .5 * Math.sin(lt * (.9 + rnd(i * 9.1)) + i); ctx.fillStyle = `rgba(255,248,226,${.45 * tw})`; ctx.beginPath(); ctx.arc(sx, sy, 1.2 + 1.2 * rnd(i * 1.7), 0, TAU); ctx.fill(); }
  const hy = P.y + P.h;                                                                          /* far roofs */
  for (let i = 0; i < 9; i++) {
    const hx = P.x + 10 + i * 100 + 18 * rnd(i * 4.3), hw = 62 + 26 * rnd(i * 2.9), hh = 40 + 30 * rnd(i * 7.7), by = hy - 70 - 26 * rnd(i * 1.3);
    ctx.fillStyle = '#1c3466'; ctx.fillRect(hx, by - hh, hw, hh + 80); ctx.beginPath(); ctx.moveTo(hx - 8, by - hh); ctx.lineTo(hx + hw / 2, by - hh - 34); ctx.lineTo(hx + hw + 8, by - hh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eef5ff'; ctx.beginPath(); ctx.moveTo(hx - 8, by - hh); ctx.lineTo(hx + hw / 2, by - hh - 34); ctx.lineTo(hx + hw + 8, by - hh); ctx.lineTo(hx + hw + 2, by - hh + 3); ctx.lineTo(hx + hw / 2, by - hh - 27); ctx.lineTo(hx - 2, by - hh + 3); ctx.closePath(); ctx.fill();
    if (rnd(i * 6.1) > .3) { ctx.fillStyle = 'rgba(255,208,120,.9)'; ctx.fillRect(hx + hw * .22, by - hh * .6, 11, 14); ctx.fillRect(hx + hw * .6, by - hh * .3, 11, 14); }
  }
  const lx = P.x + P.w * .78, ly = hy - 150;                                                       /* a street lamp: a warm glow in the snow */
  glowAt(lx, ly, 150, '#ffd38a', .55, .5); ctx.fillStyle = '#10244a'; ctx.fillRect(lx - 3, ly, 6, 150);
  if (S) S.snow(ctx, { x0: P.x, y0: P.y, x1: P.x + P.w, y1: P.y + P.h, t: lt, seed: 21, layers: 3, density: 3.4, wind: 60, gusts: [[1.1, 1.6, .5], [4.6, 1.8, -.4]], tone: 'dark', size: 1.2 });
  if (S) S.bank(ctx, { x: P.x + P.w * .5, y: hy + 6, w: P.w * 1.05, h: 54, seed: 6, shade: .3, tone: 'dark', t: lt });
  if (S) S.frost(ctx, { x: P.x, y: P.y, w: P.w, h: P.h, amount: .36, seed: 3, t: lt, tone: 'dark' });
  ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.beginPath(); ctx.moveTo(P.x + 60, P.y); ctx.lineTo(P.x + 210, P.y); ctx.lineTo(P.x + 20, P.y + P.h); ctx.lineTo(P.x - 40, P.y + P.h); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.rect(P.x, P.y, P.w, P.h); outline(4);
}
/* the lamp's head: a link from the neck, an enamel shade turned toward the globe, the hot bulb. Returns the bulb's position. */
const LAMP_ANG = .62;
function lampHead(lt) {
  const f = 1 + .02 * Math.sin(lt * 7.3) + .015 * Math.sin(lt * 13.1), ca = Math.cos(LAMP_ANG), sa = Math.sin(LAMP_ANG), bx = LAMPH.x + ca * 46, by = LAMPH.y + sa * 46;
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#2a251f'; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(LAMPH.x - 60, LAMPH.y + 70); ctx.lineTo(LAMPH.x - 8, LAMPH.y + 6); ctx.stroke();
  ctx.translate(LAMPH.x, LAMPH.y); ctx.rotate(LAMP_ANG);
  ctx.beginPath(); ctx.moveTo(-56, -22); ctx.lineTo(48, -62); ctx.quadraticCurveTo(62, 0, 48, 62); ctx.lineTo(-56, 22); ctx.quadraticCurveTo(-66, 0, -56, -22); ctx.closePath();
  const g = ctx.createLinearGradient(0, -62, 0, 62); g.addColorStop(0, '#5f8a82'); g.addColorStop(.45, '#3e625c'); g.addColorStop(1, '#233f3a'); ctx.fillStyle = g; ctx.fill(); outline(4);
  ctx.beginPath(); ctx.ellipse(48, 0, 15, 62, 0, 0, TAU); ctx.fillStyle = '#fff1c8'; ctx.fill(); outline(3);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-4, -30, 34, 7, .24, 0, TAU); ctx.fill();
  ctx.restore();
  return { x: bx, y: by, f };
}

// ------------------------------------------------------------------ the globe: the sphere, what is in it, the snow in it
/* the vortex: a(t) is how stirred the water is (up in .25 s at the shake, held, then settling with a time constant of .62 s) and W(t) its integral: the angle the flakes have been carried through */
const A_U0 = CUE.shake - .02, A_U1 = A_U0 + .25, A_HOLD = 2.3, A_TAU = .62;
const agit = t => t < A_U0 ? 0 : t < A_U1 ? ss((t - A_U0) / (A_U1 - A_U0)) : t < A_HOLD ? 1 : Math.exp(-(t - A_HOLD) / A_TAU);
const wacc = t => {
  if (t <= A_U0) return 0;
  const x = Math.min(1, (t - A_U0) / (A_U1 - A_U0)); let w = (A_U1 - A_U0) * (x * x * x - x * x * x * x / 2);
  if (t > A_U1) w += Math.min(t, A_HOLD) - A_U1;
  if (t > A_HOLD) w += A_TAU * (1 - Math.exp(-(t - A_HOLD) / A_TAU));
  return w;
};
const NFLK = 360, FLK = [];
for (let i = 0; i < NFLK; i++) FLK.push({ rho: GL.r * .9 * Math.sqrt(rnd(i * 1.7 + 1)), th: rnd(i * 2.3 + 2) * TAU, om: .7 + .9 * rnd(i * 3.9 + 3), d: rnd(i * 5.1 + 4), u: rnd(i * 7.3 + 5), sz: 1.5 + 2.4 * rnd(i * 9.7 + 6), a: .55 + .4 * rnd(i * 11.1 + 7), float: rnd(i * 13.3 + 8) < .13, ph: rnd(i * 15.7 + 9) * TAU });
const GROUND_Y = GL.y + 150;
/* the snow floor's height above the sphere's bottom at x (a soft mound), used for the resting flakes and the floor itself */
const floorTop = x => GROUND_Y - 14 + 12 * Math.sin((x - GL.x) / 62) + 8 * Math.cos((x - GL.x) / 27) - Math.pow(Math.abs(x - GL.x) / GL.r, 3) * 40;
function globeScene(lt, blink) {
  const gx = GL.x, gy = GL.y, R = GL.r, by = GROUND_Y, bx = gx + 8, F = FXn();
  let g = ctx.createLinearGradient(0, gy - R, 0, gy + R); g.addColorStop(0, '#2c4f94'); g.addColorStop(.4, '#5d8dd0'); g.addColorStop(.72, '#bcd8f4'); g.addColorStop(1, '#ecf5ff');
  ctx.fillStyle = g; ctx.fillRect(gx - R, gy - R, 2 * R, 2 * R);
  for (let i = 0; i < 14; i++) { const sx = gx - 260 + rnd(i * 3.7) * 520, sy = gy - R + 50 + rnd(i * 5.3) * 230, tw = .5 + .5 * Math.sin(lt * (1 + rnd(i * 9.1)) + i); ctx.fillStyle = `rgba(255,250,230,${.7 * tw})`; ctx.beginPath(); ctx.arc(sx, sy, 1.6 + rnd(i * 2.1), 0, TAU); ctx.fill(); }
  const mx = gx + 168, my = gy - 190;                                                                /* the Moon, small and pale, in the globe's sky */
  glowAt(mx, my, 90, '#fff2c0', .55, .3); ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(mx, my, 27, 0, TAU); ctx.fill(); ctx.fillStyle = '#4d78bc'; ctx.beginPath(); ctx.arc(mx + 12, my - 6, 25, 0, TAU); ctx.fill();
  for (const [c0, c1, hh, col] of [['#dfeafb', '#f4f9ff', 70, 0], ['#c9dcf4', '#e4effc', 46, 1]]) {                       /* two snowy hills */
    ctx.fillStyle = ctx.createLinearGradient(0, by - hh - 40, 0, by); ctx.fillStyle.addColorStop(0, c1); ctx.fillStyle.addColorStop(1, c0);
    ctx.beginPath(); ctx.moveTo(gx - R, by + 20); for (let x = -R; x <= R; x += 20) ctx.lineTo(gx + x, by - 40 - hh * (.5 + .5 * Math.sin(x / (col ? 95 : 140) + col * 2.4)) * (.6 + .4 * Math.cos(x / 230)));
    ctx.lineTo(gx + R, by + 20); ctx.closePath(); ctx.fill();
  }
  /* the pine, the car and the building, drawn a little larger about the building's foot so the lit windows read on a phone */
  ctx.save(); ctx.translate(bx, by); ctx.scale(1.18, 1.18); ctx.translate(-bx, -by);
  const tx = gx - 178;
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(tx - 6, by - 30, 12, 32);
  for (const [w, y0, h] of [[78, by - 48, 46], [60, by - 84, 42], [42, by - 116, 38]]) {
    ctx.fillStyle = '#2f6b4f'; ctx.beginPath(); ctx.moveTo(tx - w / 2, y0); ctx.lineTo(tx, y0 - h); ctx.lineTo(tx + w / 2, y0); ctx.closePath(); ctx.fill(); outline(2.4);
    ctx.fillStyle = '#f2f8ff'; ctx.beginPath(); ctx.moveTo(tx - w / 2 + 2, y0 - 1); ctx.lineTo(tx, y0 - h); ctx.lineTo(tx + w / 2 - 2, y0 - 1); ctx.quadraticCurveTo(tx + w * .2, y0 - h * .55, tx, y0 - h * .62); ctx.quadraticCurveTo(tx - w * .2, y0 - h * .55, tx - w / 2 + 2, y0 - 1); ctx.closePath(); ctx.fill();
  }
  const cx2 = gx + 156;
  ctx.fillStyle = '#d94a3a'; ctx.beginPath(); ctx.roundRect(cx2 - 38, by - 28, 76, 24, 8); ctx.fill(); outline(2.6); ctx.beginPath(); ctx.roundRect(cx2 - 22, by - 46, 44, 22, [10, 10, 2, 2]); ctx.fillStyle = '#c23b2d'; ctx.fill(); outline(2.6);
  ctx.fillStyle = '#bfe3f7'; ctx.fillRect(cx2 - 17, by - 42, 15, 14); ctx.fillRect(cx2 + 2, by - 42, 15, 14);
  for (const wx of [-24, 24]) { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx2 + wx, by - 4, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#9aa'; ctx.beginPath(); ctx.arc(cx2 + wx, by - 4, 3.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#f6faff'; ctx.beginPath(); ctx.ellipse(cx2, by - 46, 24, 6, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx2 + 4, by - 28, 36, 5, 0, Math.PI, 0); ctx.fill();
  /* Fruit Salad: three floors, a gabled roof under snow, a chimney, lit windows, an awning over the door, a sign */
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(bx + 12, by + 2, 140, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#efcfa5'; ctx.fillRect(bx - 115, by - 152, 230, 152); ctx.fillStyle = 'rgba(120,70,30,.16)'; ctx.fillRect(bx + 60, by - 152, 55, 152);
  ctx.strokeStyle = 'rgba(150,100,60,.35)'; ctx.lineWidth = 1.6; for (let y = by - 140; y < by; y += 14) { ctx.beginPath(); ctx.moveTo(bx - 115, y); ctx.lineTo(bx + 115, y); ctx.stroke(); }
  ctx.lineWidth = 3.4; ctx.strokeStyle = OUTL; ctx.strokeRect(bx - 115, by - 152, 230, 152);
  ctx.fillStyle = '#7a4d3c'; ctx.beginPath(); ctx.moveTo(bx - 132, by - 148); ctx.lineTo(bx, by - 212); ctx.lineTo(bx + 132, by - 148); ctx.closePath(); ctx.fill(); outline(3.4);
  ctx.fillStyle = '#5f3a2e'; ctx.fillRect(bx + 54, by - 206, 24, 46); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.strokeRect(bx + 54, by - 206, 24, 46);
  ctx.strokeStyle = '#f4f8ff'; ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 126, by - 153); ctx.lineTo(bx - 2, by - 209); ctx.lineTo(bx + 126, by - 153); ctx.stroke();
  ctx.strokeStyle = 'rgba(95,130,190,.5)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bx - 130, by - 146); ctx.lineTo(bx - 2, by - 204); ctx.lineTo(bx + 130, by - 146); ctx.stroke();
  ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.ellipse(bx + 66, by - 207, 18, 8, 0, Math.PI, 0); ctx.fill();
  if (F) F.smoke(ctx, { x: bx + 66, y: by - 212, w: 13, h: 120, t: lt, t0: -3, seed: 8, density: .45, drift: 36, color: '#dfe6ee', rate: 5, life: 3 });
  const wcol = blink > .05 ? mixh('#ffd36b', '#fffbe0', cl(blink)) : '#ffd36b';
  for (const [wx, wy] of [[-72, -134], [0, -134], [72, -134], [-72, -62], [72, -62]]) {
    const x = bx + wx - 17, y = by + wy;
    glowAt(x + 17, y + 20, 56 + 40 * blink, '#ffc860', .5 + .5 * blink, .2);
    ctx.fillStyle = wcol; ctx.fillRect(x, y, 34, 42); ctx.strokeStyle = 'rgba(80,46,20,.9)'; ctx.lineWidth = 2.6; ctx.strokeRect(x, y, 34, 42); ctx.beginPath(); ctx.moveTo(x + 17, y); ctx.lineTo(x + 17, y + 42); ctx.moveTo(x, y + 21); ctx.lineTo(x + 34, y + 21); ctx.stroke();
    ctx.fillStyle = '#f4f8ff'; ctx.fillRect(x - 3, y + 42, 40, 5);
  }
  ctx.fillStyle = '#5a3224'; ctx.beginPath(); ctx.moveTo(bx - 20, by); ctx.lineTo(bx - 20, by - 44); ctx.quadraticCurveTo(bx, by - 66, bx + 20, by - 44); ctx.lineTo(bx + 20, by); ctx.closePath(); ctx.fill(); outline(2.8);
  ctx.fillStyle = '#d93025'; ctx.beginPath(); ctx.moveTo(bx - 30, by - 56); ctx.lineTo(bx + 30, by - 56); ctx.lineTo(bx + 36, by - 40); ctx.lineTo(bx - 36, by - 40); ctx.closePath(); ctx.fill(); outline(2.6);
  ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) ctx.fillRect(bx - 28 + i * 12, by - 55, 6, 15);
  ctx.fillStyle = '#4f7a3a'; ctx.beginPath(); ctx.roundRect(bx - 58, by - 100, 116, 22, 4); ctx.fill(); outline(2.6);
  UI.label('FRUIT SALAD', bx, by - 89, { font: 'Nunito', weight: 900, size: 17, spacing: 2, fill: '#fff6d6', hero: false, crop: true, maxW: 104 });
  ctx.restore();
  /* the snow floor, in front of everything */
  g = ctx.createLinearGradient(0, by - 30, 0, gy + R); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#e6f0fc'); g.addColorStop(1, '#b8cdec'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(gx - R - 4, gy + R + 4); for (let x = -R - 4; x <= R + 4; x += 12) ctx.lineTo(gx + x, floorTop(gx + x)); ctx.lineTo(gx + R + 4, gy + R + 4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(95,130,190,.45)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = -R; x <= R; x += 12) { const px = gx + x; x === -R ? ctx.moveTo(px, floorTop(px)) : ctx.lineTo(px, floorTop(px)); } ctx.stroke();
}
/* the flakes in the water: at rest on the floor, lifted into a vortex by the shake and carried round it (inner ones faster), then settling again; a few always hang in the water */
function globeFlakes(lt) {
  const a = agit(lt), w = wacc(lt), gx = GL.x, gy = GL.y - 30;
  ctx.save(); ctx.fillStyle = '#ffffff';
  for (let i = 0; i < NFLK; i++) {
    const f = FLK[i], th = f.th + f.om * (1 + (1 - f.rho / GL.r) * .8) * 4.2 * w + (f.float ? .05 * lt : 0), sx = gx + f.rho * Math.cos(th), sy = gy + f.rho * .82 * Math.sin(th) + 12 * Math.sin(lt * 2.1 + f.ph);
    const rx = gx + (f.u - .5) * 2 * GL.r * .84, ry = floorTop(rx) - 2 * f.d;
    const l = f.float ? Math.max(.88, ss((a - f.d * .55) / .45)) : ss((a - f.d * .55) / .45);
    const x = lp(rx, sx, l), y = lp(ry, sy, l);
    if (Math.hypot(x - GL.x, y - GL.y) > GL.r - 6) continue;
    ctx.globalAlpha = f.a * (l < .03 ? .35 : 1); ctx.beginPath(); ctx.arc(x, y, f.sz, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
/* the glass: a dark rim, a big curved highlight, the lamp's warm reflection, the window's reflection (muntins and all), a warm glow where the desk lights the bottom */
function globeGlass(lt) {
  const gx = GL.x, gy = GL.y, R = GL.r;
  let g = ctx.createRadialGradient(gx, gy, R * .7, gx, gy, R); g.addColorStop(0, 'rgba(10,30,70,0)'); g.addColorStop(.8, 'rgba(10,30,70,.1)'); g.addColorStop(1, 'rgba(10,30,70,.42)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, R, 0, TAU); ctx.fill();
  g = ctx.createRadialGradient(gx + R * .1, gy + R * 1.05, 10, gx + R * .1, gy + R * 1.05, R * .8); g.addColorStop(0, 'rgba(255,200,120,.34)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, R, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, R - 3, 0, TAU); ctx.clip();
  ctx.lineCap = 'round'; ctx.lineWidth = 30; g = ctx.createLinearGradient(gx - R, gy - R, gx - R * .2, gy - R * .3); g.addColorStop(0, 'rgba(255,255,255,.62)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.strokeStyle = g;
  ctx.beginPath(); ctx.arc(gx, gy, R * .87, PI * 1.08, PI * 1.42); ctx.stroke();
  ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(gx, gy, R * .87, PI * 1.45, PI * 1.5); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(gx - R * .56, gy - R * .6, 15, 24, -.7, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,224,170,.34)'; ctx.beginPath(); ctx.ellipse(gx - R * .82, gy - R * .12, 12, 70, .12, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(gx + R * .42, gy - R * .5); ctx.rotate(.3); ctx.globalAlpha = .22; ctx.fillStyle = '#cfe6ff'; ctx.beginPath(); ctx.roundRect(-78, -52, 156, 104, 6); ctx.fill(); ctx.globalAlpha = .3; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  ctx.restore();
  ctx.beginPath(); ctx.arc(gx, gy, R, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(190,220,255,.65)'; ctx.stroke();
}
// ------------------------------------------------------------------ the pedestal, the plaque, the mitten
function pedestal() {
  const cx = 540, hwT = BS.hwTop, hwB = BS.hwBot, yT = BS.top, yB = BS.bot;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(cx + 10, yB + 10, hwB + 30, 34, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(cx - hwT, yT); ctx.lineTo(cx + hwT, yT); ctx.lineTo(cx + hwB, yB - 8); ctx.quadraticCurveTo(cx + hwB, yB, cx + hwB - 12, yB); ctx.lineTo(cx - hwB + 12, yB); ctx.quadraticCurveTo(cx - hwB, yB, cx - hwB, yB - 8); ctx.closePath();
  const g = ctx.createLinearGradient(cx - hwB, 0, cx + hwB, 0); g.addColorStop(0, '#4a2a16'); g.addColorStop(.18, '#84502a'); g.addColorStop(.5, '#6a3f20'); g.addColorStop(1, '#341c0d'); ctx.fillStyle = g; ctx.fill(); outline(4);
  ctx.fillStyle = 'rgba(255,214,150,.16)'; ctx.beginPath(); ctx.moveTo(cx - hwT + 24, yT + 10); ctx.lineTo(cx - hwT + 54, yT + 10); ctx.lineTo(cx - hwB + 66, yB - 14); ctx.lineTo(cx - hwB + 28, yB - 14); ctx.closePath(); ctx.fill();
  for (const [yy, k] of [[yT, 0], [yB - 12, 1]]) {                                                  /* brass bands */
    const hw = k ? hwB + 4 : hwT + 14;
    ctx.beginPath(); ctx.roundRect(cx - hw, yy - (k ? 0 : 8), hw * 2, k ? 14 : 22, 8); const gg = ctx.createLinearGradient(0, yy - 8, 0, yy + 14); gg.addColorStop(0, '#f6dc86'); gg.addColorStop(.5, '#d6a840'); gg.addColorStop(1, '#8a6a1c'); ctx.fillStyle = gg; ctx.fill(); outline(3);
  }
}
/* the plaque: drawn AFTER the light pass (text drawn before L20.pass is darkened, and the text gate then reports it covered) */
function plaque() {
  const pg = [540 - 214, 1546, 428, 112];                                                            /* the plaque */
  UI.sign(pg, [{ t: 'FRUIT SALAD', size: 38 }, { t: 'NURSING AND REHAB', size: 31, gap: 6 }], { fill: ['#f0d27a', '#c99a34'], stroke: '#6a4a14', lw: 4, r: 10, ink: '#3a2606', font: 'Nunito', weight: 900, spacing: 2, pad: 14, id: 'fp20t.plaque' });
  for (const sx of [pg[0] + 14, pg[0] + pg[2] - 14]) for (const sy of [pg[1] + 14, pg[1] + pg[3] - 14]) { ctx.fillStyle = '#7a5a1c'; ctx.beginPath(); ctx.arc(sx, sy, 4.2, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(sx - 1, sy - 1, 1.6, 0, TAU); ctx.fill(); }
}
/* Strawberry's mitten: a red knitted mitten with a snowflake on the back and a white cuff, a teal sleeve running off the right edge; it takes hold of the pedestal at 1.0 s and lets go at 2.15 s */
function mitten(lt) {
  const enter = eO(sg(lt, .62, 1.0)), leave = eI(sg(lt, 2.15, 2.6)), off = 600 * ((1 - enter) + leave);
  if (off > 590) return;
  ctx.save(); ctx.translate(842 + off, 1556 - 30 * (1 - enter) + 40 * leave);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(40, 82, 130, 14, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.roundRect(84, -48, 640, 96, 40); let g = ctx.createLinearGradient(0, -48, 0, 48); g.addColorStop(0, '#46c4bb'); g.addColorStop(1, '#2b948c'); ctx.fillStyle = g; ctx.fill(); outline(4);
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 3; for (const x of [250, 420, 590]) { ctx.beginPath(); ctx.moveTo(x, -42); ctx.quadraticCurveTo(x - 30, 0, x, 42); ctx.stroke(); }
  ctx.beginPath(); ctx.roundRect(50, -60, 60, 120, 14); g = ctx.createLinearGradient(50, 0, 110, 0); g.addColorStop(0, '#fffdf4'); g.addColorStop(1, '#e8e2d0'); ctx.fillStyle = g; ctx.fill(); outline(4);
  ctx.strokeStyle = '#d94a58'; ctx.lineWidth = 6; for (const y of [-34, 0, 34]) { ctx.beginPath(); ctx.moveTo(56, y); ctx.lineTo(104, y); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(-16, 6, 76, 66, 0, 0, TAU); g = ctx.createRadialGradient(-40, -22, 6, -16, 6, 84); g.addColorStop(0, '#ff6a70'); g.addColorStop(.6, '#d6303a'); g.addColorStop(1, '#9c1c28'); ctx.fillStyle = g; ctx.fill(); outline(4.4);
  ctx.beginPath(); ctx.ellipse(-52, -64, 26, 38, -.55, 0, TAU); ctx.fillStyle = g; ctx.fill(); outline(4.2);
  ctx.beginPath(); ctx.ellipse(-16, 6, 76, 66, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2.4; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = -56 + i * 22, y = -30 + j * 24; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y + 10); ctx.lineTo(x + 12, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i * PI / 3 + .3; ctx.beginPath(); ctx.moveTo(-8 - Math.cos(a) * 22, 4 - Math.sin(a) * 22); ctx.lineTo(-8 + Math.cos(a) * 22, 4 + Math.sin(a) * 22); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-52, -26, 14, 8, -.5, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ the lettering and the flakes that make it
let TL = null, TMASK = null;
/* SHIFT / HAPPENS on two lines, one size that fits 900 px; null until the font is loaded (nothing is cached before that) */
function titleLayout() {
  if (TL) return TL;
  if (!fontReady('Bangers')) return null;
  const font = 'Bangers', sp0 = TY.size * .018, w0 = meas('HAPPENS', TY.size, font, 400, sp0), size = Math.min(TY.size, TY.size * 900 / (w0.r - w0.l)), sp = size * .018, cap = UI.metrics(font).cap * size;
  const mk1 = (str, cy) => { const m = meas(str, size, font, 400, sp); return { str, cy, x: 540 - (m.l + m.r) / 2, base: cy + cap / 2 }; };
  return TL = { size, sp, cap, lines: [mk1('SHIFT', TY.shift), mk1('HAPPENS', TY.happens)] };
}
/* the flakes' target points: the two lines painted into an offscreen mask (a flat silhouette) and sampled once */
function titleMask() {
  if (TMASK) return TMASK;
  const S = SNn(), Lw = titleLayout();
  if (!S || !S.maskPoints || !Lw) return null;
  return TMASK = S.maskPoints(g => {
    g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.letterSpacing = Lw.sp + 'px'; g.lineWidth = Lw.size * .08; g.font = `400 ${Lw.size}px Bangers`;
    for (const L of Lw.lines) { g.fillText(L.str, L.x, L.base); g.strokeText(L.str, L.x, L.base); }
  }, 1080, 800, 8, 5);
}
function titleText(lt) {
  const Lw = titleLayout();
  if (!Lw) return;
  const a = ss((lt - T_LAND) / .35), ds = lt - CUE.ding;
  if (a > .004) {
    const drop = (1 - eO(sg(lt, T_LAND, T_LAND + .4))) * 14;
    Lw.lines.forEach((L, i) => bevelText(L.str, 540, L.cy + drop, Lw.size, { alpha: a, hero: a >= .999, shine: ds > 0 ? eIO(sg(ds, .05 + i * .22, 1.0 + i * .22)) : -1, shineA: .9, grp: 'bv:' + L.str, extr: .9, lwK: .115 }));
  }
  const ke = sg(lt, 4.2, 4.6);
  if (ke > 0) {
    const hero = ke >= 1, slide = (1 - eO(ke)) * 70;
    ctx.save(); ctx.globalAlpha *= ss(ke * 2.2); ctx.translate(0, slide);
    UI.pill('EPISODE 20', 540, TY.pill, { font: 'Bangers', size: 54, spacing: 6, fill: '#d93025', ink: '#ffffff', stroke: '#6a0e14', lw: 5, padX: 36, h: 80, hero, crop: !hero, id: 'fp20t.pill' });
    bevelText('THE SNOW DAY', 540, TY.snow, 116, { alpha: 1, hero, shine: ds > 0 ? eIO(sg(ds, .5, 1.4)) : -1, shineA: .9, grp: 'bv:snowday', extr: .7, lwK: .115, face: [[0, '#ffffff'], [.4, '#eaf7ff'], [.5, '#bfe0f8'], [1, '#f2fbff']] });
    ctx.restore();
  }
  if (ds > 0 && ds < 1.5) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [x, y, r, d] of [[110, 232, 38, 0], [972, 330, 30, .14], [150, 520, 28, .26], [940, 700, 32, .32]]) { const k = sg(ds, d, d + .55); star(x, y, r * Math.sin(PI * k), 1, k * .8); }
    ctx.restore();
  }
}
// ------------------------------------------------------------------ the shake and the scene
function shakeAt(lt) {
  const u = lt - CUE.shake;
  let A = 0;
  if (u >= 0) A = ss(u / .07) * (1 - ss((u - .85) / .3));
  const w = TAU * 5.3 * u, ant = u < 0 ? ss((u + .12) / .12) : Math.exp(-u / .05);                    /* a small tilt back as the hand takes hold, then the jolt */
  return { dx: u >= 0 ? 17 * A * Math.sin(w) : 0, dy: u >= 0 ? -9 * A * Math.abs(Math.sin(w * .5)) : 0, rot: (u >= 0 ? .05 * A * Math.sin(w + .5) : 0) - .03 * (u > -.12 ? ant : 0), env: A };
}
function titleDraw(lt) {
  const S = SNn(), Ld = Ln(), F = FXn();
  ctx.drawImage(staticArt(), 0, 0);
  windowPane(lt);
  const lamp = lampHead(lt);
  if (F) { F.glow(ctx, { x: lamp.x, y: lamp.y, r: 300 * lamp.f, color: '#ffc860', alpha: .5, core: .6 }); F.cone(ctx, { x: lamp.x, y: lamp.y, ang: LAMP_ANG, spread: 1.1, len: 1250, color: '#ffd890', alpha: .2 * lamp.f, soft: .85 }); }
  /* the mug's steam */
  if (F) F.smoke(ctx, { x: 176, y: 1650, w: 24, h: 170, t: lt, t0: -3, seed: 4, density: .4, drift: 24, color: '#e6ecf4', rate: 6, life: 2.6 });
  const sh = shakeAt(lt), blink = lt >= CUE.ding ? ringK(lt - CUE.ding, .16) : 0;
  ctx.save(); ctx.translate(PIV.x + sh.dx, PIV.y + sh.dy); ctx.rotate(sh.rot); ctx.translate(-PIV.x, -PIV.y);
  ctx.save(); ctx.beginPath(); ctx.arc(GL.x, GL.y, GL.r - 1, 0, TAU); ctx.clip(); globeScene(lt, blink); globeFlakes(lt); ctx.restore();
  globeGlass(lt); pedestal(); mitten(lt);
  ctx.restore();
  /* the light: a warm night. The lamp, the window's cool spill, the globe's own glow, the plaque. */
  if (Ld) Ld.pass(ctx, { ambient: .58, tint: '#0d1838', vignette: .16, glow: .3, bloom: .45, t: lt, lights: [
    { kind: 'cone', x: lamp.x, y: lamp.y, ang: LAMP_ANG, spread: 1.15, len: 1250, color: '#ffd8a0', power: .95 * lamp.f, soft: .8 },
    { kind: 'point', x: lamp.x, y: lamp.y, r: 230, color: '#ffc870', power: .8 * lamp.f, soft: .8 },
    { kind: 'rect', x: WP.x + WP.w / 2, y: WP.y + WP.h / 2, w: WP.w, h: WP.h, color: '#9ec4ff', power: .85, soft: .5, facing: PI / 2, spill: 800 },
    { kind: 'point', x: GL.x, y: GL.y - 40, r: 480, color: '#cfe6ff', power: .9, soft: .6 },
    { kind: 'point', x: 540, y: 1610, r: 340, color: '#ffdca0', power: .75, soft: .7 },
    { kind: 'point', x: 190, y: 1690, r: 240, color: '#ffd8a0', power: .6, soft: .7 }] });
  ctx.save(); ctx.translate(PIV.x + sh.dx, PIV.y + sh.dy); ctx.rotate(sh.rot); ctx.translate(-PIV.x, -PIV.y); plaque(); ctx.restore();
  /* the swirl that bursts out of the globe at the shake, gathers at the snowsettle cue and lands as the letters */
  const pts = titleMask(), ap = sg(lt, CUE.shake + .05, CUE.shake + .4) * (1 - sg(lt, T_LAND + .2, T_LAND + .55));
  if (S && S.settle && pts && ap > .004) S.settle(ctx, { pts, from: { x: 540, y: 1040, r: 340 }, t: lt, t0: CUE.settle, t1: T_LAND, seed: 5, size: 8, alpha: ap, tone: 'dark', max: 1800 });
  titleText(lt);
  if (window.V2 && V2.dust) V2.dust(180, 900, 900, 1560, lt, { n: 44, seed: 7, size: 3, alpha: .3, speed: 9 });
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'desk'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .02 * eIO(sg(lt, 0, 6.8)));
    CAM.shake = 2.4 * shakeAt(lt).env;
  },
  draw: titleDraw,
  fx(lt) {
    const fin = lt < .2 ? 1 - lt / .2 : 0, fout = sg(lt, 6.62, 6.8), ds = lt - CUE.ding;
    return { bloom: .5 + (ds > 0 ? .22 * ringK(ds, .4) : 0), vignette: .26, grain: .05, contrast: .08, sat: .06, tint: [['#1a2c58', .07, 'soft-light']], aberr: 0, fade: Math.max(fin, fout), fadeColor: '6,10,24' };
  },
  blur(lt) { return shakeAt(lt).env > .12 ? 3 : 1; },
  over() {},
  label: () => '',
};
window.__EP20_SCENES.title = TITLE;

// ====================================================================================================================================================================
// END (7.5 s, noScrim, noChyron): THE CLOSINGS. A local TV station's SNOW CLOSINGS graphic fills the frame: a studio-blue screen with a CHANNEL 12 STORM CENTER bug and a LIVE tag, the cast as small portrait chips (ESSENTIAL
// STAFF), a ruled table that types itself in (SCHOOLS CLOSED ... FRUIT SALAD NURSING AND REHAB OPEN), a red ESSENTIAL stamp, a live picture-in-picture of the night nurse in her car in the ditch with a pizza (A20.ditchPicture,
// a stand-in until it lands) under a lower third, and a pale-blue teaser strip: NEXT: EPISODE 21 / THE INSPECTION. Snow falls over the picture, never over the table.
// Cues (scene-local s, python3 /tmp/shift_tools/cues.py 20 end): theme20 .1 | typing 1.1 | stamp 4.0 | textding 5.1, each snapped to a frame.
//   0.00-0.10 fade up   0.10-0.60 the bug, the header and the LIVE tag slide in, the table frame draws   0.35-0.95 the portrait chips pop in, one after another   0.55-1.0 the picture-in-picture opens
//   1.10-3.70 the six rows are typed (a row every .43 s)   4.00 ESSENTIAL lands (the table dips 4 px, the camera jolts, an ink ring), PER POLICY. beside it   5.10 the teaser strip slides up with its shine and stars
//   5.45-7.2 a calm hold, a slow push-in; the LIVE dot, the hazard lights and the snow are the only motion   7.2-7.5 a dip to black.
// ====================================================================================================================================================================
const SE = snapOf('end');
const E = { type0: SE(1.1), stamp: SE(4.0), ding: SE(5.1) };
const ROWS = [['SCHOOLS', 'CLOSED'], ['BANKS', 'CLOSED'], ['DMV', 'CLOSED'], ['LIBRARY', 'CLOSED'], ['THE MALL', 'CLOSED'], ['FRUIT SALAD NURSING AND REHAB', 'OPEN']];
const rowT = i => E.type0 + i * .43;
const TB = { x: 40, y: 500, w: 1000, rowH: 80 };                                  /* the table: a header row and six rows */
const PIP = { x: 540, y: 1440, w: 844, h: 475 };                                  /* the picture-in-picture (centre) */
const TS = { x: 60, y: 1706, w: 960, h: 134 };                                    /* the teaser strip */
const CAST = [
  { key: 'straw', bg: '#ffe2cf', ring: '#e8782c', s: .23, expr: 'sour' }, { key: 'lemon', bg: '#fff3b8', ring: '#e8a82c', s: .23, expr: 'sour' }, { key: 'mango', bg: '#ffe7c2', ring: '#e8782c', s: .21, expr: 'neutral' },
  { key: 'onion', bg: '#e6e2fb', ring: '#6d5bd0', s: .22, expr: null }, { key: 'tomato', bg: '#fbd8d2', ring: '#c8473a', s: .22, expr: null }, { key: 'bind', bg: '#e5e8ec', ring: '#5b6470', s: .26, expr: null },
  { key: 'turnip', bg: '#e8dcf2', ring: '#7a4fa0', s: .2, expr: null }, { key: 'egg', bg: '#e3d5f2', ring: '#5b3a8a', s: .2, expr: null },
];
const CAST_FALLBACK = new Set();
function castCtor(key) {
  const g = window;
  return { straw: () => (g.A11 && g.A11.straw) || (g.A7 && g.A7.straw), lemon: () => g.A7 && g.A7.lemon, mango: () => g.A7 && g.A7.mango, onion: () => g.A15 && g.A15.onion, tomato: () => g.A15 && g.A15.tomato,
    bind: () => g.A15 && g.A15.binder, turnip: () => g.A20 && g.A20.turnip, egg: () => g.A20 && g.A20.eggplant }[key]();
}
/* the cast chips (ep19_title.js): a portrait in a circle, drawn live with the real constructors, guarded one by one */
function chip(p, cx, cy, rad, lt) {
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fillStyle = p.bg; ctx.fill();
  const ctor = castCtor(p.key);
  if (ctor) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rad - 1, 0, TAU); ctx.clip();
    try {
      const x = { t: lt, noLegs: true, noShadow: true, noReflect: true, s: p.s, x: 0, y: 0 };
      if (p.expr) x.expr = p.expr;
      if (p.key === 'onion') x.pose = 'rest';
      if (p.key === 'tomato') x.formsN = 0;
      if (p.key === 'bind') Object.assign(x, { grin: .55, glint: .5, center: true, bob: 0, hover: 0 });
      const o = Object.assign(ctor(x), x);
      if (p.key === 'tomato' || p.key === 'onion') o.hold = {};                      /* a portrait carries no props: they would cover the small faces */
      o.noLegs = true; o.s = p.s;
      if (p.key === 'bind') { o.x = cx; o.y = cy - 12 * p.s; }
      else { const [fx, fy] = window.H6.faceC(o); o.x = cx - fx; o.y = cy - fy + 3; }
      drawChar(o);
    } catch (e) { if (!CAST_FALLBACK.has(p.key)) { CAST_FALLBACK.add(p.key); console.error('CARDS20 chip ' + p.key + ': ' + e.message); } }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = p.ring; ctx.stroke();
}
/* the picture until A20.ditchPicture lands: a night ditch, a small car nose down in it with its hazards blinking slowly, the nurse's purple head at the wheel, a pizza box on the dash */
function ditchStandIn(cx, cy, w, h, lt) {
  ctx.save(); ctx.translate(cx - w / 2, cy - h / 2); ctx.beginPath(); ctx.roundRect(0, 0, w, h, 18); ctx.clip();
  let g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#12285a'); g.addColorStop(.6, '#223f7a'); g.addColorStop(1, '#4a6aa0'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  g = ctx.createLinearGradient(0, h * .6, 0, h); g.addColorStop(0, '#e9f2ff'); g.addColorStop(1, '#a9c0e4'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h * .62); ctx.quadraticCurveTo(w * .22, h * .5, w * .38, h * .74); ctx.lineTo(w * .62, h * .74); ctx.quadraticCurveTo(w * .8, h * .5, w, h * .6); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.translate(w * .5, h * .66); ctx.rotate(-.2);
  ctx.fillStyle = '#d94a3a'; ctx.beginPath(); ctx.roundRect(-150, -52, 300, 74, 22); ctx.fill(); outline(4); ctx.fillStyle = '#c23b2d'; ctx.beginPath(); ctx.roundRect(-84, -112, 168, 64, [26, 26, 4, 4]); ctx.fill(); outline(4);
  ctx.fillStyle = '#26164a'; ctx.beginPath(); ctx.roundRect(-72, -102, 144, 46, 14); ctx.fill();
  ctx.fillStyle = '#7b4fb4'; ctx.beginPath(); ctx.ellipse(-8, -78, 24, 28, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3d9a45'; ctx.fillRect(-22, -108, 28, 9);
  ctx.fillStyle = '#f4e6c0'; ctx.fillRect(22, -70, 36, 20); ctx.fillStyle = '#d93025'; ctx.fillRect(26, -66, 12, 12);
  const hz = .45 + .55 * (.5 + .5 * Math.sin(lt * TAU * 1));                                  /* hazards: a slow 1 Hz breath, never a flash */
  for (const sx of [-146, 146]) { ctx.fillStyle = `rgba(255,170,40,${hz})`; ctx.beginPath(); ctx.arc(sx, -24, 9, 0, TAU); ctx.fill(); glowAt(sx, -24, 70, '#ffaa28', .45 * hz, .3); }
  for (const sx of [-92, 92]) { ctx.fillStyle = '#1c1c22'; ctx.beginPath(); ctx.arc(sx, 24, 30, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#f6faff'; ctx.beginPath(); ctx.ellipse(-4, -110, 90, 14, 0, Math.PI, 0); ctx.fill();
  ctx.restore();
  ctx.restore();
}
/* the teaser strip's snowflake paper-cut dressing */
function flakeMark(x, y, r) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const a = i * PI / 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .6 - Math.sin(a) * r * .22, y + Math.sin(a) * r * .6 + Math.cos(a) * r * .22); ctx.lineTo(x + Math.cos(a) * r * .6 + Math.sin(a) * r * .22, y + Math.sin(a) * r * .6 - Math.cos(a) * r * .22); ctx.stroke(); }
  ctx.restore();
}

/* @@END3@@ */
})();
