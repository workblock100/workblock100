'use strict';
/* SHIFT HAPPENS, Episode 21, "The Inspection": the HUD and split-screen kit, window.H21 (ep21_hud.js; owner ART). Contract: /tmp/shift_tools/briefs/A21_API.md; usage: GUIDE_ART21.md.
 * Pure functions of their arguments and t (no Math.random, no Date, no state). Every call saves and restores the context. All text through the UI kit, drawn live.
 * Sizes given in SCREEN pixels (line widths, label sizes) are converted through the current transform, so a reticle drawn inside a zoomed camera keeps a constant on-screen weight.
 *
 * AS BUILT
 *   H21.reticle(c, o)   o = { x, y (CENTRE of the target), w, h (target box; omit for a point: 110 screen px), t, t0, lock (0..1; omitted: eased from t0 over lockDur .55 s), color, label, sub, alpha,
 *                       labelPx (32), lw (screen px, 3), hero, id, flash (true) } -> [x0, y0, x1, y1] the bracket box (current units).
 *   H21.track(obj, t)   obj = { id, box [x0, y0, x1, y1] | boxAt(t) -> box, lag (.08 s), smooth (.1 s), jitter (screen px 1.2) } -> { x, y, w, h, box } (centre and size: feed it to reticle).
 *   H21.scan(c, o)      SCREEN. o = { t, t0, dur (1.2), dir 'down' | 'right' | 'up' | 'left', color, alpha, band (wake px 300), grid (true) } -> { pos, u } (the line's current y or x, progress) or null.
 *   H21.hudFrame(c, o)  SCREEN. o = { t, mode 'scan' | 'lock' | 'deficiency', count, alpha, color, chyron (true: stays clear of the clock pill and place label), text, wave (true) } -> { inner: [x0, y0, x1, y1] }.
 *   H21.split(c, o, drawLeft, drawRight)   SCREEN. o = { t, x (divider at mid height, 540), angle (0), gap (14), labelL, labelR, colorL, colorR, labelY (300), labelPx (34), faceCut ('error' | 'off') }
 *                       -> { L, R, xAt(y) }. drawLeft(c, box) / drawRight(c, box): box = { x0, y0, x1, y1, cx, cy, w, h, poly, side }; set your camera inside with H21.halfCam(c, box, cx, cy, z, rot).
 *   H21.halfCam(c, box, cx, cy, z = 1, rot = 0)   the transform that puts world point (cx, cy) at the centre of the half, zoom z.
 *   H21.stamp(c, o)     o = { x, y, s (1), rot (-.12), text ('SURVEYED'), t, t0 (impact), color ('#d3203a'), size (72), alpha, hero, id, ring (true), font ('Bangers') } -> { x0, y0, x1, y1, cx, cy, w, h, landed, k }.
 *   H21.CYAN, H21.RED: the two HUD colours.
 */
