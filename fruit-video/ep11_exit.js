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
    ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); exteriorN11(o);
    const gp = open * 146;   // the glass dims the lot; where the leaves have parted the view is clear and bright
    for (const [a2, b2] of [[dx0, -gp], [gp, dx1]]) if (b2 > a2) poly([p2(a2, 0, ZB), p2(b2, 0, ZB), p2(b2, dy1, ZB), p2(a2, dy1, ZB)], 'rgba(12,18,44,.4)');
    if (open > .02) poly([p2(-gp, 0, ZB), p2(gp, 0, ZB), p2(gp, dy1, ZB), p2(-gp, dy1, ZB)], `rgba(206,228,255,${.6 * open})`);   // the gap is overexposed: the lot's lamps pour in
    ctx.restore(); }
  // the sliding doors: two glass leaves in aluminium frames with a frosted safety band and push bars; the fixed panels beside them stay put, the leaves slide in front of them
  const sh = open * 146;
  const leaf = (a, b, alpha, edge) => {
    onZ(ZB, a, b, 0, dy1, `rgba(190,215,240,${alpha})`, '#aab2c0', 7);
    onZ(ZB, a + 8, b - 8, 8, dy1 - 8, 'rgba(0,0,0,0)', 'rgba(20,26,42,.8)', 2);
    onZ(ZB, a + 8, b - 8, 214, 300, 'rgba(235,245,255,.34)');                                  // the frosted safety band
    for (let x = a + 18; x < b - 14; x += 22) onZ(ZB, x, x + 6, 226, 288, 'rgba(255,255,255,.22)');
    onZ(ZB, a + 8, b - 8, 8, 36, '#8a92a2');                                                   // the kick plate
    onZ(ZB, edge - 5, edge + 5, 150, 330, '#d3d8e0', '#222a38', 1.5);                         // the push bar on the meeting edge
  };
  for (const [a, b] of [[-300, -150], [150, 300]]) leaf(a, b, .1, a < 0 ? -156 : 156);
  for (const [a, b] of [[-150 - sh, -sh], [sh, 150 + sh]]) leaf(a, b, .15, a < 0 ? b - 4 : a + 4);
  // the header over the glass: the facility's sign
  onZ(ZB, dx0 - 26, dx1 + 26, dy1 + 26, dy1 + 84, '#1d2330', 'rgba(255,226,170,.5)', 2);
  { const [sx, sy] = p2(0, dy1 + 55, ZB); ctx.save(); ctx.shadowColor = 'rgba(255,214,140,.9)'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffe9b0'; ctx.font = `900 ${27 * k}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '2px'; ctx.fillText('FRUIT BOWL REHAB & NURSING', sx, sy); ctx.restore(); ctx.letterSpacing = '0px'; }
  if (!o.noClock) { const [cx, cy] = p2(0, 648, ZB); ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); bigClock(S0, o); ctx.restore(); }
  // the EXIT sign, right of the doors, and the lamp over it
  { const f = [p2(370, 440, ZB), p2(520, 440, ZB), p2(520, 500, ZB), p2(370, 500, ZB)]; poly(f, '#0c3a1c', 'rgba(10,8,20,.7)', 2);
    onZ(ZB, 376, 514, 446, 494, '#1fdc6a'); const [ex, ey] = p2(445, 470, ZB); text('EXIT', ex, ey + 1, { size: 36 * k, font: 'Bangers', weight: 400, fill: '#073a1a', spacing: 3 });
    V2.glow(ex, ey, 260 * k, '70,255,150', .5, 'screen', .8); }
  // the Administrator's door (shut here; officeDoor() swings it)
  officeDoor(o.officeOpen ?? 0); doorPuff(o.puff ?? -1);
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
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const Z = 1660 - i * 170; if (Z - P.cz < 420) continue; if (i && Z + 170 - P.cz > 420) rope11(s * 150, Z + 170, Z); stanchion11(s * 150, Z); }
  for (const z of [300, 900, 1500]) if (z + 150 > P.cz + 150) { ceilingLamp(-260, z, CH, z === 1500 ? .75 : .3, '255,236,200'); ceilingLamp(260, z, CH, z === 1500 ? .75 : .3, '255,236,200'); }
  // light: a cool spill from the glass across the floor, warm pools under the lamps
  const fa = p2(-300, 0, ZB), fb = p2(300, 0, ZB), fc = p2(560, 0, P.cz + 260), fd = p2(-560, 0, P.cz + 260);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, fa[1], 0, fc[1], [[0, `rgba(150,190,255,${.2 + .22 * open})`], [.6, `rgba(150,190,255,${.07 + .05 * open})`], [1, 'rgba(150,190,255,0)']]);
  ctx.beginPath(); ctx.moveTo(...fa); ctx.lineTo(...fb); ctx.lineTo(...fc); ctx.lineTo(...fd); ctx.closePath(); ctx.fill(); ctx.restore();
  for (const [X, Z] of [[260, 1500], [-260, 1500]]) if (Z > P.cz + 150) { const [gx, gy] = p2(X, 0, Z); V2.glow(gx, gy, 330 * kz(Z), '255,226,170', .1, 'screen', 0); }
  const [dxx, dyy] = p2(0, 240, ZB); V2.glow(dxx, dyy, 640 * k, '150,190,255', .16 + .16 * open, 'screen', .5);
  if (open > .02) { V2.beam(dxx, dyy, dxx, dyy + 720 * k, 560 * k, 1250 * k, '175,210,255', .28 * open); V2.glow(dxx, dyy, 1100 * k, '200,225,255', .4 * open, 'screen', 1.1); }
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
  const { x0, w, h } = OD, th = open * 1.5, xe = x0 + w * Math.cos(th), ze = ZB - w * Math.sin(th), k = kz(ZB);
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
    const [nx, ny] = p2(x0 + w / 2, 163, ZB); text('ADMINISTRATOR', nx, ny + 1, { size: 9.6 * k * 1.25, fill: '#3a2400', spacing: 0 });
    onZ(ZB, x0 + w - 30, x0 + w - 16, 140, 150, '#d8dce2');
  }
}
// a puff of plaster dust where the flung door meets the wall (age u in seconds, -1 = none)
function doorPuff(u) {
  if (u < 0 || u > .7) return;
  const k = kz(ZB), q = p2(OD.x0 - 8, 210, ZB);
  for (let i = 0; i < 9; i++) { const a = hash(i) * TAU, r = (30 + 90 * hash(i + 3)) * easeOut(u / .7) * k, x = q[0] + Math.cos(a) * r * 1.2, y = q[1] + Math.sin(a) * r * .8 - 40 * u * k, R = (26 + 34 * hash(i + 5)) * k * (.6 + u);
    ctx.fillStyle = V2.radial(x, y, 0, R, [[0, `rgba(235,226,214,${.5 * (1 - u / .7)})`], [1, 'rgba(235,226,214,0)']]); ctx.fillRect(x - R, y - R, 2 * R, 2 * R); }
}
// the banner from the party, still up eight hours later and one R short; it hangs by one nail and sags, two balloons have gone soft
function banner11(t) {
  const X0 = -568, X1 = -330, Yt = 585, Yb = 465, k = kz(ZB), sag = 34 + 4 * Math.sin(t * 1.3);
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
  for (const [bx, col, sq] of [[-540, '#ff4f6d', .8], [-496, '#4aa8ff', .7]]) {
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

// a gaze that jumps from one target to the next at the key times (a quick 0.1 s saccade each), keys [t, x, y]
const gaze = keys => lt => { let i = 0; while (i + 1 < keys.length && lt >= keys[i + 1][0]) i++; const a = keys[Math.max(0, i - 1)], b = keys[i], k = i ? ez(lt, b[0], b[0] + .1) : 1; return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; };

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
const XP = { door: [-540, 1736], lemon: [135, 1340], straw: [-115, 1330] };
const DELTA = { admin: [-290, -85], lemon: [265, 105] };   // where the Administrator and Lemon walk relative to Strawberry in the countdown
const WALK = () => ({ a: B('a1').e + .2, b: dingT() });     // Strawberry's walk: from just after the last GO to the ding
const STRAW_END = [-15, 1625];
SC_EXIT.sPath = lt => {
  const w = WALK(), out = B('out').s;
  return route([[0, -700, 1330], [1.0, XP.straw[0], XP.straw[1], 'out'], [w.a, XP.straw[0], XP.straw[1]], [w.b, STRAW_END[0], STRAW_END[1], 'io'], [out + .22, STRAW_END[0], STRAW_END[1]], [out + 1.12, 0, 1850, 'io']])(lt);
};
SC_EXIT.lPath = lt => {
  const w = WALK(), s = SC_EXIT.sPath(lt), k = ez(lt, w.a, w.b), p = route([[0, 145, 1352], [.95, XP.lemon[0], XP.lemon[1], 'out']])(lt);
  if (lt < w.a) return p;
  const side = ez(lt, dingT() + .05, dingT() + .5);   // after the ding she steps aside, out of the way of the doors
  return [lerp(lerp(XP.lemon[0], s[0] + DELTA.lemon[0], k), 205, side), lerp(XP.lemon[1], s[1] + DELTA.lemon[1], k)];
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

SC_EXIT.sGaze = lt => { const b = B, sev = wordT('s1', 'seventy', 5.7), a1 = b('a1'), od = a1.s - .45;
  return gaze([[0, .5, .02], [b('l1').s + 2.5, .0, .05], [b('s1').s - .1, 0, .04], [sev - .05, 0, -.55], [sev + .75, 0, .05], [od + .18, -.9, -.12], [a1.s + .15, -.75, 0], [a1.e + .1, 0, .03], [dingT() + .05, .3, -.05]])(lt); };
SC_EXIT.lGaze = lt => { const b = B, sev = wordT('s1', 'seventy', 5.7), a1 = b('a1'), od = a1.s - .45;
  return gaze([[0, -.4, .05], [b('l1').s - .1, -.55, .05], [b('s1').s - .05, -.5, .05], [sev + .3, -.7, .1], [od + .18, -.9, -.1], [a1.s + .1, -.5, 0], [WALK().a, -.75, .1]])(lt); };
SC_EXIT.shot = lt => {
  const b = B, dl = wordT('s1', 'dollars', 6.37), ord = [['wide', b('l1').s - .05], ['cuL', b('s1').s - .05], ['cuS', dl], ['cuLr', dl + .55], ['cuS', b('a1').s - .64], ['wideD', b('a1').s + .24], ['cuA', b('cd').s - .08], ['trk', b('out').s], ['out', 1e9]];
  return ord.find(([, e]) => lt < e)[0];
};
SC_EXIT.cast = lt => {
  const b = B, sh = SC_EXIT.shot(lt), a1 = b('a1'), ding = dingT(), w = WALK(), dl = wordT('s1', 'dollars', 6.4);
  const back = sh === 'out', inW = lt >= w.a && lt < ding + .1, sp = SC_EXIT.sPath(lt);
  const S = person(strawC, SC_EXIT.sPath, lt, { id: 'straw', stride: 46, transit: lt < .7, acc: back ? ['excoat11'] : ['steth', 'bandage7', 'perdiem9', 'excoat11'], coatBack: back, noFace: back,
    look: back ? [0, 0] : SC_EXIT.sGaze(lt),
    expr: lt >= ding && !back ? 'happy' : inW ? 'chill' : lt >= dl && lt < a1.s ? 'chill' : 'dead', lid: inW ? .22 : lt >= ding ? undefined : .1,
    arms: { l: 'rest', r: 'rest' }, hold: { r: 'exfob11' } });
  const penK = ez(lt, wordT('l1', 'five', 2.77), wordT('l1', 'minutes', 3.3)) * (1 - ez(lt, dl, dl + .3));   // she holds the pen out for the signature at 'five more minutes'
  const Lm = person(lemonC, SC_EXIT.lPath, lt, { id: 'lemon', stride: 46, look: SC_EXIT.lGaze(lt), rot: .035 * Math.sin(lt * 1.7) + (inB(lt, 'l1') ? .05 * seg(lt, wordT('l1', 'more', 3.0), wordT('l1', 'minutes', 3.3)) : 0),
    face: lt >= dl && lt < a1.s ? { raise: 10, wide: 1.12, pup: .78 } : undefined, lid: lt >= dl && lt < a1.s ? undefined : .12,
    arms: { l: 'hold', r: 'hold' }, hold: { l: 'pen9', r: 'clipboard6' }, grip: { l: [lerp(-104, -152, penK) - (lt >= dl ? 24 * ez(lt, dl + .1, dl + .5) : 0), lerp(14, -10, penK) + (lt >= dl ? 50 * ez(lt, dl + .1, dl + .5) : 0)], r: [92, 36] }, clipText: 'OT FORM' });
  const od = a1.s - .45, running = lt >= od && lt < w.a, Ad = (running ? runner : person)(melonC, SC_EXIT.aPath, lt, { id: 'melon', stride: 40, look: [.15, -.1], transit: lt >= od && lt < od + .45,
    expr: lt >= ding ? 'weak' : lt >= a1.s - .1 ? 'panic' : 'happy', acc: lt >= a1.s - .1 && lt < ding + .6 ? ['suit', 'nametag9', 'sweat'] : ['suit', 'nametag9'], sy: lt >= ding ? 1 - .07 * ez(lt, ding, ding + .5) : 1,
    arms: { l: 'wave', r: 'hold' }, hand: { l: 'wave', r: 'flat' }, grip: { r: [140, 48] } }, ...(running ? [300] : []));
  if (lt >= w.a - .3) {   // pit crew: the screen-right hand lands flat on her flank, the other arm throws the GO wave; after the ding he sags
    const gapPx = (S.x - Ad.x) / Ad.s, flank = gapPx - 112 * (S.s / Ad.s);
    Ad.grip = { r: [clamp(flank, 70, 170), 52 + 6 * Math.sin(lt * 9)] }; Ad.arms = { l: lt >= ding ? 'down' : 'wave', r: 'hold' }; Ad.rot = lt < ding ? .13 : 0;
  }
  return { S, L: Lm, Ad, sh };
};

SC_EXIT.cam = function (lt) {
  const sh = SC_EXIT.shot(lt), b = B, ding = dingT(), w = WALK(), a1 = b('a1');
  CAM.shake = 0;
  if (sh === 'trk') {   // a long lens dollying forward with them: the wall and its clock grow ahead, the carpet and stanchions stream past
    const sp = SC_EXIT.sPath(lt), ap = SC_EXIT.aPath(lt), lp = SC_EXIT.lPath(lt), k = seg(lt, w.a - .1, b('out').s);
    V2.setCam({ f: 2000, cz: lerp(-640, -170, easeIO(k) * .5 + k * .5), cx: (sp[0] + ap[0] + lp[0]) / 3, cy: 480, hy: 800 });
    zoomTo(540, 960, 1); CAM.r = .004 * Math.sin(lt * 1.9);
    if (lt >= ding && lt < ding + .35) CAM.shake = 8 * (1 - seg(lt, ding, ding + .35));
    return;
  }
  if (sh === 'out') {   // close behind her, low and long: the doorway fills the frame and she walks into it
    V2.setCam({ f: 900, cz: 1000, cx: 0, cy: 330, hy: 840 });
    zoomTo(540, 960, lerp(1, 1.05, seg(lt, b('out').s, CUR.dur)));
    return;
  }
  V2.setCam({ f: 1400, cy: 360, hy: 860 });
  const c = SC_EXIT.cast(lt);
  if (sh === 'wide') { const k = seg(lt, 0, b('l1').s); zoomTo(lerp(535, 520, k), 930, lerp(1.14, 1.2, k)); }
  else if (sh === 'wideD') zoomTo(430, 950, 1.08);
  else if (sh === 'cuL') camFace(c.L, lerp(1.7, 1.85, seg(lt, b('l1').s, b('s1').s)), 130, 0);
  else if (sh === 'cuLr') camFace(c.L, 1.95, 130, 0);
  else if (sh === 'cuS') camFace(c.S, lerp(1.55, 1.75, seg(lt, b('s1').s, b('s1').e)), 150, 0);
  else if (sh === 'cuA') {   // each GO punches the picture in a little
    const bump = t0 => { const u = lt - t0; return u >= 0 ? Math.exp(-u * 11) : 0; };
    camFace(c.Ad, lerp(1.62, 1.74, seg(lt, a1.s + .24, a1.e)) + .07 * (bump(wordT('a1', 'go', 7.78) + .33) + bump(a1.s + .65) + bump(a1.s + .33)), 125, 0);
    CAM.shake = 3 * (bump(a1.s + .33) + bump(a1.s + .65));
  }
};

SC_EXIT.draw = function (lt) {
  const b = B, c = SC_EXIT.cast(lt), sh = c.sh, S0 = storySec(lt), ta = tickAge(lt), ding = dingT(), cdS = b('cd').s;
  V2.setLight({ key: [-.35, -.8], keyColor: '#ffe3b8', keyA: .26, rim: '#8fb8ff', rimA: sh === 'trk' || sh === 'out' ? .6 : .5, shadow: '#0a1030', shadowA: .45, amb: '#9aa6e0', ambA: .1, bounce: '#ffcf99', bounceA: .2,
    back: sh === 'trk' || sh === 'out' ? { color: '150,200,255', a: sh === 'out' ? .5 : .32, w: 16 } : null, frontDark: sh === 'out' ? .4 : .12, shadowLong: sh === 'out' ? .5 : 0 });
  V2.opts.reflect = true;
  const pulse = Math.exp(-ta * 10), colon = lt < cdS ? (lt % 1 < .5 ? 1 : .12) : (ta < .24 ? 1 : .12), flash = lt >= ding ? Math.exp(-(lt - ding) * 6.5) : 0;
  const od = SC_EXIT.officeOpen(lt), gl = .2 + .26 * pulse + .6 * flash;
  const crisp = sh === 'trk' || sh === 'out' || sh === 'wide' || sh === 'wideD';
  const bg = (noClock) => lobbyN11({ t: lt + 2, puff: lt - (b('a1').s - .55 + .16), doorOpen: SC_EXIT.doorOpen(lt), officeOpen: od, S0, pulse, colon, flash, clockGlow: gl, noClock });
  const blurPx = sh === 'trk' ? 3.2 : sh === 'out' ? 3.6 : crisp ? 0 : 5.5;
  V2.dof(blurPx, () => bg(sh === 'trk' || sh === 'out'));
  const clockXY = p2(0, 648, ZB), kb = kz(ZB);
  if (sh === 'trk' || sh === 'out') { ctx.save(); ctx.translate(clockXY[0], clockXY[1]); ctx.scale(kb, kb); bigClock(S0, { pulse, colon, flash }); ctx.restore(); }
  // coloured light on the cast: the clock's red from above, the doors' cool white from behind, the desk lamp
  V2.addLight({ x: clockXY[0], y: clockXY[1], r: 1500, color: '255,60,50', a: .2 + .3 * pulse + .4 * flash });
  { const q = p2(0, 240, ZB); V2.addLight({ x: q[0], y: q[1], r: 1400, color: '150,190,255', a: .2 + .2 * SC_EXIT.doorOpen(lt) }); }
  { const q = p2(597, 280, 1360); V2.addLight({ x: q[0], y: q[1], r: 900, color: '255,200,130', a: .2 }); }
  const subj = { cuL: 'L', cuLr: 'L', cuS: 'S', cuA: 'Ad', out: 'SL' }[sh];
  const present = [['S', c.S], ['L', c.L]]; if (lt >= b('a1').s - .45) present.push(['Ad', c.Ad]);
  present.sort((p, q) => p[1].y - q[1].y);
  const sp = SC_EXIT.sPath(lt), through = sh === 'out' && sp[1] > ZB - 40;
  for (const [n, o] of present) {
    if (!subj || n === subj || (sh === 'out' && n !== 'Ad')) {
      if (n === 'S' && through) { ctx.save(); const f = [p2(-300, 0, ZB), p2(300, 0, ZB), p2(300, 470, ZB), p2(-300, 470, ZB)]; ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); drawChar(o); ctx.restore(); }
      else drawChar(o);
    } else nbr(o);
  }
  V2.dust(60, 560, 1020, 1500, lt, { n: 22, alpha: .22, color: '200,215,255', speed: sh === 'trk' ? 5 : 14 });
};

SC_EXIT.fx = lt => {
  const sh = SC_EXIT.shot(lt), ding = dingT(), fl = Math.max(lt >= ding ? .85 * Math.exp(-(lt - ding) * 6.5) : 0, .95 * ez(lt, B('out').s + 1.0, CUR.dur - .04)), fi = lt < .2 ? 1 - lt / .2 : 0;
  return { bloom: sh === 'trk' || sh === 'out' ? .8 : .6, vignette: .55, grain: .05, contrast: .18, sat: .1, tint: [['#3a54c8', .2, 'soft-light'], ['#0a1030', .1, 'multiply']],
    aberr: lt >= ding && lt < ding + .3 ? 6 : 0, fade: Math.max(fi, fl), fadeColor: fl > fi ? '255,240,236' : '0,0,10' };
};
SC_EXIT.blur = lt => { const sh = SC_EXIT.shot(lt), d = dingT(); return sh === 'trk' ? (lt > d - .05 && lt < d + .4 ? 3 : 2) : sh === 'wideD' ? 3 : 1; };
SC_EXIT.clock = lt => lt >= dingT() ? '11:00 PM' : '10:59 PM';
SC_EXIT.over = function (lt) {
  const b = B, ding = dingT();
  // a small TICK on every beat of the countdown
  for (const t0 of tickTimes().slice(0, 5)) sfxWord(lt, t0, 'TICK', 870, 360, { size: 74, hold: .2, fill: '#fff', rot: .06 });
  sfxWord(lt, ding, 'DING!', 640, 330, { size: 160, hold: .34, fill: '#ffe135', rot: -.06 });
  calc11(lt);
};
// the floating sum over Strawberry's head while she says the number: 1.5 x $118 = $177
function calc11(lt) {
  const s1 = B('s1'); if (lt < s1.s - .1 || lt > s1.e + .15) return;
  const tA = wordT('s1', 'overtime', s1.s) + .02, tB = wordT('s1', 'is', s1.s + .48), tC = wordT('s1', 'hundred', s1.s + .82), tD = wordT('s1', 'seventy', s1.s + 1.5), tE = wordT('s1', 'hour', s1.s + 2.8);
  const fadeOut = 1 - seg(lt, s1.e - .05, s1.e + .12), cx = 540, cy = 340, f = n => A9.money(n, false);
  const parts = [['1.5', '#ffd23a', tA, 104], ['×', '#e8eeff', tA + .12, 84], [f(118), '#9fd8ff', tB, 104], ['=', '#e8eeff', tC, 84], [f(177), '#4cf0a0', tD, 124], ['/HR', '#4cf0a0', tE, 44]];
  ctx.save(); ctx.globalAlpha *= fadeOut;
  ctx.font = '400 100px Bangers'; ctx.letterSpacing = '2px';
  const gap = 20, ws = parts.map(([s, , , sz]) => { ctx.font = `400 ${sz}px Bangers`; return ctx.measureText(s).width; }); ctx.letterSpacing = '0px';
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
    ctx.save(); ctx.translate(cxp, 14 + (i === 5 ? 34 : 0)); ctx.scale(k, k);
    text(s, 0, 0, { size: sz, font: 'Bangers', weight: 400, fill: col, spacing: 2, lw: i === 4 ? 0 : 0 });
    ctx.restore();
    if (i === 4) { const g = clamp(1 - (lt - t0) / .5); if (g > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(120,255,190,${.45 * g})`; rr(cxp - ws[i] / 2 - 18, -ph / 2 + 22, ws[i] + 36, ph - 44, 24); ctx.fill(); ctx.restore(); } }
  });
  ctx.restore();
}

window.__EP11_SCENES.exit = SC_EXIT;


// ============================================================================ lot: the chaos behind her (11:00 PM)
const SC_LOT = {};
// the facade stands in the plane Z = ZL, where one world unit is one pixel (f 2600, camera at Z 0): every X, Y below is in that plane (X right, Y up).
// Left to right on the ground floor: the lobby's glass wall (the stampede, and the wheelchair that leaves through it), the doors under the canopy, a few room windows; two floors up: the call-light windows
const ZL = 2600;
const FACADE = { h: 640,
  lobby: { x0: -420, x1: -110, y0: 40, y1: 262 },
  ent: { x0: -30, x1: 210, y1: 280 },
  upper: [-480, -250, -20, 210, 440, 670].map(X => ({ X, w: 150, y0: 385, y1: 545 })),
  low: [340, 570, 800].map(X => ({ X, w: 140, y0: 80, y1: 250 })),
  sign: { x0: -410, x1: 590, y0: 706, y1: 764 }, beacon: [120, 690], pa: [325, 600], klax: [-30, 346] };
const ENT_X = (FACADE.ent.x0 + FACADE.ent.x1) / 2;
const SIGN = 'FRUIT BOWL REHAB & NURSING';
const FX = (X, Y) => p2(X, Y, ZL);

// ---------------------------------------------------------------- timing of the montage (scene-local seconds)
const CHS = () => B('chaos').s;
const HIT = { call: () => CHS() + .1, klaxon: () => CHS() + .3, stampede: () => CHS() + .5, howl: () => CHS() + .9, peel: () => CHS() + 1.3, pa: () => CHS() + 1.6, crash: () => CHS() + 2.0, siren: () => CHS() + 2.2 };

// ---------------------------------------------------------------- Strawberry's walk: one relaxed pace along a gentle S from the doors to her car, never changing until she eases to a stop beside it
// (the path is a Catmull-Rom spline through the waypoints, measured once; the only input is the time)
const L_PTS = [[90, 2540], [305, 2375], [328, 2130], [560, 1950], [596, 1905]];
const LP = (() => {
  const P = [L_PTS[0], ...L_PTS, L_PTS[L_PTS.length - 1]], out = [L_PTS[0]], len = [0];
  for (let i = 1; i < P.length - 2; i++) for (let j = 1; j <= 24; j++) {
    const t = j / 24, [q0, q1, q2, q3] = [P[i - 1], P[i], P[i + 1], P[i + 2]], f = n => .5 * (2 * q1[n] + (-q0[n] + q2[n]) * t + (2 * q0[n] - 5 * q1[n] + 4 * q2[n] - q3[n]) * t * t + (-q0[n] + 3 * q1[n] - 3 * q2[n] + q3[n]) * t * t * t);
    const q = [f(0), f(1)], l = out[out.length - 1]; out.push(q); len.push(len[len.length - 1] + Math.hypot(q[0] - l[0], q[1] - l[1]));
  }
  return { out, len, total: len[len.length - 1] };
})();
const atDist = d => { d = clamp(d, 0, LP.total); let i = 1; while (i < LP.len.length - 1 && LP.len[i] < d) i++; const k = (d - LP.len[i - 1]) / ((LP.len[i] - LP.len[i - 1]) || 1); return [lerp(LP.out[i - 1][0], LP.out[i][0], k), lerp(LP.out[i - 1][1], LP.out[i][1], k)]; };
const L_SLOW = .8, lStop = () => B('mo2').e - .12;
const lSpeed = () => LP.total / (lStop() - L_SLOW + L_SLOW / 3);
SC_LOT.sDist = lt => { const stop = lStop(), t1 = stop - L_SLOW, v = lSpeed(); return lt < t1 ? v * lt : v * t1 + v * L_SLOW / 3 * easeOut(seg(lt, t1, stop)); };   // the ease-out starts at exactly her walking speed (3R / slow = v)
SC_LOT.sPath = lt => atDist(SC_LOT.sDist(lt));
// the camera is locked off through the montage (so every hit reads in place) and trucks right and back with her once it is over, bringing her car into the frame
const CAMA = { cx0: 120, cx1: 700, cz1: -300 };
const camK = lt => ez(lt, B('chaos').e - .1, B('mo2').e + .15);
const lotCam = lt => ({ f: 2600, cz: lerp(0, CAMA.cz1, camK(lt)), cx: lerp(CAMA.cx0, CAMA.cx1, camK(lt)), cy: 300, hy: 870 });

SC_LOT.shot = lt => {
  const b = B, c = b('chaos'), m1 = b('mo1'), s1 = b('s1'), l1 = b('l1'), s2 = b('s2'), m2 = b('mo2');
  const ord = [['wide', m1.s - .05], ['moonA', s1.s - .06], ['cuS', s1.e + .03], ['moonB', c.s + .1], ['chaos', l1.s - .05], ['lemon', s2.s - .05], ['cuS2', m2.s - .07], ['moonC', 1e9]];
  return ord.find(([, e]) => lt < e)[0];
};
SC_LOT.cam = function (lt) {
  const sh = SC_LOT.shot(lt), b = B;
  V2.setCam(lotCam(lt)); CAM.shake = 0;
  const c = SC_LOT.cast(lt);
  if (sh === 'wide' || sh === 'chaos' || sh === 'lemon') zoomTo(540, 960, 1);
  else if (sh === 'cuS' || sh === 'cuS2') camFace(c.S, lt < b('s2').s ? 1.85 : 1.9, 140, 0);
  else if (sh === 'moonA' || sh === 'moonB') { const z = sh === 'moonA' ? lerp(2.3, 2.45, seg(lt, b('mo1').s, b('mo1').e)) : lerp(2.5, 2.65, seg(lt, b('s1').e, b('chaos').s + .1)); zoomTo(MOON.x, MOON.y + 70 / z, z); }
  else if (sh === 'moonC') { const z0 = 2.3, kk = ez(lt, b('mo2').e - .05, b('mo2').e + .4), z = lerp(z0, 1, kk); zoomTo(lerp(MOON.x, 540, kk), lerp(MOON.y + 70 / z0, 960, kk), z); }
  else zoomTo(540, 960, 1);
};

// ---------------------------------------------------------------- the world
// the sky: night gradient, stars, a thin haze of cloud; the Moon is drawn as a character on top (see moon11)
function sky11(t) {
  const hy = V2.P.hy;
  ctx.fillStyle = V2.grad(0, -400, 0, 1100, [[0, '#03051a'], [.45, '#0f1a4c'], [.8, '#27387e'], [1, '#4b5c9e']]); ctx.fillRect(-400, -400, W + 800, 1700);
  A7.stars(t, 760, { n: 120, a: 1, seed: 21 });
  A7.clouds(t, 250, 600, { n: 4, tint: '90,100,170', belly: '30,36,90', a: .38, speed: 6, seed: 2, scale: 1.4 });
  // a dark treeline behind the roof, for depth
  ctx.fillStyle = '#0b0e26'; ctx.beginPath(); ctx.moveTo(-200, 900);
  for (let i = 0; i <= 28; i++) { const x = -200 + i * 55, h = 70 + 60 * hash(i + 4) + 30 * Math.sin(i * .7); ctx.lineTo(x, 640 - h * .6); ctx.lineTo(x + 27, 640 - h * .35); }
  ctx.lineTo(1300, 900); ctx.closePath(); ctx.fill();
}
const wallGrad = () => { const a = FX(0, 0), b = FX(0, FACADE.h); return V2.grad(0, b[1], 0, a[1], [[0, '#2e2c52'], [1, '#4a4872']]); };
// one window: recess, glass (lit warm, dark, or flashing a call-light colour), mullions, sill and a call-light dome over it
function win11(X, y0, y1, w, o = {}) {
  const x0 = X - w / 2, x1 = X + w / 2, k = kz(ZL), lit0 = o.lit ?? 1, fl = o.flash || 0, col = o.col || '255,70,70';
  onZ(ZL, x0 - 14, x1 + 14, y0 - 14, y1 + 14, '#17152b', 'rgba(8,6,16,.75)', 2.2);
  const f = [FX(x0, y0), FX(x1, y0), FX(x1, y1), FX(x0, y1)];
  const warm = lit0 > .5 ? (o.hue ?? 0) : 0;
  poly(f, lit0 > .5 ? V2.grad(0, f[2][1], 0, f[0][1], [[0, warm ? '#ffe9b4' : '#ffe2a0'], [1, warm ? '#ffcf86' : '#ffc872']]) : V2.grad(0, f[2][1], 0, f[0][1], [[0, '#1d1c3a'], [1, '#14132c']]));
  if (fl > 0) { ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); ctx.fillStyle = `rgba(${col},${.78 * fl})`; ctx.fillRect(f[0][0] - 4, f[2][1] - 4, f[1][0] - f[0][0] + 8, f[0][1] - f[2][1] + 8); ctx.restore(); }
  if ((o.dim ?? 1) < 1) { poly(f, `rgba(18,16,44,${(1 - o.dim) * .78})`); }
  if (o.paint) { ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); o.paint(f); ctx.restore(); }
  onZ(ZL, X - 3, X + 3, y0, y1, 'rgba(30,20,50,.55)'); onZ(ZL, x0, x1, (y0 + y1) / 2 - 3, (y0 + y1) / 2 + 3, 'rgba(30,20,50,.55)');
  onZ(ZL, x0 - 22, x1 + 22, y0 - 26, y0 - 10, '#8e88ac', 'rgba(8,6,16,.6)', 1.6);
  if (o.dome !== false) { const q = FX(X, y1 + 34), R = 17 * k; ctx.fillStyle = fl > 0 ? `rgba(${col},${.5 + .5 * fl})` : '#4a4668'; ctx.strokeStyle = 'rgba(8,6,16,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], R, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  const q = FX(X, (y0 + y1) / 2);
  if (lit0 > .5) V2.glow(q[0], q[1], 190 * k, '255,200,120', .2 * lit0, 'screen', .35);
  if (fl > 0) V2.glow(q[0], q[1], 250 * k, col, .5 * fl, 'screen', .9);
  if ((o.ring ?? -1) >= 0 && fl > 0) { const [dx, dy] = FX(X, y1 + 34); for (let i = 0; i < 2; i++) V2.ring(dx, dy, ringK(o.ring, i, 1.3, .5), { color: col, r0: 16 * k, r1: 110 * k, lw: 4, alpha: .55, bloom: .2 }); }
}
// the entrance: canopy, glass doors that slide apart (open 0..1), warm light inside
function entrance11(open) {
  const { x0, x1, y1 } = FACADE.ent, k = kz(ZL), cxE = ENT_X, hw = (x1 - x0) / 2;
  onZ(ZL, x0 - 20, x1 + 20, 0, y1 + 20, '#1a1830', 'rgba(8,6,16,.8)', 2.6);
  onZ(ZL, x0, x1, 0, y1, V2.grad(0, FX(0, y1)[1], 0, FX(0, 0)[1], [[0, '#ffd890'], [1, '#fff0c8']]));
  onZ(ZL, x0 + 24, x1 - 24, 120, 250, 'rgba(120,90,60,.3)');   // the lobby beyond: a reception shape
  const sh = open * hw * .5;
  for (const [a, b2] of [[x0 - sh, cxE - sh], [cxE + sh, x1 + sh]]) { const a2 = Math.max(x0, a), b3 = Math.min(x1, b2); if (b3 > a2) onZ(ZL, a2, b3, 0, y1, 'rgba(190,215,235,.32)', 'rgba(40,36,70,.85)', 3.6); }
  onZ(ZL, cxE - 4, cxE + 4, 0, y1, 'rgba(40,30,70,.6)');
  box3({ x0: x0 - 50, x1: x1 + 50, y0: 292, y1: 322, z0: ZL - 170, z1: ZL, color: '#2a2742', top: '#3c3858', side: '#201e36', lw: 1.6 });
  const [gx, gy] = FX(cxE, 120); V2.glow(gx, gy, 380 * k, '255,220,150', .5, 'screen', .8);
  // the lit pavement outside the doors
  const a = FX(x0, 0), b = FX(x1, 0), c = p2(x1 + 160, 0, ZL - 520), d = p2(x0 - 160, 0, ZL - 520);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, a[1], 0, c[1], [[0, 'rgba(255,214,140,.3)'], [1, 'rgba(255,214,140,0)']]); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath(); ctx.fill(); ctx.restore();
}
// the roof sign: FRUIT BOWL REHAB & NURSING on a dark board; each letter is placed on its own so the R's can pop off (see signLetters)
function signBoard11() {
  const { x0, x1, y0, y1 } = FACADE.sign, k = kz(ZL);
  for (const sx of [-380, 380]) onZ(ZL, sx - 12, sx + 12, 640, y0, '#2a2744');
  onZ(ZL, x0 - 30, x1 + 30, y0 - 12, y1 + 14, '#1b1832', 'rgba(255,226,170,.5)', 2.6);
  const [cx, cy] = FX(0, (y0 + y1) / 2); V2.glow(cx, cy, 760 * k, '255,214,140', .22, 'screen', .4);
}
const signX = i => lerp(FACADE.sign.x0, FACADE.sign.x1, (i + .5) / SIGN.length);
// a sign letter at index i, popped off at time t0 (Infinity: still on): it jumps, tumbles and falls to the ground in front of the building
function signLetter(i, lt, t0, o = {}) {
  const ch = SIGN[i]; if (ch === ' ') return;
  const { y0, y1 } = FACADE.sign, k = kz(ZL), yc = (y0 + y1) / 2; let size = (y1 - y0) * .8 * k * 1.3; if (lt >= t0) size *= 1 + 1.1 * easeOut(seg(lt - t0, 0, .6));
  let X = signX(i), Y = yc, rot = 0, a = 1;
  if (lt >= t0) {
    const u = lt - t0, vx = (hash(i * 3 + 1) - .4) * 520, vy = 520 + 260 * hash(i + 9);
    X += vx * u; Y = yc + vy * u - 1500 * u * u * .5; rot = u * (6 + 8 * hash(i)) * (hash(i + 5) > .5 ? 1 : -1);
    if (Y < 14) { Y = 14; a = 1 - seg(u, 1.4, 1.9); rot = Math.round(rot / PI) * PI; }
  }
  const [x, y] = FX(X, Y); ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `400 ${size}px Bangers`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = '1px';
  ctx.fillStyle = '#ffd890'; ctx.fillText(ch, 0, 0); ctx.restore(); ctx.letterSpacing = '0px';
}
// a hedge shrub: a lumpy dark-green bush with lit leaf tops
function shrub11(X, Z, w, h, seed = 0, o = {}) {
  const [x, y] = p2(X, 0, Z), k = kz(Z), W2 = w * k, H2 = h * k;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(4,6,18,.4)'; ell(0, 2, W2 * .62, H2 * .1); ctx.fill();
  const n = 7;
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
    const u = (i + .5) / n - .5, bx = u * W2 * .92, by = -H2 * (.42 + .22 * Math.cos(u * 3.1) + .1 * hash(i + seed)), r = H2 * (.36 + .1 * hash(i * 3 + seed));
    ctx.fillStyle = pass ? V2.grad(0, by - r, 0, by + r, [[0, '#2f6a45'], [1, '#17402c']]) : '#0c2418';
    ctx.beginPath(); ctx.arc(bx, by + (pass ? 0 : 3), r * (pass ? 1 : 1.06), 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(120,200,140,.2)'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = hash(i + seed) * W2 - W2 / 2, b = -H2 * (.5 + .4 * hash(i + 7 + seed)); ctx.beginPath(); ctx.arc(a * .9, b, 7 * k, PI * 1.1, PI * 1.8); ctx.stroke(); }
  ctx.restore();
}
// Strawberry's car, from Episode 7's lot (S7.car): the red-pink one, seen from behind. Hazards and the unlock chirp are added on top by carLights11
const CAR = { X: 960, Z: 1980, w: 165, len: 420 };
function carHers11(o = {}) {
  S7.car(CAR.X, CAR.Z, { color: '#d9304f', brake: 0, len: CAR.len, w: CAR.w, fog: { color: '#1a2040', amt: .08, zFar: 3000 }, glass: '#5b7ab0', glass2: '#202c58', shadowA: .42 });
}
// the amber hazard flashes at both tail-light corners and a wash of light on the asphalt behind the car
function carLights11(a) {
  if (a <= 0) return;
  const k = kz(CAR.Z - 14);
  for (const s of [-1, 1]) { const x = CAR.X + s * (CAR.w - 36), q = p2(x, 90, CAR.Z - 16); V2.glow(q[0], q[1], 150 * k, '255,170,40', .95 * a, 'screen', 1.1); onZ(CAR.Z - 14, x - 28, x + 28, 78, 102, `rgba(255,190,60,${.5 + .5 * a})`); }
  const g = p2(CAR.X, 0, CAR.Z - 160); V2.glow(g[0], g[1], 380 * k, '255,170,60', .25 * a, 'screen', .3);
}

// ---------------------------------------------------------------- the Moon: a face in the sky above the roof, with its own mood
const MOON = { x: 830, y: 270, s: .8 };
SC_LOT.moonState = lt => {
  const b = B, c = CHS(), mo1 = b('mo1'), mo2 = b('mo2'), sir = HIT.siren();
  let expr = 'neutral', look = [-.5, .5], lid = .1, sweat = false, bob = 0;
  if (lt >= b('s1').s - .1 && lt < c) { expr = 'shock'; look = [-.2, .6]; sweat = lt > b('s1').e + .08; }
  else if (lt >= c && lt < HIT.howl()) { expr = 'panic'; look = [-.7, .55]; sweat = true; }
  else if (lt >= HIT.howl() && lt < b('l1').s) { expr = lt < HIT.howl() + .7 ? 'shock' : 'panic'; look = lt < HIT.howl() + .9 ? [-.3, .2] : [-.7, .6]; sweat = true; }
  else if (lt >= b('l1').s && lt < mo2.s) { expr = 'happy'; look = [-.6, .55]; lid = .2; }
  else if (lt >= mo2.s) { expr = 'smug'; look = [-.55, .6]; lid = .3; bob = Math.sin((lt - mo2.s) * 7) * 5 * seg(lt, mo2.s, mo2.s + .1) * (1 - seg(lt, mo2.e, mo2.e + .3)); }
  return { expr, look, lid, sweat, bob };
};
function moon11(lt, suppress) {
  const m = SC_LOT.moonState(lt);
  A7.moon(MOON.x, MOON.y + m.bob, MOON.s, { t: lt, haloA: .75, suppress, char: { expr: m.expr, look: m.look, lid: m.lid, acc: m.sweat ? ['sweat'] : [] } });
}

// ---------------------------------------------------------------- the stampede: dark cut-out residents crossing the lit lobby glass (feet at the origin, facing +x, about 100 units tall)
const SIL = '#150e24';
function limb11(x0, y0, x1, y1, w) { ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function silLegs(ph, hipY, amp = 22, w = 8) {
  for (const s of [0, PI]) { const fx = -4 + Math.sin(ph + s) * amp, fy = -Math.max(0, Math.cos(ph + s)) * 10; limb11(0, hipY, fx * .5 + 2, hipY * .45 + fy * .5, w); limb11(fx * .5 + 2, hipY * .45 + fy * .5, fx, fy, w); }
}
function silhouette11(kind, ph) {
  ctx.fillStyle = SIL; ctx.strokeStyle = SIL; ctx.lineJoin = 'round';
  if (kind === 'walker' || kind === 'curlers') {   // a hunched resident pushing a walker
    silLegs(ph * 1.3, -26, 12, 8);
    ctx.save(); ctx.rotate(.28); ell(2, -52, 16, 27); ctx.fill(); ctx.restore();
    ell(18, -86, 12, 12.5); ctx.fill();
    limb11(10, -66, 42, -72, 7);
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(36, -74); ctx.lineTo(36, -4); ctx.moveTo(64, -74); ctx.lineTo(64, -4); ctx.moveTo(32, -74); ctx.lineTo(68, -74); ctx.stroke();
    ell(36, -4, 5, 5); ctx.fill(); ell(64, -4, 5, 5); ctx.fill();
    if (kind === 'curlers') { for (let i = 0; i < 4; i++) { rr(8 + i * 7, -108 + Math.abs(i - 1.5) * 3, 6, 12, 3); ctx.fill(); } ctx.save(); ctx.translate(66, -50 + 4 * Math.sin(ph * 2)); rr(-2, 0, 18, 15, 3); ctx.fill(); limb11(4, 0, 6, -12, 2); ctx.restore(); }
  } else if (kind === 'chair') {   // a resident in a wheelchair, pumping the wheels
    ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -32, 30, 0, TAU); ctx.stroke(); ell(0, -32, 4, 4); ctx.fill();
    ctx.lineWidth = 2.4; for (let i = 0; i < 6; i++) { const a = ph * 2 + i / 6 * PI; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 28, -32 + Math.sin(a) * 28); ctx.lineTo(-Math.cos(a) * 28, -32 - Math.sin(a) * 28); ctx.stroke(); }
    rr(-18, -52, 62, 10, 4); ctx.fill(); limb11(-16, -50, -22, -98, 6); limb11(-22, -98, -34, -92, 5); ell(46, -9, 9, 9); ctx.fill(); limb11(46, -20, 56, -12, 5); ell(58, -9, 13, 6); ctx.fill();
    ctx.save(); ctx.rotate(.18); ell(4, -76, 14, 24); ctx.fill(); ctx.restore(); ell(14, -108, 12, 12.5); ctx.fill();
    limb11(6, -86, 14 + 8 * Math.sin(ph * 2), -64, 6); limb11(0, -84, -6 + 8 * Math.sin(ph * 2 + 1), -62, 6);
  } else {   // a resident at a flat-out run, arms in the air, hospital gown streaming; 'iv' drags a pole
    silLegs(ph * 1.6, -26, 26, 8);
    ctx.beginPath(); ctx.moveTo(-10, -70); ctx.lineTo(-44 - 6 * Math.sin(ph * 2), -36); ctx.lineTo(-12, -34); ctx.closePath(); ctx.fill();
    ell(0, -56, 15, 28); ctx.fill(); ell(4, -94, 13, 13.5); ctx.fill();
    limb11(-6, -76, -24, -112 + 6 * Math.sin(ph * 1.6), 7); limb11(8, -76, 26, -108 - 6 * Math.sin(ph * 1.6), 7);
    if (kind === 'iv') { limb11(30, -150, 30, -2, 3.4); limb11(16, -2, 44, -2, 4); ell(18, 0, 4, 4); ctx.fill(); ell(42, 0, 4, 4); ctx.fill(); rr(22, -166, 16, 24, 6); ctx.fill(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, -142); ctx.quadraticCurveTo(34, -110, 26, -108); ctx.stroke(); }
  }
}
const CROWD = ['walker', 'chair', 'run', 'iv', 'curlers', 'chair', 'run', 'walker', 'iv', 'run', 'chair', 'curlers', 'run', 'walker', 'iv', 'chair'];
// the crowd inside the lobby window, bursting right to left; the caller clips to the glass so they stay behind it
function stampede11(lt) {
  const w = FACADE.lobby, t0 = HIT.stampede(), k = kz(ZL);
  CROWD.forEach((kind, i) => {
    const ti = t0 + i * .098 + .05 * hash(i + 2), u = lt - ti; if (u < 0) return;
    const v = 520 + 330 * hash(i + 8), X = w.x1 + 90 - v * u; if (X < w.x0 - 120) return;
    const g = (1.25 + .28 * hash(i + 4)) * k, [x, y] = FX(X, w.y0 + 8 + 12 * (i % 3));
    ctx.save(); ctx.translate(x, y); ctx.scale(-g, g); silhouette11(kind, u * (11 + 5 * hash(i)) + i); ctx.restore();
  });
}
// ---------------------------------------------------------------- the wheelchair (side view) that goes through the glass
function wheelchair11(spin) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const tire = (cx, cy, r, w) => { ctx.strokeStyle = '#17141f'; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#a8b0be'; ctx.lineWidth = w * .34; ctx.beginPath(); ctx.arc(cx, cy, r - w * .12, 0, TAU); ctx.stroke(); };
  for (const [lw, col] of [[11, INK], [6, '#c3cad6']]) { ctx.strokeStyle = col; limb11(-34, -86, -34, -22, lw); limb11(-34, -22, 36, -22, lw); limb11(36, -22, 56, 22, lw); limb11(-34, -86, -52, -96, lw); }
  ctx.fillStyle = '#3a4a78'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-38, -34, 84, 16, 6); ctx.fill(); ctx.stroke(); rr(-44, -92, 16, 62, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(-40, -88, 5, 50, 3); ctx.fill();
  // a blanket over the seat, flapping behind the chair
  ctx.fillStyle = '#d96b4a'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, -36); ctx.quadraticCurveTo(10, -58 + 8 * Math.sin(spin * 3), 50, -34); ctx.quadraticCurveTo(70, -20 + 10 * Math.sin(spin * 3 + 1), 80, 14 * Math.sin(spin * 3)); ctx.lineTo(44, -18); ctx.lineTo(-30, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,200,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 20, -34); ctx.lineTo(-14 + i * 24, -18); ctx.stroke(); }
  ctx.fillStyle = '#d6dae2'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(46, 20, 34, 9, 4); ctx.fill(); ctx.stroke();
  tire(0, -22, 46, 11); ctx.strokeStyle = '#7a8394'; for (let i = 0; i < 12; i++) { const a = spin + i / 12 * TAU; limb11(Math.cos(a) * 8, -22 + Math.sin(a) * 8, Math.cos(a) * 40, -22 + Math.sin(a) * 40, 2.6); }
  ctx.fillStyle = '#e6ebf2'; ell(0, -22, 9, 9); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  tire(58, 28, 15, 7);
  ctx.restore();
}
// ---------------------------------------------------------------- the crash: glass bursts out of the lobby window, the wheelchair follows and lands in the hedge
const CRASH = { X0: -300, Y0: 130, vx: 118, vy: 760, g: 1750 };
const crashU = lt => lt - HIT.crash() - .03;
const chairPos = u => [CRASH.X0 + CRASH.vx * u, CRASH.Y0 + CRASH.vy * u - CRASH.g * u * u / 2];
const chairLand = () => (CRASH.vy + Math.sqrt(CRASH.vy * CRASH.vy + 2 * CRASH.g * (CRASH.Y0 - 28))) / CRASH.g;   // time of flight until the wheels meet the hedge (Y 28)
function glassShards11(lt) {
  const t0 = HIT.crash(); if (lt < t0 || lt > t0 + 1.3) return;
  const u = lt - t0, w = FACADE.lobby, k = kz(ZL);
  for (let i = 0; i < 34; i++) {
    const a = hash(i * 3 + 1) * TAU, sp = 160 + 520 * hash(i + 7), vx = Math.cos(a) * sp * .8 + (hash(i + 3) - .3) * 120, vy = Math.sin(a) * sp * .55 + 260;
    const X = (w.x0 + w.x1) / 2 + (hash(i + 11) - .5) * 220 + vx * u, Y = (w.y0 + w.y1) / 2 + (hash(i + 17) - .5) * 160 + vy * u - 1500 * u * u / 2, [x, y] = FX(X, Math.max(18, Y));
    const rot = u * (6 + 10 * hash(i)) * (hash(i + 5) > .5 ? 1 : -1), s = (10 + 22 * hash(i + 13)) * k, al = 1 - seg(u, .7, 1.25);
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = `rgba(${200 + 40 * hash(i) | 0},${230 + 20 * hash(i + 1) | 0},255,${.45 + .3 * hash(i + 2)})`; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-s, s * .4); ctx.lineTo(s * .2, -s); ctx.lineTo(s * .9, s * .5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    if (hash(i + 21) > .72) glint(x, y, 14 * k * (1 - seg(u, 0, .6)) + 3, (1 - seg(u, .1, .6)) * al);
  }
}
// the empty frame afterwards: jagged teeth of glass around the edge
function brokenGlass11(lt) {
  if (lt < HIT.crash()) return;
  const w = FACADE.lobby;
  ctx.fillStyle = 'rgba(230,244,255,.9)'; ctx.strokeStyle = 'rgba(20,16,40,.7)'; ctx.lineWidth = 1.6;
  const tooth = (x0, y0, x1, y1, len, n, seed) => { for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + .8) / n, ax = lerp(x0, x1, u0), ay = lerp(y0, y1, u0), bx = lerp(x0, x1, u1), by = lerp(y0, y1, u1), nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1, h = len * (.35 + .65 * hash(i + seed));
    const pa = FX(ax, ay), pb = FX(bx, by), pc = FX((ax + bx) / 2 + nx / L * h, (ay + by) / 2 + ny / L * h); ctx.beginPath(); ctx.moveTo(...pa); ctx.lineTo(...pc); ctx.lineTo(...pb); ctx.closePath(); ctx.fill(); ctx.stroke(); } };
  tooth(w.x0, w.y1, w.x1, w.y1, -42, 10, 1); tooth(w.x0, w.y0, w.x1, w.y0, 36, 10, 5); tooth(w.x0, w.y0, w.x0, w.y1, -34, 6, 9); tooth(w.x1, w.y0, w.x1, w.y1, 34, 6, 13);
}
function chair11(lt) {
  const u = crashU(lt); if (u < 0) return;
  const uL = chairLand(), k = kz(ZL), uu = Math.min(u, uL), [X, Y] = chairPos(uu), rot = uL * -7.2 * Math.min(1, uu / uL) + (u > uL ? Math.sin(u * 14) * .06 * Math.exp(-(u - uL) * 5) : 0);
  const grow = 1 + .22 * Math.min(1, uu / uL), [x, y] = FX(X, Y);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k * grow * .84, k * grow * .84); wheelchair11(uu * 22); ctx.restore();
}
// the hedge shrub the chair lands in: it takes the hit (a squash that rings out) and throws leaves
function landBush11(lt) {
  const t0 = HIT.crash() + .03 + chairLand(), u = lt - t0, X = chairPos(chairLand())[0], Z = ZL - 128;
  const sq = u > 0 ? Math.exp(-u * 5) * Math.sin(u * 26) * .09 : 0, [bx, by] = p2(X, 0, Z);
  ctx.save(); ctx.translate(bx, by); ctx.scale(1 - sq * .6, 1 + sq); ctx.translate(-bx, -by);
  shrub11(X, Z, 250, 118, 77);
  ctx.restore();
  if (u > 0 && u < .9) for (let i = 0; i < 18; i++) {
    const a = -PI / 2 + (hash(i) - .5) * 2.4, sp = 220 + 380 * hash(i + 4), x = bx + Math.cos(a) * sp * u * .8 + (hash(i + 9) - .5) * 40, y = by - 40 + Math.sin(a) * sp * u + 1400 * u * u / 2;
    ctx.save(); ctx.globalAlpha *= 1 - seg(u, .5, .9); ctx.translate(x, y); ctx.rotate(u * (8 + 10 * hash(i + 2)) * (i % 2 ? 1 : -1)); ctx.fillStyle = ['#3f9a52', '#2f7a42', '#5cba68'][i % 3]; ctx.strokeStyle = '#123a22'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(8, -2, 0, 11); ctx.quadraticCurveTo(-8, -2, 0, -11); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}

// ---------------------------------------------------------------- the banana peel and the Administrator's slip at the doors
const SLIP = { X: 70, Z: ZL - 55 }, ADM_S = .66;   // he is at the building's plane: door-sized, not Strawberry-sized
const slipT = () => HIT.peel();
SC_LOT.adminAt = lt => {   // [X, Z, lift, rot, state] for the Administrator: bursting out, the slip, the thud, lying still
  const t0 = slipT(), run0 = t0 - .5, u = lt - t0, air = .62;
  if (lt < run0) return null;
  if (u < 0) { const k = seg(lt, run0, t0); return [lerp(ENT_X, SLIP.X - 10, k), lerp(ZL - 20, SLIP.Z, k), 0, 0, 'run']; }
  const k = clamp(u / air), lift = u < air ? 175 * Math.sin(PI * k) : 0, rot = u < air ? -(3 * PI) * easeOut(k) : -PI;
  return [SLIP.X - 10 + 34 * easeOut(k), SLIP.Z - 14 * easeOut(k), lift, rot, u < air ? 'air' : 'down'];
};
function adminDraw11(lt) {
  const a = SC_LOT.adminAt(lt); if (!a) return;
  const [X, Z, lift0, rot, st] = a, q = V2.at(X, Z), t0 = slipT(), u = lt - t0, air = .62; q.s *= ADM_S;
  const lift = lift0 * ADM_S - (st === 'down' ? 83 * q.s : st === 'air' ? 83 * q.s * easeIn(seg(u, air - .25, air)) : 0);   // lying on his back, the round body's centre sits lower than when he stands
  const land = st === 'down' ? Math.exp(-(u - air) * 7) : 0;
  const o = melonC(Object.assign(q, { id: 'melon', who: null, rot, lift, expr: st === 'run' ? 'panic' : st === 'air' ? 'shock' : 'dead', lid: st === 'down' ? .95 : undefined, arms: st === 'run' ? { l: 'up', r: 'up' } : st === 'air' ? { l: 'flail', r: 'flail' } : { l: 'rest', r: 'rest' },
    legs: st !== 'run' ? 'kick' : undefined, gait: undefined, sy: 1 - .16 * land, sx: 1 + .1 * land, plant: false, transit: true, acc: ['suit', 'nametag9'] }));
  if (st === 'run') { o.gaitW = lt * 520; o.axis = 'z'; o.dir = -1; }
  drawBg(o);
  if (st === 'down') {   // little stars circling over the dizzy head
    const [hx, hy] = [q.x + 60 * q.s, q.y - 150 * q.s];
    for (let i = 0; i < 4; i++) { const a2 = u * 5 + i * TAU / 4; ctx.save(); ctx.translate(hx + Math.cos(a2) * 46 * q.s, hy - 40 * q.s + Math.sin(a2) * 14 * q.s); ctx.rotate(a2); A9.starPath(0, 0, 13 * q.s); ctx.fillStyle = '#ffe135'; ctx.fill(); ctx.strokeStyle = '#a07800'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
  }
}
// the peel: it drops in before the Administrator comes through the doors, is kicked into the air by his foot, and lands on his chest
function peel11(lt) {
  const t0 = slipT(), drop = t0 - .62, u = lt - t0, [x, y] = p2(SLIP.X, 0, SLIP.Z), k = kz(SLIP.Z);
  if (lt < drop) return;
  if (u < 0) { A7.peelFloor(x, y, k * 1.15, easeOut(seg(lt, drop, drop + .22))); return; }
  const up = clamp(u / .85), px = x + 40 * k * up + 60 * k * Math.sin(up * 2), py = y - 190 * Math.sin(PI * up * .9) * k - 10 * k * up;
  ctx.save(); ctx.translate(px, py); ctx.rotate(Math.min(u, .85) * 9); ctx.scale(k * .55, k * .55);
  for (const [ang, len, w] of [[.3, 70, 34], [2.45, 62, 32], [-1.95, 58, 30]]) { ctx.save(); ctx.rotate(ang); ctx.fillStyle = '#ffdc3a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.quadraticCurveTo(len * .5, -w * .66, len, -w * .12); ctx.quadraticCurveTo(len + 14, 0, len, w * .12); ctx.quadraticCurveTo(len * .5, w * .66, 0, w / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}

// ---------------------------------------------------------------- the klaxon on the canopy, the PA horn on the wall, the rooftop siren, the wolf at the window
function klaxon11(lt) {
  const t0 = HIT.klaxon(), [kx, ky] = FACADE.klax, [x, y] = FX(kx, ky), k = kz(ZL); if (lt < t0) return;
  const on = Math.sin((lt - t0) * 21) > -.2 ? 1 : .25, u = lt - t0;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#3a3a48'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-26, -4, 52, 14, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = `rgba(255,${50 + 40 * on | 0},${50},${.6 + .4 * on})`; ctx.beginPath(); ctx.arc(0, -4, 24, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(0, -4, 24, PI, TAU); ctx.closePath(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.7)'; const a = u * 14; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(Math.cos(a) * 40, -4 - Math.abs(Math.sin(a)) * 40); ctx.lineTo(Math.cos(a + .6) * 40, -4 - Math.abs(Math.sin(a + .6)) * 40); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.restore();
  V2.glow(x, y - 6 * k, 340 * k, '255,60,50', .7 * on, 'screen', 1);
  for (let i = 0; i < 3; i++) V2.ring(x, y - 10 * k, ringK(u, i, 1.6, .33), { color: '255,120,100', r0: 30 * k, r1: 280 * k, lw: 7, alpha: .5, bloom: .3 });
}
function pa11(lt) {
  const t0 = HIT.pa(), [px, py] = FACADE.pa, [x, y] = FX(px, py), k = kz(ZL), u = lt - t0;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#3a3a48'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-14, -52, 28, 40, 4); ctx.fill(); ctx.stroke();   // bracket
  const pulse = lt >= t0 ? 1 + .06 * Math.sin(u * 36) * Math.exp(-u * 2.5) : 1;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = V2.grad(-30, -30, 30, 30, [[0, '#d2d6de'], [1, '#6a7080']]); ctx.beginPath(); ctx.arc(0, 0, 32, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#23252e'; ctx.beginPath(); ctx.arc(0, 0, 21, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a90a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
  ctx.restore();
  if (lt >= t0 && lt < t0 + 1.2) for (let i = 0; i < 3; i++) V2.ring(x, y, ringK(u, i, 1.5, .3), { color: '255,244,210', r0: 34 * k, r1: 230 * k, lw: 8, alpha: .65, bloom: .3 });
}
function beacon11(lt) {
  const t0 = HIT.siren(), [bx, by] = FACADE.beacon, [x, y] = FX(bx, by), k = kz(ZL), on = lt >= t0, u = lt - t0;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = '#2a2a38'; ctx.strokeStyle = INK; ctx.lineWidth = 3; rr(-60, 8, 120, 16, 4); ctx.fill(); ctx.stroke();
  if (on) { const ph = Math.sin(u * 16) > 0; for (const [sx, col, litc] of [[-1, '#ff2a3a', ph], [1, '#2a6aff', !ph]]) { ctx.fillStyle = litc ? col : (sx < 0 ? '#5a1018' : '#10245a'); ctx.beginPath(); ctx.roundRect(sx < 0 ? -56 : 4, -22, 52, 30, 8); ctx.fill(); ctx.stroke(); } }
  else { ctx.fillStyle = '#4a3a3a'; rr(-56, -22, 52, 30, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a3250'; rr(4, -22, 52, 30, 8); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  if (!on) return;
  const ph = Math.sin(u * 16) > 0, rgb = ph ? '255,50,70' : '60,120,255', side = ph ? -1 : 1;
  V2.glow(x + side * 30 * k, y - 8 * k, 480 * k, rgb, .6, 'screen', 1);
  // the swept beam across the lot, and a wash on the facade
  const sw = Math.sin(u * 8), len = 900 * Math.abs(sw) + 200;
  V2.beam(x + side * 30 * k, y - 8 * k, x + side * 30 * k + Math.sign(sw || 1) * len * 1.1, y + 360 * k, 60 * k, 380 * k, rgb, .3);
}
// the wolf: Mr. Goji (Episode 7), napkin ears and all, howling at the Moon from an upper window
const HOWL_WIN = 1;
function wolf11(lt) {
  const t0 = HIT.howl(), u = lt - t0; if (u < 0 || u > 1.75) return;
  const w = FACADE.upper[HOWL_WIN], k = kz(ZL), rise = easeBack(seg(u, 0, .16)) * (1 - ez(u, 1.45, 1.75));
  const open = [[0, 0], [.06, .5], [.3, 1], [.95, 1], [1.12, .45], [1.22, .9], [1.45, .6], [1.75, 0]].reduce((v, p, i, a) => i && u >= a[i - 1][0] && u < p[0] ? lerp(a[i - 1][1], p[1], (u - a[i - 1][0]) / (p[0] - a[i - 1][0])) : v, 0);
  const [x, y] = FX(w.X, w.y0 + 6 - (1 - rise) * 120);
  const o = A7.goji({ x, y, s: .56 * k, id: 'goji', who: null, colors: ['#3a2640', '#1c1226', '#0c0814'], acc: ['wolfears'], expr: 'shock', rot: -.26 + .03 * Math.sin(u * 9), look: [-.8, -.6], lid: 0, arms: { l: 'up', r: 'up' }, hand: { l: 'wave', r: 'wave' }, talk: open, mouthState: { open, spread: .05, teeth: 0 }, transit: true });
  ctx.save(); const f = [FX(w.X - w.w / 2, w.y0), FX(w.X + w.w / 2, w.y0), FX(w.X + w.w / 2, w.y1), FX(w.X - w.w / 2, w.y1)]; ctx.beginPath(); f.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.clip();
  drawBg(o); ctx.restore();
  const [mx, my] = FX(w.X + 6, w.y0 + 80);
  for (let i = 0; i < 4; i++) V2.ring(mx, my, ringK(u, i, 1.0, .25), { color: '200,220,255', r0: 20 * k, r1: 190 * k, lw: 6, alpha: .6, bloom: .2 });
}

const ringK = (u, i, rate, gap) => { const a = u * rate - i * gap; return a < 0 ? 0 : a % 1; };
// ---------------------------------------------------------------- fire, kept gentle: small cartoon flames at a few windows and along the roof, smoke drifting right, embers
const FIRE = [[-265, 70, 1.0, 6.05], [440, 400, 1.05, 6.55], [670, 400, 1.1, 6.8], [380, 676, .9, 6.35], [560, 676, 1.0, 6.9], [690, 676, .8, 7.3], [570, 150, .95, 7.1], [800, 150, .85, 7.7], [-480, 400, .8, 7.4], [100, 676, .8, 7.9], [210, 400, .9, 7.6]];
function flame11(x, y, w, h, t, seed, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= clamp(a * 1.6); ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const ox = (i - 1) * w * .3, fh = h * (.68 + .32 * Math.sin(t * (7 + i * 2.3) + seed + i * 1.7)) * (i === 1 ? 1.15 : .8), sway = Math.sin(t * (4.5 + i) + seed * 2 + i) * w * .14;
    for (const [sc, col] of [[1, '#ff4d17'], [.72, '#ff9f1c'], [.42, '#ffe08a']]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ox - w * .27 * sc, 0); ctx.bezierCurveTo(ox - w * .32 * sc, -fh * .5 * sc, ox + sway - w * .07, -fh * .7 * sc, ox + sway, -fh * sc);
      ctx.bezierCurveTo(ox + sway + w * .09, -fh * .68, ox + w * .34 * sc, -fh * .42 * sc, ox + w * .27 * sc, 0); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
  V2.glow(x, y - h * .4, h * 2.4, '255,140,50', .55 * a, 'screen', .9);
}
function fire11(lt) {
  const k = kz(ZL);
  FIRE.forEach(([X, Y, s, t0], i) => {
    const g = easeOut(seg(lt, t0, t0 + .9)); if (g <= 0) return;
    const [x, y] = FX(X, Y);
    V2.smoke(x, y - 20 * k, lt, t0, { n: 11, rate: 2.6, life: 3.4, rise: 280 * k, spread: 80 * k, size: 44 * k, alpha: .3 * g, color: '60,56,76', seed: 5 + i });
    flame11(x, y, 70 * s * k * g, 150 * s * k * g, lt, i * 2.3, g);
  });
  if (lt > FIRE[0][3]) V2.dust(FX(-300, 760)[0], FX(0, 760)[1], FX(900, 760)[0], FX(0, 560)[1], lt, { n: 22, color: '255,170,70', alpha: .85, size: 3.2, speed: 70, seed: 4 });
}
// fireflies and a cricket or two before the Q-word (0 to 3.3 s)
function fireflies11(lt) {
  const a = 1 - seg(lt, B('s1').s + .1, B('s1').e + .02); if (a <= 0) return;
  const [x0, y0] = FX(-700, 90), [x1] = FX(1100, 0);
  V2.dust(x0, y0 - 40, x1, y0 + 150, lt, { n: 16, color: '210,255,140', alpha: .9 * a, size: 3.6, speed: 5, seed: 8 });
}

// ---------------------------------------------------------------- the facade, drawn as one layer so the whole building can shake
SC_LOT.shake = lt => {
  const h = HIT, imp = (t0, a, d) => lt >= t0 ? a * Math.exp(-(lt - t0) / d) : 0;
  const rumble = seg(lt, h.stampede(), h.stampede() + .3) * (1 - seg(lt, h.stampede() + 1.0, h.stampede() + 1.6)) * 3.2;
  const late = seg(lt, h.siren(), h.siren() + .5) * 1.6;
  return rumble + late + imp(h.call(), 2, .08) + imp(h.klaxon(), 3, .1) + imp(h.howl(), 4, .1) + imp(h.peel() + .62, 5, .12) + imp(h.pa(), 3.5, .1) + imp(h.crash(), 16, .3) + imp(h.crash() + .35, 6, .12);
};
const RPOP = () => ({ 1: HIT.stampede() + .45, 11: HIT.pa() - .1, 21: HIT.crash() + .3 });   // the three R's come off the sign (the missing R, again)
const powerFk = (lt, i) => lt >= HIT.stampede() && lt < HIT.siren() + .6 ? (hash(Math.floor(lt * 13) + i * 3) > .3 ? 1 : .3) : 1;
function building11(lt) {
  const f = FACADE, k = kz(ZL), h = HIT, amp = SC_LOT.shake(lt), [bx, by] = FX(0, 0);
  ctx.save();
  if (amp > 0) { ctx.translate(bx, by); ctx.rotate(amp * .0006 * vnoise(lt * 23 + 3)); ctx.translate(amp * vnoise(lt * 31) - bx, amp * .7 * vnoise(lt * 37 + 9) - by); }
  onZ(ZL, -2300, 2300, 0, f.h, wallGrad());
  ctx.strokeStyle = 'rgba(10,8,30,.16)'; ctx.lineWidth = Math.max(1, 2 * k);
  for (let y = 60; y < f.h; y += 46) { const a = FX(-2300, y), b = FX(2300, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  onZ(ZL, -2300, 2300, 0, 38, '#3a3860', 'rgba(8,6,16,.5)', 2);
  onZ(ZL, -2300, 2300, 322, 340, '#5a5680', 'rgba(8,6,16,.5)', 2);
  onZ(ZL, -2300, 2300, 624, 676, '#252342', 'rgba(8,6,16,.6)', 2.4);
  onZ(ZL, -2300, 2300, 676, 690, '#3a3760');
  for (const X of [-565, -135, 335, 905, -1000, 1200]) onZ(ZL, X - 18, X + 18, 38, 624, 'rgba(255,255,255,.05)');
  const called = lt >= h.call();
  f.upper.forEach((w, i) => win11(w.X, w.y0, w.y1, w.w, { lit: hash(i * 5 + 3) > .2 ? 1 : 0, dim: powerFk(lt, i), flash: called ? (Math.sin(lt * 15 + i * 1.9) > -.1 ? 1 : .1) : 0, col: ['255,60,60', '255,190,50', '255,255,255', '255,60,60', '255,170,40', '255,60,60'][i], ring: called ? lt - h.call() : -1 }));
  f.low.forEach((w, i) => win11(w.X, w.y0, w.y1, w.w, { lit: hash(i * 9 + 1) > .3 ? 1 : 0, dim: powerFk(lt, i + 7), flash: called ? (Math.sin(lt * 13 + i * 2.3) > -.1 ? 1 : .1) : 0, col: ['255,190,50', '255,60,60', '255,255,255'][i], ring: called ? lt - h.call() : -1 }));
  lobbyWindow11(lt);
  wolf11(lt);
  entrance11(SC_LOT.doorOpen(lt));
  signBoard11(); const rp = RPOP();
  ctx.save(); ctx.globalAlpha *= .62 + .38 * powerFk(lt, 20); for (let i = 0; i < SIGN.length; i++) signLetter(i, lt, rp[i] ?? Infinity); ctx.restore();
  pa11(lt); klaxon11(lt); beacon11(lt);
  chair11(lt); glassShards11(lt);
  fire11(lt);
  // colour washes over the whole facade: the klaxon's red, the siren's red and blue
  { const top = FX(0, 780)[1], bot = FX(0, 0)[1];
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    if (lt >= h.klaxon()) { const on = Math.sin((lt - h.klaxon()) * 21) > -.2 ? 1 : 0; ctx.fillStyle = `rgba(255,30,30,${.07 * on})`; ctx.fillRect(-300, top, W + 600, bot - top); }
    if (lt >= h.siren()) { const ph = Math.sin((lt - h.siren()) * 16) > 0; ctx.fillStyle = ph ? 'rgba(255,40,70,.06)' : 'rgba(50,110,255,.07)'; ctx.fillRect(-300, top, W + 600, bot - top); }
    ctx.restore(); }
  ctx.restore();
}
SC_LOT.doorOpen = lt => {
  const t0 = slipT() - .5, l = B('l1').s - .22, adm = slipT();
  if (lt < .3) return 1;
  if (lt < t0 - .15) return 1 - eo(lt, .3, .9);
  if (lt < adm + .9) return eo(lt, t0 - .15, t0 + .05) * (1 - eo(lt, adm + .45, adm + .9));
  return lt < l ? 0 : eo(lt, l, l + .12);
};
function lobbyWindow11(lt) {
  const w = FACADE.lobby, k = kz(ZL), crash = lt >= HIT.crash();
  onZ(ZL, w.x0 - 18, w.x1 + 18, w.y0 - 18, w.y1 + 18, '#17152b', 'rgba(8,6,16,.8)', 2.6);
  const f = [FX(w.x0, w.y0), FX(w.x1, w.y0), FX(w.x1, w.y1), FX(w.x0, w.y1)];
  poly(f, V2.grad(0, f[2][1], 0, f[0][1], [[0, '#ffe9b4'], [1, '#ffcf86']]));
  ctx.save(); ctx.beginPath(); f.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  // the room: a skirting line, a reception desk and a fern, before the crowd bursts through it
  onZ(ZL, w.x0, w.x1, w.y0, w.y0 + 22, 'rgba(120,84,50,.5)'); onZ(ZL, w.x0 + 190, w.x1 - 10, w.y0 + 22, w.y0 + 78, 'rgba(120,84,50,.5)');
  { const q = FX(w.x0 + 60, w.y0 + 22); ctx.fillStyle = 'rgba(70,110,60,.55)'; for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-.9 + i * .3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10 * k, -50 * k, 0, -88 * k); ctx.quadraticCurveTo(-10 * k, -50 * k, 0, 0); ctx.fill(); ctx.restore(); } }
  stampede11(lt);
  if (lt >= FIRE[0][3]) { const g = easeOut(seg(lt, FIRE[0][3], FIRE[0][3] + .9)), q = FX((w.x0 + w.x1) / 2 + 20, w.y0 + 14); flame11(q[0], q[1], 150 * k * g, 130 * k * g, lt, 3.1, g); ctx.fillStyle = `rgba(255,120,40,${.22 * g})`; ctx.fillRect(f[0][0], f[2][1], f[1][0] - f[0][0], f[0][1] - f[2][1]); }
  if (!crash) { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(f[0][0] + 40 * k, f[0][1]); ctx.lineTo(f[0][0] + 110 * k, f[0][1]); ctx.lineTo(f[3][0] + 190 * k, f[3][1]); ctx.lineTo(f[3][0] + 120 * k, f[3][1]); ctx.closePath(); ctx.fill(); }
  else if (lt < HIT.crash() + .14) { ctx.fillStyle = `rgba(255,255,255,${.85 * (1 - (lt - HIT.crash()) / .14)})`; ctx.fillRect(f[0][0], f[2][1], f[1][0] - f[0][0], f[0][1] - f[2][1]); }
  ctx.restore();
  if (!crash) for (const X of [(w.x0 + w.x1) / 2 - 52, (w.x0 + w.x1) / 2 + 52]) onZ(ZL, X - 3, X + 3, w.y0, w.y1, 'rgba(30,20,50,.5)');
  onZ(ZL, w.x0 - 26, w.x1 + 26, w.y0 - 30, w.y0 - 12, '#8e88ac', 'rgba(8,6,16,.6)', 1.6);
  brokenGlass11(lt);
  const q = FX((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2); V2.glow(q[0], q[1], 330 * k, '255,200,120', .3, 'screen', .5);
}
SC_LOT.lemonAt = lt => route([[B('l1').s - .22, ENT_X + 30, ZL - 18], [B('l1').s + 1.2, 215, 2285, 'out']])(lt);
SC_LOT.cast = lt => {
  const b = B, sh = SC_LOT.shot(lt), s1 = b('s1'), m2 = b('mo2'), fobT = m2.e - .05, l0 = b('l1').s - .22;
  const reach = ez(lt, fobT - .35, fobT - .1), press = lt >= fobT ? Math.max(0, 1 - (lt - fobT) / .3) : 0;
  const S = person(strawC, SC_LOT.sPath, lt, { id: 'straw', stride: 44, acc: ['steth', 'bandage7', 'perdiem9', 'excoat11'],
    look: inB(lt, 's1') ? [0, .06] : lt >= fobT - .3 ? [.75, .05] : [-.1, .04], expr: lt >= s1.s - .2 && lt < s1.e + .6 ? 'chill' : lt >= b('l1').s ? 'smug' : 'chill', lid: .3,
    arms: { l: 'rest', r: reach > 0 ? 'hold' : [.03, .06] }, hold: { r: 'exfob11' }, grip: reach > 0 ? { r: [lerp(118, 176, reach), lerp(78, 26, reach)] } : undefined, fobA: press, transit: lt >= m2.s });
  let Lm = null;
  if (lt >= l0) {
    const run = lt < l0 + 1.25, hop = 80 * Math.sin(PI * seg(lt, l0 + .08, l0 + .46)) / lerp(.66, 1, ez(lt, l0, l0 + 1.25));
    Lm = (run ? runner : person)(lemonC, SC_LOT.lemonAt, lt, { id: 'lemon', stride: 40, lift: hop, rot: run ? .1 * Math.sin(lt * 14) : .04 * Math.sin(lt * 7), look: [.6, .1], expr: 'panic', lid: undefined,
      arms: { l: 'flail', r: 'up' }, hold: { r: 'clipboard6' }, clipText: 'OT FORM', transit: lt < l0 + .5 }, ...(run ? [330] : []));
    Lm.s *= lerp(.66, 1, ez(lt, l0, l0 + 1.25)); Lm.lift = (Lm.lift || 0) * Lm.s;   // door-sized at the doors, her real size by the time she reaches us
  }
  return { S, L: Lm, sh };
};
SC_LOT.draw = function (lt) {
  const b = B, c = SC_LOT.cast(lt), sh = c.sh, k = kz(ZL), h = HIT;
  V2.setLight({ key: [-.35, -.8], keyColor: '#cfe0ff', keyA: .24, rim: '#9fc4ff', rimA: .55, shadow: '#080a28', shadowA: .5, amb: '#8a94d8', ambA: .12, bounce: '#ffcf99', bounceA: .18 });
  V2.opts.reflect = true;
  const moonCU = sh === 'moonA' || sh === 'moonB' || sh === 'moonC', cuS = sh === 'cuS' || sh === 'cuS2';
  const fobT = b('mo2').e - .05, hz = [[fobT, fobT + .15], [fobT + .3, fobT + .45]].some(([a, e]) => lt >= a && lt < e) ? 1 : 0;
  const ground = () => {
    const sw = [p2(-2600, 0, ZL), p2(2600, 0, ZL), p2(2600, 0, ZL - 300), p2(-2600, 0, ZL - 300)];
    poly(sw, V2.grad(0, sw[0][1], 0, sw[3][1], [[0, '#3c3e66'], [1, '#2c2e52']]));
    const yb = p2(0, 0, ZL - 300)[1]; ctx.fillStyle = V2.grad(0, yb - 2, 0, H + 400, [[0, '#25274a'], [.5, '#171833'], [1, '#0d0e22']]); ctx.fillRect(-400, yb - 2, W + 800, H + 800 - yb);
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineCap = 'butt';
    for (const x of [-200, 100, 400, CAR.X - CAR.w - 24, CAR.X + CAR.w + 24, 1300]) { const a = p2(x, 0, 1700), b2 = p2(x, 0, 2420); ctx.lineWidth = Math.max(2, 9 * kz(1900)); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b2); ctx.stroke(); }
    peel11(lt); adminDraw11(lt);
    for (let X = -900; X <= 1300; X += 170) if ((X < FACADE.ent.x0 - 110 || X > FACADE.ent.x1 + 110) && !(X > -330 && X < -60)) shrub11(X, ZL - 120, 190, X > 200 ? 100 : 70, X);
    landBush11(lt);
    S6.lampPost(-640, 2200, { h: 620, on: .8 }); S6.lampPost(1080, 2300, { h: 620, on: .8 });
    carHers11(); carLights11(hz);
    fireflies11(lt);
  };
  if (moonCU) {
    sky11(lt + 3); moon11(lt, false);
    const k0 = sh === 'moonC' ? 1 - ez(lt, b('mo2').e - .05, b('mo2').e + .4) : 1;
    V2.dof(8 * k0, () => { building11(lt); ground(); });
    if (sh === 'moonC') drawChar(c.S);
  } else if (cuS) { V2.dof(7, () => { sky11(lt + 3); moon11(lt, true); building11(lt); ground(); if (c.L) drawBg(c.L); }); drawChar(c.S); }
  else { sky11(lt + 3); moon11(lt, true); building11(lt); ground(); if (c.L) drawChar(c.L); drawChar(c.S); }
  // coloured light on the cast: the siren's red and blue, the fire's orange from behind, the lamp
  if (lt >= h.siren()) { const ph = Math.sin((lt - h.siren()) * 16) > 0, q = FX(...FACADE.beacon); V2.addLight({ x: q[0], y: q[1], r: 1700, color: ph ? '255,50,70' : '60,120,255', a: .45 }); }
  if (lt >= FIRE[1][3]) { const q = FX(450, 500); V2.addLight({ x: q[0], y: q[1], r: 1500, color: '255,140,60', a: .3 * seg(lt, FIRE[1][3], FIRE[1][3] + 1.2) }); }
  V2.addLight({ x: 700, y: 900, r: 1000, color: '255,226,170', a: .16 });
};
SC_LOT.fx = lt => {
  const fi = lt < .2 ? 1 - lt / .2 : 0, fo = seg(lt, CUR.dur - .35, CUR.dur - .02), ch = lt >= HIT.call() && lt < B('chaos').e ? 1 : 0;
  return { bloom: .75, vignette: .55, grain: .05, contrast: .18, sat: .12, tint: [['#3a54c8', .16, 'soft-light'], ['#0a1030', .08, 'multiply']], aberr: lt > HIT.crash() && lt < HIT.crash() + .3 ? 5 : 0, fade: Math.max(fi, fo), fadeColor: '0,0,10' };
};
SC_LOT.blur = lt => (lt > HIT.crash() - .05 && lt < HIT.crash() + 1.2) ? 2 : 1;
SC_LOT.clock = () => '11:00 PM';
// the comic words, each on the frame of its sound cue, spread over the facade so they never stack
SC_LOT.over = function (lt) {
  if (SC_LOT.shot(lt) !== 'chaos') return;
  const h = HIT, w = (t0, str, x, y, o) => sfxWord(lt, t0, str, x, y, o);
  w(h.call(), 'BRRRING!', 300, 330, { size: 92, fill: '#ff6a5e', hold: .34, rot: -.08 });
  w(h.klaxon(), 'WHOOP!', 540, 300, { size: 100, fill: '#ffe135', hold: .3, rot: .07 });
  w(h.stampede(), 'RUMBLE', 220, 1296, { size: 90, fill: '#fff', hold: .75, rot: -.04 });
  w(h.howl(), 'AWOOOO!', 270, 290, { size: 108, fill: '#cfe0ff', hold: .5, rot: -.09 });
  w(h.peel(), 'WHOOPS!', 560, 1296, { size: 92, fill: '#ffe135', hold: .5, rot: .08 });
  w(h.pa(), 'DING-DONG', 480, 340, { size: 76, fill: '#bfe3ff', hold: .38, rot: .05 });
  w(h.crash(), 'CRASH!', 250, 1196, { size: 132, fill: '#ff6a5e', hold: .6, rot: -.06 });
  w(h.siren(), 'WEE-OO!', 520, 320, { size: 96, fill: '#9fc4ff', hold: .65, rot: .05 });
};

window.__EP11_SCENES.lot = SC_LOT;

})();
