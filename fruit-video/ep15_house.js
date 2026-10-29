'use strict';
/* SHIFT HAPPENS, Episode 15: the tower kit, window.S15 (owner E15-K). Guide: GUIDE_S15.md. Assembled from build/ep15_k/parts/*.js by build/ep15_k/assemble.sh.
 * The Fruit Bowl dollhouse (S14, drawn by S14.back/S14.front in three floor bands, so the building can squat and sink) with the Greenleaf dollhouse stacked on its roof (12 rooms, cached art, live bits),
 * the Executive Suite, the crane (mast, jib, counter-jib, cab, trolley, hook block, spreader, four slings), the sky, the lot and the ground cutaway (soil, roots, a worm, a pipe, the sunk lobby), the signs.
 * Helpers marked (S14) are copied from ep14_house.js, where they are private. Everything is a pure function of (lt, st); static art is cached at 2x/3x, lettering is drawn live through UI.
 *
 * Tower coordinates are S14's. Fruit Bowl y 340..1342; Greenleaf (docked) y -686..316; Executive Suite (docked) y -1016..-686; ground line 1342; crane mast x 1300. */
(() => {
if (!window.TIMELINE_EP15 || !window.S14 || !window.UI) return;
const S14 = window.S14;
const S15 = window.S15 = {};

// ================================================================================================ geometry
const T = 12, RW = 250, RH = 318, PITCH = 330, X0 = 10, X1 = 1070, GY = 1342;
const COL = [22, 284, 546, 808];
const FB_ROW = [352, 682, 1012], FB_BAND = [[340, 670], [670, 1000], [1000, 1342]];   /* the three floor bands of Fruit Bowl (row 0 = top); each owns the slab on its top */
const GL_BOT = 274, GL_H = 1002, GL_CY = GL_BOT - GL_H / 2;   /* docked Greenleaf: its underside rests on the roof's ridge cap (y 274); GL_CY is the centre of the block (-227) */
const GL_ROW = [GL_BOT - 12 - RH - 2 * PITCH, GL_BOT - 12 - RH - PITCH, GL_BOT - 12 - RH];   /* -716, -386, -56 */
const EX_Y0 = GL_BOT - GL_H - RH, EX_FLOOR = EX_Y0 + RH - 14, EX_TOP = EX_Y0 - T;   /* the Executive Suite: room top -1046, roof above -1058 */
const MAST_X = 1300, JIB_Y = -1700;
S15.GEOM = { T, RW, RH, PITCH, X0, X1, GY, COL, FB_ROW, GL_ROW, GL_BOT, GL_H, GL_CY, EX_Y0, MAST_X, JIB_Y, W: X1 - X0 };
S15.S = S14.S;
const GDEF = { gsky: [0, 0], gsalad: [1, 0], gzen: [2, 0], gsun: [3, 0], gwell: [0, 1], gstation: [1, 1], gmed: [2, 1], gart: [3, 1], globby: [0, 2], gdining: [1, 2], gtherapy: [2, 2], gfish: [3, 2] };
const GNAMES = { gsky: 'SKY GARDEN', gsalad: 'SALAD BAR', gzen: 'MEDITATION ROOM', gsun: 'SUNROOM', gwell: 'WELLNESS ROOM', gstation: "NURSES' STATION", gmed: 'MED ROOM', gart: 'ART ROOM',
  globby: 'LOBBY', gdining: 'DINING ROOM', gtherapy: 'THERAPY GARDEN', gfish: 'FISH TANK LOUNGE' };
const FBROW_OF = {}; for (const id of S14.ids) FBROW_OF[id] = S14.rect(id).row;
S15.fbIds = S14.ids.slice(); S15.glIds = Object.keys(GDEF); S15.ids = S15.fbIds.concat(S15.glIds, ['exec']);
S15.names = Object.assign({}, S14.names, GNAMES, { exec: 'EXECUTIVE SUITE' });
S15.floors = ['fb ground', 'fb middle', 'fb top', 'gl bottom', 'gl middle', 'gl top', 'exec'];

// ================================================================================================ small helpers (S14)
const clamp01 = v => Math.max(0, Math.min(1, v));
const parse = c => { c = String(c).replace('#', ''); if (c.length === 3) c = c.replace(/./g, '$&$&'); const n = parseInt(c, 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hexOf = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => hexOf(parse(c).map(v => v * f));
const lift = (c, t) => hexOf(parse(c).map(v => v + (255 - v) * t));
const mixc = (a, b, t) => { const A = parse(a), B2 = parse(b); return hexOf(A.map((v, i) => v + (B2[i] - v) * t)); };
const rgba = (c, a) => { const [r, g, b] = parse(c); return `rgba(${r},${g},${b},${a})`; };
const rnd = (seed) => { let a = (seed * 2654435761) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const OUT = 'rgba(38,24,40,.78)';
const hz = (t, f, ph = 0) => Math.sin(t * TAU * f + ph);
function withCtx(g, fn) { const prev = ctx; ctx = g; try { fn(); } finally { ctx = prev; } }
const warned = new Set();
function guard(name, fn) { try { fn(); } catch (e) { if (!warned.has(name + e.message)) { warned.add(name + e.message); console.error('S15 ' + name + ': ' + (e && e.stack || e)); } } }
function view(m = 80) {
  const z = CAM && CAM.z || 1, k = CAM && Math.abs(CAM.r || 0) > .002 ? 1.6 : 1, hw = W / 2 / z * k + m, hh = H / 2 / z * k + m, cx = CAM ? CAM.x : W / 2, cy = CAM ? CAM.y : H / 2;
  return { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
}
const seen = (v, x0, y0, x1, y1) => x1 > v.x0 && x0 < v.x1 && y1 > v.y0 && y0 < v.y1;
function path(pts) { ctx.beginPath(); for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function poly(pts, fill, stroke, lw = 2) {
  path(pts);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function vg(y0, y1, c0, c1, c2) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); if (c2) { g.addColorStop(.5, c1); g.addColorStop(1, c2); } else g.addColorStop(1, c1); return g; }
function hg(x0, x1, c0, c1) { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
function rg(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }
function ln(x0, y0, x1, y1, stroke, lw = 1.5, cap = 'round') { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function ell(x, y, rx, ry, fill, stroke, lw = 1.6, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function rb(x, y, w, h, fill, o = {}) {
  const r = o.r ?? 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = o.flat ? fill : vg(y, y + h, lift(fill, .13), shade(fill, .87)); ctx.fill();
  if (o.lw !== 0) { ctx.lineWidth = o.lw ?? 1.8; ctx.strokeStyle = o.stroke ?? OUT; ctx.lineJoin = 'round'; ctx.stroke(); }
  if (!o.flat && !o.nohi && h > 8 && w > 8) { ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + r + 1, y + 2.4); ctx.lineTo(x + w - r - 1, y + 2.4); ctx.stroke(); }
}
function fsh(x, y, w, a = .3, h = 7) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, h / Math.max(1, w / 2));
  ctx.fillStyle = rg(0, 0, 0, w / 2, [[0, `rgba(25,14,30,${a})`], [.6, `rgba(25,14,30,${a * .5})`], [1, 'rgba(25,14,30,0)']]);
  ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, TAU); ctx.fill(); ctx.restore();
}
function stripesV(x0, y0, x1, y1, step, lw, col, off = 0) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; for (let x = x0 + off; x < x1; x += step) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); } }
function stripesH(x0, y0, x1, y1, step, lw, col, off = 0) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; for (let y = y0 + off; y < y1; y += step) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); } }
function dotsGrid(x0, y0, x1, y1, step, r, col, stagger = true) { ctx.fillStyle = col; let row = 0; for (let y = y0; y < y1; y += step * .86, row++) for (let x = x0 + (stagger && row % 2 ? step / 2 : 0); x < x1; x += step) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); } }
function tileGrid(x0, y0, x1, y1, tw, th, grout, lw = 1.2, brick = false) { ctx.strokeStyle = grout; ctx.lineWidth = lw; let row = 0; for (let y = y0; y <= y1 + .1; y += th, row++) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); for (let x = x0 + (brick && row % 2 ? tw / 2 : 0); x <= x1; x += tw) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + th); ctx.stroke(); } } }
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };

