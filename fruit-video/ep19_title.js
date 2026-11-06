'use strict';
/* SHIFT HAPPENS, Episode 19: The Potluck. Scene module FOOD cards: `title` (6.8 s) and `end` (7.5 s), registered on window.__EP19_SCENES. Prefix for anything new: fp19t_. Every string goes through the UI kit, live each frame (no text in
 * caches). The lettering recipe follows ep17_title.js / ep18_title.js (copied); the idea of each card is its own. The food is F19 (ep19_food.js) and the light is FX18 (ep18_fx.js), both guarded at draw time.
 *
 * TITLE (noChyron, noScrim): an evening kitchen, close and warm. A slow cooker on KEEP WARM stands on a gingham cloth on the counter, its red lamp pulsing; a pendant lamp throws a cone of light and dust through the room; a dusk window with a
 * crescent moon; a wooden spoon; a recipe card taped to the wall (EPISODE 19 / THE POTLUCK, dim until the ding). Cues (scene-local s, from python3 /tmp/shift_tools/cues.py 19 title): theme15 .2 | lidrattle 1.2 | steam 1.8 |
 * lidrattle 3.2 | textding 5.4, each snapped to the nearest video frame.
 *   0.00-0.20  fade up from black. The cooker bubbles, the lamp pulses, a thin thread of steam leaves the vent, dust drifts in the cone.
 *   1.20       lidrattle: the lid hops three times, shrinking, tipping side to side; three puffs of steam leave the gap.
 *   1.80       steam: a burst shoots up from the vent (a plume of nine fast wisps, 1000 px in about a second) to the top of the frame.
 *   2.15-2.95  the steam gathers into a warm haze across the title zone and the letters of SHIFT HAPPENS condense out of it one after another, left to right (each rises 46 px into its place, from steam-white), and at 2.95 they land
 *              warm gold (a flash of glow, a shine sweeping across).   3.20  lidrattle again: the lid hops, the letters jump 4 px in a wave, a second puff.   3.6-5.4  a calm hold: slow wisps drift across the lettering at low alpha.
 *   5.40       textding: the recipe card lights up (a warm glow, a shine across the laminate, three stars).   5.4-6.6 a held frame, a slow push-in (2 percent over the scene); 6.62-6.8 a dip to black.
 * END: see the second half of this file. */
(() => {
/* the title of the next episode, shown in the end card's teaser (the lead confirms it: change this one constant) */
const TEASER20 = 'THE SNOW DAY';
if (!window.TIMELINE_EP19 || !window.UI || !window.H6) return;
const { zoomTo } = window.H6;
window.__EP19_SCENES = window.__EP19_SCENES || {};
const TLX = window.TIMELINE_EP19;
const PI = Math.PI, TAU = PI * 2;

// ------------------------------------------------------------------ palette and small maths
const INK = '#161210', CREAM = '#f6efd2', PAPER = '#f4efe0', GOLD = '#ffd21a';
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const eIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eO = k => 1 - Math.pow(1 - k, 3);
const eI = k => k * k * k;
const back = (k, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mixh = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (s) => Math.round(lp((A >> s) & 255, (B >> s) & 255, k)); return `rgb(${f(16)},${f(8)},${f(0)})`; };
const ringK = (age, tau) => age < 0 ? 0 : Math.exp(-age / tau);
const vgrad = (cap, stops, y0 = -1.03, y1 = .04) => { const g = ctx.createLinearGradient(0, cap * y0, 0, cap * y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
const rrect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
const OUTL = 'rgba(28,20,14,.78)';
const outline = (lw = 3.5, col = OUTL) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); };
const FX = () => (typeof FX18 !== 'undefined' && FX18) || null;
const F = () => (typeof F19 !== 'undefined' && F19) || null;
/* scene start (absolute seconds) and the snap of a cue time to the video frame nearest to it: a picture event lands on its own frame */
const startOf = id => (TLX.scenes.find(s => s.id === id) || { start: 0 }).start;
const snapOf = id => { const S0 = startOf(id); return t => Math.round((S0 + t) * 30) / 30 - S0; };
/* measuring on a private canvas (ep15_title.js does the same): ink box and advance of a string */
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
/* Bangers lettering with a body (ep17_title.js): soft drop shadow, a slab of extrusion, dark outline, gold rim, bright gradient face, gloss, sweeping shine. Only the face is the string the viewer reads
 * (hero when `hero`); every other layer is a decorative copy (hero:false, crop:true, one group). */
const FACE = [[0, '#fffbd0'], [.2, '#fff06a'], [.47, '#ffd21a'], [.5, '#ffb300'], [1, '#ff8a00']];
function bevelText(str, cx, cy, size, o = {}) {
  const font = 'Bangers', sp = o.spacing ?? size * .018, cap = UI.metrics(font).cap * size, alpha = o.alpha ?? 1, ex = o.extr ?? 1, lw = size * (o.lwK ?? .125), reveal = o.reveal ?? 1;
  if (alpha <= .004 || reveal <= 0 || size < 2) return null;
  const common = { font, size, spacing: sp, grp: o.grp || 'bv:' + str, tilt: .3, reveal, hero: false, crop: true };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv, alpha }, extra));
  const ext = o.ext || ['#c47f0a', '#3a2204'];
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
/* a soft glow when FX18 is there, else the engine's own */
function glowAt(x, y, r, color, a, core) {
  const FXn = FX();
  if (FXn && typeof FXn.glow === 'function') FXn.glow(ctx, { x, y, r, color, alpha: a, core: core || 0 });
  else if (window.V2) { const n = parseInt(color.slice(1), 16); V2.glow(x, y, r, `${n >> 16},${(n >> 8) & 255},${n & 255}`, Math.min(1, a), 'screen', .3); }
}

