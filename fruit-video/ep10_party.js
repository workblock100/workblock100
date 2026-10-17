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
const ZB = 1500, HW = 600, CH = 900;
const DOOR = { x0: 230, x1: 450, y1: 450 };   // the hall door in the back wall, right: Strawberry stands in it at the start
const DET = { x: 360, z: 1150 };               // the smoke detector on the ceiling
// the party's marks (X, Z): the named cast in the front row, Strawberry's mark at the right, the door behind her, the table at the back left
const MK = { lemon: [-385, 1250], cran: [-195, 1250], mango: [30, 1250], straw: [420, 1250], door: [340, 1440], table: [0, 1440] };
const CAKE = { dx: 158, dy: 100 };   // where Mango's right hand holds the cake tray, in her local pixels

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
// twisted crepe streamers draped over Strawberry's cap and shoulders: o.drape 0..1 is how much of them has landed; they hang clear of the face
EXT.acc.streamer10 = (o, k, t, layer) => {
  if (layer !== 'front') return;
  const d = clamp(o.drape || 0); if (d <= 0) return;
  ctx.save(); ctx.lineJoin = 'round';
  [[-1, '#ff4f9a', 0, 1], [1, '#4aa8ff', 1.7, .9]].forEach(([sd, col, ph, len]) => {
    const N = 26, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N * d * len, sway = Math.sin(t * 1.7 + u * 5 + ph) * 3.5 * u;
      let x = sd * k.rx * (.3 + .62 * (1 - Math.pow(1 - u, 2.2))) + sway, y = -k.ry * 1.0 + k.ry * 1.9 * Math.pow(u, 1.5);
      if (u > .78) { const c = (u - .78) / .22, a = c * 5.4; x += sd * (Math.sin(a) * 15 * c - 6 * c); y += (1 - Math.cos(a)) * 11 * c; }   // the tail curls up at its end
      pts.push([x, y]);
    }
    for (let i = 0; i < N; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L, tw = Math.cos(i * .85 + ph), w = 4 + 8 * Math.abs(tw);
      ctx.fillStyle = tw > 0 ? col : V2.rgba(V2.mix(col, '#2a1030', .28), 1); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x0 + nx * w / 2, y0 + ny * w / 2); ctx.lineTo(x1 + nx * w / 2, y1 + ny * w / 2); ctx.lineTo(x1 - nx * w / 2, y1 - ny * w / 2); ctx.lineTo(x0 - nx * w / 2, y0 - ny * w / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
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

// ---- the sheet cake. Origin: bottom centre of the silver tray, y up is negative; 200 wide. o.t time, o.fall 0..1 the leaning candle going over, o.pop the caret's ping,
// o.hi the macro-shot detail (sprinkles, crumbs, gloss), o.cut how much of the left end has been eaten (0 none)
let CAKE_M = null;
function cakeMetrics() {   // where the words and the gap sit, in cake-local pixels (measured once the fonts are in)
  if (CAKE_M) return CAKE_M;
  ctx.save(); ctx.font = '400 28px Bangers'; ctx.letterSpacing = '1px'; const wa = ctx.measureText('STRAWBER').width, wy = ctx.measureText('Y').width; ctx.letterSpacing = '0px'; ctx.restore();
  const gap = 17, tot = wa + gap + wy, x0 = -tot / 2;
  return CAKE_M = { wa, wy, gap, x0, gapX: x0 + wa + gap / 2 + 1, gapY: -63 };
}
const CANDLES = [[-74, 30, '#ff8fc7'], [-37, 25, '#8fd3ff'], [0, 32, '#fff07a'], [37, 28, '#b7ff8f'], [74, 24, '#ff9f5a']];
// the screen position of each flame (for the glow) given the cake's transform: returns [[x, y], ...] for lit candles
function candleFlames(t, o, to) {
  return CANDLES.map(([cx, h0], i) => {
    const falling = i === 3, hh = h0 * (1 - .05 * (o.melt || 0)), fall = o.fall || 0, rot = falling ? (o.lean || 0) * .5 * (1 - fall) + easeIn(fall) * (PI / 2 + .1) : 0;
    if (falling && fall >= .55) return null;
    const lx = cx + Math.sin(rot) * (hh + 12), ly = -128 - Math.cos(rot) * (hh + 12);
    return to(lx, ly);
  }).filter(Boolean);
}
function drawCake(o = {}) {
  const t = o.t || 0, hw = 100, fall = o.fall || 0, lean = o.lean || 0, melt = o.melt || 0, cutX = o.cut ? -hw + o.cut * 2 * hw : -999;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (o.cut) { ctx.beginPath(); ctx.rect(cutX, -260, 400, 300); ctx.clip(); }
  // tray and the cake's front
  ctx.fillStyle = grad(0, -14, 0, 4, [[0, '#eef1f6'], [1, '#aab1be']]); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-hw - 12, -12, 2 * hw + 24, 13, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = grad(0, -50, 0, -12, [[0, '#f8dc96'], [1, '#e2b25c']]); rr(-hw, -50, 2 * hw, 38, 6); ctx.fill(); ctx.stroke();
  if (o.hi) { ctx.fillStyle = 'rgba(160,100,40,.28)'; for (let i = 0; i < 40; i++) { ell(-hw + 6 + hash(i * 2 + 1) * (2 * hw - 12), -48 + hash(i * 2 + 2) * 34, 1.4 + hash(i + 7) * 1.6, 1.1 + hash(i + 3)); ctx.fill(); } }
  ctx.fillStyle = '#d6405e'; ctx.fillRect(-hw + 2, -34, 2 * hw - 4, 7);   // the jam layer
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-hw + 2, -48, 2 * hw - 4, 4);
  // the top face, seen tilted toward us: a trapezoid of pink frosting with a piped border
  const tl = [-hw + 16, -138], tr = [hw - 16, -138], br = [hw - 1, -48], bl = [-hw + 1, -48];
  ctx.beginPath(); ctx.moveTo(...bl); ctx.lineTo(bl[0] + 4, tl[1] + 8); ctx.quadraticCurveTo(tl[0] - 2, tl[1] - 2, tl[0] + 10, tl[1]); ctx.lineTo(tr[0] - 10, tr[1]); ctx.quadraticCurveTo(tr[0] + 2, tr[1] - 2, br[0] - 4, tr[1] + 8); ctx.lineTo(...br); ctx.closePath();
  ctx.fillStyle = grad(0, -140, 0, -48, [[0, '#ffe3ec'], [1, '#ffc2d6']]); ctx.fill(); ctx.stroke();
  if (o.hi) {   // gloss along the upper left and sprinkles round the margins, clear of the lettering
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(-90, -134); ctx.lineTo(-30, -136); ctx.lineTo(-56, -52); ctx.lineTo(-96, -52); ctx.closePath(); ctx.fill(); ctx.restore();
    const cols = ['#ff4f6d', '#4aa8ff', '#ffd23a', '#58c85a', '#ffffff', '#b38cff'];
    for (let i = 0; i < 46; i++) { const x = -88 + hash(i * 3 + 11) * 176, y = -130 + hash(i * 3 + 12) * 72; if (Math.abs(x) < 82 && y > -124 && y < -58) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i + 31) * PI); ctx.fillStyle = cols[i % 6]; rr(-4.2, -1.3, 8.4, 2.6, 1.3); ctx.fill(); ctx.restore(); }
  }
  // scalloped border of piped shells along the front edge and the sides
  ctx.fillStyle = '#fff6fa'; ctx.strokeStyle = 'rgba(190,80,120,.7)'; ctx.lineWidth = 1.6;
  for (let i = 0; i < 14; i++) { const x = lerp(bl[0] + 7, br[0] - 7, i / 13); ell(x, -52, 7.5, 5.5); ctx.fill(); ctx.stroke(); }
  // the frosting words: GOODBYE, then STRAWBER and a gap and Y, with a crooked caret in the gap
  const ink1 = '#5a2d1a', ink2 = '#9a6a4a', M = cakeMetrics();
  const word = (str, x, y, size, rot = 0) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); text(str, -.8, -1.4, { size, font: 'Bangers', weight: 400, fill: ink2, spacing: 1 }); text(str, 0, 0, { size, font: 'Bangers', weight: 400, fill: ink1, spacing: 1 }); ctx.restore(); };
  word('GOODBYE', 0, -108, 30, -.012);
  word('STRAWBER', M.x0 + M.wa / 2, -76, 28, .01); word('Y', M.x0 + M.wa + M.gap + M.wy / 2, -76, 28, .01);
  { const pop = o.pop || 0, s2 = 1 + .5 * pop;   // the caret: two crooked strokes under the gap
    ctx.save(); ctx.translate(M.gapX, M.gapY); ctx.rotate(-.16 + .2 * pop * Math.sin(t * 40)); ctx.scale(s2, s2); ctx.strokeStyle = ink1; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-8.5, 8); ctx.lineTo(.5, -5); ctx.lineTo(9, 7); ctx.stroke(); ctx.restore(); }
  // candles on the back edge, melted down to different heights; one leans and goes over
  CANDLES.forEach(([cx, h0, col], i) => {
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
  if (o.cut) {   // the cut face of the slice that was taken: pale sponge and a bite of frosting
    ctx.save(); ctx.fillStyle = '#fbe9bd'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cutX, -50); ctx.lineTo(cutX + 9, -46); ctx.lineTo(cutX + 9, -12); ctx.lineTo(cutX, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6405e'; ctx.fillRect(cutX, -34, 9, 7); ctx.fillStyle = '#ffe3ec'; ctx.beginPath(); ctx.moveTo(cutX, -50); ctx.lineTo(cutX + 9, -46); ctx.lineTo(cutX + 9, -50); ctx.closePath(); ctx.fill(); ctx.restore();
  }
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
  { const bx0 = -570, bx1 = -400, by0 = 330, by1 = 640, kk = kz(ZB);
    poly([p2(bx0, by0, ZB), p2(bx1, by0, ZB), p2(bx1, by1, ZB), p2(bx0, by1, ZB)], '#20242c', 'rgba(255,255,255,.18)', 2.4);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const [lx, ly] = p2(bx0 + 26 + c * 40, by1 - 30 - r * 42, ZB); ctx.fillStyle = '#3a3f48'; ctx.beginPath(); ctx.ellipse(lx, ly, 11 * kk, 14 * kk, 0, 0, TAU); ctx.fill(); }
    text('CALL LIGHTS', ...p2((bx0 + bx1) / 2, by1 + 40, ZB), { size: 22 * kk, fill: '#3a4556', weight: 900, spacing: 2 }); }
  S6.wallClock(-312, 650, ZB, 0, 50, 10, 40);
  S7.whiteboard(ZB, { x0: -260, x1: 100, y0: 300, y1: 620 }, [
    { t: 'TODAY', x: .05, y: .17, size: .11, color: '#2a5ac8', rot: -.02, p: 1 },
    { t: 'RN: STRAWBERRY', x: .05, y: .36, size: .085, color: '#d62a3a', rot: -.01, p: 1 },
    { t: 'CNA: MANGO', x: .05, y: .53, size: .085, color: '#2a5ac8', rot: -.01, p: 1 },
    { t: 'CAKE @ 10:50', x: .05, y: .74, size: .085, color: '#1f9a52', rot: -.01, p: 1 }]);
  for (const z of [300, 800, 1300]) { ceilingLamp(-300, z, CH, 1, '255,246,220'); ceilingLamp(300, z, CH, 1, '255,246,220'); }
  // the smoke detector on the ceiling over the right side: the end shot's balloon finds it
  S6.detector(DET.x, DET.z, CH, { led: o.led || 0 });
}

