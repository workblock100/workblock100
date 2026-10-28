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

// ------------------------------------------------------------------ STAGE: where everything stands (world coordinates at zoom 1; the floor line is y = FL). Numbers read off K's rooms (S14 v1):
// ROOM 4: bed x 318..462, window 435..512; ROOM 7: lamp 575, armchair 589..668 (seat top FL-50), radio 700, dresser 722..772; SHOWER: curtain 906..962. Nobody can walk past the seated Cranberry
// (two faces would overlap), so Strawberry hurdles her and the group relocates while the pen macro is on screen.
const R = id => S14.rect(id);
const FL = R('med').floor;
const U = (id, u) => R(id).x0 + u * R(id).w;
const S = S14.S, KS = S14.S * .72;                                                   /* an adult, and the trainee */
const STAGE = {
  // n1: the med room. Strawberry at the cart (the cart on her right, its handle toward her), the two observers close behind her on her left
  sMed: 202, stMed: 132, kMed: 72, cartMed: 264,
  // the three call lights: where the handset lands (x, px above the floor) and where her hand is when it does
  light1: [474, 64], light2: [640, 62], light3: [794, 98],
  contact1: 392, hurdle: [8.46, 9.02], contact3: 712, halt: 738,
  // residents
  banR4: 440, cranR7: 628, seatY: 50,
  // the observers: ROOM 4 at the first handset, then ROOM 7 at the cart (a cut hides the walk), then into the shower room while the macro is on
  stR4: 352, kR4: 398, stR7: 770, kR7: 815, sR7: 870, cartR7: 720,
  stSH: 990, kSH: 940, sSH: 890, banSlip: 725,
};
const CUT = { st3: 13.184, macro0: 16.294, macro1: 17.793 };             /* hard cuts hide the observers' relocations (scene-local seconds) */

