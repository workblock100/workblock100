'use strict';
/* SHIFT HAPPENS, Episode 12: The In-Service. Scene module: award (4:52 PM, THE BREAK ROOM). Registers window.__EP12_SCENES.award.
 *
 * The Staff Engagement Awards in the break room. The Administrator gives Lemon Most Reports Filed ("Nobody reads them."), pulls out
 * a report whose bookmark says where the good cuff is (Mango: "You knew?"), strikes the gong, hands Clementine the Newest Hire rosette
 * ("Sure!"), and calls Strawberry out for a Friday call-out. She says No. The room goes still. She takes a donut from the plate, looks at it,
 * puts it back and walks out on the left; the sting. A framed ATTENDED, UNDER PROTEST certificate fades in on the back wall.
 *
 * Copied, not imported (earlier episodes are private): the break-room kit and helpers from ep8_break.js, the balloons, bunch, banner and
 * sfxWord from ep10_party.js, the welcome banner's style from ep9_arrival.js, the table donut from ep10_days.js, Mrs. Cranberry's chair from ep7.js.
 * World coordinates: X right, Y up, Z forward; V2.at / V2.p2 project them. The Administrator is A9.melon at s 1.22; Strawberry is A11.straw.
 * Depth: the room shell is drawn first; the set pieces (table, counter, lectern, gong, balloons, fridge) and the cast are sorted together
 * far to near, so anything standing behind a set piece is covered by it.
 *
 * Shot list (scene-local seconds, from build/ep12/timeline.json; the shot name changes at every cut):
 *   0.00 open    wide. The crowd claps at 0.20. The Administrator at the lectern, the trophy between him and Lemon.
 *   1.27 two     a1 two-shot: Administrator and Lemon; he points at the trophy on "Most Reports Filed".
 *   4.06 cuL     l1 close-up Lemon, flat. "Nobody reads them."
 *   6.17 two     a2: he takes the report out from behind the lectern and holds it up.
 *   7.42 rep     insert, full frame: page one of the report, the yellow bookmark in Lemon's hand (GOOD CUFF ...).
 *   9.72 cuM     m1 close-up Mango, double take ("You knew?").
 *  10.47 two     a3 two-shot ("It's in your report.").
 *  11.60 gong    the strike at 11.87 (the sound cue sits 0.10 into the beat): the gong shakes, a shock ring crosses the frame,
 *                the balloons jiggle, Mango flinches.
 *  12.80 walk    a4: Clementine walks up with the rosette while the Administrator points at her.
 *  14.90 cuC2    c2 close-up Clementine, bouncing ("Sure!").
 *  15.40 back    a5 wide of the back of the room: Strawberry by the back wall on the far left, Mango looking round at her ("Attended.").
 *  18.60 cuS1    s1 close-up Strawberry, sour ("Under protest.").
 *  19.70 ask     a6: she walks forward round the table; a slow push onto her face through "call-out".
 *  23.10 no      s2 close-up, held ("No.").
 *  23.80 still   silence, ticks at 23.81 / 24.31 / 24.81. The camera pulls out, the balloons freeze, Lemon lowers the stack an inch.
 *  25.20 two2    a7 two-shot ("Did you say...?") and s3 ("No.").
 *  26.70 cuM2    m2 Mango, hand over her mouth ("She said it.").
 *  27.60 cuA     a8 the Administrator's smile fades, then brightens ("There's no slide for that.").
 *  29.10 table   s4: she reaches to the plate, takes a donut (29.36), looks at it, puts it back (30.27), walks out left
 *                (the sting at 31.04; she is off the frame by then).
 *  30.90 tail    the last 0.55 s (the scene has no more room after `end`): the room holds on the empty space where she was,
 *                the Administrator and Lemon look at each other, a balloon drifts up, the certificate has faded in (from 31.04).
 */
