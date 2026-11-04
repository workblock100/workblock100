'use strict';
/* SHIFT HAPPENS, Episode 19, "The Potluck": the KITCHEN builder's art kit, window.A19 (ep19_art.js). Registers through the engine's EXT hooks (kind `cabbage`, everything else prefixed fp19_).
 *
 *   A19.chef(o)           Chef Cabbage, Dietary manager (who 'chef'; kind `cabbage`). A green cabbage head wrapped in veined leaves, a tall pleated white toque, a stained apron, a mustache of leaf veins,
 *                         a tired and dignified face. Constructor signature: A19.chef({ x, y (feet), s (default .44), t (scene time), yaw, headYaw, expr, look, lid, arms, grip, hold, hand, pose, ... }) -> drawChar options.
 *                         pose: 'ladle' (default: the ladle in the right hand, held like a sceptre) | 'rest' | 'free'; expr: chef_flat (default), chef_dry, chef_proud, chef_weary, any engine expression;
 *                         apron false takes the apron off; toque false takes the hat off. Everything turns with yaw / headYaw (leaves, toque pleats, apron, mustache).
 *   A19.plate(o, 'chef_tag')  the blank name plate on the apron, { x, y, w, h, rot, size } in the CURRENT canvas coordinates (letter it with UI.label when it is big enough to read; the sprite itself has no text).
 *   A19.apron(o)          dress ANY character options in the stained kitchen apron: A19.apron(A11.straw({...})). The plate is then 'apron_tag'.
 *   Held props (hold: { r: 'fp19_ladle' }): fp19_ladle, fp19_knife (carving knife, o.knifeRot), fp19_tray (o.trayItems: 'cloche' | 'ticket' | 'pie'; o.trayTilt), fp19_scoop (o.scoopFill 0..1: white powder), fp19_piebox (o.boxOpen 0..1).
 *   Accessories: fp19_apron, fp19_stache, fp19_hairnet (a clear cap with a pale elastic).
 */
(() => {
if (typeof KINDS === 'undefined' || typeof EXT === 'undefined' || typeof V2 === 'undefined' || typeof V2C === 'undefined') return;
const A = window.A19 = window.A19 || {};
const SC = .44, G = 1316;
const sr = (i, s = 0) => hash(i * 3.17 + s * 11.3 + 1.3);
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const tOf = o => (o.t != null ? o.t : (typeof T === 'number' ? T : 0));
const YI = o => (V2C.yawInfo ? V2C.yawInfo(o) : null);
const yawOf = o => { const Y = YI(o); return Y ? Y.y : (o.yaw || 0); };
const headYawOf = o => { const Y = YI(o); return Y ? Y.h : (o.headYaw != null ? o.headYaw : (o.yaw || 0)); };
const sgnY = x => x < 0 ? -1 : 1, sstepY = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const faceAngOf = o => { const h = headYawOf(o); return V2C.yawInfo ? h - sgnY(h) * .26 * sstepY(.6, 1.45, Math.abs(h)) * (1 - sstepY(1.75, 2.5, Math.abs(h))) : h; };
const lamb = (nx, ny, nz) => { const L = V2.LIGHT, kx = L.key[0], ky = L.key[1], kz = .62, kl = Math.hypot(kx, ky, kz); return clamp((nx * kx + ny * ky + nz * kz) / (kl * Math.hypot(nx, ny, nz) || 1)); };
/* a base colour lit by lam (0 shadow .. 1 full key): follows V2.setLight (the kitchen's key light) */
function lit(base, lam, amt = 1) {
  const L = V2.LIGHT;
  const dk = V2.mix(base, L.shadow, clamp(.62 * (1 - lam) * amt * Math.min(1.6, L.shadowA / .3)));
  const wm = V2.mix(dk, L.keyColor, clamp((lam - .5) * .7) * .3 * amt * Math.min(1.6, L.keyA / .22));
  return V2.rgba(wm, 1);
}
const OUT = 'rgba(25,10,20,.92)';
const PLATES = {};
A.PLATES = PLATES;
A.centre = o => { const k = KINDS[o.kind], s = o.s || 1, leg = (o.noLegs || o.center) ? 0 : (k.leg || 90), up = o.center ? 0 : (leg + k.ry * .9); return [o.x, o.y - (o.lift || 0) - s * up]; };
A.plate = (o, name) => {
  const P = PLATES[name]; if (!P) return null;
  const s = o.s || 1, [cx, cy] = A.centre(o), r = typeof P.r === 'function' ? P.r(o, KINDS[o.kind]) : P.r;
  return { x: cx + s * (r[0] + r[2]) / 2, y: cy + s * (r[1] + r[3]) / 2, w: s * (r[2] - r[0]), h: s * (r[3] - r[1]), rot: (typeof P.rot === 'function' ? P.rot(o) : (P.rot || 0)) + (o.rot || 0), size: s * (r[3] - r[1]) * .62 };
};
function bez(p0, p1, p2, p3, u) { const a = 1 - u; return [a * a * a * p0[0] + 3 * a * a * u * p1[0] + 3 * a * u * u * p2[0] + u * u * u * p3[0], a * a * a * p0[1] + 3 * a * a * u * p1[1] + 3 * a * u * u * p2[1] + u * u * u * p3[1]]; }
function profileOf(segs, n = 14) {
  const tab = []; for (const sg of segs) for (let i = 0; i <= n; i++) tab.push(bez(sg[0], sg[1], sg[2], sg[3], i / n));
  return y => { if (y <= tab[0][1]) return tab[0][0]; for (let i = 1; i < tab.length; i++) if (y <= tab[i][1] || i === tab.length - 1) { const a = tab[i - 1], b = tab[i], u = (y - a[1]) / ((b[1] - a[1]) || 1); return Math.max(0, lerp(a[0], b[0], clamp(u))); } return 0; };
}
function mirrorPath(p, segs) {
  p.moveTo(segs[0][0][0], segs[0][0][1]);
  for (const s2 of segs) p.bezierCurveTo(s2[1][0], s2[1][1], s2[2][0], s2[2][1], s2[3][0], s2[3][1]);
  for (let i = segs.length - 1; i >= 0; i--) { const s2 = segs[i]; p.bezierCurveTo(-s2[2][0], s2[2][1], -s2[1][0], s2[1][1], -s2[0][0], s2[0][1]); }
  p.closePath();
}
function faceHoleClip(k, mx = 1.6, my = 0, pad = 10, ang = 0, Rf = null) {   /* a clip that leaves out the face, so surface marks never run through the eyes */
  const R = Math.max(k.rx, k.ry) * 1.6, ca = Math.cos(ang); if (ca < .08) { ctx.beginPath(); ctx.rect(-R, -R, R * 2, R * 2); ctx.clip(); return; }
  const rx = (k.eyeX + k.er * mx + pad) * ca, top = k.eyeY - k.er * 2.9, bot = k.mouthY + k.mw * 1.7 + 8, cy = (top + bot) / 2 + my, ry = (bot - top) / 2 + 6, cx = (Rf ? Rf(cy) * .94 : k.rx * .94) * Math.sin(ang);
  ctx.beginPath(); ctx.rect(-R, -R, R * 2, R * 2); ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU, true); ctx.clip('evenodd');
}
function taper(pts, w0, w1, fill, stroke, lw = 2.4) {   /* a tapering ribbon through a polyline (w0 at the start, w1 at the end) */
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([pts[i][0] - dy / len * w, pts[i][1] + dx / len * w]); R.push([pts[i][0] + dy / len * w, pts[i][1] - dx / len * w]);
  }
  ctx.beginPath(); L.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}

