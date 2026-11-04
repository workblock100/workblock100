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

// ------------------------------------------------------------------ the view (set by cam(): the visible world rectangle) and the corridor shell: ceiling plane, wall, floor plane (one-point perspective, vanishing point at the camera's x)
const VIEW = { x0: -400, x1: 1480, y0: 0, y1: 1920, z: 1, cx: 540, cy: 960 };
const CD = 380;                                   /* the drawn ceiling line (the sim's ceiling is higher and never touched) */
function shell(lt, o) {
  o = o || {};
  const x0 = VIEW.x0 - 60, x1 = VIEW.x1 + 60, vx = VIEW.cx, W_ = x1 - x0, dim = o.dim ?? 1;
  /* ceiling plane: acoustic tiles receding to the vanishing point */
  const yTop = Math.min(VIEW.y0 - 40, -400);
  ctx.fillStyle = lg(0, yTop, 0, CD, [[0, '#2a303a'], [1, '#4d5663']]); ctx.fillRect(x0, yTop, W_, CD - yTop);
  ctx.strokeStyle = 'rgba(20,24,32,.55)'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const k of [1.12, 1.3, 1.55, 1.9, 2.5, 3.6]) { const y = HORIZON - (HORIZON - CD) * k; if (y > yTop - 30) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); } }
  for (let xj = Math.floor(x0 / 300) * 300; xj < x1 + 300; xj += 300) { const dx = xj - vx; ctx.moveTo(xj, CD); ctx.lineTo(vx + dx * (HORIZON - yTop) / (HORIZON - CD), yTop); }
  ctx.stroke();
  /* the wall: crown shadow, upper paint, the handrail, the wainscot, the baseboard */
  ctx.fillStyle = lg(0, CD, 0, 900, [[0, '#8fa798'], [.25, '#a8bfae'], [1, '#9db6a4']]); ctx.fillRect(x0, CD, W_, 900 - CD);
  ctx.fillStyle = 'rgba(10,16,20,.34)'; ctx.fillRect(x0, CD, W_, 16);
  ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let xj = Math.floor(x0 / 280) * 280; xj < x1; xj += 280) ctx.fillRect(xj, CD + 16, 3, 900 - CD - 16);
  ctx.fillStyle = lg(0, 880, 0, 1112, [[0, '#6f9282'], [1, '#5f8271']]); ctx.fillRect(x0, 880, W_, 232);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let xj = Math.floor(x0 / 220) * 220; xj < x1; xj += 220) ctx.fillRect(xj, 900, 3, 212);
  ctx.fillStyle = lg(0, 872, 0, 904, [[0, '#d2a86e'], [.5, '#b98a52'], [1, '#8f6836']]); ctx.fillRect(x0, 872, W_, 30);        /* the handrail */
  ctx.fillStyle = 'rgba(255,240,200,.3)'; ctx.fillRect(x0, 874, W_, 4);
  ctx.fillStyle = '#7a5630'; for (let xj = Math.floor(x0 / 300) * 300 + 60; xj < x1; xj += 300) { ctx.fillRect(xj, 902, 14, 22); }
  ctx.fillStyle = '#3d4846'; ctx.fillRect(x0, 1112, W_, FLOOR - 1112); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x0, 1112, W_, 3);
  /* the floor plane: vinyl tile receding to the vanishing point, glossy under each light */
  const yB = Math.max(VIEW.y1 + 40, 2000);
  ctx.fillStyle = lg(0, FLOOR, 0, yB, [[0, '#6c7683'], [.45, '#59626f'], [1, '#3a414c']]); ctx.fillRect(x0, FLOOR, W_, yB - FLOOR);
  ctx.strokeStyle = 'rgba(20,26,34,.5)'; ctx.lineWidth = 2.5; ctx.beginPath();
  for (const k of [1.2, 1.46, 1.82, 2.4, 3.4, 5.5]) { const y = HORIZON + (FLOOR - HORIZON) * k; if (y < yB) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); } }
  for (let xj = Math.floor(x0 / 300) * 300; xj < x1 + 300; xj += 300) { const dx = xj - vx; ctx.moveTo(xj, FLOOR); ctx.lineTo(vx + dx * (yB - HORIZON) / (FLOOR - HORIZON), yB); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x0, FLOOR, W_, 10);
  /* the ceiling fixtures (a thin lit strip under the ceiling line) and their light on the wall and floor */
  for (let xj = 120 + Math.floor((x0 - 120) / 520) * 520; xj < x1 + 260; xj += 520) {
    ctx.fillStyle = '#2d3440'; rr(xj - 130, CD, 260, 18, 4); ctx.fill();
    ctx.fillStyle = `rgba(255,244,214,${.9 * dim})`; rr(xj - 120, CD + 4, 240, 10, 3); ctx.fill();
    V2.glow(xj, CD + 20, 330, '255,236,190', .3 * dim, 'screen', .25);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg(xj, CD + 20, xj, 860, [[0, `rgba(255,236,190,${.2 * dim})`], [1, 'rgba(255,236,190,0)']]);
    ctx.beginPath(); ctx.moveTo(xj - 120, CD + 18); ctx.lineTo(xj + 120, CD + 18); ctx.lineTo(xj + 330, 860); ctx.lineTo(xj - 330, 860); ctx.closePath(); ctx.fill(); ctx.restore();
    V2.glow(xj, FLOOR + 90, 280, '255,236,190', .1 * dim, 'screen', 0);
  }
}

