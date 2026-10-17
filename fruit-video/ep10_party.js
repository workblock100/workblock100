'use strict';
/* SHIFT HAPPENS, Episode 10: Two Weeks' Notice. Scene module: party (10:50 PM, THE NURSES' STATION).
 *
 * Strawberry's farewell: a surprise party at the station for $4.17, a cake missing an R, and a card everybody signed.
 * Set: a shallow station room (zb 1500) built from S6.shell, with the Episode 9 banner reused (WELCOME PERSIMMON taped over: GOODBYE STRAWBERY).
 * Every position is a world coordinate: X right, Z forward, from V2.at(X, Z). Crowd members are soft neighbours (drawBg), the named cast is audited.
 *
 * Shot list (scene-local seconds):
 *   0.00  wide     lights on at 0.30 (partyhorn), cannons pop left 0.40 and right 0.55, cheer 0.50; Strawberry in the doorway, a streamer lands on her
 */
(() => {
if (!window.TIMELINE_EP10) return;
const { person, zoomTo, faceZoom, drawBg, inB, faceC, localOf, localToScreen } = window.H6;
const A6 = window.A6, A7 = window.A7, A9 = window.A9, A10 = window.A10, S6 = window.S6, S7 = window.S7;
const { straw, mango, lemon, cran, banana, pine, apple, papaya, goji, pear, drag } = A7;
const clem = A10.clem;
const { p2, poly, quad3, grad, radial, rgba } = V2;
const { box3, onZ, kz, ceilingLamp } = S6;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 ones)
// scene-relative time of a spoken word, from the recorded line's word timings (falls back to a guess if the line is missing)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// a route through keyed positions [t, X, Z, ease]: linear travel between keys, 'io' or 'out' to ease a leg
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const lerpA2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const pulse = (lt, a, b) => Math.sin(seg(lt, a, b) * PI);   // 0 -> 1 -> 0 between a and b
// aim a hand: blend from a resting grip (local coordinates) toward a point in scene coordinates (a copy of the Episode 9 arrival one)
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}

// ------------------------------------------------------------------ layout: a shallow station room, back wall at Z 1500
const ZB = 1500, HW = 640, CH = 900;
const DOOR = { x0: 300, x1: 540, y1: 450 };   // the hall door in the back wall, right: Strawberry stands in it at the start
// the party's marks (X, Z): named cast in the front row, Strawberry's mark at the right, the door behind her
const MK = { lemon: [-350, 1260], cran: [-140, 1190], mango: [100, 1230], straw: [350, 1180], door: [425, 1440] };
const CAKE = { dx: 168, dy: 92 };   // where Mango's right hand holds the cake tray, in her local pixels

