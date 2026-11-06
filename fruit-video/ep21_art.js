'use strict';
/* SHIFT HAPPENS, Episode 21, "The Inspection": the ART builder's kit, window.A21 (ep21_art.js). Contract: /tmp/shift_tools/briefs/A21_API.md; usage, options and traps: GUIDE_ART21.md in this folder.
 * Registers through the engine's EXT hooks (kinds `kale` and `radish`, everything else prefixed fp21_). Every function is a pure function of its arguments and `t`: no Math.random, no Date, no state.
 * Text only through the UI kit, drawn live (never into a cached sprite).
 *
 * AS BUILT (signatures; the options are in GUIDE_ART21.md)
 *   A21.kale(o)      MS. KALE, State surveyor (who 'kale', kind `kale`): { x, y (feet), s, t, expr kale_neutral | kale_note | kale_raise | kale_satisfied, pose 'clip' (default) | 'write' | 'rest' | 'free',
 *                    cbTicks, cbPen, cbItems, cbFail, raiseK, raiseSide, yaw, headYaw, look, ... } -> drawChar options.
 *   A21.radish(o)    MR. RADISH, State surveyor (who 'radish', kind `radish`): { ..., expr radish_flat | radish_note | radish_impressed | radish_buried, pose 'tablet' (default) | 'clip' | 'write' | 'rest' | 'free',
 *                    scanner 0..1, tabLit } -> drawChar options.
 *   A21.clipboard(ctx, o)   the clipboard as a set piece at any size (title card, inserts): { x, y (centre), w, rot, items, ticks, fail, header, sub, t, hero, ink } -> { box, rows[], sheet, clip }.
 *   Held props: fp21_clipboard (cbTicks, cbItems, cbFail, cbHeader), fp21_pen (penAng), fp21_tablet (tabLit, tabRows, tabTick).  Accessories: fp21_badge (the lanyard and photo badge), fp21_suit,
 *                    fp21_kale_frill, fp21_kale_brows, fp21_kale_glasses, fp21_scanner.
 *   A21.centre(o), A21.faceBox(o): helpers for framing (body centre and the face box in the CURRENT canvas coordinates, after the constructor and the x, y, s merge).
 */