// ------------------------------------------------------------------ paths in world x (the feet are always on the floor line)
/* Strawberry: the shadow-step gag in n1, the churn, then dash - stop at ROOM 4 - hurdle the armchair - stop at the wall - halt, then inch to the cart's other side */
const SXf = lazy(() => {
  const f = wordT('n1', 'followed', 2.54), e = wordT('n1', 'everywhere', 3.0), w = CUE.whoosh, c1 = CUE.ding1, c2 = CUE.ding2, c3 = CUE.ding3, h = bs('run') + 3.52;
  const [h0, h1] = STAGE.hurdle;
  return pchip([
    [0, STAGE.sMed], [f, STAGE.sMed], [f + .3, STAGE.sMed - 34], [e + .05, STAGE.sMed - 34], [e + .4, STAGE.sMed],
    [w + .3, STAGE.sMed - 4], [w + .31, STAGE.sMed - 4],                                  /* held by the squash while the legs spin */
    [w + .55, STAGE.sMed + 52], [w + .8, STAGE.sMed + 150], [c1 - .22, STAGE.contact1 - 40], [c1 - .05, STAGE.contact1 - 8], [c1 + .05, STAGE.contact1],
    [c1 + .2, STAGE.contact1 + 22], [c1 + .45, STAGE.contact1 + 90], [h0 - .15, 556], [h0, 574], [c2, 626], [h1, 682], [h1 + .2, 708],
    [c3 - .1, STAGE.contact3 - 8], [c3 + .05, STAGE.contact3],
    [h - .1, STAGE.halt - 4], [h + .15, STAGE.halt + 6], [h + .45, STAGE.halt], [bs('st2') + .1, STAGE.halt], [CUT.st3, STAGE.sR7],
    [bs('s2') + .6, STAGE.sR7], [CUT.macro1, STAGE.sSH], [bs('b1'), STAGE.sSH],
  ]);
});
const SX = lt => SXf()(lt);
/* the arc of the hurdle: 0 outside it, 4u(1-u) inside, in px of lift */
const hurdleLift = lt => { const [a, b] = STAGE.hurdle; return lt > a && lt < b ? 96 * 4 * ((lt - a) / (b - a)) * (1 - (lt - a) / (b - a)) : 0; };
/* the cart: parked beside her, shoved at the launch, coasting to rest in ROOM 7 */
const CARTf = lazy(() => {
  const t0 = CUE.whoosh + .5, t1 = CUE.whoosh + 3.3, x0 = STAGE.cartMed + 26, v0 = 2 * (STAGE.cartR7 - x0) / (t1 - t0);
  return t => t < CUE.whoosh + .3 ? STAGE.cartMed : t < t0 ? lerp(STAGE.cartMed, x0, sstep(t, CUE.whoosh + .3, t0)) : t < t1 ? x0 + v0 * ((t - t0) - (t - t0) * (t - t0) / (2 * (t1 - t0))) : STAGE.cartR7;
});
const cartX = lt => CARTf()(lt);
/* Stateman: shadows her steps, turns his head late, ambles after her, stands at the first handset in ROOM 4 */
const STXa = lazy(() => {
  const f = wordT('n1', 'followed', 2.54), e = wordT('n1', 'everywhere', 3.0), w = CUE.whoosh;
  return pchip([
    [0, STAGE.stMed], [f + .1, STAGE.stMed], [f + .42, STAGE.stMed - 34], [e + .15, STAGE.stMed - 34], [e + .5, STAGE.stMed], [w + .75, STAGE.stMed],
    [w + 1.2, STAGE.stMed + 24], [bs('k1') - .3, STAGE.stR4], [CUT.st3, STAGE.stR4],
  ]);
});
/* after the cut: at the cart in ROOM 7, then (hidden by the macro) across to the shower room */
const STXb = lazy(() => pchip([[CUT.st3, STAGE.stR7], [CUT.macro0 - .05, STAGE.stR7], [CUT.macro0 + .1, STAGE.stR7], [CUT.macro1 - .1, STAGE.stSH], [bs('b1'), STAGE.stSH]]));
const KXa = lazy(() => {
  const f = wordT('n1', 'followed', 2.54), e = wordT('n1', 'everywhere', 3.0), w = CUE.whoosh;
  return pchip([
    [0, STAGE.kMed], [f + .2, STAGE.kMed], [f + .5, STAGE.kMed - 20], [e + .25, STAGE.kMed - 20], [e + .6, STAGE.kMed], [w + .35, STAGE.kMed],
    [w + 1.1, STAGE.kMed + 90], [w + 1.9, STAGE.kR4 - 40], [w + 2.15, STAGE.kR4], [CUT.st3, STAGE.kR4],
  ]);
});
const KXb = lazy(() => pchip([[CUT.st3, STAGE.kR7], [CUT.macro0 + .1, STAGE.kR7], [CUT.macro1 - .1, STAGE.kSH], [bs('b1'), STAGE.kSH]]));
/* Banana: in ROOM 4 on his walker until the pen scene is over, then (hidden by the cuts) past the armchair to the arch */
const BXf = lazy(() => pchip([[0, STAGE.banR4], [bs('s2'), STAGE.banR4], [bs('s2') + .6, STAGE.banR4 + 38], [18.0, 665], [bs('slip'), STAGE.banSlip], [CUE.peel, 748], [CUE.boing, 772]]));

// ------------------------------------------------------------------ gait of the runner (phase in CYCLES, so the stride can change without a jump), the cap
const strideAt = sp => lerp(30, 54, sstep(sp, 70, 270));                                  /* half-stride in local units: a stroll, then a sprint */
const sxSpeed = lt => (SX(lt + .03) - SX(lt - .03)) / .06;                                /* px/s */
const churnRate = lt => { const a = CUE.whoosh + .02, b = CUE.whoosh + .34; return lt > a && lt < b ? 4.6 * sstep(lt, a, a + .08) * (1 - sstep(lt, b - .06, b)) : 0; };   /* cycles/s of legs spinning on the spot */
const PHI = lazy(() => {
  const dt = 1 / 120, N = Math.ceil(28 / dt), g = new Float32Array(N + 2); let acc = 0;
  for (let i = 0; i <= N; i++) { const t = i * dt, v = Math.abs(sxSpeed(t)); acc += Math.max(v / S / (4 * strideAt(v)), churnRate(t)) * dt; g[i] = acc; }
  g[N + 1] = g[N];
  return t => { const f = Math.max(0, t) / dt, i = Math.min(N, Math.floor(f)), u = f - i; return g[i] * (1 - u) + g[i + 1] * u; };
});
const smoothSpeed = lt => { let a = 0; for (let i = 0; i < 6; i++) a += Math.abs(sxSpeed(lt - i * .03)); return a / 6; };

