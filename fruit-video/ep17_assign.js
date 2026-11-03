'use strict';
/* SHIFT HAPPENS, Episode 17: "The Module". Scene module: assign (9:15 PM, THE ASSIGNMENT, 13.87 s). Builder E1617-VIDEO. Registers window.__EP17_SCENES.assign.
 *
 * The nurses' station at night (the Episode 15 tower, S15, sunk one floor with the Executive Suite on top; the station room lit by its own lamps). Tomato (HR, headset) stands behind the counter with a
 * tablet that holds the assignment (a learning-platform card: MODULE 7 OF 7, HOW TO TAKE A BREAK SAFELY, 4:00:00, DUE BEFORE CLOCK-OUT). Mango, Lemon and Strawberry stand in front of the counter,
 * three-quarter views. Binder pops out of the tablet, offers help, "No thanks" runs away from Strawberry's pointer, "Great! I'll help.", the DUE 11:00 PM chip stamps onto the card.
 *
 * Shots (scene-local seconds, see SHOTS below): wide push-in (0-1.1) / Tomato (1.1-3.1) / Mango (3.1-3.9) / tablet card insert, 4:00:00 (3.9-4.9) / Lemon + the call light glance (4.9-7.0) /
 * Tomato "Efficiency." (7.0-7.85) / Binder out of the tablet + the bubble (7.85-9.88) / Strawberry "No." + the pointer chase (9.88-10.42) / Binder grin (10.42-11.42) / the card, the DUE chip (11.42-12.9) / wide.
 */
