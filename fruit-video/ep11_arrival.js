'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scene: arrival (2:58 PM, THE FRONT DOOR).
 *
 * The mirror of Episode 9's arrival. The same lobby, dressed for a party (red carpet and stanchions, a banner that now reads WELCOME BACK STRAWBERY,
 * one R short, balloons), but the guest of honour is Strawberry, back as per diem, and the one watching with somebody else's badge on her chest is
 * Clementine. Every position is a world coordinate: X right, Z forward (V2.at).
 *
 * Shot list (scene-local seconds; the names are what shotOf() returns):
 *   wide  0.00-1.65   the lobby dressed for a party, the committee waiting, two balloons pop (0.35, 0.60), Clementine and Mango come in from the right
 *   cuCM  1.65-3.13   Clementine and Mango (hard cut to a two-shot): "Is it somebody's birthday?" She scans the room
 *   cuM   3.13-4.25   Mango points up; on "Strawberry" the camera whips across to the banner, which holds until the cut
 *   cuC   4.25-5.29   Clementine: "Who's Strawberry?"
 *   badge 5.29-6.93   two-shot pushing in to a macro of the badge (STRAWBERRY struck out, NEW in marker): "You're wearing her badge."
 *   doorA 6.93-8.20   low angle on the sliding doors, drumroll shake, the backlit silhouette steps through
 *   doorW 8.20-8.76   the hit: horn, two poppers, rays, TA-DAAA!, flash, glitter
 *   doorS 8.76-9.76   low tracking dolly-back: she walks lit toward the lens through falling confetti
 *   cuA   9.76-10.73  the Administrator: "Welcome back to Fruit Bowl!" (Strawberry's deadpan face behind his basket)
 *   two   10.73-13.05 the two of them: basket, parking pass (flies to her badge), lunch (the bag crosses his hands)
 *   cuS   13.05-14.04 Strawberry: "Cool."
 *   cuP   14.04-15.59 Persimmon: "Welcome to the club." (shades up, iced-coffee toast)
 *   pen   15.59-17.71 two-shot, the pen between them (out of his pocket, laid flat), "That's my pen."
 *   cuA2  17.71-18.82 the Administrator shrugs: "It was a gift."
 *   cuS2  18.82-20.21 Strawberry takes the pen: "To share." and raises it like a hand
 *   cuA3  20.21-21.70 the Administrator's face as "Is there a raise?" lands (shock, one drop of sweat)
 *   two2  21.70-23.21 "You're per diem. You're in the other budget." with the OTHER BUDGET stamp slammed on "budget"
 *   xcuS  23.21-24.73 slow push-in on Strawberry: "I know. I'm in it."
 *   sting 24.73-26.20 hold wide, everybody on the carpet, a balloon drifts off, Clementine lifts her badge and tilts her head on each trombone note
 */
(() => { if (!window.TIMELINE_EP11) return;
const { person, zoomTo, faceZoom, drawBg, inB, faceC, localOf, localToScreen, pathDist } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S6 = window.S6;
const { mango } = A7, persimmon = A9.persimmon, melon = A9.melon, straw = A11.straw, clem = A11.clem;
const { p2, poly, quad3, grad, radial } = V2;
const { box3, onZ, kz, shell, backWindow, ceilingLamp, plant3, wallClock } = S6;

// ---- helpers -------------------------------------------------------------------------------------------------------------------------------------------
// scene-relative time of a spoken word, from the recorded line's word timings
const wordT = (id, word) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return l.s - CUR.start + w[1]; };
// a route through keyed positions [t, X, Z, ease]
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// a scalar track through keyed values [t, v], eased between keys
const trk = (lt, keys, ease = easeIO) => {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], ease(seg(lt, a[0], b[0]))); }
  return keys[keys.length - 1][1];
};
const nbr = o => V2.dof(6, () => drawBg(o));
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const lerpA2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const pulse = (lt, t0, rate = 9) => lt > t0 ? Math.exp(-(lt - t0) * rate) : 0;   // a jolt that dies away
// a point in scene coordinates -> where it lands on the screen with the current 2D camera
const toScr = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
// an onomatopoeia that pops in and fades (as in ep9.js)
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
// aim a hand: blend from a resting grip (local coordinates) toward a point in scene coordinates (the hand stops short of full reach)
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}