// ================================================================== the kind: a cabbage (kind `cabbage`), a tall toque on top (TOPS includes it, so the audit's head box covers the hat)
Object.assign(KINDS, {
  cabbage: { rx: 116, ry: 110, shape: 'cabbage', tex: 'cabbage', c: ['#eef6d0', '#aad77c', '#508d3c'], eyeY: -4, eyeX: 38, mouthY: 44, er: 21, mw: 22, leg: 76, hip: 40, arm1: 52, arm2: 48, shoe: '#f6f4ee', shoe2: '#8f8b80', yawOwn: true },
});
Object.assign(TOPS, { cabbage: 284 });
Object.assign(EXPR, {
  chef_flat: { ang: .06, raise: -2, curve: 0, lid: .34, wide: 1, pup: .92 },               /* enormous patience */
  chef_dry: { ang: .24, raise: -5, curve: -.14, lid: .42, wide: .98, pup: .88 },           /* the look he gives a request */
  chef_proud: { ang: -.06, raise: 4, curve: .2, lid: .26, wide: 1, pup: 1 },               /* a very small pride */
  chef_weary: { ang: -.2, raise: 1, curve: -.28, lid: .5, wide: .96, pup: .85 },
});
const CAB_SEGS = (() => { const rx = KINDS.cabbage.rx, ry = KINDS.cabbage.ry; return [
  [[0, -ry * .97], [rx * .56, -ry * .99], [rx * .99, -ry * .66], [rx * 1.0, -ry * .12]],
  [[rx * 1.0, -ry * .12], [rx * 1.02, ry * .4], [rx * .8, ry * .93], [rx * .36, ry * .995]],
  [[rx * .36, ry * .995], [rx * .22, ry * 1.0], [rx * .1, ry * 1.0], [0, ry * 1.0]]]; })();
const cabR = profileOf(CAB_SEGS);
EXT.shape.cabbage = p => mirrorPath(p, CAB_SEGS);

