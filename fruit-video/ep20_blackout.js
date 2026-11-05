'use strict';
/* SHIFT HAPPENS, Episode 20: "The Snow Day". Builder E20-BLACKOUT. Scene `blackout` (6:12 PM, THE BLACKOUT, 36.933 s). Registers window.__EP20_SCENES.blackout. Everything is a pure function of the scene time `lt`.
 *
 * THE LOOK: a warm lit building loses power room by room (the cutaway), then lives by small lights: a stopwatch (aqua), Binder's bubble (cool white-blue), a phone flashlight (white cone), LED candles (warm),
 * green exit signs, red-amber emergency lamps. The darkness is L20.pass (the WX light kit) over the world, never below ambient .16; it is skipped in the text gate's mask pass (TXA.mask), like the engine's bloom,
 * because a light is not an object that covers text. PHOTOSENSITIVITY: ONE dip: the six rooms of the cutaway die in a cascade of about 1.1 s (one small flicker per room), then it stays dark; the generator brings
 * the light back as a RAMP (12.9 to 13.7), no flash; Binder's low battery is a local flicker of the bubble, not a full-frame change; the candles ramp on over .15 s each and breathe at under 1.2 Hz.
 *
 * THE SET (the cutaway is drawn here; the interior is S13, the nurses' station, in one-point perspective seen at night, as in Episode 18). The cast stands in front of the counter, left to right:
 * Strawberry (-330), Lemon (-120), Onion (90, the stopwatch), Tomato (300), Mango (510, the phone light); Brenda sits in the corner chair at the far right (700, outside the wide until the beam finds her).
 *
 * SHOTS (scene-local s; every cut is snapped to a frame; see SH below)
 *  cut 0-2.30 THE CUTAWAY: a night exterior wide, the building as a two-row dollhouse (KITCHEN | STATION | DAY ROOM over MED ROOM | BREAK ROOM | OXYGEN). powerdown .20: the kitchen's light dies, then every room in a
 *      cascade to the right (.31 med, .53 station, .64 break, .86 day room, .97 oxygen), each dimming over .15 s; relays .70 / 1.10 / 1.50 bring the green exit signs and red lamps up; the camera pushes into the STATION from 0.9 s.
 *  w1 2.30-2.70 the dark station, the phone light clicks on (flashlight 2.30), the stopwatch wakes (2.40) | o1 2.70-4.35 Onion CU | r1 4.35-5.43 Strawberry CU, Binder pops out of her lanyard (binderpop 5.284) |
 *  b1 5.43-6.75 Binder's bubble | b1b 6.75-7.49 the YES / NO insert, the pointer hovers YES | s1 7.49-8.20 Strawberry "Yes." | b2 8.20-9.50 "Great! I'll..." the bubble dies (lowbattery 9.10) |
 *  c1 9.50-10.65 the stopwatch, pushing in (stopwatchticks from 9.02) | c2 10.65-11.67 the faces in the stopwatch light, Mango's beam wobbling, snow in the window | l1 11.67-12.33 Lemon "Ten." (two-shot with Onion's stopwatch) |
 *  gen 12.33-13.98 the generator (genstart 12.334, shudder 12.45, the stopwatch stops at 10.0, the RAMP 12.9-13.7, relay 13.134) | o1b 13.98-15.33 Onion "Within code." (sniffle 14.784) |
 *  t1 15.33-16.51 Tomato, three candles click on (15.677, 15.927, 16.177) | o3 16.51-18.42 Onion | t2 18.42-19.65 Tomato | o4 19.65-20.88 Onion, the APPROVED sticker | m1a 20.88-21.95 Mango |
 *  m1b 21.95-23.63 the wall: two outlets, the dead coffee maker | s2 23.63-24.26 Strawberry "What." | o2 24.26-26.25 Onion | s3 26.25-27.04 Strawberry, the long flat look |
 *  sw 27.04-27.29 the beam (flashlight 27.041) sweeps to the corner | br1 27.29-29.59 Brenda | br2a 29.59-30.55 Brenda | rg 30.55-31.15 the group | br2b 31.15-32.51 the flashlight: click, click (clickdead 31.286, 31.736) |
 *  br3 32.51-34.75 Brenda, held | rg2 34.75-35.28 the group looks at her | end 35.28-36.93 the red-lit room, the candles, everyone looking at Brenda (sting 35.383).
 */
