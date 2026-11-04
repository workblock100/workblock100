'use strict';
/* SHIFT HAPPENS, Episode 18, scene `marshal`: the DOM-free physics of the extinguisher rampage (builder MARSHAL).
 * window.__EP18_SIMS.marshal = { build, ... } and module.exports = same. World time = scene-local time (the foley tool adds the scene start): the can is held in Lemon's hands until the rampage starts at T0 = 28.457
 * (the `foamhiss` cue); world.at(lt), nozzle(lt). Internally the thrust and steering keys run on sim time ts = lt - T0.
 *
 * The can is one rigid body (a tall box with a head) with a THRUST force along the jet axis, applied at the nozzle point (a per-step impulse scheduled at 240 Hz): large at first (a ramp-in of 0.1 s) and decaying over
 * about 2.6 s as the gas runs out, with a sputter at the end. The jet leaves the nozzle opposite to the thrust. The nozzle sits at the end of a stiff hose that swings (a spring-damper angle `phi`, driven by the can's
 * own turning and recorded each step), so the jet whips; nozzle(te) gives the nozzle position and the spray direction at any time. Lemon aims at the base of the fire (down and to the left); the recoil throws the can
 * up and back over her shoulder to the right: the linen cart (which jolts at the cue), the ceiling, the easel (the cardboard fire is knocked flat), and back along the floor to the Marshal, where the last sputter lands.
 * Bodies: floor, end walls, ceiling (static), the cart (dynamic, heavy, rolls a little), the easel (dynamic, topples), the can. The sim has no characters: the Marshal's x is a layout constant the path is fitted to.
 * Deterministic (no Math.random, no clock; PHYS2D's own sine/cosine). The scene samples world.at(lt - T0) and nozzle(te); it never steps.
 * Layout numbers (world px; the corridor floor is y 1150): see L. */
