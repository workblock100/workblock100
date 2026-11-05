'use strict';
/* SHIFT HAPPENS, Episode 20: "The Snow Day". Scene module: lot (4:30 PM, THE PARKING LOT, 28.1 s). Builder: LOT. Registers window.__EP20_SCENES.lot. Art kit: ep20_art.js (window.A20); weather kit: ep20_fx.js (SN20).
 *
 * The world is one wide flat elevation (world px, y down): a blue-violet dusk sky, the long low building at the back with warm lit windows and a lit entrance canopy, plowed berms, lamp posts, a row of six cars on the
 * line y = 1252 (teal, yellow, RED = Strawberry's, grey, white, plum), the plow truck in front of them, the staff on y = 1345. Every shot is a camera (zoomTo) plus its own placement of the cast.
 *
 * Shots (scene-local s). A shot starts on the frame nearest its beat start; the line shots end where the next begins.
 *   open   0.00-1.30  establishing wide, the lot, the staff small, the plow's beacon and headlight beam coming in from the left edge (plowengine .3)
 *   plow   1.30-3.35  tracking wide at 620 px/s: the blade pushes a wave of snow along the cars, one car per .25 s (plowscrape 1.5, plowdump 2.7: the last car goes under in a flurry), then it settles on the truck
 *   tu1    3.35-5.07  close on Turnip in the cab window "I plowed the lot."
 *   m1     5.07-6.54  Mango close, the hills behind her "You plowed in the cars."
 *   tu2    6.54-8.30  Turnip again, identical; he raises the mug, drives off at 7.14 (plowengine), exhaust, the beacon sweeping
 *   leave  8.30-9.25  over the shoulder: Mango's back in the foreground, the truck leaving down the lot, the hills
 *   s1     9.25-10.21 Strawberry "Where is my car?"      l1 10.21-11.08 Lemon points "That one."      s2 11.08-12.11 Strawberry "That is a hill." (the red mirror and the antenna above her shoulder)
 *   dig    12.11-14.56 tracking mid-shot: three dig, throw, refill cycles (shovel 12.41 13.01 13.61, spray at each throw); the door opens at 14.11 (snowdump) and a block of snow slides out and buries her to the knees
 *   t1     14.56-15.81 Tomato "Snowman contest!" (the snowman grows; party whistle 14.71)   o1 15.81-17.38 Onion "It is a fall risk." (slip 16.71, thud 17.11, she slides into the snowman, its head tumbles after her)
 *   o2     17.38-19.03 Onion flat on her back, clipboard straight up "Incident report." (sniffle 17.98; the tears freeze to ice beads)
 *   ring   19.03-19.98 Strawberry's phone rings in her mitten (phonering 19.03); the video-call picture-in-picture pops in at the top right
 *   e1 19.98 | s3 21.04 | e2 21.58 | m2 22.45 | e3 23.37 | s4 24.29 | e4 25.36: Eggplant in her car in the ditch (A20.ditchPicture, full frame for her lines, small at the top right for the listeners' shots)
 *   end    26.47-28.12 all five in a row from behind, looking at the lit building, small and cold (sting 26.57)
 */
