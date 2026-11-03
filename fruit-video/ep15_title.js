'use strict';
/* SHIFT HAPPENS, Episode 15: The Merger. Scene module E15-A (the two design scenes): `title` (6.6 s) and `end` (8.0 s), registered on window.__EP15_SCENES. Prefix for anything new: fp15a_.
 * Built on the sheet kit SH15 (ep15_sheet.js) and the UI kit; every string goes through UI.label / UI.write, live each frame (no text in caches).
 *
 * TITLE (noChyron, noScrim). The sheet is a floating GridSheet window (1040 x 1880, corner radius 28, 20 px of deep-green desk round it, soft shadow) so the merge can end on a clean card. Layout (window-local,
 *   8 px grid): columns A..D 244 wide, row 1 (the pre-merged banner A1:D1) 300 tall, row 2 200 tall; grid starts at y 400, so the title block sits at screen y 420..920.
 *   Cues (scene-local s): theme15 .2 | click 1.15 | click 2.10 | merge 2.30 | textding 4.00.
 *   0.00-0.20  fade up from black.     0.22-1.00  a quick keyboard flourish: SHIFT HAPPENS (banner), the EPISODE 15 pill, THE MERGER, FRUIT BOWL, GREENLEAF type in, one cell after the other; the
 *              formula bar and the name box follow the active cell.
 *   0.62-1.15  the pointer drifts in and arrives on B2 exactly on the first click (1.15): it presses and DRAGS (1.20-1.62) to D2, the selection grows cell by cell (B2, B2:C2, B2:D2).
 *   1.72-1.96  it flicks up to Merge & Center, hovers (the tooltip pops at 1.98) and presses on the second click (2.10: the button sinks, a blue ring).
 *   2.30       MERGE (SH15.merge draws the geometry: the outline pulses, the borders dissolve, the fills blend into deep green, the ring and flash); the three values are drawn here (blank in the kit) so the
 *              discarded ones, FRUIT BOWL and GREENLEAF, can shake loose at 2.46 / 2.58 and fall letter by letter OUT OF THE BOTTOM OF THE FRAME (spin, shadow, shutter blur) while THE MERGER glides to the
 *              middle of the frame and grows (2.62-3.40, a 3-frame overshoot at 3.33) as the green cell swells to swallow the whole sheet (2.80-3.40).
 *   3.40       LANDING = the flash: a ring, a punch of the camera, a burst of cell shards. 3.40-3.95 UI OUT: the ribbon and title bar slide up, the sheet tabs and status bar slide down, the row numbers slide left.
 *   3.62-3.95  the tagline types in.   4.00 textding: a gloss sweeps across THE MERGER, four stars twinkle.   4.0-6.4 a held, centred card with a slow push-in; 6.48-6.6 a dip to black.
 * END: see the second half of this file. */
/* the title of the next episode, shown in the end card's teaser banner under NEXT: EPISODE 16 (the lead confirms it: change this one constant) */
const TEASER16 = 'THE POTLUCK';
(() => {
if (!window.TIMELINE_EP15 || !window.SH15 || !window.UI || !window.H6) return;
const SH = window.SH15, { zoomTo } = window.H6;
window.__EP15_SCENES = window.__EP15_SCENES || {};

// ------------------------------------------------------------------ palette and small maths (the episode's: sheet green, deep green, banner yellow, episode red)
const DEEP = '#103a2c', DEEP_D = '#0a281e', DEEP_L = '#14513b', YEL = '#ffe135', INK = '#07170f', RED = '#d93025', CREAM = '#f6efd2', ORANGE = '#e8782c', LEAF = '#2fa36b', MID = '#1d6a4b';
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const eIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eO = k => 1 - Math.pow(1 - k, 3);
const eO4 = k => 1 - Math.pow(1 - k, 4);
const eI = k => k * k * k;
const back = (k, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };   /* ease out with an overshoot */
const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mixh = (a, b, k) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), f = (s) => Math.round(lp((A >> s) & 255, (B >> s) & 255, k)); return `rgb(${f(16)},${f(8)},${f(0)})`; };
const ringK = (age, tau) => age < 0 ? 0 : Math.exp(-age / tau);   /* a decaying pulse that is 1 at age 0 */

// ------------------------------------------------------------------ cues and the shot's time line
const CLICK1 = 1.15, DRAG_A = 1.20, DRAG_B = 1.62, CLICK2 = 2.10, MERGE0 = 2.30, LAND = 3.40, UI0 = 3.40, UI1 = 3.95, DING = 4.0, TAG0 = 3.62, TAG1 = 3.95;
const TYPE = [['A1', 'SHIFT HAPPENS', .22, .42], ['A2', 'EPISODE 15', .46, .58], ['B2', 'THE MERGER', .60, .72], ['C2', 'FRUIT BOWL', .74, .86], ['D2', 'GREENLEAF', .88, 1.0]];
const TYPE_T = Object.fromEntries(TYPE.map(r => [r[0], r]));
const typedK = (ref, lt) => { const r = TYPE_T[ref]; return sg(lt, r[2], r[3]); };

// ------------------------------------------------------------------ the sheet window and its geometry (window-local numbers; the window sits at WIN.x, WIN.y on the screen)
const WIN = { x: 20, y: 20, w: 1040, h: 1880, r: 28 };
const COLS = { A: 244, B: 244, C: 244, D: 244 }, ROWS = { 1: 300, 2: 200 };
const BASE = {
  w: WIN.w, h: WIN.h, doc: 'SYNERGY_MODEL_v47_FINAL_REAL', saved: false, cols: COLS, rows: ROWS, tabs: ['Sheet1', 'Staff', 'Policies'], tab: 'Sheet1', merges: ['A1:D1'], handle: true,
  show: { title: true, ribbon: true, formula: true, headers: true, sheetTabs: true, status: true },
};
let GEO = null;
function geo() {
  if (GEO) return GEO;
  const o = Object.assign({}, BASE, { ribbon: { tab: 'Home' } });
  const L = SH.layout(o), rc = ref => SH.cellRect(ref, o), btn = SH.buttonRect('merge', o);
  const R = rc('B2:D2'), b1 = rc('A1:D1'), a2 = rc('A2'), b2 = rc('B2'), c2 = rc('C2'), d2 = rc('D2');
  GEO = { L, rc, btn, R, b1, a2, b2, c2, d2, o, gx0: L.gx0, gy0: L.gy0, gx1: L.gx1, gy1: L.gy1 };
  return GEO;
}
const scr = (x, y) => [WIN.x + x, WIN.y + y];

// ------------------------------------------------------------------ the card: where everything ends up (screen coordinates, every element ink-centred on x 540)
const CARD = { cx: 540, shift: { cy: 702, size: 128 }, pill: { cy: 836, size: 54, h: 88 }, title: { cy: 1000, size: 208 }, tag: { cy: 1196, size: 46 } };

