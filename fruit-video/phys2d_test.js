'use strict';
/* phys2d_test.js: `node phys2d_test.js` prints PASS/FAIL per test and a final summary line (exit code 1 on any failure). */
const P = require('./phys2d.js');
const results = [];
let perfNumbers = {};

function test(name, fn) {
  const t0 = process.hrtime.bigint();
  let r;
  try { r = fn(); } catch (e) { r = { ok: false, msg: 'threw: ' + String(e.stack).split('\n').slice(0, 3).join(' | ') }; }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  results.push(r.ok);
  console.log((r.ok ? 'PASS ' : 'FAIL ') + name + (r.msg ? ' : ' + r.msg : '') + '  [' + ms.toFixed(0) + ' ms]');
}
const f = (v, d) => v.toFixed(d == null ? 2 : d);
function maxDrift(w, bodies, t0, t1) {
  let m = 0;
  for (const b of bodies) { const a = w.pose(b, t0), c = w.pose(b, t1); m = Math.max(m, Math.hypot(a.x - c.x, a.y - c.y), Math.abs(a.angle - c.angle) * 20); }
  return m;
}

// ------------------------------------------------------------------ stacks and pyramids
test('stack of 8 boxes stands still for 5 s', () => {
  const w = P.world({ gravity: [0, 980], seed: 1 });
  w.floor(0);
  const bs = [];
  for (let i = 0; i < 8; i++) bs.push(w.body({ type: 'dynamic', box: [20, 10], x: 0.3 * (i % 2), y: -10.2 - i * 20.4, mat: 'wood' }));
  w.run(5);
  const d = maxDrift(w, bs, 0.5, 5);
  const top = w.pose(bs[7], 5);
  return { ok: d < 1.0 && Math.abs(top.x) < 2, msg: 'drift ' + f(d, 3) + ' units (box 40x20), top at ' + f(top.y, 1) };
});
test('stack of 8 with a 50x heavy top box (heavy on light)', () => {
  const w = P.world({ gravity: [0, 980], seed: 1 });
  w.floor(0);
  const bs = [];
  for (let i = 0; i < 7; i++) bs.push(w.body({ type: 'dynamic', box: [20, 10], x: 0, y: -10.2 - i * 20.4, mat: 'wood', density: 0.1 }));
  const heavy = w.body({ type: 'dynamic', box: [20, 10], x: 0, y: -10.2 - 7 * 20.4, density: 5 });
  w.run(5);
  const t = w.pose(heavy, 5), t1 = w.pose(heavy, 1);
  const sink = (-10.2 - 7 * 20.4) - t.y; // positive = sank
  return { ok: Math.abs(t.x) < 3 && sink < 12 && Math.abs(t.y - t1.y) < 1, msg: 'sank ' + f(sink) + ' units under a 50:1 load, x drift ' + f(t.x) + ', late motion ' + f(Math.abs(t.y - t1.y), 3) };
});
test('pyramid of 21 boxes is stable for 10 s', () => {
  const w = P.world({ gravity: [0, 980], seed: 1 });
  w.floor(0);
  const bs = [], n = 6, hw = 15;
  for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) bs.push(w.body({ type: 'dynamic', box: [hw, hw], x: (j - (n - i - 1) / 2) * (2 * hw + 0.4), y: -hw - 0.2 - i * (2 * hw + 0.4), mat: 'wood' }));
  w.run(10);
  const d = maxDrift(w, bs, 1, 10);
  const asleep = bs.filter(b => !w.pose(b, 10).awake).length;
  return { ok: bs.length === 21 && d < 1.5, msg: bs.length + ' boxes, max drift ' + f(d, 3) + ' units (box 30), asleep at 10 s: ' + asleep };
});
test('a ball bounces to the expected height (restitution 0.6)', () => {
  const w = P.world({ gravity: [0, 980] });
  w.floor(0);
  const r = 10, h0 = 300;
  const ball = w.body({ type: 'dynamic', circle: r, x: 0, y: -r - h0, restitution: 0.6, friction: 0.3 });
  w.run(2.5, { sampleHz: 240 });
  let tHit = -1, prev = w.pose(ball, 0).y, apex = 0, st = 0;
  for (let t = 1 / 240; t < 2.5; t += 1 / 240) {
    const y = w.pose(ball, t).y;
    const vy = w.pose(ball, t).vy;
    if (st === 0 && vy < 0) { st = 1; tHit = t; }                 // moving up after the first impact
    if (st === 1 && vy >= 0) { apex = -(y + r); st = 2; }         // apex height of the bottom above the floor
  }
  const expect = 0.36 * h0;
  return { ok: Math.abs(apex - expect) / expect < 0.06, msg: 'apex ' + f(apex, 1) + ' vs expected ' + f(expect, 1) + ' (' + f(100 * (apex - expect) / expect, 1) + '%), first impact at t=' + f(tHit, 3) };
});
test('box on a 20 degree slope slides at g(sin - mu cos); sticks when mu > tan', () => {
  const th = 20 * Math.PI / 180, out = [];
  for (const mu of [0.25, 0.6]) {
    const w = P.world({ gravity: [0, 980] });
    const Hs = 20;
    w.body({ type: 'static', box: [2000, Hs], x: 0, y: 0, angle: th, friction: mu });
    const hh = 10, nx = Math.sin(th), ny = -Math.cos(th);
    const box = w.body({ type: 'dynamic', box: [15, hh], x: nx * (Hs + hh + 0.05), y: ny * (Hs + hh + 0.05), angle: th, friction: mu, density: 1 });
    w.run(1.5);
    const a = w.pose(box, 0), b = w.pose(box, 1.5);
    out.push((b.x - a.x) * Math.cos(th) + (b.y - a.y) * Math.sin(th));
  }
  const expect = 0.5 * 980 * (Math.sin(th) - 0.25 * Math.cos(th)) * 1.5 * 1.5;
  return { ok: Math.abs(out[0] - expect) / expect < 0.05 && Math.abs(out[1]) < 1.0, msg: 'slid ' + f(out[0], 1) + ' vs ' + f(expect, 1) + ' (' + f(100 * (out[0] - expect) / expect, 1) + '%), sticky box moved ' + f(out[1], 3) };
});