// Clem holds a bunch of balloons by their strings; at 30.85 she lets one go, and it floats up to the smoke detector
const REL = { t0: () => B('end').s - .55, bump: () => B('end').s + .1 };
function heldBunch(C, lt) {
  if (!C.clemHand) return;
  const [hx, hy] = C.clemHand, s = C.clemS, rel = lt >= REL.t0();
  for (let i = 0; i < 6; i++) {
    if (i === 2 && rel) continue;   // the one that got away
    const bob = Math.sin(lt * 1.6 + i * 1.3) * 9 * s, sw = Math.sin(lt * 1.1 + i * .9) * 8 * s, x = hx + ((i - 2.5) * 40 + sw) * s, y = hy - (150 + (i % 3) * 60 + (i === 1 || i === 4 ? 36 : 0)) * s + bob, R = 62 * s * .95;
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * s); ctx.beginPath(); ctx.moveTo(hx, hy - 6 * s); ctx.quadraticCurveTo(lerp(hx, x, .5) + 10 * Math.sin(lt + i), lerp(hy, y, .6), x, y + R * 1.06); ctx.stroke();
    balloonAt(x, y, R, BCOL[(i + 3) % 6], s, 0);
  }
}
function floatPos(lt, C) {
  const t0 = REL.t0(), tb = REL.bump(), h = cast(t0), s = h.clemS, [hx, hy] = h.clemHand;
  const x0 = hx + ((2 - 2.5) * 40) * s, y0 = hy - 150 * s - 60 * 0 * s, top = p2(DET.x, CH, DET.z), R = 62 * s * .95, yEnd = top[1] + 52 + R, xEnd = top[0] - 6;
  const u = seg(lt, t0, tb), e = Math.pow(u, 1.5), ph = lt - tb;
  let x = lerp(x0, xEnd, easeOut(u)) + 16 * Math.sin(u * PI * 2.4) * (1 - u), y = lerp(y0, yEnd, e), sq = 0;
  if (ph > 0) { const d = Math.exp(-ph * 3.2); y = yEnd + 34 * Math.sin(ph * 5.5) * d - 6 * (1 - d); x = xEnd + 10 * Math.sin(ph * 1.7) * (1 - d * .5); sq = Math.max(0, Math.sin(clamp(ph / .14) * PI)) * (ph < .3 ? 1 : 0); }
  return { x, y, R, s, sq, ph };
}
function floater(lt, C) {
  if (lt < REL.t0()) return;
  const f = floatPos(lt, C);
  ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * f.s);
  ctx.beginPath(); ctx.moveTo(f.x, f.y + f.R * 1.1); for (let i = 1; i <= 8; i++) ctx.lineTo(f.x + Math.sin(lt * 3 + i * .8) * 7 * i / 8 * f.s, f.y + f.R * 1.1 + i * 20 * f.s); ctx.stroke();
  balloonAt(f.x, f.y, f.R, BCOL[5], f.s, f.sq);
}
// the light pool: the room falls into warm shadow away from the party (a multiply, so the characters drawn after it keep their own light)
function lightPool() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply';
  const g = ctx.createRadialGradient(W / 2, H * .53, 240, W / 2, H * .53, 1250); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(244,234,222,1)'); g.addColorStop(1, 'rgba(176,156,150,1)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// ------------------------------------------------------------------ the party dressing
