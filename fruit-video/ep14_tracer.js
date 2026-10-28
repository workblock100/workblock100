'use strict';
/* SHIFT HAPPENS, Episode 14: "The Survey". Scene module: tracer (3:15 PM, THE TRACER, 27.06 s). Builder E14-D.
 *
 * One nurse, followed everywhere: a documentary tracking shot along the middle floor of the dollhouse (S14: MED ROOM, ROOM 4, ROOM 7, SHOWER ROOM, left to right).
 * Strawberry (per diem) is the subject; Mr. Stateman (A14.stateman) and the Kumquat (A14.kumquat) are the observers; Mr. Banana and Mrs. Cranberry are the residents.
 *
 * STATUS: layer 1 (stage, cast, camera, HUD) -- see the shot list below.  Layout numbers live in the STAGE block; everything else is derived from S14.rect().
 */
(() => {
if (!window.TIMELINE_EP14 || !window.S14) return;
const { zoomTo, faceC, localOf } = window.H6;
const S14 = window.S14, A7 = window.A7, A11 = window.A11, A14 = window.A14;

// ------------------------------------------------------------------ small helpers
const c01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = c01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const pk = (t, keys, d) => { let v = d; for (const [t0, x] of keys) if (t >= t0) v = x; return v; };            /* the value of the last key at or before t */
const lazy = f => { let v, done = false; return () => (done ? v : (done = true, v = f())); };
const pulse = (t, t0, hz = 36, tau = .07) => t < t0 ? 0 : Math.sin((t - t0) * hz) * Math.exp(-(t - t0) / tau);
/* a monotone cubic through [t, v] keys (Fritsch-Carlson): smooth velocity, no overshoot, flat where two keys are equal */
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
/* a smooth blend between look/arm vectors: keys [t, vec] */
const vtrack = keys => { const ch = keys[0][1].map((_, j) => pchip(keys.map(k => [k[0], k[1][j]]))); return t => ch.map(f => f(t)); };
/* eyes that dart now and then (a new target about every .7 s, reached in .12 s) */
function dart(t, seed, amp = .25) {
  const q = t / .7 + seed * .37, i = Math.floor(q), f = q - i, e = easeOut(c01(f / .17));
  const g = n => [(hash(n * 7.1 + seed) * 2 - 1) * amp, (hash(n * 11.3 + seed + 3) * 2 - 1) * amp * .6];
  const a = g(i - 1), b = g(i);
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
}

// ------------------------------------------------------------------ timing: beats, words, cues (scene-local seconds; B() reads the scene being drawn)
const bs = id => B(id).s, be = id => B(id).e;
const wordT = (id, word, fb = 0) => {
  const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z0-9]/g, '').includes(word));
  return w ? l.s - CUR.start + w[1] : fb;
};
/* sound cues are relative to their BEAT (script_ep14.json): whoosh +0 and scramble +.1 into run, the three dings at +1.1 / +2.1 / +2.9, peel +.15 and boing +.4 into slip */
const CUE = {
  get whoosh() { return bs('run'); }, get scramble() { return bs('run') + .1; },
  get ding1() { return bs('run') + 1.1; }, get ding2() { return bs('run') + 2.1; }, get ding3() { return bs('run') + 2.9; },
  get peel() { return bs('slip') + .15; }, get boing() { return bs('slip') + .4; },
};

// ------------------------------------------------------------------ STAGE: where everything stands (world coordinates at zoom 1; the floor line is y = FL)
const R = id => S14.rect(id);
const FL = R('med').floor;
const U = (id, u) => R(id).x0 + u * R(id).w;
const S = S14.S, KS = S14.S * .72;                                                   /* an adult, and the trainee */
const STAGE = {
  // n1: the med room.  Strawberry at the cart, the two observers close behind her (on her left, away from the way she will run)
  sMed: U('med', .72), stMed: U('med', .44), kMed: U('med', .20), cartMed: U('med', .97),
  // the three call lights she places (x of the resident's hand reach), and where she halts afterwards
  light1: U('r4', .50), light2: U('r7', .56), light3: U('r7', .985), halt: U('r7', .66),
  // residents
  banR4: U('r4', .72), cranR7: U('r7', .20),
  // the observers' stops
  stR4: U('r4', .40), kR4: U('r4', .20), stR7: U('r7', .46), kR7: U('r7', .30),
};

