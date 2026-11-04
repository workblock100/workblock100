'use strict';
/* SHIFT HAPPENS, Episode 18: "The Fire Drill". Scene module: evac (8:10 PM, THE EVACUATION, 27.46 s). Builder EVAC. Registers window.__EP18_SCENES.evac. The crowd is ep18_evac_sim.js (DOM-free, build()).
 *
 * Two worlds. THE DAY ROOM (0 to 15 s, a one-point-perspective set of its own, lit by the Yule log on the TV against the red strobe of the shut-door corridor) and THE FIRE DOOR OUTSIDE (night, a flat elevation of the
 * building's north wall: the open fire door with the pulsing corridor behind it, the EXIT sign, a wall strobe), joined by THE PLAN: a top-down dollhouse cutaway of Unit B (day room, hallway, the fire door as a red bar,
 * the assembly point as a painted rectangle) in which the crowd sim runs as a time-lapse (badge xN) under a HEADCOUNT chip.
 *
 * Shots (scene-local s): open 0-1.6 wide from behind the semicircle (the Yule log, the strobe at the window; SNOOZE ENDED on the wall tablet) | l1 1.6-3.93 Lemon in the doorway, backlit | r1 3.93-5.69 the residents'
 * chorus (heads a quarter turn) | l2 5.69-7.46 Lemon | c1 7.46-8.94 Mr. Banana, the flame in his glasses (a held beat) | s1 8.94-10.26 Strawberry takes the remote from the chair arm | rm 10.26-11.21 the remote, click 10.458,
 * the TV collapses to a dot at 10.608 and the warm room goes cold | r2 11.21-12.0 "Boo." (Cranberry first) | line 12.0-12.9 tracking shot along the line in profile | plan 12.9-15.06 the time-lapse (x1 to x25 to x1.4) |
 * l3 15.06-15.97 Lemon at the fire door, "Headcount." | m1 15.97-18.33 Mango counts the last three (the chip reads 38 / 39 / 40 on her words) | l4 18.33-19.63 Lemon ticks the clipboard | ch1 19.63-21.02 the plan, the flood |
 * l5 21.02-21.83 Lemon "Eighty." (the chip rolls 40 to 80) | t1 21.83-23.23 Tomato, UNASSIGNED: 40 | l6 23.23-24.83 the plan: the hallway packed | t2 24.83-26.01 Tomato, a held close-up | end 26.01-27.46 the plan: 80 heads at the
 * assembly point, the strobe still pulsing (the sting at 26.108).
 */
(() => {
if (!window.TIMELINE_EP18 || !window.H6 || !window.V2 || !window.A15 || !window.UI) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A11 = window.A11, A15 = window.A15, S6 = window.S6;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP18, SCN = TLX.scenes.find(s => s.id === 'evac'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'evac') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];      /* scene-local start of the i-th word of a spoken line (words are line-relative in the timeline) */
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };   /* ease out back */
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const snapT = t => Math.round((START + t) * 30) / 30 - START;            /* the scene-local time of the video frame nearest to t: a picture event lands on this frame */
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };   /* seeded noise 0..1, a pure function of its arguments */
const lazy = f => { let v, done = false; return () => (done ? v : (done = true, v = f())); };
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const F18 = () => (window.FX18 && typeof FX18.flame === 'function') ? FX18 : null;

/* the sound cues of the scene (scene-local seconds, from script_ep18.json: beat start + offset; python3 /tmp/shift_tools/cues.py 18 evac), snapped to the video frame nearest each */
const CUE = { pachime: .2, horn3: .5, yulecrackle: .3, click: 10.458, tvoff: 10.608, wheelchair: 12.008, cartrattle: 12.608, sting: 26.108 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);
/* the horn and the strobe: k = seconds since the horn3 cue; the pattern is the sound's (FX18.HORN): three pulses, a pause */
const hornK = lt => lt >= CUE.horn3 ? lt - CUE.horn3 : -1;
const strobeAt = lt => { const k = hornK(lt); if (k < 0) return 0; if (window.FX18 && FX18.strobe) return FX18.strobe(k); const m = k % 4, p = m % 1; return m < 2.5 && p < 1 && Math.floor(m) < 3 ? Math.exp(-(m - Math.floor(m)) / .22) * (m - Math.floor(m) < .5 ? 1 : 0.2) : 0; };
const hornOnAt = lt => { const k = hornK(lt); if (k < 0) return 0; if (window.FX18 && FX18.hornOn) return FX18.hornOn(k); const m = k % 4; return (m < .5 || (m >= 1 && m < 1.5) || (m >= 2 && m < 2.5)) ? 1 : 0; };

/* the crowd sim (DOM-free; the same module runs in node): built once, sampled at any scene time */
const SIM = lazy(() => (window.__EP18_SIMS && window.__EP18_SIMS.evac) ? window.__EP18_SIMS.evac.build() : null);
const SOUT = lazy(() => SIM() && SIM().mkOut());
const NOMINAL = 1.2;                                                     /* the sim's walking speeds are 1.2 times the brief's (walkers .6, wheelchairs .9): the badge divides by it */

// ------------------------------------------------------------------ THE PLAN (top-down dollhouse of Unit B): metres, y north; screen x = 540 + (x - cx) S, y = SYC - (y - cy) S
const SYC = 800;
const WIN = { plan: [12.9, 15.058], ch1: [19.627, 21.018], l6: [23.226, 24.829], end: [26.008, 27.458] };
const TDCAM = {
  plan: lt => key([[12.9, [3.0, 8.9, 86]], [13.5, [3.2, 9.4, 90]], [14.3, [4.6, 11.6, 93]], [15.06, [6.5, 14.8, 98]]], lt, easeIO),
  ch1: lt => key([[19.627, [4.4, 9.4, 54]], [21.02, [5.2, 10.8, 60]]], lt, easeIO),
  l6: lt => key([[23.226, [6.6, 13.0, 84]], [24.83, [6.6, 13.9, 88]]], lt, easeIO),
  end: lt => key([[26.008, [6.7, 24.7, 70]], [27.46, [6.7, 24.3, 74]]], lt, easeIO),
};
const tdShotAt = lt => lt >= WIN.end[0] ? 'end' : lt >= WIN.l6[0] && lt < WIN.l6[1] ? 'l6' : lt >= WIN.ch1[0] && lt < WIN.ch1[1] ? 'ch1' : lt >= WIN.plan[0] && lt < WIN.plan[1] ? 'plan' : null;
const HEADCOL = ['#d6403c', '#f28c28', '#98a63c', '#8a52b8', '#4a63c9', '#f4a07a', '#9a3d6c', '#7dc35a', '#c01a44', '#9a6a40', '#e7c98f', '#6fb0a8'];
const CARDIG = ['#4e7a8c', '#8c5a6b', '#6b7f4e', '#8a7a3e', '#5b5e9a', '#9a5a3a', '#6a6a78', '#7a4e8c'];
const TD_OUT = 'rgba(14,8,20,.92)';

