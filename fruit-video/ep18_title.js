'use strict';
/* SHIFT HAPPENS, Episode 18: The Fire Drill. Scene module FX-18 cards: `title` (6.8 s) and `end` (7.5 s), registered on window.__EP18_SCENES. Prefix for anything new: fp18t_. Every string goes through the UI kit, live
 * each frame (no text in caches). The lettering recipe follows ep15_title.js / ep17_title.js (copied); the idea of each card is its own. The light is FX18 (ep18_fx.js), guarded at draw time.
 *
 * TITLE (noChyron, noScrim): a painted hospital-green corridor wall, close and dim. Above, a green EXIT sign lettered SHIFT HAPPENS with a running strawberry (the sign flickers on at .3 s and buzzes); below it a red
 * pull station (FIRE, the lever PULL DOWN) and a laminated card taped beside it (EPISODE 18 / THE FIRE DRILL). A strawberry glove reaches in from the right and pulls the lever. Cues (scene-local s, from
 * python3 /tmp/shift_tools/cues.py 18 title): theme15 .2 | pullclick 2.4 | horn3 2.5 | hornstop 5.45 | textding 5.6, each snapped to the nearest video frame.
 *   0.00-0.20  fade up from black.   0.30-0.70  the sign stutters on (a tube starting), then holds, buzzing (a tiny flicker, a dip now and then).   0.60-0.95  EPISODE 18 is printed on the card (it is dim until the ding).
 *   0.90-2.20  the glove slides in from the right and hovers on the lever; 2.10-2.27 it lifts (anticipation) and grips; 2.27-2.40 the pull: the lever drops 36 (x scale) px and, at the click (2.40), locks with a
 *              small overshoot, a puff of sparks, a jolt of the camera.   2.40-3.2 the glove lets go and leaves.
 *   2.50 / 3.50 / 4.50  the horn pulses (FX18.hornOn / strobe: .5 s on, .5 s off, three times): the strobe lamp fires, the wall flashes (an additive wash, at most .26 alpha), a wide cone of white light
 *              crosses the wall, the sign's glow swells, the letters drop 3 px and spring back, rings leave the horn; the whole time an emergency red tint and a darker vignette, dust hangs in the light.
 *   5.45  hornstop: silence; the red tint and the vignette lift over .4 s, the sign stays lit.   5.60  textding: THE FIRE DRILL lights up on the card (a warm glow, a shine across the laminate, three stars).
 *   5.60-6.60  a held card, a slow push-in (2 percent over the whole scene); 6.62-6.8 a dip to black into the station.
 * END: see the second half of this file. */
(() => {
/* the title of the next episode, shown in the end card's teaser (the lead confirms it: change this one constant) */
const TEASER19 = 'THE POTLUCK';
if (!window.TIMELINE_EP18 || !window.UI || !window.H6) return;
const { zoomTo } = window.H6;
window.__EP18_SCENES = window.__EP18_SCENES || {};
const TLX = window.TIMELINE_EP18;

// ------------------------------------------------------------------ palette and small maths
const YEL = '#ffe135', INK = '#10140f', RED = '#d93025', CREAM = '#f6efd2', PAPER = '#f4efe0', EXITG = '#1bc45f';
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
const rrect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
const OUTL = 'rgba(20,14,26,.86)';
const outline = (lw = 3.5, col = OUTL) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); };
const FX = () => (typeof FX18 !== 'undefined' && FX18) || null;
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
  const F = FX();
  if (F && typeof F.glow === 'function') F.glow(ctx, { x, y, r, color, alpha: a, core: core || 0 });
  else if (window.V2) { const n = parseInt(color.slice(1), 16); V2.glow(x, y, r, `${n >> 16},${(n >> 8) & 255},${n & 255}`, Math.min(1, a), 'screen', .3); }
}

// ------------------------------------------------------------------ the wall: painted hospital green, a handrail, a vinyl base, a dark polished floor (shared by the title and the end card)
let PAINT = null;
function paintTile() {
  if (PAINT) return PAINT;
  const cv = document.createElement('canvas'); cv.width = cv.height = 192; cv.__txOK = true;
  const g = cv.getContext('2d'), id = g.createImageData(192, 192), d = id.data;
  for (let i = 0; i < 192 * 192; i++) { const x = i % 192, y = (i / 192) | 0, v = 128 + (rnd(i * .37) - .5) * 70 + (rnd(x * 1.7) - .5) * 26; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0); return PAINT = cv;
}
function wall(o = {}) {
  const top = o.top ?? 0, rail = o.rail ?? 1470, base = o.base ?? 1790, floor = o.floor ?? 1850;
  ctx.save();
  let g = ctx.createLinearGradient(0, top, 0, rail);
  g.addColorStop(0, '#3a5d4c'); g.addColorStop(.45, '#527a66'); g.addColorStop(1, '#496f5c');
  ctx.fillStyle = g; ctx.fillRect(-120, top, 1320, rail - top);
  g = ctx.createLinearGradient(0, rail, 0, base);                                   /* the dado: a deeper green below the rail */
  g.addColorStop(0, '#3a5d4c'); g.addColorStop(1, '#314f42'); ctx.fillStyle = g; ctx.fillRect(-120, rail, 1320, base - rail);
  ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .55; ctx.fillStyle = ctx.createPattern(paintTile(), 'repeat'); ctx.fillRect(-120, top, 1320, base - top); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  /* the handrail with its brackets */
  for (const bx of [140, 540, 940]) { ctx.fillStyle = '#9aa29c'; rrect(bx - 20, rail + 14, 40, 64, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(bx - 16, rail + 18, 6, 56); }
  g = ctx.createLinearGradient(0, rail - 8, 0, rail + 46); g.addColorStop(0, '#e8d6b4'); g.addColorStop(.35, '#cdb48c'); g.addColorStop(1, '#8c7654');
  ctx.fillStyle = g; rrect(-120, rail - 8, 1320, 52, 24); ctx.fill(); ctx.strokeStyle = 'rgba(20,14,10,.5)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-120, rail + 46, 1320, 18);                                       /* the rail's shadow on the dado */
  /* the vinyl base and the floor */
  ctx.fillStyle = '#2a3832'; ctx.fillRect(-120, base, 1320, floor - base); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(-120, base, 1320, 6);
  g = ctx.createLinearGradient(0, floor, 0, 2040); g.addColorStop(0, '#1c2622'); g.addColorStop(1, '#2b3833'); ctx.fillStyle = g; ctx.fillRect(-120, floor, 1320, 200);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-120, floor, 1320, 14);
  /* the shadow of the ceiling on the wall */
  if (top < 100) { g = ctx.createLinearGradient(0, top, 0, top + 190); g.addColorStop(0, 'rgba(8,22,16,.55)'); g.addColorStop(1, 'rgba(8,22,16,0)'); ctx.fillStyle = g; ctx.fillRect(-120, top, 1320, 190); }
  ctx.restore();
}
// ------------------------------------------------------------------ TITLE: layout and cues
const SN = snapOf('title');
const CUE = { pull: SN(2.4), horn: SN(2.5), stop: SN(5.45), ding: SN(5.6) };
const T = { SIGN: { cx: 540, cy: 650, w: 940, h: 312 }, ST: { x: 772, y: 1250, s: 1.6 }, CARD: { cx: 300, cy: 1200, w: 400, h: 214 }, STROBE: { x: 930, y: 310, s: .9 }, RAIL: 1560 };
const hornK = lt => { const F = FX(); return F ? F.hornK(lt, CUE.horn, CUE.stop) : -1; };
const strobeAt = lt => { const F = FX(); return F ? F.strobe(hornK(lt)) : 0; };
/* the horn envelope: 0 before, 1 while it sounds, lifting over .4 s after the stop (the emergency tint and the vignette follow it) */
const hornEnv = lt => sg(lt, CUE.horn - .02, CUE.horn + .2) * (1 - sg(lt, CUE.stop, CUE.stop + .4));

