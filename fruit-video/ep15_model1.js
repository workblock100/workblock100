'use strict';
/* SHIFT HAPPENS, Episode 15: "The Merger". Scene module: model1 (3:45 PM, THE MODEL, 32.55 s). Builder E15-C. Assembled from build/ep15_c/parts/*.js by build/ep15_c/assemble.sh.
 *
 * THE MODEL, part one: the consultants (Onion, Tomato) run the spreadsheet model from a pop-up desk on the lawn at the foot of the tower; Binder helps (a floating assistant: at the desk, in the crane cab).
 * Every operation is performed in the sheet FIRST (a full-size GridSheet window grown out of the laptop: SH15) and then the world does it (the tower: S15): Insert Row (the Executive Suite is set on the roof by the
 * crane and the whole tower sinks one floor into the ground, the lobby goes below the sheet), Remove Duplicates (five poofs; the sheet strip pinned over the world collapses a row per poof), =4+4 (synergy).
 *
 * SHOTS (scene seconds): open 0-1.0 wide tower, crane, the suite on its hook (keyboard 0.3) | onion 1.0 | tomato 2.67 | binder 4.57 (the Insert Row window grows out of the laptop 4.92; cue insertrow 5.52) |
 * sink 6.0-9.97 (crane carries the suite to the roof 6.55-6.98, whole tower sinks one floor from 7.22 with spring overshoot, thud 9.02, dust and quake, camera cranes down) | mango 9.97 "Where did the lobby go?" |
 * tomato2 11.26 "Below the sheet." (A14 cell tag) | straw 12.35 | window 13.78-15.03 "Through the window." (Mrs. Cranberry and her walker, two Greenleaf aides) | onion2 15.03 (Remove Duplicates window, click 15.53, dialog) |
 * v1/v2 19.09-20.6 (the sheet strip pinned over the world, one row collapses per poof: 19.19, 19.59, 19.99, 20.39) | v3 20.6 + lawn2 21.29 (Carrot's poof 20.79, his lanyard stays on the chair; result dialog 21.29) |
 * =4+4 -> 5 (typed 22.04, enter 22.6, green check 22.9, confetti 23.47) | mango2 24.06 | tomato3 25.49 | lemon1 26.59 | tomato4 27.9 | lemon2 29.13 | lemon3 30.04-32.56 (badge YEARS OF SERVICE 22, slow push-in, sting 31.7 punch-in).
 * Text gate: audited every frame (0 issue-frames). Sims: none (the bounces and the sink are authored deterministic curves).
 */
(() => {
if (!window.TIMELINE_EP15 || !window.S15 || !window.H6 || !window.UI) return;
const { zoomTo, faceC } = window.H6;
const S15 = window.S15, SH15 = window.SH15, A15 = window.A15, A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, PHYS = window.PHYS2D;
const SIMS = () => (window.__EP15_SIMS || {});

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

// ------------------------------------------------------------------ cues (scene-local seconds, from `python3 /tmp/shift_tools/cues.py 15 model1`) and the fixed numbers of the lot
const CUE = { keyboard: .3, sniffle: 2.2, insertrow: 5.519, cranemotor: 5.719, rumble: 6.619, sink: 7.219, thud: 9.019, click: 15.533, poof: [19.187, 19.587, 19.987, 20.387, 20.787], dialog: 21.287, sting: 31.7 };
const GY = 1342, FEET = 1346;                       /* the ground line of the tower (S15.GEOM.GY) and where the people on the lawn stand */
const T_LAND = 6.55, T_UNHOOK = 6.98;               /* the Executive Suite meets the roof; the slings are let go */
const YB_DOCK = -716, YB_HANG = -948;               /* the suite's slab bottom when docked / hanging from the hoist */
const SINK_T = [[0, 0], [.34, .15], [.5, .17], [.62, .185], [1.0, .47], [1.16, .56], [1.28, .58], [1.5, .72], [1.68, .88], [1.8, 1]];   /* sink 0..1 against seconds after the `sink` cue: three slips with creeping holds between, the last one a drop */
const sinkCurve = lazy(() => pchip(SINK_T));

/* the Executive Suite: it hangs on the hoist until the crane motor starts, is lowered at a steady speed after a short ramp and meets the roof at T_LAND (the winch does not slow down: it is a heavy load set down fast) */
function suiteYb(lt) {
  const t0 = CUE.cranemotor, ramp = .3, D = YB_DOCK - YB_HANG, v = D / (ramp / 2 + (T_LAND - t0 - ramp));
  if (lt <= t0) return YB_HANG;
  if (lt >= T_LAND) return YB_DOCK;
  const a = lt - t0;
  return YB_HANG + (a < ramp ? v * a * a / (2 * ramp) : v * (ramp / 2 + (a - ramp)));
}
/* Fruit Bowl's squat: the weight lands (a first deep compression, then smaller bounces on a new, lower rest height), and again at the thud */
function squatAt(lt) {
  let q = 0;
  if (lt >= T_LAND) { const a = lt - T_LAND; q += 4 * (1 - Math.exp(-a * 18)) + Math.max(0, 28 * Math.exp(-4.4 * a) * Math.sin(TAU * 3.3 * a)); }
  if (lt >= CUE.thud) { const b = lt - CUE.thud; q += Math.max(0, 20 * Math.exp(-4.2 * b) * Math.sin(TAU * 3.0 * b)); }
  return q;
}
/* the whole tower sinks one floor: slips and holds, a drop at the end, the thud (the soil gives a little: overshoot and rebound) */
function sinkAt(lt) {
  if (lt < CUE.sink) return 0;
  const a = lt - CUE.sink;
  if (a < 1.8) return sinkCurve()(a);
  const b = lt - CUE.thud;
  return 1 + .042 * Math.exp(-3.4 * b) * Math.sin(TAU * 1.75 * b);
}
/* how hard the ground is shaking, 0..1: the landing, the slips, the drop and the thud */
function quakeAt(lt) {
  let q = 0;
  if (lt >= T_LAND) q = Math.max(q, .75 * Math.exp(-(lt - T_LAND) * 1.9));
  if (lt >= CUE.sink && lt < CUE.thud) { const a = lt - CUE.sink, slip = Math.max(sstep(a, 0, .12) * (1 - sstep(a, .3, .55)), sstep(a, .6, .7) * (1 - sstep(a, 1.0, 1.2)), sstep(a, 1.26, 1.36)); q = Math.max(q, .5 + .4 * slip + .1 * Math.sin(a * 40)); }
  if (lt >= CUE.thud) q = Math.max(q, Math.exp(-(lt - CUE.thud) * 2.5));
  return c01(q);
}
const HOOK_TOP = YB_HANG - 726;                                     /* the hook's height with the suite hanging: yb - 726 (the slings are 251, the eyes 109, the lugs 366 above the slab) */
function hookY(lt) {
  if (lt < T_LAND) return suiteYb(lt) - 726;
  const slack = 20 * eo3((lt - T_LAND) / .35);
  if (lt < T_UNHOOK) return YB_DOCK - 726 + slack;
  return lerp(YB_DOCK - 726 + 20, HOOK_TOP, eio((lt - T_UNHOOK - .15) / 1.0));
}
const UNIT_X = [-400, -140, 140, 400];
/* the four slings: taut while the suite descends, slack and wavy once it sits on the roof, hanging from the spreader after the hook lets go (then hauled up with it) */
function slingRopes(lt, st0) {
  const rig = S15.craneRig(lt, st0), out = [];
  for (let i = 0; i < 4; i++) {
    const eye = rig.eyes[i];
    let lug = rig.attach.exec[i];
    if (lt >= T_UNHOOK) {
      const a = lt - T_UNHOOK, sw = 14 * Math.exp(-a * 2.2) * Math.sin(a * 7 + i), end = [eye[0] + sw, eye[1] + 251 - 6 * Math.exp(-a * 3)];
      const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([lerp(eye[0], end[0], u) + Math.sin(u * PI) * sw * .5, lerp(eye[1], end[1], u)]); }
      out.push(pts); continue;
    }
    const d = Math.hypot(lug[0] - eye[0], lug[1] - eye[1]), slack = Math.max(0, 251 - d), amp = Math.min(34, Math.sqrt(slack * 60)) * (i % 2 ? -1 : 1), pts = [];
    for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([lerp(eye[0], lug[0], u) + Math.sin(u * PI * 1.6) * amp * Math.sin(u * PI), lerp(eye[1], lug[1], u)]); }
    out.push(pts);
  }
  return out;
}
/* the state handed to S15 for the whole scene */
const TOD1 = .52;
function towerState(lt, o = {}) {
  const sink = sinkAt(lt), squat = squatAt(lt), q = quakeAt(lt), landed = lt >= T_LAND;
  const st = { stack: 1, exec: 1, sink, squat, tod: TOD1, roofParts: 'rest', t: lt };
  if (!landed) st.execAt = [540, suiteYb(lt)];
  st.crane = { load: 'exec', hook: [540, hookY(lt)] };
  if (o.crane === false) st.crane = false;
  const rooms = {};
  const fl = c01(q * 1.3), du = c01(q * 1.1);
  for (const id of S15.ids) rooms[id] = id === 'exec' || S15.glIds.includes(id) ? { flicker: fl, dust: du } : { flicker: fl };
  st.rooms = rooms;
  if (o.crane !== false) { const rg = Object.assign({}, st, { crane: { load: 'exec', hook: [540, hookY(lt)] } }); st.crane.ropes = slingRopes(lt, rg); }
  return st;
}