/* one head of the crowd, seen from above (local metres: +x is where it faces); wheelchair and walker icons for the residents, a red head with a calyx and a med cup for a Strawberry */
function tdAgent(a, x, y, hx, hy, S, lt, seated, X, Y) {
  const sc = S, ang = -Math.atan2(hy, hx), br = 1 + .012 * Math.sin(lt * 2.2 + a.id);
  ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(ang); ctx.scale(sc, sc); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const dk = TD_OUT, lw = .032;
  const circ = (cx, cy, r, fill, stroke) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * PI); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = dk; ctx.stroke(); } };
  const rrm = (x0, y0, w, h, r, fill, stroke) => { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = dk; ctx.stroke(); } };
  if (a.kind === 'straw') {
    const r = (a.r + .015) * br;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(.03, .035, r * 1.05, r * .95, 0, 0, 2 * PI); ctx.fill();
    circ(0, 0, r, '#ee2b48', true);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(-.04, -.07, r * .42, r * .22, -.5, 0, 2 * PI); ctx.fill();
    ctx.fillStyle = '#f7d96a'; for (let i = 0; i < 7; i++) { const aa = i * 2.4 + sr(a.id, 1) * 6, rr2 = r * (.45 + .4 * ((i * 37 % 10) / 10)); ctx.beginPath(); ctx.ellipse(Math.cos(aa) * rr2, Math.sin(aa) * rr2, .012, .018, aa, 0, 2 * PI); ctx.fill(); }
    ctx.fillStyle = '#4fae4a'; ctx.strokeStyle = 'rgba(20,70,24,.9)'; ctx.lineWidth = .016; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const aa = i * PI / 5 + .3, rr2 = i % 2 ? r * .22 : r * .6; ctx.lineTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,10,20,.8)'; ctx.lineWidth = .03; ctx.beginPath(); ctx.moveTo(.05, -r * .9); ctx.lineTo(r * .78, -.05); ctx.moveTo(.05, r * .9); ctx.lineTo(r * .78, .05); ctx.stroke();
    circ(r * .95, 0, .062, '#f4f6fa', true); circ(r * .95, 0, .033, '#ffcf5a');
  } else {
    const chair = a.kind === 'chair', walk = a.kind === 'walk', cc = CARDIG[a.col % CARDIG.length], hc = a.name === 'banana' ? '#ffd23f' : a.name === 'pear' ? '#b9d654' : a.name === 'cran' ? '#d10f45' : HEADCOL[a.col % HEADCOL.length];
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(.03, .04, chair ? .5 : .36, chair ? .42 : .34, 0, 0, 2 * PI); ctx.fill();
    if (chair) {
      rrm(-.28, -.33, .5, .07, .03, '#13151a', true); rrm(-.28, .26, .5, .07, .03, '#13151a', true);               /* the two wheels */
      ctx.fillStyle = '#8f98a6'; ctx.fillRect(-.06, -.35, .06, .03); ctx.fillRect(-.06, .32, .06, .03);
      rrm(-.3, -.24, .52, .48, .06, '#59606d', true);                                                              /* seat and frame */
      rrm(.26, -.14, .13, .28, .04, '#79808e', true);                                                              /* the footrest */
      ctx.strokeStyle = '#c5ccd8'; ctx.lineWidth = .03; ctx.beginPath(); ctx.moveTo(-.34, -.22); ctx.lineTo(-.34, .22); ctx.stroke();   /* the push handle */
    } else if (walk && !seated) {
      ctx.strokeStyle = '#c9d0dc'; ctx.lineWidth = .045; ctx.beginPath(); ctx.moveTo(.18, -.3); ctx.lineTo(.56, -.3); ctx.lineTo(.56, .3); ctx.lineTo(.18, .3); ctx.stroke();
      ctx.lineWidth = .03; ctx.strokeStyle = '#8f98a6'; ctx.beginPath(); ctx.moveTo(.18, -.3); ctx.lineTo(.18, .3); ctx.stroke();
      ctx.fillStyle = '#20232a'; for (const [qx, qy] of [[.56, -.3], [.56, .3], [.2, -.3], [.2, .3]]) { ctx.beginPath(); ctx.arc(qx, qy, .032, 0, 2 * PI); ctx.fill(); }
    }
    ctx.strokeStyle = cc; ctx.lineWidth = .075; ctx.beginPath(); ctx.moveTo(-.02, -.22); ctx.lineTo(chair ? .06 : .16, chair ? -.3 : -.26); ctx.moveTo(-.02, .22); ctx.lineTo(chair ? .06 : .16, chair ? .3 : .26); ctx.stroke();   /* the arms */
    ctx.beginPath(); ctx.ellipse(-.03, 0, .14, .28, 0, 0, 2 * PI); ctx.fillStyle = cc; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dk; ctx.stroke();   /* the shoulders */
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(-.05, -.09, .06, .13, 0, 0, 2 * PI); ctx.fill();
    ctx.fillStyle = '#f4f1ea'; for (let i = 0; i < 6; i++) { const aa = PI * (.62 + .76 * i / 5); ctx.beginPath(); ctx.arc(.02 + Math.cos(aa) * .15, Math.sin(aa) * .15, .055, 0, 2 * PI); ctx.fill(); }   /* white hair at the back of the head */
    if (a.name === 'banana') { ctx.beginPath(); ctx.ellipse(.03, 0, .21, .12, 0, 0, 2 * PI); ctx.fillStyle = hc; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = dk; ctx.stroke(); ctx.fillStyle = '#6a4a12'; ctx.beginPath(); ctx.arc(.22, 0, .028, 0, 2 * PI); ctx.fill(); }
    else if (a.name === 'cran') { circ(.03, 0, .15, hc, true); ctx.fillStyle = '#f2a6c2'; for (let i = 0; i < 4; i++) { const aa = -1 + i * .66; ctx.beginPath(); ctx.arc(-.01 + Math.cos(aa + PI) * .12, Math.sin(aa + PI) * .12, .035, 0, 2 * PI); ctx.fill(); } }
    else { circ(.03, 0, .155, hc, true); if (a.name === 'pear') { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-.02, -.012, .05, .024); } }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(.0, -.06, .05, .03, -.4, 0, 2 * PI); ctx.fill();
    if (a.kind === 'shuf' && a.id % 3 === 0) { ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = .03; ctx.beginPath(); ctx.moveTo(.3, .26); ctx.lineTo(.3, .44); ctx.arc(.34, .44, .04, PI, 0); ctx.stroke(); }
  }
  ctx.restore();
}
/* a member of staff from above: Lemon (yellow), Mango (orange), Tomato (red) with a clipboard or a tablet */
function tdStaff(name, x, y, hx, hy, S, lt, X, Y) {
  const col = { lemon: ['#ffd60a', '#b88900'], mango: ['#ff9f1c', '#b45a00'], tom: ['#ff4d2e', '#8f1208'] }[name], br = 1 + .02 * Math.sin(lt * 2.4 + x);
  ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(-Math.atan2(hy, hx)); ctx.scale(S * br, S * br); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(.03, .04, .3, .27, 0, 0, 2 * PI); ctx.fill();
  ctx.strokeStyle = TD_OUT; ctx.lineWidth = .034;
  ctx.beginPath(); ctx.ellipse(0, 0, .25, .22, 0, 0, 2 * PI); ctx.fillStyle = col[0]; ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-.04, -.08, .09, .05, -.4, 0, 2 * PI); ctx.fill();
  if (name === 'lemon') { ctx.fillStyle = col[1]; ctx.beginPath(); ctx.arc(.24, 0, .03, 0, 2 * PI); ctx.fill(); }
  ctx.strokeStyle = TD_OUT; ctx.lineWidth = .03; ctx.beginPath(); ctx.moveTo(.1, -.2); ctx.lineTo(.3, -.08); ctx.moveTo(.1, .2); ctx.lineTo(.3, .08); ctx.stroke();
  if (name === 'tom') { ctx.beginPath(); ctx.roundRect(.28, -.15, .12, .3, .02); ctx.fillStyle = '#20232a'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8fd0ff'; ctx.fillRect(.3, -.12, .08, .24); }
  else { ctx.beginPath(); ctx.roundRect(.28, -.14, .1, .28, .02); ctx.fillStyle = '#f4f1e6'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c9ccd4'; ctx.fillRect(.27, -.04, .03, .08); }
  ctx.restore();
}
/* the floor plan itself: void, outside slab, rooms, hallway, day room (carpet, rug, chairs, tables, TV), walls with a drop shadow, the red fire door, the count stripe, the assembly rectangle, the wall strobes */
function tdPlan(lt, v, S0, st) {
  const [cx, cy, S] = v, X = x => 540 + (x - cx) * S, Y = y => SYC - (y - cy) * S, P = S0.PLAN, D = P.DR, fl = strobeAt(lt);
  const rect = (x0, y0, x1, y1, fill, stroke, lw) => { ctx.beginPath(); ctx.rect(X(x0), Y(y1), (x1 - x0) * S, (y1 - y0) * S); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
  ctx.fillStyle = '#0b0e13'; ctx.fillRect(0, 0, W, H);
  /* the outside: a paved patio north of the building face, the painted assembly rectangle on it */
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rect(-3.0, 19, 14.0, 31.4, '#262d37'); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let gy = 19.6; gy < 31; gy += 1.6) ctx.fillRect(X(-3.0), Y(gy), 17 * S, 1);
  /* the building slab and its rooms */
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 16; rect(-3.0, -.8, 13.6, 19.0, '#1d222b'); ctx.restore();
  const room = (x0, y0, x1, y1, f) => rect(x0, y0, x1, y1, f || '#2c323d');
  [[-3.0, 13, -.1, 19], [-.1, 13, 2.8, 19], [2.8, 13, 5.5, 19], [-3.0, -.8, -.1, 4.4], [-.1, -.8, 2.8, 4.4], [2.8, -.8, 5.5, 4.4], [-3.0, 4.4, -1.7, 13]].forEach(r => room(...r));
  [[7.9, 0, 13.6, 3.3], [7.9, 3.3, 13.6, 6.6], [7.9, 6.6, 13.6, 9.9], [7.9, 9.9, 13.6, 13.2], [7.9, 13.2, 13.6, 16.1], [7.9, 16.1, 13.6, 19.0]].forEach(r => room(...r, '#2e3440'));
  for (const [x0, y0, x1, y1] of [[8.2, .3, 10.2, 1.4], [8.2, 3.6, 10.2, 4.7], [8.2, 6.9, 10.2, 8.0], [8.2, 10.2, 10.2, 11.3], [8.2, 13.5, 10.2, 14.6], [8.2, 16.4, 10.2, 17.5]]) { ctx.beginPath(); ctx.roundRect(X(x0), Y(y1), (x1 - x0) * S, (y1 - y0) * S, S * .08); ctx.fillStyle = '#9aa4b4'; ctx.fill(); ctx.fillStyle = '#d9dee8'; ctx.fillRect(X(x0) + S * .08, Y(y1) + S * .1, S * .5, (y1 - y0) * S - S * .2); }   /* a bed and its pillow in every room */
  rect(P.HX0, P.Y_S, P.HX1, P.Y_DOOR, '#3b4350');                                                              /* the hallway: tiles */
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; ctx.beginPath(); for (let gy = 0; gy < 19; gy += .6) { ctx.moveTo(X(P.HX0), Y(gy)); ctx.lineTo(X(P.HX1), Y(gy)); } ctx.moveTo(X(6.7), Y(0)); ctx.lineTo(X(6.7), Y(19)); ctx.stroke();
  ctx.fillStyle = 'rgba(255,214,60,.5)'; for (let gy = .3; gy < 18.6; gy += 1.2) ctx.fillRect(X(6.7) - 1.5, Y(gy + .45), 3, .45 * S);   /* the egress guide dashes */
  rect(D.x0, D.y0, D.x1, D.y1, '#463f5a');                                                                     /* the day room: carpet and a rug round the TV */
  ctx.beginPath(); ctx.ellipse(X(P.TV.x + 1.3), Y(P.TV.y), 5.0 * S, 4.5 * S, 0, 0, 2 * PI); ctx.fillStyle = '#5a4d66'; ctx.fill(); ctx.strokeStyle = 'rgba(255,210,150,.25)'; ctx.lineWidth = Math.max(1.5, S * .05); ctx.stroke();
  /* the chairs the walkers leave behind (a wheelchair user takes the chair with her) */
  for (let i = 0; i < S0.NR; i++) { const a = S0.A[i]; if (a.kind === 'chair') continue; const q = SOUT(); const ang = Math.atan2(P.TV.y - a.y0, P.TV.x - a.x0);
    ctx.save(); ctx.translate(X(a.x0), Y(a.y0)); ctx.rotate(-ang); ctx.scale(S, S); ctx.beginPath(); ctx.roundRect(-.24, -.25, .48, .5, .06); ctx.fillStyle = '#2f4a6a'; ctx.fill(); ctx.lineWidth = .03; ctx.strokeStyle = 'rgba(10,14,24,.9)'; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-.27, -.25, .07, .5, .03); ctx.fillStyle = '#25384f'; ctx.fill(); ctx.restore(); void q; }
  for (const [tx, ty] of [[3.7, 12.0], [4.2, 5.5]]) { ctx.beginPath(); ctx.arc(X(tx), Y(ty), .55 * S, 0, 2 * PI); ctx.fillStyle = '#8a6a4a'; ctx.fill(); ctx.lineWidth = Math.max(1.5, .04 * S); ctx.strokeStyle = TD_OUT; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(X(tx) - .12 * S, Y(ty) - .12 * S, .3 * S, 0, 2 * PI); ctx.fill(); }
  for (const [px, py] of [[5.05, 12.45], [-1.35, 12.45], [-1.35, 4.95], [5.05, 4.95]]) { ctx.fillStyle = '#2f7a46'; ctx.beginPath(); for (let i = 0; i < 12; i++) { const aa = i * PI / 6, rr = i % 2 ? .16 * S : .36 * S; ctx.lineTo(X(px) + Math.cos(aa) * rr, Y(py) + Math.sin(aa) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = TD_OUT; ctx.lineWidth = Math.max(1, .025 * S); ctx.stroke(); }
  ctx.fillStyle = '#4a5368'; ctx.fillRect(X(D.x0) - .02 * S, Y(P.TV.y + 1.2), .36 * S, 2.4 * S);                    /* the TV on the west wall, dead: a bezel and a dark glass */
  ctx.fillStyle = '#0c0f16'; ctx.fillRect(X(D.x0) + .1 * S, Y(P.TV.y + 1.05), .2 * S, 2.1 * S); ctx.fillStyle = 'rgba(120,150,200,.18)'; ctx.fillRect(X(D.x0) + .12 * S, Y(P.TV.y + 1.0), .05 * S, 2.0 * S);
  /* the count stripe across the hallway (hazard hatching) and its two posts */
  { const y0 = P.COUNT_Y - .16, y1 = P.COUNT_Y + .16; ctx.save(); ctx.beginPath(); ctx.rect(X(P.HX0), Y(y1), (P.HX1 - P.HX0) * S, (y1 - y0) * S); ctx.clip(); ctx.fillStyle = '#e6c21c'; ctx.fillRect(X(P.HX0), Y(y1), (P.HX1 - P.HX0) * S, (y1 - y0) * S);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = S * .1; ctx.beginPath(); for (let gx = P.HX0 - .4; gx < P.HX1 + .4; gx += .3) { ctx.moveTo(X(gx), Y(y0)); ctx.lineTo(X(gx + .3), Y(y1)); } ctx.stroke(); ctx.restore(); }
  /* the walls: a dark side face, then the light top (thickness .24 m); the fire door gap is open */
  const wl = (arr, w, col, dx, dy) => { ctx.strokeStyle = col; ctx.lineWidth = w * S; ctx.lineCap = 'butt'; ctx.beginPath(); for (const q of arr) { ctx.moveTo(X(q[0] + dx), Y(q[1] + dy)); ctx.lineTo(X(q[2] + dx), Y(q[3] + dy)); } ctx.stroke(); };
  const parts = [[-3.0, 13, 5.5, 13], [-3.0, 4.4, -3.0, 13], [-1.7, 4.4, -1.7, 13], [-3.0, 13, -3.0, 19], [-.1, 13, -.1, 19], [2.8, 13, 2.8, 19], [-.1, -.8, -.1, 4.4], [2.8, -.8, 2.8, 4.4], [-3.0, 4.4, 5.5, 4.4], [-3.0, -.8, 5.5, -.8], [-3.0, -.8, -3.0, 4.4], [7.9, 3.3, 13.6, 3.3], [7.9, 6.6, 13.6, 6.6], [7.9, 9.9, 13.6, 9.9], [7.9, 13.2, 13.6, 13.2], [7.9, 16.1, 13.6, 16.1], [13.6, 0, 13.6, 19], [7.9, 0, 13.6, 0], [5.5, -.8, 7.9, -.8]];
  wl(parts, .13, '#12151c', .05, -.08); wl(parts, .11, '#6f7a8c', 0, 0);
  wl(S0.WALLS, .3, '#12151c', .06, -.1); wl(S0.WALLS, .24, '#b4bccb', 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; wl(S0.WALLS, .06, '#e6ebf5', 0, .06);
  /* wall strobes: small red boxes on the hallway's east wall and in the day room; they fire with the horn */
  for (const [sx, sy] of [[7.72, 4.2], [7.72, 10.2], [7.72, 15.6], [5.36, 12.4], [5.36, 5.2]]) {
    ctx.beginPath(); ctx.roundRect(X(sx) - .11 * S, Y(sy) - .11 * S, .22 * S, .22 * S, S * .04); ctx.fillStyle = '#b3262a'; ctx.fill(); ctx.strokeStyle = TD_OUT; ctx.lineWidth = Math.max(1, .03 * S); ctx.stroke();
    ctx.beginPath(); ctx.arc(X(sx), Y(sy), .065 * S, 0, 2 * PI); ctx.fillStyle = fl > .1 ? '#fff6e6' : '#c9ced6'; ctx.fill();
    if (fl > .02) { const F = F18(); if (F) F.glow(ctx, { x: X(sx), y: Y(sy), r: 3.2 * S, color: '#ff4a3a', alpha: .5 * fl, core: .2 }); else V2.glow(X(sx), Y(sy), 3.2 * S, '255,74,58', .5 * fl, 'screen', .3); }
  }
  /* the fire door: the leaf swung back (a red bar) beside the gap, the threshold line glowing */
  { const x0 = P.DOOR_X0, x1 = P.DOOR_X1, y = P.Y_DOOR; ctx.strokeStyle = '#12151c'; ctx.lineWidth = .17 * S; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(X(x1 + .02), Y(y)); ctx.lineTo(X(x1 + .02), Y(y + 1.2)); ctx.stroke();
    ctx.strokeStyle = '#e02a2a'; ctx.lineWidth = .12 * S; ctx.beginPath(); ctx.moveTo(X(x1 + .02), Y(y)); ctx.lineTo(X(x1 + .02), Y(y + 1.2)); ctx.stroke();
    const gl = .55 + .25 * fl; ctx.strokeStyle = `rgba(255,70,50,${gl})`; ctx.lineWidth = Math.max(2, .06 * S); ctx.beginPath(); ctx.moveTo(X(x0), Y(y)); ctx.lineTo(X(x1), Y(y)); ctx.stroke();
    const F = F18(); if (F) F.glow(ctx, { x: X((x0 + x1) / 2), y: Y(y), r: 1.7 * S, color: '#ff3b2a', alpha: .42 + .25 * fl, core: .1 }); else V2.glow(X((x0 + x1) / 2), Y(y), 1.7 * S, '255,59,42', .45, 'screen', .3);
    ctx.fillStyle = '#2bd96a'; ctx.beginPath(); ctx.roundRect(X(x0) - .02 * S, Y(y + .55) - .0, (x1 - x0) * S + .04 * S, .16 * S, S * .03); ctx.fill(); }   /* a green EXIT bar on the lintel (outside) */
  /* the assembly point: a painted rectangle with corner marks */
  { const M = P.ASM; ctx.strokeStyle = 'rgba(238,238,240,.8)'; ctx.lineWidth = Math.max(2, .09 * S); ctx.setLineDash([S * .6, S * .35]); ctx.strokeRect(X(M.x0 - .35), Y(M.y1 + .35), (M.x1 - M.x0 + .7) * S, (M.y1 - M.y0 + .7) * S); ctx.setLineDash([]);
    ctx.strokeStyle = '#f6d34a'; ctx.lineWidth = Math.max(3, .14 * S); ctx.lineCap = 'butt'; for (const [qx, qy, sx, sy] of [[M.x0 - .35, M.y0 - .35, 1, 1], [M.x1 + .35, M.y0 - .35, -1, 1], [M.x0 - .35, M.y1 + .35, 1, -1], [M.x1 + .35, M.y1 + .35, -1, -1]]) { ctx.beginPath(); ctx.moveTo(X(qx + sx * .9), Y(qy)); ctx.lineTo(X(qx), Y(qy)); ctx.lineTo(X(qx), Y(qy + sy * .9)); ctx.stroke(); } }
}
/* the plan shot: floor, the crowd (residents under, Strawberries over), the staff at the fire door, the strobe wash, then the labels (last, so nothing covers them) */
function tdStaffAt(lt) {                                               /* where Lemon, Mango and Tomato stand outside the fire door (plan metres) */
  return [['lemon', 8.15, 20.05, -1.45, -1.05], ['mango', 5.25, 20.05, 1.45, -1.05], ['tom', 9.3, 22.0, -2.2, -2.2]];
}
function drawTD(lt) {
  const S0 = SIM();
  if (!S0) { ctx.fillStyle = '#10131a'; ctx.fillRect(0, 0, W, H); return; }
  const id = tdShotAt(lt) || 'plan', v = TDCAM[id](lt), [cx, cy, S] = v, X = x => 540 + (x - cx) * S, Y = y => SYC - (y - cy) * S;
  tdPlan(lt, v, S0);
  const out = S0.at(lt, SOUT()), order = [];
  for (let i = 0; i < S0.N; i++) { const sx = X(out.x[i]), sy = Y(out.y[i]); if (sx < -90 || sx > W + 90 || sy < -90 || sy > H + 90) continue; order.push(i); }
  order.sort((a, b) => (S0.A[a].wave - S0.A[b].wave) || (a - b));
  for (const i of order) tdAgent(S0.A[i], out.x[i], out.y[i], out.hx[i], out.hy[i], S, lt, out.st[i] === 0, X, Y);
  if (lt >= WIN.plan[0] && S0.tauAt(lt) > 20) for (const [n, x, y, hx, hy] of tdStaffAt(lt)) { if (n === 'tom' && lt < 22) continue; tdStaff(n, x, y, hx, hy, S, lt, X, Y); }
  const fl = strobeAt(lt);
  if (fl > .01) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,56,44,${.2 * fl})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  /* labels */
  const lab = (str, x, y, size) => { const m = UI.sizeOf(str, { size, weight: 900, spacing: 3 }), sx = X(x), sy = Y(y); if (sx - m.w / 2 < 70 || sx + m.w / 2 > W - 70 || sy < 290 || sy > 1330) return; UI.label(str, sx, sy, { size, weight: 900, spacing: 3, fill: '#ffffff', stroke: '#0c0f16', lw: 8, alpha: .92 }); };
  lab('DAY ROOM', 1.9, 5.15, 36);
  lab('FIRE DOOR', 3.7, 19.9, 36);
  lab('ASSEMBLY POINT', 6.7, 29.75, 38);
}
// ------------------------------------------------------------------ THE DAY ROOM: a one-point-perspective set of its own; the camera stands behind the semicircle, looking at the TV wall (room coordinates: xr right, y up, zr toward the TV wall)
const RM = { hw: 900, ch: 720, zTV: 1180, rail: 140 };
const LENS = { f: 1100, cz: -850, cy: 360, hy: 720, cx: 0 };
const dP = (xr, y, zr) => V2.p2(xr, y, zr);                                    /* the screen point of a room point */
const dK = zr => V2.P.f / (zr - V2.P.cz);                                        /* the scale at room depth zr */
const dPoly = (pts, fill, stroke, lw) => V2.poly(pts.map(q => V2.p2(q[0], q[1], q[2])), fill, stroke, lw);
const dFace = (x0, x1, y0, y1, zr) => { const a = dP(x0, y1, zr), b = dP(x1, y0, zr); return { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] }; };   /* a rectangle on a facing wall */
const dLeftWall = (y0, y1, z0, z1) => [[-RM.hw, y0, z0], [-RM.hw, y1, z0], [-RM.hw, y1, z1], [-RM.hw, y0, z1]];
const TVB = { cx: 0, x0: -350, x1: 350, y0: 262, y1: 656 };                       /* the TV's screen, on the facing wall */
const DOOR = { x0: 500, x1: 800, y1: 560 };                                      /* the day room's door, in the TV wall at the right */
const WINL = { x0: -890, x1: -650, y0: 190, y1: 540 };                           /* the window in the TV wall, left of the TV */
const TABL = { x: -505, y: 560, w: 190, h: 128 };                                /* the wall tablet (Binder's), between the window and the TV */
/* the light of the moment: warm (the TV, 1 until it is switched off) and the strobe envelope */
const warmAt = lt => 1 - ss(lt, CUE.tvoff, CUE.tvoff + .12);
const FLK = lt => .9 + .06 * Math.sin(lt * 11.3) + .04 * Math.sin(lt * 23.1 + 1.3);   /* the fire's flicker on the room */

function dayShell(lt, warm) {
  const W0 = warm;
  S6.shell({ zb: RM.zTV, hw: RM.hw, ch: RM.ch, rail: RM.rail, wall: '#5a463b', wain: '#34453f', floorA: '#4d3d30', floorB: '#33281f', ceil: '#2b2831', fog: '#120d12', fogAmt: .3, tile: 150, bright: 1 });
  /* the TV wall: a picture, the clock (8:10), a corkboard with notices, the tablet bracket */
  const z = RM.zTV - 3;
  { const q = dFace(-860, -700, 360, 600, z); ctx.fillStyle = '#2a2018'; ctx.fillRect(q.x, q.y, q.w, q.h); const r = dFace(-846, -714, 374, 586, z); ctx.fillStyle = '#3d5a6e'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.fillStyle = '#c9a063'; ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h * .72); ctx.quadraticCurveTo(r.x + r.w * .4, r.y + r.h * .45, r.x + r.w, r.y + r.h * .7); ctx.lineTo(r.x + r.w, r.y + r.h); ctx.lineTo(r.x, r.y + r.h); ctx.fill(); }   /* a framed seascape */
  S6.wallClock(-420, 620, z, 0, 10, 8, 40);
  { const q = dFace(380, 470, 360, 520, z); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.fillStyle = '#d8c9a0'; for (const [a, b] of [[.12, .15], [.5, .12], [.3, .55], [.62, .52]]) ctx.fillRect(q.x + q.w * a, q.y + q.h * b, q.w * .26, q.h * .3); }   /* a corkboard */
  /* the door: a frame in the TV wall, the corridor beyond it (lit, the strobe makes it blaze), a kick plate */
  doorway(lt);
  /* the window on the left wall: night, the strobe's red through the glass */
  windowL(lt);
  /* the console and the TV */
  S6.box3({ x0: -440, x1: 440, y0: 0, y1: 244, z0: RM.zTV - 120, z1: RM.zTV - 30, color: '#3c2b20', top: '#5b4332', side: '#2c1f17', lw: 1.6 });
  for (const sx of [-1, 1]) S6.onZ(RM.zTV - 30, sx * 215 - 150, sx * 215 + 150, 30, 214, '#33251b', 'rgba(10,6,4,.7)', 1.6);
  S6.box3({ x0: TVB.x0 - 34, x1: TVB.x1 + 34, y0: TVB.y0 - 34, y1: TVB.y1 + 34, z0: RM.zTV - 62, z1: RM.zTV - 30, color: '#33363f', top: '#5a5e6a', side: '#1c1e24', edge: 'rgba(0,0,0,.85)', lw: 2.4 });
  { const b = dFace(TVB.x0 - 34, TVB.x1 + 34, TVB.y0 - 34, TVB.y0 - 24, RM.zTV - 30); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(b.x, b.y, b.w, Math.max(1.5, b.h)); const l = dP(TVB.x1 + 12, TVB.y0 - 29, RM.zTV - 30); ctx.fillStyle = warm > .5 ? '#ff4a3a' : '#7a1d18'; ctx.beginPath(); ctx.arc(l[0], l[1], 3.2 * dK(RM.zTV - 30), 0, 2 * PI); ctx.fill(); }
  /* plants in the corners, a lamp on a side table (off) */
  S6.plant3(-780, RM.zTV - 160, 1.25); S6.plant3(840, RM.zTV - 170, 1.35);
  void W0;
}
function doorway(lt) {
  const z = RM.zTV - 3, fl = strobeAt(lt), q = dFace(DOOR.x0, DOOR.x1, 0, DOOR.y1, z), base = lerp(0.18, 1, fl);
  /* the frame */
  const f = dFace(DOOR.x0 - 26, DOOR.x1 + 26, 0, DOOR.y1 + 26, z); ctx.fillStyle = '#2a2420'; ctx.fillRect(f.x, f.y, f.w, f.h);
  /* the corridor: far wall pulsing red-white, a floor going away, a ceiling light strip */
  ctx.save(); ctx.beginPath(); ctx.rect(q.x, q.y, q.w, q.h); ctx.clip();
  ctx.fillStyle = lg(0, q.y, 0, q.y + q.h, [[0, V2.rgba(V2.mix('#3a0e14', '#ffd2c2', fl), 1)], [.55, V2.rgba(V2.mix('#6a1620', '#ffe9dc', fl), 1)], [1, V2.rgba(V2.mix('#2a0c10', '#ffb8a0', fl), 1)]]);
  ctx.fillRect(q.x, q.y, q.w, q.h);
  ctx.fillStyle = `rgba(255,236,228,${.1 + .5 * fl})`; ctx.fillRect(q.x + q.w * .3, q.y + q.h * .12, q.w * .4, q.h * .5);       /* a far door's glass */
  ctx.fillStyle = `rgba(30,6,10,${.55 - .3 * fl})`; ctx.fillRect(q.x, q.y + q.h * .8, q.w, q.h * .2);
  ctx.restore();
  ctx.strokeStyle = '#120f0d'; ctx.lineWidth = Math.max(3, 8 * dK(z)); ctx.strokeRect(q.x, q.y, q.w, q.h);
  /* the leaf, swung back out of the way: its edge a thin slab at the hinge side */
  ctx.fillStyle = '#5b4332'; ctx.fillRect(q.x + q.w - 10 * dK(z), q.y, 10 * dK(z), q.h);
  void base;
}
function windowL(lt) {
  const fl = strobeAt(lt), z = RM.zTV - 3, f = dFace(WINL.x0 - 22, WINL.x1 + 22, WINL.y0 - 22, WINL.y1 + 22, z), q = dFace(WINL.x0, WINL.x1, WINL.y0, WINL.y1, z), k = dK(z);
  ctx.fillStyle = '#2b231d'; ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.fillStyle = lg(0, q.y, 0, q.y + q.h, [[0, V2.rgba(V2.mix('#0e1730', '#ff6a50', fl * .8), 1)], [1, V2.rgba(V2.mix('#1c2a4a', '#ff8a6a', fl * .8), 1)]]); ctx.fillRect(q.x, q.y, q.w, q.h);
  ctx.strokeStyle = '#2b231d'; ctx.lineWidth = Math.max(3, 9 * k); ctx.beginPath(); ctx.moveTo(q.x + q.w / 2, q.y); ctx.lineTo(q.x + q.w / 2, q.y + q.h); ctx.moveTo(q.x, q.y + q.h * .42); ctx.lineTo(q.x + q.w, q.y + q.h * .42); ctx.stroke();
  ctx.fillStyle = '#3b2d22'; ctx.fillRect(f.x - 6 * k, f.y + f.h, f.w + 12 * k, 14 * k);                                                    /* the sill */
  /* the red through the glass falls on the wall around it */
  if (fl > .01) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const c = dP((WINL.x0 + WINL.x1) / 2, 380, z); const F = F18(); if (F) F.glow(ctx, { x: c[0], y: c[1], r: 420 * k, color: '#ff4a3a', alpha: .45 * fl, core: .1 }); ctx.restore(); }
}
/*@@PART6@@*/