// ------------------------------------------------------------------ the kitchen set (shared look: the title and the end card use the same tiled wall)
let TILES = null;
function tileWall() {
  if (TILES) return TILES;
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1860; cv.__txOK = true;
  const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 1860); gr.addColorStop(0, '#1d3835'); gr.addColorStop(.5, '#2a4943'); gr.addColorStop(1, '#27433e'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1860);
  const tw = 130, th = 64;                                                                                          /* subway tiles, offset every other row, each a little different */
  for (let r = 0; r * th < 1860; r++) for (let c = -1; c * tw < 1080 + tw; c++) {
    const x = c * tw + (r % 2 ? tw / 2 : 0), y = r * th, v = rnd(r * 31 + c * 7 + 3);
    g.fillStyle = `rgba(${v > .5 ? '255,255,255' : '0,0,0'},${.025 + .05 * Math.abs(v - .5)})`; g.fillRect(x + 2, y + 2, tw - 4, th - 4);
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x + 2, y + 2, tw - 4, 3); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 2, y + th - 5, tw - 4, 3);
  }
  g.strokeStyle = 'rgba(0,0,0,.26)'; g.lineWidth = 3;
  for (let r = 0; r * th < 1860; r++) { g.beginPath(); g.moveTo(0, r * th); g.lineTo(1080, r * th); g.stroke(); for (let c = -1; c * tw < 1080 + tw; c++) { const x = c * tw + (r % 2 ? tw / 2 : 0); g.beginPath(); g.moveTo(x, r * th); g.lineTo(x, (r + 1) * th); g.stroke(); } }
  return TILES = cv;
}
function wallDraw() { ctx.drawImage(tileWall(), 0, 0); }
/* the counter: a butcher-block top in perspective (back edge y0, front edge y1), its front lip, the cabinet below */
function counter(y0, y1) {
  ctx.save();
  let g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#7a4e28'); g.addColorStop(.6, '#9a6634'); g.addColorStop(1, '#b0783c'); ctx.fillStyle = g; ctx.fillRect(-60, y0, 1200, y1 - y0);
  ctx.strokeStyle = 'rgba(50,28,10,.35)'; ctx.lineWidth = 2.6;
  for (let i = -3; i < 16; i++) { const xb = i * 92, xf = 540 + (xb - 540) * 1.28; ctx.beginPath(); ctx.moveTo(xb, y0); ctx.lineTo(xf, y1); ctx.stroke(); }
  for (let i = 0; i < 14; i++) { const a = rnd(i * 2.3) * 1000, y = lp(y0, y1, rnd(i * 5.1 + 1)); ctx.strokeStyle = 'rgba(255,230,180,.07)'; ctx.beginPath(); ctx.moveTo(a - 200, y); ctx.lineTo(a + 260, y + 4); ctx.stroke(); }
  g = ctx.createLinearGradient(0, y0, 0, y0 + 50); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-60, y0, 1200, 50);                  /* the wall's contact shadow */
  ctx.fillStyle = '#c8905a'; ctx.fillRect(-60, y1, 1200, 14); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-60, y1, 1200, 4);                                                        /* the front lip */
  g = ctx.createLinearGradient(0, y1 + 14, 0, 1960); g.addColorStop(0, '#2c4a44'); g.addColorStop(1, '#1b302c'); ctx.fillStyle = g; ctx.fillRect(-60, y1 + 14, 1200, 1960 - y1 - 14);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-60, y1 + 14, 1200, 22);
  for (const x of [60, 560]) { ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 3; rrect(x, y1 + 56, 460, 140, 8); ctx.stroke(); }
  ctx.restore();
}
/* a gingham cloth on the counter in perspective: a bilinear map of the cloth's corners [BL, BR, FR, FL] (back left, back right, front right, front left); an optional corner hanging over the front lip */
function gingham(Q, cols, rows, hang) {
  const P = (u, v) => { const bx = lp(Q[0][0], Q[1][0], u), by = lp(Q[0][1], Q[1][1], u), fx = lp(Q[3][0], Q[2][0], u), fy = lp(Q[3][1], Q[2][1], u); return [lp(bx, fx, v), lp(by, fy, v)]; };
  const quad = (u0, v0, u1, v1) => { const a = P(u0, v0), b = P(u1, v0), c = P(u1, v1), d = P(u0, v1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); };
  ctx.save();
  quad(0, 0, 1, 1); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.fillStyle = '#fbf3e6'; ctx.fill(); ctx.restore();
  ctx.save(); quad(0, 0, 1, 1); ctx.clip();
  ctx.fillStyle = 'rgba(204,52,44,.5)';
  for (let j = 0; j < cols; j += 2) { quad(j / cols, 0, (j + 1) / cols, 1); ctx.fill(); }
  for (let i = 0; i < rows; i += 2) { quad(0, i / rows, 1, (i + 1) / rows); ctx.fill(); }
  const lg = ctx.createRadialGradient(540, 1700, 60, 540, 1700, 560); lg.addColorStop(0, 'rgba(255,230,170,.2)'); lg.addColorStop(1, 'rgba(20,6,2,.34)'); ctx.fillStyle = lg; ctx.fillRect(-100, Q[0][1] - 10, 1300, 400);   /* the lamp pool */
  ctx.restore();
  quad(0, 0, 1, 1); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(70,24,16,.55)'; ctx.stroke();
  if (hang) {                                                                                                       /* a corner of the cloth hangs over the front lip */
    const a = P(hang.u0, 1), b = P(hang.u1, 1), tip = [lp(a[0], b[0], .55) + hang.lean, a[1] + hang.h];
    ctx.beginPath(); ctx.moveTo(a[0], a[1] - 2); ctx.lineTo(b[0], b[1] - 2); ctx.quadraticCurveTo(b[0] + 6, lp(b[1], tip[1], .6), tip[0], tip[1]); ctx.quadraticCurveTo(a[0] - 6, lp(a[1], tip[1], .6), a[0], a[1] - 2); ctx.closePath();
    ctx.fillStyle = '#fbf3e6'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(204,52,44,.5)'; for (let j = 0; j < 14; j++) ctx.fillRect(a[0] + j * 28 - 100, a[1], 14, 200); for (let i = 0; i < 8; i++) ctx.fillRect(a[0] - 100, a[1] + i * 36 - 4, 600, 18);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(a[0] - 100, a[1], 600, 200); ctx.restore(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(70,24,16,.55)'; ctx.stroke();
  }
  ctx.restore();
}
/* a wooden spoon lying on the counter: bowl at (x, y), the handle toward +x at the given angle */
function spoon(x, y, ang, len) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.save(); ctx.translate(6, 14); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 54, 28, 0, 0, TAU); ctx.fill(); ctx.fillRect(40, -9, len - 30, 18); ctx.restore();
  ctx.beginPath(); ctx.moveTo(30, -10); ctx.lineTo(len, -8); ctx.quadraticCurveTo(len + 14, 0, len, 8); ctx.lineTo(30, 10); ctx.closePath(); ctx.fillStyle = ctx.createLinearGradient(0, -10, 0, 10); ctx.fillStyle.addColorStop(0, '#e2b57a'); ctx.fillStyle.addColorStop(1, '#a8723a'); ctx.fill(); outline(3);
  ctx.beginPath(); ctx.ellipse(0, 0, 54, 28, 0, 0, TAU); ctx.fillStyle = ctx.createRadialGradient(-14, -8, 4, 0, 0, 60); ctx.fillStyle.addColorStop(0, '#edc88e'); ctx.fillStyle.addColorStop(1, '#a8723a'); ctx.fill(); outline(3.2);
  ctx.beginPath(); ctx.ellipse(4, 2, 40, 19, 0, 0, TAU); ctx.fillStyle = 'rgba(80,40,10,.22)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(60, -4); ctx.lineTo(len - 8, -3); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,240,200,.5)'; ctx.stroke();
  ctx.restore();
}
// ------------------------------------------------------------------ TITLE: layout and cues
const SN = snapOf('title');
const CUE = { rattle1: SN(1.2), steam: SN(1.8), rattle2: SN(3.2), ding: SN(5.4) };
const COOK = { x: 540, y: 1730, s: 2.3 };
const VENT = { x: COOK.x + 100 * COOK.s, y: COOK.y - 109 * COOK.s };                       /* where F19's slow cooker lets steam out (its `hot` anchor) */
const TY = { cy: 400, form0: 2.35, gold: 2.95 };
const CARD = { cx: 250, cy: 810, w: 372, h: 240 };
const WIN = { x: 650, y: 560, w: 340, h: 430 };
const COUNTER = { y0: 1560, y1: 1840 };