// ================================================================================================ text (S14): dressing never complains, signs are hero when whole and clear
S15.keepOut = [];
const scrFrame = () => { const S = EP && EP.SCENES && CUR ? EP.SCENES[CUR.id] || {} : {}; return S; };
function screenOf(x0, y0, x1, y1) {
  const m = ctx.getTransform(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) { const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return { x0: a, y0: b, x1: c, y1: d, sc: Math.hypot(m.a, m.b) };
}
function heroNow(x0, y0, x1, y1, sizePx) {
  const b = screenOf(x0, y0, x1, y1), S = scrFrame();
  if (sizePx * b.sc < 31) return false;
  if (b.x0 < 44 || b.y0 < 44 || b.x1 > W - 44 || b.y1 > H - 44) return false;
  if (!S.noScrim && b.y1 > 1374 && b.y0 < 1706) return false;
  if (!S.noChyron && b.x1 > 44 && b.x0 < 506 && b.y1 > 110 && b.y0 < 250) return false;
  return true;
}
function dressGuard(x0, y0, x1, y1) {
  const b = screenOf(x0, y0, x1, y1), S = scrFrame();
  let d = Math.min(b.x0 - 44, b.y0 - 44, W - 44 - b.x1, H - 44 - b.y1);
  if (!S.noScrim) d = Math.min(d, Math.max(1374 - b.y1, b.y0 - 1706));
  if (!S.noChyron) d = Math.min(d, Math.max(44 - b.x1, b.x0 - 506, 110 - b.y1, b.y0 - 250));
  let a = d >= 0 ? 1 : clamp01(1 + d / 20);
  for (const R of (S14.keepOut || []).concat(S15.keepOut || [])) {
    const gap = Math.max(R[0] - b.x1, b.x0 - R[2], R[1] - b.y1, b.y0 - R[3]), ar = gap >= 6 ? 1 : clamp01((gap + 6) / 12);
    a = Math.min(a, 1 - (R[4] ?? 1) * (1 - ar));
  }
  return a;
}
function dress(str, cx, cy, size, o = {}) {
  const w = Math.min(o.maxW || 1e9, UI.sizeOf(str, { size, weight: o.weight, spacing: o.spacing, font: o.font, italic: o.italic }).w), hw = o.align === 'left' ? [0, w] : o.align === 'right' ? [-w, 0] : [-w / 2, w / 2];
  const a = dressGuard(cx + hw[0], cy - size * .6, cx + hw[1], cy + size * .6);
  if (a < .02) return;
  if (a < 1) { ctx.save(); ctx.globalAlpha *= a; }
  UI.label(str, cx, cy, Object.assign({ size, hero: false, crop: true, fill: '#2a2230' }, o));
  if (a < 1) ctx.restore();
}
function plate(box, lines, o = {}) {
  const [x, y, w, h] = box, size = o.size ?? 20, hero = o.hero !== false && heroNow(x, y, x + w, y + h, o.heroSize ?? size);
  const a = hero || o.guard === false ? 1 : dressGuard(x, y, x + w, y + h);
  if (a < .02) return null;
  if (a < 1) { ctx.save(); ctx.globalAlpha *= a; }
  const r = UI.sign(box, lines, Object.assign({ fill: '#f2e8cf', ink: '#2a2230', stroke: '#2a2230', lw: 2, size, hero, crop: !hero }, o, { hero, crop: !hero }));
  if (a < 1) ctx.restore();
  return r;
}

// ================================================================================================ the state: sink, squat, block pose
/* Everything in the tower follows from three numbers: the sink (px), the squat (px) and the Greenleaf block pose. */
function STATE(st) {
  st = st || {};
  const sink = (st.sink || 0) * PITCH, squat = Math.max(0, st.squat || 0), stack = st.stack === 0 ? 0 : 1;
  const bp = st.blockPose || null;
  /* where the Greenleaf block is (its centre) in tower coordinates (before the sink) */
  let gx = 540, gy = GL_CY + squat, ga = 0;
  if (!stack && bp) { gx = bp.x; gy = bp.y; ga = bp.angle || 0; }
  else if (!stack) { gy = GL_CY - 560; }
  else if (bp) { gx = bp.x ?? 540; gy = bp.y ?? gy; ga = bp.angle || 0; }
  return { sink, squat, stack, gx, gy, ga, st };
}
S15.blockXform = st => { const s = STATE(st); return { dx: s.gx - 540, dy: s.gy - GL_CY + s.sink, rot: s.ga }; };
/* maps a point given in DOCKED Greenleaf coordinates through the block pose to the world (tower) */
S15.toWorld = (x, y, st) => { const s = STATE(st), c = Math.cos(s.ga), n = Math.sin(s.ga), px = x - 540, py = y - GL_CY; return [s.gx + px * c - py * n, s.gy + px * n + py * c + s.sink]; };
/* Fruit Bowl floor band k (0 top, 1 middle, 2 ground): the vertical map of a band under squat and sink: y' = bb' - (bb - y) * sy */
function bandMap(s, k) {
  const bb = FB_BAND[k][1], below = 2 - k, sy = 1 - s.squat / (3 * PITCH), dy = s.sink + below * s.squat / 3;
  return { bb, sy, dy, f: y => bb + dy - (bb - y) * sy };
}
function rectOf(id, s) {
  if (GDEF[id]) {
    const [col, row] = GDEF[id], x0 = COL[col], y0 = GL_ROW[row], c = Math.cos(s.ga), n = Math.sin(s.ga);
    const cx = x0 + RW / 2, cyy = y0 + RH / 2, px = cx - 540, py = cyy - GL_CY, wx = s.gx + px * c - py * n, wy = s.gy + px * n + py * c + s.sink;
    const dy = wy - cyy, dx = wx - cx;
    return { id, bld: 'gl', col, row, span: 1, x0: x0 + dx, y0: y0 + dy, x1: x0 + RW + dx, y1: y0 + RH + dy, w: RW, h: RH, cx: wx, cy: wy, floor: y0 + RH - 14 + dy };
  }
  if (id === 'exec') {
    const e = execPlace(s);
    return { id, bld: 'exec', col: 0, row: 0, span: 4, x0: e.x0 + 12, y0: e.y0, x1: e.x0 + 12 + 1036, y1: e.y0 + RH, w: 1036, h: RH, cx: e.x0 + 530, cy: e.y0 + RH / 2, floor: e.y0 + RH - 14 };
  }
  const r = S14.rect(id), m = bandMap(s, r.row), y0 = m.f(r.y0), y1 = m.f(r.y1);
  return Object.assign({}, r, { bld: 'fb', y0, y1, h: y1 - y0, cy: (y0 + y1) / 2, floor: m.f(r.floor) });
}
/* the Executive Suite: docked on the Greenleaf roof (it rides the block), or placed at st.execAt = [x, yBottom] (bottom centre of its slab) */
function execPlace(s) {
  const at = s.st.execAt;
  let x0 = X0 + (s.gx - 540), y0 = EX_Y0 + (s.gy - GL_CY) + s.sink;   /* docked: rides the Greenleaf block */
  if (at) { x0 = at[0] - 530; y0 = at[1] - RH - T; }
  return { x0, y0 };
}
S15.rect = (id, st) => { if (!(id in GDEF) && id !== 'exec' && !S14.ids.includes(id)) throw new Error('S15.rect: unknown room ' + id); return rectOf(id, STATE(st)); };
S15.at = (id, u, dy = 0, st) => { const r = S15.rect(id, st); return [r.x0 + u * r.w, r.floor + dy]; };
S15.who = (id, ctor, u, extra = {}, st) => { const [x, y] = S15.at(id, u, 0, st); return ctor(Object.assign({ x, y, s: S14.S }, extra)); };
S15.floorY = (i, st) => {
  const s = STATE(st), ids = ['lobby', 'r4', 'office', 'globby', 'gwell', 'gsky', 'exec'];
  return rectOf(ids[i], s).floor;
};
S15.walk = (...a) => S14.walk(...a); S15.run = (...a) => S14.run(...a); S15.move = (...a) => S14.move(...a);
S15.zoomRoom = (id, z, dy = 0, st) => { const r = S15.rect(id, st); window.H6.zoomTo(r.cx, r.cy + dy, z); };

// ================================================================================================ the sky (time of day), the hills, the lot, the ground cutaway
const SKYK = [
  { t: 0, top: '#1b5bb5', mid: '#6fb3ee', hor: '#d3ebf8', sunY: -700, sunC: '255,246,220', sunA: .30, hill: [0, 0, 0, 0] },
  { t: .45, top: '#2a5fb6', mid: '#82bdee', hor: '#fbe3b6', sunY: 120, sunC: '255,226,160', sunA: .50, hill: [255, 190, 90, .10] },
  { t: .8, top: '#2d3c8c', mid: '#d98a84', hor: '#ffc774', sunY: 780, sunC: '255,184,100', sunA: .62, hill: [255, 120, 60, .26] },
  { t: 1, top: '#10173f', mid: '#463f86', hor: '#ee8a5e', sunY: 1010, sunC: '255,140,90', sunA: .44, hill: [70, 40, 120, .48] },
];
function skyAt(tod) {
  tod = clamp01(tod ?? .45);
  let i = 0; while (i < SKYK.length - 2 && tod > SKYK[i + 1].t) i++;
  const a = SKYK[i], b = SKYK[i + 1], k = clamp01((tod - a.t) / (b.t - a.t));
  return { top: mixc(a.top, b.top, k), mid: mixc(a.mid, b.mid, k), hor: mixc(a.hor, b.hor, k), sunY: lerp(a.sunY, b.sunY, k), sunC: a.sunC, sunA: lerp(a.sunA, b.sunA, k),
    hill: a.hill.map((v, j) => lerp(v, b.hill[j], k)), stars: clamp01((tod - .86) / .12) };
}
const SUNX = -420;
/* a drifting cloud bank over a wide x range: puffs lit from above with a shaded belly */
function cloudBand(t, x0, x1, y0, y1, o = {}) {
  const { n = 6, seed = 1, speed = 8, scale = 1, tint = '255,250,240', belly = '170,190,225', a = .85 } = o, r = rnd(seed), span = x1 - x0;
  for (let i = 0; i < n; i++) {
    const w = (420 + 380 * r()) * scale, sp = speed * (.5 + r()), bx = r() * span, y = lerp(y0, y1, r()), h = w * (.2 + .08 * r()), x = x0 + (((bx + t * sp) % span) + span) % span;
    for (const pass of [0, 1]) for (let j = 0; j < 9; j++) {
      const u = j / 8, cx = x + (u - .5) * w * .95, cy = y - Math.sin(u * PI) * h * .55 * (.7 + .3 * ((i * 9 + j) % 3) / 2) + Math.sin(j * 2.3 + i) * h * .12, rr = h * (.55 + .5 * Math.sin(u * PI) * (.7 + .3 * (((i + j) % 4) / 3)));
      if (!pass) { ctx.fillStyle = rg(cx, cy + rr * .35, rr * .1, rr * 1.05, [[0, rgba(mixc(belly, '#ffffff', 0), a * .85)], [.6, rgba(belly, a * .5)], [1, rgba(belly, 0)]]); ctx.beginPath(); ctx.arc(cx, cy + rr * .3, rr * 1.05, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = rg(cx - rr * .2, cy - rr * .3, rr * .1, rr, [[0, rgba(tint, a)], [.62, rgba(tint, a * .8)], [1, rgba(tint, 0)]]); ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fill(); }
    }
  }
}
function hillsDraw(k) {
  /* S14's country behind the building: two ridges of hills with round trees, a meadow down to the foot (y 1342) */
  const ridge = (base, amp, f, ph, c0, c1, y1) => { ctx.beginPath(); ctx.moveTo(-2400, y1); for (let x = -2400; x <= 4400; x += 20) ctx.lineTo(x, base + amp * Math.sin(x * f + ph) + amp * .5 * Math.sin(x * f * 2.7 + ph * 2)); ctx.lineTo(4400, y1); ctx.closePath(); ctx.fillStyle = vg(base - amp, y1, c0, c1); ctx.fill(); };
  ridge(930, 70, .0021, 1.2, '#b9d8d4', '#8fc0b4', GY);
  ridge(1010, 46, .0034, 3.1, '#8fc29d', '#6aa583', GY);
  const r = rnd(8); for (let x = -2380; x < 4380; x += 30 + r() * 34) { const y = 1010 + 46 * Math.sin(x * .0034 + 3.1) + 23 * Math.sin(x * .0034 * 2.7 + 6.2) + 6, rr0 = 12 + r() * 14; ell(x, y - rr0 * .7, rr0, rr0 * 1.15, vg(y - rr0 * 2, y, '#6eb277', '#3f8a52'), null); ln(x, y - rr0 * .2, x, y + 4, '#5a4630', 3); }
  ridge(1112, 20, .0052, .5, '#86c26d', '#5aa24a', GY);
  const q = rnd(19); for (let i = 0; i < 120; i++) { const x = -2400 + q() * 6800, y = 1130 + q() * 190; ell(x, y, 5 + q() * 9, 2 + q() * 3, `rgba(${q() > .5 ? '255,236,150' : '255,255,255'},.5)`, null); }
  if (k.hill[3] > .01) { ctx.fillStyle = `rgba(${k.hill[0] | 0},${k.hill[1] | 0},${k.hill[2] | 0},${k.hill[3]})`; ctx.fillRect(-2400, 880, 6800, GY - 880); }
}
let HILLS = null;
function skyDraw(t, tod, V) {
  const k = skyAt(tod), y0 = -3800, y1 = 1030, X = -2600, WW = 7000;
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, k.top); g.addColorStop(.66, k.mid); g.addColorStop(1, k.hor);
  ctx.fillStyle = g; ctx.fillRect(X, y0, WW, y1 - y0 + 420);
  if (k.stars > .02 && V.y0 < 700) { const r = rnd(5); for (let i = 0; i < 160; i++) { const x = X + r() * WW, y = y0 + r() * 3900, tw = .5 + .5 * Math.sin(t * (1.3 + r() * 2.4) + i), rr = 1.6 + r() * 2.4; ctx.fillStyle = `rgba(255,250,230,${k.stars * (.25 + .7 * tw) * (1 - Math.max(0, y) / 1300)})`; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill(); } }
  /* the low sun: a big soft glow and a few long rays */
  V2.glow(SUNX, k.sunY, 1500, k.sunC, k.sunA, 'screen', .3);
  if (window.A7 && A7.rays) A7.rays(SUNX, k.sunY, 80, 2200, t, { n: 12, color: k.sunC, a: .045 + .02 * k.sunA, spin: .004 });
  for (const [yy0, yy1, sd, scl, sp] of [[-3100, -2200, 3, 1.5, 5], [-2000, -900, 12, 1.3, 7], [-800, 120, 2, 1.1, 9], [200, 760, 7, .9, 6]]) cloudBand(t, -2400, 3600, yy0, yy1, { n: 5, seed: sd, speed: sp, scale: scl, tint: mixc('#fff8ec', '#ffd9b0', clamp01(tod - .4) * 1.4), belly: mixc('#aabce0', '#c08aa8', clamp01(tod - .4) * 1.2), a: .88 - k.stars * .5 });
  if (window.A7 && A7.birds && tod < .9) { ctx.save(); ctx.translate(-760, 0); A7.birds(t, -160, 700, { n: 6, seed: 21, speed: 40, size: 1.6 }); ctx.restore(); }
  if (V.y1 > 860) hillsDraw(k);
}

// ---- the lot (S14's, redrawn: plinth, sidewalk, curb, asphalt with bays, the island with a tree and a bench), detail cached around the building; plain asphalt beyond
const LOTC = { x0: -320, x1: 1520, y0: GY, y1: 1930 };
let LOTCV = null;
function lotCache() {
  if (LOTCV) return LOTCV;
  const w = LOTC.x1 - LOTC.x0, h = LOTC.y1 - LOTC.y0, cv = cvs(w, h), g = cv.getContext('2d');
  g.translate(-LOTC.x0, -LOTC.y0);
  withCtx(g, () => {
    const L = S14.LOT, y0 = GY, X = LOTC.x0 - 10, WW = w + 20;
    ctx.fillStyle = vg(y0, y0 + 24, '#a09b92', '#7d796f'); ctx.fillRect(X, y0, WW, 24);
    for (let x = X; x < X + WW; x += 64) { ln(x, y0, x, y0 + 12, 'rgba(40,36,30,.35)', 1.4, 'butt'); ln(x + 32, y0 + 12, x + 32, y0 + 24, 'rgba(40,36,30,.35)', 1.4, 'butt'); } ln(X, y0 + 12, X + WW, y0 + 12, 'rgba(40,36,30,.35)', 1.4, 'butt'); ln(X, y0 + 1, X + WW, y0 + 1, 'rgba(255,255,255,.25)', 1.6, 'butt');
    ctx.fillStyle = vg(y0 + 24, L.curb, '#dcd7c9', '#c2bdaf'); ctx.fillRect(X, y0 + 24, WW, L.curb - y0 - 24);
    for (let x = X; x < X + WW; x += 130) ln(x, y0 + 24, x - 8, L.curb, 'rgba(90,84,70,.3)', 1.4, 'butt');
    for (const sx of [110, 330, 650, 900]) for (let i = 0; i < 3; i++) ell(sx + i * 30 - 30, y0 + 22, 26, 20, vg(y0, y0 + 40, '#5fb067', '#2f7a42'), 'rgba(10,50,20,.55)', 1.5);
    ctx.fillStyle = '#ebe7db'; ctx.fillRect(X, L.curb, WW, 8); ctx.fillStyle = '#9d988c'; ctx.fillRect(X, L.curb + 8, WW, L.asphalt - L.curb - 8); ctx.fillStyle = '#f2c230'; ctx.fillRect(540, L.curb + 8, 130, L.asphalt - L.curb - 8);
    ctx.fillStyle = vg(L.asphalt, 3000, '#707589', '#3c4050'); ctx.fillRect(X, L.asphalt, WW, LOTC.y1 - L.asphalt);
    const r = rnd(31); for (let i = 0; i < 14; i++) { const x = -300 + r() * 1800, y = 1450 + r() * 420; ctx.fillStyle = `rgba(30,32,44,${.06 + r() * .08})`; ctx.beginPath(); ctx.ellipse(x, y, 20 + r() * 50, 5 + r() * 12, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(30,32,44,.4)'; ctx.lineWidth = 1.6; for (let i = 0; i < 5; i++) { let x = 100 + r() * 800, y = 1580 + r() * 200; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - .3) * 40; y += (r() - .5) * 14; ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.82)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    for (const [a, b] of L.bays) { ctx.beginPath(); ctx.moveTo(a, L.bayY0); ctx.lineTo(a, L.bayY1); ctx.lineTo(b, L.bayY1); ctx.lineTo(b, L.bayY0); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,214,70,.8)'; ctx.setLineDash([46, 34]); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X, L.dash); ctx.lineTo(X + WW, L.dash); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.ellipse(1160, 1478, 150, 58, 0, 0, TAU); ctx.fillStyle = vg(1420, 1536, '#78c070', '#4a9a52'); ctx.fill(); ctx.strokeStyle = '#d7d2c4'; ctx.lineWidth = 6; ctx.stroke();
    fsh(1134, 1486, 120, .3, 10); ln(1134, 1486, 1134, 1430, '#6a4a2e', 11); const cx = 1134, cy = 1394; for (const [dx, dy, rr0] of [[-26, 10, 34], [26, 10, 34], [0, -14, 40], [0, 8, 44]]) ell(cx + dx, cy + dy, rr0, rr0, vg(cy - 50, cy + 50, '#79c776', '#3d8f4c'), 'rgba(10,50,20,.5)', 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(cx - 14, cy - 14, 16, 10, -.5, 0, TAU); ctx.fill();
  });
  LOTCV = { cv, x0: LOTC.x0, y0: LOTC.y0, w, h };
  return LOTCV;
}
function lotDraw(t, V, a, tod) {
  if (a <= 0 || V.y1 < GY) return;
  ctx.save(); ctx.globalAlpha *= a;
  const c = lotCache();
  ctx.fillStyle = '#7d796f'; ctx.fillRect(-2600, GY, 7000, 24);
  ctx.fillStyle = vg(GY + 24, 1406, '#dcd7c9', '#c2bdaf'); ctx.fillRect(-2600, GY + 24, 7000, 1406 - GY - 24);
  ctx.fillStyle = '#ebe7db'; ctx.fillRect(-2600, 1406, 7000, 8); ctx.fillStyle = '#9d988c'; ctx.fillRect(-2600, 1414, 7000, 6);
  ctx.fillStyle = vg(1420, 3000, '#707589', '#3c4050'); ctx.fillRect(-2600, 1420, 7000, 1700);
  ctx.drawImage(c.cv, c.x0, c.y0, c.w, c.h);
  ctx.restore();
}

// ---- the ground cutaway: soil in layers, roots, stones, a buried pipe, a conduit, a bone, bedrock. Cached around the building.
const GRC = { x0: -820, x1: 1960, y0: GY, y1: 2720 };
let GRCV = null;
const SOIL = [[0, '#6b4a33', '#5a3d2a'], [150, '#8a6340', '#7a5436'], [420, '#a4623a', '#8f5230'], [660, '#8c7f6c', '#766b5b'], [980, '#4f5566', '#3a3f4e']];   /* depth below the street: [start, top colour, bottom colour] */
function groundCache() {
  if (GRCV) return GRCV;
  const w = GRC.x1 - GRC.x0, h = GRC.y1 - GRC.y0, cv = cvs(w, h), g = cv.getContext('2d');
  g.translate(-GRC.x0, -GRC.y0);
  withCtx(g, () => {
    const X = GRC.x0, WW = w, r = rnd(77);
    for (let i = 0; i < SOIL.length; i++) {
      const d0 = SOIL[i][0], d1 = i + 1 < SOIL.length ? SOIL[i + 1][0] : h;
      ctx.fillStyle = vg(GY + d0, GY + d1, SOIL[i][1], SOIL[i][2]); ctx.fillRect(X, GY + d0, WW, d1 - d0 + 2);
      /* a wavy boundary: a darker thin band */
      if (i) { ctx.beginPath(); ctx.moveTo(X, GY + d0); for (let x = X; x <= X + WW; x += 24) ctx.lineTo(x, GY + d0 + 6 * Math.sin(x * .02 + i) + 4 * Math.sin(x * .07 + i * 2)); ctx.strokeStyle = 'rgba(30,18,10,.35)'; ctx.lineWidth = 3; ctx.stroke(); }
    }
    /* speckle and pebbles per layer */
    for (let i = 0; i < 2600; i++) { const x = X + r() * WW, d = Math.pow(r(), .85) * (h - 40), y = GY + 14 + d, lay = SOIL.filter(s => s[0] <= d).length - 1; const dark = r() > .45; ctx.fillStyle = dark ? `rgba(25,14,8,${.1 + r() * .16})` : `rgba(255,236,200,${.05 + r() * .1})`; const s = 1 + r() * (lay >= 3 ? 5 : 2.4); ctx.beginPath(); ctx.ellipse(x, y, s * 1.3, s, r() * 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 90; i++) { const x = X + r() * WW, d = 200 + r() * (h - 260), y = GY + d, s = 5 + r() * 14; ell(x, y, s * 1.2, s, vg(y - s, y + s, '#a9a396', '#6d675c'), 'rgba(30,24,16,.5)', 1.3, r() * 3); ell(x - s * .3, y - s * .3, s * .35, s * .22, 'rgba(255,255,255,.25)'); }
    /* the street surface: a concrete sidewalk slab with joints, a grass verge on top of the right-hand side */
    ctx.fillStyle = vg(GY, GY + 16, '#cfc9ba', '#a9a395'); ctx.fillRect(X, GY, WW, 16); for (let x = X + 30; x < X + WW; x += 136) ln(x, GY, x, GY + 16, 'rgba(40,36,30,.4)', 1.6, 'butt'); ln(X, GY + 16, X + WW, GY + 16, 'rgba(30,24,16,.5)', 2, 'butt'); ln(X, GY + 1, X + WW, GY + 1, 'rgba(255,255,255,.35)', 1.6, 'butt');
    /* roots from the island tree (x about 1500) and a few grass roots hanging under the surface */
    ctx.lineCap = 'round'; for (let i = 0; i < 7; i++) { let x = 1500 + (r() - .5) * 40, y = GY + 20; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 9; k++) { x += (r() - .62) * 56; y += 30 + r() * 26; ctx.lineTo(x, y); } ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 7 - i * .6; ctx.stroke(); ctx.strokeStyle = '#6a4a30'; ctx.lineWidth = 3.2 - i * .3; ctx.stroke(); }
    for (let i = 0; i < 60; i++) { const x = X + r() * WW, y = GY + 16; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - .5) * 8, y + 14 + r() * 26); ctx.strokeStyle = 'rgba(215,196,150,.55)'; ctx.lineWidth = 1.4; ctx.stroke(); }
    /* the buried pipe (blue, with flanges and a valve), a conduit (orange), a cable bundle */
    const py = GY + 262;
    rb(X, py - 22, WW, 44, '#3d83c4', { r: 4, lw: 2.4 }); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(X, py - 16, WW, 7);
    for (let x = X + 80; x < X + WW; x += 330) { rb(x - 7, py - 28, 14, 56, '#2b6aa6', { r: 3, lw: 2 }); for (const dy of [-18, 18]) ell(x, py + dy, 3, 3, '#cfe3f2', OUT, 1); }
    ctx.save(); ctx.translate(560, py - 22); rb(-6, -30, 12, 32, '#8a959f', { r: 3, lw: 2 }); ell(0, -36, 24, 7, '#c0392b', OUT, 2); ln(-24, -36, 24, -36, '#f1a79f', 2); ctx.restore();
    rb(X, GY + 346, WW, 16, '#e08a2a', { r: 3, lw: 2 }); for (let x = X + 40; x < X + WW; x += 180) { rb(x, GY + 342, 8, 24, '#a95f12', { r: 2, lw: 1.5 }); }
    for (let i = 0; i < 5; i++) { ln(X, GY + 388 + i * 5, X + WW, GY + 388 + i * 5 + (i % 2 ? 3 : -3), ['#c23a2b', '#222', '#2b5fc2', '#e0c02b', '#2a9d4a'][i], 3.4, 'butt'); }
    /* a bone, an old shoe and a coin in the clay and the gravel */
    ctx.save(); ctx.translate(1180, GY + 640); ctx.rotate(-.3); rb(-44, -5, 88, 10, '#eee6cf', { r: 5, lw: 2 }); for (const sx of [-44, 44]) { ell(sx, -7, 9, 8, '#eee6cf', OUT, 2); ell(sx, 7, 9, 8, '#eee6cf', OUT, 2); } ctx.restore();
    ctx.save(); ctx.translate(-120, GY + 760); ctx.rotate(.25); ctx.beginPath(); ctx.moveTo(-36, 10); ctx.quadraticCurveTo(-34, -14, -10, -16); ctx.lineTo(10, -16); ctx.quadraticCurveTo(20, 0, 40, 6); ctx.lineTo(40, 14); ctx.lineTo(-36, 14); ctx.closePath(); ctx.fillStyle = '#6a4a38'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke(); ln(-8, -8, 4, -2, '#d8c9a8', 1.6); ln(-2, -12, 10, -6, '#d8c9a8', 1.6); ctx.restore();
    ell(760, GY + 910, 11, 11, '#e0b640', OUT, 2); ell(760, GY + 910, 6, 6, null, 'rgba(120,80,10,.7)', 1.6);
    /* fossils in the bedrock: a spiral shell and a fish skeleton */
    ctx.save(); ctx.translate(300, GY + 1120); ctx.strokeStyle = 'rgba(210,214,230,.55)'; ctx.lineWidth = 3; ctx.beginPath(); for (let a = 0; a < 14; a += .2) ctx.lineTo(Math.cos(a) * (3 + a * 3.2), Math.sin(a) * (3 + a * 3.2)); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(1240, GY + 1230); ctx.strokeStyle = 'rgba(210,214,230,.5)'; ctx.lineWidth = 2.6; ln(-50, 0, 50, 0, 'rgba(210,214,230,.5)', 2.6); for (let i = -4; i <= 4; i++) { ln(i * 10, 0, i * 10 + 4, -16, 'rgba(210,214,230,.5)', 2); ln(i * 10, 0, i * 10 + 4, 16, 'rgba(210,214,230,.5)', 2); } ell(-58, 0, 12, 10, null, 'rgba(210,214,230,.5)', 2.6); ctx.beginPath(); ctx.moveTo(50, 0); ctx.lineTo(74, -18); ctx.lineTo(74, 18); ctx.closePath(); ctx.stroke(); ctx.restore();
    /* bedrock cracks */
    ctx.strokeStyle = 'rgba(15,18,28,.5)'; ctx.lineWidth = 2.4; for (let i = 0; i < 12; i++) { let x = X + r() * WW, y = GY + 1000 + r() * 300; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 70; y += 30 + r() * 40; ctx.lineTo(x, y); } ctx.stroke(); }
  });
  GRCV = { cv, x0: GRC.x0, y0: GRC.y0, w, h };
  return GRCV;
}
function groundDraw(t, V, a) {
  if (a <= 0.003 || V.y1 < GY) return;
  ctx.save(); ctx.globalAlpha *= a;
  const c = groundCache();
  /* plain bands beyond the cached region */
  for (let i = 0; i < SOIL.length; i++) { const d0 = SOIL[i][0], d1 = i + 1 < SOIL.length ? SOIL[i + 1][0] : 2600; ctx.fillStyle = vg(GY + d0, GY + d1, SOIL[i][1], SOIL[i][2]); ctx.fillRect(-2600, GY + d0, 7000, d1 - d0 + 2); }
  ctx.fillStyle = SOIL[SOIL.length - 1][2]; ctx.fillRect(-2600, GY + 2600, 7000, 3000);
  ctx.fillStyle = vg(GY, GY + 16, '#cfc9ba', '#a9a395'); ctx.fillRect(-2600, GY, 7000, 16);
  ctx.drawImage(c.cv, c.x0, c.y0, c.w, c.h);
  /* a worm in the topsoil, easing along */
  const wx = 1560 + 120 * Math.sin(t * .35), wy = GY + 96, seg0 = 14;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [col, lw] of [['#7a3a3e', 15], ['#e49aa0', 11]]) { ctx.beginPath(); for (let i = 0; i <= seg0; i++) { const u = i / seg0, x = wx - u * 78, y = wy + 9 * Math.sin(u * 7 - t * 3.2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 2; i <= 10; i++) { const u = i / seg0, x = wx - u * 78, y = wy - 3 + 9 * Math.sin(u * 7 - t * 3.2); i > 2 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  ell(wx + 3, wy - 2 + 9 * Math.sin(-t * 3.2) - 1, 2.6, 2.6, '#1d1a22'); ell(wx + 4, wy - 3 + 9 * Math.sin(-t * 3.2) - 1, .8, .8, '#fff');
  ctx.restore();
}

// ================================================================================================ Fruit Bowl: S14 drawn in three floor bands (so the building can squat and sink), the roof, the roof sign and its parts, plates
const FB_IDS = [S14.ids.filter(i => FBROW_OF[i] === 0), S14.ids.filter(i => FBROW_OF[i] === 1), S14.ids.filter(i => FBROW_OF[i] === 2)];
function fbPass(lt, st, s, layer) {
  const t = st.t ?? lt, o0 = { t, noSky: true, noLot: true, noRoof: true, noCar: true, plates: false, lotSign: false, rooms: st.rooms || {} };
  if (st.car) o0.car = st.car;
  for (let k = 0; k < 3; k++) {
    const ids = FB_IDS[k].filter(i => !st.only || st.only.includes(i)); if (!ids.length) continue;
    const m = bandMap(s, k), [yt, yb] = FB_BAND[k], V = view(120);
    if (!seen(V, X0 - 40, m.f(yt), X1 + 40, m.f(yb))) continue;
    ctx.save();
    ctx.translate(0, m.bb + m.dy); ctx.scale(1, m.sy); ctx.translate(0, -m.bb);
    ctx.beginPath(); ctx.rect(X0 - 60, yt - (k === 0 ? 4 : 0), X1 - X0 + 120, yb - yt + (k === 2 ? 4 : 0) + (k === 0 ? 4 : 0)); ctx.clip();
    const cy0 = CAM ? CAM.y : 0; if (CAM) CAM.y = cy0 - m.dy;       /* S14 culls rooms against the camera: move the camera into the band's own frame while it draws */
    const jx = st.shakeX && k === 0 ? st.shakeX : 0, jy = st.shakeY && k === 0 ? st.shakeY : 0;
    if (jx || jy) ctx.translate(jx, jy);
    try { (layer === 'back' ? S14.back : S14.front)(lt, Object.assign({}, o0, { only: ids })); } finally { if (CAM) CAM.y = cy0; }
    ctx.restore();
  }
}
/* the top boundary of Fruit Bowl, after sink and squat */
const fbTop = s => 340 + s.sink + s.squat;
/* the roof's thickness, 64 px in Ep14, crushed by the Greenleaf block's underside (26 px at the least) */
function roofThick(s, st) {
  if (st.roof != null) return lerp(64, 30, clamp01(st.roof));
  const gUnder = s.gy + GL_H / 2 + s.sink;         /* the block's underside (angle ignored) */
  return Math.max(30, Math.min(64, fbTop(s) + 6 - gUnder));
}
let ROOFCV = null;
function roofCache() {
  if (ROOFCV) return ROOFCV;
  const cs = 2, x0 = -20, y0 = 266, w = 1120, h = 86, cv = cvs(w * cs, h * cs), g = cv.getContext('2d');
  g.scale(cs, cs); g.translate(-x0, -y0);
  withCtx(g, () => {
    const body = [[-12, 344], [1092, 344], [954, 282], [126, 282]];
    ctx.save(); path(body); ctx.clip();
    ctx.fillStyle = vg(280, 344, '#d06d52', '#a74a38'); ctx.fillRect(-12, 280, 1108, 66);
    for (let y = 286, row = 0; y < 350; y += 8.5, row++) { for (let x = -20 + (row % 2 ? 11 : 0); x < 1100; x += 22) { ctx.beginPath(); ctx.arc(x + 11, y, 11, 0, PI); ctx.strokeStyle = 'rgba(70,22,14,.4)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.arc(x + 11, y - 1.2, 9.4, .25, PI - .25); ctx.strokeStyle = 'rgba(255,200,170,.17)'; ctx.lineWidth = 1.5; ctx.stroke(); } }
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,14,10,.8)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; path(body); ctx.stroke();
    rb(120, 274, 840, 10, '#8d3f2d', { r: 5, lw: 2 });
  });
  ROOFCV = { cv, x0, y0, w, h };
  return ROOFCV;
}
function roofDraw(t, s, st, th) {
  const base = 346 + s.sink + s.squat, c = roofCache(), sy = th / 64;
  ctx.save(); ctx.translate(0, base); ctx.scale(1, sy); ctx.translate(0, -346);
  ctx.drawImage(c.cv, c.x0, c.y0, c.w, c.h);
  if (sy < .97) {     /* the crush: cracked tiles and splinters along the ridge, dust-dark in the creases */
    const k = clamp01((1 - sy) / .55), r = rnd(5);
    ctx.strokeStyle = `rgba(30,10,6,${.55 * k})`; ctx.lineWidth = 2.2 / sy; for (let i = 0; i < 26; i++) { const x = 100 + r() * 880; ln(x, 282 + r() * 8, x + (r() - .5) * 30, 300 + r() * 38, ctx.strokeStyle, 2.2 / sy, 'round'); }
  }
  ctx.restore();
  /* the fascia board and the shadow it throws on the top slab */
  ctx.save(); ctx.translate(0, s.sink + s.squat);
  ctx.fillStyle = vg(344, 366, 'rgba(10,4,12,.5)', 'rgba(10,4,12,0)'); ctx.fillRect(-12, 346, 1104, 22);
  rb(-14, 335, 1108, 12, '#74321f', { r: 3, lw: 2 });
  ctx.restore();
}
/* the roof sign in two halves (so it can break in two), the chimney (bricks), the weathervane; poses in roof coordinates (the building as in Ep14, before sink and squat) */
const SIGN = { a: { x: 200, y: 190, w: 300, h: 76, text: 'FRUIT BOWL', post: 50 }, b: { x: 500, y: 190, w: 380, h: 76, text: 'REHAB & NURSING', post: 318 } };   /* the sign stands on the ridge cap (y 274): board 190..266, legs 266..274 */
const CHIM = { x: 886, w: 66, base: 274, rows: 4, bh: 9, cols: 3 };
const VANE = { x: 150, base: 274 };
S15.roofParts = { sign: SIGN, chimney: CHIM, vane: VANE };
function signHalf(p, t, o = {}) {
  const hero = !o.moving && heroNow(p.x, p.y, p.x + p.w, p.y + p.h, 34);
  ctx.save();
  for (const y of [p.y - 6, p.y + p.h + 6]) for (let i = 0; i <= (p.w > 320 ? 12 : 9); i++) { const n = p.w > 320 ? 12 : 9, x = p.x + 8 + i * (p.w - 16) / n, on = !o.dark && (Math.floor(t * 2.5 + i * .5) % 2) === 0; ell(x, y, 3, 3, on ? '#ffe9a8' : '#c8a860', 'rgba(60,30,10,.6)', .8); if (on) V2.glow(x, y, 16, '255,226,150', .5, 'screen', .2); }
  const q = UI.sign([p.x, p.y, p.w, p.h], o.text ?? p.text, { fill: '#24402e', stroke: '#d9b45a', lw: 5, ink: '#f2e8cf', size: 38, spacing: 1.5, pad: 10, r: 14, shadow: 12, id: 'k15.roofsign.' + (p.id || 'a'), hero, crop: !hero, tilt: o.tilt });
  ctx.restore();
  return q;
}
function signPost(x, y) { rb(x - 9, y, 18, 8, '#4a3a2c', { r: 2, lw: 1.5 }); }
function chimneyBrick(x, y, w, h, i) { const c = ['#b8674a', '#a65a40', '#c27552'][i % 3]; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(50,20,12,.55)'; ctx.lineWidth = 1.2; ctx.strokeRect(x + .6, y + .6, w - 1.2, h - 1.2); ctx.fillStyle = 'rgba(255,220,190,.18)'; ctx.fillRect(x + 1, y + 1, w - 2, 1.6); }
function chimneyCap(x, y, w) { rb(x - 7, y, w + 14, 9, '#d6a07e', { r: 3, lw: 2 }); }
function vaneDraw(x, y0, t, sc = 1) {
  const top = y0 - 38; ln(x, y0, x, top, '#3a3340', 4); ell(x, top + 8, 5, 5, '#c9a24c', OUT, 1.4);
  ctx.save(); ctx.translate(x, top); ctx.rotate(.16 * Math.sin(t * .7) + .1 * Math.sin(t * 1.9)); ctx.scale((.45 + .55 * (Math.cos(t * .4) * .5 + .5)) * sc, sc);
  ln(-30, 0, 30, 0, '#3a3340', 3.4); poly([[30, 0], [20, -7], [20, 7]], '#c23a2b', OUT, 1.4); ell(-32, 0, 9, 8, '#d8584a', OUT, 1.6); ln(-32, -8, -32, -13, '#5a3a22', 2); ell(-28, -12, 4, 2.2, '#4fa85a', null, 0, -.4);
  ctx.restore();
}
function chimneySmoke(t, x, y) {
  const n = 9;
  for (let i = 0; i < n; i++) {
    const ph = ((t * .32 + i / n) % 1 + 1) % 1, r = 16 + ph * 34, px = x + 8 * Math.sin(ph * 5 + i) + ph * 54, py = y - ph * 170, a = .5 * Math.sin(Math.min(1, ph * 3) * PI / 2) * (1 - ph);
    ctx.fillStyle = rg(px, py, 0, r, [[0, `rgba(238,238,244,${a})`], [1, 'rgba(238,238,244,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
}
/* the intact roof furniture, in place; the dock scene draws the same parts at simulated poses instead (st.roofParts = 'sim') */
function roofFurniture(t, s, st) {
  if (st.roofParts === 'sim' || st.roofParts === 'none') return;
  ctx.save(); ctx.translate(0, s.sink + s.squat);
  signPost(SIGN.a.x + SIGN.a.post, 266); signPost(SIGN.b.x + SIGN.b.post, 266);
  /* the chimney: bricks and a cap, with smoke */
  const C = CHIM; for (let r = 0; r < C.rows; r++) for (let c = 0; c < C.cols; c++) chimneyBrick(C.x + c * C.w / C.cols, C.base - (r + 1) * C.bh, C.w / C.cols, C.bh, r + c);
  chimneyCap(C.x, C.base - C.rows * C.bh - 9, C.w);
  chimneySmoke(t, C.x + C.w / 2, C.base - C.rows * C.bh - 10);
  vaneDraw(VANE.x, VANE.base, t);
  signHalf(Object.assign({ id: 'a' }, SIGN.a), t, { text: signText(st, 'a') }); signHalf(Object.assign({ id: 'b' }, SIGN.b), t, { text: signText(st, 'b') });
  ctx.restore();
}
function signText(st, k) { const r = st.signs && st.signs['roof.' + k]; return typeof r === 'string' ? r : undefined; }

// ---- name plates on the floor slabs, for both buildings (S14's are 7.4 px brass pills; same look, bamboo for Greenleaf) and the door plate of the break room.
/* st.signs[id] may be a string (the new text), { from, to, u } (a flip: the text changes at u .5 unless you draw it yourself), or a function (box) => {...} that draws the label itself inside the plate
 * (use SH15.flipText there: box = { x0, y0, x1, y1, cx, cy, w, h, size }) */
function signVal(st, id, dflt) { const v = st.signs && st.signs[id]; if (v == null) return { text: dflt }; if (typeof v === 'string') return { text: v }; if (typeof v === 'function') return { fn: v, text: dflt }; return { text: v.u >= .5 ? v.to : v.from, flip: v }; }
function platesDraw(st, s, V) {
  for (const id of S15.ids) {
    if (id === 'exec') continue;
    const r = rectOf(id, s), gl = !!GDEF[id];
    if (!seen(V, r.x0, r.y1 - 2, r.x1, r.y1 + 14)) continue;
    const pt = signVal(st, 'plate:' + id, S15.names[id]);
    const pw = UI.sizeOf(pt.text, { size: 7.4, spacing: .4 }).w + 12, pa = dressGuard(r.cx - pw / 2, r.y1 + .8, r.cx + pw / 2, r.y1 + 11.2);
    if (pa < .02) continue;
    ctx.save(); ctx.globalAlpha *= pa;
    if (pt.fn) {
      UI.panel([r.cx - pw / 2, r.y1 + .8, pw, 10.4], { r: 5, fill: gl ? '#c9d9a0' : '#d9b45a', stroke: gl ? '#5f7d3a' : '#7a5a1a', lw: .9, id: 'k15.plate.' + id, kind: 'plate' });
      pt.fn({ x0: r.cx - pw / 2, y0: r.y1 + .8, x1: r.cx + pw / 2, y1: r.y1 + 11.2, cx: r.cx, cy: r.y1 + 6, w: pw, h: 10.4, size: 7.4 });
    } else UI.pill(pt.text, r.cx, r.y1 + 6, { size: 7.4, h: 10.4, padX: 5, pad: .5, fill: gl ? '#c9d9a0' : '#d9b45a', ink: gl ? '#1f3d24' : '#3a2a10', stroke: gl ? '#5f7d3a' : '#7a5a1a', lw: .9, hero: false, crop: true, spacing: .4, id: 'k15.plate.' + id });
    ctx.restore();
  }
}
function doorPlate(st, s, V) {
  const r = rectOf('rest', s); if (!seen(V, r.x0, r.y0, r.x1, r.y1)) return;
  const v = signVal(st, 'door:rest', 'BREAK ROOM');
  const x = r.x0 + 192, y = r.y0 + 42, b = [x - 36, y - 9, 72, 18];
  if (v.fn) { UI.panel(b, { r: 4, fill: '#f5ecd2', stroke: '#6a4a24', lw: 1.6, id: 'k15.door.rest', kind: 'plate' }); v.fn({ x0: b[0], y0: b[1], x1: b[0] + b[2], y1: b[1] + b[3], cx: x, cy: y, w: b[2], h: b[3], size: 11 }); return; }
  plate(b, v.text, { fill: '#f5ecd2', stroke: '#6a4a24', lw: 1.6, ink: '#3a2a10', size: 11, spacing: .8, pad: 2, r: 4, id: 'k15.door.rest', heroSize: 11 });
}
S15.sign = (id, st) => {
  const s = STATE(st), g = (r, text) => ({ id, x0: r[0], y0: r[1], x1: r[2], y1: r[3], cx: (r[0] + r[2]) / 2, cy: (r[1] + r[3]) / 2, text });
  const sg = st && st.signs || {};
  if (id === 'roof') { const top = s.sink + s.squat; return g([SIGN.a.x, SIGN.a.y + top, SIGN.b.x + SIGN.b.w, SIGN.a.y + SIGN.a.h + top], 'FRUIT BOWL REHAB & NURSING'); }
  if (id.startsWith('plate:')) { const rid = id.slice(6), r = rectOf(rid, s); const w = UI.sizeOf(S15.names[rid], { size: 7.4, spacing: .4 }).w + 12; return Object.assign(g([r.cx - w / 2, r.y1 + .8, r.cx + w / 2, r.y1 + 11.2], S15.names[rid]), { room: rid }); }
  if (id === 'door:rest') { const r = rectOf('rest', s); return Object.assign(g([r.x0 + 192 - 36, r.y0 + 33, r.x0 + 192 + 36, r.y0 + 51], 'BREAK ROOM'), { room: 'rest' }); }
  if (id === 'board') { const r = rectOf('station', s); return Object.assign(g([r.x0 + 172, r.y0 + 38, r.x0 + 276, r.y0 + 122], 'ASSIGNMENT'), { room: 'station' }); }
  return null;
};

// ================================================================================================ Greenleaf: the room shell (S14's perspective box, with bamboo, grass and tatami floors, ceiling beams) and the plant/furniture library
const BX = 22, BT = 20, BB = 48, FY = 282;
function boxOf(w, h) { return { bx0: BX, bx1: w - BX, by0: BT, by1: h - BB, w, h, cx: w / 2 }; }
function floorFill(b, F) {
  const { w, h, bx0, bx1, by1 } = b, k = (bx1 - bx0) / w, cx = w / 2;
  ctx.save(); path([[0, h], [w, h], [bx1, by1], [bx0, by1]]); ctx.clip();
  ctx.fillStyle = vg(by1, h, shade(F.a, .9), lift(F.a, .06)); ctx.fillRect(0, by1 - 2, w, h - by1 + 4);
  const xb = x => cx + (x - cx) * k;
  if (F.kind === 'planks' || F.kind === 'bamboo') {
    const pw = F.pw ?? 26, r = rnd(F.seed ?? 5);
    for (let x = -pw * 2, i = 0; x < w + pw * 2; x += pw, i++) {
      const t = r(); ctx.fillStyle = rgba(t > .5 ? '#000' : '#fff', .035 + .05 * Math.abs(t - .5));
      path([[x, h], [x + pw, h], [xb(x + pw), by1], [xb(x), by1]]); ctx.fill();
      ln(x, h, xb(x), by1, rgba(F.seam ?? shade(F.a, .6), .55), 1.2);
      for (let j = 0; j < 2; j++) { const z = r(), v = by1 + (h - by1) * z, xl = lerp(xb(x), x, z), xr = lerp(xb(x + pw), x + pw, z); ln(xl, v, xr, v, rgba(F.seam ?? shade(F.a, .6), F.kind === 'bamboo' ? .55 : .35), F.kind === 'bamboo' ? 1.6 : 1); }
    }
  } else if (F.kind === 'checker' || F.kind === 'tile' || F.kind === 'tatami') {
    const n = F.n ?? 8, rows = F.rows ?? 4, A = F.a, B2 = F.b ?? shade(F.a, .88), tw = w / n;
    for (let j = 0; j < rows; j++) {
      const z0 = Math.pow(j / rows, 1.45), z1 = Math.pow((j + 1) / rows, 1.45), v0 = by1 + (h - by1) * z0, v1 = by1 + (h - by1) * z1;
      for (let i = -1; i <= n; i++) {
        const xa = i * tw, xc = (i + 1) * tw;
        path([[lerp(xb(xa), xa, z0), v0], [lerp(xb(xc), xc, z0), v0], [lerp(xb(xc), xc, z1), v1], [lerp(xb(xa), xa, z1), v1]]);
        ctx.fillStyle = (i + j) % 2 ? B2 : A; ctx.fill();
        if (F.grout) { ctx.strokeStyle = F.grout; ctx.lineWidth = F.kind === 'tatami' ? 2.6 : 1; ctx.stroke(); }
      }
    }
  } else if (F.kind === 'carpet' || F.kind === 'grass') {
    const r = rnd(F.seed ?? 9);
    ctx.fillStyle = rgba(F.kind === 'grass' ? '#1d5a2a' : '#000', .08); for (let i = 0; i < 420; i++) { const x = r() * w, v = by1 + r() * (h - by1); ctx.fillRect(x, v, 2, F.kind === 'grass' ? 5 : 1.2); }
    ctx.fillStyle = rgba(F.kind === 'grass' ? '#b6e07a' : '#fff', .1); for (let i = 0; i < 340; i++) { const x = r() * w, v = by1 + r() * (h - by1); ctx.fillRect(x, v, 2, F.kind === 'grass' ? 5 : 1.2); }
  } else if (F.kind === 'terrazzo') {
    const r = rnd(F.seed ?? 3), cols = F.flecks ?? ['#f6efe0', '#b9a98a', '#8c7f6a', '#d9cbb0'];
    for (let i = 0; i < 300; i++) { const z = Math.pow(r(), .8), v = by1 + (h - by1) * z, x = r() * w; ctx.fillStyle = cols[(r() * cols.length) | 0]; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(x, v, 2 + r() * 2.4, (1 + r()) * .7 + z, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = vg(by1, by1 + 22, 'rgba(25,14,30,.28)', 'rgba(25,14,30,0)'); ctx.fillRect(0, by1, w, 22);
  ctx.fillStyle = vg(h - 16, h, 'rgba(25,14,30,0)', 'rgba(25,14,30,.18)'); ctx.fillRect(0, h - 16, w, 16);
  ctx.restore();
}
function roomBox(w, h, P) {
  const b = boxOf(w, h), { bx0, bx1, by0, by1 } = b;
  ctx.fillStyle = P.ceil; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = vg(by0, by1, lift(P.wall, .07), shade(P.wall, .9)); ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  for (const side of [-1, 1]) {
    const xf = side < 0 ? 0 : w, xbk = side < 0 ? bx0 : bx1;
    const g = ctx.createLinearGradient(xf, 0, xbk, 0); g.addColorStop(0, shade(P.side ?? P.wall, .72)); g.addColorStop(1, shade(P.side ?? P.wall, .96));
    poly([[xf, 0], [xbk, by0], [xbk, by1], [xf, h]], g);
  }
  poly([[0, 0], [w, 0], [bx1, by0], [bx0, by0]], vg(0, by0, shade(P.ceil, .9), lift(P.ceil, .12)));
  if (P.beams) {       /* ceiling beams, converging on the back wall */
    ctx.save(); path([[0, 0], [w, 0], [bx1, by0], [bx0, by0]]); ctx.clip();
    for (const f of P.beams === true ? [.18, .5, .82] : P.beams) { const xa = w * f, xb2 = bx0 + (bx1 - bx0) * f; poly([[xa - 7, 0], [xa + 7, 0], [xb2 + 4, by0], [xb2 - 4, by0]], '#c9a86a', 'rgba(60,36,12,.5)', 1.2); }
    ln(0, 7, w, 7, 'rgba(60,36,12,.0)', 1); ctx.restore();
  }
  floorFill(b, P.floor);
  if (P.wains) {
    const W2 = P.wains, top = by1 - W2.h;
    ctx.fillStyle = vg(top, by1, lift(W2.color, .06), shade(W2.color, .85)); ctx.fillRect(bx0, top, bx1 - bx0, W2.h);
    for (const side of [-1, 1]) { const xf = side < 0 ? 0 : w, xbk = side < 0 ? bx0 : bx1, tf = h - W2.h * h / (by1 - by0); poly([[xf, tf], [xbk, top], [xbk, by1], [xf, h]], side < 0 ? hg(0, bx0, shade(W2.color, .62), shade(W2.color, .84)) : hg(bx1, w, shade(W2.color, .84), shade(W2.color, .62))); }
    if (W2.slats) { stripesV(bx0, top, bx1, by1, W2.slats, 2.2, rgba(shade(W2.color, .6), .7)); stripesV(bx0, top, bx1, by1, W2.slats, 1, rgba(lift(W2.color, .4), .4), 2.2); }
    else if (W2.panels !== false) { const n = W2.panels ?? 4, pw = (bx1 - bx0 - 12) / n; for (let i = 0; i < n; i++) { const px = bx0 + 6 + i * pw; ctx.strokeStyle = rgba(shade(W2.color, .55), .8); ctx.lineWidth = 1.6; ctx.strokeRect(px + 5, top + 12, pw - 10, W2.h - 24); } }
    ctx.fillStyle = W2.rail ?? lift(W2.color, .3); ctx.fillRect(bx0, top - 3, bx1 - bx0, 5); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(bx0, top + 2, bx1 - bx0, 3); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(bx0, top - 3, bx1 - bx0, 1.4);
  }
  ctx.fillStyle = P.base; ctx.fillRect(bx0, by1 - 9, bx1 - bx0, 9); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(bx0, by1 - 9, bx1 - bx0, 1.4);
  poly([[0, h - 14], [0, h], [bx0, by1], [bx0, by1 - 9]], shade(P.base, .8)); poly([[w, h - 14], [w, h], [bx1, by1], [bx1, by1 - 9]], shade(P.base, .8));
  ctx.fillStyle = P.trim ?? lift(P.ceil, .2); ctx.fillRect(bx0, by0, bx1 - bx0, 6); ctx.fillStyle = 'rgba(25,14,30,.22)'; ctx.fillRect(bx0, by0 + 6, bx1 - bx0, 5); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(bx0, by0, bx1 - bx0, 1.3);
  for (const x of [bx0, bx1]) { ctx.fillStyle = vg(by0, by1, 'rgba(25,14,30,.22)', 'rgba(25,14,30,.10)'); ctx.fillRect(x - (x === bx0 ? 0 : 7), by0, 7, by1 - by0); }
  return b;
}
function roomFinish(w, h, tone = .34) {
  ctx.save();
  ctx.fillStyle = rg(w / 2, h * .42, h * .22, Math.max(w * .62, h * .78), [[0, 'rgba(25,14,30,0)'], [1, `rgba(25,14,30,${tone})`]]); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = vg(0, 26, 'rgba(20,10,26,.34)', 'rgba(20,10,26,0)'); ctx.fillRect(0, 0, w, 26);
  ctx.restore();
}
function onBack(b, fn) { ctx.save(); ctx.beginPath(); ctx.rect(b.bx0, b.by0, b.bx1 - b.bx0, b.by1 - b.by0); ctx.clip(); fn(); ctx.restore(); }
function lampLive(x, y, floorY, lamp, o = {}) {
  if (lamp <= 0) return;
  const col = o.color ?? '255,226,170';
  V2.beam(x, y + 4, x, floorY, o.w0 ?? 40, o.w1 ?? 230, col, .17 * lamp);
  V2.glow(x, y + 3, o.r ?? 120, col, .62 * lamp, 'screen', .45);
}
/* ceiling lamps: the woven pendant of Greenleaf, a glass globe, a bamboo drum */
function lampDraw(x, y, kind = 'wicker') {
  if (kind === 'wicker') {
    ln(x, 0, x, y - 14, 'rgba(60,40,20,.8)', 1.6);
    ctx.beginPath(); ctx.moveTo(x - 26, y + 10); ctx.quadraticCurveTo(x - 24, y - 16, x, y - 16); ctx.quadraticCurveTo(x + 24, y - 16, x + 26, y + 10); ctx.closePath(); ctx.fillStyle = hg(x - 26, x + 26, '#b58c52', '#e2c48a'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(90,56,20,.5)'; ctx.lineWidth = 1; for (let i = -6; i <= 6; i++) { ln(x + i * 5, y - 16, x + i * 7, y + 10, 'rgba(90,56,20,.5)', 1, 'butt'); } for (let j = 0; j < 5; j++) { const yy = y - 12 + j * 5; ln(x - 28, yy, x + 28, yy + 1, 'rgba(90,56,20,.4)', 1, 'butt'); } ctx.restore();
    ell(x, y + 10, 26, 4, '#fff3d2', 'rgba(60,40,20,.4)', 1);
  } else if (kind === 'globe') { ln(x, 0, x, y - 12, 'rgba(60,40,20,.8)', 1.6); ell(x, y, 13, 13, rg(x - 4, y - 4, 1, 14, [[0, '#ffffff'], [1, '#fff0c8']]), OUT, 1.4); }
  else if (kind === 'drum') { rb(x - 30, y - 8, 60, 20, '#d8bf7a', { r: 5, lw: 1.5 }); stripesV(x - 28, y - 6, x + 28, y + 10, 6, 1.4, 'rgba(90,60,20,.5)', 3); ell(x, y + 12, 28, 3.4, '#fff3d2', null); }
  else if (kind === 'panel') { rb(x - 34, y - 3, 68, 9, '#e8e6e0', { r: 3, lw: 1.5 }); ctx.fillStyle = '#fff3d2'; ctx.fillRect(x - 31, y - 1.5, 62, 4.5); }
}
function windowDraw(x, y, w, h, o = {}) {
  const fr = o.frame ?? '#f6f1de', gl = o.glass ?? ['#8cc8f0', '#e3f4fb'];
  rb(x - 5, y - 5, w + 10, h + 10, fr, { r: o.arch ? w / 2 : 4, lw: 1.8 });
  ctx.save(); ctx.beginPath(); if (o.arch) ctx.roundRect(x, y, w, h, [w / 2, w / 2, 2, 2]); else ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = vg(y, y + h, gl[0], gl[1]); ctx.fillRect(x, y, w, h);
  const r = rnd(o.seed ?? 4);
  for (let i = 0; i < 2; i++) { const cx = x + w * (.2 + .55 * r()), cy = y + h * (.15 + .25 * r()); ell(cx, cy, 14 + 8 * r(), 5 + 2 * r(), 'rgba(255,255,255,.85)'); ell(cx + 9, cy - 3, 10, 5, 'rgba(255,255,255,.85)'); }
  if (o.view === 'trees') { ctx.fillStyle = '#6fb878'; ctx.beginPath(); ctx.ellipse(x + w * .3, y + h, w * .45, h * .34, 0, PI, TAU); ctx.fill(); ctx.fillStyle = '#4f9a5a'; ctx.beginPath(); ctx.ellipse(x + w * .78, y + h, w * .5, h * .26, 0, PI, TAU); ctx.fill(); }
  if (o.view === 'garden') { ctx.fillStyle = '#7fc27a'; ctx.fillRect(x, y + h * .72, w, h * .3); for (let i = 0; i < 6; i++) ell(x + w * (.1 + i * .16), y + h * .7, 6, 9, '#4f9a5a'); }
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(x + w * .1, y); ctx.lineTo(x + w * .34, y); ctx.lineTo(x + w * .08, y + h); ctx.lineTo(x - w * .16, y + h); ctx.fill();
  ctx.restore();
  if (o.mull !== false) { ln(x + w / 2, y, x + w / 2, y + h, fr, 3.4, 'butt'); if (!o.arch) ln(x, y + h * .5, x + w, y + h * .5, fr, 3.4, 'butt'); }
  if (!o.arch) { ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); }
  rb(x - 9, y + h + 3, w + 18, 7, fr, { r: 2, lw: 1.5 });
}
function frameDraw(x, y, w, h, o = {}, art) {
  const fc = o.frame ?? '#c9a24c', m = o.mat ?? 4, th = o.th ?? 5;
  ctx.save(); ctx.shadowColor = 'rgba(20,10,24,.35)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2; rb(x, y, w, h, fc, { r: o.r ?? 2, lw: 1.6 }); ctx.restore();
  ctx.fillStyle = o.matColor ?? '#f5efe0'; ctx.fillRect(x + th, y + th, w - 2 * th, h - 2 * th);
  const ix = x + th + m, iy = y + th + m, iw = w - 2 * (th + m), ih = h - 2 * (th + m);
  ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip(); if (art) art(ix, iy, iw, ih); ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(ix, iy, iw, ih);
}
/* Greenleaf's leaf logo: a leaf with a midrib in a round badge; col is the badge colour */
function leafLogo(x, y, r, col = '#2f7a42', ink = '#f6f3e8') {
  ell(x, y, r, r, col, shade(col, .6), Math.max(1, r * .08));
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.6); ctx.beginPath(); ctx.moveTo(0, r * .62); ctx.quadraticCurveTo(-r * .62, 0, 0, -r * .66); ctx.quadraticCurveTo(r * .62, 0, 0, r * .62); ctx.fillStyle = ink; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(.8, r * .08); ctx.beginPath(); ctx.moveTo(0, r * .5); ctx.lineTo(0, -r * .5); ctx.stroke(); ctx.restore();
}

// ---- plants and soft furnishings (all base-centred at (x, y); s scales)
function leafAt(x, y, a, len, wd, c) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(wd, -len * .45, 0, -len); ctx.quadraticCurveTo(-wd, -len * .45, 0, 0); ctx.fillStyle = vg(-len, 0, lift(c, .22), shade(c, .8)); ctx.fill(); ctx.strokeStyle = 'rgba(15,60,25,.65)'; ctx.lineWidth = 1.2; ctx.stroke(); ln(0, -2, 0, -len * .85, 'rgba(15,60,25,.35)', 1); ctx.restore(); }
function potDraw(x, y, w, h, col) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w * .36, y); ctx.lineTo(x - w * .36, y); ctx.closePath(); ctx.fillStyle = hg(x - w / 2, x + w / 2, shade(col, .85), lift(col, .12)); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.7; ctx.stroke(); rb(x - w * .56, y - h - 5, w * 1.12, 8, shade(col, .95), { r: 3, lw: 1.5 }); ell(x, y - h - 3, w * .48, 2.6, '#4a3626'); }
function fern(x, y, s = 1, o = {}) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fsh(0, 1, 50, .28, 5); potDraw(0, 0, 34, 30, o.pot ?? '#c8714a'); const r = rnd(o.seed ?? 3), n = o.n ?? 11; for (let i = 0; i < n; i++) { const a = -PI / 2 + (i / (n - 1) - .5) * 2.7 + (r() - .5) * .2, len = 48 + r() * 26; ctx.strokeStyle = shade(o.leaf ?? '#4fa85a', .7); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -36); ctx.quadraticCurveTo(Math.cos(a) * len * .5, -36 + Math.sin(a) * len * .8, Math.cos(a) * len, -36 + Math.sin(a) * len * .55 + 14); ctx.stroke(); for (let j = 1; j < 6; j++) { const u = j / 6, px = Math.cos(a) * len * u, py = -36 + Math.sin(a) * len * u * .8 + 14 * u * u; leafAt(px, py, a + PI / 2 - .5, 11, 3.4, o.leaf ?? '#4fa85a'); leafAt(px, py, a + PI / 2 + .5 + PI, 11, 3.4, o.leaf ?? '#4fa85a'); } } ctx.restore(); }
function monstera(x, y, s = 1, o = {}) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fsh(0, 1, 54, .28, 5); potDraw(0, 0, 40, 32, o.pot ?? '#d8c8a0'); const L = [[-.9, 52], [-.4, 66], [.1, 74], [.6, 62], [1.0, 46], [-1.2, 36]]; for (const [a, len] of L) { ctx.strokeStyle = '#3a7a3c'; ctx.lineWidth = 3; ln(0, -38, Math.sin(a) * len * .8, -38 - Math.cos(a) * len * .8, '#3a7a3c', 3); ctx.save(); ctx.translate(Math.sin(a) * len * .8, -38 - Math.cos(a) * len * .8); ctx.rotate(a * .6); ctx.beginPath(); ctx.ellipse(0, -16, 22, 18, 0, 0, TAU); ctx.fillStyle = vg(-34, 2, '#5cb85e', '#2f7a42'); ctx.fill(); ctx.strokeStyle = 'rgba(15,60,25,.7)'; ctx.lineWidth = 1.4; ctx.stroke(); for (const [hx, hy] of [[-8, -18], [8, -12], [-6, -6]]) ell(hx, hy, 3.4, 2.4, '#2a5a30', null, 0, .4); ln(0, 0, 0, -32, 'rgba(15,60,25,.35)', 1.2); ctx.restore(); } ctx.restore(); }
function snakePlant(x, y, s = 1, o = {}) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fsh(0, 1, 40, .26, 4); potDraw(0, 0, 30, 26, o.pot ?? '#8a9a7a'); for (const [dx, a, len] of [[-9, -.14, 62], [-3, -.04, 78], [4, .06, 70], [10, .16, 56], [0, .22, 44]]) { ctx.save(); ctx.translate(dx, -28); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-7, -len * .6, 0, -len); ctx.quadraticCurveTo(7, -len * .6, 5, 0); ctx.closePath(); ctx.fillStyle = hg(-6, 6, '#2f6b3c', '#58a65c'); ctx.fill(); ctx.strokeStyle = 'rgba(15,60,25,.7)'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.strokeStyle = 'rgba(230,230,120,.6)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(-7, -len * .6, 0, -len); ctx.stroke(); ctx.restore(); } ctx.restore(); }
function bambooPlant(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fsh(0, 1, 40, .26, 4); potDraw(0, 0, 32, 26, '#6a5a44'); for (const [dx, h] of [[-8, 120], [0, 150], [8, 108]]) { rb(dx - 3, -26 - h, 6, h, '#9fbf5a', { r: 2, lw: 1.3 }); for (let j = 1; j < h / 26; j++) ln(dx - 3.6, -26 - j * 26, dx + 3.6, -26 - j * 26, '#5a7a2a', 1.8); for (let j = 0; j < 3; j++) leafAt(dx, -26 - h + j * 8, -1.1 + j * 1.1, 26, 5, '#6fb868'); } ctx.restore(); }
function bonsaiDraw(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); rb(-16, -9, 32, 9, '#7a5a3c', { r: 3, lw: 1.4 }); ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 4.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-2, -9); ctx.quadraticCurveTo(-8, -22, 2, -30); ctx.quadraticCurveTo(10, -36, 4, -44); ctx.stroke(); for (const [cx, cy, r] of [[-10, -34, 10], [8, -48, 12], [-2, -42, 11]]) ell(cx, cy, r, r * .75, vg(cy - r, cy + r, '#6cc070', '#2f7a42'), 'rgba(15,60,25,.6)', 1.2); ctx.restore(); }
function cactus(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); potDraw(0, 0, 24, 18, '#c8714a'); rb(-6, -52, 12, 36, '#5aa86a', { r: 6, lw: 1.5 }); rb(-16, -42, 8, 18, '#5aa86a', { r: 4, lw: 1.3 }); rb(8, -38, 8, 14, '#5aa86a', { r: 4, lw: 1.3 }); ln(-12, -26, -6, -26, '#5aa86a', 5); ln(6, -28, 12, -28, '#5aa86a', 5); ell(0, -54, 3, 2.2, '#f06a8a'); ctx.restore(); }
/* a hanging pot on a rope with trailing vines; sway in radians (live) */
function hangPot(x, y0, len, sway = 0, o = {}) {
  ctx.save(); ctx.translate(x, y0); ctx.rotate(sway);
  ln(0, 0, 0, len, 'rgba(120,90,50,.9)', 1.6); ln(-12, len + 12, 0, len, 'rgba(120,90,50,.9)', 1.2); ln(12, len + 12, 0, len, 'rgba(120,90,50,.9)', 1.2);
  ctx.beginPath(); ctx.moveTo(-14, len + 10); ctx.lineTo(14, len + 10); ctx.lineTo(10, len + 28); ctx.lineTo(-10, len + 28); ctx.closePath(); ctx.fillStyle = hg(-14, 14, shade(o.pot ?? '#c8714a', .85), lift(o.pot ?? '#c8714a', .12)); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
  const r = rnd(o.seed ?? 5); for (let i = 0; i < 7; i++) { const dx = -10 + i * 3.4, L = 22 + r() * (o.vine ?? 34); ctx.strokeStyle = '#3a8a46'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(dx, len + 12); ctx.quadraticCurveTo(dx + (r() - .5) * 10, len + 12 + L * .5, dx + (r() - .5) * 8 + sway * 10, len + 12 + L); ctx.stroke(); for (let j = 1; j < 4; j++) ell(dx + (r() - .5) * 6, len + 12 + L * j / 4, 3.2, 2.2, '#58b060', 'rgba(15,60,25,.5)', .8, r()); }
  for (let i = 0; i < 6; i++) leafAt(-8 + i * 3.2, len + 12, -.9 + i * .36, 14 + (i % 2) * 6, 4, '#58b060');
  ctx.restore();
}
function wickerChair(x, y, o = {}) {
  const w = o.w ?? 46; ctx.save(); ctx.translate(x, y); fsh(0, 1, w + 14, .26, 5);
  ln(-w / 2 + 4, -22, -w / 2 + 2, 0, '#8a6a3a', 3.4); ln(w / 2 - 4, -22, w / 2 - 2, 0, '#8a6a3a', 3.4);
  ctx.beginPath(); ctx.moveTo(-w / 2, -26); ctx.quadraticCurveTo(-w / 2 - 6, -70, 0, -84); ctx.quadraticCurveTo(w / 2 + 6, -70, w / 2, -26); ctx.closePath(); ctx.fillStyle = hg(-w / 2, w / 2, '#b28a50', '#e2c488'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(90,56,20,.45)'; ctx.lineWidth = 1; for (let j = 0; j < 12; j++) { const yy = -30 - j * 4.6; ln(-w / 2 - 6, yy, w / 2 + 6, yy, 'rgba(90,56,20,.4)', 1, 'butt'); } for (let i = -5; i <= 5; i++) ln(i * 5, -84, i * 5.6, -26, 'rgba(90,56,20,.3)', 1, 'butt'); ctx.restore();
  rb(-w / 2 - 2, -30, w + 4, 12, o.cushion ?? '#8fc27a', { r: 5, lw: 1.6 }); if (o.stripe !== false) stripesV(-w / 2 + 2, -29, w / 2 - 2, -20, 6, 2, 'rgba(255,255,255,.5)', 2);
  ctx.restore();
}
function cushion(x, y, w, h, col, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); rb(-w / 2, -h, w, h, col, { r: h * .4, lw: 1.5 }); ctx.restore(); }
function slatPanel(x0, y0, x1, y1, col = '#d8bf7a', gap = 9) { ctx.fillStyle = shade(col, .45); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); for (let x = x0 + 1; x < x1 - 4; x += gap) { ctx.fillStyle = hg(x, x + gap - 3, shade(col, .9), lift(col, .1)); ctx.fillRect(x, y0, gap - 3, y1 - y0); } ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); }
/* a living wall: a grid of plant pockets in a wooden frame */
function livingWall(x0, y0, x1, y1, seed = 2) {
  rb(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8, '#9a7a44', { r: 4, lw: 1.8 });
  ctx.fillStyle = '#3d5a34'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const r = rnd(seed), cols = ['#3f8f4a', '#58b060', '#2f7a42', '#7bc47a', '#4f9a5a', '#88c870', '#c8e090'];
  for (let y = y0 + 6; y < y1 - 4; y += 13) for (let x = x0 + 6 + ((y - y0) % 26 ? 8 : 0); x < x1 - 4; x += 16) { const c = cols[(r() * cols.length) | 0], rr = 7 + r() * 4; ell(x, y, rr, rr * .8, rg(x - 2, y - 2, 1, rr, [[0, lift(c, .3)], [1, shade(c, .8)]]), 'rgba(15,60,25,.55)', 1); if (r() > .86) ell(x + 2, y - 2, 2.6, 2.6, ['#f7c948', '#f27a8a', '#fff'][(r() * 3) | 0]); }
  ctx.fillStyle = vg(y0, y1, 'rgba(255,255,255,.14)', 'rgba(0,0,0,.18)'); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}