(() => {
if (!window.TIMELINE_EP17 || !window.S15 || !window.H6 || !window.SH15 || !window.A15 || !window.UI) return;
const { zoomTo, faceC } = window.H6;
const S15 = window.S15, SH15 = window.SH15, A15 = window.A15, A7 = window.A7, A11 = window.A11;
const PI = Math.PI;

// ------------------------------------------------------------------ the timeline (frozen) and small helpers
const TLX = window.TIMELINE_EP17, SCN = TLX.scenes.find(s => s.id === 'assign'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'assign') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const rgba = (c, a = 1) => V2.rgba(c, a);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const snapT = t => Math.round((START + t) * 30) / 30 - START;
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
const K = (a, lt) => key(a, lt, easeIO);
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
/* the sound cues (scene-local seconds; python3 /tmp/shift_tools/cues.py 17 assign), snapped to the video frame nearest each */
const CUE = { click: .5, binderpop: 7.845, grin: 10.974, sting: 13.017 };
for (const k in CUE) CUE[k] = snapT(CUE[k]);

// ------------------------------------------------------------------ the tower's state: night, sunk one floor, the Executive Suite on top; the station lit by its own lamps
let STATE = null;
const R = id => S15.rect(id, STATE);
function ST(lt) { return { exec: 1, sink: 1, tod: 1, t: lt, signs: { 'door:rest': 'PENDING ROOM' }, rooms: { station: { lamp: 1 }, rest: { lamp: .7 }, lobby: { lamp: .8 }, dining: { lamp: .6 } } }; }

// ------------------------------------------------------------------ the tablet (a prop in Tomato's hand): a black slab with a lit screen that shows a miniature of the card (no lettering in the sprite)
const TW = 74, TH = 98;
EXT.prop.fp17_tablet = (side, o, t) => {
  const S = o.tabScale || 1, w = TW * S, h = TH * S, at = o.tabAt || [.5, .62], lit = o.tabLit ?? 1;
  ctx.save(); ctx.rotate(o.tabRot ?? -.04); ctx.translate(-w * at[0], -h * at[1]);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8 * S; ctx.shadowOffsetY = 3 * S;
  ctx.fillStyle = '#17181d'; ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.lineWidth = 2.6 * S; rr(0, 0, w, h, 7 * S); ctx.fill(); ctx.stroke(); ctx.shadowColor = 'transparent';
  const sx = 5 * S, sy = 6 * S, sw = w - 10 * S, sh = h - 12 * S;
  ctx.fillStyle = lit > .02 ? '#f2fbf6' : '#0e1014'; rr(sx, sy, sw, sh, 3 * S); ctx.fill();
  if (lit > .02) {
    ctx.save(); rr(sx, sy, sw, sh, 3 * S); ctx.clip(); ctx.globalAlpha *= lit;
    ctx.fillStyle = '#1e8e5a'; ctx.fillRect(sx, sy, sw, sh * .15);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(sx + sw * .1, sy + sh * .055, sw * .36, sh * .04);
    ctx.fillStyle = '#103a2c'; ctx.fillRect(sx + sw * .1, sy + sh * .26, sw * .8, sh * .07); ctx.fillRect(sx + sw * .1, sy + sh * .36, sw * .6, sh * .05);
    ctx.fillStyle = '#1e8e5a'; ctx.fillRect(sx + sw * .1, sy + sh * .52, sw * .8, sh * .16);
    ctx.fillStyle = 'rgba(40,60,80,.3)'; ctx.fillRect(sx + sw * .1, sy + sh * .76, sw * .7, sh * .035); ctx.fillRect(sx + sw * .1, sy + sh * .83, sw * .5, sh * .035);
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * .6, sy); ctx.lineTo(sx, sy + sh * .5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};
PROP_BOX.fp17_tablet = o => { const S = o.tabScale || 1, w = TW * S, h = TH * S, at = o.tabAt || [.5, .62]; return [-w * at[0] - 4, -h * at[1] - 6, w * (1 - at[0]) + 8, h * (1 - at[1]) + 4]; };
/* where the tablet's screen is, in world coordinates, for the glow and Binder's pop (Tomato's left hand, from her options) */

// ------------------------------------------------------------------ the cast: where they stand and what they do (a pure function of scene time)
function cast(lt, st) {
  const who = (room, ctor, u, extra, dy = 0) => { const [x, y] = S15.at(room, u, dy, st); return ctor(Object.assign({ x, y, s: S15.S, t: lt }, extra)); };
  const C = {};
  const sp = id => lt >= bS(id) && lt < bE(id);
  C.tom = who('station', A15.tomato, .7, { yaw: K([[0, -.55], [3, -.5], [7, -.3], [12, -.5]], lt), headYaw: K([[0, -.6], [3, -.45], [7, -.1], [8.2, -.5], [12, -.3]], lt), tomPose: 'fruit', arms: { l: 'hold', r: 'rest' }, grip: { l: [-70, 70] }, hold: { l: 'fp17_tablet' }, tabLit: lt < CUE.click ? 0 : 1, expr: 'tom_fruit' });
  C.mango = who('station', A7.mango, .26, { yaw: K([[0, .75], [3, .75], [3.1, .5], [4, .75]], lt), headYaw: K([[0, .7], [3, .4], [4, .7]], lt), expr: sp('m1') ? 'sad' : 'neutral' }, 14);
  C.lemon = who('station', A7.lemon, .4, { yaw: .7, headYaw: lt > 5.6 && lt < 6.6 ? -.7 : .55, expr: 'neutral' }, 14);
  C.straw = who('station', A11.straw, .54, { yaw: .65, headYaw: .5, expr: lt > 9.8 && lt < 10.4 ? 'sour' : 'dead', lid: .5 }, 14);
  return C;
}

// ------------------------------------------------------------------ the world
let FRAME = null;
function drawWorld(lt) {
  const st = FRAME.st, C = FRAME.C; STATE = st;
  S15.light(st);
  S15.tower(lt, st);
  drawChar(C.tom);
  S15.front(lt, st);
  drawChar(C.mango); drawChar(C.lemon); drawChar(C.straw);
}

// ------------------------------------------------------------------ cameras (tower coordinates [x, y, zoom])
const BAND = 148;
const at = (x, y, z) => [x, y + BAND / z, z];
const faceCam = (o, z, up = 150) => { const [fx, fy] = faceC(o); return [fx, fy + up / z, z]; };
const roomCam = (id, z) => { const c = S15.cam('room:' + id, STATE, z ? { z } : {}); return [c.x, c.y, c.z]; };
const wideCam = () => { const c = S15.cam('tower', STATE, {}); return [c.x, c.y, c.z]; };
const lerpCam = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), k))];
function camAt(lt, C, st) {
  STATE = st;
  if (lt < 1.1) return lerpCam(wideCam(), roomCam('station', 1.9), eo(lt / 1.1));
  return roomCam('station', 1.9);
}

const SC = {
  shot(lt) { return lt < 1.1 ? 'wide' : 'station'; },
  cam(lt) {
    const st = ST(lt); STATE = st; const C = cast(lt, st); FRAME = { C, st };
    const [x, y, z] = camAt(lt, C, st);
    zoomTo(x, y, z);
  },
  draw(lt) { drawWorld(lt); },
  fx(lt) {
    const fx = { bloom: .5, vignette: .42, grain: .045, contrast: .13, sat: .1 };
    if (lt < .25) { fx.fade = 1 - sg(lt, 0, .25); fx.fadeColor = '16,12,24'; }
    return fx;
  },
  blur(lt) { return 1; },
  over(lt) {},
  clock: () => SCN.clock, label: () => SCN.label,
};
window.__EP17_SCENES = window.__EP17_SCENES || {};
window.__EP17_SCENES.assign = SC;
})();