(() => {
if (!window.TIMELINE_EP12) return;
const { person, zoomTo, faceZoom, faceC, drawBg } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S6 = window.S6, S7 = window.S7;
const { p2, poly, grad } = V2;
const { box3, onZ, kz, ceilingLamp, table3, wallClock, microwave, backWindow } = S6;
const melon = A9.melon, straw = A11.straw, lemon = A7.lemon, mango = A7.mango, cran = A7.cran, clem = A10.clem;
const bs = id => B(id).s, be = id => B(id).e;

// ---- helpers (copies of the Episode 8 and 10 ones)
const route = keys => lt => {   // [t, X, Z, ease]: linear between keys, 'io' or 'out' to ease a leg
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const vtrack = keys => lt => {  // [t, [v, ...], ease]: a vector of numbers (angles, grips) eased between keys
  if (lt <= keys[0][0]) return keys[0][1].slice();
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[2] === 'io' ? easeIO(k) : b[2] === 'out' ? easeOut(k) : k; return a[1].map((v, j) => v + (b[1][j] - v) * e); }
  return keys[keys.length - 1][1].slice();
};
function sfxWord(lt, t0, str, x, y, o = {}) {   // an onomatopoeia that pops in and fades
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const BCOL = ['#ff4f6d', '#ffd23a', '#4aa8ff', '#58c85a', '#c25bd6', '#ff9f1c'];

// ---- the stage: the break room (warm, the afternoon sun through the window)
const ZB = 2100, HW = 520, CH = 620;                                  // back wall, half width, ceiling
const CAMP = { f: 1400, cy: 330, hy: 860 };
const WIN = { x0: 40, x1: 250, y0: 220, y1: 470 };                    // the window in the back wall
const DOOR = { x0: -250, x1: -110, y1: 430 };                         // the sliding door to the hall
const CLOCK = { x: -60, y: 430, r: 58 };                              // the wall clock, 4:52, between the door and the window
const BAN = { X0: -430, X1: 430, Y0: 506, Y1: 588 };                  // STAFF ENGAGEMENT AWARDS
const CERT = { x0: -440, x1: -300, y0: 292, y1: 472 };               // Strawberry's certificate, on the back wall where she stood, below the banner (fades in at the end)
const TABLE = { x: -400, z: 1420, w: 95, d: 300, h: 135 };            // the long table on the left (front edge at Z 1120)
const PODIUM = { x: -60, z: 1420, w: 80, d: 80, h: 110 };             // the lectern; the trophy on top (a low lectern keeps the trophy below Mango's face)
const GONG = { x: 460, y: 300, z: 1640, r: 90 };                      // the gong on its frame, right of the Administrator's reach
const COUNTER = { x0: 260, x1: 500, z0: 1650, z1: 1930, h: 200 };     // the counter, right (the microwave on it)
const FRIDGE = { x0: 440, x1: 520, z0: 1990, z1: 2090, h: 470 };
const BUNCH = [[-200, 2060], [470, 1600]];                            // the balloon bunch on its floor weight (the second is the tail's floater's start)
const PLATE = [-352, 1200], PLATE_R = 42;                             // the donut plate on the table
const DONUTS = [[-366, 1186], [-340, 1184], [-352, 1212]];            // the last one is the one she takes
const TAKE = [-352, 160, 1212], UP = [-330, 236, 1190];
// ---- the cast: world X and Z
const MEL = [150, 1580], LEM = [-170, 1400], MNG = [-40, 1700], CRN = [330, 2000], BGB = [-40, 2060];
const CLM0 = [-40, 1900], CLM1 = [-80, 1300];
const STR0 = [-470, 1975], STR1 = [-200, 1262], STROUT = [-820, 1010];
const GONG_T = () => bs('gong') + .1;                                  // the strike (the sound cue sits 0.10 into the gong beat)
const REP_T = () => bs('a2') + 1.22;                                   // the insert of the report
const EXIT_T = () => bs('s4') + 1.2;                                   // she starts for the door
const RELEASE_T = () => bs('s4') + 1.17;                               // the donut goes back on the plate
const SEAT_T = () => bs('end') + .1;                                   // the sting: the certificate fades in

// ---- the perspective: a character's screen origin and scale, and the hand target for a world point
const at = (X, Z, sc = 1) => { const q = V2.at(X, Z); return { x: q.x, y: q.y, s: q.s * sc }; };
const KD = kind => KINDS[kind] || KINDS.lemon;
// the arms are solved in the body's own frame (drawChar): its origin is the body centre, (legs + 0.9 ry) above the feet; `lift` is in screen px
const gripAt = (o, kind, X, Y, Z, noLegs = false) => { const [px, py] = p2(X, Y, Z), k = KD(kind), leg = noLegs ? 0 : (k.leg || 90); return [(px - o.x) / o.s, (py + (o.lift || 0) - o.y) / o.s + leg + k.ry * .9]; };
// the balloons: still for the silence (the calm factor), shaken by the gong
const calm = lt => { const s2 = bs('s2'), eS = be('silence'); return 1 - .95 * seg(lt, s2 - .2, s2 + .3) * (1 - seg(lt, eS + .2, eS + 1.4)); };
const jig = lt => lt > GONG_T() ? 1 + 1.6 * Math.exp(-(lt - GONG_T()) * 2.2) : 1;

// ---- a balloon, a bunch on a weight, the pink banner (ep10_party.js, with the same look)
function balloonAt(qx, qy, R, col, kk, sq) {
  ctx.save(); ctx.translate(qx, qy); ctx.scale(1 + .22 * sq, 1 - .16 * sq); ctx.translate(-qx, -qy);
  ctx.fillStyle = V2.radial(qx - R * .3, qy - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, col], [1, V2.rgba(V2.mix(col, '#2a1030', .45), 1)]]);
  ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = Math.max(2, 2.6 * kk); ctx.beginPath(); ctx.ellipse(qx, qy, R * .82, R, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(qx - 7 * kk, qy + R * 1.06); ctx.lineTo(qx + 7 * kk, qy + R * 1.06); ctx.lineTo(qx, qy + R * 1.0 + 11 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(qx - R * .36, qy - R * .46, R * .14, R * .26, -.5, 0, TAU); ctx.fill();
  ctx.restore();
  return [qx, qy + R * 1.06, R];
}
function balloon3(x, y, z, col) { const q = p2(x, y, z), kk = kz(z); return balloonAt(q[0], q[1], 62 * kk, col, kk, 0); }
function balloonBunch(Xc, Zc, lt, seed, cm = 1, n = 6) {   // a bunch tied to a weight on the floor; each balloon bobs and sways on its own string
  const kk = kz(Zc), w = p2(Xc, 0, Zc), list = [], j = jig(lt);
  ctx.save(); ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.translate(w[0], w[1]); ctx.scale(kk, kk); rr(-22, -26, 44, 26, 5); ctx.fill(); ctx.stroke(); ctx.restore();
  for (let i = 0; i < n; i++) {
    const bob = Math.sin(lt * 1.5 + i * 1.3 + seed) * 12 * cm * j, sway = Math.sin(lt * 1.05 + i * .9 + seed) * 9 * cm * j;
    list.push({ i, x: Xc + (i - (n - 1) / 2) * 34 + sway, y: 300 + (i % 3) * 58 + (i === 1 || i === 4 ? 40 : 0) + bob, z: Zc + (i % 2) * 18 });
  }
  list.sort((a, b) => b.z - a.z);
  for (const b of list) {
    const [sx, sy] = balloon3(b.x, b.y, b.z, BCOL[(b.i + seed) % 6]);
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kz(b.z)); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * kk);
    ctx.quadraticCurveTo(lerp(w[0], sx, .5) + 16 * Math.sin(lt + b.i) * cm, lerp(w[1], sy, .6), sx, sy); ctx.stroke();
  }
}
// the banner: STAFF ENGAGEMENT AWARDS across the back wall, with pennants (the welcome banner of Episode 9, in the party's pink)
function banner12(lt) {
  const Z = ZB - 4, k = kz(Z), wv = x => 3.5 * k * Math.sin(x * .012 + lt * 1.7);
  const tl = p2(BAN.X0, BAN.Y1, Z), tr = p2(BAN.X1, BAN.Y1, Z), bl = p2(BAN.X0, BAN.Y0, Z), br = p2(BAN.X1, BAN.Y0, Z);
  const BW = tr[0] - tl[0];
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(50,40,40,.7)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, BAN.X0], [tr, BAN.X1]]) { const c = p2(X, CH, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = grad(0, tl[1], 0, bl[1], [[0, '#e93a8a'], [1, '#b0185f']]); ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = Math.max(4, 8 * k);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0)); for (let i = 1; i <= 24; i++) ctx.lineTo(lerp(tl[0], tr[0], i / 24), tl[1] + wv(i * 36));
  for (let i = 24; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / 24), bl[1] + wv(i * 36 + 90)); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.save(); ctx.translate((tl[0] + tr[0]) / 2, (tl[1] + bl[1]) / 2 + 1.5 * k);
  text('STAFF ENGAGEMENT AWARDS', 0, 0, { size: 62 * k, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 6 * k, stroke: '#6a0c3a', spacing: 3, maxW: BW * .92 });
  ctx.restore();
  for (let i = 0; i < 13; i++) { const u = (i + .5) / 13, px = lerp(bl[0], br[0], u), py = bl[1] + wv(u * 24 * 36 + 90) + 3; ctx.fillStyle = ['#ffd23a', '#4aa8ff', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 15 * k, py); ctx.lineTo(px + 15 * k, py); ctx.lineTo(px, py + 34 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

// ---- the props: held ones (the origin is the hand, see drawProp in engine.js) and the set pieces (origin at the base or the centre)
EXT.prop.mallet12 = (side, o, t) => {   // the gong mallet: a wooden stick and a felt head
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#9b6a3c'; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; rr(-6, -112, 12, 116, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6d6a72'; ctx.beginPath(); ctx.arc(0, -122, 25, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(-8, -130, 8, 0, TAU); ctx.fill();
  ctx.restore();
};
Object.assign(PROP_BOX, { mallet12: [-28, -152, 28, 8] });
EXT.prop.report12 = (side, o, t) => {   // the report the Administrator holds up: a blue header, ruled lines, a yellow bookmark
  ctx.save(); ctx.rotate(-.05);
  ctx.fillStyle = '#fffdf4'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-56, -150, 112, 150, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a78b8'; ctx.fillRect(-56, -150, 112, 16);
  ctx.strokeStyle = 'rgba(40,60,110,.4)'; ctx.lineWidth = 1.4; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-46, -118 + i * 16); ctx.lineTo(46, -118 + i * 16); ctx.stroke(); }
  ctx.fillStyle = '#ffe066'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; rr(30, -172, 30, 60, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
};
Object.assign(PROP_BOX, { report12: [-60, -180, 62, 8] });
EXT.prop.reports12 = (side, o, t) => {   // Lemon's stack of reports, hung off his hand on the screen-left side (clear of his face), a bookmark strip out of the top one
  ctx.save(); ctx.lineJoin = 'round'; ctx.translate(-96, 0);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fbf6e6' : '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.save(); ctx.translate(i * 1.5, -i * 7); rr(0, -70, 96, 84, 3); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.fillRect(4, -80, 12, 40); ctx.strokeRect(4, -80, 12, 40);
  ctx.restore();
};
Object.assign(PROP_BOX, { reports12: [-100, -88, 8, 26] });
EXT.prop.rosette12 = (side, o, t) => {   // Newest Hire: a pleated rosette with two ribbon tails
  ctx.save(); ctx.translate(0, -40); ctx.lineJoin = 'round';
  ctx.fillStyle = '#ff7ac8'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, 14); ctx.lineTo(-24, 58); ctx.lineTo(-12, 52); ctx.lineTo(-2, 66); ctx.lineTo(4, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 14); ctx.lineTo(24, 58); ctx.lineTo(12, 52); ctx.lineTo(2, 66); ctx.lineTo(-4, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 10; i++) { ctx.save(); ctx.rotate(i / 10 * TAU); ctx.fillStyle = i % 2 ? '#ffd60a' : '#ff7ac8'; ctx.beginPath(); ctx.ellipse(0, -24, 10, 24, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); ctx.stroke();
  text('NEW', 0, 1, { size: 14, font: 'Bangers', weight: 400, fill: '#c1121f', spacing: 1 });
  ctx.restore();
};
Object.assign(PROP_BOX, { rosette12: [-40, -112, 40, 72] });
EXT.prop.donut12 = (side, o, t) => {   // the donut Strawberry takes off the plate: origin at its centre
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#e8a06a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 36, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff7ac8'; ctx.beginPath(); ctx.ellipse(0, -3, 33, 27, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c9a26a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe135'; for (const [x, y] of [[-18, -12], [14, -16], [-6, -22], [22, 4], [-22, 8]]) ctx.fillRect(x, y, 5, 3);
  ctx.restore();
};
Object.assign(PROP_BOX, { donut12: [-40, -36, 40, 36] });
EXT.prop.gong12 = (side, o, t) => {   // the gong: a brass disc with a rim, rings and a boss, origin at its centre (r 96 units, scaled by the caller)
  const R = 96, sw = t > GONG_T() ? Math.sin(t * 38) * Math.exp(-(t - GONG_T()) * 3) : 0;
  ctx.save(); ctx.scale(1 + .035 * sw, 1 - .02 * Math.abs(sw));
  ctx.fillStyle = grad(-R, -R, R, R, [[0, '#f8e09a'], [.5, '#c8922e'], [1, '#6b4a14']]); ctx.strokeStyle = '#4a3010'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,50,10,.45)'; ctx.lineWidth = 3; for (const r of [R * .78, R * .56]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = grad(-22, -22, 22, 22, [[0, '#fff3c0'], [1, '#a57420']]); ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a3010'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.beginPath(); ctx.ellipse(-R * .42, -R * .4, R * .2, R * .1, -.6, 0, TAU); ctx.fill();
  ctx.restore();
};
EXT.prop.pizzaTrophy12 = (side, o, t) => {   // Most Reports Filed: a gold pizza slice on a stem and a plate, origin at the base centre
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, 3, 56, 11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b6862a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-52, -14, 104, 16, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff8dc'; rr(-42, -12, 84, 11, 3); ctx.fill();
  text('MOST REPORTS FILED', 0, -6, { size: 10, font: 'Bangers', weight: 400, fill: '#6a0c3a', spacing: .5 });
  ctx.fillStyle = '#c99a3a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-9, -64, 18, 52, 5); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-70, -122); ctx.quadraticCurveTo(0, -158, 70, -122); ctx.lineTo(0, -44); ctx.closePath();
  ctx.fillStyle = grad(-70, -150, 70, -40, [[0, '#ffe98a'], [1, '#d99a1c']]); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#b8651a'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(-70, -122); ctx.quadraticCurveTo(0, -158, 70, -122); ctx.stroke();
  ctx.fillStyle = '#c1121f'; for (const [x, y, r] of [[0, -100, 9], [-28, -108, 7], [24, -104, 8], [-2, -76, 6]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-44, -100); ctx.lineTo(-30, -126); ctx.stroke();
  ctx.restore();
};
EXT.acc.sash12 = (o, k, t, layer) => {   // the Administrator's sash over the chest: STAFF ENGAGEMENT
  if (layer !== 'front') return;
  const x0 = -k.rx * .7, y0 = k.ry * .08, x1 = k.rx * .62, y1 = k.ry * .72, L = Math.hypot(x1 - x0, y1 - y0);
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(Math.atan2(y1 - y0, x1 - x0));
  ctx.fillStyle = '#e8336f'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-6, -13, L + 12, 26, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(-4, -9, L + 8, 2); ctx.fillRect(-4, 7, L + 8, 2);
  text('STAFF ENGAGEMENT', L / 2, 1, { size: 15, font: 'Bangers', weight: 400, fill: '#fff8dc', spacing: 2 });
  ctx.restore();
};

// ---- the room shell: floor, walls, ceiling and the back wall (window, banner, door, clock, certificate); drawn first
function roomShell(lt) {
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#efe2c3', wain: '#4e8d95', floorA: '#d9c39b', floorB: '#a58d69', ceil: '#efe9da', fog: '#c4b08f', fogAmt: .22, tile: 120, bright: 1.02, rail: 110 });
  backWindow(ZB, { x0: WIN.x0, x1: WIN.x1, y0: WIN.y0, y1: WIN.y1, sky: ['#8ccaf0', '#fff1cf'], mull: 2, beam: '255,226,160', beamA: .16, beamLen: 900, beamDx: -200,
    draw: f => { const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(fx0 + w * .3, fy1 + h * .3, w * .16, h * .05, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(fx0 + w * .66, fy1 + h * .2, w * .12, h * .04, 0, 0, TAU); ctx.fill();
      V2.glow(fx0 + w * .8, fy1 + h * .14, h * .6, '255,240,200', .6, 'screen', .3);
      ctx.fillStyle = '#c9b48a'; ctx.fillRect(fx0, fy0 - h * .12, w, h * .12); } });
  { const { x0, x1, y1 } = DOOR;   // the sliding door, glass at the top
    onZ(ZB, x0 - 14, x1 + 14, 0, y1 + 14, '#e8dccb', 'rgba(25,16,30,.6)', 2.4);
    onZ(ZB, x0, x1, 0, y1, '#c9b89c', 'rgba(25,16,30,.6)', 2);
    onZ(ZB, x0 + 16, x1 - 16, 210, y1 - 22, 'rgba(255,236,186,.85)', 'rgba(25,16,30,.4)', 1.6); }
  banner12(lt);
  { const [cx, cy] = p2(CLOCK.x, CLOCK.y, ZB - 4), R = kz(ZB) * CLOCK.r * .82, ticks = [0, .5, 1].filter(d => lt >= bs('silence') + d).length;
    wallClock(CLOCK.x, CLOCK.y, ZB - 4, 1, 52, 4, CLOCK.r);
    const sa = .2 + ticks * (TAU / 60);   // the second hand steps on each tick of the silence
    ctx.save(); ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = Math.max(1.4, 2 * kz(ZB)); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - Math.sin(sa) * R * .2, cy + Math.cos(sa) * R * .2); ctx.lineTo(cx + Math.sin(sa) * R, cy - Math.cos(sa) * R); ctx.stroke(); ctx.restore(); }
  certSet(lt);
  ceilingLamp(-200, 900, CH, 1, '255,240,210', 110, 170); ceilingLamp(170, 900, CH, 1, '255,240,210', 110, 170); ceilingLamp(-10, 1560, CH, 1, '255,240,210', 110, 170);
}
function certSet(lt) {   // the framed certificate, hung at the back right; it fades in at the sting (the Administrator's ATTENDED, UNDER PROTEST)
  const a = seg(lt, SEAT_T(), SEAT_T() + .34);
  if (a <= 0) return;
  const Z = ZB - 4, [cx, cy] = p2((CERT.x0 + CERT.x1) / 2, (CERT.y0 + CERT.y1) / 2, Z), k = kz(Z), w = (CERT.x1 - CERT.x0) * k, h = (CERT.y1 - CERT.y0) * k;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy); ctx.scale(lerp(.96, 1, a), lerp(.96, 1, a));
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14 * k; ctx.shadowOffsetY = 6 * k;
  ctx.fillStyle = '#5a3a1e'; rr(-w / 2 - 10 * k, -h / 2 - 10 * k, w + 20 * k, h + 20 * k, 6); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fff8e6'; rr(-w / 2, -h / 2, w, h, 4); ctx.fill();
  ctx.strokeStyle = '#c99a2e'; ctx.lineWidth = 3; rr(-w / 2 + 8 * k, -h / 2 + 8 * k, w - 16 * k, h - 16 * k, 4); ctx.stroke();
  text('CERTIFICATE', 0, -h * .33, { size: 12 * k, font: 'Nunito', weight: 900, fill: '#7a5a2a', spacing: 1, maxW: w * .8 });
  text('STRAWBERRY', 0, -h * .1, { size: 24 * k, font: 'Bangers', weight: 400, fill: '#1d1a22', spacing: 1, maxW: w * .8 });
  text('ATTENDED', 0, h * .12, { size: 30 * k, font: 'Bangers', weight: 400, fill: '#c1121f', spacing: 1, maxW: w * .8 });
  ctx.save(); ctx.rotate(-.1); ctx.strokeStyle = 'rgba(193,18,31,.9)'; ctx.lineWidth = 4 * k; rr(-w * .38, h * .25 - 17 * k, w * .76, 34 * k, 6); ctx.stroke();
  text('UNDER PROTEST', 0, h * .25, { size: 16 * k, font: 'Bangers', weight: 400, fill: 'rgba(193,18,31,.9)', spacing: 1, maxW: w * .7 }); ctx.restore();
  ctx.restore();
}