// ------------------------------------------------------------------ the armchairs (a cushion, two arms, a high back that hides the sitter's hips), the rug, the tea
const CHS = { seat: 112, pad: 26, hw: 84, hd: 70, backY: 214, armY: 190, aw: 20 };
function armchair(xr, zr, layer, col) {
  const c = col || '#7a3b3b', top = S6.lit(c, 1.22), side = S6.lit(c, .6), edge = 'rgba(12,6,8,.72)', x0 = xr - CHS.hw - 2, x1 = xr + CHS.hw + 2, zf = zr - CHS.hd, k = dK(zf);
  if (layer === 'seat') {                                           /* behind the sitter: the arms (their tops show beside the back) and the feet */
    for (const sx of [-1, 1]) {
      S6.box3({ x0: sx > 0 ? xr + CHS.hw - 4 : xr - CHS.hw - CHS.aw - 6, x1: sx > 0 ? xr + CHS.hw + CHS.aw + 6 : xr - CHS.hw + 4, y0: 16, y1: CHS.armY, z0: zr - CHS.hd, z1: zr + CHS.hd, color: S6.lit(c, .9), top: S6.lit(c, 1.3), side, edge, lw: 1.6 });
      S6.box3({ x0: xr + sx * (CHS.hw + CHS.aw - 14) - 9, x1: xr + sx * (CHS.hw + CHS.aw - 14) + 9, y0: 0, y1: 20, z0: zf + 6, z1: zf + 30, color: '#2a1c12', lw: 1 });
    }
    return;
  }
  /* the back, seen from behind: one tall upholstered panel with a rounded top, a top band, piping and buttons */
  const A = dP(x0, 16, zf), B = dP(x1, 16, zf), C = dP(x1, CHS.backY, zf), D = dP(x0, CHS.backY, zf), E = dP(x1, CHS.backY, zf + 34), F = dP(x0, CHS.backY, zf + 34), r = 26 * k;
  if (V2.P.cx < x0) { const G = dP(x0, 16, zf + 34); V2.poly([A, D, F, G], side, edge, 1.6); } else if (V2.P.cx > x1) { const G = dP(x1, 16, zf + 34); V2.poly([B, C, E, G], side, edge, 1.6); }
  ctx.beginPath(); ctx.moveTo(D[0], D[1] + r); ctx.quadraticCurveTo(D[0], D[1] - r * .3, D[0] + r, D[1] - r * .35); ctx.lineTo(F[0] + r, F[1] - r * .1); ctx.lineTo(E[0] - r, E[1] - r * .1); ctx.lineTo(C[0] - r, C[1] - r * .35); ctx.quadraticCurveTo(C[0], C[1] - r * .3, C[0], C[1] + r); ctx.closePath(); ctx.fillStyle = top; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1] + r); ctx.quadraticCurveTo(C[0], C[1] - r * .3, C[0] - r, C[1] - r * .35); ctx.lineTo(D[0] + r, D[1] - r * .35); ctx.quadraticCurveTo(D[0], D[1] - r * .3, D[0], D[1] + r); ctx.closePath();
  ctx.fillStyle = lg(0, D[1], 0, A[1], [[0, S6.lit(c, 1.05)], [1, S6.lit(c, .78)]]); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = Math.max(1, 2.4 * k); ctx.beginPath(); ctx.moveTo((A[0] + B[0]) / 2, A[1] - 4 * k); ctx.lineTo((D[0] + C[0]) / 2, D[1] + 8 * k); ctx.stroke();
  ctx.fillStyle = S6.lit(c, .5); for (const f of [.3, .7]) for (const g of [.28, .55, .8]) { const px = lerp(A[0], B[0], f), py = lerp(A[1], D[1] + r, g); ctx.beginPath(); ctx.arc(px, py, Math.max(1.5, 3.4 * k), 0, 2 * PI); ctx.fill(); }
}
function rugDay() {
  const cx = 0, cz = 560, rx = 760, rz = 520, N = 28, pts = [], pts2 = [];
  for (let i = 0; i < N; i++) { const a = i / N * 2 * PI; pts.push([cx + Math.cos(a) * rx, 0, cz + Math.sin(a) * rz]); pts2.push([cx + Math.cos(a) * (rx - 70), 0, cz + Math.sin(a) * (rz - 60)]); }
  dPoly(pts, '#5a3a3a', 'rgba(10,6,6,.5)', 1.6); dPoly(pts2, '#3d4a63');
  ctx.save(); ctx.globalAlpha *= .5; dPoly(pts2.map(q => [q[0] * .74 + cx * .26, 0, (q[2] - cz) * .74 + cz]), null, 'rgba(255,220,160,.5)', 2); ctx.restore();
}
/* a cup of tea on an armrest (seen from behind and above) */
function teaCup(xr, zr, y) {
  const [x, yy] = dP(xr, y, zr), k = dK(zr);
  ctx.save(); ctx.translate(x, yy); ctx.scale(k, k);
  ctx.fillStyle = '#ece6d8'; ctx.strokeStyle = 'rgba(20,12,8,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 4, 34, 11, 0, 0, 2 * PI); ctx.fill(); ctx.stroke();       /* the saucer */
  ctx.beginPath(); ctx.moveTo(-17, -26); ctx.lineTo(17, -26); ctx.lineTo(13, 4); ctx.lineTo(-13, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a3a18'; ctx.beginPath(); ctx.ellipse(0, -26, 17, 5, 0, 0, 2 * PI); ctx.fill();
  ctx.strokeStyle = 'rgba(20,12,8,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(19, -14, 7, -1.2, 1.3); ctx.stroke();
  ctx.restore();
}
/* the remote on the arm of a chair: a flat black bar with a red button, drawn on the armrest (its box is the pickup point; `lift` 1 = taken) */
function remoteOnArm(lt, xr, zr, lift) {
  if (lift >= 1) return;
  const y = CHS.armY + 2, z0 = zr - 46, z1 = zr + 46, x0 = xr - 11, x1 = xr + 11;
  dPoly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], '#15161b', 'rgba(0,0,0,.9)', 1.4);
  const [bx, by] = dP(xr, y + 1, z1 - 14); ctx.fillStyle = '#e8403a'; ctx.beginPath(); ctx.arc(bx, by, 4.5 * dK(zr), 0, 2 * PI); ctx.fill();
}

