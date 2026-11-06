'use strict';
/* SHIFT HAPPENS, Episode 22, "The Secret Santa": the ART builder's kit, window.A22 (ep22_art.js). Contract: /tmp/shift_tools/briefs/A22_API.md; usage, options and traps: GUIDE_ART22.md in this folder.
 * Registers through the engine's EXT hooks (everything prefixed fp22_). Every function is a pure function of its arguments and `t`: no Math.random, no Date, no state; randomness only from FX18.rnd.
 * Text only through the UI kit, drawn live (never into a cached sprite). Props draw in the CURRENT transform and return their box [x0, y0, x1, y1] in those units.
 *
 * AS BUILT (signatures; the options are in GUIDE_ART22.md)
 *   A22.santaHat(o, g)       a red Santa hat (fp22_santahat) on ANY drawChar options: { hatFlop 0..1, hatSide +1|-1, hatColor (A22.ELF for an elf), bandColor, pomColor, hatTall, hatLift, sway, wind } -> o
 *   A22.santa(o)             the Administrator (Melon) as Santa: { pose 'stand'|'seated'|'hoyer', sack false|'hand'|'shoulder', expr santa_jolly|santa_stuck|Melon's, hat {..}|false, beard, yaw, headYaw } -> drawChar options
 *   A22.lowChair(ctx, o)     the low armchair of the seated pose: { x, y (floor), s, part 'back'|'front'|'all', color, t } -> box.   A22.santaGrip(o, [sx, sy]) -> a grip target in his local units.
 *   A22.gift(ctx, o)         a wrapped box: { x, y (bottom centre), s, rot, w, h, d, paper, color, color2, bow, ribbon, ribbonColor, bowColor, tag, open 0..1, t, seed } -> box.   A22.giftInfo(o) -> { box, bow, lid, tag }
 *   A22.paperPrint(kind, color, color2) -> (ctx, w, h) => {} (SOFT2D.drawCloth fill).   A22.paperBack, A22.GIFT_COLORS
 *   A22.chux(ctx, o)         the flat blue Chux underpad: { x, y (centre), s, rot, w, h, fold, crumple, t } -> box.   A22.chuxPrint() -> (ctx, w, h) => {}.   A22.chuxBack
 *   A22.tree(ctx, o)         the decorated tree: { x, y (floor), s, h, t, lights, baubles, tinsel, star, skirt, gifts, glow, lit, seed } -> { box, lights:[{ x, y, color, phase, r }], star }.   A22.twinkle(t, phase) -> .3..1
 *   Held props: fp22_sack.  Accessories: fp22_santahat, fp22_santacoat, fp22_beard, fp22_santalegs, fp22_sackback.
 */
(() => {
if (typeof KINDS === 'undefined' || typeof EXT === 'undefined' || typeof V2 === 'undefined' || typeof V2C === 'undefined') return;
const A = window.A22 = window.A22 || {};
const OUT = 'rgba(25,10,20,.92)';
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : hash(s * 3.17 + k * 11.3 + 1.3);
const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const tOf = o => (o && o.t != null ? o.t : (typeof T === 'number' ? T : 0));
const mixc = (a, b, k) => V2.rgba(V2.mix(a, b, k), 1);
const mixa = (a, b, k, al) => V2.rgba(V2.mix(a, b, k), al);
const yawsOf = o => { const Y = V2C.yawInfo ? V2C.yawInfo(o) : null; return Y ? { y: Y.y, h: Y.h } : { y: o.yaw || 0, h: o.headYaw != null ? o.headYaw : (o.yaw || 0) }; };
const keyX = () => V2.LIGHT.key[0];
const dsin = Math.sin, dcos = Math.cos;
const scrScale = c => { const m = (c || ctx).getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; };
const lg = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
const rg = (c, x, y, r0, r1, stops) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
A.PLATES = A.PLATES || {};
A.ELF = '#2f9a46';

// ================================================================== the silhouette of a kind: half width at a height (cached once per kind, from the engine's own path; as A20.halfW)
const HW = {}; let hwCtx = null;
function halfW(kind, y) {
  let tab = HW[kind];
  if (!tab) {
    const k = KINDS[kind], p = PATHS[kind] || (PATHS[kind] = bodyPath(k));
    if (!hwCtx) hwCtx = document.createElement('canvas').getContext('2d');
    const y0 = -Math.ceil(k.ry * 1.25), n = Math.ceil(k.ry * 2.6 / 4) + 2, arr = new Float32Array(n);
    for (let i = 0; i < n; i++) { const yy = y0 + i * 4; let w = 0; for (let x = 0; x <= k.rx * 1.3; x += 2) if (hwCtx.isPointInPath(p, x, yy)) w = x; arr[i] = w; }
    tab = HW[kind] = { y0, arr };
  }
  const f = (y - tab.y0) / 4, i = Math.floor(f), u = f - i;
  if (i < 0 || i >= tab.arr.length - 1) return 0;
  return lerp(tab.arr[i], tab.arr[i + 1], u);
}
A.halfW = halfW;
function crownY(kind) { const k = KINDS[kind]; for (let y = -k.ry * 1.25; y < k.ry; y += 2) if (halfW(kind, y) > 3) return y; return -k.ry; }

/* a ball of fur (the pom, a cuff): soft bumps, an inked outline, a cool shadow and a warm highlight */
function fluff(c, x, y, r, fill, sh, n = 11, seed = 1) {
  c.save();
  const bumps = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd(seed, i) * .5; bumps.push([x + dcos(a) * r * .72, y + dsin(a) * r * .72, r * (.4 + rnd(seed, i + 9) * .14)]); }
  c.fillStyle = OUT; c.beginPath(); c.arc(x, y, r * .86 + 2.2, 0, TAU); c.fill();
  for (const b of bumps) { c.beginPath(); c.arc(b[0], b[1], b[2] + 2.2, 0, TAU); c.fill(); }
  c.fillStyle = fill; c.beginPath(); c.arc(x, y, r * .86, 0, TAU); c.fill();
  for (const b of bumps) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.fill(); }
  c.fillStyle = rg(c, x + (keyX() < 0 ? -r * .35 : r * .35), y - r * .3, 1, r * 1.15, [[0, 'rgba(255,255,255,.5)'], [.5, 'rgba(255,255,255,0)'], [1, sh]]);
  c.beginPath(); c.arc(x, y, r * 1.02, 0, TAU); c.fill();
  c.restore();
}
/* a fur band along a polyline pair: a white body with scalloped top and bottom edges (each edge a row of bumps), cool shadow at the bottom, a few curl strokes */
function furBand(c, top, bot, o = {}) {
  const fill = o.fill || '#fbf7ef', seed = o.seed || 1, rr0 = o.r || 8, lw = o.lw ?? 2.2;
  const bumps = [];
  const along = (pts, side) => { for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i]; const j = rnd(seed + side, i); bumps.push([x + (j - .5) * 3, y + side * rr0 * .25, rr0 * (.8 + .4 * rnd(seed + side + 7, i))]); } };
  along(top, -1); along(bot, 1);
  let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity; for (const [x, y] of top.concat(bot)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const shape = grow => {   /* ONE path: the band and every bump (a single fill each pass) */
    c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath();
    for (const b of bumps) { c.moveTo(b[0] + b[2] + grow, b[1]); c.arc(b[0], b[1], b[2] + grow, 0, TAU); }
  };
  if (lw > 0) { c.fillStyle = OUT; c.strokeStyle = OUT; c.lineWidth = lw * 2; c.lineJoin = 'round'; shape(lw); c.fill(); }
  c.fillStyle = lg(c, 0, y0 - rr0, 0, y1 + rr0, [[0, mixc(fill, '#ffffff', .5)], [.45, fill], [1, mixc(fill, o.shadow || '#7884aa', .42)]]); shape(0); c.fill();
  c.strokeStyle = 'rgba(150,150,175,.42)'; c.lineWidth = 1.6; c.lineCap = 'round';
  const n = Math.max(3, Math.round((x1 - x0) / (rr0 * 1.7))); c.beginPath();
  for (let i = 0; i < n; i++) { const u = (i + .5) / n, a = top[Math.min(top.length - 1, Math.round(u * (top.length - 1)))], b = bot[Math.min(bot.length - 1, Math.round(u * (bot.length - 1)))], v = .3 + .4 * rnd(seed + 3, i); const cx = lerp(a[0], b[0], v), cy = lerp(a[1], b[1], v), a0 = .6 + rnd(seed, i) * 2; c.moveTo(cx + dcos(a0) * rr0 * .45, cy + dsin(a0) * rr0 * .45); c.arc(cx, cy, rr0 * .45, a0, a0 + 2.8); }
  c.stroke();
}

// ================================================================== the Santa hat (fp22_santahat): a velvet cone that flops, a fur band above the brows, a pom at the tip (mid layer: the face is drawn over it)
const HAT_DEF = { hatFlop: .7, hatSide: 1, hatColor: '#d42a2a', bandColor: '#fbf7ef', pomColor: '#ffffff', sway: 1, wind: 0, hatTall: 0, hatLift: 0, hatTilt: 0 };
const HAT_WHO = { straw: { hatSide: 1 }, tom: { hatSide: -1, hatFlop: .8 }, onion: { hatSide: 1, hatFlop: .2 }, lemon: { hatSide: -1 }, mango: { hatSide: 1, hatFlop: .6 }, bind: { hatSide: -1, hatFlop: .55 },
  melon: { hatSide: 1, hatFlop: .72 }, pear: { hatSide: -1, hatFlop: .65 }, cran: { hatSide: 1, hatFlop: .75 }, banana: { hatSide: -1, hatFlop: .6 }, goji: { hatSide: 1, hatFlop: .6 }, egg: { hatSide: -1 } };
const HEAD_KEEP = { airpods: 1 };
const HAT_CLASH22 = ['fp15_visor_badge', 'fp15_headset', 'fp15_hardhat', 'bandage', 'bandage7', 'visor', 'partyhat', 'partyhat10', 'fp20_hat', 'fp20_cap', 'fp22_santahat'];
const hatClashes = a => HAT_CLASH22.indexOf(a) >= 0 || (V2C.ACC_CLS && V2C.ACC_CLS[a] === 'head' && !HEAD_KEEP[a]) || /^fp2[01]_.*(hat|cap|helmet)/.test(a);
function hatGeo22(o, k, h) {
  const bind = o.kind === 'bind';
  const yb = k.eyeY - k.er * 1.42 - 21 - (o.browUp || 0) - (h.hatLift || 0);   /* the lowest point of the band: clear of the brows even when they rise */
  const ev = bind ? 5 : 8, bh = h.bandH || (bind ? 20 : 27);
  const wb = clamp(halfW(o.kind, yb - 4) + 9, bind ? 50 : 58, h.hatMaxW || 112);
  const yTop = yb - bh, coneH = (h.coneH || clamp(wb * 1.32, 76, 148)) + (h.hatTall || 0);
  return { yb, ev, bh, wb, wd: wb - 6, yTop, coneH };
}
const bandB = (G, x) => G.yb - G.ev * (1 - Math.sqrt(Math.max(0, 1 - (x / G.wb) * (x / G.wb))));
/* the cone's spine (heading from straight up, + toward screen right), mapped for the head yaw: the flop foreshortens and swings to the back of the head in profile, mirrors at the back */
function hatSpine(G, h, t, seed, hy) {
  const N = 18, f = clamp(h.hatFlop), sd = h.hatSide < 0 ? -1 : 1, sa = h.sway ?? 1;
  const sw = sa * (dsin(t * 1.9 + seed) * .07 + dsin(t * 1.13 + seed * 2.1) * .04) + (h.wind || 0) * .3;
  const B = f * 2.3, L = G.coneH * (1 + .3 * f), ds = L / N, ch = dcos(hy), shh = dsin(hy), pts = [];
  let x = 0, y = G.yTop + 7;
  for (let i = 0; i <= N; i++) {
    const s = i / N; pts.push([x * ch - Math.abs(x) * .72 * shh, y, s]);
    const th = sd * B * Math.pow(s, 1.5) + sw * s * s;
    x += dsin(th) * ds; y -= dcos(th) * ds;
  }
  return pts;
}
function coneEdges(pts, G) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, s = pts[i][2];
    const w = G.wd * Math.pow(1 - s, .95) * (1 - .08 * s) + 4.5;
    L.push([pts[i][0] - nx * w, pts[i][1] - ny * w]); R.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
  }
  return { L, R };
}
function hatDraw22(c, o, k, t, hy) {
  const h = o.h22, G = hatGeo22(o, k, h), seed = o.seed || 0, lightL = keyX() < 0, base = h.hatColor;
  const dk = mixc(base, '#2a0610', .42), lt = mixc(base, '#ffffff', .22), mid = base;
  const pts = hatSpine(G, h, t, seed, hy), E = coneEdges(pts, G), N = pts.length - 1, tip = pts[N];
  c.save(); c.translate(0, G.yb); c.rotate(h.hatTilt || 0); c.translate(0, -G.yb); c.lineJoin = 'round'; c.lineCap = 'round';
  const cone = (i0, stroke) => {
    c.beginPath(); for (let i = i0; i <= N; i++) i === i0 ? c.moveTo(E.L[i][0], E.L[i][1]) : c.lineTo(E.L[i][0], E.L[i][1]);
    for (let i = N; i >= i0; i--) c.lineTo(E.R[i][0], E.R[i][1]); c.closePath();
    c.fillStyle = lg(c, -G.wd, 0, G.wd, 0, lightL ? [[0, lt], [.42, mid], [1, dk]] : [[0, dk], [.58, mid], [1, lt]]); c.fill();
    c.save(); c.clip();
    const bx = pts[Math.round(N * .45)];   /* velvet: a soft sheen at the bend, a crease along the inside of the fold */
    c.fillStyle = rg(c, bx[0] - keyX() * G.wd * .35, bx[1], 2, G.wd * .9, [[0, 'rgba(255,235,235,.34)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(-G.wb * 3, G.yTop - G.coneH * 2, G.wb * 6, G.coneH * 3);
    c.strokeStyle = 'rgba(70,0,12,.32)'; c.lineWidth = 5; c.beginPath();
    const sd = h.hatSide < 0 ? -1 : 1;
    for (let i = Math.round(N * .3); i <= Math.round(N * .85); i++) { const p = pts[i], q = E.L[i], r = E.R[i], u = sd > 0 ? .35 : .65, x = lerp(q[0], r[0], u), y = lerp(q[1], r[1], u); i === Math.round(N * .3) ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke(); c.restore();
    if (stroke) { c.strokeStyle = OUT; c.lineWidth = 4.4; c.beginPath(); for (let i = i0; i <= N; i++) i === i0 ? c.moveTo(E.L[i][0], E.L[i][1]) : c.lineTo(E.L[i][0], E.L[i][1]); for (let i = N; i >= i0; i--) c.lineTo(E.R[i][0], E.R[i][1]); c.stroke(); }
  };
  if (o.kind === 'onion') sproutTuft(c, tip[0], tip[1], t, seed);
  cone(0, true);
  /* the fur band (it hides the base of the cone) */
  const top = [], bot = [], M = 12;
  for (let i = 0; i <= M; i++) { const x = lerp(-G.wb, G.wb, i / M), yb = bandB(G, x); bot.push([x, yb]); top.push([x * .97, yb - G.bh]); }
  furBand(c, top, bot, { fill: h.bandColor, seed: seed + 11, r: G.bh * .3 });
  /* the hanging tail over the band, where it falls beside it */
  if (h.hatFlop > .55 && tip[1] > G.yTop - 10) cone(Math.round(N * .62), true);
  fluff(c, tip[0], tip[1], clamp(G.wb * .19, 11, 20), h.pomColor, 'rgba(120,140,190,.5)', 11, seed + 3);
  c.restore();
  return { G, tip, top: Math.min(...pts.map(p => p[1])) - G.wd * .2 };
}
/* Onion's sprout comes out through the pom: three short green blades (drawn first: the pom covers their base) */
function sproutTuft(c, x, y, t, seed) {
  c.save(); c.lineCap = 'round';
  const bl = [[-.5, 44, -1.1], [.15, 56, .9], [.7, 36, 1.5]];
  for (const [a0, len, turn] of bl) {
    const P = []; let px = x, py = y, a = a0 + dsin(t * 2 + seed + a0) * .05;
    for (let i = 0; i <= 8; i++) { P.push([px, py]); a += turn * .09; px += dsin(a) * len / 8; py -= dcos(a) * len / 8; }
    c.strokeStyle = 'rgba(24,70,16,.92)'; c.lineWidth = 11; c.beginPath(); P.forEach(([u, v], i) => i ? c.lineTo(u, v) : c.moveTo(u, v)); c.stroke();
    c.strokeStyle = '#6fbf45'; c.lineWidth = 6.5; c.stroke();
    c.strokeStyle = 'rgba(220,255,170,.55)'; c.lineWidth = 2; c.stroke();
  }
  c.restore();
}
EXT.acc.fp22_santahat = (o, k, t, layer) => { if (layer !== 'mid' || !o.h22) return; hatDraw22(ctx, o, k, t, 0); };

A.santaHat = function (o, g) {
  o = o || {}; g = Object.assign({}, g || {}); for (const key in g) if (g[key] === undefined) delete g[key];
  const own = {}; for (const key in HAT_DEF) if (o[key] !== undefined) own[key] = o[key];
  const h = Object.assign({}, HAT_DEF, HAT_WHO[o.who] || HAT_WHO[o.kind] || {}, own, g);
  if (g.hatColor === undefined && own.hatColor === undefined && o.who === 'egg') h.hatColor = A.ELF;
  o.h22 = h;
  o.acc = (o.acc || []).filter(a => !hatClashes(a)).concat(['fp22_santahat']);
  if (o.kind === 'straw') o.cap = false;
  const k = KINDS[o.kind];
  if (k) {   /* the audit's head box has to include the cone and the pom */
    const G = hatGeo22(o, k, h), f = clamp(h.hatFlop), rise = G.coneH * (1 + .3 * f) * (f < .45 ? 1 : lerp(.95, .62, clamp((f - .45) / .55)));
    const need = -(G.yTop + 7 - rise) + 22, have = (TOPS[o.kind] ?? k.ry * 1.05) - (o.kind === 'straw' ? 20 : 0);
    o.topExtra = Math.max(o.topExtra || 0, Math.max(0, need - have));
  }
  return o;
};
// ================================================================== SANTA: the Administrator (Melon) in the suit
Object.assign(EXPR, {
  santa_jolly: { ang: -.2, raise: 12, curve: 1, lid: .12, wide: 1.04, pup: 1.05 },  /* "Ho ho ho!": bright eyes, brows up, a big smile */
  santa_stuck: { ang: -.44, raise: 14, curve: -.22, lid: .06, wide: 1.1, pup: .82 }, /* sunk in the low chair: eyebrows up, a worried little mouth */
});
const SRED = '#cf2027', SRED_D = '#8a0d15', SRED_L = '#f04a48', SFUR = '#fbf7ef', SEAT = 70;
const bottomY = (k, x) => k.ry * Math.sqrt(Math.max(0, 1 - (x / k.rx) * (x / k.rx)));
/* the coat (wrap: the body yaw): red below a neckline hidden by the beard, a white fur hem along the bottom of the body, a fur strip down the front, a black belt with a gold buckle */
function coatDraw(c, o, k, t, yw) {
  const p = PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)), rx = k.rx, ry = k.ry, kx = keyX(), cy = dcos(yw), sy = dsin(yw);
  c.save(); c.clip(p); c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-rx * 1.3, k.mouthY - 34); c.quadraticCurveTo(0, k.mouthY + 70, rx * 1.3, k.mouthY - 34); c.lineTo(rx * 1.3, ry * 1.4); c.lineTo(-rx * 1.3, ry * 1.4); c.closePath();
  c.fillStyle = rg(c, kx * rx * .45, ry * .25, rx * .08, rx * 1.3, [[0, SRED_L], [.5, SRED], [1, SRED_D]]); c.fill();
  c.strokeStyle = 'rgba(90,0,10,.22)'; c.lineWidth = 3;   /* two soft folds under the arms */
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * rx * .78, k.mouthY + 10); c.quadraticCurveTo(sd * rx * .7, ry * .45, sd * rx * .74, ry * .7); c.stroke(); }
  /* the front strip: white fur from under the beard to the hem; it travels round with the body and hides behind it */
  const yB = ry * .6, bw = 18, wB = halfW(o.kind, yB + 6) || rx * .8;
  if (cy > .04) {
    c.save(); c.globalAlpha *= sm(.04, .3, cy);
    const l = [], r = [];
    for (let i = 0; i <= 7; i++) { const y = lerp(ry * .4, ry * 1.02, i / 7), w = halfW(o.kind, Math.min(y, ry * .95)) || rx * .5, xc = w * sy * .97, hw = (13 * cy + 3); l.push([xc - hw, y]); r.push([xc + hw, y]); }
    furBand(c, l, r, { fill: SFUR, seed: 41, r: 7, lw: 2 });
    c.restore();
  }
  /* the belt: a latitude band round the round body (it sags a little toward us) */
  const beltY = x => yB + 7 * Math.sqrt(Math.max(0, 1 - (x / wB) * (x / wB)));
  c.beginPath(); for (let i = 0; i <= 16; i++) { const x = lerp(-wB - 4, wB + 4, i / 16); i ? c.lineTo(x, beltY(x)) : c.moveTo(x, beltY(x)); } for (let i = 16; i >= 0; i--) { const x = lerp(-wB - 4, wB + 4, i / 16); c.lineTo(x, beltY(x) + bw); } c.closePath();
  c.fillStyle = lg(c, 0, yB, 0, yB + bw + 8, [[0, '#3a3540'], [.4, '#1b1920'], [1, '#0c0b10']]); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 16; i++) { const x = lerp(-wB, wB, i / 16); i ? c.lineTo(x, beltY(x) + 3) : c.moveTo(x, beltY(x) + 3); } c.stroke();
  /* the hem: a fur band hugging the bottom of the body */
  const top = [], bot = [];
  for (let i = 0; i <= 14; i++) { const x = lerp(-rx * .97, rx * .97, i / 14), yb = bottomY(k, x); top.push([x * .985, yb - 17]); bot.push([x * 1.02, yb + 8]); }
  furBand(c, top, bot, { fill: SFUR, seed: 43, r: 8, lw: 2.2 });
  c.restore();
  /* the buckle (front only) */
  if (cy > .1) {
    const bx = wB * sy * .98, by = beltY(bx) + bw / 2, w2 = 21 * cy + 2, h2 = 16;
    c.save(); c.globalAlpha *= sm(.1, .35, cy); c.translate(bx, by);
    c.fillStyle = OUT; c.beginPath(); c.roundRect(-w2 - 2.5, -h2 - 2.5, w2 * 2 + 5, h2 * 2 + 5, 6); c.fill();
    c.fillStyle = lg(c, -w2, -h2, w2, h2, [[0, '#fff1a8'], [.35, '#f2c94c'], [.75, '#c4911c'], [1, '#86600e']]); c.beginPath(); c.roundRect(-w2, -h2, w2 * 2, h2 * 2, 5); c.fill();
    c.fillStyle = '#17151b'; c.beginPath(); c.roundRect(-w2 * .55, -h2 * .5, w2 * 1.1, h2, 3); c.fill();
    c.fillStyle = '#e7b93c'; c.fillRect(-w2 * .62, -2.2, w2 * .75, 4.4);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-w2 * .55, -h2 * .62, w2 * .22, 2.4, -.2, 0, TAU); c.fill();
    c.restore();
  }
  c.lineWidth = 5; c.strokeStyle = OUT; c.stroke(p);   /* re-ink the silhouette over the coat */
}
EXT.acc.fp22_santacoat = (o, k, t, layer) => { if (layer === 'mid' && o.s22) coatDraw(ctx, o, k, t, 0); };

