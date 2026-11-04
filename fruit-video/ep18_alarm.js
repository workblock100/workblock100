'use strict';
/* SHIFT HAPPENS, Episode 18: The Fire Drill. Scene module: alarm (8:00 PM, CODE RED, 30.443 s). Builder ALARM. Registers window.__EP18_SCENES.alarm. The doors, the linen cart and the sounds come from ep18_alarm_sim.js (ONE table for
 * the picture and for build/ep18/door_events.json, written by tools_door_events.js). The shared props are in ep18_props.js (window.P18); light and matter are FX18 (guarded at draw time, with stand-ins).
 *
 * THE SET: the Unit B corridor in one-point perspective, drawn here (V2.setCam per shot, V2.p2 projects): a glossy floor with reflections and light pools under the troffers, walls with a handrail and room doors, a ceiling with panels, the PA
 * speaker and wall strobes, the alarm panel / Binder tablet on the near left wall (seen edge-on; the readable versions are the wall insert and P18), and SIX double fire doors (the sim's ZH) that swing shut from the side walls, far to near.
 * World units are sprite pixels at scale 1 (a person is about 400 tall); the walls are at X = +-440; everybody is drawn at CS = .92 of the corridor's scale.
 * THE LIGHT: the horn (temporal three: horn3 .9 to hornstop 20.948) pulses a red emergency tint and a white strobe wash on the same pulses (FX18.hornOn / strobe numbers); after the snooze the corridor is cold blue-white and one tube flickers.
 *
 * SHOTS (scene-local s; kind corr = the corridor under a 3D camera plus a 2D framing, kind wall = the frontal wall insert):
 *  open 0-1.55 wide, the panel LCD DRILL, pachime .2, horn3 .9 | pa 1.55-3.05 wide and higher, everyone looks up at the speaker, the holder LEDs turn red far to near, the far door lets go | pb 3.05-4.01 three-shot (Strawberry, Lemon, Onion) |
 *  l1 4.01-5.19 Lemon low-angle CU in the strobe, the RACE chip (R) | s1a 5.19-6.75 and s1b 6.75-8.2 Strawberry med pass (A, C, E: EIGHT O'CLOCK MEDS) while Lemon sprints away | m1 8.2-9.46 Mango: the doors are closing |
 *  c1 9.46-11.2 the cascade from behind Lemon on a long lens (doors 0, 1, 2 slam: dust, ring, shake, a flash on the leaf, the glass glints) | c2 11.2-12.9 near end wide, doors 3 and 4 slam, Mango pushes her cart at the last door |
 *  bonk 12.9-13.86 the nearest door meets the cart's corners at doorbonk 13.006 (stars, sparks, the cart rocks, the linen is thrown) | o1 13.86-16.1 Onion; the door slams shut at 15.2 (Lemon on the wrong side, her face on the glass) |
 *  b1 16.1-18.85 wall insert: Binder pops out of the tablet at binderpop 16.171, the bubble types with his words | s2 18.85-19.35 Strawberry CU "No." | b2 19.35-20.948 the pointer chases Dismiss, Snooze is pressed at click 20.898 (the LCD flips to
 *  SNOOZED 10:00), CUT at hornstop 20.948 | q 20.948-22.41 the silence: cold light, a frozen tableau, one flickering tube, Binder's grin at grin 21.098 | p1a 22.41-23.7 the Marshal, flashlight | p1b 23.7-24.88 the beam on the LCD |
 *  b3 24.88-26.0 DOORS: PENDING, the holder lamps stay red | l2 26.0-27.95 Lemon through the wire glass | m2 27.95-30.44 Mango, the wrong side, a slow push-in; the tube dies on the sting 29.093.
 */
