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
  sMed: 202, stMed: 116, kMed: 72, cartMed: 264,
  // the three call lights: where the handset lands (x, px above the floor) and where her hand is when it does (no. 3 sits on the left jamb of the shower door, whose leaf is x 890..978)
  light1: [402, 64], light2: [640, 62], light3: [880, 70],
  contact1: 346, hurdle: [8.46, 9.02], contact3: 796, halt: 826,
  // residents (the armchair is fixed by the kit: centre 626, cushion 50 px above the floor)
  banR4: 424, cranR7: 626, seatY: 50,
  // the pen scene at the cart (ROOM 7), then the group relocates LEFT while the macro hides it (the armchair is empty: Mrs. Cranberry has gone), Banana arrives on the right and slips, a cut
  // to the door shot hides their last regrouping. Nobody ever crosses anybody else in a visible frame.
  stR4: 340, kR4: 400, stR7: 738, kR7: 790, sR7: 852, cartR7: 702,
  stSL: 515, kSL: 562, sSL: 708, sHaul: 805, banSlip: 810, banLand: 896,
  stDoor: 690, kDoor: 758, sDoor: 828, sKnob: 828,
};
const CUT = { st3: 13.184, macro0: 16.294, macro1: 17.793, door: 22.976 };             /* hard cuts hide the observers' relocations (scene-local seconds) */

// ------------------------------------------------------------------ paths in world x (the feet are always on the floor line)
/* Strawberry: the shadow-step gag in n1, the churn, then dash - stop at ROOM 4 - hurdle the armchair - stop at the wall - halt, then inch to the cart's other side */
const SXf = lazy(() => {
  const f = wordT('n1', 'followed', 2.54), e = wordT('n1', 'everywhere', 3.0), w = CUE.whoosh, c1 = CUE.ding1, c2 = CUE.ding2, c3 = CUE.ding3, h = bs('run') + 3.52;
  const [h0, h1] = STAGE.hurdle;
  return pchip([
    [0, STAGE.sMed], [f, STAGE.sMed], [f + .3, STAGE.sMed - 30], [e + .05, STAGE.sMed - 30], [e + .4, STAGE.sMed],
    [w + .3, STAGE.sMed - 4], [w + .31, STAGE.sMed - 4],                                  /* held by the squash while the legs spin */
    [w + .55, STAGE.sMed + 52], [w + .8, STAGE.sMed + 110], [c1 - .22, STAGE.contact1 - 18], [c1 - .05, STAGE.contact1 - 6], [c1 + .05, STAGE.contact1],
    [c1 + .12, STAGE.contact1 + 14], [c1 + .28, STAGE.contact1 + 110], [h0 - .15, 548], [h0, 574], [c2, 626], [h1, 682], [h1 + .2, 738],
    [c3 - .1, STAGE.contact3 - 10], [c3 + .05, STAGE.contact3],
    [h - .1, STAGE.halt - 4], [h + .15, STAGE.halt + 6], [h + .45, STAGE.halt],
    [CUT.st3, STAGE.sR7], [CUT.macro0 + .05, STAGE.sR7], [CUT.macro1 - .1, STAGE.sSL], [bs('st5') + .1, STAGE.sSL], [bs('s4') - .35, STAGE.sHaul], [CUT.door, STAGE.sHaul],
  ]);
});
const SXb = lazy(() => pchip([[CUT.door, STAGE.sDoor], [30, STAGE.sDoor]]));            /* at the door she stands still: only her arm moves, to the knob on "Open it." */
const SX = lt => lt < CUT.door ? SXf()(lt) : SXb()(lt);
/* the arc of the hurdle: 0 outside it, 4u(1-u) inside, in px of lift */
const hurdleLift = lt => { const [a, b] = STAGE.hurdle; return lt > a && lt < b ? 100 * 4 * ((lt - a) / (b - a)) * (1 - (lt - a) / (b - a)) : 0; };
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
    [0, STAGE.stMed], [f + .04, STAGE.stMed], [f + .36, STAGE.stMed - 28], [e + .1, STAGE.stMed - 28], [e + .46, STAGE.stMed], [w + .75, STAGE.stMed],
    [w + 1.2, STAGE.stMed + 24], [bs('k1') - .3, STAGE.stR4], [CUT.st3, STAGE.stR4],
  ]);
});
/* after the cut: at the cart in ROOM 7, then (hidden by the macro) to the left of the slip; after the door cut he is beside Strawberry again */
const STXb = lazy(() => pchip([[CUT.st3, STAGE.stR7], [CUT.macro0 + .1, STAGE.stR7], [CUT.macro1 - .1, STAGE.stSL], [CUT.door, STAGE.stSL]]));
const STXc = lazy(() => pchip([[CUT.door, STAGE.stDoor], [30, STAGE.stDoor]]));
const stFn = lt => lt < CUT.st3 ? STXa() : lt < CUT.door ? STXb() : STXc();
const KXa = lazy(() => {
  const f = wordT('n1', 'followed', 2.54), e = wordT('n1', 'everywhere', 3.0), w = CUE.whoosh;
  return pchip([
    [0, STAGE.kMed], [f + .2, STAGE.kMed], [f + .5, STAGE.kMed - 20], [e + .25, STAGE.kMed - 20], [e + .6, STAGE.kMed], [w + .35, STAGE.kMed],
    [w + 1.1, STAGE.kMed + 90], [w + 1.9, STAGE.kR4 - 40], [w + 2.15, STAGE.kR4], [CUT.st3, STAGE.kR4],
  ]);
});
const KXb = lazy(() => pchip([[CUT.st3, STAGE.kR7], [CUT.macro0 + .1, STAGE.kR7], [CUT.macro1 - .1, STAGE.kSL], [CUT.door, STAGE.kSL]]));
const KXc = lazy(() => pchip([[CUT.door, STAGE.kDoor], [30, STAGE.kDoor]]));
const kFn = lt => lt < CUT.st3 ? KXa() : lt < CUT.door ? KXb() : KXc();
/* Banana: in ROOM 4 on his walker until the pen scene is over, then (hidden by the cuts) on his way to the arch, where he slips */
const BXf = lazy(() => pchip([[0, STAGE.banR4], [bs('s2'), STAGE.banR4], [CUT.macro0, STAGE.banR4 + 30], [CUT.macro1 - .2, STAGE.banSlip - 15], [18.3, STAGE.banSlip - 8], [bs('slip'), STAGE.banSlip], [CUE.peel, STAGE.banSlip + 19], [CUE.boing, STAGE.banSlip + 41]]));
const warp = x => x + .7 * Math.sin(2 * PI * x) / (2 * PI);                              /* the time-warp: the arc crawls at the top (copied from ep13_cross.js) */
const FLY = { lift: 124 };