/* the lid's hops after a rattle cue: a decaying double-time bounce (hop 0..1), the lid tipping side to side (-1..1), the puff of steam that goes with it */
function rattle(lt, c0) {
  const u = lt - c0; if (u < 0 || u > .8) return { hop: 0, lid: 0, puff: 0, env: 0 };
  const env = Math.exp(-4.2 * u), ph = .9 + u * PI * 6.5;                                  /* the phase offset puts the first hop ON the cue frame (the sound starts with a knock) */
  return { hop: env * Math.abs(Math.sin(ph)), lid: env * Math.sin(ph), puff: env, env };
}

// ------------------------------------------------------------------ the dusk window, the pendant lamp, the recipe card
function windowDraw(lt) {
  const W_ = WIN, x = W_.x, y = W_.y, w = W_.w, h = W_.h;
  ctx.save();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rrect(x - 20, y - 20, w + 40, h + 40, 14); ctx.fillStyle = '#d9d0b8'; ctx.fill(); ctx.restore();
  rrect(x - 20, y - 20, w + 40, h + 40, 14); outline(4);
  ctx.save(); rrect(x, y, w, h, 6); ctx.clip();
  let g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#141f3c'); g.addColorStop(.45, '#2b3560'); g.addColorStop(.78, '#8a5a6e'); g.addColorStop(1, '#e08a4a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 16; i++) { const sx = x + 14 + rnd(i * 3.1) * (w - 28), sy = y + 12 + rnd(i * 5.7) * h * .45, tw = .55 + .45 * Math.sin(lt * (1.1 + rnd(i * 9.1)) + i); ctx.fillStyle = `rgba(255,248,220,${.5 * tw})`; ctx.beginPath(); ctx.arc(sx, sy, 1.4 + 1.2 * rnd(i * 1.7), 0, TAU); ctx.fill(); }
  const mx = x + w * .66, my = y + h * .24;                                                                           /* the crescent moon */
  glowAt(mx, my, 120, '#ffe9a8', .5, .4);
  ctx.fillStyle = '#fff1b8'; ctx.beginPath(); ctx.arc(mx, my, 34, 0, TAU); ctx.fill(); ctx.fillStyle = '#243062'; ctx.beginPath(); ctx.arc(mx + 15, my - 7, 31, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(20,12,24,.85)'; ctx.beginPath(); ctx.moveTo(x, y + h * .84); for (let i = 0; i <= 8; i++) ctx.lineTo(x + w * i / 8, y + h * (.82 + .03 * Math.sin(i * 2.3))); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();   /* roofs */
  for (const [rx, ry] of [[.18, .9], [.45, .87], [.72, .91]]) { ctx.fillStyle = 'rgba(255,200,110,.85)'; ctx.fillRect(x + w * rx, y + h * ry, 12, 14); }
  ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.fillStyle = '#e7dfc8'; ctx.fillRect(x + w / 2 - 6, y, 12, h); ctx.fillRect(x, y + h * .46, w, 12); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.strokeRect(x + w / 2 - 6, y, 12, h); ctx.strokeRect(x, y + h * .46, w, 12);   /* muntins */
  rrect(x, y, w, h, 6); outline(4);
  ctx.fillStyle = '#efe7d0'; rrect(x - 34, y + h + 16, w + 68, 22, 6); ctx.fill(); outline(3.4);                  /* the sill */
  ctx.restore();
}
/* the pendant lamp: a cord, an enamel shade, a hot bulb and the cone of light it throws */
const LAMP = { x: 215, top: 120, bottom: 262 };
function lampDraw(lt) {
  const FXn = FX(), sw = Math.sin(lt * .9) * 2.2;
  ctx.save(); ctx.translate(LAMP.x, 0); ctx.rotate(sw * PI / 180 * .4);
  ctx.strokeStyle = '#15110d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, LAMP.top); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-30, LAMP.top + 14); ctx.quadraticCurveTo(-34, LAMP.top - 6, 0, LAMP.top - 10); ctx.quadraticCurveTo(34, LAMP.top - 6, 30, LAMP.top + 14); ctx.closePath(); ctx.fillStyle = '#3a342c'; ctx.fill(); outline(3);
  ctx.beginPath(); ctx.moveTo(-34, LAMP.top + 10); ctx.bezierCurveTo(-60, LAMP.top + 50, -100, LAMP.bottom - 36, -118, LAMP.bottom); ctx.lineTo(118, LAMP.bottom); ctx.bezierCurveTo(100, LAMP.bottom - 36, 60, LAMP.top + 50, 34, LAMP.top + 10); ctx.closePath();
  ctx.fillStyle = ctx.createLinearGradient(-118, 0, 118, 0); for (const [o, c] of [[0, '#f2d27a'], [.4, '#e6b84a'], [1, '#a87c22']]) ctx.fillStyle.addColorStop(o, c); ctx.fill(); outline(4);
  ctx.beginPath(); ctx.ellipse(0, LAMP.bottom, 118, 14, 0, 0, TAU); ctx.fillStyle = '#fff3c8'; ctx.fill(); outline(3);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-48, LAMP.top + 70, 9, 40, .3, 0, TAU); ctx.fill();
  ctx.restore();
  const fl = 1 + .02 * Math.sin(lt * 7.3) + .015 * Math.sin(lt * 13.1);
  glowAt(LAMP.x, LAMP.bottom + 10, 360 * fl, '#ffc860', .5, .5);
  if (FXn) FXn.cone(ctx, { x: LAMP.x, y: LAMP.bottom, ang: PI / 2 - .22, spread: 1.15, len: 1500, color: '#ffd890', alpha: .2, soft: .85 });
}
/* the recipe card taped to the wall: EPISODE 19 / THE POTLUCK. Dim (and set dressing) until the ding, then it lights up with a glow, a shine and stars. */
function card(lt) {
  const Cd = CARD, ds = lt - CUE.ding, lit = ds >= 0 ? Math.max(.35, sg(lt, CUE.ding, CUE.ding + .22)) : 0, hero = lit >= 1, pop = ds > 0 ? 1 + .06 * Math.sin(Math.min(1, ds / .2) * PI) : 1, epk = sg(lt, .62, .95);
  ctx.save(); ctx.translate(Cd.cx, Cd.cy); ctx.rotate(-.04); ctx.scale(pop, pop);
  const bx = -Cd.w / 2, by = -Cd.h / 2;
  UI.panel([bx, by, Cd.w, Cd.h], { r: 10, fill: ['#fbf6e4', '#eadfbf'], stroke: '#a89a74', lw: 4, shadow: 20, id: 'fp19t.card' });
  ctx.fillStyle = '#c23a2b'; rrect(bx + 14, by + 16, Cd.w - 28, 8, 4); ctx.fill();                                      /* a red rule along the top */
  ctx.strokeStyle = 'rgba(70,110,170,.28)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(bx + 18, by + 150 + i * 28); ctx.lineTo(bx + Cd.w - 18, by + 150 + i * 28); ctx.stroke(); }
  ctx.fillStyle = 'rgba(120,70,30,.16)'; ctx.beginPath(); ctx.ellipse(bx + Cd.w - 64, by + Cd.h - 44, 26, 18, .4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(bx + Cd.w - 48, by + Cd.h - 30, 9, 7, 0, 0, TAU); ctx.fill();   /* a gravy stain */
  const a = sg(epk, 0, 1);
  if (a > 0) UI.label('EPISODE 19', 0, -42, { font: 'Nunito', weight: 900, size: 40, spacing: 8, fill: '#c23a2b', reveal: a, cid: 'fp19t.card', hero: hero && a >= 1, crop: !(hero && a >= 1), maxW: Cd.w - 56 });
  UI.label('THE POTLUCK', 0, 38, { font: 'Bangers', size: 74, spacing: 2, fill: INK, cid: 'fp19t.card', hero, crop: !hero, maxW: Cd.w - 48 });
  ctx.save(); rrect(bx, by, Cd.w, Cd.h, 10); ctx.clip();
  if (ds > .05 && ds < 1.0) { const x = lp(bx - 120, bx + Cd.w + 120, eIO(sg(ds, .05, .95))), g = ctx.createLinearGradient(x - 70, by, x + 70, by + Cd.h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(bx, by, Cd.w, Cd.h); }
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .55 * (1 - lit); ctx.fillStyle = '#4a5a58'; ctx.fillRect(bx, by, Cd.w, Cd.h);            /* the card is in the dark until the ding */
  ctx.restore();
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * (Cd.w / 2 - 38), by + 4); ctx.rotate(s * .3); ctx.fillStyle = 'rgba(238,226,170,.8)'; ctx.fillRect(-40, -13, 80, 28); ctx.strokeStyle = 'rgba(150,140,90,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(-40, -13, 80, 28); ctx.restore(); }   /* washi tape */
  ctx.restore();
  if (ds >= 0 && ds < 1.4) {
    const FXn = FX(), f = ringK(ds, .5);
    glowAt(Cd.cx, Cd.cy, 340, '#ffe3a0', .5 * f, .2);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [dx, dy, r, d] of [[-Cd.w / 2 - 14, -Cd.h / 2 + 6, 30, 0], [Cd.w / 2 + 6, -Cd.h / 2 - 22, 26, .12], [Cd.w / 2 - 40, Cd.h / 2 + 22, 24, .24]]) { const k = sg(ds, d, d + .5); star(Cd.cx + dx, Cd.cy + dy, r * Math.sin(PI * k), 1, k * .8); }
    ctx.restore();
    if (FXn && ds < .3) FXn.cone(ctx, { x: Cd.cx + 120, y: Cd.cy - 420, ang: PI / 2 + .12, spread: .55, len: 640, color: '#fff0c8', alpha: .3 * (1 - ds / .3) });
  }
}

