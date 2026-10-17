'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scenes 'exit' (10:59 PM, THE FRONT DOOR) and 'lot' (11:00 PM, THE PARKING LOT).
 * (header comment written at the end of the build)
 */
(() => {
if (!window.TIMELINE_EP11) return;
window.__EP11_SCENES = window.__EP11_SCENES || {};
const { person, runner, zoomTo, faceC, drawBg, inB } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S6 = window.S6, S7 = window.S7;
const { onZ, kz, lit, box3, ceilingLamp, plant3 } = S6;
const { p2, poly, quad3, grad, radial } = V2;
const lemonC = A7.lemon, melonC = A9.melon, strawC = A11.straw;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 ones)
// scene-relative time of a spoken word, from the recorded line's word timings (falls back to a guess if the line is missing)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// a route through keyed positions [t, X, Z, ease]
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? easeIn(k) : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// a neighbor of the subject in a close-up: out of focus, behind the shot, never audited
const nbr = o => V2.dof(6, () => drawBg(o));
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const ez = (t, a, b) => easeIO(seg(t, a, b));
const eo = (t, a, b) => easeOut(seg(t, a, b));
// frame a face for a close-up with the face dx pixels right of the frame centre and `up` pixels above it
const camFace = (o, z, up = 80, dx = 0) => { const [fx, fy] = faceC(o); zoomTo(fx - dx / z, fy + up / z, z); };
// a glowing four-point glint
function glint(x, y, r, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.fillStyle = `rgba(255,250,220,${a})`;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .12, -r * .12, r, 0); ctx.quadraticCurveTo(r * .12, r * .12, 0, r); ctx.quadraticCurveTo(-r * .12, r * .12, -r, 0); ctx.quadraticCurveTo(-r * .12, -r * .12, 0, -r); ctx.fill(); ctx.restore();
}
const rgba = (c, a) => V2.rgba(c, a);
const sinp = (t, f, p = 0) => Math.sin(t * f + p);

// ------------------------------------------------------------------ costume and props (names carry the ex prefix: they register globally)
// Strawberry's coat: a teal wool coat closed over her scrubs, big lapels, two rows of buttons and a belt; o.coatBack draws the plain back of it for the walk through the door
Object.assign(PROP_BOX, { exfob11: [-26, -34, 26, 40] });
EXT.acc.excoat11 = (o, k, t, layer) => {
  if (layer !== 'mid') return;
  const col = o.coatColor || '#2f7480', dk = '#1c4a54', hi = '#4c9aa6';
  ctx.save(); ctx.clip(PATHS[o.kind] || (PATHS[o.kind] = bodyPath(k)));
  const top = o.coatBack ? -k.ry * .2 : k.mouthY + 30, bot = k.ry * 1.2, rx = k.rx;
  ctx.fillStyle = V2.grad(0, top, 0, bot, [[0, hi], [.18, col], [1, dk]]); ctx.fillRect(-rx * 1.2, top, rx * 2.4, bot - top);
  // wool: a few soft vertical folds
  ctx.strokeStyle = 'rgba(10,40,48,.28)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const x of [-.7, -.42, .42, .7]) { ctx.beginPath(); ctx.moveTo(x * rx, top + 26); ctx.bezierCurveTo(x * rx * 1.06, top + 60, x * rx * .94, k.ry * .7, x * rx * .8, bot); ctx.stroke(); }
  if (o.coatBack) {
    ctx.strokeStyle = 'rgba(10,36,44,.7)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, top + 14); ctx.lineTo(0, bot); ctx.stroke();   // the centre vent
    ctx.fillStyle = dk; ctx.fillRect(-rx * 1.2, k.ry * .38, rx * 2.4, 22); ctx.fillStyle = '#d8c28a'; rr(-12, k.ry * .38 + 3, 24, 16, 3); ctx.fill();   // belt and buckle
    ctx.fillStyle = V2.grad(0, top - 4, 0, top + 30, [[0, dk], [1, col]]); ctx.beginPath(); ctx.moveTo(-rx * .8, top + 10); ctx.quadraticCurveTo(0, top - 18, rx * .8, top + 10); ctx.lineTo(rx * .8, top + 30); ctx.quadraticCurveTo(0, top + 6, -rx * .8, top + 30); ctx.closePath(); ctx.fill();
  } else {
    // lapels: dark wedges from the shoulders down to the first button, a notch where they meet the collar
    ctx.fillStyle = dk;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * rx * .78, top - 4); ctx.lineTo(sd * rx * .2, top - 4); ctx.lineTo(sd * 8, k.ry * .62); ctx.lineTo(sd * rx * .52, k.ry * .5); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-rx * .2, top - 4); ctx.lineTo(-8, k.ry * .62); ctx.moveTo(rx * .2, top - 4); ctx.lineTo(8, k.ry * .62); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,230,236,.35)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-rx * .66, top + 2); ctx.lineTo(-rx * .48, k.ry * .46); ctx.moveTo(rx * .66, top + 2); ctx.lineTo(rx * .48, k.ry * .46); ctx.stroke();
    ctx.fillStyle = dk; ctx.fillRect(-rx * 1.2, k.ry * .72, rx * 2.4, 20); ctx.fillStyle = '#d8c28a'; rr(-12, k.ry * .72 + 2, 24, 16, 3); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,0,.6)'; ctx.lineWidth = 2; ctx.stroke();   // the belt
    ctx.fillStyle = '#e9dcb6'; ctx.strokeStyle = 'rgba(30,20,10,.7)'; ctx.lineWidth = 2;
    for (const [x, y] of [[-24, k.ry * .64], [24, k.ry * .64], [-22, k.ry * .98], [22, k.ry * .98]]) { ell(x, y, 6.5, 6.5); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, k.ry * .62); ctx.lineTo(0, bot); ctx.stroke();   // the closing seam
  }
  ctx.restore();
};
// the car key fob in her hand: a black fob with a silver ring and a lit button (o.fobA 0..1 is the press flash)
EXT.prop.exfob11 = (side, o, t) => {
  ctx.save(); ctx.rotate(side * .35);
  ctx.strokeStyle = '#c0c6cf'; ctx.lineWidth = 4; ell(0, 30, 11, 11); ctx.stroke();
  ctx.fillStyle = '#17141f'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-15, -30, 30, 60, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a3646'; rr(-10, -24, 20, 12, 5); ctx.fill();
  const f = o.fobA || 0; ctx.fillStyle = f > .02 ? `rgba(255,${120 + 100 * f | 0},110,${.55 + .45 * f})` : '#c43a3a'; ell(0, 4, 7, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-12, -28, 5, 40, 3); ctx.fill();
  ctx.restore();
};