function rugOval(x, y, rx, ry, c1, c2) { ell(x, y, rx, ry, c1, 'rgba(40,30,20,.6)', 1.6); ell(x, y, rx * .8, ry * .8, c2, 'rgba(40,30,20,.3)', 1.2); ell(x, y, rx * .55, ry * .55, c1); }
function jar(x, y, w, h, col, lid = '#8a6a3a') { rb(x - w / 2, y - h, w, h, rgba(col, .55), { r: 3, lw: 1.3, flat: true }); ctx.fillStyle = col; ctx.fillRect(x - w / 2 + 2, y - h * .62, w - 4, h * .6 - 2); rb(x - w / 2 - 1, y - h - 4, w + 2, 5, lid, { r: 2, lw: 1.1 }); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x - w / 2 + 2, y - h + 3, 2, h - 7); }
function stool(x, y, o = {}) { ctx.save(); ctx.translate(x, y); fsh(0, 1, 34, .24, 4); ln(-9, -24, -12, 0, '#8a6a3a', 3.4); ln(9, -24, 12, 0, '#8a6a3a', 3.4); ell(0, -26, 15, 5, o.top ?? '#d8bf7a', OUT, 1.5); ctx.restore(); }

// ================================================================================================ the Greenleaf rooms, top and middle floors (static art in room coordinates 250 x 318, cached at 3x; LIVE and FRONT are drawn each frame)
const GLS = {}, GLL = {}, GLF = {};
const inRoom = (r, fn) => { ctx.save(); ctx.translate(r.x0, r.y0); fn(); ctx.restore(); };
function bed(x, y, w, h, soil = '#4a3220') {      /* a raised wooden planter bed, front view: soil on top, planks */
  fsh(x + w / 2, y + 3, w + 12, .26, 5);
  poly([[x + 2, y - h - 7], [x + w - 2, y - h - 7], [x + w + 3, y - h + 3], [x - 3, y - h + 3]], soil, OUT, 1.4);
  rb(x - 3, y - h + 2, w + 6, h, '#b8925a', { r: 2, lw: 1.7 }); for (let i = 1; i < 3; i++) ln(x - 3, y - h + 2 + i * h / 3, x + w + 3, y - h + 2 + i * h / 3, 'rgba(60,36,12,.5)', 1.3);
}
function tomatoPlant(x, y, s = 1, seed = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const r = rnd(seed);
  ln(-8, 0, -8, -78, '#c9a86a', 2.4); ln(8, 0, 8, -70, '#c9a86a', 2.4);
  for (let i = 0; i < 9; i++) { const a = r() * TAU, rr = 10 + r() * 14, cx = (r() - .5) * 30, cy = -14 - r() * 56; ell(cx, cy, rr, rr * .75, vg(cy - rr, cy + rr, '#5cb85e', '#2f7a42'), 'rgba(15,60,25,.55)', 1.1, a); }
  for (let i = 0; i < 6; i++) { const cx = (r() - .5) * 34, cy = -10 - r() * 50; ell(cx, cy, 5.4, 5.4, rg(cx - 1.4, cy - 1.4, .5, 6, [[0, '#ff8a70'], [1, '#c23a2b']]), 'rgba(80,16,10,.6)', 1); ell(cx, cy - 4.4, 2.4, 1.2, '#2f7a42'); }
  ctx.restore();
}
function lettuceRow(x, y, n, s = 1, seed = 2) { const r = rnd(seed); for (let i = 0; i < n; i++) { const cx = x + i * 17 * s, cols = ['#7bc47a', '#a6dc82', '#5cb85e', '#c06a9a']; const c = cols[(r() * (i % 5 === 3 ? 4 : 3)) | 0]; for (let j = 0; j < 7; j++) { const a = j / 7 * TAU; ell(cx + Math.cos(a) * 5 * s, y - 8 * s + Math.sin(a) * 3 * s, 7 * s, 5 * s, lift(c, .08 * j / 7), 'rgba(15,60,25,.4)', .8, a); } ell(cx, y - 9 * s, 5 * s, 4 * s, lift(c, .3), 'rgba(15,60,25,.4)', .8); } }

