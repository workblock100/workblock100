'use strict';
/* SHIFT HAPPENS, Episode 19: The Potluck. Scene module: plate (7:45 PM, THE PLATE, 23.164 s), ONE continuous shot. Builder PLATE. Registers window.__EP19_SCENES.plate.
 * The camera, the cast tracks, the rooms and the speaker come from ep19_plate_sim.js (DOM-free; ONE table for the picture and for build/ep19/plate_path.json, written by tools_plate_path.js).
 *
 * THE SHOT is a dolly down a flat elevation of the building (world units = pixels at zoom 1; the floor line is FY, a person is about 400 tall). The camera is a 2D camera (x, y, zoom, roll) from the sim;
 * depth comes from PARALLAX LAYERS: a far layer (p .35 to .75) seen only through the holes in the wall (the kitchen through the pass-through, the night through hall B's window, a far hallway through
 * corridor C's alcove), the wall plane and the cast (p 1), and a near layer (p 1.3) that stays in the bands above the heads and below the knees so it never covers a face. The floor fans from a vanishing
 * point that follows the camera. Characters turn (yaw): three-quarter and profile; the heads follow the plate; the legs walk (gait driven by distance).
 * THE PLATE is drawn by this module in world space AFTER the cast (an F19 'plate' with its items, stickers, a thermometer, steam), in every phase: sliding out of the pass-through, on the rail, lifted, held,
 * flying between two hands (an arc, a catch with a bounce) and set down on the med cart. Each hand-off ends in the receiver's hands; each giver is left behind to the left, so nobody walks through anybody.
 *
 * SHOT LIST (scene-local s; every beat is inside the one shot; the camera never cuts): open 0.2-1.2 the plate slides out of the pass-through and clinks on the rail (plateclink .5), Mango takes it |
 *  m1 1.3-2.29 close on Mango and the plate | walk1 2.39-4.09 down corridor A (the kitchen slides away, the far layer lags) | l1 4.14-5.2 Lemon steps in, takes it on "hold", the HOLD note (peel1 5.037) |
 *  walk2 5.3-6.7 the camera runs ahead of Lemon and finds Tomato | t1 6.75-7.75 Fun Committee: the round sticker (peel2 7.652), a party popper | walk3 7.85-9.15 Tomato dances it to Onion |
 *  o1 9.2-11.06 Onion: the label, the probe goes in, the readout, 78 F (probebeep 10.596), the tear (sniffle 11.196) | walk4 11.16-12.46 Onion carries it into hall B | pe1 12.51 Mr. Pear takes it on his lap and peers |
 *  m3 13.64 Mango (ran in from the right) "It is beige." and takes it back | walk5 14.65-15.85 | b1 15.89 Binder pops onto the rim (binderpop 15.745), PENDING tag | walk6 16.59-18.09 (callchime 16.891: a red lamp lights
 *  in the far hallway) the camera arrives at Strawberry | s1 18.14 | m2 19.31 Mango sets the plate on the cart | s2 20.4 she looks up | end 21.51-22.71 (sting 21.614) the camera tilts up and pushes in on the clock, 7:59. */
(() => {
if (!window.TIMELINE_EP19 || !window.H6 || !window.V2 || !window.UI || !window.__EP19_SIMS || !window.__EP19_SIMS.plate) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15;
const PI = Math.PI, TAU = PI * 2;

// ------------------------------------------------------------------ the sim, the timeline and small helpers
const SM = window.__EP19_SIMS.plate.build();
const { B, CUE, FY, LANE, SC, T, WORDS } = SM;
const FYL = FY + LANE;                                              /* the cast's feet */
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const mx = (a, b, k) => a + (b - a) * k;
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };   /* seeded noise 0..1: a pure function of its arguments */
const snapT = SM.snapT;
const bS = id => B[id][0], bE = id => B[id][1];
const wS = SM.wS, wE = SM.wE;
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => mx(v, b[1][j], k)) : mx(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const KL = (a, lt) => key(a, lt, k => k);                           /* linear between keys */
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const OUTL = 'rgba(28,20,14,.75)';
const fa = (lt, f) => (typeof f === 'function' ? f(lt) : f);
const F = () => (typeof window.F19 !== 'undefined' && window.F19 && typeof window.F19.dish === 'function') ? window.F19 : null;
const FX = () => (typeof window.FX18 !== 'undefined' && window.FX18) || null;
const lgr = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rgr = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
const rrp = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
const Y = h => FY - h;                                              /* world y of a height above the floor line */
function mixHex(a, b, k) { const A = V2.rgb(a), Bc = V2.rgb(b); return `rgb(${Math.round(mx(A[0], Bc[0], k))},${Math.round(mx(A[1], Bc[1], k))},${Math.round(mx(A[2], Bc[2], k))})`; }

/* the sound cues of the scene, snapped to frames (sim) */
const Q = CUE;

// ------------------------------------------------------------------ the plate chain: who holds the plate when (all times snapped to the video frame)
const sn = snapT;
const PHASES = [
  { k: 'slide', t0: sn(.2), t1: Q.plateclink },
  { k: 'rest', t0: Q.plateclink, t1: sn(.84) },
  { k: 'lift', t0: sn(.84), t1: sn(1.3), to: 'mango' },
  { k: 'held', t0: sn(1.3), t1: sn(4.46), who: 'mango' },
  { k: 'fly', t0: sn(4.46), t1: sn(4.76), from: 'mango', to: 'lemon' },
  { k: 'held', t0: sn(4.76), t1: sn(6.66), who: 'lemon' },
  { k: 'fly', t0: sn(6.66), t1: sn(6.94), from: 'lemon', to: 'tom' },
  { k: 'held', t0: sn(6.94), t1: sn(8.96), who: 'tom' },
  { k: 'fly', t0: sn(8.96), t1: sn(9.22), from: 'tom', to: 'onion' },
  { k: 'held', t0: sn(9.22), t1: sn(14.2), who: 'onion' },
  { k: 'fly', t0: sn(14.2), t1: sn(14.52), from: 'onion', to: 'mango' },
  { k: 'held', t0: sn(14.52), t1: sn(19.4), who: 'mango' },
  { k: 'set', t0: sn(19.4), t1: sn(19.78), from: 'mango' },
  { k: 'cart', t0: sn(19.78), t1: 99 },
];
const phaseAt = lt => { let r = PHASES[0]; for (const p of PHASES) if (lt >= p.t0 - 1e-6) r = p; return r; };
/* who holds the plate at lt ('held' phases only; during a flight the receiver is already reaching and the giver is still letting go) */
const holderAt = lt => { const p = phaseAt(lt); return p.k === 'held' ? p.who : null; };
const catchT = lt => { const p = phaseAt(lt); for (let i = 0; i < PHASES.length; i++) if (PHASES[i] === p) { if (p.k === 'held' && PHASES[i - 1] && PHASES[i - 1].k === 'fly') return PHASES[i - 1].t1; } return null; };
/* the stickers: the time each is stuck on (the plate slaps it down over .2 s) */
const ST = { hold: snapT(5.037 + .17), fun: snapT(7.652 + .15), label: snapT(10.86), probeIn: snapT(10.0), reading: Q.probebeep, binder: Q.binderpop };

// ------------------------------------------------------------------ the cast: drawChar options as a pure function of lt
const KD = k => KINDS[k];
/* Mango's ID badge: the same art as the kit's badge7, but its CNA label is dressing that may foreshorten (when she turns to profile the chest squeezes sideways and the audit reads the squeezed matrix as a tilted string) */
EXT.acc.badgeP19 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(k.rx * .64, k.ry * .33); ctx.rotate(.08); ctx.scale(.9, .9);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-22, -14, 44, 56, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; ctx.fillRect(-16, -8, 32, 22);
  text(o.badgeText || 'NURSE', 0, 28, { size: 10, fill: INK, maxW: 40, crop: true, tilt: 1.4 });
  ctx.restore();
};
const memo = new Map();
function memoed(key_, fn) { if (memo.size > 90) memo.clear(); let v = memo.get(key_); if (!v) { v = fn(); memo.set(key_, v); } return v; }
/* the body centre of a character: the feet are at o.y, the centre sits leg + .9 ry above them (scaled), plus the idle bob and the walk bob the engine adds */
function bodyCentre(o) {
  const k = KD(o.kind), s = o.s || 1, leg = o.noLegs ? 0 : (k.leg || 90), seed = o.seed ?? (o.kind.charCodeAt(0) * 13 + o.kind.length * 7);
  const wb = (o.gaitW != null) ? -Math.abs(Math.sin(o.gaitW / (2 * (o.stride || 30)) * PI)) * 7 : 0;
  const bob = Math.sin((o.t ?? 0) * 2.6 + seed) * 2.2 + wb;
  return [o.x, o.y - (o.lift || 0) - s * (leg + k.ry * .9) + s * bob];
}
/* the walking fields from the sim (distance-driven gait) and the facing: a walker faces where it goes, a stander faces `idle` */
function walkOf(who, lt) {
  const tr = T[who], w = tr.walk(lt), o = { x: tr.x(lt), y: FYL, s: SC[who], t: lt };
  if (w.on) { o.gaitW = w.gaitW; o.stride = w.stride; o.dir = w.dir; o.axis = 'x'; o.vx = w.v; }
  const sp = w.on ? Math.abs(w.v || 0) : 0;
  return { o, w, walk: ss(sp, 30, 150), dir: w.dir || 1 };
}
const faceYaw = (W, idle, wy = 1.12) => mx(idle, W.dir * wy, W.walk);
/* hands: a relaxed target beside the body (the engine's 'rest' hand), in body-local pixels; side -1 = screen left */
const REST = side => [side * 118, 112];
const idleHand = (side, lt, k = 1) => { const p = REST(side); return [p[0] + 4 * k * Math.sin(lt * 1.7 + side), p[1] + 5 * k * Math.sin(lt * 2.1 + side * 2)]; };

/* ---- the carry geometry: the plate's bottom centre in body-local px (forward, down) relative to the body centre; `forward` is multiplied by the continuous facing (dirC below) */
const SPOT = { low: [124, 116], ext: [150, 88], front: [136, 106], present: [196, 14], high: [66, -96], belly: [26, 124], lap: [64, 70], offer: [142, 126] };
const dirC = yaw => Math.max(-1, Math.min(1, Math.sin(yaw) * 3));   /* a continuous facing: +1 right, -1 left, 0 at the front (the plate crosses the chest as a holder turns) */
const dirOfYaw = y => y >= 0 ? 1 : -1;
const NEAR = dirF => dirF >= 0 ? 'l' : 'r';                         /* the arm that is drawn in front of the body when the face points to dirF */
const lerpS = (a, b, k) => [mx(a[0], b[0], k), mx(a[1], b[1], k)];
/* the plate's spot for each holder as a function of time: [forward px, down px, tilt rad] */
function spotOf(who, lt) {
  if (who === 'mango') {
    if (lt < 4.9) {
      const a = lt < 1.3 ? lerpS(SPOT.low, SPOT.present, ss(lt, .86, 1.3)) : lt < 2.4 ? lerpS(SPOT.present, SPOT.low, ss(lt, 2.1, 2.5)) : lt < 4.1 ? SPOT.low : lerpS(SPOT.low, SPOT.ext, ss(lt, 4.1, 4.44));
      return [a[0], a[1], lt >= 1.3 && lt < 2.4 ? .05 * Math.sin((lt - 1.3) * 3.1) - .06 : 0];
    }
    if (lt < 14.7) { const a = lt < 14.1 ? SPOT.low : lt < 14.52 ? lerpS(SPOT.low, SPOT.offer, ss(lt, 14.1, 14.3)) : lerpS(SPOT.offer, SPOT.low, ss(lt, 14.52, 14.7)); return [a[0], a[1], 0]; }
    if (lt < 19.0) return [SPOT.low[0], SPOT.low[1], 0];
    const a = lerpS(SPOT.low, SPOT.ext, ss(lt, 19.0, 19.4)); return [a[0], a[1], 0];
  }
  if (who === 'lemon') { const e = lerpS(SPOT.ext, SPOT.front, ss(lt, 4.76, 5.0)), a = lt < 6.3 ? e : lerpS(SPOT.front, SPOT.ext, ss(lt, 6.3, 6.66)); return [a[0], a[1], 0]; }
  if (who === 'tom') { const a = lt < 7.2 ? lerpS(SPOT.ext, SPOT.high, ss(lt, 6.94, 7.2)) : lt < 8.8 ? SPOT.high : lerpS(SPOT.high, SPOT.ext, ss(lt, 8.8, 8.98)); return [a[0], a[1], lt > 7.85 && lt < 9.0 ? .09 * Math.sin((lt - 7.85) * 9) : 0]; }
  if (who === 'onion') { const a = lt < 9.6 ? lerpS(SPOT.ext, SPOT.belly, ss(lt, 9.22, 9.6)) : lt < 12.3 ? SPOT.belly : lerpS(SPOT.belly, SPOT.offer, ss(lt, 12.3, 12.62)); return [a[0], a[1], 0]; }
  if (who === 'pear') return [SPOT.lap[0], SPOT.lap[1], 0];
  return [SPOT.low[0], SPOT.low[1], 0];
}
/* how much of the plate a character holds at lt (0..1): the giver lets go as the plate leaves, the receiver's hands arrive with it */
const hasPlate = (who, lt) => { const p = phaseAt(lt); if (p.k === 'held' && p.who === who) return 1; if (p.k === 'fly') { if (p.to === who) return ss(lt, p.t0, p.t1) * .999; if (p.from === who) return 1 - ss(lt, p.t0 + .04, p.t1 - .08); } if (p.k === 'lift' && p.to === who) return ss(lt, p.t0, p.t1); if (p.k === 'set' && p.from === who) return 1 - ss(lt, p.t0, p.t1); return 0; };
/* ---- hands: every hand of a plate holder is IK driven all the time (a grip target in body-local px), so there is never a pop between a pose and a grip */
function restHand(kind, o, yaw, side) {                              /* a relaxed hand beside the body: the shoulder foreshortens with cos(yaw); a walker swings it along the gait */
  const k = KD(kind), sd = side === 'l' ? -1 : 1, c = Math.cos(yaw), s = Math.abs(Math.sin(yaw));
  const cyc = o.gaitW != null ? o.gaitW / (4 * (o.stride || 30)) : 0, sw = o.gaitW != null ? Math.sin(TAU * (cyc + (sd > 0 ? 0 : .5))) * 32 * dirOfYaw(yaw) * s : 0;
  return [sd * .92 * k.rx * c + sd * 14 * Math.abs(c) + sw + 3 * Math.sin(o.t * 1.7 + sd), .1 * k.ry + 104 + 4 * Math.sin(o.t * 2.1 + sd * 2)];
}
/* a plate holder's two hands: the FAR hand (the screen side the face points to) carries; the near hand is free (a gesture target `gest[side]` or relaxed) */
function handsGen(kind, o, yaw, spot, h, gest) {
  const dC = dirC(yaw), wR = ss(yaw, -.15, .15), g = {}, carry = [dC * (spot[0] - 30), spot[1] + 6];
  for (const side of ['l', 'r']) {
    const base = (gest && gest[side]) || restHand(kind, o, yaw, side), hh = h * (side === 'r' ? wR : 1 - wR);
    g[side] = clampReach(kind, yaw, side, [mx(base[0], carry[0], eo(hh)), mx(base[1], carry[1], eo(hh))]);
  }
  return g;
}
/* the plate's pose when it sits in a body's hands (from the body alone, so a hand can read it without recursion) */
function plateFromBody(o, yaw, sp, who) { const d = who === 'pear' ? -1 : dirC(yaw), c = bodyCentre(o); return { x: c[0] + d * sp[0] * o.s, y: c[1] + sp[1] * o.s, rot: d * sp[2], sx: 1, sy: 1 }; }
function clampReach(kind, yaw, side, g, R = 117) { const k = KD(kind), sd = side === 'l' ? -1 : 1, sx = sd * .92 * k.rx * Math.cos(yaw), sy = .1 * k.ry, dx = g[0] - sx, dy = g[1] - sy, d = Math.hypot(dx, dy); return d > R ? [sx + dx * R / d, sy + dy * R / d] : g; }

