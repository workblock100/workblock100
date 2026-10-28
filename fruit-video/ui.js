'use strict';
/* UI, the alignment kit (Episode 13 onward). Plain functions that draw on the current `ctx`, in whatever transform the caller has set.
 *
 * Why: signs drawn upside down, names printed over each other, labels not centred in their pills, text off the ruled lines of a page, letter-spaced titles shifted a few pixels
 * left. Every one of those comes from placing a string by guess. Here every string is MEASURED (ink box, cap height, letter spacing) and placed by construction, so a label is centred
 * on its ink, a block of lines sits on a baseline grid, text that does not fit is SHRUNK (never squished) and the failure is reported when it still does not fit.
 * All drawing goes through text() (engine.js), so outlines, shadows and the text gate (txaudit.js) see every string with the options below.
 *
 * Text options understood everywhere: size, font ('Nunito' weight 900 | 'Bangers' | 'Lucky', 400), weight, italic, fill, stroke, lw, spacing (letter spacing px), alpha, shadow,
 *   hero (default TRUE: the viewer must read it, so the gate holds it to 30 px and to the safe margin; pass hero:false for set dressing), id, tilt (allowed rotation, radians), crop, grp, transit.
 *   rot (labels, panels, signs, pills, pages, stamps) turns the object about its own centre.
 * Gate options: cid (the container the string belongs to), center (verify it is centred in it).
 *
 * Text:      UI.metrics(font, weight, italic) -> {cap, x, asc, desc}   fractions of the font size (cap from "H", x from "x", measured once at 1000 px per face)
 *            UI.sizeOf(str, o) -> {w, h, cap, asc, desc, adv, inkH}     w = ink width (+ outline), h = cap height (+ outline)
 *            UI.fit(str, maxW, o) -> {size, spacing, lw, k, w, overflow}   largest size <= o.size (down to o.min, default 0.6 x size) whose ink width <= maxW. Never squishes.
 *            UI.write(str, x, baseline, o) -> box     ink anchored at x (o.align 'left' | 'center' | 'right'), baseline exactly at `baseline`
 *            UI.label(str, cx, cy, o) -> box           ink-centred on cx, CAP BAND centred on cy (o.align 'left' | 'right' anchors the ink edge at cx; o.maxW fits by shrinking)
 *            UI.lines(arr, x, y, o) -> boxes           lines on a baseline grid (o.lh x size, o.pitch px, o.align, o.v 'base' | 'top' | 'mid', o.maxW fits the block)
 *            UI.wrap(str, maxW, o) -> lines            greedy by words; a word wider than maxW shrinks the size (lines.size)
 *            UI.para(str, [x,y,w,h], o) -> {size, lines, boxes, overflow}   wrapped, shrunk until it fits the height, o.valign 'top' | 'middle' | 'bottom', o.align
 *            UI.strike(str, cx, cy, o) -> box          a label with a multiply-blended strike line (o.k 0..1 draws it on)
 *            UI.stack(items, o) -> {boxes, x0, y0, x1, y1}   title and end cards: centred blocks {t | lines | pill | draw+h, size, font, ..., gap}; o.cx and o.top (cap top) or o.cy
 * Containers (register themselves with the gate while it records, so cid/center are verified in their own, possibly rotated and zoomed, frame):
 *            UI.panel([x,y,w,h], o) -> {id, inner, ...}    rounded rect: r, fill (colour or [c0,c1]), stroke, lw, shadow, alpha, rot, pad, id, kind
 *            UI.sign([x,y,w,h], content, o)                panel + text block centred both ways (content: string | array of 'text' | {t, size, fill, weight, font, spacing, gap}); shrinks to fit
 *            UI.pill(str, cx, cy, o) / UI.button           a pill sized to its text with symmetric padding (o.anchor 'left' | 'right' puts cx at an edge; o.minW, o.maxW)
 *            UI.page([x,y,w,h], o) -> {rules, base(i), inner, rect, ...}   sheet of paper, ruled every o.pitch from o.top; UI.onRule(str, x, i, page, o) puts text ON rule i
 *            UI.table([x,y,w,h], cols, rows, o) -> {cell(r, c), ...}   fixed row pitch, one baseline per row, cells fitted (shrink, then an ellipsis AND a reported error)
 *            UI.stamp(str, cx, cy, o), UI.tag(lines, cx, cy, o), UI.ring(cx, cy, r, k, o)   a tilted stamp, a name tag, a progress ring with a centred figure
 *            UI.container(id, kind, rect, pad)             register your own container (a board you drew by hand) so labels can name it with cid
 * Layout:    UI.rowX(n, x0, x1, o) (n boxes of width o.w with equal gaps; reports a row that does not fit), UI.gridX(cols, rows, box, o), UI.snap(v, grid = 8)
 *
 * The gate's vertical-centre test reads the text origin as if it were in the container's frame; text() always moves the origin to the label, so this kit registers a per-label alias of
 * the container (id "<cid>#<n>") expressed in the label's own frame. Set UI.alias = false once txaudit.js computes it from the transform.
 */