// ------------------------------------------------------------------ a seven-segment display (hexagonal segments, a ghost of the unlit ones, a glow)
const SEG7 = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
// one digit with its top-left corner at (x, y); b is the brightness 0..1 of the lit segments, rgb the lit colour
function seg7(x, y, w, h, d, b, rgb, o = {}) {
  const t = w * .2, g = t * .18, m = y + h / 2;
  const hx = (x0, x1, yc) => [[x0, yc], [x0 + t / 2, yc - t / 2], [x1 - t / 2, yc - t / 2], [x1, yc], [x1 - t / 2, yc + t / 2], [x0 + t / 2, yc + t / 2]];
  const vy = (xc, y0, y1) => [[xc, y0], [xc + t / 2, y0 + t / 2], [xc + t / 2, y1 - t / 2], [xc, y1], [xc - t / 2, y1 - t / 2], [xc - t / 2, y0 + t / 2]];
  const P = { a: hx(x + t / 2 + g, x + w - t / 2 - g, y + t / 2), g: hx(x + t / 2 + g, x + w - t / 2 - g, m), d: hx(x + t / 2 + g, x + w - t / 2 - g, y + h - t / 2),
    f: vy(x + t / 2, y + t / 2 + g, m - g), b: vy(x + w - t / 2, y + t / 2 + g, m - g), e: vy(x + t / 2, m + g, y + h - t / 2 - g), c: vy(x + w - t / 2, m + g, y + h - t / 2 - g) };
  const on = d == null ? '' : SEG7[d];
  for (const [nm, pts] of Object.entries(P)) {
    const lt = on.includes(nm);
    ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath();
    if (!lt) { ctx.fillStyle = o.ghost ?? 'rgba(70,10,14,.7)'; ctx.fill(); continue; }
    ctx.fillStyle = V2.grad(0, y, 0, y + h, [[0, rgba(rgb, .78 + .22 * b)], [.5, `rgba(255,${200 * b + 40 | 0},${190 * b + 40 | 0},${.9 + .1 * b})`], [1, rgba(rgb, .78 + .22 * b)]]); ctx.fill();
  }
}
// the whole readout: "hh:mm:ss" with the PM lamp; origin at the centre of the display, width 560, digit height 150
function ledReadout(S0, o = {}) {
  const tot = 22 * 3600 + 59 * 60 + Math.floor(S0 + 1e-6), hh = Math.floor(tot / 3600) % 12 || 12, mm = Math.floor(tot / 60) % 60, ss = tot % 60;
  const digs = [Math.floor(hh / 10), hh % 10, Math.floor(mm / 10), mm % 10, Math.floor(ss / 10), ss % 10];
  const rgb = o.rgb || '255,56,48', b = o.b ?? .8, dw = 70, dh = 150, gap = 12, cw = 24;
  const total = 6 * dw + 2 * cw + 7 * gap; let x = -total / 2;
  ctx.save(); ctx.translate(0, -dh / 2);
  const hide0 = hh < 10;
  digs.forEach((d, i) => {
    seg7(x, 0, dw, dh, i === 0 && hide0 ? null : d, b, rgb); x += dw + gap;
    if (i === 1 || i === 3) { const colon = o.colon ?? 1; for (const yy of [dh * .33, dh * .67]) { ctx.fillStyle = `rgba(255,${120 * colon + 40 | 0},${110 * colon + 40 | 0},${.25 + .75 * colon})`; ctx.fillRect(x + cw / 2 - 8, yy - 8, 16, 16); } x += cw + gap; }
  });
  ctx.restore();
}

