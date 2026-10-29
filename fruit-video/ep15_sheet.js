'use strict';
/* SH15, GridSheet: the spreadsheet UI kit of Episode 15 (window.SH15). Owner: E15-SHEET. The API is documented in GUIDE_SHEET.md; this header is the map.
 *
 * GridSheet is an invented app (never a real product's name, logo, icons or clip art). Everything is drawn in a LOCAL FRAME whose origin is the top-left of the sheet window; the caller translates and
 * scales (0.35 on a TV ... 3 in a cell close-up). All text goes through the UI kit (UI.label / UI.write); text that is not the subject is hero:false, and `dressing: true` turns ALL of it
 * into hero:false + crop:true. Every call is a pure function of its arguments (time t, progress u).
 *
 *   SH15.sheet(o, t)                    the whole window: title bar, ribbon, formula bar, grid, selection, merged cells, sheet tabs, status bar        -> layout L
 *   SH15.merge(o, u)                    the signature animation (sheet + merge region), exact on the final frame
 *   SH15.dialog(o, u)                   a modal over the dimmed sheet: warn info error findReplace saveAs cantUndo removeDuplicates
 *   SH15.pointer(x, y, o)               the friendly mouse pointer; SH15.cursorPath(points, t) -> {x, y, press, kind}
 *   SH15.flipText(from, to, u, o)       letter by letter odometer text change (cells and world signs)
 *   SH15.errorCell(ref, text, u, o)     SH15.fillDrag(o, u)    SH15.removeDuplicates(o, u)    SH15.insertRow(o, u)
 *   SH15.call(o, t)                     the laggy video-call window        SH15.binder(o, t)  the assistant's chat bubble
 *   SH15.keys(keys, cx, cy, o)         key caps (Ctrl + Z) pressed        SH15.typed(n, len)  the `typed` value for exactly n letters
 *   SH15.cellRect(ref, o), SH15.colX(col, o), SH15.rowY(row, o), SH15.buttonRect(id, o), SH15.dialogRect(o, what), SH15.binderRect(o, id), SH15.layout(o)   layout queries (sheet-local)
 * Test page: sheet_demo.html (the text gate runs over it). Cost: a full sheet about 6 ms, a dialog about 7 ms.
 */