/* The leaves: two layers of lens-shaped sheets wrapped round the ball (a longitude each), so they turn with o.yaw. INNER leaves run from the crown down to the middle; OUTER wrapper leaves are wide, start
 * with a ruffled edge about a third of the way down and run to the stem. Every leaf has a pale midrib and side veins. */
const CAB_IN = Array.from({ length: 9 }, (_, i) => ({ lon: (i / 9) * TAU - PI + (sr(i, 1) - .5) * .25, hw: .56 + sr(i, 2) * .16, y0: -.97, y1: .5 + sr(i, 3) * .2, tone: sr(i, 4), curl: (sr(i, 5) - .5) * .4, ph: sr(i, 6) * TAU }));
const CAB_OUT = Array.from({ length: 6 }, (_, i) => ({ lon: (i / 6) * TAU - PI + .3 + (sr(i, 11) - .5) * .3, hw: .78 + sr(i, 12) * .2, y0: -.22 + (sr(i, 13) - .5) * .66, y1: .99, tone: sr(i, 14), curl: (sr(i, 15) - .5) * .5, ph: sr(i, 16) * TAU }));
function leafDraw(L, outer, yaw, k, t) {
  const ry = k.ry, a0 = L.lon + yaw, zc = Math.cos(a0);
  if (zc < -.35) return;
  const N = 12, pts = [], right = [], mid = [];
  const wOf = u => L.hw * Math.pow(Math.sin(Math.min(1, u * (outer ? 1.35 : 1.0)) * PI * (outer ? .5 : 1)), outer ? .8 : .7);
  const X = (lon, y) => { const a = lon + yaw, c = Math.cos(a); return cabR(y) * (c >= 0 ? Math.sin(a) : (Math.sin(a) < 0 ? -1 : 1) * .98); };
  const yt = L.y0 * ry, yb = L.y1 * ry;
  for (let i = 0; i <= N; i++) { const u = i / N, y = lerp(yb, yt, u), w = wOf(u), cl = L.curl * Math.sin(u * 2.4 + L.ph); pts.push([X(L.lon + cl - w, y), y]); right.push([X(L.lon + cl + w, y), y]); mid.push([X(L.lon + cl, y), y, u, w, cl]); }
  const top = []; if (outer) { for (let i = 1; i < 10; i++) { const v = i / 10, w = wOf(1), lon = L.lon + L.curl * Math.sin(2.4 + L.ph) + w * (1 - 2 * v), y = yt + 11 * Math.sin(v * PI * 3.5 + L.ph) + 6 * Math.sin(v * PI * 7 + L.ph * 2); top.push([X(lon, y), y]); } }
  const lam = lamb(Math.sin(a0) * .9, -.2, Math.max(zc, .05));
  const base = outer ? V2.mix('#67ac43', '#448536', L.tone) : V2.mix('#a3d273', '#7fba55', L.tone);
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); top.forEach(([x, y]) => ctx.lineTo(x, y)); for (let i = N; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath();
  const xs = mid.map(m => m[0]), gx0 = Math.min(...xs) - 30, gx1 = Math.max(...xs) + 30;
  ctx.fillStyle = V2.grad(gx0, 0, gx1, 0, [[0, lit(V2.mix(base, '#e4f3b8', .22), clamp(lam + .1), 1)], [.5, lit(V2.mix(base, '#e4f3b8', .38), clamp(lam + .05), 1)], [1, lit(V2.mix(base, '#274f22', .22), clamp(lam - .1), 1)]]);
  ctx.fill();
  ctx.strokeStyle = outer ? 'rgba(20,52,20,.82)' : 'rgba(36,80,28,.6)'; ctx.lineWidth = outer ? 3.4 : 2.4; ctx.lineJoin = 'round'; ctx.stroke();
  if (zc < .02) return;
  /* midrib and side veins: pale, fat at the stem and thin at the tip */
  taper(mid.slice(0, N - 1).map(m => [m[0], m[1]]), outer ? 11 : 8, 2, 'rgba(238,247,205,.9)', 'rgba(60,110,40,.55)', 1.6);
  ctx.strokeStyle = 'rgba(236,247,200,.62)'; ctx.lineCap = 'round';
  for (let j = 1; j < 6; j++) for (const sd of [-1, 1]) {
    const u0 = .1 + j * .14, u1 = Math.min(.97, u0 + .16), m0 = mid[Math.round(u0 * N)], m1 = mid[Math.round(u1 * N)];
    const y1 = m1[1], lonE = L.lon + m1[4] + sd * m1[3] * .78, x1 = X(lonE, y1);
    ctx.lineWidth = 3.4 - j * .35; ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.quadraticCurveTo((m0[0] + x1) / 2 + sd * 2, (m0[1] + y1) / 2 + 4, x1, y1); ctx.stroke();
  }
}
EXT.tex.cabbage = (o, k, t) => {
  const { rx, ry } = k, yaw = yawOf(o), R = Math.max(rx, ry) * 1.5;
  ctx.save();
  ctx.save(); faceHoleClip(k, 1.5, 6, 14, faceAngOf(o), cabR);
  for (const L of CAB_IN) leafDraw(L, false, yaw, k, t);
  for (const L of CAB_OUT.slice().sort((p, q) => Math.cos(p.lon + yaw) - Math.cos(q.lon + yaw))) leafDraw(L, true, yaw, k, t);
  ctx.restore();
  /* the pale inner leaf round the face: a soft patch with a few fine veins, so the eyes sit on something calm */
  const fa = faceAngOf(o), ca = Math.cos(fa);
  if (ca > .1) {
    const cx = cabR(0) * .94 * Math.sin(fa), w = (k.eyeX + k.er * 1.6 + 16) * ca;
    ctx.fillStyle = V2.radial(cx, 22, 4, w * 1.35, [[0, 'rgba(240,248,208,.55)'], [.7, 'rgba(226,242,184,.22)'], [1, 'rgba(226,242,184,0)']]); ctx.fillRect(cx - w * 1.5, -ry * .7, w * 3, ry * 1.7);
  }
  ctx.fillStyle = V2.grad(0, -ry, 0, ry, [[0, 'rgba(255,255,230,.18)'], [.5, 'rgba(255,255,230,0)'], [1, 'rgba(20,50,20,.22)']]); ctx.fillRect(-R, -R, R * 2, R * 2);
  ctx.restore();
};
const FLAPS = [{ lon: -1.75, d: -1 }, { lon: -1.15, d: -1 }, { lon: 1.15, d: 1 }, { lon: 1.75, d: 1 }, { lon: 2.6, d: 1 }, { lon: -2.6, d: -1 }];
EXT.top.cabbage = (o, k, t, layer) => {
  if (layer === 'back') {   /* the ruffled wrapper leaves flaring out round the lower ball: scalloped flaps on the silhouette, hidden by the body where they face us */
    const yaw = yawOf(o); ctx.save(); ctx.lineJoin = 'round';
    for (const f of FLAPS.slice().sort((p, q) => Math.cos(p.lon + yaw) - Math.cos(q.lon + yaw))) {
      const a = f.lon + yaw, sn = Math.sin(a); if (Math.abs(sn) < .5) continue;
      const dir = sn < 0 ? -1 : 1, y0 = -k.ry * .12, y1 = k.ry * .82, pts = [], N = 10, wob = Math.sin(t * 1.3 + f.lon * 2) * 1.4;
      const edge = u => { const y = lerp(y0, y1, u); return [cabR(y) * sn + dir * (8 + 17 * Math.sin(Math.PI * Math.min(1, u * 1.05)) + 3.2 * Math.cos(u * 24 + f.lon * 5)) + wob * u, y]; };
      for (let i = 0; i <= N; i++) pts.push(edge(i / N));
      ctx.beginPath(); ctx.moveTo(cabR(y0) * sn, y0 - 6); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(cabR(y1) * sn, y1 + 8); ctx.closePath();
      ctx.fillStyle = V2.grad(0, y0, 0, y1, [[0, '#78b84e'], [1, '#3f7d33']]); ctx.fill(); ctx.strokeStyle = 'rgba(20,52,20,.85)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(232,245,196,.7)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cabR(y0 + 10) * sn + dir * 2, y0 + 10); ctx.quadraticCurveTo(cabR(.4 * k.ry) * sn + dir * 10, k.ry * .4, cabR(y1 - 8) * sn + dir * 4, y1 - 8); ctx.stroke();
    }
    ctx.restore(); return;
  }
  if (o.toque === false) return;
  toque(o, k, t);
};