(() => {
if (!window.TIMELINE_EP20 || !window.H6 || !window.V2 || !window.UI) return;
const B = window.__BLK = {};
const { person, zoomTo, faceC } = window.H6;
const c01 = x => Math.max(0, Math.min(1, x));
const sg = (t, a, b) => c01((t - a) / (b - a));
const ss = (t, a, b) => { const k = sg(t, a, b); return k * k * (3 - 2 * k); };
const eo = k => 1 - (1 - k) * (1 - k);
const eb = k => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const mixv = (a, b, k) => a + (b - a) * k;
const hnoise = (t, f, s = 0) => vnoise(t * f + s * 17.3);
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);
const sr = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
Object.assign(B, { c01, sg, ss, eo, eb, mixv, hnoise, pulse, sr });

// ------------------------------------------------------------------ the timeline (frozen), the sound cues, helpers
const TLX = window.TIMELINE_EP20, SCN = TLX.scenes.find(s => s.id === 'blackout'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'blackout') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wS = (id, i) => LN[id].s - START + LN[id].words[i][1];
const wE = (id, i) => LN[id].s - START + LN[id].words[i][2];
const snapT = t => Math.round((START + t) * 30) / 30 - START;
/* the sound cues of the scene (scene-local seconds; python3 /tmp/shift_tools/cues.py 20 blackout), snapped to the video frame nearest each */
const CUE = { powerdown: .2, relay: [.7, 1.1, 1.5], flash: [2.3, 27.041], sniffle: [5.8, 14.784], binderpop: 5.284, lowbattery: 9.101, ticks: 9.019, genstart: 12.334, relay2: 13.134, candle: [15.677, 15.927, 16.177], clickdead: [31.286, 31.736], sting: 35.383 };
for (const k in CUE) CUE[k] = Array.isArray(CUE[k]) ? CUE[k].map(snapT) : snapT(CUE[k]);
const T_SW = snapT(2.4), T_SWSTOP = T_SW + 10;                          /* the stopwatch starts at 2.4 s and shows 10.0 at 12.4 */
Object.assign(B, { TLX, SCN, START, LN, bS, bE, wS, wE, snapT, CUE, T_SW, T_SWSTOP });
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
function key(keys, lt, ease = easeIO) {                                   /* keyframes [[t, v]] (v a number or an array): eased between neighbours */
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
B.lg = lg; B.key = key;
const rgbs = (c, a) => V2.rgba(c, a);
B.rgbs = rgbs;
/* the mask pass of the text gate re-renders the world with every string in a key colour: a light is not an object that covers text, so the lighting pass sits that pass out (as the engine does for bloom) */
const inMask = () => (typeof TXA !== 'undefined' && TXA && TXA.mask);
B.inMask = inMask;
/* where a point of the scene lands on the screen under the current transform, and back */
const toScr = (x, y) => { const m = ctx.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
const toScene = (sx, sy) => { const m = ctx.getTransform(), inv = m.inverse(); return [inv.a * sx + inv.c * sy + inv.e, inv.b * sx + inv.d * sy + inv.f]; };
B.toScr = toScr; B.toScene = toScene;

// ====================================================================================================================================================================================
// THE CUTAWAY: the whole building as a dollhouse, losing power room by room (0 - 2.30 s). Screen coordinates (1080 x 1920); the camera pushes into the station.
// ====================================================================================================================================================================================
const BLD = { x0: 72, x1: 1008, yT: 640, yM: 948, yB: 1270, slab: 14, wall: 12, cols: [72, 384, 696, 1008] };
const ROOMS = [
  { id: 'kitchen', label: 'KITCHEN', c: 0, r: 0, wall: '#f0d79a', floor: '#a98458', t0: .20, exit: 0 },
  { id: 'station', label: 'STATION', c: 1, r: 0, wall: '#b9ddd2', floor: '#8a98a0', t0: .53, exit: 1 },
  { id: 'dayroom', label: 'DAY ROOM', c: 2, r: 0, wall: '#f4c9bd', floor: '#a47a6a', t0: .86, exit: 2 },
  { id: 'med', label: 'MED ROOM', c: 0, r: 1, wall: '#c6d8f0', floor: '#8c98b0', t0: .31, exit: 0 },
  { id: 'break', label: 'BREAK ROOM', c: 1, r: 1, wall: '#cde2b6', floor: '#98a07a', t0: .64, exit: 1 },
  { id: 'oxygen', label: 'OXYGEN', c: 2, r: 1, wall: '#d4dbe4', floor: '#8a929e', t0: .97, exit: 2 },
];
const roomRect = rm => { const x0 = BLD.cols[rm.c] + (rm.c ? 0 : BLD.wall), x1 = BLD.cols[rm.c + 1] - (rm.c < 2 ? 0 : BLD.wall), y0 = rm.r ? BLD.yM + BLD.slab : BLD.yT + BLD.wall, y1 = rm.r ? BLD.yB - BLD.wall : BLD.yM; return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2 }; };
B.ROOMS = ROOMS; B.BLD = BLD; B.roomRect = roomRect;
/* the light of a room 0..1 at lt: steady, one small flicker just before it dies, then a .15 s dim to nothing (a dip, never a strobe) */
const roomLit = (rm, lt) => {
  const t0 = rm.t0, fl = lt >= t0 - .13 && lt < t0 ? 1 - .3 * Math.sin(Math.PI * sg(lt, t0 - .13, t0)) : 1;
  return lt < t0 ? fl : 1 - ss(lt, t0, t0 + .15);
};
B.roomLit = roomLit;
const RELAY_AT = [CUE.relay[0], CUE.relay[1], CUE.relay[2]];

/* the tiny residents, drawn without the layout audit (the cutaway is an establishing wide: nobody speaks) */
function tiny(ctor, x, y, s, o) { const c = ctor(Object.assign({ t: 0 }, o)); Object.assign(c, { x, y, s, noShadow: true, noReflect: true, noBob: true }, o || {}); REG.suppress++; drawChar(c); REG.suppress--; }
function roomArt(rm, lt) {
  const R = roomRect(rm), { x0, y0, x1, y1, w, h, cx } = R, lit = roomLit(rm, lt), fl = y1 - 6;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, rm.wall], [1, V2.mix ? '#' + V2.mix(rm.wall, '#7a7468', .35).map(v => Math.round(v).toString(16).padStart(2, '0')).join('') : rm.wall]]); ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = rm.floor; ctx.fillRect(x0, y1 - 22, w, 22); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0, y1 - 22, w, 3);
  ctx.fillStyle = 'rgba(40,30,30,.18)'; ctx.fillRect(x0, y0, w, 12);                                            /* the ceiling line */
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ink = 'rgba(30,20,34,.8)';
  if (rm.id === 'kitchen') {
    ctx.fillStyle = '#9aa3ad'; rr(x0 + 24, fl - 120, 120, 100, 6); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke();                         /* the range */
    ctx.fillStyle = '#3a3f48'; ctx.fillRect(x0 + 34, fl - 124, 100, 6);
    ctx.fillStyle = '#c9ced6'; rr(x0 + 52, fl - 160, 62, 38, 5); ctx.fill(); ctx.stroke();                                                                 /* the pot */
    ctx.fillStyle = '#7a828e'; rr(x0 + 44, fl - 140, 78, 14, 4); ctx.fill();
    ctx.fillStyle = '#6a727e'; rr(x0 + 20, y0 + 40, 150, 24, 4); ctx.fill(); ctx.stroke();                                                                 /* the hood */
    ctx.strokeStyle = '#4a4f58'; ctx.lineWidth = 4; for (const px of [200, 240, 280]) { ctx.beginPath(); ctx.moveTo(x0 + px, y0 + 16); ctx.lineTo(x0 + px, y0 + 52); ctx.stroke(); ctx.fillStyle = '#8a929e'; ctx.beginPath(); ctx.arc(x0 + px, y0 + 72, 18, 0, TAU); ctx.fill(); ctx.stroke(); }   /* pans on hooks */
    ctx.fillStyle = '#c28a52'; rr(x1 - 112, fl - 100, 96, 80, 5); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke(); ctx.fillStyle = '#d9a468'; ctx.fillRect(x1 - 112, fl - 104, 96, 10);   /* a prep table */
    if (lit > .2) { ctx.fillStyle = 'rgba(255,255,255,' + (.35 * lit) + ')'; for (let i = 0; i < 3; i++) { const ph = ((lt * .5 + i / 3) % 1); ctx.beginPath(); ctx.arc(x0 + 82 + Math.sin(ph * 5 + i) * 8, fl - 170 - ph * 44, 8 + ph * 8, 0, TAU); ctx.fill(); } }
  } else if (rm.id === 'station') {
    ctx.fillStyle = '#fbfbf4'; rr(x0 + 28, y0 + 34, 92, 66, 5); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke();                              /* the whiteboard */
    ctx.strokeStyle = '#5a8fd8'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x0 + 38, y0 + 52 + i * 16); ctx.lineTo(x0 + 104 - i * 12, y0 + 52 + i * 16); ctx.stroke(); }
    ctx.fillStyle = '#e9eef2'; ctx.beginPath(); ctx.arc(x1 - 46, y0 + 62, 24, 0, TAU); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke(); ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x1 - 46, y0 + 62); ctx.lineTo(x1 - 46, y0 + 46); ctx.moveTo(x1 - 46, y0 + 62); ctx.lineTo(x1 - 34, y0 + 66); ctx.stroke();   /* the clock */
    ctx.fillStyle = '#7a5a3a'; rr(x0 + 20, fl - 78, 190, 66, 5); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#9a7650'; ctx.fillRect(x0 + 20, fl - 82, 190, 10);   /* the counter */
    ctx.fillStyle = '#2a3340'; rr(x0 + 150, fl - 118, 44, 36, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7ad8ff'; ctx.fillRect(x0 + 156, fl - 112, 32, 22);                               /* a monitor */
    ctx.fillStyle = '#5a4a3c'; rr(x1 - 56, fl - 54, 40, 10, 3); ctx.fill(); ctx.fillRect(x1 - 52, fl - 44, 6, 40); ctx.fillRect(x1 - 24, fl - 44, 6, 40); ctx.fillStyle = '#6a5a4c'; rr(x1 - 58, fl - 112, 12, 62, 4); ctx.fill();   /* the corner chair */
  } else if (rm.id === 'dayroom') {
    ctx.fillStyle = '#2a3140'; rr(x0 + 120, y0 + 30, 120, 76, 5); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3.4; ctx.stroke();                                                        /* the TV */
    ctx.fillStyle = lg(0, y0 + 36, 0, y0 + 100, [[0, '#9ed4ff'], [1, '#5a8fd8']]); ctx.fillRect(x0 + 128, y0 + 38, 104, 60);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x0 + 138, y0 + 48, 40, 7); ctx.fillRect(x0 + 138, y0 + 62, 70, 7);
    ctx.fillStyle = '#b86a58'; rr(x0 + 30, fl - 66, 100, 52, 10); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke(); rr(x0 + 150, fl - 66, 100, 52, 10); ctx.fill(); ctx.stroke();                   /* two armchairs */
    ctx.fillStyle = '#a65a48'; rr(x0 + 26, fl - 100, 22, 60, 8); ctx.fill(); ctx.stroke(); rr(x0 + 232, fl - 100, 22, 60, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d98a4a'; ctx.beginPath(); ctx.moveTo(x1 - 40, fl - 112); ctx.lineTo(x1 - 14, fl - 112); ctx.lineTo(x1 - 8, fl - 84); ctx.lineTo(x1 - 46, fl - 84); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a4a32'; ctx.fillRect(x1 - 29, fl - 84, 4, 70);   /* a floor lamp */
  } else if (rm.id === 'med') {
    ctx.fillStyle = '#e6edf4'; rr(x0 + 24, y0 + 28, 136, 110, 5); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke();                                                           /* the med cabinet */
    ctx.strokeStyle = 'rgba(40,50,70,.5)'; ctx.lineWidth = 2; for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x0 + 24, y0 + 28 + i * 37); ctx.lineTo(x0 + 160, y0 + 28 + i * 37); ctx.stroke(); }
    const cols = ['#e8505a', '#4a8fd8', '#f0b440', '#5ac078']; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = cols[(i + j) % 4]; rr(x0 + 36 + i * 30, y0 + 38 + j * 37, 14, 22, 3); ctx.fill(); }
    ctx.fillStyle = '#7a8ca6'; rr(x1 - 130, fl - 112, 100, 94, 6); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#566884'; for (let i = 0; i < 3; i++) ctx.fillRect(x1 - 122, fl - 104 + i * 28, 84, 20);   /* the med cart */
    ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.arc(x1 - 112, fl - 14, 7, 0, TAU); ctx.arc(x1 - 50, fl - 14, 7, 0, TAU); ctx.fill();
  } else if (rm.id === 'break') {
    ctx.fillStyle = '#e8ecee'; rr(x0 + 22, fl - 156, 70, 138, 6); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x0 + 22, fl - 96); ctx.lineTo(x0 + 92, fl - 96); ctx.stroke();      /* the fridge */
    ctx.fillStyle = '#d6d9de'; ctx.fillRect(x0 + 82, fl - 140, 5, 30); ctx.fillRect(x0 + 82, fl - 86, 5, 40);
    ctx.fillStyle = '#c9a070'; rr(x0 + 128, fl - 64, 130, 46, 6); ctx.fill(); ctx.strokeStyle = ink; ctx.stroke(); ctx.fillStyle = '#8a6a44'; ctx.fillRect(x0 + 140, fl - 20, 8, 16); ctx.fillRect(x0 + 238, fl - 20, 8, 16);   /* a table */
    ctx.fillStyle = '#7a8088'; rr(x0 + 140, fl - 100, 56, 36, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2a323a'; ctx.fillRect(x0 + 146, fl - 94, 34, 24);                                                      /* the microwave */
    ctx.fillStyle = '#e9eef2'; ctx.beginPath(); ctx.arc(x1 - 44, y0 + 56, 22, 0, TAU); ctx.fill(); ctx.stroke();
  } else {
    for (let i = 0; i < 4; i++) { const tx = x0 + 34 + i * 48; ctx.fillStyle = i % 2 ? '#e8f0f4' : '#5ab88a'; rr(tx, fl - 150, 32, 132, 14); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#9aa3ad'; rr(tx + 8, fl - 162, 16, 14, 3); ctx.fill(); ctx.stroke(); }   /* tanks */
    ctx.strokeStyle = '#5a6068'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0 + 24, fl - 108); ctx.lineTo(x0 + 224, fl - 108); ctx.moveTo(x0 + 24, fl - 60); ctx.lineTo(x0 + 224, fl - 60); ctx.stroke();
    ctx.fillStyle = '#a9b4be'; rr(x1 - 76, fl - 96, 58, 78, 6); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#3acb78'; ctx.beginPath(); ctx.arc(x1 - 47, fl - 76, 6, 0, TAU); ctx.fill();   /* the concentrator */
  }
  ctx.restore();
}
/* the figures of the cutaway, drawn on the room floor; positions are screen coordinates */
function roomFolk(rm, lt) {
  const R = roomRect(rm), fl = R.y1 - 6, S = .33;
  if (rm.id === 'station') {
    tiny(A11.straw, R.x0 + 88, fl, S, { who: undefined, expr: 'neutral' }); tiny(A7.lemon, R.x0 + 142, fl, S, { who: undefined, acc: ['readers', 'lanyard7'] }); tiny(A15.onion, R.x0 + 196, fl, S, { who: undefined, pose: 'free', cry: .5 });
  } else if (rm.id === 'dayroom') {
    tiny(A7.pear, R.x0 + 70, fl - 20, S, { who: undefined }); tiny(A7.banana, R.x0 + 190, fl - 20, S, { who: undefined });
  } else if (rm.id === 'med') tiny(A7.mango, R.x0 + 196, fl, S, { who: undefined });
  else if (rm.id === 'break') tiny(A15.tomato, R.x0 + 168, fl, S, { who: undefined, tomPose: 'fruit' });
  else if (rm.id === 'kitchen') tiny(A7.cran, R.x0 + 210, fl, S, { who: undefined });
}
/* a plaque with the room's name (set dressing) */
function roomLabel(rm, lt) {
  const R = roomRect(rm), lit = roomLit(rm, lt);
  ctx.save(); ctx.globalAlpha *= .55 + .45 * lit;
  UI.label(rm.label, R.cx, R.y0 + 16, { size: 21, weight: 900, fill: '#fff', stroke: 'rgba(20,16,30,.8)', lw: 5, spacing: 1.2, hero: false, crop: true, maxW: R.w - 30 });
  ctx.restore();
}
/* snow lying on the roof: a lumpy cap with a blue shadow side and a few icicles under the eave */
function roofSnow(lt) {
  const x0 = BLD.x0 - 22, x1 = BLD.x1 + 22, y = BLD.yT;
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#9fb4d8'; rr(BLD.x0 - 10, y - 20, BLD.x1 - BLD.x0 + 20, 36, 8); ctx.fill();                      /* the roof slab under the snow */
  ctx.fillStyle = lg(0, y - 96, 0, y + 8, [[0, '#ffffff'], [.6, '#e4edfb'], [1, '#aebfe0']]);
  ctx.beginPath(); ctx.moveTo(x0, y + 12);
  const n = 11; for (let i = 0; i <= n; i++) { const px = lerp(x0, x1, i / n), bump = 38 + 30 * sr(i, 4) + 14 * Math.sin(i * 1.7); ctx.quadraticCurveTo(px - (x1 - x0) / n * .5, y - bump * 1.25, px, y - bump * .5); }
  ctx.lineTo(x1, y + 12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(90,110,160,.45)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = 'rgba(120,150,210,.35)'; ctx.fillRect(x0, y + 2, x1 - x0, 12);
  for (let i = 0; i < 17; i++) { const ix = BLD.x0 + 20 + i * 54 + 10 * sr(i, 9), ih = 18 + 28 * sr(i, 10); ctx.fillStyle = 'rgba(225,238,255,.92)'; ctx.beginPath(); ctx.moveTo(ix - 6, y + 12); ctx.lineTo(ix + 6, y + 12); ctx.lineTo(ix, y + 12 + ih); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function exterior(lt) {
  /* the sky, the glow of a moon behind the weather, the far trees, the snow field */
  ctx.fillStyle = lg(0, 0, 0, 1500, [[0, '#0a1330'], [.45, '#182a52'], [1, '#2e4778']]); ctx.fillRect(-100, -100, W + 200, 1700);
  V2.glow(230, 330, 560, '150,182,255', .34, 'screen', .2);
  ctx.fillStyle = '#16264a'; for (let i = 0; i < 14; i++) { const tx = -40 + i * 90 + 20 * sr(i, 1), th = 150 + 90 * sr(i, 2); ctx.beginPath(); ctx.moveTo(tx - 52, 1330); ctx.lineTo(tx, 1330 - th); ctx.lineTo(tx + 52, 1330); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = lg(0, 1290, 0, 1920, [[0, '#7f95c4'], [.35, '#b9c8e6'], [1, '#e8effc']]); ctx.fillRect(-100, 1290, W + 200, 800);
  /* the street lamp on the right: warm, and out with the first room (a pole, a head, a pool of light on the snow) */
  const lampK = 1 - ss(lt, CUE.powerdown + .02, CUE.powerdown + .17);
  ctx.fillStyle = '#2a3350'; ctx.fillRect(1040, 1010, 12, 330); rr(1010, 996, 70, 20, 6); ctx.fill();
  if (lampK > .01) { V2.glow(1046, 1030, 300, '255,200,120', .6 * lampK, 'screen', .4); ctx.fillStyle = 'rgba(255,226,170,' + lampK + ')'; ctx.beginPath(); ctx.ellipse(1046, 1020, 24, 8, 0, 0, TAU); ctx.fill(); }
  else { ctx.fillStyle = '#8f97aa'; ctx.beginPath(); ctx.ellipse(1046, 1020, 24, 8, 0, 0, TAU); ctx.fill(); }
}
B.roofSnow = roofSnow; B.roomArt = roomArt; B.roomFolk = roomFolk; B.roomLabel = roomLabel; B.exteriorBase = exterior;
})();
(() => {
/* ---- block 2: the cutaway assembled (shell, rooms, signs, snow) and its camera */
const B = window.__BLK; if (!B) return;
const { c01, sg, ss, lg, sr, CUE, ROOMS, BLD, roomRect, roomLit, roomArt, roomFolk, roomLabel, roofSnow } = B;
const exitK = (rm, lt) => { const t = CUE.relay[rm.exit]; return .3 + .7 * ss(lt, t, t + .12); };
/* how much of the cutaway's own darkness lies over a room: 0 lit .. 1 dead (a deep blue veil; the room is never black) */
const veil = (R, k) => { if (k <= .004) return; ctx.save(); ctx.fillStyle = 'rgba(6,10,32,' + (.8 * k) + ')'; ctx.fillRect(R.x0, R.y0, R.w, R.h); ctx.restore(); };
function drawCut(lt) {
  B.exteriorBase(lt);
  if (window.SN20 && SN20.snow) SN20.snow(ctx, { x0: -60, y0: 0, x1: W + 60, y1: 1500, t: lt, seed: 5, layers: 3, density: .9, tone: 'dark', slice: 'back', wind: -34, fore: false });
  let sum = 0; for (const rm of ROOMS) sum += roomLit(rm, lt);
  V2.glow(540, 1280, 820, '255,204,140', .38 * sum / 6, 'screen', .3);                                   /* the lit rooms light the snow around the house */
  V2.glow(540, 560, 700, '255,214,160', .16 * sum / 6, 'screen', .2);
  /* the shell: a foundation, the outer walls, the slab between the rows */
  ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#4a5476'; rr(BLD.x0 - 16, BLD.yB - 8, BLD.x1 - BLD.x0 + 32, 34, 8); ctx.fill();
  ctx.fillStyle = '#5a6586'; ctx.fillRect(BLD.x0, BLD.yT, BLD.x1 - BLD.x0, BLD.yB - BLD.yT);
  ctx.restore();
  for (const rm of ROOMS) {
    const R = roomRect(rm), lit = roomLit(rm, lt);
    roomArt(rm, lt);
    /* the ceiling light of the room and its warm spill, then the folk, then the veil of the dark */
    ctx.save(); ctx.beginPath(); ctx.rect(R.x0, R.y0, R.w, R.h); ctx.clip();
    ctx.fillStyle = lit > .05 ? 'rgba(255,240,200,' + (.4 + .6 * lit) + ')' : '#7a7f92'; rr(R.cx - 46, R.y0 + 10, 92, 9, 4); ctx.fill();
    if (lit > .02) { V2.glow(R.cx, R.y0 + 30, R.w * .95, '255,226,170', .34 * lit, 'screen', 0); }
    ctx.restore();
    roomFolk(rm, lt);
    ctx.save(); ctx.beginPath(); ctx.rect(R.x0, R.y0, R.w, R.h); ctx.clip();
    if (rm.id === 'dayroom') { const tv = 1 - ss(lt, rm.t0, rm.t0 + .1); if (tv > .02) V2.glow(R.x0 + 180, R.y0 + 70, 160, '120,190,255', .3 * tv, 'screen', 0); }
    veil(R, 1 - lit);
    ctx.restore();
    /* the exit sign over the room's door and the red battery lamps, which wake at their relay */
    const ek = exitK(rm, lt), ex = rm.c === 1 ? R.x0 + 46 : R.x1 - 46, ey = R.y0 + 46;
    if (window.P20 && P20.exitSign) P20.exitSign(ctx, { x: ex, y: ey, s: .46, glow: ek * (1 - .45 * lit), t: lt, halo: .8 });
    if ((rm.id === 'station' || rm.id === 'break' || rm.id === 'med') && window.P20 && P20.emergencyLamp) {
      const on = ss(lt, CUE.relay[rm.exit], CUE.relay[rm.exit] + .12) * (1 - lit);
      P20.emergencyLamp(ctx, { x: rm.c === 1 ? R.x1 - 46 : R.cx + 40, y: R.y0 + 34, s: .34, on, color: '#ff7a3a', t: lt });
      if (on > .02) V2.glow(rm.c === 1 ? R.x1 - 46 : R.cx + 40, R.y0 + 60, 150, '255,110,50', .3 * on, 'screen', .3);
    }
    roomLabel(rm, lt);
  }
  /* the walls between the rooms, with a rim of snow light on the top edges once the warm light is gone */
  ctx.save(); ctx.fillStyle = '#4a5476';
  for (const x of [BLD.cols[1], BLD.cols[2]]) ctx.fillRect(x - 6, BLD.yT, 12, BLD.yM - BLD.yT + BLD.slab * 0 + (BLD.yB - BLD.yM));
  ctx.fillRect(BLD.x0, BLD.yM, BLD.x1 - BLD.x0, BLD.slab);
  ctx.fillRect(BLD.x0, BLD.yT, BLD.wall, BLD.yB - BLD.yT); ctx.fillRect(BLD.x1 - BLD.wall, BLD.yT, BLD.wall, BLD.yB - BLD.yT);
  ctx.strokeStyle = 'rgba(170,196,255,' + (.18 + .3 * (1 - sum / 6)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(BLD.x0 + 1.5, BLD.yB); ctx.lineTo(BLD.x0 + 1.5, BLD.yT); ctx.lineTo(BLD.x1 - 1.5, BLD.yT); ctx.lineTo(BLD.x1 - 1.5, BLD.yB); ctx.stroke();
  ctx.restore();
  roofSnow(lt);
  /* the foreground bank: a drift across the bottom with blue shadow, snow piled against the foundation */
  ctx.save();
  ctx.fillStyle = lg(0, 1250, 0, 1500, [[0, '#9fb2d8'], [1, '#dfe8f8']]);
  ctx.beginPath(); ctx.moveTo(-60, 1500); ctx.lineTo(-60, 1318); for (let i = 0; i <= 12; i++) ctx.quadraticCurveTo(-60 + (i + .5) * 100, 1250 - 32 * sr(i, 7), -60 + (i + 1) * 100, 1306 - 24 * sr(i, 8)); ctx.lineTo(W + 60, 1500); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(80,100,160,.28)'; ctx.beginPath(); ctx.ellipse(540, 1300, 560, 22, 0, 0, TAU); ctx.fill();
  ctx.restore();
  V2.glow(540, 1330, 560, '255,206,140', .22 * sum / 6, 'screen', .2);
  /* two cars the plow has buried (the lot of the last scene), side view, nothing but a mirror and an antenna */
  if (window.A20 && A20.car) {
    A20.car(ctx, { x: 160, y: 1452, s: 1.05, color: '#c43a3a', snow: .95, facing: 1, lights: false, seed: 3, t: lt });
    A20.car(ctx, { x: 930, y: 1440, s: .85, color: '#3a74c0', snow: .7, facing: -1, lights: false, seed: 5, t: lt });
  }
  if (window.SN20 && SN20.snow) SN20.snow(ctx, { x0: -60, y0: 0, x1: W + 60, y1: H, t: lt, seed: 9, layers: 3, density: .8, tone: 'dark', slice: 'front', wind: -34 });
}
/* the camera of the cutaway: a slow settle, then a push into the STATION (the middle room of the top row) from 0.9 s; the cut to the interior is at 2.30 */
const CUTZ = { z1: 3.05, cy0: 930, cy1: 800 };
function camCut(lt) {
  const k = easeIO(sg(lt, .9, 2.28)), drift = sg(lt, 0, .9);
  const z = (1 + .035 * drift) + (CUTZ.z1 - 1.035) * k, cy = lerp(CUTZ.cy0, CUTZ.cy1, k), cx = 540 + 6 * Math.sin(lt * .9);
  zoomTo0(cx, cy, z);
}
const zoomTo0 = (x, y, z) => { CAM.x = x; CAM.y = y; CAM.z = z; };
B.drawCut = drawCut; B.camCut = camCut;
})();
(() => {
/* ---- block 3: the interior (S13, the nurses' station at night): the room, the cast, the camera */
const B = window.__BLK; if (!B) return;
const { person, zoomTo, faceC } = window.H6;
const { c01, sg, ss, eo, eb, hnoise, pulse, key, lg, CUE, T_SW, T_SWSTOP, snapT, bS, bE, wS, wE, LN, toScr, toScene } = B;
const PI = Math.PI;
const kz = Z => V2.P.f / (Z - V2.P.cz);
/* who stands where: world (X, Z) in the station's one-point perspective, in front of the counter; Brenda in the corner chair at the far right */
const POS = { straw: [-330, 1290], lemon: [-120, 1250], onion: [90, 1200], tom: [300, 1250], mango: [510, 1190], brenda: [700, 1720] };
B.POS = POS;
const COUNTER = { x0: -120, x1: 720, z0: 1380, z1: 1520, top: 190 };

// ------------------------------------------------------------------ the shots (scene-local seconds, snapped to frames below)
/* k: 'cut' the cutaway | 'w' a wide (z, y = the frame centre) | 'cu' a face (foc, z, z2 = the push, up = px the face sits above the centre, dx = px shift) | 'two' two faces (foc = [a, b]) | 'wall' the outlets insert */
const SH = [
  { id: 'cut', s: 0, e: 2.30, k: 'cut' },
  { id: 'w1', s: 2.30, e: 2.70, k: 'w', z: 1.0, y: 930, cx: -40 },
  { id: 'o1', s: 2.70, e: 4.35, k: 'cu', foc: 'onion', z: 2.55, z2: 2.8, up: 70, dx: 70, dof: 10 },
  { id: 'r1', s: 4.35, e: 5.43, k: 'cu', foc: 'straw', z: 2.3, z2: 2.4, up: 80, dx: -30, dof: 10, bsmall: 1 },
  { id: 'b1', s: 5.43, e: 7.49, k: 'cu', foc: 'straw', z: 2.0, z2: 2.08, up: -120, dx: 205, dof: 12, bub: 1 },
  { id: 's1', s: 7.49, e: 8.20, k: 'cu', foc: 'straw', z: 2.15, z2: 2.2, up: -120, dx: 205, dof: 12, bub: 1 },
  { id: 'b2', s: 8.20, e: 9.50, k: 'cu', foc: 'straw', z: 2.0, z2: 2.0, up: -120, dx: 205, dof: 12, bub: 2 },
  { id: 'c1', s: 9.50, e: 10.65, k: 'sw', foc: 'onion', z: 2.9, z2: 3.5, fx: 215, fy: -100, dof: 10, sw: 1 },
  { id: 'c2', s: 10.65, e: 11.67, k: 'w', z: 1.45, x: 640, y: 900, cx: -40, dof: 6, whole: 1 },
  { id: 'l1', s: 11.67, e: 12.33, k: 'two', foc: ['lemon', 'onion'], z: 1.95, z2: 2.0, up: 70, dof: 8 },
  { id: 'gen', s: 12.33, e: 13.98, k: 'w', z: 1.0, y: 930, cx: -40, gen: 1 },
  { id: 'o1b', s: 13.98, e: 15.33, k: 'cu', foc: 'onion', z: 2.55, z2: 2.7, up: 70, dx: 70, dof: 10 },
  { id: 't1', s: 15.33, e: 16.51, k: 'cu', foc: 'tom', z: 2.4, z2: 2.5, up: 70, dx: 0, dof: 10, candles: 1 },
  { id: 'o3', s: 16.51, e: 18.42, k: 'cu', foc: 'onion', z: 2.5, z2: 2.65, up: 70, dx: 100, dof: 10, candles: 1 },
  { id: 't2', s: 18.42, e: 19.65, k: 'cu', foc: 'tom', z: 2.5, z2: 2.6, up: 70, dx: -90, dof: 10, candles: 1 },
  { id: 'o4', s: 19.65, e: 20.88, k: 'cu', foc: 'onion', z: 2.5, z2: 2.6, up: 70, dx: 100, dof: 10, candles: 1, sticker: 1 },
  { id: 'm1a', s: 20.88, e: 21.95, k: 'cu', foc: 'mango', z: 2.5, z2: 2.6, up: 70, dx: -60, dof: 10 },
  { id: 'm1b', s: 21.95, e: 23.63, k: 'wall' },
  { id: 's2', s: 23.63, e: 24.26, k: 'cu', foc: 'straw', z: 2.5, z2: 2.55, up: 70, dx: 40, dof: 10, candles: 1 },
  { id: 'o2', s: 24.26, e: 26.25, k: 'cu', foc: 'onion', z: 2.45, z2: 2.6, up: 70, dx: 80, dof: 10, candles: 1 },
  { id: 's3', s: 26.25, e: 27.04, k: 'cu', foc: 'straw', z: 2.7, z2: 2.85, up: 70, dx: 20, dof: 10, candles: 1, coffee: 1 },
  { id: 'sw', s: 27.04, e: 27.29, k: 'w', z: 1.15, y: 930, cx: 400, dof: 0, sweep: 1, whole: 1 },
  { id: 'br1', s: 27.29, e: 29.59, k: 'cu', foc: 'brenda', z: 3.0, z2: 3.15, up: 20, dx: -20, dof: 10 },
  { id: 'br2a', s: 29.59, e: 30.55, k: 'cu', foc: 'brenda', z: 3.15, z2: 3.25, up: 20, dx: -20, dof: 10 },
  { id: 'rg', s: 30.55, e: 31.15, k: 'two', foc: ['lemon', 'onion'], z: 1.9, up: 70, dof: 8, lookB: 1 },
  { id: 'br2b', s: 31.15, e: 32.51, k: 'cu', foc: 'brenda', z: 3.5, z2: 3.6, up: -60, dx: -30, dof: 10, flash: 1 },
  { id: 'br3', s: 32.51, e: 34.75, k: 'cu', foc: 'brenda', z: 3.1, z2: 3.4, up: 20, dx: -20, dof: 10 },
  { id: 'rg2', s: 34.75, e: 35.28, k: 'two', foc: ['onion', 'mango'], z: 1.5, up: 70, dx: 55, dof: 8, lookB: 1 },
  { id: 'end', s: 35.28, e: 99, k: 'w', z: .92, y: 910, cx: 100, dof: 0, fin: 1, lookB: 1, whole: 1 },
];
for (const sh of SH) sh.s = sh.s === 0 ? 0 : snapT(sh.s);
const shotAt = lt => { let r = SH[0]; for (const sh of SH) if (lt >= sh.s - 1e-6) r = sh; return r; };
B.SH = SH; B.shotAt = shotAt;

// ------------------------------------------------------------------ the room at night: S13's station, the window as a pane of snow light, the signs and lamps
const faceZ = (o, z, up) => { const [fx, fy] = faceC(o); zoomTo(fx, fy + up / z, z); };
function windowPane(lt) {
  const L = S13.LAY.win, w = S13.wallBox(S13.LAY.zb, L.x0, L.y0, L.x1, L.y1);
  ctx.save(); ctx.beginPath(); ctx.rect(w[0], w[1], w[2], w[3]); ctx.clip();
  ctx.fillStyle = lg(0, w[1], 0, w[1] + w[3], [[0, '#96b0dc'], [1, '#6c88b8']]); ctx.fillRect(w[0], w[1], w[2], w[3]);
  if (window.SN20 && SN20.snow) SN20.snow(ctx, { x0: w[0], y0: w[1], x1: w[0] + w[2], y1: w[1] + w[3], t: lt, seed: 21, layers: 3, density: 1.5, tone: 'light', wind: -90, size: .8, fore: false });
  else { ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 60; i++) { const px = w[0] + ((B.sr(i, 1) * w[2] - lt * 40 * (.5 + B.sr(i, 2)) + w[2] * 4) % w[2]), py = w[1] + ((B.sr(i, 3) * w[3] + lt * 120 * (.5 + B.sr(i, 4))) % w[3]); ctx.beginPath(); ctx.arc(px, py, 2 + 3 * B.sr(i, 5), 0, TAU); ctx.fill(); } }
  ctx.fillStyle = 'rgba(90,110,150,.5)'; ctx.fillRect(w[0] + w[2] / 2 - 3, w[1], 6, w[3]); ctx.fillRect(w[0], w[1] + w[3] * .46, w[2], 6);                      /* the mullions */
  ctx.restore();
  /* the snow heaped on the sill */
  ctx.save(); ctx.fillStyle = '#e4edfb'; ctx.beginPath(); ctx.moveTo(w[0] - 14, w[1] + w[3] + 8);
  for (let i = 0; i <= 8; i++) ctx.quadraticCurveTo(w[0] - 14 + (i + .5) * (w[2] + 28) / 8, w[1] + w[3] - 16 - 10 * B.sr(i, 12), w[0] - 14 + (i + 1) * (w[2] + 28) / 8, w[1] + w[3] + 2);
  ctx.lineTo(w[0] + w[2] + 14, w[1] + w[3] + 10); ctx.closePath(); ctx.fill(); ctx.restore();
  return w;
}
const wallP = (X, Y) => V2.p2(X, Y, S13.LAY.zb);
function drawRoomI(lt, sh, o) {
  const R = S13.station(lt, { t: lt, sky: 1, sun: 0, bare: true, min: 12, hr: 6, lampsOn: 0 });
  const w = windowPane(lt);
  const zb = S13.LAY.zb, k = kz(zb);
  /* the exit sign over the doorway, the twin emergency lamp high on the wall */
  const ex = wallP(-500, 640), em = wallP(40, 1010);
  const hum = 1 + .12 * ss(lt, CUE.genstart, CUE.genstart + .5);
  if (window.P20) {
    P20.exitSign(ctx, { x: ex[0], y: ex[1], s: k * 1.25, glow: Math.min(1, .8 * hum), t: lt, halo: .9 });
    const lamp = P20.emergencyLamp(ctx, { x: em[0], y: em[1], s: k * 1.1, on: o.lampOn, t: lt, color: '#ffb070' });
    o.lampHeads = lamp.heads;
  }
  o.window = w; o.exitAt = ex;
  /* a light on the floor and the back wall comes from the lights list (L20.pass); the counter with its dead screens, the coffee maker and the candles stand on it */
  S13.counter({ t: lt, phoneRing: 0, plaque: false });
  return R;
}
B.drawRoomI = drawRoomI; B.faceZ = faceZ; B.COUNTER = COUNTER; B.windowPane = windowPane; B.wallP = wallP;
})();
(() => {
/* ---- block 4: the cast at night (acting, props, Binder), Brenda's chair, the foreground (candles, the dead coffee maker) */
const B = window.__BLK; if (!B) return;
const { person, zoomTo, faceC } = window.H6;
const { c01, sg, ss, eo, eb, hnoise, pulse, key, lg, CUE, T_SW, T_SWSTOP, snapT, bS, bE, wS, wE, LN, START, POS, toScr, toScene } = B;
const PI = Math.PI;
const kz = Z => V2.P.f / (Z - V2.P.cz);
Object.assign(POS, { tom: [-520, 1250], straw: [-325, 1290], lemon: [-120, 1250], onion: [160, 1200], mango: [440, 1190], brenda: [755, 1650] });
/* who speaks at lt (the line table), and which way the others look */
const spkAt = lt => { for (const id in LN) { const l = LN[id], s = l.s - START, e = l.e - START; if (lt >= s - .05 && lt < e + .12) return l.who; } return null; };
const xOf = who => who === 'bind' ? POS.straw[0] : (POS[who] || [0])[0];
const sgn = x => x < 0 ? -1 : 1;
/* turn toward a speaker: yaw/headYaw (radians, + faces screen right), look (pupils) */
function toward(me, who, amt = .3) {
  const d = xOf(who) - xOf(me); if (!who || who === me || Math.abs(d) < 1) return { yaw: 0, headYaw: 0, look: [0, 0] };
  if (who === 'brenda') amt *= 1.9;
  const k = Math.min(1, Math.abs(d) / 500);
  return { yaw: sgn(d) * amt * .55 * (.4 + .6 * k), headYaw: sgn(d) * amt * (.5 + .5 * k), look: [sgn(d) * (.45 + .4 * k), 0] };
}
B.toward = toward; B.spkAt = spkAt;
const SWG = [-105, 118], PHG = [-100, 44];
/* in the last wide the cast has closed up toward Brenda (the cut hides the move): the whole company and the corner chair fit one frame */
const ENDPOS = { tom: [-420, 1250], straw: [-205, 1290], lemon: [10, 1250], onion: [225, 1200], mango: [440, 1190] };

function castI(lt, sh) {
  const C = {}, spk = spkAt(lt), inB = id => lt >= bS(id) && lt < bE(id), PX = sh.id === 'end' ? ENDPOS : POS;
  const attn = lt >= CUE.flash[1] ? 'brenda' : spk;                                   /* after the beam, everybody looks at Brenda unless somebody else speaks */
  const sw = Math.min(10, Math.max(0, lt - T_SW)), swOn = ss(lt, T_SW, T_SW + .1);
  const sob = Math.max(0, 1 - Math.abs(lt - CUE.sniffle[0] - .12) / .5, 1 - Math.abs(lt - CUE.sniffle[1] - .12) / .5);
  /* ONION: the stopwatch in her left hand (the screen-left one), starts at 2.4 and stops at 10.0; she cries throughout; relief at "Within code." */
  { const tw = toward('onion', spk === 'onion' || !attn ? 'lemon' : attn, .34);
    const cand = sh.id === 'o4', ck = ss(lt, 19.68, 19.98), away = sh.id === 'end';
    C.onion = person(A15.onion, () => PX.onion, lt, { t: lt, pose: 'free', arms: { l: away ? 'rest' : 'hold', r: cand ? 'hold' : 'rest' }, grip: cand ? { l: SWG, r: [lerp(74, 112, ck), lerp(104, 52, ck)] } : { l: SWG }, hold: away ? {} : cand ? { l: 'fp20_stopwatch', r: 'fp20_candle' } : { l: 'fp20_stopwatch' }, candOn: 1, candSticker: ss(lt, 20.2, 20.5), candSeed: 2, swTime: sw, swOn, swRun: lt >= T_SW && lt < T_SWSTOP ? 1 : 0,
      yaw: 0, headYaw: tw.headYaw * .8 - .08, swScale: 1, look: lt < 2.7 || (spk !== 'onion' && !attn) ? [-.55, .7] : spk === 'onion' ? [-.3, .1] : tw.look, expr: 'onion_cry', cry: lt >= 13.98 && lt < 15.4 ? .85 : .62, sob, who: 'onion' }); }
  /* STRAWBERRY: flat and tired; she watches the stopwatch, Binder, the camera for one beat at "Yes."; one tear at the coffee */
  { const tw = toward('straw', spk === 'straw' ? 'lemon' : attn, .3), cam = ss(lt, 7.45, 7.55) * (1 - ss(lt, 8.0, 8.15)), bd = lt >= CUE.binderpop && lt < 9.4;
    let lk = bd ? [.1, .75] : tw.look; lk = [lerp(lk[0], 0, cam), lerp(lk[1], 0, cam)];
    if (lt >= 26.25 && lt < 27.04) lk = [.7, .35];
    let o = { t: lt, yaw: lerp(tw.yaw, .1, cam), headYaw: lerp(tw.headYaw, .05, cam), look: lk, expr: 'dead', lid: lt >= 26.25 && lt < 27.1 ? .42 : .5, who: 'straw', plant: true, acc: ['steth', 'bandage7', 'perdiem9'] };
    o = person(A11.straw, () => PX.straw, lt, o);
    const tear = ss(lt, 26.6, 27.0); if (tear > .02) o = A15.cryOn(o, .12 + .1 * tear);
    C.straw = o; }
  /* LEMON: the flat look; counts in the stopwatch light */
  { const tw = toward('lemon', spk === 'lemon' ? 'onion' : attn, .3);
    C.lemon = person(A7.lemon, () => PX.lemon, lt, { t: lt, yaw: tw.yaw, headYaw: tw.headYaw, look: lt >= 9.5 && lt < 12.4 ? [.5, .55] : tw.look, expr: 'neutral', lid: .3, acc: ['readers', 'lanyard7'], face: { curve: .02 }, who: 'lemon' }); }
  /* TOMATO: perky; the candle party */
  { const tw = toward('tom', spk === 'tom' ? 'onion' : attn, .3), party = lt >= 15.3 && lt < 16.5;
    C.tom = person(A15.tomato, () => PX.tom, lt, { t: lt, tomPose: 'fruit', yaw: tw.yaw, headYaw: tw.headYaw, look: tw.look, who: 'tom', hold: {}, arms: { l: party ? 'cheer' : 'rest', r: party ? 'cheer' : 'rest' } }); }
  /* BRENDA: in the corner chair, dusty, the dead flashlight from 2019 in her right hand; it comes up at "flashlight" (28.19), clicks twice (31.29, 31.74), goes down */
  { const raise = ss(lt, 27.95, 28.4) * (1 - ss(lt, 33.6, 34.4)), clk = [CUE.clickdead[0], CUE.clickdead[1]].reduce((a, t0) => a + Math.max(0, 1 - Math.abs(lt - t0 - .04) / .09), 0);
    const look = lt >= 31.1 && lt < 32.5 ? [-.3, .8] : [-.6, .1];
    let o = A13.brenda({ t: lt, id: 'brenda', who: 'brenda', expr: A13.expr(lt >= 32.5 ? 'weak' : 'wake'), lid: .3, dust: .7, specsDrop: .6, look, yaw: -.35, headYaw: -.3 + .06 * Math.sin(lt * .8),
      arms: { l: 'rest', r: 'hold' }, grip: { r: [lerp(46, 124, raise), lerp(100, 6, raise)] }, hold: { r: 'fp20_flashlight' }, flOn: 0, flOld: 1, flTag: '2019', flAng: -2.1 + .35 * clk, noLegs: true });
    const q = V2.at(POS.brenda[0], POS.brenda[1]), seat = V2.p2(POS.brenda[0], 96, POS.brenda[1]);
    Object.assign(o, { x: q.x, y: seat[1] + 12 * q.s, s: q.s * 1.04 });
    C.brenda = o; }
  /* MANGO: the phone light in her left hand, wobbling across the wall; off during the generator; on again at 27.04, passed to the right hand for the sweep that finds Brenda */
  { const tw = toward('mango', spk === 'mango' ? 'straw' : attn, .3), sweep = lt >= CUE.flash[1], u = sg(lt, CUE.flash[1], CUE.flash[1] + .25);
    const on = lt < 13.7 ? (lt >= CUE.flash[0] - 1e-6 ? (.6 + .4 * ss(lt, CUE.flash[0], CUE.flash[0] + .08)) * (1 - ss(lt, 13.3, 13.7)) : 0) : sweep ? 1 : 0;
    const wob = .13 * Math.sin(lt * 1.5 + 1) + .06 * Math.sin(lt * 3.9), pt = lt >= 20.88 && lt < 21.95;
    let o = person(A7.mango, () => PX.mango, lt, { t: lt, yaw: tw.yaw, headYaw: tw.headYaw, look: lt >= 20.88 && lt < 23.6 ? [-.7, .1] : tw.look, expr: pt ? 'shock' : 'neutral', who: 'mango', plOn: on, plAng: PI + .62 + wob,
      arms: sweep ? { l: 'rest', r: 'hold' } : { l: 'hold', r: pt ? 'point' : 'rest' }, grip: sweep ? { r: [98, 96] } : { l: PHG }, hold: sweep ? { r: 'fp20_phonelight' } : { l: 'fp20_phonelight' } });
    if (sweep) { const hp = P20.phonePose(o, lt), bf = faceC(C.brenda), tgt = Math.atan2(bf[1] + 46 * C.brenda.s - hp.hy, bf[0] - hp.hx); o.plAng = lerp(-2.4, tgt, eo(u)); }
    C.mango = o; }
  return C;
}
B.castI = castI;
/* Brenda's chair: the back and posts behind her, the seat front over her lap */
function chairBack(o) {
  const s = o.s, x = o.x, y = o.y; ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#4a3a30'; ctx.strokeStyle = 'rgba(15,10,20,.85)'; ctx.lineWidth = 3.4;
  rr(x - 92 * s, y - 250 * s, 184 * s, 230 * s, 14 * s); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5c4a3c'; rr(x - 78 * s, y - 238 * s, 156 * s, 200 * s, 10 * s); ctx.fill();
  ctx.fillStyle = '#3a2c24'; ctx.fillRect(x - 86 * s, y - 20 * s, 12 * s, 90 * s); ctx.fillRect(x + 74 * s, y - 20 * s, 12 * s, 90 * s);
  ctx.restore();
}
function chairFront(o) {
  const s = o.s, x = o.x, y = o.y; ctx.save(); ctx.lineJoin = 'round';
  ctx.fillStyle = '#6a5444'; ctx.strokeStyle = 'rgba(15,10,20,.85)'; ctx.lineWidth = 3.4;
  rr(x - 100 * s, y - 10 * s, 200 * s, 30 * s, 8 * s); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a2c24'; ctx.fillRect(x - 92 * s, y + 18 * s, 14 * s, 80 * s); ctx.fillRect(x + 78 * s, y + 18 * s, 14 * s, 80 * s);
  ctx.restore();
}
function chairArms(o) {   /* two wooden armrests at her sides, over the body */
  const s = o.s, x = o.x, y = o.y; ctx.save(); ctx.lineJoin = 'round'; ctx.fillStyle = '#5a463a'; ctx.strokeStyle = 'rgba(15,10,20,.85)'; ctx.lineWidth = 3;
  for (const sd of [-1, 1]) { rr(x + sd * 104 * s - 14 * s, y - 70 * s, 28 * s, 16 * s, 6 * s); ctx.fill(); ctx.stroke(); ctx.fillRect(x + sd * 104 * s - 5 * s, y - 56 * s, 10 * s, 70 * s); }
  ctx.restore();
}
B.chairBack = chairBack; B.chairFront = chairFront; B.chairArms = chairArms;
/* draw something at a SCREEN position and size under the current camera (a foreground object: it is lit by the pass like everything else) */
function atScreen(sx, sy, S, fn) {
  const m = ctx.getTransform(), z = Math.hypot(m.a, m.b) || 1, p = toScene(sx, sy);
  ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(S / z, S / z); fn(S / z, p); ctx.restore();
  return p;
}
B.atScreen = atScreen;
/* the foreground candles of a close-up: three LED candles in a row at the bottom of the frame, the flame of each coming on at its click */
const FGC = [{ x: 150, y: 1372, s: 2.1 }, { x: 540, y: 1384, s: 1.9 }, { x: 930, y: 1372, s: 2.1 }];
function fgCandles(lt, sh, out) {
  for (let i = 0; i < 3; i++) {
    if (i === 1 && sh.id === 'o4') continue;
    const c = FGC[i], on = ss(lt, CUE.candle[i], CUE.candle[i] + .15), pos = atScreen(c.x, c.y, c.s * 1.0, (k, p) => {
      const r = P20.ledCandle(ctx, { x: 0, y: 0, s: 1, on, t: lt, seed: i + 1, kind: 'pillar', sticker: 0, glow: 0 });
      out.push({ i, on, fx: r.fx * k + p[0], fy: r.fy * k + p[1] });
    });
  }
}
B.fgCandles = fgCandles;
})();
(() => {
/* ---- block 5: the lights, the camera, the drawing of the interior shots */
const B = window.__BLK; if (!B) return;
const { person, zoomTo, faceC } = window.H6;
const { c01, sg, ss, eo, eb, hnoise, pulse, key, lg, CUE, T_SW, T_SWSTOP, snapT, bS, bE, wS, wE, LN, START, POS, SH, shotAt, toScr, toScene, inMask, atScreen, fgCandles } = B;
const PI = Math.PI;
const kz = Z => V2.P.f / (Z - V2.P.cz);
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixh = (a, b, k) => hex(V2.mix(a, b, c01(k)));
const FR = B.FR = { sh: SH[0], C: null, bind: null, lights: [] };

/* the wall candles of the wide shots: three LED candles on the whiteboard's ledge (the foreground ones of the close-ups are the same three, nearer) */
const WALLC = [[-120, 410], [10, 410], [140, 410]];
const boxOf = (o, pad = 30) => { const k = KINDS[o.kind], s = o.s || 1, leg = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (leg + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = k.rx * 1.12 * s + pad * s; return [o.x - half, top, o.x + half, o.y + 24 * s]; };
function inFrame(o, pad) {
  const b = boxOf(o, pad), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6, box: [x0, y0, x1, y1] };
}
B.inFrame = inFrame;

// ------------------------------------------------------------------ Binder in the world: a clip on Strawberry's lanyard, then up and out (his screen pose is fixed in the bubble shots)
const BIG = { x: 300, y: 1040, S: 1.75 };
B.BIG = BIG;
function bindPose(lt, sh, C) {
  if (!sh.bub && !sh.bsmall) return null;
  if (lt < CUE.binderpop - .02 || lt >= 9.6) { if (!(sh.bsmall && lt < CUE.binderpop)) return null; }
  const st = C.straw, [fx, fy] = faceC(st), s = st.s, pop = sg(lt, CUE.binderpop, CUE.binderpop + .3);
  if (sh.id === 'r1') {                                                  /* the clip on the lanyard at her chest, asleep until the pop */
    if (lt < CUE.binderpop) { const p = toScr(fx + 4 * s, fy + 122 * s); return { sx: p[0], sy: p[1], S: .24 * 2.4 * s / .85, asleep: 1, pop: 0, small: 1 }; }
    const p0 = toScr(fx + 4 * s, fy + 122 * s), p1 = toScr(fx - 150 * s, fy + 40 * s);
    return { sx: lerp(p0[0], p1[0], eo(pop)), sy: lerp(p0[1], p1[1], eo(pop)) - 40 * Math.sin(PI * pop), S: lerp(.5, 1.0, eb(pop)), pop, small: 0 };
  }
  const dr = ss(lt, CUE.lowbattery, CUE.lowbattery + .6), bob = Math.sin(lt * 3.1) * 7;
  return { sx: BIG.x, sy: BIG.y + bob + 18 * dr, S: BIG.S * (lt < 5.43 + .25 ? eb(c01((lt - 5.43) / .25 + .0)) * .5 + .5 : 1), pop: 1, small: 0, droop: dr };
}
B.bindPose = bindPose;
function drawBinder(lt, sh, C) {
  const bp = bindPose(lt, sh, C); FR.bind = null; if (!bp) return;
  const spk = lt >= 5.43 && lt < 9.1, dying = lt >= CUE.lowbattery;
  const lowK = bp.droop || 0;
  let rec = null;
  atScreen(bp.sx, bp.sy, bp.S, (k, p) => {
    if (bp.S * k <= 0.02 * 0 && false) return;
    const o = A15.binder({ x: 0, y: 0, s: 1, center: true, noLegs: true, who: 'bind', t: lt, yaw: bp.small ? 0 : -.2, pose: bp.small ? 'rest' : dying ? 'rest' : 'helpful', grin: bp.small ? 0 : (spk ? .15 : .05), look: bp.asleep ? [0, .9] : dying ? [.1, .9] : [.55, -.15], lid: bp.asleep ? .95 : lowK * .65, hover: 8, bob: bp.small ? .3 : 1 });
    drawChar(o);
    if (lt >= CUE.binderpop && lt < CUE.binderpop + .42) V2.ring(0, 0, (lt - CUE.binderpop) / .42, { r0: 30, r1: 230, color: '190,220,255', lw: 8, alpha: .9, bloom: 0 });
    rec = p;
  });
  if (rec) FR.bind = { sx: bp.sx, sy: bp.sy, S: bp.S, p: rec };
}

// ------------------------------------------------------------------ the lights of the room (the L20 format; positions in scene units)
function lightsFor(lt, sh, C, R) {
  const L = [], k = kz(S13.LAY.zb), kk = k / .7;
  const emR = ss(lt, 12.9, 13.2) * (1 - .18 * Math.sin(PI * sg(lt, 13.0, 13.1))), hall = ss(lt, CUE.relay2, 13.7), gen = ss(lt, 12.9, 13.7);
  const sob = Math.max(0, 1 - Math.abs(lt - CUE.sniffle[0] - .12) / .5, 1 - Math.abs(lt - CUE.sniffle[1] - .12) / .5);
  /* the window: snow light, a pale blue rect (small: it is a glow, not a lamp) */
  if (R.window) { const w = R.window; L.push({ kind: 'rect', x: w[0] + w[2] / 2, y: w[1] + w[3] / 2, w: w[2], h: w[3], color: '#9ab8f4', power: .34, facing: PI / 2, soft: .6 }); }
  /* the exit sign over the doorway (it hums brighter at the generator) and the twin battery lamp */
  if (R.exitAt) L.push({ kind: 'point', x: R.exitAt[0], y: R.exitAt[1] + 40, r: 330 * kk, color: '#38ff7a', power: .5 + .3 * ss(lt, CUE.genstart, CUE.genstart + .5), soft: .8 });
  const lampPow = .3 + .7 * emR;
  for (const h of (R.lampHeads || [])) L.push({ kind: 'cone', x: h.x, y: h.y + 12, ang: h.ang, spread: .8, len: 820 * kk, color: '#ff8a44', power: lampPow * .8, soft: .8 });
  /* the ceiling lights, dim and warm, from the relay at 13.13 */
  if (hall > .01) for (const [X, Z] of [[-330, 900], [330, 900], [-330, 1500], [330, 1500]]) { const q = V2.p2(X, 700, Z); L.push({ kind: 'cone', x: q[0], y: q[1] - 60, ang: PI / 2, spread: 1.7, len: 760 * kz(Z) / .7, color: '#ffc896', power: .26 * hall, soft: .9 }); }
  /* the stopwatch (aqua), held by Onion; it shivers when she sobs */
  if (C && C.onion && C.onion.hold && C.onion.hold.l === 'fp20_stopwatch') { const p = P20.stopwatchPose(C.onion, lt), on = ss(lt, T_SW, T_SW + .12) * (lt < T_SWSTOP + .9 ? 1 : .6); if (on > .01) L.push({ kind: 'point', x: p.x + 4 * sob * Math.sin(lt * 70), y: p.y + 62 * (C.onion.s || 1) * (C.onion.swScale || 1), r: 400 * kk * (sh.sw ? 1.1 : 1), color: '#59f0d6', power: (sh.sw ? .7 : .85) * on * (1 - .28 * sob), soft: .75 }); }
  /* Mango's phone: a white cone, wobbling across the wall */
  if (C && C.mango && C.mango.plOn > .01) { const p = P20.phonePose(C.mango, lt); L.push({ kind: 'cone', x: p.x, y: p.y, ang: p.ang, spread: .62, len: 1100 * kk, color: '#eef4ff', power: .9 * C.mango.plOn, soft: .55 }); }
  /* Binder's bubble: the cool white-blue light of the only screen in the room (it dips once at the low battery and dies) */
  if (FR.bind) { const on = ss(lt, CUE.binderpop, CUE.binderpop + .22) * (1 - ss(lt, CUE.lowbattery + .1, CUE.lowbattery + .32)), dip = lt >= CUE.lowbattery && lt < CUE.lowbattery + .08 ? .45 : 1, p = FR.bind.p;
    if (on > .01) L.push({ kind: 'point', x: p[0] + 190, y: p[1] - 110, r: 470, color: '#c4dcff', power: .95 * on * dip, soft: .8 }); }
  if (sh.k === 'w' && lt >= CUE.flash[1] + .1 && C && C.brenda) { const bf = faceC(C.brenda); L.push({ kind: 'point', x: bf[0], y: bf[1] + 40, r: 230, color: '#ffe2c8', power: .8, soft: .8 }); }
  /* the candles: warm points at the flames (foreground ones in a close-up, the ledge ones in a wide) */
  const sting = 1 + .18 * Math.max(0, 1 - Math.abs(lt - CUE.sting - .1) / .25);
  for (const c of (FR.candleLights || [])) if (c.on > .01) L.push({ kind: 'point', x: c.fx, y: c.fy, r: (sh.k === 'w' ? 210 : 300), color: '#ffb25a', power: (sh.k === 'w' ? .55 : .7) * c.on * sting, soft: .8, flicker: { seed: c.i + 3, amt: .06, rate: .9 } });
  /* a motivated fill on the face that matters in a close-up, so a speaking face is always lit by something in the frame */
  if (sh.k === 'cu' || sh.k === 'two') { const ids = Array.isArray(sh.foc) ? sh.foc : [sh.foc];
    for (const id of ids) { const o = C[id]; if (!o) continue; const f = faceC(o), s = o.s, warm = lt >= CUE.candle[0] + .1;
      const col = id === 'brenda' ? '#ffd8bc' : warm ? '#ffb86a' : lt < 12.9 ? '#59f0d6' : '#ff9a60', pw = (id === 'brenda' ? .55 : .3) * (warm ? 1 : lt < 5.28 ? 1 : .4) * (sh.bub ? 0 : 1);
      if (pw > .02) L.push({ kind: 'point', x: f[0] - 30 * s, y: f[1] + 110 * s, r: 215 * s / .85, color: col, power: pw * .8, soft: .85 }); } }
  return L;
}
B.lightsFor = lightsFor;
function passParams(lt, sh) {
  const gen = ss(lt, 12.9, 13.4);
  return { ambient: lerp(sh.bub ? .12 : .14, .3, gen), tint: mixh('#050b26', '#2a0a0c', gen), bloom: .55, vignette: .32, lift: .08, glow: .34 };
}
B.passParams = passParams;

// ------------------------------------------------------------------ the camera (the perspective first, then the cast under it, then the 2D framing) and the draw
function camI(lt) {
  const sh = shotAt(lt); FR.sh = sh; FR.C = null; FR.candleLights = [];
  if (sh.k === 'cut') { B.camCut(lt); return; }
  if (sh.k === 'wall') { zoomTo(540, 960, 1); return; }
  S13.cam('station', { cz: -390, cx: sh.cx ?? 85, cy: 380 });
  const C = B.castI(lt, sh); FR.C = C;
  const u = ss(lt, sh.s, Math.min(sh.e, sh.s + 3)), z = lerp(sh.z, sh.z2 ?? sh.z, u);
  if (sh.k === 'w') zoomTo(sh.x ?? 540, sh.y ?? 1040, z);
  else if (sh.k === 'sw') { const p = P20.stopwatchPose(C.onion, lt); zoomTo(p.x + (sh.fx || 0) / z, p.y + (sh.fy || 0) / z, z); }
  else if (sh.k === 'two') { const a = faceC(C[sh.foc[0]]), b = faceC(C[sh.foc[1]]); zoomTo((a[0] + b[0]) / 2 - (sh.dx || 0) / z, (a[1] + b[1]) / 2 + (sh.up ?? 70) / z, z); }
  else { const [fx, fy] = faceC(C[sh.foc]); zoomTo(fx, fy + (sh.up ?? 70) / z, z); CAM.x -= (sh.dx || 0) / z; }
  const sway = { x: 2.2 * hnoise(lt, 1.3, 1), y: 1.6 * hnoise(lt, 1.1, 2), r: .0015 * hnoise(lt, .9, 3) };
  const shud = pulse(lt, CUE.genstart + .115, 30, .06) * 2.4 / CAM.z;                       /* the generator coughs: the whole picture shudders 2 px once at 12.45 */
  CAM.x += sway.x + shud * .6; CAM.y += sway.y + shud; CAM.r += sway.r;
}
function drawI(lt) {
  const { sh, C } = FR;
  const gen = ss(lt, 12.9, 13.7), hall = ss(lt, CUE.relay2, 13.7), emR = ss(lt, 12.9, 13.35);
  S13.light('night', { keyA: .12, rimA: .55 });
  V2.opts.reflect = false;
  const o = { lampOn: .55 + .45 * emR };
  const room = () => { B.drawRoomI(lt, sh, o); };
  if (sh.dof) V2.dof(sh.dof, room); else room();
  FR.candleLights = [];
  /* the wall candles (wides) stand on the ledge under the whiteboard, from their clicks on */
  if (sh.k === 'w' && lt >= CUE.candle[0] - .2) for (let i = 0; i < 3; i++) {
    const on = ss(lt, CUE.candle[i], CUE.candle[i] + .15), q = V2.p2(WALLC[i][0], WALLC[i][1], 1890), r = P20.ledCandle(ctx, { x: q[0], y: q[1], s: kz(1890) * 1.05, on, t: lt, seed: i + 1, kind: 'pillar', glow: 0 });
    FR.candleLights.push({ i, on, fx: r.fx, fy: r.fy });
  }
  /* Brenda and her chair, behind the cast */
  const order = ['tom', 'straw', 'lemon', 'onion', 'mango'].map(n => [n, C[n]]).sort((a, b) => a[1].y - b[1].y);
  const br = C.brenda, bf = inFrame(br, 8), showB = lt >= CUE.flash[1] - .04 && bf.inter && (bf.whole || sh.foc === 'brenda');
  if (showB) { B.chairBack(br); drawChar(br); B.chairArms(br); }
  for (const [n, c] of order) {
    const f = inFrame(c, sh.k === 'w' ? 8 : 30), foc = n === sh.foc || (Array.isArray(sh.foc) && sh.foc.includes(n));
    if (sh.bub && !foc) continue;
    if (!foc && (!f.inter || ((sh.k !== 'w' || sh.whole) && !f.whole))) continue;
    drawChar(c);
  }
  drawBinder(lt, sh, C);
  { const cp = C.onion && P20.candlePose(C.onion, lt); if (cp) FR.candleLights.push({ i: 1, on: 1, fx: cp.x, fy: cp.y }); }
  /* the foreground of a close-up: the three candles at the bottom of the frame */
  if (sh.candles && sh.k !== 'w' && lt >= CUE.candle[0] - .2) fgCandles(lt, sh, FR.candleLights);
  if (sh.coffee) B.fgCoffee(lt, sh);
  /* the light itself */
  const R = { window: o.window, exitAt: o.exitAt, lampHeads: o.lampHeads };
  if (!inMask() && window.L20 && L20.pass) L20.pass(ctx, Object.assign({ t: lt, lights: lightsFor(lt, sh, C, R) }, passParams(lt, sh)));
  if (!inMask() && sh.fin) V2.glow(0, 0, 0, '0,0,0', 0);
}
B.camI = camI; B.drawI = drawI;
})();
(() => {
/* ---- block 6: the foreground coffee maker, the wall insert (outlets), the bubble, the scene object */
const B = window.__BLK; if (!B) return;
const { zoomTo, faceC } = window.H6;
const { c01, sg, ss, eo, eb, hnoise, pulse, lg, CUE, T_SW, snapT, bS, bE, wS, wE, LN, START, SH, shotAt, toScr, toScene, inMask, atScreen, FR } = B;
const PI = Math.PI;

// ------------------------------------------------------------------ the dead coffee maker in the foreground of Strawberry's long look (s3)
B.fgCoffee = (lt, sh) => atScreen(850, 1336, 1.7, k => { P20.coffeeMaker(ctx, { x: 0, y: 0, s: 1, power: 0, display: '--:--', pot: .55, sad: 1, t: lt, hero: false }); });

// ------------------------------------------------------------------ the wall insert (21.95 - 23.63): a white outlet with the coffee maker's plug, a RED one with the oxygen concentrator's, Mango's beam
function concentrator(x, y, s, lt) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const INK = 'rgba(20,14,26,.86)';
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 150, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(-130, -330, 130, 0, [[0, '#eef2f4'], [1, '#aeb8c2']]); rr(-130, -330, 260, 326, 22); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#7c8794'; rr(-60, -352, 120, 26, 12); ctx.fill(); ctx.stroke();                                         /* the handle */
  ctx.fillStyle = '#2f3844'; rr(-100, -290, 200, 96, 10); ctx.fill(); ctx.stroke();                                         /* the display panel */
  ctx.fillStyle = '#3acb78'; ctx.beginPath(); ctx.arc(-66, -242, 12, 0, TAU); ctx.fill();
  ctx.fillStyle = '#9dffc4'; for (let i = 0; i < 3; i++) ctx.fillRect(-36 + i * 40, -258 + (i % 2) * 6, 26, 8 + i * 8);
  ctx.fillStyle = '#d9dee4'; ctx.beginPath(); ctx.arc(-46, -130, 36, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#4a5260'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-46, -130); ctx.lineTo(-30, -150); ctx.stroke();   /* the flow dial */
  ctx.fillStyle = '#8aa0b4'; rr(30, -150, 64, 40, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke();      /* the outlet nozzle */
  ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(94, -130); ctx.bezierCurveTo(180, -120, 196, -40, 150, -8); ctx.stroke(); ctx.strokeStyle = 'rgba(180,230,255,.75)'; ctx.lineWidth = 6; ctx.stroke();   /* the tubing */
  ctx.fillStyle = '#3a3f4a'; for (const wx of [-96, 96]) { ctx.beginPath(); ctx.arc(wx, -2, 12, 0, TAU); ctx.fill(); }
  V2.glow(-66, -242, 60, '58,255,140', .5, 'screen', .2);
  ctx.restore();
}
function drawWall(lt) {
  const g = ctx, t = lt - bS('m1');
  g.fillStyle = lg(0, 0, 0, 1400, [[0, '#86a2aa'], [1, '#6f8a96']]); g.fillRect(-60, -60, W + 120, 1500);
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let x = 40; x < W; x += 120) g.fillRect(x, 0, 2, 1000);
  g.fillStyle = '#3f6470'; g.fillRect(-60, 1010, W + 120, 380); g.fillStyle = '#dbe4e6'; g.fillRect(-60, 1000, W + 120, 14);
  g.fillStyle = '#2b3a44'; g.fillRect(-60, 1380, W + 120, 60); g.fillStyle = '#4a4860'; g.fillRect(-60, 1440, W + 120, 520);
  /* the side table with the coffee maker */
  g.fillStyle = '#8a6a48'; rr(40, 1190, 520, 30, 8); g.fill(); g.strokeStyle = 'rgba(20,14,26,.8)'; g.lineWidth = 3.4; g.stroke(); g.fillStyle = '#6a4e34'; g.fillRect(70, 1220, 26, 170); g.fillRect(504, 1220, 26, 170);
  const mk = { x: 300, y: 1190, s: 1.45 }, dying = ss(lt, 22.35, 22.9), pw = lt < 22.5 ? 1 : 0;
  const cordAt = [mk.x + 100 * mk.s, mk.y - 20 * mk.s];
  P20.outlet(g, { x: 300, y: 380, s: 1.55, color: 'white', plug: 'coffee', cordTo: cordAt, label: false, t: lt });
  P20.coffeeMaker(g, { x: mk.x, y: mk.y, s: mk.s, power: pw, display: pw ? '12:00' : '--:--', pot: .6, sad: dying, t: lt, hero: false });
  const concX = 800, concY = 1380;
  P20.outlet(g, { x: 800, y: 380, s: 1.55, color: 'red', plug: 'oxygen', cordTo: [concX - 4, concY - 330 * 1.0 + 12], t: lt, hero: true });
  concentrator(concX, concY, 1.0, lt);
  /* the lights: Mango's phone beam from the left edge (it finds the white outlet, then the red one at "red"), a candle glow, the red lamp */
  const toRed = ss(lt, wS('m1', 7) - .12, wS('m1', 7) + .12), ang = lerp(-.92, -.5, toRed) + .03 * Math.sin(lt * 5);
  const lights = [
    { kind: 'cone', x: -70, y: 900, ang, spread: .6, len: 1500, color: '#eef4ff', power: .95, soft: .55 },
    { kind: 'point', x: 540, y: 1290, r: 640, color: '#ffb25a', power: .55, soft: .7, flicker: { seed: 4, amt: .06, rate: .9 } },
    { kind: 'point', x: 960, y: 120, r: 720, color: '#ff9650', power: .5, soft: .8 },
    { kind: 'point', x: 800, y: 860, r: 400, color: '#38ff7a', power: .12 + .2 * toRed, soft: .8 },
  ];
  if (!inMask() && window.L20 && L20.pass) L20.pass(g, { t: lt, ambient: .3, tint: '#240c10', bloom: .5, vignette: .34, lift: .1, glow: .3, lights, grade: { color: '#ff5a24', alpha: .1, mode: 'soft-light' } });
}
B.drawWall = drawWall;

// ------------------------------------------------------------------ Binder's bubble (screen space, in over()): the only bright thing in the room
const BTXT1 = "It looks like you're in the dark. Would you like help?", BTXT2 = "Great! I'll...";
const BUBX = 110, BUBW = 860, BUBBOT = 700;
function typedAtL(id, text, lt) {   /* the share of the letters of `text` shown at lt, in step with the spoken words of line `id` */
  const L = LN[id]; if (!L) return 1;
  const words = L.words, n = text.length; let shown = 0, pos = 0;
  for (let i = 0; i < words.length; i++) {
    const clean = words[i][0].replace(/[^A-Za-z']/g, ''), w = text.indexOf(clean, pos), ws = wS(id, i) - .04, we = wE(id, i); if (w < 0) continue;
    if (lt < ws) break;
    const end = w + clean.length;
    shown = Math.max(shown, lerp(w, end, c01((lt - ws) / Math.max(.05, we - ws))));
    pos = end;
  }
  return lt >= wE(id, words.length - 1) ? 1 : c01(shown / n);
}
function bubbleOpts(lt) {
  const o = { w: BUBW, s: 1, size: 42, name: 'Binder', buttons: [{ id: 'yes', t: 'YES', def: true }, { id: 'no', t: 'NO' }] };
  const second = lt >= bS('b2'); o.text = second ? BTXT2 : BTXT1;
  const h = SH15.binderRect(Object.assign({ at: [0, 0] }, o)).h; o.at = [BUBX, BUBBOT - h];
  o.typed = second ? typedAtL('b2', BTXT2, lt) : typedAtL('b1', BTXT1, lt);
  o.pop = ss(lt, bS('b1'), bS('b1') + .3);
  const tx = FR.bind ? FR.bind.sx + 30 : 330, ty = FR.bind ? FR.bind.sy - 120 * (FR.bind.S || 1) : 900;
  o.tail = [tx, ty];
  const py = c01((lt - 7.52) / .2); if (lt >= 7.52 && lt < 7.8) o.press = { id: 'yes', k: Math.sin(PI * c01((lt - 7.52) / .26)) };
  return o;
}
function overBubble(lt, sh) {
  if (lt < bS('b1') || lt >= 9.6) return;
  const dying = lt >= CUE.lowbattery, a = dying ? (lt < CUE.lowbattery + .08 ? .4 : lt < CUE.lowbattery + .2 ? .95 : 1 - ss(lt, CUE.lowbattery + .2, CUE.lowbattery + .42)) : 1;
  if (a <= .01) return;
  const bo = bubbleOpts(lt), g = SH15.binderRect(bo);
  ctx.save(); ctx.globalAlpha *= a;
  /* a cool glow round the screen */
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.radial(540, g.y + g.h / 2, 80, 760, [[0, 'rgba(150,200,255,.28)'], [1, 'rgba(150,200,255,0)']]); ctx.fillRect(0, g.y - 600, W, g.h + 1200); ctx.globalCompositeOperation = 'source-over';
  const res = SH15.binder(bo, lt);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#cfe2ff'; ctx.fillRect(g.x - 4, g.y - 4, g.w + 8, g.h + 8); ctx.globalCompositeOperation = 'source-over';   /* the white panel takes the cold light */
  /* the pointer: it comes up from below and hovers over YES (this time the NO button stays where it is) */
  if (lt >= 6.35 && lt < 8.0) {
    const yes = SH15.binderRect(bo, 'yes');
    if (yes) { const u = ss(lt, 6.35, 7.2), px = lerp(yes.x - 90, yes.x + yes.w * .86, u), py = lerp(yes.y + yes.h + 190, yes.y + yes.h * .84, u), press = lt >= 7.52 && lt < 7.8 ? Math.sin(PI * c01((lt - 7.52) / .26)) : 0;
      SH15.pointer(px, py + (press ? 3 : 0), { kind: 'arrow', press, s: 1.7 }); }
  }
  ctx.restore();
  /* the low battery: a red pill and a battery that is almost empty */
  if (dying) {
    const pa = ss(lt, CUE.lowbattery + .02, CUE.lowbattery + .1) * (1 - ss(lt, CUE.lowbattery + .24, CUE.lowbattery + .4));
    if (pa > .01) {
      ctx.save(); ctx.globalAlpha *= pa;
      const cx = 540, cy = BUBBOT + 64; ctx.lineJoin = 'round';
      ctx.fillStyle = '#fff'; rr(cx - 224, cy - 22, 60, 36, 6); ctx.fill(); ctx.strokeStyle = '#d6202c'; ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = '#d6202c'; ctx.fillRect(cx - 214, cy - 14, 10, 20); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 163, cy - 10, 8, 14);
      UI.pill('LOW BATTERY', cx + 20, cy - 4, { size: 40, fill: '#d6202c', ink: '#fff', stroke: '#6a0e14', lw: 3, hero: true });
      ctx.restore();
    }
  }
}

// ------------------------------------------------------------------ the scene
const SC = {
  shot: lt => shotAt(lt).id,
  cam: lt => B.camI(lt),
  draw: lt => { const sh = FR.sh; if (sh.k === 'cut') B.drawCut(lt); else if (sh.k === 'wall') B.drawWall(lt); else B.drawI(lt); },
  fx: lt => ({ bloom: .62, vignette: .36, grain: .05, contrast: .12, sat: .06 }),
  blur: lt => 1,
  over: lt => { const sh = FR.sh; if (sh.bub) overBubble(lt, sh); if (sh.k !== 'cut' && window.L20 && L20.emergency) { const lv = ss(lt, 13.2, 13.8) * .5; if (lv > .01) L20.emergency(ctx, { level: lv, t: lt, pulse: .12 }); } },
};
window.__EP20_SCENES = window.__EP20_SCENES || {};
window.__EP20_SCENES.blackout = SC;
})();