(() => {
if (typeof KINDS === 'undefined' || typeof EXT === 'undefined' || typeof V2 === 'undefined' || typeof V2C === 'undefined') return;
const A = window.A21 = window.A21 || {};
const SC = .44, G = 1316;
const OUT = 'rgba(25,10,20,.92)';
const rnd = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : hash(s * 3.17 + k * 11.3 + 1.3);
const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const tOf = o => (o && o.t != null ? o.t : (typeof T === 'number' ? T : 0));
const mixc = (a, b, k) => V2.rgba(V2.mix(a, b, k), 1);
const yawsOf = o => { const Y = V2C.yawInfo ? V2C.yawInfo(o) : null; return Y ? { y: Y.y, h: Y.h } : { y: o.yaw || 0, h: o.headYaw != null ? o.headYaw : (o.yaw || 0) }; };
const keyX = () => V2.LIGHT.key[0];
const faceAngOf = h => V2C.faceAng ? V2C.faceAng(h) : h;
const scrScale = () => { const m = ctx.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; };
const lamb = (nx, ny, nz) => { const L = V2.LIGHT, kx = L.key[0], ky = L.key[1], kz = .62, kl = Math.hypot(kx, ky, kz); return clamp((nx * kx + ny * ky + nz * kz) / (kl * Math.hypot(nx, ny, nz) || 1)); };
function lit(base, lam, amt = 1) {   /* a base colour lit by lam (0 shadow .. 1 full key), following V2.setLight (copied from ep19_art.js) */
  const L = V2.LIGHT;
  const dk = V2.mix(base, L.shadow, clamp(.62 * (1 - lam) * amt * Math.min(1.6, L.shadowA / .3)));
  const wm = V2.mix(dk, L.keyColor, clamp((lam - .5) * .7) * .3 * amt * Math.min(1.6, L.keyA / .22));
  return V2.rgba(wm, 1);
}
A.PLATES = A.PLATES || {};

// ================================================================== silhouettes: bezier halves (mirrored), a half-width function per kind
function bez(p0, p1, p2, p3, u) { const a = 1 - u; return [a * a * a * p0[0] + 3 * a * a * u * p1[0] + 3 * a * u * u * p2[0] + u * u * u * p3[0], a * a * a * p0[1] + 3 * a * a * u * p1[1] + 3 * a * u * u * p2[1] + u * u * u * p3[1]]; }
function profileOf(segs, n = 16) {
  const tab = []; for (const sg of segs) for (let i = 0; i <= n; i++) tab.push(bez(sg[0], sg[1], sg[2], sg[3], i / n));
  return y => { if (y <= tab[0][1]) return tab[0][0]; for (let i = 1; i < tab.length; i++) if (y <= tab[i][1] || i === tab.length - 1) { const a = tab[i - 1], b = tab[i], u = (y - a[1]) / ((b[1] - a[1]) || 1); return Math.max(0, lerp(a[0], b[0], clamp(u))); } return 0; };
}
function mirrorPath(p, segs) {
  p.moveTo(segs[0][0][0], segs[0][0][1]);
  for (const s2 of segs) p.bezierCurveTo(s2[1][0], s2[1][1], s2[2][0], s2[2][1], s2[3][0], s2[3][1]);
  for (let i = segs.length - 1; i >= 0; i--) { const s2 = segs[i]; p.bezierCurveTo(-s2[2][0], s2[2][1], -s2[1][0], s2[1][1], -s2[0][0], s2[0][1]); }
  p.closePath();
}
/* the half width of ANY kind at a height y (rasterised once per kind from the engine's own path, as A20.halfW): for accessories worn by other characters */
const HW = {}; let hwCtx = null;
function halfW(kind, y) {
  if (PROFS[kind]) return PROFS[kind](y);
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

// ================================================================== two new kinds: `kale` (MS. KALE) and `radish` (MR. RADISH)
Object.assign(KINDS, {
  kale: { rx: 100, ry: 140, shape: 'kale', tex: 'kale', c: ['#6fae52', '#2e7438', '#113619'], eyeY: -36, eyeX: 34, mouthY: 14, er: 20, mw: 21, leg: 84, hip: 32, arm1: 54, arm2: 50, shoe: '#1c2340', shoe2: '#5a638e', yawOwn: true },
  radish: { rx: 110, ry: 104, shape: 'radish', tex: 'radish', c: ['#ff95a3', '#da2443', '#6c0b20'], eyeY: -22, eyeX: 37, mouthY: 24, er: 21, mw: 24, leg: 80, hip: 36, arm1: 56, arm2: 52, shoe: '#26242b', shoe2: '#57545f', yawOwn: true },
});
Object.assign(TOPS, { kale: 178, radish: 160 });
Object.assign(EXPR, {
  kale_neutral: { ang: .05, raise: -1, curve: .04, lid: .3, wide: .96, pup: .82 },        /* precise, polite, unreadable */
  kale_note: { ang: .07, raise: -3, curve: 0, lid: .54, wide: .94, pup: .8 },              /* writing: eyes down (the constructor looks down for her) */
  kale_raise: { ang: .08, raise: 0, curve: -.04, lid: .24, wide: 1, pup: .8 },             /* one eyebrow up (her own brows: fp21_kale_brows, raiseK / raiseSide) */
  kale_satisfied: { ang: -.02, raise: 1, curve: .3, lid: .34, wide: .97, pup: .84 },       /* the smallest smile */
  radish_flat: { ang: .02, raise: -3, curve: 0, lid: .42, wide: .94, pup: .78 },           /* the default: nothing moves */
  radish_note: { ang: .05, raise: -4, curve: -.04, lid: .56, wide: .93, pup: .78 },        /* noting (the constructor looks down for him) */
  radish_impressed: { ang: -.04, raise: -1, curve: .06, lid: .38, wide: .96, pup: .8 },    /* eyebrows up 2 px: that is the most he moves */
  radish_buried: { ang: -.08, raise: 0, curve: -.1, lid: .46, wide: .96, pup: .8 },        /* under the binders (the constructor hides the legs and raises one arm) */
});
const KALE_SEGS = (() => { const rx = KINDS.kale.rx, ry = KINDS.kale.ry; return [
  [[0, -ry], [rx * .52, -ry * 1.0], [rx * .97, -ry * .66], [rx * 1.0, -ry * .16]],
  [[rx * 1.0, -ry * .16], [rx * 1.03, ry * .36], [rx * .78, ry * .9], [rx * .34, ry * .99]],
  [[rx * .34, ry * .99], [rx * .2, ry * 1.0], [rx * .09, ry * 1.0], [0, ry]]]; })();
const RAD_SEGS = (() => { const rx = KINDS.radish.rx, ry = KINDS.radish.ry; return [
  [[0, -ry * .97], [rx * .6, -ry * 1.0], [rx * 1.0, -ry * .6], [rx * 1.0, -ry * .02]],
  [[rx * 1.0, -ry * .02], [rx * 1.0, ry * .52], [rx * .62, ry * .9], [rx * .2, ry * .99]],
  [[rx * .2, ry * .99], [rx * .11, ry * 1.0], [rx * .05, ry * 1.0], [0, ry]]]; })();
const PROFS = { kale: profileOf(KALE_SEGS), radish: profileOf(RAD_SEGS) };
const kaleR = PROFS.kale, radR = PROFS.radish;
EXT.shape.kale = p => mirrorPath(p, KALE_SEGS);
EXT.shape.radish = p => mirrorPath(p, RAD_SEGS);

/* where the face sits on the turned head (for the soft patch under it and to keep surface marks off it) */
function faceZoneOf(o, k, R) {
  const fa = faceAngOf(yawsOf(o).h), ca = Math.cos(fa);
  if (ca < .08) return null;
  const yc = (k.eyeY + k.mouthY) / 2 + 2;
  return { cx: R(yc) * .94 * Math.sin(fa), cy: yc, ax: (k.eyeX + k.er * 1.7 + 16) * Math.max(.3, ca), ay: (k.mouthY - k.eyeY) / 2 + k.er * 1.55 + 14, ca };
}
const inFace = (z, x, y, pad = 0) => z && Math.hypot((x - z.cx) / (z.ax + pad), (y - z.cy) / (z.ay + pad)) < 1;

// ================================================================== KALE's skin: a pale patch under the face, the midrib and its veins, crinkles (puckers) mapped onto the sphere
const CRINK = Array.from({ length: 64 }, (_, i) => ({ lon: (rnd(2101, i) * 2 - 1) * PI, v: lerp(-.94, .92, rnd(2102, i)), r: 6 + 8 * rnd(2103, i), a: (rnd(2104, i) - .5) * 1.6, dark: rnd(2105, i) < .62 }));
const VEINS = [[-.62, -.9, .46], [-.5, -.98, .62], [.62, -.9, .46], [.5, -.98, .62], [-.36, .38, .5], [.36, .38, .5]];   /* [dir/len along x, start v, rise]: forehead pairs and two under the chin */
EXT.tex.kale = (o, k, t) => {
  const { rx, ry } = k, yw = yawsOf(o).y, cb = Math.cos(yw), sb = Math.sin(yw), R = kaleR;
  const z = faceZoneOf(o, k, R);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  /* a soft vertical gradient: a darker crown and a darker hem, so the face reads in the light band */
  ctx.fillStyle = V2.grad(0, -ry, 0, ry, [[0, 'rgba(10,40,16,.28)'], [.3, 'rgba(10,40,16,0)'], [.75, 'rgba(10,40,16,0)'], [1, 'rgba(10,40,16,.3)']]); ctx.fillRect(-rx * 1.3, -ry * 1.1, rx * 2.6, ry * 2.2);
  /* the pale leaf round the face: the mouth and brows read on it */
  if (z) { ctx.fillStyle = V2.radial(z.cx, z.cy + 4, 4, Math.max(z.ax, z.ay) * 1.18, [[0, 'rgba(196,232,150,.5)'], [.62, 'rgba(170,218,124,.26)'], [1, 'rgba(170,218,124,0)']]); ctx.fillRect(z.cx - z.ax * 1.6, z.cy - z.ay * 1.5, z.ax * 3.2, z.ay * 3); }
  /* crinkles: little cupped puckers, each a dark crescent with a light lip; off the face, on the near half only */
  for (let i = 0; i < CRINK.length; i++) {
    const c = CRINK[i], y = c.v * ry, a = c.lon + yw, cz = Math.cos(a);
    if (cz < .06) continue;
    const X = R(y) * .95 * Math.sin(a);
    if (inFace(z, X, y, 6)) continue;
    const sx = Math.max(.25, cz), r = c.r;
    ctx.save(); ctx.translate(X, y); ctx.scale(sx, 1); ctx.rotate(c.a);
    ctx.strokeStyle = c.dark ? 'rgba(14,52,22,.55)' : 'rgba(205,240,160,.42)'; ctx.lineWidth = c.dark ? 3 : 2.4;
    ctx.beginPath(); ctx.arc(0, 0, r, .15 * PI, .85 * PI); ctx.stroke();
    if (c.dark) { ctx.strokeStyle = 'rgba(200,238,150,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -3, r * .8, .2 * PI, .8 * PI); ctx.stroke(); }
    ctx.restore();
  }
  /* the midrib: a pale stripe down the front (longitude 0), fat at the hem and thin at the crown, behind the face patch; veins branch off it */
  if (cb > .05) {
    const X = y => R(y) * .965 * sb, seg2 = (y0, y1, w0, w1, al) => {
      const n = 10, L = [], Rr = [];
      for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n), w = lerp(w0, w1, i / n) * Math.max(.3, cb); L.push([X(y) - w / 2, y]); Rr.push([X(y) + w / 2, y]); }
      ctx.beginPath(); L.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = n; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]); ctx.closePath();
      ctx.fillStyle = `rgba(222,246,186,${al})`; ctx.fill(); ctx.strokeStyle = `rgba(40,96,42,${al * .7})`; ctx.lineWidth = 1.6; ctx.stroke();
    };
    const ft = k.eyeY - k.er * 2.75, fb = k.mouthY + 30;
    seg2(-ry * .985, ft, 4, 9, .82 * cb);   /* crown to the forehead (the leaf's "parting") */
    seg2(ft, fb, 9, 12, .16 * cb);         /* a ghost of it behind the face */
    seg2(fb, ry * .99, 12, 16, .72 * cb);  /* chin to hem (mostly under the jacket) */
    ctx.strokeStyle = `rgba(214,242,176,${.55 * cb})`;
    for (const [dx, v0, rise] of VEINS) {
      const y0 = v0 * ry * (v0 < 0 ? .8 : 1), x0 = X(y0), lon = Math.sign(dx) * Math.abs(dx) * 1.2, a = lon + yw;
      if (Math.cos(a) < .1) continue;
      const y1 = y0 + rise * ry * (v0 < 0 ? .5 : .5), x1 = R(y1) * .9 * Math.sin(a);
      if (inFace(z, x1, y1, 0) || inFace(z, (x0 + x1) / 2, (y0 + y1) / 2, 0)) continue;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(lerp(x0, x1, .5), y0 + (y1 - y0) * .2, x1, y1); ctx.stroke();
    }
  }
  ctx.restore();
};
EXT.top.kale = () => {};   /* the curly crown is the frill accessory (fp21_kale_frill), drawn in the mid layer over the body's edge */

