'use strict';
/* SHIFT HAPPENS, Episode 13 set kit: the nurses' station, the hall and the break room door. Exposed as window.S13.
 * Used by the scenes `open` (7:02 PM) and `cross` (7:15 PM); the hall and vault scenes read the door and the call-light board from here.
 * World units: X right, Y up, Z forward (the Episode 6 convention, V2.proj). Every function draws with the CURRENT camera (V2.setCam) and the current transform, so a scene
 * dollies, pans and zooms freely. All text goes through the UI kit (ui.js): set dressing is hero:false, anything the viewer must read is a hero UI.sign / UI.label.
 *
 * HOW TO CALL IT
 *   S13.cam('station' | 'foyer' | 'hall', extra)   V2.setCam with the lens of that place (extra overrides: cz dollies, cx trucks)
 *   S13.light('evening' | 'dusk' | 'night' | 'hall' | 'foyer', extra)   V2.setLight preset; call before drawChar
 *   S13.station(lt, o)  FIRST: the back of the nurses' station (walls, ceiling lamps, doorway to the hall, whiteboard, clock, Q sign, BREAKS TAKEN TODAY board, call-light
 *                       board, window with the dusk). o: { t, sky 0..1 (golden to deep dusk), min, hr (the wall clock), hours (the Q sign), breaks (0 now, 1 at the end), breaksRoll (0..1 the
 *                       digit rolling over), board ('schedule' | 'blank'), calls (the call-light board state, see callBoard), ping (0..1 the far dome in the hall), lampsOn,
 *                       sun (0..1 the window beam and dust), slide (0..1 the projector's light on the whiteboard; the scene draws the slide itself on S13.slideRect()) }.
 *                       Returns { box: {name: [x, y, w, h] screen rects of the boards}, k } for the current camera.
 *   S13.counter(o)      the counter with monitors, phone, papers and a cup: draw it AFTER anyone seated behind it, BEFORE anyone standing in front. o: { t, phoneRing 0..1 }
 *   S13.medCart(X, Z, o), S13.chair(X, Z, o)    standing props at a world point
 *   S13.callBoard(x, y, w, h, lit, o)   the 32-dome board, flat in the current space: lit(i, t) -> null | level | [rgb 'r,g,b', level]; o { t, title, labels, hero, dim }
 *   S13.scoreboard(cx, cy, w, h, value, o)  the flip-digit BREAKS TAKEN TODAY board, flat: value, o { roll 0..1 (value-1 rolls into value), hero }
 *   S13.hall(o)         the long hall (S6.corridor) with domes on every door and, at the far end, the break room door. o: { doors, fog, lampOn, bright, door: {...breakDoor options} }
 *   S13.foyer(o)        the dead end in front of the break room door (a wider vestibule): returns the door's screen frame
 *   S13.breakDoor(x, y, k, o)   the steel door in elevation: x centre, y floor line, k px per world unit. o { locks: {reader, tape, wet, bolts, padlock, chain} each 0 locked .. 1 released,
 *                       ajar 0..1 (swing), t, reader: {state 'idle'|'read'|'ok', k}, sign (true by default), dust 0..1, hero (true when the sign is big enough) }
 *   S13.reader(x, y, k, o)   the card reader on its plate (used by breakDoor, also callable alone for a macro): o { state 'idle' | 'read' | 'ok', k (0..1 the screen's fade-in), t }
 *   S13.LAY, S13.PAL, S13.sfxWord, S13.wordT, S13.route, S13.pulse, S13.sk, S13.pts (screen points of the layout in the current camera)
 *
 * LAYOUT (world units; the 'station' camera sits at X 0, eye height 360 (cy), looks along +Z with f 1400 and the horizon at screen y 720 (hy); a scene may change f, cz (dolly), cx (truck), cy)
 *   back wall at Z 1900, half width 820, ceiling 1100, wainscot rail 120.
 *   doorway to the hall at the left end of the back wall, X -690..-310, Y 0..570: through it the hall runs away to the left (hallBeyond: centred at X -500, walls at -830 and -170)
 *   top row  (Y 840..1040): Q sign above the doorway (X -690..-390, Y 870..990), BREAKS TAKEN TODAY centre (X -340..180), the call-light board (X 230..520, Y 870..1030), the wall clock (X 612, Y 950)
 *   middle   (Y 150..740): the schedule whiteboard / projection wall (X -250..270, Y 420..740: S13.slideRect()), the window with the dusk (X 330..690, Y 150..560)
 *   counter  X -120..720, Z 1380..1520, top Y 190 (front face toward the camera); the cast stands in front of it at Z 1000..1300 and sits behind it at Z 1560..1640
 *   the window's sun lands on the floor as bright bands (sunPatch, o.sunX slides it) and in the air as shafts (S13.shafts, draw it after the cast)
 */
(() => {
if (!window.TIMELINE_EP13) return;
const { p2, poly, quad3, grad, radial, rgba, mix } = V2;
const S6 = window.S6, S7 = window.S7, A7 = window.A7, A6 = window.A6;
const { box3, onZ, kz, lit, ceilingLamp, wallClock } = S6;
const INKC = 'rgba(25,16,30,.62)';
const hexc = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => hexc(V2.rgb(c).map(v => v * f));                       /* like S6.lit, but a colour V2.mix can read back */
const mixh = (a, b, t) => hexc(V2.mix(a, b, t));
const cl01 = x => Math.max(0, Math.min(1, x));
const sk = (t, a, b) => { const k = cl01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
/* a damped wobble that starts at t0 (a tap, a clunk) */
const pulse = (t, t0, hz = 36, tau = .07) => t < t0 ? 0 : Math.sin((t - t0) * hz) * Math.exp(-(t - t0) / tau);

// ------------------------------------------------------------------ helpers copied from the earlier episodes (ep9_floor.js, ep11_orient.js)
// scene-relative time of a spoken word, from the recorded line's word timings (a word is line-relative in the timeline)
const wordT = (id, word, fb = 0) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// a route through keyed positions [t, X, Z, ease]: linear travel between keys, 'io' or 'out' to ease a leg
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = cl01((lt - a[0]) / (b[0] - a[0])), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// an onomatopoeia that pops in, holds and fades (copied from ep9_floor.js sfxWord; the text goes through the UI kit here so it is centred on its ink)
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  const s = lerp(1.25, 1, easeOut(k));
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(s, s);
  UI.label(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14, rot: o.rot ?? -.08, tilt: .3, transit: !!o.transit });
  ctx.restore();
}

// ------------------------------------------------------------------ palette and layout
const PAL = {
  cyan: '#4de3ff', red: '#ff3b4e', gold: '#ffc83d', glass: 'rgba(8,10,20,.78)', ink: '#15111a',
  eve: { wall: '#eadcbf', wain: '#4b7f86', floorA: '#cdbf9f', floorB: '#9c8f76', ceil: '#e9e5da', fog: '#a9a2b0', fogAmt: .28 },
  dusk: { wall: '#cfc6c8', wain: '#3d6672', floorA: '#a39a92', floorB: '#7a7480', ceil: '#cfcdd6', fog: '#7f86a8', fogAmt: .32 },
  night: { wall: '#6e78a6', wain: '#32505c', floorA: '#585a76', floorB: '#42445e', ceil: '#6a6e92', fog: '#262a50', fogAmt: .3 },
  dome: { call: '255,255,255', amber: '255,176,60', red: '255,59,78', blue: '80,165,255', green: '90,230,130' },
};
const LAY = {
  zb: 1900, hw: 820, ch: 1100, rail: 120,
  cam: { f: 1400, cy: 360, hy: 720 },
  doorway: { x0: -690, x1: -310, y1: 570 },
  hallw: { cx: -500, hw: 330, ch: 700, z1: 6400 },             /* the hall beyond the doorway: centred at X -500, running away from the back wall */
  qsign: { x0: -690, x1: -390, y0: 870, y1: 990 },
  score: { x0: -340, x1: 180, y0: 840, y1: 1040 },
  call: { x0: 230, x1: 520, y0: 870, y1: 1030 },
  clock: { X: 612, Y: 950, r: 60 },
  board: { x0: -250, x1: 270, y0: 420, y1: 740 },              /* the schedule whiteboard: also the projection wall */
  win: { x0: 330, x1: 690, y0: 150, y1: 560 },
  counter: { x0: -120, x1: 720, z0: 1380, z1: 1520, top: 190 },
  seatLemon: { X: 340, Z: 1600, seat: 150 },
  cartAt: { X: -150, Z: 1260 },
  chairAt: { X: 60, Z: 1230 },
};
const CAMB = LAY.cam;
const kzP = Z => V2.P.f / (Z - V2.P.cz);

// ------------------------------------------------------------------ cameras and lights
const CAMS = {
  station: { f: 1400, cy: 360, hy: 720 },
  foyer: { f: 1400, cy: 330, hy: 760 },
  hall: { f: 1400, cy: 360, hy: 800 },
};
function cam(kind = 'station', extra = {}) { V2.setCam(Object.assign({}, CAMS[kind] || CAMS.station, extra)); }
function light(kind = 'evening', extra = {}) {
  const L = {
    /* the low sun through the window, right and behind: a warm key from the right, a cool rim from the left, a little backlight */
    evening: { key: [.52, -.62], keyColor: '#ffbf80', keyA: .3, rim: '#9fc0ff', rimA: .42, shadow: '#2a2038', shadowA: .34, bounce: '#ffd9a0', bounceA: .16, amb: '#ffe6c8', ambA: .05 },
    dusk: { key: [.4, -.7], keyColor: '#ffd9b0', keyA: .24, rim: '#8fb0ff', rimA: .5, shadow: '#1d1a34', shadowA: .36, bounce: '#ffcf9a', bounceA: .14, amb: '#dfe6ff', ambA: .06 },
    night: { key: [-.3, -.85], keyColor: '#b8c8ff', keyA: .16, rim: '#7f9cff', rimA: .5, shadow: '#0a0a1e', shadowA: .42, amb: '#aab4e8', ambA: .12 },
    hall: { key: [-.3, -.85], keyColor: '#f4f6ff', keyA: .22, rim: '#8fb8ff', rimA: .45, shadow: '#1a1830', shadowA: .3, amb: '#dfe6ff', ambA: .05 },
    foyer: { key: [-.25, -.9], keyColor: '#eaf4ff', keyA: .24, rim: '#7fa8ff', rimA: .5, shadow: '#14122a', shadowA: .38, bounce: '#cfe0ff', bounceA: .1, amb: '#cfdcff', ambA: .07 },
  };
  V2.setLight(Object.assign({}, L[kind] || L.evening, extra));
}

// ------------------------------------------------------------------ small perspective helpers
// the screen rectangle [x, y, w, h] of a world rectangle on a plane of depth Z (front-on to the camera)
const wallBox = (Z, x0, y0, x1, y1) => { const a = p2(x0, y1, Z), b = p2(x1, y0, Z); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; };
const wallPoly = (Z, x0, y0, x1, y1) => [p2(x0, y0, Z), p2(x1, y0, Z), p2(x1, y1, Z), p2(x0, y1, Z)];
const clipPoly = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); };