(() => {
if (!window.TIMELINE_EP18 || !window.H6 || !window.V2 || !window.UI) return;
const { zoomTo } = window.H6;
const A6 = window.A6, A7 = window.A7, A11 = window.A11, A15 = window.A15, P18 = window.P18 || {};
const PI = Math.PI, TAU = PI * 2;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP18, SCN = TLX.scenes.find(s => s.id === 'alarm'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'alarm') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
/* the sound cues of the scene (scene-local seconds; python3 /tmp/shift_tools/cues.py 18 alarm), snapped to the video frame nearest each */
const CUE = { pachime: .2, horn3: .9, doorbonk: 13.006, sniffle: 15.356, binderpop: 16.171, click: 20.898, hornstop: 20.948, grin: 21.098, sting: 29.093 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);
const FX = () => (typeof FX18 !== 'undefined' && FX18) || null;
/* the horn: k = seconds since horn3, -1 before it starts or once hornstop has passed (FX18's own pattern; the same numbers as a stand-in) */
function hornK(lt) { return lt < CUE.horn3 || lt >= CUE.hornstop ? -1 : lt - CUE.horn3; }
function hornOn(k) { if (k < 0) return 0; const m = k % 4; return (m < .5 || (m >= 1 && m < 1.5) || (m >= 2 && m < 2.5)) ? 1 : 0; }
function strobeOf(k) {
  if (k < 0) return 0; const F = FX(); if (F && typeof F.strobe === 'function') return F.strobe(k);
  const m = k % 4, ps = m >= 2 ? 2 : m >= 1 ? 1 : 0, a = m - ps; return (m < 2.5 + 1.1) ? Math.exp(-a / .22) * (ps === 2 && a > 1.1 ? 0 : 1) : 0;
}

// ------------------------------------------------------------------ the sim (doors, cart, linen): one table for the picture and the sound
let SIM = null;
const sim = () => SIM || (SIM = window.__EP18_SIMS.alarm.build());
const closure = (i, lt) => sim().closure(i, lt);

// ------------------------------------------------------------------ the corridor (own one-point perspective; V2.setCam is set per shot, V2.p2 projects)
const HW = 440, CH = 700, DH = 540, ZEND = 8000, ZH = [5600, 4600, 3750, 3050, 2400, 1750], RAIL = 190;
const P3 = (X, Y, Z) => V2.p2(X, Y, Z);
const kAt = Z => V2.P.f / (Z - V2.P.cz);
const FOG = [24, 31, 46];
function col(rgb, Z, amt = .62) {   /* a colour pulled toward the dark blue of the far end with depth */
  const t = c01((Z - V2.P.cz - 1800) / 9500) ** .8 * amt;
  return `rgb(${Math.round(mix(rgb[0], FOG[0], t))},${Math.round(mix(rgb[1], FOG[1], t))},${Math.round(mix(rgb[2], FOG[2], t))})`;
}
function quad3(a, b, c, d, fill, stroke, lw) {
  const A = P3(...a), B = P3(...b), C = P3(...c), D = P3(...d);
  ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.stroke(); }
}
const clipQuad = (a, b, c, d) => { const A = P3(...a), B = P3(...b), C = P3(...c), D = P3(...d); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.clip(); };

/* the state of the light at lt: k (horn clock), on (the horn is sounding), fl (strobe envelope 0..1), cold (0 hot/red .. 1 cold fluorescent) */
function lightAt(lt) {
  const k = hornK(lt), on = hornOn(k), fl = strobeOf(k);
  const cold = lt >= CUE.hornstop ? 1 : 0;
  return { k, on, fl, cold, alarm: lt >= CUE.horn3 && lt < CUE.hornstop };
}

function shell(L, lt) {
  const cz = V2.P.cz, Zn = cz + 230, Zf = ZEND, red = L.alarm ? .1 + .28 * L.on : 0;
  const tint = (rgb, a = 1) => { const m = [rgb[0] * (1 - red * .55) + 255 * red * .2, rgb[1] * (1 - red * .62), rgb[2] * (1 - red * .62)]; return m; };
  /* the end wall: dark, with a lit exit door and a window */
  quad3([-HW, 0, Zf], [-HW, CH, Zf], [HW, CH, Zf], [HW, 0, Zf], '#1c2433');
  quad3([-150, 0, Zf - 2], [-150, 470, Zf - 2], [150, 470, Zf - 2], [150, 0, Zf - 2], '#2d3d55', 'rgba(10,14,24,.7)', 2);
  quad3([-90, 140, Zf - 3], [-90, 400, Zf - 3], [90, 400, Zf - 3], [90, 140, Zf - 3], 'rgb(120,170,200)');
  /* the floor: polished vinyl in a blue-grey, a cove band along each wall, long tile lines and cross lines */
  const yF = P3(0, 0, Zf)[1], yN = Math.min(2300, P3(0, 0, Zn)[1]);
  ctx.save(); clipQuad([-HW, 0, Zn], [-HW, 0, Zf], [HW, 0, Zf], [HW, 0, Zn]);
  ctx.fillStyle = V2.grad(0, yF, 0, yN, [[0, '#161c28'], [.35, '#2a3444'], [1, '#566274']]); ctx.fillRect(0, yF - 4, W, yN - yF + 8);
  ctx.strokeStyle = 'rgba(20,26,38,.22)'; ctx.lineWidth = 2;
  for (let j = -3; j <= 3; j++) { const X = j * HW / 3.4; const a = P3(X, 0, Zn), b = P3(X, 0, Zf); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  for (let Z = Math.ceil(Zn / 500) * 500; Z < Zf; Z += 500) { const a = P3(-HW, 0, Z), b = P3(HW, 0, Z); ctx.strokeStyle = 'rgba(20,26,38,' + (.2 - .12 * c01(Z / ZEND)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  for (const s of [-1, 1]) quad3([s * HW, 0, Zn], [s * (HW - 60), 0, Zn], [s * (HW - 60), 0, Zf], [s * HW, 0, Zf], 'rgba(150,172,190,.2)');
  ctx.restore();
  /* the ceiling */
  ctx.save(); clipQuad([-HW, CH, Zn], [-HW, CH, Zf], [HW, CH, Zf], [HW, CH, Zn]);
  const yC0 = P3(0, CH, Zf)[1], yC1 = P3(0, CH, Zn)[1];
  ctx.fillStyle = V2.grad(0, yC0, 0, Math.min(yC1, yC0 - 2200), [[0, '#1c2230'], [1, '#7a8696']]); ctx.fillRect(0, Math.min(yC0, yC1) - 2300, W, Math.abs(yC1 - yC0) + 2400);
  ctx.strokeStyle = 'rgba(30,38,52,.35)'; ctx.lineWidth = 2;
  for (const X of [-HW / 2, 0, HW / 2]) { const a = P3(X, CH, Zn), b = P3(X, CH, Zf); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  for (let Z = Math.ceil(Zn / 440) * 440; Z < Zf; Z += 440) { const a = P3(-HW, CH, Z), b = P3(HW, CH, Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  ctx.restore();
  /* the walls: pale paint above the handrail, a teal wainscot below, a mustard stripe, the handrail and the baseboard; shaded toward the far end */
  for (const s of [-1, 1]) {
    const x = s * HW, shade = s < 0 ? 1 : .86;
    const upA = P3(x, CH, Zn), upB = P3(x, CH, Zf);
    ctx.save(); clipQuad([x, 0, Zn], [x, CH, Zn], [x, CH, Zf], [x, 0, Zf]);
    const gy0 = P3(x, 350, Zn), gy1 = P3(x, 350, Zf);
    const g = ctx.createLinearGradient(gy0[0], gy0[1], gy1[0], gy1[1]);
    g.addColorStop(0, `rgb(${150 * shade | 0},${170 * shade | 0},${178 * shade | 0})`); g.addColorStop(.5, `rgb(${74 * shade | 0},${92 * shade | 0},${108 * shade | 0})`); g.addColorStop(1, '#141b28');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const w0 = P3(x, RAIL + 20, Zn), w1 = P3(x, 0, Zn), wf = P3(x, RAIL + 20, Zf), wf2 = P3(x, 0, Zf);
    const gw = ctx.createLinearGradient(w1[0], w1[1], wf2[0], wf2[1]);
    gw.addColorStop(0, `rgb(${58 * shade | 0},${104 * shade | 0},${116 * shade | 0})`); gw.addColorStop(.55, `rgb(${34 * shade | 0},${58 * shade | 0},${72 * shade | 0})`); gw.addColorStop(1, '#101824');
    ctx.fillStyle = gw; ctx.beginPath(); ctx.moveTo(w0[0], w0[1]); ctx.lineTo(wf[0], wf[1]); ctx.lineTo(wf2[0], wf2[1]); ctx.lineTo(w1[0], w1[1]); ctx.closePath(); ctx.fill();
    quad3([x, 300, Zn], [x, 330, Zn], [x, 330, Zf], [x, 300, Zf], 'rgba(222,170,60,.8)');                                          /* the mustard stripe */
    quad3([x, 0, Zn], [x, 34, Zn], [x, 34, Zf], [x, 0, Zf], 'rgba(18,26,38,.5)');                                                 /* the baseboard */
    for (let Z = Math.ceil(Zn / 600) * 600; Z < Zf; Z += 600) { const a = P3(x, 330, Z), b = P3(x, CH, Z); ctx.strokeStyle = 'rgba(20,30,44,.16)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.restore();
    const xr = s * (HW - 34);
    quad3([xr, RAIL - 18, Zn], [xr, RAIL + 18, Zn], [xr, RAIL + 18, Zf], [xr, RAIL - 18, Zf], '#b98c55');                          /* the handrail */
    quad3([x - s * 16, RAIL + 18, Zn], [xr, RAIL + 18, Zn], [xr, RAIL + 18, Zf], [x - s * 16, RAIL + 18, Zf], 'rgba(255,235,200,.3)');
  }
}
/* a wooden room door set in the wall (side s, centred at depth Z) */
function roomDoor(s, Z, lit) {
  const x = s * HW, w = 100;
  quad3([x, 0, Z - w - 14], [x, 440, Z - w - 14], [x, 440, Z + w + 14], [x, 0, Z + w + 14], col([70, 52, 40], Z));
  quad3([x, 0, Z - w], [x, 424, Z - w], [x, 424, Z + w], [x, 0, Z + w], col([150, 118, 88], Z));
  quad3([x, 262, Z - w + 22], [x, 394, Z - w + 22], [x, 394, Z + w - 22], [x, 262, Z + w - 22], col([126, 98, 72], Z));
  quad3([x, 44, Z - w + 22], [x, 232, Z - w + 22], [x, 232, Z + w - 22], [x, 44, Z + w - 22], col([126, 98, 72], Z));
  quad3([x, 200, Z + w - 54], [x, 214, Z + w - 54], [x, 214, Z + w - 24], [x, 200, Z + w - 24], col([206, 212, 218], Z));
  quad3([x, 452, Z - 34], [x, 486, Z - 34], [x, 486, Z + 34], [x, 452, Z + 34], col([232, 236, 238], Z), 'rgba(20,26,36,.5)', 1.5);   /* the room number plate (no lettering: set dressing) */
  if (lit) quad3([x, 0, Z - w], [x, 424, Z - w], [x, 424, Z + w], [x, 0, Z + w], 'rgba(255,60,40,' + lit + ')');
}
/* a ceiling troffer (a fluorescent light panel): level 0..1, tint 0 warm .. 1 cold */
function troffer(Z, level, cold) {
  const dark = [70, 76, 88], warm = [255, 247, 224], cd = [214, 232, 255], lit = cold > .5 ? cd : warm;
  const r = Math.round(mix(dark[0], lit[0], level)), g = Math.round(mix(dark[1], lit[1], level)), b = Math.round(mix(dark[2], lit[2], level));
  quad3([-100, CH - 1, Z - 210], [100, CH - 1, Z - 210], [100, CH - 1, Z + 210], [-100, CH - 1, Z + 210], `rgb(${r},${g},${b})`, 'rgba(40,46,60,.6)', 2);
  if (level > .05) { const p = P3(0, CH, Z), k = kAt(Z); V2.glow(p[0], p[1], 260 * k, cold > .5 ? '200,225,255' : '255,240,205', .5 * level, 'screen', .25); }
}
/* the ceiling PA speaker: a round grille, a lamp that lights while the page speaks */
function paSpeaker(X, Z, lamp) {
  const R = 78, pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; pts.push(P3(X + Math.cos(a) * R, CH - 2, Z + Math.sin(a) * R)); }
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = '#d9dee4'; ctx.fill(); ctx.strokeStyle = 'rgba(20,26,36,.8)'; ctx.lineWidth = 3; ctx.stroke();
  for (const rr2 of [.78, .56, .34]) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, p = P3(X + Math.cos(a) * R * rr2, CH - 3, Z + Math.sin(a) * R * rr2); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.strokeStyle = 'rgba(40,48,62,.55)'; ctx.lineWidth = 2.4; ctx.stroke(); }
  const c = P3(X + R * .62, CH - 3, Z - R * .62), k = kAt(Z);
  ctx.beginPath(); ctx.arc(c[0], c[1], 9 * k + 2, 0, TAU); ctx.fillStyle = lamp > .05 ? `rgb(255,${Math.round(150 + 90 * lamp)},${Math.round(80 + 60 * lamp)})` : '#6a4a3a'; ctx.fill(); ctx.strokeStyle = 'rgba(20,14,20,.8)'; ctx.lineWidth = 2; ctx.stroke();
  if (lamp > .05) V2.glow(c[0], c[1], 60 * k + 22, '255,214,150', .8 * lamp, 'screen', .4);
}
/* a wall horn and strobe: a small red box standing out from the wall, a lens that flashes on the horn's pulses */
function wallStrobe(s, Z, level) {
  const x = s * HW, xo = s * (HW - 40), y0 = 430, y1 = 590;
  quad3([xo, y0, Z - 50], [xo, y1, Z - 50], [xo, y1, Z + 50], [xo, y0, Z + 50], col([196, 34, 40], Z));
  quad3([x, y0, Z - 50], [x, y1, Z - 50], [xo, y1, Z - 50], [xo, y0, Z - 50], col([120, 18, 24], Z));
  const c = P3(xo, 508, Z), k = kAt(Z), F = FX();
  if (F && typeof F.lamp === 'function') F.lamp(ctx, { x: c[0], y: c[1], level, r: Math.max(5, 30 * k) });
  else { ctx.beginPath(); ctx.arc(c[0], c[1], Math.max(4, 28 * k), 0, TAU); ctx.fillStyle = level > .05 ? '#fff' : '#bfc6cf'; ctx.fill(); if (level > .05) V2.glow(c[0], c[1], 240 * k + 40, '255,240,220', .8 * level, 'screen', .5); }
}
/* the magnetic holder on the wall where the open leaf rests: a LED that is green (held) or red (released) */
function holder(s, Zh, red, lt) {
  const x = s * HW, xo = s * (HW - 24), Z = Zh + HW - 20;
  quad3([xo, 232, Z - 26], [xo, 300, Z - 26], [xo, 300, Z + 26], [xo, 232, Z + 26], col([160, 168, 178], Z), 'rgba(20,26,36,.7)', 1.5);
  quad3([x, 232, Z - 26], [x, 300, Z - 26], [xo, 300, Z - 26], [xo, 232, Z - 26], col([90, 98, 110], Z));
  const c = P3(xo, 278, Z), k = kAt(Z), r = Math.max(2.5, 11 * k), blink = red ? 1 : 1;
  ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, TAU); ctx.fillStyle = red ? '#ff3a30' : '#37e06d'; ctx.fill();
  V2.glow(c[0], c[1], Math.max(22, 70 * k), red ? '255,60,50' : '60,240,120', (red ? .85 : .6) * blink, 'screen', .4);
}

/* a double fire door at depth ZH[i] with closure c (0 open against the walls, 1 shut): header, two leaves (kick plate, hinges, window, push plate, sign, closer), the holders */
function fireDoor(i, c, lt, L, o = {}) {
  const Zh = ZH[i], phi = c * PI / 2, sn = Math.sin(phi), cs = Math.cos(phi), Zf = Zh + HW * cs;
  quad3([-HW, DH, Zh], [-HW, CH, Zh], [HW, CH, Zh], [HW, DH, Zh], col([150, 164, 176], Zh), 'rgba(20,26,36,.55)', 2);                  /* the header above the leaves */
  quad3([-HW, DH, Zh], [-HW, DH + 24, Zh], [HW, DH + 24, Zh], [HW, DH, Zh], col([88, 98, 112], Zh));
  for (const s of [-1, 1]) {
    const Xf = s * HW * (1 - sn), shade = .7 + .3 * (1 - cs), base = [196 * shade, 208 * shade, 218 * shade];
    const M = (u, v) => P3(mix(s * HW, Xf, u), v * DH, mix(Zh, Zf, u)), Mp = (u, v) => [mix(s * HW, Xf, u), v * DH, mix(Zh, Zf, u)];
    const poly = pts => { ctx.beginPath(); pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };
    const leaf = [M(0, 0), M(0, 1), M(1, 1), M(1, 0)], g0 = M(0, .5), g1 = M(1, .5), win = o.noWindow ? null : [M(.22, .3), M(.22, .78), M(.78, .78), M(.78, .3)];
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = -s * 8 * (1 - c);
    poly(leaf); if (win) { win.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
    const gg = ctx.createLinearGradient(g0[0], 0, g1[0] + (g1[0] === g0[0] ? 1 : 0), 0);
    gg.addColorStop(0, col(base.map(v => v * .86), Zh)); gg.addColorStop(.5, col(base, Zh)); gg.addColorStop(1, col(base.map(v => v * 1.06), Zh));
    ctx.fillStyle = gg; ctx.fill('evenodd'); ctx.restore();
    poly(leaf); ctx.strokeStyle = 'rgba(14,18,28,.85)'; ctx.lineWidth = Math.max(2, 4 * kAt(Zh)); ctx.lineJoin = 'round'; ctx.stroke();
    if (o.glint > .02) { poly(leaf); ctx.fillStyle = 'rgba(255,246,230,' + (.3 * o.glint) + ')'; ctx.fill(); }
    ctx.save(); poly(leaf); ctx.clip();
    poly([M(.06, .1), M(.06, .965), M(.94, .965), M(.94, .1)]); ctx.strokeStyle = 'rgba(60,72,88,.4)'; ctx.lineWidth = 2.4; ctx.stroke();
    poly([M(0, 0), M(0, .1), M(1, .1), M(1, 0)]); ctx.fillStyle = col([208, 214, 222].map(v => v * shade), Zh); ctx.fill();                  /* kick plate */
    poly([M(.74, .12), M(.74, .26), M(.93, .26), M(.93, .12)]); ctx.fillStyle = col([232, 236, 242].map(v => v * shade), Zh); ctx.fill(); ctx.strokeStyle = 'rgba(30,38,52,.7)'; ctx.lineWidth = 2; ctx.stroke();   /* push plate */
    poly([M(.12, .955), M(.12, .985), M(.52, .985), M(.52, .955)]); ctx.fillStyle = col([84, 92, 104], Zh); ctx.fill();                       /* the closer */
    ctx.restore();
    for (const v of [.12, .5, .88]) { poly([M(0, v - .03), M(0, v + .03), M(.04, v + .03), M(.04, v - .03)]); ctx.fillStyle = col([44, 50, 62], Zh); ctx.fill(); }
    if (win) {
      ctx.save(); poly(win); ctx.clip();
      ctx.fillStyle = 'rgba(150,196,215,.2)'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(205,224,232,.5)'; ctx.lineWidth = 1.5;
      for (let j = -8; j <= 8; j++) { const d = .07, a = M(.22 + j * d, .3), b = M(.22 + (j + 8) * d, .78), c2 = M(.22 + j * d, .78), e = M(.22 + (j + 8) * d, .3); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c2[0], c2[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.13)'; poly([M(.3, .3), M(.4, .3), M(.62, .78), M(.52, .78)]); ctx.fill();
      ctx.fillStyle = 'rgba(255,248,235,.16)'; poly([M(.22, .72), M(.78, .72), M(.78, .78), M(.22, .78)]); ctx.fill();
      if (o.glint > .02) { ctx.fillStyle = 'rgba(255,248,235,' + (.5 * o.glint) + ')'; poly(win); ctx.fill(); }
      ctx.restore(); poly(win); ctx.strokeStyle = col([60, 68, 80], Zh); ctx.lineWidth = Math.max(3, 8 * kAt(Zh)); ctx.stroke();
    }
    if (c > .9 && s < 0) {                                                                                                              /* the sign: only on the shut leaf (facing us), set dressing */
      poly([M(.16, .84), M(.16, .94), M(.84, .94), M(.84, .84)]); ctx.fillStyle = col([208, 40, 48], Zh); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.stroke();
      if (c > .985) { const a = M(.16, .84), b = M(.84, .94), pw = Math.abs(b[0] - a[0]), ph = Math.abs(a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        UI.label('FIRE DOOR', mx, my - ph * .2, { size: ph * .3, weight: 900, fill: '#fff4ee', spacing: ph * .04, maxW: pw * .86, hero: false, crop: true });
        UI.label('KEEP CLOSED', mx, my + ph * .22, { size: ph * .36, weight: 900, fill: '#fff4ee', spacing: ph * .02, maxW: pw * .9, hero: false, crop: true }); }
    }
  }
  if (c > .985) { const a = P3(0, 0, Zh - 2), b = P3(0, DH, Zh - 2); ctx.strokeStyle = 'rgba(10,14,24,.9)'; ctx.lineWidth = Math.max(3, 8 * kAt(Zh)); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }   /* the seam */
  for (const s of [-1, 1]) holder(s, Zh, holderRedAt(i, lt), lt);
}
const holderRedAt = (i, lt) => sim().holderRed(i, lt) > 0;

/* @@CORRIDOR_END@@ */

// ------------------------------------------------------------------ held props and the two carts
if (typeof EXT !== 'undefined' && EXT.prop && typeof PROP_BOX !== 'undefined') {
  /* fp18_bottle: an amber pill bottle in the right hand; o.botTilt tips the mouth (at the top) toward the cup on the left, o.botT drives the pills that tap out of it (o.botDrop = how far they fall) */
  EXT.prop.fp18_bottle = (side, o, t) => {
    const th = o.botTilt || 0, mx = -62 * Math.sin(th), my = -62 * Math.cos(th);
    ctx.save(); ctx.rotate(-th); ctx.lineJoin = 'round';
    rr(-17, -54, 34, 58, 7); ctx.fillStyle = V2.grad(-17, 0, 17, 0, [[0, '#f0a43a'], [.5, '#e48a1c'], [1, '#b86a12']]); ctx.fill(); ctx.strokeStyle = 'rgba(20,24,34,.9)'; ctx.lineWidth = 3.4; ctx.stroke();
    rr(-11, -64, 22, 12, 3); ctx.fillStyle = '#f7d79a'; ctx.fill(); ctx.stroke();
    rr(-17, -40, 34, 26, 3); ctx.fillStyle = '#fbfcfe'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c23a2b'; ctx.fillRect(-13, -36, 26, 5); ctx.fillStyle = 'rgba(40,50,70,.45)'; ctx.fillRect(-13, -27, 20, 3); ctx.fillRect(-13, -21, 14, 3);
    ctx.restore();
    if (th > .45 && o.botDrop > 0) for (let i = 0; i < 3; i++) { const ph = ((o.botT || 0) * 2.6 + i / 3) % 1, y = my + ph * o.botDrop; ctx.beginPath(); ctx.ellipse(mx - 2, y, 5.5, 3.6, ph * 5, 0, TAU); ctx.fillStyle = i % 2 ? '#ffffff' : '#ff8fa3'; ctx.fill(); ctx.strokeStyle = 'rgba(20,24,34,.8)'; ctx.lineWidth = 1.8; ctx.stroke(); }
  };
  PROP_BOX.fp18_bottle = [-30, -74, 22, 8];
  /* fp18_tissue: a crumpled white tissue in the fist */
  EXT.prop.fp18_tissue = (side, o, t) => {
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(40,40,60,.75)'; ctx.lineWidth = 3;
    for (const [x, y, r] of [[-12, -8, 11], [12, -10, 12], [0, -20, 12], [-2, -4, 13], [8, -26, 8]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#fffefb'; ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(140,150,170,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(-4, -18); ctx.moveTo(6, -6); ctx.lineTo(14, -16); ctx.stroke();
    ctx.restore();
  };
  PROP_BOX.fp18_tissue = [-26, -40, 26, 6];
}
/* the nurse's medication cart, seen from the front: a pale steel body with three drawers, a white top with a row of paper cups and a tablet, a push bar, casters */
const CART_K = .64;
function medCart(x, y, s, lit) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * CART_K, s * CART_K); ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(6,8,16,.4)'; ell(0, 4, 150, 17); ctx.fill();
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 104, -15, 15, 0, TAU); ctx.fillStyle = '#20232b'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(sx * 104, -15, 6, 0, TAU); ctx.fillStyle = '#9aa2ad'; ctx.fill(); }
  rr(-122, -66, 244, 38, 8); ctx.fillStyle = V2.grad(0, -66, 0, -28, [[0, '#8793a0'], [1, '#5c6672']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.stroke();
  rr(-130, -150, 260, 96, 12); ctx.fillStyle = V2.grad(-130, 0, 130, 0, [[0, '#c9d9e0'], [.5, '#e1ecf1'], [1, '#aec3cd']]); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 2; i++) { const dy = -142 + i * 42; rr(-112, dy, 224, 36, 7); ctx.fillStyle = V2.grad(0, dy, 0, dy + 36, [[0, '#f5fafc'], [1, '#c5d5dd']]); ctx.fill(); ctx.strokeStyle = 'rgba(30,40,56,.7)'; ctx.lineWidth = 2.6; ctx.stroke(); rr(-34, dy + 13, 68, 10, 5); ctx.fillStyle = '#6a7684'; ctx.fill(); }
  rr(-140, -172, 280, 24, 8); ctx.fillStyle = '#fbfdfe'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.stroke();
  for (let i = 0; i < 6; i++) { const cx = -100 + i * 22; ctx.beginPath(); ctx.moveTo(cx - 8, -206); ctx.lineTo(cx + 8, -206); ctx.lineTo(cx + 6, -174); ctx.lineTo(cx - 6, -174); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = 'rgba(30,40,56,.75)'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.fillStyle = i % 2 ? '#ff7a7a' : '#7ab5ff'; ctx.fillRect(cx - 5, -190, 10, 5); }
  rr(78, -206, 52, 34, 5); ctx.fillStyle = '#1e2430'; ctx.fill(); ctx.stroke(); rr(82, -202, 44, 24, 3); ctx.fillStyle = '#7bd0ff'; ctx.globalAlpha = .6 + .3 * (lit || 0); ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
}
/* the linen cart seen from behind: a wire cage on casters with stacks of linen behind the mesh; roll and up from the sim */
function linenCart(x, y, s, roll, up, lt) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(6,8,16,.4)'; ell(0, 4, 140, 16); ctx.fill();
  ctx.translate(0, -up); ctx.rotate(roll); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * 98, -17, 17, 0, TAU); ctx.fillStyle = '#20232b'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(sx * 98, -17, 6, 0, TAU); ctx.fillStyle = '#9aa2ad'; ctx.fill(); }
  rr(-114, -64, 228, 28, 7); ctx.fillStyle = V2.grad(0, -64, 0, -36, [[0, '#94a0ad'], [1, '#626d7a']]); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.4; ctx.stroke();
  const stacks = [['#7db0ea', -64, 56], ['#f1f5f9', -118, 50], ['#6fa3e2', -166, 46]];
  stacks.forEach(([cl, y0, h], i) => { rr(-104 + (i % 2) * 4, y0 - h + 6, 208 - (i % 2) * 8, h, 12); ctx.fillStyle = cl; ctx.fill(); ctx.strokeStyle = 'rgba(20,30,50,.6)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-84, y0 - h * .5); ctx.lineTo(84, y0 - h * .5); ctx.stroke(); });
  ctx.strokeStyle = 'rgba(214,222,232,.95)'; ctx.lineWidth = 5;
  for (const sx of [-112, 112]) { ctx.beginPath(); ctx.moveTo(sx, -64); ctx.lineTo(sx, -214); ctx.stroke(); }
  for (const yy of [-110, -160, -214]) { ctx.beginPath(); ctx.moveTo(-112, yy); ctx.lineTo(112, yy); ctx.stroke(); }
  ctx.lineWidth = 1.8; ctx.globalAlpha = .55; for (let xx = -90; xx < 112; xx += 26) { ctx.beginPath(); ctx.moveTo(xx, -64); ctx.lineTo(xx, -214); ctx.stroke(); } ctx.globalAlpha = 1;
  ctx.strokeStyle = '#6d7885'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-112, -224); ctx.lineTo(112, -224); ctx.stroke();       /* the push bar */
  ctx.restore();
}
/* the bundle of linen that rides on the cart and is thrown off at the bonk: a fat roll of folded sheets with a loose corner. (x, y) = its centre, rot in radians */
function linenBundle(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = V2.grad(0, -52, 0, 52, [[0, '#fbfdff'], [1, '#c8d7ea']]); rr(-84, -50, 168, 100, 36); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(120,160,214,.85)'; ctx.lineWidth = 6; for (const dy of [-22, 4, 28]) { ctx.beginPath(); ctx.moveTo(-70, dy); ctx.quadraticCurveTo(0, dy + 8, 70, dy); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(60, 30); ctx.quadraticCurveTo(96, 40, 92, 70); ctx.quadraticCurveTo(70, 62, 52, 56); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();      /* the loose corner */
  ctx.restore();
}
const OUTL = 'rgba(20,14,26,.86)';
/* @@CAST@@ */
// ------------------------------------------------------------------ the cast: where everybody stands (X, Z in the corridor) and what they do, all a function of scene time
const slamTimes = () => sim().SLAM.slice(0, 5).concat([sim().T_HIT, sim().SLAM[5]]);
function shake(lt, amp = 1) {            /* the sum of decaying jolts from each door slam (and the bonk): 0..~1.3 */
  let v = 0; for (const t0 of slamTimes()) if (lt >= t0) v += Math.exp(-(lt - t0) / .16) * (lt - t0 < .5 ? 1 : 0);
  return v * amp;
}
const LEMON_FIN = { X: -190, Z: 1842 }, MANGO_FIN = { X: 70, Z: 1420 };
const STRAW_P = { X: -150, Z: 1450 }, STRAW_CART = { X: -143, Z: 1330 }, ONION_P = { X: 338, Z: 1690 }, ONION_FIN = { X: 300, Z: 1300 }, MARSH_P = { X: -345, Z: 1195 }, BIND_P = { X: -150, Z: 1030 };
const CS = .92;       /* everybody's size relative to the corridor (the walls and doors are drawn for people about 400 tall at scale 1) */
/* a hand target that is surely within reach of the shoulder (the layout audit reports a grip that is out of reach at the front) */
function reachGrip(kind, side, gx, gy, f = .95) {
  const k = KINDS[kind], [sx, sy] = shoulder(k, side), r = ((k.arm1 || 56) + (k.arm2 || 52)) * 1.12 * f, dx = gx - sx, dy = gy - sy, d = Math.hypot(dx, dy);
  return d > r ? [sx + dx / d * r, sy + dy / d * r] : [gx, gy];
}
function lemonAt(lt) {
  const sm = sim();
  if (lt < 5.3) return { X: 55, Z: 1650, mode: 'idle', yaw: -.3 };
  if (lt < 7.6) { const u = ss(lt, 5.3, 7.6); return { X: mix(55, 15, u), Z: mix(1650, 2150, u), mode: 'run', yaw: PI, u }; }
  if (lt < 12.25) return { X: 15, Z: 2150, mode: 'watch', yaw: PI };
  if (lt < 13.35) { const u = ss(lt, 12.25, 13.35); return { X: mix(15, 0, u), Z: mix(2150, 2070, u), mode: 'runback', yaw: mix(PI, 0, ss(lt, 12.3, 12.7)) + 0, u }; }
  if (lt < sm.T_REL + .02) return { X: -40, Z: 2070, mode: 'stuck', yaw: .1 };
  if (lt < sm.SLAM[5] + .02) { const u = ss(lt, sm.T_REL, sm.SLAM[5] + .02); return { X: mix(-40, LEMON_FIN.X, u), Z: mix(2070, LEMON_FIN.Z - 6, u), mode: 'lunge', yaw: .1 }; }
  const q = lt - sm.SLAM[5]; return { X: LEMON_FIN.X, Z: LEMON_FIN.Z - 6 + 22 * (1 - Math.exp(-q / .3)), mode: 'wall', yaw: .1, q };
}
function mangoAt(lt) {
  const sm = sim(), c = sm.cart(lt);
  if (lt < sm.T_PUSH - .15) return { X: 312, Z: 1100, mode: 'stand', yaw: -.65 };
  const u = ss(lt, sm.T_PUSH - .15, sm.T_PUSH + .35);
  const back = lt >= sm.T_HIT ? 28 * Math.exp(-(lt - sm.T_HIT) / .3) * Math.abs(Math.sin((lt - sm.T_HIT) * 9)) : 0;
  const pos = { X: mix(312, c.x + 84, u), Z: mix(1100, c.z - 238 - back, u) }, w = ss(lt, 16.0, 17.6);
  if (lt >= sm.T_PULL1) { pos.X = mix(c.x + 84, MANGO_FIN.X, w); pos.Z = mix(c.z - 238, MANGO_FIN.Z, w); }
  return { X: pos.X, Z: pos.Z, mode: lt < sm.T_HIT ? 'push' : lt < sm.T_PULL1 ? 'jam' : 'after', yaw: lt >= sm.T_PULL1 ? V2C.turnLerp(-PI, -.9, w, 1) : V2C.turnLerp(-.65, -PI, u, -1), u };
}
const handsUp = (lt, t0) => ss(lt, t0, t0 + .12) * (1 - ss(lt, t0 + .7, t0 + 1.1));
const lookUp = lt => ss(lt, 1.6, 1.95) * (1 - ss(lt, 3.55, 3.95));     /* everybody looks at the ceiling speaker while the page speaks */
function actStraw(lt) {
  const put = lt >= 8.1, cupUp = ss(lt, 8.2, 8.7);       /* the cup in the left hand, her MAR in the right; after the line she lifts the cup, offering it, and holds it (the cup is still in her hand in the quiet) */
  const read = ss(lt, 5.4, 5.8) * (1 - ss(lt, 7.5, 7.9));
  return { expr: 'dead', lid: .5, yaw: 0, headYaw: 0, look: [.1 + .3 * read - .2 * lookUp(lt), mix(.55 - .6 * ss(lt, 7.9, 8.4) + .1 * read, -.9, lookUp(lt))], arms: { l: 'hold', r: 'hips' }, hold: { l: 'medcup' }, cupUp };
}
function actLemon(lt, st) {
  const sm = sim(), run = st.mode === 'run' || st.mode === 'runback';
  const o = { yaw: st.yaw, expr: 'neutral', look: [.4 - .4 * lookUp(lt), -.9 * lookUp(lt)], hold: { l: 'clipboard' }, clipText: '', arms: { l: 'hold', r: 'rest' } };
  if (lt >= bS('l1') - .1 && lt < 5.3) { o.expr = 'angry'; o.arms = { l: 'hold', r: 'up' }; }
  if (run) { o.arms = { l: 'run', r: 'run' }; o.hold = {}; o.expr = 'panic'; o.gaitW = lt * 300; o.axis = 'z'; o.dir = st.mode === 'run' ? -1 : 1; }
  if (st.mode === 'watch') { o.expr = lt > 12.0 ? 'shock' : 'angry'; o.arms = { l: 'rest', r: 'rest' }; o.hold = {}; if (lt > 12.2) o.arms = { l: 'up', r: 'up' }; }
  if (st.mode === 'stuck' || st.mode === 'lunge') { o.expr = 'panic'; o.hold = {}; o.arms = { l: 'reach', r: 'reach' }; o.yaw = .15 * Math.sin(lt * 7); }
  if (st.mode === 'wall') { o.expr = 'shock'; o.hold = {}; o.arms = { l: 'flail', r: 'flail' }; o.plant = true; o.squash = .16 * Math.exp(-st.q / .22); if (lt > sm.SLAM[5] + .9) { o.expr = 'sour'; o.arms = { l: 'rest', r: 'rest' }; o.squash = 0; } if (lt > 26) { o.expr = lt > 27.3 ? 'sour' : 'panic'; o.arms = { l: lt > 25.5 ? 'up' : 'rest', r: 'rest' }; } }
  return o;
}
function actMango(lt, st) {
  const o = { yaw: st.yaw, expr: 'neutral', look: [-.4, -.05], arms: { l: 'rest', r: 'rest' } };
  if (st.mode === 'stand') { const w = ss(lt, 8.1, 8.45); o.expr = lt > 8.1 ? 'shock' : 'neutral'; o.look = [mix(.3, -.8, w) * (1 - lookUp(lt)), mix(0, -.1, w) - .9 * lookUp(lt)]; o.headYaw = mix(-.1, -1.0, w); o.arms = { l: 'hold', r: lt > 8.2 && lt < 9.4 ? 'up' : 'rest' }; o.hand = true; }
  if (st.mode === 'push') { o.expr = 'panic'; o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: reachGrip('mango', -1, -70, 66), r: reachGrip('mango', 1, 70, 66) }; o.look = [0, -.1]; o.gaitW = lt * 260; o.axis = 'z'; o.dir = -1; }
  if (st.mode === 'jam') { o.expr = 'shock'; o.arms = { l: 'up', r: 'up' }; o.look = [0, -.1]; if (lt > 14.5) { o.expr = 'panic'; o.arms = { l: 'hold', r: 'hold' }; o.grip = { l: reachGrip('mango', -1, -70, 66), r: reachGrip('mango', 1, 70, 66) }; } }
  if (st.mode === 'after') { o.expr = 'sour'; o.arms = { l: 'rest', r: 'hips' }; o.look = [.4, -.1]; }
  return o;
}
function actOnion(lt) {
  const sniff = lt >= CUE.sniffle && lt < CUE.sniffle + .5 ? Math.sin((lt - CUE.sniffle) * 14) : 0;
  const sob = .35 + .5 * (lt > 13.8 ? 1 : 0) + Math.max(0, sniff);
  const dab = ss(lt, 14.4, 14.7) * (1 - ss(lt, 16.0, 16.3));
  return { yaw: -.55, headYaw: -.5 + .35 * shake(lt) , cry: .8, sob: Math.min(1, sob), look: [-.3, .1], expr: 'onion_cry',
    hold: { l: 'fp15_tabletclip', r: 'fp18_tissue' }, arms: { l: 'hold', r: 'hold' }, grip: { l: [-62, 84], r: [mix(84, 98, dab), mix(70, 22, dab)] } };
}
function actMarshal(lt) {
  const hold = ss(lt, 22.3, 22.6), chin = ss(lt, 22.1, 22.45) * (1 - ss(lt, 23.55, 23.75));
  return { yaw: mix(-.9, -.15, hold) + .0, headYaw: mix(-.8, 0, hold), expr: 'neutral', look: [mix(-.3, 0, hold) * (1 - lookUp(lt)), -1 * lookUp(lt)], hold: { r: 'flashlight' }, grip: { r: [112, mix(40, 104, chin)] }, arms: { l: lt >= 22.3 ? 'rest' : 'hips', r: 'hold' }, chin };
}
/* @@STAGE@@ */
// ------------------------------------------------------------------ the shots: a 3D camera for the corridor (V2.setCam), then a 2D framing on top (zoomTo); inserts are flat compositions with their own framing
const W0 = { cx: 0, cy: 470, cz: -900, f: 1700, hy: 800 };
const camMix = (a, b, u) => ({ cx: mix(a.cx, b.cx, u), cy: mix(a.cy, b.cy, u), cz: mix(a.cz, b.cz, u), f: mix(a.f, b.f, u), hy: mix(a.hy, b.hy, u) });
/* where does the world point (X, Y, Z) land in the frame under camera c (before the 2D zoom)? */
const scr = (c, X, Y, Z) => { const k = c.f / (Z - c.cz); return [540 + (X - c.cx) * k, c.hy + (c.cy - Y) * k, k]; };
/* a 2D framing that puts the screen point (px, py) at (540 + dx, sy) under zoom z */
const frame = (px, py, z, sy = 960, dx = 0) => [px - dx / z, py + (960 - sy) / z, z];
const SHOTS = [];
const shot = (id, s, e, o) => SHOTS.push(Object.assign({ id, s, e, kind: 'corr', cast: ['straw', 'marshal', 'mango', 'onion', 'lemon'], ease: easeIO }, o));
function shotAt(lt) { let r = SHOTS[0]; for (const sh of SHOTS) if (lt >= sh.s) r = sh; return r; }
/* the camera of a corridor shot at lt: { cam, view: [x, y, z] } */
function camOf(sh, lt) {
  const u = sg(lt, sh.s, sh.e), v = sh.ease(u), cam = sh.cam ? sh.cam(v, lt) : W0;
  const view = sh.view ? sh.view(cam, v, lt) : [540, 960, 1];
  return { cam, view, u, v };
}
shot('open', 0, 1.55, { cast: ['marshal', 'straw', 'mango', 'lemon'], cam: v => camMix(W0, Object.assign({}, W0, { cz: -800 }), v), view: (c, v) => [540, 1010, mix(1.1, 1.14, v)], ease: x => x });
shot('pa', 1.55, 3.05, { cast: ['marshal', 'straw', 'mango', 'lemon'], view: (c, v) => [540, 980, mix(1.1, 1.14, v)], cam: v => camMix({ cx: 0, cy: 430, cz: -820, f: 1700, hy: 780 }, { cx: 20, cy: 480, cz: -900, f: 1700, hy: 740 }, v), ease: x => x });
shot('pb', 3.05, 4.009, { view: (c, v) => [540, 1030, mix(1.2, 1.26, v)], cam: v => camMix({ cx: 60, cy: 300, cz: -300, f: 1700, hy: 840 }, { cx: 60, cy: 300, cz: -200, f: 1700, hy: 840 }, v), cast: ['straw', 'lemon', 'onion'], ease: x => x });
shot('l1', 4.009, 5.191, { cam: v => camMix({ cx: -20, cy: 120, cz: 760, f: 1500, hy: 1060 }, { cx: -20, cy: 130, cz: 700, f: 1500, hy: 1070 }, v), cast: ['lemon'], ease: x => x });
shot('s1a', 5.191, 6.75, { cam: v => camMix({ cx: -40, cy: 240, cz: 120, f: 1700, hy: 870 }, { cx: -40, cy: 240, cz: 60, f: 1700, hy: 870 }, v), cast: ['straw', 'lemon'], ease: x => x });
shot('s1b', 6.75, 8.205, { cam: v => ({ cx: -40, cy: 240, cz: 60, f: 1700, hy: 870 }), view: (c, v) => frame(...scr(c, STRAW_P.X + 40, 250, STRAW_P.Z).slice(0, 2), mix(1.25, 1.45, v), 860), cast: ['straw', 'lemon'], ease: x => x });
shot('m1', 8.205, 9.456, { cam: v => camMix({ cx: 150, cy: 250, cz: -220, f: 1700, hy: 860 }, { cx: 150, cy: 250, cz: -140, f: 1700, hy: 860 }, v), cast: ['mango'], ease: x => x });
shot('c1', 9.456, 11.2, { cam: v => { const cz = mix(-1800, -2300, v); return { cx: 0, cy: mix(300, 340, v), cz, f: .93 * (1750 - cz), hy: mix(800, 790, v) }; }, cast: ['lemon'], ease: x => x });
shot('c2', 11.2, 12.906, { cam: v => camMix({ cx: 90, cy: 330, cz: -820, f: 1700, hy: 800 }, { cx: 30, cy: 260, cz: -300, f: 1700, hy: 840 }, v), view: (c, v) => [540, 1010, 1.06], cast: ['straw', 'mango'] });
shot('bonk', 12.906, 13.856, { cam: v => camMix({ cx: 0, cy: 170, cz: 900, f: 1500, hy: 800 }, { cx: 0, cy: 180, cz: 960, f: 1500, hy: 800 }, v), view: (c, v) => [540, 640, mix(1.3, 1.36, v)], cast: ['linen'], ease: x => x });
shot('o1', 13.856, 16.1, { cam: v => camMix({ cx: 120, cy: 280, cz: 150, f: 1700, hy: 840 }, { cx: 120, cy: 280, cz: 230, f: 1700, hy: 840 }, v), cast: ['onion', 'lemon'], ease: x => x });
shot('b1', 16.1, 18.85, { kind: 'wall', view: (c, v) => [540, 960, mix(1, 1.05, v)] });
shot('s2', 18.85, 19.35, { cam: v => ({ cx: -60, cy: 240, cz: 250, f: 1700, hy: 860 }), view: (c, v) => frame(...scr(c, STRAW_P.X + 20, 260, STRAW_P.Z).slice(0, 2), mix(1.6, 1.7, v), 800), cast: ['straw'], ease: x => x });
shot('b2', 19.35, CUE.hornstop, { kind: 'wall', view: (c, v) => [540, 960, mix(1.05, 1.09, v)] });
shot('q', CUE.hornstop, 22.412, { cam: v => camMix({ cx: 20, cy: 340, cz: -760, f: 1700, hy: 790 }, { cx: 20, cy: 340, cz: -690, f: 1700, hy: 790 }, v), view: (c, v) => [540, 1030, mix(1.1, 1.15, v)], cast: ['straw', 'marshal', 'mango', 'onion', 'binder'], ease: x => x });
shot('p1a', 22.412, 23.7, { cam: v => ({ cx: -230, cy: 270, cz: 220, f: 1700, hy: 860 }), view: (c, v) => frame(...scr(c, MARSH_P.X, 300, MARSH_P.Z).slice(0, 2), mix(1.0, 1.08, v), 800), cast: ['marshal'], ease: x => x });
shot('p1b', 23.7, 24.882, { kind: 'wall', lcd: true, view: (c, v) => frame(270, 575, mix(1.6, 1.75, v), 640) });
shot('b3', 24.882, 26.006, { kind: 'wall', pending: true, view: (c, v) => frame(520, 770, mix(1.1, 1.16, v), 770) });
shot('l2', 26.006, 27.949, { cam: v => camMix({ cx: -210, cy: 250, cz: 820, f: 1700, hy: 900 }, { cx: -214, cy: 250, cz: 880, f: 1700, hy: 900 }, v), cast: ['lemon'], ease: x => x });
shot('m2', 27.949, 31, { cam: v => camMix({ cx: -150, cy: 270, cz: 300, f: 1700, hy: 880 }, { cx: -120, cy: 280, cz: 420, f: 1700, hy: 880 }, v), view: (c, v) => frame(mix(660, 740, v), scr(c, MANGO_FIN.X, 215, MANGO_FIN.Z)[1], mix(1.0, 1.14, v), mix(940, 890, v)), cast: ['lemon', 'mango'], ease: x => x });
SHOTS[SHOTS.length - 1].e = SCN.dur;
/* @@DRAW@@ */
// ------------------------------------------------------------------ the corridor world for a shot: light rig, the corridor, the cast and carts sorted by depth, the light passes
const TROFFERS = [900, 1700, 2500, 3300, 4100, 4900, 5700, 6500, 7300];
const ROOMS = { '-1': [4400, 5330, 6450, 7200], '1': [4350, 5300, 6700, 7500] };
const STROBES = [[-1, 1250], [1, 2300], [-1, 3000], [1, 3900], [-1, 4800], [1, 5700], [-1, 6700]];
function troffLevel(Z, lt, L) { if (L.cold > .5) { const st = lt >= CUE.sting ? Math.exp(-(lt - CUE.sting) / .18) : 0; return (Z === 1700 ? (sr(Math.floor(lt * 15), 3) > .42 ? .62 : .12) : .55) * (1 - .8 * st); } return .86; }
function floorReflect(L, lt) {
  const zn = V2.P.cz + 230;
  ctx.save(); clipQuad([-HW, 0, zn], [-HW, 0, ZEND], [HW, 0, ZEND], [HW, 0, zn]);
  { const F = FX(); if (F && typeof F.pool === 'function') for (const Z of TROFFERS) { if (Z - V2.P.cz < 400) continue; const p = P3(0, 0, Z), k = kAt(Z), lv = troffLevel(Z, lt, L); F.pool(ctx, { x: p[0], y: p[1], rx: 330 * k, ry: 110 * k + 8, color: L.cold > .5 ? '#bcd4ff' : '#fff0cc', alpha: .34 * lv * (1 - .5 * c01(Z / ZEND)) }); } }
  ctx.globalCompositeOperation = 'screen';
  for (const Z of TROFFERS) {
    if (Z - V2.P.cz < 500) continue;
    const lv = troffLevel(Z, lt, L), a = P3(-100, -CH, Z - 210), b = P3(100, -CH, Z - 210), c = P3(100, -CH, Z + 210), d = P3(-100, -CH, Z + 210);
    const y0 = Math.min(a[1], d[1]), y1 = Math.max(a[1], d[1]);
    ctx.fillStyle = V2.grad(0, y0, 0, y1, [[0, 'rgba(255,244,214,0)'], [.5, `rgba(${L.cold > .5 ? '200,225,255' : '255,240,205'},${.3 * lv * (1 - c01(Z / ZEND) * .6)})`], [1, 'rgba(255,244,214,0)']]);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
  }
  if (L.fl > .02) for (const [s, Z] of STROBES) { if (Z - V2.P.cz < 500) continue; const p = P3(s * (HW - 40), -508, Z); V2.glow(p[0], p[1], 80 * kAt(Z) + 14, '255,236,220', .26 * L.fl, 'screen', .1); }
  ctx.restore();
}
function dustPuff(i, lt) {
  const t0 = sim().SLAM[i]; if (lt < t0 || lt > t0 + 1.1) return;
  const p = P3(0, 0, ZH[i]), k = kAt(ZH[i]), F = FX();
  { const q = (lt - t0) / .55; if (q < 1) V2.ring(p[0], p[1], q, { r0: 60 * k, r1: 560 * k, squash: .2, color: '255,246,230', lw: 10 * k + 2, alpha: .55, bloom: .3 }); }
  if (F && typeof F.puff === 'function') { F.puff(ctx, { x: p[0], y: p[1] - 10 * k, r: 330 * k, t: lt, t0, life: .9, color: '#d5dbe4', n: 8 }); F.puff(ctx, { x: p[0] - 170 * k, y: p[1], r: 170 * k, t: lt, t0: t0 + .02, life: .7, color: '#cfd5de', n: 5, seed: 3 }); F.puff(ctx, { x: p[0] + 170 * k, y: p[1], r: 170 * k, t: lt, t0: t0 + .02, life: .7, color: '#cfd5de', n: 5, seed: 7 }); return; }
  const q = (lt - t0) / .9; ctx.save(); ctx.globalAlpha = .45 * (1 - q); ctx.fillStyle = '#d5dbe4'; for (let j = 0; j < 7; j++) { ctx.beginPath(); ctx.arc(p[0] + (j - 3) * 60 * k * (.4 + q), p[1] - 30 * k * q * (1 + j % 2), (60 + 90 * q) * k * (.8 + .1 * j % 3), 0, TAU); ctx.fill(); } ctx.restore();
}
/* the bonk: where each leaf meets the cart's far corner, a comic impact star and a spray of sparks for a few frames */
function impact(lt) {
  const sm = sim(), d = lt - sm.T_HIT; if (d < 0 || d > .4) return;
  const F = FX(), a = 1 - d / .4, zc = sm.CART_HIT.z + sm.CART_HD, k = kAt(zc);
  for (const sx of [-1, 1]) {
    const p = P3(sx * sm.CART_HW, 120, zc), r = (34 + 52 * Math.sqrt(d / .4)) * k;
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(sx * .3 + d * 3); ctx.globalAlpha = Math.min(1, a * 1.4);
    ctx.beginPath(); for (let i = 0; i < 16; i++) { const ang = i / 16 * TAU, rr2 = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2); } ctx.closePath();
    ctx.fillStyle = '#fff6b0'; ctx.fill(); ctx.strokeStyle = 'rgba(255,120,40,.9)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
    if (F && typeof F.sparks === 'function') F.sparks(ctx, { x: p[0], y: p[1], t: lt, t0: sm.T_HIT, count: 14, speed: 620 * k, life: .45, gravity: 900, seed: 5 + sx, color: '#ffe9a0' });
  }
}
function lightRig(lt, L) {
  const alarm = L.alarm, on = L.on, fl = L.fl, cold = L.cold;
  const keyColor = cold > .5 ? '#d8e6ff' : alarm ? '#ffeedd' : '#fff3da', rim = cold > .5 ? '#9ec0ff' : alarm ? (on ? '#ff5a4a' : '#ff9a80') : '#bcd4ff';
  V2.setLight({ key: [.2, -.85], keyColor, keyA: cold > .5 ? .2 : .3 + .25 * fl, rim, rimA: cold > .5 ? .34 : alarm ? .34 + .36 * on + .3 * fl : .3, shadow: '#140e26', shadowA: .36, bounce: alarm ? '#ff7a60' : '#ffd9a0', bounceA: alarm ? .08 + .14 * on : .1, amb: alarm ? '#ff3a28' : '#fff0d8', ambA: alarm ? .03 + .05 * on : .05 });
}
/* the people and things of a corridor shot, sorted into the corridor by depth */
function corrItems(lt, sh, list) {
  const sm = sim(), has = id => sh.cast.indexOf(id) >= 0, mkp = (ctor, X, Z, kf, o) => { const q = V2.at(X, Z); return ctor(Object.assign({ x: q.x, y: q.y, s: q.s * kf * CS, t: lt }, o)); };
  const jolt = shake(lt), hop = Math.max(0, jolt) * 5;
  if (has('straw')) {
    const qc = V2.at(STRAW_CART.X, STRAW_CART.Z), qs = V2.at(STRAW_P.X, STRAW_P.Z), sc = qs.s * CS;
    const o = actStraw(lt), up = o.cupUp, Lp = [-98, 80], Lu = [-104, 16];
    o.grip = { l: reachGrip('straw', -1, mix(Lp[0], Lu[0], up), mix(Lp[1], Lu[1], up)) };
    list.push({ z: STRAW_P.Z, draw: () => { drawChar(mkp(A11.straw, STRAW_P.X, STRAW_P.Z, 1, Object.assign(o, { lift: hop * sc })));
      /* the med pass: while she reads off the orders three pills hop in the cup, one after another */
      if (lt >= 5.45 && lt < 7.8) { const kd = KINDS.straw, bc = kd.leg + kd.ry * .9, cx = qs.x + o.grip.l[0] * sc, cy = qs.y - bc * sc + o.grip.l[1] * sc - 26 * sc;
        for (let i = 0; i < 3; i++) { const ph = ((lt - 5.45) * 1.35 + i / 3) % 1, y = cy - 4 * 66 * sc * ph * (1 - ph) - 6 * sc, x = cx + (i - 1) * 9 * sc + Math.sin(ph * PI) * (i - 1) * 8 * sc;
          ctx.save(); ctx.translate(x, y); ctx.rotate(ph * 6 + i); ctx.beginPath(); ctx.ellipse(0, 0, 7 * sc, 4.4 * sc, 0, 0, TAU); ctx.fillStyle = i === 1 ? '#ff8fa3' : '#ffffff'; ctx.fill(); ctx.strokeStyle = 'rgba(20,24,34,.85)'; ctx.lineWidth = 2 * sc; ctx.stroke(); ctx.restore(); } } } });
    list.push({ z: STRAW_CART.Z, draw: () => medCart(qc.x, qc.y, qc.s * CS, jolt) });
  }
  if (has('marshal')) {
    const o = actMarshal(lt), qm = V2.at(MARSH_P.X, MARSH_P.Z), sm2 = qm.s * 1.16, kd = KINDS.pom, bc = kd.leg + kd.ry * .9;
    list.push({ z: MARSH_P.Z, draw: () => { drawChar(mkp(A6.pom, MARSH_P.X, MARSH_P.Z, 1.16, Object.assign(o, { lift: hop * 1.1 })));
      const F0 = FX(); if (F0 && typeof F0.foamPile === 'function') {          /* what is left of the beard from the last scene: a patch under the mustache and a dab on the helmet */
        F0.foamPile(ctx, { x: qm.x + 6 * sm2, y: qm.y - bc * sm2 + 134 * sm2, w: 112 * sm2, h: 44 * sm2, t: lt, t0: -3, grow: .1, seed: 11 });
        F0.foamPile(ctx, { x: qm.x - 58 * sm2, y: qm.y - bc * sm2 - 100 * sm2, w: 58 * sm2, h: 30 * sm2, t: lt, t0: -3, grow: .1, seed: 12 }); }
      const F = FX(); if (F && typeof F.cone === 'function' && lt >= 20.95) { const hx = qm.x + o.grip.r[0] * sm2, hy = qm.y - bc * sm2 + o.grip.r[1] * sm2 - 84 * sm2, up = o.chin > .4; F.cone(ctx, { x: hx, y: hy, ang: up ? -PI / 2 - .32 : -PI / 2 + .6, spread: up ? .9 : .42, len: (up ? 360 : 700) * sm2, color: '#fff3cc', alpha: up ? .6 : .34 }); } } });
  }
  if (has('onion')) { const o = actOnion(lt), w = ss(lt, 16.5, 17.5), ox = mix(ONION_P.X, ONION_FIN.X, w), oz = mix(ONION_P.Z, ONION_FIN.Z, w); list.push({ z: oz, draw: () => drawChar(mkp(A15.onion, ox, oz, 1, Object.assign(o, { lift: hop }))) }); }
  if (has('lemon')) { const st = lemonAt(lt), o = actLemon(lt, st); if (st.Z > 0) list.push({ z: st.Z, draw: () => drawChar(mkp(A7.lemon, st.X, st.Z, 1, Object.assign(o, { lift: st.mode === 'watch' || st.mode === 'wall' && lt < 15.8 ? hop * V2.at(st.X, st.Z).s : 0 }))) }); }
  if (has('mango')) { const st = mangoAt(lt), o = actMango(lt, st);
    if (st.mode === 'stand') { const qm = V2.at(st.X, st.Z), sm3 = qm.s * CS, kd = KINDS.mango, bc = kd.leg + kd.ry * .9, qh = V2.at(sm.CART0.x, sm.CART0.z - 110), hx = qh.x, hy = qh.y - 224 * qh.s * CS; o.grip = { l: reachGrip('mango', -1, (hx - qm.x) / sm3, (hy - qm.y) / sm3 + bc) }; }
    list.push({ z: st.Z, draw: () => drawChar(mkp(A7.mango, st.X, st.Z, 1, Object.assign(o, { lift: hop }))) }); }
  if (has('mango') || has('linen')) {
    const c = sm.cart(lt), q = V2.at(c.x, c.z), ln = sm.linen(lt);
    list.push({ z: c.z, draw: () => linenCart(q.x, q.y, q.s, c.roll, c.up, lt) });
    list.push({ z: c.z - 8, draw: () => impact(lt) });
    if (ln.onCart) list.push({ z: c.z - 1, draw: () => { const p = V2.at(c.x, c.z); linenBundle(p.x, p.y - (262 + c.up) * p.s, p.s, c.roll); } });
    else list.push({ z: ln.z - 1, draw: () => { const p = V2.at(ln.x, ln.z); linenBundle(p.x, p.y - ln.y * p.s - 40 * p.s, p.s, ln.rot); } });
  }
  if (has('binder') && lt >= CUE.binderpop) {
    const q = V2.at(BIND_P.X, BIND_P.Z), grin = ss(lt, CUE.grin - .05, CUE.grin + .12), o = A15.binder({ x: q.x, y: q.y - 500 * q.s, s: .95 * q.s, center: true, noLegs: true, who: 'bind', t: lt, yaw: .3, pose: lt >= CUE.grin ? 'helpful' : 'thumb', grin, glint: lt >= CUE.grin ? Math.max(0, Math.sin((lt - CUE.grin) * 6)) ** 4 : 0, look: [.5, .1], hover: 0 });
    list.push({ z: BIND_P.Z - 60, draw: () => drawChar(o) });
  }
  for (let i = 0; i < 6; i++) { const t0 = sm.SLAM[i]; if (lt >= t0 && lt < t0 + 1.1) list.push({ z: ZH[i] - 20, draw: () => dustPuff(i, lt) }); }
  return list;
}
/* the alarm panel, the pull station and the Binder tablet on the near left wall, seen edge-on from the corridor (the readable versions are the wall insert and P18) */
function wallBox(s, Z0, Z1, Y0, Y1, dep, front, side) {
  const x = s * HW, xo = s * (HW - dep);
  quad3([xo, Y0, Z0], [xo, Y1, Z0], [xo, Y1, Z1], [xo, Y0, Z1], front, 'rgba(14,18,28,.7)', 1.6);
  quad3([x, Y0, Z0], [x, Y1, Z0], [xo, Y1, Z0], [xo, Y0, Z0], side);
}
function wallFixtures(L, lt) {
  const Zp = 1060, tone = lt >= bS('b3') ? [255, 196, 90] : lt >= CUE.click ? [255, 196, 90] : lt >= 1.55 ? [255, 70, 52] : lt >= .1 ? [255, 196, 90] : [150, 230, 110];
  if (1060 - V2.P.cz < 300) return;
  wallBox(-1, Zp, Zp + 270, 150, 480, 26, col([146, 154, 164], Zp), col([86, 94, 104], Zp));
  const f = -(HW - 27), lcdOn = lt >= 1.55 && lt < CUE.click ? .55 + .45 * L.on : 1;
  quad3([f, 372, Zp + 28], [f, 446, Zp + 28], [f, 446, Zp + 242], [f, 372, Zp + 242], `rgb(${Math.round(tone[0] * lcdOn)},${Math.round(tone[1] * lcdOn)},${Math.round(tone[2] * lcdOn)})`);
  const c = P3(f, 409, Zp + 135); V2.glow(c[0], c[1], 150 * kAt(Zp + 135) + 26, tone.join(','), .55 * lcdOn, 'screen', .4);
  for (let i = 0; i < 4; i++) { const cc = P3(f, 330 - i * 30, Zp + 60), on = i === 0 ? 1 : i === 1 && lt >= 1.55 && lt < CUE.click ? L.on : 0; V2.glow(cc[0], cc[1], 26 * kAt(Zp) + 8, i === 1 ? '255,70,52' : '90,255,130', .5 * (i === 0 || on ? 1 : .15), 'screen', .25); }
  const tl = ss(lt, CUE.binderpop - .05, CUE.binderpop + .12);
  wallBox(-1, 1005, 1045, 160, 430, 14, col([34, 40, 48], 1020), col([20, 24, 30], 1020));                                            /* the Binder tablet */
  if (tl > .05) { const cc = P3(-(HW - 15), 300, 1025); V2.glow(cc[0], cc[1], 120 * kAt(1025) + 20, '110,255,200', .6 * tl, 'screen', .4); }
}
function drawCorridor(lt, L, list) {
  shell(L, lt); floorReflect(L, lt); wallFixtures(L, lt);
  for (const s of [-1, 1]) for (const Z of ROOMS[s]) if (Z - V2.P.cz > 400) roomDoor(s, Z, 0);
  for (const Z of TROFFERS) if (Z - V2.P.cz > 300) troffer(Z, troffLevel(Z, lt, L), L.cold);
  for (const [s, Z] of STROBES) if (Z - V2.P.cz > 300) wallStrobe(s, Z, L.fl);
  const lamp = (() => { let v = 0; if (LN.pa1) for (let i = 0; i < LN.pa1.words.length; i++) { const a = wS('pa1', i), b = wE('pa1', i); if (lt >= a && lt < b) v = 1; } return Math.max(v, ss(lt, CUE.pachime, CUE.pachime + .08) * (1 - ss(lt, CUE.pachime + .5, CUE.pachime + .9))); })();
  paSpeaker(110, 1250, lamp);
  const items = list.slice();
  for (let i = 0; i < 6; i++) items.push({ z: ZH[i] + HW * Math.cos(closure(i, lt) * PI / 2) * .5, draw: () => fireDoor(i, closure(i, lt), lt, L, { glint: Math.exp(-Math.max(0, lt - sim().SLAM[i]) / .13) * (lt >= sim().SLAM[i] ? 1 : 0) }) });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) if (it.z - V2.P.cz > 120) it.draw();
}
const FRAME = { sh: SHOTS[0], cam: W0, view: [540, 960, 1] };

// ------------------------------------------------------------------ the wall insert: a frontal elevation of the corridor wall at the panel (b1, b2, p1b, b3)
const BT1 = "It looks like there's an alarm. Would you like to snooze it?", BT2 = "Great! Snoozed for ten minutes!";
function typedAt(id, text, lt) {   /* the share of the letters shown at lt, in step with the spoken words of a line (copied from ep17_assign.js) */
  const l = LN[id]; if (!l) return 1;
  const words = l.words, n = text.length; let shown = 0, pos = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i][0].replace(/[^A-Za-z']/g, ''), w = text.indexOf(clean, pos), ws = wS(id, i) - .04, we = wE(id, i); if (w < 0) continue;
    if (lt < ws) break;
    const end = w + clean.length; shown = Math.max(shown, lerp(w, end, c01((lt - ws) / Math.max(.05, we - ws)))); pos = end;
  }
  return lt >= wE(id, words.length - 1) ? 1 : c01(shown / n);
}
const BUB = { x: 110, w: 860, bot: 1340 }, BIG = { x: 770, y: 790, s: 1.5 }, RPW = [[0, 0], [120, -100], [230, -190], [170, -285]];
const RUN = { t0: 19.38, t1: 19.98 };
function bubbleOpts(lt) {
  const o = { w: BUB.w, s: 1, size: 40, name: 'Binder', buttons: [{ id: 'yes', t: 'Snooze 10 min', def: true }, { id: 'no', t: 'Dismiss' }], runPath: RPW };
  const second = lt >= bS('b2'); o.text = second ? BT2 : BT1;
  const h = SH15.binderRect(Object.assign({ at: [0, 0] }, o)).h; o.at = [BUB.x, BUB.bot - h];
  o.typed = second ? typedAt('b2', BT2, lt) : typedAt('b1', BT1, lt);
  o.runaway = sg(lt, RUN.t0 + .04, RUN.t1); o.pop = ss(lt, bS('b1'), bS('b1') + .3); o.tail = [BIG.x - 30, BIG.y + 70 * BIG.s * .6];
  if (lt >= CUE.click - .08 && lt < CUE.click + .06) o.press = { id: 'yes', k: sg(lt, CUE.click - .08, CUE.click) * (1 - sg(lt, CUE.click + .02, CUE.click + .06)) };
  return o;
}
function noRect(o, u) {   /* the current rectangle of the Dismiss button as it hops (the same formula as SH15.binder) */
  const g = SH15.binderRect(Object.assign({}, o), 'no'); if (!g) return null;
  const s = o.s ?? 1, nH = RPW.length - 1, i = Math.min(nH - 1, Math.floor(c01(u) * nH)), kk = easeIO(sg(c01(u), i / nH, (i + 1) / nH));
  return { x: g.x + lerp(RPW[i][0], RPW[i + 1][0], kk) * s, y: g.y + lerp(RPW[i][1], RPW[i + 1][1], kk) * s - Math.sin(PI * kk) * 52 * s, w: g.w, h: g.h };
}
/* the wall-mounted Binder tablet: a dark bezel, a screen that is dim until Binder wakes (lit 0..1) */
function tablet(x, y, s, lit, lt) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12; rr(-150, -220, 300, 440, 26); ctx.fillStyle = '#20262e'; ctx.fill(); ctx.restore();
  rr(-150, -220, 300, 440, 26); ctx.strokeStyle = OUTL; ctx.lineWidth = 4; ctx.stroke();
  rr(-130, -198, 260, 396, 12); ctx.fillStyle = V2.grad(0, -198, 0, 198, [[0, mixHex('#0d2a2c', '#2fd9a0', lit * .8)], [1, mixHex('#081a1c', '#17a073', lit * .8)]]); ctx.fill();
  ctx.save(); ctx.translate(0, -24); ctx.scale(2.2, 2.2); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = .55 + .45 * lit;
  ctx.strokeStyle = '#7a8794'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(-13, -17, -3, -17); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, -3); ctx.quadraticCurveTo(13, -17, 3, -17); ctx.stroke();
  ctx.fillStyle = '#14181d'; ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(13, -4); ctx.lineTo(16, 12); ctx.lineTo(-16, 12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, 3, 3.6, 0, TAU); ctx.arc(5, 3, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#14181d'; ctx.beginPath(); ctx.arc(-4.4, 3.4, 1.6, 0, TAU); ctx.arc(5.6, 3.4, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
  UI.label('BINDER', 0, 70, { size: 34, weight: 900, fill: 'rgba(210,255,240,' + (.5 + .4 * lit) + ')', spacing: 5, hero: false, crop: true });
  UI.label('Always here to help', 0, 112, { size: 22, weight: 700, fill: 'rgba(190,240,225,' + (.4 + .3 * lit) + ')', hero: false, crop: true });
  ctx.beginPath(); ctx.arc(0, 186 - 6, 5, 0, TAU); ctx.fillStyle = lit > .2 ? '#6dffb4' : '#2c8a62'; ctx.fill();
  ctx.restore();
  if (lit > .05) V2.glow(x, y, 300 * s, '90,255,190', .22 * lit, 'screen', .3);
}
function mixHex(a, b, k) { return V2.rgba(V2.mix(a, b, c01(k)), 1); }
/* the zone strip under the panel: six door-holder lamps, all red once the page has gone out */
function holdersStrip(x, y, s, lt) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  rr(-170, -34, 340, 68, 10); ctx.fillStyle = '#6b7581'; ctx.fill(); ctx.strokeStyle = OUTL; ctx.lineWidth = 3; ctx.stroke();
  for (let i = 0; i < 6; i++) { const cx = -125 + i * 50, red = sim().holderRed(i, lt), lit = red; ctx.beginPath(); ctx.arc(cx, -4, 13, 0, TAU); ctx.fillStyle = lit ? '#ff3a30' : '#2a2326'; ctx.fill(); ctx.stroke(); if (lit) V2.glow(x + cx * s, y - 4 * s, 44 * s, '255,60,50', .7, 'screen', .35); UI.label(String(i + 1), cx, 22, { size: 16, weight: 900, fill: '#1e2630', hero: false, crop: true }); }
  ctx.restore();
}
function wallBackdrop(lt, L) {
  const hot = L.alarm ? 1 : 0;
  ctx.fillStyle = V2.grad(0, 0, 0, 1080, [[0, '#7f9aa3'], [1, '#a9bec3']]); ctx.fillRect(-100, -100, W + 200, 1180);              /* the paint above the rail */
  ctx.strokeStyle = 'rgba(20,40,50,.14)'; ctx.lineWidth = 3; for (let x = 70; x < W; x += 360) { ctx.beginPath(); ctx.moveTo(x, -100); ctx.lineTo(x, 1040); ctx.stroke(); }
  ctx.fillStyle = V2.grad(0, 1040, 0, 1800, [[0, '#4d7f8c'], [1, '#2d5360']]); ctx.fillRect(-100, 1040, W + 200, 900);               /* the wainscot */
  ctx.fillStyle = V2.grad(0, 1006, 0, 1060, [[0, '#d2a56a'], [.5, '#b98a4e'], [1, '#8d6334']]); ctx.fillRect(-100, 1006, W + 200, 52);   /* the handrail */
  ctx.fillStyle = 'rgba(255,240,200,.35)'; ctx.fillRect(-100, 1010, W + 200, 5); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-100, 1058, W + 200, 9);
  ctx.fillStyle = 'rgba(222,170,60,.85)'; ctx.fillRect(-100, 1180, W + 200, 22);
  ctx.fillStyle = 'rgba(14,24,32,.5)'; ctx.fillRect(-100, 1700, W + 200, 300);
  if (L.cold > .5) { ctx.fillStyle = 'rgba(40,64,100,.28)'; ctx.fillRect(-100, -100, W + 200, 2100); }
}
function wallInsert(lt, sh) {
  const L = lightAt(lt), k = L.k;
  wallBackdrop(lt, L);
  V2.setLight({}); V2.opts.reflect = false;
  const lcdState = lt >= CUE.click ? (sh.pending && lt >= bS('b3') ? 'trouble' : 'snoozed') : (sh.pending ? 'trouble' : 'alarm');
  const pending = !!sh.pending && lt >= bS('b3');
  const state = lt >= CUE.click ? (pending ? 'trouble' : 'snoozed') : lt < bS('b1') - .5 ? 'drill' : 'alarm';
  const strobe = L.fl;
  P18.hornStrobe(ctx, { x: 975, y: 330, s: .95, level: strobe });
  P18.exitSign(ctx, { x: 690, y: 200, s: .8, glow: L.cold > .5 ? .8 : 1, halo: L.cold > .5 ? .5 : 1 });
  P18.pullStation(ctx, { x: 945, y: 640, s: .62, pulled: 1 });
  P18.panel(ctx, { x: 270, y: 700, s: .95, state, blink: L.on, heroLcd: true, press: lt >= CUE.click - .05 && lt < CUE.click + .25 ? { id: 'silence', k: 1 } : null });
  holdersStrip(270, 1100, .72, lt);
  const lit = ss(lt, CUE.binderpop - .05, CUE.binderpop + .12);
  tablet(690, 700, 1.0, lit * (lt < CUE.hornstop + .5 ? 1 : .6), lt);
  if (lt >= CUE.binderpop && lt < CUE.binderpop + .6) { const q = (lt - CUE.binderpop) / .6; V2.ring(690, 700, q, { r0: 40, r1: 420, color: '170,255,210', lw: 9, alpha: .85 * (1 - q) }); V2.glow(690, 700, 480 * (1 - .3 * q), '190,255,220', .5 * (1 - q), 'screen', .3); }
  const gp = sg(lt, CUE.binderpop, CUE.binderpop + .38), grow = eb(gp), grin = lt >= bS('b2') ? ss(lt, bS('b2'), bS('b2') + .25) * .8 + ss(lt, CUE.grin - .05, CUE.grin + .1) * .2 : .1;
  if (lt >= CUE.binderpop && !sh.lcd) {
    const bo = A15.binder({ x: BIG.x, y: BIG.y + Math.sin(lt * 3) * 6, s: BIG.s * grow, center: true, noLegs: true, who: 'bind', t: lt, yaw: -.2, pose: lt < bS('b2') ? (gp < 1 ? 'ears' : 'helpful') : lt >= CUE.click - .3 ? 'thumb' : 'cheer', grin, look: [-.2, .45], hover: 8 });
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12; drawChar(bo); ctx.restore();
  }
  if (lt >= bS('b1') && !sh.lcd && lt < CUE.hornstop + .3) {
    const bo = bubbleOpts(lt), bub = SH15.binder(bo, lt);
    if (lt >= 18.85 && lt < CUE.hornstop) {            /* the pointer goes for Dismiss, which hops away */
      const home = SH15.binderRect(bo, 'no'), nr = noRect(bo, sg(lt, RUN.t0 + .04, RUN.t1)) || home, nrPrev = noRect(bo, sg(lt - .07, RUN.t0 + .04, RUN.t1)) || nr;
      let px, py, press = 0;
      if (lt < RUN.t0 + .04) { const q = easeIO(sg(lt, 18.85, RUN.t0 - .02)); px = lerp(940, home.x + home.w * .7, q); py = lerp(1330, home.y + home.h * .8, q); press = Math.sin(PI * sg(lt, RUN.t0 - .02, RUN.t0 + .2)); }
      else { px = nrPrev.x + nrPrev.w * .7; py = nrPrev.y + nrPrev.h * .8; press = lt < RUN.t0 + .22 ? Math.sin(PI * sg(lt, RUN.t0 - .02, RUN.t0 + .2)) : 0; }
      if (lt >= RUN.t0 + .6 && lt < CUE.click - .3) { px = lerp(px, 760, ss(lt, RUN.t0 + .6, RUN.t0 + 1.1)); py = lerp(py, 1180, ss(lt, RUN.t0 + .6, RUN.t0 + 1.1)); }
      if (lt >= CUE.click - .3) { const yb = SH15.binderRect(bo, 'yes'); px = lerp(px, yb.x + yb.w * .75, ss(lt, CUE.click - .3, CUE.click - .08)); py = lerp(py, yb.y + yb.h * .8, ss(lt, CUE.click - .3, CUE.click - .08)); press = Math.max(press, bo.press ? bo.press.k : 0); }
      SH15.pointer(px, py, { kind: 'arrow', press, s: 1.7 });
    }
  }
  if (sh.lcd) {                                                                                                                     /* the Marshal's flashlight: a dark wall, a beam on the LCD */
    const wob = Math.sin(lt * 5.3) * 14, wob2 = Math.cos(lt * 4.1) * 10, cx = 270 + wob, cy = 575 + wob2;
    ctx.save(); ctx.fillStyle = V2.radial(cx, cy, 40, 760, [[0, 'rgba(2,6,14,0)'], [.35, 'rgba(2,6,14,.45)'], [1, 'rgba(2,6,14,.86)']]); ctx.fillRect(-100, -100, W + 200, 2100); ctx.restore();
    const F = FX(); if (F && typeof F.cone === 'function') F.cone(ctx, { x: -60, y: 1500, ang: -.9 + wob * .0016, spread: .55, len: 1250, color: '#fff2c8', alpha: .42 });
  }
}
/* the RACE chip (top left, below the clock pill): R RESCUE lights on Lemon's "Rescue!", A and C on Strawberry's words, and E reads EIGHT O'CLOCK MEDS */
function raceChip(lt) {
  const t0 = bS('l1'), t1 = 8.0;
  if (lt < t0 || lt >= t1 + .35) return;
  const a = ss(lt, t0, t0 + .18) * (1 - ss(lt, t1, t1 + .3)); if (a <= .01) return;
  const rows = [['R', 'RESCUE', wS('l1', 1)], ['A', 'ALARM', wS('s1', 1)], ['C', 'CONTAIN', wS('s1', 2)], ['E', 'EXTINGUISH', wS('s1', 3)]];
  const x0 = 48, y0 = 292, pitch = 66, pad = 16, w = 540, h = pitch * 4 + pad * 2;
  ctx.save(); ctx.globalAlpha *= a;
  UI.panel([x0, y0, w, h], { id: 'racechip', kind: 'panel', r: 22, fill: 'rgba(10,14,26,.84)', stroke: 'rgba(255,255,255,.28)', lw: 3, shadow: 14 });
  rows.forEach(([ch, label, tl], i) => {
    const cy = y0 + pad + pitch * i + pitch / 2, lit = lt >= tl, pop = lit ? 1 + .22 * Math.sin(PI * sg(lt, tl, tl + .25)) : 1;
    ctx.save(); ctx.translate(x0 + 52, cy); ctx.scale(pop, pop);
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, TAU); ctx.fillStyle = lit ? '#ffd23f' : '#2c3448'; ctx.fill(); ctx.strokeStyle = lit ? '#fff3b0' : 'rgba(255,255,255,.2)'; ctx.lineWidth = 3; ctx.stroke();
    UI.label(ch, 0, 0, { size: 36, weight: 900, fill: lit ? '#1b1522' : '#8a93a8' });
    ctx.restore();
    const fill = lit ? '#ffffff' : '#8a93a8';
    if (i === 3 && window.SH15 && SH15.flipText) SH15.flipText('EXTINGUISH', "EIGHT O'CLOCK MEDS", sg(lt, wS('s1', 3), wS('s1', 5) - .05), { cx: x0 + 100, cy, align: 'left', size: 32, weight: 900, spacing: 1.2, fill, maxW: w - 124 });
    else UI.label(label, x0 + 100, cy, { align: 'left', size: 34, weight: 900, spacing: 2, fill, maxW: w - 124 });
  });
  ctx.restore();
}
const SC = {
  shot(lt) { return shotAt(lt).id; },
  cam(lt) {
    const sh = shotAt(lt); let c = { cam: W0, view: [540, 960, 1] };
    if (sh.kind === 'corr') { c = camOf(sh, lt); V2.setCam(c.cam); zoomTo(...c.view); }
    else { const v = sh.view ? sh.view(null, sg(lt, sh.s, sh.e), lt) : [540, 960, 1]; zoomTo(...v); }
    FRAME.sh = sh; FRAME.cam = c.cam; FRAME.view = c.view;
    /* the jolt of each slam: a camera shake that lasts about two frames, bigger for the near doors */
    let sx = 0, sy = 0; const sm = sim();
    for (let i = 0; i < 6; i++) { const t0 = sm.SLAM[i], d = lt - t0; if (d >= 0 && d < .16) { const a = (6 + 4 * i) * Math.exp(-d / .05); sx += a * Math.sin(d * 130); sy += a * .8 * Math.cos(d * 150); } }
    { const d = lt - sm.T_HIT; if (d >= 0 && d < .25) { const a = 20 * Math.exp(-d / .07); sx += a * Math.sin(d * 110); sy += a * Math.cos(d * 125); } }
    if (sh.kind === 'corr' && (sx || sy)) { CAM.x += sx / CAM.z; CAM.y += sy / CAM.z; }
    if (sh.kind === 'corr') { let zp = 0; for (let i = 0; i < 6; i++) { const d = lt - sm.SLAM[i]; if (d >= 0 && d < .4) zp += (.012 + .004 * i) * Math.exp(-d / .06); } const d2 = lt - sm.T_HIT; if (d2 >= 0 && d2 < .4) zp += .03 * Math.exp(-d2 / .07); CAM.z *= 1 + zp; }
    if (lt >= CUE.sting && lt < CUE.sting + .6) CAM.z *= 1 + .02 * Math.exp(-(lt - CUE.sting) / .14);
  },
  draw(lt) {
    const sh = FRAME.sh, L = lightAt(lt);
    if (sh.kind === 'wall') return wallInsert(lt, sh);
    ctx.fillStyle = '#0c1018'; ctx.fillRect(-600, -600, W + 1200, H + 1200);
    lightRig(lt, L); V2.opts.reflect = true;
    drawCorridor(lt, L, corrItems(lt, sh, []));
  },
  fx(lt) {
    const L = lightAt(lt), on = L.on, hot = L.alarm ? 1 : 0;
    const fx = { bloom: .42 + .25 * L.fl, vignette: .42 + .1 * L.cold, grain: .045, contrast: .14, sat: .1, tint: [] };
    if (hot) { fx.tint.push(['#ff3a20', .2 + .3 * on, 'multiply'], ['#ff1a0a', .12 + .22 * on, 'soft-light']); fx.contrast = .2; fx.sat = .16; }
    if (L.cold > .5) fx.tint.push(['#9fbcff', .16, 'soft-light'], ['#cfe0ff', .08, 'multiply']);
    return fx;
  },
  blur(lt) {
    const sh = shotAt(lt); if (lt - sh.s < .06 || sh.e - lt < .06) return 1;
    if (sh.id === 'c1' || sh.id === 'c2') { const sm = sim(); for (let i = 0; i < 6; i++) { const t0 = i < 5 ? sm.SLAM[i] : sm.T_HIT; if (lt > t0 - .3 && lt < t0 + .12) return 4; } }
    if (sh.id === 'o1' && lt > sim().SLAM[5] - .25 && lt < sim().SLAM[5] + .1) return 4;
    return 1;
  },
  over(lt) {
    const L = lightAt(lt), F = FX();
    if (F && typeof F.wash === 'function' && L.fl > .01) F.wash(ctx, { color: '#f2f6ff', alpha: .26 * L.fl, mode: 'add' });
    raceChip(lt);
  },
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP18_SCENES = window.__EP18_SCENES || {};
window.__EP18_SCENES.alarm = SC;
/* @@NEXT@@ */
})();