// ---- the set pieces that stand in the room: each has a front depth (z) and is drawn in the same far-to-near order as the cast
function fridgeSet() {
  box3({ x0: FRIDGE.x0, x1: FRIDGE.x1, y1: FRIDGE.h, z0: FRIDGE.z0, z1: FRIDGE.z1, color: '#e9eef2', top: '#f4f7fa', front: '#f4f7fa', side: '#c9d2d9' });
  onZ(FRIDGE.z0, 452, 504, 300, 352, '#ffe066', 'rgba(25,16,30,.55)', 1.6);
  const [nx, ny] = p2(478, 326, FRIDGE.z0), k = kz(FRIDGE.z0); text('TO SHARE', nx, ny, { size: 13 * k, font: 'Bangers', weight: 400, fill: '#2a1a0a', spacing: 1 });
}
function counterSet() {   // the counter along the right, the microwave on it
  box3({ x0: COUNTER.x0, x1: COUNTER.x1, y1: COUNTER.h, z0: COUNTER.z0, z1: COUNTER.z1, color: '#c9d3d3', top: '#55606a', front: '#b9c4c6', side: '#98a6a8' });
  microwave(380, 1700, { on: 0, display: '4:52' });
}
function tableSet(lt, takenDonut) {   // the long table on the left: the plate of donuts, the reports with their bookmarks, two cups
  table3(TABLE.x, TABLE.z, { w: TABLE.w, d: TABLE.d, h: TABLE.h, color: '#c9a26a' });
  const top = TABLE.h + 16;
  discTop(PLATE[0], top, PLATE[1], PLATE_R, PLATE_R, '#fbfbf6', 'rgba(60,50,40,.35)', 2);
  DONUTS.forEach(([X, Z], i) => { if (!(takenDonut && i === 2)) donutTop(X, top, Z); });
  for (let i = 0; i < 5; i++) { const y = top + i * 3.2, X = -456, Z = 1480; poly([p2(X - 26, y, Z - 33), p2(X + 26, y, Z - 33), p2(X + 26, y, Z + 33), p2(X - 26, y, Z + 33)], i % 2 ? '#fbf6e6' : '#fffdf6', 'rgba(40,30,30,.55)', 1.4); }
  [['#ff4f6d', 0], ['#ffd23a', 1], ['#4aa8ff', 2], ['#58c85a', 3]].forEach(([c, col]) => { const [x, y] = p2(-436 - col * 10, top + 10, 1513 + col * 2); ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillRect(x - 3, y - 14, 6, 20); ctx.strokeRect(x - 3, y - 14, 6, 20); });
  for (const [X, Z] of [[-438, 1330], [-360, 1575]]) box3({ x0: X - 13, x1: X + 13, y0: top, y1: top + 34, z0: Z - 13, z1: Z + 13, color: '#fbf9f2', top: '#5a3a24', front: '#ece6d8', side: '#d8d0c0' });
}
function discTop(X, Y, Z, rx, rz, fill, stroke, lw = 2) {   // a flat ellipse on a horizontal plane (table top, plate)
  const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; pts.push(p2(X + Math.cos(a) * rx, Y, Z + Math.sin(a) * rz)); }
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function donutTop(X, Y, Z) {   // a donut seen from above on the plate: pink frosting, a hole, sprinkles
  discTop(X, Y, Z, 19, 15, '#e8a06a', 'rgba(60,30,20,.5)', 1.4);
  discTop(X, Y + .5, Z, 16, 12, '#ff7ac8');
  discTop(X, Y + .8, Z, 6, 4.8, '#c9a26a');
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + X * .1, rr2 = 11; const [sx, sy] = p2(X + Math.cos(a) * rr2, Y + 1, Z + Math.sin(a) * rr2 * .8); ctx.fillStyle = ['#ffd60a', '#50a5ff', '#5ae682', '#ffffff'][i % 4]; ctx.fillRect(sx - 2, sy - 1, 4, 2); }
}
function podiumSet(lt) {   // the lectern, its drawer, and the trophy on top
  box3({ x0: PODIUM.x - 40, x1: PODIUM.x + 40, y0: 0, y1: PODIUM.h, z0: PODIUM.z - 40, z1: PODIUM.z + 40, color: '#7a5532', top: '#8d6b45', front: '#654427', side: '#4f3520' });
  onZ(PODIUM.z - 40, PODIUM.x - 32, PODIUM.x + 32, 26, 84, '#5b3d24', 'rgba(25,16,30,.6)', 2);
  onZ(PODIUM.z - 40, PODIUM.x - 8, PODIUM.x + 8, 50, 58, '#e9c34c', 'rgba(25,16,30,.6)', 1.6);
  const [x, y] = p2(PODIUM.x, PODIUM.h, PODIUM.z), k = kz(PODIUM.z) * .8;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); EXT.prop.pizzaTrophy12(1, null, lt); ctx.restore();
}
function gongSet(lt) {   // the gong on its frame, by the window side
  const k = kz(GONG.z), [cx, cy] = p2(GONG.x, GONG.y, GONG.z);
  ctx.strokeStyle = '#3a2a22'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, 9 * k);
  for (const X of [GONG.x - 55, GONG.x + 55]) { const a = p2(X, 0, GONG.z), b = p2(X, 430, GONG.z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  const t0 = p2(GONG.x - 55, 430, GONG.z), t1 = p2(GONG.x + 55, 430, GONG.z); ctx.beginPath(); ctx.moveTo(t0[0], t0[1]); ctx.lineTo(t1[0], t1[1]); ctx.stroke();
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); EXT.prop.gong12(1, null, lt); ctx.restore();
}
function setPieces(lt, takenDonut) {   // { z: front depth, run } for everything in the room that is not the room shell or a character
  return [
    { z: BUNCH[0][1] + 40, run: () => balloonBunch(BUNCH[0][0], BUNCH[0][1], lt, 0, calm(lt)) },
    { z: FRIDGE.z0, run: fridgeSet },
    { z: COUNTER.z0, run: counterSet },
    { z: TABLE.z + 1, run: () => tableSet(lt, takenDonut) },        // sorted by the table's middle: its right side is behind Strawberry at the front and in front of her at the back
    { z: PODIUM.z + 1, run: () => podiumSet(lt) },
    { z: GONG.z, run: () => gongSet(lt) },
    { z: 1820, run: () => { if (lt >= be('end') + .1) { const u = easeOut(seg(lt, be('end') + .1, be('end') + .6)); balloon3(-60 + 10 * u, 300 + 160 * u, 1820, BCOL[5]); } } },   // one lets go and drifts up in the tail
  ];
}

