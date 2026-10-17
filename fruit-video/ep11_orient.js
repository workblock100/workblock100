'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scene module: orient (3:06 PM, THE NURSES' STATION, 24.31 s).
 *
 * Lemon rolls a med cart in and deals the forty residents as cards: twelve flick into Strawberry's tidy brick on the floor (she answers "Per my contract." with a laminated PER DIEM AGREEMENT),
 * twenty-eight build a HOUSE OF CARDS in front of Clementine that grows past her head, sways and creaks, and swallows her until "Sure!". Then the lesson: "let me check my contract",
 * a blank page that unfurls, Strawberry mouthing along, and Lemon's flat verdict and a sticker: NURSE (CONTRACT: NONE).
 *
 * Shots (scene-local seconds):
 *   0.00 wide station, the cart rolls in (wheels cue 0.30)        | 1.25 cuL Lemon (l1)           | 3.12 cuS Strawberry, the contract whips up (s1)
 *   4.21 contract insert (laminate, fine print, coffee ring)        | 5.10 deal: twelve cards flick to the brick (flips cue 5.25)
 *   6.12 wide2 the house grows and swallows Clementine (l2)         | 8.38 cuC "Sure!" she peeks out | 9.10 cuS2 "That's forty." + the 12 + 28 = 40 tally
 *   10.13 cuL2 Lemon: "It's contract math."                         | 11.93 teach (pause): the house topples slowly, Clementine props it up
 *   12.68 three-shot: the lesson, the sticky note writes itself     | 16.61 cuC2 the blank page unfurls | 17.99 cuS3 "Say it anyway."
 *   19.10 two-shot: Clementine says it, Strawberry mouths along     | 20.70 cuL3 "You don't have one." | 22.08 cuC3 "Sure!" | 22.96 tag: Lemon stamps the sticker (sting cue 23.06), proud push-in
 * Layout (X right, Z forward, V2.at): Strawberry X -235, Lemon X -20 behind the cart (X 22), Clementine X 235 behind the house (steps out to X 130), the house X 235 Z 960, the brick X -125 Z 935. */
