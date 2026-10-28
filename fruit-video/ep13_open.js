'use strict';
/* SHIFT HAPPENS, Episode 13: "The Float Pool". Scene module: open (7:02 PM, THE NURSES' STATION, 26.29 s). Scene builder E13-B.
 *
 * A heist film opens on a quiet station at dusk. The set is the shared kit ep13_station.js (window.S13): a wide back wall with the BREAKS TAKEN TODAY board (0), the Q-word sign, the clock, the
 * schedule whiteboard, a window with the low sun, a call-light board and, at the far left, a doorway down a long hall (one dome in it dings at 0.25). The cast: Strawberry (per diem) at the med cart
 * with an untouched granola bar, Lemon seated behind the counter with a chart, Mango who arrives out of the hall.
 *
 * SHOT LIST (scene-local seconds; every cut is a hard cut with blur 1 on its frame)
 *   0.00-5.84   open, n1   WIDE establishing: a real dolly-in (the camera moves, so the foreground gains on the wall), fade up from black, the far dome dings (0.25), the desk phone lamp blinks, the
 *                          clock ticks to 7:02 on "Seven oh two", Strawberry sags on "Hour four".
 *   5.84-7.50   s1         CU Strawberry (a dolly CU: the neighbours are out of frame), a slow push: "I haven't sat down since three." Her eyes go to the chair on "sat down".
 *   7.50-8.70   l1         CU Lemon, flat: "You have a break." She looks up over her readers and does not blink.
 *   8.70-9.25   s2         CU Strawberry: "Where?" eyes dart round the room.
 *   9.25-10.70  l2         CU Lemon: "It's on the schedule." She flicks the printout at the lens; it grows and becomes the insert.
 *   10.70-12.58 sched      INSERT, flat: the schedule printout, a table; the BREAK row carries a faded PENDING stamp and "(since 2019)"; a finger taps it (0.95) and the dust puffs (1.05).
 *   12.58-13.60 s3         CU Strawberry with the printout: "It says pending." Mango is a small blurred figure far down the hall behind her.
 *   13.60-15.70 m1         TWO-SHOT (dolly back, zoom 1.4): Mango walks out of the hall doorway and arrives beside Strawberry: "It's said pending since the merger."
 *   15.70-17.42 l3         CU Lemon, she stands: "So we're not asking for it."
 *   17.42-18.50 s4         CU Strawberry, the smirk grows: "We're taking it."
 *   18.50-20.32 l4         CU Lemon (a slow push): "Thirty minutes. Uninterrupted."
 *   20.32-21.22 l4         INSERT: "One chair." A lone chair in the last shaft of the window light, dust in it.
 *   21.22-23.40 m2         CU Mango: "That's not a break. That's a heist." Her eyes light up. (Lemon walks round the counter off screen.)
 *   23.40-24.89 l5         THREE-SHOT, a dolly in: "Then we'll need a crew."
 *   24.89-26.29 end        FREEZE FRAME on the three faces: a record scratch (flash, aberration), the picture stops, a red-tinted spotlight closes on them. Held to the end of the scene.
 *
 * Layout (world X, Z): the camera is at Z 0 looking along +Z (S13.cam('station')); back wall Z 1900; Strawberry (60, 1250), the cart (-60, 1420), Lemon seated at (420, 1600) behind the counter, Mango's
 * arrival route from (-520, 2900) through the doorway (-490, 1900) to (-290, 1220); in the last two shots Lemon has come round the counter to (-90, 1200): the huddle is Mango, Lemon, Strawberry.
 * Close-ups are DOLLY close-ups (cz 700 to 1000): the neighbours leave the frame by parallax. A character is never drawn partly in a frame: it is either entirely inside or left out.
 * Text: only the schedule insert (UI.page / UI.table / UI.stamp) and the kit's boards. Fonts: Nunito, Bangers. */
