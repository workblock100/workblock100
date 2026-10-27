'use strict';
/* SHIFT HAPPENS, Episode 12: "The In-Service". Scene module: drill (THE FIRE DRILL, 30.73 s, clock 3:41 PM). Scene builder E12-C.
 *
 * SHOT LIST (scene-local seconds, from scene_info.py):
 *  alarm   0.00-1.50  HALL wide, camera still, a slow push. The strobe starts on the firebell (0.1), a flash about twice a second.
 *  a1      1.50-4.23  HALL tracking: the camera walks back at the group's pace, so the group holds still and the doors slide past. The Administrator, centre, clipboard, a wave.
 *  l1      4.38-6.56  tracking, a medium on Lemon at the back, walking straight, unbothered.
 *  c1      6.76-7.18  a whip to the supply closet on the right wall (the MUSTER POINT arrow above it). Clementine runs and skids in (SKRRRT), the door swings, she goes in.
 *  run     7.29-8.29  the scramble: the camera speeds up and shakes, Clementine comes out with a mop, the wheelchair rolls with Mango behind it, everyone stops at 8.6.
 *  m1      8.33-11.04 two-shot, Mango and Clementine by the closet ("The exit is that way.").
 *  r1      11.04-12.50 cut to a two-shot, Mrs. Cranberry in her chair and Mango ("Is this nineteen sixty-two?").
 *  m2      12.70-14.41 the same two-shot ("It's a drill, Mrs. C."); the chair rolls toward camera from 13.5 and stops dead on the fire-door threshold at 14.5.
 *  r2      14.56-15.71 cut to a low angle on the wheelchair at the threshold; Mrs. Cranberry folds her arms ("Then I am not going.").
 *  peel    15.91-16.81 cut to the hall, a slow push; Mr. Banana, far down the hall, slips on a peel (peel 0.2, boing 0.4). Background only.
 *  s1-s5   16.86-22.54 Strawberry's priority list (close-ups): one finger on "Residents", two on "second", three on "Third", four on "Pizza last"; the Administrator's two reactions (a2, a3) between.
 *  muster  22.79-23.79 hard cut to the parking lot at night (crickets at 0.2). The strobe is off.
 *  mo1     23.84-25.77 the lot, wide, the Moon in the top right corner ("I counted. Everyone is here.").
 *  s4      25.96-26.72 Strawberry, a medium, looks along the row ("Who's missing?").
 *  mo2     26.87-27.94 two-shot, the Moon and Strawberry, the Moon's face lit ("Persimmon.").
 *  s5      28.09-29.28 Strawberry; a short cut to the outlined PERSIMMON space painted on the asphalt (28.5-28.95), then back to her ("She's on another budget.").
 *  end     29.48-30.28 the lot held wide (sting at 0.1).
 *
 * Layout numbers: the hall is S6.corridor (HW 330, ceiling 700). The camera is V2.P (f 1400, cy 360, hy 860); a point at depth D (camera to point) is drawn at scale 1400 / D,
 * its floor line at y = 860 + 360 * 1400 / D. The group stands at depths 1420-2050; Strawberry is front left (X -310), the Administrator front centre (X -70), Clementine
 * at the closet (X 150-300, depth 1560), Mrs. Cranberry and Mango at the back right (X 90 and 230, depth 2050 pulling to 1800). Lemon stands at the back left (X -260).
 * Shots: a per-shot camera track of [time, cx, zoom, cy, y0] keyframes (a repeated time is a hard cut). cx pans the perspective (V2.setCam), zoom and y0 frame it (zoomTo).
 * The lot's stalls are painted on the ground at depth 1450-2000; the staff stand at depth 1700 (scale 0.82) on stall centres -475 ... 475 (stall 95 is PERSIMMON, empty).
 * Props: drill12_mop and drill12_fingers, registered through EXT.prop and PROP_BOX. Neighbours in a shot are drawn with drawBg (not held to the audit).
 *
 * Source notes: the hall is S6.corridor with S6 wall helpers (ep6_sets.js, ep6_rooms.js); the lot's night sky, building and asphalt follow ep9_exit.js lotNight; the painted stalls,
 * the ground lettering and the strobe are new; sfxWord and wordT are copies of the ep9 and ep10 helpers; handTo is a copy of ep10_days.js. */