// ------------------------------------------------------------------ the cast: paths in world x (the feet are always on the floor line)
/* Strawberry: the shadow-step gag in n1, the churn and the run, three call-light stops, the halt */
const SXf = lazy(() => pchip([
  [0, STAGE.sMed], [wordT('n1', 'followed', 2.54), STAGE.sMed], [wordT('n1', 'followed', 2.54) + .3, STAGE.sMed - 34], [wordT('n1', 'everywhere', 3.0) + .05, STAGE.sMed - 34], [wordT('n1', 'everywhere', 3.0) + .4, STAGE.sMed],
  [CUE.whoosh + .28, STAGE.sMed - 6], [CUE.whoosh + .3, STAGE.sMed - 6],
  [CUE.whoosh + .5, STAGE.sMed + 40], [CUE.whoosh + .8, STAGE.sMed + 150], [CUE.ding1 - .06, STAGE.light1 - 8], [CUE.ding1 + .06, STAGE.light1 + 20],
  [CUE.ding1 + .4, STAGE.light1 + 118], [CUE.ding2 - .06, STAGE.light2 - 8], [CUE.ding2 + .06, STAGE.light2 + 20],
  [CUE.ding2 + .3, STAGE.light2 + 80], [CUE.ding3 - .06, STAGE.light3 - 8], [CUE.ding3 + .02, STAGE.light3],
  [CUE.ding3 + .35, STAGE.light3 - 50], [bs('run') + 3.52, STAGE.halt], [bs('run') + 3.7, STAGE.halt - 6], [bs('run') + 3.95, STAGE.halt],
]));
const SX = lt => SXf()(lt);

// ------------------------------------------------------------------ gait of the runner (phase in CYCLES, so the stride can change without a jump), the cart, the cap
const strideAt = sp => lerp(30, 54, sstep(sp, 70, 270));                                  /* half-stride in local units: a stroll, then a sprint */
const sxSpeed = lt => (SX(lt + .03) - SX(lt - .03)) / .06;                                /* px/s */
const churnRate = lt => { const a = bs('run') + .02, b = CUE.whoosh + .34; return lt > a && lt < b ? 4.6 * sstep(lt, a, a + .08) * (1 - sstep(lt, b - .06, b)) : 0; };   /* cycles/s of legs spinning on the spot */
const PHI = lazy(() => {
  const dt = 1 / 120, N = Math.ceil(28 / dt), g = new Float32Array(N + 2); let acc = 0;
  for (let i = 0; i <= N; i++) { const t = i * dt, v = Math.abs(sxSpeed(t)); acc += Math.max(v / S / (4 * strideAt(v)), churnRate(t)) * dt; g[i] = acc; }
  g[N + 1] = g[N];
  return t => { const f = Math.max(0, t) / dt, i = Math.min(N, Math.floor(f)), u = f - i; return g[i] * (1 - u) + g[i + 1] * u; };
});
const smoothSpeed = lt => { let a = 0; for (let i = 0; i < 6; i++) a += Math.abs(sxSpeed(lt - i * .03)); return a / 6; };