/* the beard: curls in FRONT coordinates (sideburns, the lower beard round the mouth, a curly moustache), each carried round the sphere with the face (sphere-mapped), so it holds at every head yaw.
   Drawn UNDER the face (mid layer): the eyes, the rosy cheeks and the moving mouth read on top of it; nothing reaches the eyes; the sideburns stay outside the face box. */
const BEARD = {};
function beardCurls(o, k) {
  const key = o.kind; if (BEARD[key]) return BEARD[key];
  const rx = k.rx, ry = k.ry, my = k.mouthY, ex = k.eyeX, er = k.er, L = [];
  const yBand = k.eyeY - er * 1.42 - 21;
  const bw = rx * .74, topY = x => { const a = Math.abs(x); return a < bw * .6 ? my + 8 : lerp(my + 8, my - 14, sm(bw * .6, bw, a)); };
  const botY = x => my + 12 + (ry * .47 - my - 12) * (1 - (x / bw) * (x / bw));   /* a rounded bib under the mouth: the red coat shows at the sides and below it */
  let n = 0;
  for (let y = my + 2; y < ry * .52; y += 14) for (let x = -bw; x <= bw; x += 16) {
    const jx = (rnd(7, n) - .5) * 6, jy = (rnd(8, n) - .5) * 5, X = x + (Math.round((y - my) / 14) % 2 ? 8 : 0) + jx, Y = y + jy; n++;
    if (Y < topY(X) - 2 || Y > botY(X) || Math.abs(X) > bw) continue;
    L.push([X, Y, 11 + rnd(9, n) * 3.5]);
  }
  for (const sd of [-1, 1]) for (let j = 0; j < 6; j++) {   /* sideburns: one column up the sides to the hat band, outside the face box */
    const y = lerp(my - 8, yBand + 10, j / 5), w = halfW(key, y) || rx * .7;
    L.push([sd * (w - 11), y, 10.5 + rnd(sd + 5, j) * 2.5]);
  }
  for (const sd of [-1, 1]) for (const [x, y, r] of [[9, -5, 10], [22, -5, 11.5], [36, -2, 10.5], [49, 2, 8.5], [58, -4, 6.5], [62, -12, 5]]) L.push([sd * x * (k.mw || 26) / 26, my + y, r]);   /* the moustache: two curly lobes above the mouth */
  for (let i = 0; i < 9; i++) { const x = lerp(-bw * .78, bw * .78, i / 8); L.push([x, botY(x) + 2 + rnd(12, i) * 4, 9.5 + rnd(13, i) * 3]); }   /* the curly bottom edge */
  return (BEARD[key] = L);
}
function beardDraw(c, o, k, t, hy) {
  const fa = V2C.faceAng ? V2C.faceAng(hy) : hy, curls = beardCurls(o, k), P = [];
  for (const [x, y, r] of curls) {
    const R = (halfW(o.kind, y) || k.rx * .6) + 3, L0 = Math.asin(clamp(x / R, -1, 1)), a = L0 + fa, z = dcos(a);
    if (z < -.2) continue;
    P.push([R * dsin(a), y, r * (.78 + .22 * Math.max(0, z)), z]);
  }
  if (!P.length) return;
  c.save();
  c.fillStyle = OUT; c.beginPath(); for (const [x, y, r] of P) { c.moveTo(x + r + 2.3, y); c.arc(x, y, r + 2.3, 0, TAU); } c.fill();
  c.fillStyle = lg(c, 0, k.eyeY, 0, k.ry * .7, [[0, '#ffffff'], [.45, SFUR], [1, '#c9cfe0']]); c.beginPath(); for (const [x, y, r] of P) { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fill();
  c.strokeStyle = 'rgba(140,146,176,.55)'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath();   /* the curls */
  P.forEach(([x, y, r, z], i) => { if (z < .15 || i % 2) return; const a0 = rnd(17, i) * TAU; c.moveTo(x + 1 + dcos(a0) * r * .5, y + 1 + dsin(a0) * r * .5); c.arc(x + 1, y + 1, r * .5, a0, a0 + 3.6); });
  c.stroke(); c.restore();
}
EXT.acc.fp22_beard = (o, k, t, layer) => { if (layer === 'mid' && o.s22 && o.s22.beard) beardDraw(ctx, o, k, t, 0); };

/* the legs of the seated and hoyer poses (front layer: the knees come up in front of the belly). Red trousers, black boots with white fur tops */
function bootDraw(c, x, y, side, ang) {
  c.save(); c.translate(x, y); c.rotate(ang); c.lineJoin = 'round';
  c.fillStyle = lg(c, 0, -16, 0, 14, [[0, '#3b3640'], [1, '#121015']]); c.strokeStyle = OUT; c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(-14, -18); c.lineTo(14, -18); c.lineTo(15, -2); c.quadraticCurveTo(side * 34 + 4, 0, side * 32, 9); c.quadraticCurveTo(side * 10, 15, -side * 15, 11); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(side * 12, -2, 9, 3, 0, 0, TAU); c.fill();
  c.restore();
  furBand(c, [[x - 17, y - 26], [x, y - 28], [x + 17, y - 26]], [[x - 17, y - 14], [x, y - 13], [x + 17, y - 14]], { fill: SFUR, seed: 50 + side, r: 5.5, lw: 2 });
}
function santaLegs(c, o, k, t) {
  const pose = o.s22.pose, ry = k.ry, seated = pose === 'seated';
  const knee = seated ? ry * .78 : ry * .5, ank = seated ? SEAT + ry - 26 : ry * 1.12, sw = seated ? 0 : dsin(t * 1.7 + 1) * 3;
  for (const sd of [-1, 1]) {
    const kx = sd * k.rx * .36, ax = sd * (k.rx * .42) + sw * sd;
    c.save(); c.lineCap = 'round';
    c.strokeStyle = OUT; c.lineWidth = 27; c.beginPath(); c.moveTo(kx, knee); c.lineTo(ax, ank); c.stroke();
    c.strokeStyle = lg(c, kx - 14, 0, kx + 14, 0, [[0, SRED_L], [.5, SRED], [1, SRED_D]]); c.lineWidth = 21.5; c.beginPath(); c.moveTo(kx, knee); c.lineTo(ax, ank); c.stroke();
    c.fillStyle = OUT; c.beginPath(); c.arc(kx, knee, 25.5, 0, TAU); c.fill();
    c.fillStyle = rg(c, kx - keyX() * -8, knee - 8, 3, 26, [[0, SRED_L], [.6, SRED], [1, SRED_D]]); c.beginPath(); c.arc(kx, knee, 23, 0, TAU); c.fill();
    c.restore();
    bootDraw(c, ax, ank + 14, sd, seated ? 0 : sd * .25);
  }
}
EXT.acc.fp22_santalegs = (o, k, t, layer) => { if (layer === 'front' && o.s22 && (o.s22.pose === 'seated' || o.s22.pose === 'hoyer')) santaLegs(ctx, o, k, t); };

/* the sack: burlap, gathered at the neck with a gold cord; held (fp22_sack, hangs from the hand) or slung over the shoulder (fp22_sackback, behind the body) */
function sackShape(c, w, h, seed, open) {
  c.beginPath(); c.moveTo(-w * .18, 0);
  c.bezierCurveTo(-w * .2, h * .12, -w * .62, h * .2, -w * .5, h * .55); c.bezierCurveTo(-w * .44, h * .92, -w * .2, h, 0, h);
  c.bezierCurveTo(w * .22, h, w * .5, h * .9, w * .52, h * .55); c.bezierCurveTo(w * .62, h * .22, w * .2, h * .12, w * .18, 0); c.closePath();
}
function sackDraw(c, w, h, seed, t, open) {
  c.save(); c.lineJoin = 'round';
  if (open) for (const [x, y, col, a] of [[-w * .12, -10, '#2e8b57', -.3], [w * .14, -16, '#d62839', .25], [0, -24, '#f2c94c', 0]]) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.roundRect(-16, -16, 32, 30, 3); c.fill(); c.stroke(); c.fillStyle = '#fff4c9'; c.fillRect(-3, -16, 6, 30); c.restore(); }
  sackShape(c, w, h, seed, open);
  c.fillStyle = lg(c, -w * .5, 0, w * .5, 0, [[0, '#b07a3c'], [.45, '#94602b'], [1, '#5e3a17']]); c.fill();
  c.save(); c.clip(); c.strokeStyle = 'rgba(60,34,10,.28)'; c.lineWidth = 1.6;   /* the weave and two lumps where the gifts push out */
  for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(i * 9, 0); c.lineTo(i * 9 + 6, h); c.stroke(); }
  c.fillStyle = 'rgba(255,230,190,.16)'; c.beginPath(); c.ellipse(-w * .2, h * .5, w * .16, h * .18, -.3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(w * .18, h * .72, w * .15, h * .14, .2, 0, TAU); c.fill();
  c.restore();
  c.strokeStyle = OUT; c.lineWidth = 4; sackShape(c, w, h, seed, open); c.stroke();
  c.fillStyle = '#8a5a26'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 2, w * .2, 8, 0, 0, TAU); c.fill(); c.stroke();   /* the gathered neck and the cord */
  c.strokeStyle = '#e6b23a'; c.lineWidth = 4.5; c.beginPath(); c.moveTo(-w * .2, 8); c.quadraticCurveTo(0, 14, w * .2, 8); c.stroke();
  c.beginPath(); c.moveTo(w * .1, 11); c.quadraticCurveTo(w * .16 + dsin(t * 2.2 + seed) * 2, 30, w * .12, 42); c.stroke();
  c.restore();
}
EXT.prop.fp22_sack = (side, o, t) => { ctx.save(); ctx.translate(0, -6); sackDraw(ctx, 128, 122, 3, t, false); ctx.restore(); };
PROP_BOX.fp22_sack = [-66, -12, 66, 118];
EXT.acc.fp22_sackback = (o, k, t, layer) => { if (layer !== 'back') return; ctx.save(); ctx.translate(k.rx * .8, -k.ry * .3); ctx.rotate(-2.45); sackDraw(ctx, 175, 205, 5, t, false); ctx.restore(); };

