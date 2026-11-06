'use strict';
/* SHIFT HAPPENS, Episode 21: "The Inspection". Builder E21-MEDPASS. Scene `medpass` (5:30 PM, THE OBSERVATION, 27.257 s). Registers window.__EP21_SCENES.medpass.
 *
 * THE SPLIT SCREEN. One frame, two worlds, the same nurse at the same moment: the same room (Room 3, Mr. Pear's) seen by the same lens twice. LEFT, WITH THE STATE: the perfect med pass Ms. Kale watches from
 * the doorway (soft clean light, every step by the book). RIGHT, A NORMAL NIGHT: the same pass on any other evening (call lights in the hall, cups everywhere, the cart rolling off by itself, Mr. Pear
 * escaping). Each half is its own draw function with its own 2D camera and clip (drawHalf('L' | 'R', ...)), composed by H21.split (the kit) or, until it lands, by a stand-in of the same signature.
 *
 * THE ROOM (world units, X right, Y up, Z away from the lens; one perspective camera PC for both worlds): back wall at Z 1800 (half width 470, ceiling 760). In the back wall, left to right: the doorway to
 * the hall (X -450..-250; the hall runs straight away from it, doors and call-light domes on both sides), the ROOM 3 plaque, the wall clock above the nurse, the window above the bed. The bed is end-on, its head
 * against the wall (X 70..350); Mr. Pear sits up at its head. The med cart is parked at the left side of the bed; the nurse stands left of the cart; Ms. Kale stands in the doorway (left world only).
 *
 * SHOTS (scene-local seconds, snapped to frames; both halves cut together; the table is SH below)
 *   open  0.00-1.60  one picture of the room (the same lens for both worlds), the divider wipes down from the top (splitwipe .50): above its front the right half is a normal night; the chips pop in
 *   ka1   1.60-3.98  L two-shot Kale (doorway) and Strawberry: "Please proceed as you normally would." | R the cart: she loads cups at triple speed, the hall's call lights blink behind
 *   s1    3.98-5.20  L Strawberry, serene: "I always do this." | R the same framing: she sprints through it with the cart, leaves flying
 *   hyg   5.20-6.85  L the pump on the cart: two careful pumps (sanitizer 5.40, 6.10), hands rubbed between | R she juggles three med cups (cupclatter 5.60)
 *   s2    6.85-8.55  L at Mr. Pear's bedside, polite: "What is your name and date of birth?" | R she shouts it down the hall from the doorway
 *   pe1   8.55-10.01 L Mr. Pear, patient: "The same as yesterday." | R he shouts it back from the bed
 *   ka4   10.01-11.93 L Kale: "Do you always lock the cart?" | R the cart, unattended, drawers open
 *   s7    11.93-12.75 L "Always." she locks it (the click) | R the same framing: the cart rolls away by itself (cartroll 12.23)
 *   ka5   12.75-14.94 L Kale writes: "And explain every medication?" | R down the hall: the cart rolling away, Strawberry running after it
 *   s8    14.94-15.77 L "Always." she holds up one pill, Mr. Pear nods | R she tips a whole cup of pills into his mouth (cupclatter 15.24)
 *   ka2   15.77-17.86 L Kale: "How long does your med pass take?" | R the hall: every call light lit, Strawberry zigzagging between doors
 *   s3    17.86-18.71 L the clock above her, ticking: "Two hours." | R the same clock, its hands spinning
 *   ka3   18.71-19.91 L Kale: "And today?" | R Strawberry slumped over the cart
 *   s4    19.91-20.70 L "Six." the divider slides right (the left side gets the room: still on Room 3) | R squeezed: a sliver of the chaos
 *   pe2   20.70-22.39 L Mr. Pear whispers, eyeing Kale: "Who is that?" "The State." | R he knots the bedsheet into a cape
 *   pe3   22.39-24.14 L "Should I behave?" "Please." | R he stands on the bed, caped
 *   pe4   24.14-25.61 L hands folded, a tiny halo: "I always behave." | R he climbs out of the window in the cape
 *   end   25.61-27.26 L the calm room, Kale's smallest smile (sting 25.71) | R the cape's tail leaves the window, Strawberry arrives too late
 *
 * KITS: A21 (ep21_art.js: Ms. Kale) and H21 (ep21_hud.js: the split) are called when they exist; a stand-in of the same shape is drawn until then (checked at DRAW time). */