// ------------------------------------------------------------------ the night lobby (adapted from lobbyNight in ep9_exit.js, itself built on S6.shell)
// the back wall carries, left to right: the Administrator's office door, the glass entrance with the big LED clock over it, the EXIT sign; the carpet runs from the doors to the camera
const ZB = 1750, HW = 640, CH = 760;
function exteriorN11(o) {
  const t = o.t ?? 0, hy = V2.P.hy;
  ctx.fillStyle = V2.grad(0, 520, 0, hy + 60, [[0, '#04061c'], [.55, '#121f52'], [1, '#2a3d84']]); ctx.fillRect(-100, 400, W + 200, hy + 160);
  A7.stars(t, 840, { n: 70, seed: 11, a: .8 });
  onZ(3800, -1700, 1700, 0, 480, '#161a38');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 16; c++) if (hash(r * 16 + c + 7) > .42) { const x0 = -1500 + c * 190; onZ(3800, x0, x0 + 80, 90 + r * 130, 160 + r * 130, 'rgba(255,214,130,.85)'); }
  const yh = p2(0, 0, 3800)[1];
  ctx.fillStyle = V2.grad(0, yh, 0, 1450, [[0, '#262c58'], [1, '#12152e']]); ctx.fillRect(-100, yh, W + 200, 1450 - yh);
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineCap = 'butt';
  for (const x of [-900, -450, 0, 450, 900]) { const a = p2(x, 0, 1800), b = p2(x, 0, 3700); ctx.lineWidth = Math.max(1.5, 8 * kz(2000)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  S6.lampPost(-250, 1950, { on: .7 }); S6.lampPost(430, 2850, { on: .7 });
  // her car, parked nose-in under the lamp: the red-pink one from Episode 7, its dark grille toward us
  const cx = -120, cz = 2300, w = 165;
  box3({ x0: cx - w, x1: cx + w, y0: 30, y1: 118, z0: cz, z1: cz + 380, color: '#7a2036', front: '#8a2a40', side: '#561626', top: '#a03850', fog: { color: '#1a2040', amt: .28, zFar: 3800 } });
  box3({ x0: cx - w * .72, x1: cx + w * .72, y0: 118, y1: 200, z0: cz + 90, z1: cz + 270, color: '#7a2036', front: '#2a2f55', side: '#561626', top: '#9a3450', fog: { color: '#1a2040', amt: .28, zFar: 3800 } });
  for (const sx of [-1, 1]) onZ(cz, cx + sx * w * .62 - 40, cx + sx * w * .62 + 40, 60, 92, 'rgba(255,238,190,.35)', 'rgba(10,6,14,.6)', 1.4);
}
function lobbyN11(o = {}) {
  const P = V2.P, open = o.doorOpen ?? 0, t = o.t ?? 0, k = kz(ZB), dx0 = -300, dx1 = 300, dy1 = 470, S0 = o.S0 ?? 0;
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: '#c3b8ae', wain: '#34485c', floorA: '#9a9282', floorB: '#626476', fog: '#2c3658', fogAmt: .34, tile: 160, rail: 120, ceil: '#d0ced8' });
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = V2.radial(540, 1000, 240, 1350, [[0, 'rgba(255,248,240,1)'], [.55, 'rgba(170,182,224,1)'], [1, 'rgba(84,98,154,1)']]); ctx.fillRect(-400, -400, W + 800, H + 800); ctx.restore();
  // the glass entrance, with the lot beyond it
  onZ(ZB, dx0 - 26, dx1 + 26, 0, dy1 + 26, '#222a38', 'rgba(10,8,20,.75)', 2.6);
  { const f = [p2(dx0, 0, ZB), p2(dx1, 0, ZB), p2(dx1, dy1, ZB), p2(dx0, dy1, ZB)];
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); exteriorN11(o); ctx.restore(); }
  const sh = open * 146;
  for (const [a, b] of [[-300, -150], [150, 300]]) onZ(ZB, a, b, 0, dy1, 'rgba(190,215,240,.10)', '#222a38', 4);
  for (const [a, b, s] of [[-150 - sh, -sh, 1], [sh, 150 + sh, -1]]) {
    onZ(ZB, a, b, 0, dy1, 'rgba(190,215,240,.13)', '#222a38', 5); onZ(ZB, a, b, 230, 242, 'rgba(255,255,255,.3)');
    const e = s > 0 ? b : a; onZ(ZB, e - 12 + (s > 0 ? 0 : -12), e - 4 + (s > 0 ? 0 : -12), 170, 310, '#c9ced6', '#222a38', 1.5);
  }
  // the header over the glass: the facility's sign
  onZ(ZB, dx0 - 26, dx1 + 26, dy1 + 26, dy1 + 84, '#1d2330', 'rgba(255,226,170,.5)', 2);
  { const [sx, sy] = p2(0, dy1 + 55, ZB); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${27 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '2px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  if (!o.noClock) { const [cx, cy] = p2(0, 648, ZB); ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); bigClock(S0, o); ctx.restore(); }
  // the EXIT sign, right of the doors, and the lamp over it
  { const f = [p2(370, 440, ZB), p2(520, 440, ZB), p2(520, 500, ZB), p2(370, 500, ZB)]; poly(f, '#0c3a1c', 'rgba(10,8,20,.7)', 2);
    onZ(ZB, 376, 514, 446, 494, '#1fdc6a'); const [ex, ey] = p2(445, 470, ZB); text('EXIT', ex, ey + 1, { size: 36 * k, font: 'Bangers', weight: 400, fill: '#073a1a', spacing: 3 });
    V2.glow(ex, ey, 260 * k, '70,255,150', .5, 'screen', .8); }
  // the Administrator's door (shut here; officeDoor() swings it)
  officeDoor(o.officeOpen ?? 0);
  // the left-over welcome: the banner (one R short, sagging off one nail) and a couple of tired balloons
  banner11(t);
  // reception, a lamp and plants
  S6.box3({ x0: 340, x1: 640, y1: 205, z0: 1300, z1: 1600, color: '#5a4636', top: '#d8c9a4', side: '#43352a', frontGrad: [[0, '#6a5240'], [1, '#463426']], fog: { color: '#2c3658', amt: .2, zFar: ZB } });
  onZ(1300, 380, 600, 96, 160, '#f2ecdc', 'rgba(25,16,30,.7)', 2); { const [rx, ry] = p2(490, 128, 1300); text('SIGN IN', rx, ry, { size: 26 * kz(1300), fill: '#2a2530', spacing: 2 }); }
  S6.box3({ x0: 440, x1: 530, y0: 205, y1: 292, z0: 1430, z1: 1462, color: '#1a1d26', front: '#10131a' });
  { const q = p2(485, 262, 1430), kk = kz(1430); V2.glow(q[0], q[1], 120 * kk, '120,180,255', .35, 'screen', .5); }
  S6.box3({ x0: 580, x1: 614, y0: 205, y1: 214, z0: 1340, z1: 1380, color: '#d7b64a' });
  { const q = p2(597, 280, 1360), kk = kz(1360); ctx.fillStyle = '#ffe3a0'; ell(q[0], q[1], 18 * kk, 22 * kk); ctx.fill(); ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q[0], q[1] + 22 * kk); ctx.lineTo(q[0], p2(597, 214, 1360)[1]); ctx.stroke(); V2.glow(q[0], q[1], 330 * kk, '255,206,130', .6, 'screen', .8); }
  plant3(-600, 1560, 1.0); plant3(600, 1700, .9);
  // the carpet and its stanchions: still down from the welcome
  carpet11();
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const Z = 1660 - i * 170; if (i) rope11(s * 150, Z + 170, Z); stanchion11(s * 150, Z); }
  for (const z of [300, 900, 1500]) if (z + 150 > P.cz + 150) { ceilingLamp(-260, z, CH, z === 1500 ? .75 : .3, '255,236,200'); ceilingLamp(260, z, CH, z === 1500 ? .75 : .3, '255,236,200'); }
  // light: a cool spill from the glass across the floor, warm pools under the lamps
  const fa = p2(-300, 0, ZB), fb = p2(300, 0, ZB), fc = p2(560, 0, P.cz + 260), fd = p2(-560, 0, P.cz + 260);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, fa[1], 0, fc[1], [[0, `rgba(150,190,255,${.2 + .22 * open})`], [.6, `rgba(150,190,255,${.07 + .05 * open})`], [1, 'rgba(150,190,255,0)']]);
  ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore();
  for (const [X, Z] of [[260, 1500], [-260, 1500]]) if (Z > P.cz + 150) { const [gx, gy] = p2(X, 0, Z); V2.glow(gx, gy, 330 * kz(Z), '255,226,170', .1, 'screen', 0); }
  const [dxx, dyy] = p2(0, 240, ZB); V2.glow(dxx, dyy, 640 * k, '150,190,255', .16 + .16 * open, 'screen', .5);
  // the clock's red wash on the wall and ceiling around it
  { const [cx, cy] = p2(0, 648, ZB); V2.glow(cx, cy, 620 * k, '255,50,40', (o.clockGlow ?? .22), 'screen', .5); }
}