GLS.gsky = (w, h) => {        /* Sky Garden: a glasshouse. Glass back wall and roof, raised beds with tomatoes and lettuce, a bean trellis, stepping stones */
  const b = roomBox(w, h, { wall: '#bfe6f4', side: '#9ccbdd', ceil: '#cfeaf4', base: '#6a8a5a', trim: '#f4fbf4', floor: { kind: 'grass', a: '#74bb5c', seed: 3 }, beams: [.14, .5, .86] });
  onBack(b, () => {
    ctx.fillStyle = vg(b.by0, b.by1, '#6ebcec', '#e6f6fb'); ctx.fillRect(b.bx0, b.by0, b.bx1 - b.bx0, b.by1 - b.by0);
    ell(150, 70, 22, 8, 'rgba(255,255,255,.85)'); ell(164, 64, 16, 8, 'rgba(255,255,255,.85)'); ell(70, 96, 20, 7, 'rgba(255,255,255,.8)');
    ctx.fillStyle = '#8fd09a'; ctx.beginPath(); ctx.moveTo(b.bx0, 214); ctx.quadraticCurveTo(70, 176, 120, 206); ctx.quadraticCurveTo(170, 182, b.bx1, 210); ctx.lineTo(b.bx1, b.by1); ctx.lineTo(b.bx0, b.by1); ctx.fill();
    ctx.strokeStyle = '#f4fbf4'; ctx.lineWidth = 3; for (let x = b.bx0; x <= b.bx1; x += 34.4) ln(x, b.by0, x, b.by1, '#f4fbf4', 3, 'butt'); for (let y = b.by0 + 50; y < b.by1; y += 50) ln(b.bx0, y, b.bx1, y, '#f4fbf4', 3, 'butt');
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(60, b.by0); ctx.lineTo(110, b.by0); ctx.lineTo(60, b.by1); ctx.lineTo(10, b.by1); ctx.fill();
  });
  ctx.save(); path([[0, 0], [w, 0], [b.bx1, b.by0], [b.bx0, b.by0]]); ctx.clip(); ctx.fillStyle = 'rgba(150,210,235,.55)'; ctx.fillRect(0, 0, w, b.by0); for (let x = -40; x < w + 40; x += 28) ln(x, 0, w / 2 + (x - w / 2) * .84, b.by0, 'rgba(255,255,255,.8)', 1.6); ln(0, 10, w, 10, 'rgba(255,255,255,.7)', 1.4); ctx.restore();
  lampDraw(w / 2, 11, 'globe');
  /* the bean trellis against the glass */
  for (const [x0, x1] of [[30, 60], [196, 226]]) { ln(x0, 250, x0 + 12, 70, '#c9a86a', 3); ln(x1, 250, x1 - 12, 70, '#c9a86a', 3); for (let y = 90; y < 250; y += 30) ln(x0 + 12 * (250 - y) / 180, y, x1 - 12 * (250 - y) / 180, y, 'rgba(201,168,106,.0)', 1); }
  ln(48, 250, 56, 90, '#c9a86a', 3); ln(70, 250, 62, 90, '#c9a86a', 3);
  const r = rnd(3); for (let i = 0; i < 26; i++) { const y = 100 + r() * 150, x = 52 + (r() - .5) * 30; leafAt(x, y, (r() - .5) * 2.6, 12, 5, '#4fa85a'); } for (let i = 0; i < 6; i++) { const x = 44 + r() * 34, y = 130 + r() * 110; ln(x, y, x + 1, y + 20, '#7bc47a', 3.4); }
  /* stepping stones */
  for (const [x, y, rx] of [[124, 296, 26], [112, 288, 16], [130, 281, 12]]) ell(x, y, rx, rx * .26, vg(y - 4, y + 4, '#d8d4c8', '#a39d90'), OUT, 1.3);
  /* beds */
  bed(30, FY + 8, 92, 30); tomatoPlant(50, FY - 16, 1, 1); tomatoPlant(84, FY - 18, .92, 2); tomatoPlant(108, FY - 16, .85, 4);
  bed(150, FY + 8, 82, 26); lettuceRow(160, FY - 14, 5, 1, 7);
  /* a watering can and a bucket */
  ctx.save(); ctx.translate(142, FY + 10); rb(-9, -18, 18, 18, '#7ab4d8', { r: 3, lw: 1.5 }); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(9, -14); ctx.lineTo(24, -26); ctx.stroke(); ell(25, -27, 4, 2, '#7ab4d8', OUT, 1.2); ctx.beginPath(); ctx.arc(0, -18, 8, PI, TAU); ctx.stroke(); ctx.restore();
  roomFinish(w, h, .22);
};
GLL.gsky = (r, t, st, lamp) => inRoom(r, () => {
  V2.beam(120, 20, 150, 300, 70, 190, '255,244,200', .12 * lamp);
  for (let i = 0; i < 3; i++) { const ph = (t * .13 + i / 3) % 1, x = 40 + 170 * ph + 14 * Math.sin(t * 2 + i * 2), y = 110 + 60 * Math.sin(t * .8 + i * 3) + i * 26, fl = Math.abs(Math.sin(t * 9 + i)); ctx.save(); ctx.translate(x, y); for (const sg of [-1, 1]) { ctx.save(); ctx.scale(sg * (.35 + .65 * fl), 1); ell(5, -2, 7, 5, ['#f7a03c', '#f4e04a', '#7fc4f0'][i], 'rgba(60,30,10,.7)', 1); ctx.restore(); } ln(0, -4, 0, 4, '#2a1a10', 1.6); ctx.restore(); }
});

GLS.gsalad = (w, h) => {      /* Salad Bar: white tile, sage band, wicker pendants, a chalkboard, bowls on a shelf, a kombucha tap. The bar itself is in the front layer */
  const b = roomBox(w, h, { wall: '#f1f4e8', side: '#cdd8bc', ceil: '#fbfcf6', base: '#6a8a5a', trim: '#ffffff', floor: { kind: 'terrazzo', a: '#e8e4d0', flecks: ['#f6efe0', '#a8c49a', '#c9d8b0', '#e8e0c0'], seed: 4 }, wains: { h: 70, color: '#9bc08a', rail: '#e9f2dc', panels: 6 }, beams: true });
  onBack(b, () => tileGrid(b.bx0, b.by0, b.bx1, 200, 15, 15, 'rgba(120,150,110,.28)', 1, true));
  for (const x of [58, 125, 192]) lampDraw(x, 22 + (x === 125 ? 6 : 0), 'wicker');
  rb(34, 40, 96, 60, '#4a3a2c', { r: 4, lw: 2 }); ctx.fillStyle = vg(44, 96, '#34513f', '#27402f'); ctx.fillRect(38, 44, 88, 52);        /* the chalkboard; the writing is live */
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.ellipse(80, 72, 28, 14, .3, 0, TAU); ctx.fill();
  rb(150, 66, 66, 5, '#b8925a', { r: 2, lw: 1.4 }); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(160 + i * 14, 64, 8, 3, 0, 0, TAU); ctx.fillStyle = ['#f6efe0', '#c9a86a', '#8fc27a', '#f6efe0'][i]; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; ctx.stroke(); }
  rb(150, 98, 66, 5, '#b8925a', { r: 2, lw: 1.4 }); jar(162, 98, 12, 20, '#d8a23a'); jar(180, 98, 12, 24, '#6fb858'); jar(198, 98, 12, 18, '#c23a2b');
  /* the kombucha tap: a barrel on a stand, a copper tap, a glass jar on top */
  fsh(204, FY + 4, 48, .28, 5);
  rb(186, 190, 36, 66, '#a77a44', { r: 8, lw: 1.8 }); for (const y of [204, 224, 242]) ln(186, y, 222, y, 'rgba(60,36,12,.7)', 2); rb(190, 256, 28, 22, '#8a6a3a', { r: 2, lw: 1.5 });
  ctx.fillStyle = '#c87a3a'; ctx.fillRect(176, 222, 14, 6); rb(172, 226, 8, 10, '#c87a3a', { r: 2, lw: 1.2 }); ell(176, 238, 2, 2, '#e8a050');
  jar(204, 188, 26, 30, '#e8b84a'); ell(204, 172, 8, 3.4, 'rgba(230,200,120,.9)', 'rgba(120,80,20,.6)', 1);
  roomFinish(w, h, .3);
};
GLL.gsalad = (r, t, st, lamp) => inRoom(r, () => {
  dress("TODAY'S SPECIAL", 82, 54, 8.6, { fill: '#f2f0e0', spacing: 1, maxW: 80 }); ln(46, 59, 118, 59, 'rgba(242,240,224,.5)', 1);
  dress('KALE', 82, 74, 14, { fill: '#f2f0e0', font: 'Bangers', weight: 400, spacing: 1 }); dress('(MORE KALE)', 82, 88, 7, { fill: 'rgba(242,240,224,.8)', maxW: 76 });
  dress('KOMBUCHA', 204, 280, 6, { fill: '#f6efe0', maxW: 30 });
});
GLF.gsalad = (r, t, st) => inRoom(r, () => {      /* the bar: bamboo front, six pans of salad under a glass sneeze guard */
  fsh(125, 304, 220, .3, 8);
  rb(20, 252, 210, 50, '#c9a463', { r: 3, lw: 1.9 }); stripesV(26, 256, 224, 298, 11, 2, 'rgba(90,56,20,.4)', 4); rb(14, 244, 222, 11, '#f2e6c8', { r: 3, lw: 1.8 }); ctx.fillStyle = '#4f9a52'; ctx.fillRect(20, 296, 210, 6);
  for (let i = 0; i < 6; i++) {
    const x = 26 + i * 34, cols = ['#7bc47a', '#d8584a', '#bfe0a0', '#f08a2a', '#f2cf4a', '#a64a8a'][i];
    poly([[x, 244], [x + 30, 244], [x + 27, 234], [x + 3, 234]], '#cfd6dc', OUT, 1.3);
    ctx.beginPath(); ctx.moveTo(x + 3, 237); ctx.quadraticCurveTo(x + 15, 218 - (i % 2) * 3, x + 27, 237); ctx.closePath(); ctx.fillStyle = vg(220, 238, lift(cols, .25), shade(cols, .85)); ctx.fill(); ctx.strokeStyle = 'rgba(40,30,20,.55)'; ctx.lineWidth = 1.1; ctx.stroke();
    for (let k = 0; k < 4; k++) ell(x + 7 + k * 5.2, 230 - (k % 2) * 4, 1.6, 1.6, lift(cols, .5));
  }
  for (const x of [32, 220]) ln(x, 244, x, 200, '#b9c3cc', 3);
  ctx.fillStyle = 'rgba(210,238,248,.34)'; ctx.fillRect(32, 206, 188, 30); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.4; ctx.strokeRect(32, 206, 188, 30);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(60, 206); ctx.lineTo(84, 206); ctx.lineTo(70, 236); ctx.lineTo(46, 236); ctx.fill(); ctx.beginPath(); ctx.moveTo(140, 206); ctx.lineTo(150, 206); ctx.lineTo(136, 236); ctx.lineTo(126, 236); ctx.fill();
  ln(32, 206, 220, 206, '#b9c3cc', 2.6);
});

GLS.gzen = (w, h) => {        /* Meditation Room: sand walls, a moon gate onto a dusk bamboo garden, tatami, cushions, a gong, a sand tray */
  const b = roomBox(w, h, { wall: '#eadcbc', side: '#bba984', ceil: '#f6eed8', base: '#6a5a3c', trim: '#fff8e6', floor: { kind: 'tatami', a: '#c9c07a', b: '#bdb26c', n: 5, rows: 3, grout: '#5a4a2a' }, beams: true });
  onBack(b, () => { stripesV(b.bx0, b.by0, b.bx1, b.by1, 34.4, 3, 'rgba(120,90,50,.55)'); stripesH(b.bx0, b.by0, b.bx1, b.by1, 50, 3, 'rgba(120,90,50,.45)'); });
  ctx.save(); ctx.beginPath(); ctx.arc(125, 132, 58, 0, TAU); ctx.clip();
  ctx.fillStyle = vg(74, 190, '#f2b27a', '#5a4a8c'); ctx.fillRect(60, 70, 130, 130); ell(150, 108, 14, 14, 'rgba(255,240,200,.9)');
  for (const [x, hh] of [[78, 90], [96, 120], [150, 100], [172, 130], [186, 84]]) { rb(x - 3, 190 - hh, 6, hh, '#2f4a3a', { r: 2, lw: 0, flat: true }); for (let j = 1; j < 5; j++) ln(x - 3, 190 - j * 24, x + 3, 190 - j * 24, '#1f3428', 1.6); leafAt(x, 190 - hh, -1.1, 22, 4, '#2f5a42'); leafAt(x, 190 - hh + 12, 1.1, 22, 4, '#2f5a42'); }
  ctx.restore(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(125, 132, 58, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#a77a44'; ctx.lineWidth = 2.4; ctx.stroke();
  lampDraw(w / 2 - 36, 16, 'globe'); lampDraw(w / 2 + 36, 16, 'globe');
  /* the gong on a frame (right) */
  fsh(204, FY + 6, 56, .28, 5);
  rb(176, 150, 6, 130, '#6a4a2a', { r: 3, lw: 1.5 }); rb(228 - 6, 150, 6, 130, '#6a4a2a', { r: 3, lw: 1.5 }); rb(172, 146, 60, 7, '#6a4a2a', { r: 3, lw: 1.5 });
  ln(205, 153, 205, 168, '#4a3220', 1.8); ell(205, 192, 24, 24, rg(200, 186, 2, 26, [[0, '#f0d27a'], [1, '#a77a2a']]), OUT, 2); ell(205, 192, 8, 8, '#d9b45a', 'rgba(90,60,10,.7)', 1.4); ell(205, 192, 16, 16, null, 'rgba(90,60,10,.4)', 1.2);
  /* a bonsai on a shelf (left), cushions, the sand tray */
  rb(30, 214, 50, 6, '#6a4a2a', { r: 2, lw: 1.4 }); bonsaiDraw(54, 214, 1);
  for (const [x, c] of [[56, '#b04a3a'], [96, '#3a6a4a'], [136, '#b04a3a']]) { fsh(x, FY + 10, 40, .22, 4); cushion(x, FY + 14, 38, 16, c); ell(x, FY - 2, 14, 3, lift(c, .2)); }
  poly([[150, FY + 20], [214, FY + 20], [206, FY + 2], [158, FY + 2]], '#d8bf7a', OUT, 1.5); poly([[154, FY + 17], [210, FY + 17], [203, FY + 5], [160, FY + 5]], '#f0e6c8', null); for (let i = 0; i < 4; i++) ln(158 + i * 2, FY + 7 + i * 3, 206 - i * 2, FY + 7 + i * 3, 'rgba(120,100,60,.45)', 1.2); for (const [x, y, r2] of [[174, FY + 11, 6], [190, FY + 9, 4], [198, FY + 13, 5]]) ell(x, y, r2, r2 * .65, vg(y - 4, y + 4, '#9a968c', '#5f5b52'), OUT, 1.1);
  roomFinish(w, h, .3);
};
GLL.gzen = (r, t, st, lamp) => inRoom(r, () => {
  ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < 3; i++) { const ph = ((t * .22 + i / 3) % 1), x = 232 + 8 * Math.sin(ph * 6 + i), y = 238 - ph * 120, rr = 4 + ph * 12; ctx.fillStyle = rg(x, y, 0, rr, [[0, `rgba(255,250,240,${.3 * (1 - ph)})`], [1, 'rgba(255,250,240,0)']]); ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); } ctx.restore();
});