(() => {
const UI = {};
window.UI = UI;
UI.alias = true;

const gateOn = () => typeof TXA !== 'undefined' && TXA.rec && !REG.suppress;
const fail = msg => { if (REG.on && !REG.suppress) REG.errors.push(msg); };
const quote = s => { s = String(s); return '"' + (s.length > 30 ? s.slice(0, 29) + '…' : s) + '"'; };
const DEF_W = { Bangers: 400, Lucky: 400 };
const wOf = (font, w) => w ?? DEF_W[font] ?? 900;
const specOf = (size, font, weight, italic) => `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;   /* the string text() builds */
const fontReady = spec => { try { return document.fonts.check(spec); } catch (e) { return true; } };

// ---------------------------------------------------------------- measuring
const mc = document.createElement('canvas'); mc.width = mc.height = 16;
const mx = mc.getContext('2d');

const METS = new Map();
UI.metrics = (font = 'Nunito', weight, italic = false) => {
  weight = wOf(font, weight);
  const key = `${font}|${weight}|${italic ? 1 : 0}`, hit = METS.get(key);
  if (hit) return hit;
  const S = 1000, spec = specOf(S, font, weight, italic);
  mx.font = spec; mx.textAlign = 'left'; mx.textBaseline = 'alphabetic'; mx.letterSpacing = '0px';
  const up = s => mx.measureText(s).actualBoundingBoxAscent / S, down = s => mx.measureText(s).actualBoundingBoxDescent / S;
  const fm = mx.measureText('H');
  const m = { cap: up('H'), x: up('x'), asc: Math.max(up('d'), up('l'), up('k'), up('h')), desc: Math.max(down('p'), down('g'), down('y'), down('j')), fasc: fm.fontBoundingBoxAscent / S, fdesc: fm.fontBoundingBoxDescent / S };
  if (fontReady(spec)) METS.set(key, m);
  return m;
};

const INKS = new Map();
/* the ink box of a string drawn left-aligned on its baseline at the origin: spans [l, r] across, asc above and desc below the baseline (letter spacing between glyphs only, not after the last) */
function ink(str, size, font, weight, italic, spacing) {
  const key = `${font}|${weight}|${italic ? 1 : 0}|${size}|${spacing}|${str}`;
  let r = INKS.get(key);
  if (r) return r;
  const spec = specOf(size, font, weight, italic);
  mx.font = spec; mx.textAlign = 'left'; mx.textBaseline = 'alphabetic'; mx.letterSpacing = spacing ? spacing + 'px' : '0px';
  const m = mx.measureText(str);
  r = { l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, asc: Math.max(0, m.actualBoundingBoxAscent), desc: Math.max(0, m.actualBoundingBoxDescent), adv: m.width };
  if (!(r.r > r.l)) { r.l = 0; r.r = 0; r.asc = 0; r.desc = 0; }
  r.w = r.r - r.l;
  if (fontReady(spec)) { if (INKS.size > 6000) INKS.clear(); INKS.set(key, r); }
  return r;
}

/* the resolved style of a text options object, scaled by k (size, spacing, outline and shadow shrink together, so a fitted string is a scaled copy of the nominal one) */
function sty(o, k = 1) {
  const font = o.font || 'Nunito';
  return { font, weight: wOf(font, o.weight), italic: !!o.italic, size: (o.size ?? 40) * k, spacing: (o.spacing || 0) * k, lw: (o.lw || 0) * k, shadow: (o.shadow || 0) * k };
}
const inkOf = (str, st) => ink(str, st.size, st.font, st.weight, st.italic, st.spacing);

UI.sizeOf = (str, o = {}) => {
  str = String(str);
  const st = sty(o), i = inkOf(str, st), m = UI.metrics(st.font, st.weight, st.italic);
  return { w: i.w + st.lw, h: m.cap * st.size + st.lw, cap: m.cap * st.size, asc: i.asc, desc: i.desc, adv: i.adv, inkH: i.asc + i.desc + st.lw };
};

UI.fit = (str, maxW, o = {}) => {
  str = String(str);
  const s0 = sty(o), min = o.min ?? s0.size * .6;
  const vis = k => ink(str, s0.size * k, s0.font, s0.weight, s0.italic, s0.spacing * k).w + s0.lw * k;
  maxW = Math.max(1, maxW);
  let k = 1, w = vis(1), overflow = false;
  if (w > maxW) {
    k = maxW / w;
    for (let i = 0; i < 8; i++) { w = vis(k); if (w <= maxW) break; k *= maxW / w * .999; }
    const kmin = min / s0.size;
    if (k < kmin) { k = kmin; w = vis(k); overflow = w > maxW; }
  }
  if (overflow && !o.quiet) fail(`text does not fit: ${quote(str)} [${Math.ceil(w)} > ${Math.floor(maxW)} px]`);
  return { size: s0.size * k, spacing: s0.spacing * k, lw: s0.lw * k, k, w, overflow };
};

// ---------------------------------------------------------------- the gate: containers and per-label aliases
const autoId = (kind, box) => kind + '@' + box.map(v => Math.round(v)).join(',');
/* register a container with the gate: rect in the current local frame, pad = inner margin text must respect, m = the transform in force (rotation and camera included) */
UI.container = (id, kind, rect, pad = 0) => {
  if (!id || !gateOn()) return;
  const m = ctx.getTransform();
  TXA.UIREG.set(id, { kind, rect: rect.slice(), pad, m: [m.a, m.b, m.c, m.d, m.e, m.f] });
};
/* the same container, expressed in the frame of a label whose text origin is (x, base) under the current transform */
function aliasFor(cid, x, base) {
  if (!cid || !UI.alias || !gateOn()) return cid;
  const c = TXA.UIREG.get(cid);
  if (!c) return cid;
  const Mt = ctx.getTransform().translate(x, base), inv = Mt.inverse(), [a, b, cc, d, e, f] = c.m;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [u, v] of [[c.rect[0], c.rect[1]], [c.rect[2], c.rect[1]], [c.rect[2], c.rect[3]], [c.rect[0], c.rect[3]]]) {
    const p = inv.transformPoint({ x: a * u + cc * v + e, y: b * u + d * v + f });
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  const s1 = Math.sqrt(Math.abs(a * d - b * cc)) || 1, s2 = Math.sqrt(Math.abs(Mt.a * Mt.d - Mt.b * Mt.c)) || 1;
  c.n = (c.n || 0) + 1;
  const id = `${cid}#${c.n}`;
  TXA.UIREG.set(id, { kind: c.kind, rect: [x0, y0, x1, y1], pad: c.pad * s1 / s2, m: [Mt.a, Mt.b, Mt.c, Mt.d, Mt.e, Mt.f] });
  return id;
}
function rotated(cx, cy, rot, fn) {
  if (!rot) return fn();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy);
  const r = fn();
  ctx.restore();
  return r;
}