// ------------------------------------------------------------------ gait of the runner (phase in CYCLES, so the stride can change without a jump), the cap
const strideAt = sp => lerp(30, 54, sstep(sp, 70, 270));                                  /* half-stride in local units: a stroll, then a sprint */
const sxSpeed = lt => Math.abs(lt - CUT.door) < .04 ? 0 : (SX(lt + .03) - SX(lt - .03)) / .06;   /* px/s (zero across the cut) */
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
const FACE = { x: 0 };
function strawO(lt) {
  const w0 = CUE.whoosh, x = SX(lt), v = sxSpeed(lt), av = Math.abs(v), t = lt, c1 = CUE.ding1, c2 = CUE.ding2, c3 = CUE.ding3, h = bs('run') + 3.52;
  const [h0, h1] = STAGE.hurdle, lift = hurdleLift(lt), air = lift > 6, running = lt >= w0 - .05 && lt < h + .05;
  const ant = sstep(lt, bs('s1') + .1, w0) * (1 - sstep(lt, w0, w0 + .06));                /* the crouch on "Run." */
  const snap = sstep(lt, w0, w0 + .1) * (1 - sstep(lt, w0 + .3, w0 + .55));               /* stretched while the legs spin, then the launch */
  const speedN = c01(av / 330);
  const hk = lt >= h ? Math.sin(c01((lt - h) / .42) * PI) * Math.exp(-(lt - h) * 3) : 0;
  const near = d => Math.exp(-Math.pow((lt - d) / .07, 2));
  const brace = Math.max(near(c1 - .1), near(c3 - .1)), kick = Math.max(near(c1 + .1), near(c3 + .1));
  const pant = lt > h && lt < bs('s3') ? Math.exp(-(lt - h) / 1.8) * .028 * Math.sin((lt - h) * 11) : 0;       /* out of breath */
  const hq = sstep(lt, h0 - .1, h0 + .05) * (1 - sstep(lt, h1 - .05, h1 + .12));           /* 0..1: in the hurdle */
  const land = near(h1 + .05), takeoff = near(h0 + .02);
  let squash = .1 * ant - .1 * snap - .035 * speedN + .06 * brace - .05 * kick + .13 * hk + pant - .1 * takeoff + .15 * land - .05 * hq;
  let rot = .14 * snap + .16 * speedN * (1 - snap) - .1 * hk + .05 * ant + .1 * hq;
  let expr = 'dead', lid = .42, look = [.2, .15], arms = { l: 'rest', r: 'rest' }, grip, hand, acc, legs;
  const ph = PHI()(lt), p0 = { kind: 'straw', x, y: FL, s: S, lift: 0 };
  const placeW = tc => sstep(lt, tc - .17, tc - .02) * (1 - sstep(lt, tc + .05, tc + .22));   /* 0..1: the hand is out at the target */
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
    // the run: hands pump at her sides; the right hand shoots out at the handsets' places; over the armchair the left arm goes up for balance and the handset is tossed
    const sw = Math.sin(ph * TAU);
    arms = { l: 'hold', r: 'hold' };
    const swing = { l: [-86, 6 + 28 * sw], r: [86, 6 - 28 * sw] };
    grip = { l: swing.l.slice(), r: swing.r.slice() };
    for (const [tc, L] of [[c1, STAGE.light1], [c3, STAGE.light3]]) {
      const k = placeW(tc);
      if (k > 0) { const tg = gripAt(p0, 1, L[0], FL - L[1]); grip.r = [lerp(swing.r[0], tg[0], k), lerp(swing.r[1], tg[1], k)]; hand = { r: 'open' }; }
    }
    if (hq > 0) { grip.l = [lerp(swing.l[0], -92, hq), lerp(swing.l[1], -92, hq)]; const tk = sstep(lt, c2 - .2, c2 - .02) * (1 - sstep(lt, c2 + .08, c2 + .2)); grip.r = [lerp(swing.r[0], 150, hq), lerp(swing.r[1], lerp(-20, 30, tk), hq)]; }
    look = hq > .3 ? [.3, .6] : lt < c1 - .3 ? [.5, .1] : lt < h0 ? [.45, .2] : [.4, .0];
    if (air) legs = 'splay';
  } else {
    arms = { l: 'none', r: 'none' }; expr = 'hopeful'; lid = 0; acc = ['steth', 'bandage7', 'perdiem9', 'sweat'];     /* hands behind her back, out of breath, innocent */
    look = vtrack([[h, [-.1, .0]], [h + .7, [-.8, .05]], [h + 1.3, [-.3, -.3]], [h + 2.0, [-.8, .05]], [h + 3, [-.6, 0]]])(Math.min(lt, h + 3));
    const d = dart(lt, 5, .3); look = [look[0] + d[0] * .3, look[1] + d[1] * .3];
    if (lt >= bs('s2')) { expr = 'dead'; lid = .5; acc = undefined; look = [-.7, .1]; }
    if (lt >= bs('s3')) { look = vtrack([[bs('s3'), [0, .05]], [be('s3'), [.05, .18]]])(Math.min(lt, be('s3'))); lid = .55; }
    const bst = banState(lt);
    if (lt >= bs('slip') && lt < BAN.land + .1) { look = [Math.max(-1, Math.min(1, (bst.x - x) / 90)), Math.max(-.8, Math.min(.5, -bst.lift / 90))]; lid = .38; }   /* only her eyes follow him up and over */
    if (lt >= BAN.land + .1 && lt < CUT.door) { look = [-.9, .05]; lid = .45; }                                                                  /* eye contact with Stateman */
    if (lt >= BAN.haul0 - .45 && lt < BAN.haul1 + .35) {                                                                                         /* the haul: one hand on the walker's top rail, her eyes never leave him */
      const wk = walkerPose(lt), k = sstep(lt, BAN.haul0 - .45, BAN.haul0 - .1) * (1 - sstep(lt, BAN.haul1 + .05, BAN.haul1 + .3));
      if (wk && k > 0) { const d2 = 72 * S, rx = wk.x + Math.sin(wk.rot) * d2, ry = wk.y - Math.cos(wk.rot) * d2, tg = gripAt(p0, 1, rx, ry); arms = { l: 'none', r: 'hold' }; grip = { r: [lerp(86, tg[0], k), lerp(6, tg[1], k)] }; hand = { r: 'grip' }; }
      const pull = sstep(lt, BAN.haul0 - .1, BAN.haul0 + .25) * (1 - sstep(lt, BAN.haul1 - .1, BAN.haul1 + .1));
      rot += -.1 * pull; squash += .04 * pull;
    }
    if (lt >= CUT.door) {                                                                                                                      /* at the door */
      look = lt < bs('s5') ? [-.85, .05] : lt < bs('st7') ? [0, 0] : [.95, .1]; lid = .42; expr = 'dead';
      const kn = SDOOR(lt).knob, k = sstep(lt, bs('st7') + .1, bs('st7') + .6);
      if (k > 0) { const tg = gripAt(p0, 1, kn[0] - 2, kn[1] - 6.5, .98); arms = { l: 'none', r: 'hold' }; grip = { r: [lerp(86, tg[0], k), lerp(10, tg[1], k)] }; hand = { r: 'grip' }; }
    }
  }
  const sp = Math.abs(v), A = strideAt(sp), moving = (sp / S > 9 || churnRate(lt) > 0) && !air;
  const o = A11.straw({ x, y: FL, s: S, t, expr, lid, look, arms, grip, hand, plant: true, squash, rot, lift, legs, cap: lt < w0 + .12 || lt > h + .75, stride: A });
  if (acc) o.acc = acc;
  if (lt >= bs('s3') && lt < bs('slip')) o.face = { pup: .55 };                           /* the thousand-yard stare */
  if (moving) { o.gaitW = ph * 4 * A; o.axis = 'x'; o.dir = Math.sign(v) || 1; o.vx = v; }
  if (av > 150 || air || (lt > h0 - .2 && lt < h1 + .15)) o.transit = true;                                               /* a whip pass: a blur crossing a neighbour is not a covered face */
  return o;
}