(() => {
if (!window.TIMELINE_EP11) return;
const { zoomTo, faceZoom, faceC, drawBg, inB, localOf, localToScreen, person } = window.H6;
const A7 = window.A7, A11 = window.A11, S6 = window.S6, S7 = window.S7;
const lemon = A7.lemon, straw = A11.straw, clem = A11.clem;
const { p2 } = V2;
const { box3, onZ, kz } = S6;

// ------------------------------------------------------------------ helpers
// scene-relative time of a spoken word, from the recorded line's word timings
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// a route through keyed positions [t, X, Z, ease]
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const lerpA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
// a damped shake that starts at t0 (a hand tapping a page on the beat)
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
// a hand reaching for a point in scene coordinates: blends from a resting grip (local px) toward the target, stopping short of full reach
function handTo(o, side, x, y, k, rest) {
  const kd = KINDS[o.kind], [sx, sy] = shoulder(kd, side), [u, v] = localOf(o, x, y), reach = ((kd.arm1 || 56) + (kd.arm2 || 52)) * (o.armScale || 1.12) * .94;
  const dx = u - sx, dy = v - sy, d = Math.hypot(dx, dy) || 1, f = Math.min(1, reach / d), key = side < 0 ? 'l' : 'r';
  o.grip = Object.assign(o.grip || {}, { [key]: [lerp(rest[0], sx + dx * f, k), lerp(rest[1], sy + dy * f, k)] });
  o.arms = Object.assign(o.arms || {}, { [key]: 'hold' });
}

// ------------------------------------------------------------------ layout and timing
const LP = { straw: [-206, 1000], cart: [20, 1062], lemon: [-22, 1185], house: [246, 960], brick: [-116, 935] };
const cartXAt = lt => lerp(-660, LP.cart[0], easeOut(seg(lt, .30, 1.25)));   // the wheels cue is 0.30: the cart starts rolling on it and brakes as Lemon speaks
const lemonXAt = lt => cartXAt(lt) + (LP.lemon[0] - LP.cart[0]);
// Lemon rolls the cart in, stays behind it, and steps round the cart to Clementine's side for the sticker
const lemonPath = lt => { const k = sk(lt, 22.1, 22.86); return [lerp(lemonXAt(lt), -62, k), lerp(LP.lemon[1], 985, k)]; };
const clemPath = route([[0, 246, 1000], [8.24, 246, 1000], [8.7, 98, 1000, 'out']]);
// the dealing: twelve flips in 0.6 s (the flips cue), then twenty-eight over the line "Clementine, you have twenty-eight."
const FLY12 = .30, FLY28 = .40;
const sp12 = i => B('deal').s + .10 + i * .05;
const sp28 = i => B('l2').s + .04 + 1.58 * Math.pow(i / 27, .85);
const tl12 = i => sp12(i) + FLY12, tl28 = i => sp28(i) + FLY28;
const count = (f, n, lt) => { let c = 0; for (let i = 0; i < n; i++) if (lt >= f(i)) c++; return c; };
const n12 = lt => count(tl12, 12, lt), n28 = lt => count(tl28, 28, lt), spawned = lt => count(sp12, 12, lt) + count(sp28, 28, lt);

const SHOTS = () => {
  const b = id => B(id);
  return [['wide', b('l1').s - .05], ['cuL', 3.12], ['cuS', 4.21], ['contract', b('deal').s - .05], ['deal', b('l2').s - .08], ['wide2', b('c1').s - .05], ['cuC', b('s2').s - .05], ['cuS2', b('l3').s - .05], ['cuL2', b('teach').s],
    ['teach', b('s3').s], ['three', b('c2').s - .05], ['cuC2', b('s4').s - .05], ['cuS3', b('c3').s - .06], ['two', b('l4').s - .05], ['cuL3', b('c4').s - .05], ['cuC3', b('tag').s], ['tag', 1e9]];
};
const shotOf = lt => SHOTS().find(([, e]) => lt < e)[0];
// who is in focus (everyone else is a soft neighbour, drawn out of focus and left out of the audit)
const CRISP = { cuL: ['lemon'], cuL2: ['lemon'], cuL3: ['lemon'], cuS: ['straw'], cuS2: ['straw'], cuS3: ['straw'], cuC: ['clem'], cuC2: ['clem'], cuC3: ['clem'], deal: ['lemon', 'straw'], two: ['straw', 'clem'], wide: ['lemon', 'straw', 'clem'], wide2: ['lemon', 'clem'], teach: ['straw', 'clem'], three: ['straw', 'clem'], tag: ['lemon', 'clem'] };
// how far out of focus the foreground cards are (the brick and the house stand in front of the cast)
const NBR = { wide: 4, wide2: 4, deal: 4, teach: 3, three: 2.6, two: 2.6 };   // how soft the people who are not the subject are
const FGBLUR = { cuL: 8, cuL2: 8, cuL3: 8, cuS: 2.5, cuS2: 2.5, cuS3: 2.5, cuC: 3, cuC2: 3, cuC3: 3 };

// ------------------------------------------------------------------ resident cards (cached faces: 62 x 88 units, drawn centred)
const CW = 62, CH = 88, CS = .86, CT = 1.3, FLAT = .42;
const NAMES = ['MRS. PEAR', 'MR. PRUNE', 'MISS PLUM', 'MR. FIG', 'MRS. GRAPE', 'MR. KIWI', 'MS. LIME', 'MR. DATE', 'MRS. PEACH', 'MR. QUINCE', 'MRS. APPLE', 'MR. LYCHEE', 'MRS. MANGO', 'MR. GUAVA'];
const FRUIT = [
  { c: ['#ff7a7a', '#c42a2a'], shape: 'round', top: 'leaf', bg: '#cfeaff' }, { c: ['#d8e86a', '#93ab2c'], shape: 'pear', top: 'leaf', bg: '#ffe6f0' }, { c: ['#a06ac4', '#63318f'], shape: 'round', top: 'stem', bg: '#fff0c8' },
  { c: ['#ffe65a', '#d9ab00'], shape: 'lemon', top: 'nub', bg: '#e0f3ff' }, { c: ['#ffb38c', '#e6704a'], shape: 'round', top: 'leaf', bg: '#e8f5d8' }, { c: ['#9ede4e', '#5aa01f'], shape: 'round', top: 'nub', bg: '#ffe9d6' },
  { c: ['#b38a5c', '#7a5530'], shape: 'round', top: 'none', bg: '#e4ecff' }, { c: ['#ffd84a', '#d6a010'], shape: 'banana', top: 'none', bg: '#f1e4ff' }, { c: ['#9a5a8c', '#5a2a54'], shape: 'pear', top: 'stem', bg: '#d8f5ee' },
  { c: ['#ffb040', '#e07810'], shape: 'round', top: 'leaf', bg: '#e6e6ff' }];
const ST_SLEEP = { t: 'ASLEEP', c: '#4a5ec8', ic: 'moon' };
const ST_AWAKE = [{ t: 'CALL LIGHT', c: '#d62a3a', ic: 'bell' }, { t: 'FALL RISK', c: '#e08a10', ic: 'warn' }, { t: 'NEEDS ICE', c: '#1f9ac8', ic: 'cube' }, { t: 'WANDERING', c: '#2f9a52', ic: 'arrows' }, { t: 'WANTS HOME', c: '#8a4ac8', ic: 'home' }, { t: 'SUNDOWNING', c: '#c85a1f', ic: 'sun' }];
// card i is resident room i + 1: rooms 1 to 12 are Strawberry's (all asleep), rooms 13 to 40 are Clementine's (awake, mostly)
const cardInfo = i => {
  const room = i + 1, asleep = i < 12 || i % 6 === 4, st = asleep ? ST_SLEEP : ST_AWAKE[(i * 5 + 2) % ST_AWAKE.length];
  return { room, asleep, st, f: FRUIT[(i * 7 + 3) % FRUIT.length], name: room === 14 ? 'MRS. CRANBERRY' : NAMES[(i * 3 + 1) % NAMES.length], note: room === 14 ? 'LIVES IN 1962' : null };
};
function icon(kind, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'moon') { ctx.beginPath(); ctx.arc(0, 0, 5, .5, TAU - .5); ctx.arc(2.6, -.6, 4.2, TAU - .9, .9, true); ctx.closePath(); ctx.fill(); }
  else if (kind === 'bell') { ctx.beginPath(); ctx.moveTo(-5, 3); ctx.quadraticCurveTo(-4, -6, 0, -6); ctx.quadraticCurveTo(4, -6, 5, 3); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, 4.4, 1.6, 0, TAU); ctx.fill(); }
  else if (kind === 'warn') { ctx.beginPath(); ctx.moveTo(0, -5.5); ctx.lineTo(5.6, 4.4); ctx.lineTo(-5.6, 4.4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-.8, -2.2, 1.6, 3.8); ctx.fillRect(-.8, 2.2, 1.6, 1.6); }
  else if (kind === 'cube') { ctx.fillRect(-4.6, -4.6, 9.2, 9.2); ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillRect(-3.2, -3.2, 3.2, 2.2); }
  else if (kind === 'arrows') { ctx.beginPath(); ctx.moveTo(-5.4, 0); ctx.lineTo(5.4, 0); ctx.moveTo(-5.4, 0); ctx.lineTo(-2.4, -3); ctx.moveTo(-5.4, 0); ctx.lineTo(-2.4, 3); ctx.moveTo(5.4, 0); ctx.lineTo(2.4, -3); ctx.moveTo(5.4, 0); ctx.lineTo(2.4, 3); ctx.stroke(); }
  else if (kind === 'home') { ctx.beginPath(); ctx.moveTo(0, -5.6); ctx.lineTo(5.8, 0); ctx.lineTo(4.2, 0); ctx.lineTo(4.2, 5); ctx.lineTo(-4.2, 5); ctx.lineTo(-4.2, 0); ctx.lineTo(-5.8, 0); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, TAU); ctx.fill(); for (let a = 0; a < 8; a++) { ctx.beginPath(); ctx.moveTo(Math.cos(a * PI / 4) * 4.6, Math.sin(a * PI / 4) * 4.6); ctx.lineTo(Math.cos(a * PI / 4) * 6.4, Math.sin(a * PI / 4) * 6.4); ctx.stroke(); } }
  ctx.restore();
}
// the portrait: a fruit in a disc, eyes shut (asleep) or wide and worried (awake)
function portrait(f, asleep, seed) {
  const R = 19.5;
  ctx.fillStyle = f.bg; ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ell(0, 0, R, R); ctx.fill(); ctx.stroke();
  ctx.save(); ell(0, 0, R - 1, R - 1); ctx.clip();
  const g = ctx.createLinearGradient(-12, -14, 12, 14); g.addColorStop(0, f.c[0]); g.addColorStop(1, f.c[1]); ctx.fillStyle = g; ctx.strokeStyle = 'rgba(25,12,30,.85)'; ctx.lineWidth = 2;
  ctx.beginPath();
  if (f.shape === 'pear') { ctx.moveTo(0, -13); ctx.bezierCurveTo(7, -13, 8, -4, 13, 3); ctx.bezierCurveTo(16, 14, -16, 14, -13, 3); ctx.bezierCurveTo(-8, -4, -7, -13, 0, -13); }
  else if (f.shape === 'lemon') { ctx.moveTo(-15, 2); ctx.quadraticCurveTo(-13, -11, 0, -12); ctx.quadraticCurveTo(13, -11, 15, 2); ctx.quadraticCurveTo(13, 14, 0, 14); ctx.quadraticCurveTo(-13, 14, -15, 2); }
  else if (f.shape === 'banana') { ctx.moveTo(-14, -6); ctx.quadraticCurveTo(0, 18, 14, -6); ctx.quadraticCurveTo(15, 3, 3, 12); ctx.quadraticCurveTo(-10, 14, -14, -6); }
  else { ctx.ellipse(0, 1.5, 14.5, 14, 0, 0, TAU); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ell(-6, -5, 3.4, 2, -.5); ctx.fill();
  if (f.top === 'leaf') { ctx.fillStyle = '#4aa83a'; ctx.beginPath(); ctx.moveTo(1, -12); ctx.quadraticCurveTo(8, -20, 14, -14); ctx.quadraticCurveTo(8, -10, 1, -12); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(-1, -16); ctx.stroke(); }
  else if (f.top === 'stem') { ctx.strokeStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(1, -18); ctx.stroke(); }
  else if (f.top === 'nub') { ctx.fillStyle = '#4a8a2a'; ell(0, -12, 2.2, 1.6); ctx.fill(); }
  ctx.strokeStyle = 'rgba(25,12,30,.9)'; ctx.fillStyle = 'rgba(25,12,30,.9)'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  if (asleep) { for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 5.4, 0, 2.6, .2, PI - .2); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, 6.6, 1.9, .2, PI - .2); ctx.stroke(); }
  else {
    for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ell(s * 5.2, -.4, 2.8, 3.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(25,12,30,.95)'; ell(s * 5.2 + (seed % 3 - 1) * .6, .2, 1.3, 1.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(s * 8.6, -5.4); ctx.lineTo(s * 2.6, -4); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 8.4, 2.4, PI + .3, TAU - .3); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,90,130,.35)'; for (const s of [-1, 1]) { ell(s * 9, 4.4, 2.8, 1.7); ctx.fill(); }
  ctx.restore();
}
function paintFace(i) {
  const c = cardInfo(i), asleep = c.asleep;
  ctx.fillStyle = '#fffdf6'; rr(-CW / 2, -CH / 2, CW, CH, 8); ctx.fill();
  ctx.save(); rr(-CW / 2, -CH / 2, CW, CH, 8); ctx.clip();
  ctx.fillStyle = c.st.c; ctx.fillRect(-CW / 2, -CH / 2, CW, 15);
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(-CW / 2, -CH / 2, CW, 6);
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = '900 10px Nunito'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('RM ' + c.room, -CW / 2 + 5, -CH / 2 + 8);
  icon(c.st.ic, CW / 2 - 10, -CH / 2 + 7.6, .95, '#fff');
  ctx.save(); ctx.translate(0, -9); portrait(c.f, asleep, i); ctx.restore();
  if (asleep) { ctx.fillStyle = '#4a5ec8'; ctx.font = '900 9px Nunito'; ctx.textAlign = 'left'; ctx.fillText('z', 14, -24); ctx.font = '900 6.5px Nunito'; ctx.fillText('z', 20, -29); }
  ctx.fillStyle = '#2a2448'; ctx.font = `900 ${c.name.length > 11 ? 6.6 : 8.2}px Nunito`; ctx.textAlign = 'center'; ctx.fillText(c.name, 0, 20.5);
  ctx.fillStyle = c.st.c; rr(-26, 26.5, 52, 11.5, 5.7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '900 6.4px Nunito'; ctx.fillText(c.note || c.st.t, 0, 32.4);
  ctx.strokeStyle = INK; ctx.lineWidth = 3.2; rr(-CW / 2, -CH / 2, CW, CH, 8); ctx.stroke();
}
function paintBack() {
  ctx.fillStyle = '#2b3478'; rr(-CW / 2, -CH / 2, CW, CH, 8); ctx.fill();
  ctx.save(); rr(-CW / 2 + 4, -CH / 2 + 4, CW - 8, CH - 8, 5); ctx.clip();
  ctx.fillStyle = '#3a47a0'; ctx.fillRect(-CW / 2, -CH / 2, CW, CH);
  ctx.strokeStyle = '#5566c8'; ctx.lineWidth = 1.4; for (let d = -100; d < 100; d += 9) { ctx.beginPath(); ctx.moveTo(d, -50); ctx.lineTo(d + 100, 50); ctx.moveTo(d, 50); ctx.lineTo(d + 100, -50); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#a9b6ff'; ctx.lineWidth = 1.6; rr(-CW / 2 + 4, -CH / 2 + 4, CW - 8, CH - 8, 5); ctx.stroke();
  ctx.fillStyle = '#fff6e0'; ell(0, 0, 13, 13); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-2.8, -9, 5.6, 18, 1.4); ctx.fill(); rr(-9, -2.8, 18, 5.6, 1.4); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 3.2; rr(-CW / 2, -CH / 2, CW, CH, 8); ctx.stroke();
}
const CACHE_S = 3, PADU = 4, cardCache = new Map();
function cardImg(i, back) {
  const key = back ? -1 : i; let cv = cardCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = (CW + 2 * PADU) * CACHE_S; cv.height = (CH + 2 * PADU) * CACHE_S;
    const g = cv.getContext('2d'), prev = ctx, sup = REG.suppress; ctx = g; REG.suppress++;
    g.save(); g.scale(CACHE_S, CACHE_S); g.translate(CW / 2 + PADU, CH / 2 + PADU);
    if (back) paintBack(); else paintFace(i);
    g.restore(); REG.suppress = sup; ctx = prev; cardCache.set(key, cv);
  }
  return cv;
}
// one card at the origin, in units (the caller has set the transform)
function blit(i, back) { const cv = cardImg(i, back); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(cv, -CW / 2 - PADU, -CH / 2 - PADU, CW + 2 * PADU, CH + 2 * PADU); }
// a card at scene position (x, y): scale s, in-plane rotation, a flip (|cos| squeeze) and a vertical squash `flat` for a card laid down
function card(i, back, x, y, s, rot = 0, sx = 1, sy = 1, flat = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, flat); ctx.rotate(rot); ctx.scale(s * sx, s * sy); blit(i, back); ctx.restore();
}
// a stack of n cards lying flat: the cream front edge and the top card (squashed). (bx, by) is the middle of the front edge at the floor
function flatStack(bx, by, kk, n, topI, back) {
  const cs = CS * kk, hE = n * CT * cs, w = CW * cs;
  ctx.save(); ctx.fillStyle = 'rgba(20,12,30,.3)'; ell(bx + 5 * cs, by + 1.5 * cs, w * .64, 9 * cs); ctx.fill();
  if (n > 0) {
    ctx.fillStyle = '#f2ead6'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.6, 2.4 * kk); rr(bx - w / 2, by - hE, w, hE, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,70,50,.4)'; ctx.lineWidth = 1; for (let j = 1; j < n; j++) { const y = by - j * CT * cs; ctx.beginPath(); ctx.moveTo(bx - w / 2 + 1.5, y); ctx.lineTo(bx + w / 2 - 1.5, y); ctx.stroke(); }
    card(topI, back, bx, by - hE - CH * FLAT * cs / 2 + 1, cs, 0, 1, 1, FLAT);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the house of cards: 28 slots in building order (4 levels = 26 cards, a floor, one last card on top)
const HC = .86, HL = CH * HC, TH = .34, HB = HL * Math.sin(TH), HHT = HL * Math.cos(TH), FT = 6, PITCH = HHT + FT, DX = 52, HTOT = 4 * PITCH, HSX = .74;
const SLOTS = (() => {
  const s = [], nT = [4, 3, 2, 1];
  for (let lv = 0; lv < 4; lv++) {
    const n = nT[lv], y0 = lv * PITCH;
    for (let j = 0; j < n; j++) { const xr = (j - (n - 1) / 2) * DX; s.push({ kind: 'tent', x: xr - HB / 2, y: y0 + HHT / 2, rot: TH }); s.push({ kind: 'tent', x: xr + HB / 2, y: y0 + HHT / 2, rot: -TH }); }
    for (let j = 0; j < n - 1; j++) s.push({ kind: 'floor', x: (j - (n - 2) / 2) * DX, y: y0 + HHT + FT / 2, rot: 0 });
  }
  s.push({ kind: 'floor', x: 0, y: 3 * PITCH + HHT + FT / 2, rot: 0 });
  s.push({ kind: 'top', x: 14, y: 3 * PITCH + HHT + FT + 31, rot: .95 });
  return s;
})();
// how far the top of the house has leaned (units, + is toward the right), a smooth function of time: a growing lean, a shiver from every landing,
// a slow lean away from Clementine as she peeks out, a topple toward the middle that a hand props up, and a faint sway that never quite stops
function leanA(lt) {
  const tEnd = tl28(27);
  let A = 7 * easeOut(count(tl28, 28, lt) / 28);
  for (let i = 0; i < 28; i++) { const dt = lt - tl28(i); if (dt > 0 && dt < 1.3) A += (1 + 5 * SLOTS[i].y / HTOT) * Math.exp(-dt / .3) * Math.sin(dt * 19 + i * 1.7); }
  const bump = (a, pk, b) => lt < a || lt > b ? 0 : lt < pk ? easeIO(seg(lt, a, pk)) : 1 - easeIO(seg(lt, pk, b));
  A += 46 * bump(tEnd + .25, tEnd + 1.25, tEnd + 2.7) * (1 + .12 * Math.sin(lt * 9));
  A -= 52 * bump(B('teach').s - .25, B('teach').s + .38, B('teach').e + .45) * (1 + .08 * Math.sin(lt * 11));
  if (lt > tEnd + 1) A += 3.2 * Math.sin(lt * 1.9) + 1.4 * Math.sin(lt * 4.3 + 1);
  return A;
}
const swayAt = (y, A) => A * Math.pow(clamp(y / HTOT), 1.6);
const baseOf = pos => { const q = V2.at(...pos); return { x: q.x, y: q.y, k: q.s }; };
function drawHouse(lt) {
  const { x: bx, y: by, k } = baseOf(LP.house), A = leanA(lt), nL = count(tl28, 28, lt);
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,30,.28)'; ell(bx + 6 * k, by + 2 * k, 130 * k, 11 * k); ctx.fill();
  const shiver = clamp(Math.abs(A) / 40 + .25, 0, 1);
  for (let i = 0; i < nL; i++) {
    const sl = SLOTS[i], dt = lt - tl28(i), plop = dt < .16 ? Math.sin(seg(dt, 0, .16) * PI) : 0;
    const sw = swayAt(sl.y, A), dsw = A * 1.6 / HTOT * Math.pow(clamp(sl.y / HTOT), .6);
    const jx = Math.sin(lt * 13 + i * 2.1) * .9 * shiver, rot = sl.rot + Math.sin(lt * 11 + i * 1.3) * .018 * shiver + Math.atan(dsw) + (sl.kind === 'top' ? .09 * Math.sin(lt * 5.3) * (.4 + shiver) + (A > 20 ? .06 : 0) : 0);
    const x = bx + (sl.x + sw + jx) * k, y = by - sl.y * k - plop * 2.4 * k;
    if (sl.kind === 'floor') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan(dsw)); ctx.fillStyle = '#f2ead6'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.6, 2.4 * k); rr(-HL / 2 * k, -FT / 2 * k, HL * k, FT * k, 1.6 * k); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(90,70,50,.25)'; ctx.fillRect(-HL / 2 * k + 3, -FT / 2 * k + FT * k * .55, HL * k - 6, 1.2); ctx.restore();
    } else card(12 + i, false, x, y, HC * k * (1 + .06 * plop), rot, sl.kind === 'top' ? 1 : HSX);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the deck on the cart, the flights, the brick
