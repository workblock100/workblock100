'use strict';
/* SHIFT HAPPENS, Episode 12: "The In-Service". Scene module: drill (THE FIRE DRILL, 30.73 s, clock 3:41 PM). Scene builder E12-C.
 *
 * SHOT LIST (scene-local seconds, from scene_info.py):
 *  alarm   0.00-1.50  HALL wide, camera still, slow push. Strobe from the firebell (0.1): a red flash about twice a second until 22.6.
 *  a1      1.50-4.23  HALL tracking: the camera walks back at the group's pace, so the doors slide past. The Administrator, centre, clipboard in his right hand.
 *  l1      4.38-6.56  Lemon, tight, at the back left. The Administrator steps right (4.3-5.0) so he is clear of her.
 *  c1      6.76-7.18  hard cut to the supply closet on the right wall (the MUSTER POINT sign hangs mid-hall, its arrow pointing at the door). Clementine skids in (SKRRRT!) and goes inside.
 *  run     7.29-8.29  the scramble: the camera moves faster and shakes. The Administrator walks off to the left (7.0-9.0). Clementine comes out with a mop (7.7).
 *  m1      8.33-11.04 wide: Mango at the back right by the chair, Clementine in the closet doorway ("Clementine. The exit is that way.").
 *  r1      11.04-12.50 hard cut: a tight two-shot, Mrs. Cranberry in her chair and Mango ("Is this nineteen sixty-two?"). Clementine is back inside the closet.
 *  m2      12.70-14.41 the same two-shot ("It's a drill, Mrs. C."); the chair rolls toward the camera from 13.5 and stops dead on the fire-door threshold at 14.5.
 *  r2      14.56-15.71 hard cut: a low angle on the chair at the threshold ("Then I am not going."). Mrs. Cranberry folds her arms.
 *  peel    15.91-16.81 hard cut to the far hall, the group at the left of the frame; Mr. Banana, far down the right wall, slips on a peel (peel 0.2, boing 0.4).
 *  s1-s5   16.86-22.79 close-ups on Strawberry's list: one finger on "Residents", two on "second", three on "Third", four on "Pizza last". The Administrator's reactions (a2, a3) sit between.
 *  muster  22.79-23.84 hard cut to the parking lot at night (crickets at 0.2). The strobe is off.
 *  mo1     23.84-25.96 the lot, wide, the Moon in the top right ("I counted. Everyone is here.").
 *  s4      25.96-26.87 Strawberry, close, looks along the row ("Who's missing?").
 *  mo2     26.87-28.09 two-shot: the Moon and the row ("Persimmon.").
 *  s5      28.09-29.48 Strawberry, close. A hard cut to the empty PERSIMMON stall on the asphalt (28.5-28.95, nobody drawn), then back to her ("She's on another budget.").
 *  end     29.48-30.28 hard cut to the wide lot, held for the sting.
 *
 * Layout: the hall is S6.corridor (HW 330, ceiling 700). The camera is V2.P (f 1400, cy 360, hy 860): a point at depth D is drawn at scale 1400 / D, its floor line at y = 860 + 360 * 1400 / D.
 * Hall depths from the camera: Strawberry X -310 D 1480 (front left). The Administrator X -70 D 1420, X 80 from l1 on, X -330 for the Mrs. Cranberry shots, back at X 80 for the peel.
 * Lemon X -146 D 2050 (back left). The chair X 15 and Mango X 215 at D 2050, pulling to 1800 (back right). Clementine X 150-340 at D 1560, at the closet on the right wall.
 * Neighbours (not the focal character of a shot) are drawn with drawBg, soft inside V2.dof, and are not held to the audit. The camera track TRK holds [time, cx, zoom, cy, y0] keys; a repeated time is a hard cut
 * (blur 1 on those frames). cx pans the perspective (V2.setCam) and zoom / y0 frame the shot (zoomTo(540, y0, z)).
 * Lot (camera depth 0): the staff stand at depth 1700 on the stalls: Clementine X -400, Mango -240, Lemon -80, PERSIMMON 60 (empty), Strawberry 200, the Administrator 452. The stall lines and
 * the ground lettering are painted in perspective (vertical squash = cy / depth).
 * Props: drill12_mop and drill12_fingers, registered through EXT.prop and PROP_BOX.
 * Source notes: the hall is S6.corridor with the S6 wall helpers (ep6_sets.js, ep6_rooms.js); the lot's sky, building and asphalt follow ep9_exit.js lotNight; sfxWord and wordT are copies of the
 * ep9 and ep10 helpers; handTo is a copy of ep10_days.js. */
