'use strict';
/* SHIFT HAPPENS, Episode 13: "The Float Pool". Scene module: cross (7:15 PM, THE JOB, 26.85 s). Scene builder E13-B.
 *
 * A heist cross-cut: full-frame shots that alternate between three places, joined by fast whips (a directional smear over the cut), under a persistent HUD (the RADIO tag, as in the hall scene, and an
 * ADMIN LOOP chip with a ticking countdown). A the nurses' station (Lemon on the radio, Mango stalling the Administrator, his slide), B the break room door (Strawberry, the reader, the six locks),
 * C the hall (Mr. Banana, the peel, the slow arc). Set: the shared kit ep13_station.js (window.S13).
 *
 * SHOT LIST (scene-local seconds; a hard cut inside a place, a whip between places (*))
 *   0.00-0.95   a0   A  wide, a fast push: Lemon at the counter in her headset, Mango waiting on the left, the Administrator strolling in from the right; the HUD chip pops in (beep3 0.25)
 *   0.95-3.00   a1   A  CU Lemon on the radio (lr1 "Administrator is on his loop."): her eyes follow him across the room, a nod on "Mango."
 *   3.00-3.86   a2   A  CU Mango: she breathes in, the smile goes on and sets
 *   3.86-5.43   a3   A  two-shot (m1): Mango steps into the Administrator's way: "Hi! Do you have a minute?"
 *   5.43-6.57   a4   A  CU the Administrator (a1): "I have fourteen." (a look at his watch)
 *   6.57-8.50   a5   A  CU Mango (m2): frozen smile, the eye twitching, her thumb tapping a hidden count
 *   8.50-10.02  a6   A  MS the Administrator (a2): "Fascinating." the pocket projector comes out; "Slide one." its lens lights
 *   10.02-10.97 a7   A  the slide (clack 10.07, fanwhir): SCHEDULES: A JOURNEY, three bullets, on the wall above Mango's fixed smile and the Administrator with his projector
 *   10.97-11.80 b1a  B* door MCU: the six locks, the sign (UI.sign): "Door's locked."
 *   11.80-13.54 b1b  B  CU Strawberry (sr1): her eyes on the sign, "Policy fourteen point three."
 *   13.54-15.05 a8   A* CU Lemon (lr2): "Staff may not enter."
 *   15.05-16.02 b2   B* CU Strawberry (sr2): "I'm not staff." the per diem badge comes up beside her face
 *   16.02-16.56 b3   B  MACRO the card reader: the badge swipes (vmbeep 16.12), BADGE: PER DIEM / STATUS: NOT STAFF / ACCESS GRANTED typed in green
 *   16.56-17.37 b4   B  door MCU: the wet floor sign hops, the tape drops, the bolts clunk (16.62), the padlock opens and the chain falls (clunk 16.87), the door cracks open on a dark seam
 *   17.37-18.60 a9   A* CU Lemon (lr3): "He's heading your way."
 *   18.60-19.74 c1   C* the hall, wide: the Administrator walks his loop, Banana waits by the wall beside the peel: "Banana. Now."
 *   19.74-20.28 c2   C  CU Banana (b1): "Now?"
 *   20.28-21.04 a10  A* CU Lemon (lr4): "Slip."
 *   21.04-22.05 c3   C* the slip: Banana steps on the peel (21.19), is flung (boing 21.44) and sails in a slow arc (a time-warp: it hangs at the top), lands flat
 *   22.05-22.85 c4   C  low angle: Banana flat on the floor, INCIDENTS 47 flips to 48 (b2 "Forty-eight!")
 *   22.85-24.74 c5   C  the Administrator over him (a3): "Mr. Banana! I'll get the form."
 *   24.74-25.70 c6   C  Mango with the slide remote, hopeful (m3): "Slide two?"
 *   25.70-26.85 b5   B* the door seam: dark and dusty, the draught lifts her leaf, the sting (25.80)
 *
 * Text: the HUD (UI.pill / UI.panel / UI.label), the slide (UI.sign), the door sign and the reader (kit). Every character is sharp and whole in its shot or left out of it.
 */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo, faceZoom, drawBg } = window.H6;
const A7 = window.A7, A9 = window.A9, A11 = window.A11, S13 = window.S13;
const { wordT, route, pulse, sk } = S13;
const { grad, radial } = V2;
const inB = (lt, id) => lt >= B(id).s && lt < B(id).e;
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const c01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = c01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const CYAN = '#4de3ff', RED = '#ff3b4e', GOLD = '#ffc83d', GLASS = 'rgba(8,10,20,.78)';

