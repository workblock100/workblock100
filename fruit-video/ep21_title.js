'use strict';
/* SHIFT HAPPENS, Episode 21: The Inspection. Scene module ART cards: `title` (6.8 s) and `end` (7.5 s), registered on window.__EP21_SCENES. Prefix for anything new: fp21t_. Every string goes through the UI kit, live each
 * frame (the cached desk and paper sprites hold no text). Uses the Episode 21 kits (A21.clipboard, H21.reticle, H21.track, H21.stamp), guarded at draw time.
 *
 * TITLE (noChyron, noScrim): a desk under a cold office light. A DEPARTMENT OF HEALTH clipboard (A21.clipboard, 680 px wide) with the checklist FRONT DOORS / STAFFING / LABELS / SHIFT HAPPENS; a surveyor's gloved hand
 * (a navy blazer cuff) with a navy ballpoint comes in from the lower left. Cues (scene-local s, python3 /tmp/shift_tools/cues.py 21 title, snapped to frames): theme21 .2 | penclick 1.0 | checktick 1.8, 2.4, 3.0 | stamp 3.8 | textding 5.4.
 *   0.00-0.20  fade up on the clipboard, centred. A slow push-in (zoom 1 to 1.05) runs the whole card; 3.22-3.98 the camera tilts up with the title (peak about 380 px/s); the light hums (a tiny swell), dust drifts.
 *   0.25-0.95  the hand and pen glide in from the lower left to hover over the first box.     1.00 penclick: the plunger clicks, the tip snaps out.
 *   1.80 / 2.40 / 3.00  checktick: three ticks, each a crisp ink stroke drawn from the cue (.14 s), the pen tip riding the stroke; between them the pen lifts and moves to the next box.
 *   3.14-3.55  the hand leaves to the lower left.   2.86-3.41  an H21 reticle hunts down the box column (row 1 to 4), then widens onto SHIFT HAPPENS and locks (tag NOTED types in).
 *   3.42-3.78  SHIFT HAPPENS lifts off the paper (its shadow separating), the reticle riding on it, and lands as the big title at the top (white, navy outline).
 *   3.80       stamp: SURVEYED slams onto the empty fourth row (H21.stamp: squash, ink ring, specks); the camera bumps a little.
 *   4.00-4.95  the reticle pulses out; EPISODE 21 pops in, THE INSPECTION types in.   5.40 textding: a glint sweeps the title, four star glints.   6.62-6.80 a dip to black.
 * END: see the second half of this file. */