// ================================================================== RADISH's skin: the white lower third, fine rings, root hairs; the leaf tuft on top and the white root tip below
const RHAIR = Array.from({ length: 14 }, (_, i) => ({ lon: (rnd(2201, i) * 2 - 1) * PI, v: lerp(.5, .9, rnd(2202, i)), len: 5 + 7 * rnd(2203, i), a: .3 + rnd(2204, i) * .9 }));
EXT.tex.radish = (o, k, t) => {
  const { rx, ry } = k, yw = yawsOf(o).y, R = radR;
  ctx.save(); ctx.lineCap = 'round';
  /* white lower third: the radish turns white toward the root */
  ctx.fillStyle = V2.grad(0, ry * .22, 0, ry, [[0, 'rgba(255,236,240,0)'], [.38, 'rgba(255,226,234,.55)'], [.7, 'rgba(255,246,248,.92)'], [1, 'rgba(250,240,244,.98)']]); ctx.fillRect(-rx * 1.3, ry * .2, rx * 2.6, ry * .9);
  /* the pink blush where the red gives way */
  ctx.fillStyle = V2.grad(0, ry * .28, 0, ry * .62, [[0, 'rgba(255,120,150,0)'], [.5, 'rgba(255,120,150,.28)'], [1, 'rgba(255,120,150,0)']]); ctx.fillRect(-rx * 1.3, ry * .28, rx * 2.6, ry * .36);
  /* fine rings round the body (latitudes: the same from every side) */
  ctx.strokeStyle = 'rgba(120,10,30,.16)'; ctx.lineWidth = 2.2;
  for (const v of [-.42, -.12, .14]) { const y = v * ry, w = R(y); ctx.beginPath(); ctx.ellipse(0, y, w * .98, 7, 0, .1 * PI, .9 * PI); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,120,140,.22)'; for (const v of [.48, .7]) { const y = v * ry, w = R(y); ctx.beginPath(); ctx.ellipse(0, y, w * .97, 6, 0, .08 * PI, .92 * PI); ctx.stroke(); }
  /* root hairs on the white part, on the sphere */
  ctx.strokeStyle = 'rgba(150,110,110,.42)'; ctx.lineWidth = 1.6;
  for (const h of RHAIR) { const a = h.lon + yw, cz = Math.cos(a); if (cz < .2) continue; const y = h.v * ry, X = R(y) * .96 * Math.sin(a); ctx.beginPath(); ctx.moveTo(X, y); ctx.quadraticCurveTo(X + Math.sin(a) * h.len, y + h.len * .4, X + Math.sin(a) * h.len * 1.4, y + h.len); ctx.stroke(); }
  ctx.restore();
};
/* the tuft: three short stems with leaves on longitudes (they turn with the head), and two behind */
const TUFT = [[-.55, 30, 46, -.42], [0, 38, 54, .04], [.6, 28, 44, .46], [2.5, 26, 40, .4], [-2.5, 26, 40, -.4]];   /* [lon, stem length, leaf length, lean] */
function radishLeaf(L, sx, kx, t, seed) {
  const [lon, sl, ll, lean] = L, sw = Math.sin(t * 2.2 + lon * 3 + seed) * .035;
  ctx.save(); ctx.rotate(lean + sw); ctx.scale(Math.max(.35, sx), 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(2, -sl * .5, 0, -sl); ctx.stroke();
  ctx.strokeStyle = '#c23a55'; ctx.lineWidth = 5.2; ctx.stroke();
  ctx.translate(0, -sl + 4);
  ctx.beginPath(); ctx.moveTo(0, 0);
  for (let i = 0; i <= 8; i++) { const u = i / 8, w = 15 * Math.sin(u * PI) * (1 + .18 * Math.sin(u * 22)); ctx.lineTo(w, -u * ll); }
  for (let i = 8; i >= 0; i--) { const u = i / 8, w = 15 * Math.sin(u * PI) * (1 + .18 * Math.sin(u * 22 + 1.3)); ctx.lineTo(-w, -u * ll); }
  ctx.closePath();
  ctx.fillStyle = V2.grad(-15, 0, 15, 0, kx < 0 ? [[0, '#8fd060'], [1, '#3a8a34']] : [[0, '#3a8a34'], [1, '#8fd060']]); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 3.2; ctx.stroke();
  ctx.strokeStyle = 'rgba(230,250,200,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -ll * .86); ctx.stroke();
  ctx.restore();
}
EXT.top.radish = (o, k, t, layer) => {
  const ry = k.ry;
  if (layer === 'back') {   /* the white root tip, hanging between the legs */
    if (o.noLegs || o.root === false) return;
    const sw = Math.sin(t * 1.7 + (o.seed || 0)) * 2;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pts = [[0, ry * .9], [2, ry + 14], [6 + sw * .5, ry + 30], [3 + sw, ry + 44]];
    ctx.strokeStyle = OUT; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); ctx.stroke();
    ctx.strokeStyle = '#f7eef0'; ctx.lineWidth = 7.5; ctx.stroke();
    ctx.restore();
    return;
  }
  if (layer !== 'front' || o.tuft === false) return;
  const h = yawsOf(o).h, kx = keyX(), seed = (o.seed || 0) * .1;
  const list = TUFT.map(L => ({ L, z: Math.cos(L[0] + h), x: 14 * Math.sin(L[0] + h), lean: .78 * Math.sin(L[0] + h) })).sort((a, b) => a.z - b.z);
  ctx.save(); ctx.translate(0, -ry * .95);
  for (const e of list) { ctx.save(); ctx.translate(e.x, 0); radishLeaf([e.L[0], e.L[1], e.L[2], e.lean], Math.abs(Math.cos(e.L[0] + h)) * .6 + .4, kx, t, seed); ctx.restore(); }
  ctx.restore();
};
// ================================================================== face-mapped helpers: where a front feature at (x, y) sits on the turned head (the same sums as v2_char.js faceYaw / place)
const profWP = (P, y) => { const f = clamp((y - P.y0) / P.dy, 0, P.N - .001), i = Math.floor(f), u = f - i; return Math.max(8, lerp(P.w[i], P.w[i + 1], u)); };
const faceRad = (o, k, P, y) => P ? (P.mode === 'flat' ? (k.yawThick ?? Math.min(profWP(P, y) * .42, 60)) : profWP(P, y) * .94) : Math.max(8, halfW(o.kind, y)) * .94;
const bodyRad = (o, k, P, y) => P ? profWP(P, y) * .97 : Math.max(8, halfW(o.kind, y)) * .97;
function placeF(o, k, P, ang, x, y, hw = 0, boost = false) {
  if (!P) return { X: x, cz: 1, sc: 1, vis: 1 };
  const pf = sm(.9, 1.3, Math.abs(ang)), lf = 1 - sm(1.6, 1.95, Math.abs(ang));
  const R = faceRad(o, k, P, y), lam = Math.asin(clamp(x / R, -.96, .96)), lo = lam + ang, cz = Math.cos(lo);
  let sc = clamp(cz / Math.cos(lam), .1, 1.3); if (boost && cz > .2) sc = lerp(sc, Math.max(sc, .78), pf);
  let X = R * Math.sin(lo);
  if (hw) { const lim = Math.max(0, profWP(P, y) * .985 - hw * sc); X = clamp(X, -lim, lim); }
  return { X, cz, sc, vis: sm(.12, .34, cz) * lf };
}
/* a spot of the front of the BODY after the turn: { X, cz, sc } or null when it has turned out of sight (v2_char.js surf) */
function surfB(o, k, P, yaw, x, y) {
  const R = bodyRad(o, k, P, y), lam = Math.asin(clamp(x / R, -.985, .985)), lo = lam + yaw, cz = Math.cos(lo);
  return cz < .03 ? null : { X: R * Math.sin(lo), cz, sc: cz / Math.cos(lam) };
}

// ================================================================== KALE's curly edge and crown (mid layer: over the body's edge, under the face and the jacket): a ruffled band round the silhouette
const FR = (() => {
  const k = KINDS.kale, ry = k.ry, thS = Math.acos(-20 / ry), N = 64, pts = [];
  for (let i = 0; i <= N; i++) { const th = i / N * thS, y = -ry * Math.cos(th), x = kaleR(y); pts.push({ th, x, y }); }
  for (let i = 0; i <= N; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; pts[i].nx = dy / L; pts[i].ny = -dx / L; }
  pts[0].nx = 0; pts[0].ny = -1;
  return { pts, thS, N, lam: .205 };
})();
function frillOff(th, t, seed) {
  const f = th / FR.lam + .035 * Math.sin(t * 1.3 + seed), crown = 1 - sm(.55, 1.25, th), fade = 1 - .9 * sm(FR.thS - .45, FR.thS, th);
  const amp = lerp(12, 22, crown) * fade, b1 = Math.pow(Math.abs(Math.sin(PI * f)), .55), b2 = Math.pow(Math.abs(Math.sin(PI * f * 2.6 + .7)), .9);
  return (4 + amp * (b1 * .8 + b2 * .26)) * (th < .04 ? th / .04 : 1);
}
EXT.acc.fp21_kale_frill = (o, k, t, layer) => {
  if (layer !== 'mid' || o.kind !== 'kale' || o.frill === false) return;
  const seed = (o.seed || 0) * .37, P2 = FR.pts, n = FR.N, kx = keyX();
  const outer = [], inner = [];
  for (const sd of [-1, 1]) for (let j = 0; j <= n; j++) {
    const i = sd < 0 ? n - j : j, p = P2[i], d = frillOff(p.th, t, seed), di = -10 - 2.2 * Math.sin(p.th * 23 + seed);
    if (sd > 0 && j === 0) continue;
    outer.push([sd * (p.x + p.nx * d), p.y + p.ny * d, p.th, sd]); inner.push([sd * (p.x + p.nx * di), p.y + p.ny * di]);
  }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); outer.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i][0], inner[i][1]); ctx.closePath();
  const R0 = Math.max(k.rx, k.ry) * 1.3;
  const g = ctx.createRadialGradient(-k.rx * .38, -k.ry * .5, k.rx * .06, -k.rx * .1, -k.ry * .2, R0);
  g.addColorStop(0, '#8fca6c'); g.addColorStop(.5, '#3f8a45'); g.addColorStop(1, '#15411f');
  ctx.fillStyle = g; ctx.fill();
  /* the curled lip of each lobe: a dark fold just inside the edge and a light rim on the lobes that face the key light */
  ctx.strokeStyle = 'rgba(16,52,22,.6)'; ctx.lineWidth = 2.6;
  ctx.beginPath(); inner.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  for (let i = 1; i < outer.length - 1; i++) {
    const [x, y, th, sd] = outer[i], f = th / FR.lam, ph = f - Math.floor(f);
    if (ph < .38 || ph > .62 || th < .05) continue;
    const p = P2[Math.round(th / FR.thS * n)], d = frillOff(th, t, seed), mx = sd * (p.x + p.nx * (d * .45 - 4)), my = p.y + p.ny * (d * .45 - 4), ang = Math.atan2(p.ny, sd * p.nx);
    ctx.strokeStyle = 'rgba(14,48,20,.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(mx, my, 6 + d * .22, ang + PI * .62, ang + PI * 1.38); ctx.stroke();
    if (sd * kx < 0 || p.y < -k.ry * .6) { ctx.strokeStyle = 'rgba(214,246,170,.6)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(mx, my, 4 + d * .3, ang - .9, ang + .9); ctx.stroke(); }
  }
  ctx.strokeStyle = OUT; ctx.lineWidth = 3.6; ctx.beginPath(); outer.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  ctx.restore();
};

