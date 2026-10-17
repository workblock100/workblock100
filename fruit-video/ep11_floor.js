'use strict';
/* SHIFT HAPPENS, Episode 11: Welcome Back. Scene module: floor (5:32 PM, THE FLOOR).
 *
 * The split screen of Episode 9 turned inside out. TOP panel: the hall, where the new hire Clementine sprints around on twenty-eight lit call lights (a linen tower on her head,
 * a rolling IV pole in pursuit, a price tag flapping behind her, a wheelchair she sends spinning). BOTTOM panel: the spa lounge, where Strawberry, per diem, sits out her "break"
 * (cucumbers, clay mask, iced coffee). The divider band carries two meters: the PER DIEM money odometer ($118/HR) and the new GUILT thermometer, which fills on each of Clementine's pleas.
 * Two time-lapses (7:45 PM, 9:30 PM) advance the clock pill, the meters, the sun and moon in the lounge window and the lit call lights. On the snap the thermometer bursts, the cucumbers
 * fly, Strawberry sits bolt upright in slow motion; on the run she rockets up through the divider (the band and the lounge shatter like glass) into the hall and the two nurses sprint away together.
 *
 * Every position in a panel is a world coordinate (X right, Z forward) from V2.at(X, Z) under that panel's own camera (V2.setCam); the panels are clipped rectangles with their own 2D framing.
 * Layout (y): clock pill 116-184, place label 196-242, TOP panel 262-764, BAND 764-896 (meters 100 px tall, 16 px of clear band above and below), BOTTOM panel 896-1372, speaker chip from 1386.
 *
 * Shot list (scene-local seconds):
 *   0.20  open    seam flash, the panels wipe open (whoosh 0.20), DING 0.35 (first call lights), BWEEP 0.70 (bed alarm): HALL wide: Clementine sprints at us with the tower, the IV pole after her / LOUNGE locked off
 *   1.60  c1      HALL: she skids in front of Room 9, the pole bonks, the tower explodes into sheets, she shouts into the comm badge / LOUNGE: she sips, brow twitch
 *   3.51  s1      HALL: freeze, the badge rings back / LOUNGE: "That's not in my contract." (phone voice), guilt ticks up
 *   5.19  c2      HALL: ping-pong between the door frames (BONK, BONK) / LOUNGE: toe flex
 *   6.35  s2      HALL: she skids to a stop and stares / LOUNGE: "Helping."
 *   7.46  lapse1  TIME-LAPSE: clock to 7:45, sun sets in the lounge window, giant clock hands over both panels, hall route a blur of ghosts, lights multiply, CHA-CHING 8.36 ($560.50)
 *   9.16  m1      HALL: panting, the pole nudges her / LOUNGE: Mango walks in and says it (robe and turban have arrived, a third cup)
 *   11.16 c3      HALL: she sends the wheelchair (Mrs. Cranberry riding) spinning / LOUNGE: sip
 *   12.83 s3      HALL: dizzy stars, the board hits 28/28 / LOUNGE: twelve zZz bubbles pop over twelve doors
 *   14.96 lapse2  TIME-LAPSE: 9:30 PM, moonrise, stars, candle burns down, CHA-CHING 15.76 ($767.00)
 *   16.46 c4      HALL: close-up push-in, puppy eyes / LOUNGE: a gulp of coffee, guilt 70%
 *   17.80 s4,s5   HALL: she sinks into the sheets, the pole leans on her / LOUNGE: out loud, twice, the mask begins to crack
 *   21.07 snap    HALL: she looks up, frozen / LOUNGE: BOING 21.17: the thermometer bursts, the cucumbers fly in two arcs, slow-motion push-in, she sits bolt upright
 *   21.93 s6      LOUNGE: she hops out of the chair, shouts, crouches / HALL: Clementine bounces up with hope
 *   23.47 run     she launches straight up through the divider (whoosh 23.47): band + lounge shatter, one wide hall, SCRAMBLE 23.57, both nurses sprint away down the hall
 */
(() => {
if (!window.TIMELINE_EP11) return;
const { runner, inB, faceC, zoomTo } = window.H6;
const A6 = window.A6, S6 = window.S6, S7 = window.S7, A7 = window.A7, A10 = window.A10, A11 = window.A11;

// ------------------------------------------------------------------ helpers (copies of the Episode 9 floor ones)
// scene-relative time of a spoken word, from the recorded line's word timings (falls back to a guess if the line is missing)
const wordT = (id, word, fb) => { const l = TL.lines.find(q => q.scene === CUR.id && q.id === id), w = l && l.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '').includes(word)); return w ? l.s - CUR.start + w[1] : fb; };
// a route through keyed positions [t, X, Z, ease]: linear travel between keys, 'io' or 'out' to ease a leg
const route = keys => lt => {
  if (lt <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) { const a = keys[i - 1], b = keys[i], k = seg(lt, a[0], b[0]), e = b[3] === 'io' ? easeIO(k) : b[3] === 'out' ? easeOut(k) : b[3] === 'in' ? k * k : k; return [lerp(a[1], b[1], e), lerp(a[2], b[2], e)]; }
  const l = keys[keys.length - 1]; return [l[1], l[2]];
};
// an onomatopoeia that pops in and fades
function sfxWord(lt, t0, str, x, y, o = {}) {
  const k = seg(lt, t0, t0 + .14), f = 1 - seg(lt, t0 + (o.hold ?? .5), t0 + (o.hold ?? .5) + .2);
  if (k <= 0 || f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(x, y); ctx.scale(lerp(1.25, 1, easeOut(k)), lerp(1.25, 1, easeOut(k))); ctx.rotate(o.rot ?? -.08);
  text(str, 0, 0, { size: o.size ?? 130, font: 'Bangers', weight: 400, fill: o.fill ?? '#ffe135', lw: 14, stroke: '#150f22', spacing: 3, shadow: 14 }); ctx.restore();
}
const pk = (lt, list) => list.find(([e]) => lt < e)[1];            // the first entry whose end time is still ahead
const sk = (lt, a, b) => easeIO(seg(lt, a, b));
const L2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const mixc = (a, b, t) => V2.rgba(V2.mix(a, b, clamp(t)), 1);       // a CSS colour between two hex colours
const mixh = (a, b, t) => '#' + V2.mix(a, b, clamp(t)).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');   // the same as a hex string (the S6 sets only parse hex)
const pulse = (lt, t0, dur) => { const k = (lt - t0) / dur; return k > 0 && k < 1 ? Math.sin(k * PI) : 0; };   // a one-off bump
let NOBLOOM = false;                                           // set while the frozen slab is rendered off screen: its emitters would land in the wrong place of the bloom layer
const glow11 = (x, y, r, c, a, mode = 'screen', bloom = .35) => V2.glow(x, y, r, c, a, mode, NOBLOOM ? 0 : bloom);
const COL = { clem: '#ff8a1a', straw: '#ff3b55', mango: '#ff9f1c', money: '#6dff9a', guilt: '#ff5a7a' };

// ------------------------------------------------------------------ layout: two panels and the divider band between them
const TOP = [262, 764], BAND = [764, 896], BOT = [896, 1372];
const TMID = (TOP[0] + TOP[1]) / 2;
const b = id => B(id);

// ------------------------------------------------------------------ the clock, the money and the guilt (all pure functions of scene time)
const MIN = [17 * 60 + 32, 19 * 60 + 45, 21 * 60 + 30];       // 5:32 PM, 7:45 PM, 9:30 PM
const HRS = [2.53, 4.75, 6.5];                                 // hours since 3:00 PM at those clock times: the same totals Persimmon's meter showed in Episode 9
const CHA = { lapse1: .9, lapse2: .8 };                        // the frozen cha-ching cue offsets inside the two pause beats
const lapIdx = lt => lt < b('lapse2').s ? 0 : 1;
// 0..1 progress of the current time-lapse: the clock and the odometer spin up and land exactly on the cha-ching
const lapK = lt => { const id = lapIdx(lt) ? 'lapse2' : 'lapse1'; return easeIO(seg(lt, b(id).s + .05, b(id).s + CHA[id] - .02)); };
const clockMin = lt => { const i = lapIdx(lt); return lerp(MIN[i], MIN[i + 1], lapK(lt)); };
const fmtClock = m => { m = Math.floor(m + 1e-6); const h = Math.floor(m / 60) % 12 || 12, mm = m % 60; return `${h}:${String(mm).padStart(2, '0')} ${m >= 720 ? 'PM' : 'AM'}`; };
const spinning = lt => { for (const id of ['lapse1', 'lapse2']) { const s = b(id).s; if (lt > s + .03 && lt < s + CHA[id] - .01) return true; } return false; };
const centsAt = lt => { const i = lapIdx(lt), h = lerp(HRS[i], HRS[i + 1], lapK(lt)); return spinning(lt) ? h * 118 * 100 : Math.round(h * 118 * 100); };
// the guilt thermometer: it climbs a step on each plea (on the key word), creeps during the time-lapses, and reaches 96% before the snap
function guiltAt(lt) {
  const st = [[wordT('c1', 'room', 2.7), .12], [wordT('c2', 'isn', 5.7), .12], [b('lapse1').s + .5, .04], [wordT('c3', 'twenty', 12), .14], [b('lapse2').s + .5, .04],
    [wordT('c4', 'please', 17), .22], [wordT('s4', 'contract', 18.5), .14], [wordT('s5', 'contract', 20.2), .14]];
  let g = 0; for (const [t0, d] of st) { const k = seg(lt, t0, t0 + .4); g += d * (k >= 1 ? 1 : easeBack(k)); }
  return g;
}
const guiltPulse = lt => { let m = 0; for (const id of ['c1', 'c2', 'c3', 'c4', 's4', 's5']) { const w = id[0] === 'c' ? (id === 'c1' ? 'room' : id === 'c2' ? 'isn' : id === 'c3' ? 'twenty' : 'please') : 'contract'; m = Math.max(m, pulse(lt, wordT(id, w, b(id).e) - .02, .45)); } return m; };
const TSNAP = () => b('snap').s + .10;                          // the boing cue: the thermometer bursts
const TRUN = () => b('run').s;                                  // the whoosh cue: the launch
const TF = () => b('run').s + .03;                              // the frame the divider cracks and the stack of panels freezes into shards
const TLAND = () => TF() + .26;                                 // she lands in the hall

// ------------------------------------------------------------------ the hall (top panel): twenty-eight doors, twenty-eight call lights
const DCOL = ['#6d8f88', '#9d6b74', '#a8744f', '#8e6f55'];
const DOORS = [];
for (let j = 0; j < 14; j++) for (const side of [1, -1]) DOORS.push({ side, z: (side > 0 ? 1300 : 1700) + 400 * j, n: String(side > 0 ? 1 + 2 * j : 2 + 2 * j), color: DCOL[(j + (side > 0 ? 0 : 2)) % 4] });
DOORS.sort((p, q) => p.z - q.z);   // twenty-eight residents, twenty-eight doors; Room 9 is on the right wall at z 2900
const R9 = DOORS.findIndex(d => d.n === '9');
const ORD = DOORS.map((_, i) => [i === R9 ? -1 : i + 9 * hash(i + 7), i]).sort((p, q) => p[0] - q[0]).map(q => q[1]);   // Room 9 lights first
const RANK = []; ORD.forEach((d, k) => { RANK[d] = k; });
const DKIND = ['call', 'bed', 'door', 'call', 'chair', 'door'];
// how many call lights are lit: two chimes at the cues, a slow climb, then they multiply through each time-lapse (all 28 by the end of the second)
const litKeys = () => [[0, 0], [.34, 0], [.37, 3], [.69, 3], [.72, 8], [1.6, 10], [3.8, 12], [b('lapse1').s, 13], [b('lapse1').e - .1, 19], [11.2, 21], [b('lapse2').s, 22], [b('lapse2').e - .1, 28], [999, 28]];
const nLit = lt => { const K = litKeys(); for (let i = 1; i < K.length; i++) if (lt < K[i][0]) return Math.floor(lerp(K[i - 1][1], K[i][1], seg(lt, K[i - 1][0], K[i][0])) + 1e-6); return 28; };
const domeAt = (i, tt, n) => RANK[i] < n ? (() => { const kind = DKIND[(i + RANK[i]) % 6]; return [A6.ALARM[kind].rgb, .62 + .38 * Math.sin(tt * 14 + i * 1.9), kind]; })() : null;

// the call-light counter: a slim pill in the corner of the panel, 28 dots in two rows of fourteen, lit by the same schedule as the domes
function callBoard(x, y, tt, n) {
  const w = 360, h = 98;
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5; ctx.fillStyle = 'rgba(18,20,28,.9)'; rr(0, 0, w, h, 20); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = n >= 28 ? `rgba(255,59,85,${.6 + .4 * Math.sin(tt * 18)})` : 'rgba(154,163,178,.8)'; ctx.lineWidth = 4; rr(0, 0, w, h, 20); ctx.stroke();
  text('CALL LIGHTS', 20, 25, { size: 22, fill: '#c9d2e6', align: 'left', spacing: 2 });
  ctx.fillStyle = n >= 28 ? '#ff3b55' : '#2b303a'; rr(w - 112, 8, 96, 34, 17); ctx.fill();
  text(n + ' / 28', w - 64, 26, { size: 24, fill: '#fff', spacing: 1 });
  for (let m = 0; m < 28; m++) {   // two rows of fourteen on a 24 px pitch
    const r = Math.floor(m / 14), c = m % 14, cx = 24 + c * 23.6, cy = 58 + r * 25, on = RANK[m] < n, kind = DKIND[(m + RANK[m]) % 6], rgb = A6.ALARM[kind].rgb, pls = on ? .7 + .3 * Math.sin(tt * 12 + m * 1.7) : 0;
    ctx.fillStyle = '#0c0e12'; ell(cx, cy, 10.5, 10.5); ctx.fill();
    ctx.fillStyle = on ? `rgba(${rgb},${.55 + .45 * pls})` : '#3a3f48'; ell(cx, cy, 8.4, 8.4); ctx.fill();
    if (on) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ell(cx - 2.6, cy - 3, 2.6, 2); ctx.fill(); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ hall props
// a tower of folded linen, taller than the sprinter: origin at the base centre, n sheets 30 px each, the top sways
function tower(x, y, s, o = {}) {
  const n = o.n ?? 11, sway = o.sway ?? 0, lean = o.lean ?? 0, cols = ['#fbfbff', '#cfe6ff', '#fff2c4', '#ffd9e6', '#d8f3dc'];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const f = i / Math.max(1, n - 1), ox = sway * f * f + lean * i * 3 + (hash(i * 3.1) - .5) * 10, w = 150 + (hash(i + 7) - .5) * 26, yy = -i * 30;
    ctx.save(); ctx.translate(ox, yy); ctx.rotate((hash(i + 2) - .5) * .05 + sway * .0009 * i);
    ctx.fillStyle = cols[(i + (o.seed || 0)) % 5]; ctx.strokeStyle = INK; ctx.lineWidth = 3.2; rr(-w / 2, -30, w, 31, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.65)'; rr(-w / 2 + 8, -27, w - 16, 5, 2.5); ctx.fill();                          // the lit top edge
    ctx.strokeStyle = 'rgba(110,120,160,.38)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-w / 2 + 12, -12); ctx.lineTo(w / 2 - 34, -12); ctx.stroke();   // the fold
    ctx.fillStyle = 'rgba(110,120,160,.22)'; rr(w / 2 - 28, -24, 18, 20, 6); ctx.fill();                                 // the folded corner
    ctx.restore();
  }
  ctx.restore();
}
// one loose sheet of linen in the air: a rounded rectangle that flutters (its height breathes with its spin)
function linen(x, y, a, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s * (.35 + .65 * Math.abs(Math.cos(a * 1.7))));
  ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 3 / Math.max(.4, s); rr(-52, -36, 104, 72, 12); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(110,120,160,.4)'; ctx.lineWidth = 2.4 / Math.max(.4, s); ctx.beginPath(); ctx.moveTo(-34, -6); ctx.lineTo(30, -6); ctx.moveTo(-34, 14); ctx.lineTo(8, 14); ctx.stroke();
  ctx.restore();
}
const LCOL = ['#fbfbff', '#cfe6ff', '#fff2c4', '#ffd9e6', '#d8f3dc'];
// the heap the sheets make on the floor: a pile of tumbled folded sheets, origin at the floor centre, about 330 px wide at scale 1
const HEAPS = [[-112, -14, 150, 36, -.07, 0], [14, -13, 168, 38, .03, 1], [128, -15, 140, 34, -.1, 2], [-70, -46, 142, 36, .09, 3], [62, -48, 150, 36, -.08, 4], [-128, -40, 100, 30, .3, 1], [136, -44, 96, 30, -.34, 3], [-14, -82, 132, 34, .05, 2], [-84, -78, 96, 30, -.18, 0], [70, -84, 98, 30, .2, 1], [6, -114, 100, 32, -.06, 3]];
function heap(x, y, s, grow, t) {
  if (grow <= .02) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s * .66 * (.35 + .65 * grow)); ctx.lineJoin = 'round';   // low enough to stay under her chin
  ctx.fillStyle = 'rgba(10,10,30,.25)'; ell(0, 6, 200, 20); ctx.fill();
  HEAPS.forEach(([lx, ly, w, h, a, c], i) => {
    const wob = Math.sin(t * 2 + lx) * 1.4;
    ctx.save(); ctx.translate(lx, ly + wob); ctx.rotate(a);
    ctx.fillStyle = LCOL[c]; ctx.strokeStyle = INK; ctx.lineWidth = 3.2; rr(-w / 2, -h / 2, w, h, 11); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; rr(-w / 2 + 9, -h / 2 + 4, w - 18, 5, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(110,120,160,.4)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-w / 2 + 14, h * .12); ctx.lineTo(w / 2 - 36, h * .12); ctx.stroke();
    ctx.fillStyle = 'rgba(110,120,160,.2)'; rr(w / 2 - 32, -h / 2 + 5, 20, h - 10, 6); ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}
// a rolling IV pole: a five-star base on casters, a steel pole, a pump with a blinking screen, two bags and a drip chamber. Origin at the floor under the pole; o.lean tilts it, o.t drives the drip and the bags
function ivPole(x, y, s, o = {}) {
  const t = o.t || 0, lean = o.lean || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(10,10,30,.28)'; ell(0, 4, 78, 13); ctx.fill();
  ctx.strokeStyle = INK; ctx.fillStyle = '#9aa3b2';
  for (const [dx, dy] of [[-64, -2], [64, -2], [-34, 8], [34, 8], [0, -10]]) { ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(dx, dy - 10); ctx.stroke(); ctx.fillStyle = '#23232c'; ell(dx, dy, 11, 11); ctx.fill(); ctx.fillStyle = '#aab2c0'; ell(dx, dy, 4, 4); ctx.fill(); }
  ctx.rotate(lean);
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -430); ctx.stroke();                     // the pole: an ink outline under the steel
  ctx.strokeStyle = '#c3cad6'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -430); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-2, -30); ctx.lineTo(-2, -420); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-58, -430); ctx.lineTo(58, -430); ctx.stroke(); ctx.strokeStyle = '#c3cad6'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-58, -430); ctx.lineTo(58, -430); ctx.stroke();   // the hook bar
  // the pump
  ctx.fillStyle = '#e9eef5'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-34, -270, 68, 78, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#10222b'; rr(-26, -262, 52, 28, 5); ctx.fill();
  ctx.fillStyle = Math.sin(t * 9) > 0 ? '#5ae682' : '#1f6b3c'; ell(-14, -248, 5, 5); ctx.fill(); ctx.fillStyle = '#5aa8ff'; rr(2, -253, 18, 10, 3); ctx.fill();
  ctx.fillStyle = '#c9d2dc'; ell(-14, -214, 7, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff5a6a'; ell(10, -214, 7, 7); ctx.fill(); ctx.stroke();
  // two bags on the hook bar, swaying a little against the pole
  for (const [bx, fill, lvl] of [[-46, '#bfe9ff', .72], [46, '#fff0a8', .55]]) {
    const sw = Math.sin(t * 3.2 + bx) * .06; ctx.save(); ctx.translate(bx, -428); ctx.rotate(sw);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 12); ctx.stroke();
    ctx.fillStyle = 'rgba(235,245,255,.7)'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-24, 12); ctx.lineTo(24, 12); ctx.quadraticCurveTo(32, 60, 20, 104); ctx.quadraticCurveTo(0, 116, -20, 104); ctx.quadraticCurveTo(-32, 60, -24, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = fill; ctx.fillRect(-34, 112 - 100 * lvl, 68, 100 * lvl); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-18, 24, 5, 70); ctx.restore();
    ctx.strokeStyle = 'rgba(40,50,70,.55)'; ctx.lineWidth = 2; for (const yy of [40, 62, 84]) { ctx.beginPath(); ctx.moveTo(10, yy); ctx.lineTo(20, yy); ctx.stroke(); }
    const dq = ((t * 1.4 + bx) % 1 + 1) % 1; ctx.fillStyle = fill; ell(0, 120 + dq * 40, 3.2, 4.6); ctx.fill();   // a drip
    ctx.restore();
    ctx.strokeStyle = 'rgba(210,225,240,.9)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(bx, -300); ctx.quadraticCurveTo(bx * .4 + Math.sin(t * 2) * 6, -280, 0, -236); ctx.stroke();   // the tubing into the pump
  }
  ctx.restore();
}
// a wheelchair with Mrs. Cranberry riding it (the Episode 7 chair), spun about its vertical axis by o.spin radians; q is the V2.at position
function chairRide(q, o = {}) {
  const sp = o.spin || 0, cs = Math.cos(sp), sx = Math.abs(cs) < .3 ? .3 * (cs < 0 ? -1 : 1) : cs, t = o.t || 0;
  ctx.save(); ctx.translate(q.x, q.y); ctx.scale(sx, 1); ctx.translate(-q.x, -q.y);
  S7.wheelchairBack(q.x, q.y, q.s);
  const c = A7.cran({ x: q.x, y: q.y - 118 * q.s, s: q.s, noLegs: true, noShadow: true, noReflect: true, expr: o.expr || 'happy', look: [0, .1], arms: { l: o.armsL || 'cheer', r: o.armsR || 'cheer' }, mouthOpen: o.mouth || 0, vx: o.vx || 0, t, lift: o.lift || 0, id: 'cran', transit: o.transit, who: 'none11' });
  drawChar(c);
  S7.wheelchairFront(q.x, q.y, q.s, { roll: o.roll || 0 });
  ctx.restore();
  if (o.swirl > 0) {   // swirl lines around the chair: it is going round
    ctx.save(); ctx.translate(q.x, q.y - 120 * q.s); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const a0 = sp * 1.3 + i * 1.6, rx = (150 + 14 * i) * q.s, ry = (34 + 6 * i) * q.s; ctx.strokeStyle = `rgba(255,255,255,${.55 * o.swirl})`; ctx.lineWidth = 5 * q.s + 1; ctx.beginPath(); ctx.ellipse(0, (i - 1.5) * 52 * q.s, rx, ry, 0, a0, a0 + 1.1); ctx.stroke(); }
    ctx.restore();
  }
  return c;
}
// a speech bubble with one silent word in it (Clementine's "Sure!" instinct)
function bubble(x, y, str, k, o = {}) {
  if (k <= .02) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(o.rot || 0);
  ctx.font = '900 34px Nunito'; const w = ctx.measureText(str).width + 40;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 4; rr(-w / 2, -26, w, 52, 26); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, 24); ctx.lineTo(-18, 44); ctx.lineTo(10, 26); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillRect(-9, 22, 18, 6);
  text(str, 0, 2, { size: 34, fill: o.fill || '#e8731a', weight: 900 });
  ctx.restore();
}