(() => {
if (!window.UI) return;
const SH = window.SH15 = {};

// ---------------------------------------------------------------- palette and small maths
const C = {
  white: '#ffffff', grid: '#d9dce1', head: '#f1f3f5', ink: '#22262b', blue: '#2b6cff', green: '#1e8e5a', amber: '#ffbf1f', red: '#d93025', dialog: '#eef0f3',
  shadow: 'rgba(20,24,30,.28)', deep: '#103a2c', mute: '#5b6470', soft: '#8a929c', line2: '#c3c8cf', blueSoft: '#dbe7ff', greenSoft: '#e3f4ea', amberSoft: '#fff1c4', redSoft: '#fde7e5',
};
SH.colors = C;
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sg = (t, a, b) => cl((t - a) / (b - a));
const eIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eO = k => 1 - Math.pow(1 - k, 3);
const eI = k => k * k * k;
const eB = k => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const rnd = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const hex2rgb = h => { h = String(h); if (h[0] !== '#') return [34, 38, 43]; const n = parseInt(h.length === 4 ? h.slice(1).replace(/./g, '$&$&') : h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, k) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${Math.round(lp(A[0], B[0], k))},${Math.round(lp(A[1], B[1], k))},${Math.round(lp(A[2], B[2], k))})`; };
const rgba = (c, a) => { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; };
const rect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r || 0); };

// ---------------------------------------------------------------- text: one place decides hero / crop (dressing turns everything into set dressing)
const MODE = { dress: false };
let PANE = null;   /* the visible rectangle [x0, y0, x1, y1] of the grid pane being drawn: text that falls outside it is skipped, text cut by it is cropped */
function opt(o) {
  if (MODE.dress && o.hero !== true) { o.hero = false; o.crop = true; }
  else if (o.hero === undefined) o.hero = false;
  return o;
}
/* every label is nudged by at most half a unit so that its baseline and its ink edge fall on whole units: at scale 1 the letters then sit on whole pixels (crisp stems and bars). o.snap: false keeps the exact position. */
const uiW = (font, w) => w ?? (font === 'Bangers' || font === 'Lucky' ? 400 : 900);
function T(s, cx, cy, o) {
  o = opt(o);
  if (o.snap !== false && !o.rot && s !== '' && s != null) {
    s = String(s);
    const font = o.font || 'Nunito', wt = uiW(font, o.weight), it = !!o.italic;
    let size = o.size ?? 40, sp = o.spacing || 0;
    if (o.maxW) { const f = UI.fit(s, o.maxW, Object.assign({ quiet: true }, o)); size = f.size; sp = f.spacing; }
    const m = meas(s, size, font, wt, it, sp), al = o.align || 'center', a = al === 'left' ? m.l : al === 'right' ? m.r : (m.l + m.r) / 2, cap = UI.metrics(font, o.weight, it).cap * size;
    cx = Math.round(cx - a) + a; cy = Math.round(cy + cap / 2) - cap / 2;
  }
  return UI.label(s, cx, cy, o);
}
const TW = (s, x, base, o) => UI.write(s, x, base, opt(o));
/* an own measuring canvas (the same measureText the UI kit uses), for glyph-by-glyph layouts */
const mcv = document.createElement('canvas'); mcv.width = mcv.height = 8; mcv.__txOK = true;
const mctx = mcv.getContext('2d');
const MM = new Map();
function meas(str, size, font, weight, italic, spacing) {
  const key = `${font}|${weight}|${italic ? 1 : 0}|${size}|${spacing || 0}|${str}`;
  let r = MM.get(key);
  if (r) return r;
  const spec = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;
  mctx.font = spec; mctx.letterSpacing = spacing ? spacing + 'px' : '0px'; mctx.textAlign = 'left'; mctx.textBaseline = 'alphabetic';
  const m = mctx.measureText(str);
  r = { l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, adv: m.width };
  if (!(r.r > r.l)) { r.l = 0; r.r = 0; }
  let ok = true; try { ok = document.fonts.check(spec); } catch (e) { /* no font API */ }
  if (ok) { if (MM.size > 5000) MM.clear(); MM.set(key, r); }
  return r;
}

// ---------------------------------------------------------------- references: 'B12', 'A1:C3'
const colLetters = c => { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };
const colIndex = s => { let c = 0; for (const ch of String(s).toUpperCase()) c = c * 26 + (ch.charCodeAt(0) - 64); return c - 1; };
const REFC = new Map();
function ref(s) {
  if (s && typeof s === 'object') return s;
  let v = REFC.get(s);
  if (v) return v;
  const m = /^\$?([A-Za-z]+)\$?(\d+)$/.exec(String(s).trim());
  v = m ? { c: colIndex(m[1]), r: +m[2] - 1 } : { c: 0, r: 0, bad: true };
  if (REFC.size > 4000) REFC.clear();
  REFC.set(s, v);
  return v;
}
function range(s) {
  if (s && typeof s === 'object' && s.c0 != null) return s;
  const p = String(s).split(':'), a = ref(p[0]), b = ref(p[1] || p[0]);
  return { c0: Math.min(a.c, b.c), r0: Math.min(a.r, b.r), c1: Math.max(a.c, b.c), r1: Math.max(a.r, b.r) };
}
const refName = (c, r) => colLetters(c) + (r + 1);
SH.colLetters = colLetters; SH.parseRef = ref; SH.parseRange = range;

// ---------------------------------------------------------------- values
const ERR = /^#(N\/A|REF!|VALUE!|NAME\?|DIV\/0!|NULL!|NUM!)$/;
const isErr = v => typeof v === 'string' && ERR.test(v);
function fmtNum(v, f) {
  if (typeof f === 'function') return String(f(v));
  const g = (x, d) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  switch (f) {
    case 'usd': return (v < 0 ? '-$' : '$') + g(Math.abs(v), 2);
    case 'usd0': return (v < 0 ? '-$' : '$') + g(Math.abs(v), 0);
    case 'pct': return g(v * 100, 0) + '%';
    case 'pct1': return g(v * 100, 1) + '%';
    case 'dec1': return g(v, 1);
    case 'dec2': return g(v, 2);
    case 'int': return g(Math.round(v), 0);
    case 'num': return g(v, Number.isInteger(v) ? 0 : 2);
    default: return String(v);
  }
}
const cellStr = sp => { const v = sp.v; return v == null || v === '' ? '' : typeof v === 'number' ? fmtNum(v, sp.fmt) : String(v); };
const normCell = c => c == null ? null : typeof c === 'object' ? c : { v: c };

// ---------------------------------------------------------------- layout: where everything is, in the window's local frame
/* heights in sheet units at ui = 1: title bar 72, ribbon tab row 60, ribbon body 168, formula bar 56, column letters 44, sheet tabs 56, status bar 44; row numbers 64 wide */
function layout(o) {
  o = o || {};
  const Wd = o.w ?? 1080, Hd = o.h ?? 1920, ui = o.ui ?? 1, z = o.zoom ?? 1;
  const sh = Object.assign({ title: true, ribbon: true, formula: true, headers: true, sheetTabs: true, status: true }, o.show);
  const rb = o.ribbon && typeof o.ribbon === 'object' ? o.ribbon : {};
  const ribOn = o.ribbon !== false && sh.ribbon !== false, body = ribOn && !rb.collapsed;
  const hT = sh.title ? 72 * ui : 0, hTR = ribOn ? 60 * ui : 0, hRB = body ? 168 * ui : 0, hF = sh.formula ? 56 * ui : 0, hC = sh.headers ? 44 * ui : 0, hTb = sh.sheetTabs ? 56 * ui : 0, hS = sh.status ? 44 * ui : 0;
  const wR = sh.headers ? 64 * ui : 0;
  let yy = 0;
  const title = [yy, hT]; yy += hT;
  const tabRow = [yy, hTR]; yy += hTR;
  const ribbon = [yy, hRB]; yy += hRB;
  const fbar = [yy, hF]; yy += hF;
  const colHead = [yy, hC]; yy += hC;
  const gx0 = wR, gy0 = yy, gx1 = Wd;
  let gy1 = Hd - hTb - hS;
  const stabs = [Hd - hS - hTb, hTb], status = [Hd - hS, hS];
  const dcw = o.colW ?? 160, drh = o.rowH ?? 52;
  const cwOf = c => { let v; const co = o.cols; if (Array.isArray(co)) v = co[c]; else if (co) v = co[colLetters(c)] ?? co[c]; return (v ?? dcw) * z; };
  const rhOf = r => { let v; const ro = o.rows; if (Array.isArray(ro)) v = ro[r]; else if (ro) v = ro[r + 1]; return (v ?? drh) * z; };
  const cs = [0], rs = [0];
  const needC = n => { while (cs.length <= n) cs.push(cs[cs.length - 1] + cwOf(cs.length - 1)); return cs[n]; };
  const needR = n => { while (rs.length <= n) rs.push(rs[rs.length - 1] + rhOf(rs.length - 1)); return rs[n]; };
  const fz = typeof o.freeze === 'number' ? { rows: o.freeze, cols: 0 } : Object.assign({ rows: 0, cols: 0 }, o.freeze);
  const fc = fz.cols | 0, fr = fz.rows | 0;
  const fW = needC(fc), fH = needR(fr);
  const sx = Math.max(0, o.scroll ? o.scroll[0] || 0 : 0), sy = Math.max(0, o.scroll ? o.scroll[1] || 0 : 0);
  const xOf = c => c < fc ? gx0 + needC(c) : gx0 + fW + (needC(c) - fW) - sx;
  const yOf = r => r < fr ? gy0 + needR(r) : gy0 + fH + (needR(r) - fH) - sy;
  const L = {
    Wd, Hd, ui, z, sh, ribOn, body, ribbonOpt: rb, title, tabRow, ribbon, fbar, colHead, stabs, status, gx0, gy0, gx1, gy1, wR, fc, fr, fW, fH, sx, sy, cwOf, rhOf, xOf, yOf,
    /* rect of the cells c0..c1 x r0..r1 (0-based) in the window's frame */
    rect(c0, r0, c1, r1) { const x = xOf(c0), y = yOf(r0); return { x, y, w: xOf(c1) + cwOf(c1) - x, h: yOf(r1) + rhOf(r1) - y }; },
  };
  /* visible columns / rows (frozen first), each with its pane: 0 frozen, 1 scrolling */
  const vc = [], vr = [];
  for (let c = 0; c < fc; c++) vc.push({ c, x: xOf(c), w: cwOf(c), pane: 0 });
  for (let c = fc; c < 700; c++) { const x = xOf(c), w = cwOf(c); if (x >= gx1) break; if (x + w > gx0 + fW + .01) vc.push({ c, x, w, pane: 1 }); }
  for (let r = 0; r < fr; r++) { const h = rhOf(r); if (h > .01) vr.push({ r, y: yOf(r), h, pane: 0 }); }
  for (let r = fr; r < 4000; r++) { const y = yOf(r), h = rhOf(r); if (y >= gy1) break; if (h > .01 && y + h > gy0 + fH + .01) vr.push({ r, y, h, pane: 1 }); }
  if (o.renumber) { let n = 0, i = 0; for (const v of vr) { while (i < v.r) { if (rhOf(i) > .01) n++; i++; } v.num = n + 1; } }   /* row numbers count only the rows that are still there (rows collapsing away) */
  L.vc = vc; L.vr = vr; L.rowStart = r => needR(r); L.colStart = c => needC(c);
  return L;
}
SH.layout = layout;

// ---------------------------------------------------------------- original vector icons (a 56 x 56 box centred on the origin; no text, no real product's shapes)
const head = (x, y, ang, s = 9) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 1.2, -s * .78); ctx.lineTo(-s * 1.2, s * .78); ctx.closePath(); ctx.fill(); ctx.restore(); };
const ln = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
const box = (x, y, w, h, r, fill) => { rect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.stroke(); };
const ICON = {
  merge() { box(-27, -14, 15, 28, 5, '#fff'); box(12, -14, 15, 28, 5, '#fff'); ctx.fillStyle = C.green; head(-1.5, 0, 0, 9); head(1.5, 0, Math.PI, 9); },
  find() { ctx.beginPath(); ctx.arc(-5, -5, 15, 0, TAU); ctx.fillStyle = rgba(C.blue, .14); ctx.fill(); ctx.stroke(); ctx.lineWidth = 7.5; ctx.strokeStyle = C.green; ln(6, 6, 22, 22); },
  dupes() { box(-25, -23, 42, 11, 3, '#fff'); box(-25, -6, 42, 11, 3, C.amberSoft); box(-25, 11, 42, 11, 3, '#fff'); ctx.strokeStyle = C.red; ctx.lineWidth = 5; ln(8, -2, 24, 14); ln(24, -2, 8, 14); },
  fill() { box(-24, -27, 30, 30, 4, '#fff'); ctx.fillStyle = C.green; ctx.strokeStyle = C.green; ctx.lineWidth = 3.4; rect(1.5, -1.5, 11, 11, 2); ctx.fill(); ln(7, 12, 7, 20); head(7, 31, Math.PI / 2, 9); },
  sort() { ctx.fillStyle = C.ink; for (const [i, w] of [[0, 30], [1, 22], [2, 14]]) { rect(-25, -21 + i * 15, w, 8, 3); ctx.fill(); } ctx.strokeStyle = C.green; ctx.fillStyle = C.green; ctx.lineWidth = 4; ln(18, -22, 18, 12); head(18, 24, Math.PI / 2, 9); },
  undo() { ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(-6, -17); ctx.bezierCurveTo(20, -26, 30, 6, 6, 17); ctx.stroke(); ctx.fillStyle = C.ink; head(-14, -14, Math.atan2(5, -12) + .12, 10); },
  redo() { ctx.save(); ctx.scale(-1, 1); ICON.undo(); ctx.restore(); },
  save() { ctx.beginPath(); ctx.moveTo(-24, 4); ctx.lineTo(-24, 22); ctx.lineTo(24, 22); ctx.lineTo(24, 4); ctx.stroke(); ctx.strokeStyle = C.green; ctx.fillStyle = C.green; ctx.lineWidth = 4.4; ln(0, -24, 0, 6); head(0, 14, Math.PI / 2, 10); },
  insert() { box(-26, -23, 52, 13, 3, C.blueSoft); box(-26, -6, 52, 13, 3, '#fff'); box(-26, 11, 52, 13, 3, '#fff'); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(19, -16.5, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ln(19, -22, 19, -11); ln(13.5, -16.5, 24.5, -16.5); },
  insertCol() { box(-23, -26, 13, 52, 3, C.blueSoft); box(-6, -26, 13, 52, 3, '#fff'); box(11, -26, 13, 52, 3, '#fff'); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(-16.5, 19, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ln(-16.5, 13.5, -16.5, 24.5); ln(-22, 19, -11, 19); },
  delete() { box(-26, -23, 52, 13, 3, C.redSoft); box(-26, -6, 52, 13, 3, '#fff'); box(-26, 11, 52, 13, 3, '#fff'); ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(19, -16.5, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ln(14, -16.5, 24, -16.5); },
  filter() { ctx.beginPath(); ctx.moveTo(-25, -22); ctx.lineTo(25, -22); ctx.lineTo(6, 0); ctx.lineTo(6, 20); ctx.lineTo(-6, 26); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fillStyle = C.blueSoft; ctx.fill(); ctx.stroke(); },
  chart() { ctx.fillStyle = C.green; for (const [i, hh] of [[0, 18], [1, 30], [2, 42]]) { rect(-24 + i * 17, 24 - hh, 12, hh, 3); ctx.fill(); } ctx.beginPath(); ctx.moveTo(-27, -24); ctx.lineTo(-27, 26); ctx.lineTo(27, 26); ctx.stroke(); },
  table() { box(-25, -22, 50, 44, 5, '#fff'); ctx.fillStyle = C.blueSoft; rect(-25, -22, 50, 12, 5); ctx.fill(); ctx.stroke(); ln(-25, -2, 25, -2); ln(-25, 10, 25, 10); ln(-8, -10, -8, 22); ln(9, -10, 9, 22); },
  comment() { ctx.beginPath(); ctx.moveTo(-24, -20); ctx.lineTo(24, -20); ctx.lineTo(24, 10); ctx.lineTo(0, 10); ctx.lineTo(-12, 24); ctx.lineTo(-12, 10); ctx.lineTo(-24, 10); ctx.closePath(); ctx.fillStyle = C.amberSoft; ctx.fill(); ctx.stroke(); ln(-14, -9, 14, -9); ln(-14, 0, 6, 0); },
  validate() { box(-24, -22, 48, 44, 6, '#fff'); ctx.strokeStyle = C.green; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-3, 10); ctx.lineTo(14, -10); ctx.stroke(); },
  lookup() { box(-26, -22, 30, 44, 4, '#fff'); ln(-26, -8, 4, -8); ln(-26, 6, 4, 6); ctx.beginPath(); ctx.arc(11, 5, 11, 0, TAU); ctx.fillStyle = rgba(C.blue, .14); ctx.fill(); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = C.green; ln(19, 13, 26, 21); },
  spell() { ctx.strokeStyle = C.green; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-23, 4); ctx.lineTo(-13, 15); ctx.lineTo(8, -14); ctx.stroke(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3.6; ln(14, -2, 26, -2); ln(14, 10, 26, 10); ln(-25, -20, 8, -20); },
  lock() { box(-19, -4, 38, 28, 6, C.amberSoft); ctx.beginPath(); ctx.arc(0, -6, 12, Math.PI, 0); ctx.stroke(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 10, 4, 0, TAU); ctx.fill(); },
  track() { ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(0, -26, 26, 0); ctx.quadraticCurveTo(0, 26, -26, 0); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fillStyle = C.green; ctx.fill(); },
  freeze() { box(-25, -23, 50, 46, 5, '#fff'); ctx.fillStyle = C.blueSoft; rect(-25, -23, 50, 15, 5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = C.blue; ctx.lineWidth = 4.4; ln(-25, -8, 25, -8); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ln(0, -8, 0, 23); ln(-25, 7, 25, 7); },
  grid() { box(-25, -23, 50, 46, 5, '#fff'); ln(-9, -23, -9, 23); ln(9, -23, 9, 23); ln(-25, -8, 25, -8); ln(-25, 8, 25, 8); },
  zoom() { ctx.beginPath(); ctx.arc(-4, -4, 16, 0, TAU); ctx.fillStyle = rgba(C.blue, .14); ctx.fill(); ctx.stroke(); ctx.lineWidth = 7.5; ctx.strokeStyle = C.green; ln(8, 8, 23, 23); ctx.lineWidth = 3.6; ctx.strokeStyle = C.ink; ln(-11, -4, 3, -4); ln(-4, -11, -4, 3); },
};
function drawIcon(id, cx, cy, size, press = 0) {
  const f = ICON[id] || ICON.grid, s = size / 56 * (1 - .06 * press);
  ctx.save(); ctx.translate(cx, cy + press * 2); ctx.scale(s, s);
  ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink; ctx.fillStyle = '#fff';
  f();
  ctx.restore();
}
SH.drawIcon = drawIcon;
function logo(cx, cy, s) {
  const u = s / 44;
  ctx.save(); ctx.translate(cx, cy);
  rect(-22 * u, -22 * u, 44 * u, 44 * u, 11 * u); ctx.fillStyle = C.green; ctx.fill();
  ctx.fillStyle = '#fff'; rect(-14 * u, -14 * u, 12 * u, 12 * u, 3 * u); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * u;
  rect(2 * u, -14 * u, 12 * u, 12 * u, 3 * u); ctx.stroke(); rect(-14 * u, 2 * u, 12 * u, 12 * u, 3 * u); ctx.stroke(); rect(2 * u, 2 * u, 12 * u, 12 * u, 3 * u); ctx.stroke();
  ctx.restore();
}
SH.drawLogo = logo;

// ---------------------------------------------------------------- the ribbon: tabs, groups, buttons ('|' breaks a caption into two lines)
const RIBBON = {
  Home: [['History', ['undo', 'Undo'], ['redo', 'Redo'], ['save', 'Save']], ['Alignment', ['merge', 'Merge &|Center']], ['Cells', ['insert', 'Insert|Row'], ['fill', 'Fill|Down']], ['Editing', ['sort', 'Sort'], ['find', 'Find &|Replace']]],
  Insert: [['Rows', ['insert', 'Insert|Row'], ['insertCol', 'Insert|Column'], ['delete', 'Delete|Row']], ['Objects', ['chart', 'Chart'], ['table', 'Table'], ['comment', 'Comment']]],
  Data: [['Tools', ['dupes', 'Remove|Duplicates'], ['sort', 'Sort'], ['filter', 'Filter'], ['fill', 'Fill|Down']], ['Check', ['validate', 'Validate'], ['lookup', 'Lookup']]],
  Review: [['Proofing', ['spell', 'Spelling'], ['comment', 'Comment']], ['Protect', ['lock', 'Protect'], ['track', 'Track|Changes']]],
  View: [['Window', ['freeze', 'Freeze|Row'], ['grid', 'Gridlines'], ['zoom', 'Zoom']]],
};
function ribbonLayout(L, tabName) {
  const groups = RIBBON[tabName] || RIBBON.Home, ui = L.ui, y0 = L.ribbon[0];
  const n = groups.reduce((a, g) => a + g.length - 1, 0), gap = 20 * ui, padX = 22 * ui;
  const bw = cl((L.Wd - 2 * padX - (groups.length - 1) * gap) / n, 80 * ui, 132 * ui);
  const items = [], gl = [];
  let x = padX;
  groups.forEach((g, gi) => {
    const gx = x;
    g.slice(1).forEach(([id, label]) => { items.push({ id, label, group: g[0], x, y: y0 + 10 * ui, w: bw, h: 134 * ui, cx: x + bw / 2, cy: y0 + 10 * ui + 67 * ui, ix: x + bw / 2, iy: y0 + 10 * ui + 36 * ui, aim: [x + bw / 2 + 6 * ui, y0 + 10 * ui + 28 * ui] }); x += bw; });
    gl.push({ t: g[0], x0: gx, x1: x, cx: (gx + x) / 2, y: y0 + 156 * ui, sep: gi < groups.length - 1 ? x + gap / 2 : 0 });
    x += gap;
  });
  return { items, groups: gl };
}
SH.buttonRect = (id, o) => {
  const L = layout(o), cur = L.ribbonOpt.tab || 'Home', order = [cur].concat(Object.keys(RIBBON).filter(k => k !== cur));
  for (const tab of order) { const it = ribbonLayout(L, tab).items.find(b => b.id === id || b.label.replace('|', ' ').toLowerCase() === String(id).toLowerCase()); if (it) return it; }
  return null;
};

// ---------------------------------------------------------------- chrome: title bar, ribbon tabs, ribbon body, formula bar, sheet tabs, status bar
const hline = (x0, x1, y, col, lw) => { ctx.fillStyle = col; ctx.fillRect(x0, y - lw / 2, x1 - x0, lw); };
function drawTitle(L, o) {
  const [y0, h] = L.title;
  if (!h) return;
  const ui = L.ui, cy = y0 + h / 2;
  ctx.fillStyle = C.white; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + h - 1, C.grid, 2);
  logo(46 * ui, cy, 44 * ui);
  const a = T('GridSheet', 84 * ui, cy, { align: 'left', size: 28 * ui, weight: 900, fill: C.green });
  const dx = a.x1 + 20 * ui;
  ctx.fillStyle = C.grid; ctx.fillRect(dx, cy - 16 * ui, 2 * ui, 32 * ui);
  const cw = 54 * ui, cx0 = L.Wd - 3 * cw;
  ctx.strokeStyle = C.mute; ctx.lineWidth = 2.6 * ui; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ln(cx0 + cw * .5 - 8 * ui, cy, cx0 + cw * .5 + 8 * ui, cy);
  rect(cx0 + cw * 1.5 - 8 * ui, cy - 8 * ui, 16 * ui, 16 * ui, 3 * ui); ctx.stroke();
  ln(cx0 + cw * 2.5 - 8 * ui, cy - 8 * ui, cx0 + cw * 2.5 + 8 * ui, cy + 8 * ui); ln(cx0 + cw * 2.5 + 8 * ui, cy - 8 * ui, cx0 + cw * 2.5 - 8 * ui, cy + 8 * ui);
  const saved = o.saved === false ? 'Unsaved changes' : (o.saved || 'Saved');
  const sb = T(saved, cx0 - 20 * ui, cy, { align: 'right', size: 20 * ui, weight: 700, fill: C.mute });
  ctx.fillStyle = o.saved === false ? C.amber : C.green; ctx.beginPath(); ctx.arc(sb.x0 - 16 * ui, cy, 6 * ui, 0, TAU); ctx.fill();
  const docX = dx + 22 * ui;
  T(o.doc ?? 'SYNERGY_MODEL_v47_FINAL_REAL', docX, cy, { align: 'left', size: 25 * ui, weight: 800, fill: C.ink, maxW: Math.max(40, sb.x0 - 44 * ui - docX) });
}
function drawTabRow(L, o) {
  const [y0, h] = L.tabRow;
  if (!h) return;
  const ui = L.ui, cy = y0 + h / 2 - 2 * ui, rb = L.ribbonOpt, tabs = rb.tabs || ['Home', 'Insert', 'Data', 'Review', 'View'], act = rb.tab || 'Home';
  ctx.fillStyle = C.white; ctx.fillRect(0, y0, L.Wd, h);
  let x = 18 * ui;
  for (const name of tabs) {
    const sz = 25 * ui, w = UI.sizeOf(name, { size: sz, weight: 800 }).w + 52 * ui, on = name === act;
    T(name, x + w / 2, cy, { size: sz, weight: on ? 900 : 800, fill: on ? C.green : C.mute, maxW: w - 20 * ui });
    if (on) { rect(x + 14 * ui, y0 + h - 7 * ui, w - 28 * ui, 7 * ui, 3.5 * ui); ctx.fillStyle = C.green; ctx.fill(); }
    x += w;
  }
  const pw = 122 * ui, ph = 38 * ui, px = L.Wd - 22 * ui - pw;
  rect(px, cy - ph / 2, pw, ph, ph / 2); ctx.fillStyle = C.green; ctx.fill();
  T('Share', px + pw / 2, cy, { size: 21 * ui, weight: 900, fill: '#fff' });
  hline(0, L.Wd, y0 + h - 1, C.grid, 2);
}
function drawRibbon(L, o) {
  const [y0, h] = L.ribbon;
  if (!h) return;
  const ui = L.ui, rb = L.ribbonOpt, tab = rb.tab || 'Home', lay = ribbonLayout(L, tab), hot = rb.hot, hk = rb.hotK ?? 1, pr = cl(rb.press || 0);
  ctx.fillStyle = C.head; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + h - 1, C.grid, 2);
  for (const b of lay.items) {
    const on = hot != null && (b.id === hot || b.label.replace('|', ' ').toLowerCase() === String(hot).toLowerCase()), p = on ? pr : 0;
    if (on) { rect(b.x + 3 * ui, b.y, b.w - 6 * ui, b.h, 12 * ui); ctx.fillStyle = mixc(C.head, p > 0 ? '#bcd3ff' : C.blueSoft, hk); ctx.fill(); ctx.strokeStyle = rgba(C.blue, .6 * hk); ctx.lineWidth = 2.2 * ui; ctx.stroke(); }
    drawIcon(b.id, b.ix, b.iy + 6 * ui, 58 * ui, p);
    const ls = b.label.split('|');
    ls.forEach((s, i) => T(s, b.cx, b.y + 88 * ui + i * 21 * ui + p * 2, { size: 17 * ui, weight: 800, fill: C.ink, maxW: b.w - 8 * ui }));
  }
  lay.groups.forEach(g => {
    T(g.t, g.cx, g.y, { size: 15 * ui, weight: 700, fill: C.soft, maxW: g.x1 - g.x0 });
    if (g.sep) { ctx.fillStyle = C.line2; ctx.fillRect(g.sep - ui, y0 + 18 * ui, 2 * ui, 130 * ui); }
  });
}
function caretX(str, x, shown, size, weight) {
  const full = meas(str, size, 'Nunito', weight, false, 0), part = meas(shown, size, 'Nunito', weight, false, 0);
  return x - full.l + part.adv;
}
function drawFormula(L, o, t) {
  const [y0, h] = L.fbar;
  if (!h) return;
  const ui = L.ui, cy = y0 + h / 2, act = o.active ?? (o.sel ? String(Array.isArray(o.sel) ? o.sel[0] : o.sel).split(':')[0] : 'A1');
  ctx.fillStyle = C.white; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + h - 1, C.grid, 2);
  const nb = { x: 14 * ui, w: 128 * ui, h: 38 * ui };
  rect(nb.x, cy - nb.h / 2, nb.w, nb.h, 8 * ui); ctx.fillStyle = C.head; ctx.fill(); ctx.strokeStyle = C.grid; ctx.lineWidth = 2; ctx.stroke();
  T(o.nameBox ?? act, nb.x + nb.w / 2, cy, { size: 22 * ui, weight: 900, fill: C.ink, maxW: nb.w - 20 * ui });
  const fxX = nb.x + nb.w + 30 * ui;
  T('fx', fxX, cy, { size: 26 * ui, weight: 900, italic: true, fill: C.green });
  const bx = fxX + 34 * ui, bw = L.Wd - bx - 14 * ui, bh = 38 * ui;
  rect(bx, cy - bh / 2, bw, bh, 8 * ui); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.grid; ctx.lineWidth = 2; ctx.stroke();
  let f = o.formula;
  if (f == null) { const sp = o.cells && normCell(o.cells[act]); f = sp ? (sp.f ?? cellStr(sp)) : ''; }
  const txt = f && typeof f === 'object' ? String(f.text ?? '') : String(f), k = f && typeof f === 'object' && f.typed != null ? cl(f.typed) : 1;
  if (txt) {
    const size = 24 * ui, tx = bx + 16 * ui, n = k >= 1 ? txt.length : Math.ceil(txt.length * k);
    T(txt, tx, cy, { align: 'left', size, weight: 700, fill: C.ink, reveal: k, maxW: bw - 32 * ui });
    if (k < 1 || (f && f.caret)) { const blink = k < 1 || Math.floor((t || 0) * 2.2) % 2 === 0; if (blink) { ctx.fillStyle = C.blue; ctx.fillRect(caretX(txt, tx, txt.slice(0, n), size, 700) + 1.5, cy - size * .62, 2.6 * ui, size * 1.24); } }
  }
}
function drawSheetTabs(L, o) {
  const [y0, h] = L.stabs;
  if (!h) return;
  const ui = L.ui, cy = y0 + h / 2, tabs = o.tabs || ['Sheet1', 'Staff', 'Policies'], act = o.tab ?? tabs[0];
  ctx.fillStyle = C.head; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + 1, C.grid, 2);
  ctx.fillStyle = C.soft; for (const dx of [0, 34]) { ctx.beginPath(); ctx.moveTo(30 * ui + dx * ui + (dx ? -8 : 8) * ui, cy - 8 * ui); ctx.lineTo(30 * ui + dx * ui + (dx ? 8 : -8) * ui, cy); ctx.lineTo(30 * ui + dx * ui + (dx ? -8 : 8) * ui, cy + 8 * ui); ctx.closePath(); ctx.fill(); }
  let x = 84 * ui;
  for (const tb of tabs) {
    const name = typeof tb === 'object' ? tb.name : tb, k = typeof tb === 'object' && tb.u != null ? cl(tb.u) : 1;
    if (k <= 0) continue;
    const sz = 22 * ui, w0 = UI.sizeOf(name, { size: sz, weight: 800 }).w + 44 * ui, w = w0 * eO(k), on = name === act;
    if (on || (typeof tb === 'object' && k < 1)) { ctx.save(); rect(x, y0 + 1, w, h - 1, [0, 0, 10 * ui, 10 * ui]); ctx.fillStyle = on ? C.white : rgba(C.green, .12); ctx.fill(); ctx.restore(); rect(x, y0 + 1, w, 5 * ui, 2 * ui); ctx.fillStyle = typeof tb === 'object' && tb.color ? tb.color : C.green; ctx.fill(); }
    if (k >= .6) T(name, x + w / 2, cy + 2 * ui, { size: sz, weight: on ? 900 : 800, fill: on ? C.ink : C.mute, maxW: w - 24 * ui, alpha: sg(k, .6, 1) });
    x += w;
  }
  ctx.beginPath(); ctx.arc(x + 30 * ui, cy, 15 * ui, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = C.mute; ctx.lineWidth = 2.8 * ui; ln(x + 30 * ui - 7 * ui, cy, x + 30 * ui + 7 * ui, cy); ln(x + 30 * ui, cy - 7 * ui, x + 30 * ui, cy + 7 * ui);
}
function drawStatus(L, o) {
  const [y0, h] = L.status;
  if (!h) return;
  const ui = L.ui, cy = y0 + h / 2;
  ctx.fillStyle = C.green; ctx.fillRect(0, y0, L.Wd, h);
  T(o.status ?? 'Ready', 22 * ui, cy, { align: 'left', size: 20 * ui, weight: 800, fill: '#fff' });
  const zx = L.Wd - 22 * ui;
  const zt = T(Math.round((o.zoom ?? 1) * 100) + '%', zx, cy, { align: 'right', size: 19 * ui, weight: 800, fill: '#fff' });
  const sl = [zt.x0 - 190 * ui, zt.x0 - 24 * ui];
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3 * ui; ctx.lineCap = 'round'; ln(sl[0], cy, sl[1], cy);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lp(sl[0], sl[1], .5), cy, 7 * ui, 0, TAU); ctx.fill();
  let x = sl[0] - 40 * ui;
  const stats = o.stats || (o.sum != null ? ['Sum: ' + o.sum] : []);
  for (const s of stats.slice().reverse()) { const b = T(s, x, cy, { align: 'right', size: 19 * ui, weight: 800, fill: '#fff' }); x = b.x0 - 34 * ui; }
}

// ---------------------------------------------------------------- the grid: cells, merged regions, selection, headers
const selRanges = o => !o.sel ? [] : (Array.isArray(o.sel) ? o.sel : [o.sel]).map(range);
const wOfFont = (font, w) => w ?? (font === 'Bangers' || font === 'Lucky' ? 400 : 600);
/* the string shrunk (never squished) to fit, and cut with an ellipsis when even the smallest size does not fit: a cell clips, it never runs into its neighbour */
function fitText(str, avail, size, weight, font, spacing) {
  const f = UI.fit(str, avail, { size, weight, font, spacing: spacing || 0, min: size * .64, quiet: true });
  if (!f.overflow) return { str, size: f.size, spacing: f.spacing };
  const iw = s => { const m = meas(s, f.size, font || 'Nunito', weight, false, f.spacing); return m.r - m.l; };
  let n = str.length;
  while (n > 1 && iw(str.slice(0, n).trimEnd() + '\u2026') > avail) n--;
  return { str: str.slice(0, n).trimEnd() + '\u2026', size: f.size, spacing: f.spacing, cut: true };
}
/* where and how a cell's string is drawn: the one place that knows (the merge animation and the falling letters reuse it) */
function cellTextLayout(L, x, y, w, h, sp) {
  const z = L.z, fl = sp.flip;
  let str = cellStr(sp);
  if (fl && fl.u != null && fl.u <= 0 && fl.from != null) str = String(fl.from);
  if (!str) return null;
  const err = isErr(sp.v), font = sp.font || 'Nunito', pad = (sp.pad ?? 12) * z, size = (sp.size ?? 26) * z, weight = wOfFont(font, sp.weight ?? (sp.bold || err ? 900 : 600));
  const align = sp.align ?? (err ? 'center' : typeof sp.v === 'number' ? 'right' : 'left');
  const fade = sg(h, size * .9, size * 1.5);
  if (fade <= .02) return null;
  const ft = fitText(str, w - 2 * pad, size, weight, font, (sp.spacing || 0) * z);
  const cx = align === 'left' ? x + pad : align === 'right' ? x + w - pad : x + w / 2, cy = y + h / 2 + (sp.dy || 0) * z;
  let clip = 0;
  if (PANE) {
    const top = cy - ft.size * .42, bot = cy + ft.size * .56;
    if (bot <= PANE[1] || top >= PANE[3] || x + w <= PANE[0] || x >= PANE[2]) clip = 2;
    else if (top < PANE[1] - .5 || bot > PANE[3] + .5 || x < PANE[0] - .5 || x + w > PANE[2] + .5) clip = 1;
  }
  return { str: ft.str, size: ft.size, spacing: ft.spacing, weight, font, align, cx, cy, fade, pad, fill: sp.color ?? (err ? C.red : C.ink), err, avail: w - 2 * pad, clip };
}
/* a wrapped cell (wrap: true): the text is broken into lines and centred vertically in the cell; it shrinks (never squishes) to fit the cell's height, and loses its last words rather than spill */
function drawWrapped(L, x, y, w, h, sp, id) {
  const z = L.z, str = cellStr(sp), err = isErr(sp.v), font = sp.font || 'Nunito', pad = (sp.pad ?? 12) * z, weight = wOfFont(font, sp.weight ?? (sp.bold || err ? 900 : 600)), size = (sp.size ?? 26) * z, align = sp.align ?? 'left';
  if (!str) return null;
  let sz = size, lines;
  for (let i = 0; i < 14; i++) { lines = UI.wrap(str, w - 2 * pad, { size: sz, weight, font }); if (lines.length * lines.size * 1.25 <= h - 10 * z || sz <= size * .55) break; sz *= .92; }
  const fit = Math.max(1, Math.floor((h - 10 * z) / (lines.size * 1.25)));
  if (lines.length > fit) { lines = lines.slice(0, fit).concat([]); lines[fit - 1] = lines[fit - 1].replace(/\s*\S*$/, '') + '\u2026'; }
  let clip = 0;
  if (PANE) { if (y + h <= PANE[1] || y >= PANE[3] || x + w <= PANE[0] || x >= PANE[2]) return null; if (y < PANE[1] - .5 || y + h > PANE[3] + .5 || x < PANE[0] - .5 || x + w > PANE[2] + .5) clip = 1; }
  const hero = sp.hero === true && !clip, ax = align === 'left' ? x + pad : align === 'right' ? x + w - pad : x + w / 2;
  if (hero && id) UI.container(id, 'cell', [x, y, x + w, y + h], 4 * z);
  return UI.lines(lines.map(t => ({ t })), ax, y + h / 2, opt({ size: lines.size, weight, font, fill: sp.color ?? (err ? C.red : C.ink), italic: !!sp.italic, align, v: 'mid', lh: 1.25, hero, crop: !!clip, cid: hero && id ? id : undefined, alpha: sp.alpha }));
}
function drawCellText(L, x, y, w, h, sp, id) {
  if (sp.wrap) return drawWrapped(L, x, y, w, h, sp, id);
  const z = L.z, fl = sp.flip, lay = cellTextLayout(L, x, y, w, h, sp);
  if (!lay || lay.clip === 2) return null;
  const hero = sp.hero === true && lay.fade >= 1 && !lay.clip;
  const base = { align: lay.align, size: lay.size, weight: lay.weight, font: lay.font, fill: lay.fill, italic: !!sp.italic, alpha: lay.fade * (sp.alpha ?? 1), hero, spacing: lay.spacing };
  if (sp.stroke) { base.stroke = sp.stroke; base.lw = (sp.lw ?? 6) * z; }
  if (lay.clip) base.crop = true;
  let box;
  if (fl && fl.from != null && fl.u > 0 && fl.u < 1) box = SH._flip(String(fl.from), lay.str, fl.u, Object.assign(base, { cx: lay.cx, cy: lay.cy, hero: false, crop: true, maxW: lay.avail }));
  else {
    if (hero && id) { UI.container(id, 'cell', [x, y, x + w, y + h], 4 * z); base.cid = id; base.center = lay.align === 'center'; }
    if (sp.typed != null && sp.typed < 1) base.reveal = sp.typed;
    box = T(lay.str, lay.cx, lay.cy, base);
  }
  if (sp.strike > 0 && box) {
    const over = lay.size * .12;
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha *= lay.fade; ctx.strokeStyle = sp.strikeColor || C.red; ctx.lineWidth = Math.max(3, lay.size * .1); ctx.lineCap = 'round';   /* multiply: the gate ignores a deliberate strike, like UI.strike */
    ln(box.x0 - over, lay.cy, lp(box.x0 - over, box.x1 + over, cl(sp.strike)), lay.cy); ctx.restore();
  }
  return box;
}
function drawBorder(x, y, w, h, b, z) {
  const sides = b && typeof b === 'object' ? b : { t: b, r: b, b, l: b };
  const col = s => sides[s] === true ? C.ink : sides[s];
  ctx.lineWidth = 2.6 * z; ctx.lineCap = 'butt';
  if (sides.t) { ctx.strokeStyle = col('t'); ln(x, y, x + w, y); }
  if (sides.r) { ctx.strokeStyle = col('r'); ln(x + w, y, x + w, y + h); }
  if (sides.b) { ctx.strokeStyle = col('b'); ln(x, y + h, x + w, y + h); }
  if (sides.l) { ctx.strokeStyle = col('l'); ln(x, y, x, y + h); }
}
function paneRects(L) {
  const { gx0, gy0, gx1, gy1, fW, fH } = L;
  return [[gx0, gy0, fW, fH], [gx0 + fW, gy0, gx1 - gx0 - fW, fH], [gx0, gy0 + fH, fW, gy1 - gy0 - fH], [gx0 + fW, gy0 + fH, gx1 - gx0 - fW, gy1 - gy0 - fH]];
}
/* the merged regions of this frame: static ones (o.merges) and the one being animated (o.merge); cells under them are drawn by the region, not on their own */
function mergeInfo(L, o) {
  const regs = [];
  for (const m of o.merges || []) regs.push({ g: range(m), anim: null });
  if (o.merge && o.merge.range) regs.push({ g: range(o.merge.range), anim: o.merge });
  return regs;
}
function drawGrid(L, o, t) {
  const z = L.z, ui = L.ui, cells = o.cells || {};
  const cmap = new Map(L.vc.map(v => [v.c, v])), rmap = new Map(L.vr.map(v => [v.r, v]));
  const regs = mergeInfo(L, o), under = (c, r) => regs.some(m => c >= m.g.c0 && c <= m.g.c1 && r >= m.g.r0 && r <= m.g.r1);
  const ents = [];
  for (const key in cells) {
    const rf = ref(key);
    if (rf.bad) continue;
    const ci = cmap.get(rf.c), ri = rmap.get(rf.r), sp = normCell(cells[key]);
    if (!ci || !ri || !sp || (regs.length && under(rf.c, rf.r))) continue;
    ents.push({ c: rf.c, r: rf.r, sp, x: ci.x, y: ri.y, w: ci.w, h: ri.h, pane: ci.pane + 2 * ri.pane, key });
  }
  ctx.save(); rect(L.gx0, L.gy0, L.gx1 - L.gx0, L.gy1 - L.gy0); ctx.clip();
  ctx.fillStyle = C.white; ctx.fillRect(L.gx0, L.gy0, L.gx1 - L.gx0, L.gy1 - L.gy0);
  const PR = paneRects(L);
  for (let p = 0; p < 4; p++) {
    const [px, py, pw, ph] = PR[p];
    const cols = L.vc.filter(v => v.pane === (p & 1)), rows = L.vr.filter(v => v.pane === (p >> 1));
    if (pw <= 0 || ph <= 0 || !cols.length || !rows.length) continue;
    ctx.save(); rect(px, py, pw, ph); ctx.clip(); PANE = [px, py, px + pw, py + ph];
    for (const e of ents) if (e.pane === p) {
      if (e.sp.fill) { ctx.fillStyle = e.sp.fill; ctx.fillRect(e.x, e.y, e.w, e.h); }
      if (e.sp.pulse != null && e.sp.pulse < 1) { ctx.fillStyle = rgba(e.sp.pulseColor || C.amber, .6 * (1 - cl(e.sp.pulse))); ctx.fillRect(e.x, e.y, e.w, e.h); }
    }
    for (const f of o.fills || []) { const g = range(f.range), R = L.rect(g.c0, g.r0, g.c1, g.r1); ctx.fillStyle = rgba(f.color || C.amber, f.a ?? .4); ctx.fillRect(R.x, R.y, R.w, R.h); }
    if (o.grid !== false) {
      ctx.strokeStyle = o.gridColor || C.grid; ctx.lineWidth = 2; ctx.beginPath();
      for (const c of cols) { const gx = Math.round(c.x + c.w); ctx.moveTo(gx, py); ctx.lineTo(gx, py + ph); }
      for (const r of rows) if (r.h > 2) { const gy = Math.round(r.y + r.h); ctx.moveTo(px, gy); ctx.lineTo(px + pw, gy); }
      ctx.stroke();
    }
    for (const m of regs) {   /* static merged regions: one cell */
      if (m.anim) continue;
      const g = m.g, ci = cmap.get(g.c0), ri = rmap.get(g.r0), pane = (ci ? ci.pane : g.c0 < L.fc ? 0 : 1) + 2 * (ri ? ri.pane : g.r0 < L.fr ? 0 : 1);
      if (pane !== p) continue;
      const R = L.rect(g.c0, g.r0, g.c1, g.r1), sp = normCell(cells[refName(g.c0, g.r0)]) || {};
      ctx.fillStyle = sp.fill || C.white; ctx.fillRect(R.x, R.y, R.w, R.h);
      ctx.strokeStyle = o.gridColor || C.grid; ctx.lineWidth = 2; ctx.strokeRect(Math.round(R.x), Math.round(R.y), Math.round(R.w), Math.round(R.h));
      drawCellText(L, R.x, R.y, R.w, R.h, Object.assign({ align: 'center' }, sp), 'cell:' + refName(g.c0, g.r0));
    }
    for (const e of ents) if (e.pane === p) {
      if (e.sp.border) drawBorder(e.x, e.y, e.w, e.h, e.sp.border, z);
      drawCellText(L, e.x, e.y, e.w, e.h, e.sp, 'cell:' + e.key);
    }
    PANE = null; ctx.restore();
  }
  if (L.fr || L.fc) {   /* the freeze lines */
    ctx.fillStyle = '#aab1ba';
    if (L.fr) ctx.fillRect(L.gx0, L.gy0 + L.fH - 1.25, L.gx1 - L.gx0, 2.5);
    if (L.fc) ctx.fillRect(L.gx0 + L.fW - 1.25, L.gy0, 2.5, L.gy1 - L.gy0);
  }
  for (const m of regs) if (m.anim) SH._mergeDraw(L, o, t, m);
  drawSelection(L, o, t);
  drawEdit(L, o, t);
  ctx.restore();
  drawHeaders(L, o);
}
function drawSelection(L, o, t) {
  const sels = selRanges(o);
  if (!sels.length || o.selK === 0) return;
  const ui = L.ui, act = o.active ? ref(o.active) : { c: sels[0].c0, r: sels[0].r0 }, lw = (o.selWidth ?? 3.8) * ui;
  ctx.save(); rect(L.gx0, L.gy0, L.gx1 - L.gx0, L.gy1 - L.gy0); ctx.clip();
  ctx.globalAlpha *= o.selK ?? 1;
  sels.forEach((g, i) => {
    const R = L.rect(g.c0, g.r0, g.c1, g.r1), multi = g.c1 > g.c0 || g.r1 > g.r0;
    ctx.save();   /* a selection that scrolls slides under the frozen rows and columns */
    const cx0 = g.c0 >= L.fc ? L.gx0 + L.fW : L.gx0, cy0 = g.r0 >= L.fr ? L.gy0 + L.fH : L.gy0;
    rect(cx0, cy0, L.gx1 - cx0, L.gy1 - cy0); ctx.clip();
    if (multi && o.selFill !== false) {
      const A = L.rect(act.c, act.r, act.c, act.r), inside = act.c >= g.c0 && act.c <= g.c1 && act.r >= g.r0 && act.r <= g.r1;
      ctx.fillStyle = rgba(C.blue, .13); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); if (inside) ctx.rect(A.x, A.y, A.w, A.h); ctx.fill('evenodd');
    }
    ctx.strokeStyle = o.selColor || C.blue; ctx.lineWidth = lw; ctx.lineJoin = 'miter';
    if (o.ants) { ctx.setLineDash([11 * ui, 8 * ui]); ctx.lineDashOffset = -(t || 0) * 34; }
    ctx.strokeRect(R.x, R.y, R.w, R.h);
    ctx.setLineDash([]);
    if (i === sels.length - 1 && o.handle !== false) {   /* the fill handle */
      const hs = 13 * ui, hx = R.x + R.w, hy = R.y + R.h;
      ctx.fillStyle = o.selColor || C.blue; ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4 * ui; ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    ctx.restore();
  });
  ctx.restore();
}
function drawEdit(L, o, t) {
  const e = o.edit;
  if (!e) return;
  const rf = ref(e.ref), R = L.rect(rf.c, rf.r, rf.c, rf.r), ui = L.ui, z = L.z, size = (e.size ?? 26) * z, pad = 12 * z, txt = String(e.text ?? ''), k = e.typed == null ? 1 : cl(e.typed);
  ctx.fillStyle = C.white; ctx.fillRect(R.x, R.y, R.w, R.h);
  ctx.strokeStyle = C.blue; ctx.lineWidth = 4.2 * ui; ctx.strokeRect(R.x, R.y, R.w, R.h);
  if (txt) {
    const ft = fitText(txt, R.w - 2 * pad - 6, size, 600, 'Nunito'), n = k >= 1 ? txt.length : Math.ceil(txt.length * k);
    T(ft.str, R.x + pad, R.y + R.h / 2, { align: 'left', size: ft.size, weight: 600, fill: C.ink, reveal: k });
    if (Math.floor((t || 0) * 2.2) % 2 === 0 || k < 1) { ctx.fillStyle = C.ink; ctx.fillRect(caretX(ft.str, R.x + pad, ft.str.slice(0, n), ft.size, 600) + 1.5, R.y + R.h / 2 - ft.size * .62, 2.4 * ui, ft.size * 1.24); }
  }
}
function drawHeaders(L, o) {
  if (!L.sh.headers) return;
  const ui = L.ui, z = L.z, sels = selRanges(o), act = o.active ? ref(o.active) : sels.length ? { c: sels[0].c0, r: sels[0].r0 } : null;
  const selC = c => sels.some(g => c >= g.c0 && c <= g.c1), selR = r => sels.some(g => r >= g.r0 && r <= g.r1);
  const [hy, hh] = L.colHead, hz = Math.min(1, z);
  ctx.fillStyle = C.head; ctx.fillRect(0, hy, L.wR, hh);
  ctx.fillStyle = C.line2; ctx.beginPath(); ctx.moveTo(L.wR - 8 * ui, hy + hh - 8 * ui); ctx.lineTo(L.wR - 8 * ui, hy + hh - 24 * ui); ctx.lineTo(L.wR - 24 * ui, hy + hh - 8 * ui); ctx.closePath(); ctx.fill();
  hline(0, L.wR, hy + hh - 1, C.grid, 2); hline(L.wR - 1, L.wR, hy, C.grid, 2);
  ctx.fillRect(0, 0, 0, 0);
  const strip = (x, y, w, h, on, act2) => { ctx.fillStyle = on ? C.blueSoft : C.head; ctx.fillRect(x, y, w, h); };
  const PR = paneRects(L);
  for (let pc = 0; pc < 2; pc++) {   /* column letters */
    const cols = L.vc.filter(v => v.pane === pc), px = PR[pc][0], pw = PR[pc][2];
    if (!cols.length || pw <= 0) continue;
    ctx.save(); rect(px, hy, pw, hh); ctx.clip();
    for (const c of cols) {
      const on = selC(c.c);
      strip(c.x, hy, c.w, hh, on);
      if (on) { ctx.fillStyle = C.blue; ctx.fillRect(c.x, hy + hh - 4 * ui, c.w, 4 * ui); }
      ctx.fillStyle = C.grid; ctx.fillRect(Math.round(c.x + c.w) - 1, hy, 2, hh);
      if (c.x + c.w / 2 - 14 * ui >= px && c.x + c.w / 2 + 14 * ui <= px + pw) T(colLetters(c.c), c.x + c.w / 2, hy + hh / 2, { size: 22 * ui * hz, weight: 800, fill: on ? C.blue : C.mute, maxW: c.w - 8 });
    }
    ctx.restore();
  }
  hline(L.wR, L.Wd, hy + hh - 1, C.grid, 2);
  for (let pr = 0; pr < 2; pr++) {   /* row numbers */
    const rows = L.vr.filter(v => v.pane === pr), py = PR[pr * 2][1], ph = PR[pr * 2][3];
    if (!rows.length || ph <= 0) continue;
    ctx.save(); rect(0, py, L.wR, ph); ctx.clip();
    for (const r of rows) {
      const on = selR(r.r);
      strip(0, r.y, L.wR, r.h, on);
      if (on) { ctx.fillStyle = C.blue; ctx.fillRect(L.wR - 4 * ui, r.y, 4 * ui, r.h); }
      ctx.fillStyle = C.grid; ctx.fillRect(0, Math.round(r.y + r.h) - 1, L.wR, 2);
      if (r.h >= 20 * ui && r.y + r.h / 2 - 13 * ui >= py && r.y + r.h / 2 + 13 * ui <= py + ph) T(String(r.num ?? r.r + 1), L.wR / 2, r.y + r.h / 2, { size: 21 * ui * hz, weight: 800, fill: on ? C.blue : C.mute, alpha: sg(r.h, 14 * ui, 26 * ui) });
    }
    ctx.restore();
  }
  ctx.fillStyle = C.grid; ctx.fillRect(L.wR - 1, hy, 2, L.gy1 - hy);
}

// ---------------------------------------------------------------- the window: SH15.sheet(o, t)
/* o: { w, h, ui, zoom, doc, saved, ribbon: {tab, hot, hotK, press, collapsed} | false, show: {title, ribbon, formula, headers, sheetTabs, status}, formula, active, sel, cells, cols, rows, colW, rowH, merges, merge,
 *      freeze, scroll, tabs, tab, status, stats, fills, edit, ants, r (window corner radius), shadow, dressing } */
SH.sheet = (o, t = 0) => {
  o = o || {};
  const prevDress = MODE.dress;
  MODE.dress = !!o.dressing;
  const L = layout(o);
  ctx.save();
  if (o.r) {
    if (o.shadow) { ctx.save(); ctx.shadowColor = C.shadow; ctx.shadowBlur = o.shadow; ctx.shadowOffsetY = o.shadow / 3; ctx.fillStyle = C.white; rect(0, 0, L.Wd, L.Hd, o.r); ctx.fill(); ctx.restore(); }
    rect(0, 0, L.Wd, L.Hd, o.r); ctx.clip();
  }
  ctx.fillStyle = C.white; ctx.fillRect(0, 0, L.Wd, L.Hd);
  drawTitle(L, o); drawTabRow(L, o); drawRibbon(L, o); drawFormula(L, o, t);
  drawGrid(L, o, t);
  drawSheetTabs(L, o); drawStatus(L, o);
  ctx.restore();
  MODE.dress = prevDress;
  return L;
};
/* layout queries, all in the window's local frame */
const rectOf = R => ({ x: R.x, y: R.y, w: R.w, h: R.h, x1: R.x + R.w, y1: R.y + R.h, cx: R.x + R.w / 2, cy: R.y + R.h / 2 });
SH.cellRect = (rf, o) => { const L = layout(o), g = range(rf); return rectOf(L.rect(g.c0, g.r0, g.c1, g.r1)); };
SH.colX = (col, o) => { const L = layout(o); return L.xOf(typeof col === 'number' ? col : colIndex(col)); };
SH.rowY = (row, o) => { const L = layout(o); return L.yOf(row - 1); };

// ---------------------------------------------------------------- the pointer: SH15.pointer(x, y, { kind: 'arrow' | 'hand' | 'cross' | 'text', press: 0..1, s, trail, ripple, color })
/* (x, y) is the hot spot (the arrow's tip, the fingertip, the centre of the cross). A chunky friendly pointer with a white outline, a soft shadow and a press ring; s scales it (the sheet may be small on a TV: use s 2 to 3 there). */
SH.pointer = (x, y, o = {}) => {
  const kind = o.kind || 'arrow', s = o.s ?? 1, press = cl(o.press || 0), col = o.color || C.ink;
  ctx.save();
  if (o.trail && o.trail.length > 1) {   /* the drag trail: where the pointer has been, fading toward the tail */
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < o.trail.length; i++) { const k = i / (o.trail.length - 1); ctx.strokeStyle = rgba(C.blue, .42 * k); ctx.lineWidth = 7 * s * (.4 + .6 * k); ln(o.trail[i - 1][0], o.trail[i - 1][1], o.trail[i][0], o.trail[i][1]); }
  }
  ctx.translate(x, y); ctx.scale(s, s);
  const rip = o.ripple != null ? cl(o.ripple) : press > 0 ? 0 : -1;
  if (press > 0 || rip >= 0) {   /* the press ring */
    const k = o.ripple != null ? eO(rip) : press, a = o.ripple != null ? (1 - rip) : .8 * press;
    ctx.strokeStyle = rgba(C.blue, .75 * a); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 10 + 38 * k, 0, TAU); ctx.stroke();
    if (press > 0 && o.ripple == null) { ctx.fillStyle = rgba(C.blue, .16 * press); ctx.beginPath(); ctx.arc(0, 0, 10 + 24 * press, 0, TAU); ctx.fill(); }
  }
  ctx.shadowColor = 'rgba(20,24,30,.38)'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 4;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const outline = (draw, lwOut, lwIn) => {   /* draw the same silhouette as a white outline, then in the ink colour */
    ctx.strokeStyle = '#fff'; ctx.lineWidth = lwOut; draw(); ctx.stroke();
    ctx.shadowColor = 'transparent';
  };
  if (kind === 'arrow') {
    const sc = 1 - .1 * press;
    ctx.scale(sc, sc);
    const path = () => { ctx.beginPath(); ctx.moveTo(1, 1); ctx.lineTo(1, 38); ctx.lineTo(10, 29.5); ctx.lineTo(16.5, 43); ctx.lineTo(24, 39.5); ctx.lineTo(17.5, 27); ctx.lineTo(29.5, 26.5); ctx.closePath(); };
    outline(path, 9); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 3; path(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(4.5, 9); ctx.lineTo(4.5, 25); ctx.lineTo(10, 20.5); ctx.closePath(); ctx.fill();
  } else if (kind === 'hand') {   /* a pointing hand: the index finger up, three curled fingers, a thumb, the back of the hand */
    const sc = .85 * (1 - .08 * press); ctx.scale(sc, sc);
    const shapes = [[-17, 24, 43, 34, 13], [-28, 31, 22, 14, 7], [21, 22, 14, 22, 7], [13.5, 17, 14, 24, 7], [6, 13, 14, 26, 7], [-6.5, 0, 13, 44, 6.5]];
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 9.5; for (const q of shapes) { rect(q[0], q[1], q[2], q[3], q[4]); ctx.stroke(); } ctx.shadowColor = 'transparent';
    ctx.strokeStyle = col; ctx.lineWidth = 3.6; ctx.fillStyle = '#fff'; for (const q of shapes) { rect(q[0], q[1], q[2], q[3], q[4]); ctx.fill(); ctx.stroke(); }
  } else if (kind === 'cross') {
    const sc = 1 - .1 * press; ctx.scale(sc, sc);
    const path = () => { ctx.beginPath(); ctx.roundRect(-5.5, -20, 11, 40, 3); ctx.roundRect(-20, -5.5, 40, 11, 3); };
    ctx.strokeStyle = col; ctx.lineWidth = 12; path(); ctx.stroke(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#fff'; ctx.fill('nonzero'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; path(); ctx.stroke();
  } else {   /* text: an I-beam */
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; const p = () => { ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(8, -20); ctx.moveTo(0, -20); ctx.lineTo(0, 20); ctx.moveTo(-8, 20); ctx.lineTo(8, 20); };
    p(); ctx.stroke(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = col; ctx.lineWidth = 4.2; p(); ctx.stroke();
  }
  ctx.restore();
};
/* the pointer along eased waypoints: points = [{ t, x, y, click: [t0, t1] | [[t0, t1], ...], kind }], t = the moment the pointer ARRIVES; it rests there until the click ends (or o.hold), then moves
   on with a slight arc and a natural overshoot, arriving exactly on the next t. Returns { x, y, press, kind, moving }. */
SH.cursorPath = (pts, t) => {
  if (!pts || !pts.length) return { x: 0, y: 0, press: 0, kind: 'arrow', moving: false };
  const clicks = p => !p.click ? [] : typeof p.click[0] === 'number' ? [p.click] : p.click;
  const leave = p => { let l = p.t + (p.hold || 0); for (const c of clicks(p)) l = Math.max(l, c[1]); return l; };
  let x = pts[0].x, y = pts[0].y, moving = false, kind = pts[0].kind || 'arrow', press = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], nx = pts[i + 1];
    for (const c of clicks(p)) { const d = c[1] - c[0], k = sg(t, c[0], c[1]); if (k > 0 && k < 1) press = Math.max(press, eIO(sg(k, 0, .35)) * (1 - eIO(sg(k, .65, 1)))); }
    if (t >= p.t) { x = p.x; y = p.y; kind = p.kind || kind; }
    if (nx && t > leave(p) && t < nx.t) {
      const a = leave(p), k = sg(t, a, nx.t), dx = nx.x - p.x, dy = nx.y - p.y, dist = Math.hypot(dx, dy) || 1, nxv = -dy / dist, nyv = dx / dist;
      const base = eIO(k), over = (nx.over ?? .035) * Math.sin(Math.PI * sg(k, .62, 1)) * (dist > 60 ? 1 : dist / 60), arc = (i % 2 ? -1 : 1) * (nx.arc ?? .07) * dist * Math.sin(Math.PI * base);
      x = p.x + dx * (base + over) + nxv * arc; y = p.y + dy * (base + over) + nyv * arc;
      moving = true; kind = p.kind || kind;
    }
  }
  return { x, y, press, kind, moving };
};

// ---------------------------------------------------------------- dialogs: SH15.dialog(o, u), u 0..1 = the pop-in (scale and fade); drawn over the dimmed sheet
/* o: { kind: 'warn' | 'info' | 'error' | 'cantUndo' | 'findReplace' | 'saveAs' | 'removeDuplicates', w, h (the window), at: [cx, cy], s (dialog scale), title, text, buttons: [{id, t, def}], press: k, pressed: id,
 *      focus: id, t (seconds, for the caret), dressing, dim } */
const DIAL = {};
function sizeBtn(t, s) { return Math.max(150 * s, UI.sizeOf(t, { size: 32 * s, weight: 900 }).w + 56 * s); }
function dlgGeom(o) {
  const Wd = o.w ?? 1080, Hd = o.h ?? 1920, s = o.s ?? 1, kind = o.kind || 'warn', def = DIAL[kind] || DIAL.warn;
  const TB = 68 * s, BAR = 112 * s, pad = 40 * s;
  const g = def.geom(o, { Wd, Hd, s, TB, BAR, pad });
  const cx = o.at ? o.at[0] : Wd / 2, cy = o.at ? o.at[1] : Hd > Wd ? Hd * .38 : Hd / 2;
  g.kind = kind; g.s = s; g.TB = TB; g.BAR = g.noBar ? 0 : BAR; g.pad = pad; g.Wd = Wd; g.Hd = Hd;
  g.x = cx - g.w / 2; g.y = cy - g.h / 2; g.cx = cx; g.cy = cy;
  g.barY = g.y + g.h - g.BAR;
  let bx = g.x + g.w - pad;
  if (!g.customBtns) g.btns = (g.buttons || []).slice().reverse().map(b => { const w = b.w ?? sizeBtn(b.t, s), r = { id: b.id, t: b.t, def: !!b.def, x: bx - w, y: g.barY + (BAR - 62 * s) / 2, w, h: 62 * s }; bx -= w + 18 * s; return r; }).reverse();
  g.rects = {};
  if (def.place) def.place(g, o);
  for (const r of g.btns) { r.cx = r.x + r.w / 2; r.cy = r.y + r.h / 2; r.aim = [r.x + r.w * .8, r.y + r.h * .72]; }
  return g;
}
SH.dialogRect = (o, what) => {
  const g = dlgGeom(o || {});
  if (!what || what === 'panel') return rectOf({ x: g.x, y: g.y, w: g.w, h: g.h });
  const b = g.btns.find(v => v.id === what);
  if (b) return Object.assign(rectOf(b), { aim: b.aim });
  const f = g.rects && g.rects[what];
  return f ? rectOf({ x: f[0], y: f[1], w: f[2], h: f[3] }) : null;
};
function dlgIcon(kind, cx, cy, r) {
  ctx.save(); ctx.translate(cx, cy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const bang = (col, k = 1) => { ctx.fillStyle = col; rect(-r * .075, -r * .42 * k, r * .15, r * .6 * k, r * .075); ctx.fill(); ctx.beginPath(); ctx.arc(0, r * .5, r * .1, 0, TAU); ctx.fill(); };
  if (kind === 'warn') {
    ctx.fillStyle = C.amber; ctx.strokeStyle = C.amber; ctx.lineWidth = r * .3; ctx.beginPath(); ctx.moveTo(0, -r * .78); ctx.lineTo(r * .86, r * .66); ctx.lineTo(-r * .86, r * .66); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent'; bang(C.ink, .9);
  } else if (kind === 'error') {
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * .2; ln(-r * .36, -r * .36, r * .36, r * .36); ln(r * .36, -r * .36, -r * .36, r * .36);
  } else if (kind === 'undo') {
    ctx.fillStyle = '#e4e7eb'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.save(); ctx.scale(r / 38, r / 38); ctx.lineWidth = 4.4; ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ICON.undo(); ctx.restore();
    ctx.strokeStyle = C.red; ctx.lineWidth = r * .16; ln(-r * .62, -r * .62, r * .62, r * .62);
  } else {
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; rect(-r * .075, -r * .06, r * .15, r * .52, r * .075); ctx.fill(); ctx.beginPath(); ctx.arc(0, -r * .32, r * .105, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function drawBtn(b, o, hero, s) {
  const pr = o.pressed === b.id || (o.press && o.press.id === b.id) ? cl(typeof o.press === 'object' ? o.press.k : o.press) : 0, foc = o.btnFocus ? o.btnFocus === b.id : b.def;
  ctx.save(); ctx.translate(0, 2.5 * s * pr);
  ctx.save();
  if (!pr) { ctx.shadowColor = 'rgba(20,24,30,.22)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 3 * s; }
  rect(b.x, b.y, b.w, b.h, 14 * s); ctx.fillStyle = b.def ? mixc(C.blue, '#1a4fc4', pr) : mixc('#ffffff', '#dfe3e8', pr); ctx.fill();
  ctx.restore();
  if (!b.def) { rect(b.x, b.y, b.w, b.h, 14 * s); ctx.strokeStyle = C.line2; ctx.lineWidth = 2.2 * s; ctx.stroke(); }
  if (foc) { rect(b.x - 7 * s, b.y - 7 * s, b.w + 14 * s, b.h + 14 * s, 20 * s); ctx.strokeStyle = rgba(C.blue, .85); ctx.lineWidth = 3.2 * s; ctx.stroke(); }
  const id = 'btn:' + b.id;
  UI.container(id, 'button', [b.x, b.y, b.x + b.w, b.y + b.h], 6 * s);
  T(b.t, b.cx, b.cy, { size: 32 * s, weight: 900, fill: b.def ? '#fff' : C.ink, hero, crop: !hero, cid: id, center: true });
  ctx.restore();
}
SH.dialog = (o, u = 1) => {
  o = o || {};
  MODE.dress = !!o.dressing;
  const g = dlgGeom(o), def = DIAL[g.kind] || DIAL.warn, k = cl(u), trans = k < 1, s = g.s;
  if (k <= 0) return g;
  const hero = !trans && !MODE.dress;
  ctx.save();
  if (o.dim !== false) { ctx.fillStyle = rgba('#10161d', (o.dimA ?? .46) * eO(sg(k, 0, .75))); ctx.fillRect(0, 0, g.Wd, g.Hd); }
  const sc = lp(.86, 1, eB(k)); ctx.translate(g.cx, g.cy); ctx.scale(sc, sc); ctx.translate(-g.cx, -g.cy);
  ctx.globalAlpha *= sg(k, 0, .4);
  ctx.save(); ctx.shadowColor = 'rgba(8,12,16,.5)'; ctx.shadowBlur = 46 * s; ctx.shadowOffsetY = 16 * s;
  rect(g.x, g.y, g.w, g.h, 22 * s); ctx.fillStyle = C.dialog; ctx.fill(); ctx.restore();
  ctx.save(); rect(g.x, g.y, g.w, g.h, 22 * s); ctx.clip();
  ctx.fillStyle = C.white; ctx.fillRect(g.x, g.y, g.w, g.TB); hline(g.x, g.x + g.w, g.y + g.TB - 1, C.grid, 2);
  if (g.BAR) { ctx.fillStyle = '#e4e7eb'; ctx.fillRect(g.x, g.barY, g.w, g.BAR); hline(g.x, g.x + g.w, g.barY + 1, C.grid, 2); }
  ctx.restore();
  logo(g.x + 40 * s, g.y + g.TB / 2, 32 * s);
  T(o.title ?? def.title ?? 'GridSheet', g.x + 70 * s, g.y + g.TB / 2, { align: 'left', size: 26 * s, weight: 800, fill: C.ink, maxW: g.w - 190 * s });
  ctx.strokeStyle = C.mute; ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; const xx = g.x + g.w - 40 * s, xy = g.y + g.TB / 2; ln(xx - 9 * s, xy - 9 * s, xx + 9 * s, xy + 9 * s); ln(xx + 9 * s, xy - 9 * s, xx - 9 * s, xy + 9 * s);
  def.draw(g, o, hero, k);
  for (const b of g.btns) drawBtn(b, o, hero, s);
  ctx.restore();
  return g;
};
/* the message dialogs: an icon on the left, a paragraph on the right */
function msgGeom(o, c, def) {
  const text = o.text ?? def.text, bw = 880 * c.s - 2 * c.pad - 124 * c.s, size = (o.size ?? 34) * c.s, lines = UI.wrap(text, bw, { size, weight: 700 }), pitch = size * 1.32;
  const bodyH = Math.max(124 * c.s, lines.length * pitch) + 2 * 34 * c.s;
  const bts = o.buttons || def.buttons;
  return { w: 880 * c.s, h: c.TB + bodyH + c.BAR, buttons: bts, text, size, bodyH, textBox: [0, 0, bw, bodyH - 68 * c.s] };
}
function msgDraw(g, o, hero, k, icon) {
  const s = g.s, bodyY = g.y + g.TB, ix = g.x + g.pad + 48 * s, iy = bodyY + g.bodyH / 2;
  dlgIcon(icon, ix, iy, 46 * s);
  const bx = g.x + g.pad + 124 * s, by = bodyY + 34 * s, bw = g.w - 2 * g.pad - 124 * s, bh = g.bodyH - 68 * s;
  UI.para(g.text, [bx, by, bw, bh], opt({ size: g.size, weight: 700, fill: C.ink, align: 'left', valign: 'middle', lh: 1.32, hero, crop: !hero, min: g.size }));
}
DIAL.warn = { title: 'GridSheet', text: 'Merging keeps only the top-left value. Other values will be discarded.', buttons: [{ id: 'ok', t: 'OK', def: true }, { id: 'cancel', t: 'Cancel' }], geom(o, c) { return msgGeom(o, c, DIAL.warn); }, draw(g, o, hero, k) { msgDraw(g, o, hero, k, 'warn'); } };
DIAL.info = { title: 'GridSheet', text: 'All done.', buttons: [{ id: 'ok', t: 'OK', def: true }], geom(o, c) { return msgGeom(o, c, DIAL.info); }, draw(g, o, hero, k) { msgDraw(g, o, hero, k, 'info'); } };
DIAL.error = { title: 'GridSheet', text: 'Something went wrong.', buttons: [{ id: 'ok', t: 'OK', def: true }], geom(o, c) { return msgGeom(o, c, DIAL.error); }, draw(g, o, hero, k) { msgDraw(g, o, hero, k, 'error'); } };
DIAL.cantUndo = { title: 'GridSheet', text: "Can't undo.", buttons: [{ id: 'ok', t: 'OK', def: true }], geom(o, c) { return msgGeom(Object.assign({ size: 40 }, o), c, DIAL.cantUndo); }, draw(g, o, hero, k) { msgDraw(g, o, hero, k, 'undo'); } };

// ---------------------------------------------------------------- THE MERGE: borders dissolve, the discarded values shake and fall away, the survivor glides to the centre and grows
/* The region is drawn by the sheet (sheet({ ..., merge: { range, u, ... } })) or by SH15.merge(o, u). The cells keep their values in `cells`; the survivor is the top-left one unless merge.survivor says otherwise.
 * merge: { range: 'A1:C1', u: 0..1, survivor: 0, final: { text, font, weight, size, fill, bg, stroke, lw, spacing, fitW, hero }, after: seconds since u reached 1 (the flash fades), fall, t0, sel: false, selK }
 * u: 0 to .14 the outline pulses | .08 to .44 the borders between the cells dissolve | .14 to .4 the discarded values tremble, then fall | .30 to .76 the survivor glides to the centre and grows | 1 exactly the final cell. */
const pop = k => { const c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function fallPieces(L, lay, tau, k, A) {
  const { str, size, weight, font, spacing } = lay, met = UI.metrics(font, weight, false), cap = met.cap * size, m0 = meas(str, size, font, weight, false, spacing);
  const ox = lay.align === 'left' ? lay.cx - m0.l : lay.align === 'right' ? lay.cx - m0.r : lay.cx - (m0.l + m0.r) / 2, base = lay.cy + cap / 2, G = (A.fall ?? 5200) * L.z;
  for (let j = 0; j < str.length; j++) {
    const ch = str[j];
    if (ch === ' ') continue;
    const mc = meas(ch, size, font, weight, false, spacing), pre = meas(str.slice(0, j + 1), size, font, weight, false, spacing).adv - mc.adv;
    const r1 = rnd(k * 37 + j * 3.1 + 1), r2 = rnd(k * 53 + j * 7.7 + 2), r3 = rnd(k * 11 + j * 1.9 + 3), tt = Math.max(0, tau - j * .004 - r1 * .02);
    const px = (r2 - .5) * 220 * L.z * tt, py = -(40 + r3 * 110) * L.z * tt + .5 * G * tt * tt, rot = (r1 < .5 ? -1 : 1) * Math.min(1.35, (5 + r3 * 7) * tt), al = 1 - sg(tt, .1, .32);
    if (al < .03) continue;
    ctx.save(); ctx.translate(ox + pre + mc.adv / 2 + px, base - cap / 2 + py); ctx.rotate(rot);
    UI.write(ch, -mc.adv / 2 + mc.l, cap / 2, opt({ align: 'left', size, weight, font, spacing, fill: mixc(lay.fill, '#9aa1ab', sg(tt, 0, .2)), alpha: al * lay.fade, hero: false, crop: true, tilt: 1.5 }));
    ctx.restore();
  }
}
SH._mergeDraw = (L, o, t, m) => {
  const A = m.anim, g = m.g, z = L.z, ui = L.ui, cells = o.cells || {}, u = cl(A.u ?? 0), R = L.rect(g.c0, g.r0, g.c1, g.r1);
  const list = [];
  for (let r = g.r0; r <= g.r1; r++) for (let c = g.c0; c <= g.c1; c++) {
    const q = L.rect(c, r, c, r), key = refName(c, r); let sp = normCell(cells[key]) || {};
    if (A.texts && A.texts[list.length] != null) sp = Object.assign({}, sp, { v: A.texts[list.length] });   /* merge.texts overrides the values, in reading order */
    list.push({ c, r, key, sp, x: q.x, y: q.y, w: q.w, h: q.h, i: list.length });
  }
  const sv = Math.min(A.survivor ?? 0, list.length - 1), S = list[sv];
  const F = A.final || {}, font = F.font ?? 'Bangers', weight = wOfFont(font, F.weight), ftext = String(F.text ?? cellStr(S.sp)), size0 = F.size ?? Math.min(R.h * .62, 150 * z);
  const fz = UI.fit(ftext, R.w * (F.fitW ?? .9), { size: size0, font, weight, spacing: F.spacing ?? 4, lw: F.lw || 0, min: size0 * .25, quiet: true });
  const bgF = F.bg ?? C.deep, fillF = F.fill ?? '#ffe135', Rc = { x: R.x + R.w / 2, y: R.y + R.h / 2 };
  const pLine = eIO(sg(u, .08, .44)), pBg = eIO(sg(u, .2, .64)), ant = Math.sin(Math.PI * sg(u, 0, .16));
  ctx.save();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(R.x, R.y, R.w, R.h);   /* wipes the grid lines under the region; one fill once the cells have all become the final colour (no seam) */
  if (pBg >= 1) { ctx.fillStyle = bgF; ctx.fillRect(R.x, R.y, R.w, R.h); }
  else for (const e of list) { const base = e.sp.fill || '#ffffff'; ctx.fillStyle = pBg > 0 ? mixc(base, bgF, pBg) : base; ctx.fillRect(e.x, e.y, e.w, e.h); }
  if (pLine < 1) {   /* the borders between the cells retract toward their middles and fade */
    ctx.save(); ctx.globalAlpha *= 1 - pLine * .85; ctx.strokeStyle = o.gridColor || C.grid; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let c = g.c0; c < g.c1; c++) { const x = Math.round(L.xOf(c) + L.cwOf(c)), len = R.h * (1 - pLine); ln(x, R.y + (R.h - len) / 2, x, R.y + (R.h + len) / 2); }
    for (let r = g.r0; r < g.r1; r++) { const y = Math.round(L.yOf(r) + L.rhOf(r)), len = R.w * (1 - pLine); ln(R.x + (R.w - len) / 2, y, R.x + (R.w + len) / 2, y); }
    ctx.restore();
  }
  ctx.strokeStyle = pBg > 0 ? mixc(o.gridColor || C.grid, bgF, pBg) : o.gridColor || C.grid; ctx.lineWidth = 2; ctx.strokeRect(Math.round(R.x), Math.round(R.y), Math.round(R.w), Math.round(R.h));
  if (u < .5 && A.tint !== false) { ctx.fillStyle = rgba(C.blue, .13 * (1 - sg(u, .1, .5))); ctx.fillRect(R.x, R.y, R.w, R.h); }
  /* the discarded values: they tremble, then every letter drops and spins away on its own */
  const disc = list.filter(e => e.i !== sv && cellStr(e.sp)), step = Math.min(.045, .15 / Math.max(1, disc.length)), pieces = [];
  disc.forEach((e, k) => {
    const ts = (A.t0 ?? .14) + step * k;
    if (u < ts) { const sh = sg(u, ts - .07, ts - .015); drawCellText(L, e.x + Math.sin(u * 260 + k * 2.1) * 3.4 * z * sh, e.y + Math.sin(u * 190 + k) * 1.6 * z * sh, e.w, e.h, sh > 0 ? Object.assign({}, e.sp, { hero: false }) : e.sp, null); }
    else { const lay = cellTextLayout(L, e.x, e.y, e.w, e.h, e.sp); if (lay) pieces.push([lay, u - ts, k]); }
  });
  /* the survivor */
  const lay = cellTextLayout(L, S.x, S.y, S.w, S.h, S.sp), g0 = A.glide ?? .3, g1 = .76;
  if (u >= 1) {
    const id = 'merged:' + S.key;
    UI.container(id, 'cell', [R.x, R.y, R.x + R.w, R.y + R.h], 4 * z);
    T(ftext, Rc.x, Rc.y, { align: 'center', size: fz.size, spacing: fz.spacing, lw: fz.lw, stroke: F.stroke, font, weight, fill: fillF, hero: F.hero !== false, cid: id, center: true, snap: false });
  } else if (lay) {
    if (u <= g0) drawCellText(L, S.x, S.y, S.w, S.h, S.sp, null);
    else {
      /* the position arrives first, then the text grows in place (so it never spills out of the region), with a little overshoot */
      const kp = sg(u, g0, .6), pg = eIO(kp), ks = sg(u, .44, g1 + .08), im = meas(lay.str, lay.size, lay.font, lay.weight, false, lay.spacing), iw = im.r - im.l;
      const cx0 = lay.align === 'left' ? lay.cx + iw / 2 : lay.align === 'right' ? lay.cx - iw / 2 : lay.cx;
      const x = lp(cx0, Rc.x, pg), y = lp(lay.cy, Rc.y, pg) - 14 * z * Math.sin(Math.PI * pg), size = lp(lay.size, fz.size, pop(ks)), kf = sg(u, g0 - .02, g0 + .14);   /* the face changes early, while the text is still small */
      const common = { align: 'center', hero: false, crop: true, tilt: .2 };
      if (lay.font === font && lay.weight === weight) T(ftext, x, y, Object.assign({ size, spacing: lp(lay.spacing, fz.spacing, kf), font, weight, fill: mixc(lay.fill, fillF, kf) }, common));
      else {
        if (kf < 1) T(lay.str, x, y, Object.assign({ size: lay.size, spacing: lay.spacing, font: lay.font, weight: lay.weight, fill: lay.fill, alpha: 1 - kf }, common));
        if (kf > 0) T(ftext, x, y, Object.assign({ size, spacing: fz.spacing, font, weight, fill: fillF, alpha: kf }, common));
      }
    }
  }
  /* the outline of the selection tightens, then springs back thicker */
  if (A.sel !== false) {
    const inset = 10 * ui * eIO(sg(u, .05, .55)) * (1 - pop(sg(u, .55, .85))), lw = (o.selWidth ?? 3.8) * ui + 2.4 * ui * Math.sin(Math.PI * sg(u, .3, .9));
    ctx.save(); ctx.globalAlpha *= A.selK ?? 1; ctx.strokeStyle = C.blue; ctx.lineWidth = lw; ctx.lineJoin = 'miter';
    ctx.strokeRect(R.x + inset, R.y + inset, R.w - 2 * inset, R.h - 2 * inset);
    if (o.handle !== false) { const hs = 13 * ui; ctx.fillStyle = C.blue; ctx.fillRect(R.x + R.w - inset - hs / 2, R.y + R.h - inset - hs / 2, hs, hs); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4 * ui; ctx.strokeRect(R.x + R.w - inset - hs / 2, R.y + R.h - inset - hs / 2, hs, hs); }
    ctx.restore();
  }
  for (const [lay2, tau, k] of pieces) fallPieces(L, lay2, tau, k, A);
  /* the chime-ready flash: it builds toward the last frame and decays with `after` */
  const fl = u < 1 ? Math.pow(sg(u, .84, 1), 2) : A.after == null ? 1 : Math.exp(-A.after * 7);
  if (fl > .01) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const gr = ctx.createRadialGradient(Rc.x, Rc.y, 0, Rc.x, Rc.y, Math.max(R.w, R.h) * .75);
    gr.addColorStop(0, rgba('#ffffff', .62 * fl)); gr.addColorStop(.5, rgba('#a8ffd6', .26 * fl)); gr.addColorStop(1, rgba('#a8ffd6', 0));
    ctx.fillStyle = gr; ctx.fillRect(R.x - R.w * .3, R.y - R.h * 1.2, R.w * 1.6, R.h * 3.4);
    if (u >= 1 && A.after != null) { const rk = sg(A.after, 0, .7); if (rk < 1) { ctx.strokeStyle = rgba('#ffffff', .7 * (1 - rk)); ctx.lineWidth = 6 * ui * (1 - rk * .7); ctx.beginPath(); ctx.roundRect(R.x - 40 * ui * eO(rk), R.y - 40 * ui * eO(rk), R.w + 80 * ui * eO(rk), R.h + 80 * ui * eO(rk), 10 + 40 * ui * eO(rk)); ctx.stroke(); } }
    ctx.restore();
  }
  ctx.restore();
};
/* SH15.merge(o, u, t): the sheet with a merge in progress. o = { sheet: <the options you pass to sheet()>, range, final, survivor, after, ... } (or the sheet options themselves plus range) */
SH.merge = (o, u, t = 0) => {
  const so = o.sheet || o;
  return SH.sheet(Object.assign({}, so, { merge: Object.assign({}, o.merge || o, { u: cl(u), range: o.range || (o.merge && o.merge.range) }) }), t);
};

// ---------------------------------------------------------------- flipText: BREAK becomes PENDING, letter by letter (an odometer: the old letter slides out upward, the new one slides in from below, inside a clip)
/* flipText(from, to, u, o): o = { cx, cy (the centre of the string's ink and cap band, like UI.label), align: 'center' | 'left' | 'right', size, font, weight, italic, fill, stroke, lw, spacing, shadow, alpha, maxW,
 *   dur (.45: the share of u each letter takes), hero, cid, center, id }. The common start and end of the two strings stay where they are (they glide); the rest flips slot by slot with a stagger; the strings'
 * widths animate smoothly, the centre stays centred. u <= 0 draws `from` and u >= 1 draws `to` with UI.label (exact, hero as asked); the frames between are hero:false, crop:true (the clip may cut them). */
function strLayout(str, size, font, weight, italic, spacing, align, cx) {
  const m = meas(str, size, font, weight, italic, spacing), ox = align === 'left' ? cx - m.l : align === 'right' ? cx - m.r : cx - (m.l + m.r) / 2;
  const items = [];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], mc = meas(ch, size, font, weight, italic, spacing), pre = meas(str.slice(0, i + 1), size, font, weight, italic, spacing).adv - mc.adv;
    items.push({ ch, x: ox + pre, adv: mc.adv, l: mc.l });
  }
  return { items, end: ox + m.adv, ox, ink: m };
}
function flipImpl(from, to, u, o) {
  from = String(from); to = String(to);
  const k = cl(u), font = o.font || 'Nunito', weight = wOfFont(font, o.weight), italic = !!o.italic, align = o.align || 'center', cx = o.cx ?? 0, cy = o.cy ?? 0;
  const baseOpts = { size: o.size ?? 40, font, weight, italic, fill: o.fill ?? C.ink, stroke: o.stroke, lw: o.lw, spacing: o.spacing || 0, shadow: o.shadow, alpha: o.alpha, align };
  const exact = str => T(str, cx, cy, Object.assign({}, baseOpts, { maxW: o.maxW, hero: o.hero, crop: o.crop, cid: o.cid, center: o.center, centerY: o.centerY, id: o.id, tilt: o.tilt, snap: o.snap }));
  if (k <= 0 || from === to) return exact(from);
  if (k >= 1) return exact(to);
  /* each string fitted on its own, the size glides between the two fits */
  const fitOf = s => o.maxW ? UI.fit(s, o.maxW, Object.assign({ quiet: true }, baseOpts)) : { size: baseOpts.size, spacing: baseOpts.spacing, lw: baseOpts.lw || 0, k: 1 };
  const fa = fitOf(from), fb = fitOf(to), e = eIO(k), size = lp(fa.size, fb.size, e), sp = lp(fa.spacing, fb.spacing, e), lwv = lp(fa.lw || 0, fb.lw || 0, e);
  const A = strLayout(from, fa.size, font, weight, italic, fa.spacing, align, cx), B = strLayout(to, fb.size, font, weight, italic, fb.spacing, align, cx);
  const met = UI.metrics(font, weight, italic), cap = met.cap * size, base = cy + cap / 2, dur = o.dur ?? .45;
  let pre = 0; while (pre < from.length && pre < to.length && from[pre] === to[pre]) pre++;
  let suf = 0; while (suf < from.length - pre && suf < to.length - pre && from[from.length - 1 - suf] === to[to.length - 1 - suf]) suf++;
  const mA = from.length - pre - suf, mB = to.length - pre - suf, n = Math.max(mA, mB);
  const sizeK = size / fb.size, g = { size, font, weight, italic, fill: baseOpts.fill, stroke: o.stroke, lw: lwv, shadow: o.shadow, spacing: 0, hero: false, crop: true, tilt: .2 };
  const alphaAll = o.alpha ?? 1;
  const glyph = (ch, ox, l, dy, al) => { if (ch === ' ' || al <= .02) return; UI.write(ch, ox + l * size / fb.size, base + dy, opt(Object.assign({ align: 'left' }, g, { alpha: al * alphaAll }))); };
  let x0 = 1e9, x1 = -1e9;
  const bounds = (a, b) => { x0 = Math.min(x0, a); x1 = Math.max(x1, b); };
  /* the unchanged start and end: they only glide */
  const still = (ia, ib) => { const a = A.items[ia], b = B.items[ib], x = lp(a.x, b.x, e); glyph(a.ch, x, lp(a.l, b.l, e), 0, 1); bounds(x, x + lp(a.adv, b.adv, e)); };
  for (let i = 0; i < pre; i++) still(i, i);
  for (let i = 0; i < suf; i++) still(from.length - suf + i, to.length - suf + i);
  /* the flipping middle: slot j shows the old letter sliding up and out and the new letter sliding up and in. Order in time: letters that only leave (right to left), letters that change (left to right), letters that only arrive */
  const endA = pre + mA < from.length ? A.items[pre + mA].x : A.end, endB = pre + mB < to.length ? B.items[pre + mB].x : B.end, shiftX = B.ox - A.ox;
  const nMix = Math.min(mA, mB), order = [];
  for (let j = mA - 1; j >= mB; j--) order.push(j);
  for (let j = 0; j < nMix; j++) order.push(j);
  for (let j = mA; j < mB; j++) order.push(j);
  const travel = cap * 1.3 + size * .2, stag = n > 1 ? (1 - dur) / (n - 1) : 0, hasDesc = /[gjpqy,;()Q]/.test(from + to);
  order.forEach((j, oi) => {
    const ia = j < mA ? A.items[pre + j] : null, ib = j < mB ? B.items[pre + j] : null;
    const xa = ia ? ia.x : endA, xb = ib ? ib.x : endB, x = ia && ib ? lp(xa, xb, e) : ia ? lp(xa, xa + shiftX, e) : lp(xa, xb, e), wa = ia ? ia.adv : 0, wb = ib ? ib.adv : 0, w = Math.max(lp(wa, wb, e), size * .25);
    const p = eIO(sg(k, oi * stag, oi * stag + dur)), mg = size * .1 + lwv / 2, clipX = x - size * .12 - lwv / 2, clipW = Math.max(wa, wb) + size * .24 + lwv;
    ctx.save(); ctx.beginPath(); ctx.rect(clipX, base - cap - mg, clipW, cap + 2 * mg + (hasDesc ? met.desc * size : 0)); ctx.clip();
    if (ia) glyph(ia.ch, x, ia.l, -p * travel, 1 - sg(p, .55, 1));
    if (ib) glyph(ib.ch, x, ib.l, (1 - p) * travel, sg(p, .25, .7));
    ctx.restore();
    bounds(x, x + w);
  });
  return { x0, x1, y0: base - cap, y1: base, cx: (x0 + x1) / 2, cy, w: x1 - x0, k };
}
SH._flip = flipImpl;
SH.flipText = (from, to, u, o) => { o = Object.assign({ hero: true, snap: false }, o); MODE.dress = !!o.dressing; if (MODE.dress) o = Object.assign({}, o, { hero: false, crop: true }); return flipImpl(from, to, u, o); };

// ---------------------------------------------------------------- dialogs: Find and Replace, Save As, Remove Duplicates
function dlgField(g, o, hero, name, r, val, focus) {
  const s = g.s, [x, y, w, h] = r, id = 'field:' + name, arr = Array.isArray(val) ? val : [val, 1], txt = String(arr[0] ?? ''), k = arr[1] == null ? 1 : cl(arr[1]), size = 34 * s;
  rect(x, y, w, h, 10 * s); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = focus ? C.blue : C.line2; ctx.lineWidth = (focus ? 3.6 : 2.2) * s; ctx.stroke();
  UI.container(id, 'field', [x, y, x + w, y + h], 10 * s);
  if (txt) T(txt, x + 20 * s, y + h / 2, { align: 'left', size, weight: 700, fill: C.ink, reveal: k, hero, crop: !hero, cid: id, maxW: w - 44 * s });
  if (focus) {
    const n = k >= 1 ? txt.length : Math.ceil(txt.length * k);
    if (k < 1 || Math.floor((o.t || 0) * 2.2) % 2 === 0) { ctx.fillStyle = C.blue; ctx.fillRect(caretX(txt, x + 20 * s, txt.slice(0, n), size, 700) + 2 * s, y + h / 2 - size * .62, 2.8 * s, size * 1.24); }
  }
}
function dlgCheck(g, hero, x, cy, label, on, size, bold) {
  const s = g.s, b = 30 * s;
  rect(x, cy - b / 2, b, b, 7 * s); ctx.fillStyle = on ? C.blue : C.white; ctx.fill(); ctx.strokeStyle = on ? C.blue : C.line2; ctx.lineWidth = 2.4 * s; ctx.stroke();
  if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x + b * .24, cy + b * .02); ctx.lineTo(x + b * .44, cy + b * .24); ctx.lineTo(x + b * .78, cy - b * .22); ctx.stroke(); }
  return T(label, x + b + 16 * s, cy, { align: 'left', size, weight: bold ? 800 : 700, fill: C.ink, hero, crop: !hero });
}
const chevron = (x, y, s, col) => { ctx.strokeStyle = col || C.mute; ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 3 * s); ctx.lineTo(x, y + 4 * s); ctx.lineTo(x + 7 * s, y - 3 * s); ctx.stroke(); };
DIAL.findReplace = {
  title: 'Find and Replace',
  geom(o, c) {
    const bt = o.buttons || [{ id: 'findNext', t: 'Find Next' }, { id: 'replace', t: 'Replace' }, { id: 'replaceAll', t: 'Replace All', def: true }, { id: 'close', t: 'Close' }];
    return { w: 940 * c.s, h: c.TB + 470 * c.s, noBar: true, customBtns: true, buttons: bt };
  },
  place(g, o) {
    const s = g.s, x = g.x, y = g.y + g.TB;
    g.rects.find = [x + 40 * s, y + 62 * s, 560 * s, 66 * s]; g.rects.replace = [x + 40 * s, y + 192 * s, 560 * s, 66 * s]; g.rects.status = [x + 40 * s, y + 388 * s, 560 * s, 44 * s];
    g.btns = g.buttons.map((b, i) => ({ id: b.id, t: b.t, def: !!b.def, x: x + 634 * s, y: y + 62 * s + i * 82 * s, w: 266 * s, h: 62 * s }));
  },
  draw(g, o, hero, k) {
    const s = g.s, R = g.rects, foc = o.focus || 'find', yb = g.y + g.TB;
    T('Find what:', R.find[0], R.find[1] - 25 * s, { align: 'left', size: 30 * s, weight: 800, fill: C.mute, hero, crop: !hero });
    T('Replace with:', R.replace[0], R.replace[1] - 25 * s, { align: 'left', size: 30 * s, weight: 800, fill: C.mute, hero, crop: !hero });
    dlgField(g, o, hero, 'find', R.find, o.typed && foc === 'find' ? o.typed : o.find ?? '', foc === 'find');
    dlgField(g, o, hero, 'replace', R.replace, o.typed && foc === 'replace' ? o.typed : o.replace ?? '', foc === 'replace');
    const opts = o.options || [['Match case', false], ['Match entire cell', false]];
    opts.forEach(([lab, on], i) => dlgCheck(g, false, R.find[0], yb + 306 * s + i * 48 * s, lab, on, 26 * s));
    if (o.status) T(o.status, R.status[0], R.status[1] + R.status[3] / 2, { align: 'left', size: 30 * s, weight: 800, fill: C.green, hero, crop: !hero, maxW: R.status[2] });
  },
};
DIAL.saveAs = {
  title: 'Save As',
  buttons: [{ id: 'save', t: 'Save', def: true }, { id: 'cancel', t: 'Cancel' }],
  geom(o, c) { return { w: 980 * c.s, h: c.TB + 610 * c.s + c.BAR, buttons: o.buttons || DIAL.saveAs.buttons }; },
  place(g, o) {
    const s = g.s, x = g.x, y = g.y + g.TB;
    g.rects.path = [x + 170 * s, y + 18 * s, g.w - 210 * s, 52 * s]; g.rects.folders = [x + 40 * s, y + 90 * s, 230 * s, 250 * s]; g.rects.files = [x + 286 * s, y + 90 * s, g.w - 326 * s, 250 * s];
    const fx = 40 * s + Math.max(UI.sizeOf('File name:', { size: 30 * s, weight: 800 }).w, UI.sizeOf('Save as type:', { size: 26 * s, weight: 800 }).w) + 26 * s;
    g.rects.name = [x + fx, y + 372 * s, g.w - fx - 40 * s, 66 * s]; g.rects.type = [x + fx, y + 470 * s, g.w - fx - 40 * s, 56 * s];
  },
  draw(g, o, hero, k) {
    const s = g.s, R = g.rects, yb = g.y + g.TB, x0 = g.x + 40 * s;
    T('Save in:', x0, R.path[1] + R.path[3] / 2, { align: 'left', size: 26 * s, weight: 800, fill: C.mute, hero: false, crop: !hero });
    rect(R.path[0], R.path[1], R.path[2], R.path[3], 10 * s); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2.2 * s; ctx.stroke();
    T(o.path ?? 'Documents  /  Merger', R.path[0] + 18 * s, R.path[1] + R.path[3] / 2, { align: 'left', size: 26 * s, weight: 700, fill: C.ink, hero: false, crop: !hero, maxW: R.path[2] - 70 * s });
    chevron(R.path[0] + R.path[2] - 26 * s, R.path[1] + R.path[3] / 2, s);
    /* folders */
    const [fx, fy, fw, fh] = R.folders; rect(fx, fy, fw, fh, 10 * s); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2.2 * s; ctx.stroke();
    const folders = o.folders || ['Recent', 'Desktop', 'Documents', 'Shared drive', 'Merger'], cur = o.folder ?? 'Merger', rh = Math.min(50 * s, (fh - 12 * s) / folders.length);
    ctx.save(); rect(fx, fy, fw, fh, 10 * s); ctx.clip();
    folders.forEach((n, i) => {
      const cy = fy + 6 * s + rh * (i + .5), on = n === cur;
      if (on) { ctx.fillStyle = C.blueSoft; ctx.fillRect(fx + 4 * s, cy - rh / 2, fw - 8 * s, rh); }
      ctx.fillStyle = on ? C.blue : C.soft; rect(fx + 18 * s, cy - 9 * s, 26 * s, 19 * s, 4 * s); ctx.fill(); rect(fx + 18 * s, cy - 13 * s, 12 * s, 7 * s, 2 * s); ctx.fill();
      T(n, fx + 56 * s, cy, { align: 'left', size: 24 * s, weight: on ? 900 : 700, fill: on ? C.blue : C.ink, hero: false, crop: !hero, maxW: fw - 70 * s });
    });
    ctx.restore();
    /* files */
    const [gx, gy, gw, gh] = R.files; rect(gx, gy, gw, gh, 10 * s); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2.2 * s; ctx.stroke();
    const files = o.files || ['SYNERGY_MODEL_v47_FINAL_REAL.gsx', 'SYNERGY_MODEL_v46_FINAL.gsx', 'FRUIT_SALAD_FINAL_v6.gsx', 'ORG_CHART_REAL_REAL.gsx'], fh2 = Math.min(56 * s, (gh - 12 * s) / files.length);
    files.forEach((n, i) => {
      const cy = gy + 6 * s + fh2 * (i + .5);
      if (i % 2) { ctx.fillStyle = C.head; ctx.fillRect(gx + 3 * s, cy - fh2 / 2, gw - 6 * s, fh2); }
      logo(gx + 36 * s, cy, 26 * s);
      T(n, gx + 62 * s, cy, { align: 'left', size: 24 * s, weight: 700, fill: C.ink, hero: false, crop: !hero, maxW: gw - 84 * s });
    });
    T('File name:', x0, R.name[1] + R.name[3] / 2, { align: 'left', size: 30 * s, weight: 800, fill: C.mute, hero, crop: !hero });
    dlgField(g, o, hero, 'name', R.name, o.typed || o.name || '', true);
    T('Save as type:', x0, R.type[1] + R.type[3] / 2, { align: 'left', size: 26 * s, weight: 800, fill: C.mute, hero: false, crop: !hero });
    rect(R.type[0], R.type[1], R.type[2], R.type[3], 10 * s); ctx.fillStyle = C.head; ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2.2 * s; ctx.stroke();
    T(o.type ?? 'GridSheet Workbook (.gsx)', R.type[0] + 20 * s, R.type[1] + R.type[3] / 2, { align: 'left', size: 26 * s, weight: 700, fill: C.ink, hero: false, crop: !hero, maxW: R.type[2] - 80 * s });
    chevron(R.type[0] + R.type[2] - 26 * s, R.type[1] + R.type[3] / 2, s);
  },
};
DIAL.removeDuplicates = {
  title: 'Remove Duplicates',
  buttons: [{ id: 'ok', t: 'OK', def: true }, { id: 'cancel', t: 'Cancel' }],
  geom(o, c) {
    if (o.stage === 'result') {
      const text = o.text ?? `${o.removed ?? 12} duplicate values found and removed. ${o.remain ?? 28} unique values remain.`;
      return Object.assign(msgGeom(Object.assign({}, o, { text, buttons: [{ id: 'ok', t: 'OK', def: true }] }), c, DIAL.info), { result: true });
    }
    const cols = o.columns || [['Name', true], ['Role', true], ['Unit', true], ['Hours', true]], rows = Math.ceil(cols.length / 2);
    return { w: 800 * c.s, h: c.TB + (110 + rows * 62 + 36) * c.s + c.BAR, buttons: o.buttons || DIAL.removeDuplicates.buttons, cols };
  },
  draw(g, o, hero, k) {
    if (g.result) return msgDraw(g, o, hero, k, 'info');
    const s = g.s, yb = g.y + g.TB, w2 = (g.w - 80 * s) / 2;
    UI.para(o.prompt ?? 'Choose the columns that define a duplicate.', [g.x + 40 * s, yb + 24 * s, g.w - 80 * s, 64 * s], opt({ size: 30 * s, weight: 700, fill: C.ink, align: 'left', valign: 'middle', hero, crop: !hero, min: 30 * s }));
    g.cols.forEach(([lab, on], i) => dlgCheck(g, hero, g.x + 40 * s + (i % 2) * w2, yb + 128 * s + Math.floor(i / 2) * 62 * s, lab, on, 32 * s, true));
  },
};

// ---------------------------------------------------------------- operations on the sheet: insertRow, removeDuplicates, fillDrag (each DRAWS THE SHEET itself with derived options) and errorCell (an overlay)
/* shift the row-bearing options of a sheet when a row is inserted before 0-based row `at` (cells, row heights, merges, fills) */
function shiftRows(so, at, by) {
  const mv = r => r >= at ? r + by : r, cells = {}, src = so.cells || {};
  for (const key in src) { const rf = ref(key); if (!rf.bad) cells[refName(rf.c, mv(rf.r))] = src[key]; }
  const rows = {}, ro = so.rows;
  if (Array.isArray(ro)) ro.forEach((h, i) => { if (h != null) rows[mv(i) + 1] = h; }); else for (const key in ro || {}) rows[mv(+key - 1) + 1] = ro[key];
  const rg = g => { const q = range(g); return refName(q.c0, mv(q.r0)) + ':' + refName(q.c1, mv(q.r1)); };
  return { cells, rows, merges: (so.merges || []).map(rg), fills: (so.fills || []).map(f => Object.assign({}, f, { range: rg(f.range) })) };
}
/* insertRow: o = { sheet, at: 2 (the new row's number), row: { A: 'Executive Suite', B: ..., }, fill: '#cfe0ff', select: false }. The new row grows from nothing (a blue row), the rows below slide down by one row height, the new cells fade in.
 * `sheet` holds the cells as they were BEFORE the insertion; keep calling insertRow with u = 1 for the rest of the shot. Returns the layout. */
SH.insertRow = (o, u, t = 0) => {
  const so = o.sheet || o, at = (o.at ?? 2) - 1, k = eO(cl(u)), rowH = so.rowH ?? 52, sh = shiftRows(so, at, 1), spec = o.row || {};
  let cMin = 99, cMax = -1;
  for (const col in spec) { const c = colIndex(col); cMin = Math.min(cMin, c); cMax = Math.max(cMax, c); sh.cells[col.toUpperCase() + (at + 1)] = Object.assign({ fill: o.fill ?? '#cfe0ff', bold: true, alpha: sg(k, .3, 1) }, normCell(spec[col])); }
  sh.rows[at + 1] = rowH * k;
  sh.fills.push({ range: refName(0, at) + ':' + refName(25, at), color: C.blue, a: .15 * k });
  const d = Object.assign({}, so, sh, { renumber: true });
  if (o.select !== false && cMax >= 0) { d.sel = refName(cMin, at) + ':' + refName(cMax, at); d.active = refName(cMin, at); }
  return SH.sheet(d, t);
};
/* removeDuplicates: o = { sheet, rows: [7, 12, ...] (1-based numbers of the duplicate rows), cols: 'A:D' }. Rows go amber (0 to .3), the values are struck through (.24 to .55), then the rows collapse one after the other, top to bottom
 * (.5 to 1) and the rows below slide up; row numbers count only the rows that are left. Returns the layout. */
SH.removeDuplicates = (o, u, t = 0) => {
  const so = o.sheet || o, list = (o.rows || []).slice().sort((a, b) => a - b), k = cl(u), n = Math.max(1, list.length), stag = Math.min(.03, .17 / n), rowH = so.rowH ?? 52;
  const cells = Object.assign({}, so.cells), fills = (so.fills || []).slice(), rows = Array.isArray(so.rows) ? Object.fromEntries(so.rows.map((h, i) => [i + 1, h]).filter(([, h]) => h != null)) : Object.assign({}, so.rows);
  let c0 = 0, c1 = 3; const cm = o.cols && /^([A-Za-z]+)\d*:([A-Za-z]+)\d*$/.exec(o.cols); if (cm) { c0 = colIndex(cm[1]); c1 = colIndex(cm[2]); }
  list.forEach((r, i) => {
    fills.push({ range: refName(c0, r - 1) + ':' + refName(c1, r - 1), color: C.amber, a: .55 * eO(sg(k, i * stag, i * stag + .2)) });
    const ks = eO(sg(k, .24 + i * stag, .46 + i * stag));
    if (ks > 0) for (let c = c0; c <= c1; c++) { const key = refName(c, r - 1), sp = normCell(cells[key]); if (sp) cells[key] = Object.assign({}, sp, { strike: ks, strikeColor: C.red }); }
    const base = rows[r] ?? rowH;
    rows[r] = base * (1 - eIO(sg(k, .5 + i * stag, .82 + i * stag)));
  });
  return SH.sheet(Object.assign({}, so, { cells, fills, rows, renumber: true }), t);
};
/* fillDrag: o = { sheet, from: 'A2:D2', to: 41 (the last row number to fill), values: (rowOffset, col, sourceCell) => cell (default: copies), tip: n => string, hero, keep }. The fill handle is dragged down (the sheet scrolls to
 * follow it), a dashed outline stretches over the cells, a tooltip shows the count, each copy appears with a ripple as the handle passes. Returns { L, handle: {x, y}, count, scrollY }: put the pointer (kind 'cross', press 1) on `handle`. */
SH.fillDrag = (o, u, t = 0) => {
  const so = o.sheet || o, g = range(o.from), last = (o.to ?? o.last) - 1, k = cl(u), e = eIO(k), src = so.cells || {}, L0 = layout(so);
  const y0 = L0.rowStart(g.r1 + 1), y1 = L0.rowStart(last + 1), hy = lp(y0, y1, e), gh = L0.gy1 - L0.gy0;
  const sy = Math.max(so.scroll ? so.scroll[1] || 0 : 0, hy - (gh - 110)), cells = Object.assign({}, src);
  let rowAt = g.r1;
  for (let r = g.r1 + 1; r <= last; r++) if (L0.rowStart(r + 1) <= hy + .01) rowAt = r;
  const inv = x => x < .5 ? Math.sqrt(x / 2) : 1 - Math.sqrt((1 - x) / 2);
  for (let r = g.r1 + 1; r <= rowAt; r++) {
    const ka = y1 > y0 ? inv(cl((L0.rowStart(r + 1) - y0) / (y1 - y0))) : 0;
    for (let c = g.c0; c <= g.c1; c++) {
      const sp0 = normCell(src[refName(c, g.r1)]), sp = o.values ? normCell(o.values(r - g.r1, c, sp0)) : sp0;
      if (sp) cells[refName(c, r)] = Object.assign({}, sp, { pulse: sg(k, ka, ka + .16), pulseColor: C.blue, alpha: sg(k, ka, ka + .06) });
    }
  }
  const done = k >= 1 && !o.keep, ext = refName(g.c0, g.r0) + ':' + refName(g.c1, rowAt);
  const d = Object.assign({}, so, { cells, scroll: [so.scroll ? so.scroll[0] || 0 : 0, sy], sel: done ? ext : o.from, active: refName(g.c0, g.r0), handle: done });
  const L = SH.sheet(d, t), R = L.rect(g.c0, g.r0, g.c1, rowAt), ui = L.ui, count = rowAt - g.r1;
  if (!done && k > 0) {
    ctx.save(); rect(L.gx0, L.gy0, L.gx1 - L.gx0, L.gy1 - L.gy0); ctx.clip();
    ctx.strokeStyle = C.blue; ctx.lineWidth = 3.4 * ui; ctx.setLineDash([12 * ui, 8 * ui]); ctx.lineDashOffset = -t * 40; ctx.strokeRect(R.x, R.y, R.w, R.h); ctx.setLineDash([]);
    const hs = 13 * ui; ctx.fillStyle = C.blue; ctx.fillRect(R.x + R.w - hs / 2, R.y + R.h - hs / 2, hs, hs); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4 * ui; ctx.strokeRect(R.x + R.w - hs / 2, R.y + R.h - hs / 2, hs, hs);
    ctx.restore();
    const label = o.tip ? o.tip(count) : String(count), sz = 24 * ui, w = UI.sizeOf(label, { size: sz, weight: 900 }).w + 34 * ui, h = 40 * ui, tx = Math.min(R.x + R.w + 34 * ui, L.Wd - w - 16 * ui), ty = Math.min(R.y + R.h + 22 * ui, L.gy1 - h - 8 * ui);
    ctx.save(); ctx.shadowColor = 'rgba(20,24,30,.3)'; ctx.shadowBlur = 8 * ui; ctx.shadowOffsetY = 3 * ui; rect(tx, ty, w, h, 10 * ui); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore();
    UI.container('fill:tip', 'pill', [tx, ty, tx + w, ty + h], 4 * ui);
    T(label, tx + w / 2, ty + h / 2, { size: sz, weight: 900, fill: '#fff', hero: !!o.hero, crop: !o.hero, cid: 'fill:tip', center: true });
  }
  return { L, handle: { x: R.x + R.w, y: R.y + R.h }, count, scrollY: sy };
};
/* errorCell(ref, text, u, o): the cell shows a red error value (#N/A, #REF!, #VALUE!) with a corner marker; it shakes as it appears and a tooltip pops out below it. o = { sheet (the layout options), tip, size, hero, dressing }.
 * Draw it over the sheet (call it after SH15.sheet). u: 0 to .45 the shake and the pop, .35 to .62 the tooltip. */
const TIPS = { '#N/A': 'Value not found in table', '#REF!': 'Invalid cell reference', '#VALUE!': 'Wrong type of value', '#NAME?': 'Unknown name', '#DIV/0!': 'Division by zero' };
SH.errorCell = (rf, txt, u, o = {}) => {
  const so = o.sheet || o; MODE.dress = !!(o.dressing ?? so.dressing);
  const L = layout(so), g = range(rf), R = L.rect(g.c0, g.r0, g.c1, g.r1), k = cl(u), ui = L.ui, z = L.z, cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  if (k <= 0) return null;
  ctx.save(); rect(L.gx0, L.gy0, L.gx1 - L.gx0, L.gy1 - L.gy0); ctx.clip();
  const dx = Math.sin(k * 95) * 7 * z * (1 - sg(k, 0, .42)) * sg(k, 0, .04);
  ctx.save(); ctx.translate(dx, 0);
  ctx.fillStyle = C.white; ctx.fillRect(R.x + 1, R.y + 1, R.w - 2, R.h - 2); ctx.fillStyle = rgba(C.red, .1 + .14 * (1 - sg(k, 0, .5))); ctx.fillRect(R.x + 1, R.y + 1, R.w - 2, R.h - 2);
  ctx.strokeStyle = C.red; ctx.lineWidth = 2.6 * ui; ctx.strokeRect(R.x + 1, R.y + 1, R.w - 2, R.h - 2);
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(R.x + 1, R.y + 1); ctx.lineTo(R.x + 1 + 16 * z, R.y + 1); ctx.lineTo(R.x + 1, R.y + 1 + 16 * z); ctx.closePath(); ctx.fill();   /* the corner marker */
  const size = o.size ?? 32 * z, settled = k >= .5, pk = sg(k, 0, .35), sc = 1 + .3 * (1 - eO(pk));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
  T(String(txt), cx, cy, { size, weight: 900, fill: C.red, alpha: sg(k, 0, .08), hero: o.hero !== false && settled, crop: !settled, maxW: R.w - 24 * z });
  ctx.restore(); ctx.restore();
  const tp = sg(k, .35, .62);
  if (tp > 0) {
    const tip = o.tip ?? TIPS[txt] ?? 'Check the formula', ts = 22 * ui, tw = UI.sizeOf(tip, { size: ts, weight: 800 }).w + 84 * ui, th = 54 * ui;
    const tx = Math.min(R.x + 6 * ui, L.Wd - tw - 14 * ui), ty = R.y + R.h + 16 * ui, sc2 = lp(.82, 1, eB(tp));
    ctx.save(); ctx.globalAlpha *= sg(tp, 0, .5); ctx.translate(tx + 20 * ui, ty); ctx.scale(sc2, sc2); ctx.translate(-(tx + 20 * ui), -ty);
    ctx.shadowColor = 'rgba(20,24,30,.35)'; ctx.shadowBlur = 12 * ui; ctx.shadowOffsetY = 4 * ui;
    rect(tx, ty, tw, th, 10 * ui); ctx.fillStyle = C.ink; ctx.fill(); const nx = cl(R.x + 40 * ui, tx + 22 * ui, tx + tw - 40 * ui); ctx.beginPath(); ctx.moveTo(nx - 10 * ui, ty + 1); ctx.lineTo(nx + 4 * ui, ty - 11 * ui); ctx.lineTo(nx + 18 * ui, ty + 1); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(tx + 30 * ui, ty + th / 2, 12 * ui, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; rect(tx + 30 * ui - 1.8 * ui, ty + th / 2 - 6.5 * ui, 3.6 * ui, 8.5 * ui, 1.8 * ui); ctx.fill(); ctx.beginPath(); ctx.arc(tx + 30 * ui, ty + th / 2 + 6.2 * ui, 2.1 * ui, 0, TAU); ctx.fill();
    UI.container('err:tip', 'pill', [tx, ty, tx + tw, ty + th], 4 * ui);
    T(tip, tx + 52 * ui, ty + th / 2, { align: 'left', size: ts, weight: 800, fill: '#fff', hero: !!o.tipHero && tp >= 1, crop: !(o.tipHero && tp >= 1), cid: 'err:tip' });
    ctx.restore();
  }
  ctx.restore();
  return rectOf(R);
};

// ---------------------------------------------------------------- the laggy video call: SH15.call(o, t)
/* o: { w: 1280, h: 720, ui, r, shadow, dressing, hero: ['names', 'chat', 'banner', 'freeze', 'title'] (the parts whose text is hero; default none), title, time (seconds or '00:42'), signal 0..4,
 *      main: { name, draw(rect, tt), color, initials, muted, speaking }, others: [{ name, draw, color, initials, muted, hand, speaking }], freeze: 0..1 (the main picture stops on frozenAt, a spinner and
 *      "Connection unstable" appear), frozenAt, lag: 0..1 (blocky, stuttering pictures), share: { sheet: <sheet options>, label, dressing } (a screen share: the shared sheet fills the stage, the speaker is a thumbnail),
 *      chat: [{ who, text, t0 }], chatOpen, typing, hand (you raised yours), muted ('You are muted' banner), cam, sharing }.
 * Tile pictures are drawn by the callbacks in the call's local frame (clipped to the tile); lag stutters their time and pixelates them. Returns { main, strip: [rects], share, chat, controls }. */
const CC = { bg: '#12161b', panel: '#1b2027', tile: '#262d36', line: '#323a45', txt: '#eef1f4', mute: '#9aa3ad', green: '#2fd27a', red: '#ff5a4d', amber: '#ffbf1f' };
const LAGCV = document.createElement('canvas'); LAGCV.__txOK = true;
function lagPicture(r, draw, lag, tt) {
  const f = 1 + lag * 9, sw = Math.max(8, Math.ceil(r.w / f)), sh = Math.max(8, Math.ceil(r.h / f));
  LAGCV.width = sw; LAGCV.height = sh;
  const g = LAGCV.getContext('2d'), prev = ctx;
  g.setTransform(sw / r.w, 0, 0, sh / r.h, -r.x * sw / r.w, -r.y * sh / r.h);
  ctx = g;
  try { draw(r, tt); } finally { ctx = prev; }
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(LAGCV, 0, 0, sw, sh, r.x, r.y, r.w, r.h); ctx.restore();
}
function micIcon(cx, cy, s, off, col) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  rect(-5, -13, 10, 18, 5); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 10, 0.15 * Math.PI, .85 * Math.PI); ctx.stroke(); ln(0, 10, 0, 15); ln(-5, 15, 5, 15);
  if (off) { ctx.strokeStyle = CC.red; ctx.lineWidth = 3.6; ln(-12, -13, 12, 15); }
  ctx.restore();
}
function handIcon(cx, cy, s, col, wave) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(wave || 0); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
  [[-8.5, 14], [-3, 19], [2.5, 18], [8, 13]].forEach(([x, h]) => { rect(x - 2.4, -h + 3, 4.8, h, 2.4); ctx.fill(); });
  rect(-11, 0, 22, 16, 7); ctx.fill(); ctx.lineWidth = 4.6; ln(-9, 7, -15, 1); ctx.restore();
}
function pillT(txt, cx, cy, size, bg, ink, hero, id, weight) {
  const w = UI.sizeOf(txt, { size, weight: weight || 800 }).w + size * 1.3, h = size * 1.9;
  rect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  UI.container(id, 'pill', [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], 2);
  return T(txt, cx, cy, { size, weight: weight || 800, fill: ink, hero, crop: !hero, cid: id, center: true });
}
SH.call = (o, t = 0) => {
  o = o || {};
  const prevDress = MODE.dress; MODE.dress = !!o.dressing;
  const Wd = o.w ?? 1280, Hd = o.h ?? 720, ui = o.ui ?? 1, hs = new Set(o.hero === true ? ['names', 'chat', 'banner', 'freeze', 'title'] : o.hero || []);
  const lag = cl(o.lag || 0), fr = o.freeze === true ? 1 : cl(o.freeze || 0), tt = lag > 0 ? Math.floor(t * (12 - 8 * lag)) / (12 - 8 * lag) : t;
  const top = 60 * ui, bot = 84 * ui, m = 16 * ui, sx = m, sy = top + 12 * ui, sh = Hd - top - bot - 24 * ui, chatW = 360 * ui, stripW = 300 * ui;
  ctx.save();
  if (o.r ?? 18) { if (o.shadow) { ctx.save(); ctx.shadowColor = C.shadow; ctx.shadowBlur = o.shadow; ctx.shadowOffsetY = o.shadow / 3; rect(0, 0, Wd, Hd, o.r ?? 18); ctx.fillStyle = CC.bg; ctx.fill(); ctx.restore(); } rect(0, 0, Wd, Hd, o.r ?? 18); ctx.clip(); }
  ctx.fillStyle = CC.bg; ctx.fillRect(0, 0, Wd, Hd);
  /* top bar: a camera glyph, the title, the clock with a blinking REC dot, the signal bars */
  const ty = top / 2 + 2 * ui;
  rect(m + 4 * ui, ty - 13 * ui, 30 * ui, 26 * ui, 6 * ui); ctx.fillStyle = CC.green; ctx.fill(); ctx.beginPath(); ctx.moveTo(m + 38 * ui, ty - 6 * ui); ctx.lineTo(m + 50 * ui, ty - 12 * ui); ctx.lineTo(m + 50 * ui, ty + 12 * ui); ctx.lineTo(m + 38 * ui, ty + 6 * ui); ctx.closePath(); ctx.fill();
  T(o.title ?? 'Greenleaf All-Hands', m + 64 * ui, ty, { align: 'left', size: 24 * ui, weight: 800, fill: CC.txt, hero: hs.has('title'), crop: !hs.has('title'), maxW: Wd * .5 });
  const sig = o.signal ?? (fr > 0 || lag > .5 ? 1 : 4);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i < sig ? (sig <= 1 ? CC.red : sig <= 2 ? CC.amber : CC.green) : CC.line; rect(Wd - m - 52 * ui + i * 13 * ui, ty + 12 * ui - (8 + i * 6) * ui, 9 * ui, (8 + i * 6) * ui, 2 * ui); ctx.fill(); }
  const clock = typeof o.time === 'number' ? String(Math.floor(o.time / 60)).padStart(2, '0') + ':' + String(Math.floor(o.time % 60)).padStart(2, '0') : (o.time ?? '00:42');
  const cb = T(clock, Wd - m - 78 * ui, ty, { align: 'right', size: 22 * ui, weight: 800, fill: CC.mute });
  if (Math.floor(t * 1.6) % 2 === 0) { ctx.fillStyle = CC.red; ctx.beginPath(); ctx.arc(cb.x0 - 18 * ui, ty, 6 * ui, 0, TAU); ctx.fill(); }
  /* the stage */
  const chat = !!o.chatOpen, others = o.others || [], main = o.main || { name: 'Speaker' };
  const sw = Wd - 2 * m - (chat ? chatW + m : others.length ? stripW + m : 0), mainR = { x: sx, y: sy, w: sw, h: sh };
  const tileDraw = (r, p, big, tfrozen) => {
    ctx.save(); rect(r.x, r.y, r.w, r.h, 14 * ui); ctx.clip();
    ctx.fillStyle = p.color ?? CC.tile; ctx.fillRect(r.x, r.y, r.w, r.h);
    const tm = tfrozen != null ? tfrozen : tt;
    if (p.draw) { if (lag > 0 || tfrozen != null) lagPicture(r, p.draw, tfrozen != null ? Math.max(lag, .25) : lag, tm); else p.draw(r, tm); }
    else { const R2 = Math.min(r.w, r.h) * .22; ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2, R2, 0, TAU); ctx.fill(); T(p.initials ?? (p.name || '?').slice(0, 2).toUpperCase(), r.x + r.w / 2, r.y + r.h / 2, { size: R2 * .95, weight: 900, fill: '#fff', hero: false, crop: true }); }
    ctx.restore();
    if (p.speaking) { rect(r.x + 2 * ui, r.y + 2 * ui, r.w - 4 * ui, r.h - 4 * ui, 13 * ui); ctx.strokeStyle = rgba(CC.green, .6 + .4 * Math.sin(t * 7)); ctx.lineWidth = 4 * ui; ctx.stroke(); }
    const nm = p.name || '', sz = (big ? 22 : 17) * ui, nw = UI.sizeOf(nm, { size: sz, weight: 800 }).w + (p.muted ? 56 : 30) * ui, nh = sz * 1.9, nx = r.x + 12 * ui, ny = r.y + r.h - nh - 12 * ui;
    rect(nx, ny, nw, nh, nh / 2); ctx.fillStyle = 'rgba(10,12,16,.72)'; ctx.fill();
    UI.container('call:' + nm + r.x, 'pill', [nx, ny, nx + nw, ny + nh], 2);
    T(nm, nx + 15 * ui, ny + nh / 2, { align: 'left', size: sz, weight: 800, fill: CC.txt, hero: hs.has('names') && big, crop: !(hs.has('names') && big) });
    if (p.muted) micIcon(nx + nw - 20 * ui, ny + nh / 2, .5 * ui * (big ? 1.2 : 1), true, CC.txt);
    if (p.hand) { const wv = Math.sin(t * 6) * .22; ctx.beginPath(); ctx.arc(r.x + r.w - 30 * ui, r.y + 30 * ui, 20 * ui, 0, TAU); ctx.fillStyle = CC.amber; ctx.fill(); handIcon(r.x + r.w - 30 * ui, r.y + 31 * ui, .62 * ui, '#2a2410', wv); }
  };
  const strip = [];
  if (o.share) {   /* the screen share: the shared sheet fills the stage, the speaker is a small picture in the corner */
    const so = o.share.sheet || {}, ow = so.w ?? 1280, oh = so.h ?? 720, k = Math.min(mainR.w / ow, mainR.h / oh), px = mainR.x + (mainR.w - ow * k) / 2, py = mainR.y + (mainR.h - oh * k) / 2;
    ctx.save(); rect(mainR.x, mainR.y, mainR.w, mainR.h, 14 * ui); ctx.fillStyle = '#0c0f12'; ctx.fill(); ctx.clip();
    ctx.translate(px, py); ctx.scale(k, k); SH.sheet(Object.assign({}, so, { dressing: o.share.dressing !== false }), t); ctx.restore();
    pillT(o.share.label ?? (main.name || 'Presenter') + ' is presenting', mainR.x + 28 * ui + 150 * ui, mainR.y + 30 * ui, 18 * ui, 'rgba(10,12,16,.78)', CC.txt, false, 'call:share');
    const tw = 250 * ui, th = tw * 9 / 16, r2 = { x: mainR.x + mainR.w - tw - 14 * ui, y: mainR.y + mainR.h - th - 14 * ui, w: tw, h: th };
    tileDraw(r2, Object.assign({}, main, { speaking: main.speaking }), false, fr > 0 ? o.frozenAt ?? 0 : null);
    strip.push(r2);
  } else {
    tileDraw(mainR, main, true, fr > 0 ? o.frozenAt ?? 0 : null);
    if (fr > 0) {   /* the frozen picture: dimmed, a spinner, "Connection unstable" */
      ctx.save(); rect(mainR.x, mainR.y, mainR.w, mainR.h, 14 * ui); ctx.clip(); ctx.fillStyle = `rgba(8,10,14,${.42 * fr})`; ctx.fillRect(mainR.x, mainR.y, mainR.w, mainR.h);
      for (let i = 0; i < 4; i++) { const gy = mainR.y + ((Math.floor(t * 9) * 97 + i * 151) % Math.max(10, mainR.h - 20)), gh = (3 + (i * 7) % 8) * ui; ctx.fillStyle = `rgba(255,255,255,${.07 * fr})`; ctx.fillRect(mainR.x, gy, mainR.w, gh); }
      ctx.restore();
      const cx = mainR.x + mainR.w / 2, cy = mainR.y + mainR.h / 2 - 20 * ui;
      ctx.save(); ctx.globalAlpha *= fr; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - t * 7.5, al = ((i / 12 - t * 1.2) % 1 + 1) % 1; ctx.fillStyle = rgba('#ffffff', .15 + .85 * (1 - al)); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 30 * ui, cy + Math.sin(a) * 30 * ui, 4.6 * ui, 0, TAU); ctx.fill(); }
      pillT('Connection unstable', cx, cy + 74 * ui, 26 * ui, 'rgba(10,12,16,.82)', '#fff', hs.has('freeze') && fr >= 1, 'call:freeze'); ctx.restore();
    }
  }
  others.forEach((p, i) => { if (chat) return; const th = (sh - 2 * 12 * ui) / 3, r = { x: sx + sw + m, y: sy + i * (th + 12 * ui), w: stripW, h: th }; if (i < 3) { tileDraw(r, p, false, null); strip.push(r); } });
  /* the chat panel */
  const chR = { x: Wd - m - chatW, y: sy, w: chatW, h: sh };
  if (chat) {
    rect(chR.x, chR.y, chR.w, chR.h, 14 * ui); ctx.fillStyle = CC.panel; ctx.fill();
    T('Chat', chR.x + 20 * ui, chR.y + 30 * ui, { align: 'left', size: 22 * ui, weight: 900, fill: CC.txt, hero: hs.has('chat'), crop: !hs.has('chat') });
    hline(chR.x, chR.x + chR.w, chR.y + 58 * ui, CC.line, 2);
    const msgs = (o.chat || []).filter(q => t >= q.t0), size = 20 * ui, bw = chR.w - 32 * ui, areaY = chR.y + 70 * ui, areaH = chR.h - 70 * ui - 76 * ui;
    const blocks = msgs.map(q => { const ls = UI.wrap(q.text, bw - 28 * ui, { size, weight: 600 }); return { q, ls, h: 34 * ui + ls.length * size * 1.3 + 14 * ui }; });
    const total = blocks.reduce((a, b) => a + b.h + 10 * ui, 0), off = Math.max(0, total - areaH);
    ctx.save(); rect(chR.x, areaY, chR.w, areaH); ctx.clip();
    let y = areaY - off;
    blocks.forEach(b => {
      const k = eO(sg(t - b.q.t0, 0, .3)), yy = y + (1 - k) * 18 * ui;
      ctx.save(); ctx.globalAlpha *= k; rect(chR.x + 16 * ui, yy, bw, b.h, 12 * ui); ctx.fillStyle = '#2a313a'; ctx.fill();
      const hue = ['#7be0d0', '#ffb36b', '#c9b8ff', '#ff9db1'][Math.abs((b.q.who || '').length) % 4];
      T(b.q.who || '', chR.x + 30 * ui, yy + 18 * ui, { align: 'left', size: 17 * ui, weight: 900, fill: hue, hero: false, crop: true });
      UI.lines(b.ls.map(l => ({ t: l })), chR.x + 30 * ui, yy + 34 * ui, opt({ size, weight: 600, fill: CC.txt, v: 'top', lh: 1.3, align: 'left', hero: hs.has('chat') && k >= 1, crop: !(hs.has('chat') && k >= 1) }));
      ctx.restore(); y += b.h + 10 * ui;
    });
    ctx.restore();
    rect(chR.x + 16 * ui, chR.y + chR.h - 62 * ui, chR.w - 32 * ui, 46 * ui, 23 * ui); ctx.fillStyle = '#2a313a'; ctx.fill();
    T(o.typing ? 'typing' + '.'.repeat(1 + Math.floor(t * 3) % 3) : 'Message everyone', chR.x + 36 * ui, chR.y + chR.h - 39 * ui, { align: 'left', size: 18 * ui, weight: 700, fill: CC.mute, hero: false, crop: true });
  }
  /* the control bar */
  const cy = Hd - bot / 2, bs = 52 * ui, items = [['mic', o.muted], ['cam', o.cam === false], ['share', !!o.sharing || !!o.share], ['chat', chat], ['hand', !!o.hand]];
  const gx0 = Wd / 2 - (items.length * 70 * ui + 14 * ui + 124 * ui) / 2;
  items.forEach(([id, on], i) => {
    const x = gx0 + i * 70 * ui + 35 * ui;
    ctx.beginPath(); ctx.arc(x, cy, bs / 2, 0, TAU); ctx.fillStyle = id === 'hand' && on ? CC.amber : id === 'share' && on ? CC.green : id === 'mic' && on ? '#3a2326' : '#2a313a'; ctx.fill();
    ctx.strokeStyle = CC.txt; ctx.fillStyle = CC.txt; ctx.lineWidth = 3 * ui; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (id === 'mic') micIcon(x, cy, .9 * ui, o.muted, CC.txt);
    else if (id === 'cam') { rect(x - 13 * ui, cy - 8 * ui, 18 * ui, 16 * ui, 4 * ui); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 8 * ui, cy - 3 * ui); ctx.lineTo(x + 15 * ui, cy - 7 * ui); ctx.lineTo(x + 15 * ui, cy + 7 * ui); ctx.lineTo(x + 8 * ui, cy + 3 * ui); ctx.closePath(); ctx.fill(); }
    else if (id === 'share') { rect(x - 13 * ui, cy - 9 * ui, 26 * ui, 17 * ui, 3 * ui); ctx.strokeStyle = on ? '#0a1f12' : CC.txt; ctx.stroke(); ln(x, cy + 8 * ui, x, cy + 13 * ui); ln(x - 6 * ui, cy + 13 * ui, x + 6 * ui, cy + 13 * ui); }
    else if (id === 'chat') { rect(x - 13 * ui, cy - 11 * ui, 26 * ui, 19 * ui, 5 * ui); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 4 * ui, cy + 8 * ui); ctx.lineTo(x - 7 * ui, cy + 14 * ui); ctx.lineTo(x + 3 * ui, cy + 8 * ui); ctx.stroke(); if (!chat && (o.chat || []).some(q => t >= q.t0 && t < q.t0 + 3)) { ctx.fillStyle = CC.red; ctx.beginPath(); ctx.arc(x + 14 * ui, cy - 14 * ui, 6 * ui, 0, TAU); ctx.fill(); } }
    else handIcon(x, cy + 1 * ui, .85 * ui, on ? '#2a2410' : CC.txt, on ? Math.sin(t * 6) * .2 : 0);
  });
  const lx = gx0 + items.length * 70 * ui + 14 * ui + 62 * ui;
  rect(lx - 62 * ui, cy - bs / 2, 124 * ui, bs, bs / 2); ctx.fillStyle = CC.red; ctx.fill();
  ctx.save(); ctx.translate(lx, cy); ctx.rotate(2.36); ctx.scale(ui, ui); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(0, -12, 14, 4); ctx.stroke(); ctx.restore();
  if (o.muted) pillT('You are muted', Wd / 2, Hd - bot - 4 * ui, 20 * ui, 'rgba(10,12,16,.86)', CC.txt, hs.has('banner'), 'call:muted');
  ctx.restore();
  MODE.dress = prevDress;
  return { main: mainR, strip, share: o.share ? mainR : null, chat: chat ? chR : null };
};

// ---------------------------------------------------------------- Binder's chat bubble: SH15.binder(o, t)
/* o: { at: [x, y] (the bubble's top-left), w: 640, s (scale), tail: [x, y] (the point the tail aims at: the mascot's mouth), text, typed: 0..1, thinking, buttons: [{ id: 'yes', t: 'Yes please' }, { id: 'no', t: 'No thanks' }],
 *      runaway: 0..1 ("No thanks" hops away from the pointer: runPath: [[dx, dy], ...] offsets from home), press: { id, k }, pop: 0..1 (the bubble grows out of its tail), name, size, hero, dressing }.
 * The mascot is drawn by the caller (A15.binder through drawChar). Returns { rect, tail, yes, no (its current rect), textBox }. */
function binderGeom(o) {
  const s = o.s ?? 1, w = (o.w ?? 640) * s, pad = 30 * s, size = (o.size ?? 34) * s, x = o.at ? o.at[0] : 0, y = o.at ? o.at[1] : 0;
  const text = o.text ?? "It looks like you're merging two facilities. Would you like help?";
  const lines = UI.wrap(text, w - 2 * pad, { size, weight: 700 }), pitch = size * 1.32, headH = 44 * s, btns = o.buttons || [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }];
  const bh = 62 * s, gap = 22 * s, bw = btns.length ? Math.min(270 * s, (w - 2 * pad - gap * (btns.length - 1)) / btns.length) : 0;
  const h = pad * .8 + headH + lines.length * pitch + (btns.length ? 26 * s + bh + pad * .85 : pad * .5);
  const by = y + h - pad * .85 - bh, rects = btns.map((b, i) => Object.assign({}, b, { x: x + pad + i * (bw + gap), y: by, w: bw, h: bh }));
  return { s, x, y, w, h, pad, size, text, lines, pitch, headH, btns: rects, rect: { x, y, w, h }, textTop: y + pad * .8 + headH };
}
function binderClip(cx, cy, s) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#5b6470'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(-13, -17, -3, -17); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, -3); ctx.quadraticCurveTo(13, -17, 3, -17); ctx.stroke();
  ctx.fillStyle = '#22262b'; ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(13, -4); ctx.lineTo(16, 12); ctx.lineTo(-16, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, 3, 3.6, 0, TAU); ctx.arc(5, 3, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#22262b'; ctx.beginPath(); ctx.arc(-4.4, 3.4, 1.6, 0, TAU); ctx.arc(5.6, 3.4, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
}
SH.binderRect = (o, id) => { const g = binderGeom(o || {}); return id ? g.btns.find(b => b.id === id) || null : g.rect; };
SH.binder = (o, t = 0) => {
  o = o || {};
  const prevDress = MODE.dress; MODE.dress = !!o.dressing;
  const g = binderGeom(o), s = g.s, k = o.pop == null ? 1 : cl(o.pop), tail = o.tail || [g.x - 60 * s, g.y + g.h - 20 * s], typed = o.typed == null ? 1 : cl(o.typed);
  if (k <= 0) { MODE.dress = prevDress; return g; }
  const hero = k >= 1 && o.hero !== false && !MODE.dress;
  ctx.save();
  ctx.translate(tail[0], tail[1]); const sc = lp(.55, 1, eB(k)); ctx.scale(sc, sc); ctx.translate(-tail[0], -tail[1]); ctx.globalAlpha *= sg(k, 0, .35);
  /* the tail: from the nearest edge toward the mascot */
  const cx = g.x + g.w / 2, cy = g.y + g.h / 2, dxT = tail[0] - cx, dyT = tail[1] - cy, horiz = Math.abs(dxT) / g.w > Math.abs(dyT) / g.h;
  const half = 24 * s, px = cl(tail[0], g.x + 56 * s, g.x + g.w - 56 * s), py = cl(tail[1], g.y + 56 * s, g.y + g.h - 56 * s);
  const base = horiz ? (dxT < 0 ? [[g.x, py - half], [g.x, py + half]] : [[g.x + g.w, py - half], [g.x + g.w, py + half]]) : (dyT < 0 ? [[px - half, g.y], [px + half, g.y]] : [[px - half, g.y + g.h], [px + half, g.y + g.h]]);
  const inward = horiz ? [dxT < 0 ? 3 : -3, 0] : [0, dyT < 0 ? 3 : -3];
  ctx.save(); ctx.shadowColor = 'rgba(20,24,30,.3)'; ctx.shadowBlur = 24 * s; ctx.shadowOffsetY = 8 * s; ctx.fillStyle = C.white;
  rect(g.x, g.y, g.w, g.h, 26 * s); ctx.fill(); ctx.restore();
  rect(g.x, g.y, g.w, g.h, 26 * s); ctx.strokeStyle = C.grid; ctx.lineWidth = 2.6 * s; ctx.stroke();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(base[0][0] + inward[0], base[0][1] + inward[1]); ctx.lineTo(tail[0], tail[1]); ctx.lineTo(base[1][0] + inward[0], base[1][1] + inward[1]); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.grid; ctx.lineWidth = 2.6 * s; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(base[0][0], base[0][1]); ctx.lineTo(tail[0], tail[1]); ctx.lineTo(base[1][0], base[1][1]); ctx.stroke();
  /* nameplate, text typed out, buttons */
  binderClip(g.x + g.pad + 14 * s, g.y + g.pad * .8 + g.headH / 2 - 2 * s, s * .9);
  T(o.name ?? 'Binder', g.x + g.pad + 40 * s, g.y + g.pad * .8 + g.headH / 2, { align: 'left', size: 24 * s, weight: 900, fill: C.ink, hero: false, crop: !hero });
  if (typed <= 0 && o.thinking) { for (let i = 0; i < 3; i++) { const b = Math.sin(t * 8 - i * 1.1); ctx.fillStyle = C.soft; ctx.beginPath(); ctx.arc(g.x + g.pad + 18 * s + i * 30 * s, g.textTop + g.size * .5 - b * 5 * s, 7 * s, 0, TAU); ctx.fill(); } }
  else {
    const n = g.lines.reduce((a, l) => a + l.length, 0), shown = typed >= 1 ? n : Math.ceil(n * typed);
    let off = 0;
    const arr = g.lines.map(l => { const r = typed >= 1 ? 1 : cl((shown - off) / l.length); off += l.length; return { t: l, reveal: r }; });
    UI.container('binder:text', 'panel', [g.x, g.y, g.x + g.w, g.y + g.h], 6 * s);
    UI.lines(arr, g.x + g.pad, g.textTop, opt({ size: g.size, weight: 700, fill: C.ink, v: 'top', lh: 1.32, align: 'left', hero, crop: !hero, cid: 'binder:text' }));
  }
  const press = o.press && typeof o.press === 'object' ? o.press : null, RP = o.runPath || [[0, 0], [190, 36], [24, 150], [-190, 112]];
  g.btns.forEach(b => {
    let bx = b.x, by = b.y, sx = 1, sy = 1, moving = false;
    const isNo = b.id === 'no' || b.id === o.runner;
    if (isNo && o.runaway > 0) {   /* hops away from the pointer: three jumps along runPath, each with an arc and a squash */
      const u = cl(o.runaway), nHop = RP.length - 1, i = Math.min(nHop - 1, Math.floor(u * nHop)), kk = eIO(sg(u, i / nHop, (i + 1) / nHop)), a = RP[i], c = RP[i + 1];
      bx += lp(a[0], c[0], kk) * s; by += lp(a[1], c[1], kk) * s - Math.sin(Math.PI * kk) * 52 * s; sx = 1 + .1 * Math.sin(Math.PI * kk); sy = 1 - .06 * Math.sin(Math.PI * kk); moving = u < 1 && kk > 0 && kk < 1;
    }
    const pr = press && press.id === b.id ? cl(press.k) : 0, on = b.def || b.id === 'yes', id = 'binder:' + b.id, bhero = hero && !moving && (!isNo || o.runaway == null || o.runaway <= 0 || o.runaway >= 1);
    ctx.save(); ctx.translate(bx + b.w / 2, by + b.h / 2 + 2.5 * s * pr); ctx.scale(sx, sy); ctx.translate(-(bx + b.w / 2), -(by + b.h / 2));
    if (!pr) { ctx.shadowColor = 'rgba(20,24,30,.2)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 3 * s; }
    rect(bx, by, b.w, b.h, 16 * s); ctx.fillStyle = on ? mixc(C.green, '#14683f', pr) : mixc('#eceef1', '#dfe3e8', pr); ctx.fill(); ctx.shadowColor = 'transparent';
    if (!on) { ctx.strokeStyle = C.grid; ctx.lineWidth = 2.2 * s; ctx.stroke(); }
    UI.container(id, 'button', [bx, by, bx + b.w, by + b.h], 6 * s);
    T(b.t, bx + b.w / 2, by + b.h / 2, { size: 32 * s, weight: 900, fill: on ? '#fff' : '#8a929c', hero: bhero, crop: !bhero, cid: id, center: true, maxW: b.w - 20 * s });
    ctx.restore();
    if (b.id === 'no' || b.id === o.runner) g.no = { x: bx, y: by, w: b.w, h: b.h };
    if (b.id === 'yes') g.yes = { x: bx, y: by, w: b.w, h: b.h };
  });
  ctx.restore();
  MODE.dress = prevDress;
  g.tail = tail;
  return g;
};

// ---------------------------------------------------------------- small helpers: typed(n, len) and keys(): a shortcut as pressed key caps (Ctrl + Z)
/* typed(n, len): the `typed` value that shows exactly n letters of a string of len letters (UI's reveal rounds up, so a plain n / len can show one letter too many) */
SH.typed = (n, len) => len <= 0 || n >= len ? 1 : n <= 0 ? 0 : (n - .5) / len;
/* keys(keys, cx, cy, o): key caps side by side with '+' between them, centred on (cx, cy). o: { size: 36, press: 0..1 | [per key], hero: true, gap, dressing }. A pressed cap sinks and darkens. Returns { x0, y0, x1, y1, caps: [rects] }. */
SH.keys = (keys, cx, cy, o = {}) => {
  const prevDress = MODE.dress; MODE.dress = !!o.dressing;
  const size = o.size ?? 36, h = size * 2.3, gap = o.gap ?? size * 1.25, hero = o.hero !== false, ws = keys.map(k => Math.max(size * 2.4, UI.sizeOf(String(k), { size, weight: 900 }).w + size * 1.5));
  const total = ws.reduce((a, w) => a + w, 0) + gap * (keys.length - 1);
  let x = cx - total / 2;
  const caps = [];
  keys.forEach((k, i) => {
    const pr = cl(Array.isArray(o.press) ? o.press[i] || 0 : o.press || 0), w = ws[i], y = cy - h / 2 + pr * size * .28, lip = size * .3 * (1 - pr * .6);
    ctx.save();
    if (!pr) { ctx.shadowColor = 'rgba(20,24,30,.3)'; ctx.shadowBlur = size * .4; ctx.shadowOffsetY = size * .16; }
    rect(x, y, w, h, size * .35); ctx.fillStyle = mixc('#b8bec6', '#9aa1ab', pr); ctx.fill(); ctx.restore();
    rect(x, y, w, h - lip, size * .35); ctx.fillStyle = mixc('#ffffff', '#e4e8ed', pr); ctx.fill(); ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
    const id = 'key:' + i + ':' + k;
    UI.container(id, 'button', [x, y, x + w, y + h - lip], size * .15);
    T(String(k), x + w / 2, y + (h - lip) / 2, { size, weight: 900, fill: C.ink, hero: hero, crop: !hero, cid: id, center: true });
    caps.push({ x, y, w, h });
    x += w;
    if (i < keys.length - 1) { T('+', x + gap / 2, cy, { size: size * .9, weight: 900, fill: o.plus || '#fff', stroke: o.plusStroke, lw: o.plusStroke ? size * .2 : 0, hero: false, crop: true }); x += gap; }
  });
  MODE.dress = prevDress;
  return { x0: cx - total / 2, y0: cy - h / 2, x1: cx + total / 2, y1: cy + h / 2, caps };
};

/* @@END@@ */
})();