// ------------------------------------------------------------------ the lawn: the consultants' pop-up desk at the foot of the tower (world coordinates, tower space)
/* One long folding table with a Greenleaf-green cloth: Onion and Tomato stand behind it either side of the laptop, Lemon and Carrot sit behind its right end (the cloth hides their legs; the chair backs show),
 * Mango stands behind the end. Everybody is behind the cloth, so everybody's feet are on the grass line (FEET) and the table is one clean row. */
const DXL = -170;                                         /* the desk stands this far left of the first layout so that the signs and the window are clear of it */
const TB = { x0: -742 + DXL, x1: -226 + DXL, top: FEET - 52, ink: 'rgba(38,24,40,.8)' };
const LW = { O: -676 + DXL, T: -494 + DXL, laptop: -585 + DXL, lemon: -400 + DXL, carrot: -322 + DXL, mango: -250 + DXL, tissue: -726 + DXL, cup: -540 + DXL, plant: -246 + DXL };
const SEAT = FEET - 40;                                  /* y of a seated character (noLegs: the body's bottom sits on the seat) */
const S = S15.S;                                          /* 0.44: a standing adult in the dollhouse */
const GL_GREEN = '#2f7d4a', GL_DARK = '#1b4d2f', GL_PALE = '#e6f2e6';
const quakeJit = (lt, q, seed = 0, amp = 2.4) => [hn(lt, 41, seed) * amp * q, hn(lt, 47, seed + 5) * amp * q * .7];

function drawCone(x, y, lean = 0) {                                                          /* an orange traffic cone with two white bands (no text) */
  ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
  rb(-13, -3, 26, 5, '#2a2c32', { r: 2, lw: 1.6 });
  polyp([[-10, -3], [10, -3], [4, -42], [-4, -42]], '#ff7a1a', OUT, 2);
  polyp([[-7.6, -17], [7.6, -17], [5.8, -26], [-5.8, -26]], '#f7f4ec', null);
  rb(-3.5, -46, 7, 5, '#ff7a1a', { r: 2, lw: 1.6 });
  ctx.restore();
}
function drawChairBack(x, lanyard, lt) {                                                     /* the back of a folding chair behind its sitter (metal frame, a canvas back); a lanyard may hang over it */
  ctx.save(); ctx.translate(x, SEAT);
  rb(-23, -104, 46, 72, '#3c5b7a', { r: 7, lw: 2.2 }); rb(-18, -99, 36, 62, '#4f7597', { r: 5, lw: 0 }); ln(-23, -98, -23, 8, '#9aa3ad', 4); ln(23, -98, 23, 8, '#9aa3ad', 4);
  ctx.restore();
}
function drawLanyard(x, lt, o = {}) {                                                       /* Carrot's lanyard on the back of her chair: a green strap, a badge (CARROT, GREENLEAF) */
  const sw = Math.sin(lt * 3.1 + 1) * .04 * (o.sway ?? 1) + (o.tilt || 0);
  ctx.save(); ctx.translate(x, SEAT - 104); ctx.rotate(sw);
  ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-17, 4); ctx.quadraticCurveTo(-16, 36, -2, 48); ctx.moveTo(17, 4); ctx.quadraticCurveTo(16, 36, 2, 48); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-17, 4); ctx.quadraticCurveTo(-16, 36, -2, 48); ctx.moveTo(17, 4); ctx.quadraticCurveTo(16, 36, 2, 48); ctx.stroke();
  ln(-18, 3, 18, 3, '#d9a41a', 4);
  ctx.translate(0, 46); rb(-24, 0, 48, 64, '#f7f4ec', { r: 5, lw: 2.2 }); rb(-24, 0, 48, 14, GL_GREEN, { r: 5, lw: 0 });
  disc(0, 29, 9, 11, '#f08a24', OUT, 1.6); polyp([[-3, 17], [0, 12], [3, 17]], '#2fa04a', OUT, 1.2);
  const th = false;
  UI.label('CARROT', 0, 48, { size: 11, fill: '#1d1a22', hero: th, crop: !th, maxW: 42, weight: 900 });
  ctx.restore();
}
function drawTableBack(lt, q) {                                                              /* the table top and its legs (behind the characters' hands) */
  const [jx, jy] = quakeJit(lt, q, 1, 2.6);
  ctx.save(); ctx.translate(jx, jy);
  for (const x of [TB.x0 + 18, TB.x1 - 18]) { ln(x, TB.top + 6, x - 8, FEET - 2, '#7d858f', 5); ln(x, TB.top + 6, x + 8, FEET - 2, '#7d858f', 5); }
  rb(TB.x0, TB.top - 6, TB.x1 - TB.x0, 9, '#efe8d6', { r: 3, lw: 2 });
  ctx.restore();
}
function drawTableFront(lt, q, o = {}) {                                                     /* the cloth over the front, the laptop and the little things on the table */
  const [jx, jy] = quakeJit(lt, q, 1, 2.6);
  ctx.save(); ctx.translate(jx, jy);
  const x0 = TB.x0, x1 = TB.x1, y0 = TB.top + 2, y1 = FEET - 14;
  ctx.fillStyle = vgrad(y0, y1, '#f7f4ea', '#d8d2bd'); ctx.beginPath(); ctx.moveTo(x0 - 4, y0); ctx.lineTo(x1 + 4, y0); ctx.lineTo(x1 + 4, y1 - 6);
  for (let x = x1 + 4, i = 0; x > x0 - 4; x -= 22, i++) ctx.quadraticCurveTo(x - 11, y1 + 8, x - 22, y1 - 6);                      /* a scalloped hem */
  ctx.closePath(); ctx.fill(); ctx.strokeStyle = TB.ink; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(120,110,80,.16)'; ctx.lineWidth = 2; for (const x of [x0 + 60, x0 + 150, x0 + 290, x0 + 380]) { ctx.beginPath(); ctx.moveTo(x, y0 + 4); ctx.lineTo(x - 3, y1 - 2); ctx.stroke(); }
  ctx.fillStyle = GL_GREEN; ctx.fillRect(x0 - 4, y0, x1 - x0 + 8, 7);
  ctx.save(); ctx.translate(LW.laptop, y0 + 21); ctx.rotate(-.5);                              /* a leaf emblem on the cloth under the laptop (no lettering) */ ctx.fillStyle = '#3fae5c'; ctx.beginPath(); ctx.moveTo(0, -17); ctx.bezierCurveTo(15, -10, 15, 11, 0, 17); ctx.bezierCurveTo(-15, 11, -15, -10, 0, -17); ctx.fill(); ctx.strokeStyle = GL_DARK; ctx.lineWidth = 1.6; ctx.stroke(); ln(0, -13, 0, 17, GL_DARK, 1.6); ctx.restore();
  /* the things on the table: each hops a little when the ground shakes */
  const hop = (i, a = 9) => -Math.max(0, Math.sin(lt * 33 + i * 2.7)) * a * q * (.5 + hash(i + 3));
  const tt = TB.top - 6;
  ctx.save(); ctx.translate(LW.tissue, tt + hop(1, 5));                                          /* a box of tissues for Onion */
  rb(-15, -17, 30, 17, '#9bd1ee', { r: 3, lw: 1.8 }); rb(-12, -14, 24, 5, '#cde9f7', { r: 2, lw: 0 }); polyp([[-3, -17], [2, -30 - 3 * Math.sin(lt * 2)], [7, -17]], '#ffffff', OUT, 1.4); ctx.restore();
  ctx.save(); ctx.translate(LW.cup, tt + hop(2, 7));                                            /* Tomato's coffee */
  rb(-7, -16, 14, 16, '#f7f4ec', { r: 3, lw: 1.8 }); rb(-7, -12, 14, 6, '#cf3d2e', { r: 0, lw: 0 }); ln(7, -12, 12, -9, OUT, 2.4); ln(12, -9, 7, -5, OUT, 2.4); ctx.restore();
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(LW.mango + 96 + i * 3, tt - i * 4 + hop(4 + i, 4)); rb(-15, -4, 30, 4, ['#e9d27a', '#cfe3f0', '#f0c9d6'][i], { r: 1, lw: 1.4 }); ctx.restore(); }   /* folders */
  /* the laptop: its screen faces the camera (the mini sheet; the scene zooms into it for the inserts) */
  const lap = o.laptop !== false ? A15 && A15.laptop(LW.laptop, tt + hop(0, 3), { lapScale: .38 }) : null;
  ctx.restore();
  return lap;
}
function drawChairAndLanyard(lt, carrotGone, q) {
  const [jx, jy] = quakeJit(lt, q, 2, 2);
  ctx.save(); ctx.translate(jx, jy);
  drawChairBack(LW.lemon); drawChairBack(LW.carrot);
  if (carrotGone != null) drawLanyard(LW.carrot, lt, { tilt: carrotGone.tilt || 0, sway: carrotGone.sway ?? 1, hero: carrotGone.hero });
  ctx.restore();
}