// ------------------------------------------------------------------ the sky in the window: a low sun, clouds lit from below, a lot of cars, a tree line; sky 0 = golden, 1 = deep dusk
function sky(f, t, k, sunk) {
  /* f = the four corners [bottom-left, bottom-right, top-right, top-left] of the glass, the clip is already set */
  const [bx, by] = f[0], [rx] = f[1], [, ty] = f[2], w = rx - bx, h = by - ty;
  const S0 = [[0, '#34428c'], [.32, '#8a58a0'], [.58, '#ff8a5a'], [.82, '#ffb070'], [1, '#ffd9a0']], S1 = [[0, '#10163e'], [.34, '#34306e'], [.62, '#9a4878'], [.86, '#ff6a4a'], [1, '#ff8a5a']];
  ctx.fillStyle = grad(0, ty, 0, by, S0.map(([o, c], i) => [o, mixh(c, S1[i][1], sunk)])); ctx.fillRect(bx - 4, ty - 4, w + 8, h + 8);
  const sx = bx + w * .3, sy = by - h * (.3 - .1 * sunk);
  V2.glow(sx, sy, h * .9, sunk > .5 ? '255,150,100' : '255,206,140', .55 - .2 * sunk, 'screen', 1.0);
  ctx.fillStyle = `rgba(255,${240 - 70 * sunk | 0},${196 - 90 * sunk | 0},${.95 - .2 * sunk})`; ctx.beginPath(); ctx.arc(sx, sy, h * .065, 0, TAU); ctx.fill();
  A7.clouds(t, ty + h * .2, ty + h * .6, { n: 4, tint: '255,196,140', belly: '150,80,120', a: .6, speed: 3, seed: 5, scale: .42 });
  // the lot across the way: a roofline, a tree line, two parked cars
  ctx.fillStyle = mixh('#5a3a4a', '#24204a', sunk); ctx.beginPath(); ctx.moveTo(bx, by - h * .17);
  for (let i = 0; i <= 14; i++) ctx.lineTo(bx + w * i / 14, by - h * (.17 + .06 * Math.sin(i * 1.9) + .035 * Math.sin(i * 4.3)));
  ctx.lineTo(rx, by); ctx.lineTo(bx, by); ctx.fill();
  ctx.fillStyle = mixh('#3a2a3a', '#161434', sunk); ctx.fillRect(bx, by - h * .11, w, h * .11);
  for (const [cx, cw, c] of [[.12, .3, '#9a2d46'], [.58, .32, '#2c6f9a']]) { ctx.fillStyle = mixh(c, '#1a1030', .45 + .3 * sunk); rr(bx + w * cx, by - h * .17, w * cw, h * .1, h * .03); ctx.fill(); }
}
function windowDusk(t, o = {}) {
  const { x0, x1, y0, y1 } = LAY.win, zb = LAY.zb, sunk = cl01(o.sky ?? 0), k = kzP(zb);
  onZ(zb, x0 - 22, x1 + 22, y0 - 22, y1 + 22, '#e8dfc9', INKC, 2.6);
  const f = wallPoly(zb, x0, y0, x1, y1);
  ctx.save(); clipPoly(f);
  sky(f, t, k, sunk);
  // the venetian blinds, drawn up: a short stack of slats at the top, a cord down the side
  const slats = 6, hh = (y1 - y0) * .2;
  for (let i = 0; i < slats; i++) { const yy = y1 - i * (hh / slats); onZ(zb, x0, x1, yy - hh / slats * .74, yy, `rgb(${232 - 22 * sunk | 0},${222 - 42 * sunk | 0},${200 - 44 * sunk | 0})`, 'rgba(60,40,30,.4)', 1.4); }
  { const a = p2(x1 - 26, y1 - hh, zb), b = p2(x1 - 26, y0 + (y1 - y0) * .62, zb); ctx.strokeStyle = 'rgba(70,60,50,.7)'; ctx.lineWidth = Math.max(1.5, 3 * k); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.fillStyle = '#d6cdb8'; ell(b[0], b[1] + 6 * k, 5 * k, 8 * k); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(f[0][0] + (f[1][0] - f[0][0]) * .1, f[0][1]); ctx.lineTo(f[0][0] + (f[1][0] - f[0][0]) * .32, f[0][1]); ctx.lineTo(f[3][0] + (f[2][0] - f[3][0]) * .6, f[3][1]); ctx.lineTo(f[3][0] + (f[2][0] - f[3][0]) * .38, f[3][1]); ctx.closePath(); ctx.fill();
  ctx.restore();
  onZ(zb, x0 - 30, x1 + 30, y0 - 34, y0 - 12, '#e4dac6', INKC, 2);
  const c = p2((x0 + x1) / 2, (y0 + y1) / 2, zb);
  V2.glow(c[0], c[1], 420 * k, '255,170,100', .2 * (1 - .5 * sunk) * (o.glow ?? 1), 'screen', .9);
}

// ------------------------------------------------------------------ the boards on the back wall
/* the BREAKS TAKEN TODAY scoreboard, flat in the current space (cx, cy centre; w, h size). The number is a roll: the previous value slides out upward as the new one slides in from below. */
function scoreboard(cx, cy, w, h, value = 0, o = {}) {
  const x = cx - w / 2, y = cy - h / 2, id = o.id || 'score13', scr = (typeof CAM !== 'undefined' && CAM.z) || 1;
  const tw0 = w * .56, fs = UI.fit('BREAKS TAKEN', tw0, { size: h * .225, weight: 900, spacing: h * .012 }).size;
  /* the title is read when it comes out at 30 px or more on screen (after fitting); the digit is much bigger. Far away they are set dressing (hero false) */
  const hero = o.hero ?? (fs * scr >= 31), heroD = o.hero ?? (h * .62 * scr >= 31);
  UI.panel([x, y, w, h], { fill: ['#1b1d26', '#0f1118'], stroke: '#cfd3da', lw: Math.max(2, h * .03), r: h * .1, shadow: h * .1, id, kind: 'sign', pad: h * .08 });
  // the title block on the left: two lines, left aligned on one margin
  const tw = w * .56, tx = x + h * .12;
  UI.lines(['BREAKS TAKEN', 'TODAY'], tx + tw / 2, cy - h * .06, { align: 'center', size: h * .225, weight: 900, fill: '#f6f3e8', spacing: h * .012, lh: 1.22, v: 'mid', hero, cid: id, center: false, maxW: tw });
  // the number card on the right: a dark card with a hinge line and the digit rolling inside it
  const cw = h * .66, ch2 = h * .8, cxx = x + w - h * .1 - cw / 2, cyy = cy;
  ctx.save(); rr(cxx - cw / 2, cyy - ch2 / 2, cw, ch2, h * .07); ctx.fillStyle = grad(0, cyy - ch2 / 2, 0, cyy + ch2 / 2, [[0, '#3b3f4d'], [.5, '#2a2d38'], [.5, '#1d2029'], [1, '#2a2d38']]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  const roll = cl01(o.roll ?? 0), val = Math.round(value), prev = Math.max(0, val - 1);
  ctx.save(); rr(cxx - cw / 2 + 3, cyy - ch2 / 2 + 3, cw - 6, ch2 - 6, h * .06); ctx.clip();
  const dig = (n, off) => UI.label(String(n), cxx, cyy + off, { size: h * .62, font: 'Bangers', weight: 400, fill: '#ffe135', spacing: 0, hero: heroD, crop: roll > 0 && roll < 1, cid: roll > 0 && roll < 1 ? undefined : id, center: false });
  if (roll > 0 && roll < 1) { const e = easeIO(roll); dig(prev, -e * ch2); dig(val, (1 - e) * ch2); } else dig(roll >= 1 ? val : prev === val ? val : (o.roll == null ? val : prev), 0);
  ctx.restore();
  /* the hinge line over the digit: drawn at alpha under .5 so the text gate does not count it as covering the number */
  ctx.save(); ctx.globalAlpha = .46; ctx.fillStyle = '#000'; ctx.fillRect(cxx - cw / 2 + 3, cyy - 2, cw - 6, 4); ctx.globalAlpha = .12; ctx.fillStyle = '#fff'; ctx.fillRect(cxx - cw / 2 + 3, cyy + 2, cw - 6, 2); ctx.restore();
  return { id, x0: x, y0: y, x1: x + w, y1: y + h };
}

// the Q-word sign: the Episode 7 sign with its seven-segment digits, its title redone through the UI kit so it is centred on its ink
function qSign(hours, o = {}) {
  const { x0, x1, y0, y1 } = LAY.qsign, zb = LAY.zb, f = S7.qSign(zb, { x0, x1, y0, y1 }, hours, Object.assign({}, o, { title: '' }));
  const cx = (f[0][0] + f[1][0]) / 2, w = f[1][0] - f[0][0], h = f[0][1] - f[2][1], top = f[2][1];
  UI.container('q13', 'sign', [f[0][0], top, f[1][0], f[0][1]], h * .04);
  UI.label(o.title ?? 'HOURS SINCE THE Q WORD', cx, top + h * .18, { size: h * .17, weight: 900, fill: 'rgba(255,255,255,.88)', spacing: h * .02, maxW: w * .9, hero: false, cid: 'q13', center: true, centerY: false });
  return f;
}

// the schedule whiteboard: marker writing on a grid of two columns, set dressing. mode 'schedule' (the evening's assignments) or 'blank' (the projector is using it)
const SCHED = [['LEMON', 'CHARGE'], ['STRAWBERRY', 'RMS 1 - 16'], ['MANGO', 'RMS 17 - 32'], ['CLEMENTINE', 'SURE!']];
function whiteboard(mode = 'schedule') {
  const { x0, x1, y0, y1 } = LAY.board, zb = LAY.zb;
  onZ(zb, x0 - 14, x1 + 14, y0 - 14, y1 + 14, '#c3c9d2', INKC, 2.4);
  const f = wallPoly(zb, x0, y0, x1, y1); poly(f, grad(0, f[2][1], 0, f[0][1], [[0, '#ffffff'], [1, '#e6ebf1']]), 'rgba(25,16,30,.4)', 2);
  onZ(zb, x0 - 14, x1 + 14, y0 - 32, y0 - 12, '#aab2bd', INKC, 1.6);
  for (const [a, c] of [[x0 + 60, '#2a5ac8'], [x0 + 110, '#d62a3a'], [x0 + 160, '#1f9a52']]) onZ(zb, a, a + 34, y0 - 28, y0 - 14, c, INKC, 1);   /* markers in the tray */
  if (mode === 'blank') return;
  const [bx, by, bw, bh] = wallBox(zb, x0, y0, x1, y1), left = bx + bw * .075, col2 = bx + bw * .5, sz = bw * .066, pitch = bh * .152, top = by + bh * .13;
  const base = { weight: 800, italic: true, hero: false, maxW: bw * .4 };
  UI.write('3 TO 11', left, top, Object.assign({ size: sz * 1.25, fill: '#2a5ac8' }, base, { maxW: bw * .5 }));
  SCHED.forEach(([n, r], i) => { const b = top + pitch * (i + 1); UI.write(n, left, b, Object.assign({ size: sz, fill: '#2a3f8a' }, base)); UI.write(r, col2, b, Object.assign({ size: sz, fill: i === 3 ? '#1f9a52' : '#2a3f8a' }, base)); });
  const b6 = top + pitch * 5.25;
  UI.write('BREAK 6:00', left, b6, Object.assign({ size: sz, fill: '#d62a3a' }, base));
  const pw = UI.write('PENDING', col2, b6, Object.assign({ size: sz, fill: '#d62a3a' }, base));
  ctx.strokeStyle = '#d62a3a'; ctx.lineWidth = Math.max(2, sz * .09); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pw.x0, b6 + sz * .24); ctx.quadraticCurveTo((pw.x0 + pw.x1) / 2, b6 + sz * .42, pw.x1, b6 + sz * .2); ctx.stroke();   /* underlined */
}

// ------------------------------------------------------------------ the call-light board: 32 domes, 8 across and 4 down, flat in the current space
const CALLCOL = { call: '255,255,255', amber: '255,176,60', red: '255,59,78', blue: '80,165,255', green: '90,230,130' };
function callBoard(x, y, w, h, lit_, o = {}) {
  const t = o.t ?? 0, id = o.id || 'call13', hero = o.hero === true, dim = o.dim ?? 0;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = h * .08; ctx.shadowOffsetY = h * .03; ctx.fillStyle = '#20242c'; rr(x, y, w, h, h * .05); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = Math.max(2, h * .018); rr(x, y, w, h, h * .05); ctx.stroke();
  const hh = h * .16; ctx.fillStyle = '#12151b'; rr(x + h * .03, y + h * .03, w - h * .06, hh, h * .03); ctx.fill();
  ctx.restore();
  UI.container(id, 'sign', [x, y, x + w, y + h], h * .03);
  UI.label(o.title ?? 'NURSE CALL', x + w / 2, y + h * .03 + hh / 2, { size: hh * .52, weight: 900, fill: '#c9d2e6', spacing: hh * .08, maxW: w * .7, hero, cid: id, center: false });
  const cols = 8, rows = 4, gx = w / cols, gy = (h - hh - h * .06) / rows, r0 = Math.min(gx, gy) * .3, top = y + h * .03 + hh + h * .02, cells = [];
  for (let i = 0; i < 32; i++) {
    const c = i % cols, r = Math.floor(i / cols), cx = x + gx * (c + .5), cy = top + gy * (r + .5);
    let st = lit_ ? lit_(i, t) : null; if (typeof st === 'number') st = [CALLCOL.amber, st]; const on = st && st[1] > .02, lv = on ? st[1] : 0, rgb = on ? st[0] : '0,0,0';
    ctx.fillStyle = '#0c0e12'; ell(cx, cy, r0 * 1.22, r0 * 1.22); ctx.fill();
    ctx.fillStyle = on ? `rgba(${rgb},${.5 + .5 * lv})` : `rgba(${58 - 14 * dim | 0},${63 - 14 * dim | 0},${72 - 14 * dim | 0},1)`; ell(cx, cy, r0, r0); ctx.fill();
    ctx.fillStyle = on ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.16)'; ell(cx - r0 * .3, cy - r0 * .34, r0 * .34, r0 * .26); ctx.fill();
    if (on) V2.glow(cx, cy, r0 * 3.2, rgb, .55 * lv, 'screen', .55);
    cells.push({ cx, cy, r: r0 });
  }
  return { id, cells, x0: x, y0: y, x1: x + w, y1: y + h };
}