// the big LED clock over the doors: a black housing with a red-tinted glass, the readout, a PM lamp, two brackets; flash 0..1 whites it out on the ding
function bigClock(S0, o = {}) {
  const w = 660, h = 230, fl = o.flash || 0, pulse = o.pulse || 0;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-w / 2 + 8, -h / 2 + 14, w, h, 22); ctx.fill();
  ctx.fillStyle = V2.grad(0, -h / 2, 0, h / 2, [[0, '#2a2c36'], [1, '#14151c']]); ctx.strokeStyle = '#06060a'; ctx.lineWidth = 6; rr(-w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0a0406'; rr(-w / 2 + 22, -h / 2 + 20, w - 44, h - 40, 10); ctx.fill();
  ctx.save(); rr(-w / 2 + 22, -h / 2 + 20, w - 44, h - 40, 10); ctx.clip();
  ctx.fillStyle = V2.radial(0, 0, 40, 380, [[0, `rgba(255,50,40,${.16 + .2 * pulse})`], [1, 'rgba(255,50,40,0)']]); ctx.fillRect(-w / 2, -h / 2, w, h);
  ledReadout(S0, { b: .72 + .28 * pulse + .3 * fl, colon: o.colon ?? 1 });
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .1 + .12 * pulse + .4 * fl; ctx.translate(0, 0); ledReadout(S0, { b: 1, colon: o.colon ?? 1 }); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // a streak of reflection across the glass
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 60, -h / 2); ctx.lineTo(-w / 2 + 170, -h / 2); ctx.lineTo(-w / 2 + 40, h / 2); ctx.lineTo(-w / 2 - 70, h / 2); ctx.closePath(); ctx.fill();
  ctx.restore();
  text('PM', -w / 2 + 62, h / 2 - 40, { size: 26, font: 'Bangers', weight: 400, fill: 'rgba(255,90,80,.85)', spacing: 2 });
  for (const sx of [-1, 1]) { ctx.fillStyle = '#3a3d48'; rr(sx * (w / 2 - 70) - 14, -h / 2 - 40, 28, 44, 5); ctx.fill(); }
}