(() => {
if (!window.TIMELINE_EP13) return;
const { zoomTo, faceZoom, drawBg, localOf } = window.H6;
const A7 = window.A7, A11 = window.A11, S13 = window.S13;
const { sfxWord, wordT, route, pulse, sk } = S13;
const { grad, radial } = V2;
const inB = (lt, id) => lt >= B(id).s && lt < B(id).e;
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);

// ------------------------------------------------------------------ the cast: where they stand (world X, Z)
const POS = { straw: [60, 1250], strawEnd: [150, 1240], cart: [-60, 1330], chair: [250, 1290], lemon: [470, 1600], mango: [-250, 1220], lemonEnd: [-50, 1185] };
const SEAT = 96;                                                   /* Lemon's seat height: a seated body rests on it, the counter hides everything below its top */
// Mango: out of the hall, through the doorway (the wall is at Z 1900), across the room to her place beside Strawberry
const MROUTE = route([[11.2, -520, 2900], [13.55, -490, 1900], [14.6, -380, 1520, 'io'], [15.35, POS.mango[0], POS.mango[1], 'io']]);
// Lemon walks round the counter's left end while the camera is on Mango (m2), then forward to the huddle
const LROUTE = route([[21.30, POS.lemon[0], POS.lemon[1]], [22.25, -290, 1580, 'io'], [22.65, -290, 1400], [23.25, POS.lemonEnd[0], POS.lemonEnd[1], 'io']]);
const SROUTE = lt => [lerp(POS.straw[0], POS.strawEnd[0], sk(lt, 21.3, 23.0)), lerp(POS.straw[1], POS.strawEnd[1], sk(lt, 21.3, 23.0))];
const LWALK = lt => lt >= 21.30;

const SHOTS = [
  { id: 'wide', t0: 0, t1: 5.84 },
  { id: 's1', t0: 5.84, t1: 7.50 }, { id: 'l1', t0: 7.50, t1: 8.70 }, { id: 's2', t0: 8.70, t1: 9.25 }, { id: 'l2', t0: 9.25, t1: 10.70 },
  { id: 'sched', t0: 10.70, t1: 12.58 },
  { id: 's3', t0: 12.58, t1: 13.60 }, { id: 'two', t0: 13.60, t1: 15.70 }, { id: 'l3', t0: 15.70, t1: 17.42 }, { id: 's4', t0: 17.42, t1: 18.50 },
  { id: 'l4', t0: 18.50, t1: 20.32 }, { id: 'chair', t0: 20.32, t1: 21.22 }, { id: 'm2', t0: 21.22, t1: 23.40 }, { id: 'three', t0: 23.40, t1: 24.89 }, { id: 'freeze', t0: 24.89, t1: 99 },
];
const shotAt = lt => SHOTS.find(s => lt < s.t1) || SHOTS[SHOTS.length - 1];
const FREEZE_T = SHOTS[SHOTS.length - 1].t0;                        /* every animation clock stops here */
const ftime = lt => Math.min(lt, FREEZE_T);

// ------------------------------------------------------------------ the characters' acting (options for drawChar, in the camera that is set when this runs)
function strawO(lt) {
  const t = ftime(lt), b = id => B(id), [X, Z] = SROUTE(lt), q = V2.at(X, Z);
  const reading = lt >= b('l2').e - .25 && lt < b('l3').s;                                   /* she holds the printout while she reads it */
  const glance = lt >= .25 && lt < 1.2, sat = inB(lt, 's1') && lt > wordT('s1', 'sat', 6.3) - .1;
  const darts = inB(lt, 's2') ? [Math.sin(seg(lt, b('s2').s, b('s2').e) * 9.4) * .95, -.05 + .15 * Math.sin(lt * 20)] : null;
  let look = [-.15, .35], expr = 'dead', lid = .5;
  if (glance) look = [-.9, -.1];
  else if (lt < b('s1').s) look = [-.2 + .1 * Math.sin(t * .7), .45];                            /* down at the granola bar */
  if (inB(lt, 's1')) { look = sat ? [.95, .3] : [-.2, .25]; lid = sat ? .6 : .48; }               /* "sat down": her eyes go to the chair, on her right */
  if (lt >= b('l1').s && lt < b('s2').s) { look = [.9, .1]; lid = .5; }                          /* at Lemon, in the reaction */
  if (darts) { look = darts; expr = 'sour'; lid = .15; }
  if (lt >= b('s2').e && lt < b('s3').s) { look = [.8, .25]; lid = .5; }
  if (inB(lt, 's3')) { look = lt < b('s3').s + .5 ? [-.9, .4] : [.05, .1]; lid = .42; }
  if (lt >= b('s3').e && lt < b('l3').s) { look = [-.9, .05]; lid = .5; }                        /* watches Mango arrive */
  if (lt >= b('l3').s && lt < b('s4').s) { look = [.8, .1]; expr = 'sour'; lid = .3; }
  if (inB(lt, 's4')) { look = [.1, .05]; expr = 'smug'; lid = .3; }
  if (lt >= b('s4').e) { look = [.7, .05]; expr = 'smug'; lid = .32; }
  if (lt >= b('m2').s) { look = [-.75, .0]; expr = 'smug'; lid = .32; }
  if (lt >= b('l5').s) { look = [.5, .05]; expr = 'smug'; lid = .28; }
  if (lt >= B('end').s - .15) { look = [.05, .0]; expr = 'smug'; lid = .3; }                        /* the freeze: straight at us */
  // a tired sway, a sag on "Hour four.", her weight moving from foot to foot
  const hr = wordT('n1', 'hour', 4.77), sag = sk(lt, hr, hr + .5) * (1 - sk(lt, 5.7, 6.1));
  // "We're taking it.": a nod and the granola bar raised like a toast; for the huddle the bar comes in to her belly (while the camera is on Mango)
  const tk = wordT('s4', 'taking', 17.7), toast = sk(lt, tk - .06, tk + .18) * (1 - sk(lt, tk + .5, tk + .8)), nod = Math.sin(seg(lt, tk - .05, tk + .35) * PI), hug = sk(lt, 21.3, 21.7);
  const o = A11.straw(Object.assign(q, { t, look, expr, lid, who: 'straw', arms: { l: reading ? 'hold' : 'hips', r: 'hold' }, rot: .018 * Math.sin(t * 1.1) + .01 * sag + .03 * nod, squash: .06 * sag, plant: true, sway: .05 * Math.sin(t * 1.7) - .05 * sag,
    hold: { r: 'fp13_granola', l: reading ? 'fp13_paper' : undefined }, grip: { r: [lerp(112, 66, hug), lerp(2, 58, hug) - 52 * toast], l: [-142, 56] }, browUp: inB(lt, 's2') ? 11 : 0 }));
  return o;
}
function lemonO(lt) {
  const t = ftime(lt), b = id => B(id), walking = LWALK(lt);
  const [X, Z] = walking ? LROUTE(lt) : POS.lemon, q = V2.at(X, Z);
  const stand = sk(lt, b('l3').s - .2, b('l3').s + .25), pop = Math.sin(seg(lt, b('l3').s - .2, b('l3').s + .45) * PI);
  let look = [-.5, .75], expr = 'neutral', lid = .15;
  if (lt < .25) look = [-.35, .8];
  if (lt >= .25 && lt < .55) look = [-.2, .9];                                                   /* a flick at the phone, then she ignores it */
  if (lt >= b('l1').s - .05) { look = [-.7, .05]; lid = .3; }                                    /* up over the readers, flat */
  if (inB(lt, 'l2')) { look = [-.75, .02]; lid = .28; }
  if (lt >= b('l2').e) { look = [-.85, .05]; lid = .3; }
  if (inB(lt, 'l3')) { look = [-.6, .1]; expr = 'smug'; lid = .35; }
  if (inB(lt, 'l4')) { look = [-.5, .05]; expr = 'neutral'; lid = .25; }
  if (lt >= b('l5').s - .1) { look = [.2, 0]; expr = 'smug'; lid = .25; }
  if (lt >= B('end').s - .15) { look = [0, 0]; expr = 'smug'; lid = .3; }
  const seatY = V2.p2(X, SEAT + 34 * stand, Z)[1];
  // the pen: scribbling on the chart, one click on "break", then the printout comes up in the same hand and is flicked at the lens at the end of l2
  const brk = wordT('l1', 'break', 8.15), writing = lt < b('l1').s - .1 ? 1 : 0, click = pulse(lt, brk, 30, .06);
  const outX = sk(lt, b('l2').s + .12, b('l2').s + .42), paperUp = sk(lt, b('l2').s + .42, b('l2').s + .72), flickT = FLICK_T, flick = sk(lt, flickT - .1, flickT), gone = lt >= flickT;
  const gr = [96 + 5 * Math.sin(t * 9) * writing + 54 * outX + 6 * flick, 22 + 3 * Math.sin(t * 13) * writing + 7 * click - 30 * paperUp - 20 * flick];
  const o = A7.lemon(Object.assign(q, walking ? { stride: 40 } : { y: seatY, noLegs: true, noShadow: true }, {
    t, look, expr, lid, who: 'lemon', acc: ['readers', 'lanyard7'], face: { curve: .02 }, rot: -.015 * pop, sy: 1 + .05 * pop, plant: true,
    arms: { l: 'hold', r: 'hold' }, hold: { l: 'clipboard6', r: outX > .98 ? (gone ? undefined : 'fp13_paper') : lt < b('l3').s ? 'pen' : undefined }, grip: { l: [-100, 20], r: gr }, clipText: 'CHART' }));
  if (lt > b('l3').s + .2) { o.hold = {}; o.grip = {}; o.arms = { l: 'rest', r: 'rest' }; }
  if (walking) { const v = LROUTE(lt + .04), w = LROUTE(lt - .04), sp = Math.hypot(v[0] - w[0], v[1] - w[1]) / .08; if (sp > 12) { const axisZ = Math.abs(v[1] - w[1]) > Math.abs(v[0] - w[0]) * 1.2; o.gaitW = pathD(LROUTE, 21.30, lt); o.axis = axisZ ? 'z' : 'x'; o.dir = axisZ ? -Math.sign(v[1] - w[1]) : Math.sign(v[0] - w[0]); } }
  return o;
}
const FLICK_T = 10.30;                                              /* Lemon throws the printout at the lens (the end of l2) */
function mangoO(lt) {
  const t = ftime(lt), b = id => B(id), [X, Z] = lt >= 15.35 ? POS.mango : MROUTE(lt), q = V2.at(X, Z);
  const walking = lt < 15.35 && lt > 11.2, heist = wordT('m2', 'heist', 22.7), tp = wordT('m1', 'pending', 14.16), tm = wordT('m1', 'merger', 15.04), nt = wordT('m2', 'not', 21.55), brk = wordT('m2', 'break', 21.89);
  let look = [.6, 0], expr = 'happy';
  if (walking) look = [.7, .05];
  if (inB(lt, 'm1')) look = lt < 14.9 ? [.8, .05] : [.5, 0];
  if (lt >= b('m1').e) look = [.7, 0];
  if (inB(lt, 'm2')) { look = lt < heist - .2 ? [.5, 0] : [0, 0]; expr = lt < heist - .2 ? 'neutral' : 'hopeful'; }
  if (lt >= b('l5').s) { look = [.7, 0]; expr = 'hopeful'; }
  // her hands: an open palm toward the printout on "pending", a shrug on "merger"; in her close-up a wagging finger on "not a break", both fists up at her chin on "heist"
  let arms = { l: 'rest', r: 'rest' }, hand, hop = 0, rot = 0;
  if (inB(lt, 'm1')) { if (lt >= tp - .12 && lt < tm - .2) arms = { l: 'rest', r: 'offer' }; else if (lt >= tm - .2) arms = { l: 'shrug', r: 'shrug' }; }
  if (inB(lt, 'm2')) {
    const wag = Math.sin((lt - nt) * 15);
    if (lt >= nt - .1 && lt < heist - .25) { arms = { l: 'rest', r: [.9, 1.95 + .32 * wag] }; hand = { r: 'point' }; rot = .035 * Math.sin((lt - nt) * 7.5) * (lt < brk + .5 ? 1 : .3); }
    else if (lt >= heist - .25) { const f = sk(lt, heist - .25, heist + .05); arms = { l: [lerp(.28, .55, f), lerp(.25, 2.85, f)], r: [lerp(.28, .55, f), lerp(.25, 2.85, f)] }; hand = { l: 'fist', r: 'fist' }; hop = 26 * Math.max(0, Math.sin(seg(lt, heist - .05, heist + .3) * PI)); }
  }
  const o = A7.mango(Object.assign(q, { t, look, expr, who: 'mango', stride: 44, arms, hand, rot, lift: hop, plant: true, sparkle: lt >= heist - .1 }));
  if (walking) { const a = MROUTE(lt + .04), c = MROUTE(lt - .04); o.gaitW = pathD(MROUTE, 11.2, lt); o.axis = Math.abs(a[1] - c[1]) > Math.abs(a[0] - c[0]) * 1.2 ? 'z' : 'x'; o.dir = o.axis === 'z' ? -1 : 1; }
  return o;
}
// distance walked along a route fn from t0 to t (world units: drives the gait so the feet do not slide)
function pathD(fn, t0, t) { let d = 0, p = fn(t0); for (let u = t0 + .04; ; u += .04) { const tt = Math.min(u, t), qq = fn(tt); d += Math.hypot(qq[0] - p[0], qq[1] - p[1]); p = qq; if (tt >= t) break; } return d; }

// ------------------------------------------------------------------ cameras
// dolly close-ups: cz, and where the face sits (up = how many px above the centre of the frame)
const CU = { s1: { cz: 700, up: 200 }, s2: { cz: 700, up: 200 }, s3: { cz: 600, up: 200, dx: 40 }, s4: { cz: 700, up: 200 }, l1: { cz: 1000, up: 190 }, l2: { cz: 1000, up: 190, dx: -35 }, l3: { cz: 1000, up: 190 }, l4: { cz: 1000, up: 190 }, m2: { cz: 700, up: 200 } };
// the screen box of a character in unzoomed picture space (padded sideways for what it holds): the camera frames a group from these
function boxOf(o, pad = 0) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * 1.12 + pad) * s;
  return [o.x - half, top, o.x + half, o.y + 24 * s];
}
// zoom and centre so that a group fits the frame with margin mx; ty = where the middle of the group's box lands (screen y)
function frameGroup(list, o = {}) {
  const bs = list.map(([q, pad]) => boxOf(q, pad)), x0 = Math.min(...bs.map(v => v[0])), x1 = Math.max(...bs.map(v => v[2])), y0 = Math.min(...bs.map(v => v[1])), y1 = Math.max(...bs.map(v => v[3]));
  const z = Math.min((W - 2 * (o.mx ?? 80)) / (x1 - x0), (o.hMax ?? 1200) / (y1 - y0), o.zMax ?? 3) * (o.k ?? 1), cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * (o.at ?? .5);
  zoomTo(cx, cy + (960 - (o.ty ?? 760)) / z, z);
  return z;
}
function setCamera(lt) {
  const sh = shotAt(lt), id = sh.id, t = ftime(lt), u = seg(lt, sh.t0, sh.t1);
  const sway = { x: 2.2 * hnoise(t, 1.3, 1), y: 1.6 * hnoise(t, 1.1, 2), r: .0015 * hnoise(t, .9, 3) };
  if (id === 'wide') {
    const e = easeIO(seg(lt, .2, 5.84));
    S13.cam('station', { f: 1000, cz: lerp(-80, 480, e), cx: lerp(-30, 10, e), cy: lerp(420, 330, e) }); zoomTo(540, lerp(840, 800, e), 1);
  } else if (id === 'sched') {
    const z = 1 + .05 * seg(lt, sh.t0, sh.t1);
    S13.cam('station', { cz: -170 }); zoomTo(540, 850 + (960 - 850) / z, z);
  } else if (id === 'chair') {
    S13.cam('station', { cz: lerp(700, 800, easeOut(u)), cy: 150, hy: 760, cx: POS.chair[0] }); zoomTo(540, 960, 1);
  } else if (id === 'two') {
    S13.cam('station', { f: 1150, cz: lerp(120, 300, easeOut(u)) });
    frameGroup([[V2.at(POS.mango[0], POS.mango[1], { kind: 'mango' }), 30], [V2.at(POS.straw[0], POS.straw[1], { kind: 'straw' }), 80]], { mx: 70, ty: 930 });
  } else if (id === 'three' || id === 'freeze') {
    const k = id === 'freeze' ? 1 : easeIO(u);
    S13.cam('station', { f: 1100, cz: id === 'freeze' ? 380 + 14 * easeOut(seg(lt, FREEZE_T, FREEZE_T + 1.4)) : lerp(-100, 380, k), cx: lerp(-80, -48, k) });
    zoomTo(540, 905, id === 'freeze' ? 1 + .02 * easeOut(seg(lt, FREEZE_T + .05, FREEZE_T + 1.4)) : 1);
  } else {
    const c = CU[id], push = easeOut(u) * 70;
    S13.cam('station', { cz: c.cz + push });
    const o = id[0] === 's' ? strawO(lt) : id[0] === 'l' ? lemonAnchor(lt) : mangoO(lt);
    faceZoom(o, 1.0, c.up); CAM.x -= (c.dx || 0) / CAM.z;
  }
  CAM.x += sway.x; CAM.y += sway.y; CAM.r += sway.r;
}
// the camera for Lemon's close-ups holds her SEATED position, so when she stands she rises in the frame (it does not follow her up)
function lemonAnchor(lt) { const [X, Z] = POS.lemon, q = V2.at(X, Z); return { kind: 'lemon', x: q.x, y: V2.p2(X, SEAT, Z)[1], s: q.s, noLegs: true }; }

