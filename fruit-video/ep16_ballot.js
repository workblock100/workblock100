'use strict';
/* SHIFT HAPPENS, Episode 16: "The Vote". Scene module: ballot (6:30 PM, THE BALLOT, 24.8 s). Builder E1617-BALLOT. Registers window.__EP16_SCENES.ballot.
 *
 * The break room (S6.breakRoom: vending machine, fridge, counter, window, bulletin board; plus a VOTE BINDER banner, a microwave, a long table, a clear ballot box with a slot and a VOTE HERE sticker, Binder's
 * laptop). The set is in one-point perspective seen from the foot of the table (V2 camera: wide, the two-shot from behind, the table-height box shots, the final wide). The dialogue close-ups are big flat
 * characters in front of an out-of-focus room (a table edge in the foreground hides the body), like the prize scene. The ballots are the physics of ep16_ballot_sim.js (window.__EP16_SIMS.ballot), drawn in
 * the plane of the box (u sideways, v down from the table top, room units).
 *
 * Shots (scene-local s): wide 0-1.1 (the lights click on at .5) | a1 1.1-3.24 Melon at the head | l1 3.24-4.67 Lemon | a2 4.67-6.1 Lemon and Mango from behind, Melon beyond | o1 6.1-8.25 Onion with the ballots
 * (a tear on the top one at the sniffle 7.805) | t1 8.25-9.81 Tomato | m1 9.81-11.12 Mango | o2 11.12-12.07 Onion "Binder." | m2 12.07-12.8 Mango | o3 12.8-14.67 Onion | s1 14.67-15.755 Strawberry |
 * t2 15.755-16.575 Tomato | b1 16.575-18.63 Binder pops out of the laptop (the bubble) | s2 18.63-19.18 Strawberry "No." | b2 19.18-20.22 Binder grins (19.726) | drop 20.22-21.9 hands and slot (clicks 20.518,
 * 20.918, 21.318) | pop 21.9-22.82 the box fills (pops 21.918 .. 22.618) | flood 22.82-23.87 table-height, the lid is thrown (crowd 22.818) | final 23.87-24.8 wide, everyone frozen, ballots still falling (sting 23.968).
 */
(() => {
if (!window.TIMELINE_EP16 || !window.H6 || !window.S6 || !window.V2 || !window.A15 || !window.UI || !window.SH15) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A9 = window.A9, A11 = window.A11, A15 = window.A15, SH15 = window.SH15, S6 = window.S6;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP16, SCN = TLX.scenes.find(s => s.id === 'ballot'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'ballot') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };   /* ease out back */
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
/* the sound cues of the scene (scene-local seconds; python3 /tmp/shift_tools/cues.py 16 ballot), snapped to the video frame nearest each */
const CUE = { click: .5, sniffle: 7.805, binderpop: 16.575, grin: 19.726, clicks: [20.518, 20.918, 21.318], pops: [21.918, 22.118, 22.318, 22.468, 22.618], crowd: 22.818, sting: 23.968 };
for (const k in CUE) CUE[k] = Array.isArray(CUE[k]) ? CUE[k].map(snapT) : snapT(CUE[k]);
const HAS = (sh, n) => !sh.cast || sh.cast.indexOf(n) >= 0;

// ------------------------------------------------------------------ the room (S6 coordinates: X right, Y up, Z away from the camera; the far wall is at 2200)
const ZB = 2200, HW = 460, CH = 600;
const TABLE = { x0: -160, x1: 160, z0: 480, z1: 1280, y0: 190, y1: 208 };      /* the long table (top at y 208) */
const TOP = TABLE.y1;
const BOX = { x: 0, z: 860, w: 156, h: 146, d: 156 };                           /* the clear ballot box: x and z of its centre, its width, height and depth (it stands on the table top) */
const kz = Z => V2.P.f / (Z - V2.P.cz);
const P3 = (X, Y, Z) => V2.p2(X, Y, Z);
/* a polygon of room points (X, Y, Z), clipped at the camera's near plane first */
function polyW(pts, fill, stroke, lw) {
  const near = V2.P.cz + 90, out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= near, ib = b[2] >= near;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (near - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), near]); }
  }
  if (out.length >= 3) V2.poly(out.map(p => V2.p2(p[0], p[1], p[2])), fill, stroke, lw);
}
const box3 = o => S6.box3(o);
const lit = (c, f) => S6.lit(c, f);
function scaleNow() { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); }
function safeIn(x0, y0, x1, y1, mg = 46) {   /* a box (current frame) wholly inside the frame, clear of the caption zone and the clock pill? */
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}
/* hero lettering only when it is big enough and wholly in the safe frame; otherwise dressing (hero false, crop true) */
function sign(str, cx, cy, size, o = {}) {
  const so = { size, weight: o.weight || 900, font: o.font, spacing: o.spacing || 0 }, w = UI.sizeOf(str, so).w, h = size * .8;
  const hero = o.hero !== false && safeIn(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2) && scaleNow() * size >= 31;
  return UI.label(str, cx, cy, Object.assign({ hero, crop: !hero }, so, o, { hero, crop: !hero }));
}

const FLICK = lt => lt < CUE.click ? 0 : lt < CUE.click + .06 ? .55 : lt < CUE.click + .12 ? .1 : lt < CUE.click + .2 ? .8 : 1;   /* the fluorescent tubes catch */