// ------------------------------------------------------------------ the shots
const SHOTS = [
  { id: 'a0', t0: 0, t1: .95, pl: 'A' }, { id: 'a1', t0: .95, t1: 3.0, pl: 'A' }, { id: 'a2', t0: 3.0, t1: 3.86, pl: 'A' }, { id: 'a3', t0: 3.86, t1: 5.43, pl: 'A' },
  { id: 'a4', t0: 5.43, t1: 6.57, pl: 'A' }, { id: 'a5', t0: 6.57, t1: 8.50, pl: 'A' }, { id: 'a6', t0: 8.50, t1: 10.02, pl: 'A' }, { id: 'a7', t0: 10.02, t1: 10.97, pl: 'A' },
  { id: 'b1a', t0: 10.97, t1: 11.80, pl: 'B' }, { id: 'b1b', t0: 11.80, t1: 13.54, pl: 'B' }, { id: 'a8', t0: 13.54, t1: 15.05, pl: 'A' }, { id: 'b2', t0: 15.05, t1: 16.02, pl: 'B' },
  { id: 'b3', t0: 16.02, t1: 16.56, pl: 'B' }, { id: 'b4', t0: 16.56, t1: 17.37, pl: 'B' }, { id: 'a9', t0: 17.37, t1: 18.60, pl: 'A' },
  { id: 'c1', t0: 18.60, t1: 19.74, pl: 'C' }, { id: 'c2', t0: 19.74, t1: 20.28, pl: 'C' }, { id: 'a10', t0: 20.28, t1: 21.04, pl: 'A' }, { id: 'c3', t0: 21.04, t1: 22.05, pl: 'C' },
  { id: 'c4', t0: 22.05, t1: 22.85, pl: 'C' }, { id: 'c5', t0: 22.85, t1: 24.735, pl: 'C' }, { id: 'c6', t0: 24.735, t1: 25.70, pl: 'C' }, { id: 'b5', t0: 25.70, t1: 99, pl: 'B' },
];
const shotAt = lt => SHOTS.find(s => lt < s.t1) || SHOTS[SHOTS.length - 1];
// the whips: every cut that changes the place (the picture is smeared sideways just before and just after it)
const WHIPS = [[10.97, 1], [13.54, -1], [15.05, 1], [17.37, -1], [18.60, 1], [20.28, -1], [21.04, 1], [25.70, -1]];
function whip(lt) {
  let px = 0, dir = 1;
  for (const [tc, d] of WHIPS) {
    const a = lt >= tc - .07 && lt < tc ? easeIn(seg(lt, tc - .07, tc)) : lt >= tc && lt < tc + .09 ? 1 - easeOut(seg(lt, tc, tc + .09)) : 0;
    if (a > px) { px = a; dir = d; }
  }
  return { px: 300 * px, dir };
}

// ------------------------------------------------------------------ helpers: gait, group framing, culling
function pathD(fn, t0, t) { let d = 0, p = fn(t0); for (let u = t0 + .04; ; u += .04) { const tt = Math.min(u, t), qq = fn(tt); d += Math.hypot(qq[0] - p[0], qq[1] - p[1]); p = qq; if (tt >= t) break; } return d; }
function gait(o, fn, t0, lt) {
  const dt = .04, a = fn(lt + dt), b = fn(lt - dt), vX = (a[0] - b[0]) / (2 * dt), vZ = (a[1] - b[1]) / (2 * dt);
  if (Math.hypot(vX, vZ) < 9) return o;
  const axisZ = Math.abs(vZ) > Math.abs(vX) * 1.2;
  o.gaitW = pathD(fn, t0, lt); o.axis = axisZ ? 'z' : 'x'; o.dir = axisZ ? -Math.sign(vZ) : Math.sign(vX);
  return o;
}
function boxOf(o, pad = 0) {   /* the screen box of a character in unzoomed picture space */
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
function frameGroup(list, o = {}) {
  const bs = list.map(([q, pad]) => boxOf(q, pad)), x0 = Math.min(...bs.map(v => v[0])), x1 = Math.max(...bs.map(v => v[2])), y0 = Math.min(...bs.map(v => v[1])), y1 = Math.max(...bs.map(v => v[3]));
  const z = Math.min((W - 2 * (o.mx ?? 80)) / (x1 - x0), (o.hMax ?? 1200) / (y1 - y0), o.zMax ?? 3) * (o.k ?? 1), cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * (o.at ?? .5);
  zoomTo(cx, cy + (960 - (o.ty ?? 760)) / z, z);
  return z;
}
function inFrame(o) {   /* entirely inside the frame under the current transform? */
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, bot = o.y + 24 * s, half = k.rx * 1.12 * s;
  const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(o.x - half, top), p(o.x + half, top), p(o.x - half, bot), p(o.x + half, bot)], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 8 && x1 <= W - 8 && y0 >= 8 };
}
const handAt = (o, g) => { const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90); return [o.x + g[0] * s, o.y - (o.lift || 0) - (legLen + k.ry * .9) * s + g[1] * s]; };

// ------------------------------------------------------------------ PLACE A: the nurses' station. Who is where, and what they do.
const SEAT = 96, LEM_P = [470, 1600];
const MROUTE = route([[0, -330, 1250], [3.0, -330, 1250], [3.72, -170, 1250, 'io']]);       /* Mango waits, then steps into his way */
const AROUTE = route([[0, 720, 1130], [3.75, 235, 1250, 'io']]);                             /* the Administrator strolls in from the right on his loop */
const radioL = lt => inB(lt, 'lr1') || inB(lt, 'lr2') || inB(lt, 'lr3') || inB(lt, 'lr4');
const radioS = lt => inB(lt, 'sr1') || inB(lt, 'sr2');