// the office door on the left of the back wall: hinge on the left edge, swings into the lobby (open = 0 shut .. 1 flung wide); a warm room beyond
const OD = { x0: -610, w: 140, h: 330 };
function officeDoor(open) {
  const { x0, w, h } = OD, th = open * 1.9, xe = x0 + w * Math.cos(th), ze = ZB - w * Math.sin(th), k = kz(ZB);
  onZ(ZB, x0 - 16, x0 + w + 16, 0, h + 16, '#2a2018', 'rgba(10,8,20,.7)', 2.4);   // the frame
  if (open > .01) {
    onZ(ZB, x0, x0 + w, 0, h, V2.grad(0, p2(0, h, ZB)[1], 0, p2(0, 0, ZB)[1], [[0, '#ffe0a0'], [1, '#c98a50']]));   // the lit office
    onZ(ZB, x0 + 30, x0 + w - 24, 70, 120, '#6a4a30'); onZ(ZB, x0 + 50, x0 + w - 40, 120, 210, '#3a2c20');
    const [gx, gy] = p2(x0 + w / 2, 160, ZB); V2.glow(gx, gy, 420 * k, '255,214,140', .5 * open, 'screen', .8);
    // light spilling across the lobby floor
    const a = p2(x0, 0, ZB), b = p2(x0 + w, 0, ZB), c = p2(x0 + w + 560, 0, ZB - 760), d = p2(x0 - 260, 0, ZB - 700);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, a[1], 0, c[1], [[0, `rgba(255,214,140,${.34 * open})`], [1, 'rgba(255,214,140,0)']]);
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const q = [p2(x0, 0, ZB), p2(xe, 0, ze), p2(xe, h, ze), p2(x0, h, ZB)];
  poly(q, V2.grad(q[0][0], 0, q[1][0], 0, [[0, '#7a5232'], [1, '#5a3a22']]), 'rgba(15,8,12,.8)', 3);
  if (open < .5) {   // the nameplate, the panel mouldings and the frosted light only read while the door faces us
    onZ(ZB, x0 + 22, x0 + w - 22, 190, 300, 'rgba(255,226,170,.16)', 'rgba(15,8,12,.6)', 2);
    onZ(ZB, x0 + 14, x0 + w - 14, 28, 160, 'rgba(0,0,0,.12)', 'rgba(15,8,12,.5)', 2);
    onZ(ZB, x0 + 20, x0 + w - 20, 150, 176, '#d9b64a', 'rgba(40,24,0,.7)', 1.6);
    const [nx, ny] = p2(x0 + w / 2, 163, ZB); text('ADMINISTRATOR', nx, ny + 1, { size: 12 * k * 1.25, fill: '#3a2400', spacing: .5, maxW: 118 * k });
    onZ(ZB, x0 + w - 30, x0 + w - 16, 140, 150, '#d8dce2');
  }
}
// the banner from the party, still up eight hours later and one R short; it hangs by one nail and sags, two balloons have gone soft
function banner11(t) {
  const X0 = -622, X1 = -340, Yt = 585, Yb = 465, k = kz(ZB), sag = 34 + 4 * Math.sin(t * 1.3);
  const tl = p2(X0, Yt, ZB), tr = p2(X1, Yt + 4, ZB), bl = p2(X0, Yb, ZB), br = p2(X1, Yb - sag * 1.1, ZB);
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(70,60,60,.7)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(tl[0], tl[1]); ctx.lineTo(tl[0] + 3, tl[1] - 22 * k); ctx.stroke();
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 10 * k; ctx.shadowOffsetY = 5 * k;
  ctx.fillStyle = V2.grad(0, tl[1], 0, bl[1], [[0, '#d83a82'], [1, '#a2185a']]); ctx.strokeStyle = '#e9c34c'; ctx.lineWidth = Math.max(3, 6 * k);
  ctx.beginPath(); ctx.moveTo(tl[0], tl[1]); ctx.quadraticCurveTo((tl[0] + tr[0]) / 2, tl[1] + 14 * k, tr[0], tr[1]); ctx.lineTo(br[0], br[1]); ctx.quadraticCurveTo((bl[0] + br[0]) / 2, bl[1] + 26 * k, bl[0], bl[1]); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke();
  const cx = (tl[0] + tr[0] + bl[0] + br[0]) / 4, cy = (tl[1] + tr[1] + bl[1] + br[1]) / 4;
  ctx.translate(cx, cy + 3 * k); ctx.rotate(Math.atan2(br[1] - bl[1], br[0] - bl[0]) * .6);
  text('WELCOME BACK', 0, -17 * k, { size: 36 * k * 1.25, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 4 * k, stroke: '#5a0a32', spacing: 2 });
  text('STRAWBERY', 0, 21 * k, { size: 36 * k * 1.25, font: 'Bangers', weight: 400, fill: '#fff8dc', lw: 4 * k, stroke: '#5a0a32', spacing: 2 });
  ctx.restore();
  // soft balloons sagging at the foot of the wall, tied to a weight
  for (const [bx, col, sq] of [[-560, '#ff4f6d', .8], [-512, '#4aa8ff', .7]]) {
    const q = p2(bx, 74 + 12 * sq, ZB), R = 46 * k;
    ctx.fillStyle = V2.radial(q[0] - R * .3, q[1] - R * .35, R * .1, R * 1.1, [[0, '#ffffff'], [.25, col], [1, rgba(V2.mix(col, '#2a1030', .5), 1)]]); ctx.strokeStyle = 'rgba(30,16,36,.8)'; ctx.lineWidth = 2.4;
    ell(q[0], q[1], R * .78, R * sq); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,30,40,.6)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(q[0], q[1] + R * sq); ctx.quadraticCurveTo(q[0] + 8, q[1] + R * sq + 40 * k, q[0] - 6, p2(bx, 0, ZB)[1]); ctx.stroke();
  }
}
const CARPET_HW = 118;
function carpet11() {
  const zN = V2.P.cz + 70, zF = ZB - 2, a = p2(-CARPET_HW, 0, zF), c = p2(CARPET_HW, 0, zN);
  quad3([-CARPET_HW, 0, zF], [CARPET_HW, 0, zF], [CARPET_HW, 0, zN], [-CARPET_HW, 0, zN], grad(0, a[1], 0, Math.max(c[1], H), [[0, '#a8222f'], [.5, '#861222'], [1, '#620b19']]), 'rgba(30,0,8,.55)', 2);
  for (const s of [-1, 1]) { quad3([s * (CARPET_HW - 13), .4, zF], [s * CARPET_HW, .4, zF], [s * CARPET_HW, .4, zN], [s * (CARPET_HW - 13), .4, zN], '#b8963c'); }
  ctx.strokeStyle = 'rgba(50,0,10,.3)';
  for (let z = 1700; z > zN; z -= 90) { const l = p2(-CARPET_HW + 24, .4, z), r = p2(CARPET_HW - 24, .4, z); ctx.lineWidth = Math.max(1, 2.4 * kz(z)); ctx.beginPath(); ctx.moveTo(...l); ctx.lineTo(...r); ctx.stroke(); }
}
function stanchion11(X, Z) {
  const k = kz(Z), [x, y] = p2(X, 0, Z);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(10,6,20,.3)'; ell(8, 4, 34, 9); ctx.fill();
  const g = V2.grad(-14, 0, 14, 0, [[0, '#7a5c14'], [.4, '#d9bc66'], [1, '#6a4c0c']]);
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(30,18,6,.75)'; ctx.lineWidth = 2.6;
  ell(0, -4, 28, 10); ctx.fill(); ctx.stroke(); rr(-5.5, -96, 11, 92, 3); ctx.fill(); ctx.stroke(); ell(0, -100, 12, 12); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function rope11(X, Z0, Z1) {
  const a = p2(X, 90, Z0), b = p2(X, 90, Z1), m = p2(X, 66, (Z0 + Z1) / 2), k = kz((Z0 + Z1) / 2);
  ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2, ...b);
  ctx.strokeStyle = 'rgba(20,0,6,.8)'; ctx.lineWidth = 9 * k + 2; ctx.stroke(); ctx.strokeStyle = '#a8162a'; ctx.lineWidth = 7 * k; ctx.stroke(); ctx.restore();
}