/* red sleeves and trousers, white fur cuffs: the engine draws limbs in LIMB, shoulder caps and wrist cuffs in fixed greys; while a Santa is drawn those exact colour strings are swapped (ONE wrapper of the global drawChar) */
const SWAP = (() => {
  const m = {}, put = (a, b) => { m[a] = b; };
  put(LIMB, SRED); put('#3a3342', '#8e1219'); put('#4a4258', SFUR);
  for (let i = 0; i <= 8; i++) {
    put(V2.rgba(V2.mix(LIMB, '#000000', .32 * i / 8), 1), V2.rgba(V2.mix(SRED, '#2a0006', .5 * i / 8), 1));
    put(V2.rgba(V2.mix('#3a3342', '#27222f', i / 8), 1), V2.rgba(V2.mix('#8e1219', '#5c0a10', i / 8), 1));
    put(V2.rgba(V2.mix('#4a4258', '#2e2a38', i / 8), 1), V2.rgba(V2.mix(SFUR, '#c9c3d2', i / 8), 1));
  }
  return m;
})();
const DESC = new Map();
function styleDesc(c, name) { const pr = Object.getPrototypeOf(c); const key = pr; let d = DESC.get(key); if (!d) { d = {}; DESC.set(key, d); } if (!d[name]) { let p = pr; while (p && !Object.getOwnPropertyDescriptor(p, name)) p = Object.getPrototypeOf(p); d[name] = p && Object.getOwnPropertyDescriptor(p, name); } return d[name]; }
function withSwap(c, fn) {
  const fs = styleDesc(c, 'fillStyle'), ss = styleDesc(c, 'strokeStyle');
  if (!fs || !ss) return fn();
  const def = (name, d) => Object.defineProperty(c, name, { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, (typeof v === 'string' && SWAP[v]) || v); } });
  def('fillStyle', fs); def('strokeStyle', ss);
  try { return fn(); } finally { delete c.fillStyle; delete c.strokeStyle; }
}
if (!window.__A22_DC && typeof window.drawChar === 'function') {
  window.__A22_DC = true;
  const dc0 = window.drawChar;
  window.drawChar = function (o) {
    if (!o || (!o.s22 && !(o.h22 && o.kind === 'onion'))) return dc0.apply(this, arguments);
    const args = arguments, self = this;
    if (!o.s22) {   /* Onion in a Santa hat: her own sprout is hidden (it comes out of the pom instead); her root hairs stay */
      const top0 = EXT.top.onion; if (!top0) return dc0.apply(self, args);
      EXT.top.onion = (a, b, c2, layer) => { if (layer === 'back') top0(a, b, c2, layer); };
      try { return dc0.apply(self, args); } finally { EXT.top.onion = top0; }
    }
    const k = KINDS[o.kind], pose = o.s22.pose, keep = { noLegs: o.noLegs, lift: o.lift, center: o.center }, sh = k && [k.shoe, k.shoe2];
    if (pose === 'seated') { o.noLegs = true; o.lift = (o.lift || 0) + (SEAT + k.ry * .1) * (o.s || 1); }
    else if (pose === 'hoyer') { o.noLegs = true; o.center = true; }
    if (k) { k.shoe = '#17151b'; k.shoe2 = '#3a3540'; }
    try { return withSwap(ctx, () => dc0.apply(self, args)); }
    finally { if (pose === 'seated' || pose === 'hoyer') { o.noLegs = keep.noLegs; o.lift = keep.lift; o.center = keep.center; } if (k) { k.shoe = sh[0]; k.shoe2 = sh[1]; } }
  };
}

A.santa = function (o) {
  o = o || {};
  const base = (window.A9 && A9.melon) ? A9.melon({}) : { kind: 'melon', id: 'melon', who: 'melon', s: 1.22, y: 1316 };
  const pose = o.pose === 'seated' || o.pose === 'hoyer' ? o.pose : 'stand';
  const r = Object.assign(base, { expr: 'santa_jolly' }, o, { kind: 'melon', who: o.who || 'melon' });
  const acc = (o.acc ? o.acc.slice() : []).filter(a => a !== 'suit' && a !== 'nametag9' && a !== 'nametag');
  r.s22 = { pose, sack: o.sack || false, beard: o.beard !== false };
  if (o.sack === 'shoulder') acc.push('fp22_sackback');
  acc.push('fp22_santacoat'); if (r.s22.beard) acc.push('fp22_beard'); if (pose !== 'stand') acc.push('fp22_santalegs');
  r.acc = acc; delete r.tag;
  if (o.hat !== false) A.santaHat(r, Object.assign({ hatSide: 1, hatFlop: .72 }, typeof o.hat === 'object' ? o.hat : {}));
  if (o.sack === 'hand' && !(o.hold && o.hold.r)) { r.hold = Object.assign({}, o.hold, { r: 'fp22_sack' }); r.arms = Object.assign({ l: 'rest', r: 'down' }, o.arms); }
  if (o.sack === 'shoulder' && !(o.grip && o.grip.r)) { r.grip = Object.assign({}, o.grip, { r: [KINDS.melon.rx * .78, -KINDS.melon.ry * .36] }); r.hand = Object.assign({ r: 'grip' }, o.hand); }
  if (pose === 'hoyer') { r.arms = Object.assign({ l: [2.42, .42], r: [2.42, .42] }, o.arms); r.hand = Object.assign({ l: 'grip', r: 'grip' }, o.hand); }
  return r;
};
/* a screen point -> Santa's local units (for grip targets: the hands on the Hoyer straps, on the chair arms). Needs the merged x, y, s and pose */
A.santaGrip = function (o, pt) {
  const k = KINDS.melon, s = o.s || 1, pose = o.s22 ? o.s22.pose : 'stand';
  const cy = pose === 'hoyer' ? o.y : pose === 'seated' ? o.y - (SEAT + k.ry) * s - (o.lift || 0) : o.y - (k.leg + k.ry * .9) * s - (o.lift || 0);
  return [(pt[0] - o.x) / s * (o.flip ? -1 : 1), (pt[1] - cy) / s];
};
/* the low armchair of the "I can't get up." beat: back and seat behind him, the arms in front of him. x, y = the floor under his boots (as A22.santa seated) */
A.lowChair = function (c, o) {
  const s = o.s || 1, part = o.part || 'all', col = o.color || '#5f806c', dk = mixc(col, '#14201a', .45), ltc = mixc(col, '#ffffff', .2);
  c.save(); c.translate(o.x, o.y); c.scale(s, s); c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 4.5;
  if (part !== 'front') {
    for (const sd of [-1, 1]) { c.fillStyle = '#5a3b22'; c.beginPath(); c.roundRect(sd * 150 - 9, -18, 18, 18, 4); c.fill(); c.stroke(); }
    c.fillStyle = lg(c, 0, -360, 0, -60, [[0, ltc], [1, dk]]); c.beginPath(); c.moveTo(-178, -60); c.lineTo(-178, -300); c.quadraticCurveTo(-176, -372, -100, -376); c.lineTo(100, -376); c.quadraticCurveTo(176, -372, 178, -300); c.lineTo(178, -60); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; for (const x of [-60, 60]) { c.beginPath(); c.moveTo(x, -350); c.lineTo(x * 1.1, -90); c.stroke(); }
    c.strokeStyle = OUT; c.lineWidth = 4.5; c.fillStyle = lg(c, 0, -96, 0, -16, [[0, ltc], [1, dk]]); c.beginPath(); c.roundRect(-176, -96, 352, 80, 22); c.fill(); c.stroke();
  }
  if (part !== 'back') for (const sd of [-1, 1]) {
    c.fillStyle = lg(c, sd * 150, 0, sd * 192, 0, sd < 0 ? [[0, ltc], [1, dk]] : [[0, col], [1, dk]]); c.beginPath(); c.roundRect(sd > 0 ? 146 : -192, -186, 46, 172, 20); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(sd * 169, -172, 16, 6, 0, 0, TAU); c.fill();
  }
  c.restore();
  return [o.x - 194 * s, o.y - 378 * s, o.x + 194 * s, o.y];
};
// ================================================================== wrapping paper: one print drawn in rest space (0..w x 0..h) on the context it is GIVEN, shared by A22.gift and SOFT2D.drawCloth
A.GIFT_COLORS = { red: ['#c62828', '#f4e9d8'], green: ['#2e7d4f', '#f6edd9'], blue: ['#2f5fae', '#e8f0ff'], gold: ['#d9a92e', '#fff3cf'], purple: ['#6a3fb0', '#f3e8ff'], white: ['#f5f1e8', '#c62828'], candy: ['#f7f2ea', '#d62839'] };
A.paperBack = '#f7f3ea';
function printPaper(c, kind, col, col2, w, h) {
  c.fillStyle = col; c.fillRect(0, 0, w, h);
  c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
  if (kind === 'stripes') {
    c.fillStyle = col2; const P = 46, S = 15;
    for (let x = -h; x < w + h; x += P) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + S, 0); c.lineTo(x + S - h, h); c.lineTo(x - h, h); c.closePath(); c.fill(); }
    c.fillStyle = mixa(col2, col, .5, .55); for (let x = -h + S + 6; x < w + h; x += P) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 3.5, 0); c.lineTo(x + 3.5 - h, h); c.lineTo(x - h, h); c.closePath(); c.fill(); }
  } else if (kind === 'dots') {
    c.fillStyle = col2; let r = 0;
    for (let y = 10; y < h + 20; y += 30, r++) for (let x = (r % 2) * 17 + 8; x < w + 20; x += 34) { c.beginPath(); c.arc(x, y, 7.5, 0, TAU); c.fill(); }
  } else if (kind === 'trees') {
    let r = 0;
    for (let y = 8; y < h + 60; y += 66, r++) for (let x = (r % 2) * 33 + 14; x < w + 40; x += 66) {
      c.fillStyle = col2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 15, y + 22); c.lineTo(x + 8, y + 22); c.lineTo(x + 19, y + 38); c.lineTo(x - 19, y + 38); c.lineTo(x - 8, y + 22); c.lineTo(x - 15, y + 22); c.closePath(); c.fill();
      c.fillStyle = mixc(col2, '#000000', .3); c.fillRect(x - 3, y + 38, 6, 7);
      c.fillStyle = '#f6d65a'; c.beginPath(); c.arc(x, y - 1, 3.2, 0, TAU); c.fill();
      c.fillStyle = mixa(col2, col, .3, .7); c.beginPath(); c.arc(x + 33, y + 34, 2.4, 0, TAU); c.fill();
    }
  } else if (kind === 'candy') {
    let r = 0; c.lineCap = 'round';
    for (let y = 6; y < h + 60; y += 62, r++) for (let x = (r % 2) * 31 + 12; x < w + 40; x += 62) {
      const cane = () => { c.beginPath(); c.moveTo(x + 10, y + 46); c.lineTo(x + 10, y + 14); c.arc(x + 2, y + 14, 8, 0, PI, true); };
      const lum = q => { const v = V2.mix(q, q, 0); return v[0] * .3 + v[1] * .59 + v[2] * .11; }, stripe = lum(col2) < 150 ? col2 : lum(col) < 150 && Math.abs(V2.mix(col, col, 0)[0] - 200) < 60 ? '#2e8b57' : '#d62839';
      c.strokeStyle = 'rgba(40,10,20,.45)'; c.lineWidth = 10; cane(); c.stroke();
      c.strokeStyle = '#fbf7ef'; c.lineWidth = 7.5; cane(); c.stroke();
      c.save(); cane(); c.lineWidth = 7.5; c.strokeStyle = stripe; c.setLineDash([4.5, 5.5]); c.stroke(); c.restore();
    }
  }
  c.fillStyle = lg(c, 0, 0, w, h, [[0, 'rgba(255,255,255,.12)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.08)']]); c.fillRect(0, 0, w, h);
  c.restore();
}
const PRINTS = new Map();
function printSprite(kind, col, col2, w, h) {
  const res = clamp(1600 / Math.max(w, h), .5, 2), key = kind + '|' + col + '|' + col2 + '|' + Math.round(w) + '|' + Math.round(h) + '|' + res;
  let cv = PRINTS.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * res)); cv.height = Math.max(1, Math.ceil(h * res));
    const g = cv.getContext('2d'); g.scale(res, res); printPaper(g, kind, col, col2, w, h);
    if (PRINTS.size > 60) PRINTS.clear();
    PRINTS.set(key, cv);
  }
  return cv;
}
A.paperPrint = function (kind, color, color2) {
  const k2 = kind || 'stripes', pal = A.GIFT_COLORS[k2 === 'candy' ? 'candy' : 'red'], c1 = color || pal[0], c2 = color2 || pal[1];
  return (c, w, h) => { c.drawImage(printSprite(k2, c1, c2, w, h), 0, 0, w, h); };
};

/* a stick-on bow: loops round a knot (the gift's own and A22.bow) */
function bowDraw(c, x, y, r, col, t, seed, tilt) {
  const dk = mixc(col, '#1a0008', .38), ltc = mixc(col, '#ffffff', .35);
  c.save(); c.translate(x, y); c.rotate(tilt || 0); c.lineJoin = 'round';
  const loops = [[-2.55, 1], [-.6, 1], [-1.57, .82], [-2.1, .9], [-1.05, .9], [-2.95, .72], [-.2, .72]];
  for (let i = 0; i < loops.length; i++) {
    const [a, L] = loops[i], len = r * L, wid = r * .42, sw = dsin(t * 1.3 + seed + i) * .02;
    c.save(); c.rotate(a + PI / 2 + sw);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-wid, -len * .35, -wid * .9, -len, 0, -len); c.bezierCurveTo(wid * .9, -len, wid, -len * .35, 0, 0);
    c.fillStyle = lg(c, -wid, 0, wid, 0, [[0, dk], [.45, col], [.7, ltc], [1, col]]); c.fill(); c.strokeStyle = OUT; c.lineWidth = Math.max(2.4, r * .05); c.stroke();
    c.strokeStyle = 'rgba(60,0,10,.35)'; c.lineWidth = Math.max(1.5, r * .03); c.beginPath(); c.moveTo(0, -len * .1); c.quadraticCurveTo(-wid * .15, -len * .6, 0, -len * .9); c.stroke();
    c.restore();
  }
  c.fillStyle = OUT; c.beginPath(); c.arc(0, 0, r * .25 + 2.4, 0, TAU); c.fill();
  c.fillStyle = rg(c, -r * .08, -r * .08, 1, r * .26, [[0, ltc], [1, col]]); c.beginPath(); c.arc(0, 0, r * .25, 0, TAU); c.fill();
  c.restore();
}
A.bow = function (c, o) {
  const s = o.s || 1, r = (o.r || 60) * s;
  bowDraw(c, o.x, o.y, r, o.color || '#d62839', tOf(o), o.seed || 1, o.rot || 0);
  return [o.x - r * 1.05, o.y - r * 1.05, o.x + r * 1.05, o.y + r * .8];
};