// ================================================================== the suit (mid layer): a jacket clipped to the body from the collar to a curved hem, a shirt V, notched lapels, a tie or a blouse collar.
// o.suit21 = { color, lapel, shirt, tie (a colour or false), collar (true: blouse collar points), hem (fraction of ry), y0 (collar line, fraction of ry), pocket }. It maps onto the sphere with the body yaw.
const SUITS = { kale: { color: '#22315c', lapel: '#16214a', shirt: '#f6f6fa', tie: false, collar: true, hem: .9, ys: 4, neck: 34, pocket: false, button: '#c9a34a' },
  radish: { color: '#7a808c', lapel: '#5b616c', shirt: '#f7f7fb', tie: '#24345a', collar: false, hem: .8, ys: 6, neck: 30, pocket: true, button: '#3d424c' } };
/* the jacket's geometry in FRONT coordinates: ys = the shoulder line at the silhouette, yN = the collar at the neck (just under the mouth), yV = the bottom of the V, hem */
function suitGeo(o, k) {
  const S = Object.assign({}, SUITS[o.kind] || SUITS.radish, o.suit21 || {}), { rx, ry } = k, yN = k.mouthY + S.neck, hem = ry * S.hem, yV = lerp(yN, hem, .62), xN = rx * .3, xS = rx * .92;
  return { S, ys: S.ys, yN, hem, yV, xN, xS, yC: x => { const a = Math.abs(x); return a <= xN ? yN : lerp(yN, S.ys, sm(xN, xS, a)); } };
}
function suitDraw(o, k, t, yaw, P) {
  const g = suitGeo(o, k), S = g.S, { rx, ry } = k, cb = Math.cos(yaw);
  const mapX = (x, y) => { const R = bodyRad(o, k, P, y), lam = Math.asin(clamp(x / R, -.985, .985)), lo = clamp(lam + yaw, -PI / 2, PI / 2); return R * Math.sin(lo); };
  const poly = (pts, fill, stroke, lw = 2.4) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const X = mapX(x, y); i ? ctx.lineTo(X, y) : ctx.moveTo(X, y); }); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  /* the jacket's top edge seen from this angle: the point of the body under each screen x is on the front (the collar line dips to the neck) or on the back (a high back collar) */
  const R0 = bodyRad(o, k, P, g.ys + 30), top = [];
  for (let i = 0; i <= 28; i++) { const X = lerp(-1.3, 1.3, i / 28) * R0, L0 = Math.asin(clamp(X / R0, -1, 1)) - yaw, L = ((L0 + PI) % TAU + TAU) % TAU - PI; top.push([X, Math.abs(L) <= PI / 2 ? g.yC(R0 * Math.sin(L)) : g.ys - 2]); }
  const bot = []; for (let i = 0; i <= 16; i++) { const x = lerp(1.3, -1.3, i / 16) * rx; bot.push([x, g.hem + 6 * Math.cos(x / rx * 1.2)]); }
  const kxs = keyX() < 0 ? 1 : -1;
  ctx.beginPath(); top.concat(bot).forEach(([x, y], i) => { i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
  ctx.fillStyle = V2.grad(-rx, 0, rx, 0, kxs > 0 ? [[0, mixc(S.color, '#ffffff', .2)], [.5, S.color], [1, mixc(S.color, '#000010', .4)]] : [[0, mixc(S.color, '#000010', .4)], [.5, S.color], [1, mixc(S.color, '#ffffff', .2)]]); ctx.fill();
  ctx.fillStyle = V2.grad(0, g.hem - 30, 0, g.hem + 8, [[0, 'rgba(0,0,20,0)'], [1, 'rgba(0,0,20,.32)']]); ctx.fill();
  ctx.strokeStyle = 'rgba(5,8,20,.75)'; ctx.lineWidth = 3; ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.beginPath(); bot.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  const yN = g.yN, yV = g.yV, xN = g.xN, yL = lerp(yN, yV, .55);
  if (cb > .02) {
    /* the shirt V, the notched lapels, the tie or the blouse collar, a button, a pocket */
    poly([[-xN + 3, yN - 3], [xN - 3, yN - 3], [0, yV]], S.shirt);
    for (const sd of [-1, 1]) {
      poly([[sd * xN, yN - 3], [sd * rx * .03, yV + 3], [sd * rx * .46, yL], [sd * rx * .4, yN + 16], [sd * rx * .58, g.yC(rx * .58) + 3]], S.lapel, 'rgba(5,8,20,.5)', 2);
      if (S.collar) poly([[sd * rx * .04, yN - 2], [sd * (xN + 3), yN - 5], [sd * rx * .24, yN + 17], [sd * rx * .1, yN + 12]], S.shirt, 'rgba(60,70,100,.55)', 1.8);
    }
    if (S.tie) {
      poly([[-8, yN], [8, yN], [5, yN + 12], [-5, yN + 12]], mixc(S.tie, '#000', .2));
      poly([[-5, yN + 12], [5, yN + 12], [9, yV - 8], [0, yV + 2], [-9, yV - 8]], S.tie);
    }
    for (const by of [yV + 9, yV + 26]) if (by < g.hem - 6) { const bx = mapX(rx * .06, by); ctx.fillStyle = S.button; ctx.strokeStyle = 'rgba(10,10,20,.6)'; ctx.lineWidth = 1.6; ell(bx, by, 4.4 * Math.max(.3, cb), 4.4); ctx.fill(); ctx.stroke(); }
    if (S.pocket) { const pts = [[rx * .5, yL + 6], [rx * .78, yL + 3]]; ctx.strokeStyle = 'rgba(10,10,20,.4)'; ctx.lineWidth = 2.4; ctx.beginPath(); pts.forEach(([x, y], i) => { const X = mapX(x, y); i ? ctx.lineTo(X, y) : ctx.moveTo(X, y); }); ctx.stroke(); }
  }
  if (-cb > .03) {   /* from behind: a centre seam with a vent */
    const R = bodyRad(o, k, P, ry * .6), X = -R * Math.sin(yaw), a = sm(.03, .3, -cb);
    ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(8,10,24,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X, g.ys + 10); ctx.lineTo(X, g.hem + 4); ctx.stroke();
  }
  ctx.restore();
}
EXT.acc.fp21_suit = (o, k, t, layer) => { if (layer === 'mid' && o.suit21 !== false) suitDraw(o, k, t, 0, null); };

// ================================================================== KALE's brows (front, face): drawn here so ONE can go up (kale_raise); the engine's brows are made transparent by the constructor
function kaleBrows(o, k, t, ang, P) {
  const E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * E.wide * (o.eyeScale || 1), ex = k.eyeX, ey = k.eyeY;
  const rk = clamp(o.raiseK ?? (o.expr === 'kale_raise' ? 1 : 0)), rs = o.raiseSide || 1;
  ctx.save();
  for (const side of [-1, 1]) {
    const pl = placeF(o, k, P, ang, side * ex, ey, er + 3, true); if (pl.vis <= .01) continue;
    const up = side === rs ? 19 * rk : -3 * rk;
    let a = E.asym ? (side < 0 ? E.ang : -.3) : E.ang; a = lerp(a, side === rs ? -.16 : .22, rk);
    const by = ey - er * 1.42 - E.raise - (o.browUp || 0) - up;
    ctx.save(); ctx.globalAlpha *= pl.vis; ctx.translate(pl.X, by); ctx.rotate(side < 0 ? a : -a); ctx.scale(Math.max(pl.sc, .28), 1);
    const bw = er * .96, w0 = o.kBrowW || 9.5, thI = w0 * 1.1, thO = w0 * .62, arch = (E.arch ?? (E.curve > .5 ? 5 : -1)) + (side === rs ? 9 * rk : 0);
    ctx.fillStyle = o.kBrowColor || '#0e2612'; ctx.beginPath();
    ctx.moveTo(-side * bw, -thI / 2); ctx.quadraticCurveTo(0, -arch - thI / 2, side * bw, -thO / 2); ctx.lineTo(side * bw, thO / 2); ctx.quadraticCurveTo(0, -arch + thI / 2, -side * bw, thI / 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(-side * bw, 0, thI / 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(side * bw, 0, thO / 2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
EXT.acc.fp21_kale_brows = (o, k, t, layer) => { if (layer === 'front' && !o.noFace) kaleBrows(o, k, t, 0, null); };

// ================================================================== glasses on the face (front, face class): each lens is placed like the eye it frames, a bridge, a temple arm to the near ear
// style 'kale': severe rectangles, a heavy browline top bar. style 'scanner' (Radish): chunky gunmetal frames, a sensor on the right temple; o.scanner 0..1 lights the lenses (cyan, a moving scan line).
function glassesDraw(o, k, t, ang, P, style) {
  const er = k.er, ex = k.eyeX, ey = k.eyeY, sc0 = style === 'scanner', w = er * (sc0 ? 1.4 : 1.36), top = ey - er * (sc0 ? 1.2 : 1.24), bot = ey + er * (sc0 ? 1.08 : 1.04), h = bot - top;
  const tilt = o.glassTilt || 0, kk = sc0 ? clamp(o.scanner ?? 0) : 0, frame = sc0 ? '#2b3039' : '#12141c';
  const pl = [-1, 1].map(s => ({ s, p: placeF(o, k, P, ang, s * ex, ey, er + 3, true) }));
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (tilt) { ctx.translate(0, ey); ctx.rotate(tilt); ctx.translate(0, -ey); }
  for (const q of pl.slice().sort((a, b) => a.p.cz - b.p.cz)) {
    const p = q.p; if (p.vis <= .01) continue;
    const x0 = p.X - w * p.sc, ww = w * 2 * p.sc, rad = sc0 ? Math.min(6, ww * .2) : Math.min(2.5, ww * .1);
    ctx.save(); ctx.globalAlpha *= p.vis;
    /* the lens: a faint tint and a glint (cyan and alive when the scanner is on) */
    ctx.save(); ctx.beginPath(); ctx.roundRect(x0, top, ww, h, rad); ctx.clip();
    ctx.fillStyle = sc0 ? `rgba(${Math.round(lerp(40, 62, kk))},${Math.round(lerp(70, 242, kk))},${Math.round(lerp(90, 255, kk))},${.16 + .16 * kk})` : 'rgba(196,222,255,.14)'; ctx.fillRect(x0, top, ww, h);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(x0 + ww * .62, top); ctx.lineTo(x0 + ww * .84, top); ctx.lineTo(x0 + ww * .36, bot); ctx.lineTo(x0 + ww * .14, bot); ctx.closePath(); ctx.fill();
    if (kk > .01) {
      const per = 1.3, u = (t / per) % 1, ys = top + h * (.5 - .44 * Math.cos(u * TAU));
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = V2.grad(0, ys - 12, 0, ys + 2, [[0, 'rgba(62,242,255,0)'], [1, `rgba(62,242,255,${.45 * kk})`]]); ctx.fillRect(x0, ys - 12, ww, 14);
      ctx.fillStyle = `rgba(200,255,255,${.9 * kk})`; ctx.fillRect(x0, ys - 1, ww, 2.2);
      ctx.strokeStyle = `rgba(120,250,255,${.7 * kk})`; ctx.lineWidth = 1.6;
      for (const [cx, cy, dx, dy] of [[x0 + 4, top + 4, 1, 1], [x0 + ww - 4, top + 4, -1, 1], [x0 + 4, bot - 4, 1, -1], [x0 + ww - 4, bot - 4, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx, cy + dy * 6); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * 6 * p.sc, cy); ctx.stroke(); }
    }
    ctx.restore();
    /* the frame */
    ctx.strokeStyle = frame;
    if (sc0) { ctx.lineWidth = 5.2; ctx.beginPath(); ctx.roundRect(x0, top, ww, h, rad); ctx.stroke(); }
    else {
      ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x0, top, ww, h, rad); ctx.stroke();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x0 - 1, top + 1.5); ctx.lineTo(x0 + ww + 1, top + 1.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0 + 3, top - .5); ctx.lineTo(x0 + ww - 3, top - .5); ctx.stroke();
    }
    /* the temple arm to the near ear (only on a turned head) */
    if (P) {
      const R = faceRad(o, k, P, ey), earLo = q.s * (PI / 2 - .12) + ang, ez = Math.cos(earLo);
      if (ez > .2 && Math.abs(ang) > .15) { ctx.globalAlpha *= sm(.2, .45, ez); const Xe = R * Math.sin(earLo), outer = p.X + q.s * w * p.sc, len = Math.min(Math.abs(Xe - outer), er * 1.5); ctx.strokeStyle = frame; ctx.lineWidth = sc0 ? 4 : 3; ctx.beginPath(); ctx.moveTo(outer, top + 6); ctx.lineTo(outer + Math.sign(Xe - outer) * len, top + 9); ctx.stroke(); }
    }
    ctx.restore();
    /* the scanner's sensor on the outer side of the right lens: a small module with a cyan LED */
    if (sc0 && q.s > 0 && p.vis > .2) {
      const mx = p.X + w * p.sc + 2, my = top + 8;
      ctx.save(); ctx.globalAlpha *= p.vis; ctx.fillStyle = '#3a404b'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.roundRect(mx - 2, my - 7, 12 * Math.max(.4, p.sc), 16, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = kk > .01 ? `rgba(120,250,255,${.5 + .5 * kk})` : '#5a6470'; ell(mx + 4 * Math.max(.4, p.sc), my + 1, 3, 3); ctx.fill();
      ctx.restore();
      if (kk > .05) V2.glow(mx + 4, my + 1, 16, '#3ef2ff', .5 * kk, 'screen', .5);
    }
  }
  const a0 = pl[0].p, a1 = pl[1].p;
  if (a0.vis > .3 && a1.vis > .3) { ctx.strokeStyle = frame; ctx.lineWidth = sc0 ? 5 : 4; ctx.beginPath(); ctx.moveTo(a0.X + w * a0.sc, top + h * .3); ctx.lineTo(a1.X - w * a1.sc, top + h * .3); ctx.stroke(); }
  if (kk > .05) for (const q of pl) if (q.p.vis > .3) V2.emit(q.p.X, ey, w * 1.3, '#3ef2ff', .32 * kk * q.p.vis);
  ctx.restore();
}
EXT.acc.fp21_kale_glasses = (o, k, t, layer) => { if (layer === 'front' && !o.noFace && o.glasses !== false) glassesDraw(o, k, t, 0, null, 'kale'); };
EXT.acc.fp21_scanner = (o, k, t, layer) => { if (layer === 'front' && !o.noFace && o.glasses !== false) glassesDraw(o, k, t, 0, null, 'scanner'); };
// ================================================================== the DEPARTMENT OF HEALTH lanyard and photo badge (front, chest): a blue strap V from the collar to a clip, a swinging card with a photo
const BADGE = { kale: { cw: 32, drop: 20, bx: 10, photo: '#4f9a4c' }, radish: { cw: 28, drop: 12, bx: 8, photo: '#da2443' }, other: { cw: 30, drop: 18, bx: 8, photo: '#8a8a9a' } };
function badgeDraw(o, k, t, yaw, P) {
  const B = Object.assign({}, BADGE[o.kind] || BADGE.other, o.badge21 || {}), { rx, ry } = k, y0 = suitGeo(o, k).yN;
  const cw = B.cw, ch = cw * 1.36, bx = B.bx, by = y0 + B.drop + ch * .5, sw = Math.sin(t * 1.6 + (o.seed || 0)) * .045;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the strap: two curves sampled and mapped onto the body; only the part turned toward us is drawn */
  for (const sd of [-1, 1]) {
    const p0 = [sd * rx * .3, y0 - 6], p1 = [sd * rx * .2, y0 + B.drop * .5], p2 = [bx + sd * 4, by - ch * .5 - 6], pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10, a = 1 - u, x = a * a * p0[0] + 2 * a * u * p1[0] + u * u * p2[0], y = a * a * p0[1] + 2 * a * u * p1[1] + u * u * p2[1], q = surfB(o, k, P, yaw, x, y); pts.push(q ? [q.X, y] : null); }
    for (const [col, lw] of [[OUT, 8.6], ['#2a5cc8', 5.6]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); let on = false; for (const p of pts) { if (!p) { on = false; continue; } on ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); on = true; } ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 5]); ctx.beginPath(); let on = false; for (const p of pts) { if (!p) { on = false; continue; } on ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); on = true; } ctx.stroke(); ctx.setLineDash([]);
  }
  const c = surfB(o, k, P, yaw, bx, by);
  if (c) {
    const sc = clamp(c.sc, .12, 1.2), vis = sm(.03, .16, c.cz);
    ctx.globalAlpha *= vis; ctx.translate(c.X, by - ch * .5 - 6); ctx.rotate(sw); ctx.scale(sc, 1);
    /* the clip, then the card hanging from it */
    ctx.fillStyle = '#c9ced8'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; rr(-5, -3, 10, 9, 2); ctx.fill(); ctx.stroke();
    ctx.translate(0, 6);
    ctx.fillStyle = '#fbfbfd'; ctx.lineWidth = 2.6; rr(-cw / 2, 0, cw, ch, 3.5); ctx.fill(); ctx.stroke();
    ctx.save(); rr(-cw / 2, 0, cw, ch, 3.5); ctx.clip();
    ctx.fillStyle = '#1f4fa8'; ctx.fillRect(-cw / 2, 0, cw, ch * .24);
    ctx.fillStyle = '#e2b64a'; ell(-cw * .3, ch * .12, ch * .065, ch * .065); ctx.fill();
    ctx.fillStyle = '#dce8f6'; ctx.fillRect(-cw * .4, ch * .32, cw * .36, ch * .34);
    ctx.fillStyle = B.photo; ell(-cw * .22, ch * .47, cw * .12, ch * .1); ctx.fill(); ctx.fillStyle = mixc(B.photo, '#000', .3); ctx.fillRect(-cw * .38, ch * .58, cw * .32, ch * .08);
    ctx.fillStyle = 'rgba(40,50,70,.4)'; ctx.fillRect(cw * .04, ch * .36, cw * .36, ch * .06); ctx.fillRect(cw * .04, ch * .5, cw * .28, ch * .05);
    ctx.fillStyle = '#c8283c'; ctx.fillRect(-cw / 2, ch * .84, cw, ch * .16);
    ctx.restore();
    /* lettering only where it is big enough to read (dressing; o.badgeText false: none) */
    const px = ch * .16 * scrScale();
    if (o.badgeText !== false && window.UI && px >= 9 && sc > .7) {
      UI.label('DOH', cw * .12, ch * .125, { size: ch * .15, fill: '#ffffff', hero: false, grp: 'fp21_badge', maxW: cw * .56 });
      UI.label(String(o.badgeName || (o.kind === 'kale' ? 'KALE' : o.kind === 'radish' ? 'RADISH' : 'STAFF')).toUpperCase(), 0, ch * .76, { size: ch * .11, fill: '#1d2440', hero: false, grp: 'fp21_badge', maxW: cw * .86 });
    }
  }
  ctx.restore();
}
EXT.acc.fp21_badge = (o, k, t, layer) => { if (layer === 'front' && o.badge21 !== false) badgeDraw(o, k, t, 0, null); };

// ================================================================== the clipboard: one drawing for the held prop and the set piece. Board centre at the origin of the current transform; w x h board units.
// o: { items [strings], ticks (0..n: rows ticked; a fraction draws the last tick on), fail (a row index: a red X), header, sub, t, hero (text), ink, rowAlpha [], scr (screen px per unit) }
const CB_ITEMS = ['FRONT DOOR', 'STAFFING', 'LABELS', 'MED PASS', 'BREAKS'];
function tickPath(x, y, s) { return [[x + s * .12, y + s * .52], [x + s * .4, y + s * .82], [x + s * 1.04, y - s * .26]]; }
function drawPart(pts, f) {   /* a polyline drawn on to fraction f of its length */
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let left = clamp(f) * tot; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) { const u = Math.min(1, left / L[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)); left -= L[i - 1]; }
  ctx.stroke();
}
function cbDraw(w, h, o) {
  const items = o.items || CB_ITEMS, n = items.length, scr = o.scr || scrScale(), ink = o.ink || '#1c2a6e', hero = !!o.hero, grp = o.grp || 'fp21_cb';
  const x0 = -w / 2, y0 = -h / 2, px0 = x0 + w * .075, px1 = -x0 - w * .075, py0 = y0 + h * .055, py1 = -y0 - h * .045, rows = [];
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the board: masonite with a bevel */
  ctx.fillStyle = V2.grad(x0, y0, -x0, -y0, [[0, '#c69560'], [1, '#8f6233']]); rr(x0, y0, w, h, w * .06); ctx.fill();
  ctx.strokeStyle = OUT; ctx.lineWidth = Math.max(1.5, w * .032); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,236,200,.35)'; ctx.lineWidth = Math.max(1, w * .014); rr(x0 + w * .02, y0 + w * .02, w - w * .04, h - w * .04, w * .05); ctx.stroke();
  /* the paper */
  ctx.fillStyle = '#fbfbf6'; ctx.fillRect(px0, py0, px1 - px0, py1 - py0);
  ctx.fillStyle = 'rgba(60,50,40,.12)'; ctx.fillRect(px0, py1 - h * .012, px1 - px0, h * .012);
  /* the header: a navy band (DEPARTMENT OF HEALTH) and a sub line */
  const hy0 = py0 + h * .085, hh = h * .085, sy = hy0 + hh + h * .06;
  ctx.fillStyle = '#1f3270'; ctx.fillRect(px0 + w * .03, hy0, px1 - px0 - w * .06, hh);
  const pw = px1 - px0, tx0 = px0 + w * .06, avail = pw - w * .12;
  const header = o.header ?? 'DEPARTMENT OF HEALTH', sub = o.sub ?? 'SURVEY CHECKLIST';
  const canText = size => window.UI && size * scr >= (o.textMin ?? 7.5);
  if (header && canText(hh * .56)) UI.label(header, 0, hy0 + hh / 2, { size: hh * .56, fill: '#ffffff', hero, grp, maxW: pw - w * .12, spacing: hh * .04 });
  else if (header) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-pw * .3, hy0 + hh * .4, pw * .6, hh * .2); }
  if (sub && canText(h * .036)) UI.label(sub, 0, sy, { size: h * .036, fill: '#1f3270', hero, grp, maxW: avail });
  else if (sub) { ctx.fillStyle = 'rgba(31,50,112,.45)'; ctx.fillRect(-pw * .25, sy - h * .008, pw * .5, h * .016); }
  /* the rows: a box, the item, a rule */
  const r0 = sy + h * .05, pitch = (py1 - h * .035 - r0) / n, bs = Math.min(pitch * .5, w * .1);
  for (let i = 0; i < n; i++) {
    const ry0 = r0 + i * pitch, cy = ry0 + pitch * .5, bx = tx0 + (o.hand < 0 ? w * .19 : 0), by = cy - bs / 2, al = o.rowAlpha && o.rowAlpha[i] != null ? o.rowAlpha[i] : 1;
    ctx.strokeStyle = 'rgba(120,140,180,.55)'; ctx.lineWidth = Math.max(1, h * .005); ctx.beginPath(); ctx.moveTo(px0 + w * .03, ry0 + pitch); ctx.lineTo(px1 - w * .03, ry0 + pitch); ctx.stroke();
    ctx.strokeStyle = '#2a3346'; ctx.lineWidth = Math.max(1.2, bs * .09); ctx.strokeRect(bx, by, bs, bs);
    const txs = bx + bs + w * .05, size = Math.min(pitch * .46, w * .085), str = String(items[i]), tx1 = px1 - w * .04 - (o.hand > 0 ? w * .19 : 0);
    if (al > .01) {
      if (canText(size)) UI.label(str, txs, cy, { size, fill: o.rowInk || '#1d2236', hero, grp, align: 'left', maxW: tx1 - txs, alpha: al });
      else { ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = 'rgba(40,46,70,.42)'; ctx.fillRect(txs, cy - size * .18, (tx1 - txs) * (.55 + .35 * rnd(2301, i)), size * .36); ctx.restore(); }
    }
    const tk = clamp((o.ticks || 0) - i);
    if (tk > 0 && o.fail !== i) { ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.8, bs * .2); drawPart(tickPath(bx, by, bs), tk); }
    if (o.fail === i) {
      const fk = clamp(o.failK ?? 1); ctx.strokeStyle = '#d3203a'; ctx.lineWidth = Math.max(1.8, bs * .2);
      drawPart([[bx + bs * .1, by + bs * .1], [bx + bs * .9, by + bs * .9]], fk * 2); if (fk > .5) drawPart([[bx + bs * .9, by + bs * .1], [bx + bs * .1, by + bs * .9]], fk * 2 - 1);
    }
    rows.push({ cx: (txs + px1) / 2, cy, x0: px0, x1: px1, y0: ry0, y1: ry0 + pitch, box: [bx, by, bx + bs, by + bs], text: [txs, cy], size });
  }
  /* the steel clip over the top of the paper */
  const cw2 = w * .44, cy0 = y0 - h * .025, chh = h * .105;
  ctx.fillStyle = V2.grad(0, cy0, 0, cy0 + chh, [[0, '#f0f3f8'], [.5, '#b9c1cc'], [1, '#848d9a']]); ctx.strokeStyle = OUT; ctx.lineWidth = Math.max(1.4, w * .022); rr(-cw2 / 2, cy0, cw2, chh, w * .03); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#59616e'; ctx.lineWidth = Math.max(1.2, w * .016); ctx.beginPath(); ctx.moveTo(-cw2 * .3, cy0 + chh * .2); ctx.quadraticCurveTo(0, cy0 - chh * .55, cw2 * .3, cy0 + chh * .2); ctx.stroke();
  ctx.fillStyle = '#6b7380'; for (const sd of [-1, 1]) { ell(sd * cw2 * .36, cy0 + chh * .55, w * .016, w * .016); ctx.fill(); }
  ctx.restore();
  return { rows, sheet: [px0, py0, px1, py1], clip: [-cw2 / 2, cy0, cw2 / 2, cy0 + chh] };
}
/* A21.clipboard(ctx, o): the set piece. o = { x, y (centre), w (board width, default 600), h (default w * 1.32), rot, items, ticks, fail, failK, header, sub, hero, ink, rowAlpha, t } -> { box, rows[], sheet, clip }.
 * The returned rows hold { cx, cy, box (the check box), text [x, y] (left end of the item, centre of its cap band), size } in the current coordinates, rotation included. */