// ---- props and accessories (their names carry the episode number so they never collide with another builder's) -----------------------------------
// a wicker gift basket with cellophane, a red bow and fruit (copied from ep9_arrival.js). Origin: bottom centre; about 190 units tall
function drawBasket(t) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#c8924e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(44, 0); ctx.lineTo(54, -56); ctx.lineTo(-54, -56); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(100,56,14,.55)'; ctx.lineWidth = 3; for (const y of [-14, -28, -42]) { ctx.beginPath(); ctx.moveTo(-60, y); ctx.lineTo(60, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,230,170,.35)'; for (let r = 0; r < 4; r++) for (let x = -50 + (r % 2) * 9; x < 56; x += 18) { ctx.beginPath(); ctx.moveTo(x, -r * 14); ctx.lineTo(x, -r * 14 - 12); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = '#a8702e'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-58, -66, 116, 13, 5); ctx.fill(); ctx.stroke();
  const fr = (x, y, r, c1, c2) => { ctx.fillStyle = V2.grad(x - r, y - r, x + r, y + r, [[0, c1], [1, c2]]); ell(x, y, r, r * .96); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(x - r * .35, y - r * .4, r * .22, r * .14); ctx.fill(); };
  fr(-28, -78, 19, '#ff7a86', '#d4182c'); fr(16, -82, 18, '#ffc15a', '#f07c10'); fr(-2, -96, 15, '#e6f58a', '#8ab824');
  ctx.strokeStyle = '#6b8a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-28, -97); ctx.quadraticCurveTo(-26, -106, -20, -108); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.fillStyle = '#f7d84a'; ctx.beginPath(); ctx.moveTo(36, -68); ctx.quadraticCurveTo(54, -84, 50, -110); ctx.quadraticCurveTo(40, -90, 28, -80); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(232,244,255,.34)'; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-54, -62); ctx.bezierCurveTo(-72, -96, -42, -128, -12, -150); ctx.lineTo(12, -150); ctx.bezierCurveTo(42, -128, 72, -96, 54, -62); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 30, -70); ctx.quadraticCurveTo(s * 34, -110, s * 8, -146); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -150); ctx.lineTo(i * 9, -176 - (i % 2 ? 0 : 8)); ctx.stroke(); }
  ctx.fillStyle = '#e8283a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
  ctx.save(); ctx.translate(0, -150); for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * .5); ell(s * 24, 0, 24, 12); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-24, 36); ctx.lineTo(-12, 32); ctx.lineTo(-6, 42); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(22, 34); ctx.lineTo(12, 30); ctx.lineTo(8, 40); ctx.lineTo(-3, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8101f'; ell(0, 0, 9, 9); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(-50, -62); ctx.bezierCurveTo(-58, -200, 58, -200, 50, -62); ctx.stroke();
  ctx.strokeStyle = '#c8924e'; ctx.lineWidth = 8; ctx.stroke();
  const tw = .5 + .5 * Math.sin(t * 4.2); ctx.fillStyle = `rgba(255,255,255,${.35 + .6 * tw})`; ctx.save(); ctx.translate(-26, -112); ctx.rotate(.4); ctx.fillRect(-1.8, -8 * tw - 3, 3.6, 16 * tw + 6); ctx.fillRect(-8 * tw - 3, -1.8, 16 * tw + 6, 3.6); ctx.restore();
  ctx.restore();
}
// the welcome lunch: a brown paper takeout bag on twisted-paper handles with a smiley, LUNCH on it and a lidded cup with a straw peeking out. Origin: the top of the handles
function drawBag() {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const body = () => { ctx.beginPath(); ctx.moveTo(-34, 40); ctx.lineTo(34, 40); ctx.lineTo(37, 116); ctx.lineTo(-37, 116); ctx.closePath(); };
  ctx.fillStyle = V2.grad(-37, 0, 37, 0, [[0, '#d9aa6d'], [.55, '#cf9d5f'], [1, '#b17f44']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; body(); ctx.fill(); ctx.stroke();
  ctx.save(); body(); ctx.clip(); ctx.fillStyle = 'rgba(90,50,10,.22)'; ctx.fillRect(18, 40, 22, 80); ctx.strokeStyle = 'rgba(90,50,10,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, 40); ctx.lineTo(20, 116); ctx.stroke();
  ctx.fillStyle = 'rgba(255,235,190,.4)'; ctx.fillRect(-37, 40, 74, 10); ctx.restore();
  // the cup behind the handles: lid, red cup with a white band, a striped straw
  ctx.fillStyle = '#e8283a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, 16); ctx.lineTo(26, 16); ctx.lineTo(23, 52); ctx.lineTo(1, 52); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(-1, 28, 26, 9); ctx.fillStyle = '#f4f4f8'; rr(-4, 11, 32, 8, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 7.4; ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(18, -14); ctx.lineTo(25, -22); ctx.stroke();
  ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 4.2; ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4.2; ctx.setLineDash([5, 7]); ctx.stroke(); ctx.setLineDash([]);
  // the handles
  ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-18, 42); ctx.bezierCurveTo(-20, -12, 20, -12, 18, 42); ctx.stroke();
  ctx.strokeStyle = '#b98a50'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = 'rgba(255,235,190,.5)'; ctx.lineWidth = 1.6; ctx.stroke();
  // the print: a smiley and LUNCH in marker red
  ctx.fillStyle = '#ffe135'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ell(-6, 76, 15, 15); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ell(-11, 72, 2.2, 2.8); ctx.fill(); ell(-1, 72, 2.2, 2.8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(-6, 77, 8, .2, PI - .2); ctx.stroke();
  text('LUNCH', -2, 101, { size: 21, font: 'Bangers', weight: 400, fill: '#c1121f', spacing: 2, maxW: 62 });
  ctx.restore();
}
// Strawberry's pen, the very pen of Episode 9 (blue barrel, white back end, silver clip) with a bitten end and a strip of masking tape that says BERRY.
// Drawn lying along +x with the tip to the right; the hand holds it at the origin; o.penAng turns it
function drawPen(t, shine) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = V2.grad(0, -9, 0, 9, [[0, '#4a8cf0'], [.5, '#2a6fdb'], [1, '#1f55ad']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-62, -9, 108, 18, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eef1f7'; rr(-62, -9, 32, 18, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1c4fa8'; rr(12, -9, 30, 18, 5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(10,20,60,.5)'; ctx.lineWidth = 1.6; for (const x of [18, 25, 32]) { ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x, 8); ctx.stroke(); }
  ctx.fillStyle = '#c0c6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(45, -8); ctx.lineTo(66, -2.4); ctx.lineTo(72, 0); ctx.lineTo(66, 2.4); ctx.lineTo(45, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0c6cf'; rr(-52, -15, 34, 7, 3); ctx.fill(); ctx.stroke();
  // the chewed back end: three little bites out of the white cap
  ctx.fillStyle = '#8a8f98'; for (const [x, y, r] of [[-61, -4, 3.6], [-59, 3, 3.2], [-62, 8, 2.8]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  // the tape
  ctx.save(); ctx.translate(-4, 0); ctx.rotate(-.04); ctx.fillStyle = '#efe3b8'; ctx.strokeStyle = 'rgba(70,50,20,.6)'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-17, -11); ctx.lineTo(19, -10); ctx.lineTo(20, 10); ctx.lineTo(-18, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
  text('BERRY', 1, 1, { size: 10.5, fill: '#1d1a22', weight: 900, spacing: .6, maxW: 34 }); ctx.restore();
  if (shine > 0) { const tw = .5 + .5 * Math.sin(t * 6); ctx.fillStyle = `rgba(255,255,255,${shine * (.45 + .55 * tw)})`; ctx.save(); ctx.translate(-26, -10); ctx.rotate(.4); ctx.fillRect(-1.6, -8 * tw - 4, 3.2, 16 * tw + 8); ctx.fillRect(-8 * tw - 4, -1.6, 16 * tw + 8, 3.2); ctx.restore(); }
  ctx.restore();
}
// a party popper: a striped paper cone held by its point, a dark mouth with streamers poking out and a pull string. Origin: the hand (the point of the cone)
function drawPopper(fired, t) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(fired ? 14 : 6, 18, fired ? 8 : 0, fired ? 34 : 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(26, -78); ctx.lineTo(-26, -78); ctx.closePath(); ctx.save(); ctx.clip();
  ctx.fillStyle = '#ffd23a'; ctx.fillRect(-30, -82, 60, 86);
  ctx.fillStyle = '#e8283a'; for (let i = -4; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-30, i * 22 - 8); ctx.lineTo(30, i * 22 - 36); ctx.lineTo(30, i * 22 - 18); ctx.lineTo(-30, i * 22 + 10); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = V2.grad(-26, 0, 26, 0, [[0, 'rgba(255,255,255,.28)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(60,20,20,.32)']]); ctx.fillRect(-30, -82, 60, 86); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(26, -78); ctx.lineTo(-26, -78); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#3a1a2a'; ell(0, -78, 26, 7.5); ctx.fill(); ctx.stroke();
  if (!fired) { for (const [x, c, h] of [[-12, '#4aa8ff', 14], [-2, '#ff7ad9', 20], [9, '#58c85a', 16], [16, '#ffd23a', 11]]) { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, -80); ctx.quadraticCurveTo(x + 5, -80 - h * .6, x - 3 + 4 * Math.sin(t * 5 + x), -80 - h); ctx.stroke(); } }
  ctx.restore();
}
Object.assign(PROP_BOX, { basket11: [-38, -8, 38, 122] });   // the bag, the pen and the popper register their own (moving, turning) footprints
EXT.prop.basket11 = (side, o, t) => { ctx.save(); ctx.rotate(.04 * Math.sin(t * 2.4) + (o.basketRot || 0)); ctx.scale(.62, .62); ctx.translate(0, 186); drawBasket(t); ctx.restore(); };
EXT.prop.bag11 = (side, o, t) => {   // o.bagOff: while it crosses from his left hand to his right it is drawn that far from the hand holding it, closing to nothing
  ctx.save(); if (o.bagOff && side > 0) ctx.translate(o.bagOff[0], o.bagOff[1]); ctx.rotate(.035 * Math.sin(t * 2.1 + 1) + (o.bagRot || 0)); ctx.scale(.72, .72); drawBag();
  regLocal('prop', -38, -26, 38, 118, { id: 'bag11', owner: o.id || o.kind, transit: o.transit }); ctx.restore();
};
EXT.prop.passcard11 = (side, o, t) => {   // ep9's parking pass, growing from the size of the corner showing in his pocket to full size as it is drawn out
  ctx.save(); const k = o.passScale ?? 1; ctx.scale(k, k); EXT.prop.passcard9(side, o, t); regLocal('prop', -36, -76, 36, 6, { id: 'passcard11', owner: o.id || o.kind, transit: o.transit }); ctx.restore();
};
EXT.prop.pen11 = (side, o, t) => {
  ctx.save(); ctx.rotate(o.penAng ?? -.3); ctx.scale(1.2 * (o.penScale ?? 1), 1.2 * (o.penScale ?? 1)); drawPen(t, o.penShine || 0);
  // its footprint for the audit: four boxes along its axis (the bounding box of a tilted pen is mostly empty air)
  for (let i = 0; i < 4; i++) regLocal('prop', -64 + i * 34.5, -15, -64 + (i + 1) * 34.5, 12, { id: 'pen11', owner: o.id || o.kind, transit: o.transit });
  ctx.restore();
};
EXT.prop.popper11 = (side, o, t) => { ctx.save(); ctx.rotate((o.popAng ?? 0) * (side < 0 ? -1 : 1)); drawPopper(o.popFired, t); regLocal('prop', -28, -100, 28, 8, { id: 'popper11', owner: o.id || o.kind, transit: o.transit }); ctx.restore(); };
// the parking pass in the Administrator's breast pocket (a blue edge and a P), and his pen beside it: each leaves the pocket when o.pocketPass / o.pocketPen go false
EXT.acc.pocket11 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(k.rx * .72, k.ry * .62); ctx.rotate(.04);
  if (o.pocketPass !== false) { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; rr(-14, -22, 24, 26, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a5ac8'; rr(-14, -22, 24, 7, 3); ctx.fill(); ctx.strokeStyle = INK; rr(-14, -22, 24, 7, 3); ctx.stroke(); text('P', -2, -7, { size: 10, font: 'Bangers', weight: 400, fill: '#2a5ac8' }); }
  if (o.pocketPen !== false) { ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.save(); ctx.rotate(.12); rr(10, -30, 7, 36, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#eef1f7'; rr(10, -30, 7, 11, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c0c6cf'; rr(16, -27, 2.6, 17, 1); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#1b3050'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(24, 0); ctx.lineTo(23, 15); ctx.lineTo(-19, 15); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-17, 4); ctx.lineTo(21, 4); ctx.stroke();
  ctx.restore();
};
// Strawberry's old staff badge on Clementine's chest: her name struck out in red marker and NEW scrawled across the photo in blue. o.badgeLift (0..1) holds it up toward her, o.badgeSwing is a tap
const BADGE = { w: 64, h: 86 };
function drawBadgeCard(t) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = '#c0c6cf'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-9, -8, 18, 13, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.lineWidth = 3.2; rr(-BADGE.w / 2, 4, BADGE.w, BADGE.h, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-BADGE.w / 2, 4, BADGE.w, 17, [7, 7, 0, 0]); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.2; rr(-BADGE.w / 2, 4, BADGE.w, BADGE.h, 7); ctx.stroke();
  text('STAFF', 0, 13.5, { size: 10.5, fill: '#fff', weight: 900, spacing: 1.6 });
  // the photo: Strawberry herself, a little tired, behind the marker
  ctx.save(); rr(-25, 26, 50, 38, 4); ctx.fillStyle = '#ffd9de'; ctx.fill(); ctx.clip();
  ctx.fillStyle = V2.grad(0, 32, 0, 66, [[0, '#ff7a86'], [1, '#d4182c']]); ctx.beginPath(); ctx.moveTo(0, 66); ctx.bezierCurveTo(-17, 62, -22, 44, -18, 36); ctx.bezierCurveTo(-8, 30, 8, 30, 18, 36); ctx.bezierCurveTo(22, 44, 17, 62, 0, 66); ctx.fill();
  ctx.fillStyle = '#4a8a2a'; ctx.beginPath(); ctx.moveTo(-14, 36); ctx.lineTo(-6, 28); ctx.lineTo(0, 34); ctx.lineTo(6, 28); ctx.lineTo(14, 36); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ell(-7, 46, 4.4, 5); ctx.fill(); ell(7, 46, 4.4, 5); ctx.fill(); ctx.fillStyle = INK; ell(-7, 47, 2, 2.4); ctx.fill(); ell(7, 47, 2, 2.4); ctx.fill();
  ctx.fillStyle = 'rgba(90,20,30,.55)'; ctx.fillRect(-12, 42, 10, 2.4); ctx.fillRect(2, 42, 10, 2.4); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-5, 55); ctx.lineTo(5, 55); ctx.stroke();
  ctx.restore(); ctx.strokeStyle = 'rgba(30,20,40,.55)'; ctx.lineWidth = 1.6; rr(-25, 26, 50, 38, 4); ctx.stroke();
  // NEW in blue marker, big and a little crooked, with two underlines
  ctx.save(); ctx.translate(3, 46); ctx.rotate(-.13); ctx.strokeStyle = '#1f4fd8'; ctx.lineWidth = 6.4;
  ctx.beginPath(); ctx.moveTo(-27, 9); ctx.lineTo(-26, -9); ctx.lineTo(-13, 9); ctx.lineTo(-12, -9);
  ctx.moveTo(8, -9); ctx.lineTo(-3, -9); ctx.lineTo(-3, 9); ctx.lineTo(9, 9); ctx.moveTo(-3, 0); ctx.lineTo(6, 0);
  ctx.moveTo(14, -9); ctx.lineTo(18, 9); ctx.lineTo(23, -4); ctx.lineTo(28, 9); ctx.lineTo(32, -9); ctx.stroke();
  ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(-30, 15); ctx.lineTo(34, 13); ctx.moveTo(-26, 19); ctx.lineTo(28, 18.4); ctx.stroke(); ctx.restore();
  // the name, printed, and the red strike through it
  text('STRAWBERRY', 0, 74, { size: 8.2, fill: INK, weight: 900, spacing: 0, maxW: 58 });
  ctx.strokeStyle = '#e0182d'; ctx.lineWidth = 3.8; ctx.beginPath(); ctx.moveTo(-30, 75.5); ctx.lineTo(-10, 72.6); ctx.lineTo(8, 75.2); ctx.lineTo(31, 72); ctx.stroke();
  ctx.fillStyle = INK; for (let i = 0; i < 9; i++) { const w = 1.4 + (i * 7 % 3) * .8; ctx.fillRect(-23 + i * 5.6, 82, w, 5); }
  ctx.restore();
}
EXT.acc.badge11 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const lift = o.badgeLift || 0;
  ctx.save(); ctx.translate(lerp(k.rx * .69, k.rx * .5, lift), lerp(k.ry * .3, k.ry * .08, lift)); ctx.rotate(.06 * Math.sin(t * 2) + (o.badgeSwing || 0) + lift * -.35);
  drawBadgeCard(t); ctx.restore();
};
// the free-flying parking pass (the card of ep9's passcard9, 72 x 52), drawn upright around its centre
function drawPassCard() {
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-36, -26, 72, 52, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a5ac8'; rr(-36, -26, 72, 14, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a5ac8'; ell(-12, 6, 13, 13); ctx.fill(); text('P', -12, 7, { size: 20, font: 'Bangers', weight: 400, fill: '#fff' });
  ctx.fillStyle = INK; rr(6, -2, 24, 5, 2); ctx.fill(); rr(6, 8, 18, 5, 2); ctx.fill();
  ctx.fillStyle = '#c9d2f0'; ell(0, -20, 4, 4); ctx.fill(); ctx.restore();
}

// ---- the lobby ---------------------------------------------------------------------------------------------------------------------------------------
const CARPET_HW = 118;
function carpet() {
  const zN = V2.P.cz + 70, zF = 1748, a = p2(-CARPET_HW, 0, zF), c = p2(CARPET_HW, 0, zN);
  quad3([-CARPET_HW, 0, zF], [CARPET_HW, 0, zF], [CARPET_HW, 0, zN], [-CARPET_HW, 0, zN], grad(0, a[1], 0, Math.max(c[1], H), [[0, '#d42a3c'], [.5, '#b3152c'], [1, '#8a0f22']]), 'rgba(40,0,10,.55)', 2);
  for (const s of [-1, 1]) { quad3([s * (CARPET_HW - 13), .4, zF], [s * CARPET_HW, .4, zF], [s * CARPET_HW, .4, zN], [s * (CARPET_HW - 13), .4, zN], '#e9c34c'); quad3([s * (CARPET_HW - 22), .4, zF], [s * (CARPET_HW - 19), .4, zF], [s * (CARPET_HW - 19), .4, zN], [s * (CARPET_HW - 22), .4, zN], 'rgba(233,195,76,.8)'); }
  ctx.strokeStyle = 'rgba(70,0,14,.28)'; ctx.lineWidth = 2;
  for (let z = 1700; z > zN; z -= 90) { const l = p2(-CARPET_HW + 24, .4, z), r = p2(CARPET_HW - 24, .4, z); ctx.lineWidth = Math.max(1, 2.4 * kz(z)); ctx.beginPath(); ctx.moveTo(...l); ctx.lineTo(...r); ctx.stroke(); }
  for (const s of [-1, 1]) quad3([s * CARPET_HW, 0, zF], [s * (CARPET_HW + 12), 0, zF], [s * (CARPET_HW + 12), 0, zN], [s * CARPET_HW, 0, zN], 'rgba(60,20,20,.16)');
}
function stanchion(X, Z) {
  const k = kz(Z), [x, y] = p2(X, 0, Z);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(30,10,10,.25)'; ell(8, 4, 34, 9); ctx.fill();
  const g = V2.grad(-14, 0, 14, 0, [[0, '#a8801c'], [.4, '#ffe58a'], [1, '#8a6410']]);
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(30,18,6,.75)'; ctx.lineWidth = 2.6;
  ell(0, -4, 28, 10); ctx.fill(); ctx.stroke();
  rr(-5.5, -96, 11, 92, 3); ctx.fill(); ctx.stroke();
  ell(0, -100, 12, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(-4, -104, 3.5, 3.5); ctx.fill();
  ctx.restore();
}
function rope(X, Z0, Z1) {
  const a = p2(X, 90, Z0), b = p2(X, 90, Z1), m = p2(X, 66, (Z0 + Z1) / 2), k = kz((Z0 + Z1) / 2);
  ctx.save(); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2, ...b);
  ctx.strokeStyle = 'rgba(30,0,8,.8)'; ctx.lineWidth = 9 * k + 2; ctx.stroke(); ctx.strokeStyle = '#c4162f'; ctx.lineWidth = 7 * k; ctx.stroke(); ctx.restore();
}
// balloon clusters: six on strings from a gold weight. pops[i] is the scene time balloon i bursts (a ring, scraps and a recoil in its neighbours)
const BAL_COLS = ['#ff4f6d', '#ffd23a', '#4aa8ff', '#58c85a', '#c25bd6', '#ff9f1c'];
const balPos = (Xc, Zc, t, seed, i, pops, lt) => {
  let recoil = 0;
  if (pops) for (let j = 0; j < 6; j++) if (j !== i && pops[j] != null && lt > pops[j]) recoil += Math.exp(-(lt - pops[j]) * 4.5) * Math.sin((lt - pops[j]) * 26 + j) * 15;
  const bob = Math.sin(t * 1.5 + i * 1.3 + seed) * 13, sway = Math.sin(t * 1.05 + i * .9 + seed) * 9 + recoil;
  return { x: Xc + (i - 2.5) * 36 + sway, y: 330 + (i % 3) * 58 + (i === 1 || i === 4 ? 40 : 0) + bob, z: Zc + (i % 2) * 20 };
};
function balloons(Xc, Zc, t, seed, pops, lt, esc) {
  const k = kz(Zc), w = p2(Xc, 0, Zc);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(w[0], w[1]); ctx.scale(k, k); rr(-22, -26, 44, 26, 5); ctx.fill(); ctx.stroke(); ctx.restore();
  const list = [];
  for (let i = 0; i < 6; i++) list.push(Object.assign({ i }, balPos(Xc, Zc, t, seed, i, pops, lt)));
  list.sort((a, b) => b.z - a.z);
  for (const b of list) {
    const free = esc && b.i === esc.i && lt >= esc.t0;
    if (free) { const kf = lt - esc.t0; b.x += -38 * kf + 24 * Math.sin(kf * 2.1); b.y = Math.min(640, b.y + 150 * kf); b.z -= 20 * kf; }   // it slipped its string: it drifts up and away toward the ceiling
    const q = p2(b.x, b.y, b.z), kk = kz(b.z), R = 62 * kk, pt = pops && pops[b.i] != null ? lt - pops[b.i] : -1;
    if (pt >= 0) {   // burst: a quick ring and five scraps of rubber, then a limp string
      if (pt < .5) {
        const f = pt / .5; ctx.save(); ctx.globalAlpha = 1 - f;
        ctx.strokeStyle = BAL_COLS[b.i]; ctx.lineWidth = 7 * (1 - f) + 2; ctx.beginPath(); ctx.arc(q[0], q[1], R * (.9 + .9 * easeOut(f)), 0, TAU); ctx.stroke();
        for (let s = 0; s < 5; s++) { const a = s / 5 * TAU + b.i; ctx.save(); ctx.translate(q[0] + Math.cos(a) * R * (.8 + 1.3 * easeOut(f)), q[1] + Math.sin(a) * R * (.8 + 1.3 * easeOut(f)) + 140 * f * f); ctx.rotate(a + f * 5); ctx.fillStyle = BAL_COLS[b.i]; ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -R * .22); ctx.lineTo(R * .2, R * .12); ctx.lineTo(-R * .16, R * .1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kk); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * k); ctx.quadraticCurveTo(lerp(w[0], q[0], .35) + 10 * Math.sin(t + b.i), lerp(w[1], q[1], .35) + 30, lerp(w[0], q[0], .6), lerp(w[1], q[1], .62) + 70 * kk); ctx.stroke();
      continue;
    }
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kk); ctx.beginPath();
    if (free) { const sw = Math.sin(t * 3 + b.i) * 9 * kk; ctx.moveTo(q[0], q[1] + R * 1.06); ctx.bezierCurveTo(q[0] + sw * 2, q[1] + R * 1.5, q[0] - sw * 2, q[1] + R * 1.9, q[0] + sw, q[1] + R * 2.3); }   // the loose string trails below it
    else { ctx.moveTo(w[0], w[1] - 24 * k); ctx.quadraticCurveTo(lerp(w[0], q[0], .5) + 16 * Math.sin(t + b.i), lerp(w[1], q[1], .6), q[0], q[1] + R * 1.12); } ctx.stroke();
    ctx.fillStyle = V2.radial(q[0] - R * .3, q[1] - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, BAL_COLS[b.i]], [1, V2.rgba(V2.mix(BAL_COLS[b.i], '#2a1030', .45), 1)]]);
    ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = Math.max(2, 2.6 * kk); ell(q[0], q[1], R * .82, R); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BAL_COLS[b.i]; ctx.beginPath(); ctx.moveTo(q[0] - 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0] + 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0], q[1] + R * 1.0 + 11 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(q[0] - R * .36, q[1] - R * .46, R * .14, R * .26, -.5); ctx.fill();
  }
  ctx.restore();
}
// the banner: one R short, exactly as the cake was. The letters are sized to fit the cloth, so nothing is ever squeezed
const BANNER = 'WELCOME BACK STRAWBERY';
function banner(t) {
  const Z = 1250, X0 = -470, X1 = 470, Y0 = 604, Y1 = 690, k = kz(Z), wv = x => 5 * k * Math.sin(x * .009 + t * 1.8);
  const tl = p2(X0, Y1, Z), tr = p2(X1, Y1, Z), bl = p2(X0, Y0, Z), br = p2(X1, Y0, Z);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(50,40,40,.7)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, X0], [tr, X1]]) { const c = p2(X, 720, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = V2.grad(0, tl[1], 0, bl[1], [[0, '#e93a8a'], [1, '#b0185f']]); ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = Math.max(4, 8 * k);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0)); for (let i = 1; i <= 24; i++) ctx.lineTo(lerp(tl[0], tr[0], i / 24), tl[1] + wv(i * 36)); for (let i = 24; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / 24), bl[1] + wv(i * 36 + 90)); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.save(); ctx.translate((tl[0] + tr[0]) / 2, (tl[1] + bl[1]) / 2 + 1.5 * k);
  { const sz = 74 * k; ctx.font = `400 ${sz}px Bangers`; ctx.letterSpacing = '3px'; const w0 = ctx.measureText(BANNER).width; ctx.letterSpacing = '0px'; const maxW = (tr[0] - tl[0]) * .92;
    text(BANNER, 0, 0, { size: w0 > maxW ? sz * maxW / w0 : sz, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 7 * k, stroke: '#6a0c3a', spacing: 3, maxW: maxW * 1.02 }); }
  ctx.restore();
  for (let i = 0; i < 11; i++) { const u = (i + .5) / 11, px = lerp(bl[0], br[0], u), py = bl[1] + wv(u * 24 * 36 + 90) + 3; ctx.fillStyle = ['#ffd23a', '#4aa8ff', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 16 * k, py); ctx.lineTo(px + 16 * k, py); ctx.lineTo(px, py + 34 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

// a copy of Episode 6's lobby (S6.lobby) in bright daylight, dressed for a party (the Episode 9 version with the Episode 11 banner and a different car at the kerb)
function lobby11(o = {}) {
  const zb = 1750, hw = 640, ch = 720, sun = o.sun ?? 1, doorOpen = o.doorOpen ?? 0, P = V2.P, t = o.t ?? 0;
  shell({ zb, hw, ch, wall: '#f5ead2', wain: '#7a5a46', floorA: '#ead8b0', floorB: '#bfa070', fog: '#f1e4c6', fogAmt: .26, tile: 160, bright: 1.05, rail: 120, ceil: '#f7eedc' });
  const dx0 = -300, dx1 = 300, dy1 = 520;
  backWindow(zb, { x0: dx0, x1: dx1, y0: 0, y1: dy1, sky: ['#6fbaf8', '#f2faff'], mull: 4, sill: false, beam: '255,240,200', beamA: 0, curtains: false,
    draw: f => {
      const [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
      ctx.fillStyle = grad(0, fy1, 0, fy0, [[0, '#6fbaf8'], [.55, '#cfeaff'], [1, '#fffbe8']]); ctx.fillRect(fx0, fy1, w, h);
      ctx.fillStyle = '#4b8a42'; ctx.beginPath(); ctx.moveTo(fx0, fy0 - h * .26); for (let i = 0; i <= 16; i++) ctx.lineTo(fx0 + w * i / 16, fy0 - h * (.26 + .1 * Math.sin(i * 1.9) + .05 * Math.sin(i * 4.1))); ctx.lineTo(fx1, fy0); ctx.lineTo(fx0, fy0); ctx.fill();
      ctx.fillStyle = '#4a4650'; ctx.fillRect(fx0, fy0 - h * .12, w, h * .12);
      // the car at the kerb is a SHIFTGO: a black sedan with the violet dome on its roof (the app that took her back); the other one is a blue hatchback
      { const cx = fx0 + w * .1, cy = fy0 - h * .22, cw = w * .3, ch2 = h * .1;
        ctx.fillStyle = '#1b1824'; rr(cx, cy, cw, ch2, h * .035); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + cw * .2, cy + 1); ctx.lineTo(cx + cw * .3, cy - ch2 * .62); ctx.lineTo(cx + cw * .72, cy - ch2 * .62); ctx.lineTo(cx + cw * .84, cy + 1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7f9cc8'; ctx.beginPath(); ctx.moveTo(cx + cw * .26, cy - ch2 * .04); ctx.lineTo(cx + cw * .34, cy - ch2 * .52); ctx.lineTo(cx + cw * .5, cy - ch2 * .52); ctx.lineTo(cx + cw * .5, cy - ch2 * .04); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + cw * .54, cy - ch2 * .04); ctx.lineTo(cx + cw * .54, cy - ch2 * .52); ctx.lineTo(cx + cw * .7, cy - ch2 * .52); ctx.lineTo(cx + cw * .79, cy - ch2 * .04); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6c4bff'; rr(cx + cw * .44, cy - ch2 * .84, cw * .14, ch2 * .24, 3); ctx.fill();
        ctx.fillStyle = '#0d0b14'; for (const fxx of [.22, .76]) { ell(cx + cw * fxx, cy + ch2 * .96, ch2 * .34, ch2 * .34); ctx.fill(); }
        ctx.fillStyle = '#c0c6cf'; for (const fxx of [.22, .76]) { ell(cx + cw * fxx, cy + ch2 * .96, ch2 * .15, ch2 * .15); ctx.fill(); } }
      ctx.fillStyle = '#26427a'; rr(fx0 + w * .66, fy0 - h * .21, w * .24, h * .11, h * .04); ctx.fill();
      ctx.fillStyle = '#fffbe6'; ctx.beginPath(); ctx.arc(fx0 + w * .55, fy1 + h * .46, w * .085, 0, TAU); ctx.fill();
    } });
  // the glass doors slide apart; with o.glassLate the caller lays them down itself (after a figure outside has been drawn over the glare), through the returned panels()
  const panels = () => { const pw = (dx1 - dx0) / 4, shift = doorOpen * pw * 1.15;
    for (const [a2, b2] of [[dx0, dx0 + pw * 2], [dx0 + pw * 2, dx1]]) { const s2 = a2 < 0 ? -shift : shift; onZ(zb, a2 + s2, b2 + s2, 0, dy1, 'rgba(205,228,240,.16)', 'rgba(25,16,30,.55)', 3.4); } };
  if (!o.glassLate) panels();
  onZ(zb, dx0 - 40, dx1 + 40, dy1 + 4, dy1 + 74, '#6d4b38', 'rgba(25,16,30,.55)', 2.4);
  { const [sx, sy] = p2(0, dy1 + 39, zb), kk = kz(zb); ctx.fillStyle = '#f6e6c4'; ctx.font = `900 ${30 * kk}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '3px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.letterSpacing = '0px'; }
  wallClock(470, 470, zb, 1, 58, 2, 52);
  if (1500 > P.cz + 200) { plant3(-590, 1500, 1.0); plant3(590, 1550, 1.0); }
  for (let i = 0; i < 7; i++) { const x = -520 + i * 173, [px, py] = p2(x, ch - 40, zb), k2 = kz(zb); ctx.fillStyle = ['#e8193a', '#ffd23a', '#58b83a', '#4a8ae8', '#ff9f1c', '#c25bd6', '#e8193a'][i]; ctx.beginPath(); ctx.moveTo(px - 34 * k2, py); ctx.lineTo(px + 34 * k2, py); ctx.lineTo(px, py + 80 * k2); ctx.closePath(); ctx.fill(); }
  for (const z of [300, 900, 1500]) if (z > P.cz + 160) { ceilingLamp(-260, z, ch, .9, '255,240,210'); ceilingLamp(260, z, ch, .9, '255,240,210'); }   // (a lamp behind the lens is not drawn)
  // ---- the party
  carpet();
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const Z = 1650 - i * 150; if (Z < P.cz + 120) continue; if (i) rope(s * 150, Z + 150, Z); stanchion(s * 150, Z); }
  if (!o.noBanner && 1250 > P.cz + 200) { ctx.save(); ctx.globalAlpha *= o.bannerA ?? 1; banner(t); ctx.restore(); }
  balloons(-575, 1610, t, 0, o.popsL, o.lt ?? 0); balloons(575, 1610, t, 2.3, o.popsR, o.lt ?? 0, o.escape);
  if (o.floorItems) o.floorItems();
  // ---- the sun on the floor: a long bright wedge from the doors toward the camera, plus rays and a bloom at the opening
  const z0 = P.cz + 60;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const fa = p2(-300, 0, zb), fb = p2(300, 0, zb), fc2 = p2(520, 0, z0 + 200), fd = p2(-520, 0, z0 + 200);
  ctx.fillStyle = grad(0, fa[1], 0, fc2[1], [[0, `rgba(255,248,214,${.3 * sun})`], [.5, `rgba(255,244,200,${.12 * sun})`], [1, 'rgba(255,240,200,0)']]);
  ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc2); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore();
  const [bx, by] = p2(0, 240, zb), kb = kz(zb);
  V2.beam(bx, by, bx, by + 560, 560 * kb, 1100 * kb, '255,246,214', .12 * sun);
  V2.glow(bx, by, 700 * kb, '255,248,222', .26 * sun, 'screen', o.doorBloom ?? .5);
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = radial(bx, by + 100, 150, 1250, [[0, 'rgba(255,255,255,1)'], [.5, 'rgba(240,230,214,1)'], [1, 'rgba(186,166,152,1)']]); ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  return { zb, hw, ch, door: [bx, by], panels };
}

// ---- confetti ------------------------------------------------------------------------------------------------------------------------------------------
// A burst of paper from a popper's mouth at scene point (x0, y0) at time t0: thrown up and out, slowed by the air, then drifting down with a flutter until it
// lands on the carpet and stays there. Every piece is a pure function of time, so a frame never depends on an earlier one.
const CONF_COLS = ['#ffaa28', '#50a5ff', '#5ae682', '#ffcd46', '#ff4646', '#ffffff', '#ff7ad9'];
function confPiece(i, x0, y0, dir, seed, k, floorY) {
  const a = -PI / 2 + (hash(i + seed) - .5) * 1.5 + dir * .3, v = 700 + 900 * hash(i + seed + 17), tau = .42;
  const u = tau * (1 - Math.exp(-k / tau)), fall = 230 * (k - .5 * (1 - Math.exp(-k / .5)));
  return { x: x0 + Math.cos(a) * v * u + 26 * Math.sin(k * (2 + 2 * hash(i + seed + 9)) + i) * seg(k, .35, 1.2), y: y0 + Math.sin(a) * v * u + fall, fy: floorY + (hash(i + seed + 41) - .5) * 70 };
}
// pass 'air' draws the pieces still falling (over the cast), pass 'floor' the ones that have landed (under it)
function confetti(pass, lt, t0, x0, y0, dir, n, seed, floorY, size = 1) {
  const k = lt - t0; if (k < 0) return;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const p = confPiece(i, x0, y0, dir, seed, k, floorY), landed = p.y >= p.fy && k > .5;
    if (landed !== (pass === 'floor')) continue;
    ctx.save(); ctx.translate(p.x, landed ? p.fy : p.y); ctx.rotate((landed ? 3 : k) * (3 + 7 * hash(i + 2)) + i); ctx.scale(1, landed ? .28 : Math.cos(k * (5 + 5 * hash(i + 9)) + i));
    ctx.globalAlpha = landed ? .92 : 1 - seg(k, 3.2, 4);
    ctx.fillStyle = CONF_COLS[i % CONF_COLS.length]; ctx.fillRect(-8.5 * size, -5.5 * size, 17 * size, 11 * size); ctx.restore();
  }
  ctx.restore();
}
// big, soft pieces falling past the lens: screen space, blurred (the foreground of the walk). t0 is when the first one leaves the top of the frame
function lensConfetti(lt, t0, n = 26) {
  const k = lt - t0; if (k < 0 || k > 3.4) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  V2.dof(4, () => {
    for (let i = 0; i < n; i++) {
      const sz = 26 + 46 * hash(i + 71), v = 380 + 330 * hash(i + 5), x = (hash(i + 21) * 1.1 - .05) * W + 48 * Math.sin(k * (1.6 + hash(i) * 1.5) + i), y = -120 - 700 * hash(i + 3) + k * v;
      if (y < -90 || y > H + 90) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(k * (2 + 4 * hash(i + 7)) + i); ctx.scale(1, Math.cos(k * (2.4 + 2.4 * hash(i + 8)) + i) * .9 + .1); ctx.globalAlpha = .9 * (1 - seg(k, 2.8, 3.4));
      ctx.fillStyle = CONF_COLS[i % CONF_COLS.length]; ctx.fillRect(-sz / 2, -sz * .32, sz, sz * .64); ctx.restore();
    }
  });
  ctx.restore();
}
// a four-point twinkle (L is its reach in px, a its brightness)
function star(x, y, L, a, rot = 0) {
  if (L <= .5 || a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,252,230,${a})`;
  ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(L * .12, 0); ctx.lineTo(0, L); ctx.lineTo(-L * .12, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-L * .8, 0); ctx.lineTo(0, L * .1); ctx.lineTo(L * .8, 0); ctx.lineTo(0, -L * .1); ctx.closePath(); ctx.fill(); ctx.restore();
}
// a figure against the light: drawn on a scratch canvas, flooded with dark, then laid down. k is how dark (1 is a black cut-out)
const silCv = V2.mk(W, H), silCtx = silCv.getContext('2d');
function silhouette(k, fn) {
  if (k <= .01) return fn();
  const prev = ctx, m = prev.getTransform();
  silCtx.setTransform(1, 0, 0, 1, 0, 0); silCtx.globalCompositeOperation = 'source-over'; silCtx.clearRect(0, 0, W, H); silCtx.setTransform(m); ctx = silCtx;
  fn();
  silCtx.setTransform(1, 0, 0, 1, 0, 0); silCtx.globalCompositeOperation = 'source-atop'; silCtx.fillStyle = `rgba(12,8,24,${.9 * k})`; silCtx.fillRect(0, 0, W, H); silCtx.globalCompositeOperation = 'source-over';
  ctx = prev; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(silCv, 0, 0); ctx.restore();
}

// the rubber stamp that lands on "the other budget": red ink in a double border with specks and a few scratches worn out of it. Built once, off screen
let STAMP = null;
function stampArt() {
  if (STAMP) return STAMP;
  const cv = V2.mk(520, 124), c = cv.getContext('2d'), prev = ctx, RED = '#d0142c';
  ctx = c; REG.suppress++;
  c.lineJoin = 'round'; c.strokeStyle = RED; c.lineWidth = 8; rr(6, 6, 508, 112, 20); c.stroke(); c.lineWidth = 2.6; rr(18, 18, 484, 88, 12); c.stroke();
  text('OTHER BUDGET', 260, 63, { size: 68, font: 'Bangers', weight: 400, fill: RED, spacing: 4, maxW: 440 });
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.strokeStyle = '#000';
  for (let i = 0; i < 300; i++) { const h = hash(i * 1.37 + 5); c.globalAlpha = .5 + .5 * hash(i * 2.9 + 1); c.beginPath(); c.arc(hash(i * 3.1 + 7) * 520, hash(i * 5.7 + 2) * 124, .7 + 2.4 * h * h, 0, TAU); c.fill(); }
  c.globalAlpha = .85; c.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) { const x = hash(i * 7 + 3) * 520, y = hash(i * 4 + 1) * 124; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 70 * (hash(i + 9) - .5), y + 34 * (hash(i + 12) - .5)); c.stroke(); }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  REG.suppress--; ctx = prev; return STAMP = cv;
}

// ---- arm scripting -------------------------------------------------------------------------------------------------------------------------------------
// where a hand ends up in the plain 'rest' pose (local px), so a scripted arm can leave it and return to it without a jump
function armRest(o, side, t) {
  const k = KINDS[o.kind], [sx, sy] = shoulder(k, side), sc = o.armScale || 1.12, L1 = (k.arm1 || 56) * sc, L2 = (k.arm2 || 52) * sc, [a1, a2] = poseAngles('rest', t + (side > 0 ? .5 : 0));
  const ex = sx + side * Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
  return [ex + side * Math.sin(a1 + a2) * L2, ey + Math.cos(a1 + a2) * L2];
}
// a local target kept inside what the arm can reach (the audit refuses a hand beyond it)
function armClamp(o, side, g) {
  const k = KINDS[o.kind], [sx, sy] = shoulder(k, side), reach = ((k.arm1 || 56) + (k.arm2 || 52)) * (o.armScale || 1.12) * .94, dx = g[0] - sx, dy = g[1] - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d);
  return [sx + dx * f, sy + dy * f];
}
// one arm through keyed targets [[time, target], ...]. A target is a local grip [x, y], 'rest', or { s: [sceneX, sceneY] }. Outside the keys the arm keeps whatever pose it already has
function armKeys(o, side, lt, keys) {
  const key = side < 0 ? 'l' : 'r', n = keys.length;
  if (lt < keys[0][0] || lt >= keys[n - 1][0]) return;
  const res = tg => tg === 'rest' ? armRest(o, side, lt) : tg.s ? armClamp(o, side, localOf(o, tg.s[0], tg.s[1])) : armClamp(o, side, tg);
  let i = 1; while (i < n - 1 && lt >= keys[i][0]) i++;
  const a = keys[i - 1], b = keys[i], k = easeIO(seg(lt, a[0], b[0]));
  if (a[1] === 'rest' && b[1] === 'rest') return;
  const ga = res(a[1]), gb = res(b[1]);
  o.arms = o.arms || {}; o.grip = o.grip || {}; o.hand = o.hand || {}; o.arms[key] = 'hold'; o.grip[key] = [lerp(ga[0], gb[0], k), lerp(ga[1], gb[1], k)]; if (!o.hand[key]) o.hand[key] = 'open';
}
const setHand = (o, side, shape) => { o.hand = o.hand || {}; o.hand[side < 0 ? 'l' : 'r'] = shape; };
const setHold = (o, side, prop) => { o.hold = o.hold || {}; o.hold[side < 0 ? 'l' : 'r'] = prop; };
// where a popper held in the outer hand sends its paper from (scene coordinates): the mouth of the cone
const POP = { p: { g: [-100, -4], a: .08, side: -1 }, m: { g: [92, -85], a: -.2, side: 1 } };   // Persimmon's in her outer left hand (barely tilted: she stands at the edge of the frame), Mango's in her right, leaning in
const popMouth = (o, who) => { const P = POP[who], h = localToScreen(o, P.g[0], P.g[1]), th = P.a * (P.side < 0 ? -1 : 1); return [h[0] + o.s * 78 * Math.sin(th), h[1] - o.s * 78 * Math.cos(th)]; };

// ---- the scene ---------------------------------------------------------------------------------------------------------------------------------------
// marks (world X, Z). The committee stands to the left of the carpet, the two who came in to clock on to the right; Strawberry stops on the carpet between them
const MK = { adm: [-200, 985], per: [-490, 1085], cl: [322, 1060], mg: [520, 1145], sp: [80, 990] };
const PL = [-98, 74], MR = [108, 64];   // where Persimmon's left hand and Mango's right hand rest (kept in from the frame edges)
const clPath = route([[0, 760, 840], [1.5, MK.cl[0], MK.cl[1], 'io']]);
const mgPath = route([[0, 900, 940], [.2, 900, 940], [1.7, MK.mg[0], MK.mg[1], 'io']]);
// she waits outside the glass, starts walking as the doors open and arrives at her mark as the Administrator begins to list her gifts
const spPath = () => route([[0, 0, 1800], [B('door').s + .54, 0, 1800], [B('a2').s - .24, 0, MK.sp[1] + 40], [B('a2').s + .16, MK.sp[0], MK.sp[1], 'out']]);
const SHOT_ORDER = () => {
  const b = id => B(id), d = b('door');
  return [['wide', b('c1').s - .05], ['cuCM', b('m1').s - .05], ['cuM', b('c2').s - .05], ['cuC', b('m2').s - .05], ['badge', d.s - .03],
    ['doorA', d.s + 1.24], ['doorW', d.s + 1.8], ['doorS', b('a1').s + .55], ['cuA', b('a2').s - .06], ['two', b('s1').s - .05], ['cuS', b('p1').s - .05], ['cuP', b('a3').s - .05],
    ['pen', b('a4').s - .05], ['cuA2', b('s3').s - .05], ['cuS2', wordT('s4', 'raise') - .12], ['cuA3', b('a5').s + .68], ['two2', b('s5').s - .05], ['xcuS', b('sting').s - .02], ['sting', 1e9]];
};
const shotOf = lt => { let t0 = 0; for (const [n, e] of SHOT_ORDER()) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'sting', t0, t1: CUR.dur }; };
// who is crisp in each shot (everybody else is a soft neighbour, drawn out of focus and left out of the audit); BLUR is the blur on the room
const CRISP = { cuCM: ['cl', 'mg'], cuM: ['mg'], cuC: ['cl'], badge: ['cl', 'mg'], doorS: ['sp'], doorA: ['sp'], cuA: ['ad'], two: ['ad', 'sp'], cuS: ['sp'], cuP: ['pr'], pen: ['ad', 'sp'], cuA2: ['ad'], cuS2: ['sp'], cuA3: ['ad'], two2: ['ad', 'sp'], xcuS: ['sp'] };
const BLUR = { cuCM: 7, cuM: 7, cuC: 8, badge: 8, doorS: 4, cuA: 8, two: 3, cuS: 9, cuP: 9, pen: 5, cuA2: 8, cuS2: 8, cuA3: 8, two2: 3, xcuS: 10 };
const ALLC = ['pr', 'ad', 'sp', 'cl', 'mg'];
const L0 = { key: [-.35, -.8], keyColor: '#fff4dc', keyA: .26, rim: '#fff0c8', rimA: .55, shadow: '#3a2a40', shadowA: .3, bounce: '#ffe0b0', bounceA: .2, amb: '#fff6e6', ambA: .04 };