// ------------------------------------------------------------------ wall props: the stairwell door, a bulletin board, a room door, the extinguisher cabinet, the wall tablet, the fire door and its sign, the EXIT sign
function stairDoor(lt, open) {
  const x = X.door, w = 200, y0 = 610;
  ctx.fillStyle = '#2b323b'; ctx.fillRect(x - w / 2 - 22, y0 - 26, w + 44, FLOOR - y0 + 26);                          /* steel frame */
  ctx.fillStyle = lg(x, y0, x, FLOOR, [[0, '#cfe4ff'], [.5, '#a9c6ea'], [1, '#7f9cc4']]); ctx.fillRect(x - w / 2, y0, w, FLOOR - y0);   /* the stairwell beyond: cool light */
  ctx.fillStyle = 'rgba(40,60,100,.35)'; ctx.fillRect(x - w / 2, y0, w, 50);
  ctx.strokeStyle = 'rgba(70,90,130,.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - w / 2 + 40, FLOOR); ctx.lineTo(x - w / 2 + 120, 900); ctx.lineTo(x + w / 2, 900); ctx.moveTo(x - w / 2, 960); ctx.lineTo(x + w / 2 - 70, 960); ctx.stroke();   /* a stair rail */
  const lx = x - w / 2 - 22;
  ctx.fillStyle = '#3a4350'; ctx.fillRect(lx - 14, y0, 16, FLOOR - y0);                                             /* the leaf, open flat to the wall */
  ctx.fillStyle = '#4a5462'; ctx.fillRect(lx - 38, y0 + 40, 26, FLOOR - y0 - 40);
}
function bulletin(lt) {
  const x = 180, y = 700, w = 190, h = 150;
  rr(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16, 8); ctx.fillStyle = '#8a6a44'; ctx.fill();
  ctx.fillStyle = '#c9b48a'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
  const paper = (px, py, pw, ph, col, rot) => { ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.fillStyle = col; ctx.fillRect(-pw / 2, -ph / 2, pw, ph); ctx.strokeStyle = 'rgba(40,30,20,.3)'; ctx.lineWidth = 1.5; ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
    ctx.fillStyle = '#d33'; ell(0, -ph / 2 + 5, 3.2, 3.2); ctx.fill(); ctx.strokeStyle = 'rgba(60,60,70,.55)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-pw / 2 + 7, -ph / 2 + 16 + i * 9); ctx.lineTo(pw / 2 - 7 - (i % 2) * 10, -ph / 2 + 16 + i * 9); ctx.stroke(); } ctx.restore(); };
  paper(x - 56, y - 8, 66, 88, '#fbf6ea', -.05); paper(x + 14, y + 4, 62, 80, '#ffe9a8', .04); paper(x + 66, y - 14, 50, 70, '#e8f1ff', -.03);
}
function roomDoor(x, lt, num) {
  const w = 176, y0 = 610;
  ctx.fillStyle = '#3a4a46'; ctx.fillRect(x - w / 2 - 14, y0 - 16, w + 28, FLOOR - y0 + 16);
  ctx.fillStyle = lg(x - w / 2, 0, x + w / 2, 0, [[0, '#b98d58'], [.5, '#cfa06a'], [1, '#a77c48']]); ctx.fillRect(x - w / 2, y0, w, FLOOR - y0);
  ctx.strokeStyle = 'rgba(80,50,20,.4)'; ctx.lineWidth = 3; ctx.strokeRect(x - w / 2 + 18, y0 + 26, w - 36, 190); ctx.strokeRect(x - w / 2 + 18, y0 + 250, w - 36, 220);
  ctx.fillStyle = '#d7dbe0'; ell(x + w / 2 - 26, 900, 9, 9); ctx.fill();
  ctx.fillStyle = '#f2efe4'; rr(x - 38, y0 + 4 - 40, 76, 34, 5); ctx.fill(); ctx.strokeStyle = 'rgba(60,50,40,.6)'; ctx.lineWidth = 2; ctx.stroke();
  const hero = false; UI.label(String(num), x, y0 - 23, { size: 24, weight: 900, fill: '#3a3228', hero, crop: true });
}
function cabinet(lt, st) {   /* st: { open (door swing 0..1), can (draw the can in the bracket), dust } */
  const x = X.cabinet, x0 = x - 104, x1 = x + 104, y0 = 770, y1 = 1118;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x0 - 6, y0 - 4, x1 - x0 + 22, y1 - y0 + 16);
  rr(x0 - 12, y0 - 12, x1 - x0 + 24, y1 - y0 + 24, 10); ctx.fillStyle = lg(x0, y0, x1, y0, [[0, '#d94a3c'], [.5, '#c8332a'], [1, '#a82820']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#f1ece0'], [1, '#d9d2c2']]); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);            /* the interior back */
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(x0, y0, x1 - x0, 20); ctx.fillRect(x0, y0, 14, y1 - y0);
  ctx.fillStyle = '#8f1d17'; ctx.fillRect(x0, y1 - 22, x1 - x0, 22);
  if (st.can) {   /* the bracket (a red strap and a back plate) */
    ctx.fillStyle = '#4a4f58'; ctx.fillRect(x - 12, 930, 24, 70);
    ctx.fillStyle = '#a82820'; ctx.fillRect(x - 52, 960, 104, 14); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.5; ctx.strokeRect(x - 52, 960, 104, 14);
    ctx.fillStyle = '#d7dbe0'; ell(x - 40, 967, 5, 5); ctx.fill();
  }
  if (st.after) { ctx.fillStyle = '#4a4f58'; ctx.fillRect(x - 12, 930, 24, 70); ctx.fillStyle = '#a82820'; ctx.fillRect(x - 52, 960, 104, 14); }   /* the strap hangs open once the can is gone */
}
function cabinetGlass(lt, st) {   /* the glass door over the can: closed (a reflection) or swung open to the left */
  const x = X.cabinet, x0 = x - 104, x1 = x + 104, y0 = 770, y1 = 1118, k = st.open;
  if (k < .98) {
    const wdt = (x1 - x0) * (1 - k);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, wdt, y1 - y0); ctx.clip();
    ctx.fillStyle = 'rgba(180,220,255,.16)'; ctx.fillRect(x0, y0, wdt, y1 - y0);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(x0 + 20, y0); ctx.lineTo(x0 + 80, y0); ctx.lineTo(x0 + 20 - 40 + 60, y1); ctx.lineTo(x0 - 20, y1); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#a82820'; ctx.lineWidth = 9; ctx.strokeRect(x0 + 4, y0 + 4, wdt - 8, y1 - y0 - 8);
  }
  ctx.fillStyle = '#e9ece7'; rr(x - 70, y0 - 44, 140, 28, 6); ctx.fill();                                            /* the red strip above: FIRE EXTINGUISHER */
  ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
  UI.label('FIRE EXTINGUISHER', x, y0 - 30, { size: 17, weight: 900, fill: '#b02a20', hero: false, crop: true, maxW: 128 });
}
const heroIf = (x0, y0, x1, y1, size) => safeIn(x0, y0, x1, y1) && scaleNow() * size >= 31;

/* the wall tablet where Binder lives: idle (the icon bobs, DRILL 8:00 PM), then Binder leaves it at the pop (the screen flashes, the icon slot is left empty) */
const TAB = { x: X.tablet, y: 700, w: 210, h: 300 };
function tablet(lt, st) {
  const { x, y, w, h } = TAB;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(x - w / 2 + 6, y - h / 2 + 10, w, h, 18); ctx.fill();
  rr(x - w / 2, y - h / 2, w, h, 18); ctx.fillStyle = '#171b22'; ctx.fill(); ctx.strokeStyle = '#3b4352'; ctx.lineWidth = 3; ctx.stroke();
  const sx = x - w / 2 + 12, sy = y - h / 2 + 14, sw = w - 24, sh = h - 28;
  const flash = st.pop > 0 ? Math.exp(-(lt - CUE.binderpop) * 9) : 0;
  ctx.save(); rr(sx, sy, sw, sh, 8); ctx.clip();
  ctx.fillStyle = lg(sx, sy, sx, sy + sh, [[0, '#2f9aa8'], [1, '#1d6573']]); ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(sx, sy, sw, 34);
  if (!st.pop) {   /* the Binder icon: a clip glyph, bobbing */
    const by = y - 14 + Math.sin(lt * 2.4) * 5;
    ctx.save(); ctx.translate(x, by); ctx.strokeStyle = '#c8d0d8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-38, -22); ctx.quadraticCurveTo(-60, -66, -22, -74); ctx.moveTo(38, -22); ctx.quadraticCurveTo(60, -66, 22, -74); ctx.stroke();
    ctx.fillStyle = '#14161c'; ctx.beginPath(); ctx.moveTo(-58, 44); ctx.lineTo(-44, -26); ctx.lineTo(44, -26); ctx.lineTo(58, 44); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ell(-16, 4, 11, 12); ctx.fill(); ell(16, 4, 11, 12); ctx.fill(); ctx.fillStyle = '#111'; ell(-13, 6, 5, 5); ctx.fill(); ell(19, 6, 5, 5); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(0, 18, 14, .25, PI - .25); ctx.stroke();
    ctx.restore();
  } else { ctx.fillStyle = 'rgba(8,24,30,.55)'; ell(x, y - 14, 58, 62); ctx.fill(); }
  ctx.restore();
  UI.label('UNIT B', x, sy + 17, { size: 24, weight: 900, fill: '#d8f4f6', hero: false, crop: true, spacing: 2 });
  UI.label('FIRE DRILL 8:00 PM', x, sy + sh - 22, { size: 17, weight: 900, fill: '#ffe9a6', hero: false, crop: true, maxW: sw - 20 });
  if (flash > .02) { ctx.fillStyle = `rgba(235,255,255,${.85 * flash})`; rr(sx, sy, sw, sh, 8); ctx.fill(); V2.glow(x, y, 220, '200,255,255', .5 * flash, 'screen', .3); }
}

/* the fire door: the doorway, the leaf standing open at an angle (hinged on the right), the closer arm, the vision panel, the taped sign KEEP CLOSED; the cart is drawn in front of it */
const FD = { x0: 1640, x1: 1880, y0: 610 };
function fireDoor(lt, st) {
  const { x0, x1, y0 } = FD;
  ctx.fillStyle = '#4d5a58'; ctx.fillRect(x0 - 22, y0 - 26, x1 - x0 + 44, FLOOR - y0 + 26);                         /* the frame */
  ctx.fillStyle = lg(0, y0, 0, FLOOR, [[0, '#1c2430'], [1, '#2c3644']]); ctx.fillRect(x0, y0, x1 - x0, FLOOR - y0);   /* beyond: the next wing, dim */
  ctx.fillStyle = lg(x0, 0, x1, 0, [[0, 'rgba(255,214,150,.0)'], [1, 'rgba(255,214,150,.14)']]); ctx.fillRect(x0, y0, x1 - x0, FLOOR - y0);
  const lx = x1 - 196, lw = 196;                                                                                      /* the leaf, seen foreshortened */
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(lx - 12, y0 + 6, lw + 10, FLOOR - y0 - 6);
  ctx.fillStyle = lg(lx, 0, lx + lw, 0, [[0, '#8c9d98'], [.5, '#7b8d88'], [1, '#657772']]); ctx.fillRect(lx, y0, lw, FLOOR - y0);
  ctx.strokeStyle = 'rgba(20,30,28,.6)'; ctx.lineWidth = 4; ctx.strokeRect(lx, y0, lw, FLOOR - y0);
  ctx.fillStyle = '#cfd6d4'; ctx.fillRect(lx + 8, FLOOR - 96, lw - 16, 80); ctx.strokeStyle = OUTL; ctx.lineWidth = 2.5; ctx.strokeRect(lx + 8, FLOOR - 96, lw - 16, 80);   /* the kick plate */
  ctx.fillStyle = 'rgba(190,225,235,.55)'; rr(lx + 30, y0 + 52, 56, 150, 6); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.stroke();                   /* the vision panel */
  ctx.strokeStyle = 'rgba(70,90,90,.5)'; ctx.lineWidth = 1.5; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(lx + 30 + i * 9.3, y0 + 54); ctx.lineTo(lx + 30 + i * 9.3, y0 + 200); ctx.stroke(); }
  ctx.fillStyle = '#d7dbe0'; ctx.strokeStyle = OUTL; ctx.lineWidth = 2.5; rr(lx + 20, 930, 20, 110, 8); ctx.fill(); ctx.stroke();                                        /* the push bar */
  ctx.fillStyle = '#3a4244'; for (const hy of [y0 + 60, 880, FLOOR - 120]) ctx.fillRect(x1 - 12, hy, 14, 30);                                                  /* hinges */
  ctx.strokeStyle = '#2c3234'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1 - 30, y0 - 6); ctx.lineTo(lx + 70, y0 + 22); ctx.lineTo(lx + 38, y0 + 8); ctx.stroke();   /* the closer arm */
  ctx.fillStyle = '#3d4648'; rr(x1 - 80, y0 - 16, 70, 26, 5); ctx.fill();
}
const KEEP = { x: 1784, y: 842, w: 206, h: 196 };
function keepSign(lt) {   /* the taped sign, eye level on the leaf; hero only when it is wholly in a safe frame */
  const { x, y, w, h } = KEEP, x0 = x - w / 2, y0 = y - h / 2;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.045); ctx.translate(-x, -y);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x0 + 5, y0 + 7, w, h);
  const hero = heroIf(x0, y0, x0 + w, y0 + h, 28);
  UI.sign([x0, y0, w, h], [{ t: 'FIRE DOOR', size: 28, weight: 900 }, { t: 'KEEP', size: 44, weight: 900 }, { t: 'CLOSED', size: 44, weight: 900 }], { fill: '#fffdf2', stroke: '#c4281e', lw: 7, ink: '#c4281e', pad: 12, hero, crop: !hero, id: 'keep', r: 4 });
  ctx.restore();
  ctx.fillStyle = 'rgba(235,225,170,.8)'; for (const [tx, ty, ta] of [[x0 + 6, y0 + 4, -.6], [x0 + w - 8, y0 + 8, .5], [x0 + 6, y0 + h - 8, .5], [x0 + w - 6, y0 + h - 4, -.5]]) { ctx.save(); ctx.translate(tx, ty); ctx.rotate(ta); ctx.fillRect(-16, -6, 32, 12); ctx.restore(); }
}
function exitSign(x, y, lt) {
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(x - 78, y - 28, 156, 62, 8); ctx.fill();
  rr(x - 76, y - 32, 152, 58, 8); ctx.fillStyle = '#16723a'; ctx.fill(); ctx.strokeStyle = '#0b3d1f'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#eafff0'; ctx.beginPath(); ctx.arc(x - 44, y - 12, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#eafff0'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 44, y - 6); ctx.lineTo(x - 50, y + 12); ctx.moveTo(x - 44, y - 4); ctx.lineTo(x - 30, y + 4); ctx.moveTo(x - 46, y + 2); ctx.lineTo(x - 36, y + 14); ctx.stroke();
  UI.label('EXIT', x + 14, y - 3, { size: 36, weight: 900, fill: '#eafff0', spacing: 4, hero: false, crop: true });
  fxGlow({ x, y: y - 3, r: 150, color: '#7dffb0', alpha: .28 });
  V2.glow(x, y + 80, 170, '120,255,170', .08, 'screen', 0);
}