/* where the plate roughly is (world x), from the tracks alone: the bystanders' heads and eyes follow it (no recursion into the cast) */
function plateX(lt) {
  const p = phaseAt(lt);
  if (p.k === 'held') return T[p.who].x(lt);
  if (p.k === 'fly') return mx(T[p.from].x(lt), T[p.to].x(lt), ss(lt, p.t0, p.t1));
  if (p.k === 'lift') return mx(300, T[p.to].x(lt), ss(lt, p.t0, p.t1));
  if (p.k === 'set') return mx(T.mango.x(lt), 4620, ss(lt, p.t0, p.t1));
  return p.k === 'cart' ? 4620 : 300;
}
/* a bystander watches the plate: the head turns up to .5 rad toward it, the eyes go all the way */
function watch(o, lt, yaw, k = 1) {
  const dx = plateX(lt) - o.x, w = Math.max(-.55, Math.min(.55, dx / 300)) * k;
  return { hy: yaw + w, look: [Math.max(-.8, Math.min(.8, dx / 260)), .12] };
}
// ------------------------------------------------------------------ the cast: drawChar options as a pure function of lt
function mangoOpts(lt) {
  return memoed('mango@' + lt.toFixed(5), () => {
    const W = walkOf('mango', lt), o = W.o, run = lt > 12 && lt < 13.75;
    const idle = lt < 8 ? K([[0, -.8], [.9, -.8], [1.38, .4], [2.2, .4], [2.62, 1.0], [4.0, 1.0], [4.5, .8], [8, .8]], lt)
      : K([[8, -.8], [13.62, -.78], [14.3, -.62], [14.72, 1.0], [18.0, 1.0], [18.5, .8], [23.2, .8]], lt);
    const yaw = faceYaw(W, idle, 1.12), dirF = dirOfYaw(yaw), h = hasPlate('mango', lt), sp = spotOf('mango', lt);
    const present = lt >= 1.14 && lt < 2.4 ? ss(lt, 1.14, 1.4) * (1 - ss(lt, 2.1, 2.45)) : 0;
    const nearM = NEAR(dirF), gest = present > .001 ? { [nearM]: lerpS(restHand('mango', o, yaw, nearM), [-dirF * 6, 96], present) } : null;
    const hands = handsGen('mango', o, yaw, sp, h, gest);
    let hy = lt < 1.3 ? yaw - .1 : lt < 2.4 ? yaw - .42 * present : yaw;
    let expr = 'happy', look = [.5 * dirF, .05], browUp = 0;
    if (lt < .84) look = [-.75, .35]; else if (lt < 1.3) look = [-.4, .3];
    else if (lt < 2.4) { look = [.12, -.2]; browUp = 8; }
    else if (lt < 4.1) look = [.55, .05];
    else if (lt < 12.7) { const w = watch(o, lt, yaw); hy = w.hy; look = w.look; }
    else if (run) { expr = lt < 13.3 ? 'panic' : 'weak'; look = [-.7, .1]; }
    else if (lt < 14.3) { expr = lt < 13.64 ? 'weak' : 'neutral'; look = [-.75, .25]; browUp = 6 * ss(lt, 13.6, 13.9); }
    else if (lt < 19.3) look = [.7, 0];
    else if (lt < 20.3) look = [.8, .05];
    else { expr = lt < 21.1 ? 'hopeful' : 'shock'; look = [.55, -.3]; }
    const bounce = lt >= 13.0 && lt < 14.1 ? Math.max(0, 1 - Math.abs(lt - 13.8) / .5) : 0;
    const r = A7.mango(Object.assign(o, { yaw, headYaw: hy, look, expr, browUp, who: 'mango', acc: ['badgeP19', 'gaitbelt7', 'keys7'], arms: { l: 'hold', r: 'hold' }, grip: hands, hold: {} }));
    if (run && W.walk > .2) { r.arms = { l: 'run', r: 'run' }; r.grip = undefined; }
    if (bounce > 0) { r.squash = .06 * bounce * Math.max(0, Math.sin(lt * 14)); r.plant = true; }
    return r;
  });
}
function lemonOpts(lt) {
  return memoed('lemon@' + lt.toFixed(5), () => {
    const W = walkOf('lemon', lt), o = W.o;
    const idle = K([[0, -.9], [5.15, -.88], [5.5, .5], [5.7, 1.0], [6.7, 1.0], [7.1, .8], [9, .6], [12, .6]], lt);
    const yaw = faceYaw(W, idle, 1.12), dirF = dirOfYaw(yaw), h = hasPlate('lemon', lt), sp = spotOf('lemon', lt);
    const peel = lt > Q.peel1 - .3 && lt < Q.peel1 + .5 ? Math.sin(PI * sg(lt, Q.peel1 - .3, Q.peel1 + .5)) : 0;
    const padK = lt < 3.4 ? ss(lt, 3.2, 3.4) : 1 - ss(lt, 5.28, 5.4), rr = restHand('lemon', o, yaw, 'r');
    const gest = { r: lerpS(rr, [rr[0] - 10, rr[1] - 34 - 22 * peel], padK) };                         /* the pad in her screen-right hand */
    const hands = handsGen('lemon', o, yaw, sp, h, gest);
    let hy = lt < 4.3 ? yaw - .05 : lt < 5.2 ? yaw + .05 : yaw;
    let look = lt < 4.6 ? [-.7, .05] : lt < 5.3 ? [-.3, .5] : lt < 6.7 ? [.7, 0] : [.65, 0];
    if (lt > 6.9) { const w = watch(o, lt, yaw); hy = w.hy; look = w.look; }
    return A7.lemon(Object.assign(o, { yaw, headYaw: hy, look, expr: 'neutral', lid: .3, acc: ['readers', 'lanyard7'], face: { curve: .02 }, who: 'lemon', arms: { l: 'hold', r: 'hold' }, grip: hands, hold: padK > .02 ? { r: 'fp19p_pad' } : {}, padK, browUp: lt > 4.1 && lt < 4.7 ? 2 : 0 }));
  });
}
function tomOpts(lt) {
  return memoed('tom@' + lt.toFixed(5), () => {
    const W = walkOf('tom', lt), o = W.o;
    const idle = K([[0, -.5], [6.5, -.55], [7.0, -.5], [7.8, 0], [8.1, .6], [9.0, .6], [9.3, .1], [10, .0]], lt);
    const yaw = faceYaw(W, idle, .95), dirF = dirOfYaw(yaw), h = hasPlate('tom', lt), sp = spotOf('tom', lt);
    const dance = lt >= B.walk3[0] - .1 && lt < B.walk3[1] ? 1 : 0, bop = Math.sin(lt * 15);
    const up = lt < 6.6 ? ss(lt, 5.9, 6.2) * (1 - ss(lt, 6.4, 6.7)) : 0;                        /* the squeal: both hands up when she sees the plate coming */
    const cheer = ss(lt, 6.9, 7.2) * (1 - ss(lt, 9.0, 9.2)), wR = ss(yaw, -.15, .15);
    const rl = restHand('tomato', o, yaw, 'l'), rr = restHand('tomato', o, yaw, 'r'), cheerT = [-dirF * 100, -80];
    const gest = { l: lerpS(lerpS(rl, [-60, -90], up), cheerT, cheer * wR), r: lerpS(lerpS(rr, [60, -90], up), cheerT, cheer * (1 - wR)) };
    const hands = handsGen('tomato', o, yaw, sp, h, gest);
    let hy = lt < 6.4 ? yaw - .05 : lt < 7.9 ? yaw + .35 * ss(lt, 7.4, 7.8) : yaw, look = lt < 7.7 ? [-.6, -.1] : [.5, -.1];
    if (lt > 9.1) { const w = watch(o, lt, yaw); hy = w.hy; look = w.look; }
    return A15.tomato(Object.assign(o, { tomPose: 'fruit', yaw, headYaw: hy, look, who: 'tom', arms: { l: 'hold', r: 'hold' }, grip: hands, hold: {},
      rot: dance ? .08 * Math.sin(lt * 7.5) : 0, squash: dance ? .05 * Math.max(0, Math.sin(lt * 15)) : 0, plant: true }));
  });
}
function onionOpts(lt) {
  return memoed('onion@' + lt.toFixed(5), () => {
    const W = walkOf('onion', lt), o = W.o;
    const idle = K([[0, -.55], [9.0, -.55], [9.5, -.4], [10.6, -.35], [11.1, .3], [12.4, .8], [13, .8], [16, .8]], lt);
    const yaw = faceYaw(W, idle, 1.12), h = hasPlate('onion', lt), sp = spotOf('onion', lt), d = dirC(yaw);
    const pl = plateFromBody(Object.assign({ kind: 'onion' }, o), yaw, sp, 'onion'), c = bodyCentre(Object.assign({ kind: 'onion' }, o));
    const rest = side => restHand('onion', o, yaw, side), pr = Math.min(ss(lt, 9.4, 9.8), 1 - ss(lt, 10.75, 11.1));
    const hp = probeHandle(pl), probe = clampReach('onion', yaw, 'r', [(hp.x - c[0]) / o.s, (hp.y - c[1]) / o.s]);
    const carryL = [d * sp[0] - 42, sp[1] + 6], carryR = [d * sp[0] + 42, sp[1] + 6];
    const hands = { l: clampReach('onion', yaw, 'l', lerpS(rest('l'), carryL, eo(h))), r: clampReach('onion', yaw, 'r', lerpS(lerpS(rest('r'), carryR, eo(h)), probe, pr)) };
    const sob = Math.max(0, 1 - Math.abs(lt - (Q.sniffle + .12)) / .5);
    let hy = lt < 9.3 ? yaw - .1 : lt < 11.1 ? yaw + .1 : yaw;
    let look = lt < 9.2 ? [-.6, .1] : lt < 11.2 ? [-.3, .6] : lt < 12.5 ? [.6, .1] : [.7, .1];
    if (lt > 12.95) { const w = watch(o, lt, yaw); hy = w.hy; look = w.look; }
    return A15.onion(Object.assign(o, { pose: 'free', yaw, headYaw: hy, look, who: 'onion', arms: { l: 'hold', r: 'hold' }, grip: hands, hold: {}, expr: 'onion_cry', cry: .6 + .25 * sob, sob }));
  });
}
const PEAR = { x: T.pear.x(0), s: SC.pear, dir: -1, lane: FY + 30 };
function pearOpts(lt) {
  return memoed('pear@' + lt.toFixed(5), () => {
    const h = hasPlate('pear', lt), sp = spotOf('pear', lt);
    const lean = ss(lt, 12.3, 12.8) * (1 - ss(lt, 14.1, 14.6)), peer = ss(lt, 12.5, 12.9) * (1 - ss(lt, 14.0, 14.3));
    const o = { x: PEAR.x + 8 * PEAR.s, y: PEAR.lane - 76 * PEAR.s, s: PEAR.s * .96, t: lt, noLegs: true, plant: true, noReflect: true, noShadow: true };
    const hands = { l: clampReach('pear', -1, 'l', lerpS([-60, 80], [-94, 66], eo(h))), r: clampReach('pear', -1, 'r', lerpS([20, 84], [-30, 76], eo(h))) };
    const yaw = K([[0, -.9], [11.5, -.9], [12.2, -1.05], [14.3, -1.0], [14.6, -.85]], lt);
    const hy = yaw + (lt < 12.4 ? .15 : 0) + .12 * peer;
    let look = lt < 12.4 ? [-.5, .05] : lt < 14.0 ? [-.5, .55 * peer + .1] : [-.2, .1], hy2 = hy;
    if (lt < 12.4) { const w = watch({ x: PEAR.x }, lt, yaw, .6); hy2 = w.hy; look = [w.look[0], .05]; }
    const expr = lt < 12.5 ? 'neutral' : lt < 14.0 ? 'hopeful' : 'sad';
    return A7.pear(Object.assign(o, { yaw, headYaw: hy2, look, expr, who: 'pear', arms: { l: 'hold', r: 'hold' }, grip: hands, hold: {}, rot: -.1 * lean, browUp: 6 * peer }));
  });
}
const STRAW = { x: T.straw.x(0), s: SC.straw };
function strawOpts(lt) {
  return memoed('straw@' + lt.toFixed(5), () => {
    const o = { x: STRAW.x, y: FYL, s: STRAW.s, t: lt }, yaw = K([[0, -.4], [17.4, -.4], [18.0, -.32], [19.8, -.36], [20.5, -.3]], lt);
    const up = ss(lt, Math.max(20.4, B.s2[0] + .35), B.s2[0] + .75);                            /* "What time is it?": she looks up */
    const glance = ss(lt, 17.0, 17.6) * (1 - ss(lt, 20.4, 20.8)), look0 = ss(lt, 19.3, 19.8);
    const hy = yaw + .2 * glance * 0 - .06 * up;
    const look = up > .3 ? [-.1, -.95] : glance > .3 ? [-.65, .1] : look0 > .3 ? [-.5, .45] : [-.5, .35];
    const pour = Math.sin(lt * 3.1) * .5 + .5;
    const hands = { l: clampReach('straw', yaw, 'l', [-100, 36 + 6 * Math.sin(lt * 1.3)]), r: clampReach('straw', yaw, 'r', [2, 76 + 8 * pour]) };
    const acc = lt >= 21.3 ? ['steth', 'bandage7'] : undefined;                                  /* the PER DIEM badge would be cut by the frame edge in the tilt: it is gone by then */
    return A11.straw(Object.assign(o, acc ? { acc } : null, { yaw, headYaw: hy, look, expr: 'dead', lid: .5 - .22 * up, plant: true, who: 'straw', arms: { l: 'hold', r: 'hold' }, grip: hands, hold: { r: 'fp19p_medcup' }, cupScale: 1.2, cupTip: .5 * Math.sin(lt * 3.1) * (1 - up), squash: .05 * ss(lt, 19.9, 20.2) * (1 - ss(lt, 20.4, 20.8)) }));
  });
}
const CAST = { mango: mangoOpts, lemon: lemonOpts, tom: tomOpts, onion: onionOpts, pear: pearOpts, straw: strawOpts };
/* the world position of a hand (a grip target of a character): body centre plus the target, scaled */
const handWorld = (o, g) => { const c = bodyCentre(o); return [c[0] + g[0] * o.s, c[1] + g[1] * o.s]; };
// ------------------------------------------------------------------ the plate
const PS = .8;                                                       /* kit units -> world px: the plate is 240 px wide */
const RAIL = { x: 300, y: 1050 };                                  /* where it clinks down on the pass-through's tray rail (bottom centre) */
const CARTP = { x: 4620, y: 1026 };                                /* where Mango sets it on the med cart */
function heldPlate2(who, lt) {
  const o = CAST[who](lt), sp = spotOf(who, lt), d = who === 'pear' ? -1 : dirC(o.yaw), c = bodyCentre(o);
  return { x: c[0] + d * sp[0] * o.s, y: c[1] + sp[1] * o.s, rot: d * sp[2], o };
}
/* the world pose of the plate's bottom centre: { x, y, rot, sx, sy, phase } */
function plateAt(lt) {
  const p = phaseAt(lt); let x, y, rot = 0, sx = 1, sy = 1, ph = p.k;
  if (p.k === 'slide') { const u = eo(sg(lt, p.t0, p.t1)); x = mx(HOLE_K[0] - 130, RAIL.x, u); y = RAIL.y; }
  else if (p.k === 'rest') { x = RAIL.x; y = RAIL.y; const b = pulse(lt, Q.plateclink, 34, .09); sy = 1 - .07 * b; sx = 1 + .04 * b; y -= 2 * Math.abs(b); }
  else if (p.k === 'lift') {
    const u = ss(lt, p.t0, p.t1), a = { x: RAIL.x, y: RAIL.y }, hp = heldPlate2(p.to, lt), e = u * u * (3 - 2 * u);
    x = mx(a.x, hp.x, e); y = mx(a.y, hp.y, e) + 96 * Math.sin(PI * e); rot = hp.rot * e;      /* a U: down and across below her face, then up beside it */
  } else if (p.k === 'held') {
    const hp = heldPlate2(p.who, lt); x = hp.x; y = hp.y; rot = hp.rot;
    const tc = catchT(lt);
    if (tc != null && lt >= tc) { const a = lt - tc, bn = Math.exp(-a * 8) * Math.sin(a * 25); y += 9 * bn; sy = 1 - .06 * bn; sx = 1 + .04 * bn; }
  } else if (p.k === 'fly') {
    const u = (lt - p.t0) / (p.t1 - p.t0), e = u * u * (3 - 2 * u), a = heldPlate2(p.from, lt), b2 = heldPlate2(p.to, lt);
    x = mx(a.x, b2.x, e); y = mx(a.y, b2.y, e) - 70 * Math.sin(PI * u); rot = mx(a.rot, b2.rot, e) + .14 * Math.sin(PI * u) * Math.sign(b2.x - a.x || 1);
    sx = 1 + .05 * Math.sin(PI * u); sy = 1 - .04 * Math.sin(PI * u);
  } else if (p.k === 'set') {
    const u = ss(lt, p.t0, p.t1), a = heldPlate2(p.from, lt); x = mx(a.x, CARTP.x, u); y = mx(a.y, CARTP.y, u) - 18 * Math.sin(PI * u);
    if (u >= .999) sy = 1 - .05 * pulse(lt, p.t1, 30, .09);
  } else { x = CARTP.x; y = CARTP.y; const b = pulse(lt, PHASES[PHASES.length - 2].t1, 30, .09); sy = 1 - .05 * b; y -= 1.5 * Math.abs(b); }
  return { x, y, rot, sx, sy, phase: ph, p };
}
/* kit-unit anchors on the plate (origin = the plate's bottom centre; y up is negative): the turkey mold sits front left, the roll front right, the pie back left, the coffee pudding back right */
/* the low items at the two ends, the tall ones in the middle: whichever way the holder faces, the face is clear of the tall food (dx, dy move each item from its slot) */
const ITEMS = [{ kind: 'pieMold', dx: -26, dy: 22 }, { kind: 'roll', dx: 42, dy: -7 }, { kind: 'turkeyMold', shine: .8, dx: 32, dy: 5 }, { kind: 'coffee', thick: 1, fill: .92, k: .66, dx: -38, dy: -6 }];
const ISC = 1.04;
const STK_AT = { hold: [74, -38], fun: [-92, -20], label: [-8, 20] };       /* centres of the three stickers (kit units) */
const TURKEY_TOP = [-14, -60];                                       /* where the probe goes in */
const probeK = lt => ss(lt, 9.5, 10.0);                              /* 0 away .. 1 stuck in */
const probeBase = TURKEY_TOP, probeTip = [6, -80];                /* the rod from the base to the handle */
const steamK = lt => .9 * (1 - ss(lt, 3.5, 9.0));
function stuckStickers(lt) {
  return [{ kind: 'note', text: 'HOLD', at: [(STK_AT.hold[0] + 150) / 300, (STK_AT.hold[1] + 56) / 76], s: .62, rot: .1, t0: ST.hold },
    { kind: 'sticker', text: 'FUN COMMITTEE', at: [(STK_AT.fun[0] + 150) / 300, (STK_AT.fun[1] + 56) / 76], s: .5, rot: -.12, t0: ST.fun },
    { kind: 'label', text: 'CONTAINS: BREAD', at: [(STK_AT.label[0] + 150) / 300, (STK_AT.label[1] + 56) / 76], s: .6, rot: .03, t0: ST.label }];
}
/* a stand-in plate when the food kit is not loaded (never in the shipped episode): a paper plate with four blobs */
function plateStandIn() {
  ctx.fillStyle = '#f6f2e8'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, -18, 150, 38, 0, 0, TAU); ctx.fill(); ctx.stroke();
  for (const [x, y, w, h, c] of [[-46, 0, 60, 46, '#d9c7a3'], [44, 2, 46, 28, '#d49a4c'], [-60, -24, 60, 24, '#d9c7a3'], [64, -26, 40, 44, '#a07a4c']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - h / 2, w / 2, h / 2, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
}
/* the probe thermometer in the turkey: a short rod, a grip, a head with the LCD and the readout (dressing text) */
function drawProbe(lt, k) {
  const read = lt < ST.reading ? Math.round(mx(58, 77, ss(lt, ST.probeIn + .1, ST.reading))) : 78, shown = lt >= ST.probeIn + .1, beep = lt >= ST.reading ? Math.max(0, 1 - (lt - ST.reading) / .7) : 0;
  const dy = k < 1 ? -90 * (1 - eb(k)) - 70 * (1 - k) : 0;
  ctx.save(); ctx.translate(probeBase[0], probeBase[1]); ctx.translate(0, dy);
  const hx = probeTip[0] - probeBase[0], hy = probeTip[1] - probeBase[1];
  ctx.lineCap = 'round'; ctx.strokeStyle = OUTL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, hy); ctx.stroke(); ctx.strokeStyle = '#dfe5ec'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.translate(hx, hy); ctx.rotate(.1);
  ctx.fillStyle = '#23242b'; rrp(-7, -14, 14, 16, 4); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.6; ctx.stroke();                          /* the grip */
  rrp(-25, -40, 50, 28, 6); ctx.fillStyle = '#2d2f38'; ctx.fill(); ctx.stroke();                                                                  /* the head with the LCD */
  rrp(-20, -36, 40, 20, 3); ctx.fillStyle = beep > 0 ? mixHex('#b6d49a', '#eaffd0', beep) : '#a9c48f'; ctx.fill();
  if (beep > 0) V2.glow(0, -26, 46, '190,255,150', .55 * beep, 'screen', .3);
  if (shown) UI.label(read + '\u00b0F', 0, -26, { size: 15, weight: 900, fill: '#1f3a14', maxW: 36, hero: false, crop: true, tilt: .8 });
  ctx.restore();
}
/* a flying sticker (before it is stuck): from `from` to `to` in plate-local kit units, over [t0, t1]; it lands at 1.3x the stuck size and the kit's own slap takes over at t0 */
/* where a sticker comes from, in plate-local kit units: the hand that peeled it (Lemon's pad hand, Tomato's free hand, Onion's right hand), so it leaves the hand and lands on the plate */
const worldToPlate = (st, wx, wy) => { const c = Math.cos(-(st.rot || 0)), sn_ = Math.sin(-(st.rot || 0)), dx = wx - st.x, dy = wy - st.y; return [(c * dx - sn_ * dy) / (PS * st.sx), (sn_ * dx + c * dy) / (PS * st.sy)]; };
function flyFrom(kind, lt, st) {
  if (kind === 'hold') { const o = CAST.lemon(lt), h = handWorld(o, o.grip.r); return worldToPlate(st, h[0], h[1] - 30 * o.s); }
  if (kind === 'fun') { const o = CAST.tom(lt), h = handWorld(o, o.grip[NEAR(dirOfYaw(o.yaw))]); return worldToPlate(st, h[0], h[1] - 24 * o.s); }
  const o = CAST.onion(lt), h = handWorld(o, o.grip.r); return worldToPlate(st, h[0], h[1]);
}
function flySticker(lt, kind, text, t0, t1, from, to, s1, rot) {
  if (lt < t0 || lt >= t1) return;
  const u = (lt - t0) / (t1 - t0), e = u * u * (3 - 2 * u), f = F();
  if (f) f.sticker(ctx, { kind, text, x: mx(from[0], to[0], e), y: mx(from[1], to[1], e) - 40 * Math.sin(PI * u), s: s1 * mx(.5, 1.3, e), rot: rot + .22 * (1 - e), t: lt });
}
/* the plate and everything on it, in world space at the pose st */
function drawPlate(lt, st) {
  const f = F();
  ctx.save(); ctx.translate(st.x, st.y); if (st.rot) ctx.rotate(st.rot); ctx.scale(PS * st.sx, PS * st.sy);
  const stab = lt >= ST.probeIn && lt < ST.probeIn + .4 ? Math.sin(PI * sg(lt, ST.probeIn, ST.probeIn + .4)) : 0;
  if (stab) ctx.transform(1 - .03 * stab, 0, .06 * stab, 1 - .05 * stab, 0, 0);
  if (f) {
    f.dish(ctx, 'plate', { x: 0, y: 0, s: 1, t: lt, seed: 4, items: ITEMS, itemScale: ISC, shadow: false, steam: 0, stickers: stuckStickers(lt) });
    const sk = steamK(lt); if (sk > .02) f.steam(ctx, { x: -44, y: -72, w: 60, h: 190, t: lt, seed: 7, power: sk, curl: .6 });
  } else plateStandIn();
  const pk = probeK(lt); if (pk > 0) drawProbe(lt, pk);
  if (lt >= Q.peel1 && lt < ST.hold) flySticker(lt, 'note', 'HOLD', Q.peel1, ST.hold, flyFrom('hold', lt, st), STK_AT.hold, .62, .1);
  if (lt >= Q.peel2 && lt < ST.fun) flySticker(lt, 'sticker', 'FUN COMMITTEE', Q.peel2, ST.fun, flyFrom('fun', lt, st), STK_AT.fun, .5, -.12);
  if (lt >= ST.label - .22 && lt < ST.label) flySticker(lt, 'label', 'CONTAINS: BREAD', ST.label - .22, ST.label, flyFrom('label', lt, st), STK_AT.label, .6, .03);
  ctx.restore();
}
const probeHandle = st => ({ x: st.x + (probeTip[0] + 4) * PS * st.sx, y: st.y + (probeTip[1] - 24) * PS * st.sy });
/* a plate-local point (kit units) in world coordinates at the pose st */
function plateLocal(st, px, py) {
  const c = Math.cos(st.rot || 0), s = Math.sin(st.rot || 0), x = px * PS * st.sx, y = py * PS * st.sy;
  return [st.x + c * x - s * y, st.y + s * x + c * y];
}
// ------------------------------------------------------------------ held props (copied from ep18_station.js's fp18_medcup under this prefix) and a sticky-note pad
EXT.prop.fp19p_medcup = (side, o, t) => {
  const S = o.cupScale || 1;
  ctx.save(); ctx.rotate((o.cupTip || 0) - .08); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = '#f7f7f1'; ctx.strokeStyle = 'rgba(25,16,30,.88)'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(14, -20); ctx.lineTo(10, 3); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,120,130,.55)'; ctx.lineWidth = 1.2; for (const x of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x * 1.2, -18); ctx.lineTo(x * .8, 1); ctx.stroke(); }
  for (const [x, y, c] of [[-6, -21, '#f4a3b8'], [2, -23, '#ffffff'], [8, -20, '#7fc8f8']]) { ctx.fillStyle = c; ctx.strokeStyle = 'rgba(25,16,30,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y, 4.4, 3.2, .3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp19p_medcup = Object.assign([-20, -34, 20, 8], { nearFace: true });
EXT.prop.fp19p_pad = (side, o, t) => {                                /* a pad of yellow sticky notes held flat in a hand */
  ctx.save(); ctx.rotate(-.1 * side); ctx.lineJoin = 'round';
  ctx.fillStyle = '#e8b81c'; ctx.strokeStyle = 'rgba(25,16,30,.85)'; ctx.lineWidth = 2.2; rrp(-18, -28, 36, 30, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe45c'; rrp(-18, -34, 36, 14, 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,90,10,.5)'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-14, -18 + i * 5); ctx.lineTo(14, -18 + i * 5); ctx.stroke(); }
  ctx.restore();
};
PROP_BOX.fp19p_pad = Object.assign([-20, -36, 20, 4], { nearFace: true });

