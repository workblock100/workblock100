'use strict';
/* SHIFT HAPPENS, Episode 18, scene `evac`: the DOM-free crowd sim of the evacuation (EVAC). window.__EP18_SIMS.evac = { build, PLAN, ANCH } and module.exports = same.
 *
 * 80 agents in two waves on Unit B's floor plan (metres; x east, y north; the top-down view draws the plan with y up the screen):
 *   wave 0, 40 residents, seated in four arcs facing the TV on the day room's west wall: wheelchairs (v0 .8 to 1.0 m/s), walkers (.5 to .65), shufflers (.34 to .48). They rise after a reaction delay (0 to 3 s,
 *     hashed), leave by the day room's double door (1.6 m), walk the hallway (2.4 m wide) to the FIRE DOOR (a 1.0 m gap in the building's north wall) and go on to their slot on the assembly point outside.
 *     The last three to leave are Mr. Pear, Mrs. Cranberry and Mr. Banana (ids 37, 38, 39), slow on purpose: they are the 38th, 39th and 40th heads Mango counts.
 *   wave 1, 40 Strawberries (r .19, v0 1.35 to 1.5 m/s, each carries a med cup), standing packed in the hallway's south stretch since Episode 15, released at T_REL (the `ch1` line): they rush north, jam the fire door
 *     (one door: two of them abreast at most) and form the arch-shaped crowd in front of it, then go out to the assembly point.
 * The model: velocity relaxation toward a desired velocity (waypoints), car-following braking (a head in my way ahead sets my speed cap), then a position-based contact pass (agent-agent discs with push and
 * friction-free sliding, agent-wall capsules), so a one-person door clogs by itself and the queue forms an arch. Fixed step DT = 1/40 s (recorded at 20 Hz), no Math.random, no trigonometry, no exp (only + - * / sqrt:
 * the same numbers in every worker and in node), a seeded integer hash for every "random" number. The count is the number of heads that have crossed the HEADCOUNT line (a painted stripe across the hallway,
 * 5.1 m before the fire door); the scene's chip reads it.
 * TIME-LAPSE. The scene shows the sim at a variable speed: tauAt(lt) maps scene-local seconds to sim seconds through anchors (ANCH) that the sim solves from its own pass times, so the chip reads 38 / 39 / 40 on the
 * three words of the `m1` line and 80 on "Eighty." (`l5`). rate(lt) = d tau / d lt is the factor on the badge.
 * API: const S = build(); S.at(lt, out) fills out.x/.y/.hx/.hy/.st (Float32Arrays of N); S.count(lt); S.tauAt(lt); S.rate(lt); S.meta (agents); S.pass (count line crossing times, sim s); S.T_REL; S.T_END.
 * Node: `node ep18_evac_sim.js` prints the pass times, the anchors, the speed factors and the counts at the key words. */