// ------------------------------------------------------------------ small acting helpers
const gazeTo = (o, tx, ty = 0, rx = 90) => [Math.max(-1, Math.min(1, (tx - o.x) / rx)), Math.max(-.8, Math.min(.8, ty / 80))];
/* where a hand ends up in world px, for a grip target in the character's local units */
const handW = (o, g) => H6.localToScreen(o, g[0], g[1]);
/* a grip target (local units) for a world point, kept within reach of the shoulder */
function gripAt(o, side, wx, wy, frac = .94) {
  const k = KINDS[o.kind], sh = (k.shape === 'straw' ? [side * k.rx * .88, -k.ry * .1] : [side * k.rx * .92, k.ry * .1]), [u, v] = localOf(o, wx, wy);
  const reach = ((k.arm1 || 56) + (k.arm2 || 52)) * (o.armScale || 1.12) * frac, dx = u - sh[0], dy = v - sh[1], d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d);
  return [sh[0] + dx * f, sh[1] + dy * f];
}

// ------------------------------------------------------------------ Strawberry
function strawO(lt) {
  const w0 = CUE.whoosh, x = SX(lt), v = sxSpeed(lt), av = Math.abs(v), t = lt, c1 = CUE.ding1, c2 = CUE.ding2, c3 = CUE.ding3, h = bs('run') + 3.52;
  const running = lt >= w0 - .05 && lt < h + .05;
  const ant = sstep(lt, bs('s1') + .1, w0) * (1 - sstep(lt, w0, w0 + .06));                /* the crouch on "Run." */
  const snap = sstep(lt, w0, w0 + .1) * (1 - sstep(lt, w0 + .3, w0 + .55));               /* stretched while the legs spin, then the launch */
  const speedN = c01(av / 330);
  const hk = lt >= h ? Math.sin(c01((lt - h) / .42) * PI) * Math.exp(-(lt - h) * 3) : 0;
  const near = d => Math.exp(-Math.pow((lt - d) / .07, 2));
  const brace = Math.max(near(c1 - .1), near(c2 - .1), near(c3 - .1)), kick = Math.max(near(c1 + .1), near(c2 + .1), near(c3 + .1));
  const pant = lt > h ? Math.exp(-(lt - h) / 1.6) * .028 * Math.sin((lt - h) * 11) : 0;                /* out of breath */
  let squash = .1 * ant - .1 * snap - .035 * speedN + .06 * brace - .05 * kick + .13 * hk + pant;
  let rot = .3 * snap + .16 * speedN * (1 - snap) - .1 * hk + .05 * ant;
  let expr = 'dead', lid = .42, look = [.2, .15], arms = { l: 'rest', r: 'rest' }, grip, hand, face, acc;
  const ph = PHI()(lt), p0 = { x, y: FL, s: S };
  const placeW = (tc, tx, ty) => sstep(lt, tc - .17, tc - .02) * (1 - sstep(lt, tc + .05, tc + .22));   /* 0..1: the hand is out at the target */
  if (lt < bs('s1')) {
    // n1: working at the cart, hands busy, one glance at the surveyor
    const tw = lt * 1.3;
    arms = { l: 'hold', r: 'hold' };
    grip = { l: [-46 + 4 * Math.sin(tw * 1.4), 34 + 5 * Math.sin(tw * 1.9)], r: [128 + 7 * Math.sin(tw * 2.1), 12 + 7 * Math.sin(tw * 1.3 + 1)] };
    look = vtrack([[0, [.55, .5]], [bs('st1') + .1, [.55, .45]], [bs('st1') + .6, [-.7, .05]], [bs('st1') + 1.75, [-.7, .05]], [bs('s1') - .05, [-.1, .0]]])(lt);
    hand = { l: 'grip', r: 'open' };
  } else if (lt < w0 + .3) {
    look = [0, 0]; arms = { l: 'rest', r: lt > w0 ? 'hold' : 'rest' };
    if (lt > w0) { grip = { r: [128, 18] }; hand = { r: 'grip' }; }                       /* a fist on the cart handle */
  } else if (running) {
    // the run: hands pump at her sides; at each ding the right hand shoots out to the handset's place
    const sw = Math.sin(ph * TAU), pr = Math.sin(ph * TAU + 1.2), bw = [[c1, STAGE.light1], [c2, STAGE.light2], [c3, STAGE.light3]];
    arms = { l: 'hold', r: 'hold' };
    const swing = { l: [-86, 6 + 28 * sw], r: [86, 6 - 28 * sw] };
    grip = { l: swing.l, r: swing.r };
    for (const [tc, L] of bw) {
      const k = placeW(tc, L[0], L[1]);
      if (k > 0) { const tg = gripAt(Object.assign({}, p0, { kind: 'straw', lift: 0 }), 1, L[0], FL - L[1]); grip.r = [lerp(swing.r[0], tg[0], k), lerp(swing.r[1], tg[1], k)]; hand = { r: 'open' }; }
    }
    look = lt < c1 - .3 ? [.5, .1] : lt < c2 - .3 ? [.45, .2] : lt < c3 - .3 ? [.45, .1] : [.4, .0];
    void pr;
  } else {
    arms = { l: 'none', r: 'none' }; expr = 'hopeful'; lid = 0; acc = ['steth', 'bandage7', 'perdiem9', 'sweat'];       /* hands behind her back, out of breath, innocent */
    look = vtrack([[h, [-.1, .0]], [h + .7, [-.8, .05]], [h + 1.3, [-.3, -.3]], [h + 2.0, [-.8, .05]], [h + 3, [-.6, 0]]])(Math.min(lt, h + 3));
    const d = dart(lt, 5, .3); look = [look[0] + d[0] * .3, look[1] + d[1] * .3];
  }
  const sp = Math.abs(v), A = strideAt(sp), moving = sp / S > 9 || churnRate(lt) > 0;
  const o = A11.straw({ x, y: FL, s: S, t, expr, lid, look, arms, grip, hand, plant: true, squash, rot, cap: lt < w0 + .12 || lt > h + .75, stride: A });
  if (acc) o.acc = acc;
  if (moving) { o.gaitW = ph * 4 * A; o.axis = 'x'; o.dir = Math.sign(v) || 1; o.vx = v; }
  if (face) o.face = face;
  return o;
}

