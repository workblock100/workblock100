'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scene module: vault (10:55 PM, THE ADMINISTRATOR'S OFFICE, 21.149 s). Registers window.__EP11_SCENES.vault.
 *
 * The invoice argument, the vault reveal, the budget joke and the moth. Built on the finished night office set window.S10 (ep10_set.js, not edited):
 * S10.office() gives the room, the throne (chairShift rolls it along the desk), the portrait + vault door + recess, the lamp (lampOn), the guest chair.
 * Cast: A11.straw (per diem look; teal coat accessory 'excoat11' when ep11_exit.js has registered it, looked up at draw time) and A9.melon (the Administrator, s 1.22, seated noLegs).
 * Everything is a pure function of the scene-local time lt; every time below is tied to a beat (B('id')) or to a spoken word (TL.lines via wordT).
 *
 * SHOTS (scene-local seconds; SHOTS() holds the cut times, the shot name changes at every cut):
 *   screen 0-1.00      insert: her laptop screen, the invoice typed from 0.25 (cue +0.05 into 'open') wide 1.00-2.32   the office in the lamp pool, push-in
 *   two 2.32-2.78      two-shot as he lifts the invoice                                              inv1 2.78-4.18   insert: invoice slides in, his gloved finger taps the total on "eighteen / hundred / dollars"
 *   cuS1 4.18-5.08     "Helping."                                                                     inv2 5.08-6.93   insert: his red marker strikes HELPING, writes NOT IN CONTRACT
 *   two2 6.93-7.30     two-shot                                                                       inv3 7.30-9.12   insert: her blue pen rings (ADD-ON) and $200/HR, underlines the total
 *   cuA3 9.12-10.82    "We don't have the budget"                                                     cuS3 10.82-11.52 "You have the agency budget." (smug)
 *   cuA3b 11.52-11.84  his face goes still                                                            trk 11.84-12.93  high camera tracks left while the throne rolls to the portrait
 *   vault 12.93-15.21  the reveal: portrait swings (V-.15..V+.26), wheel spin V+.20 (ratchet), bolts V+.30/.41/.52, hiss V+.58, hinge groan V+.54..V+2.05, door stops V+2.05,
 *                      coin avalanche from V+.35, ka-ching V+1.0, sparkle V+1.3 (V = 12.81); camera pulls out and trucks left; god rays, flare at V+1.25, shake on each clunk
 *   cuA4 15.21-16.70   "Oh. We do have that one." (pleasant surprise)                                cuS4 16.70-18.22 "And the staff budget?" (throne rolls home behind her at 16.72)
 *   cuA5 18.22-19.30   "That's this." the worn purse comes out of his pocket                          purse 19.30-20.28 the purse on the desk: clasp click M+.02, lamp flicker M+.10, moth out M+.12, sting M+.50
 *   wideE 20.28-21.15  the three of them (Administrator, Strawberry stepping in, the moth) in the lamp pool; fade out at the end.
 *
 * Systems: the gold (150 sliding coins + 12 bars + 3 rollers, seeded, deterministic parabola/bounce/friction physics, depth-sorted in four passes between the actors; sprites cached
 * once with S10.art), the vault's inside (painted once), god rays/glow/ring/blobs/dust (V2.beam/glow/dust/flare), the grade (fx: bloom + gold tint), shutter-sampled blur in the two
 * action windows (blur), onomatopoeia in over() (CLANK!, KA-CHING!: small, away from faces). Props registered on EXT.prop: inv11 (the invoice he holds), lap11 (her laptop), purse11
 * (the purse), each with a PROP_BOX for the audit. The moth (drawMoth) has a fuzzy body, powdery two-pair wings that blur at the flap rate, a tiny tired face and a multiply shadow.
 * Layout numbers: STRAW_AT [-100,1040], throne SHIFT -350, vault mouth RC (-355,449,1742), desk purse (372,1340), desk paper (196,1252); cameras BASE/MID/HIGH differ by cy/hy only.
 * Decisions: typing is shown (her laptop in the opening insert, then in her hands, snapped shut on "Strawberry."); the Administrator never walks (the set has no legs behind the desk: he rolls
 * on the throne, which also keeps him framed); invoice reads "HELPING (ADD-ON): 9 HR MINIMUM x $200/HR = $1,800.00", subtotal, "PER DIEM SURCHARGE: $0.00", total $1,800.00.
 */
(() => {
if (!window.TIMELINE_EP11) return;
const { person, zoomTo, faceC, drawBg, localOf } = window.H6;
const A7 = window.A7, A9 = window.A9, A11 = window.A11, S10 = window.S10;
const { p2, poly, quad3, grad, radial } = V2;
const { kz } = window.S6;

// ------------------------------------------------------------------ helpers (copies of the Episode 9/10 ones)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z$0-9]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? easeIn(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const nbr = o => V2.dof(6, () => drawBg(o));
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const eo = (lt, a, b) => easeOut(seg(lt, a, b));
const lerpA = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const smooth = u => u * u * (3 - 2 * u);
const hex = (a, b, t) => { const c = V2.mix(a, b, clamp(t)); return '#' + [0, 1, 2].map(i => Math.round(c[i]).toString(16).padStart(2, '0')).join(''); };
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
// aim a hand at a point in scene coordinates: blend from a resting grip (local coordinates) toward it, never beyond the arm's reach
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}
const gripTo = (o, key, g) => { o.grip = Object.assign(o.grip || {}, { [key]: g }); o.arms = Object.assign(o.arms || {}, { [key]: 'hold' }); };
const goldLine = (x, y, w, h, r, lw = 5) => { ctx.strokeStyle = V2.grad(x, y, x + w, y + h, [[0, '#fff0a8'], [.35, '#c99a2e'], [.7, '#8a6414'], [1, '#e8c458']]); ctx.lineWidth = lw; rr(x, y, w, h, r); ctx.stroke(); };

// ------------------------------------------------------------------ layout (world units: X right, Z forward)
const STRAW_AT = [-100, 1040];      // where she stands, in front of the desk's left end
const BASE = { f: 1400, cy: 400, hy: 860, cz: -100 };
const MID = { f: 1400, cy: 520, hy: 840, cz: -100 };    // after the vault opens: a camera a little higher, so her cap never overlaps the vault circle
const HIGH = { f: 1400, cy: 580, hy: 800, cz: -100 };   // the vault shots
const DOOR_T0 = .54, DOOR_T1 = 2.05;   // the door's swing, in seconds after the vault beat starts
const SHIFT = -350;                 // how far the Administrator's throne rolls along the back of the desk (X 330 to -20)
const RC = { x: -355, y: 449, z: 1742 };   // the vault's mouth (the recess in the set)
const VIS_X = 140;                  // the guest chair is pushed to the right so it never crowds her
const PURSE_AT = [372, 1340];       // where the purse sits on the desk (X, Z)
const PAPER_AT = [196, 1252];       // the invoice lying on the desk (near left corner, X, Z)

// ------------------------------------------------------------------ the beats' clock (scene-local seconds), every time tied to a beat or a spoken word
function K() {
  const V = B('vault').s, M = B('moth').s, a4 = B('a4'), s4 = B('s4'), a5 = B('a5');
  return {
    V, M, a5s: a5.s, freeze: wordT('s3', 'agency', 11.6),
    roll0: 11.84, roll1: 12.56,                        // the throne rolls to the portrait
    reach: 12.46, port0: V - .15, port1: V + .26,      // his hand finds the portrait's edge, the portrait swings open
    flick: V + .0, spin0: V + .20, spin1: V + .66,     // he flicks the wheel; the ratchet sound starts at V + .20
    bolt: [V + .30, V + .41, V + .52], hissAt: V + .58, door0: V + DOOR_T0, door1: V + DOOR_T1,   // three bolts, a hiss, then the hinge groan until the door arrives at its stop
    ching: V + 1.0, sparkle: V + 1.3,
    back0: 16.72, back1: s4.s + .5,                    // the throne rolls home while the camera is on Strawberry
    purseOut: a5.s + .1, purseAway: M, popped: M + .02, mothOut: M + .12, laid: 4.0,   // the purse leaves his hand exactly at the cut to the desk
  };
}
function chairShift(lt, k) {
  if (lt < k.roll0) return 0;
  if (lt < k.back0) return SHIFT * sk(lt, k.roll0, k.roll1);
  return SHIFT * (1 - sk(lt, k.back0, k.back1));
}
const portraitOpen = (lt, k) => eo(lt, k.port0, k.port1);
const doorOpen = (lt, k) => sk(lt, k.door0, k.door1);
const boltsAt = (lt, k) => 1 - k.bolt.reduce((a, t) => a + eo(lt, t, t + .06), 0) / 3;   // three clunks, one bolt group at a time
const wheelAt = (lt, k) => TAU * 2.6 * eo(lt, k.spin0, k.spin1);
// the gold: 0 before the door cracks, 1 at the peak, settling to a steady glow
const gold = (lt, k) => smooth(clamp(doorOpen(lt, k) * 1.6)) * (1 - .42 * seg(lt, k.V + 2.6, k.V + 4.4));
// the lamp: steady, then it flickers when the moth comes out of the purse (flicker cue at M + .10, the sting at M + .50)
function lampAt(lt, k) {
  const m = lt - k.M, f = m - .1;
  let v = 1;
  if (f > 0 && f < 1.3) { const n = Math.floor(f * 26), r = hash(n * 3.7 + 1.1); v = r > .42 ? 1 : .2 + .45 * r; v = lerp(v, 1, seg(f, .75, 1.3)); }
  return v * (1 - .55 * Math.exp(-Math.pow((m - .5) / .07, 2)));
}

// ------------------------------------------------------------------ shots
const SHOTS = () => {
  const b = id => B(id);
  return [['screen', 1.0], ['wide', 2.32], ['two', 2.78], ['inv1', 4.18], ['cuS1', 5.08], ['inv2', 6.93], ['two2', 7.3], ['inv3', 9.12], ['cuA3', 10.82], ['cuS3', 11.52], ['cuA3b', 11.84],
    ['trk', b('vault').s + .12], ['vault', b('a4').s - .1], ['cuA4', 16.7], ['cuS4', 18.22], ['cuA5', 19.3], ['purse', 20.28], ['wideE', 1e9]];
};
const shotOf = lt => { let t0 = 0; for (const [n, e] of SHOTS()) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'wideE', t0, t1: CUR.dur }; };
const INSERTS = { screen: 1, inv1: 1, inv2: 1, inv3: 1 };
const SUBJ_S = { cuS1: 1, cuS3: 1, cuS4: 1 }, SUBJ_A = { cuA3: 1, cuA3b: 1, cuA4: 1, cuA5: 1 };