const SCENES = {};
const SC = SCENES.arrival = {
  shot: lt => shotOf(lt).n,
  cast(lt) {
    const b = id => B(id), d = b('door'), op = b('open'), a1 = b('a1'), a2 = b('a2'), s1 = b('s1'), p1 = b('p1'), a3 = b('a3'), s2 = b('s2'), a4 = b('a4'), s3 = b('s3'), s4 = b('s4'), a5 = b('a5'), s5 = b('s5'), st = b('sting'), c1 = b('c1'), m1 = b('m1'), c2 = b('c2'), m2 = b('m2');
    const T = { pop1: op.s + .35, pop2: op.s + .6, horn: d.s + 1.3, shot1: d.s + 1.35, shot2: d.s + 1.45, tromb: st.s + .1 };
    const tBirthday = wordT('c1', 'birthday'), tStraw = wordT('m1', 'strawberry'), tBadge = wordT('m2', 'badge');
    const tB = wordT('a2', 'basket'), tPass = wordT('a2', 'pass'), tL = wordT('a2', 'lunch'), hB = tB + .3, hP = tPass + .14, hL = tL + .3, dropB = hB + .5, dropBag = p1.e + .12, tSwap = hP + .24;
    const tPen = wordT('a3', 'pen'), hPen = tPen + .1, tShare = wordT('s3', 'share'), takePen = tShare + .12, tRaise = wordT('s4', 'raise');
    const spFn = spPath(), qs = V2.at(...spFn(lt)), qa = V2.at(...MK.adm), qp = V2.at(...MK.per);
    const M = [lerp(qa.x, V2.at(...MK.sp).x, .5), qa.y - 185 * qa.s];   // where a handoff happens: chest height, halfway between the two of them
    const M1 = { s: M }, M2 = { s: [M[0] + 12, M[1] + 46] }, M3 = { s: [M[0] - 32, M[1] + 96] };
    const walkEnd = a2.s + .16;
    const look = keys => { for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) return lerpA2(keys[i - 1][1], keys[i][1], sk(lt, keys[i - 1][0], keys[i][0])); return keys[keys.length - 1][1]; };

    // ---- Clementine: in from the right with Mango, flinching at the balloons, then scanning the room; she is the one wearing the badge
    const jolt = pulse(lt, T.pop1) + pulse(lt, T.pop2), shock = (lt >= T.pop1 && lt < T.pop1 + .3) || (lt >= T.pop2 && lt < T.pop2 + .3);
    const clLook = look([[0, [-.7, -.2]], [T.pop1, [-.8, -.3]], [T.pop1 + .25, [-.85, -.1]], [T.pop2, [-.85, -.1]], [T.pop2 + .25, [.85, -.1]], [c1.s, [.6, -.35]], [c1.s + .55, [-.35, -.9]], [tBirthday - .1, [-.1, -.9]], [tBirthday + .25, [.7, 0]], [m1.s + .1, [.7, 0]],
      [tStraw - .05, [-.45, -.9]], [m1.e + .1, [-.45, -.9]], [c2.s - .15, [.6, 0]], [m2.s, [.62, 0]], [m2.s + .5, [.35, .9]], [tBadge, [.3, .95]], [d.s, [.3, .95]], [d.s + .6, [0, -.2]], [T.horn, [-.2, -.25]]]);
    const clExpr = shock ? 'shock' : lt >= tBadge + .55 && lt < d.s + .4 ? 'shock' : lt >= tBadge && lt < tBadge + .55 ? 'weak' : lt >= T.horn - .3 && lt < a5.s + .6 ? 'happy' : lt >= a5.s + .6 ? 'sad' : 'hopeful';
    const blow = sk(lt, T.horn - .02, T.horn + .22) * (1 - sk(lt, T.horn + 1.0, T.horn + 1.45)), horning = lt >= d.s + .5 && lt < T.horn + 1.5;
    const lifted = sk(lt, st.s - .6, st.s + .1), tiltN = [0, .42, .84].reduce((q, o) => q + sk(lt, T.tromb + o - .03, T.tromb + o + .1), 0);
    const clRot = trk(lt, [[0, 0], [m1.s, 0], [m1.s + .4, .03], [c2.s - .05, .03], [c2.s, 0], [c2.s + .45, -.05], [m2.s, -.05], [m2.s + .5, 0]]) + (lt >= st.s - .6 ? -.02 * lifted - .025 * tiltN : 0);
    const cl = person(clem, clPath, lt, { acc: ['steth', 'pricetag', 'badge11'], look: clLook, expr: clExpr, stride: 34, lift: 14 * jolt, badgeLift: lifted,
      badgeSwing: lt > tBadge && lt < tBadge + 1.4 ? .12 * Math.sin((lt - tBadge) * 21) * Math.exp(-(lt - tBadge) * 2.6) : 0, rot: clRot,
      arms: { l: lt < 1.5 ? [.28 + .35 * Math.sin(lt * 7), .25] : 'rest', r: lt < 1.5 ? [.28 + .35 * Math.sin(lt * 7 + 2), .25] : 'rest' }, hold: {}, grip: {}, hand: {}, transit: lt < 1.6 });
    if (horning) { setHold(cl, -1, 'horn'); cl.hornBlow = blow; armKeys(cl, -1, lt, [[d.s + .5, 'rest'], [d.s + .9, [-8, 33]], [T.horn + 1.0, [-8, 33]], [T.horn + 1.45, 'rest']]); setHand(cl, -1, 'grip'); }
    if (lifted > 0) {   // at the end she holds the badge up by its clip and looks at it
      const px = lerp(KINDS.clem.rx * .69, KINDS.clem.rx * .5, lifted), py = lerp(KINDS.clem.ry * .3, KINDS.clem.ry * .08, lifted);
      armKeys(cl, 1, lt, [[st.s - .6, 'rest'], [st.s + .1, [px + 8, py + 10]], [CUR.dur + 1, [px + 8, py + 10]]]); setHand(cl, 1, 'grip');
    }
    // ---- Mango: warm, loud and deadpan today
    const mgLook = look([[0, [-.5, 0]], [m1.s, [-.6, 0]], [m1.s + .3, [-.4, -.85]], [m1.e + .1, [-.4, -.85]], [c2.s + .1, [-.7, 0]], [m2.s + .2, [-.7, .08]], [tBadge, [-.7, .4]], [d.s, [-.7, .4]], [d.s + .5, [-.4, -.1]]]);
    const mg = person(mango, mgPath, lt, { look: mgLook, expr: lt >= st.s - .1 ? 'dead' : lt >= s5.s ? 'sad' : lt >= a5.s + .6 ? 'sour' : lt >= T.shot2 - .2 && lt < a2.s ? 'happy' : 'neutral', stride: 36,
      arms: { l: lt < 1.7 ? [.28 + .35 * Math.sin(lt * 7 + 2), .25] : 'rest', r: lt < 1.7 ? 'rest' : 'hold' }, grip: lt < 1.7 ? {} : { r: MR }, hand: lt < 1.7 ? {} : { r: 'open' }, hold: {}, transit: lt < 1.9 || (lt > tStraw - .2 && lt < tStraw + .4) });
    // pointing: up at the banner on "Strawberry", then at the badge with two jabs on "badge"
    armKeys(mg, -1, lt, [[m1.s, 'rest'], [m1.s + .3, { s: [mg.x - 120 * mg.s, mg.y - 560 * mg.s] }], [c2.s - .1, { s: [mg.x - 120 * mg.s, mg.y - 560 * mg.s] }], [c2.s + .3, 'rest']]);
    if (lt >= m1.s && lt < c2.s + .3) setHand(mg, -1, 'point');
    { const bd = localToScreen(cl, 72, 77), jab = lt >= tBadge ? Math.max(0, Math.sin((lt - tBadge) * 21)) * Math.exp(-(lt - tBadge) * 1.4) : 0, off = 60 * mg.s * (1 - jab * .9);
      armKeys(mg, -1, lt, [[m2.s + .12, 'rest'], [m2.s + .5, { s: [bd[0] + off, bd[1] - 6 * mg.s] }], [d.s - .1, { s: [bd[0] + off, bd[1] - 6 * mg.s] }], [d.s + .3, 'rest']]); if (lt >= m2.s + .12 && lt < d.s + .3) setHand(mg, -1, 'point'); }
    // her popper, fired with her outer hand on the second pop and then let go of
    if (lt >= d.s + .55 && lt < T.shot2 + .72) {
      setHold(mg, 1, 'popper11'); mg.popFired = lt >= T.shot2; mg.popAng = POP.m.a + .1 * pulse(lt, T.shot2, 12);
      armKeys(mg, 1, lt, [[d.s + .55, MR], [d.s + .95, POP.m.g], [T.shot2 + .25, POP.m.g], [T.shot2 + .72, MR]]); setHand(mg, 1, 'grip');
    }
    if (lt >= a1.s - .1 && lt < a1.e + .2) { const c = .5 + .5 * Math.sin(lt * 17); mg.grip = { l: [-lerp(8, 56, c), 74], r: [lerp(8, 56, c), 74] }; mg.arms = { l: 'hold', r: 'hold' }; mg.hand = { l: 'flat', r: 'flat' }; mg.hold = {}; }   // a polite clap for the welcome

    // ---- the Administrator: gifts in both hands, a pocket with the pass and the pen, and the handoffs
    const ad = melon(Object.assign(qa, { s: qa.s * 1.14, look: look([[0, [.3, -.3]], [d.s, [.3, -.3]], [d.s + .4, [.45, -.05]], [a1.s, [.45, -.05]], [a1.s + .6, [.62, 0]], [a3.s + .02, [.62, 0]], [a3.s + .22, [.4, .45]], [hPen - .08, [.4, .45]], [hPen + .15, [.62, 0]]]), expr: lt >= tRaise && lt < a5.s ? 'shock' : 'happy',
      acc: ['suit', 'nametag9', 'pocket11'], lift: lt > T.horn ? 13 * Math.abs(Math.sin((lt - T.horn) * 13)) * Math.exp(-(lt - T.horn) * 4.2) : 0, pocketPass: lt < hB + .36, pocketPen: lt < a3.s + .2, hold: {}, grip: {}, hand: {}, arms: { l: 'rest', r: 'rest' } }));
    const jig = 7 * Math.sin(lt * 11), R0 = [124, 96], L0g = [-140, 104], UP_R = [152, -92 + jig], UP_L = [-152, -92 - jig], PKT = [116, 92], CR = [34, 126], CL = [-30, 126];
    armKeys(ad, 1, lt, [[0, R0], [T.horn + .55, R0], [T.horn + .95, UP_R], [a1.e - .36, UP_R], [a1.e - .02, R0], [tB + .04, M1], [hB + .02, M1], [hB + .3, PKT], [hB + .36, PKT], [hP, M2], [hP + .04, M2], [hP + .2, CR], [tSwap + .1, CR], [hL, M2], [hL + .03, M2], [hL + .3, R0], [hL + .8, 'rest'],
      [a3.s - .05, 'rest'], [a3.s + .12, PKT], [a3.s + .2, PKT], [hPen - .1, M3], [takePen, M3], [takePen + .35, 'rest']]);
    armKeys(ad, -1, lt, [[0, L0g], [T.horn + .55, L0g], [T.horn + .95, UP_L], [a1.e - .2, UP_L], [a1.e + .3, L0g], [hP - .1, L0g], [tSwap, CL], [tSwap + .1, CL], [tSwap + .45, 'rest']]);
    // props in the hands: the basket (right) until it is given, the pass from the pocket, then the lunch that crosses from his left hand to his right, and the pen
    if (lt < hB) { setHold(ad, 1, 'basket11'); setHand(ad, 1, 'grip'); }
    else if (lt >= hB + .34 && lt < hP + .02) { setHold(ad, 1, 'passcard11'); setHand(ad, 1, 'grip'); ad.passScale = trk(lt, [[hB + .34, .38], [hP - .02, 1]]); }
    { const cL = armClamp(ad, -1, CL), cR = armClamp(ad, 1, CR), g = 1 - sk(lt, tSwap, tSwap + .14);
      if (lt < tSwap) { setHold(ad, -1, 'bag11'); setHand(ad, -1, 'grip'); }
      else if (lt < hL) { setHold(ad, 1, 'bag11'); setHand(ad, 1, 'grip'); ad.bagOff = [(cL[0] - cR[0]) * g, (cL[1] - cR[1]) * g]; } }
    if (lt >= a3.s + .2 && lt < takePen) { setHold(ad, 1, 'pen11'); setHand(ad, 1, 'grip'); ad.penAng = trk(lt, [[a3.s + .2, -1.45], [hPen - .16, -1.45], [hPen + .02, -.12]]); ad.penScale = trk(lt, [[a3.s + .2, .42], [hPen, 1]]); ad.penShine = pulse(lt, hPen, 2.6) * .9; }   // out of the pocket pointing up, laid flat to be handed over
    if (lt >= a4.s && lt < a4.e + .3) ad.arms.l = 'shrug';

    // ---- Persimmon: the committee's calm: sunglasses, earbuds, an iced coffee and a popper she fires without any visible enthusiasm
    const sipAt = (t0, t1) => sk(lt, t0, t0 + .28) * (1 - sk(lt, t1 - .25, t1));
    const sip = Math.max(sipAt(2.0, 3.0), sipAt(9.4, 10.4), sipAt(12.9, 13.8), sipAt(16.0, 17.0), sipAt(21.2, 22.2), sipAt(24.3, 25.3));
    const shadeK = sk(lt, p1.s + .12, p1.s + .42) * (1 - sk(lt, p1.e + 1.0, p1.e + 1.4));
    const pr = persimmon(Object.assign(qp, { look: lt < d.s ? [.45, -.1] : lt < p1.s ? [.55, 0] : [.62, 0], expr: lt >= p1.s && lt < a3.s ? 'chill' : 'neutral', lid: .3, acc: ['perdiem9', 'airpods', 'shades9'], shadeK,
      hold: { r: 'icedcup' }, grip: { l: PL, r: [lerp(100, 135, sip), lerp(72, -64, sip)] }, arms: { l: 'hold', r: 'hold' }, hand: {} }));
    if (lt < T.shot1 + .75) { setHold(pr, -1, 'popper11'); pr.popFired = lt >= T.shot1; pr.popAng = POP.p.a + .1 * pulse(lt, T.shot1, 12);
      armKeys(pr, -1, lt, [[0, [-94, 64]], [d.s + .5, [-94, 64]], [d.s + .95, POP.p.g], [T.shot1 + .25, POP.p.g], [T.shot1 + .75, PL]]); setHand(pr, -1, 'grip'); }
    { const tk = sk(lt, p1.s + .5, p1.s + .85) * (1 - sk(lt, p1.e + .1, p1.e + .45)); if (tk > 0) pr.grip.r = [lerp(pr.grip.r[0], 150, tk), lerp(pr.grip.r[1], -30, tk)]; }   // the toast on "Welcome to the club"

    // ---- Strawberry: outside the glass, then the walk, then the gifts, the pen and the raise she asks for
    const walking = lt >= d.s + .54 && lt < walkEnd, ph = walking ? pathDist(spFn, lt) / 84 * PI : 0;
    // her eyes: dead ahead while she walks, then on the Administrator, dropping to each gift as it comes, to Persimmon for the toast, to the pen, and back to the camera at the end
    const spLook = look([[0, [0, .05]], [a2.s - .2, [0, .05]], [a2.s + .2, [-.5, 0]], [tB + .05, [-.5, 0]], [tB + .2, [-.35, .5]], [hB + .25, [-.35, .5]], [tPass - .03, [-.5, .05]], [hP - .02, [-.45, .3]], [hP + .3, [-.5, .05]], [tL + .1, [-.4, .5]], [hL + .35, [-.4, .5]],
      [s1.s - .08, [-.5, 0]], [s1.s + .12, [.05, .08]], [p1.s - .1, [.05, .08]], [p1.s + .1, [.62, 0]], [p1.e + .15, [.62, 0]], [a3.s, [-.5, .05]], [hPen - .25, [-.3, .35]], [hPen + .2, [-.5, 0]], [s2.s + .3, [-.5, 0]], [takePen - .3, [-.4, .35]], [takePen + .35, [-.5, -.05]],
      [a5.s, [-.5, -.05]], [s5.s - .05, [-.5, 0]], [s5.s + .3, [.05, .08]]]);
    const sp = person(straw, spFn, lt, { stride: 40, look: spLook,
      expr: lt >= s5.s + .5 && lt < s5.e ? 'chill' : (inB(lt, 's4') || (lt >= s4.e && lt < a5.s + 1.1)) ? 'hopeful' : (lt >= p1.s + .6 && lt < a4.s) ? 'sour' : 'dead',
      lid: lt < a2.s ? .42 : lt >= s4.s && lt < s4.e ? undefined : lt >= a5.s + .3 && lt < s5.s ? lerp(.1, .6, seg(lt, a5.s + .3, a5.s + 1.3)) : .5, badgeSwing: walking ? .12 : 0, passA: lt >= hP + .4 ? 1 : 0,
      arms: { l: walking ? [.28 + .35 * Math.sin(ph), .25] : 'rest', r: walking ? [.28 + .35 * Math.sin(ph + PI), .25] : 'rest' }, hold: {}, grip: {}, hand: {} });
    const BSK = [-134, 98], BGS = [-100, 92], RDY = [-128, 70], RAISE = [-138, -108], OUT = [-162, 8];
    armKeys(sp, -1, lt, [[tB - .32, 'rest'], [tB + .02, M1], [hB + .04, M1], [hB + .46, BSK], [hB + .52, BSK], [hP - .02, M2], [hP + .12, M2], [hL - .34, RDY], [hL - .02, M2], [hL + .06, M2], [hL + .42, BGS], [dropBag - .2, BGS], [dropBag, [-134, 100]], [dropBag + .35, 'rest'],
      [takePen - .34, 'rest'], [takePen - .02, M3], [takePen + .06, M3], [takePen + .26, OUT], [takePen + .56, RAISE], [s4.e + .5, RAISE], [a5.s + 1.1, [-130, 64]], [CUR.dur + 1, [-130, 64]]]);
    if (lt >= hB && lt < dropB) { setHold(sp, -1, 'basket11'); setHand(sp, -1, 'grip'); }
    else if (lt >= hP && lt < hP + .12) { setHold(sp, -1, 'passcard11'); setHand(sp, -1, 'grip'); }
    else if (lt >= hL && lt < dropBag) { setHold(sp, -1, 'bag11'); setHand(sp, -1, 'grip'); }
    else if (lt >= takePen) { setHold(sp, -1, 'pen11'); setHand(sp, -1, 'grip'); sp.penAng = trk(lt, [[takePen + .04, -.12], [takePen + .3, -1.25], [takePen + .6, -1.35]]); }
    return { cl, mg, ad, pr, sp, z: { cl: MK.cl[1], mg: MK.mg[1], ad: MK.adm[1], pr: MK.per[1], sp: spFn(lt)[1] }, M, T, tB, hB, hP, hL, dropB, dropBag, tPen, hPen, takePen, tRaise, walkEnd };
  },
  cam(lt) {
    const sh = shotOf(lt), b = id => B(id), d = b('door'), a2 = b('a2'), st = b('sting'), k = seg(lt, sh.t0, sh.t1), e = easeIO(k);
    // the perspective camera: the room is shot from its usual place, except for the walk, which is shot low from inside the aisle
    let P = { f: 1400, cy: 360, hy: 860, cz: -480 };
    if (sh.n === 'doorA') P = { f: 1400, cy: 190, hy: 900, cz: lerp(440, 380, e) };
    else if (sh.n === 'doorS') P = { f: 1400, cy: 190, hy: 880, cz: lerp(430, 340, k) };
    V2.setCam(P);
    const C = SC.cast(lt), F = (o, z, up = 100) => faceZoom(o, z, up);
    const tStraw = wordT('m1', 'strawberry'), tBadge = wordT('m2', 'badge');
    const mid = (o1, o2, z, up) => { const f1 = faceC(o1), f2 = faceC(o2); zoomTo((f1[0] + f2[0]) / 2, (f1[1] + f2[1]) / 2 + up / z, z); };
    switch (sh.n) {
      case 'wide': zoomTo(540, lerp(975, 965, e), lerp(.9, .94, e)); break;
      case 'cuCM': mid(C.cl, C.mg, lerp(1.5, 1.62, k), 70); break;
      case 'cuM': {   // Mango points up; on "Strawberry" the camera whips across to the banner
        const w = sk(lt, tStraw - .14, tStraw + .1); F(C.mg, lerp(1.5, 1.54, k), 70);
        { const fx = CAM.x, fy = CAM.y; zoomTo(lerp(fx, 540, w), lerp(fy, 810, w), lerp(CAM.z, 1.2, w)); } break; }
      case 'cuC': F(C.cl, lerp(1.8, 1.92, k), 110); break;
      case 'badge': {   // a push from the two of them to the badge itself, quick on "badge"
        const bd = localToScreen(C.cl, 72, 77), f1 = faceC(C.cl), f2 = faceC(C.mg), z = trk(lt, [[sh.t0, 1.55], [tBadge - .2, 1.8], [tBadge + .15, 2.9], [sh.t1, 3.0]]);
        const cx = lerp((f1[0] + f2[0]) / 2, 915, seg(z, 1.55, 3.0)), cy = lerp((f1[1] + f2[1]) / 2 + 70 / 1.55, (f1[1] + bd[1]) / 2 - 30 / z, seg(z, 1.55, 3.0)); zoomTo(cx, cy, z); break; }
      case 'doorA': zoomTo(540, 1050, lerp(1.0, 1.1, k)); CAM.r = -.022 * sk(lt, d.s + .3, d.s + 1.2); CAM.shake = 1.2 + 5 * Math.pow(seg(lt, d.s + .45, d.s + 1.22), 2); break;
      case 'doorW': { const hit = pulse(lt, d.s + 1.3, 6); zoomTo(540, 975, lerp(.9, .94, k)); CAM.shake = 9 * hit; CAM.r = .01 * hit; break; }
      case 'doorS': zoomTo(540, 990, lerp(1.0, 1.06, k)); CAM.shake = 3 * pulse(lt, sh.t0, 4); break;
      case 'cuA': F(C.ad, lerp(1.5, 1.62, k), 95); CAM.x += 90 / CAM.z; break;
      case 'two': mid(C.ad, C.sp, lerp(1.4, 1.48, k), 150); break;
      case 'cuS': F(C.sp, lerp(1.85, 1.98, k), 135); break;
      case 'cuP': F(C.pr, lerp(2.0, 2.12, k), 105); break;
      case 'pen': mid(C.ad, C.sp, lerp(1.44, 1.5, k), 120); break;
      case 'cuA2': F(C.ad, lerp(1.7, 1.8, k), 100); break;
      case 'cuS2': F(C.sp, lerp(1.7, 1.6, k), 70); break;
      case 'cuA3': F(C.ad, lerp(1.9, 2.05, k), 95); break;
      case 'two2': mid(C.ad, C.sp, lerp(1.38, 1.46, k), 150); break;
      case 'xcuS': F(C.sp, lerp(2.5, 3.0, k), lerp(190, 240, k)); break;
      case 'sting': zoomTo(540, lerp(985, 975, k), lerp(.9, .93, k)); break;
    }
  },
  draw(lt) {
    const sh = shotOf(lt), C = SC.cast(lt), T = C.T, t = lt + 4, d = B('door'), op = B('open'), st = B('sting'), a1 = B('a1');
    const banner = sh.n === 'cuM' && lt >= wordT('m1', 'strawberry') - .03;
    const crisp = banner ? [] : CRISP[sh.n] || ALLC, blurPx = banner ? 0 : (BLUR[sh.n] ?? 0);
    V2.setLight(L0); V2.opts.reflect = true;
    const open = sk(lt, d.s + .1, d.s + 1.0), sil = 1 - seg(lt, T.horn - .12, T.horn + 1.15), outside = C.z.sp > 1752, aisle = sh.n === 'doorA' || sh.n === 'doorS';
    const flash = lt >= T.horn && lt < T.horn + .3 ? 1 - (lt - T.horn) / .3 : 0, spx = C.sp, pops = [op.s + .35, op.s + .6], camZ = V2.P.cz;
    const spDraw = fn => silhouette(sil, () => fn(spx));
    // the banner is wider than any close-up: it is in the wides and the whip that reveals it, and out of shot (not drawn) everywhere else
    const tStrawB = wordT('m1', 'strawberry'), bannerA = ['wide', 'doorW', 'sting'].includes(sh.n) ? 1 : sh.n === 'cuM' ? seg(lt, tStrawB - .12, tStrawB + .04) : 0;
    V2.dof(blurPx, () => {
      const r = lobby11({ sun: 1 + 1.1 * open, doorOpen: open, t, lt, noBanner: aisle || bannerA <= 0, bannerA, glassLate: outside, doorBloom: sil > .02 ? .06 : .5, popsL: [null, null, pops[0]], popsR: [null, null, null, pops[1]], escape: { i: 5, t0: st.s - .45 } });
      // the sun floods in as the doors part: a glare in the doorway that settles once she is through
      const kd = kz(1750);
      V2.glow(r.door[0], r.door[1] + 10, 620 * kd, '255,246,220', .5 * open * (1 - .7 * seg(lt, d.s + 1.6, d.s + 4.0)), 'screen', sil > .02 ? .06 : .7);
      V2.dust(60, 600, 1020, 1400, lt, { n: 28, alpha: .5, color: '255,246,214' });
      // she stands outside the glass against the glare: a dark cut-out with a halo, laid over the light and under the panes
      if (outside) {
        V2.glow(spx.x, spx.y - 150 * spx.s, 300 * spx.s, '255,250,232', .6 * sil, 'screen', .05);
        const keep = aisle || sh.n === 'doorW'; if (!keep) REG.suppress++; spDraw(drawChar); if (!keep) REG.suppress--;
        r.panels();
      }
      // the chime as the doors reach the end of their travel: a twinkle on each leading edge
      { const k = seg(lt, d.s + .9, d.s + 1.22);
        if (k > 0 && k < 1) for (const [wx, wy, sz] of [[172, 430, 1], [-172, 290, .7]]) {
          const [gx, gy] = p2(wx, wy, r.zb), kk = kz(r.zb), a = Math.sin(k * PI), L = 130 * sz * kk * a;
          V2.glow(gx, gy, 110 * sz * kk * a, '255,250,220', .55 * a, 'screen', .25); star(gx, gy, L, .9 * a, .3 * k); } }
      // the horn: rays fan out of the doorway behind her
      { const rk = seg(lt, T.horn - .02, T.horn + .6);
        if (rk > 0 && rk < 1 && sh.n === 'doorW') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(r.door[0], r.door[1] + 40);
          for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + .25 * rk, w = .05 + .025 * hash(i); ctx.fillStyle = `rgba(255,240,190,${.2 * (1 - rk) * (.6 + .4 * hash(i + 3))})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1100 * (.35 + .65 * easeOut(rk)), a - w, a + w); ctx.closePath(); ctx.fill(); }
          ctx.restore(); } }
      // the carpet after the poppers: the confetti that has already landed
      confetti('floor', lt, T.shot1, ...popMouth(C.pr, 'p'), 1, 90, 5, C.pr.y + 10, 1.25);
      confetti('floor', lt, T.shot2, ...popMouth(C.mg, 'm'), -1, 90, 11, C.mg.y + 10, 1.25);
    });
    // things on the floor are drawn after the soft room: crisp, like the cast at their depth
    { const sp = C.sp, ss = sp.s;
      if (lt >= C.dropB) { const slide = easeOut(seg(lt, C.dropB, C.dropB + .35)), q = localToScreen(sp, lerp(-134, -166, slide), 98); ctx.save(); ctx.translate(q[0], q[1]); ctx.fillStyle = 'rgba(30,10,10,.2)'; ell(0, 186 * .62 * ss, 52 * ss, 9 * ss); ctx.fill(); ctx.rotate(.04 * Math.sin(t * 2.4)); ctx.scale(.62 * ss, .62 * ss); ctx.translate(0, 186); drawBasket(t); ctx.restore(); }
      if (lt >= C.dropBag) { const q = localToScreen(sp, -100, 100), tt = lt - C.dropBag, fall = Math.min(27 * ss, .5 * 3600 * tt * tt) - 4 * ss * Math.abs(Math.sin(Math.max(0, tt - .12) * 20)) * Math.exp(-Math.max(0, tt - .12) * 9); ctx.save(); ctx.translate(q[0], q[1] + fall); ctx.fillStyle = 'rgba(30,10,10,.2)'; ell(0, 84 * ss - fall, 44 * ss, 8 * ss); ctx.fill(); ctx.scale(.72 * ss, .72 * ss); drawBag(); ctx.restore(); }
      for (const [o, t0, s, a0, g] of [[C.pr, T.shot1 + .75, -1, -POP.p.a, PL], [C.mg, T.shot2 + .72, 1, POP.m.a, MR]]) if (lt >= t0) { const q = localToScreen(o, ...g), fall = Math.min(1, (lt - t0) / .22), fy = o.y - 8 * o.s; ctx.save(); ctx.translate(q[0], lerp(q[1], fy, fall * fall)); ctx.rotate(lerp(a0, s * 1.45, fall)); ctx.scale(o.s * .62, o.s * .62); drawPopper(true, t); ctx.restore(); }
    }
    // balloon pops: a puff of sparks where the rubber was, up at the top of the room
    for (const [Xc, seed, i, t0, col, sd] of [[-575, 0, 2, pops[0], '255,236,160', 3], [575, 2.3, 3, pops[1], '255,210,230', 8]]) { const bp = balPos(Xc, 1610, t, seed, i, null, lt); V2.sparks(...p2(bp.x, bp.y, bp.z), lt, t0, { n: 14, speed: 380, life: .5, color: col, g: 900, size: 4, seed: sd }); }
    // the cast, back to front; everyone but the subject of a close-up is a soft neighbour
    const order = ALLC.filter(id => !(id === 'sp' && outside) && C.z[id] > camZ + 260 && (id === 'sp' || !aisle)).sort((a, b) => (crisp.length === 1 ? (crisp.includes(a) ? 1 : 0) - (crisp.includes(b) ? 1 : 0) : 0) || C.z[b] - C.z[a]);
    for (const id of order) {
      const o = C[id], bg = !crisp.includes(id), dr = bg ? nbr : drawChar;
      if (id === 'sp') { if (sil > .02) V2.glow(spx.x, spx.y - 150 * spx.s, 300 * spx.s, '255,250,232', .6 * sil, 'screen', .05); spDraw(dr); continue; }
      dr(o);
    }
    V2.setLight(L0);
    // the parking pass: pinched at the handoff, then it sails from her fingers to the clip under her badge (an arc, a spin, shrinking to the badge's size)
    { const f = seg(lt, C.hP + .12, C.hP + .4);
      if (f > 0 && f < 1) {
        const sp = C.sp, ss = sp.s, a = [C.M[0] + 12, C.M[1] + 46 - 50 * ss], z = localToScreen(sp, 71.7, 133), e = easeIO(f);
        ctx.save(); ctx.translate(lerp(a[0], z[0], e), lerp(a[1], z[1], e) - 90 * Math.sin(f * PI) * ss); ctx.rotate(lerp(-.1, .14, e) + 5 * Math.sin(f * PI) * .08); ctx.scale(ss * lerp(1, .667, e), ss * lerp(1, .667, e)); drawPassCard(); ctx.restore();
      } }
    // the sparkle cue (+1.50): glitter around her as she steps into the light
    if (sh.n === 'doorW' || sh.n === 'doorS') for (let i = 0; i < 9; i++) {
      const t0 = T.horn + .2 + i * .055, k = seg(lt, t0, t0 + .36), sp = C.sp; if (k <= 0 || k >= 1) continue;
      star(sp.x + (hash(i * 3 + 1) - .5) * 300 * Math.max(sp.s, .5), sp.y - (40 + hash(i * 5 + 2) * 290) * Math.max(sp.s, .5), (34 + 46 * hash(i + 11)) * Math.sin(k * PI), .95, hash(i) * 1.2);
    }
    // paper in the air: from both poppers, over the cast
    confetti('air', lt, T.shot1, ...popMouth(C.pr, 'p'), 1, 90, 5, C.pr.y + 10, 1.25);
    confetti('air', lt, T.shot2, ...popMouth(C.mg, 'm'), -1, 90, 11, C.mg.y + 10, 1.25);
    V2.sparks(...popMouth(C.pr, 'p'), lt, T.shot1, { n: 16, speed: 520, life: .45, color: '255,236,160', g: 700, size: 5, seed: 12 });
    V2.sparks(...popMouth(C.mg, 'm'), lt, T.shot2, { n: 16, speed: 520, life: .45, color: '255,210,230', g: 700, size: 5, seed: 14 });
    // the sweat after the raise
    { const tr = C.tRaise + .05; if (lt >= tr && lt < B('a5').e + .2 && crisp.includes('ad')) {
      const o = C.ad, fall = seg(lt, tr, tr + .9), x = o.x + 98 * o.s, y = o.y + (-84 + 60 * easeIn(fall) - 215) * o.s, r = 11 * o.s, grow = easeOut(seg(lt, tr, tr + .25));
      ctx.save(); ctx.globalAlpha *= 1 - seg(lt, B('a5').e - .2, B('a5').e + .2); ctx.translate(x, y); ctx.scale(grow, grow); ctx.fillStyle = '#8fd4ff'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * o.s;
      ctx.beginPath(); ctx.moveTo(0, -r * 1.9); ctx.bezierCurveTo(r * 1.1, -r * .4, r * 1.1, r * 1.1, 0, r * 1.1); ctx.bezierCurveTo(-r * 1.1, r * 1.1, -r * 1.1, -r * .4, 0, -r * 1.9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(-r * .35, r * .1, r * .22, r * .4, .2); ctx.fill(); ctx.restore(); } }
    // the lens: confetti falling past it during the walk, the sun's flare and the flash of the horn
    if (['doorW', 'doorS', 'cuA', 'two'].includes(sh.n)) lensConfetti(lt, T.horn - .3, 34);
    if (open > 0 && lt < d.s + 2.6 && sh.n !== 'badge') V2.flare(...toScr(...p2(0, 250, 1750)), .26 * open * (1 - seg(lt, d.s + .9, d.s + 2.3)));
    if (flash > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,252,240,${.42 * flash})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
  fx(lt) {
    const d = B('door'), horn = d.s + 1.3, tune = lt > d.s && lt < d.e + 1.5 ? 1 : 0;
    const flash = lt >= horn && lt < horn + .3 ? 1 - (lt - horn) / .3 : 0, st = B('sting'), stK = seg(lt, st.s, st.e);
    return { bloom: .6 + .06 * tune * seg(lt, d.s, horn) + .16 * flash, vignette: .38 + .25 * stK + .08 * seg(lt, d.s + .3, horn) * (1 - seg(lt, horn, horn + .6)), grain: .045, contrast: .12 + .04 * tune, sat: .14 + .1 * tune - .1 * stK, tint: [['#ffe9b8', .12 - .08 * tune, 'soft-light']],
      aberr: lt > horn && lt < horn + .25 ? 6 * (1 - (lt - horn) / .25) : 0, fade: Math.max(lt < .25 ? 1 - lt / .25 : 0, seg(lt, CUR.dur - .3, CUR.dur - .02)), fadeColor: '0,0,10' };
  },
  blur: lt => { const sh = shotOf(lt); if (SHOT_ORDER().some(([, e]) => Math.abs(lt - e) < .022)) return 1; return sh.n === 'doorA' || sh.n === 'doorW' || sh.n === 'doorS' ? 3 : (sh.n === 'cuM' && lt > wordT('m1', 'strawberry') - .16 && lt < wordT('m1', 'strawberry') + .16) ? 10 : 1; },
  over(lt) {
    const d = B('door'), horn = d.s + 1.3, a5 = B('a5');
    sfxWord(lt, horn, 'TA-DAAA!', 540, 330, { size: 150, rot: -.05, hold: .45, fill: '#ffe135' });
    // "OTHER BUDGET" is stamped on the air above the two of them as the word lands, and fades as the shot cuts
    const tS = wordT('a5', 'budget'), k = lt - tS, land = .07, SX = 560, SY = 470;
    if (k >= 0 && lt < a5.e + .3) {
      const f = 1 - seg(lt, a5.e + .02, a5.e + .3), ink = pulse(lt, tS + land, 15);
      const sc = k < land ? lerp(1.25, 1, easeIn(k / land)) : 1 + .05 * ink * Math.cos((k - land) * 38), jx = k < land ? 0 : 6 * ink * Math.sin((k - land) * 52);
      ctx.save(); ctx.globalAlpha *= Math.min(1, k / .03) * .95 * f; ctx.translate(SX + jx, SY + jx * .4); ctx.rotate(-.07); ctx.scale(sc, sc);
      ctx.drawImage(stampArt(), -260, -62);
      regLocal('overlay', -260, -62, 260, 62, { id: 'stamp' }); regLocal('otext', -225, -40, 225, 40, { name: 'OTHER BUDGET' });
      ctx.restore();
      // a flick of ink off the edge on the hit
      const sp = seg(k, land, land + .32);
      if (sp > 0 && sp < 1) for (let i = 0; i < 14; i++) {
        const a = i / 14 * TAU + hash(i) * .4, d = 36 + 70 * easeOut(sp) * (.5 + hash(i + 8)), x = SX + Math.cos(a) * (262 + d * .5), y = SY + Math.sin(a) * (70 + d * .5) - 10;
        ctx.save(); ctx.globalAlpha *= (1 - sp) * f; ctx.fillStyle = '#d0142c'; ell(x, y, 2 + 3.4 * hash(i + 3) * (1 - sp * .5), 2 + 3.4 * hash(i + 3) * (1 - sp * .5)); ctx.fill(); ctx.restore();
      }
    }
  },
};
window.__EP11_SCENES = window.__EP11_SCENES || {};
window.__EP11_SCENES.arrival = SC;
})();