/* the sign's brightness 0..1: dark, a tube that stutters on at .3 s, then a steady buzz with a dip now and then */
const STUTTER = [[0, .07, 1], [.07, .13, 0], [.13, .17, .85], [.17, .3, 0], [.3, .36, .75], [.36, .41, 0], [.41, .44, .6]];
function signBr(lt) {
  if (lt < .3) return 0;
  const u = lt - .3;
  if (u < .44) { for (const [a, b, v] of STUTTER) if (u >= a && u < b) return v; return 0; }
  const buzz = 1 - .035 * rnd(Math.floor(lt * 30) * 1.31 + 4), dip = ((lt * .87) % 1) < .05 ? .72 : 1;
  return lp(.8, 1, sg(u, .44, 1.2)) * buzz * dip;
}
/* the running strawberry of the exit sign (P18.exitSign has the same figure for the in-world signs); br = the sign's brightness */
function runner(br) {
  const ink = mixh('#6fa488', '#ffffff', br);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(-8, 22); ctx.lineTo(-24, 40); ctx.lineTo(-40, 38); ctx.moveTo(8, 24); ctx.lineTo(26, 36); ctx.lineTo(24, 52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18, -4); ctx.lineTo(-38, 6); ctx.moveTo(16, -6); ctx.lineTo(34, -18); ctx.lineTo(46, -10); ctx.stroke();
  ctx.save(); ctx.rotate(.2);
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.bezierCurveTo(26, -34, 32, -4, 18, 22); ctx.bezierCurveTo(10, 36, -10, 36, -18, 22); ctx.bezierCurveTo(-32, -4, -26, -34, 0, -34); ctx.closePath();
  ctx.fillStyle = mixh('#5b7a68', '#ff4a5a', br); ctx.fill(); ctx.strokeStyle = mixh('#2d4a39', '#a5122a', br); ctx.lineWidth = 3.4; ctx.stroke();
  ctx.fillStyle = mixh('#8aa493', '#ffe9a8', br); for (const [sx, sy] of [[-10, -14], [8, -16], [-2, -2], [14, 0], [-14, 6], [4, 12], [-4, 22]]) { ctx.beginPath(); ctx.ellipse(sx, sy, 2.2, 3.2, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = mixh('#2a5a3a', '#4adf74', br); ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(-14, -46); ctx.lineTo(-4, -36); ctx.lineTo(0, -52); ctx.lineTo(5, -37); ctx.lineTo(15, -47); ctx.lineTo(10, -33); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* the size at which SHIFT HAPPENS fills `maxW` px of ink (one size for every layer, so the layers stay together) */
let SIGN_SIZE = 0;
function signSize(maxW) { if (SIGN_SIZE) return SIGN_SIZE; const m = meas('SHIFT HAPPENS', 100, 'Bangers', 400, 2); return SIGN_SIZE = Math.min(126, maxW / (m.r - m.l) * 100); }
/* the lettering of the sign: a dark green extrusion and outline, a bright white-mint face, a gloss. dy = the drop on a horn pulse. */
function signText(cx, cy, br, lit, size) {
  const sp = 2, font = 'Bangers', cap = UI.metrics(font).cap * size, lw = size * .1, str = 'SHIFT HAPPENS', common = { font, size, spacing: sp, grp: 'fp18t.sign', tilt: .3, hero: false, crop: true, cid: 'fp18t.signface' };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv }, extra));
  L(size * .02, size * .1, 'rgba(0,22,10,.55)', 'rgba(0,22,10,.55)', lw * 1.3, { shadow: size * .08 });
  const n = 5; for (let i = n; i >= 1; i--) { const c = mixh('#0a5a2c', '#03230f', 1 - i / n * .5); L(i * .2, i * .9, c, c, lw); }
  L(0, 0, '#05301a', '#05301a', lw);
  const face = ctx.createLinearGradient(0, cy - cap * 1.03, 0, cy + cap * .04); face.addColorStop(0, mixh('#7fa890', '#ffffff', br)); face.addColorStop(.5, mixh('#6b957d', '#effff5', br)); face.addColorStop(1, mixh('#5a8a70', '#b6f2cf', br));
  const box = UI.label(str, cx, cy, Object.assign({}, common, { fill: face, lw: 0, hero: lit, crop: !lit }));
  L(0, 0, vgrad(cap, [[0, 'rgba(255,255,255,.5)'], [.45, 'rgba(255,255,255,.05)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), undefined, 0, {});
  return box;
}
/* the exit sign: halo and the wash it throws on the wall, the dark housing, the lit green face with its running strawberry, the lettering */
function exitSign(lt, br) {
  const S = T.SIGN, w = S.w, h = S.h, F = FX(), pulse = strobeAt(lt), dy = 3 * pulse, lit = br > .55;
  ctx.save(); ctx.translate(S.cx, S.cy);
  if (br > .01) {
    glowAt(0, 0, 700, '#38ff7a', .27 * br + .16 * pulse * br, 0);
    if (F) F.cone(ctx, { x: 0, y: h * .42, ang: PI / 2, spread: 1.9, len: 880, color: '#2cff7a', alpha: .09 * br + .06 * pulse, soft: .9 });
  }
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
  rrect(-w / 2, -h / 2, w, h, 24); ctx.fillStyle = ctx.createLinearGradient(0, -h / 2, 0, h / 2); ctx.fillStyle.addColorStop(0, '#4d545c'); ctx.fillStyle.addColorStop(1, '#23272d'); ctx.fill(); ctx.restore();
  rrect(-w / 2, -h / 2, w, h, 24); outline(4.5);
  const fx0 = -w / 2 + 16, fy0 = -h / 2 + 16, fw = w - 32, fh = h - 32;
  rrect(fx0, fy0, fw, fh, 14);
  const g = ctx.createLinearGradient(0, fy0, 0, fy0 + fh); g.addColorStop(0, mixh('#0b3a20', '#35e57e', br)); g.addColorStop(.55, mixh('#09301a', '#19b95e', br)); g.addColorStop(1, mixh('#072814', '#0f9a4a', br));
  ctx.fillStyle = g; ctx.fill();
  UI.container('fp18t.signface', 'sign', [fx0, fy0, fx0 + fw, fy0 + fh], 8);   /* local coordinates: the kit reads the transform in force */
  ctx.save(); rrect(fx0, fy0, fw, fh, 14); ctx.clip(); ctx.fillStyle = `rgba(255,255,255,${.16 * br})`; ctx.fillRect(fx0, fy0, fw, fh * .38); ctx.restore();
  rrect(fx0 + 4, fy0 + 4, fw - 8, fh - 8, 11); ctx.strokeStyle = `rgba(255,255,255,${.5 * br + .1})`; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.translate(-w / 2 + 140, 6); ctx.scale(h / 130 * .98, h / 130 * .98); runner(br); ctx.restore();
  const size = signSize(640);
  signText(100, 8 + dy, br, lit, size);
  ctx.restore();
  return { x0: S.cx - w / 2, y0: S.cy - h / 2, x1: S.cx + w / 2, y1: S.cy + h / 2 };
}

// ------------------------------------------------------------------ the pull station (P18.pullStation's design, copied so the lever can overshoot), the strobe unit, the glove
const ST_W = 200, ST_H = 270;
function lab(str, cx, cy, o) { return UI.label(str, cx, cy, Object.assign({ hero: false, crop: true }, o)); }
/* drop = lever travel in station units (36 = locked); jolt = a small downward shake of the whole box at the click */
function pullStation(lt, drop, jolt) {
  const S = T.ST, W0 = ST_W, H0 = ST_H, pulled = cl(drop / 36);
  ctx.save(); ctx.translate(S.x, S.y + jolt); ctx.scale(S.s, S.s);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
  rrect(-W0 / 2 - 6, -H0 / 2 - 6, W0 + 12, H0 + 12, 20); ctx.fillStyle = '#7b0f14'; ctx.fill(); ctx.restore();
  rrect(-W0 / 2, -H0 / 2, W0, H0, 16); ctx.fillStyle = ctx.createLinearGradient(-W0 / 2, -H0 / 2, W0 / 2, H0 / 2); for (const [s, c] of [[0, '#f0443f'], [.45, '#d42228'], [1, '#a5131a']]) ctx.fillStyle.addColorStop(s, c); ctx.fill();
  ctx.save(); rrect(-W0 / 2, -H0 / 2, W0, H0, 16); ctx.clip();
  for (let i = 0; i < 150; i++) { const px = (rnd(i * 3.1 + 1) - .5) * W0, py = (rnd(i * 5.3 + 2) - .5) * H0, r = 1.6 + rnd(i * 7.7 + 3) * 2.2; ctx.fillStyle = i % 2 ? 'rgba(255,170,150,.16)' : 'rgba(70,0,6,.2)'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(-W0 / 2, -H0 / 2, 14, H0); ctx.fillStyle = 'rgba(40,0,6,.22)'; ctx.fillRect(-W0 / 2, H0 / 2 - 18, W0, 18);
  ctx.restore();
  rrect(-W0 / 2, -H0 / 2, W0, H0, 16); outline(3.5);
  rrect(-W0 / 2 + 7, -H0 / 2 + 7, W0 - 14, H0 - 14, 11); ctx.strokeStyle = 'rgba(255,200,190,.28)'; ctx.lineWidth = 2; ctx.stroke();
  lab('FIRE', 1.5, -H0 / 2 + 50.5, { size: 62, weight: 900, fill: 'rgba(70,0,8,.55)', spacing: 7, grp: 'fp18t.psfire', maxW: W0 - 40 });
  lab('FIRE', 0, -H0 / 2 + 48, { size: 62, weight: 900, fill: '#fff6f0', spacing: 7, grp: 'fp18t.psfire', maxW: W0 - 40 });
  rrect(-76, 6, 152, 124, 12); ctx.fillStyle = `rgba(40,0,8,${.5 + .35 * pulled})`; ctx.fill();
  ctx.beginPath(); ctx.arc(W0 / 2 - 28, -H0 / 2 + 92, 11, 0, TAU); ctx.fillStyle = ctx.createLinearGradient(0, -10, 0, 10); ctx.fillStyle.addColorStop(0, '#e6e9ee'); ctx.fillStyle.addColorStop(1, '#8a919c'); ctx.fill(); outline(2.4);
  ctx.fillStyle = '#2a2d36'; ctx.fillRect(W0 / 2 - 30, -H0 / 2 + 85, 4, 14);
  const L = { x: -70, y: 12 + drop, w: 140, h: 112 };
  ctx.save(); ctx.shadowColor = 'rgba(40,0,6,.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  rrect(L.x, L.y, L.w, L.h, 12); ctx.fillStyle = ctx.createLinearGradient(0, L.y, 0, L.y + L.h); ctx.fillStyle.addColorStop(0, '#e8322f'); ctx.fillStyle.addColorStop(1, '#bd1a21'); ctx.fill(); ctx.restore();
  rrect(L.x, L.y, L.w, L.h, 12); outline(3);
  ctx.fillStyle = 'rgba(70,0,8,.5)'; for (let i = 0; i < 3; i++) ctx.fillRect(L.x + 22, L.y + L.h - 30 + i * 8, L.w - 44, 3.4);
  lab('PULL', L.x + L.w / 2, L.y + 26, { size: 34, weight: 900, fill: '#fff6f0', spacing: 3, maxW: L.w - 24 });
  lab('DOWN', L.x + L.w / 2, L.y + 62, { size: 34, weight: 900, fill: '#fff6f0', spacing: 3, maxW: L.w - 24 });
  ctx.fillStyle = '#fff6f0'; ctx.beginPath(); ctx.moveTo(L.x + L.w / 2 - 12, L.y + 78); ctx.lineTo(L.x + L.w / 2 + 12, L.y + 78); ctx.lineTo(L.x + L.w / 2, L.y + 92); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* the lever's travel (station units): still until 2.27, an accelerating yank to 36 exactly on the click, a small overshoot that springs back */
const PULL_A = CUE.pull - .13;
function leverDrop(lt) {
  if (lt < PULL_A) return 0;
  if (lt < CUE.pull) { const k = sg(lt, PULL_A, CUE.pull); return 36 * (k * k * .82 + k * .18); }
  const u = (lt - CUE.pull) / .2;
  return u >= 1 ? 36 : 36 + 5.5 * Math.sin(u * PI) * (1 - u) * 1.6;
}
/* the strobe unit on the wall: P18.hornStrobe when it is loaded (its lens is FX18.lamp), else a plain red box with the lamp */
function strobeUnit(lt) {
  const S = T.STROBE, F = FX(), pulse = strobeAt(lt);
  if (window.P18 && typeof P18.hornStrobe === 'function') { P18.hornStrobe(ctx, { x: S.x, y: S.y, s: S.s, level: pulse }); return; }
  ctx.save(); ctx.translate(S.x, S.y); ctx.scale(S.s, S.s); rrect(-70, -85, 140, 170, 12); ctx.fillStyle = '#d02229'; ctx.fill(); outline(3.4);
  if (F) F.lamp(ctx, { x: 0, y: 40, level: pulse, r: 30 }); ctx.restore();
}
/* the strawberry glove: a white mitt with a red cuff (seeds, a leaf collar) on a dark sleeve. Local frame: the wrist at the origin, the hand points to -x, the arm leaves to +x. grip 0 open .. 1 closed. */
function glove(x, y, ang, grip) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTL; ctx.lineWidth = 46; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(900, 0); ctx.stroke();                               /* the sleeve */
  ctx.strokeStyle = '#322c4a'; ctx.lineWidth = 38; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(900, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(40, -12); ctx.lineTo(900, -12); ctx.stroke();
  /* the cuff: a red band with seeds and a calyx of small green leaves */
  rrect(-4, -34, 46, 68, 12); ctx.fillStyle = ctx.createLinearGradient(0, -34, 0, 34); ctx.fillStyle.addColorStop(0, '#f0524e'); ctx.fillStyle.addColorStop(1, '#b8202a'); ctx.fill(); outline(3.5);
  ctx.fillStyle = '#ffe9a8'; for (const [sx, sy] of [[10, -18], [24, -12], [12, -2], [28, 4], [14, 14], [30, 20], [8, 24]]) { ctx.beginPath(); ctx.ellipse(sx + 2, sy, 2, 3.2, .3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#3fae5a'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-4 + i * 17, s * 33); ctx.lineTo(4 + i * 17, s * 33); ctx.lineTo(1 + i * 17, s * 50); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#17512a'; ctx.lineWidth = 2; ctx.stroke(); }
  /* the mitt: palm, three fingers (they curl with grip) and the thumb */
  const fl = lp(46, 20, grip), fy = [-24, 0, 24];
  ctx.fillStyle = '#f7f3ec';
  for (let i = 0; i < 3; i++) { rrect(-70 - fl, fy[i] - 11.5, fl + 36, 23, 11.5); ctx.fill(); outline(3); }
  rrect(-84, -37, 104, 74, 28); ctx.fillStyle = ctx.createLinearGradient(0, -37, 0, 37); ctx.fillStyle.addColorStop(0, '#fffdf8'); ctx.fillStyle.addColorStop(.7, '#f1ece3'); ctx.fillStyle.addColorStop(1, '#d4cdc1'); ctx.fill(); outline(3.5);
  ctx.save(); ctx.translate(-30, -34); ctx.rotate(lp(-.55, .25, grip)); rrect(-38, -26, 54, 24, 12); ctx.fillStyle = '#f7f3ec'; ctx.fill(); outline(3); ctx.restore();
  ctx.strokeStyle = 'rgba(40,30,20,.25)'; ctx.lineWidth = 2.4; for (const yy of [-12, 12]) { ctx.beginPath(); ctx.moveTo(-70, yy); ctx.lineTo(-46, yy); ctx.stroke(); }
  ctx.restore();
}
/* the glove's wrist position and grip: off the right edge, in, hovering, the wind-up, the grab, the pull (it rides the lever), the let-go and the exit */
function handState(lt) {
  const S = T.ST, L0 = { x: S.x + 112 + 84, y: S.y + (12 + 56 + 30) * S.s };                 /* the wrist when it holds the lever's right edge: x just beyond the lever, y on the grip ridges */
  const pull = leverDrop(lt) * S.s;
  let dx = 700, dy = -40, grip = 0, vis = lt > .8;
  if (lt < 1.9) { const k = eO(sg(lt, .9, 1.9)); dx = lp(700, 76, k); dy = -44 + 7 * Math.sin(lt * 4.4) * k; }
  else if (lt < 2.02) { dx = 76; dy = -44 + 7 * Math.sin(lt * 4.4); }
  else if (lt < 2.15) { const k = eIO(sg(lt, 2.02, 2.15)); dx = lp(76, 104, k); dy = lp(-44 + 7 * Math.sin(2.02 * 4.4), -80, k); }
  else if (lt < PULL_A) { const k = eI(sg(lt, 2.15, PULL_A)); dx = lp(104, 0, k); dy = lp(-80, -4, k); grip = sg(lt, 2.15, PULL_A); }
  else if (lt < CUE.pull + .16) { dx = 0; dy = -4 + pull; grip = 1; }
  else if (lt < CUE.pull + .3) { const k = sg(lt, CUE.pull + .16, CUE.pull + .3); dx = lp(0, 30, eO(k)); dy = -4 + 36 * S.s + lp(0, 10, k); grip = 1 - k; }
  else { const k = eI(sg(lt, CUE.pull + .3, CUE.pull + .95)); dx = lp(30, 760, k); dy = -4 + 36 * S.s + 10 - 40 * k; grip = 0; vis = lt < CUE.pull + .96; }
  return { x: L0.x + dx, y: L0.y + dy, grip, vis, ang: .2 };
}
// ------------------------------------------------------------------ the laminated card taped beside the pull station: EPISODE 18 / THE FIRE DRILL (dim until the ding, then it lights)
function card(lt) {
  const C = T.CARD, ds = lt - CUE.ding, lit = sg(lt, CUE.ding, CUE.ding + .22), hero = lit >= 1, pop = ds > 0 ? 1 + .06 * Math.sin(Math.min(1, ds / .2) * PI) : 1, epk = sg(lt, .62, .95);
  ctx.save(); ctx.translate(C.cx, C.cy); ctx.rotate(-.035); ctx.scale(pop, pop);
  const bx = -C.w / 2, by = -C.h / 2;
  UI.panel([bx, by, C.w, C.h], { r: 14, fill: [PAPER, '#e4dcc6'], stroke: '#a89f86', lw: 4, shadow: 20, id: 'fp18t.card' });
  ctx.fillStyle = '#c23a2b'; rrect(bx + 14, by + 14, C.w - 28, 7, 3.5); ctx.fill();                                   /* a red rule along the top */
  const a = sg(epk, 0, 1);
  if (a > 0) UI.label('EPISODE 18', 0, -36, { font: 'Nunito', weight: 900, size: 40, spacing: 8, fill: '#c23a2b', reveal: a, cid: 'fp18t.card', hero: hero && a >= 1, crop: !(hero && a >= 1), maxW: C.w - 56 });
  UI.label('THE FIRE DRILL', 0, 30, { font: 'Bangers', size: 70, spacing: 2, fill: INK, cid: 'fp18t.card', hero, crop: !hero, maxW: C.w - 52 });
  ctx.save(); rrect(bx, by, C.w, C.h, 14); ctx.clip();
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = ctx.createLinearGradient(bx, by, bx + C.w * .6, by + C.h); ctx.fillStyle.addColorStop(0, 'rgba(255,255,255,0)'); ctx.fillStyle.addColorStop(.35, 'rgba(255,255,255,.28)'); ctx.fillStyle.addColorStop(.5, 'rgba(255,255,255,.04)'); ctx.fillStyle.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.moveTo(bx + 30, by); ctx.lineTo(bx + 150, by); ctx.lineTo(bx + 70, by + C.h); ctx.lineTo(bx - 50, by + C.h); ctx.closePath(); ctx.fill();   /* the laminate's gloss band */
  if (ds > .05 && ds < 1.0) { const x = lp(bx - 120, bx + C.w + 120, eIO(sg(ds, .05, .95))), g = ctx.createLinearGradient(x - 70, by, x + 70, by + C.h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(bx, by, C.w, C.h); }
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .6 * (1 - lit); ctx.fillStyle = '#52665c'; ctx.fillRect(bx, by, C.w, C.h);   /* the card is in the dark until the ding */
  ctx.restore();
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * (C.w / 2 - 34), by + 6); ctx.rotate(s * .32); ctx.fillStyle = 'rgba(236,226,168,.78)'; ctx.fillRect(-40, -13, 80, 28); ctx.strokeStyle = 'rgba(150,140,90,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(-40, -13, 80, 28); ctx.restore(); }
  ctx.restore();
  if (ds > 0 && ds < 1.4) {                                                                                         /* the light that comes on over the card, and three stars */
    const F = FX(), f = ringK(ds, .5);
    glowAt(C.cx, C.cy, 330, '#ffe3a0', .5 * f, .2);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [dx, dy, r, d] of [[-C.w / 2 - 16, -C.h / 2 + 8, 30, 0], [C.w / 2 + 6, -C.h / 2 - 22, 26, .12], [C.w / 2 - 40, C.h / 2 + 22, 24, .24]]) { const k = sg(ds, d, d + .5); star(C.cx + dx, C.cy + dy, r * Math.sin(PI * k), 1, k * .8); }
    ctx.restore();
    if (F && ds < .3) F.cone(ctx, { x: C.cx + 120, y: C.cy - 420, ang: PI / 2 + .12, spread: .55, len: 640, color: '#fff0c8', alpha: .3 * (1 - ds / .3) });
  }
}

// ------------------------------------------------------------------ the title scene
function titleDraw(lt) {
  const F = FX(), k = hornK(lt), pulse = F ? F.strobe(k) : 0, br = signBr(lt), env = hornEnv(lt), S = T.ST, drop = leverDrop(lt);
  wall({ top: -120, rail: T.RAIL, base: 1850, floor: 1900 });
  ctx.save(); ctx.globalAlpha = .55 + .45 * br; if (br < .02) { ctx.fillStyle = 'rgba(0,10,6,.18)'; ctx.fillRect(-100, -100, 1300, 1700); } ctx.restore();
  strobeUnit(lt);
  exitSign(lt, br);
  const jolt = lt >= CUE.pull ? 3.2 * ringK(lt - CUE.pull, .07) * Math.cos((lt - CUE.pull) * 60) : 0;
  pullStation(lt, drop, jolt);
  card(lt);
  const h = handState(lt);
  if (h.vis) glove(h.x, h.y + jolt, h.ang, h.grip);
  /* the click: a few sparks off the lock and a small ring where the lever stops */
  const lx = S.x + 56 * S.s, ly = S.y + (12 + 36 + 112) * S.s;
  if (F && lt >= CUE.pull && lt < CUE.pull + .4) { F.sparks(ctx, { x: lx, y: ly, t: lt, t0: CUE.pull, count: 10, speed: 360, life: .32, gravity: 1100, seed: 3, color: '#ffd070' }); }
  /* the light of the horn: a wide cone of white across the wall, a glow at the unit, rings of sound */
  if (F && pulse > .01) {
    const U = T.STROBE;
    F.cone(ctx, { x: U.x, y: U.y + 30, ang: PI * .64, spread: 1.7, len: 1600, color: '#fff2dc', alpha: .2 * pulse, soft: .8 });
    glowAt(U.x, U.y + 30, 300, '#fff2dc', .42 * pulse, .5);
  }
  if (window.V2 && V2.ring && k >= 0) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) { const age = lt - (CUE.horn + i); if (age > 0 && age < .9) V2.ring(T.STROBE.x, T.STROBE.y + 30, age / .9, { r0: 60, r1: 460, lw: 9, color: '255,236,214', alpha: .32, bloom: 0 }); }
    ctx.restore();
  }
  /* dust hanging in the light: faint all the time, bright on the flashes */
  if (window.V2 && V2.dust) V2.dust(40, 120, 1040, 1500, lt, { n: 64, seed: 5, size: 3.4, alpha: .1 + .5 * pulse + .1 * env, speed: 11 });
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'wall'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .02 * eIO(sg(lt, 0, 6.8)));
    CAM.shake = lt >= CUE.pull ? 6 * ringK(lt - CUE.pull, .06) : 0;
  },
  draw: titleDraw,
  fx(lt) {
    const fin = lt < .2 ? 1 - lt / .2 : 0, fout = sg(lt, 6.62, 6.8), env = hornEnv(lt), ds = lt - CUE.ding, sb = strobeAt(lt);
    return { bloom: .5 + .2 * sb + (ds > 0 ? .2 * ringK(ds, .4) : 0), vignette: .42 + .12 * env, grain: .05, contrast: .1, sat: .03, tint: [['#0d2c1e', .12, 'soft-light']], aberr: 0, fade: Math.max(fin, fout), fadeColor: '2,10,6' };
  },
  blur(lt) { return (lt > .9 && lt < 2.0) ? 3 : (lt > 2.1 && lt < 2.7) ? 5 : (lt > 2.7 && lt < 3.2) ? 3 : 1; },
  over(lt) {
    const F = FX(); if (!F) return;
    const k = hornK(lt), env = hornEnv(lt), pulse = F.strobe(k);
    F.wash(ctx, { color: '#ff2a1c', alpha: .11 * env, mode: 'multiply' });                                /* the emergency red */
    F.vignette(ctx, { alpha: .22 * env, color: '#1a0508' });
    F.wash(ctx, { color: '#ffeedd', alpha: .22 * pulse, mode: 'add' });                                    /* the strobe flash: at most .35 and one a second */
  },
  label: () => '',
};
window.__EP18_SCENES.title = TITLE;

// ====================================================================================================================================================================
// END (7.5 s, noScrim, noChyron): THE DRILL LOG. The corridor wall again, a ceiling smoke detector in the top corner (its LED blinks with each chirp), a clipboard with the form FIRE DRILL LOG: R RESCUE MED CART (a check),
// A ALARM SNOOZED, C CONTAIN PENDING, E EVACUATE 80 OF 40, TIME 0 MIN, SIGNED MONDAY; a green PASS stamp slams into the RESULT box; the cast signs as small portrait chips; a notice pins itself under the board:
// NEXT: EPISODE 19 / THE POTLUCK. Cues (scene-local s, python3 /tmp/shift_tools/cues.py 18 end): theme15 .1 | typing 1.1 | chirp 2.2 | stamp 4.0 | chirp 4.7 | textding 5.1 | chirp 7.1, each snapped to a frame.
//   0.00-0.10 fade up   0.10-0.55 the board settles onto the wall   0.35-0.95 the portrait chips pop in, one after another   1.10-3.80 the six results are typed (a row every .45 s; MED CART gets its check)
//   2.20 / 4.70 / 7.10 the detector chirps (the LED lights for 5 frames, a ring, a small red glow)   4.00 PASS lands (the board dips 4 px, the camera jolts, an ink ring)   5.10 the notice pins up with its shine
//   5.45-7.2 a calm hold, a slow push-in, the chirp light the only motion   7.2-7.5 a dip to black.
// ====================================================================================================================================================================
const SE = snapOf('end');
const E = { type0: SE(1.1), chirp: [SE(2.2), SE(4.7), SE(7.1)], stamp: SE(4.0), ding: SE(5.1) };
const ROWS = [
  { k: 'R', step: 'RESCUE', val: 'MED CART', ink: '#23408e', check: true },
  { k: 'A', step: 'ALARM', val: 'SNOOZED', ink: '#b36a00' },
  { k: 'C', step: 'CONTAIN', val: 'PENDING', ink: '#b36a00' },
  { k: 'E', step: 'EVACUATE', val: '80 OF 40', ink: '#c23a2b' },
  { k: '', step: 'TIME', val: '0 MIN', ink: '#c23a2b' },
  { k: '', step: 'SIGNED', val: 'MONDAY', ink: '#23408e' },
];
const rowT = i => E.type0 + i * .45;
const BD = { x: 110, y: 476, w: 860, h: 1092 };                                   /* the clipboard board */
const PP = { x: 150, y: 556, w: 780, h: 972 };                                    /* the paper */
const LOGT = { x: 190, y: 736, w: 700, rowH: 80 };                                /* the table */
const ceilingH = 250;
function ceiling(lt) {
  ctx.save();
  let g = ctx.createLinearGradient(0, -100, 0, ceilingH); g.addColorStop(0, '#a9afa8'); g.addColorStop(1, '#8d948d');
  ctx.fillStyle = g; ctx.fillRect(-120, -120, 1320, ceilingH + 120);
  ctx.strokeStyle = 'rgba(40,50,44,.35)'; ctx.lineWidth = 3;
  for (const x of [-30, 300, 630, 960]) { ctx.beginPath(); ctx.moveTo(x, -120); ctx.lineTo(x, ceilingH); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-120, 112); ctx.lineTo(1200, 112); ctx.stroke();
  ctx.fillStyle = '#c9cec8'; ctx.fillRect(-120, ceilingH - 8, 1320, 8); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-120, ceilingH, 1320, 6);   /* the crown moulding */
  g = ctx.createLinearGradient(0, ceilingH, 0, ceilingH + 150); g.addColorStop(0, 'rgba(8,22,16,.5)'); g.addColorStop(1, 'rgba(8,22,16,0)'); ctx.fillStyle = g; ctx.fillRect(-120, ceilingH + 6, 1320, 150);
  ctx.restore();
}
const chirpLed = lt => { let v = 0; for (const c of E.chirp) { const a = lt - c; if (a >= 0 && a < .24) v = Math.max(v, a < .16 ? 1 : 1 - (a - .16) / .08); } return v; };
const DET = { x: 868, y: 128, s: .82, sq: .6 };
function detector(lt) {
  const led = chirpLed(lt);
  if (window.P18 && typeof P18.smokeDetector === 'function') { P18.smokeDetector(ctx, { x: DET.x, y: DET.y, s: DET.s, sq: DET.sq, led, dim: .22 }); return; }
  ctx.save(); ctx.translate(DET.x, DET.y); ctx.scale(1, DET.sq); ctx.fillStyle = '#e6e9ea'; ctx.beginPath(); ctx.arc(0, 0, 74, 0, TAU); ctx.fill(); outline(3); ctx.restore();
  ctx.fillStyle = led > .05 ? '#ff3c2a' : '#5a1a18'; ctx.beginPath(); ctx.arc(DET.x + 30, DET.y - 26, 6, 0, TAU); ctx.fill(); if (led > .05) glowAt(DET.x + 30, DET.y - 26, 90, '#ff3224', led, .8);
}
/* the cast chips */
const CAST = [
  { key: 'straw', bg: '#ffe2cf', ring: '#e8782c', s: .23, expr: 'sour' }, { key: 'lemon', bg: '#fff3b8', ring: '#e8a82c', s: .23, expr: 'sour' }, { key: 'mango', bg: '#ffe7c2', ring: '#e8782c', s: .21, expr: 'neutral' },
  { key: 'pom', bg: '#f6d4d0', ring: '#c23a2b', s: .2, expr: null }, { key: 'onion', bg: '#e6e2fb', ring: '#6d5bd0', s: .22, expr: null }, { key: 'tomato', bg: '#fbd8d2', ring: '#c8473a', s: .22, expr: null },
  { key: 'bind', bg: '#e5e8ec', ring: '#5b6470', s: .26, expr: null }, { key: 'star', bg: '#dbe4f2', ring: '#33527a', s: .22, expr: null },
];
const CAST_FALLBACK = new Set();
function castCtor(key) {
  const g = window;
  return { straw: () => (g.A11 && g.A11.straw) || (g.A7 && g.A7.straw), lemon: () => g.A7 && g.A7.lemon, mango: () => g.A7 && g.A7.mango, pom: () => g.A6 && g.A6.pom, onion: () => g.A15 && g.A15.onion,
    tomato: () => g.A15 && g.A15.tomato, bind: () => g.A15 && g.A15.binder, star: () => g.A14 && g.A14.stateman }[key]();
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
      if (p.key === 'tomato' || p.key === 'onion' || p.key === 'star' || p.key === 'pom') o.hold = {};   /* a portrait carries no props: they would cover the small faces */
      o.noLegs = true; o.s = p.s;
      if (p.key === 'bind') { o.x = cx; o.y = cy - 12 * p.s; }
      else { const [fx, fy] = window.H6.faceC(o); o.x = cx - fx; o.y = cy - fy + 3; }
      drawChar(o);
    } catch (e) { if (!CAST_FALLBACK.has(p.key)) { CAST_FALLBACK.add(p.key); console.error('CARDS18 chip ' + p.key + ': ' + e.message); } }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = p.ring; ctx.stroke();
}
/* the clipboard: board, clip, paper, the form, the results being typed, the check, the chips, the stamp */
function clipboard(lt) {
  const ds = lt - E.stamp, k0 = sg(lt, .1, .55), settle = back(k0, 1.4), dip = ds > 0 ? 4 * ringK(ds, .07) * Math.cos(ds * 50) : 0, y0 = lp(-70, 0, settle) + dip;
  if (k0 <= 0) return;
  ctx.save(); ctx.globalAlpha *= sg(k0, 0, .4); ctx.translate(0, y0);
  /* board and clip */
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16;
  rrect(BD.x, BD.y, BD.w, BD.h, 26); ctx.fillStyle = ctx.createLinearGradient(BD.x, 0, BD.x + BD.w, 0); ctx.fillStyle.addColorStop(0, '#8a6a47'); ctx.fillStyle.addColorStop(.5, '#9a7a55'); ctx.fillStyle.addColorStop(1, '#7d5f3f'); ctx.fill(); ctx.restore();
  rrect(BD.x, BD.y, BD.w, BD.h, 26); outline(4);
  ctx.save(); rrect(BD.x, BD.y, BD.w, BD.h, 26); ctx.clip(); ctx.strokeStyle = 'rgba(60,38,20,.22)'; ctx.lineWidth = 2; for (let i = 0; i < 26; i++) { const yy = BD.y + 20 + i * 41 + rnd(i * 1.9) * 12; ctx.beginPath(); ctx.moveTo(BD.x, yy); ctx.bezierCurveTo(BD.x + 250, yy + 8, BD.x + 540, yy - 8, BD.x + BD.w, yy + 4); ctx.stroke(); } ctx.restore();
  /* paper */
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5; rrect(PP.x, PP.y, PP.w, PP.h, 8); ctx.fillStyle = '#f8f4e6'; ctx.fill(); ctx.restore();
  UI.container('fp18t.paper', 'sheet', [PP.x, PP.y, PP.x + PP.w, PP.y + PP.h], 14);
  ctx.save(); rrect(PP.x, PP.y, PP.w, PP.h, 8); ctx.clip(); ctx.fillStyle = ctx.createLinearGradient(0, PP.y + PP.h - 90, 0, PP.y + PP.h); ctx.fillStyle.addColorStop(0, 'rgba(120,100,60,0)'); ctx.fillStyle.addColorStop(1, 'rgba(120,100,60,.16)'); ctx.fillRect(PP.x, PP.y + PP.h - 90, PP.w, 90); ctx.restore();
  UI.label('FIRE DRILL LOG', 540, PP.y + 62, { font: 'Nunito', weight: 900, size: 58, spacing: 4, fill: '#1d1a22', cid: 'fp18t.paper', maxW: PP.w - 80 });
  UI.label('UNIT B   MONDAY   8:25 PM', 540, PP.y + 118, { font: 'Nunito', weight: 800, size: 32, spacing: 3, fill: '#5a5560', cid: 'fp18t.paper', maxW: PP.w - 80 });
  ctx.fillStyle = 'rgba(40,30,50,.55)'; ctx.fillRect(PP.x + 40, PP.y + 150, PP.w - 80, 3);
  /* the clip */
  ctx.save(); ctx.translate(540, BD.y - 6); rrect(-130, -34, 260, 96, 14); ctx.fillStyle = ctx.createLinearGradient(0, -34, 0, 62); ctx.fillStyle.addColorStop(0, '#e7ebf0'); ctx.fillStyle.addColorStop(.5, '#aab2bd'); ctx.fillStyle.addColorStop(1, '#757d89'); ctx.fill(); outline(3.5);
  rrect(-92, 8, 184, 36, 8); ctx.fillStyle = 'rgba(30,34,42,.55)'; ctx.fill(); for (const rx of [-104, 104]) { ctx.beginPath(); ctx.arc(rx, 14, 8, 0, TAU); ctx.fillStyle = '#c5ccd6'; ctx.fill(); outline(2.4); } ctx.restore();
  /* the table: letters and steps are printed; the results are typed, left aligned so nothing shifts while it grows */
  const cols = [{ w: 96, align: 'center', font: 'Bangers', weight: 400, fill: '#c23a2b', size: 58 }, { w: 290, weight: 900, fill: '#2a2630' }, { w: 314, weight: 900, align: 'left' }];
  const rows = ROWS.map((r, i) => {
    const t = rowT(i), n = Math.round(r.val.length * sg(lt, t, t + .38));
    return [r.k, r.step, { t: r.val.slice(0, n), fill: r.ink }];
  });
  const tb = UI.table([LOGT.x, LOGT.y, LOGT.w, LOGT.rowH * ROWS.length], cols, rows, { rowH: LOGT.rowH, size: 40, padX: 18, fill: false, stroke: 'rgba(60,45,30,.45)', lw: 3, grid: 'rgba(60,45,30,.35)', vgrid: true, id: 'fp18t.log' });
  /* the check after MED CART */
  const ck = sg(lt, rowT(0) + .36, rowT(0) + .6);
  if (ck > 0) { const c = tb.cell(0, 2), w = UI.sizeOf('MED CART', { size: 40, weight: 900 }).w, x = c.x0 + 18 + w + 36, y = c.cy, s = back(ck, 2.4) * .98; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-17, 1); ctx.lineTo(-5, 14); ctx.lineTo(19, -15); ctx.stroke(); ctx.restore(); }
  /* the result box and who signed */
  const RB = { x: 190, y: LOGT.y + LOGT.rowH * ROWS.length + 28, w: 700, h: 124 };
  ctx.strokeStyle = 'rgba(60,45,30,.45)'; ctx.lineWidth = 3; rrect(RB.x, RB.y, RB.w, RB.h, 10); ctx.stroke();
  UI.container('fp18t.result', 'box', [RB.x, RB.y, RB.x + RB.w, RB.y + RB.h], 10);
  UI.label('RESULT', RB.x + 120, RB.y + RB.h / 2, { font: 'Nunito', weight: 900, size: 38, spacing: 5, fill: '#5a5560', cid: 'fp18t.result', maxW: 190 });
  UI.label('WITNESSED BY', 540, RB.y + RB.h + 42, { font: 'Nunito', weight: 800, size: 30, spacing: 4, fill: '#5a5560', cid: 'fp18t.paper', maxW: 420 });
  const n = CAST.length, rad = 33, gap = 16, x0 = 540 - (n * 2 * rad + (n - 1) * gap) / 2 + rad, cy = RB.y + RB.h + 106;
  CAST.forEach((p, i) => { const k = sg(lt, .35 + i * .07, .6 + i * .07); if (k <= 0) return; const pop = back(k, 2.2), cx = x0 + i * (2 * rad + gap); ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy); ctx.globalAlpha *= sg(k, 0, .4); chip(p, cx, cy, rad, lt); ctx.restore(); });
  /* the PASS stamp: it comes down from large and lands in the RESULT box */
  if (lt >= E.stamp - .1) {
    const k = sg(lt, E.stamp - .09, E.stamp), settle = ds >= 0 ? 1 + .07 * Math.sin(Math.min(1, ds / .16) * PI) * (1 - Math.min(1, ds / .16)) * 2 : 1, sc = lt < E.stamp ? lp(1.28, 1, eI(k)) : 1 / settle, hero = ds >= .17, cx = RB.x + 460, cy2 = RB.y + RB.h / 2 + 2;
    ctx.save(); ctx.globalAlpha *= lt < E.stamp ? sg(k, 0, .5) : 1; ctx.translate(cx, cy2); ctx.scale(sc, sc); ctx.translate(-cx, -cy2);
    UI.stamp('PASS', cx, cy2, { font: 'Bangers', size: 92, color: '#1e8e5a', rot: -.13, lw: 9, padX: 46, padY: 26, alpha: .94, hero, crop: !hero, id: 'fp18t.pass' });
    ctx.restore();
    if (ds >= 0 && ds < .7) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; if (window.V2 && V2.ring) V2.ring(cx, cy2, ds / .7, { r0: 60, r1: 420, lw: 12, color: '120,235,170', alpha: .75, bloom: .4, squash: .5 }); ctx.restore();
      ctx.fillStyle = '#1e8e5a'; for (let i = 0; i < 14; i++) { const a = rnd(i * 3.1) * TAU, d = 150 + rnd(i * 5.3) * 90, f = sg(ds, 0, .35); if (f <= 0 || f >= 1) continue; ctx.globalAlpha = (1 - f) * .8; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d * eO(f), cy2 + Math.sin(a) * d * eO(f) * .5, 2 + 3 * rnd(i * 7.7), 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
/* the notice pinned under the board: NEXT: EPISODE 19 / THE POTLUCK (it lights with the textding) */
const NT = { x: 140, y: 1630, w: 800, h: 228 };
function notice(lt) {
  const p = sg(lt, E.ding, E.ding + .36), ds = lt - E.ding;
  if (p <= 0) return;
  const pop = back(p, 1.6), cx = NT.x + NT.w / 2, cy = NT.y + NT.h / 2, rest = p >= 1;
  ctx.save(); ctx.globalAlpha *= sg(p, 0, .3); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.rotate(.012); ctx.translate(-cx, -cy);
  UI.panel([NT.x, NT.y, NT.w, NT.h], { r: 16, fill: ['#fff1a8', '#ffe135'], stroke: '#b8860b', lw: 4, shadow: 24, id: 'fp18t.notice' });
  UI.label('NEXT: EPISODE 19', cx, NT.y + 56, { font: 'Nunito', weight: 900, size: 38, spacing: 6, fill: '#8a2a1c', cid: 'fp18t.notice', hero: rest, crop: !rest, maxW: NT.w - 80 });
  bevelText(TEASER19, cx, NT.y + 154, 100, { face: [[0, '#ffffff'], [.5, '#ffe9a8'], [1, '#ffbf3a']], ext: ['#a5122a', '#4a0614'], rim: '#7a0c1c', extr: .35, lwK: .12, hero: rest, shine: ds > .2 ? eIO(sg(ds, .2, 1.0)) : -1, shineA: .8, grp: 'bv:teaser', alpha: 1 });
  ctx.fillStyle = '#d02229'; ctx.beginPath(); ctx.arc(cx, NT.y + 10, 13, 0, TAU); ctx.fill(); outline(3); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(cx - 4, NT.y + 6, 4, 0, TAU); ctx.fill();   /* the pushpin */
  ctx.restore();
  if (ds > 0 && ds < 1.5) { ctx.save(); ctx.globalCompositeOperation = 'screen'; for (const [dx, dy, r, d] of [[-NT.w / 2 + 20, -NT.h / 2 + 10, 30, 0], [NT.w / 2 - 10, -NT.h / 2 + 30, 26, .15], [-NT.w / 2 + 160, NT.h / 2 - 6, 24, .3], [NT.w / 2 - 120, NT.h / 2 - 12, 28, .22]]) { const k = sg(ds, d, d + .5); star(cx + dx, cy + dy, r * Math.sin(PI * k), 1, k * .8); } ctx.restore(); }
}
function endDraw(lt) {
  const ds = lt - E.stamp;
  wall({ top: ceilingH, rail: 1960, base: 2000, floor: 2040 });
  ceiling(lt);
  const F = FX();
  if (F) F.cone(ctx, { x: 540, y: ceilingH, ang: PI / 2, spread: 1.5, len: 1300, color: '#fff3dc', alpha: .13, soft: .9 });
  /* the logo and the thanks above the board */
  const k1 = sg(lt, .12, .45), lg = sg(lt, .2, .6);
  if (k1 > 0) UI.label('THANKS FOR WATCHING', 540, 292, { font: 'Nunito', weight: 900, size: 32, spacing: 7, fill: CREAM, reveal: k1, hero: k1 >= 1, crop: k1 < 1, maxW: 760 });
  if (lg > 0) { const cy = 366, sc = lp(1.15, 1, back(lg, 1.6)); ctx.save(); ctx.translate(540, cy); ctx.scale(sc, sc); ctx.translate(-540, -cy); bevelText('SHIFT HAPPENS', 540, cy, 92, { alpha: sg(lg, 0, .35), hero: lg >= 1, extr: .35, lwK: .13, shine: lt > E.ding ? eIO(sg(lt - E.ding, .1, .9)) : -1, shineA: .7, grp: 'bv:end-logo' }); ctx.restore(); }
  clipboard(lt);
  notice(lt);
  detector(lt);
  /* the chirps: a ring from the detector, a small glow */
  for (const c of E.chirp) { const a = lt - c; if (a > 0 && a < .7 && window.V2 && V2.ring) { ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(DET.x, DET.y, a / .7, { r0: 40, r1: 190, lw: 6, color: '255,236,230', alpha: .4, bloom: 0, squash: .6 }); ctx.restore(); } }
  if (window.V2 && V2.dust) V2.dust(60, 300, 1020, 1800, lt, { n: 40, seed: 11, size: 3, alpha: .12, speed: 9 });
}
const END = {
  noChyron: true, noScrim: true,
  shot() { return 'log'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .022 * eIO(sg(lt, 0, 7.5)));
    CAM.shake = 5 * (lt >= E.stamp ? ringK(lt - E.stamp, .05) : 0);
  },
  draw: endDraw,
  fx(lt) {
    const fin = lt < .1 ? 1 - lt / .1 : 0, fout = sg(lt, 7.2, 7.5), st = lt >= E.stamp ? ringK(lt - E.stamp, .1) : 0, dd = lt >= E.ding ? ringK(lt - E.ding, .5) : 0;
    return { bloom: .42 + .3 * st + .2 * dd + .2 * chirpLed(lt), vignette: .4, grain: .05, contrast: .1, sat: .03, aberr: 2.5 * st, tint: [['#0d2c1e', .1, 'soft-light']], fade: Math.max(fin, fout), fadeColor: '2,10,6' };
  },
  blur(lt) { return (lt > E.stamp - .1 && lt < E.stamp + .12) ? 5 : (lt > .1 && lt < .6) ? 3 : 1; },
  over() {},
  label: () => 'THANKS FOR WATCHING',
};
window.__EP18_SCENES.end = END;
/* the pieces a later card can reuse (as FP15A does for Episode 15) */
window.FP18A = { TEASER19, bevelText, star, meas, vgrad, wall, glowAt, signBr, YEL, CREAM, INK, RED };
})();