(() => {
if (!window.TIMELINE_EP12) return;
const { zoomTo, drawBg, person, localOf, faceC } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S6 = window.S6, S7 = window.S7;
const { kz, lampPost, car3, wallClock, onZ, box3 } = S6;
const { p2, poly, grad } = V2;
const HW = S6.HW, CH = S6.CH;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 and 10 ones)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
// a hand aimed at a screen point (copy of ep10_days.js handTo): it blends from the resting grip toward the point, short of full reach
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}
// a wall rectangle in world units (x = +-HW for the side walls), drawn in perspective
function wallQ(side, y0, y1, z0, z1, fill, stroke, lw) { poly([p2(side * HW, y0, z0), p2(side * HW, y1, z0), p2(side * HW, y1, z1), p2(side * HW, y0, z1)], fill, stroke, lw); }
// a character on a path, drawn at the perspective scale of its own depth (m: its size against the rest)
function actor(ctor, fn, lt, extra = {}, m = 1) { return person(ctor, fn, lt, Object.assign({ s: kz(fn(lt)[1]) * m }, extra)); }

// ------------------------------------------------------------------ props (prefix drill12_)
Object.assign(PROP_BOX, { drill12_mop: [-70, -330, 70, 330], drill12_fingers: [-30, -62, 30, 14] });
// a mop held by the handle: a wood shaft through the hand, the grey sponge head resting on the floor (the floor is about 190 local px below the grip)
EXT.prop.drill12_mop = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.04);
  ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(0, -300); ctx.lineTo(0, 196); ctx.stroke();
  ctx.strokeStyle = '#c99b6a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -298); ctx.lineTo(0, 194); ctx.stroke();
  ctx.fillStyle = '#eceae2'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-64, 188, 128, 34, 12); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#a7aeb6'; ctx.lineWidth = 3; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 13, 216); ctx.lineTo(i * 13 + (i % 2 ? 5 : -5), 236); ctx.stroke(); }
  ctx.restore();
};
// a raised hand for the priority list: o.fingers holds one value 0..1 per finger (1 = held up); the fist is drawn over the finger bases
EXT.prop.drill12_fingers = (side, o, t) => {
  const F = o.fingers || [0, 0, 0, 0], X = [-16, -5.5, 5, 15.5];
  ctx.save(); ctx.lineJoin = 'round';
  for (let i = 0; i < 4; i++) {
    const L = 10 + 46 * F[i];
    ctx.fillStyle = '#f7f5ef'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
    rr(X[i] - 6.5, -10 - L, 13, L + 14, 6.5); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ the hall camera: in the tracking shots it walks back at the group's pace (the doors slide past them)
const vHall = s => s < 1.5 ? 0 : s < 7.29 ? 110 : s < 8.29 ? 110 + 190 * Math.sin((s - 7.29) * PI) : s < 8.62 ? 110 * (1 - easeIO(seg(s, 8.29, 8.62))) : 0;
const DT = .005, TRAV = [0];
for (let i = 1; i <= 8000; i++) TRAV.push(TRAV[i - 1] + vHall((i - .5) * DT) * DT);
const travel = lt => { const x = clamp(lt, 0, 39.9) / DT, i = Math.floor(x); return lerp(TRAV[i], TRAV[i + 1], x - i); };
const camZ = lt => -travel(lt);
// set-piece depths: a fixed world depth scrolls past in the tracking shots, so each one is written relative to the camera at the moment it matters
const Z_DOOR = camZ(7.0) + 1560;     // the supply closet on the right wall, at Clementine's depth (she skids in at 7.0)
const Z_TH = camZ(8.7) + 1800;       // the fire-door threshold the wheelchair stops at (the camera is still from 8.62)
const Z_FB = 1370;                   // the fire alarm box, left wall
const Z_CLK = 1670;                  // the wall clock, left wall
const DCOL = ['#9d6b74', '#6d8f88', '#a8744f', '#8e6f55'];
const DOORS = [];
for (let i = 0; i < 18; i++) {
  DOORS.push({ side: -1, z: 620 + i * 300, n: String(2 * i + 2), color: DCOL[i % 4] });
  DOORS.push({ side: 1, z: 770 + i * 300, n: String(2 * i + 1), color: DCOL[(i + 1) % 4] });
}
const DECOR = [{ side: -1, z: 1100, c: '#e6a23c' }, { side: 1, z: 1400, c: '#6cc1d9' }, { side: -1, z: 1990, c: '#9bd96c' }, { side: 1, z: 2300, c: '#d96c8a' }];

// the strobe: a flash about twice a second from the firebell (0.1) until the muster point (22.6)
const STROBE_ON = .1, STROBE_OFF = 22.6;
const strobe = lt => { if (lt < STROBE_ON || lt > STROBE_OFF) return 0; const p = ((lt - STROBE_ON) % .5) / .5; return Math.exp(-p * 9); };
// the closet door: shut until Clementine hits it (7.05), then it swings into the closet over the next .4 s
const doorOpen = lt => sk(lt, 7.05, 7.45);

// the camera track for the hall: [time, cx, zoom, cy, y0] keyframes; two equal times make a hard cut (blur is 1 on those frames)
const TRK = [
  [0, 0, 1.00, 360, 960], [1.5, 0, 1.04, 360, 960],
  [2.6, -70, 1.14, 360, 900], [4.3, -70, 1.14, 360, 900], [4.9, -250, 1.40, 360, 770], [6.6, -250, 1.40, 360, 770],   // a1 -> l1: the Administrator, then Lemon
  [7.1, 170, 1.12, 360, 840], [7.6, 150, 1.10, 360, 880],                                                              // the whip to the closet (blur on)
  [8.33, 0, 1.00, 360, 960], [11.0, 0, 1.00, 360, 960],                                                                 // m1: the wide, Mango at the back right, Clementine at the closet
  [11.04, 190, 1.90, 360, 808], [12.6, 190, 1.90, 360, 808], [12.61, 190, 1.90, 360, 808],                             // r1 -> m2: Mrs. Cranberry and Mango, tight
  [14.56, 90, 1.45, 130, 900], [15.9, 90, 1.45, 130, 900],                                                              // r2: a low angle on the chair
  [15.91, 0, 1.00, 360, 960], [16.86, 0, 1.05, 360, 960],                                                               // peel: the hall
  [16.87, -310, 1.60, 360, 760], [18.9, -310, 1.60, 360, 760],                                                          // s1: Strawberry's list
  [18.95, -70, 1.65, 360, 720], [20.1, -70, 1.65, 360, 720],                                                            // a2
  [20.15, -310, 1.60, 360, 760], [20.8, -310, 1.60, 360, 760],                                                          // s2
  [20.83, -70, 1.65, 360, 720], [21.6, -70, 1.65, 360, 720],                                                            // a3
  [21.71, -310, 1.60, 360, 760], [22.79, -310, 1.60, 360, 760],                                                         // s3
];
const trackAt = lt => {
  if (lt <= TRK[0][0]) return TRK[0].slice(1);
  for (let i = 0; i < TRK.length - 1; i++) {
    const a = TRK[i], b = TRK[i + 1];
    if (lt >= a[0] && lt < b[0]) { const k = b[0] - a[0] > 0 ? easeIO(seg(lt, a[0], b[0])) : 1; return [1, 2, 3, 4].map(j => lerp(a[j], b[j], k)); }
  }
  return TRK[TRK.length - 1].slice(1);
};

// ------------------------------------------------------------------ the cast: the hall positions (lateral X, depth D; the depth rides with the camera)
const at = (X, D) => lt => [X, camZ(lt) + D];
const P_STR = at(-310, 1480), P_ADM = at(-70, 1420), P_LEM = at(-260, 2050);
const P_CLM = lt => [lerp(150, 300, sk(lt, 6.6, 7.1)) + (lt > 7.6 ? lerp(0, -100, sk(lt, 7.6, 8.1)) : 0), camZ(lt) + 1560];
const chairD = lt => lerp(2050, 1800, easeOut(seg(lt, 13.5, 14.5)));
const P_CHAIR = lt => [90, camZ(lt) + chairD(lt)];
const P_MNG = lt => [230, camZ(lt) + chairD(lt)];
const P_BAN = at(60, 2600);

// the parking lot: the staff on their stalls at depth 1700 (no camera travel)
const LOT_D = 1700, STALL = { adm: -475, lem: -285, mng: -95, str: 285, clm: 475 };   // stall at 95 is PERSIMMON, empty
const lotAt = (X, D) => lt => [X, D];

// Mr. Banana, far down the hall: he steps on the peel (16.11), slips over backwards, and bounces off the floor on the boing (16.31)
function banana(lt) {
  const t0 = B('peel').s + .2, fall = sk(lt, t0, t0 + .36), boing = lt > t0 + .36 ? Math.sin(seg(lt, t0 + .36, t0 + .72) * PI) : 0;
  const q = V2.at(...P_BAN(lt)), s = q.s * .42, slipped = lt > t0;
  return Object.assign(q, { s, rot: -fall * 1.35, lift: boing * 22 * s, expr: slipped ? 'panic' : 'happy', arms: slipped ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, look: [0, -.2] });
}

// the hall's fixtures, drawn after the corridor and before the cast
function hallFixtures(lt) {
  const inten = strobe(lt);
  // the fire-door threshold: a metal sill across the hall that the wheelchair meets
  { const th = [p2(-HW, 0, Z_TH - 16), p2(HW, 0, Z_TH - 16), p2(HW, 0, Z_TH + 16), p2(-HW, 0, Z_TH + 16)];
    poly(th, grad(0, th[0][1], 0, th[2][1], [[0, '#dfe3e8'], [1, '#8d939c']]), 'rgba(25,16,30,.55)', 2.2); }
  // the fire alarm box on the left wall, its strobe lens lit on each flash
  { const Z = Z_FB, k = kz(Z);
    wallQ(-1, 196, 300, Z - 48, Z + 48, '#c81e2e', 'rgba(25,16,30,.7)', 2.4);
    wallQ(-1, 222, 276, Z - 32, Z + 32, '#a5172a');
    const [lx, ly] = p2(-HW, 344, Z), r = 34 * k;
    ctx.save(); ctx.fillStyle = inten > .4 ? '#ff7a80' : `rgb(${150 + 60 * inten | 0},40,50)`; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, 3 * k);
    ctx.beginPath(); ctx.ellipse(lx, ly, r, r * .9, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    if (inten > .02) V2.glow(lx, ly, 300 * k, '255,40,50', .9 * inten, 'screen', .8);
    text('FIRE', lx, ly + 44 * k, { size: 24 * k, fill: '#ffffff', weight: 900, spacing: 2 }); }
  // the wall clock, reading 3:41 like the pill
  wallClock(-HW + 3, 470, Z_CLK, -1, 41, 3, 46);
  // the supply closet on the right wall: the door swings into the closet, the dark room behind it with shelves, and the QUIET sign with its Q crossed out
  { const z0 = Z_DOOR - 78, z1 = Z_DOOR + 78, open = doorOpen(lt), k = kz(Z_DOOR);
    wallQ(1, 0, 444, z0 - 12, z1 + 12, '#e9e0cb', 'rgba(25,16,30,.55)', 2.2);
    if (open > 0) {
      wallQ(1, 0, 430, z0, z1, '#17151d');
      for (const y of [120, 230, 340]) wallQ(1, y, y + 14, z0 + 8, z1 - 8, '#6b5a47');
      const [bx, by] = p2(HW, 300, Z_DOOR); V2.glow(bx, by, 240 * k, '255,236,190', .35 * open, 'screen', .5);
    }
    const zf = z1 - 156 * Math.cos(open * 1.3);      // the free edge of the leaf, hinged on its far side
    wallQ(1, 0, 430, zf, z1, '#8a6a4a', 'rgba(25,18,30,.6)', 2.2);
    if (z1 - zf > 50) {
      wallQ(1, 56, 404, zf + 14, z1 - 14, '#9a7a58', 'rgba(25,18,30,.35)', 1.6);
      const zc = (zf + z1) / 2, [qx, qy] = p2(HW, 330, zc), kk = kz(zc);
      if (z1 - zf > 110) {
        wallQ(1, 304, 362, zf + 10, z1 - 10, '#fffdf6', 'rgba(25,16,30,.55)', 1.6);
        ctx.save(); ctx.fillStyle = '#2b2530'; ctx.font = `400 ${34 * kk}px Bangers`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('QUIET', qx, qy); ctx.restore();
        ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 3 * kk; ctx.beginPath(); ctx.moveTo(qx - 30 * kk, qy - 13 * kk); ctx.lineTo(qx - 14 * kk, qy + 14 * kk); ctx.stroke();
      }
    }
  }
  // the MUSTER POINT sign: hung from the ceiling mid-hall, its arrow pointing across at the closet door on the right wall (the sign is wrong: it sends them to the closet)
  { const [sx, sy] = p2(160, 540, Z_DOOR), k = kz(Z_DOOR);
    ctx.save(); ctx.fillStyle = '#1a7a4a'; ctx.strokeStyle = 'rgba(10,30,20,.8)'; ctx.lineWidth = Math.max(2, 4 * k);
    rr(sx - 150 * k, sy - 62 * k, 262 * k, 118 * k, 14 * k); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eafff0'; ctx.font = `400 ${52 * k}px Bangers`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${2 * k}px`;
    ctx.fillText('MUSTER POINT', sx - 19 * k, sy - 6 * k); ctx.letterSpacing = '0px';
    ctx.fillStyle = '#fff6d6'; ctx.beginPath(); ctx.moveTo(sx + 96 * k, sy - 30 * k); ctx.lineTo(sx + 96 * k, sy + 30 * k); ctx.lineTo(sx + 150 * k, sy + 30 * k); ctx.lineTo(sx + 150 * k, sy + 58 * k); ctx.lineTo(sx + 194 * k, sy); ctx.lineTo(sx + 150 * k, sy - 58 * k); ctx.lineTo(sx + 150 * k, sy - 30 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore(); }
}

// Strawberry's list: each finger rises on its word (1 on "Residents", 2 on "second", 3 on "Third", 4 on "Pizza")
function fingerState(lt) {
  const t1 = wordT('s1', 'residents', B('s1').s + .1), t2 = wordT('s1', 'second', B('s1').s + 1.3), t3 = wordT('s2', 'third', B('s2').s + .1), t4 = wordT('s3', 'pizza', B('s3').s + .1);
  return [sk(lt, t1 - .05, t1 + .2), sk(lt, t2 - .05, t2 + .2), sk(lt, t3 - .05, t3 + .2), sk(lt, t4 - .05, t4 + .2)];
}

// the hall cast: which characters are focal (drawn sharp, held to the audit) in each shot; the rest are neighbours, drawn soft with drawBg
const FOCAL = {
  alarm: ['str', 'adm', 'clm'], a1: ['adm'], l1: ['lem'], c1: ['clm'], run: ['str', 'adm', 'clm'], m1: ['mng', 'clm'], r1: ['cran', 'mng'], m2: ['cran', 'mng'],
  r2: ['cran'], peel: [], s1: ['str'], a2: ['adm'], s2: ['str'], a3: ['adm'], s3: ['str'],
};
const shotHall = lt => lt < 1.5 ? 'alarm' : lt < 4.38 ? 'a1' : lt < 6.76 ? 'l1' : lt < 7.29 ? 'c1' : lt < 8.33 ? 'run' : lt < 11.04 ? 'm1' : lt < 12.70 ? 'r1' : lt < 14.56 ? 'm2' : lt < 15.91 ? 'r2' : lt < 16.86 ? 'peel' : lt < 18.95 ? 's1' : lt < 20.15 ? 'a2' : lt < 20.83 ? 's2' : lt < 21.71 ? 'a3' : lt < 22.79 ? 's3' : 'lot';
function hallCast(lt, sh) {
  const F = FOCAL[sh] || [];
  // a neighbour is drawn soft (the house depth of field), a focal character sharp and held to the audit
  const near = (o, px = 5) => V2.dof(px, () => drawBg(o));
  const draw = (k, o) => (F.includes(k) ? drawChar(o) : near(o));
  const fingers = fingerState(lt);
  // far back: Lemon (left), Mrs. Cranberry in her chair and Mango (right, pulling to the threshold)
  const lem = actor(A7.lemon, P_LEM, lt, { expr: 'dead', lid: .3, look: [.3, .1], hold: { l: 'clipboard6' }, grip: { l: [-100, 30] }, arms: { l: 'hold', r: 'rest' }, clipText: 'DRILL' }, 1);
  const qC = V2.at(...P_CHAIR(lt));
  const cran = A7.cran({ x: qC.x, y: qC.y - 118 * qC.s, s: qC.s, noLegs: true, noShadow: true, look: [-.7, 0], expr: lt > 14.56 ? 'sour' : 'happy', arms: lt > 14.6 ? { l: [1.25, -2.0], r: [1.25, -2.0] } : { l: 'rest', r: 'rest' } });
  const mng = actor(A7.mango, P_MNG, lt, { look: [-.8, 0], expr: lt > 7.6 && lt < 8.4 ? 'panic' : 'happy', acc: ['badge7', 'gaitbelt7', 'keys7'], arms: { l: 'rest', r: lt > 13.2 && lt < 14.6 ? [2.0, .1] : 'reach' } }, 1);
  // the wheelchair: its back half, Mrs. Cranberry, then its front half (the Episode 7 chair)
  const chairPass = o => {
    const go = () => { S7.wheelchairBack(qC.x, qC.y, qC.s); (F.includes('cran') ? drawChar(o) : drawBg(o)); S7.wheelchairFront(qC.x, qC.y, qC.s); };
    if (F.includes('cran')) go(); else V2.dof(3, go);
  };
  // the back row first (far to near), then the front
  if (F.includes('lem')) drawChar(lem); else V2.dof(3, () => drawBg(lem));
  if (F.includes('mng')) drawChar(mng); else V2.dof(3, () => drawBg(mng));
  chairPass(cran);
  // Clementine: at the closet from 7.1, then out with a mop
  const clm = actor(A10.clem, P_CLM, lt, { expr: lt > 7.2 && lt < 8.2 ? 'shock' : 'hopeful', look: [-.2, 0], hold: lt > 7.8 ? { r: 'drill12_mop' } : {}, grip: { r: [96, 40] }, arms: lt > 7.8 ? { l: 'rest', r: 'hold' } : { l: 'rest', r: 'rest' } }, 1);
  draw('clm', clm);
  // Strawberry, front left, the calm one; her hand goes up for the list from 16.86
  const str = actor(A11.straw, P_STR, lt, { expr: lt > 16.8 && lt < 22.6 ? 'dead' : 'chill', look: [.6, .05], arms: { l: 'rest', r: 'rest' }, hold: lt > 16.8 && lt < 22.6 ? { r: 'drill12_fingers' } : {}, hand: lt > 16.8 && lt < 22.6 ? { r: 'fist' } : {}, fingers: fingers }, 1);
  if (lt > 16.8 && lt < 22.6) { const k = sk(lt, 16.8, 17.3) * (1 - sk(lt, 22.4, 22.7)); handTo(str, 1, str.x + 96 * str.s, str.y - 300 * str.s, k, [150, 90]); }
  draw('str', str);
  // the Administrator, front centre: his clipboard, his wave, his two reactions
  const adm = actor(A9.melon, P_ADM, lt, { expr: lt > 18.95 && lt < 20.1 ? 'shock' : lt > 20.83 && lt < 21.7 ? 'sad' : 'happy', look: [.4, 0], hold: { l: 'clipboard6' }, grip: { l: [-100, 30] }, arms: { l: 'hold', r: lt < 3.0 ? 'wave' : 'rest' }, hand: { r: 'wave' }, clipText: 'DRILL' }, 1.22);
  draw('adm', adm);
}
function hallScene(lt, sh) {
  V2.setLight({ key: [-.4, -.8], keyColor: '#fff3dc', keyA: .26, rim: '#cfe0ff', rimA: .5, shadow: '#3a3048', shadowA: .3, bounce: '#ffe0b0', bounceA: .18, amb: '#fff6e6', ambA: .05 });
  V2.opts.reflect = true;
  S6.corridor({ doors: DOORS, ch: CH, fog: '#c4cfe2', fogAmt: .32, wall: '#e9e0cb', wain: '#5c9298', lampOn: 1, bright: .9, signs: [], decor: DECOR, zFar: 7600 });
  hallFixtures(lt);
  // Mr. Banana and his peel, far down the hall, behind the action
  if (lt > 15.5 && lt < 17.2) {
    const q = V2.at(...P_BAN(lt));
    V2.dof(3, () => { A7.peelFloor(q.x - 22 * q.s * .42, q.y, q.s * .42 * 1.1); drawBg(banana(lt)); });
  }
  hallCast(lt, sh);
}

// ------------------------------------------------------------------ the parking lot at night (adapted from ep9_exit.js lotNight)
function lotNight(lt) {
  const hy = V2.P.hy, Zb = 2100, k = kz(Zb);
  ctx.fillStyle = grad(0, 0, 0, hy + 120, [[0, '#04061c'], [.5, '#121c52'], [.85, '#2a3a86'], [1, '#4a5a9a']]); ctx.fillRect(-300, -300, W + 600, hy + 520);
  A7.stars(lt, 700, { n: 110, a: 1, seed: 21 });
  // the building across the lot: lit windows, the entrance under its sign
  const hw = 1500, bh = 640;
  { const a = p2(-hw, 0, Zb), b = p2(hw, bh, Zb);
    onZ(Zb, -hw, hw, 0, bh, grad(0, b[1], 0, a[1], [[0, '#2c2a4c'], [1, '#4a4668']]));
    onZ(Zb, -hw, hw, bh - 36, bh + 20, '#1e1c34', 'rgba(10,8,20,.6)', 2); onZ(Zb, -hw, hw, 0, 34, '#3e3a58'); }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) {
    const x0 = -1120 + c * 250, y0 = [130, 310, 490][r], litw = hash(r * 9 + c + 3) > .3 ? 1 : 0;
    if (Math.abs(x0 + 62) < 260 && r === 0) continue;
    onZ(Zb, x0, x0 + 124, y0, y0 + 110, litw ? (hash(r * 9 + c + 40) > .5 ? '#ffe2a0' : '#ffd07a') : '#1c1a34', 'rgba(10,8,20,.65)', 2.2);
    if (litw) { const [gx, gy] = p2(x0 + 62, y0 + 55, Zb); V2.glow(gx, gy, 150 * k, '255,200,120', .22, 'screen', .4); }
  }
  onZ(Zb, -190, 190, 0, 260, grad(0, p2(0, 260, Zb)[1], 0, p2(0, 0, Zb)[1], [[0, '#ffd890'], [1, '#fff2cc']]), 'rgba(10,8,20,.7)', 3);
  { const [gx, gy] = p2(0, 120, Zb); V2.glow(gx, gy, 460 * k, '255,220,150', .5, 'screen', .8); }
  box3({ x0: -270, x1: 270, y0: 268, y1: 296, z0: Zb - 170, z1: Zb, color: '#2c2842', top: '#3c3858', lw: 1.6 });
  onZ(Zb, -440, 440, bh + 44, bh + 134, '#1e1a34', 'rgba(255,226,170,.55)', 2.6);
  { const [sx, sy] = p2(0, bh + 89, Zb); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 16; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${42 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${4 * k}px`; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  // the asphalt, then the painted stalls in true perspective
  { const yb = p2(0, 0, Zb)[1]; ctx.fillStyle = grad(0, yb - 2, 0, H, [[0, '#3a3e66'], [.5, '#22243e'], [1, '#12132a']]); ctx.fillRect(-300, yb - 2, W + 600, H - yb + 320); }
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineCap = 'butt';
  for (const x of [-570, -380, -190, 0, 190, 380, 570]) { const a = p2(x, 0, 1450), b = p2(x, 0, 2000); ctx.lineWidth = Math.max(2, 9 * kz(1450)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  { const a = p2(-600, 0, 1450), b = p2(600, 0, 1450); ctx.lineWidth = Math.max(2, 9 * kz(1450)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  car3(-820, 1880, { color: '#2c8f9a', brake: .1 }); car3(860, 1900, { color: '#5a3b8a', brake: .1, w: 160 });
  lampPost(-760, 1300, { h: 640, on: .7 }); lampPost(760, 1300, { h: 640, on: .7 });
}
// the outlined PERSIMMON stall, lettered on the ground (the letters are squashed by the ground's foreshortening, cy / depth)
function persimmonSpace() {
  const Zc = 1700, Xc = STALL.mng + 190, gz = V2.P.cy / Zc, kk = kz(Zc);
  ctx.save();
  const q = [p2(Xc - 84, 0, 1490), p2(Xc + 84, 0, 1490), p2(Xc + 84, 0, 1910), p2(Xc - 84, 0, 1910)];
  ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = Math.max(3, 7 * kk); ctx.setLineDash([24 * kk, 14 * kk]);
  ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  const [cx, cy] = p2(Xc, 0, 1640);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(kk, kk * gz);
  ctx.fillStyle = 'rgba(255,246,222,.92)'; ctx.font = '400 96px Bangers'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '6px';
  ctx.fillText('PERSIMMON', 0, -60); ctx.font = '400 56px Bangers'; ctx.letterSpacing = '4px'; ctx.fillText('(AGENCY)', 0, 60);
  ctx.restore(); ctx.restore();
}
function lotScene(lt, sh) {
  V2.opts.reflect = false;
  V2.setLight({ key: [.55, -.7], keyColor: '#dfe9ff', keyA: .32, rim: '#9fc4ff', rimA: .55, shadow: '#080a28', shadowA: .5, amb: '#8a94d8', ambA: .12, bounce: '#ffcf99', bounceA: .18 });
  lotNight(lt);
  // the Moon in the top right corner (a character, never a disc); lit from the front in the two-shot
  const mo2 = sh === 'mo2';
  A7.moon(862, 400, .62, { t: lt, haloA: mo2 ? 1 : .75, char: { expr: sh === 'mo2' ? 'dead' : 'smug', look: [-.5, .4], lid: .18 } });
  persimmonSpace();
  // the insert (28.5-28.95): only the painted stall, nobody standing in it or beside it
  if (lt >= 28.5 && lt < 28.95) return;
  const cast = [
    ['adm', actor(A9.melon, lotAt(STALL.adm, LOT_D), lt, { expr: 'happy', look: [.4, 0], hold: { l: 'clipboard6' }, grip: { l: [-100, 30] }, arms: { l: 'hold', r: 'rest' }, clipText: 'DRILL' }, 1.22)],
    ['lem', actor(A7.lemon, lotAt(STALL.lem, LOT_D), lt, { expr: 'dead', lid: .3, hold: { l: 'clipboard6' }, grip: { l: [-100, 30] }, arms: { l: 'hold', r: 'rest' }, clipText: 'DRILL' }, 1)],
    ['mng', actor(A7.mango, lotAt(STALL.mng, LOT_D), lt, { expr: 'happy', acc: ['badge7', 'gaitbelt7', 'keys7'], arms: { l: 'hips', r: 'rest' } }, 1)],
    ['str', actor(A11.straw, lotAt(STALL.str, LOT_D), lt, { expr: 'dead', look: sh === 's4' ? [-.9, 0] : [.2, 0], arms: { l: 'rest', r: 'rest' } }, 1)],
    ['clm', actor(A10.clem, lotAt(STALL.clm, LOT_D), lt, { expr: 'hopeful', hold: { r: 'drill12_mop' }, grip: { r: [96, 40] }, arms: { l: 'rest', r: 'hold' } }, 1)],
  ];
  for (const [, c] of cast) drawChar(c);   // the lot is a wide: everybody is sharp
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot(lt) { return lt < 22.79 ? shotHall(lt) : lt < 23.84 ? 'muster' : lt < 25.96 ? 'mo1' : lt < 26.87 ? 's4' : lt < 28.09 ? 'mo2' : lt < 29.48 ? 's5' : 'end'; },
  cam(lt) {
    if (lt >= 22.79) {
      // the lot: no camera travel, a push on the wide, a close-up on Strawberry for s4, the two-shot for mo2, a pull-out to finish
      V2.setCam({ cz: 0, cx: 0, cy: 360, hy: 860, f: 1400 });
      if (lt < 23.84) { zoomTo(540, 960, 1); return; }                                        // muster: the lot, still
      if (lt < 25.96) { zoomTo(540, 960, 1 + .04 * sk(lt, 23.84, 25.8)); return; }             // mo1: a slow push on the row and the Moon
      if (lt < 26.87) { zoomTo(775, 760, 1.5); return; }                                      // s4: Strawberry
      if (lt < 28.09) { zoomTo(540, 960, 1.12); return; }                                     // mo2: the two-shot, the Moon and Strawberry
      if (lt < 28.5 || lt >= 28.95 && lt < 29.48) { zoomTo(775, 760, 1.5); return; }          // s5: Strawberry, around the insert
      if (lt < 28.95) { zoomTo(621, 1167, 2.2); return; }                                     // the insert: the empty PERSIMMON stall on the ground
      { const k = sk(lt, 29.48, 30.28); zoomTo(lerp(775, 540, k), lerp(760, 960, k), lerp(1.5, 1.0, k)); return; }   // the end: a pull-out to the wide lot
    }
    // the hall: the camera tracks with the group in the tracking shots (cz from camZ) and frames by the keyframe track
    const [cx, z, cy, y0] = trackAt(lt);
    V2.setCam({ cz: camZ(lt), cx, cy, hy: 860, f: 1400 });
    zoomTo(540, y0, z);
  },
  draw(lt) {
    if (lt >= 22.79) { lotScene(lt, SC.shot(lt)); return; }
    hallScene(lt, shotHall(lt));
  },
  fx(lt) {
    if (lt >= 22.79) return { bloom: .55, vignette: .45, grain: .045, contrast: .15, sat: .05, tint: [['#27307a', .14, 'soft-light']] };
    const inten = strobe(lt);
    return { bloom: .5 + .2 * inten, vignette: .4, grain: .045, contrast: .14, sat: .08, tint: [['#ffe6c0', .08, 'soft-light'], ['#3a4f7a', .08, 'multiply'], ['#ff2a3a', .16 * inten, 'screen']] };
  },
  blur(lt) {
    for (const c of [1.5, 4.38, 6.76, 8.33, 11.04, 12.70, 14.56, 15.91, 16.86, 18.95, 20.15, 20.83, 21.71, 22.79, 23.84, 25.96, 26.87, 28.09, 28.5, 28.95]) if (Math.abs(lt - c) < .03) return 1;   // a cut frame: one sample only
    if (lt > 7.1 && lt < 7.6) return 10;      // the whip to the closet
    if (lt > 7.29 && lt < 8.3) return 10;     // the scramble
    if (lt < 7.1 && lt > 1.5) return 6;       // the tracking shots
    return 1;
  },
  over(lt) {
    sfxWord(lt, .1, 'BRRRRING!', 540, 400, { size: 124, hold: .9, rot: -.06 });
    sfxWord(lt, 1.0, 'BRRRING!', 540, 400, { size: 112, hold: .42, rot: .05 });
    sfxWord(lt, B('c1').s + .05, 'SKRRRT!', 540, 430, { size: 112, hold: .42, rot: -.07 });
    sfxWord(lt, B('peel').s + .4, 'BOING!', 540, 430, { size: 120, hold: .42, rot: .06 });
  },
};

window.__EP12_SCENES = window.__EP12_SCENES || {};
window.__EP12_SCENES.drill = SC;
})();