(() => {
if (!window.TIMELINE_EP20 || !window.H6 || !window.V2 || !window.A20) return;
const { zoomTo } = window.H6;
const A7 = window.A7, A15 = window.A15, A20 = window.A20;
const PI = Math.PI, TAU = PI * 2;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP20, SCN = TLX.scenes.find(s => s.id === 'lot'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'lot') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const ei = k => k * k;
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const snapT = t => Math.round((START + t) * 30) / 30 - START;
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const rndf = (s, k) => (window.FX18 && FX18.rnd) ? FX18.rnd(s, k) : sr(s, k);
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);

/* the sound cues (scene-local s; python3 /tmp/shift_tools/cues.py 20 lot), snapped to the video frame nearest each */
const CUE = { engine1: .3, scrape: 1.5, dump: 2.7, engine2: 7.138, shovel: [12.407, 13.007, 13.607], snowdump: 14.107, whistle: 14.707, slip: 16.714, thud: 17.114, sniffle: 17.975, ring: 19.034, sting: 26.574 };
for (const k in CUE) CUE[k] = Array.isArray(CUE[k]) ? CUE[k].map(snapT) : snapT(CUE[k]);

// ------------------------------------------------------------------ the world: numbers
const GY = 1345, CY = 1252, TY = 1296;            /* staff feet, car ground line, truck ground line */
const ST = .46, CARS_S = .8, TRUCK_S = .9;          /* world scales of the staff, the cars, the truck */
const CAR_X0 = 1100, CAR_DX = 440;
const CAR_COL = [A20.CAR_COLORS.teal, A20.CAR_COLORS.yellow, A20.CAR_COLORS.red, A20.CAR_COLORS.grey, A20.CAR_COLORS.white, A20.CAR_COLORS.plum];
const carX = i => CAR_X0 + CAR_DX * i;
const HERS = 2;                                    /* Strawberry's car: the red one */
const BLADE_DX = 420;                              /* the blade's lead over the truck's origin (world px at TRUCK_S) */
const T_BLADE0 = 1.45, T_DT = .25, V_PLOW = CAR_DX / T_DT;     /* the blade passes car i's centre at T_BLADE0 + .25 i; the truck runs at 1760 px/s */
const truckX = lt => {                              /* the truck's origin: it idles in from the left edge, lurches, runs the row, brakes after the dump, later drives off to the right */
  const xb0 = carX(0) - BLADE_DX, xDump = xb0 + V_PLOW * (CUE.dump - T_BLADE0), xA = xDump + V_PLOW * .02, xStop = xA + 340;
  if (lt <= T_BLADE0) return lerp(xb0 - 560, xb0, Math.pow(sg(lt, .2, T_BLADE0), 3.9));
  if (lt <= CUE.dump + .02) return xb0 + V_PLOW * (lt - T_BLADE0);
  if (lt < CUE.engine2) return lerp(xA, xStop, eo(sg(lt, CUE.dump + .02, CUE.dump + .55)));
  const d = lt - CUE.engine2;
  return xStop + 70 * d * d + 700 * Math.max(0, d - .9) * Math.max(0, d - .9);
};
/* the tu2 camera follows the truck as it pulls away at no more than 160 world px/s (z 4.15: 660 screen px/s, under the 700 limit), so the cab and Turnip's last word stay in the frame */
const followX = lt => {
  if (lt <= CUE.engine2) return 0;
  const N = Math.max(1, Math.ceil((lt - CUE.engine2) * 60)), h = (lt - CUE.engine2) / N; let f = 0;
  for (let i = 0; i < N; i++) { const t0 = CUE.engine2 + i * h; f += Math.min(truckX(t0 + h) - truckX(t0), 160 * h); }
  return f;
};
const GUSTS = [[1.9, 1.5, .8], [7.0, 1.6, .9], [14.0, 1.0, .5], [16.5, .9, .4]];
const windAt = lt => (window.SN20 && SN20.wind) ? SN20.wind(lt, GUSTS) : .3 + .2 * Math.sin(lt * 1.3) + .1 * Math.sin(lt * 2.9 + 1);
const staffWind = lt => clamp(windAt(lt) * 1.25 + .15, -.6, 1);

/* the camera helpers */
const vis = () => ({ x0: CAM.x - 540 / CAM.z, x1: CAM.x + 540 / CAM.z, y0: CAM.y - 960 / CAM.z, y1: CAM.y + 960 / CAM.z });
const inView = (x, r, v) => x + r > v.x0 && x - r < v.x1;
function lightDusk() {
  V2.setLight({ key: [-.5, -.8], keyColor: '#d6e2ff', keyA: .24, rim: '#9fc4ff', rimA: .4, shadow: '#14204a', shadowA: .3, bounce: '#e9f0ff', bounceA: .16 });
}
// ------------------------------------------------------------------ the far set (sky, hills, trees, the building, its windows and canopy, the back berm), baked once at .4 scale and softened a little
const FAR = { x0: -1700, x1: 4700, y0: -1700, y1: 1000, k: .4, cv: null };
const BLD = { x0: 300, x1: 4000, top: 556, base: 892, doorX: 1700 };
function lumpyTop(x, y0, a1, a2, p1, p2) { return y0 + a1 * Math.sin(x / p1) + a2 * Math.sin(x / p2 + 2.1); }
function buildFar() {
  const w = Math.ceil((FAR.x1 - FAR.x0) * FAR.k), h = Math.ceil((FAR.y1 - FAR.y0) * FAR.k), cv = document.createElement('canvas');
  cv.width = w; cv.height = h; cv.__txOK = true;
  const c = cv.getContext('2d'), sav = ctx; ctx = c;
  try {
    c.save(); c.scale(FAR.k, FAR.k); c.translate(-FAR.x0, -FAR.y0); c.lineJoin = 'round'; c.lineCap = 'round';
    const X0 = FAR.x0, X1 = FAR.x1;
    /* the sky: indigo to violet to a rose glow on the horizon */
    c.fillStyle = V2.grad(0, -1700, 0, 900, [[0, '#18205a'], [.5, '#33428c'], [.78, '#6a70b4'], [.92, '#b19cc9'], [1, '#dba9b9']]); c.fillRect(X0, FAR.y0, X1 - X0, 2700);
    c.fillStyle = V2.radial(1700, 860, 40, 1800, [[0, 'rgba(255,196,170,.26)'], [1, 'rgba(255,196,170,0)']]); c.fillRect(X0, 300, X1 - X0, 700);
    /* far hills and a tree line */
    c.beginPath(); c.moveTo(X0, 1000); for (let x = X0; x <= X1; x += 40) c.lineTo(x, 770 + 36 * Math.sin(x / 410) + 22 * Math.sin(x / 163 + 1) - 14 * Math.sin(x / 61)); c.lineTo(X1, 1000); c.closePath();
    c.fillStyle = V2.grad(0, 740, 0, 900, [[0, '#4a5496'], [1, '#2e3a78']]); c.fill(); c.strokeStyle = 'rgba(200,210,242,.5)'; c.lineWidth = 5; c.stroke();
    for (let x = X0; x < X1; x += 34) {
      const j = rndf(61, x), hh = 52 + 64 * rndf(62, x), bw = 18 + 14 * rndf(63, x), by = 850 + 12 * rndf(64, x) + 6 * Math.sin(x / 180), cx = x + j * 22;
      c.fillStyle = j > .5 ? '#232d66' : '#2a3570';
      for (let t2 = 0; t2 < 3; t2++) { const yy = by - hh * (t2 / 3), ww = bw * (1.25 - t2 * .32); c.beginPath(); c.moveTo(cx - ww, yy); c.lineTo(cx, yy - hh * .42); c.lineTo(cx + ww, yy); c.closePath(); c.fill(); }
      c.fillStyle = 'rgba(214,224,250,.55)'; c.beginPath(); c.moveTo(cx - 3, by - hh * .9); c.lineTo(cx, by - hh * 1.02); c.lineTo(cx + 3, by - hh * .9); c.closePath(); c.fill();
    }
    /* the building: a long low wall in violet shade, a roof edge with a thick cap of snow, a dark base */
    const b = BLD;
    c.fillStyle = V2.grad(0, b.top, 0, b.base, [[0, '#7a76a6'], [.5, '#605d8c'], [1, '#46447a']]); c.fillRect(b.x0, b.top, b.x1 - b.x0, b.base - b.top);
    c.strokeStyle = 'rgba(30,28,70,.35)'; c.lineWidth = 3; for (let x = b.x0 + 130; x < b.x1; x += 130) { c.beginPath(); c.moveTo(x, b.top + 24); c.lineTo(x, b.base - 40); c.stroke(); }
    c.fillStyle = '#3a3868'; c.fillRect(b.x0, b.top, b.x1 - b.x0, 24); c.fillStyle = '#2c2a56'; c.fillRect(b.x0, b.base - 40, b.x1 - b.x0, 40);
    c.beginPath(); c.moveTo(b.x0 - 20, b.top + 4); for (let x = b.x0 - 20; x <= b.x1 + 20; x += 16) c.lineTo(x, b.top - 30 + 10 * Math.sin(x / 55) + 7 * Math.sin(x / 17 + 1)); c.lineTo(b.x1 + 20, b.top + 4); c.closePath();
    c.fillStyle = V2.grad(0, b.top - 40, 0, b.top + 6, [[0, '#f8fbff'], [.6, '#dce6f6'], [1, '#aebdde']]); c.fill(); c.strokeStyle = 'rgba(80,100,160,.55)'; c.lineWidth = 3; c.stroke();
    for (const vx of [700, 1250, 2300, 2900, 3500]) { c.fillStyle = '#403e72'; c.fillRect(vx, b.top - 56, 54, 40); c.fillStyle = '#f2f7ff'; c.beginPath(); c.ellipse(vx + 27, b.top - 56, 34, 12, 0, PI, TAU); c.fill(); }
    /* windows: warm, with mullions, blinds and a glow on the wall */
    for (let i = 0, x = b.x0 + 80; x < b.x1 - 90; i++, x += 260) {
      if (Math.abs(x + 55 - b.doorX) < 330) continue;
      const wx = x, wy = 640, ww = 112, wh = 132, tone = rndf(71, i), warm = tone > .75 ? '#ffe9b0' : tone > .35 ? '#ffd77a' : '#ffc25a';
      c.fillStyle = V2.radial(wx + ww / 2, wy + wh / 2, 10, 190, [[0, 'rgba(255,200,110,.5)'], [1, 'rgba(255,200,110,0)']]); c.fillRect(wx - 160, wy - 130, ww + 320, wh + 260);
      c.fillStyle = '#2a2850'; c.beginPath(); c.roundRect(wx - 7, wy - 7, ww + 14, wh + 14, 8); c.fill();
      c.fillStyle = V2.grad(0, wy, 0, wy + wh, [[0, '#fff0c0'], [1, warm]]); c.fillRect(wx, wy, ww, wh);
      c.fillStyle = 'rgba(120,70,30,.28)'; if (rndf(72, i) > .45) c.fillRect(wx, wy, ww, wh * (.25 + .4 * rndf(73, i)));
      c.strokeStyle = '#2a2850'; c.lineWidth = 6; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * .45); c.lineTo(wx + ww, wy + wh * .45); c.stroke();
      c.fillStyle = '#f4f7ff'; c.beginPath(); c.moveTo(wx - 12, wy + wh + 8); c.quadraticCurveTo(wx + ww / 2, wy + wh - 6, wx + ww + 12, wy + wh + 8); c.lineTo(wx + ww + 10, wy + wh + 20); c.lineTo(wx - 10, wy + wh + 20); c.closePath(); c.fill();
    }
    /* the entrance: a flat canopy with a lit underside, two pillars, the glass doors blazing, a sign panel with a fruit-bowl mark (no lettering) */
    const dx = b.doorX;
    c.fillStyle = V2.radial(dx, 800, 20, 520, [[0, 'rgba(255,224,150,.55)'], [1, 'rgba(255,224,150,0)']]); c.fillRect(dx - 540, 500, 1080, 520);
    c.fillStyle = '#2a2850'; c.fillRect(dx - 136, 684, 272, 214); c.fillStyle = V2.grad(0, 690, 0, 880, [[0, '#fff8dc'], [1, '#ffe39a']]); c.fillRect(dx - 124, 692, 112, 188); c.fillRect(dx + 12, 692, 112, 188);
    c.strokeStyle = '#9a8f6a'; c.lineWidth = 5; c.beginPath(); c.moveTo(dx, 692); c.lineTo(dx, 880); c.moveTo(dx - 124, 760); c.lineTo(dx + 124, 760); c.stroke();
    c.fillStyle = '#383668'; c.fillRect(dx - 330, 640, 660, 40); c.fillStyle = V2.grad(0, 680, 0, 760, [[0, 'rgba(255,230,160,.9)'], [1, 'rgba(255,230,160,0)']]); c.fillRect(dx - 310, 680, 620, 80);
    c.fillStyle = '#2f2d5e'; c.fillRect(dx - 322, 680, 18, 210); c.fillRect(dx + 304, 680, 18, 210);
    c.beginPath(); c.moveTo(dx - 340, 646); for (let x = dx - 340; x <= dx + 340; x += 14) c.lineTo(x, 626 + 8 * Math.sin(x / 31) + 5 * Math.sin(x / 11)); c.lineTo(dx + 340, 646); c.closePath(); c.fillStyle = '#f3f8ff'; c.fill(); c.strokeStyle = 'rgba(80,100,160,.6)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#f6ecd0'; c.strokeStyle = '#2a2850'; c.lineWidth = 5; c.beginPath(); c.roundRect(dx - 150, 556, 300, 56, 12); c.fill(); c.stroke();
    for (const [ox, col] of [[-64, '#e84a4a'], [-20, '#ff9b2a'], [24, '#7fc84a'], [66, '#b25ad6']]) { c.fillStyle = col; c.beginPath(); c.arc(dx + ox, 584, 15, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,20,50,.6)'; c.lineWidth = 3; c.stroke(); }
    c.fillStyle = '#6a5a3a'; c.beginPath(); c.moveTo(dx - 90, 592); c.quadraticCurveTo(dx, 622, dx + 90, 592); c.lineTo(dx + 80, 600); c.quadraticCurveTo(dx, 632, dx - 80, 600); c.closePath(); c.fill();
    /* the back berm: a plowed bank of snow along the whole edge of the lot */
    c.beginPath(); c.moveTo(X0, 1000); for (let x = X0; x <= X1; x += 14) c.lineTo(x, lumpyTop(x, 896, 9, 7, 90, 27)); c.lineTo(X1, 1000); c.closePath();
    c.fillStyle = V2.grad(0, 880, 0, 990, [[0, '#e6eefb'], [.5, '#b3c1e2'], [1, '#8794c4']]); c.fill(); c.strokeStyle = 'rgba(80,100,164,.5)'; c.lineWidth = 3; c.stroke();
    c.restore();
  } finally { ctx = sav; }
  /* a touch of softness so the building stays a backdrop behind the faces */
  const cv2 = document.createElement('canvas'); cv2.width = w; cv2.height = h; cv2.__txOK = true; const c2 = cv2.getContext('2d'); c2.filter = 'blur(1.3px)'; c2.drawImage(cv, 0, 0); c2.filter = 'none';
  return cv2;
}
function drawFar(v) {
  if (!FAR.cv) FAR.cv = buildFar();
  const x0 = Math.max(FAR.x0, v.x0), x1 = Math.min(FAR.x1, v.x1), y0 = Math.max(FAR.y0, v.y0), y1 = Math.min(FAR.y1, v.y1);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.drawImage(FAR.cv, (x0 - FAR.x0) * FAR.k, (y0 - FAR.y0) * FAR.k, (x1 - x0) * FAR.k, (y1 - y0) * FAR.k, x0, y0, x1 - x0, y1 - y0);
  /* beyond the baked area: plain sky above and snow below (a wide shot never sees past the baked rectangle, but a close shot at a hard edge must not show black) */
  if (v.y0 < FAR.y0) { ctx.fillStyle = '#18205a'; ctx.fillRect(v.x0, v.y0 - 10, v.x1 - v.x0, FAR.y0 - v.y0 + 12); }
}
// ------------------------------------------------------------------ the live ground, lamps, cars and the truck
const LAMPS = [350, 1250, 2150, 3050, 3950];
function drawGround(v, lt) {
  const x0 = v.x0 - 20, w = v.x1 - v.x0 + 40, y0 = Math.max(v.y0, 990);
  if (v.y1 < 990) return;
  ctx.fillStyle = V2.grad(0, 990, 0, 1760, [[0, '#8794c4'], [.22, '#a6b3da'], [.55, '#cad6ee'], [1, '#e3ebf8']]); ctx.fillRect(x0, y0, w, v.y1 - y0 + 20);
  for (const [y, h, a] of [[1030, 30, .16], [1120, 22, .18], [1190, 16, .16], [1296 + 30, 40, .16], [1420, 46, .12], [1520, 26, .1]]) {   /* the long soft lanes the plow has left */
    ctx.fillStyle = V2.grad(0, y - h, 0, y + h, [[0, 'rgba(96,116,176,0)'], [.5, `rgba(96,116,176,${a})`], [1, 'rgba(96,116,176,0)']]); ctx.fillRect(x0, y - h, w, h * 2);
  }
  /* the plow's tire ruts and a few clumps in the foreground: long pairs of blue streaks with a pale lip, world-anchored (the foreground gets texture, the staff get a floor) */
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [y, amp, ph] of [[1392, 10, .6], [1514, 13, 2.1], [1646, 16, 3.3], [1782, 19, 4.4]]) for (const dy of [-20, 20]) {
    const xs = Math.floor(x0 / 40) * 40, path = new Path2D(); for (let x = xs; x <= x0 + w + 40; x += 40) { const yy = y + dy + amp * Math.sin(x / 540 + ph) + 3 * Math.sin(x / 130 + dy); x === xs ? path.moveTo(x, yy) : path.lineTo(x, yy); }
    ctx.strokeStyle = 'rgba(70,92,164,.2)'; ctx.lineWidth = 8 + (y - 1392) / 90; ctx.stroke(path);
    ctx.save(); ctx.translate(0, 6 + (y - 1392) / 160); ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 3.4 + (y - 1392) / 260; ctx.stroke(path); ctx.restore();
  }
  for (let i = Math.floor(x0 / 260) - 1; i <= (x0 + w) / 260 + 1; i++) {
    const r = rndf(97, i), cx = i * 260 + 130 * rndf(98, i), cy = 1410 + 330 * r, k = .5 + .9 * rndf(99, i);
    ctx.fillStyle = 'rgba(70,92,164,.16)'; ctx.beginPath(); ctx.ellipse(cx + 4, cy + 7 * k, 40 * k, 10 * k, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = V2.grad(0, cy - 16 * k, 0, cy + 8 * k, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(196,212,240,.9)']]); ctx.beginPath(); ctx.ellipse(cx, cy, 36 * k, 13 * k, 0, PI, TAU); ctx.fill();
  }
  ctx.restore();
  /* the pool of warm light in front of the doors, and under each lamp */
  const pool = (x, y, rx, ry, a, col = '255,214,140') => { ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry); ctx.fillStyle = V2.radial(0, 0, .05, 1, [[0, `rgba(${col},${a})`], [1, `rgba(${col},0)`]]); ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore(); };
  pool(BLD.doorX, 1010, 640, 150, .5);
  for (const x of LAMPS) pool(x - 44, 1040, 330, 70, .24);
}
function drawLamps(v, lt) {
  for (let i = 0; i < LAMPS.length; i++) {
    const x = LAMPS[i]; if (!inView(x, 260, v)) continue;
    ctx.fillStyle = '#2a2850'; ctx.fillRect(x - 6, 590, 12, 330); ctx.beginPath(); ctx.moveTo(x - 6, 598); ctx.quadraticCurveTo(x - 6, 566, x - 40, 566); ctx.lineTo(x - 44, 576); ctx.quadraticCurveTo(x - 20, 580, x - 12, 606); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3868'; ctx.beginPath(); ctx.roundRect(x - 62, 566, 40, 14, 6); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = .92 + .08 * Math.sin(lt * 3.1 + i * 2);
    ctx.fillStyle = V2.radial(x - 42, 584, 4, 220, [[0, `rgba(255,222,150,${.62 * fl})`], [.3, `rgba(255,200,110,${.22 * fl})`], [1, 'rgba(255,190,100,0)']]); ctx.fillRect(x - 270, 380, 460, 460);
    ctx.fillStyle = `rgba(255,248,214,${.95 * fl})`; ctx.beginPath(); ctx.ellipse(x - 42, 582, 17, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
}
const carSnow = (i, lt) => { const tb = T_BLADE0 + T_DT * i; return lerp(.35, .9, ss(lt, tb - .22, tb + .78)) + .1 * ss(lt, tb + .9, tb + 3.0); };
function drawCars(lt, v) {
  for (let i = 0; i < 6; i++) { const x = carX(i); if (!inView(x, 400, v)) continue; A20.car(ctx, { x, y: CY, s: CARS_S, color: CAR_COL[i], snow: carSnow(i, lt), seed: 3 + i, t: lt, facing: i === HERS ? 1 : (i % 2 ? -1 : 1) }); }
}
function truckState(lt) {
  const x = truckX(lt);
  const rev = lt >= CUE.engine2 ? Math.exp(-(lt - CUE.engine2) / .22) : 0;   /* the engine catches: the whole truck shudders for a moment on the cue frame */
  return { x: x + 2.4 * Math.sin(lt * 110) * rev, blade: .14 + .14 * ss(lt, 1.2, 1.5) * (1 - ss(lt, 2.75, 3.1)), load: ss(lt, 1.4, 2.0) * (1 - ss(lt, CUE.dump + .02, CUE.dump + .4)), wheelRot: x / (58 * TRUCK_S), on: ss(lt, CUE.engine1, CUE.engine1 + .2) };
}
function truckInfo(lt) { const st = truckState(lt); return Object.assign({ st }, A20.truckInfo({ x: st.x, y: TY, s: TRUCK_S, facing: 1, blade: st.blade })); }
function drawTruck(lt, v, o = {}) {
  const st = truckState(lt);
  if (!inView(st.x + 100, 800, v)) return;
  A20.plowTruck(ctx, { x: st.x, y: TY, s: TRUCK_S, facing: 1, t: lt, blade: st.blade, load: st.load, wheelRot: st.wheelRot, beacon: true, beaconOn: st.on, headlights: lt >= CUE.engine1, cab: true, snow: .35, lamp: o.lamp });
}
/* the beacon's slow amber sweep over the lot (a soft wedge turning with the beacon, one pass every 2.2 s: never a strobe), the plow's spray, the exhaust, and the last car's flurry */
function truckFx(lt, v) {
  const info = truckInfo(lt), st = info.st, bx = info.beacon[0], by = info.beacon[1];
  if (window.FX18 && FX18.cone && inView(bx, 1100, v)) {
    const ph = ((lt / 2.2) % 1 + 1) % 1, ang = -PI / 2 + 1.15 * Math.sin(ph * TAU);
    const pop = 1 + (lt >= CUE.engine1 ? .9 * Math.exp(-(lt - CUE.engine1) / .12) : 0), on = st.on * pop;   /* the amber wash comes up on the engine cue frame (one soft pop, then it settles) */
    FX18.cone(ctx, { x: bx, y: by, ang: ang + .6, spread: .55, len: 1000 * TRUCK_S, color: '#ffb228', alpha: .2 * on, soft: .9 });
    FX18.cone(ctx, { x: bx, y: by, ang: PI - ang + .35, spread: .45, len: 900 * TRUCK_S, color: '#ffb228', alpha: .14 * on, soft: .9 });
  }
  if (window.SN20 && SN20.spray && lt >= CUE.scrape - 1e-6 && lt < 4.4) SN20.spray(ctx, { x: info.blade[0], y: info.blade[1], ang: -.95, t: lt, t0: CUE.scrape, t1: 2.8, seed: 5, power: 1.35, width: .95, gravity: 1100 });
  if (window.SN20 && SN20.flurry && lt > CUE.dump - .05 && lt < CUE.dump + 1.4) SN20.flurry(ctx, { x: carX(5) - 20, y: CY - 90, r: 130, t: lt, t0: CUE.dump, life: 1.2, seed: 9, n: 70 });
  if (window.FX18 && FX18.smoke && inView(info.exhaust[0], 500, v)) {
    const sp = truckX(lt + .05) - truckX(lt - .05);
    FX18.smoke(ctx, { x: info.exhaust[0], y: info.exhaust[1], w: 36, h: 240, t: lt, t0: CUE.engine1, seed: 3, density: .55 + (lt >= CUE.engine2 ? 1.0 * Math.exp(-(lt - CUE.engine2) / .35) : 0), rise: 1, color: '#bcc4de', drift: 60 + 260 * windAt(lt) - sp * 2.2, life: 2.4, rate: 11 });
  }
}
// ------------------------------------------------------------------ the cast: positions, gear, expressions
const SX = { mango: 1620, lemon: 1790, straw: 1950, tom: 2230, onion: 2700 };
const SEEDS = { mango: 61, lemon: 62, straw: 63, tom: 64, onion: 65 };
const CTOR = { mango: A7.mango, lemon: A7.lemon, straw: A7.straw, tom: A15.tomato, onion: A15.onion };
const snowOn = lt => .12 + .7 * ss(lt, 0, 22);
function person(id, lt, ov = {}) {
  const seed = SEEDS[id], g = ov.gear || {}, base = CTOR[id](Object.assign({ t: lt, seed }, ov.pre || {}));
  if (id === 'tom') { base.hold = {}; base.arms = { l: 'rest', r: 'rest' }; }
  A20.winter(base, Object.assign({ wind: staffWind(lt), snow: snowOn(lt), breath: true, breathSize: .9, shiver: .3, breathPhase: (seed * .37) % 1.9, breathDir: id === 'straw' || id === 'lemon' ? 1 : -1 }, g));
  const o = Object.assign(base, { x: SX[id], y: GY, s: ST }, ov.o || {});
  o.x += o.shiverDx || 0; o.y += o.shiverDy || 0;
  if (ov.post) ov.post(o);
  return o;
}
const drawP = o => { if (o.s < .02) return; drawChar(o); };
/* where a person's face is, for the cameras (the same formula as H6.faceC) */
const faceXY = o => { const k = KINDS[o.kind], leg = o.noLegs ? 0 : (k.leg || 90); return [o.x, o.y - (o.lift || 0) - (leg + k.ry * .9 - (k.eyeY + k.mouthY) / 2) * (o.s || 1)]; };
// ------------------------------------------------------------------ shots: starts (frame snapped), cameras, content
const SHOT_IDS = ['open', 'plow', 'tu1', 'm1', 'tu2', 'leave', 's1', 'l1', 's2', 'dig', 't1', 'o1', 'o2', 'ring', 'e1', 's3', 'e2', 'm2', 'e3', 's4', 'e4', 'end'];
const SHOTS = SHOT_IDS.map(id => ({ id, s: id === 'open' ? 0 : snapT(bS(id)) }));
const shotAt = lt => { let r = SHOTS[0]; for (const sh of SHOTS) { if (lt >= sh.s - 1e-6) r = sh; else break; } return r; };
const shotIdx = id => SHOTS.findIndex(sh => sh.id === id);
const shotEnd = id => { const i = shotIdx(id); return i + 1 < SHOTS.length ? SHOTS[i + 1].s : 28.124; };
const CAB_T = 6.5;   /* the truck's parked place (the cab camera holds there; at 7.14 the truck leaves under it) */
const cabCenter = (lt = CAB_T) => [truckX(lt) + TRUCK_S * (TRUCK_CABC[0]), TY + TRUCK_S * (TRUCK_CABC[1])];
const TRUCK_CABC = [-28, -254];
const CAM_FN = {
  open: lt => [1560 + 40 * sg(lt, 0, 1.31), 1095, lerp(.58, .62, sg(lt, 0, 1.31))],   /* the high establishing wide; the cut to the tracking shot is a re-frame of 1.25x */
  plow: lt => {   /* 900 world px/s at z .7 = 630 screen px/s, then a smooth stop (the speed falls linearly to 0 at the cut) while it pushes in a little */
    const t1 = 2.55, T = 3.344 - t1, d = Math.max(0, lt - t1), x = 1500 + 900 * (Math.min(lt, t1) - 1.31) + 900 * (d - d * d / (2 * T)), e = ss(lt, 2.3, 3.344);
    return [x, lerp(1130, 1122, e), lerp(.7, .86, e)];
  },
  tu1: lt => { const c = cabCenter(CAB_T); return [c[0] + 1.5 * Math.sin(lt * 1.7), c[1] + 2 + 1.5 * Math.cos(lt * 1.3), lerp(3.9, 4.15, sg(lt, bS('tu1'), bE('tu1')))]; },
  tu2: lt => { const c = cabCenter(CAB_T); return [c[0] + followX(lt) + 1.5 * Math.sin(lt * 1.7), c[1] + 2 + 1.5 * Math.cos(lt * 1.3), lerp(3.9, 4.15, sg(lt, bS('tu2'), bE('tu2')))]; },
};
// ------------------------------------------------------------------ snow layers (screen space: constant flake size at every zoom, the near layer only in wides) and the little things
function snowLayer(lt, slice, o = {}) {
  if (!(window.SN20 && SN20.snow)) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  SN20.snow(ctx, Object.assign({ x0: 0, y0: 0, x1: 1080, y1: 1920, t: lt, seed: 11, layers: 3, density: .95, fall: 1, gusts: GUSTS, sway: 1, slice, tone: 'light', size: 1 }, o));
  ctx.restore();
}
function glowAt(x, y, r, col, a) { if (window.FX18 && FX18.glow) FX18.glow(ctx, { x, y, r, color: col, alpha: a, core: .6 }); else V2.glow(x, y, r, col.replace('#', ''), a, 'screen', .3); }
/* the staff, drawn in order (a shot lists who is in it); extra per person: ov[id] = { o: {...overrides}, pre: {...constructor options}, gear: {...} } */
function drawStaff(lt, ids, ov = {}, all = {}) {
  const out = {};
  for (const id of ids) { const o = person(id, lt, Object.assign({}, all, ov[id] || {})); out[id] = o; drawP(o); }
  return out;
}
const LOOK_L = [-.8, .1], LOOK_R = [.8, .1];
// ------------------------------------------------------------------ the shots' content
const SD = {};
const CAST_ALL = ['mango', 'lemon', 'straw', 'tom', 'onion'];
/* Turnip in the cab window: clipped to the window, the glass and a wash of beacon light over him */
function drawCabShot(lt, v, o = {}) {
  const st = truckState(lt), T0 = { x: st.x, y: TY, s: TRUCK_S, facing: 1 }, info = A20.truckInfo(Object.assign({ blade: st.blade }, T0));
  drawTruck(lt, v, { lamp: false });
  const [x0, y0, x1, y1] = info.cab, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ts = .41 * TRUCK_S, ph = ((lt / 2.2) % 1 + 1) % 1, sw = .5 + .5 * Math.cos(ph * TAU);
  ctx.save(); A20.cabClip(ctx, T0);
  const leaving = lt > CUE.engine2 + .35;
  drawP(A20.turnip(Object.assign({ t: lt, noLegs: true, noShadow: true, noReflect: true, x: cx + 1, y: cy + 14 + ts * 90, s: ts, seed: 241, transit: leaving, look: [0, 0], gear: { mittens: true } }, o)));
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(info.beacon[0], info.beacon[1], 4, 260 * TRUCK_S, [[0, `rgba(255,176,40,${.1 + .26 * sw})`], [1, 'rgba(255,150,30,0)']]); ctx.fillRect(x0 - 200, y0 - 200, x1 - x0 + 400, y1 - y0 + 400); ctx.restore();
  ctx.restore();
  A20.cabGlass(ctx, Object.assign({ t: lt }, T0));
}
SD.open = (lt, sh, v) => {
  drawTruck(lt, v); truckFx(lt, v);
  drawStaff(lt, ['mango', 'lemon', 'straw', 'tom'], {}, { o: { look: LOOK_L } });
  if (lt >= CUE.engine1) {   /* the engine catches off screen: the plow's headlights wash the left edge of the lot, one soft pop on the cue frame, then they settle (plowengine .3) */
    const k = .5 + .5 * ss(lt, CUE.engine1, CUE.engine1 + .3), a = .2 * k * (1 + 1.4 * Math.exp(-(lt - CUE.engine1) / .14));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = V2.radial(-30, 1080, 20, 560, [[0, `rgba(255,196,110,${Math.min(.6, a * 2.1)})`], [.5, `rgba(255,190,100,${Math.min(.3, a * .9)})`], [1, 'rgba(255,190,100,0)']]); ctx.fillRect(0, 500, 600, 1160); ctx.restore();
  }
};
SD.plow = (lt, sh, v) => {
  drawTruck(lt, v); truckFx(lt, v);
  const bx = truckInfo(lt).blade[0];
  const ov = {}; for (const id of CAST_ALL) ov[id] = { o: { transit: true, look: [clamp((bx - SX[id]) / 500, -1, 1) * .8, .1] } };
  drawStaff(lt, CAST_ALL, ov);
};
SD.tu1 = (lt, sh, v) => { drawCabShot(lt, v, { expr: lt > wS('tu1', 3) - .1 ? 'turnip_proud' : 'turnip_flat' }); };
SD.tu2 = (lt, sh, v) => {
  const up = ss(lt, 6.8, 7.25) * (1 - ss(lt, 7.75, 8.1));
  drawCabShot(lt, v, { expr: lt > wS('tu2', 3) - .1 && lt < 7.6 ? 'turnip_proud' : 'turnip_flat', mugUp: up });
  truckFx(lt, v);
};
// m1: Mango close, flat, a look toward the truck; the hills behind her
SD.m1 = (lt, sh, v) => {
  drawStaffClose(lt, v, 'mango', { mango: { o: { yaw: .32, look: [.9, .02], expr: 'dead', arms: { l: 'rest', r: 'rest' } } } });
};
// leave: backs to the camera, the hills ahead, the beacon's amber sweeping in from the right as the truck goes
SD.leave = (lt, sh, v) => {
  const ph = ((lt / 2.2) % 1 + 1) % 1, sw = .5 + .5 * Math.cos(ph * TAU);
  const o = { yaw: PI, headYaw: PI - .3, look: [.3, 0], expr: 'neutral' };
  drawStaff(lt, ['mango', 'lemon', 'straw'], { mango: { o: Object.assign({}, o, { headYaw: PI - .25 }) }, lemon: { o: Object.assign({}, o, { headYaw: PI + .12 }) }, straw: { o: Object.assign({}, o, { headYaw: PI - .35 }), post: x => heldShovel(x, lt) } });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = V2.grad(1080, 0, 360, 0, [[0, `rgba(255,170,50,${.2 + .22 * sw})`], [1, 'rgba(255,150,30,0)']]); ctx.fillRect(0, 0, 1080, 1500); ctx.restore();
  if (window.FX18 && FX18.smoke) FX18.smoke(ctx, { x: 2450, y: 1110, w: 40, h: 160, t: lt, t0: bS('leave') - 1.3, seed: 8, density: .35, color: '#c4cce2', drift: -100, life: 2.2, rate: 7 });
};
// s1: Strawberry, close, a look round: "Where is my car?"
SD.s1 = (lt, sh, v) => {
  const k = sg(lt, bS('s1'), bE('s1'));
  drawStaffClose(lt, v, 'straw', { straw: { o: { yaw: lerp(-.35, .2, ss(k, .2, .8)), look: [lerp(-.8, .6, ss(k, .1, .9)), .05], expr: 'hopeful' }, post: o => heldShovel(o, lt) } });
};
// l1: Lemon points, a mound among mounds
SD.l1 = (lt, sh, v) => {
  const k = ss(lt, bS('l1') - .05, bS('l1') + .2);
  drawStaffClose(lt, v, 'lemon', { lemon: { o: { yaw: .32, look: [.8, -.1], expr: 'neutral', arms: { l: 'rest', r: k > .05 ? 'hold' : 'rest' }, grip: { r: [lerp(80, 124, k), lerp(70, -62, k)] }, hand: { r: 'point' } } }, straw: { o: { yaw: -.2, expr: 'neutral' }, post: o => heldShovel(o, lt) } });
};
// s2: the hill, the red mirror and the antenna above her shoulder: "That is a hill."
SD.s2 = (lt, sh, v) => {
  drawStaffClose(lt, v, 'straw', { straw: { o: { yaw: .12, look: [.55, -.25], expr: 'dead' }, post: o => heldShovel(o, lt) } });
};
// dig: three dig, throw, refill cycles at the red car's door, then the door opens and the snow comes out
const shovelTip = t => A20.shovelThrow({ kind: 'straw', x: SXP, y: GY, s: ST, seed: SEEDS.straw }, t, CUE.shovel[0]);
SD.dig = (lt, sh, v) => {
  const land = CUE.snowdump, tD = land - .32, after = lt >= land, dk = ss(lt, tD, tD + .22);
  drawPit(shovelTip(CUE.shovel[0]).x, lt);
  /* the door pops open (a dark gap and the red panel swinging out) and a block of snow comes out and slides down behind her onto her legs */
  const door = A20.carInfo({ x: carX(HERS), y: CY, s: CARS_S, facing: 1 }).door;
  if (dk > .02) {
    ctx.save(); ctx.translate(door[0] + 8, door[1] - 4); ctx.scale(.8, .8);
    ctx.fillStyle = '#1d1830'; ctx.strokeStyle = OUT_; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-30, -40, 62, 128, 8); ctx.fill(); ctx.stroke();
    const th = dk * 1.15; ctx.fillStyle = V2.grad(0, -40, 0, 88, [[0, '#e94a68'], [1, '#a31f3a']]); ctx.beginPath(); ctx.moveTo(32, -40); ctx.lineTo(32 + 54 * Math.sin(th), -34); ctx.lineTo(32 + 54 * Math.sin(th), 80); ctx.lineTo(32, 88); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    const sk = sg(lt, tD + .04, land), bx = lerp(door[0] - 10, SXP + 30, ei(sk)), by = lerp(door[1] + 30, GY - 30, sk * sk), ang = -.4 * sk;
    if (lt < land + .06) { ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); ctx.fillStyle = V2.grad(0, -40, 0, 40, [[0, '#f9fcff'], [1, '#b8c8e6']]); ctx.strokeStyle = 'rgba(70,92,150,.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-58, -38, 116, 76, 20); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  const o = person('straw', lt, { o: { yaw: after ? .25 : .75, expr: after ? 'shock' : (lt < CUE.shovel[0] ? 'weak' : 'sour'), look: [.9, .35], squash: after && lt > land ? .16 * Math.exp(-(lt - land) * 7) : 0, plant: true }, post: p => { A20.shovelThrow(p, lt, after ? 1e9 : CUE.shovel[0]); if (after) p.arms.l = 'up'; else p.rot = .05 * Math.sin((lt - CUE.shovel[0]) * TAU / .6); } });   /* at the impact the shovel drops to her side and one arm flies up */
  if (window.SN20 && SN20.flurry && lt >= land && lt < land + 1.3) SN20.flurry(ctx, { x: SXP + 6, y: GY - 30, r: 96, t: lt, t0: land, life: 1.15, seed: 31, n: 56 });
  drawP(o);
  if (window.SN20 && SN20.spray) CUE.shovel.forEach((tp, k) => { const tr = tp + A20.SHOVEL.release * A20.SHOVEL.period, tt = shovelTip(tr); if (lt >= tr && lt < tr + 1.8) SN20.spray(ctx, { x: tt.x, y: tt.y, ang: -.8, t: lt, t0: tr, t1: tr + .1, seed: 20 + k, power: .95, width: .85, gravity: 1200 }); });
  drawPile(lt);
};
const OUT_ = 'rgba(25,10,20,.92)';
// t1: Tomato and the snowman growing; the party whistle pops confetti
SD.t1 = (lt, sh, v) => {
  const hop = lt > CUE.whistle - .1 ? Math.abs(Math.sin((lt - CUE.whistle) * 9)) * 16 : 0, tw = CUE.whistle;
  drawSnowman(lt);
  if (window.SN20 && SN20.flurry) for (const [tb, xx] of [[bS('t1') + .2, 0], [bS('t1') + .55, 1]]) if (lt >= tb && lt < tb + .6) SN20.flurry(ctx, { x: SW.x + 8 * xx, y: GY - 70 - 70 * xx, r: 46, t: lt, t0: tb, life: .5, seed: 41 + xx, n: 22 });
  const o = person('tom', lt, { o: { yaw: .35, y: GY - hop, expr: 'happy', look: [.6, -.2], arms: { l: 'cheer', r: 'cheer' } } });
  drawP(o);
  /* confetti at the whistle */
  if (lt >= tw && lt < tw + 1.4) {
    const cols = ['#ff4f8a', '#ffd23a', '#42c8ff', '#7bdc5a', '#ff8a2a', '#ffffff'], x0 = SX.tom + 28, y0 = GY - 120;
    for (let i = 0; i < 46; i++) {
      const a = -PI / 2 + (rndf(51, i) - .5) * 1.9, sp = 170 + 260 * rndf(52, i), d = lt - tw, px = x0 + Math.cos(a) * sp * d * (1 - .25 * d) + 16 * Math.sin(d * 7 + i), py = y0 + Math.sin(a) * sp * d + 360 * d * d;
      ctx.save(); ctx.translate(px, py); ctx.rotate(d * 8 + i); ctx.globalAlpha = 1 - sg(d, 1.0, 1.4); ctx.fillStyle = cols[i % 6]; ctx.fillRect(-5, -2.4, 10, 4.8); ctx.restore();
    }
  }
};
// o1 / o2: Onion steps onto the ice, slips, slides on her back into the snowman (its head comes off) and writes the incident report lying down
function onionShot(lt, v) {
  const { o, st } = onionO(lt, { o: { expr: lt < CUE.slip ? 'onion_stoic' : 'onion_wail', arms: lt < ONION.walk1 ? { l: 'hold', r: 'rest' } : { l: 'hold', r: lt < CUE.thud ? 'flail' : 'rest' } }, pre: {} });
  const upK = ss(lt, CUE.thud + .15, CUE.thud + .55), fk = ss(lt, ONION.walk1, CUE.slip + .12), fall = sg(lt, CUE.slip, CUE.thud);
  if (lt >= ONION.walk1) {   /* from the first wobble the clipboard rides a world-space direction: flung out up and away from her face in the fall, then straight up while she lies (the body is turned by o.rot) */
    const wa = lt < CUE.thud ? lerp(-1.1, -.5, fall) : lerp(-.5, 0, upK), wx = Math.sin(wa), wy = -Math.cos(wa), c = Math.cos(o.rot), sn = Math.sin(o.rot);
    const bx = wx * c + wy * sn, by = -wx * sn + wy * c, sx = -97, sy = 12, L = 108;   /* the world direction in the body's own frame */
    o.grip = { l: [lerp(-62, sx + bx * L, fk), lerp(84, sy + by * L, fk)] };
    o.hold = { l: 'fp15_tabletclip' }; o.tabAt = [lerp(.3, .5, fk), lerp(.12, .5, fk)]; o.tabScale = lerp(1, .9, fk);
    o.tabRot = -o.rot * fk - .04 * (1 - fk) + .06 * Math.sin(lt * 15) * upK;
  }
  o.acc = (o.acc || []).filter(a => a !== 'fp20_ice').concat('fp20_ice'); o.iceBeads = ss(lt, CUE.thud + .35, CUE.thud + 1.7);
  drawIce(v); drawSnowman(lt); drawHead(lt);
  if (window.SN20) {   /* the impact puff and the spray go BEHIND her so that no flake crosses her face */
    if (SN20.flurry && lt >= CUE.thud && lt < CUE.thud + 1.1) SN20.flurry(ctx, { x: 2612, y: GY - 14, r: 110, t: lt, t0: CUE.thud, life: 1.0, seed: 61, n: 54 });
    if (SN20.spray && lt >= CUE.thud && lt < CUE.thud + 1.8 && st.slideV > 6) SN20.spray(ctx, { x: o.x - 78, y: GY - 6, ang: -2.55, t: lt, t0: CUE.thud, t1: CUE.thud + .7, seed: 62, power: .8, width: .7, gravity: 1000 });
  }
  drawP(o);
  return o;
}
SD.o1 = (lt, sh, v) => { onionShot(lt, v); };
SD.o2 = (lt, sh, v) => { onionShot(lt, v); };
// ring: Strawberry's phone buzzes in her mitten; she answers on speaker
const answerK = lt => ss(lt, 19.55, 19.82) * (1 - ss(lt, 20.0, 20.3));
function drawPiP(lt, big, o = {}) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const pt = Math.max(ss(lt, bS('e2') - .05, bS('e2') + .25) * (1 - ss(lt, bE('e2') + .12, bE('e2') + .42)), ss(lt, bS('e3') - .05, bS('e3') + .25) * (1 - ss(lt, bE('e3') + .12, bE('e3') + .42)));
  const st = ss(lt, bS('e4') - .05, bS('e4') + .5), common = { t: lt, eat: 0, phoneRing: answerK(lt), point: pt, settle: st, frame: true };
  if (!big) {
    const k = eb(sg(lt, 19.42, 19.8)); if (k > .04) A20.ditchPicture(ctx, Object.assign({ x: 868, y: 440, w: 340 * k, h: 430 * k }, common, o));
  } else {
    const k = sg(lt, bS('e1'), bE('e4')); A20.ditchPicture(ctx, Object.assign({ x: 540, y: 706, w: 1010, h: 1260, zoom: lerp(1.85, 2.1, k), fx: 326, fy: 322 }, common, o));
  }
  ctx.restore();
}
SD.ring = (lt, sh, v) => {
  const k = answerK(lt), rg = lt >= CUE.ring;
  const o = drawStrawPile(lt, v, { o: { yaw: .1, look: [.15, .5], expr: 'neutral', arms: { l: 'rest', r: 'hold' }, grip: { r: [lerp(106, 70, k), lerp(52, -6, Math.max(k, ss(lt, 19.2, 19.5) * .6))] }, hold: { r: 'fp20_phone' }, phoneLit: 1, phoneBuzz: rg && k < .5 ? 1 : 0 } });
  if (rg) { const hx = o.x + ST * 70, hy = faceXY(o)[1] + ST * 70; for (let i = 0; i < 3; i++) { const kk = ((lt - CUE.ring) / .6 - i * .33); if (kk > 0 && kk < 1.0 && lt < 19.9) V2.ring(hx, hy - 30, kk, { r0: 14, r1: 76, color: '255,240,160', lw: 4, alpha: .55, bloom: 0 }); } }
  drawPiP(lt, false);
};
function drawStrawPile(lt, v, ov) {
  const subj = drawStaffClose(lt, v, 'straw', { straw: ov });
  drawPile(lt); return subj;
}
// the call: Eggplant's picture full frame for her lines, small at the top right for the listeners
const callStraw = (lt, v, ex) => drawStrawPile(lt, v, { o: Object.assign({ yaw: .15, look: [.5, -.45], arms: { l: 'rest', r: 'rest' } }, ex || {}) });
for (const id of ['e1', 'e2', 'e3', 'e4']) SD[id] = (lt, sh, v) => { REG.suppress++; try { drawStrawPile(lt, v, { o: { look: [.3, -.3], expr: 'neutral' } }); } finally { REG.suppress--; } drawPiP(lt, true); };
SD.s3 = (lt, sh, v) => { callStraw(lt, v, { expr: 'hopeful' }); drawPiP(lt, false); };
SD.m2 = (lt, sh, v) => { drawStaffClose(lt, v, 'mango', { mango: { o: { yaw: -.3, look: [.8, -.5], expr: 'sour' } } }); drawPiP(lt, false); };
SD.s4 = (lt, sh, v) => { callStraw(lt, v, { expr: 'weak' }); drawPiP(lt, false); };
// end: all five from behind, in a row, looking at the lit building, small and cold
const endX = () => ({ mango: 1690, lemon: 1820, straw: SXP, tom: 2080, onion: 2200 });
SD.end = (lt, sh, v) => {
  const order = ['mango', 'lemon', 'straw', 'tom', 'onion'];
  const hy = { mango: .2, lemon: -.15, straw: .3, tom: -.25, onion: .1 };
  const nb = [], END_X = endX(); for (const id of order) { const o = person(id, lt, { gear: { breath: false }, o: { x: END_X[id], yaw: PI, headYaw: PI + hy[id], expr: 'neutral' } }); drawP(o); nb.push(o); }
  drawPile(lt);
  if (lt >= CUE.sting) glowAt(BLD.doorX, 930, 460, '#ffdca0', .42 * Math.exp(-(lt - CUE.sting) / .3));   /* the sting: the lit entrance swells once, on the cue frame (with the bloom pop in fx) */
  if (window.SN20 && SN20.breath) for (let i = 0; i < nb.length; i++) { const o = nb[i], k = KINDS[o.kind], fy = faceXY(o)[1]; SN20.breath(ctx, { x: o.x + (hy[order[i]] > 0 ? 1 : -1) * ST * 62, y: fy + ST * 28, t: lt, seed: 70 + i, dir: hy[order[i]] > 0 ? 1 : -1, size: .5, alpha: .75, phase: i * .43 }); }
};
/* @@LOT-SD4 */


// ------------------------------------------------------------------ persistent things: the pile on Strawberry, the snowman and its head, the ice, Onion's fall, the dig pit
const SW = { x: 2380, s: .62 };                       /* the snowman */
const ICE = { x: 2600, rx: 96 };                      /* the patch of ice Onion steps on */
const HEAD_T0 = snapT(17.42);                         /* the head comes off */
const SXP = 1950;                                     /* Strawberry's spot: beside her car, where she digs and where the pile lands */
const pileK = lt => ss(lt, CUE.snowdump, CUE.snowdump + .35);
const snowmanBuild = lt => lt < bS('t1') ? 0 : .2 + .8 * sg(lt, bS('t1') + .05, 17.1);
function drawPile(lt, x = SXP) { const k = pileK(lt); if (k < .03 || !(window.SN20 && SN20.bank)) return; SN20.bank(ctx, { x, y: GY + 8, w: 215 * k, h: 46 * k, seed: 4, shade: .5 }); }
function drawIce(v) {
  if (!inView(ICE.x, 200, v)) return;
  ctx.save(); ctx.translate(ICE.x, GY + 6); ctx.scale(ICE.rx, 1);
  const g = V2.grad(0, -22, 0, 22, [[0, 'rgba(206,236,255,.95)'], [1, 'rgba(128,176,226,.9)']]); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 1, 20, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(70,110,180,.7)'; ctx.lineWidth = 3 / ICE.rx * 1; ctx.restore();
  ctx.save(); ctx.translate(ICE.x, GY + 6); ctx.strokeStyle = 'rgba(70,110,180,.65)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, ICE.rx, 20, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-60, -8); ctx.quadraticCurveTo(-30, -14, 10, -11); ctx.stroke(); ctx.beginPath(); ctx.moveTo(30, 6); ctx.lineTo(62, 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,110,180,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(0, 9); ctx.lineTo(24, 1); ctx.stroke();
  ctx.restore();
}
function drawSnowman(lt) {
  const b = snowmanBuild(lt); if (b < .19) return;
  A20.snowman(ctx, { x: SW.x, y: GY - 4, s: SW.s, build: b, hat: 'party', t: lt, seed: 5, part: lt >= HEAD_T0 ? 'body' : 'all' });
}
/* the head: off at HEAD_T0, a hop to the right, a landing and a roll that dies away next to Onion's head */
function headState(lt) {
  const d = lt - HEAD_T0, r = 34 * SW.s, x0 = SW.x - 6 * SW.s, y0 = GY - 4 - 232 * SW.s, vx = 470, vy = -300, g = 1500, yG = GY - r;
  const tL = (-vy + Math.sqrt(vy * vy + 2 * g * (yG - y0))) / g;     /* the time the ballistic arc reaches the ground */
  if (d < tL) return { x: x0 + vx * d, y: y0 + vy * d + .5 * g * d * d, rot: 3.2 * d, air: true };
  const xL = x0 + vx * tL, dd = d - tL, k = 4.5, run = 240 * (1 - Math.exp(-k * dd)) / k;
  const bounce = dd < .25 ? Math.abs(Math.sin(dd * 12.5)) * 18 * Math.exp(-dd * 6) : 0;
  return { x: xL + run, y: yG - bounce, rot: 3.2 * tL + (xL + run - xL) / r * 1.0, air: false };
}
function drawHead(lt) {
  if (lt < HEAD_T0) return; const h = headState(lt);
  A20.snowman(ctx, { x: h.x, y: h.y, s: SW.s, part: 'head', rot: h.rot, t: lt, seed: 5, hat: 'party' });
}
const ONION = { x0: 2700, xIce: 2640, xEnd: 2535, walk0: 15.95, walk1: 16.6 };
function onionState(lt) {
  const slip = CUE.slip, thud = CUE.thud, fall = sg(lt, slip, thud), land = lt >= thud, dl = Math.max(0, lt - thud);
  let x = lt < ONION.walk1 ? lerp(ONION.x0, ONION.xIce, ss(lt, ONION.walk0, ONION.walk1)) : lt < slip ? ONION.xIce : lt < thud ? lerp(ONION.xIce, 2615, fall) : lerp(2615, ONION.xEnd, eo(sg(lt, thud, thud + .75)));
  const rotK = lt < slip ? 0 : lt < thud ? Math.pow(fall, .85) : 1, lift = lt < slip ? 0 : lt < thud ? Math.sin(PI * fall) * 38 : 0;
  const rot = 1.3 * rotK + (land ? .07 * Math.exp(-dl * 7) * Math.cos(dl * 22) : 0);
  const lying = rotK;   /* 0 standing .. 1 lying */
  const walking = lt >= ONION.walk0 && lt < ONION.walk1, dist = Math.max(0, ONION.x0 - x);
  return { x, rot, lift, lying, walking, dist, landed: land, dl, slideV: land ? 160 * Math.exp(-dl * 3.2) : 0 };
}
function onionO(lt, extra = {}) {
  const st = onionState(lt), id = 'onion', k = KINDS.onion, leg = k.leg, ry9 = k.ry * .9, standC = ST * (leg + ry9), lyingC = ST * 96, cy = GY - lerp(standC, lyingC, st.lying) - st.lift;
  const o = person(id, lt, { gear: { shiver: lt > thudFrost() ? .5 : .3 }, o: Object.assign({ expr: 'onion_stoic', yaw: -.95, look: [-.8, .15] }, extra.o || {}), pre: extra.pre });
  o.x = st.x; o.y = cy + standC; o.rot = st.rot;
  if (st.walking) { o.gaitW = st.dist / ST; o.dir = -1; o.axis = 'x'; }
  if (st.lying > 0) { o.yaw = lerp(-.95, 0, Math.min(1, st.lying * 2)); }
  return { o, st };
}
const thudFrost = () => CUE.thud;
/* the dig: where the shovel plunges and when, how deep the pit is */
const pitDepth = lt => { let d = 0; for (const tp of CUE.shovel) if (lt >= tp) d = Math.max(d, Math.exp(-(lt - tp) / .42)); return d; };
function drawPit(x, lt) {
  const d = pitDepth(lt); if (d < .03) return;
  ctx.save(); ctx.translate(x, GY + 2); ctx.globalAlpha = Math.min(1, d * 1.3);
  ctx.fillStyle = V2.radial(0, 0, 2, 60, [[0, 'rgba(58,78,150,.9)'], [.7, 'rgba(84,104,176,.6)'], [1, 'rgba(120,140,200,0)']]); ctx.beginPath(); ctx.ellipse(0, 0, 58 * (.6 + .4 * d), 15 * (.6 + .4 * d), 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(250,252,255,.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -2, 56 * (.6 + .4 * d), 13 * (.6 + .4 * d), 0, PI * 1.05, PI * 1.95); ctx.stroke();
  ctx.restore();
}
// ------------------------------------------------------------------ cameras for the staff shots
const faceY = id => faceXY({ kind: CTOR_KIND[id], x: SX[id], y: GY, s: ST })[1];
const CTOR_KIND = { mango: 'mango', lemon: 'lemon', straw: 'straw', tom: 'tomato', onion: 'onion' };
const closeCam = (id, z, sy = 700, dx = 0, lt = 0, t0 = 0, t1 = 1, dz = .05) => [SX[id] + dx + 3 * Math.sin(lt * .9 + SEEDS[id]), faceY(id) + (960 - sy) / z, z * (1 + dz * sg(lt, t0, t1))];
Object.assign(CAM_FN, {
  m1: lt => closeCam('mango', 3.4, 640, 14, lt, bS('m1'), bE('m1')),
  leave: lt => [1800 + 6 * Math.sin(lt * 1.2), 1190, 1.5 + .06 * sg(lt, bS('leave'), bE('leave'))],
  s1: lt => closeCam('straw', 3.4, 640, -6, lt, bS('s1'), bE('s1')),
  l1: lt => closeCam('lemon', 2.8, 640, 60, lt, bS('l1'), bE('l1')),
  s2: lt => { const f = closeCam('straw', 2.4, 740, 24, lt, bS('s2'), bE('s2')); return f; },
  dig: lt => { const k = sg(lt, bS('dig'), bE('dig')); return [SXP + 50 + 10 * Math.sin(lt * 2.4), 1240, lerp(2.0, 2.1, k)]; },
  t1: lt => [(SX.tom + SW.x) / 2 + 6, 1228, 2.35 + .06 * sg(lt, bS('t1'), bE('t1'))],
  o1: lt => { const o = onionState(lt); return [lerp(2650, 2570, ss(lt, 16.6, 17.4)), 1236, 2.0]; },
  o2: lt => { CAM.shake = 0; return [2566, 1262, 2.5 + .05 * sg(lt, bS('o2'), bE('o2'))]; },
  ring: lt => closeCam('straw', 3.1, 680, 8, lt, bS('ring'), bE('ring')),
  s3: lt => closeCam('straw', 3.1, 740, -8, lt, bS('s3'), bE('s3')),
  m2: lt => closeCam('mango', 3.1, 740, 10, lt, bS('m2'), bE('m2')),
  s4: lt => closeCam('straw', 3.1, 740, -8, lt, bS('s4'), bE('s4')),
  e1: lt => [SXP, 1240, 1.2], e2: lt => [SXP, 1240, 1.2], e3: lt => [SXP, 1240, 1.2], e4: lt => [SXP, 1240, 1.2],
  end: lt => [1950, 1215, lerp(1.32, 1.42, sg(lt, bS('end'), 28.1))],
});
/* neighbours in a close shot are drawn but not held to the layout audit (the subject is) */
const drawBg = o => { REG.suppress++; try { drawChar(o); } finally { REG.suppress--; } };
function drawStaffClose(lt, v, subj, ov = {}, ids = CAST_ALL) {
  for (const id of ids) {
    if (id === subj || !inView(SX[id], 90, v)) continue;
    const o = person(id, lt, Object.assign({}, ov[id] || {})); drawBg(o);
  }
  const o = person(subj, lt, ov[subj] || {}); drawP(o); return o;
}
const heldShovel = (o, lt, t0 = 999) => { A20.shovelThrow(o, lt, t0); return o; };
/* @@LOT-7 */
/* @@LOT-6 */
/* @@LOT-5 */
/* @@LOT-4 */
/* @@LOT-3 */
// ------------------------------------------------------------------ the scene
function drawL(lt) {
  const sh = shotAt(lt), v = vis();
  lightDusk();
  drawFar(v); drawGround(v, lt); drawLamps(v, lt);
  snowLayer(lt, CAM.z < 1.5 ? 'back' : 'all', { fore: false });
  drawCars(lt, v);
  (SD[sh.id] || SD.open)(lt, sh, v);
  if (CAM.z < 1.5) snowLayer(lt, 'front', { alpha: .9 });
}
const LOTSC = {
  shot: lt => shotAt(lt).id,
  cam(lt) { const sh = shotAt(lt), f = CAM_FN[sh.id]; const [x, y, z] = f ? f(lt) : [2000, 1180, 1]; zoomTo(x, y, z); },
  draw: drawL,
  fx: lt => ({ bloom: .55 + (lt >= CUE.sting ? .4 * Math.exp(-(lt - CUE.sting) / .22) : 0), vignette: .3, grain: .04, contrast: .1, sat: .1, tint: [['#27348f', .1, 'soft-light']], fade: lt < .3 ? 1 - lt / .3 : 0, fadeColor: '236,243,255' }),
  blur: lt => 1,
  over: lt => {},
};
window.__EP20_SCENES = window.__EP20_SCENES || {};
window.__EP20_SCENES.lot = LOTSC;
})();