// ------------------------------------------------------------------ Clementine's route through the hall (X right, Z forward; the walls are at X = +-330, a shoulder-width in from them is X = +-226)
const CP = route([
  [0, -20, 5700], [1.40, 60, 3420], [1.62, 124, 3130, 'out'], [1.98, 188, 2960, 'out'],                 // sprints at the camera, brakes in front of Room 9 (right wall)
  [5.19, 188, 2960], [5.50, -226, 2900, 'io'], [5.54, -226, 2900], [5.88, 226, 2880, 'io'], [5.92, 226, 2880], [6.30, 20, 2900, 'out'],   // BONK off Room 8's frame, BONK off Room 9's, skids to a stop
  [7.62, 20, 2900], [8.02, -90, 5900, 'in'], [8.10, -90, 5900], [8.90, 70, 3040, 'out'], [9.06, 40, 2960],   // time-lapse: way down the hall and back
  [11.0, 40, 2960], [11.32, 20, 2930, 'io'], [13.2, 20, 2930], [13.6, 44, 2955], [14.5, 20, 2935],  // to the wheelchair, dizzy
  [14.96, 20, 2935], [15.40, 80, 6200, 'in'], [15.48, 80, 6200], [16.25, 188, 2960, 'out'], [16.36, 188, 2960],   // time-lapse: down the hall, back to Room 9
  [23.55, 188, 2960], [23.95, 150, 2960], [24.5, 150, 4700, 'in'], [25.4, 130, 6000],                                       // the run: she bolts after Strawberry's arrival
]);
// the camera: nearly locked while she works the same stretch of hall, so her sprints read against it
const hallCam = lt => {
  const cz = lerp(1250, 1400, seg(lt, 1.6, 5.0)) + (lt > 5.19 ? 0 : 0), cx = 22 * Math.sin(lt * .5);
  return { f: 1400, cy: 360, hy: 419, cz, cx };
};