(() => {
if (typeof V2 === 'undefined') return;
const HD = window.H21 = window.H21 || {};
const CY = '#3ef2ff', RD = '#ff3b55';
HD.CYAN = CY; HD.RED = RD;
const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lp = (a, b, k) => a + (b - a) * k;
const sm = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const eOut = k => 1 - Math.pow(1 - cl(k), 3);
const eBack = (k, s = 1.6) => { k = cl(k); const c3 = s + 1; return 1 + c3 * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : hash(s * 3.17 + k * 11.3 + 1.3);
const seedOf = s => { let h = 7; for (const ch of String(s || '')) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h; };
const scr = c => { const m = c.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; };
const rgbOf = col => V2.rgb(col);
const rgba = (col, a) => { const [r, g, b] = rgbOf(col); return `rgba(${r | 0},${g | 0},${b | 0},${cl(a)})`; };
const UIok = () => typeof UI !== 'undefined';
/* a HUD stroke: a dark under-stroke (reads on pale walls), a soft wide glow, the crisp line */
function hudStroke(c, path, col, lw, alpha, S) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.globalAlpha *= alpha;
  c.strokeStyle = 'rgba(0,18,28,.42)'; c.lineWidth = (lw + 2.4) / S; path(); c.stroke();
  c.strokeStyle = rgba(col, .22); c.lineWidth = lw * 3.4 / S; path(); c.stroke();
  c.strokeStyle = col; c.lineWidth = lw / S; path(); c.stroke();
  c.restore();
}

// ================================================================== H21.reticle: brackets that close in, a ring that tightens, a tag that types in
HD.reticle = (c, o = {}) => {
  const S = scr(c), t = o.t ?? 0, col = o.color || CY, al = o.alpha ?? 1, lw = o.lw ?? 3;
  const ldur = o.lockDur ?? .55, k = o.lock != null ? cl(o.lock) : (o.t0 != null ? cl((t - o.t0) / ldur) : 1);
  if (al <= .004) return null;
  const w = o.w ?? 110 / S, h = o.h ?? 110 / S, x = o.x, y = o.y, e = eBack(k, 1.3), m = Math.max(w, h);
  const pad = lp(.42 * m + 34 / S, 8 / S, e), x0 = x - w / 2 - pad, x1 = x + w / 2 + pad, y0 = y - h / 2 - pad, y1 = y + h / 2 + pad;
  const arm = cl(Math.min(x1 - x0, y1 - y0) * lp(.34, .24, e), 14 / S, 64 / S), a0 = lp(.35, 1, sm(0, .35, k)) * al;
  c.save();
  /* the four corner brackets */
  const br = () => { c.beginPath(); for (const [cx, cy, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]]) { c.moveTo(cx, cy + dy * arm); c.lineTo(cx, cy); c.lineTo(cx + dx * arm, cy); } };
  hudStroke(c, br, col, lw * lp(1, 1.25, k), a0, S);
  /* the ring: wide and dashed while it hunts, tight and solid when locked; four ticks point at the target */
  const r = lp(m * .95 + 60 / S, m * .5 + 10 / S, e), rot = (1 - e) * 1.6 + t * .35 * (1 - k);
  c.save(); if (k < .999) c.setLineDash([16 / S, 10 / S]);
  hudStroke(c, () => { c.beginPath(); c.arc(x, y, r, rot, rot + PI * 2); }, col, lw * .7, a0 * lp(.5, .9, k), S);
  c.restore();
  hudStroke(c, () => { c.beginPath(); for (let i = 0; i < 4; i++) { const a = rot + i * PI / 2; c.moveTo(x + Math.cos(a) * (r + 10 / S), y + Math.sin(a) * (r + 10 / S)); c.lineTo(x + Math.cos(a) * (r - 12 / S), y + Math.sin(a) * (r - 12 / S)); } }, col, lw * .9, a0, S);
  /* the centre cross when locked (a gap in the middle so the target itself stays visible) */
  const ck = sm(.7, 1, k);
  if (ck > .01) { const g = 10 / S, L = 26 / S; hudStroke(c, () => { c.beginPath(); c.moveTo(x - g - L, y); c.lineTo(x - g, y); c.moveTo(x + g, y); c.lineTo(x + g + L, y); c.moveTo(x, y - g - L); c.lineTo(x, y - g); c.moveTo(x, y + g); c.lineTo(x, y + g + L); }, col, lw * .8, al * ck, S); }
  /* the lock pulse: ONE expanding ring that fades as the lock completes (not a strobe) */
  if (o.flash !== false && o.t0 != null && o.lock == null) {
    const age = t - (o.t0 + ldur);
    if (age >= 0 && age < .4) { const u = age / .4; hudStroke(c, () => { c.beginPath(); c.arc(x, y, r * lp(1, 1.5, eOut(u)), 0, PI * 2); }, col, lw * lp(1.6, .6, u), al * (1 - u) * .8, S); }
  }
  c.restore();
  /* the tag: a dark pill above the box; the string types in during the last part of the lock, a block cursor while it types */
  if (o.label && UIok()) {
    const px = o.labelPx ?? 32, size = px / S, rv = o.reveal ?? sm(.5, 1, k), hero = o.hero ?? (px >= 30 && rv >= 1);
    const ty = y0 - (12 + px * .9) / S;
    if (rv > .01) {
      const P = UI.pill(o.label, x, ty, { size, font: 'Nunito', weight: 900, ink: col, fill: 'rgba(4,18,26,.82)', stroke: col, lw: 2.2 / S, h: px * 1.62 / S, padX: px * .55 / S, hero, alpha: al * sm(0, .25, rv), spacing: px * .04 / S, id: o.id, text: { reveal: rv } });
      if (rv < 1 && P) { const cxr = lp(P.x0 + px * .55 / S, P.x1 - px * .55 / S, rv); c.save(); c.globalAlpha *= al * (Math.floor(t * 6) % 2 ? .9 : .4); c.fillStyle = col; c.fillRect(cxr, ty - px * .36 / S, px * .32 / S, px * .72 / S); c.restore(); }
      if (o.sub && rv >= 1) UI.label(o.sub, x, y1 + (14 + px * .5) / S, { size: size * .8, fill: col, stroke: 'rgba(0,18,28,.8)', lw: 5 / S, hero: o.subHero ?? (px * .8 >= 30), alpha: al });
    }
  }
  return [x0, y0, x1, y1];
};

// ================================================================== H21.track: a smoothed, slightly lagging box (a fixed time offset of the object's own motion; no state)
HD.track = (obj, t) => {
  const lag = obj.lag ?? .08, win = obj.smooth ?? .1, sd = seedOf(obj.id), S = (typeof ctx !== 'undefined' && ctx) ? scr(ctx) : 1, jit = (obj.jitter ?? 1.2) / S;
  let b;
  if (typeof obj.boxAt === 'function') {
    const acc = [0, 0, 0, 0], N = 5;
    for (let i = 0; i < N; i++) { const q = obj.boxAt(t - lag - win * i / (N - 1)); for (let j = 0; j < 4; j++) acc[j] += q[j] / N; }
    b = acc;
  } else b = (obj.box || [0, 0, 0, 0]).slice();
  const jx = jit * vnoise(t * 6.3 + sd), jy = jit * vnoise(t * 5.7 + sd + 17);
  const x0 = b[0] + jx, y0 = b[1] + jy, x1 = b[2] + jx, y1 = b[3] + jy;
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, box: [x0, y0, x1, y1] };
};

