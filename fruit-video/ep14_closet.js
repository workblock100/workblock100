'use strict';
/* SHIFT HAPPENS, Episode 14: "The Survey". Scene module: closet (3:21 PM, THE SHOWER ROOM, 10.68 s). Builder E14-B. (the header and the shot list are written last)
 * Registers window.__EP14_SCENES.closet. Everything is a pure function of the scene time `lt`: the avalanche is a table of waypoints computed once from a seed at first use. */
(() => {
if (!window.TIMELINE_EP14 || !window.S14) return;
const { zoomTo } = window.H6;
const A11 = window.A11, A14 = window.A14, S14 = window.S14;

// ------------------------------------------------------------------ small helpers (copies of the ones in ep13_station.js / ep14_tracer.js: private there)
const cl01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = cl01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z0-9]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const lerpA = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const rnd = seed => { let a = (seed * 2654435761) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const INKC = '#1d1a22';

// ------------------------------------------------------------------ the clock of the scene: the sound cues, relative to their beats (script_ep14.json): creak +.1 into open; slowmo, rumble +.1, crash +.5, clatter +.9, crash +1.5, clatter +1.9 into slide
const CUE = {
  get creak() { return B('open').s + .1; }, get slowmo() { return B('slide').s; }, get rumble() { return B('slide').s + .1; },
  get crash1() { return B('slide').s + .5; }, get clatter1() { return B('slide').s + .9; }, get crash2() { return B('slide').s + 1.5; }, get clatter2() { return B('slide').s + 1.9; },
  get trombone() { return B('end').s - .05; },
};
const TR_END = 27.059;                       /* the tracer's length: the characters' own clocks (breathing, blinks) carry on from it */

// ------------------------------------------------------------------ the place: the shower room's numbers (kit: S14.rect('shower'), S14.showerDoor)
const RS = S14.rect('shower'), FL = RS.floor, SS = S14.S, KSC = S14.S * .72;
const DOOR0 = S14.showerDoor({ door: 0, bulge: 0 });       /* the closed leaf x 890..978, y 790..988, knob [901, 896] */
const FLB = FL - 3, FLF = FL + 5, FLG = FL + 11;                          /* the floor line of the BACK lane (behind the people) and of the FRONT lane (in front of them) */
const WALL_R = RS.x1 - 12;                                 /* the building's right wall, inside */
const CHAR = { straw: 828, star: 690, kum: 758 };          /* where the three of them stand (the tracer's last frame: sDoor, stDoor, kDoor) */

// ------------------------------------------------------------------ the kit's stash sprites, cached once at 4x with their tight bounds, and a rimmed twin (a warm key edge up-left, a cool back edge down-right) baked in:
// the pieces of the avalanche are exactly the sprites the room showed, so the swap from the kit's drawing to ours at the first movement does not change a pixel except for the rim (which fades in)
const KSX = 4, SPRC = new Map();
function spriteOf(kind, o = {}) {
  const key = kind + '|' + (o.w || 0) + '|' + (o.h || 0) + '|' + (o.color || '');
  let s = SPRC.get(key); if (s) return s;
  const P = 10, SZ = 560, prev = ctx, L0 = UI.label;
  UI.label = () => ({}); REG.suppress++;                                   /* the sprites carry no lettering: text is drawn live, never into a cache */
  try { return build(); } finally { UI.label = L0; REG.suppress--; }
  function build() {
  const sc = V2.mk(SZ, SZ), g = sc.getContext('2d', { willReadFrequently: true }); ctx = g;
  try { g.save(); g.translate(SZ / 2, SZ - 80); S14.drawItem(kind, 0, 0, 1, 0, o); g.restore(); } finally { ctx = prev; }
  const d = g.getImageData(0, 0, SZ, SZ).data; let x0 = SZ, y0 = SZ, x1 = 0, y1 = 0;
  for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) if (d[(y * SZ + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) { x0 = SZ / 2 - 20; x1 = SZ / 2 + 20; y0 = SZ - 120; y1 = SZ - 80; }
  const bx0 = x0 - SZ / 2 - P, bx1 = x1 + 1 - SZ / 2 + P, by0 = y0 - (SZ - 80) - P, by1 = y1 + 1 - (SZ - 80) + P;   /* the padded box, relative to the base centre */
  const cv = V2.mk(Math.ceil((bx1 - bx0) * KSX), Math.ceil((by1 - by0) * KSX)), cg = cv.getContext('2d'); ctx = cg;
  try { cg.save(); cg.scale(KSX, KSX); cg.translate(-bx0, -by0); S14.drawItem(kind, 0, 0, 1, 0, o); cg.restore(); } finally { ctx = prev; }
  s = { cv, bx0, bx1, by0, by1, P, w: bx1 - bx0 - 2 * P, h: by1 - by0 - 2 * P, cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2, rim: null, base: -by0 };
  SPRC.set(key, s); return s;
  }
}
function rimOf(s) {
  if (s.rim) return s.rim;
  const pad = 12, w = s.cv.width + 2 * pad, h = s.cv.height + 2 * pad, cv = V2.mk(w, h), g = cv.getContext('2d');
  const sil = col => { const c2 = V2.mk(s.cv.width, s.cv.height), g2 = c2.getContext('2d'); g2.drawImage(s.cv, 0, 0); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = col; g2.fillRect(0, 0, c2.width, c2.height); return c2; };
  const r = 1.7 * KSX;
  g.drawImage(sil('rgba(255,230,180,.95)'), pad - r, pad - r); g.drawImage(sil('rgba(140,185,255,.55)'), pad + r * .8, pad + r * .8); g.drawImage(s.cv, pad, pad);
  return (s.rim = { cv, pad });
}
/* draw a sprite so that the centre of its tight box lands on (cx, cy), turned by rot about it; rim 0..1 fades the baked rim in; sx scales (a unfolding or squash is done by the caller) */
function putSprite(s, cx, cy, rot, sc = 1, rim = 1, alpha = 1) {
  ctx.save(); if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc);
  ctx.translate(-s.cx, -s.cy);
  /* now the origin is the sprite's padded box middle at its base-centre x: the box's top-left is (bx0 - cx0 ...) */
  if (rim < .999) ctx.drawImage(s.cv, s.bx0, s.by0, s.bx1 - s.bx0, s.by1 - s.by0);
  if (rim > .001 && !TXA.mask) { const R = rimOf(s); if (rim < .999) ctx.globalAlpha *= rim; ctx.drawImage(R.cv, s.bx0 - R.pad / KSX, s.by0 - R.pad / KSX, R.cv.width / KSX, R.cv.height / KSX); }
  else if (rim >= .999) ctx.drawImage(s.cv, s.bx0, s.by0, s.bx1 - s.bx0, s.by1 - s.by0);
  ctx.restore();
}
/* a soft contact shadow on the floor (the kit's own recipe) */
function fshadow(x, y, w, a = .3, h = 6) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, h / Math.max(1, w / 2));
  ctx.fillStyle = V2.radial(0, 0, 0, w / 2, [[0, `rgba(25,14,30,${a})`], [.6, `rgba(25,14,30,${a * .5})`], [1, 'rgba(25,14,30,0)']]);
  ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, TAU); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ the call light the tracer stuck on the wall by the door (D's pendant(), copied: it is private in ep14_tracer.js)
function pendant(x, y, rot, led = 0, k = 1.45) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3a3440'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(4, -4, 0, 0); ctx.stroke();
  ctx.fillStyle = V2.grad(0, 0, 0, 25, [[0, '#fffaf0'], [1, '#d7cfbb']]); ctx.strokeStyle = INKC; ctx.lineWidth = 2; rr(-7, 0, 14, 25, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8283a'; ell(0, 8.5, 4.4, 4.4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(-1.4, 7, 1.4, 1); ctx.fill();
  ctx.fillStyle = led > .05 ? '#7dff9c' : '#2f4a35'; ell(0, 19, 2.3, 2.3); ctx.fill(); ctx.stroke();
  if (led > .05) V2.glow(0, 19, 26, '110,255,150', .8 * led, 'screen', .6);
  ctx.restore();
}

// ------------------------------------------------------------------ THE AVALANCHE: a table of waypoints computed once from a seed (a pure function of lt at any frame, nothing carried from the frame before).
// Every piece is one of the kit's stash sprites (S14.stashItems(4): exactly what the room showed), starting at its kit position. A piece is held until its release time tL, then flies one ballistic arc
// (gravity G in film time: the slow motion is baked in, so a fall of 270 px takes about 1.4 s) to its first impact at (xR, resting height on whatever lies below it in its lane), bounces twice with
// shrinking hops and tilts into its resting pose. The velocities are SOLVED from the endpoints and the durations, so the first impacts land exactly on the script's crashes and clatters.
// Resting heights come from a height field per lane (BACK = behind the people, FRONT = in front of them), filled in landing order: the heap stacks itself.
const G = 260;
/* id, tL (release), tI (first impact), xR (rest, centre x), lane, rr (rest turn: 0 upright, 1.5708 on its side), turns (extra half-turns in flight, signed), hop (first hop, s), tE (leaves the closet: drawn by the kit's hook before it) */
const PLAN = [
  /* the stack behind the door sags out: four boxes land in front of the door on crash 1 (xP: where the piece would like to come to rest; the heap's height profile decides the exact place) */
  { id: 'cbox1', tL: 1.78, tI: 2.274, xP: 850, lo: 700, hi: 900, lane: 'B', rr: 0, turns: 0, tE: 1.95 }, { id: 'cbox3', tL: 1.77, tI: 2.274, xP: 892, lo: 700, hi: 940, lane: 'B', rr: 0, turns: 0, tE: 1.95 },
  { id: 'cbox2', tL: 1.80, tI: 2.274, xP: 934, lo: 860, hi: 980, lane: 'B', rr: 0, turns: 0, tE: 1.97 }, { id: 'cbox4', tL: 1.77, tI: 2.274, xP: 976, lo: 900, hi: 1030, lane: 'B', rr: 0, turns: 0, tE: 1.97 },
  /* the wheelchair behind them rolls out and away along the back of the floor, behind the people's legs */
  { id: 'wheelchair2', tL: 1.9, tI: 3.9, xR: 706, lane: 'B', rr: 0, slide: true, tE: 2.1 },
  /* the second layer, clatter 1 */
  { id: 'cbag', tL: 2.0, tI: 2.674, xP: 905, lo: 885, hi: 1000, lane: 'F', rr: 0, turns: 0, tE: 2.12 }, { id: 'cbox5', tL: 2.05, tI: 2.674, xP: 780, lo: 700, hi: 900, lane: 'B', rr: 0, turns: 1, tE: 2.17 },
  { id: 'cbox6', tL: 2.1, tI: 2.69, xP: 950, lo: 885, hi: 1036, lane: 'F', rr: 0, turns: -1, tE: 2.2 }, { id: 'cbox7', tL: 2.15, tI: 2.72, xP: 740, lo: 700, hi: 860, lane: 'B', rr: 0, turns: 1, tE: 2.25 },
  { id: 'cbox8', tL: 2.2, tI: 2.78, xP: 1000, lo: 885, hi: 1036, lane: 'F', rr: 0, turns: -1, tE: 2.3 },
  /* the top of the stack comes down and goes left */
  { id: 'bag1', tL: 2.5, tI: 3.2, xP: 905, lo: 895, hi: 975, lane: 'I', rr: 0, turns: 0, tE: 99 }, { id: 'box4', tL: 2.35, tI: 3.0, xP: 950, lo: 895, hi: 975, lane: 'I', rr: 0, turns: 0, tE: 99 },
  { id: 'box9', tL: 2.45, tI: 3.35, xP: 925, lo: 895, hi: 975, lane: 'I', rr: 0, turns: 0, tE: 99 }, { id: 'box10', tL: 2.55, tI: 3.4, xP: 960, lo: 895, hi: 975, lane: 'I', rr: 0, turns: 0, tE: 99 },
  { id: 'box11', tL: 2.7, tI: 3.55, xP: 935, lo: 895, hi: 975, lane: 'I', rr: 0, turns: 0, tE: 99 },
  /* the left pane bursts at crash 1: the left half of the stash is thrown at the people */
  { id: 'bucket', tL: 2.274, tI: 3.15, xP: 740, lo: 700, hi: 820, lane: 'B', rr: 1.5708, turns: 2, tE: 2.274 }, { id: 'rail', tL: 2.3, tI: 3.0, xP: 790, lo: 700, hi: 860, lane: 'B', rr: 1.5708, turns: 2, tE: 2.3 },
  { id: 'box3', tL: 2.3, tI: 3.05, xR: 757, lane: 'G', rr: 0, turns: 3, tE: 2.3 }, { id: 'wheelchair', tL: 2.274, tI: 3.274, xR: 758, lane: 'F', rr: 0, turns: 0, hop: .55, tE: 2.274 },
  { id: 'tv', tL: 2.274, tI: 3.274, xP: 800, lo: 700, hi: 870, lane: 'B', rr: 1.5708, turns: 2, hop: .5, tE: 2.274 },
  { id: 'box7', tL: 2.6, tI: 3.5, xR: 770, lane: 'G', rr: 0, turns: 1, tE: 2.6 }, { id: 'box8', tL: 2.8, tI: 3.65, xR: 763, lane: 'G', rr: 0, turns: -1, tE: 2.8 },
  { id: 'box12', tL: 2.9, tI: 3.7, xP: 780, lo: 700, hi: 860, lane: 'B', rr: 0, turns: 2, tE: 2.9 }, { id: 'qsign', tL: 3.2, tI: 4.2, xP: 905, lo: 850, hi: 960, lane: 'B', rr: 0, turns: 4, tE: 3.2, tilt: -.1, top: true },
  /* the right half pours through the door toward the camera and lands in front of it as clatter 2; the two bottom boxes on the right stay in the closet */
  { id: 'box1', stay: true, lane: 'B' }, { id: 'box2', stay: true, lane: 'B' },
  { id: 'fan', tL: 2.8, tI: 3.55, xP: 930, lo: 885, hi: 1030, lane: 'F', rr: 0, turns: 2, tE: 2.95 }, { id: 'tree', tL: 2.75, tI: 3.674, xP: 860, lo: 700, hi: 1000, lane: 'B', rr: 1.5708, turns: 3, hop: .5, tE: 2.9 },
  { id: 'ivpole', tL: 2.9, tI: 3.8, xP: 830, lo: 700, hi: 1000, lane: 'B', rr: 1.36, turns: 4, tE: 3.05 }, { id: 'banner', tL: 3.0, tI: 3.85, xP: 960, lo: 885, hi: 1020, lane: 'F', rr: 0, turns: 1, tE: 3.1 },
  { id: 'box5', tL: 2.95, tI: 3.55, onY: 938, lane: 'B', rr: 0, tilt: .03, hop: .3, tE: 99 }, { id: 'box6', tL: 3.1, tI: 3.75, onY: 900, lane: 'B', rr: 0, tilt: -.04, hop: .3, tE: 99 },
  { id: 'bag2', tL: 3.3, tI: 4.3, xP: 900, lo: 885, hi: 1000, lane: 'F', rr: 0, turns: 1, tE: 3.4 },
];
let SIM = null;
const FLOORS = { B: FLB, F: FLF, G: FLG, I: 981 }, HX0 = 560, HDX = 2;
function buildSim() {
  const KIT = S14.stashItems(4), by = {}; KIT.forEach(k => { by[k.id] = k; });
  const rand = rnd(1414), Hf = { B: new Float32Array(260), F: new Float32Array(260), G: new Float32Array(260), I: new Float32Array(260) }, items = [], events = [];
  for (const p of PLAN) {
    const k = by[p.id]; if (!k) continue;
    const spr = spriteOf(k.kind, k.o), c = Math.cos(k.rot), s = Math.sin(k.rot);
    const C0 = [k.x + c * spr.cx - s * spr.cy, k.y + s * spr.cx + c * spr.cy];
    items.push(Object.assign({ k, spr, C0, th0: k.rot, z: k.z, tilt: p.tilt ?? (rand() - .5) * .5, creep: 5 + 9 * rand(), hop: p.hop ?? .42 + .14 * rand() }, p));
  }
  const PROF = { B: x => lerp(0, 175, cl01((x - 700) / 260)) * (x > 980 ? lerp(1, .85, cl01((x - 980) / 70)) : 1), F: x => x < 880 ? 70 : 125, G: x => 120, I: x => 150 };   /* the tallest the heap may be at x, per lane: low toward the people, tall in front of the door */
  const order = items.filter(i => !i.stay).sort((a, b) => a.tI - b.tI);
  const supAt = (lane, x, ew) => { const i0 = Math.max(0, Math.floor((x - ew / 2 - HX0) / HDX)), i1 = Math.min(259, Math.ceil((x + ew / 2 - HX0) / HDX)); let m = 0; for (let i = i0; i <= i1; i++) m = Math.max(m, Hf[lane][i]); return m; };
  for (const it of order) {
    const { spr, lane } = it, side = Math.abs(Math.sin(it.rr)) > .7, ew = side ? spr.h : spr.w, eh = side ? spr.w : spr.h, floor = FLOORS[lane];
    if (it.onY != null) it.xR = it.C0[0] + (it.id === 'box6' ? -4 : 0);
    if (it.xR == null) {   /* choose the resting place: the free spot nearest to where the piece would like to land whose top stays under the heap's profile (the tolerance grows until one is found) */
      let best = null;
      for (let tol = it.top ? 40 : 18; tol <= 400 && !best; tol += 22) {
        for (let x = it.lo; x <= it.hi; x += 4) { const sup = supAt(lane, x, ew), top = sup + eh; if (top > PROF[lane](x) + tol) continue; const sc = Math.abs(x - it.xP) + .25 * sup - (it.top ? .25 * sup : 0); if (!best || sc < best.sc) best = { x, sc }; }
      }
      it.xR = best ? best.x : it.xP;
    }
    const dir = Math.sign(it.xR - it.C0[0]) || 1, xI = it.xR - dir * it.creep;
    const i0 = Math.max(0, Math.floor((it.xR - ew / 2 - HX0) / HDX)), i1 = Math.min(259, Math.ceil((it.xR + ew / 2 - HX0) / HDX));
    const sup = it.slide || it.onY != null ? 0 : supAt(lane, it.xR, ew);
    const yR = it.onY != null ? it.onY - eh / 2 : floor - sup - eh / 2; if (!it.slide && it.onY == null) for (let i = i0; i <= i1; i++) Hf[lane][i] = sup + eh;
    Object.assign(it, { ew, eh, yR, xI, dir, sup });
    const segs = [];
    if (it.slide) {   /* rolls out along the floor and away: x eased out, y the resting height, no turning */
      segs.push({ type: 'slide', t0: it.tL, t1: it.tI, x0: it.C0[0], y0: it.C0[1], x1: it.xR, y1: yR, r0: it.th0, r1: it.rr });
    } else {
      const thI = it.rr + it.tilt + it.turns * PI;
      segs.push({ type: 'air', t0: it.tL, t1: it.tI, x0: it.C0[0], y0: it.C0[1], x1: xI, y1: yR, r0: it.th0, r1: thI });
      const t2 = it.tI + it.hop, t3 = t2 + .26;
      segs.push({ type: 'air', t0: it.tI, t1: t2, x0: xI, y0: yR, x1: it.xR - dir * it.creep * .35, y1: yR, r0: thI, r1: it.rr + it.tilt * .35 });
      segs.push({ type: 'air', t0: t2, t1: t3, x0: it.xR - dir * it.creep * .35, y0: yR, x1: it.xR, y1: yR, r0: it.rr + it.tilt * .35, r1: it.rr });
      const sz = Math.min(1, (spr.w * spr.h) / 3000);
      events.push({ t: it.tI, x: xI, y: yR + eh / 2, a: .5 + .5 * sz, id: it.id, lane }, { t: t2, x: it.xR - dir * it.creep * .35, y: yR + eh / 2, a: .25 + .25 * sz, id: it.id, lane }, { t: t3, x: it.xR, y: yR + eh / 2, a: .12, id: it.id, lane });
    }
    for (const sg of segs) { const d = sg.t1 - sg.t0; sg.vx = (sg.x1 - sg.x0) / d; sg.vy = (sg.y1 - sg.y0 - .5 * G * d * d) / d; }
    it.segs = segs; it.tEnd = segs[segs.length - 1].t1;
  }
  for (const it of items) if (it.stay) { Object.assign(it, { tL: 99, tE: 99, tI: 99, tEnd: 99, segs: [{ type: 'air', t0: 99, t1: 100, x0: it.C0[0], y0: it.C0[1], x1: it.C0[0], y1: it.C0[1], r0: it.th0, r1: it.th0, vx: 0, vy: 0 }], ew: it.spr.w, eh: it.spr.h, yR: it.C0[1], xR: it.C0[0], sup: 0 }); }
  events.push({ t: CUE.crash1, x: 950, y: FL, a: .9, id: 'DOOR', lane: 'B' }, { t: CUE.crash2, x: 790, y: FL, a: .8, id: 'DOOR', lane: 'B' });
  return { items, events: events.sort((a, b) => a.t - b.t), Hf };
}
const sim = () => SIM || (SIM = buildSim());
/* where a piece is at lt: { x, y (the centre of its tight box), r (turn), air (flying), lift (px above its lane's floor), inside (still in the closet, drawn by the kit's hook) } */
function pieceAt(it, lt) {
  const S = it.segs;
  if (lt < it.tL) return { x: it.C0[0], y: it.C0[1], r: it.th0, air: false, held: true, inside: true, lift: 0 };
  for (const sg of S) if (lt < sg.t1) {
    const u = lt - sg.t0, d = sg.t1 - sg.t0, f = u / d;
    let x, y, r;
    if (sg.type === 'slide') { const e = 1 - Math.pow(1 - f, 2.2); x = lerp(sg.x0, sg.x1, e); y = lerp(sg.y0, sg.y1, e) - 1.4 * Math.sin(f * 40) * (1 - f); r = lerp(sg.r0, sg.r1, e); }
    else { x = sg.x0 + sg.vx * u; y = sg.y0 + sg.vy * u + .5 * G * u * u; r = lerp(sg.r0, sg.r1, f); }
    const ext = Math.abs(Math.cos(r)) * it.eh / 2 + Math.abs(Math.sin(r)) * it.ew / 2, fl = FLOORS[it.lane];
    const lift = Math.max(0, fl - (y + ext));
    return { x, y, r, air: sg.type === 'air' && lift > 2, held: false, inside: lt < it.tE, lift };
  }
  return { x: it.xR, y: it.yR, r: it.rr, air: false, held: false, inside: false, lift: 0 };
}

// ------------------------------------------------------------------ the three people: Strawberry (the tracer's last pose, then "Stand back.", then unmoved), Mr. Stateman (the eyebrow, the "Noted." nod, the tick), the Kumquat (buried, a hand with a clipboard)
/* is a character's face and body entirely inside the frame under the current camera? (a whip that carries somebody through the edge marks them transit) */
function frameStat(o) {
  const k = KINDS[o.kind], s = o.s || 1, L = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (L + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, bot = o.y + 24 * s, half = k.rx * 1.12 * s;
  const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const q = [p(o.x - half, top), p(o.x + half, top), p(o.x - half, bot), p(o.x + half, bot)], xs = q.map(a => a[0]), ys = q.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6 && y1 <= H - 6 };
}
const withTransit = (o, moving) => { const f = frameStat(o); if (f.inter && !f.whole && moving) o.transit = true; return o; };
/* the hand of an arm for a pair of preset angles (the forward kinematics of engine.js poseAngles), in the character's local units: the IK grip that reproduces a preset exactly */
function handOf(o, side, a1, a2) {
  const k = KINDS[o.kind], [sx, sy] = shoulder(k, side), sc = o.armScale || 1.12, L1 = (k.arm1 || 56) * sc, L2 = (k.arm2 || 52) * sc;
  return [sx + side * (Math.sin(a1) * L1 + Math.sin(a1 + a2) * L2), sy + Math.cos(a1) * L1 + Math.cos(a1 + a2) * L2];
}

// ------------------------------------------------------------------ Strawberry
const KNOB = DOOR0.knob;                                   /* [901, 896] */
const STR_GRIP = [161.4, -8.5];                            /* the tracer's last frame: her right glove on the knob, in her local units */
function strawC(lt) {
  const t = lt + TR_END, s1 = B('s1'), rel = sstep(lt, 1.46, 1.74);           /* she lets go of the knob */
  const sw = cl01((lt - .86) / .22), swo = easeOut(sw);                            /* the free arm comes out from behind her back on "Stand back." */
  const o = A11.straw({ x: CHAR.straw, y: FL, s: SS, t, who: 'straw', expr: 'dead', lid: .42, look: [.95, .1], arms: { l: 'none', r: 'hold' }, grip: { r: STR_GRIP }, hand: { r: 'grip' }, plant: true, cap: true, stride: 30 });
  /* eyes: the door, a glance up at the creak, then the people behind her on "Stand back.", then the pile */
  let look = [.95, .1];
  if (lt >= CUE.creak) look = [lerp(.95, .85, sstep(lt, CUE.creak, CUE.creak + .12)), lerp(.1, -.2, sstep(lt, CUE.creak, CUE.creak + .12)) * (1 - sstep(lt, CUE.creak + .35, CUE.creak + .6)) + .1 * sstep(lt, CUE.creak + .35, CUE.creak + .6)];
  if (lt >= s1.s - .08) look = [lerp(.95, -.8, sstep(lt, s1.s - .08, s1.s + .12)), .05];
  if (lt >= s1.e - .12) look = [lerp(-.8, .55, sstep(lt, s1.e - .12, s1.e + .12)), .1];
  if (lt >= CUE.crash1) look = [.45, .12 - .25 * sstep(lt, CUE.crash1, CUE.crash1 + .5)];
  if (lt >= B('n1').s) look = [lerp(.45, .1, sstep(lt, B('n1').s, B('n1').s + .8)), .12];
  if (lt >= B('k1').s + .2) look = [-.6, .2];
  if (lt >= B('st1').s - .1) look = [lerp(-.6, -.95, sstep(lt, B('st1').s - .1, B('st1').s + .2)), .05];
  o.look = look;
  /* the free hand: out from behind her back, flat, palm to the people behind her ("Stand back."), then down to her side and onto her hip */
  if (lt >= .86) {
    const down = [.1, .05], stop = [1.45, -.15], hips = [.85, -2.15];
    const a = lt < 1.55 ? lerpA(down, stop, swo) : lt < 2.0 ? lerpA(stop, down, sstep(lt, 1.55, 1.85)) : lerpA(down, hips, sstep(lt, 2.0, 2.4));
    o.arms.l = a; o.hand = Object.assign({}, o.hand, { l: lt < 1.6 ? 'flat' : 'open' });
  }
  /* the knob hand: lets go and drops to her side, then to her hip */
  if (lt >= 1.46) {
    const down = [.1, .05], hips = [.85, -2.15], g0 = STR_GRIP, g1 = handOf(o, 1, down[0], down[1]);
    if (lt < 1.74) o.grip = { r: lerpA(g0, g1, easeOut(rel)) }, o.hand.r = 'open';
    else { delete o.grip; o.arms.r = lt < 2.0 ? down : lerpA(down, hips, sstep(lt, 2.0, 2.45)); o.hand = Object.assign({}, o.hand, { r: 'open' }); }
  }
  /* unmoved: the slightest settle at each crash, a slow blink in the dust */
  const k1 = Math.exp(-Math.max(0, lt - CUE.crash1) / .35) * (lt >= CUE.crash1 ? 1 : 0), k2 = Math.exp(-Math.max(0, lt - CUE.crash2) / .35) * (lt >= CUE.crash2 ? 1 : 0);
  o.squash = .012 * (k1 + 1.4 * k2);
  const bl = lt > 4.9 ? Math.max(0, Math.sin((lt - 4.9) * 1.15 * PI)) ** 24 : 0; if (bl > .02) o.lid = Math.max(o.lid || .42, .42 + .58 * bl);
  return o;
}

// ------------------------------------------------------------------ Mr. Stateman: the half-step back, the eyebrow on the first crash, the "Noted." nod and the tick on "tag"
const ST_X = lt => CHAR.star - 8 * sstep(lt, 1.2, 1.7);
function stateC(lt) {
  const o = A14.stateman({ x: ST_X(lt), y: FL, s: SS, t: lt + 3.1, who: 'star', pose: 'carry', look: [.9, .05], stride: 38 });
  let look = [.9, .05], expr = 'neutral';
  if (lt >= B('s1').s) look = [.9, lerp(.05, -.05, sstep(lt, B('s1').s, B('s1').e))];
  if (lt >= CUE.crash1 + .1) { expr = 'stateman_brow'; look = [.85, .12]; }
  if (lt >= CUE.crash2 + .05) look = [.75, .22];
  if (lt >= B('n1').s) look = [lerp(.75, .5, sstep(lt, B('n1').s, B('n1').s + .8)), .3];
  if (lt >= B('k1').s + .2) look = [.3, .5];
  if (lt >= B('st1').s - .25) { look = [.1, .8]; expr = lt < B('st1').s ? 'stateman_brow' : 'neutral'; }
  o.look = look; if (expr !== 'neutral') o.expr = expr;
  /* the lean back at the first crash */
  o.rot = -.05 * (Math.exp(-Math.max(0, lt - CUE.crash1) / .5) * (lt >= CUE.crash1 ? 1 : 0)) + .02 * (lt >= B('st1').s ? 0 : 0);
  /* "It is a tag.": the clipboard comes up, he writes, the whole "Noted." gesture plays over the line */
  const wr = sstep(lt, B('st1').s - .3, B('st1').s + .1);
  if (wr > .01) { o.pose = 'write'; o.writing = .7 * wr * (1 - sstep(lt, wordT('st1', 'tag', 9.2) - .05, wordT('st1', 'tag', 9.2) + .2)); }
  if (lt >= B('st1').s) o.noted = seg(lt, B('st1').s + .05, B('st1').e - .1);
  return o;
}

// ------------------------------------------------------------------ the Kumquat: at his board, puzzled, crushed, buried; then one hand with the clipboard comes up out of the pile and bobs with his words
function kumC(lt) {
  /* he is off screen to the left in the tracer's last frame (x 700) and scoots in to his place as the camera backs away */
  const extra = { s: KSC, t: lt + 2.3, who: 'kum', stride: 32, pose: 'write', writing: .6, tongue: .8, look: [.95, .1], expr: 'kum_eager' }, kx = u => [lerp(700, CHAR.kum, easeOut(seg(u, 1.0, 1.6))), FL];
  if (lt >= B('s1').s) { extra.look = [.9, .25]; extra.expr = 'kum_eager'; extra.tongue = .8 * (1 - sstep(lt, B('s1').s, B('s1').s + .3)); }
  if (lt >= CUE.crash1) { extra.expr = 'kum_puzzled'; extra.look = [.2, -.5]; extra.writing = 0; extra.tongue = 0; }
  if (lt >= CUE.crash1 + .6) { extra.expr = 'kum_crushed'; extra.look = [.1, -.7]; }
  if (lt >= B('k1').s) extra.expr = 'kum_crushed';
  return S14.walk(A14.kumquat, kx, lt, extra);
}

// ------------------------------------------------------------------ the effects: dust, tinsel, glass, the lone sock, the flashes. All of them are stateless (a pure function of lt and a seed).
const DUSTC = '226,212,190';
function blob(x, y, r, col, a) { if (a <= .003 || r < 1) return; ctx.fillStyle = V2.radial(x, y, 0, r, [[0, `rgba(${col},${a})`], [1, `rgba(${col},0)`]]); ctx.fillRect(x - r, y - r, r * 2, r * 2); }
/* a soft cloud where a heavy piece lands: four blobs that swell and rise and thin out over about two seconds (slow motion), larger for the bigger pieces */
function impactDust(lt) {
  ctx.save();
  for (const e of sim().events) {
    if (e.a < .45 && e.id !== 'DOOR') continue;
    const life = 1.5 + 1.4 * e.a, u = (lt - e.t) / life; if (u < 0 || u >= 1) continue;
    for (let i = 0; i < 4; i++) {
      const h1 = hash(e.t * 7.1 + i * 3.3), h2 = hash(e.t * 3.7 + i * 5.1 + 1), dir = h1 < .5 ? -1 : 1;
      const px = e.x + dir * (6 + 70 * h2) * easeOut(u), py = e.y - 8 - (12 + 36 * h1) * easeOut(u) - i * 3, r = (16 + 52 * easeOut(u)) * (.55 + e.a * .7) * (.7 + .5 * h2);
      blob(px, py, r, DUSTC, .34 * e.a * Math.pow(1 - u, 1.6));
    }
  }
  ctx.restore();
}
/* the haze that lies along the floor after the first crash and thins out through the hold */
function floorHaze(lt) {
  const a = sstep(lt, CUE.crash1, CUE.crash1 + .8) * (1 - sstep(lt, 6.4, 8.6)); if (a <= .01) return;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const x = lerp(930, 700 + 40 * i, easeOut(cl01((lt - CUE.crash1) / 3.2))) + 28 * Math.sin(lt * .5 + i * 1.7), y = FL - 30 - 18 * (i % 3) - 6 * Math.sin(lt * .4 + i), r = 120 + 26 * (i % 3);
    ctx.save(); ctx.translate(x, y); ctx.scale(1.9, .55); blob(0, 0, r, DUSTC, .2 * a); ctx.restore();
  }
  ctx.restore();
}
/* the tinsel: 46 strands thrown out of the door at the first crash that drift and settle for five seconds (the old Christmas tree's) */
const TINSEL = (() => {
  const r = rnd(2020), pal = ['#e7edf5', '#f0c23a', '#d8d8e0', '#c23a2b', '#2f8a4a', '#f4f4f8'], out = [];
  for (let i = 0; i < 46; i++) out.push({ ts: 2.25 + r() * 1.5, x0: 880 + r() * 120, y0: 790 + r() * 170, vx: -170 + r() * 230, vy: -150 + r() * 90, ph: r() * TAU, len: 12 + r() * 14, col: pal[i % pal.length], sp: (r() - .5) * 3, tl: 6 + r() * 2.4, a0: r() * TAU });
  return out;
})();
function tinsel(lt) {
  ctx.save(); ctx.lineCap = 'round';
  for (const s of TINSEL) {
    const u = lt - s.ts; if (u < 0 || u > s.tl) continue;
    const k = 1.5, d = (1 - Math.exp(-k * u)) / k, x = s.x0 + s.vx * d + Math.sin(u * 2.1 + s.ph) * 9 * (1 - Math.exp(-u)), y = Math.min(FL - 2, s.y0 + s.vy * d + 24 * u + Math.cos(u * 1.7 + s.ph) * 5), a = Math.min(1, u * 4) * (1 - sstep(u, s.tl - 1.2, s.tl));
    ctx.save(); ctx.translate(x, y); ctx.rotate(s.a0 + s.sp * u); ctx.globalAlpha *= a;
    ctx.strokeStyle = 'rgba(30,20,40,.55)'; ctx.lineWidth = 3.4; ctx.beginPath(); for (let j = 0; j <= 6; j++) { const q = j / 6; ctx[j ? 'lineTo' : 'moveTo']((q - .5) * s.len, Math.sin(q * 9 + s.ph) * 2.2); } ctx.stroke();
    ctx.strokeStyle = s.col; ctx.lineWidth = 2; ctx.beginPath(); for (let j = 0; j <= 6; j++) { const q = j / 6; ctx[j ? 'lineTo' : 'moveTo']((q - .5) * s.len, Math.sin(q * 9 + s.ph) * 2.2); } ctx.stroke();
    const tw = Math.max(0, Math.sin(u * 7 + s.ph * 3)); if (tw > .85) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,250,220,${(tw - .85) * 6})`; ell(s.len * .3, 0, 3, 3); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}
/* the left pane goes at the first crash: shards of glass fly out with the junk */
const SHARDS = (() => {
  const r = rnd(3030), out = [];
  for (let i = 0; i < 30; i++) out.push({ dt: r() * .08, x0: 812 + r() * 70, y0: 720 + r() * 250, vx: -90 - r() * 330, vy: -150 + r() * 230, w: 6 + r() * 14, h: 5 + r() * 12, rot: r() * TAU, sp: (r() - .5) * 8, q: r() });
  return out;
})();
function shards(lt) {
  const t0 = CUE.crash1; if (lt < t0 || lt > t0 + 3.2) return;
  ctx.save(); ctx.lineJoin = 'round';
  for (const s of SHARDS) {
    const u = lt - t0 - s.dt; if (u < 0) continue;
    const gy = G * 1.5; let x = s.x0 + s.vx * u, y = s.y0 + s.vy * u + .5 * gy * u * u;
    const hit = y > FLB - 3; if (hit) { y = FLB - 3 + 1.5 * Math.sin(s.q * 9); x = s.x0 + s.vx * Math.sqrt(Math.max(0, 2 * (FLB - 3 - s.y0 + s.vy * .0) / gy)) * 1.0; }
    const a = (1 - sstep(u, 1.6, 3.0)) * .9;
    ctx.save(); ctx.translate(x, y); ctx.rotate(hit ? s.rot : s.rot + s.sp * u); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.moveTo(-s.w / 2, -s.h / 2); ctx.lineTo(s.w / 2, -s.h * .3); ctx.lineTo(s.w * .1, s.h / 2); ctx.closePath();
    ctx.fillStyle = 'rgba(200,228,248,.42)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
/* the lone sock, drifting down through the dust while the narrator speaks: it lands on the top of the heap. (the same sock the kit leaves at the foot of the door) */
function sockShape(sc = 1) {
  ctx.save(); ctx.scale(sc, sc); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8); ctx.lineTo(22, 8); ctx.quadraticCurveTo(32, 8, 31, 2); ctx.quadraticCurveTo(30, -2, 22, -1); ctx.closePath();
  ctx.fillStyle = '#f6f2ea'; ctx.fill(); ctx.strokeStyle = 'rgba(38,24,40,.78)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#c23a2b'; for (const x of [6, 14]) ctx.fillRect(x, -2, 3.4, 12); ctx.fillStyle = '#2b5fc2'; ctx.fillRect(26, -2, 8, 12); ctx.restore();
  ctx.restore();
}
const SOCK = { t0: 3.9, t1: 6.5, x0: 925, y0: 712, x1: 892 };   /* born at the top of the closet's air, comes to rest on the heap at x1 (the heap's height there is read from the sim) */
function drawSock(lt) {
  if (lt < SOCK.t0) return;
  const S = sim(), u = cl01((lt - SOCK.t0) / (SOCK.t1 - SOCK.t0)), top = FLB - S.Hf.B[Math.round((SOCK.x1 - HX0) / HDX)] - 7;
  const e = u * (2 - u) * .6 + u * .4;                                 /* nearly steady, a little slower at the end */
  const x = lerp(SOCK.x0, SOCK.x1, e) + Math.sin(u * 14) * 15 * (1 - u * .7), y = lerp(SOCK.y0, top, e) + 3 * Math.sin(u * 22);
  const rot = Math.sin(u * 11) * .55 * (1 - u) + .25 * u + (u >= 1 ? .05 : 0), a = sstep(lt, SOCK.t0, SOCK.t0 + .4);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.translate(-15, -3); sockShape(1.35); ctx.restore();
}
/* the kit draws its striped sock at the foot of the door only while it is drawing the stash; the avalanche takes the stash away at the first movement, so the sock is kept here until the door has gone */
function doorSock(lt) {
  const d = doorAt(lt); if (d > .3) return;
  ctx.save(); ctx.translate(RS.x0 + 90, RS.y0 + 307); ctx.rotate(.04); sockShape(1); ctx.restore();
}
/* the creak: a thread of dust shakes loose from the top edge of the straining door */
function creakDust(lt) {
  const k = (lt - CUE.creak) / 1.1; if (k < 0 || k >= 1) return;
  for (let i = 0; i < 3; i++) blob(906 + i * 30 + 6 * Math.sin(lt * 7 + i), 796 + 26 * k * (1 + i * .3), 9 + 14 * k, DUSTC, .34 * (1 - k) * (1 - k));
}
/* the flashes: the door leaf slams into its stop (a ring and a puff of the wall), the left pane goes (a bright burst), the second crash shakes the floor */
function flashes(lt) {
  const k1 = lt - CUE.crash1, k2 = lt - CUE.crash2;
  if (k1 > -.05 && k1 < .9) { V2.glow(872, 870, 300, '255,238,205', .55 * Math.exp(-Math.max(0, k1) / .22), 'screen', .7); ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(978, 900, k1 / .9, { r0: 24, r1: 300, lw: 9, color: '255,236,205', alpha: .55, squash: .92 }); ctx.restore(); }
  if (k2 > -.05 && k2 < .8) V2.glow(790, 930, 280, '255,226,190', .4 * Math.exp(-Math.max(0, k2) / .24), 'screen', .6);
}
/* a dusty shaft of the closet's own lamp through the open door, and motes in it: the hold on the wreck */
function lampShaft(lt) {
  const a = sstep(lt, CUE.crash1 + .3, CUE.crash1 + 1.2) * (1 - sstep(lt, 8.4, 9.6)); if (a <= .01) return;
  V2.beam(934, 702, 880, 1000, 46, 300, '255,236,200', .1 * a, 'screen');
  V2.dust(700, 700, 1060, 1000, lt, { n: 90, seed: 11, size: 2.6, alpha: .55 * a, speed: 9, color: '255,244,214' });
}

// ------------------------------------------------------------------ the door, the room, the pieces
/* the leaf: shut and straining until the latch gives at the slow-motion cue, a creep, then flung to its stop on crash 1, a bounce off the stop, and open */
function doorAt(lt) {
  const t0 = CUE.slowmo + .04, tc = CUE.crash1;
  if (lt < t0) return 0;
  if (lt < tc - .22) return .2 * sstep(lt, t0, tc - .22);
  if (lt < tc) return lerp(.2, 1, easeIn(seg(lt, tc - .22, tc)));
  if (lt < tc + .26) return lerp(1, .8, easeOut(seg(lt, tc, tc + .26)));
  if (lt < tc + .6) return lerp(.8, 1, easeIO(seg(lt, tc + .26, tc + .6)));
  return 1;
}
const bulgeAt = lt => lt < CUE.slowmo ? 1 : lerp(1, .55, sstep(lt, CUE.slowmo, CUE.crash1 + .4));
const camSpeed = lt => { const a = camAt(lt - .02), b = camAt(lt + .02), za = (a.z + b.z) / 2; return Math.hypot((b.x - a.x) * za, (b.y - a.y) * za, Math.log(b.z / a.z) * 900) / .04; };

/* a piece's contact shadow: the kit's recipe for a piece standing on the closet floor, and a shadow on the floor under a piece in the air that tightens as it comes down */
function pieceShadow(it, p) {
  if (p.held) { if (it.k.y > 962) fshadow(it.k.x, it.k.y + 2, it.k.w * .9, .3, 5); return; }
  const lift = p.lift, a = .3 * (1 - Math.min(1, lift / 150) * .85);
  if (a < .02 || p.inside) return;
  fshadow(p.x, FLOORS[it.lane] + 2, it.ew * (.9 - Math.min(.35, lift / 500)), a, 5);
}
/* the Christmas tree unfolds as it falls: boughs open outward from the top of its box over the flight (the kit's sprite is the folded tree in its box) */
function treeBoughs(it, p, lt) {
  const k = sstep(lt, it.tL + .1, it.tI - .05); if (k <= .02) return;
  const s = it.spr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.translate(-s.cx, -s.cy);
  const tiers = [[-66, 40], [-82, 33], [-97, 25], [-109, 15]];
  tiers.forEach(([y, w], i) => {
    const ww = w * k, dr = 12 * k, yy = y + (1 - k) * 28;
    ctx.beginPath(); ctx.moveTo(-ww, yy + dr); ctx.quadraticCurveTo(-ww * .5, yy + dr * .2, 0, yy - 16 * k); ctx.quadraticCurveTo(ww * .5, yy + dr * .2, ww, yy + dr); ctx.quadraticCurveTo(0, yy + dr * 1.5, -ww, yy + dr); ctx.closePath();
    ctx.fillStyle = V2.grad(0, yy - 16, 0, yy + dr, [[0, '#4fb15e'], [1, '#2a7a40']]); ctx.fill(); ctx.strokeStyle = 'rgba(0,45,18,.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = i % 2 ? '#d8342c' : '#f0c23a'; ell(-ww * .62, yy + dr * .9, 2.3, 2.3); ctx.fill(); ell(ww * .6, yy + dr * .8, 2.3, 2.3); ctx.fill();
  });
  ctx.restore();
}
/* the HOURS SINCE THE Q WORD sign: the sprite has no lettering (it is built with the text switched off); the lettering is drawn live once the sign lies near upright, so that it is never turned past the text gate's tilt limit */
function qsignText(it, p, lt) {
  const rN = ((p.r + PI) % TAU + TAU) % TAU - PI; if (Math.abs(rN) > .12 || p.air) return;
  const s = it.spr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.translate(-s.cx, -s.cy);
  UI.label('HOURS SINCE THE Q WORD', 0, -27, { size: 4.6, hero: false, crop: true, fill: 'rgba(255,255,255,.85)', maxW: 54, weight: 800 });
  ctx.restore();
}
function drawPiece(it, p, lt, rim) {
  let sc = 1; if ((it.lane === 'F' || it.lane === 'G') && !p.held) sc = 1 + .09 * Math.sin(PI * cl01((lt - it.tL) / Math.max(.3, it.tI - it.tL + .35)));
  putSprite(it.spr, p.x, p.y, p.r, sc, rim);
  if (it.id === 'tree') treeBoughs(it, p, lt);
  if (it.id === 'qsign') qsignText(it, p, lt);
}
/* the pieces still in the closet (held, or just starting to move) are drawn by the kit's hook, behind the glass and the door; the room's own stash is switched off from the first movement */
function hookDraw(lt) {
  return () => {
    const S = sim(), rimK = sstep(lt, CUE.slowmo, CUE.slowmo + .5);
    for (const it of S.items.filter(i => lt < i.tE).sort((a, b) => a.z - b.z)) { const p = pieceAt(it, lt); pieceShadow(it, p); drawPiece(it, p, lt, rimK); }
  };
}
/* a lane of pieces in the world: the resting ones in the order they landed (so the heap stacks the way it was built), the flying ones on top of them */
function lanePass(lane, lt) {
  const S = sim(), list = S.items.filter(i => i.lane === lane && lt >= i.tE).map(it => ({ it, p: pieceAt(it, lt) }));
  list.sort((a, b) => (a.p.air - b.p.air) || (a.p.air ? a.it.tL - b.it.tL : a.it.tI - b.it.tI));
  for (const { it, p } of list) pieceShadow(it, p);
  for (const { it, p } of list) drawPiece(it, p, lt, 1);
}

// ------------------------------------------------------------------ the world
function setLights(lt) {
  const r = sstep(lt, 1.6, 2.2) * (1 - sstep(lt, 5.0, 6.6));
  V2.setLight({ key: [-.4, -.8], keyColor: '#ffe9c4', keyA: .24 + .08 * r, rim: '#a9ccff', rimA: .5 + .16 * r, shadow: '#2a2040', shadowA: .34, bounce: '#ffd9a0', bounceA: .18, amb: '#fff0d8', ambA: .05 });
}
function roomOpts(lt) {
  const slow = lt >= CUE.slowmo;
  const sh = { stash: slow ? 0 : 4, bulge: bulgeAt(lt), door: doorAt(lt) };
  if (slow) sh.junk = hookDraw(lt);
  return { r4: { peel: 0 }, med: { pens: 1 }, shower: sh };
}
function wallLight(lt) { ctx.save(); ctx.translate(880, FL - 70); pendant(0, 0, 0, .75 + .25 * Math.sin((lt + TR_END) * 7), 1.45); ctx.restore(); }
function drawWorld(lt) {
  setLights(lt);
  const rooms = roomOpts(lt), t = lt + TR_END, moving = camSpeed(lt) > 300;
  S14.back(lt, { t, rooms });
  if (lt >= CUE.slowmo) doorSock(lt);
  wallLight(lt);
  sim(); lanePass('B', lt);
  drawSock(lt);
  for (const o of [lt < .95 ? null : stateC(lt), kumC(lt), strawC(lt)]) if (o) drawChar(withTransit(o, moving || lt < 2.1));       /* the camera is still backing away: whoever is cut by the left edge is coming into frame */
  kumHand(lt);
  lanePass('F', lt); lanePass('G', lt);
  S14.front(lt, { rooms });
  drawTick(lt);
  creakDust(lt); floorHaze(lt); impactDust(lt); tinsel(lt); shards(lt); lampShaft(lt); flashes(lt);
}

/* the Kumquat's hand: his body is under the pile; one arm in a dark sleeve comes up out of the stack holding the clipboard, bobs on each word of "Is the Christmas tree a tag?" and sinks back with the sad trombone.
   (An arm cannot reach out of a pile higher than itself, so this is drawn as a set piece behind the front lanes: the pile covers its root.) */
function kumHand(lt) {
  const k1 = B('k1'), up = sstep(lt, k1.s - .5, k1.s - .05), dn = sstep(lt, CUE.trombone, B('end').e + .15), a = up * (1 - dn); if (a <= .01) return;
  const S = sim(), xi = Math.round((CHAR.kum + 4 - HX0) / HDX), top = FL - Math.max(S.Hf.G[xi] || 0, S.Hf.F[xi] || 0) - 4;
  const L = TL.lines.find(q => q.scene === CUR.id && q.id === 'k1'), ph = L ? L.words.map(w => [w[1] + L.s - CUR.start, w[2] + L.s - CUR.start]) : [];
  let bob = 0; for (const [p, q] of ph) if (lt >= p && lt < q) bob = Math.sin((lt - p) / (q - p) * PI);
  const hx = CHAR.kum + 3 + 3 * Math.sin(lt * 5.1), hy = top + 26 - 78 * a - 6 * bob, rot = .1 * Math.sin(lt * 3.3) + .14 * bob - .3 * dn;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = INKC; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(hx - 4, top + 46); ctx.lineTo(hx, hy + 6); ctx.stroke();
  ctx.strokeStyle = '#3a3342'; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(hx - 4, top + 46); ctx.lineTo(hx, hy + 6); ctx.stroke();
  ctx.translate(hx + 3, hy - 22); A14.clip(0, 0, { clipScale: .66, rot, clipPage: .1 });
  ctx.restore();
  ctx.save(); ctx.fillStyle = '#f6f6fa'; ctx.strokeStyle = INKC; ctx.lineWidth = 2; ell(hx, hy + 3, 6.2, 5.6); ctx.fill(); ctx.stroke(); ctx.restore();
}

/* the tick: on "tag" a red stamp-ring with a check mark punches onto Stateman's clipboard (graphics only, no lettering). It is drawn in the world, on the board, after the armchair's arm that half hides the board. */
function drawTick(lt) {
  const t0 = wordT('st1', 'tag', 9.19) + .02, k = seg(lt, t0, t0 + .16); if (k <= 0) return;
  const o = stateC(lt), [cx, cy] = H6.localToScreen(o, -13.6, 110.1), R = 19, sc = lerp(1.55, 1, easeOut(k)), a = Math.min(1, k * 6);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.rotate(-.14); ctx.scale(sc, sc); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(40,10,8,.55)'; ctx.lineWidth = R * .26; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#c23a2b'; ctx.lineWidth = R * .16; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  const tk = () => { ctx.beginPath(); ctx.moveTo(-R * .5, R * .02); ctx.lineTo(-R * .12, R * .42); ctx.lineTo(R * .56, -R * .4); };
  ctx.strokeStyle = 'rgba(40,10,8,.55)'; ctx.lineWidth = R * .3; tk(); ctx.stroke();
  ctx.strokeStyle = '#c23a2b'; ctx.lineWidth = R * .2; tk(); ctx.stroke();
  ctx.restore();
  if (lt - t0 < .5) V2.ring(cx, cy, (lt - t0) / .5, { r0: R * .8, r1: R * 2.1, lw: 2, color: '255,200,190', alpha: .5, bloom: 0 });
}

// ------------------------------------------------------------------ the camera. It starts exactly where the tracer's last frame left it (centre (876, 884), zoom 3.9, a constant push of +0.0795 ln-zoom per second) and carries on at that speed;
// it backs away on "Stand back.", holds a medium wide on the avalanche, drifts out on the wreck, pushes to the buried Kumquat for his question and whips (.3 s) to Stateman for the tick.
const PUSH = lt => { const e = lt + 1 / 30; return { x: 876 - 2.31 * e, y: 884 + 2.31 * e, z: 3.9 * Math.exp(.0795 * e) }; };
const WIDE = { x: 836, y: 878, z: 2.45 };
const mixPose = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)) });
const DRIFT = lt => ({ x: 836 - .9 * (lt - 1.9), y: 878 - 1.7 * (lt - 1.9), z: 2.45 * Math.exp(-.04 * (lt - 1.9)) });
const KUMP = lt => ({ x: 790 - 1.6 * (lt - 6.85), y: 906, z: 2.7 * Math.exp(.03 * (lt - 6.85)) });
const STP = lt => ({ x: 718, y: 888, z: 3.0 * Math.exp(.045 * (lt - 8.62)) });
function camAt(lt) {
  if (lt < .9) return PUSH(lt);
  if (lt < 1.9) return mixPose(PUSH(lt), WIDE, sstep(lt, .9, 1.9));
  let c = DRIFT(lt);
  if (lt > 6.35) c = mixPose(c, KUMP(lt), sstep(lt, 6.35, 7.05));
  if (lt > 8.3) c = mixPose(c, STP(lt), easeIO(seg(lt, 8.3, 8.62)));
  return c;
}
const shotOf = lt => lt < 1.0 ? 'tight' : lt < CUE.slowmo ? 'back' : lt < B('n1').s ? 'slide' : lt < 6.6 ? 'wreck' : lt < 8.3 ? 'kumquat' : 'stateman';
const shakeAt = lt => {
  const k = (t0, a, tau) => lt >= t0 ? a * Math.exp(-(lt - t0) / tau) : 0;
  return k(CUE.crash1, 9, .3) + k(CUE.crash2, 11, .32) + k(CUE.clatter1, 3, .25) + k(CUE.clatter2, 3.5, .25) + 2.2 * sstep(lt, CUE.rumble - .2, CUE.rumble + .2) * (1 - sstep(lt, CUE.crash1 - .1, CUE.crash1)) + 1.2 * sstep(lt, 1.35, CUE.slowmo) * (1 - sstep(lt, CUE.slowmo, CUE.slowmo + .1));
};
/* the grade: the tracer's (bloom .45, vignette .36, grain .05, contrast .14, sat .1) until the latch gives, then the slow-motion look (deeper, warmer, a flash on each crash), then back to it */
function fxAt(lt) {
  const sm = sstep(lt, CUE.slowmo - .1, CUE.slowmo + .4) * (1 - sstep(lt, 4.4, 5.6));
  const fl = lt >= CUE.crash1 ? .22 * Math.exp(-(lt - CUE.crash1) / .16) : 0, f2 = lt >= CUE.crash2 ? .16 * Math.exp(-(lt - CUE.crash2) / .16) : 0;
  const o = { bloom: .45 + .12 * sm + fl + f2, vignette: .36 + .1 * sm + .06 * sstep(lt, 9.2, 10.4), grain: .05, contrast: .14 + .07 * sm, sat: .1 };
  if (sm > .01) o.tint = [['#ffd9a0', .05 * sm, 'soft-light']];
  return o;
}
const blurAt = lt => {
  const sp = camSpeed(lt);
  let n = lt >= CUE.slowmo + .1 && lt < 4.7 ? 3 : 1;
  if (sp > 900) n = 7; else if (sp > 400) n = Math.max(n, 4); else if (sp > 150) n = Math.max(n, 2);
  return n;
};

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotOf(lt),
  cam(lt) { const c = camAt(lt); zoomTo(c.x, c.y, c.z); CAM.shake = shakeAt(lt); CAM.r = 0; },
  draw: lt => drawWorld(lt),
  fx: lt => fxAt(lt),
  blur: lt => blurAt(lt),
  over(lt) {},
};
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.closet = SC;
})();