// ------------------------------------------------------------------ accessories made for this scene
EXT.acc.pricetag11 = (o, k, t, layer) => {   // Clementine's price tag: it streams out behind her at speed (o.tagA, radians, positive trails to the left) and flutters with o.tagFlap
  if (layer !== 'front') return;
  const fl = o.tagFlap || 0, a = (o.tagA || 0) + (.12 + .55 * fl) * Math.sin(t * (3 + 40 * fl));
  ctx.save(); ctx.translate(18, k.ry * .77 + 12); ctx.rotate(a);
  ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 22); ctx.stroke();
  ctx.fillStyle = '#fffdf0'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(4, 20); ctx.lineTo(40, 20); ctx.lineTo(40, 42); ctx.lineTo(4, 42); ctx.lineTo(-4, 31); ctx.closePath(); ctx.fill(); ctx.stroke();
  text('$89', 22, 31, { size: 12, fill: '#d62828', weight: 900 });
  ctx.restore();
};
EXT.acc.combadge11 = (o, k, t, layer) => {   // the comm badge, low on the left of the chest so its rings stay clear of the mouth: o.callRing 0..1 pulses sound rings
  if (layer !== 'front') return;
  ctx.save(); ctx.translate(-k.rx * .6, k.ry * .52);
  ctx.fillStyle = '#d7dde5'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ell(0, 0, 17, 17); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(0, -11, 0, 11, [[0, '#ffb45a'], [1, '#e8602a']]); ell(0, 0, 8.5, 8.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(-2.6, -3.6, 2.6, 2); ctx.fill();
  const ring = o.callRing || 0;
  if (ring > 0) for (let i = 0; i < 3; i++) { const q = ((t * 2.2 - i * .33) % 1 + 1) % 1; ctx.strokeStyle = `rgba(255,180,90,${.9 * (1 - q) * ring})`; ctx.lineWidth = 4 * (1 - q) + 1; ctx.beginPath(); ctx.arc(0, 0, 22 + q * 30, PI * .6, PI * 1.4); ctx.stroke(); }
  ctx.restore();
};

// ------------------------------------------------------------------ Clementine
const spd = (f, t) => Math.hypot(f(t + .04)[0] - f(t - .04)[0], f(t + .04)[1] - f(t - .04)[1]) / .08;
const T_TOWER = 1.62;                                          // the tower leaves her head when she skids
function clemObj(lt, ghost) {
  const [X, Z] = CP(lt), v = spd(CP, lt), run = v > 60, tired = clamp((lt - 8) / 9), lapse = inB(lt, 'lapse1') || inB(lt, 'lapse2');
  const wd = (id, w, fb) => wordT(id, w, fb);
  const cTalk = ['c1', 'c2', 'c3', 'c4'].some(id => inB(lt, id)), hearing = ['s1', 's2', 's3', 's4', 's5'].some(id => inB(lt, id));
  // expression
  const expr = pk(lt, [[T_TOWER, 'hopeful'], [b('s1').s, 'panic'], [b('c2').s, 'shock'], [b('s2').s, 'hopeful'], [b('lapse1').s, 'dead'], [b('m1').s, 'panic'], [b('c3').s, 'weak'], [b('s3').s, 'panic'], [b('lapse2').s, 'weak'], [b('c4').s, 'panic'],
    [b('s4').s, 'sad'], [b('snap').s + .3, 'sad'], [b('s6').s, 'hopeful'], [b('run').s, 'happy'], [1e9, 'panic']]);
  // arms
  let arms = { l: 'run', r: 'run' }, grip, hand;
  const BADGE = [-58, 48];                                       // where the comm badge hangs, in body-local px
  if (lt < T_TOWER) arms = { l: 'flail', r: 'flail' };
  else if (lt < 1.98) arms = { l: 'up', r: 'up' };
  else if (lt < b('s1').s) { arms = { l: 'hold', r: 'wave' }; grip = { l: BADGE }; hand = { l: 'flat' }; }
  else if (lt < b('c2').s) { arms = { l: 'hold', r: 'rest' }; grip = { l: BADGE }; hand = { l: 'flat' }; }
  else if (lt < 5.5) arms = { l: 'run', r: 'run' };
  else if (lt < 6.3) arms = { l: 'flail', r: 'flail' };
  else if (lt < b('lapse1').s) { arms = { l: 'hold', r: 'rest' }; grip = { l: BADGE }; hand = { l: 'flat' }; }
  else if (lt < b('lapse1').e) arms = { l: 'run', r: 'run' };
  else if (lt < 11.0) { arms = { l: 'hold', r: 'hold' }; grip = { l: [-52, 116], r: [52, 116] }; hand = { l: 'flat', r: 'flat' }; }
  else if (lt < 11.32) arms = { l: 'run', r: 'run' };
  else if (lt < b('s3').s) { arms = { l: 'point', r: 'up' }; hand = { l: 'point' }; }
  else if (lt < b('lapse2').s) arms = { l: 'down', r: 'down' };
  else if (lt < b('lapse2').e) arms = { l: 'run', r: 'run' };
  else if (lt < b('s6').s) { arms = { l: 'hold', r: 'hold' }; grip = { l: [-22, 54], r: [22, 54] }; hand = { l: 'flat', r: 'flat' }; }   // hands pressed together: please
  else if (lt < b('run').s + .12) arms = { l: 'cheer', r: 'cheer' };
  // body language: hops on her key words, the skid, the BONKs, the sink into the sheets, the dizzy sway
  const hop = 30 * (pulse(lt, wd('c1', 'strawberry', 1.6) - .02, .34) + pulse(lt, wd('c1', 'help', 2.4), .3) + pulse(lt, wd('c1', 'room', 2.7), .4)) + 26 * (pulse(lt, wd('c3', 'strawberry', 11.2), .34) + pulse(lt, wd('c3', 'twenty', 12), .4))
    + 22 * pulse(lt, b('lapse1').s + .1, .3) + 70 * pulse(lt, b('s6').s + .05, .5) + 56 * pulse(lt, TRUN() + .0, .42);
  const bonk = Math.max(pulse(lt, 5.49, .24), pulse(lt, 5.87, .24)), skid = pulse(lt, 1.64, .46) * (lt < 2.2 ? 1 : 0);
  const sink = sk(lt, b('c4').e, b('s5').e) * (lt < b('s6').s ? 1 : 1 - seg(lt, b('s6').s, b('s6').s + .12));
  const sway = lt >= b('s3').s && lt < b('lapse2').s ? .16 * Math.sin(lt * 5.2) * (1 - seg(lt, 14.2, 14.9)) : 0;
  const extra = { who: 'clem', t: lt, acc: ['steth', 'pricetag11', 'badge7', 'combadge11'].concat(tired > .02 ? ['sweat'] : []), expr, arms, grip, hand, lift: hop - 12 * sink,
    squash: .2 * skid + .38 * bonk + .12 * sink, plant: true, rot: (sway || 0) + .5 * (bonk > 0 ? (lt < 5.7 ? 1 : -1) * .3 * bonk : 0) - .05 * sink,
    look: lt < 1.6 ? [0, .2] : hearing ? [0, 0] : [.1, .1], sparkle: inB(lt, 'c4') || inB(lt, 's4') || inB(lt, 's5') || inB(lt, 'snap'), eyeScale: inB(lt, 'c4') || lt >= b('s4').s && lt < b('s6').s ? 1.16 : 1,
    lid: expr === 'weak' ? .34 : undefined, callRing: (cTalk || hearing) && lt < b('s6').s ? 1 : 0, tagFlap: clamp(v / 1300), id: 'clem' };
  if (ghost) Object.assign(extra, { noShadow: true, noReflect: true, alpha: ghost });
  const o = runner(A10.clem, CP, lt, extra, run ? 380 : 300);
  if (run) { const [X2] = CP(lt + .04); o.tagA = X2 > X ? .55 : -.55; }
  if (!run) o.gait = o.gaitW = undefined;
  if (lt >= b('run').s + .1 && lt < 23.95) { o.gaitW = lt * 700; o.axis = 'z'; o.dir = -1; o.vx = 0; }   // the scramble: legs windmilling on the spot
  if (lt >= T_TOWER && lt < b('lapse1').e) o.badgeText = 'NEW';
  return { o, X, Z, v, run };
}
// the sheets the tower becomes when she skids: each flies up and toward the lens, flutters down, lands in the heap
function sheetBurst(lt, q) {   // q: the V2.at position of the skid
  const u = lt - T_TOWER; if (u < 0 || u > 1.3) return [];
  const out = [];
  for (let i = 0; i < 12; i++) {
    const h0 = hash(i * 5.3 + 1), h1 = hash(i * 2.1 + 7), h2 = hash(i * 9.7 + 3), t0 = h2 * .08, uu = u - t0; if (uu < 0) continue;
    const vx = (h0 - .5) * 760, vy = -(300 + h1 * 520), g = 2200, tl = (-vy + Math.sqrt(vy * vy + 2 * g * (q.fy - q.y0 + 90 * h0))) / g;   // time to come back down to the floor
    if (uu > tl + .05) continue;
    const x = q.x + (i - 5.5) * 7 + vx * uu * (1 - .35 * seg(uu, .3, tl)) + 26 * Math.sin(uu * 9 + i) * seg(uu, .25, tl), y = q.y0 - i * 22 * q.s + vy * uu + .5 * g * uu * uu * (1 - .45 * seg(uu, .2, tl));
    out.push({ x, y, a: uu * (3 + 8 * h1) * (h0 > .5 ? 1 : -1) + i, s: q.s * (.8 + 1.0 * seg(uu, 0, .5)), col: LCOL[i % 5], alpha: 1 - seg(uu, tl - .08, tl + .05) });
  }
  return out;
}

// ------------------------------------------------------------------ the hall: set, light and actors
const HALL_LIGHT = { key: [-.3, -.85], keyColor: '#cfd8ff', keyA: .16, rim: '#7f9cff', rimA: .5, shadow: '#0a0a1e', shadowA: .42, amb: '#aab4e8', ambA: .12 };
const phaseOf = lt => lt < b('lapse1').e ? 0 : lt < b('lapse2').e ? 1 : 2;
function hallBg(lt, cam) {
  V2.setCam(cam); V2.setLight(HALL_LIGHT); V2.opts.reflect = true;
  const n = nLit(lt), ph = phaseOf(lt), near = cam.cz + 90;
  const doors = DOORS.map((d, i) => Object.assign({}, d, { dome: d.z < cam.cz + 1100 ? null : domeAt(i, lt, n), open: d.n === '9' ? 1 : 0 }));   // a dome next to the lens would flood the panel with its glow (and sits above the panel anyway)
  const lamp = [.58, .46, .36][ph] * (hash(Math.floor(lt * 12) + ph * 7) > (ph === 2 ? .1 : .03) ? 1 : .35);
  S6.corridor({ doors, fog: ph === 2 ? '#434a74' : '#4a5278', fogAmt: .5, wall: '#cfc6b4', wain: '#46707a', lampOn: lamp, bright: .74 * (1 - .4 * clamp((n - 3) / 18)), signs: [], zFar: 7600 });
  let rings = 0;
  doors.forEach((d, i) => {   // sound rings off the lit domes (the near ones only: they are what the eye reads)
    if (!d.dome || i % 2 || d.z < near || rings > 9) return; rings++;
    const [x, y, k] = V2.proj(d.side * 330, 480, d.z);
    A6.ring(x, y, (((lt * 1.8 + hash(i)) % 1) + 1) % 1, d.dome[2], { r0: 14 * k, r1: 300 * k + 30, lw: 6, alpha: .6 });
  });
  let lights = 0;
  for (const d of doors) if (d.dome && d.z > near && lights < 10) { lights++; const [x, y] = V2.proj(d.side * 330, 480, d.z); V2.addLight({ x, y, r: 800, color: d.dome[0], a: .6 * d.dome[1] * Math.min(1, 12 / Math.max(1, n)) }); }
}
// the time-lapse look inside a panel: a warm band chasing a cool band across it, plus streaks of speed
function lapseFx(lt, y0, y1, o = {}) {
  for (const id of ['lapse1', 'lapse2']) {
    const bb = b(id), p = seg(lt, bb.s, bb.e), env = Math.sin(clamp(p) * PI);
    if (p <= 0 || p >= 1) continue;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [off, col, a] of [[0, '255,214,140', .34 * (o.k ?? 1)], [-340, '120,160,255', .26 * (o.k ?? 1)]]) {
      const cx = lerp(-300, 1400, easeIO(p)) + off;
      ctx.fillStyle = V2.grad(cx - 300, 0, cx + 300, 0, [[0, `rgba(${col},0)`], [.5, `rgba(${col},${a * env})`], [1, `rgba(${col},0)`]]); ctx.fillRect(0, y0, W, y1 - y0);
    }
    ctx.restore();
    if (o.streaks) {   // horizontal speed lines that rip across the picture
      ctx.save(); ctx.fillStyle = `rgba(255,255,255,${.16 * env})`;
      for (let i = 0; i < 16; i++) { const yy = lerp(y0 + 10, y1 - 10, hash(i * 3 + Math.floor(lt * 14))), ln = 140 + 360 * hash(i + 9), xx = ((lt * (2600 + 1400 * hash(i)) + hash(i + 4) * 1400) % (W + 600)) - 300; ctx.fillRect(xx, yy, ln, 2.6); }
      ctx.restore();
    }
  }
}
const POLEP = lt => lt < 3.5 ? route([[0, -170, 5600], [1.0, -170, 4500], [1.6, -165, 3900], [3.5, -109, 3210, 'out']])(lt) : (() => { const [x, z] = CP(lt - .5), lane = -165 + 335 * (sk(lt, b('lapse1').s, b('lapse1').e) - sk(lt, b('lapse2').s, b('lapse2').e)); return [clamp(lerp(lane + .3 * x, 0, sk(lt, 23.3, 23.9)), -250, 250), z + 250]; })();
const WCP = route([[10.8, -430, 3000], [11.3, -215, 3000, 'out'], [14.5, -215, 3000], [15.4, -520, 3010, 'in']]);
const chairTheta = lt => { let th = 0; for (let t = 11.3; t < Math.min(lt, 14.6); t += .02) th += 9 * sk(t, 11.35, 11.85) * (1 - sk(t, 12.9, 14.3)) * .02; return th; };
const chairSpinning = lt => lt > 11.3 && lt < 14.6;
// the hall actors, back to front: the pole, the wheelchair and Mrs. Cranberry, Clementine, the sheets and the heap. `merged` adds Strawberry (drawn by the caller through opts.extra)
function hallActors(lt, cam, o = {}) {
  V2.setCam(cam); V2.setLight(HALL_LIGHT); V2.opts.reflect = true;
  const items = [], lapse = inB(lt, 'lapse1') || inB(lt, 'lapse2'), c = clemObj(lt), cq = V2.at(c.X, c.Z);
  // the pole
  { const [px, pz] = POLEP(lt), q = V2.at(px, pz), moving = spd(POLEP, lt) > 60;
    if (pz > cam.cz + 300) items.push({ z: pz, fn: () => ivPole(q.x, q.y, q.s * .95, { t: lt, lean: .05 * Math.sin(lt * 3.1) - (moving ? .06 : 0) }) }); }
  // the wheelchair
  if (lt > 10.8 && lt < 15.5) { const [wx, wz] = WCP(lt), q = V2.at(wx, wz), th = chairTheta(lt), sp = chairSpinning(lt), mv = spd(WCP, lt) > 60;
    items.push({ z: wz, fn: () => chairRide(q, { spin: th, t: lt, roll: lt * 30, swirl: sp ? sk(lt, 11.4, 11.8) * (1 - sk(lt, 13.4, 14.2)) : 0, mouth: sp ? .9 : .2, expr: sp ? 'shock' : 'happy', transit: mv && (wx < -300), vx: mv ? 500 : 0 }) }); }
  // Clementine, the tower, the sheets
  items.push({ z: c.Z, fn: () => {
    if (!o.noClem) drawChar(c.o);
    if (lt < T_TOWER) {
      const sway = 50 * Math.sin(TAU * 2.5 * lt + 1) + 28 * Math.sin(TAU * 3.9 * lt), s = cq.s;
      tower(cq.x, cq.y - 296 * s, s, { sway, lean: .02 * Math.sin(lt * 5), n: 10 });
    }
  } });
  // the heap at the Room 9 door (in front of her shins) and the sheets in the air
  { const [hx, hz] = [176, 2944], q = V2.at(hx, hz), grow = easeOut(seg(lt, 2.0, 2.8)), skidQ = V2.at(...CP(T_TOWER));
    const fl = sheetBurst(lt, { x: skidQ.x, y0: skidQ.y - 296 * skidQ.s, s: skidQ.s, fy: q.y });
    items.push({ z: hz - 8, fn: () => { heap(q.x, q.y, q.s, grow, lt); for (const f of fl) { ctx.save(); ctx.globalAlpha *= f.alpha; linen(f.x, f.y, f.a, f.s, f.col); ctx.restore(); } } }); }
  if (o.extra) for (const it of o.extra) items.push(it);
  items.sort((p, q) => q.z - p.z);
  for (const it of items) it.fn();
  return c;
}
// Clementine's afterimages in a time-lapse: the same route a few frames behind, translucent and unaudited
function hallGhosts(lt, cam) {
  if (!(inB(lt, 'lapse1') || inB(lt, 'lapse2')) || spd(CP, lt) < 400) return;
  V2.setCam(cam);
  for (let j = 5; j >= 1; j--) { const g = clemObj(lt - j * .045, .5 / j ** .8); REG.suppress++; drawChar(g.o); REG.suppress--; }
}