// ------------------------------------------------------------------ Binder on the plate's rim, the PENDING tag, the party popper's confetti, Onion's tear
function drawBinder(lt, st) {
  if (lt < Q.binderpop) return;
  const a = lt - Q.binderpop, k = eb(c01(a / .3)), s = .4 * k;
  if (s < .02) return;                                                 /* never at scale 0 (the first frame of the pop) */
  const [bx, by] = plateLocal(st, 126, -16), hop = Math.sin(PI * c01(a / .3)) * 26 * (1 - c01(a / .3)), talk = lt >= B.b1[0] && lt < B.b1[1];
  const grin = ss(lt, B.b1[0], B.b1[0] + .2) * (1 - ss(lt, B.b1[1] + .1, B.b1[1] + .5)), pose = talk ? 'cheer' : 'ears';
  if (a < .6) { V2.sparks(bx, by - 30, lt, Q.binderpop, { n: 16, speed: 360, life: .55, color: '255,236,150', size: 4, seed: 11, g: 500 }); V2.ring(bx, by - 30, a / .6, { r0: 10, r1: 110, color: '255,236,170', lw: 5, alpha: .7 * (1 - a / .6), bloom: 0 }); }
  const mp = ctx.getTransform().transformPoint(new DOMPoint(bx, by - 26 * s - hop)), rb = 130 * s * FR.cam.z, tr = mp.x - rb < 14 || mp.x + rb > 1066 || mp.y - rb < 14 || mp.y + rb > 1906;
  try { drawChar(A15.binderSmall({ x: bx, y: by - 26 * s - hop, s, transit: tr, center: true, noLegs: true, who: 'bind', t: lt, yaw: 0, pose, grin: .3 + .6 * grin, glint: grin * Math.max(0, Math.sin(lt * 14)), look: lt < 17.5 ? [.4, -.1] : [-.2, .4], hover: 4, rot: st.rot * .6 })); } catch (e) { console.error('binder: ' + e.message); }
  if (a > .12) { const sw = Math.exp(-a * 1.1) * .32 * Math.sin(a * 7.5), k2 = ss(a, .12, .3); hangTag(bx + 58, by + 30, .42 * k2, sw + .1, 'PENDING'); }
}
function hangTag(x, y, s, rot, text) {                                  /* the PENDING hang tag (own drawing: the kit's tag text does not fit at this size) */
  const w = 112, h = 74;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-w / 2 + 18, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(-w / 2, -h / 2 + 18); ctx.closePath();
  ctx.fillStyle = lgr(0, -h / 2, 0, h / 2, [[0, '#f8f0da'], [1, '#e6d8b4']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.beginPath(); ctx.arc(-w / 2 + 20, -h / 2 + 18, 5.2, 0, TAU); ctx.fillStyle = 'rgba(70,56,36,.8)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-w / 2 + 20, -h / 2 + 18); ctx.bezierCurveTo(-w / 2 - 6, -h / 2 - 10, -w / 2 - 34, -h / 2 - 22, -w / 2 - 44, -h / 2 - 10); ctx.lineWidth = 3; ctx.strokeStyle = '#8a7a58'; ctx.stroke();
  UI.label(text, 6, 8, { size: 23, weight: 900, fill: '#2f2418', maxW: w - 34, hero: false, crop: true, tilt: .7 });
  ctx.restore();
}
function confetti(lt, x, y, t0, n = 64) {
  const a = lt - t0; if (a < 0 || a > 1.6) return;
  if (a < .14) V2.glow(x, y, 160 * (1 - a / .14) + 60, '255,240,190', .9 * (1 - a / .14), 'screen', .7);
  const cols = ['#ff4d6d', '#ffd23f', '#3ddc97', '#4cc9f0', '#b980f0', '#ff9f1c'];
  ctx.save();
  for (let i = 0; i < n; i++) {
    const ang = -PI / 2 + (sr(i, 1) - .5) * 1.7, v = 380 + sr(i, 2) * 520, dr = Math.exp(-a * 2.2), d = v * (1 - dr) / 2.2, px = x + Math.cos(ang) * d + 18 * Math.sin(a * 7 + i), py = y + Math.sin(ang) * d + 520 * a * a;
    const fade = 1 - ss(a, 1.0, 1.6); if (fade <= 0) continue;
    ctx.save(); ctx.globalAlpha *= fade; ctx.translate(px, py); ctx.rotate(a * (5 + sr(i, 3) * 9) + i); ctx.scale(Math.abs(Math.cos(a * 9 + i)) * .8 + .2, 1);
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-6, -3.5, 12, 7); ctx.restore();
  }
  for (let i = 0; i < 3; i++) {                                         /* streamers: curling ribbons */
    const ang = -PI / 2 + (i - 1) * .55, len = 190 * (1 - Math.exp(-a * 5)), fade = 1 - ss(a, .9, 1.5);
    ctx.save(); ctx.globalAlpha *= fade; ctx.strokeStyle = cols[(i * 2) % cols.length]; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
    for (let j = 0; j <= 14; j++) { const u = j / 14, w = Math.sin(u * 9 + a * 6 + i * 2) * 14 * u; ctx.lineTo(x + Math.cos(ang) * len * u - Math.sin(ang) * w, y + Math.sin(ang) * len * u + Math.cos(ang) * w + 120 * a * a * u); }
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}
function popper(lt, hx, hy) {                                           /* the party popper cone in Tomato's hand until it pops */
  const t0 = snapT(7.76); if (lt < 7.1 || lt >= t0 + .08) return;
  const k = ss(lt, 7.1, 7.4), pulled = lt >= t0 - .25 ? Math.min(1, (lt - (t0 - .25)) / .25) : 0;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(-.35 - .1 * pulled); ctx.scale(k, k);
  ctx.fillStyle = '#ff4d6d'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(4, -48); ctx.lineTo(-4, -48); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(-7, -14, 14, 6); ctx.fillStyle = '#4cc9f0'; ctx.fillRect(-6, -30, 12, 5);
  ctx.strokeStyle = '#8a7a58'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14 + 20 * pulled, 20, 8 + 40 * pulled, 30 + 14 * pulled); ctx.stroke();
  ctx.restore();
}
function tearDrop(lt, x0, y0, x1, y1) {                                  /* Onion's big tear falls onto the beige turkey at the sniffle */
  const t0 = Q.sniffle - .02, a = lt - t0; if (a < 0 || a > .62) return;
  const u = c01(a / .36), px = mx(x0, x1, u), py = mx(y0, y1, u * u) - 8 * Math.sin(PI * u);
  if (a < .36) { ctx.save(); ctx.fillStyle = 'rgba(170,215,255,.92)'; ctx.strokeStyle = 'rgba(60,110,170,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py - 15); ctx.quadraticCurveTo(px + 9, py + 2, px, py + 9); ctx.quadraticCurveTo(px - 9, py + 2, px, py - 15); ctx.fill(); ctx.stroke(); ctx.restore(); }
  else { const r = (a - .36) / .26; V2.ring(x1, y1, r, { r0: 6, r1: 46, color: '190,225,255', lw: 4, alpha: .6 * (1 - r), bloom: 0 }); }
}
// ------------------------------------------------------------------ THE SET: a flat elevation with parallax layers (see the header). All coordinates are world units; Y(h) = the world y of a height h above the floor line.
const CEIL = 110;                                                       /* the ceiling line (never inside the frame except at the final tilt) */
const rct = (x, y, w, h, fill, line, lw = 3, r = 0) => {
  if (r) rrp(x, y, w, h, r); else { ctx.beginPath(); ctx.rect(x, y, w, h); }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
};
const vis = (a, b) => b > FR.x0 && a < FR.x1;
/* a wall painted from x0 to x1 with holes (the window openings): `paint` draws inside the clip */
function wallPaint(x0, x1, holes, paint) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, CEIL, x1 - x0, FY - CEIL + 2);
  for (const h of holes) ctx.rect(h[0], h[1], h[2] - h[0], h[3] - h[1]);
  ctx.clip('evenodd'); paint(); ctx.restore();
}
/* a parallax layer: content defined in layer coordinates that move with factor p of the camera (p < 1 = farther than the wall); fn(a, b) draws the layer's visible range [a, b] */
function layer(p, fn) { const cam = FR.cam; ctx.save(); ctx.translate(cam.x * (1 - p), 0); fn(p * cam.x - 560 / cam.z - 140, p * cam.x + 560 / cam.z + 140); ctx.restore(); }
const textDress = (str, cx, cy, o) => UI.label(str, cx, cy, Object.assign({ hero: false, crop: true, weight: 900 }, o));

