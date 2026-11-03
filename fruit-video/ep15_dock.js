'use strict';
/* SHIFT HAPPENS, Episode 15, scene `dock` (32.38 s, 3:20 PM, THE MERGE): a crane lowers the Greenleaf building onto Fruit Bowl (physics), the tower, the corridor zipper merge, salad and pizza.
 * Builder E15-K. Registers window.__EP15_SCENES.dock. Everything is a pure function of the scene time `lt`; the building, the crane, the sky come from ep15_house.js (S15), the physics from ep15_dock_sim.js (built once,
 * lazily, sampled with world.at(); never stepped), the cast from the Episode 7 to 15 art kits. window.__K15 (a debug override of the state and the camera) is the kit's test hook.
 *
 * SHOT LIST (scene-local seconds; cues from python3 /tmp/shift_tools/cues.py 15 dock)
 *   0.00-1.30  open     WIDE (z .5): the whole tower site at gold hour: Fruit Bowl in its lot, the crane beside it, the Greenleaf block hanging high on four cables; tiny Binder waves from the cab (cranemotor 0.2).
 *   1.30-2.22  b1       PUSH IN on the cab (z .5 to 3.1): "Merging cells!" Binder points at the load (the wave turns into a point on the first word).
 *   2.22-3.42  lower    CUT to the block (z .85, a slow crane-down that follows it): the hook starts down (cranemotor 2.221).
 *   3.42-4.05  creak    CUT to the spreader beam and slings (z 1.45): the cables creak (cablecreak 3.421: they shudder), the load sways.
 *   4.05-4.95  ceiling  two cut-ins inside Fruit Bowl's top floor: Melon looks up from his pizza, dust sifts; the conference table buzzes (pizza boxes, a fishbowl, cups).
 *   4.95-5.82  approach JOIN VIEW (z 1.0): the block's underside comes down toward the roof sign; the winch slips for the last 0.4 s.
 *   5.82-6.27  impact   the same frame: first touch at 5.821 (dockimpact): flash, shock ring, camera shake 14 px decaying, a 4-frame hit-stop (the picture runs at 0.15 speed, then slams to the true time at the landing 5.98),
 *                       the roof sign breaks in two and the chimney bursts (physics), tiles and dust, the top floor's props jump (physics), Fruit Bowl squats 40 px and rebounds, the staff flinch.
 *   6.27-9.07  settle   the camera sweeps UP the block (the cables whip: cablewhip 6.571) and pulls back to the whole tower (z .5) while the dust settles; a hatch in the old office ceiling opens and a green chute unrolls from the lobby.
 *   9.12-19.7  office   Broccoli rides the chute on his salad bowl; Melon "Welcome to the family!", "We brought salad.", "We brought pizza.", "Pizza is not a vegetable." (handshake), Tomato steps between (half-red half-green sticker),
 *                       Lemon: "Are you a fruit or a vegetable?" / "Pending." (close-up).
 *   19.75-26.6 stairs   the stairwell at the join (a vertical cut): Lemon directs with a whistle; Mango walks UP and Carrot DOWN in profile (yaw), each stopping to let the other pass, then both go: bonk (25.901), stars (25.951).
 *   26.65-31.9 line     "That's a merge." (the queue backs up, fruit, vegetable, fruit, vegetable); Onion comes up: her tears spread to everyone in range; sob (31.168), sting (31.43).
 * Sound cues are hit by the sim (collisions) and by the picture: dockimpact on the first-touch frame (5.833), groan 6.371 (the crane's jib bows), cablewhip 6.571 (the slings flick), bonk 25.901, sniffle 29.263, sob 31.168. */