// ================================================================== A22.gift: a wrapped box (front face + the top face in a slight top-down view)
function giftGeo(o) {
  const s = o.s || 1, w = o.w || 180, h = o.h || 140, d = o.d != null ? o.d : w * .3, op = clamp(o.open || 0);
  const lidH = h * .2, lift = sm(0, 1, op) * h * 1.05, tip = -sm(.15, 1, op) * .55;
  return { s, w, h, d, dd: d * .5, op, lidH, lift, tip, bowR: o.bowR || w * .27 };
}
A.giftInfo = function (o) {
  const G = giftGeo(o), s = G.s, rot = o.rot || 0, cr = dcos(rot), sr = dsin(rot);
  const P = (x, y) => [o.x + (x * cr - y * sr) * s, o.y + (x * sr + y * cr) * s];
  const bowL = [0, -G.h - G.dd * .5 - G.lift - G.bowR * .1];
  return { box: [o.x - (G.w / 2 + 8) * s, o.y - (G.h + G.dd + G.lift + G.bowR * 1.1) * s, o.x + (G.w / 2 + 8) * s, o.y + 4 * s], bow: P(bowL[0], bowL[1]), lid: P(0, -G.h - G.lift), tag: P(-G.w * .36, -G.h * .55) };
};
A.gift = function (c, o) {
  const G = giftGeo(o), t = tOf(o), seed = o.seed || 1, kind = o.paper || 'stripes';
  const pal = A.GIFT_COLORS[kind === 'candy' ? 'candy' : 'red'], col = o.color || pal[0], col2 = o.color2 || pal[1];
  const rib = o.ribbonColor || '#e8b93a', ribD = mixc(rib, '#3a2400', .35), rw = G.w * .12, lightL = keyX() < 0;
  const { w, h, dd, lidH } = G, hw = w / 2, bw = hw * .86;
  c.save(); c.translate(o.x, o.y); c.rotate(o.rot || 0); c.scale(G.s, G.s); c.lineJoin = 'round';
  c.fillStyle = 'rgba(20,10,30,.25)'; c.beginPath(); c.ellipse(0, 2, hw * 1.08, 10, 0, 0, TAU); c.fill();
  const face = (x0, y0, x1, y1, shade) => {   /* a printed face: the print clipped to the rect, a shading wash */
    c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip();
    c.drawImage(printSprite(kind, col, col2, w, h), x0, y0, w, h);
    c.fillStyle = lg(c, x0, 0, x1, 0, lightL ? [[0, 'rgba(255,255,255,.1)'], [1, 'rgba(10,0,20,' + (.22 + shade) + ')']] : [[0, 'rgba(10,0,20,' + (.22 + shade) + ')'], [1, 'rgba(255,255,255,.1)']]); c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.restore();
  };
  const topFace = (yT, inside) => {   /* the top face: a trapezoid narrower at the back */
    c.beginPath(); c.moveTo(-hw, yT); c.lineTo(hw, yT); c.lineTo(bw, yT - dd); c.lineTo(-bw, yT - dd); c.closePath();
    if (inside) { c.fillStyle = '#3a1e1a'; c.fill(); c.save(); c.clip(); c.fillStyle = 'rgba(255,240,220,.85)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-hw * .8 + i * hw * .4, yT - dd * .1); c.lineTo(-hw * .6 + i * hw * .4, yT - dd * .95); c.lineTo(-hw * .45 + i * hw * .4, yT - dd * .3); c.closePath(); c.fill(); } c.restore(); c.strokeStyle = OUT; c.lineWidth = 4; c.stroke(); return; }
    c.save(); c.clip(); c.save(); c.translate(0, yT - dd); c.scale(1, .5); c.drawImage(printSprite(kind, col, col2, w, h), -hw, 0, w, h * .9 * 2); c.restore();
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(-hw, yT - dd, w, dd); c.restore();
    c.strokeStyle = OUT; c.lineWidth = 4; c.beginPath(); c.moveTo(-hw, yT); c.lineTo(hw, yT); c.lineTo(bw, yT - dd); c.lineTo(-bw, yT - dd); c.closePath(); c.stroke();
  };
  const bodyTop = G.op > 0 ? -h + lidH : -h;
  face(-hw, bodyTop, hw, 0, 0);
  if (o.ribbon !== false) { c.fillStyle = lg(c, -rw / 2, 0, rw / 2, 0, [[0, ribD], [.5, rib], [1, ribD]]); c.fillRect(-rw / 2, bodyTop, rw, -bodyTop); }
  c.strokeStyle = OUT; c.lineWidth = 4; c.strokeRect(-hw, bodyTop, w, -bodyTop);
  if (G.op > 0) topFace(bodyTop, true);
  /* the lid (with the top face, the bow) lifts and tips back as it opens */
  c.save(); c.translate(0, -G.lift); c.translate(0, -h + lidH); c.rotate(G.tip * (o.tipSide || 1)); c.translate(0, h - lidH);
  if (G.op > 0) { face(-hw - 4, -h, hw + 4, -h + lidH, .05); c.strokeStyle = OUT; c.lineWidth = 4; c.strokeRect(-hw - 4, -h, w + 8, lidH); if (o.ribbon !== false) { c.fillStyle = rib; c.fillRect(-rw / 2, -h, rw, lidH); } }
  topFace(-h, false);
  if (o.ribbon !== false) {
    c.fillStyle = mixc(rib, '#ffffff', .15);
    c.beginPath(); c.moveTo(-rw / 2, -h); c.lineTo(rw / 2, -h); c.lineTo(rw * .43, -h - dd); c.lineTo(-rw * .43, -h - dd); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-hw * .93, -h - dd * .42); c.lineTo(hw * .93, -h - dd * .42); c.lineTo(hw * .92, -h - dd * .58); c.lineTo(-hw * .92, -h - dd * .58); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(80,50,0,.5)'; c.lineWidth = 1.6; c.strokeRect(-rw / 2, -h + 1, rw, 0);
  }
  if (o.bow !== false) bowDraw(c, 0, -h - dd * .5 - G.bowR * .1, G.bowR, o.bowColor || rib, t, seed, o.bowTilt || -.08);
  c.restore();
  /* the tag: a card on a string from the bow, its text drawn live through the UI kit */
  if (o.tag && window.UI) {
    const side = o.tagSide || -1, tw = w * .36, th = tw * .52, tx = side * hw * .55, ty = -h * .62 - G.lift * 0, tr = side * .1 + dsin(t * 1.4 + seed) * .02;
    c.strokeStyle = 'rgba(40,30,20,.8)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -h - dd * .5 - G.lift); c.quadraticCurveTo(tx * .6, -h * .9, tx - side * tw * .38, ty - th * .2); c.stroke();
    c.save(); c.translate(tx, ty); c.rotate(tr);
    c.fillStyle = '#fbf3df'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.moveTo(-tw / 2 + th * .3, -th / 2); c.lineTo(tw / 2, -th / 2); c.lineTo(tw / 2, th / 2); c.lineTo(-tw / 2 + th * .3, th / 2); c.lineTo(-tw / 2, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#7a5a3a'; c.beginPath(); c.arc(-tw / 2 + th * .3, 0, th * .1, 0, TAU); c.fill();
    const px = th * .34 * G.s * scrScale(c) / G.s, hero = !!o.tagHero && px >= 30;
    if (px >= 7) UI.label(String(o.tag), th * .16, 0, { size: th * .34, fill: '#8a1622', hero, maxW: tw * .74, grp: o.grp || 'fp22_tag', tilt: .3 });
    c.restore();
  }
  c.restore();
  return A.giftInfo(o).box;
};

// ================================================================== the Chux: a blue disposable underpad (quilted absorbent field, white border, plastic backed)
A.chuxBack = '#5b8fd8';
function printChux(c, w, h) {
  const b = Math.min(w, h) * .075;
  c.fillStyle = '#f5f8fc'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#7fb4ec'; c.fillRect(b, b, w - b * 2, h - b * 2);
  c.save(); c.beginPath(); c.rect(b, b, w - b * 2, h - b * 2); c.clip();
  const P = 30;
  for (let y = b - P; y < h + P; y += P) for (let x = b - P; x < w + P; x += P) {   /* each quilted diamond puffs a little: a lit top, a shaded bottom */
    c.fillStyle = rg(c, x + P * .5, y + P * .35, 1, P * .75, [[0, 'rgba(255,255,255,.28)'], [1, 'rgba(30,70,140,.16)']]); c.beginPath(); c.moveTo(x + P / 2, y); c.lineTo(x + P, y + P / 2); c.lineTo(x + P / 2, y + P); c.lineTo(x, y + P / 2); c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(40,90,170,.55)'; c.lineWidth = 1.6;
  for (let d = -h; d < w + h; d += P) { c.beginPath(); c.moveTo(d, 0); c.lineTo(d + h, h); c.stroke(); c.beginPath(); c.moveTo(d + h, 0); c.lineTo(d, h); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.7)'; for (let d = -h; d < w + h; d += P) for (let y = 0; y < h; y += 6) { const x = d + y; if ((y / 6) % 2) continue; c.fillRect(x, y, 1.3, 1.3); }
  c.restore();
  c.strokeStyle = 'rgba(150,175,205,.9)'; c.lineWidth = 1.4; c.strokeRect(b * .5, b * .5, w - b, h - b);
  c.fillStyle = lg(c, 0, 0, w, h, [[0, 'rgba(255,255,255,.22)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(0,20,60,.08)']]); c.fillRect(0, 0, w, h);
}
const CHUX = new Map();
function chuxSprite(w, h) {
  const res = clamp(1400 / Math.max(w, h), .5, 2), key = Math.round(w) + '|' + Math.round(h) + '|' + res;
  let cv = CHUX.get(key);
  if (!cv) { cv = document.createElement('canvas'); cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res); const g = cv.getContext('2d'); g.scale(res, res); printChux(g, w, h); if (CHUX.size > 30) CHUX.clear(); CHUX.set(key, cv); }
  return cv;
}
A.chuxPrint = () => (c, w, h) => { c.drawImage(chuxSprite(w, h), 0, 0, w, h); };
A.chux = function (c, o) {
  const s = o.s || 1, w = o.w || 300, h = o.h || 220, f = clamp(o.fold || 0), cr = clamp(o.crumple || 0), t = tOf(o), seed = o.seed || 2;
  c.save(); c.translate(o.x, o.y); c.rotate(o.rot || 0); c.scale(s, s); c.lineJoin = 'round';
  const yTop = -h / 2 + h * .5 * f;   /* the far edge folds over toward us: the flap shows the plastic back */
  c.fillStyle = 'rgba(10,20,40,.22)'; c.fillRect(-w / 2 + 6, yTop + 8, w, h / 2 - yTop);
  c.save(); c.beginPath(); c.rect(-w / 2, yTop, w, h / 2 - yTop); c.clip(); c.drawImage(chuxSprite(w, h), -w / 2, -h / 2, w, h); c.restore();
  if (cr > 0) { c.strokeStyle = 'rgba(20,50,110,' + (.3 * cr) + ')'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = (rnd(seed, i) - .5) * w * .8, y = yTop + (rnd(seed, i + 9)) * (h / 2 - yTop); c.beginPath(); c.moveTo(x - 30, y + 6); c.quadraticCurveTo(x, y - 8 - 6 * rnd(seed, i + 3), x + 34, y + 4); c.stroke(); } }
  c.strokeStyle = OUT; c.lineWidth = 3.6; c.strokeRect(-w / 2, yTop, w, h / 2 - yTop);
  if (f > .01) {
    const fh = h * .5 * f;
    c.fillStyle = lg(c, 0, yTop, 0, yTop + fh, [[0, mixc(A.chuxBack, '#ffffff', .25)], [1, A.chuxBack]]); c.beginPath(); c.rect(-w / 2, yTop, w, fh); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-w / 2 + 10, yTop + fh * .25, w - 20, Math.max(2, fh * .12));
    c.strokeStyle = OUT; c.lineWidth = 3.6; c.strokeRect(-w / 2, yTop, w, fh);
  }
  c.restore();
  const hw = w / 2 * s, hh = h / 2 * s, ex = Math.abs(dcos(o.rot || 0)) * hw + Math.abs(dsin(o.rot || 0)) * hh, ey = Math.abs(dsin(o.rot || 0)) * hw + Math.abs(dcos(o.rot || 0)) * hh;
  return [o.x - ex, o.y - ey, o.x + ex, o.y + ey];
};
// ================================================================== the tree: boughs, tinsel, baubles, a star (one cached sprite), the string lights live (returned for L20), a skirt
/* the twinkle of one bulb: a slow sine, 0.3 to 0.8 Hz (picked from the phase), never in sync, never below .3 (photosensitivity: small and slow) */
A.twinkle = (t, phase) => { const ph = ((phase % 1) + 1) % 1, f = .3 + .5 * ((ph * 7.31 + .17) % 1); return .65 + .35 * dsin(TAU * (f * t + ph)); };
A.LIGHT_COLORS = ['#ffd27a', '#ff4a4a', '#4cdc6a', '#57a6ff', '#ffb03a', '#fff0c8', '#ff6fd0'];
const TREE_W = .58;   /* the tree's half width at the bottom bough, as a fraction of h */
function treeTiers(h) { return [[.07, .30, .24], [.22, .48, .34], [.38, .67, .45], [.55, .86, .54], [.72, 1.0, .58]].map(([a, b, w]) => [-h + a * h * .98, -h + b * h * .98 * .92 + h * .02, w * h]); }
function drawTreeSprite(c, h, seed, op) {
  const tiers = treeTiers(h), hw = TREE_W * h;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = '#5a3a20'; c.strokeStyle = OUT; c.lineWidth = 4; c.beginPath(); c.rect(-h * .045, -h * .12, h * .09, h * .11); c.fill(); c.stroke();   /* trunk */
  for (let i = tiers.length - 1; i >= 0; i--) {   /* boughs, bottom tier first */
    const [yT, yB, w] = tiers[i], n = 7 + i * 2, P = [];
    P.push([0, yT]);
    for (let j = 0; j <= n; j++) { const u = j / n, x = lerp(w, -w, u), dip = 12 + 8 * rnd(seed + i, j); P.push([x, yB + (j % 2 ? -dip * .5 : dip * .45)]); }
    c.beginPath(); c.moveTo(0, yT);
    c.quadraticCurveTo(w * .35, lerp(yT, yB, .45), w, yB - 6);
    for (let j = 1; j <= n; j++) { const a = P[j], b = P[j + 1]; if (!b) break; c.quadraticCurveTo(a[0], a[1] + 16, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 10); }
    c.lineTo(-w, yB - 6); c.quadraticCurveTo(-w * .35, lerp(yT, yB, .45), 0, yT); c.closePath();
    c.fillStyle = lg(c, -w, 0, w, 0, [[0, '#2f8a4a'], [.45, '#21703a'], [1, '#124726']]); c.fill(); c.strokeStyle = 'rgba(8,30,14,.95)'; c.lineWidth = 4.2; c.stroke();
    c.save(); c.clip();
    c.fillStyle = lg(c, 0, yT, 0, yB, [[0, 'rgba(0,20,8,.32)'], [.3, 'rgba(0,0,0,0)'], [1, 'rgba(0,25,10,.18)']]); c.fillRect(-w, yT, w * 2, yB - yT + 20);
    for (let j = 0; j < 46 + i * 12; j++) {   /* needles: short strokes fanning down and out */
      const u = rnd(seed + 30 + i, j), v = rnd(seed + 60 + i, j), y = lerp(yT + 10, yB + 8, Math.sqrt(v)), wy = w * (y - yT) / (yB - yT), x = (u * 2 - 1) * wy, a = (x / (w + 1)) * .9;
      c.strokeStyle = v > .5 ? 'rgba(120,200,120,.35)' : 'rgba(10,50,22,.45)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dsin(a) * 14, y + dcos(a) * 12); c.stroke();
    }
    c.restore();
  }
  /* the tinsel garland: gold swags across each tier (sparkles are added live) */
  const swag = treeSwags(h, seed, .62);
  for (const S of swag) { c.strokeStyle = 'rgba(120,80,0,.55)'; c.lineWidth = 9; c.beginPath(); S.forEach(([x, y], i) => i ? c.lineTo(x, y + 1.5) : c.moveTo(x, y + 1.5)); c.stroke(); c.strokeStyle = '#e6be4c'; c.lineWidth = 6.5; c.beginPath(); S.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.strokeStyle = 'rgba(255,248,200,.75)'; c.lineWidth = 2; c.setLineDash([3, 7]); c.stroke(); c.setLineDash([]); }
  /* baubles */
  const bc = ['#d62839', '#e8b93a', '#2f6fd6', '#d8dce6', '#b4329a', '#d62839', '#e8b93a'];
  for (let i = 0; i < 15; i++) {
    const tier = tiers[1 + (i % 4)], u = rnd(seed + 90, i), y = lerp(tier[0] + (tier[1] - tier[0]) * .55, tier[1] - 8, rnd(seed + 91, i)), wy = tier[2] * (y - tier[0]) / (tier[1] - tier[0]), x = (u * 2 - 1) * wy * .78, r = h * (.022 + .01 * rnd(seed + 92, i)), col = bc[i % bc.length];
    c.strokeStyle = 'rgba(40,30,10,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y - r - 7); c.lineTo(x, y - r); c.stroke();
    c.fillStyle = '#c9a43a'; c.fillRect(x - r * .3, y - r - 3, r * .6, 4);
    c.fillStyle = OUT; c.beginPath(); c.arc(x, y, r + 2, 0, TAU); c.fill();
    c.fillStyle = rg(c, x - r * .35, y - r * .35, r * .1, r * 1.1, [[0, mixc(col, '#ffffff', .65)], [.45, col], [1, mixc(col, '#000000', .45)]]); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(x - r * .38, y - r * .4, r * .22, r * .13, -.6, 0, TAU); c.fill();
  }
}
function treeSwags(h, seed, sag) {   /* polylines across the tiers: a garland that dips between the edges of a tier */
  const tiers = treeTiers(h), out = [];
  for (let i = 1; i < tiers.length; i++) {
    const [yT, yB, w] = tiers[i], y0 = lerp(yT, yB, .45), y1 = lerp(yT, yB, .82), w0 = w * (y0 - yT) / (yB - yT) * .96, w1 = w * (y1 - yT) / (yB - yT) * .96, P = [];
    const dir = i % 2 ? 1 : -1;
    for (let j = 0; j <= 14; j++) { const u = j / 14, x = lerp(-w0, w1, u) * dir, yl = lerp(y0, y1, u); P.push([x, yl + dsin(u * PI) * h * .035 * sag]); }
    out.push(P);
  }
  return out;
}
function treeBulbs(h, seed) {
  const tiers = treeTiers(h), out = [];
  let n = 0;
  for (let i = 0; i < tiers.length; i++) {
    const [yT, yB, w] = tiers[i], y0 = lerp(yT, yB, .62), y1 = lerp(yT, yB, .95), w0 = w * (y0 - yT) / (yB - yT) * .9, w1 = w * (y1 - yT) / (yB - yT) * .9, m = 3 + i;
    const dir = i % 2 ? -1 : 1;
    for (let j = 0; j < m; j++) { const u = (j + .5) / m, x = lerp(-w0, w1, u) * dir, y = lerp(y0, y1, u) + dsin(u * PI) * h * .03; out.push({ lx: x, ly: y, color: A.LIGHT_COLORS[(n * 3 + i) % A.LIGHT_COLORS.length], phase: rnd(seed + 120, n) }); n++; }
  }
  return out;
}
const TREES = new Map(), GLOWS = new Map();
function glowSprite(col) {
  let cv = GLOWS.get(col);
  if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, V2.rgba(col, .9)); gr.addColorStop(.25, V2.rgba(col, .45)); gr.addColorStop(1, V2.rgba(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); GLOWS.set(col, cv); }
  return cv;
}
function starPath(c, x, y, R, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr2 = i % 2 ? r : R; i ? c.lineTo(x + dcos(a) * rr2, y + dsin(a) * rr2) : c.moveTo(x + dcos(a) * rr2, y + dsin(a) * rr2); } c.closePath(); }
A.tree = function (c, o) {
  const s = o.s || 1, h = o.h || 520, seed = o.seed || 7, t = tOf(o), lit = o.lit ?? 1, glow = o.glow ?? .55;
  const res = clamp(Math.ceil(scrScale(c) * s * 2) / 2, .5, 2.5), hw = TREE_W * h + 16, key = h + '|' + seed + '|' + res;
  let sp = TREES.get(key);
  if (!sp) {
    sp = document.createElement('canvas'); sp.width = Math.ceil(hw * 2 * res); sp.height = Math.ceil((h * 1.08 + 30) * res);
    const g = sp.getContext('2d'); g.scale(res, res); g.translate(hw, h * 1.04 + 10); drawTreeSprite(g, h, seed, o);
    if (TREES.size > 12) TREES.clear(); TREES.set(key, sp);
  }
  c.save(); c.translate(o.x, o.y); c.scale(s, s);
  if (o.skirt !== false) {   /* a red felt skirt with a white fur rim */
    c.fillStyle = 'rgba(20,10,30,.25)'; c.beginPath(); c.ellipse(0, 4, h * .5, h * .06, 0, 0, TAU); c.fill();
    c.fillStyle = lg(c, -h * .45, 0, h * .45, 0, [[0, '#b81d24'], [.5, '#d62839'], [1, '#8a1018']]); c.strokeStyle = OUT; c.lineWidth = 4; c.beginPath(); c.ellipse(0, -6, h * .44, h * .05, 0, 0, TAU); c.fill(); c.stroke();
    const top = [], bot = []; for (let i = 0; i <= 10; i++) { const a = PI * (i / 10), x = -dcos(a) * h * .44, y = -6 + dsin(a) * h * .05; top.push([x, y - 6]); bot.push([x, y + 5]); } furBand(c, top, bot, { fill: SFUR, seed: seed + 5, r: 5, lw: 2 });
  }
  c.drawImage(sp, -hw, -(h * 1.04 + 10), sp.width / res, sp.height / res);
  /* tinsel sparkle: a few glints slide slowly along the garland (slow, small) */
  if (o.tinsel !== false) { const sw = treeSwags(h, seed, .62); let n = 0; for (const S of sw) for (let j = 1; j < S.length - 1; j += 2) { const tw2 = A.twinkle(t * .8, rnd(seed + 140, n++)); if (tw2 < .8) continue; const [x, y] = S[j]; c.fillStyle = 'rgba(255,250,215,' + ((tw2 - .8) * 3.5).toFixed(3) + ')'; starPath(c, x, y, 6, 1.6); c.fill(); } }
  /* the string lights: a thin dark wire, bulbs that twinkle slowly */
  const bulbs = treeBulbs(h, seed), out = [];   /* returned in the CALLER's units (the frame o.x, o.y are in: world units for L20.pass) */
  if (o.lights !== false) {
    c.strokeStyle = 'rgba(10,30,14,.85)'; c.lineWidth = 2;
    let prev = null; for (const b of bulbs) { if (prev && Math.abs(prev.ly - b.ly) < h * .18) { c.beginPath(); c.moveTo(prev.lx, prev.ly - 4); c.quadraticCurveTo((prev.lx + b.lx) / 2, (prev.ly + b.ly) / 2 + 9, b.lx, b.ly - 4); c.stroke(); } prev = b; }
    const br = h * .019;
    for (const b of bulbs) {
      const lv = lit * A.twinkle(t, b.phase);
      if (glow > 0 && lv > .02) { const gr = br * 8 * (.75 + .25 * lv); c.save(); c.globalAlpha *= glow * lv; c.drawImage(glowSprite(b.color), b.lx - gr, b.ly - gr, gr * 2, gr * 2); c.restore(); }
      c.fillStyle = '#2a3a2a'; c.fillRect(b.lx - br * .45, b.ly - br * 1.55, br * .9, br * .7);
      c.fillStyle = V2.rgba(V2.mix(V2.mix(b.color, '#2a2a2a', .5), V2.mix(b.color, '#ffffff', .16), lv), 1); c.beginPath(); c.ellipse(b.lx, b.ly, br * .78, br * 1.05, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,20,20,.55)'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,' + (.35 + .5 * lv).toFixed(3) + ')'; c.beginPath(); c.ellipse(b.lx - br * .2, b.ly - br * .3, br * .22, br * .34, 0, 0, TAU); c.fill();
      out.push({ x: o.x + b.lx * s, y: o.y + b.ly * s, color: b.color, phase: b.phase, r: br * s });
    }
  }
  /* the star: a gold five-point star with a soft halo */
  const sy = -h * 1.0 + h * .02, sR = h * .065;
  if (o.star !== false) {
    c.save(); c.globalAlpha *= .5 * lit; c.drawImage(glowSprite('#ffe08a'), -sR * 3, sy - sR * 3, sR * 6, sR * 6); c.restore();
    c.fillStyle = OUT; starPath(c, 0, sy, sR + 3.5, sR * .45 + 2); c.fill();
    c.fillStyle = lg(c, 0, sy - sR, 0, sy + sR, [[0, '#fff3b0'], [.5, '#f4c742'], [1, '#c58a12']]); starPath(c, 0, sy, sR, sR * .45); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; starPath(c, -sR * .15, sy - sR * .2, sR * .32, sR * .14); c.fill();
  }
  const gifts = o.gifts | 0;
  for (let i = 0; i < gifts; i++) { const u = gifts > 1 ? i / (gifts - 1) : .5, kinds = ['stripes', 'dots', 'trees', 'candy', 'plain'], cols = Object.values(A.GIFT_COLORS); A.gift(c, { x: lerp(-h * .34, h * .34, u), y: 4 + (i % 2) * 6, s: .55 + .2 * rnd(seed + 160, i), w: 150 + 40 * rnd(seed + 161, i), h: 100 + 40 * rnd(seed + 162, i), paper: kinds[i % 5], color: cols[i % cols.length][0], color2: cols[i % cols.length][1], ribbonColor: i % 2 ? '#e8b93a' : '#f4f1ea', t, seed: seed + i }); }
  c.restore();
  return { box: [o.x - hw * s, o.y - (h * 1.08) * s, o.x + hw * s, o.y + 10 * s], lights: out, star: [o.x, o.y + sy * s] };
};