// ------------------------------------------------------------------ Strawberry
const gazeTo = (o, tx, ty = 0, rx = 90) => [Math.max(-1, Math.min(1, (tx - o.x) / rx)), Math.max(-.8, Math.min(.8, ty / 80))];
function strawO(lt) {
  const w0 = CUE.whoosh, x = SX(lt), v = sxSpeed(lt), av = Math.abs(v), t = lt;
  const running = lt >= w0 - .05 && lt < bs('run') + 3.9;
  // body language by phase
  const ant = sstep(lt, bs('s1') + .1, w0) * (1 - sstep(lt, w0, w0 + .06));                /* the crouch on "Run." */
  const snap = sstep(lt, w0, w0 + .1) * (1 - sstep(lt, w0 + .3, w0 + .55));               /* stretched while the legs spin, then the launch */
  const speedN = c01(av / 330);
  const halt = bs('run') + 3.52, hk = lt >= halt ? Math.sin(c01((lt - halt) / .42) * PI) * Math.exp(-(lt - halt) * 3) : 0;
  const near = d => Math.exp(-Math.pow((lt - d) / .07, 2));                                 /* a pulse around a ding */
  const brace = Math.max(near(CUE.ding1 - .09), near(CUE.ding2 - .09), near(CUE.ding3 - .09));   /* anticipation before the hand goes out */
  const kick = Math.max(near(CUE.ding1 + .08), near(CUE.ding2 + .08), near(CUE.ding3 + .08));    /* the overshoot after it */
  let squash = .1 * ant - .1 * snap - .035 * speedN + .06 * brace - .05 * kick + .13 * hk;
  let rot = .3 * snap + .16 * speedN * (1 - snap) - .1 * hk + .05 * ant;
  let expr = 'dead', lid = .42, look = [.2, .15], arms = { l: 'rest', r: 'rest' }, grip, hand, face;
  const ph = PHI()(lt);
  // n1: working at the cart
  if (lt < bs('s1')) {
    const tw = lt * 1.3;
    arms = { l: 'hold', r: 'hold' };
    grip = { l: [30 + 6 * Math.sin(tw), 44 + 6 * Math.sin(tw * 1.7)], r: [78 + 8 * Math.sin(tw * 2.1), 36 + 8 * Math.sin(tw * 1.3 + 1)] };
    look = lt < bs('st1') + 1.2 ? [.55 + .1 * Math.sin(tw), .45] : lt < bs('st1') + 1.8 ? [-.5, .1] : [-.2, .2];
    if (lt >= bs('st1') && lt < bs('s1')) look = vtrack([[bs('st1'), [.55, .4]], [bs('st1') + .5, [-.7, .0]], [bs('st1') + 1.7, [-.7, .0]], [bs('s1'), [-.1, .0]]])(lt);
  } else if (lt < w0 + .3) {
    look = [0, 0]; arms = { l: 'rest', r: 'rest' };
  } else if (running) {
    // the run: hands pump (a cartoon fold at the sides); the hand shoots out at each call light
    const sw = Math.sin(ph * TAU);
    arms = { l: 'hold', r: 'hold' };
    grip = { l: [-84, 8 + 30 * sw], r: [84, 8 - 30 * sw] };
    look = [.55, .0];
  } else {
    arms = { l: 'none', r: 'none' }; expr = 'hopeful'; lid = 0; look = [-.5, .05];     /* hands behind her back */
  }
  // the legs
  const sp = Math.abs(v), A = strideAt(sp), moving = sp / S > 9 || churnRate(lt) > 0;
  const o = A11.straw({ x, y: FL, s: S, t, expr, lid, look, arms, grip, hand, plant: true, squash, rot, cap: lt < w0 + .12 || lt > halt + .75, stride: A });
  if (moving) { o.gaitW = ph * 4 * A; o.axis = 'x'; o.dir = Math.sign(v) || 1; o.vx = v; }
  if (face) o.face = face;
  return o;
}

// ------------------------------------------------------------------ the observers
const STX = lazy(() => pchip([
  [0, STAGE.stMed], [wordT('n1', 'followed', 2.54) + .1, STAGE.stMed], [wordT('n1', 'followed', 2.54) + .45, STAGE.stMed - 34], [wordT('n1', 'everywhere', 3.0) + .15, STAGE.stMed - 34], [wordT('n1', 'everywhere', 3.0) + .5, STAGE.stMed],
  [bs('run') + .75, STAGE.stMed], [bs('run') + 3.5, STAGE.stR4], [bs('k1') + .2, STAGE.stR4],
]));
function stateO(lt) {
  const fn = t => [STX()(t), FL];
  const o0 = { x: STX()(lt), y: FL };
  const look = lt < bs('run') ? gazeTo(o0, SX(lt - .15), 40) : gazeTo(o0, SX(lt - .5), 40);
  const wr = pk(lt, [[0, .0], [bs('n1') + .3, .7], [bs('st1') - .2, 0]], 0);
  return S14.walk(A14.stateman, fn, lt, { s: S, t: lt, look, writing: wr, pose: wr > .1 ? 'write' : 'carry', stride: 38 });
}
const KXf = lazy(() => pchip([
  [0, STAGE.kMed], [wordT('n1', 'followed', 2.54) + .2, STAGE.kMed], [wordT('n1', 'followed', 2.54) + .5, STAGE.kMed - 20], [wordT('n1', 'everywhere', 3.0) + .25, STAGE.kMed - 20], [wordT('n1', 'everywhere', 3.0) + .6, STAGE.kMed],
  [bs('run') + .3, STAGE.kMed], [bs('run') + 2.0, STAGE.kR4], [bs('k1') + .2, STAGE.kR4],
]));
function kumO(lt) {
  const fn = t => [KXf()(t), FL];
  const o0 = { x: KXf()(lt), y: FL };
  const look = gazeTo(o0, SX(lt - .3), 40);
  return S14.walk(A14.kumquat, fn, lt, { s: KS, t: lt, look, pose: 'write', writing: .6, tongue: .8, stride: 30 });
}