// ------------------------------------------------------------------ accessories
// a paper party hat: a striped cone with a pompon, tilted on the crown. o.hat = { c1, c2, rot, dx, dy, s }
EXT.acc.partyhat10 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const h = o.hat || {}, sc = (h.s || 1) * k.rx / 110, c1 = h.c1 || '#ff4f9a', c2 = h.c2 || '#ffe135';
  ctx.save(); ctx.translate((h.dx ?? .34) * k.rx, -k.ry * (h.dy ?? .8)); ctx.rotate((h.rot ?? .36) + .025 * Math.sin(t * 2.1 + (o.seed || 0)));
  ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath();
  ctx.fillStyle = grad(-31 * sc, 0, 31 * sc, 0, [[0, V2.rgba(V2.mix(c1, '#ffffff', .25), 1)], [.5, c1], [1, V2.rgba(V2.mix(c1, '#2a1030', .35), 1)]]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = c2; ctx.lineWidth = 9 * sc;
  for (let i = -3; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-40 * sc, i * 24 * sc); ctx.lineTo(40 * sc, i * 24 * sc - 34 * sc); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(-14 * sc, -2 * sc); ctx.lineTo(-3 * sc, -86 * sc); ctx.lineTo(-8 * sc, -86 * sc); ctx.lineTo(-24 * sc, -2 * sc); ctx.fill(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * Math.max(.8, sc); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-31 * sc, 2 * sc); ctx.lineTo(0, -96 * sc); ctx.lineTo(31 * sc, 2 * sc); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = c2; ell(0, 3 * sc, 33 * sc, 6 * sc); ctx.fill(); ctx.stroke();
  const pr = 9 * sc; ctx.fillStyle = V2.radial(-3 * sc, -100 * sc, 1, pr * 1.4, [[0, '#ffffff'], [1, c2]]); ell(0, -97 * sc, pr, pr); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// a party blower in the mouth: o.blow 0 (curled up) to 1 (rolled out straight)
EXT.acc.blower10 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const bl = clamp(o.blow || 0); if (bl <= .01 && !o.blowOn) return;
  ctx.save(); ctx.translate(12, k.mouthY + 3);
  ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-2, -7, 26, 14, 5); ctx.fill(); ctx.stroke();
  const L = 8 + 118 * bl;
  ctx.fillStyle = '#ff3b55'; rr(22, -6.5, L, 13, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.save(); rr(22, -6.5, L, 13, 6); ctx.clip(); for (let x = 30; x < 22 + L; x += 17) ctx.fillRect(x, -7, 6, 14); ctx.restore();
  if (bl < .95) { ctx.strokeStyle = '#ff3b55'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU * 1.4, r = 16 * (1 - bl) * (1 - i / 34), x = 22 + L + Math.sin(a) * r, y = -r + Math.cos(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.restore();
};
// welling eyes and tears running down the cheeks: o.cry 0..1
EXT.acc.tears10 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const cry = clamp(o.cry || 0); if (cry <= .02) return;
  const ex = k.eyeX, ey = k.eyeY, er = k.er, eh = er * 1.15;
  ctx.save();
  for (const sd of [-1, 1]) {
    const x = sd * ex;
    // the pool on the lower lid
    ctx.fillStyle = `rgba(150,215,255,${.55 * cry})`; ctx.beginPath(); ctx.ellipse(x, ey + eh * .78, er * .92, eh * .24, 0, 0, PI); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${.7 * cry})`; ell(x - er * .3, ey + eh * .8, er * .22, eh * .08); ctx.fill();
    for (let i = 0; i < 2; i++) {   // two drops per cheek, each born at the lid, running down and fading
      const q = (((t * .85 + i * .5 + (sd > 0 ? .23 : 0) + (o.seed || 0) * .13) % 1) + 1) % 1, y = ey + eh + q * 68 * cry, r = (7.5 - 3 * q) * (.6 + .4 * cry);
      ctx.save(); ctx.globalAlpha *= (1 - seg(q, .7, 1)) * cry;
      ctx.strokeStyle = 'rgba(150,215,255,.5)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x + sd * er * .2, ey + eh * .9); ctx.lineTo(x + sd * er * .2 + sd * q * 4, y - r); ctx.stroke();
      ctx.fillStyle = '#9ddcff'; ctx.strokeStyle = '#3a8fc0'; ctx.lineWidth = 2.4;
      const tx = x + sd * er * .2 + sd * q * 4; ctx.beginPath(); ctx.moveTo(tx, y - r * 1.9); ctx.quadraticCurveTo(tx + r * 1.2, y, tx, y + r); ctx.quadraticCurveTo(tx - r * 1.2, y, tx, y - r * 1.9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(tx - r * .3, y - r * .1, r * .26, r * .46); ctx.fill(); ctx.restore();
    }
  }
  ctx.restore();
};
// a twisted paper streamer draped over Strawberry's cap and shoulder: o.drape 0..1 is how much of it has landed
EXT.acc.streamer10 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const d = clamp(o.drape || 0); if (d <= 0) return;
  const cols = ['#ff4f9a', '#4aa8ff'];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  [[-1, 0], [1, 1]].forEach(([sd, j]) => {
    const x0 = sd * k.rx * .12, y0 = -k.ry * .98, pts = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18 * d, sway = Math.sin(t * 1.8 + u * 5 + j * 2) * 3 * u;
      pts.push([x0 + sd * (k.rx * (.2 + .9 * easeOut(u)) * (1 - .1 * Math.cos(u * 9)) + 8 * Math.sin(u * 11 + j)) + sway, y0 + (k.ry * 1.55 * u * u + k.ry * .08 * u) * (j ? .8 : 1) + 6 * Math.sin(u * 14 + j * 3)]);
    }
    for (const [lw, col] of [[11, INK], [8, cols[j]]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.4; ctx.setLineDash([6, 12]); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
  });
  ctx.restore();
};

// ------------------------------------------------------------------ props
Object.assign(PROP_BOX, {
  cake10: Object.assign([-118, -186, 118, 16], { nearFace: true }),
  can10: [-52, -128, 52, 12],
  card10: [-6, -280, 196, 12],
  flag10: [-10, -160, 96, 16],
  reports10: Object.assign([-76, -150, 76, 16], { nearFace: true }),
  plate10: [-62, -40, 62, 12],
});

// ---- the sheet cake. Origin: bottom centre of the silver tray, y up is negative; 200 wide. o.t time, o.fall 0..1 the leaning candle going over, o.pop the caret's ping
function drawCake(o = {}) {
  const t = o.t || 0, hw = 100, fall = o.fall || 0, lean = o.lean || 0, melt = o.melt || 0;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // tray and the cake's front
  ctx.fillStyle = grad(0, -14, 0, 4, [[0, '#eef1f6'], [1, '#aab1be']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-hw - 12, -12, 2 * hw + 24, 13, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = grad(0, -50, 0, -12, [[0, '#f8dc96'], [1, '#e2b25c']]); rr(-hw, -50, 2 * hw, 38, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d6405e'; ctx.fillRect(-hw + 2, -34, 2 * hw - 4, 7);   // the jam layer
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-hw + 2, -48, 2 * hw - 4, 4);
  // the top face, seen tilted toward us: a trapezoid of pink frosting with a piped border
  const tl = [-hw + 16, -138], tr = [hw - 16, -138], br = [hw - 1, -48], bl = [-hw + 1, -48];
  ctx.beginPath(); ctx.moveTo(...bl); ctx.lineTo(bl[0] + 4, tl[1] + 8); ctx.quadraticCurveTo(tl[0] - 2, tl[1] - 2, tl[0] + 10, tl[1]); ctx.lineTo(tr[0] - 10, tr[1]); ctx.quadraticCurveTo(tr[0] + 2, tr[1] - 2, br[0] - 4, tr[1] + 8); ctx.lineTo(...br); ctx.closePath();
  ctx.fillStyle = grad(0, -140, 0, -48, [[0, '#ffe3ec'], [1, '#ffc2d6']]); ctx.fill(); ctx.stroke();
  // scalloped border of piped shells along the front edge and the sides
  ctx.fillStyle = '#fff6fa'; ctx.strokeStyle = 'rgba(190,80,120,.7)'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 14; i++) { const x = lerp(bl[0] + 7, br[0] - 7, i / 13); ell(x, -52, 7.5, 5.5); ctx.fill(); ctx.stroke(); }
  // the frosting words: GOODBYE, then STRAWBER and a gap and Y, with a crooked caret in the gap
  const ink1 = '#5a2d1a', ink2 = '#9a6a4a';
  const word = (str, x, y, size, rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); text(str, -.8, -1.4, { size, font: 'Bangers', weight: 400, fill: ink2, spacing: 1 }); text(str, 0, 0, { size, font: 'Bangers', weight: 400, fill: ink1, spacing: 1 }); ctx.restore(); };
  word('GOODBYE', 0, -108, 30, -.012);
  ctx.save(); ctx.font = '400 28px Bangers'; ctx.letterSpacing = '1px'; const wa = ctx.measureText('STRAWBER').width, wy = ctx.measureText('Y').width, gap = 17; ctx.letterSpacing = '0px'; ctx.restore();
  const tot = wa + gap + wy, x0 = -tot / 2;
  word('STRAWBER', x0 + wa / 2, -76, 28, .01); word('Y', x0 + wa + gap + wy / 2, -76, 28, .01);
  { const cx = x0 + wa + gap / 2 + 1, pop = o.pop || 0, s = 1 + .5 * pop;   // the caret: two crooked strokes under the gap
    ctx.save(); ctx.translate(cx, -63); ctx.rotate(-.16 + .2 * pop * Math.sin(t * 40)); ctx.scale(s, s); ctx.strokeStyle = ink1; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-8.5, 8); ctx.lineTo(.5, -5); ctx.lineTo(9, 7); ctx.stroke(); ctx.restore(); }
  // candles on the back edge, melted down to different heights; one leans and goes over
  const cs = [[-74, 30, '#ff8fc7'], [-37, 25, '#8fd3ff'], [0, 32, '#fff07a'], [37, 28, '#b7ff8f'], [74, 24, '#ff9f5a']];
  cs.forEach(([cx, h0, col], i) => {
    const falling = i === 3, base = [cx, -128], hh = h0 * (1 - .05 * melt);
    ctx.save(); ctx.translate(base[0], base[1]);
    let rot = 0, lit = true;
    if (falling) { const lean2 = lean * .5, fr = easeIn(fall); rot = lean2 * (1 - fall) + fr * (PI / 2 + .1) + (fall > .8 ? -.1 * Math.sin((fall - .8) * 25) * (1 - seg(fall, .85, 1)) : 0); lit = fall < .55; }
    ctx.rotate(rot);
    // melted wax pooled at the base and running down the sides
    ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2.8; rr(-5.5, -hh, 11, hh + 1, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-3, -hh + 2, 2.4, hh - 4);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(40,20,40,.5)'; ctx.lineWidth = 1.4;
    for (const [dx, dl] of [[-5, .5 + .3 * melt], [5, .7 + .2 * melt]]) { const L = hh * dl * (.8 + .2 * hash(i * 3 + dx)); ctx.beginPath(); ctx.moveTo(dx - 2.4, -hh + 1); ctx.lineTo(dx + 2.4, -hh + 1); ctx.lineTo(dx + 2, -hh + L); ctx.arc(dx, -hh + L, 2.4, 0, PI); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = col; ell(0, 1, 9.5, 3.6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(.6, -hh - 5); ctx.stroke();
    if (lit) { const fl = 1 + .18 * Math.sin(t * 17 + i * 2.3) + .08 * Math.sin(t * 31 + i), sw = 1.6 * Math.sin(t * 9 + i * 1.7);
      ctx.save(); ctx.translate(sw, -hh - 6); ctx.scale(1, fl);
      ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(0, -17); ctx.quadraticCurveTo(7.5, -6, 0, 1); ctx.quadraticCurveTo(-7.5, -6, 0, -17); ctx.fill();
      ctx.fillStyle = '#fff1a0'; ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(3.6, -5, 0, 0); ctx.quadraticCurveTo(-3.6, -5, 0, -11); ctx.fill(); ctx.restore(); }
    else if (fall < .95) { const sm = seg(fall, .55, .95); ctx.fillStyle = `rgba(200,200,210,${.5 * (1 - sm)})`; for (let j = 0; j < 3; j++) ell(Math.sin(j * 2 + t * 3) * 3, -hh - 8 - sm * 26 - j * 9, 4 + j * 2, 4 + j * 2); ctx.fill(); }
    ctx.restore();
  });
  ctx.restore();
}
EXT.prop.cake10 = (side, o, t) => {
  ctx.save(); ctx.rotate(.07 * side + (o.cakeTilt || 0)); ctx.translate(0, 10);
  drawCake({ t, fall: o.cakeFall || 0, lean: o.cakeLean || 0, melt: o.cakeMelt || 0, pop: o.cakePop || 0 });
  ctx.restore();
};

// ---- Lemon's coffee can, STRAWBERRY FUND in marker on a strip of masking tape. Origin: where the hand grips the lower body
EXT.prop.can10 = (side, o, t) => {
  ctx.save(); ctx.rotate((o.canTilt || 0));
  ctx.lineJoin = 'round';
  ctx.fillStyle = grad(-46, 0, 46, 0, [[0, '#9aa3b2'], [.3, '#eef1f6'], [.62, '#c3cad6'], [1, '#8d96a6']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; rr(-46, -112, 92, 118, 8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,70,90,.25)'; ctx.lineWidth = 2; for (const y of [-100, -22, -10]) { ctx.beginPath(); ctx.moveTo(-45, y); ctx.lineTo(45, y); ctx.stroke(); }
  ctx.fillStyle = '#222630'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-50, -124, 100, 16, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#05060a'; rr(-22, -119, 44, 5, 2.5); ctx.fill();
  ctx.save(); ctx.translate(0, -62); ctx.rotate(-.025);
  ctx.fillStyle = '#efe0b6'; ctx.strokeStyle = 'rgba(110,90,50,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-47, -33); ctx.lineTo(47, -34); ctx.lineTo(48, -30); ctx.lineTo(46, 32); ctx.lineTo(-46, 33); ctx.lineTo(-48, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
  text('STRAWBERRY', 0, -11, { size: 15.5, fill: '#d6203a', weight: 900, maxW: 88, spacing: .4 }); text('FUND', 0, 13, { size: 27, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 2 });
  ctx.restore();
  ctx.restore();
};

// ---- the card, closed: a pastel cover with a hot-air balloon, GOOD LUCK ON YOUR JOURNEY and SORRY YOU'RE LEAVING (WE'RE NOT). Origin: its lower-left corner, held by the hand
function drawCardCover(w = 190, h = 270) {
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(0, -h, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.save(); rr(5, -h + 5, w - 10, h - 10, 5); ctx.clip();
  ctx.fillStyle = grad(0, -h, 0, 0, [[0, '#7fc4ff'], [1, '#d9f0ff']]); ctx.fillRect(0, -h, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.95)'; for (const [cx, cy, r] of [[34, -92, 18], [54, -100, 24], [78, -92, 17], [140, -64, 16], [158, -70, 22], [176, -62, 14]]) { ell(cx, cy, r, r * .66); ctx.fill(); }
  // the hot-air balloon
  ctx.save(); ctx.translate(w * .62, -h * .50);
  ctx.fillStyle = '#ff4f6d'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 34); ctx.bezierCurveTo(-46, 8, -42, -52, 0, -52); ctx.bezierCurveTo(42, -52, 46, 8, 0, 34); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(-14, -54); ctx.quadraticCurveTo(-26, -10, -4, 36); ctx.lineTo(4, 36); ctx.quadraticCurveTo(26, -10, 14, -54); ctx.fill(); ctx.restore(); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 33); ctx.lineTo(-8, 52); ctx.moveTo(10, 33); ctx.lineTo(8, 52); ctx.stroke(); ctx.fillStyle = '#b98a5a'; rr(-12, 52, 24, 16, 3); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
  text('GOOD LUCK', w / 2, -h + 38, { size: 31, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 5, stroke: '#1d4a8a', spacing: 1.5 });
  text('ON YOUR JOURNEY', w / 2, -h + 66, { size: 22.5, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 4.5, stroke: '#1d4a8a', spacing: 1, maxW: w - 20 });
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(10, -50, w - 20, 36, 6); ctx.fill(); ctx.stroke();
  text("SORRY YOU'RE LEAVING", w / 2, -32, { size: 13.5, fill: '#d6203a', weight: 900, maxW: w - 30 });
  ctx.save(); ctx.translate(w - 12, -h + 100); ctx.rotate(.16); text("(WE'RE NOT)", 0, 0, { size: 14.5, fill: '#1f9a52', weight: 900, italic: true, align: 'right', maxW: 100 }); ctx.restore();
  ctx.restore();
}
EXT.prop.card10 = (side, o, t) => { ctx.save(); ctx.rotate(-.12 + (o.cardTilt || 0)); ctx.translate(-4, 6); drawCardCover(); ctx.restore(); };

// ---- Mrs. Cranberry's tiny paper pennant on a stick: 1962
EXT.prop.flag10 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.08 + (o.flagWave || 0));
  ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, -138); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
  const fl = Math.sin(t * 7) * 3;
  ctx.fillStyle = '#1d3a8a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(3, -136); ctx.quadraticCurveTo(40, -136 + fl, 84, -112 + fl * 1.4); ctx.quadraticCurveTo(40, -88 - fl, 3, -88); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(28, -112 + fl * .4); ctx.rotate(.05 * fl); text('1962', 0, 1, { size: 19, font: 'Bangers', weight: 400, fill: '#ffffff', spacing: 1.2, maxW: 46 }); ctx.restore();
  ctx.restore();
};

// ---- the shift reports: a thick stack with a bookmark ribbon still in the first pages. Origin: the palm under the stack
EXT.prop.reports10 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .04); ctx.lineJoin = 'round';
  const n = 17;
  for (let i = 0; i < n; i++) { const jx = (hash(i * 3 + 1) - .5) * 7, jr = (hash(i * 5 + 2) - .5) * .03, y = -4 - i * 7; ctx.save(); ctx.translate(jx, y); ctx.rotate(jr); ctx.fillStyle = i % 2 ? '#fffdf5' : '#f2ecda'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; rr(-66, -7, 132, 9, 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // the top sheet, tilted toward us
  const yt = -4 - n * 7 + 4;
  ctx.fillStyle = '#fffef8'; ctx.strokeStyle = INK; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(-64, yt); ctx.lineTo(64, yt); ctx.lineTo(56, yt - 54); ctx.lineTo(-56, yt - 54); ctx.closePath(); ctx.fill(); ctx.stroke();
  text('SHIFT REPORTS', 0, yt - 40, { size: 15, font: 'Bangers', weight: 400, fill: '#2a2448', spacing: 1.5 }); text('STRAWBERRY, RN', 0, yt - 22, { size: 10.5, fill: '#6a6488', weight: 900, maxW: 92 });
  ctx.strokeStyle = '#8fa7c9'; ctx.lineWidth = 1.6; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(-40, yt - 10 + i * 4); ctx.lineTo(40 - i * 12, yt - 10 + i * 4); ctx.stroke(); }
  // the bookmark: a red ribbon laid in at page one, its sticky tab still on the very top
  ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(42, yt + 2); ctx.quadraticCurveTo(52, yt + 30, 46, yt + 54); ctx.stroke();
  ctx.strokeStyle = '#e8283a'; ctx.lineWidth = 4.4; ctx.stroke();
  ctx.fillStyle = '#ffe135'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.save(); ctx.translate(52, yt - 14); ctx.rotate(.14); rr(-4, -12, 22, 24, 3); ctx.fill(); ctx.stroke(); text('p.1', 7, 0, { size: 11, fill: '#1d1a22', weight: 900 }); ctx.restore();
  ctx.restore();
};

// ---- a paper plate with a slice of the cake and a plastic fork
EXT.prop.plate10 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.05); ctx.lineJoin = 'round';
  ctx.fillStyle = '#fbfbf8'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ell(0, -4, 54, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e8e2'; ell(0, -5, 38, 6); ctx.fill();
  if (o.plateCake !== false) {
    ctx.fillStyle = '#f2cf86'; ctx.beginPath(); ctx.moveTo(-26, -8); ctx.lineTo(24, -10); ctx.lineTo(24, -30); ctx.lineTo(-26, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6405e'; ctx.fillRect(-26, -21, 50, 4);
    ctx.fillStyle = '#ffc2d6'; ctx.beginPath(); ctx.moveTo(-26, -30); ctx.lineTo(24, -30); ctx.lineTo(16, -42); ctx.lineTo(-18, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a2d1a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -36); ctx.lineTo(-2, -38); ctx.stroke();
  }
  ctx.strokeStyle = '#f4f4f0'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(36, -2); ctx.lineTo(60, -26); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.restore();
};

// ------------------------------------------------------------------ the room
function room(lt, o = {}) {
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#f3e5c6', wain: '#4e8d95', floorA: '#dccba4', floorB: '#aa9a74', ceil: '#eee9da', fog: '#b9aa8c', fogAmt: .24, tile: 120, bright: 1, rail: 110 });
  // the door to the hall: a frame, a bright warm opening and the light it throws on the floor
  { const { x0, x1, y1 } = DOOR, f = [p2(x0, 0, ZB), p2(x1, 0, ZB), p2(x1, y1, ZB), p2(x0, y1, ZB)];
    onZ(ZB, x0 - 16, x1 + 16, 0, y1 + 16, '#efe5cf', 'rgba(25,16,30,.6)', 2.6);
    poly(f, grad(0, f[2][1], 0, f[0][1], [[0, '#fff3d0'], [1, '#ffe1a0']]));
    const [dx, dy] = p2((x0 + x1) / 2, y1 * .5, ZB), k = kz(ZB);
    V2.glow(dx, dy, 330 * k, '255,236,190', .55, 'screen', .5);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const fa = p2(x0, 0, ZB), fb = p2(x1, 0, ZB), fc = p2(x1 + 190, 0, 1000), fd = p2(x0 - 260, 0, 1000);
    ctx.fillStyle = grad(0, fa[1], 0, fc[1], [[0, 'rgba(255,236,180,.34)'], [1, 'rgba(255,236,180,0)']]);
    ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // the call-light board (a copy of the Episode 7 station one, smaller), the clock, the whiteboard
  { const bx0 = -610, bx1 = -430, by0 = 330, by1 = 640, kk = kz(ZB);
    poly([p2(bx0, by0, ZB), p2(bx1, by0, ZB), p2(bx1, by1, ZB), p2(bx0, by1, ZB)], '#20242c', 'rgba(255,255,255,.18)', 2.4);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const [lx, ly] = p2(bx0 + 28 + c * 42, by1 - 30 - r * 42, ZB); ctx.fillStyle = '#3a3f48'; ctx.beginPath(); ctx.ellipse(lx, ly, 11 * kk, 14 * kk, 0, 0, TAU); ctx.fill(); }
    text('CALL LIGHTS', ...p2((bx0 + bx1) / 2, by1 + 40, ZB), { size: 22 * kk, fill: '#3a4556', weight: 900, spacing: 2 }); }
  S6.wallClock(-340, 640, ZB, 0, 50, 10, 40);
  S7.whiteboard(ZB, { x0: -280, x1: 90, y0: 300, y1: 620 }, [
    { t: 'TODAY', x: .05, y: .17, size: .11, color: '#2a5ac8', rot: -.02, p: 1 },
    { t: 'RN: STRAWBERRY', x: .05, y: .36, size: .085, color: '#d62a3a', rot: -.01, p: 1 },
    { t: 'CNA: MANGO', x: .05, y: .53, size: .085, color: '#2a5ac8', rot: -.01, p: 1 },
    { t: 'CAKE @ 10:50', x: .05, y: .74, size: .085, color: '#1f9a52', rot: -.01, p: 1 }]);
  for (const z of [300, 800, 1300]) { ceilingLamp(-300, z, CH, 1, '255,246,220'); ceilingLamp(300, z, CH, 1, '255,246,220'); }
}

// ------------------------------------------------------------------ the cast
const CROWD = [   // soft neighbours: kind constructor, mark, accessories, hat colours and a phase
  { id: 'banana', ctor: banana, at: [-560, 1360], acc: [], hat: { c1: '#4aa8ff', c2: '#ffffff', rot: .3 }, ph: .3 },
  { id: 'pine', ctor: pine, at: [-470, 1320], acc: ['chain'], ph: 1.1 },
  { id: 'apple', ctor: apple, at: [-250, 1400], acc: ['nightcap'], ph: 2.0 },
  { id: 'papaya', ctor: papaya, at: [-20, 1370], acc: ['visor'], ph: 2.6 },
  { id: 'clem', ctor: clem, at: [250, 1330], acc: ['pricetag'], hat: { c1: '#ffe135', c2: '#ff4f9a', rot: -.3, dx: -.3 }, ph: 3.3 },
  { id: 'goji', ctor: goji, at: [-90, 1420], acc: [], hat: { c1: '#58c85a', c2: '#ffffff', s: .8 }, ph: .8 },
  { id: 'pear', ctor: pear, at: [-370, 1410], acc: [], hat: { c1: '#c25bd6', c2: '#ffe135', rot: .2 }, ph: 1.7 },
];

function cast(lt) {
  const b = id => B(id);
  const C = {};
  const q = (X, Z) => V2.at(X, Z);
  C.straw = person(straw, route([[0, MK.door[0], MK.door[1]], [b('m1').s - .05, MK.door[0], MK.door[1]], [b('m1').s + 1.0, MK.straw[0], MK.straw[1], 'io']]), lt, { stride: 40, look: [-.5, 0], expr: 'dead', lid: .5, arms: { l: 'rest', r: 'rest' }, acc: ['steth', 'bandage7', 'streamer10'], drape: seg(lt, .62, .95) });
  C.mango = mango(Object.assign(q(...MK.mango), { look: [.5, 0], expr: 'happy', hat: { c1: '#ff4f9a', c2: '#ffe135' }, acc: ['badge7', 'gaitbelt7', 'keys7', 'partyhat10'], hold: { r: 'cake10' }, grip: { r: [CAKE.dx, CAKE.dy] }, hand: { r: 'flat' }, arms: { l: 'cheer', r: 'hold' } }));
  C.lemon = lemon(Object.assign(q(...MK.lemon), { look: [.5, 0], expr: 'neutral', hat: { c1: '#4aa8ff', c2: '#ffe135', rot: -.25, dx: -.3 }, acc: ['readers', 'lanyard7', 'partyhat10'], arms: { l: 'rest', r: 'rest' } }));
  { const p = q(...MK.cran); C.cran = cran(Object.assign({ x: p.x, y: p.y - 118 * p.s, s: p.s, noLegs: true, noShadow: true, noReflect: true, look: [.5, 0], expr: 'happy', hat: { c1: '#58c85a', c2: '#ffffff', rot: .3, s: .85 }, acc: ['curlers', 'glasses', 'partyhat10'], hold: { r: 'flag10' }, arms: { l: 'rest', r: 'cheer' } })); C.cranQ = p; }
  C.crowd = CROWD.map(c => c.ctor(Object.assign(q(...c.at), { look: [.6, 0], expr: 'happy', who: null, acc: [...c.acc, ...(c.hat ? ['partyhat10'] : [])], hat: c.hat, arms: { l: 'cheer', r: 'cheer' }, t: lt + c.ph })));
  return C;
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: () => 'wide',
  cam(lt) {
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    zoomTo(560, 1010, .9);
  },
  draw(lt) {
    V2.setLight({ key: [-.35, -.8], keyColor: '#fff0d0', keyA: .26, rim: '#ff9ad0', rimA: .5, shadow: '#3a2a50', shadowA: .32, bounce: '#ffd9a0', bounceA: .2, amb: '#fff4e0', ambA: .04 });
    V2.opts.reflect = true;
    const C = cast(lt);
    V2.dof(0, () => { room(lt); });
    V2.dof(3, () => { for (const o of C.crowd) drawBg(o); });
    S7.wheelchairBack(C.cranQ.x, C.cranQ.y, C.cranQ.s);
    for (const o of [C.lemon, C.cran, C.mango, C.straw].sort((a, b) => (b.y - a.y))) drawChar(o);
    S7.wheelchairFront(C.cranQ.x, C.cranQ.y, C.cranQ.s);
  },
  fx: lt => ({ bloom: .6, vignette: .42, grain: .045, contrast: .14, sat: .12, tint: [['#ffb36b', .08, 'soft-light']], fade: Math.max(1 - seg(lt, 0, .28), seg(lt, CUR.dur - .3, CUR.dur - .02)), fadeColor: '0,0,10' }),
  blur: lt => 1,
  over(lt) {},
};

window.__EP10_SCENES = window.__EP10_SCENES || {};
window.__EP10_SCENES.party = SC;
})();
