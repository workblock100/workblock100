'use strict';
/* SHIFT HAPPENS, Episode 20, scene `night` (THE LONG NIGHT, 10:59 PM to 7:00 AM, 34.362 s): the DOM-free world of the time-lapse (owner NIGHT).
 * window.__EP20_SIMS.lapse = { build, ... } and module.exports = the same. `node ep20_lapse_sim.js` prints a report. The picture (ep20_night.js) and the file for the sound
 * (tools_lapse.js -> build/ep20/lapse.json) read the SAME functions, so what the viewer sees (the clock, the sky, the Moon) is what the room tone, the wind and the ticks follow.
 *
 * EVERYTHING here is a pure function of scene-local seconds `lt` (frame N is the same in every worker and every run: no Math.random, no Date, no state).
 *
 * THE WORLD CLOCK (minutes after midnight; 11:00 PM = 1380, 7:00 AM next morning = 1860)
 *   before the tick   worldMin = 1379 + lt / 60                  (10:59 PM, real time)
 *   the tick (3.316)  the minute hand drops onto 11:00; worldMin holds 1380 until the lapse (the twin shot is one minute of the night)
 *   THE LAPSE         10.653 .. 18.653 (8.0 s): worldMin = 1380 + v0 (lt - t0) + dV G(lt) where G is the integral of a window function (smoothstep up over 0.7 s, 1, smoothstep down over
 *                     0.9 s): speed(lt) = v0 + dV w(lt) minutes per second. v0 = 1/60 (real time). The hold is 66.7 min/s; the shot lands on 1860 (exactly) at 18.653 at real time again.
 *   after the lapse   worldMin = 1860 + (lt - 18.653) / 60       (7:00 AM, real time)
 * THE SKY follows worldMin through keyframes (slate-blue blizzard night, clearing and deep blue with stars, violet and rose predawn, a gold sunrise); the snow thins out from 1 AM and stops by 4:40 AM;
 * the Moon crosses the window pane from the upper left to the lower right, behind the weather at first, then out, then large and low at 7:00 for his lines, and sets (fades) after "Yes."; the light
 * of the sun (`sun`, 0..1) is 0 until 5:40 AM, .55 at 7:00 and grows with the VIDEO clock to 1 for the dawn (a cinematic liberty: the world minute no longer moves).
 * THE STAFF: Strawberry's rounds (a loop of 2.0 s of video = two hours: the cart, the window, the cots, the doors, the cart), the sleepers' poses (jumps), the call lights (slow), the desk lamp's one flicker.
 * Layout (LAY) is in the units of the perspective room (S6 / S13): X right, Y up, Z away from the camera; the back wall is at Z 1900. */