// ------------------------------------------------------------------ residents
function banO(lt) {
  const fn = t => [STAGE.banR4, FL];
  return S14.walk(A7.banana, fn, lt, { s: S, t: lt, expr: 'happy', look: [-.3, .2] });
}
function cranO(lt) {
  const fn = t => [STAGE.cranR7, FL];
  return S14.walk(A7.cran, fn, lt, { s: S, t: lt, expr: 'happy', look: [.2, .1] });
}

// ------------------------------------------------------------------ the camera: a list of shots, each a function of scene-local time returning [cx, cy, z, roll]
const cyFor = (z, fy = 1270) => FL - (fy - 960) / z;                                      /* the camera centre that puts the floor line at screen y = fy */
const camFloor = (cx, z, fy) => [cx, cyFor(z, fy), z, 0];
const camFace = (o, z, up = 230) => { const [fx, fy] = faceC(o); return [fx, fy + up / z, z, 0]; };
const expK = (a, b, k) => a * Math.pow(b / a, k);                                         /* zoom in log space */
const SHOTS = [
  { id: 'wide', t0: 0, t1: .2, cam: lt => [540, 960, 1, 0] },
  { id: 'dive', t0: .2, t1: .9, cam: lt => { const e = easeIO(seg(lt, .2, .9)), z = expK(1, 2.1, e); return [lerp(540, 262, e), lerp(960, cyFor(2.1), e), z, 0]; } },
  { id: 'n1', t0: .9, t1: 3.9, cam: lt => camFloor(lerp(262, 250, seg(lt, .9, 3.9)), lerp(2.1, 2.22, easeIO(seg(lt, .9, 3.9)))) },
  { id: 'st1', t0: 3.9, t1: 6.1, cam: lt => camFloor(lerp(250, 238, seg(lt, 3.9, 6.1)), lerp(2.22, 2.4, easeIO(seg(lt, 3.9, 6.1)))) },
  { id: 'snap', t0: 6.1, t1: 6.66, cam: lt => { const e = easeOut(seg(lt, 6.1, 6.34)); const a = camFloor(238, 2.4), b = camFace(strawO(lt), 3.0, 250); return [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e), 0]; } },
  { id: 'run', t0: 6.66, t1: 10.3, cam: lt => { const x = SX(lt - .1) + 110; return camFloor(x, 1.75, 1240); } },
  { id: 'two', t0: 10.3, t1: 99, cam: lt => camFloor(540, 2.1) },
];
const shotAt = lt => SHOTS.find(s => lt < s.t1) || SHOTS[SHOTS.length - 1];