A.clipboard = (c, o = {}) => {
  const w = o.w ?? 600, h = o.h ?? w * 1.32, rot = o.rot || 0, cs = Math.cos(rot), sn = Math.sin(rot), T2 = (x, y) => [o.x + x * cs - y * sn, o.y + x * sn + y * cs];
  c.save(); c.translate(o.x, o.y); if (rot) c.rotate(rot);
  if (o.shadow !== false) { c.save(); c.fillStyle = 'rgba(10,14,30,.28)'; c.filter = 'none'; rr(-w / 2 + w * .03, -h / 2 + w * .04, w, h, w * .06); c.fill(); c.restore(); }
  const R = cbDraw(w, h, Object.assign({ hero: true, scr: scrScale() }, o));
  c.restore();
  const rows = R.rows.map(r => Object.assign({}, r, { cx: T2(r.cx, r.cy)[0], cy: T2(r.cx, r.cy)[1], text: T2(r.text[0], r.text[1]), box: [...T2(r.box[0], r.box[1]), ...T2(r.box[2], r.box[3])], local: r }));
  const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => T2(x, y));
  return { box: [Math.min(...corners.map(p => p[0])), Math.min(...corners.map(p => p[1])), Math.max(...corners.map(p => p[0])), Math.max(...corners.map(p => p[1]))], rows, sheet: R.sheet, clip: R.clip, w, h, rot };
};