// ------------------------------------------------------------------ the cast: every function returns the drawChar options of one character as a pure function of scene-local time
const CT = {                                                                        /* constructors with fallbacks, so the module loads and renders even if a kit is late */
  onion: o => A15 ? A15.onion(o) : A7.lemon(Object.assign({ who: 'onion' }, o)),
  tomato: o => A15 ? A15.tomato(o) : A7.straw(Object.assign({ who: 'tom' }, o)),
  binder: o => A15 ? A15.binder(o) : A7.lemon(Object.assign({ who: 'bind', center: true }, o)),
  carrot: o => A15 ? A15.carrot(o) : A7.mango(Object.assign({ who: 'carrot' }, o)),
  greenleaf: (o, opt) => A15 && A15.greenleaf ? A15.greenleaf(o, opt) : o,
  straw: o => (A11 || A7).straw(o), lemon: o => A7.lemon(o), mango: o => A7.mango(o), cran: o => A7.cran(o),
};
const hat = (o, col = '#f4be1c', extra = {}) => Object.assign(o, { acc: (o.acc || []).concat('fp15_hardhat'), hatColor: col }, extra);
const pulseW = (lt, t0, d) => lt < t0 || lt > t0 + d ? 0 : Math.sin(PI * (lt - t0) / d);   /* a half-sine bump of length d starting at t0 */
const win = (lt, a, b) => c01((lt - a) / (b - a));
const talking = (lt, id) => { const l = lineOf(id); return l && lt >= l.s - CUR.start && lt < l.e - CUR.start; };

function onionO(lt, ov = {}) {
  const q = quakeAt(lt), sp = talkOf('onion'), sob = Math.max(pulseW(lt, CUE.sniffle, .55), q > .25 ? q : 0);
  const words = lt > 1.0 && lt < 2.6 ? c01((lt - 1.75) / .25) * (1 - c01((lt - 2.1) / .3)) : 0;
  return Object.assign(CT.onion({ x: LW.O, y: FEET, s: S, t: lt, yaw: .5, look: [.8, .15], cry: c01(.5 + .3 * sp + .5 * q), expr: q > .35 ? 'onion_wail' : 'onion_cry', sob: c01(sob), shake: 3 * q,
    arms: { l: 'rest', r: 'hold' }, grip: { r: [64, 82] }, hold: { r: 'fp15_tabletclip' }, tabAt: [-.3, .12], tabRot: .05 }), ov);
}
function tomatoO(lt, ov = {}) {
  const q = quakeAt(lt), typing = lt > .25 && lt < 4.5 ? 1 : 0;
  const ty = typing ? [1.05 + .12 * Math.sin(lt * 31), .75 + .1 * Math.sin(lt * 27 + 1)] : 'rest';
  return Object.assign(CT.tomato({ x: LW.T, y: FEET, s: S, t: lt, yaw: -.5, look: [-.8, .25], shake: 3 * q, arms: { l: ty, r: 'rest' } }), ov);
}
function binderO(lt, ov = {}) {
  const bob = Math.sin(lt * 3.1) * 4 + 2 * Math.sin(lt * 5.3 + 1), q = quakeAt(lt);
  return Object.assign(CT.binder({ x: LW.laptop, y: TB.top - 96 + bob, s: S * .8, t: lt, center: true, noLegs: true, hover: 120, look: [Math.sin(lt * .9) * .5, .35], pose: 'helpful', shake: 2 * q }), ov);
}
function lemonO(lt, ov = {}) {
  const q = quakeAt(lt);
  return Object.assign(CT.lemon({ x: LW.lemon, y: SEAT, s: S, t: lt, noLegs: true, yaw: -.4, look: [-.5, .1], expr: 'dead', lid: .3, shake: 2.5 * q, arms: { l: 'rest', r: 'rest' } }), ov);
}
function carrotO(lt, ov = {}) {
  const q = quakeAt(lt);
  return Object.assign(CT.carrot({ x: LW.carrot, y: SEAT, s: S, t: lt, noLegs: true, yaw: -.3, look: [-.5, .1], expr: 'carrot_polite', shake: 2.5 * q, arms: { l: 'rest', r: 'rest' } }), ov);
}
function mangoO(lt, ov = {}) {
  const q = quakeAt(lt);
  return Object.assign(hat(CT.mango({ x: LW.mango, y: FEET, s: S, t: lt, yaw: -.3, look: [-.4, .1], expr: 'dead', lid: .45, shake: 2.5 * q, arms: { l: 'rest', r: 'rest' } })), ov);
}
function strawO(lt, ov = {}) {
  return Object.assign(CT.straw({ x: -190, y: FEET, s: S, t: lt, yaw: -.3, look: [-.5, .1], expr: 'neutral' }), ov);
}

// ------------------------------------------------------------------ the entrance: Mrs. Cranberry and her walker, two Greenleaf aides, the ramp and the window (K's window bay at the middle floor's left wall)
const WIN = { x0: -30, x1: 10, ramp: [[-92, GY + 4], [-48, GY - 26]], floor: GY - 26 };           /* S15's ENTRANCE bay (underground(): x -30..10, the plank from (-92, GY) to (-48, floor)) */
const lerpA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
/* a walker seen from the side, facing right: two frames, a top rail, tennis balls on the front feet (x = its middle on the ground, y = the ground) */
function drawWalker(x, y, lift = 0, tilt = 0) {
  ctx.save(); ctx.translate(x, y - lift); ctx.rotate(tilt);
  const col = '#c9ced6', dk = 'rgba(38,24,40,.85)';
  for (const [dx, h] of [[-15, 38], [15, 38]]) { ln(dx, 0, dx + 2, -h, dk, 4.6); ln(dx, 0, dx + 2, -h, col, 2.4); }
  ln(-15, -38, 17, -38, dk, 5); ln(-15, -38, 17, -38, '#8a939c', 2.8); rb(-18, -42, 14, 7, '#2a2c32', { r: 3, lw: 1.2 }); rb(10, -42, 14, 7, '#2a2c32', { r: 3, lw: 1.2 });           /* rail and grips */
  ln(-15, -20, 17, -20, dk, 3.6); ln(-15, -20, 17, -20, col, 1.8);
  disc(17, -3, 4.6, 4.6, '#d7f04a', dk, 1.4); disc(-15, -1.5, 2.8, 2.8, '#2a2c32');
  ctx.restore();
}
/* the A14 tag: a cell reference in the sheet's name-box style floating over the lobby (it has gone below the sheet's visible rows) */
function drawA14(lt, t0, x, y) {
  const a = lt - t0; if (a < 0) return;
  const u = c01(a / .3), k = .86 + .14 * eback(u), bob = Math.sin(a * 3.2) * 4;                          /* scale .86 -> 1 with a fade: the text never drops under the hero size */
  ctx.save(); ctx.globalAlpha *= c01(u * 1.8); ctx.translate(x, y + bob); ctx.scale(k, k);
  ctx.strokeStyle = 'rgba(30,142,90,.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 62); ctx.stroke(); ctx.setLineDash([]);                   /* a dashed leader down to the lobby */
  polyp([[-7, 62], [7, 62], [0, 74]], '#1e8e5a', null);
  UI.sign([-36, -20, 72, 40], [{ t: 'A14', size: 26, weight: 900 }], { fill: '#ffffff', stroke: '#1e8e5a', lw: 3.4, ink: '#1e8e5a', r: 7, shadow: 10, pad: 4, id: 'a14', kind: 'tag' });
  rb(28, 14, 9, 9, '#1e8e5a', { r: 1.5, lw: 1.5, stroke: '#fff' });                                       /* the fill handle of a selected cell */
  ctx.restore();
}
/* Binder at the controls of the crane: the cab window shows it (a small clip with big eyes) */
function drawCabBinder(lt, st) {
  const rig = S15.craneRig(lt, st), r = rig.cab, bx = r[0] + r[2] / 2, by = r[1] + r[3] * .58;
  REG.suppress++; ctx.save(); ctx.beginPath(); ctx.rect(r[0], r[1], r[2], r[3]); ctx.clip();
  drawChar(CT.binder({ x: bx, y: by + Math.sin(lt * 4) * 1.4, s: .3, t: lt, center: true, noLegs: true, hover: 0, noShadow: true, look: [-.5 + .4 * Math.sin(lt * 2), .3], pose: 'wave', who: undefined }));
  ctx.restore(); REG.suppress--;
}
/* Mrs. Cranberry's way in: she walks up to the ramp, is hoisted up it and is handed through the window by the two aides (profile, facing right) */
const CRAN_X = pchip([[13.7, -96], [14.15, -90], [14.45, -66], [14.75, -38], [15.02, -6], [15.3, 34], [15.6, 70]]);
const cranY = x => x < WIN.ramp[0][0] ? FEET : x < WIN.ramp[1][0] ? lerp(FEET, WIN.floor, (x - WIN.ramp[0][0]) / (WIN.ramp[1][0] - WIN.ramp[0][0])) : WIN.floor - (x > WIN.x1 + 2 ? 0 : 0);
function gagActors(lt) {
  const cx = CRAN_X(lt), cy = cranY(cx), step = c01((cx + 112) / 70) * (1 - c01((cx + 20) / 60));
  const moving = lt > 13.72 && lt < 15.5, dist = cx + 150;
  const cran = CT.cran({ x: cx, y: cy, s: S, t: lt, yaw: PI / 2, dir: 1, who: undefined, expr: 'hopeful', look: [.9, .1], gaitW: dist / S * .8, axis: 'x', vx: moving ? 80 : 0, arms: { l: 'hold', r: 'hold' }, grip: { l: [92, 88], r: [92, 88] } });
  const a1 = CT.greenleaf({ kind: 'apple', id: 'apple', s: S, x: 162 - 10 * c01((cx + 30) / 80), y: WIN.floor, t: lt, yaw: -PI / 2, dir: -1, expr: 'happy', look: [-.9, .1], acc: [], arms: { l: 'reach', r: 'reach' } });
  const a2x = 88 - 8 * c01((cx + 30) / 80), a2 = CT.greenleaf({ kind: 'kiwi', id: 'kiwi', s: S, x: a2x, y: WIN.floor, t: lt, yaw: -PI / 2, dir: -1, expr: 'hopeful', look: [-.9, .1], acc: [], arms: { l: 'reach', r: 'reach' } });
  return { cran, a1, a2, wk: { x: cx + 40, y: cy, lift: 4 * Math.max(0, Math.sin(lt * 14)) * (cx > -140 && cx < 40 ? 1 : 0) } };
}