// ------------------------------------------------------------------ joints and ropes
function upCrossings(w, body, T, dt) { // times of upward zero crossings of x(t) (interpolated)
  const ts = []; let prev = w.pose(body, 0).x;
  for (let t = dt; t <= T; t += dt) {
    const x = w.pose(body, t).x;
    if (prev < 0 && x >= 0) ts.push(t - dt + dt * (-prev) / (x - prev));
    prev = x;
  }
  return ts;
}
test('rope pendulum with a heavy bob swings with the right period (within 3%)', () => {
  const out = [];
  for (const nodeRatio of [250, 50]) { // bob mass over mass of one rope node
    const w = P.world({ gravity: [0, 980] });
    const anchor = w.body({ type: 'static', x: 0, y: 0 });
    const L = 200, th0 = 6 * Math.PI / 180, N = 24;
    const bob = w.body({ type: 'dynamic', circle: 8, x: L * Math.sin(th0), y: L * Math.cos(th0), density: 1 });
    const mr = N * bob.mass / nodeRatio; // total rope mass
    w.joint({ type: 'rope', a: anchor, b: bob, segments: N, length: L, mass: mr });
    w.run(12, { sampleHz: 240 });
    const ts = upCrossings(w, bob, 12, 1 / 480);
    const period = (ts[ts.length - 1] - ts[1]) / (ts.length - 2);
    const M = bob.mass, T0 = 2 * Math.PI * Math.sqrt(L / 980 * (M + mr / 3) / (M + mr / 2)) * (1 + th0 * th0 / 16);
    out.push({ ratio: nodeRatio, err: (period - T0) / T0, period, T0, n: ts.length });
  }
  const worst = Math.max(...out.map(o => Math.abs(o.err)));
  return { ok: worst < 0.03, msg: out.map(o => 'node ratio ' + o.ratio + ': T=' + f(o.period, 4) + ' s vs ' + f(o.T0, 4) + ' (' + f(100 * o.err, 2) + '%)').join('; ') };
});
test('hanging 24-segment rope does not stretch under a heavy load (< 3%)', () => {
  const out = [];
  for (const [label, nodeRatio] of [['node ratio 50', 50], ['node ratio 250', 250], ['node ratio 1000', 1000]]) {
    const w = P.world({ gravity: [0, 980] });
    const hook = w.body({ type: 'kinematic', x: 0, y: 0, pose: () => ({ x: 0, y: 0 }) });
    const L = 240, N = 24;
    const load = w.body({ type: 'dynamic', box: [30, 20], x: 0, y: L + 20, density: 1 });
    w.joint({ type: 'rope', a: hook, b: load, anchorB: [0, -20], segments: N, length: L, mass: N * load.mass / nodeRatio });
    w.warmup(1);
    w.run(4);
    const p = w.pose(load, 4);
    out.push({ label, stretch: (p.y - 20 - L) / L });
  }
  const worst = Math.max(...out.map(o => o.stretch));
  return { ok: worst < 0.03 && out.every(o => o.stretch > -0.02), msg: out.map(o => o.label + ' ' + f(100 * o.stretch, 2) + '%').join(', ') };
});
test('pendulum of 3 revolute links conserves energy within 3% over 5 s', () => {
  const w = P.world({ gravity: [0, 980], sleep: false });
  const anchor = w.body({ type: 'static', x: 0, y: 0 });
  const links = [];
  for (let i = 0; i < 3; i++) {
    links.push(w.body({ type: 'dynamic', box: [30, 4], x: 30 + i * 60, y: 0, density: 1, group: -1 }));
    w.joint({ type: 'pin', a: i === 0 ? anchor : links[i - 1], b: links[i], anchor: [i * 60, 0] });
  }
  const energy = () => { let e = 0; links.forEach((b, i) => { e += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy) + 0.5 * b.inertia * b.w * b.w + b.mass * 980 * ((30 + i * 60) - b.cy); }); return e; };
  const E0 = energy();
  let worst = 0, maxTilt = 0;
  for (let k = 0; k < 5 * 240; k++) { w.step(); const e = energy(); worst = Math.max(worst, Math.abs(e - E0) / E0); }
  return { ok: worst < 0.03, msg: 'E0=' + f(E0 / 1e3, 1) + 'k, worst deviation ' + f(100 * worst, 2) + '%' };
});