// ================================================================== H21.scan: a bright line with a fading wake and a faint grid, swept across the frame (screen blend; the caption zone gets light haze only)
const CAP0 = 1380, CAP1 = 1700;
HD.scan = (c, o = {}) => {
  const t = o.t ?? 0, t0 = o.t0 ?? 0, dur = o.dur ?? 1.2, u = (t - t0) / dur;
  if (u < 0 || u > 1.15) return null;
  const col = o.color || CY, al = (o.alpha ?? 1) * (1 - sm(1, 1.15, u)), dir = o.dir || 'down', vert = dir === 'down' || dir === 'up', span = vert ? H : W, band = o.band ?? 300;
  const e = u < 1 ? (u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2) : 1, rev = dir === 'up' || dir === 'left', pos = rev ? lp(span + 20, -20, e) : lp(-20, span + 20, e), sg = rev ? 1 : -1;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'screen';
  const pass = (a, clipFn) => {
    c.save(); if (clipFn) clipFn(); c.globalAlpha *= a;
    /* the wake */
    const w0 = pos + sg * band, gx = vert ? c.createLinearGradient(0, w0, 0, pos) : c.createLinearGradient(w0, 0, pos, 0);
    gx.addColorStop(0, rgba(col, 0)); gx.addColorStop(1, rgba(col, .26)); c.fillStyle = gx;
    if (vert) c.fillRect(0, Math.min(w0, pos), W, band); else c.fillRect(Math.min(w0, pos), 0, band, H);
    /* the grid, only inside the wake */
    if (o.grid !== false) {
      c.save(); c.beginPath(); if (vert) c.rect(0, Math.min(w0, pos), W, band); else c.rect(Math.min(w0, pos), 0, band, H); c.clip();
      c.strokeStyle = rgba(col, .2); c.lineWidth = 1.5; c.beginPath();
      for (let x = 30; x < W; x += 60) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 0; y < H; y += 60) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); c.restore();
    }
    /* the line: a glow and a hot core */
    if (vert) { c.fillStyle = rgba(col, .3); c.fillRect(0, pos - 9, W, 18); c.fillStyle = 'rgba(225,255,255,.95)'; c.fillRect(0, pos - 1.6, W, 3.2); }
    else { c.fillStyle = rgba(col, .3); c.fillRect(pos - 9, 0, 18, H); c.fillStyle = 'rgba(225,255,255,.95)'; c.fillRect(pos - 1.6, 0, 3.2, H); }
    c.restore();
  };
  pass(al, () => { c.beginPath(); c.rect(0, 0, W, CAP0); c.rect(0, CAP1, W, H - CAP1); c.clip(); });
  pass(al * .22, () => { c.beginPath(); c.rect(0, CAP0, W, CAP1 - CAP0); c.clip(); });
  c.restore();
  if (window.V2 && V2.emit) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); if (vert) for (let x = 90; x < W; x += 180) V2.emit(x, pos, 60, col, .25 * al); else for (let y = 120; y < CAP0; y += 200) V2.emit(pos, y, 60, col, .25 * al); c.restore(); }
  return { pos, u: cl(u) };
};
// ================================================================== H21.hudFrame: the scanner's lens frame: corner brackets, a ruler, a mode chip with a 1 Hz dot, a deficiency count, a tiny waveform (all clear of the caption zone)
HD.hudFrame = (c, o = {}) => {
  const t = o.t ?? 0, mode = o.mode || 'scan', al = o.alpha ?? 1;
  if (al <= .004) return null;
  const col = o.color || (mode === 'deficiency' ? RD : CY), top = o.top ?? (o.chyron === false ? 70 : 262), bot = o.bottom ?? 1352, L = 46, R = W - 46, arm = 92;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(W / 2, H * .4, H * .26, W / 2, H * .42, H * .72); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, .15 * al)); c.fillStyle = g; c.fillRect(0, 0, W, CAP0); c.restore();
  hudStroke(c, () => { c.beginPath(); for (const [cx, cy, dx, dy] of [[L, top, 1, 1], [R, top, -1, 1], [R, bot, -1, -1], [L, bot, 1, -1]]) { c.moveTo(cx, cy + dy * arm); c.lineTo(cx, cy); c.lineTo(cx + dx * arm, cy); } }, col, 5, al, 1);
  hudStroke(c, () => { c.beginPath(); for (let x = L + 300, i = 0; x < R - 110; x += 40, i++) { c.moveTo(x, bot); c.lineTo(x, bot - (i % 4 === 0 ? 16 : 8)); } }, col, 2, al * .6, 1);
  let chip = null;
  if (UIok()) {
    const txt = o.text || (mode === 'deficiency' ? 'DEFICIENCY FOUND' : mode === 'lock' ? 'TARGET LOCKED' : 'SCANNING'), def = mode === 'deficiency';
    chip = UI.pill(txt, R - 14, top + 46, { anchor: 'right', size: 32, font: 'Nunito', weight: 900, ink: def ? '#ffffff' : col, fill: def ? rgba(RD, .92) : 'rgba(4,18,26,.8)', stroke: def ? '#ffffff' : col, lw: 2.4, h: 54, padX: 20, hero: true, alpha: al, spacing: 1.5, id: 'h21mode' });
    const blink = def ? 1 : (Math.floor(t * 2) % 2 ? .35 : 1);
    c.fillStyle = rgba(def ? RD : '#ff4060', al * blink); c.beginPath(); c.arc(chip.x0 - 20, top + 46, 9, 0, PI * 2); c.fill();
    if (o.count != null) UI.label((o.countText || 'DEFICIENCIES: ') + o.count, R - 14, top + 110, { align: 'right', size: 30, fill: col, stroke: 'rgba(0,16,24,.85)', lw: 6, hero: true, alpha: al });
  }
  if (o.wave !== false) {
    const wx0 = L + 26, wx1 = wx0 + 230, wy = bot - 42, amp = mode === 'deficiency' ? 20 : mode === 'lock' ? 8 : 13;
    hudStroke(c, () => { c.beginPath(); for (let i = 0; i <= 64; i++) { const u = i / 64, x = lp(wx0, wx1, u), spike = mode === 'deficiency' && Math.sin(u * 7 - t * 5) > .8 ? 1.3 : 0, v = Math.sin(u * 19 + t * 9) * .55 + Math.sin(u * 47 - t * 13) * .3 + spike; const y = wy - v * amp * sm(0, .12, u) * sm(1, .88, u); i ? c.lineTo(x, y) : c.moveTo(x, y); } }, col, 2.2, al * .9, 1);
  }
  c.restore();
  return { inner: [L, top, R, bot], chip };
};