// hand-lettered marker caps: each letter a little off the line
function marker(str, cx, cy, size, color, seed = 0, o = {}) {
  ctx.save(); ctx.font = `400 ${size}px Bangers`; ctx.letterSpacing = '1px';
  const ws = [...str].map(c => ctx.measureText(c).width + size * .05), tot = ws.reduce((a, b) => a + b, 0); ctx.letterSpacing = '0px'; ctx.restore();
  let x = cx - tot / 2;
  [...str].forEach((c, i) => { ctx.save(); ctx.translate(x + ws[i] / 2, cy + (hash(seed + i * 3) - .5) * size * .08); ctx.rotate((hash(seed + i * 5 + 1) - .5) * .1);
    text(c, 0, 0, { size, font: 'Bangers', weight: 400, fill: color, lw: o.lw || 0, stroke: o.stroke || color }); ctx.restore(); x += ws[i]; });
  return tot;
}
// Persimmon's welcome banner from Episode 9, reused: GOODBYE taped over WELCOME, STRAWBERY (one R short) taped over PERSIMMON
function banner(lt) {
  const Z = 1300, X0 = -400, X1 = 400, Y0 = 700, Y1 = 860, k = kz(Z), wv = x => 3.5 * k * Math.sin(x * .012 + lt * 1.7);
  const tl = p2(X0, Y1, Z), tr = p2(X1, Y1, Z), bl = p2(X0, Y0, Z), br = p2(X1, Y0, Z), BW = tr[0] - tl[0], BH = bl[1] - tl[1];
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(50,40,40,.7)'; ctx.lineWidth = 3; for (const [a, X] of [[tl, X0], [tr, X1]]) { const c = p2(X, CH, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16 * k; ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = grad(0, tl[1], 0, bl[1], [[0, '#e93a8a'], [1, '#b0185f']]);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1] + wv(0)); for (let i = 1; i <= 24; i++) ctx.lineTo(lerp(tl[0], tr[0], i / 24), tl[1] + wv(i * 36)); for (let i = 24; i >= 0; i--) ctx.lineTo(lerp(bl[0], br[0], i / 24), bl[1] + wv(i * 36 + 90)); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = Math.max(4, 8 * k); ctx.stroke();
  // the original print, WELCOME PERSIMMON
  const size = BH * .66, cy = (tl[1] + bl[1]) / 2 + 3;
  ctx.font = `400 ${size}px Bangers`; ctx.letterSpacing = '3px'; const w1 = ctx.measureText('WELCOME').width, w2 = ctx.measureText('PERSIMMON').width; ctx.letterSpacing = '0px';
  const sp = size * .36, tot = w1 + sp + w2, x1c = tl[0] + BW / 2 - tot / 2 + w1 / 2, x2c = x1c + w1 / 2 + sp + w2 / 2;
  text('WELCOME', x1c, cy, { size, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 7 * k, stroke: '#6a0c3a', spacing: 3 });
  text('PERSIMMON', x2c, cy, { size, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 7 * k, stroke: '#6a0c3a', spacing: 3 });
  // the patches: white paper strips held on with tape, the new words in marker
  const patch = (cx, w, h, rot, str, col, seed) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8 * k; ctx.shadowOffsetY = 4 * k; ctx.fillStyle = '#fffdf3'; ctx.strokeStyle = 'rgba(80,60,50,.7)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 2); ctx.lineTo(w / 2 - 3, -h / 2); ctx.lineTo(w / 2, h / 2 - 3); ctx.lineTo(-w / 2 + 4, h / 2); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
    marker(str, 0, 3, size * .94, col, seed);
    ctx.fillStyle = 'rgba(236,222,170,.82)'; ctx.strokeStyle = 'rgba(150,130,80,.5)'; ctx.lineWidth = 1.4;
    for (const [dx, dy, a] of [[-w / 2 + 6, -h / 2 + 5, -.7], [w / 2 - 6, -h / 2 + 4, .7], [-w / 2 + 6, h / 2 - 5, .7], [w / 2 - 6, h / 2 - 4, -.7]]) { ctx.save(); ctx.translate(dx, dy); ctx.rotate(a); ctx.fillRect(-15 * k, -6 * k, 30 * k, 12 * k); ctx.strokeRect(-15 * k, -6 * k, 30 * k, 12 * k); ctx.restore(); }
    ctx.restore();
  };
  patch(x1c, w1 + 30 * k, size * 1.04, -.03, 'GOODBYE', '#16131f', 3);
  patch(x2c, w2 + 30 * k, size * 1.04, .026, 'STRAWBERY', '#1d4fd8', 11);
  // pennants hanging under the banner
  for (let i = 0; i < 12; i++) { const u = (i + .5) / 12, px = lerp(bl[0], br[0], u), py = bl[1] + wv(u * 24 * 36 + 90) + 3; ctx.fillStyle = ['#ffd23a', '#4aa8ff', '#58c85a', '#ff9f1c', '#c25bd6'][i % 5]; ctx.strokeStyle = 'rgba(30,16,36,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - 17 * k, py); ctx.lineTo(px + 17 * k, py); ctx.lineTo(px, py + 38 * k); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
const BCOL = ['#ff4f6d', '#ffd23a', '#4aa8ff', '#58c85a', '#c25bd6', '#ff9f1c'];
function balloon3(x, y, z, col, lt, o = {}) {   // one balloon at world X, Y, Z (Y is the centre)
  const q = p2(x, y, z), kk = kz(z);
  return balloonAt(q[0], q[1], (o.r ?? 62) * kk, col, kk, o.sq || 0);
}
function balloonAt(qx, qy, R, col, kk, sq) {   // one balloon at a screen point: returns where its knot is
  const q = [qx, qy];
  ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(1 + .22 * sq, 1 - .16 * sq); ctx.translate(-q[0], -q[1]);
  ctx.fillStyle = V2.radial(q[0] - R * .3, q[1] - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, col], [1, V2.rgba(V2.mix(col, '#2a1030', .45), 1)]]);
  ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = Math.max(2, 2.6 * kk); ell(q[0], q[1], R * .82, R); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(q[0] - 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0] + 7 * kk, q[1] + R * 1.06); ctx.lineTo(q[0], q[1] + R * 1.0 + 11 * kk); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(q[0] - R * .36, q[1] - R * .46, R * .14, R * .26, -.5); ctx.fill();
  ctx.restore();
  return [q[0], q[1] + R * 1.06, R];
}
// a bunch tied to a weight on the floor: each balloon bobs and sways on its own string
function balloonBunch(Xc, Zc, lt, seed, n = 6) {
  const kk = kz(Zc), w = p2(Xc, 0, Zc), list = [];
  ctx.save(); ctx.fillStyle = '#e9c34c'; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.translate(w[0], w[1]); ctx.scale(kk, kk); rr(-22, -26, 44, 26, 5); ctx.fill(); ctx.stroke(); ctx.restore();
  for (let i = 0; i < n; i++) { const bob = Math.sin(lt * 1.5 + i * 1.3 + seed) * 13, sway = Math.sin(lt * 1.05 + i * .9 + seed) * 9; list.push({ i, x: Xc + (i - (n - 1) / 2) * 34 + sway, y: 400 + (i % 3) * 62 + (i === 1 || i === 4 ? 40 : 0) + bob, z: Zc + (i % 2) * 18 }); }
  list.sort((a, b) => b.z - a.z);
  for (const b of list) {
    const [sx, sy] = balloon3(b.x, b.y, b.z, BCOL[(b.i + Math.floor(seed)) % 6], lt);
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = Math.max(1.6, 2.2 * kz(b.z)); ctx.beginPath(); ctx.moveTo(w[0], w[1] - 24 * kk); ctx.quadraticCurveTo(lerp(w[0], sx, .5) + 16 * Math.sin(lt + b.i), lerp(w[1], sy, .6), sx, sy); ctx.stroke();
  }
}
// string lights swagged along the top of the back wall, chasing
function stringLights(lt) {
  const z = ZB - 30, k = kz(z);
  for (const [a, b, j] of [[-590, -200, 0], [-200, 200, 1], [200, 590, 2]]) {
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([lerp(a, b, u), 872 - 58 * Math.sin(u * PI)]); }
    ctx.strokeStyle = 'rgba(30,26,34,.75)'; ctx.lineWidth = 2.2; ctx.beginPath(); pts.forEach(([x, y], i) => { const q = p2(x, y, z); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke();
    pts.forEach(([x, y], i) => {
      if (i === 0 || i === 12) return;
      const q = p2(x, y - 12, z), col = ['255,90,110', '255,214,90', '90,190,255', '110,230,130', '230,120,255'][(i + j * 2) % 5], on = .6 + .4 * Math.sin(lt * 3.2 - i * .8 + j);
      ctx.fillStyle = `rgba(${col},${.45 + .55 * on})`; ctx.strokeStyle = 'rgba(20,10,30,.7)'; ctx.lineWidth = 1.6; ell(q[0], q[1], 7 * k, 9 * k); ctx.fill(); ctx.stroke();
      V2.glow(q[0], q[1], 40 * k, col, .32 * on, 'screen', .25);
    });
  }
}
// the folding table: a pink plastic cloth, the orange drink, cups, plates; the cake goes on it once Mango sets it down
function tableSet(lt, o = {}) {
  const [X, Z] = MK.table, hw = 150, top = 200;
  box3({ x0: X - hw, x1: X + hw, y1: top, z0: Z - 46, z1: Z + 46, color: '#cfd4dc', top: '#e6e9ee', front: '#bfc5ce', side: '#a4abb6' });
  box3({ x0: X - hw - 8, x1: X + hw + 8, y0: top - 92, y1: top + 5, z0: Z - 52, z1: Z + 52, color: '#ff8fb8', top: '#ffb8d4', front: '#ff9cc2', side: '#df6c98' });
  for (let i = 0; i < 9; i++) { const x = X - hw + 22 + i * 34; onZ(Z - 52, x, x + 3, top - 88, top, 'rgba(160,50,100,.22)'); }
  const kk = kz(Z - 20), base = p2(X, top + 5, Z - 20);
  // sprites standing on the cloth, positions in world X offsets
  const at = dx => [base[0] + dx * kk, base[1]];
  { const [x, y] = at(-110);   // a pitcher of something orange
    ctx.save(); ctx.translate(x, y); ctx.scale(kk, kk); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
    ctx.fillStyle = 'rgba(235,245,255,.55)'; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-34, -96); ctx.lineTo(30, -96); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = grad(0, -80, 0, 0, [[0, '#ffb23a'], [1, '#ff7a1a']]); ctx.beginPath(); ctx.moveTo(-28, -2); ctx.lineTo(-31, -74); ctx.lineTo(28, -74); ctx.lineTo(24, -2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, -84); ctx.bezierCurveTo(56, -86, 56, -22, 26, -22); ctx.stroke(); ctx.strokeStyle = 'rgba(235,245,255,.7)'; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-22, -88, 5, 70); ctx.restore(); }
  for (let i = 0; i < 4; i++) { const [x, y] = at(-20 + i * 36);   // red cups
    ctx.save(); ctx.translate(x, y); ctx.scale(kk, kk); ctx.lineJoin = 'round'; ctx.fillStyle = '#e8283a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-15, -52); ctx.lineTo(15, -52); ctx.lineTo(11, 0); ctx.lineTo(-11, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; rr(-16, -56, 32, 7, 3); ctx.fill(); ctx.stroke(); ctx.restore(); }
  { const [x, y] = at(135); ctx.save(); ctx.translate(x, y); ctx.scale(kk, kk);   // a stack of paper plates and a pack of napkins
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#fbfbf8' : '#ececE6'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ell(0, -4 - i * 5, 50, 9); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffe135'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-130, -22, 52, 20, 3); ctx.fill(); ctx.stroke(); ctx.restore(); }
  if (o.cake) { const [x, y] = at(0); ctx.save(); ctx.translate(x, y - 2); ctx.scale(kk * .9, kk * .9); drawCake({ t: lt, fall: 1, lean: 0, melt: 1, cut: o.cut || 0 }); ctx.restore(); }
}

// ------------------------------------------------------------------ confetti, streamers and the poppers that fire them
// the audio cues inside the open pause (scene-local)
const cue = { on: () => B('open').s + .1, popL: () => B('open').s + .2, cheer: () => B('open').s + .3, popR: () => B('open').s + .35 };
// the two pops come from just outside the frame, left and right (as in the Episode 9 lobby); the origins are in scene coordinates for the wide camera
const PO = { L: [10, 1240], R: [1130, 1240] };
const PCOL = ['#ffaa28', '#50a5ff', '#5ae682', '#ffcd46', '#ff4646', '#ffffff', '#ff7ad9', '#b38cff'];
const CF = { L: { seed: 11, dir: 1, n: 120 }, R: { seed: 29, dir: -1, n: 120 } };
// one piece of confetti at age ta after the burst: a fast climb that drag kills at once, then a flutter down at its own terminal speed
function piece(bu, i, ta, ox, oy) {
  const h = j => hash(bu.seed + i * 7.31 + j * 13.7);
  const spread = .05 + .8 * h(1), v = 950 + 1550 * h(2), tau = .4 + .3 * h(3), vt = 55 + 140 * h(4), vx = bu.dir * Math.sin(spread) * v, vy = -Math.cos(spread) * v;
  const Ax = 14 + 40 * h(5), w = 3 + 5 * h(6), ph = h(7) * TAU, ex = 1 - Math.exp(-ta / tau);
  return [ox + vx * tau * ex + Ax * Math.sin(w * ta + ph) * seg(ta, .12, .55), oy + vt * ta + (vy - vt) * tau * ex];
}
const LAND = {};   // landing time of every piece: a pure function of its constants, so caching it is only a speedup
function landing(key, bu, i, ox, oy) {
  const id = key + ':' + i; let r = LAND[id]; if (r) return r;
  const fy = 1175 + 250 * hash(bu.seed + i * 3.7 + 99);
  r = { fy, tl: 99 };
  for (let ta = .1; ta < 9; ta += .03) if (ta > .4 && piece(bu, i, ta, ox, oy)[1] >= fy) { r.tl = ta; r.x = piece(bu, i, ta, ox, oy)[0]; break; }
  return LAND[id] = r;
}
function confettiBurst(lt, key, t0, ox, oy) {
  const bu = CF[key], ta = lt - t0; if (ta < 0) return;
  if (ta < .5) {   // the bang: a flash and a few puffs of smoke at the corner
    const u = ta / .5; ctx.save();
    if (ta < .12) { ctx.fillStyle = `rgba(255,246,200,${1 - ta / .12})`; ell(ox, oy - 30, 150, 150); ctx.fill(); }
    ctx.fillStyle = `rgba(244,240,250,${.8 * (1 - u)})`; for (let i = 0; i < 6; i++) { const a = -PI / 2 + bu.dir * (.1 + i * .22), r = 40 + 80 * u + i * 8; ell(ox + Math.cos(a) * 110 * u * bu.dir * bu.dir, oy + Math.sin(a) * 150 * u, r, r); ctx.fill(); }
    ctx.restore();
  }
  ctx.save();
  for (let i = 0; i < bu.n; i++) {
    const L = landing(key + Math.round(ox) + ',' + Math.round(oy), bu, i, ox, oy), h = j => hash(bu.seed + i * 7.31 + j * 13.7), col = PCOL[i % PCOL.length], w = 10 + 9 * h(9), hh = 5 + 4 * h(10), ang = h(11) * TAU;
    ctx.fillStyle = col;
    if (ta < L.tl) {
      const [x, y] = piece(bu, i, ta, ox, oy);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang + ta * (2 + 7 * h(12))); ctx.scale(1, Math.cos(ta * (4 + 6 * h(13)) + h(14) * 6)); ctx.fillRect(-w / 2, -hh / 2, w, hh); ctx.restore();
    } else {
      const u = (ta - L.tl) / .24, hop = u < 1 ? 22 * (1 - u) * Math.abs(Math.sin(u * PI * 1.5)) : 0;
      ctx.save(); ctx.translate(L.x + (u < 1 ? 14 * easeOut(u) * (h(15) - .5) : 0), L.fy - hop); ctx.rotate(ang); ctx.scale(1, u < 1 ? .25 + .75 * (1 - u) * Math.abs(Math.cos(u * 9 + i)) : .28); ctx.fillRect(-w / 2, -hh / 2, w, hh); ctx.restore();
    }
  }
  ctx.restore();
}
// the two streamers that leave the right popper and land on Strawberry's cap
function streamerFlight(lt, from, to, t0, dur, col, seed) {
  const u = t => easeIO(clamp((t - t0) / dur)), N = 26, pts = [];
  if (lt < t0 || lt > t0 + dur + .26) return;
  for (let j = 0; j < N; j++) {
    const uj = u(lt - j * .018); if (uj <= 0 && j) break;
    const x = lerp(from[0], to[0], uj), y = lerp(from[1], to[1], uj) - 190 * Math.sin(uj * PI) * (1 - .3 * seed), rip = Math.sin(j * .75 + lt * 22 + seed * 3) * 9 * (1 - uj) * Math.min(1, j / 4);
    pts.push([x + rip * .6, y + rip]);
  }
  if (pts.length < 2) return;
  const fade = 1 - seg(lt, t0 + dur, t0 + dur + .26);
  ctx.save(); ctx.globalAlpha *= fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [lw, c] of [[11, INK], [8, col]]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2.4; ctx.setLineDash([6, 12]); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ the cast
// where each named character goes: Strawberry in from the door, Mango back to the table with the cake and out again with the card, Lemon over to Strawberry with the can
const ROUTE = {
  straw: lt => route([[0, MK.door[0], MK.door[1]], [B('m1').s - .05, MK.door[0], MK.door[1]], [B('m1').s + 1.0, MK.straw[0], MK.straw[1], 'io'], [END_AT(), MK.straw[0], MK.straw[1]]])(lt),
  mango: lt => route([[0, MK.mango[0], MK.mango[1]], [B('m2').e + .02, MK.mango[0], MK.mango[1]], [B('l1').s + 1.0, -5, 1395, 'io'], [B('l2').s + .3, -5, 1395], [B('m3').s - .1, 60, 1250, 'io'], [B('m5').s - 1.0, 60, 1250], [B('m5').s - .05, 175, 1235, 'io'], [END_AT(), 175, 1235], [END_AT() + .01, 215, 1250]])(lt),
  lemon: lt => route([[0, MK.lemon[0], MK.lemon[1]], [B('m2').e + .02, MK.lemon[0], MK.lemon[1]], [B('l1').s + .55, -250, 1345, 'io'], [B('l1').s + 1.25, 30, 1345], [B('l1').s + 1.9, 130, 1250, 'io'], [B('coins').e + .1, 130, 1250], [B('m4').s, -20, 1260, 'io'], [END_AT(), -20, 1260], [END_AT() + .01, -415, 1250]])(lt),
};
const END_AT = () => B('l4').e + .08;   // from here on it is the end of the party: plates, a time jump
const NAMED = ['lemon', 'cran', 'mango', 'straw'];
const CROWD = [   // soft neighbours: constructor, mark, accessories, hat and a phase. They stand behind and left of the named cast; the right of the room belongs to Strawberry
  { id: 'banana', ctor: banana, at: [-545, 1340], acc: [], hat: { c1: '#4aa8ff', c2: '#ffffff', rot: .3 }, ph: .3 },
  { id: 'pine', ctor: pine, at: [-335, 1400], acc: ['chain'], ph: 1.1 },
  { id: 'apple', ctor: apple, at: [-120, 1420], acc: ['nightcap'], ph: 2.0 },
  { id: 'papaya', ctor: papaya, at: [125, 1410], acc: ['visor'], ph: 2.6 },
  { id: 'pear', ctor: pear, at: [-10, 1450], acc: [], hat: { c1: '#c25bd6', c2: '#ffe135', rot: .2 }, ph: 1.7 },
  { id: 'goji', ctor: goji, at: [-460, 1270], acc: [], hat: { c1: '#58c85a', c2: '#ffffff', s: .8 }, ph: .8 },
  { id: 'clem', ctor: clem, at: [545, 1390], acc: ['pricetag'], hat: { c1: '#ffe135', c2: '#ff4f9a', rot: -.3, dx: -.3 }, ph: 3.3 },
];
const gaze = (o, tx, ty = 0) => [clamp((tx - o.x) / 360, -1, 1) * .9, ty];
const tri = (lt, a, b, c) => lt < b ? seg(lt, a, b) : 1 - seg(lt, b, c);   // 0 -> 1 -> 0 over a..b..c

function cast(lt) {
  const b = id => B(id), q = (X, Z) => V2.at(X, Z), tOn = cue.on(), ending = lt >= END_AT();
  const C = {};
  const shk = Math.sin(lt * 15);
  const tq = wordT('s3', 'q-word', b('s3').s + 2.44);   // the Q-word, said
  // ---- Strawberry: in the doorway, then to her mark
  { const blink = pulse(lt, .75, 1.15), hit = pulse(lt, .9, 1.2);
    const E = pick(lt, [[b('s2').s - .05, 'dead'], [b('s2').e + .1, 'sour'], [b('l2').s + 1.0, 'dead'], [b('coins').s, 'sour'], [b('m5').s, 'dead'], [b('s4').s + .3, 'chill'], [b('s5').s, 'chill'], [b('l4').s, 'sour'], [END_AT(), 'dead'], [1e9, 'chill']]);
    const look = lt < b('m1').s ? [-.55, 0] : lt < b('l1').s ? [-.75, .1] : lt < b('m3').s ? [-.8, .05] : lt < b('m4').s ? [-.9, 0] : inB(lt, 's3') ? (lt > tq - .1 && lt < tq + .5 ? [0, 0] : [-.5, .05]) : lt < b('l3').s ? [-.8, 0] : [-.7, 0];
    const palm = tri(lt, b('s2').e, b('l2').s + .8, b('coins').s + .1), s3 = inB(lt, 's3');
    C.straw = person(straw, ROUTE.straw, lt, { stride: 40, look, expr: E, lid: lt < 2 ? lerp(.5, 1, blink) : E === 'sour' ? .5 : undefined, rot: .03 * hit * (lt < 2 ? 1 : 0), arms: { l: 'rest', r: 'rest' },
      acc: ['steth', 'bandage7', 'streamer10', ...(ending ? ['partyhat10'] : [])], hat: { c1: '#ff4f9a', c2: '#ffe135', rot: .5, dx: .45, dy: 1.45, s: .8 }, drape: seg(lt, .95, 1.25), transit: lt < b('s1').s - .2 });
    if (palm > .02 && lt < b('m3').s) { C.straw.arms.l = 'hold'; C.straw.grip = { l: [lerp(-60, -92, easeOut(palm)), lerp(40, 62, easeOut(palm))] }; C.straw.hand = { l: 'flat' }; }
    if (s3) {   // she gives the directions with a hand: out for the closet, a finger up for the shelf, an open hand at the Q-word
      const g1 = seg(lt, b('s3').s + .3, b('s3').s + .75), g2 = seg(lt, b('s3').s + 1.25, b('s3').s + 1.6), g3 = seg(lt, tq - .1, tq + .15), gOut = seg(lt, b('s3').e - .15, b('s3').e + .2);
      const gx = lerp(lerp(lerp(70, 128, g1), 100, g2), 118, g3), gy = lerp(lerp(lerp(70, 14, g1), -52, g2), 4, g3), a = 1 - gOut;
      if (a > .01) { C.straw.arms.r = 'hold'; C.straw.grip = Object.assign(C.straw.grip || {}, { r: [lerp(70, gx, a), lerp(70, gy, a)] }); C.straw.hand = Object.assign(C.straw.hand || {}, { r: g2 > .5 && g3 < .5 ? 'point' : 'open' }); }
    }
    if (ending) { C.straw.hold = { r: 'plate10' }; C.straw.arms.r = 'hold'; C.straw.grip = { r: [96, 70] }; C.straw.hand = { r: 'flat' }; C.straw.platePose = 1; }
    if (lt >= b('s4').s + .25 && lt < b('l3').s) C.straw.face = { curve: .95, lid: .4 };   // the tiny smile
  }
  // ---- Mango: the cake in her right hand, held out to Strawberry; later the card; then crying
  { const jump = pulse(lt, tOn, tOn + .4) * 38, hasCake = lt < b('l1').s + .85, hasCard = lt >= b('l2').s + .4 && lt < b('r1').s, cry = ending ? .6 : clamp(seg(lt, b('m4').s + .4, b('m5').s + .2) * .55 + seg(lt, b('m5').s, b('s4').s + .6) * .45);
    const exprM = pick(lt, [[b('m2').s + .6, 'happy'], [b('l1').s, 'happy'], [b('m4').s, 'happy'], [b('m5').s + .55, 'sad'], [b('s4').s + .25, 'sad'], [b('l3').s, 'happy'], [1e9, 'sad']]);
    const freeze = tri(lt, b('m2').s + .5, b('m2').s + .75, 99) * (lt < b('l1').s ? 1 : 0), lipQ = inB(lt, 'm5') || (lt >= b('m5').e && lt < b('s4').s + .4);
    C.mango = person(mango, ROUTE.mango, lt, { look: lt < b('m2').s + .5 ? [.7, 0] : lt < b('l1').s ? [.9, .1 + .15 * Math.sin(lt * 9)] : lt < b('m5').s ? [-.2, 0] : [.8, 0], expr: ending ? 'sad' : exprM, hat: { c1: '#ff4f9a', c2: '#ffe135' }, lift: jump, cry, stride: 40,
      acc: ['badge7', 'gaitbelt7', 'keys7', 'partyhat10', 'tears10'],
      hold: hasCake ? { r: 'cake10' } : hasCard ? { r: 'card10' } : ending ? { r: 'plate10' } : {}, grip: { r: hasCake ? [CAKE.dx, CAKE.dy] : hasCard ? [150, 84] : ending ? [96, 70] : [70, 70] }, hand: { r: hasCake ? 'flat' : ending ? 'flat' : 'grip' },
      arms: { l: lt < 1.6 ? 'cheer' : 'rest', r: hasCake || hasCard || ending ? 'hold' : 'rest' },
      cakeMelt: seg(lt, 0, 6), cakeLean: lerp(.05, .5, seg(lt, 1.0, 4.1)), cakeFall: seg(lt, 4.1, 4.6), cakePop: pulse(lt, 3.4, 3.85), cakeTilt: .04 * Math.sin(lt * 9) * pulse(lt, tOn, tOn + .6) });
    if (freeze > .02) { C.mango.face = { wide: lerp(1, 1.26, freeze), pup: lerp(1, .5, freeze), curve: 1 }; C.mango.acc = [...C.mango.acc, 'sweat']; }
    if (lt >= b('m3').s - .1 && lt < b('card').s) C.mango.hat.rot = .36 + .05 * Math.sin(lt * 6);
    if (lt >= b('m4').s && !ending) {   // hands clasped at the chest, then a wipe at the eye
      C.mango.arms = { l: 'hold', r: 'hold' }; C.mango.grip = { l: [-32, 92], r: [32, 92] }; C.mango.hand = { l: 'grip', r: 'grip' }; C.mango.hold = {};
      if (lt >= b('l3').s) { C.mango.shake = 1.4 * cry; }
    }
    if (lt >= b('m5').s - .3 && !ending) { const t0 = b('m5').s + .4, d = pulse(lt, t0, t0 + .7); C.mango.face = Object.assign(C.mango.face || {}, { curve: lerp(-.75, -.5 + .25 * Math.sin(lt * 31), lipQ ? .8 : .2) }); void d; }
  }
  // ---- Lemon: a blower in her mouth, the can, the reports, then a plate
  { const jump = pulse(lt, tOn, tOn + .4) * 30, blow = seg(lt, .3, .52) * (1 - seg(lt, .95, 1.25)), hasCan = lt >= b('m2').e && lt < b('coins').e, hasRep = lt >= b('l3').s - .05 && !ending, canUp = tri(lt, b('l2').s + .9, b('l2').s + 1.35, b('l2').s + 1.8) * 40;
    const tilt = CAN_TILT(lt);
    C.lemon = person(lemon, ROUTE.lemon, lt, { look: lt < b('m2').s ? [.5, 0] : lt < b('l1').s + 1.9 ? [.85, 0] : [.9, .05], expr: ending ? 'neutral' : 'neutral', lid: inB(lt, 'l4') || inB(lt, 'l3') ? .22 : undefined, hat: { c1: '#4aa8ff', c2: '#ffe135', rot: -.25, dx: -.3 }, acc: ['readers', 'lanyard7', 'partyhat10', 'blower10'], blow, lift: jump, stride: 36,
      hold: hasCan ? { r: 'can10' } : hasRep ? { r: 'reports10' } : ending ? { r: 'plate10' } : {}, grip: { r: hasCan ? [128, 66 - canUp] : hasRep ? [142, 64 - 30 * tri(lt, b('l3').s + .85, b('l3').s + 1.1, b('l3').s + 1.5) - 34 * tri(lt, b('l4').s + .75, b('l4').s + 1.0, 99)] : ending ? [96, 70] : [128, 66] },
      hand: { r: hasRep ? 'flat' : hasCan ? 'grip' : 'flat' }, canTilt: tilt, arms: { l: 'rest', r: hasCan || hasRep || ending ? 'hold' : 'rest' } });
    if (ending) C.lemon.plateCake = true;
  }
  // ---- Mrs. Cranberry, in the wheelchair, waving her flag
  { const X = ending ? -250 : MK.cran[0], p = q(X, MK.cran[1]), jump = pulse(lt, tOn, tOn + .4) * 20, slow = lt >= b('r1').s - .1 && lt < b('m4').s, wv = Math.sin(lt * 3.1) * .22;
    const cry = ending || lt >= b('m5').s ? clamp(seg(lt, b('m5').s, b('l3').s)) * .8 : 0;
    C.cran = cran({ x: p.x, y: p.y - 118 * p.s, s: p.s, noLegs: true, noShadow: true, noReflect: true, look: lt >= b('r1').s - .1 && lt < b('m4').s ? [.1, 0] : [.5, 0], expr: lt >= b('m5').s ? 'sad' : 'happy', lift: jump, cry, hat: { c1: '#58c85a', c2: '#ffffff', rot: .3, s: .85 }, acc: ['curlers', 'glasses', 'partyhat10', 'tears10'],
      hold: ending ? { r: 'plate10' } : { r: 'flag10' }, flagWave: slow ? wv * .5 : .12 * Math.sin(lt * 5), arms: { l: 'rest', r: ending ? 'hold' : slow ? [2.2 + wv, .5] : 'cheer' }, grip: ending ? { r: [86, 64] } : undefined, hand: ending ? { r: 'flat' } : undefined });
    C.cranQ = p; }
  // ---- the crowd: they hop for the surprise, watch the speaker, lean in for the directions, flinch at the Q-word, cry at the end
  C.crowd = CROWD.map((c, i) => {
    const p0 = q(...c.at), cheering = lt < 1.5, hop = lt < tOn ? 0 : Math.abs(Math.sin((lt - tOn) * 5 + i * .9)) * 46 * (1 - seg(lt, 1.0, 1.5));
    const lean = seg(lt, b('s3').s + .2, b('s3').s + 1.0) * (1 - seg(lt, b('s3').e, b('s3').e + .5)), flinch = pulse(lt, tq, tq + .55), dir = Math.sign(MK.straw[0] - c.at[0]);
    const watch = ending ? 560 : inB(lt, 'r1') ? MK.cran[0] : (lt >= b('m4').s && lt < b('s3').s) ? 40 : lt >= b('s3').s - .6 && lt < b('m5').s ? MK.straw[0] : lt >= b('m5').s && lt < b('l3').s ? 120 : lt >= b('l3').s ? -10 : 200;
    const cry = lt >= b('m5').s + .2 ? clamp(seg(lt, b('m5').s + .2, b('l3').s) * (.6 + .4 * hash(i + 4)) + (ending ? .3 : 0)) : 0;
    const o = c.ctor(Object.assign(p0, { look: gaze(p0, 540 + watch * 1.12), expr: flinch > .1 ? 'shock' : cry > .3 ? 'sad' : lean > .5 ? 'hopeful' : 'happy', who: null, acc: [...c.acc, ...(c.hat ? ['partyhat10'] : []), 'tears10'], hat: c.hat, cry, lift: hop + flinch * 12, s: p0.s * 1.12,
      rot: dir * (.07 * lean) - dir * .1 * flinch, arms: { l: cheering ? 'cheer' : 'rest', r: cheering ? 'cheer' : 'rest' }, t: lt + c.ph, mouthOpen: lt < 1.4 && lt > tOn ? .55 * Math.abs(Math.sin(lt * 11 + i)) : flinch > .2 ? .5 : 0 }));
    if (c.id === 'clem') { o.grip = { r: [86, -100] }; o.arms.r = 'hold'; o.hand = { r: 'grip' }; C.clemHand = localToScreen(o, 86, -100); C.clemS = o.s; }
    else if (ending && i % 2 === 0) { o.hold = { r: 'plate10' }; o.grip = { r: [92, 66] }; o.arms.r = 'hold'; o.hand = { r: 'flat' }; }
    return o;
  });
  return C;
}
const pick = (lt, list) => list.find(([e]) => lt < e)[1];   // the first entry whose end time is still ahead of lt

// ------------------------------------------------------------------ shots
const SHOTS = () => { const b = id => B(id); return [
  ['wide', b('m1').s - .05], ['cakeTwo', b('s1').s - .05], ['cakeIns', b('m2').s - .05], ['cuM1', b('m2').e], ['cuS0', b('l1').s - .06],
  ['cuL1', b('s2').s - .06], ['cuS1', b('l2').s - .05], ['cuL2', b('coins').s - .55], ['twoSL', b('coins').s - .03], ['coinsIns', b('m3').s - .03],
  ['medM', b('card').s - .04], ['cardIns', b('r1').s - .04], ['cuC', b('m4').s - .02], ['cuM2', b('s3').s - .85], ['medS', b('m5').s - .07],
  ['warm', b('l3').s - .02], ['cuL3', b('s5').s - .12], ['cuS5', b('l4').s - .12], ['threeL', b('l4').e + .08], ['cuS6', b('end').s - .03], ['endWide', 1e9]]; };
const shotOf = lt => { const o = SHOTS(); let t0 = 0; for (const [n, e] of o) { if (lt < e) return { n, t0, t1: Math.min(e, CUR.dur) }; t0 = e; } return { n: 'endWide', t0, t1: CUR.dur }; };
// who is in focus in each shot: the rest of the named cast is a soft neighbour, like the crowd
const CRISP = { cakeTwo: ['mango', 'straw'], cuM1: ['mango'], cuS0: ['straw'], cuL1: ['lemon'], cuS1: ['straw'], cuL2: ['lemon'], twoSL: ['lemon', 'straw'], medM: ['mango'], cuC: ['cran'], cuM2: ['mango'],
  medS: ['straw', 'mango'], warm: ['mango', 'straw'], cuL3: ['lemon'], cuS5: ['straw'], threeL: ['lemon', 'mango', 'cran'], cuS6: ['straw'] };
const INS = {};   // full-frame inserts, filled in below
const WIDE = ['wide', 'endWide'];
const toScr = (x, y) => [W / 2 + (x - CAM.x) * CAM.z, H / 2 + (y - CAM.y) * CAM.z];
const F = (o, z, up = 150) => faceZoom({ kind: o.kind, x: o.x, y: o.y, s: o.s, lift: o.lift, noLegs: o.noLegs }, z, up);
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function cameraFor(lt, sh, C) {
  const k = seg(lt, sh.t0, sh.t1), b = id => B(id);
  V2.setCam({ f: 1400, cy: 360, hy: 860 });
  switch (sh.n) {
    case 'wide': zoomTo(lerp(600, 590, k), 1020, lerp(.86, .9, k)); break;
    case 'cakeTwo': { const z = lerp(1.4, 1.6, k), m = mid(faceC(C.mango), faceC(C.straw)); zoomTo(m[0] + 20, m[1] + 120 / z, z); break; }
    case 'cuM1': F(C.mango, lerp(1.85, 2.0, k), 150); CAM.x += 105; break;
    case 'cuS0': F(C.straw, lerp(1.95, 2.05, k), 180); break;
    case 'cuL1': F(C.lemon, lerp(1.85, 2.0, k), 190); break;
    case 'cuS1': F(C.straw, lerp(2.0, 2.15, k), 180); break;
    case 'cuL2': F(C.lemon, lerp(2.0, 2.25, k), 180); break;
    case 'twoSL': { const z = 1.45, m = mid(faceC(C.lemon), faceC(C.straw)); zoomTo(m[0], m[1] + 130 / z, z); break; }
    case 'medM': F(C.mango, lerp(1.7, 1.85, k), 130); CAM.x += 70; break;
    case 'cuC': F(C.cran, lerp(1.95, 2.15, k), 180); break;
    case 'cuM2': F(C.mango, lerp(2.1, 2.3, k), 170); break;
    case 'medS': { const s3 = b('s3'), e = easeIO(seg(lt, s3.e - .6, sh.t1 - .02)), z0 = 1.95 + .07 * seg(lt, sh.t0, s3.e - .6), f = faceC(C.straw); zoomTo(lerp(f[0] + 105, 800, e), lerp(f[1] + 190 / z0, 1000, e), lerp(z0, 1.2, e)); break; }
    case 'warm': { const z = lerp(1.55, 1.8, k), m = mid(faceC(C.mango), faceC(C.straw)); zoomTo(m[0], m[1] + 160 / z, z); break; }
    case 'cuL3': F(C.lemon, lerp(1.85, 1.95, k), 180); break;
    case 'cuS5': F(C.straw, lerp(2.05, 2.15, k), 180); break;
    case 'threeL': { const z = lerp(1.08, 1.14, k), m = mid(faceC(C.cran), faceC(C.mango)); zoomTo(m[0] + 20, m[1] + 130 / z, z); break; }
    case 'cuS6': F(C.straw, lerp(2.1, 2.2, k), 170); break;
    case 'endWide': zoomTo(lerp(590, 585, k), 1020, lerp(.88, .86, k)); break;
    default: zoomTo(540, 960, 1);
  }
}

// ------------------------------------------------------------------ inserts: macro shots of the cake, the coins and the card, over party bokeh
const CUFF = '#4a4258';
function bigHand(x, y, ang, S, kind, side = 1) {   // a glove with its cuff at (x, y), fingers along ang: the cast's own glove art, scaled up
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); if (side < 0) ctx.scale(1, -1); ctx.scale(S, S);
  ctx.fillStyle = CUFF; ctx.beginPath(); ctx.roundRect(-8, -8.5, 10, 17, 3); ctx.fill();
  V2C.hand(kind, side, {});
  ctx.restore();
}
function bigArm(from, to, ang, S, kind, side = 1, bend = 60, wid = [17, 14.5, 12.5]) {   // a tapered dark arm from a point off the frame to a glove at `to`
  const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2, nx = -(to[1] - from[1]), ny = to[0] - from[0], L = Math.hypot(nx, ny) || 1;
  V2C.limb([from, [mx + nx / L * bend * side, my + ny / L * bend * side], to], wid.map(q => q * S * .9), LIMB);
  bigHand(to[0], to[1], ang, S, kind, side);
}
function macroBg(lt, o = {}) {
  A6.bokeh(lt, ['255,120,190', '255,214,90', '90,190,255', '110,230,130'], o.base || ['#2a1030', '#5a1c4c']);
  ctx.save(); for (let i = 0; i < 22; i++) {   // out-of-focus confetti drifting past
    const u = ((lt * (.05 + .05 * hash(i)) + hash(i + 11)) % 1), x = hash(i + 3) * W + 40 * Math.sin(lt * .8 + i), y = lerp(-60, 1500, u), w = 26 + 30 * hash(i + 5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(lt * (.6 + hash(i)) + i); ctx.scale(1, Math.cos(lt * 1.2 + i)); ctx.globalAlpha = .22; ctx.fillStyle = PCOL[i % PCOL.length]; ctx.fillRect(-w / 2, -w / 4, w, w / 2); ctx.restore();
  } ctx.restore();
}

// ---- the cake, full frame: Mango's glove under the tray, the leaning candle, and Strawberry's finger finding the gap
INS.cakeIns = (lt, C, sh) => {
  const b = id => B(id), k = seg(lt, sh.t0, sh.t1), S = lerp(3.85, 4.3, easeIO(k)), cx = 540, rot = .045;
  const tR = wordT('s1', 'r', b('s1').s + .68), tap = pulse(lt, tR - .03, tR + .1) + pulse(lt, tR + .14, tR + .27), pop = pulse(lt, tR, tR + .55);
  const cy = lerp(1105, 1088, k) + 7 * tap;
  macroBg(lt);
  const to = (lx, ly) => { const c = Math.cos(rot), s2 = Math.sin(rot); return [cx + (lx * c - ly * s2) * S, cy + (lx * s2 + ly * c) * S]; };
  const M = cakeMetrics(), o = { t: lt, hi: true, fall: seg(lt, 4.1, 4.6), lean: lerp(.05, .5, seg(lt, 1.0, 4.1)), melt: seg(lt, 0, 6), pop };
  // Mango's arm comes up from the lower left and her glove holds the tray from beneath
  { const h = to(60, 8); bigArm([-120, 1700], [h[0], h[1] + 46], -.18, 4.0, 'flat', 1, -90); }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(S, S); drawCake(o); ctx.restore();
  for (const [x, y] of candleFlames(lt, o, to)) V2.glow(x, y - 10, 170, '255,196,110', .5, 'screen', .5);
  // Strawberry's pointing glove slides in from the right and taps the gap
  { const g = to(M.gapX, M.gapY), enter = easeOut(seg(lt, b('s1').s + .12, b('s1').s + .62)), ang = PI - .1, S2 = 4.1;
    const tip = [44 * S2, 5.6 * S2], R = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)], off = R(tip, ang);
    const tx = g[0] + 26 - 20 * tap - off[0] + (1 - enter) * 620, ty = g[1] + 6 + 10 * tap - off[1] - (1 - enter) * 180;
    bigArm([tx + 700, ty - 420], [tx, ty], ang, S2, 'point', -1, 70);
    if (pop > .02) {   // the ping lines round the caret
      ctx.save(); ctx.strokeStyle = `rgba(255,248,200,${pop})`; ctx.lineWidth = 7; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const a = -PI * .95 + i * PI * .3, r0 = 40 + 40 * (1 - pop), r1 = r0 + 34; ctx.beginPath(); ctx.moveTo(g[0] + Math.cos(a) * r0, g[1] + Math.sin(a) * r0 * .8); ctx.lineTo(g[0] + Math.cos(a) * r1, g[1] + Math.sin(a) * r1 * .8); ctx.stroke(); }
      ctx.restore();
    }
  }
};