(function () {
/* ---------------------------------------------------------------- the plan (metres) */
const PLAN = {
  HX0: 5.5, HX1: 7.9, HXC: 6.7, Y_S: 0, Y_DOOR: 19.0, DOOR_X0: 6.1, DOOR_X1: 7.3,
  DR: { x0: -1.7, x1: 5.5, y0: 4.4, y1: 13.0 }, DRD: { y0: 7.7, y1: 9.7 },
  TV: { x: -1.55, y: 8.7 },
  ASM: { x0: 1.4, x1: 12.0, y0: 22.2, y1: 28.8 },
  COUNT_Y: 9.7,
  STASH: { y0: 1.3, y1: 5.8 },
};
/* the timeline anchors (scene-local seconds; the timeline is frozen: build/ep18/timeline.json, scene evac) */
const TL = { rise: 11.90, trackEnd: 12.90, ramp: 13.50, l6a: 23.226, l6b: 24.829, l3: 15.058, w38: 15.972, w39: 16.842, w40: 17.672, ch1: 19.627, eighty: 21.018, end: 26.008, dur: 27.458 };

function hsh(n) { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
const R01 = (i, k) => hsh(i * 7919 + k * 104729 + 12345);

/* wall segments [x1, y1, x2, y2]: the day room, the hallway and the building's north face (the fire door is a gap) */
function walls() {
  const P = PLAN, D = P.DR, W = [];
  W.push([D.x0, D.y0, D.x1, D.y0], [D.x0, D.y1, D.x1, D.y1], [D.x0, D.y0, D.x0, D.y1]);           /* day room south, north, west */
  W.push([P.HX0, D.y0, P.HX0, P.DRD.y0], [P.HX0, P.DRD.y1, P.HX0, D.y1]);                          /* the day room's east wall with the door gap */
  W.push([P.HX0, P.Y_S, P.HX0, D.y0], [P.HX0, D.y1, P.HX0, P.Y_DOOR]);                             /* the hallway's west wall */
  W.push([P.HX1, P.Y_S, P.HX1, P.Y_DOOR], [P.HX0, P.Y_S, P.HX1, P.Y_S]);                           /* east wall, south end */
  W.push([D.x0, P.Y_DOOR, P.DOOR_X0, P.Y_DOOR], [P.DOOR_X1, P.Y_DOOR, 13.5, P.Y_DOOR]);           /* the building's north face with the fire door gap */
  return W;
}

function build(opts) {
  opts = opts || {};
  const P = PLAN, D = P.DR, DT = 1 / 40, REC = 2, N = 80, NR = 40;
  const WALLS = walls(), WN = WALLS.length, WS = new Float64Array(WN * 4), WB = new Float64Array(WN * 4);
  WALLS.forEach((w, i) => { WS[i * 4] = w[0]; WS[i * 4 + 1] = w[1]; WS[i * 4 + 2] = w[2] - w[0]; WS[i * 4 + 3] = w[3] - w[1]; WB[i * 4] = Math.min(w[0], w[2]); WB[i * 4 + 1] = Math.min(w[1], w[3]); WB[i * 4 + 2] = Math.max(w[0], w[2]); WB[i * 4 + 3] = Math.max(w[1], w[3]); });
  /* ------------------------------------------------ the agents */
  const A = [];
  const arcs = [[1.7, 6], [2.6, 8], [3.5, 11], [4.4, 15]], HALF = 1.134;                            /* radius and chairs of the four arcs; half-span 65 degrees (1.134 rad) */
  const seats = [];
  arcs.forEach(([r, n], a) => { for (let i = 0; i < n; i++) { const th = -HALF + 2 * HALF * (i + .5) / n, c = 1 - th * th / 2 + th * th * th * th / 24 - th * th * th * th * th * th / 720, s = th - th * th * th / 6 + th * th * th * th * th / 120 - th * th * th * th * th * th * th / 5040; seats.push({ x: P.TV.x + r * c, y: P.TV.y + r * s, arc: a, th }); } });
  /* the three stragglers sit in the front of the room (the inner arcs, behind everyone else's way out): Mrs. Cranberry on the second arc's middle seat, Mr. Pear and Mr. Banana on the first arc's middle pair */
  const mid = a => seats.map((s, i) => [s, i]).filter(([s]) => s.arc === a).sort((u, v) => Math.abs(u[0].th) - Math.abs(v[0].th)).map(x => x[1]);
  const m0 = mid(0), m1 = mid(1);
  const named = { [m1[0]]: 'cran', [seats[m0[0]].th < 0 ? m0[0] : m0[1]]: 'pear', [seats[m0[0]].th < 0 ? m0[1] : m0[0]]: 'banana' };
  const order = [];                                                                                     /* seats: the named last in the id order */
  for (let i = 0; i < seats.length; i++) if (!named[i]) order.push(i);
  for (const k of ['cran', 'pear', 'banana']) for (const i in named) if (named[i] === k) order.push(+i);
  order.forEach((si, id) => {
    const sc = seats[si], nm = named[si] || null, h = R01(id, 1), k = nm === 'cran' ? 'chair' : nm === 'banana' ? 'walk' : nm === 'pear' ? 'shuf' : h < .26 ? 'chair' : h < .7 ? 'walk' : 'shuf';
    const v0 = k === 'chair' ? 1.0 + .2 * R01(id, 2) : k === 'walk' ? .65 + .15 * R01(id, 2) : .48 + .12 * R01(id, 2);
    const a = { id, wave: 0, kind: k, name: nm, r: k === 'chair' ? .34 : k === 'walk' ? .32 : .27, v0, mass: k === 'chair' ? 1.5 : 1, tau: .5, x0: sc.x, y0: sc.y, delay: 0, col: Math.floor(R01(id, 3) * 12), seed: id };
    a.delay = nm === 'pear' ? opts.dPear ?? 6.8 : nm === 'cran' ? opts.dCran ?? 8.6 : nm === 'banana' ? opts.dBanana ?? 10.4 : .25 + 2.9 * R01(id, 4);
    if (nm === 'banana') a.v0 = .5; if (nm === 'pear') a.v0 = .45; if (nm === 'cran') a.v0 = .8;
    A.push(a);
  });
  const TREL = opts.tRel ?? 0;                                                                         /* set below: the release time of the Strawberries (sim s) */
  for (let j = 0; j < 40; j++) {
    const c = j % 4, r = Math.floor(j / 4), id = NR + j;
    A.push({ id, wave: 1, kind: 'straw', name: null, r: .19, v0: 1.35 + .15 * R01(id, 2), mass: .7, tau: .3, x0: P.HXC + (c - 1.5) * .4 + (R01(id, 5) - .5) * .04, y0: P.STASH.y0 + (P.STASH.y1 - P.STASH.y0) * r / 9, delay: 0, col: 0, seed: id });
  }
  /* ------------------------------------------------ routes: a route is a list of GATES (segments an agent crosses at a point of its own choosing, so the day room door and the fire door take heads side by side) */
  const mkGate = (ax, ay, bx, by, nx, ny) => { const dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy); return { ax, ay, L, dx: dx / L, dy: dy / L, nx, ny, cx: (ax + bx) / 2, cy: (ay + by) / 2 }; };
  const G_DR = mkGate(P.HX0, P.DRD.y0, P.HX0, P.DRD.y1, 1, 0), G_H1 = mkGate(P.HX0, 12.6, P.HX1, 12.6, 0, 1), G_H2 = mkGate(P.HX0, 16.8, P.HX1, 16.8, 0, 1), G_FD = mkGate(P.DOOR_X0, P.Y_DOOR, P.DOOR_X1, P.Y_DOOR, 0, 1);
  const GR = [G_DR, G_H1, G_H2, G_FD], GS = [G_H1, G_H2, G_FD];
  const legs = R => { const L = []; let acc = 0; for (let k = R.length - 1; k >= 0; k--) { L[k] = acc; if (k > 0) acc += Math.hypot(R[k].cx - R[k - 1].cx, R[k].cy - R[k - 1].cy); } return L; };
  const legsR = legs(GR), legsS = legs(GS);
  /* the assembly slots, filled far rows first */
  const slots = []; { const M = P.ASM, cw = .9; const cols = Math.floor((M.x1 - M.x0) / cw), rows = Math.ceil(N / cols) + 1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push({ x: M.x0 + .45 + c * cw + (r % 2 ? .22 : -.1) + (R01(r * 31 + c, 6) - .5) * .18, y: M.y1 - .4 - r * .86 + (R01(r * 17 + c, 7) - .5) * .16 });
    slots.sort((a, b) => b.y - a.y || a.x - b.x); }
  /* ------------------------------------------------ state */
  const px = new Float64Array(N), py = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), hx = new Float64Array(N), hy = new Float64Array(N);
  const wp = new Int8Array(N), st = new Int8Array(N), slot = new Int16Array(N).fill(-1), stuck = new Float64Array(N), pass = new Float64Array(N).fill(-1), dpass = new Float64Array(N).fill(-1);
  const tset = new Float64Array(N).fill(-1);
  let slotN = 0;
  for (let i = 0; i < N; i++) { const a = A[i]; px[i] = a.x0; py[i] = a.y0; if (a.wave === 0) { const dx = P.TV.x - a.x0, dy = P.TV.y - a.y0, d = Math.sqrt(dx * dx + dy * dy); hx[i] = dx / d; hy[i] = dy / d; } else { hx[i] = 0; hy[i] = 1; } }
  /* ------------------------------------------------ the integrator */
  const TG = [0, 0];
  function target(i) {                                                                                 /* fills TG with the point agent i steers to; returns false when it has reached its slot */
    const a = A[i], R = a.wave ? GS : GR;
    if (wp[i] < R.length) { const g = R[wp[i]]; if ((px[i] - g.ax) * g.nx + (py[i] - g.ay) * g.ny >= .2) wp[i]++; }
    if (wp[i] < R.length) {
      const g = R[wp[i]], ins = Math.min(a.r + .1, g.L / 2 - .01); let t = (px[i] - g.ax) * g.dx + (py[i] - g.ay) * g.dy; t = t < ins ? ins : t > g.L - ins ? g.L - ins : t;
      TG[0] = g.ax + g.dx * t + g.nx * .9; TG[1] = g.ay + g.dy * t + g.ny * .9; return true;
    }
    if (slot[i] < 0) slot[i] = slotN++;
    const s = slots[Math.min(slot[i], slots.length - 1)]; TG[0] = s.x; TG[1] = s.y; return false;
  }
  const SEG = (x, y, s) => { const dx = s[2] - s[0], dy = s[3] - s[1], l2 = dx * dx + dy * dy; let t = ((x - s[0]) * dx + (y - s[1]) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; return [s[0] + t * dx, s[1] + t * dy]; };
  const nSteps = Math.ceil((opts.T ?? 130) / DT), recN = Math.floor(nSteps / REC) + 1;
  const rec = new Float32Array(recN * N * 4), recSt = new Int8Array(recN * N);
  const ex = new Float64Array(N), ey = new Float64Array(N), cap = new Float64Array(N), rem = new Float64Array(N);
  let released1 = false, tRelSim = -1, NA = N;
  function step(k) {
    const t = k * DT;
    if (!released1 && tRelSim >= 0 && t >= tRelSim) { released1 = true; }
    /* the queue order: the remaining path length to the door (a head brakes only for a head that is further along, so no two heads wait for each other) */
    for (let i = 0; i < NA; i++) {
      const a = A[i], R = a.wave ? GS : GR, L = a.wave ? legsS : legsR;
      if (st[i] === 0) { rem[i] = 1e6 + i; continue; }
      if (st[i] === 3 || wp[i] >= R.length) { rem[i] = -1000; continue; }
      rem[i] = Math.hypot(R[wp[i]].cx - px[i], R[wp[i]].cy - py[i]) + L[wp[i]] + i * 1e-6;
    }
    /* desired directions and speed caps */
    for (let i = 0; i < NA; i++) {
      const a = A[i];
      if (st[i] === 0) { const go = a.wave === 0 ? t >= TL_RISE_SIM + a.delay : released1 && t >= tRelSim + (a.y0 - P.STASH.y0) * .0 + R01(a.id, 8) * .35; if (go) { st[i] = 1; wp[i] = 0; } else { ex[i] = 0; ey[i] = 0; cap[i] = 0; continue; } }
      if (st[i] === 3) { ex[i] = 0; ey[i] = 0; cap[i] = 0; continue; }
      const toGate = target(i);
      const dx = TG[0] - px[i], dy = TG[1] - py[i], d = Math.sqrt(dx * dx + dy * dy) + 1e-9;
      if (!toGate && d < .12) { st[i] = 3; tset[i] = t; ex[i] = 0; ey[i] = 0; cap[i] = 0; continue; }
      ex[i] = dx / d; ey[i] = dy / d;
      let c = a.v0;
      if (!toGate) c = Math.min(c, .25 + d * .9);                                                  /* settle gently into the slot */
      /* car-following: the nearest head in my way */
      const th = a.wave ? .2 : .3, SLACK = a.wave ? .1 : .2;
      for (let j = 0; j < NA; j++) {
        if (j === i || st[j] === 0 || rem[j] >= rem[i]) continue;
        const rx = px[j] - px[i], ry = py[j] - py[i], dd = Math.sqrt(rx * rx + ry * ry);
        if (dd > 2.2) continue;
        const al = rx * ex[i] + ry * ey[i];
        if (al <= 0) continue;
        const lat = Math.abs(rx * ey[i] - ry * ex[i]), need = A[j].r + a.r + (a.wave ? .02 : .06);
        if (lat > need) continue;
        const gap = al - (A[j].r + a.r), aj = vx[j] * ex[i] + vy[j] * ey[i];
        const v = Math.max((gap + SLACK) / th, (aj > 0 ? aj : 0) * .95);
        if (v < c) c = v;
      }
      cap[i] = c;
    }
    /* velocity relaxation, then the move */
    for (let i = 0; i < NA; i++) {
      const a = A[i];
      if (st[i] === 0 || st[i] === 3) { vx[i] *= .5; vy[i] *= .5; continue; }
      let c = cap[i];
      /* pressure at a jam: a head that is held keeps leaning forward a little (this is what builds the arch) */
      if (c < .18 && stuck[i] > .6 && a.wave === 1) c = .18;
      const wvx = ex[i] * c, wvy = ey[i] * c, f = DT / a.tau;
      vx[i] += (wvx - vx[i]) * f; vy[i] += (wvy - vy[i]) * f;
      const sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      if (sp > a.v0 * 1.15) { vx[i] *= a.v0 * 1.15 / sp; vy[i] *= a.v0 * 1.15 / sp; }
      px[i] += vx[i] * DT; py[i] += vy[i] * DT;
    }
    /* contacts: agent-agent, agent-wall (three passes) */
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < NA; i++) {
        if (st[i] === 0 && A[i].wave === 1 && !released1) continue;
        for (let j = i + 1; j < NA; j++) {
          const rx = px[j] - px[i], ry = py[j] - py[i], rr = A[i].r + A[j].r - .02;
          if (rx > rr || rx < -rr || ry > rr || ry < -rr) continue;
          const d2 = rx * rx + ry * ry; if (d2 >= rr * rr) continue;
          let d = Math.sqrt(d2); let nx, ny;
          if (d < 1e-6) { nx = 1; ny = 0; d = 0; } else { nx = rx / d; ny = ry / d; }
          const ov = rr - d, mi = st[i] === 0 || st[i] === 3 ? 4 : A[i].mass, mj = st[j] === 0 || st[j] === 3 ? 4 : A[j].mass, ws = mi + mj;
          px[i] -= nx * ov * (mj / ws); py[i] -= ny * ov * (mj / ws); px[j] += nx * ov * (mi / ws); py[j] += ny * ov * (mi / ws);
          const rv = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
          if (rv < 0) { const q = rv * .5; vx[i] += nx * q * (mj / ws) * 2; vy[i] += ny * q * (mj / ws) * 2; vx[j] -= nx * q * (mi / ws) * 2; vy[j] -= ny * q * (mi / ws) * 2; }
        }
        if (st[i] === 0) continue;
        const r = A[i].r;
        for (let w = 0; w < WN; w++) {
          const x = px[i], y = py[i];
          if (x < WB[w * 4] - r || x > WB[w * 4 + 2] + r || y < WB[w * 4 + 1] - r || y > WB[w * 4 + 3] + r) continue;
          const ax = WS[w * 4], ay = WS[w * 4 + 1], dx0 = WS[w * 4 + 2], dy0 = WS[w * 4 + 3], l2 = dx0 * dx0 + dy0 * dy0;
          let tt = ((x - ax) * dx0 + (y - ay) * dy0) / l2; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
          const dx = x - (ax + tt * dx0), dy = y - (ay + tt * dy0), d2 = dx * dx + dy * dy;
          if (d2 >= r * r) continue;
          const d = Math.sqrt(d2) + 1e-9, ov = r - d, nx = dx / d, ny = dy / d;
          px[i] += nx * ov; py[i] += ny * ov;
          const vn = vx[i] * nx + vy[i] * ny; if (vn < 0) { vx[i] -= nx * vn; vy[i] -= ny * vn; }
        }
      }
    }
    /* bookkeeping: speed-stuck timer, count line, door crossing, heading */
    for (let i = 0; i < NA; i++) {
      if (st[i] === 0) continue;
      const sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
      stuck[i] = sp < .12 && st[i] === 1 && py[i] > 8 ? stuck[i] + DT : 0;
      if (pass[i] < 0 && py[i] >= P.COUNT_Y && px[i] > P.HX0) pass[i] = t;
      if (dpass[i] < 0 && py[i] >= P.Y_DOOR) dpass[i] = t;
      let tx = vx[i], ty = vy[i]; const s2 = Math.sqrt(tx * tx + ty * ty);
      if (s2 > .06) { tx /= s2; ty /= s2; } else if (st[i] === 1) { tx = ex[i]; ty = ey[i]; } else { tx = hx[i]; ty = hy[i]; }
      const rate = st[i] === 3 ? .02 : .16; hx[i] += (tx - hx[i]) * rate; hy[i] += (ty - hy[i]) * rate; const hl = Math.sqrt(hx[i] * hx[i] + hy[i] * hy[i]) + 1e-9; hx[i] /= hl; hy[i] /= hl;
    }
  }
  /* the run: pass 0 (the 37 others alone: when does the last of them cross the count line?), pass 1 (the three stragglers' delays are set from it so they are the 38th, 39th and 40th, residents only: p40, the release time of the
   * Strawberries), pass 2 (everybody). Each pass restarts from the seats. */
  const TL_RISE_SIM = 0;
  function reset() {
    px.fill(0); py.fill(0); vx.fill(0); vy.fill(0); st.fill(0); wp.fill(0); slot.fill(-1); stuck.fill(0); pass.fill(-1); dpass.fill(-1); tset.fill(-1); slotN = 0; released1 = false;
    for (let i = 0; i < N; i++) { const a = A[i]; px[i] = a.x0; py[i] = a.y0; if (a.wave === 0) { const dx = P.TV.x - a.x0, dy = P.TV.y - a.y0, d = Math.sqrt(dx * dx + dy * dy); hx[i] = dx / d; hy[i] = dy / d; } else { hx[i] = 0; hy[i] = 1; } }
  }
  /* stop: 'cross' ends the pass when every head that is going to rise has crossed the count line, 'settled' when every head has reached its slot; the record keeps the last frame (atTau clamps) */
  let kEnd = 0;
  function run(tRel, n, Tmax, keep, stop) {
    tRelSim = tRel; NA = n || N; reset();
    const ns = Math.min(nSteps, Math.ceil((Tmax || 1e9) / DT));
    let k = 0;
    for (; k < ns; k++) {
      step(k);
      if (keep && k % REC === 0) { const o = (k / REC) * N * 4; for (let i = 0; i < N; i++) { rec[o + i * 4] = px[i]; rec[o + i * 4 + 1] = py[i]; rec[o + i * 4 + 2] = hx[i]; rec[o + i * 4 + 3] = hy[i]; recSt[(k / REC) * N + i] = st[i]; } }
      if (stop && k % 20 === 0) {
        let all = true;
        for (let i = 0; i < NA && all; i++) { if (stop === 'cross') { if (A[i].delay < 1e8 && pass[i] < 0) all = false; } else if (st[i] !== 3) all = false; }
        if (all) { k++; break; }
      }
    }
    kEnd = k;
  }
  const named3 = A.filter(a => a.name);                                                                  /* cran, pear, banana (ids 37, 38, 39) */
  const pathLen = a => Math.hypot(P.HX0 - a.x0, 8.7 - a.y0) + 1.3;
  for (const a of named3) a.delay = 1e9;
  run(1e9, NR, 80, false, 'cross');
  let p37 = 0; for (let i = 0; i < NR; i++) if (!A[i].name && pass[i] > p37) p37 = pass[i];
  const offs = opts.offs || [2.0, 3.65, 5.25];                                                          /* the stragglers cross the count line this long after the 37th head (scene: Mango's three words, about 1.6 sim s apart at x1.7) */
  named3.forEach((a, k) => { a.delay = Math.max(0, p37 + offs[k] - pathLen(a) / a.v0 * 1.1 - .2); });
  for (let it = 0; it < 6; it++) {                                                                       /* corrections: shift each delay by how far its crossing (in crossing order) missed its target */
    run(1e9, NR, 90, false, 'cross');
    const byT = named3.slice().sort((a, b) => (pass[a.id] < 0 ? 1e9 : pass[a.id]) - (pass[b.id] < 0 ? 1e9 : pass[b.id]));
    byT.forEach((a, r) => { if (pass[a.id] >= 0) a.delay = Math.max(0, a.delay + .85 * (p37 + offs[r] - pass[a.id])); });
  }
  run(1e9, NR, 90, false, 'cross');
  const resPass = []; for (let i = 0; i < NR; i++) resPass.push(pass[i]);
  const p40 = resPass.slice().sort((a, b) => a - b)[NR - 1];
  const gap = opts.relGap ?? 3.4, tRel = p40 + gap;
  run(tRel, N, null, true, 'settled');
  const recLast = Math.max(1, Math.floor((kEnd - 1) / REC));
  const allPass = []; for (let i = 0; i < N; i++) allPass.push(pass[i] < 0 ? 1e9 : pass[i]);
  const ps = allPass.slice().sort((a, b) => a - b);
  const done = []; for (let i = 0; i < N; i++) done.push(st[i] === 3);
  let tSettle = 0; for (let i = 0; i < N; i++) if (tset[i] > tSettle) tSettle = tset[i];
  /* ------------------------------------------------ the time map: anchors (scene-local s -> sim s), monotone, piecewise linear: real time while the ground shot tracks the line, a ramp, the time-lapse, slow for the three words, the flood, the drain */
  const eps = .03;
  const ANCH = [[0, 0], [TL.rise, 0], [TL.trackEnd, 1.2], [TL.ramp, 4.2], [TL.l3, ps[36] + .3], [TL.w38, ps[37] + eps], [TL.w39, ps[38] + eps], [TL.w40, ps[39] + eps], [TL.ch1, tRel], [TL.eighty, ps[79] + eps], [TL.l6a, tRel + 14.9], [TL.l6b, tRel + 22.9], [TL.end, tSettle + 1], [TL.dur, tSettle + 3.5]];
  function tauAt(lt) {
    if (lt <= 0) return 0;
    for (let i = 1; i < ANCH.length; i++) if (lt <= ANCH[i][0]) { const a = ANCH[i - 1], b = ANCH[i], u = (lt - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; }
    return ANCH[ANCH.length - 1][1];
  }
  function rate(lt) { for (let i = 1; i < ANCH.length; i++) if (lt <= ANCH[i][0]) return (ANCH[i][1] - ANCH[i - 1][1]) / (ANCH[i][0] - ANCH[i - 1][0]); return 1; }
  function atTau(tau, out) {
    const f = Math.max(0, Math.min(recLast - .001, tau / (DT * REC))), i0 = Math.floor(f), u = f - i0, o0 = i0 * N * 4, o1 = (i0 + 1) * N * 4;
    for (let i = 0; i < N; i++) {
      out.x[i] = rec[o0 + i * 4] + (rec[o1 + i * 4] - rec[o0 + i * 4]) * u; out.y[i] = rec[o0 + i * 4 + 1] + (rec[o1 + i * 4 + 1] - rec[o0 + i * 4 + 1]) * u;
      let hxx = rec[o0 + i * 4 + 2] + (rec[o1 + i * 4 + 2] - rec[o0 + i * 4 + 2]) * u, hyy = rec[o0 + i * 4 + 3] + (rec[o1 + i * 4 + 3] - rec[o0 + i * 4 + 3]) * u; const l = Math.sqrt(hxx * hxx + hyy * hyy) + 1e-9;
      out.hx[i] = hxx / l; out.hy[i] = hyy / l; out.st[i] = recSt[i0 * N + i];
    }
    return out;
  }
  const mkOut = () => ({ x: new Float32Array(N), y: new Float32Array(N), hx: new Float32Array(N), hy: new Float32Array(N), st: new Int8Array(N) });
  function countTau(tau) { let c = 0; for (let i = 0; i < N; i++) if (allPass[i] <= tau) c++; return c; }
  return { N, NR, PLAN, A, meta: A, pass: allPass, dpass: Array.from(dpass), sorted: ps, T_REL: tRel, p40, p37, tSettle, tset: Array.from(tset), named3, ANCH, TL, nSteps, DT, recN, slots,
    tauAt, rate, atTau, at: (lt, out) => atTau(tauAt(lt), out || mkOut()), mkOut, countTau, count: lt => countTau(tauAt(lt)), allDone: done.every(Boolean), seats, WALLS };
}
const api = { build, PLAN, TL };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP18_SIMS = window.__EP18_SIMS || {}; window.__EP18_SIMS.evac = api; }
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const t0 = Date.now(), S = build();
  console.log('built in', Date.now() - t0, 'ms; agents', S.N, 'T_REL', S.T_REL.toFixed(2), 'allDone', S.allDone, 'p37', S.p37.toFixed(1), 'p40', S.p40.toFixed(1), 'settle', S.tSettle.toFixed(1), 'delays', S.named3.map(a => a.name + ':' + a.delay.toFixed(1)).join(' '));
  console.log('pass times (sim s):', S.sorted.map(x => x.toFixed(1)).join(' '));
  console.log('anchors:', S.ANCH.map(a => a[0].toFixed(2) + '->' + a[1].toFixed(1)).join('  '));
  for (let i = 1; i < S.ANCH.length; i++) console.log('  x' + ((S.ANCH[i][1] - S.ANCH[i - 1][1]) / (S.ANCH[i][0] - S.ANCH[i - 1][0])).toFixed(1), 'from', S.ANCH[i - 1][0], 'to', S.ANCH[i][0]);
  for (const [n, t] of [['trackEnd', TL.trackEnd], ['l3', TL.l3], ['w38', TL.w38], ['w39', TL.w39], ['w40', TL.w40], ['ch1', TL.ch1], ['eighty', TL.eighty], ['end', TL.end]]) console.log(n, t, 'count', S.count(t), 'count just before', S.count(t - .02));
}
})();