(() => {
/* the title of the next episode, shown in the end card's teaser (the lead confirms it: change this one constant) */
const TEASER22 = 'THE SECRET SANTA';
if (!window.TIMELINE_EP21 || !window.UI || !window.H6) return;
const { zoomTo } = window.H6;
window.__EP21_SCENES = window.__EP21_SCENES || {};
const TLX = window.TIMELINE_EP21;
const PI = Math.PI, TAU = PI * 2;
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const ss = k => { k = cl(k); return k * k * (3 - 2 * k); };
const eIO = k => { k = cl(k); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
const eO = k => 1 - Math.pow(1 - cl(k), 3);
const eI = k => cl(k) * cl(k) * cl(k);
const back = (k, s = 1.7) => { k = cl(k); const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const ringK = (age, tau) => age < 0 ? 0 : Math.exp(-age / tau);
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : hash(s * 3.17 + k * 11.3 + 1.3);
const OUTL = 'rgba(20,14,30,.85)';
const startOf = id => (TLX.scenes.find(s => s.id === id) || { start: 0 }).start;
const snapOf = id => { const S0 = startOf(id); return t => Math.round((S0 + t) * 30) / 30 - S0; };
const mkcv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.__txOK = true; return c; };
const A21n = () => (window.A21 && A21.clipboard) ? A21 : null;
const H21n = () => (window.H21 && H21.reticle) ? H21 : null;

/* the lettering: a soft drop shadow, a navy outline, a pale face with a gloss, and a sweeping shine. Only the face is the string the viewer reads (hero when o.hero); the other layers are copies (hero false, crop, one group). */
function letters(str, cx, cy, size, o = {}) {
  const font = o.font || 'Bangers', sp = o.spacing ?? size * .03, cap = UI.metrics(font).cap * size, al = o.alpha ?? 1, lw = size * (o.lwK ?? .14), ink = o.ink || '#0d1f45', reveal = o.reveal ?? 1;
  if (al <= .004 || size < 2 || reveal <= 0) return null;
  const common = { font, size, spacing: sp, grp: o.grp || 'fp21t:' + str, tilt: .35, hero: false, crop: true, reveal, maxW: o.maxW };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv, alpha: al }, extra));
  const vg = stops => { const g = ctx.createLinearGradient(0, cy - cap * .55, 0, cy + cap * .55); for (const [s, c] of stops) g.addColorStop(s, c); return g; };
  if (o.shadow !== false) L(size * .035, size * .07, 'rgba(4,10,30,.42)', 'rgba(4,10,30,.42)', lw * 1.3, { shadow: size * .1, alpha: al * (o.shadowA ?? 1) });
  L(0, 0, ink, ink, lw);
  const box = UI.label(str, cx, cy, Object.assign({}, common, { fill: vg(o.face || [[0, '#ffffff'], [.5, '#eef4fc'], [.52, '#d6e2f2'], [1, '#bccde6']]), lw: 0, alpha: al, hero: !!o.hero, crop: !o.hero }));
  L(0, 0, vg([[0, 'rgba(255,255,255,.55)'], [.45, 'rgba(255,255,255,.06)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), undefined, 0, {});
  if (o.shine != null && o.shine > -.3 && o.shine < 1.3 && box) {
    const x = lp(box.x0 - cap * .6, box.x1 + cap * .6, o.shine), g = ctx.createLinearGradient(x - cap * .5, cy - cap, x + cap * .5, cy);
    for (const [s, a] of [[0, 0], [.38, 0], [.5, .9], [.62, 0], [1, 0]]) g.addColorStop(s, `rgba(255,255,255,${a})`);
    L(0, 0, g, undefined, 0, {});
  }
  return box;
}
function star(x, y, r, a, rot = 0) {   /* a four-point glint (additive) */
  if (a <= .01 || r <= .5) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(240,250,255,1)'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * PI / 4, q = i % 2 ? r * .2 : r; ctx.lineTo(Math.cos(ang) * q, Math.sin(ang) * q); } ctx.closePath(); ctx.fill();
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .9); g.addColorStop(0, 'rgba(200,236,255,.8)'); g.addColorStop(1, 'rgba(200,236,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, TAU); ctx.fill();
  ctx.restore();
}

// ====================================================================================================================================================================
// TITLE
// ====================================================================================================================================================================
const SN = snapOf('title');
const CUE = { click: SN(1.0), tk: [SN(1.8), SN(2.4), SN(3.0)], stamp: SN(3.8), ding: SN(5.4) };
const TK_DUR = .14;
const CB = { x: 540, y: 1120, w: 660, rot: -.035 };                                    /* the clipboard: h = w * 1.32 (y about 684 to 1556) */
const ITEMS = ['FRONT DOORS', 'STAFFING', 'LABELS', 'SHIFT HAPPENS'];
const TT = { x: 540, y: 300, size: 156 };                                              /* the title's resting place (cap-band centre) */
const LIFT = [3.42, 3.78], RET = { t0: 2.86, hunt: 3.18, lock: 3.41, out: 3.86 };
const SUB = { pill: 4.02, type0: 4.22, type1: 4.95 }, TILT = [3.22, 3.98];

/* the desk: cool grey-green laminate under a cold fluorescent pool; dressing at the edges (a coffee cup, paper clips, a pencil, a lanyard badge). Cached once: no text in it. */
let deskCv = null;
function deskSprite() {
  if (deskCv) return deskCv;
  const c = deskCv = mkcv(1080, 1920), g = c.getContext('2d'), prev = ctx; ctx = g;
  try {
    let gr = g.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, '#5d7076'); gr.addColorStop(.5, '#788d92'); gr.addColorStop(1, '#4f6166'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < 90; i++) { const y = rnd(5101, i) * 1920, a = .03 + .05 * rnd(5102, i); g.strokeStyle = rnd(5103, i) < .5 ? `rgba(255,255,255,${a})` : `rgba(0,20,30,${a})`; g.lineWidth = 1 + 3 * rnd(5104, i); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(360, y + 10 * (rnd(5105, i) - .5), 720, y - 8, 1080, y + 6 * (rnd(5106, i) - .5)); g.stroke(); }
    gr = g.createRadialGradient(540, 760, 60, 540, 860, 1100); gr.addColorStop(0, 'rgba(225,240,255,.34)'); gr.addColorStop(.5, 'rgba(200,225,250,.1)'); gr.addColorStop(1, 'rgba(0,10,20,.4)'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
    /* a coffee cup seen from above (bottom right) with a ring stain beside it */
    g.strokeStyle = 'rgba(90,60,30,.25)'; g.lineWidth = 5; g.beginPath(); g.arc(842, 1716, 62, .3, 5.6); g.stroke();
    g.fillStyle = 'rgba(0,10,20,.3)'; g.beginPath(); g.arc(958, 1748, 86, 0, TAU); g.fill();
    g.fillStyle = '#f2f2ee'; g.strokeStyle = OUTL; g.lineWidth = 4; g.beginPath(); g.arc(946, 1734, 80, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#5a3a20'; g.beginPath(); g.arc(946, 1734, 62, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,240,220,.25)'; g.beginPath(); g.ellipse(926, 1714, 26, 12, -.6, 0, TAU); g.fill();
    g.fillStyle = '#2456b8'; g.fillRect(866, 1724, 18, 20);
    /* paper clips (bottom left) and a yellow pencil */
    g.strokeStyle = '#c9ced8'; g.lineWidth = 4; for (const [x, y, r] of [[120, 1640, .4], [176, 1700, -.3], [98, 1752, 1.2]]) { g.save(); g.translate(x, y); g.rotate(r); g.beginPath(); g.moveTo(-8, 22); g.lineTo(-8, -18); g.arc(0, -18, 8, PI, 0); g.lineTo(8, 16); g.arc(2, 16, 6, 0, PI); g.lineTo(-4, -10); g.stroke(); g.restore(); }
    g.save(); g.translate(250, 1800); g.rotate(-.42); g.fillStyle = '#f2c230'; g.strokeStyle = OUTL; g.lineWidth = 3; g.fillRect(-150, -11, 260, 22); g.strokeRect(-150, -11, 260, 22); g.fillStyle = '#f0c9a0'; g.beginPath(); g.moveTo(110, -11); g.lineTo(150, 0); g.lineTo(110, 11); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#2a2a2a'; g.beginPath(); g.moveTo(138, -3); g.lineTo(150, 0); g.lineTo(138, 3); g.fill(); g.fillStyle = '#e88aa0'; g.fillRect(-176, -11, 26, 22); g.strokeRect(-176, -11, 26, 22); g.restore();
    /* the surveyor's lanyard lying on the desk at the right, half under the clipboard */
    g.lineCap = 'round'; g.strokeStyle = OUTL; g.lineWidth = 13; g.beginPath(); g.moveTo(1100, 860); g.bezierCurveTo(960, 900, 1000, 1080, 960, 1160); g.stroke(); g.strokeStyle = '#2a5cc8'; g.lineWidth = 8; g.stroke();
    g.save(); g.translate(966, 1214); g.rotate(.22); g.fillStyle = '#fbfbfd'; g.strokeStyle = OUTL; g.lineWidth = 3; g.beginPath(); g.roundRect(-44, -30, 88, 120, 7); g.fill(); g.stroke(); g.fillStyle = '#1f4fa8'; g.fillRect(-42, -28, 84, 28); g.fillStyle = '#e2b64a'; g.beginPath(); g.arc(-26, -14, 8, 0, TAU); g.fill(); g.fillStyle = '#dce8f6'; g.fillRect(-34, 10, 32, 38); g.fillStyle = '#3f8a45'; g.beginPath(); g.ellipse(-18, 26, 11, 10, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(40,50,70,.4)'; g.fillRect(6, 14, 30, 6); g.fillRect(6, 28, 24, 5); g.fillStyle = '#c8283c'; g.fillRect(-42, 68, 84, 20); g.restore();
  } finally { ctx = prev; }
  return c;
}
/* the tick strokes: each drawn on from its cue over TK_DUR */
const ticksAt = lt => CUE.tk.reduce((a, c) => a + cl((lt - c) / TK_DUR), 0);
const tickPts = (b) => { const x = b[0], y = b[1], s = b[2] - b[0]; return [[x + s * .12, y + s * .52], [x + s * .4, y + s * .82], [x + s * 1.04, y - s * .26]]; };
function alongPts(pts, f) { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } let left = cl(f) * tot; for (let i = 1; i < pts.length; i++) { if (left <= L[i - 1]) { const u = left / (L[i - 1] || 1); return [lp(pts[i - 1][0], pts[i][0], u), lp(pts[i - 1][1], pts[i][1], u)]; } left -= L[i - 1]; } return pts[pts.length - 1]; }
const T2 = (x, y) => { const c = Math.cos(CB.rot), s = Math.sin(CB.rot); return [CB.x + x * c - y * s, CB.y + x * s + y * c]; };
/* the pen tip over time: [x, y, lift 0..1] (scene coordinates). Off frame at the lower left, in to hover, three strokes, out again. */
function penAt(lt, rows) {
  const st = i => T2(...tickPts(rows[i].local.box)[0]), en = i => T2(...tickPts(rows[i].local.box)[2]), off = [-160, 1990];
  const hover = (p, k = 1) => [p[0] - 14 * k, p[1] - 10 * k, k];
  if (lt < .25) return [off[0], off[1], 1];
  if (lt < CUE.tk[0]) { const h0 = hover(st(0)), k = eIO(sg(lt, .25, .95)), dw = sg(lt, CUE.tk[0] - .22, CUE.tk[0]), x = lp(off[0], h0[0], k) + 6 * Math.sin(lt * 3.1) * (1 - dw), y = lp(off[1], h0[1], k) + 4 * Math.sin(lt * 2.3) * (1 - dw); return [lp(x, st(0)[0], eIO(dw)), lp(y, st(0)[1], eIO(dw)), 1 - eIO(dw)]; }
  for (let i = 0; i < 3; i++) {
    const c0 = CUE.tk[i], c1 = c0 + TK_DUR;
    if (lt < c1) { const p = T2(...alongPts(tickPts(rows[i].local.box), (lt - c0) / TK_DUR)); return [p[0], p[1], 0]; }
    const next = i < 2 ? CUE.tk[i + 1] : null;
    if (next != null && lt < next) { const a = en(i), b = st(i + 1), u = sg(lt, c1, next), k = eIO(u), lift = Math.sin(PI * cl(u * 1.15)); return [lp(a[0], b[0], k) - 14 * lift, lp(a[1], b[1], k) - 26 * lift, lift]; }
  }
  const a = en(2), u = eI(sg(lt, CUE.tk[2] + TK_DUR, 3.55)); return [lp(a[0], off[0], u), lp(a[1], off[1], u), Math.min(1, u * 4)];
}
const PEN_DIR = [-.57, .82];   /* from the tip toward the back of the pen (down and to the left: the pen never lies over the printed text) */
function drawHandPen(lt, rows) {
  const [tx, ty, lift] = penAt(lt, rows), clickA = lt >= CUE.click ? ringK(lt - CUE.click, .05) : 0, tipOut = lt >= CUE.click ? 1 : 0;
  if (tx < -400 || ty > 2300) return;
  const d = PEN_DIR, L = 380, n = [d[1], -d[0]], sc = 1 + .035 * lift, P = (k, w = 0) => [tx + d[0] * k + n[0] * w, ty + d[1] * k + n[1] * w];
  ctx.save(); ctx.translate(tx, ty); ctx.scale(sc, sc); ctx.translate(-tx, -ty); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the shadow of hand and pen on the paper: further away when the pen is lifted */
  ctx.save(); ctx.translate(14 + 22 * lift, 18 + 28 * lift); ctx.globalAlpha *= .28 - .1 * lift; ctx.strokeStyle = '#0a1420'; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(...P(14)); ctx.lineTo(...P(L)); ctx.stroke(); ctx.fillStyle = '#0a1420'; ctx.beginPath(); ctx.arc(...P(120), 44, 0, TAU); ctx.fill(); ctx.lineWidth = 90; ctx.beginPath(); ctx.moveTo(...P(150)); ctx.lineTo(...P(560, 30)); ctx.stroke(); ctx.restore();
  /* the sleeve: a navy blazer cuff and a white shirt cuff, from the hand off frame */
  const s0 = P(150, 8), s1 = P(620, 40);
  ctx.strokeStyle = OUTL; ctx.lineWidth = 98; ctx.beginPath(); ctx.moveTo(...s0); ctx.lineTo(...s1); ctx.stroke(); ctx.strokeStyle = '#22315c'; ctx.lineWidth = 90; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(...P(190, -26)); ctx.lineTo(...P(620, 4)); ctx.stroke();
  const c0 = P(146, 6); ctx.strokeStyle = OUTL; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(c0[0] + n[0] * 44, c0[1] + n[1] * 44); ctx.lineTo(c0[0] - n[0] * 40, c0[1] - n[1] * 40); ctx.stroke(); ctx.strokeStyle = '#f4f4f8'; ctx.lineWidth = 19; ctx.stroke();
  /* the pen: navy barrel, a silver clip and cone, the plunger that clicks */
  ctx.strokeStyle = OUTL; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(...P(30)); ctx.lineTo(...P(L)); ctx.stroke();
  ctx.strokeStyle = '#25408c'; ctx.lineWidth = 27; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(...P(70, -6)); ctx.lineTo(...P(L - 20, -6)); ctx.stroke();
  const cone0 = P(30), tip = P(-6 - 8 * tipOut);
  ctx.fillStyle = '#dfe4ea'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(cone0[0] + n[0] * 14, cone0[1] + n[1] * 14); ctx.lineTo(...P(2)); ctx.lineTo(cone0[0] - n[0] * 14, cone0[1] - n[1] * 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#2a2a33'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(...P(4)); ctx.lineTo(...tip); ctx.stroke();
  const pl = P(L + 10 - 9 * clickA); ctx.strokeStyle = OUTL; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(...P(L - 4)); ctx.lineTo(...pl); ctx.stroke(); ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 13; ctx.stroke();
  ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(...P(L - 20, -19)); ctx.lineTo(...P(L - 150, -19)); ctx.stroke();
  if (clickA > .05) { ctx.strokeStyle = `rgba(255,255,255,${.85 * clickA})`; ctx.lineWidth = 4; for (const a of [-.7, 0, .7]) { const u = [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)], p0 = P(L + 30); ctx.beginPath(); ctx.moveTo(p0[0] + u[0] * 6, p0[1] + u[1] * 6); ctx.lineTo(p0[0] + u[0] * 30, p0[1] + u[1] * 30); ctx.stroke(); } }
  /* the gloved fist round the barrel, the thumb on top */
  const f = P(118, -2);
  ctx.fillStyle = V2.grad(f[0] - 40, f[1] - 40, f[0] + 40, f[1] + 40, [[0, '#ffffff'], [1, '#d7dce8']]); ctx.strokeStyle = OUTL; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(f[0], f[1], 46, 40, Math.atan2(d[1], d[0]), 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,20,40,.45)'; ctx.lineWidth = 3; for (const k of [-16, 0, 16]) { const a = P(118 + k, -40), b = P(118 + k, -26); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  const th = P(96, 26); ctx.fillStyle = '#f6f7fb'; ctx.strokeStyle = OUTL; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(th[0], th[1], 30, 17, Math.atan2(d[1], d[0]) + .2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* the fourth row's text as printed (fitted to its row exactly as A21.clipboard fits it): centre, size, width (scene coordinates) */
function row4Text(rows) {
  const r = rows[3], loc = r.local, maxW = loc.x1 - CB.w * .04 - loc.text[0], st = { size: r.size, font: 'Nunito', weight: 900 };
  const f = UI.fit(ITEMS[3], maxW, st), w = UI.sizeOf(ITEMS[3], Object.assign({}, st, { size: f.size })).w, c = T2(loc.text[0] + w / 2, loc.text[1]);
  return { x: c[0], y: c[1], size: f.size, w };
}
/* the lift: SHIFT HAPPENS flies from the paper to the title place. Returns { x, y, size, rot, k (0 on the paper .. 1 landed), pop } */
function liftAt(lt, rows) {
  const a = row4Text(rows), k = eIO(sg(lt, LIFT[0], LIFT[1])), pop = Math.sin(PI * sg(lt, LIFT[0] - .02, LIFT[0] + .12)) * .08;
  const arc = Math.sin(PI * k) * 60;
  return { x: lp(a.x, TT.x, k) + arc, y: lp(a.y, TT.y, k), size: a.size * Math.pow(TT.size / a.size, k) * (1 + pop), rot: lp(CB.rot, 0, k), k, a };
}
function titleDraw(lt) {
  const A = A21n(), Hk = H21n();
  const dk = deskSprite(); ctx.drawImage(dk, 0, 0); ctx.drawImage(dk, 0, 1908, 1080, 12, 0, 1908, 1080, 420); ctx.drawImage(dk, 0, 0, 1080, 12, 0, -300, 1080, 312);   /* the desk runs on past the sprite's top and bottom (the camera starts low) */
  /* the cold office light: a slow, tiny swell (the hum), never a flicker */
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const hum = .085 + .012 * Math.sin(lt * TAU * .55); const lg = ctx.createRadialGradient(540, 620, 40, 540, 760, 900); lg.addColorStop(0, `rgba(215,236,255,${hum})`); lg.addColorStop(1, 'rgba(215,236,255,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, 1080, 1920); ctx.restore();
  if (!A) { UI.label('SHIFT HAPPENS', 540, 900, { font: 'Bangers', size: 140, fill: '#ffffff', stroke: '#0d1f45', lw: 16 }); return; }
  const flying = lt >= LIFT[0] - .02 && lt < LIFT[1] + .06, lifted = lt >= LIFT[0];
  const R = A.clipboard(ctx, { x: CB.x, y: CB.y, w: CB.w, rot: CB.rot, items: ITEMS, ticks: ticksAt(lt), rowAlpha: [1, 1, 1, lifted ? 0 : 1], hero: !flying, t: lt });
  const rows = R.rows;
  /* the SURVEYED stamp on the emptied fourth row */
  if (Hk && lt >= CUE.stamp - .2) Hk.stamp(ctx, { x: rows[3].cx + 10, y: rows[3].cy, s: 1, size: 70, rot: -.1, text: 'SURVEYED', t: lt, t0: CUE.stamp, color: '#d3203a', id: 'fp21t.stamp' });
  if (window.V2 && V2.dust) V2.dust(150, 640, 930, 1500, lt, { n: 36, seed: 21, size: 3, alpha: .26, speed: 10, color: '230,242,255' });
  drawHandPen(lt, rows);
  /* the reticle: hunts down the box column, widens onto SHIFT HAPPENS, locks, rides the lift, pulses out */
  const L = liftAt(lt, rows);
  if (Hk && lt >= RET.t0 && lt < RET.out + .36) {
    let x, y, w, h, lock = ss(sg(lt, 3.0, RET.lock)), alpha = sg(lt, RET.t0, RET.t0 + .12) * (1 - sg(lt, RET.out, RET.out + .34));
    const bc = i => { const b = rows[i].box; return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2, Math.abs(b[2] - b[0])]; };
    if (lt < RET.hunt) { const u = sg(lt, RET.t0, RET.hunt), f = eIO(u) * 3 + .18 * Math.sin(u * PI * 3) * (1 - u), i0 = Math.min(2, Math.floor(f)), uu = cl(f - i0), p0 = bc(Math.max(0, i0)), p1 = bc(Math.min(3, i0 + 1)); x = lp(p0[0], p1[0], uu); y = lp(p0[1], p1[1], uu); w = h = p0[2] * 1.5; }
    else if (lt < LIFT[0]) { const u = eIO(sg(lt, RET.hunt, RET.lock)), p = bc(3), cap = L.a.size * .76; x = lp(p[0], L.a.x, u); y = lp(p[1], L.a.y, u); w = lp(p[2] * 1.5, L.a.w + 10, u); h = lp(p[2] * 1.5, cap + 10, u); }
    else { const cap = L.size * .76, ww = UI.sizeOf(ITEMS[3], { size: L.size, font: L.k > .5 ? 'Bangers' : 'Nunito', weight: L.k > .5 ? 400 : 900, spacing: L.k > .5 ? L.size * .03 : 0 }).w; x = L.x; y = L.y; w = ww + 14; h = cap + 12; const grow = 1 + .12 * sg(lt, RET.out, RET.out + .34); w *= grow; h *= grow; }
    Hk.reticle(ctx, { x, y, w, h, t: lt, lock, color: Hk.CYAN, label: lt < RET.out ? 'NOTED' : null, labelPx: 32, alpha, id: 'fp21t.ret', hero: false, crop: flying || lt >= LIFT[0] - .04, reveal: sg(lt, RET.lock - .18, RET.lock + .14) });
  }
  /* SHIFT HAPPENS: a navy ink copy that fades as the title style takes over in flight; then the title at rest */
  if (lifted) {
    const k = L.k, inkA = 1 - ss(sg(k, 0, .55));
    ctx.save(); ctx.translate(L.x, L.y); ctx.rotate(L.rot);
    if (k < 1) {
      const shA = Math.sin(PI * cl(k * 1.4)) * .5;
      if (shA > .01) UI.label(ITEMS[3], 10 + 24 * k, 18 + 40 * k, { font: 'Nunito', weight: 900, size: L.size * (1 - .4 * ss(k / .5)), fill: 'rgba(10,20,40,.35)', alpha: shA, hero: false, crop: true, grp: 'fp21t.lift', shadow: 8 });
      if (inkA > .01) UI.label(ITEMS[3], 0, 0, { font: 'Nunito', weight: 900, size: L.size * (1 - .4 * ss(k / .5)), fill: '#1d2236', alpha: inkA, hero: false, crop: true, grp: 'fp21t.lift' });
    }
    const titleA = ss(sg(k, .25, .8)), rest = lt >= LIFT[1] + .04, shine = lt >= CUE.ding ? eIO(sg(lt, CUE.ding, CUE.ding + .8)) * 1.6 - .3 : -1;
    if (titleA > .01) letters(ITEMS[3], 0, 0, L.size, { alpha: titleA, hero: rest, shine, maxW: 980, grp: 'fp21t.title' });
    ctx.restore();
  }
  /* EPISODE 21 pops in; THE INSPECTION types in */
  if (lt >= SUB.pill) {
    const p = back(sg(lt, SUB.pill, SUB.pill + .28), 2), rest = lt >= SUB.pill + .3;
    ctx.save(); ctx.translate(540, 446); ctx.scale(p, p);
    UI.pill('EPISODE 21', 0, 0, { size: 38, font: 'Nunito', weight: 900, fill: '#d3203a', ink: '#ffffff', stroke: '#ffffff', lw: 4, h: 64, padX: 28, spacing: 5, hero: rest, crop: !rest, id: 'fp21t.ep', shadow: 10 });
    ctx.restore();
  }
  if (lt >= SUB.type0) { const k = sg(lt, SUB.type0, SUB.type1); letters('THE INSPECTION', 540, 560, 96, { font: 'Lucky', reveal: k, hero: k >= 1, lwK: .13, grp: 'fp21t.sub', spacing: 3, shine: lt >= CUE.ding + .25 ? eIO(sg(lt, CUE.ding + .25, CUE.ding + 1)) * 1.6 - .3 : -1 }); }
  /* textding: four star glints round the title */
  const ds = lt - CUE.ding;
  if (ds > 0 && ds < 1.4) for (const [dx, dy, r, d] of [[-430, -60, 34, 0], [418, -54, 30, .12], [-300, 64, 22, .28], [360, 70, 26, .2]]) { const k = sg(ds, d, d + .55); star(TT.x + dx, TT.y + dy, r * Math.sin(PI * k), 1, k * .9); }
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'desk'; },
  cam(lt) {
    zoomTo(540, lp(1120, 940, eIO(sg(lt, TILT[0], TILT[1]))), 1 + .05 * eIO(sg(lt, 0, 6.8)));   /* the clipboard centred, then the camera tilts up with the title as it lifts */
    CAM.shake = 3.2 * (lt >= CUE.stamp ? ringK(lt - CUE.stamp, .07) : 0);
  },
  draw: titleDraw,
  fx(lt) {
    const fin = lt < .2 ? 1 - lt / .2 : 0, fout = sg(lt, 6.62, 6.8), ds = lt - CUE.ding, st = lt >= CUE.stamp ? ringK(lt - CUE.stamp, .12) : 0;
    return { bloom: .36 + .16 * st + (ds > 0 ? .2 * ringK(ds, .4) : 0), vignette: .3, grain: .045, contrast: .08, sat: .04, tint: [['#24435f', .08, 'soft-light']], aberr: 0, fade: Math.max(fin, fout), fadeColor: '6,10,20' };
  },
  blur(lt) { return (lt >= LIFT[0] + .02 && lt < LIFT[1] - .02) ? 9 : 1; },
  over() {},
  label: () => '',
};
window.__EP21_SCENES.title = TITLE;

// ====================================================================================================================================================================
// END (7.5 s, noScrim, noChyron): THE STATEMENT OF DEFICIENCIES AND PLAN OF CORRECTION. A state survey form (a parody of the real one) on a dark desk: provider FRUIT SALAD NURSING AND REHAB, the columns TAG / SUMMARY
// STATEMENT OF DEFICIENCIES / PLAN OF CORRECTION, one finding typed in from the typing cue; a red CORRECTED stamp; five cast chips at the foot of the form (Ms. Kale and Mr. Radish included); the teaser strip.
// Cues (scene-local, snapped to frames): theme21 .1 | typing 1.1 | stamp 4.0 | textding 5.1.
//   0.00-0.10  fade up; a slow push-in (zoom 1 to 1.03) holds the whole card calm.   0.30-0.90  the five cast chips pop in, one after another (they blink and breathe).
//   1.10-3.90  typing: F725 / SUFFICIENT NURSING STAFF, the summary statement, "Which nurse?" (red), the plan of correction, "Completed." (a caret rides the typing).
//   4.00       stamp: CORRECTED slams into the empty foot of the plan column (H21.stamp), a small camera bump.   5.10 textding: the teaser strip rises: NEXT: EPISODE 22 / THE SECRET SANTA, a glint, star glints.
//   7.20-7.50  a dip to black.
// ====================================================================================================================================================================
const SE = snapOf('end');
const E = { type: SE(1.1), stamp: SE(4.0), ding: SE(5.1) };
const PP = { x: 46, y: 64, w: 988, h: 1380, rot: -.008 };                               /* the paper */
const COL = [66, 300, 690, 1014], TB = { y0: 412, yh: 512, y1: 1110 }, SG = { y0: 1126, y1: 1226, sign: [4.42, 4.95] };   /* the table: column edges, top, header bottom, bottom; the signature row */
const RATE = 92;                                                                         /* characters typed per second */
const BLOCKS = [
  { key: 'tag', str: 'F725', x: COL[0] + 20, y: 592, w: COL[1] - COL[0] - 40, o: { size: 54, weight: 900, fill: '#1b2340' } },
  { key: 'tagn', str: 'SUFFICIENT\nNURSING\nSTAFF', x: COL[0] + 20, y: 664, w: COL[1] - COL[0] - 30, o: { size: 31, weight: 900, fill: '#1b2340', lh: 1.32 } },
  { key: 'sum', str: 'Based on observation and interview, the facility failed to ensure the nurse took a break. The nurse (one) stated:', x: COL[1] + 20, y: 588, w: COL[2] - COL[1] - 38, o: { size: 34, weight: 800, fill: '#1b2340', lh: 1.3 } },
  { key: 'quote', str: '"Which nurse?"', x: COL[1] + 20, y: 0, w: COL[2] - COL[1] - 38, o: { size: 40, weight: 900, italic: true, fill: '#b0162a' }, after: 'sum', gap: 22 },
  { key: 'plan', str: 'The nurse took a break at 10:59 PM for one minute.', x: COL[2] + 20, y: 588, w: COL[3] - COL[2] - 34, o: { size: 34, weight: 800, fill: '#1b2340', lh: 1.3 } },
  { key: 'done', str: 'Completed.', x: COL[2] + 20, y: 0, w: COL[3] - COL[2] - 34, o: { size: 36, weight: 900, fill: '#1d6b3a' }, after: 'plan', gap: 24 },
];
/* the schedule: each block starts when the one before it is typed (a short breath between) */
const SCHED = (() => { let t = 0; return BLOCKS.map(b => { const n = b.str.length + 2, s = { t0: t, t1: t + n / RATE }; t = s.t1 + .08; return s; }); })();
function typeBlock(b, chars) {
  const st = Object.assign({ font: 'Nunito' }, b.o), lines = UI.wrap(b.str, b.w, st), size = lines.size, pitch = size * (b.o.lh || 1.3);
  let used = 0, caret = null;
  lines.forEach((ln, i) => {
    const n = ln.length, r = cl((chars - used) / Math.max(1, n));
    if (r > 0) {
      UI.write(ln, b.x, b.y + i * pitch, Object.assign({}, st, { size, reveal: r, align: 'left', maxW: 0, lh: undefined }));
      if (r < 1) caret = [b.x + UI.sizeOf(ln.slice(0, Math.ceil(n * r)), Object.assign({}, st, { size })).w + 5, b.y + i * pitch, size];
    }
    used += n + 1;
  });
  return { bottom: b.y + (lines.length - 1) * pitch + size * .3, caret, last: [b.x + UI.sizeOf(lines[lines.length - 1] || '', Object.assign({}, st, { size })).w + 5, b.y + (lines.length - 1) * pitch, size] };
}
/* the paper and the printed form (lines, bands, boxes): cached once, no text in it */
let paperCv = null;
function paperSprite() {
  if (paperCv) return paperCv;
  const c = paperCv = mkcv(1080, 1520), g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(14px)'; g.fillRect(PP.x + 10, PP.y + 18, PP.w, PP.h); g.filter = 'none';
  let gr = g.createLinearGradient(0, PP.y, 0, PP.y + PP.h); gr.addColorStop(0, '#fbfbf7'); gr.addColorStop(1, '#f1f0e8'); g.fillStyle = gr; g.fillRect(PP.x, PP.y, PP.w, PP.h);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(120,110,90,${.03 + .04 * rnd(5201, i)})`; g.fillRect(PP.x + rnd(5202, i) * PP.w, PP.y + rnd(5203, i) * PP.h, 1 + 2 * rnd(5204, i), 1 + 2 * rnd(5205, i)); }
  const ink = '#1f3270';
  g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(66, 258); g.lineTo(1014, 258); g.moveTo(66, 266); g.lineTo(1014, 266); g.stroke();
  g.lineWidth = 2.4; g.strokeRect(66, 284, 948, 108); g.beginPath(); g.moveTo(656, 284); g.lineTo(656, 392); g.moveTo(846, 284); g.lineTo(846, 392); g.stroke();
  g.fillStyle = ink; g.fillRect(COL[0], TB.y0, COL[3] - COL[0], TB.yh - TB.y0);
  g.lineWidth = 2.6; g.strokeRect(COL[0], TB.y0, COL[3] - COL[0], TB.y1 - TB.y0); g.beginPath(); for (const x of [COL[1], COL[2]]) { g.moveTo(x, TB.y0); g.lineTo(x, TB.y1); } g.stroke();
  g.strokeStyle = 'rgba(31,50,112,.16)'; g.lineWidth = 1.4; g.beginPath(); for (let y = TB.yh + 40; y < TB.y1 - 10; y += 40) { g.moveTo(COL[0] + 8, y); g.lineTo(COL[3] - 8, y); } g.stroke();
  g.strokeStyle = ink; g.lineWidth = 2.4; g.strokeRect(66, SG.y0, 948, SG.y1 - SG.y0); g.beginPath(); g.moveTo(COL[2], SG.y0); g.lineTo(COL[2], SG.y1); g.stroke();
  g.strokeStyle = 'rgba(31,50,112,.35)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(90, SG.y1 - 22); g.lineTo(COL[2] - 24, SG.y1 - 22); g.stroke();
  g.fillStyle = 'rgba(200,40,60,.07)'; g.beginPath(); g.arc(976, 104, 30, 0, TAU); g.fill(); g.strokeStyle = 'rgba(31,50,112,.35)'; g.lineWidth = 2.6; g.beginPath(); g.arc(976, 104, 26, 0, TAU); g.stroke(); g.beginPath(); g.arc(976, 104, 19, 0, TAU); g.stroke();
  return c;
}
const CHIPS = [
  { name: 'MS. KALE', role: 'STATE', mk: t => window.A21 && A21.kale ? A21.kale({ t, expr: 'kale_satisfied', pose: 'rest', badge21: false }) : null, bg: '#dcebd2' },
  { name: 'MR. RADISH', role: 'STATE', mk: t => window.A21 && A21.radish ? A21.radish({ t, pose: 'rest', scanner: .5, badge21: false }) : null, bg: '#f6dbe0' },
  { name: 'STRAWBERRY', role: 'THE NURSE (ONE)', mk: t => window.A11 ? A11.straw({ t, expr: 'weak' }) : null, bg: '#ffe3e7' },
  { name: 'ONION', role: 'COMPLIANCE', mk: t => window.A15 && A15.onion ? A15.onion({ t, pose: 'rest', expr: 'onion_cry', cry: .5 }) : null, bg: '#f7eed6' },
  { name: 'BRENDA', role: 'ON BREAK SINCE 2019', mk: t => window.A13 && A13.brenda ? A13.brenda({ t, expr: 'brenda_relief' }) : null, bg: '#e9def2' },
];
function endChips(lt) {
  CHIPS.forEach((ch, i) => {
    const cx = 150 + i * 195, cy = 1316, R = 56, p = back(sg(lt, .3 + i * .12, .3 + i * .12 + .3), 1.8);
    if (p <= .01) return;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p); ctx.translate(-cx, -cy);
    ctx.fillStyle = ch.bg; ctx.strokeStyle = '#1f3270'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    const o = ch.mk(lt);
    if (o) {
      const k = KINDS[o.kind], s = 46 / k.rx, fy = (k.eyeY + k.mouthY) / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, TAU); ctx.clip();
      drawChar(Object.assign(o, { x: cx, y: cy + 8 - fy * s + k.ry * .9 * s, s, noLegs: true, noShadow: true, noReflect: true, arms: { l: 'none', r: 'none' }, hold: {}, look: [0, .1], transit: p < 1 }));
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    const rest = p >= 1;
    UI.label(ch.name, cx, cy + R + 26, { font: 'Nunito', weight: 900, size: 25, fill: '#1b2340', hero: false, crop: !rest, maxW: 180, grp: 'fp21t.chips' });
    UI.label(ch.role, cx, cy + R + 54, { font: 'Nunito', weight: 800, size: 18, fill: '#6a3a8a', hero: false, crop: !rest, maxW: 182, grp: 'fp21t.chips' });
    ctx.restore();
  });
}
function endForm(lt) {
  const ho = { hero: true };
  UI.label('DEPARTMENT OF HEALTH', 540, 112, Object.assign({ font: 'Nunito', weight: 900, size: 30, spacing: 5, fill: '#4a5a80', maxW: 760 }, ho));
  UI.label('STATEMENT OF DEFICIENCIES', 540, 170, Object.assign({ font: 'Nunito', weight: 900, size: 50, spacing: 1, fill: '#1f3270', maxW: 900 }, ho));
  UI.label('AND PLAN OF CORRECTION', 540, 228, Object.assign({ font: 'Nunito', weight: 900, size: 50, spacing: 1, fill: '#1f3270', maxW: 900 }, ho));
  const cell = (lab, val, x0, x1) => { UI.label(lab, x0 + 14, 310, { font: 'Nunito', weight: 900, size: 20, spacing: 2, fill: '#7a86a6', align: 'left', hero: false, maxW: x1 - x0 - 30 }); UI.label(val, x0 + 14, 360, { font: 'Nunito', weight: 900, size: 33, fill: '#1b2340', align: 'left', maxW: x1 - x0 - 24 }); };
  cell('NAME OF PROVIDER', 'FRUIT SALAD NURSING AND REHAB', 66, 656); cell('SURVEY DATE', '11/6', 656, 846); cell('SHIFT', '3 TO 11', 846, 1014);
  const hc = (str, cx, y) => UI.label(str, cx, y, { font: 'Nunito', weight: 900, size: 31, fill: '#ffffff', maxW: 376 });
  hc('TAG', (COL[0] + COL[1]) / 2, 462); hc('SUMMARY STATEMENT', (COL[1] + COL[2]) / 2, 443); hc('OF DEFICIENCIES', (COL[1] + COL[2]) / 2, 481); hc('PLAN OF', (COL[2] + COL[3]) / 2, 443); hc('CORRECTION', (COL[2] + COL[3]) / 2, 481);
  /* the typing */
  const tt = lt - E.type, res = {};
  let caret = null;
  BLOCKS.forEach((b, i) => {
    if (b.after && res[b.after]) b.y = res[b.after].bottom + b.gap + b.o.size * .74;
    const chars = (tt - SCHED[i].t0) * RATE;
    if (chars <= 0) return;
    const r = typeBlock(b, chars); res[b.key] = r;
    if (r.caret) caret = r.caret; else if (tt < SCHED[i].t1 + .08) caret = r.last;
  });
  /* the signature row: the surveyor signs after the stamp (a blue ink flourish drawn on; no lettering), the date typed beside it */
  UI.label('SURVEYOR SIGNATURE', 84, SG.y0 + 24, { font: 'Nunito', weight: 900, size: 20, spacing: 2, fill: '#7a86a6', align: 'left', hero: false, maxW: 400 });
  UI.label('DATE CORRECTED', COL[2] + 18, SG.y0 + 24, { font: 'Nunito', weight: 900, size: 20, spacing: 2, fill: '#7a86a6', align: 'left', hero: false, maxW: 290 });
  const sk = sg(lt, SG.sign[0], SG.sign[1]);
  if (sk > 0) {
    const pts = []; for (let i = 0; i <= 90; i++) { const u = i / 90, x = 150 + u * 400, y = SG.y1 - 36 - 13 * Math.sin(u * 23) * Math.exp(-u * 1.4) - 6 * Math.sin(u * 7.3 + 1) + (u > .8 ? -40 * (u - .8) : 0); pts.push([x + 12 * Math.sin(u * 23 + .6), y]); }
    const n = Math.max(2, Math.round(pts.length * sk)); ctx.save(); ctx.strokeStyle = '#2346a8'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); for (let i = 0; i < n; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); ctx.stroke(); ctx.restore();
    UI.write('11/6 11:00 PM', COL[2] + 18, SG.y1 - 26, { font: 'Nunito', weight: 900, size: 33, fill: '#1b2340', reveal: sk, align: 'left' });
  }
  if (!caret && tt > 0 && tt < SCHED[SCHED.length - 1].t1 + .7 && res.done) { const L2 = res.done.last; if (Math.floor((tt - SCHED[SCHED.length - 1].t1) * 4) % 2 === 0) caret = L2; }
  if (caret) { ctx.fillStyle = 'rgba(27,35,64,.85)'; ctx.fillRect(caret[0], caret[1] - caret[2] * .78, caret[2] * .14, caret[2] * .86); }
}
function endTeaser(lt) {
  const p = sg(lt, E.ding, E.ding + .4), ds = lt - E.ding;
  if (p <= 0) return;
  const rest = p >= 1, X = 70, Y = 1506, Wt = 940, Ht = 236, cx = 540;
  ctx.save(); ctx.globalAlpha *= sg(p, 0, .3); ctx.translate(0, (1 - eO(p)) * 80);
  UI.panel([X, Y, Wt, Ht], { r: 20, fill: ['#d22b3f', '#8e1222'], stroke: '#ffffff', lw: 5, shadow: 22, id: 'fp21t.teaser' });
  ctx.save(); ctx.globalAlpha *= .9;
  for (const [gx, gy, rt] of [[X + 74, Y + Ht / 2 + 6, -.12], [X + Wt - 74, Y + Ht / 2 + 6, .1]]) {   /* two little gifts */
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(rt); ctx.fillStyle = '#2f9a52'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.fillRect(-30, -24, 60, 50); ctx.strokeRect(-30, -24, 60, 50);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(-6, -24, 12, 50); ctx.fillRect(-30, -4, 60, 10); ctx.beginPath(); ctx.ellipse(-10, -30, 11, 7, -.5, 0, TAU); ctx.ellipse(10, -30, 11, 7, .5, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  UI.label('NEXT: EPISODE 22', cx, Y + 52, { font: 'Nunito', weight: 900, size: 32, spacing: 6, fill: '#ffe6ea', cid: 'fp21t.teaser', hero: rest, crop: !rest, maxW: Wt - 260 });
  letters(TEASER22, cx, Y + 150, 92, { face: [[0, '#ffffff'], [.5, '#fff3f4'], [.52, '#ffe1e5'], [1, '#ffc9d0']], ink: '#4e0610', hero: rest, maxW: Wt - 240, shine: ds > .25 ? eIO(sg(ds, .25, 1.05)) * 1.6 - .3 : -1, grp: 'fp21t.teaser' });
  ctx.restore();
  if (ds > 0 && ds < 1.6) for (const [dx, dy, r, d] of [[-Wt / 2 + 30, -Ht / 2 + 14, 30, .1], [Wt / 2 - 20, -Ht / 2 + 26, 26, .22], [-Wt / 2 + 220, Ht / 2 - 8, 22, .34], [Wt / 2 - 230, Ht / 2 - 12, 26, .28]]) { const k = sg(ds, d, d + .55); star(cx + dx, Y + Ht / 2 + dy, r * Math.sin(PI * k), 1, k * .8); }
}
function endDraw(lt) {
  ctx.fillStyle = '#18233a'; ctx.fillRect(-200, -200, 1480, 2320);
  { const g = ctx.createRadialGradient(540, 760, 120, 540, 900, 1250); g.addColorStop(0, '#2b3d5e'); g.addColorStop(1, '#0f1626'); ctx.fillStyle = g; ctx.fillRect(-200, -200, 1480, 2320); }
  ctx.save(); ctx.translate(540, 754); ctx.rotate(PP.rot); ctx.translate(-540, -754);
  ctx.drawImage(paperSprite(), 0, 0);
  endForm(lt);
  if (window.H21 && H21.stamp && lt >= E.stamp - .2) H21.stamp(ctx, { x: 852, y: 1000, s: 1, size: 60, rot: -.13, text: 'CORRECTED', t: lt, t0: E.stamp, color: '#d3203a', id: 'fp21t.corrected' });
  endChips(lt);
  ctx.restore();
  endTeaser(lt);
}
const END = {
  noChyron: true, noScrim: true,
  shot() { return 'form'; },
  cam(lt) {
    zoomTo(540, 930, 1 + .03 * eIO(sg(lt, 0, 7.5)));
    CAM.shake = 2.6 * (lt >= E.stamp ? ringK(lt - E.stamp, .07) : 0);
  },
  draw: endDraw,
  fx(lt) {
    const fin = lt < .1 ? 1 - lt / .1 : 0, fout = sg(lt, 7.2, 7.5), st = lt >= E.stamp ? ringK(lt - E.stamp, .12) : 0, dd = lt >= E.ding ? ringK(lt - E.ding, .5) : 0;
    return { bloom: .3 + .14 * st + .16 * dd, vignette: .22, grain: .045, contrast: .06, sat: .04, aberr: 0, tint: [['#1a2c58', .06, 'soft-light']], fade: Math.max(fin, fout), fadeColor: '6,10,20' };
  },
  blur(lt) { return 1; },
  over() {},
  label: () => 'THANKS FOR WATCHING',
};
window.__EP21_SCENES.end = END;
})();