(() => {
if (!window.TIMELINE_EP15 || !window.S15 || !window.H6) return;
const { zoomTo } = window.H6;
const A6 = window.A6, A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A15 = window.A15;
const TLS = window.TIMELINE_EP15.scenes.find(s => s.id === 'dock'), BT = TLS.beats;
const bs = id => BT[id].s, be = id => BT[id].e;
const LINES = {}; for (const l of window.TIMELINE_EP15.lines) if (l.scene === 'dock') LINES[l.id] = l;
const wordT = (id, w, fb) => { const l = LINES[id]; if (!l) return fb; const k = l.words.find(q => q[0].toLowerCase().replace(/[^a-z0-9]/g, '') === w); return k ? bs(id) + k[1] : fb; };
const sk = (t, a, b) => easeIO(seg(t, a, b)), so = (t, a, b) => easeOut(seg(t, a, b)), si = (t, a, b) => easeIn(seg(t, a, b)), sb = (t, a, b) => easeBack(seg(t, a, b));
const hz = (t, f, ph = 0) => Math.sin(t * TAU * f + ph);
const SS = S15.S;
const TC = 5.821;
const CUE = { dockimpact: bs('lower') + 3.6, groan: bs('settle') + .1, whip: bs('settle') + .3, bonk: bs('bonk') + .1, stars: bs('bonk') + .15, sniffle: bs('o1') + 1.4, sob: bs('o2') + 1.5, sting: bs('end') + .1 };

// ================================================================================================ the simulation (built once, lazily; DOM-free module ep15_dock_sim.js)
let SIM = null;
function simInit() {
  if (SIM !== null) return SIM;
  SIM = false;
  try {
    const M = window.__EP15_SIMS && window.__EP15_SIMS.dock;
    if (M && window.PHYS2D) {
      const r = M.build(); const by = {}; for (const b of r.meta.bodies) by[b.name] = b;
      SIM = { r, W: r.world, meta: r.meta, by, runT: r.runT, M, ids: { gl: by.gl.id, fb: by.fb.id, hook: by.hook.id } };
    }
  } catch (e) { console.error('dock sim: ' + (e && e.stack || e)); }
  return SIM;
}
/* the picture's sim time: the hit-stop. The picture runs at 0.15 speed from the first touch (5.821) for four frames, then slams to the true time at the landing (5.98): sound and picture agree on the touch and on the landing */
const WARP = [[0, 0], [5.821, 5.821], [5.955, 5.841], [5.99, 5.99], [1e3, 1e3]];
function warp(lt) { for (let i = 1; i < WARP.length; i++) if (lt < WARP[i][0]) return lerp(WARP[i - 1][1], WARP[i][1], (lt - WARP[i - 1][0]) / (WARP[i][0] - WARP[i - 1][0])); return lt; }
const hitStop = lt => lt > 5.821 && lt < 5.99;

/* everything the picture needs from the simulation at scene time lt (numbers copied out: world.at() reuses its buffers) */
function simAt(lt) {
  const S = simInit(), ts = warp(lt);
  const out = { ts, squat: 0, gl: { x: 540, y: -227, angle: 0 }, hook: [540, -1550], ropes: null, bodies: null, ok: !!S };
  if (!S) return out;
  const st = S.W.at(Math.min(ts, S.runT)), gl = st.by[S.ids.gl], fb = st.by[S.ids.fb], hk = st.by[S.ids.hook];
  out.squat = fb.y - 500; out.gl = { x: gl.x, y: gl.y, angle: gl.angle }; out.hook = [hk.x, hk.y];
  out.ropes = st.ropes.map(r => { const a = []; for (let i = 0; i < r.pts.length; i += 2) a.push([r.pts[i], r.pts[i + 1]]); return a; });
  out.bodies = st.by.map(e => e ? { x: e.x, y: e.y, angle: e.angle, vx: e.vx, vy: e.vy } : null);
  return out;
}

// ================================================================================================ the state of the tower at scene time lt
const imp = lt => lt - TC;                                           /* seconds since the first touch (picture time) */
const decayAt = (lt, t0, tau) => lt < t0 ? 0 : Math.exp(-(lt - t0) / tau);
let ST = null;                                                         /* the S15 state of the frame being drawn (characters read their rooms from it) */
function stateAt(lt) {
  const m = simAt(lt), ts = m.ts;
  const k = decayAt(lt, TC + .012, .5), kk = decayAt(lt, TC + .012, 1.4);
  const approach = seg(ts, 3.6, 5.82);
  const dust = lt < TC ? .1 + .55 * approach : Math.min(1, .2 + 1.1 * kk) * (1 - seg(lt, 8.0, 9.3));
  const rooms = {};
  for (const id of ['office', 'conf', 'rest', 'r14']) rooms[id] = { dust: Math.max(0, dust), flicker: lt > TC && lt < 8.5 ? .75 * decayAt(lt, TC + .012, 1.1) : (lt > 4.4 && lt < TC ? .25 * approach : 0) };
  for (const id of ['med', 'r4', 'r7', 'shower']) rooms[id] = { flicker: lt > TC && lt < 7.5 ? .4 * decayAt(lt, TC + .012, .8) : 0 };
  const shakeAmp = lt < TC ? 1.1 * approach * approach : 6 * k, shk = lt;
  const st = {
    t: lt, tod: .5, stack: 0, blockPose: m.gl, squat: m.squat, roofParts: 'sim',
    crane: { hook: m.hook, ropes: m.ropes || undefined, load: 'gl', jitter: lt > 3.4 && lt < 4.4 ? 2.4 * decayAt(lt, 3.421, .5) + .4 : (lt > 5.2 && lt < TC ? 1.2 * seg(lt, 5.2, TC) : 0), jibSway: lt > 6.371 ? 9 * decayAt(lt, 6.371, 1.1) * hz(lt - 6.371, 1.4) : 0 },
    rooms, shakeX: shakeAmp * hz(shk, 31, 1), shakeY: shakeAmp * .6 * hz(shk, 37, 2),
  };
  st.__m = m;
  return st;
}
/* the debug hook: window.__K15.st overrides the state, .view the camera */
const KDBG = () => (window.__K15 && window.__K15.on) ? window.__K15 : null;

// ================================================================================================ what the simulation throws: roof debris (in front of everything, growing toward the camera) and the top floor's props
const grow = (ts, t0 = TC + .012) => 1 + .5 * so(ts, t0, t0 + .7);
function drawRoofSim(lt, m) {
  const S = simInit(); if (!S || !m.bodies) return;
  const ts = m.ts, B = m.bodies, P = S.meta.parts, dark = ts > TC + .005;
  const g = ts > S.meta.TL ? grow(ts) : 1;
  const pose = (id) => B[id];
  const sa = S.by.signa, sb = S.by.signb;
  for (const sg of [sa, sb]) { const p = pose(sg.id); if (!p) continue; S15.drawDebris('sign', p.x, p.y, p.angle, { p: { w: sg.w, h: sg.h, text: sg.text, x: sg.x, legs: sg.legs }, scale: g, dark, id: sg.name, t: lt }); }
  for (const id of P.bricks) { const p = pose(id); if (p) S15.drawDebris('brick', p.x, p.y, p.angle, { scale: g, i: S.W.bodies[id].def && S.W.bodies[id].def.data ? S.W.bodies[id].def.data.i : id }); }
  { const p = pose(P.cap); if (p) S15.drawDebris('cap', p.x, p.y, p.angle, { scale: g }); }
  { const p = pose(P.vane); if (p) S15.drawDebris('vane', p.x, p.y, p.angle, { scale: g }); }
  if (ts > S.meta.TL) for (const id of P.chips) { const p = pose(id), info = S.meta.bodies.find(b => b.id === id); if (p) S15.drawDebris('chip', p.x, p.y, p.angle, { scale: g, w: info.w, i: info.i }); }
}
function drawPropsSim(lt, m, group) {       /* group 'office': in front of the Administrator (on and around his desk); 'rest': the other rooms' things, behind the people standing at the front of their rooms */
  const S = simInit(); if (!S || !m.bodies) return;
  for (const id of S.meta.props) {
    const b = S.meta.bodies.find(q => q.id === id), p = m.bodies[id]; if (!p || !b) continue;
    if ((b.room === 'office') !== (group === 'office')) continue;
    S15.drawProp(b.kind, p.x, p.y, b.w, b.h, p.angle, { flip: b.flip, slosh: p.vx * .004, t: lt, v: Math.hypot(p.vx, p.vy) });
  }
}

// ================================================================================================ effects: dust puffs at the roof, the shock ring, the flash, speed streaks, tile dust; all deterministic functions of lt
function puffs(lt, t0, n, seed, spread, o = {}) {
  const q = V2.rng(seed), age0 = lt - t0; if (age0 < 0 || age0 > (o.life ?? 1.8)) return;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x0 = o.x0 + q() * (o.x1 - o.x0), y0 = o.y0 + (q() - .5) * (o.dy ?? 14), vx = (q() - .5) * spread + (x0 < (o.xc ?? 540) ? -1 : 1) * (o.out ?? 60), vy = -(o.up ?? 40) * (.4 + q()), r0 = (o.r ?? 18) * (.5 + q()), a = Math.min(1, age0 * 8) * (1 - age0 / (o.life ?? 1.8)) * (o.alpha ?? .55) * (.6 + .4 * q()), d = 1 - Math.exp(-age0 * 2.2);
    const x = x0 + vx * d * .7, y = y0 + vy * d * .7 + 14 * age0 * age0, r = r0 * (1 + 2.4 * d);
    ctx.fillStyle = rgbaS(o.color ?? '226,214,198', a * .85); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = rgbaS(o.light ?? '246,238,226', a * .5); ctx.beginPath(); ctx.arc(x - r * .22, y - r * .26, r * .7, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
const rgbaS = (c, a) => `rgba(${c},${a})`;
function impactFx(lt, st) {
  if (lt < TC || lt > TC + 2.6) return;
  const sq = st.squat, yJoin = 300 + sq * .5;
  /* dust at the join: from both eaves and along the gap, rolling out toward the camera */
  puffs(lt, TC + .012, 26, 11, 120, { x0: 20, x1: 1060, y0: yJoin + 10, out: 90, up: 70, r: 24, life: 2.4, dy: 24 });
  puffs(lt, TC + .1, 18, 23, 90, { x0: 40, x1: 1040, y0: yJoin + 30, out: 70, up: 40, r: 20, life: 2.2, alpha: .5, color: '196,176,158' });
  puffs(lt, 5.98, 22, 37, 160, { x0: 60, x1: 1020, y0: yJoin + 16, out: 120, up: 50, r: 22, life: 2.4, alpha: .5, color: '210,196,180' });
  /* the shock ring, flat against the join; a second at the landing */
  V2.ring(540, yJoin, seg(lt, TC, TC + .55), { r0: 30, r1: 1050, color: '255,244,214', lw: 22, alpha: .8, squash: .22, bloom: .7 });
  V2.ring(540, yJoin, seg(lt, 5.98, 5.98 + .6), { r0: 30, r1: 900, color: '255,226,170', lw: 16, alpha: .55, squash: .2, bloom: .5 });
  /* sparks from the touch: gold and white, thrown outward along the gap */
  V2.sparks(260, yJoin - 20, lt, TC + .01, { n: 16, speed: 520, life: .7, color: '255,238,170', g: 1400, size: 5, seed: 3 });
  V2.sparks(820, yJoin - 20, lt, TC + .01, { n: 16, speed: 520, life: .7, color: '255,238,170', g: 1400, size: 5, seed: 7 });
}
function flashOver(lt) {
  const f = (lt - TC) * 30;      /* frames since the touch: one hot frame, a second half-hot one, then it burns off while the picture is held; added light, so the shapes stay readable */
  let a = lt < TC + .003 ? 0 : f < 1.6 ? .62 : f < 2.6 ? .34 : .22 * Math.exp(-(lt - TC - .087) / .09);
  if (lt >= 5.98) a += .26 * Math.exp(-(lt - 5.98) / .07);
  if (a < .01) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,236,190,${Math.min(.85, a)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
}
/* a comic word on the touch: CRUNCH! (set dressing: hero:false, crop) */
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .1), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.35, 1, easeOut(k)), lerp(1.35, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  UI.label(str, 0, 0, { size: o.size ?? 150, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', stroke: '#150f22', lw: 14, spacing: 3, shadow: 14, hero: false, crop: true, tilt: .3, id: 'dock.sfx.' + str });
  ctx.restore();
}

// ================================================================================================ the cast of the first half: Binder in the cab, Melon / Lemon / Mango / Strawberry on Fruit Bowl's top floor
const RM = id => S15.rect(id, ST || {});
const P = (ctor, x, y, extra) => ctor(Object.assign({ x, y, s: SS }, extra));
const SLICE = EXT.prop.fp14k_slice ? 'fp14k_slice' : 'slice12';

/* each staff member glances up at the ceiling when the dust starts to sift (one after the other), flinches on the touch, coughs in the dust, then looks at the hatch */
const UP_AT = [4.12, 4.55, 4.95, 5.05];
const upK = (lt, i) => sk(lt, UP_AT[i], UP_AT[i] + .4);
const hitK = lt => decayAt(lt, TC + .012, .32);
const POST = lt => lt >= TC + .012;
function reactBase(lt, i, rest) {
  const up = upK(lt, i), hit = hitK(lt), post = POST(lt), late = seg(lt, 7.3, 8.5), hatch = seg(lt, 7.7, 8.2);
  const o = { t: lt, expr: !post ? (up > .55 ? 'shock' : 'neutral') : lt < 6.7 ? 'panic' : lt < 8.5 ? 'shock' : 'sour', look: [lerp(.15 * hz(lt, .3 + i * .1, i), 0, up), lerp(.1, -.95, up)], lid: .1 + .3 * hit };
  if (post) {
    o.rot = .09 * hit * hz(lt, 8 + i, i); o.squash = .13 * hit; o.plant = true;
    o.arms = lt < 6.5 ? { l: 'flail', r: 'flail' } : { l: 'rest', r: lt < 7.9 ? 'rest' : 'rest' };
    o.look = [lerp(.3 * hz(lt, 1.2 + i, i), .35, hatch), lerp(-.6, -.55, hatch)];
    if (lt > 6.8 && lt < 8.6) o.squash = Math.max(o.squash || 0, .05 * Math.max(0, hz(lt, 2.6 + i * .3, i)));
  } else if (up > .5) o.arms = { l: 'rest', r: 'rest' };
  return Object.assign(o, rest);
}
function melonO(lt) {
  const r = RM('office'), up = upK(lt, 0), post = POST(lt), s = SS * 1.22, ph = (lt * .42) % 1, bite = sk(ph, 0, .1) * (1 - sk(ph, .2, .3));
  const gx = lerp(100, 40, bite), gy = lerp(62, 26, bite);
  const mouth = up > .3 ? .6 * up : (ph > .1 && ph < .18 ? .5 : ph > .18 && ph < .6 ? .15 * Math.abs(Math.sin(ph * 60)) : 0);
  const holding = !post && up < .98;
  const o = reactBase(lt, 0, { x: r.x0 + 150 + (post ? 3 * hz(lt - TC, 7) * hitK(lt) : 0), y: r.floor - 42, s, noLegs: true, noShadow: true, plant: true, who: 'melon', mouthOpen: post ? .7 * hitK(lt) + .15 : mouth,
    arms: post ? (lt < 6.5 ? { l: 'flail', r: 'flail' } : { l: 'rest', r: 'rest' }) : { l: 'rest', r: 'hold' }, hold: holding ? { r: SLICE } : {}, grip: { r: [gx, gy] } });
  if (!post) o.rot = .012 * hz(lt, .4) + .02 * up * hz(lt, 9);
  return A9.melon(o);
}
const lemonO = lt => P(A7.lemon, RM('conf').x0 + 62, RM('conf').floor, reactBase(lt, 1, { who: 'lemon' }));
const mangoO = lt => P(A7.mango, RM('rest').x0 + 150, RM('rest').floor, reactBase(lt, 2, { who: 'mango' }));
const strawO = lt => P((A11 || A7).straw, RM('r14').x0 + 150, RM('r14').floor, reactBase(lt, 3, { who: 'straw' }));
/* the slice thrown out of Melon's hand on the touch: an arc, spinning, to the floor */
function sliceFly(lt) {
  const t = lt - (TC + .02); if (t < 0 || t > 1.6) return;
  const r = RM('office'), x0 = r.x0 + 150 + 38, y0 = r.floor - 42 - 96, g = 900, x = x0 + 110 * t - 20 * t * t, yy = y0 - 300 * t + .5 * g * t * t, yf = r.floor - 6, y = Math.min(yy, yf), done = yy >= yf;
  ctx.save(); ctx.translate(x, y); ctx.rotate(done ? 2.6 : t * 11); ctx.scale(SS * 1.22 * .9, SS * 1.22 * .9); (EXT.prop.slice12 || EXT.prop.slice10)(1, {}, lt); ctx.restore();
}
/* Binder in the crane cab: a hard hat, a wave, a point at the load on the first word, a thumb, a cheer on the touch */
function binderO(lt) {
  const rig = S15.craneRig(lt, ST || { stack: 0 }), cx = rig.cab[0] + rig.cab[2] / 2, cy = rig.cab[1] + rig.cab[3] * .56;
  const a = bs('b1'), e = be('b1'), speaking = lt >= a - .05 && lt < e + .1;
  let pose = 'wave', grin = .5;
  if (lt >= a - .12) pose = 'point';
  if (lt >= e + .5) pose = 'thumb';
  if (lt >= 4.2) pose = 'rest';
  if (lt >= TC) { pose = lt < 7.6 ? 'cheer' : 'helpful'; grin = 1; }
  const o = { x: cx, y: cy, s: .4, t: lt, who: 'bind', pose, grin, look: lt < TC ? [-.85, .35] : [-.3, .9], acc: ['fp15_hardhat'], hover: 4, yaw: -.5, center: true, noLegs: true, bob: 1 };
  return (A15 && A15.binderSmall) ? A15.binderSmall(o) : null;
}
const drawBinder = lt => { const o = binderO(lt); if (o) drawChar(o); };
/* the four top-floor staff, back to front of the rooms, in one call (between the building's back and front layers) */
function drawStaff1(lt, z) {
  if (z < .9) return;
  for (const f of [melonO, lemonO, mangoO, strawO]) { const o = f(lt); if (o) drawFaded(o); }
  sliceFly(lt);
}
/* a face is whole, clear of the frame, the clock pill and the caption zone, or the character is not drawn; one that is leaving or entering the frame at its edge is drawn as `transit` and faded (a quarter second of margin, as in Episode 14's headVis) */
function faceVis(o) {
  const k = (o.s || SS) / .44, hx = (o.x - CAM.x) * CAM.z + W / 2, hy = (o.y - 118 * k * (o.noLegs ? .75 : 1) - CAM.y) * CAM.z + H / 2, r = 54 * k * CAM.z;
  const m = Math.min(hx - r, W - (hx + r), hy - r);                         /* how far the face box is inside the left, right and top edges of the frame */
  const inBox = (x0, y0, x1, y1) => hx + r > x0 && hx - r < x1 && hy + r > y0 && hy - r < y1;
  if (inBox(48, 116, 500, 244) || inBox(0, 1380, W, 1700)) return { a: 0, transit: false };
  if (m >= 0) return { a: 1, transit: false };
  return { a: clamp(1 + m / (r * .8)), transit: true };
}
function drawFaded(o) {
  const v = faceVis(o); if (window.__fadeLog) window.__fadeLog.push([o.who, +v.a.toFixed(2), +CAM.z.toFixed(2), +CAM.x.toFixed(0), +o.x.toFixed(0), +o.y.toFixed(0)]);
  if (v.a <= .02) return;
  if (v.transit) o.transit = true;
  if (v.a < .99) { ctx.save(); ctx.globalAlpha *= v.a; drawChar(o); ctx.restore(); } else drawChar(o);
}

// ================================================================================================ the camera (scene-local time; world = tower coordinates). The clear band centre sits BAND px above the frame centre.
const BAND = 148;
/* a push between two poses that keeps the subject on a straight line: zoom in log space, the centre follows 1/z */
function pushP(a, b, u) {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)), d = 1 / b.z - 1 / a.z, f = Math.abs(d) < 1e-9 ? u : (1 / z - 1 / a.z) / d;
  return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), z };
}
const mixP = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)) });
const cabP = z => { const w = S15.craneRig(0, { stack: 0 }).cab; return { x: w[0] + w[2] / 2 + 6, y: w[1] + w[3] / 2 + BAND / z + 4, z }; };
const OPEN0 = { x: 600, y: -470, z: .5 }, OPEN1 = { x: 640, y: -520, z: .53 };
const roomP = (id, z) => { const r = RM(id); return { x: r.cx, y: r.cy + 8 + BAND / z, z }; };
const CUTS = [bs('lower'), 3.421, 4.05, 4.5, 4.95, 9.12, 10.42, 12.79, 15.13, 18.84, 19.75];
const nearCut = (lt, w) => CUTS.some(c => Math.abs(lt - c) < w);
/* the join shot: the gap between the block's underside and the roof sign, the sign, the roof, the top floor below */
const JOIN_A = { x: 540, y: 300, z: 1.12 }, JOIN_B = { x: 540, y: 372, z: 1.62 };
const TOP_B = { x: 700, y: -1010, z: .88 };
const SETTLE_END = { x: 560, y: 560, z: .5 };
function camAt(lt) {
  if (lt >= 9.12) return camAt2(lt);
  const m = simAt(lt);
  if (lt < 1.3) return mixP(OPEN0, OPEN1, lt / 1.3);
  if (lt < bs('lower')) return pushP(OPEN1, cabP(3.5), sk(lt, 1.3, 2.12));
  if (lt < 3.421) { const u = seg(lt, bs('lower'), 3.421), z = lerp(.86, .8, u); return { x: 560, y: m.gl.y + BAND / z - 20, z }; }
  if (lt < 4.05) { const u = seg(lt, 3.421, 4.05), z = lerp(1.28, 1.36, u); return { x: 540, y: m.hook[1] + 109 + 125 + BAND / z, z }; }
  if (lt < 4.5) { const u = seg(lt, 4.05, 4.5), c = roomP('office', 3.3); return { x: c.x + lerp(-6, 6, u), y: c.y, z: c.z * lerp(1, 1.06, u) }; }
  if (lt < 4.95) { const u = seg(lt, 4.5, 4.95), c = roomP('conf', 3.3); return { x: c.x + lerp(8, -8, u), y: c.y, z: c.z * lerp(1, 1.05, u) }; }
  if (lt < 6.27) {
    const u = seg(lt, 4.95, TC + .02), c = pushP(JOIN_A, JOIN_B, easeIn(u) * .55 + u * .45), k = decayAt(lt, TC + .012, .22);
    return { x: c.x, y: c.y + 10 * k - 2 * m.squat * .5, z: c.z * (1 + .07 * k) };
  }
  if (lt < 6.95) { const c = pushP(JOIN_B, TOP_B, sk(lt, 6.27, 6.95)); return c; }
  if (lt < 7.4) return { x: TOP_B.x - 8 * seg(lt, 6.95, 7.4), y: TOP_B.y, z: TOP_B.z * lerp(1, .97, seg(lt, 6.95, 7.4)) };
  const c0 = { x: TOP_B.x - 8, y: TOP_B.y, z: TOP_B.z * .97 };
  if (lt < 8.5) return pushP(c0, SETTLE_END, sk(lt, 7.4, 8.5));
  return { x: SETTLE_END.x, y: SETTLE_END.y, z: SETTLE_END.z * (1 + .03 * seg(lt, 8.5, 9.12)) };
}
function camSpeed(lt) {
  const dt = .02, a = camAt(Math.max(0, lt - dt)), b = camAt(Math.min(TLS.dur - .001, lt + dt)), z = (a.z + b.z) / 2;
  return Math.hypot((b.x - a.x) * z, (b.y - a.y) * z) / (2 * dt) + Math.abs(Math.log(b.z / a.z)) / (2 * dt) * 700;
}
const shakeAt = lt => {
  const k = (t0, a, tau) => lt >= t0 ? a * Math.exp(-(lt - t0) / tau) : 0;
  const pre = lt < TC ? 1.6 * Math.pow(seg(lt, 3.8, TC), 2) + (lt > 3.421 && lt < 3.9 ? 1.4 * Math.exp(-(lt - 3.421) / .2) : 0) : 0;
  return pre + k(TC + .003, 14, .2) + k(5.98, 8, .16) + k(6.37, 2.2, .35) + k(6.571, 1.6, .25);
};
function fxAt(lt) {
  const f = lt >= TC ? Math.exp(-(lt - TC) / .35) : 0, o = { bloom: .5 + .55 * f, vignette: .4 + .1 * seg(lt, 3.5, TC) * (lt < TC ? 1 : 0), grain: .045, contrast: .13 + .12 * f, sat: .12 - .05 * f };
  o.tint = [['#ffd08a', .06 + .1 * f, 'soft-light']];
  return o;
}
function blurAt(lt) {
  if (nearCut(lt, .05)) return 1;
  const sp = camSpeed(lt); let n = 1;
  if (sp > 1500) n = Math.min(24, Math.round(10 + (sp - 1500) / 350)); else if (sp > 700) n = 7; else if (sp > 300) n = 4; else if (sp > 120) n = 2;
  return n;
}
const shotOf = lt => lt < 1.3 ? 'open' : lt < bs('lower') ? 'b1' : lt < 3.421 ? 'lower' : lt < 4.05 ? 'creak' : lt < 4.95 ? 'ceiling' : lt < TC ? 'approach' : lt < 6.27 ? 'impact' : lt < 9.12 ? 'settle' : shotOf2(lt);