// ============================================================================ exit: the last minute of the shift (10:59 PM)
const SC_EXIT = {};
// story time in seconds past 22:59:00: it runs fast through the dialogue (the last minute is all hurry), then ticks one second per half-second of the countdown
const storySec = lt => {
  const cd = B('cd').s;
  if (lt < cd) return lerp(9, 55.4, lt / cd);
  const x = lt - cd;
  return x < 1.9 ? 56 + Math.floor(x / .5 + 1e-6) : 60 + (x - 1.9);
};
const tickTimes = () => [B('open').s, ...[0, .5, 1, 1.5].map(x => B('cd').s + x), B('cd').s + 1.9];
const tickAge = lt => { let a = 9; for (const t0 of tickTimes()) if (lt >= t0) a = lt - t0; return a; };
const dingT = () => B('cd').s + 1.9;

// positions in the lobby (X, Z); the back wall is at Z 1750, the doors are centred on X 0
const XP = { door: [-540, 1736], lemon: [190, 1340], straw: [-105, 1330] };
const DELTA = { admin: [-290, -85], lemon: [215, 105] };   // where the Administrator and Lemon walk relative to Strawberry in the countdown
const WALK = () => ({ a: B('a1').e + .2, b: dingT() });     // Strawberry's walk: from just after the last GO to the ding
const STRAW_END = [-15, 1560];
SC_EXIT.sPath = lt => {
  const w = WALK(), out = B('out').s;
  return route([[0, -700, 1330], [1.0, XP.straw[0], XP.straw[1], 'out'], [w.a, XP.straw[0], XP.straw[1]], [w.b, STRAW_END[0], STRAW_END[1], 'io'], [out + .3, STRAW_END[0], STRAW_END[1]], [out + 1.12, 0, 1752, 'io']])(lt);
};
SC_EXIT.lPath = lt => {
  const w = WALK(), s = SC_EXIT.sPath(lt), k = ez(lt, w.a, w.b), p = route([[0, 330, 1350], [.95, XP.lemon[0], XP.lemon[1], 'out']])(lt);
  return lt < w.a ? p : [lerp(XP.lemon[0], s[0] + DELTA.lemon[0], k), lerp(XP.lemon[1], s[1] + DELTA.lemon[1], k)];
};
SC_EXIT.aPath = lt => {
  const w = WALK(), s = SC_EXIT.sPath(lt), od = B('a1').s - .45, rest = [XP.straw[0] + DELTA.admin[0], XP.straw[1] + DELTA.admin[1]];
  if (lt >= w.a) return [s[0] + DELTA.admin[0], s[1] + DELTA.admin[1]];
  return route([[0, ...XP.door], [od, ...XP.door], [od + .2, XP.door[0] + 20, XP.door[1] - 30, 'out'], [od + 1.2, rest[0], rest[1], 'out']])(lt);
};
// the office door: shut, flung open a beat before the Administrator's first GO (it bounces off the wall), then it stays open
SC_EXIT.officeOpen = lt => {
  const t0 = B('a1').s - .55;
  if (lt < t0) return 0;
  const k = seg(lt, t0, t0 + .16); return k < 1 ? easeOut(k) * 1.08 : lerp(1.08, .96, ez(lt, t0 + .16, t0 + .5));
};
SC_EXIT.doorOpen = lt => { const o = B('out').s + .1; return eo(lt, o, o + .5); };

SC_EXIT.shot = lt => {
  const b = B, dl = wordT('s1', 'dollars', 6.37), ord = [['wide', b('l1').s - .05], ['cuL', b('s1').s - .05], ['cuS', dl], ['cuLr', dl + .55], ['cuS', b('a1').s - .64], ['wideD', b('a1').s - .06], ['cuA', b('cd').s - .08], ['trk', b('out').s + .27], ['out', 1e9]];
  return ord.find(([, e]) => lt < e)[0];
};
SC_EXIT.cast = lt => {
  const b = B, sh = SC_EXIT.shot(lt), a1 = b('a1'), ding = dingT(), w = WALK(), dl = wordT('s1', 'dollars', 6.4);
  const back = sh === 'out', inW = lt >= w.a && lt < ding + .1, sp = SC_EXIT.sPath(lt);
  const S = person(strawC, SC_EXIT.sPath, lt, { id: 'straw', stride: 46, transit: lt < .7, acc: ['steth', 'bandage7', 'perdiem9', 'excoat11'], coatBack: back, noFace: back,
    look: back ? [0, 0] : inB(lt, 'l1') ? [.5, .02] : inW ? [.15, -.02] : lt >= ding ? [.3, -.05] : [.1, .02],
    expr: lt >= ding && !back ? 'happy' : inW ? 'chill' : lt >= dl && lt < a1.s ? 'chill' : 'dead', lid: inW ? .22 : lt >= ding ? undefined : .1,
    arms: { l: 'rest', r: 'rest' }, hold: { r: 'exfob11' } });
  const Lm = person(lemonC, SC_EXIT.lPath, lt, { id: 'lemon', stride: 46, look: inB(lt, 'l1') ? [-.1, 0] : sh === 'cuLr' ? [-.7, .1] : inW || lt >= ding ? [-.75, .1] : [-.55, .05],
    face: lt >= dl && lt < a1.s ? { raise: 10, wide: 1.12, pup: .78 } : undefined, lid: lt >= dl && lt < a1.s ? undefined : .12,
    arms: { l: 'hold', r: 'hold' }, hold: { l: 'pen9', r: 'clipboard6' }, grip: { l: [-104, 14], r: [112, 36] }, clipText: 'OT FORM' });
  const od = a1.s - .45, running = lt >= od && lt < w.a, Ad = (running ? runner : person)(melonC, SC_EXIT.aPath, lt, { id: 'melon', stride: 40, look: [.15, -.1], transit: lt >= od && lt < od + .45,
    expr: lt >= ding ? 'weak' : lt >= a1.s - .1 ? 'panic' : 'happy', arms: { l: 'wave', r: 'hold' }, hand: { l: 'wave', r: 'flat' }, grip: { r: [140, 48] } }, ...(running ? [300] : []));
  if (lt >= w.a - .3) {   // pit crew: the screen-right hand lands flat on her flank, the other arm throws the GO wave; after the ding he sags
    const gapPx = (S.x - Ad.x) / Ad.s, flank = gapPx - 112 * (S.s / Ad.s);
    Ad.grip = { r: [clamp(flank, 70, 170), 52 + 6 * Math.sin(lt * 9)] }; Ad.arms = { l: lt >= ding ? 'down' : 'wave', r: 'hold' }; Ad.rot = lt < ding ? .13 : 0;
  }
  return { S, L: Lm, Ad, sh };
};