// ------------------------------------------------------------------ residents
/* ---- Mr. Banana: the walker, the peel, the slip, the long slow flight, the landing on his back, the thumb, the haul. All of it a pure function of time. */
const BAN = {
  get peel() { return CUE.peel; }, get boing() { return CUE.boing; }, get land() { return bs('b1'); }, get haul0() { return bs('s4') + .12; }, get haul1() { return bs('s4') + .72; },
};
const banDrop = () => (KINDS.banana.leg + KINDS.banana.ry * .9 - KINDS.banana.rx * .86) * S;       /* a body lying down: its centre sinks to half its thickness */
function banState(lt) {
  const { peel, boing, land, haul0, haul1 } = BAN;
  const st = { x: 0, lift: 0, rot: 0, squash: 0, phase: 'walk', flying: false };
  if (lt < boing) {
    st.x = BXf()(lt);
    if (lt >= peel) { const u = c01((lt - peel) / (boing - peel)); st.rot = .26 * sstep(u, 0, .5) + .09 * Math.sin(u * 20) * (1 - u); st.phase = 'wobble'; st.lift = 6 * Math.sin(u * 9); }
  } else if (lt < land) {
    const tau = c01((lt - boing) / (land - boing)), wt = warp(tau);
    st.x = lerp(STAGE.banSlip + 41, STAGE.banLand, wt); st.lift = FLY.lift * 4 * wt * (1 - wt); st.rot = lerp(.26, 1.55, easeIO(wt)); st.phase = 'fly'; st.flying = true;
  } else if (lt < haul0) {
    const b = lt - land, bounce = b < .4 ? Math.abs(Math.sin(b / .4 * PI)) * 30 * Math.exp(-b * 4.5) : 0;
    st.x = STAGE.banLand; st.rot = 1.55 + .03 * Math.sin(lt * 7) * Math.exp(-b * 2.5); st.lift = -banDrop() + bounce; st.squash = b < .12 ? .14 * (1 - b / .12) : 0; st.phase = 'lie';
  } else if (lt < haul1) {
    const u = c01((lt - haul0) / (haul1 - haul0)), e = easeBack(u);
    st.x = STAGE.banLand; st.rot = 1.55 * (1 - e); st.lift = -banDrop() * (1 - easeOut(u)) + 54 * Math.sin(u * PI); st.squash = u > .85 ? .1 * Math.sin((u - .85) / .15 * PI) : 0; st.phase = 'haul';
  } else {
    // standing again, happy; the cut to the door shot leaves him behind (banO returns null from then on)
    st.x = STAGE.banLand; st.phase = 'stand'; st.squash = lt < haul1 + .3 ? .08 * Math.sin((lt - haul1) / .3 * PI) * Math.exp(-(lt - haul1) * 4) : 0;
  }
  return st;
}
function banO(lt) {
  if (lt >= CUT.door) return null;                                                      /* the door shot is the group at the shower room; Banana has been left behind by the cut */
  const bst = banState(lt), { peel, boing, land, haul0, haul1 } = BAN, d1 = lt - CUE.ding1;
  const held = bst.phase === 'walk' || bst.phase === 'wobble' || bst.phase === 'stand';
  const fnb = t => [lt >= land ? bst.x : BXf()(Math.min(t, boing)), FL];
  const o = S14.walk(A7.banana, fnb, lt, { s: S, t: lt });
  o.x = bst.x; o.lift = (o.lift || 0) + bst.lift; o.rot = bst.rot; o.squash = bst.squash; o.plant = true;
  if (bst.phase === 'wobble' || bst.phase === 'fly') o.legs = 'splay';
  if (bst.phase === 'lie' || bst.phase === 'haul' || bst.phase === 'fly') { o.noShadow = bst.phase !== 'haul'; o.noReflect = true; delete o.gaitW; delete o.axis; delete o.vx; }
  // faces and arms
  if (held) {
    Object.assign(o, { arms: { l: 'hold', r: 'hold' }, grip: { l: [-70, 70], r: [95, 70] }, hold: { l: 'fp14t_walker' }, hand: { l: 'grip', r: 'grip' },
      pend1: lt >= CUE.ding1 ? { age: d1, led: .75 + .25 * Math.sin(lt * 7) } : null, walkerPeel: lt < peel ? { hang: true } : null });
    o.expr = bst.phase === 'wobble' ? 'panic' : bst.phase === 'stand' ? 'happy' : d1 > 0 && d1 < 1.2 ? 'shock' : 'happy';
    o.look = bst.phase === 'wobble' ? [0, .6] : lt < CUE.ding1 ? [.3, .1] : lt < bs('s2') ? [.1 + .4 * Math.exp(-d1 / .6), .35] : bst.phase === 'stand' ? [.4, .1] : [.6, .1];
    if (bst.phase === 'wobble') { o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: [-70 + 12 * Math.sin(lt * 33), 70 + 8 * Math.sin(lt * 29)], r: [95 + 12 * Math.sin(lt * 31), 70 + 8 * Math.cos(lt * 27)] }; }
  } else if (bst.phase === 'fly') {
    o.expr = 'panic'; o.look = [-.3, -.4]; o.arms = { l: 'flail', r: 'flail' }; o.hold = undefined; o.grip = undefined;
  } else {
    // on his back, then hauled up: the right hand gives a thumbs up toward the sky (grip target chosen in the body's frame so the thumb points up in the world)
    const up = bst.phase === 'lie' ? 1 : 1 - sstep(lt, haul0 - .05, haul0 + .25);
    o.expr = lt < land + .25 ? 'panic' : 'happy'; o.look = [-.1, .5]; o.lid = lt > land + .3 ? 0 : undefined;
    o.arms = { l: up > .3 ? 'hold' : 'rest', r: 'rest' };
    if (up > .3) { o.grip = { l: [-66, lerp(60, 112, up)] }; o.hand = { l: 'thumb' }; }
    if (bst.phase === 'haul') { o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: [-70, 70], r: [95, 70] }; o.hand = { l: 'grip', r: 'grip' }; }
  }
  return o;
}
function cranO(lt) {
  const y = FL - STAGE.seatY - 4, d2 = lt - CUE.ding2;
  if (lt >= CUT.macro0) return null;                                                     /* she has left the armchair while the macro was on (the chair stays) */
  const look = lt < CUE.ding2 - .2 ? [.2, .1] : lt < CUE.ding2 + 1.1 ? [.2, .5] : lt < CUE.ding3 + .8 ? [.55, .05] : [.4 + .2 * Math.sin(lt * .8), .05];
  const o = S14.walk(A7.cran, t => [STAGE.cranR7, y], lt, { s: S, t: lt, noLegs: true, noShadow: true, noReflect: true, expr: d2 > 0 && d2 < .9 ? 'shock' : 'happy', look, arms: { l: 'rest', r: 'rest' }, sway: .015 * Math.sin(lt * 1.3) });
  return o;
}
/* the walker on its own: detached at the boing, spinning once through the air, landing across him, then lifted by Strawberry's hand until his fists close on it again */
function walkerPose(lt) {
  const { boing, land, haul0, haul1 } = BAN, bx0 = STAGE.banSlip + 41, up = [bx0 + 5, FL - 32];
  if (lt < boing) return null;
  const rest = [STAGE.banLand + 14, FL - 66, .42];
  if (lt < land) { const u = c01((lt - boing) / (land - boing)), e = easeOut(u); return { x: lerp(up[0], rest[0] + 8, e), y: lerp(up[1], rest[1], u * u) - 150 * 4 * u * (1 - u) * (1 - u * .3), rot: lerp(0, rest[2] + TAU, e) }; }
  if (lt < haul0) return { x: rest[0], y: rest[1], rot: rest[2] };
  if (lt < haul1) { const u = easeIO(c01((lt - haul0) / (haul1 - haul0))), fx = STAGE.banLand + 5, fy = FL - 32; return { x: lerp(rest[0], fx, u), y: lerp(rest[1], fy, u) - 40 * Math.sin(u * PI), rot: lerp(rest[2], 0, u) }; }
  return null;
}
function drawWalkerFree(w) {
  ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.rot); ctx.scale(S, S); ctx.translate(-82, -72); walkerShape(1); ctx.restore();
}
/* the peel: flat, three petals (the shape of ep13_cross.js `peelProp`, flattened for the dollhouse). k scales it; hang draws it draped over a rail instead */
function peelShape(k = 1) {
  ctx.save(); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,24,6,.85)'; ctx.lineWidth = 3.4;
  for (const [a, c0, c1] of [[-.55, '#ffe66a', '#e0b92a'], [.5, '#ffe135', '#d1a81e'], [0, '#fff08a', '#e8c52e']]) {
    ctx.save(); ctx.rotate(a * .55); ctx.fillStyle = V2.grad(0, -10, 0, 8, [[0, c0], [1, c1]]);
    ctx.beginPath(); ctx.moveTo(-44, -2); ctx.quadraticCurveTo(-30, -24, 0, -18); ctx.quadraticCurveTo(34, -14, 56, 0); ctx.quadraticCurveTo(26, 8, 0, 4); ctx.quadraticCurveTo(-28, 8, -44, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = '#6a4a14'; ctx.beginPath(); ctx.arc(-30, -4, 5, 0, TAU); ctx.fill();
  ctx.restore();
}
/* where the peel is: draped on the walker until the peel cue, then dropped under his front foot, flung to the Kumquat at the boing, caught, held up */
function peelPose(lt) {
  const { peel, boing } = BAN, tc = boing + .46, bx = BXf()(Math.min(lt, boing)), kx = STAGE.kSL + 18;
  if (lt < peel) return null;
  if (lt < boing) { const u = c01((lt - peel) / .12); return { x: lerp(bx - 14, bx + 34, u), y: lerp(FL - 52, FL - 5, u * u), rot: lerp(.3, 0, u), k: .5, flat: true }; }
  if (lt < tc) { const u = c01((lt - boing) / (tc - boing)); return { x: lerp(bx + 34, kx, u), y: lerp(FL - 5, FL - 56, u) - 215 * Math.sin(u * PI), rot: -u * 9, k: .5 }; }
  return { held: true, k: .5, rot: -.3 };
}

// ------------------------------------------------------------------ the observers
/* the insulin pen Stateman holds up (the engine's held-prop hook): a white barrel, an orange cap, a dose window; (0,0) is his fist, the pen rises from it. o.penTilt tilts it */
EXT.prop.fp14t_inspen = (side, o, t) => {
  ctx.save(); ctx.rotate(o.penTilt ?? -.12); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#f3f1ea'; ctx.strokeStyle = INK_; ctx.lineWidth = 2.6; rr(-7, -78, 14, 70, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8892a'; rr(-7.6, -96, 15.2, 22, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#cfe9f5'; ctx.strokeStyle = 'rgba(30,30,50,.8)'; ctx.lineWidth = 1.6; rr(-3.8, -60, 7.6, 16, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a6a86'; ctx.fillRect(-2, -56, 4, 2); ctx.fillRect(-2, -51, 4, 2);
  ctx.fillStyle = '#8f98a8'; ctx.fillRect(-3, -8, 6, 6);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-5, -74, 2, 56);
  ctx.restore();
};
/* the Kumquat's magnifying glass: a brass rim, a pale lens with a glint; (0,0) is his fist, the handle goes up, the lens sits above it */
EXT.prop.fp14t_lens = (side, o, t) => {
  ctx.save(); ctx.rotate(o.lensTilt ?? .25); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -34); ctx.stroke();
  ctx.fillStyle = 'rgba(214,236,250,.55)'; ctx.strokeStyle = '#c9a23a'; ctx.lineWidth = 6; ell(0, -64, 31, 31); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INK_; ctx.lineWidth = 1.6; ell(0, -64, 34.4, 34.4); ctx.stroke(); ell(0, -64, 27.6, 27.6); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(-11, -76, 8, 4.6, -.7); ctx.fill();
  ctx.restore();
};
const SDOOR = lt => S14.showerDoor(ROOMS(lt).shower);                                 /* the closed door in world coordinates: x 890..978, y 790..988, knob [901, 896] */
function stateO(lt) {
  const f = stFn(lt), fn = t => [f(t), FL], x = f(lt), o0 = { x, y: FL };
  const w = CUE.whoosh, k1 = bs('k1'), st2 = bs('st2'), st3 = bs('st3'), s2 = bs('s2'), slip = bs('slip');
  const extra = { s: S, t: lt, stride: 38 };
  let look, wr = 0;
  if (lt < w) { look = gazeTo(o0, SX(lt - .15), 40); wr = lt < bs('st1') - .2 ? sstep(lt, bs('n1') + .3, bs('n1') + .6) * .7 : 0; }
  else if (lt < k1) look = gazeTo(o0, SX(lt - .55), 40);                                  /* he turns his head late */
  else if (lt < st2) look = lt < k1 + .9 ? gazeTo(o0, STAGE.light1[0], 25) : gazeTo(o0, STAGE.halt, 20);
  else if (lt < st3) look = [.85, .05];                                                    /* the long suspicious look across the arch */
  else if (lt < s2) look = lt < wordT('st3', 'pen', 13.54) ? gazeTo(o0, SX(lt), 30) : gazeTo(o0, STAGE.kR7, 40);
  else if (lt < CUT.macro0) look = gazeTo(o0, SX(lt), 40);
  else if (lt < slip) look = gazeTo(o0, SX(lt), 40);                                       /* "It's a long day." he notes it */
  else if (lt < BAN.land) look = gazeTo(o0, banState(lt).x, -20 + 30 * Math.sin(c01((lt - BAN.boing) / (BAN.land - BAN.boing)) * PI), 70);
  else if (lt < bs('st5')) look = gazeTo(o0, STAGE.banLand, 30);
  else if (lt < CUT.door) look = lt < be('st5') ? [.2, .75] : gazeTo(o0, SX(lt), 40);   /* writing, then holding her eye */
  else look = lt < bs('s5') ? [.9, .0] : [.9, .05];
  extra.look = look;
  if (lt >= st2 && lt < s2 + .3) extra.expr = 'stateman_brow';
  if (lt >= BAN.boing && lt < CUT.door) extra.expr = lt < BAN.land + .3 ? 'stateman_alarm' : 'stateman';
  wr = wr || (lt >= bs('st5') - .1 && lt < CUT.door - .05 ? sstep(lt, bs('st5') - .1, bs('st5') + .2) * .85 : 0) || (lt >= bs('s3') && lt < bs('slip') ? .55 : 0);
  extra.pose = wr > .1 ? 'write' : 'carry'; extra.writing = wr;
  if (lt >= st3 && lt < s2 + .15) {                                                          /* the pen: up on "pen", lowered after "date" */
    const up = sstep(lt, wordT('st3', 'pen', 13.54) - .15, wordT('st3', 'pen', 13.54) + .25) * (1 - sstep(lt, be('st3') - .1, s2 + .1));
    Object.assign(extra, { pose: 'free', arms: { l: 'hold', r: 'hold' }, grip: { l: [-72, 72], r: [lerp(84, 100, up), lerp(98, -8, up)] }, hold: { l: 'fp14_clip', r: 'fp14t_inspen' }, hand: { r: 'grip' }, clipAt: [.2, .1], clipRot: -.1, penTilt: -.12 + .06 * Math.sin(lt * 3) * up });
  }
  if (lt >= bs('st6') && lt < bs('s5')) {                                                    /* "What is behind this door?": the pen points at it */
    const pt = sstep(lt, bs('st6') + .1, bs('st6') + .45);
    Object.assign(extra, { pose: 'free', arms: { l: 'hold', r: 'hold' }, grip: { l: [-72, 72], r: [lerp(84, 98, pt), lerp(98, 40, pt)] }, hold: { l: 'fp14_clip', r: 'fp14_pen' }, hand: { r: 'grip' }, clipAt: [.2, .1], clipRot: -.1, penAng: lerp(-1.9, -.35, pt), writing: 0 });
  }
  if (lt >= bs('st7')) extra.noted = seg(lt, bs('st7') + .05, bs('st7') + .75);
  return S14.walk(A14.stateman, fn, lt, extra);
}
function kumO(lt) {
  const f = kFn(lt), fn = t => [f(t), FL], x = f(lt), o0 = { x, y: FL };
  const w = CUE.whoosh, k1 = bs('k1'), st3 = bs('st3'), run = lt > w + .35 && lt < w + 2.2, boing = BAN.boing, tc = boing + .46;
  let look;
  if (lt < k1) look = gazeTo(o0, lt < w ? SX(lt - .3) : lt < w + 2.2 ? SX(lt - .5) : STAGE.light1[0], 30);
  else if (lt < st3) look = lt < bs('st2') ? gazeTo(o0, STAGE.light1[0], 30) : gazeTo(o0, STXa()(lt), 70);
  else if (lt < CUT.macro0) look = gazeTo(o0, STAGE.stR7, 50);
  else if (lt < BAN.peel) look = gazeTo(o0, STXb()(lt), 60);
  else if (lt < tc) { const pp = peelPose(lt); look = pp && !pp.held ? [Math.max(-1, Math.min(1, (pp.x - x) / 60)), Math.max(-.8, Math.min(.8, (pp.y - (FL - 40)) / 60))] : [.6, -.3]; }
  else if (lt < CUT.door) look = [.15, .75];                                                 /* peering at the peel in his hand, then at his board */
  else look = gazeTo(o0, SX(lt), 60);
  const crush = lt >= tc + .5 && lt < CUT.door;
  const extra = { s: KS, t: lt, look, pose: run ? 'hug' : 'write', writing: run ? 0 : .6, tongue: run ? 0 : .8, stride: 32,
    expr: run ? 'kum_puzzled' : lt >= bs('st2') && lt < st3 ? 'kum_puzzled' : crush ? 'kum_puzzled' : 'kum_eager' };
  if (lt >= st3 && lt < bs('s2') + .3) {                                                     /* leaning in with the magnifier */
    const lean = sstep(lt, wordT('st3', 'open', 14.37) - .3, wordT('st3', 'open', 14.37) + .1);
    Object.assign(extra, { pose: 'free', arms: { l: 'hold', r: 'hold' }, grip: { l: [-86, 58], r: [lerp(60, 52, lean), lerp(60, 20, lean)] }, hold: { l: 'fp14_clip', r: 'fp14t_lens' }, hand: { r: 'grip' }, clipAt: [.5, .2], clipRot: .04, writing: 0, tongue: 0, lensTilt: .25 + .1 * Math.sin(lt * 4) * lean, rot: .08 * lean });
  }
  if (lt >= BAN.peel && lt < CUT.door) {                                                     /* the catch: a hop, the free hand up, then the peel held out */
    const hop = Math.sin(c01((lt - (tc - .22)) / .3) * PI), up = sstep(lt, tc - .3, tc - .05), held = lt >= tc ? 1 : 0;
    Object.assign(extra, { pose: 'free', arms: { l: 'hold', r: 'hold' }, grip: { l: [-86, 58], r: [lerp(58, 56, up), lerp(52, held ? 40 : -26, up)] }, hold: { l: 'fp14_clip' }, hand: { r: 'grip' }, clipAt: [.5, .2], clipRot: .04, writing: 0, tongue: 0, lift: 14 * hop, plant: true });
  }
  return run ? S14.run(A14.kumquat, fn, lt, extra, 480) : S14.walk(A14.kumquat, fn, lt, extra);
}