// ---- the coins, full frame: the can tips over Strawberry's palm; eight coins and four wrinkled singles with real bounce, spin and settle; a counter ticks to $4.17
const CAN_TILT = lt => seg(lt, B('coins').s - .55, B('coins').s + .2) * 1.7 * (1 - seg(lt, B('coins').s + .5, B('coins').s + .9));
const COINS = [   // [kind, rest x, rest y (relative to the pile)]
  ['dime', -34, -10], ['penny', -88, 0], ['penny', 32, 0], ['penny', 88, 0], ['penny', -60, -20], ['penny', 2, -22], ['penny', 60, -20], ['penny', -2, -42]];
const BILLS = [[-62, -62, -.35], [54, -68, .28], [-8, -96, .1], [24, -116, -.2]];
const CVAL = { dime: 10, penny: 1 };
const MACRO = { wrist: [990, 1238], S: 6.3, pile: [868, 1168], can: [450, 850], canS: 3.1 };
function coinShape(x, y, r, kind, spin, sq = .4) {   // a coin: an ellipse whose width follows its tumble, a rim and a bit of relief
  const cos = Math.abs(Math.cos(spin)), rx = Math.max(3, r * cos), ry = r * (sq + (1 - sq) * (1 - cos));
  const c1 = kind === 'dime' ? ['#f4f6fa', '#aeb6c4', '#6a7284'] : ['#e8a066', '#c0733a', '#7a3f18'];
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = 4.2; ctx.strokeStyle = INK;
  ctx.fillStyle = c1[2]; ell(0, 6, rx, ry); ctx.fill(); ctx.stroke();   // the edge
  ctx.fillStyle = V2.radial(-rx * .3, -ry * .3, 1, rx * 1.2, [[0, c1[0]], [.6, c1[1]], [1, c1[2]]]); ell(0, 0, rx, ry); ctx.fill(); ctx.stroke();
  if (cos > .4) { ctx.strokeStyle = 'rgba(40,20,10,.35)'; ctx.lineWidth = 2.4; ell(0, 0, rx * .72, ry * .72); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(-rx * .34, -ry * .32, rx * .16, ry * .12); ctx.fill(); }
  ctx.restore();
}
function crumpledBill(x, y, rot, sc, k = 1) {   // a wrinkled one-dollar bill: an uneven green sheet with creases
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc * .8); ctx.lineJoin = 'round';
  const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, rx = 54 + 10 * Math.sin(a * 3 + k * 7), ry = 30 + 7 * Math.cos(a * 2 + k * 3); pts.push([Math.cos(a) * rx, Math.sin(a) * ry]); }
  ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath();
  ctx.fillStyle = grad(-50, -30, 50, 30, [[0, '#b6d8b2'], [.5, '#8fc08c'], [1, '#6fa56f']]); ctx.fill(); ctx.strokeStyle = '#2f5a3c'; ctx.lineWidth = 3.4; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(40,80,50,.5)'; ctx.lineWidth = 2.2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-60 + hash(i * 4 + k) * 120, -34); ctx.lineTo(-60 + hash(i * 4 + k + 1) * 120, 34); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-50 + hash(i + k * 3) * 100, -26); ctx.lineTo(-50 + hash(i + k * 3 + 5) * 100, 26); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(40,80,50,.55)'; ell(0, 0, 17, 12); ctx.fill(); text('1', -38, -3, { size: 22, font: 'Bangers', weight: 400, fill: '#2f5a3c' }); text('1', 38, 5, { size: 22, font: 'Bangers', weight: 400, fill: '#2f5a3c' });
  ctx.restore();
}
function coinPlan(i, t0) {   // the plan of coin i: release time, release point, rest point, fall time, bounce
  const [, rx, ry] = COINS[i], r0 = t0 + .03 * i, th = CAN_TILT(r0), P = MACRO.can, S = MACRO.canS, m = [P[0] + Math.sin(th) * 128 * S, P[1] - Math.cos(th) * 128 * S];
  const rest = [MACRO.pile[0] + rx, MACRO.pile[1] + ry - 8], g = 7600, dy = rest[1] - m[1], T = (-30 + Math.sqrt(900 + 2 * g * dy)) / g;
  return { r0, m, rest, T, vx: (rest[0] - m[0]) / T, g };
}
function billPlan(j, t0) {   // the singles slide out last and flop onto the pile
  const r0 = t0 + .17 + .075 * j, th = CAN_TILT(r0), P = MACRO.can, cs = MACRO.canS, m = [P[0] + Math.sin(th) * 128 * cs, P[1] - Math.cos(th) * 128 * cs];
  const rest = [MACRO.pile[0] + BILLS[j][0], MACRO.pile[1] + BILLS[j][1] - 10], g = 5200, dy = rest[1] - m[1], T = (-20 + Math.sqrt(400 + 2 * g * dy)) / g;
  return { r0, m, rest, T, vx: (rest[0] - m[0]) / T, g };
}
INS.coinsIns = (lt, C, sh) => {
  const b = id => B(id), t0 = b('coins').s + .1, S = MACRO.S, th = CAN_TILT(lt), P = MACRO.can, w = MACRO.wrist, cs = MACRO.canS;
  macroBg(lt, { base: ['#2a1030', '#4a2058'] });
  const items = [];   // coins and bills, each with its own state; the pile grows as they land
  let value = 0, sag = 0, last = -9, allIn = 0;
  const coinState = i => {
    const pl = coinPlan(i, t0), ta = lt - pl.r0; if (ta < 0) return null;
    const kind = COINS[i][0], r = kind === 'dime' ? 29 : 34, spin0 = 9 + 4 * hash(i), spinAt = a => spin0 * a * Math.max(0, 1 - a / (pl.T + .5));
    if (ta < pl.T) return { x: pl.m[0] + pl.vx * ta, y: pl.m[1] + 30 * ta + .5 * pl.g * ta * ta, r, kind, spin: spinAt(ta), sq: .4, air: true };
    const u = ta - pl.T, bounce = u < .26 ? 44 * (1 - u / .26) * Math.abs(Math.sin(u / .26 * PI * 1.5)) : 0, settle = seg(u, .26, .5);
    return { x: pl.rest[0] + (u < .26 ? 9 * Math.sin(u * 24) * (1 - u / .26) : 0), y: pl.rest[1] - bounce, r, kind, spin: lerp(spinAt(pl.T + u), 0, settle), sq: .4, air: false, landed: true };
  };
  for (let i = 0; i < COINS.length; i++) {
    const pl = coinPlan(i, t0), land = pl.r0 + pl.T; allIn = Math.max(allIn, land);
    if (lt >= land) { value += CVAL[COINS[i][0]]; last = Math.max(last, land); }
    const st = coinState(i); if (st) { items.push(st); if (st.landed && lt - land < .22) sag = Math.max(sag, 6 * Math.sin((lt - land) / .22 * PI)); }
  }
  const bills = [];
  for (let j = 0; j < 4; j++) {
    const pl = billPlan(j, t0), ta = lt - pl.r0, land = pl.r0 + pl.T; allIn = Math.max(allIn, land);
    if (lt >= land) { value += 100; last = Math.max(last, land); }
    if (ta < 0) continue;
    if (ta < pl.T) bills.push({ x: pl.m[0] + pl.vx * ta, y: pl.m[1] + 20 * ta + .5 * pl.g * ta * ta, rot: BILLS[j][2] + ta * 7 * (j % 2 ? 1 : -1) * (1 - ta / pl.T), sc: lerp(.9, 1.25, ta / pl.T), k: j + 1 });
    else { const u = ta - pl.T, bnc = u < .2 ? 22 * (1 - u / .2) * Math.abs(Math.sin(u / .2 * PI * 1.5)) : 0; bills.push({ x: pl.rest[0], y: pl.rest[1] - bnc, rot: BILLS[j][2], sc: 1.25, k: j + 1 }); if (u < .22) sag = Math.max(sag, 8 * Math.sin(u / .22 * PI)); }
  }
  // Strawberry's arm and open palm (a left hand, fingers toward the left): it sags a little with each landing
  bigArm([w[0] + 760, w[1] + 520], [w[0], w[1] + sag], PI, S, 'flat', -1, 110);
  // the pile: coins that have landed, drawn low to high, then the bills on top
  const landed = items.filter(it => it.landed).sort((p, q) => p.y - q.y).reverse();
  for (const it of landed) coinShape(it.x, it.y + sag, it.r, it.kind, it.spin, .4);
  for (const bl of bills.slice().sort((p, q) => q.y - p.y)) crumpledBill(bl.x, bl.y + sag, bl.rot, bl.sc, bl.k);
  for (const it of items.filter(q => q.air)) coinShape(it.x, it.y, it.r, it.kind, it.spin, .4);
  // Lemon's can and her glove on it: it tips over the palm, rattles while the money leaves, then she draws it back out of the frame
  const out = seg(lt, t0 + .38, t0 + .7) ** 2, pour = seg(lt, t0 - .1, t0 + .1) * (1 - seg(lt, t0 + .4, t0 + .5)), Pc = [P[0] - 760 * out, P[1] + 60 * out], thc = th + .018 * Math.sin(lt * 74) * pour;
  ctx.save(); ctx.translate(Pc[0], Pc[1]); ctx.rotate(thc); ctx.scale(cs, cs); EXT.prop.can10(1, {}, lt); ctx.restore();
  bigArm([Pc[0] - 260, Pc[1] - 560], [Pc[0] - 6, Pc[1] - 12], .9 + th * .25, 3.6, 'grip', 1, -80);
  // the counter: a plaque that pops up as the pour starts, ticks with every landing and pulses on the last
  const k = easeBack(seg(lt, t0 - .1, t0 + .15)), pulseK = 1 + .12 * Math.sin(seg(lt, allIn, allIn + .26) * PI);
  COUNT.v = value; COUNT.k = k; COUNT.pulse = pulseK; COUNT.last = last;
};
const COUNT = { v: 0, k: 0, pulse: 1, last: -9 };