// ------------------------------------------------------------------ the spa lounge (bottom panel): the Episode 9 lounge from a higher, calmer angle, now with a window that tells the time
const LCAM = { f: 1400, cy: 385, hy: 848, cz: 0, cx: 0 };       // the camera looks slightly down on the room: the horizon is above the panel
const ZB = 1700, HW = 640, CH = 560, WB = [LCAM.hy + LCAM.cy * LCAM.f / ZB];   // the back wall's floor line on screen: y 1165
const U = .85;                                                  // the chair and Strawberry are drawn at this scale in the panel (she fits her panel with 70 px of headroom)
const PCX = 410, PCY = 1163;                                    // the chair's centre (screen): its footrest ends at y 1352
const TX = 690, TY = 1205;                                      // the side table top
const todU = lt => clamp((clockMin(lt) - MIN[0]) / (MIN[2] - MIN[0]));   // 0 at 5:32 PM, .56 at 7:45 PM, 1 at 9:30 PM
function skyAt(u) {
  const S = [[0, '#74b6f5', '#ffe0a8'], [.22, '#86aaea', '#ffbf7a'], [.42, '#7a62b0', '#ff8f84'], [.56, '#46397e', '#c8668a'], [.76, '#16194e', '#4b3a80'], [1, '#080c2a', '#18265a']];
  let i = 1; while (i < S.length - 1 && u > S[i][0]) i++;
  const a = S[i - 1], c = S[i], k = seg(u, a[0], c[0]);
  const set = seg(u, .36, .5), rise = seg(u, .5, 1);
  return { top: mixc(a[1], c[1], k), bot: mixc(a[2], c[2], k), sunX: lerp(.2, .78, clamp(u / .45)), sunY: lerp(.26, 1.04, (clamp(u / .45)) ** 1.5), sunA: 1 - set,
    moonX: lerp(.84, .42, rise), moonY: lerp(1.1, .3, easeOut(rise)), moonA: seg(u, .5, .64), stars: seg(u, .6, .86), lit: seg(u, .45, .7) };
}
// a small wall clock in screen space with ghost hands that trail the spin (the shutter-sampled look)
function wallClock11(x, y, r, lt) {
  const cm = clockMin(lt), min = cm % 60, hr = (cm / 60) % 12, sp = spinning(lt);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = 4; ell(0, 0, r, r); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.strokeStyle = '#2a2530'; ctx.lineWidth = i % 3 ? 1.6 : 3; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * .8, -Math.cos(a) * r * .8); ctx.lineTo(Math.sin(a) * r * .92, -Math.cos(a) * r * .92); ctx.stroke(); }
  ctx.lineCap = 'round';
  for (let g = sp ? 4 : 0; g >= 0; g--) {
    const m2 = ((cm - g * 7) % 60 + 60) % 60, h2 = (((cm - g * 7) / 60) % 12 + 12) % 12, al = g ? .16 : 1;
    ctx.strokeStyle = `rgba(42,37,48,${al})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(m2 / 60 * TAU) * r * .76, -Math.cos(m2 / 60 * TAU) * r * .76); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(h2 / 12 * TAU) * r * .46, -Math.cos(h2 / 12 * TAU) * r * .46); ctx.stroke();
  }
  ctx.fillStyle = '#c1121f'; ell(0, 0, 3.2, 3.2); ctx.fill();
  ctx.restore();
}
// the view out of the window: sky, sun, moon, stars, a skyline whose windows light up at dusk. f is the window quad [bl, br, tr, tl]
function skyView(f, lt) {
  const u = todU(lt), sk2 = skyAt(u), [fx0, fy0] = f[0], [fx1, fy1] = f[2], w = fx1 - fx0, h = fy0 - fy1;
  ctx.fillStyle = V2.grad(0, fy1, 0, fy0, [[0, sk2.top], [1, sk2.bot]]); ctx.fillRect(fx0, fy1, w, h);
  if (sk2.stars > 0) { ctx.fillStyle = `rgba(255,255,240,${.85 * sk2.stars})`; for (let i = 0; i < 26; i++) { const tw = .5 + .5 * Math.sin(lt * 3 + i * 2.3); ell(fx0 + w * hash(i + 3), fy1 + h * .72 * hash(i + 30), 1.2 + 1.3 * hash(i) * tw, 1.2 + 1.3 * hash(i) * tw); ctx.fill(); } }
  if (sk2.sunA > .01) { const sx = fx0 + w * sk2.sunX, sy = fy1 + h * sk2.sunY; glow11(sx, sy, w * .9, '255,190,110', .55 * sk2.sunA, 'screen', .5); ctx.fillStyle = `rgba(255,244,200,${sk2.sunA})`; ell(sx, sy, w * .1, w * .1); ctx.fill(); }
  if (sk2.moonA > .01) { const mx = fx0 + w * sk2.moonX, my = fy1 + h * sk2.moonY; glow11(mx, my, w * .7, '190,210,255', .35 * sk2.moonA, 'screen', .4); ctx.fillStyle = `rgba(250,248,230,${sk2.moonA})`; ell(mx, my, w * .085, w * .085); ctx.fill(); ctx.fillStyle = `rgba(190,190,210,${.6 * sk2.moonA})`; ell(mx - w * .02, my + w * .01, w * .02, w * .02); ctx.fill(); ell(mx + w * .025, my - w * .02, w * .014, w * .014); ctx.fill(); }
  ctx.fillStyle = mixc('#4b4a62', '#14142a', u * 1.2);
  ctx.beginPath(); ctx.moveTo(fx0, fy0); ctx.lineTo(fx0, fy0 - h * .2);
  for (let i = 0; i <= 9; i++) { const bx = fx0 + w * i / 9, bh = h * (.16 + .17 * hash(i * 3.3 + 1)); ctx.lineTo(bx, fy0 - bh); ctx.lineTo(bx + w / 9 * .92, fy0 - bh); }
  ctx.lineTo(fx1, fy0); ctx.closePath(); ctx.fill();
  if (sk2.lit > 0) { ctx.fillStyle = `rgba(255,220,130,${.9 * sk2.lit})`; for (let i = 0; i < 22; i++) ctx.fillRect(fx0 + w * hash(i * 1.7 + 2) * .96, fy0 - h * (.04 + .17 * hash(i * 2.9 + 5)), 3.4, 4.4); }
}
const LIT_WALL = { x0: 330, x1: 590, y0: 22, y1: 236 };     // the window on the back wall (world units)
function loungeRoom(lt) {
  V2.setCam(LCAM);
  const u = todU(lt), sk2 = skyAt(u);
  S6.shell({ zb: ZB, hw: HW, ch: CH, wall: mixh('#cfc3e6', '#8f86c0', u * .6), wain: mixh('#8e74b8', '#5f4c92', u * .6), floorA: mixh('#dcbf98', '#a0866c', u * .6), floorB: mixh('#bc9d74', '#7d6650', u * .6), ceil: '#e8e0f2', fog: mixh('#a496c6', '#4a4274', u * .7), fogAmt: .25, tile: 130, bright: 1, rail: 96 });
  // the break room door with the DO NOT DISTURB hanger on its knob
  S6.onZ(ZB, -604, -486, 0, 230, '#a8744f', 'rgba(25,16,30,.7)', 2.4); S6.onZ(ZB, -586, -504, 40, 100, '#96623e', 'rgba(25,16,30,.35)', 1.4); S6.onZ(ZB, -586, -504, 124, 210, '#96623e', 'rgba(25,16,30,.35)', 1.4);
  // the twelve doors of her twelve residents: closed, dark domes (nobody is calling)
  for (let j = 0; j < 12; j++) {
    const X = -410 + j * 56, z = ZB - 2;
    S6.onZ(z, X - 22, X + 22, 0, 205, ['#6d8f88', '#9d6b74', '#8e6f55', '#a8744f'][(j * 3) % 4], 'rgba(25,16,30,.65)', 2);
    S6.onZ(z, X - 15, X + 15, 22, 84, 'rgba(0,0,0,.14)'); S6.onZ(z, X - 15, X + 15, 104, 172, 'rgba(0,0,0,.14)');
    S6.onZ(z, X - 12, X + 12, 184, 200, '#f6eee0', 'rgba(25,16,30,.5)', 1.2);
    S6.onZ(z, X - 17, X + 17, 212, 230, '#4b4a58', 'rgba(25,16,30,.7)', 1.6);
    const [nx, ny] = V2.p2(X, 192, z), kk = S6.kz(z); text(String(j + 1), nx, ny + 1, { size: 11 * kk, fill: '#3a2a4a', weight: 900 });
  }
  // the window, with its own sky
  S6.backWindow(ZB, { x0: LIT_WALL.x0, x1: LIT_WALL.x1, y0: LIT_WALL.y0, y1: LIT_WALL.y1, sky: ['#74b6f5', '#ffe0a8'], mull: 2, sill: true, draw: f => skyView(f, lt) });
  wallClock11(919, 924, 26, lt);
  // the hanger
  { const hk = Math.sin(lt * 2.1) * .03, [hx, hy] = V2.p2(-494, 150, ZB - 8), kk = S6.kz(ZB); ctx.save(); ctx.translate(hx, hy); ctx.rotate(hk); ctx.scale(kk, kk);
    ctx.fillStyle = '#d9a441'; ell(0, 0, 8, 8); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = '#e8193a'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; rr(-50, 4, 100, 106, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ell(0, 24, 9, 9); ctx.fill(); ctx.fillStyle = '#e8193a'; ell(0, 24, 4.2, 4.2); ctx.fill();
    text('DO NOT', 0, 50, { size: 17, fill: '#fff', weight: 900, spacing: 1 }); text('DISTURB', 0, 72, { size: 16, fill: '#fff', weight: 900, spacing: 1 }); text('zzz', 0, 95, { size: 15, fill: '#ffd1e6', weight: 900 });
    ctx.restore(); }
  // the window's light on the floor: a warm patch sliding with the sun, a pale one after the moon rises
  { const warm = sk2.sunA * (1 - u / .5), cool = sk2.moonA * .5, sh = lerp(-260, 260, clamp(u / .45)), patch = (col, a, off) => { if (a <= .01) return;
      const q = [[LIT_WALL.x0 + off, 0, ZB - 20], [LIT_WALL.x1 + off, 0, ZB - 20], [LIT_WALL.x1 + off + sh * .6 - 220, 0, ZB - 640], [LIT_WALL.x0 + off + sh * .6 - 220, 0, ZB - 640]], p = q.map(v => V2.p2(...v));
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = V2.grad(0, p[0][1], 0, p[2][1], [[0, `rgba(${col},${a * .34})`], [1, `rgba(${col},0)`]]); ctx.beginPath(); p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore(); };
    patch('255,200,120', warm, -140); patch('150,180,255', cool, -60); }
  const [wx, wy] = V2.p2(460, 130, ZB);
  glow11(wx, wy, 330, u < .55 ? '255,196,130' : '150,176,255', .2 * (u < .55 ? Math.max(.2, 1 - u / .55) : (u - .5) * .6), 'screen', .35);
}
// the chair (the Episode 9 recliner, redrawn at U): part 'back' sits behind her, 'front' (seat, shoes, footrest) in front of her hips and feet; o.toe flexes the shoes
function chair11(part, tt, o = {}) {
  ctx.save(); ctx.translate(PCX, PCY); ctx.scale(U, U); ctx.lineJoin = 'round'; ctx.lineWidth = 4.4; ctx.strokeStyle = INK;
  const body = mixc('#2f8f9d', '#25727f', todU(tt) * .5), dark = '#226f7c', light = '#4db0bc';
  if (part === 'back') {
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 196, 200, 22); ctx.fill();
    ctx.fillStyle = dark; rr(-150, 170, 300, 30, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = body; rr(-168, -134, 336, 270, 56); ctx.fill(); ctx.stroke();
    ctx.fillStyle = light; rr(-134, -112, 268, 226, 44); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, -86); ctx.quadraticCurveTo(0, -112, 100, -86); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 4.4;
    for (const s of [-1, 1]) { ctx.fillStyle = dark; rr(s * 160 - 26, -48, 52, 214, 24); ctx.fill(); ctx.stroke(); ctx.fillStyle = body; rr(s * 160 - 31, -66, 62, 44, 20); ctx.fill(); ctx.stroke(); }
  } else {
    ctx.fillStyle = body; rr(-158, 100, 316, 56, 24); ctx.fill(); ctx.stroke();
    ctx.fillStyle = light; rr(-140, 108, 280, 18, 9); ctx.fill();
    if (!o.noLegs) for (const s of [-1, 1]) {   // her legs and shoes up on the footrest: white shoes with pink soles
      ctx.strokeStyle = LIMB; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 40, 118); ctx.lineTo(s * 50, 150); ctx.stroke();
      ctx.save(); ctx.translate(s * 56, 160); ctx.rotate(s * .06 + (o.toe || 0) * s * -1); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.fillStyle = '#ff8fb1'; ell(0, 7, 27, 8.5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ell(0, 0, 27, 14.5); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(-8, -5, 10, 3.6); ctx.fill(); ctx.restore();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 4.4;
    ctx.fillStyle = dark; rr(-132, 176, 264, 46, 22); ctx.fill(); ctx.stroke();
    ctx.fillStyle = body; rr(-124, 170, 248, 20, 10); ctx.fill();
  }
  ctx.restore();
}
// props of the lounge
function candle(x, y, lt, u) {
  const flick = .75 + .25 * Math.sin(lt * 17) * Math.sin(lt * 7.3) + .1 * (hash(Math.floor(lt * 11)) - .5), h = lerp(44, 17, u * 1.1);
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.fillStyle = '#fdf1d8'; rr(-14, -h, 28, h, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2c7d6'; rr(-14, -h, 28, Math.min(10, h), 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(253,241,216,.95)'; ctx.beginPath(); ctx.moveTo(8, -h + 6); ctx.quadraticCurveTo(13, -h + 20, 10, -h + 28); ctx.lineTo(5, -h + 8); ctx.fill();   // a drip of wax
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, -h - 8); ctx.stroke();
  ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(0, -h - 28 - 7 * flick); ctx.quadraticCurveTo(11, -h - 14, 0, -h - 6); ctx.quadraticCurveTo(-11, -h - 14, 0, -h - 28 - 7 * flick); ctx.fill();
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.moveTo(0, -h - 20 - 4 * flick); ctx.quadraticCurveTo(5, -h - 13, 0, -h - 8); ctx.quadraticCurveTo(-5, -h - 13, 0, -h - 20 - 4 * flick); ctx.fill();
  ctx.restore();
  glow11(x, y - h - 18, 150 + 30 * flick, '255,190,110', .5 * flick, 'screen', .8); V2.addLight({ x, y: y - h - 18, r: 650, color: '255,190,110', a: .5 * flick });
}
function cupAt(x, y, k, tt) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k * U, k * U); EXT.prop.icedcup(1, {}, tt); ctx.restore(); }
function basin(x, y, lt) {   // the pedicure basin: a pink-white tub of rosy water with petals and steam
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 10, 92, 15); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillStyle = '#f4ecf6'; ctx.beginPath(); ctx.moveTo(-84, -26); ctx.lineTo(84, -26); ctx.lineTo(66, 8); ctx.quadraticCurveTo(0, 20, -66, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ell(0, -26, 84, 22); ctx.fill(); ctx.stroke();
  ctx.fillStyle = V2.grad(-70, -34, 70, -16, [[0, '#ffb6cf'], [1, '#ff8fb1']]); ell(0, -25, 70, 16); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ell(-22, -30, 24, 4); ctx.fill();
  for (let i = 0; i < 7; i++) { const px = (hash(i + 4) - .5) * 112 + 6 * Math.sin(lt * .9 + i * 2), py = -25 + (hash(i + 11) - .5) * 14; ctx.fillStyle = i % 2 ? '#ff4f7a' : '#ff7a9c'; ctx.save(); ctx.translate(px, py); ctx.rotate(hash(i) * 3); ell(0, 0, 8, 4.5); ctx.fill(); ctx.restore(); }
  ctx.restore();
  V2.smoke(x, y - 40, lt, 0, { n: 9, rate: 4.2, life: 2.2, rise: 130, spread: 26, size: 26, color: '255,240,248', alpha: .34, seed: 11 });
}
function speaker(x, y, lt) {   // the lounge speaker on the floor, notes drifting up from it
  ctx.save(); ctx.translate(x, y); ctx.scale(U, U); ctx.strokeStyle = INK; ctx.lineWidth = 4;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 2, 50, 10); ctx.fill();
  ctx.fillStyle = '#3a3a48'; rr(-38, -132, 76, 128, 14); ctx.fill(); ctx.stroke();
  const beat = 1 + .06 * Math.max(0, Math.sin(lt * 9));
  for (const [cy2, r] of [[-96, 20], [-44, 26]]) { ctx.fillStyle = '#16161e'; ell(0, cy2, r * beat, r * beat); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a5a70'; ell(0, cy2, r * .38, r * .38); ctx.fill(); }
  ctx.restore();
  for (let i = 0; i < 3; i++) { const q = ((lt * .5 + i / 3) % 1); note(x - 12 + 22 * Math.sin(q * 5 + i), y - 120 * U - q * 110, .8, Math.sin(q * 4 + i) * .3, `rgba(255,235,170,${1 - q})`); }
}
function note(x, y, s, a, col) {   // a musical note
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ell(0, 0, 8, 6, -.4); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(7, -30); ctx.quadraticCurveTo(18, -26, 17, -14); ctx.stroke(); ctx.restore();
}
function sparkle(x, y, r, a, col = '#fff6c0') {   // a four-point glint
  if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const an = i * PI / 4 - PI / 2, R = i % 2 ? r * .22 : r; ctx.lineTo(Math.cos(an) * R, Math.sin(an) * R); } ctx.closePath(); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ Strawberry: accessories for the spa look
EXT.acc.crack11 = (o, k, t, layer) => {   // the clay mask dries and cracks as her guilt peaks: o.crackK 0..1 grows hairline cracks across the cheeks and nose
  if (layer !== 'front' || !(o.crackK > .01)) return;
  const c = o.crackK; ctx.save(); ctx.strokeStyle = `rgba(60,90,40,${.4 + .5 * c})`; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const line = (pts, kk) => { if (c < kk) return; const f = clamp((c - kk) * 3); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y], i) => { const p = clamp(f * pts.length - i - 1 + 1, 0, 1); ctx.lineTo(lerp(pts[i][0], x, p), lerp(pts[i][1], y, p)); }); ctx.stroke(); };
  for (const s of [-1, 1]) {
    const cx = s * (k.eyeX + k.er * 1.55), cy = k.mouthY - 6;
    line([[cx - 16 * s, cy - 14], [cx - 6 * s, cy - 2], [cx - 14 * s, cy + 4], [cx - 4 * s, cy + 14]], .05); line([[cx + 12 * s, cy - 10], [cx + 4 * s, cy], [cx + 16 * s, cy + 8]], .3);
  }
  line([[0, k.eyeY + 14], [-3, k.eyeY + 22], [3, k.eyeY + 28]], .15);
  ctx.restore();
};
EXT.acc.cuke11 = (o, k, t, layer) => {   // the cucumber slices over the eyes (Episode 9's, with a tremble): o.cukes = [left, right], o.cukeTremble in px
  if (layer !== 'front') return;
  const on = o.cukes || [1, 1], tr = o.cukeTremble || 0;
  [[0, -1], [1, 1]].forEach(([i, s]) => { if (!on[i]) return; ctx.save(); ctx.translate(s * k.eyeX + tr * Math.sin(t * 61 + i * 2), k.eyeY + tr * Math.sin(t * 53 + i)); ctx.rotate(s * .18); ctx.scale(k.er * 1.55 / 29, k.er * 1.55 / 29); EXT.prop.cukeslice9(s, o, t); ctx.restore(); });
};
const exprMix = (a, c, k) => { const A = EXPR[a], B2 = EXPR[c], r = {}; for (const f of ['ang', 'raise', 'curve', 'lid', 'wide', 'pup']) r[f] = lerp(A[f], B2[f], k); r.o = k < .5 ? A.o : B2.o; r.smirk = k < .5 ? A.smirk : B2.smirk; r.asym = k < .5 ? A.asym : B2.asym; return r; };
const seatExpr = g => g < .35 ? exprMix('chill', 'neutral', g / .35) : g < .65 ? exprMix('neutral', 'sour', (g - .35) / .3) : exprMix('sour', 'grumpy', clamp((g - .65) / .3));

// slow motion for the snap: effect time runs at 28% from the boing for 0.75 s of real time, then catches up
const slowT = lt => { const t0 = TSNAP(), a = lt - t0; if (a <= 0) return a; if (a < .75) return a * .28; return .21 + (a - .75) * 1.0; };
const sipAmt = lt => { let m = 0; for (const [a, c] of [[3.0, 3.5], [6.0, 6.4], [10.0, 10.7], [12.5, 12.85], [17.3, 17.76]]) m = Math.max(m, sk(lt, a, a + .3) * (1 - sk(lt, c - .3, c))); return m; };
const phoneOn = lt => lt >= b('c1').s - .1 && lt < b('c4').e + .3;
const upAt = lt => lt >= TSNAP() ? easeBack(seg(slowT(lt), 0, .5)) : 0;                        // bolt upright after the boing, in slow motion
const seatY = lt => 98 - 22 * guiltAt(lt) - 24 * upAt(lt);                                       // her body anchor in chair-local px
const seatCentreY = lt => PCY + (seatY(lt) - 118.8) * U;                                       // her body centre on screen
const TWAKE = () => b('s6').s + .02;                            // she leaves the chair
const SY = { chairFeet: 1272, floor: 1358 };                    // screen y of her feet at the instant she leaves the seat / on the lounge floor in front of the chair

// seated in the chair, in chair-local coordinates (the caller applies translate(PCX, PCY) and scale(U))
function strawSeat(lt, ctxo) {
  const g = guiltAt(lt), sn = TSNAP(), post = lt >= sn, sl = slowT(lt), spa = lt >= b('lapse1').s + .55, toeP = Math.max(pulse(lt, 3.2, .4), pulse(lt, 5.3, .4), pulse(lt, 10.5, .4), pulse(lt, 11.5, .4), pulse(lt, 16.6, .4), pulse(lt, 20.1, .5));
  const sip = sipAmt(lt), talkS = ['s1', 's2', 's3'].some(id => inB(lt, id)), loud = ['s4', 's5', 's6'].some(id => inB(lt, id));
  const up = upAt(lt);
  const brow = 9 * (pulse(lt, wordT('c1', 'strawberry', 1.6), .3) + pulse(lt, wordT('c2', 'which', 5.2), .3) + pulse(lt, wordT('c3', 'strawberry', 11.2), .3) + pulse(lt, wordT('c4', 'strawberry', 16.5), .3) + pulse(lt, 20.0, .4));
  const acc = ['clay9', 'crack11', 'steth', 'bandage7', 'perdiem9'];
  if (spa) acc.push('robe9'); if (!post) acc.push('cuke11'); if (spa) acc.push('turban9');
  const o = A11.straw({ id: 'straw', who: talkS ? 'strawphone' : 'straw', x: 0, y: seatY(lt), s: 1, noLegs: true, noShadow: true, noReflect: true, cap: false, acc, t: lt, lift: 11.8,
    expr: post ? (sl < .55 ? 'shock' : 'angry') : 'neutral', face: post ? undefined : seatExpr(g), lid: post ? 0 : undefined, browUp: post ? 0 : brow, look: [0, 0],
    rot: post ? .02 * Math.sin(lt * 40) * (1 - up) : -.04 * (1 - g * .8) + .012 * Math.sin(lt * 1.7) + (loud ? .018 * Math.sin(lt * 31) : 0), sway: .02, sy: 1 + .14 * (post ? pulse(sl, .02, .7) : 0), sx: 1 - .06 * (post ? pulse(sl, .02, .7) : 0),
    cukes: [1, 1], cukeTremble: 1.6 * clamp((g - .55) * 3) * (post ? 0 : 1) + (post ? 0 : 3 * pulse(lt, sn - .12, .12)), crackK: clamp((lt - b('s4').s) / 3.2) * (post ? 1 : 1),
    shake: post ? 0 : 4.5 * clamp((g - .88) * 8) + 1.8 * clamp((g - .6) * 2) * (loud ? 1 : 0) });
  // arms: the left hand rests on the chair arm, the right takes the iced coffee to her mouth for each sip; after the snap both fists clench the arms
  o.hold = {}; o.grip = {}; o.hand = {}; o.arms = { l: 'hold', r: 'hold' };
  o.grip.l = [-160 + (post ? 6 * Math.sin(lt * 45) : 0), -28]; o.hand.l = post ? 'fist' : (g > .85 ? 'fist' : 'open');
  if (post) { o.grip.r = [160, -28]; o.hand.r = 'fist'; }
  else if (sip > 0) { o.hold.r = 'sipcup9'; o.cupTilt = lerp(0, -1.0, easeIO(sip)); o.grip.r = [lerp(205, 82, easeIO(sip)), lerp(30, 66, easeIO(sip))]; o.hand.r = 'grip'; }
  else { o.grip.r = [165, -28]; o.hand.r = g > .85 ? 'fist' : 'open'; }
  return { o, toe: -.34 * toeP };
}
// the standing, leaping, launching Strawberry in SCREEN coordinates (legs on), from the hop out of the chair to the landing in the hall
const FLY = lt => { const t0 = TRUN(), tl = TLAND(); return 1 - Math.pow(1 - seg(lt, t0, tl), 2.46); };   // 0 on the lounge floor, 1 landed; fast off the mark, then a glide
function strawFly(lt) {
  const tw = TWAKE(), tr = TRUN(), tl = TLAND(), hu = seg(lt, tw, tw + .55);
  let x = PCX, y, s = lerp(U, .93, easeIO(seg(lt, tw, tw + .55))), sq = 0, lift = 0, arms = { l: 'down', r: 'down' }, hand, grip, legs, expr = 'angry';
  if (lt < tw + .55) { const y0 = seatCentreY(tw) + 179.2; y = lerp(y0, SY.floor, easeIO(hu)) - 4 * 22 * hu * (1 - hu); s = lerp(U, .93, easeIO(hu)); sq = -.3 * (1 - sk(hu, 0, .35)) + .35 * pulse(hu, .86, .3); arms = { l: 'cheer', r: 'cheer' }; hand = { l: 'fist', r: 'fist' }; legs = hu < .85 ? 'kick' : undefined; expr = 'angry'; }
  else if (lt < tr) {
    y = SY.floor; const sh = Math.sin(lt * 7), cr = sk(lt, tr - .2, tr - .02);
    sq = .08 * pulse(lt, tw + .55, .25) + .36 * cr;                                       // the crouch before the launch
    arms = lt < tr - .55 ? { l: 'down', r: 'up' } : { l: 'down', r: 'down' }; hand = { l: 'fist', r: 'fist' };
    if (lt < tr - .55) { const w3 = wordT('s6', 'contract', 22.7); arms = lt >= w3 - .1 ? { l: 'cheer', r: 'cheer' } : { l: 'down', r: 'down' }; }
    x = PCX + 2.5 * sh * (1 - cr); legs = undefined;
  } else {
    const f = FLY(lt); y = lerp(SY.floor, 764.6, f); s = lerp(.93, .96, f); x = PCX; sq = -.34 * (1 - f) * (lt < tr + .16 ? 1 : 0) ; arms = { l: 'run', r: 'run' }; hand = undefined; legs = lt < tl ? 'kick' : undefined; expr = 'angry';
  }
  const acc = ['clay9', 'crack11', 'steth', 'bandage7', 'perdiem9', 'robe9', 'turban9'];
  const o = A11.straw({ id: 'straw', who: 'straw', x, y, s, cap: false, acc, t: lt, expr, lid: 0, look: [0, -.1], arms, hand, grip, legs, squash: sq, plant: true, lift: 0, crackK: 1, sway: .05, badgeSwing: lt >= tr ? .3 : 0, transit: lt >= tr - .02 && lt < tl + .05 });
  o.lift = 0; if (lt < tw + .55) o.lift = 0;
  return o;
}
// after the landing she is a hall actor
const SLAND = [0, 0];   // (X, Z) of the landing spot, set when the hall camera is known (see sceneMerge)
function strawHall(lt, cam) {
  const tl = TLAND(), land = [cam.lx, cam.lz], P = route([[tl, land[0], land[1]], [tl + .2, land[0], land[1]], [24.5, -130, 4500, 'in'], [25.4, -125, 5800]]);
  const [X, Z] = P(lt), run = spd(P, lt) > 40, scr = lt < tl + .2;
  const o = A11.straw(Object.assign(V2.at(X, Z), { id: 'straw', who: 'straw', cap: false, acc: ['clay9', 'crack11', 'steth', 'bandage7', 'perdiem9', 'robe9', 'turban9'], t: lt, expr: lt < tl + .5 ? 'angry' : 'panic', lid: 0, look: [0, -.1], arms: { l: 'run', r: 'run' }, crackK: 1, plant: true, badgeSwing: .35, squash: .3 * pulse(lt, tl - .02, .22), lift: 0 }));
  o.lift = 0;
  if (run || scr) { o.gaitW = lt * (scr ? 700 : 400); o.axis = 'z'; o.dir = -1; o.vx = 0; }
  return { o, X, Z, scr };
}

// ------------------------------------------------------------------ Mango, passing through the lounge
const MP = route([[8.7, 860, 1660], [9.35, 340, 1660, 'out'], [11.05, 340, 1660], [11.9, 900, 1660, 'in']]);   // in from the right edge along the back wall, stops by the window, leaves the way she came
function mangoObj(lt) {
  if (lt < 8.6 || lt > 12.0) return null;
  const q = V2.at(...MP(lt)), moving = spd(MP, lt) > 20, m1 = inB(lt, 'm1'), talk = m1;
  const o = A7.mango(Object.assign(q, { s: q.s * .8, id: 'mango', who: 'mango', expr: m1 ? 'smug' : lt > b('m1').e ? 'neutral' : 'neutral', look: [-.9, .05], arms: { l: 'hold', r: 'rest' }, hold: { l: 'clipboard6' }, grip: { l: [-86, 30] }, clipText: 'BREAK LOG', t: lt, noReflect: true, transit: lt < 9.4 || lt > 10.9 }));
  if (moving) { o.gaitW = pathDistM(lt); o.axis = 'x'; o.dir = MP(lt + .04)[0] > MP(lt - .04)[0] ? 1 : -1; if (o.dir > 0) o.look = [.8, 0]; }
  if (m1 && lt > b('m1').e - .5) { o.arms.r = 'shrug'; }
  void talk;
  return o;
}
const pathDistM = lt => { let d = 0, p = MP(8.6); for (let t = 8.64; t <= lt; t += .04) { const q = MP(t); d += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; } return d; };

// ------------------------------------------------------------------ the lounge draw
function cukeFlight(lt) {   // the two slices, thrown from her eyes in slow motion (fast off the eyes, then hanging): the left lands in the pedicure basin, the right on the side table
  const a = lt - TSNAP(), sl = a <= 0 ? a : a < .75 ? Math.min(a, .07) + Math.max(0, a - .07) * .3 : .274 + (a - .75), out = [];
  if (sl <= 0) return out;
  [[-1, 379, 1104, 150, 1322], [1, 441, 1104, 690, 1197]].forEach(([s, x0, y0, xl, yl]) => {
    const vy = -620, g = 1800, T = (-vy + Math.sqrt(vy * vy + 2 * g * (yl - y0))) / g, u = Math.min(sl, T), vx = (xl - x0) / T;
    out.push({ x: x0 + vx * u, y: y0 + vy * u + .5 * g * u * u, a: s * 14 * u * (sl < T ? 1 : 0) + s * .3, k: lerp(1, 1.25, Math.sin(clamp(u / T) * PI)) * U * 1.26, landed: sl >= T });
  });
  return out;
}
function loungeDraw(lt, o = {}) {   // o.noStraw leaves her out (the frozen slab); o.frame is the panel's 2D framing {z, px, py}
  const tt = lt, u = todU(tt), sn = TSNAP();
  const kf = o.frame || { z: 1, px: PCX, py: 905 };
  ctx.save(); ctx.translate(kf.px, kf.py); ctx.scale(kf.z, kf.z); ctx.translate(-kf.px, -kf.py);
  loungeRoom(tt);
  // the light of the room by the time of day, then the practical lights
  const warm = 1 - clamp(u / .56);
  V2.setLight({ key: [.45, -.55], keyColor: mixc('#ffd9a0', '#9fb4ff', clamp(u * 1.5 - .1)), keyA: lerp(.3, .18, u), rim: mixc('#c9a0ff', '#7f9cff', u), rimA: .5, shadow: '#1a1030', shadowA: .36 + .1 * u, amb: mixc('#e8c8ff', '#7080d8', u), ambA: .08 + .06 * u, bounce: '#ffcf99', bounceA: .22 * (1 - .5 * u) });
  V2.opts.reflect = false;
  giantClock(lt);                                    // the time-lapse's ghost clock hands: over the room, behind everything in it
  // the rug, the speaker, the basin
  { ctx.save(); ctx.fillStyle = '#b86a8a'; ctx.strokeStyle = 'rgba(25,16,30,.45)'; ctx.lineWidth = 3; ell(PCX + 34, 1334, 292, 54); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8a6bf'; ell(PCX + 34, 1334, 244, 42); ctx.fill(); ctx.restore(); }
  speaker(902, 1334, lt);
  basin(152, 1336, lt);
  // the side table: candle, the coffees (one arrives with each time-lapse)
  { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(TX, TY + 132, 86, 13); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillStyle = '#7d5a3a'; rr(TX - 8, TY + 10, 16, 118, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a4a2e'; ell(TX, TY + 126, 54, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9a26a'; ell(TX, TY, 96, 19); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#dcbc84'; ell(TX, TY - 3, 85, 14); ctx.fill(); ctx.restore(); }
  const cupHome = sipAmt(lt) > 0 ? 0 : 1;
  cupAt(TX - 58, TY - 2, cupHome, tt);
  cupAt(TX - 8, TY + 2, easeBack(seg(lt, b('lapse1').e - .5, b('lapse1').e - .1)), tt);
  cupAt(TX + 36, TY - 1, easeBack(seg(lt, b('lapse2').e - .5, b('lapse2').e - .1)), tt);
  candle(TX + 62, TY - 3, lt, u);
  // Mango: behind the chair's depth, in front of the wall
  const mg = mangoObj(lt); if (mg) { V2.setCam(LCAM); drawChar(mg); }
  // the chair, her, and the chair's front
  const showSeat = !o.noStraw && lt < TWAKE(), showFly = !o.noStraw && lt >= TWAKE(), ss = showSeat ? strawSeat(lt) : { toe: 0 };
  chair11('back', tt);
  if (showSeat) { ctx.save(); ctx.translate(PCX, PCY); ctx.scale(U, U); drawChar(ss.o); ctx.restore(); }
  chair11('front', tt, { toe: ss.toe, noLegs: !showSeat });
  // the call coming in: a green ring beside her right ear
  if (showSeat && phoneOn(lt)) {
    const cx = PCX + 118 * U, cy = PCY - 98 * U; ctx.save(); ctx.translate(cx, cy); ctx.scale(.8, .8);
    for (let i = 0; i < 3; i++) { const q = ((tt * 2 - i * .33) % 1 + 1) % 1; ctx.strokeStyle = `rgba(127,224,160,${.8 * (1 - q)})`; ctx.lineWidth = 4 * (1 - q) + 1; ctx.beginPath(); ctx.arc(0, 0, 24 + q * 30, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#2fbf71'; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ell(0, 0, 24, 24); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.rotate(-.75); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 4, 11, PI * 1.12, PI * 1.88); ctx.stroke(); ctx.restore(); ctx.restore();
  }
  if (showFly) drawChar(strawFly(lt));   // out of the chair: drawn in front of it
  // twelve zZz bubbles over twelve dark domes: "They're all asleep."
  for (let j = 0; j < 12; j++) {
    const at = wordT('s3', 'twelve', 13.15) + .02 + j * .075, p = easeBack(seg(lt, at, at + .2)), out = 1 - seg(lt, b('lapse2').s + .2, b('lapse2').s + .55); if (p <= .02 || out <= 0) continue;
    const X = -410 + j * 56, [bx, by] = V2.p2(X, 262, ZB - 2), bob = 2 * Math.sin(tt * 2.4 + j * .8);
    ctx.save(); ctx.globalAlpha *= clamp(p * 2) * out; ctx.translate(bx, by - 12 + bob); ctx.scale(p, p);
    ctx.fillStyle = '#f4efff'; ctx.strokeStyle = '#4b3a78'; ctx.lineWidth = 3; rr(-24, -14, 48, 28, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(0, 20); ctx.lineTo(6, 12); ctx.closePath(); ctx.fillStyle = '#f4efff'; ctx.fill(); ctx.stroke(); ctx.fillRect(-5, 10, 10, 4);
    text('zZz', 0, 1, { size: 22, fill: '#5a3f9a', weight: 900, spacing: 0 });
    ctx.restore();
  }
  // the snap: the cucumber slices arc away; the clay flakes; a glow of guilt
  for (const c of cukeFlight(lt)) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a); ctx.scale(c.k, c.k); EXT.prop.cukeslice9(1, {}, 0); ctx.restore(); }
  if (lt > sn && lt < sn + 3) for (let i = 0; i < 9; i++) { const a = slowT(lt) - hash(i + 3) * .08; if (a < 0) continue; const x = PCX + (hash(i + 20) - .5) * 160 * U + (hash(i + 8) - .5) * 280 * a, y = 1090 + 40 * hash(i + 5) + 700 * a * a - 160 * a; ctx.save(); ctx.globalAlpha *= 1 - seg(a, .5, .95); ctx.translate(x, y); ctx.rotate(a * 8 + i); ctx.fillStyle = 'rgba(150,200,120,.95)'; ctx.strokeStyle = 'rgba(70,110,50,.8)'; ctx.lineWidth = 1.6; ctx.fillRect(-5, -3.5, 10, 7); ctx.strokeRect(-5, -3.5, 10, 7); ctx.restore(); }
  // sparkles at the cha-ching (the money, from the band, falls on the lounge like confetti)
  for (const id of ['lapse1', 'lapse2']) { const tc = b(id).s + CHA[id], a = lt - tc; if (a > 0 && a < .8) for (let i = 0; i < 7; i++) sparkle(PCX - 260 + 520 * hash(i + 3 + id.length) + 30 * Math.sin(a * 6 + i), 930 + 220 * hash(i + 9) * a * 1.4, 10 + 10 * hash(i), Math.sin(clamp(a / .8) * PI)); }
  ctx.restore();
}

// ------------------------------------------------------------------ the divider band: the PER DIEM odometer and the GUILT thermometer
function wheelPos(cents) {   // odometer wheels (Episode 9's): wheel 0 turns freely, every other wheel advances only while the one below it rolls from 9 to 0
  const pos = [cents];
  for (let i = 1; i < 5; i++) { const p = pos[i - 1]; pos.push(Math.floor(p / 10) + clamp((p % 10 + 10) % 10 - 9)); }
  return pos;
}
function wheel(cx, cy, w, h, pos, o) {
  ctx.save(); ctx.beginPath(); ctx.rect(cx - w / 2, cy - h / 2, w, h); ctx.clip();
  ctx.fillStyle = V2.grad(0, cy - h / 2, 0, cy + h / 2, [[0, '#07110c'], [.5, '#14261c'], [1, '#07110c']]); ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  const base = Math.floor(pos), f = pos - base, fast = o.fast || 0;
  for (let d = -1; d <= 2; d++) {
    const val = (((base + d) % 10) + 10) % 10, y = cy + (d - f) * h * .84;
    for (let g = fast > .5 ? 2 : 0; g >= 0; g--) { const gy = y + (g ? (g === 2 ? -1 : 1) * h * .26 * fast : 0); text(String(val), cx, gy + 2, { size: h * .94, font: 'Bangers', weight: 400, fill: o.fill, alpha: g ? .38 : 1, lw: g ? 0 : 5, stroke: '#04100a', spacing: 1 }); }
  }
  ctx.fillStyle = V2.grad(0, cy - h / 2, 0, cy + h / 2, [[0, 'rgba(0,0,0,.6)'], [.3, 'rgba(0,0,0,0)'], [.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}
const BOXY = BAND[0] + 16, BOXH = 100, BOXW = 492, MX = 30, GX = 558;
const addOnAt = () => b('s6').e - .2;                           // the header flips to the add-on rate on "contract!": helping is billable
// the money meter: dollars and cents since 3:00 PM at the per diem rate; the wheels blur during a time-lapse and land on the cha-ching
function moneyMeter(lt, nobloom) {
  const x0 = MX, y0 = BOXY, w = BOXW, h = BOXH, cents = centsAt(lt), pos = wheelPos(cents), mv = spinning(lt), addOn = lt >= addOnAt();
  const tc = lt < b('lapse2').s ? b('lapse1').s + CHA.lapse1 : b('lapse2').s + CHA.lapse2, fl = pulse(lt, tc, .5) * (lt < b('lapse1').s ? 0 : 1);
  const acc = addOn ? '#ffd23a' : COL.money, spin = mv || addOn && lt < TRUN() + .6 ? 1 : 0;
  ctx.save();
  ctx.shadowColor = mv || fl > 0 || addOn ? (addOn ? 'rgba(255,210,58,.7)' : 'rgba(109,255,154,.7)') : 'rgba(0,0,0,.5)'; ctx.shadowBlur = mv || fl > 0 || addOn ? 30 : 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = V2.grad(0, y0, 0, y0 + h, [[0, '#14301f'], [1, '#08140d']]); rr(x0, y0, w, h, 24); ctx.fill(); ctx.shadowColor = 'transparent';
  if (fl > 0) { ctx.fillStyle = `rgba(190,255,215,${.5 * fl})`; rr(x0, y0, w, h, 24); ctx.fill(); }
  ctx.strokeStyle = acc; ctx.lineWidth = 5; rr(x0, y0, w, h, 24); ctx.stroke();
  text(addOn ? 'HELPING' : 'PER DIEM', x0 + 24, y0 + 24, { size: 24, fill: addOn ? '#fff0b0' : '#c8ffd9', align: 'left', spacing: 2 });
  const flip = addOn ? easeBack(seg(lt, addOnAt(), addOnAt() + .22)) : 1;
  ctx.fillStyle = acc; rr(x0 + w - 198, y0 + 9, 174, 30, 15); ctx.fill();
  ctx.save(); ctx.translate(x0 + w - 111, y0 + 24); ctx.scale(1, Math.max(.05, flip)); text(addOn ? '$200/HR' : '$118/HR', 0, 1, { size: 22, fill: '#0c1a12', spacing: 1, maxW: 160 }); ctx.restore();
  const ww = 42, hh = 46, gx = 4, total = 22 + 3 * (ww + gx) + 16 + 2 * (ww + gx), sx = x0 + (w - total) / 2, cyd = y0 + 66;
  let x = sx;
  text('$', x + 10, cyd + 2, { size: 46, font: 'Bangers', weight: 400, fill: acc, lw: 5, stroke: '#04100a' }); x += 22 + gx;
  for (const i of [4, 3, 2]) { wheel(x + ww / 2, cyd, ww, hh, pos[i], { fill: fl > .5 ? '#fff' : acc, fast: spin }); x += ww + gx; }
  ctx.fillStyle = acc; ell(x + 7, cyd + 17, 5, 5); ctx.fill(); x += 16;
  for (const i of [1, 0]) { wheel(x + ww / 2, cyd, ww, hh, pos[i], { fill: fl > .5 ? '#fff' : acc, fast: spin }); x += ww + gx; }
  { const zones = [[x0 + 24, y0 + 40, x0 + 100, y0 + 90], [x0 + 392, y0 + 42, x0 + 468, y0 + 90]];   // glints only in the two clear margins beside the digits
    for (let i = 0; i < 4; i++) { const u = ((lt * (mv ? 2.4 : .7) + i * .26) % 1), sd = i + Math.floor(lt * (mv ? 6 : 1.4)) * 3, z = zones[i % 2], r = mv ? 12 : 8; sparkle(lerp(z[0] + r, z[2] - r, hash(sd)), lerp(z[1] + r, z[3] - r, hash(sd + 9)), r, Math.sin(u * PI) * (mv ? 1 : .7), addOn ? '#fff0b0' : '#d8ffe4'); } }
  ctx.restore();
  if (fl > 0 && !nobloom) V2.glow(x0 + w / 2, y0 + h / 2, 280, '109,255,154', .5 * fl, 'screen', .5);
  // the cha-ching pops a +$ out of the meter and into the lounge below
  { const a = lt - tc; if (a > 0 && a < .9 && lt >= b('lapse1').s) { const id = lt < b('lapse2').s ? 0 : 1, gain = (HRS[id + 1] - HRS[id]) * 118; ctx.save(); ctx.globalAlpha *= 1 - seg(a, .5, .9); text(`+$${gain.toFixed(2)}`, x0 + w / 2, y0 + h + 32 + 22 * easeOut(clamp(a / .6)), { size: 44, font: 'Bangers', weight: 400, fill: COL.money, lw: 8, stroke: '#04100a', spacing: 1.5 }); ctx.restore(); } }
}
// the guilt thermometer: a glass tube, red mercury from the bulb, ticks; it shakes as it nears the top and bursts on the boing
const TUBE = { x0: GX + 190, x1: GX + 464, y: BOXY + 60, th: 28, r: 25 };
function guiltMeter(lt, nobloom) {
  const x0 = GX, y0 = BOXY, w = BOXW, h = BOXH, tb = TSNAP(), burst = lt >= tb, a = lt - tb, sa = slowT(lt), g = burst ? 1 : clamp(guiltAt(lt) + .012 * Math.sin(lt * 33) * clamp((guiltAt(lt) - .8) * 5));
  const hot = clamp((g - .55) / .45), beat = Math.max(0, Math.sin(lt * (4 + 9 * g))) * hot, vib = burst ? 0 : 2.4 * clamp((g - .9) * 10), gp = guiltPulse(lt);
  ctx.save(); ctx.translate(vib * Math.sin(lt * 70), vib * Math.sin(lt * 61));
  ctx.shadowColor = `rgba(255,59,85,${.35 + .5 * hot})`; ctx.shadowBlur = 16 + 22 * beat; ctx.shadowOffsetY = 6;
  ctx.fillStyle = V2.grad(0, y0, 0, y0 + h, [[0, '#33121f'], [1, '#14070e']]); rr(x0, y0, w, h, 24); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = `rgba(255,90,122,${.12 * hot * beat + .35 * gp * .5})`; rr(x0, y0, w, h, 24); ctx.fill();
  ctx.strokeStyle = COL.guilt; ctx.lineWidth = 5; rr(x0, y0, w, h, 24); ctx.stroke();
  // the label shakes harder as it fills
  { const sh = burst ? 7 : 4.5 * hot * hot; ctx.save(); ctx.translate(sh * Math.sin(lt * 53), sh * .7 * Math.sin(lt * 47 + 1));
    text('GUILT', x0 + 78, y0 + 32, { size: 44, font: 'Bangers', weight: 400, fill: burst ? '#fff' : '#ffd1dc', lw: 6, stroke: '#2a0610', spacing: 2 });
    text(`${Math.round(g * 100)}%`, x0 + 78, y0 + 76, { size: 40, font: 'Bangers', weight: 400, fill: burst ? '#ff3b55' : mixc('#ffb0c0', '#ff3b55', hot), lw: 6, stroke: '#2a0610', spacing: 1 }); ctx.restore(); }
  // the tube: ticks above, glass, mercury
  const { x0: tx0, x1: tx1, y: ty, th, r } = TUBE, bx = tx0 - 4, len = tx1 - tx0;
  ctx.strokeStyle = 'rgba(255,225,232,.75)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (let i = 0; i <= 10; i++) { const x = tx0 + len * i / 10, major = i % 5 === 0; ctx.beginPath(); ctx.moveTo(x, ty - th / 2 - (major ? 15 : 9)); ctx.lineTo(x, ty - th / 2 - 4); ctx.stroke(); }
  const level = tx0 + len * g;
  const glassTube = (xa, xb, alpha = 1) => { ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = 'rgba(225,240,255,.14)'; rr(xa, ty - th / 2, xb - xa, th, th / 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = 3; rr(xa, ty - th / 2, xb - xa, th, th / 2); ctx.stroke(); ctx.restore(); };
  if (!burst) {
    glassTube(bx, tx1);
    ctx.fillStyle = V2.grad(0, ty - th / 2, 0, ty + th / 2, [[0, '#ff7a9a'], [.5, '#ff3b55'], [1, '#c01234']]); rr(bx, ty - th / 2 + 3, Math.max(1, level - bx), th - 6, (th - 6) / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(bx + 8, ty - th / 2 + 6, Math.max(2, level - bx - 16), 4, 2); ctx.fill();
  } else {
    // the burst, in slow motion: the glass cap pops off, the tube splits into four and falls, mercury sprays up and lands in the lounge
    const k = easeOut(clamp(sa / .35));
    glassTube(bx, tx0 + len * .06, 1);
    for (let i = 0; i < 4; i++) {   // four pieces of tube, each tumbling away
      const xa = tx0 + len * (.06 + .235 * i), xb = xa + len * .235, mid = (xa + xb) / 2, vx = (i - 1.5) * 90, vy = -140 + i * 25, spinr = (i % 2 ? 1 : -1) * (1.6 + i * .5), tt2 = Math.max(0, sa - .02 * i);
      ctx.save(); ctx.translate(mid + vx * tt2, ty + vy * tt2 + 1500 * tt2 * tt2 * .5); ctx.rotate(spinr * tt2); ctx.translate(-mid, -ty);
      ctx.fillStyle = 'rgba(225,240,255,.16)'; rr(xa, ty - th / 2, xb - xa, th, 5); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; rr(xa, ty - th / 2, xb - xa, th, 5); ctx.stroke();
      ctx.fillStyle = '#ff3b55'; rr(xa + 2, ty - th / 2 + 5, xb - xa - 4, th - 10, 4); ctx.fill(); ctx.restore();
    }
    // the cap
    { const cx = tx1 + 90 * sa, cy = ty - 360 * sa + 1700 * sa * sa * .5; ctx.save(); ctx.translate(cx, cy); ctx.rotate(9 * sa); ctx.fillStyle = 'rgba(225,240,255,.3)'; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 14, -PI / 2, PI / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // mercury: a fountain of droplets from the top end and from the break
    for (let i = 0; i < 26; i++) {
      const h0 = hash(i * 1.7 + 4), h1 = hash(i * 2.9 + 8), t0d = h0 * .05, tt2 = Math.max(0, sa - t0d), ox = i % 3 ? tx1 - 6 : lerp(tx0, tx1, h1), vx = (h1 - .35) * 420, vy = -(380 + h0 * 560), gx = 1900;
      const px = ox + vx * tt2, py = ty + vy * tt2 + .5 * gx * tt2 * tt2; if (py > ty + 420) continue; ctx.fillStyle = '#ff3b55'; ctx.strokeStyle = '#7a0a22'; ctx.lineWidth = 1.8; ell(px, py, 4 + 4 * h1, (4 + 4 * h1) * (1 + .5 * Math.min(1, Math.abs(vy + gx * tt2) / 900)), Math.atan2(vy + gx * tt2, vx) - PI / 2); ctx.fill(); ctx.stroke();
    }
    // cracks over the box front
    ctx.strokeStyle = `rgba(255,255,255,${.9 - .25 * seg(a, .2, 1)})`; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath();
    const cr = [[[tx1 - 6, ty], [tx1 - 40, ty - 38], [tx1 - 34, ty - 52]], [[tx1 - 6, ty], [tx1 - 70, ty + 20], [tx1 - 100, ty + 38], [tx1 - 94, ty + 48]], [[tx1 - 6, ty], [tx1 + 10, ty - 30]], [[tx1 - 40, ty - 38], [tx1 - 90, ty - 40], [tx1 - 120, ty - 30]], [[tx1 - 70, ty + 20], [tx1 - 60, ty + 44]]];
    for (const p of cr) { const kk = clamp(a / .1); ctx.moveTo(p[0][0], p[0][1]); p.slice(1).forEach(([x, y], i) => ctx.lineTo(lerp(p[i][0], x, kk), lerp(p[i][1], y, kk))); }
    ctx.stroke();
  }
  // the bulb, on top of the mercury and the glass
  ctx.fillStyle = V2.grad(0, ty - r, 0, ty + r, [[0, '#ff7a9a'], [.55, '#ff3b55'], [1, '#a50f2c']]); ell(bx - 6, ty, r, r); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ell(bx - 6, ty, r, r); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(bx - 14, ty - 8, 7, 4.5); ctx.fill();
  ctx.restore();
  if (!nobloom) V2.glow(bx - 6, ty, 70 + 40 * hot, '255,59,85', (.25 + .4 * hot) * (.7 + .3 * beat), 'screen', .4);
}
// the band itself: a dark violet bar with slow diagonal hazard stripes and bright seams, plus the two meters
function bandDraw(lt, nobloom) {
  ctx.fillStyle = V2.grad(0, BAND[0], 0, BAND[1], [[0, '#171229'], [.5, '#241a3f'], [1, '#171229']]); ctx.fillRect(0, BAND[0], W, BAND[1] - BAND[0]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, BAND[0], W, BAND[1] - BAND[0]); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let x = -((lt * 60) % 60); x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, BAND[0]); ctx.lineTo(x + 24, BAND[0]); ctx.lineTo(x + 6, BAND[1]); ctx.lineTo(x - 18, BAND[1]); ctx.fill(); }
  ctx.restore();
  for (const y of [BAND[0], BAND[1]]) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(0, y - 3, W, 6); }
  ctx.save(); ctx.beginPath(); ctx.rect(0, BAND[0], W, BAND[1] - BAND[0]); ctx.clip(); giantClock(lt); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, BAND[0] + 3, W, 2); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, BAND[1] - 5, W, 2);   // the bevel: a lit upper lip, a shadowed lower one
  moneyMeter(lt, nobloom); guiltMeter(lt, nobloom);
}

// ------------------------------------------------------------------ glass: the band and the lounge below it break into shards that fly, tumble and fall
const SLAB = [BAND[0] - 4, BOT[1]];                              // the rows of the picture that shatter
const IMPACT = [PCX, BAND[1]];                                   // where her head goes through
const SHARDS = (() => {
  const rays = 14, rings = [0, 80, 190, 360, 620, 1000, 1500], ang = Array.from({ length: rays }, (_, i) => i / rays * TAU + (hash(i * 3.7) - .5) * .24), out = [];
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < rays; i++) {
    const a0 = ang[i], a1 = ang[(i + 1) % rays] + (i === rays - 1 ? TAU : 0), j0 = 1 + (hash(i + j * 9) - .5) * .3, j1 = 1 + (hash(i + j * 9 + 5) - .5) * .3, r0 = rings[j] * j0, r1 = rings[j + 1] * j1;
    const P = [[Math.cos(a0) * r0, Math.sin(a0) * r0], [Math.cos(a1) * r0, Math.sin(a1) * r0], [Math.cos(a1) * r1, Math.sin(a1) * r1], [Math.cos(a0) * r1, Math.sin(a0) * r1]].map(([x, y]) => [IMPACT[0] + x, IMPACT[1] + y]);
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    if (Math.max(...xs) < 0 || Math.min(...xs) > W || Math.max(...ys) < SLAB[0] || Math.min(...ys) > SLAB[1]) continue;
    const cx = P.reduce((s, p) => s + p[0], 0) / 4, cy = P.reduce((s, p) => s + p[1], 0) / 4, d = Math.hypot(cx - IMPACT[0], cy - IMPACT[1]) || 1;
    out.push({ P, cx, cy, vx: (cx - IMPACT[0]) / d, vy: (cy - IMPACT[1]) / d, d, h: hash(i * 7 + j * 13) });
  }
  return out;
})();
let SLABCV = null;
function slabCanvas() { if (!SLABCV) SLABCV = V2.mk(W, SLAB[1] - SLAB[0]); return SLABCV; }
// copy the rows that are about to shatter out of the picture drawn so far
function grabSlab() { const c = slabCanvas(), g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.drawImage(ctx.canvas, 0, SLAB[0], W, SLAB[1] - SLAB[0], 0, 0, W, SLAB[1] - SLAB[0]); }
// draw the shards at age u (seconds since the glass cracked): at rest they are the picture with its cracks lit; then they fly outward, tumble toward the lens and fall
function drawShards(u) {
  const c = slabCanvas();
  ctx.save();
  const crackA = 1 - seg(u, .1, .35), fade = k => 1 - seg(u, .5 + .3 * k, 1.0 + .3 * k);
  for (const s of SHARDS) {
    const t = Math.max(0, u - .04), pow = 1500 / (s.d + 260), sp = (170 + 460 * s.h) * pow * .9, ux = s.vx * sp * t + (s.h - .5) * 120 * t, uy = s.vy * sp * t - 150 * pow * t + 1900 * t * t * .5 * (.5 + s.h * .5), rot = (s.h - .5) * 9 * t * easeOut(clamp(t * 2)), sc = 1 + .8 * t * (s.h * .8 + .3), al = fade(s.h);
    if (al <= 0) continue;
    ctx.save(); ctx.globalAlpha *= al; ctx.translate(s.cx + ux, s.cy + uy); ctx.rotate(rot); ctx.scale(sc, sc * (.55 + .45 * Math.cos(t * (5 + 7 * s.h) + s.h * 6))); ctx.translate(-s.cx, -s.cy);
    ctx.beginPath(); s.P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.save(); ctx.clip(); ctx.drawImage(c, 0, SLAB[0]); ctx.fillStyle = `rgba(210,235,255,${.1 + .12 * s.h})`; ctx.fill(); ctx.restore();
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, .45 + crackA)})`; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ framing: each panel is its own camera
// the hall's 2D framing (zoom, the point put at the panel's centre, roll): wide, then a push toward her face on the pleas, a punch at each time-lapse, a pull-back on the run
function topFrame(lt, face) {
  const NEUT = { z: 1, tx: 540, ty: TMID, r: 0 };
  let z = 1, k = 0, rollx = 0;
  if (lt < b('c1').s) z = lerp(1, 1.04, seg(lt, 0, 1.6));
  else if (lt < b('c2').s) { z = lerp(1.04, 1.34, sk(lt, b('c1').s, b('s1').e)); k = 1; }
  else if (lt < b('lapse1').s) z = 1.0;
  else if (lt < b('m1').s) { z = 1 + .14 * pulse(lt, b('lapse1').s, .35) + .02 * seg(lt, b('lapse1').s, b('lapse1').e); }
  else if (lt < b('c3').s) { z = lerp(1.1, 1.22, seg(lt, b('m1').s, b('m1').e)); k = 1; }
  else if (lt < b('lapse2').s) { z = lerp(1.0, 1.12, seg(lt, b('c3').s, b('s3').s)); k = .55; rollx = lt >= b('s3').s ? .075 * Math.sin(lt * 5.2) * (1 - seg(lt, 14.2, 14.9)) : 0; }
  else if (lt < b('c4').s) z = 1 + .12 * pulse(lt, b('lapse2').s, .35);
  else if (lt < b('s6').s) { z = lerp(1.1, 1.56, sk(lt, b('c4').s, b('s5').e)); k = 1; }
  else if (lt < TF()) { z = lerp(1.56, 1.0, sk(lt, b('s6').s, b('s6').s + .4)); k = 1 - sk(lt, b('s6').s, b('s6').s + .4); }
  const hh = TMID, hand = { x: 5 * vnoise(lt * 1.7) + 2.5 * Math.sin(lt * 7.1), y: 4 * vnoise(lt * 1.3 + 9) + 2 * Math.sin(lt * 6.3), r: .007 * vnoise(lt * 1.1 + 3) + .004 * Math.sin(lt * 5.7) };
  // the framing point: her face where the shot is a close-up, otherwise the panel's centre
  const tx = lerp(540, face[0], k), ty = lerp(hh, face[1], k);
  return { z, tx, ty, dx: hand.x, dy: hand.y, r: hand.r + rollx };
}
// the lounge's framing: calm and locked off, a hair of creep, then the slow-motion push-in on her face for the snap and a snap back out
function loungeFrame(lt) {
  const sa = slowT(lt), tw = TWAKE();
  let z = 1 + .016 * seg(lt, 0, 20);
  if (lt >= TSNAP() && lt < tw) z = lerp(z, 1.36, easeOut(seg(sa, 0, .5)));
  else if (lt >= tw) z = lerp(1.36, 1, sk(lt, tw, tw + .32));
  return { z, px: PCX, py: 905 };
}
const topShot = lt => lt < b('c1').s ? 'wide' : lt < b('c2').s ? 'push' : lt < b('lapse1').s ? 'bounce' : lt < b('m1').s ? 'lapse1' : lt < b('c3').s ? 'pant' : lt < b('lapse2').s ? 'wheel' : lt < b('c4').s ? 'lapse2' : lt < b('s6').s ? 'plea' : lt < TF() ? 'rise' : 'merge';
const botShot = lt => lt < TF() ? 'lounge' : 'merge';

// ------------------------------------------------------------------ panel furniture
const speakerOf = lt => ['c1', 'c2', 'c3', 'c4'].some(id => inB(lt, id)) ? 'top' : ['s1', 's2', 's3', 's4', 's5', 's6', 'm1'].some(id => inB(lt, id)) ? 'bot' : null;
function panelTag(str, x, y, col) {   // x < 0: flush to the right with the same 48 px margin
  ctx.save(); ctx.font = '900 22px Nunito'; ctx.letterSpacing = '2px'; const w = ctx.measureText(str).width + 34; ctx.letterSpacing = '0px'; if (x < 0) x = W - 48 - w;
  ctx.fillStyle = 'rgba(10,8,22,.8)'; rr(x, y, w, 36, 18); ctx.fill(); ctx.fillStyle = col; ell(x + 19, y + 18, 6, 6); ctx.fill(); text(str, x + 34, y + 19, { size: 20, fill: '#fff', align: 'left', spacing: 2 }); ctx.restore();
}
// the panel's own audit: faces, heads and held props drawn in a panel must stay inside it (and 20 px in from the frame's sides); a body may be cropped by the panel's edge
function panelCheck(n0, P, name, loose) {
  if (!REG.on || loose) return;
  for (const it of REG.items.slice(n0)) {
    if (!['face', 'head', 'prop'].includes(it.type) || it.transit) continue;
    if (it.box[1] < P[0] + 3 || it.box[3] > P[1] - 3 || it.box[0] < 20 || it.box[2] > W - 20) REG.errors.push(`${it.type}:${it.id || '?'} leaves the ${name} panel [${it.box.map(Math.round)}]`);
  }
}
// the giant ghost hands of the time-lapse: pivoting on the divider, they stand for the clock pill (and land on the same time)
function giantClock(lt) {
  for (const id of ['lapse1', 'lapse2']) {
    const bb = b(id), p = seg(lt, bb.s, bb.e), env = Math.sin(clamp(p) * PI) * Math.min(1, p * 8);
    if (p <= 0 || p >= 1) continue;
    const cm = clockMin(lt);
    ctx.save(); ctx.translate(540, (BAND[0] + BAND[1]) / 2); ctx.lineCap = 'round';
    for (let g = 5; g >= 0; g--) {
      const m2 = cm - g * 5, a2 = (g === 0 ? .8 : .2) * env, am = (m2 % 60) / 60 * TAU, ah = (m2 / 60 % 12) / 12 * TAU;
      for (const [len, wd, col] of [[540, 24, '255,240,190'], [320, 38, '255,255,255']]) {
        const an = len > 400 ? am : ah, ex = Math.sin(an) * len, ey = -Math.cos(an) * len;
        ctx.strokeStyle = `rgba(20,12,40,${a2 * .65})`; ctx.lineWidth = wd + 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = `rgba(${col},${a2})`; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ the scene
const LAND = () => ({ lx: (PCX - 540) / .96, lz: 1400 + 1400 / .96 });
const hallCamAt = lt => {
  if (lt < b('c1').s) return { f: 1400, cy: 360, hy: 455, cz: 1000, cx: 0 };   // the establishing wide: a hair higher and farther, so the tower fits above her
  let cz = lerp(1250, 1400, seg(lt, 1.6, 5.0)), hy = 419;
  if (lt > TLAND()) { const k = seg(lt, TLAND(), 25.3); cz = 1400 + 1600 * k * k; hy = 419 + 280 * easeOut(seg(lt, TLAND(), TLAND() + 1.5)); }
  return { f: 1400, cy: 360, hy, cz, cx: 0 };
};
let SLAB_READY = false;
// the frames after the glass breaks: the hall fills the stack, the slab flies apart, both nurses are in it
function mergedFrame(lt, cam, fr) {
    const tf = TF(), u = lt - tf, tl = TLAND();
    // the frozen picture of the band and the lounge, rendered once into its own canvas and cached (the same pixels at every frame)
    if (!SLAB_READY) {
      const cv = slabCanvas(), g = cv.getContext('2d'), keep = ctx;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.translate(0, -SLAB[0]); ctx = g; REG.suppress++;
      g.save(); g.beginPath(); g.rect(0, BOT[0], W, BOT[1] - BOT[0]); g.clip(); NOBLOOM = true; loungeDraw(tf, { noStraw: true, frame: { z: 1, px: PCX, py: 905 } }); g.restore();
      g.save(); g.beginPath(); g.rect(0, BAND[0], W, BAND[1] - BAND[0]); g.clip(); bandDraw(tf, true); g.restore(); NOBLOOM = false;
      REG.suppress--; ctx = keep; SLAB_READY = true;
    }
    // the hall, over the whole stack
    V2.setCam(cam);
    ctx.save(); ctx.beginPath(); ctx.rect(0, TOP[0], W, BOT[1] - TOP[0]); ctx.clip();
    ctx.save(); ctx.translate(540 + fr.dx * Math.max(0, 1 - u * 3), TMID + fr.dy * Math.max(0, 1 - u * 3)); ctx.translate(-540, -TMID);
    hallBg(lt, cam); lapseFx(lt, TOP[0], BOT[1]);
    ctx.restore();
    // the HUD of the top panel goes with the screen
    { const a = 1 - seg(u, .1, .3); if (a > 0) { ctx.save(); ctx.globalAlpha *= a; callBoard(684, TOP[0] + 12, lt, 28); panelTag('ROOM 9 / 28 RESIDENTS', 48, TOP[0] + 12, '#ff8a1a'); ctx.restore(); } }
    drawShards(u);
    // the actors: Clementine, the pole, and (once landed) Strawberry
    V2.setCam(cam);
    const extra = [];
    if (lt >= tl) { const sh = strawHall(lt, Object.assign({}, cam, LAND())); extra.push({ z: sh.Z, fn: () => drawChar(sh.o) }); }
    ctx.save(); ctx.translate(fr.dx * Math.max(0, 1 - u * 3), fr.dy * Math.max(0, 1 - u * 3));
    hallActors(lt, cam, { extra });
    ctx.restore();
    ctx.restore();
    // Strawberry in the air: on top of everything, in screen space
    if (lt < tl) { REG.suppress += 0; drawChar(strawFly(lt)); }
    // the impact: a ring, rays and a puff where she lands
    { const k = u / .5; if (k > 0 && k < 1) { V2.ring(IMPACT[0], IMPACT[1] - 40, k, { r0: 40, r1: 760, lw: 22, color: '255,255,255', alpha: .8, bloom: .6 }); }
      const rk = u / .45; if (rk > 0 && rk < 1) { ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.7 * (1 - rk)})`; ctx.lineCap = 'round'; for (let i = 0; i < 18; i++) { const a = -PI / 2 + (i - 8.5) * .17 + (hash(i) - .5) * .1, r0 = 80 + 220 * easeOut(rk), r1 = r0 + 90 + 160 * hash(i + 3); ctx.lineWidth = 3 + 5 * hash(i + 8); ctx.beginPath(); ctx.moveTo(IMPACT[0] + Math.cos(a) * r0, IMPACT[1] - 40 + Math.sin(a) * r0); ctx.lineTo(IMPACT[0] + Math.cos(a) * r1, IMPACT[1] - 40 + Math.sin(a) * r1); ctx.stroke(); } ctx.restore(); } }
    { const lk = (lt - tl) / .9; if (lk > 0 && lk < 1) { ctx.save(); for (let i = 0; i < 7; i++) { const a = (i / 7) * PI + .1, px = PCX + Math.cos(a) * (40 + 150 * lk) * (i % 2 ? -1 : 1), py = 764 - 10 - 60 * lk * (1 + i % 3 * .4), r = (38 + 60 * lk) * (.7 + hash(i) * .6); ctx.fillStyle = V2.radial(px, py, 0, r, [[0, `rgba(235,230,245,${.5 * (1 - lk)})`], [1, 'rgba(235,230,245,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2); } ctx.restore(); } }
  
}
const SC = {
  shot: lt => topShot(lt) + '|' + botShot(lt),
  cam() { zoomTo(540, 960, 1); },
  clock: lt => fmtClock(clockMin(lt)),
  draw(lt) {
    const tf = TF(), merged = lt >= tf, kOpen = easeOut(seg(lt, .2, .72)), ph = phaseOf(lt), spk = speakerOf(lt);
    // the backdrop behind the panels
    ctx.fillStyle = V2.grad(0, 0, 0, H, [[0, '#0d0b1c'], [.5, '#1a1230'], [1, '#08060f']]); ctx.fillRect(-100, -100, W + 200, H + 200);
    V2.glow(540, 190, 700, ph === 2 ? '255,70,90' : '120,130,255', .18, 'screen', .2);
    const cam = hallCamAt(lt);
    V2.setCam(cam);
    const c0 = clemObj(lt), face = faceC(c0.o);
    const fr = topFrame(lt, face);
    if (!merged) {
      // ---- the hall: clipped to the panel, which opens upward from the divider
      const topH = (TOP[1] - TOP[0]) * kOpen, n0 = REG.items.length;
      ctx.save(); ctx.beginPath(); ctx.rect(0, TOP[1] - topH, W, topH); ctx.clip();
      ctx.save(); ctx.translate(540 + fr.dx, TMID + fr.dy); ctx.rotate(fr.r); ctx.scale(fr.z, fr.z); ctx.translate(-fr.tx, -fr.ty);
      hallBg(lt, cam); lapseFx(lt, TOP[0] - 300, TOP[1] + 300, { streaks: true });
      ctx.restore();
      giantClock(lt);   // behind the actors, over the hall
      ctx.save(); ctx.translate(540 + fr.dx, TMID + fr.dy); ctx.rotate(fr.r); ctx.scale(fr.z, fr.z); ctx.translate(-fr.tx, -fr.ty);
      hallGhosts(lt, cam); hallActors(lt, cam);
      ctx.restore();
      callBoard(684, TOP[0] + 12, lt, nLit(lt)); if (kOpen > .9) panelTag('ROOM 9 / 28 RESIDENTS', 48, TOP[0] + 12, '#ff8a1a');
      if (spk === 'bot') { ctx.fillStyle = 'rgba(8,6,20,.22)'; ctx.fillRect(0, TOP[0], W, TOP[1] - TOP[0]); }
      ctx.restore();
      panelCheck(n0, TOP, 'hall', kOpen < 1);
      // ---- the lounge
      const botH = (BOT[1] - BOT[0]) * kOpen, n1 = REG.items.length;
      ctx.save(); ctx.beginPath(); ctx.rect(0, BOT[0], W, botH); ctx.clip();
      loungeDraw(lt, { frame: loungeFrame(lt) });
      if (kOpen > .9) panelTag('BREAK (ALLEGEDLY)', -1, BOT[1] - 48, '#7fe0a0');
      if (spk === 'top') { ctx.fillStyle = 'rgba(8,6,20,.22)'; ctx.fillRect(0, BOT[0], W, BOT[1] - BOT[0]); }
      ctx.restore();
      panelCheck(n1, BOT, 'lounge', kOpen < 1 || lt >= TRUN() - .02);
      // ---- the divider band, drawn open from its centre line
      const bh = (BAND[1] - BAND[0]) * kOpen, my = (BAND[0] + BAND[1]) / 2;
      ctx.save(); ctx.beginPath(); ctx.rect(0, my - bh / 2, W, bh); ctx.clip(); bandDraw(lt); ctx.restore();
      if (kOpen < 1) { ctx.fillStyle = `rgba(255,255,255,${.9 * (1 - kOpen)})`; ctx.fillRect(0, my - 4, W, 8); ctx.fillRect(0, TOP[1] - (TOP[1] - TOP[0]) * kOpen - 4, W, 8); ctx.fillRect(0, BOT[0] + botH - 4, W, 8); }
      else if (lt < .9) { const sw = seg(lt, .72, .95); ctx.fillStyle = `rgba(255,255,255,${.55 * (1 - sw)})`; ctx.fillRect(lerp(-300, 1380, sw) - 150, BAND[0], 300, BAND[1] - BAND[0]); }
      // the seam before it opens: the divider as a bright line
      if (lt < .2) { const a = seg(lt, .03, .12); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(540 - 540 * a, my - 3, W * a, 6); V2.glow(540, my, 500, '255,255,255', .3 * a, 'screen', .3); }
    } else {
      mergedFrame(lt, cam, fr);
    }
  },
  fx: lt => {
    const ph = phaseOf(lt), lap = Math.max(pulse(lt, b('lapse1').s, b('lapse1').e - b('lapse1').s), pulse(lt, b('lapse2').s, b('lapse2').e - b('lapse2').s)), tf = TF();
    const flash = lt >= tf && lt < tf + .09 ? 1 - (lt - tf) / .09 : 0, snapK = lt >= TSNAP() && lt < TSNAP() + .2 ? 1 - (lt - TSNAP()) / .2 : 0;
    const dip = Math.max(1 - seg(lt, 0, .28), seg(lt, CUR.dur - .3, CUR.dur - .02));
    return { bloom: .55 + .25 * lap + .2 * snapK, vignette: .46, grain: .05, contrast: .15, sat: .1 + .1 * lap, aberr: Math.max(lap > .2 ? 2.6 * lap : 0, 6 * snapK * snapK, 11 * flash, lt > tf ? 5 * pulse(lt, tf, .5) : 0),
      tint: [['#3a54c8', .1 + .03 * ph, 'soft-light']], fade: flash > 0 ? .55 * flash : (lt >= TSNAP() && lt < TSNAP() + .1 ? .3 * (1 - (lt - TSNAP()) / .1) : dip), fadeColor: flash > 0 || (lt >= TSNAP() && lt < TSNAP() + .1) ? '255,250,240' : '0,0,10' };
  },
  blur: lt => (inB(lt, 'lapse1') || inB(lt, 'lapse2')) ? 4 : (lt >= TRUN() - .06 && lt < TRUN() + .9 ? 6 : lt < .8 ? 3 : (lt >= TSNAP() - .05 && lt < TSNAP() + .5 ? 3 : (lt >= TRUN() + .9 ? 3 : 2))),
  over(lt) {
    const hx = 800, hy = 192;   // the header zone to the right of the pills: nothing else lives here, so the pops never touch a face
    sfxWord(lt, b('open').s + .15, 'DING!', hx - 100, hy, { fill: '#ffffff', size: 92, rot: .05, hold: .3 });
    sfxWord(lt, b('open').s + .5, 'BWEEP!', hx + 40, hy + 6, { fill: A6.ALARM.bed.hex, size: 86, rot: -.05, hold: .4 });
    sfxWord(lt, b('lapse1').s, 'TICK TICK', hx, hy, { fill: '#ffd23a', size: 84, rot: -.04, hold: .8 });
    sfxWord(lt, b('lapse1').s + CHA.lapse1, 'CHA-CHING!', hx, hy, { fill: COL.money, size: 84, rot: .04, hold: .55 });
    sfxWord(lt, b('lapse2').s, 'TICK TICK', hx, hy, { fill: '#ffd23a', size: 84, rot: -.04, hold: .7 });
    sfxWord(lt, b('lapse2').s + CHA.lapse2, 'CHA-CHING!', hx, hy, { fill: COL.money, size: 84, rot: .04, hold: .55 });
    sfxWord(lt, TSNAP(), 'BOING!', hx, hy, { fill: '#ff5a7a', size: 100, rot: -.06, hold: .5 });
    sfxWord(lt, TRUN(), 'WHOOSH!', hx - 40, hy, { fill: '#ffffff', size: 92, rot: -.05, hold: .38 });
    sfxWord(lt, TRUN() + .12, 'SCRAMBLE!', hx + 20, hy + 4, { fill: '#ffe135', size: 80, rot: .04, hold: .6 });
  },
};
window.__EP11_SCENES = window.__EP11_SCENES || {};
window.__EP11_SCENES.floor = SC;
})();