// ------------------------------------------------------------------ the TV: the Yule log, the switch-off (the picture squeezes to a line, then to a dot that glows and goes)
function yuleLog(lt, q, power) {
  const sc = q.w / 700, bx = q.x + q.w / 2, by = q.y + q.h, F = F18();
  ctx.fillStyle = lg(0, q.y, 0, q.y + q.h, [[0, '#0b0605'], [1, '#1c0d08']]); ctx.fillRect(q.x, q.y, q.w, q.h);                    /* the video: a dark room behind the logs */
  ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let y = q.y; y < q.y + q.h; y += 5) ctx.fillRect(q.x, y, q.w, 1.4);                    /* scan lines: it is a video */
  ctx.fillStyle = '#2a1408'; ctx.fillRect(q.x, by - 62 * sc, q.w, 62 * sc);                                                          /* the hearth stone under the logs */
  if (F) F.flame(ctx, { x: bx, y: by - 64 * sc, w: 440 * sc, h: 320 * sc, t: lt, seed: 7, power, kind: 'log' });
  else { ctx.fillStyle = `rgba(255,${140 + 60 * Math.sin(lt * 9)},40,${.8 * power})`; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(bx + (i - 2) * 50 * sc, by - 120 * sc, 26 * sc, 90 * sc * power, 0, 0, 2 * PI); ctx.fill(); } }
  ctx.fillStyle = '#4a2a14'; ctx.strokeStyle = '#1a0c06'; ctx.lineWidth = Math.max(1.5, 4 * sc);                                 /* the logs, in front of the flame */
  for (const [dx, dy, w, h, a] of [[-70, -44, 340, 56, -.04], [70, -32, 310, 52, .05], [0, -84, 260, 46, 0]]) { ctx.save(); ctx.translate(bx + dx * sc, by + dy * sc); ctx.rotate(a); ctx.beginPath(); ctx.roundRect(-w * sc / 2, -h * sc / 2, w * sc, h * sc, h * sc / 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a5a30'; ctx.beginPath(); ctx.ellipse(w * sc / 2 - 14 * sc, 0, 12 * sc, h * sc / 2 - 3 * sc, 0, 0, 2 * PI); ctx.fill(); ctx.fillStyle = '#4a2a14'; ctx.restore(); }
  if (F && power > .2) F.embers(ctx, { x: bx, y: by - 110 * sc, w: 220 * sc, t: lt, seed: 3, count: 12, rise: 200 * sc });
  ctx.fillStyle = 'rgba(255,170,70,.08)'; ctx.fillRect(q.x, q.y, q.w, q.h);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(q.x, q.y, q.w, 22 * sc); ctx.fillRect(q.x, q.y + q.h - 22 * sc, q.w, 22 * sc);   /* letterbox bars */
}
function tvScreen(lt) {
  const q = dFace(TVB.x0, TVB.x1, TVB.y0, TVB.y1, RM.zTV - 30), u = lt - CUE.tvoff, cx = q.x + q.w / 2, cy = q.y + q.h / 2;
  ctx.save(); ctx.fillStyle = '#040405'; ctx.fillRect(q.x, q.y, q.w, q.h);
  if (u < .14) {
    const hs = u < 0 ? 1 : Math.max(.012, 1 - ss(u, 0, .07)), ws = u < .07 ? 1 : Math.max(.012, 1 - ss(u, .07, .14)), w = q.w * ws, h = q.h * hs;
    ctx.beginPath(); ctx.rect(cx - w / 2, cy - h / 2, w, h); ctx.clip();
    yuleLog(lt, q, u < 0 ? 1 : Math.max(0, 1 - u / .1));
    if (u > 0) { ctx.fillStyle = `rgba(255,248,236,${.85 * ss(u, 0, .12)})`; ctx.fillRect(cx - w / 2, cy - h / 2, w, h); }
  }
  ctx.restore();
  if (u >= .1) {                                                                                       /* the dot: bright, then it glows out */
    const a = 1 - ss(u, .3, .95), r = (5 + 16 * (1 - ss(u, .12, .6))) * dK(RM.zTV - 30) * 1.9;
    if (a > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const F = F18(); if (F) F.glow(ctx, { x: cx, y: cy, r: r * 7, color: '#d8e8ff', alpha: .5 * a, core: .6 }); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(cx, cy, r * .55, 0, 2 * PI); ctx.fill(); ctx.restore(); }
  }
  if (u > .3) { const fl = strobeAt(lt); if (fl > .02) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,70,60,${.12 * fl})`; ctx.beginPath(); ctx.moveTo(q.x, q.y + q.h * .1); ctx.lineTo(q.x + q.w * .55, q.y); ctx.lineTo(q.x + q.w * .3, q.y + q.h); ctx.lineTo(q.x, q.y + q.h); ctx.fill(); ctx.restore(); } }
  return q;
}
/*@@PART7@@*/

// ------------------------------------------------------------------ light on the set (additive, before the characters): the TV's warm light, the strobe through the door and the window
function dayLights(lt) {
  const warm = warmAt(lt), fl = strobeAt(lt), F = F18(), flk = FLK(lt), tk = dK(RM.zTV - 30), tvc = dP(0, 460, RM.zTV - 30);
  const glw = (x, y, r, col, a, core) => { if (a <= .003) return; if (F) F.glow(ctx, { x, y, r, color: col, alpha: a, core: core || 0 }); else V2.glow(x, y, r, V2.rgb(col).join(','), Math.min(1, a), 'screen', .3); };
  if (warm > .01) {
    glw(tvc[0], tvc[1], 1250 * tk, '#ff8f3a', .5 * warm * flk, .08);
    const zc = RM.zTV - 380, c = dP(0, 0, zc), rx = Math.abs(dP(780, 0, zc)[0] - c[0]), ry = Math.abs(dP(0, 0, zc - 320)[1] - dP(0, 0, zc + 320)[1]) / 2;
    if (F && F.pool) F.pool(ctx, { x: c[0], y: c[1], rx, ry, color: '#ff8a30', alpha: .4 * warm * flk });
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    dPoly(dLeftWall(0, RM.ch, 250, RM.zTV), lg(...dP(-RM.hw, 400, 250), ...dP(-RM.hw, 400, RM.zTV), [[0, 'rgba(255,140,60,0)'], [1, `rgba(255,140,60,${.14 * warm * flk})`]]));
    ctx.restore();
  }
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  /* the corridor's light through the door: a red-white fan on the floor, strongest on the strobe */
  const a = .05 + .3 * fl;
  dPoly([[DOOR.x0 + 20, 0, RM.zTV - 8], [DOOR.x1 - 20, 0, RM.zTV - 8], [DOOR.x1 - 330, 0, RM.zTV - 760], [DOOR.x0 - 560, 0, RM.zTV - 700]], lg(...dP(650, 0, RM.zTV), ...dP(150, 0, RM.zTV - 700), [[0, `rgba(255,96,76,${a})`], [1, 'rgba(255,60,50,0)']]));
  dPoly([[RM.hw, 0, RM.zTV - 700], [RM.hw, RM.ch, RM.zTV - 700], [RM.hw, RM.ch, RM.zTV], [RM.hw, 0, RM.zTV]], lg(...dP(RM.hw, 300, RM.zTV), ...dP(RM.hw, 300, RM.zTV - 700), [[0, `rgba(255,86,70,${.14 * fl})`], [1, 'rgba(255,60,50,0)']]));
  /* the window's red on the floor in front of it */
  if (fl > .01) dPoly([[WINL.x0, 0, RM.zTV - 8], [WINL.x1, 0, RM.zTV - 8], [WINL.x1 + 220, 0, RM.zTV - 700], [WINL.x0 - 220, 0, RM.zTV - 700]], lg(...dP(-770, 0, RM.zTV), ...dP(-770, 0, RM.zTV - 700), [[0, `rgba(255,70,60,${.32 * fl})`], [1, 'rgba(255,70,60,0)']]));
  ctx.restore();
  const dc = dP(650, 300, RM.zTV);
  glw(dc[0], dc[1], 520 * tk, '#ff5a46', (.06 + .34 * fl), .2);
}

// ------------------------------------------------------------------ the cast of the day room: residents seen from behind in two rows, Lemon in the doorway, Strawberry in the aisle
const ROW1 = [[-440, 420], [-220, 350], [0, 320], [220, 350], [440, 420]], ROW2 = [[-330, 690], [-110, 640], [110, 640], [330, 690]];
const CHCOL = ['#7a3b3b', '#3b5a6e', '#6a5a3a', '#4a6a4a', '#6a3b6a', '#5a4a6e'];
const RES = [
  { id: 'kiwi1', row: 1, i: 0, kind: 'kiwi', acc: ['bouffant'], sc: .92, seed: 3 },
  { id: 'cran', row: 1, i: 1, ctor: A7.cran, sc: .92 },
  { id: 'banana', row: 1, i: 2, ctor: A7.banana, sc: .94, acc: ['glasses'] },
  { id: 'pear', row: 1, i: 3, ctor: A7.pear, sc: .92 },
  { id: 'grape1', row: 1, i: 4, kind: 'grape', acc: ['nightcap'], sc: .92, seed: 9 },
  { id: 'fig1', row: 2, i: 0, kind: 'fig', acc: ['bun'], sc: .92, seed: 5 },
  { id: 'prune1', row: 2, i: 1, kind: 'prune', acc: ['curlers'], sc: .92, seed: 6 },
  { id: 'coco1', row: 2, i: 2, kind: 'coco', acc: ['bouffant'], sc: .92, seed: 8 },
  { id: 'apple1', row: 2, i: 3, kind: 'apple', acc: ['nightcap'], sc: .92, seed: 4 },
];
const seatOf = r => (r.row === 1 ? ROW1 : ROW2)[r.i];
/* the heads: a quarter turn toward the door on "We are watching the fire." (all at once), a turn toward Strawberry on "Boo." (Cranberry first, the others half a second later) */
function headTurn(r, lt) {
  const t1 = wS('r1', 0), t2 = LN.r2.s - START, d2 = r.id === 'cran' ? 0 : .5 + .08 * (r.i % 3 + r.row);
  const a = ss(lt, t1 - .06, t1 + .22) * (1 - ss(lt, bE('r1') + .1, bE('r1') + .6)), b = ss(lt, t2 + d2 - .1, t2 + d2 + .22) * (1 - ss(lt, t2 + d2 + .9, t2 + d2 + 1.6));
  return -1.25 * a - 1.1 * b * (r.i < 3 ? 1 : .0) - 0.9 * b * (r.i >= 3 ? 1 : 0);      /* yaw is PI + this: toward screen right first (the door), then toward the aisle */
}
function resOpts(r, lt, o2) {
  const [xr, zr] = seatOf(r), q = V2.at(xr, zr), yS = V2.p2(xr, CHS.seat + CHS.pad - 8, zr)[1];
  const base = r.ctor ? r.ctor({}) : { kind: r.kind, id: r.id, who: 'rall', acc: r.acc || [], expr: 'neutral', seed: r.seed || 11 };
  const sp = lt >= bS('c1') && lt < bE('c1') + .3 && r.id === 'banana', ch = (lt >= LN.r1.s - START - .1 && lt < LN.r1.e - START + .2) || (lt >= LN.r2.s - START - .1 && lt < LN.r2.e - START + .2);
  const o = Object.assign(base, { x: q.x, y: yS, s: q.s * (r.sc || .8), noLegs: true, noShadow: true, noReflect: true, plant: true, t: lt, yaw: PI, arms: { l: 'rest', r: 'rest' }, expr: 'dead', lid: .5, look: [0, .05], who: sp && !ch ? 'banana' : 'rall' }, o2);
  const ht = headTurn(r, lt); o.headYaw = PI + ht; if (ht < -.05) { o.look = [.8, .05]; o.expr = 'dead'; }
  return o;
}
function drawRes(r, lt, o2) { drawChar(resOpts(r, lt, o2)); }
function rowLayer(row, layer, lt, ids) {
  const arr = row === 1 ? ROW1 : ROW2;
  for (let i = 0; i < arr.length; i++) { const r = RES.find(x => x.row === row && x.i === i); if (ids && ids.indexOf(r.id) < 0) continue; armchair(arr[i][0], arr[i][1], layer, CHCOL[(i + row * 2) % CHCOL.length]); if (layer === 'seat' && row === 1 && (i === 0 || i === 3)) teaCup(arr[i][0] + (i === 0 ? -CHS.hw - 10 : CHS.hw + 10), arr[i][1], CHS.armY + 4); }
}
/*@@PART8@@*/

/* Lemon in the doorway: steps out of the corridor's glare at 1.5, waves the clipboard on "Everyone up!", points at the TV on "That is a video of a fire." */
function lemonDoor(lt, zoomed) {
  const q = V2.at((DOOR.x0 + DOOR.x1) / 2, RM.zTV - 70), enter = ss(lt, 1.3, 1.9), sc = .98;
  const wv = ss(lt, 1.62, 1.8) * (1 - ss(lt, 2.5, 2.7)), wv2 = ss(lt, 2.66, 2.8) * (1 - ss(lt, 3.7, 3.95)), pt = ss(lt, wS('l2', 3) - .18, wS('l2', 3) + .06) * (1 - ss(lt, bE('l2') - .05, bE('l2') + .3));
  const wave = wv * Math.sin((lt - 1.62) * 17) + wv2 * Math.sin((lt - 2.66) * 12) * .6;
  const o = A7.lemon({ x: q.x + (1 - enter) * 150 * q.s, y: q.y, s: q.s * sc, t: lt, yaw: .12 - .35 * pt, headYaw: .1, expr: wv > .3 || wv2 > .3 ? 'shock' : pt > .3 ? 'sour' : 'neutral', look: [-.5, .05], transit: lt < 1.9,
    hold: { l: 'clipboard6' }, arms: { l: 'hold', r: pt > .2 ? 'point' : wv > .1 ? 'up' : 'rest' }, grip: { l: [-100 - 14 * wave, 20 - 90 * Math.max(wv, wv2 * .8) + 8 * wave] }, clipText: '' });
  return o;
}
/*@@PART9@@*/

// ------------------------------------------------------------------ props and accessories of the day room: the remote (a click flash at its tip), Banana's specs that hold the flame
if (typeof EXT !== 'undefined' && EXT.prop && typeof PROP_BOX !== 'undefined') {
  EXT.prop.fp18e_remote = (side, o, t) => {
    ctx.save(); ctx.rotate(o.remoteAng ?? -1.2); ctx.scale(1.35, 1.35); ctx.lineJoin = 'round';
    ctx.fillStyle = '#15161b'; ctx.strokeStyle = 'rgba(0,0,0,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-11, -64, 22, 84, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8403a'; ctx.beginPath(); ctx.arc(0, -50, 6, 0, 2 * PI); ctx.fill();
    ctx.fillStyle = '#5a6070'; for (const [bx, by] of [[-5, -32], [5, -32], [-5, -20], [5, -20], [-5, -8], [5, -8]]) { ctx.beginPath(); ctx.arc(bx, by, 3.2, 0, 2 * PI); ctx.fill(); }
    const u = (o.t ?? 0) - CUE.click;
    if (u >= 0 && u < .16) { const a = 1 - u / .16; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,236,190,${.95 * a})`; ctx.beginPath(); ctx.arc(0, -68, 7 + 22 * (1 - a), 0, 2 * PI); ctx.fill(); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 4; i++) { const aa = i * PI / 4; ctx.moveTo(Math.cos(aa) * 10, -68 + Math.sin(aa) * 10); ctx.lineTo(Math.cos(aa) * 36 * (1.2 - a * .4), -68 + Math.sin(aa) * 36 * (1.2 - a * .4)); ctx.moveTo(-Math.cos(aa) * 10, -68 - Math.sin(aa) * 10); ctx.lineTo(-Math.cos(aa) * 36 * (1.2 - a * .4), -68 - Math.sin(aa) * 36 * (1.2 - a * .4)); } ctx.stroke(); ctx.restore(); }
    ctx.restore();
  };
  PROP_BOX.fp18e_remote = [-40, -90, 40, 24];
  EXT.acc.fp18e_specs = (o, k, t, layer) => {
    if (layer !== 'front') return;
    const ex = k.eyeX, ey = k.eyeY, er = k.er, fr = o.flameRefl ?? 0;
    ctx.strokeStyle = '#2a2a35'; ctx.lineWidth = 5; ctx.fillStyle = 'rgba(200,225,255,.14)';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.roundRect(sx * ex - er * 1.3, ey - er * 1.15, er * 2.6, er * 2.3, 14); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-ex + er * 1.3, ey - er * .2); ctx.lineTo(ex - er * 1.3, ey - er * .2); ctx.stroke();
    if (fr > .02) for (const sx of [-1, 1]) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(sx * ex - er * 1.3, ey - er * 1.15, er * 2.6, er * 2.3, 14); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { const fx0 = sx * ex + (i - 1) * er * .62 + 2 * Math.sin(t * 9 + i * 2), h = er * (1.1 + .5 * Math.sin(t * 11 + i * 1.7 + sx)), by = ey + er * .8; ctx.fillStyle = `rgba(255,${150 + 40 * i},40,${.8 * fr})`; ctx.beginPath(); ctx.moveTo(fx0 - er * .32, by); ctx.quadraticCurveTo(fx0 - er * .2, by - h * .6, fx0, by - h); ctx.quadraticCurveTo(fx0 + er * .2, by - h * .6, fx0 + er * .32, by); ctx.fill(); }
      ctx.fillStyle = `rgba(255,255,255,${.55 * fr})`; ctx.beginPath(); ctx.ellipse(sx * ex - er * .5, ey - er * .6, er * .22, er * .12, -.5, 0, 2 * PI); ctx.fill(); ctx.restore();
    }
  };
  if (typeof V2C !== 'undefined' && V2C.ACC_CLS) V2C.ACC_CLS.fp18e_specs = 'face';
}