// ================================================================== held props (the hand is the origin): fp21_clipboard, fp21_pen, fp21_tablet
const CB_W = 94, CB_H = 124;
EXT.prop.fp21_clipboard = (side, o, t) => {
  const S = o.cbScale || 1, w = CB_W * S, h = CB_H * S;
  ctx.save(); ctx.translate(-side * (w / 2 - 8), 4); ctx.rotate(o.cbRot ?? -side * .05);
  cbDraw(w, h, { items: o.cbItems, ticks: o.cbTicks, fail: o.cbFail, failK: o.cbFailK, header: o.cbHeader, sub: o.cbSub, hero: false, t, hand: side });
  ctx.restore();
};
EXT.prop.fp21_pen = (side, o, t) => {   /* a navy ballpoint, tip down toward the work: o.penAng (radians, 0 = straight down) */
  ctx.save(); ctx.rotate(o.penAng ?? side * .42); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 20); ctx.stroke();
  ctx.strokeStyle = '#26408c'; ctx.lineWidth = 6.4; ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 18); ctx.stroke();
  ctx.fillStyle = '#d7dce4'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3.6, 18); ctx.lineTo(3.6, 18); ctx.lineTo(0, 29); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(4.6, -38); ctx.lineTo(4.6, -18); ctx.stroke();
  ctx.restore();
};
const TB_W = 74, TB_H = 98;
EXT.prop.fp21_tablet = (side, o, t) => {   /* a tablet in a rugged grey case, screen toward us: o.tabLit 0..1, o.tabRows (default 5), o.tabTick (rows ticked, may be fractional) */
  const S = o.tabScale || 1, w = TB_W * S, h = TB_H * S, lit = clamp(o.tabLit ?? 1);
  ctx.save(); ctx.translate(-side * (w / 2 - 8), 4); ctx.rotate(o.tabRot ?? -side * .05); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#3b414c'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.2; rr(-w / 2, -h / 2, w, h, w * .14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#545b68'; for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.arc(cx * (w / 2 - w * .09), cy * (h / 2 - w * .09), w * .1, 0, TAU); ctx.fill(); }
  const sx = -w / 2 + w * .1, sy = -h / 2 + w * .12, sw = w * .8, sh = h - w * .24;
  ctx.fillStyle = '#0c1220'; rr(sx, sy, sw, sh, 3); ctx.fill();
  if (lit > .02) {
    ctx.save(); rr(sx, sy, sw, sh, 3); ctx.clip(); ctx.globalAlpha *= lit;
    ctx.fillStyle = V2.grad(0, sy, 0, sy + sh, [[0, '#13263f'], [1, '#0d1a2e']]); ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#2bd4e8'; ctx.fillRect(sx, sy, sw, sh * .13); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(sx + sw * .08, sy + sh * .045, sw * .42, sh * .04);
    const nr = o.tabRows || 5, tk = o.tabTick ?? 3;
    for (let i = 0; i < nr; i++) {
      const yy = sy + sh * (.2 + i * .75 / nr), on = clamp(tk - i);
      ctx.strokeStyle = on > 0 ? '#3ef2a0' : 'rgba(140,170,200,.6)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(sx + sw * .14, yy + sh * .03, sh * .032, 0, TAU); ctx.stroke();
      if (on > 0) { ctx.fillStyle = '#3ef2a0'; ctx.beginPath(); ctx.arc(sx + sw * .14, yy + sh * .03, sh * .032 * on, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(170,210,240,.42)'; ctx.fillRect(sx + sw * .26, yy + sh * .012, sw * (.6 - (i % 3) * .12), sh * .026);
    }
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * .55, sy); ctx.lineTo(sx, sy + sh * .45); ctx.closePath(); ctx.fill();
    ctx.restore();
    V2.emit(0, 0, w * .6, '#5fd8ff', .18 * lit);
  }
  ctx.restore();
};
Object.assign(PROP_BOX, {
  fp21_clipboard: o => { const S = o.cbScale || 1, w = CB_W * S, h = CB_H * S; return Object.assign([-w + 6, -h / 2 - 4, 12, h / 2 + 10], { mirror: true }); },
  fp21_pen: Object.assign([-16, -40, 22, 30], { mirror: true }),
  fp21_tablet: o => { const S = o.tabScale || 1, w = TB_W * S, h = TB_H * S; return Object.assign([-w + 6, -h / 2 - 2, 12, h / 2 + 8], { mirror: true }); },
});
// ================================================================== constructors: A21.kale(o), A21.radish(o)
const KALE_ACC = ['fp21_kale_frill', 'fp21_suit', 'fp21_kale_brows', 'fp21_kale_glasses', 'fp21_badge'];
const RAD_ACC = ['fp21_suit', 'fp21_scanner', 'fp21_badge'];
/* a pen hand that writes: a small loop of scribbles (a pure function of t) */
const writeJig = (t, k = 1) => [k * (3.2 * Math.sin(t * 13.1) + 1.4 * Math.sin(t * 29.3)), k * (1.6 * Math.sin(t * 17.7 + 1) + .8 * Math.sin(t * 41))];
A.kale = o => {
  o = o || {};
  const seed = o.seed ?? 311, t = tOf(o), pose = o.pose || 'clip', expr = o.expr || 'kale_neutral', wk = o.penWrite === false ? 0 : 1, j = writeJig(t, wk);
  let P = {};
  if (pose === 'clip') P = { gripSpace: 'body', arms: { l: 'hold', r: o.cbPen ? 'hold' : 'rest' }, grip: o.cbPen ? { l: [-104, 128], r: [104, 112] } : { l: [-104, 128] }, hold: o.cbPen ? { l: 'fp21_clipboard', r: 'fp21_pen' } : { l: 'fp21_clipboard' }, penAng: .12 };
  else if (pose === 'write') P = { gripSpace: 'body', arms: { l: 'hold', r: 'hold' }, grip: { l: [-60, 128], r: [18 + j[0], 108 + j[1]] }, hold: { l: 'fp21_clipboard', r: 'fp21_pen' }, badgeText: false };
  else if (pose === 'rest') P = { arms: { l: 'rest', r: 'rest' } };
  const r = Object.assign({ kind: 'kale', id: 'kale', who: 'kale', s: SC, y: G, seed, browUp: 9, browColor: 'rgba(0,0,0,0)', kBrowColor: '#0e2612', cbTicks: 0 }, P, o);
  r.t = t; r.expr = expr;
  if ((expr === 'kale_note' || pose === 'write') && o.look == null) r.look = pose === 'write' ? [.25, .95] : [.1, .92];
  r.acc = KALE_ACC.filter(a => !(a === 'fp21_kale_glasses' && o.glasses === false)).concat((o.acc || []).filter(a => KALE_ACC.indexOf(a) < 0));
  return r;
};
A.radish = o => {
  o = o || {};
  const seed = o.seed ?? 331, t = tOf(o), pose = o.pose || 'tablet', expr = o.expr || 'radish_flat', wk = o.penWrite === false ? 0 : 1, j = writeJig(t + 2, wk);
  let P = {};
  if (pose === 'tablet') P = { gripSpace: 'body', arms: { l: 'hold', r: 'rest' }, grip: { l: [-86, 122] }, hold: { l: 'fp21_tablet' } };
  else if (pose === 'tap') P = { gripSpace: 'body', arms: { l: 'hold', r: 'hold' }, grip: { l: [-60, 124], r: [-6 + j[0] * .4, 128 + j[1] * .4] }, hold: { l: 'fp21_tablet' }, hand: { r: 'point' }, badgeText: false };
  else if (pose === 'clip') P = { gripSpace: 'body', arms: { l: 'hold', r: o.cbPen ? 'hold' : 'rest' }, grip: o.cbPen ? { l: [-86, 124], r: [104, 104] } : { l: [-86, 124] }, hold: o.cbPen ? { l: 'fp21_clipboard', r: 'fp21_pen' } : { l: 'fp21_clipboard' }, cbScale: .8, penAng: .12 };
  else if (pose === 'write') P = { gripSpace: 'body', arms: { l: 'hold', r: 'hold' }, grip: { l: [-52, 124], r: [12 + j[0], 104 + j[1]] }, hold: { l: 'fp21_clipboard', r: 'fp21_pen' }, cbScale: .8, badgeText: false };
  else if (pose === 'rest') P = { arms: { l: 'rest', r: 'rest' } };
  if (expr === 'radish_buried') P = { arms: { l: 'none', r: [2.42, .38] }, hand: { r: 'open' }, hold: {}, noLegs: true, noShadow: true, noReflect: true, glassTilt: .13, root: false };
  const r = Object.assign({ kind: 'radish', id: 'radish', who: 'radish', s: SC, y: G, seed, browUp: 9, browW: 10, browColor: '#3d0a14', scanner: 0, tabLit: 1 }, P, o);
  r.t = t; r.expr = expr;
  if (expr === 'radish_note' && o.look == null) r.look = [.08, .9];
  r.acc = RAD_ACC.filter(a => !(a === 'fp21_scanner' && o.glasses === false)).concat((o.acc || []).filter(a => RAD_ACC.indexOf(a) < 0));
  return r;
};
/* framing helpers: the body centre and the face box (yaw 0) in the CURRENT canvas coordinates, for the x, y, s already merged into o */
A.centre = o => { const k = KINDS[o.kind], s = o.s || 1, leg = (o.noLegs || o.center) ? 0 : (k.leg || 90), up = o.center ? 0 : (leg + k.ry * .9); return [o.x, o.y - (o.lift || 0) - s * up]; };
A.faceBox = o => {
  const k = KINDS[o.kind], s = o.s || 1, [cx, cy] = A.centre(o), E = Object.assign({}, EXPR[o.expr || 'neutral'], o.face || {}), er = k.er * (E.wide || 1);
  const hw = k.eyeX + er * 1.45, top = k.eyeY - er * 1.42 - Math.max(0, E.raise || 0) - (o.browUp || 0) - 9, bot = k.mouthY + 55 * (k.mw || 26) / 26;
  return [cx - hw * s, cy + top * s, cx + hw * s, cy + bot * s];
};

// ================================================================== E15-TURN integration: the kinds' own skin / tops / accessories read the yaw (the mapping needs the rig's measured silhouette P)
(() => {
  if (!V2C.YAW_ACC || !V2C.YAW_TEX || !V2C.YAW_TOP || !V2C.ACC_CLS) return;
  const reg = (name, cls, fn) => { fn.cls = cls; V2C.YAW_ACC[name] = fn; };
  reg('fp21_kale_frill', 'wrap', (o, k, t, layer) => EXT.acc.fp21_kale_frill(o, k, t, layer));
  reg('fp21_suit', 'chest', (o, k, t, layer, yaw, Y, P) => { if (layer === 'mid' && o.suit21 !== false) suitDraw(o, k, t, yaw, P); });
  reg('fp21_badge', 'chest', (o, k, t, layer, yaw, Y, P) => { if (layer === 'front' && o.badge21 !== false) badgeDraw(o, k, t, yaw, P); });
  reg('fp21_kale_brows', 'face', (o, k, t, layer, yaw, Y, P) => { if (layer === 'front' && !o.noFace) kaleBrows(o, k, t, faceAngOf(Y.h), P); });
  reg('fp21_kale_glasses', 'face', (o, k, t, layer, yaw, Y, P) => { if (layer === 'front' && !o.noFace && o.glasses !== false) glassesDraw(o, k, t, faceAngOf(Y.h), P, 'kale'); });
  reg('fp21_scanner', 'face', (o, k, t, layer, yaw, Y, P) => { if (layer === 'front' && !o.noFace && o.glasses !== false) glassesDraw(o, k, t, faceAngOf(Y.h), P, 'scanner'); });
  V2C.YAW_TEX.kale = (o, k, t) => EXT.tex.kale(o, k, t);
  V2C.YAW_TEX.radish = (o, k, t) => EXT.tex.radish(o, k, t);
  V2C.YAW_TOP.kale = () => {};
  V2C.YAW_TOP.radish = (o, k, t, layer) => EXT.top.radish(o, k, t, layer);
  /* @@A21-TURN */
})();
/* @@A21-PART5 */
})();