(function () {
const START = 121.626, DUR = 34.362, FPS = 30;
const snapT = t => Math.round((START + t) * FPS) / FPS - START;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = (x, a, b) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const sr = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

/* the frozen beats (scene-local seconds, build/ep20/timeline.json) */
const B = { open: [.2, 1.8], s1: [1.9, 3.216], wait: [3.316, 4.816], s2: [4.866, 6.099], s3: [6.249, 7.841], s4: [7.941, 8.867], s5: [8.967, 9.745], s6: [9.845, 10.403], lapse: [10.653, 18.653],
  mo1: [18.703, 20.686], s7: [20.836, 21.751], mo2: [21.851, 22.751], s8: [22.901, 23.618], mo3: [23.718, 24.53], s9: [24.78, 25.339], dawn: [25.689, 27.689], tu3: [27.739, 29.305],
  o5: [29.605, 31.138], s10: [31.338, 32.012], end: [32.412, 33.812] };
/* the sound cues of the scene (scene-local seconds, python3 /tmp/shift_tools/cues.py 20 night), snapped to the video frame nearest each */
const CUE = { clocktick: .4, clocktick2: 3.316, windgust: 3.516, badgepeel: 6.766, lapsewhoosh: 10.653, clockspin: 10.853, windswell: 11.653, plowdist: 25.989, sniffle: 31.205, sting: 32.512 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);

/* ------------------------------------------------------------------ the world clock */
const L = { t0: B.lapse[0], t1: B.lapse[1], rin: .7, rout: .9, v0: 1 / 60 };
L.dur = L.t1 - L.t0;
L.gTot = (L.dur - L.rin - L.rout) + .5 * L.rin + .5 * L.rout;          /* the integral of the window function */
L.dV = (480 - L.v0 * L.dur) / L.gTot;                                   /* the extra speed at the hold: 66.65 minutes per second */
L.hold = L.v0 + L.dV;
const Sm = u => u * u * (3 - 2 * u);
const wFn = lt => (lt <= L.t0 || lt >= L.t1) ? 0 : Math.min(Sm(clamp((lt - L.t0) / L.rin)), Sm(clamp((L.t1 - lt) / L.rout)));
const Iu = u => u * u * u - u * u * u * u / 2;                           /* the integral of a smoothstep from 0 to u */
function G(lt) {                                                         /* the integral of the window function from t0 to lt */
  if (lt <= L.t0) return 0;
  if (lt >= L.t1) return L.gTot;
  if (lt < L.t0 + L.rin) return L.rin * Iu((lt - L.t0) / L.rin);
  if (lt <= L.t1 - L.rout) return .5 * L.rin + (lt - L.t0 - L.rin);
  return L.gTot - L.rout * Iu((L.t1 - lt) / L.rout);
}
function worldMin(lt) {
  if (lt < CUE.clocktick2) return 1379 + lt / 60;
  if (lt <= L.t0) return 1380;
  if (lt >= L.t1) return 1860 + (lt - L.t1) / 60;
  return 1380 + L.v0 * (lt - L.t0) + L.dV * G(lt);
}
const speed = lt => L.v0 + L.dV * wFn(lt);                              /* world minutes per video second */
/* the hands and the digits of the wall clock at world minute m */
function clockParts(m) {
  const mm = ((Math.floor(m + 1e-6) % 1440) + 1440) % 1440, h24 = Math.floor(mm / 60), min = mm % 60, h12 = h24 % 12 || 12, pm = h24 >= 12;
  const mf = ((m % 60) + 60) % 60, hf = (((m / 60) % 12) + 12) % 12;
  return { h12, min, pm, text: h12 + ':' + String(min).padStart(2, '0'), ampm: pm ? 'PM' : 'AM', minAng: mf / 60 * Math.PI * 2, hourAng: hf / 12 * Math.PI * 2 };
}

/* ------------------------------------------------------------------ the sky, the snow, the Moon and the sun */
function keys(K, m) {                                                    /* K = [[minute, [numbers]], ...] linear, smoothstepped between keys */
  if (m <= K[0][0]) return K[0][1].slice();
  for (let i = 1; i < K.length; i++) if (m < K[i][0]) { const a = K[i - 1], b = K[i], k = ss(m, a[0], b[0]); return a[1].map((v, j) => lerp(v, b[1][j], k)); }
  return K[K.length - 1][1].slice();
}
const SKYK = [   /* [minute, [top rgb, middle rgb, horizon rgb]] */
  [1380, [58, 78, 118, 78, 100, 140, 104, 126, 164]],     /* 11 PM: a blizzard sky lit from below by the snow: slate blue */
  [1500, [50, 68, 108, 66, 88, 128, 90, 112, 150]],
  [1620, [24, 38, 84, 38, 58, 108, 58, 82, 130]],         /* 3 AM: clearing, deep blue */
  [1740, [28, 42, 92, 48, 68, 120, 82, 102, 152]],
  [1800, [54, 66, 124, 118, 96, 152, 200, 126, 146]],     /* 6 AM: violet over rose */
  [1840, [88, 112, 176, 218, 146, 156, 255, 180, 112]],
  [1860, [122, 158, 214, 246, 190, 146, 255, 208, 122]],  /* 7 AM: a gold sunrise */
];
function sky(lt) {
  const m = worldMin(lt), v = keys(SKYK, m), tail = ss(lt, L.t1, 27);
  const gold = [[132, 176, 226], [250, 206, 150], [255, 218, 140]];     /* the dawn: a little lighter, a little more gold, with the video clock */
  const c = [0, 1, 2].map(i => [0, 1, 2].map(j => Math.round(lerp(v[i * 3 + j], gold[i][j], tail * .65))));
  return { top: c[0], mid: c[1], hor: c[2], m };
}
const snowRate = m => 1 - ss(m, 1450, 1700);                             /* 1 until 12:30 AM, none after 4:40 AM */
const starsAlpha = m => (1 - snowRate(m)) * (1 - ss(m, 1775, 1845));
function sunLevel(lt) { const m = worldMin(lt); return clamp(ss(m, 1780, 1860) * .55 + (lt > L.t1 ? .45 * ss(lt, 18.7, 27.0) : 0)); }
/* the Moon in the window pane (u 0..1 across, v 0..1 up from the bottom of the glass, r the radius as a share of the pane height, cloud 0..1 behind the weather, alpha) */
function moon(lt) {
  const m = worldMin(lt), p = clamp((m - 1380) / 480);
  const u = lerp(.14, .72, p) + (lt > L.t1 ? (lt - L.t1) * .003 : 0);
  const v = lerp(.80, .47, Math.pow(p, 1.25)) - (lt > L.t1 ? (lt - L.t1) * .006 : 0);
  const r = lerp(.17, .31, Math.pow(p, 1.6));
  const cloud = clamp(1 - ss(m, 1490, 1650)) * .96 + .04 * ss(m, 1800, 1860);
  const alpha = 1 - (lt > L.t1 ? ss(lt, 24.6, 26.8) : 0);
  return { u, v, r, cloud, alpha, x: u * 2 - 1 };
}
/* the snow depth: the shared curve of SN20.depthAt (0 at 2 PM, .25 at 4:30 PM, .45 at 8:12 PM, .6 at 10:40 PM, .9 at 7 AM); the picture asks SN20.depthAt when it exists, this is the node fallback */
const DK = [[840, 0], [990, .25], [1212, .45], [1360, .6], [1860, .9]];
function depthAt(m) {                                                    /* a monotone cubic (Fritsch-Carlson) through the published knots */
  if (m <= DK[0][0]) return DK[0][1];
  if (m >= DK[DK.length - 1][0]) return DK[DK.length - 1][1];
  const n = DK.length, h = [], d = [], mt = [];
  for (let i = 0; i < n - 1; i++) { h[i] = DK[i + 1][0] - DK[i][0]; d[i] = (DK[i + 1][1] - DK[i][1]) / h[i]; }
  mt[0] = d[0]; mt[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) mt[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  let i = 0; while (m > DK[i + 1][0]) i++;
  const t = (m - DK[i][0]) / h[i], t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * DK[i][1] + (t3 - 2 * t2 + t) * h[i] * mt[i] + (-2 * t3 + 3 * t2) * DK[i + 1][1] + (t3 - t2) * h[i] * mt[i + 1];
}
const depth = lt => depthAt(worldMin(lt));
/* the scripted gusts of the wind in the window, [t0, duration, amp] (SN20.wind / SN20.snow `gusts`): the cue `windgust` (3.516) and the swell of the lapse (`windswell` 11.653), the plow at the dawn */
const GUSTS = [[CUE.windgust, 1.2, 1], [CUE.windswell, 3.6, .85], [27.9, 1.4, .5]];

/* ------------------------------------------------------------------ the layout of the room (the perspective room of S6 / S13, world units) */
const LAY = {
  zb: 1900, hw: 1000, ch: 1150,
  win: { x0: -330, x1: 330, y0: 200, y1: 790 },                           /* the big window in the back wall */
  doors: { x0: 380, x1: 610, y1: 560 },                                    /* the glass doors of the entrance, to the right of the window */
  clock: { X: 0, Y: 940, r: 100 },                                         /* the wall clock above the window */
  counter: { x0: -120, x1: 720, z0: 1380, z1: 1520, top: 190 },            /* S13's counter */
  cart: { X: 120, Z: 1235 },                                               /* the med cart */
  home: { X: 300, Z: 1210 },                                               /* where Strawberry stands beside the cart */
  cots: { mango: { X: -505, Z: 1850 }, lemon: { X: -365, Z: 1850 }, tom: { X: -225, Z: 1850 }, onion: { X: -85, Z: 1850 } },   /* four cots in an overlapping row along the back wall, heads to the left */
};

/* ------------------------------------------------------------------ Strawberry's rounds (the ghost trail of the lapse): a loop of stops, walked again and again */
const PI_ = Math.PI;
const R = { t0: 10.72, loop: 1.93, n: 4, rate: 300 };
const STOPS = [   /* the walk to the stop (s), the dwell there (s), the yaw she holds at it (0 front, PI the back, +PI/2 profile facing right) */
  { X: -215, Z: 1330, face: PI_, walk: .2, dwell: 0 },                    /* round the left end of the counter */
  { X: -215, Z: 1580, face: PI_, walk: .2, dwell: 0 },
  { X: -10, Z: 1760, face: PI_, walk: .24, dwell: .16 },                   /* the window: her back to us, looking at the snow */
  { X: -300, Z: 1640, face: -1.9, walk: .26, dwell: .14 },                 /* the cots: a profile looking left, at the sleepers */
  { X: -250, Z: 1200, face: .25, walk: .26, dwell: 0 },                    /* the floor in front of the cart */
  { X: 360, Z: 1150, face: 2.45, walk: .3, dwell: .14 },                   /* the doors: a three-quarter back view toward the glass doors */
  { X: LAY.home.X, Z: LAY.home.Z, face: .4, walk: .2, dwell: 0 },          /* home */
];
{ const sum = STOPS.reduce((a, s) => a + s.walk + s.dwell, 0), f = R.loop / sum; for (const s of STOPS) { s.walk *= f; s.dwell *= f; } }   /* the loop fits its period exactly */
const angLerp = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };
function rounds(lt) {
  const home = { X: LAY.home.X, Z: LAY.home.Z, yaw: .4, walking: false, dx: 0, dz: 0, v: 0, loop: -1 };
  const u0 = lt - R.t0;
  if (u0 <= 0) return home;
  const n = Math.floor(u0 / R.loop);
  if (n >= R.n) return Object.assign(home, { loop: R.n });
  const tl = u0 - n * R.loop;
  let t = 0, px = LAY.home.X, pz = LAY.home.Z, pf = .4;
  for (const s of STOPS) {
    const D = Math.hypot(s.X - px, s.Z - pz) || 1, dx = (s.X - px) / D, dz = (s.Z - pz) / D;
    if (tl < t + s.walk) {
      const k = (tl - t) / s.walk, e = Sm(k), wy = Math.atan2(dx, -dz);
      const yaw = angLerp(angLerp(pf, wy, ss(k, 0, .2)), s.face, ss(k, .78, 1));
      return { X: lerp(px, s.X, e), Z: lerp(pz, s.Z, e), yaw, walking: true, dx, dz, v: D / s.walk * 6 * k * (1 - k), loop: n };
    }
    t += s.walk;
    if (tl < t + s.dwell) return { X: s.X, Z: s.Z, yaw: s.face, walking: false, dx: 0, dz: 0, v: 0, loop: n };
    t += s.dwell; px = s.X; pz = s.Z; pf = s.face;
  }
  return Object.assign(home, { loop: n });
}
/* the leg cycle runs at a fixed readable rate whatever the speed (the `runner` idiom of ep6.js): a distance in gait units */
const gait = lt => Math.max(0, lt - R.t0) * R.rate;

/* ------------------------------------------------------------------ the sleepers: a pose per world minute (0 on the back, 1 on the left side, 2 on the right side, 3 curled under the blanket) and one who sits up */
const SLEEP = {
  mango: [[1380, 0], [1452, 2], [1566, 1], [1688, 3], [1790, 2]],
  lemon: [[1380, 1], [1426, 0], [1540, 2], [1650, 1], [1770, 0]],
  tom: [[1380, 2], [1478, 3], [1598, 1], [1724, 0], [1812, 2]],
  onion: [[1380, 0], [1500, 1], [1632, 2], [1760, 1]],
};
const SIT = { tom: [1536, 1552, 1568, 1584] };                             /* sits up 1536-1552, stays, lies down 1568-1584 */
function sleepers(lt) {
  const m = worldMin(lt), out = {};
  for (const k in SLEEP) {
    let pose = SLEEP[k][0][1], since = 1e9;
    for (const [mm, p] of SLEEP[k]) if (m >= mm) { pose = p; since = m - mm; }
    out[k] = { pose, since, sit: 0 };
  }
  const q = SIT.tom;
  out.tom.sit = ss(m, q[0], q[1]) * (1 - ss(m, q[2], q[3]));
  return out;
}
/* the call lights: two domes on the board, red, a slow pulse (never above 1 Hz, never above .85) */
const calls = (lt, i) => .5 + .34 * Math.sin(lt * Math.PI * 2 * (.62 + .1 * i) + i * 1.7);
/* the desk lamp: 1, with one quick flicker at 14.2 s (the lapse) */
const lamp = lt => 1 - .5 * Math.exp(-Math.pow((lt - 14.2) / .055, 2)) - .22 * Math.exp(-Math.pow((lt - 14.42) / .04, 2));

function build() {
  return { START, DUR, FPS, B, CUE, L, LAY, GUSTS, STOPS, R, snapT, worldMin, speed, wFn, clockParts, sky, snowRate, starsAlpha, sunLevel, moon, depthAt, depth, rounds, gait, sleepers, calls, lamp, angLerp,
    /* the rows of build/ep20/lapse.json (10 Hz over the whole scene, ABSOLUTE seconds): the world minute, the speed in world minutes per video second, the light of the sun 0..1, the Moon's x across the pane -1..1 */
    pathRows() {
      const out = [];
      for (let i = 0; i * .1 <= DUR + 1e-9; i++) {
        const lt = Math.min(DUR, i * .1);
        out.push({ t: +(START + lt).toFixed(3), worldMin: +worldMin(lt).toFixed(3), speed: +speed(lt).toFixed(4), sun: +sunLevel(lt).toFixed(3), moonX: +moon(lt).x.toFixed(3) });
      }
      return out;
    },
  };
}
const api = { build, START, DUR, B, CUE };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP20_SIMS = window.__EP20_SIMS || {}; window.__EP20_SIMS.lapse = api; }
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const S = build();
  console.log('lapse sim: lapse', L.t0, '..', L.t1, 'hold', L.hold.toFixed(2), 'min/s, dV', L.dV.toFixed(3), 'worldMin(t0)', S.worldMin(L.t0), 'worldMin(t1)', S.worldMin(L.t1));
  console.log('t(s)   worldMin  clock      speed(min/s)  sun    moon u,v,r  cloud  snow   stars  depth');
  for (let lt = 0; lt <= DUR; lt += lt < 10 || lt > 19 ? 2 : .5) {
    const m = S.worldMin(lt), c = S.clockParts(m), mo = S.moon(lt);
    console.log(lt.toFixed(1).padStart(5), m.toFixed(2).padStart(9), (c.text + ' ' + c.ampm).padEnd(9), S.speed(lt).toFixed(3).padStart(10), S.sunLevel(lt).toFixed(2).padStart(7),
      [mo.u, mo.v, mo.r].map(v => v.toFixed(2)).join(','), mo.cloud.toFixed(2), S.snowRate(m).toFixed(2), S.starsAlpha(m).toFixed(2), S.depth(lt).toFixed(3));
  }
}
})();