// ------------------------------------------------------------------ the title lettering: SHIFT HAPPENS, letter by letter, condensing out of the steam
const STR = 'SHIFT HAPPENS';
let LAY = null;
function layout() {
  if (LAY) return LAY;
  const font = 'Bangers', m100 = meas(STR, 100, font, 400, 1.8), size = Math.min(150, 900 / ((m100.r - m100.l) / 100)), sp = size * .018, mf = meas(STR, size, font, 400, sp), ox = 540 - (mf.l + mf.r) / 2, letters = [];
  for (let i = 0; i < STR.length; i++) {
    const ch = STR[i]; if (ch === ' ') continue;
    const pre = meas(STR.slice(0, i + 1), size, font, 400, sp), one = meas(ch, size, font, 400, sp);
    letters.push({ ch, i, k: letters.length, x: ox + pre.adv - one.adv + (one.l + one.r) / 2, c: (one.l + one.r) / 2 });
  }
  return LAY = { size, sp, letters, left: ox + meas(STR, size, font, 400, sp).l, right: ox + meas(STR, size, font, 400, sp).r };
}
/* every letter has the layers of bevelText (shadow, extrusion, outline, rim, face, gloss, shine) drawn layer by layer across all letters, so an outline never covers a neighbour's face */
function titleLetters(lt) {
  const Lw = layout(), size = Lw.size, font = 'Bangers', gold = sg(lt, TY.gold - .12, TY.gold + .12), cy = TY.cy;
  const faceStops = FACE.map(([o, c]) => [o, mixh('#fffdf2', c, gold)]), ext = [mixh('#d6d1c0', '#c47f0a', gold), mixh('#8c8778', '#3a2204', gold)], rim = mixh('#e2ddcd', '#c47f0a', gold);
  const r2 = rattle(lt, CUE.rattle2), shineX = lt > TY.gold + .05 ? lp(Lw.left - 120, Lw.right + 120, eIO(sg(lt, TY.gold + .05, TY.gold + .9))) : null;
  const shine2 = lt > CUE.ding ? lp(Lw.left - 120, Lw.right + 120, eIO(sg(lt, CUE.ding + .1, CUE.ding + .9))) : null;
  const S = Lw.letters.map(l => {
    const t0 = TY.form0 + Math.abs(l.x - 560) / 90 * .05, p = sg(lt, t0, t0 + .46), a = eO(sg(lt, t0, t0 + .3)), bump = r2.env * 4 * Math.sin(lt * 40 - l.k * .9) * (l.k < 12 ? 1 : 0);
    return { l, p, a, dy: (1 - eO(p)) * 46 + bump, sz: size * lp(1.26, 1, eO(p)), settled: p >= 1 && lt > TY.gold + .2 };
  }).filter(s => s.a > .004);
  if (!S.length) return;
  const each = (fn) => { for (const s of S) fn(s, UI.metrics(font).cap * s.sz); };
  const base = s => ({ font, size: s.sz, spacing: s.sz * .018, grp: 'fp19t.title', tilt: .3, hero: false, crop: true, alpha: s.a });
  const lw = s => s.sz * .125 * .9;
  each(s => { const k = 1 - s.p; if (k > .02) glowAt(s.l.x, cy + s.dy - size * .35, 150 * (.6 + k), '#fff4dc', .5 * k * s.a, .1); });         /* the steam the letter condenses from */
  each(s => UI.label(s.l.ch, s.l.x + s.sz * .03, cy + s.dy + s.sz * .15 * .5 + s.sz * .03, Object.assign(base(s), { fill: 'rgba(2,0,14,.45)', stroke: 'rgba(2,0,14,.45)', lw: lw(s) * 1.45, shadow: s.sz * .14 })));
  const n = Math.round(.5 * size * .07);
  for (let i = n; i >= 1; i--) { const c = mixh(ext[0], ext[1], 1 - i / n * .6); each(s => UI.label(s.l.ch, s.l.x + i * .28, cy + s.dy + i, Object.assign(base(s), { fill: c, stroke: c, lw: lw(s) }))); }
  each(s => UI.label(s.l.ch, s.l.x, cy + s.dy, Object.assign(base(s), { fill: INK, stroke: INK, lw: lw(s) })));
  each(s => UI.label(s.l.ch, s.l.x, cy + s.dy, Object.assign(base(s), { fill: rim, stroke: rim, lw: lw(s) * .55 })));
  each((s, cap) => UI.label(s.l.ch, s.l.x, cy + s.dy, Object.assign(base(s), { fill: vgrad(cap, faceStops), lw: 0, hero: s.settled, crop: !s.settled })));
  each((s, cap) => UI.label(s.l.ch, s.l.x, cy + s.dy, Object.assign(base(s), { fill: vgrad(cap, [[0, 'rgba(255,255,255,.46)'], [.4, 'rgba(255,255,255,.06)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), lw: 0 })));
  for (const sx of [shineX, shine2]) if (sx != null && sx > Lw.left - 110 && sx < Lw.right + 110) {
    each((s, cap) => { const lx = sx - (s.l.x - s.l.c), g = ctx.createLinearGradient(lx - cap * .5, -cap, lx + cap * .5, 0); for (const [o, a] of [[0, 0], [.36, 0], [.5, .85], [.64, 0], [1, 0]]) g.addColorStop(o, `rgba(255,255,255,${a})`); UI.label(s.l.ch, s.l.x, cy + s.dy, Object.assign(base(s), { fill: g, lw: 0 })); });
  }
}
// ------------------------------------------------------------------ the title scene
function titleDraw(lt) {
  const Fn = F(), FXn = FX();
  wallDraw();
  windowDraw(lt);
  card(lt);
  lampDraw(lt);
  counter(COUNTER.y0, COUNTER.y1);
  gingham([[190, 1592], [890, 1592], [1020, 1846], [60, 1846]], 12, 7, { u0: .5, u1: .68, h: 52, lean: 6 });
  const r1 = rattle(lt, CUE.rattle1), r2 = rattle(lt, CUE.rattle2), puff = Math.max(r1.puff, r2.puff), gf = ringK(lt - TY.gold, .3) * (lt >= TY.gold ? 1 : 0);
  /* the slow cooker: bubbling, its lamp pulsing, the lid rattling on its own steam all the time and hopping on the rattle cues */
  if (Fn && Fn.dish) {
    const light = cl(.62 + .38 * Math.sin(lt * 2.7) + .25 * puff, 0, 1), steam = cl(.22 + .6 * sg(lt, CUE.steam, CUE.steam + .4) * (1 - .55 * sg(lt, 4, 5.4)) + .6 * puff, 0, 1);
    Fn.dish(ctx, 'slowcooker', { x: COOK.x, y: COOK.y, s: COOK.s, steam, light, hop: Math.max(r1.hop, r2.hop) * .38, lid: (r1.lid + r2.lid) * .5, t: lt, seed: 2, hero: true, fog: .55 });
  }
  spoon(300, 1796, PI - .1, 226);
  if (Fn && Fn.steam) {
    /* puffs from the lid gap on each rattle, then the burst on the steam cue: nine fast wisps shoot up to the title */
    for (const c0 of [CUE.rattle1, CUE.rattle2]) Fn.steam(ctx, { x: VENT.x - 14, y: VENT.y - 40, w: 60, h: 270, t: lt, seed: 21 + c0, power: .9, curl: .7, t0: c0, t1: c0 + .35, period: .8, n: 5, stagger: .3 });
    Fn.steam(ctx, { x: VENT.x, y: VENT.y - 24, w: 120, h: 1040, t: lt, seed: 5, power: 1, curl: .9, t0: CUE.steam, t1: CUE.steam + .65, period: .65, n: 9, stagger: .5, lean: -250 });
  }
  /* the haze the steam gathers into across the title zone: it thickens as the letters condense and thins once they have landed */
  const hz = sg(lt, 2.3, 2.9) * (1 - .8 * sg(lt, 3.2, 4.4));
  if (hz > .01) for (let k = 0; k < 6; k++) glowAt(250 + k * 126 + 24 * Math.sin(lt * .7 + k * 1.9), TY.cy - 20 + 22 * Math.sin(lt * .9 + k * 1.3), 230 + 40 * Math.sin(lt * .6 + k), '#fff1d6', .15 * hz, 0);
  if (gf > .01) glowAt(540, TY.cy - 30, 760, '#ffd27a', .34 * gf, .3);
  titleLetters(lt);
  /* the light of the evening: a lamp pool on the cloth, dust drifting in the cone */
  glowAt(COOK.x, 1570, 560, '#ffcf80', .16, 0);
  if (Fn && Fn.steam) Fn.steam(ctx, { x: VENT.x - 40, y: VENT.y - 40, w: 90, h: 1000, t: lt, seed: 11, power: .42, curl: 1, t0: CUE.steam + 1.0, period: 3.6, n: 4, stagger: .9, lean: -200 });
  if (window.V2 && V2.dust) V2.dust(40, 150, 760, 1560, lt, { n: 56, seed: 7, size: 3.2, alpha: .32, speed: 9 });
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'kitchen'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .02 * eIO(sg(lt, 0, 6.8)));
    CAM.shake = 2.2 * (rattle(lt, CUE.rattle1).env + rattle(lt, CUE.rattle2).env);
  },
  draw: titleDraw,
  fx(lt) {
    const fin = lt < .2 ? 1 - lt / .2 : 0, fout = sg(lt, 6.62, 6.8), ds = lt - CUE.ding, gf = lt >= TY.gold ? ringK(lt - TY.gold, .3) : 0;
    return { bloom: .5 + .28 * gf + (ds > 0 ? .2 * ringK(ds, .4) : 0), vignette: .44, grain: .05, contrast: .1, sat: .06, tint: [['#3a1c08', .1, 'soft-light']], aberr: 0, fade: Math.max(fin, fout), fadeColor: '8,4,2' };
  },
  blur(lt) { const a = rattle(lt, CUE.rattle1).env + rattle(lt, CUE.rattle2).env; return a > .15 ? 3 : (lt > CUE.steam && lt < CUE.steam + 1.0) ? 2 : 1; },
  over() {},
  label: () => '',
};
window.__EP19_SCENES.title = TITLE;
// ====================================================================================================================================================================
// END (7.5 s, noScrim, noChyron): THE SIGN-UP SHEET. The kitchen wall again, calm and a little later: a corkboard with the POTLUCK SIGN-UP sheet pinned to it, the results typed in (ROLLS 1 with ELEVEN SIGNED UP beside it,
// TURKEY BEIGE, PIE SMOOTHIE, COFFEE PUDDING, BREAK 0:00, TEMP LOG 78 F), the cast signed as small portrait chips, a HAPPY THANKSGIVING stamp that lands in the empty space under the table, and under the board a pale blue
// notice: NEXT: EPISODE 20 / THE SNOW DAY (snow starts to fall on it). In the corner of the counter a small beige turkey mold on its platter, steaming a thin thread: the mascot.
// Cues (scene-local s, python3 /tmp/shift_tools/cues.py 19 end): theme15 .1 | typing 1.1 | stamp 4.0 | textding 5.1, each snapped to a frame.
//   0.00-0.10 fade up   0.10-0.55 the board settles onto the wall, the four pins pop in   0.35-0.95 the portrait chips pop in, one after another   1.10-3.70 the six results are typed (a row every .43 s)
//   4.00 HAPPY THANKSGIVING lands (the board dips 4 px, the camera jolts, an ink ring)   5.10 the notice pins up with its shine and stars, snow begins   5.45-7.2 a calm hold, a slow push-in; the mascot's steam and the snow are the only motion
//   7.2-7.5 a dip to black.
// ====================================================================================================================================================================
const SE = snapOf('end');
const E = { type0: SE(1.1), stamp: SE(4.0), ding: SE(5.1) };
const ROWS = [['ROLLS', '1'], ['TURKEY', 'BEIGE'], ['PIE', 'SMOOTHIE'], ['COFFEE', 'PUDDING'], ['BREAK', '0:00'], ['TEMP LOG', '78 F']];
const rowT = i => E.type0 + i * .43;
const BD = { x: 90, y: 410, w: 900, h: 1080 };                                     /* the corkboard (inside its frame) */
const SH = { x: 190, y: 470, w: 700, h: 960 };                                     /* the sheet */
const TB = { x: 230, y: 640, w: 620, rowH: 80 };                                   /* the table on it */
const NT = { x: 110, y: 1534, w: 660, h: 172 };                                    /* the notice under the board */
const COUNTER_E = { y0: 1722, y1: 1856 };
let CORK = null;
function corkTile() {
  if (CORK) return CORK;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; cv.__txOK = true;
  const g = cv.getContext('2d'); g.fillStyle = '#b98a55'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) { const x = rnd(i * 1.7) * 256, y = rnd(i * 3.3 + 1) * 256, r = .8 + rnd(i * 5.1) * 3.2, v = rnd(i * 7.7); g.fillStyle = v > .55 ? `rgba(224,180,120,${.25 + .3 * rnd(i)})` : `rgba(90,54,24,${.18 + .3 * rnd(i)})`; g.beginPath(); g.ellipse(x, y, r, r * (.6 + rnd(i * 9.1) * .5), rnd(i * 11.3) * PI, 0, TAU); g.fill(); }
  return CORK = cv;
}
/* the cast chips (ep18_title.js): a portrait in a circle, drawn live with the real constructors, guarded one by one */
const CAST = [
  { key: 'straw', bg: '#ffe2cf', ring: '#e8782c', s: .23, expr: 'sour' }, { key: 'mango', bg: '#ffe7c2', ring: '#e8782c', s: .21, expr: 'neutral' }, { key: 'lemon', bg: '#fff3b8', ring: '#e8a82c', s: .23, expr: 'sour' },
  { key: 'chef', bg: '#e1efd2', ring: '#4f8a3a', s: .2, expr: null }, { key: 'tomato', bg: '#fbd8d2', ring: '#c8473a', s: .22, expr: null }, { key: 'onion', bg: '#e6e2fb', ring: '#6d5bd0', s: .22, expr: null },
  { key: 'bind', bg: '#e5e8ec', ring: '#5b6470', s: .26, expr: null }, { key: 'brenda', bg: '#efe0f0', ring: '#8a4f9a', s: .2, expr: null },
];
const CAST_FALLBACK = new Set();
function castCtor(key) {
  const g = window;
  return { straw: () => (g.A11 && g.A11.straw) || (g.A7 && g.A7.straw), lemon: () => g.A7 && g.A7.lemon, mango: () => g.A7 && g.A7.mango, chef: () => g.A19 && g.A19.chef, onion: () => g.A15 && g.A15.onion,
    tomato: () => g.A15 && g.A15.tomato, bind: () => g.A15 && g.A15.binder, brenda: () => g.A13 && g.A13.brenda }[key]();
}
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
      if (p.key === 'tomato' || p.key === 'onion' || p.key === 'chef') o.hold = {};   /* a portrait carries no props: they would cover the small faces */
      o.noLegs = true; o.s = p.s;
      if (p.key === 'bind') { o.x = cx; o.y = cy - 12 * p.s; }
      else { const [fx, fy] = window.H6.faceC(o); o.x = cx - fx; o.y = cy - fy + 3; }
      drawChar(o);
    } catch (e) { if (!CAST_FALLBACK.has(p.key)) { CAST_FALLBACK.add(p.key); console.error('CARDS19 chip ' + p.key + ': ' + e.message); } }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = p.ring; ctx.stroke();
}
function pin(x, y, col, k) {
  if (k <= 0) return; const s = back(k, 2.2);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(5, 8, 13, 8, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fillStyle = ctx.createRadialGradient(-5, -5, 2, 0, 0, 15); ctx.fillStyle.addColorStop(0, mixh(col, '#ffffff', .55)); ctx.fillStyle.addColorStop(1, col); ctx.fill(); outline(3);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-5, -6, 4, 2.6, -.6, 0, TAU); ctx.fill();
  ctx.restore();
}
/* the corkboard and the sheet: frame, cork, the paper with its table (the results typed), the chips, the pins, the stamp */
function board(lt) {
  const ds = lt - E.stamp, k0 = sg(lt, .1, .55), settle = back(k0, 1.4), dip = ds > 0 ? 4 * ringK(ds, .07) * Math.cos(ds * 50) : 0, y0 = lp(-70, 0, settle) + dip;
  if (k0 <= 0) return;
  ctx.save(); ctx.globalAlpha *= sg(k0, 0, .4); ctx.translate(0, y0);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16; rrect(BD.x - 22, BD.y - 22, BD.w + 44, BD.h + 44, 22); ctx.fillStyle = '#5a3a1e'; ctx.fill(); ctx.restore();
  rrect(BD.x - 22, BD.y - 22, BD.w + 44, BD.h + 44, 22); ctx.fillStyle = ctx.createLinearGradient(0, BD.y, 0, BD.y + BD.h); ctx.fillStyle.addColorStop(0, '#7a5230'); ctx.fillStyle.addColorStop(1, '#55361c'); ctx.fill(); outline(4);
  ctx.save(); rrect(BD.x, BD.y, BD.w, BD.h, 8); ctx.clip(); ctx.fillStyle = ctx.createPattern(corkTile(), 'repeat'); ctx.fillRect(BD.x, BD.y, BD.w, BD.h);
  ctx.fillStyle = ctx.createLinearGradient(BD.x, BD.y, BD.x, BD.y + 80); ctx.fillStyle.addColorStop(0, 'rgba(30,14,4,.4)'); ctx.fillStyle.addColorStop(1, 'rgba(30,14,4,0)'); ctx.fillRect(BD.x, BD.y, BD.w, 80); ctx.restore();
  rrect(BD.x, BD.y, BD.w, BD.h, 8); outline(3);
  /* the sheet */
  ctx.save(); ctx.translate(SH.x + SH.w / 2, SH.y + SH.h / 2); ctx.rotate(-.008); ctx.translate(-(SH.x + SH.w / 2), -(SH.y + SH.h / 2));
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 7; rrect(SH.x, SH.y, SH.w, SH.h, 6); ctx.fillStyle = '#faf6ea'; ctx.fill(); ctx.restore();
  UI.container('fp19t.paper', 'sheet', [SH.x, SH.y, SH.x + SH.w, SH.y + SH.h], 14);
  ctx.save(); rrect(SH.x, SH.y, SH.w, SH.h, 6); ctx.clip(); ctx.fillStyle = ctx.createLinearGradient(0, SH.y + SH.h - 110, 0, SH.y + SH.h); ctx.fillStyle.addColorStop(0, 'rgba(120,100,60,0)'); ctx.fillStyle.addColorStop(1, 'rgba(120,100,60,.16)'); ctx.fillRect(SH.x, SH.y + SH.h - 110, SH.w, 110); ctx.restore();
  UI.label('POTLUCK SIGN-UP', 540, SH.y + 66, { font: 'Nunito', weight: 900, size: 56, spacing: 4, fill: '#1d1a22', cid: 'fp19t.paper', maxW: SH.w - 80 });
  UI.label('THANKSGIVING WEEK   UNIT B', 540, SH.y + 122, { font: 'Nunito', weight: 800, size: 30, spacing: 3, fill: '#5a5560', cid: 'fp19t.paper', maxW: SH.w - 80 });
  ctx.fillStyle = 'rgba(40,30,50,.55)'; ctx.fillRect(SH.x + 40, SH.y + 150, SH.w - 80, 3);
  const cols = [{ w: 300, weight: 900, fill: '#2a2630', size: 44 }, { w: 320, weight: 900, align: 'left', size: 44 }];
  const rows = ROWS.map((r, i) => { const t = rowT(i), n = Math.min(r[1].length, Math.ceil(r[1].length * sg(lt, t, t + .36) - 1e-9)); return [r[0], { t: r[1].slice(0, n), fill: '#23408e' }]; });
  const tb = UI.table([TB.x, TB.y, TB.w, TB.rowH * ROWS.length], cols, rows, { rowH: TB.rowH, size: 44, padX: 20, fill: false, stroke: 'rgba(60,45,30,.45)', lw: 3, grid: 'rgba(60,45,30,.35)', vgrid: true, id: 'fp19t.log' });
  if (lt > rowT(0) + .4) { const c = tb.cell(0, 1); UI.label('ELEVEN SIGNED UP', c.x1 - 14, c.cy, { font: 'Nunito', weight: 800, size: 24, spacing: 1.5, fill: '#8a6a3a', align: 'right', hero: false, crop: true, maxW: 220 }); }
  /* who signed up */
  const rb = TB.y + TB.rowH * ROWS.length;
  UI.label('SIGNED UP', 540, rb + 158, { font: 'Nunito', weight: 800, size: 30, spacing: 5, fill: '#5a5560', cid: 'fp19t.paper', maxW: 300 });
  const n = CAST.length, rad = 34, gap = 14, x0 = 540 - (n * 2 * rad + (n - 1) * gap) / 2 + rad, cy = rb + 236;
  CAST.forEach((p, i) => { const k = sg(lt, .35 + i * .07, .6 + i * .07); if (k <= 0) return; const pop = back(k, 2.2), cx = x0 + i * (2 * rad + gap); ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy); ctx.globalAlpha *= sg(k, 0, .4); chip(p, cx, cy, rad, lt); ctx.restore(); });
  /* HAPPY THANKSGIVING lands in the free space under the table */
  if (lt >= E.stamp - .1) {
    const k = sg(lt, E.stamp - .09, E.stamp), settle = ds >= 0 ? 1 + .07 * Math.sin(Math.min(1, ds / .16) * PI) * (1 - Math.min(1, ds / .16)) * 2 : 1, sc = lt < E.stamp ? lp(1.3, 1, eI(k)) : 1 / settle, hero = ds >= .17, cx = 540, cy2 = rb + 72;
    ctx.save(); ctx.globalAlpha *= lt < E.stamp ? sg(k, 0, .5) : 1; ctx.translate(cx, cy2); ctx.scale(sc, sc); ctx.translate(-cx, -cy2);
    UI.stamp('HAPPY THANKSGIVING', cx, cy2, { font: 'Bangers', size: 64, color: '#c2562a', rot: -.1, lw: 8, padX: 34, padY: 22, alpha: .94, hero, crop: !hero, id: 'fp19t.stamp' });
    ctx.restore();
    if (ds >= 0 && ds < .7) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; if (window.V2 && V2.ring) V2.ring(cx, cy2, ds / .7, { r0: 60, r1: 460, lw: 12, color: '255,196,120', alpha: .7, bloom: .4, squash: .5 }); ctx.restore();
      ctx.fillStyle = '#c2562a'; for (let i = 0; i < 14; i++) { const a = rnd(i * 3.1) * TAU, d = 170 + rnd(i * 5.3) * 90, f = sg(ds, 0, .35); if (f <= 0 || f >= 1) continue; ctx.globalAlpha = (1 - f) * .8; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d * eO(f), cy2 + Math.sin(a) * d * eO(f) * .5, 2 + 3 * rnd(i * 7.7), 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
  for (const [px, py, col, d] of [[SH.x + 16, SH.y + 16, '#d93025', 0], [SH.x + SH.w - 16, SH.y + 16, '#f2b705', .06], [SH.x + 16, SH.y + SH.h - 16, '#2b6cff', .12], [SH.x + SH.w - 16, SH.y + SH.h - 16, '#1e8e5a', .18]]) pin(px, py, col, sg(lt, .25 + d, .5 + d));
  ctx.restore();
}
/* the notice pinned under the board: NEXT: EPISODE 20 / THE SNOW DAY, pale blue with paper snowflakes; it lights with the textding */
function notice(lt) {
  const p = sg(lt, E.ding, E.ding + .36), ds = lt - E.ding;
  if (p <= 0) return;
  const pop = back(p, 1.6), cx = NT.x + NT.w / 2, cy = NT.y + NT.h / 2, rest = p >= 1;
  ctx.save(); ctx.globalAlpha *= sg(p, 0, .3); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.rotate(-.012); ctx.translate(-cx, -cy);
  UI.panel([NT.x, NT.y, NT.w, NT.h], { r: 16, fill: ['#e6f3ff', '#bcdcf6'], stroke: '#5b86b0', lw: 4, shadow: 24, id: 'fp19t.notice' });
  ctx.save(); ctx.globalAlpha *= .35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const [sx, sy, r] of [[NT.x + 44, NT.y + 46, 26], [NT.x + NT.w - 46, NT.y + NT.h - 46, 30], [NT.x + NT.w - 70, NT.y + 40, 16]]) for (let i = 0; i < 6; i++) { const a = i * PI / 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * r * .6 - Math.sin(a) * r * .22, sy + Math.sin(a) * r * .6 + Math.cos(a) * r * .22); ctx.lineTo(sx + Math.cos(a) * r * .6 + Math.sin(a) * r * .22, sy + Math.sin(a) * r * .6 - Math.cos(a) * r * .22); ctx.stroke(); }
  ctx.restore();
  UI.label('NEXT: EPISODE 20', cx, NT.y + 44, { font: 'Nunito', weight: 900, size: 36, spacing: 6, fill: '#27527e', cid: 'fp19t.notice', hero: rest, crop: !rest, maxW: NT.w - 80 });
  bevelText(TEASER20, cx, NT.y + 120, 92, { face: [[0, '#ffffff'], [.5, '#e4f4ff'], [1, '#9ccdf2']], ext: ['#2a5d9a', '#0c2548'], rim: '#1f4f86', extr: .35, lwK: .12, hero: rest, shine: ds > .2 ? eIO(sg(ds, .2, 1.0)) : -1, shineA: .8, grp: 'bv:teaser', alpha: 1 });
  ctx.fillStyle = '#2b6cff'; ctx.beginPath(); ctx.arc(cx, NT.y + 10, 13, 0, TAU); ctx.fill(); outline(3); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(cx - 4, NT.y + 6, 4, 0, TAU); ctx.fill();   /* the pushpin */
  ctx.restore();
  if (ds > 0 && ds < 1.5) { ctx.save(); ctx.globalCompositeOperation = 'screen'; for (const [dx, dy, r, d] of [[-NT.w / 2 + 20, -NT.h / 2 + 10, 30, 0], [NT.w / 2 - 10, -NT.h / 2 + 30, 26, .15], [-NT.w / 2 + 160, NT.h / 2 - 6, 24, .3], [NT.w / 2 - 120, NT.h / 2 - 12, 28, .22]]) { const k = sg(ds, d, d + .5); star(cx + dx, cy + dy, r * Math.sin(PI * k), 1, k * .8); } ctx.restore(); }
}
/* snow in the lower part of the frame, light only (screen blend): it begins at the ding */
function snow(lt) {
  const ds = lt - E.ding; if (ds < 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 46; i++) {
    const born = rnd(i * 2.9) * 1.6, a = sg(ds, born, born + .6) * .5; if (a <= .01) continue;
    const sp = 42 + 38 * rnd(i * 4.1), x = ((rnd(i * 1.3) * 1160 - 40 + 34 * Math.sin(ds * .8 + i)) % 1160 + 1160) % 1160 - 40, y = 1460 + (((ds - born) * sp + rnd(i * 6.7) * 460) % 470), r = 2 + 3.2 * rnd(i * 8.3);
    ctx.fillStyle = `rgba(235,246,255,${a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function endDraw(lt) {
  const Fn = F(), FXn = FX();
  wallDraw();
  if (FXn) FXn.cone(ctx, { x: 540, y: -40, ang: PI / 2, spread: 1.4, len: 1500, color: '#ffe3b0', alpha: .15, soft: .9 });
  /* the logo and the thanks above the board */
  const k1 = sg(lt, .12, .45), lg = sg(lt, .2, .6);
  if (k1 > 0) UI.label('THANKS FOR WATCHING', 540, 214, { font: 'Nunito', weight: 900, size: 32, spacing: 7, fill: CREAM, reveal: k1, hero: k1 >= 1, crop: k1 < 1, maxW: 760 });
  if (lg > 0) { const cy = 306, sc = lp(1.15, 1, back(lg, 1.6)); ctx.save(); ctx.translate(540, cy); ctx.scale(sc, sc); ctx.translate(-540, -cy); bevelText('SHIFT HAPPENS', 540, cy, 92, { alpha: sg(lg, 0, .35), hero: lg >= 1, extr: .35, lwK: .13, shine: lt > E.ding ? eIO(sg(lt - E.ding, .1, .9)) : -1, shineA: .7, grp: 'bv:end-logo' }); ctx.restore(); }
  board(lt);
  counter(COUNTER_E.y0, COUNTER_E.y1);
  notice(lt);
  /* the mascot: one small beige turkey on its platter in the corner of the counter, a thread of steam, a slow breath of light on its glaze */
  if (Fn && Fn.dish) Fn.dish(ctx, 'turkeyMold', { x: 896, y: 1832, s: .66, steam: .45, shine: .55 + .15 * Math.sin(lt * 1.3), t: lt, seed: 4 });
  snow(lt);
  if (window.V2 && V2.dust) V2.dust(60, 300, 1020, 1800, lt, { n: 36, seed: 11, size: 3, alpha: .12, speed: 9 });
}
const END = {
  noChyron: true, noScrim: true,
  shot() { return 'sheet'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .022 * eIO(sg(lt, 0, 7.5)));
    CAM.shake = 5 * (lt >= E.stamp ? ringK(lt - E.stamp, .05) : 0);
  },
  draw: endDraw,
  fx(lt) {
    const fin = lt < .1 ? 1 - lt / .1 : 0, fout = sg(lt, 7.2, 7.5), st = lt >= E.stamp ? ringK(lt - E.stamp, .1) : 0, dd = lt >= E.ding ? ringK(lt - E.ding, .5) : 0;
    return { bloom: .42 + .3 * st + .2 * dd, vignette: .42, grain: .05, contrast: .1, sat: .05, aberr: 2.5 * st, tint: [['#3a1c08', .08, 'soft-light']], fade: Math.max(fin, fout), fadeColor: '8,4,2' };
  },
  blur(lt) { return (lt > E.stamp - .1 && lt < E.stamp + .12) ? 5 : (lt > .1 && lt < .6) ? 3 : 1; },
  over() {},
  label: () => 'THANKS FOR WATCHING',
};
window.__EP19_SCENES.end = END;
/* the pieces a later card can reuse (as FP18A does for Episode 18) */
window.FP19A = { TEASER20, bevelText, star, meas, vgrad, glowAt, tileWall, counter, gingham, CREAM, INK, GOLD };
})();