function room(lt, sh) {
  const on = FLICK(lt);
  S6.breakRoom({ door: 0, sky: ['#2b3a78', '#e98a5a'] });
  S6.wallClock(-460, 520, 1500, -1, 30, 6, 40);                                  /* the wall clock reads 6:30 */
  for (const z of [520, 1000, 1480, 1960]) if (z > V2.P.cz + 260 && V2.P.cy < CH - 30) for (const X of [-170, 170]) S6.ceilingLamp(X, z, CH, .35 + .65 * on, '255,244,214', 90, 160);
  /* the VOTE BINDER banner across the far wall, above the door and the window: Binder's face, the slogan, the footnote */
  { const x0 = -400, x1 = 400, y0 = 482, y1 = 586, z = ZB - 4;
    polyW([[x0 - 8, y0 - 8, z], [x1 + 8, y0 - 8, z], [x1 + 8, y1 + 8, z], [x0 - 8, y1 + 8, z]], '#2c2f3a', 'rgba(25,16,30,.7)', 2.4);
    polyW([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], lg(...P3(x0, y1, z), ...P3(x0, y0, z), [[0, '#fff6d8'], [1, '#f3e3b4']]));
    const k = kz(z), [fx, fy] = P3(-318, (y0 + y1) / 2, z);                                 /* Binder's face on the poster: a black clip with two eyes and a smile */
    ctx.save(); ctx.translate(fx, fy); ctx.scale(k, k);
    ctx.fillStyle = '#1c1d24'; ctx.beginPath(); ctx.moveTo(-34, -40); ctx.lineTo(34, -40); ctx.lineTo(50, 40); ctx.lineTo(-50, 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9aa3b0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-28, -40); ctx.quadraticCurveTo(-46, -70, -20, -74); ctx.moveTo(28, -40); ctx.quadraticCurveTo(46, -70, 20, -74); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-17, -8, 12, 14, 0, 0, TAU); ctx.ellipse(17, -8, 12, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-15, -5, 5, 0, TAU); ctx.arc(19, -5, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 12, 20, .2, PI - .2); ctx.stroke(); ctx.restore();
    const [cx, cy] = P3(18, (y0 + y1) / 2 + 12, z);
    sign('VOTE BINDER', cx, cy, 70 * k, { font: 'Bangers', weight: 400, fill: '#c23a2b', stroke: '#fff6d8', lw: 0, spacing: 4 * k, maxW: 560 * k, hero: !(sh && sh.noHero) });
    const [fx2, fy2] = P3(18, y0 + 14, z); sign('(only candidate)', fx2, fy2, 17 * k, { weight: 800, fill: '#5a4a3a', hero: false });
  }
  { const z = 2036, ns = [[352, 330, '#fff3a6'], [388, 300, '#ffb3c6'], [420, 345, '#bfe3ff'], [366, 262, '#d8ffb0']];
    for (const [x, y, c] of ns) polyW([[x, y, z], [x + 26, y, z], [x + 26, y + 26, z], [x, y + 26, z]], c, 'rgba(60,40,20,.4)', 1); }
  /* a microwave on the counter by the right wall */
  S6.microwave(350, 1300, { on: 0, display: ' ' });
}

// ------------------------------------------------------------------ the table, the chairs, the box and the laptop
function tableAndSeats(lt) {
  const t = TABLE, c = { color: '#e8dcc0', top: '#f6edd6', front: '#d8c9a8', side: '#b9aa88', lw: 1.4 }, leg = { color: '#4d4f5a', front: '#3c3e48', side: '#2f313a', top: '#6a6c78', lw: 1 };
  for (const X of [t.x0 + 14, t.x1 - 14]) for (const Z of [t.z0 + 14, t.z1 - 14]) box3(Object.assign({ x0: X - 6, x1: X + 6, y0: 0, y1: t.y0, z0: Z - 6, z1: Z + 6 }, leg));
  box3(Object.assign({ x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1, z0: t.z0, z1: t.z1 }, c));
  box3({ x0: t.x0 - 4, x1: t.x1 + 4, y0: t.y1 - 3, y1: t.y1 + 1, z0: t.z0 - 4, z1: t.z1 + 4, color: '#8d6a44', top: '#a07a50', front: '#7a5a38', side: '#6a4c2e', lw: 1 });
}
/* a plastic break-room chair beside the table, facing it (side -1: on the room's left, facing +X) */
function chairAt(side, Z) {
  const xc = side * 252, w = 46, d = 46, col = { color: '#3f7f8a', top: '#5aa0ac', front: '#34707a', side: '#2a5a62', lw: 1.2 }, leg = { color: '#4d4f5a', front: '#3c3e48', side: '#2f313a', top: '#6a6c78', lw: 1 };
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) box3(Object.assign({ x0: xc + dx * (w - 8) - 3, x1: xc + dx * (w - 8) + 3, y0: 0, y1: 120, z0: Z + dz * (d - 8) - 3, z1: Z + dz * (d - 8) + 3 }, leg));
  box3(Object.assign({ x0: xc - w, x1: xc + w, y0: 120, y1: 136, z0: Z - d, z1: Z + d }, col));
  const bx0 = side < 0 ? xc - w : xc + w - 12;
  box3(Object.assign({ x0: bx0, x1: bx0 + 12, y0: 136, y1: 280, z0: Z - d + 4, z1: Z + d - 4 }, col));
}
function chairFoot(Z, layer) {
  const w = 46, d = 46, col = { color: '#3f7f8a', top: '#5aa0ac', front: '#34707a', side: '#2a5a62', lw: 1.2 }, leg = { color: '#4d4f5a', front: '#3c3e48', side: '#2f313a', top: '#6a6c78', lw: 1 };
  if (layer === 'seat') {
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) box3(Object.assign({ x0: dx * (w - 8) - 3, x1: dx * (w - 8) + 3, y0: 0, y1: 120, z0: Z + dz * (d - 8) - 3, z1: Z + dz * (d - 8) + 3 }, leg));
    box3(Object.assign({ x0: -w, x1: w, y0: 120, y1: 136, z0: Z - d, z1: Z + d }, col));
  } else box3(Object.assign({ x0: -w + 4, x1: w - 4, y0: 136, y1: 270, z0: Z - d, z1: Z - d + 12 }, col));
}
const SEATS = { lemon: [-1, 640], mango: [1, 640], straw: [0, 410] };