GLS.gsun = (w, h) => {        /* Sunroom: butter walls, three arched windows, wicker, hanging ferns, terracotta tile, a rug */
  const b = roomBox(w, h, { wall: '#f6e6a6', side: '#cfb872', ceil: '#fff7dc', base: '#b0743c', trim: '#fffbe8', floor: { kind: 'checker', a: '#d98a5a', b: '#cf7d4e', n: 6, rows: 4, grout: 'rgba(120,60,30,.35)' }, wains: { h: 46, color: '#e9cf7a', rail: '#fff3bd', panels: false }, beams: true });
  for (const x of [34, 98, 162]) windowDraw(x, 42, 52, 118, { arch: true, seed: x, view: 'trees', glass: ['#8cc8f0', '#fdf4d0'] });
  lampDraw(w / 2, 12, 'wicker');
  rugOval(125, 300, 92, 14, '#e9a43a', '#fff2c8');
  wickerChair(54, FY + 16, { cushion: '#8fc27a' }); wickerChair(196, FY + 16, { cushion: '#f2a28a' });
  fsh(125, FY + 14, 52, .26, 5); ln(125, 238, 125, 288, '#8a6a3a', 4); ell(125, 236, 24, 6, vg(230, 242, '#e8c88a', '#c9a064'), OUT, 1.6); ell(125, 288, 16, 3, '#8a6a3a');
  ctx.save(); ctx.translate(120, 234); rb(-9, -14, 18, 14, '#f6f1e4', { r: 5, lw: 1.5 }); ln(9, -10, 15, -8, OUT, 2); ln(-9, -9, -14, -12, OUT, 2); rb(-5, -19, 10, 5, '#f6f1e4', { r: 2, lw: 1.2 }); ctx.restore(); rb(131, 228, 9, 7, '#f6f1e4', { r: 2, lw: 1.2 });
  monstera(30, FY + 4, .9); snakePlant(224, FY + 4, .9);
  roomFinish(w, h, .22);
};
GLL.gsun = (r, t, st, lamp) => inRoom(r, () => {
  hangPot(60, 18, 36, .05 * Math.sin(t * 1.3), { seed: 2 }); hangPot(190, 18, 52, .05 * Math.sin(t * 1.1 + 1), { seed: 7, vine: 46 });
  for (const x of [60, 124, 188]) V2.beam(x, 50, x + 40, 304, 40, 70, '255,240,180', .1 * lamp);
  V2.dust(30, 60, 220, 290, t, { n: 18, seed: 3, size: 2.2, alpha: .55, speed: 6 });
});

GLS.gwell = (w, h) => {       /* Wellness Room: white walls with bamboo slats, a mirror, mats on a rack, a balance ball, a kombucha tap, plants */
  const b = roomBox(w, h, { wall: '#f4f2ea', side: '#d6d2c2', ceil: '#fdfcf6', base: '#9a7a44', trim: '#ffffff', floor: { kind: 'planks', a: '#e6cfa0', pw: 28, seam: '#b8985a', seed: 6 }, wains: { h: 120, color: '#d8bf7a', rail: '#f2e6c0', slats: 11 } });
  lampDraw(w / 2, 12, 'drum');
  rb(100, 60, 104, 92, '#8a6a3a', { r: 4, lw: 2 }); ctx.fillStyle = vg(66, 146, '#dff1f6', '#f8fcfd'); ctx.fillRect(105, 65, 94, 82); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(120, 65); ctx.lineTo(146, 65); ctx.lineTo(116, 147); ctx.lineTo(105, 147); ctx.lineTo(105, 100); ctx.fill();
  /* the mat rack (left): rolled mats in colours */
  fsh(54, FY + 6, 70, .26, 5); rb(26, 224, 56, 6, '#8a6a3a', { r: 2, lw: 1.4 }); rb(26, 262, 56, 6, '#8a6a3a', { r: 2, lw: 1.4 }); for (const x of [30, 78]) rb(x - 2, 216, 4, 66, '#8a6a3a', { r: 2, lw: 1.3 });
  [['#4fb0a0', 32], ['#e8704a', 46], ['#7a5ac8', 60], ['#f2cf4a', 74]].forEach(([c, x], i) => { ell(x, 226, 6, 6, c, OUT, 1.3); ell(x, 226, 2.6, 2.6, shade(c, .5)); ell(x, 264, 6, 6, ['#3a6aa8', '#8fc27a', '#d86a9a', '#4fb0a0'][i], OUT, 1.3); });
  /* the balance ball and a mat on the floor */
  poly([[110, 316], [190, 316], [180, 292], [120, 292]], '#4fb0a0', 'rgba(20,50,40,.6)', 1.5); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(130, 300, 40, 2);
  fsh(100, FY + 10, 46, .28, 5); ell(100, FY - 6, 22, 22, rg(94, FY - 14, 2, 24, [[0, '#a6dc82'], [1, '#3f8f4a']]), OUT, 1.8); ell(93, FY - 14, 6, 4, 'rgba(255,255,255,.5)', null, 0, -.5);
  /* the kombucha tap station (right): a barrel, a copper tap, a glass dispenser */
  fsh(214, FY + 6, 40, .26, 5); rb(196, 208, 36, 70, '#a77a44', { r: 8, lw: 1.8 }); for (const y of [222, 242, 260]) ln(196, y, 232, y, 'rgba(60,36,12,.7)', 2); ctx.fillStyle = '#c87a3a'; ctx.fillRect(184, 240, 14, 6); rb(180, 244, 8, 10, '#c87a3a', { r: 2, lw: 1.2 });
  jar(214, 206, 24, 34, '#e8b84a'); ell(214, 188, 8, 3.2, 'rgba(230,200,120,.9)', 'rgba(120,80,20,.6)', 1); rb(184, 262, 22, 18, '#f6f1e4', { r: 3, lw: 1.3 });
  snakePlant(228, FY + 4, .6); fern(40, 210, .55, { pot: '#d8c8a0' });
  roomFinish(w, h, .26);
};
GLL.gwell = (r, t, st, lamp) => inRoom(r, () => { dress('BREATHE', 62, 70, 12, { fill: '#4f8a52', font: 'Bangers', weight: 400, spacing: 2 }); dress('KOMBUCHA', 214, 284, 6, { fill: '#f6efe0', maxW: 30 }); dress('ON TAP', 188, 232, 5, { fill: '#7a4a1a', maxW: 24 }); });

GLS.gstation = (w, h) => {    /* Greenleaf's Nurses' Station: a small bamboo hub, cubbies of herbs, a whiteboard, eight leaf-shaped call lights. The counter and the ORGANIC sign are in the front layer */
  const b = roomBox(w, h, { wall: '#d6e6c4', side: '#aebf9a', ceil: '#f2f6e8', base: '#6a8a5a', trim: '#fbfdf3', floor: { kind: 'bamboo', a: '#e0c88c', pw: 26, seam: '#a4864a', seed: 8 }, wains: { h: 56, color: '#c9a463', rail: '#eadfb4', slats: 12 }, beams: true });
  lampDraw(w * .3, 12, 'panel'); lampDraw(w * .72, 12, 'panel');
  rb(28, 70, 92, 72, '#a77a44', { r: 3, lw: 1.8 });     /* cubbies with pots of herbs */
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { const x = 34 + i * 28, y = 76 + j * 32; rb(x, y, 24, 28, '#e9dcc0', { r: 2, lw: 1.2, flat: true }); potDraw(x + 12, y + 27, 14, 11, '#c8714a'); for (let k = 0; k < 4; k++) leafAt(x + 12, y + 17, -.9 + k * .6, 10, 3.4, ['#5cb85e', '#7bc47a', '#3f8f4a'][k % 3]); }
  rb(132, 72, 84, 66, '#c9ced6', { r: 3, lw: 1.8 }); rb(136, 76, 76, 56, '#fdfdfb', { r: 1.5, lw: 1.1, flat: true }); rb(150, 134, 48, 5, '#9aa3b0', { r: 2, lw: 1.2 });
  rb(134, 148, 80, 28, '#2a3a2a', { r: 4, lw: 1.8 });                             /* the call-light panel: eight leaves, all dark here */
  for (let i = 0; i < 8; i++) { const x = 144 + (i % 4) * 20, y = 156 + Math.floor(i / 4) * 12; ctx.save(); ctx.translate(x, y); ctx.rotate(-.6); ctx.beginPath(); ctx.moveTo(0, 5); ctx.quadraticCurveTo(-6, 0, 0, -6); ctx.quadraticCurveTo(6, 0, 0, 5); ctx.fillStyle = '#46604a'; ctx.fill(); ctx.strokeStyle = '#161e16'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
  ell(40, 168, 16, 16, '#fbf7ea', OUT, 2); ell(40, 168, 12.6, 12.6, null, 'rgba(0,0,0,.25)', 1); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ln(40 + Math.cos(a) * 10, 168 + Math.sin(a) * 10, 40 + Math.cos(a) * 12, 168 + Math.sin(a) * 12, '#2a2630', i % 3 ? 1 : 1.8); }
  fern(216, FY + 2, .8);
  rb(150, 226, 74, 22, '#a77a44', { r: 3, lw: 1.6 }); for (let i = 0; i < 9; i++) leafAt(158 + i * 8, 226, -.5 + (i % 3) * .5, 14 + (i % 2) * 6, 4.4, ['#5cb85e', '#7bc47a', '#3f8f4a'][i % 3]);
  roomFinish(w, h, .3);
};
GLL.gstation = (r, t, st, lamp) => inRoom(r, () => { dress('NO PESTICIDES', 174, 88, 8, { fill: '#2a6a3a', maxW: 70, weight: 900 }); dress('TODAY:', 174, 104, 7.4, { fill: '#26242c' }); dress('KALE', 174, 119, 11, { fill: '#2a6a3a', font: 'Bangers', weight: 400 }); });
GLF.gstation = (r, t, st) => {
  inRoom(r, () => {
    fsh(125, 304, 210, .3, 8); rb(16, 238, 218, 66, '#c9a463', { r: 3, lw: 1.9 }); stripesV(22, 244, 228, 298, 11, 2, 'rgba(90,56,20,.4)', 4); rb(10, 228, 230, 12, '#f2e6c8', { r: 3, lw: 1.8 });
    rb(26, 218, 24, 12, '#2a3036', { r: 2, lw: 1.3 }); rb(30, 210, 16, 10, '#5aa86a', { r: 2, lw: 1.1 }); for (let i = 0; i < 5; i++) leafAt(110 + i * 7, 228, -.6 + i * .3, 14, 4, '#5cb85e'); potDraw(124, 228, 22, 14, '#d8c8a0');
    leafLogo(125, 270, 14, '#2f7a42');
  });
  const x0 = r.x0 + 125;
  ln(x0 - 40, r.y0 + 14, x0 - 40, r.y0 + 28, 'rgba(90,60,30,.9)', 1.6); ln(x0 + 40, r.y0 + 14, x0 + 40, r.y0 + 28, 'rgba(90,60,30,.9)', 1.6);
  plate([x0 - 56, r.y0 + 26, 112, 32], 'ORGANIC', { fill: '#2f7a42', stroke: '#f6f3e8', lw: 3, ink: '#f6f3e8', size: 22, spacing: 3, pad: 4, r: 8, heroSize: 22, id: 'k15.organic' });
};

GLS.gmed = (w, h) => {        /* Med Room: pale green, a herbal tea cabinet, a locked med cabinet with a leaf, a pill-organiser wall, a sink */
  const b = roomBox(w, h, { wall: '#d4ebdc', side: '#a9c9b6', ceil: '#f2faf5', base: '#e6eeec', trim: '#fbfdfc', floor: { kind: 'tile', a: '#e8efe6', b: '#dce6d8', n: 7, rows: 4, grout: 'rgba(90,110,90,.28)' }, wains: { h: 64, color: '#b9d8c4', rail: '#f0f8f2', panels: 6 } });
  lampDraw(w / 2, 12, 'panel');
  rb(26, 34, 84, 76, '#f1f8f5', { r: 3, lw: 1.8 }); ctx.fillStyle = 'rgba(190,230,210,.4)'; ctx.fillRect(31, 39, 34, 66); ctx.fillRect(71, 39, 34, 66); ln(68, 36, 68, 108, OUT, 1.6);
  for (const [x, y] of [[36, 62], [46, 62], [56, 62], [76, 62], [86, 62], [96, 62], [36, 94], [46, 94], [56, 94], [76, 94], [86, 94], [96, 94]]) jar(x, y, 8, 14 + (x % 3) * 2, ['#8fc27a', '#c9a86a', '#d9b45a', '#a6d0a0', '#7ab0a0', '#e0b6c0'][(x + y) % 6]);
  rb(26, 74, 84, 3, '#b8925a', { r: 1, lw: 1 });
  /* the locked med cabinet with a green cross and a leaf, and a keypad */
  rb(124, 54, 56, 78, '#f4f6f4', { r: 4, lw: 2 }); rb(129, 59, 46, 68, '#e8eeea', { r: 3, lw: 1.3 }); ell(152, 82, 12, 12, '#2f7a42', 'rgba(10,50,20,.7)', 1.5); ctx.fillStyle = '#fff'; ctx.fillRect(150, 74, 4, 16); ctx.fillRect(144, 80, 16, 4);
  rb(140, 104, 24, 12, '#2a2f38', { r: 2, lw: 1.2 }); for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) ell(145 + i * 7, 108 + j * 5, 1.6, 1.6, '#e4e8ee'); ell(160, 107, 2, 2, '#59d56b');
  /* the pill-organiser wall: seven days by four times */
  rb(188, 48, 38, 54, '#f8fbf8', { r: 3, lw: 1.6 }); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { rb(191 + i * 8.6, 66 + j * 8.6, 7, 7, '#fff', { r: 1.4, lw: .9, flat: true }); ell(194.5 + i * 8.6, 69.5 + j * 8.6, 1.6, 1.6, ['#f2cf4a', '#7bc47a', '#f08a8a', '#8ab4f0'][(i + j) % 4]); }
  /* the counter with a sink, a diffuser and a scale */
  fsh(110, FY + 2, 150, .28, 6); rb(26, 214, 168, 66, '#d8bf7a', { r: 3, lw: 1.8 }); stripesV(30, 220, 190, 276, 12, 2, 'rgba(90,56,20,.35)', 5); rb(20, 204, 180, 12, '#f2e6c8', { r: 3, lw: 1.8 });
  ell(70, 208, 22, 4.2, '#9aa8b2', OUT, 1.4); ell(70, 208.5, 18, 2.6, '#6f7d88'); ctx.strokeStyle = '#b8c4cc'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(70, 205); ctx.lineTo(70, 182); ctx.quadraticCurveTo(70, 174, 80, 174); ctx.lineTo(84, 174); ctx.lineTo(84, 180); ctx.stroke();
  rb(122, 192, 16, 12, '#e8e0cc', { r: 4, lw: 1.4 }); rb(118, 202, 24, 4, '#c9a86a', { r: 1.5, lw: 1.1 }); rb(158, 196, 26, 8, '#dfe6ea', { r: 3, lw: 1.3 }); ell(171, 196, 8, 2.4, '#f6f8fa', OUT, 1);
  fern(222, FY + 2, .7);
  roomFinish(w, h, .28);
};
GLL.gmed = (r, t, st, lamp) => inRoom(r, () => {
  dress('MED ROOM', 152, 46, 8.4, { fill: '#2f7a42', weight: 900, spacing: 1 }); dress('MON TUE WED THU', 207, 58, 4.4, { fill: '#4a5a4a', maxW: 36 });
  ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < 3; i++) { const ph = ((t * .3 + i / 3) % 1), x = 130 + 6 * Math.sin(ph * 7 + i), y = 190 - ph * 70, rr = 5 + ph * 12; ctx.fillStyle = rg(x, y, 0, rr, [[0, `rgba(240,255,250,${.32 * (1 - ph)})`], [1, 'rgba(240,255,250,0)']]); ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); } ctx.restore();
});

GLS.gart = (w, h) => {        /* Art Room: skylight, two easels (an artichoke, a hill), a paint table, clay vegetables drying, a pegboard, a drop cloth */
  const b = roomBox(w, h, { wall: '#f6efe0', side: '#d6c9ac', ceil: '#fffaf0', base: '#8a6a3a', trim: '#ffffff', floor: { kind: 'planks', a: '#d9c08e', pw: 30, seam: '#a4864a', seed: 11 }, wains: { h: 40, color: '#c9a463', rail: '#eadfb4', panels: false } });
  ctx.save(); path([[0, 0], [w, 0], [b.bx1, b.by0], [b.bx0, b.by0]]); ctx.clip(); ctx.fillStyle = vg(0, 20, '#bfe6f6', '#eaf8fd'); ctx.fillRect(40, 0, 170, 20); for (let x = 40; x <= 210; x += 28) ln(x, 0, x + (125 - x) * .16, b.by0, '#fff', 2.2); ctx.restore();
  /* pegboard of tools */
  rb(26, 40, 78, 60, '#d8bf7a', { r: 3, lw: 1.7 }); dotsGrid(30, 44, 100, 96, 7, .9, 'rgba(90,56,20,.5)', false); for (const [x, y, hh, c] of [[40, 50, 30, '#c23a2b'], [54, 52, 24, '#2b5fc2'], [68, 48, 34, '#e0c02b'], [82, 54, 22, '#2a9d4a']]) { ln(x, y, x, y + hh, c, 3.4); } ellRing();
  function ellRing() { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(92, 88, 5, 0, TAU); ctx.stroke(); }
  /* the clay shelf: little vegetables left to dry */
  rb(124, 80, 100, 5, '#8a6a3a', { r: 2, lw: 1.4 }); rb(124, 124, 100, 5, '#8a6a3a', { r: 2, lw: 1.4 });
  [['#d8704a', 'c'], ['#c23a2b', 't'], ['#6fb858', 'p'], ['#e0b640', 'q'], ['#a64a8a', 'b']].forEach(([c, k], i) => { const x = 138 + i * 19; ell(x, 74, 5.2, 7.4, c, OUT, 1.2); leafAt(x, 68, -.2, 6, 2.4, '#4f9a52'); ell(x, 118, 6, 6, c, OUT, 1.2); leafAt(x, 113, .3, 6, 2.4, '#4f9a52'); });
  /* two easels */
  for (const [x, kind] of [[60, 'art'], [180, 'hill']]) {
    fsh(x, FY + 8, 50, .26, 5); ln(x - 22, FY + 8, x - 6, 150, '#8a6a3a', 4); ln(x + 22, FY + 8, x + 6, 150, '#8a6a3a', 4); ln(x, FY + 8, x, 140, '#8a6a3a', 4); rb(x - 30, 236, 60, 5, '#8a6a3a', { r: 2, lw: 1.3 });
    rb(x - 30, 130, 60, 104, '#fbf7ea', { r: 2, lw: 1.8 });
    if (kind === 'art') { ctx.save(); ctx.beginPath(); ctx.rect(x - 28, 132, 56, 100); ctx.clip(); ctx.fillStyle = '#f1d9a0'; ctx.fillRect(x - 28, 132, 56, 100); for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { const px = x + (i - 2) * 9 + (j % 2 ? 4.5 : 0), py = 196 - j * 11; ctx.beginPath(); ctx.ellipse(px, py, 8, 9, 0, 0, TAU); ctx.fillStyle = ['#6fb858', '#4f9a52', '#88c870'][(i + j) % 3]; ctx.fill(); ctx.strokeStyle = '#2f6b3c'; ctx.lineWidth = 1; ctx.stroke(); } ell(x, 222, 14, 5, '#7a5a3c'); ctx.restore(); }
    else { ctx.save(); ctx.beginPath(); ctx.rect(x - 28, 132, 56, 100); ctx.clip(); ctx.fillStyle = vg(132, 232, '#8cc8f0', '#f6e6b4'); ctx.fillRect(x - 28, 132, 56, 100); ctx.fillStyle = '#6fb878'; ctx.beginPath(); ctx.moveTo(x - 28, 200); ctx.quadraticCurveTo(x - 6, 168, x + 12, 196); ctx.quadraticCurveTo(x + 22, 184, x + 28, 190); ctx.lineTo(x + 28, 232); ctx.lineTo(x - 28, 232); ctx.fill(); ell(x + 14, 152, 8, 8, '#f8d44a'); ctx.restore(); }
  }
  /* the paint table with pots and brushes (a drop cloth under it) */
  poly([[96, FY + 26], [160, FY + 26], [154, FY + 8], [102, FY + 8]], '#efe8d4', 'rgba(60,40,20,.5)', 1.3); for (const [x, y, c] of [[110, FY + 18, '#c23a2b'], [122, FY + 14, '#2b5fc2'], [138, FY + 20, '#e0c02b'], [148, FY + 14, '#2a9d4a']]) ell(x, y, 4, 2, c);
  fsh(128, FY + 4, 58, .26, 5); rb(100, 230, 56, 6, '#b8925a', { r: 2, lw: 1.5 }); ln(106, 236, 104, 284, '#8a6a3a', 4); ln(150, 236, 152, 284, '#8a6a3a', 4);
  for (const [x, c] of [[110, '#c23a2b'], [122, '#2b5fc2'], [134, '#e0c02b'], [146, '#2a9d4a']]) { rb(x - 4, 218, 8, 12, '#f2f0e8', { r: 2, lw: 1.1 }); ell(x, 218, 3.6, 1.4, c); }
  jar(120, 230, 10, 22, '#d6e6f0'); for (let i = 0; i < 4; i++) ln(118 + i * 1.6, 208, 117 + i * 2.4, 230, ['#8a5a2a', '#2a2a2a', '#c23a2b'][i % 3], 1.6);
  roomFinish(w, h, .22);
};
GLL.gart = (r, t, st, lamp) => inRoom(r, () => {
  V2.beam(125, 8, 130, 304, 100, 200, '255,248,214', .15 * lamp);
  for (let i = 0; i < 5; i++) { const x = 90 + i * 18, sw = .12 * Math.sin(t * 1.6 + i * 1.2), len = 24 + (i % 3) * 8; ctx.save(); ctx.translate(x, 14); ctx.rotate(sw); ln(0, 0, 0, len, 'rgba(120,90,50,.9)', 1.2); ctx.translate(0, len); ctx.rotate(.5 * sw); leafAt(0, 8, 0, 14, 5, ['#6fb858', '#f2a03c', '#88c870', '#f2d04a', '#7bc47a'][i]); ctx.restore(); }
});