// ------------------------------------------------------------------ Strawberry in the aisle at the right of the audience (profile, facing the TV): takes the remote from the arm of the chair, raises it, points, clicks
function strawDay(lt) {
  const xr = 640, zr = 400, q = V2.at(xr, zr), reach = ss(lt, 9.2, 9.5) * (1 - ss(lt, 9.5, 9.95)), has = lt >= 9.52, aim = ss(lt, 9.95, 10.25);
  const sp = lt >= bS('s1') && lt < bE('s1') + .2;
  const gx = lerp(lerp(-40, -150, reach), -185, aim), gy = lerp(lerp(40, 110, reach), -70, aim);
  const o = A11.straw({ x: q.x, y: q.y, s: q.s * .84, t: lt, yaw: -PI / 2 + .3, headYaw: -PI / 2 + .55, expr: 'dead', lid: .5, look: [-.7, -.05], who: sp ? 'straw' : undefined,
    arms: { l: 'rest', r: 'hold' }, grip: { r: [gx, gy] }, hold: has ? { r: 'fp18e_remote' } : undefined, remoteAng: lerp(-PI / 2 - .35, -PI / 2 - 1.0, aim) });
  if (!has) { o.hold = undefined; o.hand = { r: reach > .3 ? 'open' : 'open' }; }
  return o;
}
/* Banana, close, lit by the flame he is watching (the camera is at the TV): the flame in his glasses */
function bananaClose(lt) {
  const t0 = bS('c1'), nod = Math.sin(PI * sg(lt, wS('c1', 3) - .1, wS('c1', 3) + .3)) * .5, drift = ss(lt, bE('c1') + .05, bE('c1') + .6);
  return A7.banana({ x: 540, y: 1330, s: 3.0, t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true, yaw: .3 - .12 * drift, headYaw: .22 - .16 * drift + .04 * nod, expr: 'neutral', lid: .38 - .1 * Math.sin(PI * sg(lt, t0 + .1, t0 + .5)), look: [-.1 - .5 * drift, -.05], who: 'banana',
    acc: ['fp18e_specs', 'cardigan'], cardColor: '#7a5a34', flameRefl: .95 * FLK(lt), arms: { l: 'rest', r: 'rest' }, browUp: 2 + 3 * nod });
}
function drawBananaCU(lt) {
  const flk = FLK(lt), fl = strobeAt(lt);
  ctx.fillStyle = lg(0, 0, 0, H, [[0, '#0e0a0e'], [1, '#1a100c']]); ctx.fillRect(0, 0, W, H);
  /* the room behind him, out of focus: bokeh of the door's red and the lamp, the chair back */
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) { const x = 90 + sr(i, 1) * 900, y = 250 + sr(i, 2) * 700, r = 40 + sr(i, 3) * 90, red = i % 3 === 0; ctx.fillStyle = red ? `rgba(255,60,50,${.05 + .22 * fl})` : `rgba(255,150,60,${.07 + .05 * flk})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * PI); ctx.fill(); }
  ctx.restore();
  V2.dof(0, () => {});
  const cx = 540;
  ctx.fillStyle = '#4a2a2a'; ctx.beginPath(); ctx.roundRect(cx - 420, 420, 840, 1200, [200, 200, 20, 20]); ctx.fill();                                    /* the chair back behind him */
  ctx.fillStyle = 'rgba(0,0,0,.25)'; for (const f of [.2, .8]) for (const g of [.25, .5, .75]) { ctx.beginPath(); ctx.arc(cx - 420 + 840 * f, 420 + 1200 * g, 10, 0, 2 * PI); ctx.fill(); }
  V2.setLight({ key: [0, .05], keyColor: '#ffb264', keyA: .55 * flk, rim: '#ff3a2a', rimA: .15 + .5 * fl, shadow: '#150a10', shadowA: .5, bounce: '#ff9a50', bounceA: .2, amb: '#2a2030', ambA: .35 });
  V2.addLight({ x: 540, y: 820, r: 1000, color: '255,150,60', a: .75 * flk });
  if (fl > .02) V2.addLight({ x: 1040, y: 700, r: 1200, color: '255,64,54', a: .8 * fl });
  drawChar(bananaClose(lt));
  const F = F18(); if (F) F.glow(ctx, { x: 540, y: 1250, r: 700, color: '#ff9440', alpha: .3 * flk });
}
/*@@PART11@@*/

// ------------------------------------------------------------------ THE FIRE DOOR OUTSIDE (night): a flat elevation of the building's north wall, the open fire door with the pulsing corridor behind it, the EXIT sign, a wall strobe,
// the paved patio, the ASSEMBLY POINT sign. World units = pixels at zoom 1; the cast stands on the patio (floor line OUT.fl).
const OUT = { fl: 1230, dx: 800, dw: 320, dh: 520 };
const SPRS = new Map();
function strawSprite(open) {          /* a Strawberry from the front with a med cup, cached once (drawn through the engine, text-free) */
  const key = open ? 1 : 0; let sp = SPRS.get(key); if (sp) return sp;
  const cv = document.createElement('canvas'); cv.width = 300; cv.height = 340; cv.__txOK = true;
  const g = cv.getContext('2d'), prev = ctx; ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 300, 340); REG.suppress++;
  try { drawChar(Object.assign((A11 || A7).straw({ x: 150, y: 328, s: .78, t: 0, noBob: true, noShadow: true, noReflect: true, who: undefined, talk: open ? .8 : 0, expr: 'dead', lid: .5, look: [0, .08], arms: { l: 'rest', r: 'hold' }, grip: { r: [70, 24] }, hold: { r: 'fp18e_medcup' } }))); } finally { REG.suppress--; ctx = prev; }
  SPRS.set(key, cv); return cv;
}
if (typeof EXT !== 'undefined' && EXT.prop && typeof PROP_BOX !== 'undefined') {
  EXT.prop.fp18e_medcup = (side, o, t) => { ctx.fillStyle = '#f4f7fb'; ctx.strokeStyle = 'rgba(20,12,30,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-20, -34); ctx.lineTo(20, -34); ctx.lineTo(15, 6); ctx.lineTo(-15, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffcf5a'; ctx.beginPath(); ctx.arc(0, -36, 6, 0, 2 * PI); ctx.fill(); };
  PROP_BOX.fp18e_medcup = [-24, -48, 24, 10];
  EXT.prop.fp18e_clip = (side, o, t) => {                                                       /* Lemon's clipboard with a column of boxes and a tick that draws itself */
    ctx.save(); ctx.rotate(side * -.1); ctx.scale(side, 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#b8864a'; ctx.strokeStyle = 'rgba(20,12,30,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-4, -140, 96, 134, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(4, -126, 80, 104); ctx.fillStyle = '#9aa0a6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(24, -148, 40, 18, 5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(30, -104 + i * 18); ctx.lineTo(76, -104 + i * 18); ctx.stroke(); ctx.strokeRect(10, -112 + i * 18, 12, 12); }
    const k = o.tick ?? 0; if (k > 0) { ctx.strokeStyle = '#1e9e55'; ctx.lineWidth = 7; ctx.beginPath(); const pts = [[8, -52], [18, -38], [46, -92]]; ctx.moveTo(pts[0][0], pts[0][1]); const a = Math.min(1, k * 2), b = Math.max(0, k * 2 - 1); ctx.lineTo(lerp(pts[0][0], pts[1][0], a), lerp(pts[0][1], pts[1][1], a)); if (b > 0) ctx.lineTo(lerp(pts[1][0], pts[2][0], b), lerp(pts[1][1], pts[2][1], b)); ctx.stroke(); }
    ctx.restore();
  };
  PROP_BOX.fp18e_clip = [-12, -152, 100, 4];
}
/* what is seen through the doorway: the corridor in one-point perspective, pulsing red and white with the strobe, the crowd of Strawberries packed in it (`crowd` 0..1) */
function corridorBeyond(lt, crowd) {
  return (g, r) => {
    const fl = strobeAt(lt), cx = (r.x0 + r.x1) / 2, w = r.x1 - r.x0, h = r.y1 - r.y0, fw = w * .22, fh = h * .3, fy = r.y0 + h * .5 - fh / 2, fx = cx - fw / 2, mixc = (a, b) => V2.rgba(V2.mix(a, b, fl), 1);
    g.fillStyle = mixc('#2a0a10', '#ffd8cc'); g.fillRect(r.x0, r.y0, w, h);
    g.fillStyle = mixc('#4a141c', '#ffb8a8'); g.beginPath(); g.moveTo(r.x0, r.y0); g.lineTo(fx, fy); g.lineTo(fx, fy + fh); g.lineTo(r.x0, r.y1); g.fill();            /* left wall */
    g.fillStyle = mixc('#3a1018', '#ffc8b8'); g.beginPath(); g.moveTo(r.x1, r.y0); g.lineTo(fx + fw, fy); g.lineTo(fx + fw, fy + fh); g.lineTo(r.x1, r.y1); g.fill();   /* right wall */
    g.fillStyle = mixc('#1a0608', '#ff9a88'); g.beginPath(); g.moveTo(r.x0, r.y0); g.lineTo(r.x1, r.y0); g.lineTo(fx + fw, fy); g.lineTo(fx, fy); g.fill();                  /* ceiling */
    g.fillStyle = mixc('#2e0c12', '#ffb8a4'); g.beginPath(); g.moveTo(r.x0, r.y1); g.lineTo(r.x1, r.y1); g.lineTo(fx + fw, fy + fh); g.lineTo(fx, fy + fh); g.fill();      /* floor */
    g.fillStyle = mixc('#5a1a22', '#fff4ec'); g.fillRect(fx, fy, fw, fh);                                                                                                      /* the far end */
    g.fillStyle = `rgba(255,240,230,${.35 + .5 * fl})`; for (let i = 0; i < 4; i++) { const u = (i + .6) / 4.4, yy = lerp(r.y0 + 6, fy + 4, u * u), ww = lerp(w * .3, fw * .3, u * u); g.fillRect(cx - ww / 2, yy, ww, lerp(14, 3, u)); }      /* the ceiling light strips */
    if (crowd > 0.02) {
      const sp = strawSprite(0), N = Math.round(crowd * 36), rows = [[.98, 4, 1.0], [.74, 5, .78], [.54, 6, .6], [.4, 6, .48], [.3, 7, .38]];
      let n = 0;
      for (let ri = rows.length - 1; ri >= 0; ri--) { const [u, cnt, sc] = rows[ri]; for (let i = 0; i < cnt && n < N; i++, n++) {
        const xx = cx + (i - (cnt - 1) / 2) * (w * .22 * sc) * 1.12 + (sr(n, 3) - .5) * 8, yy = lerp(fy + fh, r.y1 + 40, Math.pow(u, 1.6)) + (sr(n, 4) - .5) * 6, ss0 = sc * .62 * (1 + .015 * Math.sin(lt * 2.4 + n));
        g.save(); g.globalAlpha *= .94; g.drawImage(sp, xx - 150 * ss0, yy - 328 * ss0, 300 * ss0, 340 * ss0); g.restore(); } }
      g.fillStyle = `rgba(30,6,10,${.35 - .2 * fl})`; g.fillRect(r.x0, r.y0, w, h);
    }
  };
}
function outsideWorld(lt, sh) {
  const fl = strobeAt(lt), F = F18(), fk = OUT.fl, dx = OUT.dx;
  setOutLight(lt);
  /* the sky, the roofline, the wall, the patio */
  ctx.fillStyle = lg(0, -300, 0, fk, [[0, '#05101c'], [.55, '#0c1a2c'], [1, '#162638']]); ctx.fillRect(-600, -400, W + 1800, fk + 500);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 26; i++) ctx.fillRect(-300 + sr(i, 1) * 2000, 80 + sr(i, 2) * 260, 2.5, 2.5);
  const wy = 330;
  ctx.fillStyle = lg(0, wy, 0, fk, [[0, '#26323f'], [1, '#1c2631']]); ctx.fillRect(-600, wy, W + 1800, fk - wy);
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = wy + 34; y < fk; y += 38) { ctx.moveTo(-600, y); ctx.lineTo(W + 1200, y); } ctx.stroke();
  ctx.fillStyle = '#10161e'; ctx.fillRect(-600, wy - 46, W + 1800, 56); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(-600, wy + 10, W + 1800, 4);                 /* the eaves */
  ctx.fillStyle = lg(0, fk, 0, fk + 700, [[0, '#2c333d'], [1, '#14181f']]); ctx.fillRect(-600, fk, W + 1800, 800);                                                         /* the patio */
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; ctx.beginPath(); for (const gx of [-200, 330, 860, 1390, 1920]) { ctx.moveTo(gx, fk); ctx.lineTo(gx + (gx - 800) * .5, fk + 700); } ctx.moveTo(-600, fk + 220); ctx.lineTo(2200, fk + 220); ctx.moveTo(-600, fk + 520); ctx.lineTo(2200, fk + 520); ctx.stroke();
  /* painted assembly rectangle on the patio, in front of the door (a trapezoid) */
  ctx.save(); ctx.strokeStyle = 'rgba(246,211,74,.8)'; ctx.lineWidth = 9; ctx.setLineDash([60, 34]); ctx.beginPath(); ctx.moveTo(-100, fk + 90); ctx.lineTo(1500, fk + 90); ctx.lineTo(1800, fk + 560); ctx.lineTo(-400, fk + 560); ctx.closePath(); ctx.stroke(); ctx.restore();
  /* the door: the leaf swung against the wall (P18), the EXIT sign above, the strobe beside it */
  const Pp = window.P18;
  if (Pp && Pp.fireDoor) Pp.fireDoor(ctx, { x: dx, y: fk, close: 0, beyond: corridorBeyond(lt, sh.crowd || 0), led: 'red', glow: .6, w: OUT.dw, h: OUT.dh, window: false, hinge: 1 });
  else { ctx.fillStyle = '#10151c'; ctx.fillRect(dx - OUT.dw / 2, fk - OUT.dh, OUT.dw, OUT.dh); }
  if (Pp && Pp.exitSign) Pp.exitSign(ctx, { x: dx, y: fk - OUT.dh - 78, w: 250, h: 104, glow: 1, t: lt });
  if (Pp && Pp.hornStrobe) Pp.hornStrobe(ctx, { x: dx + 290, y: fk - 360, level: fl, s: .9 });
  /* the light of the open door on the patio: a fan of red-white, the corridor's glare */
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  { const a = .08 + .3 * fl; ctx.fillStyle = lg(dx, fk, dx, fk + 560, [[0, `rgba(255,96,76,${a})`], [1, 'rgba(255,60,50,0)']]); ctx.beginPath(); ctx.moveTo(dx - 150, fk); ctx.lineTo(dx + 150, fk); ctx.lineTo(dx + 620, fk + 600); ctx.lineTo(dx - 620, fk + 600); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  if (F) { F.glow(ctx, { x: dx, y: fk - 240, r: 520, color: '#ff5a46', alpha: .08 + .3 * fl, core: .1 }); F.glow(ctx, { x: dx, y: fk - OUT.dh - 78, r: 200, color: '#38ff7a', alpha: .3, core: .2 }); }
  /* the ASSEMBLY POINT sign on a post at the left */
  { const px = 150, py = fk - 40; ctx.fillStyle = '#2a3038'; ctx.fillRect(px - 8, py - 520, 16, 520); const bx = [px - 190, py - 760, 380, 250];
    UI.sign(bx, [{ t: 'ASSEMBLY', size: 64, weight: 900, spacing: 2 }, { t: 'POINT', size: 64, weight: 900, spacing: 2 }], { fill: '#1b7a4a', ink: '#fff', stroke: '#e8f6ee', lw: 6, r: 14, pad: 18, id: 'asm', hero: false, crop: true }); }
  /* the cast */
  const C = sh.cast || {};
  if (C.mango) drawChar(mangoOut(lt, sh));
  if (C.res) for (const r of resWalkers(lt, sh)) r();
  if (C.tom) drawChar(tomOut(lt, sh));
  if (C.lemon) drawChar(lemonOut(lt, sh));
}
function setOutLight(lt) {
  const fl = strobeAt(lt);
  V2.setLight({ key: [.65, -.2], keyColor: '#ff8a70', keyA: .1 + .22 * fl, rim: '#8fb0ff', rimA: .5, shadow: '#0c1020', shadowA: .5, bounce: '#ff7a60', bounceA: .08, amb: '#242c44', ambA: .38, back: null, frontDark: 0 });
  V2.addLight({ x: OUT.dx, y: OUT.fl - 240, r: 1500, color: '255,70,58', a: .35 + .6 * fl });
  V2.addLight({ x: OUT.dx, y: OUT.fl - OUT.dh - 78, r: 520, color: '60,255,120', a: .35 });
}
/*@@PART12@@*/

// ------------------------------------------------------------------ Binder's wall tablet: the toast SNOOZE ENDED pops up on the chime (0.2) and the screen flashes with the horn
const scaleNow = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };
function safeIn(x0, y0, x1, y1, mg = 46) {   /* is a box (current frame) wholly inside the frame, clear of the caption zone (y 1380..1700) and the clock pill (x 48..500, y 116..244)? */
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}
function wallTablet(lt) {
  const z = RM.zTV - 3, q = dFace(TABL.x - TABL.w / 2, TABL.x + TABL.w / 2, TABL.y - TABL.h / 2, TABL.y + TABL.h / 2, z), fl = strobeAt(lt), k = dK(z);
  ctx.save(); ctx.fillStyle = '#0d0e12'; ctx.strokeStyle = '#2b2e38'; ctx.lineWidth = Math.max(2, 5 * k); ctx.beginPath(); ctx.roundRect(q.x - 8 * k, q.y - 8 * k, q.w + 16 * k, q.h + 16 * k, 14 * k); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.rgba(V2.mix('#1c2a40', '#8a2a30', fl * .8), 1); ctx.fillRect(q.x, q.y, q.w, q.h);
  /* a little Binder clip in the corner */
  const bx = q.x + q.w * .14, by = q.y + q.h * .22, bs = q.h * .0035;
  ctx.save(); ctx.translate(bx, by); ctx.scale(bs * 100, bs * 100); ctx.fillStyle = '#16151c'; ctx.strokeStyle = '#4a4a58'; ctx.lineWidth = .06; ctx.beginPath(); ctx.roundRect(-.45, -.35, .9, .7, .12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; for (const sx of [-.17, .17]) { ctx.beginPath(); ctx.arc(sx, -.06, .12, 0, 2 * PI); ctx.fill(); } ctx.fillStyle = '#000'; for (const sx of [-.15, .19]) { ctx.beginPath(); ctx.arc(sx, -.05, .05, 0, 2 * PI); ctx.fill(); }
  ctx.strokeStyle = '#fff'; ctx.lineWidth = .05; ctx.beginPath(); ctx.arc(0, .08, .17, .2, PI - .2); ctx.stroke(); ctx.restore();
  ctx.restore();
  const pop = eb(sg(lt, CUE.pachime, CUE.pachime + .22));
  if (pop > .02) {
    const cx = q.x + q.w * .54, cy = q.y + q.h * .6, bw = q.w * .86, bh = q.h * .4, size = bh * .46, hero = safeIn(cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2) && scaleNow() * size >= 31;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
    UI.sign([cx - bw / 2, cy - bh / 2, bw, bh], [{ t: 'SNOOZE ENDED', size, weight: 900, spacing: 1 }], { fill: '#ffbf1f', ink: '#22262b', stroke: '#15111a', lw: Math.max(2, 4 * k), r: bh * .3, id: 'toast', hero, crop: !hero, shadow: 0 });
    ctx.restore();
  }
}

// ------------------------------------------------------------------ the shots of the day room (0 to 12 s): each is a 2D camera (the world point at the frame centre, and the zoom) on the same lens, plus who is in it
const DSHOTS = [];
const dshot = (id, s, e, cam, o) => DSHOTS.push(Object.assign({ id, s, e, cam }, o));
const dshotAt = lt => { let r = DSHOTS[0]; for (const sh of DSHOTS) if (lt >= sh.s) r = sh; return r; };
dshot('ins', 0, CUE.horn3, lt => [-505 * 0 + 540 + (-505) * .54 + 0, 719 + (360 - 560) * .54, lerp(3.0, 3.12, sg(lt, 0, CUE.horn3))], { res: [] });
dshot('open', CUE.horn3, 1.6, lt => [540, 985, lerp(1.5, 1.55, sg(lt, CUE.horn3, 1.6))], { res: 'all' });
dshot('l1', 1.6, 3.934, lt => [790, 660, lerp(2.15, 2.3, sg(lt, 1.6, 3.934))], { res: ['fig1', 'prune1'], lemon: 1 });
dshot('r1', 3.934, 5.691, lt => [530, 960, lerp(1.5, 1.6, sg(lt, 3.934, 5.691))], { res: 'all' });
dshot('l2', 5.691, 7.461, lt => [770, 640, lerp(2.5, 2.62, sg(lt, 5.691, 7.461))], { res: ['fig1', 'prune1'], lemon: 1 });
dshot('c1', 7.461, 8.941, lt => [540, 960, lerp(1, 1.04, sg(lt, 7.461, 8.941))], { res: [], close: 'banana' });
dshot('s1', 8.941, 10.258, lt => [700, 930, lerp(1.2, 1.26, sg(lt, 8.941, 10.258)), 150], { res: 'all', straw: 1 });
dshot('rm', 10.258, 11.208, lt => [690, 900, lerp(1.2, 1.26, sg(lt, 10.258, 11.208)), 150], { res: 'all', straw: 1 });
dshot('r2', 11.208, 12.008, lt => [640, 960, lerp(1.45, 1.5, sg(lt, 11.208, 12.008)), 150], { res: 'all', straw: 1 });
const dayShotId = lt => lt < 12.0 ? dshotAt(lt).id : null;

/* the light on the characters: warm rim from the TV (they sit between it and us), the strobe from the door on their right; cold after the TV goes out */
function setDayLight(lt, sh) {
  const warm = warmAt(lt), fl = strobeAt(lt), flk = FLK(lt);
  V2.setLight({ key: [.5, -.3], keyColor: '#ff9a50', keyA: .12 * warm, rim: '#ff7a44', rimA: .45 * warm, shadow: '#140c1c', shadowA: .55, bounce: '#ff9a50', bounceA: .1 * warm, amb: '#241c30', ambA: .55, back: { color: warm > .02 ? '255,150,76' : '120,150,255', a: warm > .02 ? .8 * warm * flk : .25, w: 15 }, frontDark: .3 });
  if (fl > .02) V2.addLight({ x: dP(RM.hw, 380, RM.zTV)[0], y: dP(RM.hw, 380, RM.zTV)[1], r: 1700, color: '255,64,54', a: .95 * fl });
}
function dayWorld(lt, sh) {
  if (sh.close === 'banana') { drawBananaCU(lt); return; }
  setDayLight(lt, sh); V2.opts.reflect = false;
  const warm = warmAt(lt);
  dayShell(lt, warm); rugDay(); wallTablet(lt); tvScreen(lt); dayLights(lt);
  const ids = sh.res === 'all' ? null : sh.res;
  if (sh.lemon) drawChar(lemonDoor(lt));
  for (const row of [2, 1]) {
    rowLayer(row, 'seat', lt, ids);
    if (row === 1 && lt < 9.7 && (!ids || ids.indexOf('grape1') >= 0)) remoteOnArm(lt, ROW1[4][0] + CHS.hw + 10, ROW1[4][1], ss(lt, 9.45, 9.75));
    for (const r of RES) if (r.row === row && (!ids || ids.indexOf(r.id) >= 0)) drawRes(r, lt);
    rowLayer(row, 'back', lt, ids);
  }
  if (sh.straw) drawChar(strawDay(lt));
}
/*@@PART10@@*/

// ------------------------------------------------------------------ the HEADCOUNT chip, the time-lapse badge (screen space, UI kit)
const HC_BOX = [660, 128, 360, 176];
function chipHeads(lt, S0) {
  if (!S0) return;
  const n = S0.count(lt), n1 = S0.count(Math.max(0, lt - .1)), bump = n > n1 ? 1 : 0;
  UI.panel(HC_BOX, { id: 'hc', kind: 'chip', fill: 'rgba(16,20,28,.92)', stroke: '#ffd60a', lw: 5, r: 24, shadow: 14, pad: 10 });
  UI.label('HEADCOUNT', HC_BOX[0] + HC_BOX[2] / 2, HC_BOX[1] + 38, { size: 30, weight: 900, spacing: 3, fill: '#d5dbe8', cid: 'hc', center: false });
  ctx.save(); const cx = HC_BOX[0] + HC_BOX[2] / 2, cy = HC_BOX[1] + 116; if (bump) { ctx.translate(cx, cy); ctx.scale(1.1, 1.1); ctx.translate(-cx, -cy); }
  UI.label(String(n), cx, cy, { size: 92, font: 'Bangers', weight: 400, fill: '#ffe135', stroke: '#15111a', lw: 6, spacing: 2, cid: 'hc' });
  ctx.restore();
}
function badgeLapse(lt, S0) {
  if (!S0) return;
  const f = Math.max(1, Math.round(S0.rate(lt) / NOMINAL)), live = f < 2;
  const str = live ? 'LIVE' : 'TIME-LAPSE x' + f, on = Math.sin(lt * 7) > -.2;
  UI.pill(str, 840, 352, { size: 30, weight: 900, spacing: 2, fill: live ? '#1f8a54' : '#ff4d3a', ink: '#fff', stroke: '#15111a', lw: 4, padX: 22, h: 52, id: 'lapse' });
  ctx.save(); ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(840 - UI.sizeOf(str, { size: 30, weight: 900, spacing: 2 }).w / 2 - 36, 352, 7, 0, 2 * PI); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot(lt) { return tdShotAt(lt) || dayShotId(lt) || 'tbd'; },
  cam(lt) {
    if (tdShotAt(lt) || lt >= 12.0) { zoomTo(540, 960, 1); return; }
    const sh = dshotAt(lt), c = sh.cam(lt); V2.setCam(Object.assign({}, LENS, { cx: c[3] || 0 })); zoomTo(c[0], c[1], c[2]);
  },
  draw(lt) {
    if (tdShotAt(lt)) { drawTD(lt); return; }
    if (lt < 12.0) { dayWorld(lt, dshotAt(lt)); return; }
    ctx.fillStyle = '#10131a'; ctx.fillRect(0, 0, W, H);
  },
  fx(lt) { const warm = warmAt(lt); return { bloom: .5, vignette: .55, grain: .05, contrast: .16, sat: .06, tint: [['#5a6aa0', .16 * (1 - warm), 'screen']] }; },
  blur(lt) { for (const sh of DSHOTS) if (Math.abs(lt - sh.s) < .05) return 1; return tdShotAt(lt) ? 3 : 2; },
  over(lt) {
    const S0 = SIM(), id = tdShotAt(lt);
    if (lt >= WIN.plan[0]) chipHeads(lt, S0);
    if (id) badgeLapse(lt, S0);
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP18_SCENES = window.__EP18_SCENES || {};
window.__EP18_SCENES.evac = SC;
})();