// the top of the deck on the tray: where a card starts its flight
const deckXY = (lt, left) => { const [x, y, k] = V2.proj(cartXAt(lt) + 30, 162 + left * CT * .62, LP.cart[1] + 52); return { x, y: y - 3 * k, k }; };
function flights(lt) {
  const out = [], hb = baseOf(LP.house), br = baseOf(LP.brick);
  const add = (i, t0, fly, left, tx, ty, tk, slot, brick) => {
    const u = (lt - t0) / fly; if (u < 0 || u >= 1) return;
    const d = deckXY(t0, left), e = brick ? 1 - Math.pow(1 - u, 2.2) : easeIO(u), arc = (brick ? 34 : 74) * Math.sin(u * PI) * lerp(d.k, tk, e);
    const ph = PI * (1 + 2 * (i % 2)) * u, cf = Math.cos(ph), sq = Math.max(.1, Math.abs(cf)), back = cf > 0, stand = easeOut(seg(u, .25, .62));
    out.push({ i, u, x: lerp(d.x, tx, e), y: lerp(d.y, ty, e) - arc, k: lerp(d.k, tk, e), back, brick, slot,
      sx: brick ? 1 : sq * lerp(1, slot.kind === 'top' || slot.kind === 'floor' ? 1 : HSX, e), sy: brick ? sq : 1, flat: brick ? FLAT : lerp(FLAT, 1, stand), bar: slot.kind === 'floor' ? easeIO(seg(u, .55, 1)) : 0,
      rot: lerp(i % 2 ? .6 : -.5, slot.rot || 0, easeOut(u)) + Math.sin(u * PI) * ((i * 7) % 3 - 1) * .4 });
  };
  for (let i = 0; i < 12; i++) { if (lt >= sp12(i) && lt < tl12(i)) add(i, sp12(i), FLY12, 40 - i, br.x, br.y - (i + 1) * CT * CS * br.k - CH * FLAT * CS * br.k / 2, br.k * CS, { kind: 'flat', rot: 0 }, true); }
  for (let i = 0; i < 28; i++) {
    if (lt < sp28(i) || lt >= tl28(i)) continue;
    const sl = SLOTS[i], A = leanA(tl28(i));
    add(12 + i, sp28(i), FLY28, 28 - i, hb.x + (sl.x + swayAt(sl.y, A)) * hb.k, hb.y - sl.y * hb.k, hb.k * HC, sl, false);
  }
  return out;
}
function drawFlight(f) {
  ctx.save(); ctx.translate(f.x, f.y);
  if (f.slot.kind === 'floor' && f.bar > 0) { ctx.scale(1, lerp(f.flat, FT / CW, f.bar)); ctx.rotate(lerp(f.rot, PI / 2, f.bar)); } else { ctx.scale(1, f.flat); ctx.rotate(f.rot); }
  ctx.scale(f.k * f.sx, f.k * f.sy); blit(f.i, f.back); ctx.restore();
}
function drawBrick(lt) { const b = baseOf(LP.brick), n = n12(lt); flatStack(b.x, b.y, b.k, n, Math.max(0, n - 1), false); }
// the deck on the cart: forty cards that thin out as they are dealt
function drawDeck(lt) {
  const left = Math.max(0, 40 - spawned(lt)); if (left <= 0) return;
  const X = cartXAt(lt) + 30, Z = LP.cart[1] + 52;
  box3({ x0: X - 31 * CS, x1: X + 31 * CS, y0: 162, y1: 162 + left * CT * .62, z0: Z - 44 * CS, z1: Z + 44 * CS, color: '#2b3478', front: '#f2ead6', side: '#d8cfb8', top: '#3a47a0', lw: 1.6 });
}