// ---------------------------------------------------------------- single strings
/* the options text() gets: the string is always drawn left-aligned on an alphabetic baseline, so no letter-spacing correction is ever needed and the ink box is exact */
function put(str, x, base, st, o, cid) {
  text(str, x, base, {
    size: st.size, font: st.font, weight: st.weight, italic: st.italic, spacing: st.spacing, lw: st.lw, shadow: st.shadow,
    fill: o.fill, stroke: o.stroke, alpha: o.alpha, align: 'left', base: 'alphabetic', rot: 0,
    hero: o.hero !== false, id: o.id, tilt: o.tilt, crop: o.crop, grp: o.grp, transit: o.transit, zone: o.zone,
    cid, center: !!o.center, centerY: o.centerY,
  });
}
const boxOf = (ox, base, i, st, k, str) => ({ x0: ox + i.l, x1: ox + i.r, y0: base - i.asc, y1: base + i.desc, size: st.size, base, cx: ox + (i.l + i.r) / 2, w: i.w, h: i.asc + i.desc, k, str });

/* resolve the style of a string, shrunk by UI.fit when o.maxW is given */
function resolve(str, o) {
  if (o.maxW) { const f = UI.fit(str, o.maxW, o); return { st: sty(o, f.k), k: f.k }; }
  return { st: sty(o), k: 1 };
}

UI.write = (str, x, base, o = {}) => {
  str = String(str);
  const { st, k } = resolve(str, o), i = inkOf(str, st), al = o.align || 'left';
  const ox = al === 'center' ? x - (i.l + i.r) / 2 : al === 'right' ? x - i.r : x - i.l;
  if (str.trim()) put(str, ox, base, st, o, aliasFor(o.cid, ox, base));
  return boxOf(ox, base, i, st, k, str);
};

UI.label = (str, cx, cy, o = {}) => {
  str = String(str);
  const { st, k } = resolve(str, o), m = UI.metrics(st.font, st.weight, st.italic), al = o.align || 'center';
  const base = cy + m.cap * st.size / 2;
  const o2 = Object.assign({}, o, { maxW: 0, size: st.size, spacing: st.spacing, lw: st.lw, shadow: st.shadow, align: al, center: o.center ?? al === 'center' });
  const res = rotated(cx, cy, o.rot, () => UI.write(str, cx, base, o2));
  res.cy = cy; res.k = k;
  return res;
};

UI.strike = (str, cx, cy, o = {}) => {
  const res = UI.label(str, cx, cy, o);
  const k = o.k ?? 1;
  if (k > 0 && String(str).trim()) {
    const th = o.thickness ?? Math.max(3, res.size * .09), over = o.over ?? res.size * .12, x0 = res.x0 - over, x1 = res.x1 + over;
    rotated(cx, cy, o.rot, () => {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha *= o.lineAlpha ?? .92;
      ctx.strokeStyle = o.line || '#241a2c'; ctx.lineWidth = th; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x0 + (x1 - x0) * k, cy); ctx.stroke();
      ctx.restore();
    });
  }
  return res;
};

// ---------------------------------------------------------------- blocks of lines
const lhMult = o => o.lh == null ? 1.2 : o.lh < 5 ? o.lh : 0;
/* baselines of a block, relative to the first one: the pitch between two lines is lh x the mean of their sizes (or o.pitch px), plus the second line's gap */
function blockLayout(ls, k, o) {
  const sizes = ls.map(l => (l.size ?? 40) * k), rel = [0];
  for (let j = 1; j < ls.length; j++) {
    const p = o.pitch != null ? o.pitch * k : o.lh >= 5 ? o.lh * k : lhMult(o) * (sizes[j - 1] + sizes[j]) / 2;
    rel.push(rel[j - 1] + p + (ls[j].gap || 0) * k);
  }
  const m0 = UI.metrics(ls[0].font, ls[0].weight, ls[0].italic);
  return { sizes, rel, capTop: -m0.cap * sizes[0], last: rel[rel.length - 1] };
}
/* the uniform scale at which every line fits maxW */
function blockK(ls, maxW, minK) {
  let k = 1;
  for (const l of ls) k = Math.min(k, UI.fit(l.t, maxW, Object.assign({}, l, { quiet: true, min: 0 })).k);
  return { k: Math.max(k, minK), over: k < minK };
}
/* the pieces of a text object that belong to a line (container options are added by the caller) */
const LINE_KEYS = ['size', 'font', 'weight', 'italic', 'fill', 'stroke', 'lw', 'spacing', 'alpha', 'shadow', 'hero', 'id', 'tilt', 'crop', 'grp', 'transit', 'zone'];
const pickText = o => { const t = {}; for (const k of LINE_KEYS) if (o[k] !== undefined) t[k] = o[k]; return t; };

UI.lines = (arr, x, y, o = {}) => {
  const ls = arr.map(a => Object.assign(pickText(o), typeof a === 'object' && a ? a : { t: a })).map(l => (l.t = String(l.t), l));
  if (!ls.length) return [];
  let k = 1;
  if (o.maxW) {
    const b = blockK(ls, o.maxW, o.minK ?? .6);
    k = b.k;
    if (b.over) fail(`text does not fit: ${quote(ls.reduce((a, l) => l.t.length > a.length ? l.t : a, ''))} [${Math.ceil(o.maxW)} px wide block]`);
  }
  const L = blockLayout(ls, k, o), m0 = UI.metrics(ls[0].font, ls[0].weight, ls[0].italic);
  const base0 = o.v === 'top' ? y + m0.cap * L.sizes[0] : o.v === 'mid' ? y - (L.last + L.capTop) / 2 : y;
  const boxes = ls.map((l, j) => UI.write(l.t, x, base0 + L.rel[j], Object.assign({}, l, {
    size: L.sizes[j], spacing: (l.spacing || 0) * k, lw: (l.lw || 0) * k, shadow: (l.shadow || 0) * k, maxW: 0,
    align: o.align || 'left', cid: l.cid ?? o.cid, center: l.center ?? o.center, centerY: l.centerY ?? o.centerY,
  })));
  boxes.k = k; boxes.size = L.sizes[0]; boxes.base0 = base0; boxes.pitch = L.rel[1] ?? 0;
  return boxes;
};