// ---- the cast: each character's options for the frame, with its depth
function cast(lt) {
  const b = bs, items = [], add = (z, o, extra = {}) => items.push(Object.assign({ z, o }, extra));
  // the Administrator: s 1.22, the sash and the nametag; his right hand holds the mallet, his left the report, then he points
  const admB = at(MEL[0], MEL[1], 1.22);
  const admExpr = lt < b('a3') ? 'happy' : lt < b('gong') ? 'smug' : lt < b('a5') ? 'happy' : lt < b('a6') ? 'smug' : lt < b('s2') ? 'happy' : lt < b('a8') ? 'shock' : lt < 28.2 ? 'chill' : 'happy';
  const lArm = vtrack([[0, [.28, .25]], [6.2, [.28, .25]], [7.0, [.7, .95], 'io'], [12.6, [.7, .95]], [12.9, [1.5, .05], 'io'], [14.2, [1.5, .05]], [14.9, [2.8, .2], 'io'], [15.5, [1.5, .05], 'io'], [22.7, [1.5, .05]], [23.5, [.9, .3], 'io'], [25.2, [1.25, -1.75], 'io'], [26.8, [.28, .25], 'io'], [27.6, [1.25, -1.75], 'io'], [29.0, [.28, .25], 'io']]);
  const rArm = vtrack([[0, [.7, .95]], [11.3, [.7, .95]], [11.62, [2.9, .12], 'io'], [11.86, [1.85, .3], 'out'], [12.3, [.9, .5], 'io'], [13.2, [.7, .95], 'io']]);
  const mel = melon(Object.assign({}, admB, { acc: ['suit', 'nametag9', 'sash12'], expr: admExpr,
    look: lt < b('a4') ? [-.6, 0] : lt < b('a6') ? [-.8, -.1] : lt < b('a8') ? [-.35, 0] : [-.3, 0],
    arms: { l: lArm(lt), r: rArm(lt) }, hold: Object.assign({ r: 'mallet12' }, lt >= 6.9 && lt < 12.8 ? { l: 'report12' } : {}),
    lid: lt >= b('gong') + .72 && lt < b('gong') + .9 ? .9 : undefined,
    lift: lt > GONG_T() && lt < GONG_T() + .3 ? 4 * Math.sin((lt - GONG_T()) / .3 * Math.PI) : 0 }));
  add(MEL[1], mel, { key: 'mel' });
  // Lemon: flat; the stack in his left hand, in front of him, lowering an inch in the silence
  const lemB = at(LEM[0], LEM[1]);
  const lemArm = vtrack([[0, [.1, .05]], [be('silence') - 1.6, [.1, .05]], [bs('silence') + .4, [.14, .1], 'io']]);   // the stack hangs at his side; it drops an inch in the silence
  const lem = lemon(Object.assign({}, lemB, { expr: lt > bs('l1') && lt < bs('l1') + 2.2 ? 'chill' : 'neutral', look: lt < 6.6 ? [.2, 0] : [.5, 0],
    acc: ['readers', 'lanyard7'], hold: { l: 'reports12' }, arms: { l: lemArm(lt), r: 'rest' },
    lid: lt >= bs('silence') + .1 && lt < bs('silence') + .9 ? .35 : undefined }));
  add(LEM[1], lem, { key: 'lem' });
  // Mango: warm and loud, the work-wife; her hand goes to her mouth at "She said it."
  const mngB = at(MNG[0], MNG[1]), mK = KD('mango');
  const mngExpr = lt < 9.7 ? 'happy' : lt < 10.5 ? 'shock' : lt < b('gong') ? 'sour' : lt < 15.4 ? 'happy' : lt < b('s2') ? 'hopeful' : lt < 27.6 ? 'shock' : lt < 29.1 ? 'smug' : 'happy';
  const mngMouth = lt >= 26.7 && lt < 27.7 ? { l: [-mK.rx * .24, mK.mouthY + 8] } : undefined;
  const mngHop = [bs('gong') + .02].reduce((m, h) => { const k = (lt - h) / .3; return k > 0 && k < 1 ? Math.max(m, Math.sin(k * Math.PI) * 44 * mngB.s) : m; }, 0);
  const mngArm = lt < 1.2 ? 'up' : lt < 9.7 ? 'cheer' : lt < 10.5 ? 'up' : 'rest';
  const mng = mango(Object.assign({}, mngB, { acc: ['badge7', 'gaitbelt7', 'keys7'], expr: mngExpr,
    look: lt >= 9.7 && lt < 10.5 ? [.7, 0] : lt < 15 ? [.4, -.2] : lt < 26 ? [-.5, -.1] : [.1, -.2],
    arms: mngMouth ? { l: 'hold', r: 'rest' } : { l: mngArm, r: lt >= 9.7 && lt < 10.5 ? 'hips' : mngArm }, grip: mngMouth, hand: mngMouth ? { l: 'flat' } : undefined,
    lift: mngHop + (lt >= 12.8 && lt < 15 ? 6 * Math.abs(Math.sin(lt * 8)) : 0) }));
  add(MNG[1], mng, { key: 'mng' });
  // Mrs. Cranberry, in her wheelchair at the back right, behind the counter: clapping, then startled at the gong and at the No
  const crB = at(CRN[0], CRN[1]);
  const crJump = [bs('gong') + .02, bs('s2') + .05].reduce((m, h) => { const k = (lt - h) / .25; return k > 0 && k < 1 ? Math.max(m, Math.sin(k * Math.PI) * 34 * crB.s) : m; }, 0);
  const cr = cran({ x: crB.x, y: crB.y - 118 * crB.s, s: crB.s, noLegs: true, noShadow: true, look: [-.7, 0], lift: crJump,
    expr: lt < b('gong') ? 'happy' : lt < b('s2') + .5 ? 'shock' : 'happy', arms: { l: lt < 1.2 ? 'up' : 'rest', r: lt < 1.2 ? 'up' : 'rest' } });
  add(CRN[1] + 70, cr, { pre: () => S7.wheelchairBack(crB.x, crB.y, crB.s), post: () => S7.wheelchairFront(crB.x, crB.y, crB.s) });
  // Clementine: hopeful at the back with the rosette; walks up for the Newest Hire award; "Sure!", bouncing
  const clmPath = route([[0, CLM0[0], CLM0[1]], [12.7, CLM0[0], CLM0[1]], [13.4, -150, 1800, 'io'], [14.2, -200, 1640, 'io'], [14.9, CLM1[0], CLM1[1], 'io'], [1e3, CLM1[0], CLM1[1]]]);
  const [clmX, clmZ] = clmPath(lt), clmQ = at(clmX, clmZ);
  const clmLift = [bs('c2') + .02, bs('c2') + .24].reduce((m, h) => { const k = (lt - h) / .2; return k > 0 && k < 1 ? Math.max(m, Math.sin(k * Math.PI) * 38 * clmQ.s) : m; }, 0);
  const clmO = person(clem, clmPath, lt, { acc: ['steth', 'pricetag', 'badge7'], badgeText: 'NEW', expr: 'happy', transit: lt >= 12.7 && lt < 14.95,
    look: lt < 12.7 ? [.1, 0] : [-.6, -.1], hold: { r: 'rosette12' },
    arms: { l: lt < 1.2 ? 'up' : (lt < 12.7 ? 'cheer' : 'rest'), r: lt < 1.2 ? 'up' : (lt < 12.8 ? 'rest' : 'up') },
    lift: clmLift + (lt >= 1.2 && lt < 12.7 ? 5 * Math.abs(Math.sin(lt * 9)) : 0) });
  add(clmZ, clmO, { key: 'clm' });
  // Strawberry: at the back on the far left, behind the table; then forward round the table; the donut; and out on the left
  const strPath = route([[0, STR0[0], STR0[1]], [19.9, STR0[0], STR0[1]], [20.9, -270, 1820, 'io'], [21.6, STR1[0], STR1[1], 'io'], [EXIT_T(), STR1[0], STR1[1]],
    [EXIT_T() + .42, -272, 1080, 'out'], [EXIT_T() + 1.3, STROUT[0], STROUT[1], 'io'], [1e3, STROUT[0], STROUT[1]]]);
  const [strX, strZ] = strPath(lt), strQ = at(strX, strZ);
  const strQL = Object.assign({}, strQ, { lift: -11.8 * strQ.s });   // A11.straw lifts her body by 11.8 px a unit of scale
  // her hand hangs at her left side (it follows her on the walk); at the plate it reaches the donut, then returns to her side
  const follow = [strX - 80, 100, strZ];
  let hv;
  if (lt < bs('s4') + .02) hv = follow;
  else if (lt < RELEASE_T()) hv = vtrack([[bs('s4') + .02, follow], [bs('s4') + .26, TAKE, 'io'], [bs('s4') + .6, UP, 'io'], [bs('s4') + .9, UP],
    [bs('s4') + 1.16, TAKE, 'io'], [bs('s4') + 1.2, TAKE]])(lt);
  else { const k = easeIO(seg(lt, RELEASE_T(), RELEASE_T() + .3)); hv = [0, 1, 2].map(i => TAKE[i] + (follow[i] - TAKE[i]) * k); }
  const gL = gripAt(strQL, 'straw', hv[0], hv[1], hv[2]);
  const holdingDonut = lt >= bs('s4') + .25 && lt < RELEASE_T();
  const lookDonut = lt >= bs('s4') + .3 && lt < bs('s4') + .95;
  const strExpr = lt < bs('s1') ? 'chill' : lt < bs('s1') + 1.0 ? 'sour' : lt < 21.6 ? 'dead' : lt < bs('s4') + .9 ? 'chill' : lt < EXIT_T() + .2 ? 'sour' : 'chill';
  const strO = person(straw, strPath, lt, { lid: lt < 18.7 ? .3 : .5, look: lookDonut ? [-.4, .6] : lt < 23.1 ? [.35, 0] : [.2, 0],
    expr: strExpr, arms: { l: 'hold', r: 'rest' }, grip: { l: gL }, hand: { l: holdingDonut ? 'grip' : 'open' }, hold: holdingDonut ? { l: 'donut12' } : undefined,
    transit: lt > EXIT_T() - .1 });
  add(strZ, strO, { key: 'str' });
  // the background residents: clapping at the open and at the Newest Hire award (drawn soft, unaudited)
  const bgArm = lt < 1.2 || (lt >= 12.8 && lt < 15.4) ? 'up' : 'rest';
  const bgA = at(BGB[0], BGB[1]);
  add(BGB[1], A7.banana({ x: bgA.x, y: bgA.y, s: bgA.s, who: null, expr: 'happy', arms: { l: bgArm, r: bgArm }, look: [.4, 0] }), { bg: true });
  return { items, mel, lem, mng, clm: clmO, str: strO };
}