// ------------------------------------------------------------------ props: the contract, the blank page, the sticker
Object.assign(PROP_BOX, { sticker11: [-10, -38, 54, 4], contract11: Object.assign([-6, -98, 62, 4], { mirror: true, nearFace: true }), sheet11: Object.assign([-6, -98, 62, 4], { mirror: true, nearFace: true }) });
// the laminated PER DIEM AGREEMENT on a 100 x 140 page (also the big insert): scale-free, origin top left
function paintContract(w, o = {}) {
  const u = w / 100;
  ctx.save(); ctx.scale(u, u);
  ctx.fillStyle = '#eaf6ff'; ctx.strokeStyle = 'rgba(25,16,30,.9)'; ctx.lineWidth = 1.1; rr(0, 0, 100, 140, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffef9'; ctx.strokeStyle = 'rgba(60,70,90,.35)'; ctx.lineWidth = .5; rr(3.6, 3.6, 92.8, 132.8, 3); ctx.fill(); ctx.stroke();
  // width of a string per unit of font size (measured large: tiny sizes get rounded advances)
  const em = (str, wt) => { ctx.font = `${wt} 100px Nunito`; return ctx.measureText(str).width / 100; };
  // text that never leaves its box: the size shrinks until the line fits maxW
  const T = (str, x, y, size, col, al = 'left', wt = 900, maxW = 0) => {
    if (maxW) size = Math.min(size, maxW / em(str, wt));
    ctx.save(); ctx.translate(x, y); ctx.scale(.05, .05); ctx.fillStyle = col; ctx.textAlign = al; ctx.textBaseline = 'middle'; ctx.font = `${wt} ${size * 20}px Nunito`; ctx.fillText(str, 0, 0); ctx.restore();
  };
  T('FRUIT BOWL REHAB & NURSING', 50, 10, 3, '#8a8fa6', 'center', 900, 72);
  T('PER DIEM AGREEMENT', 50, 18.6, 7.6, '#22285a', 'center', 900, 82);
  ctx.strokeStyle = '#22285a'; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(9, 25); ctx.lineTo(91, 25); ctx.moveTo(9, 26.8); ctx.lineTo(91, 26.8); ctx.stroke();
  T('between the Facility and S. BERRY, RN ("Per Diem")', 50, 31.4, 3, '#4a4f6a', 'center', 800, 82);
  const rows = [['1. SHIFT', '3:00 PM to 11:00 PM. Not 11:01.'], ['2. RESIDENTS', 'Twelve (12), as assigned. Not 13.'], ['3. DUTIES', 'Those in Appendix B. B is blank.'], ['4. HELPING', 'See Add-On (App. C). Not attached.'], ['5. BREAKS', 'As needed. By the Per Diem.'], ['6. RATE', '$118.00 per hour. Other budget.'], ['7. GIFTS', 'Any pen is a gift. To share.']];
  rows.forEach(([a, b2], i) => {
    const y = 40 + i * 9.2;
    if (i === 1 && o.hi > 0) { ctx.fillStyle = 'rgba(255,225,53,.82)'; ctx.fillRect(7, y - 4, 86 * clamp(o.hi), 7.8); }
    T(a, 8, y, 3.1, '#22285a', 'left', 900, 26); T(b2, 37, y, 3.1, '#2a3a8a', 'left', 800, 54);
    ctx.strokeStyle = 'rgba(120,130,160,.35)'; ctx.lineWidth = .35; ctx.setLineDash([.8, 1.4]); ctx.beginPath(); ctx.moveTo(8, y + 4.2); ctx.lineTo(92, y + 4.2); ctx.stroke(); ctx.setLineDash([]);
  });
  // the fine print: one paragraph, wrapped to the page
  const para = 'The Per Diem acknowledges that the Facility may, from time to time, ask, hint, imply, sigh, or look at her. None of the foregoing constitutes a request. Requests must be submitted in triplicate to the Other Budget. This agreement is laminated. It cannot be amended, folded, or reasoned with. See also: Appendix Q.';
  const FS = 2.4, lines = []; let cur = '';
  for (const wd of para.split(' ')) { const tryL = cur ? cur + ' ' + wd : wd; if (em(tryL, 700) * FS > 83 && cur) { lines.push(cur); cur = wd; } else cur = tryL; }
  if (cur) lines.push(cur);
  lines.forEach((ln, i) => T(ln, 8, 105 + i * 3.5, FS, '#8a8fa6', 'left', 700, 84));
  ctx.strokeStyle = '#22285a'; ctx.lineWidth = .5; ctx.setLineDash([1, 1.6]); ctx.beginPath(); ctx.moveTo(8, 126); ctx.lineTo(60, 126); ctx.stroke(); ctx.setLineDash([]);
  T('X', 8, 123.4, 4.2, '#22285a'); T('Per Diem', 34, 129.4, 2.6, '#8a8fa6', 'center', 800);
  ctx.fillStyle = '#2a3a8a'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(20, 123.6); ctx.rotate(-.06); ctx.scale(.05, .05); ctx.font = 'italic 800 92px Nunito'; ctx.fillText('S. Berry', 0, 0); ctx.restore();
  // the coffee ring, a stain that bleeds past the page text
  ctx.save(); ctx.translate(70, 92); ctx.strokeStyle = 'rgba(120,70,30,.5)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, 15.5, .3, TAU - .2); ctx.stroke(); ctx.strokeStyle = 'rgba(100,56,20,.3)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(.8, .6, 14.4, 1.2, 5.2); ctx.stroke();
  ctx.fillStyle = 'rgba(120,70,30,.22)'; ctx.beginPath(); ctx.arc(-14, 9, 1.7, 0, TAU); ctx.arc(16, -8, 1.1, 0, TAU); ctx.fill(); ctx.restore();
  // laminate sheen
  ctx.save(); rr(0, 0, 100, 140, 6); ctx.clip(); const sh = ((o.t || 0) * .12) % 1; ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(-20 + sh * 80, 0); ctx.lineTo(8 + sh * 80, 0); ctx.lineTo(-50 + sh * 80, 140); ctx.lineTo(-78 + sh * 80, 140); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.restore();
}
EXT.prop.contract11 = (side, o, t) => {   // held by the lower edge: the page rises from the glove and leans outward, so the hand never covers the print
  const s = o.ctS ?? 1; if (s <= .02) return;
  ctx.save(); ctx.rotate(side * -.1 + (o.ctRot || 0)); ctx.scale(s, s);
  ctx.save(); ctx.scale(side, 1); ctx.translate(-4, -94); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3; paintContract(64, { t }); ctx.restore();
  ctx.restore();
};
// a blank page that unfurls: a roll at the top lets the paper out (o.sheetK 0 to 1), then it hangs flat with a little flutter
EXT.prop.sheet11 = (side, o, t) => {
  const k = clamp(o.sheetK ?? 1); if (k <= .01) return;
  const H = 90 * easeOut(k), W2 = 64, fl = Math.sin(t * 7) * 1.2 * (1 - k * .6);
  ctx.save(); ctx.rotate(side * -.1 + (o.ctRot || 0)); ctx.scale(side, 1); ctx.translate(-4, 0);
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#fffefa'; ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(W2, -4); ctx.lineTo(W2 + fl, -4 - H); ctx.lineTo(fl * .4, -4 - H); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = V2.grad(0, 0, W2, 0, [[0, 'rgba(120,130,170,.16)'], [.15, 'rgba(255,255,255,0)'], [1, 'rgba(120,130,170,.12)']]); ctx.fillRect(0, -4 - H, W2 + 10, H + 4); ctx.restore();
  const r = lerp(6, 2, easeIO(seg(k, .7, 1)));   // the roll at the top, flattening
  ctx.fillStyle = V2.grad(0, -4 - H - r, 0, -4 - H + r, [[0, '#ffffff'], [.5, '#e2e6ee'], [1, '#b8bfcc']]); ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(fl * .4 - 3, -4 - H - r, W2 + 6 + fl * .6, r * 2, r); ctx.fill(); ctx.stroke();
  ctx.restore();
};
EXT.prop.sticker11 = (side, o, t) => {   // the NURSE sticker in Lemon's fingers, just before the slap
  ctx.save(); ctx.rotate(side * -.2); ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-6, -34, 56, 36, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-6, -34, 56, 17, 4); ctx.fill(); ctx.fillRect(-6, -24, 56, 7); ctx.strokeStyle = INK; rr(-6, -34, 56, 36, 4); ctx.stroke(); ctx.restore();
};
EXT.acc.tag11 = (o, k, t, layer) => {   // the sticker Lemon slaps on Clementine's left chest: NURSE in big letters, the contract line in comically small ones
  if (layer !== 'front') return;
  const p = o.tagP ?? 0; if (p <= .01) return;
  const pop = p < 1 ? easeBack(p) : 1;
  ctx.save(); ctx.translate(-k.rx * .44, k.ry * .66); ctx.rotate(-.1); ctx.scale(pop * (1 + .1 * (1 - clamp(p * 3))), pop * (1 - .06 * (1 - clamp(p * 3))));
  ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2; ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-37, -23, 74, 46, 5); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-37, -23, 74, 24, 5); ctx.fill(); ctx.fillRect(-37, -9, 74, 10); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; rr(-37, -23, 74, 46, 5); ctx.stroke();
  text('NURSE', 0, -11, { size: 21, font: 'Bangers', weight: 400, fill: '#fff', spacing: 1.5, maxW: 66 });
  text('(CONTRACT: NONE)', 0, 10, { size: 6, fill: '#2a2448', weight: 900, maxW: 66 });
  ctx.restore();
};