function lemonO(lt) {
  const t = lt, q = V2.at(LEM_P[0], LEM_P[1]), seatY = V2.p2(LEM_P[0], SEAT, LEM_P[1])[1];
  const tm = wordT('lr1', 'mango', 3.09), nod = Math.sin(seg(lt, tm - .05, tm + .3) * PI);
  let look = [-.3, .1], expr = 'neutral', lid = .22, browUp = 0;
  if (lt < tm - .1) look = [lerp(.8, -.8, sstep(lt, .5, 3.0)), .05];                         /* she follows him across the room */
  else if (lt < 3.6) look = [-.9, .0];                                                          /* "Mango." */
  if (inB(lt, 'lr2')) { look = [-.2, .0]; lid = .3; }
  if (inB(lt, 'lr3')) { look = lt < wordT('lr3', 'banana', 18.66) ? [-.85, .1] : [-.5, .05]; lid = .14; browUp = 6; }
  if (inB(lt, 'lr4')) { look = [-.4, .0]; expr = 'smug'; lid = .2; }
  const o = A7.lemon(Object.assign(q, { y: seatY, noLegs: true, noShadow: true, t, look, expr, lid, browUp, who: radioL(lt) ? 'lemonr' : 'lemon', acc: ['readers', 'lanyard7', 'fp13_headset'], face: { curve: .02 },
    plant: true, rot: -.012 + .02 * nod, arms: { l: 'rest', r: 'phone' } }));
  return o;
}
function mangoA(lt) {
  const [X, Z] = MROUTE(lt), q = V2.at(X, Z), walking = lt > 3.0 && lt < 3.72;
  let look = [.85, 0], expr = 'neutral', smile = 0;
  if (lt >= 3.0) { expr = 'happy'; smile = sstep(lt, 3.0, 3.45); look = [.75, 0]; }
  const frozen = lt >= 3.4;
  const tap = lt >= 6.57 && lt < 10.9 ? (((lt - 6.57) * 3.2) % 1 < .5 ? 'thumb' : 'fist') : null;
  const o = A7.mango(Object.assign(q, { t: lt, look, expr, who: 'mango', stride: 44, plant: true, arms: { l: 'rest', r: tap ? 'down' : 'rest' }, hand: tap ? { r: tap } : undefined,
    twitch: lt >= 3.9 && lt < 10.95, face: frozen ? { curve: 1.25 + .06 * smile } : undefined, sway: frozen ? 0 : .02 * Math.sin(lt * 2) }));
  if (walking) gait(o, MROUTE, 3.0, lt);
  return o;
}
function adminA(lt) {
  const [X, Z] = AROUTE(lt), q = V2.at(X, Z), walking = lt < 3.75;
  const pj = sstep(lt, 8.95, 9.35), on = sstep(lt, 9.21, 9.5), glance = inB(lt, 'a1') && lt > wordT('a1', 'fourteen', 5.81) - .05;
  let look = lt < 3.75 ? [-.7, 0] : [-.7, .02], expr = 'happy';
  if (inB(lt, 'a1')) look = glance ? [-.2, .55] : [-.7, .0];
  if (lt >= 10.4) look = [-.2, 0];
  const o = A9.melon(Object.assign(q, { s: q.s * 1.22, t: lt, look, expr, who: 'melon', plant: true, hold: { l: 'clipboard6', r: pj > .02 ? 'fp13_projector' : undefined }, projOn: on, clipText: 'LOOP',
    arms: { l: 'hold', r: pj > .02 ? 'hold' : 'rest' }, grip: { l: [-104, 74], r: [lerp(88, 104, pj), lerp(110, 30, pj)] } }));
  if (walking) gait(o, AROUTE, 0, lt);
  return o;
}
// ------------------------------------------------------------------ the slide projected on the back wall (A7), and the beam to it
const SLIDE = { x0: -300, x1: 380, y0: 600, y1: 1000 };
function drawSlide(lt, adm) {
  const k = sstep(lt, 9.5, 9.7), fl = .9 + .1 * Math.sin(lt * 61) * (1 - sstep(lt, 9.7, 10.0)), pop = pulse(lt, 10.07, 28, .1);
  if (k <= .01) return;
  const zb = S13.LAY.zb, r = S13.wallBox(zb, SLIDE.x0, SLIDE.y0, SLIDE.x1, SLIDE.y1);
  // the beam from the projector in his hand to the wall, with dust in it, then the picture itself: light on the wall
  const hp = handAt(adm, [104, 30]);
  ctx.save(); ctx.globalAlpha *= k;
  V2.beam(hp[0] - 20, hp[1] - 10, r[0] + r[2] * .5, r[1] + r[3] * .55, 40, r[2] * 1.15, '170,225,255', .22 * fl, 'screen');
  V2.dust(Math.min(hp[0], r[0]) - 40, r[1] + r[3] * .4, Math.max(hp[0], r[0] + r[2]) + 40, hp[1], lt, { n: 46, alpha: .7, size: 3, speed: 12, color: '200,235,255', seed: 21 });
  ctx.translate(r[0] + r[2] / 2, r[1] + r[3] / 2); ctx.scale(1 + .025 * pop, 1 + .025 * pop); ctx.translate(-(r[0] + r[2] / 2), -(r[1] + r[3] / 2));
  const s = UI.sign([r[0], r[1], r[2], r[3]], [{ t: 'SCHEDULES: A JOURNEY', size: 42, weight: 900, fill: '#0f2a4a', gap: 18 }, { t: '3 TO 11', size: 34, weight: 800, fill: '#1c4a7c' }, { t: 'BREAK: PENDING', size: 34, weight: 800, fill: '#b02a37' }, { t: 'DOUBLE SHIFT', size: 34, weight: 800, fill: '#1c4a7c' }],
    { fill: ['#f6fbff', '#d6e9fa'], stroke: '#9fd2ff', lw: 5, r: 10, pad: 22, shadow: 40, shadowColor: 'rgba(150,220,255,.7)', id: 'slide13', alpha: fl });
  for (const b of s.boxes.slice(1)) { ctx.fillStyle = '#1c4a7c'; ell(b.x0 - 24, b.base - b.size * .36, 6, 6); ctx.fill(); }
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = grad(r[0], r[1], r[0], r[1] + r[3], [[0, 'rgba(160,220,255,.22)'], [1, 'rgba(160,220,255,.05)']]); ctx.fillRect(r[0], r[1], r[2], r[3]);
  ctx.restore();
  V2.glow(r[0] + r[2] / 2, r[1] + r[3] / 2, r[2] * .9, '150,215,255', .3 * k * fl, 'screen', .5);
}

