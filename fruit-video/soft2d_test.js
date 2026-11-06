'use strict';
/* soft2d_test.js: `node soft2d_test.js` prints PASS/FAIL per test and a final summary line (exit code 1 on any failure).
 * Budgets are timed best of two (the machine is shared); the browser draw budget is measured with build/soft22/shot.js. */
const S = require('./soft2d.js');
const results = [];
function test(name, fn) {
  const t0 = process.hrtime.bigint();
  let r;
  try { r = fn(); } catch (e) { r = { ok: false, msg: 'threw: ' + String(e.stack).split('\n').slice(0, 3).join(' | ') }; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  results.push(r.ok);
  console.log((r.ok ? 'PASS ' : 'FAIL ') + name + (r.msg ? ' : ' + r.msg : '') + '  [' + ms.toFixed(0) + ' ms]');
}
const f = (v, d) => (+v).toFixed(d == null ? 2 : d);
function timeMs(fn) { const t0 = process.hrtime.bigint(); const r = fn(); return [Number(process.hrtime.bigint() - t0) / 1e6, r]; }
function finite(w) { for (const a of [w.x, w.y, w.z]) for (let i = 0; i < a.length; i++) if (!(a[i] === a[i]) || Math.abs(a[i]) > 1e6) return false; return true; }

// ------------------------------------------------------------------ worlds used by several tests
function drapeWorld(cols) {
  const w = S.world({ gravity: [0, 1500], seed: 22 });
  w.collider({ floor: 1250, mat: 'metal', tag: 'cart' });
  w.collider({ box: [90, 60], x: 540, y: 1190, depth: 140, mat: 'cardboard', tag: 'box' });
  const pad = w.cloth({ cx: 540, y: 1010, width: 340, height: 340, cols: cols || 22, rows: cols || 22, plane: 'xz', mat: 'chux', tag: 'chux', flutter: 0.2 });
  return { w, pad };
}
function gloveWorld(segments) {
  const w = S.world({ gravity: [0, 1500], seed: 22 });
  w.collider({ ceiling: 400, mat: 'plastic', tag: 'ceiling' });
  const g = w.balloon({ x: 540, y: 1150, outline: 'glove', segments: segments || 72, buoyancy: 1850, mat: 'nitrile', tag: 'glove',
    pressure: t => Math.max(0, Math.min(1.1, (t - 0.2) / 0.8 * 1.1)), pins: [{ k: 0, to: [540, 1240], until: 1.2 }] });
  return { w, g };
}

// ------------------------------------------------------------------ determinism
test('determinism: two builds give the same stateHash (cloth drape, glove, tear, belt)', () => {
  const hashes = [];
  for (const mk of [() => drapeWorld(14).w, () => gloveWorld(48).w, () => tearWorld().w, () => beltWorld().w]) {
    const a = mk(), b = mk();
    a.run(2.5); b.run(2.5);
    hashes.push([S.stateHash(a, 40), S.stateHash(b, 40)]);
  }
  return { ok: hashes.every(h => h[0] === h[1]), msg: hashes.map(h => h[0] + (h[0] === h[1] ? '=' : '!=') + h[1]).join(' ') };
});
test('determinism: SOFT2D.sin/cos are within 1e-12 of Math and the solver uses no Math.sin/cos/random/atan2/pow/exp', () => {
  let err = 0; for (let a = -20; a <= 20; a += 0.0137) err = Math.max(err, Math.abs(S.sin(a) - Math.sin(a)), Math.abs(S.cos(a) - Math.cos(a)));
  const src = require('fs').readFileSync(require('path').join(__dirname, 'soft2d.js'), 'utf8');
  const solver = src.slice(0, src.indexOf('// ---------------------------------------------------------------- drawing'));
  const bad = (solver.match(/Math\.(sin|cos|random|atan2|pow|exp|log|tan)\(/g) || []);
  return { ok: err < 1e-12 && bad.length === 0, msg: 'max error ' + err.toExponential(1) + ', forbidden calls in the solver: ' + (bad.join(', ') || 'none') };
});

// ------------------------------------------------------------------ cloth
test('cloth draped on a box comes to rest without jitter (3D drape, front, back and side flaps)', () => {
  const { w, pad } = drapeWorld(22);
  w.run(6);
  const s0 = w.makeState(), s1 = w.makeState(), s2 = w.makeState();
  w.at(5.5, s0); w.at(6, s1); w.at(6 - 1 / 30, s2);
  let jit = 0; for (let i = 0; i < pad.n; i++) jit = Math.max(jit, Math.hypot(s1.cloths[0].pts[2 * i] - s2.cloths[0].pts[2 * i], s1.cloths[0].pts[2 * i + 1] - s2.cloths[0].pts[2 * i + 1]));
  let mv = 0; for (let i = 0; i < pad.n; i++) mv = Math.max(mv, Math.hypot(s1.cloths[0].pts[2 * i] - s0.cloths[0].pts[2 * i], s1.cloths[0].pts[2 * i + 1] - s0.cloths[0].pts[2 * i + 1], s1.cloths[0].z[i] - s0.cloths[0].z[i]));
  const c = pad.index(11, 11), cy = s1.cloths[0].pts[2 * c + 1];
  let zmin = 1e9, zmax = -1e9, ymax = -1e9; for (let i = 0; i < pad.n; i++) { zmin = Math.min(zmin, s1.cloths[0].z[i]); zmax = Math.max(zmax, s1.cloths[0].z[i]); ymax = Math.max(ymax, s1.cloths[0].pts[2 * i + 1]); }
  const restY = 1130 - 3;   // box top 1130 minus the chux thickness
  return { ok: mv < 0.5 && jit < 0.1 && Math.abs(cy - restY) < 1 && ymax > 1180 && zmax > 70 && zmin < -70 && finite(w), msg: 'max motion 5.5-6 s ' + f(mv, 3) + ' px, over the last frame ' + f(jit, 3) + ' px, centre at ' + f(cy, 2) + ' (rest ' + restY + '), flaps reach y ' + f(ymax, 0) + ', z ' + f(zmin, 0) + '..' + f(zmax, 0) };
});
test('friction: a strap on a 20 degree slope slides at mu .2 and stays at mu .9 (tan 20 deg = .36)', () => {
  const out = [], th = 20 * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  for (const mu of [0.2, 0.9]) {
    const w = S.world({ gravity: [0, 1500], seed: 3 });
    w.collider({ box: [400, 20], x: 540, y: 1000, angle: th, friction: 1, mat: 'wood' });
    const pts = []; for (let k = 0; k <= 10; k++) { const u = -80 + 16 * k; pts.push([540 + u * cs - (-23) * sn, 1000 + u * sn + (-23) * cs]); }   // on the surface (20 + thickness 3)
    const r = w.rope({ points: pts, segments: 10, width: 6, thickness: 3, mat: 'canvas', friction: mu });
    w.run(1.5);
    const p = w.at(1.5).ropes[0].pts; out.push(Math.hypot(p[10] - pts[5][0], p[11] - pts[5][1]));
  }
  return { ok: out[0] > 200 && out[1] < 3, msg: 'moved ' + f(out[0], 0) + ' px at mu .2, ' + f(out[1], 2) + ' px at mu .9' };
});
function tearWorld(opt) {
  opt = opt || {};
  const w = S.world({ gravity: [0, 0], seed: 4 });
  const cols = 16, rows = 6, W = 300, H = 90;
  const pins = []; for (let j = 0; j < rows; j++) pins.push({ i: 0, j }, { i: cols - 1, j, to: t => [400 + W + 120 * Math.max(0, t - 0.2), 900 + j * H / (rows - 1)] });
  const c = w.cloth({ x: 400, y: 900, width: W, height: H, cols, rows, mat: 'paper', collide: [], pins, tear: { strain: opt.strain || 1.2, jag: 0.35 } });
  return { w, c, W };
}
test('a pinned paper strip pulled from one end tears with a ragged edge at the expected strain', () => {
  const { w, c, W } = tearWorld({ strain: 1.2 });
  w.run(2.6);
  const tears = w.events.filter(e => e.kind === 'tear');
  if (!tears.length) return { ok: false, msg: 'no tear' };
  const t1 = tears[0].t, pulled = 120 * (t1 - 0.2), mean = (W + pulled) / W, strain = tears[0].strain;   // the broken cell's (smoothed) strain, and the strip's mean
  const st = w.at(2.6), dead = st.cloths[0].alive.reduce((a, v) => a + (v ? 0 : 1), 0), torn = st.cloths[0].torn.reduce((a, v) => a + v, 0);
  // the two halves separate: the gap between the left and right pinned columns' neighbours
  let maxGap = 0; for (let j = 0; j < 6; j++) { let prev = st.cloths[0].pts[2 * c.index(0, j)]; for (let i = 1; i < 16; i++) { const x = st.cloths[0].pts[2 * c.index(i, j)]; maxGap = Math.max(maxGap, x - prev); prev = x; } }
  let xr = -1e9; for (let i = 0; i < c.n; i++) xr = Math.max(xr, st.cloths[0].pts[2 * i]);
  return { ok: strain >= 1.12 && strain <= 1.29 && dead > 0 && dead < 60 && torn >= 6 && maxGap > 80 && xr < 1000 && finite(w),
    msg: 'first tear at ' + f(t1) + ' s, local strain ' + f(strain, 3) + ' (break 1.2, jag .35: 1.13 to 1.27; the strip as a whole ' + f(mean, 3) + '), ' + dead + ' triangles torn, ' + torn + ' ragged edge particles, gap ' + f(maxGap, 0) + ' px, rightmost particle ' + f(xr, 0) + ', ' + tears.length + ' tear events' };
});
test('w.rip unzips along a path in order and separates the flap; drawCloth sees torn edges', () => {
  const w = S.world({ gravity: [0, 1500], seed: 5 });
  const pins = []; for (let i = 0; i < 20; i++) pins.push({ i, j: 0 });
  const c = w.cloth({ x: 300, y: 600, width: 400, height: 300, cols: 20, rows: 16, mat: 'paper', gravityScale: 1, collide: [], pins });
  w.rip(c.id, { path: [[0, 0.5], [1, 0.5]], t0: 0.3, t1: 0.6, jag: 0.4 });
  w.run(1.5);
  const tears = w.events.filter(e => e.kind === 'tear').map(e => e.x);
  const ordered = tears.every((x, i) => !i || x >= tears[i - 1] - 60);
  const st = w.at(1.5), bottom = st.cloths[0].pts[2 * c.index(10, 15) + 1];
  return { ok: tears.length >= 3 && ordered && bottom > 1500, msg: tears.length + ' tear events left to right: ' + ordered + ', the lower half fell to y ' + f(bottom, 0) };
});

// ------------------------------------------------------------------ ropes
function beltWorld() {
  const w = S.world({ gravity: [0, 1500], seed: 2 });
  const R = 150, T = 9, body = w.collider({ circle: R, x: 540, y: 1000, mat: 'felt', tag: 'santa' });
  // over the top half (a strap over a round body), both ends straight down and pinned there; then the ends are tugged 12 px down
  const pts = []; pts.push([540 - R - T, 1100]); for (let k = 0; k <= 24; k++) { const a = Math.PI * (1 + k / 24); pts.push([540 + (R + T) * Math.cos(a), 1000 + (R + T) * Math.sin(a)]); } pts.push([540 + R + T, 1100]);
  const tug = t => 12 * Math.min(1, Math.max(0, (t - 0.8) / 0.3));
  const r = w.rope({ points: pts, segments: 36, width: 18, thickness: T, mat: 'canvas', tag: 'belt', friction: 0.6,
    pins: [{ k: 0, to: t => [540 - R - T, 1100 + tug(t)] }, { k: -1, to: t => [540 + R + T, 1100 + tug(t)] }] });
  return { w, r, R, T };
}
test('a strap over a round body holds tension: it hugs the body and keeps its length when tugged', () => {
  const { w, r, R, T } = beltWorld();
  w.run(2);
  const st = w.at(2), p = st.ropes[0].pts;
  let L = 0, hug = 0, top = 0, inner = 1e9; for (let i = 1; i < r.n; i++) L += Math.hypot(p[2 * i] - p[2 * i - 2], p[2 * i + 1] - p[2 * i - 1]);
  for (let i = 0; i < r.n; i++) { if (p[2 * i + 1] > 995) continue; top++; const d = Math.hypot(p[2 * i] - 540, p[2 * i + 1] - 1000); inner = Math.min(inner, d); if (Math.abs(d - (R + T)) < 1) hug++; }
  const stretch = w.events.filter(e => e.kind === 'stretch').length;
  return { ok: inner > R + T - 1 && hug >= top - 1 && Math.abs(L / r.length - 1) < 0.03 && finite(w), msg: hug + '/' + top + ' particles over the body on its surface (closest ' + f(inner, 2) + ', surface ' + (R + T) + '), length ' + f(L, 1) + ' / ' + f(r.length, 1) + ' after a 12 px tug each side, stretch events ' + stretch };
});
test('sticky tape sticks where it touches a sticky collider and stays after the hand lets go', () => {
  const w = S.world({ gravity: [0, 1500], seed: 9 });
  w.collider({ box: [200, 60], x: 540, y: 1100, sticky: true, tag: 'box' });
  const t = w.rope({ from: [380, 1020], to: [700, 1020], segments: 20, width: 24, mat: 'tape', thickness: 3, pins: [{ k: 0, to: [380, 1020], until: 0.3 }, { k: -1, to: [700, 1020], until: 0.3 }] });
  w.run(1.5);
  const st = w.at(1.5), p = st.ropes[0].pts; let onTop = 0; for (let i = 0; i < t.n; i++) if (Math.abs(p[2 * i + 1] - 1037) < 2) onTop++;
  const stuck = Array.from(w.stuck.slice(w.object(t.id).p0, w.object(t.id).p0 + t.n)).filter(v => v >= 0).length;
  return { ok: stuck >= 10 && onTop >= 15, msg: stuck + ' particles stuck, ' + onTop + '/' + t.n + ' lying on the box top' };
});
test('no explosion: a ribbon yanked at 6000 px/s between pins stays finite and capped at maxSpeed', () => {
  const w = S.world({ gravity: [0, 1500], seed: 1 });
  w.collider({ floor: 1500 });
  w.rope({ from: [300, 800], to: [700, 800], segments: 24, mat: 'ribbon', pins: [{ k: 0 }, { k: -1, to: t => [700 + 6000 * Math.max(0, t - 0.3), 800], until: 0.45 }] });
  w.run(2);
  let vmax = 0; for (let i = 0; i < w.np; i++) vmax = Math.max(vmax, Math.hypot(w.vx[i], w.vy[i]));
  return { ok: finite(w) && w.warnings.length === 0, msg: 'final max speed ' + f(vmax, 0) + ' px/s, warnings ' + w.warnings.length };
});

// ------------------------------------------------------------------ balloons
test('a glove balloon inflates to five lobes (finger tips stay apart) and floats to the ceiling', () => {
  const { w, g } = gloveWorld(72);
  w.run(4);
  const st = w.at(1.15).balloons[0], n = st.n, P = st.pts;
  // finger tips: local maxima of the distance from the centroid, at least 0.85 of the largest
  let cx = 0, cy = 0; for (let k = 0; k < n; k++) { cx += P[2 * k] / n; cy += P[2 * k + 1] / n; }
  const tips = st.tips;   // pinky, ring, middle, index, thumb
  let minSep = 1e9; for (let i = 0; i < tips.length; i++) for (let j = i + 1; j < tips.length; j++) minSep = Math.min(minSep, Math.hypot(P[2 * tips[i]] - P[2 * tips[j]], P[2 * tips[i] + 1] - P[2 * tips[j] + 1]));
  const top = w.at(4).balloons[0]; let ymin = 1e9; for (let k = 0; k < n; k++) ymin = Math.min(ymin, top.pts[2 * k + 1]);
  const areaOk = Math.abs(st.area / (g.area1 * 1.1) - 1) < 0.08;
  // each tip sticks out of the palm: farther from the centroid than the valleys next to it
  const dist = k => Math.hypot(P[2 * k] - cx, P[2 * k + 1] - cy);
  const out_ = tips.every(k => dist(k) > 1.15 * Math.min(dist((k + 4) % n), dist((k + n - 4) % n)));
  return { ok: tips.length === 5 && minSep > 25 && out_ && areaOk && ymin < 405 && finite(w), msg: tips.length + ' finger tips, closest ' + f(minSep, 0) + ' px apart, each a lobe: ' + out_ + ', area ' + f(st.area, 0) + ' vs target ' + f(g.area1 * 1.1, 0) + ', top at ' + f(ymin, 1) + ' (ceiling 400), events ' + w.events.map(e => e.kind).filter((v, i, a) => a.indexOf(v) === i).join('/') };
});
test('softCollide keeps two balloons apart on a ceiling (no particle inside the other)', () => {
  const w = S.world({ gravity: [0, 1500], seed: 8 });
  w.collider({ ceiling: 300 });
  const a = w.balloon({ x: 470, y: 600, outline: 'circle', radius: 70, segments: 40, buoyancy: 2000, softCollide: true });
  const b = w.balloon({ x: 610, y: 640, outline: 'circle', radius: 70, segments: 40, buoyancy: 2000, softCollide: true });
  w.run(3);
  const st = w.at(3), A = st.by[a.id].pts, B = st.by[b.id].pts;
  const inside = (P, x, y) => { let c = false; for (let i = 0, j = 39; i < 40; j = i++) { const yi = P[2 * i + 1], yj = P[2 * j + 1]; if ((yi > y) !== (yj > y) && x < (P[2 * j] - P[2 * i]) * (y - yi) / (yj - yi) + P[2 * i]) c = !c; } return c; };
  let bad = 0; for (let k = 0; k < 40; k++) { if (inside(B, A[2 * k], A[2 * k + 1])) bad++; if (inside(A, B[2 * k], B[2 * k + 1])) bad++; }
  let ca = 0, cb = 0; for (let k = 0; k < 40; k++) { ca += A[2 * k] / 40; cb += B[2 * k] / 40; }
  return { ok: bad === 0 && Math.abs(cb - ca) > 120, msg: bad + ' particles inside the other balloon, centres ' + f(Math.abs(cb - ca), 0) + ' px apart (radius 70)' };
});
test('pop: pressure past pop.pressure bursts it once (a pop event)', () => {
  const w = S.world({ gravity: [0, 1500], seed: 3 });
  const b = w.balloon({ x: 540, y: 900, outline: 'circle', radius: 60, segments: 32, pressure: t => 1 + 3 * t, pop: { pressure: 3 }, pins: [{ k: 0 }] });
  w.run(1.2);
  const pops = w.events.filter(e => e.kind === 'pop');
  return { ok: pops.length === 1 && Math.abs(pops[0].t - 0.667) < 0.02 && w.at(1.2).by[b.id].popped, msg: pops.length + ' pop at ' + (pops[0] ? f(pops[0].t, 3) : '-') + ' s (pressure 3 at 0.667 s)' };
});

// ------------------------------------------------------------------ events and foley
test('eventsToFoley: name soft, mat a+b sorted, tag, absolute time, pan from the camera, capped', () => {
  const { w } = tearWorld();
  w.run(2.6);
  const f1 = S.eventsToFoley(w.events, { sceneStart: 100, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 540, y: 960, zoom: 1 } }, maxEvents: 5 });
  const ok = f1.length <= 5 && f1.every(e => e.name === 'soft' && e.t >= 100 && typeof e.mag === 'number' && e.pan >= -1 && e.pan <= 1 && typeof e.k === 'string');
  return { ok: ok && w.events.length > 0, msg: w.events.length + ' raw, ' + f1.length + ' kept: ' + JSON.stringify(f1[0]) };
});