/* ---- the far layers, seen only through the holes in the wall */
const HOLE_K = [40, Y(600), 640, Y(150)];                              /* the pass-through window */
const HOLE_H = [3070, Y(740), 3470, Y(250)];                           /* hall B's window */
const HOLE_C = [4180, Y(580), 4560, FY];                               /* corridor C's alcove: a far hallway */
function farKitchen(lt) {
  ctx.save(); ctx.beginPath(); ctx.rect(HOLE_K[0], HOLE_K[1], HOLE_K[2] - HOLE_K[0], HOLE_K[3] - HOLE_K[1]); ctx.clip();
  const warm = rgr(340, Y(420), 20, 420, [[0, 'rgba(255,190,110,.5)'], [1, 'rgba(255,190,110,0)']]);
  V2.dof(2.2, () => layer(.72, (a, b) => {
    ctx.fillStyle = lgr(0, Y(620), 0, Y(130), [[0, '#d9e6df'], [1, '#aab9b4']]); ctx.fillRect(a, Y(620), b - a, 520);
    ctx.strokeStyle = 'rgba(80,110,104,.35)'; ctx.lineWidth = 2; for (let x = Math.floor(a / 60) * 60; x < b; x += 60) { ctx.beginPath(); ctx.moveTo(x, Y(620)); ctx.lineTo(x, Y(160)); ctx.stroke(); }
    for (let y = Y(620); y < Y(160); y += 60) { ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke(); }
    /* the hood and its heat lamps, a steel shelf with stacked pans, hanging ladles */
    rct(a, Y(640), b - a, 70, lgr(0, Y(640), 0, Y(570), [[0, '#c9d1d8'], [1, '#8f9aa6']]), OUTL, 2);
    for (let x = Math.floor(a / 220) * 220; x < b; x += 220) {
      const i = Math.round(x / 220);
      rct(x + 40, Y(420), 150, 14, '#aeb8c2', OUTL, 2); for (let j = 0; j < 3 + (i & 1); j++) rct(x + 54 + j * 36, Y(420) - 30 - j * 4, 30, 30, ['#c9ced4', '#b0b7bf', '#d6a05a', '#9aa3ac'][(i + j) & 3], OUTL, 2, 4);
      ctx.strokeStyle = '#7c8791'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 110, Y(570)); ctx.lineTo(x + 110, Y(520)); ctx.stroke();
      ctx.fillStyle = '#9aa3ac'; ctx.beginPath(); ctx.ellipse(x + 110, Y(500), 12, 18, 0, 0, TAU); ctx.fill(); ctx.stroke();
      rct(x + 30, Y(300), 170, 130, lgr(0, Y(300), 0, Y(170), [[0, '#b9c3cc'], [1, '#8a95a1']]), OUTL, 2, 6);
    }
    ctx.fillStyle = 'rgba(255,170,70,.9)'; ctx.fillRect(a, Y(575), b - a, 8); V2.glow(340 * .72 + 0, Y(560), 380, '255,160,60', .35, 'screen', .5);
    if (window.A19 && A19.chef) {                                         /* Chef Cabbage stands at the pass in the back of the kitchen, deadpan, and pushes the plate out (REG suppressed: he is dressing) */
      REG.suppress++;
      try {
        const px = .72 * 150;
        drawChar(A19.chef({ x: px, y: 1099, s: 1.0, t: lt, noLegs: true, yaw: .55, headYaw: .35, look: [.6, .2], expr: lt < Q.plateclink + .25 ? 'chef_dry' : 'chef_proud', pose: 'rest', transit: true }));
      } catch (e) { console.error('chef: ' + e.message); } finally { REG.suppress--; }
    }
  }));
  /* steam from the pots in the kitchen (a haze) */
  ctx.fillStyle = warm; ctx.fillRect(HOLE_K[0], HOLE_K[1], HOLE_K[2] - HOLE_K[0], HOLE_K[3] - HOLE_K[1]);
  ctx.restore();
}
function farNight(lt) {
  ctx.save(); ctx.beginPath(); ctx.rect(HOLE_H[0], HOLE_H[1], HOLE_H[2] - HOLE_H[0], HOLE_H[3] - HOLE_H[1]); ctx.clip();
  layer(.3, (a, b) => {
    ctx.fillStyle = lgr(0, Y(760), 0, Y(240), [[0, '#0d1838'], [.6, '#223566'], [1, '#3b4c7e']]); ctx.fillRect(a, Y(760), b - a, 540);
    for (let i = Math.floor(a / 70) - 1; i < b / 70 + 1; i++) { const x = i * 70 + sr(i, 1) * 60, y = Y(330 + sr(i, 2) * 400), r = .8 + sr(i, 3) * 1.6; ctx.fillStyle = `rgba(255,248,220,${.35 + .5 * sr(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#0b1128'; for (let i = Math.floor(a / 120) - 1; i < b / 120 + 1; i++) { const bw = 80 + sr(i, 5) * 60, bh = 50 + sr(i, 6) * 120; ctx.fillRect(i * 120, Y(250) - bh, bw, bh + 4);
      ctx.fillStyle = '#ffd98a'; for (let j = 0; j < 4; j++) if (sr(i, 10 + j) > .55) ctx.fillRect(i * 120 + 10 + (j % 2) * 26, Y(250) - bh + 14 + Math.floor(j / 2) * 30, 10, 14); ctx.fillStyle = '#0b1128'; }
    /* the Moon, with a face, watching the plate go by (suppressed from the layout audit: it is a distant dressing) */
    const mxp = 3270 * .3 + 150;
    if (window.A7 && A7.moon) { REG.suppress++; try { A7.moon(mxp, Y(560), .55, { t: lt, suppress: false, expr: lt > 13.95 && lt < 14.8 ? 'sour' : 'neutral', look: lt > 12.4 && lt < 14.9 ? [.1, .7] : [0, .1] }); } finally { REG.suppress--; } }
    else { V2.glow(mxp, Y(560), 160, '230,235,255', .6, 'screen', .8); ctx.fillStyle = '#f4f0dc'; ctx.beginPath(); ctx.arc(mxp, Y(560), 52, 0, TAU); ctx.fill(); }
  });
  ctx.restore();
}
const LAMP = { on: lt => lt >= Q.callchime ? 1 : 0 };
function farHall(lt) {
  ctx.save(); ctx.beginPath(); ctx.rect(HOLE_C[0], HOLE_C[1], HOLE_C[2] - HOLE_C[0], HOLE_C[3] - HOLE_C[1]); ctx.clip();
  const on = lt >= Q.callchime ? 1 : 0, a0 = lt - Q.callchime, ring = on ? (a0 % 1.2) / 1.2 : 0;
  V2.dof(1.8, () => layer(.55, (a, b) => {
    ctx.fillStyle = lgr(0, Y(600), 0, Y(160), [[0, '#d9e8ee'], [1, '#a9c0c8']]); ctx.fillRect(a, Y(600), b - a, 440);
    ctx.fillStyle = lgr(0, Y(170), 0, Y(0), [[0, '#8a98a2'], [1, '#6a7782']]); ctx.fillRect(a, Y(170), b - a, 180);
    ctx.fillStyle = '#2f6f8c'; ctx.fillRect(a, Y(240), b - a, 70);
    const base = 4370 * .55;
    for (let k = -4; k <= 4; k++) {
      const x = base + k * 170 + 40, lampDoor = k === 0;
      rct(x, Y(420), 84, 252, '#b9906a', OUTL, 2, 3); rct(x + 8, Y(396), 68, 96, '#a67c56', null); rct(x + 8, Y(284), 68, 100, '#a67c56', null);
      rct(x + 28, Y(448), 28, 16, '#f2efe6', OUTL, 1.5, 2);                                                        /* the room plate */
      const lx = x + 42, ly = Y(470);
      const lr = lampDoor ? 13 : 9; ctx.fillStyle = lampDoor ? (on ? '#ff4a3a' : '#6a2a2a') : '#5f6a72'; ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(lx, ly, lr, PI, 0); ctx.lineTo(lx + lr, ly + 6); ctx.lineTo(lx - lr, ly + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (lampDoor && on) {
        V2.glow(lx, ly, 190 + 70 * Math.sin(a0 * 9) * Math.exp(-a0 * 1.2), '255,70,50', .95, 'screen', .7);
        ctx.strokeStyle = `rgba(255,90,70,${.8 * (1 - ring)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(lx, ly, 18 + 90 * ring, 0, TAU); ctx.stroke();
      }
    }
  }));
  ctx.restore();
}
/* ---- the floor: a band that fans from the vanishing point under the camera, a sheen under each ceiling light, a baseboard shadow */
const LIGHTS_X = []; for (let x = -1100; x < 6400; x += 380) LIGHTS_X.push(x + 150);
function drawFloor(lt, cam) {
  const x0 = FR.x0 - 60, x1 = FR.x1 + 60, hz = 380, vp = cam.x;
  const rooms = [[-3000, 900, '#9d978e', '#5a564f'], [900, 1900, '#7d7b98', '#3d3b57'], [1900, 2880, '#8c7a72', '#4b3f3c'], [2880, 4020, '#a07650', '#543826'], [4020, 9000, '#8c9ba7', '#4a5864']];
  for (const [a, b, c1, c2] of rooms) if (vis(a, b)) { const xa = Math.max(a, x0), xb = Math.min(b, x1); ctx.fillStyle = lgr(0, FY, 0, FY + 720, [[0, c1], [.5, mixHex(c1, c2, .55)], [1, c2]]); ctx.fillRect(xa, FY, xb - xa + 1, 720); }
  ctx.save(); ctx.beginPath(); ctx.rect(x0, FY, x1 - x0, 720); ctx.clip();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.075)';
  for (let x = Math.floor((x0 - 700) / 150) * 150; x < x1 + 700; x += 150) { ctx.beginPath(); ctx.moveTo(x, FY); ctx.lineTo(x + (x - vp) * 720 / hz, FY + 720); ctx.stroke(); }
  for (const d of [26, 70, 130, 210, 320, 470, 670]) { ctx.strokeStyle = `rgba(255,255,255,${.05 + d / 7000})`; ctx.beginPath(); ctx.moveTo(x0, FY + d); ctx.lineTo(x1, FY + d); ctx.stroke(); }
  for (const lx of LIGHTS_X) if (vis(lx - 260, lx + 260)) {
    ctx.fillStyle = rgr(lx, FY + 90, 10, 280, [[0, 'rgba(255,244,214,.24)'], [1, 'rgba(255,244,214,0)']]); ctx.save(); ctx.translate(lx, FY + 90); ctx.scale(1, .22); ctx.translate(-lx, -(FY + 90)); ctx.fillRect(lx - 290, FY - 200, 580, 600); ctx.restore();
    ctx.fillStyle = lgr(0, FY, 0, FY + 520, [[0, 'rgba(255,248,226,.10)'], [1, 'rgba(255,248,226,0)']]); ctx.fillRect(lx - 36, FY, 72, 520);
  }
  for (const bx of [900, 1900, 2880, 4020]) if (vis(bx - 40, bx + 40)) { ctx.fillStyle = 'rgba(214,220,228,.32)'; ctx.beginPath(); ctx.moveTo(bx - 7, FY); ctx.lineTo(bx + 7, FY); ctx.lineTo(bx + 7 + (bx + 7 - vp) * 720 / hz, FY + 720); ctx.lineTo(bx - 7 + (bx - 7 - vp) * 720 / hz, FY + 720); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = lgr(0, FY - 4, 0, FY + 30, [[0, 'rgba(10,8,16,.55)'], [1, 'rgba(10,8,16,0)']]); ctx.fillRect(x0, FY - 4, x1 - x0, 34);
}
/* ---- shared wall dressing */
function baseboard(a, b, col = '#e9e2d3') { rct(a, FY - 28, b - a, 28, col, null); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(a, FY - 4, b - a, 4); }
function handrail(a, b, h, col = '#b98c55') {
  rct(a, Y(h) - 12, b - a, 24, lgr(0, Y(h) - 12, 0, Y(h) + 12, [[0, mixHex(col, '#ffffff', .35)], [1, mixHex(col, '#000000', .25)]]), OUTL, 2.4, 10);
  for (let x = Math.ceil(a / 240) * 240; x < b; x += 240) { ctx.fillStyle = '#9aa3ae'; ctx.fillRect(x - 6, Y(h) + 10, 12, 30); }
}
function troffer(x, y, w = 240) { rct(x - w / 2, y, w, 22, '#f6f3ea', 'rgba(70,64,52,.5)', 2, 4); ctx.fillStyle = 'rgba(255,248,225,.9)'; ctx.fillRect(x - w / 2 + 8, y + 5, w - 16, 12); V2.glow(x, y + 30, 320, '255,240,200', .25, 'screen', .3); }
function door(x, w, h, leaf, o = {}) {
  const y0 = FY - h;
  rct(x - w / 2 - 14, y0 - 14, w + 28, h + 14, '#f1ebdd', OUTL, 3, 4);                                              /* the frame */
  rct(x - w / 2, y0, w, h, o.ajar ? '#27231f' : leaf, OUTL, 3.4);
  if (o.ajar) { ctx.fillStyle = lgr(x - w / 2, 0, x + w / 2, 0, [[0, 'rgba(255,214,150,.9)'], [1, 'rgba(255,214,150,.15)']]); ctx.fillRect(x - w / 2 + 4, y0 + 4, w * .3, h - 8); V2.glow(x, FY - h * .4, 190, '255,200,130', .35, 'screen', .5); }
  const lw = o.ajar ? w * .72 : w, lx = o.ajar ? x - w / 2 + w * .28 : x - w / 2;
  if (o.ajar) { ctx.beginPath(); ctx.moveTo(x - w / 2 + w * .28, y0); ctx.lineTo(x + w / 2, y0 - 6); ctx.lineTo(x + w / 2, FY + 6); ctx.lineTo(x - w / 2 + w * .28, FY); ctx.closePath(); ctx.fillStyle = leaf; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.stroke(); }
  if (!o.ajar || true) { const pw = lw * .74, px = lx + lw * .13; rct(px, y0 + h * .1, pw, h * .36, 'rgba(0,0,0,.13)', 'rgba(0,0,0,.25)', 2, 3); rct(px, y0 + h * .54, pw, h * .38, 'rgba(0,0,0,.13)', 'rgba(0,0,0,.25)', 2, 3); }
  ctx.fillStyle = '#c9d0d8'; ctx.strokeStyle = OUTL; ctx.lineWidth = 2; rrp(x + w / 2 - 36, FY - h * .5 - 7, 26, 14, 6); ctx.fill(); ctx.stroke();
  rct(x - 22, y0 - 40, 44, 22, '#f4f1e8', OUTL, 2, 3);                                                                 /* the room number plate (lettering is set dressing elsewhere) */
}
// ---- the kitchen pass-through (x < 900)
RAIL.y = Y(150);
function roomKitchen(lt, cam) {
  const a = -900, b = 900; if (!vis(a, b)) return;
  wallPaint(a, b, [HOLE_K], () => {
    ctx.fillStyle = lgr(0, CEIL, 0, FY, [[0, '#a9bfba'], [.45, '#d1e2dd'], [1, '#b9cdc7']]); ctx.fillRect(a, CEIL, b - a, FY - CEIL);
    ctx.strokeStyle = 'rgba(66,98,94,.26)'; ctx.lineWidth = 2;
    for (let x = Math.floor(FR.x0 / 70) * 70; x < FR.x1; x += 70) { ctx.beginPath(); ctx.moveTo(x, CEIL); ctx.lineTo(x, Y(150)); ctx.stroke(); }
    for (let y = Y(150); y > CEIL; y -= 70) { ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 14; i++) ctx.fillRect(Math.floor((FR.x0 + i * 130) / 70) * 70 + 2, CEIL + 140 + (i * 97) % 500, 66, 66);
    rct(a, Y(150), b - a, 150, lgr(0, Y(150), 0, FY, [[0, '#cfd7de'], [.2, '#aab5c0'], [1, '#808b97']]), null);      /* the stainless front */
    ctx.strokeStyle = 'rgba(40,52,64,.4)'; ctx.lineWidth = 2; for (let x = Math.floor(FR.x0 / 110) * 110; x < FR.x1; x += 110) { ctx.beginPath(); ctx.moveTo(x, Y(150)); ctx.lineTo(x, FY); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(a, Y(150) + 6, b - a, 4);
  });
  baseboard(a, b, '#6e7882');
  farKitchen(lt);
  /* the window: a steel frame, the ledge and the tray rail */
  rct(HOLE_K[0] - 14, HOLE_K[1] - 14, HOLE_K[2] - HOLE_K[0] + 28, HOLE_K[3] - HOLE_K[1] + 14, null, '#cfd6dd', 14, 0);
  rct(HOLE_K[0] - 14, HOLE_K[1] - 14, HOLE_K[2] - HOLE_K[0] + 28, HOLE_K[3] - HOLE_K[1] + 14, null, OUTL, 2.4, 0);
  rct(10, Y(150), 660, 22, lgr(0, Y(150), 0, Y(150) + 22, [[0, '#e3e8ee'], [1, '#98a3af']]), OUTL, 3, 4);
  ctx.strokeStyle = OUTL; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(30, Y(150) + 40); ctx.lineTo(650, Y(150) + 40); ctx.stroke();
  ctx.strokeStyle = '#d7dde4'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, Y(150) + 40); ctx.lineTo(650, Y(150) + 40); ctx.stroke();
  for (const x of [70, 610]) { ctx.fillStyle = '#9aa5b1'; ctx.strokeStyle = OUTL; ctx.lineWidth = 2.4; rrp(x - 9, Y(150) + 22, 18, 24, 4); ctx.fill(); ctx.stroke(); }
  /* a heat lamp bar over the window */
  rct(HOLE_K[0] - 20, HOLE_K[1] - 54, HOLE_K[2] - HOLE_K[0] + 40, 40, lgr(0, HOLE_K[1] - 54, 0, HOLE_K[1] - 14, [[0, '#d3dae1'], [1, '#8b97a3']]), OUTL, 3, 6);
  ctx.fillStyle = 'rgba(255,150,60,.95)'; rrp(HOLE_K[0] + 40, HOLE_K[1] - 36, HOLE_K[2] - HOLE_K[0] - 80, 12, 6); ctx.fill(); V2.glow(340, HOLE_K[1] - 10, 360, '255,150,60', .42, 'screen', .4);
  ctx.fillStyle = 'rgba(255,170,80,.2)'; ctx.beginPath(); ctx.moveTo(HOLE_K[0] + 60, HOLE_K[1] - 24); ctx.lineTo(HOLE_K[2] - 60, HOLE_K[1] - 24); ctx.lineTo(HOLE_K[2] + 20, Y(150)); ctx.lineTo(HOLE_K[0] - 20, Y(150)); ctx.closePath(); ctx.fill();
  /* PICK UP */
  ctx.strokeStyle = '#6a7580'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(290, CEIL); ctx.lineTo(290, Y(700)); ctx.moveTo(390, CEIL); ctx.lineTo(390, Y(700)); ctx.stroke();
  rct(250, Y(700), 180, 54, '#25303a', OUTL, 3, 8); textDress('PICK UP', 340, Y(673), { size: 34, fill: '#ffe27a' });
  /* the swing door to Dietary, a chalkboard, a vent */
  for (const [x0, flip] of [[780, 0], [860, 1]]) { rct(x0, Y(560), 76, 560, lgr(x0, 0, x0 + 76, 0, [[0, '#c5ced6'], [.5, '#e4eaf0'], [1, '#a2adb9']]), OUTL, 3.4); rct(x0 + 8, Y(150), 60, 130, 'rgba(0,0,0,.18)', null); ctx.fillStyle = 'rgba(255,214,150,.9)'; ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x0 + 38, Y(420), 24, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa5b1'; ctx.fillRect(x0 + (flip ? 8 : 52), Y(280), 16, 60); }
  V2.glow(858, Y(420), 150, '255,196,120', .3, 'screen', .4);
  rct(750, Y(610), 220, 34, '#25303a', OUTL, 2.4, 6); textDress('DIETARY', 860, Y(593), { size: 22, fill: '#e8eef2' });
  rct(-560, Y(620), 330, 330, '#2f4a3c', '#c8a56e', 10, 6);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const x = -520 + i * 18; ctx.beginPath(); ctx.moveTo(x, Y(560)); ctx.lineTo(x + 2, Y(520)); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-530, Y(552)); ctx.lineTo(-440, Y(530)); ctx.stroke();
  ctx.beginPath(); ctx.arc(-400, Y(450), 36, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-360, Y(468)); ctx.lineTo(-330, Y(500)); ctx.moveTo(-362, Y(446)); ctx.lineTo(-326, Y(456)); ctx.stroke();      /* a chalk turkey and a tally */
  for (const x of [-350, -310, -270]) { ctx.beginPath(); ctx.moveTo(x, Y(410)); ctx.lineTo(x, Y(380)); ctx.stroke(); }
  rct(-760, Y(520), 160, 90, '#8f9aa6', OUTL, 3, 4); for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(40,52,64,.55)'; ctx.fillRect(-748, Y(508) + i * 14, 136, 5); }
}
// ---- corridor A (900 .. 1900): sea-glass walls, a teal wainscot, wooden doors, a bulletin board, a parked med cart
function medCart(x, o = {}) {                                              /* a med cart in the wall plane (x = its centre): a squat drawer cart, the top slab `hgt` above the floor line; o.noTop leaves the slab free */
  const hgt = o.hgt || 170, ky = hgt / 312, kx = o.kx || 1.25;
  ctx.save(); ctx.translate(x, FY); ctx.scale(kx, ky);
  rct(-100, -300, 200, 270, lgr(-100, 0, 100, 0, [[0, '#cdd6de'], [.5, '#eef2f6'], [1, '#aeb9c4']]), OUTL, 3.4 / ky * .6, 8);
  for (let i = 0; i < 4; i++) { rct(-90, -290 + i * 62, 180, 54, lgr(0, -290 + i * 62, 0, -236 + i * 62, [[0, '#6aa7c8'], [1, '#3f7ea4']]), OUTL, 2.4 / ky * .6, 5); rct(-26, -270 + i * 62, 52, 10, '#d8dee5', OUTL, 1.6 / ky * .6, 4); }
  rct(-110, -312, 220, 16, '#9aa5b1', OUTL, 3 / ky * .6, 5);
  ctx.restore();
  for (const wx of [-78, 78]) { ctx.fillStyle = '#23252b'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + wx * kx, FY - 11, 13, 0, TAU); ctx.fill(); ctx.stroke(); }
  const top = FY - hgt - 2;
  if (!o.noTop) { rct(x - 100, top - 38, 130, 38, '#2a2f38', OUTL, 3, 4); rct(x - 92, top - 106, 112, 70, '#3a4150', OUTL, 3, 5); rct(x - 84, top - 98, 96, 54, o.screen || '#8fe3ff', null, 0, 3); }
}
function roomCorridorA(lt, cam) {
  const a = 900, b = 1900; if (!vis(a, b)) return;
  wallPaint(a, b, [], () => {
    ctx.fillStyle = lgr(0, CEIL, 0, FY, [[0, '#6aa39d'], [.5, '#8fc0b8'], [1, '#7fb0a8']]); ctx.fillRect(a, CEIL, b - a, FY - CEIL);
    ctx.strokeStyle = 'rgba(30,70,70,.14)'; ctx.lineWidth = 2; for (let x = Math.floor(FR.x0 / 190) * 190; x < FR.x1; x += 190) { ctx.beginPath(); ctx.moveTo(x, CEIL); ctx.lineTo(x, Y(300)); ctx.stroke(); }
    rct(a, Y(300), b - a, 300, lgr(0, Y(300), 0, FY, [[0, '#2f7377'], [1, '#215458']]), null);
    rct(a, Y(322), b - a, 22, '#f1ead8', null); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(a, Y(300), b - a, 5);
    ctx.fillStyle = '#e0b24a'; ctx.fillRect(a, Y(392), b - a, 14);
    for (const lx of [1000, 1450, 1850]) { ctx.fillStyle = rgr(lx, CEIL + 60, 10, 380, [[0, 'rgba(255,248,226,.30)'], [1, 'rgba(255,248,226,0)']]); ctx.fillRect(lx - 400, CEIL, 800, 700); }
  });
  baseboard(a, b, '#d9d2c0'); handrail(a, b, 215);
  door(1010, 140, 560, '#b9855a'); door(1420, 140, 560, '#b9855a', { ajar: true }); door(1790, 140, 560, '#b9855a');
  /* the bulletin board: cork, a POTLUCK flyer, paper turkeys */
  rct(1180, Y(560), 170, 250, '#c89a62', '#f1ead8', 9, 4);
  rct(1196, Y(540), 100, 126, '#fffdf6', OUTL, 2, 2); textDress('POTLUCK', 1246, Y(516), { size: 20, fill: '#b3261e' }); for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(40,40,40,.5)'; ctx.fillRect(1206, Y(492) + i * 18, 80 - (i % 2) * 22, 5); }
  for (const [x, y, c] of [[1318, 500, '#d9822b'], [1304, 400, '#a0522d'], [1230, 372, '#e0b24a']]) { ctx.fillStyle = c; ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, Y(y), 14, 0, TAU); ctx.fill(); ctx.stroke(); for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(x + i * 7, Y(y) - 16, 4, 11, i * .3, 0, TAU); ctx.fill(); ctx.stroke(); } }
  for (const [x, y] of [[1190, 548], [1344, 548], [1190, 318], [1344, 318]]) { ctx.fillStyle = '#d93025'; ctx.beginPath(); ctx.arc(x, Y(y), 4, 0, TAU); ctx.fill(); }
  /* a hand sanitizer dispenser and a framed print */
  rct(1590, Y(420), 44, 80, '#f4f4ef', OUTL, 2.6, 8); rct(1600, Y(456), 24, 12, '#3a9ad9', OUTL, 2, 3); rct(1560, Y(520), 110, 76, '#f1ead8', OUTL, 3, 3); rct(1568, Y(512), 94, 60, '#e8a24a', null); ctx.fillStyle = '#a0522d'; ctx.beginPath(); ctx.moveTo(1580, Y(468)); ctx.lineTo(1640, Y(500)); ctx.lineTo(1650, Y(468)); ctx.fill();
  if (lt < 6.3) medCart(960, { screen: '#7ad7ff', hgt: 190 });
}
// ---- the nurses' station (1900 .. 2880): a slate-blue wall, a whiteboard, a cork board with the sign-up, monitors, bunting, a long desk
function bunting(x0, x1, y, sag, t0 = 0) {
  const cols = ['#d9822b', '#c8372d', '#e0b24a', '#3d8f6b'];
  ctx.strokeStyle = '#6a5a44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); ctx.stroke();
  const n = Math.floor((x1 - x0) / 46);
  for (let i = 1; i < n; i++) { const u = i / n, x = mx(x0, x1, u), yy = (1 - u) * (1 - u) * y + 2 * u * (1 - u) * (y + sag * 2) + u * u * y; ctx.fillStyle = cols[i % 4]; ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 17, yy); ctx.lineTo(x + 17, yy); ctx.lineTo(x, yy + 44); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}