// ------------------------------------------------------------------ the cart (adapted from ep9.js medCart: casters that turn, a deck, the clipboard of assignment sheets)
function medCart(X, Z, o = {}) {
  const fog = { color: '#b9c4d6', amt: .2, zFar: 1900 }, k = kz(Z);
  ctx.save(); ctx.translate(0, -(o.jig || 0) * k);
  box3({ x0: X - 70, x1: X + 70, y0: 26, y1: 150, z0: Z, z1: Z + 90, color: '#5f7fa8', front: '#7794bd', side: '#476a92', top: '#8fb0d4', fog });
  for (let i = 0; i < 3; i++) onZ(Z, X - 60, X + 60, 36 + i * 38, 62 + i * 38, '#8fb0d4', 'rgba(25,16,30,.6)', 2);
  for (let i = 0; i < 3; i++) onZ(Z, X - 14, X + 14, 46 + i * 38, 52 + i * 38, '#e4e8ee', 'rgba(25,16,30,.5)', 1.4);
  box3({ x0: X - 84, x1: X + 84, y0: 150, y1: 162, z0: Z - 10, z1: Z + 100, color: '#d8e0ea', top: '#f2f5f9', fog });
  // the clipboard of assignment sheets, flat on the tray at the left
  box3({ x0: X - 76, x1: X - 34, y0: 162, y1: 166, z0: Z + 30, z1: Z + 90, color: '#b8864a', top: '#fffdf5', front: '#a8763a', side: '#8a5a2a', lw: 1.4 });
  if (o.deck) o.deck();
  ctx.restore();
  for (const dx of [-60, 60]) {
    const [wx, wy, wk] = V2.proj(X + dx, 13, Z + 18);
    ctx.save(); ctx.translate(wx, wy); ctx.fillStyle = '#2a2833'; ctx.strokeStyle = 'rgba(25,16,30,.7)'; ctx.lineWidth = 2; ell(0, 0, 14 * wk, 14 * wk); ctx.fill(); ctx.stroke();
    ctx.rotate(o.roll || 0); ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 2.4 * wk; ctx.beginPath(); ctx.moveTo(-9 * wk, 0); ctx.lineTo(9 * wk, 0); ctx.moveTo(0, -9 * wk); ctx.lineTo(0, 9 * wk); ctx.stroke(); ctx.restore();
  }
}