GLS.globby = (w, h) => {      /* Lobby: terrazzo, a living wall under the GREENLEAF lettering, glass doors on the left, wicker chairs, a round rug. The reception desk is in the front layer */
  const b = roomBox(w, h, { wall: '#f1f0e4', side: '#cfcdb6', ceil: '#fbfbf2', base: '#8a6a3a', trim: '#ffffff', floor: { kind: 'terrazzo', a: '#ece7d6', seed: 12 }, wains: { h: 50, color: '#d8bf7a', rail: '#f2e6c0', slats: 12 }, beams: true });
  lampDraw(w * .36, 12, 'wicker'); lampDraw(w * .76, 12, 'wicker');
  livingWall(74, 54, 196, 226, 2);
  /* glass doors at the left, daylight and a hedge */
  const dx = 30, dy = 84, dw = 36, dh = 188;
  rb(dx - 4, dy - 10, dw + 8, dh + 10, '#b9c3cc', { r: 3, lw: 1.6 }); ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip(); ctx.fillStyle = vg(dy, dy + dh, '#9fd2f6', '#fbfdff'); ctx.fillRect(dx, dy, dw, dh); ctx.fillStyle = '#6ab86a'; ctx.beginPath(); ctx.ellipse(dx + 12, dy + dh - 52, 30, 30, 0, PI, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.moveTo(dx + 2, dy); ctx.lineTo(dx + 16, dy); ctx.lineTo(dx, dy + dh); ctx.lineTo(dx - 14, dy + dh); ctx.fill(); ctx.restore(); ctx.strokeStyle = '#b9c3cc'; ctx.lineWidth = 3; ctx.strokeRect(dx, dy, dw, dh);
  rugOval(125, 300, 84, 13, '#4f9a52', '#f2e8c8');
  wickerChair(214, FY + 16, { cushion: '#8fc27a', w: 40 }); monstera(32, FY + 6, .8);
  /* a bamboo bench and a plant at the right of the wall */
  snakePlant(46, FY + 4, .8);
  roomFinish(w, h, .3);
};
GLL.globby = (r, t, st, lamp) => inRoom(r, () => {
  dress('GREENLEAF', 135, 40, 15, { fill: '#2f6b3c', font: 'Bangers', weight: 400, spacing: 3 });
  hangPot(58, 20, 8, .05 * Math.sin(t * 1.2), { seed: 3, vine: 60 }); hangPot(222, 20, 8, .05 * Math.sin(t * 1.0 + 1), { seed: 9, vine: 56 });
  /* a small waterfall over the living wall's foot: a few bright drops */
  ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < 8; i++) { const ph = ((t * .9 + i / 8) % 1), x = 108 + (i % 4) * 12, y = 226 + ph * 54; ctx.fillStyle = `rgba(200,236,255,${.55 * (1 - ph)})`; ctx.fillRect(x, y, 1.6, 6); } ctx.restore();
});
GLF.globby = (r, t, st) => inRoom(r, () => {          /* the reception desk: curved bamboo with a leaf logo, a bell and a bowl of lemons */
  fsh(130, 304, 150, .3, 7);
  ctx.beginPath(); ctx.moveTo(70, 236); ctx.lineTo(200, 236); ctx.quadraticCurveTo(212, 236, 212, 250); ctx.lineTo(206, 298); ctx.lineTo(64, 298); ctx.lineTo(58, 250); ctx.quadraticCurveTo(58, 236, 70, 236); ctx.closePath(); ctx.fillStyle = hg(58, 212, '#b8925a', '#e2c488'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.stroke();
  ctx.save(); ctx.clip(); stripesV(58, 240, 212, 298, 10, 2, 'rgba(90,56,20,.4)', 4); ctx.restore(); rb(52, 228, 166, 12, '#f2e6c8', { r: 4, lw: 1.8 });
  leafLogo(135, 268, 15, '#2f7a42');
  ctx.save(); ctx.translate(88, 228); ell(0, 0, 8, 2.6, '#d9b45a', OUT, 1.2); ell(0, -4, 5, 5, '#e8c85a', OUT, 1.2); ell(0, -10, 1.6, 1.6, '#d9b45a'); ctx.restore();
  rb(168, 212, 28, 16, '#8a6a3a', { r: 4, lw: 1.4 }); for (const [x, y] of [[176, 210], [186, 209], [181, 204]]) ell(x, y, 6, 4.6, '#f2d04a', 'rgba(120,90,10,.7)', 1);
});

GLS.gdining = (w, h) => {     /* Dining Room: a farm mural, wicker pendants, a sideboard with a pie, bamboo floor. The long communal table is in the front layer */
  const b = roomBox(w, h, { wall: '#f4e9c8', side: '#d1c08e', ceil: '#fdf7e4', base: '#8a6a3a', trim: '#fffaf0', floor: { kind: 'bamboo', a: '#e0c88c', pw: 28, seam: '#a4864a', seed: 14 }, wains: { h: 56, color: '#c9a463', rail: '#eadfb4', slats: 11 }, beams: true });
  for (const x of [56, 125, 194]) lampDraw(x, 14, 'wicker');
  frameDraw(46, 44, 158, 100, { frame: '#8a6a3a', th: 6, m: 2, matColor: '#8a6a3a' }, (x, y, ww, hh) => {
    ctx.fillStyle = vg(y, y + hh, '#8cc8f0', '#f6efc8'); ctx.fillRect(x, y, ww, hh); ell(x + ww * .8, y + hh * .2, 12, 12, '#f8d44a');
    ctx.fillStyle = '#7fc27a'; ctx.beginPath(); ctx.moveTo(x, y + hh * .6); ctx.quadraticCurveTo(x + ww * .3, y + hh * .35, x + ww * .6, y + hh * .58); ctx.quadraticCurveTo(x + ww * .85, y + hh * .45, x + ww, y + hh * .55); ctx.lineTo(x + ww, y + hh); ctx.lineTo(x, y + hh); ctx.fill();
    ctx.fillStyle = '#4f9a52'; ctx.beginPath(); ctx.moveTo(x, y + hh * .8); ctx.quadraticCurveTo(x + ww * .5, y + hh * .55, x + ww, y + hh * .78); ctx.lineTo(x + ww, y + hh); ctx.lineTo(x, y + hh); ctx.fill();
    rb(x + ww * .12, y + hh * .42, 30, 24, '#c23a2b', { r: 1, lw: 1.1 }); poly([[x + ww * .12 - 3, y + hh * .42], [x + ww * .12 + 15, y + hh * .42 - 14], [x + ww * .12 + 33, y + hh * .42]], '#7a2a1a', OUT, 1.1);
    for (let i = 0; i < 6; i++) { ln(x + 8 + i * 22, y + hh, x + 8 + i * 22, y + hh * .8, '#3a8a46', 2); ell(x + 8 + i * 22, y + hh * .78, 4, 5, ['#d8584a', '#f08a2a', '#c8e060'][i % 3]); }
  });
  /* the sideboard with a pie and a jug (right) */
  fsh(204, FY + 4, 46, .26, 5); rb(184, 222, 44, 60, '#b8925a', { r: 3, lw: 1.7 }); ln(206, 230, 206, 280, OUT, 1.3); rb(180, 214, 52, 10, '#f2e6c8', { r: 3, lw: 1.6 });
  ell(200, 210, 14, 4.4, '#e6c27a', OUT, 1.3); ell(200, 207, 12, 3, '#f0d79a', null); for (let i = -3; i <= 3; i++) ln(200 + i * 3.4, 205.6, 200 + i * 3.4, 208.6, '#a77a44', 1.1);
  rb(216, 190, 12, 22, '#a8d0e6', { r: 4, lw: 1.3 }); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(230, 200, 5, -1.3, 1.3); ctx.stroke();
  snakePlant(34, FY + 4, .8);
  roomFinish(w, h, .28);
};
GLL.gdining = (r, t, st, lamp) => inRoom(r, () => { dress('THE FARM, 1987', 125, 156, 7, { fill: 'rgba(80,50,20,.7)', maxW: 100 }); });
GLF.gdining = (r, t, st) => inRoom(r, () => {          /* the long communal table in front: bamboo top, two benches, bowls of salad */
  fsh(125, 306, 220, .3, 7);
  for (const x of [34, 216]) { rb(x - 7, 250, 14, 52, '#8a6a3a', { r: 2, lw: 1.5 }); }
  poly([[18, 240], [232, 240], [224, 256], [26, 256]], vg(240, 256, '#e2c488', '#c9a463'), OUT, 1.9); ctx.fillStyle = 'rgba(255,255,255,.22)'; path([[22, 242], [228, 242], [226, 245], [24, 245]]); ctx.fill();
  poly([[26, 256], [224, 256], [224, 264], [26, 264]], '#a77a44', OUT, 1.5);
  for (const x of [60, 125, 190]) { ctx.beginPath(); ctx.ellipse(x, 238, 17, 5, 0, 0, TAU); ctx.fillStyle = '#f6f1e4'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 14, 238); ctx.quadraticCurveTo(x, 218 - (x % 3) * 2, x + 14, 238); ctx.closePath(); ctx.fillStyle = vg(220, 238, '#a6dc82', '#4f9a52'); ctx.fill(); ctx.stroke(); ell(x - 4, 229, 2.4, 2.4, '#d8584a'); ell(x + 5, 227, 2.2, 2.2, '#f08a2a'); }
  for (const x of [94, 158]) { rb(x - 4, 224, 8, 16, '#a8d0e6', { r: 3, lw: 1.2 }); }
});