(() => {
if (!window.TIMELINE_EP12) return;
const { zoomTo, drawBg, person, localOf, faceC } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A12 = window.A12, S6 = window.S6, S7 = window.S7;
const { kz, lampPost, car3, wallClock, onZ, box3 } = S6;
const { p2, poly, grad } = V2;
const HW = S6.HW, CH = S6.CH;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 and 10 ones; the sound word is the shared A12.sfx)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const sfxWord = A12.sfx;   /* the sound word, set by the UI kit (ep12_art.js) */
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
Object.assign(PROP_BOX, { drill12_mop: [-18, -330, 18, 330], drill12_fingers: [-30, -62, 30, 14] });   /* the mop is audited as its shaft (the sponge head rests on the floor) */
// a mop held by the handle: a wood shaft through the hand, the grey sponge head resting on the floor (the floor is about 190 local px below the grip)
EXT.prop.drill12_mop = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .07);
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
/* the plaque numbers of this frame: the corridor draws every plaque with its number; far doors crowd each other near the vanishing point and near doors run off the frame, so a number is kept only
   when its box is whole in the frame and does not touch the number of a nearer door. (Doors keep their plaques; only the digits are left out.) */
function doorsAt() {
  const P = V2.P, cand = [];
  DOORS.forEach((d, i) => {
    const pz = d.z + 107, pk = P.f / (pz - P.cz);
    if (!(pk > .36) || pz <= P.cz + 60) return;
    if (d.side === 1 && Math.abs(d.z - Z_DOOR) < 330) return;   /* the closet's neighbours */
    const [px, py] = p2(d.side * HW, 361, pz), size = 16 * pk, w = UI.sizeOf(d.n, { size, weight: 900 }).w;
    cand.push({ i, pk, box: A12.box(px - w / 2 - 3, py - size * .42, px + w / 2 + 3, py + size * .42) });
  });
  cand.sort((a, b) => b.pk - a.pk);
  const keep = new Set(), taken = [];
  for (const c of cand) {
    if (!A12.whole(c.box, 14)) continue;
    if (taken.some(t => c.box[0] < t[2] + 4 && c.box[2] > t[0] - 4 && c.box[1] < t[3] + 4 && c.box[3] > t[1] - 4)) continue;
    taken.push(c.box); keep.add(c.i);
  }
  return DOORS.map((d, i) => keep.has(i) ? d : Object.assign({}, d, { n: '' }));
}
const DECOR = [{ side: -1, z: 1100, c: '#e6a23c' }, { side: 1, z: 1400, c: '#6cc1d9' }, { side: -1, z: 1990, c: '#9bd96c' }, { side: 1, z: 2300, c: '#d96c8a' }];

// the strobe: a flash about twice a second from the firebell (0.1) until the muster point (22.6)
const STROBE_ON = .1, STROBE_OFF = 22.6;
const strobe = lt => { if (lt < STROBE_ON || lt > STROBE_OFF) return 0; const p = ((lt - STROBE_ON) % .5) / .5; return Math.exp(-p * 9); };
// the closet door: shut until Clementine hits it (7.05), then it swings into the closet over the next .4 s
const doorOpen = lt => sk(lt, 7.05, 7.45) * (1 - sk(lt, 10.9, 11.25));