SC_EXIT.cam = function (lt) {
  const sh = SC_EXIT.shot(lt), b = B, ding = dingT(), w = WALK();
  CAM.shake = 0;
  if (sh === 'trk') {
    const sp = SC_EXIT.sPath(lt), ap = SC_EXIT.aPath(lt), lp = SC_EXIT.lPath(lt);
    V2.setCam({ f: 2000, cz: -560, cx: (sp[0] + ap[0] + lp[0]) / 3, cy: 480, hy: 800 });   // a long lens: the wall and its clock stand right behind the three of them
    zoomTo(540, 960, lerp(1, 1.06, seg(lt, b('cd').s - .1, b('out').s + .27)));
    if (lt >= ding && lt < ding + .35) CAM.shake = 8 * (1 - seg(lt, ding, ding + .35));
    return;
  }
  if (sh === 'out') {
    V2.setCam({ f: 1900, cz: -540, cx: 0, cy: 430, hy: 800 });
    zoomTo(540, 960, lerp(1, 1.1, seg(lt, b('out').s + .27, CUR.dur)));
    return;
  }
  V2.setCam({ f: 1400, cy: 360, hy: 860 });
  const c = SC_EXIT.cast(lt);
  if (sh === 'wide') { const k = seg(lt, 0, b('l1').s); zoomTo(lerp(560, 530, k), 930, lerp(1.1, 1.14, k)); }
  else if (sh === 'wideD') zoomTo(400, 960, 1.06);
  else if (sh === 'cuL') camFace(c.L, lerp(1.7, 1.85, seg(lt, b('l1').s, b('s1').s)), 130, 0);
  else if (sh === 'cuLr') camFace(c.L, 1.95, 130, 0);
  else if (sh === 'cuS') camFace(c.S, lerp(1.55, 1.75, seg(lt, b('s1').s, b('s1').e)), 150, 0);
  else if (sh === 'cuA') camFace(c.Ad, lerp(1.6, 1.75, seg(lt, b('a1').s - .1, b('a1').e)), 125, 0);
};

SC_EXIT.draw = function (lt) {
  const b = B, c = SC_EXIT.cast(lt), sh = c.sh, S0 = storySec(lt), ta = tickAge(lt), ding = dingT(), cdS = b('cd').s;
  V2.setLight({ key: [-.35, -.8], keyColor: '#ffe3b8', keyA: .26, rim: '#8fb8ff', rimA: sh === 'trk' || sh === 'out' ? .6 : .5, shadow: '#0a1030', shadowA: .45, amb: '#9aa6e0', ambA: .1, bounce: '#ffcf99', bounceA: .2,
    back: sh === 'trk' || sh === 'out' ? { color: '150,200,255', a: .32, w: 16 } : null, frontDark: .12 });
  V2.opts.reflect = true;
  const pulse = Math.exp(-ta * 10), colon = lt < cdS ? (lt % 1 < .5 ? 1 : .12) : (ta < .24 ? 1 : .12), flash = lt >= ding ? Math.exp(-(lt - ding) * 6.5) : 0;
  const od = SC_EXIT.officeOpen(lt), gl = .2 + .26 * pulse + .6 * flash;
  const crisp = sh === 'trk' || sh === 'out' || sh === 'wide' || sh === 'wideD';
  const bg = (noClock) => lobbyN11({ t: lt + 2, doorOpen: SC_EXIT.doorOpen(lt), officeOpen: od, S0, pulse, colon, flash, clockGlow: gl, noClock });
  const blurPx = sh === 'trk' ? 3.2 : sh === 'out' ? 3.6 : crisp ? 0 : 5.5;
  V2.dof(blurPx, () => bg(sh === 'trk' || sh === 'out'));
  const clockXY = p2(0, 648, ZB), kb = kz(ZB);
  if (sh === 'trk' || sh === 'out') { ctx.save(); ctx.translate(clockXY[0], clockXY[1]); ctx.scale(kb, kb); bigClock(S0, { pulse, colon, flash }); ctx.restore(); }
  // coloured light on the cast: the clock's red from above, the doors' cool white from behind, the desk lamp
  V2.addLight({ x: clockXY[0], y: clockXY[1], r: 1500, color: '255,60,50', a: .2 + .3 * pulse + .4 * flash });
  { const q = p2(0, 240, ZB); V2.addLight({ x: q[0], y: q[1], r: 1400, color: '150,190,255', a: .2 + .2 * SC_EXIT.doorOpen(lt) }); }
  { const q = p2(597, 280, 1360); V2.addLight({ x: q[0], y: q[1], r: 900, color: '255,200,130', a: .2 }); }
  const subj = { cuL: 'L', cuLr: 'L', cuS: 'S', cuA: 'Ad' }[sh];
  const present = [['S', c.S], ['L', c.L]]; if (lt >= b('a1').s - .45) present.push(['Ad', c.Ad]);
  present.sort((p, q) => p[1].y - q[1].y);
  const sp = SC_EXIT.sPath(lt), through = sh === 'out' && sp[1] > ZB - 40;
  for (const [n, o] of present) {
    if (!subj || n === subj) {
      if (n === 'S' && through) { ctx.save(); const f = [p2(-300, 0, ZB), p2(300, 0, ZB), p2(300, 470, ZB), p2(-300, 470, ZB)]; ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); drawChar(o); ctx.restore(); }
      else drawChar(o);
    } else nbr(o);
  }
  V2.dust(60, 560, 1020, 1500, lt, { n: 22, alpha: .22, color: '200,215,255', speed: sh === 'trk' ? 5 : 14 });
};