// ------------------------------------------------------------------ gold: coins, bars and the heap (every one a pure function of time)
const GRAV = 2000;
const cA = (key, w, h, sc, fn) => S10.art(key, w, h, sc, fn);
// a coin face-on: a thick rim (the dark lower edge gives it a body when it is squashed), a bevelled face, an embossed mark
const COIN_COL = [['#fff8c4', '#ffd84e', '#cc8c10', '#6e4204'], ['#fff0a0', '#f2c238', '#b87a0c', '#5e3602'], ['#ffe27a', '#dca824', '#9c640a', '#4e2c00'], ['#ffffe0', '#ffe66a', '#e0a21c', '#7a4a06']];
function coinSpr(i) {
  return cA('coin11_' + i, 40, 40, 2, () => {
    const [c0, c1, c2, c3] = COIN_COL[i];
    ctx.fillStyle = c3; ell(20, 22.6, 17, 17); ctx.fill();
    ctx.fillStyle = V2.radial(14, 13, 1.5, 21, [[0, c0], [.5, c1], [1, c2]]); ell(20, 20, 17, 17); ctx.fill();
    ctx.strokeStyle = c3; ctx.lineWidth = 1.6; ell(20, 20, 17, 17); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,226,.6)'; ctx.lineWidth = 1.5; ell(20, 20, 14, 14); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,64,0,.45)'; ctx.lineWidth = 1.3; ell(20, 20, 10.4, 10.4); ctx.stroke();
    text('$', 20, 20.6, { size: 13, fill: 'rgba(130,80,4,.62)', weight: 900 });
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ell(13.2, 12.4, 5.2, 2.4, -.7); ctx.fill();
  });
}
// a gold bar: a front face, a lit top face, a stamp
function barSpr() {
  return cA('bar11', 84, 48, 2, () => {
    ctx.fillStyle = V2.grad(0, 22, 0, 44, [[0, '#f6c83e'], [.5, '#d49a1a'], [1, '#8c5a08']]); ctx.strokeStyle = '#4e2c00'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(6, 22); ctx.lineTo(78, 22); ctx.lineTo(82, 41); ctx.quadraticCurveTo(82, 44, 78, 44); ctx.lineTo(8, 44); ctx.quadraticCurveTo(4, 44, 4, 41); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = V2.grad(0, 6, 0, 22, [[0, '#fff2a6'], [1, '#f2c640']]);
    ctx.beginPath(); ctx.moveTo(16, 6); ctx.lineTo(68, 6); ctx.lineTo(78, 22); ctx.lineTo(6, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(20, 9); ctx.lineTo(48, 9); ctx.lineTo(44, 14); ctx.lineTo(16, 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(110,64,0,.55)'; ctx.lineWidth = 1.5; rr(18, 27, 48, 12, 3); ctx.stroke();
    text('999', 42, 33.4, { size: 10, fill: 'rgba(110,64,0,.75)', weight: 900, spacing: 1 });
  });
}
// a four-point glint with a soft core, for the sparkle on the gold
function glintSpr() {
  return cA('glint11', 64, 64, 2, () => {
    ctx.fillStyle = V2.radial(32, 32, 0, 30, [[0, 'rgba(255,255,236,1)'], [.18, 'rgba(255,240,170,.75)'], [1, 'rgba(255,214,90,0)']]); ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = 'rgba(255,255,240,.95)';
    for (const [dx, dy, L, w] of [[1, 0, 31, 2.6], [0, 1, 31, 2.6], [.7071, .7071, 18, 1.6], [-.7071, .7071, 18, 1.6]]) {
      ctx.save(); ctx.translate(32, 32); ctx.rotate(Math.atan2(dy, dx)); ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(-L * .2, w * .5, 0, w); ctx.quadraticCurveTo(L * .2, w * .5, L, 0); ctx.quadraticCurveTo(L * .2, -w * .5, 0, -w); ctx.quadraticCurveTo(-L * .2, -w * .5, -L, 0); ctx.fill(); ctx.restore();
    }
  });
}
function blobSpr() {
  return cA('blob11', 64, 64, 2, () => { ctx.fillStyle = V2.radial(32, 32, 0, 32, [[0, 'rgba(255,214,120,.9)'], [.5, 'rgba(255,190,80,.35)'], [1, 'rgba(255,180,60,0)']]); ctx.fillRect(0, 0, 64, 64); });
}

// where a coin launched `t0` seconds into the beat can leave the vault: to the right of the swinging leaf's edge, which uncovers the opening from the right
const openOff = tau => easeIO(seg(tau, DOOR_T0, DOOR_T1));
function mouthPt(t0, r1, r2) {
  const a = 1.8 * openOff(t0), edge = RC.x - 104 + 208 * Math.cos(a), lo = Math.max(edge + 10, RC.x - 90), hi = RC.x + 92;
  const x = lo >= hi - 6 ? hi - r1 * 8 : lerp(lo, hi, r1), dx = x - RC.x, ch = Math.sqrt(Math.max(0, 104 * 104 - dx * dx)) * .8;
  return [x, RC.y + (r2 - .5) * 2 * ch - 4];
}
let COINS = null;
function coinsInit() {
  if (COINS) return COINS;
  const list = [];
  const R = (i, n) => hash(i * 7.31 + n * 31.17 + 2.9);
  // the flood: coins that fly out of the door, bounce, spin and slide across the carpet (offsets in seconds after the vault beat starts)
  for (let i = 0; i < 150; i++) {
    const t0 = .46 + Math.pow(R(i, 3), 1.7) * 1.55, [x0, y0] = mouthPt(t0, R(i, 1), R(i, 2));
    list.push({ type: 'slide', t0, x0, y0, z0: RC.z - 4,
      vx: (R(i, 4) - .4) * 330 + (x0 - RC.x) * .8, vy: (R(i, 5) - .3) * 150, vz: -(140 + Math.pow(R(i, 6), 2.3) * 760),
      e: .3 + R(i, 7) * .16, mu: .72 + R(i, 8) * .1, lam: 2.4 + R(i, 9) * 1.8, rad: 12 + R(i, 10) * 5, w: 7 + R(i, 11) * 15, ph: R(i, 12) * TAU, spr: (R(i, 13) * 4) | 0, gl: R(i, 14), rest: .34 + R(i, 15) * .16, rot: (R(i, 16) - .5) * 6 });
  }
  // the heap under the door: rows of coins that arc from the mouth to their slot, the lower rows first
  let n = 0;
  for (let row = 0; row < 12; row++) {
    const half = 232 * Math.pow(1 - row / 13.5, .9), cnt = Math.max(2, Math.round(half * 2 / 24));
    for (let j = 0; j < cnt; j++, n++) {
      const slotX = -372 + ((j + .5) / cnt * 2 - 1) * half + (R(n, 20) - .5) * 12, slotY = 3 + row * 10.5 + R(n, 21) * 4, slotZ = 1672 + R(n, 22) * 58 - row * 3;
      const t0 = .62 + row * .12 + R(n, 23) * .3, [x0, y0] = mouthPt(t0, R(n, 25), R(n, 26));
      list.push({ type: 'heap', t0, dur: .46 + R(n, 24) * .26, x0, y0, z0: RC.z - 4, xs: slotX, ys: slotY, zs: slotZ,
        rad: 14 + R(n, 27) * 5, ph: R(n, 28) * TAU, w: 9 + R(n, 29) * 16, spr: (R(n, 30) * 4) | 0, gl: R(n, 31), rest: .3 + R(n, 32) * .5, rot: (R(n, 33) - .5) * 1.4 });
    }
  }
  // bars: a few slide out, the rest fill the heap
  for (let i = 0; i < 12; i++) {
    const heap = i < 8;
    const t0 = .9 + i * .1, [x0, y0] = mouthPt(t0, R(i, 40), R(i, 41));
    list.push({ type: heap ? 'bar' : 'barslide', t0, dur: .6, x0, y0, z0: RC.z - 4,
      xs: -372 + (R(i, 42) - .5) * 330, ys: 9 + (i % 3) * 13, zs: 1690 + R(i, 43) * 34, vx: (R(i, 44) - .5) * 160, vy: 40, vz: -(160 + R(i, 45) * 340), e: .26, mu: .6, lam: 3.4,
      rad: 19, w: 6 + R(i, 46) * 6, ph: R(i, 47) * TAU, spr: 0, gl: R(i, 48), rest: 1, rot: (R(i, 49) - .5) * .8 });
  }
  // the rollers: they land at the foot of the heap, roll on their edge toward her shoes, slow down and wobble flat beside them
  [[-300, 1560, -140, 1004, .82, 1.1], [-250, 1590, -52, 998, .9, 1.22], [-330, 1520, -96, 984, .98, 1.12]].forEach(([xa, za, xe, ze, tl, ta], i) => {
    list.push({ type: 'roll', t0: .7 + i * .09, tl, ta, xa, za, xe, ze, x0: RC.x + 70, y0: RC.y - 60, z0: RC.z - 4, rad: 17, spr: [0, 3, 1][i], ph: i * 2.1, gl: .9, w: 10, rot: 0, rest: .42 });
  });
  COINS = list;
  return list;
}
// the state of one coin at scene time lt: {x, y, z, asp, rot, air}
function coinState(c, lt, V) {
  const tau = lt - (V + c.t0);
  if (tau < 0) return null;
  let x, y, z, air = true, asp, rot = c.rot + c.w * .05 * tau;
  if (c.type === 'roll') {
    // an arc from the mouth to the foot of the heap, then a roll on its edge (a thin upright disc) that slows to a stop, then the wobble down
    const tl = c.tl - c.t0, ta = c.ta - c.t0;
    if (tau < tl) { const u = tau / tl, vy = (0 - c.y0 + .5 * GRAV * tl * tl) / tl; x = lerp(c.x0, c.xa, u); z = lerp(c.z0, c.za, u); y = c.y0 + vy * tau - .5 * GRAV * tau * tau; asp = Math.abs(Math.cos(c.ph + tau * 22)) * .8 + .15; rot = tau * 9; }
    else if (tau < ta) { const u = (tau - tl) / (ta - tl), e = 1 - Math.pow(1 - u, 2.2); x = lerp(c.xa, c.xe, e) + 22 * Math.sin(u * PI) * (c.ph > 2 ? -1 : 1); z = lerp(c.za, c.ze, e); y = c.rad; air = false; asp = .17; rot = PI / 2 + .05 * Math.sin(tau * 30); }
    else { const w = clamp((tau - ta) / .38); x = c.xe + 6 * w; z = c.ze; air = false; const dec = Math.pow(1 - w, 1.6); y = lerp(c.rad, 1.5, smooth(w)) + 2 * dec * Math.abs(Math.sin(w * 30)); rot = (PI / 2) * (1 - smooth(w)) + .5 * dec * Math.sin(w * 30); asp = lerp(.17, c.rest, smooth(w)) + .18 * dec * Math.abs(Math.sin(w * 30)); }
    return { x, y: Math.max(y, 1.2), z, asp, rot, air };
  }
  if (c.type === 'heap' || c.type === 'bar') {
    const D = c.dur, u = Math.min(1, tau / D), tt = Math.min(tau, D), vy = (c.ys - c.y0 + .5 * GRAV * D * D) / D;
    x = lerp(c.x0, c.xs, u); z = lerp(c.z0, c.zs, u); y = c.y0 + vy * tt - .5 * GRAV * tt * tt;
    if (u >= 1) { air = false; y = c.ys; }
    const th = c.ph + c.w * (D - tt) * 1.6;
    asp = lerp(Math.abs(Math.cos(th)) * .85 + .12, c.rest, smooth(seg(tau, D - .18, D)));
    rot = c.rot + (1 - u) * c.w * .35 * (c.type === 'bar' ? .5 : 1);
  } else {
    // free flight to the floor, then a few bounces that lose speed, then a slide with friction
    const t1 = (c.vy + Math.sqrt(c.vy * c.vy + 2 * GRAV * c.y0)) / GRAV;
    if (tau < t1) { x = c.x0 + c.vx * tau; z = c.z0 + c.vz * tau; y = c.y0 + c.vy * tau - .5 * GRAV * tau * tau; }
    else {
      let xh = c.x0 + c.vx * t1, zh = c.z0 + c.vz * t1, vxh = c.vx * c.mu, vzh = c.vz * c.mu, v = (GRAV * t1 - c.vy) * c.e, tt = tau - t1; y = 0; air = false;
      let done = false;
      for (let b = 0; b < 5 && !done; b++) {
        const f = 2 * v / GRAV;
        if (tt < f) { x = xh + vxh * tt; z = zh + vzh * tt; y = v * tt - .5 * GRAV * tt * tt; air = true; done = true; }
        else { tt -= f; xh += vxh * f; zh += vzh * f; v *= c.e; vxh *= c.mu; vzh *= c.mu; }
      }
      if (!done) { const ex = 1 - Math.exp(-c.lam * tt); x = xh + vxh / c.lam * ex; z = zh + vzh / c.lam * ex; y = 0; air = false; rot += c.w * .05 * Math.min(tt, 1.2) * Math.exp(-tt * 2); }
    }
    const th = c.ph + c.w * Math.min(tau, t1 + .9) * 1.15, flat = smooth(seg(tau, t1 + .15, t1 + 1.1));
    asp = lerp(Math.abs(Math.cos(th)) * .88 + .1, c.rest, flat);
  }
  if (c.type === 'bar' || c.type === 'barslide') asp = Math.max(.55, asp);
  return { x, y: Math.max(y, 1.2), z, asp, rot, air };
}
// every active coin sorted far to near; drawn in depth passes between the characters
function coinFrame(lt, V) {
  const out = [];
  for (const c of coinsInit()) { const s = coinState(c, lt, V); if (s) { s.c = c; out.push(s); } }
  out.sort((a, b) => b.z - a.z);
  return out;
}
function drawCoins(list, zLo, zHi) {
  for (const s of list) {
    if (s.z < zLo || s.z >= zHi) continue;
    const c = s.c, k = kz(s.z), [sx, sy] = p2(s.x, s.y, s.z), bar = c.type === 'bar' || c.type === 'barslide', Rr = c.rad * k;   // rollers carry no extra drawing: they are coins like the rest
    if (s.y < 70) { const sh = (1 - s.y / 70) * .38; ctx.fillStyle = `rgba(24,12,0,${sh})`; ell(sx + 3 * k, sy + 1.5 * k, Rr * (bar ? 1.5 : 1.05), Rr * (bar ? .32 : .3)); ctx.fill(); }
    ctx.save(); ctx.translate(sx, sy - (bar ? 0 : Rr * .1)); ctx.rotate(s.rot); ctx.scale(1, s.asp);
    if (bar) { const q = barSpr(), w = Rr * 3.4; ctx.drawImage(q, -w / 2, -w * .29, w, w * .571); }
    else { const q = coinSpr(c.spr), w = Rr * 2.36; ctx.drawImage(q, -w / 2, -w / 2, w, w); }
    ctx.restore();
  }
}
// a mound of dark gold under the heap so the coins never show the carpet through their gaps: it grows as the coins arrive
function drawMound(lt, V) {
  const grow = smooth(seg(lt, V + .7, V + 2.4)); if (grow <= .01) return;
  const cx = -372, H = 124 * grow, W = 244 * (.55 + .45 * grow), a = p2(cx - W, 0, 1712), b = p2(cx + W, 0, 1712), t = p2(cx, H, 1712), kk = kz(1700);
  ctx.save(); ctx.fillStyle = grad(0, t[1], 0, a[1], [[0, '#d9a030'], [.5, '#a8700e'], [1, '#5a3604']]);
  ctx.beginPath(); ctx.moveTo(a[0], a[1] + 6 * kk); ctx.quadraticCurveTo(a[0] + (t[0] - a[0]) * .5, t[1] + 8 * kk, t[0], t[1]); ctx.quadraticCurveTo(b[0] - (b[0] - t[0]) * .5, t[1] + 8 * kk, b[0], b[1] + 6 * kk); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ the vault's inside: a wall of bars, heaps of coins, a warm glow (painted once; the glints move)
function vaultArt() {
  return cA('vaultin11', 200, 200, 2, (w, h) => {
    ctx.fillStyle = V2.radial(100, 104, 2, 150, [[0, '#ffd860'], [.4, '#d89a1c'], [.8, '#8a5608'], [1, '#2e1a02']]); ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < 9; r++) {
      const y = -6 + r * 24, off = (r % 2) * 20;
      for (let c = -1; c < 7; c++) {
        const x = c * 40 + off - 8, lum = 1 - Math.min(1, Math.hypot(x + 18 - 100, y + 9 - 100) / 135);
        ctx.fillStyle = V2.grad(0, y, 0, y + 20, [[0, hex('#ffe680', '#a8700c', 1 - lum * .85)], [.55, hex('#f2c230', '#8a5608', 1 - lum * .85)], [1, hex('#b8820e', '#3e2402', 1 - lum * .7)]]);
        ctx.strokeStyle = 'rgba(60,34,0,.78)'; ctx.lineWidth = 1.6; rr(x, y, 36, 19, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(255,246,190,${.12 + .34 * lum})`; rr(x + 3, y + 2, 24, 3.2, 1.4); ctx.fill();
      }
    }
    for (const [hx, hw] of [[56, 70], [150, 64]]) for (let i = 0; i < 34; i++) {
      const u = hash(i * 3.1 + hx), v = hash(i * 5.3 + hx + 9), x = hx + (u - .5) * hw * (1 - v * .7), y = 188 - v * 50;
      ctx.fillStyle = V2.radial(x - 2, y - 2, 1, 11, [[0, '#fff0a0'], [.6, '#f0c030'], [1, '#a8700c']]); ctx.strokeStyle = 'rgba(80,44,0,.7)'; ctx.lineWidth = 1.2; ell(x, y, 11, 5.6, (hash(i + hx) - .5) * .5); ctx.fill(); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(100, 100, 0, 80, [[0, 'rgba(255,226,140,.62)'], [.5, 'rgba(255,200,90,.22)'], [1, 'rgba(255,190,70,0)']]); ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = V2.radial(100, 100, 68, 108, [[0, 'rgba(40,20,0,0)'], [1, 'rgba(40,20,0,.72)']]); ctx.fillRect(0, 0, w, h);
  });
}
// the painted chamber, clipped to the opening by the set; glints crawl over it
function vaultInside(c, lt) {
  ctx.drawImage(vaultArt(), c.x - c.r * 1.06, c.y - c.r * 1.06, c.r * 2.12, c.r * 2.12);
  const gl = glintSpr();
  for (let i = 0; i < 7; i++) {
    const a = Math.pow(Math.max(0, Math.sin(lt * (2.4 + hash(i) * 2) + i * 2.3)), 14);
    if (a < .05) continue;
    const x = c.x + (hash(i * 3 + 1) - .5) * c.r * 1.3, y = c.y + (hash(i * 3 + 2) - .5) * c.r * 1.1, s = c.r * (.3 + .26 * a);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * .85; ctx.drawImage(gl, x - s, y - s, s * 2, s * 2); ctx.restore();
  }
  V2.emit(c.x, c.y, c.r * 1.6, '255,206,100', .55);
}

// ------------------------------------------------------------------ gold light on the wall: halo, god rays, drifting reflections
function goldWall(lt, off, g, k) {
  if (g <= .01) return;
  const [cx, cy] = off.at.recess(), kk = kz(off.layout.zb);
  V2.ring(cx, cy, (lt - k.ching) / .8, { r0: 60 * kk, r1: 640 * kk, color: '255,222,130', lw: 12, alpha: .7, bloom: .4 });
  V2.glow(cx, cy, 520 * kk * 1.4, '255,196,84', .5 * g, 'screen', .7);
  V2.glow(cx, cy, 200 * kk * 1.4, '255,226,150', .42 * g, 'screen', .5);
  const rays = [[8, 1100, 70, 330, .1], [24, 1500, 60, 280, .16], [40, 1700, 54, 250, .21], [54, 1650, 50, 240, .19], [68, 1450, 56, 260, .15], [84, 1150, 62, 300, .1], [-8, 900, 60, 300, .07]];
  rays.forEach(([deg, L, w0, w1, a], i) => {
    const th = deg * PI / 180 + .03 * Math.sin(lt * .8 + i * 1.7), br = .72 + .28 * Math.sin(lt * 1.9 + i * 2.3);
    V2.beam(cx, cy, cx + Math.cos(th) * L, cy + Math.sin(th) * L, w0, w1, '255,208,110', a * g * br);
  });
  const bl = blobSpr();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const ang = i * 2.399 + lt * (.18 + hash(i) * .2), rad = (130 + 520 * hash(i + 4)) * (.75 + .25 * Math.sin(lt * .7 + i)), x = cx + Math.cos(ang) * rad * 1.15, y = cy + Math.sin(ang) * rad * .75, s = (50 + 70 * hash(i + 9)) * (.8 + .2 * Math.sin(lt * 2.4 + i * 1.3));
    ctx.globalAlpha = (.13 + .11 * Math.sin(lt * 2.9 + i * 2)) * g;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.drawImage(bl, -s * 1.6, -s * .7, s * 3.2, s * 1.4); ctx.restore();
  }
  ctx.restore();
}
// the vault breathes out: pale puffs of air from the rim, a moment after the third bolt
function hiss(lt, off, k) {
  const u0 = k.hissAt; if (lt < u0 || lt > u0 + 1.2) return;
  const [cx, cy] = off.at.recess(), kk = kz(off.layout.zb);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 14; i++) {
    const ang = i / 14 * TAU + hash(i) * .4, u = clamp((lt - u0 - hash(i + 5) * .3) / .85); if (u <= 0 || u >= 1) continue;
    const d = 104 * kk * (1.04 + 1.1 * easeOut(u)), x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * .9 - 26 * u * kk, rad = (18 + 54 * u) * kk;
    ctx.fillStyle = radial(x, y, 0, rad, [[0, `rgba(228,236,255,${.3 * (1 - u)})`], [1, 'rgba(228,236,255,0)']]); ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.restore();
}
function goldFloor(g) {
  if (g <= .01) return;
  const [x, y] = p2(RC.x + 30, 0, 1500), kk = kz(1500);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y); ctx.scale(1, .3);
  ctx.fillStyle = radial(0, 0, 0, 900 * kk, [[0, `rgba(255,200,90,${.34 * g})`], [.5, `rgba(255,180,70,${.14 * g})`], [1, 'rgba(255,170,50,0)']]); ctx.beginPath(); ctx.arc(0, 0, 900 * kk, 0, TAU); ctx.fill(); ctx.restore();
}
// sparkles on the coins: glints that flash at their own rhythm, and a burst on the sparkle cue; never over a face
function goldGlints(list, lt, k, g, keep) {
  if (g <= .01) return;
  const calm = lerp(1, .3, seg(lt, k.V + 2.4, k.V + 4.2)), gl = glintSpr(), burst = lt >= k.sparkle ? Math.exp(-(lt - k.sparkle) * 2.6) : 0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  let n = 0;
  for (const s of list) {
    if (s.air && s.y > 120) continue;
    if (s.c.type === 'heap' && s.c.gl < .55) continue;
    const c = s.c, ph = lt * (2.2 + c.gl * 2) + c.ph, a = calm * Math.pow(Math.max(0, Math.sin(ph)), 20) * (.6 + .3 * g) + (c.gl > .55 ? burst * Math.pow(Math.max(0, Math.sin(ph * 3 + 1.3)), 2) * .8 : 0);
    if (a < .12) continue;
    const k0 = kz(s.z), [sx, sy] = p2(s.x, s.y + 8, s.z), sz = (14 + 22 * a) * k0 * (c.type === 'bar' ? 1.4 : 1);
    if (keep.some(([fx, fy, r]) => Math.hypot(sx - fx, sy - fy) < r + sz * .6)) continue;
    ctx.globalAlpha = Math.min(1, a); ctx.drawImage(gl, sx - sz, sy - sz, sz * 2, sz * 2);
    if (++n > 34) break;
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the invoice: the figures the coordinator set (9 HR MINIMUM x $200/HR = $1,800.00), laid out once for the paper and the held prop
const LINE = 'HELPING (ADD-ON): 9 HR MINIMUM x $200/HR = $1,800.00';
const INK_BLUE = '#1d3fa8', INK_RED = '#d6202e', NAVY = '#1c3566';
const PAP = { x: 70, y: 240, w: 940, h: 960 }, ROW = { y: 606, size: 27, x: 118 };
function rowSpans() {
  ctx.save(); ctx.font = `900 ${ROW.size}px Nunito`; ctx.letterSpacing = '.6px';
  const w = s => ctx.measureText(s).width, find = sub => { const i = LINE.indexOf(sub); return [ROW.x + w(LINE.slice(0, i)), ROW.x + w(LINE.slice(0, i + sub.length))]; };
  const out = { helping: find('HELPING'), addon: find('(ADD-ON)'), rate: find('$200/HR'), total: find('$1,800.00'), end: ROW.x + w(LINE) };
  ctx.restore(); return out;
}
// a rubber stamp: a double frame, big letters, ink that has worn through in places
function stampInk(cx, cy, w, h, rot, str, color, size, a = .86, seed = 1) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.globalAlpha *= a; ctx.globalCompositeOperation = 'multiply';
  ctx.strokeStyle = color; ctx.lineWidth = 7; rr(-w / 2, -h / 2, w, h, 14); ctx.stroke(); ctx.lineWidth = 2.4; rr(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 8); ctx.stroke();
  text(str, 0, 5, { size, font: 'Bangers', weight: 400, fill: color, spacing: 3 });
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fffef8';
  for (let i = 0; i < 46; i++) { ctx.globalAlpha = .55 * a; ell((hash(i * 3 + seed) - .5) * w, (hash(i * 5 + seed + 7) - .5) * h, 1.2 + hash(i + seed) * 2.6, 1 + hash(i + seed + 3) * 2); ctx.fill(); }
  ctx.restore();
}
// handwriting, glyph by glyph, up to the fraction p of the line's width; returns where the pen is
function hand(str, x, y, size, p, color, seed = 0) {
  ctx.save(); ctx.font = `italic 800 ${size}px Nunito`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
  const ws = [...str].map(c => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0), shown = tot * p;
  let cx = x, pen = [x, y];
  for (let i = 0; i < str.length; i++) {
    if (cx - x >= shown) break;
    const w = ws[i], wob = Math.sin(i * 1.7 + seed) * size * .035, rot = Math.sin(i * 2.3 + seed) * .05, part = clamp((shown - (cx - x)) / w);
    ctx.save(); ctx.translate(cx, y + wob); ctx.rotate(rot);
    if (part < 1) { ctx.beginPath(); ctx.rect(-3, -size * 1.2, w * part + 3, size * 1.7); ctx.clip(); }
    ctx.fillText(str[i], 0, 0); ctx.restore();
    pen = [cx + w * part, y + wob - size * .2]; cx += w;
  }
  ctx.restore();
  return pen;
}
// a scribbled strike through a word, drawn up to the fraction p; returns the pen tip
function strike(xa, xb, y, p, color) {
  if (p <= 0) return null;
  const pts = []; const n = 7;
  for (let i = 0; i <= n; i++) pts.push([lerp(xa - 10, xb + 10, i / n), y - 2 + (i % 2 ? 9 : -9) + Math.sin(i * 2.1) * 3]);
  const lens = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(d); tot += d; }
  let left = tot * p, tip = pts[0];
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) { if (left >= lens[i - 1]) { ctx.lineTo(...pts[i]); left -= lens[i - 1]; tip = pts[i]; } else { const f = left / lens[i - 1]; tip = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; ctx.lineTo(...tip); break; } }
  ctx.stroke(); ctx.restore();
  return tip;
}
// a loose ring drawn around an ellipse, up to the fraction p; returns the pen tip
function ring(cx, cy, rx, ry, p, color, a0 = -2.2) {
  if (p <= 0) return null;
  const a1 = p * TAU * 1.08; let tip = null;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
  for (let a = 0; a <= a1; a += .1) { const r = 1 + .06 * Math.sin(a * 2 + 1) + .05 * a / TAU, x = cx + Math.cos(a + a0) * rx * r, y = cy + Math.sin(a + a0) * ry * r; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); tip = [x, y]; }
  ctx.stroke(); ctx.restore();
  return tip;
}
function underline(xa, xb, y, p, color) {
  if (p <= 0) return null;
  const x1 = lerp(xa, xb, p); ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xa, y);
  for (let x = xa; x <= x1; x += 12) ctx.lineTo(x, y + Math.sin(x * .09) * 3);
  ctx.stroke(); ctx.restore(); return [x1, y];
}
// the printed invoice. st: { strike, red, cAdd, cRate, under } are progress values 0..1 of the pen marks
function paper(st = {}) {
  const { x, y, w, h } = PAP, sp = rowSpans();
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 38; ctx.shadowOffsetY = 20; ctx.fillStyle = '#fffef8'; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = V2.grad(x, y, x + w, y + h, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(180,170,140,.2)']]); ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + h * .33); ctx.lineTo(x + w, y + h * .33); ctx.moveTo(x, y + h * .66); ctx.lineTo(x + w, y + h * .66); ctx.stroke();
  // letterhead
  text('S. BERRY, RN', x + 50, y + 62, { size: 44, fill: NAVY, weight: 900, align: 'left', spacing: 1 });
  text('PER DIEM NURSING  /  NO BENEFITS  /  NO COMMITMENTS', x + 50, y + 100, { size: 15, fill: '#8a90a4', weight: 800, align: 'left', spacing: 1.4 });
  text('INVOICE', x + w - 50, y + 64, { size: 84, font: 'Bangers', weight: 400, fill: NAVY, align: 'right', spacing: 4 });
  text('No. 0001', x + w - 50, y + 116, { size: 24, fill: '#8a90a4', weight: 800, align: 'right', spacing: 1.4 });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x + 40, y + 142); ctx.lineTo(x + w - 40, y + 142); ctx.stroke();
  text('BILL TO', x + 50, y + 186, { size: 15, fill: '#8a90a4', weight: 900, align: 'left', spacing: 2 });
  text('THE ADMINISTRATOR', x + 50, y + 218, { size: 30, fill: '#20202c', weight: 900, align: 'left', spacing: .6 });
  text('FRUIT BOWL REHAB & NURSING', x + 50, y + 252, { size: 19, fill: '#55596e', weight: 800, align: 'left', spacing: .8 });
  text('DATE: TONIGHT, 10:55 PM      DUE: IMMEDIATELY', x + 50, y + 290, { size: 17, fill: '#55596e', weight: 800, align: 'left', spacing: 1 });
  // the table
  ctx.fillStyle = '#e8ebf4'; ctx.fillRect(x + 40, ROW.y - 96, w - 80, 46); text('DESCRIPTION', x + 60, ROW.y - 72, { size: 17, fill: '#6a7088', weight: 900, align: 'left', spacing: 2 });
  text(LINE, ROW.x, ROW.y, { size: ROW.size, fill: '#20202c', weight: 900, align: 'left', spacing: .6 });
  ctx.strokeStyle = 'rgba(32,32,44,.4)'; ctx.lineWidth = 2; ctx.setLineDash([3, 9]); ctx.beginPath(); ctx.moveTo(x + 40, ROW.y + 36); ctx.lineTo(x + w - 40, ROW.y + 36); ctx.stroke(); ctx.setLineDash([]);
  text('SUBTOTAL', x + 60, ROW.y + 106, { size: 26, fill: '#20202c', weight: 900, align: 'left', spacing: 1 }); text('$1,800.00', x + w - 60, ROW.y + 106, { size: 26, fill: '#20202c', weight: 900, align: 'right' });
  text('PER DIEM SURCHARGE:', x + 60, ROW.y + 164, { size: 26, fill: '#20202c', weight: 900, align: 'left', spacing: 1 }); text('$0.00', x + w - 60, ROW.y + 164, { size: 26, fill: '#20202c', weight: 900, align: 'right' });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 6; rr(x + 40, ROW.y + 206, w - 80, 108, 10); ctx.stroke();
  text('TOTAL', x + 76, ROW.y + 262, { size: 46, fill: NAVY, weight: 900, align: 'left', spacing: 2 }); text('$1,800.00', x + w - 76, ROW.y + 262, { size: 74, fill: NAVY, weight: 900, align: 'right' });
  text('* 9 HR MINIMUM APPLIES TO EVERY CALL-OUT. NO EXCEPTIONS.', x + 50, ROW.y + 350, { size: 15, fill: '#8a90a4', weight: 800, italic: true, align: 'left', spacing: .8 });
  text('Payment due on receipt (it is now).', x + 50, ROW.y + 382, { size: 17, fill: '#6a7088', weight: 800, italic: true, align: 'left' });
  // stamps: PER DIEM ADD-ON in blue, OVERDUE in red across the lower right
  stampInk(x + w - 250, y + 224, 330, 74, .1, 'PER DIEM ADD-ON', '#1f46c8', 44, .82, 3);
  stampInk(x + w - 330, ROW.y + 366, 520, 150, -.2, 'OVERDUE', '#d2202c', 124, .84, 9);
  // the pens' marks: his red marker strikes HELPING and writes in the margin, her blue pen rings (ADD-ON) and $200/HR
  const tips = {};
  if (st.strike > 0) tips.strike = strike(sp.helping[0], sp.helping[1], ROW.y - 2, st.strike, INK_RED);
  if (st.red > 0) tips.red = hand('NOT IN CONTRACT', sp.helping[0] + 6, ROW.y + 78, 40, st.red, INK_RED, 2);
  if (st.cAdd > 0) tips.cAdd = ring((sp.addon[0] + sp.addon[1]) / 2, ROW.y - 2, (sp.addon[1] - sp.addon[0]) / 2 + 20, 34, st.cAdd, INK_BLUE, -1.6);
  if (st.cRate > 0) tips.cRate = ring((sp.rate[0] + sp.rate[1]) / 2, ROW.y - 2, (sp.rate[1] - sp.rate[0]) / 2 + 20, 34, st.cRate, INK_BLUE, -1.9);
  if (st.under > 0) tips.under = underline(sp.total[0], sp.total[1], ROW.y + 30, st.under, INK_BLUE);
  ctx.restore();
  return { tips, sp };
}
// the night desk seen from above: wood, the green blotter with its gold border, the lamp's cool pool from the top right
function deskTopN() {
  ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#3c2619'], [1, '#1c1009']]); ctx.fillRect(-300, -900, W + 600, H + 1800);   // the wood reaches well past the frame: the camera may start wide
  ctx.strokeStyle = 'rgba(10,5,2,.34)'; ctx.lineWidth = 2; for (let i = 0; i < 52; i++) { const x = -150 + hash(i + 1) * (W + 300); ctx.beginPath(); ctx.moveTo(x, -900); ctx.bezierCurveTo(x + (hash(i + 5) - .5) * 60, 400, x + (hash(i + 9) - .5) * 60, 1300, x + (hash(i + 3) - .5) * 40, H + 900); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, 140, 0, 1420, [[0, '#215040'], [1, '#143222']]); rr(30, 150, 1020, 1280, 26); ctx.fill();
  goldLine(48, 168, 984, 1244, 18, 5); goldLine(60, 180, 960, 1220, 12, 1.6);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = radial(1010, 170, 40, 1500, [[0, 'rgba(215,244,232,.3)'], [.5, 'rgba(215,244,232,.1)'], [1, 'rgba(215,244,232,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = radial(W / 2, H * .46, H * .22, H * .72, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(60,66,96,1)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
}
// a big glove coming in from the edge of the picture (a copy of the Episode 10 one)
function glove(tx, ty, ang, sc, o = {}) {
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-44, 5);
  ctx.fillStyle = LIMB; ctx.beginPath(); ctx.roundRect(-230, -9, 232, 18, 8); ctx.fill();
  ctx.fillStyle = '#4a4258'; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand(o.kind ?? 'point', 1, {});
  ctx.restore();
}
// a pen in a glove: the tip at (tx, ty), the body running away along `ang`, the fist near the far end
function penHand(tx, ty, ang, kind, sc = 3) {
  const red = kind === 'red', L = red ? 300 : 330, th = red ? 36 : 24;
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(10, 8, L, th * .9);
  ctx.fillStyle = red ? '#7a1018' : '#c0c6cf'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, -th * .32); ctx.lineTo(34, th * .32); ctx.closePath(); ctx.fill();
  ctx.fillStyle = V2.grad(0, -th / 2, 0, th / 2, red ? [[0, '#ff5a60'], [.5, '#e0202c'], [1, '#8a0e18']] : [[0, '#5a9af8'], [.5, '#2a6fdb'], [1, '#143a8a']]); ctx.strokeStyle = INK; ctx.lineWidth = 3;
  rr(30, -th / 2, L - 30, th, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = red ? '#f2f2f6' : '#eef1f7'; rr(L - 100, -th / 2, 100, th, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(48, -th * .32, L - 160, 4);
  ctx.restore();
  const hx = tx + Math.cos(ang) * L * .66, hy = ty + Math.sin(ang) * L * .66;
  glove(hx, hy, ang + PI + .3, sc, { kind: 'grip' });
}

// ------------------------------------------------------------------ insert: the laptop screen, the invoice being typed (typing cue: 0.25 to 1.25)
const TYPE0 = .25, TYPE_CPS = 90;
function insScreen(lt) {
  ctx.fillStyle = grad(0, 0, 0, H, [[0, '#0d1226'], [1, '#04050c']]); ctx.fillRect(0, 0, W, H);
  V2.glow(540, 790, 1000, '150,190,255', .18, 'screen', 0);
  ctx.save(); ctx.translate(0, 92);   // below the clock and place pills
  ctx.fillStyle = grad(0, 170, 0, 1160, [[0, '#2f3240'], [1, '#191b25']]); ctx.strokeStyle = '#5a5f74'; ctx.lineWidth = 4; rr(40, 170, 1000, 990, 40); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0a0b12'; ell(540, 192, 6, 6); ctx.fill();
  const sx = 84, sy = 214, sw = 912, sh = 900, typed = clamp(Math.floor((lt - TYPE0) * TYPE_CPS), 0, LINE.length), done = typed >= LINE.length;
  ctx.save(); rr(sx, sy, sw, sh, 14); ctx.clip();
  ctx.fillStyle = '#dfe3ee'; ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = '#f5f6fb'; ctx.fillRect(sx, sy, sw, 62);
  text('File    Edit    View    Insert    Format    Tools', sx + 28, sy + 32, { size: 21, fill: '#444a64', weight: 800, align: 'left', spacing: .6 });
  text('Invoice_FINAL_v7_ACTUALLY_FINAL.doc', sx + sw - 24, sy + 32, { size: 18, fill: '#8a90a8', weight: 800, italic: true, align: 'right' });
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 20; ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + 52, sy + 92, sw - 104, sh - 92); ctx.shadowColor = 'transparent';
  const px = sx + 96;
  text('S. BERRY, RN', px, sy + 150, { size: 36, fill: NAVY, weight: 900, align: 'left', spacing: 1 });
  text('INVOICE', sx + sw - 96, sy + 156, { size: 66, font: 'Bangers', weight: 400, fill: NAVY, align: 'right', spacing: 3 });
  text('BILL TO: THE ADMINISTRATOR', px, sy + 214, { size: 21, fill: '#55596e', weight: 800, align: 'left', spacing: .8 });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, sy + 244); ctx.lineTo(sx + sw - 96, sy + 244); ctx.stroke();
  text('DESCRIPTION', px, sy + 282, { size: 15, fill: '#8a90a4', weight: 900, align: 'left', spacing: 2 });
  const line = LINE.slice(0, typed), blink = Math.sin(lt * 17) > -.3;
  text(line, px, sy + 336, { size: 22.4, fill: '#20202c', weight: 900, align: 'left', spacing: .5 });
  ctx.save(); ctx.font = '900 22.4px Nunito'; ctx.letterSpacing = '.5px'; const cw = ctx.measureText(line).width; ctx.restore();
  if (blink && lt < 1.2) { ctx.fillStyle = '#2a5ac8'; ctx.fillRect(px + cw + 2, sy + 314, 3, 44); }
  const fl = done ? seg(lt, TYPE0 + LINE.length / TYPE_CPS, TYPE0 + LINE.length / TYPE_CPS + .08) : 0;
  text('SUBTOTAL', px, sy + 420, { size: 21, fill: '#55596e', weight: 900, align: 'left', spacing: 1 }); text(done ? '$1,800.00' : '$0.00', sx + sw - 96, sy + 420, { size: 21, fill: done ? '#20202c' : '#b0b4c4', weight: 900, align: 'right' });
  text('PER DIEM SURCHARGE:', px, sy + 462, { size: 21, fill: '#55596e', weight: 900, align: 'left', spacing: 1 }); text('$0.00', sx + sw - 96, sy + 462, { size: 21, fill: '#20202c', weight: 900, align: 'right' });
  ctx.strokeStyle = '#20202c'; ctx.lineWidth = 4; rr(px - 10, sy + 492, sw - 172, 84, 8); ctx.stroke();
  text('TOTAL', px + 14, sy + 534, { size: 34, fill: NAVY, weight: 900, align: 'left', spacing: 2 }); text(done ? '$1,800.00' : '$0.00', sx + sw - 120, sy + 536, { size: 52, fill: done ? NAVY : '#b0b4c4', weight: 900, align: 'right' });
  text('* 9 HR MINIMUM APPLIES TO EVERY CALL-OUT. NO EXCEPTIONS.', px, sy + 640, { size: 14, fill: '#9aa0b4', weight: 800, italic: true, align: 'left', spacing: .6 });
  text('Payment due on receipt (it is now).', px, sy + 672, { size: 16, fill: '#8a90a4', weight: 800, italic: true, align: 'left' });
  if (fl > 0 && fl < 1) { ctx.fillStyle = `rgba(255,236,120,${.5 * (1 - fl)})`; ctx.fillRect(px - 10, sy + 400, sw - 172, 180); }
  ctx.fillStyle = grad(sx, sy, sx + sw, sy + sh, [[0, 'rgba(255,255,255,.1)'], [.4, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(sx, sy, sw, sh);
  ctx.restore();
  // the keyboard: rows of keys, the one she hits sinks for a few frames
  ctx.fillStyle = grad(0, 1180, 0, 1700, [[0, '#2c2f3b'], [1, '#14161e']]); ctx.strokeStyle = '#4a4e60'; ctx.lineWidth = 3; rr(50, 1176, 980, 560, 40); ctx.fill(); ctx.stroke();
  const nKeys = Math.floor((lt - TYPE0) * TYPE_CPS), hit = (nKeys >= 0 && lt < TYPE0 + 1.2) ? (Math.floor(hash(nKeys * 1.7) * 44)) : -1;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) {
    const i = r * 11 + c, x = 86 + c * 86, y = 1204 + r * 84, dn = i === hit ? 5 : 0;
    ctx.fillStyle = i === hit ? '#0e1018' : '#20232f'; rr(x, y + dn, 76, 70, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.07)'; rr(x + 5, y + 5 + dn, 66, 8, 4); ctx.fill();
    if ((c + r) % 3 === 0) text('ABCDEFGHJKLMNOPQRSTUVWXYZ1234567890$#@'[(i * 7) % 38], x + 38, y + 38 + dn, { size: 24, fill: 'rgba(200,206,226,.55)', weight: 800 });
  }
  // her gloves, hovering and tapping
  const tap = k => Math.max(0, Math.sin((lt - TYPE0) * 34 + k)) * 14;
  glove(300 + 4 * Math.sin(lt * 21), 1250 - tap(0) + 40, -1.5, 3.1, { kind: 'point' });
  glove(740 + 4 * Math.sin(lt * 17 + 1), 1260 - tap(2) + 40, -1.64, 3.1, { kind: 'point' });
  ctx.restore();
}

// ------------------------------------------------------------------ inserts: the invoice on the desk (the Administrator's finger on the total, his red marker, her blue pen)
function insInvoice(lt, n) {
  deskTopN();
  const t0 = 2.78;
  const slide = n === 'inv1' ? eo(lt, t0, t0 + .24) : 1, py = lerp(160, 0, slide);
  let st = {};
  if (n === 'inv2') { const t = wordT('a2', 'not', 5.68); st = { strike: seg(lt, t - .2, t + .16), red: seg(lt, t + .24, B('a2').e - .04) }; }
  if (n === 'inv3') { const tA = wordT('s2', 'add', 7.44), tR = wordT('s2', 'two', 7.87), tH = wordT('s2', 'hour', 8.56); st = { strike: 1, red: 1, cAdd: seg(lt, tA - .02, tA + .42), cRate: seg(lt, tR + .08, tR + .7), under: seg(lt, tH, tH + .3) }; }
  ctx.save(); ctx.translate(540, 720 + py); ctx.rotate(lerp(.05, -.012, slide)); ctx.translate(-540, -720);
  const pr = paper(st);
  ctx.restore();
  const T = (x, y) => [x, y + py];
  if (n === 'inv1') {
    // his gloved finger taps the total on "eighteen", "hundred" and "dollars"
    const ts = [wordT('a1', 'eighteen', 2.81), wordT('a1', 'hundred', 3.18), wordT('a1', 'dollars', 3.52)].map(t => t + .02), dip = Math.max(0, ...ts.map(t => Math.exp(-Math.pow((lt - t) / .06, 2)))), enter = eo(lt, t0 + .1, t0 + .5) * (1 - eo(lt, 4.02, 4.17));
    const [fx, fy] = [PAP.x + PAP.w - 170, ROW.y + 262 + py];
    if (enter > 0) { ctx.save(); ctx.translate(lerp(380, 0, enter), lerp(-420, 0, enter) + 30 * dip); glove(fx + 20, fy - 40, 2.3, 3.2, { kind: 'point' }); ctx.restore(); }
  }
  if (n === 'inv2') {
    const tipS = pr.tips.strike, tipR = pr.tips.red, tip = tipR || tipS || [pr.sp.helping[0], ROW.y - 2];
    const enter = eo(lt, 5.1, 5.4) * (1 - eo(lt, B('a2').e - .02, B('a2').e + .12));
    if (enter > 0) { const [x, y] = T(tip[0], tip[1]); ctx.save(); ctx.translate(lerp(520, 0, enter), lerp(-360, 0, enter)); penHand(x, y, -.88 + .04 * Math.sin(lt * 30), 'red'); ctx.restore(); }
  }
  if (n === 'inv3') {
    const tip = pr.tips.under || pr.tips.cRate || pr.tips.cAdd || [pr.sp.addon[0], ROW.y - 2], enter = eo(lt, 7.1, 7.4) * (1 - eo(lt, 8.98, 9.1));
    if (enter > 0) { const [x, y] = T(tip[0], tip[1]); ctx.save(); ctx.translate(lerp(-480, 0, enter), lerp(-340, 0, enter)); penHand(x, y, -.8 + .04 * Math.sin(lt * 28), 'blue'); ctx.restore(); }
  }
}

// ------------------------------------------------------------------ props: the invoice in the Administrator's hand, her laptop, the purse (the laptop's registered box follows its pose)
const LAP = { w: 210, h: 100, cx: -100, cy: 18 };   // the lid, relative to her right hand: shut or open it looks the same from the front, so she just keeps holding it
Object.assign(PROP_BOX, { inv11: [-56, -140, 56, 8], purse11: [-52, -68, 52, 26], lap11: [LAP.cx - LAP.w / 2, LAP.cy - LAP.h / 2, LAP.cx + LAP.w / 2, LAP.cy + LAP.h / 2] });
// the invoice in the Administrator's hand: a sheet that turns about its vertical axis (o.invFlip 0 back .. 1 front)
EXT.prop.inv11 = (side, o, t) => {
  const fl = clamp(o.invFlip ?? 1), sx = Math.abs(Math.cos(fl * PI)), front = fl > .5;
  ctx.save(); ctx.rotate((side > 0 ? .07 : -.07) + .02 * Math.sin(t * 1.7)); ctx.translate(0, -74); ctx.scale(Math.max(.05, sx), 1);
  ctx.fillStyle = '#fffef8'; ctx.strokeStyle = INK; ctx.lineWidth = 2.8; rr(-52, -68, 104, 136, 3); ctx.fill(); ctx.stroke();
  if (front) {
    text('INVOICE', 14, -50, { size: 17, font: 'Bangers', weight: 400, fill: NAVY, spacing: 1.4 });
    ctx.fillStyle = 'rgba(32,32,44,.6)'; for (let i = 0; i < 4; i++) ctx.fillRect(-42, -30 + i * 9, 64 - (i % 2) * 14, 3);
    ctx.fillStyle = '#20202c'; ctx.fillRect(-42, 8, 84, 2.4); text('$1,800.00', 0, 26, { size: 15, fill: NAVY, weight: 900 });
    ctx.save(); ctx.translate(2, 46); ctx.rotate(-.2); ctx.globalAlpha = .85; ctx.strokeStyle = '#d2202c'; ctx.lineWidth = 2.6; rr(-34, -11, 68, 22, 3); ctx.stroke(); text('OVERDUE', 0, 1, { size: 16, font: 'Bangers', weight: 400, fill: '#d2202c', spacing: 1 }); ctx.restore();
  } else { ctx.fillStyle = 'rgba(120,130,170,.18)'; for (let i = 0; i < 6; i++) ctx.fillRect(-40, -46 + i * 14, 80 - (i % 3) * 16, 3); }
  ctx.restore();
};
// her laptop, lid toward us: she types on it, snaps it shut on "Strawberry." (o.lapSnap 0..1 dips the lid for a moment) and keeps hugging it
EXT.prop.lap11 = (side, o, t) => {
  const { w, h, cx, cy } = LAP, dip = 7 * Math.sin(clamp(o.lapSnap ?? 0) * PI);
  ctx.save(); ctx.translate(cx, cy + dip * .5);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
  ctx.fillStyle = V2.grad(-w / 2, -h / 2, w / 2, h / 2, [[0, '#dfe3ec'], [.5, '#b8bfcc'], [1, '#8a92a4']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-w / 2, -h / 2, w, h - dip, 9); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-w / 2 + 8, -h / 2 + 7, w - 16, 10, 4); ctx.fill();
  ctx.save(); ctx.translate(0, 2);   // the logo: our own mark, three round fruit in a bowl (nothing that reads as a real brand)
  ctx.fillStyle = '#6a7084'; ell(-9, -9, 8, 8); ctx.fill(); ell(9, -9, 8, 8); ctx.fill(); ell(0, -19, 8, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-24, -2); ctx.quadraticCurveTo(0, 36, 24, -2); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(20,22,32,.45)'; ctx.fillRect(-w / 2 + 4, h / 2 - 7 - dip, w - 8, 4);
  ctx.restore();
};
// the purse: a squat felt bag, threadbare, a tiny brass kiss-lock; o = 0 shut, 1 open (billboard coordinates, base at the origin)
function purseDraw(open) {
  S10.softShadow(0, 3, 44, 7, .38);
  ctx.fillStyle = V2.grad(-30, -40, 30, 0, [[0, '#8a6272'], [.5, '#6a4654'], [1, '#41262f']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(-26, -34); ctx.bezierCurveTo(-36, -22, -34, -4, -20, 0); ctx.lineTo(20, 0); ctx.bezierCurveTo(34, -4, 36, -22, 26, -34); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(210,180,170,.35)'; ell(-12, -16, 9, 6, .4); ctx.fill(); ell(14, -8, 7, 4, -.3); ctx.fill();   // worn through at the corners
  ctx.strokeStyle = 'rgba(30,14,20,.5)'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(-20, -4); ctx.quadraticCurveTo(0, -12, 20, -4); ctx.stroke(); ctx.setLineDash([]); ctx.restore();   // a darn
  if (open > 0) {   // the mouth: a dark ellipse with a thread of cobweb across it
    ctx.fillStyle = '#12080c'; ell(0, -34, 26, 8 * open + 1); ctx.fill(); ctx.strokeStyle = 'rgba(230,236,250,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-20, -34); ctx.lineTo(0, -34 + 5 * open); ctx.lineTo(20, -34); ctx.moveTo(0, -34 + 6 * open); ctx.lineTo(0, -34 - 2); ctx.stroke();
  }
  // the brass clasp: two knobs, hinged back when open
  const lift = open * 24;
  ctx.fillStyle = V2.grad(0, -44, 0, -30, [[0, '#f6dc82'], [1, '#a8781e']]); ctx.strokeStyle = 'rgba(60,40,6,.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-28, -33); ctx.quadraticCurveTo(0, -42 - lift * .5, 28, -33); ctx.lineTo(28, -30 - lift * .3); ctx.quadraticCurveTo(0, -38 - lift * .5, -28, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (open < .6) { ctx.fillStyle = '#e8c458'; ell(-5, -37, 3.6, 3.6); ctx.fill(); ctx.stroke(); ell(5, -37, 3.6, 3.6); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = '#6a4654'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, -2); ctx.quadraticCurveTo(30, 8, 22, 14); ctx.stroke();   // a loose thread
}
EXT.prop.purse11 = (side, o, t) => { ctx.save(); ctx.rotate(side * .1 + .04 * Math.sin(t * 2.3)); ctx.translate(0, 18); ctx.scale(1.5, 1.5); purseDraw(o.purseOpen || 0); ctx.restore(); };

// ------------------------------------------------------------------ the moth: a fuzzy body, powdery wings that flap, a tiny tired face (billboard: size is the wingspan in px)
function drawMoth(x, y, span, t, o = {}) {
  const sc = span / 100, hz = o.hz ?? 13, flap = .5 + .5 * Math.sin(t * TAU * hz + (o.ph ?? 0)), ext = lerp(.3, 1, flap), sil = !!o.sil, lift = o.lift ?? 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(sc, sc);
  const wing = (s, scaleX) => {   // one side: a forewing and a smaller hindwing, mirrored by s
    ctx.save(); ctx.scale(s * ext * scaleX, 1);
    const fg = sil ? '#10080a' : V2.grad(0, -34, 52, 14, [[0, lift ? hex('#cdb48a', '#ffe9b0', lift) : '#cdb48a'], [.55, lift ? hex('#a58a62', '#ffe0a0', lift * .8) : '#a58a62'], [1, '#7a6246']]);
    ctx.fillStyle = fg; ctx.strokeStyle = sil ? '#10080a' : 'rgba(60,44,28,.8)'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(4, -12); ctx.bezierCurveTo(24, -42, 54, -34, 56, -6); ctx.bezierCurveTo(54, 8, 40, 14, 26, 10); ctx.quadraticCurveTo(14, 6, 5, 2); ctx.closePath(); ctx.fill(); ctx.stroke();   // forewing
    if (!sil) {
      ctx.fillStyle = 'rgba(90,66,40,.55)'; ctx.beginPath(); ctx.moveTo(18, -22); ctx.bezierCurveTo(32, -26, 46, -20, 50, -8); ctx.lineTo(44, -6); ctx.bezierCurveTo(38, -14, 28, -16, 18, -14); ctx.closePath(); ctx.fill();   // a dark band
      ctx.fillStyle = 'rgba(255,244,214,.5)'; for (let i = 0; i < 9; i++) { ell(12 + hash(i + 3) * 40, -30 + hash(i + 9) * 36, 1.6, 1.2); ctx.fill(); }   // powder
      ctx.fillStyle = V2.grad(0, 2, 40, 30, [[0, '#d8c39a'], [1, '#9a8058']]); ctx.strokeStyle = 'rgba(60,44,28,.8)';
    } else ctx.fillStyle = '#10080a';
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.bezierCurveTo(26, 4, 44, 12, 38, 28); ctx.bezierCurveTo(30, 38, 12, 30, 5, 14); ctx.closePath(); ctx.fill(); ctx.stroke();   // hindwing
    if (!sil) { ctx.fillStyle = '#4a3622'; ell(30, 20, 5, 5); ctx.fill(); ctx.fillStyle = '#f2dcae'; ell(30, 20, 2.4, 2.4); ctx.fill(); }   // an eyespot
    ctx.restore();
  };
  wing(1, 1); wing(-1, 1);
  // body: a fuzzy cream oval, tufts, little legs
  ctx.fillStyle = sil ? '#10080a' : V2.grad(-8, 0, 8, 0, [[0, '#cdbb94'], [.5, '#f0e4c6'], [1, '#c2ae86']]); ctx.strokeStyle = sil ? '#10080a' : 'rgba(60,44,28,.85)'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(0, 2, 9, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (!sil) {
    ctx.strokeStyle = 'rgba(255,250,232,.8)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; for (let i = 0; i < 10; i++) { const yy = -16 + i * 4, sd = i % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(sd * 7, yy); ctx.lineTo(sd * 11, yy + 2.4); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(60,44,28,.85)'; ctx.lineWidth = 1.8; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 6, 14); ctx.quadraticCurveTo(sd * 12, 22 + 2 * Math.sin(t * 20 + sd), sd * 9, 30); ctx.stroke(); }
    // the head: two sleepy eyes, a small frown, feathered antennae
    ctx.fillStyle = '#f0e4c6'; ctx.strokeStyle = 'rgba(60,44,28,.85)'; ctx.lineWidth = 2; ell(0, -22, 10, 9); ctx.fill(); ctx.stroke();
    for (const sd of [-1, 1]) {
      ctx.fillStyle = '#fff'; ell(sd * 4.6, -23, 3.8, 3.8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = INK; ell(sd * 4.6 + (o.look ?? 0), -22, 1.7, 1.7); ctx.fill();
      ctx.fillStyle = '#e0d2ae'; ctx.beginPath(); ctx.moveTo(sd * 4.6 - 4.2, -23.6); ctx.lineTo(sd * 4.6 + 4.2, -23.6); ctx.lineTo(sd * 4.6 + 4.2, -26); ctx.lineTo(sd * 4.6 - 4.2, -26); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(sd * 4.6 - 4.2, -23.6); ctx.lineTo(sd * 4.6 + 4.2, -23.6); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();   // the heavy lid
      ctx.strokeStyle = 'rgba(80,50,60,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sd * 4.6, -19, 3.4, .2, PI - .2); ctx.stroke();   // a bag under the eye
      ctx.strokeStyle = 'rgba(60,44,28,.9)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sd * 3, -29); ctx.bezierCurveTo(sd * 8, -40, sd * 18, -42, sd * 24, -36); ctx.stroke();
      ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const u = (i + 1) / 7, ax = lerp(sd * 3, sd * 24, u), ay = -29 - 14 * Math.sin(u * 2.4) + 0; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + sd * 1.4, ay - 5); ctx.stroke(); }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-3.4, -16); ctx.quadraticCurveTo(0, -18.4, 3.4, -16); ctx.stroke();
  } else { ell(0, -22, 10, 9); ctx.fill(); }
  ctx.restore();
}
// where the moth is: it climbs out of the purse, wobbles toward the lamp, then circles the bulb, in front of the shade and behind it
function mothAt(lt, k, off) {
  const m = lt - k.mothOut; if (m < 0) return null;
  const D = off.layout.desk, L = [D.x1 - 96, D.top + 104, D.z1 - 44], P = [PURSE_AT[0], D.top + 52, PURSE_AT[1]];
  const ph = m - .62, orbit = ph > 0, th0 = PI * 1.02;
  let X, Y, Z;
  if (!orbit) { const u = easeOut(m / .62); X = lerp(P[0], L[0] - 78, u) + 8 * Math.sin(m * 11); Y = P[1] + 92 * u + 12 * Math.sin(m * 9); Z = lerp(P[2], L[2] - 6, u) + 8 * Math.sin(m * 7); }
  else { const w = 3.3, th = th0 + w * ph; X = L[0] - 4 + 74 * Math.cos(th); Z = L[2] + 44 * Math.sin(th); Y = L[1] + 20 + 22 * Math.sin(ph * 2.3 + 1) + 10 * Math.sin(m * 9); }
  return { X, Y, Z, L, front: Z <= L[2], u: m, vx: orbit ? -Math.sin(th0 + 3.3 * ph) : 1 };
}
function mothDraw(lt, k, off, part) {
  const s = mothAt(lt, k, off); if (!s) return;
  if ((part === 'front') !== s.front) return;
  const [x, y] = p2(s.X, s.Y, s.Z), kk = kz(s.Z), lamp = p2(s.L[0], s.L[1], s.L[2]), near = Math.max(0, 1 - Math.hypot(x - lamp[0], y - lamp[1]) / (60 * kk)) * (s.front ? 0 : 1);
  drawMoth(x, y, 118 * kk, lt, { rot: .2 * Math.sin(lt * 5), lift: near, hz: 12, look: s.vx * .8 });
}
// the moth's shadow on the wall behind the desk: the lamp throws it big and soft, so it sweeps around while the moth circles.
// It is drawn small into a scratch canvas and blown up, which is both the blur and far cheaper than a filter on every stroke.
let SHADOW_CV = null;
function mothShadow(lt, k, off) {
  const s = mothAt(lt, k, off); if (!s) return;
  const [x, y] = p2(s.X, s.Y, s.Z), lamp = p2(s.L[0], s.L[1], s.L[2]), kk = kz(off.layout.zb), f = 2.6, sx = lamp[0] + 190 * kk + (x - lamp[0]) * f, sy = lamp[1] - 90 * kk + (y - lamp[1]) * f;
  if (!SHADOW_CV) SHADOW_CV = V2.mk(96, 96);
  const g = SHADOW_CV.getContext('2d'), prev = ctx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 96, 96);
  ctx = g; ctx.save(); REG.suppress++;
  try { drawMoth(48, 48, 64, lt, { sil: true, hz: 12, rot: .2 * Math.sin(lt * 5) }); } finally { REG.suppress--; ctx.restore(); ctx = prev; }
  const size = 118 * kz(s.Z) * f * 1.5;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .55 * lampAt(lt, k); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(SHADOW_CV, sx - size / 2, sy - size / 2, size, size); ctx.restore();
}
// the invoice lying on the desk after the insert, and the purse once it is set down
function deskPaper(off, lt, k) {
  if (lt < k.laid) return;
  const y = off.layout.desk.top + .8, [X, Z] = PAPER_AT, w = 124, d = 156;
  quad3([X, y, Z], [X + w, y, Z], [X + w + 8, y, Z + d], [X + 8, y, Z + d], '#fffef6', 'rgba(20,16,30,.7)', 1.6);
  ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = '#20202c';
  for (let i = 0; i < 6; i++) { const a = p2(X + 14 + i * 1.2, y, Z + 22 + i * 18), b = p2(X + w - 16 - (i % 2) * 22, y, Z + 22 + i * 18); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(32,32,44,.5)'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  const r0 = p2(X + 60, y, Z + 112), r1 = p2(X + 104, y, Z + 130); ctx.fillStyle = 'rgba(214,32,46,.7)'; ctx.fillRect(r0[0], r0[1] - 4, r1[0] - r0[0], 8);
  const pen = p2(X + 30, y, Z + 56), pen2 = p2(X + 70, y, Z + 60); ctx.strokeStyle = 'rgba(29,63,168,.7)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(...pen); ctx.quadraticCurveTo(pen[0] + 12, pen[1] - 6, pen2[0], pen2[1]); ctx.stroke();
  ctx.restore();
}
function deskPurse(off, lt, k) {
  if (lt < k.purseAway) return;
  const open = lt >= k.popped ? Math.min(1, easeBack(seg(lt, k.popped, k.popped + .18))) : 0;
  const hop = lt >= k.popped ? 9 * Math.exp(-(lt - k.popped) * 16) * Math.abs(Math.cos((lt - k.popped) * 24)) : 0;
  S10.stand(PURSE_AT[0], off.layout.desk.top, PURSE_AT[1], () => { ctx.translate(0, -hop); ctx.scale(1.2, 1.2); purseDraw(open); });
  if (open > .3 && lt < k.popped + .6) { const [x, y] = p2(PURSE_AT[0], off.layout.desk.top + 52, PURSE_AT[1]), u = seg(lt, k.popped, k.popped + .6), kk = kz(PURSE_AT[1]); ctx.save(); ctx.globalAlpha = (1 - u) * .5; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .4, r = (10 + 46 * u) * kk; ctx.fillStyle = 'rgba(210,196,170,.9)'; ell(x + Math.cos(a) * r, y - 8 * kk - 24 * u * kk + Math.sin(a) * r * .5, (4 + 5 * u) * kk, (4 + 5 * u) * kk); ctx.fill(); } ctx.restore(); }   // a puff of dust
}

// ------------------------------------------------------------------ the office options, the cast
function officeOpts(lt) {
  const k = K();
  return { night: true, t: lt + 3, lampOn: lampAt(lt, k), chairShift: chairShift(lt, k), visitorX: VIS_X, paintingOpen: portraitOpen(lt, k), vaultOpen: doorOpen(lt, k), vaultBolts: boltsAt(lt, k), wheelRot: wheelAt(lt, k), vaultDraw: c => vaultInside(c, lt) };
}
function cast(lt) {
  const k = K(), off = S10.office(officeOpts(lt)), g = gold(lt, k), b = id => B(id);
  const A1 = b('a1'), S1 = b('s1'), A2 = b('a2'), S2 = b('s2'), A3 = b('a3'), S3 = b('s3'), A4 = b('a4'), S4 = b('s4'), A5 = b('a5'), MO = b('moth');
  // ---------------- the Administrator, seated on his throne (which rolls); the set seats him on the shifted chair
  const rollU = seg(lt, k.roll0, k.roll1), rock = lt < k.back0 ? Math.sin(rollU * TAU) * .09 * (rollU > 0 && rollU < 1 ? 1 : 0) : 0;
  const ad = off.admin({ look: [-.8, .05], expr: 'happy', arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {}, hand: {}, rot: rock, sx: 1 + .03 * Math.sin(rollU * PI) });
  // reading the invoice, then looking up on "Strawberry.", the paper turned toward her on "This invoice is"
  if (lt < A1.s + .7) {
    ad.hold.l = 'inv11'; gripTo(ad, 'l', [-168, 14]); ad.hand.l = 'grip'; ad.invFlip = sk(lt, A1.s + .45, A1.s + .85);
    ad.look = lt < A1.s - .1 ? [-.2, .8] : lerpA([-.2, .8], [-.85, .05], sk(lt, A1.s - .1, A1.s + .12)); ad.expr = lt < A1.s ? 'neutral' : 'happy'; if (lt < A1.s - .1) ad.lid = .2;
  }
  if (lt >= A1.s + .7 && lt < S1.s) { ad.expr = 'shock'; ad.browUp = 8; ad.look = [-.85, .05]; ad.hold.l = 'inv11'; gripTo(ad, 'l', [-176, 6]); ad.hand.l = 'grip'; ad.invFlip = 1; if (lt > k.laid - .1) { ad.hold = {}; ad.grip = {}; ad.arms.l = 'rest'; } }
  if (lt >= S1.s && lt < A2.s) { ad.expr = 'happy'; ad.look = [-.85, .05]; }
  if (lt >= A2.s && lt < S2.s) { ad.expr = 'happy'; ad.look = [-.8, .1]; ad.rot = -.025; ad.mouthOpen = undefined; }
  if (lt >= S2.s && lt < A3.s) { ad.expr = lt >= wordT('s2', 'two', 7.87) ? 'shock' : 'neutral'; ad.browUp = lt >= wordT('s2', 'two', 7.87) ? 6 : 0; ad.look = [-.85, .05]; }
  if (lt >= A3.s && lt < S3.s) { ad.expr = 'happy'; ad.look = [-.8, .05]; const sh = sk(lt, A3.s + .55, A3.s + .75) * (1 - sk(lt, A3.e - .05, A3.e + .2)); if (sh > 0) { ad.arms.l = 'shrug'; ad.arms.r = 'shrug'; } }
  if (lt >= S3.s && lt < k.freeze - .02) { ad.expr = 'happy'; ad.look = [-.85, .05]; }
  if (lt >= k.freeze - .02 && lt < k.roll0) { ad.expr = 'neutral'; ad.look = [-.25, 0]; ad.browUp = 7; ad.shake = 1.4; }
  if (lt >= k.roll0 && lt < k.V + .56) { ad.expr = 'sour'; ad.look = [-.9, -.2]; ad.lid = .25; }
  // the left hand: to the portrait's edge, pulling it open, then a flick at the wheel's knob
  const P = off.layout.portrait, zp = off.layout.zb - 7, ang = portraitOpen(lt, k) * 1.95, rest = [-130, 60];
  const edge = p2(P.x0 + P.w * Math.cos(ang), P.y0 + 150, zp - P.w * Math.sin(ang));
  if (lt >= k.reach && lt < k.flick) handTo(ad, -1, edge[0], edge[1], sk(lt, k.reach, k.reach + .16) * (1 - sk(lt, k.flick - .22, k.flick - .1)), rest);
  if (lt >= k.flick - .12 && lt < k.V + .56) { const kn = p2(RC.x + 52, RC.y + 6, off.layout.zb - 2), u = sk(lt, k.flick - .12, k.flick + .06); handTo(ad, -1, lerp(edge[0], kn[0], u), lerp(edge[1], kn[1], u), sk(lt, k.flick - .12, k.flick + .04) * (1 - sk(lt, k.spin0 + .05, k.spin0 + .25)), rest); }
  if (lt >= k.V + .56 && lt < A4.s) {   // the light hits him: a squint, an arm up against the glare, then the smile of a man who had forgotten
    const sh = sk(lt, k.V + .6, k.V + .9) * (1 - sk(lt, k.V + 1.9, k.V + 2.3)), [fx, fy] = faceC(ad);
    ad.expr = 'shock'; ad.look = [-.9, -.4]; ad.lid = lerp(0, .55, sh); if (lt > k.V + 1.9) { ad.expr = 'happy'; ad.lid = undefined; ad.browUp = 6; ad.sparkle = true; }
    if (sh > 0) handTo(ad, -1, fx - 150 * ad.s, fy - 40 * ad.s, sh, rest);
  }
  if (lt >= A4.s && lt < A4.e + .4) { ad.expr = 'happy'; ad.browUp = 8; ad.sparkle = true; ad.look = lt < A4.s + .6 ? [-.9, -.35] : [-.7, .1]; ad.rot = .03 * Math.sin((lt - A4.s) * 5); }
  if (lt >= A4.e + .4 && lt < A5.s) { ad.expr = 'neutral'; ad.look = [-.85, .05]; }
  if (lt >= A5.s && lt < MO.s) {   // the purse: out of an inside pocket, held up beside him, then lowered out of the picture
    const out = sk(lt, k.purseOut, k.purseOut + .3), away = sk(lt, k.purseAway - .22, k.purseAway);
    ad.expr = 'weak'; ad.look = lt < A5.s + .5 ? [-.5, .6] : [-.85, .1]; ad.lid = undefined;
    if (lt < k.purseAway) { ad.hold.l = 'purse11'; gripTo(ad, 'l', [lerp(-142, -172, out) + 8 * away, lerp(92, 14, out) + 80 * away]); ad.hand.l = 'grip'; ad.purseOpen = 0; }
  }
  if (lt >= MO.s) {   // the moth: his finger flicks the purse's clasp at the cue, he follows the moth, then the apologetic shrug
    const sh = sk(lt, MO.s + .8, MO.s + 1.05), [cx, cy] = p2(PURSE_AT[0], off.layout.desk.top + 56, PURSE_AT[1]), fl = (1 - sk(lt, k.popped + .08, k.popped + .34));
    if (fl > 0) { handTo(ad, 1, cx + 6 * kz(PURSE_AT[1]), cy - 8 * kz(PURSE_AT[1]) + 8 * Math.exp(-Math.pow((lt - k.popped) / .03, 2)), fl, [130, 60]); ad.hand = { r: 'point' }; }
    ad.expr = 'weak'; ad.lid = undefined; ad.browUp = 4; ad.look = lt < MO.s + .8 ? [-.1 + .5 * Math.sin((lt - MO.s) * 3), -.5] : [-.85, .1];
    if (sh > 0) { ad.arms.l = 'shrug'; ad.arms.r = 'shrug'; ad.rot = -.03 * sh; }
  }
  // ---------------- Strawberry: typing at first, then the stare
  const sp = person(A11.straw, route([[0, STRAW_AT[0], STRAW_AT[1]]]), lt, { id: 'straw', who: 'straw', expr: 'dead', lid: .4, look: [.85, 0], arms: { l: 'rest', r: 'rest' }, acc: ['steth', 'bandage7', 'perdiem9'], hold: {}, grip: {}, hand: {} });
  if (EXT.acc.excoat11) sp.acc.push('excoat11');
  sp.hold.r = 'lap11'; sp.lapSnap = seg(lt, 1.46, 1.62); gripTo(sp, 'r', [112, 104]); sp.hand = { r: 'grip', l: 'grip' };   // the laptop: lid toward us while she types, snapped shut on "Strawberry."
  if (lt < 1.6) { gripTo(sp, 'l', [-70 + 4 * Math.sin(lt * 31), 98 + 4 * Math.sin(lt * 27 + 1)]); sp.look = [0, .85]; sp.lid = .4; sp.expr = 'neutral'; }
  else { gripTo(sp, 'l', [-84 + 1.5 * Math.sin(lt * 1.9), 100]); sp.look = lerpA([0, .85], [.85, 0], sk(lt, 1.42, 1.6)); }
  if (lt >= S1.s && lt < A2.s) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.85, 0]; }
  if (lt >= S2.s && lt < A3.s) { const br = sk(lt, wordT('s2', 'two', 7.87) - .05, wordT('s2', 'two', 7.87) + .15); sp.expr = 'dead'; sp.lid = .45; sp.browUp = 6 * br; sp.look = [.85, 0]; }
  if (lt >= S3.s && lt < k.roll0 + .6) { sp.expr = 'smug'; sp.lid = .35; sp.look = [.85, -.05]; }
  if (lt >= k.roll0 + .6 && lt < k.V + .56) { sp.expr = 'dead'; sp.lid = .3; sp.look = [.9, -.1]; }
  if (lt >= k.V + .56 && lt < A4.s) {   // the gold floods in: her eyes widen a notch, she looks at the vault, then down at the coin at her shoe
    const w = sk(lt, k.V + .7, k.V + 1.2), dn = sk(lt, k.V + 2.1, k.V + 2.45);
    sp.expr = 'dead'; sp.lid = lerp(.4, .08, w) + .3 * dn; sp.browUp = 9 * w * (1 - dn); sp.look = lerpA(lerpA([.9, -.1], [-.7, -.5], w), [0, .9], dn);
  }
  if (lt >= A4.s && lt < S4.s) { sp.expr = 'dead'; sp.lid = .5; sp.look = [.9, 0]; }
  if (lt >= S4.s && lt < A5.s) { const f = sk(lt, S4.s + .5, S4.e); sp.expr = f < .5 ? 'hopeful' : 'dead'; sp.lid = f < .5 ? 0 : .5; sp.sparkle = f < .5; sp.look = [.9, 0]; }
  if (lt >= A5.s && lt < MO.s) { sp.expr = 'dead'; sp.lid = .6; sp.look = [.9, .2]; }
  if (lt >= MO.s) { sp.expr = 'dead'; sp.lid = .66; sp.look = [0, 0]; sp.transit = lt < 21.0; }
  return { off, ad, sp, k, g };
}

// ------------------------------------------------------------------ light: the night office, turning gold
function lightFor(C, who) {
  const { off, g } = C, base = off.lightPreset, gc = '#ffd070';
  off.setLight({
    key: [lerp(base.key[0], -.78, g), lerp(base.key[1], -.12, g)], keyColor: hex(base.keyColor, gc, g * .9), keyA: lerp(base.keyA, .4, g),
    rim: hex(base.rim, '#ffbc4a', g), rimA: lerp(base.rimA, .66, g), bounce: hex(base.bounce, '#ffc860', g), bounceA: lerp(base.bounceA, .26, g),
    back: who === 'ad' && g > .05 ? { color: '255,214,120', a: .5 * g, w: 18 } : null, frontDark: who === 'ad' ? .2 * g : 0,
  });
  if (g > .01) { const [x, y] = off.at.recess(); V2.addLight({ x, y, r: 1500, color: '255,196,84', a: .8 * g }); }
}
const faceKeep = o => { const [x, y] = faceC(o); return [x, y, 100 * o.s]; };

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotOf(lt).n,
  cam(lt) {
    const sh = shotOf(lt), n = sh.n, k = seg(lt, sh.t0, sh.t1), KK = K();
    const F = (o, z, up = 110) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };
    if (INSERTS[n]) {
      V2.setCam(BASE);
      if (n === 'inv1') zoomTo(540, lerp(740, 800, k), lerp(1.0, 1.2, k));
      else if (n === 'inv2') zoomTo(lerp(540, 505, k), 700, lerp(1.04, 1.18, k));   // the whole line (world x 118 to 933) stays inside the frame: HELPING and $1,800.00 are never cut
      else if (n === 'inv3') zoomTo(lerp(528, 546, k), 700, lerp(1.04, 1.2, k));
      else zoomTo(540, 960, 1);
      return;
    }
    switch (n) {
      case 'wide': V2.setCam(Object.assign({}, BASE, { cy: 380, hy: 860, cz: lerp(-420, -300, k) })); zoomTo(lerp(596, 586, k), lerp(1000, 990, k), lerp(1.2, 1.34, k)); break;
      case 'two': case 'two2': { V2.setCam(BASE); const C = cast(lt), a = faceC(C.ad), s = faceC(C.sp); zoomTo((a[0] + s[0]) / 2 - 12, (a[1] + s[1]) / 2 + 80, 1.24); } break;
      case 'cuS1': case 'cuS3': { V2.setCam(BASE); const C = cast(lt); F(C.sp, lerp(1.85, 1.95, k), 130); } break;
      case 'cuS4': { V2.setCam(MID); const C = cast(lt); F(C.sp, lerp(1.85, 1.95, k), 130); } break;
      case 'cuA3': case 'cuA3b': { V2.setCam(BASE); const C = cast(lt); F(C.ad, lerp(1.7, 1.8, k), 130); } break;
      case 'cuA4': { V2.setCam(MID); const C = cast(lt); F(C.ad, lerp(1.7, 1.8, k), 130); } break;
      case 'cuA5': { V2.setCam(MID); const C = cast(lt); F(C.ad, lerp(1.5, 1.6, k), 60); } break;
      case 'purse': { V2.setCam(MID); const p = p2(428, 300, 1378); zoomTo(p[0] - 90, p[1] + 70, lerp(2.0, 2.2, k)); } break;
      case 'trk': {
        V2.setCam(HIGH); const u = sk(lt, sh.t0, KK.roll1 + .1);
        zoomTo(lerp(594, 462, u), lerp(1160, 1200, u), lerp(1.28, 1.5, u));
      } break;
      case 'vault': {
        const u = sk(lt, KK.V + .85, KK.V + 2.0), p = sk(lt, KK.V + .1, KK.V + .6);
        V2.setCam(Object.assign({}, HIGH, { cz: lerp(-100, -330, u), cx: lerp(0, -200, u), cy: lerp(580, 640, u), hy: lerp(800, 790, u) }));
        const A = p2(-230, 300, 1400), z = lerp(lerp(1.5, 1.65, p), 1.25, u);
        zoomTo(lerp(lerp(462, 424, p), A[0] + 34, u), lerp(lerp(1200, 1170, p), A[1] - 20, u), z);
      } break;
      default: {   // the last wide: the three of them in the lamp's pool, pulling back from the moth
        const u = sk(lt, sh.t0, sh.t0 + .85);
        V2.setCam(Object.assign({}, MID, { cy: 480, hy: 880, cz: lerp(-300, -560, u) }));
        const p = p2(PURSE_AT[0] - 160, 300, PURSE_AT[1]);
        zoomTo(lerp(p[0] + 150, 650, u), lerp(1040, 1060, u), lerp(1.6, 1.1, u));
      }
    }
    if (n === 'trk' || n === 'vault') {   // the clank, the three bolts, a low rumble while the hinge groans, the door hitting its stop
      const hit = (t0, a, d = 14) => lt >= t0 ? a * Math.exp(-(lt - t0) * d) : 0;
      CAM.shake = hit(KK.spin0, 2.2) + KK.bolt.reduce((q, t) => q + hit(t, 3), 0) + hit(KK.door1 - .05, 7, 11) + 1.2 * smooth(seg(lt, KK.door0, KK.door0 + .3)) * (1 - smooth(seg(lt, KK.door1 - .12, KK.door1)));
    }
  },
  draw(lt) {
    const n = shotOf(lt).n;
    if (n === 'screen') { insScreen(lt); return; }
    if (INSERTS[n]) { insInvoice(lt, n); return; }
    const C = cast(lt), off = C.off, k = C.k, g = C.g, V = k.V, subjS = !!SUBJ_S[n], subjA = !!SUBJ_A[n];
    const coins = lt > V ? coinFrame(lt, V) : [], keep = [faceKeep(C.ad), faceKeep(C.sp)];
    const blurBack = { cuS1: 8, cuS3: 8, cuS4: 8, cuA3: 8, cuA3b: 8, cuA4: 7, cuA5: 7, purse: 4 }[n] || 0;
    lightFor(C, 'sp');
    V2.dof(blurBack, () => { off.back(); off.sunFloor(); hiss(lt, off, k); goldWall(lt, off, g, k); drawMound(lt, V); drawCoins(coins, 1580, 1e9); mothShadow(lt, k, off); });
    lightFor(C, 'ad'); (subjS ? nbr : drawChar)(C.ad);
    mothDraw(lt, k, off, 'behind');
    drawCoins(coins, 1184, 1580);
    if (subjS) V2.dof(7, () => off.desk()); else off.desk();
    deskPaper(off, lt, k); deskPurse(off, lt, k);
    mothDraw(lt, k, off, 'front');
    drawCoins(coins, 1010, 1184);
    lightFor(C, 'sp'); off.visitor('back'); (subjA ? nbr : drawChar)(C.sp); off.visitor('front');
    drawCoins(coins, -1e9, 1010);
    goldFloor(g);
    goldGlints(coins, lt, k, g, keep);
    if (g > .02) { const [cx, cy] = off.at.recess(); V2.dust(cx - 150, cy - 120, cx + 760, cy + 760, lt, { n: 46, color: '255,228,150', alpha: .75 * g, size: 3, speed: 9, seed: 6 }); }
  },
  fx(lt) {
    const k = K(), g = gold(lt, k);
    return { bloom: .5 + .3 * g, vignette: .45, grain: .045, contrast: .14, sat: .1, tint: [['#9fb4ff', .08 * (1 - g), 'soft-light'], ['#ffc860', .26 * g, 'soft-light']], fade: Math.max(lt < .2 ? 1 - lt / .2 : 0, seg(lt, CUR.dur - .25, CUR.dur - .02)), fadeColor: '0,0,10' };
  },
  blur: lt => { const k = K(); return lt > k.V + .3 && lt < k.V + 2.3 ? 3 : lt > k.M + .07 && lt < k.M + 1.7 ? 3 : 1; },   // 1 right after a cut: no double exposure
  over(lt) {
    const k = K(), pk = Math.exp(-Math.pow((lt - (k.V + 1.25)) / .42, 2));
    if (pk > .03 && shotOf(lt).n === 'vault') {   // a soft flare off the vault's opening at the peak of the reveal
      const [vx, vy] = V2.p2(RC.x, RC.y, RC.z), sx = W / 2 + (vx - CAM.x) * CAM.z, sy = H / 2 + (vy - CAM.y) * CAM.z;
      if (sx > -300 && sx < W + 300 && sy > -300 && sy < H + 300) V2.flare(sx, sy, .5 * pk, '255,226,170');
    }
    sfxWord(lt, k.V + .2, 'CLANK!', 290, 318, { size: 100, rot: -.1, fill: '#d8e4ff', hold: .45 });
    sfxWord(lt, k.ching, 'KA-CHING!', 740, 276, { size: 100, rot: -.05, fill: '#ffe135', hold: .7 });
  },
};
window.__EP11_SCENES = window.__EP11_SCENES || {};
window.__EP11_SCENES.vault = SC;
})();