// ------------------------------------------------------------------ props
const INK_ = '#1d1a22';
/* a call-light handset: cream body, a red button, a green LED; (x, y) is the top of the body where the cord leaves it. led 0..1 lights the LED (green glow, bloom) */
function pendant(x, y, rot, led = 0, k = 1.45) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(4, -4, 0, 0); ctx.stroke();
  ctx.fillStyle = V2.grad(0, 0, 0, 25, [[0, '#fffaf0'], [1, '#d7cfbb']]); ctx.strokeStyle = INK_; ctx.lineWidth = 2; rr(-7, 0, 14, 25, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8283a'; ell(0, 8.5, 4.4, 4.4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(-1.4, 7, 1.4, 1); ctx.fill();
  ctx.fillStyle = led > .05 ? '#7dff9c' : '#2f4a35'; ell(0, 19, 2.3, 2.3); ctx.fill(); ctx.stroke();
  if (led > .05) V2.glow(0, 19, 26, '110,255,150', .8 * led, 'screen', .6);
  ctx.restore();
}
/* the med cart seen from the front, feet on y = FL: drawn at its centre x (a copy of the look of ep9_floor.js `cart`, reshaped front-on). rattle 0..1 shakes the tray */
function drawCart(x, lt, rattle = 0) {
  const y = FL, rt = rattle * (hn(lt, 40, 3) * 1.6), rx = rattle * hn(lt, 33, 5) * 1.2;
  ctx.save(); ctx.translate(x + rx, y);
  ctx.fillStyle = 'rgba(8,6,20,.28)'; ell(0, 3, 50, 6); ctx.fill();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#23272e'; for (const dx of [-32, 32]) { ell(dx, -7, 7, 7); ctx.fill(); ell(dx, -7, 2.6, 2.6); ctx.fillStyle = '#9aa3b2'; ctx.fill(); ctx.fillStyle = '#23272e'; }
  ctx.strokeStyle = INK_; ctx.lineWidth = 3;
  ctx.fillStyle = V2.grad(0, -78, 0, -16, [[0, '#4f8ae6'], [1, '#2a62c4']]); rr(-40, -78, 80, 60, 7); ctx.fill(); ctx.stroke();
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { ctx.fillStyle = '#6aa0f0'; ctx.lineWidth = 2; rr(-35 + c * 36, -73 + r * 27, 33, 23, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e4ecf5'; rr(-24 + c * 36, -64 + r * 27, 11, 4, 2); ctx.fill(); }
  ctx.lineWidth = 3; ctx.fillStyle = '#eef2f8'; rr(-46, -88 + rt, 92, 11, 4); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(44, -70); ctx.lineTo(60, -70); ctx.lineTo(60, -46); ctx.stroke();
  // the tray: med cups and a row of insulin pens
  ctx.save(); ctx.translate(0, -88 + rt);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.strokeStyle = INK_; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-36 + i * 11, -13); ctx.lineTo(-27 + i * 11, -13); ctx.lineTo(-28.5 + i * 11, 0); ctx.lineTo(-34.5 + i * 11, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(2 + i * 10, -3); ctx.rotate(-.5 + i * .12); ctx.fillStyle = ['#2a6fdb', '#e8a020', '#2f9a4a', '#8a46c8'][i]; ctx.strokeStyle = INK_; ctx.lineWidth = 1.6; rr(-3, -22, 6, 24, 2.2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f4f4f8'; rr(-3, -29, 6, 8, 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}
/* Banana's walker (front view, tennis balls on the front feet). The prop is drawn around his LEFT hand (the grip target l); the right hand grips 165 local units to the right. */
function walkerShape(k = 1) {
  ctx.save(); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#7b8696'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(26, 4); ctx.lineTo(26, 142); ctx.moveTo(139, 4); ctx.lineTo(139, 142); ctx.stroke();       /* the rear legs, behind */
  ctx.strokeStyle = INK_; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(169, 0); ctx.moveTo(0, 0); ctx.lineTo(0, 136); ctx.moveTo(165, 0); ctx.lineTo(165, 136); ctx.moveTo(0, 92); ctx.lineTo(165, 92); ctx.stroke();
  ctx.strokeStyle = '#c3ccd8'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(169, 0); ctx.moveTo(0, 0); ctx.lineTo(0, 136); ctx.moveTo(165, 0); ctx.lineTo(165, 136); ctx.moveTo(0, 92); ctx.lineTo(165, 92); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -1.5); ctx.lineTo(169, -1.5); ctx.stroke();
  for (const bx of [0, 165]) { ctx.fillStyle = '#d6e63a'; ctx.strokeStyle = INK_; ctx.lineWidth = 2.6; ell(bx, 140, 11.5, 10.5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(bx, 140, 7, PI * .15, PI * .85); ctx.stroke(); }
  ctx.restore();
}
EXT.prop.fp14t_walker = () => walkerShape(1);

// ------------------------------------------------------------------ effects
/* a soft puff of floor dust: u 0..1 the age */
function puff(x, y, u, size = 1, tint = '232,214,186') {
  if (u <= 0 || u >= 1) return;
  const r = (16 + 34 * easeOut(u)) * size, a = .5 * (1 - u) * (1 - u);
  const px = x, py = y - 8 * size - 26 * u * size;
  ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(${tint},${a})`], [1, `rgba(${tint},0)`]]); ctx.fillRect(px - r, py - r, r * 2, r * 2);
}
/* the dust the runner kicks up: one puff every .04 s while she is fast, each born where her feet were */
function dustTrail(lt, t0, t1, fnX, spMin = 110) {
  ctx.save();
  for (let t = Math.ceil(t0 / .04) * .04; t <= Math.min(lt, t1); t += .04) {
    const age = (lt - t) / .55; if (age >= 1) continue;
    if (Math.abs((fnX(t + .03) - fnX(t - .03)) / .06) < spMin) continue;
    const j = hash(t * 91.7), dir = Math.sign(fnX(t + .03) - fnX(t - .03)) || 1;
    puff(fnX(t) - dir * (6 + 22 * age) + (j - .5) * 12, FL + 1, age, .8 + .5 * j);
  }
  ctx.restore();
}
/* manga speed lines trailing behind the runner, in her frame; a ~ 0..1 */
function speedLines(lt, x, y, dir, a) {
  if (a <= .02) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const ph = (lt * (2.6 + 1.6 * hash(i + 3)) + hash(i * 3.1)) % 1, hy = y + (hash(i * 5.3 + 1) * 2 - 1) * 78, len = 46 + 80 * hash(i + 9);
    const x0 = x - dir * (40 + ph * 150), x1 = x0 - dir * len;
    ctx.strokeStyle = `rgba(255,252,240,${.62 * Math.sin(ph * PI) * (.5 + .5 * hash(i + 17))})`; ctx.lineWidth = 2 + 2.2 * hash(i + 21);
    ctx.beginPath(); ctx.moveTo(x0, hy); ctx.lineTo(x1, hy); ctx.stroke();
  }
  ctx.restore();
}
/* the nurse's cap in flight: it streams behind her head while she is fast, drifts back as she slows, and drops onto her head after the halt */
function capState(lt, so) {
  const w0 = CUE.whoosh, halt = bs('run') + 3.52, t0 = w0 + .12;
  if (lt < t0 || lt > halt + .75) return null;
  const sm = smoothSpeed(lt), dir = 1, lift = sstep(lt, t0, t0 + .22) * sstep(sm, 60, 250);
  let dx = -.1 * sm * dir * lift, dy = -26 * lift + 4 * Math.sin(lt * 15) * lift, rot = -.55 * lift + .14 * Math.sin(lt * 18) * lift;
  if (lt > halt) {   /* the overshoot, then the drop onto her head with a bounce */
    const u = c01((lt - halt) / .5), bounce = u > .78 ? -5 * Math.abs(Math.sin((u - .78) / .22 * PI)) * (1 - (u - .78) / .22) : 0;
    const e = easeIn(u);
    dx = lerp(dx, 0, e) + 16 * Math.sin(PI * Math.min(1, u * 1.2)) * (1 - u); dy = lerp(dy, 0, e) - 12 * Math.sin(PI * Math.min(1, u * 1.3)) * (1 - u) + bounce; rot = lerp(rot, 0, e);
  }
  return { dx, dy, rot };
}
function drawCap(o, cs) {
  const k = KINDS.straw, sy = 1 - (o.squash || 0) * .35, base = [o.x, o.y - (o.lift || 0) - (92 + k.ry * .9) * o.s];
  const gy = -k.ry * .86, cx = base[0] + cs.dx, cy = base[1] + (gy - 38) * o.s * sy + cs.dy;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(cs.rot - .06 + (o.rot || 0)); ctx.scale(o.s, o.s);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-62, 12); ctx.lineTo(-48, -34); ctx.quadraticCurveTo(0, -46, 48, -34); ctx.lineTo(62, 12); ctx.quadraticCurveTo(0, 22, -62, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd5de'; ctx.fillRect(-58, 0, 116, 8);
  ctx.fillStyle = '#e8193a'; ctx.fillRect(-6, -30, 12, 28); ctx.fillRect(-14, -22, 28, 12);
  ctx.restore();
}

// ------------------------------------------------------------------ the call lights she places
const LIGHTS = [
  { at: () => CUE.ding1, x: () => STAGE.light1, y: () => FL - 66, rot: .05 },
  { at: () => CUE.ding2, x: () => STAGE.light2, y: () => FL - 52, rot: -.08 },
  { at: () => CUE.ding3, x: () => STAGE.light3, y: () => FL - 96, rot: 0 },
];
const placed = lt => LIGHTS.filter(L => lt >= L.at()).length;
function drawPlaced(lt) {
  for (const L of LIGHTS) {
    const t0 = L.at(); if (lt < t0) continue;
    const age = lt - t0, sway = Math.sin(age * 9) * .16 * Math.exp(-age * 3.2), led = .75 + .25 * Math.sin(lt * 7);
    pendant(L.x(), L.y(), L.rot + sway, led);
    if (age < .6) { V2.ring(L.x(), L.y() + 12, age / .6, { r0: 10, r1: 90, lw: 5, color: '120,255,160', alpha: .9 }); }
  }
}

// ------------------------------------------------------------------ the world
function castOf(lt) {
  const so = strawO(lt), n = placed(lt), run = lt >= CUE.whoosh && lt < bs('run') + 3.7;
  // the bundle of handsets in her fist: swinging behind her while she runs, one fewer after each ding
  return { so, n, run };
}
function drawBundle(lt, so, n) {
  if (n >= 3 || lt < bs('s1') + .05) return;
  const g = so.grip && so.grip.r; if (!g) return;
  const [hx, hy] = H6.localToScreen(so, g[0], g[1]), v = sxSpeed(lt), tr = Math.max(-1, Math.min(1, -v / 300));
  for (let i = 0; i < 3 - n; i++) { pendant(hx + (tr * 16 + i * 5) , hy + 8 + i * 5, tr * .8 + .1 * Math.sin(lt * 20 + i * 2), 0, 1.15); }
}
function drawWorld(lt, sh) {
  V2.setLight({ key: [-.4, -.8], keyColor: '#ffe9c4', keyA: .24, rim: '#a9ccff', rimA: .5, shadow: '#2a2040', shadowA: .34, bounce: '#ffd9a0', bounceA: .18, amb: '#fff0d8', ambA: .05 });
  S14.back(lt, { t: lt });
  const w0 = CUE.whoosh, halt = bs('run') + 3.52;
  const { so, n, run } = castOf(lt);
  // dust and speed lines first (behind everyone)
  dustTrail(lt, w0 + .0, halt + .1, SX, 100);
  if (run) { const sp = smoothSpeed(lt); speedLines(lt, so.x - 6, FL - 86, Math.sign(sxSpeed(lt)) || 1, c01((sp - 110) / 120)); }
  // the cart: shoved at the launch, it rolls on and coasts to a stop in ROOM 7
  const cx = cartX(lt);
  drawCart(cx, lt, cartRattle(lt));
  drawPlaced(lt);
  const cast = [cranO(lt), banO(lt), kumO(lt), stateO(lt), so];
  for (const o of cast) drawChar(o);
  const cs = capState(lt, so); if (cs) drawCap(so, cs);
  drawBundle(lt, so, n);
  S14.front(lt, { t: lt });
}
const CARTD = () => STAGE.cartR7 - STAGE.cartMed;
const cartX = lt => { const t0 = CUE.whoosh + .4, T = 2.9, u = c01((lt - t0) / T); return STAGE.cartMed + CARTD() * (2 * u - u * u); };
const cartRattle = lt => { const t0 = CUE.whoosh + .4, T = 2.9, u = c01((lt - t0) / T); return lt > t0 && u < 1 ? .4 + .6 * (1 - u) : 0; };

// ------------------------------------------------------------------ the HUD (screen space, in over())
const HUD = { right: 1040 };
function hudTally(lt) {
  const t0 = CUE.whoosh - .12, t1 = bs('k1') + 1.7, a = sstep(lt, t0, t0 + .2) * (1 - sstep(lt, t1, t1 + .3));
  if (a <= .01) return;
  const n = placed(lt), size = 30, h = 64, lab = 'CALL LIGHTS IN REACH', li = UI.sizeOf(lab, { size, weight: 900, spacing: 1.5 });
  const dw = 22, w = 28 + li.w + 22 + dw * 3 + 26, x0 = HUD.right - w, y0 = 284;
  const last = Math.max(0, ...LIGHTS.map(L => lt - L.at()).filter(d => d >= 0).sort((p, q) => p - q).slice(0, 1)), popK = placed(lt) > 0 && last < .35 ? Math.sin(c01(last / .35) * PI) : 0;
  const all = n === 3;
  ctx.save(); ctx.globalAlpha *= a;
  UI.panel([x0, y0, w, h], { id: 'tally', kind: 'pill', fill: '#f2e8cf', stroke: all ? '#2f8f4a' : '#24402e', lw: 4, r: h / 2, pad: 12, shadow: 14 });
  reg('overlay', [x0, y0, x0 + w, y0 + h], { id: 'tally' });
  UI.label(lab, x0 + 28, y0 + h / 2, { size, weight: 900, spacing: 1.5, fill: '#24402e', align: 'left', cid: 'tally', center: false });
  let xx = x0 + w - 26 - dw * 3;
  for (const [ch, wd] of [[String(n), dw], ['/', dw], ['3', dw]]) {
    const pop = ch === String(n) && popK > 0 ? 1 + .28 * popK : 1;
    ctx.save(); ctx.translate(xx + wd / 2, y0 + h / 2); ctx.scale(pop, pop); ctx.translate(-(xx + wd / 2), -(y0 + h / 2));
    UI.label(ch, xx + wd / 2, y0 + h / 2, { size: 38, font: 'Bangers', weight: 400, fill: all ? '#2f8f4a' : n > 0 && ch === String(n) ? '#c98b2c' : '#7a6a48', cid: 'tally', center: false, crop: pop !== 1 });
    ctx.restore(); xx += wd;
  }
  ctx.restore();
}
function hudTag(lt) {
  const t0 = wordT('n1', 'tracer', 1.13) - .05, t1 = bs('s1') + .1, a = sstep(lt, t0, t0 + .22) * (1 - sstep(lt, t1, t1 + .25));
  if (a <= .01) return;
  const sw = Math.sin(lt * 1.6) * .03 + .035 * Math.exp(-Math.max(0, lt - t0) * 2.4) * Math.sin((lt - t0) * 11);
  ctx.save(); ctx.globalAlpha *= a;
  const cx = HUD.right - 244, cy = 352;
  const tg = UI.tag([{ t: 'TRACER: SUBJECT A', size: 34, weight: 900, fill: '#24402e' }, { t: 'Strawberry, per diem', size: 30, weight: 800, italic: true, fill: '#8a5a12' }], cx, cy, { fill: '#f2e8cf', stroke: '#24402e', lw: 4, size: 34, id: 'tracetag', rot: sw, w: 488 });
  reg('overlay', [tg.x0, tg.y0, tg.x1, tg.y1], { id: 'tracetag' });
  ctx.restore();
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotAt(lt).id,
  cam(lt) { const [cx, cy, z, r] = shotAt(lt).cam(lt); zoomTo(cx, cy, z); CAM.r = r; },
  draw(lt) { drawWorld(lt, shotAt(lt)); },
  fx: lt => ({ bloom: .45, vignette: .36, grain: .05, contrast: .14, sat: .1 }),
  blur: lt => (lt > .2 && lt < .95) || (lt > CUE.whoosh - .1 && lt < bs('run') + 3.7) ? 3 : 1,
  over(lt) { hudTag(lt); hudTally(lt); },
};
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.tracer = SC;
})();
