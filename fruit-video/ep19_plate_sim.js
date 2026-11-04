'use strict';
/* SHIFT HAPPENS, Episode 19, scene `plate` (THE PLATE, 7:45 PM, 23.164 s): the DOM-free choreography and camera of the one-take shot (owner PLATE).
 * window.__EP19_SIMS.plate = { build, ... } and module.exports = the same. `node ep19_plate_sim.js` prints a framing report. The picture (ep19_plate.js) and the path file for the sound
 * (tools_plate_path.js -> build/ep19/plate_path.json) read the SAME functions, so what the camera shows is what the room tone follows.
 *
 * THE WORLD is a strip, left to right, in world units (a person is about 400 tall; feet on the floor line FY): the camera is a dolly (x, y, zoom z, roll r) and every cast member is a track x(t).
 *   kitchen pass-through (x < 900) | corridor A (900 .. 1900) | the nurses' station (1900 .. 2880) | hall B (2880 .. 4020, Mr. Pear by the window) | corridor C and the med cart (4020 on).
 * THE CHAIN of the plate (who holds it): rail 0.5 -> Mango 1.1 -> Lemon 4.7 -> Tomato 6.95 -> Onion 9.15 -> Mr. Pear 12.95 -> Mango 14.4 -> the med cart 19.5. Every receiver waits AHEAD (to the right) of the
 * giver, so nobody ever walks through anybody: the giver is left behind as the camera dollies on. Mango, who is left behind at 4.7, "catches up" by running in from the RIGHT at 13.0 (the shortcut).
 * Walks: a trapezoid speed profile per segment (ramp r of the time at each end); the gait is distance driven (gaitW = distance / scale) and each segment's stride is chosen so that the number of
 * cycles is a whole number and the first frame is the passing pose of the legs: the feet land planted and the legs start and stop with the least pop. */