(() => {
if (!window.TIMELINE_EP21 || !window.H6 || !window.V2 || !window.S6 || !window.A7 || !window.A11 || !window.UI) return;
const { faceC } = window.H6;
const S6 = window.S6, A7 = window.A7, A11 = window.A11;
const PI = Math.PI;

// ------------------------------------------------------------------ small helpers (the models: ep20_night.js, ep18_station.js)
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const bump = (t, a, b) => { const k = sg(t, a, b); return Math.sin(PI * k); };          /* 0 -> 1 -> 0 over [a, b] */
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixa = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const scrOf = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
const has = (ns, n) => window[ns] && typeof window[ns][n] === 'function';

// ------------------------------------------------------------------ the clock of the scene: beats, words and cues (scene-local seconds; shot starts snapped to the renderer's frames)
const TLX = window.TIMELINE_EP21;
const SCN = TLX.scenes.find(s => s.id === 'medpass'), START = SCN.start, LN = {};
for (const l of TLX.lines) if (l.scene === 'medpass') LN[l.id] = l;
const bS = b => SCN.beats[b].s, bE = b => SCN.beats[b].e;
const wS = (b, i) => LN[b].s - START + LN[b].words[i][1], wE = (b, i) => LN[b].s - START + LN[b].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const DUR = SCN.dur;
/* the sound cues of the scene (script_ep21.json: beat start + offset), snapped to the frame they sound on */
const CUE = {
  splitwipe: snapT(bS('open') + .3), san1: snapT(bS('hygiene') + .2), san2: snapT(bS('hygiene') + .9), clat1: snapT(bS('hygiene') + .4),
  cartroll: snapT(bS('s7') + .3), clat2: snapT(bS('s8') + .3), sting: snapT(bS('end') + .1),
};
/* the beat of a line spoken right now (for lip-sync choices) */
const lineNow = lt => { for (const id in LN) { const l = LN[id], a = l.s - START, b = l.e - START; if (lt >= a && lt < b) return id; } return null; };

// ------------------------------------------------------------------ the room (world units) and the lens: one perspective camera for both worlds; each half frames it with its own 2D camera
const PC = { f: 1400, cy: 380, hy: 760, cz: 0, cx: 0 };
const RM = { zb: 1800, hw: 560, ch: 760 };
const DOOR = { x0: -450, x1: -250, y1: 540 };                        /* the doorway in the back wall (the hall runs away from it) */
const HALL = { x0: -560, x1: -140, ch: 640, z1: 3900 };               /* the hall beyond the doorway */
const WIN = { x0: 140, x1: 440, y0: 290, y1: 640 };                   /* the window above the bed */
const CLK = { X: -150, Y: 640, r: 50 };                               /* the wall clock (above the nurse) */
const PLQ = { x0: -238, x1: -120, y0: 400, y1: 470 };                 /* the ROOM 3 plaque beside the doorway */
const BED = { x0: 110, x1: 390, z0: 1180, z1: 1790, top: 150 };        /* the bed, end-on: the head at the back wall */
const CART = { X: 60, Z: 1470, w: 184 };                              /* the med cart, parked at the left side of the bed */
const POS = { straw: [-155, 1540], pear: [250, 1660], kale: [-372, 1790] };
const kzP = Z => PC.f / (Z - PC.cz);
const P2 = (X, Y, Z) => V2.p2(X, Y, Z);

// ------------------------------------------------------------------ the split (the divider's place in time) and the two halves' screen regions
const GAP = 14;                                                       /* the divider band's width */
const DIV = lt => {                                                   /* the divider's x: the middle, squeezed right for "Six." (s4) and back before Mr. Pear's whisper */
  const a = snapT(bS('s4')) + .04, b = snapT(bS('pe2'));
  return 540 + 220 * ss(lt, a, a + .3) * (1 - ss(lt, b - .3, b - .02));
};
const WIPE = { a: snapT(.28), b: snapT(.66) };                        /* the band falls from the top between these (the whoosh peaks at .50) */
const wipeY = lt => H * easeIO(sg(lt, WIPE.a, WIPE.b));              /* the front of the falling band (screen y) */
function regions(lt) {                                                /* the screen boxes of the two halves [x0, y0, x1, y1] */
  const x = DIV(lt);
  return { L: [0, 0, x - GAP / 2, H], R: [x + GAP / 2, 0, W, H], x };
}

// ------------------------------------------------------------------ THE SET: Room 3 (both worlds share it; `side` 'L' | 'R' changes only what is lit and what is out of place)
const INK = 'rgba(25,16,30,.62)', INKD = 'rgba(25,16,30,.85)';
const PAL = { wall: '#e9e3d3', wain: '#88afa4', floorA: '#d8cfbb', floorB: '#b3a88f', ceil: '#f3f1ea', fog: '#cfc6b3' };
const quadPath = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
const wallQuad = (X0, Y0, X1, Y1, Z = RM.zb) => [P2(X0, Y0, Z), P2(X1, Y0, Z), P2(X1, Y1, Z), P2(X0, Y1, Z)];
/* the call-light domes of the hall: which are lit (0..1) on each side. Slow soft pulses (0.55 Hz, never a hard blink): photosensitivity-safe */
const HDOORS = [2080, 2480, 2880, 3280, 3680];
function domeLvl(i, lt, side) {
  if (side === 'L') return i === 3 ? .18 : 0;                                         /* with the State in the building, nobody presses a call light */
  const n = 2 + Math.floor(3 * ss(lt, 14.5, 16.5)) + (lt > 16.6 ? 1 : 0);           /* on a normal night more come on as the pass goes (ka2: all of them) */
  const order = [1, 3, 0, 4, 2], rank = order.indexOf(i);
  if (rank >= n && !(lt > 16.6)) return 0;
  return .62 + .38 * Math.sin(lt * 3.45 + i * 1.9);
}
/* the hall beyond the doorway: floor, the left wall with doors and domes, ceiling lamps, the far wall; kids() draws what is in the hall (the cart, a running nurse), inside the same clip */
function hallView(lt, side, kids) {
  const zb = RM.zb, H_ = HALL, q = wallQuad(DOOR.x0, 0, DOOR.x1, DOOR.y1);
  ctx.save(); quadPath(q); ctx.clip();
  ctx.fillStyle = '#d4dae4'; ctx.fillRect(-400, -400, W + 800, H + 800);
  const fogC = side === 'L' ? [214, 222, 232] : [200, 214, 222], fz = z => .55 * Math.pow(c01((z - zb) / (H_.z1 - zb)), .9);
  const fogc = (c, z) => hex(mixa(V2.rgb(c), fogC, fz(z)));
  V2.poly([P2(H_.x0, 0, zb), P2(H_.x1, 0, zb), P2(H_.x1, 0, H_.z1), P2(H_.x0, 0, H_.z1)], V2.grad(0, P2(0, 0, zb)[1], 0, P2(0, 0, H_.z1)[1], [[0, '#b9c1cf'], [1, fogc('#a4adbd', H_.z1)]]));
  V2.poly([P2(H_.x0, H_.ch, zb), P2(H_.x1, H_.ch, zb), P2(H_.x1, H_.ch, H_.z1), P2(H_.x0, H_.ch, H_.z1)], V2.grad(0, P2(0, H_.ch, zb)[1], 0, P2(0, H_.ch, H_.z1)[1], [[0, '#f2f2ee'], [1, fogc('#e4e4e0', H_.z1)]]));
  V2.poly(wallQuad(H_.x0, 0, H_.x1, H_.ch, H_.z1), fogc('#e2e6ee', H_.z1));
  /* floor tiles running away, a sheen down the middle */
  ctx.strokeStyle = 'rgba(60,64,80,.12)'; ctx.lineWidth = 1.4;
  for (let z = zb + 120; z < H_.z1; z += 160) { const a = P2(H_.x0, 0, z), b = P2(H_.x1, 0, z); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  { const a = P2(-350, 0, zb), b = P2(-350, 0, H_.z1); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 30 * kzP(zb); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  /* the left wall: wall above the rail, wainscot below, the handrail */
  const XL = H_.x0, wq = (y0, y1, z0, z1, fill, st, lw) => V2.poly([P2(XL, y0, z0), P2(XL, y1, z0), P2(XL, y1, z1), P2(XL, y0, z1)], fill, st, lw);
  wq(110, H_.ch, zb, H_.z1, V2.grad(P2(XL, 300, zb)[0], 0, P2(XL, 300, H_.z1)[0], 0, [[0, '#eef0f4'], [1, fogc('#e0e4ec', H_.z1)]]));
  wq(0, 110, zb, H_.z1, V2.grad(P2(XL, 50, zb)[0], 0, P2(XL, 50, H_.z1)[0], 0, [[0, '#5f8f96'], [1, fogc('#5f8f96', H_.z1)]]));
  wq(104, 118, zb, H_.z1, '#b98a5a');
  ctx.strokeStyle = 'rgba(120,90,60,.6)'; ctx.lineWidth = 3; { const a = P2(XL + 14, 175, zb), b = P2(XL + 14, 175, H_.z1); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); }
  /* doors and their domes, far to near */
  for (let i = HDOORS.length - 1; i >= 0; i--) {
    const z = HDOORS[i], c = ['#c9a06a', '#9fb7d6', '#c9a06a', '#a6c7a0', '#c9a06a'][i];
    wq(0, 452, z - 88, z + 88, fogc('#f1ead8', z), 'rgba(25,18,30,.45)', 1.4);
    wq(0, 436, z - 76, z + 76, fogc(c, z), 'rgba(25,18,30,.5)', 1.6);
    const lv = domeLvl(i, lt, side), [dx, dy] = P2(XL, 500, z), k = kzP(z);
    wq(472, 528, z - 46, z + 46, lv > .02 ? hex(mixa([236, 232, 226], [255, 92, 84], c01(lv))) : fogc('#dcdfe4', z), 'rgba(30,24,40,.55)', 1.4);
    if (lv > .02) V2.glow(dx, dy, 260 * k, '255,96,84', .55 * lv, 'screen', .5);
  }
  /* ceiling lamps */
  for (const z of [2200, 2700, 3200, 3700]) { const a = [P2(-420, H_.ch - 2, z), P2(-280, H_.ch - 2, z), P2(-280, H_.ch - 2, z + 110), P2(-420, H_.ch - 2, z + 110)]; V2.poly(a, '#fbfaf2', 'rgba(110,110,125,.4)', 1.2); }
  if (kids) kids();
  ctx.restore();
}
/* the sky in the window at 5:30 PM in November: dusk blue over a band of orange, the roofline across the street, two lit windows, a streetlamp; o.open (0..1) raises the lower sash */
function windowView(lt, side, o = {}) {
  const q = wallQuad(WIN.x0, WIN.y0, WIN.x1, WIN.y1), [x0, y1] = q[0], [x1, y0] = q[2], w = x1 - x0, h = y1 - y0;
  ctx.save(); quadPath(q); ctx.clip();
  ctx.fillStyle = V2.grad(0, y0, 0, y1, [[0, '#26326a'], [.45, '#46589a'], [.78, '#c0789a'], [1, '#f2a06a']]); ctx.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  ctx.fillStyle = 'rgba(255,240,220,.85)'; for (let i = 0; i < 7; i++) { const sx = x0 + w * sr(i, 3), sy = y0 + h * .35 * sr(i, 4); ctx.fillRect(sx, sy, 2, 2); }
  ctx.fillStyle = '#1d2244'; ctx.beginPath(); ctx.moveTo(x0, y1);
  const roof = [[0, .76], [.14, .76], [.14, .66], [.36, .66], [.36, .72], [.52, .72], [.52, .6], [.7, .6], [.7, .7], [1, .7]];
  for (const [u, v] of roof) ctx.lineTo(x0 + u * w, y0 + v * h); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,140,.9)'; for (const [u, v] of [[.2, .7], [.58, .65], [.62, .65], [.8, .74]]) ctx.fillRect(x0 + u * w, y0 + v * h, w * .03, h * .035);
  if (o.kids) o.kids(x0, y0, w, h);
  ctx.restore();
  V2.emit((x0 + x1) / 2, y1 - h * .1, w * .5, '255,170,120', .22);
  return { x0, y0, w, h };
}
/* the window's frame, sill and sash (drawn after what is seen through it); o.open 0..1 raises the lower sash */
function windowFrame(lt, o = {}) {
  const zb = RM.zb, op = c01(o.open || 0), ym = lerp(WIN.y0 + (WIN.y1 - WIN.y0) * .5, WIN.y1 - 30, op);
  const trim = '#f4f1e8';
  V2.poly(wallQuad(WIN.x0 - 18, WIN.y1, WIN.x1 + 18, WIN.y1 + 18), trim, INK, 2);
  V2.poly(wallQuad(WIN.x0 - 18, WIN.y0, WIN.x0, WIN.y1), trim, INK, 2); V2.poly(wallQuad(WIN.x1, WIN.y0, WIN.x1 + 18, WIN.y1), trim, INK, 2);
  /* the sill: a ledge toward the room */
  S6.box3({ x0: WIN.x0 - 30, x1: WIN.x1 + 30, y0: WIN.y0 - 16, y1: WIN.y0, z0: zb - 34, z1: zb, color: '#efebe0', top: '#fbf8ef', side: '#d8d2c2' });
  /* the sashes: the upper fixed, the lower slides up when the window is opened */
  const mid = WIN.y0 + (WIN.y1 - WIN.y0) * .5;
  V2.poly(wallQuad(WIN.x0, mid - 6, WIN.x1, mid + 6), trim, INK, 1.6);
  if (op > .01) { V2.poly(wallQuad(WIN.x0, ym - 8, WIN.x1, ym + 8), trim, INK, 1.6); }
  else V2.poly(wallQuad((WIN.x0 + WIN.x1) / 2 - 5, WIN.y0, (WIN.x0 + WIN.x1) / 2 + 5, WIN.y1), trim, INK, 1.4);
  /* glass sheen on the panes that are closed */
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = wallQuad(WIN.x0, op > .01 ? ym : WIN.y0, WIN.x1, WIN.y1);
  quadPath(g); ctx.fillStyle = V2.grad(g[0][0], g[2][1], g[1][0], g[0][1], [[0, 'rgba(255,255,255,.16)'], [.4, 'rgba(255,255,255,0)'], [.6, 'rgba(255,255,255,.08)'], [1, 'rgba(255,255,255,0)']]); ctx.fill(); ctx.restore();
  if (op <= .01) { ctx.save(); ctx.globalCompositeOperation = 'screen'; quadPath(wallQuad(WIN.x0, WIN.y0, WIN.x1, mid)); ctx.fillStyle = 'rgba(200,215,255,.06)'; ctx.fill(); ctx.restore(); }
}
/* the wall clock: o.min (minutes past 5), o.spin (0..1: the hands whirl, a speed smear) */
function clockFace(lt, o = {}) {
  const k = kzP(RM.zb), [x, y] = P2(CLK.X, CLK.Y, RM.zb), r = CLK.r * k;
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(20,14,30,.18)'; ell(r * .08, r * .1, r * 1.06, r * 1.06); ctx.fill();
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = r * .12; ell(0, 0, r, r); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.lineWidth = r * (i % 3 ? .04 : .08); ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * .74, -Math.cos(a) * r * .74); ctx.lineTo(Math.sin(a) * r * .88, -Math.cos(a) * r * .88); ctx.stroke(); }
  const spin = c01(o.spin || 0), m = o.min ?? 30, hr = 5 + m / 60;
  const am = m / 60 * TAU, ah = hr / 12 * TAU;
  if (spin > .02) {                                                                  /* motion smear of the whirling hands: a faint disc */
    ctx.fillStyle = 'rgba(42,37,48,' + .16 * spin + ')'; ell(0, 0, r * .72, r * .72); ctx.fill();
    for (let g = 4; g >= 1; g--) { const a2 = am - g * .5 * spin, a3 = ah - g * .12 * spin; ctx.strokeStyle = 'rgba(42,37,48,' + .12 * spin + ')'; ctx.lineWidth = r * .06; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a2) * r * .68, -Math.cos(a2) * r * .68); ctx.stroke(); ctx.lineWidth = r * .1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a3) * r * .44, -Math.cos(a3) * r * .44); ctx.stroke(); }
  }
  ctx.strokeStyle = '#2a2530'; ctx.lineWidth = r * .06; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(am) * r * .7, -Math.cos(am) * r * .7); ctx.stroke();
  ctx.lineWidth = r * .1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ah) * r * .46, -Math.cos(ah) * r * .46); ctx.stroke();
  if (o.sec != null) { const as = o.sec / 60 * TAU; ctx.strokeStyle = '#c1121f'; ctx.lineWidth = r * .025; ctx.beginPath(); ctx.moveTo(-Math.sin(as) * r * .14, Math.cos(as) * r * .14); ctx.lineTo(Math.sin(as) * r * .8, -Math.cos(as) * r * .8); ctx.stroke(); }
  ctx.fillStyle = '#c1121f'; ell(0, 0, r * .07, r * .07); ctx.fill();
  ctx.restore();
  return { x, y, r };
}
/* the region of the half being drawn (screen box) and a test for text that must be wholly inside it (the divider never cuts a string) */
let HALF = null;                                                       /* { side, box: [x0, y0, x1, y1] } while a half is drawn */
function boxScreen(x0, y0, x1, y1) {
  const m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const q = [p(x0, y0), p(x1, y0), p(x0, y1), p(x1, y1)], xs = q.map(a => a[0]), ys = q.map(a => a[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const insideHalf = (b, m = 12) => !HALF || (b[0] >= HALF.box[0] + m && b[2] <= HALF.box[2] - m && b[1] >= HALF.box[1] + m && b[3] <= HALF.box[3] - m);
/* the room: shell, lamps, the doorway and the hall, the open door, the plaque, the clock, the window, the curtain, the bed, the nightstand */
function drawRoom(lt, side, o = {}) {
  const zb = RM.zb, k = kzP(zb);
  S6.shell({ zb, hw: RM.hw, ch: RM.ch, wall: PAL.wall, wain: PAL.wain, floorA: PAL.floorA, floorB: PAL.floorB, ceil: PAL.ceil, fog: PAL.fog, fogAmt: .16, tile: 110, rail: 100 });
  S6.ceilingLamp(-60, 950, RM.ch, 1, '255,246,226', 96, 150); S6.ceilingLamp(-60, 1520, RM.ch, 1, '255,246,226', 96, 150);
  /* the doorway: its trim, the hall through it, the door leaf standing open into the room */
  V2.poly(wallQuad(DOOR.x0 - 22, 0, DOOR.x1 + 22, DOOR.y1 + 22), '#f6f3ea', INK, 2.2);
  hallView(lt, side, o.hallKids);
  V2.poly([P2(DOOR.x0, 0, zb), P2(DOOR.x0, 0, zb - 196), P2(DOOR.x0, DOOR.y1 - 6, zb - 196), P2(DOOR.x0, DOOR.y1 - 6, zb)], V2.grad(P2(DOOR.x0, 0, zb)[0], 0, P2(DOOR.x0, 0, zb - 196)[0], 0, [[0, '#b88a5e'], [1, '#a07448']]), INK, 2);
  { const a = P2(DOOR.x0, 250, zb - 170), b2 = P2(DOOR.x0, 250, zb - 150); ctx.strokeStyle = '#d9dde4'; ctx.lineWidth = 6 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b2); ctx.stroke(); }
  /* the plaque: ROOM 3 (hero when big enough on screen and wholly in this half; otherwise the board alone) */
  { const [px0, py0] = P2(PLQ.x0, PLQ.y1, zb), [px1, py1] = P2(PLQ.x1, PLQ.y0, zb), bx = [px0, py0, px1 - px0, py1 - py0], sz = (py1 - py0) * .5;
    const sb = boxScreen(px0, py0, px1, py1), txt = insideHalf(sb, 14) && sb[0] > 40 && sb[2] < W - 40 && sb[1] > 250 && sb[3] < 1370;
    if (txt) UI.sign(bx, 'ROOM 3', { fill: '#2f5f8f', stroke: '#e8eef6', lw: 3, r: 6, pad: 6, size: sz, ink: '#ffffff', hero: sz * scrOf(ctx) >= 31, id: 'plaque3' });
    else { ctx.fillStyle = '#2f5f8f'; rr(bx[0], bx[1], bx[2], bx[3], 6); ctx.fill(); ctx.strokeStyle = '#e8eef6'; ctx.lineWidth = 3; ctx.stroke(); } }
  /* the clock above the nurse: on a normal night its hands whirl when she is asked how long the pass takes */
  const clk = clockFace(lt, { min: 30 + lt / 60 * (side === 'R' ? 1 : 1), sec: (lt * 1) % 60 * 1 + 12, spin: o.clockSpin || 0, ...(o.clockMin != null ? { min: o.clockMin } : {}) });
  /* the window above the bed (and what is outside it) */
  windowView(lt, side, { kids: o.windowKids });
  windowFrame(lt, { open: o.winOpen || 0 });
  /* the privacy curtain, gathered against the wall at the head of the bed */
  { const X = 70, z0 = 1690, z1 = zb - 6, top = RM.ch - 20, bot = 40;
    ctx.strokeStyle = '#b9bec8'; ctx.lineWidth = 5 * k; { const a = P2(X, RM.ch - 6, 1180), b2 = P2(X, RM.ch - 6, zb); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b2); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const za = lerp(z0, z1, i / 6), zc = lerp(z0, z1, (i + 1) / 6), c = i % 2 ? '#9cc9c2' : '#b2d8d1';
      V2.poly([P2(X, bot, za), P2(X, bot, zc), P2(X, top, zc), P2(X, top, za)], c, 'rgba(40,70,70,.28)', 1); } }
  /* the bed: frame, mattress, headboard, pillows, a half rail on the near side */
  const B = BED;
  S6.box3({ x0: B.x0 - 6, x1: B.x1 + 6, y0: 0, y1: 336, z0: zb - 16, z1: zb - 2, color: '#86705e', top: '#97806c', side: '#6e5a4a' });
  S6.box3({ x0: B.x0, x1: B.x1, y0: 40, y1: 92, z0: B.z0, z1: B.z1, color: '#8a8f9a', top: '#9aa0ab', side: '#737884' });
  S6.box3({ x0: B.x0 + 6, x1: B.x1 - 6, y0: 92, y1: B.top, z0: B.z0 + 8, z1: B.z1 - 8, color: '#e9eef4', top: '#f6f9fc', side: '#cfd8e2' });
  S6.box3({ x0: B.x0 + 40, x1: B.x1 - 40, y0: B.top, y1: B.top + 46, z0: 1690, z1: B.z1 - 14, color: '#ffffff', top: '#ffffff', side: '#e3e8ef', lw: 1.6 });
  /* the nightstand on the far side of the bed: a pitcher, a photo */
  S6.box3({ x0: 478, x1: 548, y0: 0, y1: 176, z0: 1650, z1: 1770, color: '#b89668', top: '#d1b07e', side: '#8e7048' });
  { const [nx, ny] = P2(512, 176, 1700), kk = kzP(1700); ctx.fillStyle = 'rgba(170,215,245,.92)'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; rr(nx - 13 * kk, ny - 52 * kk, 26 * kk, 50 * kk, 6 * kk); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#eef2f6'; rr(nx - 15 * kk, ny - 58 * kk, 30 * kk, 9 * kk, 4 * kk); ctx.fill(); ctx.stroke(); }
  return { clk };
}
/* the bed's near rail and the blanket over Mr. Pear's legs: drawn after him */
function bedFront(lt, side, o = {}) {
  const B = BED, ruck = o.ruck || 0;                                   /* ruck 0..1: on a normal night the blanket is a heap (he has taken the sheet) */
  if (!o.noBlanket) {
    S6.box3({ x0: B.x0 + 2, x1: B.x1 - 2, y0: B.top, y1: B.top + 34 + 20 * ruck, z0: B.z0 + 4, z1: 1600 - 40 * ruck, color: lerp(0, 1, ruck) > .5 ? '#7aa7cc' : '#6f9fc6', top: '#88b6da', side: '#5a88ae' });
    S6.box3({ x0: B.x0 + 4, x1: B.x1 - 4, y0: B.top + 30 + 20 * ruck, y1: B.top + 44 + 20 * ruck, z0: 1560 - 40 * ruck, z1: 1606 - 40 * ruck, color: '#f4f7fa', top: '#ffffff', side: '#dfe6ee', lw: 1.4 });
  }
  S6.box3({ x0: B.x0 - 8, x1: B.x0, y0: 168, y1: 236, z0: 1430, z1: 1700, color: '#c9ced8', top: '#dfe3ea', side: '#aeb4c0', lw: 1.6 });
}

// ------------------------------------------------------------------ PROPS
/* a souffle cup of pills, at the current origin (local px; s scale, tip radians, n pills, spill 0..1 = pills leaving the rim) */
function cupShape(c, s = 1, tip = 0, n = 3, o = {}) {
  c.save(); c.rotate(tip); c.scale(s, s); c.lineJoin = 'round';
  c.fillStyle = '#f9f8f3'; c.strokeStyle = INKD; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(-15, -22); c.lineTo(15, -22); c.lineTo(11, 3); c.lineTo(-11, 3); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(120,120,130,.5)'; c.lineWidth = 1.2; for (const x of [-7, 0, 7]) { c.beginPath(); c.moveTo(x * 1.2, -20); c.lineTo(x * .8, 1); c.stroke(); }
  const P_ = [[-7, -23, '#f4a3b8'], [2, -25, '#ffffff'], [9, -22, '#7fc8f8'], [-2, -27, '#ffd36a'], [6, -28, '#ffffff'], [-9, -27, '#b9e29a']];
  for (let i = 0; i < Math.min(n, P_.length); i++) { const [x, y, col] = P_[i]; c.fillStyle = col; c.strokeStyle = 'rgba(25,16,30,.8)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, 4.6, 3.3, .3 + i, 0, TAU); c.fill(); c.stroke(); }
  c.restore();
}
const PILLC = ['#f4a3b8', '#ffffff', '#7fc8f8', '#ffd36a', '#b9e29a', '#ffffff'];
function pillShape(c, x, y, s, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.fillStyle = col; c.strokeStyle = 'rgba(25,16,30,.82)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, 5.2, 3.6, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }
/* THE MED CART: a billboard standing on the floor at world (X, Z), facing the lens. o: { t, lock 0..1 (0 the plunger out and the LED green, 1 pushed in and red), click (s since the lock was pushed), drawers [4 x 0..1],
   cups (on the tray), tower (0..1 a leaning tower of cups), mess 0..1 (papers out of the drawers), pump 0..1 (the gel pump pressed), foam 0..1, roll (wheel turn), tilt (rad), screen 0..1 }.
   Returns points in the current space: lock, nozzle, tray, top, the box. */
function medCart(X, Z, o = {}) {
  const [x, y, k] = V2.proj(X, 0, Z), t = o.t ?? 0, mess = o.mess || 0, s = k * (o.s || 1), a = o.tilt || 0;
  const L = (lx, ly) => [x + s * (lx * Math.cos(a) - ly * Math.sin(a)), y + s * (lx * Math.sin(a) + ly * Math.cos(a))];
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = V2.radial(0, 4 * s, 0, 140 * s, [[0, 'rgba(10,8,24,.38)'], [1, 'rgba(10,8,24,0)']]); ctx.save(); ctx.scale(1, .14); ctx.beginPath(); ctx.arc(0, 0, 140 * s, 0, TAU); ctx.fill(); ctx.restore();
  ctx.rotate(a); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.strokeStyle = INKD; ctx.lineWidth = 4;
  for (const dx of [-74, 74]) {                                                         /* casters (a spoke turns when it rolls) */
    ctx.fillStyle = '#23252c'; ell(dx, -15, 15, 15); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa3b2'; ell(dx, -15, 5, 5); ctx.fill();
    const r = o.roll || 0; ctx.strokeStyle = 'rgba(160,170,185,.8)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(dx, -15); ctx.lineTo(dx + Math.cos(r) * 12, -15 + Math.sin(r) * 12); ctx.stroke(); ctx.strokeStyle = INKD; ctx.lineWidth = 4;
  }
  ctx.fillStyle = V2.grad(-92, 0, 92, 0, [[0, '#2a5ea5'], [.55, '#2f6fb5'], [1, '#4b8ad0']]); rr(-92, -300, 184, 266, 12); ctx.fill(); ctx.stroke();
  /* the lock band across the top: the plunger lock (left, toward the nurse) and its LED */
  ctx.fillStyle = '#25528f'; rr(-86, -296, 172, 22, 6); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  const lk = c01(o.lock || 0), pr = 1 - lk;
  ctx.fillStyle = V2.grad(-76, -296, -56, -276, [[0, '#f4f6fa'], [1, '#8d96a6']]); ctx.lineWidth = 2.2; ell(-66, -285, 10, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(-72, -292, -60, -280, [[0, '#ffffff'], [1, '#aab3c2']]); ell(-66, -285 - 3 * pr, 6.5 + 1.5 * pr, 6.5 + 1.5 * pr); ctx.fill(); ctx.stroke();
  ctx.fillStyle = lk > .5 ? '#ff3b4a' : '#46e07a'; ell(-44, -285, 4.5, 4.5); ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
  if (o.click != null && o.click >= 0 && o.click < .35) { const u = o.click / .35; ctx.strokeStyle = 'rgba(255,255,255,' + (1 - u) + ')'; ctx.lineWidth = 2.4; for (let i = 0; i < 6; i++) { const an = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(-66 + Math.cos(an) * (14 + 10 * u), -285 + Math.sin(an) * (14 + 10 * u)); ctx.lineTo(-66 + Math.cos(an) * (20 + 16 * u), -285 + Math.sin(an) * (20 + 16 * u)); ctx.stroke(); } ctx.strokeStyle = INKD; }
  if (lk > .5) V2.emit(L(-44, -285)[0], L(-44, -285)[1], 18 * s, '255,60,74', .5); else V2.emit(L(-44, -285)[0], L(-44, -285)[1], 18 * s, '70,224,122', .4);
  /* four drawers; an open drawer slides out toward the lens (a dark gap above it, its contents showing) */
  const dr = o.drawers || [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const yy = -270 + i * 58, d = c01(dr[i] || 0);
    if (d > .02) { ctx.fillStyle = '#122a4c'; rr(-84, yy - 2, 168, 54, 6); ctx.fill(); for (let j = 0; j < 5; j++) { ctx.fillStyle = ['#ffffff', '#f4a3b8', '#7fc8f8', '#ffd36a', '#b9e29a'][j]; rr(-70 + j * 28, yy + 6 - 10 * d, 22, 14, 3); ctx.fill(); } }
    ctx.save(); ctx.translate(0, 8 * d); ctx.scale(1 + .05 * d, 1 + .05 * d);
    ctx.fillStyle = V2.grad(0, yy, 0, yy + 52, [[0, '#4f8ad6'], [1, '#3b72bd']]); ctx.lineWidth = 2.6; rr(-86, yy, 172, 50, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e4e9f0'; ctx.lineWidth = 1.8; rr(-28, yy + 20, 56, 9, 4.5); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (mess > .02 && (i === 1 || i === 3)) { ctx.save(); ctx.globalAlpha *= c01(mess * 2); ctx.fillStyle = '#fbfaf5'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-40 + i * 10, yy + 2); ctx.lineTo(-30 + i * 10, yy - 22); ctx.lineTo(6 + i * 10, yy - 18); ctx.lineTo(0 + i * 10, yy + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  /* the gel bottle in a wire holder on the near (left) corner: a pump head with a nozzle toward the nurse */
  const pm = c01(o.pump || 0);
  ctx.strokeStyle = '#c0c7d2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-92, -236); ctx.lineTo(-118, -236); ctx.lineTo(-118, -190); ctx.lineTo(-92, -190); ctx.stroke(); ctx.strokeStyle = INKD;
  ctx.fillStyle = V2.grad(-132, 0, -104, 0, [[0, '#9fe6f0'], [1, '#5cc4d6']]); ctx.lineWidth = 2.4; rr(-132, -252, 28, 64, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(-128, -246, 6, 50, 3); ctx.fill();
  ctx.fillStyle = '#eef2f6'; rr(-124, -262 + 5 * pm, 12, 12, 3); ctx.fill(); ctx.stroke();                        /* the pump head (pressed down by pm) */
  ctx.fillStyle = '#eef2f6'; rr(-136, -260 + 5 * pm, 16, 5, 2); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
  /* the top surface */
  ctx.fillStyle = '#e9eef5'; ctx.lineWidth = 3.4; rr(-104, -322, 208, 24, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(-96, -319, 192, 5, 2.5); ctx.fill();
  /* on the top: the tray of cups, the sharps box (right), the laptop seen from behind (right) */
  const nC = o.cups ?? 5;
  ctx.fillStyle = '#f4f4f0'; ctx.lineWidth = 2; rr(-70, -334, 96, 14, 4); ctx.fill(); ctx.stroke();
  for (let i = 0; i < Math.min(nC, 5); i++) { ctx.save(); ctx.translate(-60 + i * 19, -334); cupShape(ctx, .62, 0, 2); ctx.restore(); }
  ctx.fillStyle = '#d6203a'; ctx.lineWidth = 2.6; rr(40, -372, 44, 50, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f4f4f4'; rr(44, -380, 36, 10, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#383c48'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-96, -322); ctx.lineTo(-78, -322); ctx.lineTo(-80, -368); ctx.lineTo(-98, -366); ctx.closePath(); ctx.fill(); ctx.stroke();   /* the laptop's lid, edge-on */
  if ((o.screen ?? 1) > 0) V2.emit(L(-88, -345)[0], L(-88, -345)[1], 30 * s, '150,190,255', .25 * (o.screen ?? 1));
  if (o.tower > .02) {                                                                   /* a leaning tower of cups (a normal night) */
    const n = Math.round(4 + 6 * c01(o.tower)), lean = .05 * Math.sin(t * 3.1) + .06;
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(-14 + Math.sin(i * .9) * 3 + i * lean * 14, -336 - i * 16); cupShape(ctx, .72, lean * .6 + .08 * Math.sin(i * 2.3 + t * 2), 1); ctx.restore(); }
  }
  ctx.restore();
  return { x, y, k: s, lock: L(-66, -285), nozzle: L(-136, -257), tray: L(-22, -336), top: L(0, -322), box: [L(-132, -330)[0], L(0, -380)[1], L(104, 0)[0], y] };
}
/* a held cup: hold: { r: 'fp21m_cup' }; o.cupScale, o.cupTip, o.cupN */
EXT.prop.fp21m_cup = (side, o, t) => { cupShape(ctx, o.cupScale || 1, (o.cupTip || 0) - .06, o.cupN ?? 3); };
PROP_BOX.fp21m_cup = Object.assign([-22, -36, 22, 8], { nearFace: true });
/* one pill held up between finger and thumb: hold: { r: 'fp21m_pill' }; o.pillCol */
EXT.prop.fp21m_pill = (side, o, t) => { ctx.save(); ctx.translate(0, -10); ctx.fillStyle = o.pillCol || '#f4a3b8'; ctx.strokeStyle = INKD; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, -.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-3, -2, 3, 1.5, -.4, 0, TAU); ctx.fill(); ctx.restore(); };
PROP_BOX.fp21m_pill = Object.assign([-12, -20, 12, 0], { nearFace: true });
/* the stand-in surveyor's clipboard (until A21's fp21_clipboard lands): a board, a form of ruled lines and ticks, a steel clip (no lettering) */
EXT.prop.fp21m_clip = (side, o, t) => {
  const S = o.clipScale || 1, ticks = o.cbTicks || 0;
  ctx.save(); ctx.rotate((o.clipRot || 0) + .06 * side); ctx.scale(S, S); ctx.lineJoin = 'round';
  ctx.fillStyle = V2.grad(-40, -56, 40, 56, [[0, '#c89a62'], [1, '#9a6c3c']]); ctx.strokeStyle = INKD; ctx.lineWidth = 2.6; rr(-40, -58, 80, 108, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fbfaf4'; ctx.fillRect(-32, -44, 64, 86); ctx.strokeStyle = 'rgba(60,50,40,.45)'; ctx.lineWidth = 1.2; ctx.strokeRect(-32, -44, 64, 86);
  for (let i = 0; i < 6; i++) { const yy = -30 + i * 13; ctx.strokeStyle = 'rgba(60,60,80,.4)'; ctx.beginPath(); ctx.moveTo(-14, yy); ctx.lineTo(26, yy); ctx.stroke(); ctx.strokeStyle = 'rgba(40,40,60,.7)'; ctx.strokeRect(-26, yy - 6, 7, 7);
    if (i < ticks) { ctx.strokeStyle = '#1d3f8f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, yy - 3); ctx.lineTo(-23, yy); ctx.lineTo(-17, yy - 9); ctx.stroke(); ctx.lineWidth = 1.2; } }
  ctx.fillStyle = V2.grad(0, -64, 0, -44, [[0, '#eef2f8'], [1, '#98a2b0']]); ctx.strokeStyle = INKD; ctx.lineWidth = 2.2; rr(-20, -64, 40, 18, 5); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PROP_BOX.fp21m_clip = Object.assign([-44, -66, 44, 52], { nearFace: true });
/* a pen in the other hand (the stand-in surveyor writes) */
EXT.prop.fp21m_pen = (side, o, t) => { ctx.save(); ctx.rotate(-.7 + (o.penWig || 0)); ctx.fillStyle = '#1d2a4a'; ctx.strokeStyle = INKD; ctx.lineWidth = 1.8; rr(-3, -30, 6, 34, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d8dde6'; rr(-3, 2, 6, 6, 1.5); ctx.fill(); ctx.restore(); };
PROP_BOX.fp21m_pen = Object.assign([-8, -32, 8, 10], { nearFace: true });

// ------------------------------------------------------------------ THE SHOTS (both halves cut together; a shot boundary frame is the NEW shot)
const SHL = [
  ['open', 0], ['ka1', bS('ka1') - .06], ['s1', bS('s1') - .06], ['hyg', bS('hygiene')], ['s2', bS('s2') - .06], ['pe1', bS('pe1') - .06], ['ka4', bS('ka4') - .06], ['s7', bS('s7') - .06],
  ['ka5', bS('ka5') - .06], ['s8', bS('s8') - .06], ['ka2', bS('ka2') - .06], ['s3', bS('s3') - .06], ['ka3', bS('ka3') - .06], ['s4', bS('s4') - .06], ['pe2', bS('pe2') - .06],
  ['pe3', bS('pe3') - .06], ['pe4', bS('pe4') - .06], ['end', bS('end')],
];
const SH = SHL.map(([id, s], i) => ({ id, s: i ? snapT(s) : 0, e: i + 1 < SHL.length ? snapT(SHL[i + 1][1]) : DUR + 1 }));
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
const nearCut = lt => SH.some(sh => sh.s > 0 && Math.abs(lt - sh.s) < .5 / 30);
const KID = 'kale';

// ------------------------------------------------------------------ THE CAST. Each builder returns { o (drawChar options), z (depth), name }; positions are world (X, Z) through V2.at
const at = (X, Z, extra) => V2.at(X, Z, extra);
/* where a world point lands for a character standing at (X, Z): a screen point in body-local px (for grip targets) */
function toLocal(o, sx, sy) { const k = KINDS[o.kind], leg = o.noLegs ? 0 : (k.leg || 90), s = o.s || 1; return [(sx - o.x) / s, (sy - o.y + (o.lift || 0)) / s + (leg + k.ry * .9)]; }
function reach(o, side, g, R = 112) {                                   /* clamp a grip target to the arm's reach (so the pose is always legal) */
  const k = KINDS[o.kind], sd = side === 'l' ? -1 : 1, yaw = o.yaw || 0, sx = sd * (k.shape === 'straw' ? .88 : .92) * k.rx * Math.cos(yaw), sy = (k.shape === 'straw' ? -.1 : .1) * k.ry;
  const dx = g[0] - sx, dy = g[1] - sy, d = Math.hypot(dx, dy); return d > R ? [sx + dx * R / d, sy + dy * R / d] : g;
}
/* MS. KALE (A21.kale; a stand-in of the same shape until the kit is there: a tall dark-green leaf with glasses, a lanyard, a clipboard, a pen). Poses: 'clip' (board at her side, pen in the right hand), 'write' */
const KALE_EXPR = { kale_neutral: 'neutral', kale_note: 'neutral', kale_raise: 'neutral', kale_satisfied: 'happy' };
function kaleCtor(o) {
  if (has('A21', 'kale')) return A21.kale(Object.assign({ who: KID }, o));
  const e = o.expr || 'kale_neutral', wr = o.pose === 'write';
  return Object.assign({ kind: 'lemon', id: 'kale', who: KID, colors: ['#a7d68a', '#3f8a4a', '#163d22'], acc: ['glasses', 'lanyard'], hold: { l: 'fp21m_clip', r: 'fp21m_pen' }, clipScale: .9,
    arms: { l: 'hold', r: 'hold' }, grip: { l: [-30, 40], r: wr ? [-8, 34 + 4 * Math.sin((o.t || 0) * 18)] : [50, 56] } }, o,
    { expr: KALE_EXPR[e] || 'neutral', browUp: (o.browUp || 0) + (e === 'kale_raise' ? 7 : 0), look: wr ? [.25, .7] : o.look });
}
/* her form: rows FRONT DOOR, STAFFING, LABELS done before this scene; MED PASS is ticked at the sting (the smallest smile) */
const TICK_MED = CUE_STING_T();
function CUE_STING_T() { return snapT(bS('end') + .1) + .04; }
/* the moments she writes (pen on the board, eyes down) */
const WRITES = [[4.3, 4.95], [6.05, 6.7], [12.0, 12.7], [18.25, 18.72], [20.0, 20.6], [25.62, 26.3]];
function kaleOpts(lt, sh) {
  const p = at(POS.kale[0], POS.kale[1]);
  const writing = WRITES.some(([a, b]) => lt >= a && lt < b);
  const raiseA = wS('ka4', 3) - .05, raiseB = wS('ka3', 1) - .05;
  const raise = (lt >= raiseA && lt < bE('ka4') + .2) || (lt >= raiseB && lt < bE('ka3') + .25);
  const sat = lt >= CUE.sting - .05;
  const expr = sat ? 'kale_satisfied' : writing ? 'kale_note' : raise ? 'kale_raise' : 'kale_neutral';
  const yaw = .42 + .05 * Math.sin(lt * .7);
  const point = lt >= wS('ka4', 3) - .2 && lt < bE('ka4') + .1;               /* "lock the cart?": the pen hand points at the cart */
  const o = { x: p.x, y: p.y, s: p.s, t: lt, yaw, headYaw: yaw + (writing ? .05 : 0), expr, pose: writing ? 'write' : 'clip', cbPen: true, plant: true,
    cbTicks: 3 + ss(lt, TICK_MED, TICK_MED + .3) };
  if (!writing) o.look = [.55, .04];
  if (expr === 'kale_raise') o.raiseK = ss(lt, lt < bS('ka3') ? raiseA : raiseB, (lt < bS('ka3') ? raiseA : raiseB) + .2);
  if (point) { o.arms = { l: 'hold', r: 'point' }; o.grip = { l: [-104, 128] }; }
  return { o: kaleCtor(o), z: POS.kale[1], name: 'kale' };
}
/* STRAWBERRY, LEFT (with the State): one spot between the doorway and the cart; she turns to Kale or to Mr. Pear, never hurries */
const TO_KALE = [['ka1', -.06, .1], ['s1', 0, 0], ['ka4', -.1, 0], ['ka5', -.1, 0], ['ka2', -.1, 0], ['s3', 0, 0], ['ka3', -.1, 0], ['s4', 0, .1]];
function strawLYawT(t) {                                                      /* where she faces: Kale (screen left), the cart, or Mr. Pear (screen right) */
  if (TO_KALE.some(([b, a, e]) => t >= bS(b) + a && t < bE(b) + e + .15)) return -.42;
  if (t < 1.5 || (t >= 5.15 && t < 6.85) || (t >= bS('s7') - .1 && t < bE('s7') + .1)) return .38;
  return .58;
}
function strawLOpts(lt, sh) {
  const p = at(POS.straw[0], POS.straw[1]), c = cartL(lt);
  const yaw = yawSmooth(lt, strawLYawT);
  const o = Object.assign(p, { kind: 'straw', t: lt, yaw, headYaw: yaw, plant: true, who: 'straw', expr: 'neutral', arms: { l: 'hold', r: 'hold' } });
  let gl = [-58, 74], gr = [40, 64], look = [yaw > 0 ? .5 : -.5, .05], hold = { r: 'fp21m_cup' }, lid, expr = 'neutral', rot = 0;
  o.cupScale = .95; o.cupN = 3;
  if (lt < 1.55) { gr = toLocal(o, c.tray[0] - 6, c.tray[1] + 10); hold = {}; look = [.6, .5]; }   /* arranging the cups on the tray */
  if (lt >= bS('s1') - .1 && lt < bS('hygiene')) { gl = [-22, 70]; gr = [20, 72]; hold = {}; lid = .36; expr = 'chill'; look = [-.2, 0]; }   /* "I always do this." serene, hands folded */
  if (lt >= 5.15 && lt < 6.85) {                                                /* hygiene: the right hand to the pump (5.40, 6.10), the hands rubbed together between */
    hold = {}; look = [.55, .55]; expr = 'chill';
    const at1 = lt < 5.75 ? CUE.san1 : CUE.san2, u = ss(lt, at1 - .22, at1 - .04) * (1 - ss(lt, at1 + .08, at1 + .26));
    const nz = c.nozzle, ng = toLocal(o, nz[0] + 6, nz[1] + 18);
    const rub = lt > CUE.san1 + .2 && Math.abs(lt - CUE.san2) > .28 ? 1 : 0, wob = 10 * Math.sin(lt * 21);
    gr = lerpP([16 + wob * rub, 60], ng, u); gl = [-18 - wob * rub, 62];
  }
  if (lt >= bS('s2') - .06 && lt < bS('ka4') - .1) { expr = lt < bS('pe1') ? 'happy' : 'neutral'; rot = .035 * ss(lt, bS('s2'), bS('s2') + .4); gr = [56, 40]; hold = { r: 'fp21m_cup' }; }
  if (lt >= bS('s7') - .1 && lt < bE('s7') + .15) {                           /* "Always.": the lock pushed in (the click at LOCKT) */
    const u = ss(lt, LOCKT - .25, LOCKT - .02) * (1 - ss(lt, LOCKT + .16, LOCKT + .4)), lk = toLocal(o, c.lock[0] + 4, c.lock[1] + 6);
    gr = lerpP([40, 64], lk, u); hold = u > .5 ? {} : { r: 'fp21m_cup' }; look = [.6, .45];
  }
  if (lt >= bS('s8') - .06 && lt < bS('ka2') - .1) {                           /* "Always.": one pill held up for Mr. Pear */
    const u = ss(lt, bS('s8') - .05, bS('s8') + .2); gr = lerpP([56, 40], [86, -24], u); hold = { r: u > .4 ? 'fp21m_pill' : 'fp21m_cup' }; o.pillCol = '#f4a3b8'; expr = 'happy';
  }
  if (lt >= bS('s4') - .06 && lt < bS('pe2') - .05) { expr = 'chill'; lid = .3; }
  if (lt >= bS('pe2') - .06 && lt < bS('pe3') - .06) { rot = .06; look = [.6, .15]; if (lt >= bS('s5') - .05) { gl = toLocal(o, o.x + 28 * o.s, o.y - 236 * o.s); look = [-.6, .05]; } }   /* the whisper; "The State." with a hand beside her mouth, eyes on Kale */
  if (lt >= bS('s6') - .06 && lt < bS('pe4')) { expr = 'hopeful'; gl = [-14, 40]; gr = [14, 40]; hold = {}; }   /* "Please.": hands clasped */
  if (lt >= bS('pe4')) { expr = lt > wS('pe4', 2) ? 'happy' : 'neutral'; }
  o.grip = { l: reach(o, 'l', gl), r: reach(o, 'r', gr) }; o.hold = hold; o.look = look; o.expr = expr; if (lid != null) o.lid = lid; o.rot = rot;
  return { o: A11.straw(o), z: POS.straw[1], name: 'straw' };
}
const lerpP = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
/* a yaw that eases between the targets of a step function of time (sampled; pure function of lt) */
function yawSmooth(lt, f, tau = .28) { let acc = 0, wsum = 0; for (let i = 0; i <= 8; i++) { const t = lt - tau * i / 8, w = 1 - i / 9; acc += f(t) * w; wsum += w; } return acc / wsum; }
const LOCKT = snapT(bS('s7') + .16);                                          /* the frame the lock clicks in (on "Always.") */
/* the cart's points without drawing it (the nurse's hands need them before the cart is drawn in front of her) */
function cartGeom(X, Z, o = {}) {
  const [x, y, k] = V2.proj(X, 0, Z), s = k * (o.s || 1), a = o.tilt || 0;
  const L = (lx, ly) => [x + s * (lx * Math.cos(a) - ly * Math.sin(a)), y + s * (lx * Math.sin(a) + ly * Math.cos(a))];
  return { x, y, k: s, lock: L(-66, -285), nozzle: L(-136, -257), tray: L(-22, -336), top: L(0, -322) };
}
/* the left cart: neat, five cups on the tray, locked on "Always." (LOCKT) */
function cartL(lt) {
  const o = { t: lt, lock: lt >= LOCKT ? 1 : 0, click: lt - LOCKT, cups: lt < bS('s2') ? 5 : 4, pump: Math.max(bump(lt, CUE.san1 - .06, CUE.san1 + .14), bump(lt, CUE.san2 - .06, CUE.san2 + .14)), screen: 1 };
  return Object.assign(cartGeom(CART.X, CART.Z, o), { X: CART.X, Z: CART.Z, opts: o });
}
/* MR. PEAR, LEFT: sitting up in bed, patient; nods along to each pill; whispers about Kale; folds his hands and a tiny halo comes on for "I always behave." */
const PEAR_S = 1.0;
function pearBase(lt) { const p = at(POS.pear[0], POS.pear[1]); const y = P2(POS.pear[0], BED.top + 6, POS.pear[1])[1]; return { x: p.x, y, s: p.s * PEAR_S }; }
const HALO_T = snapT(wS('pe4', 2) + .05);
function pearLOpts(lt, sh) {
  const b = pearBase(lt);
  const o = { kind: 'pear', x: b.x, y: b.y, s: b.s, t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true, who: 'pear', yaw: -.5, headYaw: -.55, look: [-.55, .05], expr: 'neutral', arms: { l: 'hold', r: 'hold' } };
  let gl = [-50, 96], gr = [44, 98], expr = 'neutral', look = [-.55, .05], hy = -.55, lid, rot = 0;
  if (lt >= bS('pe1') - .06 && lt < bS('ka4')) { lid = .42; hy = -.5 + .05 * Math.sin(lt * 3); }                                                     /* "The same as yesterday." patient, lids low */
  if (lt >= bS('s8') - .06 && lt < bS('ka2')) { const n = Math.sin((lt - bS('s8')) * 9.5); look = [-.5, .12 + .22 * Math.max(0, n)]; rot = .03 * n; }  /* nodding along to the pill */
  if (lt >= bS('pe2') - .06 && lt < bS('pe3') - .06) { gr = [-6, 52]; look = [-1, -.05]; hy = -.7; rot = -.05; expr = 'neutral'; }                    /* "Who is that?" a hand by the mouth, eyes on Kale */
  if (lt >= bS('pe3') - .06 && lt < bS('pe4') - .06) { expr = 'hopeful'; look = [-.6, -.1]; }
  if (lt >= bS('pe4') - .06) { const u = ss(lt, bS('pe4') - .06, bS('pe4') + .25); gl = lerpP(gl, [-16, 84], u); gr = lerpP(gr, [16, 84], u); expr = 'happy'; lid = .5 * u; look = [-.1, -.3]; hy = lerp(-.55, -.15, u); }
  Object.assign(o, { headYaw: hy, look, expr, rot, grip: { l: reach(o, 'l', gl), r: reach(o, 'r', gr) } }); if (lid != null) o.lid = lid;
  return { o: A7.pear(o), z: POS.pear[1], name: 'pear' };
}
/* the halo: a thin gold ring over his cap, popping in on "behave" with a glint */
function halo(o, lt) {
  const k = c01((lt - HALO_T) / .3); if (k <= 0) return;
  const sc = eb(k), kd = KINDS.pear, s = o.s, cx = o.x + (o.headYaw || 0) * 6 * s, cy = o.y - (kd.ry * 2 + 64) * s + 4 * Math.sin(lt * 2.4) * s;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
  ctx.strokeStyle = '#8a6a10'; ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.ellipse(0, 0, 56 * s, 15 * s, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 5.5 * s; ctx.beginPath(); ctx.ellipse(0, 0, 56 * s, 15 * s, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,250,210,.9)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.ellipse(0, -2 * s, 50 * s, 12 * s, 0, PI * 1.1, PI * 1.6); ctx.stroke();
  ctx.restore();
  V2.glow(cx, cy, 120 * s, '255,220,120', .35 * c01(k * 2), 'screen', .5);
  const gl = lt - HALO_T - .25; if (gl > 0 && gl < .5) { const g = Math.sin(PI * gl / .5), gx = cx + 46 * s, gy = cy - 6 * s; ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,248,210,' + .9 * g + ')'; ctx.fillRect(gx - 16 * g * s, gy - 1.5, 32 * g * s, 3); ctx.fillRect(gx - 1.5, gy - 16 * g * s, 3, 32 * g * s); ctx.restore(); }
}
/* the bedsheet cape (a normal night): white with a blue stripe, knotted at the neck; drawn behind him when he faces us, over his back when he does not. u 0..1 how far it is on */
function cape(o, lt, u, back) {
  if (u <= .02) return;
  const s = o.s, kd = KINDS.pear, legL = o.noLegs ? 0 : kd.leg, cy0 = o.y - (legL + kd.ry * .9) * s, top = cy0 - 70 * s, w0 = 62 * s, w1 = (150 + 20 * Math.sin(lt * 7)) * s * u, len = (210 + 30 * u) * s;
  const fl = 18 * Math.sin(lt * 9.5) * s, dir = back ? 1 : -1;
  ctx.save(); ctx.globalAlpha *= c01(u * 3);
  ctx.fillStyle = V2.grad(o.x - w1, 0, o.x + w1, 0, [[0, '#dfe6ee'], [.5, '#ffffff'], [1, '#dfe6ee']]); ctx.strokeStyle = INKD; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(o.x - w0, top); ctx.quadraticCurveTo(o.x - w1 * .9, top + len * .5, o.x - w1 + fl, top + len); ctx.lineTo(o.x + w1 + fl * .6, top + len + 10 * s); ctx.quadraticCurveTo(o.x + w1 * .9, top + len * .5, o.x + w0, top); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5b8fd0'; ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.moveTo(o.x - w1 * .8 + fl, top + len * .82); ctx.lineTo(o.x + w1 * .8 + fl * .6, top + len * .86); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ THE RIGHT WORLD (a normal night): Strawberry's route, the runaway cart, Mr. Pear's escape
/* a route through keyed positions [t, X, Z, ease ('io' | 'out' | 'in' | linear)]: pure function of lt */
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = c01((lt - a[0]) / (b[0] - a[0])), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? eo(k) : b[3] === 'in' ? k * k : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
function pathDist(fn, lt, t0 = 0) { let d = 0, p = fn(t0); for (let t = t0 + .02; ; t += .02) { const tt = Math.min(t, lt), q = fn(tt); d += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; if (tt >= lt) break; } return d; }
const SPOT = POS.straw;                                                         /* her place at the cart (the same on both sides) */
/* where she is on a normal night (world X, Z); the segments are cut to the shots (she is always running between them) */
const RSEG = [
  { a: 0, b: bS('ka1') - .07, path: route([[0, 450, 1430], [.95, 450, 1430], [1.55, 120, 1240, 'in']]), mode: 'bedR' },
  { a: bS('ka1') - .07, b: bS('s1') - .07, path: route([[0, -360, 2320]]), mode: 'hallLoad' },
  { a: bS('s1') - .07, b: bS('hygiene'), path: route([[bS('s1') - .07, -360, 2250], [4.18, -360, 1830, 'in'], [4.62, SPOT[0], SPOT[1], 'out']]), mode: 'rushIn' },
  { a: bS('hygiene'), b: bS('s2') - .07, path: route([[0, SPOT[0], SPOT[1]]]), mode: 'juggle' },
  { a: bS('s2') - .07, b: bS('pe1') - .07, path: route([[0, -360, 2560]]), mode: 'shout' },
  { a: bS('pe1') - .07, b: bS('ka5') - .07, path: route([[0, -360, 3000]]), mode: 'away' },
  { a: bS('ka5') - .07, b: bS('s8') - .07, path: route([[bS('ka5') - .07, 120, 1300], [13.05, 120, 1300], [13.5, -330, 1760, 'in'], [14.9, -360, 2700]]), mode: 'chase' },
  { a: bS('s8') - .07, b: bS('ka2') - .07, path: route([[0, 70, 1500]]), mode: 'dispense' },
  { a: bS('ka2') - .07, b: bS('s3') - .07, path: route([[bS('ka2') - .07, -470, 2300], [16.25, -260, 2480], [16.7, -470, 2700], [17.15, -260, 2880], [17.6, -470, 3060], [18.0, -300, 3200]]), mode: 'zigzag' },
  { a: bS('s3') - .07, b: bS('ka3') - .07, path: route([[0, SPOT[0], SPOT[1]]]), mode: 'clock' },
  { a: bS('ka3') - .07, b: bS('s4') - .07, path: route([[0, -268, 1772]]), mode: 'slump' },
  { a: bS('s4') - .07, b: bS('end') + .35, path: route([[0, -360, 3400]]), mode: 'gone' },
  { a: bS('end') + .35, b: DUR + 1, path: route([[bS('end') + .35, -150, 1500], [26.6, 200, 1700, 'out']]), mode: 'tooLate' },
];
const rseg = lt => RSEG.find(g => lt >= g.a - 1e-6 && lt < g.b) || RSEG[RSEG.length - 1];
function strawROpts(lt) {
  const g = rseg(lt), [X, Z] = g.path(lt), p = at(X, Z), dt = .03, a = g.path(lt - dt), b = g.path(lt + dt);
  const vX = (b[0] - a[0]) / (2 * dt), vZ = (b[1] - a[1]) / (2 * dt), sp = Math.hypot(vX, vZ);
  const o = Object.assign(p, { kind: 'straw', t: lt, plant: true, who: 'nobody', expr: 'panic', arms: { l: 'hold', r: 'hold' }, yaw: 0, look: [0, 0] });
  let gl = [-60, 60], gr = [60, 60], hold = {}, yaw = 0, hy = null, look = [0, 0], expr = 'panic', extra = {};
  if (sp > 30) {                                                                      /* running: profile across the room, back to us down the hall, front coming toward us */
    const ax = Math.abs(vX) > Math.abs(vZ) * .8;
    yaw = ax ? Math.sign(vX) * PI / 2 : vZ > 0 ? PI : 0;
    extra = { gaitW: lt * 420, axis: ax ? 'x' : 'z', dir: ax ? Math.sign(vX) : -Math.sign(vZ), vx: clamp(vX * p.s, -1400, 1400), stride: 46 };
    gl = [-40, 30]; gr = [40, 30];
  }
  switch (g.mode) {
    case 'bedR': { yaw = sp > 30 ? yaw : -.7; const j = Math.sin(lt * 15); gr = [-90 + 26 * j, 10 - 20 * j]; gl = [-40, 40]; hold = { r: 'fp21m_cup', l: 'fp21m_cup' }; look = [-.8, .1]; o.transit = lt > .9; break; }
    case 'hallLoad': { yaw = .1; const j = Math.sin(lt * 19), j2 = Math.sin(lt * 19 + PI); gr = [70 + 20 * j, 20 + 30 * j]; gl = [-70 + 20 * j2, 20 + 30 * j2]; hold = { r: 'fp21m_cup' }; look = [.5 * j, .4]; break; }
    case 'rushIn': { o.transit = lt < 4.66; expr = 'panic'; if (sp <= 30) { yaw = .3; gl = [-30, 50]; gr = [30, 50]; } break; }
    case 'juggle': { yaw = .1; look = [0, -.7]; const J = juggle(lt); gl = J.hl; gr = J.hr; o.juggle = J; expr = lt > CUE.clat1 && lt < CUE.clat1 + .5 ? 'shock' : 'panic'; break; }
    case 'shout': { yaw = 0; look = [0, .05]; o.who = 'straw'; expr = 'angry'; gl = [-34, 6]; gr = [34, 6]; o.mouthOpen = .35; break; }
    case 'away': { yaw = PI; break; }
    case 'chase': { if (sp <= 30) { yaw = -.5; expr = 'shock'; gl = [-80, -40]; gr = [-20, 40]; } break; }
    case 'dispense': { yaw = .55; look = [.7, .1]; hy = .5; const u = ss(lt, CUE.clat2 - .3, CUE.clat2 - .05) * (1 - ss(lt, CUE.clat2 + .45, CUE.clat2 + .7)); gr = [lerp(60, 112, u), lerp(40, -40, u)]; hold = { r: 'fp21m_cup' }; o.cupScale = 1.25; o.cupN = 6; o.cupTip = lerp(0, 2.1, u); expr = 'dead'; break; }
    case 'zigzag': { break; }
    case 'clock': { yaw = 0; look = [0, -1]; expr = 'panic'; gl = [-70, -10]; gr = [70, -10]; hy = 0; extra.sweat = true; break; }
    case 'slump': { yaw = -.2; expr = 'dead'; o.lid = .62; o.rot = -.16; gl = [-70, 20]; gr = [40, 70]; look = [0, .3]; break; }
    case 'gone': { yaw = PI; break; }
    case 'tooLate': { if (sp <= 30) { yaw = PI - .25; gl = [-60, -40]; gr = [60, -40]; expr = 'shock'; } break; }
  }
  Object.assign(o, extra, { yaw, headYaw: hy ?? yaw, look, expr, hold, grip: { l: reach(o, 'l', gl), r: reach(o, 'r', gr) } });
  if (extra.sweat) o.acc = ['steth', 'bandage7', 'perdiem9', 'sweat'];
  return { o: A11.straw(o), z: Z, name: 'strawR', mode: g.mode };
}
/* the juggle (hygiene, a normal night): three cups on a cascade between her hands; on the clatter (5.60) two of them knock together and spill */
function juggle(lt) {
  const t0 = bS('hygiene'), per = .5, hl = [-62, 34], hr = [62, 34], cups = [];
  for (let i = 0; i < 3; i++) {
    const ph = ((lt - t0) / per + i / 3) % 1, fromL = Math.floor((lt - t0) / per + i / 3) % 2 === 0;
    const [x0, x1] = fromL ? [hl[0] + 10, hr[0] - 10] : [hr[0] - 10, hl[0] + 10];
    cups.push({ x: lerp(x0, x1, ph), y: hl[1] - 8 - 230 * 4 * ph * (1 - ph), rot: (fromL ? 1 : -1) * ph * 4 });
  }
  const catchL = Math.sin((lt - t0) / per * PI * 2), hlD = [hl[0], hl[1] + 10 * catchL], hrD = [hr[0], hr[1] - 10 * catchL];
  return { cups, hl: hlD, hr: hrD };
}
/* the runaway cart (a normal night): in the hall while she loads it, rushed in, parked at its place, rolling off by itself on "Always." (cartroll), away down the hall */
const RCART = route([[0, -360, 2420], [bS('s1') - .07, -360, 2380], [4.2, -360, 1830, 'in'], [4.55, CART.X, CART.Z, 'out'], [CUE.cartroll, CART.X, CART.Z], [CUE.cartroll + .7, -250, 1640, 'in'], [CUE.cartroll + 1.05, -350, 1830], [CUE.cartroll + 2.8, -350, 3150, 'out']]);
function cartR(lt) {
  const [X, Z] = RCART(lt), rolling = lt > CUE.cartroll && lt < CUE.cartroll + 2.9, rush = lt > 3.9 && lt < 4.7;
  const wob = rolling ? .025 * Math.sin((lt - CUE.cartroll) * 13) * (1 - sg(lt, CUE.cartroll, CUE.cartroll + 2.8)) : rush ? .04 * Math.sin(lt * 30) : 0;
  const open = lt > 9 && lt < CUE.cartroll + .4 ? ss(lt, 9.2, 10.3) : 0;
  const o = { t: lt, lock: 0, cups: 2, tower: lt < CUE.cartroll + .3 ? 1 : .3, mess: 1, drawers: [open, open * .7, open, open * .5], roll: pathDist(RCART, lt, Math.max(0, lt - 4)) / 15, tilt: wob, screen: 1 };
  return Object.assign(cartGeom(X, Z, o), { X, Z, opts: o, inHall: Z > RM.zb - 4 });
}
/* MR. PEAR, RIGHT: the call-light pendant, the shouted answer, the pills, then the sheet, the bed, the window */
const ESC = { tie: [bS('pe2') + .1, bS('pe2') + 1.4], stand: snapT(bS('pe3') - .06), sill: snapT(bS('pe4') - .06), hop: snapT(wS('pe4', 1) + .2), gone: snapT(bS('end') + .2) };
function pearROpts(lt) {
  const b = pearBase(lt);
  let o = { kind: 'pear', x: b.x, y: b.y, s: b.s, t: lt, noLegs: true, noShadow: true, noReflect: true, plant: true, who: 'nobody', yaw: -.5, headYaw: -.55, look: [-.55, .05], expr: 'smug', arms: { l: 'hold', r: 'hold' } };
  let gl = [-50, 96], gr = [30, 60], hold = {}, capeU = 0, back = false, inside = true;
  if (lt < bS('pe1') - .07) { gr = [24, 40 + 6 * Math.sin(lt * 14)]; hold = { r: 'fp21m_bell' }; o.expr = 'sour'; }                                            /* thumbing the call-light pendant */
  if (lt >= bS('pe1') - .07 && lt < bS('ka4') - .07) { o.who = 'pear'; o.mouthOpen = .5; o.expr = 'angry'; o.yaw = -.8; o.headYaw = -.95; o.look = [-1, -.1]; gr = [-40, 30]; }  /* shouting it back at the door */
  if (lt >= bS('s8') - .07 && lt < bS('ka2') - .07) { o.mouthOpen = lt > CUE.clat2 - .35 ? 1 : .3; o.expr = 'shock'; o.look = [-.4, -.4]; o.headYaw = -.4; }      /* the pills go in */
  if (lt >= bS('s4') - .07 && lt < bS('pe2') - .07) { o.expr = 'smug'; o.yaw = .2; o.headYaw = .5; o.look = [.8, -.6]; }                                     /* he eyes the window */
  if (lt >= bS('pe2') - .07 && lt < ESC.stand) { capeU = ss(lt, ESC.tie[0], ESC.tie[1]); o.expr = 'smug'; o.yaw = .1; o.headYaw = .2; o.look = [.3, -.2]; gl = [-26, -26]; gr = [26, -26]; }   /* he knots the sheet round his neck */
  if (lt >= ESC.stand && lt < ESC.sill) {                                                                                                         /* standing on the bed, caped, hands on hips */
    const p = at(POS.pear[0], 1600), y = P2(POS.pear[0], BED.top + 4, 1600)[1];
    o = Object.assign(o, { x: p.x, y, s: p.s, noLegs: false, yaw: .25, headYaw: .45, look: [.7, -.5], expr: 'smug', arms: { l: 'hips', r: 'hips' } }); capeU = 1; gl = null;
  }
  if (lt >= ESC.sill) {                                                                                                                           /* on the sill, back to us, a look over the shoulder; then out */
    const hop = ss(lt, ESC.hop, ESC.hop + .5), Zs = lerp(1786, 1900, hop), X = lerp(300, 300, hop), p = at(X, Zs), y = P2(X, WIN.y0 + lerp(0, 60, bump(hop, 0, .6)) - lerp(0, 380, ss(hop, .45, 1)), Zs)[1];
    o = Object.assign(o, { x: p.x, y, s: p.s, noLegs: false, yaw: PI, headYaw: PI + 1.15 * (1 - hop), look: [-.6, 0], expr: 'smug', arms: { l: 'up', r: 'up' }, transit: hop > .02 }); capeU = 1; back = true; gl = null; inside = hop < .4;
  }
  if (gl) o.grip = { l: reach(o, 'l', gl), r: reach(o, 'r', gr) };
  o.hold = hold;
  return { o: A7.pear(o), z: POS.pear[1], name: 'pearR', capeU, back, inside, gone: lt >= ESC.hop + .5 };
}
/* the call-light pendant in his hand: a grey box on a cord, a red button that lights when he presses it */
EXT.prop.fp21m_bell = (side, o, t) => {
  const pr = .5 + .5 * Math.sin(t * 14) > .6;
  ctx.save(); ctx.rotate(-.3); ctx.fillStyle = '#c9ced6'; ctx.strokeStyle = INKD; ctx.lineWidth = 2; rr(-9, -26, 18, 34, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = pr ? '#ff4a4a' : '#a12a2a'; ell(0, -16, 5.5, 5.5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(14, 40, -6, 70); ctx.stroke(); ctx.restore();
  if (pr) V2.emit(0, 0, 0, '255,80,80', 0);
};
PROP_BOX.fp21m_bell = Object.assign([-12, -30, 12, 10], { nearFace: true });

// ------------------------------------------------------------------ CAMERAS: each half frames the room with its own 2D camera { cx, cy (a point of the zoom-1 picture), z }, put at the half's anchor
const AY = 850;                                                                /* the vertical anchor of every half (the middle of the picture between the chips and the captions) */
const fcOf = c => faceC(c.o);
function framing(side, sh, lt, F) {
  const { kale, straw, pear, cart } = F, u = sg(lt, sh.s, sh.e);
  const fk = kale ? fcOf(kale) : [249, 890], fs = fcOf(straw), fp = fcOf(pear);
  const face = (f, z, up = 70) => ({ cx: f[0], cy: f[1] + up / z, z });
  const two = (a, b, z, dy = 40) => ({ cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 + dy, z });
  const id = sh.id, L = side === 'L';
  const door = [P2(-350, 0, RM.zb)[0], 860];
  let f;
  switch (id) {
    case 'open': f = { cx: 540, cy: 905, z: .8 }; break;
    case 'ka1': f = L ? two(fk, fs, 1.28, 50) : two([P2(POS.kale[0], 0, RM.zb)[0], fk[1]], [P2(SPOT[0], 0, SPOT[1])[0], fs[1]], 1.28, 50); break;
    case 's1': f = face(L ? fs : [P2(SPOT[0], 0, SPOT[1])[0], fs[1]], 1.85); break;
    case 'hyg': { const nz = cartL(lt).nozzle, sx = P2(SPOT[0], 0, SPOT[1])[0]; f = { cx: (sx + nz[0]) / 2 + 6, cy: fs[1] + (L ? 30 : -40), z: L ? 1.62 : 1.45 }; break; }
    case 's2': f = L ? two(fs, fp, .98, 46) : face(fs, 1.7, 90); break;
    case 'pe1': f = face(fp, 1.95, 60); break;
    case 'ka4': f = L ? face(fk, 1.95) : { cx: cart.x + 6, cy: cart.y - 170 * cart.k, z: 1.42 }; break;
    case 's7': { const c = cartL(lt), fl = L ? fs : faceC(strawLOpts(lt, sh).o); f = { cx: (fl[0] + c.lock[0]) / 2 + 30, cy: (fl[1] + c.lock[1]) / 2 + 30, z: 1.5 }; break; }
    case 'ka5': f = L ? two(fk, fs, 1.16, 56) : { cx: door[0] + 16, cy: 860, z: 1.42 }; break;
    case 's8': f = two(fs, fp, 1.06, 40); break;
    case 'ka2': f = L ? face(fk, 1.72) : { cx: door[0] + 10, cy: 850, z: 1.4 }; break;
    case 's3': { const clk = P2(CLK.X, CLK.Y, RM.zb), sx = L ? fs : [P2(SPOT[0], 0, SPOT[1])[0], fs[1]]; f = { cx: (clk[0] + sx[0]) / 2 + 4, cy: (clk[1] + sx[1]) / 2 + 46, z: 1.18 }; break; }
    case 'ka3': f = L ? face(fk, 2.2) : face(fs, 1.8, 60); break;
    case 's4': f = L ? { cx: 430, cy: 890, z: .98 } : face(fp, 1.65, 70); break;
    case 'pe2': f = L ? two(fs, fp, 1.26, 34) : face(fp, 1.4, 40); break;
    case 'pe3': f = L ? two(fs, fp, 1.32, 30) : { cx: P2(POS.pear[0], 0, 1700)[0] + 10, cy: 740, z: 1.15 }; break;
    case 'pe4': f = L ? face(fp, 1.8, 120) : { cx: P2(300, 0, RM.zb)[0] - 10, cy: 690, z: 1.32 }; break;
    case 'end': f = L ? { cx: 500, cy: 905, z: .8 } : { cx: 690, cy: 860, z: .92 }; break;
    default: f = { cx: 540, cy: 900, z: 1 };
  }
  f.z *= 1 + .035 * easeIO(u);                                                  /* a slow push through every shot */
  return f;
}
/* the frame's cast and props for one side (built once per half per frame) */
function castFor(side, lt) {
  const sh = shotAt(lt);
  if (side === 'L') return { sh, kale: kaleOpts(lt, sh), straw: strawLOpts(lt, sh), pear: pearLOpts(lt, sh), cart: cartL(lt) };
  return { sh, kale: null, straw: strawROpts(lt), pear: pearROpts(lt), cart: cartR(lt) };
}

// ------------------------------------------------------------------ LIGHT: the left is soft, warm and clean; the right is fluorescent, cooler, and the call lights wash it red
function lightFor(side, lt, G) {
  if (side === 'L') {
    V2.setLight({ key: [.3, -.6], keyColor: '#fff1dc', keyA: .2, rim: '#ffd9a8', rimA: .35, shadow: '#3a2e40', shadowA: .3, bounce: '#ffe6c8', bounceA: .14, amb: '#fff4e6', ambA: .08 });
  } else {
    V2.setLight({ key: [-.2, -.7], keyColor: '#eafff2', keyA: .22, rim: '#ff8a7a', rimA: .42, shadow: '#1e2638', shadowA: .38, bounce: '#cfe8ff', bounceA: .1, amb: '#e0fff0', ambA: .06 });
    const [dx, dy] = P2(-350, 470, RM.zb), lv = .5 + .5 * Math.sin(lt * 3.45);
    V2.addLight({ x: dx, y: dy, r: 520, color: '255,90,80', a: .2 + .12 * lv });
  }
}

// ------------------------------------------------------------------ ONE HALF: the camera, the room, the cast in depth order, the effects; then the half's own audit
function camApply(f, ax, ay) { ctx.translate(ax, ay); ctx.scale(f.z, f.z); ctx.translate(-f.cx, -f.cy); }
function drawChar21(o, box) {                                                  /* a character wholly outside this half is not drawn (nothing of it would show) */
  const k = KINDS[o.kind] || KINDS.straw, s = o.s || 1, leg = o.noLegs ? 0 : (k.leg || 90);
  const b = boxScreen(o.x - k.rx * 1.15 * s, o.y - (leg + k.ry * 2 + 80) * s, o.x + k.rx * 1.15 * s, o.y + 10 * s);
  if (b[2] < box[0] || b[0] > box[2]) return false;
  drawChar(o); return true;
}
function panelCheck(n0, box, side, loose) {
  if (!REG.on) return;
  for (let i = n0; i < REG.items.length; i++) {
    const it = REG.items[i];
    if (['face', 'head', 'prop'].includes(it.type) && !it.transit && !loose) {
      const b = it.box;
      if (b[0] < box[0] + 4 || b[2] > box[2] - 4) REG.errors.push(`${it.type}:${it.id || '?'} is cut by the divider (${side} half) [${b.map(Math.round)}]`);
      else if (it.type === 'face' && b[1] < 336) REG.errors.push(`face:${it.id || '?'} runs under the half's chip [${b.map(Math.round)}]`);
    }
    /* what is registered in a half can only be seen inside it: clip the box to the half so nothing in one world is said to cover something in the other */
    it.box = [Math.max(it.box[0], box[0]), it.box[1], Math.min(it.box[2], box[2]), it.box[3]];
    if (it.box[2] < it.box[0]) it.box[2] = it.box[0];
  }
}
function drawHalf(side, lt, box, o = {}) {
  HALF = { side, box };
  const F = castFor(side, lt), sh = F.sh, f = o.cam || framing(side, sh, lt, F), ax = o.ax ?? (box[0] + box[2]) / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]); ctx.clip();
  camApply(f, ax, AY);
  V2.setCam(PC); lightFor(side, lt); V2.opts.reflect = true;
  const n0 = REG.items.length, R = side === 'R';
  const c = F.cart, st = F.straw, pe = F.pear;
  /* the room, with what is seen through the doorway (the runaway cart, a running nurse) and through the window (Mr. Pear, out) */
  REG.suppress++;
  const hallKids = () => {
    if (R && c.inHall) medCart(c.X, c.Z, c.opts);
    if (R && st.z > RM.zb - 6) drawChar21(st.o, box);
  };
  const windowKids = () => { if (R && pe.o && !pe.inside && !pe.gone) { cape(pe.o, lt, pe.capeU, true); drawChar(pe.o); cape(pe.o, lt, pe.capeU, true); } };
  REG.suppress--;
  REG.suppress++;
  drawRoom(lt, side, { hallKids, windowKids, winOpen: R ? ss(lt, ESC.sill - .5, ESC.sill + .1) : 0, clockSpin: R ? bump(lt, bS('s3') - .1, bE('s3') + .45) : 0, clockMin: R && lt > bS('s3') - .1 ? 30 + 240 * ss(lt, bS('s3') - .1, bE('s3') + .45) : null });
  REG.suppress--;
  /* Mr. Pear (on the sill he stands in front of the frame; in bed he is between the mattress and the blanket) */
  if (!(R && (lt >= ESC.sill))) {
    if (R && lt >= ESC.stand) { cape(pe.o, lt, pe.capeU, false); drawChar21(pe.o, box); }
    else { if (R) cape(pe.o, lt, pe.capeU, false); drawChar21(pe.o, box); }
    if (!R && lt >= HALO_T) halo(pe.o, lt);
  } else if (pe.inside) { drawChar21(pe.o, box); cape(pe.o, lt, pe.capeU, true); }
  REG.suppress++; bedFront(lt, side, { ruck: R && lt >= bS('pe2') - .07 ? 1 : 0, noBlanket: false }); REG.suppress--;
  if (!R) drawChar21(F.kale.o, box);
  /* the nurse, then the cart in front of her (the cart's z is nearer) */
  const items = [{ z: st.z, fn: () => { if (!(R && st.z > RM.zb - 6)) { drawChar21(st.o, box); if (R && st.o.juggle) juggleDraw(st.o, lt); } } }, { z: c.Z, fn: () => { if (!(R && c.inHall)) { REG.suppress++; medCart(c.X, c.Z, c.opts); REG.suppress--; } } }];
  for (const it of items.sort((a, b) => b.z - a.z)) it.fn();
  REG.suppress++; footboard(); REG.suppress--;
  if (R) pillFx(lt, F);
  panelCheck(n0, box, side, o.loose);
  /* the half's grade: the left warm and soft, the right cool and fluorescent */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = R ? 'rgba(120,190,255,.22)' : 'rgba(255,214,160,.2)'; ctx.fillRect(box[0], 0, box[2] - box[0], H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  HALF = null;
  return F;
}
function footboard() { const B = BED; S6.box3({ x0: B.x0 - 6, x1: B.x1 + 6, y0: 40, y1: 212, z0: B.z0 - 12, z1: B.z0, color: '#86705e', top: '#97806c', side: '#6e5a4a' }); }

// ------------------------------------------------------------------ EFFECTS of a normal night: the juggled cups, the pills that fly at the clatter, the pills poured into Mr. Pear
const bodyPt = (o, lx, ly) => { const k = KINDS[o.kind], s = o.s || 1, leg = o.noLegs ? 0 : (k.leg || 90); return [o.x + lx * s, o.y - (o.lift || 0) - (leg + k.ry * .9) * s + ly * s]; };
function juggleDraw(o, lt) {
  const J = o.juggle, s = o.s;
  for (const cp of J.cups) { const [x, y] = bodyPt(o, cp.x, cp.y); ctx.save(); ctx.translate(x, y); cupShape(ctx, s * 1.05, cp.rot, 2); ctx.restore(); }
  const k = lt - CUE.clat1;                                                     /* the clatter: a knock where two cups meet at the top, four pills thrown out */
  if (k > 0 && k < .7) {
    const [x, y] = bodyPt(o, 0, -150);
    if (k < .18) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k / .18) + ')'; ctx.lineWidth = 3 * s; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 22 * s, y + Math.sin(a) * 22 * s); ctx.lineTo(x + Math.cos(a) * 44 * s, y + Math.sin(a) * 44 * s); ctx.stroke(); } ctx.restore(); }
    for (let i = 0; i < 5; i++) { const vx = (sr(i, 31) - .5) * 520, vy = -260 - 200 * sr(i, 32); pillShape(ctx, x + vx * k * s, y + (vy * k + 900 * k * k) * s, s * 1.2, k * 9 + i, PILLC[i]); }
  }
}
function pillFx(lt, F) {
  const st = F.straw, pe = F.pear, k = lt - (CUE.clat2 - .12);
  if (st.mode !== 'dispense' || k <= 0 || k > .7) return;
  const o = st.o, s = o.s, g = o.grip && o.grip.r ? o.grip.r : [100, -30], [hx, hy] = bodyPt(o, g[0], g[1] - 30), po = pe.o, ps = po.s;
  const [mx, my] = bodyPt(po, -18 * Math.sin(-(po.headYaw || 0)) - 6, 52);
  for (let i = 0; i < 9; i++) {
    const u = (k - i * .045) / .3; if (u <= 0 || u >= 1) continue;
    const x = lerp(hx, mx, u), y = lerp(hy, my, u) - 60 * s * Math.sin(PI * u);
    pillShape(ctx, x, y, s * 1.15, u * 6 + i, PILLC[i % 6]);
  }
}

// ------------------------------------------------------------------ THE SPLIT: H21.split when the kit has it; a stand-in of the same signature until then
const CHIP = { L: 'WITH THE STATE', R: 'A NORMAL NIGHT', cL: '#2f5f9a', cR: '#d6453a', y: 296 };
const chipK = lt => c01((lt - (WIPE.b + .02)) / .3);
function chip(str, cx, col, lt, maxW) {
  const k = chipK(lt); if (k <= 0) return;
  const sc = eb(k);
  ctx.save(); ctx.translate(cx, CHIP.y); ctx.scale(sc, sc); ctx.translate(-cx, -CHIP.y);
  UI.pill(str, cx, CHIP.y, { size: 30, fill: col, ink: '#ffffff', stroke: 'rgba(255,255,255,.92)', lw: 3, h: 52, maxW, id: 'chip' + str.length, shadow: 10 });
  ctx.restore();
}
function band(x, y0, y1, lt) {                                                  /* the divider: a crisp white band with a soft shadow each side */
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = V2.grad(x - GAP / 2 - 22, 0, x - GAP / 2, 0, [[0, 'rgba(10,8,24,0)'], [1, 'rgba(10,8,24,.38)']]); ctx.fillRect(x - GAP / 2 - 22, y0, 22, y1 - y0);
  ctx.fillStyle = V2.grad(x + GAP / 2, 0, x + GAP / 2 + 22, 0, [[0, 'rgba(10,8,24,.38)'], [1, 'rgba(10,8,24,0)']]); ctx.fillRect(x + GAP / 2, y0, 22, y1 - y0);
  ctx.fillStyle = '#fbfbf7'; ctx.fillRect(x - GAP / 2, y0, GAP, y1 - y0);
  ctx.fillStyle = 'rgba(25,20,40,.35)'; ctx.fillRect(x - GAP / 2, y0, 1.5, y1 - y0); ctx.fillRect(x + GAP / 2 - 1.5, y0, 1.5, y1 - y0);
  if (y1 < H - 1) { V2.glow(x, y1, 60, '255,255,255', .7, 'screen', .4); }
  reg('panel', [x - GAP / 2, y0, x + GAP / 2, y1], { id: 'divider' });
  ctx.restore();
}
function splitStand(c, o, dl, dr) {
  const x = o.x, L = [0, 0, x - o.gap / 2, H], R = [x + o.gap / 2, 0, W, H];
  dl(c, L); dr(c, R);
  band(x, 0, H, o.t);
  if (o.labelL) chip(o.labelL, L[2] / 2, o.colorL, o.t, L[2] - L[0] - 64);
  if (o.labelR) chip(o.labelR, (R[0] + R[2]) / 2, o.colorR, o.t, R[2] - R[0] - 64);
}
const toBox = b => Array.isArray(b) ? (b.length === 4 && b[2] > b[0] ? b : [b[0], b[1], b[0] + b[2], b[1] + b[3]]) : b && b.x1 != null ? [b.x0, b.y0, b.x1, b.y1] : b && b.w != null ? [b.x, b.y, b.x + b.w, b.y + b.h] : [0, 0, W, H];

// ------------------------------------------------------------------ THE SCENE
function drawOpen(lt) {                                                         /* one picture of the room; the band falls from the top and, above its front, the right half is a normal night */
  const y = wipeY(lt), F = castFor('L', lt), cam = framing('L', shotAt(lt), lt, F);
  drawHalf('L', lt, [0, 0, W, H], { cam, ax: 540, loose: true });
  if (y > 1) { drawHalf('R', lt, [540 + GAP / 2, 0, W, y], { cam, ax: 540, loose: true }); band(540, 0, y, lt); }
}
function drawSplit(lt) {
  const x = DIV(lt), o = { t: lt, x, angle: 0, gap: GAP, labelL: CHIP.L, labelR: CHIP.R, colorL: CHIP.cL, colorR: CHIP.cR };
  const dl = (c, b) => drawHalf('L', lt, toBox(b)), dr = (c, b) => drawHalf('R', lt, toBox(b));
  if (has('H21', 'split')) H21.split(ctx, o, dl, dr); else splitStand(ctx, o, dl, dr);
}
const SC21 = {
  shot: lt => shotAt(lt).id,
  cam(lt) { V2.setCam(PC); CAM.x = W / 2; CAM.y = H / 2; CAM.z = 1; CAM.r = 0; },
  draw(lt) { if (lt < WIPE.b) drawOpen(lt); else drawSplit(lt); },
  fx: lt => ({ bloom: .32, vignette: .22, grain: .04, contrast: .08, sat: .06 }),
  blur: lt => nearCut(lt) ? 1 : ((lt > 4.05 && lt < 4.7) || (lt > CUE.cartroll && lt < CUE.cartroll + 1.2) || (lt > WIPE.a && lt < WIPE.b)) ? 3 : 2,
  over(lt) {},
};
window.__EP21_SCENES = window.__EP21_SCENES || {};
window.__EP21_SCENES.medpass = SC21;
})();