// ================================================================== the toque: a tall pleated chef's hat (the audit's head box includes it, TOPS.cabbage)
const TQ = { w: 98, yb: -80, yt: -128, wp: 122 };   /* band half width, band bottom / top, puff half width (sprite space, head centre = 0, the head's top is at -110) */
function toquePath(c) {
  c.beginPath(); c.moveTo(-TQ.w, TQ.yb + 6); c.lineTo(-TQ.w, TQ.yt);
  c.bezierCurveTo(-102, -158, -126, -178, -TQ.wp, -212);
  c.bezierCurveTo(-140, -250, -92, -270, -52, -258);
  c.bezierCurveTo(-34, -284, 30, -284, 50, -260);
  c.bezierCurveTo(92, -272, 140, -248, TQ.wp, -212);
  c.bezierCurveTo(126, -178, 102, -158, TQ.w, TQ.yt);
  c.lineTo(TQ.w, TQ.yb + 6); c.quadraticCurveTo(0, TQ.yb + 30, -TQ.w, TQ.yb + 6); c.closePath();
}
function toque(o, k, t) {
  const hy = headYawOf(o), kx = V2.LIGHT.key[0];
  const sway = Math.sin(t * 1.6 + (o.seed || 0)) * 2.4;   /* the puff nods a little over the band */
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.save(); toquePath(ctx);
  ctx.fillStyle = V2.grad(-TQ.wp, 0, TQ.wp, 0, kx < 0 ? [[0, '#ffffff'], [.55, '#f1f3f7'], [1, '#c6ccda']] : [[0, '#c6ccda'], [.45, '#f1f3f7'], [1, '#ffffff']]); ctx.fill();
  ctx.clip();
  /* pleats: curves from the band up into the puff, one per longitude, turning with the head */
  ctx.strokeStyle = 'rgba(120,132,160,.5)'; ctx.lineWidth = 2.6;
  for (let i = -4; i <= 4; i++) {
    const a = i * .36 + (((hy % .36) + .36) % .36), ca = Math.cos(a); if (ca < .05 || Math.abs(a) > 1.5) continue;
    const xb = TQ.w * Math.sin(a), xm = TQ.wp * 1.04 * Math.sin(a), xt = TQ.wp * .78 * Math.sin(a);
    ctx.beginPath(); ctx.moveTo(xb, TQ.yb + 12); ctx.bezierCurveTo(xb, -130, xm, -160 + sway * .3, xm, -212); ctx.quadraticCurveTo(xt, -246 + sway * .2, xt * .6, -266); ctx.stroke();
  }
  /* the puff's shading: a light crown, a soft shadow on the band */
  ctx.fillStyle = V2.radial(-kx * 46, -232, 8, 140, [[0, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-TQ.wp - 30, -300, TQ.wp * 2 + 60, 230);
  ctx.fillStyle = V2.grad(0, TQ.yb - 8, 0, TQ.yt + 4, [[0, 'rgba(70,84,120,.34)'], [1, 'rgba(70,84,120,0)']]); ctx.fillRect(-TQ.wp, TQ.yt - 6, TQ.wp * 2, TQ.yb - TQ.yt + 18);
  ctx.restore();
  toquePath(ctx); ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.stroke();
  /* the band's upper edge, so the hat reads as a hat on a head */
  ctx.strokeStyle = 'rgba(25,10,20,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-TQ.w, TQ.yt + 4); ctx.quadraticCurveTo(0, TQ.yt + 22, TQ.w, TQ.yt + 4); ctx.stroke();
  ctx.restore();
}


// ================================================================== the apron: a stained white waist apron (works on any character). Mid layer: it hangs over the lower ball and the tops of the legs; the face is drawn over it.
const apronGeo = (o, k) => { const wy = Math.min(k.ry * .66, k.mouthY + (k.mw || 24) * .6 + 26); return { wy, w: Math.min(k.rx * .62, 76), bot: k.ry * .9 + (o.noLegs ? 34 : (k.leg || 80) * .82) }; };
const STAINS = [[-.5, .3, 15, '#9a5a1e'], [.34, .5, 12, '#b02a24'], [-.15, .66, 9, '#c9a43a'], [.5, .2, 8, '#6b8f2e'], [-.38, .78, 11, '#7a4a1a']];
EXT.acc.fp19_apron = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  const yaw = yawOf(o), ca = Math.cos(yaw), sa = Math.sin(yaw), g = apronGeo(o, k), R = cabR && o.kind === 'cabbage' ? cabR(g.wy) : k.rx * .8, cx = R * .96 * sa;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the tie: a cord round the waist (across the ball, clipped to it), with a knot or a bow at the back */
  ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  ctx.strokeStyle = 'rgba(214,218,228,.96)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, g.wy - 4); ctx.quadraticCurveTo(0, g.wy + 12, k.rx * 1.2, g.wy - 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(25,10,20,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-k.rx * 1.2, g.wy - 9); ctx.quadraticCurveTo(0, g.wy + 7, k.rx * 1.2, g.wy - 9); ctx.stroke();
  ctx.restore();
  if (ca > .05) {
    const X = x => cx * .62 + x * ca, w = g.w, y0 = g.wy + 2, y1 = g.bot;
    ctx.beginPath(); ctx.moveTo(X(-w), y0); ctx.quadraticCurveTo(X(0), y0 + 16, X(w), y0); ctx.lineTo(X(w * 1.12), y1); ctx.quadraticCurveTo(X(0), y1 + 9, X(-w * 1.12), y1); ctx.closePath();
    ctx.fillStyle = V2.grad(X(-w), 0, X(w), 0, [[0, '#ffffff'], [.6, '#eef0f5'], [1, '#c9cedb']]); ctx.fill();
    ctx.save(); ctx.clip();
    for (const [sx, sy, r, col] of STAINS) { const px = X(sx * w), py = y0 + sy * (y1 - y0); ctx.fillStyle = col; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(px, py, r * ca + 2, r * .8, .4, 0, TAU); ctx.fill(); ctx.globalAlpha = .3; ctx.beginPath(); ctx.ellipse(px + 3, py + 4, r * .5 * ca + 1, r * .4, .2, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(120,130,160,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(-w * 1.05), y1 - 12); ctx.lineTo(X(w * 1.05), y1 - 12); ctx.stroke();
    ctx.fillStyle = 'rgba(70,84,120,.18)'; ctx.fillRect(X(w * .4), y0, w * ca, y1 - y0);
    ctx.restore();
    ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(-w), y0); ctx.quadraticCurveTo(X(0), y0 + 16, X(w), y0); ctx.lineTo(X(w * 1.12), y1); ctx.quadraticCurveTo(X(0), y1 + 9, X(-w * 1.12), y1); ctx.closePath(); ctx.stroke();
    /* a kitchen towel tucked into the tie at the left hip: blue check, hanging */
    const tx = X(-w * .78), tw2 = 30 * ca + 4, ty0 = g.wy - 2, ty1 = y1 - 6 + 8 * Math.sin(t * 1.5 + (o.seed || 0));
    ctx.save(); ctx.translate(tx, ty0); ctx.rotate(.05); ctx.fillStyle = '#f4f6fb'; ctx.strokeStyle = 'rgba(25,10,20,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-tw2 / 2, 0); ctx.lineTo(tw2 / 2, 0); ctx.lineTo(tw2 / 2 + 3, ty1 - ty0); ctx.lineTo(-tw2 / 2 + 3, ty1 - ty0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(70,110,200,.5)'; for (let j = 0; j < 7; j++) ctx.fillRect(-tw2 / 2, 8 + j * 14, tw2 + 6, 6); for (let j = -1; j < 2; j++) ctx.fillRect(j * 10 - 3, 0, 6, ty1 - ty0); ctx.restore(); ctx.restore();
    /* the name plate (blank: A19.plate(o, 'chef_tag') / 'apron_tag') */
    const tr = tagRect(o, k); const tw = (tr[2] - tr[0]) * ca, thh = tr[3] - tr[1];
    ctx.save(); ctx.translate(X((tr[0] + tr[2]) / 2), (tr[1] + tr[3]) / 2); ctx.rotate(-.03);
    ctx.fillStyle = '#fbfaf2'; ctx.strokeStyle = 'rgba(25,10,20,.85)'; ctx.lineWidth = 3; rr(-tw / 2, -thh / 2, tw, thh, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c33a2e'; ctx.fillRect(-tw / 2 + 3, -thh / 2 + 3, tw - 6, 4);
    ctx.fillStyle = '#b9bfcc'; ell(-tw / 2 + 7, 0, 2.6, 2.6); ctx.fill(); ell(tw / 2 - 7, 0, 2.6, 2.6); ctx.fill();
    ctx.restore();
  } else if (ca < -.05) {   /* from behind: the two ties and a bow */
    ctx.strokeStyle = 'rgba(214,218,228,.96)'; ctx.lineWidth = 7; const bx = cx * -1 * 0 + R * .96 * sa;
    ctx.beginPath(); ctx.moveTo(bx, g.wy); ctx.quadraticCurveTo(bx - 30, g.wy + 8, bx - 34, g.wy + 42); ctx.moveTo(bx, g.wy); ctx.quadraticCurveTo(bx + 30, g.wy + 8, bx + 34, g.wy + 42); ctx.stroke();
    ctx.fillStyle = '#e8ebf2'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bx - 16, g.wy + 2, 17, 10, -.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(bx + 16, g.wy + 2, 17, 10, .3, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
};
const tagRect = (o, k) => { const g = apronGeo(o, k), h = 30, w = Math.min(g.w * 1.3, 98), y = Math.min(g.bot - 10, g.wy + 30 + (o.tagDy || 0)) + (o.kind === 'cabbage' ? 4 : 0); return [-w / 2, y, w / 2, y + h]; };
PLATES.chef_tag = { r: (o, k) => tagRect(o, k), rot: () => -.03 };
PLATES.apron_tag = PLATES.chef_tag;

// ================================================================== the mustache of leaf veins: two fat tapering curls that start under the nose and sweep out and up; a few fine side veins
EXT.acc.fp19_stache = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const y = k.mouthY - 12, bob = Math.sin(t * 1.9 + (o.seed || 0)) * .8, talk = clamp(o.talk || 0);
  ctx.save(); ctx.translate(0, y + bob + talk * 3); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const sd of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([sd * (4 + u * 66), 3 + 12 * Math.sin(u * 2.3) - 24 * Math.pow(Math.max(0, u - .55) / .45, 2)]); }
    taper(pts, 17, 3, '#f3f8de', 'rgba(52,96,36,.9)', 2.6);
    ctx.strokeStyle = 'rgba(84,140,60,.75)'; ctx.lineWidth = 1.8; ctx.beginPath(); pts.forEach(([x, py], i) => i ? ctx.lineTo(x, py) : ctx.moveTo(x, py)); ctx.stroke();
    for (let j = 3; j < 11; j += 3) { const [x, py] = pts[j]; ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + sd * 6, py - 6 - j * .25); ctx.stroke(); }
  }
  ctx.restore();
};

// ================================================================== a hairnet (a pale elastic edge and a sheen): the kitchen's rule, worn by whoever is on the line
EXT.acc.fp19_hairnet = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.lineCap = 'round';
  const ry = k.ry, rx = k.rx * .86, y0 = -ry * .5;
  ctx.fillStyle = 'rgba(235,242,250,.22)'; ctx.beginPath(); ctx.ellipse(0, y0 - ry * .26, rx, ry * .5, 0, PI, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(230,238,248,.8)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, y0, rx, ry * .08, 0, 0, PI); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.4; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * rx / 4.4, y0); ctx.quadraticCurveTo(i * rx / 3.4, y0 - ry * .32, i * rx / 7, y0 - ry * .5); ctx.stroke(); }
  ctx.restore();
};