// ------------------------------------------------------------------ the cast
// a piecewise-constant lookup: the value of the first entry whose end time is still ahead
const pick = (lt, list) => list.find(([e]) => lt < e)[1];
function cast(lt) {
  const b = id => B(id), t = id => b(id).s;
  const [cX, cZ] = clemPath(lt);
  // ---- Strawberry: deadpan. The contract whips up on "Per my contract.", drops for the teaching pause, and is up again on "say:" until the verdict
  const ctUp = clamp(sk(lt, t('s1'), t('s1') + .26) * (1 - sk(lt, t('teach') + .1, t('teach') + .55)) + sk(lt, 14.73, 14.98) * (1 - sk(lt, 21.0, 21.4)));
  const ctOn = (lt >= t('s1') - .02 && lt < t('teach') + .6) || (lt >= 14.6 && lt < 21.5);
  const sp = straw(Object.assign(V2.at(...LP.straw), { who: inB(lt, 'c3') ? 'clem' : 'straw', arms: { l: 'rest', r: 'rest' }, hold: {}, grip: {} }));
  sp.look = pick(lt, [[1.3, [.75, .05]], [t('s1'), [.6, 0]], [t('deal'), [.15, 0]], [t('l2'), [.55, .75]], [t('s2'), [.9, .05]], [t('l3'), [.1, 0]], [t('s3'), [.55, 0]], [t('l4'), [.9, 0]], [t('c4'), [.45, 0]], [1e9, [.9, .1]]]);
  sp.expr = pick(lt, [[t('l1'), 'dead'], [t('s1'), 'sour'], [t('l2'), 'smug'], [t('s2'), 'dead'], [t('l3'), 'dead'], [t('teach'), 'sour'], [t('s3'), 'chill'], [t('c2'), 'smug'], [t('s4'), 'neutral'], [t('l4'), 'smug'], [t('c4'), 'sour'], [t('tag'), 'neutral'], [1e9, 'chill']]);
  sp.lid = inB(lt, 's1') || inB(lt, 's3') || inB(lt, 's4') ? .34 : .5;
  if (inB(lt, 's2')) { sp.arms.l = 'shrug'; }
  const UP = [2.5, .32], REST = [.28, .25];
  const GEST = [[0, REST], [13.55, UP], [14.62, REST], [18.05, UP], [18.9, REST]];
  const UP2 = [2.78, .2], gestM = tt => lerpA(REST, UP2, gest(tt)[0] > REST[0] + .01 ? (gest(tt)[0] - REST[0]) / (UP[0] - REST[0]) : 0);
  const gest = tt => { let cur = GEST[0][1]; for (let i = 1; i < GEST.length; i++) { const k = sk(tt, GEST[i][0] - .24, GEST[i][0]); if (k <= 0) break; cur = lerpA(GEST[i - 1][1], GEST[i][1], k); } return cur; };
  if (lt >= 12.3 && lt < 19.2) { sp.arms.l = gest(lt); sp.hand = Object.assign(sp.hand || {}, { l: 'point' }); }
  { const lean = sk(lt, 12.7, 13.0) * (1 - sk(lt, 16.5, 16.9)) + sk(lt, 17.9, 18.15) * (1 - sk(lt, 18.9, 19.2)); sp.rot = .055 * lean; }
  if (ctOn) { sp.hold = { r: 'contract11' }; sp.ctS = lerp(.4, 1, easeOut(seg(lt, t('s1') - .02, t('s1') + .12))); sp.arms.r = 'hold'; sp.grip.r = [lerp(80, /^cuS/.test(shotOf(lt)) ? 82 : 66, ctUp), lerp(96, -62, ctUp)]; sp.hand = { r: 'grip' };
    sp.ctRot = .16 * (pulse(lt, 15.26) + pulse(lt, 15.41) + pulse(lt, 15.68) + pulse(lt, 15.83)); }
  // ---- Clementine: eager. She steps out from behind the house on "Sure!"
  const cm = person(clem, clemPath, lt, { who: 'clem', stride: 34, arms: { l: 'rest', r: 'rest' } });
  cm.look = pick(lt, [[t('deal'), [-.4, .1]], [t('l2') + .8, [-.9, .5]], [7.3, [.1, .7]], [8.4, [0, -.8]], [t('s2'), [0, .1]], [t('teach'), [-.7, -.4]], [12.66, [.75, -.9]], [t('c2'), [-.8, .1]], [t('s4'), [-.5, .5]], [t('c3'), [-.8, .1]], [t('l4'), [-.1, .15]], [t('c4'), [-.3, .2]], [1e9, [-.5, .3]]]);
  cm.expr = pick(lt, [[t('l2') + 1.1, 'hopeful'], [8.3, 'shock'], [t('s2'), 'happy'], [t('teach'), 'happy'], [t('s3'), 'shock'], [t('c2') + .4, 'hopeful'], [t('s4'), 'sad'], [t('c3'), 'hopeful'], [t('l4'), 'smug'], [t('c4'), 'sad'], [t('tag'), 'happy'], [1e9, 'happy']]);
  if (lt >= 12.6 && lt < 17.0) { cm.arms.r = gestM(lt - .3); cm.hand = { r: 'point' }; }
  { const lean = sk(lt, 13.0, 13.3) * (1 - sk(lt, 16.8, 17.2)); cm.rot = -.055 * lean; }
  // the pause: the tower leans over her, one hand shoots up behind the cards to hold it, she flinches
  { const pk = sk(lt, 11.93, 12.15) * (1 - sk(lt, 12.7, 13.0)); if (pk > .001) cm.arms.r = lerpA(REST, UP, pk); const fl = lt - 12.0; if (fl >= 0 && fl < 1) { cm.squash = .07 * Math.exp(-fl * 6) * Math.cos(fl * 20); cm.plant = true; } }
  cm.acc = ['steth', 'pricetag', 'badge7', 'tag11']; cm.tagP = seg(lt, t('tag') + .1, t('tag') + .4);
  cm.lift = 14 * Math.sin(seg(lt, t('c1'), t('c1') + .34) * PI) + 12 * Math.sin(seg(lt, t('c4'), t('c4') + .34) * PI);
  // the blank page: rolled up in her left hand, unfurled on "a contract", held up like a shield on "Let me check my contract", rolled up again as Lemon says "You don't have one"
  const shK = Math.min(sk(lt, 17.15, 17.62), 1) * (1 - sk(lt, 20.5, 20.9));
  if (shK > .01) { cm.hold = { l: 'sheet11' }; cm.sheetK = shK; cm.arms.l = 'hold'; cm.hand = { l: 'grip' }; const up = sk(lt, 17.2, 17.6) * .6 + sk(lt, 19.0, 19.3) * .4; cm.grip = { l: [lerp(-84, -112, up), lerp(70, -52, up)] }; cm.ctRot = -.16 * (pulse(lt, 19.5) + pulse(lt, 19.77) + pulse(lt, 19.92)); }
  // ---- Lemon, behind the cart: both hands on the tray, one of them flicking while she deals
  const lm = person(lemon, lemonPath, lt, { who: 'lemon', arms: { l: 'rest', r: 'rest' }, transit: lt < 1.1 || (lt >= 22.8 && lt < t('tag') + .13) });
  lm.look = pick(lt, [[t('l1'), [.1, .1]], [t('l1') + 1.1, [-.7, .05]], [t('deal'), [-.7, .05]], [t('l2') - .2, [-.5, .5]], [t('c1') - .3, [.7, .15]], [t('s2'), [.5, .1]], [t('l3'), [0, .05]], [t('c2'), [0, 0]], [t('l4'), [-.2, 0]], [t('tag'), [0, 0]], [1e9, [.6, .3]]]);
  lm.expr = inB(lt, 'l3') ? 'smug' : 'neutral'; lm.lid = .26;
  const cx = cartXAt(lt), tray = (dx, dz = 52) => { const q = V2.proj(cx + dx, 170, LP.cart[1] + dz); return [q[0], q[1]]; };
  const fl = (a, c) => lt >= a && lt < c ? Math.sin(((lt - a) * 8.4 % 1) * PI) : 0;
  const flickL = fl(sp12(0) - .06, sp12(11) + .16), flickR = fl(sp28(0) - .06, sp28(27) + .16);
  const L0 = tray(-30 - 34 * flickL), R0 = tray(78 + 34 * flickR), trayK = 1 - sk(lt, 22.0, 22.3);
  handTo(lm, -1, L0[0], L0[1], trayK, [-84, 96]); handTo(lm, 1, R0[0], R0[1], trayK, [84, 96]);
  // the sticker: held up in her right hand as she steps over, thrust onto Clementine's left chest at the sting (cue 0.10 into the tag beat), held a moment, withdrawn
  const tSlap = t('tag') + .10, [tgx, tgy] = localToScreen(cm, -.44 * 104, .66 * 100);
  if (lt >= 22.3) {
    const kk = sk(lt, tSlap - .16, tSlap) * (1 - sk(lt, tSlap + .32, tSlap + .75)), up = sk(lt, 22.4, 22.8) * (1 - sk(lt, tSlap - .16, tSlap));
    handTo(lm, 1, tgx, tgy, kk, [lerp(84, 92, up), lerp(96, 20, up)]);
    if (lt < tSlap + .015) { lm.hold = { r: 'sticker11' }; lm.hand = { r: 'grip' }; }
  }
  // Clementine takes the slap: a squash and a gasp, then she looks down at the sticker, beams, and points at it
  const sl = lt - tSlap;
  if (sl >= 0) { cm.squash = .16 * Math.exp(-sl * 9) * Math.cos(sl * 24); cm.plant = true; }
  if (lt >= 22.9) { cm.expr = sl < .2 ? 'shock' : 'happy'; cm.look = sl < .22 ? [-.3, .5] : sl < .85 ? [-.5, .95] : [-.1, .1]; }
  if (sl >= .3) { const pk = sk(lt, tSlap + .3, tSlap + .6); cm.arms.r = 'hips'; handTo(cm, -1, tgx - 30 * cm.s, tgy + 42 * cm.s, pk, [-96, 60]); cm.hand = { l: 'open' }; }
  return { sp, cm, lm, cartX: cx, lmZ: lemonPath(lt)[1] };
}