// ================================================================== H21.split: two halves, each through its own camera and clip; a crisp white divider with a soft shadow; a label chip at the top of each half
HD.halfCam = (c, box, cx, cy, z = 1, rot = 0) => { c.setTransform(1, 0, 0, 1, 0, 0); c.translate(box.cx, box.cy); if (rot) c.rotate(rot); c.scale(z, z); c.translate(-cx, -cy); };
function clipHalf(b, B) {   /* the bounding box of a screen rectangle cut by the half's side of the divider, or null */
  const f = p => B.side === 'L' ? B.xAt(p[1]) - p[0] : p[0] - B.xAt(p[1]);
  let pts = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], out = [];
  for (let i = 0; i < pts.length; i++) {
    const P = pts[i], Q = pts[(i + 1) % pts.length], fp = f(P), fq = f(Q);
    if (fp >= 0) out.push(P);
    if ((fp >= 0) !== (fq >= 0)) { const u = fp / (fp - fq); out.push([lp(P[0], Q[0], u), lp(P[1], Q[1], u)]); }
  }
  if (out.length < 3) return null;
  const xs = out.map(p => p[0]), ys = out.map(p => p[1]), q = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  return q[2] - q[0] < .5 || q[3] - q[1] < .5 ? null : q;
}
function trimReg(n0, B, o) {   /* what a half registered for the layout audit is cut to the part of the screen that half shows */
  if (typeof REG === 'undefined' || !REG.items || REG.items.length <= n0) return;
  const keep = REG.items.slice(0, n0);
  for (let i = n0; i < REG.items.length; i++) {
    const it = REG.items[i], b = it.box;
    if (!b) { keep.push(it); continue; }
    const q = clipHalf(b, B);
    if (!q) continue;
    const a0 = (b[2] - b[0]) * (b[3] - b[1]), a1 = (q[2] - q[0]) * (q[3] - q[1]);
    if (it.type === 'face' && !it.transit && o.faceCut !== 'off' && a0 > 0 && a1 < a0 * .9) REG.errors.push(`face:${it.id || '?'} is cut by the split-screen divider (${Math.round(100 - a1 / a0 * 100)}% hidden)`);
    it.box = q; keep.push(it);
  }
  REG.items.length = 0; for (const it of keep) REG.items.push(it);
}
HD.split = (c, o = {}, drawLeft, drawRight) => {
  const x = o.x ?? W / 2, ang = o.angle || 0, g = o.gap ?? 14, tn = Math.tan(ang), xAt = y => x + (y - H / 2) * tn;
  const yT = -40, yB = H + 40, xT = xAt(yT), xB = xAt(yB);
  const mk = (poly, side) => { const xs = poly.map(p => p[0]), x0 = Math.max(0, Math.min(...xs)), x1 = Math.min(W, Math.max(...xs)); return { x0, y0: 0, x1, y1: H, cx: (x0 + x1) / 2, cy: H / 2, w: Math.max(0, x1 - x0), h: H, poly, side, xAt: y => xAt(y) + (side === 'L' ? -g / 2 : g / 2) }; };
  const L = mk([[-40, yT], [xT - g / 2, yT], [xB - g / 2, yB], [-40, yB]], 'L'), R = mk([[xT + g / 2, yT], [W + 40, yT], [W + 40, yB], [xB + g / 2, yB]], 'R');
  const run = (B, fn) => {
    if (!fn || B.w < 2) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); B.poly.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.clip();
    const n0 = (typeof REG !== 'undefined' && REG.items) ? REG.items.length : 0;
    try { fn(c, B); } finally { c.restore(); }
    trimReg(n0, B, o);
  };
  run(L, drawLeft); run(R, drawRight);
  /* the divider: soft shadows falling on both halves, a crisp white band, a thin edge in each half's colour */
  const colL = o.colorL || '#2456b8', colR = o.colorR || '#e0542e', nx = Math.cos(ang), ny = -Math.sin(ang), xm = xAt(H / 2);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  for (const sd of [-1, 1]) {
    const e0 = [xm + sd * g / 2, H / 2], e1 = [e0[0] + sd * nx * 30, e0[1] + sd * ny * 30], gr = c.createLinearGradient(e0[0], e0[1], e1[0], e1[1]);
    gr.addColorStop(0, 'rgba(6,10,24,.42)'); gr.addColorStop(1, 'rgba(6,10,24,0)'); c.fillStyle = gr;
    c.beginPath(); c.moveTo(xT + sd * g / 2, yT); c.lineTo(xB + sd * g / 2, yB); c.lineTo(xB + sd * (g / 2 + 34), yB); c.lineTo(xT + sd * (g / 2 + 34), yT); c.closePath(); c.fill();
  }
  if (g > .5) {
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(xT - g / 2, yT); c.lineTo(xT + g / 2, yT); c.lineTo(xB + g / 2, yB); c.lineTo(xB - g / 2, yB); c.closePath(); c.fill();
    c.lineWidth = 3; for (const [sd, col] of [[-1, colL], [1, colR]]) { c.strokeStyle = col; c.beginPath(); c.moveTo(xT + sd * (g / 2 - 1.5), yT); c.lineTo(xB + sd * (g / 2 - 1.5), yB); c.stroke(); }
  }
  c.restore();
  /* the labels: a chip centred in each half, wholly inside it (shrunk to fit; skipped when the half is too narrow) */
  if (UIok()) {
    const ly = o.labelY ?? 300, px = o.labelPx ?? 34;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    for (const [B, txt, col] of [[L, o.labelL, colL], [R, o.labelR, colR]]) {
      if (!txt) continue;
      const e0 = Math.min(B.xAt(ly - px), B.xAt(ly + px)), e1 = Math.max(B.xAt(ly - px), B.xAt(ly + px)), a = B.side === 'L' ? 0 : e1, b = B.side === 'L' ? e0 : W, room = b - a - 100;
      if (room < 200) continue;
      UI.pill(txt, (a + b) / 2, ly, { size: px, font: 'Nunito', weight: 900, fill: col, ink: '#ffffff', stroke: '#ffffff', lw: 3, h: px * 1.66, padX: px * .62, hero: true, maxW: room, spacing: 1.2, id: 'h21split' + B.side, alpha: o.labelAlpha ?? 1 });
    }
    c.restore();
  }
  return { L, R, xAt };
};