// ------------------------------------------------------------------ the ballot box (clear plastic, a lid with a slot, a VOTE HERE sticker) and the ballots of the sim
let SIM = null;
function sim() { if (SIM) return SIM; const S = window.__EP16_SIMS && window.__EP16_SIMS.ballot; if (!S) return null; SIM = S.build(); return SIM; }
const BXH = 140;                                                           /* the walls' height above the table top */
const slotPos = () => [BOX.x, TOP + BXH + 16, BOX.z];                      /* the slot on the lid's top face */
/* one ballot: a paper rectangle (BW 11 x BH 7 half sizes in room units) with a tick box and a line of print; hero text only when big and at rest */
function ballotSprite(k, big, o = {}) {
  const w = 22 * k, h = 14 * k;
  ctx.save(); ctx.shadowColor = 'rgba(20,16,10,.25)'; ctx.shadowBlur = 2 * k;
  rr(-w / 2, -h / 2, w, h, 1.6 * k); ctx.fillStyle = o.fill || '#fbf8ee'; ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(60,50,40,.6)'; ctx.lineWidth = Math.max(.8, .7 * k); ctx.stroke();
  ctx.fillStyle = 'rgba(40,70,160,.85)'; ctx.fillRect(-w / 2 + 2.2 * k, -h / 2 + 3 * k, 3.4 * k, 3.4 * k);
  ctx.fillStyle = 'rgba(60,50,40,.55)'; ctx.fillRect(-w / 2 + 7.4 * k, -h / 2 + 3.6 * k, 10 * k, 1.6 * k); ctx.fillRect(-w / 2 + 7.4 * k, -h / 2 + 7.4 * k, 7 * k, 1.4 * k);
}
function pops(lt, k, pos) {   /* a tiny star where a ballot pops in */
  for (const b of pos) {
    const age = lt - b.t; if (age < 0 || age > .22) continue;
    const f = 1 - age / .22, r = (10 + 16 * eo(age / .22)) * k;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(.4 * age * 8); ctx.fillStyle = `rgba(255,245,190,${.9 * f})`; ctx.strokeStyle = `rgba(255,170,40,${.7 * f})`; ctx.lineWidth = 1.5 * k;
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4, rr2 = i % 2 ? r * .32 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
/* the lid as a slab (top face with the slot, front face, ends), rotated in the plane of the box by the sim's angle */
function lidDraw(lt, st) {
  const L = sim() ? window.__EP16_SIMS.ballot.lidPose(lt) : { x: 0, y: -(BXH + 8), angle: 0 }, hw = 88, hh = 8, zn = BOX.z - BOX.d / 2 - 4, zf = BOX.z + BOX.d / 2 + 4;
  const cX = BOX.x + L.x, cY = TOP - L.y, ca = Math.cos(L.angle), sa = Math.sin(L.angle);
  const c = (lx, ly, z) => [cX + lx * ca + ly * sa, cY - lx * sa + ly * ca, z];
  const col = { top: 'rgba(233,238,246,.5)', front: 'rgba(201,210,224,.62)', side: 'rgba(170,181,200,.5)' };   /* a clear smoked lid: whoever stands behind the box shows through */
  polyW([c(-hw, hh, zf), c(-hw, -hh, zf), c(-hw, -hh, zn), c(-hw, hh, zn)], col.side, 'rgba(30,34,50,.7)', 1.6);
  polyW([c(hw, hh, zf), c(hw, -hh, zf), c(hw, -hh, zn), c(hw, hh, zn)], col.side, 'rgba(30,34,50,.7)', 1.6);
  polyW([c(-hw, hh, zn), c(hw, hh, zn), c(hw, hh, zf), c(-hw, hh, zf)], col.top, 'rgba(30,34,50,.75)', 1.8);
  polyW([c(-34, hh, BOX.z - 8), c(34, hh, BOX.z - 8), c(34, hh, BOX.z + 8), c(-34, hh, BOX.z + 8)], 'rgba(26,28,38,.9)', 'rgba(255,255,255,.5)', 1.2);
  polyW([c(-hw, hh, zn), c(hw, hh, zn), c(hw, -hh, zn), c(-hw, -hh, zn)], col.front, 'rgba(30,34,50,.8)', 2);
}
function burst(lt, t0, x, y, r, dur) {   /* a star flash on a cue */
  const a = lt - t0; if (a < 0 || a > dur) return; const f = 1 - a / dur, rr2 = r * (.3 + .9 * eo(a / dur));
  ctx.save(); ctx.translate(x, y); ctx.rotate(a * 3); ctx.fillStyle = `rgba(255,248,200,${.85 * f})`; ctx.strokeStyle = `rgba(255,170,40,${.8 * f})`; ctx.lineWidth = Math.max(1.5, r * .05);
  ctx.beginPath(); for (let i = 0; i < 16; i++) { const an = i * PI / 8, q = i % 2 ? rr2 * .42 : rr2; ctx.lineTo(Math.cos(an) * q, Math.sin(an) * q); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function ballotBox(lt, st) {
  const x0 = BOX.x - BOX.w / 2, x1 = BOX.x + BOX.w / 2, zn = BOX.z - BOX.d / 2, zf = BOX.z + BOX.d / 2, y0 = TOP, y1 = TOP + BXH;
  const rim = 'rgba(120,175,205,.9)', glass = 'rgba(196,228,242,.2)';
  polyW([[x0, y0, zf], [x1, y0, zf], [x1, y1, zf], [x0, y1, zf]], 'rgba(150,200,225,.30)', rim, 1.8);                    /* back face */
  polyW([[x0, y0, zn], [x0, y0, zf], [x0, y1, zf], [x0, y1, zn]], 'rgba(170,214,235,.24)', rim, 1.6);                    /* left face */
  polyW([[x1, y0, zn], [x1, y0, zf], [x1, y1, zf], [x1, y1, zn]], 'rgba(170,214,235,.24)', rim, 1.6);                    /* right face */
  polyW([[x0, y0, zn], [x1, y0, zn], [x1, y0, zf], [x0, y0, zf]], 'rgba(150,196,220,.4)', rim, 1.4);                     /* floor */
  const S = sim(), k = kz(BOX.z), spark = [];
  if (S) {
    const stt = S.world.at(lt);
    for (const b of S.meta.ballots) {
      if (lt < b.t) continue; const q = stt.by[b.id], age = lt - b.t, sc = b.grp === 'drop' ? 1 : (age < .09 ? .3 + .7 * eb(age / .09) : 1);
      const [px, py] = P3(BOX.x + q.x, TOP - q.y, BOX.z);
      ctx.save(); ctx.translate(px, py); ctx.rotate(q.angle); ctx.scale(sc, sc); ballotSprite(k * (lt >= CUE.crowd ? 1.3 : 1), false); ctx.restore();
      if (b.grp === 'pop' || b.grp === 'crowd') spark.push({ t: b.t, x: px, y: py });
    }
    pops(lt, k, spark);
  }
  polyW([[x0, y0, zn], [x1, y0, zn], [x1, y1, zn], [x0, y1, zn]], glass, rim, 2.2);                                       /* front face */
  /* a sheen on the front face and the sticker */
  polyW([[x0 + 10, y1 - 10, zn], [x0 + 38, y1 - 10, zn], [x0 + 12, y0 + 40, zn]], 'rgba(255,255,255,.16)');
  { const q = [[BOX.x - 52, y0 + 100, zn], [BOX.x + 52, y0 + 100, zn], [BOX.x + 52, y0 + 132, zn], [BOX.x - 52, y0 + 132, zn]];
    polyW(q, '#fff2b0', 'rgba(120,70,10,.9)', 2.2); const [cx, cy] = P3(BOX.x, y0 + 116, zn); sign('VOTE HERE', cx, cy, 19 * k, { fill: '#b3261e', weight: 900, maxW: 98 * k, spacing: .6 * k, hero: !st.noSticker }); }
  lidDraw(lt, st);
}

// ------------------------------------------------------------------ the cast: acting (a pure function of scene time) and placement (flat close-ups, or in the room's perspective)
const KIND = o => KINDS[o.kind];
const mkFlat = (ctor, lt, p) => {   /* a big flat character, body anchored by its bottom (hidden behind the table strip) at x */
  const o = ctor(Object.assign({ t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true }, p.o));
  o.s = p.s; o.x = p.x; o.y = p.bottom ?? 995; o.lift = 0; o.yaw = p.yaw ?? 0; o.headYaw = p.headYaw ?? o.yaw;
  return o;
};
/* each actor: the options of the character at lt (expression, eyes, arms, tears ...) */
function actMelon(lt) {
  const w2 = wS('a1', 2), open = ss(lt, w2 - .2, w2 + .08) * (1 - ss(lt, w2 + .75, w2 + 1.05)), chest = ss(lt, wS('a1', 6) - .3, wS('a1', 6)) * (1 - ss(lt, bE('a1') + .1, bE('a1') + .4));
  const shrug = ss(lt, bS('a2') + .55, bS('a2') + .8) * (1 - ss(lt, bE('a2') - .1, bE('a2') + .2));
  const r = mixA(mixA([.28, .25], [1.55, .1], open), [.7, 1.2], chest), l = mixA(mixA([.28, .25], [1.55, .1], open), [.28, .25], chest);
  return { acc: ['suit'], expr: lt > bS('a2') ? 'smug' : 'happy', arms: { l: shrug > .01 ? mixA(l, [1.2, .6], shrug) : l, r: shrug > .01 ? mixA(r, [1.2, .6], shrug) : r }, look: [.1, -.05] };
}
const actLemon = lt => ({ expr: lt > bS('l1') && lt < bE('l1') + .3 ? 'neutral' : lt > bS('a2') ? 'sour' : 'neutral', lid: .42, look: [.55, -.05], arms: { l: 'rest', r: 'rest' } });
function actMango(lt) {
  const ask = lt > bS('m1') && lt < bE('m1') + .2, who = lt > bS('m2') && lt < bE('m2') + .2;
  return { expr: who ? 'sour' : ask ? 'hopeful' : lt > bS('o2') && lt < bS('m2') ? 'dead' : 'neutral', look: [-.4, ask ? -.15 : .05], arms: { l: 'rest', r: ask ? 'hips' : 'rest' } };
}
function actOnion(lt) {
  const say = lt > bS('o1') && lt < bE('o1') + .1, sobT = lt > CUE.sniffle - .05 && lt < CUE.sniffle + .5;
  const level = lt < bS('o2') ? .55 : lt < bS('o3') ? .8 : 1;
  return { cry: level, sob: lt > bS('o3') ? .5 + .4 * Math.sin(lt * 9) * .5 + .3 : sobT ? .8 : 0, expr: lt > bS('o3') ? 'onion_wail' : 'onion_cry', pose: 'free', arms: { l: 'rest', r: 'rest' }, look: [-.3, .35], visor: true };
}
function actTomato(lt) {
  const finger = ss(lt, wS('t1', 1) - .15, wS('t1', 1) + .05) * (1 - ss(lt, bE('t1') + .1, bE('t1') + .4));
  const veg = lt > bS('t2') + .12;
  return { tomPose: veg ? 'veg' : 'fruit', flipT: lt > bS('t2') + .12 && lt < bS('t2') + .7 ? lt - bS('t2') - .12 : undefined, expr: lt > bS('t2') ? 'smug' : 'happy', arms: { l: 'rest', r: finger > .5 ? 'up' : 'rest' }, hand: { r: 'point' }, look: [.1, .1] };
}
function actStraw(lt) {
  const no = lt >= bS('s2') && lt < bE('s2') + .3, shake = no ? Math.sin((lt - bS('s2')) * 15) * .09 * (1 - sg(lt, bS('s2') + .3, bE('s2') + .3)) : 0;
  return { expr: 'dead', lid: .5, look: [.45, .05], arms: { l: 'rest', r: 'rest' }, headShake: shake };
}
const ACTORS = { melon: [A9.melon, actMelon], lemon: [A7.lemon, actLemon], mango: [A7.mango, actMango], onion: [A15.onion, actOnion], tomato: [A15.tomato, actTomato], straw: [A11.straw, actStraw] };
function flatChar(name, lt, p) {
  const [ctor, act] = ACTORS[name], a = act(lt), o = mkFlat(ctor, lt, Object.assign({}, p, { o: Object.assign({}, a, p.o || {}) }));
  if (a.headShake) o.headYaw = (o.headYaw || 0) + a.headShake;
  if (name === 'tomato') { o.hold = {}; o.grip = {}; }
  return o;
}
/* the same people in the room (perspective): seated beside the table (backs turned: yaw = PI - phi) or standing at its head (facing the camera) */
const PHI = { lemon: .95, mango: -.95, straw: 0 };                             /* the direction each sitter faces in the room: 0 toward the head, +PI/2 toward the room's right */
function seatedAt(name, lt, o2 = {}) {
  const [side, Z] = SEATS[name], X = side * 244, q = V2.at(X, Z), y = P3(X, 130, Z)[1], s = q.s * .84, [ctor, act] = ACTORS[name], a = act(lt);
  const sway = Math.sin(lt * 1.3 + side) * .04, phi = PHI[name] + sway + (o2.dphi || 0), turn = o2.turn || 0;
  const o = ctor(Object.assign({ t: lt, x: q.x, y, s, noLegs: true, noShadow: true, noReflect: true, plant: true }, a, o2.o || {}));
  o.yaw = PI - phi; o.headYaw = PI - phi - turn;
  return o;
}
function turnFor(name, lt) {   /* the sitters' heads: a glance across the table on a2, then every face to the box at the crowd (Lemon on the left turns right, Mango on the right turns left) */
  const sgn = name === 'lemon' ? 1 : name === 'mango' ? -1 : 0;
  return sgn * (.55 * ss(lt, 5.0, 5.3) * (1 - ss(lt, 5.8, 6.1)) + .62 * ss(lt, CUE.crowd - .05, CUE.crowd + .1));
}
const HEAD = { melon: [0, 1340, 1.16], onion: [-215, 1290, 1.1], tomato: [230, 1290, 1.1] };
function standingAt(name, lt, o2 = {}) {
  const [X, Z, k] = HEAD[name], q = V2.at(X, Z), [ctor, act] = ACTORS[name], a = act(lt);
  if (name === 'tomato') { a.hold = {}; a.grip = {}; }
  const o = ctor(Object.assign({ t: lt, x: q.x, y: q.y, s: q.s * k }, a, o2.o || {}));
  o.yaw = o2.yaw ?? 0; o.headYaw = o2.headYaw ?? o.yaw;
  return o;
}

// ------------------------------------------------------------------ backdrops and the table strip for the flat close-ups
const BACK_F = { f: 1400, cz: 640, cy: 330, hy: 700, cx: 0 };               /* the far wall behind a character at the head of the table */
function rearWall(lt) {                                                    /* the wall behind the seated three (set dressing, always out of focus) */
  const x0 = -200, x1 = 1280;
  ctx.fillStyle = lg(0, 0, 0, 1100, [[0, '#efe4c6'], [1, '#e2d6b6']]); ctx.fillRect(x0, -100, x1 - x0, 1400);
  ctx.fillStyle = '#c47a52'; ctx.fillRect(x0, 760, x1 - x0, 500); ctx.fillStyle = '#a8623e'; ctx.fillRect(x0, 752, x1 - x0, 12);
  rr(70, 300, 250, 640, 8); ctx.fillStyle = '#a8744f'; ctx.fill(); ctx.strokeStyle = 'rgba(25,16,30,.6)'; ctx.lineWidth = 6; ctx.stroke();
  rr(110, 350, 170, 250, 6); ctx.fillStyle = '#9fc1c6'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#96623e'; ctx.fillRect(110, 650, 170, 220);
  rr(430, 250, 170, 70, 8); ctx.fillStyle = '#1f8a4a'; ctx.fill(); ctx.strokeStyle = 'rgba(10,40,20,.8)'; ctx.stroke(); ctx.fillStyle = '#eafff0'; ctx.fillRect(455, 275, 120, 20);
  ctx.fillStyle = '#c43a2a'; rr(760, 520, 60, 220, 12); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(960, 420, 70, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a4f5a'; ctx.lineWidth = 9; ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(960, 420); ctx.lineTo(960, 370); ctx.moveTo(960, 420); ctx.lineTo(990, 440); ctx.stroke();
  const on = FLICK(lt); ctx.fillStyle = `rgba(30,24,40,${.32 * (1 - on)})`; ctx.fillRect(x0, -100, x1 - x0, 1400);
}
/* the table in the foreground: its top surface (a laminate band) and its front, hiding the body of whoever is behind it */
const STRIP = { y: 985 };
function strip(lt) {
  const y = STRIP.y;
  ctx.fillStyle = lg(0, y, 0, y + 330, [[0, '#d2c5a8'], [.12, '#efe5ca'], [1, '#f6eed8']]); ctx.fillRect(-200, y, 1480, 330);
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-200, y, 1480, 3);
  ctx.fillStyle = 'rgba(120,96,60,.08)'; for (let i = 0; i < 7; i++) ctx.fillRect(-200, y + 40 + i * 44, 1480, 2);
  ctx.fillStyle = '#8d6a44'; ctx.fillRect(-200, y + 330, 1480, 16); ctx.fillStyle = '#a58058'; ctx.fillRect(-200, y + 330, 1480, 4);
  ctx.fillStyle = lg(0, y + 346, 0, y + 700, [[0, '#6f4f30'], [1, '#2a1c10']]); ctx.fillRect(-200, y + 346, 1480, 1000);
}
/* the stack of ballots Onion holds in front of her (a hero ballot read straight on: top edge at ty0, w x h); tears fall on it and leave blots */
function ballotStack(lt, cx, ty0, n, blots, o = {}) {
  const w = 360, h = 175, hh = !o.noHero, y = ty0 + h;
  for (let i = n - 1; i >= 1; i--) {
    const dy = (n - 1 - i) * 7 + 7, dx = (sr(i, 1) - .5) * 12, rot = (sr(i, 2) - .5) * .04;
    ctx.save(); ctx.translate(cx + dx, y + dy); ctx.rotate(rot); rr(-w / 2, -h, w, h, 6); ctx.fillStyle = i % 2 ? '#f1ecdc' : '#f6f2e4'; ctx.fill(); ctx.strokeStyle = 'rgba(60,50,40,.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.shadowColor = 'rgba(30,20,10,.35)'; ctx.shadowBlur = 8; rr(cx - w / 2, ty0, w, h, 6); ctx.fillStyle = '#fbf8ee'; ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(60,50,40,.55)'; ctx.lineWidth = 2; rr(cx - w / 2, ty0, w, h, 6); ctx.stroke();
  ctx.fillStyle = '#243b8a'; ctx.fillRect(cx - w / 2 + 14, ty0 + 12, w - 28, 6);
  sign('OFFICIAL BALLOT', cx, ty0 + 44, 34, { fill: '#243b8a', maxW: w - 50, hero: hh });
  ctx.strokeStyle = 'rgba(36,59,138,.9)'; ctx.lineWidth = 4; rr(cx - w / 2 + 28, ty0 + 84, 56, 56, 7); ctx.stroke();
  sign('BINDER', cx + 36, ty0 + 112, 64, { fill: '#1d1d24', font: 'Bangers', weight: 400, spacing: 3, maxW: w - 150, hero: hh });
  for (const b of blots) { const age = lt - b.t; if (age < 0) continue; const r = (6 + 22 * eo(c01(age / .5))) * b.k; ctx.fillStyle = 'rgba(70,110,170,.32)'; ctx.beginPath(); ctx.ellipse(cx + b.x, ty0 + b.y, r, r * .75, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(40,70,140,.4)'; ctx.lineWidth = 2; ctx.stroke(); }
}

/* things on the table in the foreground of a close-up: a mug with steam (left), the clear ballot box (right) */
function tableProps(lt, F) {
  ctx.save(); ctx.translate(140, 1190);
  ctx.fillStyle = 'rgba(40,30,20,.2)'; ell(6, 40, 70, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(30,20,20,.85)'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  rr(-46, -78, 92, 112, 16); ctx.fillStyle = '#f7f4ea'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a7bd5'; ctx.fillRect(-45, -50, 90, 16); ctx.beginPath(); ctx.arc(48, -22, 26, -1.3, 1.3); ctx.lineWidth = 11; ctx.strokeStyle = '#f7f4ea'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,20,20,.85)'; ctx.beginPath(); ctx.arc(48, -22, 31, -1.3, 1.3); ctx.stroke(); ctx.beginPath(); ctx.arc(48, -22, 21, -1.3, 1.3); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); const x0 = -18 + i * 18; ctx.moveTo(x0, -88); for (let j = 1; j <= 6; j++) ctx.lineTo(x0 + Math.sin(lt * 2.2 + i + j * .9) * 7, -88 - j * 14); ctx.globalAlpha = .6 - i * .1; ctx.stroke(); }
  ctx.restore();
  /* the clear box, flat: translucent front, a lid with the slot, the sticker (dressing) */
  ctx.save(); ctx.translate(880, 1262);
  ctx.fillStyle = 'rgba(40,30,20,.2)'; ell(0, 6, 112, 14); ctx.fill();
  rr(-90, -170, 180, 170, 6); ctx.fillStyle = 'rgba(196,228,242,.34)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,175,205,.95)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(-76, -156); ctx.lineTo(-40, -156); ctx.lineTo(-76, -60); ctx.closePath(); ctx.fill();
  rr(-100, -196, 200, 28, 6); ctx.fillStyle = '#e9ecf2'; ctx.fill(); ctx.strokeStyle = 'rgba(30,34,50,.8)'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#1a1c26'; ctx.fillRect(-36, -186, 72, 7);
  rr(-62, -102, 124, 40, 4); ctx.fillStyle = '#fff2b0'; ctx.fill(); ctx.strokeStyle = 'rgba(120,70,10,.9)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  sign('VOTE HERE', 880, 1262 - 82, 24, { fill: '#b3261e', weight: 900, hero: false, maxW: 112 });
}
// ------------------------------------------------------------------ the hands that drop the folded ballots through the slot (a fruit's own colour arm and mitt, from the corner of the frame)
const HANDS = [{ side: -1, c1: '#ffe84a', c2: '#b88900', t: 0 }, { side: 1, c1: '#ffb627', c2: '#b86a00', t: 1 }, { side: -1, c1: '#ff6b7e', c2: '#9a0f27', t: 2 }];
function handDrop(lt, h, slot, k) {
  const t0 = CUE.clicks[h.t], a = lt - (t0 - .5); if (a < 0 || a > 1.0) return;
  const u = a < .5 ? easeIO(a / .5) : 1 - easeIO(sg(a, .58, 1.0)), len = 300 * k * (1 - u) + 20 * k, dir = [h.side * .55, -.84];
  const px = slot[0] + dir[0] * len, py = slot[1] + dir[1] * len + 14 * k, ang = Math.atan2(-dir[1], -dir[0]);   /* the arm points from its corner toward the slot */
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bx = px - Math.cos(ang) * 1300, by = py - Math.sin(ang) * 1300;
  ctx.strokeStyle = '#1d1622'; ctx.lineWidth = 17 * k; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
  ctx.strokeStyle = h.c1; ctx.lineWidth = 11 * k; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py); ctx.stroke();
  ctx.translate(px, py); ctx.rotate(ang);
  /* the glove: a palm, three fingers and a thumb round the folded ballot (it leaves the fingers at the click: the sim's ballot takes over under the slot) */
  if (a < .5 + .03) { ctx.save(); ctx.translate(34 * k, 2 * k); ctx.rotate(PI / 2); rr(-12 * k, -17 * k, 24 * k, 34 * k, 2 * k); ctx.fillStyle = '#fbf8ee'; ctx.fill(); ctx.strokeStyle = 'rgba(60,50,40,.8)'; ctx.lineWidth = 1.8 * k; ctx.stroke(); ctx.fillStyle = 'rgba(40,70,160,.9)'; ctx.fillRect(-8 * k, -11 * k, 6 * k, 6 * k); ctx.restore(); }
  ctx.fillStyle = '#fdfcf6'; ctx.strokeStyle = '#1d1622'; ctx.lineWidth = 3.2 * k;
  for (const fy of [-10, 0, 10]) { rr(14 * k, (fy - 4.6) * k, 22 * k, 9.2 * k, 4.6 * k); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(6 * k, 0, 15 * k, 17 * k, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(14 * k, 15 * k); ctx.rotate(-.6); rr(-4 * k, -4.5 * k, 20 * k, 9 * k, 4.5 * k); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = h.c1; ctx.beginPath(); ctx.ellipse(-8 * k, 0, 5 * k, 14 * k, 0, 0, TAU); ctx.fill(); ctx.stroke();   /* the cuff in the fruit's colour */
  ctx.restore();
}

// ------------------------------------------------------------------ Binder: out of the laptop (flat close-up), the chat bubble in screen space
const BTXT = "It looks like you're voting. Would you like help?", BTXT2 = "Great! I'll help.";
function typedAt(id, text, lt) {
  const L = LN[id]; if (!L) return 1;
  const words = L.words, n = text.length; let shown = 0, pos = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i][0].replace(/[^A-Za-z']/g, ''), w = text.indexOf(clean, pos), ws = wS(id, i) - .04, we = wE(id, i); if (w < 0) continue;
    if (lt < ws) break;
    const end = w + clean.length;
    shown = Math.max(shown, lerp(w, end, c01((lt - ws) / Math.max(.05, we - ws))));
    pos = end;
  }
  return lt >= wE(id, words.length - 1) ? 1 : c01(shown / n);
}
const LAP = { x0: 235, x1: 845, y0: 640, y1: 970 };                        /* the laptop's screen (flat close-up, scene units) */
function laptopFlat(lt, glow) {
  const { x0, x1, y0, y1 } = LAP;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  rr(x0 - 24, y0 - 24, x1 - x0 + 48, y1 - y0 + 48, 22); ctx.fillStyle = '#23262e'; ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#0f1116'; ctx.lineWidth = 4; ctx.stroke();
  rr(x0, y0, x1 - x0, y1 - y0, 8); ctx.fillStyle = lg(x0, y0, x1, y1, [[0, '#1a2b52'], [1, '#2c4a8a']]); ctx.fill();
  V2.glow((x0 + x1) / 2, (y0 + y1) / 2, 380, '120,170,255', .35 + glow * .5, 'screen', .4);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x0 + 24, y0 + 28, 210, 14); ctx.fillRect(x0 + 24, y0 + 60, 330, 10); ctx.fillRect(x0 + 24, y0 + 84, 270, 10);
  ctx.beginPath(); ctx.moveTo(x0 - 60, y1 + 24); ctx.lineTo(x1 + 60, y1 + 24); ctx.lineTo(x1 + 110, y1 + 74); ctx.lineTo(x0 - 110, y1 + 74); ctx.closePath(); ctx.fillStyle = lg(0, y1 + 24, 0, y1 + 74, [[0, '#c9ced9'], [1, '#9aa1b0']]); ctx.fill(); ctx.strokeStyle = '#0f1116'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = 'rgba(40,44,60,.4)'; ctx.fillRect(x0 + 120, y1 + 36, 370, 6);
}
function binderFlat(lt, p) {
  const pop = c01((lt - CUE.binderpop) / .4), sc = lt < CUE.binderpop ? 0 : (.12 + .88 * eb(pop)) * p.s;
  if (sc <= .01) return null;
  const grin = Math.max(.3 + .1 * Math.sin(lt * 2.1), ss(lt, CUE.grin - .05, CUE.grin + .2));
  const y = lerp(p.y0, p.y, eo(pop)), x = p.x, st = lt >= bS('b2');
  const o = A15.binder({ x, y: y + Math.sin(lt * 2.3) * 5, s: sc, center: true, t: lt, who: 'bind', pose: st ? (lt > CUE.grin ? 'helpful' : 'wave') : (pop < 1 ? 'cheer' : 'wave'), grin, glint: lt > CUE.grin ? Math.max(0, Math.sin((lt - CUE.grin) * 6)) ** 4 : 0, look: [-.2, .3], bob: .4, hover: 0 });
  drawChar(o);
  return { x, y, s: sc };
}
function bubble(lt, bp) {
  if (!bp) return;
  const second = lt >= bS('b2') - .02, text = second ? BTXT2 : BTXT, typed = second ? typedAt('b2', BTXT2, lt) : typedAt('b1', BTXT, lt);
  const o = { at: [150, 258], w: 780, s: 1, tail: [bp.x + 6, bp.y - 150 * bp.s - 6], text, typed, name: 'Binder', size: 36, pop: ss(lt, second ? bS('b2') - .02 : CUE.binderpop, second ? bS('b2') + .22 : CUE.binderpop + .3), hero: true,
    buttons: second ? [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }] : [{ id: 'yes', t: 'Yes please', def: true }, { id: 'no', t: 'No thanks' }], runaway: second ? 1 : sg(lt, bS('s2') - 1.0, bS('s2') - .35), runPath: [[0, 0], [230, 50], [-50, 110], [-300, 70]] };
  SH15.binder(o, lt);
}

// ------------------------------------------------------------------ the world: perspective shots (the room seen from the foot of the table) and flat close-ups
function setLight(lt) {
  V2.setLight({ key: [.4, -.6], keyColor: '#fff0d0', keyA: .26, rim: '#bcd4ff', rimA: .3, shadow: '#2a2038', shadowA: .3, bounce: '#ffe2b0', bounceA: .12, amb: '#fff0d8', ambA: .08 });
}
function laptop3(lt) {   /* Binder's laptop at the head of the table, its screen toward the foot */
  const X = 70, Z = 1190, on = FLICK(lt);
  box3({ x0: X - 60, x1: X + 60, y0: TOP, y1: TOP + 6, z0: Z - 50, z1: Z + 30, color: '#b9bfcc', top: '#d3d8e2', front: '#9aa1b0', side: '#848b9a', lw: 1 });
  const q = [[X - 58, TOP + 6, Z + 30], [X + 58, TOP + 6, Z + 30], [X + 58, TOP + 96, Z + 52], [X - 58, TOP + 96, Z + 52]];
  polyW(q, '#23262e', 'rgba(10,10,14,.9)', 2);
  polyW([[X - 50, TOP + 14, Z + 31], [X + 50, TOP + 14, Z + 31], [X + 50, TOP + 90, Z + 49], [X - 50, TOP + 90, Z + 49]], lg(...P3(X - 50, TOP + 90, Z + 49), ...P3(X + 50, TOP + 14, Z + 31), [[0, '#2c4a8a'], [1, '#1a2b52']]));
  { const [ix, iy] = P3(X, TOP + 56, Z + 40), k = kz(Z) * .55; ctx.save(); ctx.translate(ix, iy); ctx.scale(k, k);
    ctx.fillStyle = '#0c0d12'; ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(14, -16); ctx.lineTo(20, 16); ctx.lineTo(-20, 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6, -2, 5, 0, TAU); ctx.arc(7, -2, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 6, 7, .2, PI - .2); ctx.stroke(); ctx.restore(); }
  V2.glow(...P3(X, TOP + 55, Z + 40), 70 * kz(Z), '120,170,255', .3 * on, 'screen', .3);
}
function drawRoom(lt, sh) {
  V2.opts.reflect = false; setLight(lt);
  const back = () => room(lt, sh);
  if (sh.dof) V2.dof(sh.dof, back); else back();
  const C = sh.cast || [], st = { noSticker: lt >= CUE.crowd - .02 && lt < CUE.crowd + .35 };
  const flood = lt >= CUE.crowd - .02;
  const look = lt >= CUE.clicks[0] ? [0, .5] : [0, .05];
  for (const n of ['melon', 'onion', 'tomato']) if (C.indexOf(n) >= 0) {
    const turn = flood ? (n === 'onion' ? .45 : n === 'tomato' ? -.3 : 0) : 0, shock = lt >= CUE.crowd - .05;
    drawChar(standingAt(n, lt, { yaw: turn * .5, headYaw: turn, o: shock ? { expr: n === 'onion' ? 'onion_wail' : 'shock', look: [0, .5], arms: { l: n === 'melon' ? 'up' : 'rest', r: n === 'melon' ? 'up' : 'rest' } } : (lt >= CUE.clicks[0] ? { look: [0, .45] } : {}) }));
  }
  laptop3(lt);
  tableAndSeats(lt);
  if (C.indexOf('straw') >= 0) { chairFoot(SEATS.straw[1], 'seat'); drawChar(seatedAt('straw', lt, { o: lt >= CUE.crowd - .05 ? { expr: 'shock' } : undefined })); chairFoot(SEATS.straw[1], 'back'); }
  if (sh.box !== false) ballotBox(lt, st);
  for (const n of ['lemon', 'mango']) if (C.indexOf(n) >= 0) { chairAt(SEATS[n][0], SEATS[n][1]); drawChar(seatedAt(n, lt, { turn: turnFor(n, lt), o: lt >= CUE.crowd - .05 ? { expr: 'shock' } : undefined })); }
  if (sh.hands) { const slot = P3(...slotPos()), k = kz(BOX.z); for (const h of HANDS) handDrop(lt, h, slot, k * .6); for (const tc of CUE.clicks) burst(lt, tc, slot[0], slot[1], 44 * k * .6, 0.2); }
  { const [bx, by] = P3(BOX.x, TOP + 120, BOX.z); burst(lt, CUE.crowd, bx, by, 190 * kz(BOX.z), 0.3); }
}
function drawFlat(lt, sh) {
  const F = sh.flat; V2.opts.reflect = false; setLight(lt);
  if (F.laptop) { V2.dof(7, () => room(lt, sh)); strip(lt); laptopFlat(lt, ss(lt, CUE.binderpop - .05, CUE.binderpop + .2)); return; }
  if (F.back === 'r') V2.dof(7, () => rearWall(lt)); else V2.dof(7, () => room(lt, sh));
  const o = flatChar(F.who, lt, { x: F.x ?? 540, s: F.s, yaw: F.yaw, headYaw: F.headYaw, bottom: F.bottom });
  drawChar(o);
  strip(lt);
  tableProps(lt, F);
  if (F.stack) {
    const blots = [{ t: CUE.sniffle + .18, x: -40, y: 60, k: 1 }, { t: CUE.sniffle + .6, x: 70, y: 100, k: .8 }];
    if (lt > bS('o2')) blots.push({ t: bS('o2') + .3, x: -90, y: 120, k: 1.1 }, { t: bS('o2') + .8, x: 20, y: 50, k: .9 });
    if (lt > bS('o3')) blots.push({ t: bS('o3') + .2, x: 110, y: 70, k: 1.2 }, { t: bS('o3') + .7, x: -30, y: 140, k: 1 }, { t: bS('o3') + 1.2, x: 60, y: 150, k: 1 });
    ballotStack(lt, 540, 890, 6, blots);
    /* tears falling from her chin onto the top ballot */
    const dropsT = lt < bS('o2') ? [CUE.sniffle + .02, CUE.sniffle + .45] : lt < bS('o3') ? [bS('o2') + .2, bS('o2') + .7] : [bS('o3') + .1, bS('o3') + .6, bS('o3') + 1.1];
    for (const t of dropsT) { const a = lt - t; if (a < 0 || a > .2) continue; const y = lerp(F.chin, 905, a / .2), x = 540 + (t * 37 % 1 - .5) * 90; ctx.fillStyle = 'rgba(160,205,255,.95)'; ctx.beginPath(); ctx.ellipse(x, y, 7, 11, 0, 0, TAU); ctx.fill(); }
  }
}

// ------------------------------------------------------------------ the shot table
const SHOTS = [];
const shot = (id, s, e, cam, o) => SHOTS.push(Object.assign({ id, s, e, cam }, o));
function shotAt(lt) { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s) r = sh; return r; }
const ALL = ['melon', 'onion', 'tomato', 'lemon', 'mango', 'straw'];
const WIDE = { f: 1400, cz: -380, cy: 700, hy: 400, cx: 0 };
const flat = o => u => Object.assign({}, BACK_F, { z: lerp(1, 1.06, u) }, { cc: true });
shot('wide', 0, 1.1, u => ({ v2: Object.assign({}, WIDE, { cz: lerp(-420, -380, u) }), z: 1 }), { cast: ALL });
shot('a1', 1.1, 3.24, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { who: 'melon', s: 1.45, yaw: .15, back: 'f' } });
shot('l1', 3.24, 4.67, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { who: 'lemon', s: 1.4, yaw: .6, headYaw: .75, back: 'r' } });
shot('a2', 4.67, 6.1, u => ({ v2: Object.assign({}, WIDE, { cz: lerp(-400, -350, u), cy: lerp(700, 690, u), hy: lerp(400, 410, u) }), z: 1 }), { cast: ALL });
shot('o1', 6.1, 8.25, u => ({ v2: BACK_F, z: lerp(1, 1.07, u) }), { flat: { who: 'onion', s: 1.6, bottom: 926, back: 'f', stack: true, chin: 860 } });
shot('t1', 8.25, 9.81, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { who: 'tomato', s: 1.7, yaw: -.15, back: 'f' } });
shot('m1', 9.81, 11.12, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { who: 'mango', s: 1.75, yaw: -.6, headYaw: -.7, back: 'r' } });
shot('o2', 11.12, 12.07, u => ({ v2: BACK_F, z: lerp(1.03, 1.1, u) }), { flat: { who: 'onion', s: 1.6, bottom: 926, yaw: .35, headYaw: .5, back: 'f', stack: true, chin: 860 } });
shot('m2', 12.07, 12.8, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { who: 'mango', s: 1.75, yaw: -.6, headYaw: -.7, back: 'r' } });
shot('o3', 12.8, 14.67, u => ({ v2: BACK_F, z: lerp(1.05, 1.15, u) }), { flat: { who: 'onion', s: 1.6, bottom: 926, yaw: .35, headYaw: .5, back: 'f', stack: true, chin: 860 } });
shot('s1', 14.67, 15.755, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { who: 'straw', s: 1.6, yaw: .5, headYaw: .6, back: 'r' } });
shot('t2', 15.755, 16.575, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { who: 'tomato', s: 1.7, yaw: -.15, back: 'f' } });
shot('b1', 16.575, 18.63, u => ({ v2: BACK_F, z: lerp(1, 1.05, u) }), { flat: { laptop: true }, binder: { x: 540, y0: 790, y: 730, s: 1.0 } });
shot('s2', 18.63, 19.18, u => ({ v2: BACK_F, z: lerp(1.04, 1.1, u) }), { flat: { who: 'straw', s: 1.6, yaw: .5, headYaw: .6, back: 'r' } });
shot('b2', 19.18, 20.22, u => ({ v2: BACK_F, z: lerp(1, 1.06, u) }), { flat: { laptop: true }, binder: { x: 540, y0: 790, y: 730, s: 1.1 } });
const DROPC = { f: 1400, cz: 400, cy: 480, hy: 400, cx: 0 }, FLOODC = { f: 1400, cz: 250, cy: 300, hy: 860, cx: 0 };
shot('drop', 20.22, 21.9, u => ({ v2: Object.assign({}, DROPC, { cz: lerp(400, 430, u) }), z: 1 }), { cast: [], dof: 7, hands: true, noHero: true });
shot('pop', 21.9, 22.82, u => ({ v2: Object.assign({}, DROPC, { cz: lerp(430, 470, u), hy: lerp(400, 335, u) }), z: 1 }), { cast: [], dof: 7, noHero: true });
shot('flood', 22.82, 23.87, u => ({ v2: Object.assign({}, FLOODC, { cz: lerp(190, 262, u) }), z: 1 }), { cast: ['melon', 'onion', 'tomato'], dof: 0, noHero: true });
shot('final', 23.87, 24.82, u => ({ v2: Object.assign({}, WIDE, { cz: lerp(-380, -330, u) }), z: 1 }), { cast: ALL, noHero: true });