const LEM_X = -215;   /* Lemon stands clear of Mrs. Cranberry's chair (X 15): their faces no longer touch in the far shots */
// the camera track for the hall: [time, cx, zoom, cy, y0] keyframes; two equal times make a hard cut (blur is 1 on those frames)
const TRK = [
  [0, 0, 1.00, 360, 960], [1.5, 0, 1.04, 360, 960],                                                                    // alarm: a slow push
  [2.6, -70, 1.14, 360, 900], [4.3, -70, 1.14, 360, 900],                                                              // a1: the Administrator
  [4.9, LEM_X, 2.20, 360, 830], [6.6, LEM_X, 2.20, 360, 830], [6.7, LEM_X, 2.20, 360, 830],                               // l1: Lemon, tight
  [6.759, 310, 1.10, 360, 860], [7.6, 40, 1.00, 360, 960],                                                             // c1: a hard cut to the closet; then the scramble, wide
  [8.33, 0, 1.00, 360, 960], [11.0, 0, 1.00, 360, 960], [11.04, 0, 1.00, 360, 960],                                    // m1: the wide two-shot by the closet
  [11.041, 200, 1.90, 360, 840], [14.5, 200, 1.90, 360, 840],                                                          // r1 -> m2: Mrs. Cranberry and Mango, tight
  [14.559, 130, 1.45, 130, 900], [15.9, 130, 1.45, 130, 900],                                                          // r2: a low angle on the chair
  [15.91, 300, 1.00, 360, 960], [16.86, 300, 1.04, 360, 960],                                                          // peel: a cut to the far hall
  [16.87, -310, 1.60, 360, 890], [18.9, -310, 1.60, 360, 890], [18.95, -310, 1.60, 360, 890],                          // s1: Strawberry's list
  [18.951, 80, 1.65, 360, 850], [20.1, 80, 1.65, 360, 850], [20.15, 80, 1.65, 360, 850],                            // a2
  [20.151, -310, 1.60, 360, 890], [20.8, -310, 1.60, 360, 890], [20.83, -310, 1.60, 360, 890],                         // s2
  [20.831, 80, 1.65, 360, 850], [21.6, 80, 1.65, 360, 850], [21.71, 80, 1.65, 360, 850],                            // a3
  [21.711, -310, 1.60, 360, 890], [22.79, -310, 1.60, 360, 890],                                                       // s3
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
const P_STR = at(-310, 1480), P_LEM = at(LEM_X, 2050);
// the Administrator: centre front at the start; steps right during l1 so Lemon is clear of him, walks off left in the run and m1 (the pizza run),
// is out of frame for the Mrs. Cranberry shots, and walks back in for the peel
const admX = lt => lt < 4.3 ? -70 : lt < 5.0 ? lerp(-70, 80, easeIO(seg(lt, 4.3, 5.0))) : lt < 7.0 ? 80 : lt < 9.4 ? lerp(80, -900, easeIO(seg(lt, 7.0, 9.4))) : lt < 15.6 ? -900 : lt < 16.8 ? lerp(-900, 80, easeIO(seg(lt, 15.6, 16.8))) : 80;   /* he walks off to the left (out of the frame by 9.0) and walks back in for the peel */
const admWalking = lt => (lt >= 7.0 && lt < 9.4) || (lt >= 15.6 && lt < 16.8);
const P_ADM = lt => [admX(lt), camZ(lt) + 1420];
// Clementine: in the group until 6.6, runs to the closet (skids in at 7.05, goes inside at 7.25), comes back out with the mop at 7.7, stands in the doorway, goes back in at 10.9 (hidden from 11.0)
const P_CLM = lt => [lt < 7.1 ? lerp(150, 310, sk(lt, 6.6, 7.1)) : lt < 7.25 ? lerp(310, 340, sk(lt, 7.1, 7.25)) : lt < 7.7 ? 340 : lt < 10.8 ? lerp(340, 310, sk(lt, 7.7, 7.95)) : lerp(310, 340, sk(lt, 10.8, 11.0)), camZ(lt) + 1560];
const clmVisible = lt => (lt < 7.25 || (lt >= 7.7 && lt < 11.0));
const chairD = lt => lerp(2050, 1800, easeOut(seg(lt, 13.5, 14.5)));
const P_CHAIR = lt => [15, camZ(lt) + chairD(lt)];
const P_MNG = lt => [215, camZ(lt) + chairD(lt)];
const P_BAN = at(320, 2600);

// the parking lot: the staff on their stalls at depth 1700 (no camera travel)
/* the lot: the staff stand each on their own painted stall at depth 1700, one feet line, a hand's width between neighbours (nobody covers a neighbour's face or badge): Clementine -560,
   Mango -350, Lemon -130, PERSIMMON (empty, 220 wide) 100, Strawberry 315, the Administrator 590. The wide shots frame the whole row (zoom LOT.z about LOT.x), every hand inside the frame. */
const LOT_D = 1700, STALL = { clm: -560, mng: -350, lem: -130, empty: 100, str: 315, adm: 590 };
const STALL_LINES = [-670, -455, -245, -10, 210, 435, 745];
const LOT = { z: .82, x: 577 };
const lotAt = (X, D) => lt => [X, D];

// Mr. Banana, far down the hall: he steps on the peel (16.11), slips over backwards, and bounces off the floor on the boing (16.31)
function banana(lt) {
  const t0 = B('peel').s + .2, fall = sk(lt, t0, t0 + .36), boing = lt > t0 + .36 ? Math.sin(seg(lt, t0 + .36, t0 + .72) * PI) : 0;
  const q = V2.at(...P_BAN(lt)), s = q.s * .42, slipped = lt > t0;
  return A7.banana(Object.assign(q, { s, rot: -fall * 1.35, lift: boing * 22 * s, expr: slipped ? 'panic' : 'happy', arms: slipped ? { l: 'up', r: 'up' } : { l: 'rest', r: 'rest' }, look: [0, -.2] }));
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
    if (inten > .02) { V2.glow(lx, ly, 300 * k, '255,40,50', .9 * inten, 'screen', .8); V2.glow(lx, ly, 1100 * k, '255,50,60', .45 * inten, 'screen', .5); }
    { const fb = A12.box(lx - 30 * k, ly + 44 * k - 14 * k, lx + 30 * k, ly + 44 * k + 14 * k);
      if (A12.whole(fb, 16)) UI.label('FIRE', lx, ly + 44 * k, { size: 24 * k, fill: '#ffffff', spacing: 2, hero: false }); } }
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
        /* the plaque is set dressing on the wall: its word and the red slash through the Q are drawn only when the whole plaque is in the frame (never sliced by an edge) */
        const [qa, qb] = [p2(HW, 362, zf + 10), p2(HW, 304, z1 - 10)], qbox = A12.box(Math.min(qa[0], qb[0]), qa[1], Math.max(qa[0], qb[0]), qb[1]);
        if (A12.whole(qbox, 20)) {
          UI.label('QUIET', qx, qy, { size: 34 * kk, font: 'Bangers', fill: '#2b2530', hero: false });
          ctx.strokeStyle = '#d6203a'; ctx.lineWidth = 3 * kk; ctx.beginPath(); ctx.moveTo(qx - 30 * kk, qy - 13 * kk); ctx.lineTo(qx - 14 * kk, qy + 14 * kk); ctx.stroke();
        }
      }
    }
  }
  // the MUSTER POINT sign: hung from the ceiling mid-hall, its arrow pointing across at the closet door on the right wall (the sign is wrong: it sends them to the closet).
  // It is a flat sign facing the camera (uniform scale, nothing skewed); it is drawn only when the whole of it, arrow included, is inside the frame
  { const [sx, sy] = p2(160, 540, Z_DOOR), k = kz(Z_DOOR), gb = A12.box(sx - 134 * k, sy - 66 * k, sx + 190 * k, sy + 60 * k);
    if (A12.whole(gb, 24)) {
      ctx.save(); ctx.translate(sx, sy); ctx.scale(k, k);
      UI.sign([-130, -62, 250, 118], 'MUSTER POINT', { fill: '#1a7a4a', stroke: 'rgba(10,30,20,.8)', lw: 4, r: 14, size: 44, font: 'Bangers', spacing: 1, ink: '#eafff0', pad: 16, hero: false, id: 'muster' });
      ctx.fillStyle = '#fff6d6'; ctx.strokeStyle = 'rgba(10,30,20,.8)'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(118, -26); ctx.lineTo(150, -26); ctx.lineTo(150, -50); ctx.lineTo(186, 0); ctx.lineTo(150, 50); ctx.lineTo(150, 26); ctx.lineTo(118, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } }
}