/* the drill easel and its cardboard flame, from the sim's pose: the fall angle is the sim's in-plane angle, drawn as the board tipping away from us (the picture squashes to a sliver on the floor) */
function flamePath(g) {   /* local coordinates, the board centre (0, 0): three tongues */
  g.beginPath(); g.moveTo(-84, 98); g.bezierCurveTo(-98, 40, -64, 10, -52, -34); g.bezierCurveTo(-46, 4, -34, 20, -26, 30);
  g.bezierCurveTo(-30, -40, -10, -70, 6, -108); g.bezierCurveTo(14, -64, 38, -44, 40, -2); g.bezierCurveTo(52, -26, 56, -38, 62, -52);
  g.bezierCurveTo(88, -8, 96, 50, 78, 98); g.closePath();
}
function easel(lt, S) {
  const L = SIML(), fall = S ? Math.min(PI / 2, Math.max(0, -S.easel.a)) : 0, ex = S ? L.easelX + (S.easel.x - L.easelX) * .35 : L.easelX;
  ctx.save(); ctx.translate(ex, FLOOR);
  const sy = Math.cos(fall) + .14 * Math.sin(fall); ctx.scale(1, sy);
  ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-72, 0); ctx.lineTo(-30, -280); ctx.moveTo(72, 0); ctx.lineTo(30, -280); ctx.moveTo(-60, -80); ctx.lineTo(60, -80); ctx.stroke();
  ctx.fillStyle = '#b88a58'; ctx.fillRect(-120, -100, 240, 10);
  rr(-104, -336, 208, 240, 6); ctx.fillStyle = lg(-104, -336, 104, -96, [[0, '#fbfaf6'], [1, '#e6e3da']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.save(); ctx.translate(0, -230); ctx.scale(.9, .9);
  flamePath(ctx); ctx.fillStyle = '#b4854f'; ctx.fill(); ctx.strokeStyle = '#5a3c1c'; ctx.lineWidth = 4; ctx.stroke();
  ctx.save(); ctx.translate(0, 8); ctx.scale(.78, .8); flamePath(ctx); ctx.fillStyle = '#e8412a'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(2, 26); ctx.scale(.52, .56); flamePath(ctx); ctx.fillStyle = '#ffb02e'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(2, 44); ctx.scale(.28, .3); flamePath(ctx); ctx.fillStyle = '#ffe56a'; ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 1.5; for (let i = -9; i < 9; i++) { ctx.beginPath(); ctx.moveTo(i * 9, -100); ctx.lineTo(i * 9, 100); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
  if (fall < .03 && S && S.labelOn) {   /* the label (drawn outside the squash) */
    const lx = ex, ly = FLOOR - 120, hero = false;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(lx - 92, ly - 24, 184, 46); ctx.strokeStyle = OUTL; ctx.lineWidth = 2; ctx.strokeRect(lx - 92, ly - 24, 184, 46); ctx.restore();
    UI.label('SIMULATED FIRE', lx, ly - 1, { size: 26, weight: 900, fill: '#c4281e', hero: false, crop: true, maxW: 170 });
  }
}

/* the linen cart (a heavy frame, a canvas bag, towels on top), drawn from the sim's pose: the jolt is exaggerated 2.4x */
function linenCart(lt, S) {
  const L = SIML(), jx = S ? (S.cart.x - L.cartX) * 2.4 : 0, ja = S ? S.cart.a * 3 : 0, jy = S ? Math.min(0, (S.cart.y - (FLOOR - L.cartH / 2))) * 2 : 0;
  ctx.save(); ctx.translate(L.cartX + jx, FLOOR + jy); ctx.rotate(ja);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 2, 100, 12); ctx.fill();
  ctx.strokeStyle = '#5a6270'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-80, -44); ctx.lineTo(-84, -300); ctx.moveTo(80, -44); ctx.lineTo(84, -300); ctx.stroke();
  ctx.fillStyle = '#7d8795'; rr(-92, -52, 184, 22, 6); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
  for (const cx of [-70, 70]) { ctx.fillStyle = '#23262c'; ell(cx, -12, 14, 14); ctx.fill(); ctx.fillStyle = '#9aa2ae'; ell(cx, -12, 5, 5); ctx.fill(); ctx.strokeStyle = '#5a6270'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, -30); ctx.lineTo(cx, -22); ctx.stroke(); }
  rr(-86, -300, 172, 250, 14); ctx.fillStyle = lg(-86, 0, 86, 0, [[0, '#a9c0d6'], [.5, '#c9dbe9'], [1, '#9db4cb']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(60,80,110,.4)'; ctx.lineWidth = 2.5; ctx.setLineDash([9, 7]); ctx.beginPath(); ctx.moveTo(-70, -270); ctx.lineTo(70, -270); ctx.moveTo(-70, -75); ctx.lineTo(70, -75); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(-72, -285, 40, 220, 14); ctx.fill();
  const tw = [['#fbfbf6', -56, -318, 62, 34, -.12], ['#e9f0f7', 6, -326, 74, 40, .06], ['#fff', 52, -312, 56, 30, .16], ['#dfe9f2', -6, -308, 90, 26, -.03]];
  for (const [c, tx, ty, w, h, r] of tw) { ctx.save(); ctx.translate(tx, ty); ctx.rotate(r); rr(-w / 2, -h / 2, w, h, 12); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = 'rgba(70,90,110,.55)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = '#5a6270'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-84, -300); ctx.lineTo(-100, -318); ctx.lineTo(-100, -270); ctx.stroke();      /* the push handle */
  ctx.restore();
}
// ------------------------------------------------------------------ P18.extinguisher (the can) and P18.extinguisherNozzle
/* P18.extinguisher(ctx, o): a 5 lb extinguisher drawn at natural size 1 = 200 px from the base to the top of the valve (body 72 wide). o: x, y (the bottom centre; with o.center the centre of the body box, the sim's origin),
 * s (scale), ang (radians, clockwise, about the anchor), pin (0 seal and pin in place, 1 gone), lever (0..1 squeezed), gauge (0..1: 0 = the needle in the red RECHARGE zone, 1 = full), dust (0..1 a grey fur on the shoulders),
 * tip: [x, y, ang] the hose end in WORLD coordinates and the jet direction (the hose is drawn from the valve to it, bowing by o.bow); without it the hose hangs in a loop down the can's side. No text on the can (it tumbles).
 * P18.extinguisherNozzle(o) -> { x, y, ang }: the hose end (world) and the spray direction for the same o (the hanging pose, or o.tip). */
window.P18 = window.P18 || {};
const EXT_ATT = [-26, -100];                       /* the hose attachment, local to the body centre (the sim's numbers) */
function extXf(o) {
  const s = o.s || 1, ang = o.ang || 0, ca = Math.cos(ang), sa = Math.sin(ang);
  if (o.center) return { s, ang, ca, sa, cx: o.x, cy: o.y };
  return { s, ang, ca, sa, cx: o.x + sa * 102 * s, cy: o.y - ca * 102 * s };   /* bottom-centre anchor: the body centre is 102 px above the base along the can's own up axis */
}
const extLocal = (xf, lx, ly) => [xf.cx + (lx * xf.ca - ly * xf.sa) * xf.s, xf.cy + (lx * xf.sa + ly * xf.ca) * xf.s];
window.P18.extinguisherNozzle = o => {
  const xf = extXf(o);
  if (o.tip) return { x: o.tip[0], y: o.tip[1], ang: o.tip[2] };
  const [x, y] = extLocal(xf, -46, 34); return { x, y, ang: xf.ang + PI / 2 };
};
const DUST = []; for (let i = 0; i < 46; i++) DUST.push([(sr(i, 1) - .5) * 70, -64 + sr(i, 2) * 52 * (.4 + .6 * sr(i, 3)), 2 + sr(i, 4) * 6, 1 + sr(i, 5) * 2.6]);
window.P18.extinguisher = (g, o) => {
  const xf = extXf(o), L2 = o.lever || 0, gauge = o.gauge ?? 1, pin = o.pin || 0;
  g.save(); g.translate(xf.cx, xf.cy); g.rotate(xf.ang); g.scale(xf.s, xf.s);
  g.lineJoin = 'round'; g.lineCap = 'round';
  /* the hose (behind the can's left edge when it hangs, in front when it whips) */
  const hose = () => {
    const a = EXT_ATT; g.strokeStyle = '#15171c'; g.lineWidth = 11; g.beginPath(); g.moveTo(a[0], a[1] + 6);
    let tx, ty, jang;
    if (o.tip) { const t = o.tip, inv = Math.cos(-xf.ang), ins = Math.sin(-xf.ang); const dx = (t[0] - xf.cx) / xf.s, dy = (t[1] - xf.cy) / xf.s; tx = dx * inv - dy * ins; ty = dx * ins + dy * inv; jang = t[2] - xf.ang; const bow = (o.bow || 30);
      g.bezierCurveTo(a[0] - 40, a[1] - 28 - bow * .3, tx - Math.cos(jang) * 46 + Math.sin(jang) * bow, ty - Math.sin(jang) * 46 - Math.cos(jang) * bow, tx, ty); }
    else { tx = -46; ty = 34; jang = PI / 2; g.bezierCurveTo(-70, -96, -66, -30, -56, 6); g.bezierCurveTo(-52, 22, -50, 28, tx, ty - 6); }
    g.stroke(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 3; g.stroke();
    g.save(); g.translate(tx, ty); g.rotate(jang); g.fillStyle = '#23262e'; g.strokeStyle = '#000'; g.lineWidth = 3;           /* the horn: a short flared nozzle along the jet */
    g.beginPath(); g.moveTo(-8, -7); g.lineTo(26, -14); g.lineTo(26, 14); g.lineTo(-8, 7); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e05a2b'; g.fillRect(-4, -8, 7, 16); g.restore();
  };
  if (!o.tip) hose();
  /* the body: red steel, a lit left edge, a dark right edge, a black base ring */
  rr(-36, -66, 72, 168, 13); g.fillStyle = lg(-36, 0, 36, 0, [[0, '#ff7a63'], [.28, '#e8372a'], [.7, '#c52a1f'], [1, '#86170f']]); g.fill(); g.strokeStyle = OUTL; g.lineWidth = 4; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.22)'; rr(-30, -58, 9, 140, 5); g.fill();
  g.fillStyle = '#23262e'; rr(-36, 90, 72, 12, 5); g.fill();
  g.fillStyle = '#f4efe3'; rr(-27, -22, 54, 80, 6); g.fill(); g.strokeStyle = 'rgba(40,30,20,.7)'; g.lineWidth = 2.5; g.stroke();                       /* the label: pictograms only */
  g.fillStyle = '#d33a24'; g.beginPath(); g.moveTo(0, -14); g.bezierCurveTo(12, -2, 15, 8, 8, 14); g.bezierCurveTo(4, 8, 0, 8, -2, 14); g.bezierCurveTo(-12, 6, -8, -4, 0, -14); g.fill();
  g.fillStyle = '#1c9d53'; g.beginPath(); g.moveTo(-17, 44); g.lineTo(-5, 44); g.lineTo(-11, 32); g.closePath(); g.fill(); g.fillStyle = '#c8281e'; g.fillRect(-2, 32, 12, 12); g.fillStyle = '#2a63c8'; ell(18, 38, 6, 6); g.fill();
  g.fillStyle = '#3b4250'; g.fillRect(-27, 50, 54, 4);
  /* the valve head, handle and lever */
  rr(-28, -98, 56, 34, 8); g.fillStyle = lg(0, -98, 0, -64, [[0, '#454c5a'], [1, '#262a33']]); g.fill(); g.strokeStyle = OUTL; g.lineWidth = 3.5; g.stroke();
  g.fillStyle = '#b08a3a'; rr(-36, -98, 14, 12, 3); g.fill(); g.strokeStyle = OUTL; g.lineWidth = 2.4; g.stroke();                                         /* the brass hose fitting */
  g.fillStyle = '#23262e'; g.strokeStyle = '#000'; g.lineWidth = 3; rr(-30, -108, 58, 10, 4); g.fill(); g.stroke();                                         /* the carry handle */
  g.save(); g.translate(26, -112); g.rotate(-.08 + L2 * .32); g.fillStyle = '#c8281e'; rr(-52, -6, 56, 11, 4); g.fill(); g.stroke(); g.restore();           /* the lever */
  if (pin < .5) { g.strokeStyle = '#d8dde4'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(-10, -118); g.lineTo(-10, -96); g.stroke(); g.lineWidth = 3.4; g.beginPath(); g.arc(-10, -128, 10, 0, TAU); g.stroke();
    g.strokeStyle = '#e8a020'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-3, -111); g.quadraticCurveTo(10, -90, 20, -100); g.stroke(); }                 /* the pin, its ring and the tamper tie */
  /* the gauge on the valve head */
  g.fillStyle = '#eef1f4'; g.strokeStyle = OUTL; g.lineWidth = 3; ell(8, -80, 14, 14); g.fill(); g.stroke();
  g.lineWidth = 5; g.strokeStyle = '#d8281e'; g.beginPath(); g.arc(8, -80, 9.5, PI * 1.0, PI * 1.28); g.stroke(); g.strokeStyle = '#1c9d53'; g.beginPath(); g.arc(8, -80, 9.5, PI * 1.32, PI * 1.82); g.stroke();
  { const na = lerp(PI * 1.06, PI * 1.78, gauge); g.strokeStyle = '#1b1d22'; g.lineWidth = 2.8; g.beginPath(); g.moveTo(8, -80); g.lineTo(8 + Math.cos(na) * 11, -80 + Math.sin(na) * 11); g.stroke(); g.fillStyle = '#1b1d22'; ell(8, -80, 2.4, 2.4); g.fill(); }
  if (o.dust) { g.save(); g.globalAlpha = .5 * o.dust; g.fillStyle = '#9a9588'; for (const [dx, dy, rx, ry] of DUST) { ell(dx, dy, rx, ry * .6); g.fill(); }
    g.fillStyle = 'rgba(150,146,134,.5)'; g.fillRect(-28, -98, 56, 7); g.fillRect(-36, -66, 72, 8); g.restore(); }
  if (o.tip) hose();
  g.restore();
};
const extDraw = o => window.P18.extinguisher(ctx, o);

// ------------------------------------------------------------------ the Marshal's flashlight (a prop held in his hand, pointing at torchAng: 0 up, clockwise) and the cast
if (typeof EXT !== 'undefined' && EXT.prop) {
  EXT.prop.fp18_torch = (side, o, t) => {
    ctx.save(); ctx.rotate(o.torchAng ?? 1.4);
    ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-13, -52, 26, 86, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2630'; rr(-18, -76, 36, 28, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = (o.torchOn ?? 1) > .5 ? '#fffbe0' : '#9a9588'; ell(0, -78, 14, 6); ctx.fill();
    ctx.fillStyle = '#8f0f1e'; ctx.fillRect(-13, -14, 26, 8);
    ctx.restore();
  };
  PROP_BOX.fp18_torch = [-30, -60, 30, 40];
}
const FEET = (o, s) => { const k = KINDS[o.kind]; return FLOOR - ((k.leg || 90) + k.ry * .9) * s; };            /* world y of a character's body centre */
let TRANSIT = false;
function mk(ctor, lt, p, o) {
  const c = ctor(Object.assign({ t: lt }, o));
  c.x = p.x; c.y = p.y ?? FLOOR; c.s = p.s; c.lift = p.lift || 0;
  if (p.yaw != null) { c.yaw = p.yaw; c.headYaw = p.headYaw ?? p.yaw; }
  if (p.transit || TRANSIT) c.transit = true;
  return c;
}
const poms = (lt, p, o) => mk(A6.pom, lt, p, Object.assign({ hold: { r: 'fp18_torch' }, torchAng: 1.4, arms: { l: 'rest', r: 'hold' }, grip: { r: [112, 40] }, look: [.3, 0], expr: 'neutral' }, o));
const strawO = (lt, p, o) => mk(A11.straw, lt, p, o);
const mangoO = (lt, p, o) => mk(A7.mango, lt, p, o);
const lemonO = (lt, p, o) => mk(A7.lemon, lt, p, o);
const onionO = (lt, p, o) => mk(A15.onion, lt, p, o);
/* Binder: floats in front of the wall; he hops and talks */
function binderO(lt, p, o) {
  const b = A15.binder(Object.assign({ x: p.x, y: p.y, s: p.s, center: true, noLegs: true, who: 'bind', t: lt, pose: 'rest', look: [.2, .3], bob: .5, hover: 6 }, o));
  if (p.rot) b.rot = p.rot; return b;
}
// ------------------------------------------------------------------ light: a darkness mask in world space with holes (the beam, the doorway, the lamps), and the torch's cone
let MASK = null;
function lightMask(alpha, holes, tint) {
  if (alpha <= .01) return;
  if (!MASK) { MASK = V2.mk(W, H); }
  const M = ctx.getTransform(), g = MASK.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.fillStyle = tint || 'rgb(8,10,22)'; g.globalAlpha = alpha; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  g.setTransform(M.a, M.b, M.c, M.d, M.e, M.f); g.globalCompositeOperation = 'destination-out';
  for (const h of holes) {
    if (h.type === 'glow') { const gr = g.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r); gr.addColorStop(0, `rgba(0,0,0,${h.a})`); gr.addColorStop(.55, `rgba(0,0,0,${h.a * .55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(h.x - h.r, h.y - h.r, h.r * 2, h.r * 2); }
    else if (h.type === 'rect') { const gr = g.createLinearGradient(h.x0, h.y0, h.x0, h.y1); gr.addColorStop(0, `rgba(0,0,0,${h.a})`); gr.addColorStop(1, `rgba(0,0,0,${h.a * .6})`); g.fillStyle = gr; g.fillRect(h.x0, h.y0, h.x1 - h.x0, h.y1 - h.y0); }
    else if (h.type === 'cone') {   /* nested cones: a soft edge */
      for (let k = 0; k < 4; k++) {
        const sp = h.spread * (1 - k * .2), a0 = h.ang - sp / 2, a1 = h.ang + sp / 2;
        const gr = g.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.len); gr.addColorStop(0, `rgba(0,0,0,${h.a * .3})`); gr.addColorStop(.7, `rgba(0,0,0,${h.a * .22})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + Math.cos(a0) * h.len, h.y + Math.sin(a0) * h.len); g.arc(h.x, h.y, h.len, a0, a1); g.closePath(); g.fill();
      }
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(MASK, 0, 0); ctx.restore();
}

// ------------------------------------------------------------------ the foam on the floor: lumps along the corridor that swell where the can has passed (the start times come from the sim's path)
let LUMPS = null;
function pathT0(x, S) {   /* the first time the can has passed within reach of x (the foam it throws lands there a moment later) */
  let t0 = 1e9;
  if (S) for (let t = T0; t < T0 + 2.95; t += 1 / 30) { const a = simAt(t); if (a && Math.abs(a.can.x - x) < 230) { t0 = t; break; } }
  if (x > 760 && x < 1160) t0 = Math.min(t0, T0 + .16);                                      /* the first blast pours onto the floor in front of Lemon */
  return t0 > 1e8 ? T0 + 2.9 : t0;
}
function lumps() {
  if (LUMPS) return LUMPS;
  const S = simInit(), rows = [[], [], [], []];
  const mkRow = (r, x0, x1, step, jit, w0, w1, h0, h1, y0, dy, tAdd, skip) => {
    for (let i = 0, x = x0; x < x1; i++, x += step + jit * (sr(i + r * 40, 21) - .5) * 2) {
      if (sr(i + r * 40, 26) < skip) continue;
      rows[r].push({ x, w: lerp(w0, w1, sr(i + r * 40, 23)), h: lerp(h0, h1, sr(i + r * 40, 24)), y: y0 + dy * (sr(i + r * 40, 27) - .5), t0: pathT0(x, S) + tAdd + .18 * sr(i + r * 40, 25), seed: i + r * 50 + 3, i });
    }
  };
  mkRow(0, 520, 1840, 78, 36, 120, 200, 40, 80, FLOOR - 2, 0, .26, 0);
  mkRow(1, 440, 1900, 150, 50, 110, 190, 40, 70, FLOOR + 50, 24, .38, .22);
  mkRow(2, 400, 1950, 270, 90, 230, 350, 60, 100, FLOOR + 160, 50, .5, .12);
  mkRow(3, 420, 2000, 420, 150, 340, 520, 90, 140, FLOOR + 300, 60, .62, .1);
  return (LUMPS = rows);
}
function floorFoam(lt, front) {
  if (lt < T0) return;
  const rows = lumps(), list = front ? [1, 2, 3] : [0];
  for (const r of list) for (const L of rows[r]) {
    if (lt < L.t0 || L.x + L.w < VIEW.x0 - 120 || L.x - L.w > VIEW.x1 + 120) continue;
    fxPile({ x: L.x, y: L.y, w: L.w, h: L.h, t: lt, t0: L.t0, grow: .8 + .15 * r, seed: L.seed });
  }
}
/* the jet: the sim's nozzle drives FX18.foamJet (segments with a falling rate and speed: the gas runs out) */
const nozAt = te => { const n = simAt(te); return n ? { x: n.nz.x, y: n.nz.y, ang: n.nz.ang } : { x: 0, y: 0, ang: 0 }; };
function foamJets(lt) {
  if (lt < T0) return;
  const segs = [[T0, 28.9, 190, 1500, 56, .32], [28.9, 29.7, 150, 1250, 52, .34], [29.7, 30.4, 120, 1050, 50, .36], [30.4, 30.95, 96, 950, 46, .3], [30.95, CUE.splat + .02, 90, 1100, 52, .22]];
  ctx.save(); ctx.beginPath(); ctx.rect(VIEW.x0 - 300, VIEW.y0 - 600, VIEW.x1 - VIEW.x0 + 600, FLOOR + 34 - (VIEW.y0 - 600)); ctx.clip();   /* foam meets the floor: nothing falls through it */
  segs.forEach(([a, b, rate, speed, size, spread], i) => { if (lt >= a) fxJet({ nozzle: nozAt, t0: a, t1: b, t: lt, rate, speed, spread, size, gravity: 1500, seed: 7 + i, color: '#ffffff' }); });
  ctx.restore();
}

// ------------------------------------------------------------------ the torch: where the lens is and what it points at
const TORCH_GRIP = [112, 40];
function mPose(lt) { return { x: X.marshal, s: MS }; }
function torchLens(p, ang) {   /* world position of the lens for a Marshal at p with the torch at ang (0 up, clockwise) */
  const yc = FEET({ kind: 'pom' }, p.s), hx = p.x + TORCH_GRIP[0] * p.s, hy = yc + TORCH_GRIP[1] * p.s;
  return { x: hx + Math.sin(ang) * 80 * p.s, y: hy - Math.cos(ang) * 80 * p.s, hx, hy };
}
const torchAngFor = (p, tx, ty) => { let a = Math.atan2(ty - torchLens(p, 1.4).y, tx - torchLens(p, 1.4).x) + PI / 2; for (let i = 0; i < 3; i++) { const l = torchLens(p, a); a = Math.atan2(ty - l.y, tx - l.x) + PI / 2; } return a; };
// ------------------------------------------------------------------ the cast's acting (all pure functions of lt)
const inB = (id, lt, pre = 0, post = 0) => lt >= bS(id) - pre && lt < bE(id) + post;
const POS = {
  marshal: { x: X.marshal, s: MS, yaw: .5, headYaw: .6 }, straw: { x: X.straw, s: CS, yaw: -.5 }, mango: { x: X.mango, s: CS, yaw: -.5 }, onion: { x: X.onion, s: CS, yaw: -.5 },
  lemon: { x: 1330, s: CS, yaw: -.6 },
};
const faceW = (kind, p) => ({ x: p.x, y: FEET({ kind }, p.s) + KINDS[kind].eyeY * p.s });
const mangoX = lt => lerp(X.mango, 1420, ss(lt, 9.0, 12.2));          /* Mango walks to her cart while the camera is elsewhere */
/* the torch target: keys of [time, [x, y]]; the beam follows the talk */
const TORCH = [[1.0, [760, 1100]], [1.35, [880, 960]], [3.2, [880, 930]], [3.4, [690, 905]], [4.3, [880, 905]], [5.3, [1070, 915]], [6.4, [1250, 700]], [7.7, [1250, 700]], [9.35, [1400, 930]], [12.7, [1400, 930]],
  [12.76, [1070, 915]], [17.2, [1070, 915]], [17.6, [1250, 760]], [19.6, [1760, 820]], [20.2, [1440, 905]], [21.0, [1786, 836]], [23.0, [1786, 836]], [23.3, [1520, 860]], [24.6, [1520, 860]], [25.0, [1330, 960]], [28.3, [1330, 960]], [28.6, [900, 1100]]];
function torchTarget(lt) {
  if (lt < CUE.click1) return [700, 1100];
  const t = key(TORCH, lt, easeIO);
  return t;
}
function aMarshal(lt, p, sh) {
  const writing = lt >= 34.9 && lt < 37.6, tgt = torchTarget(lt);
  const o = { arms: { l: 'hips', r: 'hold' }, grip: { r: TORCH_GRIP }, hold: { r: 'fp18_torch' }, expr: 'neutral', lid: lt >= CUE.splat ? .3 : .08, torchOn: lt >= CUE.click1 && lt < CUE.splat ? 1 : 0, look: [.35, 0] };
  const ang = lt < 28.5 ? torchAngFor(p, tgt[0], tgt[1]) : lerp(torchAngFor(p, tgt[0], tgt[1]), 2.6, ss(lt, 28.6, 29.4));
  o.torchAng = writing ? 2.9 : ang;
  if (inB('p7', lt)) o.arms.l = 'offer';
  if (inB('p4', lt)) o.browUp = 7;
  if (inB('p5', lt) || inB('p6', lt)) { o.arms.l = lt < 21 ? 'stop' : 'hips'; o.look = [.55, -.05]; }
  if (inB('p3', lt) || inB('p4', lt)) o.look = [.5, -.1];
  if (lt >= T0 && lt < CUE.splat + .3) { const a = simAt(lt); if (a) o.look = [Math.max(-.9, Math.min(.9, (a.can.x - p.x) / 420)), Math.max(-.5, Math.min(.5, (a.can.y - 920) / 500))]; }
  if (lt >= CUE.splat - .02 && lt < CUE.splat + .22) o.lid = 1; else if (lt >= CUE.splat + .22 && lt < CUE.splat + .6) o.lid = lerp(.9, .3, (lt - CUE.splat - .22) / .38);
  if (writing) {
    o.hold = {}; o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: [-50, 46], r: [54, 46] }; o.look = [.0, .85]; o.expr = 'neutral';
  }
  return o;
}
function aStraw(lt, p) {
  const o = { expr: 'dead', lid: .52, look: [-.55, .05], arms: { l: 'rest', r: 'hold' }, grip: { r: [86, 44 + wob(lt, 1.6, 2)] }, hold: { r: 'medcup' }, acc: ['steth', 'bandage7', 'perdiem9'] };
  if (inB('s1', lt, .2)) { o.look = [-.4, .15]; o.grip = { r: [86 + 6 * ss(lt, bS('s1') + .3, bS('s1') + .5), 38] }; }
  return o;
}
function aMango(lt, p) {
  const o = { expr: inB('m3', lt) && lt > wS('m3', 3) - .1 ? 'smug' : 'happy', look: [-.5, .05], arms: { l: 'rest', r: 'rest' } };
  if (inB('m1', lt)) { o.look = [-.25, 0]; o.arms.r = 'thumb'; }
  if (lt >= 12 && lt < 24.9) {
    o.look = lt > 22.5 ? [.4, .1] : [-.3, .05];
    if (inB('m2', lt)) o.arms.r = 'point';
    if (lt > bS('m3') + .2 && lt < 24.8) { const pat = Math.sin((lt - bS('m3')) * 9) * .5 + .5; o.arms = { l: 'rest', r: 'hold' }; o.grip = { r: [78, -76 + pat * 14] }; }
  }
  return o;
}
function aOnion(lt, p) {
  const sob = Math.max(lt >= CUE.sniffle1 && lt < CUE.sniffle1 + .5 ? Math.abs(Math.sin((lt - CUE.sniffle1) * 14)) * Math.exp(-(lt - CUE.sniffle1) * 4) : 0, lt >= CUE.sniffle2 && lt < CUE.sniffle2 + .6 ? Math.abs(Math.sin((lt - CUE.sniffle2) * 13)) * Math.exp(-(lt - CUE.sniffle2) * 3.4) : 0);
  const hard = inB('o3', lt, .3, .6), cry = lt < 5.2 ? .5 : (hard ? 1 : .72);
  return { cry, sob: sob * .9, expr: hard ? 'onion_wail' : 'onion_cry', look: [-.45, .05], pose: 'clip', tabLit: 1 };
}
function aLemon(lt, p) {
  const strain = ss(lt, wS('l1', 2), T0), burst = lt >= T0;
  const o = { expr: lt < 26.9 ? 'neutral' : 'sour', lid: .35, look: [-.6, .15], arms: { l: 'hold', r: 'hips' } };
  const sh = strain * (1 + 2 * ss(lt, T0 - .3, T0)), jx = Math.sin(lt * 62) * 2.6 * sh, jy = Math.cos(lt * 55) * 2.2 * sh;
  const c = canStart(), fy = FEET({ kind: 'lemon' }, p.s), ca = Math.cos(c.ang), sa = Math.sin(c.ang);
  const loc = (x, y) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca];
  const G1 = loc(6, -96), G2 = loc(34, 4), g = [lerp(G1[0], G2[0], ss(lt, wS('l1', 2) - .1, wS('l1', 2) + .2)), lerp(G1[1], G2[1], ss(lt, wS('l1', 2) - .1, wS('l1', 2) + .2))];
  o.grip = { l: [(g[0] - p.x) / p.s + jx, (g[1] - fy) / p.s + jy] };
  if (lt >= T0) {
    const k = ss(lt, T0 + .2, T0 + .34); o.expr = 'shock'; o.lid = 0; o.look = [.2, -.3]; if (lt > 29.7 && lt < 31.0) o.look = [.5, -.7];
    if (lt < T0 + .22) { const a = simAt(lt).can, ca2 = Math.cos(a.a), sa2 = Math.sin(a.a), q = [a.x + 34 * ca2 - 4 * sa2, a.y + 34 * sa2 + 4 * ca2]; o.grip = { l: [(q[0] - p.x) / p.s, (q[1] - fy) / p.s] }; }
    else { o.grip = null; o.arms = { l: mixPose('hold', 'flail', k), r: mixPose('hips', 'flail', k) }; }
  }
  if (lt >= 33.2) { o.expr = 'neutral'; o.arms = { l: 'rest', r: 'rest' }; o.lid = .45 + .5 * Math.max(0, 1 - Math.abs(lt - 34.25) * 9); o.look = [-.1, 0]; }
  return o;
}
const mixPose = (a, b, k) => { const A = poseAnglesOf(a), B = poseAnglesOf(b); return [lerp(A[0], B[0], k), lerp(A[1], B[1], k)]; };
const poseAnglesOf = p => Array.isArray(p) ? p : poseAngles(p, 0);
/* where the can sits in Lemon's hands (the sim's start pose) */
function canStart() {
  const S = simInit(), p = S ? S.prm : { startX: 1168, startY: 948, startAng: .48 }, ang = p.startAng, ca = Math.cos(ang), sa = Math.sin(ang);
  const loc = (x, y) => [p.startX + x * ca - y * sa, p.startY + x * sa + y * ca];
  const h = loc(-26, -100), tip = S ? S.nozzle(T0, {}) : { x: h[0] - 40, y: h[1] + 50, ang: 2.3 };
  const hd = loc(8, -104);
  return { x: p.startX, y: p.startY, ang, hornX: tip.x, hornY: tip.y, jet: tip.ang, handleX: hd[0], handleY: hd[1] };
}
/* Binder: out of the tablet at the pop, hovering by it; gone back in before the demonstration */
function binderState(lt) {
  if (lt < CUE.binderpop || lt > 25.6) return null;
  const k = ss(lt, CUE.binderpop, CUE.binderpop + .32), back = ss(lt, 24.9, 25.4);
  const s = lerp(.12, .62, eb(k)) * (1 - back * .8);
  const home = [TAB.x, TAB.y - 14], hov = [TAB.x - 66 + wob(lt, 1.7, 8), TAB.y + 24 + wob(lt, 2.3, 7)];
  const x = lerp(home[0], hov[0], eb(k)) , y = lerp(home[1], hov[1], eb(k));
  return { x: lerp(x, home[0], back), y: lerp(y, home[1], back), s, k };
}
// ------------------------------------------------------------------ the shots: a camera [cx, cy, z] (the world point at the frame centre and the zoom) as a function of u (0..1 through the shot) and the cast that is drawn
const camAt = (wx, wy, z, sx = 540, sy = 800) => [wx + (540 - sx) / z, wy + (960 - sy) / z, z];
const SHOTS = [];
const shot = (id, s, e, cam, o) => SHOTS.push(Object.assign({ id, s: snapT(s), e: snapT(e), cam }, o || {}));
const fcM = () => faceW('pom', POS.marshal);
const mcu = (name, kind, z0, z1, sy = 780, dx = 0, xf) => (u, lt) => { const p = Object.assign({}, POS[name]); if (xf) p.x = xf(lt); const f = faceW(kind, p); return camAt(f.x + dx, f.y, lerp(z0, z1, u), 540, sy); };
shot('open', 0, 1.4, u => [lerp(410, 430, u), 905, lerp(.78, .82, u)], { cast: ['marshalDoor', 'straw', 'mango', 'onion'], dark: .86, dim: .12, openStage: 1 });
shot('p1', 1.4, 3.297, mcu('marshal', 'pom', 2.2, 2.34, 860, 28), { cast: ['marshal'] });
shot('s1', 3.297, 4.235, mcu('straw', 'straw', 2.5, 2.62, 720, 8), { cast: ['straw'] });
shot('m1', 4.235, 5.214, mcu('mango', 'mango', 2.55, 2.45, 760, 8), { cast: ['mango'] });
shot('o1', 5.214, 6.3, mcu('onion', 'onion', 2.45, 2.55, 740, 10), { cast: ['onion'] });
shot('b1', 6.3, 7.578, u => camAt(1226, 740, lerp(2.0, 2.12, u), 540, 800), { cast: ['binder'] });
shot('p2', 7.578, 9.66, (u, lt) => { const k = easeIO(sg(u, .12, .96)), f = fcM(); return camAt(lerp(f.x + 20, 1390, k), lerp(f.y, 900, k), lerp(2.0, 1.45, k), 540, lerp(860, 780, k)); }, { cast: ['marshal', 'binder'], pan: 1 });
shot('ex1', 9.66, 10.9, u => camAt(1400, 970, lerp(2.9, 3.1, u), 540, 840), { cast: [], dark: .5, insert: 1 });
shot('ex2', 10.9, 12.744, u => camAt(1376, 1000, lerp(4.5, 4.7, u), 540, 800), { cast: [], dark: .5, insert: 1 });
shot('o2', 12.744, 13.757, mcu('onion', 'onion', 2.5, 2.6, 740, 10), { cast: ['onion'], beam: 1 });
shot('p4', 13.757, 15.632, mcu('marshal', 'pom', 2.28, 2.4, 860, 30), { cast: ['marshal'] });
shot('o3', 15.632, 17.367, mcu('onion', 'onion', 2.6, 2.75, 740, 10), { cast: ['onion'], beam: 1 });
shot('p5', 17.367, 20.05, (u, lt) => { const k = easeIO(sg(u, .1, .9)), f = fcM(); return camAt(lerp(f.x + 80, 1700, k), lerp(f.y, 880, k), lerp(1.7, 1.5, k), 540, lerp(840, 800, k)); }, { cast: ['marshal', 'straw', 'onion', 'mangoCart'], pan: 1 });
shot('m2', 20.05, 20.93, mcu('mango', 'mango', 2.5, 2.6, 760, 20, mangoX), { cast: ['mangoCart'] });
shot('sg', 20.93, 23.145, u => camAt(1786, 880, lerp(2.9, 3.05, u), 540, 780), { cast: [], beam: 1 });
shot('m3', 23.145, 24.867, u => camAt(1596, 925, lerp(1.7, 1.82, u), 540, 800), { cast: ['mangoCart'], beam: 1 });
shot('p7', 24.867, 26.733, mcu('marshal', 'pom', 2.2, 2.3, 860, 28), { cast: ['marshal'] });
shot('l1', 26.733, T0, (u, lt) => { const f = faceW('lemon', POS.lemon); return camAt(f.x - 70, f.y + 60, lerp(2.1, 2.35, u), 540, 800); }, { cast: ['lemon'], chips: 1 });
shot('r1', T0, 28.957, (u, lt) => camAt(lerp(1330, 1420, easeIO(u)), 920, lerp(1.35, 1.22, u), 540, 800), { cast: ['lemon'], rampage: 1 });
shot('r2', 28.957, 29.55, u => camAt(lerp(1480, 1380, easeIO(u)), lerp(900, 790, easeIO(u)), lerp(1.4, 1.1, u), 540, 800), { cast: ['lemon'], rampage: 1 });
shot('r3', 29.55, 30.4, u => { const w = easeIO(sg(u, .76, 1)); return camAt(lerp(lerp(930, 880, u), 700, w), lerp(880, 970, w), lerp(lerp(.78, .8, u), 1.2, w), 540, lerp(800, 860, w)); }, { roll: -.05, whip: [30.19, 30.4], cast: ['lemon', 'marshal', 'onion'], rampage: 1 });
shot('r4', 30.4, CUE.splat, u => camAt(lerp(700, 560, u), 970, lerp(1.2, 1.55, u), 540, 860), { cast: ['marshal'], rampage: 1 });
shot('r5', CUE.splat, 33.714, (u, lt) => { const f = fcM(); return camAt(f.x + 28, f.y, lerp(2.3, 2.5, u), 540, 860); }, { cast: ['marshal'], rampage: 1, hold: 1 });
shot('l2', 33.714, 35.039, u => { const f = faceW('lemon', POS.lemon); return camAt(f.x - 30, f.y + 40, lerp(2.4, 2.5, u), 540, 760); }, { cast: ['lemon'], rampage: 1 });
shot('p9', 35.039, 37.512, u => camAt(lerp(455, 465, u), 930, lerp(1.35, 1.45, u), 330, 740), { cast: ['strawGlide', 'marshalWrite'], rampage: 1 });
shot('end', 37.512, 38.8, u => camAt(lerp(880, 895, u), 820, lerp(.95, .9, u), 540, 800), { cast: ['marshalEnd', 'lemonEnd', 'mangoEnd', 'onionEnd', 'strawEnd'], rampage: 1, hold: 1 });
function shotAt(lt) { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s) r = sh; return r; }