const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt), c = sh.cam(sg(lt, sh.s, sh.e));
    const kc = pulse(lt, CUE.crowd, 26, .14), ks = pulse(lt, CUE.sting, 20, .18);
    V2.setCam(c.v2); zoomTo(540 + kc * 7, 960 + kc * 5, (c.z || 1) * (1 + .035 * Math.max(0, kc) + .03 * Math.max(0, ks)));
  },
  draw(lt) { const sh = shotAt(lt); if (sh.flat) drawFlat(lt, sh); else drawRoom(lt, sh); },
  fx(lt) {
    const on = FLICK(lt), fx = { bloom: .42 + .4 * (lt >= CUE.click ? Math.exp(-(lt - CUE.click) * 8) : 0) + .5 * (lt >= CUE.crowd ? Math.exp(-(lt - CUE.crowd) * 9) : 0) + .25 * (lt >= CUE.sting ? Math.exp(-(lt - CUE.sting) * 9) : 0), vignette: .38, grain: .045, contrast: .12, sat: .1 };
    if (on < 1) { fx.fade = .4 * (1 - on); fx.fadeColor = '8,10,20'; }
    return fx;
  },
  blur(lt) {
    for (const sh of SHOTS) if (Math.abs(lt - sh.s) < .05) return 1;
    if (lt > CUE.crowd && lt < CUE.crowd + .7) return 8;
    return 2;
  },
  over(lt) {
    const sh = shotAt(lt);
    if (sh.binder) { burst(lt, CUE.binderpop, 540, 800, 330, .3); const bp = binderFlat(lt, sh.binder); bubble(lt, bp); }
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP16_SCENES = window.__EP16_SCENES || {};
window.__EP16_SCENES.ballot = SC;
})();