// ------------------------------------------------------------------ the hall beyond the doorway (true perspective: the same camera, the hall starts behind the back wall)
// through the doorway you see the hall's left wall run away to the right, its doors and their call-light domes, the floor, the ceiling fixtures. S6.corridor cannot start behind a wall, so
// this is a lean version of it (walls, rail, doors with domes, fixtures; the logic follows ep6_sets.js corridor/doorUnit).
const HDOORS = [];
for (let i = 0; i < 12; i++) HDOORS.push({ z: 2330 + i * 400, c: ['#9d6b74', '#6d8f88', '#a8744f', '#8e6f55'][i % 4] });
const PING_DOOR = 3;                                                  /* the door whose dome dings in the first shot */
function hallBeyond(t, o = {}) {
  const D = LAY.doorway, H = LAY.hallw, zb = LAY.zb, XL = H.cx - H.hw, XR = H.cx + H.hw, CH = H.ch, zE = H.z1, rgbF = '184,196,218', fogC = '#b8c4da';
  const fa = .42, fz = z => Math.pow(cl01((z - zb) / (zE - zb)), .8) * fa, fogc = (c, z) => rgba(mix(c, fogC, fz(z)), 1);
  const wq = (y0, y1, z0, z1, fill, st, lw) => poly([p2(XL, y0, z0), p2(XL, y1, z0), p2(XL, y1, z1), p2(XL, y0, z1)], fill, st, lw);
  const wg = (y, base, boost = 1) => { const xa = p2(XL, y, zb)[0], xb = p2(XL, y, zE)[0], g = ctx.createLinearGradient(xa, 0, xb, 0); for (let i = 0; i <= 8; i++) { const z = lerp(zb, zE, i / 8), off = cl01((p2(XL, y, z)[0] - xa) / ((xb - xa) || 1)); g.addColorStop(off, rgba(mix(mix(base, '#ffffff', 0), fogC, fz(z)).map(v => Math.min(255, v * boost)), 1)); } return g; };
  ctx.save(); clipPoly(wallPoly(zb, D.x0, 0, D.x1, D.y1));
  ctx.fillStyle = fogC; ctx.fillRect(-100, -100, W + 200, H + 200);
  // end wall, ceiling, floor
  onZ(zE, XL, XR, 0, CH, fogc('#dfe4ee', zE));
  quad3([XL, CH, zb], [XR, CH, zb], [XR, CH, zE], [XL, CH, zE], grad(0, p2(0, CH, zb)[1], 0, p2(0, CH, zE)[1], [[0, '#f2f2ee'], [1, fogc('#e6e4e0', zE)]]));
  quad3([XL, 0, zb], [XR, 0, zb], [XR, 0, zE], [XL, 0, zE], grad(0, p2(0, 0, zb)[1], 0, p2(0, 0, zE)[1], [[0, '#bcc3d2'], [1, fogc('#9aa3b8', zE)]]));
  // the left wall: wall above the rail, wainscot below, rail and baseboard
  wq(110, CH, zb, zE, wg(CH * .55, '#e4e9f2'));
  wq(0, 110, zb, zE, wg(55, '#3f7f88'));
  wq(104, 116, zb, zE, wg(110, '#b98a5a')); wq(0, 22, zb, zE, wg(11, '#7d6a5a'));
  ctx.strokeStyle = 'rgba(255,240,210,.35)'; ctx.lineWidth = 2; { const a = p2(XL + 16, 170, zb), b = p2(XL + 16, 170, zE); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }   /* the handrail */
  // doors and domes, far to near
  const ping = o.ping ?? -1, dingOn = ping >= 0 && ping < 1.3 ? ((ping < .3 || (ping > .5 && ping < .9)) ? 1 : 0) : 0;
  for (const d of HDOORS.slice().reverse()) {
    const z0 = d.z - 75, z1 = d.z + 75, isP = HDOORS.indexOf(d) === PING_DOOR;
    wq(0, 446, z0 - 12, z1 + 12, fogc('#efe6d0', d.z), 'rgba(25,18,30,.5)', 1.6);
    wq(0, 430, z0, z1, fogc(d.c, d.z), 'rgba(25,18,30,.55)', 1.8);
    wq(60, 200, z0 + 18, z1 - 18, fogc(shade(d.c, .88), d.z)); wq(250, 400, z0 + 18, z1 - 18, fogc(shade(d.c, .88), d.z));
    const on = isP ? dingOn : 0;
    wq(440, 516, d.z - 66, d.z + 66, on ? `rgba(255,255,255,${.7 + .3 * on})` : fogc('#d7dbe0', d.z), 'rgba(30,24,40,.6)', 1.6);
    if (isP && ping >= 0) {
      const [px, py] = p2(XL, 478, d.z), k = kzP(d.z);
      if (on) V2.glow(px, py, 420 * k, '255,230,200', .9, 'screen', 1.1);
      V2.ring(px, py, ((ping % .5) / .5) * (ping < 1.3 ? 1 : 0), { r0: 12 * k, r1: 330 * k, lw: 6, alpha: .8, color: '255,236,210' });
      if (o.pingLight) o.pingLight(px, py, on);
    }
  }
  // ceiling fixtures, with their glow, and the pools of light on the floor under them
  for (let z = 2500; z < zE; z += 950) {
    const k = kzP(z), cx = H.cx;
    poly([p2(cx - 66, CH - 2, z), p2(cx + 66, CH - 2, z), p2(cx + 66, CH - 2, z + 150), p2(cx - 66, CH - 2, z + 150)], 'rgba(255,252,238,.95)', 'rgba(110,110,125,.55)', 1.2);
    const [lx, ly] = p2(cx, CH - 2, z + 75); V2.glow(lx, ly, 300 * k, '255,248,226', .3, 'screen', .4);
    const [fx, fy] = p2(cx, 0, z + 75); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(fx, fy); ctx.scale(1, Math.max(.05, Math.min(.5, 360 / (z - V2.P.cz) * 1.3)));
    ctx.fillStyle = radial(0, 0, 0, 340 * k, [[0, 'rgba(255,246,222,.3)'], [1, 'rgba(255,246,222,0)']]); ctx.beginPath(); ctx.arc(0, 0, 340 * k, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  // the doorway's casing and the thickness of the wall: the left jamb's inner face, the header's underside
  const th = 60;
  quad3([D.x0, 0, zb], [D.x0, 0, zb + th], [D.x0, D.y1, zb + th], [D.x0, D.y1, zb], '#cdbf9f', INKC, 1.6);
  quad3([D.x0, D.y1, zb], [D.x1, D.y1, zb], [D.x1, D.y1, zb + th], [D.x0, D.y1, zb + th], '#b3a584', INKC, 1.6);
  onZ(zb, D.x0 - 36, D.x0, 0, D.y1 + 36, '#e8dfc9', INKC, 2.2); onZ(zb, D.x1, D.x1 + 36, 0, D.y1 + 36, '#e8dfc9', INKC, 2.2); onZ(zb, D.x0 - 36, D.x1 + 36, D.y1, D.y1 + 36, '#e8dfc9', INKC, 2.2);
  // the cool light of the hall spilling over the sill onto the station floor
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const f0 = p2(D.x0, 0, zb), f1 = p2(D.x1, 0, zb), f2 = p2(D.x1 + 330, 0, zb - 640), f3 = p2(D.x0 - 130, 0, zb - 640);
  ctx.fillStyle = grad(0, f0[1], 0, f2[1], [[0, 'rgba(190,215,255,.26)'], [1, 'rgba(190,215,255,0)']]); ctx.beginPath(); [f0, f1, f2, f3].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  ctx.restore();
  const c = p2((D.x0 + D.x1) / 2, D.y1 * .5, zb); V2.glow(c[0], c[1], 260 * kzP(zb), '190,215,255', .2, 'screen', .4);
}

// ------------------------------------------------------------------ the counter, with its monitors, phone, papers and a cup
function counter(o = {}) {
  const C = LAY.counter, t = o.t ?? 0, k = kzP(C.z0), wood = '#c9a26a';
  S7.groundShadow(C.x0 - 30, C.x1 + 30, C.z0 - 30, C.z1 + 30, .32, 0);
  // the body and its top; the raised visitors' ledge along the front
  box3({ x0: C.x0, x1: C.x1, y0: 0, y1: C.top, z0: C.z0, z1: C.z1, color: '#b88c58', front: '#b88c58', top: '#ecdcb4', side: '#8a6438', lw: 2.4 });
  box3({ x0: C.x0 - 10, x1: C.x1 + 10, y0: C.top, y1: C.top + 26, z0: C.z0 - 14, z1: C.z0 + 64, color: '#d6b27a', front: '#caa066', top: '#f6e8c4', side: '#9a7444', lw: 2 });
  // the front panels: three recessed panels, a kick plate and a brass plaque
  const fx0 = C.x0 + 30, fx1 = C.x1 - 30, pw = (fx1 - fx0 - 80) / 3;
  for (let i = 0; i < 3; i++) { const a = fx0 + i * (pw + 40); onZ(C.z0 - 1, a, a + pw, 34, C.top - 28, shade('#b88c58', .9), 'rgba(40,24,10,.5)', 2); onZ(C.z0 - 1, a + 8, a + pw - 8, C.top - 34, C.top - 30, 'rgba(255,240,210,.3)'); }
  onZ(C.z0 - 1, C.x0 + 6, C.x1 - 6, 0, 22, '#6a4a2c', 'rgba(25,16,30,.5)', 1.4);
  const pl = wallBox(C.z0 - 1, 20, 96, 270, 150);
  ctx.save(); rr(pl[0], pl[1], pl[2], pl[3], pl[3] * .2); ctx.fillStyle = grad(0, pl[1], 0, pl[1] + pl[3], [[0, '#e9cf7a'], [1, '#b8953a']]); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,10,.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  UI.container('plaque13', 'sign', [pl[0], pl[1], pl[0] + pl[2], pl[1] + pl[3]], pl[3] * .12);
  if (o.plaque !== false) UI.label("NURSES' STATION", pl[0] + pl[2] / 2, pl[1] + pl[3] / 2, { size: pl[3] * .46, weight: 900, fill: '#4a3410', spacing: pl[3] * .04, maxW: pl[2] * .88, hero: false, cid: 'plaque13', center: true });
  // on the working surface: two monitors seen from behind (their glow is on whoever sits between them), a phone, paper piles, a cup
  const y0 = C.top;
  for (const X of [90, 590]) {
    box3({ x0: X - 10, x1: X + 10, y0: y0, y1: y0 + 46, z0: 1456, z1: 1472, color: '#2a2d36', lw: 1.4 });
    box3({ x0: X - 44, x1: X + 44, y0: y0, y1: y0 + 10, z0: 1440, z1: 1486, color: '#2f323c', lw: 1.4 });
    box3({ x0: X - 70, x1: X + 70, y0: y0 + 46, y1: y0 + 160, z0: 1468, z1: 1490, color: '#1f222a', front: '#262a33', top: '#333845', side: '#14161c', lw: 2 });
    onZ(1467, X - 60, X + 60, y0 + 56, y0 + 150, '#1d2029');
    const g = p2(X + (X < 300 ? 70 : -70), y0 + 110, 1450); V2.glow(g[0], g[1], 260 * k, '120,170,255', .2, 'screen', .3);
  }
  // the phone: a cream box, a handset on its cradle and a lamp that blinks when it rings
  box3({ x0: 165, x1: 255, y0: y0, y1: y0 + 34, z0: 1456, z1: 1506, color: '#d8d1c0', front: '#e6dfce', top: '#f1ebdc', side: '#b8b09c', lw: 1.8 });
  box3({ x0: 158, x1: 262, y0: y0 + 34, y1: y0 + 50, z0: 1458, z1: 1490, color: '#cfc7b4', front: '#ddd5c2', top: '#ebe4d2', side: '#a9a18d', lw: 1.6 });
  const ring = o.phoneRing ?? 0, lamp = ring > 0 ? (Math.sin(t * 22) > 0 ? 1 : .15) * ring : 0, lp = p2(238, y0 + 34, 1460);
  ctx.fillStyle = lamp > .3 ? '#ff4a4a' : '#5a2020'; ell(lp[0], lp[1], 5 * k, 4 * k); ctx.fill();
  if (lamp > .3) V2.glow(lp[0], lp[1], 90 * k, '255,70,70', .8 * lamp, 'screen', .9);
  // paper piles at the left end and a loose sheet
  for (let i = 0; i < 6; i++) box3({ x0: -50 + (i % 2) * 6, x1: 58 + (i % 3) * 5, y0: y0 + i * 9, y1: y0 + i * 9 + 9, z0: 1470 + (i % 2) * 5, z1: 1530, color: ['#f4efe0', '#e9f0f7', '#f7ead8', '#eef4e6', '#ffe9a8', '#f4efe0'][i], lw: 1 });
  box3({ x0: 286, x1: 366, y0: y0, y1: y0 + 3, z0: 1420, z1: 1456, color: '#fffdf5', lw: 1 });
  // the cup, with its steam
  { const cx = 672, cz = 1470, [x, y] = p2(cx, y0 + 40, cz), kk = kzP(cz);
    ctx.save(); ctx.translate(x, y); ctx.scale(kk, kk);
    ctx.fillStyle = '#f6f3ee'; ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, -46); ctx.lineTo(26, -46); ctx.lineTo(21, 4); ctx.lineTo(-21, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(28, -22, 12, -PI / 2, PI / 2); ctx.stroke();
    ctx.fillStyle = '#5a3420'; ell(0, -44, 23, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const dx of [-8, 8]) { ctx.beginPath(); ctx.moveTo(dx, -56); ctx.bezierCurveTo(dx + 12 * Math.sin(t * 2 + dx), -76, dx - 12 * Math.sin(t * 2.4 + dx), -94, dx + 6, -116); ctx.stroke(); }
    ctx.restore(); }
}

// ------------------------------------------------------------------ the med cart and the chair: billboards standing on the floor at a world point
function medCart(X, Z, o = {}) {
  const [x, y, k] = V2.proj(X, 0, Z), t = o.t ?? 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = radial(0, 4, 0, 150, [[0, 'rgba(10,8,24,.42)'], [1, 'rgba(10,8,24,0)']]); ctx.save(); ctx.scale(1, .14); ctx.beginPath(); ctx.arc(0, 0, 150, 0, TAU); ctx.fill(); ctx.restore();
  ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(20,14,34,.85)'; ctx.lineWidth = 4;
  for (const dx of [-80, 80]) { ctx.fillStyle = '#23252c'; ell(dx, -16, 15, 15); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa3b2'; ell(dx, -16, 5, 5); ctx.fill(); }   /* casters */
  ctx.fillStyle = grad(-100, 0, 100, 0, [[0, '#2a5ea5'], [.55, '#2f6fb5'], [1, '#4b8ad0']]); rr(-100, -300, 200, 262, 12); ctx.fill(); ctx.stroke();   /* the body */
  for (let i = 0; i < 4; i++) {   /* four drawers, a pull on each */
    const yy = -290 + i * 62; ctx.fillStyle = grad(0, yy, 0, yy + 56, [[0, '#4f8ad6'], [1, '#3b72bd']]); rr(-92, yy, 184, 54, 7); ctx.fill(); ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = '#e4e9f0'; rr(-30, yy + 22, 60, 9, 4.5); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
  }
  ctx.fillStyle = '#1a1d24'; rr(-84, -282, 44, 40, 5); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();   /* the keypad of the narcotics lock: twelve tiny keys */
  ctx.fillStyle = '#8f9ab0'; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rr(-80 + c * 13, -278 + r * 9, 10, 6, 1.5); ctx.fill(); }
  ctx.fillStyle = '#e9eef5'; rr(-112, -322, 224, 24, 8); ctx.fill(); ctx.lineWidth = 3.4; ctx.stroke();   /* the top surface */
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(-104, -319, 208, 5, 2.5); ctx.fill();
  // on the top: a sharps box, a tray of pill cups, a gel pump, a laptop seen from behind
  ctx.fillStyle = '#d6203a'; rr(-100, -372, 50, 50, 6); ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#f4f4f4'; rr(-96, -382, 42, 12, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f7f7f9'; rr(-38, -338, 70, 16, 4); ctx.fill(); ctx.stroke(); for (let i = 0; i < 5; i++) { ctx.fillStyle = '#ffffff'; rr(-34 + i * 13, -350, 10, 12, 2); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke(); }
  ctx.fillStyle = '#6fd0e0'; rr(48, -362, 22, 40, 5); ctx.fill(); ctx.lineWidth = 2.6; ctx.stroke(); ctx.fillStyle = '#eef2f6'; rr(54, -376, 10, 14, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#383c48'; ctx.beginPath(); ctx.moveTo(76, -322); ctx.lineTo(104, -322); ctx.lineTo(100, -384); ctx.lineTo(80, -384); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2.6; ctx.stroke();
  // rim light from the window on the right edge, cool fill on the left
  ctx.globalCompositeOperation = 'screen'; ctx.save(); rr(-112, -322, 224, 24, 8); ctx.rect(-100, -300, 200, 262); ctx.clip();
  ctx.fillStyle = grad(40, 0, 112, 0, [[0, 'rgba(255,170,100,0)'], [1, `rgba(255,170,100,${o.rimA ?? .45})`]]); ctx.fillRect(40, -330, 72, 300);
  ctx.fillStyle = grad(-112, 0, -60, 0, [[0, 'rgba(150,180,255,.25)'], [1, 'rgba(150,180,255,0)']]); ctx.fillRect(-112, -330, 52, 300); ctx.restore();
  ctx.restore();
  return { x, y, k };
}
function chair(X, Z, o = {}) {
  /* a rolling office chair seen from the front, slightly from above: star base with casters, gas lift, a thick seat, two arms and a padded back. The window's rim light (o.rimA) is clipped to the shapes. */
  const [x, y, k] = V2.proj(X, 0, Z), c0 = o.color ?? '#7c8da6', c1 = shade(c0, .74), c2 = shade(c0, 1.16), INKS = 'rgba(20,14,34,.88)', DARK = '#343844';
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (!o.noShadow) { ctx.fillStyle = radial(0, 4, 0, 110, [[0, 'rgba(10,8,24,.4)'], [1, 'rgba(10,8,24,0)']]); ctx.save(); ctx.scale(1, .16); ctx.beginPath(); ctx.arc(0, 0, 110, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const rims = [];   /* silhouette paths that catch the rim light */
  const shape = (path, fill, lw = 3.6) => { const f = () => { ctx.beginPath(); path(); }; f(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INKS; ctx.lineWidth = lw; ctx.stroke(); rims.push(f); };
  // the star base: far arms, near arms, a hub, casters
  const arm = (ex, ey) => { ctx.strokeStyle = INKS; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = DARK; ctx.lineWidth = 11; ctx.stroke(); };
  const caster = (cx, cy, r) => { ctx.fillStyle = '#1d2027'; ctx.strokeStyle = INKS; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8f98a8'; ctx.beginPath(); ctx.arc(cx, cy, r * .38, 0, TAU); ctx.fill(); };
  for (const [ex, ey] of [[-94, -24], [94, -24]]) arm(ex, ey);
  for (const [ex, ey, r] of [[-94, -14, 10], [94, -14, 10]]) caster(ex, ey, r);
  for (const [ex, ey] of [[-58, -14], [58, -14]]) arm(ex, ey);
  for (const [ex, ey, r] of [[-58, -4, 11], [58, -4, 11]]) caster(ex, ey, r);
  ctx.fillStyle = DARK; ctx.strokeStyle = INKS; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.ellipse(0, -38, 20, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // the gas lift, a chrome post in a black boot
  ctx.fillStyle = grad(-9, 0, 9, 0, [[0, '#7b8493'], [.42, '#eef1f6'], [1, '#808a9a']]); rr(-8, -102, 16, 62, 4); ctx.fill(); ctx.strokeStyle = INKS; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = DARK; ctx.beginPath(); ctx.moveTo(-14, -46); ctx.lineTo(14, -46); ctx.lineTo(10, -78); ctx.lineTo(-10, -78); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the seat: a plate, the thick cushion (front face, then its top)
  shape(() => { ctx.roundRect(-52, -112, 104, 14, 6); }, DARK, 3);
  shape(() => { ctx.moveTo(-86, -122); ctx.quadraticCurveTo(-90, -96, -76, -94); ctx.quadraticCurveTo(0, -80, 76, -94); ctx.quadraticCurveTo(90, -96, 86, -122); ctx.quadraticCurveTo(0, -108, -86, -122); ctx.closePath(); }, grad(0, -122, 0, -84, [[0, c0], [1, c1]]));
  shape(() => { ctx.moveTo(-86, -122); ctx.quadraticCurveTo(-60, -150, 0, -152); ctx.quadraticCurveTo(60, -150, 86, -122); ctx.quadraticCurveTo(0, -108, -86, -122); ctx.closePath(); }, grad(0, -152, 0, -112, [[0, c2], [1, c0]]));
  // the back: a spine up from the seat, the frame and the pad
  ctx.strokeStyle = INKS; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(0, -140); ctx.lineTo(0, -178); ctx.stroke(); ctx.strokeStyle = DARK; ctx.lineWidth = 9; ctx.stroke();
  shape(() => { ctx.roundRect(-60, -276, 120, 132, 36); }, DARK, 3.8);
  shape(() => { ctx.roundRect(-51, -267, 102, 114, 29); }, grad(0, -267, 0, -153, [[0, c2], [.55, c0], [1, c1]]), 2.4);
  ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-36, -240); ctx.lineTo(-36, -190); ctx.stroke();
  ctx.strokeStyle = 'rgba(20,14,34,.35)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-50, -206); ctx.quadraticCurveTo(0, -196, 50, -206); ctx.stroke();   /* the lumbar seam */
  // the arms: a post and a pad on each side
  for (const sd of [-1, 1]) { ctx.strokeStyle = INKS; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(sd * 80, -124); ctx.lineTo(sd * 84, -178); ctx.stroke(); ctx.strokeStyle = DARK; ctx.lineWidth = 8; ctx.stroke(); shape(() => { ctx.roundRect(sd * 84 - 21, -190, 42, 15, 7); }, '#3b3f4c', 3); }
  // the rim light of the window, on the right-hand edges of the shapes only
  if ((o.rimA ?? .4) > 0) {
    ctx.globalCompositeOperation = 'screen';
    for (const f of rims) { ctx.save(); f(); ctx.clip(); ctx.fillStyle = grad(14, 0, 96, 0, [[0, 'rgba(255,170,100,0)'], [1, `rgba(255,170,100,${o.rimA ?? .4})`]]); ctx.fillRect(-100, -290, 200, 290); ctx.restore(); }
  }
  ctx.restore();
  return { x, y, k };
}

// ------------------------------------------------------------------ the light map: the set is drawn evenly lit, then multiplied by a map of where the light is (a dark ambient plus coloured pools), so a room
// gets a mood: warm near the window, cool under the lamps and the hall. The map is kept small (1/8 scale) and drawn smooth. Lights are in scene coordinates: { x, y, r, color 'r,g,b', a, sy (squash) }.
const LM = { sc: 8, x0: -300, y0: -300, w: 1680, h: 2520 };
const LMC = V2.mk(LM.w / LM.sc, LM.h / LM.sc), LMX = LMC.getContext('2d');
function lightMap(o = {}) {
  const g = LMX;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.fillStyle = o.ambient || 'rgb(112,100,138)'; g.fillRect(0, 0, LMC.width, LMC.height);
  g.globalCompositeOperation = 'lighter';
  for (const l of o.lights || []) {
    if (!(l.a > 0)) continue;
    const x = (l.x - LM.x0) / LM.sc, y = (l.y - LM.y0) / LM.sc, r = l.r / LM.sc;
    g.save(); g.translate(x, y); g.scale(1, l.sy ?? 1);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, rgba(l.color, l.a)); gr.addColorStop(.5, rgba(l.color, l.a * .5)); gr.addColorStop(1, rgba(l.color, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.restore();
  }
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(LMC, LM.x0, LM.y0, LM.w, LM.h); ctx.restore();
}

// the window thrown on the floor: a soft lit parallelogram q = [near-left, near-right, far-right, far-left] (screen points) cut into the bright bands the slats of the blinds let through
function sunPatch(q, a, rgb, stripes = 6) {
  const m = (p, r, u) => [lerp(p[0], r[0], u), lerp(p[1], r[1], u)], cx = q.reduce((s0, p) => s0 + p[0], 0) / 4, cy = q.reduce((s0, p) => s0 + p[1], 0) / 4;
  const grow = (f) => q.map(p => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f]);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  // a faint overall wash (the room's bounce), then the bands
  const Q = grow(1.12);
  ctx.fillStyle = grad(0, Q[0][1], 0, Q[3][1], [[0, `rgba(${rgb},${a * .16})`], [1, `rgba(${rgb},${a * .3})`]]);
  ctx.beginPath(); Q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  for (let i = -1; i < stripes; i++) {
    const u0 = Math.max(0, (i + .9) / stripes), u1 = Math.min(1, (i + 1.62) / stripes);
    if (u1 <= u0) continue;
    const a0 = m(q[0], q[3], u0), b0 = m(q[1], q[2], u0), a1 = m(q[0], q[3], u1), b1 = m(q[1], q[2], u1);
    ctx.fillStyle = grad(0, a0[1], 0, q[3][1], [[0, `rgba(${rgb},${a * .7})`], [1, `rgba(${rgb},${a * 1.05})`]]);
    ctx.beginPath(); ctx.moveTo(...a0); ctx.lineTo(...b0); ctx.lineTo(...b1); ctx.lineTo(...a1); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// the shafts of the low sun in the air: each gap of the blinds throws a thin band from the glass to its bright stripe on the floor. Draw it AFTER the cast (light lies over them too).
// All shafts run along one direction, (-1, -1, -2.1) per unit of height: the same geometry as the patch on the floor.
function shafts(o = {}) {
  const L = LAY, zb = L.zb, n = 6, a = o.a ?? .1, sunX = o.sunX ?? 0, rgb = o.rgb || '255,196,128', cz0 = V2.P.cz, Y0 = L.win.y0, Y1 = L.win.y1 * .9, dY = (Y1 - Y0) / n;
  const F = (X, Y) => p2(X - Y + sunX, 0, Math.max(zb - Y * 2.1, cz0 + 220)), G = (X, Y) => p2(X, Y, zb);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const Ya = Y1 - (i + .1) * dY, Yb = Y1 - (i + .62) * dY, X0 = L.win.x0 + 20, X1 = L.win.x1 - 20;
    const pts = [G(X0, Ya), G(X1, Ya), F(X1, Ya), F(X0, Ya)], pts2 = [G(X0, Yb), G(X1, Yb), F(X1, Yb), F(X0, Yb)];
    const g0 = G((X0 + X1) / 2, (Ya + Yb) / 2), g1 = F((X0 + X1) / 2, (Ya + Yb) / 2);
    ctx.fillStyle = grad(g0[0], g0[1], g1[0], g1[1], [[0, `rgba(${rgb},${a})`], [.65, `rgba(${rgb},${a * .55})`], [1, `rgba(${rgb},${a * .25})`]]);
    // the band is the quad between the upper and the lower edge of the slat gap, along the beam: draw the two long sides and fill between
    ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[3]); ctx.lineTo(...pts2[3]); ctx.lineTo(...pts2[0]); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.lineTo(...pts2[2]); ctx.lineTo(...pts2[1]); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.lineTo(...pts[3]); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the station: everything behind the cast
function station(lt, o = {}) {
  const t = o.t ?? lt, sunk = cl01(o.sky ?? 0), zb = LAY.zb, P1 = PAL.eve, P2 = PAL.dusk, M = k => mixh(P1[k], P2[k], sunk), L = LAY, scr = (typeof CAM !== 'undefined' && CAM.z) || 1;
  S6.shell({ zb, hw: L.hw, ch: L.ch, rail: L.rail, wall: M('wall'), wain: M('wain'), floorA: M('floorA'), floorB: M('floorB'), ceil: M('ceil'), fog: M('fog'), fogAmt: lerp(P1.fogAmt, P2.fogAmt, sunk), tile: 130 });
  const on = o.lampsOn ?? 1;
  const cz0 = V2.P.cz;
  for (const z of [900, 1500]) if (z + 90 > cz0 + 160) for (const X of [-330, 330]) ceilingLamp(X, z, L.ch, on, '255,244,226', 110, 180);
  // the light of the room: darker in the corners and under the ceiling, warmer toward the window (a multiply pass over the shell, a warm glow after the boards)
  const wc0 = p2((L.win.x0 + L.win.x1) / 2, (L.win.y0 + L.win.y1) / 2, zb);
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = radial(wc0[0] - 180, 880, 80, 1300, [[0, 'rgba(255,255,255,1)'], [.5, `rgba(${236 - 18 * sunk | 0},${222 - 24 * sunk | 0},${214 - 10 * sunk | 0},1)`], [1, `rgba(${108 - 20 * sunk | 0},${94 - 18 * sunk | 0},${132 - 6 * sunk | 0},1)`]]);
  ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
  hallBeyond(t, { ping: o.ping });
  windowDusk(t, { sky: sunk });
  /* o.bare: a plain wall for a shot where a projected slide or a sign lies over it: no whiteboard writing, no scoreboard, no Q sign, no call-light board (no text under the slide) */
  whiteboard(o.bare ? 'blank' : (o.board || 'schedule'));
  const sb = wallBox(zb, L.score.x0, L.score.y0, L.score.x1, L.score.y1);
  if (!o.bare) scoreboard(sb[0] + sb[2] / 2, sb[1] + sb[3] / 2, sb[2], sb[3], o.breaks ?? 0, { roll: o.breaksRoll });
  const qf = o.bare ? wallPoly(zb, L.qsign.x0, L.qsign.y0, L.qsign.x1, L.qsign.y1) : qSign(o.hours ?? 41, { flash: o.qFlash ?? 0, flicker: o.qFlicker ?? 1 });
  wallClock(L.clock.X, L.clock.Y, zb - 6, 0, o.min ?? 2, o.hr ?? 7, L.clock.r);
  const cb = wallBox(zb, L.call.x0, L.call.y0, L.call.x1, L.call.y1), pg = o.ping ?? -1, dingOn = pg >= 0 && pg < 1.3 && (pg < .3 || (pg > .5 && pg < .9));
  const lit_ = o.calls || ((i) => (i === 11 && dingOn ? [CALLCOL.amber, 1] : null));
  if (!o.bare) callBoard(cb[0], cb[1], cb[2], cb[3], lit_, { t, hero: false });
  // the low sun: a warm wash on the wall, the window thrown across the floor in front of the counter, a soft shaft and dust motes in it
  const sun = (o.sun ?? 1) * (1 - .55 * sunk), wc = wc0;
  V2.glow(wc[0], wc[1] + 60, 700 * kzP(zb), sunk > .5 ? '255,130,90' : '255,170,100', .12 * (1 - .3 * sunk), 'screen', .3);
  V2.addLight({ x: wc[0], y: wc[1], r: 1100, color: sunk > .5 ? '255,130,90' : '255,170,100', a: .62 * (1 - .4 * sunk) });
  if (sun > .01) {
    const fl = (X, Y) => p2(X - Y * 1.0 + (o.sunX ?? 0), 0, Math.max(zb - Y * 2.1, cz0 + 220));   /* where the point (X, Y) of the glass lands on the floor: left and toward the camera, longer for higher points (o.sunX slides the patch sideways) */
    sunPatch([fl(L.win.x0, L.win.y1 * .9), fl(L.win.x1, L.win.y1 * .9), fl(L.win.x1, L.win.y0), fl(L.win.x0, L.win.y0)], .34 * sun, sunk > .5 ? '255,140,100' : '255,190,112', 6);
    V2.beam(wc[0], wc[1], wc[0] - 330, wc[1] + 820, 300, 760, '255,196,130', .1 * sun, 'screen');
    V2.dust(wc[0] - 560, wc[1] - 80, wc[0] + 100, wc[1] + 800, t, { n: 52, alpha: .55 * sun, size: 3.4, speed: 9, color: '255,226,176', seed: 4 });
  }
  const lamps = [[-330, 1500], [330, 1500], [-330, 900], [330, 900]].filter(([, Z]) => Z + 90 > cz0 + 160).map(([X, Z]) => { const q = p2(X, L.ch * .7, Z + 90), kk = kzP(Z); return { x: q[0], y: q[1] + 220 * kk, r: 620 * kk, color: '230,236,255', a: .5 * on, sy: .8 }; });
  const dw = p2((L.doorway.x0 + L.doorway.x1) / 2, L.doorway.y1 * .5, zb), lights = [
    { x: wc[0] - 60, y: wc[1] + 40, r: 1250 * kzP(zb) / .737, color: sunk > .5 ? '255,140,100' : '255,196,140', a: 1.0 - .35 * sunk },
    { x: dw[0] + 40, y: dw[1] + 160, r: 700 * kzP(zb) / .737, color: '170,205,255', a: .75 },
    { x: wc[0] - 520, y: p2(0, 0, 1500)[1], r: 900 * kzP(zb) / .737, color: '255,214,170', a: .38 * (1 - .5 * sunk), sy: .5 },
    { x: 540, y: p2(0, 0, 1050)[1] + 260, r: 1150 * kzP(zb) / .737, color: '255,208,160', a: .34 * (1 - .4 * sunk), sy: .55 },
    ...lamps];
  return { k: kzP(zb), lights, box: { board: wallBox(zb, L.board.x0, L.board.y0, L.board.x1, L.board.y1), score: sb, call: cb, qsign: [qf[3][0], qf[3][1], qf[1][0] - qf[3][0], qf[0][1] - qf[3][1]], win: wallBox(zb, L.win.x0, L.win.y0, L.win.x1, L.win.y1), door: wallBox(zb, L.doorway.x0, 0, L.doorway.x1, L.doorway.y1) } };
}
// the screen rectangle of the projection wall (the schedule whiteboard) under the current camera: [x, y, w, h]
const slideRect = () => wallBox(LAY.zb, LAY.board.x0, LAY.board.y0, LAY.board.x1, LAY.board.y1);

// ------------------------------------------------------------------ the card reader: a plate on the wall, local units (the plate is 170 wide and 260 tall), centre (x, y), scale k
// state 'idle' (SWIPE BADGE), 'read' (a spinner), 'ok' (BADGE: PER DIEM / STATUS: NOT STAFF / ACCESS GRANTED, typed in by o.k 0..1)
function reader(x, y, k, o = {}) {
  const st = o.state || 'idle', t = o.t ?? 0, id = o.id || 'reader13', scr = (typeof CAM !== 'undefined' && CAM.z) || 1, kk = k * scr, okk = cl01(o.k ?? 0);
  const hero = o.hero ?? (11 * kk >= 31);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  ctx.fillStyle = grad(-85, -130, 85, 130, [[0, '#5b616d'], [.5, '#3d424d'], [1, '#2c3039']]); rr(-85, -130, 170, 260, 18); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 4; rr(-85, -130, 170, 260, 18); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; rr(-80, -125, 160, 250, 15); ctx.stroke();
  for (const [sx, sy] of [[-68, -114], [68, -114], [-68, 114], [68, 114]]) { ctx.fillStyle = '#8a909c'; ell(sx, sy, 5, 5); ctx.fill(); ctx.strokeStyle = 'rgba(15,12,24,.8)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(sx - 3, sy - 1); ctx.lineTo(sx + 3, sy + 1); ctx.stroke(); }
  // the status lamp: red idle, amber while it reads, green when it says yes
  const lamp = st === 'ok' ? [90, 255, 140] : st === 'read' ? [255, 190, 60] : [255, 60, 60], blink = st === 'idle' ? (Math.sin(t * 4) > 0 ? 1 : .35) : 1;
  ctx.fillStyle = `rgb(${lamp})`; ctx.globalAlpha *= blink; rr(-30, -122, 60, 9, 4.5); ctx.fill(); ctx.globalAlpha /= blink;
  V2.glow(0, -118, 90, lamp.join(','), .45 * blink, 'screen', .8);
  // the screen
  const scrn = UI.panel([-68, -102, 136, 128], { fill: '#05120c', stroke: '#26352f', lw: 4, r: 8, id, kind: 'sign', pad: 8 });
  const G = '#3dff7a';
  if (st === 'idle') UI.label('SWIPE BADGE', 0, -38, { size: 15, weight: 900, fill: 'rgba(120,200,150,.7)', spacing: 1, maxW: 110, hero, cid: id, center: true });
  else if (st === 'read') {
    UI.label('READING', 0, -26, { size: 15, weight: 900, fill: '#ffd36a', spacing: 1, maxW: 110, hero, cid: id });
    ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -64, 14, t * 9, t * 9 + 4.2); ctx.stroke();
  } else {
    const L = [['BADGE: PER DIEM', '#b9ffd2', 12.5, 0, .3], ['STATUS: NOT STAFF', '#b9ffd2', 12.5, .3, .62], ['ACCESS GRANTED', G, 16, .62, 1]];
    const k2 = Math.min(1, 108 / UI.sizeOf('STATUS: NOT STAFF', { size: 12.5, weight: 900 }).w);
    const sc = L.map(([s0, c, sz]) => sz * k2), tot = [0, 1, 2].map(i => i), base0 = -64 - (sc[0] + sc[1] + sc[2]) * .55;
    L.forEach(([s, c, sz, a, b], i) => {
      const cy = -64 + (i - 1) * 30 + (i === 2 ? 6 : 0);
      UI.label(s, 0, cy, { size: sz * k2, weight: 900, fill: c, spacing: .6, reveal: seg(okk, a, b), hero, cid: id, center: false, shadow: i === 2 ? 6 : 0 });
    });
    if (okk > .62) V2.glow(0, -34, 80, '60,255,120', .32 * seg(okk, .62, .8), 'screen', .8);
  }
  // the card slot with its arrow, and the speaker grille
  ctx.fillStyle = '#0d0f14'; rr(-60, 46, 120, 20, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(150,170,210,.55)'; ctx.beginPath(); ctx.moveTo(-14, 56); ctx.lineTo(8, 56); ctx.lineTo(8, 50); ctx.lineTo(24, 56); ctx.lineTo(8, 62); ctx.lineTo(8, 56); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1c1f27'; for (let r2 = 0; r2 < 4; r2++) for (let c = 0; c < 8; c++) { ell(-42 + c * 12, 84 + r2 * 9, 2.6, 2.6); ctx.fill(); }
  ctx.restore();
  return { id, x, y, k };
}

// ------------------------------------------------------------------ the break room door, in elevation: x centre, y floor line, k px per world unit. Local units: the leaf is 370 wide and 504 tall, the frame 28 wider.
// o.locks { reader, tape, wet, bolt1, bolt2, padlock, chain }: each 0 (locked) .. 1 (released); o.ajar 0..1 (the swing, to about 80 degrees; the leaf is hinged on the left, so the dark seam opens at the right);
// o.t (time: dust, blink), o.shake { x, y } (a clunk), o.dust 0..1, o.noReader, o.noWet, o.plaque (default true), o.hero (the sign: default on when it is at least 31 px), o.rd (reader state { state, k })
const DOOR = { w: 370, h: 504, ft: 28 };
const SIGN = { box: [-155, -474, 310, 232], lines: [{ t: 'POLICY 14.3', size: 64, font: 'Bangers', weight: 400, fill: '#c2182b', spacing: 3 }, { t: 'STAFF MAY NOT ENTER', size: 32 }, { t: 'DURING A SHIFT', size: 32 }, { t: 'THIS MEANS YOU', size: 40, fill: '#c2182b' }] };
function breakDoor(x, y, k, o = {}) {
  const t = o.t ?? 0, Lk = Object.assign({ reader: 0, tape: 0, wet: 0, bolt1: 0, bolt2: 0, padlock: 0, chain: 0 }, o.locks), scr = (typeof CAM !== 'undefined' && CAM.z) || 1;
  const DW = DOOR.w, DH = DOOR.h, ft = DOOR.ft, hx = -DW / 2, ajar = cl01(o.ajar ?? 0), ang = ajar * 1.4, cs = Math.cos(ang), sh = o.shake || { x: 0, y: 0 };
  const kw = Math.min(1, 280 / UI.sizeOf('STAFF MAY NOT ENTER', { size: 32, weight: 900 }).w), heroSign = o.hero ?? (32 * kw * k * scr >= 31);
  ctx.save(); ctx.translate(x + sh.x * k, y + sh.y * k); ctx.scale(k, k);
  // the wall's shadow around the frame, and the floor shadow
  ctx.fillStyle = radial(0, 0, 0, 340, [[0, 'rgba(8,6,20,.4)'], [1, 'rgba(8,6,20,0)']]); ctx.save(); ctx.scale(1, .1); ctx.beginPath(); ctx.arc(0, 0, 340, 0, TAU); ctx.fill(); ctx.restore();
  // the dark inside, behind the leaf
  ctx.fillStyle = '#050509'; ctx.fillRect(-DW / 2, -DH, DW, DH);
  if (ajar > .01) { ctx.fillStyle = grad(DW / 2 - 40, 0, DW / 2, 0, [[0, 'rgba(120,130,160,0)'], [1, 'rgba(120,130,160,.16)']]); ctx.fillRect(DW / 2 - 40, -DH, 40, DH); }
  // the leaf: a flat steel slab in its own coordinates (u across from the hinge, v up), squeezed by the swing; the far edge is a little shorter
  const xr = hx + DW * cs, tp = (1 - cs) * 22;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(xr, -tp * .5); ctx.lineTo(xr, -DH + tp); ctx.lineTo(hx, -DH); ctx.closePath(); ctx.clip();
  ctx.translate(hx, 0); ctx.scale(cs, 1);
  ctx.fillStyle = grad(0, -DH, 0, 0, [[0, '#a3abb7'], [.45, '#868e9b'], [1, '#69717e']]); ctx.fillRect(0, -DH, DW, DH);
  ctx.fillStyle = grad(0, 0, DW, 0, [[0, 'rgba(255,255,255,.1)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(10,10,30,.22)']]); ctx.fillRect(0, -DH, DW, DH);
  // pressed panels, the kick plate, rivets, grime
  ctx.lineJoin = 'round';
  for (const [v0, v1] of [[-236, -62], [-DH + 14, -246]]) { ctx.strokeStyle = 'rgba(20,24,34,.45)'; ctx.lineWidth = 3; rr(16, v1, DW - 32, v0 - v1, 8); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; rr(19, v1 + 3, DW - 38, v0 - v1 - 6, 6); ctx.stroke(); }
  ctx.fillStyle = grad(0, -58, 0, 0, [[0, '#9aa2ae'], [1, '#7a8290']]); ctx.fillRect(0, -58, DW, 58);
  ctx.strokeStyle = 'rgba(30,34,46,.28)'; ctx.lineWidth = 3; for (let i = -6; i < 18; i++) { ctx.beginPath(); ctx.moveTo(i * 24, 0); ctx.lineTo(i * 24 + 58, -58); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(20,24,34,.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(DW, -58); ctx.stroke();
  ctx.fillStyle = 'rgba(30,34,46,.5)'; for (let i = 0; i < 12; i++) { ell(26 + i * 28, -DH + 30, 3.2, 3.2); ctx.fill(); }
  for (let i = 0; i < 16; i++) { const gx = hash(i * 3.1) * DW, gy = -hash(i * 5.7 + 2) * DH, gl = 18 + hash(i + 9) * 60; ctx.strokeStyle = `rgba(20,24,34,${.06 + .08 * hash(i + 4)})`; ctx.lineWidth = 2 + hash(i + 6) * 5; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (hash(i + 1) - .5) * 14, gy + gl); ctx.stroke(); }
  ctx.fillStyle = 'rgba(210,205,190,.2)'; ctx.fillRect(0, -DH, DW, 14);   /* dust on the top edge */
  // the lever handle on the latch side
  ctx.fillStyle = '#c3c8d0'; ell(DW - 40, -252, 17, 17); ctx.fill(); ctx.strokeStyle = 'rgba(15,12,24,.8)'; ctx.lineWidth = 3; ctx.stroke(); rr(DW - 84, -259, 66, 14, 7); ctx.fill(); ctx.stroke();
  // the sign (it turns with the leaf)
  if (o.sign !== false) { const sb = SIGN.box; UI.sign([DW / 2 + sb[0], sb[1], sb[2], sb[3]], SIGN.lines, { fill: '#f4efe2', stroke: '#7a1420', lw: 5, r: 12, pad: 14, ink: '#1d1a22', size: 32, weight: 900, hero: heroSign, id: 'doorsign13', shadow: 8 }); }
  ctx.restore();
  // the frame, over the leaf's edges
  ctx.beginPath(); ctx.rect(-DW / 2 - ft, -DH - ft, DW + 2 * ft, DH + ft); ctx.rect(-DW / 2, -DH, DW, DH);
  ctx.fillStyle = grad(-DW / 2 - ft, 0, DW / 2 + ft, 0, [[0, '#5f6674'], [.5, '#4a505d'], [1, '#383d49']]); ctx.fill('evenodd');
  ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 3; ctx.strokeRect(-DW / 2 - ft, -DH - ft, DW + 2 * ft, DH + ft); ctx.strokeRect(-DW / 2, -DH, DW, DH);
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(-DW / 2 - ft + 3, -DH - ft + 3, DW + 2 * ft - 6, 5);
  ctx.fillStyle = 'rgba(20,24,34,.5)'; for (const [rx, ry] of [[-DW / 2 - ft / 2, -DH - ft / 2], [DW / 2 + ft / 2, -DH - ft / 2], [-DW / 2 - ft / 2, -DH / 2], [DW / 2 + ft / 2, -DH / 2], [-DW / 2 - ft / 2, -80], [DW / 2 + ft / 2, -80], [0, -DH - ft / 2]]) { ell(rx, ry, 3.4, 3.4); ctx.fill(); }
  // a cobweb in the top left corner, and the gap under the door
  ctx.strokeStyle = 'rgba(235,235,245,.5)'; ctx.lineWidth = 1.6; { const cx0 = -DW / 2 - ft + 2, cy0 = -DH - ft + 2; for (let i = 0; i < 5; i++) { const a = i * .38 + .1; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + Math.cos(a) * 92, cy0 + Math.sin(a) * 92); ctx.stroke(); } for (let r2 = 1; r2 <= 4; r2++) { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i * .38 + .1, rr2 = r2 * 20 - (i % 2) * 4; ctx.lineTo(cx0 + Math.cos(a) * rr2, cy0 + Math.sin(a) * rr2); } ctx.stroke(); } }
  ctx.fillStyle = '#040407'; ctx.fillRect(-DW / 2, -5, DW, 5);
  // the dust that the draught lifts out of the seam and from under the door
  if ((o.dust ?? 0) > 0) for (let i = 0; i < 34; i++) { const ph = ((t * (.18 + .3 * hash(i)) + hash(i + 9)) % 1), a = o.dust * Math.sin(ph * PI) * (.35 + .6 * hash(i + 4)), seam = ajar > .01 && hash(i * 2.3) > .3, px = seam ? DW / 2 + 2 + ph * (60 + 170 * hash(i + 5)) : -DW / 2 + hash(i + 7) * DW + ph * 40, py = seam ? -DH * (.08 + .84 * hash(i + 2)) + ph * 46 * (hash(i + 3) - .3) : -4 - ph * 34 * hash(i + 6); ctx.fillStyle = `rgba(226,230,244,${a})`; ell(px, py, 1.6 + 2 * hash(i + 8), 1.6 + 2 * hash(i + 8)); ctx.fill(); }
  // the six locks. 1 the two slide bolts: the bar runs from the leaf into a keeper on the frame
  for (const [yb, v] of [[-488, Lk.bolt1], [-104, Lk.bolt2]]) {
    const e = easeOut(cl01(v)), xrgt = lerp(DW / 2 + 38, DW / 2 - 118, e), shk = pulse(t, o.boltT?.[yb < -300 ? 0 : 1] ?? 99, 40, .06) * 2;
    ctx.save(); ctx.translate(0, shk);
    ctx.fillStyle = '#8f96a3'; rr(DW / 2 - 190, yb - 20, 170, 40, 7); ctx.fill(); ctx.strokeStyle = 'rgba(15,12,24,.85)'; ctx.lineWidth = 3; ctx.stroke();   /* base plate */
    ctx.fillStyle = '#7a808d'; rr(DW / 2 + 12, yb - 16, 54, 32, 6); ctx.fill(); ctx.stroke();   /* the keeper on the frame */
    ctx.fillStyle = grad(0, yb - 9, 0, yb + 9, [[0, '#e3e7ee'], [.5, '#b3bac6'], [1, '#808793']]); rr(xrgt - 150, yb - 9, 150, 18, 6); ctx.fill(); ctx.stroke();   /* the bolt */
    ctx.fillStyle = '#d4b24a'; ell(xrgt - 118, yb - 14, 10, 14); ctx.fill(); ctx.stroke();   /* its brass knob */
    ctx.fillStyle = '#5a6070'; for (const sx of [DW / 2 - 176, DW / 2 - 34]) { ell(sx, yb - 12, 3.4, 3.4); ctx.fill(); }
    ctx.restore();
  }
  // 2 the yellow tape: two strips in an X across the lower door. Released, the right ends fall and hang from the left.
  { const f = easeIn(cl01(Lk.tape));
    for (const [y0, y1, sg] of [[-198, -122, 1], [-120, -192, -1]]) {
      const ax = -DW / 2 - ft + 4, ay = y0, bx0 = DW / 2 + ft - 4, by0 = y1, bx = lerp(bx0, ax + 36 + (sg < 0 ? 30 : 0), f), by = lerp(by0, -10 - (sg < 0 ? 8 : 0), f), sag = lerp(10, 46, f), N = 40;
      const pts = []; for (let i = 0; i <= N; i++) { const u = i / N; pts.push([lerp(ax, bx, u), lerp(ay, by, u) + Math.sin(u * PI) * sag + Math.sin(u * 9 + t * 3 + sg) * f * 5 * u]); }
      ctx.save(); ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py - 13) : ctx.moveTo(px, py - 13)); for (let i = N; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 13); ctx.closePath();
      ctx.fillStyle = '#ffd21f'; ctx.fill(); ctx.save(); ctx.clip();
      ctx.fillStyle = '#17141a'; for (let i = -2; i < N; i += 2) { const p0 = pts[Math.max(0, i)], p1 = pts[Math.max(0, Math.min(N, i + 1))]; ctx.beginPath(); ctx.moveTo(p0[0] - 8, p0[1] + 16); ctx.lineTo(p1[0] + 4, p1[1] - 16); ctx.lineTo(p1[0] + 16, p1[1] - 16); ctx.lineTo(p0[0] + 4, p0[1] + 16); ctx.closePath(); ctx.fill(); }
      ctx.restore(); ctx.strokeStyle = 'rgba(15,12,24,.85)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.restore();
    } }
  // 3 the chain across the door with the padlock on it. The padlock opens, then the chain falls.
  { const f = cl01(Lk.chain), hx0 = -DW / 2 - ft + 2, hy0 = -224, rx0 = DW / 2 + ft - 2, ry0 = -224, fall = easeIn(f), sw = Math.sin(f * 9) * (1 - f) * 40 * f;
    const ex = lerp(rx0, hx0 + 20 + sw * .5, fall), ey = lerp(ry0, -16, fall), sag = lerp(26, 18, fall), N = 17, links = [];
    for (let i = 0; i <= N; i++) { const u = i / N; links.push([lerp(hx0, ex, u) + Math.sin(u * PI) * (fall > .5 ? 30 * (1 - fall) * 2 : 0), lerp(hy0, ey, u) + Math.sin(u * PI) * sag * (1 - fall * .8)]); }
    ctx.strokeStyle = '#4b505c'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let i = 0; i < N; i++) { const [a0, b0] = links[i], [a1, b1] = links[i + 1], an = Math.atan2(b1 - b0, a1 - a0); ctx.save(); ctx.translate((a0 + a1) / 2, (b0 + b1) / 2); ctx.rotate(an); ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, 0, 14, i % 2 ? 4.5 : 8, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = i % 2 ? '#9aa1ae' : '#c5cad4'; ctx.lineWidth = 5.4; ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#6a707d'; rr(hx0 - 4, hy0 - 16, 30, 32, 6); ctx.fill(); ctx.strokeStyle = 'rgba(15,12,24,.85)'; ctx.lineWidth = 3; ctx.stroke();   /* the hasps */
    if (f < .01) { ctx.fillStyle = '#6a707d'; rr(rx0 - 26, ry0 - 16, 30, 32, 6); ctx.fill(); ctx.stroke(); }
    // the padlock: it hangs on the free end of the chain; the shackle swings open first
    const pk = easeOut(cl01(Lk.padlock)), px = ex - 6 * (1 - fall) - (1 - fall) * 0, py = ey + 18;
    const hang = f < .01 ? 0 : Math.sin(f * 11) * (1 - f) * .5;
    ctx.save(); ctx.translate(f < .01 ? 0 : px, f < .01 ? 0 : py + 8); if (f >= .01) ctx.rotate(hang);
    const lx = f < .01 ? DW / 2 - 6 : 0, ly = f < .01 ? -194 : 0;
    ctx.translate(lx, ly);
    ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.save(); ctx.translate(-12, -4); ctx.rotate(-pk * .9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22); ctx.arc(12, -22, 12, PI, 0); ctx.lineTo(24, pk * 8); ctx.stroke(); ctx.restore();
    ctx.fillStyle = grad(-24, -10, 24, 40, [[0, '#f1d56a'], [1, '#a8842a']]); rr(-24, -6, 48, 44, 8); ctx.fill(); ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.fillStyle = '#1b1710'; ell(0, 14, 5, 5); ctx.fill(); rr(-2, 14, 4, 12, 2); ctx.fill();
    ctx.restore(); }
  // 4 the wet floor sign in front of the door: it hops out of the way when it is released
  if (!o.noWet) { const f = cl01(Lk.wet), e = easeIO(f), hop = Math.abs(Math.sin(f * PI * 2)) * 38 * Math.sin(f * PI) , wx = lerp(-122, -372, e);
    ctx.save(); ctx.translate(wx, 10 - hop); ctx.rotate(Math.sin(f * PI * 2) * .12 * (f > 0 && f < 1 ? 1 : 0)); ctx.scale(1 + .05 * (hop > 2 ? -1 : 1) * (f > 0 && f < 1 ? 1 : 0), 1 + .06 * (hop > 2 ? 1 : -1) * (f > 0 && f < 1 ? 1 : 0));
    ctx.fillStyle = 'rgba(8,6,20,.35)'; ctx.save(); ctx.scale(1, .16); ctx.beginPath(); ctx.arc(0, 60 * 0, 70, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffd21f'; ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-42, 0); ctx.lineTo(-28, -148); ctx.quadraticCurveTo(0, -158, 28, -148); ctx.lineTo(42, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#17141a'; ell(-5, -112, 9, 9); ctx.fill(); ctx.strokeStyle = '#17141a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-3, -100); ctx.lineTo(8, -76); ctx.lineTo(-10, -56); ctx.moveTo(8, -76); ctx.lineTo(24, -66); ctx.moveTo(-3, -98); ctx.lineTo(-22, -84); ctx.stroke();   /* the falling person */
    ctx.restore(); }
  // the plaque over the door
  if (o.plaque !== false) { const pw = 250, ph = 56, py = -DH - ft - 20 - ph / 2, hp = o.heroPlaque ?? (30 * k * scr >= 31);
    UI.panel([-pw / 2, py - ph / 2, pw, ph], { fill: ['#2f6f78', '#24565e'], stroke: '#d8e4e6', lw: 3, r: 8, id: 'plaque13b', kind: 'sign', pad: 8, shadow: 8 });
    UI.label('BREAK ROOM', 0, py, { size: 34, weight: 900, fill: '#f4fbfb', spacing: 2, maxW: pw - 28, hero: hp, cid: 'plaque13b', center: true }); }
  ctx.restore();
  // the card reader on the wall, right of the frame
  if (!o.noReader) reader(x + 320 * k, y - 270 * k, k, Object.assign({ t, state: o.rd?.state ?? (Lk.reader > 0 ? 'ok' : 'idle'), k: o.rd?.k ?? Lk.reader }, o.rd));
  return { x, y, k, top: y - (DH + ft) * k, door: [x - DW / 2 * k, y - DH * k, DW * k, DH * k], reader: [x + 320 * k, y - 270 * k] };
}

// ------------------------------------------------------------------ the foyer: the dead end in front of the break room door (a vestibule a little wider than the hall), lit cold
const FOY = { zb: 1500, hw: 560, ch: 700 };
function foyer(o = {}) {
  const t = o.t ?? 0, zb = FOY.zb;
  S6.shell({ zb, hw: FOY.hw, ch: FOY.ch, rail: 108, wall: '#d9dde6', wain: '#3f7a82', floorA: '#b4bac8', floorB: '#8b92a6', ceil: '#e6e9f0', fog: '#aab6d0', fogAmt: .3, tile: 120 });
  const on = o.lampsOn ?? 1;
  for (const z of [300, 800]) if (z > V2.P.cz + 220) for (const X of [-230, 230]) ceilingLamp(X, z, FOY.ch, on, '215,230,255', 100, 170);   /* a lamp the dolly has passed is skipped */
  // a light fixture over the door, a framed certificate and a fire extinguisher: the corner of a building nobody goes to
  const cert = wallBox(zb, -470, 380, -330, 470);
  ctx.save(); rr(cert[0], cert[1], cert[2], cert[3], 4); ctx.fillStyle = '#6a4a2e'; ctx.fill(); ctx.restore();
  UI.panel([cert[0] + 6, cert[1] + 6, cert[2] - 12, cert[3] - 12], { fill: '#f5f0dc', stroke: false, r: 2, id: 'cert13', kind: 'sign', pad: 4 });
  UI.lines(['AUDIT 2019', 'PASSED'], cert[0] + cert[2] / 2, cert[1] + cert[3] / 2, { align: 'center', size: cert[3] * .17, weight: 900, fill: '#5a3a1a', v: 'mid', lh: 1.25, hero: false, maxW: cert[2] * .8 });
  const ex = p2(-520, 0, zb - 30), ek = kzP(zb - 30);
  ctx.save(); ctx.translate(ex[0], ex[1]); ctx.scale(ek, ek); ctx.fillStyle = '#d6203a'; rr(-17, -150, 34, 120, 14); ctx.fill(); ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#2a2d34'; rr(-8, -176, 16, 28, 4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#2a2d34'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(8, -166); ctx.quadraticCurveTo(34, -150, 22, -100); ctx.stroke(); ctx.restore();
  const [x, y, k] = V2.proj(0, 0, zb);
  const lampY = p2(0, FOY.ch, zb - 100);
  V2.glow(x, y - 400 * k, 520 * k, '200,225,255', .12, 'screen', .3);
  return { x, y, k, zb };
}

// ------------------------------------------------------------------ the long hall (S6.corridor) with a call-light dome over every door; at the far end the break room door.
// doors: 36 doors, 18 a side; lit(i, t) -> null | [rgb, level] sets the domes (i counts from the camera). o.doorState = options for breakDoor; o.noEndDoor
const HDOORS2 = [];
{ const DC = ['#9d6b74', '#6d8f88', '#a8744f', '#8e6f55'];
  for (let i = 0; i < 18; i++) { HDOORS2.push({ side: -1, z: 620 + i * 340, n: String(2 * i + 2), color: DC[i % 4] }); HDOORS2.push({ side: 1, z: 790 + i * 340, n: String(2 * i + 1), color: DC[(i + 1) % 4] }); } }
const HALL_END = 6900;
function hall(o = {}) {
  const t = o.t ?? 0, lit_ = o.lit || (() => null), doors = HDOORS2.filter(d => d.z < HALL_END - 200).map((d, i) => { const l = lit_(i, t); return Object.assign({}, d, { n: '', dome: l && l[1] > .02 ? l : null }); });
  S6.corridor({ doors, ch: 700, fog: o.fog ?? '#c4cfe2', fogAmt: o.fogAmt ?? .32, wall: o.wall ?? '#e9e0cb', wain: o.wain ?? '#5c9298', lampOn: o.lampOn ?? 1, bright: o.bright ?? .9, signs: [], zFar: HALL_END, endDoors: false,
    decor: [{ side: -1, z: 1150, c: '#e6a23c' }, { side: 1, z: 1500, c: '#6cc1d9' }, { side: -1, z: 2050, c: '#9bd96c' }, { side: 1, z: 2480, c: '#d96c8a' }] });
  const q = V2.proj(0, 0, HALL_END);
  if (!o.noEndDoor) breakDoor(q[0], q[1], q[2] * .72, Object.assign({ noReader: true, noWet: true, t, plaque: false, sign: o.endSign !== false }, o.doorState));
  return { x: q[0], y: q[1], k: q[2] };
}

// ------------------------------------------------------------------ props and accessories shared by the Episode 13 scenes (prefix fp13_)
// hold: { r: 'fp13_granola' } a granola bar in its wrapper (o.granola { peel 0..1, bite 0..1 }: the vault scene eats the same bar), 'fp13_paper' (a printout), 'fp13_badge' (the PER DIEM card held out),
// 'fp13_projector' (the Administrator's pocket projector, o.projOn 0..1 its lens), 'fp13_clicker' (Mango's slide remote, o.clickK 0..1 the press); acc: ['fp13_headset'] a headset with a boom mic (Lemon)
Object.assign(PROP_BOX, {
  fp13_granola: Object.assign([-52, -26, 52, 26], { nearFace: true }), fp13_paper: [-54, -120, 54, 14], fp13_badge: [-34, -50, 34, 62], fp13_projector: [-50, -34, 50, 30], fp13_clicker: [-14, -50, 14, 14],
});
EXT.prop.fp13_granola = (side, o, t) => {
  const g = o.granola || {}, peel = cl01(g.peel ?? 0), bite = cl01(g.bite ?? 0);
  ctx.save(); ctx.rotate(-.14 * side);
  const L = 98 * (1 - .45 * bite);
  ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 3.4; ctx.lineJoin = 'round';
  ctx.fillStyle = grad(0, -18, 0, 18, [[0, '#f0d9a0'], [.5, '#cfa55a'], [1, '#9a6f2a']]); rr(-49, -17, L, 34, 6); ctx.fill(); ctx.stroke();   /* the bar */
  ctx.fillStyle = 'rgba(90,50,10,.55)'; for (let i = 0; i < 10; i++) { const x = -43 + i * 9.4; if (x < -49 + L - 6) { ell(x, -7 + (i % 3) * 7, 3, 2.4, i); ctx.fill(); } }
  const wr = 1 - peel;   /* the wrapper: a foil sleeve with a stripe, crimped at both ends, peeled back from the right */
  if (wr > .02) {
    const wl = 98 * wr + 8;
    ctx.fillStyle = grad(0, -19, 0, 19, [[0, '#e9edf3'], [.5, '#b8c2d2'], [1, '#8e9aaf']]); rr(-53, -19, wl, 38, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8283c'; ctx.fillRect(-49, -4, Math.max(0, wl - 12), 9);
    ctx.fillStyle = '#2a6fdb'; ctx.fillRect(-49, 5, Math.max(0, wl - 12), 4);
    ctx.strokeStyle = 'rgba(15,12,24,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-53 + wl - 4 - i * 3, -17); ctx.lineTo(-53 + wl - 4 - i * 3, 17); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(-47, -16, wl * .6, 5, 2.5); ctx.fill();
  }
  if (peel > .02) { ctx.strokeStyle = '#b8c2d2'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-40, -8); ctx.quadraticCurveTo(-60, -38 * peel, -34, -50 * peel); ctx.stroke(); }
  ctx.restore();
};
EXT.prop.fp13_paper = (side, o, t) => {
  ctx.save(); ctx.rotate(side * -.06);
  ctx.fillStyle = '#fffdf5'; ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 3.4; rr(-50, -118, 100, 128, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(40,40,60,.55)'; for (let i = 0; i < 9; i++) ctx.fillRect(-40, -104 + i * 12.5, 80 - (i % 3) * 14, 3);
  ctx.fillStyle = 'rgba(190,40,50,.5)'; ctx.fillRect(-40, -104 + 7 * 12.5, 80, 3);
  ctx.restore();
};
EXT.prop.fp13_badge = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .08 + Math.sin(t * 2.4) * .02);
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-side * 30, 62); ctx.quadraticCurveTo(-side * 28, 30, 0, 14); ctx.stroke();   /* the reel cord */
  ctx.fillStyle = '#c0c6cf'; ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 2.6; rr(-9, -50, 18, 12, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.lineWidth = 3; rr(-30, -40, 60, 74, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8193a'; rr(-30, -40, 60, 20, 6); ctx.fill(); ctx.stroke();
  UI.label('PER DIEM', 0, -30, { size: 11, weight: 900, fill: '#fff', spacing: .4, maxW: 52, hero: false });
  ctx.fillStyle = '#c9d2f0'; ell(0, 0, 13, 13); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#15111a'; rr(-18, 20, 36, 5, 2); ctx.fill();
  ctx.restore();
};
EXT.prop.fp13_projector = (side, o, t) => {
  const on = cl01(o.projOn ?? 0);
  ctx.save(); ctx.rotate(side * -.1);
  ctx.fillStyle = grad(0, -26, 0, 24, [[0, '#4a4f5c'], [1, '#23262e']]); ctx.strokeStyle = 'rgba(15,12,24,.95)'; ctx.lineWidth = 3.6; rr(-46, -26, 92, 52, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#12141a'; ell(side * 24, 0, 17, 17); ctx.fill(); ctx.stroke();
  ctx.fillStyle = on > .05 ? `rgba(160,235,255,${.55 + .45 * on})` : '#3a4458'; ell(side * 24, 0, 11, 11); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-side * 38, -14 + i * 9); ctx.lineTo(-side * 18, -14 + i * 9); ctx.stroke(); }   /* the fan grille */
  ctx.fillStyle = on > .05 ? '#5cff9a' : '#444'; ell(-side * 30, 17, 3, 3); ctx.fill();
  if (on > .05) V2.glow(side * 24, 0, 60, '150,230,255', .7 * on, 'screen', .8);
  ctx.restore();
};
EXT.prop.fp13_clicker = (side, o, t) => {
  const c = cl01(o.clickK ?? 0);
  ctx.save(); ctx.rotate(side * -.2);
  ctx.fillStyle = '#f4f5f8'; ctx.strokeStyle = 'rgba(15,12,24,.9)'; ctx.lineWidth = 3.2; rr(-12, -46, 24, 62, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = c > .3 ? '#ff7a8a' : '#e8283c'; ell(0, -28 + c * 2, 6.4 - c, 6.4 - c); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9aa3b2'; rr(-6, -12, 12, 5, 2); ctx.fill(); rr(-6, -3, 12, 5, 2); ctx.fill();
  ctx.restore();
};
// a headset: a band over the crown from ear to ear, an ear cup on the right and a boom mic curling round the cheek to a foam bud beside the mouth (clear of an open mouth)
EXT.acc.fp13_headset = (o, k, t, layer) => {
  const rx = k.rx, ry = k.ry, ex = rx * .97, ey = k.eyeY - 4;
  if (layer === 'back') { ctx.strokeStyle = '#23262e'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-ex, ey - 6); ctx.bezierCurveTo(-rx * .95, -ry * 1.05, rx * .95, -ry * 1.05, ex, ey - 6); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-ex + 4, ey - 10); ctx.bezierCurveTo(-rx * .9, -ry * 1.0, rx * .5, -ry * 1.02, rx * .8, -ry * .7); ctx.stroke(); return; }
  if (layer !== 'front') return;
  for (const s of [-1, 1]) { if (s < 0 && !o.headset2) continue; ctx.fillStyle = grad(s * ex - 14, 0, s * ex + 14, 0, [[0, '#3a3f4c'], [1, '#1d2028']]); ctx.strokeStyle = 'rgba(15,12,24,.95)'; ctx.lineWidth = 3; rr(s * ex - 14, ey - 22, 28, 44, 11); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8283c'; ell(s * ex, ey, 4, 4); ctx.fill(); }
  ctx.strokeStyle = '#1d2028'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - 4, ey + 20); ctx.bezierCurveTo(ex + 6, ey + 70, rx * .92, k.mouthY + 54, rx * .5, k.mouthY + 56); ctx.stroke();
  ctx.fillStyle = '#23262e'; ctx.strokeStyle = 'rgba(15,12,24,.95)'; ctx.lineWidth = 2.6; ell(rx * .46, k.mouthY + 57, 12, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ell(rx * .44, k.mouthY + 54, 5, 2.6); ctx.fill();
};

// ==== NEXT SECTION GOES HERE ====

// ------------------------------------------------------------------ export
window.S13 = { LAY, PAL, CALLCOL, DOOR, FOY, HALL_END, cam, light, station, shafts, slideRect, lightMap, counter, medCart, chair, scoreboard, callBoard, qSign, whiteboard, windowDusk, hallBeyond, reader, breakDoor, foyer, hall, sfxWord, wordT, route, pulse, sk, wallBox, wallPoly, clipPoly, kzP, shade, mixh };
})();