// ------------------------------------------------------------------ the observers
function stateO(lt) {
  const fn = t => [STXf()(t), FL];
  const o0 = { x: STXf()(lt), y: FL };
  const w = CUE.whoosh;
  let look = lt < w ? gazeTo(o0, SX(lt - .15), 40) : lt < bs('k1') ? gazeTo(o0, SX(lt - .55), 40) : gazeTo(o0, lt < bs('st2') ? STAGE.light1[0] : SX(lt), 20);
  const wr = lt < bs('st1') - .2 ? sstep(lt, bs('n1') + .3, bs('n1') + .6) * .7 : 0;
  const extra = { s: S, t: lt, look, writing: wr, pose: wr > .1 ? 'write' : 'carry', stride: 38 };
  if (lt >= bs('st2') - .05 && lt < bs('st3') + 1.5) extra.expr = 'stateman_brow';
  return S14.walk(A14.stateman, fn, lt, extra);
}
function kumO(lt) {
  const fn = t => [KXf()(t), FL];
  const o0 = { x: KXf()(lt), y: FL };
  const w = CUE.whoosh;
  const look = lt < bs('k1') ? gazeTo(o0, lt < w ? SX(lt - .3) : lt < w + 2.2 ? SX(lt - .5) : STAGE.light1[0], 30) : gazeTo(o0, STXf()(lt), 70);
  const run = lt > w + .35 && lt < w + 2.2;
  const extra = { s: KS, t: lt, look, pose: run ? 'hug' : 'write', writing: run ? 0 : .6, tongue: run ? 0 : .8, expr: run ? 'kum_puzzled' : 'kum_eager', stride: 32 };
  return run ? S14.run(A14.kumquat, fn, lt, extra, 480) : S14.walk(A14.kumquat, fn, lt, extra);
}

// ------------------------------------------------------------------ residents
function banO(lt) {
  const fn = t => [STAGE.banR4, FL];
  const react = lt > CUE.ding1 ? Math.exp(-(lt - CUE.ding1) / .6) : 0;
  return S14.walk(A7.banana, fn, lt, { s: S, t: lt, expr: lt > CUE.ding1 && lt < CUE.ding1 + 1.2 ? 'shock' : 'happy', look: lt < CUE.ding1 ? [.3, .1] : [.5 - .3 * (1 - react), .2], arms: { l: 'hold', r: 'hold' }, grip: { l: [-70, 70], r: [95, 70] }, hold: { l: 'fp14t_walker' }, hand: { l: 'grip', r: 'grip' } });
}
function cranO(lt) {
  const fn = t => [STAGE.cranR7, FL];
  const look = lt < CUE.ding2 ? [.2, .1] : lt < CUE.ding2 + 1 ? [.8, .1] : [.5, .1];
  return S14.walk(A7.cran, fn, lt, { s: S, t: lt, expr: lt > CUE.ding2 && lt < CUE.ding2 + .8 ? 'shock' : 'happy', look });
}

