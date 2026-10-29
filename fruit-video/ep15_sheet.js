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
 *   SH15.cellRect(ref, o), SH15.colX(col, o), SH15.rowY(row, o), SH15.buttonRect(id, o), SH15.dialogRect(o, what)   layout queries (sheet-local)
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
const hex2rgb = h => { h = String(h); if (h[0] !== '#') return [0, 0, 0]; const n = parseInt(h.length === 4 ? h.slice(1).replace(/./g, '$&$&') : h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, k) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${Math.round(lp(A[0], B[0], k))},${Math.round(lp(A[1], B[1], k))},${Math.round(lp(A[2], B[2], k))})`; };
const rgba = (c, a) => { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; };
const rect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r || 0); };

// ---------------------------------------------------------------- text: one place decides hero / crop (dressing turns everything into set dressing)
const MODE = { dress: false };
function opt(o) {
  if (MODE.dress && o.hero !== true) { o.hero = false; o.crop = true; }
  else if (o.hero === undefined) o.hero = false;
  return o;
}
const T = (s, cx, cy, o) => UI.label(s, cx, cy, opt(o));
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
  L.vc = vc; L.vr = vr;
  return L;
}
SH.layout = layout;

// ---------------------------------------------------------------- original vector icons (a 56 x 56 box centred on the origin; no text, no real product's shapes)
const head = (x, y, ang, s = 9) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 1.2, -s * .78); ctx.lineTo(-s * 1.2, s * .78); ctx.closePath(); ctx.fill(); ctx.restore(); };
const ln = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
const box = (x, y, w, h, r, fill) => { rect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.stroke(); };
const ICON = {
  merge() { box(-27, -15, 19, 30, 5, '#fff'); box(8, -15, 19, 30, 5, '#fff'); ctx.strokeStyle = C.green; ctx.fillStyle = C.green; ctx.lineWidth = 4; ln(-21, 0, -9, 0); ln(21, 0, 9, 0); head(-1.5, 0, 0, 9); head(1.5, 0, Math.PI, 9); },
  find() { ctx.beginPath(); ctx.arc(-5, -5, 15, 0, TAU); ctx.fillStyle = rgba(C.blue, .14); ctx.fill(); ctx.stroke(); ctx.lineWidth = 7.5; ctx.strokeStyle = C.green; ln(6, 6, 22, 22); },
  dupes() { box(-25, -23, 42, 11, 3, '#fff'); box(-25, -6, 42, 11, 3, C.amberSoft); box(-25, 11, 42, 11, 3, '#fff'); ctx.strokeStyle = C.red; ctx.lineWidth = 5; ln(8, -2, 24, 14); ln(24, -2, 8, 14); },
  fill() { box(-20, -24, 28, 28, 4, '#fff'); ctx.fillStyle = C.green; ctx.strokeStyle = C.green; ctx.lineWidth = 3.4; rect(3, -1, 10, 10, 2); ctx.fill(); ln(8, 12, 8, 17); ctx.fillStyle = C.green; head(8, 25, Math.PI / 2, 8); },
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
    g.slice(1).forEach(([id, label]) => { items.push({ id, label, group: g[0], x, y: y0 + 10 * ui, w: bw, h: 134 * ui, cx: x + bw / 2, cy: y0 + 10 * ui + 67 * ui, ix: x + bw / 2, iy: y0 + 10 * ui + 36 * ui }); x += bw; });
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
  ctx.fillStyle = C.white; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + h - .75, C.grid, 1.5);
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
  hline(0, L.Wd, y0 + h - .75, C.grid, 1.5);
}
function drawRibbon(L, o) {
  const [y0, h] = L.ribbon;
  if (!h) return;
  const ui = L.ui, rb = L.ribbonOpt, tab = rb.tab || 'Home', lay = ribbonLayout(L, tab), hot = rb.hot, hk = rb.hotK ?? 1, pr = cl(rb.press || 0);
  ctx.fillStyle = C.head; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + h - .75, C.grid, 1.5);
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
  ctx.fillStyle = C.white; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + h - .75, C.grid, 1.5);
  const nb = { x: 14 * ui, w: 128 * ui, h: 38 * ui };
  rect(nb.x, cy - nb.h / 2, nb.w, nb.h, 8 * ui); ctx.fillStyle = C.head; ctx.fill(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1.5; ctx.stroke();
  T(o.nameBox ?? act, nb.x + nb.w / 2, cy, { size: 22 * ui, weight: 900, fill: C.ink, maxW: nb.w - 20 * ui });
  const fxX = nb.x + nb.w + 30 * ui;
  T('fx', fxX, cy, { size: 26 * ui, weight: 900, italic: true, fill: C.green });
  const bx = fxX + 34 * ui, bw = L.Wd - bx - 14 * ui, bh = 38 * ui;
  rect(bx, cy - bh / 2, bw, bh, 8 * ui); ctx.fillStyle = C.white; ctx.fill(); ctx.strokeStyle = C.grid; ctx.lineWidth = 1.5; ctx.stroke();
  let f = o.formula;
  if (f == null) { const sp = o.cells && normCell(o.cells[act]); f = sp ? (sp.f ?? cellStr(sp)) : ''; }
  const txt = f && typeof f === 'object' ? String(f.text ?? '') : String(f), k = f && typeof f === 'object' && f.typed != null ? cl(f.typed) : 1;
  if (txt) {
    const size = 24 * ui, tx = bx + 16 * ui, n = k >= 1 ? txt.length : Math.floor(txt.length * k);
    T(txt, tx, cy, { align: 'left', size, weight: 700, fill: C.ink, reveal: k, maxW: bw - 32 * ui });
    if (k < 1 || (f && f.caret)) { const blink = k < 1 || Math.floor((t || 0) * 2.2) % 2 === 0; if (blink) { ctx.fillStyle = C.blue; ctx.fillRect(caretX(txt, tx, txt.slice(0, n), size, 700) + 1.5, cy - size * .62, 2.6 * ui, size * 1.24); } }
  }
}
function drawSheetTabs(L, o) {
  const [y0, h] = L.stabs;
  if (!h) return;
  const ui = L.ui, cy = y0 + h / 2, tabs = o.tabs || ['Sheet1', 'Staff', 'Policies'], act = o.tab ?? tabs[0];
  ctx.fillStyle = C.head; ctx.fillRect(0, y0, L.Wd, h); hline(0, L.Wd, y0 + .75, C.grid, 1.5);
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
function fitText(str, avail, size, weight, font) {
  const f = UI.fit(str, avail, { size, weight, font, min: size * .64, quiet: true });
  if (!f.overflow) return { str, size: f.size };
  const iw = s => { const m = meas(s, f.size, font || 'Nunito', weight, false, 0); return m.r - m.l; };
  let n = str.length;
  while (n > 1 && iw(str.slice(0, n).trimEnd() + '…') > avail) n--;
  return { str: str.slice(0, n).trimEnd() + '…', size: f.size, cut: true };
}
function drawCellText(L, x, y, w, h, sp, id) {
  const z = L.z, fl = sp.flip;
  let str = cellStr(sp);
  if (fl && fl.u != null && fl.u <= 0 && fl.from != null) str = String(fl.from);
  if (!str) return null;
  const err = isErr(sp.v), font = sp.font || 'Nunito', pad = (sp.pad ?? 12) * z, size = (sp.size ?? 26) * z, weight = wOfFont(font, sp.weight ?? (sp.bold || err ? 900 : 600));
  const align = sp.align ?? (err ? 'center' : typeof sp.v === 'number' ? 'right' : 'left');
  const fade = sg(h, size * .9, size * 1.5);
  if (fade <= .02) return null;
  const ft = fitText(str, w - 2 * pad, size, weight, font);
  const cx = align === 'left' ? x + pad : align === 'right' ? x + w - pad : x + w / 2, cy = y + h / 2 + (sp.dy || 0) * z;
  const hero = sp.hero === true && fade >= 1;
  const base = { align, size: ft.size, weight, font, fill: sp.color ?? (err ? C.red : C.ink), italic: !!sp.italic, alpha: fade * (sp.alpha ?? 1), hero, spacing: (sp.spacing || 0) * z };
  if (sp.stroke) { base.stroke = sp.stroke; base.lw = (sp.lw ?? 6) * z; }
  let box;
  if (fl && fl.from != null && fl.u > 0 && fl.u < 1) box = SH.flipText(String(fl.from), ft.str, fl.u, Object.assign(base, { cx, cy, hero: false, crop: true, maxW: w - 2 * pad }));
  else {
    if (hero && id) { UI.container(id, 'cell', [x, y, x + w, y + h], 4 * z); base.cid = id; base.center = align === 'center'; }
    if (sp.typed != null && sp.typed < 1) base.reveal = sp.typed;
    box = T(ft.str, cx, cy, base);
  }
  if (sp.strike > 0 && box) {
    const over = ft.size * .12;
    ctx.save(); ctx.globalAlpha *= fade; ctx.strokeStyle = sp.strikeColor || C.red; ctx.lineWidth = Math.max(3, ft.size * .1); ctx.lineCap = 'round';
    ln(box.x0 - over, cy, lp(box.x0 - over, box.x1 + over, cl(sp.strike)), cy); ctx.restore();
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
    ctx.save(); rect(px, py, pw, ph); ctx.clip();
    for (const e of ents) if (e.pane === p) {
      if (e.sp.fill) { ctx.fillStyle = e.sp.fill; ctx.fillRect(e.x, e.y, e.w, e.h); }
      if (e.sp.pulse != null && e.sp.pulse < 1) { ctx.fillStyle = rgba(C.amber, .6 * (1 - cl(e.sp.pulse))); ctx.fillRect(e.x, e.y, e.w, e.h); }
    }
    for (const f of o.fills || []) { const g = range(f.range), R = L.rect(g.c0, g.r0, g.c1, g.r1); ctx.fillStyle = rgba(f.color || C.amber, f.a ?? .4); ctx.fillRect(R.x, R.y, R.w, R.h); }
    if (o.grid !== false) {
      ctx.strokeStyle = o.gridColor || C.grid; ctx.lineWidth = 1.5; ctx.beginPath();
      for (const c of cols) { ctx.moveTo(c.x + c.w, py); ctx.lineTo(c.x + c.w, py + ph); }
      for (const r of rows) if (r.h > 2) { ctx.moveTo(px, r.y + r.h); ctx.lineTo(px + pw, r.y + r.h); }
      ctx.stroke();
    }
    for (const m of regs) {   /* static merged regions: one cell */
      if (m.anim) continue;
      const g = m.g, ci = cmap.get(g.c0), ri = rmap.get(g.r0), pane = (ci ? ci.pane : g.c0 < L.fc ? 0 : 1) + 2 * (ri ? ri.pane : g.r0 < L.fr ? 0 : 1);
      if (pane !== p) continue;
      const R = L.rect(g.c0, g.r0, g.c1, g.r1), sp = normCell(cells[refName(g.c0, g.r0)]) || {};
      ctx.fillStyle = sp.fill || C.white; ctx.fillRect(R.x, R.y, R.w, R.h);
      ctx.strokeStyle = o.gridColor || C.grid; ctx.lineWidth = 1.5; ctx.strokeRect(R.x, R.y, R.w, R.h);
      drawCellText(L, R.x, R.y, R.w, R.h, Object.assign({ align: 'center' }, sp), 'cell:' + refName(g.c0, g.r0));
    }
    for (const e of ents) if (e.pane === p) {
      if (e.sp.border) drawBorder(e.x, e.y, e.w, e.h, e.sp.border, z);
      drawCellText(L, e.x, e.y, e.w, e.h, e.sp, 'cell:' + e.key);
    }
    ctx.restore();
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
    const ft = fitText(txt, R.w - 2 * pad - 6, size, 600, 'Nunito'), n = k >= 1 ? txt.length : Math.floor(txt.length * k);
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
  hline(0, L.wR, hy + hh - .75, C.grid, 1.5); hline(L.wR - .75, L.wR, hy, C.grid, 1.5);
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
      ctx.fillStyle = C.grid; ctx.fillRect(c.x + c.w - .75, hy, 1.5, hh);
      T(colLetters(c.c), c.x + c.w / 2, hy + hh / 2, { size: 22 * ui * hz, weight: 800, fill: on ? C.blue : C.mute, maxW: c.w - 8 });
    }
    ctx.restore();
  }
  hline(L.wR, L.Wd, hy + hh - .75, C.grid, 1.5);
  for (let pr = 0; pr < 2; pr++) {   /* row numbers */
    const rows = L.vr.filter(v => v.pane === pr), py = PR[pr * 2][1], ph = PR[pr * 2][3];
    if (!rows.length || ph <= 0) continue;
    ctx.save(); rect(0, py, L.wR, ph); ctx.clip();
    for (const r of rows) {
      const on = selR(r.r);
      strip(0, r.y, L.wR, r.h, on);
      if (on) { ctx.fillStyle = C.blue; ctx.fillRect(L.wR - 4 * ui, r.y, 4 * ui, r.h); }
      ctx.fillStyle = C.grid; ctx.fillRect(0, r.y + r.h - .75, L.wR, 1.5);
      if (r.h >= 20 * ui) T(String(r.r + 1), L.wR / 2, r.y + r.h / 2, { size: 21 * ui * hz, weight: 800, fill: on ? C.blue : C.mute, alpha: sg(r.h, 14 * ui, 26 * ui) });
    }
    ctx.restore();
  }
  ctx.fillStyle = C.grid; ctx.fillRect(L.wR - .75, hy, 1.5, L.gy1 - hy);
}

// ---------------------------------------------------------------- the window: SH15.sheet(o, t)
/* o: { w, h, ui, zoom, doc, saved, ribbon: {tab, hot, hotK, press, collapsed} | false, show: {title, ribbon, formula, headers, sheetTabs, status}, formula, active, sel, cells, cols, rows, colW, rowH, merges, merge,
 *      freeze, scroll, tabs, tab, status, stats, fills, edit, ants, r (window corner radius), shadow, dressing } */
SH.sheet = (o, t = 0) => {
  o = o || {};
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
  return L;
};
/* layout queries, all in the window's local frame */
const rectOf = R => ({ x: R.x, y: R.y, w: R.w, h: R.h, x1: R.x + R.w, y1: R.y + R.h, cx: R.x + R.w / 2, cy: R.y + R.h / 2 });
SH.cellRect = (rf, o) => { const L = layout(o), g = range(rf); return rectOf(L.rect(g.c0, g.r0, g.c1, g.r1)); };
SH.colX = (col, o) => { const L = layout(o); return L.xOf(typeof col === 'number' ? col : colIndex(col)); };
SH.rowY = (row, o) => { const L = layout(o); return L.yOf(row - 1); };

/* @@END@@ */
})();