// ================================================================== held props (drawn around the hand; the hand is the origin)
Object.assign(PROP_BOX, { fp19_ladle: [-30, -250, 34, 50], fp19_knife: Object.assign([-20, -190, 150, 28], { }), fp19_tray: [-110, -76, 112, 34], fp19_scoop: [-26, -80, 50, 22], fp19_piebox: [-92, -90, 94, 34] });
const STEEL = (x0, x1) => V2.grad(x0, 0, x1, 0, [[0, '#f3f6fa'], [.45, '#b4bcc8'], [1, '#7e8794']]);
EXT.prop.fp19_ladle = (side, o, t) => {   /* a steel ladle held like a sceptre: the bowl up at the top, the handle through the fist */
  ctx.save(); ctx.rotate(o.ladleRot ?? (side > 0 ? .1 : -.1)); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 62); ctx.lineTo(0, -168); ctx.stroke();
  ctx.strokeStyle = '#c9d0db'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 62); ctx.lineTo(0, -168); ctx.stroke();
  ctx.fillStyle = '#9aa3b0'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.ellipse(0, 64, 7, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();   /* the hanging hole's end */
  ctx.save(); ctx.translate(0, -204); ctx.rotate(.14);
  ctx.fillStyle = STEEL(-34, 34); ctx.beginPath(); ctx.moveTo(-36, -2); ctx.bezierCurveTo(-34, 40, 34, 40, 36, -2); ctx.bezierCurveTo(24, -10, -24, -10, -36, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5f6672'; ctx.beginPath(); ctx.ellipse(0, -3, 33, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-16, 16, 5, 11, .3, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
};
EXT.prop.fp19_knife = (side, o, t) => {   /* a long carving knife held point up and a little forward */
  ctx.save(); ctx.rotate(o.knifeRot ?? -.35); ctx.lineJoin = 'round';
  ctx.fillStyle = '#2b2f3a'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; rr(-8, -10, 16, 62, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = STEEL(-14, 14); ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(-11, -168); ctx.quadraticCurveTo(-4, -188, 7, -190); ctx.quadraticCurveTo(14, -90, 9, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-5, -160); ctx.stroke();
  ctx.restore();
};
EXT.prop.fp19_tray = (side, o, t) => {   /* a steel tray carried flat at the waist, a meal ticket tucked in the corner; o.trayItems: 'cloche' | 'ticket' | 'pie' */
  ctx.save(); ctx.rotate(o.trayTilt ?? .03); ctx.translate(0, -22); ctx.lineJoin = 'round';
  ctx.fillStyle = V2.grad(-100, 0, 100, 0, [[0, '#dfe5ee'], [.5, '#aeb7c4'], [1, '#8a93a1']]); ctx.strokeStyle = OUT; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(-104, 6); ctx.lineTo(104, 6); ctx.lineTo(96, 30); ctx.lineTo(-96, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8edf4'; ctx.beginPath(); ctx.ellipse(0, 4, 100, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  const it = o.trayItems || 'cloche';
  if (it === 'cloche') { ctx.fillStyle = STEEL(-34, 34); ctx.beginPath(); ctx.moveTo(-40, 2); ctx.bezierCurveTo(-40, -50, 40, -50, 40, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6b7380'; ctx.beginPath(); ctx.arc(0, -40, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
  if (it === 'pie') { ctx.fillStyle = '#d9c7a3'; ctx.beginPath(); ctx.ellipse(0, -2, 46, 12, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c4ad84'; ctx.beginPath(); ctx.ellipse(0, -10, 40, 9, 0, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.translate(66, -4); ctx.rotate(.08); ctx.fillStyle = '#fffbe8'; ctx.strokeStyle = 'rgba(25,10,20,.8)'; ctx.lineWidth = 2.6; rr(-26, -22, 52, 30, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9402e'; ctx.fillRect(-23, -19, 46, 5); ctx.fillStyle = 'rgba(60,60,80,.45)'; ctx.fillRect(-21, -9, 36, 2.4); ctx.fillRect(-21, -3, 26, 2.4); ctx.restore();
  ctx.restore();
};
EXT.prop.fp19_scoop = (side, o, t) => {   /* a measuring scoop with a long handle: o.scoopFill 0..1 (white thickener powder), o.scoopRot */
  ctx.save(); ctx.rotate(o.scoopRot ?? -.5); ctx.lineJoin = 'round';
  ctx.strokeStyle = OUT; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -52); ctx.stroke(); ctx.strokeStyle = '#d9dfe8'; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -52); ctx.stroke();
  ctx.save(); ctx.translate(0, -66); ctx.fillStyle = STEEL(-20, 20); ctx.strokeStyle = OUT; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-20, -4); ctx.bezierCurveTo(-20, 26, 20, 26, 20, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f7f6f0'; const f = clamp(o.scoopFill ?? 0); if (f > .02) { ctx.beginPath(); ctx.ellipse(0, -5, 20, 5 + 8 * f, 0, PI, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(25,10,20,.6)'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore(); ctx.restore();
};
EXT.prop.fp19_piebox = (side, o, t) => {   /* a white bakery box carried flat; the lid hinges up (o.boxOpen 0..1) to show a pecan pie */
  const op = clamp(o.boxOpen ?? 1);
  ctx.save(); ctx.rotate(o.boxRot ?? 0); ctx.translate(0, -18); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3.6;
  ctx.fillStyle = '#e9dfc9'; ctx.beginPath(); ctx.moveTo(-86, 0); ctx.lineTo(86, 0); ctx.lineTo(92, 30); ctx.lineTo(-92, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f7f1e2'; ctx.beginPath(); ctx.ellipse(0, 0, 86, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b9733a'; ctx.beginPath(); ctx.ellipse(0, -2, 66, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();   /* the pie's crust seen from the side */
  ctx.fillStyle = '#8a4a1c'; ctx.beginPath(); ctx.ellipse(0, -6, 56, 7, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? '#c98a4a' : '#a8662c'; ctx.beginPath(); ctx.ellipse(-44 + i * 11, -6 + (i % 3) * 1.4, 6, 3.2, .3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(247,241,226,.95)'; ctx.beginPath(); ctx.moveTo(-86, 0); ctx.lineTo(86, 0); ctx.lineTo(80 - 14 * op, -34 - 44 * op); ctx.lineTo(-80 + 14 * op, -34 - 44 * op); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c33a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-80 + 14 * op, -34 - 44 * op); ctx.lineTo(80 - 14 * op, -34 - 44 * op); ctx.stroke();
  ctx.restore();
};

// ================================================================== A19.chef(o) and A19.apron(o)
const CHEF_ACC = ['fp19_apron', 'fp19_stache'];
A.chef = o => {
  o = o || {};
  const seed = o.seed ?? 211, t = tOf(o), pose = o.pose || 'ladle';
  const P = pose === 'ladle' ? { arms: { l: 'rest', r: 'hold' }, grip: { r: [128, 58] }, hold: { r: 'fp19_ladle' } } : pose === 'rest' ? { arms: { l: 'rest', r: 'rest' } } : {};
  const r = Object.assign({ kind: 'cabbage', id: 'chef', who: 'chef', s: SC, y: G, seed, expr: 'chef_flat', browW: 11, browColor: '#27401c', browUp: 3 }, P, o);
  r.t = t; r.acc = CHEF_ACC.filter(a => !(a === 'fp19_apron' && o.apron === false)).concat((o.acc || []).filter(a => CHEF_ACC.indexOf(a) < 0));
  if (o.toque === false) r.toque = false;
  return r;
};
A.apron = o => Object.assign({}, o, { acc: (o.acc || []).filter(a => a !== 'fp19_apron').concat('fp19_apron') });

// ================================================================== E15-TURN integration: the cabbage's own leaves / toque / apron read the yaw
(() => {
  if (!V2C.YAW_ACC || !V2C.YAW_TEX || !V2C.YAW_TOP || !V2C.ACC_CLS) return;
  const own = (name, cls) => { const f = (o, k, t, layer) => EXT.acc[name](o, k, t, layer); f.cls = cls; V2C.YAW_ACC[name] = f; };
  own('fp19_apron', 'wrap');
  Object.assign(V2C.ACC_CLS, { fp19_stache: 'face', fp19_hairnet: 'head' });
  V2C.YAW_TEX.cabbage = (o, k, t) => EXT.tex.cabbage(o, k, t);
  V2C.YAW_TOP.cabbage = (o, k, t, layer) => { if (EXT.top.cabbage) EXT.top.cabbage(o, k, t, layer); };
})();
/* @@A19-PART2 */
})();