function monitor(x, y, w, h, glow, lt) {
  rct(x - w / 2, y - h, w, h, '#2b2e36', OUTL, 3, 6); rct(x - w / 2 + 8, y - h + 8, w - 16, h - 22, glow, null, 0, 3);
  ctx.strokeStyle = 'rgba(20,40,60,.4)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 18, y - h + 24 + i * 16); ctx.lineTo(x + w / 2 - 18 - (i % 2) * 30, y - h + 24 + i * 16); ctx.stroke(); }
  rct(x - 10, y, 20, 14, '#2b2e36', OUTL, 2, 3); rct(x - 44, y + 12, 88, 10, '#3a3e48', OUTL, 2, 4); V2.glow(x, y - h / 2, 190, '150,215,255', .22, 'screen', .3);
}
function roomStation(lt, cam) {
  const a = 1900, b = 2880; if (!vis(a, b)) return;
  wallPaint(a, b, [], () => {
    ctx.fillStyle = lgr(0, CEIL, 0, FY, [[0, '#566796'], [.5, '#7384b6'], [1, '#65769f']]); ctx.fillRect(a, CEIL, b - a, FY - CEIL);
    ctx.strokeStyle = 'rgba(30,40,80,.16)'; ctx.lineWidth = 2; for (let x = Math.floor(FR.x0 / 120) * 120; x < FR.x1; x += 120) { ctx.beginPath(); ctx.moveTo(x, CEIL); ctx.lineTo(x, FY); ctx.stroke(); }
    for (const lx of [2050, 2420, 2780]) { ctx.fillStyle = rgr(lx, CEIL + 60, 10, 360, [[0, 'rgba(255,248,226,.26)'], [1, 'rgba(255,248,226,0)']]); ctx.fillRect(lx - 400, CEIL, 800, 700); }
  });
  baseboard(a, b, '#d8d0be');
  /* the whiteboard, the cork board with the sign-up sheet, a call-light panel, a hanging sign, bunting */
  rct(2050, Y(740), 300, 270, '#f8f8f4', '#a9b3be', 8, 4);
  ctx.strokeStyle = '#3a5fb0'; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(2074, Y(690) + i * 46); ctx.quadraticCurveTo(2150, Y(690) + i * 46 - 8 + (i % 2) * 16, 2210 - (i % 3) * 30, Y(690) + i * 46); ctx.stroke(); }
  ctx.strokeStyle = '#c8372d'; ctx.beginPath(); ctx.moveTo(2250, Y(690)); ctx.lineTo(2326, Y(690)); ctx.stroke(); ctx.fillStyle = '#c8372d'; ctx.beginPath(); ctx.arc(2288, Y(560), 22, 0, TAU); ctx.fill();
  rct(2440, Y(730), 190, 250, '#c89a62', '#f1ead8', 9, 4);
  rct(2458, Y(708), 154, 206, '#fffdf6', OUTL, 2, 2); textDress('POTLUCK SIGN-UP', 2535, Y(684), { size: 16, fill: '#1f3b73', maxW: 130 });
  for (let i = 0; i < 6; i++) { ctx.strokeStyle = 'rgba(60,60,80,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2470, Y(654) + i * 28); ctx.lineTo(2600, Y(654) + i * 28); ctx.stroke(); if (i < 5) { ctx.strokeStyle = '#23408e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2476, Y(664) + i * 28); ctx.lineTo(2480 + 26, Y(664) + i * 28 - 3); ctx.stroke(); } }
  rct(2700, Y(660), 120, 150, '#2b2e36', OUTL, 3, 6); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = (r + c * 3) % 5 === 0 ? '#ff5a4a' : '#3b4252'; ctx.beginPath(); ctx.arc(2726 + c * 24, Y(630) + r * 30, 7, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#7a7f88'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2330, CEIL); ctx.lineTo(2330, Y(905)); ctx.moveTo(2430, CEIL); ctx.lineTo(2430, Y(905)); ctx.stroke();
  rct(2290, Y(905), 180, 52, '#f1ead8', OUTL, 3, 6); textDress('NURSES STATION', 2380, Y(879), { size: 21, fill: '#23408e', maxW: 160 });
  bunting(1930, 2860, Y(840), 26);
  rct(2230, Y(830) + 4, 300, 30, '#d9822b', OUTL, 3, 14); textDress('MANDATORY FUN', 2380, Y(815) + 4, { size: 18, fill: '#fff6dc', maxW: 270 });
  /* the desk: a wooden counter with monitors, binders, a pumpkin and a paper-turkey centrepiece */
  rct(1950, Y(330), 870, 330, lgr(0, Y(330), 0, FY, [[0, '#dcc08f'], [1, '#a9824f']]), OUTL, 3.4, 4);
  for (let x = 2000; x < 2800; x += 120) { rct(x, Y(300), 100, 250, 'rgba(0,0,0,.1)', 'rgba(0,0,0,.2)', 2, 4); }
  rct(1930, Y(352), 910, 26, lgr(0, Y(352), 0, Y(326), [[0, '#d9b078'], [1, '#aa7d48']]), OUTL, 3, 5);
  monitor(2150, Y(352), 126, 92, lgr(0, 0, 0, 90, [[0, '#a8e0ff'], [1, '#6aa8dc']]), lt); monitor(2480, Y(352), 126, 92, lgr(0, 0, 0, 90, [[0, '#cfe9a0'], [1, '#86b865']]), lt);
  rct(2326, Y(352) - 56, 80, 56, '#f4f1e8', OUTL, 3, 3); rct(2332, Y(352) - 48, 68, 10, '#c8372d', null); rct(2332, Y(352) - 34, 68, 10, '#3a5fb0', null);
  ctx.fillStyle = '#e8891e'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(2710, Y(352) - 30, 42, 32, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(120,50,0,.5)'; ctx.lineWidth = 2; for (const dx of [-16, 0, 16]) { ctx.beginPath(); ctx.moveTo(2710 + dx, Y(352) - 60); ctx.quadraticCurveTo(2710 + dx * 1.6, Y(352) - 30, 2710 + dx, Y(352) - 2); ctx.stroke(); } rct(2704, Y(352) - 70, 12, 14, '#5b7a2a', OUTL, 2, 3);
  for (let i = -2; i <= 2; i++) { ctx.fillStyle = ['#c8372d', '#e0b24a', '#d9822b', '#e0b24a', '#c8372d'][i + 2]; ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(2330 + i * 16, Y(352) - 108, 8, 24, i * .3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#8a5530'; ctx.beginPath(); ctx.arc(2330, Y(352) - 86, 16, 0, TAU); ctx.fill(); ctx.stroke();
  rct(2570, Y(352) - 14, 70, 14, '#2b2e36', OUTL, 2, 3); rct(2190, Y(352) - 10, 30, 10, '#f4f1e8', OUTL, 2, 2);
}
// ---- hall B (2880 .. 4020): warm clay wallpaper, wood panelling, a big window onto the night with curtains, a lamp table, paintings
function roomHall(lt, cam) {
  const a = 2880, b = 4020; if (!vis(a, b)) return;
  wallPaint(a, b, [HOLE_H], () => {
    ctx.fillStyle = lgr(0, CEIL, 0, FY, [[0, '#a9695c'], [.5, '#cd9382'], [1, '#bb8070']]); ctx.fillRect(a, CEIL, b - a, FY - CEIL);
    ctx.strokeStyle = 'rgba(255,230,200,.18)'; ctx.lineWidth = 6; for (let x = Math.floor(FR.x0 / 54) * 54; x < FR.x1; x += 54) { ctx.beginPath(); ctx.moveTo(x, CEIL); ctx.lineTo(x, Y(300)); ctx.stroke(); }
    rct(a, Y(300), b - a, 300, lgr(0, Y(300), 0, FY, [[0, '#6a4630'], [1, '#4a2f20']]), null);
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 3; for (let x = Math.floor(FR.x0 / 120) * 120; x < FR.x1; x += 120) { ctx.beginPath(); ctx.moveTo(x, Y(290)); ctx.lineTo(x, FY - 30); ctx.stroke(); rct(x + 12, Y(270), 96, 230, null, 'rgba(0,0,0,.28)', 2.4, 3); }
    rct(a, Y(322), b - a, 22, '#ecdcb8', null);
    for (const lx of [3000, 3800]) { ctx.fillStyle = rgr(lx, Y(600), 10, 340, [[0, 'rgba(255,214,150,.32)'], [1, 'rgba(255,214,150,0)']]); ctx.fillRect(lx - 400, CEIL, 800, 700); }
  });
  baseboard(a, b, '#d8c9a8'); handrail(a, b, 215, '#a77a4a');
  farNight(lt);
  /* the window: white frame, a cross of muntins, a sill, gold curtains tied back, a valance */
  const [hx0, hy0, hx1, hy1] = HOLE_H;
  rct(hx0 - 14, hy0 - 14, hx1 - hx0 + 28, hy1 - hy0 + 28, null, '#f4efe2', 16, 0); rct(hx0 - 14, hy0 - 14, hx1 - hx0 + 28, hy1 - hy0 + 28, null, OUTL, 2.4, 0);
  ctx.fillStyle = '#f4efe2'; ctx.fillRect((hx0 + hx1) / 2 - 6, hy0, 12, hy1 - hy0); ctx.fillRect(hx0, (hy0 + hy1) / 2 - 6, hx1 - hx0, 12); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.strokeRect((hx0 + hx1) / 2 - 6, hy0, 12, hy1 - hy0);
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(hx0, hy0); ctx.lineTo(hx0 + 150, hy0); ctx.lineTo(hx0 + 40, hy1); ctx.lineTo(hx0, hy1); ctx.fill();
  rct(hx0 - 30, hy1 + 12, hx1 - hx0 + 60, 22, '#ecdcb8', OUTL, 3, 4);
  for (const [cx0, dir] of [[hx0 - 70, 1], [hx1 + 18, -1]]) {
    ctx.beginPath(); ctx.moveTo(cx0, hy0 - 40); ctx.lineTo(cx0 + 70, hy0 - 40); ctx.bezierCurveTo(cx0 + 70 + dir * 6, hy0 + 200, cx0 + 40 + dir * 16, hy0 + 260, cx0 + 60, hy1 + 10); ctx.lineTo(cx0 - 6, hy1 + 10); ctx.bezierCurveTo(cx0 + 12, hy0 + 260, cx0 - 4, hy0 + 160, cx0, hy0 - 40); ctx.closePath();
    ctx.fillStyle = lgr(cx0, 0, cx0 + 70, 0, [[0, '#d2a64a'], [.5, '#ecc66a'], [1, '#b98a30']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(100,60,0,.3)'; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx0 + i * 17, hy0 - 30); ctx.lineTo(cx0 + i * 17 + dir * 4, hy1); ctx.stroke(); }
  }
  rct(hx0 - 90, hy0 - 70, hx1 - hx0 + 180, 50, lgr(0, hy0 - 70, 0, hy0 - 20, [[0, '#c0452f'], [1, '#8c2b1e']]), OUTL, 3, 10);
  V2.glow(3270, Y(500), 520, '120,150,230', .12, 'screen', .3);
  /* a lamp table, paintings, sconces, a plant */
  rct(3640 - 78, Y(300), 156, 300, lgr(0, Y(300), 0, FY, [[0, '#a77a4a'], [1, '#6c4a2c']]), OUTL, 3, 6); rct(3640 - 90, Y(318), 180, 22, '#c19a64', OUTL, 3, 5);
  ctx.strokeStyle = '#6a5a44'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(3640, Y(318)); ctx.lineTo(3640, Y(406)); ctx.stroke(); ctx.fillStyle = '#e9c46a'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3592, Y(406)); ctx.lineTo(3688, Y(406)); ctx.lineTo(3664, Y(474)); ctx.lineTo(3616, Y(474)); ctx.closePath(); ctx.fill(); ctx.stroke();
  V2.glow(3640, Y(440), 380, '255,200,120', .5, 'screen', .6); rct(3700, Y(352), 40, 34, '#f1ead8', OUTL, 2.4, 2); rct(3706, Y(346), 28, 22, '#d9a066', null);
  for (const [px, py, pw, ph, c] of [[2990, 560, 130, 100, '#d9822b'], [3830, 600, 150, 110, '#7a9a4a']]) { rct(px - pw / 2 - 10, Y(py) - 10, pw + 20, ph + 20, '#6a4a2a', OUTL, 3, 3); rct(px - pw / 2, Y(py), pw, ph, '#efe3c4', null); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(px - pw / 2, Y(py) + ph); ctx.lineTo(px - pw / 4, Y(py) + ph * .45); ctx.lineTo(px, Y(py) + ph * .7); ctx.lineTo(px + pw / 4, Y(py) + ph * .3); ctx.lineTo(px + pw / 2, Y(py) + ph); ctx.closePath(); ctx.fill(); }
  for (const sx of [2960, 3900]) { ctx.fillStyle = '#e9c46a'; ctx.strokeStyle = OUTL; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(sx - 18, Y(700)); ctx.lineTo(sx + 18, Y(700)); ctx.lineTo(sx + 12, Y(740)); ctx.lineTo(sx - 12, Y(740)); ctx.closePath(); ctx.fill(); ctx.stroke(); V2.glow(sx, Y(720), 160, '255,210,140', .4, 'screen', .5); }
  ctx.fillStyle = '#6d4a2c'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3420, FY - 4); ctx.lineTo(3434, FY - 150); ctx.lineTo(3500, FY - 150); ctx.lineTo(3514, FY - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [dx, dy, r] of [[0, -230, 52], [-42, -190, 40], [44, -186, 42], [10, -150, 36]]) { ctx.fillStyle = '#4c8a46'; ctx.beginPath(); ctx.ellipse(3467 + dx, FY + dy, r * .8, r, dx * .01, 0, TAU); ctx.fill(); ctx.stroke(); }
  door(3935, 130, 540, '#a8794c');
}
// ---- corridor C and the med cart (4020 ..): pale blue, a far hallway through the alcove (the call lamp), the med cart and the wall clock
function medCart2(x) {                                                    /* Strawberry's cart: the top slab free for the plate, a row of med cups and a pill organiser */
  medCart(x, { noTop: true, hgt: CART_H, kx: 1.25 });
  const top = FY - CART_H - 2;
  for (let i = 0; i < 5; i++) { const cx = x + 78 + i * 10; ctx.fillStyle = '#f7f7f1'; ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 8, top); ctx.lineTo(cx + 8, top); ctx.lineTo(cx + 6, top - 24); ctx.lineTo(cx - 6, top - 24); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  rct(x - 138, top - 34, 56, 34, '#e9ecef', OUTL, 2.4, 4); ctx.fillStyle = '#c8372d'; ctx.fillRect(x - 132, top - 28, 44, 7); ctx.fillStyle = '#3a9ad9'; ctx.fillRect(x - 132, top - 17, 44, 7);
}
const CART_H = 172;
const CLOCK = { x: 4660, y: Y(960), w: 270, h: 124 };
function wallClock(lt, cam) {
  const { x, y, w, h } = CLOCK;
  ctx.strokeStyle = '#6a7580'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 70, CEIL); ctx.lineTo(x - 70, y - h / 2 - 8); ctx.moveTo(x + 70, CEIL); ctx.lineTo(x + 70, y - h / 2 - 8); ctx.stroke();
  rct(x - w / 2 - 12, y - h / 2 - 12, w + 24, h + 24, '#1d1b22', OUTL, 3.4, 20);
  const hit = lt >= Q.sting ? Math.exp(-(lt - Q.sting) * 3.2) : 0;
  V2.glow(x, y, 330 + 120 * hit, '255,60,40', .28 + .05 * Math.sin(lt * 4) + .5 * hit, 'screen', .35 + .3 * hit);
  const z = cam.z, sx0 = 540 + (x - w / 2 - cam.x) * z, sx1 = 540 + (x + w / 2 - cam.x) * z;
  const sy0b = 960 + (y - h / 2 - cam.y) * z, sy1b = sy0b + h * z;
  const mgx = Math.min(sx0 - 70, 1010 - sx1), mgy = Math.min(sy0b - 60, 1360 - sy1b), inPill = sx0 < 520 && sy0b < 262;
  const a = inPill ? 0 : c01(Math.min(mgx, mgy) / 60);
  if (a <= .02) { rct(x - w / 2, y - h / 2, w, h, '#0e0c12', '#3a3440', 4, 14); return; }
  UI.sign([x - w / 2, y - h / 2, w, h], '7:59', { fill: '#0e0c12', stroke: '#3a3440', lw: 4, r: 14, ink: '#ff4a3c', size: 104, font: 'Nunito', weight: 900, alpha: a, id: 'wallclock', maxW: w - 30, hero: true });
}
function roomMed(lt, cam) {
  const a = 4020, b = 5700; if (!vis(a, b)) return;
  wallPaint(a, b, [HOLE_C], () => {
    ctx.fillStyle = lgr(0, CEIL, 0, FY, [[0, '#6aa0b6'], [.5, '#a9d0de'], [1, '#93bccb']]); ctx.fillRect(a, CEIL, b - a, FY - CEIL);
    ctx.strokeStyle = 'rgba(20,60,80,.12)'; ctx.lineWidth = 2; for (let x = Math.floor(FR.x0 / 160) * 160; x < FR.x1; x += 160) { ctx.beginPath(); ctx.moveTo(x, CEIL); ctx.lineTo(x, Y(300)); ctx.stroke(); }
    rct(a, Y(300), b - a, 300, lgr(0, Y(300), 0, FY, [[0, '#2f6f8c'], [1, '#235468']]), null); rct(a, Y(322), b - a, 22, '#f4f6f6', null); ctx.fillStyle = '#e0b24a'; ctx.fillRect(a, Y(392), b - a, 14);
    for (const lx of [4300, 4720, 5160]) { ctx.fillStyle = rgr(lx, CEIL + 60, 10, 380, [[0, 'rgba(235,248,255,.30)'], [1, 'rgba(235,248,255,0)']]); ctx.fillRect(lx - 400, CEIL, 800, 700); }
  });
  baseboard(a, b, '#e4e8ea'); handrail(a, b, 215, '#d9dfe4');
  farHall(lt);
  rct(HOLE_C[0] - 14, HOLE_C[1] - 14, HOLE_C[2] - HOLE_C[0] + 28, HOLE_C[3] - HOLE_C[1] + 14, null, '#f4f6f6', 16, 0); rct(HOLE_C[0] - 14, HOLE_C[1] - 14, HOLE_C[2] - HOLE_C[0] + 28, HOLE_C[3] - HOLE_C[1] + 14, null, OUTL, 2.4, 0);
  /* a hand-hygiene poster, the med room door, the cart */
  rct(4980, Y(700), 150, 200, '#f4f6f6', OUTL, 3, 3); ctx.fillStyle = '#3a9ad9'; ctx.fillRect(4990, Y(690), 130, 38); for (let i = 0; i < 3; i++) { ctx.strokeStyle = '#23408e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(5010 + i * 46, Y(600), 14, 0, TAU); ctx.stroke(); }
  door(5260, 140, 560, '#a9b4bd'); rct(5226, Y(660), 68, 26, '#25303a', OUTL, 2.4, 5); textDress('MED ROOM', 5260, Y(647), { size: 14, fill: '#e8eef2', maxW: 60 });
  wallClock(lt, cam);
  medCart2(CARTP.x);
}
CARTP.y = FY - CART_H - 2;
// ---- the kitchen hand that pushes the plate through the pass-through (clipped to the opening), the near layer, the whole world
function kitchenHand(lt) {
  const t0 = SM.snapT(.2), tin = Q.plateclink, tout = SM.snapT(1.0);
  if (lt < t0 || lt > tout) return;
  const st = plateAt(Math.min(lt, tin)), push = lt < tin ? 1 : 1 - ss(lt, tin + .1, tout), y = RAIL.y - 30;
  const ex = mx(HOLE_K[0] - 120, st.x - 134, push);
  ctx.save(); ctx.beginPath(); ctx.rect(HOLE_K[0], HOLE_K[1], HOLE_K[2] - HOLE_K[0], HOLE_K[3] - HOLE_K[1]); ctx.clip();
  rct(HOLE_K[0] - 260, y - 44, ex - HOLE_K[0] + 260 - 50, 88, lgr(0, y - 44, 0, y + 44, [[0, '#ffffff'], [1, '#cfd6de']]), OUTL, 3.4, 12);
  rct(ex - 62, y - 40, 22, 80, '#3d8f6b', OUTL, 3, 8);                                                             /* a green cuff */
  ctx.fillStyle = '#bfe3f4'; ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; rrp(ex - 44, y - 34, 56, 68, 22); ctx.fill(); ctx.stroke();                          /* the nitrile glove: palm, four fingers on the rim, a thumb */
  for (let i = 0; i < 4; i++) { rrp(ex + 4, y - 34 + i * 17, 26, 15, 7); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(ex - 14, y - 40, 24, 12, -.25, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function paperTurkey(x, y, sc) {                                           /* a paper turkey hanging by a string (construction paper: a brown body, a fan of coloured feathers) */
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.strokeStyle = '#6a5a44'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(0, -22); ctx.stroke();
  const cols = ['#c8372d', '#e8891e', '#e0b24a', '#3d8f6b', '#c8372d'];
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate((i - 2) * .42); ctx.fillStyle = cols[i]; ctx.strokeStyle = OUTL; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(0, -26, 9, 24, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#8a5530'; ctx.strokeStyle = OUTL; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(0, 4, 24, 26, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(8, -14, 11, 0, TAU); ctx.fillStyle = '#a06a3c'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8402f'; ctx.beginPath(); ctx.ellipse(14, -6, 4, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(10, -17, 3.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(11, -17, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
}
function nearLayer(lt, cam) {                                              /* p 1.3: a paper pennant garland and hanging paper turkeys high above the heads, strung from nail to nail; it ends before the med cart so it never crosses the clock */
  layer(1.3, (a, b) => {
    const cols = ['#d9822b', '#c8372d', '#e0b24a', '#3d8f6b', '#a0522d'];
    for (let X = Math.floor(Math.max(a, -400) / 360) * 360; X < Math.min(b, 5600); X += 360) {
      const x1 = X + 360, y = Y(790) - 20, seg = Math.round(X / 360);
      ctx.strokeStyle = '#6a5a44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X, y); ctx.quadraticCurveTo(X + 180, y + 70, x1, y); ctx.stroke();
      ctx.fillStyle = '#6a5a44'; ctx.beginPath(); ctx.arc(X, y, 6, 0, TAU); ctx.fill();
      for (let i = 1; i < 8; i++) { const u = i / 8, px = mx(X, x1, u), py = (1 - u) * (1 - u) * y + 2 * u * (1 - u) * (y + 70) + u * u * y, k = seg * 7 + i; ctx.fillStyle = cols[((k % 5) + 5) % 5]; ctx.strokeStyle = OUTL; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(px - 20, py - 2); ctx.lineTo(px + 20, py - 2); ctx.lineTo(px, py + 54 + 6 * Math.sin(k)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      if ((seg & 1) === 0) paperTurkey(X + 180, y + 62 + 34 * sr(seg, 1) + 5 * Math.sin(lt * 1.3 + seg), .82);
    }
  });
}
function practicalLights(lt, cam) {                                        /* coloured light on the cast (the engine shades the bodies by these) */
  V2.addLight({ x: 340, y: Y(560), r: 760, color: '255,150,60', a: .5 * (1 - ss(cam.x, 600, 1100)) });
  V2.addLight({ x: 3640, y: Y(440), r: 640, color: '255,200,120', a: .45 * ss(cam.x, 2900, 3300) * (1 - ss(cam.x, 3900, 4200)) });
  V2.addLight({ x: 2316, y: Y(430), r: 640, color: '150,210,255', a: .3 * ss(cam.x, 1900, 2200) * (1 - ss(cam.x, 2800, 3100)) });
  V2.addLight({ x: CLOCK.x, y: CLOCK.y, r: 700, color: '255,70,50', a: .35 * ss(cam.x, 4200, 4500) });
}
function drawWorld(lt, cam) {
  /* the wall behind everything, from the far left to the far right */
  ctx.fillStyle = '#20202a'; ctx.fillRect(FR.x0 - 100, CEIL - 400, FR.x1 - FR.x0 + 200, 1700);
  roomKitchen(lt, cam); roomCorridorA(lt, cam); roomStation(lt, cam); roomHall(lt, cam); roomMed(lt, cam);
  drawFloor(lt, cam);
  /* the room seams: a pilaster at each boundary */
  for (const x of [900, 1900, 2880, 4020]) if (vis(x - 30, x + 30)) { rct(x - 18, CEIL, 36, FY - CEIL, lgr(x - 18, 0, x + 18, 0, [[0, '#d9d2c0'], [.5, '#f4efe2'], [1, '#bfb7a2']]), OUTL, 2.6); }
  /* the ceiling above the wall (seen only in the final tilt): acoustic tiles, a crown line, troffers */
  { const a = FR.x0 - 100, b = FR.x1 + 100; ctx.fillStyle = lgr(0, CEIL - 800, 0, CEIL, [[0, '#cfcabc'], [1, '#e6e2d6']]); ctx.fillRect(a, CEIL - 800, b - a, 800);
    ctx.strokeStyle = 'rgba(90,84,70,.3)'; ctx.lineWidth = 2; for (let x = Math.floor(a / 120) * 120; x < b; x += 120) { ctx.beginPath(); ctx.moveTo(x, CEIL - 800); ctx.lineTo(x, CEIL); ctx.stroke(); } for (let y = CEIL - 60; y > CEIL - 800; y -= 60) { ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke(); }
    rct(a, CEIL - 10, b - a, 22, '#f4efe2', OUTL, 2, 0); }
  /* a ceiling shadow and a floor-level light falloff so the wall is not flat */
  ctx.fillStyle = lgr(0, CEIL, 0, CEIL + 260, [[0, 'rgba(10,8,20,.42)'], [1, 'rgba(10,8,20,0)']]); ctx.fillRect(FR.x0 - 100, CEIL, FR.x1 - FR.x0 + 200, 260);
}
/*@@ROOMS5@@*/
// ------------------------------------------------------------------ Mr. Pear's wheelchair in profile (copied from ep18_evac.js's wchairBack / wchairFront under this prefix) with a blanket on his lap
function chairBack(x, y, s, dir) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,14,26,.9)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-58, -76); ctx.lineTo(-66, -176); ctx.lineTo(-96, -184); ctx.moveTo(-58, -76); ctx.lineTo(54, -76); ctx.stroke();
  ctx.strokeStyle = '#59606d'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-58, -76); ctx.lineTo(-66, -176); ctx.lineTo(-96, -184); ctx.moveTo(-58, -76); ctx.lineTo(54, -76); ctx.stroke();
  ctx.restore();
}
function chairFront(x, y, s, dir, blanket) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (blanket) {                                                          /* a knitted blanket over the lap and the knees */
    ctx.beginPath(); ctx.moveTo(-46, -118); ctx.bezierCurveTo(0, -128, 46, -118, 74, -96); ctx.lineTo(98, -44); ctx.quadraticCurveTo(100, -30, 84, -30); ctx.lineTo(44, -50); ctx.quadraticCurveTo(0, -62, -30, -70); ctx.closePath();
    ctx.fillStyle = lgr(-40, -120, 90, -40, [[0, '#c0525e'], [1, '#8a2f3e']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,226,170,.55)'; ctx.lineWidth = 3; for (let i = -2; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-60 + i * 18, -140); ctx.lineTo(-30 + i * 18, -20); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(40,16,24,.4)'; ctx.lineWidth = 2; for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.moveTo(-60, -112 + j * 18); ctx.lineTo(110, -90 + j * 18); ctx.stroke(); } ctx.restore();
    ctx.strokeStyle = '#e9d9b0'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(72 + i * 5, -64 + i * 6); ctx.lineTo(80 + i * 5, -50 + i * 6 + 6); ctx.stroke(); }
  }
  ctx.fillStyle = '#16181e'; ctx.strokeStyle = 'rgba(20,14,26,.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-14, -62, 62, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9aa2ae'; ctx.beginPath(); ctx.arc(-14, -62, 50, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#16181e'; ctx.beginPath(); ctx.arc(-14, -62, 14, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5a6070'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = i * PI / 7; ctx.moveTo(-14 - Math.cos(a) * 48, -62 - Math.sin(a) * 48); ctx.lineTo(-14 + Math.cos(a) * 48, -62 + Math.sin(a) * 48); } ctx.stroke();
  ctx.strokeStyle = '#d6dbe4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-14, -62, 56, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,14,26,.9)'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(54, -76); ctx.lineTo(80, -30); ctx.moveTo(-44, -120); ctx.lineTo(40, -120); ctx.stroke();
  ctx.strokeStyle = '#59606d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(54, -76); ctx.lineTo(80, -30); ctx.moveTo(-44, -120); ctx.lineTo(40, -120); ctx.stroke();
  ctx.fillStyle = '#16181e'; ctx.beginPath(); ctx.arc(64, -16, 15, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a7080'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#3a3f4a'; ctx.beginPath(); ctx.roundRect(72, -34, 40, 10, 4); ctx.fill();
  ctx.restore();
}
// ------------------------------------------------------------------ the scene
const SCN = window.TIMELINE_EP19.scenes.find(s => s.id === 'plate');
const beatId = lt => { let r = 'open'; for (const id in B) if (lt >= B[id][0] - 1e-6) r = id; return r; };
const FR = { cam: null, lt: 0 };
function setLight(lt, cam) {
  const x = cam.x, kitchen = 1 - ss(x, 700, 1000), hall = ss(x, 2900, 3200) * (1 - ss(x, 3900, 4100));
  V2.setLight({ key: [-.35, -.8], keyColor: mixHex('#fff0d8', '#ffd2a0', kitchen), keyA: .26, rim: '#ffe0b8', rimA: .36, shadow: '#2a1830', shadowA: .34, bounce: '#ffd2a0', bounceA: .14 + .06 * hall, amb: '#fff3e0', ambA: .05 });
  V2.opts.reflect = true;
}
/* the characters in front of the wall. A character whose HEAD box touches or crosses a frame edge (the camera is finding it, or it is leaving) is drawn `transit`; one wholly outside is not drawn */
const topOf = o => (typeof TOPS !== 'undefined' && TOPS[o.kind]) || KD(o.kind).ry * 1.05;
function headBox(o, cam) {
  const k = KD(o.kind), c = bodyCentre(o), s = o.s, z = cam.z, top = c[1] - topOf(o) * s, bot = c[1] + (k.mouthY + 44) * s, half = .95 * k.rx * s;
  return [540 + (o.x - half - cam.x) * z, 960 + (top - cam.y) * z, 540 + (o.x + half - cam.x) * z, 960 + (bot - cam.y) * z];
}
function drawCast(lt, cam) {
  const order = ['lemon', 'tom', 'onion', 'pear', 'straw', 'mango'];
  for (const who of order) {
    const o = CAST[who](lt), hb = headBox(o, cam), k = KD(o.kind), bw = k.rx * (o.s || 1) * cam.z;
    if (hb[2] < -bw || hb[0] > 1080 + bw || hb[3] < -200 || hb[1] > 2100) continue;
    o.transit = hb[0] < 14 || hb[2] > 1066 || hb[1] < 14 || hb[3] > 1906;
    if (who === 'pear') { chairBack(PEAR.x, PEAR.lane, PEAR.s, -1); drawChar(o); chairFront(PEAR.x, PEAR.lane, PEAR.s, -1, true); }
    else drawChar(o);
  }
}
function drawPlateAndBinder(lt) {
  const st = plateAt(lt);
  if (st.phase === 'slide') { ctx.save(); ctx.beginPath(); ctx.rect(HOLE_K[0], HOLE_K[1], HOLE_K[2] - HOLE_K[0], HOLE_K[3] - HOLE_K[1] + 6); ctx.clip(); drawPlate(lt, st); ctx.restore(); }
  else drawPlate(lt, st);
  drawBinder(lt, st);
  return st;
}
/* the small effects that belong to people: Tomato's party popper and its confetti, Onion's tear */
function drawEffects(lt, cam, st) {
  if (lt > 7.0 && lt < 9.6) {
    const o = CAST.tom(lt), near = NEAR(dirOfYaw(o.yaw)), g = o.grip[near], hw = handWorld(o, g);
    popper(lt, hw[0], hw[1] - 6); confetti(lt, hw[0] + 6, hw[1] - 64, snapT(7.76));
  }
  if (lt > Q.sniffle - .1 && lt < Q.sniffle + .8) {
    const o = CAST.onion(lt), c = bodyCentre(o), d = dirC(o.yaw), turk = plateLocal(st, TURKEY_TOP[0], TURKEY_TOP[1] - 10);
    tearDrop(lt, c[0] + d * 34 * o.s, c[1] + 22 * o.s, turk[0], turk[1]);
  }
}
const SCENE = {
  shot: lt => beatId(lt),
  cam(lt) { const c = SM.camAt(lt); zoomTo(c.x, c.y, c.z); CAM.r = c.r; },
  draw(lt) {
    const cam = SM.camAt(lt); FR.cam = cam; FR.lt = lt; FR.x0 = cam.x - 600 / cam.z - 60; FR.x1 = cam.x + 600 / cam.z + 60;
    setLight(lt, cam); practicalLights(lt, cam);
    drawWorld(lt, cam);
    drawCast(lt, cam);
    const st = drawPlateAndBinder(lt);
    kitchenHand(lt);
    drawEffects(lt, cam, st);
    nearLayer(lt, cam);
  },
  fx(lt) {
    const fade = lt < .3 ? 1 - lt / .3 : lt > SCN.dur - .32 ? (lt - (SCN.dur - .32)) / .32 : 0;
    return { bloom: .5, vignette: .36, grain: .045, contrast: .12, sat: .1, tint: [['#ffb878', .07, 'soft-light']], fade: Math.max(0, Math.min(1, fade)), fadeColor: '16,12,24' };
  },
  blur(lt) { const a = SM.camAt(lt - .02), b = SM.camAt(lt + .02), v = Math.abs(b.x - a.x) / .04 * b.z; return Math.max(1, Math.min(5, Math.round(1 + v * .6 / 30 / 4))); },
  over() {},
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP19_SCENES = window.__EP19_SCENES || {};
window.__EP19_SCENES.plate = SCENE;
window.__PLATE_DEV = { CAST, plateAt, heldPlate2, drawPlate, SM, handWorld, bodyCentre };
})();
