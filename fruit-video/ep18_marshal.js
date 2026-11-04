'use strict';
/* SHIFT HAPPENS, Episode 18: "The Fire Drill". Scene module: marshal (7:55 PM, THE MARSHAL, 38.8 s). Builder MARSHAL. Registers window.__EP18_SCENES.marshal and adds P18.extinguisher / P18.extinguisherNozzle.
 *
 * The Unit B lobby corridor in the evening: ONE world seen in flat elevation (1080 x 1920 world units at zoom 1; the floor is y 1150, the ceiling y 130), many cameras. From left to right: the stairwell door (x -130..70),
 * the Marshal's spot (420), the drill easel with the cardboard flame SIMULATED FIRE (774), the line-up (690 880 1070), the wall tablet where Binder lives (1250), the extinguisher cabinet (1400), the linen cart (1582)
 * wedged in the fire door (the doorway 1640..1880; the leaf stands open at an angle with the taped sign KEEP CLOSED), the right end wall (2420). Lemon demonstrates at x 1250 facing left; the can is the sim's (ep18_marshal_sim.js).
 * Shots (scene-local s): open 0-1.4 wide, dark: the stairwell door, the Marshal's silhouette, the beam (click 1.0) | p1 1.4-3.3 Marshal MCU | s1 3.3-4.24 Strawberry | m1 4.24-5.21 Mango | o1 5.21-6.3 Onion |
 * b1 6.3-7.58 the wall tablet, Binder pops out (pop 6.361) | p2 7.58-9.66 the beam follows the wall to the cabinet (a pan) | ex1 9.66-10.9 INSERT the extinguisher (click 9.66) | ex2 10.9-12.74 INSERT the tag |
 * o2 12.74-13.76 Onion | p4 13.76-15.63 Marshal | o3 15.63-17.37 Onion, harder | p5 17.37-20.05 the beam swings to the fire door (a pan) | m2 20.05-20.93 Mango at the cart | sg 20.93-23.14 the sign |
 * m3 23.14-24.87 the cart and the sign, Mango pats it (a hold) | p7 24.87-26.73 Marshal | l1 26.73-28.457 Lemon, P.A.S.S. chips, the pin (27.233) | the rampage 28.457-31.9 (launch, the cart, the arc, the wide, the punch-in on the Marshal) |
 * p8 31.9-33.71 foam beard | l2 33.71-35.04 Lemon | p9 35.04-37.51 the Marshal writes, the SLIP HAZARD stamp (36.739), Strawberry glides across the foam | end 37.51-38.76 hold (sting 37.61).
 * Foam and light come from FX18 when it is there (checked at draw time); this file carries small stand-ins so the scene always draws. Everything is a pure function of the scene time. */
(() => {
if (!window.TIMELINE_EP18 || !window.H6 || !window.V2 || !window.A15 || !window.UI) return;
const { zoomTo } = window.H6;
const A6 = window.A6, A7 = window.A7, A11 = window.A11, A15 = window.A15;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP18, SCN = TLX.scenes.find(s => s.id === 'marshal'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'marshal') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];      /* scene-local start of the i-th word of a spoken line (the words are line-relative in the timeline) */
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };   /* ease out back */
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const snapT = t => Math.round((START + t) * 30) / 30 - START;            /* the scene-local time of the video frame nearest to t: a picture event lands on this frame */
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };   /* seeded noise 0..1: a pure function of its arguments */
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const wob = (lt, f, a, s0 = 0) => Math.sin(lt * f + s0) * a;
const FX = () => window.FX18 || {};
const hasFX = n => !!(window.FX18 && typeof window.FX18[n] === 'function');

/* the sound cues of the scene (scene-local seconds, from script_ep18.json: beat start + offset; python3 /tmp/shift_tools/cues.py 18 marshal), each snapped to the video frame nearest it */
const CUE = { boots: .2, click1: 1.0, sniffle1: 6.014, binderpop: 6.361, click2: 9.66, sniffle2: 16.831, pinpull: 27.233, hiss: 28.457, cart: 28.957, splat: 31.057, stamp: 36.739, sting: 37.612 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);

// ------------------------------------------------------------------ the world's numbers
const FLOOR = 1150, CEIL = 130, XL = -260, XR = 2420, HORIZON = 780;
const X = { door: -30, marshal: 420, easel: 774, straw: 690, mango: 880, onion: 1070, tablet: 1250, lemon: 1250, cabinet: 1400, cart: 1582, fireDoor: 1760 };
const MS = 1.15, CS = .95;                       /* the Marshal's scale; the others' */
const OUTL = 'rgba(28,24,30,.8)';

// ------------------------------------------------------------------ the rampage sim (built once, lazily; DOM-free module ep18_marshal_sim.js), sampled with world.at(lt)
let SIM = null, SIMERR = null;
function simInit() {
  if (SIM || SIMERR) return SIM;
  try {
    const M = window.__EP18_SIMS && window.__EP18_SIMS.marshal;
    if (!M) { SIMERR = 'no sim'; return null; }
    SIM = M.build({});
  } catch (e) { SIMERR = String(e && e.stack || e); console.error('marshal sim: ' + SIMERR); }
  return SIM;
}
const T0 = 28.457;                               /* the discharge: the can is the sim's from here on */
/* the can's pose, the nozzle, the cart and the easel at scene time lt (numbers copied out: world.at() reuses its buffers) */
function simAt(lt) {
  const S = simInit(); if (!S) return null;
  const st = S.world.at(Math.max(0, Math.min(S.T - .01, lt))), ids = S.meta.ids, c = st.by[ids.can], k = st.by[ids.cart], e = st.by[ids.easel];
  const nz = S.nozzle(lt, {});
  return { can: { x: c.x, y: c.y, a: c.angle, vx: c.vx, vy: c.vy }, cart: { x: k.x, y: k.y, a: k.angle }, easel: { x: e.x, y: e.y, a: e.angle }, nz: { x: nz.x, y: nz.y, ang: nz.ang, ax: nz.ax, ay: nz.ay, thrust: nz.thrust } };
}
const SIML = () => { const S = simInit(); return S ? S.meta.L : { cartX: 1582, easelX: 774, cartH: 330, cartW: 176 }; };