// ------------------------------------------------------------------ drawing
// is this character entirely inside the frame? A figure that would be cut by the frame edge is left out of the shot instead (no sliver, no blurred shoulder).
function inFrame(o) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, bot = o.y + 24 * s, half = k.rx * 1.12 * s;
  const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(o.x - half, top), p(o.x + half, top), p(o.x - half, bot), p(o.x + half, bot)], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 8 && x1 <= W - 8 && y0 >= 8, box: [x0, y0, x1, y1] };
}

function drawScene(lt) {
  const sh = shotAt(lt), id = sh.id, t = ftime(lt);
  if (id === 'sched') { drawSched(lt); return; }
  if (id === 'chair') { drawChairInsert(lt); return; }
  const strawShot = id[0] === 's', lemonShot = id[0] === 'l' && id.length === 2, mangoShot = id === 'm2';
  const dofPx = id === 'wide' || id === 'three' || id === 'freeze' ? 0 : id === 'two' ? 5 : 13;
  S13.light('evening', { keyA: .34, shadowA: .42, rimA: .5, back: { color: '255,176,110', a: .28, w: 12 }, frontDark: .05 });
  V2.opts.reflect = true;
  const sky = .35 * seg(t, 0, 5.84) + .27 * seg(t, 5.84, 25), ping = t > .25 ? t - .25 : -1;
  const tw = wordT('n1', 'two', 3.9), min = 1 + easeBack(seg(t, tw, tw + .2));
  const S = strawO(lt), L = lemonO(lt), M = mangoO(lt);
  const hide = o => { const f = inFrame(o); return !f.inter || !f.whole; };
  const mangoInHall = lt < 13.55 && lt > 11.2;
  // ---- the background block: the room (blurred in close-ups), the cart, the chair and whoever is not the subject
  const bgBlock = () => {
    const st = S13.station(lt, { t, sky, ping, breaks: 0, min, hr: 7, board: 'schedule', sun: 1 });
    if (mangoInHall) { ctx.save(); S13.clipPoly(S13.wallPoly(S13.LAY.zb, S13.LAY.doorway.x0, 0, S13.LAY.doorway.x1, S13.LAY.doorway.y1)); drawBg(M); ctx.restore(); }
    if (!lemonShot && !LWALK(lt) && !hide(L)) (dofPx ? drawBg : drawChar)(L);
    if (!lemonShot) S13.counter({ t, phoneRing: t > .25 && t < 1.5 ? 1 : 0, plaque: false });
    S13.medCart(POS.cart[0], POS.cart[1], { t });
    S13.chair(POS.chair[0], POS.chair[1]);
    S13.lightMap({ lights: st.lights });
  };
  if (dofPx) V2.dof(dofPx, bgBlock); else bgBlock();
  if (lemonShot) { drawChar(L); V2.dof(9, () => S13.counter({ t, phoneRing: 0, plaque: false })); }
  // ---- the cast in front (sharp, complete, or left out)
  const front = [[M, mangoShot, 'm'], [S, strawShot, 's']];
  if (LWALK(lt) && (id === 'three' || id === 'freeze')) front.push([L, false, 'l']);
  front.sort((a, b) => a[0].y - b[0].y);
  for (const [o, subject, k] of front) {
    if (k === 'm' && (mangoInHall || lt < 11.2)) continue;
    if (!subject && hide(o)) continue;
    drawChar(o);
  }
  if (!dofPx || id === 'two') S13.shafts({ a: .1 });
  V2.dust(60, 600, 1020, 1400, t, { n: 26, alpha: .3, seed: 6 });
}
// ------------------------------------------------------------------ INSERT: the schedule printout (flat, top-down on a desk)
const DESK = V2.mk(W, H);
let deskDone = false;
function deskArt() {   /* the desk surface, cached once: laminate with a grain, the lamp's pool, the dark corners. No text in it. */
  if (deskDone) return; deskDone = true;
  const g = DESK.getContext('2d'), rng = V2.rng(31);
  g.fillStyle = (() => { const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#6d4b31'); q.addColorStop(1, '#3a2719'); return q; })(); g.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) { const y = rng() * H, x0 = -40 + rng() * 300, len = 500 + rng() * 900, a = .05 + rng() * .1; g.strokeStyle = rng() > .5 ? `rgba(30,16,8,${a})` : `rgba(255,214,160,${a * .7})`; g.lineWidth = 1 + rng() * 4; g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + len * .3, y + (rng() - .5) * 14, x0 + len * .6, y + (rng() - .5) * 14, x0 + len, y + (rng() - .5) * 8); g.stroke(); }
  const lp = g.createRadialGradient(800, 420, 60, 800, 420, 1200); lp.addColorStop(0, 'rgba(255,214,150,.34)'); lp.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = lp; g.fillRect(0, 0, W, H);
  const vg = g.createRadialGradient(540, 820, 400, 540, 820, 1250); vg.addColorStop(0, 'rgba(10,4,2,0)'); vg.addColorStop(1, 'rgba(10,4,2,.62)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // a pen (the pen!) and a paper clip lie on the desk; a mug, seen from above, stands in the corner
  g.save(); g.translate(150, 1500); g.rotate(-.62); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(6, 10, 190, 18, 0, 0, TAU); g.fill();
  g.fillStyle = '#2a6fdb'; g.strokeStyle = '#15111a'; g.lineWidth = 4; g.beginPath(); g.roundRect(-180, -13, 330, 26, 13); g.fill(); g.stroke(); g.fillStyle = '#f2f2f6'; g.beginPath(); g.roundRect(60, -13, 60, 26, 8); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-170, -9, 220, 5); g.restore();
  g.save(); g.translate(930, 150); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(14, 18, 112, 106, 0, 0, TAU); g.fill();
  g.fillStyle = '#f4f1ea'; g.strokeStyle = '#15111a'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 104, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(112, 0, 40, -1.1, 1.1); g.stroke();
  g.fillStyle = '#3a2112'; g.beginPath(); g.arc(0, 0, 84, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,214,160,.28)'; g.beginPath(); g.ellipse(-26, -28, 34, 16, -.5, 0, TAU); g.fill(); g.restore();
  g.save(); g.translate(130, 1400); g.rotate(.5); g.strokeStyle = '#c9ced8'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.roundRect(-26, -50, 52, 100, 24); g.stroke(); g.beginPath(); g.roundRect(-14, -34, 28, 80, 13); g.stroke(); g.restore();
}
const PAGE = [60, 300, 960, 1040], TBOX = [100, 520, 880, 600], REDINK = '#a8353a';
const tick = (x0, y0, x1, y1) => { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; ctx.save(); ctx.strokeStyle = '#2b8a4e'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx - 20, cy + 2); ctx.lineTo(cx - 6, cy + 16); ctx.lineTo(cx + 22, cy - 16); ctx.stroke(); ctx.restore(); };
const RD = t => ({ t, fill: REDINK, weight: 900 });
const SCH = { cols: [{ w: 270 }, { w: 180 }, { w: 230 }, { w: 200, align: 'center' }],
  rows: [['LEMON', 'CHARGE', '3:00 - 11:00', { draw: tick }], ['STRAWBERRY', '1 - 16', '3:00 - 11:00', { draw: tick }], ['MANGO', '17 - 32', '3:00 - 11:00', { draw: tick }], ['CLEMENTINE', 'SURE!', '3:00 - 11:00', { draw: tick }], [RD('BREAK'), RD('ALL'), RD('6:00 - 6:30'), '']] };
// the sheet and everything printed on it, in the sheet's own frame. tr: the sheet is still moving fast (the gate expects text to cross the frame edge then)
function sheetArt(tr) {
  UI.page(PAGE, { fill: '#f3ecd9', edge: '#d6c9a4', shadow: 36, r: 6, id: 'sheet13', pad: 30 });
  ctx.save(); ctx.beginPath(); ctx.rect(PAGE[0], PAGE[1], PAGE[2], PAGE[3]); ctx.clip();   /* paper furniture: a light fall-off, a fold crease, a staple, a barcode */
  ctx.fillStyle = grad(0, PAGE[1], 0, PAGE[1] + PAGE[3], [[0, 'rgba(255,255,255,.35)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(120,90,40,.12)']]); ctx.fillRect(PAGE[0], PAGE[1], PAGE[2], PAGE[3]);
  ctx.fillStyle = 'rgba(120,100,60,.14)'; ctx.fillRect(PAGE[0], PAGE[1] + PAGE[3] * .55, PAGE[2], 3); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(PAGE[0], PAGE[1] + PAGE[3] * .55 + 3, PAGE[2], 2);
  ctx.fillStyle = '#2a2530'; for (let i = 0, x = PAGE[0] + PAGE[2] - 250; i < 34; i++) { const w = 2 + ((i * 7) % 5); ctx.fillRect(x, PAGE[1] + PAGE[3] - 88, w, 46); x += w + 3 + (i % 3); }
  ctx.restore();
  ctx.fillStyle = '#b9bec9'; ctx.fillRect(PAGE[0] + 40, PAGE[1] + 20, 56, 7); ctx.fillStyle = '#8a909c'; ctx.fillRect(PAGE[0] + 40, PAGE[1] + 27, 56, 3);
  UI.label('FRUIT BOWL REHAB & NURSING', PAGE[0] + 48, PAGE[1] + 76, { size: 26, weight: 900, fill: '#7a7468', spacing: 2, align: 'left', hero: false, maxW: 560, transit: tr });
  UI.label('EVENING SHIFT', PAGE[0] + PAGE[2] - 48, PAGE[1] + 76, { size: 26, weight: 900, fill: '#7a7468', spacing: 2, align: 'right', hero: false, transit: tr });
  UI.label('SHIFT ASSIGNMENTS', PAGE[0] + PAGE[2] / 2, PAGE[1] + 150, { size: 84, font: 'Bangers', weight: 400, fill: '#2a2540', spacing: 4, maxW: 820, transit: tr });
  ctx.fillStyle = 'rgba(42,37,64,.5)'; ctx.fillRect(PAGE[0] + 48, PAGE[1] + 196, PAGE[2] - 96, 3); ctx.fillRect(PAGE[0] + 48, PAGE[1] + 204, PAGE[2] - 96, 1.5);
  const T = UI.table(TBOX, SCH.cols, SCH.rows, { header: ['NAME', 'ROOMS', 'TIME', 'STATUS'], size: 34, rowH: 100, zebra: 'rgba(120,100,60,.07)', grid: 'rgba(60,45,30,.22)', vgrid: true, headFill: '#3a3358', fill: '#fbf6e8', stroke: '#9a8f72', lw: 3, r: 8, id: 'sched13', text: { transit: tr } });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,222,70,.62)'; rr(T.x0 + 4, T.rowTop(4) + 6, T.x1 - T.x0 - 8, T.rowH - 12, 10); ctx.fill(); ctx.restore();   /* the highlighter over the break row (multiply: the text under it stays readable) */
  UI.label('REV. 3/12/19  -  KEEP AT THE STATION', PAGE[0] + 48, PAGE[1] + PAGE[3] - 40, { size: 22, weight: 900, fill: '#9a9484', spacing: 2, align: 'left', hero: false, transit: tr });
  const c = T.cell(4, 3);
  return { T, cx: c.cx, cy: c.cy };
}
// the pointing glove, tip at (tx, ty) on screen, along ang; press 0..1 how hard it lands (the shadow closes up)
function glove(tx, ty, ang, S, press) {
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(S, S);
  ctx.save(); ctx.translate(26 * (1 - press) + 4, 22 * (1 - press) + 5); ctx.globalAlpha = .34 - .1 * press; ctx.fillStyle = '#1a0f08';   /* its shadow on the paper */
  ctx.beginPath(); ctx.ellipse(-26, 0, 32, 15, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.roundRect(-44, -9, 44, 14, 6); ctx.fill(); ctx.restore();
  ctx.translate(-44, 4);
  V2C.limb([[-6, 0], [-92, 4], [-230, 10]], [12.5, 15, 19], LIMB);
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand('point', 1, {});
  ctx.restore();
}
function drawSched(lt) {
  deskArt();
  const u = lt - B('sched').s, slide = easeOut(seg(u, 0, .34)), tr = u < .42, tap = .95;
  ctx.drawImage(DESK, 0, 0);
  // paperslide (+0.05): the sheet is flicked in from the right, a little turned, and settles with a small bounce
  const land = pulse(u, .34, 24, .08), sx0 = lerp(1250, 0, slide) + 7 * land, rot = lerp(-.1, -.012, slide) + .006 * land;
  const jolt = pulse(u, tap, 30, .07);
  const ptap = sk(u, tap - .1, tap) * (1 - sk(u, tap + .06, tap + .45));
  ctx.save(); ctx.translate(540 + sx0, 850 + 3 * jolt); ctx.rotate(rot); ctx.translate(-540, -850);
  const art = sheetArt(tr), sx = art.cx, sy = art.cy;
  const m = ctx.getTransform(), P = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  // the old coffee ring (multiply), the PENDING stamp (faded: low alpha ink, worn cream specks), and dust over it all
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round';
  for (const [r, w, a, a0, sp] of [[150, 13, .34, 2.4, .83], [143, 5, .26, 2.55, .8], [158, 4, .16, 2.3, .55]]) { ctx.strokeStyle = `rgba(104,58,22,${a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(sx - 30, sy + 26, r, a0, a0 + TAU * sp); ctx.stroke(); }
  ctx.fillStyle = 'rgba(104,58,22,.1)'; ctx.beginPath(); ctx.arc(sx - 30, sy + 26, 148, 0, TAU); ctx.fill();
  ctx.restore();
  UI.stamp('PENDING', sx, sy, { size: 50, color: REDINK, rot: -.1, alpha: .68, lw: 6, id: 'pend13', text: { weight: 400, transit: tr } });
  { const rng = V2.rng(77); ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = '#f3ecd9'; for (let i = 0; i < 90; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * 120; ell(sx + Math.cos(a) * r * 1.0, sy + Math.sin(a) * r * .42, .8 + rng() * 2.4, .8 + rng() * 1.8); ctx.fill(); } ctx.restore(); }
  // the handwriting, a blue pen: "(since 2019)" with an arrow up to the stamp, in the free space under the table
  const nb = 1236, note = UI.write('(since 2019)', 150, nb, { size: 38, weight: 800, italic: true, fill: '#2a4aa8', id: 'since13', transit: tr });
  ctx.save(); ctx.strokeStyle = '#2a4aa8'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(note.x1 + 20, nb - 16); ctx.bezierCurveTo(note.x1 + 200, nb + 30, sx - 330, nb + 20, sx - 120, nb - 86); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx - 150, nb - 66); ctx.lineTo(sx - 120, nb - 86); ctx.lineTo(sx - 130, nb - 52); ctx.stroke(); ctx.restore();
  // dust: lifted off the stamp by the tap (+0.05 after it), drifting up and thinning out
  const puff = seg(u, tap + .1, tap + 1.0);
  if (puff > 0 && puff < 1) { const rng = V2.rng(9); for (let i = 0; i < 12; i++) { const a = rng() * TAU, d = (30 + rng() * 130) * easeOut(puff), r = (26 + rng() * 38) * (.55 + puff), py = sy + Math.sin(a) * d * .5 - 70 * puff * (.4 + rng()), px = sx + Math.cos(a) * d * 1.1; ctx.save(); ctx.globalAlpha = .44 * (1 - puff) * (1 - puff); ctx.fillStyle = radial(px, py, 0, r, [[0, 'rgba(238,230,208,1)'], [1, 'rgba(238,230,208,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2); ctx.restore(); } }
  const tip = P(sx - 14, sy + 56);
  ctx.restore();
  // the finger: it comes up from the lower right, hovers, taps the stamp at 0.95 and stays on it
  const ap = easeOut(seg(u, .5, .86)), hov = lerp(760, 64, ap) + Math.sin(u * 8) * 4 * ap * (1 - ptap), ang = -1.74 + .03 * Math.sin(u * 5), dist = hov * (1 - ptap) + 6 * ptap;
  if (u > .46) glove(tip[0] - Math.cos(ang) * dist, tip[1] - Math.sin(ang) * dist, ang, 5.6 - .25 * ptap, ptap);
}
// ------------------------------------------------------------------ INSERT: "One chair." A lone chair in the last shaft of the window light.
// The camera is low and square to the chair; the window (Z 1900) is right behind it, so it stands against the dusk with a rim of sun, a long shadow stretches toward us, and the room is soft.
function drawChairInsert(lt) {
  const t = ftime(lt), u = seg(lt, 20.32, 21.22), [CX, CZ] = POS.chair;
  S13.light('evening', { keyA: .3, rimA: .6 });
  V2.opts.reflect = true;
  const sky = .12 + .5 * seg(t, 0, 25);
  let st;
  V2.dof(9, () => {
    st = S13.station(lt, { t, sky, ping: -1, min: 2, hr: 7, board: 'schedule', sun: 1.4, sunX: CX - 190 });
    S13.counter({ t, phoneRing: 0, plaque: false });
  });
  const [fx, fy, kk] = V2.proj(CX, 0, CZ);
  // the shadow of the chair, thrown toward the camera over the patch of sun: the silhouette flattened and sheared along the floor
  ctx.save(); ctx.translate(fx, fy); ctx.globalAlpha = .5; ctx.filter = 'brightness(0) blur(5px)'; ctx.transform(1, 0, .55, -.2, 0, 0); ctx.translate(-fx, -fy);
  S13.chair(CX, CZ, { rimA: 0, noShadow: true }); ctx.restore();
  const q = S13.chair(CX, CZ, { rimA: .9, color: '#8f9db4' });
  // the beam from the window through the chair, and the dust drifting in it
  const wc = V2.p2((S13.LAY.win.x0 + S13.LAY.win.x1) / 2, (S13.LAY.win.y0 + S13.LAY.win.y1) / 2, S13.LAY.zb);
  V2.beam(wc[0] + 120, wc[1] - 40, fx - 220 * kk, fy + 60, 260, 520, '255,196,130', .2, 'screen');
  V2.dust(fx - 380 * kk, fy - 700 * kk, fx + 330 * kk, fy + 90 * kk, t, { n: 90, alpha: .9, size: 3.6 * Math.max(1, kk / 1.5), speed: 10, color: '255,232,190', seed: 12 });
  const g = V2.p2(CX + 40, 262, CZ), gl = sk(lt, 20.58, 20.78) * (1 - sk(lt, 20.86, 21.12));
  if (gl > 0) { V2.glow(g[0], g[1], 90 * kk, '255,230,180', .6 * gl, 'screen', .8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(g[0], g[1]); ctx.rotate(.3); ctx.fillStyle = `rgba(255,248,220,${gl})`; const r = 34 * kk * (.6 + .4 * gl); ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .1, -r * .1, r, 0); ctx.quadraticCurveTo(r * .1, r * .1, 0, r); ctx.quadraticCurveTo(-r * .1, r * .1, -r, 0); ctx.quadraticCurveTo(-r * .1, -r * .1, 0, -r); ctx.fill(); ctx.restore(); }
  S13.lightMap({ ambient: 'rgb(84,76,108)', lights: st.lights.concat([{ x: fx, y: fy - 190 * kk, r: 620 * kk, color: '255,206,150', a: 1.0, sy: .9 }]) });
}

const SC = {
  shot: lt => shotAt(lt).id,
  cam(lt) { setCamera(lt); },
  draw(lt) { drawScene(lt); },
  fx: lt => {
    const FT = FREEZE_T, k = easeOut(seg(lt, FT, FT + .5)), burst = lt >= FT ? Math.exp(-(lt - FT) / .1) : 0, hit = lt >= FT + .25 ? Math.exp(-(lt - FT - .25) / .08) : 0;
    return { bloom: .5 + .5 * burst + .3 * hit, vignette: .46 + .26 * k, grain: .045 + .03 * k, contrast: .17 + .1 * k, sat: .12 + .05 * k,
      tint: [['#ffd9a0', .1 * (1 - k), 'soft-light'], ['#ff2a3a', .3 * k, 'soft-light'], ['#5a0a14', .34 * k, 'multiply']], aberr: 16 * burst + 7 * hit, fade: 1 - easeOut(seg(lt, 0, .5)), fadeColor: '0,0,0' };
  },
  blur: lt => { for (const s of SHOTS) if (Math.abs(lt - s.t0) < .034) return 1; return shotAt(lt).id === 'wide' ? 3 : 1; },
  over(lt) {
    // the printout, flicked at the lens at the end of l2: it leaves Lemon's hand, grows and fills the frame (the cut to the insert follows)
    if (lt > FLICK_T && lt < 10.74) {
      const k = seg(lt, FLICK_T, 10.70), e = easeIn(k), sc = lerp(.16, 3.4, e), x = lerp(790, 560, e), y = lerp(1130, 760, e), r = lerp(.5, -.05, e);
      ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(sc, sc); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#f3ecd9'; rr(-250, -330, 500, 660, 8); ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#3a3358'; ctx.fillRect(-212, -140, 424, 44); ctx.strokeStyle = 'rgba(60,45,30,.3)'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-212, -96 + i * 56); ctx.lineTo(212, -96 + i * 56); ctx.stroke(); }
      ctx.fillStyle = 'rgba(42,37,64,.75)'; ctx.fillRect(-212, -250, 300, 26); ctx.restore();
    }
    // the freeze: a white hit, then the dark red spotlight closes on the three faces; a second, smaller hit on the sting
    const FT = FREEZE_T;
    if (lt >= FT) {
      const k = easeOut(seg(lt, FT + .02, FT + .55)), hit = lt >= FT + .25 ? Math.exp(-(lt - FT - .25) / .09) : 0, f1 = Math.exp(-(lt - FT) / .06);
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      const R = lerp(1700, 640, k) - 50 * hit;
      ctx.translate(540, 900); ctx.scale(1, .66); ctx.fillStyle = radial(0, 0, R * .5, R, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(58,4,12,1)']]); ctx.fillRect(-1200, -1700, 2400, 3400); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const a = Math.min(1, .8 * f1 + .35 * hit); if (a > .01) { ctx.fillStyle = `rgba(255,236,230,${a})`; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
      V2.beam(540, -80, 540, 1180, 380, 1000, '255,80,90', .1 * k, 'screen');
    }
  },
};
window.__EP13_SCENES = window.__EP13_SCENES || {};
window.__EP13_SCENES.open = SC;
})();