// ------------------------------------------------------------------ inserts and overlays
// the contract, full frame: the laminate in a glove, held up against the blurred station; the marker sweeps the line that says twelve
function insContract(lt, c) {
  const u = lt - B('s1').e + .64, pop = easeBack(seg(u, 0, .2)), sc = lerp(1.25, 1, easeOut(seg(u, 0, .16))) , tr = .006 * Math.sin(lt * 31) * (1 - seg(u, .2, .5));
  V2.dof(16, () => { S7.stationBack({ noLabel: true, night: false, t: lt + 7, hours: 99, min: 6, hr: 3, board: [], lamps: [] }); S7.stationCounter({ night: false }); });
  ctx.fillStyle = 'rgba(16,10,34,.5)'; ctx.fillRect(-100, -100, W + 200, H + 200);
  const cx = 540, cy = 800, w = 640, h = w * 1.4;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.03 + tr); ctx.scale(sc * clamp(pop * 1.2), sc * clamp(pop * 1.2)); ctx.globalAlpha *= clamp(u * 9);
  reg('overlay', [cx - w / 2 - 12, cy - h / 2 - 12, cx + w / 2 + 12, cy + h / 2 + 12], { id: 'contract-insert', transit: u < .25 });
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; ctx.fillStyle = '#000'; rr(-w / 2, -h / 2, w, h, 40); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.translate(-w / 2, -h / 2); paintContract(w, { t: lt, hi: seg(u, .22, .62) }); ctx.restore();
  // the glove: the arm comes up from the lower right, the palm sits behind the lower edge, the fingers curl over it and the thumb presses the front
  const jig = Math.sin(lt * 27) * 2 * (1 - seg(u, .2, .5)), gl = V2.grad(0, 1130, 0, 1340, [[0, '#ffffff'], [1, '#cdd4e6']]);
  ctx.save(); ctx.globalAlpha *= clamp(u * 9); ctx.translate(0, jig); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const blob = (x, y, rx, ry, rot, lw) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = gl; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke(); };
  ctx.strokeStyle = INK; ctx.lineWidth = 116; ctx.beginPath(); ctx.moveTo(1230, 1640); ctx.lineTo(826, 1312); ctx.stroke();
  ctx.strokeStyle = LIMB; ctx.lineWidth = 92; ctx.beginPath(); ctx.moveTo(1230, 1640); ctx.lineTo(826, 1312); ctx.stroke();
  ctx.save(); ctx.translate(850, 1330); ctx.rotate(-.68); ctx.fillStyle = '#4a4258'; ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(-34, -64, 64, 128, 16); ctx.fill(); ctx.stroke(); ctx.restore();
  blob(776, 1288, 128, 86, -.2, 12);
  for (const [fx, fy, r2] of [[664, 1238, .1], [726, 1228, .04], [788, 1224, -.02], [850, 1228, -.1]]) { ctx.save(); ctx.translate(fx, fy); ctx.rotate(r2); ctx.beginPath(); ctx.roundRect(-30, -36, 60, 112, 28); ctx.fillStyle = gl; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
// the sticky note on the whiteboard: it slaps on at "say:", and the words write themselves as Strawberry says them
function sticky(lt) {
  const t0 = 14.9; if (lt < t0) return;
  const zb = 1900, k = kz(zb), u = lt - t0, pop = easeBack(seg(u, 0, .17)), sq = 1 + .2 * Math.max(0, 1 - u / .1);
  const [x, y] = p2(68, 420, zb);
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.06); ctx.scale(k * pop * sq, k * pop / sq);
  ctx.shadowColor = 'rgba(30,20,10,.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6; ctx.fillStyle = '#ffe66d'; ctx.beginPath(); ctx.moveTo(-76, -76); ctx.lineTo(76, -76); ctx.lineTo(76, 54); ctx.lineTo(54, 76); ctx.lineTo(-76, 76); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(180,140,20,.22)'; ctx.fillRect(-76, -76, 152, 14); ctx.fillStyle = 'rgba(160,110,0,.3)'; ctx.beginPath(); ctx.moveTo(76, 54); ctx.lineTo(54, 76); ctx.lineTo(56, 56); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,0,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-76, -76); ctx.lineTo(76, -76); ctx.lineTo(76, 54); ctx.lineTo(54, 76); ctx.lineTo(-76, 76); ctx.closePath(); ctx.stroke();
  const words = [['let', -32, -50, 15.07, 31], ['me', 26, -50, 15.26, 31], ['check', 0, -16, 15.41, 38], ['my', 0, 16, 15.68, 31], ['contract', 0, 48, 15.83, 31]];
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [wd, wx, wy, tw, sz] of words) {
    const p = easeBack(seg(lt, tw - .03, tw + .12)); if (p <= 0) continue;
    ctx.save(); ctx.translate(wx, wy); ctx.scale(p, p); ctx.rotate(-.03); ctx.font = `italic 900 ${sz}px Nunito`; ctx.fillStyle = '#2a3a8a'; ctx.fillText(wd, 0, 0); ctx.restore();
  }
  const ul = seg(lt, 15.95, 16.3); if (ul > 0) { ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-60, 66); ctx.quadraticCurveTo(0, 72, -60 + 120 * ul, 64); ctx.stroke(); }
  ctx.restore();
}
// the tally: 12 + 28 = 40, popping as Strawberry says "forty"
function tally(lt) {
  const t0 = wordT('s2', 'forty', 9.44) - .03, u = lt - t0; if (u < 0 || lt > 10.7) return;
  const pop = easeBack(seg(u, 0, .22)), out = 1 - seg(lt, 10.35, 10.65), bump = 1 + .08 * Math.max(0, Math.sin(u * 14)) * Math.exp(-u * 2.2);
  const cx = 770, cy = 250, w = 520, h = 146;
  ctx.save(); ctx.globalAlpha *= clamp(pop * 2) * out; ctx.translate(cx, cy); ctx.scale(pop * bump, pop * bump); ctx.rotate(-.03);
  reg('overlay', [cx - w / 2 * pop * bump, cy - h / 2 * pop * bump, cx + w / 2 * pop * bump, cy + h / 2 * pop * bump], { id: 'tally', transit: pop < 1 });
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.fillStyle = 'rgba(16,10,38,.92)'; rr(-w / 2, -h / 2, w, h, 46); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 6; rr(-w / 2, -h / 2, w, h, 46); ctx.stroke();
  text('12', -190, 6, { size: 80, font: 'Bangers', weight: 400, fill: '#7be0a0', lw: 10, stroke: '#150f22', spacing: 2 });
  text('+', -118, 6, { size: 60, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 8, stroke: '#150f22' });
  text('28', -48, 6, { size: 80, font: 'Bangers', weight: 400, fill: '#ff6a7e', lw: 10, stroke: '#150f22', spacing: 2 });
  text('=', 36, 6, { size: 60, font: 'Bangers', weight: 400, fill: '#ffffff', lw: 8, stroke: '#150f22' });
  text('40', 150, 4, { size: 112, font: 'Bangers', weight: 400, fill: '#ffd60a', lw: 14, stroke: '#150f22', spacing: 2 });
  ctx.restore();
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotOf(lt),
  cam(lt) {
    const sh = shotOf(lt), c = cast(lt), t = id => B(id).s;
    V2.setCam({ f: 1400, cy: 360, hy: 860 });
    const F = (o, z, up) => faceZoom({ kind: o.kind, x: o.x, y: o.y, s: o.s, lift: o.lift }, z, up);
    if (sh === 'wide') { const k = seg(lt, 0, 1.3); zoomTo(540, lerp(1090, 1080, k), lerp(.96, 1, k)); }
    else if (sh === 'wide2') zoomTo(lerp(700, 660, sk(lt, 6.2, 8.3)), lerp(1100, 1070, sk(lt, 6.2, 8.3)), lerp(1.12, .98, sk(lt, 6.2, 8.3)));
    else if (sh === 'cuL' || sh === 'cuL2' || sh === 'cuL3') { const k = seg(lt, shotStart(sh), shotStart(sh) + 1.8); F(c.lm, lerp(1.9, 2.0, k), 140); }
    else if (sh === 'cuS' || sh === 'cuS2' || sh === 'cuS3') { const k = seg(lt, shotStart(sh), shotStart(sh) + 1.1); F(c.sp, lerp(1.75, 1.85, k), 150); if (sh !== 'cuS3') CAM.x += 45; }
    else if (sh === 'cuC' || sh === 'cuC2' || sh === 'cuC3') { const k = seg(lt, shotStart(sh), shotStart(sh) + 1.2); F(c.cm, lerp(2.0, 2.12, k), 85); }
    else if (sh === 'deal') zoomTo(400, 1150, lerp(1.18, 1.26, seg(lt, t('deal'), t('l2'))));
    else if (sh === 'teach') zoomTo(560, 1095, .94);
    else if (sh === 'three' || sh === 'two') { const k = seg(lt, 12.68, 20.5); zoomTo(560, 1095, lerp(.94, .97, k)); }
    else if (sh === 'tag') { const k = sk(lt, t('tag') + .1, CUR.dur - .1), z = lerp(1.45, 2.25, k), cm = c.cm; const [fx, fy] = faceC({ kind: 'clem', x: cm.x, y: cm.y, s: cm.s, lift: cm.lift }); zoomTo(lerp(610, cm.x - 70, k), lerp(1040, fy + 70 + 20 / z * 0, k), z); }
    else zoomTo(540, 1010, 1);
  },
  draw(lt) {
    const sh = shotOf(lt), c = cast(lt), crisp = CRISP[sh] || ['lemon', 'straw', 'clem'];
    V2.setLight({ key: [-.35, -.8], keyColor: '#fff4dc', keyA: .24, rim: '#8fb8ff', rimA: .4, shadow: '#2a2038', shadowA: .3, amb: '#fff0d8', ambA: .06 });
    V2.opts.reflect = true;
    if (sh === 'contract') { insContract(lt, c); return; }
    const board = [
      { t: 'TODAY', x: .05, y: .14, size: .105, color: '#2a5ac8', rot: -.02, p: 1 },
      { t: 'PER DIEM: STRAWBERRY', x: .05, y: .29, size: .066, color: '#d62a3a', rot: -.01, p: 1 },
      { t: 'STAFF: CLEMENTINE', x: .05, y: .44, size: .074, color: '#2a5ac8', rot: -.01, p: 1 },
      { t: 'RESIDENTS: 40', x: .05, y: .62, size: .078, color: '#d62a3a', rot: -.01, p: seg(lt, 10.2, 11.2), under: .6 },
    ];
    const blurPx = crisp.length === 1 ? 9 : 0;
    V2.dof(blurPx, () => { S7.stationBack({ noLabel: sh !== 'wide', night: false, t: lt + 7, hours: 99, min: 6, hr: 3, board, lamps: [] }); sticky(lt); });
    S7.stationCounter({ night: false });
    const nbr = o => V2.dof(NBR[sh] ?? 6, () => drawBg(o)), lmBlur = sh === 'tag' ? sk(lt, 23.1, 23.6) * 6 : 0, lmSoft = sh === 'tag' && lt >= 23.45;
    const bg = (o, who) => who === 'lemon' && sh === 'tag' ? V2.dof(lmBlur, () => (lmSoft ? drawBg : drawChar)(o)) : crisp.includes(who) ? drawChar(o) : nbr(o);
    const items = [{ z: c.lmZ, fn: () => bg(c.lm, 'lemon') }, { z: LP.cart[1], fn: () => medCart(c.cartX, LP.cart[1], { roll: c.cartX / 14, deck: () => drawDeck(lt) }) }, { z: LP.straw[1], fn: () => bg(c.sp, 'straw') }, { z: LP.straw[1] - .1, fn: () => bg(c.cm, 'clem') }].sort((a, b2) => b2.z - a.z);
    for (const it of items) it.fn();
    V2.dof(sh === 'tag' ? sk(lt, 23.0, 23.6) * 8 : (FGBLUR[sh] || 0), () => { drawBrick(lt); drawHouse(lt); });
    for (const f of flights(lt)) drawFlight(f);
    V2.dust(60, 600, 1020, 1400, lt, { n: 26, alpha: .3 });
  },
  fx: lt => ({ bloom: .5, vignette: .4, grain: .045, contrast: .14, sat: .12, tint: [['#ffd9a0', .1, 'soft-light']], fade: Math.max(seg(lt, CUR.dur - .3, CUR.dur - .02), lt < .25 ? 1 - lt / .25 : 0), fadeColor: '0,0,10' }),
  blur: lt => lt > 5.2 && lt < 8.3 ? 3 : 1,
  over(lt) {
    tally(lt);
    const f0 = B('deal').s + .10;   // the flips cue: the cards flick out one after another
    sfxWord(lt, f0, 'FLIP', 300, 1330, { rot: -.12, size: 112, hold: .55 });
    sfxWord(lt, f0 + .15, 'FLIP', 560, 1376, { rot: .05, size: 112, hold: .5 });
    sfxWord(lt, f0 + .30, 'FLIP!', 820, 1326, { rot: -.08, size: 124, hold: .5 });
  },
};
const shotStart = sh => { let t0 = 0; for (const [n, e] of SHOTS()) { if (n === sh) return t0; t0 = e; } return t0; };

window.__EP11_SCENES = window.__EP11_SCENES || {};
window.__EP11_SCENES.orient = SC;
})();