// ------------------------------------------------------------------ safe-in test for text (hero text only when its box is wholly in the frame and clear of the caption zone and the clock pill)
const scaleNow = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };
function safeIn(x0, y0, x1, y1, mg = 46) {
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}

// ------------------------------------------------------------------ FX18 stand-ins (used only while FX18 lacks the function; the real kit is called whenever it exists)
const SPR = {};
function sprite(k, w, h, fn) { if (SPR[k]) return SPR[k]; const c = V2.mk(w, h), g = c.getContext('2d'); fn(g, w, h); return (SPR[k] = c); }
function foamBlob(sz) {
  return sprite('foam' + sz, sz, sz, (g, w, h) => {
    const r = w / 2 - 2, gr = g.createRadialGradient(w * .42, h * .38, r * .1, w / 2, h / 2, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.62, '#f4f8fc'); gr.addColorStop(1, '#c4d2e2');
    g.fillStyle = gr; g.beginPath(); g.arc(w / 2, h / 2, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(120,140,170,.35)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w * .36, h * .32, r * .22, 0, TAU); g.fill();
  });
}
const hash2 = (a, b) => sr(a * 1.37 + 3, b * 2.11 + 5);
function jetFallback(o) {
  const t = o.t, t0 = o.t0, t1 = o.t1, rate = o.rate || 110, life = 1.4, sp = o.speed || 900, g = o.gravity ?? 1400, size = o.size || 46;
  if (t < t0) return;
  const i0 = Math.max(0, Math.floor((t - life - t0) * rate)), i1 = Math.min(Math.floor((t1 - t0) * rate), Math.floor((t - t0) * rate));
  ctx.save();
  for (let i = i0; i <= i1; i++) {
    const te = t0 + i / rate, age = t - te; if (age < 0 || age > life) continue;
    const nz = o.nozzle(te), a = nz.ang + (o.spread ?? .28) * (hash2(i, o.seed || 1) - .5), v = sp * (.7 + .5 * hash2(i, 7)), u = age / life;
    const x = nz.x + Math.cos(a) * v * age * (1 - .35 * u), y = nz.y + Math.sin(a) * v * age * (1 - .35 * u) + .5 * g * age * age, r = size * (.35 + 1.1 * Math.min(1, age / .5)) * (.7 + .5 * hash2(i, 3));
    ctx.globalAlpha = (o.alpha ?? 1) * (1 - u * u);
    const sz = foamBlob(64); ctx.drawImage(sz, x - r / 2, y - r / 2, r, r);
  }
  ctx.restore();
}
function pileFallback(o) {
  const k = ss(o.t, o.t0, o.t0 + (o.grow || .5)); if (k <= 0) return;
  ctx.save(); ctx.translate(o.x, o.y);
  const n = Math.round(10 + 16 * Math.min(1, o.w / 240)), sz = foamBlob(64);
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, px = (u - .5) * o.w * k + (hash2(i, o.seed || 2) - .5) * o.w * .12, hh = Math.sin(u * PI) * o.h * k, py = -hh * (.35 + .65 * hash2(i, 9)) * .8, r = (o.h * .42 + 18 * hash2(i, 4)) * (.4 + .6 * k);
    ctx.drawImage(sz, px - r, py - r, r * 2, r * 2);
  }
  ctx.restore();
}
function coneFallback(o) {
  const { x, y, ang, spread, len } = o, a0 = ang - spread / 2, a1 = ang + spread / 2;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(x, y, 0, x, y, len); g.addColorStop(0, V2.rgba(o.color || '#fff4c8', (o.alpha ?? .5))); g.addColorStop(.55, V2.rgba(o.color || '#fff4c8', (o.alpha ?? .5) * .35)); g.addColorStop(1, V2.rgba(o.color || '#fff4c8', 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a0) * len, y + Math.sin(a0) * len); ctx.arc(x, y, len, a0, a1); ctx.closePath(); ctx.fill(); ctx.restore();
}
function glowFallback(o) { V2.glow(o.x, o.y, o.r, V2.rgb(o.color || '#ffd890').join(','), o.alpha ?? .5, 'screen', .2); }
const fxJet = o => hasFX('foamJet') ? FX().foamJet(ctx, o) : jetFallback(o);
const fxPile = o => hasFX('foamPile') ? FX().foamPile(ctx, o) : pileFallback(o);
const fxCone = o => hasFX('cone') ? FX().cone(ctx, o) : coneFallback(o);
const fxGlow = o => hasFX('glow') ? FX().glow(ctx, o) : glowFallback(o);
const fxPuff = o => { if (hasFX('puff')) FX().puff(ctx, o); };

/*@@END1@@*/
})();