// ------------------------------------------------------------------ the camera: a list of shots, each a function of scene-local time returning [cx, cy, z, roll]; `cu` shots cull neighbours who are cut by the frame
const cyFor = (z, fy = 1270) => FL - (fy - 960) / z;                                      /* the camera centre that puts the floor line at screen y = fy */
const camFloor = (cx, z, fy) => [cx, cyFor(z, fy), z, 0];
const camFace = (o, z, up = 230) => { const [fx, fy] = faceC(o); return [fx, fy + up / z, z, 0]; };
const expK = (a, b, k) => a * Math.pow(b / a, k);                                         /* zoom in log space */
const mixCam = (a, b, e) => [lerp(a[0], b[0], e), lerp(a[1], b[1], e), expK(a[2], b[2], e), lerp(a[3], b[3], e)];
const SHOTS = [
  { id: 'wide', t0: 0, t1: .2, cam: lt => [540, 960, 1, 0] },
  { id: 'dive', t0: .2, t1: .9, cam: lt => mixCam([540, 960, 1, 0], camFloor(278, 2.1), easeIO(seg(lt, .2, .9))) },
  { id: 'n1', t0: .9, t1: 3.9, cam: lt => mixCam(camFloor(278, 2.1), camFloor(266, 2.24), easeIO(seg(lt, .9, 3.9))) },
  { id: 'st1', t0: 3.9, t1: 6.1, cam: lt => mixCam(camFloor(266, 2.24), camFloor(250, 2.4), easeIO(seg(lt, 3.9, 6.1))) },
  { id: 'snap', t0: 6.1, t1: 6.66, cam: lt => { const f = camFace(strawO(lt), 3.0, 250); f[0] -= 8; return mixCam(camFloor(250, 2.4), f, easeOut(seg(lt, 6.1, 6.34))); } },
  { id: 'run', t0: 6.66, t1: 9.95, cam: lt => { const k = easeOut(seg(lt, 6.66, 7.2)), a = camFace(strawO(lt), 3.0, 250), b = camFloor(Math.min(SX(lt - .1) + 110, 850), 1.8, 1240); return mixCam(a, b, k); } },
  { id: 'two', t0: 9.95, t1: 11.816, cam: lt => { const k = easeIO(seg(lt, 9.95, 10.7)); return mixCam(camFloor(Math.min(SX(9.85) + 110, 850), 1.8, 1240), camFloor(582, 1.65, 1250), k); } },
  { id: 'brow', t0: 11.816, t1: 13.184, cu: true, cam: lt => { const a = camFace(stateO(lt), 2.7, 235); a[0] += 38; return a; } },
  { id: 'pen', t0: 13.184, t1: 15.424, cam: lt => camFloor(lerp(786, 796, seg(lt, 13.184, 15.424)), 2.1) },
  { id: 'cuS2', t0: 15.424, t1: 16.294, cu: true, cam: lt => camFace(strawO(lt), 3.0, 255) },
  { id: 'macro', t0: 16.294, t1: 17.793, cam: lt => camFloor(626, 3.4, 1230) },
  { id: 'cuS3', t0: 17.793, t1: 18.876, cu: true, cam: lt => camFace(strawO(lt), lerp(3.0, 3.2, seg(lt, 17.793, 18.876)), 255) },
  { id: 'slip', t0: 18.876, t1: 22.976, cam: lt => { const k = seg(lt, 18.876, 22.976), b = easeOut(seg(lt, BAN.boing - .02, BAN.boing + .3)) * (1 - easeIO(seg(lt, BAN.boing + .4, BAN.boing + 1.2))); return camFloor(lerp(706, 718, easeIO(k)), 2.0 + .06 * b, 1270); } },
  { id: 'door', t0: 22.976, t1: 24.59, cam: lt => camFloor(lerp(822, 834, seg(lt, 22.976, 24.59)), lerp(2.2, 2.3, easeIO(seg(lt, 22.976, 24.59))), 1270) },
  { id: 'cuS5', t0: 24.59, t1: 25.297, cu: true, cam: lt => camFace(strawO(lt), 3.2, 255) },
  { id: 'tight', t0: 25.297, t1: 99, only: 'S', cam: lt => mixCam([880, 880, 3.4, 0], [876, 884, 3.9, 0], c01((lt - 25.297) / 1.729)) },   /* a constant-speed push-in, arriving on the very last frame (27.026) (no ease-out, so the next scene can carry on at the same speed) */
];
const shotAt = lt => SHOTS.find(s => lt < s.t1) || SHOTS[SHOTS.length - 1];
const CUTS = lazy(() => [bs('st2'), CUT.st3, bs('s2'), CUT.macro0, CUT.macro1, bs('slip'), CUT.door, bs('s5'), bs('st7')]);
const cutNear = lt => CUTS().some(c => Math.abs(lt - c) < .04);

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
EXT.prop.fp14t_walker = (side, o) => {
  walkerShape(1);
  if (o.pend1) { const a = o.pend1.age, sway = Math.sin(a * 9) * .16 * Math.exp(-a * 3.2); pendant(16, 5, sway, o.pend1.led, 3.3); }   /* the first handset hangs on his left rail, the side she runs up on */
  if (o.walkerPeel) {                                                                      /* the peel he brought from ROOM 4: draped over the rail, swaying */
    const sw = Math.sin((o.t || 0) * 3.1) * .05;
    ctx.save(); ctx.translate(46, 2); ctx.rotate(sw); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,24,6,.85)'; ctx.lineWidth = 4;
    for (const [dx, len, col] of [[-12, 84, '#ffe135'], [10, 70, '#f4d526'], [-1, 58, '#ffee80']]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(dx - 9, 0); ctx.quadraticCurveTo(dx - 15, len * .5, dx - 4, len); ctx.quadraticCurveTo(dx + 6, len * .96, dx + 12, len * .5); ctx.quadraticCurveTo(dx + 12, 8, dx + 9, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
};

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
/* no. 1 hangs on Banana's walker (drawn by the walker prop), no. 2 is tossed into Cranberry's lap from the top of the hurdle, no. 3 is slapped on the wall by the shower arch */
const LIGHTS = [
  { at: () => CUE.ding1, pos: lt => [BXf()(lt) + STAGE.light1[0] - STAGE.banR4, FL - STAGE.light1[1] + 16] },
  { at: () => CUE.ding2, pos: lt => [STAGE.light2[0], FL - STAGE.light2[1]] },
  { at: () => CUE.ding3, pos: lt => [STAGE.light3[0], FL - STAGE.light3[1]] },
];
const placed = lt => LIGHTS.filter(L => lt >= L.at()).length;
const held = lt => 3 - (lt >= CUE.ding1) - (lt >= CUE.ding2 - .16) - (lt >= CUE.ding3);   /* handsets still in her fist */
function drawPlaced(lt, after) {
  // the rings and glints at each ding
  for (const L of LIGHTS) {
    const age = lt - L.at(); if (age < 0 || age > .7) continue;
    const [x, y] = L.pos(lt);
    V2.ring(x, y + 14, age / .6, { r0: 10, r1: 100, lw: 5, color: '120,255,160', alpha: .9 });
    if (age < .28) { ctx.save(); ctx.globalAlpha *= 1 - age / .28; const r = 26 + 40 * age; ctx.fillStyle = '#fff6c0'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i * PI / 4 + .4, R = i % 2 ? r * .22 : r; ctx.lineTo(x + Math.cos(an) * R, y + 8 + Math.sin(an) * R); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  if (!after) return;
  // no. 2: the toss, then resting in her lap; no. 3: stuck to the wall with a squash
  const t2 = CUE.ding2, tf = t2 - .16;
  if (lt >= tf) {
    const u = c01((lt - tf) / .16), p0 = handW(strawO(tf), (strawO(tf).grip || {}).r || [150, 0]), p1 = [STAGE.light2[0], FL - STAGE.light2[1]];
    const x = lerp(p0[0], p1[0], u), y = lerp(p0[1], p1[1], easeIn(u)) - 26 * Math.sin(u * PI), age = lt - t2, sway = age > 0 ? Math.sin(age * 9) * .18 * Math.exp(-age * 3) : 0.9 * (1 - u) + .3 * u;
    pendant(x, y, sway, lt >= t2 ? .75 + .25 * Math.sin(lt * 7) : 0, 1.45);
  }
}
/* no. 3 sticks to the wall by the shower door: it is drawn BEFORE the cast, so whoever stands in front of it hides it (it never covers a face) */
function drawWallLight(lt) {
  const t3 = CUE.ding3; if (lt < t3) return;
  const age = lt - t3, sq = 1 + .35 * Math.exp(-age * 14) * Math.cos(age * 40);
  ctx.save(); ctx.translate(STAGE.light3[0], FL - STAGE.light3[1]); ctx.scale(1 / sq, sq); pendant(0, 0, 0, .75 + .25 * Math.sin(lt * 7), 1.45); ctx.restore();
}

// ------------------------------------------------------------------ the world
/* a character whose head is passing through the frame edge while it, or the camera, is moving fast is "in transit" (a walk or a whip in or out of the shot); a static one is left to the gate */
const camVel = (lt, x) => { const f = t => { const [cx, , z] = shotAt(t).cam(t); return (x - cx) * z; }; return (f(lt + .03) - f(lt - .03)) / .06; };
/* is the character's whole figure (head to feet, a little air round it) inside the frame under the current camera? */
function wholeInFrame(o, pad = 6) {
  const k = KINDS[o.kind], s = o.s, legLen = o.noLegs ? 0 : (k.leg || 90), cy = o.y - (o.lift || 0) - (legLen + k.ry * .9) * s, m = ctx.getTransform();
  const hw = k.rx * 1.12 * s, top = cy - (TOPS[o.kind] ?? k.ry * 1.05) * s, bot = o.y + 14 * s;
  const q = [[o.x - hw, top], [o.x + hw, top], [o.x - hw, bot], [o.x + hw, bot]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  return Math.min(...q.map(a => a[0])) >= pad && Math.max(...q.map(a => a[0])) <= W - pad && Math.min(...q.map(a => a[1])) >= pad && Math.max(...q.map(a => a[1])) <= H - pad;
}
function autoTransit(o, lt) {
  const k = KINDS[o.kind], s = o.s, legLen = o.noLegs ? 0 : (k.leg || 90), cy = o.y - (o.lift || 0) - (legLen + k.ry * .9) * s, m = ctx.getTransform();
  const hw = (k.rx * .95 + 70) * s, x0 = o.x - hw, x1 = o.x + hw, y0 = cy + (k.eyeY - k.er * 1.42 - 24) * s, y1 = cy + (k.mouthY + 55) * s;
  const P = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const q = [P(x0, y0), P(x1, y0), P(x0, y1), P(x1, y1)], X0 = Math.min(...q.map(a => a[0])), X1 = Math.max(...q.map(a => a[0])), Y0 = Math.min(...q.map(a => a[1])), Y1 = Math.max(...q.map(a => a[1]));
  const partly = X1 > 0 && X0 < W && Y1 > 0 && Y0 < H && (X0 < 4 || X1 > W - 4 || Y0 < 4 || Y1 > H - 4);
  if (partly && (Math.abs(o.vx || 0) > 25 || Math.abs(camVel(lt, o.x)) > 100)) o.transit = true;
  return o;
}
/* the room options of this scene: ROOM 4 without its peel decal (Banana's own peel comes later), the med fridge with its 18 pens dated today (the adapt scene did it at 3:04), the shower room packed and bulging */
const ROOMS = lt => ({
  r4: { peel: 0 }, med: { pens: 1 },
  shower: { stash: 4, bulge: sstep(lt, 20, 26.5) * .55 + .45 * sstep(lt, 24.4, 26.8), door: 0 },
});
/* K's med cart (S14.cart) with a rattle while it rolls and a drawer that slides out on the shove and back in as it coasts */
function drawMedCart(x, lt) {
  const rt = cartRattle(lt), u = c01((lt - CUE.whoosh - .4) / 2.9), dr = lt > CUE.whoosh + .3 && u < 1 ? Math.sin(c01((lt - CUE.whoosh - .3) / 1.1) * PI) * .9 : 0;
  S14.cart(x + rt * hn(lt, 33, 5) * 1.2, FL + rt * hn(lt, 40, 3) * .9, { s: 1.08, drawer: dr });
}
const cartRattle = lt => { const t0 = CUE.whoosh + .4, t1 = CUE.whoosh + 3.3, u = c01((lt - t0) / (t1 - t0)); return lt > CUE.whoosh + .3 && u < 1 ? .4 + .6 * (1 - u) : 0; };
function drawWorld(lt, sh) {
  V2.setLight({ key: [-.4, -.8], keyColor: '#ffe9c4', keyA: .24, rim: '#a9ccff', rimA: .5, shadow: '#2a2040', shadowA: .34, bounce: '#ffd9a0', bounceA: .18, amb: '#fff0d8', ambA: .05 });
  const o = { t: lt, rooms: ROOMS(lt) };
  S14.back(lt, o);
  const w0 = CUE.whoosh, halt = bs('run') + 3.52, so = strawO(lt), run = lt >= w0 && lt < bs('run') + 3.7;
  // dust and speed lines first (behind everyone)
  dustTrail(lt, w0, halt + .1, SX, 100);
  if (run) { const sp = smoothSpeed(lt); speedLines(lt, so.x - 6, FL - 86 - (so.lift || 0), Math.sign(sxSpeed(lt)) || 1, c01((sp - 110) / 120)); }
  if (lt < CUT.macro0) drawMedCart(cartX(lt), lt);                          /* the cart is behind everyone: it passes behind Banana and the armchair; it is gone after the macro insert */
  const ko = kumO(lt), bo = banO(lt), cast = [cranO(lt), bo, stateO(lt), ko, so].filter(Boolean);
  const cu = sh && sh.cu, only = sh && sh.only;                                /* a close-up shows whoever is whole in the frame, and nobody who is cut by it; `only` shows her alone */
  const wk = walkerPose(lt); if (wk && !only) drawWalkerFree(wk);
  drawWallLight(lt);
  for (const c of cast) { if (only && c !== so) continue; if (cu && c !== so && !wholeInFrame(c, c.kind === 'banana' || c.kind === 'cran' ? 6 : 90)) continue; drawChar(autoTransit(c, lt)); }
  if (!only) drawPeel(lt, ko);
  drawPlaced(lt, true);
  const cs = capState(lt, so); if (cs) drawCap(so, cs);
  if (held(lt) > 0 && lt > bs('s1') + .05) drawBundle(lt, so, held(lt));
  S14.front(lt, o);
}
function drawPeel(lt, ko) {
  const pp = peelPose(lt); if (!pp) return;
  ctx.save();
  if (pp.held) { const g = ko && ko.grip && ko.grip.r, h = g ? handW(ko, g) : [STAGE.kSL + 14, FL - 70]; ctx.translate(h[0], h[1] - 8); }
  else ctx.translate(pp.x, pp.y);
  ctx.rotate(pp.rot); peelShape(pp.k); ctx.restore();
}
function drawBundle(lt, so, n) {
  const g = so.grip && so.grip.r; if (!g) return;
  const [hx, hy] = handW(so, g), v = sxSpeed(lt), tr = Math.max(-1, Math.min(1, -v / 300));
  for (let i = 0; i < n; i++) pendant(hx + tr * 16 + i * 5, hy + 8 + i * 5, tr * .8 + .1 * Math.sin(lt * 20 + i * 2), 0, 1.15);
}

// ------------------------------------------------------------------ the macro: the pen's label (a full-frame insert; the cast is not drawn, so no face can be cut)
const MAC = { cx: 540, cy: 800, rot: -.1 };
function penBody() {                                                                      /* the pen, centred on the origin, 900 long, 168 thick (screen px at scale 1) */
  const L = 450, Hh = 92;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(40,16,34,.42)'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 36;
  ctx.fillStyle = V2.grad(0, -Hh, 0, Hh, [[0, '#ffffff'], [.35, '#f2efe6'], [.8, '#c9c3b4'], [1, '#a49d8e']]); rr(-L, -Hh, 2 * L, 2 * Hh, 34); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = INK_; ctx.lineWidth = 6; rr(-L, -Hh, 2 * L, 2 * Hh, 34); ctx.stroke();
  // the cap (left): orange, with a steel clip along the top
  ctx.fillStyle = V2.grad(0, -Hh, 0, Hh, [[0, '#ffb25a'], [.4, '#f08a24'], [1, '#b3560c']]); rr(-L - 4, -Hh - 6, 215, 2 * Hh + 12, 30); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -Hh - 30, 0, -Hh, [[0, '#f4f7fb'], [1, '#98a2b0']]); rr(-L + 22, -Hh - 30, 150, 34, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(-L + 14, -Hh + 12, 190, 12, 6); ctx.fill();
  // the cartridge window (right of the label) with a little insulin in it, and the dose knob with ridges
  ctx.fillStyle = '#d7eef7'; ctx.strokeStyle = 'rgba(30,30,50,.85)'; ctx.lineWidth = 4; rr(176, -50, 160, 100, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(120,190,225,.55)'; rr(184, -2, 144, 44, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(30,30,50,.5)'; ctx.lineWidth = 2.4; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(198 + i * 17, -44); ctx.lineTo(198 + i * 17, i % 2 ? -30 : -22); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, -Hh, 0, Hh, [[0, '#7d8695'], [.5, '#566070'], [1, '#2f3642']]); ctx.strokeStyle = INK_; ctx.lineWidth = 5; rr(L - 120, -Hh - 8, 124, 2 * Hh + 16, 22); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(L - 104 + i * 19, -Hh - 2); ctx.lineTo(L - 104 + i * 19, Hh + 2); ctx.stroke(); }
  ctx.fillStyle = '#e9edf4'; ctx.strokeStyle = INK_; ctx.lineWidth = 5; rr(L - 10, -34, 36, 68, 14); ctx.fill(); ctx.stroke();
}
function penLabel(lt, k) {
  // the sticker wrapped round the barrel: a slight curve top and bottom, a blue band above, a green one below, the printed field and the marker date
  const x0 = -250, x1 = 158, y0 = -78, y1 = 78;
  ctx.save();
  ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = 'rgba(40,36,30,.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, y0 + 4); ctx.quadraticCurveTo((x0 + x1) / 2, y0 - 12, x1, y0 + 4); ctx.lineTo(x1, y1 - 4); ctx.quadraticCurveTo((x0 + x1) / 2, y1 + 12, x0, y1 - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#2f5fb8'; ctx.fillRect(x0, y0 - 14, x1 - x0, 22); ctx.fillStyle = '#2f9a4a'; ctx.fillRect(x0, y1 - 8, x1 - x0, 24);
  ctx.fillStyle = V2.grad(x0, 0, x1, 0, [[0, 'rgba(60,40,20,.16)'], [.18, 'rgba(255,255,255,0)'], [.8, 'rgba(255,255,255,0)'], [1, 'rgba(60,40,20,.2)']]); ctx.fillRect(x0, y0 - 14, x1 - x0, 160);
  ctx.restore();
  // printed dressing (shapes, not text) so the field reads as a real label
  ctx.fillStyle = 'rgba(60,66,84,.55)'; for (const [yy, w] of [[-62, 150], [-54, 104]]) ctx.fillRect(x0 + 22, yy, w, 4);
  ctx.strokeStyle = 'rgba(60,66,84,.7)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x0 + 22, 52); ctx.lineTo(x1 - 22, 52); ctx.stroke();
  UI.container('penlabel', 'label', [x0, y0, x1, y1], 4);
  UI.label('DATE OPENED', x0 + 24, -36, { size: 32, weight: 900, spacing: 1, fill: '#27304a', align: 'left', cid: 'penlabel', center: false });
  // the marker: blue, a little uneven, written on the line
  ctx.save(); ctx.translate(-48, 24); ctx.rotate(-.05);
  const w = sstep(lt, CUT.macro0 + .12, CUT.macro0 + .28);
  UI.label('6/12', 0, 0, { size: 88, weight: 900, italic: true, fill: '#1f3d9c', stroke: '#16286a', lw: 2, align: 'center', cid: 'penlabel', center: false, alpha: w });
  ctx.restore();
  // the ring that goes round it on "June."
  const jt = wordT('st4', 'june', 17.19), rk = sstep(lt, jt - .05, jt + .3);
  if (rk > 0) {
    ctx.save(); ctx.strokeStyle = 'rgba(214,40,52,.92)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    const per = 2 * PI * 110; ctx.setLineDash([per * rk, per * 2]); ctx.lineDashOffset = 0;
    ctx.beginPath(); ctx.ellipse(-48, 31, 150, 52, -.04, -PI * .6, PI * 1.5); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
function drawMacro(lt) {
  const k = c01((lt - CUT.macro0) / (CUT.macro1 - CUT.macro0));
  // the wallpaper of ROOM 7 and its lamp light, far out of focus
  V2.setLight({});
  V2.dof(20, () => { ctx.fillStyle = '#c98f86'; ctx.fillRect(-300, -300, W + 600, H + 600); S14.back(lt, { t: lt, rooms: ROOMS(lt) }); });
  V2.glow(190, 380, 300, '255,214,150', .34, 'screen', .5); V2.glow(900, 560, 260, '255,190,170', .22, 'screen', .4);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sc = 1.16 + .12 * easeIO(k), pop = 1 + .02 * Math.max(0, pulse(lt, wordT('st4', 'label', 16.54), 18, .16));
  ctx.translate(MAC.cx, MAC.cy); ctx.rotate(MAC.rot + .008 * Math.sin(lt * 1.9)); ctx.scale(sc * pop, sc * pop);
  penBody(); penLabel(lt, k);
  const fp = ctx.getTransform().transformPoint({ x: 262, y: 16 });                  /* the fist's centre on the screen */
  ctx.save(); ctx.translate(262, 16); ctx.rotate(-1.75); ctx.scale(6.2, 6.2); V2C.hand('grip', 1, {}); ctx.restore();
  ctx.restore();
  // the slate sleeve running in from the right edge to the fist
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  V2C.limb([[1220, 1120], [fp.x + 250, fp.y + 190], [fp.x + 30, fp.y + 60]], [170, 132, 104], '#33527a', 'rgba(255,255,255,.14)');
  ctx.restore();
}

// ------------------------------------------------------------------ the HUD (screen space, in over())
const HUD = { right: 1040 };
function hudTally(lt) {
  const t0 = CUE.whoosh - .12, t1 = bs('k1') + 1.7, a = sstep(lt, t0, t0 + .2) * (1 - sstep(lt, t1, t1 + .3));
  if (a <= .01) return;
  const n = placed(lt), size = 30, h = 64, lab = 'CALL LIGHTS IN REACH', li = UI.sizeOf(lab, { size, weight: 900, spacing: 1.5 });
  const dw = 30, w = 28 + li.w + 22 + dw * 3 + 26, x0 = HUD.right - w, y0 = 284;
  const last = Math.max(0, Math.min(...LIGHTS.map(L => lt - L.at()).filter(d => d >= 0).concat([9]))), popK = placed(lt) > 0 && last < .35 ? Math.sin(c01(last / .35) * PI) : 0;
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
/* INCIDENTS: the same top-right slot, 48 until the boing; then the units digit rolls over to 49 inside its fixed-width slot (the old digit rolls up and out, the new one in from below;
   the two never overlap, and text that is mid-roll is crop:true, hero:false) */
function hudIncidents(lt) {
  const t0 = bs('slip') - .02, t1 = CUT.door - .3, a = sstep(lt, t0, t0 + .25) * (1 - sstep(lt, t1, t1 + .25));
  if (a <= .01) return;
  const size = 30, h = 64, lab = 'INCIDENTS', li = UI.sizeOf(lab, { size, weight: 900, spacing: 1.5 });
  const dw = 32, w = 28 + li.w + 26 + dw * 2 + 26, x0 = HUD.right - w, y0 = 284, cx = x0 + w / 2, cy = y0 + h / 2;
  const fl = c01((lt - CUE.boing) / .32), e = easeOut(fl), hit = lt >= CUE.boing, pop = hit ? Math.sin(c01((lt - CUE.boing) / .5) * PI) : 0, rolling = fl > 0 && fl < 1;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(cx, cy); ctx.scale(1 + .07 * pop, 1 + .07 * pop); ctx.translate(-cx, -cy);
  UI.panel([x0, y0, w, h], { id: 'incidents', kind: 'pill', fill: '#f2e8cf', stroke: hit ? '#c4202e' : '#7a2a30', lw: 4, r: h / 2, pad: 12, shadow: 14 });
  reg('overlay', [x0, y0, x0 + w, y0 + h], { id: 'incidents' });
  UI.label(lab, x0 + 28, cy, { size, weight: 900, spacing: 1.5, fill: '#7a2a30', align: 'left', cid: 'incidents', center: false });
  const dx = x0 + w - 26 - dw * 2, fillD = hit ? '#c4202e' : '#7a2a30', DO = { size: 40, font: 'Bangers', weight: 400, fill: fillD, cid: 'incidents', center: false };
  UI.label('4', dx + dw / 2, cy, DO);
  const ux = dx + dw + dw / 2;
  if (rolling) {
    ctx.save(); ctx.beginPath(); ctx.rect(dx + dw, y0 + 6, dw, h - 12); ctx.clip();
    UI.label('8', ux, cy - e * 46, Object.assign({}, DO, { crop: true, hero: false, alpha: 1 - e, cid: undefined }));
    UI.label('9', ux, cy + (1 - e) * 46, Object.assign({}, DO, { crop: true, hero: false, alpha: e, cid: undefined }));
    ctx.restore();
  } else UI.label(hit ? '9' : '8', ux, cy, DO);
  ctx.restore();
}
function hudTag(lt) {
  const t0 = wordT('n1', 'tracer', 1.13) - .05, t1 = bs('s1') + .1, a = sstep(lt, t0, t0 + .22) * (1 - sstep(lt, t1, t1 + .25));
  if (a <= .01) return;
  const sw = Math.sin(lt * 1.6) * .03 + .035 * Math.exp(-Math.max(0, lt - t0) * 2.4) * Math.sin((lt - t0) * 11);
  ctx.save(); ctx.globalAlpha *= a;
  const cx = HUD.right - 244, cy = 352;
  const tg = UI.tag([{ t: 'TRACER: SUBJECT A', size: 34, weight: 900, fill: '#24402e' }, { t: 'Strawberry, per diem', size: 32, weight: 800, italic: true, fill: '#8a5a12' }], cx, cy, { fill: '#f2e8cf', stroke: '#24402e', lw: 4, size: 34, id: 'tracetag', rot: sw, w: 488 });
  reg('overlay', [tg.x0, tg.y0, tg.x1, tg.y1], { id: 'tracetag' });
  ctx.restore();
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotAt(lt).id,
  cam(lt) { const D = window.TR_DEBUG; if (D) { zoomTo(D.cx, D.cy, D.z); CAM.r = 0; return; } const [cx, cy, z, r] = shotAt(lt).cam(lt); zoomTo(cx, cy, z); CAM.r = r; },
  draw(lt) { if (window.TR_DEBUG && window.TR_DEBUG.nocast) { V2.setLight({}); S14.back(lt, { t: lt }); S14.front(lt, { t: lt }); return; } (shotAt(lt).id === 'macro' ? drawMacro(lt) : drawWorld(lt, shotAt(lt))); },
  fx: lt => shotAt(lt).id === 'macro' ? { bloom: .55, vignette: .55, grain: .05, contrast: .18, sat: .12, tint: [['#ffb878', .1, 'soft-light']] } : { bloom: .45, vignette: .36, grain: .05, contrast: .14, sat: .1 },
  blur: lt => cutNear(lt) ? 1 : (lt > .2 && lt < .95) || (lt > bs('s1') + .05 && lt < bs('run') + 3.7) || (lt > bs('slip') && lt < be('slip') + .1) ? 3 : 1,
  over(lt) { hudTag(lt); hudTally(lt); hudIncidents(lt); },
};
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.tracer = SC;
})();