// ================================================================================================ the first half's picture (0 to 9.12 s): the tower, the crane, the cast, what the simulation throws, the effects
function draw1(lt) {
  const st = stateAt(lt); ST = st;
  S15.light(st);
  S15.tower(lt, st);
  const m = st.__m;
  hatchDraw(lt, st); chuteDraw(lt);
  drawBinder(lt);
  drawPropsSim(lt, m, 'rest');
  drawStaff1(lt, CAM.z);
  drawPropsSim(lt, m, 'office');
  S15.front(lt, st);
  drawRoofSim(lt, m);
  impactFx(lt, st);
}
function over1(lt) {
  flashOver(lt);
  sfxWord(lt, TC + .005, 'CRUNCH!', 330, 392, { size: 150, rot: -.09, hold: .55 });
}


// ================================================================================================ the hatch and the green salad chute: from Greenleaf's Dining Room floor, through the roof, into Fruit Bowl's conference room
/* path of the chute's centre line in tower coordinates (a smooth curve through these points: down the roof gap, bending out on the floor of the conference room) */
const CH_PTS = [[356, 226], [357, 300], [358, 372], [361, 440], [370, 505], [388, 566], [418, 614], [458, 642], [506, 653]];
const CH = (() => {
  const P = CH_PTS, n = P.length, out = [];
  const cr = (a, b, c, d, t) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    for (let k = 0; k < 14; k++) { const t = k / 14; out.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]); }
  }
  out.push(P[n - 1].slice());
  let s = 0; const q = out.map((p, i) => { if (i) s += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]); return { x: p[0], y: p[1], s }; });
  for (let i = 0; i < q.length; i++) { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; q[i].tx = dx / L; q[i].ty = dy / L; q[i].nx = -dy / L; q[i].ny = dx / L; q[i].a = Math.atan2(dy, dx); }
  return { q, L: s };
})();
/* the point at arc length s along the chute */
function chAt(s) {
  const q = CH.q; s = clamp(s, 0, CH.L); let i = 1; while (i < q.length - 1 && q[i].s < s) i++;
  const a = q[i - 1], b = q[i], u = (s - a.s) / Math.max(1e-6, b.s - a.s);
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), a: lerp(a.a, b.a, u), nx: lerp(a.nx, b.nx, u), ny: lerp(a.ny, b.ny, u) };
}
const HATCH_T = 7.72;                                   /* the hatch starts to open (dust), the chute unrolls from 7.95 */
const hatchK = lt => so(lt, HATCH_T, HATCH_T + .5);
const unrollK = lt => easeIO(seg(lt, 7.95, 8.95));
function chuteStroke(n, w, col) {
  const q = CH.q; ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); for (let i = 1; i <= n; i++) ctx.lineTo(q[i].x, q[i].y);
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
}
/* the hatch in the conference room's ceiling: a trapdoor leaf swinging down, a dark opening, a lamp of light from the Dining Room above */
function hatchDraw(lt, st) {
  const k = hatchK(lt); if (k <= 0 && lt > 8) return;
  const r = RM('conf'), x0 = 320, x1 = 398, yC = r.y0 + 14;
  ctx.save();
  /* the opening, dark, with a glow from the room above */
  ctx.fillStyle = '#1a1022'; ctx.beginPath(); ctx.roundRect(x0, yC - 4, x1 - x0, 12, 2); ctx.fill();
  if (k > 0) { const g = ctx.createLinearGradient(0, yC, 0, yC + 70); g.addColorStop(0, `rgba(190,255,200,${.5 * k})`); g.addColorStop(1, 'rgba(190,255,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 + 6, yC + 6); ctx.lineTo(x1 - 6, yC + 6); ctx.lineTo(x1 + 20, yC + 80); ctx.lineTo(x0 - 20, yC + 80); ctx.closePath(); ctx.fill(); }
  /* the leaf: hinged at its left edge, it swings down to hang by the hinge */
  const ang = lerp(0, 1.45, easeBack(k)), L = x1 - x0;
  ctx.translate(x0, yC + 2); ctx.rotate(ang);
  ctx.fillStyle = '#9a6a3c'; ctx.strokeStyle = 'rgba(30,18,10,.85)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.roundRect(0, -3, L, 9, 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,170,.4)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(L - 4, -1); ctx.stroke();
  ctx.fillStyle = '#d9b34a'; ctx.beginPath(); ctx.arc(L - 8, 1, 2.4, 0, TAU); ctx.fill();
  ctx.restore();
  /* a pinch of dust when it opens */
  if (lt > HATCH_T && lt < HATCH_T + 1.6) puffs(lt, HATCH_T + .05, 8, 91, 40, { x0: x0 - 10, x1: x1 + 10, y0: yC + 14, dy: 10, out: 20, up: 30, r: 10, life: 1.4, alpha: .4 });
}
/* the chute itself, unrolling from the hatch: a trough of green fabric with ribs; the leading end is a curl */
function chuteDraw(lt) {
  const u = unrollK(lt); if (u <= 0) return;
  const q = CH.q, nMax = q.length - 1, ext = u * CH.L;
  let n = 1; while (n < nMax && q[n].s < ext) n++;
  const tip = chAt(ext), wob = (1 - u) * 6 * Math.sin(lt * 18);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  /* the collar on the Dining Room floor and a flange at the ceiling */
  ctx.save(); ctx.globalAlpha *= clamp(u * 8); ctx.fillStyle = '#3a8a52'; ctx.strokeStyle = '#173d26'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(CH_PTS[0][0] - 40, 238, 80, 12, 4); ctx.fill(); ctx.stroke(); ctx.restore();
  /* body: outline, rim, interior, highlight (clip the last segment to the tip) */
  ctx.save(); ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); for (let i = 1; i < n; i++) ctx.lineTo(q[i].x, q[i].y); ctx.lineTo(tip.x, tip.y);
  const stroke = (w, col) => { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); };
  stroke(70, '#143822'); stroke(63, '#2a7f48'); stroke(46, '#56c27c'); stroke(30, '#7ad79a'); stroke(12, 'rgba(210,255,225,.55)');
  ctx.restore();
  /* the ribs */
  ctx.strokeStyle = 'rgba(20,70,40,.45)'; ctx.lineWidth = 2.4;
  for (let s = 14; s < ext - 4; s += 22) { const p = chAt(s); ctx.beginPath(); ctx.moveTo(p.x - p.nx * 28, p.y - p.ny * 28); ctx.lineTo(p.x + p.nx * 28, p.y + p.ny * 28); ctx.stroke(); }
  /* a light stripe down one side */
  ctx.beginPath(); for (let s = 0; s <= ext; s += 10) { const p = chAt(s); const X = p.x - p.nx * 14, Y = p.y - p.ny * 14; if (s) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.stroke();
  /* the curl at the leading end while it is still unrolling */
  if (u < .995) { const cx = tip.x + tip.tx * 0 + wob, cy = tip.y; ctx.fillStyle = '#2f8b4f'; ctx.strokeStyle = '#143822'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#86e0a2'; ctx.lineWidth = 3; ctx.beginPath(); for (let a = 0; a < 9; a += .3) { const r = 3 + a * 2.3; ctx.lineTo(cx + Math.cos(a + lt * 6) * r, cy + Math.sin(a + lt * 6) * r); } ctx.stroke(); }
  else { /* the mouth: a flared lip on the floor */
    const e = q[nMax]; ctx.fillStyle = '#2f8b4f'; ctx.strokeStyle = '#143822'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x + 4, e.y, 8, 35, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#56c27c'; ctx.beginPath(); ctx.ellipse(e.x + 4, e.y, 4.5, 25, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ================================================================================================ act 1 (9.12 to 19.75): the greeting in the conference room: Broccoli rides the chute, Melon welcomes him, pizza against salad, Tomato steps between, Lemon asks
const FLOOR = 656;
/* keyframes [[t, v], ...] eased between (a value holds before the first and after the last) */
function kf(t, pts) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], easeIO(seg(t, pts[i - 1][0], pts[i][0])));
  return pts[pts.length - 1][1];
}
const yawTo = (dx, mx) => V2C.yawToward(dx, { max: mx ?? .62 });
/* the ride: the bowl enters the chute at the hatch (9.20) and leaves its mouth at 9.92; he coasts out and stops */
const RIDE0 = 9.2, RIDE1 = 9.92;
const S_HATCH = (() => { let s = 0; for (const p of CH.q) { if (p.y >= 366) { s = p.s; break; } } return s; })();
function brocRide(lt) {
  if (lt < RIDE0) return null;
  const e = CH.q[CH.q.length - 1];
  if (lt < RIDE1) { const u = seg(lt, RIDE0, RIDE1), s = lerp(S_HATCH, CH.L, Math.pow(u, 1.5)), p = chAt(s); return { x: p.x, y: p.y + 30, riding: true, a: p.a, u }; }
  const k = so(lt, RIDE1, RIDE1 + .5);
  return { x: e.x - 18 + 26 * k, y: FLOOR, riding: false, a: 0, u: 1 };
}
/* a big wooden salad bowl used as a sled: upright, a heap of leaves on top */
function saladSled(x, y, rot, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(20,50,30,.35)'; ctx.beginPath(); ctx.ellipse(0, 14, 50, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4fb36a'; for (const [dx, dy, r] of [[-26, -10, 12], [-8, -16, 14], [12, -14, 13], [28, -8, 11], [0, -6, 15]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#7fd68b'; for (const [dx, dy, r] of [[-18, -16, 7], [6, -20, 8], [22, -14, 6]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#c98a4a'; ctx.strokeStyle = '#4a2c14'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-52, -6); ctx.quadraticCurveTo(-46, 22, 0, 24); ctx.quadraticCurveTo(46, 22, 52, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e3b06a'; ctx.beginPath(); ctx.ellipse(0, -6, 52, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,236,190,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-34, 6); ctx.quadraticCurveTo(-24, 17, -8, 19); ctx.stroke();
  ctx.restore();
}
/* positions of the four over the act (conference room x 284..534, floor 656). The handshake is at x 384; Tomato steps in between them and they make room for her. */
const M_X = [[9.12, 306], [10.0, 306], [10.5, 318], [12.9, 318], [13.3, 306], [15.2, 306], [15.8, 296], [20, 296]];
const B_X = [[10.3, 452], [10.7, 452], [13.2, 456], [15.4, 456], [15.9, 480], [20, 480]];
const T_X = [[14.2, 640], [14.9, 520], [15.3, 392], [16.7, 392], [17.2, 392], [20, 392]];
const L_X = [[9.12, 236], [16.2, 236], [16.9, 236], [20, 236]];
const handshakeT = 13.36;
const MS = SS * 1.12;
function melonG(lt) {
  const x = kf(lt, M_X), dx = (lt < 15.3 ? kf(lt, B_X) : kf(lt, T_X)) - x, shaking = lt >= handshakeT && lt < 15.1;
  const box = lt >= 11.55 && lt < 15.9, up = lt >= 11.72 && lt < 12.9 ? so(lt, 11.55, 11.95) : 0;
  const arms = lt < 10.3 ? { l: 'offer', r: 'offer' } : shaking ? { l: 'hold', r: 'reach' } : box ? { l: 'hold', r: 'rest' } : { l: 'rest', r: 'rest' };
  const sq = shaking ? .1 * decayAt(lt, handshakeT, .12) + .05 * Math.max(0, Math.sin((lt - handshakeT) * 16)) * Math.exp(-(lt - handshakeT) / .9) : 0;
  const o = { x, y: FLOOR - 42, s: MS, t: lt, who: 'melon', noLegs: true, noShadow: true, plant: true, yaw: yawTo(dx), expr: lt < 15.2 ? 'happy' : lt < 18.9 ? 'neutral' : 'sour', look: [.5, 0], arms, squash: sq, rot: .012 * hz(lt, .4) + (shaking ? .03 * hz(lt, 3) : 0) };
  if (box) { o.hold = { l: 'pizzabox9' }; o.grip = { l: [-92 - 6 * up, 34 - 80 * up] }; }
  return A9.melon(o);
}
function brocG(lt) {
  const r = brocRide(lt); if (!r) return null;
  const standing = !r.riding && lt >= RIDE1 + .35, hop = !r.riding ? seg(lt, RIDE1 + .15, RIDE1 + .4) * (1 - seg(lt, RIDE1 + .4, RIDE1 + .7)) : 0;
  const x = r.riding ? r.x : (standing ? kf(lt, B_X) : r.x);
  const shaking = lt >= handshakeT && lt < 15.1, dxm = (lt < 15.3 ? kf(lt, M_X) : kf(lt, T_X)) - x;
  const o = { x, y: r.riding ? r.y : FLOOR - 52 * hop, s: SS, t: lt, who: 'broc', yaw: r.riding ? .55 : yawTo(dxm, .62), bowl: !r.riding && lt >= RIDE1 + .45, noLegs: r.riding, expr: lt >= 12.79 && lt < 15.2 ? 'broc_stern' : 'broc_boom', look: [-.4, 0] };
  if (r.riding) { o.arms = { l: 'up', r: 'up' }; o.rot = .12 * Math.sin(lt * 14); o.squash = .05 * Math.sin(lt * 20); }
  else if (shaking) { o.arms = { l: 'hold', r: 'reach' }; o.squash = .08 * decayAt(lt, handshakeT, .15); }
  const sal = lt >= 10.42 && lt < 12.7 ? so(lt, 10.35, 10.7) * (1 - so(lt, 11.9, 12.4)) : 0;
  if (!r.riding && sal > 0) { o.arms = { l: 'hold', r: 'offer' }; o.grip = { l: [lerp(-118, -84, sal), lerp(98, -10, sal)] }; o.bowlTilt = 0; }
  return A15.broccoli(o);
}
function tomG(lt) {
  if (lt < 14.1) return null;
  const x = kf(lt, T_X), walking = lt < 15.3, tS = wordT('t1', 'sauce', 16.0), flipT = lt >= tS ? lt - tS : null;
  /* fruit while she arrives, veg on "sauce", then she cannot decide while Lemon asks (a slow flip back and forth), frozen half and half on "Pending." */
  const ph = lt < 16.8 ? (lt < tS ? 0 : 1) : lt < 18.84 ? (Math.floor((lt - 16.8) / .62) % 2 ? 0 : 1) : .5;
  const o = { x, y: FLOOR + 8, s: SS * 1.04, t: lt, who: 'tom', yaw: yawTo((lt < 16.7 ? kf(lt, M_X) : kf(lt, L_X)) - x, .5), tomPose: ph === .5 ? .5 : ph ? 'veg' : 'fruit' };
  if (walking) { o.gaitW = (600 - x) / o.s; o.axis = 'x'; o.dir = -1; o.vx = -110; o.transit = lt < 14.9; }
  const flips = [tS].concat(lt >= 16.8 && lt < 18.84 ? [16.8 + .62 * Math.floor((lt - 16.8) / .62)] : []);
  const f0 = flips.filter(q => lt >= q && lt - q < .6).pop();
  if (f0 != null) { o.flipT = lt - f0; o.tomFrom = ph ? 'fruit' : 'veg'; }
  if (lt >= 18.84) o.tagSel = .5;
  return A15.tomato(o);
}
function lemonG(lt) {
  const x = kf(lt, L_X), asking = lt >= bs('l0') && lt < be('l0') + .2;
  const tx = kf(lt, T_X), look = lt >= 14.2 ? tx - x : kf(lt, M_X) - x;
  const o = { x, y: FLOOR, s: SS, t: lt, who: 'lemon', yaw: yawTo(look, .5), look: [.4, 0], expr: asking ? 'neutral' : lt < 9.6 ? 'shock' : 'neutral', arms: asking ? { l: 'rest', r: 'hips' } : { l: 'rest', r: 'rest' } };
  if (lt >= 16.2 && lt < 16.95) { o.gaitW = (x - 236) / SS; o.axis = 'x'; o.dir = 1; o.vx = 40; }
  return P(A7.lemon, x, FLOOR, o);
}
/* the coverage: cuts on the lines. y is chosen so the floor sits at py about 1150 (heads clear of the caption zone) */
const SHOT_G = [[9.12, 10.42, 392, 2.3, 2.42], [10.42, 12.79, 392, 2.55, 2.7], [12.79, 15.13, 384, 3.1, 3.3], [15.13, 18.84, 385, 2.15, 2.3]];
function camGreet(lt) {
  for (const [a, b, x, z0, z1] of SHOT_G) if (lt < b) { const z = lerp(z0, z1, seg(lt, a, b)); return { x, y: FLOOR - 190 / z * (z > 2.9 ? 1.1 : 1), z }; }
  /* "Pending.": the close-up on Tomato's face, frozen half and half */
  const tx = kf(lt, T_X), z = lerp(4.0, 4.3, seg(lt, 18.84, 19.75));
  return { x: tx, y: 584 + 10, z };
}
function drawGreet(lt, st) {
  const r = brocRide(lt);
  if (r && r.riding) { drawFaded(brocG(lt)); saladSled(r.x, r.y + 18, 0.12 * Math.sin(lt * 14), 1); }
  else { const b = brocG(lt); if (b) drawFaded(b); }
  drawFaded(lemonG(lt));
  const t = tomG(lt); if (t) drawFaded(t);
  drawFaded(melonG(lt));
}

// ================================================================================================ the second half: dispatch to the acts
const T_STAIRS = 19.75;
const camAt2 = lt => lt < T_STAIRS ? camGreet(lt) : camGreet(T_STAIRS - .01);
const shotOf2 = lt => lt < 10.42 ? 'welcome' : lt < 12.79 ? 'salad' : lt < 15.13 ? 'handshake' : lt < 18.84 ? 'tomato' : lt < T_STAIRS ? 'pending' : 'stairs';
function draw2(lt) {
  const st = stateAt(lt); ST = st; S15.light(st);
  S15.tower(lt, st);
  const m = st.__m;
  hatchDraw(lt, st); chuteDraw(lt);
  drawPropsSim(lt, m, 'rest');
  if (lt < T_STAIRS) drawGreet(lt, st);
  drawPropsSim(lt, m, 'office');
  S15.front(lt, st);
}
function over2(lt) {}
// ================================================================================================ the scene
const SC = {
  shot: lt => shotOf(lt),
  cam(lt) {
    const K = KDBG();
    if (K) { const c = S15.cam(K.view || 'wide', K.st || {}, K.o || {}); zoomTo(c.x, c.y, c.z); CAM.shake = 0; return; }
    const c = camAt(lt); zoomTo(c.x, c.y, c.z); CAM.shake = shakeAt(lt); CAM.r = 0;
  },
  draw(lt) { const K = KDBG(); if (K) { const st = K.st || {}; ST = st; S15.light(st); S15.tower(lt, st); S15.front(lt, st); return; } if (lt >= 9.12) draw2(lt); else draw1(lt); },
  fx: lt => fxAt(lt),
  blur: lt => blurAt(lt),
  over(lt) { if (KDBG()) return; if (lt >= 9.12) over2(lt); else over1(lt); },
};
window.__EP15_SCENES = window.__EP15_SCENES || {};
window.__EP15_SCENES.dock = SC;
SC.__sim = () => simInit();
SC.__state = lt => stateAt(lt);
})();
