'use strict';
/* SHIFT HAPPENS, Episode 18, scene `alarm`: the DOM-free door timeline and the cart bonk (owner: ALARM). window.__EP18_SIMS.alarm = { build, consts } and module.exports = the same.
 * The picture (ep18_alarm.js) and the sound (tools_door_events.js -> build/ep18/door_events.json) read THIS table, so the slam you see is the slam you hear.
 * It is plain analytic motion (no solver): everything is a pure function of the scene-local time t, deterministic, no Math.random, no clock.
 *
 * The corridor (units are the sprites' pixels at scale 1: a person is about 400 tall): the walls are at X = +-HW, the camera looks down +Z. Six double fire doors stand across it at Z = ZH[i]. A leaf is hinged on the
 * side wall at Z = ZH and, held open, lies flat along the wall AWAY from the camera (its free end at ZH + HW); it swings shut toward the middle, the free end sweeping back toward the camera until the two leaves meet at X = 0.
 * closure c: 0 = open against the wall, 1 = shut. Index i is the CLOSING ORDER: door 0 is the farthest (it closes first), door 5 the nearest (it meets the linen cart).
 *
 * Timeline (scene-local seconds): the holder LEDs turn red one after another far to near from 1.70 s (the PA says "Code Red"); each door lets go 0.3 s after its LED and CREEPS (a few degrees, ease in and out);
 * the SWEEP is the last 0.85 s before the slam (accelerating, c ~ v^2.2); the slam (the doorslam sound) is at SLAM[i] = 9.80, 10.40, 11.00, 11.60, 12.20; each rebounds off its frame (damped hops) and latches 0.24 s later.
 * Door 5 sweeps from 12.15 and meets the linen cart's wheels at 13.006 (the script's doorbonk cue): it stops at c = CB, kicks back to 0.43 and rests against the cart (the closer leans on it) until Mango yanks the cart
 * clear at 14.75..15.10; then it sweeps shut and slams at 15.20 (on the end of Onion's "alarm."). hornstate: after each real slam, the number of doors shut: 1..5 at the cascade, 6 at 15.20.
 */