UI.wrap = (str, maxW, o = {}) => {
  const s0 = sty(o), paras = String(str).split('\n'), words = paras.flatMap(p => p.split(/\s+/).filter(Boolean));
  const vis = (s, k) => ink(s, s0.size * k, s0.font, s0.weight, s0.italic, s0.spacing * k).w + s0.lw * k;
  maxW = Math.max(1, maxW);
  let k = 1, widest = Math.max(0, ...words.map(w => vis(w, 1))), over = false;
  if (widest > maxW) {   /* one word is wider than the line: shrink everything until it fits */
    k = maxW / widest;
    for (let i = 0; i < 8; i++) { const w = Math.max(...words.map(v => vis(v, k))); if (w <= maxW) break; k *= maxW / w * .999; }
    const kmin = (o.min ?? s0.size * .5) / s0.size;
    if (k < kmin) { k = kmin; over = true; }
  }
  const out = [];
  for (const p of paras) {
    let cur = '';
    for (const w of p.split(/\s+/).filter(Boolean)) {
      const t = cur ? cur + ' ' + w : w;
      if (!cur || vis(t, k) <= maxW) cur = t; else { out.push(cur); cur = w; }
    }
    out.push(cur);
  }
  out.size = s0.size * k; out.k = k; out.overflow = over;
  return out;
};

UI.para = (str, box, o = {}) => {
  const [bx, by, bw, bh] = box, size0 = o.size ?? 40, min = o.min ?? size0 * .5, base = sty(o);
  const m = UI.metrics(base.font, base.weight, base.italic);
  const build = size => {
    const lines = UI.wrap(str, bw, Object.assign({}, o, { size, min: Math.min(min, size) }));
    const sz = lines.size, k = sz / size, pitch = o.pitch != null ? o.pitch * sz / size0 : o.lh >= 5 ? o.lh * sz / size0 : lhMult(o) * sz;
    return { lines, sz, k, pitch, h: m.cap * sz + (lines.length - 1) * pitch + m.desc * sz + base.lw * k };
  };
  let size = size0, b = build(size);
  while (b.h > bh && size > min + 1e-6) { size = Math.max(min, size * .96); b = build(size); }
  const overflow = b.h > bh + .5 || b.lines.overflow;
  if (overflow) fail(`paragraph does not fit its box: ${quote(str)} [${Math.ceil(b.h)} > ${Math.floor(bh)} px]`);
  const lw2 = base.lw * b.k / 2, va = o.valign || 'top', al = o.align || 'left';
  const capTop = va === 'bottom' ? by + bh - b.h + lw2 : va === 'middle' ? by + (bh - b.h) / 2 + lw2 : by + lw2;   /* the block spans [capTop - lw/2, capTop - lw/2 + height] */
  const base0 = capTop + m.cap * b.sz;
  const ax = al === 'center' ? bx + bw / 2 : al === 'right' ? bx + bw - lw2 : bx + lw2;
  const boxes = b.lines.map((ln, j) => UI.write(ln, ax, base0 + j * b.pitch, Object.assign({}, o, {
    size: b.sz, spacing: (o.spacing || 0) * b.k, lw: (o.lw || 0) * b.k, shadow: (o.shadow || 0) * b.k, maxW: 0, align: al,
  })));
  return { size: b.sz, lines: b.lines, boxes, overflow, pitch: b.pitch, height: b.h };
};

// ---------------------------------------------------------------- panels and the things built on them
/* text defaults of a container: o.text (explicit), else the shorthands size, font, weight, italic, spacing, ink (the text colour), tstroke, tlw */
function tdef(o) {
  const t = {};
  for (const [k, v] of [['size', o.size], ['font', o.font], ['weight', o.weight], ['italic', o.italic], ['spacing', o.spacing], ['fill', o.ink], ['stroke', o.tstroke], ['lw', o.tlw], ['hero', o.hero], ['tilt', o.tilt], ['crop', o.crop], ['grp', o.grp], ['alpha', o.talpha]]) if (v !== undefined) t[k] = v;
  return Object.assign(t, o.text);
}

UI.panel = (box, o = {}) => {
  const [x, y, w, h] = box, kind = o.kind || 'panel', id = o.id || autoId(kind, box), pad = o.pad ?? .08 * Math.min(w, h);
  const cx = x + w / 2, cy = y + h / 2, r = o.r ?? Math.min(26, Math.min(w, h) * .2);
  rotated(cx, cy, o.rot, () => {
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow) { ctx.shadowColor = o.shadowColor || 'rgba(0,0,0,.35)'; ctx.shadowBlur = o.shadow; ctx.shadowOffsetY = o.shadow / 3; }
    let fill = o.fill ?? '#2b2740';
    if (Array.isArray(fill)) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, fill[0]); g.addColorStop(1, fill[1]); fill = g; }
    if (fill) { ctx.fillStyle = fill; rr(x, y, w, h, r); ctx.fill(); }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    if (o.stroke && o.lw) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw; ctx.lineJoin = 'round'; rr(x, y, w, h, r); ctx.stroke(); }
    ctx.restore();
    UI.container(id, kind, [x, y, x + w, y + h], pad);
  });
  return { id, kind, x0: x, y0: y, x1: x + w, y1: y + h, w, h, cx, cy, pad, r, rot: o.rot || 0, inner: [x + pad, y + pad, w - 2 * pad, h - 2 * pad] };
};