// ------------------------------------------------------------------ PLACE A drawing
function drawA(lt, sh) {
  const id = sh.id, t = lt, onSlide = id === 'a7';
  S13.light('dusk', { keyA: .3, shadowA: .42, rimA: .5, back: { color: '255,150,110', a: .26, w: 12 }, frontDark: .05 });
  V2.opts.reflect = true;
  const L = lemonO(lt), M = mangoA(lt), D = adminA(lt);
  const lemonShot = id === 'a0' || id === 'a1' || id === 'a8' || id === 'a9' || id === 'a10';
  const cu = !['a0', 'a3', 'a6', 'a7'].includes(id), dofPx = cu ? 13 : id === 'a3' ? 5 : 0;
  const hide = o => { const f = inFrame(o); return !f.inter || !f.whole; };
  const lemonCU = id !== 'a0' && lemonShot;
  const bg = () => {
    const st = S13.station(lt, { t, sky: .78, ping: -1, min: 15, hr: 7, board: 'schedule', sun: .4, bare: onSlide });
    if (!lemonCU && !(dofPx && hide(L))) (dofPx ? drawBg : drawChar)(L);
    if (!lemonCU) S13.counter({ t, phoneRing: 0, plaque: false });
    S13.lightMap({ ambient: 'rgb(98,92,130)', lights: st.lights });
  };
  if (dofPx) V2.dof(dofPx, bg); else bg();
  if (lemonCU) { drawChar(L); V2.dof(9, () => S13.counter({ t, phoneRing: 0, plaque: false })); }
  if (onSlide) drawSlide(lt, D);
  const front = [[M, id === 'a2' || id === 'a5' || id === 'a3'], [D, id === 'a4' || id === 'a6' || id === 'a3']];
  front.sort((a, b) => a[0].y - b[0].y);
  for (const [o, subject] of front) { if (!subject && hide(o)) continue; drawChar(o); }
  if (!dofPx || id === 'a3') S13.shafts({ a: .06 });
  V2.dust(60, 600, 1020, 1400, t, { n: 22, alpha: .28, seed: 8 });
}

// ------------------------------------------------------------------ PLACE B: the break room door
const FOYS = [-330, 1280];                                                                    /* Strawberry stands left of the door, in the foyer */
function doorOpts(lt) {
  const rel = (a, d) => seg(lt, a, a + d);
  const ok = lt >= 16.12;
  return { t: lt, locks: { reader: rel(16.12, .45), wet: rel(16.50, .30), tape: rel(16.46, .34), bolt1: rel(16.62, .12), bolt2: rel(16.66, .12), padlock: rel(16.87, .1), chain: rel(16.9, .36) }, boltT: [16.62, 16.66],
    shake: { x: 3.2 * pulse(lt, 16.62, 46, .06) + 3.2 * pulse(lt, 16.87, 46, .06), y: 2 * pulse(lt, 16.62, 38, .06) + 2 * pulse(lt, 16.87, 38, .06) },
    ajar: lt >= 17.0 ? .06 + .05 * sstep(lt, 17.0, 17.37) + .12 * sstep(lt, 25.8, 26.6) : 0, dust: sstep(lt, 16.95, 17.3) * (lt < 25.7 ? 1 : 1), rd: { state: lt < 16.06 ? 'idle' : lt < 16.12 ? 'read' : 'ok', k: rel(16.14, .42) } };
}
function strawB(lt, who) {
  const q = V2.at(FOYS[0], FOYS[1]);
  const sr = radioS(lt), badge = sstep(lt, 15.2, 15.45) * (1 - sstep(lt, 16.0, 16.02)), gust = sstep(lt, 25.85, 26.2);
  let look = [.2, 0], expr = 'dead', lid = .42;
  if (inB(lt, 'sr1')) look = lt < wordT('sr1', 'policy', 11.8) ? [.35, .1] : [.55, -.35];     /* the sign: up and to the right */
  if (inB(lt, 'sr2')) { look = [.1, 0]; lid = .5; }
  if (lt >= B('badge').s) look = [.6, .0];
  if (lt >= B('end').s) { look = [.8, 0]; lid = .4; }
  return A11.straw(Object.assign(q, { t: lt, look, expr, lid, who: sr ? 'strawr' : 'straw', plant: true, arms: { l: 'rest', r: badge > .02 ? 'hold' : 'rest' }, hold: { r: badge > .02 ? 'fp13_badge' : undefined }, grip: { r: [lerp(80, 156, badge), lerp(60, -24, badge)] },
    sway: -.05 - .2 * gust + .02 * Math.sin(lt * 3), rot: .01 * Math.sin(lt * 1.4) }));
}
function drawB(lt, sh) {
  const id = sh.id;
  S13.light('foyer', { keyA: .28, shadowA: .42, rimA: .5 });
  V2.opts.reflect = true;
  const dofPx = id === 'b1b' || id === 'b2' ? 12 : 0;
  const bg = () => {
    const f = S13.foyer({ t: lt });
    S13.breakDoor(f.x, f.y, f.k, doorOpts(lt));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.dust(f.x - 300, f.y - 560 * f.k, f.x + 520, f.y, lt, { n: 40, alpha: .5, size: 2.6, speed: 8, color: '210,225,255', seed: 33 }); ctx.restore();
  };
  if (dofPx) V2.dof(dofPx, bg); else bg();
  if (id === 'b1b' || id === 'b2' || id === 'b5') drawChar(strawB(lt));
}
function drawReaderMacro(lt) {
  const u = lt - 16.02, okk = seg(lt, 16.14, 16.56);
  // the wall around the plate, the door frame at the left edge, the cold light
  ctx.fillStyle = grad(0, 0, 0, H, [[0, '#33404c'], [1, '#1d252e']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < H; y += 120) ctx.fillRect(0, y, W, 3);
  ctx.fillStyle = grad(0, 0, 150, 0, [[0, '#5f6674'], [1, '#383d49']]); ctx.fillRect(0, 0, 150, H); ctx.fillStyle = 'rgba(15,12,24,.8)'; ctx.fillRect(146, 0, 5, H);
  V2.glow(540, 700, 700, '120,170,255', .16, 'screen', .4);
  const sh = pulse(lt, 16.62, 46, .06);
  S13.reader(560 + 3 * sh, 800, 3.3, { t: lt, state: lt < 16.06 ? 'idle' : lt < 16.12 ? 'read' : 'ok', k: okk });
  // the badge swipes through the slot (left to right) held by a glove from the lower left
  const slotY = 800 + 56 * 3.3, sw = sstep(lt, 16.04, 16.13), bx = lerp(250, 760, sw), by = slotY - 40;
  const gl = sstep(lt, 16.02, 16.05);
  ctx.save(); ctx.globalAlpha *= gl; ctx.translate(bx, by); ctx.scale(3.3, 3.3);
  V2C.limb([[-2, 52], [-34, 100], [-80, 175]], [12.5, 14.5, 17], LIMB);
  EXT.prop.fp13_badge(1, {}, lt);
  ctx.save(); ctx.translate(2, 40); ctx.rotate(-PI / 2 - .3); ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-18, -8.5, 10, 17, 3); ctx.fill(); V2C.hand('grip', 1, {}); ctx.restore();
  ctx.restore();
  // the beep: a ring from the lamp
  V2.ring(560, 800 - 118 * 3.3, seg(lt, 16.12, 16.5), { r0: 20, r1: 260, lw: 5, alpha: .8, color: '90,255,140' });
}