// ================================================================== E15-TURN integration: the hat turns with the head, the coat with the body, the beard with the face
(() => {
  if (!V2C.YAW_ACC || !V2C.ACC_CLS) return;
  const hat = (o, k, t, layer, yaw) => { if (layer === 'mid' && o.h22) hatDraw22(ctx, o, k, t, yaw || 0); }; hat.cls = 'head'; V2C.YAW_ACC.fp22_santahat = hat;
  const coat = (o, k, t, layer, yaw) => { if (layer === 'mid' && o.s22) coatDraw(ctx, o, k, t, yaw || 0); }; coat.cls = 'wrap'; V2C.YAW_ACC.fp22_santacoat = coat;
  const beard = (o, k, t, layer, yaw) => { if (layer === 'mid' && o.s22 && o.s22.beard) beardDraw(ctx, o, k, t, yaw || 0); }; beard.cls = 'face'; V2C.YAW_ACC.fp22_beard = beard;
  const legs = (o, k, t, layer) => { if (layer === 'front' && o.s22 && o.s22.pose !== 'stand') santaLegs(ctx, o, k, t); }; legs.cls = 'chest'; V2C.YAW_ACC.fp22_santalegs = legs;
  const sb = (o, k, t, layer) => EXT.acc.fp22_sackback(o, k, t, layer); sb.cls = 'chest'; V2C.YAW_ACC.fp22_sackback = sb;
  /* @@A22-TURN */
})();
// ================================================================== BATCH 2: the wrap, the search, the swap (props; each (ctx, o), x, y = the CENTRE unless anchor: 'bottom'; returns its box)
const begin = (c, o, h, def) => { const s = o.s || 1, an = o.anchor || def || 'centre'; c.save(); c.translate(o.x, o.y); c.rotate(o.rot || 0); c.translate(0, an === 'bottom' ? -(h / 2) * s : 0); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round'; return s; };
const boxOf = (o, w, h, def) => { const s = o.s || 1, r = o.rot || 0, an = o.anchor || def || 'centre', cy = o.y - (an === 'bottom' ? (h / 2) * s * dcos(r) : 0), ex = (Math.abs(dcos(r)) * w + Math.abs(dsin(r)) * h) / 2 * s, ey = (Math.abs(dsin(r)) * w + Math.abs(dcos(r)) * h) / 2 * s; return [o.x - ex, cy - ey, o.x + ex, cy + ey]; };
/* a UI-kit label on a prop: skipped when it would be under 7 px on screen; hero only when asked AND 30 px or more */
function propText(c, str, x, y, size, o, extra) {
  if (!window.UI || !str) return;
  const px = size * scrScale(c); if (px < 7) return;
  UI.label(String(str), x, y, Object.assign({ size, hero: !!o.hero && px >= 30, grp: o.grp || 'fp22_prop', fill: '#1d2236' }, extra || {}));
}
A.NITRILE = '#8e5bd6';
/* the glove outline in local units (fingers up, cuff down, palm centre at 0,0), puff 0 limp .. 1 inflated: a list of discs and capsules unioned into one silhouette */
function gloveParts(puff, side) {
  const p = clamp(puff), sd = side || 1, P = [];
  P.push({ e: [0, 0, 50 + 12 * p, 44 + 14 * p] });   /* palm */
  const fing = [[-.36, 66, 15], [-.12, 80, 16], [.12, 76, 16], [.36, 60, 14]];
  for (const [a, L, w] of fing) { const ang = a * (1 + .5 * p), r = w * (1 + .55 * p), len = L * (.88 + .14 * p), bx = dsin(ang) * 30, by = -30 - 6 * p; P.push({ c: [bx, by, bx + dsin(ang) * len, by - dcos(ang) * len, r] }); }
  const ta = -1.05 - .25 * p; P.push({ c: [-34 - 6 * p, 6, -34 - 6 * p + dsin(ta) * 46 * (.9 + .2 * p), 6 - dcos(ta) * 46 * (.9 + .2 * p), 15 * (1 + .45 * p)] });   /* thumb */
  P.push({ c: [0, 34 + 6 * p, 0, 70 + 6 * p, 17 - 3 * p] });   /* the cuff narrowing to the knot */
  if (sd < 0) for (const q of P) { if (q.e) q.e[0] = -q.e[0]; else { q.c[0] = -q.c[0]; q.c[2] = -q.c[2]; } }
  return P;
}
function partsPath(c, P, grow) {
  c.beginPath();
  for (const q of P) {
    if (q.e) { const [x, y, rx, ry] = q.e; c.moveTo(x + rx + grow, y); c.ellipse(x, y, rx + grow, ry + grow, 0, 0, TAU); }
    else { const [x0, y0, x1, y1, r] = q.c, a = Math.atan2(y1 - y0, x1 - x0), R = r + grow; c.moveTo(x0 + dcos(a + PI / 2) * R, y0 + dsin(a + PI / 2) * R); c.arc(x0, y0, R, a + PI / 2, a + PI * 1.5); c.arc(x1, y1, R, a - PI / 2, a + PI / 2); c.closePath(); }
  }
}
A.gloveBalloon = function (c, o) {
  const puff = o.puff ?? 1, col = o.color || A.NITRILE, t = tOf(o), seed = o.seed || 1, P = gloveParts(puff, o.side);
  const s = begin(c, o, 0); c.rotate(dsin(t * 1.1 + seed) * .03);
  if (o.string !== false && o.string != null) {   /* a curly ribbon from the knot (string: length in local px) */
    const L = typeof o.string === 'number' ? o.string : 160; c.strokeStyle = o.stringColor || '#e8b93a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 82);
    for (let i = 1; i <= 20; i++) { const u = i / 20; c.lineTo(dsin(u * 9 + t * 1.3 + seed) * 7 * u, 82 + u * L); } c.stroke();
  }
  c.fillStyle = OUT; partsPath(c, P, 2.6); c.fill('nonzero');
  c.fillStyle = rg(c, -22, -30, 8, 120, [[0, mixc(col, '#ffffff', .45)], [.5, col], [1, mixc(col, '#1a0830', .45)]]); partsPath(c, P, 0); c.fill('nonzero');
  c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-20 - 4 * puff, -14, 15 + 5 * puff, 9 + 4 * puff, -.5, 0, TAU); c.fill();   /* shine */
  for (const q of P) if (q.c) { const [x0, y0, x1, y1, r] = q.c; c.fillStyle = 'rgba(255,255,255,.42)'; c.beginPath(); c.ellipse(lerp(x0, x1, .65) - r * .35, lerp(y0, y1, .65), r * .22, r * .45, Math.atan2(y1 - y0, x1 - x0) + PI / 2, 0, TAU); c.fill(); }
  c.fillStyle = mixc(col, '#1a0830', .25); c.strokeStyle = OUT; c.lineWidth = 2.4; c.beginPath(); c.ellipse(0, 82 + 2 * puff, 10, 8, 0, 0, TAU); c.fill(); c.stroke();   /* the knot */
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 58 + 6 * puff, 14 - 2 * puff, 3, 0, 0, TAU); c.stroke();   /* the rolled cuff */
  if (o.face) {   /* a smiley doodled in marker on the palm */
    c.strokeStyle = 'rgba(20,16,30,.9)'; c.fillStyle = 'rgba(20,16,30,.9)'; c.lineWidth = 3.4;
    c.beginPath(); c.ellipse(-15, -4, 3.6, 5, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(15, -4, 3.6, 5, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(0, 4, 19, .35, PI - .35); c.stroke();
  }
  c.restore();
  return boxOf(o, 150 + 30 * puff, 220);
};
A.glove = function (c, o) {   /* a flat, uninflated purple nitrile glove (lying on a surface, or dangling: rot) */
  const col = o.color || A.NITRILE, P = gloveParts(0, o.side);
  begin(c, o, 0); c.scale(.85, 1);
  c.fillStyle = 'rgba(20,10,40,.85)'; partsPath(c, P, 2.2); c.fill('nonzero');
  c.fillStyle = lg(c, -60, 0, 60, 0, [[0, mixc(col, '#ffffff', .3)], [1, mixc(col, '#1a0830', .2)]]); partsPath(c, P, 0); c.fill('nonzero');
  c.strokeStyle = 'rgba(40,10,70,.35)'; c.lineWidth = 1.6; for (const [x0, y0, x1, y1] of [[-20, -20, -8, 10], [10, -30, 18, 6], [-30, 30, 20, 40]]) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-14, -10, 8, 20, -.3, 0, TAU); c.fill();
  c.restore();
  return boxOf(o, 130, 200);
};
A.gloveBox = function (c, o) {   /* a box of NITRILE GLOVES: white carton, purple band, an oval slot on top with a glove peeking out */
  const w = 170, h = 84, d = 36, t = tOf(o), col = o.color || A.NITRILE;
  begin(c, o, h + d, 'bottom');
  c.translate(0, d / 2);
  c.fillStyle = '#f2f0f6'; c.strokeStyle = OUT; c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2 - 14, -h / 2 - d); c.lineTo(-w / 2 + 14, -h / 2 - d); c.closePath(); c.fillStyle = '#ffffff'; c.fill(); c.stroke();   /* top face */
  c.fillStyle = '#3a2a4a'; c.beginPath(); c.ellipse(0, -h / 2 - d / 2, w * .3, d * .28, 0, 0, TAU); c.fill();   /* the slot */
  const pk = o.peek ?? 1; if (pk > 0) {   /* a glove's fingers peeking out of the slot */
    c.save(); c.fillStyle = col; c.strokeStyle = OUT; c.lineWidth = 2.6;
    for (let i = 0; i < 4; i++) { const x = -18 + i * 12, L = (18 + 8 * dsin(i * 1.7)) * pk + dsin(t * 1.5 + i) * 1.2; c.beginPath(); c.roundRect(x - 5.5, -h / 2 - d / 2 - L, 11, L + 5, 5.5); c.fill(); c.stroke(); }
    c.restore();
  }
  c.fillStyle = lg(c, -w / 2, 0, w / 2, 0, [[0, '#ffffff'], [1, '#dcdae6']]); c.fillRect(-w / 2, -h / 2, w, h); c.strokeRect(-w / 2, -h / 2, w, h);   /* front face */
  c.fillStyle = col; c.fillRect(-w / 2, -h / 2 + h * .56, w, h * .3); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-w / 2, -h / 2 + h * .56, w, 4);
  propText(c, 'NITRILE GLOVES', 0, -h / 2 + h * .3, 15, o, { fill: '#3b2a6b', maxW: w * .86, grp: 'fp22_glovebox' });
  propText(c, 'EXAM  M', 0, -h / 2 + h * .71, 11, o, { fill: '#ffffff', maxW: w * .5, grp: 'fp22_glovebox' });
  c.restore();
  return boxOf(o, w, h + d + 30, 'bottom');
};
A.tapeRoll = function (c, o) {   /* a roll of white paper tape, three-quarter view; pull 0..1: a strip pulled out with a torn end */
  const R = 38, r = 21, th = 20, pull = clamp(o.pull || 0), t = tOf(o), dir = o.dir || 1;
  begin(c, o, R * 2);
  if (pull > 0) {   /* the strip leaves the bottom of the roll and runs out to the side */
    const L = 30 + pull * (o.len || 190), wv = dsin(t * 2 + 1) * 3 * pull;
    c.fillStyle = 'rgba(240,238,228,.96)'; c.strokeStyle = 'rgba(60,50,40,.7)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, R - 2); c.lineTo(dir * L, R + 4 + wv); for (let i = 0; i <= 6; i++) c.lineTo(dir * (L + (i % 2 ? 4 : -2)), R + 4 + wv + th * .5 * i / 6 * 2 - th * .0); c.lineTo(0, R + th * .9); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1; for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(dir * i * L / 6, R + 4); c.lineTo(dir * i * L / 6, R + th * .9); c.stroke(); }
  }
  c.fillStyle = '#e9e6dc'; c.strokeStyle = OUT; c.lineWidth = 3.2; c.beginPath(); c.ellipse(th * .6, 0, R * .8, R, 0, -PI / 2, PI / 2); c.lineTo(0, R); c.ellipse(0, 0, R * .8, R, 0, PI / 2, -PI / 2, true); c.closePath(); c.fill(); c.stroke();   /* the side band of the roll */
  c.fillStyle = rg(c, -8, -10, 4, R, [[0, '#ffffff'], [1, '#e2ded2']]); c.beginPath(); c.ellipse(0, 0, R * .8, R, 0, 0, TAU); c.fill(); c.stroke();   /* the face */
  c.strokeStyle = 'rgba(150,140,120,.35)'; c.lineWidth = 1.2; for (let k2 = 0; k2 < 4; k2++) { const q = (r + (R - r) * k2 / 4) / R; c.beginPath(); c.ellipse(0, 0, R * .8 * q, R * q, 0, 0, TAU); c.stroke(); }
  c.fillStyle = '#c9a272'; c.strokeStyle = OUT; c.lineWidth = 2.6; c.beginPath(); c.ellipse(0, 0, r * .8, r, 0, 0, TAU); c.fill(); c.stroke();   /* the cardboard core */
  c.fillStyle = '#5a4630'; c.beginPath(); c.ellipse(0, 0, r * .6, r * .78, 0, 0, TAU); c.fill();
  c.restore();
  return boxOf(o, R * 2 + (pull > 0 ? 2 * (30 + pull * (o.len || 190)) : 0), R * 2 + th);
};
A.pudding = function (c, o) {   /* a pudding cup: tapered plastic cup, foil lid, a SUGAR FREE label; open 0..1 peels the lid back */
  const w = 76, h = 62, op = clamp(o.open || 0), flav = o.flavor || 'chocolate', pc = flav === 'vanilla' ? '#f1dca0' : '#6b3f22';
  begin(c, o, h, 'bottom');
  c.fillStyle = 'rgba(20,10,30,.2)'; c.beginPath(); c.ellipse(0, h / 2 + 2, w * .42, 6, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w * .38, h / 2); c.lineTo(-w * .38, h / 2); c.closePath();
  c.fillStyle = lg(c, -w / 2, 0, w / 2, 0, [[0, '#ffffff'], [.6, '#f1eee8'], [1, '#cfc9c0']]); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3.2; c.stroke();
  c.fillStyle = pc; c.beginPath(); c.moveTo(-w * .46, -h * .2); c.lineTo(w * .46, -h * .2); c.lineTo(w * .41, h * .28); c.lineTo(-w * .41, h * .28); c.closePath(); c.globalAlpha *= .9; c.fill(); c.globalAlpha /= .9;   /* the pudding through the cup: the label band */
  c.fillStyle = '#ffffff'; c.fillRect(-w * .43, -h * .12, w * .86, h * .3);
  propText(c, 'SUGAR FREE', 0, h * .03, 9.5, o, { fill: '#c62828', maxW: w * .8, grp: 'fp22_pudding' });
  c.fillStyle = '#d9dde4'; c.strokeStyle = OUT; c.lineWidth = 2.6; c.beginPath(); c.ellipse(0, -h / 2, w / 2 + 2, 8, 0, 0, TAU); c.fill(); c.stroke();   /* rim */
  if (op < .98) {   /* the foil lid, peeling back from the front */
    c.save(); c.translate(0, -h / 2); c.scale(1, 1 - op * 1.6); c.fillStyle = lg(c, -w / 2, -8, w / 2, 8, [[0, '#f4f6fa'], [.5, '#c4ccd8'], [1, '#eef1f6']]); c.beginPath(); c.ellipse(0, 0, w / 2 + 1, 7, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,40,60,.6)'; c.lineWidth = 1.6; c.stroke(); c.restore();
    c.fillStyle = '#c4ccd8'; c.beginPath(); c.moveTo(w / 2 - 4, -h / 2 - 2); c.lineTo(w / 2 + 10, -h / 2 - 10 - op * 30); c.lineTo(w / 2 + 14, -h / 2 - 2); c.closePath(); c.fill();   /* the pull tab */
  }
  if (op > .02) { c.fillStyle = pc; c.beginPath(); c.ellipse(0, -h / 2 + 1, (w / 2 - 3) * op + 4, 5 * op + 1, 0, 0, TAU); c.fill(); }
  c.restore();
  return boxOf(o, w + 16, h + 16, 'bottom');
};
A.candle = function (c, o) {   /* a jar candle, VANILLA SUGAR COOKIE (the same candle every time); lit 0..1: a small slow flame */
  const w = 92, h = 108, lit = clamp(o.lit || 0), t = tOf(o), seed = o.seed || 3;
  begin(c, o, h, 'bottom');
  c.fillStyle = 'rgba(20,10,30,.2)'; c.beginPath(); c.ellipse(0, h / 2 + 2, w * .5, 7, 0, 0, TAU); c.fill();
  c.fillStyle = lg(c, -w / 2, 0, w / 2, 0, [[0, 'rgba(230,240,250,.95)'], [.5, 'rgba(250,252,255,.8)'], [1, 'rgba(190,205,220,.95)']]); c.strokeStyle = OUT; c.lineWidth = 3.2;
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, [10, 10, 14, 14]); c.fill(); c.stroke();   /* the glass */
  c.fillStyle = '#f6e7c8'; c.beginPath(); c.roundRect(-w / 2 + 6, -h / 2 + 16, w - 12, h - 22, [4, 4, 10, 10]); c.fill();   /* the wax */
  c.fillStyle = '#efdcb3'; c.beginPath(); c.ellipse(0, -h / 2 + 16, w / 2 - 6, 6, 0, 0, TAU); c.fill();
  c.fillStyle = '#7a3b2a'; c.beginPath(); c.roundRect(-w / 2 + 8, -h / 2 + 34, w - 16, 46, 4); c.fill();   /* the label */
  c.strokeStyle = '#e8b93a'; c.lineWidth = 1.6; c.strokeRect(-w / 2 + 11, -h / 2 + 37, w - 22, 40);
  propText(c, 'VANILLA', 0, -h / 2 + 49, 10.5, o, { fill: '#fbeed2', maxW: w - 28, grp: 'fp22_candle' });
  propText(c, 'SUGAR COOKIE', 0, -h / 2 + 66, 8.5, o, { fill: '#fbeed2', maxW: w - 28, grp: 'fp22_candle' });
  c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(-w / 2 + 6, -h / 2 + 8, 7, h - 20);
  c.strokeStyle = '#2a1a10'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, -h / 2 + 15); c.lineTo(dsin(t * .9 + seed) * 1.2, -h / 2 + 4); c.stroke();   /* the wick */
  if (lit > .01) {   /* the flame: a slow, small sway (never a strobe) */
    const fy = -h / 2 + 3, fl = 1 + .06 * dsin(t * 2.3 + seed) + .04 * dsin(t * 3.7 + seed * 2), sw = dsin(t * 1.7 + seed) * 2;
    c.save(); c.globalAlpha *= lit;
    c.drawImage(glowSprite('#ffb84a'), -40, fy - 52, 80, 80);
    c.fillStyle = rg(c, sw * .3, fy - 8, 1, 16 * fl, [[0, '#fffbe6'], [.45, '#ffd25a'], [1, 'rgba(255,120,30,.0)']]);
    c.beginPath(); c.moveTo(0, fy + 2); c.bezierCurveTo(-8, fy - 2, -6 + sw, fy - 14 * fl, sw * 1.4, fy - 24 * fl); c.bezierCurveTo(6 + sw, fy - 14 * fl, 8, fy - 2, 0, fy + 2); c.fill();
    c.restore();
  }
  c.restore();
  return boxOf(o, w + 10, h + 10, 'bottom');
};
A.gripSocks = function (c, o) {   /* YELLOW non-skid socks, a pair held up by the cuffs (x, y = the cuffs' centre): white grip dots, a rib-knit cuff */
  const col = o.color || '#f6cf2a', t = tOf(o), seed = o.seed || 4, dk = mixc(col, '#6a4a00', .35);
  begin(c, o, 0);
  for (const sd of [-1, 1]) {
    c.save(); c.translate(sd * 30, 0); c.rotate(sd * .08 + dsin(t * 1.6 + sd + seed) * .03);
    const path = () => { c.beginPath(); c.moveTo(-26, 0); c.lineTo(26, 0); c.lineTo(28, 112); c.quadraticCurveTo(30, 132, sd * 62, 134); c.quadraticCurveTo(sd * 84, 136, sd * 82, 152); c.quadraticCurveTo(sd * 78, 168, sd * 40, 166); c.lineTo(-sd * 10, 166); c.quadraticCurveTo(-28, 164, -28, 140); c.closePath(); };
    path(); c.fillStyle = lg(c, -28, 0, 28, 0, [[0, mixc(col, '#ffffff', .25)], [.6, col], [1, dk]]); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3.4; c.stroke();
    c.save(); path(); c.clip();
    c.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) { const x = -20 + (i % 4) * 13 + (Math.floor(i / 4) % 2) * 6, y = 40 + Math.floor(i / 4) * 17; c.beginPath(); c.ellipse(x, y, 4.2, 3.2, 0, 0, TAU); c.fill(); }
    for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(sd * (16 + i * 11), 152 - (i % 2) * 6, 4.2, 3.2, 0, 0, TAU); c.fill(); }
    c.fillStyle = mixc(col, '#ffffff', .2); c.fillRect(-28, 0, 56, 26); c.strokeStyle = 'rgba(120,90,0,.35)'; c.lineWidth = 2; for (let x = -22; x <= 22; x += 7) { c.beginPath(); c.moveTo(x, 2); c.lineTo(x, 24); c.stroke(); }
    c.restore();
    c.strokeStyle = OUT; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-27, 26); c.lineTo(27, 26); c.stroke();
    c.restore();
  }
  c.restore();
  return boxOf(o, 220, 0).map((v, i) => i === 1 ? o.y - 4 * (o.s || 1) : i === 3 ? o.y + 172 * (o.s || 1) : v);
};
A.mug = function (c, o) {   /* a white mug (x, y = the bottom centre), the text on its face through the UI kit (hero when held up big: hero: true) */
  const w = 220, h = 210, t = tOf(o), str = o.text != null ? o.text : "WORLD'S OKAYEST NURSE";
  begin(c, o, h, 'bottom'); c.translate(0, h / 2);
  c.fillStyle = 'rgba(20,10,30,.2)'; c.beginPath(); c.ellipse(0, 2, w * .52, 10, 0, 0, TAU); c.fill();
  c.strokeStyle = OUT; c.lineWidth = 34; c.beginPath(); c.ellipse(w / 2 + 6, -h * .52, 44, 58, 0, -1.25, 1.25); c.stroke();   /* the handle */
  c.strokeStyle = '#eef1f5'; c.lineWidth = 27; c.stroke(); c.strokeStyle = 'rgba(150,160,175,.6)'; c.lineWidth = 5; c.beginPath(); c.ellipse(w / 2 + 6, -h * .52, 34, 48, 0, -1.1, 1.1); c.stroke();
  const body = () => { c.beginPath(); c.moveTo(-w / 2, -h); c.lineTo(w / 2, -h); c.lineTo(w / 2 - 6, -14); c.quadraticCurveTo(w / 2 - 8, 0, w / 2 - 28, 0); c.lineTo(-w / 2 + 28, 0); c.quadraticCurveTo(-w / 2 + 8, 0, -w / 2 + 6, -14); c.closePath(); };
  body(); c.fillStyle = lg(c, -w / 2, 0, w / 2, 0, [[0, '#dde3ea'], [.3, '#ffffff'], [.75, '#f1f3f6'], [1, '#c9d0da']]); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3.6; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(-w / 2 + 16, -h + 20, 9, h - 46);
  c.fillStyle = '#d4dae2'; c.beginPath(); c.ellipse(0, -h, w / 2, 16, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#6b4a32'; c.beginPath(); c.ellipse(0, -h + 2, w / 2 - 12, 10, 0, 0, TAU); c.fill();   /* coffee */
  c.fillStyle = 'rgba(255,240,220,.35)'; c.beginPath(); c.ellipse(-20, -h, 26, 4, 0, 0, TAU); c.fill();
  if (o.steam) { c.save(); c.globalAlpha *= clamp(o.steam) * .55; c.strokeStyle = '#ffffff'; c.lineWidth = 7; for (let i = -1; i <= 1; i++) { c.beginPath(); for (let j = 0; j <= 10; j++) { const u = j / 10, y = -h - 10 - u * 90, x = i * 40 + dsin(u * 5 + t * 1.6 + i) * 9; j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.restore(); }
  if (window.UI && str) {   /* the words on the face: a red heart over three lines (UI.sign: shrinks, never squishes) */
    const px = 30 * scrScale(c), id = o.id || 'fp22_mug';
    c.fillStyle = '#e8193a'; c.beginPath(); const hy = -h + 36; c.moveTo(0, hy + 9); c.bezierCurveTo(-14, hy - 2, -8, hy - 13, 0, hy - 5); c.bezierCurveTo(8, hy - 13, 14, hy - 2, 0, hy + 9); c.fill();
    if (px >= 7) { UI.container(id, 'board', [-w / 2 + 16, -h + 50, w / 2 - 16, -16], 4); const words = String(str).replace(/^WORLD'S /, "WORLD'S\n").replace(/ NURSE$/, '\nNURSE').split('\n');
      UI.sign([-w / 2 + 16, -h + 50, w - 32, h - 66], words.map((wd, i) => ({ t: wd, size: i === 1 ? 40 : 30 })), { fill: false, stroke: false, lw: 0, pad: 4, ink: '#1d2a6b', font: 'Lucky', weight: 400, id, hero: !!o.hero && px >= 30, grp: o.grp || 'fp22_mug' }); }
  }
  c.restore();
  return boxOf(o, w + 100, h + 10, 'bottom');
};
function denturesDraw(c, open, t, seed) {   /* a set of false teeth: pink gums, white teeth, two plates (open 0..1 = the gap) */
  const gap = 4 + 18 * clamp(open);
  for (const sd of [-1, 1]) {
    const y = sd * gap;
    c.fillStyle = '#ef8fa0'; c.strokeStyle = OUT; c.lineWidth = 2.6;
    c.beginPath(); c.ellipse(0, y + sd * 10, 46, 17, 0, sd < 0 ? PI : 0, sd < 0 ? TAU : PI); c.lineTo(-46, y + sd * 10); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-12, y + sd * 18, 18, 3.5, 0, 0, TAU); c.fill();
    for (let i = -4; i <= 4; i++) { const tw2 = i === 0 ? 11 : 9.5, x = i * 10.2, th = sd < 0 ? 14 - Math.abs(i) * .8 : 12 - Math.abs(i) * .7; c.fillStyle = '#fbfaf3'; c.strokeStyle = 'rgba(60,50,40,.6)'; c.lineWidth = 1.4; c.beginPath(); c.roundRect(x - tw2 / 2, sd < 0 ? y - th + 6 + 10 * 0 - 6 + 6 : y - 6, tw2, th, 3); c.fill(); c.stroke(); }
  }
}
A.dentures = function (c, o) {   /* x, y = the centre of the bite */
  begin(c, o, 0); denturesDraw(c, o.open || 0, tOf(o), o.seed || 1); c.restore();
  return boxOf(o, 100, 50 + 36 * clamp(o.open || 0));
};
A.dentureCup = function (c, o) {   /* a lidded plastic denture cup (x, y = the bottom centre): translucent blue cup, a hinged lid (open 0..1); with teeth: true the plates show through */
  const w = 96, h = 92, op = clamp(o.open || 0), t = tOf(o);
  begin(c, o, h, 'bottom'); c.translate(0, h / 2);
  c.fillStyle = 'rgba(20,10,30,.2)'; c.beginPath(); c.ellipse(0, 2, w * .52, 7, 0, 0, TAU); c.fill();
  if (o.teeth !== false) { c.save(); c.translate(0, -h * .48); c.scale(.72, .72); denturesDraw(c, .1, t, 2); c.restore(); }
  c.fillStyle = 'rgba(150,200,240,.55)'; c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.moveTo(-w / 2, -h); c.lineTo(w / 2, -h); c.lineTo(w * .42, 0); c.lineTo(-w * .42, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-w / 2 + 10, -h + 10, 7, h - 22);
  c.fillStyle = '#ffffff'; c.fillRect(-w * .3, -h * .62, w * .6, h * .2); c.strokeStyle = 'rgba(40,60,90,.5)'; c.lineWidth = 1.2; c.strokeRect(-w * .3, -h * .62, w * .6, h * .2);
  propText(c, o.label || 'DENTURES', 0, -h * .52, 9, o, { fill: '#1f3b73', maxW: w * .54, grp: 'fp22_dcup' });
  c.save(); c.translate(-w / 2 - 2, -h); c.rotate(-op * 1.9);   /* the lid on its hinge at the left */
  c.fillStyle = lg(c, 0, -14, 0, 4, [[0, '#7fb6ea'], [1, '#3f7fc4']]); c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.roundRect(0, -14, w + 4, 16, 6); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(8, -11, w - 14, 3);
  c.restore();
  c.restore();
  return boxOf(o, w + 20, h + 20 + op * 60, 'bottom');
};
A.nameSlip = function (c, o) {   /* a folded paper slip (x, y = the centre): unfold 0..1 opens it (the top half swings up); the name is written on it (UI kit, shown once it is open) */
  const w = 120, u = clamp(o.unfold || 0), hh = 29, t = tOf(o), name = o.name;
  begin(c, o, 0);
  c.fillStyle = 'rgba(30,20,30,.18)'; c.fillRect(-w / 2 + 3, -hh * u + 4, w, hh * (1 + u));
  c.fillStyle = '#fffdf5'; c.strokeStyle = 'rgba(60,50,40,.6)'; c.lineWidth = 1.6; c.fillRect(-w / 2, 0, w, hh); c.strokeRect(-w / 2, 0, w, hh);   /* the bottom half */
  const k = dcos(u * PI);   /* the top half: folded down over the bottom (k 1) .. swung up open (k -1) */
  c.save(); c.scale(1, -k); c.fillStyle = k > 0 ? '#f1ead6' : '#fffdf5'; c.fillRect(-w / 2, 0, w, -hh); c.strokeRect(-w / 2, 0, w, -hh); if (k > 0) { c.fillStyle = 'rgba(120,100,60,.12)'; c.fillRect(-w / 2, -hh, w, hh); } c.restore();
  c.strokeStyle = 'rgba(60,50,40,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.stroke();
  if (u > .82 && name) { const a = sm(.82, 1, u); propText(c, name, 0, 0, 26, o, { fill: '#1f3270', maxW: w - 16, alpha: a, grp: o.grp || 'fp22_slip', italic: true }); }
  c.restore();
  return boxOf(o, w, hh * (1 + u) * 1.02 + 8);
};
/* a Santa hat held upside down by its fur brim (x, y = the brim's centre): the cone hangs below, the pom flops; name slips stand in the opening */
function hatPropDraw(c, o, rx) {
  const t = tOf(o), sh = o.shake ?? -1, jig = sh >= 0 && sh < 1.1 ? dsin(sh * 26) * Math.exp(-sh * 2.6) : 0, n = Math.max(0, Math.round(o.slips ?? 12)), ry = 30, sway = 8 * dsin(t * 1.3 + (o.seed || 0)) + 18 * jig;
  const col = o.hatColor || '#d42a2a', seed = o.seed || 5;
  c.rotate((o.tilt || 0) + .05 * jig);
  c.beginPath(); c.moveTo(-rx + 6, 4); c.bezierCurveTo(-rx + 10, 120, -10 + sway, 170, 60 + sway, 196); c.bezierCurveTo(30 + sway, 150, rx - 4, 100, rx - 6, 4); c.closePath();
  c.fillStyle = lg(c, -rx, 0, rx, 0, [[0, mixc(col, '#ffffff', .22)], [.5, col], [1, mixc(col, '#2a0610', .42)]]); c.fill(); c.strokeStyle = OUT; c.lineWidth = 4; c.stroke();
  c.strokeStyle = 'rgba(70,0,12,.3)'; c.lineWidth = 5; c.beginPath(); c.moveTo(rx * .5, 30); c.quadraticCurveTo(rx * .3, 120, 40 + sway, 175); c.stroke();
  c.strokeStyle = 'rgba(255,235,235,.25)'; c.lineWidth = 6; c.beginPath(); c.moveTo(-rx + 30, 30); c.quadraticCurveTo(-rx + 34, 110, 10 + sway, 160); c.stroke();
  fluff(c, 64 + sway, 204, 28, '#ffffff', 'rgba(120,140,190,.5)', 12, seed);
  c.fillStyle = '#4a0a0e'; c.beginPath(); c.ellipse(0, 0, rx - 8, ry - 8, 0, 0, TAU); c.fill();   /* the opening */
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / Math.max(n, 14), x = (u - .5) * (rx * 1.5) + (n < 14 ? (14 - n) * rx * .05 * (rnd(seed, 31) - .5) : 0), h = 30 + 22 * rnd(17, i), bounce = sh >= 0 ? 16 * Math.abs(dsin(sh * 20 + i * 1.7)) * Math.exp(-Math.max(0, sh) * 3) : 0, r = (rnd(19, i) - .5) * .7 + .3 * jig * (rnd(23, i) - .5);
    c.save(); c.translate(x, 2 - bounce * (rnd(29, i) > .4 ? 1 : 0)); c.rotate(r);
    c.fillStyle = i % 3 ? '#fffdf4' : '#fff4c8'; c.fillRect(-15, -h, 30, h); c.strokeStyle = 'rgba(60,50,40,.6)'; c.lineWidth = 1.6; c.strokeRect(-15, -h, 30, h);
    c.strokeStyle = 'rgba(60,50,40,.3)'; c.beginPath(); c.moveTo(0, -h); c.lineTo(0, 0); c.stroke();
    c.restore();
  }
  const top = [], bot = [];   /* the front of the fur brim (it covers the slips' feet) */
  for (let i = 0; i <= 12; i++) { const a = PI * (1 - i / 12), x = dcos(a) * (rx + 4), y = dsin(a) * (ry + 2); top.push([x, y - 9]); bot.push([x * 1.02, y + 13]); }
  furBand(c, top, bot, { fill: '#fbf7ef', seed: seed + 9, r: 9, lw: 2.4 });
  for (const sd of [-1, 1]) fluff(c, sd * (rx + 2), 2, 13, '#fbf7ef', 'rgba(120,140,190,.45)', 8, seed + sd + 4);
  if ((o.glow || 0) > .01) { c.save(); c.globalAlpha *= .55 * o.glow; c.drawImage(glowSprite('#c8ffe0'), -rx * 1.6, -rx * 1.4, rx * 3.2, rx * 2.4); c.restore(); }
}
A.santaHatProp = function (c, o) { const rx = 105; begin(c, o, 0); hatPropDraw(c, o, rx); c.restore(); const s = o.s || 1; return [o.x - (rx + 18) * s, o.y - 60 * s, o.x + (rx + 18) * s, o.y + 232 * s]; };
A.secretSantaHat = function (c, o) { return A.santaHatProp(c, Object.assign({ slips: 12 }, o)); };
A.hatPropInfo = o => { const s = o.s || 1, rx = 105; return { box: [o.x - (rx + 18) * s, o.y - 60 * s, o.x + (rx + 18) * s, o.y + 232 * s], mouth: [o.x, o.y - 10 * s], mouthW: (rx - 8) * 2 * s, pom: [o.x + 64 * s, o.y + 204 * s] }; };

/* held versions (hold: { r: 'fp22_mug' }): the set pieces at the hand, sized for the cast; options through o.p22 (e.g. { text, lit, puff, unfold, name, open }) */
const HELD = { fp22_mug: ['mug', .32, [0, 30], [-46, -40, 70, 40]], fp22_candle: ['candle', .62, [0, 34], [-30, -36, 30, 38]], fp22_pudding: ['pudding', .62, [0, 20], [-26, -22, 26, 24]],
  fp22_socks: ['gripSocks', .5, [0, -6], [-56, -8, 56, 82]], fp22_dcup: ['dentureCup', .55, [0, 30], [-30, -30, 30, 34]], fp22_balloon: ['gloveBalloon', .42, [0, -60], [-40, -110, 40, -10]],
  fp22_tape: ['tapeRoll', .5, [0, 0], [-26, -26, 26, 26]], fp22_slip: ['nameSlip', .5, [0, -4], [-32, -20, 32, 14]], fp22_hatprop: ['santaHatProp', .42, [0, -8], [-52, -34, 52, 92]], fp22_glove: ['glove', .4, [0, 18], [-28, -24, 28, 64]] };
for (const name in HELD) {
  const [fn, sc, off, bx] = HELD[name];
  EXT.prop[name] = (side, o, t) => { const p = o.p22 || {}; A[fn](ctx, Object.assign({ t, hero: false }, p, { x: off[0] * (p.s || 1), y: off[1] * (p.s || 1), s: sc * (p.s || 1), rot: p.rot || 0 })); };
  PROP_BOX[name] = bx;
}
// ================================================================== BATCH 3: the Hoyer lift, the gait belt, string lights, tinsel, ribbon curls, a wreath, stockings, the ugly sweater
/* the Hoyer lift, side view (the geometry of ep22_santa_sim.js geo.hoyer: same parameters give the same hooks). x = the mast's foot, y = the floor; the base runs back from the mast, the boom pivots at
   the mast top and reaches out (facing -1: to the left, the default) over the patient; the spreader bar hangs from the boom tip on a swivel and sways by theta. */
A.HOYER = { mastH: 640, boom: 420, a0: -.24, a1: .36, swivel: 40, bar: 150, hookIn: 118, baseLen: 470 };
A.hoyerInfo = function (o) {
  const H = Object.assign({}, A.HOYER, o.geo || {}), s = o.s || 1, f = o.facing === 1 ? -1 : 1, x = o.x, y = o.y;
  const ang = o.ang != null ? o.ang : lerp(H.a0, H.a1, clamp(o.lift || 0)), th = (o.theta || 0) * f;
  const pivot = [x - 12 * s * f, y - H.mastH * s], tip = [pivot[0] - H.boom * s * dcos(ang) * f, pivot[1] - H.boom * s * dsin(ang)];
  const ca = dcos(th), sa = dsin(th), R = (dx, dy) => [tip[0] + (dx * ca - dy * sa) * s, tip[1] + (dx * sa + dy * ca) * s];
  const swv = R(0, H.swivel), P = (dx, dy) => R(dx, H.swivel + dy), spr = o.spread ?? 1;
  const bar = { x: swv[0], y: swv[1], rot: th, a: P(-H.bar, 0), b: P(H.bar, 0) };
  const hooks = [P(-H.bar * spr, 12), P(-H.hookIn * spr, 12), P(H.hookIn * spr, 12), P(H.bar * spr, 12)];
  const base = { x0: f > 0 ? x - H.baseLen * s : x - 46 * s, x1: f > 0 ? x + 46 * s : x + H.baseLen * s, y };
  const box = [Math.min(base.x0, tip[0] - H.bar * s) - 10, pivot[1] - 40 * s, Math.max(base.x1, tip[0] + H.bar * s) + 10, y + 8];
  return { box, hooks, tip, pivot, ang, swv, bar, base, s, f };
};
A.hoyer = function (c, o) {
  const I = A.hoyerInfo(o), { s, f, pivot, tip, bar, base } = I, x = o.x, y = o.y, layer = o.layer || 'all', t = tOf(o), blue = o.color || '#2f6fd0', BL = mixc(blue, '#ffffff', .25);
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  if (layer === 'all' || layer === 'back') {
    c.fillStyle = '#9aa6b4'; c.beginPath(); c.roundRect(base.x0 + 30 * s, y - 40 * s, base.x1 - base.x0 - 30 * s, 16 * s, 8 * s); c.fill();   /* the far leg */
    c.fillStyle = 'rgba(20,24,30,.28)'; c.beginPath(); c.ellipse((base.x0 + base.x1) / 2, y + 4 * s, (base.x1 - base.x0) * .62, 14 * s, 0, 0, TAU); c.fill();
    c.fillStyle = lg(c, x - 18 * s, 0, x + 18 * s, 0, [[0, '#f4f6f9'], [.5, '#d6dde6'], [1, '#aeb8c4']]); c.strokeStyle = OUT; c.lineWidth = 3 * s; c.beginPath(); c.roundRect(x - 18 * s, pivot[1] - 6 * s, 36 * s, y - 34 * s - pivot[1] + 6 * s, 8 * s); c.fill(); c.stroke();   /* the mast */
    c.fillStyle = blue; c.fillRect(x - 18 * s, y - 300 * s, 36 * s, 26 * s);
    c.fillStyle = '#e8ecf2'; c.beginPath(); c.roundRect(x + (f > 0 ? 14 : -100) * s, y - 452 * s, 86 * s, 18 * s, 9 * s); c.fill(); c.stroke();   /* the push handle */
    c.fillStyle = '#2b2f38'; c.beginPath(); c.roundRect(x + (f > 0 ? 66 : -106) * s, y - 456 * s, 40 * s, 26 * s, 10 * s); c.fill();
    c.strokeStyle = '#3a3f4a'; c.lineWidth = 3 * s; c.beginPath(); for (let i = 0; i <= 14; i++) { const yy = y - 420 * s + i * 10 * s, xx = x + f * (26 + 6 * dsin(i * 2.2)) * s; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();   /* the pendant's coiled cord */
    const px = x + f * 14 * s - (f > 0 ? 0 : 26 * s); c.fillStyle = '#f2f4f7'; c.strokeStyle = OUT; c.lineWidth = 2.5 * s; c.beginPath(); c.roundRect(px, y - 286 * s, 26 * s, 52 * s, 6 * s); c.fill(); c.stroke();   /* the hand control: up (green), down (red) */
    c.fillStyle = '#2f9a4a'; c.beginPath(); c.arc(px + 13 * s, y - 270 * s, 5 * s, 0, TAU); c.fill(); c.fillStyle = '#c62828'; c.beginPath(); c.arc(px + 13 * s, y - 252 * s, 5 * s, 0, TAU); c.fill();
    const bm = [lerp(pivot[0], tip[0], .42), lerp(pivot[1], tip[1], .42)];   /* the actuator and the boom */
    c.strokeStyle = '#7d8794'; c.lineWidth = 16 * s; c.beginPath(); c.moveTo(x - 4 * s * f, y - 250 * s); c.lineTo(bm[0], bm[1]); c.stroke();
    c.strokeStyle = '#c3cbd6'; c.lineWidth = 9 * s; c.beginPath(); c.moveTo(x - 4 * s * f, y - 250 * s); c.lineTo(lerp(x, bm[0], .55), lerp(y - 250 * s, bm[1], .55)); c.stroke();
    c.strokeStyle = OUT; c.lineWidth = 30 * s; c.beginPath(); c.moveTo(pivot[0], pivot[1]); c.lineTo(tip[0], tip[1]); c.stroke();
    c.strokeStyle = '#e9edf2'; c.lineWidth = 24 * s; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(pivot[0], pivot[1] - 6 * s); c.lineTo(tip[0], tip[1] - 6 * s); c.stroke();
    c.fillStyle = blue; c.beginPath(); c.arc(pivot[0], pivot[1], 16 * s, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3 * s; c.stroke();
  }
  if (layer === 'all' || layer === 'bar') {
    c.strokeStyle = '#5a6270'; c.lineWidth = 8 * s; c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(bar.x, bar.y); c.stroke();
    c.fillStyle = blue; c.beginPath(); c.arc(tip[0], tip[1], 13 * s, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3 * s; c.stroke();
    c.strokeStyle = OUT; c.lineWidth = 18 * s; c.beginPath(); c.moveTo(bar.a[0], bar.a[1]); c.quadraticCurveTo(bar.x, bar.y - 22 * s, bar.b[0], bar.b[1]); c.stroke();
    c.strokeStyle = '#d6dde6'; c.lineWidth = 12 * s; c.stroke(); c.strokeStyle = BL; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(lerp(bar.a[0], bar.x, .3), lerp(bar.a[1], bar.y - 16 * s, .3)); c.lineTo(lerp(bar.b[0], bar.x, .3), lerp(bar.b[1], bar.y - 16 * s, .3)); c.stroke();
    for (const [hx, hy] of I.hooks) { c.strokeStyle = '#4a5260'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(hx, hy - 14 * s); c.lineTo(hx, hy); c.arc(hx + 6 * s, hy, 6 * s, PI, PI * .1, true); c.stroke(); }
  }
  if (layer === 'all' || layer === 'front') {
    c.fillStyle = lg(c, 0, y - 30 * s, 0, y - 10 * s, [[0, '#e3e8ee'], [1, '#b5bfcb']]); c.strokeStyle = OUT; c.lineWidth = 3 * s; c.beginPath(); c.roundRect(base.x0, y - 34 * s, base.x1 - base.x0, 20 * s, 10 * s); c.fill(); c.stroke();   /* the near leg */
    const spin = o.wheelRot || 0;
    for (const cx of [base.x0 + 22 * s, base.x1 - 22 * s]) { c.fillStyle = '#5a6270'; c.fillRect(cx - 4 * s, y - 18 * s, 8 * s, 8 * s); c.fillStyle = '#1e2128'; c.beginPath(); c.arc(cx, y - 6 * s, 12 * s, 0, TAU); c.fill(); c.strokeStyle = '#8a929e'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(cx, y - 6 * s); c.lineTo(cx + dcos(spin) * 9 * s, y - 6 * s + dsin(spin) * 9 * s); c.stroke(); }
  }
  c.restore();
  return { box: I.box, hooks: I.hooks, tip, pivot, bar, base };
};
/* a gait belt that is not simulated: 'coil' (rolled up in a hand: a spiral of canvas strap, the metal buckle on the outside) or 'strap' (from a to b, a slight sag, the buckle at a) */
A.gaitBelt = function (c, o) {
  const col = o.color || '#e9e1cd', st = o.stripe || '#2f6fd0', t = tOf(o), mode = o.mode || 'coil';
  const buckle = (x, y, a, k) => { c.save(); c.translate(x, y); c.rotate(a); c.scale(k, k); c.strokeStyle = OUT; c.lineWidth = 9; c.beginPath(); c.roundRect(-13, -17, 26, 34, 6); c.stroke(); c.strokeStyle = '#c9d0da'; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-10, -13); c.lineTo(10, -13); c.stroke(); c.fillStyle = '#8f99a6'; c.fillRect(-2, -15, 4, 30); c.restore(); };
  if (mode === 'strap') {
    const a = o.a, b = o.b, w = (o.w || 26) * (o.s || 1), sag = o.sag || 0, n = 16, P = [];
    for (let i = 0; i <= n; i++) { const u = i / n; P.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + dsin(u * PI) * sag]); }
    c.save(); c.lineCap = 'butt'; c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = w + 5; c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.strokeStyle = st; c.lineWidth = w * .18; c.stroke();
    buckle(a[0], a[1], Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]), w / 26); c.restore();
    return [Math.min(a[0], b[0]) - w, Math.min(a[1], b[1]) - w, Math.max(a[0], b[0]) + w, Math.max(a[1], b[1]) + sag + w];
  }
  begin(c, o, 0);
  c.strokeStyle = OUT; c.lineWidth = 30; c.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU * 2.3, r = 14 + i * .55; i ? c.lineTo(dcos(a) * r * 1.25, dsin(a) * r) : c.moveTo(dcos(a) * r * 1.25, dsin(a) * r); } c.stroke();
  c.strokeStyle = col; c.lineWidth = 24; c.stroke(); c.strokeStyle = st; c.lineWidth = 4; c.stroke();
  c.strokeStyle = col; c.lineWidth = 24; c.beginPath(); c.moveTo(48 * 1.25 * .2, 46); c.quadraticCurveTo(60, 70 + dsin(t * 2) * 3, 70, 110); c.stroke(); c.strokeStyle = st; c.lineWidth = 4; c.stroke();   /* the free end hangs down */
  buckle(46, -30, .6, 1);
  c.restore();
  return boxOf(o, 170, 230);
};
/* string lights: a sagging wire between a and b, n bulbs hanging from it; returns { box, lights } in the caller's units (like tree) */
A.stringLights = function (c, o) {
  const a = o.a, b = o.b, sag = o.sag ?? 40, n = o.n || 8, t = tOf(o), seed = o.seed || 1, s = o.s || 1, lit = o.lit ?? 1, glow = o.glow ?? .5, br = 9 * s, out = [];
  const at = u => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + 4 * sag * u * (1 - u)];
  c.save(); c.strokeStyle = 'rgba(14,30,18,.9)'; c.lineWidth = 2.4 * s; c.beginPath(); for (let i = 0; i <= 20; i++) { const p = at(i / 20); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, p = at(u), q = at(u + .01), ang = Math.atan2(q[1] - p[1], q[0] - p[0]) + PI / 2, col = A.LIGHT_COLORS[(i + seed * 3) % A.LIGHT_COLORS.length], phase = rnd(seed + 200, i), lv = lit * A.twinkle(t, phase);
    const bx = p[0] + dcos(ang) * br * 1.4, by = p[1] + dsin(ang) * br * 1.4;
    if (glow > 0 && lv > .02) { const gr = br * 7 * (.75 + .25 * lv); c.save(); c.globalAlpha *= glow * lv; c.drawImage(glowSprite(col), bx - gr, by - gr, gr * 2, gr * 2); c.restore(); }
    c.save(); c.translate(bx, by); c.rotate(ang - PI / 2);
    c.fillStyle = '#2a3a2a'; c.fillRect(-br * .45, -br * 1.6, br * .9, br * .75);
    c.fillStyle = V2.rgba(V2.mix(V2.mix(col, '#2a2a2a', .5), V2.mix(col, '#ffffff', .16), lv), 1); c.beginPath(); c.ellipse(0, 0, br * .78, br * 1.05, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,20,20,.55)'; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = 'rgba(255,255,255,' + (.35 + .5 * lv).toFixed(3) + ')'; c.beginPath(); c.ellipse(-br * .2, -br * .3, br * .22, br * .34, 0, 0, TAU); c.fill();
    c.restore();
    out.push({ x: bx, y: by, color: col, phase, r: br });
  }
  c.restore();
  return { box: [Math.min(a[0], b[0]) - br * 3, Math.min(a[1], b[1]) - br * 3, Math.max(a[0], b[0]) + br * 3, Math.max(a[1], b[1]) + sag + br * 3], lights: out };
};
/* tinsel along a polyline (a SOFT2D rope's points, or your own): a fluffy strand of foil, a slow sparkle (never in sync) */
A.tinsel = function (c, pts, o = {}) {
  if (!pts || pts.length < 2) return [0, 0, 0, 0];
  const t = tOf(o), w = o.width || 16, col = o.color || '#e8c04a', seed = o.seed || 1, dk = mixc(col, '#3a2400', .45), lt2 = mixc(col, '#ffffff', .5);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = dk; c.lineWidth = w * .55; c.beginPath(); pts.forEach(([x, y], i) => { i ? c.lineTo(x, y) : c.moveTo(x, y); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }); c.stroke();
  const strands = [[], [], []]; let n = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L, ny = (bx - ax) / L, m = Math.max(2, Math.round(L / (w * .22)));
    for (let j = 0; j < m; j++, n++) { const u = j / m, x = lerp(ax, bx, u), y = lerp(ay, by, u), a = (rnd(seed, n) - .5) * 2.4, r = w * (.35 + .25 * rnd(seed + 1, n)), dx = nx * dcos(a) - ny * dsin(a), dy = ny * dcos(a) + nx * dsin(a), sgn = n % 2 ? 1 : -1; strands[n % 3].push([x, y, x + dx * r * sgn, y + dy * r * sgn]); }
  }
  const cols = [col, dk, lt2];
  for (let k = 0; k < 3; k++) { c.strokeStyle = cols[k]; c.lineWidth = Math.max(1.2, w * .1); c.beginPath(); for (const [a1, b1, a2, b2] of strands[k]) { c.moveTo(a1, b1); c.lineTo(a2, b2); } c.stroke(); }
  c.fillStyle = 'rgba(255,252,225,.95)';   /* glints: each fades in and out slowly */
  let g = 0; for (let i = 0; i < pts.length; i += 2, g++) { const lv = A.twinkle(t * .7, rnd(seed + 50, g)); if (lv < .82) continue; const [x, y] = pts[i]; c.globalAlpha = (lv - .82) * 5; starPath(c, x, y, w * .45, w * .1); c.fill(); }
  c.restore();
  return [x0 - w, y0 - w, x1 + w, y1 + w];
};
/* a curled ribbon end (curling ribbon): a helix hanging from x, y */
A.ribbonCurl = function (c, o) {
  const col = o.color || '#e8b93a', len = o.len || 120, turns = o.turns || 3.5, t = tOf(o), seed = o.seed || 1, dk = mixc(col, '#3a2400', .4), R = o.r || 12, w = o.w || 7;
  begin(c, o, 0); c.rotate(dsin(t * 1.4 + seed) * .06);
  for (let i = 0; i < 64; i++) {
    const u0 = i / 64, u1 = (i + 1) / 64, a0 = u0 * turns * TAU, a1 = u1 * turns * TAU, front = dcos((a0 + a1) / 2) > 0;
    c.strokeStyle = front ? col : dk; c.lineWidth = w * (front ? 1 : .7) * (1 - u0 * .3); c.beginPath(); c.moveTo(dsin(a0) * R * (1 - u0 * .3), u0 * len); c.lineTo(dsin(a1) * R * (1 - u1 * .3), u1 * len); c.stroke();
  }
  c.restore();
  return boxOf(o, R * 2 + w * 2, len * 2);
};
/* a wreath (outer radius 80 at s 1): a ring of fir with berries and a red bow at the bottom (the ring is one cached sprite) */
const WREATHS = new Map();
A.wreath = function (c, o) {
  const s = o.s || 1, t = tOf(o), seed = o.seed || 3, res = clamp(Math.ceil(scrScale(c) * s * 2) / 2, .5, 3), key = seed + '|' + res;
  let sp = WREATHS.get(key);
  if (!sp) {
    sp = document.createElement('canvas'); sp.width = sp.height = Math.ceil(184 * res); const g = sp.getContext('2d'); g.scale(res, res); g.translate(92, 92); g.lineCap = 'round';
    g.strokeStyle = 'rgba(8,30,14,.95)'; g.lineWidth = 46; g.beginPath(); g.arc(0, 0, 58, 0, TAU); g.stroke();
    g.strokeStyle = '#1f6b36'; g.lineWidth = 40; g.stroke();
    for (let i = 0; i < 260; i++) { const a = rnd(seed, i) * TAU, r = 58 + (rnd(seed + 1, i) - .5) * 38, d = a + (rnd(seed + 2, i) - .5) * 1.2 + PI / 2, L = 9 + 6 * rnd(seed + 3, i); g.strokeStyle = i % 3 ? '#2f8a4a' : i % 2 ? '#174f28' : '#58b06a'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(dcos(a) * r, dsin(a) * r); g.lineTo(dcos(a) * r + dcos(d) * L, dsin(a) * r + dsin(d) * L); g.stroke(); }
    for (let i = 0; i < 16; i++) { const a = rnd(seed + 5, i) * TAU, r = 58 + (rnd(seed + 6, i) - .5) * 26; g.fillStyle = OUT; g.beginPath(); g.arc(dcos(a) * r, dsin(a) * r, 6.6, 0, TAU); g.fill(); g.fillStyle = '#d62839'; g.beginPath(); g.arc(dcos(a) * r, dsin(a) * r, 5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(dcos(a) * r - 1.6, dsin(a) * r - 1.6, 1.5, 0, TAU); g.fill(); }
    if (WREATHS.size > 10) WREATHS.clear(); WREATHS.set(key, sp);
  }
  c.save(); c.translate(o.x, o.y); c.rotate(o.rot || 0); c.scale(s, s);
  c.drawImage(sp, -92, -92, 184, 184);
  bowDraw(c, 0, 66, 30, o.bowColor || '#d62839', t, seed, 0);
  c.restore();
  return [o.x - 92 * s, o.y - 92 * s, o.x + 92 * s, o.y + 100 * s];
};
/* a Christmas stocking (x, y = the top centre of the cuff, where it hangs): red felt, a white fur cuff, the name on the cuff (UI kit), the toe pointing dir (+1 right) */
A.stocking = function (c, o) {
  const col = o.color || '#c62828', dir = o.dir || 1, t = tOf(o), seed = o.seed || 2, sw = dsin(t * 1.2 + seed) * .03;
  begin(c, o, 0); c.rotate(sw);
  const leg = () => { c.beginPath(); c.moveTo(-40, 30); c.lineTo(40, 30); c.lineTo(40, 150); c.quadraticCurveTo(44, 178, dir * 80, 186); c.quadraticCurveTo(dir * 112, 192, dir * 104, 216); c.quadraticCurveTo(dir * 94, 236, dir * 46, 230); c.lineTo(-dir * 10, 226); c.quadraticCurveTo(-42, 220, -40, 180); c.closePath(); };
  leg(); c.fillStyle = lg(c, -40, 0, 40, 0, [[0, mixc(col, '#ffffff', .2)], [.6, col], [1, mixc(col, '#2a0006', .4)]]); c.fill(); c.strokeStyle = OUT; c.lineWidth = 3.6; c.stroke();
  c.save(); leg(); c.clip(); c.fillStyle = '#f4efe2'; c.beginPath(); c.ellipse(dir * 100, 216, 24, 22, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-dir * 40, 214, 18, 22, 0, 0, TAU); c.fill(); c.restore();   /* white toe and heel */
  c.strokeStyle = 'rgba(40,30,20,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-dir * 30, 0); c.quadraticCurveTo(-dir * 38, -26, -dir * 22, -24); c.stroke();   /* the hanging loop */
  const top = [], bot = []; for (let i = 0; i <= 8; i++) { const x = lerp(-48, 48, i / 8); top.push([x, -2]); bot.push([x, 40]); }
  furBand(c, top, bot, { fill: '#fbf7ef', seed: seed + 3, r: 8, lw: 2.2 });
  if (o.name) propText(c, String(o.name).toUpperCase(), 0, 19, 17, o, { fill: '#8a1622', maxW: 84, grp: o.grp || 'fp22_stocking' });
  c.restore();
  return boxOf(o, 120 + 80, 0).map((v, i) => i === 1 ? o.y - 30 * (o.s || 1) : i === 3 ? o.y + 240 * (o.s || 1) : v);
};

/* the ugly holiday sweater (fp22_sweater, wrap: the body yaw): a knit body from under the mouth to the hem, bands of snowflakes and trees in pixel knit, a ribbed hem; for Tomato (any kind) */
function sweaterDraw(c, o, k, t, yw) {
  const g = o.sw22, p = PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)), rx = k.rx, ry = k.ry, top = k.mouthY + 18 * (k.mw || 26) / 26 + (g.lift || 0), base = g.color, c2 = g.color2, c3 = g.color3;
  c.save(); c.clip(p); c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-rx * 1.3, top - 20); c.quadraticCurveTo(0, top + 26, rx * 1.3, top - 20); c.lineTo(rx * 1.3, ry * 1.4); c.lineTo(-rx * 1.3, ry * 1.4); c.closePath();
  c.fillStyle = rg(c, keyX() * rx * .45, ry * .3, rx * .1, rx * 1.3, [[0, mixc(base, '#ffffff', .18)], [.55, base], [1, mixc(base, '#06140a', .45)]]); c.fill();
  c.save(); c.clip();
  const px = 5.5, off = ((yw * rx) % (px * 12) + px * 12) % (px * 12), band = (y0, motif, col, step) => {   /* a row of pixel-knit motifs, carried round with the yaw */
    c.fillStyle = col;
    for (let x = -rx * 1.4 - off; x < rx * 1.4; x += step) for (let j = 0; j < motif.length; j++) for (let i = 0; i < motif[j].length; i++) if (motif[j][i] === '#') {
      const X = x + i * px, w2 = halfW(o.kind, y0 + j * px) || rx * .5, sq = Math.sqrt(Math.max(0, 1 - (X / (w2 + 1)) * (X / (w2 + 1))));
      if (sq <= .05) continue; c.fillRect(X * (0.92 + .08 * sq), y0 + j * px, px * (.4 + .6 * sq) - .8, px - .8);
    }
  };
  const flake = ['..#..', '#.#.#', '.###.', '#.#.#', '..#..'], tree = ['..#..', '.###.', '#####', '..#..'], zig = ['#...#...', '.#.#.#.#', '..#...#.'];
  band(top + 12, tree, c3, px * 7);
  band(top + 12 + px * 5, zig, c2, px * 8);
  band(top + 12 + px * 9, flake, c2, px * 9);
  c.restore();
  const hemTop = [], hemBot = []; for (let i = 0; i <= 14; i++) { const x = lerp(-rx * .97, rx * .97, i / 14), yb = bottomY(k, x); hemTop.push([x, yb - 18]); hemBot.push([x, yb + 6]); }
  c.fillStyle = c2; c.beginPath(); hemTop.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let i = 14; i >= 0; i--) c.lineTo(hemBot[i][0], hemBot[i][1]); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 28; i++) { const x = lerp(-rx, rx, i / 28) + off % 8; c.moveTo(x, bottomY(k, x) - 18); c.lineTo(x, bottomY(k, x) + 4); } c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.4; c.beginPath(); for (let y = top; y < ry; y += 6) { c.moveTo(-rx, y); c.lineTo(rx, y); } c.stroke();   /* knit rows */
  c.restore();
  c.save(); c.clip(p); c.strokeStyle = mixc(base, '#000000', .35); c.lineWidth = 9; c.beginPath(); for (let i = 0; i <= 20; i++) { const x = lerp(-rx * 1.1, rx * 1.1, i / 20), u = x / (rx * 1.3), y = top - 20 + (1 - u * u) * 23 + 3; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();   /* the ribbed collar */
  c.lineWidth = 5; c.strokeStyle = OUT; c.stroke(p);
}
EXT.acc.fp22_sweater = (o, k, t, layer) => { if (layer === 'mid' && o.sw22) sweaterDraw(ctx, o, k, t, 0); };
A.sweater = function (o, g) {
  o = o || {}; g = Object.assign({ color: '#2f8a4a', color2: '#fbf7ef', color3: '#d62839' }, g || {});
  o.sw22 = g;
  const acc = (o.acc || []).filter(a => a !== 'fp22_sweater' && a !== 'fp22_santacoat');
  o.acc = ['fp22_sweater'].concat(acc);   /* first: the lanyard, badges and the hat go over it */
  return o;
};
if (V2C.YAW_ACC) { const f = (o, k, t, layer, yaw) => { if (layer === 'mid' && o.sw22) sweaterDraw(ctx, o, k, t, yaw || 0); }; f.cls = 'wrap'; V2C.YAW_ACC.fp22_sweater = f; }
/* @@A22-END */
})();