UI.sign = (box, content, o = {}) => {
  const [x, y, w, h] = box, cx = x + w / 2, cy = y + h / 2, id = o.id || autoId('sign', box);
  const def = Object.assign({ size: 44, fill: '#fff' }, tdef(o));
  const ls = (Array.isArray(content) ? content : [content]).map(c => Object.assign({}, def, typeof c === 'object' && c ? c : { t: c })).map(l => (l.t = String(l.t), l));
  const pad = o.pad ?? .08 * Math.min(w, h), iw = w - 2 * pad - 1, ih = h - 2 * pad - 1;
  let out;
  rotated(cx, cy, o.rot, () => {
    const pan = UI.panel(box, Object.assign({}, o, { rot: 0, id, kind: o.kind || 'sign', pad }));
    if (!ls.length || ls.every(l => !l.t.trim())) { out = { id, panel: pan, boxes: [], size: 0, k: 1 }; return; }
    // fit: one scale for the whole block, so the hierarchy between the lines survives
    let k = blockK(ls, iw, 0).k, L = blockLayout(ls, 1, o);
    const first = inkOf(ls[0].t, sty(ls[0])), last = inkOf(ls[ls.length - 1].t, sty(ls[ls.length - 1]));
    const mid1 = (L.capTop + L.last) / 2, inkTop = -(first.asc + (ls[0].lw || 0) / 2), inkBot = L.last + last.desc + (ls[ls.length - 1].lw || 0) / 2;
    k = Math.min(k, (ih / 2) / Math.max(mid1 - inkTop, inkBot - mid1));
    const minK = o.minK ?? .5;
    if (k < minK) { fail(`text does not fit: ${quote(ls.reduce((a, l) => l.t.length > a.length ? l.t : a, ''))} in ${o.kind || 'sign'} "${id}" [${Math.floor(iw)} x ${Math.floor(ih)} px]`); k = minK; }
    k = Math.min(k, 1);
    L = blockLayout(ls, k, o);
    const base0 = cy - (L.capTop + L.last) / 2, one = ls.length === 1;
    const boxes = ls.map((l, j) => UI.write(l.t, cx, base0 + L.rel[j], Object.assign({}, l, {
      size: L.sizes[j], spacing: (l.spacing || 0) * k, lw: (l.lw || 0) * k, shadow: (l.shadow || 0) * k, maxW: 0,
      align: 'center', cid: id, center: l.center ?? true, centerY: l.centerY ?? one,
    })));
    out = { id, panel: pan, boxes, size: L.sizes[0], k, inner: pan.inner };
  });
  return out;
};

UI.pill = (str, cx, cy, o = {}) => {
  str = String(str);
  const def = Object.assign({ size: 36, fill: '#15111a' }, tdef(o)), st0 = sty(def);
  const padX = o.padX ?? st0.size * .8, h = o.h ?? st0.size * 1.75;
  let size = def.size, f = null;
  if (o.maxW) { f = UI.fit(str, o.maxW - 2 * padX, def); size = f.size; }
  const k = size / def.size, st = sty(def, k), i = inkOf(str, st);
  const w = Math.max(o.minW ?? 0, i.w + st.lw + 2 * padX);
  const left = o.anchor === 'left' ? cx : o.anchor === 'right' ? cx - w : cx - w / 2, pcx = left + w / 2;
  const id = o.id || autoId('pill', [pcx, cy, w, h]);
  const pad = o.pad ?? Math.max(1, Math.min(padX * .6, st.size * .2));
  const res = rotated(pcx, cy, o.rot, () => {
    const pan = UI.panel([left, cy - h / 2, w, h], Object.assign({ fill: '#ffe135', r: h / 2 }, o, { rot: 0, id, kind: o.kind || 'pill', pad }));
    const lab = UI.label(str, pcx, cy, Object.assign({}, def, { size: st.size, spacing: st.spacing, lw: st.lw, shadow: st.shadow, cid: id, center: true }));
    return { id, panel: pan, label: lab };
  });
  return { id, x0: left, y0: cy - h / 2, x1: left + w, y1: cy + h / 2, w, h, cx: pcx, cy, size: st.size, k, panel: res.panel, label: res.label };
};
UI.button = UI.pill;

UI.stamp = (str, cx, cy, o = {}) => {
  str = String(str);
  const def = Object.assign({ size: 56, font: 'Bangers', fill: o.color || '#d6203a' }, tdef(o)), st = sty(def), met = UI.metrics(st.font, st.weight, st.italic);
  const lim = o.tilt ?? .2, rot = Math.max(-lim, Math.min(lim, o.rot ?? -.09));
  const padX = o.padX ?? st.size * .5, padY = o.padY ?? st.size * .34, lwB = o.lw ?? Math.max(4, st.size * .1);
  const i = inkOf(str, st), w = i.w + st.lw + 2 * padX, h = met.cap * st.size + 2 * padY, x = cx - w / 2, y = cy - h / 2, id = o.id || autoId('stamp', [cx, cy, w, h]);
  const col = o.color || def.fill, pad = Math.max(lwB + 4, st.size * .22);
  rotated(cx, cy, rot, () => {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? .92; ctx.strokeStyle = col; ctx.lineJoin = 'round';
    ctx.lineWidth = lwB; rr(x, y, w, h, st.size * .18); ctx.stroke();
    ctx.lineWidth = Math.max(2, lwB * .35); rr(x + lwB * 1.6, y + lwB * 1.6, w - lwB * 3.2, h - lwB * 3.2, st.size * .1); ctx.stroke();
    ctx.restore();
    UI.container(id, 'stamp', [x, y, x + w, y + h], pad);
    UI.label(str, cx, cy, Object.assign({}, def, { tilt: o.tilt, cid: id, center: true }));
  });
  return { id, x0: x, y0: y, x1: x + w, y1: y + h, w, h, cx, cy, rot };
};