(function () {
const HW = 440, ZH = [5600, 4600, 3750, 3050, 2400, 1750], ZEND = 8000, CAMZ = -900, SCENE_START = 77.479;
const SLAM = [9.80, 10.40, 11.00, 11.60, 12.20, 15.20];
const T_HIT = 13.006, CB = .64, T_PULL0 = 14.75, T_PULL1 = 15.10, T_REL = 14.95;
const C0 = [.18, .19, .20, .21, .22, .12], AMP = [.16, .15, .14, .13, .12, .10], SWEEP = .85;
const T_LED = [0, 1, 2, 3, 4, 5].map(i => 1.70 + .2 * i), T_START = T_LED.map(t => t + .3);
/* the cart: Mango pushes it down the corridor into the doorway from 11.75; the leaves catch its far corners; the bundle of linen is flung off */
const CART0 = { x: 240, z: 1330 }, CART_HIT = { x: 0, z: ZH[5] + 90 }, CART_HW = 120, CART_HD = 115, T_PUSH = 11.75, T_BACK = 330;
const G = 1500;

const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
const ss = k => { k = c01(k); return k * k * (3 - 2 * k); };
const fexp = x => { let y = 1 + x / 1024; for (let i = 0; i < 10; i++) y *= y; return y; };   /* exp() by squaring: the same in every engine */
const fsin = x => { x = x - 2 * Math.PI * Math.floor(x / (2 * Math.PI) + .5); const x2 = x * x; return x * (1 - x2 / 6 * (1 - x2 / 20 * (1 - x2 / 42 * (1 - x2 / 72 * (1 - x2 / 110))))); };
const hop = (x, amp, tau, per) => x <= 0 ? 0 : amp * fexp(-x / tau) * Math.abs(fsin(Math.PI * x / per));       /* |sin| bounces: 0 at the impact, up to the peak, back to 0 */

/* the closure of door i at scene time t */
function closure(i, t) {
  const ts = T_START[i], c0 = C0[i];
  if (i < 5) {
    const tl = SLAM[i], tsw = tl - SWEEP;
    if (t < ts) return 0;
    if (t < tsw) return c0 * ss((t - ts) / (tsw - ts));
    if (t < tl) return c0 + (1 - c0) * Math.pow((t - tsw) / SWEEP, 2.2);
    return 1 - hop(t - tl, AMP[i], .11, .26);
  }
  /* door 5: creeps, sweeps into the cart, kicks back off the wheels, rests on them, then (the cart gone) sweeps shut */
  const tsw = T_HIT - SWEEP;
  if (t < ts) return 0;
  if (t < tsw) return c0 * ss((t - ts) / (tsw - ts));
  if (t < T_HIT) return c0 + (CB - c0) * Math.pow((t - tsw) / SWEEP, 2.2);
  if (t < T_REL) { const x = t - T_HIT; return CB - hop(x, .20, .22, .52) + .004 * fsin(x * 9) * c01(x / .6); }
  if (t < SLAM[5]) { const v = (t - T_REL) / (SLAM[5] - T_REL); return CB + (1 - CB) * Math.pow(v, 2.0); }
  return 1 - hop(t - SLAM[5], AMP[5], .12, .30);
}
/* the holder LED of door i: 0 = green (held), 1 = red (released) */
const holderRed = (i, t) => t >= T_LED[i] ? 1 : 0;

/* the linen cart: its footprint centre on the floor (x, z), a roll (radians, the leaves hit one after the other) and a hop (px) */
function cart(t) {
  let x = CART0.x, z = CART0.z, roll = 0, up = 0;
  if (t >= T_PUSH) { const v = c01((t - T_PUSH) / (T_HIT - T_PUSH)), e = v * v; x = CART0.x + (CART_HIT.x - CART0.x) * ss(v * 1.05); z = CART0.z + (CART_HIT.z - CART0.z) * e; }
  if (t >= T_HIT) {
    const q = t - T_HIT;
    x = CART_HIT.x; z = CART_HIT.z;
    roll = .075 * fexp(-q / .34) * fsin(q * 2 * Math.PI / .42); up = hop(q, 16, .16, .34);
    if (t >= T_PULL0) { const v = c01((t - T_PULL0) / (T_PULL1 - T_PULL0)); z = CART_HIT.z - T_BACK * (1 - (1 - v) * (1 - v)); const q2 = t - T_PULL0; roll += .04 * fexp(-q2 / .3) * fsin(q2 * 2 * Math.PI / .38); }
  }
  return { x, z, roll, up };
}
/* the bundle of linen: rides on top of the cart, then at the bonk it is thrown up and toward the camera and the left, tumbles, lands and bounces once */
const LINEN0 = { dy: 262 }, LV = { vx: -130, vz: -190, vy: 640, spin: -5.6 }, LAND_Y = 0;
function linen(t) {
  if (t < T_HIT) { const c = cart(t); return { x: c.x, z: c.z, y: LINEN0.dy, rot: 0, free: false, onCart: true }; }
  const c0 = cart(T_HIT), q = t - T_HIT;
  let x = c0.x + LV.vx * q, z = c0.z + LV.vz * q, y = LINEN0.dy + LV.vy * q - .5 * G * q * q, rot = LV.spin * q;
  const tg = (LV.vy + Math.sqrt(LV.vy * LV.vy + 2 * G * LINEN0.dy)) / G;       /* when it first reaches the floor */
  if (q > tg) {
    const vy1 = (-(LV.vy - G * tg)) * .24, r = q - tg, tb = 2 * vy1 / G;        /* one soft bounce */
    x = c0.x + LV.vx * Math.min(q, tg + tb) * .82; z = c0.z + LV.vz * Math.min(q, tg + tb) * .82;
    y = r < tb ? vy1 * r - .5 * G * r * r : 0; rot = LV.spin * tg + (r < tb ? -2 * r : -2 * tb);
  }
  return { x, z, y: Math.max(0, y), rot, free: true, onCart: false, landed: q > tg };
}

/* the table of sounds: what the picture shows is what the sound builder hears (absolute seconds = scene start + scene-local) */
function events(sceneStart) {
  const S = sceneStart == null ? SCENE_START : sceneStart, out = [];
  const depthOf = i => (ZH[i] - CAMZ) / (ZEND - CAMZ), gainOf = d => +(1 - .75 * (d - .2)).toFixed(3);
  let closed = 0;
  for (let i = 0; i < 6; i++) {
    const tl = SLAM[i], d = depthOf(i), pan = i % 2 ? .08 : -.08;
    if (i === 5) out.push({ t: S + T_HIT, name: 'doorbonk', door: 5, depth: +d.toFixed(3), pan: .2, gain: .7 });
    out.push({ t: S + tl, name: 'doorslam', door: i, depth: +d.toFixed(3), pan: i === 5 ? 0 : pan, gain: Math.min(1, gainOf(d)) });
    closed++;
    out.push({ t: S + tl, name: 'hornstate', closed });
    out.push({ t: S + tl + .24, name: 'doorlatch', door: i, depth: +d.toFixed(3), pan: i === 5 ? 0 : pan, gain: +(Math.min(1, gainOf(d)) * .35).toFixed(3) });
  }
  const rank = { doorbonk: 0, doorslam: 1, hornstate: 2, doorlatch: 3 };
  return out.map(e => Object.assign({}, e, { t: +e.t.toFixed(3) })).sort((a, b) => a.t - b.t || rank[a.name] - rank[b.name]);
}
function build() {
  return { CART_HW, CART_HD, HW, ZH, ZEND, CAMZ, SLAM, T_LED, T_START, T_HIT, CB, T_PULL0, T_PULL1, T_REL, T_PUSH, CART0, CART_HIT, closure, holderRed, cart, linen, events, sceneStart: SCENE_START };
}
const api = { build, consts: { CART_HW, CART_HD, HW, ZH, ZEND, CAMZ, SLAM, T_LED, T_START, T_HIT, CB, T_PULL0, T_PULL1, T_REL, T_PUSH, CART0, CART_HIT, SCENE_START } };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP18_SIMS = window.__EP18_SIMS || {}; window.__EP18_SIMS.alarm = api; }
})();