// ---- the shots
function shot(lt) {
  const b = bs;
  if (lt < b('a1') - .03) return 'open';
  if (lt < b('l1') - .03) return 'two';
  if (lt < b('a2') - .03) return 'cuL';
  if (lt < REP_T() - .03) return 'two';
  if (lt < b('m1') - .03) return 'rep';
  if (lt < b('a3') - .03) return 'cuM';
  if (lt < b('gong') - .03) return 'two';
  if (lt < b('a4') - .03) return 'gong';
  if (lt < b('c2') - .03) return 'walk';
  if (lt < b('a5') - .03) return 'cuC2';
  if (lt < b('s1') - .03) return 'back';
  if (lt < b('a6') - .03) return 'cuS1';
  if (lt < b('s2') - .03) return 'ask';
  if (lt < b('silence') - .03) return 'no';
  if (lt < b('a7') - .03) return 'still';
  if (lt < b('m2') - .03) return 'two2';
  if (lt < b('a8') - .03) return 'cuM2';
  if (lt < b('s4') - .03) return 'cuA';
  if (lt < be('end') - .02) return 'table';
  return 'tail';
}
const SUBJ = { cuL: 'lem', cuM: 'mng', cuC2: 'clm', cuS1: 'str', no: 'str', still: 'str', cuM2: 'mng', cuA: 'mel', ask: 'str', table: 'str' };