// ------------------------------------------------------------------ the model (GridSheet, window-local frame: origin = the window's top-left; the window is 1080 x 1124 and sits at screen y 256)
const WIN_W = 1080, WIN_H = 1124, WIN_Y = 256;
const HEAD_FILL = '#e8f3ee', TOT_FILL = '#fff4cf', C = SH15 ? SH15.colors : {};
const FLOORS = [['Sky Garden', 'Greenleaf', 6, 120000], ['Salad Bar', 'Greenleaf', 6, 260000], ['Wellness Room', 'Greenleaf', 5, 180000], ["Nurses' Station", 'Greenleaf', 5, 240000], ['Greenleaf Lobby', 'Greenleaf', 4, 210000],
  ['Therapy Garden', 'Greenleaf', 4, 150000], ['Administrator', 'Fruit Bowl', 3, 640000], ['Break Room', 'Fruit Bowl', 3, 0], ['Med Room', 'Fruit Bowl', 2, 410000], ['Room 4', 'Fruit Bowl', 2, 280000], ['Lobby', 'Fruit Bowl', 1, 190000]];
const SUITE_ROW = ['Executive Suite', 'Greenleaf', 7, 4900000];
const FLOORS_SUM = FLOORS.reduce((a, r) => a + r[3], 0);                                  /* 2,680,000 */
const usd = n => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const SO_BASE = { w: WIN_W, h: WIN_H, rowH: 48, freeze: 2, doc: 'SYNERGY_MODEL_v47_FINAL_REAL', tabs: ['Sheet1', 'Floors', 'Staff', 'Policies'], r: 16, shadow: 30, saved: false };
function floorsSheet(o = {}) {                                                              /* the floors table BEFORE the insertion (rows 1-13: header, TOTAL, eleven rooms; the lobby is row 13) */
  const cells = { A1: { v: 'ROOM', bold: true, fill: HEAD_FILL }, B1: { v: 'WING', bold: true, fill: HEAD_FILL }, C1: { v: 'FLOOR', bold: true, fill: HEAD_FILL, align: 'center' }, D1: { v: 'COST / YR', bold: true, fill: HEAD_FILL, align: 'right' },
    A2: { v: 'TOTAL', bold: true, fill: TOT_FILL }, B2: { v: '', fill: TOT_FILL }, C2: { v: '', fill: TOT_FILL }, D2: Object.assign({ v: usd(FLOORS_SUM), bold: true, fill: TOT_FILL, align: 'right' }, o.total || {}) };
  FLOORS.forEach((r, i) => { cells['A' + (i + 3)] = r[0]; cells['B' + (i + 3)] = r[1]; cells['C' + (i + 3)] = { v: r[2], align: 'center' }; cells['D' + (i + 3)] = { v: r[3], fmt: 'usd0' }; });
  return Object.assign({}, SO_BASE, { cols: { A: 240, B: 160, C: 100, D: 200 }, tab: 'Floors', cells }, o.sheet || {});
}
/* the staff table: NAME, ROLE, SHIFT, YEARS (rows 2-13 are the visible ones); the duplicates of the first 13 rows are rows 6, 7, 8, 9, 11 (the same ROLE and SHIFT as an earlier row) */
const STAFF = [['Lemon', 'Charge Nurse', '3-11', 22], ['Mango', 'CNA', '3-11', 7], ['Clementine', 'RN', '3-11', 1], ['Kiwi', 'Aide', '3-11', 4], ['Carrot', 'Charge Nurse', '3-11', 3], ['Fig', 'Aide', '3-11', 2],
  ['Blueberry', 'RN', '3-11', 6], ['Apple', 'CNA', '3-11', 9], ['Strawberry', 'RN', 'Per diem', 5], ['Pineapple', 'Aide', '3-11', 3], ['Melon', 'Administrator', '9-5', 14]];
const DUPS = { 6: 'Carrot', 7: 'Fig', 8: 'Blueberry', 9: 'Apple', 11: 'Pineapple' };                  /* row number -> who goes (the five that vanish in the world); seven more duplicates sit below the fold */
const DUP_ORDER = [7, 11, 8, 9, 6];                                                          /* the order of the poofs: Fig, Pineapple, Blueberry, Apple, Carrot (the last one is the charge nurse) */
function staffSheet(o = {}) {
  const cells = { A1: { v: 'NAME', bold: true, fill: HEAD_FILL }, B1: { v: 'ROLE', bold: true, fill: HEAD_FILL }, C1: { v: 'SHIFT', bold: true, fill: HEAD_FILL, align: 'center' }, D1: { v: 'YEARS', bold: true, fill: HEAD_FILL, align: 'right' }, F1: { v: 'SYNERGY', bold: true, fill: '#e4edff', align: 'center' } };
  STAFF.forEach((r, i) => { cells['A' + (i + 2)] = r[0]; cells['B' + (i + 2)] = r[1]; cells['C' + (i + 2)] = { v: r[2], align: 'center' }; cells['D' + (i + 2)] = { v: r[3], align: 'right' }; });
  for (let i = STAFF.length + 2; i <= 40; i++) { const f = FIRST_N[i % FIRST_N.length], r = ROLE_N[(i * 3) % ROLE_N.length]; cells['A' + i] = f + (i > 23 ? ' ' + String.fromCharCode(64 + (i % 7)) : ''); cells['B' + i] = r; cells['C' + i] = { v: '3-11', align: 'center' }; cells['D' + i] = { v: 1 + (i * 7) % 19, align: 'right' }; }
  return Object.assign({}, SO_BASE, { cols: { A: 200, B: 190, C: 110, D: 90, E: 40, F: 210 }, tab: 'Staff', freeze: 1, cells }, o.sheet || {});
}
const FIRST_N = ['Plum', 'Quince', 'Lime', 'Guava', 'Papaya', 'Date', 'Cherry', 'Peach', 'Grape', 'Olive', 'Lychee', 'Mulberry'], ROLE_N = ['Aide', 'RN', 'CNA', 'LPN', 'Dietary', 'Charge Nurse', 'PT'];