// ---- the card, full frame: the open spread, a dozen messages, and gloved pens writing in two passes
const CARD_MSGS = [   // [text, page, x, y, size, colour, rot, font, hand ('' already there), start, end]
  ['Banana :)', 0, 34, 222, 38, '#0e8a7e', -.03, 'n', ''], ['Goji', 0, 300, 236, 42, '#7a3fb0', .04, 'n', ''], ['Pear: dues are due', 0, 28, 392, 33, '#7a4a1a', -.02, 'n', ''], ['Apple zzz', 0, 40, 626, 38, '#4a6a9a', .02, 'n', ''],
  ['Pineapple', 1, 36, 262, 44, '#e07a10', -.03, 'n', ''], ['Dragon (nights): ok', 1, 26, 338, 31, '#4a3a8a', .015, 'n', ''], ['Papaya', 1, 120, 640, 44, '#d4438a', -.03, 'n', ''],
  ['Mango', 0, 38, 316, 74, '#e8196a', -.05, 'b', 'A', 13.39, 13.86], ['Lemon (read report)', 1, 26, 410, 35, '#1d3a8a', -.012, 'n', 'B', 13.62, 14.17],
  ['Mrs C: 1962 or bust', 1, 24, 486, 34, '#1f8a3a', .03, 'n', 'B', 14.29, 14.8], ['(WE\'RE NOT)', 1, 150, 206, 40, '#d6203a', -.07, 'n', 'B', 14.82, 15.07], ['Clem: Sure!', 0, 30, 488, 56, '#ff8a1a', -.04, 'b', 'A', 14.45, 14.93]];