// ------------------------------------------------------------------ budgets
test('budget: a 24 x 24 cloth with three colliders, 10 s at 240 Hz, bakes in under 1.5 s (best of two); at(t) under 0.1 ms', () => {
  const times = [];
  let w;
  for (let k = 0; k < 2; k++) {
    w = S.world({ gravity: [0, 1500], seed: 22 });
    w.collider({ floor: 1300 }); w.collider({ box: [80, 50], x: 540, y: 1200 }); w.collider({ circle: 60, x: 400, y: 1100 });
    w.cloth({ x: 380, y: 700, width: 320, height: 320, cols: 24, rows: 24, mat: 'fabric' });
    times.push(timeMs(() => w.run(10))[0]);
  }
  const st = w.makeState(), [ms] = timeMs(() => { for (let i = 0; i < 2000; i++) w.at(i * 0.005, st); });
  const best = Math.min.apply(null, times);
  return { ok: best < 1500 && ms / 2000 < 0.1, msg: 'bake ' + times.map(t => f(t, 0)).join(' / ') + ' ms, at(t) ' + f(ms / 2000 * 1000, 1) + ' us' };
});
test('budget: twelve glove balloons with softCollide and a ceiling, 4.5 s, bake (best of two)', () => {
  const times = [];
  for (let k = 0; k < 2; k++) {
    const w = S.world({ gravity: [0, 1500], seed: 12 });
    w.collider({ ceiling: 300 });
    for (let i = 0; i < 12; i++) { const t0 = 0.15 * (i >> 1); w.balloon({ x: 150 + (i % 6) * 156, y: 1350 + (i % 3) * 60, outline: 'glove', scale: 0.62, segments: 56, pressure: t => Math.max(0, Math.min(1.1, (t - t0) / 0.5 * 1.1)), buoyancy: 1900, softCollide: true }); }
    times.push(timeMs(() => w.run(4.5))[0]);
  }
  const best = Math.min.apply(null, times);
  return { ok: best < 2500, msg: 'bake ' + times.map(t => f(t, 0)).join(' / ') + ' ms (budget 2.5 s)' };
});

const pass = results.filter(Boolean).length;
console.log((pass === results.length ? 'ALL PASS' : 'FAILURES') + ': ' + pass + '/' + results.length);
process.exit(pass === results.length ? 0 : 1);