// ------------------------------------------------------------------ the desk: the deep-green stage under the window and, once the sheet has been swallowed, the card's background
function stage(lt, o = {}) {
  const k = o.k ?? 1;
  ctx.save();
  const g = ctx.createLinearGradient(0, -300, 0, H + 300);
  g.addColorStop(0, '#0a261c'); g.addColorStop(.42, DEEP); g.addColorStop(1, '#0a281e');
  ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800);
  // a pool of light behind the title, slowly breathing
  const br = 1 + .03 * Math.sin(lt * 1.6);
  ctx.globalCompositeOperation = 'screen';
  let r = ctx.createRadialGradient(540, 930, 0, 540, 930, 980 * br);
  r.addColorStop(0, rgba('#3fd39a', .30 * k)); r.addColorStop(.35, rgba('#1d9a6c', .16 * k)); r.addColorStop(1, rgba('#1d9a6c', 0));
  ctx.fillStyle = r; ctx.fillRect(-400, -400, W + 800, H + 800);
  r = ctx.createRadialGradient(540, 1700, 0, 540, 1700, 760);
  r.addColorStop(0, rgba('#ffd23a', .10 * k)); r.addColorStop(1, rgba('#ffd23a', 0));
  ctx.fillStyle = r; ctx.fillRect(-400, 900, W + 800, H);
  // the sheet's own grid, ghosted: cells of 216 x 72 fading out from the middle, a nod to what this card used to be
  ctx.globalCompositeOperation = 'source-over';
  const gr = ctx.createRadialGradient(540, 930, 120, 540, 930, 1180);
  gr.addColorStop(0, rgba('#9fe8c6', .085 * k)); gr.addColorStop(1, rgba('#9fe8c6', 0));
  ctx.strokeStyle = gr; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 540 - 216 * 5; x <= 540 + 216 * 5; x += 216) { ctx.moveTo(x, -50); ctx.lineTo(x, H + 50); }
  for (let y = 930 - 72 * 14; y <= 930 + 72 * 14; y += 72) { ctx.moveTo(-50, y); ctx.lineTo(W + 50, y); }
  ctx.stroke();
  ctx.restore();
}
/* the window's soft shadow on the desk (drawn once, behind the window) */
function windowShadow(a = 1) {
  ctx.save(); ctx.shadowColor = `rgba(0,0,0,${.55 * a})`; ctx.shadowBlur = 70; ctx.shadowOffsetY = 26; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.roundRect(WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ the pointer: waypoints in window-local coordinates, a drag with the button held, two clicks on the cues
function pointer(lt) {
  const G = geo(), b2 = G.b2, d2 = G.d2, bt = G.btn, cy = b2.cy - 12;
  const pts = [
    { t: .62, x: 640, y: 1180, kind: 'arrow' },
    { t: CLICK1, x: b2.x + 84, y: cy, kind: 'cross', hold: DRAG_A - CLICK1 },
    { t: DRAG_B, x: d2.x + 150, y: cy, kind: 'cross', hold: .06, over: .02 },
    { t: 1.97, x: bt.aim[0], y: bt.aim[1], kind: 'arrow', click: [CLICK2 - .09, CLICK2 + .1], over: .05 },
    { t: 2.62, x: bt.aim[0] + 70, y: bt.aim[1] + 120, kind: 'arrow' },
  ];
  const c = SH.cursorPath(pts, lt);
  const drag = eIO(sg(lt, CLICK1 - .08, CLICK1 + .02)) * (1 - eIO(sg(lt, DRAG_B + .03, DRAG_B + .1)));   /* the button is held from the first click to the end of the drag */
  const press = Math.max(c.press, drag);
  const alpha = sg(lt, .62, .8) * (1 - sg(lt, 2.55, 2.85));
  return { x: c.x, y: c.y, press, kind: c.kind, alpha, moving: c.moving };
}
/* the selection of the moment: typing hops from cell to cell, the click collapses it to B2, the drag grows it to B2:D2 one cell at a time */
function selection(lt) {
  const G = geo(), p = pointer(lt);
  if (lt < .22) return { sel: 'A1:D1', active: 'A1', selFill: false, formula: '', formulaK: 1, name: 'A1' };
  let ref = 'A1', txt = '', k = 1;
  for (const [r, s, t0, t1] of TYPE) if (lt >= t0) { ref = r; txt = s; k = sg(lt, t0, t1); }
  if (lt < CLICK1) return ref === 'A1' ? { sel: 'A1:D1', active: 'A1', selFill: false, formula: txt, formulaK: k, name: 'A1' } : { sel: ref, active: ref, formula: txt, formulaK: k, name: ref };
  let last = 'B2';
  if (lt >= DRAG_A) { const x = p.x; last = x >= G.d2.x + 24 ? 'D2' : x >= G.c2.x + 24 ? 'C2' : 'B2'; }
  const sel = last === 'B2' ? 'B2' : 'B2:' + last;
  return { sel, active: 'B2', formula: 'THE MERGER', formulaK: 1, name: 'B2', count: sel === 'B2' ? 1 : last === 'C2' ? 2 : 3 };
}

// ------------------------------------------------------------------ the sheet's options for a moment of the shot (the kit draws structure and fills; the strings in the title block are drawn by this module)
function sheetOpts(lt) {
  const G = geo(), s = selection(lt), p = pointer(lt);
  const hotK = eIO(sg(lt, 1.9, 1.98));
  const onBtn = lt > 1.9 ? p.press : 0;
  const o = Object.assign({}, BASE, {
    ribbon: { tab: 'Home', hot: 'merge', hotK, press: lt >= CLICK2 + .2 ? 0 : onBtn },
    cells: { A1: { v: '', fill: DEEP }, A2: { v: '', fill: '#ffffff' }, B2: { v: '', fill: MID }, C2: { v: '', fill: ORANGE }, D2: { v: '', fill: LEAF } },
    sel: s.sel, active: s.active, nameBox: s.name, formula: { text: s.formula, typed: s.formulaK }, status: 'Ready', stats: s.count > 1 ? ['Count: ' + s.count] : [],
  });
  if (s.selFill === false) o.selFill = false;
  if (lt >= MERGE0) {
    const u = sg(lt, MERGE0, LAND);
    o.sel = 'B2:D2'; o.active = 'B2'; o.nameBox = 'B2'; o.stats = ['Count: 3'];
    o.merge = { range: 'B2:D2', u, texts: ['', '', ''], final: { text: '', fill: YEL, bg: DEEP, hero: false }, after: u >= 1 ? lt - LAND : undefined, t0: .14, survivor: 0 };
  }
  return o;
}

// ------------------------------------------------------------------ the tooltip of the Merge & Center button (a dark panel with two lines, pops in on the hover, goes with the merge)
function tooltip(lt) {
  const a = eO(sg(lt, 1.98, 2.1)) * (1 - sg(lt, MERGE0 + .02, MERGE0 + .16));
  if (a <= .01) return;
  const bt = geo().btn, w = 330, h = 98, x = bt.cx - 70, y = bt.y + bt.h + 14, s = lp(.92, 1, eO(sg(lt, 1.98, 2.1)));
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + w / 2, y); ctx.scale(s, s); ctx.translate(-(x + w / 2), -y);
  ctx.save(); ctx.shadowColor = 'rgba(10,14,20,.45)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#22262b'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#22262b'; ctx.beginPath(); ctx.moveTo(x + 70 - 12, y + 1); ctx.lineTo(x + 70, y - 12); ctx.lineTo(x + 70 + 12, y + 1); ctx.closePath(); ctx.fill();   /* the little tail that points at the button */
  UI.label('Merge & Center', x + 24, y + 33, { align: 'left', size: 28, weight: 900, fill: '#ffffff', hero: false, crop: true });
  UI.label('Combine the selection into one cell.', x + 24, y + 70, { align: 'left', size: 21, weight: 700, fill: '#b8c2cc', hero: false, crop: true, maxW: w - 44 });
  ctx.restore();
}

// ------------------------------------------------------------------ measuring on a private canvas (the kit does the same): ink box and advance of a string, for the letter-by-letter fall
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
/* a vertical gradient in the text's own frame (baseline at 0, cap top at -cap): text() translates to the baseline before it fills, so these coordinates follow the letters */
const vgrad = (cap, stops, y0 = -1.03, y1 = .04) => { const g = ctx.createLinearGradient(0, cap * y0, 0, cap * y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; };
const FACE = [[0, '#fffbd0'], [.2, '#fff06a'], [.47, '#ffd21a'], [.5, '#ffb300'], [1, '#ff8a00']];       /* the bright bevelled face of THE MERGER: a hard horizon in the middle */
const FACE_LOGO = [[0, '#fff7a8'], [.46, '#ffe135'], [.5, '#ffc800'], [1, '#ffb000']];

/* Bangers lettering with a body: a soft drop shadow, a slab of extrusion, a dark outline, a gold rim, a bright gradient face, a gloss on its upper half and, when asked, a sweeping shine. Only the face
 * is the string the viewer reads (hero when `hero`); every other layer is a decorative copy of it (hero:false, crop:true, one group), so the text gate sees one string. */
function bevelText(str, cx, cy, size, o = {}) {
  const font = 'Bangers', sp = o.spacing ?? size * .018, cap = UI.metrics(font).cap * size, alpha = o.alpha ?? 1, ex = o.extr ?? 1, lw = size * (o.lwK ?? .125), reveal = o.reveal ?? 1;
  if (alpha <= .004 || reveal <= 0 || size < 2) return null;
  const common = { font, size, spacing: sp, grp: o.grp || 'bv:' + str, tilt: .3, reveal, hero: false, crop: true };
  const L = (dx, dy, fill, stroke, lwv, extra) => UI.label(str, cx + dx, cy + dy, Object.assign({}, common, { fill, stroke, lw: lwv, alpha }, extra));
  if (o.shadow !== false) L(size * .03, size * .15 * ex + size * .03, 'rgba(1,8,4,.40)', 'rgba(1,8,4,.40)', lw * 1.45, { shadow: size * .14 });
  const n = Math.round(ex * size * .07);
  for (let i = n; i >= 1; i--) { const c = mixh('#12704a', '#04170e', 1 - i / n * .6); L(i * .28, i, c, c, lw); }
  L(0, 0, INK, INK, lw);
  L(0, 0, o.rim || '#c47f0a', o.rim || '#c47f0a', lw * .55);
  const box = UI.label(str, cx, cy, Object.assign({}, common, { fill: vgrad(cap, o.face || FACE), lw: 0, alpha, hero: !!o.hero, crop: !o.hero }));
  L(0, 0, vgrad(cap, [[0, 'rgba(255,255,255,.46)'], [.4, 'rgba(255,255,255,.06)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]), undefined, 0, {});
  if (o.shine != null && o.shine > -.3 && o.shine < 1.3) {   /* a diagonal band of light sweeping across the letters */
    const m = meas(str, size, font, 400, sp), x = lp(m.l - cap * .6, m.r + cap * .6, o.shine), g = ctx.createLinearGradient(x - cap * .5, -cap, x + cap * .5, 0);
    for (const [s, a] of [[0, 0], [.36, 0], [.5, o.shineA ?? .95], [.64, 0], [1, 0]]) g.addColorStop(s, `rgba(255,255,255,${a})`);
    L(0, 0, g, undefined, 0, {});
  }
  return box;
}
/* the red EPISODE pill (UI.pill: centred by construction) */
function episodePill(cx, cy, size, h, o = {}) {
  const a = o.alpha ?? 1, s = o.scale ?? 1;
  if (a <= .01 || s <= .01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = size * .5; ctx.shadowOffsetY = size * .2; ctx.fillStyle = RED; ctx.beginPath(); ctx.roundRect(cx - 4, cy - h / 2, 8, h, h / 2); ctx.restore();
  UI.pill('EPISODE 15', cx, cy, { font: 'Bangers', size, spacing: size * .09, fill: RED, ink: CREAM, stroke: INK, lw: Math.max(3, size * .12), h, padX: size * .62, tstroke: INK, tlw: size * .09, shadow: size * .1, hero: !!o.hero, crop: !o.hero, id: 'fp15a.pill' });
  ctx.restore();
}
function cellWord(str, cx, cy, size, k, o = {}) {
  if (k <= 0) return;
  UI.label(str, cx, cy, Object.assign({ font: 'Bangers', size, spacing: 2, fill: CREAM, stroke: INK, lw: size * .15, reveal: k, hero: false, shadow: size * .1 }, o));
}

// ------------------------------------------------------------------ the three discarded values fall letter by letter out of the bottom of the frame
function discard(ref, str, k, lt) {
  const G = geo(), rc = G[ref.toLowerCase()], [cx, cy] = scr(rc.cx, rc.cy), size = 48, sp = 2, kk = typedK(ref, lt);
  if (kk <= 0) return;
  if (lt < MERGE0) { cellWord(str, cx, cy, size, kk); return; }
  const m = meas(str, size, 'Bangers', 400, sp), x0 = cx - (m.l + m.r) / 2;
  for (let j = 0; j < str.length; j++) {
    const ch = str[j];
    if (ch === ' ') continue;
    const mc = meas(ch, size, 'Bangers', 400, sp), pre = meas(str.slice(0, j + 1), size, 'Bangers', 400, sp).adv - mc.adv, lx = x0 + pre + (mc.l + mc.r) / 2;
    const tr = 2.46 + k * .14 + j * .012 + rnd(k * 31 + j) * .03, sh = sg(lt, tr - .12, tr - .02), tau = Math.max(0, lt - tr);
    let x = lx, y = cy, rot = 0;
    if (tau <= 0) { x += Math.sin(lt * 190 + j * 2.3) * 3.2 * sh; y += Math.sin(lt * 150 + j) * 1.6 * sh; }
    else {
      const r1 = rnd(k * 37 + j * 3.1 + 1), r2 = rnd(k * 53 + j * 7.7 + 2), r3 = rnd(k * 11 + j * 1.9 + 3);
      x += (r2 - .5) * 300 * tau; y += -(150 + r3 * 260) * tau + 2100 * tau * tau;
      rot = (r1 < .5 ? -1 : 1) * 1.4 * Math.tanh((5 + r3 * 6) * tau / 1.4);   /* the spin saturates under 80 degrees: the text gate rejects upside-down letters */
    }
    if (y > 2060) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.translate(-x, -y);
    UI.label(ch, x, y, { font: 'Bangers', size, spacing: sp, fill: CREAM, stroke: INK, lw: size * .15, shadow: 16, hero: false, crop: true, tilt: 2, grp: 'fall' + k });
    ctx.restore();
  }
}

// ------------------------------------------------------------------ where the strings of the title block are at a moment of the shot
function bannerState(lt) {
  const G = geo(), [sx, sy] = scr(G.b1.cx, G.b1.cy), e = eIO(sg(lt, 3.0, 3.55));
  return { x: lp(sx, CARD.cx, e), y: lp(sy, CARD.shift.cy, e), size: lp(150, CARD.shift.size, e), k: typedK('A1', lt), rest: e >= 1 };
}
function pillState(lt) {
  const G = geo(), [sx, sy] = scr(G.a2.cx, G.a2.cy), e = eIO(sg(lt, 3.05, 3.6)), p = sg(lt, .46, .6);
  return { x: lp(sx, CARD.cx, e), y: lp(sy, CARD.pill.cy, e), size: lp(34, CARD.pill.size, e), h: lp(56, CARD.pill.h, e), scale: lp(.5, 1, back(p, 2.2)), alpha: sg(lt, .46, .52), rest: e >= 1 };
}
function titleState(lt) {
  const G = geo(), [sx, sy] = scr(G.b2.cx, G.b2.cy), e = eIO(sg(lt, 2.62, LAND));
  const grow = lt < LAND - .1 ? eIO(sg(lt, 2.74, LAND - .1)) * 1.06 : lp(1.06, 1, eO(sg(lt, LAND - .1, LAND)));   /* the face swells past its size and settles on the landing: the overshoot */
  const size = lp(48, CARD.title.size, grow) * (1 + .03 * (lt >= LAND ? ringK(lt - LAND, .09) : 0));
  return { x: lp(sx, CARD.cx, e), y: lp(sy, CARD.title.cy, e) - 64 * Math.sin(Math.PI * e), size, k: typedK('B2', lt), rest: lt >= LAND };
}

// ------------------------------------------------------------------ effects: the flash and ring of the landing, the shards, the stars of the shimmer
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
function landingFx(lt, layer) {
  const age = lt - LAND, cy = CARD.title.cy;
  if (layer === 'shards') {
    if (age < 0 || age > 1.3) return;
    const cols = [YEL, ORANGE, LEAF, CREAM, '#ffffff', '#ff8a3d'];
    for (let i = 0; i < 34; i++) {
      const a = rnd(i * 3.7) * TAU, v = 380 + rnd(i * 5.1) * 1000, s0 = 8 + rnd(i * 7.3) * 20;
      const x = 540 + Math.cos(a) * v * age * .9 * (1 - .35 * sg(age, 0, 1.3)), y = cy + Math.sin(a) * v * age * .9 + 1500 * age * age * (.4 + .6 * rnd(i * 1.3)) - 90 * Math.sin(age * 3);
      const fade = 1 - sg(age, .45, 1.25);
      if (fade <= .01) continue;
      ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = cols[i % cols.length]; ctx.translate(x, y); ctx.rotate(rnd(i * 2.2) * 6 + age * (rnd(i) - .5) * 14);
      ctx.beginPath(); ctx.roundRect(-s0 / 2, -s0 * .35, s0, s0 * .7, 3); ctx.fill(); ctx.restore();
    }
    return;
  }
  // layer 'light': additive flash and rings
  const pre = lt < LAND ? Math.pow(sg(lt, LAND - .16, LAND), 2) : 0, post = age >= 0 ? ringK(age, .12) : 0, a = Math.max(pre * .55, post);
  if (a > .01) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(540, cy, 0, 540, cy, 900); g.addColorStop(0, `rgba(255,255,255,${.78 * a})`); g.addColorStop(.28, `rgba(255,240,160,${.38 * a})`); g.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600); ctx.restore();
    V2.emit(540, cy, 520, '255,236,150', .9 * a);
  }
  if (age >= 0 && age < .8) { ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(540, cy, age / .8, { r0: 160, r1: 980, lw: 20, color: '255,244,176', alpha: .95, bloom: .6 }); V2.ring(540, cy, Math.max(0, age - .09) / .8, { r0: 120, r1: 760, lw: 10, color: '140,255,200', alpha: .7, bloom: .3 }); ctx.restore(); }
}
function shimmerFx(lt) {
  const age = lt - DING;
  if (age < -.05 || age > 2.2) return;
  const T = CARD.title, spots = [[-372, -78, 38, 0], [-120, -104, 30, .13], [152, -98, 34, .24], [352, -66, 30, .36], [24, 92, 26, .48], [-290, 88, 22, .6], [262, 94, 24, .7]];
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [dx, dy, r, d] of spots) { const k = sg(age, d, d + .5); star(540 + dx, T.cy + dy, r * Math.sin(Math.PI * k), 1, k * .8); }
  ctx.restore();
}
function idleTwinkles(lt) {
  const T = CARD.title, tw = [[4.95, -330, -96, 26], [5.4, 300, 92, 24], [5.85, -60, -108, 28], [6.2, 380, -70, 22]];
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [t0, dx, dy, r] of tw) { const k = sg(lt, t0, t0 + .5); if (k > 0 && k < 1) star(540 + dx, T.cy + dy, r * Math.sin(Math.PI * k), 1, k * .8); }
  ctx.restore();
}

// ------------------------------------------------------------------ the window: whole until the landing, then three parts that ride out of the frame (the title bar and ribbon up, the tabs and status bar down, the row numbers left)
/* a soft shadow with no body: the shape is drawn 4000 px away and only its shadow lands here */
function shadowOf(pathFn, a, blur = 64, dy = 26) {
  const m = ctx.getTransform(), D = 4000, k = D / (m.a || 1);
  ctx.save(); ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = -D; ctx.shadowOffsetY = dy; ctx.fillStyle = '#000';
  ctx.translate(k, 0); pathFn(); ctx.fill(); ctx.restore();
}
function drawWindow(lt) {
  const G = geo(), so = sheetOpts(lt), uo = eIO(sg(lt, UI0, UI1));
  if (uo >= 1) return;
  ctx.save(); ctx.translate(WIN.x, WIN.y);
  if (uo <= 0) {
    shadowOf(() => { ctx.beginPath(); ctx.roundRect(0, 0, WIN.w, WIN.h, WIN.r); }, .6);
    SH.sheet(Object.assign({}, so, { r: WIN.r }), lt);
  } else {
    const r = WIN.r, gy0 = G.gy0, gy1 = G.gy1, gx0 = G.gx0;
    const parts = [
      { rect: [0, 0, WIN.w, gy0], radii: [r, r, 0, 0], dx: 0, dy: -(gy0 + WIN.y + 80) * uo },
      { rect: [0, gy1, WIN.w, WIN.h - gy1], radii: [0, 0, r, r], dx: 0, dy: (WIN.h - gy1 + WIN.y + 80) * uo },
      { rect: [0, gy0, gx0, gy1 - gy0], radii: 0, dx: -(gx0 + WIN.x + 80) * uo, dy: 0 },
    ];
    for (const p of parts) {
      ctx.save(); ctx.translate(p.dx, p.dy);
      const path = () => { ctx.beginPath(); ctx.roundRect(p.rect[0], p.rect[1], p.rect[2], p.rect[3], p.radii); };
      shadowOf(path, .5 * (1 - uo), 40, 18);
      path(); ctx.clip();
      SH.sheet(Object.assign({}, so, { dressing: true }), lt);   /* the kit paints the whole window; the clip keeps this part (dressing: the clipped-away strings are crop, not errors) */
      ctx.restore();
    }
  }
  ctx.restore();
}
/* the green cell swells until it is the whole grid area: it is the desk again (the stage is drawn inside it), so when the chrome has left nothing is left but the card */
function drawReveal(lt) {
  const k = eIO(sg(lt, 2.80, LAND));
  if (k <= 0) return;
  const G = geo(), R = G.R, a = [WIN.x + R.x, WIN.y + R.y, WIN.x + R.x1, WIN.y + R.y1], b = [WIN.x + G.gx0, WIN.y + G.gy0, WIN.x + G.gx1, WIN.y + G.gy1];
  const x0 = lp(a[0], b[0], k), y0 = lp(a[1], b[1], k), x1 = lp(a[2], b[2], k), y1 = lp(a[3], b[3], k), rad = lp(10, 0, k);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, rad); ctx.clip(); stage(lt); ctx.restore();
  if (k < 1) { ctx.save(); ctx.strokeStyle = `rgba(150,255,210,${.6 * Math.sin(Math.PI * k)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, rad); ctx.stroke(); ctx.restore(); }
}

// ------------------------------------------------------------------ the scene
function titleDraw(lt) {
  stage(lt);
  drawWindow(lt);
  drawReveal(lt);
  landingFx(lt, 'shards');
  const b = bannerState(lt), p = pillState(lt), t = titleState(lt), ds = lt - DING;
  if (b.k > 0) bevelText('SHIFT HAPPENS', b.x, b.y, b.size, { face: FACE_LOGO, extr: .35, lwK: .13, reveal: b.k, hero: b.rest && b.k >= 1, shine: ds > .12 ? eIO(sg(ds, .12, .85)) : -1, shineA: .8, grp: 'bv:logo' });
  if (p.alpha > .01) episodePill(p.x, p.y, p.size, p.h, { alpha: p.alpha, scale: p.scale, hero: p.rest });
  discard('C2', 'FRUIT BOWL', 0, lt);
  discard('D2', 'GREENLEAF', 1, lt);
  if (t.k > 0) bevelText('THE MERGER', t.x, t.y, t.size, { extr: sg(t.size, 70, 200), reveal: t.k, hero: t.rest, shine: ds > 0 ? eIO(sg(ds, 0, .78)) : -1, grp: 'bv:tm' });
  const tg = sg(lt, TAG0, TAG1);
  if (tg > 0) UI.label('Please merge responsibly.', CARD.cx, CARD.tag.cy, { font: 'Nunito', weight: 900, italic: true, size: CARD.tag.size, fill: CREAM, stroke: DEEP_D, lw: 8, shadow: 12, reveal: tg, hero: tg >= 1, crop: tg < 1 });
  landingFx(lt, 'light');
  shimmerFx(lt);
  idleTwinkles(lt);
  if (lt < 3) {
    ctx.save(); ctx.translate(WIN.x, WIN.y);
    tooltip(lt);
    const pp = pointer(lt);
    if (pp.alpha > .01) {
      const trail = [];
      if (pp.press > .3 && lt < DRAG_B + .12 && lt > DRAG_A) for (let i = 7; i >= 1; i--) { const q = pointer(lt - i * .026); trail.push([q.x, q.y]); }
      ctx.save(); ctx.globalAlpha *= pp.alpha; SH.pointer(pp.x, pp.y, { kind: pp.kind, press: pp.press, s: 1.25, trail: trail.length > 1 ? trail.concat([[pp.x, pp.y]]) : undefined }); ctx.restore();
    }
    ctx.restore();
  }
}
const TITLE = {
  noChyron: true, noScrim: true,
  shot() { return 'sheet'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .016 * sg(lt, 0, LAND) + .05 * eIO(sg(lt, LAND, 6.6)));
    CAM.shake = 6 * (lt >= LAND ? ringK(lt - LAND, .05) : 0);
  },
  draw: titleDraw,
  fx(lt) {
    const land = lt >= LAND ? ringK(lt - LAND, .12) : 0, fin = lt < .2 ? 1 - lt / .2 : 0, fout = sg(lt, 6.48, 6.6);
    return { bloom: .46 + .5 * land + .25 * sg(lt, LAND, 4.2), vignette: lp(.14, .4, sg(lt, 2.8, 3.8)), grain: .05, contrast: .12, sat: .06, aberr: 5 * land, tint: [['#ffb86b', .07 * sg(lt, LAND, 4.4), 'soft-light']], fade: Math.max(fin, fout), fadeColor: '2,8,5' };
  },
  blur(lt) { return lt < .2 ? 1 : (lt > 1.68 && lt < 2.0) ? 6 : (lt > 2.4 && lt < 3.62) ? 10 : (lt > 3.62 && lt < 4.0) ? 5 : 2; },
  over() {},
};
window.__EP15_SCENES.title = TITLE;

// =====================================================================================================================================================================================================
// END (8.0 s, noScrim, noChyron): the cast as a staff sheet. The same floating GridSheet window on the same deep-green desk as the title; the ribbon is collapsed and the row and column headers are hidden (a clean report
// view: the grid is 1040 wide, symmetric about the frame's centre, so everything centred is centred on x 540). Layout (window-local): title block A1:D2 (rows 84 + 116, deep green: THANKS FOR WATCHING over SHIFT HAPPENS),
// header row 56, eleven staff rows of 96 (portrait 96 | NAME 224 | ROLE 296 | STATUS 424 = 1040), a footnote row of 52 (the per diem joke); the table ends 228 px above the tab bar: that zone is the stamp's, then the teaser banner's.
//   Cues (scene-local s): theme15 .10 | typing 1.10 | click 3.10 | stamp 4.00 | textding 5.50.
//   0.00-0.10 fade up.  0.12-0.85 THANKS FOR WATCHING types in, SHIFT HAPPENS pops in (the theme), the header row types.
//   1.10-2.60 the roster types in, one row every 0.125 s (the portrait pops, then NAME, ROLE, STATUS), the selection hops along the cells being typed, the formula bar follows.
//   2.58 the Save As dialog pops in over the dimmed sheet; 2.72-3.00 the file name types in; the pointer arrives and PRESSES SAVE on the click (3.10); 3.14-3.32 the dialog closes, the title bar reads
//   FRUIT_SALAD_FINAL_v7_REAL and Saved.   4.00 STAMP: SAVED slams down in the empty zone under the table (a ring, a shake of the camera), gone by 4.62.
//   4.60-5.15 a new tab, Sheet16 (amber), grows at the end of the tab bar, glows, and LIFTS OFF as the banner NEXT: EPISODE 16 / THE VOTE.   5.50 textding: a gloss sweeps across THE VOTE and SHIFT HAPPENS, stars.
//   Idle to 7.6: the portraits breathe and blink, Tomato changes her mind every 1.6 s, the tab glows, a light sweeps the window.   7.6-8.0 fade to dark. */

const EC = { A: 96, B: 224, C: 296, D: 424 };
const ER = (() => { const r = { 1: 84, 2: 116, 3: 56, 15: 52 }; for (let i = 4; i <= 14; i++) r[i] = 96; return r; })();
const TONE = {
  err: { color: '#d93025', fill: '#fde7e5' }, amber: { color: '#8f5600', fill: '#fff1c4' }, green: { color: '#0f6b3c', fill: '#e3f4ea' }, blue: { color: '#1f55c8', fill: '#dbe7ff' }, plain: { color: '#22262b', fill: null },
};
const ROSTER = [
  { name: 'Strawberry', role: 'Nurse (per diem)', status: '#N/A', tone: 'err', bg: '#ffe2cf', ring: ORANGE, ctor: 'straw', expr: 'weak', s: .27 },
  { name: 'Lemon', role: 'Charge Nurse', status: 'DUPLICATE?', tone: 'amber', bg: '#fff3b8', ring: ORANGE, ctor: 'lemon', expr: 'sour', s: .27 },
  { name: 'Mango', role: 'CNA', status: 'PENDING', tone: 'amber', bg: '#ffe7c2', ring: ORANGE, ctor: 'mango', expr: 'neutral', s: .25 },
  { name: 'Clementine', role: 'New Hire', status: 'Sure!', tone: 'green', bg: '#ffe2cf', ring: ORANGE, ctor: 'clem', expr: 'happy', s: .29 },
  { name: 'Melon', role: 'Administrator', status: 'TOP LEFT', tone: 'plain', bg: '#f4ead2', ring: ORANGE, ctor: 'melon', expr: 'smug', s: .27 },
  { name: 'Mr. Artichoke', role: 'CEO\n(11 LAYERS)', status: 'ACTIVE', tone: 'green', bg: '#d9f3e4', ring: LEAF, ctor: 'arti', expr: null, s: .27 },
  { name: 'Onion', role: 'Compliance', status: 'CRYING', tone: 'blue', bg: '#e6e2fb', ring: '#6d5bd0', ctor: 'onion', expr: null, s: .26 },
  { name: 'Tomato', role: 'HR', status: 'FRUIT OR VEGETABLE:\nPENDING', tone: 'amber', bg: '#e6e2fb', ring: '#6d5bd0', ctor: 'tomato', expr: null, s: .26 },
  { name: 'Broccoli', role: 'Administrator\n(Greenleaf)', status: 'SALAD', tone: 'green', bg: '#d9f3e4', ring: LEAF, ctor: 'broc', expr: null, s: .24 },
  { name: 'Carrot', role: 'Charge Nurse\n(Greenleaf)', status: 'SENIORITY:\nREMOVED', tone: 'err', bg: '#d9f3e4', ring: LEAF, ctor: 'carrot', expr: null, s: .26 },
  { name: 'Binder', role: 'Assistant', status: 'HERE TO HELP', tone: 'blue', bg: '#e5e8ec', ring: '#5b6470', ctor: 'bind', expr: null, s: .3 },
];
const E = { type0: 1.10, dt: .125, dlgIn: 2.56, nameA: 2.72, nameB: 3.0, click: 3.10, dlgOut: 3.14, dlgGone: 3.34, stamp: 4.0, tab: 4.6, lift: 5.15, ding: 5.5, out: 7.6 };
const rowT = i => E.type0 + i * E.dt;
const FILE = 'FRUIT_SALAD_FINAL_v7_REAL';
const EBASE = {
  w: WIN.w, h: WIN.h, doc: 'FRUIT_BOWL_STAFF_FINAL_v3', saved: false, cols: EC, rows: ER, merges: ['A1:D2', 'A15:D15'], handle: false,
  ribbon: { collapsed: true, tab: 'Home' }, show: { title: true, ribbon: true, formula: true, headers: false, sheetTabs: true, status: true },
};
let EGEO = null;
function egeo() {
  if (EGEO) return EGEO;
  const o = Object.assign({}, EBASE, { tabs: ['Sheet1', 'Staff', 'Policies'] }), L = SH.layout(o);
  EGEO = { L, o, rc: ref => SH.cellRect(ref, o), gx0: L.gx0, gy0: L.gy0, gx1: L.gx1, gy1: L.gy1 };
  return EGEO;
}
const prefix = (s, k) => k >= 1 ? s : s.slice(0, Math.ceil(s.length * k));
const tabsFor = lt => ['Sheet1', 'Staff', 'Policies'].concat(lt >= E.tab ? [{ name: 'Sheet16', u: eIO(sg(lt, E.tab, E.tab + .3)), color: '#ffbf1f' }] : []);
/* the window-local rectangle of a sheet tab (the kit's own formulas) */
function tabRect(name, lt) {
  const G = egeo(), tabs = tabsFor(lt), y0 = G.L.stabs[0], h = G.L.stabs[1];
  let x = 84;
  for (const tb of tabs) { const n = typeof tb === 'object' ? tb.name : tb, w = UI.sizeOf(n, { size: 22, weight: 800 }).w + 44; if (n === name) return { x, y: y0, w, h, cx: x + w / 2, cy: y0 + h / 2 }; x += w; }
  return null;
}

/* the cells of the moment: the title block, the header, the roster typing in; the selection hops along the cell being typed */
function endState(lt) {
  const cells = { A1: { v: '', fill: DEEP } }, hero = !(lt >= E.dlgIn && lt < E.dlgGone);   /* under the dim of the dialog nothing is hero */
  const hk = sg(lt, .55, .85), hdr = { fill: DEEP, color: CREAM, size: 26, weight: 900, spacing: 3, hero: false };
  cells.A3 = { v: '', fill: DEEP }; cells.B3 = Object.assign({ v: 'NAME', typed: hk }, hdr); cells.C3 = Object.assign({ v: 'ROLE', typed: hk }, hdr); cells.D3 = Object.assign({ v: 'STATUS', typed: hk }, hdr);
  cells.A15 = { v: '* Per diem is not in the headcount.', typed: sg(lt, 2.5, 2.9), italic: true, size: 30, weight: 700, color: '#5b6470', align: 'center', hero: hero && !(lt >= E.stamp - .16 && lt < E.stamp + .1), fill: '#ffffff' };   /* the stamp swoops over the footnote on its way in */
  let active = 'A1', ftxt = '', fk = 1, sel = null;
  ROSTER.forEach((p, i) => {
    const r = 4 + i, t0 = rowT(i), zebra = lt < t0 ? undefined : i % 2 ? '#f2f8f4' : '#ffffff', tn = TONE[p.tone];
    const kB = sg(lt, t0 + .02, t0 + .12), kC = sg(lt, t0 + .06, t0 + .16), kD = sg(lt, t0 + .10, t0 + .20);
    cells['A' + r] = { v: '', fill: zebra };
    cells['B' + r] = { v: p.name, typed: kB, fill: zebra, size: 30, weight: 900, color: '#0d2b21', hero, pad: 12 };
    cells['C' + r] = { v: prefix(p.role, kC), fill: zebra, size: 30, weight: 700, color: '#46505b', hero, pad: 14, wrap: p.role.includes('\n') };
    const isErr = p.status[0] === '#';
    cells['D' + r] = { v: p.status.includes('\n') ? prefix(p.status, kD) : p.status, typed: p.status.includes('\n') ? undefined : kD, fill: lt < t0 + .1 ? zebra : tn.fill || zebra, size: 30, weight: 900, color: tn.color, hero, pad: 16, wrap: p.status.includes('\n'), align: isErr ? 'center' : 'left' };
    if (isErr) cells['D' + r].pulse = sg(lt, t0 + .1, t0 + .9);
    if (lt >= t0 + .02) { const pick = lt < t0 + .06 ? ['B', p.name, kB] : lt < t0 + .10 ? ['C', p.role.replace('\n', ' '), kC] : ['D', p.status.replace('\n', ' '), kD]; active = pick[0] + r; ftxt = pick[1]; fk = pick[2]; }
  });
  return { cells, active, ftxt, fk };
}
function endOpts(lt) {
  const st = endState(lt), dlg = lt >= E.dlgIn && lt < E.dlgGone;
  const o = Object.assign({}, EBASE, {
    cells: st.cells, tabs: tabsFor(lt), tab: 'Staff', status: 'Ready', stats: lt > E.type0 + 11 * E.dt ? ['Count: 11'] : [],
    sel: st.active, active: st.active, nameBox: st.active, formula: { text: st.ftxt, typed: st.fk }, selFill: false,
  });
  const saved = lt >= E.dlgOut;
  o.doc = saved ? FILE : EBASE.doc; o.saved = saved ? 'Saved' : false;
  if (lt >= E.type0 + 11 * E.dt + .1) { o.sel = 'D14'; o.active = 'D14'; o.nameBox = 'D14'; o.formula = { text: 'HERE TO HELP', typed: 1 }; }
  if (lt >= E.dlgIn) { o.sel = 'D14'; o.selK = 0; }
  if (dlg) o.dressing = true;
  return o;
}

// ------------------------------------------------------------------ the portraits: the sprites at small scale, cropped to a disc, centred in column A of their row
const PORT_FALLBACK = new Set();
function portraitCtor(key) {
  const g = window;
  return { straw: () => (g.A11 && g.A11.straw) || (g.A7 && g.A7.straw), lemon: () => g.A7 && g.A7.lemon, mango: () => g.A7 && g.A7.mango, clem: () => g.A10 && g.A10.clem, melon: () => g.A9 && g.A9.melon,
    arti: () => g.A15 && g.A15.artichoke, onion: () => g.A15 && g.A15.onion, tomato: () => g.A15 && g.A15.tomato, broc: () => g.A15 && g.A15.broccoli, carrot: () => g.A15 && g.A15.carrot, bind: () => g.A15 && g.A15.binder }[key]();
}
function portrait(p, i, lt) {
  const t0 = rowT(i), k = sg(lt, t0, t0 + .2);
  if (k <= 0) return;
  const R = egeo().rc('A' + (4 + i)), cx = WIN.x + R.cx, cy = WIN.y + R.cy, rad = 40, pop = back(k, 2.4);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy); ctx.globalAlpha *= sg(k, 0, .35);
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fillStyle = p.bg; ctx.fill();
  const ctor = portraitCtor(p.ctor);
  if (ctor) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rad - 1, 0, TAU); ctx.clip();
    try {
      const x = { t: lt, noLegs: true, noShadow: true, noReflect: true, s: p.s, x: 0, y: 0 };
      if (p.ctor === 'tomato') { const ph = Math.max(0, lt - t0 - .3), n = Math.floor(ph / 1.6), pose = n % 2 ? 'veg' : 'fruit'; Object.assign(x, { tomPose: pose, tomFrom: n % 2 ? 'fruit' : 'veg', flipT: n > 0 || ph > 0 ? Math.min(.6, ph - n * 1.6) : 1 }); }
      if (p.ctor === 'bind') Object.assign(x, { grin: .55, glint: .5 + .5 * Math.sin(lt * 2.4), center: true, bob: 0, hover: 0 });
      if (p.expr) x.expr = p.expr;
      if (p.ctor === 'onion') x.pose = 'rest';
      if (p.ctor === 'tomato') { x.formsN = 0; }
      if (p.ctor === 'broc') x.bowl = false;
      const o = Object.assign(ctor(x), x);
      if (p.ctor === 'tomato' || p.ctor === 'onion' || p.ctor === 'broc') o.hold = {};   /* a portrait carries no props: they would cover the small faces */
      if (p.ctor === 'bind') { o.x = cx; o.y = cy - 12 * p.s; }
      else { const [fx, fy] = window.H6.faceC(o); o.x = cx - fx; o.y = cy - fy + 4; }
      drawChar(o);
    } catch (e) { if (!PORT_FALLBACK.has(p.name)) { PORT_FALLBACK.add(p.name); console.error('E15-A portrait ' + p.name + ': ' + e.message); } }
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = p.ring; ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ the title block, the stamp, the teaser banner
const ZONE = { cy: 1686 };   /* the empty zone under the table (screen): the stamp lands here, then the banner lifts into it */
function endTitle(lt, dim) {
  const gy = WIN.y + egeo().gy0, k1 = sg(lt, .12, .42), p = sg(lt, .2, .6), pop = back(p, 2.0), ds = lt - E.ding;
  if (k1 > 0) UI.label('THANKS FOR WATCHING', 540, gy + 45, { font: 'Nunito', weight: 900, size: 32, spacing: 7, fill: CREAM, reveal: k1, hero: k1 >= 1 && !dim, crop: k1 < 1 || dim, maxW: 900 });
  if (p > 0) {
    const cy = gy + 118, sc = lp(1.28, 1, pop);
    ctx.save(); ctx.translate(540, cy); ctx.scale(sc, sc); ctx.translate(-540, -cy);
    bevelText('SHIFT HAPPENS', 540, cy, 104, { face: FACE_LOGO, extr: .35, lwK: .13, alpha: sg(p, 0, .3), hero: p >= 1 && !dim, shine: ds > .15 ? eIO(sg(ds, .15, .85)) : -1, shineA: .8, grp: 'bv:end-logo' });
    ctx.restore();
  }
}
function stampFx(lt) {
  const age = lt - E.stamp;
  if (lt < E.stamp - .1 || lt > E.tab + .3) return;
  const k = sg(lt, E.stamp - .09, E.stamp), a = (1 - sg(lt, 4.45, 4.64)), settle = lt >= E.stamp ? 1 + .06 * Math.sin(Math.min(1, age / .16) * PI) * (1 - Math.min(1, age / .16)) * 2 : 1;
  const sc = lt < E.stamp ? lp(2.1, 1, eI(k)) : 1 / settle;
  if (a <= .01) return;
  ctx.save(); ctx.globalAlpha *= a * (lt < E.stamp ? sg(k, 0, .5) : 1);
  ctx.translate(540, ZONE.cy); ctx.scale(sc, sc); ctx.translate(-540, -ZONE.cy);
  UI.stamp('SAVED', 540, ZONE.cy, { font: 'Bangers', size: 118, color: '#1e8e5a', rot: -.1, lw: 11, padX: 62, padY: 30, alpha: .94, hero: lt >= E.stamp + .17 && lt < 4.4, crop: !(lt >= E.stamp + .17 && lt < 4.4), id: 'fp15a.stamp' });
  ctx.restore();
  if (age >= 0 && age < .7) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(540, ZONE.cy, age / .7, { r0: 90, r1: 560, lw: 14, color: '120,235,170', alpha: .85, bloom: .5, squash: .55 }); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const f = ringK(age, .09), g = ctx.createRadialGradient(540, ZONE.cy, 0, 540, ZONE.cy, 520); g.addColorStop(0, `rgba(160,255,200,${.45 * f})`); g.addColorStop(1, 'rgba(160,255,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, ZONE.cy - 520, W, 1040); ctx.restore();
  }
}
function tabGlow(lt) {
  if (lt < E.tab) return;
  const t = tabRect('Sheet16', lt), ku = eIO(sg(lt, E.tab, E.tab + .3));
  if (!t || ku <= .02) return;
  const x = WIN.x + t.x, y = WIN.y + t.y, w = t.w * eO(ku), pulse = .5 + .5 * Math.sin(lt * 5.2);
  ctx.save();
  ctx.fillStyle = '#ffbf1f'; ctx.beginPath(); ctx.roundRect(x, y + 1, w, t.h - 1, [0, 0, 10, 10]); ctx.fill();   /* a solid amber tab over the kit's own: same rectangle */
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.roundRect(x, y + 1, w, 6, 3); ctx.fill();
  if (ku >= .6) UI.label('Sheet16', x + w / 2, y + t.h / 2 + 2, { size: 22, weight: 900, fill: '#3b2a00', alpha: sg(ku, .6, 1), hero: false, crop: true, maxW: w - 24 });
  ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x + w / 2, y + t.h / 2, 0, x + w / 2, y + t.h / 2, 130); g.addColorStop(0, `rgba(255,200,60,${.4 * ku * (.55 + .45 * pulse)})`); g.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 130, y - 110, w + 260, 240);
  ctx.restore();
}
function nextBanner(lt) {
  const t = tabRect('Sheet16', lt);
  if (!t || lt < E.tab + .12) return;
  const p = sg(lt, E.tab + .12, E.lift), e = back(p, 1.5), bw = 880, bh = 168, bx = 540 - bw / 2, by = ZONE.cy - bh / 2 + 2 * Math.sin(lt * 2.2) * sg(lt, E.lift, E.lift + .3);
  const tx = WIN.x + t.x, ty = WIN.y + t.y, X = lp(tx, bx, e), Y = lp(ty, by, e), Wd = lp(t.w, bw, e), Hd = lp(t.h, bh, e), r = lp(10, 26, Math.min(1, e));
  const rest = p >= 1, col = '#0e3a2a';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 36 * Math.min(1, e); ctx.shadowOffsetY = 14 * Math.min(1, e);
  const g = ctx.createLinearGradient(0, Y, 0, Y + Hd); g.addColorStop(0, '#16573f'); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(X, Y, Wd, Hd, r); ctx.fill(); ctx.restore();
  ctx.save(); ctx.strokeStyle = '#ffbf1f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(X + 2, Y + 2, Wd - 4, Hd - 4, r - 2); ctx.stroke(); ctx.restore();
  const ta = sg(p, .5, .9);
  if (ta > 0) {
    const ds = lt - E.ding, cy1 = Y + 46, cy2 = Y + 114;
    UI.label('NEXT: EPISODE 16', 540, cy1, { font: 'Nunito', weight: 900, size: 34, spacing: 6, fill: CREAM, alpha: ta, hero: rest, crop: !rest, maxW: 800 });
    bevelText(TEASER16, 540, cy2, 96, { face: FACE, extr: .3, lwK: .12, alpha: ta, hero: rest, shine: ds > 0 ? eIO(sg(ds, 0, .8)) : -1, grp: 'bv:teaser' });
  }
}
function endFx(lt) {
  const ds = lt - E.ding;
  if (ds < -.05 || ds > 2.2) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const spots = [[-300, 1612, 30, 0], [-120, 1578, 24, .1], [170, 1584, 28, .2], [330, 1640, 26, .32], [40, 1770, 22, .42], [-380, 336, 30, .05], [350, 300, 28, .25]];
  for (const [dx, y, r, d] of spots) { const k = sg(ds, d, d + .5); star(540 + dx, y, r * Math.sin(Math.PI * k), 1, k * .8); }
  ctx.restore();
}

// ------------------------------------------------------------------ the scene
const FILES = ['FRUIT_SALAD_FINAL_v6.gsx', 'FRUIT_SALAD_FINAL_v5_USE_THIS.gsx', 'FRUIT_BOWL_OLD_DO_NOT_OPEN.gsx', 'ORG_CHART_REAL_REAL.gsx'];
function dlgOpts(lt) {
  const n = Math.round(FILE.length * sg(lt, E.nameA, E.nameB)), p = savePointer(lt);
  return { kind: 'saveAs', w: WIN.w, h: WIN.h, at: [WIN.w / 2, 700], name: [FILE, SH.typed(n, FILE.length)], press: { id: 'save', k: p.press }, btnFocus: 'save', t: lt, files: FILES, folder: 'Merger', path: 'Documents  /  Merger' };
}
function savePointer(lt) {
  const aim = SH.dialogRect({ kind: 'saveAs', w: WIN.w, h: WIN.h, at: [WIN.w / 2, 700] }, 'save').aim;
  const c = SH.cursorPath([{ t: 2.62, x: 900, y: 1190, kind: 'arrow' }, { t: 3.04, x: aim[0], y: aim[1], kind: 'arrow', click: [E.click - .09, E.click + .1], over: .04 }, { t: 3.4, x: aim[0] + 14, y: aim[1] + 10, kind: 'arrow' }], lt);
  return { x: c.x, y: c.y, press: c.press, alpha: sg(lt, 2.62, 2.8) * (1 - sg(lt, 3.2, 3.33)) };
}
function endDraw(lt) {
  stage(lt);
  const o = endOpts(lt), dlgOn = lt >= E.dlgIn && lt < E.dlgGone;
  ctx.save(); ctx.translate(WIN.x, WIN.y);
  shadowOf(() => { ctx.beginPath(); ctx.roundRect(0, 0, WIN.w, WIN.h, WIN.r); }, .6);
  SH.sheet(Object.assign({}, o, { r: WIN.r }), lt);
  ctx.restore();
  ROSTER.forEach((p, i) => portrait(p, i, lt));
  if (lt >= rowT(0) + .15) { const R = egeo().rc('D4'); ctx.save(); ctx.fillStyle = '#d93025'; ctx.beginPath(); ctx.moveTo(WIN.x + R.x + 1, WIN.y + R.y + 1); ctx.lineTo(WIN.x + R.x + 19, WIN.y + R.y + 1); ctx.lineTo(WIN.x + R.x + 1, WIN.y + R.y + 19); ctx.closePath(); ctx.fill(); ctx.restore(); }   /* the error corner of #N/A */
  endTitle(lt, dlgOn);
  tabGlow(lt);
  if (lt >= E.dlgIn && lt < E.dlgGone) {
    ctx.save(); ctx.translate(WIN.x, WIN.y);
    const u = Math.min(sg(lt, E.dlgIn, E.dlgIn + .16), 1 - sg(lt, E.dlgOut, E.dlgOut + .2));
    SH.dialog(dlgOpts(lt), u);
    ctx.restore();
  }
  stampFx(lt);
  nextBanner(lt);
  endFx(lt);
  // a soft light sweeps the window now and then
  const sw = ((lt - 5.9) % 3.4 + 3.4) % 3.4 / 1.1;
  if (lt > 5.9 && sw < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const x = lp(-200, 1280, eIO(sw)), g = ctx.createLinearGradient(x - 160, 0, x + 160, 380); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); ctx.fill(); ctx.restore(); }
  if (lt >= 2.6 && lt < 3.62) {
    const pp = savePointer(lt);
    if (pp.alpha > .01) { ctx.save(); ctx.translate(WIN.x, WIN.y); ctx.globalAlpha *= pp.alpha; SH.pointer(pp.x, pp.y, { kind: 'arrow', press: pp.press, s: 1.25 }); ctx.restore(); }
  }
}
const END = {
  noChyron: true, noScrim: true,
  shot() { return 'sheet'; },
  cam(lt) {
    zoomTo(540, 960, 1 + .022 * eIO(sg(lt, 0, 8)));
    CAM.shake = 5 * (lt >= E.stamp ? ringK(lt - E.stamp, .05) : 0);
  },
  draw: endDraw,
  fx(lt) {
    const fin = lt < .1 ? 1 - lt / .1 : 0, fout = sg(lt, E.out, 8), st = lt >= E.stamp ? ringK(lt - E.stamp, .1) : 0, dd = lt >= E.ding ? ringK(lt - E.ding, .5) : 0;
    return { bloom: .4 + .35 * st + .25 * dd, vignette: .16, grain: .045, contrast: .1, sat: .05, aberr: 3 * st, tint: [['#ffb86b', .05, 'soft-light']], fade: Math.max(fin, fout), fadeColor: '2,8,5' };
  },
  blur(lt) { return (lt > 2.8 && lt < 3.2) ? 4 : (lt > E.stamp - .12 && lt < E.stamp + .12) ? 6 : (lt > E.tab && lt < E.lift + .05) ? 5 : 2; },
  over() {},
  label: () => 'THANKS FOR WATCHING',
};
window.__EP15_SCENES.end = END;
/* shared with ep15_close.js (the banner's lettering, the shimmer): the lettering and light helpers of this module */
window.FP15A = { bevelText, star, meas, vgrad, stage, shadowOf, FACE, FACE_LOGO, DEEP, DEEP_D, DEEP_L, YEL, CREAM, INK, RED, ORANGE, LEAF, MID };
})();