function heart(x, y, r, col) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, r * .9); ctx.bezierCurveTo(-r * 1.5, -r * .2, -r * .7, -r * 1.2, 0, -r * .45); ctx.bezierCurveTo(r * .7, -r * 1.2, r * 1.5, -r * .2, 0, r * .9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
// handwriting: letters a little off the line, revealed left to right; returns the pen tip in screen coordinates
function ink(str, x, y, size, color, rot, p, o = {}) {
  const bang = o.font === 'b', fnt = bang ? `400 ${size}px Bangers` : `italic 900 ${size}px Nunito`;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = fnt; if (bang) ctx.letterSpacing = '1px';
  const chars = [...str], ws = chars.map(c => ctx.measureText(c).width), tot = ws.reduce((a, c) => a + c, 0); ctx.letterSpacing = '0px';
  const reach = tot * clamp(p);
  if (p > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(-8, -size * 1.3, reach + 8, size * 1.9); ctx.clip();
    let cx = 0; chars.forEach((c, i) => { ctx.save(); ctx.translate(cx + ws[i] / 2, (hash(i * 3.3 + (o.seed || 0)) - .5) * size * .1); ctx.rotate((hash(i * 5.1 + (o.seed || 0) + 2) - .5) * .09); text(c, 0, 0, { size, font: bang ? 'Bangers' : 'Nunito', weight: bang ? 400 : 900, italic: !bang, fill: color, base: 'alphabetic' }); ctx.restore(); cx += ws[i]; });
    ctx.restore();
  }
  ctx.restore();
  const at = pp => { const rc = tot * clamp(pp), wb = Math.sin(pp * 47) * size * .07; return [x + Math.cos(rot) * rc - Math.sin(rot) * (-size * .12 + wb), y + Math.sin(rot) * rc + Math.cos(rot) * (-size * .12 + wb)]; };
  return { tip: at(p), at, w: tot };
}
function doodleSmiley(x, y, r, p, col) {   // a hand-drawn smiley: the face, two dots, a smile; returns the pen tip
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.fillStyle = 'rgba(255,230,60,.55)';
  const a = clamp(p / .5), tip = [x + r, y];
  if (a > 0) { ctx.beginPath(); ctx.arc(x, y, r, -2.2, -2.2 + TAU * a); if (a >= 1) { ctx.fill(); } ctx.stroke(); tip[0] = x + Math.cos(-2.2 + TAU * a) * r; tip[1] = y + Math.sin(-2.2 + TAU * a) * r; }
  ctx.fillStyle = col; if (p > .58) { ell(x - r * .34, y - r * .22, 6, 8); ctx.fill(); tip[0] = x - r * .34; tip[1] = y - r * .22; } if (p > .68) { ell(x + r * .34, y - r * .22, 6, 8); ctx.fill(); tip[0] = x + r * .34; tip[1] = y - r * .22; }
  const m = clamp((p - .74) / .26); if (m > 0) { ctx.beginPath(); ctx.arc(x, y + r * .02, r * .58, .25, .25 + (PI - .5) * m); ctx.stroke(); tip[0] = x + Math.cos(.25 + (PI - .5) * m) * r * .58; tip[1] = y + r * .02 + Math.sin(.25 + (PI - .5) * m) * r * .58; }
  ctx.restore(); return { tip };
}
function pen(tip0, color, ang, side, off = 0) {   // a marker held by a glove: the nib on the paper (lifted along its own axis by `off`), the glove a third of the way up, the arm from just past the top edge
  const ux = Math.cos(ang), uy = Math.sin(ang), tip = [tip0[0] + ux * off, tip0[1] + uy * off];
  ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(ang); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.fillStyle = '#e8e8ee'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, -9); ctx.lineTo(20, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(7, -3); ctx.lineTo(7, 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color; rr(20, -15, 210, 30, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(34, -10, 170, 6); ctx.fillStyle = '#f2f2f6'; rr(230, -14, 64, 28, 8); ctx.fill(); ctx.stroke(); ctx.restore();
  const gx = tip[0] + ux * 190, gy = tip[1] + uy * 190, d = Math.max(380, (gy + 260) / Math.max(.3, -uy));
  bigArm([gx + ux * d, gy + uy * d], [gx, gy], ang + PI * .92, 2.5, 'grip', side, 190, [24, 19, 12.5]);
}
const SPREAD = { cx: 540, cy: 800, w: 940, h: 700 };
INS.cardIns = (lt, C, sh) => {
  const b = id => B(id), k = seg(lt, sh.t0, sh.t1), { cx, w, h } = SPREAD, cy = lerp(808, 792, k), x0 = cx - w / 2, y0 = cy - h / 2, sway = .006 * Math.sin(lt * 1.7);
  macroBg(lt, { base: ['#241030', '#4a1c58'] });
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(sway - .004); ctx.scale(lerp(1, 1.035, k), lerp(1, 1.035, k)); ctx.translate(-cx, -cy);
  // the card: two cream pages, a crease down the middle, a drop shadow
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = INK; ctx.lineWidth = 6; rr(x0, y0, w, h, 14); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = grad(cx - 90, 0, cx + 90, 0, [[0, 'rgba(120,90,60,0)'], [.5, 'rgba(120,90,60,.34)'], [1, 'rgba(120,90,60,0)']]); ctx.fillRect(cx - 90, y0 + 4, 180, h - 8);
  ctx.strokeStyle = 'rgba(100,70,40,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, y0 + 6); ctx.lineTo(cx, y0 + h - 6); ctx.stroke();
  // the printed headers
  text('GOOD LUCK ON', x0 + 235, y0 + 70, { size: 52, font: 'Bangers', weight: 400, fill: '#1d4fd8', spacing: 2, maxW: 430 }); text('YOUR JOURNEY', x0 + 235, y0 + 128, { size: 52, font: 'Bangers', weight: 400, fill: '#1d4fd8', spacing: 2, maxW: 430 });
  text("SORRY YOU'RE LEAVING", x0 + 705, y0 + 92, { size: 44, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 1.5, maxW: 430 });
  const hands = { A: [], B: [] };
  const pageXY = (pg, x, y) => [x0 + pg * (w / 2) + x, y0 + y];
  for (const m of CARD_MSGS) {
    const [str, pg, mx, my, size, col, rot, fnt, hand, t0, t1] = m, [X, Y] = pageXY(pg, mx, my), p = hand ? easeIO(seg(lt, t0, t1)) : 1;
    const r = ink(str, X, Y, size, col, rot, p, { font: fnt, seed: str.length });
    if (str === 'Mango' && p >= 1) heart(X + r.w + 34, Y - 26, 20, '#e8196a');
    if (hand) hands[hand].push({ t0, t1, col, pg, tip: r.tip, at: pp => r.at(easeIO(pp)) });
  }
  { const sm = pageXY(0, 330, 590); doodleSmiley(sm[0], sm[1], 58, 1, '#1d1a22'); }
  // the gloved pens: each hand drops in from the top edge, writes its names in turn (hopping from one to the next), and lifts away
  const LEAD = .14;
  for (const hd of ['A', 'B']) {
    const sg = hands[hd].sort((p, q) => p.t0 - q.t0); let st = null;
    for (let i = 0; i < sg.length && !st; i++) {
      const g = sg[i], nx = sg[i + 1];
      if (lt >= g.t0 - LEAD && lt < g.t0) st = { tip: g.at(0), off: 320 * (1 - easeOut(seg(lt, g.t0 - LEAD, g.t0))), col: g.col, pg: g.pg };
      else if (lt >= g.t0 && lt <= g.t1) st = { tip: g.tip, off: 0, col: g.col, pg: g.pg };
      else if (lt > g.t1) {
        if (nx && nx.t0 - g.t1 < 2 * LEAD + .06) { if (lt < nx.t0) { const q = seg(lt, g.t1, nx.t0); st = { tip: lerpA2(g.at(1), nx.at(0), easeIO(q)), off: 70 * Math.sin(q * PI), col: q > .5 ? nx.col : g.col, pg: q > .5 ? nx.pg : g.pg }; } }
        else if (lt < g.t1 + LEAD) st = { tip: g.at(1), off: 320 * easeIn(seg(lt, g.t1, g.t1 + LEAD)), col: g.col, pg: g.pg };
      }
    }
    if (st) pen(st.tip, st.col, -1.2 + (hd === 'A' ? .06 : -.1), hd === 'A' ? 1 : -1, st.off);
  }
  ctx.restore();
  // Mango holds the card up by its lower corners
  bigHand(x0 + 36, y0 + h - 6, -.5, 3.6, 'grip', 1); bigHand(x0 + w - 36, y0 + h - 6, PI + .5, 3.6, 'grip', -1);
};

// ------------------------------------------------------------------ the scene
const PARTY_LIGHT = { key: [-.35, -.8], keyColor: '#fff0d0', keyA: .26, rim: '#ff9ad0', rimA: .5, shadow: '#3a2a50', shadowA: .32, bounce: '#ffd9a0', bounceA: .2, amb: '#fff4e0', ambA: .04 };
// a pencil falls out of the crowd when the Q-word is said: it drops, bounces twice and rolls
function pencilDrop(lt, C) {
  const tq = wordT('s3', 'q-word', B('s3').s + 2.44) + .05, ta = lt - tq; if (ta < 0 || ta > 3) return;
  const pr = C.crowd[1], s = pr.s, x0 = pr.x + 70 * s, y0 = pr.y - 190 * s, fy = pr.y + 70 * s, g = 3600, T = Math.sqrt(2 * (fy - y0) / g);
  let x = x0 + 18 * Math.min(ta, T), y, rot;
  if (ta < T) { y = y0 + .5 * g * ta * ta; rot = ta * 7; }
  else { const u = ta - T, v = Math.sqrt(2 * g * (fy - y0)) * .4, tb = 2 * v / g; x += 40 * Math.min(u, tb + .3); const uu = u % 1e9; y = u < tb ? fy - (v * u - .5 * g * u * u) : fy; rot = 7 * T + (u < tb ? u * 6 : tb * 6 + (u - tb) * 3.5 * Math.max(0, 1 - (u - tb))); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.fillStyle = '#ffd23a'; rr(-40 * s, -5 * s, 66 * s, 10 * s, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2d3a0'; ctx.beginPath(); ctx.moveTo(26 * s, -5 * s); ctx.lineTo(42 * s, 0); ctx.lineTo(26 * s, 5 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#333'; ctx.beginPath(); ctx.moveTo(38 * s, -1.4 * s); ctx.lineTo(42 * s, 0); ctx.lineTo(38 * s, 1.4 * s); ctx.fill(); ctx.fillStyle = '#ff8fb1'; rr(-50 * s, -5 * s, 11 * s, 10 * s, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c0c6cf'; ctx.fillRect(-40 * s, -5 * s, 5 * s, 10 * s);
  ctx.restore();
}
function drawNamed(n, C) {
  if (n === 'cran') { S7.wheelchairBack(C.cranQ.x, C.cranQ.y, C.cranQ.s); drawChar(C.cran); S7.wheelchairFront(C.cranQ.x, C.cranQ.y, C.cranQ.s); }
  else drawChar(C[n]);
}
function drawSoft(n, C) {
  if (n === 'cran') { S7.wheelchairBack(C.cranQ.x, C.cranQ.y, C.cranQ.s); drawBg(C.cran); S7.wheelchairFront(C.cranQ.x, C.cranQ.y, C.cranQ.s); }
  else drawBg(C[n]);
}
const depthOf = (n, C) => n === 'cran' ? C.cranQ.y : C[n].y + (n === 'mango' ? 4 : 0);
const SC = {
  shot: lt => shotOf(lt).n,
  cam(lt) { const sh = shotOf(lt); cameraFor(lt, sh, cast(lt)); },
  draw(lt) {
    const sh = shotOf(lt), C = cast(lt), b = id => B(id), tOn = cue.on();
    if (INS[sh.n]) { INS[sh.n](lt, C, sh); return; }
    const dark = 1 - easeOut(seg(lt, tOn - .01, tOn + .04));
    V2.setLight(PARTY_LIGHT); V2.opts.reflect = true;
    const crisp = CRISP[sh.n] || NAMED, bg = crisp.length === 1 ? 9 : crisp.length === 2 ? 5 : crisp.length === 3 ? 3 : 1.2, crowdBlur = crisp.length === 1 ? 6 : crisp.length === 2 ? 4 : 2.2;
    V2.dof(bg, () => { room(lt); stringLights(lt); banner(lt); balloonBunch(-535, 1450, lt, 0); heldBunch(C, lt); floater(lt, C); tableSet(lt, { cake: lt >= b('l1').s + 1.1 }); lightPool(); });
    // confetti: behind every character, so it never crosses a face
    confettiBurst(lt, 'L', cue.popL(), PO.L[0], PO.L[1]); confettiBurst(lt, 'R', cue.popR(), PO.R[0], PO.R[1]);
    if (WIDE.includes(sh.n)) {
      // a wide shot: everybody sharp, one depth-sorted pass so a nearer neighbour is always in front of a farther one
      const list = [...C.crowd.map(o => ({ o, y: o.y })), ...NAMED.map(n => ({ n, y: depthOf(n, C) }))].sort((a, c) => a.y - c.y);
      for (const it of list) it.n ? drawNamed(it.n, C) : drawBg(it.o);
    } else {
      // the crowd and whoever of the named cast is not the subject: one soft pass, then the subject(s) sharp
      const soft = NAMED.filter(n => !crisp.includes(n));
      V2.dof(crowdBlur, () => {
        const list = [...C.crowd.map(o => ({ o, y: o.y })), ...soft.map(n => ({ n, y: depthOf(n, C) }))].sort((a, c) => a.y - c.y);
        for (const it of list) it.n ? drawSoft(it.n, C) : drawBg(it.o);
      });
      if (sh.n === 'medS') pencilDrop(lt, C);
      for (const n of crisp.slice().sort((a, c) => depthOf(a, C) - depthOf(c, C))) drawNamed(n, C);
    }
    if (dark > .01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(52,58,110,${.86 * dark})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const flash = seg(lt, tOn, tOn + .02) * (1 - seg(lt, tOn + .02, tOn + .22));
    if (flash > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,252,240,${.55 * flash})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // the streamers from the right popper land on Strawberry's cap
    { const to = localToScreen(C.straw, 0, -140), t0 = cue.popR() + .05, from = PO.R;
      streamerFlight(lt, from, [to[0] - 6, to[1]], t0, .5, '#ff4f9a', 0); streamerFlight(lt, from, [to[0] + 8, to[1] + 6], t0 + .06, .54, '#4aa8ff', 1); }
  },
  fx: lt => {
    const tOn = cue.on(), pops = Math.max(pulse(lt, cue.popL(), cue.popL() + .2), pulse(lt, cue.popR(), cue.popR() + .2));
    return { bloom: .6, vignette: .42, grain: .045, contrast: .14, sat: .12, tint: [['#ffb36b', .08, 'soft-light']], aberr: 3.5 * pops, fade: Math.max(1 - seg(lt, 0, .28), seg(lt, CUR.dur - .3, CUR.dur - .02)), fadeColor: '0,0,10' };
  },
  blur: lt => (lt > .28 && lt < .9) ? 3 : 1,
  over(lt) {
    const tOn = cue.on(), sh = shotOf(lt), b = id => B(id);
    if (sh.n === 'wide') {
      sfxWord(lt, tOn, 'SURPRISE!', 700, 285, { size: 84, rot: -.04, hold: .8 });
      sfxWord(lt, cue.popL(), 'POP!', 170, 690, { size: 76, rot: -.1, hold: .45, fill: '#7fe0ff' });
      sfxWord(lt, cue.popR(), 'POP!', 930, 690, { size: 76, rot: .1, hold: .45, fill: '#ff9ad0' });
    }
    if (sh.n === 'coinsIns') counter(lt);
    if (sh.n === 'medS') cuffMap(lt);
  },
};
// the counter: a plaque that ticks up as the money leaves the can
function counter(lt) {
  const k = COUNT.k; if (k <= .02) return;
  const cx = 540, cy = 430, w = 560, h = 230, tk = 1 + .09 * Math.exp(-Math.max(0, lt - COUNT.last) * 16) * (COUNT.last > 0 ? 1 : 0), sc = k * COUNT.pulse * tk, bob = 5 * Math.sin(lt * 3.2);
  ctx.save(); ctx.translate(cx, cy + bob); ctx.scale(sc, sc); ctx.rotate(-.03);
  reg('overlay', [cx - w / 2 * sc - 8, cy + bob - h / 2 * sc - 8, cx + w / 2 * sc + 8, cy + bob + h / 2 * sc + 8], { id: 'counter', transit: k < .98 });
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = grad(0, -h / 2, 0, h / 2, [[0, '#2a1a52'], [1, '#150c30']]); rr(-w / 2, -h / 2, w, h, 40); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 8; rr(-w / 2, -h / 2, w, h, 40); ctx.stroke();
  text('STRAWBERRY FUND', 0, -h / 2 + 40, { size: 30, fill: '#ffe9a0', weight: 900, spacing: 4 });
  text('$' + (COUNT.v / 100).toFixed(2), 0, 26, { size: 142, font: 'Bangers', weight: 400, fill: '#ffd23a', lw: 14, stroke: '#150f22', spacing: 3 });
  ctx.restore();
  if (lt - COUNT.last < .3 && COUNT.last > 0) V2.glow(cx, cy + bob, 360, '255,214,90', .35 * (1 - (lt - COUNT.last) / .3), 'screen', .4);
}
// the cuff diagram: a card in the upper right that fills in word by word as Strawberry gives the directions
function cuffMap(lt) {
  const b = id => B(id), s3 = b('s3'), k = easeBack(seg(lt, s3.s + .02, s3.s + .3)) * (1 - easeIn(seg(lt, s3.e - .45, s3.e - .15)));
  if (k <= .02) return;
  const K = .86, x0 = 640, y0 = 285, w = 480, h = 470, cx = x0 + w * K / 2, cy = y0 + h * K / 2, tSecond = wordT('s3', 'second', s3.s + .94) - .05, tBehind = wordT('s3', 'behind', s3.s + 1.83) - .05, tQ = wordT('s3', 'q-word', s3.s + 2.44), tSign = wordT('s3', 'sign', s3.s + 2.77);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k * K, k * K); ctx.rotate(-.02); ctx.translate(-w / 2, -h / 2); ctx.lineJoin = 'round';
  reg('overlay', [cx - w / 2 * k * K - 8, cy - h / 2 * k * K - 8, cx + w / 2 * k * K + 8, cy + h / 2 * k * K + 8], { id: 'cuff-map', transit: k < .98 });
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10; ctx.fillStyle = '#fffaf0'; rr(0, 0, w, h, 26); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#1d4fd8'; ctx.beginPath(); ctx.roundRect(0, 0, w, 66, [26, 26, 0, 0]); ctx.fill(); ctx.stroke();
  text('THE GOOD CUFF', w / 2, 36, { size: 44, font: 'Bangers', weight: 400, fill: '#ffffff', spacing: 3 });
  // the supply closet: a plate, three shelves, and what is on them
  const cabX = 36, cabY = 124, cabW = 244, cabH = 316, pop = easeBack(seg(lt, s3.s + .08, s3.s + .38));
  ctx.save(); ctx.translate(cabX + cabW / 2, cabY + cabH); ctx.scale(pop, pop); ctx.translate(-cabX - cabW / 2, -cabY - cabH);
  ctx.fillStyle = '#2f8f4a'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(cabX + 14, cabY - 46, cabW - 28, 40, 10); ctx.fill(); ctx.stroke(); text('SUPPLY CLOSET', cabX + cabW / 2, cabY - 25, { size: 24, fill: '#ffffff', weight: 900, spacing: 1.5, maxW: cabW - 50 });
  ctx.fillStyle = '#d7b88a'; rr(cabX, cabY, cabW, cabH, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a6a44'; ctx.fillRect(cabX + 10, cabY + 10, cabW - 20, cabH - 20);
  for (let i = 0; i < 3; i++) {
    const sy = cabY + 104 + i * 98; ctx.fillStyle = '#c9a26a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(cabX + 10, sy, cabW - 20, 12, 3); ctx.fill(); ctx.stroke();
    text(String(i + 1), cabX - 14, sy - 40, { size: 30, font: 'Bangers', weight: 400, fill: '#1d1a22' });
    if (i === 0) { ctx.fillStyle = '#e9f0f7'; for (let j = 0; j < 3; j++) { rr(cabX + 30 + j * 68, sy - 52, 52, 52, 8); ctx.fill(); ctx.stroke(); } }
    if (i === 2) { ctx.fillStyle = '#f4efe0'; rr(cabX + 24, sy - 40, 100, 40, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8fd3ff'; rr(cabX + 134, sy - 54, 76, 54, 8); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
  // shelf 2: the highlight and the arrow, the cuff itself, and the Q-word sign that slides over it
  const sy2 = cabY + 104 + 98, hi = easeBack(seg(lt, tSecond, tSecond + .22));
  if (hi > .02) { ctx.save(); ctx.globalAlpha *= clamp(hi * 2); ctx.strokeStyle = '#e8283a'; ctx.lineWidth = 7; rr(cabX + 2, sy2 - 70, cabW - 4, 88, 12); ctx.stroke();
    ctx.fillStyle = '#e8283a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(cabX + cabW + 6, sy2 - 26); ctx.lineTo(cabX + cabW + 54, sy2 - 52); ctx.lineTo(cabX + cabW + 54, sy2 - 36); ctx.lineTo(cabX + cabW + 92, sy2 - 36); ctx.lineTo(cabX + cabW + 92, sy2 - 16); ctx.lineTo(cabX + cabW + 54, sy2 - 16); ctx.lineTo(cabX + cabW + 54, sy2 + 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    text('2ND', cabX + cabW + 136, sy2 - 54, { size: 40, font: 'Bangers', weight: 400, fill: '#e8283a', lw: 7, stroke: '#ffffff' }); text('SHELF', cabX + cabW + 136, sy2 - 10, { size: 40, font: 'Bangers', weight: 400, fill: '#e8283a', lw: 7, stroke: '#ffffff' }); ctx.restore(); }
  { const cx2 = cabX + 70, cy2 = sy2 - 30;   // the cuff: a blue band, a dial and a bulb on a tube
    ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(cx2 - 54, cy2 - 24, 108, 46, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f2f6ff'; ell(cx2 + 66, cy2 - 6, 24, 24); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#e8283a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx2 + 66, cy2 - 6); ctx.lineTo(cx2 + 80, cy2 - 18); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx2 + 60, cy2 + 16); ctx.quadraticCurveTo(cx2 + 90, cy2 + 40, cx2 + 124, cy2 + 10); ctx.stroke(); ctx.fillStyle = '#2a2a32'; ell(cx2 + 136, cy2 + 6, 17, 22); ctx.fill(); ctx.stroke();
    const gl = seg(lt, tSign + .1, tSign + .45); if (gl > 0) { ctx.save(); ctx.globalAlpha *= Math.sin(gl * PI); ctx.fillStyle = '#fff6c0'; ctx.translate(cx2 + 40, cy2 - 34); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * PI / 4 - PI / 2, R = i % 2 ? 7 : 30; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); } ctx.closePath(); ctx.fill(); ctx.restore(); } }
  const sl = easeOut(seg(lt, tBehind, tBehind + .38)), slash = seg(lt, tQ - .05, tQ + .22);
  if (sl > 0) { ctx.save(); ctx.translate(lerp(250, 0, sl), 0);   // the QUIET sign: a white placard with the Q crossed out in red
    const sx = cabX + 16, sy3 = sy2 - 68; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.save(); ctx.translate(sx + 100, sy3 + 36); ctx.rotate(-.05); rr(-100, -38, 200, 78, 10); ctx.fill(); ctx.stroke();
    text('QUIET', 0, 4, { size: 58, font: 'Bangers', weight: 400, fill: '#d6203a', spacing: 3 });
    if (slash > 0) { ctx.strokeStyle = '#111'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-82, 24 - 56 * 0); ctx.lineTo(-82 + 52 * slash, 24 - 50 * slash); ctx.stroke(); ctx.beginPath(); ctx.arc(-58, 4, 30, 0, TAU * slash); ctx.stroke(); }
    ctx.restore(); ctx.restore(); }
  ctx.restore();
}

window.__EP10_SCENES = window.__EP10_SCENES || {};
window.__EP10_SCENES.party = SC;
window.__P10 = { cast, toScr, shotOf };   // DEBUG-REMOVE
})();