window.__EP12_SCENES = window.__EP12_SCENES || {};
window.__EP12_SCENES.award = {
  shot,
  cam(lt) {
    V2.setCam(CAMP);
    const sh = shot(lt), c = cast(lt), F = o => faceC(o), fz = (o, z, up = 110) => faceZoom(o, z, up);
    const mid = (a, b2) => [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2];
    CAM.shake = lt >= GONG_T() && lt < GONG_T() + .5 ? 14 * (1 - (lt - GONG_T()) / .5) : 0;
    if (sh === 'open') zoomTo(560, 940, 1.08);
    else if (sh === 'two') { const q = mid(F(c.mel), F(c.lem)); zoomTo(q[0], q[1] + 60, 1.22); }
    else if (sh === 'cuL') fz(c.lem, 2.2);
    else if (sh === 'rep') zoomTo(540, 905, 1.0);
    else if (sh === 'cuM') fz(c.mng, 2.2);
    else if (sh === 'gong') { const q = mid(F(c.mel), p2(GONG.x, GONG.y, GONG.z)); zoomTo(q[0] - 40, q[1] + 60, 1.2); }   // a little room on the left for his report as his arm comes up
    else if (sh === 'walk') { const q = mid(F(c.mel), F(c.clm)); zoomTo(q[0] + 40, q[1] + 60, 1.12); }
    else if (sh === 'cuC2') { const f = F(c.clm); zoomTo(f[0] + 70, f[1] + 130 / 2.6, 2.6); }   // her raised rosette stays in frame
    else if (sh === 'back') zoomTo(520, 880, 1.02);
    else if (sh === 'cuS1') fz(c.str, 2.2, 130);
    else if (sh === 'ask') fz(c.str, lerp(1.3, 2.2, easeIO(seg(lt, 21.8, 23.05))), 130);
    else if (sh === 'no') fz(c.str, 2.2, 130);
    else if (sh === 'still') { const k = easeIO(seg(lt, bs('silence'), be('silence'))), f = F(c.str), fy = f[1] + 130 / 2.2; zoomTo(lerp(f[0], 560, k), lerp(fy, 900, k), lerp(2.2, 1.05, k)); }
    else if (sh === 'two2') { const q = mid(F(c.mel), F(c.str)); zoomTo(q[0] + 20, q[1] + 40, 1.05); }
    else if (sh === 'cuM2') fz(c.mng, 2.0, 120);
    else if (sh === 'cuA') { const f = F(c.mel); zoomTo(f[0] + 60, f[1] + 150 / 2.0, 2.0); }   // his mallet arm stays in frame
    else if (sh === 'table') zoomTo(lerp(330, 300, seg(lt, be('s4') - .2, be('end'))), 880, 1.35);
    else if (sh === 'tail') { const k = easeIO(seg(lt, be('end') - .02, be('end') + .9)); zoomTo(lerp(300, 560, k), lerp(880, 900, k), lerp(1.35, 1.0, k)); }
  },
  draw(lt) {
    const sh = shot(lt);
    if (sh === 'rep') { insRep(lt - REP_T()); return; }
    const takenDonut = lt >= bs('s4') + .25 && lt < RELEASE_T(), subj = SUBJ[sh] || null;
    V2.setLight({ key: [-.35, -.8], keyColor: '#fff1cf', keyA: .26, rim: '#ffd9a0', rimA: .3, shadow: '#3a2a22', shadowA: .32, amb: '#ffe9c4', ambA: .1, bounce: '#ffd7a0', bounceA: .14 });
    V2.opts.reflect = false;
    V2.dof(subj ? 4 : 0, () => roomShell(lt));
    V2.addLight({ x: 300, y: 330, r: 1000, color: '255,220,160', a: .24 });
    const since = lt - GONG_T();
    if (since > 0 && since < .6) { const [gx, gy] = p2(GONG.x, GONG.y, GONG.z); V2.ring(gx, gy, since / .9, { color: '255,236,170', r0: 60, r1: 1100, lw: 30, alpha: .7, bloom: .6 }); }
    V2.dust(40, 380, 1000, 1500, lt, { n: 26, alpha: .3, color: '255,236,190' });
    // which characters are sharp this frame: in a close-up only the subject; in a wide, a character is sharp when all of it is in the frame
    // and no nearer sharp character stands over its face (a face under a nearer body is drawn soft, the way a neighbour is)
    const c = cast(lt), closeUp = CAM.z > 1.7;
    const toScreen = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
    const bodyBox = o => { const k = KD(o.kind), s = o.s, leg = o.noLegs ? 0 : (k.leg || 90), rx = k.rx * 1.1 * s, top = o.y - (o.lift || 0) - (leg + k.ry * 1.9) * s;
      const [x0, y0] = toScreen(o.x - rx, top), [x1, y1] = toScreen(o.x + rx, o.y + 12 * s); return [x0, y0, x1, y1]; };
    const faceBox = o => { const k = KD(o.kind), s = o.s, [fx, fy] = faceC(o), fw = k.rx * .55 * s, fh = k.ry * .5 * s;
      const [x0, y0] = toScreen(fx - fw, fy - fh), [x1, y1] = toScreen(fx + fw, fy + fh); return [x0, y0, x1, y1]; };
    const overlaps = (a, b) => !(a[2] <= b[0] || a[0] >= b[2] || a[3] <= b[1] || a[1] >= b[3]);
    const covers = [];   // the sharp bodies (and their props, generously) of the nearer characters drawn sharp so far
    for (const e of c.items.filter(q => !q.bg).slice().sort((p, q) => p.z - q.z)) {
      const bx = bodyBox(e.o), fb = faceBox(e.o);
      const ext = e.o.hold ? 140 * e.o.s * CAM.z : 0;   // a held prop can reach past the body on the right (screen px): keep that in the frame too
      let sharp = bx[0] >= 40 && bx[2] + ext <= W - 40 && bx[1] >= 16 && bx[3] <= H - 16 && (!closeUp || e.key === subj);
      if (sharp && covers.some(b => overlaps(b, fb))) sharp = false;
      e.sharp = sharp;
      if (sharp) covers.push([bx[0] - 20, bx[1] - 40, bx[2] + 40, bx[3]]);
    }
    const runCast = e => () => {
      if (e.pre) e.pre();
      if (e.bg || !e.sharp) V2.dof(6, () => drawBg(e.o)); else drawChar(e.o);
      if (e.post) e.post(); };
    const sets = setPieces(lt, takenDonut).map(p => ({ z: p.z, run: p.run })).sort((p, q) => q.z - p.z);
    const castList = c.items.map(e => ({ z: e.z, run: runCast(e), key: e.key, sharp: e.sharp }));
    if (closeUp) {
      // a close-up: the set and the other characters are behind, the subject is drawn last so nothing stands over her face
      for (const it of sets) it.run();
      castList.filter(q => !(q.sharp && q.key === subj)).sort((p, q) => q.z - p.z).forEach(q => q.run());
      castList.filter(q => q.sharp && q.key === subj).forEach(q => q.run());
    } else {
      const list = sets.concat(castList);
      list.sort((p, q) => q.z - p.z);
      for (const it of list) it.run();
    }
  },
  fx(lt) {
    const still = seg(lt, bs('s2') + .1, bs('silence') + .2) * (1 - seg(lt, be('silence') + .4, be('silence') + 1.3));
    const flash = lt >= GONG_T() + .1 ? Math.exp(-(lt - GONG_T() - .1) * 9) : 0;
    return { bloom: .42 + .55 * flash, vignette: .42, grain: .04, contrast: .12, sat: .05 - .05 * still,
      tint: [['#ffd38a', .13, 'soft-light'], ['#1c1230', .07, 'multiply'], ['#7fb6ff', .1 * still, 'soft-light']],
      fade: seg(lt, CUR.dur - .3, CUR.dur - .02), fadeColor: '12,8,20' };
  },
  blur(lt) {
    if (shot(lt) !== shot(lt - .04) || shot(lt) !== shot(lt + .04)) return 1;   // a hard cut: no double exposure
    if (lt > GONG_T() && lt < GONG_T() + .5) return 6;                          // the gong shakes
    if (lt > bs('a6') + .1 && lt < bs('a6') + 1.9) return 4;                    // Strawberry walks forward
    if (lt > EXIT_T() && lt < EXIT_T() + 1.2) return 4;                         // and out
    return 2;
  },
  over(lt) {
    sfxWord(lt, GONG_T() + .02, 'BONNNG!', 600, 400, { fill: '#ffe135', size: 150, hold: .9, rot: -.06 });
  },
};