GLS.gtherapy = (w, h) => {    /* Therapy Garden: an indoor garden: ivy trellis, grass, a koi pond, stepping stones, a small tree with fairy lights, a bench, a raised bed at wheelchair height */
  const b = roomBox(w, h, { wall: '#dcecc8', side: '#b4cf9c', ceil: '#e8f4ee', base: '#6a8a5a', trim: '#f6fbf0', floor: { kind: 'grass', a: '#7cc060', seed: 5 }, beams: [.2, .8] });
  onBack(b, () => { ctx.fillStyle = '#3d6a3c'; ctx.fillRect(b.bx0, b.by0, b.bx1 - b.bx0, b.by1 - b.by0); const r = rnd(5); stripesV(b.bx0, b.by0, b.bx1, b.by1, 20, 2, 'rgba(201,168,106,.8)'); stripesH(b.bx0, b.by0, b.bx1, b.by1, 20, 2, 'rgba(201,168,106,.8)'); for (let i = 0; i < 130; i++) leafAt(b.bx0 + r() * (b.bx1 - b.bx0), b.by0 + r() * (b.by1 - b.by0), r() * TAU, 9 + r() * 8, 4, ['#4f9a52', '#6fb858', '#3f8f4a', '#88c870'][i % 4]); });
  ctx.save(); path([[0, 0], [w, 0], [b.bx1, b.by0], [b.bx0, b.by0]]); ctx.clip(); ctx.fillStyle = 'rgba(190,226,240,.55)'; ctx.fillRect(0, 0, w, b.by0); for (let x = -40; x < w + 40; x += 36) ln(x, 0, w / 2 + (x - w / 2) * .84, b.by0, 'rgba(255,255,255,.75)', 1.6); ctx.restore();
  /* the pond: a rim of stones, water, lily pads, koi are live */
  ell(130, 290, 70, 14, vg(276, 304, '#9a968c', '#6d695f'), OUT, 1.8);
  ell(130, 290, 62, 10.4, vg(280, 300, '#6ec0d8', '#2f7aa0'), 'rgba(10,40,60,.6)', 1.4); ell(110, 288, 14, 3, 'rgba(255,255,255,.28)');
  for (const [x, y] of [[112, 292], [150, 288], [138, 294]]) { ctx.save(); ctx.translate(x, y); ctx.scale(1, .3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 11, .3, TAU - .3); ctx.closePath(); ctx.restore(); ell(x, y, 9, 2.8, '#58b060', 'rgba(15,60,25,.6)', 1); }
  ell(156, 286, 3, 1.4, '#f6a8c8'); ell(156, 285, 1.6, 1, '#fff');
  /* stepping stones across the lawn */
  for (const [x, y, rx] of [[44, 306, 20], [58, 296, 15], [70, 287, 12]]) ell(x, y, rx, rx * .28, vg(y - 4, y + 4, '#d8d4c8', '#a39d90'), OUT, 1.3);
  /* the bench (left) and the raised bed at wheelchair height (right) */
  fsh(40, FY + 8, 56, .26, 5); rb(14, 232, 56, 8, '#b8925a', { r: 2, lw: 1.5 }); rb(14, 212, 56, 6, '#b8925a', { r: 2, lw: 1.4 }); for (const x of [18, 64]) { rb(x - 2, 218, 4, 16, '#8a6a3a', { r: 1, lw: 1.1 }); rb(x - 2, 240, 5, 38, '#8a6a3a', { r: 1, lw: 1.2 }); }
  fsh(206, FY + 8, 62, .26, 5); rb(176, 236, 60, 44, '#b8925a', { r: 3, lw: 1.7 }); stripesV(180, 240, 232, 278, 10, 2, 'rgba(60,36,12,.4)', 4); poly([[178, 236], [234, 236], [240, 226], [172, 226]], '#4a3220', OUT, 1.4);
  for (let i = 0; i < 6; i++) { const x = 182 + i * 10; leafAt(x, 232, -.3 + (i % 3) * .3, 16 + (i % 2) * 6, 5, ['#5cb85e', '#a6dc82', '#3f8f4a'][i % 3]); } ell(190, 214, 4, 4, '#f06a8a'); ell(214, 210, 4, 4, '#f7c948'); ell(228, 216, 3.6, 3.6, '#fff');
  /* the little tree (right back) with a trunk and a round canopy */
  rb(222 - 5, 120, 10, 112, '#7a5a3c', { r: 4, lw: 1.6 }); for (const [cx, cy, r2] of [[212, 92, 30], [236, 100, 24], [222, 74, 26]]) ell(cx, cy, r2, r2 * .85, vg(cy - r2, cy + r2, '#6cc070', '#2f7a42'), 'rgba(15,60,25,.6)', 1.4);
  roomFinish(w, h, .22);
};
GLL.gtherapy = (r, t, st, lamp) => inRoom(r, () => {
  for (let i = 0; i < 2; i++) { const ph = t * (.35 + i * .08) + i * 3, x = 130 + 36 * Math.cos(ph) * (i ? .8 : 1), y = 290 + 5 * Math.sin(ph), dir = -Math.sin(ph) * (i ? .8 : 1) > 0 ? 1 : -1; ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, TAU); ctx.fillStyle = i ? '#f2a03c' : '#f6efe0'; ctx.fill(); ctx.strokeStyle = 'rgba(60,30,10,.6)'; ctx.lineWidth = .8; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-13, -3 + Math.sin(t * 8) * 1.4); ctx.lineTo(-13, 3 + Math.sin(t * 8) * 1.4); ctx.closePath(); ctx.fill(); ell(3, -.6, 1.1, 1.1, '#222'); ctx.restore(); }
  for (const k of [0, 1]) { const ph = (t * .6 + k * .5) % 1; ctx.strokeStyle = `rgba(255,255,255,${.4 * (1 - ph)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(k ? 108 : 150, 290, 4 + ph * 24, 1.2 + ph * 5, 0, 0, TAU); ctx.stroke(); }
  /* fairy lights across the top */
  for (let i = 0; i < 12; i++) { const x = 30 + i * 17.8, y = 24 + 6 * Math.sin(i * .9) + 3 * Math.sin(i * 2.1), on = .5 + .5 * Math.sin(t * 2.6 + i * 1.7); ell(x, y, 2.4, 2.4, `rgba(255,236,150,${.4 + .6 * on})`); V2.glow(x, y, 12, '255,226,140', .45 * on, 'screen', .2); }
  V2.beam(100, 8, 120, 300, 90, 200, '255,248,214', .12 * lamp);
});

GLS.gfish = (w, h) => {       /* Fish Tank Lounge: deep teal walls, a wall-sized aquarium (fish and bubbles are live), two recliners facing it, a blue rug */
  const b = roomBox(w, h, { wall: '#2f6a78', side: '#1f4a58', ceil: '#cfe8ee', base: '#1c3f4a', trim: '#e8f6f8', floor: { kind: 'tile', a: '#34535e', b: '#2c4a54', n: 7, rows: 4, grout: 'rgba(10,30,40,.4)' }, wains: { h: 40, color: '#244f5c', rail: '#6aa6b4', panels: false } });
  lampDraw(w / 2, 12, 'globe');
  /* the tank: a wooden stand, a glass box, water, sand, rocks, coral, weed */
  rb(24, 244, 202, 38, '#6a4a2a', { r: 3, lw: 1.9 }); rb(30, 250, 90, 26, '#7a5a3a', { r: 2, lw: 1.2 }); rb(130, 250, 90, 26, '#7a5a3a', { r: 2, lw: 1.2 }); rb(18, 236, 214, 10, '#3a2a1a', { r: 3, lw: 1.8 });
  rb(26, 44, 198, 194, '#cfe3e8', { r: 5, lw: 2 });
  ctx.save(); ctx.beginPath(); ctx.roundRect(32, 50, 186, 182, 3); ctx.clip(); ctx.fillStyle = vg(50, 232, '#6fd6e0', '#1f5a9a'); ctx.fillRect(32, 50, 186, 182);
  ctx.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(50 + i * 38, 50); ctx.lineTo(70 + i * 38, 50); ctx.lineTo(48 + i * 38 + 14, 232); ctx.lineTo(28 + i * 38 + 14, 232); ctx.fill(); }
  ctx.fillStyle = vg(206, 232, '#e6d4a0', '#b8a070'); ctx.fillRect(32, 210, 186, 22); const r = rnd(4); for (let i = 0; i < 40; i++) ell(36 + r() * 178, 214 + r() * 16, 1.6, 1.2, 'rgba(120,90,50,.45)');
  for (const [x, y, rr] of [[66, 214, 20], [186, 216, 16], [150, 220, 12]]) ell(x, y, rr * 1.3, rr, vg(y - rr, y + rr, '#8a8f98', '#555a64'), 'rgba(20,30,40,.6)', 1.4);
  for (const [x, c] of [[100, '#f06a8a'], [118, '#f2a03c'], [92, '#e05a7a']]) { for (let j = 0; j < 5; j++) { ctx.strokeStyle = c; ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 214); ctx.quadraticCurveTo(x + (j - 2) * 6, 196 - j % 2 * 6, x + (j - 2) * 9, 184 - j % 3 * 4); ctx.stroke(); } }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(40, 52); ctx.lineTo(72, 52); ctx.lineTo(44, 230); ctx.lineTo(34, 230); ctx.fill();
  rb(22, 36, 206, 12, '#2a3a40', { r: 3, lw: 1.8 }); ctx.fillStyle = '#bff2ff'; ctx.fillRect(34, 44, 182, 3);
  /* two recliners seen from behind, a blue rug, a lamp */
  rugOval(125, 302, 92, 13, '#3a78b8', '#9ad0ee');
  for (const x of [66, 184]) { fsh(x, FY + 20, 56, .3, 5); ctx.beginPath(); ctx.roundRect(x - 24, 232, 48, 56, [18, 18, 6, 6]); ctx.fillStyle = hg(x - 24, x + 24, '#2a5a8a', '#4a86c0'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.stroke(); ctx.beginPath(); ctx.roundRect(x - 20, 238, 40, 22, 12); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill(); ln(x - 26, 262, x - 26, 290, '#1d3a58', 6); ln(x + 26, 262, x + 26, 290, '#1d3a58', 6); }
  roomFinish(w, h, .3);
};
GLL.gfish = (r, t, st, lamp) => inRoom(r, () => {
  ctx.save(); ctx.beginPath(); ctx.roundRect(32, 50, 186, 182, 3); ctx.clip();
  for (const [x, hh, ph] of [[46, 70, 0], [58, 54, 1.3], [200, 64, 2.1], [210, 46, .6]]) { ctx.strokeStyle = '#2f9a56'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 214); for (let j = 1; j <= 6; j++) ctx.lineTo(x + Math.sin(t * 1.4 + ph + j * .6) * 3.4 * j * .6, 214 - hh * j / 6); ctx.stroke(); }
  const FISH = [['#f2a03c', 18, 110, 70, .5, 0], ['#4fb0f0', 14, 90, 120, .8, 1.7], ['#f6e04a', 12, 150, 160, .65, 3.1], ['#f06a8a', 15, 70, 90, .4, 4.4], ['#e8e8f2', 10, 170, 100, 1.0, 5.2], ['#7a5ac8', 13, 50, 150, .55, 2.6]];
  for (const [c, sz, cx, cy, sp, ph] of FISH) {
    const a = t * sp + ph, x = cx + (cx < 125 ? 1 : -1) * 0 + 54 * Math.sin(a), y = cy + 14 * Math.sin(a * 1.7 + 1), dir = Math.cos(a) >= 0 ? 1 : -1;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); const wag = Math.sin(t * 9 + ph) * .22;
    ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * .55, 0, 0, TAU); ctx.fillStyle = vg(-sz * .5, sz * .5, lift(c, .3), shade(c, .8)); ctx.fill(); ctx.strokeStyle = 'rgba(20,30,60,.65)'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.save(); ctx.translate(-sz * .9, 0); ctx.rotate(wag); ctx.beginPath(); ctx.moveTo(sz * .2, 0); ctx.lineTo(-sz * .5, -sz * .5); ctx.lineTo(-sz * .5, sz * .5); ctx.closePath(); ctx.fillStyle = shade(c, .85); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(-sz * .1, -sz * .5); ctx.quadraticCurveTo(sz * .1, -sz * .95, sz * .4, -sz * .45); ctx.fillStyle = shade(c, .85); ctx.fill(); ctx.stroke();
    ell(sz * .5, -sz * .1, sz * .17, sz * .17, '#fff', '#222', .8); ell(sz * .54, -sz * .1, sz * .08, sz * .08, '#111');
    ctx.restore();
  }
  for (let i = 0; i < 12; i++) { const ph = ((t * .32 + i / 12 * 3.1) % 1), x = 78 + (i % 4) * 30 + 5 * Math.sin(ph * 9 + i), y = 214 - ph * 164; ell(x, y, 1.6 + (i % 3), 1.6 + (i % 3), 'rgba(255,255,255,.25)', 'rgba(255,255,255,.7)', .8); }
  ctx.restore();
  V2.glow(125, 140, 150, '90,200,255', .22 * lamp, 'screen', .4);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let i = 0; i < 8; i++) { const x = 30 + i * 28 + 8 * Math.sin(t * .9 + i), y = 306 + 4 * Math.sin(t * 1.2 + i * 2); ctx.fillStyle = 'rgba(150,230,255,.12)'; ctx.beginPath(); ctx.ellipse(x, y, 16, 3, 0, 0, TAU); ctx.fill(); } ctx.restore();
});

// ================================================================================================ the Greenleaf block: cached rooms, hatch, notches, hazard base, lifting lugs, the living roof and its sign
const GCS = 3, GLCACHE = {};
const glDoor = (id, side) => { const col = GDEF[id][0]; return side === 'l' ? col > 0 : col < 3; };
function sideDoors(id, w, h) {
  const b = boxOf(w, h);
  for (const side of ['l', 'r']) {
    if (!glDoor(id, side)) continue;
    const l = side === 'l', xf = l ? 0 : w, xb = l ? b.bx0 : b.bx1, top = 118;
    ctx.save();
    poly([[xf, top], [xb, top - 3], [xb, b.by1], [xf, h]], vg(top, h, '#3a4a30', '#a8905a'));
    ctx.fillStyle = hg(xf, xb, 'rgba(255,230,160,.0)', 'rgba(255,230,160,.22)'); path([[xf, top + 20], [xb, top + 17], [xb, b.by1], [xf, h]]); ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(30,18,34,.8)'; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(xf, h); ctx.lineTo(xf, top); ctx.lineTo(xb, top - 3); ctx.lineTo(xb, b.by1); ctx.stroke();
    ctx.strokeStyle = '#f2e8c8'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(xf, h); ctx.lineTo(xf, top); ctx.lineTo(xb, top - 3); ctx.lineTo(xb, b.by1); ctx.stroke();
    ctx.restore();
  }
}
function glCache(id) {
  let c = GLCACHE[id]; if (c) return c;
  const cv = cvs(RW * GCS, RH * GCS), g = cv.getContext('2d'); g.scale(GCS, GCS);
  withCtx(g, () => guard('paint ' + id, () => { ctx.save(); if (GLS[id]) GLS[id](RW, RH); sideDoors(id, RW, RH); ctx.restore(); }));
  return GLCACHE[id] = cv;
}
let GHATCH = null;
function glHatch() {
  if (GHATCH) return GHATCH;
  const c = cvs(24, 24), g = c.getContext('2d'); g.fillStyle = '#34402f'; g.fillRect(0, 0, 24, 24); g.strokeStyle = 'rgba(214,255,170,.14)'; g.lineWidth = 2;
  for (const o of [-24, 0, 24]) { g.beginPath(); g.moveTo(o, 24); g.lineTo(o + 24, 0); g.stroke(); }
  return GHATCH = mainCtx.createPattern(c, 'repeat');
}
const GLR = id => { const [col, row] = GDEF[id], y0 = GL_ROW[row]; return { id, col, row, x0: COL[col], y0, x1: COL[col] + RW, y1: y0 + RH, w: RW, h: RH, cx: COL[col] + RW / 2, cy: y0 + RH / 2, floor: y0 + RH - 14 }; };   /* docked rect */
function dustFall(r, t, amount, seed = 1) {
  if (!(amount > .01)) return;
  const n = Math.round(30 * Math.min(1, amount)), q = rnd(seed);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x0, r.y0, r.w, r.h); ctx.clip();
  for (let i = 0; i < n; i++) { const x = r.x0 + 26 + q() * (r.w - 52), sp = 26 + q() * 60, ph = q() * 300, y = r.y0 + 20 + (ph + t * sp) % 290, s = .8 + q() * 1.8; ctx.fillStyle = `rgba(${q() > .5 ? '226,214,196' : '170,150,128'},${.25 + .5 * amount * q()})`; ctx.fillRect(x + Math.sin(t * 2 + i) * 2, y, s, s * (1 + q())); }
  ctx.restore();
}
function glBlock(lt, st, s, layer) {
  const t = st.t ?? lt, V = view(160), rs = st.rooms || {};
  ctx.save();
  ctx.translate(s.gx, s.gy + s.sink); ctx.rotate(s.ga); ctx.translate(-540, -GL_CY);
  const act = id => { const r = rectOf(id, s); return seen(V, r.x0 - 20, r.y0 - 20, r.x1 + 20, r.y1 + 20); };
  if (layer === 'back') {
    ctx.fillStyle = glHatch(); ctx.fillRect(X0, GL_BOT - GL_H, X1 - X0, GL_H);
    for (const id of S15.glIds) {
      if (!act(id)) continue;
      const r = GLR(id), o = rs[id] || {};
      ctx.drawImage(glCache(id), r.x0, r.y0, r.w, r.h);
      const fl = o.flicker ? 1 - o.flicker * (.5 + .5 * Math.sin(t * 61 + id.length)) * (Math.sin(t * 17) > 0 ? 1 : .4) : 1, lamp = clamp01((o.lamp ?? 1) * fl);
      lampLive(r.x0 + r.w / 2, r.y0 + 11, r.floor, lamp, { w1: 230 });
      if (GLL[id]) guard('live ' + id, () => GLL[id](r, t, o, lamp));
      dustFall(r, t, o.dust, 7 + r.col * 3 + r.row);
    }
    /* partitions between neighbours: an arched notch at the floor; bevels along every room */
    for (const id of S15.glIds) {
      if (!act(id)) continue; const r = GLR(id);
      ctx.lineCap = 'butt'; ln(r.x0, r.y0 - .8, r.x1, r.y0 - .8, 'rgba(25,14,30,.85)', 1.6); ln(r.x0 - .8, r.y0, r.x0 - .8, r.y1, 'rgba(25,14,30,.85)', 1.6); ln(r.x0, r.y1 + .8, r.x1, r.y1 + .8, 'rgba(255,236,210,.42)', 1.6); ln(r.x1 + .8, r.y0, r.x1 + .8, r.y1, 'rgba(255,236,210,.30)', 1.6);
      if (glDoor(id, 'r')) { const x = r.x1, y0 = r.floor - 190, y1 = r.y1; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y0 + T / 2); ctx.arc(x + T / 2, y0 + T / 2, T / 2, PI, 0); ctx.lineTo(x + T, y1); ctx.closePath(); ctx.fillStyle = vg(y0, y1, '#3a4a30', '#a8905a'); ctx.fill(); ctx.strokeStyle = '#f2e8c8'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y0 + T / 2); ctx.arc(x + T / 2, y0 + T / 2, T / 2, PI, 0); ctx.lineTo(x + T, y1); ctx.stroke(); }
    }
    /* the base: a steel plate with hazard stripes along the underside, and the outline of the whole block */
    const yb = GL_BOT - 12; ctx.save(); ctx.beginPath(); ctx.rect(X0, yb, X1 - X0, 12); ctx.clip(); ctx.fillStyle = '#2a2d33'; ctx.fillRect(X0, yb, X1 - X0, 12); ctx.fillStyle = '#f2c230'; for (let x = X0 - 12; x < X1; x += 28) { ctx.beginPath(); ctx.moveTo(x, yb + 12); ctx.lineTo(x + 12, yb); ctx.lineTo(x + 26, yb); ctx.lineTo(x + 14, yb + 12); ctx.fill(); } ctx.restore();
    ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeRect(X0 - 1, GL_BOT - GL_H - 1, X1 - X0 + 2, GL_H + 2);
    /* the lifting lugs on the top slab, and a THIS SIDE UP sticker on the base */
    for (const dx of [-400, -140, 140, 400]) { const x = 540 + dx, y = GL_BOT - GL_H; rb(x - 14, y - 8, 28, 9, '#3a3f46', { r: 2, lw: 1.4 }); ell(x, y - 14, 9, 9, null, '#aeb6be', 4); ell(x, y - 14, 9, 9, null, '#3a3f46', 1.2); }
    if (!st.exec) glRoof(t, s, st);
  } else {
    for (const id of S15.glIds) { if (!GLF[id] || !act(id)) continue; const r = GLR(id); guard('front ' + id, () => GLF[id](r, t, rs[id] || {})); }
  }
  ctx.restore();
}
/* the living roof: a green deck with planters, solar panels, a small wind turbine, a pergola, and the sign GREENLEAF SENIOR LIVING with the leaf logo (also used on top of the Executive Suite) */
let GROOFCV = null;
function glRoofCache() {
  if (GROOFCV) return GROOFCV;
  const cs = 2, x0 = -10, y0 = GL_BOT - GL_H - 175, w = 1100, h = 180, cv = cvs(w * cs, h * cs), g = cv.getContext('2d');
  g.scale(cs, cs); g.translate(-x0, -y0);
  withCtx(g, () => {
    const top = GL_BOT - GL_H;     /* -686 */
    rb(X0 - 8, top - 14, X1 - X0 + 16, 14, '#4f9a52', { r: 6, lw: 2.2 }); for (let x = X0 - 4; x < X1 + 4; x += 7) { const hh = 4 + (x * 7 % 5); ln(x, top - 14, x + 2, top - 14 - hh, '#6fb858', 2); }
    rb(X0 - 12, top - 4, X1 - X0 + 24, 6, '#8a6a3a', { r: 3, lw: 1.6 });
    /* solar panels, tilted, in a row */
    for (let i = 0; i < 4; i++) { const x = 310 + i * 96; poly([[x, top - 18], [x + 84, top - 18], [x + 96, top - 62], [x + 12, top - 62]], vg(top - 62, top - 18, '#3a64b0', '#1f3a78'), OUT, 1.6); ctx.strokeStyle = 'rgba(190,220,255,.55)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { const f = k / 4; ln(x + 12 * f, top - 18 - 44 * f, x + 84 + 12 * f, top - 18 - 44 * f, 'rgba(190,220,255,.5)', 1, 'butt'); } for (let k = 1; k < 4; k++) ln(x + 21 * k, top - 18, x + 21 * k + 12, top - 62, 'rgba(190,220,255,.5)', 1, 'butt'); ln(x + 30, top - 18, x + 30, top - 8, '#6a737c', 3); ln(x + 70, top - 18, x + 70, top - 8, '#6a737c', 3); }
    /* planters with small trees at both ends, a pergola with hanging lights */
    for (const [x, sgn] of [[70, 1], [1030, -1]]) { rb(x - 40, top - 40, 80, 28, '#b8925a', { r: 3, lw: 1.8 }); stripesV(x - 38, top - 38, x + 38, top - 14, 10, 2, 'rgba(60,36,12,.4)', 4); rb(x - 5, top - 90, 10, 52, '#7a5a3c', { r: 3, lw: 1.5 }); for (const [dx, dy, r2] of [[-18, -96, 24], [16, -102, 26], [0, -122, 24]]) ell(x + dx, top + dy, r2, r2 * .85, vg(top + dy - r2, top + dy + r2, '#6cc070', '#2f7a42'), 'rgba(15,60,25,.6)', 1.4); }
    for (const [x, y] of [[250, top - 22]]) { rb(x, y, 26, 18, '#f2e6c8', { r: 3, lw: 1.4 }); ln(x + 4, y, x + 4, y - 6, '#6fb858', 2); }   /* a bee hive box */
  });
  GROOFCV = { cv, x0, y0, w, h };
  return GROOFCV;
}
function signGreen(cx, y, t, o = {}) {
  const w = 660, h = 86, x = cx - w / 2;
  ctx.save();
  for (const px of [x + 70, x + w - 70]) rb(px - 9, y + h - 4, 18, 36, '#8a6a3a', { r: 3, lw: 1.8 });
  const hero = !o.moving && heroNow(x, y, x + w, y + h, 38);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 12; rb(x - 8, y - 8, w + 16, h + 16, '#c9a463', { r: 18, lw: 2.2 }); ctx.restore();
  leafLogo(x + 52, y + h / 2, 30, '#f6f3e8', '#2f7a42');
  if (typeof o.fn === 'function') { UI.panel([x + 96, y, w - 110, h], { fill: '#2f6b3c', stroke: '#f6f3e8', lw: 4, r: 14, shadow: 8, id: 'k15.greensign', kind: 'sign' }); o.fn({ x0: x + 96, y0: y, x1: x + w - 14, y1: y + h, cx: x + 96 + (w - 110) / 2, cy: y + h / 2, w: w - 110, h, size: 38 }); ctx.restore(); return; }
  UI.sign([x + 96, y, w - 110, h], o.text ?? 'GREENLEAF SENIOR LIVING', { fill: '#2f6b3c', stroke: '#f6f3e8', lw: 4, ink: '#f6f3e8', size: 38, spacing: 2.2, pad: 10, r: 14, shadow: 8, id: 'k15.greensign', hero, crop: !hero, tilt: o.tilt });
  ctx.restore();
}
function glRoof(t, s, st) {
  const c = glRoofCache(); ctx.drawImage(c.cv, c.x0, c.y0, c.w, c.h);
  /* the little wind turbine on the roof: three blades turning */
  ctx.save(); ctx.translate(930, GL_BOT - GL_H - 96); ln(0, 0, 0, 92, '#cfd6dc', 5); ctx.rotate(t * 2.2); for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -24, 2, -50); ctx.quadraticCurveTo(-4, -24, 0, 0); ctx.fillStyle = '#f6f3e8'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke(); } ell(0, 0, 5, 5, '#6fb858', OUT, 1.4); ctx.restore();
  signGreen(530, GL_BOT - GL_H - 14 - 112 - 90 + 30, t, { text: st.signs && typeof st.signs.roof === 'string' ? st.signs.roof : undefined, fn: st.signs && typeof st.signs.roof === 'function' ? st.signs.roof : undefined, moving: !s.stack });
}

// ================================================================================================ the Executive Suite: one wide floor of marble and gold, a panoramic window, a desk the size of a car, a putting green, a pizza oven beside a salad bar, a CEO plaque; a roof with a helipad
const EXW = 1036, EXWIN = [150, 70, 736, 168];       /* the panoramic window in room coordinates: x, y, w, h */
let EXCV = null;
function execCache() {
  if (EXCV) return EXCV;
  const cs = 2, w = EXW, h = RH, cv = cvs(w * cs, h * cs), g = cv.getContext('2d'); g.scale(cs, cs);
  withCtx(g, () => guard('paint exec', () => {
    const b = roomBox(w, h, { wall: '#1f4a38', side: '#16382a', ceil: '#f3ecd8', base: '#c9a24c', trim: '#d9b45a', floor: { kind: 'checker', a: '#f1ece0', b: '#d6cfbd', n: 16, rows: 4, grout: 'rgba(201,162,76,.7)' }, wains: { h: 70, color: '#143328', rail: '#d9b45a', panels: 11 } });
    onBack(b, () => { for (let x = b.bx0 + 40; x < b.bx1; x += 62) { if (x > EXWIN[0] - 30 && x < EXWIN[0] + EXWIN[2] + 30) continue; ln(x, b.by0 + 8, x, 200, 'rgba(217,180,90,.35)', 2); } });
    /* marble veins on the floor, a gold inlay ring in the middle */
    ctx.save(); path([[0, h], [w, h], [b.bx1, b.by1], [b.bx0, b.by1]]); ctx.clip(); const r = rnd(2); ctx.strokeStyle = 'rgba(120,110,100,.22)'; ctx.lineWidth = 1.2; for (let i = 0; i < 40; i++) { let x = r() * w, y = b.by1 + r() * 48; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .4) * 50; y += (r() - .3) * 8; ctx.lineTo(x, y); } ctx.stroke(); } ctx.strokeStyle = 'rgba(201,162,76,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(w / 2, 296, 220, 16, 0, 0, TAU); ctx.stroke(); ctx.restore();
    /* pilasters, the window frame (the glass is cleared: the view is live), the CEO plaque seat */
    for (const x of [EXWIN[0] - 26, EXWIN[0] + EXWIN[2] + 14]) { rb(x, b.by0 + 6, 12, 234, '#d9b45a', { r: 3, lw: 1.8 }); ln(x + 6, b.by0 + 8, x + 6, b.by0 + 238, 'rgba(255,255,255,.35)', 1.6); }
    rb(EXWIN[0] - 8, EXWIN[1] - 8, EXWIN[2] + 16, EXWIN[3] + 16, '#d9b45a', { r: 4, lw: 2.2 });
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fillRect(EXWIN[0], EXWIN[1], EXWIN[2], EXWIN[3]); ctx.restore();
    for (let i = 1; i < 6; i++) ln(EXWIN[0] + i * EXWIN[2] / 6, EXWIN[1], EXWIN[0] + i * EXWIN[2] / 6, EXWIN[1] + EXWIN[3], '#d9b45a', 3.4, 'butt');
    ln(EXWIN[0], EXWIN[1] + EXWIN[3] * .55, EXWIN[0] + EXWIN[2], EXWIN[1] + EXWIN[3] * .55, '#d9b45a', 3.4, 'butt');
    rb(EXWIN[0] - 14, EXWIN[1] + EXWIN[3] + 8, EXWIN[2] + 28, 9, '#b8923a', { r: 3, lw: 1.8 });
    /* the putting green (left): felt, a hole with a flag, a ball, a putter */
    ell(130, 296, 100, 14, '#2f8f4a', 'rgba(10,50,20,.7)', 1.8); ell(130, 296, 84, 10.5, '#3aa458', null); ctx.fillStyle = 'rgba(255,255,255,.1)'; for (let i = 0; i < 40; i++) ctx.fillRect(60 + r() * 140, 288 + r() * 16, 1.4, 1.4);
    ell(176, 293, 5, 1.8, '#142a18'); ln(176, 293, 176, 232, '#e8e8e8', 2); poly([[176, 232], [196, 238], [176, 244]], '#c23a2b', OUT, 1.2); ell(98, 299, 3.2, 3.2, '#fff', OUT, 1); ln(70, 300, 40, 244, '#8a8f98', 3); rb(32, 238, 18, 6, '#8a8f98', { r: 2, lw: 1.2 });
    /* the desk the size of a car: mahogany, gold edge, a diamond panel, a licence plate; a throne behind it */
    fsh(520, FY + 18, 420, .34, 9);
    ctx.beginPath(); ctx.roundRect(460, 140, 124, 100, [50, 50, 6, 6]); ctx.fillStyle = hg(460, 584, '#4a1a22', '#7a2a36'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke(); for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) ell(486 + i * 24, 160 + j * 20, 3, 3, '#3a1018', 'rgba(255,230,200,.5)', .8);
    poly([[330, 214], [710, 214], [726, 236], [314, 236]], vg(214, 236, '#8a3a24', '#6a2c1a'), OUT, 2.2); poly([[314, 236], [726, 236], [726, 246], [314, 246]], '#d9b45a', OUT, 2);
    rb(314, 246, 412, 52, '#5a2218', { r: 4, lw: 2.2 }); for (let i = 0; i < 6; i++) { poly([[334 + i * 66, 254], [362 + i * 66, 254], [376 + i * 66, 272], [362 + i * 66, 290], [334 + i * 66, 290], [320 + i * 66, 272]].map(([x, y]) => [x, y]).slice(0, 6), 'rgba(217,180,90,.2)', 'rgba(217,180,90,.9)', 1.6); }
    rb(500, 262, 40, 16, '#e8e4d8', { r: 3, lw: 1.5 });
    for (const x of [338, 702]) { ell(x, 298, 14, 14, '#202228', OUT, 2); ell(x, 298, 8, 8, '#c9ced6', OUT, 1.4); }
    ell(334, 268, 7, 7, '#fff6c8', OUT, 1.4); ell(706, 268, 7, 7, '#fff6c8', OUT, 1.4);        /* headlamps: it is a desk, it is also a car */
    rb(380, 198, 20, 12, '#2a2f38', { r: 3, lw: 1.3 }); ell(390, 193, 8, 6, '#59d56b', OUT, 1.2); ln(390, 199, 390, 210, '#2a2f38', 3);
    /* the pizza oven (a brick dome with a glowing mouth and a flue) beside the salad bar */
    fsh(800, FY + 10, 130, .3, 6);
    rb(740, 250, 120, 34, '#9a5a3a', { r: 3, lw: 1.9 }); tileGrid(742, 252, 858, 282, 20, 9, 'rgba(50,20,12,.5)', 1.2, true);
    ctx.beginPath(); ctx.moveTo(748, 252); ctx.quadraticCurveTo(748, 170, 800, 170); ctx.quadraticCurveTo(852, 170, 852, 252); ctx.closePath(); ctx.fillStyle = hg(748, 852, '#8a4a30', '#c27552'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.save(); ctx.clip(); tileGrid(748, 170, 852, 252, 16, 8, 'rgba(50,20,12,.45)', 1.2, true); ctx.restore();
    ctx.beginPath(); ctx.moveTo(780, 252); ctx.lineTo(780, 224); ctx.quadraticCurveTo(800, 206, 820, 224); ctx.lineTo(820, 252); ctx.closePath(); ctx.fillStyle = '#1a0e0a'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    rb(792, 160, 16, 24, '#6a737c', { r: 3, lw: 1.6 }); rb(789, 150, 22, 12, '#8a939c', { r: 3, lw: 1.6 });
    /* the salad bar (right of the oven): counter, pans, a glass guard */
    rb(880, 252, 116, 32, '#c9a463', { r: 3, lw: 1.9 }); rb(874, 244, 128, 10, '#f2e6c8', { r: 3, lw: 1.7 });
    for (let i = 0; i < 4; i++) { const x = 884 + i * 29, cols = ['#7bc47a', '#d8584a', '#bfe0a0', '#f08a2a'][i]; poly([[x, 244], [x + 26, 244], [x + 23, 236], [x + 3, 236]], '#cfd6dc', OUT, 1.2); ctx.beginPath(); ctx.moveTo(x + 3, 238); ctx.quadraticCurveTo(x + 13, 222, x + 23, 238); ctx.closePath(); ctx.fillStyle = cols; ctx.fill(); ctx.strokeStyle = 'rgba(40,30,20,.5)'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = 'rgba(210,238,248,.32)'; ctx.fillRect(882, 214, 112, 24); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2; ctx.strokeRect(882, 214, 112, 24);
    fern(1006, FY + 4, .8); bonsaiDraw(112, 212, 1.1); rb(92, 214, 40, 6, '#d9b45a', { r: 2, lw: 1.4 });
    roomFinish(w, h, .3);
  }));
  return EXCV = cv;
}
function execView(t, tod) {
  const k = skyAt(tod), [x, y, w, h] = EXWIN;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, k.top); g.addColorStop(.6, k.mid); g.addColorStop(1, k.hor); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ell(x + 120, y + h * (.35 + (tod - .3) * .5), 40, 40, rg(x + 120, y + h * .4, 2, 42, [[0, 'rgba(255,248,214,.95)'], [1, 'rgba(255,200,120,0)']]));
  for (let i = 0; i < 3; i++) cloudBand(t, x - 100, x + w + 100, y + 20 + i * 36, y + 30 + i * 36, { n: 2, seed: 4 + i, speed: 6, scale: .35, a: .7 });
  ctx.fillStyle = mixc('#4f8a60', k.hor, .35); ctx.beginPath(); ctx.moveTo(x, y + h); for (let xx = 0; xx <= w; xx += 20) ctx.lineTo(x + xx, y + h - 40 - 22 * Math.sin(xx * .012 + 1) - 12 * Math.sin(xx * .031)); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.fillStyle = mixc('#3a6a4a', k.hor, .25); ctx.beginPath(); ctx.moveTo(x, y + h); for (let xx = 0; xx <= w; xx += 20) ctx.lineTo(x + xx, y + h - 18 - 10 * Math.sin(xx * .02 + 3)); ctx.lineTo(x + w, y + h); ctx.fill();
  for (let i = 0; i < 9; i++) { const bx = x + 40 + i * 78, bh = 16 + (i * 13 % 28); ctx.fillStyle = mixc('#3d5a46', k.hor, .35); ctx.fillRect(bx, y + h - 24 - bh, 14, bh + 6); }     /* a few far towers (the other facilities, soon ours) */
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(x + 80, y); ctx.lineTo(x + 200, y); ctx.lineTo(x + 90, y + h); ctx.lineTo(x - 30, y + h); ctx.fill();
  ctx.restore();
}
function execBlock(lt, st, s, layer) {
  if (!st.exec) return;
  const t = st.t ?? lt, e = execPlace(s), V = view(160), tod = st.tod ?? .45;
  if (!seen(V, e.x0 - 40, e.y0 - 360, e.x0 + 1100, e.y0 + 330)) return;
  ctx.save(); ctx.translate(e.x0, e.y0);
  const o = (st.rooms && st.rooms.exec) || {};
  if (layer === 'back') {
    ctx.fillStyle = glHatch(); ctx.fillRect(0, -T, X1 - X0, RH + T + 2);
    ctx.save(); ctx.translate(12, 0); execView(t, tod); ctx.drawImage(execCache(), 0, 0, EXW, RH);
    const lamp = clamp01(o.lamp ?? 1);
    /* the chandelier: a brass ring of candle bulbs and a drip of crystals that sparkle; the fire in the oven flickers */
    ln(520, 0, 520, 24, 'rgba(60,40,10,.9)', 2); ell(520, 30, 52, 9, null, '#d9b45a', 3); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, x = 520 + Math.cos(a) * 52, yy = 30 + Math.sin(a) * 9; ln(x, yy, x, yy + 10 + (i % 2) * 6, '#d9b45a', 1.4); const sp = .5 + .5 * Math.sin(t * 5 + i * 1.7); ell(x, yy + 14 + (i % 2) * 6, 2.6, 3.4, `rgba(220,240,255,${.55 + .4 * sp})`, 'rgba(120,150,190,.7)', .8); }
    V2.glow(520, 36, 170, '255,230,170', .5 * lamp, 'screen', .5);
    V2.beam(520, 38, 520, 306, 80, 420, '255,226,170', .13 * lamp);
    const fl = .75 + .25 * Math.sin(t * 13) * Math.sin(t * 7.3); V2.glow(800, 238, 74, '255,150,50', .8 * fl, 'screen', .6); ell(800, 238, 15, 9, `rgba(255,${150 + 60 * fl | 0},60,${.85})`);
    dress('CEO-1', 520, 270, 8, { fill: '#2a2230', font: 'Bangers', weight: 400, spacing: 1.5 });
    dress('CATERING', 937, 222, 8, { fill: 'rgba(40,60,50,.9)', maxW: 90 });
    ctx.restore();
    ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeRect(-1, -T - 1, X1 - X0 + 2, RH + T + 2);
    /* the roof: a parapet, a helipad, the antenna with its red light, and the sign */
    if (!st.noExecRoof) {
      const top = -T;
      rb(-8, top - 12, X1 - X0 + 16, 12, '#d9b45a', { r: 5, lw: 2 }); rb(-12, top - 3, X1 - X0 + 24, 6, '#8a6a3a', { r: 3, lw: 1.6 });
      ell(190, top - 7, 100, 7, '#3a3f46', OUT, 1.8); ell(190, top - 8, 90, 5.4, null, '#f6f3e8', 2); dress('H', 190, top - 8, 11, { fill: '#f6f3e8', font: 'Bangers', weight: 400 });
      ln(960, top - 12, 960, top - 150, '#8a939c', 4); ln(960, top - 100, 940, top - 100, '#8a939c', 2.6); ln(960, top - 100, 980, top - 100, '#8a939c', 2.6); const bl = Math.sin(t * 4) > 0; ell(960, top - 154, 5, 5, bl ? '#ff3a3a' : '#7a1a1a'); if (bl) V2.glow(960, top - 154, 30, '255,60,60', .8, 'screen', .5);
      signGreen(530, top - 12 - 112, t, { text: st.signs && typeof st.signs.roof === 'string' ? st.signs.roof : undefined, fn: st.signs && typeof st.signs.roof === 'function' ? st.signs.roof : undefined });
    }
  }
  ctx.restore();
}

// ================================================================================================ the crane: lattice mast, jib with a trolley, counter-jib with weights, an operator cab, a hook block, a spreader beam and four slings
const CR = { mastX: MAST_X, mastW: 110, jibTop: JIB_Y - 52, jibBot: JIB_Y + 8, tipX: -300, counterX: 1740, apexY: -1900, base: GY, cab: { x: 1170, y: JIB_Y + 22, w: 130, h: 108 } };
const SLING_DX = [-400, -140, 140, 400];
S15.crane_geom = CR;
function craneRig(lt, st, s) {
  const c = st.crane || {};
  const load = c.load !== undefined ? c.load : (s.stack ? null : 'gl');
  const attach = { gl: SLING_DX.map(dx => S15.toWorld(540 + dx, GL_BOT - GL_H - 22, st)) };
  const e = st.exec || st.execAt ? execPlace(s) : null;
  attach.exec = SLING_DX.map(dx => e ? [e.x0 + 530 + dx, e.y0 - T - 24] : [540 + dx, EX_Y0 + s.sink - T - 24]);
  let hook = c.hook ? c.hook.slice() : null;
  if (!hook) {
    const A = load ? attach[load] : null;
    hook = A ? [A.reduce((m, p) => m + p[0], 0) / 4, A.reduce((m, p) => m + p[1], 0) / 4 - 360] : [c.trolleyX ?? 540, JIB_Y + 200];
  }
  const trolleyX = c.trolleyX ?? hook[0], sp = hook[1] + 100;
  const eyes = SLING_DX.map(dx => [hook[0] + dx, sp + 9]);
  const A = load ? attach[load] : null;
  const ropes = c.ropes || (A ? eyes.map((p, i) => [p, A[i]]) : []);
  const cab = CR.cab;
  return { mastX: CR.mastX, jibY: JIB_Y, trolley: [trolleyX, CR.jibBot + 10], hook, spreader: [hook[0], sp], eyes, attach, ropes, load, cab: [cab.x + 18, cab.y + 14, cab.w - 36, cab.h - 44], cabFull: [cab.x, cab.y, cab.w, cab.h] };
}
S15.craneRig = (lt, st = {}) => craneRig(lt, st, STATE(st));
/* a lattice between two chords: dark under-stroke then the crane yellow, batched into one path each */
function latticeV(xa, xb, y0, y1, bay) {      /* vertical mast: y0 top, y1 bottom */
  const ch = new Path2D(), br = new Path2D();
  ch.moveTo(xa, y0); ch.lineTo(xa, y1); ch.moveTo(xb, y0); ch.lineTo(xb, y1);
  let k = 0; for (let y = y1; y > y0; y -= bay, k++) { const yt = Math.max(y0, y - bay); br.moveTo(xa, y); br.lineTo(xb, y); if (k % 2) { br.moveTo(xa, y); br.lineTo(xb, yt); } else { br.moveTo(xb, y); br.lineTo(xa, yt); } }
  ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(38,24,40,.8)'; ctx.lineWidth = 9; ctx.stroke(ch); ctx.lineWidth = 6; ctx.stroke(br);
  ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 6; ctx.stroke(ch); ctx.lineWidth = 3.2; ctx.stroke(br);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.4; ctx.stroke(ch);
}
function latticeH(x0, x1, ya, yb, bay) {      /* horizontal jib: ya top chord, yb bottom chord */
  const ch = new Path2D(), br = new Path2D(); ch.moveTo(x0, ya); ch.lineTo(x1, ya); ch.moveTo(x0, yb); ch.lineTo(x1, yb);
  let k = 0; for (let x = x0; x < x1; x += bay, k++) { const xn = Math.min(x1, x + bay); br.moveTo(x, ya); br.lineTo(x, yb); if (k % 2) { br.moveTo(x, ya); br.lineTo(xn, yb); } else { br.moveTo(x, yb); br.lineTo(xn, ya); } }
  ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(38,24,40,.8)'; ctx.lineWidth = 9; ctx.stroke(ch); ctx.lineWidth = 6; ctx.stroke(br);
  ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 6; ctx.stroke(ch); ctx.lineWidth = 3.2; ctx.stroke(br);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.4; ctx.stroke(ch);
}
function craneBack(t, st, s, rig) {
  const V = view(200), mx = CR.mastX, hw = CR.mastW / 2;
  if (!seen(V, CR.tipX - 40, CR.apexY - 40, CR.counterX + 100, GY + 80)) return;
  ctx.save();
  /* the foundation, ballast blocks and a skirt of warning stripes */
  rb(mx - 120, GY - 44, 240, 44, '#8a8d93', { r: 4, lw: 2 }); stripesV(mx - 118, GY - 40, mx + 118, GY - 4, 22, 2, 'rgba(40,40,46,.3)', 8); rb(mx - hw - 10, GY - 58, CR.mastW + 20, 16, '#f2c230', { r: 3, lw: 2 });
  /* the mast */
  const top = CR.jibTop - 8;
  latticeV(mx - hw, mx + hw, top, GY - 58, 110);
  for (let y = GY - 58 - 55; y > top; y -= 440) rb(mx - hw - 6, y - 7, CR.mastW + 12, 14, '#d99f16', { r: 3, lw: 1.8 });         /* collars between mast sections */
  for (let y = GY - 70; y > top; y -= 440) { ln(mx + hw + 2, y, mx + hw + 24, y - 20, '#3a3f46', 3); }
  /* the jib, the counter-jib, the A-frame and its pendants */
  latticeH(CR.tipX, mx - hw, CR.jibTop, CR.jibBot, 66);
  latticeH(mx + hw, CR.counterX, CR.jibTop + 14, CR.jibBot, 60);
  poly([[mx - hw - 8, CR.jibTop], [mx + hw + 8, CR.jibTop], [mx + 10, CR.apexY], [mx - 10, CR.apexY]], null, 'rgba(38,24,40,.8)', 9);
  latticeV(mx - 10, mx + 10, CR.apexY, CR.jibTop, 70);
  ctx.strokeStyle = 'rgba(38,24,40,.9)'; ctx.lineWidth = 3.4; for (const [x, y] of [[CR.tipX, CR.jibTop], [600, CR.jibTop], [mx + 440, CR.jibTop + 14], [CR.counterX, CR.jibTop + 14]]) { ctx.beginPath(); ctx.moveTo(mx, CR.apexY); ctx.lineTo(x, y); ctx.stroke(); }
  ctx.strokeStyle = '#8a939c'; ctx.lineWidth = 1.6; for (const [x, y] of [[CR.tipX, CR.jibTop], [600, CR.jibTop], [mx + 440, CR.jibTop + 14], [CR.counterX, CR.jibTop + 14]]) { ctx.beginPath(); ctx.moveTo(mx, CR.apexY); ctx.lineTo(x, y); ctx.stroke(); }
  ell(mx, CR.apexY - 6, 9, 9, '#3a3f46', OUT, 1.6); const bl = Math.sin(t * 3.4) > 0; ell(mx, CR.apexY - 20, 5, 5, bl ? '#ff3a3a' : '#7a1a1a', OUT, 1); if (bl) V2.glow(mx, CR.apexY - 20, 60, '255,60,60', .9, 'screen', .6);
  /* counterweights hanging from the end of the counter-jib */
  for (let i = 0; i < 3; i++) rb(CR.counterX - 130 + i * 38, CR.jibBot + 4, 36, 70 + (i % 2) * 8, '#8a8d93', { r: 3, lw: 2 }); stripesH(CR.counterX - 128, CR.jibBot + 10, CR.counterX - 18, CR.jibBot + 66, 14, 1.6, 'rgba(40,40,46,.28)');
  rb(mx + hw, CR.jibBot - 34, 110, 44, '#d99f16', { r: 4, lw: 2 });                         /* the machinery house */
  /* the slewing unit and the operator's cab (left of the mast, under the jib) */
  rb(mx - hw - 4, CR.jibTop - 4, CR.mastW + 8, 24, '#3a3f46', { r: 4, lw: 2 });
  const c = CR.cab;
  rb(c.x, c.y, c.w, c.h, '#f2c230', { r: 8, lw: 2.2 }); rb(c.x + 8, c.y + 8, c.w - 16, 12, '#d99f16', { r: 4, lw: 1.4 }); ell(c.x + c.w / 2, c.y - 4, 8, 6, bl ? '#ff9a3a' : '#c27a2a', OUT, 1.4);
  const w0 = rig.cab; ctx.fillStyle = vg(w0[1], w0[1] + w0[3], '#2a3a4a', '#4a6a80'); ctx.beginPath(); ctx.roundRect(w0[0], w0[1], w0[2], w0[3], 5); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  /* a trolley on the jib's lower chord */
  const tx = rig.trolley[0]; rb(tx - 22, CR.jibBot - 2, 44, 18, '#3a3f46', { r: 3, lw: 1.8 }); for (const dx of [-14, 14]) ell(tx + dx, CR.jibBot + 1, 5, 5, '#c9ced6', OUT, 1.2);
  ctx.restore();
}
function craneFront(t, st, s, rig) {
  const V = view(200); if (!seen(V, -420, JIB_Y - 100, 1800, GY)) return;
  const [hx, hy] = rig.hook, [tx, ty] = rig.trolley, [spx, spy] = rig.spreader;
  ctx.save();
  /* the hoist: two cables from the trolley to the hook block */
  for (const dx of [-14, 14]) { ln(tx + dx * .4, ty + 16, hx + dx, hy - 40, 'rgba(38,24,40,.9)', 4.6); ln(tx + dx * .4, ty + 16, hx + dx, hy - 40, '#aab2ba', 2); }
  /* the hook block: a yellow housing with a sheave, a swivel and a hook; a short chain to the spreader */
  rb(hx - 36, hy - 44, 72, 78, '#f2c230', { r: 8, lw: 2.2 }); ell(hx, hy - 12, 17, 17, '#3a3f46', OUT, 2); ell(hx, hy - 12, 7, 7, '#aab2ba', OUT, 1.4); rb(hx - 28, hy + 24, 56, 12, '#d99f16', { r: 3, lw: 1.6 });
  ctx.strokeStyle = 'rgba(38,24,40,.9)'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy + 36); ctx.lineTo(hx, hy + 52); ctx.arc(hx, hy + 68, 16, -PI / 2, PI * .95); ctx.stroke(); ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 6; ctx.stroke();
  for (let i = 0; i < 3; i++) ell(hx, spy - 30 + i * 11, 5, 8, null, '#3a3f46', 3);
  /* the spreader beam with four shackle eyes */
  rb(spx - 440, spy - 6, 880, 16, '#4a5058', { r: 3, lw: 2 }); rb(spx - 440, spy - 6, 880, 5, '#7a828a', { r: 2, lw: 0 }); rb(spx - 20, spy - 18, 40, 14, '#d99f16', { r: 3, lw: 1.8 });
  for (const e of rig.eyes) { ell(e[0], e[1] - 3, 6, 7, null, '#c9ced6', 3); ell(e[0], e[1] - 3, 6, 7, null, 'rgba(38,24,40,.8)', 1); }
  /* the slings: steel cable, dark under-stroke */
  for (const pts of rig.ropes) {
    if (!pts || pts.length < 2) continue;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(38,24,40,.9)'; ctx.lineWidth = 6.4; ctx.stroke(); ctx.strokeStyle = '#b7bec6'; ctx.lineWidth = 3.2; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
S15.crane = (lt, st = {}) => { const s = STATE(st), rig = craneRig(lt, st, s), t = st.t ?? lt; craneBack(t, st, s, rig); craneFront(t, st, s, rig); };

// ================================================================================================ the join, the sunk lobby, the window entrance, the assembly (tower / front), cameras
/* the crushed roof's litter at the join: the sign halves flattened to strips, bricks, tile chips (st.roofParts 'rest', the default once docked) */
function joinDebris(t, s, st) {
  const th = roofThick(s, st), base = 346 + s.sink + s.squat, top = base - th;
  ctx.save();
  const q = rnd(11);
  for (let i = 0; i < 16; i++) { const x = 40 + q() * 980, y = top + 4 + q() * (th - 4), w = 8 + q() * 12; ctx.fillStyle = ['#d06d52', '#a74a38', '#b8674a', '#8d3f2d'][i % 4]; ctx.save(); ctx.translate(x, y); ctx.rotate((q() - .5) * .7); ctx.fillRect(-w / 2, -2.4, w, 4.8); ctx.restore(); }
  /* the sign, in two flattened halves, tilted a few degrees, one riding out over the left eave */
  const halves = [{ p: SIGN.a, x: 24, y: top + 9, rot: -.07, sy: .26, id: 'a' }, { p: SIGN.b, x: 600, y: top + 11, rot: .045, sy: .24, id: 'b' }];
  for (const h of halves) {
    ctx.save(); ctx.translate(h.x + h.p.w / 2, h.y); ctx.rotate(h.rot); ctx.scale(1, h.sy); ctx.translate(-h.p.w / 2, -h.p.h / 2);
    signHalf({ x: 0, y: 0, w: h.p.w, h: h.p.h, text: h.p.text, id: 'rest' + h.id }, t, { moving: true, dark: true, text: signText(st, h.id) });
    ctx.restore();
  }
  /* bricks at the right end, the cap tilted on top */
  for (let i = 0; i < 7; i++) chimneyBrickAt(900 + (i % 4) * 24 + (i > 3 ? 12 : 0), top + 5 - Math.floor(i / 4) * 8, i);
  ctx.restore();
}
function chimneyBrickAt(x, y, i) { ctx.save(); ctx.translate(x, y); ctx.rotate(((i * 37) % 11 - 5) * .06); chimneyBrick(-11, -4.5, 22, 9, i); ctx.restore(); }
S15.joinDebris = (t, st = {}) => joinDebris(t, STATE(st), st);

/* underground: the ground floor of Fruit Bowl, dark and lit by its own lamps; the earth against the lobby's glass door; the LOBBY sign in the street; the window entrance and its ladder */
function underground(t, s, st, a) {
  if (a <= .003) return;
  const lobby = rectOf('lobby', s), V = view(160);
  ctx.save();
  const bot = GY + s.sink + 4; ctx.beginPath(); ctx.rect(X0 - 2, GY, X1 - X0 + 4, bot - GY); ctx.clip();
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = vg(GY, GY + 40, `rgba(120,100,150,${.25 * a})`, `rgba(46,38,70,${.62 * a})`); ctx.fillRect(X0 - 2, GY, X1 - X0 + 4, bot - GY);
  ctx.globalCompositeOperation = 'source-over';
  for (const [id, fs] of [['lobby', [.5]], ['station', [.3, .7]], ['dining', [.5]]]) { const r = rectOf(id, s); if (r.floor < GY + 20) continue; for (const f of fs) { V2.glow(r.x0 + f * r.w, r.y0 + 14, r.w * .55, '255,210,140', .42 * a, 'screen', .5); V2.beam(r.x0 + f * r.w, r.y0 + 14, r.x0 + f * r.w, r.floor, 40, r.w * .7, '255,214,150', .14 * a); } }
  ctx.restore();
  /* the earth pressed against the lobby's glass door: soil, a root, a worm; only below the street */
  if (lobby.y0 + 71 > GY - 100) {
    ctx.save(); ctx.beginPath(); ctx.rect(lobby.x0 + 31, lobby.y0 + 71, 98, 200); ctx.clip(); ctx.globalAlpha *= a;
    ctx.fillStyle = vg(lobby.y0 + 71, lobby.y0 + 271, '#5b3d2a', '#3f2a1c'); ctx.fillRect(lobby.x0 + 28, lobby.y0 + 68, 104, 206); const q = rnd(9); for (let i = 0; i < 70; i++) { ctx.fillStyle = q() > .5 ? 'rgba(20,10,4,.35)' : 'rgba(240,210,170,.16)'; ctx.fillRect(lobby.x0 + 31 + q() * 98, lobby.y0 + 71 + q() * 200, 1.6 + q() * 4, 1.4 + q() * 3); }
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lobby.x0 + 31, lobby.y0 + 120); ctx.quadraticCurveTo(lobby.x0 + 70, lobby.y0 + 140, lobby.x0 + 129, lobby.y0 + 110); ctx.stroke();
    const wx = lobby.x0 + 70 + 18 * Math.sin(t * .6), wy = lobby.y0 + 210; ctx.strokeStyle = '#8a3a3e'; ctx.lineWidth = 9; ctx.beginPath(); for (let i = 0; i <= 10; i++) { const u = i / 10; i ? ctx.lineTo(wx - u * 44, wy + 6 * Math.sin(u * 7 - t * 3)) : ctx.moveTo(wx, wy); } ctx.stroke(); ctx.strokeStyle = '#e49aa0'; ctx.lineWidth = 5.4; ctx.stroke(); ell(wx + 1, wy - 1, 2, 2, '#1d1a22');
    ctx.fillStyle = 'rgba(190,225,255,.14)'; ctx.fillRect(lobby.x0 + 31, lobby.y0 + 71, 98, 200); ln(lobby.x0 + 40, lobby.y0 + 76, lobby.x0 + 62, lobby.y0 + 266, 'rgba(255,255,255,.18)', 8);
    ctx.restore();
  }
  /* the sign in the street, on a post: LOBBY with a red arrow pointing down */
  const sx = -120, sy = GY - 118; ctx.save(); ctx.globalAlpha *= clamp01(a * 2);
  rb(sx - 5, sy + 40, 10, 82, '#6a4a2a', { r: 3, lw: 1.8 }); fsh(sx, GY + 2, 70, .3, 6);
  plate([sx - 78, sy, 156, 52], 'LOBBY', { fill: '#2f6b3c', stroke: '#f6f3e8', lw: 4, ink: '#f6f3e8', size: 34, spacing: 3, pad: 6, r: 10, heroSize: 34, id: 'k15.lobbysign' });
  poly([[sx - 14, sy + 56], [sx + 14, sy + 56], [sx + 14, sy + 72], [sx + 24, sy + 72], [sx, sy + 92], [sx - 24, sy + 72], [sx - 14, sy + 72]], '#d93025', OUT, 2);
  ctx.restore();
  /* the window entrance on the left of the middle floor, and its ladder up from the street */
  const m = rectOf('med', s), wy1 = m.floor - 6, wy0 = m.floor - 122;
  if (wy1 > GY - 200 && wy1 < GY + 40) {
    ctx.save(); ctx.globalAlpha *= clamp01(a * 2);
    poly([[10, wy0 - 6], [-30, wy0 + 6], [-30, wy1 + 2], [10, wy1 + 2]], 'rgba(150,200,230,.5)', OUT, 2);       /* the bay: a pane in front, the sash raised */
    rb(-34, wy0 - 12, 48, 9, '#d8c8a0', { r: 3, lw: 1.6 }); rb(-36, wy1 + 2, 52, 9, '#d8c8a0', { r: 3, lw: 1.6 });
    rb(-30, wy0 + 12, 6, 52, '#f2eee0', { r: 2, lw: 1.3 }); rb(-30, wy1 - 60, 40, 7, '#f2eee0', { r: 2, lw: 1.3 });
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-26, wy0 + 20, 4, 30);
    for (let i = 0; i < 5; i++) { const fx = -30 + i * 8; ell(fx, wy1 + 16, 4, 4, ['#f06a8a', '#f7c948', '#fff', '#f06a8a', '#f7c948'][i], OUT, .8); } rb(-36, wy1 + 12, 50, 12, '#a77a44', { r: 2, lw: 1.5 });
    ctx.beginPath(); ctx.moveTo(10, wy0); ctx.quadraticCurveTo(-8 + 6 * Math.sin(t * 1.4), wy0 + 40, -22 + 8 * Math.sin(t * 1.4 + 1), wy0 + 78); ctx.lineTo(10, wy0 + 80); ctx.closePath(); ctx.fillStyle = 'rgba(255,248,230,.85)'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.stroke();
    const lx0 = -92, lx1 = -48, ly0 = GY, ly1 = wy1 + 6; ln(lx0, ly0, lx1, ly1, '#c9a463', 6); ln(lx0 + 24, ly0, lx1 + 22, ly1, '#c9a463', 6); ln(lx0, ly0, lx1, ly1, 'rgba(60,36,12,.6)', 1.6); ln(lx0 + 24, ly0, lx1 + 22, ly1, 'rgba(60,36,12,.6)', 1.6);
    for (let i = 1; i < 8; i++) { const u = i / 8; ln(lerp(lx0, lx1, u), lerp(ly0, ly1, u), lerp(lx0 + 24, lx1 + 22, u), lerp(ly0, ly1, u), '#a77a44', 4); }
    plate([-186, wy0 - 62, 148, 40], 'ENTRANCE', { fill: '#2f6b3c', stroke: '#f6f3e8', lw: 3, ink: '#f6f3e8', size: 24, spacing: 2.4, pad: 5, r: 8, heroSize: 24, id: 'k15.entrance' });
    ctx.restore();
  }
}
S15.groundAlpha = st => { const s = STATE(st); return st && st.ground != null ? st.ground : clamp01(s.sink / PITCH * 6); };

S15.tower = (lt, st = {}) => {
  const s = STATE(st), t = st.t ?? lt, V = view(200), tod = st.tod ?? .45, ground = S15.groundAlpha(st);
  const rig = craneRig(lt, st, s);
  ctx.save();
  guard('sky', () => skyDraw(t, tod, V));
  if (st.lot !== false) guard('lot', () => lotDraw(t, V, 1 - ground, tod));
  guard('ground', () => groundDraw(t, V, ground));
  if (st.crane !== false && !(st.crane && st.crane.off)) guard('crane', () => craneBack(t, st, s, rig));
  guard('fb', () => fbPass(lt, st, s, 'back'));
  guard('underground', () => underground(t, s, st, ground));
  guard('roof', () => { roofDraw(t, s, st, roofThick(s, st)); const rp = st.roofParts || (s.stack ? 'rest' : 'intact'); if (rp === 'intact') roofFurniture(t, s, st); else if (rp === 'rest') joinDebris(t, s, st); });
  guard('gl', () => glBlock(lt, st, s, 'back'));
  guard('exec', () => execBlock(lt, st, s, 'back'));
  guard('plates', () => { const V2v = view(120); platesDraw(st, s, V2v); doorPlate(st, s, V2v); });
  if (st.crane !== false && !(st.crane && st.crane.off)) guard('crane front', () => craneFront(t, st, s, rig));
  ctx.restore();
};
S15.front = (lt, st = {}) => {
  const s = STATE(st), t = st.t ?? lt, rig = craneRig(lt, st, s);
  ctx.save();
  guard('fb front', () => fbPass(lt, st, s, 'front'));
  guard('gl front', () => glBlock(lt, st, s, 'front'));
  guard('cab', () => craneCab(t, st, s, rig));
  ctx.restore();
};
function craneCab(t, st, s, rig) {
  const V = view(120); const w0 = rig.cab; if (!seen(V, w0[0], w0[1], w0[0] + w0[2], w0[1] + w0[3])) return;
  ctx.fillStyle = 'rgba(190,225,255,.16)'; ctx.fillRect(w0[0], w0[1], w0[2], w0[3] * .45); ln(w0[0] + 10, w0[1] + w0[3] - 2, w0[0] + 30, w0[1] + 4, 'rgba(255,255,255,.45)', 3);
  rb(w0[0] - 6, w0[1] + w0[3] - 4, w0[2] + 12, 9, '#d99f16', { r: 3, lw: 1.8 });
}

// ================================================================================================ cameras: S15.cam(view, st, o) -> { x, y, z } aiming at the clear band (y 244 to 1380)
S15.towerTop = st => { const s = STATE(st); const e = st && (st.exec || st.execAt); return (e ? EX_Y0 - T - 150 : GL_BOT - GL_H - 230) + (s.gy - GL_CY) + s.sink; };
S15.cam = (v, st = {}, o = {}) => {
  const s = STATE(st), band = 148;             /* the centre of the clear band is 148 px above the frame centre: the camera looks that much lower than the subject */
  const fit = (x0, y0, x1, y1, zmax = 3.4) => { const z = o.z ?? Math.min(zmax, 1000 / Math.max(1, x1 - x0), 1100 / Math.max(1, y1 - y0)); return { x: (x0 + x1) / 2 + (o.dx || 0), y: (y0 + y1) / 2 + band / z + (o.dy || 0), z }; };
  const [kind, arg] = String(v).split(':');
  if (kind === 'wide') return fit(-420, S15.towerTop(st) - (st.stack === 0 ? 120 : 0), 1760, GY + 40 + s.sink * .2, 1);
  if (kind === 'tower') return fit(X0 - 20, S15.towerTop(st), X1 + 20, GY + s.sink * .1 + 30, 1);
  if (kind === 'roof') { const y = S15.towerTop(st) + 100; return fit(X0, y - 100, X1, y + 260, 1.1); }
  if (kind === 'join') { const y = 330 + s.sink + s.squat; return fit(X0 - 20, y - 420, X1 + 20, y + 400, 1.1); }
  if (kind === 'ground') return fit(-500, GY - 100, 1700, GY + 900, 1.2);
  if (kind === 'crane') return fit(-320, JIB_Y - 420, 1760, JIB_Y + 520, 1);
  if (kind === 'cab') { const w0 = craneRig(0, st, s).cab; return fit(w0[0] - 60, w0[1] - 40, w0[0] + w0[2] + 60, w0[1] + w0[3] + 60, 3.2); }
  if (kind === 'hook') { const h = craneRig(0, st, s).hook; return fit(h[0] - 300, h[1] - 140, h[0] + 300, h[1] + 260, 1.6); }
  if (kind === 'floor') { const i = +arg, y = S15.floorY(i, st); return fit(X0 - 10, y - 250, X1 + 10, y + 50, 1.02); }
  if (kind === 'room') { const r = S15.rect(arg, st); return fit(r.x0 - 4, r.y0, r.x1 + 4, r.y1 + 14, 3.4); }
  throw new Error('S15.cam: unknown view ' + v);
};
S15.zoom = (v, st, o) => { const c = S15.cam(v, st, o); window.H6.zoomTo(c.x, c.y, c.z); return c; };
/* the sun and the dusk rim for a time of day; call after V2.setLight if you want the kit's own look */
S15.light = (st = {}) => {
  const tod = st.tod ?? .45, k = clamp01((tod - .3) / .55);
  V2.setLight({ key: [-.55, -.72], keyColor: mixc('#ffe3ac', '#ffb070', k), keyA: .26, rim: mixc('#9fc4ff', '#8a7ad8', k), rimA: .38, shadow: '#1a1030', shadowA: .3, bounce: '#ffd9a0', bounceA: .16 });
};
S15.stairs = (lt, st) => { /* filled in with the dock scene: see ep15_dock.js (S15.stairs is replaced there if the scene registers its own) */ };
S15.drawItem = (k, ...a) => S14.drawItem(k, ...a);
S15.version = 1;
})();