/* a name tag: a tag-shaped card with a punched hole on the left (a chamfered corner above and below it) and its text centred in the body to the right of the hole */
UI.tag = (content, cx, cy, o = {}) => {
  const def = Object.assign({ size: 38, fill: '#15111a' }, tdef(o));
  const ls = (Array.isArray(content) ? content : [content]).map(c => Object.assign({}, def, typeof c === 'object' && c ? c : { t: c })).map(l => (l.t = String(l.t), l));
  const widest = Math.max(...ls.map(l => UI.sizeOf(l.t, l).w)), hole = o.hole ?? def.size * .42, bodyPad = def.size * .5;
  const w = o.w ?? Math.max(widest + 2 * bodyPad + hole * 4.4, def.size * 6), h = o.h ?? ls.length * def.size * 1.3 + def.size * 1.5;
  const x = cx - w / 2, y = cy - h / 2, hx = x + hole * 2.2, bx = hx + hole * 1.8, id = o.id || autoId('tag', [cx, cy, w, h]), c = Math.min(h * .28, w * .1);
  rotated(cx, cy, o.rot, () => {
    ctx.save();
    if (o.shadow !== 0) { ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = o.shadow ?? 10; ctx.shadowOffsetY = (o.shadow ?? 10) / 3; }
    ctx.fillStyle = o.fill ?? '#fff4c2';
    ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w - 10, y); ctx.arcTo(x + w, y, x + w, y + 10, 10); ctx.lineTo(x + w, y + h - 10); ctx.arcTo(x + w, y + h, x + w - 10, y + h, 10);
    ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    if (o.stroke && o.lw) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.fillStyle = o.holeFill ?? 'rgba(20,14,24,.85)'; ctx.beginPath(); ctx.arc(hx, cy, hole, 0, TAU); ctx.fill();
    ctx.restore();
    const bw = x + w - bx, pad = bodyPad * .6;
    UI.container(id, 'tag', [bx, y, x + w, y + h], pad);
    const kk = Math.min(1, blockK(ls, bw - 2 * pad - 1, .5).k), L = blockLayout(ls, kk, o), base0 = cy - (L.capTop + L.last) / 2;
    ls.forEach((l, j) => UI.write(l.t, bx + bw / 2, base0 + L.rel[j], Object.assign({}, l, {
      size: L.sizes[j], spacing: (l.spacing || 0) * kk, lw: (l.lw || 0) * kk, maxW: 0, align: 'center', cid: id, center: true, centerY: ls.length === 1,
    })));
  });
  return { id, x0: x, y0: y, x1: x + w, y1: y + h, w, h, cx, cy };
};

UI.ring = (cx, cy, r, k, o = {}) => {
  const lwR = o.lw ?? r * .2, id = o.id || autoId('ring', [cx, cy, r, r]), ri = (r - lwR / 2) * Math.SQRT1_2;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineWidth = lwR;
  ctx.strokeStyle = o.track || 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(cx, cy, r - lwR / 2, 0, TAU); ctx.stroke();
  if (k > 0) { ctx.strokeStyle = o.color || '#ffe135'; ctx.beginPath(); ctx.arc(cx, cy, r - lwR / 2, -PI / 2, -PI / 2 + TAU * Math.min(1, k)); ctx.stroke(); }
  ctx.restore();
  UI.container(id, 'ring', [cx - ri, cy - ri, cx + ri, cy + ri], 0);
  if (o.text != null) UI.label(o.text, cx, cy, Object.assign({ size: r * .9, fill: '#fff' }, tdef(o), { maxW: 2 * ri - 1, cid: id, center: true }));
  return { id, cx, cy, r };
};

// ---------------------------------------------------------------- a page of paper
UI.page = (box, o = {}) => {
  const [x, y, w, h] = box, pitch = o.pitch || 0, id = o.id || autoId('page', box), cx = x + w / 2, cy = y + h / 2, rot = o.rot || 0;
  const mX = o.margin ?? w * .07, top = o.top ?? pitch * 1.5, bottom = o.bottom ?? pitch * .6, pad = o.pad ?? mX * .8;
  const rules = [];
  if (pitch > 0) for (let i = 0; y + top + i * pitch <= y + h - bottom + 1e-6; i++) rules.push(y + top + i * pitch);
  const fold = o.fold === true ? Math.min(w, h) * .09 : o.fold || 0;
  const r = o.r ?? 5;
  rotated(cx, cy, rot, () => {
    ctx.save();
    if (o.shadow !== 0) { ctx.shadowColor = 'rgba(30,20,10,.38)'; ctx.shadowBlur = o.shadow ?? 20; ctx.shadowOffsetY = (o.shadow ?? 20) / 3; }
    ctx.fillStyle = o.fill ?? '#fbf7e8';
    const path = () => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      if (fold) { ctx.lineTo(x + w, y + h - fold); ctx.lineTo(x + w - fold, y + h); } else { ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); }
      ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    };
    path(); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.save(); path(); ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.6, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,90,40,.10)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.lineWidth = o.ruleLw ?? 2; ctx.strokeStyle = o.rule || '#9fbbe0';
    for (const ry of rules) { ctx.beginPath(); ctx.moveTo(x + mX * .6, ry); ctx.lineTo(x + w - mX * .6, ry); ctx.stroke(); }
    if (o.marginLine) { ctx.strokeStyle = o.marginLine === true ? '#e58a8a' : o.marginLine; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + mX * .95, y); ctx.lineTo(x + mX * .95, y + h); ctx.stroke(); }
    ctx.restore();
    if (fold) {   /* the dog-ear: the folded flap lies on the sheet, lit from the upper left */
      ctx.fillStyle = o.flap || '#e9e1c8'; ctx.beginPath(); ctx.moveTo(x + w, y + h - fold); ctx.lineTo(x + w - fold, y + h); ctx.lineTo(x + w - fold, y + h - fold); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(80,60,30,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.strokeStyle = o.edge || '#d8cfae'; ctx.lineWidth = 2.5; path(); ctx.stroke();
    ctx.restore();
    UI.container(id, 'page', [x, y, x + w, y + h], pad);
  });
  const gap = .24 * pitch, first = rules.length ? top - pitch : mX;
  return {
    id, rules, pitch, gap, n: rules.length, rect: [x, y, x + w, y + h], cx, cy, rot, pad,
    inner: [x + mX, y + Math.max(mX, first), w - 2 * mX, h - Math.max(mX, first) - mX],
    base: i => rules[i] - gap,
    apply() { ctx.save(); if (rot) { ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy); } },
    restore() { ctx.restore(); },
  };
};