// Strawberry's list: each finger rises on its word (1 on "Residents", 2 on "second", 3 on "Third", 4 on "Pizza")
function fingerState(lt) {
  const t1 = wordT('s1', 'residents', B('s1').s + .1), t2 = wordT('s1', 'second', B('s1').s + 1.3), t3 = wordT('s2', 'third', B('s2').s + .1), t4 = wordT('s3', 'pizza', B('s3').s + .1);
  return [sk(lt, t1 - .05, t1 + .2), sk(lt, t2 - .05, t2 + .2), sk(lt, t3 - .05, t3 + .2), sk(lt, t4 - .05, t4 + .2)];
}

// the hall cast: who is in each shot. A shot shows only the people it is about, sharp and whole; nobody else is drawn (no soft neighbour at the edge of the frame, no over-the-shoulder blur).
// The wides carry the whole group; a character walking in or out of the frame (the Administrator in the run and the peel) is a transit and may be cut by the edge.
const FOCAL = {
  alarm: ['str', 'adm'], a1: ['str', 'adm'], l1: ['lem'], c1: ['clm'], run: ['adm', 'clm'], m1: ['mng', 'clm', 'cran'], r1: ['cran', 'mng'], m2: ['cran', 'mng'],
  r2: ['cran'], peel: ['lem', 'cran', 'mng'], s1: ['str'], a2: ['adm'], s2: ['str'], a3: ['adm'], s3: ['str'],
};
const shotHall = lt => lt < 1.5 ? 'alarm' : lt < 4.38 ? 'a1' : lt < 6.76 ? 'l1' : lt < 7.29 ? 'c1' : lt < 8.33 ? 'run' : lt < 11.04 ? 'm1' : lt < 12.70 ? 'r1' : lt < 14.56 ? 'm2' : lt < 15.91 ? 'r2' : lt < 16.86 ? 'peel' : lt < 18.95 ? 's1' : lt < 20.15 ? 'a2' : lt < 20.83 ? 's2' : lt < 21.71 ? 'a3' : lt < 22.79 ? 's3' : 'lot';
function hallCast(lt, sh) {
  const F = FOCAL[sh] || [];
  const draw = (k, o) => { if (F.includes(k)) drawChar(o); };
  const fingers = fingerState(lt);
  // far back: Lemon (left), Mrs. Cranberry in her chair and Mango (right, pulling to the threshold)
  const lem = actor(A7.lemon, P_LEM, lt, { expr: 'dead', lid: .3, look: [.3, .1], hold: { l: 'clipboard6' }, grip: { l: [-96, 96] }, arms: { l: 'hold', r: 'rest' }, clipText: 'DRILL' }, 1);
  const qC = V2.at(...P_CHAIR(lt));
  const cran = A7.cran({ x: qC.x, y: qC.y - 118 * qC.s, s: qC.s, noLegs: true, noShadow: true, look: [-.7, 0], expr: lt > 14.56 ? 'sour' : 'happy', arms: lt > 14.6 ? { l: [1.25, -2.0], r: [1.25, -2.0] } : { l: 'rest', r: 'rest' } });
  const mng = actor(A7.mango, P_MNG, lt, { look: [-.8, 0], expr: lt > 7.6 && lt < 8.4 ? 'panic' : 'happy', acc: ['badge7', 'gaitbelt7', 'keys7'], arms: { l: 'rest', r: lt > 13.2 && lt < 14.6 ? [2.0, .1] : 'reach' } }, 1);
  // the back row first (far to near), then the front
  draw('lem', lem);
  draw('mng', mng);
  if (F.includes('cran')) { S7.wheelchairBack(qC.x, qC.y, qC.s); drawChar(cran); S7.wheelchairFront(qC.x, qC.y, qC.s); }   /* the wheelchair: its back half, Mrs. Cranberry, then its front half (the Episode 7 chair) */
  // Clementine: at the closet from 7.1, then out with a mop
  if (clmVisible(lt)) {
    const clm = actor(A10.clem, P_CLM, lt, { expr: lt > 7.2 && lt < 8.2 ? 'shock' : 'hopeful', look: [-.2, 0], hold: lt > 7.8 ? { r: 'drill12_mop' } : {}, grip: { r: [150, 60] }, arms: lt > 7.8 ? { l: 'rest', r: 'hold' } : { l: 'rest', r: 'rest' } }, 1);
    draw('clm', clm);
  }
  // Strawberry, front left, the calm one; her hand goes up for the list from 16.86
  const str = actor(A11.straw, P_STR, lt, { expr: lt > 16.8 && lt < 22.6 ? 'dead' : 'chill', look: [-.6, .05], arms: { l: 'rest', r: 'rest' }, hold: lt > 16.8 && lt < 22.6 ? { l: 'drill12_fingers' } : {}, hand: lt > 16.8 && lt < 22.6 ? { l: 'fist' } : {}, fingers: fingers }, 1);
  if (lt > 16.8 && lt < 22.6) { const k = sk(lt, 16.8, 17.3) * (1 - sk(lt, 22.4, 22.7)); handTo(str, -1, str.x - 96 * str.s, str.y - 300 * str.s, k, [-150, 90]); }
  draw('str', str);
  // the Administrator, front centre: his clipboard, his wave, his two reactions
  const adm = actor(A9.melon, P_ADM, lt, { expr: lt > 18.95 && lt < 20.1 ? 'shock' : lt > 20.83 && lt < 21.7 ? 'sad' : 'happy', look: [.4, 0], hold: { r: 'clipboard6' }, grip: { r: [110, 120] }, arms: { l: lt < 3.0 ? 'wave' : 'rest', r: 'hold' }, hand: lt < 3.0 ? { l: 'wave' } : {}, clipText: 'DRILL', transit: admWalking(lt) }, 1.22);
  draw('adm', adm);
}
function hallScene(lt, sh) {
  V2.setLight({ key: [-.4, -.8], keyColor: '#fff3dc', keyA: .26, rim: '#cfe0ff', rimA: .5, shadow: '#3a3048', shadowA: .3, bounce: '#ffe0b0', bounceA: .18, amb: '#fff6e6', ambA: .05 });
  V2.opts.reflect = true;
  S6.corridor({ doors: doorsAt(), ch: CH, fog: '#c4cfe2', fogAmt: .32, wall: '#e9e0cb', wain: '#5c9298', lampOn: 1, bright: .9, signs: [], decor: DECOR, zFar: 7600 });
  hallFixtures(lt);
  // Mr. Banana and his peel, far down the hall, behind the action
  if (lt > 15.5 && lt < 17.2) {
    const q = V2.at(...P_BAN(lt));
    A7.peelFloor(q.x - 22 * q.s * .42, q.y, q.s * .42 * 1.1); drawBg(banana(lt));   /* small, far, sharp: the slip has to read */
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
  { const [sx, sy] = p2(0, bh + 89, Zb), sz = { size: 42 * k, spacing: 4 * k }, sw = UI.sizeOf('FRUIT BOWL REHAB & NURSING', sz).w;
    /* the word on the sign (a warm glow behind it) is drawn only when the whole of it is in the frame; a close-up that would slice it sees the plain sign board */
    if (A12.whole(A12.box(sx - sw / 2 - 8, sy - 24 * k, sx + sw / 2 + 8, sy + 24 * k), 20)) { ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 16; UI.label('FRUIT BOWL REHAB & NURSING', sx, sy, Object.assign({ fill: '#ffe9b0', hero: false }, sz)); ctx.restore(); } }
  // the asphalt, then the painted stalls in true perspective
  { const yb = p2(0, 0, Zb)[1]; ctx.fillStyle = grad(0, yb - 2, 0, H, [[0, '#3a3e66'], [.5, '#22243e'], [1, '#12132a']]); ctx.fillRect(-300, yb - 2, W + 600, H - yb + 320); }
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineCap = 'butt';
  for (const x of STALL_LINES) { const a = p2(x, 0, 1450), b = p2(x, 0, 2000); ctx.lineWidth = Math.max(2, 9 * kz(1450)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  { const a = p2(STALL_LINES[0], 0, 1450), b = p2(STALL_LINES[STALL_LINES.length - 1], 0, 1450); ctx.lineWidth = Math.max(2, 9 * kz(1450)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  car3(-820, 1880, { color: '#2c8f9a', brake: .1 }); car3(860, 1900, { color: '#5a3b8a', brake: .1, w: 160 });
  lampPost(-760, 1300, { h: 640, on: .7 }); lampPost(760, 1300, { h: 640, on: .7 });
}
// the outlined PERSIMMON stall, lettered on the ground. The dashed space is 220 wide (the stall's own width) and 420 deep; the lettering is centred in it, both ways, and shrunk to fit its width (it was
// 2.5 times the stall's width and ran under the neighbours' feet). The letters are stretched along the stall (the ground foreshortening is only .62, not the full cy / depth) the way road markings
// are painted, so they read upright; nobody stands in the space and no neighbour's feet reach it.
function persimmonSpace() {
  const Zc = LOT_D, Xc = STALL.empty, gz = .62, kk = kz(Zc);
  ctx.save();
  const q = [p2(Xc - 110, 0, 1490), p2(Xc + 110, 0, 1490), p2(Xc + 110, 0, 1910), p2(Xc - 110, 0, 1910)];
  ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = Math.max(3, 7 * kk); ctx.setLineDash([24 * kk, 14 * kk]);
  ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
  const [cx, cy] = p2(Xc, 0, Zc), hero = CAM.z > 1.8;   /* the insert on the stall is the one shot that has to be read */
  ctx.translate(cx, cy); ctx.scale(kk, kk * gz);
  UI.container('persimmon', 'stall', [-110, -120, 110, 120], 8);
  const ink = 'rgba(255,246,222,.94)';
  /* the lettering is drawn only where it clears the captions (in Strawberry's close-ups the stall is down in the caption zone: there it is just the dashed space) */
  if (A12.clear(A12.box(-90, -62, 90, 62))) {
    UI.label('PERSIMMON', 0, -28, { size: 64, font: 'Bangers', fill: ink, spacing: 3, maxW: 146, min: 16, cid: 'persimmon', hero });
    UI.label('(AGENCY)', 0, 32, { size: 42, font: 'Bangers', fill: ink, spacing: 2, maxW: 116, min: 12, cid: 'persimmon', hero });
  }
  ctx.restore();
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
  // the row, left to right. Props point outboard so nothing reaches a neighbour's face. A close-up on Strawberry (s4, s5) shows only her.
  const closeOnStr = sh === 's4' || sh === 's5';
  const cast = [
    ['clm', actor(A10.clem, lotAt(STALL.clm, LOT_D), lt, { expr: 'hopeful', hold: { r: 'drill12_mop' }, grip: { r: [74, 60] }, arms: { l: 'rest', r: 'hold' } }, 1)],
    ['mng', actor(A7.mango, lotAt(STALL.mng, LOT_D), lt, { expr: 'happy', acc: ['badge7', 'gaitbelt7', 'keys7'], arms: { l: 'hips', r: 'rest' } }, 1)],
    ['lem', actor(A7.lemon, lotAt(STALL.lem, LOT_D), lt, { expr: 'dead', lid: .3, hold: { r: 'clipboard6' }, grip: { r: [90, 60] }, arms: { l: 'rest', r: 'hold' }, clipText: 'DRILL' }, 1)],
    ['str', actor(A11.straw, lotAt(STALL.str, LOT_D), lt, { expr: 'dead', look: sh === 's4' ? [-.9, 0] : [.2, 0], arms: { l: 'rest', r: 'rest' } }, 1)],
    ['adm', actor(A9.melon, lotAt(STALL.adm, LOT_D), lt, { expr: 'happy', look: [.4, 0], arms: { l: 'rest', r: 'rest' } }, 1.22)],
  ];
  for (const [k, c] of cast) if (!closeOnStr || k === 'str') drawChar(c);   /* in her close-ups only Strawberry is drawn: nobody soft, nobody cut by the edge */
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot(lt) { return lt < 22.79 ? shotHall(lt) : lt < 23.84 ? 'muster' : lt < 25.96 ? 'mo1' : lt < 26.87 ? 's4' : lt < 28.09 ? 'mo2' : lt < 29.48 ? 's5' : 'end'; },
  cam(lt) {
    if (lt >= 22.79) {
      // the lot: no camera travel, a push on the wide, a close-up on Strawberry for s4, the two-shot for mo2, a pull-out to finish. The wides frame the whole row of six (zoom LOT.z about LOT.x)
      V2.setCam({ cz: 0, cx: 0, cy: 360, hy: 860, f: 1400 });
      const sx = 540 + STALL.str * kz(LOT_D), ex = 540 + STALL.empty * kz(LOT_D);   /* Strawberry's and the empty stall's screen x */
      if (lt < 23.84) { zoomTo(LOT.x, 960, LOT.z); return; }                                                        // muster: the lot, still
      if (lt < 25.96) { zoomTo(LOT.x, 960, LOT.z * (1 + .04 * sk(lt, 23.84, 25.8))); return; }                      // mo1: a slow push on the row and the Moon
      if (lt < 26.87) { zoomTo(sx, 760, 1.5); return; }                                                             // s4: Strawberry
      if (lt < 28.09) { zoomTo(LOT.x, 960, LOT.z * 1.04); return; }                                                 // mo2: the two-shot, the Moon and the row
      if (lt < 28.5 || lt >= 28.95 && lt < 29.48) { zoomTo(sx, 760, 1.5); return; }                                 // s5: Strawberry, around the insert
      if (lt < 28.95) { zoomTo(ex, 1150, 3.1); return; }                                                            // the insert: the empty PERSIMMON stall on the ground
      zoomTo(LOT.x, 960, LOT.z); return;   // the end: a cut to the wide lot, held for the sting
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
    return { bloom: .5 + .2 * inten, vignette: .4, grain: .045, contrast: .14, sat: .08, tint: [['#ffe6c0', .08, 'soft-light'], ['#3a4f7a', .08, 'multiply'], ['#ff2a3a', .22 * inten, 'screen']] };
  },
  blur(lt) {
    for (const c of [1.5, 4.38, 6.76, 8.33, 11.04, 12.70, 14.56, 15.91, 16.86, 18.95, 20.15, 20.83, 21.71, 22.79, 23.84, 25.96, 26.87, 28.09, 28.5, 28.95]) if (Math.abs(lt - c) < .03) return 1;   // a cut frame: one sample only
    if (lt > 6.76 && lt < 7.6) return 10;      // the whip to the closet
    if (lt > 7.29 && lt < 8.3) return 10;     // the scramble
    if (lt < 7.1 && lt > 1.5) return 6;       // the tracking shots
    return 1;
  },
  over(lt) {
    sfxWord(lt, .1, 'BRRRRING!', 540, 400, { size: 124, hold: .62, rot: -.06 });   /* one word at a time: this one has faded (.92) before the next lands (1.0) */
    sfxWord(lt, 1.0, 'BRRRING!', 540, 400, { size: 112, hold: .42, rot: .05 });
    sfxWord(lt, B('c1').s + .05, 'SKRRRT!', 540, 430, { size: 112, hold: .42, rot: -.07 });
    sfxWord(lt, B('peel').s + .4, 'BOING!', 540, 430, { size: 120, hold: .42, rot: .06 });
  },
};

window.__EP12_SCENES = window.__EP12_SCENES || {};
window.__EP12_SCENES.drill = SC;
})();