// ================================================================== H21.stamp: a rubber stamp that slams in, squashes, rings out a little ink and rests (mottled ink; the text through the UI kit)
const INKP = new Map();
function inkPattern(col) {
  if (INKP.has(col)) return INKP.get(col);
  const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N; cv.__txOK = true;
  const g = cv.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, N, N);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 80; i++) { const x = rnd(4101, i) * N, y = rnd(4102, i) * N, r = .7 + 3.4 * Math.pow(rnd(4103, i), 2); g.globalAlpha = .22 + .5 * rnd(4104, i); g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.fill(); }
  for (let i = 0; i < 10; i++) { g.globalAlpha = .14; g.fillRect(0, rnd(4105, i) * N, N, 1 + rnd(4106, i) * 1.4); }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const pat = (typeof mainCtx !== 'undefined' ? mainCtx : g).createPattern(cv, 'repeat');
  INKP.set(col, pat); return pat;
}
const rrp = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); };
HD.stamp = (c, o = {}) => {
  const t = o.t ?? 0, t0 = o.t0 ?? 0, age = t - t0, pre = o.pre ?? .14;
  if (age < -pre || !UIok()) return null;
  const s = o.s ?? 1, size = (o.size ?? 72) * s, col = o.color || '#d3203a', font = o.font || 'Bangers', text = String(o.text ?? 'SURVEYED'), sd = seedOf(text) + (o.seed || 0);
  const lim = o.tilt ?? .2, rot = cl(o.rot ?? -.12, -lim, lim);
  let sc = 1, sx = 1, sy = 1, al = o.alpha ?? .94;
  if (age < 0) { const u = (age + pre) / pre; sc = lp(1.9, 1, u * u); al *= sm(0, .45, u); }
  else { const d = Math.exp(-age / .075), osc = Math.cos(age * 36) * d; sx = 1 + .12 * osc; sy = 1 - .15 * osc; }
  const spacing = size * .04, met = UI.metrics(font, 400), ink = UI.sizeOf(text, { size, font, weight: 400, spacing });
  const padX = size * .5, padY = size * .34, lwB = Math.max(4, size * .1), w = ink.w + 2 * padX, h = met.cap * size + 2 * padY, rad = size * .18;
  const pat = inkPattern(col), id = o.id || ('h21stamp' + sd);
  c.save(); c.translate(o.x, o.y); c.rotate(rot); c.scale(sc * sx, sc * sy);
  if (age >= 0 && o.ring !== false && age < .45) { const u = age / .45, k2 = 1 + .24 * eOut(u); c.save(); c.strokeStyle = rgba(col, .42 * (1 - u)); c.lineWidth = lwB * (1.3 - u); rrp(c, -w * k2 / 2, -h * k2 / 2, w * k2, h * k2, rad * k2); c.stroke(); c.restore(); }
  if (age >= 0) {   /* a few specks of ink thrown just outside the border at the impact (they stay) */
    c.save(); c.fillStyle = col;
    for (let i = 0; i < 12; i++) { const a = rnd(4201 + sd, i) * PI * 2, q = rnd(4202 + sd, i), r = size * (.018 + .03 * rnd(4203 + sd, i)); c.globalAlpha = al * .7 * sm(0, .05, age); c.beginPath(); c.arc(Math.cos(a) * w / 2 * (1.05 + .12 * q), Math.sin(a) * h / 2 * (1.1 + .3 * q), r, 0, PI * 2); c.fill(); }
    c.restore();
  }
  c.save(); c.globalAlpha *= al; c.strokeStyle = pat; c.lineJoin = 'round';
  c.lineWidth = lwB; rrp(c, -w / 2, -h / 2, w, h, rad); c.stroke();
  c.lineWidth = Math.max(2, lwB * .35); rrp(c, -w / 2 + lwB * 1.6, -h / 2 + lwB * 1.6, w - lwB * 3.2, h - lwB * 3.2, rad * .55); c.stroke();
  c.restore();
  UI.container(id, 'stamp', [-w / 2, -h / 2, w / 2, h / 2], Math.max(lwB + 4, size * .22));
  const hero = o.hero ?? (age > .12 && size * scr(c) >= 30);
  UI.label(text, 0, 0, { size, font, weight: 400, spacing, fill: pat, hero, alpha: al, cid: id, center: true, tilt: lim + .05, crop: age < 0, grp: o.grp });
  c.restore();
  const cs = Math.cos(rot), sn = Math.sin(rot), ex = Math.abs(cs) * w / 2 + Math.abs(sn) * h / 2, ey = Math.abs(sn) * w / 2 + Math.abs(cs) * h / 2;
  return { x0: o.x - ex, y0: o.y - ey, x1: o.x + ex, y1: o.y + ey, cx: o.x, cy: o.y, w, h, landed: age >= 0, k: cl(age / .3) };
};
})();