SC_EXIT.fx = lt => {
  const sh = SC_EXIT.shot(lt), ding = dingT(), fl = lt >= ding ? .85 * Math.exp(-(lt - ding) * 6.5) : 0, fi = lt < .2 ? 1 - lt / .2 : 0;
  return { bloom: sh === 'trk' || sh === 'out' ? .8 : .6, vignette: .55, grain: .05, contrast: .18, sat: .1, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .1, 'multiply']],
    aberr: fl > .25 ? 6 : 0, fade: Math.max(fi, fl), fadeColor: fl > fi ? '255,238,232' : '0,0,10' };
};
SC_EXIT.blur = lt => { const sh = SC_EXIT.shot(lt), d = dingT(); return sh === 'trk' ? (lt > d - .05 && lt < d + .4 ? 3 : 2) : 1; };
SC_EXIT.clock = lt => lt >= dingT() ? '11:00 PM' : '10:59 PM';
SC_EXIT.over = function (lt) {
  const b = B, ding = dingT();
  // a small TICK on every beat of the countdown
  for (const t0 of tickTimes().slice(1, 5)) sfxWord(lt, t0, 'TICK', 870, 360, { size: 74, hold: .2, fill: '#fff', rot: .06 });
  sfxWord(lt, ding, 'DING!', 640, 400, { size: 160, hold: .55, fill: '#ffe135', rot: -.06 });
  calc11(lt);
};
// the floating sum over Strawberry's head while she says the number: 1.5 x $118 = $177
function calc11(lt) {
  const s1 = B('s1'); if (lt < s1.s - .1 || lt > s1.e + .15) return;
  const tA = wordT('s1', 'overtime', s1.s) + .02, tB = wordT('s1', 'is', s1.s + .48), tC = wordT('s1', 'hundred', s1.s + .82), tD = wordT('s1', 'seventy', s1.s + 1.5), tE = wordT('s1', 'hour', s1.s + 2.8);
  const fadeOut = 1 - seg(lt, s1.e - .05, s1.e + .12), cx = 540, cy = 340, f = n => A9.money(n, false);
  const parts = [['1.5', '#ffd23a', tA, 104], ['×', '#e8eeff', tA + .12, 84], [f(118), '#9fd8ff', tB, 104], ['=', '#e8eeff', tC, 84], [f(177), '#4cf0a0', tD, 124]];
  ctx.save(); ctx.globalAlpha *= fadeOut;
  ctx.font = '400 100px Bangers'; ctx.letterSpacing = '2px';
  const gap = 26, ws = parts.map(([s, , , sz]) => { ctx.font = `400 ${sz}px Bangers`; return ctx.measureText(s).width; }); ctx.letterSpacing = '0px';
  const tot = ws.reduce((a, v) => a + v, 0) + gap * (parts.length - 1), pw = tot + 120, ph = 168, k0 = easeBack(seg(lt, s1.s - .05, s1.s + .22));
  ctx.translate(cx, cy); ctx.scale(k0, k0);
  reg('overlay', [cx - pw / 2 * k0, cy - ph / 2 * k0, cx + pw / 2 * k0, cy + ph / 2 * k0], { id: 'calc', transit: k0 < 1.02 });
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10; ctx.fillStyle = 'rgba(8,14,34,.92)'; rr(-pw / 2, -ph / 2, pw, ph, 44); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#4cf0a0'; ctx.lineWidth = 5; rr(-pw / 2, -ph / 2, pw, ph, 44); ctx.stroke();
  text('OVERTIME', -pw / 2 + 62, -ph / 2 + 22, { size: 22, fill: '#8fa6cf', spacing: 5, align: 'left' });
  let x = -tot / 2;
  parts.forEach(([s, col, t0, sz], i) => {
    const k = easeBack(seg(lt, t0, t0 + .16)), cxp = x + ws[i] / 2; x += ws[i] + gap;
    if (k <= 0) return;
    ctx.save(); ctx.translate(cxp, 14); ctx.scale(k, k);
    text(s, 0, 0, { size: sz, font: 'Bangers', weight: 400, fill: col, spacing: 2, lw: i === 4 ? 0 : 0 });
    ctx.restore();
    if (i === 4) { const g = clamp(1 - (lt - t0) / .5); if (g > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(120,255,190,${.45 * g})`; rr(cxp - ws[i] / 2 - 18, -ph / 2 + 22, ws[i] + 36, ph - 44, 24); ctx.fill(); ctx.restore(); } }
  });
  if (lt >= tE) { const k = easeBack(seg(lt, tE, tE + .16)); text('/HR', pw / 2 - 62, ph / 2 - 30, { size: 30 * k, font: 'Bangers', weight: 400, fill: '#4cf0a0', spacing: 2 }); }
  ctx.restore();
}

window.__EP11_SCENES.exit = SC_EXIT;


// @@LOT

})();