// ------------------------------------------------------------------ drawing the world for one frame
function setLight(lt, dark) {
  V2.setLight({ key: [-.1, -.9], keyColor: '#fff0d4', keyA: .26 * (1 - (dark || 0) * .5), rim: '#8fb3ff', rimA: .38, shadow: '#161a30', shadowA: .36, bounce: '#bfd8c4', bounceA: .12, amb: '#c8d4f0', ambA: .05 });
}
const BOOTS = [.34, .62, .9];
function mPlace(sh, lt) {
  const has = n => sh.cast.indexOf(n) >= 0;
  if (has('marshalDoor')) { const k = ss(lt ?? 1, .2, 1.0), st = Math.max(0, Math.sin(PI * ((lt ?? 1) - .2) / .28)); return { x: lerp(X.door - 36, X.door + 14, k), s: MS * lerp(.94, 1, k), yaw: .45, headYaw: .5, lift: (lt > .2 && lt < 1.0) ? st * 7 : 0 }; }
  if (has('marshalWrite')) return { x: POS.marshal.x, s: MS, yaw: .1, headYaw: .12 };
  if (has('marshalEnd')) return { x: END_X.marshal, s: MS, yaw: .12, headYaw: .1 };
  return POS.marshal;
}
const END_X = { marshal: 480, mango: 740, onion: 910, lemon: 1070 };
const strawGlideX = lt => 640 + 190 * (lt - 35.04);
function drawChars(lt, sh, layer) {
  TRANSIT = !!sh.pan || !!(sh.whip && lt >= sh.whip[0] - .15);
  const out = [], P = POS, has = n => sh.cast.indexOf(n) >= 0;
  const add = (z, f) => out.push([z, f]);
  const M = P.marshal;
  if (has('marshal') || has('marshalWrite') || has('marshalEnd') || has('marshalDoor')) {
    const p = mPlace(sh, lt), o = aMarshal(lt, p, sh);
    if (has('marshalDoor')) { o.arms = { l: 'rest', r: 'hold' }; o.torchAng = lerp(1.9, 1.15, sg(lt, CUE.click1 - .1, 1.4)); }
    if (has('marshalEnd')) { o.torchOn = 0; o.look = [.05, .15]; o.hold = {}; o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: [-50, 46], r: [54, 46] }; }
    add(5, () => drawChar(mk(A6.pom, lt, p, o)));
  }
  const OS = sh.openStage ? { straw: { x: 600, s: CS * .9 }, mango: { x: 770, s: CS * .9 }, onion: { x: 940, s: CS * .9 } } : null;
  if (has('straw') && OS) add(4, () => drawChar(strawO(lt, Object.assign({}, P.straw, OS.straw), aStraw(lt, P.straw))));
  else if (has('straw')) { const rampage = lt >= T0 - 1; add(rampage ? 3 : 4, () => drawChar(strawO(lt, rampage ? { x: 238, s: CS * .9, yaw: .3 } : P.straw, rampage ? Object.assign(aStraw(lt, P.straw), { look: [.5, -.2], lid: .5 }) : aStraw(lt, P.straw)))); }
  if (has('strawGlide') || has('strawEnd')) add(2, () => { const o = strawO(lt, { x: strawGlideX(lt), y: FLOOR - 22, s: CS * .66, yaw: .3, transit: true }, Object.assign(aStraw(lt, P.straw), { look: [.3, 0], arms: { l: 'rest', r: 'hold' }, grip: { r: [86, 44] }, plant: true })); o.noBob = true; drawChar(o); });
  if (has('mango')) add(4, () => drawChar(mangoO(lt, OS ? Object.assign({}, P.mango, OS.mango) : { x: P.mango.x, s: CS, yaw: P.mango.yaw }, aMango(lt, P.mango))));
  if (has('mangoCart')) add(4, () => drawChar(mangoO(lt, { x: lt >= 12.2 ? 1420 : mangoX(lt), s: CS, yaw: lt > 23 ? -.35 : -.25 }, Object.assign(aMango(lt, P.mango), mangoJump(lt)))));
  if (has('mangoEnd')) add(4, () => drawChar(mangoO(lt, { x: END_X.mango, s: CS, yaw: -.45 }, Object.assign(aMango(lt, P.mango), { arms: { l: 'rest', r: 'rest' }, expr: 'shock', look: [-.5, .1] }))));
  if (has('onion')) add(4, () => drawChar(onionO(lt, OS ? Object.assign({}, P.onion, OS.onion) : P.onion, aOnion(lt, P.onion))));
  if (has('onionEnd')) add(4, () => drawChar(onionO(lt, { x: END_X.onion, s: CS, yaw: -.45 }, aOnion(lt, P.onion))));
  if (has('lemon')) { const o = aLemon(lt, P.lemon), pl = Object.assign({}, P.lemon); if (lt >= 28.46 && lt < 30.4) { o.squash = .14 * Math.exp(-(lt - 28.46) * 4); pl.x += 18 * Math.exp(-(lt - 28.46) * 5); } add(4.5, () => drawChar(lemonO(lt, pl, o))); }
  if (has('lemonEnd')) add(4, () => drawChar(lemonO(lt, { x: END_X.lemon, s: CS, yaw: -.5 }, aLemon(lt, P.lemon))));
  if (has('binder') && binderState(lt)) { const b = binderState(lt); add(6, () => drawBinder(lt, b, sh)); }
  out.sort((a, b) => a[0] - b[0]); for (const [, f] of out) f();
  TRANSIT = false;
}
function mangoJump(lt) {   /* the cart rattles: Mango jumps back */
  if (lt < CUE.cart || lt > CUE.cart + 1.4) return {};
  const a = lt - CUE.cart; return { arms: { l: 'flail', r: 'flail' }, expr: 'shock', lift: Math.max(0, Math.sin(Math.min(1, a / .4) * PI)) * 26 };
}
function drawBinder(lt, b, sh) {
  const grin = Math.max(.3 + .1 * Math.sin(lt * 2.1), ss(lt, CUE.binderpop + .15, CUE.binderpop + .5));
  const talk = lt >= bS('b1') && lt < bE('b1') + .2;
  const o = binderO(lt, { x: b.x, y: b.y, s: b.s }, { transit: !!sh.pan, pose: talk ? 'cheer' : lt > 7.7 ? 'helpful' : 'rest', grin, glint: lt > 7.2 ? Math.max(0, Math.sin((lt - 7.2) * 5)) ** 5 : 0, look: [-.3, .2] });
  ctx.save(); ctx.shadowColor = 'rgba(10,8,16,.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; drawChar(o); ctx.restore();
}
// ------------------------------------------------------------------ the can (in the cabinet, in Lemon's hands, then the sim's), the pin and ring, the cobweb and spider, the 2019 tag
function drawCan(lt, sh, S) {
  const c = canStart();
  if (lt < 24.9) { extDraw({ x: X.cabinet, y: 1104, s: 1, dust: .9, gauge: .04, pin: 0 }); return; }
  if (lt < T0) {
    const sq = ss(lt, wS('l1', 2), T0), j = sq * (1 + 2 * ss(lt, T0 - .3, T0)), jx = Math.sin(lt * 62) * 2.6 * j, jy = Math.cos(lt * 55) * 2.2 * j;
    if (sh.cast.indexOf('lemon') < 0 && lt < 26.7) return;
    extDraw({ x: c.x + jx, y: c.y + jy, s: 1, ang: c.ang, center: true, tip: [c.hornX + jx, c.hornY + jy, c.jet], bow: 20, dust: .5, gauge: .04, pin: lt >= CUE.pinpull ? 1 : 0, lever: sq });
    return;
  }
  const a = S, lev = ss(lt, T0, T0 + .08);
  extDraw({ x: a.can.x, y: a.can.y, s: 1, ang: a.can.a, center: true, tip: [a.nz.x, a.nz.y, a.nz.ang], bow: 34 * Math.sin(lt * 21) + 26, dust: .3 * (1 - ss(lt, T0, T0 + 1.4)), gauge: lerp(.04, 0, 1), pin: 1, lever: lev });
}
function flyingPin(lt) {
  if (lt < CUE.pinpull || lt > CUE.pinpull + 1.2) return;
  const c = canStart(), a = lt - CUE.pinpull, x0 = c.x - 10 + Math.sin(c.ang) * -20, y0 = c.y - 118;
  const x = x0 - 330 * a, y = y0 - 640 * a + 1300 * a * a, ro = a * 14;
  if (y > FLOOR - 6) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ro); ctx.strokeStyle = '#d8dde4'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.stroke();
  ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(0, -11, 12, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#e8a020'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 6); ctx.quadraticCurveTo(24, 24, 10, 38); ctx.stroke();
  ctx.restore();
  if (a < .22) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(255,240,200,${.9 * (1 - a / .22)})`; ctx.lineWidth = 4; for (let i = 0; i < 7; i++) { const ang = -PI + i * .5 + .2, r0 = 16 + a * 120, r1 = r0 + 26; ctx.beginPath(); ctx.moveTo(x0 + Math.cos(ang) * r0, y0 + Math.sin(ang) * r0); ctx.lineTo(x0 + Math.cos(ang) * r1, y0 + Math.sin(ang) * r1); ctx.stroke(); } ctx.restore(); }
}
function cobweb(lt) {   /* from the cabinet's top-left corner to the can's head, with a spider on a thread */
  const x0 = X.cabinet - 104, y0 = 770, hx = X.cabinet - 34, hy = 902;
  ctx.save(); ctx.strokeStyle = 'rgba(235,238,240,.7)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const a = i / 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0 + 150, hx, a), lerp(y0 + 18, hy, a)); ctx.stroke(); }
  for (let r = 1; r <= 5; r++) { ctx.beginPath(); for (let i = 0; i <= 5; i++) { const a = i / 5, px = x0 + (lerp(x0 + 150, hx, a) - x0) * r / 5.2, py = y0 + (lerp(y0 + 18, hy, a) - y0) * r / 5.2 + Math.sin(i * 1.7 + r) * 3; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  const sx = x0 + 74, sy = y0 + 70 + Math.sin(lt * 1.9) * 9, sw = Math.sin(lt * 1.3) * 3;
  ctx.strokeStyle = 'rgba(235,238,240,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx + 1, y0 + 14); ctx.lineTo(sx + sw, sy); ctx.stroke();
  ctx.fillStyle = '#17161a'; ell(sx + sw, sy + 5, 5.4, 4.6); ctx.fill(); ell(sx + sw, sy - 1, 3.4, 3.1); ctx.fill();
  ctx.strokeStyle = '#17161a'; ctx.lineWidth = 1.6; for (const sdir of [-1, 1]) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sx + sw, sy + 3); ctx.lineTo(sx + sw + sdir * (9 + i * 2), sy - 3 + i * 4); ctx.lineTo(sx + sw + sdir * (13 + i * 3), sy + 2 + i * 5); ctx.stroke(); }
  ctx.fillStyle = '#e44'; ell(sx + sw - 1.5, sy - 2, .8, .8); ctx.fill(); ell(sx + sw + 1.5, sy - 2, .8, .8); ctx.fill();
  ctx.restore();
}
function tag2019(lt, sh) {   /* the paper tag tied to the lever: hero text only in the insert, at rest */
  const x = X.cabinet - 18, y0 = 936, sway = Math.sin(lt * 1.3) * .018;
  ctx.save(); ctx.translate(x - 18, y0); ctx.rotate(sway);
  ctx.strokeStyle = '#a58a4a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, 20, 2, 40); ctx.stroke();
  const big = sh.id === 'ex2', w = 96, h = 78;
  if (big) {
    UI.tag([{ t: 'INSPECTED', size: 12.5, weight: 900, fill: '#3a2a10', spacing: .4 }, { t: '2019', size: 33, font: 'Bangers', weight: 400, fill: '#b02a1a', spacing: 1.5 }], 4, 40 + h / 2, { w, h, fill: '#efdca4', stroke: '#8a6a30', lw: 2.4, holeFill: 'rgba(60,40,20,.85)', size: 12.5, id: 'tag2019', hero: true, shadow: 6 });
  } else {
    ctx.fillStyle = '#efdca4'; ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 2.2; rr(-44, 40, w, h, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(60,40,20,.8)'; ell(-30, 79, 5, 5); ctx.fill(); ctx.fillStyle = '#b02a1a'; rr(-16, 68, 54, 14, 3); ctx.fill();
  }
  ctx.restore();
}
function marshalPlace(lt, sh) {
  const door = sh.cast.indexOf('marshalDoor') >= 0, p = door ? mPlace(sh, lt) : POS.marshal, o = aMarshal(lt, p, sh);
  if (door) o.torchAng = lerp(1.9, 1.2, sg(lt, CUE.click1 - .1, 1.4));
  return { p, o };
}
function beamOf(lt, sh) {
  const inW = sh.cast.some(n => n.indexOf('marshal') === 0) || sh.beam || sh.insert || sh.pan;
  if (!inW || lt < CUE.click1 || lt > CUE.splat) return null;
  const { p, o } = marshalPlace(lt, sh), L = torchLens(p, o.torchAng), tg = torchTarget(lt);
  const ang = o.torchAng - PI / 2, dx = tg[0] - L.x, dy = tg[1] - L.y, len = Math.hypot(dx, dy);
  const reach = sh.id === 'open' ? 620 : Math.max(len, 260);
  return { x: L.x, y: L.y, ang, len: reach * 1.12, tx: sh.id === 'open' ? L.x + Math.cos(ang) * 560 : tg[0], ty: sh.id === 'open' ? L.y + Math.sin(ang) * 560 : tg[1] };
}
/* the Marshal's clipboard, held at his waist by both hands (his arms are short): a page with printed lines, a clip, and a scribble the pen writes; gloves and pen drawn over it */
const CLIP = p => { const yc = FEET({ kind: 'pom' }, p.s); return { x: p.x + 2, y: yc + 128 * p.s, w: 124, h: 142, yc }; };
function clipboardBoard(lt, p, writing) {
  const c = CLIP(p), { x, y, w, h } = c, s = p.s, k = writing ? sg(lt, 35.2, 36.6) : 1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.03);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(-w / 2 + 5, -h / 2 + 8, w, h, 8); ctx.fill();
  rr(-w / 2, -h / 2, w, h, 8); ctx.fillStyle = '#b8864a'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#fffdf4'; ctx.fillRect(-w / 2 + 9, -h / 2 + 16, w - 18, h - 26);
  ctx.fillStyle = '#9aa0a6'; rr(-20, -h / 2 - 5, 40, 20, 5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = 'rgba(40,60,110,.55)'; ctx.fillRect(-w / 2 + 16, -h / 2 + 26, w - 32, 7);
  ctx.strokeStyle = 'rgba(80,100,150,.55)'; ctx.lineWidth = 2.2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 16, -h / 2 + 46 + i * 16); ctx.lineTo(w / 2 - 16 - (i % 3) * 12, -h / 2 + 46 + i * 16); ctx.stroke(); }
  ctx.strokeStyle = '#c4281e'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  const pts = []; for (let i = 0; i <= 18; i++) { const u = i / 18; pts.push([-w / 2 + 18 + u * (w - 40), h / 2 - 30 + Math.sin(u * 22) * 4 - (i % 2) * 3]); }
  const n = Math.floor(k * pts.length); pts.slice(0, Math.max(1, n)).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
  ctx.restore();
  /* the gloves at the top corners and the pen in the right hand, scribbling along the line */
  const glove = (gx, gy) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ell(gx, gy, 15 * s * .95, 15 * s * .95); ctx.fill(); ctx.stroke(); };
  glove(x - w / 2 + 10, y - h / 2 + 12);
  const px = lerp(x - w / 2 + 22, x + w / 2 - 20, k) , py = y + h / 2 - 30 + Math.sin(k * 22 * 1) * 4;
  const hx = x + w / 2 - 12, hy = y - h / 2 + 12;
  if (writing) { ctx.strokeStyle = '#2a2d36'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - 4, hy + 4); ctx.lineTo(px, py); ctx.stroke(); ctx.fillStyle = '#c4281e'; ell(px, py, 3.4, 3.4); ctx.fill(); }
  glove(hx, hy);
}
function binderBurst(lt) {
  const a = lt - CUE.binderpop; if (a < 0 || a > .6) return;
  const k = a / .6;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `rgba(160,245,255,${.85 * (1 - k)})`; ctx.lineWidth = 9 * (1 - k) + 1; ctx.beginPath(); ctx.arc(TAB.x, TAB.y - 14, 40 + 240 * eo(k), 0, TAU); ctx.stroke(); ctx.restore();
  if (hasFX('sparks')) FX().sparks(ctx, { x: TAB.x, y: TAB.y - 14, t: lt, t0: CUE.binderpop, count: 16, speed: 520, life: .5, gravity: 600, seed: 5, color: '#9ff4ff' });
}
const TOW = [[-80, -560, -9, '#fbfbf6', 1540, 850, 1138], [40, -700, 7, '#e9f0f7', 1590, 836, 1132], [130, -500, -6, '#ffffff', 1634, 850, 1142], [-150, -420, 10, '#dfe9f2', 1500, 862, 1135]];
function towels(lt) {   /* the cart's linen is thrown out by the hit and lies on the floor */
  if (lt < CUE.cart) return;
  const a = lt - CUE.cart;
  for (const [vx, vy, w, c, x0, y0, yl] of TOW) {
    let t = a, x = x0 + vx * t, y = y0 + vy * t + 1100 * t * t, land = y >= yl;
    if (land) { const tl = (-vy + Math.sqrt(vy * vy + 4400 * (yl - y0))) / 2200; t = tl; x = x0 + vx * tl; y = yl; }
    ctx.save(); ctx.translate(x, y); ctx.rotate(land ? w * t * .35 : w * t); rr(-27, -15, 54, 30, 12); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = 'rgba(70,90,110,.6)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  }
}
function drawWorld(lt) {
  const sh = shotAt(lt), S = simAt(lt), dim = sh.dim ?? 1;
  if (S) S.labelOn = ['open', 'p1', 'p2', 'r3', 'r4'].indexOf(sh.id) >= 0;
  setLight(lt, sh.dark); V2.opts.reflect = false;
  shell(lt, { dim });
  stairDoor(lt); bulletin(lt); roomDoor(1000, lt, 14); roomDoor(2150, lt, 15);
  exitSign(FD.x0 + 120, 538, lt);
  cabinet(lt, { can: lt < 24.9, after: lt >= 24.9 });
  if (lt < 24.9) drawCan(lt, sh, S);
  if (lt < 24.9) { cobweb(lt); tag2019(lt, sh); }
  cabinetGlass(lt, { open: 1 });
  tablet(lt, { pop: lt >= CUE.binderpop && lt < 25.4 ? 1 : 0 }); binderBurst(lt);
  fireDoor(lt); keepSign(lt);
  easel(lt, S); linenCart(lt, S); towels(lt);
  floorFoam(lt, false);
  if (lt >= 24.9 && lt < T0) drawCan(lt, sh, S);
  drawChars(lt, sh);
  if (lt >= T0) drawCan(lt, sh, S);
  if (sh.cast.indexOf('marshalWrite') >= 0 || sh.cast.indexOf('marshalEnd') >= 0) clipboardBoard(lt, mPlace(sh, lt), sh.cast.indexOf('marshalWrite') >= 0);
  flyingPin(lt);
  floorFoam(lt, true);
  foamJets(lt);
  /* foam on people: Lemon's hair, the Marshal's beard (a pile that swells at the splat, with a squash) */
  if (lt >= 29.7 && (sh.cast.indexOf('lemon') >= 0 || sh.cast.indexOf('lemonEnd') >= 0)) { const lp = sh.cast.indexOf('lemonEnd') >= 0 ? { x: END_X.lemon, s: CS } : POS.lemon, hy = FEET({ kind: 'lemon' }, lp.s) - 140 * lp.s; fxPile({ x: lp.x - 8, y: hy + 14, w: 150, h: 66, t: lt, t0: 29.72, grow: .45, seed: 31 }); fxPile({ x: lp.x + 38, y: hy + 36, w: 70, h: 40, t: lt, t0: 29.9, grow: .4, seed: 32 }); }
  if (lt >= CUE.splat - .06 && sh.cast.some(n => n.indexOf('marshal') === 0)) {
    const mp = mPlace(sh, lt), my = FEET({ kind: 'pom' }, MS) + 42 * MS, bx = mp.x + 18 + (mp.yaw || 0) * 24;
    const k = ss(lt, CUE.splat - .04, CUE.splat + .2), over = 1 + .22 * Math.exp(-(lt - CUE.splat) * 9) * (lt >= CUE.splat ? 1 : 0);
    fxPile({ x: bx, y: my + 82, w: 262 * over, h: 112 * over, t: lt, t0: CUE.splat - .04, grow: .26, seed: 11 });
    fxPile({ x: bx - 84, y: my + 58, w: 96 * over, h: 62 * over, t: lt, t0: CUE.splat - .02, grow: .3, seed: 12 }); fxPile({ x: bx + 84, y: my + 58, w: 96 * over, h: 62 * over, t: lt, t0: CUE.splat, grow: .3, seed: 13 });
  }
  /* the dust of the cart hit and the easel landing */
  fxPuff({ x: 1600, y: 900, r: 90, t: lt, t0: CUE.cart, life: .8 }); fxPuff({ x: X.easel - 60, y: FLOOR - 6, r: 80, t: lt, t0: 30.7, life: .8 });
  /* the darkness mask and then the lights over it */
  const bm = beamOf(lt, sh), holes = [];
  for (let xj = 120 + Math.floor((VIEW.x0 - 120) / 520) * 520; xj < VIEW.x1 + 520; xj += 520) holes.push({ type: 'glow', x: xj, y: CD + 40, r: 560, a: .8 * dim });
  holes.push({ type: 'glow', x: TAB.x, y: TAB.y, r: 300, a: .5 });
  if (sh.id === 'open') holes.push({ type: 'glow', x: X.door, y: 900, r: 460, a: .85 });
  const bfade = 1 - ss(lt, 28.5, 29.3);
  if (bm && bfade > .01) { holes.push({ type: 'cone', x: bm.x, y: bm.y, ang: bm.ang, spread: .3, len: bm.len, a: bfade }); holes.push({ type: 'glow', x: bm.tx, y: bm.ty, r: 230, a: .95 * bfade }); }
  const dk = sh.id === 'ex1' ? lerp(.88, .5, ss(lt, CUE.click2, CUE.click2 + .1)) : (sh.dark ?? .3);
  lightMask(dk, holes);
  if (bm) {
    const hot = ss(lt, (sh.id === "ex1" ? CUE.click2 : CUE.click1) - .001, (sh.id === "ex1" ? CUE.click2 : CUE.click1) + .034) * (1 - ss(lt, 28.5, 29.3));
    fxCone({ x: bm.x, y: bm.y, ang: bm.ang, spread: .2, len: bm.len, color: '#fff2c4', alpha: .5 * hot, soft: .6 });
    fxGlow({ x: bm.tx, y: bm.ty, r: 150, color: '#fff0c0', alpha: .5 * hot, core: .5 });
    fxGlow({ x: bm.x, y: bm.y, r: 60, color: '#fffbe0', alpha: .8 * hot, core: .9 });
    V2.dust(bm.tx - 260, bm.ty - 240, bm.tx + 260, bm.ty + 220, lt, { n: 26, seed: 5, size: 2.4, alpha: .55 * hot, speed: 7 });
  }
  fxGlow({ x: TAB.x, y: TAB.y, r: 210, color: '#6fe0ee', alpha: .16 });
}

const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), u = sg(lt, sh.s, sh.e), c = sh.cam(u, lt);
    const shk = (sh.id === 'open' ? BOOTS.reduce((a, t) => a + pulse(lt, t, 30, .08) * 3, 0) : 0) + pulse(lt, CUE.cart, 33, .11) * 9 + pulse(lt, CUE.splat, 31, .12) * 13 + pulse(lt, CUE.stamp, 35, .1) * 8 + (lt >= T0 && lt < 31 ? 2.2 : 0);
    zoomTo(c[0] + shk * .5, c[1] + shk * .4, c[2]);
    CAM.shake = lt >= T0 && lt < 31.1 ? 2.5 : 0; CAM.r = (sh.roll || 0) * Math.sin(Math.PI * Math.min(1, u * 1.0));
    const hw = 540 / c[2], hh = 960 / c[2];
    const ex = Math.abs(Math.sin(CAM.r)) * hh + 40;
    VIEW.x0 = c[0] - hw - ex; VIEW.x1 = c[0] + hw + ex; VIEW.y0 = c[1] - hh - ex; VIEW.y1 = c[1] + hh + ex; VIEW.z = c[2]; VIEW.cx = c[0]; VIEW.cy = c[1];
  },
  draw(lt) { drawWorld(lt); },
  fx(lt) {
    const sh = shotAt(lt), fx = { bloom: .5, vignette: .5, grain: .05, contrast: .14, sat: .1, tint: [['#2d4c80', .12, 'soft-light']] };
    if (lt < .3) { fx.fade = .95 * (1 - lt / .3); fx.fadeColor = '4,6,12'; }
    return fx;
  },
  blur(lt) {
    for (const sh of SHOTS) if (Math.abs(lt - sh.s) < .05) return 1;
    const sh = shotAt(lt);
    if (sh.pan) return 7;
    if (sh.whip && lt >= sh.whip[0] && lt < sh.whip[1]) return 12;
    if (lt >= T0 && lt < 30.6) return 6;
    if (lt >= CUE.splat - .1 && lt < CUE.splat + .1) return 4;
    return 2;
  },
  over(lt) { overlay(lt); },
  clock: () => SCN.clock, label: () => SCN.label,
};
// ------------------------------------------------------------------ screen overlays: the P.A.S.S. chips (lit as each word is spoken), the splat flash, the SLIP HAZARD stamp
const PASS = [['P', 'PULL', 0], ['A', 'AIM', 1], ['S', 'SQUEEZE', 2], ['S', 'SWEEP', 3]];
function overlay(lt) {
  const sh = shotAt(lt);
  if (sh.chips && lt < T0 + .3) {
    const w = 238, gap = 8, x0 = (W - (4 * w + 3 * gap)) / 2, fade = 1, out = 1 - ss(lt, T0 - .06, T0 + .1), enter = ss(lt, 26.6, 26.9);
    PASS.forEach(([L, word, i]) => {
      const t0 = wS('l1', i), lit = lt >= t0, age = lt - t0, pop = lit ? 1 + .2 * Math.exp(-age * 8) * Math.abs(Math.cos(age * 14)) : 1, cx = x0 + i * (w + gap) + w / 2, cy = 380 - (1 - enter) * 60, h = 176;
      if (out <= .01) return;
      ctx.save(); ctx.globalAlpha *= fade * enter; ctx.translate(cx, cy); ctx.scale(pop * out, pop * out); ctx.translate(-cx, -cy);
      if (lit) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,214,70,${.28 * Math.exp(-age * 3)})`; ctx.beginPath(); ctx.ellipse(cx, cy, w * .75, h * .7, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      UI.sign([cx - w / 2, cy - h / 2, w, h], [{ t: L, size: 96, font: 'Bangers', weight: 400, spacing: 2 }, { t: word, size: 35, weight: 900, spacing: 0, gap: 4 }],
        { fill: lit ? '#ffd23a' : 'rgba(18,22,34,.72)', stroke: lit ? '#fff7d0' : 'rgba(255,255,255,.35)', lw: 5, ink: lit ? '#2a1a05' : 'rgba(255,255,255,.7)', r: 22, pad: 14, id: 'pass' + i, hero: true });
      ctx.restore();
    });
  }
  if (lt >= CUE.splat && lt < CUE.splat + .24) {   /* a white flash, at most .3 alpha for at most .25 s */
    const k = 1 - (lt - CUE.splat) / .24; if (hasFX('wash')) FX().wash(ctx, { color: '#ffffff', alpha: .3 * k, mode: 'add' }); else { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${.3 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  if (lt >= CUE.stamp - .24 && lt < 37.9) {   /* the citation: it slams down from a big scale and lands on the beat */
    const a = lt - CUE.stamp, k = a < 0 ? 1 - Math.pow(Math.max(0, -a / .24), 2) : 1, sc = a < 0 ? lerp(2.6, 1, k) : 1 + .1 * Math.exp(-a * 14);
    const cx = 560, cy = 1090;
    ctx.save(); ctx.globalAlpha *= a < 0 ? k : 1; ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
    UI.stamp('SLIP HAZARD', cx, cy, { size: 74, rot: -.13, color: '#c4281e', alpha: .94, id: 'slip', hero: true });
    ctx.restore();
    if (a >= 0 && a < .3) { ctx.save(); ctx.strokeStyle = `rgba(255,240,200,${.7 * (1 - a / .3)})`; ctx.lineWidth = 6 * (1 - a / .3) + 1; ctx.beginPath(); ctx.ellipse(cx, cy, 250 + 220 * eo(a / .3), 70 + 60 * eo(a / .3), -.13, 0, TAU); ctx.stroke(); ctx.restore(); }
  }
}

window.__EP18_SCENES = window.__EP18_SCENES || {};
window.__EP18_SCENES.marshal = SC;
SC.__sim = () => simInit();
})();