/* text sitting ON rule i of a page: the baseline is exactly page.base(i), the ink starts at x (page coordinates; default the left margin) */
UI.onRule = (str, x, i, page, o = {}) => {
  if (!(i >= 0 && i < page.n)) { fail(`line ${i} is off the page "${page.id}" [${page.n} rules]`); return null; }
  const left = x ?? page.inner[0], right = page.inner[0] + page.inner[2];
  page.apply();
  const res = UI.write(str, left, page.base(i), Object.assign({ size: page.pitch * .62, italic: true, weight: 800, fill: '#23408e', maxW: o.align === 'right' || o.align === 'center' ? undefined : right - left }, o, { cid: page.id }));
  page.restore();
  return res;
};

// ---------------------------------------------------------------- tables
UI.table = (box, cols, rows, o = {}) => {
  const [bx, by, bw, bh] = box, head = o.header || null, nR = rows.length, nAll = nR + (head ? 1 : 0);
  const rowH = o.rowH ?? (bh ? bh / nAll : (o.size ?? 28) * 2.1), size = o.size ?? Math.round(rowH * .42), padX = o.padX ?? Math.round(size * .45);
  const id = o.id || autoId('table', box), tH = rowH * nAll;
  // column widths: a number above 1 is px, 1 or less a fraction of the width, none = an equal share of what is left
  const fixed = cols.map(c => c.w == null ? null : c.w > 1 ? c.w : c.w * bw), used = fixed.reduce((a, v) => a + (v || 0), 0), free = fixed.filter(v => v == null).length;
  const cw = fixed.map(v => v ?? Math.max(0, (bw - used) / free)), cx0 = [];
  cw.reduce((a, v, i) => (cx0[i] = a, a + v), bx);
  const hero = o.hero !== false;
  // frame, header band, zebra rows, grid
  const pan = UI.panel([bx, by, bw, tH], { fill: o.fill ?? '#fffdf5', stroke: o.stroke ?? '#c9bfa4', lw: o.lw ?? 3, r: o.r ?? 10, shadow: o.shadow, id, kind: 'table', pad: 0 });
  ctx.save();
  rr(bx, by, bw, tH, o.r ?? 10); ctx.clip();
  if (head) { ctx.fillStyle = o.headFill ?? '#3a3358'; ctx.fillRect(bx, by, bw, rowH); }
  for (let r = 0; r < nR; r++) {
    const ty = by + (head ? rowH : 0) + r * rowH;
    if (o.zebra && r % 2 === 1) { ctx.fillStyle = o.zebra; ctx.fillRect(bx, ty, bw, rowH); }
    if (r > 0 || head) { ctx.strokeStyle = o.grid ?? 'rgba(60,45,30,.18)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, ty); ctx.lineTo(bx + bw, ty); ctx.stroke(); }
  }
  if (o.vgrid) { ctx.strokeStyle = o.grid ?? 'rgba(60,45,30,.18)'; ctx.lineWidth = 1.5; for (let c = 1; c < cols.length; c++) { ctx.beginPath(); ctx.moveTo(cx0[c], by); ctx.lineTo(cx0[c], by + tH); ctx.stroke(); } }
  ctx.restore();
  if (o.stroke !== null && (o.lw ?? 3)) { ctx.save(); ctx.strokeStyle = o.stroke ?? '#c9bfa4'; ctx.lineWidth = o.lw ?? 3; rr(bx, by, bw, tH, o.r ?? 10); ctx.stroke(); ctx.restore(); }
  // cells
  const grid = [];
  const drawRow = (cells, rowTop, kind) => {
    const styles = cells.map((cell, c) => {
      const col = cols[c] || {}, cellObj = typeof cell === 'object' && cell ? cell : { t: cell };
      const s = Object.assign({ size, fill: kind === 'head' ? '#fff' : '#1d1a22' }, o.text, kind === 'head' ? Object.assign({ weight: 900 }, o.headText) : null, pickText(col), col.align ? { align: col.align } : null, cellObj);
      s.t = cellObj.t == null ? '' : String(cellObj.t);
      return s;
    });
    // one baseline for the whole row: centred for the tallest nominal cap height in it
    const capRow = Math.max(...styles.map(s => { const m = UI.metrics(s.font, s.weight, s.italic); return m.cap * (s.size ?? size); }));
    const base = rowTop + (rowH + capRow) / 2, out = [];
    styles.forEach((s, c) => {
      const x0 = cx0[c], x1 = x0 + cw[c], cellId = `${id}.${kind === 'head' ? 'h' : grid.length - (head ? 1 : 0)}.${c}`, al = s.align || 'left';
      UI.container(cellId, 'cell', [x0, rowTop, x1, rowTop + rowH], padX - .75);
      const rec = { x0, y0: rowTop, x1, y1: rowTop + rowH, cx: (x0 + x1) / 2, cy: rowTop + rowH / 2, base, id: cellId, text: s.t, size: s.size, shrunk: false, ellipsis: false, ink: null };
      if (s.draw) { s.draw(x0, rowTop, x1, rowTop + rowH, rec); out.push(rec); return; }
      if (s.t.trim()) {
        const avail = cw[c] - 2 * padX - 1, ta = Object.assign({}, s, { quiet: true, min: s.size * .62 }), f = UI.fit(s.t, avail, ta);
        let str = s.t, st = f;
        if (f.overflow) {   /* last resort: cut the string with an ellipsis at the smallest size, and say so */
          const sty0 = sty(ta, f.k), vis = t => inkOf(t, sty0).w + sty0.lw;
          let n = str.length;
          while (n > 1 && vis(str.slice(0, n).trimEnd() + '…') > avail) n--;
          str = str.slice(0, n).trimEnd() + '…'; rec.ellipsis = true;
          fail(`table cell cut with an ellipsis: ${quote(s.t)} [${Math.ceil(f.w)} > ${Math.floor(avail)} px]`);
        }
        rec.shrunk = f.k < 1; rec.size = st.size; rec.text = str;
        const ax = al === 'center' ? (x0 + x1) / 2 : al === 'right' ? x1 - padX : x0 + padX;
        rec.ink = UI.write(str, ax, base, Object.assign({}, s, {
          size: st.size, spacing: st.spacing, lw: st.lw, shadow: (s.shadow || 0) * f.k, maxW: 0, align: al, cid: cellId, center: al === 'center', centerY: false, hero: s.hero ?? hero,
        }));
      }
      out.push(rec);
    });
    return out;
  };
  let ry = by;
  if (head) { grid.push(drawRow(head, ry, 'head')); ry += rowH; }
  rows.forEach(cells => { grid.push(drawRow(cells, ry, 'row')); ry += rowH; });
  const off = head ? 1 : 0;
  return {
    id, panel: pan, rowH, colX: cx0, colW: cw, rows: nR, cols: cols.length, x0: bx, y0: by, x1: bx + bw, y1: by + tH, padX,
    cell: (r, c) => (grid[r + off] || [])[c], rowTop: r => by + (r + off) * rowH, rowBase: r => (grid[r + off] || [{}])[0].base,
  };
};

// ---------------------------------------------------------------- title and end cards
UI.stack = (items, o = {}) => {
  const cx = o.cx ?? W / 2;
  // 1. every block, relative to its own top (a text block's top is the cap top of its first line, its bottom the last baseline)
  const blocks = items.map(it => {
    const d = Object.assign({ size: o.size ?? 60 }, o.text, it);
    if (it.pill != null) {
      const size = d.size, st = sty(d), h = it.h ?? st.size * 1.75;
      return { kind: 'pill', d, h, top: 0, bottom: h, inkTop: 0, inkBot: h, gap: it.gap ?? o.gap ?? size * .5 };
    }
    if (it.draw) return { kind: 'draw', d, h: it.h, top: 0, bottom: it.h, inkTop: 0, inkBot: it.h, gap: it.gap ?? o.gap ?? d.size * .5 };
    const strs = (it.lines || [it.t]).map(String), st = sty(d), m = UI.metrics(st.font, st.weight, st.italic);
    const lh = it.lh ?? 1.12, pitch = it.pitch ?? lh * st.size;
    const i0 = inkOf(strs[0], st), i1 = inkOf(strs[strs.length - 1], st), b0 = m.cap * st.size, bL = b0 + (strs.length - 1) * pitch;
    return { kind: 'text', d, strs, st, pitch, top: 0, bottom: bL, b0, inkTop: b0 - i0.asc - st.lw / 2, inkBot: bL + i1.desc + st.lw / 2, gap: it.gap ?? o.gap ?? st.size * .4 };
  });
  // 2. stack them
  let y = 0;
  blocks.forEach((b, i) => { b.y = y; y += b.bottom + (i < blocks.length - 1 ? b.gap : 0); });
  const first = blocks[0], last = blocks[blocks.length - 1];
  const inkTop = first.y + first.inkTop, inkBot = last.y + last.inkBot;
  const shift = o.cy != null ? o.cy - (inkTop + inkBot) / 2 : (o.top ?? 0) - first.y;
  // 3. draw
  const boxes = blocks.map(b => {
    const y0 = b.y + shift;
    if (b.kind === 'pill') return UI.pill(b.d.pill, cx, y0 + b.h / 2, Object.assign({}, b.d, { fill: b.d.bg ?? '#ffe135', ink: b.d.ink ?? '#15111a', h: b.h, maxW: b.d.maxW ?? o.maxW }));
    if (b.kind === 'draw') { b.d.draw(cx, y0, y0 + b.h); return { x0: cx, y0, x1: cx, y1: y0 + b.h }; }
    return b.strs.map((s, j) => UI.write(s, cx, y0 + b.b0 + j * b.pitch, Object.assign({}, b.d, { align: 'center', maxW: b.d.maxW ?? o.maxW })));
  });
  const flat = boxes.flat();
  return Object.assign(boxes, { boxes, x0: Math.min(...flat.map(v => v.x0)), x1: Math.max(...flat.map(v => v.x1)), y0: inkTop + shift, y1: inkBot + shift });
};

// ---------------------------------------------------------------- rows and grids
UI.snap = (v, grid = 8) => Math.round(v / grid) * grid;
/* n boxes of width o.w between x0 and x1 with equal gaps; returns their left edges (o.centers: their centres) */
UI.rowX = (n, x0, x1, o = {}) => {
  const w = o.w ?? 0, gap = n > 1 ? (x1 - x0 - n * w) / (n - 1) : 0;
  if (n > 1 && gap < 0) fail(`row of ${n} boxes does not fit [${Math.ceil(n * w)} > ${Math.floor(x1 - x0)} px]`);
  let out = [];
  for (let i = 0; i < n; i++) out.push(n === 1 ? (x0 + x1) / 2 - w / 2 : x0 + i * (w + gap));
  if (o.snap) out = out.map(v => UI.snap(v, o.snap === true ? 8 : o.snap));
  if (o.centers) out = out.map(v => v + w / 2);
  out.gap = gap; out.w = w;
  return out;
};
/* cols x rows cells inside box with equal gaps (o.gap, or gapX / gapY); returns [x, y, w, h] row by row */
UI.gridX = (cols, rows, box, o = {}) => {
  const [bx, by, bw, bh] = box, gx = o.gapX ?? o.gap ?? 16, gy = o.gapY ?? o.gap ?? 16, cw = (bw - (cols - 1) * gx) / cols, chh = (bh - (rows - 1) * gy) / rows, out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([bx + c * (cw + gx), by + r * (chh + gy), cw, chh]);
  out.cellW = cw; out.cellH = chh; out.cols = cols; out.rows = rows;
  return out;
};
})();