// ------------------------------------------------------------------ PLACE C: the hall. Banana, the peel, the Administrator.
const PEEL = [95, 1500], SLIP = { peel: 21.185, boing: 21.435, land: 21.96 };
const BROUTE = route([[0, 205, 1650], [20.28, 205, 1650], [21.185, 98, 1520, 'io']]);
const ADROUTE = route([[0, -170, 700], [19.0, -165, 1100], [20.6, -150, 1330], [21.55, -146, 1400, 'out'], [22.9, -146, 1400], [23.5, -70, 1460, 'io']]);
const warp = x => x + .7 * Math.sin(2 * PI * x) / (2 * PI);                                  /* the time-warp: the arc crawls at the top */
function bananaC(lt) {
  const kb = KINDS.banana, s0 = V2.at(0, 1500).s;
  let X, Z = 1500, rot = 0, lift = 0, expr = 'happy', arms = { l: 'rest', r: 'rest' }, look = [-.4, .2], flat = false, sq = 0;
  const inAir = lt >= SLIP.boing && lt < SLIP.land, tau = c01((lt - SLIP.boing) / (SLIP.land - SLIP.boing)), wt = warp(tau);
  if (lt < SLIP.peel) { [X, Z] = BROUTE(lt); expr = lt < 20.2 ? 'happy' : 'sad'; look = lt < 20.28 ? [-.6, .4] : [-.5, .5]; }
  else if (lt < SLIP.boing) { X = 98; Z = 1520; const a = sstep(lt, SLIP.peel, SLIP.boing); rot = .32 * a; lift = 14 * a; expr = 'panic'; arms = { l: 'up', r: 'up' }; look = [0, .3]; }
  else if (inAir) { X = lerp(98, -22, wt); Z = lerp(1520, 1490, wt); rot = lerp(.32, -1.55, easeIO(wt)); lift = 330 * 4 * wt * (1 - wt); expr = 'panic'; arms = { l: 'up', r: 'flail' }; look = [-.3, -.3]; }
  else { X = -22; Z = 1490; flat = true; const b = lt - SLIP.land, bounce = b < .36 ? Math.abs(Math.sin(b / .36 * PI)) * 34 * Math.exp(-b * 4) : 0; rot = -1.55 + .03 * Math.sin(lt * 7) * exp0(b); lift = bounce; expr = lt < 22.7 ? 'panic' : 'sad'; arms = { l: 'rest', r: 'rest' }; look = [.3, .4]; sq = b < .1 ? .12 * (1 - b / .1) : 0; }
  const q = V2.at(X, Z), k = KINDS.banana;
  const drop = flat ? ((k.leg || 90) + k.ry * .9 - k.rx * .86) * q.s : 0;                          /* a body lying down: its centre sinks to half its thickness */
  const o = A7.banana(Object.assign(q, { t: lt, look, expr, who: 'banana', plant: true, rot, lift: flat ? -drop + lift * q.s : lift * q.s, squash: sq, arms, noReflect: flat || inAir, noShadow: flat || inAir, shake: 0 }));
  if (lt < SLIP.peel && lt > 20.28) gait(o, BROUTE, 20.28, lt);
  return o;
}
const exp0 = b => Math.exp(-b * 5);
function adminC(lt) {
  const [X, Z] = ADROUTE(lt), q = V2.at(X, Z), walking = lt < 21.55 || (lt > 22.9 && lt < 23.5);
  const seen = lt >= SLIP.peel + .1, tm = wordT('a3', 'banana', 23.16), form = sstep(lt, 23.55, 23.8);
  let look = [.5, .05], expr = 'happy';
  if (lt >= SLIP.peel + .1) { look = [.8, .3]; expr = 'shock'; }
  if (lt >= 22.7) { look = [.7, .4]; expr = 'sad'; }
  if (lt >= 23.4) { expr = 'happy'; look = [.6, .3]; }
  const o = A9.melon(Object.assign(q, { s: q.s * 1.22, t: lt, look, expr, who: 'melon', plant: true, hold: { l: 'clipboard6' }, clipText: 'FORM', arms: { l: 'hold', r: lt >= 22.85 ? 'point' : 'rest' }, grip: { l: [-104, 74] },
    rot: .02 * Math.sin(lt * 5) * (seen ? 1 : 0), sx: 1 }));
  if (walking) gait(o, ADROUTE, 0, lt);
  return o;
}
function mangoC(lt) {
  const q = V2.at(-215, 1260), click = pulse(lt, 24.95, 30, .09);
  return A7.mango(Object.assign(q, { t: lt, look: [.75, .05], expr: lt >= 24.735 ? 'hopeful' : 'happy', who: 'mango', stride: 44, plant: true, arms: { l: 'rest', r: 'hold' }, hold: { r: 'fp13_clicker' }, clickK: Math.max(0, click), grip: { r: [78, 24] }, twitch: true, face: { curve: 1.2 } }));
}
function peelProp(X, Z, flat = true) {
  const [x, y, k] = V2.proj(X, 0, Z);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(8,6,20,.3)'; ctx.save(); ctx.scale(1, .22); ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); ctx.fill(); ctx.restore();
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,24,6,.85)'; ctx.lineWidth = 3.4;
  for (const [a, c0, c1] of [[-.55, '#ffe66a', '#e0b92a'], [.5, '#ffe135', '#d1a81e'], [0, '#fff08a', '#e8c52e']]) {
    ctx.save(); ctx.rotate(a * .55); ctx.fillStyle = grad(0, -10, 0, 8, [[0, c0], [1, c1]]);
    ctx.beginPath(); ctx.moveTo(-44, -2); ctx.quadraticCurveTo(-30, -24, 0, -18); ctx.quadraticCurveTo(34, -14, 56, 0); ctx.quadraticCurveTo(26, 8, 0, 4); ctx.quadraticCurveTo(-28, 8, -44, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = '#6a4a14'; ctx.beginPath(); ctx.arc(-30, -4, 5, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawC(lt, sh) {
  const id = sh.id;
  S13.light('hall', { keyA: .26, shadowA: .4, rimA: .48 });
  V2.opts.reflect = true;
  const B_ = bananaC(lt), A_ = adminC(lt), M_ = mangoC(lt);
  const cu = id === 'c2' || id === 'c6', dofPx = cu ? 12 : 0;
  const hide = o => { const f = inFrame(o); return !f.inter || !f.whole; };
  const bg = () => { S13.hall({ t: lt, lit: i => i === 7 ? ['255,176,60', .85] : null, fogAmt: .36 }); peelProp(PEEL[0], PEEL[1]); };
  if (dofPx) V2.dof(dofPx, bg); else bg();
  const hero = id === 'c2' ? 'b' : id === 'c6' ? 'm' : id === 'c5' ? 'a' : null;
  const lst = [[B_, hero === 'b' || id === 'c3' || id === 'c4' || id === 'c5' || id === 'c1'], [A_, hero === 'a' || id === 'c3' || id === 'c4' || id === 'c1'], [M_, hero === 'm' || id === 'c6']];
  lst.sort((a, b) => a[0].y - b[0].y);
  for (const [o, subj] of lst) { if (o === M_ && !(id === 'c6')) continue; if (!subj && hide(o)) continue; if (o !== M_ && cu && !subj) continue; drawChar(o); }
  if (id === 'c3' && lt > SLIP.boing && lt < SLIP.land + .3) {   /* the slow-motion: the dust of the landing and a few specks hanging in the air */
    V2.dust(0, 500, W, 1300, lt * .35, { n: 40, alpha: .6, size: 3.2, speed: 6, color: '255,244,214', seed: 77 });
  }
  if (lt >= SLIP.land && lt < SLIP.land + .6) { const k = seg(lt, SLIP.land, SLIP.land + .6), p = V2.p2(-22, 20, 1490); V2.ring(p[0], p[1], k, { r0: 20, r1: 300, lw: 8, alpha: .5, color: '255,240,210' }); V2.dust(p[0] - 260, p[1] - 160, p[0] + 260, p[1] + 30, lt, { n: 30, alpha: .8 * (1 - k), size: 4, speed: 20, color: '255,236,200', seed: 5 }); }
}

// ------------------------------------------------------------------ cameras
function setCamera(lt) {
  const sh = shotAt(lt), id = sh.id, u = seg(lt, sh.t0, Math.min(sh.t1, sh.t0 + 3));
  const sway = { x: 2 * hnoise(lt, 1.3, 1), y: 1.5 * hnoise(lt, 1.1, 2), r: .0012 * hnoise(lt, .9, 3) };
  const wh = whip(lt);
  if (id === 'a0') { S13.cam('station', { f: 1000, cz: lerp(40, 260, easeOut(u / 1)), cy: 330 }); zoomTo(540, 830, 1); }
  else if (id === 'a1' || id === 'a8' || id === 'a9' || id === 'a10') { S13.cam('station', { cz: 900 + 60 * easeOut(u) }); faceZoom({ kind: 'lemon', x: V2.at(LEM_P[0], LEM_P[1]).x, y: V2.p2(LEM_P[0], SEAT, LEM_P[1])[1], s: V2.at(LEM_P[0], LEM_P[1]).s, noLegs: true }, 1.0, 190); CAM.x -= 20 / CAM.z; }
  else if (id === 'a2' || id === 'a5') { S13.cam('station', { cz: 640 + 60 * easeOut(u) }); faceZoom(mangoA(lt), 1.0, 200); }
  else if (id === 'a3') { S13.cam('station', { f: 1150, cz: lerp(150, 260, easeOut(u)) }); frameGroup([[V2.at(-170, 1250, { kind: 'mango' }), 40], [V2.at(235, 1250, { kind: 'melon', s: V2.at(235, 1250).s * 1.22 }), 70]], { mx: 70, ty: 900 }); }
  else if (id === 'a4') { S13.cam('station', { cz: 520 + 50 * easeOut(u) }); faceZoom(adminA(lt), 1.0, 210); }
  else if (id === 'a6') { S13.cam('station', { f: 1150, cz: 330 }); frameGroup([[adminA(lt), 90]], { mx: 140, ty: 840, hMax: 1100 }); }
  else if (id === 'a7') { S13.cam('station', { f: 1100, cz: lerp(330, 380, u) }); zoomTo(540, 960, 1); }
  else if (id === 'b1a' || id === 'b4') { S13.cam('foyer', { cz: 380 }); const p = V2.proj(0, 252, S13.FOY.zb), z = 1.1; zoomTo(p[0] + (540 - 440) / z, p[1] + (960 - 800) / z, z); }
  else if (id === 'b1b' || id === 'b2') { S13.cam('foyer', { cz: 640 + 40 * easeOut(u) }); faceZoom(strawB(lt), 1.0, 200); CAM.x -= (id === 'b2' ? 40 : 0) / CAM.z; }
  else if (id === 'b3') { zoomTo(540, 960, 1); }
  else if (id === 'b5') { S13.cam('foyer', { cz: lerp(-60, 60, easeOut(u / 1)) }); const p = V2.proj(0, 252, S13.FOY.zb); zoomTo(p[0] - 150, p[1] + 140, 1); }
  else if (id === 'c1') { S13.cam('hall', { f: 1200, cz: lerp(-120, 60, easeOut(u)) }); zoomTo(540, 880, 1); }
  else if (id === 'c2') { S13.cam('hall', { cz: 900 }); faceZoom(bananaC(lt), 1.0, 200); }
  else if (id === 'c3') { S13.cam('hall', { f: 1250, cz: lerp(260, 380, u) }); zoomTo(540, 860, 1 + .05 * sstep(lt, SLIP.boing, SLIP.land)); }
  else if (id === 'c4') { S13.cam('hall', { f: 1250, cz: 540, cy: 150, hy: 880 }); zoomTo(540, 960, 1); }
  else if (id === 'c5') { S13.cam('hall', { f: 1250, cz: 520 }); frameGroup([[adminC(lt), 60], [bananaC(lt), 50]], { mx: 70, ty: 860, hMax: 1100 }); }
  else if (id === 'c6') { S13.cam('hall', { cz: 640 }); faceZoom(mangoC(lt), 1.0, 200); }
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
  if (wh.px > 0) CAM.r += .012 * wh.dir * (wh.px / 300);
}

// ------------------------------------------------------------------ the HUD (device space, in over()): the radio tag, the ADMIN LOOP chip, the INCIDENTS chip. The tag follows the hall scene exactly.
const RADIO = [['lr1', 'LEMON', 'lemonr'], ['sr1', 'STRAWBERRY', 'strawr'], ['lr2', 'LEMON', 'lemonr'], ['sr2', 'STRAWBERRY', 'strawr'], ['lr3', 'LEMON', 'lemonr'], ['lr4', 'LEMON', 'lemonr']];
function radioTag(lt) {
  const W_ = RADIO.map(([id, name, who]) => ({ id, name, who, s: B(id).s, e: B(id).e }));
  for (let i = 0; i < W_.length; i++) {
    const w = W_[i], nx = W_[i + 1];
    w.in0 = w.s - .1; w.in1 = w.s; w.out0 = w.e; w.out1 = w.e + .2;
    if (nx && nx.s - .1 < w.out1 + .02) { const mid = (w.e + nx.s) / 2; w.out1 = mid - .01; nx.in0 = mid + .01; }
  }
  for (const w of W_) {
    const a = sstep(lt, w.in0, w.in1) * (1 - sstep(lt, w.out0, w.out1));
    if (a <= .01) continue;
    const str = 'RADIO / ' + w.name, size = UI.sizeOf(str, { size: 30, weight: 900, spacing: 2 }), pw = size.w + 2 * 76;
    return { w, a, str, rect: [1034 - pw, 118, 1034, 182] };
  }
  return null;
}
function wave(cx, cy, mirror, lvl) {
  for (let i = 0; i < 5; i++) {
    const hh = 6 + 30 * c01(lvl * (.45 + .55 * Math.abs(Math.sin(T * 19 + i * 1.7 + (mirror ? 1.1 : 0)))));
    ctx.fillStyle = CYAN; rr(cx + (mirror ? -1 : 1) * i * 9 - 2.5, cy - hh / 2, 5, hh, 2.5); ctx.fill();
  }
}
function overRadio(lt) {
  const rt = radioTag(lt); if (!rt) return;
  const o = { anchor: 'right', h: 64, size: 30, weight: 900, spacing: 2, ink: '#d9fbff', fill: GLASS, stroke: CYAN, lw: 3, padX: 76, alpha: rt.a, talpha: rt.a };
  const p = UI.pill(rt.str, 1034, 150, o);
  reg('overlay', [p.x0, p.y0, p.x1, p.y1], { id: 'radiotag' });
  const lvl = talk(rt.w.who);
  ctx.save(); ctx.globalAlpha *= rt.a; wave(p.x0 + 26, 150, false, lvl); wave(p.x1 - 26, 150, true, lvl); ctx.restore();
}
const LOOP0 = 25.2, HOLD_T = 22.09;
function overChip(lt) {
  const a = sstep(lt, .22, .38) * (1 - sstep(lt, 26.45, 26.8)); if (a <= .01) return;
  const hold = lt >= HOLD_T, val = hold ? LOOP0 - HOLD_T : Math.max(0, LOOP0 - lt), sec = Math.floor(val + 1e-6), dec = Math.floor((val - sec) * 10 + 1e-6);
  const col = hold ? '#5cff9a' : val < 5 ? RED : val < 12 ? GOLD : CYAN, blink = !hold && val < 5 ? (Math.sin(lt * 14) > -.3 ? 1 : .55) : 1;
  const lab = UI.sizeOf('ADMIN LOOP', { size: 26, weight: 900, spacing: 2 }), chars = ['0', ':', Math.floor(sec / 10), sec % 10, '.', dec], cw2 = c => (c === ':' || c === '.') ? 11 : 21, tw = chars.reduce((q, c) => q + cw2(c), 0);
  const w = 26 + lab.w + 22 + tw + 24, h = 56, x0 = 1034 - w, y0 = 198;
  ctx.save(); ctx.globalAlpha *= a;
  const pan = UI.panel([x0, y0, w, h], { id: 'adminchip', kind: 'pill', fill: GLASS, stroke: col, lw: 3, r: h / 2, pad: 12 });
  reg('overlay', [x0, y0, x0 + w, y0 + h], { id: 'adminchip' });
  UI.label('ADMIN LOOP', x0 + 26, y0 + h / 2, { size: 26, weight: 900, spacing: 2, fill: hold ? '#b8ffd2' : '#d9fbff', align: 'left', cid: 'adminchip', center: false });
  // the countdown in fixed cells so the digits never shuffle: m ss . t  (0:03.1)
  let xx = x0 + w - 24 - tw;
  for (const c of chars) { UI.label(String(c), xx + cw2(c) / 2, y0 + h / 2, { size: 34, weight: 900, fill: col, cid: 'adminchip', center: false, alpha: blink }); xx += cw2(c); }
  ctx.restore();
}
function overIncidents(lt) {
  const a = sstep(lt, 20.95, 21.12) * (1 - sstep(lt, 25.1, 25.4)); if (a <= .01) return;
  const roll = sstep(lt, 22.09, 22.4), pop = 1 + .06 * pulse(lt, 22.09, 24, .12), x0 = 48, y0 = 300, w = 372, h = 72;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x0 + w / 2, y0 + h / 2); ctx.scale(pop, pop); ctx.translate(-(x0 + w / 2), -(y0 + h / 2));
  UI.panel([x0, y0, w, h], { id: 'incchip', kind: 'pill', fill: GLASS, stroke: roll > 0 && roll < 1 ? RED : GOLD, lw: 3, r: h / 2, pad: 12 });
  reg('overlay', [x0, y0, x0 + w, y0 + h], { id: 'incidents' });
  UI.label('INCIDENTS', x0 + 30, y0 + h / 2, { size: 30, weight: 900, spacing: 3, fill: '#fff3c8', align: 'left', cid: 'incchip', center: false });
  const cx = x0 + w - 62, cy = y0 + h / 2, cw = 70, ch = 54;
  ctx.save(); rr(cx - cw / 2, cy - ch / 2, cw, ch, 10); ctx.fillStyle = '#1b1d26'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.stroke(); ctx.clip();
  const rolling = roll > 0 && roll < 1, e = easeIO(roll);
  const dig = (n, off) => UI.label(String(n), cx, cy + off, { size: 46, font: 'Bangers', weight: 400, fill: '#ffe135', crop: rolling, cid: rolling ? undefined : 'incchip', center: false });
  if (rolling) { dig(47, -e * ch); dig(48, (1 - e) * ch); } else dig(roll >= 1 ? 48 : 47, 0);
  ctx.restore(); ctx.restore();
}
// the whip: a sideways smear of the finished picture, strongest at the cut (skipped in the text gate's mask pass, which needs the exact pixels)
const SMEAR = V2.mk(W, H), SMX = SMEAR.getContext('2d');
function smear(px) {
  if (px < 4 || TXA.mask) return;
  SMX.setTransform(1, 0, 0, 1, 0, 0); SMX.globalCompositeOperation = 'copy'; SMX.drawImage(canvas, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const n = 11; for (let i = 0; i < n; i++) { ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(SMEAR, (i / (n - 1) - .5) * 2 * px, 0); }
  ctx.restore();
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotAt(lt).id,
  noScrim: false,
  cam(lt) { setCamera(lt); },
  draw(lt) {
    const sh = shotAt(lt);
    if (sh.id === 'b3') drawReaderMacro(lt); else if (sh.pl === 'A') drawA(lt, sh); else if (sh.pl === 'B') drawB(lt, sh); else drawC(lt, sh);
  },
  fx(lt) {
    const sh = shotAt(lt), sting = lt >= 25.8 ? Math.exp(-(lt - 25.8) / .12) : 0, slow = sstep(lt, SLIP.boing - .05, SLIP.boing + .1) * (1 - sstep(lt, SLIP.land, SLIP.land + .2)) * (sh.id === 'c3' ? 1 : 0);
    if (sh.pl === 'B') return { bloom: .45 + .5 * sting, vignette: .58, grain: .05, contrast: .22, sat: .02, tint: [['#6f8cff', .14, 'soft-light']], aberr: 8 * sting };
    if (sh.pl === 'C') return { bloom: .5 + .3 * slow, vignette: .5 + .1 * slow, grain: .05, contrast: .18 + .08 * slow, sat: .08 + .1 * slow, tint: [['#a8c8ff', .1, 'soft-light'], ['#ffb870', .08 * slow, 'soft-light']] };
    return { bloom: .45, vignette: .48, grain: .05, contrast: .18, sat: .1, tint: [['#9fb8ff', .1, 'soft-light'], ['#ffb070', .06, 'soft-light']] };
  },
  blur: lt => 1,
  over(lt) {
    smear(whip(lt).px);
    overIncidents(lt); overChip(lt); overRadio(lt);
    if (lt >= 25.8) { const f = Math.exp(-(lt - 25.8) / .08); if (f > .02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,225,255,${.5 * f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  },
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.cross = SC;
})();
