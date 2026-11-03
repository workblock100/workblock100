'use strict';
/* SHIFT HAPPENS, Episode 15: "The Merger". Scene module: model2 (4:20 PM, THE FILL, 23.5 s). Builder E15-C. Assembled from build/ep15_c/parts/*.js by build/ep15_c/assemble.sh.
 *
 * THE MODEL, part two: the consultants have moved their desk into the Fruit Bowl corridor (S6.corridor, one-point perspective). Strawberry (per diem) is summoned. Binder fills her row down forty rows:
 * the sheet window grows out of the laptop, the fill handle is dragged, and the window shrinks into a picture-in-picture at the top of the frame while FORTY STRAWBERRIES pop into the hall, row by row
 * (cached small sprites, mixed yaw, who 'chor': the whole crowd mouths the chorus), the real one in front looking at them. The lookup returns #N/A, the clones get an #N/A tag and fade, then UNASSIGNED.
 *
 * @@SHOTS@@
 */
(() => {
if (!window.TIMELINE_EP15 || !window.S6 || !window.H6 || !window.UI) return;
const { zoomTo, faceC } = window.H6;
const S6 = window.S6, SH15 = window.SH15, A15 = window.A15, A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11;

// ------------------------------------------------------------------ small helpers (private copies: other episodes' helpers are not exported)
const c01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = c01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const eo3 = k => 1 - Math.pow(1 - c01(k), 3);
const ei3 = k => { k = c01(k); return k * k * k; };
const eio = k => { k = c01(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const eback = k => { k = c01(k); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const lazy = f => { let v, done = false; return () => (done ? v : (done = true, v = f())); };
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const pk = (t, keys, d) => { let v = d; for (const [t0, x] of keys) if (t >= t0) v = x; return v; };                 /* the value of the last key at or before t */
const pulse = (t, t0, hz = 36, tau = .07) => t < t0 ? 0 : Math.sin((t - t0) * hz) * Math.exp(-(t - t0) / tau);
const spring = (a, w = 14, z = .35) => a < 0 ? 0 : Math.exp(-z * w * a) * Math.cos(w * Math.sqrt(1 - z * z) * a);       /* 1 at a = 0, damped oscillation */
const mix1 = (a, b, k) => a + (b - a) * k;
const OUT = 'rgba(38,24,40,.78)';
/* a monotone cubic through [t, v] keys (Fritsch-Carlson): smooth velocity, no overshoot, flat where two keys are equal (copied from ep14_tracer.js) */
function pchip(keys) {
  const n = keys.length, h = [], d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h[i] = keys[i + 1][0] - keys[i][0]; d[i] = (keys[i + 1][1] - keys[i][1]) / h[i]; }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
  return t => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (t > keys[i + 1][0]) i++;
    const u = (t - keys[i][0]) / h[i], u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * keys[i][1] + (u3 - 2 * u2 + u) * h[i] * m[i] + (-2 * u3 + 3 * u2) * keys[i + 1][1] + (u3 - u2) * h[i] * m[i + 1];
  };
}
/* a smooth blend between vectors: keys [t, vec] */
const vtrack = keys => { const ch = keys[0][1].map((_, j) => pchip(keys.map(k => [k[0], k[1][j]]))); return t => ch.map(f => f(t)); };
/* eyes that dart now and then (a new target about every .7 s, reached in .12 s) */
function dart(t, seed, amp = .25) {
  const q = t / .7 + seed * .37, i = Math.floor(q), f = q - i, e = eo3(f / .17);
  const g = n => [(hash(n * 7.1 + seed) * 2 - 1) * amp, (hash(n * 11.3 + seed + 3) * 2 - 1) * amp * .6];
  const a = g(i - 1), b = g(i);
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
}

// ------------------------------------------------------------------ timing: beats, words (scene-local seconds; B() reads the scene being drawn)
const bs = id => B(id).s, be = id => B(id).e;
const lineOf = id => TL.lines.find(q => q.scene === CUR.id && q.id === id);
const wordT = (id, word, fb = 0) => {
  const l = lineOf(id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z0-9]/g, '').includes(word));
  return w ? l.s - CUR.start + w[1] : fb;
};
/* the mouth of a spoken line: 0 closed .. 1 wide, for a voice id (the engine's own lip-sync string) */
const talkOf = who => talk(who);

// ------------------------------------------------------------------ drawing helpers
const rb = (x, y, w, h, fill, o = {}) => {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, o.r ?? 4);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (o.lw !== 0) { ctx.strokeStyle = o.stroke ?? OUT; ctx.lineWidth = o.lw ?? 2; ctx.stroke(); }
};
const ln = (x0, y0, x1, y1, col, lw, cap = 'round') => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
const disc = (x, y, rx, ry, fill, stroke, lw = 2) => { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry ?? rx), 0, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
const polyp = (pts, fill, stroke, lw = 2) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); } };
const vgrad = (y0, y1, a, b) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
const rgbaC = (hex, a) => { const n = parseInt(hex.replace('#', ''), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mixHex = (a, b, k) => { const p = h => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }, A = p(a), Bq = p(b); return '#' + A.map((v, i) => Math.round(v + (Bq[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

// ------------------------------------------------------------------ framing helpers (copied from ep14_tracer.js and adapted)
/* the body of a character as a screen box under the current transform (the face and the body are audited by the engine: in a close-up only whoever is whole in the frame is drawn) */
function charBox(o) {
  const k = KINDS[o.kind], s = o.s, legLen = o.noLegs ? 0 : (k.leg || 90), cy = o.y - (o.lift || 0) - (legLen + k.ry * .9) * s, m = ctx.getTransform();
  const hw = k.rx * 1.12 * s, top = cy - (TOPS[o.kind] ?? k.ry * 1.05) * s, bot = o.y + 14 * s;
  const q = [[o.x - hw, top], [o.x + hw, top], [o.x - hw, bot], [o.x + hw, bot]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  return [Math.min(...q.map(a => a[0])), Math.min(...q.map(a => a[1])), Math.max(...q.map(a => a[0])), Math.max(...q.map(a => a[1]))];
}
function wholeInFrame(o, pad = 6) {
  const b = charBox(o);
  return b[0] >= pad && b[2] <= W - pad && b[1] >= pad && b[3] <= H - pad;
}
/* a face that is not whole in the frame must not be drawn (the engine audits faces and bodies) */
function faceInFrame(o, pad = 10) {
  const k = KINDS[o.kind], s = o.s, legLen = o.noLegs ? 0 : (k.leg || 90), cy = o.y - (o.lift || 0) - (legLen + k.ry * .9) * s, m = ctx.getTransform();
  const P = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const q = [P(o.x - k.rx * .9 * s, cy + (k.eyeY - k.er * 2.9) * s), P(o.x + k.rx * .9 * s, cy + (k.mouthY + 40) * s)];
  return Math.min(q[0][0], q[1][0]) >= pad && Math.max(q[0][0], q[1][0]) <= W - pad && Math.min(q[0][1], q[1][1]) >= pad && Math.max(q[0][1], q[1][1]) <= H - pad;
}
/* how many shutter samples a camera move needs: the fastest on-screen point speed (px/s) over the shutter time, at about 3 px a sample */
const SHUT = .6 / 30;
function camSpeed(camFn, lt) {
  const dt = .016, a = camFn(lt - dt), b = camFn(lt + dt); let v = 0;
  const pr = (c, x, y) => [W / 2 + (x - c[0]) * c[2], H / 2 + (y - c[1]) * c[2]];
  for (const [x, y] of [[0, 0], [-500, -700], [500, -700], [-500, 700], [500, 700]]) {
    const wx = (a[0] + b[0]) / 2 + x / ((a[2] + b[2]) / 2), wy = (a[1] + b[1]) / 2 + y / ((a[2] + b[2]) / 2);
    const p0 = pr(a, wx, wy), p1 = pr(b, wx, wy); v = Math.max(v, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / (2 * dt));
  }
  return v;
}
const blurN = v => Math.max(1, Math.min(24, Math.ceil(v * SHUT / 3)));

// ------------------------------------------------------------------ effects: smoke, poofs, dust, stars, confetti (pure functions of time; seeds from hash)
/* one soft cartoon smoke ball with a thin ink rim */
function smokeBall(x, y, r, a, o = {}) {
  if (a <= .004 || r < .6) return;
  const tint = o.tint || [255, 255, 255], sh = o.shade || [176, 182, 202];
  const g = ctx.createRadialGradient(x - r * .3, y - r * .34, r * .06, x, y, r);
  const soft = o.rim === false;                                                  /* dust: the edge fades to nothing; cartoon smoke: an opaque shaded edge and an ink rim */
  g.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]},${a})`); g.addColorStop(soft ? .5 : .58, `rgba(${(tint[0] + sh[0]) >> 1},${(tint[1] + sh[1]) >> 1},${(tint[2] + sh[2]) >> 1},${a * (soft ? .85 : .96)})`); g.addColorStop(1, `rgba(${sh[0]},${sh[1]},${sh[2]},${soft ? 0 : a * .9})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (o.rim !== false) { ctx.strokeStyle = `rgba(52,38,70,${.5 * a})`; ctx.lineWidth = Math.max(1.4, r * .06); ctx.stroke(); }
}
/* a four-point sparkle star */
function star4(x, y, r, rot, fill, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a; ctx.fillStyle = fill; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr_ = i % 2 ? r * .28 : r, an = i * PI / 4; ctx.lineTo(Math.cos(an) * rr_, Math.sin(an) * rr_); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
/* the classic cartoon poof at (x, y): a flash and a burst of lines (0 to .14 s), nine smoke balls that billow outward (0 to .4 s) and thin out (.5 to 1.05 s). R = the size of the thing that vanishes (about 70 at the dollhouse scale).
 * `a` is the age in seconds; the thing that vanishes must be hidden by the time the balls cover it (about .06 s) */
function poof(x, y, a, R, o = {}) {
  if (a < 0 || a > 1.12) return;
  const seed = o.seed ?? 1, tint = o.tint;
  ctx.save();
  const fl = c01(1 - a / .16);
  if (fl > 0) {                                                                      /* the flash: a white core and a ring of burst lines */
    const g = ctx.createRadialGradient(x, y, 0, x, y, R * (.7 + .9 * a / .16)); g.addColorStop(0, `rgba(255,252,230,${.95 * fl})`); g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 1.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${.9 * fl})`; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, R * .07);
    for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + hash(seed + i) * .3, r0 = R * (.7 + 1.1 * a / .16), r1 = r0 + R * (.45 + .35 * hash(seed + i * 3)); ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); ctx.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); ctx.stroke(); }
  }
  const k = eo3(a / .4), fade = 1 - sstep(a, .5, 1.08), grow = .35 + .65 * eo3(a / .24), shrink = 1 - .25 * sstep(a, .6, 1.1), puffs = [];
  for (let i = 0; i < 11; i++) {                                                     /* a cumulus of eleven balls: a ring of big ones and a few small ones that rise */
    const big = i < 7, an = (big ? i / 7 : (i - 7) / 4 + .2) * TAU + hash(seed * 3 + i) * .7, dist = R * (big ? .3 + .42 * hash(seed + i * 5.1) : .5 + .3 * hash(seed + i * 4.7)) * k;
    const rad = R * (big ? .36 + .2 * hash(seed + i * 2.2) : .2 + .1 * hash(seed + i * 6.1)) * grow * shrink;
    puffs.push([x + Math.cos(an) * dist * 1.15, y + Math.sin(an) * dist * .78 - a * R * (big ? .22 : .42) - 5 * Math.sin(a * 5 + i), rad]);
  }
  puffs.sort((p, q) => p[1] - q[1]);
  for (const [px, py, rad] of puffs) smokeBall(px, py, rad, fade, { tint });
  smokeBall(x, y - a * R * .15, R * .3 * grow * shrink, fade, { tint });
  for (let i = 0; i < 7; i++) {                                                      /* sparkles */
    const an = i / 7 * TAU + hash(seed + 40 + i), v = R * (1.4 + hash(seed + 60 + i) * 1.6), life = .5 + hash(seed + 80 + i) * .3, f = c01(a / life);
    if (f >= 1) continue; star4(x + Math.cos(an) * v * eo3(f) * .9, y + Math.sin(an) * v * eo3(f) * .7 + f * f * R * .8, R * .13 * (1 - f * .6), a * 9 + i, i % 2 ? '#ffe135' : '#ffffff', 1 - f);
  }
  ctx.restore();
}
/* a lingering wisp of smoke rising from where a poof was (age since the poof) */
function wisp(x, y, a, R, seed = 1) {
  if (a < .35 || a > 2.2) return;
  const f = (a - .35) / 1.85, al = (1 - f) * .5;
  for (let i = 0; i < 3; i++) smokeBall(x + Math.sin(a * 2.4 + i * 2) * R * .22, y - R * (.15 + .9 * f) - i * R * .22, R * (.18 + .2 * f + i * .04), al * (1 - i * .22), { rim: false });
}
/* a soft dust puff on the ground (a ring that billows and thins), for impacts */
function dustPuff(x, y, a, R, o = {}) {
  if (a < 0 || a > 1.4) return;
  const k = eo3(a / .7), al = (o.alpha ?? .85) * (1 - sstep(a, .35, 1.4)), col = o.tint || [214, 196, 168], sh = o.shade || [150, 128, 100];
  for (let i = 0; i < (o.n ?? 6); i++) {
    const side = (i % 2 ? 1 : -1), u = (i >> 1) / Math.max(1, ((o.n ?? 6) >> 1)), dx = side * (R * (.2 + .9 * u)) * k, rad = R * (.28 + .22 * hash(i + (o.seed ?? 3))) * (.45 + .55 * k), dy = -rad * .45 - a * R * .35 * (.4 + u);
    smokeBall(x + dx, y + dy, rad, al, { tint: col, shade: sh, rim: false });
  }
}
/* dust that streams from a point: n balls leave with their own velocities and thin out; (x0, y0) the source, vx / vy the typical launch (px/s) */
function dustJet(x0, y0, a, o = {}) {
  const n = o.n ?? 12, vx = o.vx ?? 0, vy = o.vy ?? -240, life = o.life ?? 1.1, R = o.r ?? 26, seed = o.seed ?? 7;
  if (a < 0 || a > life + .7) return;
  for (let i = 0; i < n; i++) {
    const t0 = (o.spread ?? .4) * hash(seed + i * 1.7), age = a - t0; if (age < 0 || age > life) continue;
    const f = age / life, sx = (hash(seed + i * 3.3) * 2 - 1), vx_ = vx + sx * (o.fan ?? 120), vy_ = vy * (.55 + .6 * hash(seed + i * 5.1));
    const px = x0 + vx_ * age * (1 - .35 * f), py = y0 + vy_ * age * (1 - .5 * f) + (o.g ?? 160) * age * age * .5, rad = R * (.5 + .9 * f) * (.7 + .5 * hash(seed + i * 7.7));
    smokeBall(px, py, rad, (o.alpha ?? .75) * (1 - f) * Math.min(1, age / .06), { tint: o.tint || [216, 198, 170], shade: o.shade || [150, 128, 100], rim: false });
  }
}
/* confetti falling through a screen rectangle (screen space): a burst at t0, gravity, flutter, tumbling rectangles */
function confetti(a, x, y, o = {}) {
  if (a < 0 || a > 3.2) return;
  const n = o.n ?? 90, cols = o.cols || ['#1e8e5a', '#ffbf1f', '#2b6cff', '#ff5a8a', '#7ad9a8', '#ffffff', '#ff9a3a'], seed = o.seed ?? 4;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const h1 = hash(seed + i * 1.37), h2 = hash(seed + i * 2.91), h3 = hash(seed + i * 4.13), h4 = hash(seed + i * 5.57);
    const an = -PI / 2 + (h1 - .5) * (o.spread ?? 2.6), v = (o.speed ?? 1400) * (.35 + .65 * h2), age = a - h3 * .08;
    if (age < 0) continue;
    const drag = Math.exp(-age * 2.4), px = x + Math.cos(an) * v * (1 - drag) / 2.4 + Math.sin(age * (3 + h4 * 4) + i) * 18 * Math.min(1, age), py = y + Math.sin(an) * v * (1 - drag) / 2.4 + 420 * age * age * .5 * (.6 + .5 * h2) * Math.min(1, age * 1.4);
    const fade = 1 - sstep(age, 2.2, 3.1), w = 12 + 14 * h3, hh = 8 + 9 * h4;
    ctx.save(); ctx.translate(px, py); ctx.rotate(h1 * TAU + age * (4 + 6 * h2)); ctx.scale(1, Math.cos(age * (6 + 8 * h3) + i)); ctx.globalAlpha *= fade;
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-w / 2, -hh / 2, w, hh); ctx.restore();
  }
  ctx.restore();
}
/* a small ring that expands and fades (a click, a pop, a ripple) in the current transform */
function ripple(x, y, a, R, col = '255,255,255', lw = 4, dur = .45) {
  if (a < 0 || a > dur) return;
  const f = a / dur;
  ctx.save(); ctx.strokeStyle = `rgba(${col},${.9 * (1 - f)})`; ctx.lineWidth = lw * (1 - f * .6); ctx.beginPath(); ctx.arc(x, y, R * eo3(f), 0, TAU); ctx.stroke(); ctx.restore();
}

// ------------------------------------------------------------------ cues (scene-local seconds, `python3 /tmp/shift_tools/cues.py 15 model2`) and the crowd of forty
const CUE = { sniffle: 4.102, click: 6.869, pop: [7.469, 7.769, 8.069, 8.319, 8.569, 8.769, 8.969, 9.119, 9.269, 9.419, 9.569, 9.719, 9.869, 10.019, 10.169], crowd: 10.369, typing: 17.295, error: 18.195, sting: 22.55 };
const POPN = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4];                          /* clones per fillpop: 40 in all */
const ROWS = [[1750, 4], [2100, 5], [2500, 5], [3000, 5], [3600, 5], [4350, 5], [5250, 6], [6350, 5]];     /* depth and head count of the eight rows */
const HALL = { f: 1400, cy: 360, hy: 860, HW: 330 };
const CS = .56;                                                                       /* a clone's size relative to the hall's scale at its depth */
const REAL = { X: 168, Z: 1010, cs: .68 };                                            /* the real Strawberry: in front, full size */
/* the forty: position, look, timing seeds; sorted by distance from the real one (the ripple starts next to her and spreads); each gets its pop time */
const CLONES = lazy(() => {
  const list = [];
  ROWS.forEach(([Z, n], r) => { for (let i = 0; i < n; i++) { const u = (i + .5 + (r % 2 ? .22 : -.22)) / n, X = lerp(-268, 268, Math.max(.02, Math.min(.98, u))) + (hash(r * 9 + i * 1.7) - .5) * 26, h = hash(r * 31 + i * 7.3 + 5); list.push({ X, Z, yaw: h < .46 ? 0 : h < .73 ? 1 : 2, ph: hash(i * 3.1 + r) * TAU, d: Math.round(hash(r * 5 + i * 2.3) * 3), r, i }); } });
  list.sort((a, b) => Math.hypot((a.X - REAL.X) * .9, (a.Z - REAL.Z) * .32) - Math.hypot((b.X - REAL.X) * .9, (b.Z - REAL.Z) * .32));
  let k = 0; POPN.forEach((n, j) => { for (let q = 0; q < n; q++) { const c = list[k++]; c.pop = CUE.pop[j] + q * .035; c.popIdx = j; } });
  list.forEach((c, i) => { c.id = i; c.late = i === 17; });                           /* one clone is a beat late in the slump */
  return list;
});
const poppedBy = lt => { let n = 0; for (let j = 0; j < CUE.pop.length; j++) if (lt >= CUE.pop[j]) n += POPN[j]; return n; };

// ------------------------------------------------------------------ cached sprites: 3 yaws x 4 mouths x 3 slump states (x faded), at two sizes; drawn once through the engine, blitted forty times
const SPR = new Map(), YAWS = [0, .6, -.6];
const SP_W = 400, SP_H = 450, SP_FX = 200, SP_FY = 432;
function cloneSprite(yawIdx, mouth, slump, faded, lod) {
  const key = `${yawIdx}|${mouth}|${slump}|${faded ? 1 : 0}|${lod}`;
  let sp = SPR.get(key); if (sp) return sp;
  const s0 = lod ? .42 : 1, cv = document.createElement('canvas'); cv.width = Math.ceil(SP_W * s0); cv.height = Math.ceil(SP_H * s0); cv.__txOK = true;
  const g = cv.getContext('2d'), prev = ctx, A = A11 || A7;
  ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  REG.suppress++;
  try {
    const o = A.straw({ x: SP_FX * s0, y: SP_FY * s0, s: s0, t: 0, yaw: YAWS[yawIdx], headYaw: YAWS[yawIdx], talk: mouth / 3, noBob: true, noShadow: true, noReflect: true, who: undefined, look: [yawIdx === 1 ? .3 : yawIdx === 2 ? -.3 : 0, .05],
      expr: slump === 0 ? 'neutral' : slump === 1 ? 'weak' : 'dead', lid: slump === 0 ? undefined : slump === 1 ? .35 : .6, squash: slump * .035, arms: { l: slump ? 'down' : 'rest', r: slump ? 'down' : 'rest' }, rot: 0 });
    drawChar(o);
  } finally { REG.suppress--; ctx = prev; }
  if (faded) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(214,218,230,.5)'; g.fillRect(0, 0, cv.width, cv.height); g.globalCompositeOperation = 'source-over'; }
  SPR.set(key, cv); return cv;
}
/* the chorus mouth at an absolute scene time (the engine's own lip-sync string of the `chor` line, sampled with a per-clone delay so no two mouths are exactly alike) */
function chorAt(lt) {
  const T_ = CUR.start + lt;
  for (const l of TL.lines) if (l.who === 'chor' && T_ >= l.s && T_ < l.e) { const i = Math.min(l.mouth.length - 1, Math.floor((T_ - l.s) * FPS)); return (l.mouth.charCodeAt(i) - 48) / 9; }
  return 0;
}
const slumpAt = (lt, c) => { const t0 = 14.98 + (c.late ? .4 : 0) + c.d * .03, k = c01((lt - t0) / .45); return k <= 0 ? 0 : k < .5 ? 1 : 2; };
const fadeAt = (lt, c) => c01((lt - (20.3 + c.id * .012)) / .5);
/* draw the crowd: far to near, each with its pop-in, its breath and its mouth */
function drawCrowd(lt, o = {}) {
  const list = CLONES(), vis = list.filter(c => lt >= c.pop - .001).sort((a, b) => b.Z - a.Z);
  const prevS = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (const c of vis) {
    const q = V2.at(c.X, c.Z), age = lt - c.pop, sc = q.s * CS, pop = age < .26 ? eback(age / .26) : 1, hop = age < .26 ? -Math.sin(PI * c01(age / .26)) * 26 * sc : 0;
    if (pop <= .01) continue;
    const m = Math.round(c01(chorAt(lt - c.d * .034) * 1.25) * 3), sl = slumpAt(lt, c), fd = fadeAt(lt, c) > .5 ? 1 : 0, lod = sc < .3 ? 1 : 0, spr = cloneSprite(c.yaw, m, sl, fd, lod);
    const br = Math.sin(lt * 2.2 + c.ph), kx = sc * pop * (1 + .004 * br), ky = sc * pop * (1 - .006 * br - (sl === 2 ? .02 : 0)), drop = sl ? sc * (sl === 1 ? 5 : 11) : 0;
    ctx.save(); ctx.globalAlpha *= 1 - .22 * fadeAt(lt, c);
    ctx.fillStyle = 'rgba(30,24,40,.22)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + 3 * sc, 118 * sc * pop, 14 * sc * pop, 0, 0, TAU); ctx.fill();               /* a soft shadow */
    const k0 = lod ? 1 / .42 : 1;
    ctx.drawImage(spr, q.x - SP_FX * kx, q.y - SP_FY * ky + hop + drop, SP_W * kx, SP_H * ky);
    ctx.restore();
    if (age >= 0 && age < .5 && o.sparks !== false) { ripple(q.x, q.y - 6 * sc, age, 90 * sc, '255,255,255', 4 * sc + 1, .4); star4(q.x + 70 * sc, q.y - 250 * sc * (age / .5 + .3), 14 * sc, age * 8, '#ffe135', 1 - age / .5); star4(q.x - 80 * sc, q.y - 200 * sc * (age / .5 + .3), 11 * sc, -age * 7, '#ffffff', 1 - age / .5); }
  }
  ctx.imageSmoothingEnabled = prevS;
}
/* the tags over their heads: #N/A (20.3 on, rippling) that become UNASSIGNED on "Unassigned!" (21.67) */
const T_UNA = 21.7;
function drawTags(lt) {
  if (lt < 20.3) return;
  for (const c of CLONES()) {
    const a = c01((lt - (20.34 + c.id * .012)) / .25); if (a <= 0) continue;
    const q = V2.at(c.X, c.Z), sc = q.s * CS, size = Math.max(9, 38 * sc), x = q.x, y = q.y - 345 * sc - 6, u = c01((lt - T_UNA - (c.id % 8) * .02) / .3);
    const hero = false, w1 = UI.sizeOf('#N/A', { size, weight: 900 }).w + size * 1.1, w2 = UI.sizeOf('UNASSIGNED', { size: size * .78, weight: 900 }).w + size * 1.1, w = lerp(w1, w2, u);
    ctx.save(); ctx.globalAlpha *= a;
    const bg = u < .5 ? '#d93025' : '#ffbf1f', ink = u < .5 ? '#ffffff' : '#22262b';
    UI.panel([x - w / 2, y - size * .95, w, size * 1.9], { id: 'ctag' + c.id, kind: 'tag', fill: bg, stroke: 'rgba(30,20,30,.8)', lw: Math.max(1, size * .08), r: size * .5, pad: 0, shadow: 0, hero: false, crop: true });
    if (u < .5) UI.label('#N/A', x, y, { size: size * .92, fill: ink, hero: hero, crop: !hero, grp: 'na', cid: 'ctag' + c.id, alpha: 1 - u * 2 });
    else UI.label('UNASSIGNED', x, y, { size: size * .72, fill: ink, hero: hero, crop: !hero, grp: 'un', cid: 'ctag' + c.id, alpha: (u - .5) * 2, maxW: w - size * .5 });
    ctx.restore();
  }
}

// ------------------------------------------------------------------ the hall (S6.corridor), the desk, the consultants, the real Strawberry
const CT = {
  onion: o => A15 ? A15.onion(o) : A7.lemon(Object.assign({ who: 'onion' }, o)), tomato: o => A15 ? A15.tomato(o) : A7.straw(Object.assign({ who: 'tom' }, o)),
  binder: o => A15 ? A15.binder(o) : A7.lemon(Object.assign({ who: 'bind', center: true }, o)), straw: o => (A11 || A7).straw(o),
};
const win = (lt, a, b) => c01((lt - a) / (b - a));
const pulseW = (lt, t0, d) => lt < t0 || lt > t0 + d ? 0 : Math.sin(PI * (lt - t0) / d);
const DCOL = ['#a8744f', '#7d9a6a', '#6f8fb5', '#b98a5a'], DOORS = [];
for (let j = 0; j < 9; j++) for (const side of [1, -1]) DOORS.push({ side, z: (side > 0 ? 1500 : 1900) + 520 * j, n: String(side > 0 ? 1 + 2 * j : 2 + 2 * j), color: DCOL[(j + (side > 0 ? 0 : 2)) % 4] });
DOORS.sort((a, b) => a.z - b.z);
let HCAM = { cy: HALL.cy, hy: HALL.hy };
function drawHall(lt) {
  V2.setCam({ f: HALL.f, cy: HCAM.cy, hy: HCAM.hy });
  V2.setLight({ key: [-.3, -.85], keyColor: '#fff1d6', keyA: .2, rim: '#9fc4ff', rimA: .4, shadow: '#1a1030', shadowA: .3, amb: '#ffffff', ambA: .05 });
  V2.opts.reflect = false;
  S6.corridor({ doors: DOORS, fog: '#b4bfd0', fogAmt: .5, wall: '#e9e0cb', wain: '#5c9298', bright: 1, signs: [] });
}
const DESK = { X: -168, Z: 1010, cs: .66 };
const deskQ = () => V2.at(DESK.X, DESK.Z);
const dsc = () => deskQ().s * DESK.cs;                                           /* the standing scale at the desk */
const atX = (X, Z = DESK.Z) => { const q = V2.at(X, Z); return { x: q.x, y: q.y, s: q.s * DESK.cs }; };
function onionD(lt, ov = {}) {
  const p = atX(-262), sp = talkOf('onion'), sob = pulseW(lt, CUE.sniffle, .55);
  return Object.assign(CT.onion({ x: p.x, y: p.y, s: p.s, t: lt, yaw: .45, look: [.8, .15], cry: c01(.5 + .3 * sp), expr: 'onion_cry', sob, arms: { l: 'rest', r: 'hold' }, grip: { r: [64, 82] }, hold: { r: 'fp15_tabletclip' }, tabAt: [-.3, .12], tabRot: .05 }), ov);
}
function tomatoD(lt, ov = {}) {
  const p = atX(-76), clap = lt > 13.9 && lt < 14.9 ? Math.abs(Math.sin((lt - 13.9) * 22)) : 0;
  const arms = clap > 0 || (lt > 13.75 && lt < 15) ? { l: 'hold', r: 'hold' } : { l: 'rest', r: 'rest' };
  return Object.assign(CT.tomato({ x: p.x, y: p.y, s: p.s, t: lt, yaw: -.4, look: [-.7, .2], arms, grip: { l: [-34 + 22 * clap, 70], r: [34 - 22 * clap, 70] }, hand: { l: 'flat', r: 'flat' }, expr: lt > 13.75 && lt < 15.2 ? 'happy' : undefined }), ov);
}
function binderD(lt, ov = {}) {
  const p = atX(-168), bob = Math.sin(lt * 3.1) * 4 * p.s + 2 * Math.sin(lt * 5.3 + 1) * p.s;
  return Object.assign(CT.binder({ x: p.x, y: p.y - 215 * p.s + bob, s: p.s * .72, t: lt, center: true, noLegs: true, hover: 100, look: [Math.sin(lt * .9) * .5, .35], pose: 'helpful' }), ov);
}
function strawR(lt, ov = {}) {
  const q = V2.at(REAL.X, REAL.Z), slump = c01((lt - 14.98) / .5);
  return Object.assign(CT.straw({ x: q.x, y: q.y, s: q.s * REAL.cs, t: lt, who: 'straw', yaw: -.35, look: [-.55 + .6 * c01((lt - 11.0) / .4), .1], expr: lt < 11.3 ? 'dead' : lt > 14.9 ? 'dead' : 'neutral', lid: lt < 11.3 ? .35 : lt > 14.9 ? .5 : undefined, squash: .03 * slump, arms: { l: 'rest', r: 'rest' } }), ov);
}
function drawDesk(lt) {                                                          /* the long desk's front (cream cloth, green hem) and the laptop; drawn after the cast so the cloth hides their legs */
  const p = atX(DESK.X), s = p.s, w = 300 * s, x0 = p.x - w / 2, y0 = p.y - 52 * s, y1 = p.y - 12 * s;
  ctx.save();
  rb(x0, y0 - 6 * s, w, 9 * s, '#efe8d6', { r: 3 * s, lw: 2 });
  ctx.fillStyle = vgrad(y0, y1, '#f7f4ea', '#d8d2bd'); ctx.beginPath(); ctx.moveTo(x0 - 3 * s, y0 + 2 * s); ctx.lineTo(x0 + w + 3 * s, y0 + 2 * s); ctx.lineTo(x0 + w + 3 * s, y1 - 6 * s);
  for (let x = x0 + w + 3 * s; x > x0 - 3 * s; x -= 22 * s) ctx.quadraticCurveTo(x - 11 * s, y1 + 8 * s, x - 22 * s, y1 - 6 * s);
  ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(38,24,40,.8)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#2f7d4a'; ctx.fillRect(x0 - 3 * s, y0 + 2 * s, w + 6 * s, 7 * s);
  ctx.save(); ctx.translate(p.x - 20 * s, y0 + 22 * s); ctx.rotate(-.5); ctx.scale(s, s); ctx.fillStyle = '#3fae5c'; ctx.beginPath(); ctx.moveTo(0, -17); ctx.bezierCurveTo(15, -10, 15, 11, 0, 17); ctx.bezierCurveTo(-15, 11, -15, -10, 0, -17); ctx.fill(); ctx.strokeStyle = '#1b4d2f'; ctx.lineWidth = 1.6; ctx.stroke(); ln(0, -13, 0, 17, '#1b4d2f', 1.6); ctx.restore();
  const lap = A15 && A15.laptop ? A15.laptop(p.x - 20 * s + 0, y0 - 6 * s, { lapScale: .38 * s / .44 * .9 }) : null;
  ctx.restore();
  return lap;
}
const deskLaptopRect = () => { const p = atX(DESK.X), s = p.s, r = A15 && A15.laptopScreen ? A15.laptopScreen({ lapScale: .38 * s / .44 * .9 }) : [-25, -35, 25, -10], ox = p.x - 20 * s, oy = p.y - 52 * s - 6 * s; return [ox + r[0], oy + r[1], ox + r[2], oy + r[3]]; };

// ------------------------------------------------------------------ the sheet: Fill Down (the window grows out of the laptop, is dragged, then shrinks into a picture-in-picture) and the lookup (#N/A)
const WIN_W = 1080, WIN_H = 1124, WIN_Y = 256, HEAD_FILL = '#e8f3ee', C = SH15 ? SH15.colors : {};
const lineText = id => { const l = lineOf(id); return l ? l.text : ''; };
function typedCount(lt, id, lead = 0) {
  const l = lineOf(id); if (!l) return 0;
  const a = lt - (l.s - CUR.start) + lead; let n = 0;
  for (let i = 0; i < l.words.length; i++) { const w = l.words[i], len = w[0].length + (i < l.words.length - 1 ? 1 : 0), s0 = w[1], e0 = Math.min(w[2], s0 + .35); n += len * c01((a - s0) / Math.max(.05, e0 - s0)); }
  return Math.round(n);
}
const pressK = (lt, c) => lt >= c[0] && lt <= c[1] ? Math.sin(PI * (lt - c[0]) / (c[1] - c[0])) : 0;
const xfAt = (k, from, to) => { const e = eback(k); return { cx: lerp(from.cx, to.cx, eo3(k)), cy: lerp(from.cy, to.cy, eo3(k)), s: lerp(from.s, to.s, e) }; };
function withXf(xf, fn) { ctx.save(); ctx.translate(xf.cx, xf.cy); ctx.scale(xf.s, xf.s); ctx.translate(-WIN_W / 2, -WIN_H / 2); try { fn(); } finally { ctx.restore(); } }
function dimWorld(a) { if (a <= .01) return; ctx.save(); ctx.fillStyle = `rgba(8,13,19,${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
const FULL = { cx: W / 2, cy: WIN_Y + WIN_H / 2, s: 1 }, PIP = { cx: 790, cy: 534, s: .46 };
function binderUI(lt, id, o = {}) {
  const text = lineText(id), l = lineOf(id); if (!SH15 || !l) return;
  const n = typedCount(lt, id, o.lead || 0), pop = o.pop ?? c01((lt - (l.s - CUR.start) + .02) / .22);
  SH15.binder({ at: o.at || [690, 640], w: o.w || 370, tail: o.tail || [900, 900], text, typed: SH15.typed(n, text.length), pop, size: o.size || 32, hero: o.hero !== false, dressing: o.hero === false, buttons: [] }, lt);
  const m = o.mascot || [930, 960];
  if (pop > .05) drawChar(CT.binder({ x: m[0], y: m[1], s: .74, t: lt, center: true, noLegs: true, hover: 0, noShadow: true, pose: o.pose || 'wave', look: [-.5, .3], grin: o.grin || 0, glint: o.glint || 0, who: 'bind', alpha: c01(pop * 1.4), transit: !!o.transit }));
}
// ---- the staff table with Strawberry's row
const NAMES = ['Lemon', 'Mango', 'Clementine', 'Kiwi', 'Carrot', 'Blueberry', 'Apple', 'Melon', 'Pineapple', 'Fig', 'Plum', 'Quince'];
function staff2(o = {}) {
  const cells = { A1: { v: 'NAME', bold: true, fill: HEAD_FILL }, B1: { v: 'ROLE', bold: true, fill: HEAD_FILL }, C1: { v: 'STATUS', bold: true, fill: HEAD_FILL }, D1: { v: 'UNIT', bold: true, fill: HEAD_FILL, align: 'center' } };
  if (o.strawberry !== false) { cells.A2 = 'Strawberry'; cells.B2 = 'RN'; cells.C2 = 'per diem'; cells.D2 = { v: 'All', align: 'center' }; }
  NAMES.forEach((n, i) => { const r = (o.strawberry === false ? 2 : 3) + i; cells['A' + r] = n; cells['B' + r] = ['Charge Nurse', 'CNA', 'RN', 'Aide'][i % 4]; cells['C' + r] = 'staff'; cells['D' + r] = { v: ['3W', '3E', '2N', 'Rehab'][i % 4], align: 'center' }; });
  return Object.assign({ w: WIN_W, h: WIN_H, rowH: 48, freeze: 1, doc: 'SYNERGY_MODEL_v47_FINAL_REAL', tabs: ['Sheet1', 'Floors', 'Staff', 'Policies'], tab: 'Staff', r: 16, shadow: 30, saved: false, cols: { A: 220, B: 180, C: 170, D: 100, E: 260 }, cells }, o.sheet || {});
}
// ---- Fill Down: the handle is grabbed at the click (6.869) and dragged to row 42; the rows fill in step with the pops (the handle's position follows the cumulative clone count)
const FILL = { t0: 6.95, rows: 40 };
const fillKeys = lazy(() => { const k = [[FILL.t0, 0]]; let n = 0; CUE.pop.forEach((t, j) => { n += POPN[j]; k.push([t + .02, n]); }); k.push([10.45, 40]); return pchip(k); });
const invIO = y => y < .5 ? Math.sqrt(y / 2) : 1 - Math.sqrt((1 - y) / 2);
const fillU = lt => lt <= FILL.t0 ? 0 : c01(invIO(c01(fillKeys()(lt) / FILL.rows)));
const FILL_OPTS = { from: 'A2:D2', to: 42, hero: false };
function drawFill(lt, pip) {
  const u = fillU(lt), so = staff2({ sheet: { ribbon: { tab: 'Home', hot: lt < CUE.click ? 'fill' : null }, sel: 'A2:D2', active: 'A2', dressing: !!pip } });
  const R = SH15.cellRect('D2', so);
  if (u <= 0) SH15.sheet(so, lt); else SH15.fillDrag(Object.assign({ sheet: so, tip: n => String(n) }, FILL_OPTS, { hero: !pip }), u, lt);
  const fd = u > 0 && u < 1 ? SH15.fillDrag ? null : null : null;
  const hx = R.x1, hy = R.y1;
  const cp = SH15.cursorPath([{ t: 6.45, x: 900, y: 700, kind: 'arrow' }, { t: 6.8, x: hx + 1, y: hy + 1, kind: 'cross', click: [6.82, 6.95], hold: .0 }, { t: 7.0, x: hx + 1, y: hy + 1 }], lt);
  if (u <= 0) SH15.pointer(cp.x, cp.y, { kind: cp.kind, press: cp.press, s: 1.2 });
  return u;
}
let FILL_HANDLE = null;
function drawFillWindow(lt, xf) {
  withXf(xf, () => {
    const u = fillU(lt), pip = xf.s < .9;
    const so = staff2({ sheet: { ribbon: { tab: 'Home', hot: lt < CUE.click ? 'fill' : null }, sel: 'A2:D2', active: 'A2', dressing: pip } });
    const R = SH15.cellRect('D2', so);
    if (u <= 0) SH15.sheet(so, lt);
    else { const r = SH15.fillDrag(Object.assign({ sheet: so, tip: n => String(n) }, FILL_OPTS, { hero: false }), u, lt); FILL_HANDLE = r.handle; if (u < 1) SH15.pointer(r.handle.x, r.handle.y, { kind: 'cross', press: 1, s: 1.15 }); }
    if (u <= 0) { const cp = SH15.cursorPath([{ t: 6.45, x: 900, y: 700, kind: 'arrow' }, { t: 6.8, x: R.x1 + 1, y: R.y1 + 1, kind: 'cross', click: [6.82, 6.95] }, { t: 7.0, x: R.x1 + 1, y: R.y1 + 1 }], lt); SH15.pointer(cp.x, cp.y, { kind: cp.kind, press: cp.press, s: 1.2 }); }
    if (lt < 6.78) binderUI(lt, 'b1', { at: [690, 640], w: 360, tail: [900, 900], mascot: [930, 960], pop: c01((lt - 6.1) / .2), transit: pip || xf.moving, hero: !(pip || xf.moving) });
  });
}
// ---- the lookup (16.3 to 19.3): =LOOKUP("Strawberry", Staff) typed, Enter, #N/A in red with its tooltip
const FORMULA = '=LOOKUP("Strawberry", Staff)', LK = { type: [CUE.typing, 18.1], enter: 18.15 };
function drawLookup(lt, xf, dressing) {
  withXf(xf, () => {
    const typing = lt >= LK.type[0] && lt < LK.enter, k = c01((lt - LK.type[0]) / (LK.type[1] - LK.type[0])), n = Math.round(k * FORMULA.length), done = lt >= LK.enter;
    const base = staff2({ strawberry: false, sheet: { sel: 'E2', active: 'E2', ribbon: { tab: 'Data', hot: lt < 17.2 ? 'lookup' : null }, dressing, formula: typing || done ? { text: FORMULA, typed: typing ? SH15.typed(n, FORMULA.length) : 1, caret: typing } : undefined } });
    base.cells.E1 = { v: 'LOOKUP', bold: true, fill: HEAD_FILL, align: 'center' };
    const so = Object.assign({}, base, { edit: typing ? { ref: 'E2', text: FORMULA, typed: SH15.typed(n, FORMULA.length), size: 22 } : null });
    SH15.sheet(so, lt);
    if (lt >= CUE.error) SH15.errorCell('E2', '#N/A', c01((lt - CUE.error) / 1.1), { sheet: so, size: 34, hero: !dressing, tipHero: false, dressing });
    binderUI(lt, lt < 18.3 ? 'b2' : 'b3', { at: [690, 660], w: 370, tail: [900, 920], mascot: [930, 970], transit: dressing, hero: !dressing });
  });
}

// ------------------------------------------------------------------ cameras: the hall's own perspective (HCAM: the crane-up of the reveal) and the 2D framing on top of it
const faceOf2 = o => faceC(o);
const BASE = { cy: HALL.cy, hy: HALL.hy }, TOP = { cy: 660, hy: 700 };
const hcamAt = lt => { const k = eio((lt - CUE.crowd) / 1.3); return { cy: lerp(BASE.cy, TOP.cy, k), hy: lerp(BASE.hy, TOP.hy, k) }; };
/* returns [cx, cy, z, dof px] for scene time lt; the hall camera is set first because the cast positions depend on it */
function camOf2(lt) {
  HCAM = hcamAt(lt); V2.setCam({ f: HALL.f, cy: HCAM.cy, hy: HCAM.hy });
  const pO = atX(-262), pT = atX(-76), eye = HCAM.hy - (860 - 1180);               /* the scene y that keeps the old composition when the horizon moves */
  const wideY = lt < CUE.crowd ? 1180 : lerp(1180, 1300, eio((lt - CUE.crowd) / 1.3));
  const k = lt / 1.0;
  if (lt < 1.0) return [540, 1180, lerp(1.0, 1.06, eio(k)), 0];
  if (lt < 3.0) return [(pO.x + pT.x) / 2, 1145 + 150 / 1.9, lerp(1.85, 2.05, eio((lt - 1) / 1.9)), 4];
  if (lt < 4.77) return [pO.x + 60, 1145 + 150 / 2.3, lerp(2.2, 2.4, eio((lt - 3) / 1.7)), 4];
  if (lt < 5.74) return [pT.x - 30, 1145 + 150 / 2.7, lerp(2.6, 2.8, eio((lt - 4.77) / .97)), 4];
  if (lt < 6.77) { const b = binderD(lt); return [b.x, b.y + 150 / 3.1, 3.1, 4]; }
  if (lt < CUE.crowd) return [540, wideY, 1.0, 0];
  if (lt < 11.32) return [540, wideY, lerp(1.0, 1.04, eio((lt - CUE.crowd) / .95)), 0];
  if (lt < 12.36) { const o = strawR(lt), f = faceOf2(o); return [f[0] - 40, f[1] + 190 / 2.5, lerp(2.4, 2.55, eio((lt - 11.32) / 1.04)), 5]; }
  if (lt < 13.75) return [540, 1300, lerp(1.0, 1.05, eio((lt - 12.36) / 1.4)), 0];
  if (lt < 14.95) { const t = tomatoD(lt), f = faceOf2(t); return [f[0], f[1] + 190 / 2.4, 2.4, 5]; }
  if (lt < 19.34) return [540, 1300, lerp(1.05, 1.0, eio((lt - 14.95) / 4.4)), 0];
  if (lt < 20.28) { const o = strawR(lt), f = faceOf2(o); return [f[0] - 40, f[1] + 190 / 2.6, lerp(2.5, 2.7, eio((lt - 19.34) / .94)), 5]; }
  return [540, 1300, lerp(1.0, 1.1, eio((lt - 20.28) / 3.2)), 0];
}
const SHOT_T = [1.0, 3.0, 4.77, 5.74, 6.77, CUE.crowd, 11.32, 12.36, 13.75, 14.95, 19.34, 20.28];
const nearCut = lt => SHOT_T.some(t => Math.abs(lt - t) < .05);
const cam3 = lt => { const c = camOf2(lt); return [c[0], c[1], c[2]]; };
const FULL_WIN = lt => (lt >= 6.55 && lt < 7.15) || (lt >= 16.5 && lt < 19.15);             /* the sheet window covers (almost) everything: the cast under it is not drawn */

// ------------------------------------------------------------------ drawing
function drawWorld(lt) {
  const c = camOf2(lt), px = c[3];
  const bg = () => { drawHall(lt); drawCrowd(lt); };
  if (px > .5) V2.dof(px, bg); else bg();
  if (FULL_WIN(lt)) return;
  const cast = [];
  if (lt < 6.4 || lt > 19.6) cast.push(binderD(lt));
  cast.push(onionD(lt), tomatoD(lt));
  const seen = o => o.kind === 'bind' || wholeInFrame(o, 4) || faceInFrame(o);
  for (const o of cast) if (seen(o)) drawChar(o);
  drawDesk(lt);
  const sr = strawR(lt); if (seen(sr)) drawChar(sr);
  if (lt >= 20.3) drawTags(lt);
}
function laptopScreenPx(lt) {                                                    /* the desk laptop's screen in screen pixels under the camera of time lt */
  const c = camOf2(lt), r = deskLaptopRect(), P = (x, y) => [W / 2 + (x - c[0]) * c[2], H / 2 + (y - c[1]) * c[2]], a = P(r[0], r[1]), b = P(r[2], r[3]);
  return { cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, s: Math.max(.12, Math.min(.5, (b[0] - a[0]) / WIN_W)) };
}
let POPF = null, POPL = null;
function drawOverlay(lt) {
  if (!SH15) return;
  if (lt >= 6.45 && lt < 10.7) {                                                  /* Fill Down: pop, drag, shrink into the picture-in-picture, slide away */
    const from = POPF || (POPF = laptopScreenPx(6.45)), pop = c01((lt - 6.45) / .3), shrink = c01((lt - 7.05) / .35), out = c01((lt - 10.4) / .28);
    let xf = pop < 1 ? xfAt(pop, from, FULL) : FULL;
    if (shrink > 0) xf = xfAt(shrink, FULL, PIP);
    xf = Object.assign({}, xf, { cx: xf.cx + out * 760, cy: xf.cy - out * 400 });
    dimWorld(.55 * pop * (1 - shrink));
    const mv = pop < 1 || shrink > 0 && shrink < 1 || out > 0; xf.moving = mv;
    if (mv) REG.suppress++; try { drawFillWindow(lt, xf); } finally { if (mv) REG.suppress--; }
    if (lt > 7.4 && lt < 10.5) {                                                  /* the count, big, under the little window */
      const n = poppedBy(lt), a = c01((lt - 7.4) / .2) * (1 - out);
      ctx.save(); ctx.globalAlpha *= a; UI.pill(String(n), PIP.cx, 836, { size: 52, fill: '#1a2129', ink: '#ffffff', stroke: '#1e8e5a', lw: 4, hero: true, minW: 130, padX: 26 }); ctx.restore();
    }
    return;
  }
  if (lt >= 16.3 && lt < 19.4) {                                                  /* the lookup */
    const from = POPL || (POPL = laptopScreenPx(16.3)), pop = c01((lt - 16.3) / .3), out = c01((lt - 19.1) / .24), xf = Object.assign({}, pop < 1 ? xfAt(pop, from, FULL) : FULL);
    xf.cy -= ei3(out) * 1300;
    dimWorld(.55 * pop * (1 - out));
    const mv = out > 0 || pop < 1; if (mv) REG.suppress++; try { drawLookup(lt, xf, mv); } finally { if (mv) REG.suppress--; }
  }
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => lt < 1 ? 'open' : lt < 6.77 ? 'desk' : lt < CUE.crowd ? 'fill' : lt < 11.32 ? 'reveal' : lt < 19.34 ? 'crowd' : lt < 20.28 ? 'cuS' : 'tags',
  cam(lt) { const c = camOf2(lt); zoomTo(c[0], c[1], c[2]); CAM.shake = .3; },
  draw(lt) { drawWorld(lt); },
  fx: lt => ({ bloom: .4, vignette: .38, grain: .045, contrast: .12, sat: .1 }),
  blur: lt => nearCut(lt) ? 1 : blurN(camSpeed(cam3, lt)),
  over(lt) { drawOverlay(lt); },
};

window.__EP15_SCENES = window.__EP15_SCENES || {};
window.__EP15_SCENES.model2 = SC;
})();