// ------------------------------------------------------------------ determinism and performance
function busyScene(seed) { // 150 bodies, a pile, two 24-segment ropes carrying heavy blocks from moving hooks
  const w = P.world({ gravity: [0, 980], seed });
  w.floor(0);
  w.body({ type: 'static', box: [10, 300], x: -260, y: -300 }); w.body({ type: 'static', box: [10, 300], x: 260, y: -300 });
  for (let i = 0; i < 150; i++) {
    const x = (w.rand() - 0.5) * 380, y = -40 - i * 24 - w.rand() * 10;
    if (i % 3 === 0) w.body({ type: 'dynamic', circle: 8 + w.rand() * 6, x, y, mat: 'rubber', tag: 'ball' });
    else w.body({ type: 'dynamic', box: [10 + w.rand() * 14, 6 + w.rand() * 8], x, y, angle: w.rand() * 3, mat: 'wood', tag: 'crate' });
  }
  for (let r = 0; r < 2; r++) {
    const hook = w.body({ type: 'kinematic', x: -100 + r * 200, y: -900, pose: t => ({ x: -100 + r * 200 + 60 * Math.sin(t * 1.3 + r), y: -900 }) });
    const blk = w.body({ type: 'dynamic', box: [20, 20], x: -100 + r * 200, y: -600, density: 3, mat: 'metal' });
    w.joint({ type: 'rope', a: hook, b: blk, segments: 24, length: 300 });
  }
  return w;
}
test('determinism: two builds give identical states (hash of 100 sampled states)', () => {
  const h = [];
  for (let k = 0; k < 2; k++) { const w = busyScene(7); w.warmup(0.5); w.run(3); h.push(P.stateHash(w, 100)); }
  const w3 = busyScene(8); w3.warmup(0.5); w3.run(3);
  return { ok: h[0] === h[1] && h[0] !== P.stateHash(w3, 100), msg: 'hash ' + h[0] + ' = ' + h[1] + ', other seed differs: ' + (P.stateHash(w3, 100)) };
});
test('performance: 150 bodies, 8 s, 2 ropes of 24 segments (run < 1.2 s)', () => {
  const w = busyScene(1);
  const t0 = process.hrtime.bigint();
  w.run(8);
  const run = Number(process.hrtime.bigint() - t0) / 1e6;
  const st = w.makeState(); const t1 = process.hrtime.bigint(); let acc = 0;
  for (let i = 0; i < 2000; i++) { w.at(i * 0.004, st); acc += st.bodies[3].x; }
  const at = Number(process.hrtime.bigint() - t1) / 2000 / 1e3;
  perfNumbers = { run_ms: Math.round(run), at_us: Math.round(at * 10) / 10, bodies: w.bodies.length, warnings: w.warnings.length };
  return { ok: run < 1200 && w.warnings.length === 0, msg: 'run ' + f(run, 0) + ' ms for ' + w.bodies.length + ' bodies incl. rope nodes, at(t) ' + f(at, 1) + ' us' };
});