(function () {
const START = 75.330, DUR = 23.164, FPS = 30;
const snapT = t => Math.round((START + t) * FPS) / FPS - START;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;

/* the frozen beats (scene-local seconds, build/ep19/timeline.json) and the words of the lines (line-relative, same file) */
const B = { open: [.2, 1.2], m1: [1.3, 2.287], walk1: [2.387, 4.087], l1: [4.137, 5.202], walk2: [5.302, 6.702], t1: [6.752, 7.746], walk3: [7.846, 9.146], o1: [9.196, 11.056], walk4: [11.156, 12.456],
  pe1: [12.506, 13.538], m3: [13.638, 14.495], walk5: [14.645, 15.845], b1: [15.895, 16.491], walk6: [16.591, 18.091], s1: [18.141, 19.212], m2: [19.312, 20.299], s2: [20.399, 21.314], end: [21.514, 22.714] };
const WORDS = {
  m1: [[0, .106], [.106, .317], [.317, .493], [.493, .599], [.599, .987]], l1: [[0, .139], [.139, .417], [.417, .695], [.695, 1.065]], t1: [[0, .248], [.248, .994]],
  o1: [[0, .213], [.213, .425], [.425, 1.169], [1.169, 1.86]], pe1: [[0, .188], [.188, .469], [.469, 1.032]], m3: [[0, .18], [.18, .361], [.361, .857]], b1: [[0, .199], [.199, .596]],
  s1: [[0, .123], [.123, .288], [.288, .453], [.453, .659], [.659, 1.07]], m2: [[0, .158], [.158, .316], [.316, .553], [.553, .987]], s2: [[0, .229], [.229, .457], [.457, .61], [.61, .915]] };
const WHO = { m1: 'mango', l1: 'lemon', t1: 'tom', o1: 'onion', pe1: 'pear', m3: 'mango', b1: 'bind', s1: 'straw', m2: 'mango', s2: 'straw' };
const wS = (id, i) => B[id][0] + WORDS[id][i][0], wE = (id, i) => B[id][0] + WORDS[id][i][1];
/* the sound cues of the scene (scene-local seconds, python3 /tmp/shift_tools/cues.py 19 plate), snapped to the video frame nearest each */
const CUE = { plateclink: .5, peel1: 5.037, peel2: 7.652, probebeep: 10.596, sniffle: 11.196, binderpop: 15.745, callchime: 16.891, sting: 21.614 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);

/* ------------------------------------------------------------------ geometry */
const FY = 1200;                                  /* the floor line at the foot of the wall; the cast stands a little in front of it */
const LANE = 44;                                  /* the cast's feet are at FY + LANE */
const SC = { mango: 1.15, lemon: 1.15, tom: 1.15, onion: 1.15, pear: 1.05, straw: 1.15, bind: .36 };
const ROOMS = [{ id: 'kitchen', x0: -3000, x1: 900 }, { id: 'corridor', x0: 900, x1: 1900 }, { id: 'station', x0: 1900, x1: 2880 }, { id: 'hall', x0: 2880, x1: 4020 }, { id: 'medroom', x0: 4020, x1: 9000 }];
const roomAt = x => { for (const r of ROOMS) if (x >= r.x0 && x < r.x1) return r.id; return x < 0 ? 'kitchen' : 'medroom'; };
/* the body dimensions the carry geometry needs (engine KINDS: leg and ry), so a hand can be placed without the DOM */
const KD = { mango: { ry: 118, leg: 86, rx: 100 }, lemon: { ry: 140, leg: 90, rx: 108 }, tom: { ry: 106, leg: 84, rx: 128 }, onion: { ry: 124, leg: 78, rx: 106 }, pear: { ry: 130, leg: 84, rx: 112 }, straw: { ry: 132, leg: 92, rx: 118 } };

/* ------------------------------------------------------------------ tracks: trapezoid speed profiles */
const P = (u, r) => u <= 0 ? 0 : u >= 1 ? 1 : u < r ? u * u / (2 * r * (1 - r)) : u <= 1 - r ? (u - r / 2) / (1 - r) : 1 - (1 - u) * (1 - u) / (2 * r * (1 - r));
const dP = (u, r) => u <= 0 || u >= 1 ? 0 : u < r ? u / (r * (1 - r)) : u <= 1 - r ? 1 / (1 - r) : (1 - u) / (r * (1 - r));
function makeTrack(name, x0, segs) {
  const s = SC[name], S = []; let px = x0;
  for (const g of segs) {
    const D = Math.abs(g.x1 - px), n = Math.max(1, Math.round(D / s / 160)), A = g.stride || clamp(D / s / (4 * n), 14, 64);
    S.push({ t0: snapT(g.t0), t1: snapT(g.t1), xa: px, xb: g.x1, r: g.r ?? .25, D, A, dir: Math.sign(g.x1 - px) || 1, tag: g.tag }); px = g.x1;
  }
  const find = t => { let r = null; for (const g of S) if (t >= g.t0) r = g; return r; };
  return {
    segs: S,
    x(t) { const g = find(t); if (!g) return x0; if (t >= g.t1) return g.xb; return g.xa + (g.xb - g.xa) * P((t - g.t0) / (g.t1 - g.t0), g.r); },
    v(t) { const g = find(t); if (!g || t >= g.t1) return 0; return (g.xb - g.xa) / (g.t1 - g.t0) * dP((t - g.t0) / (g.t1 - g.t0), g.r); },
    /* the walking state: on, the distance driven gait (gaitW in local units, stride A), the direction; `last` = the direction of the latest move (a stopped walker still faces it) */
    walk(t) {
      const g = find(t); if (!g) return { on: false, dir: 1 };
      if (t >= g.t1 || t < g.t0) return { on: false, dir: g.dir };
      const d = Math.abs(this.x(t) - g.xa);
      return { on: true, gaitW: g.A + d / s, stride: g.A, dir: g.dir, v: this.v(t), seg: g.tag, u: (t - g.t0) / (g.t1 - g.t0) };
    },
  };
}
const T = {
  mango: makeTrack('mango', 470, [{ t0: B.walk1[0], t1: B.walk1[1], x1: 1000, tag: 'walk1' }, { t0: B.walk1[1], t1: 4.6, x1: 1070, r: .5, tag: 'stop1' },
    { t0: 12.55, t1: 13.62, x1: 3480, r: .22, stride: 40, tag: 'run' }, { t0: B.walk5[0], t1: B.walk5[1], x1: 3930, tag: 'walk5' }, { t0: B.walk5[1], t1: B.b1[1], x1: 3990, r: .5, tag: 'slow' }, { t0: B.walk6[0], t1: B.walk6[1], x1: 4440, tag: 'walk6' }]),
  lemon: makeTrack('lemon', 1720, [{ t0: 3.25, t1: 4.45, x1: 1400, r: .3, tag: 'enter' }, { t0: B.walk2[0], t1: B.walk2[1], x1: 1740, tag: 'walk2' }]),
  tom: makeTrack('tom', 2030, [{ t0: B.walk3[0], t1: B.walk3[1], x1: 2390, r: .18, tag: 'dance' }]),
  onion: makeTrack('onion', 2680, [{ t0: B.walk4[0], t1: B.walk4[1], x1: 3080, tag: 'walk4' }]),
  pear: makeTrack('pear', 3310, []),
  straw: makeTrack('straw', 4890, []),
};
/* Mango starts the run from the right of hall B (off screen); before 12.55 she is "away" at x 3980 so her track is a single move */
T.mango = (() => {
  const m1 = makeTrack('mango', 470, [{ t0: B.walk1[0], t1: B.walk1[1], x1: 1000, tag: 'walk1' }, { t0: B.walk1[1], t1: 4.6, x1: 1070, r: .5, tag: 'stop1' }]);
  const m2 = makeTrack('mango', 4040, [{ t0: 12.7, t1: 13.62, x1: 3540, r: .22, stride: 42, tag: 'run' }, { t0: B.walk5[0], t1: B.walk5[1], x1: 3990, tag: 'walk5' }, { t0: B.walk5[1], t1: B.b1[1], x1: 4050, r: .5, tag: 'slow' },
    { t0: B.walk6[0], t1: B.walk6[1], x1: 4440, tag: 'walk6' }]);
  const pick = t => t < 8 ? m1 : m2;
  return { segs: m1.segs.concat(m2.segs), x: t => pick(t).x(t), v: t => pick(t).v(t), walk: t => pick(t).walk(t) };
})();

/* ------------------------------------------------------------------ the camera: monotone cubic (PCHIP) through keys, so the dolly never stops dead and never overshoots */
function pchip(keys) {
  const n = keys.length, h = [], d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h[i] = keys[i + 1][0] - keys[i][0]; d[i] = (keys[i + 1][1] - keys[i][1]) / h[i]; }
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  m[0] = n > 1 ? d[0] : 0; m[n - 1] = n > 1 ? d[n - 2] : 0;
  return t => {
    if (t <= keys[0][0]) return keys[0][1]; if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0; while (i < n - 2 && t >= keys[i + 1][0]) i++;
    const u = (t - keys[i][0]) / h[i], u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * keys[i][1] + (u3 - 2 * u2 + u) * h[i] * m[i] + (-2 * u3 + 3 * u2) * keys[i + 1][1] + (u3 - u2) * h[i] * m[i + 1];
  };
}
/* camera keys: [t, x]. The camera leads its subject a little, slows to settle each speaker near the middle, and runs ahead in walk2 / walk6 to find the next person. */
const CX = pchip([[0, 330], [.9, 400], [1.3, 560], [2.3, 600], [2.9, 790], [3.5, 1000], [4.09, 1215], [4.6, 1270], [5.3, 1310], [5.7, 1480], [6.2, 1740], [6.75, 1890], [7.6, 1950], [8.2, 2110], [8.8, 2300], [9.2, 2470],
  [10.2, 2560], [11.1, 2600], [11.6, 2740], [12.1, 2980], [12.5, 3135], [13.0, 3210], [13.64, 3300], [14.5, 3320], [15.0, 3450], [15.5, 3780], [15.9, 4030], [16.5, 4090], [17.2, 4300], [18.1, 4640], [19.0, 4660], [20.4, 4660],
  [21.0, 4660], [21.6, 4660], [23.2, 4660]]);
const CZ = pchip([[0, 1.32], [.9, 1.4], [1.3, 1.62], [2.0, 1.86], [2.3, 1.78], [2.9, 1.42], [3.6, 1.36], [4.1, 1.5], [4.9, 1.56], [5.5, 1.44], [6.2, 1.34], [6.8, 1.52], [7.7, 1.58], [8.4, 1.38], [9.0, 1.4], [9.6, 1.62],
  [10.8, 1.64], [11.6, 1.4], [12.4, 1.3], [13.0, 1.32], [14.3, 1.3], [15.0, 1.34], [15.7, 1.52], [16.3, 1.72], [17.2, 1.4], [18.1, 1.34], [19.5, 1.3], [20.6, 1.42], [21.1, 1.62], [21.65, 2.16], [23.2, 2.3]]);
/* the vertical: cy is the world y at the middle of the frame (the cast's faces sit at about FY - 220); the end tilts up to the clock above the med cart */
const CYK = pchip([[0, 1052], [2.0, 1040], [4.0, 1060], [8, 1056], [12, 1050], [16, 1056], [20.4, 1050], [21.0, 1040], [21.3, 880], [21.62, 340], [22.2, 322], [23.2, 318]]);
const camRoll = t => .0065 * Math.sin(t * .82 + .4) + .0035 * Math.sin(t * 1.9 + 1.3) + .004 * Math.sin(t * 3.1) * clamp((t - 2.4) / 1.2) * (1 - clamp((t - 18.2) / .8));
const camDrift = t => 9 * Math.sin(t * .9 + .7) + 5 * Math.sin(t * 2.3);
function camAt(lt) {
  const t = clamp(lt, 0, DUR), x = CX(t), z = CZ(t);
  return { x, y: CYK(t) + camDrift(t) * clamp(1 - (t - 20.9) / .5), z, r: camRoll(t) * clamp(1 - (t - 21.0) / .6), room: roomAt(x) };
}
/* who speaks at lt: { id, who, x } (the world x of the speaker; Binder rides the plate, which Mango carries) or null in the pauses */
function speakerAt(lt) {
  for (const id in WHO) {
    if (lt < B[id][0] || lt >= B[id][1]) continue;
    const who = WHO[id], key = who === 'bind' ? 'mango' : who, x = T[key].x(lt) + (who === 'bind' ? 70 : 0);
    return { id, who, x };
  }
  return null;
}

/* ------------------------------------------------------------------ the framing report: screen positions of the cast at a camera */
const screenX = (x, cam) => 540 + (x - cam.x) * cam.z;
function build() {
  return { START, DUR, FPS, B, WORDS, WHO, CUE, FY, LANE, SC, KD, ROOMS, T, camAt, roomAt, speakerAt, snapT, wS, wE, screenX, pchip,
    /* the rows of build/ep19/plate_path.json (10 Hz, absolute seconds): the camera's world x, the room, the world x of the speaker, plus the zoom and the speaker's true on-screen pan (-1..1) */
    pathRows() {
      const out = [];
      for (let i = 0; i * .1 <= DUR + 1e-9; i++) {
        const lt = Math.min(DUR, i * .1), c = camAt(lt), sp = speakerAt(lt);
        out.push({ t: +(START + lt).toFixed(3), x: +c.x.toFixed(1), room: c.room, speakerX: sp ? +sp.x.toFixed(1) : null, zoom: +c.z.toFixed(3), who: sp ? sp.who : null, pan: sp ? +clamp((screenX(sp.x, c) - 540) / 540, -1, 1).toFixed(3) : null });
      }
      return out;
    },
  };
}
const api = { build, START, DUR, B, CUE, FY };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP19_SIMS = window.__EP19_SIMS || {}; window.__EP19_SIMS.plate = api; }
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const S = build();
  console.log('plate sim: camera and cast, every 0.5 s (screen x of each cast member at the camera; * = inside the frame)');
  for (let lt = 0; lt <= DUR; lt += .5) {
    const c = S.camAt(lt), row = [];
    for (const k of Object.keys(S.T)) { const x = S.T[k].x(lt), sx = screenX(x, c); row.push(k + ' ' + (sx > -150 && sx < 1230 ? '*' : ' ') + Math.round(sx)); }
    console.log(lt.toFixed(1).padStart(5), 'cam', Math.round(c.x), 'z', c.z.toFixed(2), 'y', Math.round(c.y), c.room.padEnd(8), row.join('  '));
  }
}
})();
