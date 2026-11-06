'use strict';
/* SHIFT HAPPENS, Episode 22: The Secret Santa. Scene module ART cards: `title` (6.8 s) and `end` (7.5 s), registered on window.__EP22_SCENES. Prefix for anything new: fp22t_. Every string goes through the UI kit, live each
 * frame (cached sprites hold no text). Uses the Episode 22 kit (A22.stringLights, A22.paperPrint, A22.bow, A22.tree), guarded at draw time, with plain stand-ins.
 *
 * TITLE (noChyron, noScrim): a wrapped gift on a table under warm string lights; red paper with gold trees, a gold ribbon, a red bow, a tag TO: THE 3-11. Cues (scene-local s, cues.py 22 title, snapped to frames):
 * theme22 .2 | ribbonpull 1.1 | paperrip 1.8, 2.3 | jinglebells 2.8 | textding 5.2.
 *   0.00-0.20  fade up on the gift, close (zoom 1.22); the lights twinkle slowly (never in sync, never off).
 *   1.10       ribbonpull: the gold ribbon is yanked up and away along its own path (it slides off the box front and over the lid, the tail whips out of frame by 1.75).
 *   1.80 / 2.30  paperrip: the front paper tears down a ragged line; the left half, then the right half, peel off like doors and fly out (white backs, ragged white edges), scraps flutter down;
 *              under it, a kraft cardboard box.   2.40-3.40 the camera eases out to the full frame (and stays still to the end: the match cut).
 *   2.55-2.90  the lid pops up and to the right, light pours out of the box; 2.80 jinglebells: a burst of gold sparkles; 2.75-3.55 SHIFT HAPPENS rises out of the box to the top of the frame.
 *   3.25-3.80  the lid drops back and lands ajar with a bounce: its red bow comes to rest centred at (540, 760), about 300 px wide.   3.80 EPISODE 22 pops in, 4.10-4.90 THE SECRET SANTA types in.
 *   5.20       textding: a glint sweeps the title, star glints.   6.50-6.80 MATCH CUT OUT: everything holds; the red bow at (540, 760) (the draw opens on Tomato's red Santa hat there).
 * END: see the second half of this file. */