// ------------------------------------------------------------------ the camera: a list of shots, each a function of scene-local time returning [cx, cy, z, roll]
const cyFor = (z, fy = 1270) => FL - (fy - 960) / z;                                      /* the camera centre that puts the floor line at screen y = fy */
const camFloor = (cx, z, fy) => [cx, cyFor(z, fy), z, 0];
const camFace = (o, z, up = 230) => { const [fx, fy] = faceC(o); return [fx, fy + up / z, z, 0]; };
const expK = (a, b, k) => a * Math.pow(b / a, k);                                         /* zoom in log space */
const mixCam = (a, b, e) => [lerp(a[0], b[0], e), lerp(a[1], b[1], e), expK(a[2], b[2], e), lerp(a[3], b[3], e)];
const SHOTS = [
  { id: 'wide', t0: 0, t1: .2, cam: lt => [540, 960, 1, 0] },
  { id: 'dive', t0: .2, t1: .9, cam: lt => mixCam([540, 960, 1, 0], camFloor(262, 2.1), easeIO(seg(lt, .2, .9))) },
  { id: 'n1', t0: .9, t1: 3.9, cam: lt => mixCam(camFloor(262, 2.1), camFloor(250, 2.22), easeIO(seg(lt, .9, 3.9))) },
  { id: 'st1', t0: 3.9, t1: 6.1, cam: lt => mixCam(camFloor(250, 2.22), camFloor(238, 2.4), easeIO(seg(lt, 3.9, 6.1))) },
  { id: 'snap', t0: 6.1, t1: 6.66, cam: lt => mixCam(camFloor(238, 2.4), camFace(strawO(lt), 3.0, 250), easeOut(seg(lt, 6.1, 6.34))) },
  { id: 'run', t0: 6.66, t1: 9.95, cam: lt => { const k = easeOut(seg(lt, 6.66, 7.2)), a = camFace(strawO(lt), 3.0, 250), b = camFloor(SX(lt - .1) + 110, 1.8, 1240); return mixCam(a, b, k); } },
  { id: 'two', t0: 9.95, t1: 99, cam: lt => { const k = easeIO(seg(lt, 9.95, 10.5)); return mixCam(camFloor(SX(9.85) + 110, 1.8, 1240), camFloor(540, 2.1), k); } },
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
  ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-44, -70); ctx.lineTo(-60, -70); ctx.lineTo(-60, -46); ctx.stroke();
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
  { at: () => CUE.ding1, x: () => STAGE.light1[0], y: () => FL - STAGE.light1[1], rot: .05 },
  { at: () => CUE.ding2, x: () => STAGE.light2[0], y: () => FL - STAGE.light2[1], rot: -.08 },
  { at: () => CUE.ding3, x: () => STAGE.light3[0], y: () => FL - STAGE.light3[1], rot: 0 },
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
const cartRattle = lt => { const t0 = CUE.whoosh + .4, t1 = CUE.whoosh + 3.3, u = c01((lt - t0) / (t1 - t0)); return lt > CUE.whoosh + .3 && u < 1 ? .4 + .6 * (1 - u) : 0; };

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
  cam(lt) { const D = window.TR_DEBUG; if (D) { zoomTo(D.cx, D.cy, D.z); CAM.r = 0; return; } const [cx, cy, z, r] = shotAt(lt).cam(lt); zoomTo(cx, cy, z); CAM.r = r; },
  draw(lt) { if (window.TR_DEBUG && window.TR_DEBUG.nocast) { V2.setLight({}); S14.back(lt, { t: lt }); S14.front(lt, { t: lt }); return; } drawWorld(lt, shotAt(lt)); },
  fx: lt => ({ bloom: .45, vignette: .36, grain: .05, contrast: .14, sat: .1 }),
  blur: lt => (lt > .2 && lt < .95) || (lt > CUE.whoosh - .1 && lt < bs('run') + 3.7) ? 3 : 1,
  over(lt) { hudTag(lt); hudTally(lt); },
};
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.tracer = SC;
})();