(function () {
const P = (typeof module === 'object' && module.exports) ? require('./phys2d.js') : (typeof window !== 'undefined' ? window.PHYS2D : null);
const sin = P.sin, cos = P.cos;

const T0 = 28.457;                  /* scene-local time of the discharge (the foamhiss cue) */
const L = {
  floor: 1150, ceil: 130, xl: -240, xr: 2420,
  lemonX: 1250,                      /* Lemon's feet (she faces left) */
  marshalX: 420,                     /* the Marshal's feet */
  easelX: 773.6,                       /* the easel's centre (feet) */
  cartX: 1581.8, cartW: 176, cartH: 330,
  can: { hw: 36, hh: 84, oy: 18, headHW: 28, headHH: 16, headY: -82 },   /* body half extents and offsets (local, y down); the can's origin is the centre of the body box */
};
/* default free parameters (the fitted values are written in by the search harness) */
const DEF = {
  startX: 1168, startY: 948, startAng: 0.4822785185086541,   /* the can in Lemon's hands (centre); angle clockwise from upright */
  nozX: -26, nozY: -100,                        /* the hose attachment on the can (local, y down) */
  hose: 64,                                     /* hose length: the nozzle tip sits this far from the attachment along the jet */
  steer: [[0, 51.02511651813984], [0.36, 25], [0.4804105631406419, 53.14379918528721], [0.7017487066917121, 96.8383003540337], [1.0183215421065688, 129.82740022279322], [1.1094093681743835, 150.93943967721427], [1.45, 170], [1.8, 165], [2.05, 175], [2.3, 175], [2.8, 170]],   /* thrust heading in degrees (ccw from +x, up positive) at sim time t: up and right to the cart, up and over Lemon, left and down to the easel (fitted by build/ep18_marshal/search.js; keep every digit: the end of the path is chaotic) */
  thrust: 4800,                                 /* peak acceleration (px/s^2) at mass 1 */
  burn: 2.62, expo: 1.229295354168862, ramp: .09,
  lever: 0, wob: .8, wobHz: 1.7, wobPh: 0,        /* perpendicular offset of the thrust line from the can's centre of mass (px), and its slow wobble */
  whip: 0.11408711921074428,                                    /* wobble of the jet direction (rad) */
  alignK: 39.09827332571149, alignC: 8.88740402525291,                        /* stability torque */
  homeT0: 1.4428639723602685, homeT1: 1.918652337177191, wx: 500, wy: 1090.0545821762178,   /* after the easel the can homes in on the Marshal's feet */
  aimT0: 2.1831696450477467, aimT1: 2.34, faceX: 440, faceY: 975,   /* the last sputter swings round onto the Marshal's face */
  lin: .9, ang: .8,                             /* damping */
  rest: 0.6, fric: 0.49002133920858604,                          /* can restitution and friction */
  w0: 0, vx0: 0, vy0: 0,
  g: 2100, cartMass: 14, easelMass: 2.380041309501976, cartX: 1581.82877457235, easelX: 773.5558622041717, easelHold: .05,
  sput: .6,                                     /* depth of the end sputter */
};

function fexp(x) { let y = 1 + x / 1024; for (let i = 0; i < 10; i++) y *= y; return y; }
function fpow(b, e) { return b <= 0 ? 0 : fexp(e * Math.log(b)); }

function build(opts) {
  opts = opts || {};
  const p = Object.assign({}, DEF, opts.prm || {});
  const W = P.world({ gravity: [0, p.g], seed: 18, dt: 1 / 240, materials: { tile: { density: 1, friction: .5, restitution: .15 } }, feel: { bounce: 1.1, soft: 0 } });
  const meta = { ids: {}, L, p, T0 };
  const FL = L.floor;

  /* ---- the building: floor, ceiling, end walls */
  W.floor(FL, { x: 600, halfWidth: 3200, mat: 'concrete', tag: 'floor', friction: .55, restitution: .1 });
  W.body({ type: 'static', x: 600, y: L.ceil - 100, box: [3200, 100], mat: 'concrete', tag: 'ceiling', friction: .3, restitution: .25 });
  W.body({ type: 'static', x: L.xl - 100, y: 600, box: [100, 1400], mat: 'concrete', tag: 'wall', friction: .3, restitution: .3 });
  W.body({ type: 'static', x: L.xr + 100, y: 600, box: [100, 1400], mat: 'concrete', tag: 'wall', friction: .3, restitution: .3 });

  /* ---- the linen cart: a heavy base and a lighter bag on a frame, on casters (it jolts and rolls a few px) */
  const cx0 = p.cartX != null ? p.cartX : L.cartX, cy0 = FL - L.cartH / 2;
  const cart = W.body({ type: 'dynamic', x: cx0, y: cy0, shapes: [
    { box: [L.cartW / 2, 20], offset: [0, L.cartH / 2 - 20], mat: 'metal', density: 3, friction: .35, restitution: .15 },
    { box: [L.cartW / 2 - 4, L.cartH / 2 - 34], offset: [0, -12], mat: 'fabric', density: .55, friction: .35, restitution: .12 },
  ], mass: p.cartMass, tag: 'cart', mat: 'metal', linearDamping: 3.2, angularDamping: 3, friction: .35 });
  meta.ids.cart = cart.id;

  /* ---- the easel: an A-frame stand with a cardboard board; origin at the feet, body centre handled by PHYS2D */
  const ex0 = p.easelX != null ? p.easelX : L.easelX;
  const easel = W.body({ type: 'dynamic', x: ex0, y: FL, shapes: [
    { box: [104, 120], offset: [0, -216], mat: 'cardboard', density: .22, friction: .5, restitution: .1 },
    { poly: [[-70, 0], [-26, -96], [26, -96], [70, 0]], mat: 'wood', density: .9, friction: .6, restitution: .1 },
  ], mass: p.easelMass, tag: 'easel', mat: 'cardboard', linearDamping: .2, angularDamping: .3, category: 4 });
  meta.ids.easel = easel.id;

  /* ---- the can */
  const C = L.can;
  const can = W.body({ type: 'dynamic', x: p.startX, y: p.startY, angle: p.startAng, vx: p.vx0, vy: p.vy0, w: p.w0, shapes: [
    { box: [C.hw, C.hh], offset: [0, C.oy], mat: 'metal', restitution: p.rest, friction: p.fric },
    { box: [C.headHW, C.headHH], offset: [0, C.headY], mat: 'metal', restitution: p.rest, friction: p.fric },
  ], mass: 1, tag: 'can', mat: 'metal', linearDamping: p.lin, angularDamping: p.ang, allowSleep: true, category: 2 });
  meta.ids.can = can.id;
  /* Lemon holds it until the thrust takes it: a soft pull to the start point for the first moments */
  can.gscale = 0;
  const grip = W.body({ type: 'static', x: p.startX, y: p.startY, box: [4, 4], mask: 0, silent: true, tag: 'grip' });
  const hold = W.joint({ type: 'weld', a: grip, b: can, anchor: [p.startX, p.startY], hz: 7, ratio: 1 });
  W.schedule(T0, w => { can.gscale = 1; });
  W.schedule(T0 + .11, w => w.removeJoint(hold));

  /* ---- thrust and the hose (a per-step impulse, 240 Hz, from t = 0 to the end of the burn). The jet direction is a designed, keyed heading (the hose end whips wherever it likes: Lemon's aim at the base of the fire,
   * then up the cart, along the ceiling, down on the easel, and in the last second round onto the Marshal's face); the force acts opposite to the jet, on a line `lever` px beside the can's centre of mass; a stability torque
   * (fading with the gas) turns the can's head toward its flight; collisions still spin it. */
  const HZ = 240, DT = 1 / HZ, NS = Math.ceil((p.burn + .8) * HZ);
  const jetA = new Float32Array(NS + 2), thrA = new Float32Array(NS + 2);
  const steer = p.steer;
  function heading(t) {   /* thrust heading in radians, counter-clockwise from +x with up positive (keys in degrees), smooth */
    if (t <= steer[0][0]) return steer[0][1] * D2R;
    for (let i = 1; i < steer.length; i++) if (t < steer[i][0]) { const a = steer[i - 1], b = steer[i], k = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))), e = k * k * (3 - 2 * k); return (a[1] + (b[1] - a[1]) * e) * D2R; }
    return steer[steer.length - 1][1] * D2R;
  }
  const D2R = Math.PI / 180;
  function thrustAt(t) {
    if (t < 0 || t >= p.burn) return 0;
    const u = t / p.burn, env = fpow(1 - u, p.expo) * Math.min(1, t / p.ramp);
    let s = 1;
    if (u > .72) { const k = (u - .72) / .28; s = 1 - p.sput * k * (.5 + .5 * sin(t * 61)) * (.6 + .4 * sin(t * 23 + 1)); }   /* the gas coughs at the end */
    return p.thrust * env * s;
  }
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  /* the thrust heading (radians, ccw from +x, up positive) at time t for a can at (cx, cy): the keyed path, then from homeT0 on a pull toward the waypoint by the Marshal (the can homes in on him) */
  function headingNow(t, cx, cy) {
    let h = heading(t);
    if (t > p.homeT0) {
      const k = Math.min(1, (t - p.homeT0) / (p.homeT1 - p.homeT0)), e = k * k * (3 - 2 * k), hw = Math.atan2(-(p.wy - cy), p.wx - cx);
      h += wrap(hw - h) * e;
    }
    return h;
  }
  function jetAngle(t, hx, hy, h) {   /* canvas angle of the jet at time t; hx, hy = the hose attachment (world) for the closed-loop aim at the end; h = the thrust heading */
    let ang = Math.atan2(sin(h), -cos(h));                    /* thrust (cos h, -sin h) -> jet (-cos h, sin h) in canvas coordinates */
    const env = Math.max(0, 1 - t / p.burn);
    ang += p.whip * (.6 * sin(t * 37) + .4 * sin(t * 23 + 1.3)) * Math.min(1, t / .25) * (.4 + .6 * env);
    if (t > p.aimT0) {
      const k = Math.min(1, (t - p.aimT0) / (p.aimT1 - p.aimT0)), e = k * k * (3 - 2 * k);
      const aim = Math.atan2(p.faceY - hy, p.faceX - hx);
      ang += wrap(aim - ang) * e;
    }
    return ang;
  }
  const att = (b) => { const a = b.a, ca = cos(a), sa = sin(a); return [b.cx + (p.nozX - b.lcx) * ca - (p.nozY - b.lcy) * sa, b.cy + (p.nozX - b.lcx) * sa + (p.nozY - b.lcy) * ca]; };
  /* the easel is knocked backwards (out of the picture plane): after the first touch it stops meeting the can, so the can flies on and the easel finishes falling alone (its in-plane angle is the scene's fall angle) */
  let tTouch = -1;
  const touching = () => { const cs = W.contacts; for (let i = 0; i < cs.length; i++) { const c = cs[i]; if (c.count > 0 && ((c.A === can && c.B === easel) || (c.A === easel && c.B === can))) return true; } return false; };
  for (let i = 0; i < NS; i++) {
    const t = i * DT;
    W.schedule(T0 + t, w => {
      if (tTouch < 0) { if (touching()) { tTouch = t; meta.tEasel = t + T0; } } else if (t > tTouch + p.easelHold && easel.mask !== 1) {
        easel.mask = 1;
        const cs = W.contacts;          /* drop the live can/easel contact too (a mask is only read when a contact is created) */
        for (let k = cs.length - 1; k >= 0; k--) { const c = cs[k]; if ((c.A === can && c.B === easel) || (c.A === easel && c.B === can)) { W._cmap.delete(c.key); W._pool.push(c); cs.splice(k, 1); } }
        can.wake(); easel.wake();
      }
      const [hx, hy] = att(can), hd = headingNow(t, can.cx, can.cy), a = jetAngle(t, hx, hy, hd), T = thrustAt(t);
      jetA[i] = a; thrA[i] = T;
      if (T > 0) {
        const lv = p.lever * (1 + p.wob * sin(t * p.wobHz * 6.2831853 + p.wobPh)), dx = cos(a), dy = sin(a);
        can.applyImpulse(-dx * T * DT, -dy * T * DT, can.cx - dy * lv, can.cy + dx * lv);
        /* stability torque: the head turns toward the thrust direction (the can flies head first), fading with the gas */
        const want = -hd + Math.PI / 2, err = wrap(want - can.a), env = T / p.thrust;
        can.w += (p.alignK * err * env - p.alignC * can.w * env) * DT;
      }
    });
  }
  W.warmup(.05);
  W.run(T0 + (opts.T || 7.5), { sampleHz: 120 });
  const jetAt = t => { const f = Math.max(0, Math.min(NS - 1, t * HZ)), i = Math.floor(f), u = f - i, a0 = jetA[i], a1 = jetA[i + 1]; return a0 + wrap(a1 - a0) * u; };
  const tmp = { x: 0, y: 0, ang: 0 };
  /* the nozzle pose at sim time ts: position of the nozzle tip, spray direction (the jet, canvas angle), the hose attachment point (head), and the thrust (px/s^2) */
  function nozzleSim(ts, out) {
    out = out || tmp;
    const s = W.at(Math.max(0, ts) + T0).by[can.id], a0 = s.angle, ca = cos(a0), sa = sin(a0);
    const ax = s.x + p.nozX * ca - p.nozY * sa, ay = s.y + p.nozX * sa + p.nozY * ca, a = jetAt(Math.max(0, ts));
    out.ax = ax; out.ay = ay; out.ang = a; out.x = ax + cos(a) * p.hose; out.y = ay + sin(a) * p.hose;
    out.thrust = thrA[Math.max(0, Math.min(NS, Math.round(ts * HZ)))] || 0; out.canAng = a0; out.cx = s.x; out.cy = s.y;
    return out;
  }
  const nozzle = (lt, out) => nozzleSim(lt - T0, out);   /* the nozzle at SCENE-LOCAL time lt */
  return { world: W, T: T0 + (opts.T || 7.5), runT: W.T, screen: { w: 1080, h: 1920, cx: 540, cam: { x: 1000, y: 800, z: .6 } }, sceneStart: 38.717, meta, T0, L, nozzle, nozzleSim, jetAt, thrustAt, prm: p };
}
const api = { build, T0, L, DEF };
if (typeof module === 'object' && module.exports) module.exports = api;
if (typeof window !== 'undefined') { window.__EP18_SIMS = window.__EP18_SIMS || {}; window.__EP18_SIMS.marshal = api; }
})();