// ------------------------------------------------------------------ the inserts: the sheet window grown out of the laptop (and the strip pinned over the world)
const cellObj = c => (c != null && typeof c === 'object') ? c : { v: c };
/* how many letters of a spoken line are typed at scene time lt (word by word, a word types over its own duration) */
function typedCount(lt, id, lead = 0) {
  const l = lineOf(id); if (!l) return 0;
  const a = lt - (l.s - CUR.start) + lead; let n = 0;
  for (let i = 0; i < l.words.length; i++) { const w = l.words[i], len = w[0].length + (i < l.words.length - 1 ? 1 : 0), s0 = w[1], e0 = Math.min(w[2], s0 + .35); n += len * c01((a - s0) / Math.max(.05, e0 - s0)); }
  return Math.round(n);
}
const lineText = id => { const l = lineOf(id); return l ? l.text : ''; };
/* the laptop's screen in screen pixels under the camera of scene time lt (the window grows out of it) */
function lapRectScreen(lt) {
  const c = camOf(lt), r = A15 && A15.laptopScreen ? A15.laptopScreen({ lapScale: .38 }) : [-25, -35, 25, -10];
  const ox = LW.laptop, oy = TB.top - 6, P = (x, y) => [W / 2 + (x - c[0]) * c[2], H / 2 + (y - c[1]) * c[2]];
  const a = P(ox + r[0], oy + r[1]), b = P(ox + r[2], oy + r[3]);
  return { cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, w: b[0] - a[0], h: b[1] - a[1] };
}
/* the window's transform at pop progress k (0 on the laptop screen, 1 full size) from a screen rectangle; `out` slides it up and away instead */
function winXf(k, from, out = 0) {
  const e = eback(k), s0 = Math.max(.12, Math.min(.5, from.w / WIN_W)), s = lerp(s0, 1, e), cx = lerp(from.cx, W / 2, eo3(k)), cy = lerp(from.cy, WIN_Y + WIN_H / 2, eo3(k)) - out * 1300;
  return { cx, cy, s };
}
function withWin(xf, fn) {
  ctx.save(); ctx.translate(xf.cx, xf.cy); ctx.scale(xf.s, xf.s); ctx.translate(-WIN_W / 2, -WIN_H / 2);
  try { fn(); } finally { ctx.restore(); }
}
function dimWorld(a) { if (a <= .01) return; ctx.save(); ctx.fillStyle = `rgba(8,13,19,${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

/* Binder's bubble on the sheet (window-local) with the mascot at its tail */
function binderUI(lt, id, o = {}) {
  const text = lineText(id), l = lineOf(id); if (!SH15 || !l) return;
  const n = typedCount(lt, id, o.lead || 0), pop = o.pop ?? c01((lt - (l.s - CUR.start) + .02) / .22);
  const bo = { at: o.at || [96, 640], w: o.w || 540, tail: o.tail || [700, 880], text, typed: SH15.typed(n, text.length), pop, size: o.size || 34, hero: o.hero !== false, dressing: o.hero === false, buttons: [] };
  SH15.binder(bo, lt);
  const m = o.mascot || [800, 930];
  if (pop > .05) drawChar(CT.binder({ x: m[0], y: m[1], s: o.ms || .74, t: lt, center: true, noLegs: true, hover: 0, noShadow: true, pose: o.pose || 'wave', look: [-.5, .3], grin: o.grin || 0, glint: o.glint || 0, who: 'bind', alpha: c01(pop * 1.4), transit: !!o.transit }));
}

// ---- I1: Insert Row (4.92 to 6.0): the Insert tab, the click on Insert, the Executive Suite grows in at the top, the rows slide down, the total recalculates, the lobby row slides out of the window
const I1_CLICK = [5.36, 5.5];
const MOVING = { v: false };                                                    /* the window is popping, shrinking or sliding: its text is dressing and may cross the frame edge */
function drawI1(lt) {
  const u = c01((lt - CUE.insertrow) / .48), flipU = c01((u - .55) / .4), newTot = usd(FLOORS_SUM + SUITE_ROW[3]);
  const total = flipU > 0 ? { v: newTot, flip: { from: usd(FLOORS_SUM), u: flipU }, pulse: c01((u - .55) / .6), pulseColor: C.amber } : {};
  const so = floorsSheet({ total, sheet: { ribbon: { tab: 'Insert', hot: lt < CUE.insertrow + .1 ? 'insert' : null, press: lt > I1_CLICK[0] && lt < I1_CLICK[1] + .1 ? Math.sin(PI * c01((lt - I1_CLICK[0]) / (I1_CLICK[1] - I1_CLICK[0] + .1))) : 0 }, active: 'A3', sel: 'A3' } });
  const b = SH15.buttonRect('insert', so);
  if (lt < CUE.insertrow) SH15.sheet(so, lt);
  else SH15.insertRow({ sheet: so, at: 3, fill: '#cfe0ff', row: { A: { v: SUITE_ROW[0], hero: true, size: 32 }, B: SUITE_ROW[1], C: { v: SUITE_ROW[2], align: 'center' }, D: { v: SUITE_ROW[3], fmt: 'usd0' } } }, u, lt);
  const cp = SH15.cursorPath([{ t: 4.9, x: 920, y: 520, kind: 'arrow' }, { t: 5.3, x: b.aim[0], y: b.aim[1], click: I1_CLICK }, { t: 6.1, x: 700, y: 560 }], lt);
  SH15.pointer(cp.x, cp.y, { kind: cp.kind, press: cp.press, s: 1.25 });
  binderUI(lt, 'b1', { at: [786, 600], w: 284, tail: [930, 880], mascot: [940, 940], pop: c01((lt - 5.0) / .22), size: 32, transit: !!MOVING.v, hero: !MOVING.v });
}

// ---- Remove Duplicates: the rows that repeat an earlier ROLE and SHIFT go amber, are struck through and collapse (one per poof)
const DUP_ROWS = Object.keys(DUPS).map(Number);
const COLLAPSE = {}; DUP_ORDER.forEach((r, i) => { COLLAPSE[r] = CUE.poof[i] - .06; });                /* each row starts to collapse .06 s before its poof sounds */
const T_AMBER = 18.03, T_STRIKE = 18.5;
function dedupeSheet(so, lt, tt) {
  const cells = Object.assign({}, so.cells), fills = (so.fills || []).slice(), rows = {};
  const am = eo3((lt - T_AMBER) / .3), st = eo3((lt - T_STRIKE) / .32);
  for (const r of DUP_ROWS) {
    if (am > 0) fills.push({ range: `A${r}:D${r}`, color: C.amber, a: .55 * am });
    if (st > 0) for (const col of 'ABCD') { const key = col + r; cells[key] = Object.assign({}, cellObj(cells[key]), { strike: st, strikeColor: C.red }); }
    if (lt > COLLAPSE[r]) rows[r] = 48 * (1 - eio((lt - COLLAPSE[r]) / .34));
  }
  return SH15.sheet(Object.assign({}, so, { cells, fills, rows: Object.assign({}, so.rows, rows), renumber: true }), tt);
}
const pressK = (lt, c) => lt >= c[0] && lt <= c[1] ? Math.sin(PI * (lt - c[0]) / (c[1] - c[0])) : 0;
// ---- I2: the Remove Duplicates dialog (15.2 to 19.09): the Data tab, the click on Remove Duplicates, ROLE and SHIFT ticked, OK, then the amber and the strikes while Binder announces it
const I2 = { click: [15.48, 15.62], dlg: 15.6, role: [16.0, 16.12], shift: [16.38, 16.5], ok: [17.8, 17.94], out: 17.94 };
const DLG_O = { kind: 'removeDuplicates', w: WIN_W, h: WIN_H };
function drawI2(lt) {
  const dlgU = lt < I2.out ? c01((lt - I2.dlg) / .26) : 1 - c01((lt - I2.out) / .16);
  const roleOn = lt > I2.role[0] + .06, shiftOn = lt > I2.shift[0] + .06;
  const so = staffSheet({ sheet: { ribbon: { tab: 'Data', hot: lt < I2.dlg ? 'dupes' : null, press: pressK(lt, I2.click) }, sel: 'A1:D40', active: 'A2', dressing: dlgU > .02 } });
  if (lt < T_AMBER) SH15.sheet(so, lt); else dedupeSheet(so, lt, lt);
  const dOpts = Object.assign({ columns: [['NAME', false], ['ROLE', roleOn], ['SHIFT', shiftOn], ['YEARS', false]], t: lt, press: lt >= I2.ok[0] && lt <= I2.ok[1] ? { id: 'ok', k: pressK(lt, I2.ok) } : 0 }, DLG_O);
  const dup = SH15.buttonRect('dupes', Object.assign({}, so, { ribbon: { tab: 'Data' } })), ok = SH15.dialogRect(DLG_O, 'ok');
  if (dlgU > .001) SH15.dialog(dOpts, dlgU);
  const cp = SH15.cursorPath([{ t: 15.2, x: 930, y: 380, kind: 'arrow' }, { t: 15.46, x: dup.aim[0], y: dup.aim[1], click: I2.click }, { t: 15.9, x: 556, y: 424 + 4, click: I2.role }, { t: 16.3, x: 196, y: 486, click: I2.shift },
    { t: 17.7, x: ok.aim[0], y: ok.aim[1], click: I2.ok }, { t: 18.5, x: 900, y: 860 }], lt);
  SH15.pointer(cp.x, cp.y, { kind: cp.kind, press: cp.press, s: 1.25 });
  binderUI(lt, 'b2', { at: [690, 680], w: 380, tail: [920, 900], mascot: [940, 960], size: 32, transit: !!MOVING.v, hero: !MOVING.v });
}
// ---- the strip: the same sheet squeezed into the top of the frame (zoomed out, clipped) while the world plays below it (19.09 to 21.05, growing back into the window until 21.29)
const STRIP = { z: .64, h: 470, grid: 340 };
function stripXf(k) { const e = eio(k); return { zoom: lerp(1, STRIP.z, e), ty: lerp(WIN_Y, WIN_Y - STRIP.grid, e), h: lerp(WIN_H, STRIP.h, e) }; }
function drawStrip(lt, k) {
  const xf = stripXf(k);
  const so = staffSheet({ sheet: { ribbon: { tab: 'Data' }, sel: 'A1:D40', active: 'A2', zoom: xf.zoom, dressing: true, r: 0, shadow: 0 } });
  ctx.save(); ctx.beginPath(); ctx.rect(0, WIN_Y, WIN_W, xf.h); ctx.clip(); ctx.translate(0, xf.ty);
  dedupeSheet(so, lt, lt);
  ctx.restore();
  const y = WIN_Y + xf.h;
  ctx.save(); ctx.shadowColor = 'rgba(8,13,19,.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.fillStyle = '#1a2129'; ctx.fillRect(0, y - 2, WIN_W, 10); ctx.restore();
  ctx.fillStyle = C.green; ctx.fillRect(0, y + 8, WIN_W, 4);
}
// ---- I3 + I4: the result dialog (21.29 to 22.0), then Binder's =4+4 in the SYNERGY column (22.04 to 24.06)
const I3 = { pop: 21.29, ok: [21.88, 22.0], out: 22.0 };
const SYN = { type: [22.04, 22.55], enter: 22.6, flip: [22.7, 22.9], check: 22.9, boom: 23.47 };
const RES_O = Object.assign({ stage: 'result', removed: 12, remain: 28 }, DLG_O);
function drawI34(lt) {
  const dlgU = lt < I3.out ? c01((lt - I3.pop) / .2) : 1 - c01((lt - I3.out) / .16), typing = lt >= SYN.type[0] && lt < SYN.enter, typed = c01((lt - SYN.type[0]) / (SYN.type[1] - SYN.type[0]));
  const f2 = lt >= SYN.enter ? { v: '5', align: 'center', bold: true, size: 34, hero: true, fill: '#eaf8ef', flip: { from: '8', u: c01((lt - SYN.flip[0]) / (SYN.flip[1] - SYN.flip[0])) }, pulse: c01((lt - SYN.flip[0]) / 1.2), pulseColor: '#1e8e5a' } : null;
  const base = staffSheet({ sheet: { sel: 'F2', active: 'F2', ribbon: { tab: 'Home' }, dressing: dlgU > .02, formula: typing ? { text: '=4+4', typed: SH15.typed(Math.round(typed * 4), 4), caret: true } : (f2 ? { text: '=4+4' } : undefined) } });
  const so = Object.assign({}, base, { edit: typing ? { ref: 'F2', text: '=4+4', typed: SH15.typed(Math.round(typed * 4), 4), size: 28 } : null });
  if (f2) so.cells = Object.assign({}, so.cells, { F2: f2 });
  dedupeSheet(so, lt, lt);
  const R = SH15.cellRect('F2', so);
  if (dlgU > .001) SH15.dialog(Object.assign({ t: lt, press: lt >= I3.ok[0] && lt <= I3.ok[1] ? { id: 'ok', k: pressK(lt, I3.ok) } : 0 }, RES_O), dlgU);
  if (lt >= SYN.check) {                                                             /* the green check and its little tooltip */
    const k = eback((lt - SYN.check) / .3), cx = R.x1 - 8, cy = R.y + 4;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.shadowColor = 'rgba(20,24,30,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; disc(0, 0, 19, 19, '#1e8e5a', '#ffffff', 3); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-2.5, 7); ctx.lineTo(9, -7); ctx.stroke(); ctx.restore();
    const tk = c01((lt - SYN.check - .12) / .3);
    if (tk > 0) { ctx.save(); ctx.globalAlpha *= tk; UI.pill('Optimized!', R.cx - 40, R.y + R.h + 38 + 6 * (1 - tk), { size: 24, fill: '#1e8e5a', ink: '#fff', hero: false, crop: true, padX: 18 }); ctx.restore(); }
  }
  const ok = SH15.dialogRect(RES_O, 'ok');
  const cp = SH15.cursorPath([{ t: 21.29, x: 800, y: 760, kind: 'arrow' }, { t: 21.84, x: ok.aim[0], y: ok.aim[1], click: I3.ok }, { t: 22.5, x: R.cx - 120, y: R.y + R.h + 90 }], lt);
  SH15.pointer(cp.x, cp.y, { kind: cp.kind, press: cp.press, s: 1.25 });
  binderUI(lt, 'b3', { at: [690, 700], w: 380, tail: [920, 900], mascot: [940, 960], size: 32, transit: !!MOVING.v, hero: !MOVING.v, grin: c01((lt - 22.9) / .2), glint: c01((lt - 23.1) / .3) });
  return R;
}

// ------------------------------------------------------------------ the vanishing staff (rooms of the sunk tower, final state: sink 1) and the finale on the lawn
const ST_FINAL = () => towerState(12, { crane: false });                       /* the tower after the sink: only used for the room floors */
const roomFloor = lazy(() => { const st = ST_FINAL(), o = {}; for (const id of ['conf', 'rest', 'r4', 'r7', 'office', 'r14', 'med', 'shower']) { const r = S15.rect(id, st); o[id] = { x0: r.x0, x1: r.x1, floor: r.floor, cx: r.cx }; } return o; });
/* who vanishes where: [row of the sheet, kind, room, u across the room, poof index, accessory looks] */
const VAN = [
  { row: 7, name: 'Fig', kind: 'fig', room: 'conf', x: 352, i: 0, gl: true, prop: 'fp15_saladbowl' },
  { row: 11, name: 'Pineapple', kind: 'pine', room: 'rest', x: 700, i: 1, gl: false },
  { row: 8, name: 'Blueberry', kind: 'blue', room: 'r4', x: 430, i: 2, gl: false },
  { row: 9, name: 'Apple', kind: 'apple', room: 'r7', x: 756, i: 3, gl: true },
];
const poofT = i => CUE.poof[i];
function vanishOpts(v, lt) {
  const rf = roomFloor()[v.room], idle = Math.sin(lt * 1.7 + v.i) * .08;
  const base = { kind: v.kind, id: v.kind, s: S, x: v.x, y: rf.floor, t: lt, yaw: v.i % 2 ? -.35 : .35, look: [Math.sin(lt * .8 + v.i) * .6, .1], expr: v.i === 2 ? 'neutral' : 'happy', acc: v.kind === 'blue' ? ['steth'] : v.kind === 'pine' ? ['steth'] : [], arms: { l: 'rest', r: 'rest' } };
  if (v.prop) Object.assign(base, { arms: { l: 'rest', r: 'hold' }, grip: { r: [60, 70] }, hold: { r: v.prop } });
  return v.gl ? CT.greenleaf(base) : base;
}
const vanishers = lt => VAN.filter(v => lt < poofT(v.i) + .07).map(v => vanishOpts(v, lt));
function drawPoofs(lt) {                                                       /* the smoke of the five poofs in tower coordinates (the rooms) and lawn coordinates (Carrot) */
  for (const v of VAN) { const rf = roomFloor()[v.room], a = lt - poofT(v.i); if (a > 0) { poof(v.x, rf.floor - 62, a, 78, { seed: v.i * 7 + 1 }); wisp(v.x, rf.floor - 62, a, 70, v.i); } }
  const a = lt - CUE.poof[4]; if (a > 0) { poof(LW.carrot, SEAT - 60, a, 84, { seed: 41 }); wisp(LW.carrot, SEAT - 60, a, 76, 4); }
}
const CARROT_GONE = lt => lt >= CUE.poof[4] + .07;
const LEM_Y = SEAT;
/* the finale cast on the lawn (Lemon seated, the empty chair with CARROT's lanyard, Tomato at the table, Mango at the end) */
function finaleCast(lt, o = {}) {
  const list = [onionO(lt), tomatoO(lt), lemonO(lt), mangoO(lt)];
  if (!CARROT_GONE(lt)) list.push(carrotO(lt));
  if (binderHere(lt)) list.push(binderO(lt));
  return list;
}
const ROOM_FIGS = lt => {                                                       /* life in the rooms the strip shots show: Melon at his desk, Mrs. Cranberry in her armchair */
  const rf = roomFloor(), out = [];
  if (A9 && A9.melon) out.push(A9.melon({ x: rf.office.x0 + 150, y: rf.office.floor - 42, s: S * 1.22, t: lt, noLegs: true, expr: 'neutral', look: [.3, .1], yaw: 0 }));
  out.push(CT.cran({ x: rf.r7.x0 + 80, y: rf.r7.floor - 50, s: S, t: lt, noLegs: true, expr: 'neutral', look: [.5, .2], yaw: .2, who: undefined }));
  return out;
};

// ---- what the vanished leave behind: a cap, a stethoscope, a clipboard, a lanyard (authored, deterministic bounces; they fall from where the poof was)
function bounceH(a, h0, e = .36, g = 1500) {                                          /* height above the floor at age a after a drop from rest at h0 */
  if (a <= 0) return h0; const t1 = Math.sqrt(2 * h0 / g); if (a < t1) return h0 - .5 * g * a * a;
  let v = g * t1 * e, tt = a - t1;
  for (let i = 0; i < 4; i++) { const T2 = 2 * v / g; if (tt < T2) return v * tt - .5 * g * tt * tt; tt -= T2; v *= e; }
  return 0;
}
function drawItem(kind, x, y, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'cap') { ctx.fillStyle = '#2f9a56'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.bezierCurveTo(-15, -20, 15, -20, 15, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); rb(-17, -2, 34, 6, '#238043', { r: 3, lw: 1.6 }); disc(0, -17, 3, 3, '#e6f2e6', OUT, 1.2); }
  else if (kind === 'steth') { ctx.strokeStyle = '#2a2c32'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.quadraticCurveTo(-18, 6, 0, 8); ctx.quadraticCurveTo(18, 6, 14, -14); ctx.moveTo(0, 8); ctx.lineTo(0, 18); ctx.stroke(); disc(0, 22, 6.5, 6.5, '#c9ced6', OUT, 2); disc(0, 22, 2.6, 2.6, '#8a939c'); }
  else if (kind === 'clip') { rb(-13, -18, 26, 36, '#a77a44', { r: 3, lw: 2 }); rb(-10, -14, 20, 30, '#ffffff', { r: 1.5, lw: 1.2 }); rb(-6, -21, 12, 6, '#8a939c', { r: 2, lw: 1.6 }); for (const yy of [-6, 0, 6]) ln(-7, yy, 7, yy, '#9aa3ad', 1.4); }
  else { ctx.strokeStyle = '#1e8e5a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(-6, 18, 4, 6); ctx.quadraticCurveTo(14, -6, 20, 8); ctx.stroke(); rb(10, 4, 18, 24, '#f7f4ec', { r: 3, lw: 1.8 }); rb(10, 4, 18, 6, '#1e8e5a', { r: 3, lw: 0 }); }
  ctx.restore();
}
const ITEMS = [['cap', 0, 22, 4.6], ['steth', 1, -18, -5.2], ['clip', 2, 26, 3.4], ['badge', 3, -22, -4.4]];
function drawItems(lt) {
  for (const [kind, i, vx, w] of ITEMS) {
    const v = VAN[i], a = lt - poofT(i) - .05; if (a < 0) continue;
    const rf = roomFloor()[v.room], h0 = 62, h = bounceH(a, h0), x = v.x + vx * Math.min(a, .9) * (1 - .5 * c01(a / 1.2)), rest = h < 1 && a > .5, rot = rest ? w * .13 : w * Math.min(a, .55) * .9;
    drawItem(kind, x, rf.floor - 6 - h, rot);
  }
}
/* Lemon's lanyard badge: YEARS OF SERVICE 22 (world units; drawn after the character, before the table front) */
function drawLemonBadge(lt) {
  const u = c01((lt - 30.1) / .3); if (u <= 0) return;
  const k = .9 + .1 * eback(u), sw = Math.sin(lt * 2.3) * .015 * (1 - .6 * c01((lt - 30.6) / 1.2));   /* the text never drops under the hero size during the pop: scale .9 -> 1 and a fade */
  const x = LW.lemon + 6, y = 1272;
  ctx.save(); ctx.globalAlpha *= c01(u * 1.6); ctx.translate(x, y - 24); ctx.rotate(sw); ctx.scale(k, k); ctx.translate(0, 24);
  UI.sign([-58, -24, 116, 50], [{ t: 'YEARS OF SERVICE', size: 9.2, weight: 900 }, { t: '22', size: 26, weight: 900 }], { fill: '#fffdf4', stroke: '#1e8e5a', lw: 2.2, ink: '#22262b', r: 5, pad: 2, id: 'lembadge', kind: 'tag', shadow: 6 });
  ctx.restore();
}
function lemonActing(lt) {                                                       /* what Lemon's eyes do in the last beats: the badge, the empty chair, the camera */
  if (lt < 29.1) return { look: [-.5, .1], expr: 'dead', lid: .3, hy: -.4 };
  if (lt < 30.3) return { look: [-.55, .2], expr: 'dead', lid: .3, hy: -.4 };
  if (lt < 31.0) return { look: [.1, .95], expr: 'sad', lid: .45, hy: -.1 };
  if (lt < 31.45) return { look: [.95, .15], expr: 'sad', lid: .4, hy: .35 };
  return { look: [0, 0], expr: 'dead', lid: .5, hy: 0 };
}

// ------------------------------------------------------------------ the world, shot by shot
const faceCam = (o, z, up = 190, dx = 0) => { const [fx, fy] = faceC(o); return [fx + dx, fy + up / z, z]; };
const SHOTS = [];
const shot = (id, t0, t1, cam, cast, extra = {}) => SHOTS.push(Object.assign({ id, t0, t1, cam, cast: cast || (() => []) }, extra));
const shotAt = lt => { for (const s of SHOTS) if (lt >= s.t0 && lt < s.t1) return s; return SHOTS[SHOTS.length - 1]; };
const binderHere = lt => lt < 5.42 || lt >= 14.4;
const GROUP = lt => [onionO(lt), tomatoO(lt), lemonO(lt), mangoO(lt)].concat(CARROT_GONE(lt) ? [] : [carrotO(lt)], binderHere(lt) ? [binderO(lt)] : []);
const PAIR = lt => [onionO(lt), tomatoO(lt)].concat(binderHere(lt) ? [binderO(lt)] : []);
const pairCam = (z0, z1, x0, x1, t0, t1, up = 190) => lt => { const k = eio((lt - t0) / (t1 - t0)), z = lerp(z0, z1, k); return [lerp(x0, x1, k), 1268 + up / z, z]; };
const FACE_Y = 1268, LEM_FACE_Y = 1226;                                          /* approximate face heights of the standing and the seated characters (faceC gives the exact ones) */

// ---- part one: the desk, the crane, the sink, the lobby, the window
shot('open', 0, 1.0, lt => { const k = lt; return [lerp(300, 214, eio(k)), lerp(480, 520, k), lerp(.42, .5, eio(k))]; }, GROUP, { dof: 0 });
const PX = (LW.O + LW.T) / 2 + 14;                                                /* the middle of the two consultants */
shot('onion', 1.0, 2.67, pairCam(2.7, 3.0, PX, PX - 14, 1.0, 2.67, 70), PAIR, { dof: 3 });
shot('tomato', 2.67, 4.57, pairCam(2.9, 3.3, PX + 30, PX + 70, 2.67, 4.57, 70), PAIR, { dof: 3 });
shot('binder', 4.57, 6.0, lt => { const o = binderO(lt); return [...faceCam(o, 5.2, 190, 0), 0]; }, lt => [tomatoO(lt), binderO(lt)], { dof: 5 });
/* the crane sets the suite on the roof, the tower sinks, and the camera cranes down with it to the new street level (one long move) */
const SINK_CAM = vtrack([[6.0, [540, -900, .72]], [6.6, [540, -860, .76]], [7.22, [440, -300, .60]], [8.0, [380, 100, .56]], [8.55, [-40, 640, .62]], [9.02, [-330, 1170, .8]], [9.97, [-400, 1230, .78]]]);
shot('sink', 6.0, 9.97, lt => { const c = SINK_CAM(lt), p = lt >= CUE.thud ? 1 + .03 * Math.exp(-(lt - CUE.thud) * 13) : 1; return [c[0], c[1], c[2] * p, 0]; }, lt => GROUP(lt).filter(o => o.kind !== 'bind'), { dof: 0 });
shot('mango', 9.97, 11.26, lt => [-92, 1262, 1.8, 0], lt => [mangoO(lt, { x: -292, yaw: .6, look: [.55, .85], arms: { l: 'hips', r: 'rest' } })], { dof: 0, free: true });
shot('tomato2', 11.26, 12.35, lt => [-196, 1262, 1.7, 0], lt => [tomatoO(lt, { x: -418, yaw: .5, look: [.6, .8], arms: { l: 'rest', r: [.85, .1] } }), mangoO(lt, { x: -292, yaw: -.4, look: [.4, .8], arms: { l: 'hips', r: 'rest' } })], { dof: 0, a14: 11.3, free: true });
shot('straw', 12.35, 13.78, lt => [-230, 1262, 2.5, 0], lt => [strawO(lt, { x: -292, yaw: .35, look: [.7, .1], expr: 'hopeful' })], { dof: 0, free: true });
shot('window', 13.78, 15.03, lt => [60, 1283, 2.6, 0], lt => [], { dof: 0, gag: true });
// ---- part two: remove duplicates (the sheet is up from 15.2; from 19.09 it is a strip pinned over the world), =4+4, the one with seniority
shot('onion2', 15.03, 19.09, pairCam(3.0, 3.4, PX, PX + 30, 15.03, 19.09, 70), PAIR, { dof: 3 });
shot('v1', 19.09, 19.88, lt => [540, 826, 1.0, 0], lt => vanishers(lt).filter(o => ['fig', 'pine'].includes(o.kind)).concat(ROOM_FIGS(lt).filter(o => o.kind === 'melon')), { dof: 0, rooms: true });
shot('v2', 19.88, 20.6, lt => [540, 1156, 1.0, 0], lt => vanishers(lt).filter(o => ['blue', 'apple'].includes(o.kind)).concat(ROOM_FIGS(lt).filter(o => o.kind === 'cran')), { dof: 0, rooms: true });
const LCX = (LW.lemon + LW.carrot) / 2;                                           /* the middle of the two chairs */
shot('v3', 20.6, 21.29, lt => [LCX - 34, 1250, 1.9, 0], finaleCast, { dof: 0 });
shot('lawn2', 21.29, 24.06, lt => [LW.laptop + 140, 1190, 1.7, 0], finaleCast, { dof: 3 });
shot('mango2', 24.06, 25.49, lt => [...faceCam(mangoO(lt), 3.6, 200, 0), 0], lt => [mangoO(lt, { yaw: 0, look: [0, 0], expr: 'dead', lid: .5 })], { dof: 3 });
shot('tomato3', 25.49, 26.59, lt => [...faceCam(tomatoO(lt), 3.6, 200, 0), 0], lt => [tomatoO(lt, { yaw: .25, look: [.2, .1], arms: { l: 'shrug', r: 'shrug' } })], { dof: 3 });
shot('lemon1', 26.59, 27.90, pairCam(3.1, 3.7, LCX - 6, LCX, 26.59, 27.90, 160), finaleCast, { dof: 3 });
shot('tomato4', 27.90, 29.13, lt => [...faceCam(tomatoO(lt), 3.6, 200, 0), 0], lt => [tomatoO(lt, { yaw: .3, look: [.4, .1], arms: { l: 'rest', r: lt > 28.5 ? 'up' : 'rest' } })], { dof: 3 });
shot('lemon2', 29.13, 30.04, lt => { const k = eio((lt - 29.13) / .91), z = lerp(3.4, 3.8, k); return [LW.lemon + 20, LEM_FACE_Y + 190 / z, z, 0]; }, lt => [lemonO(lt, lemonActing(lt))], { dof: 4 });
shot('lemon3', 30.04, 32.56, lt => { const k = eio((lt - 30.04) / 2.5), z = lerp(3.8, 4.7, k); return [LW.lemon + 20, LEM_FACE_Y + 190 / z, z, 0]; }, lt => [lemonO(lt, lemonActing(lt))], { dof: 4 });

const camOf = lt => { const c = shotAt(lt).cam(lt); return [c[0], c[1], c[2], c[3] || 0]; };
const camVelOf = lt => camSpeed(camOf, lt);
/* a shot boundary: blur is off within .05 s of a cut (a cut inside the shutter shows two exposures) */
const nearCut = lt => SHOTS.some(s => Math.abs(lt - s.t0) < .05 && s.t0 > 0);

function drawDust(lt) {
  if (lt < T_LAND || lt > 12.5) return;
  const s0 = CUE.sink, sq = squatAt(lt);
  for (const x of [34, 1046]) dustPuff(x, YB_DOCK + 6 + sq, lt - T_LAND, 130, { n: 6, seed: x + 3, alpha: .7 });                           /* dust shaken off the roof by the landing */
  for (const [t0, big] of [[s0, 1], [s0 + .62, .62], [s0 + 1.28, .85]]) for (const x of [44, 1040]) dustJet(x, GY - 4, lt - t0, { vx: x < 500 ? 30 : 110, vy: -300 * big, n: 14, r: 24 * big + 10, fan: x < 500 ? 70 : 150, seed: Math.floor(x + t0 * 11), life: 1.2 });
  dustPuff(60, GY - 2, lt - CUE.thud, 110, { n: 6, seed: 60 }); dustPuff(1070, GY - 2, lt - CUE.thud, 170, { n: 8, seed: 1070 });
  if (lt > s0 && lt < CUE.thud + 1.2) { const k = sstep(lt, s0, s0 + .4) * (1 - sstep(lt, CUE.thud + .6, CUE.thud + 1.2)); ctx.save(); ctx.globalAlpha *= .55 * k; for (let i = 0; i < 9; i++) { const hx = -1000 + i * 260 + 26 * Math.sin(lt * 2 + i); if (hx > -330 && hx < 20) continue; smokeBall(hx, GY - 12 - 10 * Math.sin(lt * 3 + i * 2), 56 + 24 * (i % 3), .45, { tint: [212, 194, 164], shade: [150, 128, 100], rim: false }); } ctx.restore(); }
}
const seen = (o, sh) => o.kind === 'bind' || sh.cull === false || o.transit || wholeInFrame(o, 4) || faceInFrame(o);
const cullDraw = (o, sh) => { if (seen(o, sh)) drawChar(o); };
function drawLawn(lt, sh, st) {
  const q = quakeAt(lt), cast = sh.cast(lt);
  if (sh.gag) {
    const g = gagActors(lt);
    drawChar(g.a2); drawChar(g.cran); drawWalker(g.wk.x, g.wk.y, g.wk.lift); drawChar(g.a1);
    return;
  }
  if (sh.rooms || sh.free) { for (const o of cast) cullDraw(o, sh); return; }
  for (const x of [-770 + DXL, -822 + DXL]) drawCone(x, FEET + 2, 0);
  drawTableBack(lt, q);
  const shown = cast.filter(o => seen(o, sh)), gone = CARROT_GONE(lt);
  const [jx, jy] = quakeJit(lt, q, 2, 2);
  ctx.save(); ctx.translate(jx, jy);
  for (const o of shown) if (o.kind === 'lemon' && o.noLegs) drawChairBack(o.x);
  if (gone || shown.some(o => o.kind === 'carrot')) drawChairBack(LW.carrot);
  if (gone) drawLanyard(LW.carrot, lt, { tilt: .02, sway: 1 + 2 * Math.exp(-(lt - CUE.poof[4]) * 2), hero: true });
  ctx.restore();
  const ord = shown.slice().sort((a, b) => (a.noLegs ? 1 : 0) - (b.noLegs ? 1 : 0));
  for (const o of ord) drawChar(o);
  if (lt >= 30.1 && shown.some(o => o.kind === 'lemon')) drawLemonBadge(lt);
  drawTableFront(lt, q);
}
const FULLWIN1 = lt => (lt >= 5.05 && lt < 6.1) || (lt >= 15.4 && lt < 19.09) || (lt >= 21.3 && lt < 24.2);
function drawWorld(lt) {
  const sh = shotAt(lt), st = towerState(lt);
  S15.light(st);
  const px = sh.dof || 0;
  if (px > .5) V2.dof(px, () => S15.tower(lt, st)); else S15.tower(lt, st);
  if (lt >= 6 && lt < T_UNHOOK + 1.5) drawCabBinder(lt, st);
  if (!FULLWIN1(lt)) drawLawn(lt, sh, st);
  if (sh.rooms && lt >= CUE.poof[0]) drawItems(lt);                                  /* the cap, the stethoscope, the clipboard and the badge they leave behind */
  if (px > .5) V2.dof(px, () => S15.front(lt, st)); else S15.front(lt, st);
  if (sh.a14 != null) drawA14(lt, sh.a14, 38, GY - 62);
  drawDust(lt);
  if (lt >= CUE.poof[0] - .05 && lt < 22.5) drawPoofs(lt);
}

// ------------------------------------------------------------------ the sheet overlay: which window is up at lt
let POP0 = null, POP2 = null;
function drawSheetOverlay(lt) {
  if (!SH15) return;
  if (lt >= 4.92 && lt < 6.3) {                                                      /* I1: Insert Row */
    const k = c01((lt - 4.92) / .3), out = c01((lt - 6.0) / .26), from = POP0 || (POP0 = lapRectScreen(4.92));
    dimWorld(.55 * k * (1 - out));
    const mv = k < 1 || out > 0; MOVING.v = mv; if (mv) REG.suppress++;
    try { withWin(winXf(k, from, ei3(out)), () => drawI1(lt)); } finally { if (mv) REG.suppress--; MOVING.v = false; }
    return;
  }
  if (lt >= 15.2 && lt < 24.3) {                                                     /* I2, the strip, I3 and I4: one session of the window */
    const from = POP2 || (POP2 = lapRectScreen(15.2)), pop = c01((lt - 15.2) / .3), out = c01((lt - 23.98) / .26);
    let sk = 0;
    if (lt >= 19.09 && lt < 21.05) sk = c01((lt - 19.09) / .23); else if (lt >= 21.05 && lt < 21.29) sk = 1 - c01((lt - 21.05) / .24);          /* the strip grows back into the window so that the result dialog pops on the cue (21.29) */
    dimWorld(.55 * pop * (1 - sk) * (1 - out));
    const mv = pop < 1 || out > 0 || sk > .001; MOVING.v = mv; if (mv) REG.suppress++;
    try {
      if (sk > .001) drawStrip(lt, sk);
      else withWin(winXf(pop, from, ei3(out)), () => { if (lt < 21.29) drawI2(lt); else drawI34(lt); });
    } finally { if (mv) REG.suppress--; MOVING.v = false; }
    if (sk > .001) return;
    if (lt >= SYN.boom - .02 && lt < 24.3) { const a = lt - SYN.boom; confetti(a, 540, WIN_Y + 520, { n: 110, speed: 1500, seed: 9 }); }
  }
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotAt(lt).id,
  cam(lt) {
    const c = camOf(lt), pk = lt >= CUE.sting ? Math.exp(-(lt - CUE.sting) * 8) : 0;                    /* the sting (31.7): a small punch-in that settles */
    zoomTo(c[0], c[1], c[2] * (1 + .05 * pk)); CAM.r = c[3];
    CAM.shake = .4 + 11 * quakeAt(lt) + 2.5 * pk;
  },
  draw(lt) { drawWorld(lt); },
  fx: lt => ({ bloom: .5, vignette: .4, grain: .045, contrast: .13, sat: .12 }),
  blur: lt => nearCut(lt) ? 1 : blurN(camVelOf(lt)),
  over(lt) { drawSheetOverlay(lt); },
};

window.__EP15_SCENES = window.__EP15_SCENES || {};
window.__EP15_SCENES.model1 = SC;
})();