// ---- the insert: page one of the report, the bookmark in Lemon's handwriting (blue ink on a yellow sticky)
function insRep(lt) {   // lt: seconds since the insert began
  const k0 = easeBack(clamp(lt / .3)), y0 = lerp(700, 0, k0), sc = 1 + .025 * clamp(lt / 1.6);
  ctx.fillStyle = grad(0, -400, 0, H + 400, [[0, '#f4e7c9'], [1, '#c6a77a']]); ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.save(); ctx.translate(540, 830 + y0); ctx.rotate(-.03); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#fffdf6'; rr(-390, -500, 780, 1000, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(40,60,110,.22)'; ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.moveTo(-350, -150 + i * 46); ctx.lineTo(350, -150 + i * 46); ctx.stroke(); }
  text('FRUIT BOWL REHAB & NURSING', -350, -440, { size: 44, font: 'Bangers', weight: 400, fill: '#1d4fd8', align: 'left', spacing: 1.5 });
  text('SHIFT REPORT   3 TO 11', -350, -392, { size: 26, fill: '#333', align: 'left', spacing: 1 });
  ctx.strokeStyle = '#c1121f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-350, -370); ctx.lineTo(350, -370); ctx.stroke();
  ['Rm 4: call light on since 3:10.', 'Resolved by 3:11. Resolved means I walked past it.', 'Rm 9: Mr. Banana slipped (incident 47).', 'Med pass: 14 of 22. Other 8 are in the report.', 'Pizza: received. Pizza: funded.', 'Staff on shift: 3 of 9. One is per diem.']
    .forEach((s, i) => text(s, -350, -300 + i * 58, { size: 27, fill: '#222', align: 'left', weight: 900 }));
  text('L. Lemon, RN', -330, 400, { size: 34, font: 'Nunito', weight: 900, italic: true, fill: '#1d4fd8', align: 'left' });
  ctx.strokeStyle = '#1d4fd8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-340, 418); ctx.bezierCurveTo(-240, 380, -160, 440, -60, 404); ctx.stroke();
  ctx.save(); ctx.translate(290, -380); ctx.rotate(.07);   // the bookmark: a yellow sticky over the corner
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ffe066'; ctx.strokeStyle = 'rgba(120,90,20,.6)'; ctx.lineWidth = 2; rr(-130, -110, 260, 220, 8); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ['GOOD CUFF:', 'SUPPLY CLOSET,', '2ND SHELF,', 'BEHIND', 'Q WORD SIGN'].forEach((s, i) => text(s, 0, -66 + i * 38, { size: 27, font: 'Nunito', weight: 900, italic: true, fill: '#1d4fd8', spacing: .3 }));
  ctx.restore();
  ctx.restore();
  reg('overlay', [150, 330 + y0, 1000, 1330 + y0], { id: 'rep-paper', group: 'rep', transit: lt < .3 });
}
})();