// ------------------------------------------------------------------ events, cloth, other joints, robustness
test('collision events: bounce hits are timed on the contact, thinned, and the foley list is capped', () => {
  const w = P.world({ gravity: [0, 980] });
  w.floor(0, { tag: 'floor', mat: 'concrete' });
  const ball = w.body({ type: 'dynamic', circle: 10, x: 0, y: -10 - 300, restitution: 0.6, mat: 'rubber', tag: 'ball' });
  w.run(3, { sampleHz: 240 });
  const hits = w.events.filter(e => e.kind === 'hit');
  const tFirst = Math.sqrt(2 * 300 / 980);
  const mags = hits.map(e => e.mag);
  const decreasing = mags.every((m, i) => i === 0 || m < mags[i - 1]);
  // picture check: at the event time the ball is at the floor
  const y = w.pose(ball, hits[0].t).y;
  // thinning: no pair closer than 60 ms
  let thin = true; for (let i = 1; i < w.events.length; i++) if (w.events[i].a === w.events[i - 1].a && w.events[i].b === w.events[i - 1].b && w.events[i].kind === w.events[i - 1].kind && w.events[i].t - w.events[i - 1].t < 0.0599) thin = false;
  // cap: synthetic crowd of 400 events from 150 bodies keeps the first impact of the loudest bodies and at most 120
  const fake = []; for (let i = 0; i < 400; i++) fake.push({ t: i * 0.01, kind: 'hit', a: i % 150, b: 999, tagA: 'prop', tagB: 'floor', matA: 'wood', matB: 'concrete', x: 100 + i, y: 0, mag: ((i * 37) % 100) / 100, speed: 1 });
  const f = P.eventsToFoley(fake, { sceneStart: 10, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 300, y: 0, zoom: 1 } } });
  const firsts = new Set(); fake.forEach(e => firsts.add(e.a));
  const ok = hits.length >= 4 && Math.abs(hits[0].t - tFirst) < 0.02 && Math.abs(y + 10) < 2 && decreasing && thin && f.length <= 120 && f[0].name === 'phys' && f[0].t >= 10 && f.every(e => e.pan >= -1 && e.pan <= 1);
  return { ok, msg: hits.length + ' hits, first at ' + f2(hits[0].t) + ' s (free fall says ' + f2(tFirst) + '), mags ' + mags.slice(0, 4).map(m => m.toFixed(2)).join('>') + ', ball y at event ' + y.toFixed(1) + ', foley cap ' + f.length + ', sample ' + JSON.stringify(f[3]) };
});
function f2(v) { return v.toFixed(3); }
test('sliding and rolling produce slide / roll events', () => {
  const w = P.world({ gravity: [0, 980] });
  w.floor(0, { tag: 'floor' });
  w.body({ type: 'dynamic', box: [15, 10], x: 0, y: -10.5, vx: 300, mat: 'cardboard', tag: 'pizza', friction: 0.3 });
  w.body({ type: 'dynamic', circle: 10, x: -400, y: -10.5, vx: 300, w: 30, mat: 'rubber', tag: 'ball', friction: 0.8 });
  w.run(1.2);
  const k = {}; w.events.forEach(e => { k[e.kind] = (k[e.kind] || 0) + 1; });
  return { ok: (k.slide || 0) >= 2 && (k.roll || 0) >= 2, msg: JSON.stringify(k) };
});
test('cloth banner hangs, billows in wind, unrolls, and stays finite', () => {
  const out = {};
  for (const wind of [false, true]) {
    const w = P.world({ gravity: [0, 980] });
    const cl = w.cloth({ x: 0, y: 0, width: 200, height: 300, cols: 8, rows: 12, wind: wind ? { z: 120, gust: 160, hz: 0.8 } : {}, unroll: wind ? { t0: 0.3, dur: 1.6 } : undefined });
    w.warmup(0.5); w.run(5);
    const st = w.makeState(); let fin = true, minY = 1e9, maxY = -1e9, maxZ = 0;
    for (let t = 0; t <= 5; t += 0.1) { w.at(t, st); const p = st.cloths[0].pts; for (let i = 0; i < p.length; i++) if (!isFinite(p[i])) fin = false; }
    w.at(5, st); const p = st.cloths[0].pts;
    for (let i = 0; i < 8; i++) { minY = Math.min(minY, p[3 * (11 * 8 + i) + 1]); maxY = Math.max(maxY, p[3 * (11 * 8 + i) + 1]); }
    for (let k = 0; k < 96; k++) maxZ = Math.max(maxZ, Math.abs(p[3 * k + 2]));
    w.at(0, st); const y0 = st.cloths[0].pts[3 * (11 * 8) + 1];
    out[wind ? 'wind' : 'still'] = { fin, minY, maxY, maxZ, y0 };
  }
  const a = out.still, b = out.wind;
  return { ok: a.fin && b.fin && a.minY > 295 && a.minY < 309 && b.maxZ > 15 && b.minY > 200 && b.y0 < 60, msg: 'still: bottom edge y ' + a.minY.toFixed(1) + '; wind: max z ' + b.maxZ.toFixed(0) + ', bottom y ' + b.minY.toFixed(0) + '..' + b.maxY.toFixed(0) + ', rolled at t=0 (bottom row y ' + b.y0.toFixed(0) + ')' };
});
test('slider with a spring: static deflection and period within 3% (tower squat)', () => {
  const w = P.world({ gravity: [0, 980] });
  const ground = w.body({ type: 'static', x: 0, y: 0 });
  const blk = w.body({ type: 'dynamic', box: [30, 10], x: 0, y: -10, density: 1, group: -1 });
  const m = blk.mass, k = m * 980 / 10;
  const j = w.joint({ type: 'slider', a: ground, b: blk, anchor: [0, -10], axis: [0, -1], stiffness: k, damping: 2 * 0.02 * Math.sqrt(k * m), lower: -40, upper: 5 });
  w.run(4, { sampleHz: 240 });
  const ys = []; for (let t = 0; t <= 4; t += 1 / 480) ys.push([t, w.pose(blk, t).y]);
  const peaks = []; for (let i = 1; i < ys.length - 1; i++) if (ys[i][1] < ys[i - 1][1] && ys[i][1] <= ys[i + 1][1] && ys[i][1] < -0.5) peaks.push(ys[i][0]); // top of each swing (smallest y), above the equilibrium at y = 0
  const T = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1), T0 = 2 * Math.PI * Math.sqrt(m / k);
  const final = w.pose(blk, 4).y, static_ = -10 + 10; // rest at translation -10 => y = 0 (box centre starts at -10)
  return { ok: Math.abs(T - T0) / T0 < 0.03 && Math.abs(final - (-10 + 10)) < 0.6 && peaks.length >= 4, msg: 'period ' + T.toFixed(4) + ' vs ' + T0.toFixed(4) + ' s, settled y ' + final.toFixed(2) + ' (expected 0.00 = 10 units of squat)' };
});
test('weld holds, mouse joint drags, breakable joint snaps', () => {
  const out = [];
  { // weld: an L shaped structure of two welded boxes falls onto the floor and keeps its shape
    const w = P.world({ gravity: [0, 980] }); w.floor(0);
    const a = w.body({ type: 'dynamic', box: [30, 5], x: 0, y: -200, density: 1 }), b = w.body({ type: 'dynamic', box: [5, 30], x: 25, y: -225, density: 1 });
    w.joint({ type: 'weld', a, b, anchor: [25, -205] }); w.run(3);
    const pa = w.pose(a, 3), pb = w.pose(b, 3);
    const rx = pb.x - pa.x, ry = pb.y - pa.y, c = Math.cos(pa.angle), s = Math.sin(pa.angle); // offset in a's frame
    const lx = c * rx + s * ry, ly = -s * rx + c * ry;
    out.push(Math.hypot(lx - 25, ly + 25) + Math.abs(pb.angle - pa.angle));
  }
  { // mouse
    const w = P.world({ gravity: [0, 980] }); w.floor(0);
    const a = w.body({ type: 'dynamic', box: [15, 15], x: 0, y: -15, density: 1 });
    w.joint({ type: 'mouse', b: a, target: t => [200 * Math.min(t, 1), -100], hz: 6, ratio: 0.8, maxForce: 1e9 }); w.run(2.5);
    const p = w.pose(a, 2.5); out.push(Math.hypot(p.x - 200, p.y + 100));
  }
  { // break: a heavy block on a distance joint with a low break force
    const w = P.world({ gravity: [0, 980] });
    const hook = w.body({ type: 'static', x: 0, y: 0 });
    const blk = w.body({ type: 'dynamic', box: [20, 20], x: 0, y: 100, density: 2, tag: 'block' });
    w.joint({ type: 'distance', a: hook, b: blk, anchorB: [0, -20], length: 80, breakForce: 3 * blk.mass * 980 * 0.5, tag: 'chain' });
    w.schedule(1, () => { blk.applyImpulse(0, 0); }); // placeholder: hold for 1 s
    w.schedule(1.5, () => { blk.applyImpulse(0, 3000 * blk.mass / 100); });
    w.run(3); const y = w.pose(blk, 3).y;
    out.push(y > 300 ? 0 : 99); out.push(w.events.some(e => e.kind === 'break') ? 0 : 99);
  }
  return { ok: out[0] < 1.0 && out[1] < 4 && out[2] === 0 && out[3] === 0, msg: 'weld shape error ' + out[0].toFixed(3) + ', mouse reached target within ' + out[1].toFixed(2) + ', block fell after the break: ' + (out[2] === 0) + ', break event: ' + (out[3] === 0) };
});
test('kinematic body pushes dynamic ones; fast small bodies do not tunnel', () => {
  const r = [];
  { const w = P.world({ gravity: [0, 980] }); w.floor(0);
    const k = w.body({ type: 'kinematic', box: [10, 30], x: -200, y: -30, pose: t => ({ x: -200 + 100 * t, y: -30 }) });
    const d = w.body({ type: 'dynamic', box: [20, 20], x: -100, y: -20.2, density: 1, friction: 0.4 }); w.run(3);
    const pk = w.pose(k, 3), pd = w.pose(d, 3); r.push(pd.x - pk.x - 30); } // gap between front faces: 0 means in contact
  { const w = P.world({ gravity: [0, 980] }); w.floor(0);
    w.body({ type: 'static', box: [2, 80], x: 300, y: -80 });
    const b = w.body({ type: 'dynamic', circle: 3, x: 0, y: -60, vx: 5000, vy: 0, gravityScale: 0, restitution: 0.2 }); w.run(0.5);
    r.push(w.pose(b, 0.5).x < 300 ? 0 : 1); }
  { const w = P.world({ gravity: [0, 980] });
    w.body({ type: 'static', box: [200, 1.5], x: 0, y: 0 });
    const b = w.body({ type: 'dynamic', box: [10, 10], x: 0, y: -2000, vy: 4000, density: 1 }); w.run(1.2);
    r.push(w.pose(b, 1.2).y < 0 ? 0 : 1); }
  return { ok: Math.abs(r[0]) < 2 && r[1] === 0 && r[2] === 0, msg: 'pusher gap ' + r[0].toFixed(2) + ' units, bullet stopped by a 4 unit wall: ' + (r[1] === 0) + ', box at 4000 u/s stopped by a 3 unit platform: ' + (r[2] === 0) };
});
test('robustness: 40 random scenes (mixed shapes, joints, ropes, 50x mass ratios) stay finite and bounded', () => {
  let bad = 0, worst = 0, scenes = 0;
  for (let s = 1; s <= 40; s++) {
    const w = P.world({ gravity: [0, 980 * (0.5 + (s % 5))], seed: s });
    w.floor(0); w.body({ type: 'static', box: [10, 200], x: -300, y: -200 }); w.body({ type: 'static', box: [10, 200], x: 300, y: -200 });
    const bs = [];
    for (let i = 0; i < 25; i++) {
      const sc = w.rand() < 0.2 ? 6 : 1, x = (w.rand() - 0.5) * 400, y = -30 - i * 40 * w.rand() - 20, k = w.rand();
      const d = k < 0.4 ? { box: [4 + 18 * w.rand(), 3 + 14 * w.rand()] } : (k < 0.7 ? { circle: 4 + 12 * w.rand() } : { poly: [[-10 * w.rand() - 4, 8], [12, 6 * w.rand() + 2], [3, -14 * w.rand() - 4], [-12, -3]] });
      bs.push(w.body(Object.assign({ type: 'dynamic', x, y, angle: w.rand() * 6, density: sc * (0.2 + w.rand()), vx: (w.rand() - 0.5) * 600, vy: w.rand() * 300, mat: ['wood', 'metal', 'rubber', 'glass'][i % 4] }, d)));
    }
    for (let i = 0; i < 6; i++) { const a = bs[(w.rand() * 25) | 0], b = bs[(w.rand() * 25) | 0]; if (a !== b) w.joint({ type: ['pin', 'weld', 'distance', 'spring'][i % 4], a, b, anchor: [a.x, a.y], length: 60, hz: 3 }); }
    if (s % 3 === 0) { const h = w.body({ type: 'kinematic', x: 0, y: -500, pose: t => ({ x: 80 * Math.sin(t * 3), y: -500 + 30 * Math.cos(t * 2) }) }); w.joint({ type: 'rope', a: h, b: bs[0], segments: 16, length: 380 }); }
    w.run(4); scenes++;
    if (w.warnings.length) bad++;
    const st = w.makeState();
    for (let t = 0; t <= 4; t += 0.25) { w.at(t, st); for (const e of st.bodies) { if (!isFinite(e.x + e.y + e.angle)) bad++; worst = Math.max(worst, Math.hypot(e.vx, e.vy)); } }
  }
  return { ok: bad === 0 && worst < 80 * 980 * 5.5 / 9.8 * 1.01, msg: scenes + ' scenes, ' + bad + ' bad, fastest body ' + worst.toFixed(0) + ' u/s' };
});

const nOk = results.filter(Boolean).length;
console.log('phys2d_test: ' + nOk + '/' + results.length + ' passed' + (Object.keys(perfNumbers).length ? '  ' + JSON.stringify(perfNumbers) : ''));
process.exit(nOk === results.length ? 0 : 1);