(() => {
/* the title of the next episode, shown in the end card's teaser (the lead confirms it: change this one constant) */
const TEASER23 = "NEW YEAR'S EVE";
if (!window.TIMELINE_EP22 || !window.UI || !window.H6) return;
const { zoomTo } = window.H6;
window.__EP22_SCENES = window.__EP22_SCENES || {};
const TLX = window.TIMELINE_EP22;
const PI = Math.PI, TAU = PI * 2;
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const ss = k => { k = cl(k); return k * k * (3 - 2 * k); };
const eIO = k => { k = cl(k); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
const eO = k => 1 - Math.pow(1 - cl(k), 3);
const back = (k, s = 1.7) => { k = cl(k); const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const ringK = (age, tau) => age < 0 ? 0 : Math.exp(-age / tau);
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : hash(s * 3.17 + k * 11.3 + 1.3);
const OUTL = 'rgba(25,10,20,.92)';
const startOf = id => (TLX.scenes.find(s => s.id === id) || { start: 0 }).start;
const snapOf = id => { const S0 = startOf(id); return t => Math.round((S0 + t) * 30) / 30 - S0; };
const mkcv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.__txOK = true; return c; };
const K22 = () => (window.A22 && A22.paperPrint) ? A22 : null;
const lgr = (x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
const rgr = (x, y, r0, r1, stops) => { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };

/* the lettering: a soft drop shadow, an outline, a face with a gloss, a sweeping shine. Only the face is the string the viewer reads (hero when o.hero); the other layers are copies (hero false, crop, one group). */
function letters(str, cx, cy, size, o = {}) {
  const font = o.font || 'Bangers', sp = o.spacing ?? size * .03, cap = UI.metrics(font).cap * size, al = o.alpha ?? 1, lw = size * (o.lwK ?? .14), ink = o.ink || '#4e0610', reveal = o.reveal ?? 1;
  if (al <= .004 || size < 2 || reveal <= 0) return null;
  const common = { font, size, spacing: sp, grp: o.grp || 'fp22t:' + str, tilt: .35, hero: false, crop: true, reveal, maxW: o.maxW };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv, alpha: al }, extra));
  const vg = stops => { const g = ctx.createLinearGradient(0, cy - cap * .55, 0, cy + cap * .55); for (const [s, c] of stops) g.addColorStop(s, c); return g; };
  if (o.shadow !== false) L(size * .035, size * .07, 'rgba(30,6,10,.45)', 'rgba(30,6,10,.45)', lw * 1.3, { shadow: size * .1, alpha: al * (o.shadowA ?? 1) });
  L(0, 0, ink, ink, lw);
  const box = UI.label(str, cx, cy, Object.assign({}, common, { fill: vg(o.face || [[0, '#fffdf4'], [.5, '#fff6dc'], [.52, '#ffe8a8'], [1, '#f5c64a']]), lw: 0, alpha: al, hero: !!o.hero, crop: !o.hero }));
  const gl = o.gloss ?? .55; if (gl > 0) L(0, 0, vg([[0, `rgba(255,255,255,${gl})`], [.45, `rgba(255,255,255,${(gl * .11).toFixed(3)})`], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), undefined, 0, {});
  if (o.shine != null && o.shine > -.3 && o.shine < 1.3 && box) {
    const x = lp(box.x0 - cap * .6, box.x1 + cap * .6, o.shine), g = ctx.createLinearGradient(x - cap * .5, cy - cap, x + cap * .5, cy);
    for (const [s, a] of [[0, 0], [.38, 0], [.5, .9], [.62, 0], [1, 0]]) g.addColorStop(s, `rgba(255,255,255,${a})`);
    L(0, 0, g, undefined, 0, {});
  }
  return box;
}
function star(x, y, r, a, rot = 0) {   /* a four-point glint (screen blend) */
  if (a <= .01 || r <= .5) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(255,248,220,.95)'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * PI / 4, rr2 = i % 2 ? r * .18 : r; ctx.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgr(0, 0, 0, r * .6, [[0, 'rgba(255,255,255,.9)'], [1, 'rgba(255,240,200,0)']]); ctx.beginPath(); ctx.arc(0, 0, r * .6, 0, TAU); ctx.fill();
  ctx.restore();
}

// ====================================================================================================================================================================
const ST = snapOf('title');
const CUE = { theme: ST(.2), pull: ST(1.1), rip1: ST(1.8), rip2: ST(2.3), bells: ST(2.8), ding: ST(5.2) };
const BOX = { x0: 270, x1: 810, y0: 906, y1: 1290 };                     /* the box front (the lid band sits on top of it) */
const LID = { w: 560, band: 70, dd: 64, bowR: 172 };                       /* the lid: band height, the top face's depth; the bow's size (about 300 px wide) */
const PAPER = ['trees', '#b81f2c', '#f2d27a'];                            /* red paper, gold trees */
const RIB = '#e8b93a', BOWC = '#e3263a';
const POP = { up: [CUE.bells - .25, CUE.bells + .1], hang: CUE.bells + .4, down: [CUE.bells + .45, CUE.bells + .75], bounce: [CUE.bells + .75, CUE.bells + 1.05] };
const RISE = [CUE.bells - .05, CUE.bells + .75];                           /* SHIFT HAPPENS rises out of the box */
const SUB = { pill: CUE.bells + 1.0, type0: CUE.bells + 1.3, type1: CUE.bells + 2.1 };
const CAMT = [CUE.rip2 + .1, CUE.rip2 + 1.1];
const TT = { x: 540, y: 300, size: 150 };                                  /* the title's resting place */
/* the lid's pose: closed, popped (up and to the right, tumbling), then ajar with its bow at exactly (540, 760) */
const AJAR = (() => { const th = -.07, bowY = -LID.band - LID.dd / 2; return { th, x: 540 + bowY * Math.sin(th), y: 760 - bowY * Math.cos(th) }; })();
function lidPose(lt) {
  const closed = { x: 540, y: BOX.y0, th: 0 };
  if (lt < POP.up[0]) return closed;
  const u = eO(sg(lt, POP.up[0], POP.up[1])), d = sg(lt, POP.down[0], POP.down[1]), b = sg(lt, POP.bounce[0], POP.bounce[1]);
  const peak = { x: 700, y: BOX.y0 - 330, th: .42 };
  if (lt < POP.down[0]) { const hang = sg(lt, POP.up[1], POP.down[0]); return { x: lp(closed.x, peak.x, u) + 8 * hang, y: lp(closed.y, peak.y, u) - 14 * Math.sin(PI * hang), th: lp(0, peak.th, u) + .05 * hang }; }
  const k = d * d;   /* it falls */
  const x = lp(peak.x + 8, AJAR.x, k), y = lp(peak.y, AJAR.y, k), th = lp(peak.th + .05, AJAR.th, ss(d));
  const bump = b > 0 && b < 1 ? -26 * Math.sin(PI * b) * (1 - b) : 0;
  return { x, y: y + bump, th: th + (b > 0 && b < 1 ? .03 * Math.sin(PI * b * 2) * (1 - b) : 0) };
}

/* the room: a warm wall, a soft window of light behind the gift, out-of-focus lights, the table (one cached sprite, no text) */
let roomCv = null;
function roomSprite() {
  if (roomCv) return roomCv;
  const c = roomCv = mkcv(1080, 1920), g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, 1240); gr.addColorStop(0, '#5b2e2a'); gr.addColorStop(.6, '#7a3f2e'); gr.addColorStop(1, '#8c4d33'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1260);
  gr = g.createRadialGradient(540, 760, 60, 540, 820, 760); gr.addColorStop(0, 'rgba(255,214,150,.55)'); gr.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1260);
  for (let i = 0; i < 26; i++) {   /* bokeh: blurred warm lights of a tree far behind */
    const x = 60 + rnd(2201, i) * 960, y = 420 + rnd(2202, i) * 640, r = 22 + rnd(2203, i) * 30, col = ['255,200,120', '255,120,110', '140,220,150', '150,190,255', '255,230,170'][i % 5];
    const b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, `rgba(${col},.32)`); b.addColorStop(.7, `rgba(${col},.18)`); b.addColorStop(1, `rgba(${col},0)`); g.fillStyle = b; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  gr = g.createLinearGradient(0, 1180, 0, 1400); gr.addColorStop(0, '#a8714a'); gr.addColorStop(1, '#c4895a'); g.fillStyle = gr; g.fillRect(0, 1200, 1080, 200);   /* the table top */
  g.strokeStyle = 'rgba(90,50,26,.25)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { const y = 1210 + i * 13 + rnd(2210, i) * 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + 6 * rnd(2211, i), 700, y - 6, 1080, y + 3); g.stroke(); }
  gr = g.createLinearGradient(0, 1400, 0, 1920); gr.addColorStop(0, '#8a5634'); gr.addColorStop(1, '#6a3f26'); g.fillStyle = gr; g.fillRect(0, 1400, 1080, 520);   /* its front */
  g.fillStyle = 'rgba(255,230,190,.35)'; g.fillRect(0, 1398, 1080, 4);
  gr = g.createRadialGradient(540, 1300, 40, 540, 1300, 420); gr.addColorStop(0, 'rgba(255,220,170,.35)'); gr.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = gr; g.fillRect(0, 1100, 1080, 400);
  return c;
}
/* the rip: a ragged line down the front paper (fixed points), and the two halves as polygons */
const RIP = (() => { const P = []; for (let i = 0; i <= 16; i++) { const u = i / 16, y = lp(BOX.y0, BOX.y1, u), x = lp(566, 512, u) + (i % 2 ? 1 : -1) * (6 + 9 * rnd(2230, i)) * (i > 0 && i < 16 ? 1 : 0); P.push([x, y]); } return P; })();
function ripPath(side) {
  ctx.beginPath();
  if (side < 0) { ctx.moveTo(BOX.x0, BOX.y0); for (const [x, y] of RIP) ctx.lineTo(x, y); ctx.lineTo(BOX.x0, BOX.y1); }
  else { ctx.moveTo(BOX.x1, BOX.y0); for (const [x, y] of RIP) ctx.lineTo(x, y); ctx.lineTo(BOX.x1, BOX.y1); }
  ctx.closePath();
}
function paperFace(x0, y0, w, h) {   /* the print (the kit's, or a plain red stand-in) */
  const K = K22(); if (K) K.paperPrint(PAPER[0], PAPER[1], PAPER[2])(ctx, w, h); else { ctx.fillStyle = PAPER[1]; ctx.fillRect(0, 0, w, h); }
}
/* one half of the front paper: hinged at its outer edge it swings open toward us (its white back shows), drops and flies out */
function paperHalf(side, lt, t0) {
  const u = sg(lt, t0, t0 + .62), hx = side < 0 ? BOX.x0 : BOX.x1, jolt = lt >= t0 && lt < t0 + .08 ? 1 : 0;
  if (u >= 1) return;
  const ang = eIO(u) * 2.5, sx = Math.cos(ang), dx = side * -u * u * 0 + side * (u * u * 520), dy = u * u * 420 - 30 * Math.sin(PI * Math.min(1, u * 2)), rot = side * u * .55;
  ctx.save(); ctx.translate(hx + dx, BOX.y0 + dy); ctx.rotate(rot); ctx.scale(Math.abs(sx) < .02 ? .02 : sx, 1 + .04 * Math.sin(PI * u)); ctx.translate(-hx, -BOX.y0);
  if (jolt && u < .1) ctx.translate(side * 3, -2);
  ripPath(side);
  if (sx > 0) {
    ctx.save(); ctx.clip(); ctx.translate(BOX.x0, BOX.y0); paperFace(0, 0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); ctx.restore();
    ctx.fillStyle = `rgba(30,0,8,${(.35 * (1 - sx)).toFixed(3)})`; ripPath(side); ctx.fill();
    ctx.fillStyle = lgr(hx, 0, 540, 0, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,.12)']]); ripPath(side); ctx.fill();   /* the paper bulges as it lifts */
  } else { ctx.fillStyle = lgr(hx, 0, 540, 0, [[0, '#e9e2d4'], [1, '#fbf8f0']]); ctx.fill(); }
  ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ripPath(side); ctx.stroke();
  ragged(side, 1);
  ctx.restore();
}
function ragged(side, a) {   /* the white fibrous edge along the rip */
  ctx.save(); ctx.strokeStyle = `rgba(252,248,238,${a})`; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.beginPath(); RIP.forEach(([x, y], i) => i ? ctx.lineTo(x + side * 2.5, y) : ctx.moveTo(x + side * 2.5, y)); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,190,170,.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < RIP.length - 1; i++) { const [x, y] = RIP[i]; for (let j = 0; j < 3; j++) { const yy = y + j * 7, xx = x + side * 4; ctx.moveTo(xx, yy); ctx.lineTo(xx + side * (3 + 3 * rnd(2240 + side, i * 3 + j)), yy + 2); } } ctx.stroke();
  ctx.restore();
}
/* scraps: little bits of paper torn loose at each rip, red on one side and white on the other, tumbling down */
function scraps(lt) {
  for (const [t0, side, seed] of [[CUE.rip1, -1, 2250], [CUE.rip2, 1, 2260]]) {
    const age = lt - t0; if (age < 0 || age > 1.6) continue;
    for (let i = 0; i < 12; i++) {
      const p = RIP[1 + Math.floor(rnd(seed, i) * 14)], vx = side * (120 + 260 * rnd(seed + 1, i)), vy = -180 - 220 * rnd(seed + 2, i), g = 900, x = p[0] + vx * age, y = p[1] + vy * age + .5 * g * age * age;
      if (y > 1400) continue;
      const sp = rnd(seed + 3, i) * 14 - 7, a = age * sp, flip = Math.cos(age * (5 + 6 * rnd(seed + 4, i))), sz = 10 + 12 * rnd(seed + 5, i);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(1, Math.abs(flip) < .1 ? .1 : flip);
      ctx.fillStyle = flip > 0 ? PAPER[1] : '#f6f1e6'; ctx.beginPath(); ctx.moveTo(-sz, -sz * .4); ctx.lineTo(sz * .8, -sz * .7); ctx.lineTo(sz * .5, sz * .6); ctx.lineTo(-sz * .6, sz * .5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(40,10,20,.6)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
    }
  }
}
/* the kraft cardboard box under the paper, and its dark mouth with light pouring out once the lid is off */
function boxFront(lt, glow) {
  const { x0, x1, y0, y1 } = BOX;
  ctx.fillStyle = lgr(x0, 0, x1, 0, [[0, '#c99a62'], [.4, '#d8ad74'], [1, '#a77a48']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = 'rgba(120,80,40,.22)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = x0 + 9; x < x1; x += 11) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); } ctx.stroke();
  ctx.fillStyle = 'rgba(80,50,20,.18)'; ctx.fillRect(x0, y0, x1 - x0, 14);
  ctx.strokeStyle = 'rgba(70,40,15,.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';   /* THIS SIDE UP arrows, printed (no text) */
  for (const ax of [x0 + 70, x0 + 120]) { ctx.beginPath(); ctx.moveTo(ax, y1 - 50); ctx.lineTo(ax, y1 - 110); ctx.moveTo(ax - 14, y1 - 92); ctx.lineTo(ax, y1 - 110); ctx.lineTo(ax + 14, y1 - 92); ctx.stroke(); }
  ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  if (glow > .01) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgr(540, y0 - 30, 20, 420, [[0, `rgba(255,236,170,${(.65 * glow).toFixed(3)})`], [1, 'rgba(255,200,120,0)']]); ctx.fillRect(x0 - 240, y0 - 460, x1 - x0 + 480, 500); ctx.restore(); }
}
function boxMouth(glow) {   /* the open top of the box (seen when the lid is off): dark inside, a warm light */
  const { x0, x1, y0 } = BOX, dd = LID.dd * .85;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1 - 34, y0 - dd); ctx.lineTo(x0 + 34, y0 - dd); ctx.closePath();
  ctx.fillStyle = lgr(0, y0 - dd, 0, y0, [[0, '#2a140c'], [1, '#5a3418']]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = rgr(540, y0 - dd * .4, 10, 300, [[0, `rgba(255,240,190,${(.9 * glow).toFixed(3)})`], [1, 'rgba(255,190,110,0)']]); ctx.fillRect(x0, y0 - dd, x1 - x0, dd); ctx.restore();
  ctx.strokeStyle = OUTL; ctx.lineWidth = 3.6; ctx.stroke();
}
/* the lid: band + top face in red paper, the gold ribbon cross on it until it is pulled, the red bow, the tag on a string */
function lid(lt, P, ribbonOn) {
  const hw = LID.w / 2, bw = hw * .86, { band, dd } = LID;
  ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(P.th); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(20,6,10,.25)'; ctx.fillRect(-hw + 6, 4, LID.w, 12);
  ctx.save(); ctx.beginPath(); ctx.rect(-hw, -band, LID.w, band); ctx.clip(); ctx.translate(-hw, -band); paperFace(0, 0, LID.w, BOX.y1 - BOX.y0); ctx.restore();
  ctx.fillStyle = 'rgba(30,0,8,.18)'; ctx.fillRect(-hw, -band * .3, LID.w, band * .3);
  ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.strokeRect(-hw, -band, LID.w, band);
  ctx.beginPath(); ctx.moveTo(-hw, -band); ctx.lineTo(hw, -band); ctx.lineTo(bw, -band - dd); ctx.lineTo(-bw, -band - dd); ctx.closePath();
  ctx.save(); ctx.clip(); ctx.translate(-hw, -band - dd); ctx.scale(1, .45); paperFace(0, 0, LID.w, (BOX.y1 - BOX.y0)); ctx.restore();
  ctx.fillStyle = 'rgba(255,240,230,.14)'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.stroke();
  if (ribbonOn) {   /* the ribbon across the top (front to back) and down the band */
    ctx.fillStyle = lgr(-24, 0, 24, 0, [[0, '#b8891e'], [.5, RIB], [1, '#b8891e']]); ctx.fillRect(-24, -band, 48, band);
    ctx.beginPath(); ctx.moveTo(-24, -band); ctx.lineTo(24, -band); ctx.lineTo(20, -band - dd); ctx.lineTo(-20, -band - dd); ctx.closePath(); ctx.fillStyle = '#f2cc5a'; ctx.fill();
  }
  ctx.restore();
}
function bowAt(lt, P) {
  const by = -LID.band - LID.dd / 2, bx = P.x - by * Math.sin(P.th), byy = P.y + by * Math.cos(P.th), K = K22();
  if (K && K.bow) K.bow(ctx, { x: bx, y: byy, r: LID.bowR, color: BOWC, t: lt, seed: 4, rot: P.th - .04 });
  else { ctx.fillStyle = BOWC; ctx.beginPath(); ctx.arc(bx, byy, LID.bowR * .7, 0, TAU); ctx.fill(); }
  return [bx, byy];
}
/* the tag on a string from the bow: TO: THE 3-11 (hero while it hangs at the front) */
function tag(lt, bow, P) {
  const sw = Math.sin(lt * 1.7) * .05 + (lt > POP.up[0] && lt < POP.bounce[1] + .4 ? .25 * Math.sin((lt - POP.up[0]) * 7) * Math.exp(-(lt - POP.up[0]) * 2) : 0);
  const ax = bow[0] - 150, ay = bow[1] + 70, len = 120, tx = ax + Math.sin(sw) * len, ty = ay + Math.cos(sw) * len;
  ctx.strokeStyle = 'rgba(60,40,20,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bow[0] - 40, bow[1] + 20); ctx.quadraticCurveTo(ax, ay - 10, tx, ty - 24); ctx.stroke();
  const w = 250, h = 104, rot = sw * .6 - .06;
  ctx.save(); ctx.translate(tx, ty + h / 2 - 18); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(30,10,10,.25)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
  ctx.fillStyle = '#fbf3df'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 16); ctx.lineTo(-w / 2 + 22, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(-w / 2 + 22, -h / 2 + 20, 7, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(180,140,60,.6)'; ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
  UI.container('fp22t_tag', 'tag', [-w / 2 + 14, -h / 2 + 12, w / 2 - 14, h / 2 - 12], 4);
  UI.label('TO: THE 3-11', 8, 4, { font: 'Nunito', weight: 900, size: 38, fill: '#9c1426', hero: lt < POP.up[0] || lt > POP.bounce[1] + .2, crop: !(lt < POP.up[0] || lt > POP.bounce[1] + .2), maxW: w - 50, cid: 'fp22t_tag', tilt: .4 });
  ctx.restore();
}
/* the gold ribbon: it lies down the box front and over the lid to the bow; pulled, it slides along its own path up and out of frame (a rope pulled through its own track) */
const RPATH = (() => {   /* the track: from the box bottom up the front, over the lid to the bow, then the pull path up and away to the upper right */
  const P = [[540, BOX.y1], [540, BOX.y0 + 30], [540, BOX.y0 - LID.band], [540, BOX.y0 - LID.band - LID.dd * .5]];
  for (let i = 1; i <= 14; i++) { const u = i / 14; P.push([540 + 900 * u * u + 120 * Math.sin(u * PI), BOX.y0 - LID.band - LID.dd * .5 - 1500 * u]); }
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { P, L, len: L[3] };
})();
function trackAt(d) { const { P, L } = RPATH; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const u = cl((d - L[i - 1]) / ((L[i] - L[i - 1]) || 1)); return [lp(P[i - 1][0], P[i][0], u), lp(P[i - 1][1], P[i][1], u)]; }
function ribbon(lt) {
  const pulled = lt >= CUE.pull ? 3300 * Math.pow(sg(lt, CUE.pull, CUE.pull + .7), 1.6) : 0, len = RPATH.len;
  if (pulled > len + 1500) return;
  const n = 40, pts = [];
  for (let i = 0; i <= n; i++) { const d = pulled + len * i / n, p = trackAt(d), wob = pulled > 0 ? Math.sin(i * .5 - lt * 30) * 10 * Math.min(1, pulled / 200) : 0; pts.push([p[0] + wob, p[1]]); }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(60,40,0,.85)'; ctx.lineWidth = 54; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  ctx.strokeStyle = RIB; ctx.lineWidth = 48; ctx.stroke(); ctx.strokeStyle = 'rgba(255,248,210,.55)'; ctx.lineWidth = 10; ctx.stroke(); ctx.strokeStyle = 'rgba(150,100,10,.35)'; ctx.lineWidth = 2; ctx.setLineDash([2, 9]); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
/* the gold sparkle burst of jinglebells: stars thrown up out of the box, falling slowly, each fading */
function sparkles(lt) {
  const age = lt - CUE.bells; if (age < 0 || age > 2.2) return;
  for (let i = 0; i < 26; i++) {
    const a = -PI / 2 + (rnd(2270, i) - .5) * 2.2, v = 380 + 520 * rnd(2271, i), x = 540 + (rnd(2272, i) - .5) * 300 + Math.cos(a) * v * age, y = BOX.y0 - 40 + Math.sin(a) * v * age + 260 * age * age;
    const k = sg(age, 0, .12) * (1 - sg(age, 1.0 + .8 * rnd(2273, i), 1.6 + .6 * rnd(2273, i))), tw = .7 + .3 * Math.sin(age * 5 + i);
    star(x, y, (10 + 16 * rnd(2274, i)) * tw, k, age * 2 + i);
  }
}
function titleText(lt) {
  const r = sg(lt, RISE[0], RISE[1]);
  if (r > 0) {   /* SHIFT HAPPENS rises out of the box (behind the box front: it comes out of the opening), grows, lands */
    const e = eO(r), y = lp(BOX.y0 + 70, TT.y, e), sc = lp(.42, 1, eO(sg(r, .1, 1))), land = lt >= RISE[1] + .05, ds = lt - CUE.ding;
    const squash = lt >= RISE[1] && lt < RISE[1] + .3 ? 1 + .05 * Math.sin((lt - RISE[1]) / .3 * PI) : 1;
    ctx.save(); ctx.translate(TT.x, y); ctx.scale(sc * squash, sc / squash); ctx.translate(-TT.x, -y);
    letters('SHIFT HAPPENS', TT.x, y, TT.size, { hero: land, spacing: 6, maxW: 960, shine: ds > .05 ? eIO(sg(ds, .05, .85)) * 1.6 - .3 : -1, grp: 'fp22t.title' });
    ctx.restore();
  }
}
function subText(lt) {
  const pp = back(sg(lt, SUB.pill, SUB.pill + .32), 2.2);
  if (pp > .02) {
    ctx.save(); ctx.translate(540, 440); ctx.scale(pp, pp); ctx.translate(-540, -440);
    UI.pill('EPISODE 22', 540, 440, { font: 'Bangers', size: 52, spacing: 4, fill: '#2f8a4a', ink: '#ffffff', stroke: '#fff3c4', lw: 4, padX: 34, h: 76, hero: pp >= 1, crop: pp < 1, id: 'fp22t_pill', grp: 'fp22t.pill' });
    ctx.restore();
  }
  if (lt >= SUB.type0) { const k = sg(lt, SUB.type0, SUB.type1), ds = lt - CUE.ding; letters('THE SECRET SANTA', 540, 548, 84, { font: 'Lucky', reveal: k, hero: k >= 1, lwK: .13, spacing: 3, maxW: 940, face: [[0, '#ffffff'], [.5, '#fff1f1'], [.52, '#ffd9dc'], [1, '#ffbcc3']], ink: '#5a0a14', grp: 'fp22t.sub', shine: ds > .3 ? eIO(sg(ds, .3, 1.1)) * 1.6 - .3 : -1 }); }
  const ds = lt - CUE.ding;   /* textding: star glints round the title */
  if (ds > 0 && ds < 1.4) for (const [dx, dy, r, d] of [[-440, -50, 34, 0], [430, -40, 30, .12], [-320, 70, 22, .28], [370, 76, 26, .2]]) { const k = sg(ds, d, d + .55); star(TT.x + dx, TT.y + dy, r * Math.sin(PI * k), 1, k * .9); }
}
function titleDraw(lt) {
  ctx.drawImage(roomSprite(), 0, 0);
  const K = K22();
  if (K && K.stringLights) { K.stringLights(ctx, { a: [-40, 70], b: [560, 92], sag: 90, n: 7, s: 1.4, t: lt, seed: 3, glow: .55 }); K.stringLights(ctx, { a: [520, 92], b: [1120, 64], sag: 96, n: 7, s: 1.4, t: lt, seed: 5, glow: .55 }); }
  const P = lidPose(lt), off = lt >= POP.up[0], glow = sg(lt, POP.up[0], POP.up[0] + .25) * (1 - .45 * sg(lt, POP.bounce[1], POP.bounce[1] + .8));
  if (off) boxMouth(glow);
  titleText(lt);
  boxFront(lt, glow);
  for (const [side, t0] of [[-1, CUE.rip1], [1, CUE.rip2]]) {
    if (lt < t0) { ctx.save(); ripPath(side); ctx.clip(); ctx.translate(BOX.x0, BOX.y0); paperFace(0, 0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); ctx.restore(); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(side < 0 ? BOX.x0 : BOX.x1, BOX.y0); ctx.lineTo(side < 0 ? BOX.x0 : BOX.x1, BOX.y1); ctx.stroke(); if (lt >= CUE.rip1) ragged(side, 1); }
    else paperHalf(side, lt, t0);
  }
  if (lt < CUE.rip1) { ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.strokeRect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); }
  scraps(lt);
  sparkles(lt);
  lid(lt, P, lt < CUE.pull);
  ribbon(lt);
  const bow = bowAt(lt, P);
  tag(lt, bow, P);
  subText(lt);
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'gift'; },
  cam(lt) {
    const k = eIO(sg(lt, CAMT[0], CAMT[1]));
    zoomTo(540, lp(1000, 960, k), lp(1.16, 1, k));   /* close on the gift and its tag, then out to the whole frame; still from 3.4 s (the match cut) */
    CAM.shake = 0;
  },
  draw: titleDraw,
  fx(lt) {
    const ds = lt - CUE.ding, bl = lt >= CUE.bells ? ringK(lt - CUE.bells, .5) : 0, sw = .12 * Math.sin(PI * sg(lt, 0, CUE.theme + .4));   /* no fade from black (the luma gate): a small warm bloom swell as the theme starts */
    return { bloom: .42 + sw + .2 * bl + (ds > 0 ? .16 * ringK(ds, .4) : 0), vignette: .26, grain: .04, contrast: .06, sat: .06, tint: [['#ffb46a', .06, 'soft-light']], aberr: 0, fade: 0, fadeColor: '10,4,6' };
  },
  blur(lt) { return 1; },
  over() {},
  label: () => '',
};
window.__EP22_SCENES.title = TITLE;
// ====================================================================================================================================================================
// END (7.5 s, noScrim, noChyron): the SECRET SANTA ASSIGNMENTS sheet on a clipboard: every name with a red arrow to STRAWBERRY, and STRAWBERRY with an arrow to EVERYONE; the round APPROVED PER POLICY stamp.
// Cues (scene-local, snapped to frames): theme22 .1 | typing 1.1 | stamp 4.0 | textding 5.1.
//   0.00-0.30  MATCH CUT IN: the round red stamp (seen from above, its knob and rim) already hovers at (540, 760), 300 px; still camera.   0.30-0.75 it lifts away toward us (grows, fades) before any row exists under it.
//   0.30-0.95  five cast chips pop in.   1.10-3.80 typing: eight rows, each a name, a marker arrow, STRAWBERRY in red; then STRAWBERRY -> EVERYONE in green.
//   4.00       stamp: APPROVED PER POLICY slams into the dotted seal circle at (540, 760) (squash, ink specks, a small camera bump).   5.10 textding: the teaser strip rises: NEXT: EPISODE 23 / NEW YEAR'S EVE, glints.
//   7.20-7.50  a dip to black (the end of the episode).
// ====================================================================================================================================================================
const SE = snapOf('end');
const E = { type: SE(1.1), stamp: SE(4.0), ding: SE(5.1) };
const PP = { x: 64, y: 74, w: 952, h: 1170 };                                            /* the paper on the clipboard */
const NAMES = ['TOMATO', 'ONION', 'MANGO', 'LEMON', 'MELON', 'BRENDA', 'BINDER', 'EGGPLANT'];
const ROW = { y0: 452, pitch: 80, nx: 112, ax0: 352, ax1: 700, sx: 724 };                /* row centres, the name column, the arrow, the STRAWBERRY column */
const STAMP = { x: 540, y: 760, r: 150, rot: -.12 };
const RT = .3;                                                                           /* seconds per row */
let endCv = null;
function endSprite() {   /* the desk, the clipboard and the printed form (rules, the dotted seal circle): no text */
  if (endCv) return endCv;
  const c = endCv = mkcv(1080, 1920), g = c.getContext('2d');
  let gr = g.createLinearGradient(0, 0, 0, 1920); gr.addColorStop(0, '#7a4a30'); gr.addColorStop(1, '#5e3722'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
  g.strokeStyle = 'rgba(40,20,10,.18)'; g.lineWidth = 3; for (let i = 0; i < 30; i++) { const y = i * 66 + 20 * rnd(2301, i); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(360, y + 10 * rnd(2302, i), 720, y - 8, 1080, y + 4); g.stroke(); }
  gr = g.createRadialGradient(540, 760, 100, 540, 800, 1100); gr.addColorStop(0, 'rgba(255,214,160,.3)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1920);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.filter = 'blur(16px)'; g.fillRect(52, 54, 990, 1240); g.filter = 'none';
  gr = g.createLinearGradient(40, 0, 1040, 0); gr.addColorStop(0, '#b9854f'); gr.addColorStop(.5, '#c9955c'); gr.addColorStop(1, '#a5733f'); g.fillStyle = gr; g.beginPath(); g.roundRect(40, 40, 1000, 1236, 26); g.fill();   /* the board */
  g.strokeStyle = 'rgba(60,30,10,.7)'; g.lineWidth = 4; g.stroke();
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(PP.x + 6, PP.y + 10, PP.w, PP.h);
  gr = g.createLinearGradient(0, PP.y, 0, PP.y + PP.h); gr.addColorStop(0, '#fffdf6'); gr.addColorStop(1, '#f4f0e4'); g.fillStyle = gr; g.fillRect(PP.x, PP.y, PP.w, PP.h);
  for (let i = 0; i < 240; i++) { g.fillStyle = `rgba(120,110,90,${.03 + .04 * rnd(2303, i)})`; g.fillRect(PP.x + rnd(2304, i) * PP.w, PP.y + rnd(2305, i) * PP.h, 1 + 2 * rnd(2306, i), 1 + 2 * rnd(2307, i)); }
  g.fillStyle = '#c62828'; g.fillRect(PP.x, 352, PP.w, 6); g.fillStyle = '#2f8a4a'; g.fillRect(PP.x, 360, PP.w, 4);   /* a candy stripe under the heading */
  g.strokeStyle = 'rgba(31,50,112,.22)'; g.lineWidth = 2; for (let i = 0; i <= 9; i++) { const y = ROW.y0 - ROW.pitch / 2 + i * ROW.pitch; g.beginPath(); g.moveTo(PP.x + 30, y); g.lineTo(PP.x + PP.w - 30, y); g.stroke(); }
  g.strokeStyle = 'rgba(198,40,40,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(ROW.nx - 16, ROW.y0 - ROW.pitch / 2 - 40); g.lineTo(ROW.nx - 16, ROW.y0 + ROW.pitch * 8.5); g.stroke();   /* the margin */
  g.strokeStyle = 'rgba(31,50,112,.4)'; g.lineWidth = 3; g.setLineDash([10, 9]); g.beginPath(); g.arc(STAMP.x, STAMP.y, STAMP.r + 6, 0, TAU); g.stroke(); g.setLineDash([]);   /* the seal circle */
  gr = g.createLinearGradient(0, 30, 0, 120); gr.addColorStop(0, '#e9edf2'); gr.addColorStop(.5, '#aeb8c4'); gr.addColorStop(1, '#7d8794'); g.fillStyle = gr; g.beginPath(); g.roundRect(380, 28, 320, 84, 18); g.fill(); g.strokeStyle = 'rgba(30,30,40,.7)'; g.lineWidth = 3; g.stroke();   /* the clip */
  g.fillStyle = '#5a6270'; g.beginPath(); g.roundRect(470, 14, 140, 34, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(396, 40, 288, 6);
  return c;
}
/* a marker arrow drawn on from x0 to x1 (k 0..1), slightly wobbly */
function arrow(x0, x1, y, k, col, seed) {
  if (k <= 0) return;
  const x = lp(x0, x1, k), wob = i => Math.sin(i * 1.7 + seed) * 2.2;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha *= .92;
  ctx.beginPath(); for (let i = 0; i <= 12; i++) { const xx = lp(x0, x, i / 12); i ? ctx.lineTo(xx, y + wob(i) * (i / 12)) : ctx.moveTo(xx, y); } ctx.stroke();
  if (k > .85) { const a = sg(k, .85, 1); ctx.beginPath(); ctx.moveTo(x - 24 * a, y - 16 * a); ctx.lineTo(x + 2, y + wob(12)); ctx.lineTo(x - 24 * a, y + 16 * a); ctx.stroke(); }
  ctx.restore();
}
function rows(lt) {
  const tt = lt - E.type;
  NAMES.forEach((nm, i) => {
    const t0 = i * RT, y = ROW.y0 + i * ROW.pitch, kn = sg(tt, t0, t0 + .1), ka = sg(tt, t0 + .1, t0 + .18), ks = sg(tt, t0 + .18, t0 + .3);
    if (kn > 0) UI.label(nm, ROW.nx, y, { font: 'Nunito', weight: 900, size: 40, fill: '#1d2236', align: 'left', reveal: kn, hero: kn >= 1, crop: kn < 1, maxW: 230 });
    arrow(ROW.ax0, ROW.ax1, y, ka, '#d0233a', i);
    if (ks > 0) UI.label('STRAWBERRY', ROW.sx, y, { font: 'Nunito', weight: 900, italic: true, size: 40, fill: '#c62828', align: 'left', reveal: ks, hero: ks >= 1, crop: ks < 1, maxW: 270, grp: 'fp22t.straw' });
  });
  const t0 = NAMES.length * RT, y = ROW.y0 + NAMES.length * ROW.pitch, kn = sg(tt, t0, t0 + .12), ka = sg(tt, t0 + .12, t0 + .2), ks = sg(tt, t0 + .2, t0 + .32);
  if (kn > 0) UI.label('STRAWBERRY', ROW.nx, y, { font: 'Nunito', weight: 900, size: 40, fill: '#2f8a4a', align: 'left', reveal: kn, hero: kn >= 1, crop: kn < 1, maxW: 236, grp: 'fp22t.straw2' });
  arrow(ROW.ax0, ROW.ax1, y, ka, '#2f8a4a', 9);
  if (ks > 0) UI.label('EVERYONE', ROW.sx, y, { font: 'Nunito', weight: 900, italic: true, size: 40, fill: '#2f8a4a', align: 'left', reveal: ks, hero: ks >= 1, crop: ks < 1, maxW: 270 });
}
function heading() {
  letters('SECRET SANTA', 540, 172, 100, { hero: true, spacing: 4, maxW: 900, face: [[0, '#ff5a5a'], [.5, '#e3263a'], [.52, '#c81a2e'], [1, '#a00f1e']], ink: '#4a0610', lwK: .13, shadowA: .35, gloss: .16, grp: 'fp22t.h1' });
  UI.label('ASSIGNMENTS', 540, 254, { font: 'Nunito', weight: 900, size: 46, spacing: 8, fill: '#1f3270', maxW: 820 });
  UI.label('3-11 SHIFT  ·  TEN DOLLAR LIMIT', 540, 318, { font: 'Nunito', weight: 800, size: 30, spacing: 2, fill: '#5a6680', maxW: 820 });
}
/* the rubber stamp seen from above (round red knob, rim, a shine): the match cut's round shape on the first frames */
function stampTool(lt) {
  const u = sg(lt, .3, .75); if (u >= 1) return;
  const sc = 1 + .7 * eIO(u), al = 1 - eIO(u);
  ctx.save(); ctx.globalAlpha *= al; ctx.translate(STAMP.x, STAMP.y); ctx.scale(sc, sc);
  ctx.fillStyle = 'rgba(30,10,10,.32)'; ctx.beginPath(); ctx.ellipse(16, 26, STAMP.r + 4, STAMP.r + 2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgr(-40, -46, 20, STAMP.r * 1.1, [[0, '#ff6a6a'], [.6, '#d42033'], [1, '#8a0c18']]); ctx.strokeStyle = OUTL; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, STAMP.r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, STAMP.r - 18, PI * 1.05, PI * 1.6); ctx.stroke();
  ctx.fillStyle = rgr(-14, -18, 6, 70, [[0, '#5a4a40'], [1, '#2a1a14']]); ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.stroke();   /* the wooden knob */
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-20, -24, 22, 12, -.6, 0, TAU); ctx.fill();
  ctx.restore();
}
/* the ink impression: a double ring, APPROVED, PER POLICY, two stars; it slams (squash) and leaves specks */
function stampInk(lt) {
  const age = lt - E.stamp; if (age < 0) return;
  const pop = age < .16 ? lp(1.35, .94, eIO(age / .16)) : age < .3 ? lp(.94, 1, eIO((age - .16) / .14)) : 1, al = sg(age, 0, .05);
  ctx.save(); ctx.translate(STAMP.x, STAMP.y); ctx.rotate(STAMP.rot); ctx.scale(pop, pop); ctx.globalAlpha *= al * .92;
  const ink = '#c8102e';
  ctx.strokeStyle = ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, STAMP.r - 6, 0, TAU); ctx.stroke(); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, STAMP.r - 24, 0, TAU); ctx.stroke();
  ctx.fillStyle = ink; for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 92, 0); ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 6 : 15; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = 'rgba(255,253,246,.55)'; for (let i = 0; i < 40; i++) { const a = rnd(2320, i) * TAU, r = (STAMP.r - 30) * Math.sqrt(rnd(2321, i)); ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.5 + 3 * rnd(2322, i), 0, TAU); ctx.fill(); }   /* ink wear */
  UI.label('APPROVED', 0, -16, { font: 'Bangers', size: 64, spacing: 3, fill: ink, maxW: 190, hero: age > .3, crop: age <= .3, tilt: .3, grp: 'fp22t.stamp' });
  UI.label('PER POLICY', 0, 48, { font: 'Nunito', weight: 900, size: 30, spacing: 2, fill: ink, maxW: 200, hero: age > .3, crop: age <= .3, tilt: .3, grp: 'fp22t.stamp' });
  ctx.restore();
  if (age < .8) for (let i = 0; i < 14; i++) { const a = rnd(2330, i) * TAU, d = STAMP.r + 8 + 50 * rnd(2331, i) * eO(sg(age, 0, .25)); ctx.fillStyle = `rgba(200,16,46,${(.8 * (1 - sg(age, .3, .8))).toFixed(3)})`; ctx.beginPath(); ctx.arc(STAMP.x + Math.cos(a) * d, STAMP.y + Math.sin(a) * d, 2 + 4 * rnd(2332, i), 0, TAU); ctx.fill(); }
}
const CHIPS = [
  { name: 'STRAWBERRY', role: 'DRAWN BY EVERYONE', mk: t => window.A11 ? A11.straw({ t, expr: 'weak' }) : null, bg: '#ffe3e7' },
  { name: 'TOMATO', role: 'FUN COMMITTEE', mk: t => window.A15 && A15.tomato ? (window.A22 && A22.santaHat ? A22.santaHat(A15.tomato({ t, tomPose: 'fruit' }), { hatFlop: .55 }) : A15.tomato({ t })) : null, bg: '#ffe7d6' },
  { name: 'SANTA', role: 'THE ADMINISTRATOR', mk: t => window.A22 && A22.santa ? A22.santa({ t, expr: 'santa_jolly', hat: { hatFlop: .5 } }) : null, bg: '#f9dcdc' },
  { name: 'ONION', role: 'COMPLIANCE', mk: t => window.A15 && A15.onion ? A15.onion({ t, pose: 'rest', expr: 'onion_cry', cry: .5 }) : null, bg: '#f7eed6' },
  { name: 'BINDER', role: 'DREW THE NAMES', mk: t => window.A15 && A15.binder ? A15.binder({ t, pose: 'rest' }) : null, bg: '#e2e6f0' },
];
function endChips(lt) {
  CHIPS.forEach((ch, i) => {
    const cx = 150 + i * 195, cy = 1334, R = 54, p = back(sg(lt, .3 + i * .12, .3 + i * .12 + .3), 1.8);
    if (p <= .02) return;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p); ctx.translate(-cx, -cy);
    ctx.fillStyle = ch.bg; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    const o = ch.mk(lt);
    if (o) {
      const k = KINDS[o.kind], s = (o.kind === 'bind' ? 40 : 44) / k.rx, fy = (k.eyeY + k.mouthY) / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 2, 0, TAU); ctx.clip();
      drawChar(Object.assign(o, { x: cx, y: cy + 10 - fy * s + k.ry * .9 * s, s, noLegs: true, noShadow: true, noReflect: true, arms: { l: 'none', r: 'none' }, hold: {}, grip: {}, look: [0, .1], transit: p < 1 }));
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    const rest = p >= 1;
    UI.label(ch.name, cx, cy + R + 26, { font: 'Nunito', weight: 900, size: 25, fill: '#fff4e0', hero: false, crop: !rest, maxW: 180, grp: 'fp22t.chips' });
    UI.label(ch.role, cx, cy + R + 52, { font: 'Nunito', weight: 800, size: 17, fill: '#ffd7a0', hero: false, crop: !rest, maxW: 184, grp: 'fp22t.chips' });
    ctx.restore();
  });
}
function endTeaser(lt) {
  const p = sg(lt, E.ding, E.ding + .4), ds = lt - E.ding;
  if (p <= 0) return;
  const rest = p >= 1, X = 70, Y = 1520, Wt = 940, Ht = 236, cx = 540;
  ctx.save(); ctx.globalAlpha *= sg(p, 0, .3); ctx.translate(0, (1 - eO(p)) * 80);
  UI.panel([X, Y, Wt, Ht], { r: 20, fill: ['#1f2f6b', '#10183a'], stroke: '#f2d27a', lw: 5, shadow: 22, id: 'fp22t.teaser' });
  ctx.save(); ctx.globalAlpha *= .95;
  for (const [gx, gy, rt, col] of [[X + 74, Y + Ht / 2 + 4, -.2, '#e3263a'], [X + Wt - 74, Y + Ht / 2 + 4, .2, '#2f8a4a']]) {   /* two party hats */
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(rt); ctx.fillStyle = col; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 36); ctx.lineTo(0, -46); ctx.lineTo(30, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#f2d27a'; for (let k = -3; k < 4; k++) ctx.fillRect(-40, k * 22, 80, 7); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -48, 9, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < 16; i++) { ctx.fillStyle = ['#f2d27a', '#ff6a6a', '#7fd0ff', '#9be27a'][i % 4]; ctx.save(); ctx.translate(X + 150 + rnd(2340, i) * (Wt - 300), Y + 18 + rnd(2341, i) * (Ht - 36)); ctx.rotate(rnd(2342, i) * 3 + lt); ctx.fillRect(-4, -2, 8, 4); ctx.restore(); }   /* confetti */
  ctx.restore();
  UI.label('NEXT: EPISODE 23', cx, Y + 52, { font: 'Nunito', weight: 900, size: 32, spacing: 6, fill: '#f2d27a', cid: 'fp22t.teaser', hero: rest, crop: !rest, maxW: Wt - 260 });
  letters(TEASER23, cx, Y + 150, 90, { face: [[0, '#ffffff'], [.5, '#fff8e0'], [.52, '#ffe9a8'], [1, '#f5c64a']], ink: '#0b1230', hero: rest, maxW: Wt - 240, shine: ds > .25 ? eIO(sg(ds, .25, 1.05)) * 1.6 - .3 : -1, grp: 'fp22t.teaser' });
  ctx.restore();
  if (ds > 0 && ds < 1.6) for (const [dx, dy, r, d] of [[-Wt / 2 + 30, -Ht / 2 + 14, 30, .1], [Wt / 2 - 20, -Ht / 2 + 26, 26, .22], [-Wt / 2 + 220, Ht / 2 - 8, 22, .34], [Wt / 2 - 230, Ht / 2 - 12, 26, .28]]) { const k = sg(ds, d, d + .55); star(cx + dx, Y + Ht / 2 + dy, r * Math.sin(PI * k), 1, k * .9); }
}
function endDraw(lt) {
  ctx.drawImage(endSprite(), 0, 0);
  heading();
  UI.label('WHO', ROW.nx, 390, { font: 'Nunito', weight: 900, size: 24, spacing: 4, fill: '#8a94ac', align: 'left', hero: false, maxW: 200 });
  UI.label('DRAWS', ROW.sx, 390, { font: 'Nunito', weight: 900, size: 24, spacing: 4, fill: '#8a94ac', align: 'left', hero: false, maxW: 200 });
  rows(lt);
  stampInk(lt);
  stampTool(lt);
  endChips(lt);
  endTeaser(lt);
}
const END = {
  noChyron: true, noScrim: true,
  shot() { return 'sheet'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .025 * eIO(sg(lt, .4, 7.5)));   /* still for the match cut, then a slow, calm push-in */
    CAM.shake = 2.6 * (lt >= E.stamp ? ringK(lt - E.stamp, .07) : 0);
  },
  draw: endDraw,
  fx(lt) {
    const fout = .5 * sg(lt, 7.2, 7.5), st = lt >= E.stamp ? ringK(lt - E.stamp, .12) : 0, dd = lt >= E.ding ? ringK(lt - E.ding, .5) : 0;
    return { bloom: .3 + .14 * st + .16 * dd, vignette: .22, grain: .04, contrast: .06, sat: .05, aberr: 0, tint: [['#ffb46a', .05, 'soft-light']], fade: fout, fadeColor: '6,4,8' };
  },
  blur(lt) { return 1; },
  over() {},
  label: () => 'THANKS FOR WATCHING',
};
window.__EP22_SCENES.end = END;
})();
