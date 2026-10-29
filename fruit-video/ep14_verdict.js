'use strict';
/* SHIFT HAPPENS, Episode 14: "The Survey". Scene module: verdict (4:48 PM, THE EXIT CONFERENCE, 41.0 s). Scene builder E14-F. Registers window.__EP14_SCENES.verdict.
 *
 * The exit conference: a flat, frontal, full-frame conference room (one set of its own, in the dollhouse's cutaway language), a long walnut table, the staff standing behind it, Melon at the head with
 * a pizza box, the surveyors at the left end, a tall window with blinds, and one big prop that owns the room: the severity board, a 12-slot Plinko on an easel. The camera cuts and pushes
 * between close-ups; the form (UI.table) and the stamps are full-frame inserts. The scene ends on a pull-back through the window into the dollhouse (S14).
 *
 * WORLD (scene px, zoom 1 = the 1080 x 1920 frame). Floor line F = 1230 (feet of everyone behind the table), adult scale SA = .46. Left to right: the door with its call-light dome (x 24..132),
 * Stateman 215, the Kumquat 320, the ball on its cushion 378, then behind the table (x 430..1066, top 1190, front to 1330): Lemon 480, Mango 586, Clementine 692, Strawberry 798, Melon 946.
 * The board: centre x 815, lane unit L = 200 (the field is x 615..1015), panel y 250..1020, pegs on rows y 410 + 40 r, slots y 886..962, letters y 962..1008, the funnel above peg 0.
 *
 * SOUND CUES (scene-local; the picture hits the video frame NEAREST each cue, snapT()): stamp 4.1 (the D), the 12 plinks 14.363..16.513 (the ball touches peg n on frame snapT(cue n)),
 * plinkland 18.066 (the ball lands in slot L), siren 19.025, klaxon 19.125, thud 19.425, stamp 23.075 (NEW TAG), sit 33.879 34.179 34.479 34.779, chair 35.079, ding1 35.629, sting 39.863.
 *
 * Text: everything goes through the UI kit (UI.sign / label / table / stamp / tag); the board's letters, the form and the stamps are hero text; wall dressing is hero:false + crop:true.
 */
(() => {
if (!window.TIMELINE_EP14) return;
const { zoomTo, faceC, drawBg } = window.H6;
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, A14 = window.A14;
const TLX = window.TIMELINE_EP14, SCN = TLX.scenes.find(s => s.id === 'verdict'), START = SCN.start;
const LN = {}; for (const l of TLX.lines) if (l.scene === 'verdict') LN[l.id] = l;
const bS = id => SCN.beats[id].s, bE = id => SCN.beats[id].e;
const wordS = (id, i) => LN[id].s - START + LN[id].words[i][1];   /* scene-local start of the i-th word of a spoken line (the words are line-relative in the timeline) */
const wordE = (id, i) => LN[id].s - START + LN[id].words[i][2];

// ------------------------------------------------------------------ small helpers
const c01 = x => Math.max(0, Math.min(1, x));
const sstep = (t, a, b) => { const k = c01((t - a) / (b - a)); return k * k * (3 - 2 * k); };
const mixA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const snapT = t => Math.round((START + t) * 30) / 30 - START;   /* the scene-local time of the video frame nearest to scene-local time t: a picture event lands on this frame */
const pulse = (lt, t0, hz = 36, tau = .07) => lt < t0 ? 0 : Math.sin((lt - t0) * hz) * Math.exp(-(lt - t0) / tau);   /* copied from ep12_room.js: a damped wobble that starts at t0 */
const rgba = (c, a = 1) => V2.rgba(c, a);
const lg = (x0, y0, x1, y1, stops) => V2.grad(x0, y0, x1, y1, stops);
const rg = (x, y, r0, r1, stops) => V2.radial(x, y, r0, r1, stops);
/* piecewise keys [[t, v], ...] (v a number or an array), eased between neighbours; held before the first and after the last */
function key(keys, lt, ease = easeIO) {
  if (lt <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) {
    const a = keys[i - 1], b = keys[i], k = ease(c01((lt - a[0]) / (b[0] - a[0])));
    return Array.isArray(a[1]) ? a[1].map((v, j) => lerp(v, b[1][j], k)) : lerp(a[1], b[1], k);
  }
  return keys[keys.length - 1][1];
}
/* a discrete track [[t, value], ...]: the value of the last key at or before t */
function hold(keys, lt) { let v = keys[0][1]; for (const k of keys) if (lt >= k[0]) v = k[1]; else break; return v; }
const hn = (t, f, s = 0) => vnoise(t * f + s * 17.3);

// ------------------------------------------------------------------ the sound cues (scene-local seconds, from script_ep14.json: beat start + offset)
const PLINK = [0, .17, .34, .5, .66, .82, .98, 1.14, 1.32, 1.52, 1.78, 2.15].map(o => bS('ball') + o);
const CUE = {
  stamp1: bS('st1') + 3.0, plinkland: bS('st4') + .05, siren: bS('jeopardy') + .1, klaxon: bS('jeopardy') + .2, thud: bS('jeopardy') + .5, stamp2: bS('st5') + 3.0,
  sit: [.2, .5, .8, 1.1].map(o => bS('sit') + o), chair: bS('sit') + 1.4, ding: bS('ring') + .1, sting: bS('end') + .1, drum2: bS('st3') + 1.0,
};

// ------------------------------------------------------------------ layout (world px)
const F = 1230, SA = .46;
const XS = { star: 215, kum: 320, lemon: 480, mango: 586, clem: 692, straw: 806, melon: 950 };
const CUSH = { x: 378, y: F - 6 };                                      /* the ball waits on its cushion on the floor, beside the Kumquat */
const TB = { x0: 430, x1: 1066, y0: 1190, y1: 1238, y2: 1330 };           /* the table: top surface y0..y1, front panel y1..y2 */
const BD = { cx: 815, L: 200, top: 50, bottom: 820, row0: 210, P: 40, slotTop: 686, slotBot: 762, strip: 808 };   /* the board is lifted so that, in a tight shot of the slot row, the staff's faces fall below the frame */
const DOOR = { x0: 24, x1: 132, y0: 986, y1: F };
const WIN = { x0: 70, x1: 300, y0: 330, y1: 860 };
const SCR = { x0: 346, x1: 560, y0: 356, y1: 560 };

// ------------------------------------------------------------------ the room: ceiling, wall, dado, window, screen, door, floor (all live vector art; no text in any cache)
const HEROZ = () => { const m = ctx.getTransform(); return Math.hypot(m.a, m.b); };   /* the scale in force now (camera zoom included) */
/* is a world-space box wholly inside the frame, 44 px from every edge, clear of the caption zone (y 1380 to 1700) and of the clock pill (x 48..500, y 116..244)? Hero text is drawn only when its box is */
function safeBox(x0, y0, x1, y1, mg = 44) {
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  if (L < mg || R > W - mg || T < mg || B > H - mg) return false;
  if (B > 1376 && T < 1704) return false;
  if (R > 44 && L < 504 && B > 112 && T < 248) return false;
  return true;
}
/* the same test as a fade: 1 when the box is 46 px or more inside the safe area, 0 when it touches the limit, so that a label eases out as the camera carries it toward an edge, the caption zone or the clock pill */
function safeK(x0, y0, x1, y1, mg = 44, ramp = 46) {
  const m = ctx.getTransform(), xs = [x0, x1].map(x => m.a * x + m.c * y0 + m.e), ys = [y0, y1].map(y => m.b * x0 + m.d * y + m.f), L = Math.min(...xs), R = Math.max(...xs), T = Math.min(...ys), B = Math.max(...ys);
  let d = Math.min(L - mg, W - mg - R, T - mg, H - mg - B);
  d = Math.min(d, B <= 1376 ? 1376 - B : T >= 1704 ? T - 1704 : -1);
  const gx = Math.max(L - 504, 44 - R, 0), gy = Math.max(T - 248, 112 - B, 0);
  d = Math.min(d, gx > 0 || gy > 0 ? Math.hypot(gx, gy) : -1);
  return c01(d / ramp);
}
function drawCeiling(lt) {
  ctx.fillStyle = lg(0, -420, 0, 150, [[0, '#b9b19e'], [1, '#e4ddca']]); ctx.fillRect(-520, -480, 1920, 630);
  ctx.strokeStyle = 'rgba(70,60,44,.22)'; ctx.lineWidth = 2;
  for (let x = -480; x <= 1400; x += 120) { ctx.beginPath(); ctx.moveTo(x, -480); ctx.lineTo(x, 150); ctx.stroke(); }
  for (let y = -460; y <= 150; y += 90) { ctx.beginPath(); ctx.moveTo(-520, y); ctx.lineTo(1400, y); ctx.stroke(); }
  ctx.fillStyle = lg(0, 140, 0, 170, [[0, 'rgba(60,46,30,.0)'], [1, 'rgba(60,46,30,.35)']]); ctx.fillRect(-520, 140, 1920, 30);   /* the shadow where the ceiling meets the wall */
}
function ceilingPanel(x, y, w, h, on, lt) {
  ctx.fillStyle = '#f9f6ea'; ctx.strokeStyle = 'rgba(60,50,36,.6)'; ctx.lineWidth = 3; rr(x, y, w, h, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rgba('#fff4d2', .5 + .5 * on); rr(x + 6, y + 6, w - 12, h - 12, 3); ctx.fill();
  V2.glow(x + w / 2, y + h, w * 1.1, '255,238,196', .22 * on, 'screen', .5);
}
function drawWall(lt) {
  ctx.fillStyle = lg(0, 140, 0, 1230, [[0, '#cdc3a4'], [.45, '#d9d0b4'], [1, '#c3b898']]); ctx.fillRect(-520, 140, 1920, 1092);
  /* a very soft grasscloth: long vertical streaks */
  ctx.fillStyle = 'rgba(120,100,60,.045)'; for (let x = -500; x < 1400; x += 36) ctx.fillRect(x, 140, 10, 1092);
  /* the dado: green panelling under a wooden rail, a baseboard */
  ctx.fillStyle = lg(0, 1000, 0, 1230, [[0, '#35563f'], [1, '#243c2e']]); ctx.fillRect(-520, 1004, 1920, 226);
  for (let x = -500; x < 1400; x += 112) {
    ctx.fillStyle = 'rgba(0,0,0,.16)'; rr(x + 10, 1030, 92, 160, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(190,230,200,.18)'; ctx.lineWidth = 2.5; rr(x + 10, 1030, 92, 160, 6); ctx.stroke();
  }
  ctx.fillStyle = lg(0, 994, 0, 1012, [[0, '#8a6540'], [1, '#5d4128']]); ctx.fillRect(-520, 994, 1920, 18);
  ctx.fillStyle = 'rgba(255,230,190,.35)'; ctx.fillRect(-520, 994, 1920, 3);
  ctx.fillStyle = lg(0, 1212, 0, 1232, [[0, '#6a4a2e'], [1, '#3f2a18']]); ctx.fillRect(-520, 1212, 1920, 20);
}
function drawFloor() {
  ctx.fillStyle = lg(0, 1230, 0, 2100, [[0, '#53405a'], [.3, '#43344a'], [1, '#2a2030']]); ctx.fillRect(-520, 1230, 1920, 900);
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for (let y = 1250, r = 0; y < 2100; y += 34, r++) for (let x = -500 + (r % 2) * 40; x < 1400; x += 80) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y + 8); ctx.lineTo(x, y + 16); ctx.lineTo(x - 14, y + 8); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = lg(0, 1230, 0, 1262, [[0, 'rgba(0,0,0,.4)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-520, 1230, 1920, 32);   /* the wall's foot shadow */
}
function drawWindow(lt) {
  const { x0, x1, y0, y1 } = WIN, w = x1 - x0, h = y1 - y0;
  ctx.fillStyle = '#f0ead8'; ctx.strokeStyle = 'rgba(40,30,20,.7)'; ctx.lineWidth = 4; rr(x0 - 16, y0 - 16, w + 32, h + 32, 8); ctx.fill(); ctx.stroke();
  ctx.save(); rr(x0, y0, w, h, 4); ctx.clip();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#6f86c2'], [.45, '#e8b894'], [.8, '#f7c47a'], [1, '#c98a52']]); ctx.fillRect(x0, y0, w, h);
  V2.glow(x0 + w * .7, y1 - 120, 220, '255,226,160', .65, 'screen', .4);
  ctx.fillStyle = '#4a3a3a'; for (let i = 0; i < 9; i++) { const bx = x0 + 10 + i * 30, bh = 60 + hash(i * 3.3) * 50; rr(bx, y1 - bh, 26, bh, 6); ctx.fill(); }   /* a tree line and a street lamp */
  ctx.fillStyle = '#34292f'; ctx.fillRect(x0 + 180, y1 - 150, 5, 150); ctx.fillRect(x0 + 172, y1 - 154, 22, 6);
  /* the blind: slats down to 62 percent of the window, a little crooked at the bottom */
  const bot = y0 + h * .62;
  for (let y = y0; y < bot; y += 21) {
    ctx.fillStyle = lg(0, y, 0, y + 17, [[0, '#f1ead6'], [1, '#cfc7ae']]); ctx.fillRect(x0, y, w, 17);
    ctx.fillStyle = 'rgba(60,44,24,.35)'; ctx.fillRect(x0, y + 17, w, 4);
  }
  ctx.fillStyle = '#9d8e6e'; ctx.fillRect(x0, bot, w, 9);
  ctx.restore();
  ctx.strokeStyle = '#b9ad8c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1 - 24, y0); ctx.lineTo(x1 - 24, bot + 90); ctx.stroke();
  ctx.fillStyle = '#e4dcc4'; rr(x1 - 30, bot + 90, 12, 34, 5); ctx.fill();
  ctx.fillStyle = '#e7dfc9'; ctx.strokeStyle = 'rgba(40,30,20,.6)'; ctx.lineWidth = 3; rr(x0 - 30, y1 + 14, w + 60, 18, 5); ctx.fill(); ctx.stroke();   /* the sill */
}
function drawScreen(lt) {
  const { x0, x1, y0, y1 } = SCR, w = x1 - x0;
  ctx.fillStyle = '#3a3a44'; rr(x0 - 12, y0 - 18, w + 24, 22, 6); ctx.fill();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#f4f2ea'], [1, '#dcd9ce']]); ctx.strokeStyle = 'rgba(40,36,30,.6)'; ctx.lineWidth = 3; rr(x0, y0, w, y1 - y0, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(x0, y0, w, 14);
  const cx = (x0 + x1) / 2, cy = y0 + 76;
  ctx.fillStyle = '#33527a'; ell(cx, cy, 48, 48); ctx.fill(); ctx.strokeStyle = '#d9a93a'; ctx.lineWidth = 5; ell(cx, cy, 52, 52); ctx.stroke();
  ctx.fillStyle = '#f6f8fc'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? 14 : 33; ctx.lineTo(cx + Math.cos(a) * R, cy + 3 + Math.sin(a) * R); } ctx.closePath(); ctx.fill();
  UI.label('STATE SURVEY AGENCY', cx, y0 + 152, { size: 19, fill: '#26406a', hero: false, crop: true, maxW: w - 24 });
  UI.label('EXIT CONFERENCE', cx, y0 + 180, { size: 17, fill: '#6a6f7c', weight: 800, hero: false, crop: true, maxW: w - 24 });
}
function drawClock(x, y, r, lt) {
  ctx.fillStyle = '#f7f3e6'; ctx.strokeStyle = '#2b2a30'; ctx.lineWidth = 5; ell(x, y, r, r); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,26,22,.7)'; ctx.lineWidth = 2.5; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); ctx.lineTo(x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92); ctx.stroke(); }
  const min = 48 + lt / 60, hr = 4 + min / 60;   /* 4:48, the clock pill's time */
  ctx.lineCap = 'round'; ctx.strokeStyle = '#1d1a16'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(hr / 12 * TAU) * r * .5, y - Math.cos(hr / 12 * TAU) * r * .5); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(min / 60 * TAU) * r * .76, y - Math.cos(min / 60 * TAU) * r * .76); ctx.stroke();
  ctx.fillStyle = '#c23a2b'; ell(x, y, 3.4, 3.4); ctx.fill();
}
function drawDoor(lt, o = {}) {
  const { x0, x1, y0, y1 } = DOOR, w = x1 - x0, cx = (x0 + x1) / 2;
  ctx.fillStyle = '#e9e1cd'; ctx.strokeStyle = 'rgba(40,30,20,.7)'; ctx.lineWidth = 4; rr(x0 - 12, y0 - 12, w + 24, y1 - y0 + 12, 4); ctx.fill(); ctx.stroke();
  const op = c01(o.open ?? 0);
  if (op > .01) { ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#fff2cf'], [1, '#e8c98a']]); ctx.fillRect(x0, y0, w, y1 - y0); V2.glow(cx, (y0 + y1) / 2, 200, '255,236,190', .5 * op, 'screen', .4); }
  ctx.save(); ctx.translate(x0, 0); ctx.scale(1 - .86 * op, 1); ctx.translate(-x0, 0);   /* the leaf swings toward us: seen from the front it narrows about its hinge */
  ctx.fillStyle = lg(x0, 0, x1, 0, [[0, '#6c4a2f'], [1, '#8a6240']]); ctx.fillRect(x0, y0, w, y1 - y0);
  ctx.strokeStyle = 'rgba(30,18,8,.55)'; ctx.lineWidth = 3; rr(x0 + 12, y0 + 14, w - 24, 78, 4); ctx.stroke(); rr(x0 + 12, y0 + 110, w - 24, y1 - y0 - 128, 4); ctx.stroke();
  ctx.fillStyle = '#e4c26a'; ell(x1 - 18, y0 + 130, 6, 6); ctx.fill();
  ctx.restore();
  /* the call-light dome over the door: a red dome on a white plate, lit by o.dome 0..1 (pulses) */
  const d = c01(o.dome ?? 0), dy = y0 - 44;
  ctx.fillStyle = '#f4f2ea'; ctx.strokeStyle = 'rgba(40,30,20,.7)'; ctx.lineWidth = 3; rr(cx - 28, dy + 12, 56, 12, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rg(cx - 5, dy - 4, 2, 26, [[0, mixColor('#7a1a22', '#ff8a8a', d)], [.6, mixColor('#5a1018', '#ff2f3a', d)], [1, mixColor('#3a0a10', '#c01822', d)]]); ctx.beginPath(); ctx.arc(cx, dy + 12, 22, PI, TAU); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,10,10,.7)'; ctx.lineWidth = 3; ctx.stroke();
  if (d > .02) { V2.glow(cx, dy, 120 + 50 * d, '255,60,70', .6 * d, 'screen', .8); }
}

// ------------------------------------------------------------------ the scene object (grown chunk by chunk; every method is guarded so a fault here never stops another builder's render)
const warned = new Set();
const guard = (name, fn, fb) => (...a) => { try { return fn(...a); } catch (e) { if (!warned.has(name + e.message)) { warned.add(name + e.message); console.error('verdict ' + name + ': ' + (e.stack || e)); } return fb ? fb(...a) : undefined; } };

const doorSt = lt => { const d = snapT(CUE.ding); return { dome: lt >= d - 1e-6 ? .55 + .45 * Math.sin((lt - d) * 9 + 1.2) : 0, open: sstep(lt, 37.4, 37.75) }; };
function drawRoomAll(lt) {
  drawCeiling(lt); drawWall(lt); drawFloor();
  ceilingPanel(160, 40, 240, 62, 1, lt); ceilingPanel(640, 40, 240, 62, 1, lt);
  drawWindow(lt); drawScreen(lt); drawClock(452, 300, 34, lt); drawDoor(lt, doorSt(lt));
}
// ------------------------------------------------------------------ the table, the chairs and what stands on the table
function drawChair(x, o = {}) {
  const w = 112, top = o.top ?? 1062, bot = o.bot ?? 1218, rot = o.rot || 0, sh = o.shade ?? 0;
  ctx.save(); ctx.translate(x, bot); ctx.rotate(rot); ctx.translate(-x, -bot);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(x - w / 2 - 6, top + 8, w + 12, bot - top, 16); ctx.fill();
  ctx.fillStyle = lg(0, top, 0, bot, [[0, '#8f3b4d'], [1, '#6a2433']]); ctx.strokeStyle = 'rgba(20,6,10,.85)'; ctx.lineWidth = 4; rr(x - w / 2, top, w, bot - top, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,200,210,.16)'; rr(x - w / 2 + 10, top + 10, w - 20, 26, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(30,8,14,.5)'; ctx.lineWidth = 2.5; rr(x - w / 2 + 12, top + 44, w - 24, bot - top - 60, 10); ctx.stroke();
  ctx.fillStyle = '#4a2a18'; rr(x - w / 2 - 4, top - 6, w + 8, 12, 6); ctx.fill();
  ctx.restore();
}
function drawTableTop(lt) {
  const { x0, x1, y0, y1 } = TB;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; rr(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12, 12); ctx.fill();
  ctx.fillStyle = lg(0, y0, 0, y1, [[0, '#b27a4a'], [.18, '#9a6a40'], [1, '#76492a']]); rr(x0, y0, x1 - x0, y1 - y0, 10); ctx.fill();
  ctx.save(); rr(x0, y0, x1 - x0, y1 - y0, 10); ctx.clip();
  ctx.strokeStyle = 'rgba(60,30,10,.18)'; ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { const yy = y0 + 6 + i * 3 + hash(i) * 2; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.bezierCurveTo(x0 + 200, yy + hash(i + 3) * 6 - 3, x0 + 420, yy + hash(i + 9) * 6 - 3, x1, yy); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,236,200,.34)'; ctx.fillRect(x0, y0, x1 - x0, 4);   /* the lit far edge */
  ctx.restore();
}
function drawTableFront(lt) {
  const { x0, x1, y1, y2 } = TB;
  ctx.fillStyle = lg(0, y1, 0, y2, [[0, '#5a361e'], [1, '#2d1a0e']]); ctx.fillRect(x0 + 4, y1 - 2, x1 - x0 - 8, y2 - y1 + 2);
  ctx.fillStyle = lg(0, y1 - 4, 0, y1 + 10, [[0, '#d9a56e'], [1, '#8a5a34']]); rr(x0 - 4, y1 - 6, x1 - x0 + 8, 14, 6); ctx.fill();   /* the bevelled edge */
  ctx.strokeStyle = '#c8a24a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 16, y1 + 34); ctx.lineTo(x1 - 16, y1 + 34); ctx.stroke();   /* a brass inlay */
  ctx.strokeStyle = 'rgba(255,220,170,.12)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const yy = y1 + 12 + i * 14; ctx.beginPath(); ctx.moveTo(x0 + 8, yy); ctx.lineTo(x1 - 8, yy + hash(i) * 4 - 2); ctx.stroke(); }
  ctx.fillStyle = lg(0, y2, 0, y2 + 40, [[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x0 - 20, y2, x1 - x0 + 40, 40);
}
/* a stack of binders seen from the side: n binders, each a spine with a white label strip (no text), the colours of the SURVEY READY wall of the lobby scene */
function binderStack(x, y, n, seed = 0) {
  const cols = ['#27456f', '#8a2a35', '#2c6a46', '#c98b2c', '#4a3a78'];
  for (let i = 0; i < n; i++) {
    const w = 66 + hash(seed + i * 2.1) * 10, ox = (hash(seed + i * 5.3) - .5) * 8, yy = y - (i + 1) * 13;
    ctx.fillStyle = cols[(i + seed) % cols.length]; ctx.strokeStyle = 'rgba(14,10,22,.85)'; ctx.lineWidth = 2.5; rr(x - w / 2 + ox, yy, w, 12.5, 2.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x - w / 2 + ox + 6, yy + 3.5, w * .5, 5);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - w / 2 + ox + 2, yy + 1.5, w - 4, 2);
  }
}
function pizzaBox(x, y, open, o = {}) {   /* the Administrator's box on the table: a flat cardboard square seen from the front, its lid propped open at the back */
  const w = 124, tilt = open * .9;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 3, w * .56, 8); ctx.fill();
  if (open > .02) { ctx.save(); ctx.translate(0, -13); ctx.scale(1, Math.cos(tilt)); ctx.fillStyle = '#e6c58e'; ctx.strokeStyle = 'rgba(70,40,14,.85)'; ctx.lineWidth = 3; rr(-w / 2, -w * .3, w, w * .3, 4); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = '#e9cc98'; ctx.strokeStyle = 'rgba(70,40,14,.85)'; ctx.lineWidth = 3; rr(-w / 2, -16, w, 16, 3); ctx.fill(); ctx.stroke();
  if (open > .02) { ctx.fillStyle = '#d9a640'; rr(-w / 2 + 8, -22, w - 16, 9, 4); ctx.fill(); ctx.fillStyle = '#c0382b'; for (const dx of [-30, -4, 24]) { ell(dx, -17, 6, 3.4); ctx.fill(); } }
  else { ctx.fillStyle = '#c0382b'; rr(-14, -12, 28, 6, 3); ctx.fill(); }
  ctx.restore();
}
function drawTableDressing(lt, o = {}) {
  const y = TB.y0 + 32;
  binderStack(533, y, 3, 1); binderStack(639, y, 2, 3); binderStack(772, y - 2, 3, 7);
  ctx.fillStyle = '#fbf8ee'; ctx.strokeStyle = 'rgba(60,50,30,.5)'; ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { rr(838 + i * 2, y - 3 - i * 3, 52, 4, 1); ctx.fill(); ctx.stroke(); }   /* sign-in sheets */
  pizzaBox(o.boxX ?? XS.melon, y - 2 + (o.boxDy || 0), o.boxOpen ?? 1);
  /* a water jug and two glasses */
  ctx.fillStyle = 'rgba(190,225,250,.85)'; ctx.strokeStyle = 'rgba(30,50,80,.8)'; ctx.lineWidth = 2.5; rr(1030, y - 52, 26, 52, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(120,180,235,.6)'; ctx.fillRect(1033, y - 36, 20, 30);
  for (const gx of [1004, 1018]) { ctx.fillStyle = 'rgba(210,235,255,.7)'; ctx.beginPath(); ctx.moveTo(gx - 5, y - 20); ctx.lineTo(gx + 5, y - 20); ctx.lineTo(gx + 3, y); ctx.lineTo(gx - 3, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}

// ------------------------------------------------------------------ the severity board: a 12-slot Plinko on an easel, standing at the head of the table
const LANE_PATH = [.02, .14, .26, .38, .5, .62, .5, .62, .74, .86, .74, .86];   /* the lane of the peg the ball touches on row n (the plink cue n) */
const rowY = r => BD.row0 + r * BD.P, laneX = l => BD.cx + l * BD.L, slotW = 2 * BD.L / 12, slotX0 = i => BD.cx - BD.L + i * slotW;
const RP = 5.5, RB = 12, SQ = .14;                                        /* peg radius, ball radius, ball squash at a hit */
const PHI = 36 * PI / 180, DC = RB * (1 - SQ) + RP;                       /* the contact: the ball touches the peg on its shoulder, 36 degrees off the vertical, centre distance DC (the ball is squashed 14 percent) */
const SLOT_COL = ['#38c264', '#f5cf3a', '#f59a30', '#ef3b45'], SLOT_DK = ['#1c7e42', '#b88a10', '#b4561a', '#9a1220'];
const FUNNEL = { x: laneX(LANE_PATH[0]) + DC * Math.sin(PHI), y0: BD.row0 - 92, y1: BD.row0 - 44 };   /* the funnel mouth and exit, straight above the first contact */
function drawEasel(lt) {
  const lx = BD.cx - 212, rx = BD.cx + 212;
  for (const s of [-1, 1]) {
    const x0 = BD.cx + s * 212, x1 = BD.cx + s * 262;
    ctx.fillStyle = lg(x0, 0, x1, 0, [[0, '#8a6038'], [1, '#5f3f22']]); ctx.strokeStyle = 'rgba(30,16,6,.85)'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(x0 - 12, BD.bottom - 20); ctx.lineTo(x0 + 12, BD.bottom - 20); ctx.lineTo(x1 + 12, F); ctx.lineTo(x1 - 12, F); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = '#7a5230'; ctx.strokeStyle = 'rgba(30,16,6,.85)'; ctx.lineWidth = 3; rr(lx - 36, 1030, rx - lx + 72, 16, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = lg(0, BD.bottom - 2, 0, BD.bottom + 22, [[0, '#a57a4a'], [1, '#6a4526']]); ctx.strokeStyle = 'rgba(30,16,6,.9)'; ctx.lineWidth = 3.5; rr(BD.cx - 270, BD.bottom - 2, 540, 24, 5); ctx.fill(); ctx.stroke();   /* the tray */
}
function drawBulbs(lt, mode) {
  const x0 = 583, y0 = BD.top - 12, x1 = 1047, y1 = BD.bottom + 12, step = 34, pts = [];
  for (let x = x0 + 12; x <= x1 - 12; x += step) { pts.push([x, y0]); }
  for (let y = y0 + step; y <= y1 - 12; y += step) pts.push([x1, y]);
  for (let x = x1 - step; x >= x0 + 12; x -= step) pts.push([x, y1]);
  for (let y = y1 - step; y > y0 + 12; y -= step) pts.push([x0, y]);
  const ph = Math.floor(lt * (lt > CUE.drum2 && lt < 14.4 ? 26 : 14));
  pts.forEach(([x, y], i) => {
    let on = mode === 'flash' ? (Math.floor(lt * 12) % 2 ? 1 : .35) : mode === 'dark' ? .2 : (((i - ph) % 4 + 4) % 4 === 0 ? 1 : .32);
    ctx.fillStyle = on > .7 ? '#fff4c0' : '#9a7a34'; ell(x, y, 6.2, 6.2); ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,6,.8)'; ctx.lineWidth = 1.8; ctx.stroke();
    if (on > .7) V2.glow(x, y, 26, '255,226,140', .55, 'screen', .35);
  });
}
function drawFunnel(lt) {
  const { x, y0, y1 } = FUNNEL;
  ctx.fillStyle = 'rgba(190,225,250,.34)'; ctx.strokeStyle = 'rgba(225,240,255,.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 36, y0); ctx.lineTo(x + 36, y0); ctx.lineTo(x + 11, y1); ctx.lineTo(x - 11, y1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d9a93a'; ctx.strokeStyle = 'rgba(40,24,6,.9)'; ctx.lineWidth = 2.5; rr(x - 40, y0 - 7, 80, 9, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8863a'; rr(x - 12, y1 - 2, 24, 10, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(x - 26, y0 + 4); ctx.lineTo(x - 18, y0 + 4); ctx.lineTo(x - 8, y1 - 4); ctx.lineTo(x - 11, y1 - 4); ctx.closePath(); ctx.fill();
}
function drawBell(lt, swing) {
  const x = BD.cx - 188, y = BD.top - 60;
  ctx.strokeStyle = '#6a4526'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 30, y - 26); ctx.lineTo(x + 24, y - 26); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 30, y - 26); ctx.lineTo(x - 30, BD.top - 8); ctx.stroke();
  ctx.save(); ctx.translate(x, y - 22); ctx.rotate(swing);
  ctx.fillStyle = lg(-24, 0, 24, 0, [[0, '#f1cf6a'], [.5, '#c8962a'], [1, '#8a6218']]); ctx.strokeStyle = 'rgba(40,24,6,.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-12, 22, -26, 44); ctx.lineTo(26, 44); ctx.quadraticCurveTo(12, 22, 8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c258'; rr(-28, 42, 56, 8, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a3a14'; ell(Math.sin(swing * 3) * 6, 54, 6, 6); ctx.fill();
  ctx.restore();
}
function drawBeacon(lt, spin, lit) {
  const x = BD.cx + 188, y = BD.top - 14;
  ctx.fillStyle = '#3a3a44'; ctx.strokeStyle = 'rgba(10,8,16,.9)'; ctx.lineWidth = 3; rr(x - 32, y - 8, 64, 14, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rg(x - 6, y - 24, 2, 34, [[0, mixColor('#7a1a22', '#ffb0b0', lit)], [.6, mixColor('#6a1018', '#ff2a36', lit)], [1, mixColor('#3a0a10', '#b01420', lit)]]);
  ctx.beginPath(); ctx.arc(x, y - 8, 28, PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (lit > .05) {   /* the reflector turning inside the dome */
    ctx.save(); ctx.beginPath(); ctx.arc(x, y - 8, 27, PI, TAU); ctx.clip(); ctx.translate(x, y - 8); ctx.rotate(spin);
    ctx.fillStyle = `rgba(255,235,220,${.85 * lit})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, -22); ctx.lineTo(60, 14); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
function drawBoard(lt, st) {
  const x0 = 595, y0 = BD.top, w = 440, h = BD.bottom - BD.top, hz = HEROZ(), LIT = st.lit || 0;
  const heroT = size => size * hz >= 30.5;
  drawEasel(lt);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; rr(x0 + 14, y0 + 12, w, h, 16); ctx.fill();                                   /* its shadow on the wall */
  ctx.fillStyle = lg(0, y0 - 12, 0, y0 + h + 12, [[0, '#d6a644'], [.5, '#a87a24'], [1, '#7a5414']]); ctx.strokeStyle = 'rgba(40,24,6,.9)'; ctx.lineWidth = 4; rr(x0 - 12, y0 - 12, w + 24, h + 24, 18); ctx.fill(); ctx.stroke();   /* the gold frame */
  UI.panel([x0, y0, w, h], { fill: ['#26346c', '#0f1636'], stroke: 'rgba(250,230,160,.5)', lw: 3, r: 10, id: 'bdface', kind: 'board', pad: 10 });
  ctx.save(); rr(x0, y0, w, h, 10); ctx.clip(); ctx.fillStyle = rg(BD.cx, BD.top + 310, 20, 420, [[0, 'rgba(120,150,255,.22)'], [1, 'rgba(120,150,255,0)']]); ctx.fillRect(x0, y0, w, h); ctx.restore();
  drawBulbs(lt, st.bulbs || 'chase');
  /* the slots: coloured backs, thin walls, a label strip with the letter */
  for (let i = 0; i < 12; i++) {
    const b = Math.floor(i / 3), sx = slotX0(i), lit = i === 11 ? LIT : 0, a = .62 + .38 * lit;
    ctx.fillStyle = lg(0, BD.slotTop, 0, BD.slotBot, [[0, rgba(SLOT_COL[b], .16 + .3 * lit)], [1, rgba(SLOT_COL[b], a)]]); ctx.fillRect(sx, BD.slotTop, slotW, BD.slotBot - BD.slotTop);
    if (lit > .02) { ctx.fillStyle = rgba('#fff0f0', .55 * lit); ctx.fillRect(sx + 3, BD.slotTop + 6, slotW - 6, BD.slotBot - BD.slotTop - 6); }
    ctx.fillStyle = lg(0, BD.slotBot, 0, BD.strip, [[0, mixColor(SLOT_COL[b], '#ffffff', .22 * lit)], [1, mixColor(SLOT_DK[b], '#ffffff', .3 * lit)]]); ctx.fillRect(sx, BD.slotBot, slotW, BD.strip - BD.slotBot);
  }
  ctx.fillStyle = '#ece6cf'; for (let i = 0; i <= 12; i++) { const wx = slotX0(i), thick = i % 3 === 0 ? 5 : 2.6; ctx.fillRect(wx - thick / 2, BD.slotTop, thick, BD.slotBot - BD.slotTop + 2); }
  ctx.fillStyle = '#ece6cf'; ctx.fillRect(BD.cx - BD.L - 3, BD.slotBot, 2 * BD.L + 6, 3);
  for (let i = 0; i < 12; i++) {
    const sx = slotX0(i), id = 'slot' + i;
    UI.container(id, 'cell', [sx, BD.slotBot + 3, sx + slotW, BD.strip], 2);
    const kk = safeK(sx + 3, BD.slotBot + 6, sx + slotW - 3, BD.strip - 4);
    if (kk > .03) UI.label('ABCDEFGHIJKL'[i], sx + slotW / 2, (BD.slotBot + 3 + BD.strip) / 2, { size: 34, font: 'Bangers', fill: i === 11 && LIT > .3 ? '#ffffff' : '#14182a', stroke: i === 11 && LIT > .3 ? '#ef3b45' : undefined, lw: i === 11 && LIT > .3 ? 5 : 0, cid: id, center: true, hero: heroT(34), alpha: kk });
  }
  /* the pegs: shadows, bodies and highlights in three batches; a peg that was hit wobbles away from the ball and flashes */
  const hit = r => st.hits && st.hits[r];
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); for (let r = 0; r < 12; r++) for (const l of (r % 2 ? LANES_ODD : LANES_EVEN)) { const wob = hit(r) && Math.abs(l - LANE_PATH[r]) < .001 ? hit(r) : null; ctx.moveTo(laneX(l) + 2.4 + (wob ? wob.dx : 0) + RP, rowY(r) + 3 + (wob ? wob.dy : 0)); ctx.arc(laneX(l) + 2.4 + (wob ? wob.dx : 0), rowY(r) + 3 + (wob ? wob.dy : 0), RP, 0, TAU); } ctx.fill();
  ctx.fillStyle = '#efe6c8'; ctx.beginPath(); for (let r = 0; r < 12; r++) for (const l of (r % 2 ? LANES_ODD : LANES_EVEN)) { const wob = hit(r) && Math.abs(l - LANE_PATH[r]) < .001 ? hit(r) : null; const px = laneX(l) + (wob ? wob.dx : 0), py = rowY(r) + (wob ? wob.dy : 0); ctx.moveTo(px + RP, py); ctx.arc(px, py, RP, 0, TAU); } ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); for (let r = 0; r < 12; r++) for (const l of (r % 2 ? LANES_ODD : LANES_EVEN)) { const wob = hit(r) && Math.abs(l - LANE_PATH[r]) < .001 ? hit(r) : null; const px = laneX(l) + (wob ? wob.dx : 0), py = rowY(r) + (wob ? wob.dy : 0); ctx.moveTo(px - 1.2 + 1.6, py - 1.8); ctx.arc(px - 1.2, py - 1.8, 1.6, 0, TAU); } ctx.fill();
  for (let r = 0; r < 12; r++) { const w2 = hit(r); if (w2 && w2.flash > .02) V2.glow(laneX(LANE_PATH[r]) + w2.dx, rowY(r) + w2.dy, 30, '255,246,210', .9 * w2.flash, 'screen', .6); }
  drawFunnel(lt);
  const sk = safeK(BD.cx - 150, BD.top - 56, BD.cx + 150, BD.top - 18);
  UI.sign([BD.cx - 165, BD.top - 62, 330, 50], sk > .03 ? 'SCOPE & SEVERITY' : [], { talpha: sk, font: 'Bangers', size: 34, ink: '#ffe9a8', spacing: 2, fill: ['#8a1a38', '#4a0d1e'], stroke: '#e8b84a', lw: 4, r: 10, pad: 8, id: 'bdhead', hero: heroT(34) });
  const tb = T_APEX + TOSS.tMouth;
  if (lt >= tb && lt < tb + .4) V2.ring(FUNNEL.x, FUNNEL.y0, (lt - tb) / .4, { r0: 12, r1: 90, lw: 5, color: '255,255,255', alpha: .7, bloom: .3 });
  if (lt >= T_LAND && lt < T_LAND + 1.6) {   /* the landing: a column of light up the slot, a ring, sparks */
    const e = Math.exp(-(lt - T_LAND) / .5), cx = SLOT_X;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg(0, BD.slotBot, 0, BD.slotBot - 460, [[0, `rgba(255,150,150,${.55 * e})`], [1, 'rgba(255,150,150,0)']]); ctx.fillRect(cx - 17, BD.slotBot - 460, 34, 460); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(cx, BD.slotBot - 12, c01((lt - T_LAND + .03) / .7), { r0: 14, r1: 200, lw: 8, color: '255,130,130', alpha: .9 }); ctx.restore();
    V2.sparks(cx, BD.slotBot - 12, lt, T_LAND, { n: 34, speed: 520, life: .9, color: '255,214,150', g: 1300, size: 4, seed: 9 });
  }
  drawBell(lt, st.bell || 0); drawBeacon(lt, st.spin || 0, st.beacon || 0);
}
const LANES_EVEN = [-.94, -.70, -.46, -.22, .02, .26, .50, .74, .98], LANES_ODD = [-.82, -.58, -.34, -.10, .14, .38, .62, .86];
// ------------------------------------------------------------------ the cast: who stands where, what the face and the eyes do, how they sit
const PT = { star: [XS.star, 1120], kum: [XS.kum, 1190], lemon: [XS.lemon, 1110], mango: [XS.mango, 1110], clem: [XS.clem, 1110], straw: [XS.straw, 1100], melon: [XS.melon, 1115], board: [BD.cx, BD.top + 390], top: [BD.cx, BD.top + 80], door: [78, 1010], cam: null, staff: [640, 1110], cush: [CUSH.x, 1215] };
const lookAt = (o, p, k = 280) => { if (!p) return [0, 0]; const [fx, fy] = faceC(o); return [Math.max(-1.15, Math.min(1.15, (p[0] - fx) / k * 1.5)), Math.max(-1.15, Math.min(1.15, (p[1] - fy) / k * 1.5))]; };
/* a gaze track: keys [[t, point], ...] (a point or null for the lens), eased between keys; put two keys .1 s apart for a quick dart of the eyes */
const gazeAt = (o, keys, lt) => { const pts = keys.map(([t, p]) => [t, p || [o.x, faceC(o)[1]]]); return lookAt(o, key(pts, lt, easeOut)); };
const T_TH = snapT(CUE.thud), atTh = lt => lt >= T_TH - 1e-6;   /* the thud lands on this video frame */
const SIT_DY = 36;
const SIT_T = { lemon: CUE.sit[0], mango: CUE.sit[1], clem: CUE.sit[2], straw: CUE.sit[3], melon: CUE.chair };
/* standing to seated, landing on the cue time tc: the body lowers over `dur`, lands with a small bounce and a squash (shoes planted) */
function seat(lt, tc, dur = .6) {
  const k = sstep(lt, tc - dur, tc), after = lt > tc ? pulse(lt, tc, 20, .09) : 0;
  return { dy: SIT_DY * k + 4 * after, sq: lt > tc ? .08 * Math.max(0, after) : .05 * Math.sin(k * PI), k: lt >= tc ? 1 : k };
}
/* the reflex when the call light chimes: every nurse starts to stand, a hair, and freezes */
const reflex = (lt, i) => { const t0 = CUE.ding + i * .05; return -22 * sstep(lt, t0, t0 + .1) * (1 - sstep(lt, t0 + .5, t0 + .85)); };
/* a walker's gait fields from the distance walked so far (local units), so the planted foot stays planted and the footstep tool hears it */
const gaitOf = (dist, dir, s, speed) => Math.abs(speed) > 20 ? { gaitW: dist / s, axis: 'x', dir, vx: speed } : {};

const EX = {   /* the faces, by beat (scene-local seconds) */
  lemon: [[0, 'dead'], [8.6, 'sour'], [13.4, 'shock'], [14.5, 'dead'], [16.6, 'sour'], [18.07, 'shock'], [19.1, 'panic'], [20.4, 'dead'], [22.9, 'shock'], [25.9, 'dead'], [28.4, 'sour'], [31.3, 'dead'], [35.1, 'chill'], [35.63, 'shock'], [36.6, 'dead']],
  mango: [[0, 'neutral'], [8.6, 'sour'], [13.4, 'shock'], [14.5, 'neutral'], [18.07, 'shock'], [19.1, 'panic'], [20.4, 'neutral'], [22.9, 'shock'], [25.9, 'neutral'], [28.4, 'sour'], [31.3, 'neutral'], [35.1, 'chill'], [35.63, 'shock'], [36.6, 'neutral']],
  clem: [[0, 'hopeful'], [8.6, 'shock'], [13.4, 'hopeful'], [18.07, 'shock'], [19.1, 'panic'], [20.4, 'hopeful'], [22.9, 'shock'], [25.9, 'hopeful'], [28.4, 'shock'], [31.3, 'hopeful'], [35.1, 'happy'], [35.63, 'shock'], [36.6, 'happy']],
  straw: [[0, 'dead'], [8.6, 'dead'], [18.07, 'dead'], [19.1, 'shock'], [20.4, 'dead'], [22.9, 'hopeful'], [25.2, 'happy'], [26.3, 'dead'], [28.4, 'sad'], [31.3, 'weak'], [32.2, 'sad'], [34.8, 'chill'], [35.63, 'shock'], [36.6, 'chill'], [37.95, 'happy']],
  melon: [[0, 'happy'], [6.76, 'hopeful'], [8.6, 'panic'], [13.4, 'shock'], [16.7, 'sad'], [18.07, 'shock'], [19.2, 'panic'], [19.424, 'dead'], [25.98, 'shock'], [26.6, 'angry'], [27.4, 'sad'], [28.6, 'weak'], [33.6, 'weak'], [35.2, 'chill'], [35.7, 'shock'], [36.6, 'weak']],
};
const exprOf = (id, lt) => hold(EX[id], lt);

function castLemon(lt) {
  const st = seat(lt, SIT_T.lemon), o = A7.lemon({ x: XS.lemon, y: F, s: SA, plant: true, t: lt, expr: exprOf('lemon', lt), lid: .22, arms: { l: 'rest', r: 'rest' } });
  o.y += st.dy + reflex(lt, 0) * .0; o.squash = st.sq; o.lift = -reflex(lt, 0) * .0 + (-reflex(lt, 0));
  o.look = gazeAt(o, [[0, PT.star], [3, PT.melon], [6.7, PT.melon], [8.6, PT.star], [13.4, PT.top], [14.4, PT.board], [18.0, PT.star], [19.0, PT.top], [20.4, PT.star], [24.2, PT.star], [24.45, PT.mango], [25.0, PT.clem], [25.4, PT.star], [25.9, PT.melon], [27.4, PT.star], [31.3, PT.straw], [32.2, PT.star], [35.6, PT.door], [37, PT.door]], lt);
  return o;
}
function castMango(lt) {
  const st = seat(lt, SIT_T.mango), o = A7.mango({ x: XS.mango, y: F, s: SA, plant: true, t: lt, expr: exprOf('mango', lt), arms: { l: 'rest', r: 'rest' } });
  o.y += st.dy; o.squash = st.sq; o.lift = -reflex(lt, 1);
  o.look = gazeAt(o, [[0, PT.star], [4, PT.melon], [6.7, PT.melon], [8.6, PT.star], [13.4, PT.top], [14.4, PT.board], [18.0, PT.star], [19.0, PT.top], [20.4, PT.star], [24.2, PT.star], [24.5, PT.lemon], [24.9, PT.clem], [25.4, PT.star], [25.9, PT.melon], [27.4, PT.star], [31.3, PT.straw], [32.2, PT.star], [35.6, PT.door]], lt);
  return o;
}
function castClem(lt) {
  const st = seat(lt, SIT_T.clem), o = A10.clem({ x: XS.clem, y: F, s: SA, plant: true, t: lt, expr: exprOf('clem', lt), arms: { l: 'rest', r: 'rest' } });
  o.y += st.dy; o.squash = st.sq; o.lift = -reflex(lt, 2);
  o.look = gazeAt(o, [[0, PT.star], [5, PT.kum], [8.6, PT.star], [13.4, PT.top], [14.4, PT.board], [18.0, PT.star], [19.0, PT.top], [20.4, PT.star], [24.2, PT.star], [24.45, PT.mango], [24.8, PT.straw], [25.4, PT.star], [25.9, PT.melon], [27.4, PT.star], [31.3, PT.straw], [32.2, PT.star], [35.6, PT.door]], lt);
  return o;
}
function castStraw(lt) {
  const st = seat(lt, SIT_T.straw, 1.1), o = A11.straw({ x: XS.straw, y: F, s: SA, plant: true, t: lt, expr: exprOf('straw', lt), lid: lt > 36.9 ? .12 : lt > 24.9 && lt < 26.3 ? .12 : .42, sparkle: (lt > 24.9 && lt < 26.4) || lt > 37.9, arms: { l: 'rest', r: 'rest' } });
  o.y += st.dy; o.squash = st.sq; o.lift = -reflex(lt, 3);
  o.look = gazeAt(o, [[0, PT.star], [6.7, PT.melon], [8.6, PT.star], [13.4, PT.top], [14.4, PT.board], [18.0, PT.star], [19.0, PT.top], [20.4, PT.star], [24.2, PT.star], [24.6, PT.clem], [25.1, PT.star], [25.9, PT.melon], [27.4, PT.star], [31.3, PT.star], [33.4, PT.star], [35.6, PT.door], [37.9, null]], lt);
  return o;
}
function castMelon(lt) {
  const sat = 34;   /* he sits a little lower than the others: a bigger chair, a smaller man */
  const rise = sstep(lt, 16.12, 16.42), back = Math.pow(c01((lt - 19.16) / (T_TH - 19.16)), 2.2), up = sstep(lt, 25.985, 26.4), sit = seat(lt, SIT_T.melon, .3);
  let dy = sat - (sat + 6) * rise;
  dy = lt < 19.16 ? dy : lt < 25.985 ? lerp(-6, 62, back) : lt < 33.0 ? lerp(62, -6, up) : -6 + (sat - (-6)) * sit.k + 4 * (lt > SIT_T.melon ? pulse(lt, SIT_T.melon, 20, .09) : 0);
  const o = A9.melon({ x: XS.melon, y: F + dy, s: SA * 1.22, plant: true, t: lt, expr: exprOf('melon', lt), arms: { l: 'rest', r: 'rest' } });
  const hit = atTh(lt) ? Math.exp(-(lt - T_TH) / .12) * Math.cos((lt - T_TH) * 24) : 0;   /* 1 on the contact frame, then a damped rebound */
  o.squash = lt >= 19.16 && lt < 25.985 ? .06 + .2 * Math.max(0, hit) : sit.sq * .6;
  if (atTh(lt) && lt < 25.985) o.lid = 1;
  o.rot = lt >= 19.16 && lt < 25.985 ? .1 * back * (1 + .3 * hit) + (lt < T_TH ? .035 * Math.sin((lt - 19.05) * 38) * c01((lt - 19.05) / .1) : 0) : 0;
  o.acc = (o.acc || []).concat(['fp14v_pizza'], (lt < 19.3 || (lt > 25.9 && lt < 28.6)) ? ['sweat'] : []);
  o.pizza = atTh(lt) && lt < 29.9 ? 1 : 0; o.pizzaFall = sstep(lt, 29.0, 29.9);
  o.look = ballLook(o, lt);
  return o;
}
/* Melon's eyes follow the ball while it falls (14.36 to 18.1), with a dart on every plink; otherwise the staff, the surveyor, the board */
function ballLook(o, lt) {
  if (lt >= PLINK[0] - .25 && lt < CUE.plinkland + .35) { const b = ballAt(Math.max(PLINK[0] - .3, lt - .05)); return lookAt(o, [b.x, b.y], 200); }
  const g = gazeAt(o, [[0, PT.star], [6.7, PT.star], [8.6, PT.star], [13.3, PT.top], [14.0, PT.top], [18.1, PT.star], [18.9, PT.top], [25.9, PT.star], [27.4, PT.star], [31, PT.straw], [35.6, PT.door]], lt);
  const dz = lt > 27.4 && lt < 35.5 ? .5 * sstep(lt, 27.4, 28.4) * (1 - sstep(lt, 34.9, 35.45)) : 0;   /* still dazed: the eyes drift in slow circles until he is down */
  return dz > .01 ? [g[0] + dz * Math.sin((lt - 27) * 3.1), g[1] + dz * .7 * Math.cos((lt - 27) * 2.6)] : g;
}
const KUM_RUN = [[0, XS.kum], [10.4, XS.kum], [11.0, CUSH.x], [15.2, CUSH.x], [16.0, XS.kum], [36.85, XS.kum], [38.2, 164], [38.5, 112]];   /* the Kumquat steps to the ball, comes back, and trots after Stateman */
const KK = () => KINDS.kumquat || KINDS.clem;
const bodyCY = o => { const k = KINDS[o.kind]; return o.y - (o.lift || 0) - ((o.noLegs ? 0 : (k.leg || 90)) + k.ry * .9) * o.s; };
/* the hands' height (local px under the body centre) while the Kumquat carries the ball: lifted from the cushion, held at the chest, lowered for the wind-up, swung up for the throw */
const khand = () => [[11.0, 74], [11.35, 62], [11.75, 60], [13.2, 60], [13.3, 82], [13.4, 82], [TOSS.tr - .01, -34]];   /* (a function: TOSS is defined further down) */
const kumCrouch = lt => .13 * Math.sin(c01((lt - 10.95) / .45) * PI) + .24 * sstep(lt, 13.2, 13.34) * (1 - sstep(lt, 13.42, 13.5));
function castKum(lt) {
  const x = key(KUM_RUN, lt, easeIO), moving = (lt > 10.4 && lt < 11.0) || (lt > 15.2 && lt < 16.0) || (lt > 36.85 && lt < 38.4), s = SA * .72, holdBall = lt >= 11.0 && lt < TOSS.tr, thrown = lt >= TOSS.tr;
  const gy = key(khand(), lt, lt > 13.4 ? easeIn : easeIO);
  const pose = lt < 10.95 || lt > 16.0 ? 'carry' : 'free';
  const o = A14.kumquat({ x, y: F, s, plant: true, t: lt, expr: lt < 10.2 ? 'kum_eager' : lt < 13.5 ? 'kum_eager' : lt < 14.6 ? 'shock' : 'kum_eager', pose, tongue: lt > 3.2 && lt < 4.3 ? 1 : lt > 13.2 && lt < 13.5 ? 1 : 0, pencil: true });
  if (pose === 'free') {
    if (holdBall || (thrown && lt < TOSS.tr + .14)) Object.assign(o, { arms: { l: 'hold', r: 'hold' }, grip: { l: [-32, gy], r: [32, gy] }, hand: { l: 'grip', r: 'grip' } });
    else Object.assign(o, { arms: { l: 'up', r: 'up' } });
    if (lt >= 14.0) Object.assign(o, { arms: { l: 'rest', r: lt < 14.6 ? 'up' : 'rest' } });
  }
  o.squash = kumCrouch(lt) - (thrown ? .16 * Math.exp(-(lt - TOSS.tr) / .08) : 0);
  o.lift = thrown ? 16 * Math.exp(-(((lt - TOSS.tr - .06) / .09) ** 2)) : 0;
  Object.assign(o, gaitOf(Math.abs(x - XS.kum), lt > 15.2 && lt < 16.1 ? -1 : lt > 36 ? -1 : 1, s, moving ? (lt > 15.2 && lt < 16.1 || lt > 36 ? -1 : 1) * 90 / s : 0));
  if (lt > 38.2) o.alpha = 1 - sstep(lt, 38.25, 38.5);
  o.look = gazeAt(o, [[0, PT.star], [6.7, PT.melon], [8.6, PT.star], [10.2, PT.cush], [11.5, PT.cush], [13.0, PT.top], [14.5, PT.board], [18, PT.star], [20, PT.star], [25.9, PT.melon], [28, PT.star], [35.6, PT.door]], lt);
  return o;
}
/* where the ball is while the Kumquat has it (on the cushion, then in his hands), as the world point of the hands' midpoint */
function heldBall(lt, o) {
  if (lt < 11.0) return [CUSH.x, CUSH.y - RB - 3];
  const gy = key(khand(), lt, lt > 13.4 ? easeIn : easeIO);
  return [o.x, bodyCY(o) + gy * o.s];
}
/* Stateman: reads (1.1 to 6.6), holds up the evidence bag (8.6 to 10.2), writes the new tag (20.9 to 25.9), notes (27.95), then walks to the door, tips his hat on "me." and goes out */
const STAR_X = [[0, XS.star], [36.48, XS.star], [37.3, 140], [37.78, 104], [38.2, 78]];
function castStar(lt) {
  const bag = sstep(lt, 8.6, 8.95) * (1 - sstep(lt, 9.85, 10.12)), salute = sstep(lt, 37.12, 37.32) * (1 - sstep(lt, 37.62, 37.82));
  const x = key(STAR_X, lt, easeIO), walking = lt > 36.48 && lt < 38.2, s = SA;
  let pose = lt > 20.9 && lt < 25.9 ? 'write' : lt > 1.0 && lt < 6.6 ? 'read' : lt > 10.2 && lt < 14.3 ? 'read' : 'carry';
  const o = A14.stateman({ x, y: F, s, t: lt, pose: bag > .01 || salute > .01 ? 'free' : pose, writing: lt > 21 && lt < 25.9 ? .7 : 0, noted: sstep(lt, 27.95, 28.42) });
  if (bag > .01 || salute > .01) {
    const gr = mixA(mixA([84, 98], [112, -52], bag), [78, -84], salute);
    Object.assign(o, { arms: { l: 'hold', r: 'hold' }, grip: { l: [-72, 72], r: gr }, hold: { l: 'fp14_clip', r: bag > .01 ? 'fp14v_bag' : undefined }, hand: salute > .01 ? { r: 'flat' } : undefined, clipAt: [.2, .1], clipRot: -.1, clipScale: 1, clipPage: .35, penAng: -1.9, bagSwing: .08 * (1 - bag) });
  }
  const brow = (lt > 7.8 && lt < 8.6) || (lt > 8.6 && lt < 9.6) || (lt > 18.5 && lt < 19.0) || (lt > 25.9 && lt < 27.3) || (lt > 35.6 && lt < 36.4);
  o.expr = lt > 38.2 ? 'stateman_warm' : (lt > 36.4 && lt < 38.2) ? 'stateman_warm' : (lt > 33.5 && lt < 35.4) ? 'stateman_warm' : brow ? 'stateman_brow' : 'stateman';
  o.look = gazeAt(o, [[0, PT.staff], [3, PT.melon], [6.7, PT.melon], [8.6, null], [10.2, PT.board], [14.4, PT.board], [18.0, null], [19, PT.top], [20.4, PT.staff], [25.9, PT.melon], [27.4, null], [31.3, PT.straw], [32.2, null], [35.6, PT.door]], lt);
  Object.assign(o, gaitOf(Math.abs(x - XS.star), -1, s, walking ? -150 / s : 0));
  if (lt > 37.9) o.alpha = 1 - sstep(lt, 37.95, 38.2);
  return o;
}
const CASTFN = { star: castStar, kum: castKum, lemon: castLemon, mango: castMango, clem: castClem, straw: castStraw, melon: castMelon };
const CASTORDER = ['kum', 'star', 'lemon', 'mango', 'clem', 'straw', 'melon'];

// ------------------------------------------------------------------ frame fitting: a character is drawn only whole inside the frame (or as a background neighbour that the shot declares)
function boxOfChar(o) {
  const k = KINDS[o.kind], s = o.s || 1, legLen = o.noLegs ? 0 : (k.leg || 90), top = o.y - (o.lift || 0) - (legLen + k.ry * .9 + (TOPS[o.kind] ?? k.ry * 1.05)) * s, half = (k.rx * .98) * s;
  return [o.x - half, top, o.x + half, o.y + 6 * s];
}
function inFrame(o) {
  const b = boxOfChar(o), m = ctx.getTransform(), p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
  const pts = [p(b[0], b[1]), p(b[2], b[1]), p(b[0], b[3]), p(b[2], b[3])], xs = pts.map(a => a[0]), ys = pts.map(a => a[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { inter: x1 > 0 && x0 < W && y1 > 0 && y0 < H, whole: x0 >= 6 && x1 <= W - 6 && y0 >= 6 };
}
// ------------------------------------------------------------------ THE BALL. The n-th plink cue is the n-th peg the ball touches: the ball's centre is at its contact point on frame TV[n]
// (the video frame nearest the cue, so the contact frame IS the plink frame). Between contacts it flies a ballistic arc (an upward kick AUP at each peg, gravity chosen so the next peg is reached
// exactly on time: the slower later hops simply have a lower gravity, a slow-motion ramp). Before the first peg: the Kumquat's toss, the funnel and a straight fall. After the last: the hang, the fall, the landing.
const TV = PLINK.map(snapT);
const AUP = -190, GF = 5000, YAPEX = BD.top + 5;
const CN = n => { const dir = n < 11 ? Math.sign(LANE_PATH[n + 1] - LANE_PATH[n]) : 1; return { x: laneX(LANE_PATH[n]) + dir * DC * Math.sin(PHI), y: rowY(n) - DC * Math.cos(PHI), dir, nx: dir * Math.sin(PHI), ny: -Math.cos(PHI) }; };
const CP = LANE_PATH.map((_, n) => CN(n));
const HOP = []; for (let n = 0; n < 11; n++) { const dt = TV[n + 1] - TV[n]; HOP.push({ dt, vx: (CP[n + 1].x - CP[n].x) / dt, g: 2 * (CP[n + 1].y - CP[n].y - AUP * dt) / (dt * dt) }); }
const T_APEX = TV[0] - Math.sqrt(2 * (CP[0].y - YAPEX) / GF);
const TOSS = (() => {
  const x0 = CUSH.x + 4, y0 = 1181, rise = y0 - YAPEX, v0 = Math.sqrt(2 * GF * rise), tUp = v0 / GF, tMouth = Math.sqrt(2 * (FUNNEL.y0 - YAPEX) / GF);
  return { x0, y0, v0, tUp, tr: T_APEX - tUp, vx: (FUNNEL.x - 14 - x0) / (tUp + tMouth), tMouth };
})();
const T_LAND = snapT(CUE.plinkland), FALL2 = Math.sqrt(2 * ((BD.slotBot - RB) - CP[11].y) / GF), T_REL = T_LAND - FALL2;
const SLOT_X = laneX(-1 + 11.5 / 6) ;   /* the centre of slot L */
/* the ball: {x, y, sq (squash 0..1), nx, ny (the squash axis), vis, phase} at scene-local time lt */
function ballAt(lt) {
  const o = { x: CUSH.x, y: CUSH.y - RB - 3, sq: 0, nx: 0, ny: -1, vis: true, phase: 'rest', vy: 0 };
  if (lt < TOSS.tr) return o;                                                                    /* before the throw: carried by the Kumquat (placed by the caller) */
  if (lt < T_APEX) { const u = lt - TOSS.tr; o.phase = 'toss'; o.x = TOSS.x0 + TOSS.vx * u; o.y = TOSS.y0 - TOSS.v0 * u + .5 * GF * u * u; o.vy = -TOSS.v0 + GF * u; return o; }
  if (lt < TV[0]) {                                                                              /* the fall from the apex: over the funnel mouth, down it, onto the first peg */
    const u = lt - T_APEX, y = YAPEX + .5 * GF * u * u, xm = TOSS.x0 + TOSS.vx * (TOSS.tUp + u), k = sstep(lt, T_APEX + TOSS.tMouth, T_APEX + TOSS.tMouth + .07);
    o.phase = 'fall'; o.x = lerp(xm, FUNNEL.x, k); o.y = y; o.vy = GF * u; return o;
  }
  for (let n = 0; n < 11; n++) if (lt < TV[n + 1]) {                                             /* a hop from peg n to peg n + 1 */
    const u = lt - TV[n], h = HOP[n];
    o.phase = 'hop'; o.n = n; o.x = CP[n].x + h.vx * u; o.y = CP[n].y + AUP * u + .5 * h.g * u * u; o.vy = AUP + h.g * u;
    const sq = SQ * Math.exp(-((u / .028) ** 2)) + SQ * Math.exp(-(((TV[n + 1] - lt) / .028) ** 2));      /* squashed against the peg just left and the peg about to be touched */
    const near = u < TV[n + 1] - lt ? n : n + 1;
    o.sq = sq; o.nx = CP[near].nx; o.ny = CP[near].ny; return o;
  }
  if (lt < T_REL) {                                                                              /* the hang on the last peg: a tremble that grows */
    const u = lt - TV[11], grow = sstep(lt, TV[11] + .1, T_REL), a = .5 + 3.4 * grow;
    o.phase = 'hang'; o.x = CP[11].x + a * Math.sin(u * 2 * PI * 13) * .8; o.y = CP[11].y + a * .5 * Math.abs(Math.sin(u * 2 * PI * 9)) * -1;
    o.sq = SQ * Math.exp(-((u / .028) ** 2)); o.nx = CP[11].nx; o.ny = CP[11].ny; return o;
  }
  if (lt < T_LAND) { const u = lt - T_REL; o.phase = 'drop'; o.x = lerp(CP[11].x, SLOT_X, sstep(lt, T_REL, T_REL + .06)); o.y = CP[11].y + .5 * GF * u * u; o.vy = GF * u; return o; }
  const u = lt - T_LAND, rest = BD.slotBot - RB, bounce = 15 * Math.abs(Math.sin(u / .13 * PI)) * Math.exp(-u / .1) * (u < .26 ? 1 : 0);   /* lands, bounces once and settles */
  o.phase = 'land'; o.x = SLOT_X; o.y = rest - bounce; o.sq = u < .06 ? .32 * (1 - u / .06) : 0; o.nx = 0; o.ny = -1; return o;
}
/* every peg that has been touched wobbles away from the ball and flashes; the last one keeps shivering */
function pegHits(lt) {
  const hits = {};
  for (let n = 0; n < 12; n++) {
    const age = lt - TV[n]; if (age < 0 || age > 3.2) continue;
    const dec = n === 11 ? .55 : .14, amp = (n === 11 ? 3.6 : 3.2) * Math.exp(-age / dec) * Math.cos(2 * PI * (n === 11 ? 11 : 16) * age), c = CP[n];
    hits[n] = { dx: -c.nx * amp, dy: -c.ny * amp, flash: Math.exp(-age / .09) };
  }
  return hits;
}
function boardSt(lt) {
  const land = lt - T_LAND, jeo = lt >= bS('jeopardy') && lt < 20.5, beacon = sstep(lt, T_LAND, T_LAND + .12) * (1 - sstep(lt, 20.3, 21.3));
  let lit = sstep(lt, T_LAND, T_LAND + .05) * (1 - .3 * sstep(lt, T_LAND + .3, T_LAND + .8));
  if (lt >= bS('jeopardy') && lt < 20.3) lit = Math.sin((lt - bS('jeopardy')) * 2 * PI * 4.5) > -.1 ? 1 : .25;     /* the L slot blinks through the jeopardy */
  return { hits: pegHits(lt), lit, bulbs: lt >= T_LAND && lt < 19.0 ? 'flash' : jeo ? 'flash' : 'chase', bell: land > 0 ? .55 * Math.exp(-land / .55) * Math.sin(land * 2 * PI * 3.2) : 0, spin: Math.max(0, lt - T_LAND) * 13, beacon };
}
function drawBall(lt) {
  const b = ballAt(lt); if (!b.vis) return;
  if (b.phase === 'rest') return;                                       /* before the throw the caller draws it with the Kumquat */
  drawBallAt(b.x, b.y, b);
}
function drawBallAt(x, y, b = {}) {
  ctx.save();
  const sp = Math.abs(b.vy || 0);
  if (sp > 1200) { for (let i = 1; i <= 5; i++) { ctx.globalAlpha = .5 * (1 - i / 6); ctx.fillStyle = '#ff5a5a'; const yy = y - Math.sign(b.vy || 1) * (sp * .006) * i; ell(x - (b.phase === 'toss' ? TOSS.vx * .006 * i : 0), yy, RB * (1 - i * .08), RB * (1 - i * .08)); ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(x + 4, y + 6, RB * .95, RB * .95); ctx.fill();
  ctx.translate(x, y);
  if ((b.sq || 0) > .004) { ctx.rotate(Math.atan2(b.ny, b.nx)); ctx.scale(1 - b.sq, 1 + b.sq * .55); ctx.rotate(-Math.atan2(b.ny, b.nx)); }
  ctx.fillStyle = rg(-4, -5, 1, RB * 1.25, [[0, '#ff9a9a'], [.4, '#ff2d3a'], [1, '#8a0814']]); ell(0, 0, RB, RB); ctx.fill();
  ctx.strokeStyle = 'rgba(40,6,10,.9)'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ell(-4.2, -5, 3.6, 2.2, -.6); ctx.fill();
  ctx.restore();
  V2.glow(x, y, 34, '255,70,80', .35, 'screen', .5);
}
// ------------------------------------------------------------------ the shots (scene-local seconds). cam(lt, u) -> [centre x, centre y, zoom]; u runs 0..1 over the shot
const fcam = (name, z0, z1, up = 160, dx = 0, ease = easeIO) => (lt, u) => { const f = faceC(CASTFN[name](lt)), z = lerp(z0, z1, ease(u)); return [f[0] + dx / z, f[1] + up / z, z]; };
const pcam = (a, b, ease = easeIO) => (lt, u) => mixA(a, b, ease(u));
const kcam = (z0, z1, up = 120, dx = 0) => (lt, u) => { const z = lerp(z0, z1, easeIO(u)), x = key(KUM_RUN, lt, easeIO); return [x + dx / z, F - 60 - up / z * .0 + 0, z]; };
const BOARDC = BD.top + 482, ZB = 1.2;   /* the whole board in the clear band: its top (the sign) 244 px from the frame top and the tray under the caption zone */
/* the board camera: a tilt that follows the falling ball (its height smoothed over a fifth of a second either side), close enough that the ball is 50 px and every peg is a clear dot */
const T_BEND = 16.20;
const ballYs = lt => { let y = 0; for (let i = 0; i <= 8; i++) y += ballAt(Math.max(T_APEX, Math.min(TV[11], lt - .2 + i * .05))).y; return y / 9; };
const BCAM = lt => { const z = lerp(1.9, 2.1, easeIO(c01((lt - T_APEX) / (T_BEND - T_APEX)))); return [BD.cx + 8 + 24 * c01((lt - TV[0]) / 1.6), ballYs(lt) + 330 / z, z]; };
const LCAM = [BD.cx + 125, 700, 2.5];   /* the last peg and slot L, close */
const SHOTS = [
  { id: 'wide', t0: 0, t1: 1.10, cam: pcam([560, 892, .98], [560, 898, 1.04], easeOut) },
  { id: 'st1a', t0: 1.10, t1: 1.95, cam: fcam('star', 4.8, 5.2, 190), dof: 10 },
  { id: 'form1', t0: 1.95, t1: 5.05, type: 'form', form: 1, cam: fcam('star', 4.8, 4.8, 190), dof: 16 },
  { id: 'me1', t0: 5.05, t1: 6.757, cam: fcam('melon', 3.4, 3.9, 190, 40), dof: 9 },
  { id: 'a1', t0: 6.757, t1: 8.598, cam: fcam('melon', 4.7, 5.1, 190), dof: 10 },
  { id: 'st2', t0: 8.598, t1: 10.165, cam: fcam('star', 3.2, 3.5, 190, 190), dof: 9 },
  { id: 'st3a', t0: 10.165, t1: 10.95, cam: fcam('star', 5.0, 5.2, 190), dof: 10 },
  { id: 'kum1', t0: 10.95, t1: 13.2, cam: fcam('kum', 7.4, 8.6, 130, 4), dof: 10 },
  { id: 'kum2', t0: 13.2, t1: TOSS.tr, cam: fcam('kum', 8.6, 7.8, 130, 4), dof: 10 },
  { id: 'toss', t0: TOSS.tr, t1: T_APEX, pan: true, blur: 8, cam: (lt, u) => mixA(fcam('kum', 7.8, 7.8, 130, 4)(TOSS.tr, 1), BCAM(T_APEX), easeIO(c01((lt - TOSS.tr) / .55))) },
  { id: 'b1', t0: T_APEX, t1: T_BEND, cam: (lt, u) => BCAM(lt) },
  { id: 'm1', t0: T_BEND, t1: 16.40, cam: () => { const f = faceC(castMelon(16.3)); return [f[0] + 6, f[1] + 190 / 4.4, 4.4]; }, dof: 10 },
  { id: 'b3', t0: 16.40, t1: 16.713, cam: (lt, u) => mixA(BCAM(lt), LCAM, easeOut(c01((lt - 16.40) / .3))) },
  { id: 'a2', t0: 16.713, t1: 17.35, cam: fcam('melon', 4.8, 5.2, 190), dof: 11 },
  { id: 'b4', t0: 17.35, t1: 18.2, cam: pcam(LCAM, [LCAM[0], LCAM[1] + 10, 2.7]) },
  { id: 'b5', t0: 18.2, t1: 18.55, pan: true, blur: 6, cam: (lt, u) => mixA([LCAM[0], LCAM[1] + 10, 2.7], [BD.cx + 70, 170, 1.7], easeIO(c01((lt - 18.2) / .22))) },
  { id: 'st4', t0: 18.55, t1: 18.925, cam: fcam('star', 5.2, 5.3, 190), dof: 10 },
  { id: 'j1', t0: 18.925, t1: 19.358, cam: pcam([640, 960, 1.3], [640, 960, 1.34]) },
  { id: 'j2', t0: 19.358, t1: 19.75, cam: fcam('melon', 4.4, 4.4, 150), dof: 10 },
  { id: 'j3', t0: 19.75, t1: 20.075, cam: pcam([560, 900, 1.0], [560, 900, 1.02]) },
  { id: 's5a', t0: 20.075, t1: 20.93, cam: fcam('star', 5.0, 5.4, 190), dof: 10 },
  { id: 'form2', t0: 20.93, t1: 24.45, type: 'form', form: 2, cam: fcam('star', 4.8, 4.8, 190), dof: 16 },
  { id: 's5b', t0: 24.45, t1: 25.15, cam: pcam([640, 1172, 2.25], [640, 1172, 2.35]) },
  { id: 's5c', t0: 25.15, t1: 25.985, cam: fcam('straw', 5.0, 5.8, 180), dof: 10 },
  { id: 'a3', t0: 25.985, t1: 27.385, cam: fcam('melon', 4.6, 5.0, 190), dof: 10 },
  { id: 'st6', t0: 27.385, t1: 28.421, cam: fcam('star', 5.6, 5.8, 190), dof: 12, dim: .74, dimC: '4,8,24', glowOn: 'star', light: { back: { color: '255,236,190', a: 1, w: 26 }, frontDark: .3, keyA: .16, rimA: .2 } },
  { id: 'st7a', t0: 28.421, t1: 29.64, cam: pcam([533, 1150, 3.8], [533, 1150, 3.95]), dof: 6 },
  { id: 'st7b', t0: 29.64, t1: 30.34, cam: pcam([745, 1150, 3.8], [745, 1150, 3.95]), dof: 6 },
  { id: 'st7c', t0: 30.34, t1: 31.36, cam: pcam([640, 1200, 1.35], [640, 1200, 1.4]) },
  { id: 's1', t0: 31.36, t1: 32.18, cam: fcam('straw', 5.0, 5.6, 180), dof: 11 },
  { id: 'st8', t0: 32.18, t1: 33.68, cam: fcam('star', 5.0, 5.2, 190), dof: 10 },
  { id: 'sit', t0: 33.68, t1: 34.95, cam: pcam([640, 1172, 2.2], [640, 1172, 2.3]) },
  { id: 'sit2', t0: 34.95, t1: 35.53, cam: pcam([880, 1160, 3.0], [880, 1160, 3.1]) },
  { id: 'ring1', t0: 35.53, t1: 35.9, cam: pcam([100, 985, 3.0], [100, 981, 3.2]), dof: 5 },
  { id: 'ring2', t0: 35.9, t1: 36.48, cam: pcam([721, 1120, 1.8], [721, 1120, 1.84]) },
  { id: 'st9a', t0: 36.48, t1: 37.95, cam: pcam([330, 1090, 2.0], [250, 1085, 2.3]) },
  { id: 'st9b', t0: 37.95, t1: 38.85, cam: fcam('straw', 4.8, 5.4, 180), dof: 11 },
  { id: 'out', t0: 38.85, t1: 99, type: 'out', blur: lt => lt < T_OUTX ? 8 : lt < T_OUTZ + .05 ? 6 : 1, cam: (lt, u) => lt < T_OUTX ? [560, 900, 1] : outCam(lt) },
];
const shotAt = lt => { for (const s of SHOTS) if (lt < s.t1) return s; return SHOTS[SHOTS.length - 1]; };

// ------------------------------------------------------------------ the stage: light, the background (blurred in close-ups), chairs, the cast (whole in the frame or a sliver), the table, the ball
function lightRig(lt, sh = {}) {
  V2.setLight(Object.assign({ key: [-.7, -.55], keyColor: '#ffd9a0', keyA: .34, rim: '#9cb8ff', rimA: .38, shadow: '#2a1d30', shadowA: .34, bounce: '#ffcf9a', bounceA: .14, amb: '#ffe6c4', ambA: .05 }, sh.light || {}));
  const bs = boardSt(lt);
  if (bs.beacon > .02) V2.addLight({ x: BD.cx + 188, y: BD.top - 14, r: 1100, color: '255,40,50', a: .85 * bs.beacon * (.55 + .45 * Math.sin(bs.spin * 2)) });
}
const chairOpts = (x, lt) => x === XS.straw ? { rot: -.05 * (1 - sstep(lt, SIT_T.straw - 1.1, SIT_T.straw)), top: 1066 } : {};
function visFrac(o) {
  const k = KINDS[o.kind], sc = o.s || 1, m = ctx.getTransform(), b = boxOfChar(o), xs = [b[0], b[2]].map(x => m.a * x + m.e), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const hx = [o.x - k.rx * .94 * sc, o.x + k.rx * .94 * sc].map(x => m.a * x + m.e), h0 = Math.min(...hx), h1 = Math.max(...hx), top = m.d * (bodyCY(o) - headTop(o, k) * sc) + m.f;
  const f = (Math.min(x1, W) - Math.max(x0, 0)) / Math.max(1, x1 - x0), headIn = h0 >= 4 && h1 <= W - 4 && top >= 4, headOut = h1 <= 0 || h0 >= W;
  return { f, ok: headIn || (headOut && f <= .25), x0, x1, top, headIn };
}
function faceInZone(o) {
  const k = KINDS[o.kind], f = faceC(o), m = ctx.getTransform(), yc = m.d * f[1] + m.f, hh = k.ry * .62 * o.s * m.d, xc = m.a * f[0] + m.e, hw = k.rx * .8 * o.s * m.a;
  return xc + hw > 0 && xc - hw < W && yc + hh > 1372;
}
function drawBack(lt) { drawRoomAll(lt); drawBoard(lt, boardSt(lt)); }
function drawStageBody(lt, sh) {
  lightRig(lt, sh);
  if (sh.dof) V2.dof(sh.dof, () => drawBack(lt)); else drawBack(lt);
  if (sh.dim) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(${sh.dimC || '10,8,20'},${sh.dim})`; ctx.fillRect(0, 0, W, H); ctx.restore(); if (sh.glowOn) { const f = faceC(CASTFN[sh.glowOn](lt)); V2.glow(f[0], f[1] + 10, 250, '255,196,120', .42, 'screen', .4); V2.glow(f[0], f[1] + 10, 460, '255,170,100', .16, 'screen', .2); } }
  const kumO = CASTFN.kum(lt), list = [];
  for (const id of CASTORDER) {
    const o = id === 'kum' ? kumO : CASTFN[id](lt), v = visFrac(o);
    let show = true;
    if (v.x1 < 0 || v.x0 > W) show = false;
    else if (!v.ok) { if (!sh.pan) show = false; else o.transit = true; }
    if (show && sh.pan) o.transit = true;                         /* a whip: nobody is a subject while the camera is crossing the room */
    if (show && !sh.pan && faceInZone(o)) show = false;           /* a face never sits under the captions or on the frame's bottom edge: that character is out of the shot */
    list.push([id, o, show]);
  }
  for (const [id, o, show] of list) if (show && id !== 'star' && id !== 'kum') drawChair(XS[id], chairOpts(XS[id], lt));
  { const wk = sstep(lt, 32.0, 33.4) * (1 - sstep(lt, 34.8, 35.5)); if (wk > .02) { V2.glow(XS.straw, 1135, 170, '255,222,160', .55 * wk, 'screen', .35); V2.glow(XS.straw, 1100, 90, '255,240,200', .3 * wk, 'screen', .2); } }   /* the chair that has been waiting for her: a pool of warm light */
  for (const [id, o, show] of list) if (show) drawChar(o);
  drawTableTop(lt); drawTableDressing(lt, { boxOpen: 1 - sstep(lt, 34.82, 34.97), boxDy: 62 * sstep(lt, 34.97, 35.12) - 14 * Math.sin(PI * c01((lt - 34.8) / .2)) }); drawTableFront(lt);
  drawCushion(lt); thudFx(lt);
  const b = ballAt(lt);
  if (b.phase === 'rest' || lt < TOSS.tr) { const [hx, hy] = heldBall(lt, kumO); drawBallAt(hx, hy, { sq: 0 }); } else drawBall(lt);
  blindLight(lt, sh.type === 'form' ? .6 : 1); dustMotes(lt);
  beaconBeams(lt, boardSt(lt)); sitPuffs(lt);
  const d = doorSt(lt); if (d.dome > .05) V2.ring(78, DOOR.y0 - 32, c01(((lt - snapT(CUE.ding)) * 1.1) % 1), { r0: 20, r1: 220, lw: 6, color: '255,60,70', alpha: .8 * d.dome, bloom: .3 });
}
function thudFx(lt) {
  const t0 = T_TH, u = lt - t0;
  if (u < -1e-6 || u > 1.0) return;
  const ox = XS.melon, oy = TB.y0 + 10;
  for (let i = 0; i < 16; i++) {
    const uu = u + .03, a = -PI / 2 + (hash(i * 3.1) - .5) * 2.3, v = 260 + 380 * hash(i * 5.7 + 2), x = ox + Math.cos(a) * v * uu * .9, y = oy + Math.sin(a) * v * uu + .5 * 1500 * uu * uu;
    if (y > TB.y1 + 20) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(uu * 9 * (hash(i) - .5));
    ctx.fillStyle = i % 3 === 0 ? '#b02a22' : i % 3 === 1 ? '#f2c03a' : '#e9cc98'; ctx.strokeStyle = 'rgba(40,10,6,.8)'; ctx.lineWidth = 1.6;
    if (i % 3 === 0) { ell(0, 0, 7, 7); ctx.fill(); ctx.stroke(); } else { rr(-6, -3, 12, 6, 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  V2.ring(ox, oy, c01((u + .03) / .45), { r0: 20, r1: 150, lw: 7, color: '255,236,200', alpha: .8, bloom: 0 });
}
function drawCushion(lt) {   /* the little velvet cushion the ball waits on, on the floor beside the Kumquat */
  const x = CUSH.x, y = F + 2;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(x, y + 5, 34, 7); ctx.fill();
  ctx.fillStyle = lg(0, y - 14, 0, y + 4, [[0, '#9a2b54'], [1, '#5e1736']]); ctx.strokeStyle = 'rgba(30,6,16,.9)'; ctx.lineWidth = 3; rr(x - 28, y - 12, 56, 15, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e4c26a'; for (const dx of [-28, 28]) { ell(x + dx, y - 2, 4, 4); ctx.fill(); }
}

// ------------------------------------------------------------------ THE FORM: the Statement of Deficiencies, a full-frame insert (screen space) on a clipboard. UI.table with a separate SEVERITY column, so a stamp never lands on printed text.
const FORM = { x: 82, y: 262, w: 916, h: 1094, paper: [128, 338, 824, 962], tab: { x: 152, y: 586, w: 776, rowH: 128 } };
const FT = {   /* the typing schedule (scene-local): the tag, the two lines of the finding; and when the stamps land (video frames nearest the cues) */
  f1: { t0: 1.95, tag: [1.95, 2.85], l1: [2.96, 3.55], l2: [3.55, 4.05], stamp: snapT(CUE.stamp1) },
  f2: { t0: 20.93, tag: [21.0, 22.0], l1: [22.56, 23.55], l2: [23.6, 24.3], stamp: snapT(CUE.stamp2) },
};
const ROWS = [['F-761', 'INSULIN PEN', 'WITHOUT AN OPEN DATE'], ['F-725', 'SUFFICIENT', 'NURSING STAFF'], ['F-999', 'THE FACILITY FAILED', 'TO COVER ITS STAFF']];
const INK_F = '#1d2540', RED_F = '#c23a2b';
const rev = (lt, a, b) => c01((lt - a) / (b - a));
const sring = (x, y, k, o) => { ctx.save(); ctx.globalCompositeOperation = 'screen'; V2.ring(x, y, k, o); ctx.restore(); };   /* a ring of light (never an opaque stroke across a letter) */
/* the stamp's slam: huge and faint a tenth of a second before the hit, full size ON the hit frame, a small rebound; returns { k (scale), a (alpha), age } */
function slam(lt, tHit, big = 2.3) {
  const age = lt - tHit;
  if (age < -.11) return null;
  if (age < -1e-6) { const u = (age + .11) / .11; return { k: lerp(big, 1, easeIn(u)), a: .25 + .65 * u, age }; }
  return { k: 1 - .05 * Math.max(0, pulse(lt, tHit, 26, .1)), a: .94, age };
}
function ink(rect, a) { return rgba('#1d2540', a); }
function drawPen(x, y, lt) {   /* the surveyor's pen, its nib at (x, y), the barrel running up to the right and off the sheet */
  ctx.save(); ctx.translate(x, y); ctx.rotate(2.44); ctx.lineJoin = 'round';   /* the barrel runs down and to the right, over blank paper, so the pen never crosses a letter */
  ctx.fillStyle = '#c3cad4'; ctx.strokeStyle = '#14182a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -26); ctx.lineTo(7, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#33527a'; rr(-9, -300, 18, 276, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-5, -292, 4, 250);
  ctx.fillStyle = '#c3cad4'; ctx.fillRect(7, -290, 4, 90);
  ctx.restore();
}
function formRows(lt, F_, which) {
  const T = FORM.tab, rows = [];
  const tyRev = (row, part) => row < which ? 1 : row > which ? 0 : part;
  for (let r = 0; r < 3; r++) {
    const cur = r === which;
    const tagR = cur ? rev(lt, F_.tag[0], F_.tag[1]) : (r < which ? 1 : 0), l1R = cur ? rev(lt, F_.l1[0], F_.l1[1]) : (r < which ? 1 : 0), l2R = cur ? rev(lt, F_.l2[0], F_.l2[1]) : (r < which ? 1 : 0);
    rows.push([
      { t: ROWS[r][0], size: 40, font: 'Bangers', fill: INK_F, spacing: 2, reveal: tagR, align: 'center' },
      { t: '', draw: (x0, y0, x1, y1, rec) => { const L = [{ t: ROWS[r][1], reveal: l1R }, { t: ROWS[r][2], reveal: l2R }]; UI.lines(L.map(l => Object.assign({ size: 32, weight: 800, fill: INK_F }, l)), x0 + 18, (y0 + y1) / 2, { v: 'mid', lh: 1.35, cid: rec.id, maxW: x1 - x0 - 36 }); } },
      { t: '' },
    ]);
  }
  return rows;
}
function drawForm(lt, which) {
  const F_ = which === 0 ? FT.f1 : FT.f2, t0 = F_.t0 - (which === 0 ? .0 : .0), inK = easeBack(c01((lt - (which === 0 ? 1.95 : 20.93)) / .24));
  const rot = -.012 + .01 * (1 - inK), slide = (1 - c01(inK)) * 700;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(540, 810 + slide); ctx.rotate(rot); ctx.translate(-540, -810);
  /* the clipboard: a hardboard back, a steel clip, the paper */
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = lg(0, FORM.y, 0, FORM.y + FORM.h, [[0, '#c4925c'], [1, '#8e6238']]); rr(FORM.x, FORM.y, FORM.w, FORM.h, 30); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(30,16,8,.9)'; ctx.lineWidth = 6; ctx.stroke();
  UI.container('formboard', 'board', [FORM.x, FORM.y, FORM.x + FORM.w, FORM.y + FORM.h], 6);
  ctx.fillStyle = lg(0, FORM.y - 24, 0, FORM.y + 60, [[0, '#eef2f8'], [1, '#98a2b0']]); ctx.strokeStyle = 'rgba(30,36,50,.9)'; ctx.lineWidth = 5; rr(430, FORM.y - 22, 220, 74, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6c7584'; ell(540, FORM.y + 12, 14, 14); ctx.fill();
  const [px, py, pw, ph] = FORM.paper;
  ctx.fillStyle = '#fbf8ec'; ctx.strokeStyle = 'rgba(60,50,30,.5)'; ctx.lineWidth = 3; rr(px, py, pw, ph, 6); ctx.fill(); ctx.stroke();
  UI.container('formpaper', 'page', [px, py, px + pw, py + ph], 10);
  /* the printed furniture of the form's lower half (no text): two signature rules and a faint State seal, so that the empty paper reads as a form */
  ctx.save(); ctx.strokeStyle = 'rgba(70,80,110,.38)'; ctx.lineWidth = 3;
  for (const [a, b] of [[px + 56, px + 372], [px + pw - 372, px + pw - 56]]) { ctx.beginPath(); ctx.moveTo(a, py + ph - 62); ctx.lineTo(b, py + ph - 62); ctx.stroke(); }
  ctx.translate(px + pw / 2, py + ph - 150); ctx.strokeStyle = 'rgba(70,80,110,.16)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.stroke(); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(70,80,110,.16)'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? 15 : 36; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); } ctx.closePath(); ctx.fill();
  ctx.restore();
  /* the heading: a slate band with the State's star, the title on two lines */
  ctx.fillStyle = '#33527a'; rr(px + 24, py + 24, pw - 48, 118, 8); ctx.fill();
  ctx.fillStyle = '#d9a93a'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, R = i % 2 ? 13 : 30; ctx.lineTo(px + 80 + Math.cos(a) * R, py + 84 + Math.sin(a) * R); } ctx.closePath(); ctx.fill();
  UI.container('formhead', 'panel', [px + 24, py + 24, px + pw - 24, py + 142], 12);
  UI.label('STATEMENT OF DEFICIENCIES', px + pw / 2 + 36, py + 62, { size: 42, fill: '#ffffff', spacing: 2.5, cid: 'formhead', maxW: pw - 220, align: 'center', center: false });
  UI.label('FRUIT BOWL REHAB & NURSING', px + pw / 2 + 36, py + 108, { size: 32, fill: '#cfe0f7', weight: 800, spacing: 1.5, cid: 'formhead', maxW: pw - 220, center: false });
  const T = FORM.tab, W3 = [150, 436, 190], hdrH = 62, hy = T.y - hdrH;
  /* the column heads (a separate band, so the table below is only rows), then the table */
  ctx.fillStyle = '#2b2f4a'; rr(T.x, hy, T.w, hdrH, 8); ctx.fill();
  UI.container('formcols', 'panel', [T.x, hy, T.x + T.w, hy + hdrH], 8);
  let cx = T.x; ['TAG', 'FINDING', 'SEVERITY'].forEach((h, i) => { UI.label(h, cx + W3[i] / 2, hy + hdrH / 2, { size: 32, fill: '#ffffff', spacing: 1.5, cid: 'formcols', center: false, maxW: W3[i] - 20 }); cx += W3[i]; });
  const rows = formRows(lt, F_, which === 0 ? 0 : 2);
  const tbl = UI.table([T.x, T.y, T.w, T.rowH * 3], [{ w: W3[0], align: 'center' }, { w: W3[1] }, { w: W3[2], align: 'center' }], rows, { rowH: T.rowH, size: 34, fill: '#fffdf5', stroke: '#33527a', lw: 4, r: 8, grid: 'rgba(51,82,122,.45)', vgrid: true, id: 'formtab', padX: 16 });
  /* the pen: its nib at the end of what has just been typed */
  const wr = which === 0 ? 0 : 2, cur = which === 0 ? F_ : F_, tagR = rev(lt, cur.tag[0], cur.tag[1]), l1R = rev(lt, cur.l1[0], cur.l1[1]), l2R = rev(lt, cur.l2[0], cur.l2[1]);
  const writing = lt < cur.l2[1] + .15;
  if (writing && inK > .95) {
    const rec = tbl.cell(wr, tagR < 1 ? 0 : 1);
    let nx, ny;
    if (tagR < 1) { const w = UI.sizeOf(ROWS[wr][0].slice(0, Math.ceil(5 * tagR)), { size: 40, font: 'Bangers', spacing: 2 }).w, full = UI.sizeOf(ROWS[wr][0], { size: 40, font: 'Bangers', spacing: 2 }).w; nx = rec.cx - full / 2 + w + 4; ny = rec.cy + 12; }
    else { const line = l1R < 1 ? 0 : 1, str = ROWS[wr][1 + line], rr_ = line ? l2R : l1R, w = UI.sizeOf(str.slice(0, Math.ceil(str.length * rr_)), { size: 32, weight: 800 }).w; nx = rec.x0 + 18 + w + 4; ny = (rec.y0 + rec.y1) / 2 + (line ? 26 : -26) + 12; }
    const kk = which === 1 ? 12 * pulse(lt, F_.stamp, 26, .09) : 0;
    drawPen(nx + 2 * Math.sin(lt * 31) - kk * .5, ny + 2 * Math.cos(lt * 23) - kk, lt);
  }
  /* the stamps, in the SEVERITY column only (or, for NEW TAG, in the empty part of the paper under the table) */
  const sevCx = T.x + W3[0] + W3[1] + W3[2] / 2, rowCy = r => T.y + T.rowH * (r + .5);
  const sD = which === 0 ? slam(lt, F_.stamp, 2.3) : { k: 1, a: .94, age: 9 };
  if (sD) { ctx.save(); ctx.translate(sevCx, rowCy(0)); ctx.scale(sD.k, sD.k); ctx.translate(-sevCx, -rowCy(0)); UI.stamp('D', sevCx, rowCy(0), { size: 84, color: '#1d2a5a', rot: -.11, alpha: sD.a, id: 'stampD' }); ctx.restore(); if (sD.age >= -1e-6 && sD.age < .5) sring(sevCx, rowCy(0), (sD.age + .03) / .5, { r0: 40, r1: 170, lw: 7, color: '40,60,120', alpha: .8, bloom: 0 }); }
  if (which === 1) { UI.stamp('L', sevCx, rowCy(1), { size: 84, color: RED_F, rot: .08, alpha: .94, id: 'stampL' }); }
  if (which === 1) {
    const sN = slam(lt, F_.stamp, 2.6);
    if (sN) {
      const cxn = 540, cyn = 1166, sz = UI.sizeOf('NEW TAG', { size: 176, font: 'Bangers', lw: 8 }), pw_ = sz.w + 176, ph_ = sz.cap + 120;
      if (sN.age >= -1e-6) V2.glow(cxn, cyn, 760, '255,226,120', .55 * Math.exp(-sN.age / .7), 'screen', .9);
      ctx.save(); ctx.translate(cxn, cyn); ctx.scale(sN.k, sN.k); ctx.translate(-cxn, -cyn);
      /* the slab of ink under the letters: a deep green plate (it hides the pen under it), gold border and gold letters */
      ctx.save(); ctx.globalAlpha *= sN.a; ctx.translate(cxn, cyn); ctx.rotate(-.07);
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14; ctx.fillStyle = lg(0, -ph_ / 2, 0, ph_ / 2, [[0, '#27b868'], [1, '#0e6535']]); rr(-pw_ / 2, -ph_ / 2, pw_, ph_, 32); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.save(); rr(-pw_ / 2, -ph_ / 2, pw_, ph_, 32); ctx.clip();
      if (sN.age > .05) { const g = c01((sN.age - .05) / .55), gx = lerp(-pw_ * .7, pw_ * .7, g); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg(gx - 70, -ph_, gx + 70, ph_, [[0, 'rgba(255,255,255,0)'], [.5, `rgba(255,248,200,${.55 * (1 - g)})`], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-pw_ / 2, -ph_ / 2, pw_, ph_); }
      ctx.restore(); ctx.restore();
      UI.stamp('NEW TAG', cxn, cyn, { size: 176, color: '#f6d24a', ink: '#ffe57a', tstroke: '#0b4424', tlw: 8, lw: 14, rot: -.07, tilt: .2, alpha: sN.a, id: 'stampNEW' }); ctx.restore();
      if (sN.age >= -1e-6) { sring(cxn, cyn, c01((sN.age + .03) / .7), { r0: 80, r1: 700, lw: 16, color: '255,226,120', alpha: .9 }); sring(cxn, cyn, c01((sN.age - .05) / .8), { r0: 60, r1: 900, lw: 8, color: '120,255,170', alpha: .6 });
        V2.sparks(cxn, cyn, lt, F_.stamp, { n: 46, speed: 760, life: 1.0, color: '255,230,140', g: 900, size: 5, seed: 4 }); } }
  }
  ctx.restore();
}
function drawInsertBackdrop(lt, sh) {   /* the room behind an insert: the shot's own camera, heavily out of focus and dark (suppressed from the audit: it is a blur, not a subject) */
  REG.suppress++; TXA.eng++;
  try { V2.dof(18, () => { drawStageBody(lt, Object.assign({}, sh, { dof: 0 })); }); } finally { TXA.eng--; REG.suppress--; }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(10,8,20,.58)'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// ------------------------------------------------------------------ light and air: blind light, dust, the beacon's sweep, breath puffs
function blindLight(lt, a = 1) {
  const x0 = WIN.x1 + 16, x1 = 1300, slope = .36, n = 10, sp = 58, off = (lt * 4) % sp;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = -1; k < n; k++) {
    const ya = WIN.y0 + 20 + k * sp + off, fade = sstep(ya, WIN.y0 - 10, WIN.y0 + 60) * (1 - sstep(ya, WIN.y1 - 120, WIN.y1 - 30));
    if (fade <= .01) continue;
    const yb = ya + (x1 - x0) * slope, g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, `rgba(255,216,150,${.24 * a * fade})`); g.addColorStop(.6, `rgba(255,204,130,${.12 * a * fade})`); g.addColorStop(1, `rgba(255,196,120,${.04 * a * fade})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, ya); ctx.lineTo(x1, yb); ctx.lineTo(x1, yb + 54); ctx.lineTo(x0, ya + 16); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  V2.glow((WIN.x0 + WIN.x1) / 2, WIN.y1 - 90, 260, '255,214,150', .22 * a, 'screen', .4);
}
function dustMotes(lt, a = 1) { V2.dust(300, 250, 1150, 1290, lt, { n: 34, alpha: .5 * a, size: 3 / Math.sqrt(Math.max(1, CAM.z)), speed: 7, seed: 5, color: '255,236,196' }); }
function beaconBeams(lt, st) {
  if (st.beacon < .03) return;
  const x = BD.cx + 188, y = BD.top - 22, a = st.beacon;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 2; i++) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(st.spin * .54 + i * PI);
    const g = ctx.createLinearGradient(0, 0, 1700, 0); g.addColorStop(0, `rgba(255,60,70,${.75 * a})`); g.addColorStop(.5, `rgba(255,50,60,${.34 * a})`); g.addColorStop(1, 'rgba(255,50,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(1700, -400); ctx.lineTo(1700, 400); ctx.lineTo(0, 18); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  V2.glow(x, y, 320, '255,40,60', .8 * a, 'screen', .9);
}
function puff(x, y, age, size) {   /* a breath: a few soft white discs rising and spreading */
  if (age < 0 || age > .9) return;
  const k = age / .9;
  ctx.save(); ctx.fillStyle = `rgba(255,255,255,${.5 * (1 - k)})`;
  for (let i = 0; i < 4; i++) { const px = x + (i - 1.5) * size * .4 * (.4 + k), py = y - size * (.5 + 1.4 * k) - i * size * .1; ell(px, py, size * (.35 + .5 * k), size * (.3 + .4 * k)); ctx.fill(); }
  ctx.restore();
}
function sitPuffs(lt) {
  [['lemon', CUE.sit[0]], ['mango', CUE.sit[1]], ['clem', CUE.sit[2]], ['straw', CUE.sit[3]], ['melon', CUE.chair]].forEach(([id, tc]) => { const tt = snapT(tc) + .1, o = CASTFN[id](lt), f = faceC(o); puff(f[0] + (id === 'melon' ? 0 : 8), f[1] + 20 * o.s, lt - tt, 24 * o.s / .46); });
}

// ------------------------------------------------------------------ props and accessories of this scene (prefix fp14v_)
EXT.acc.fp14v_pizza = (o, k, t, layer) => {   /* a slice stuck to the Administrator's face: cheese, sauce, two pepperoni, strings of cheese from the chin */
  if (layer !== 'front' || !(o.pizza > 0)) return;
  const a = c01(o.pizza), fall = o.pizzaFall || 0;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, fall * 170); ctx.rotate(fall * .5);
  ctx.save(); ctx.translate(k.rx * .2, -k.ry * .16); ctx.rotate(-.5);
  ctx.fillStyle = '#f2c03a'; ctx.strokeStyle = '#8a4a14'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, 52); ctx.lineTo(-44, -34); ctx.quadraticCurveTo(0, -48, 44, -34); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c0382b'; ctx.beginPath(); ctx.moveTo(-44, -34); ctx.quadraticCurveTo(0, -48, 44, -34); ctx.lineTo(40, -22); ctx.quadraticCurveTo(0, -36, -40, -22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b02a22'; for (const [dx, dy, r] of [[-12, -6, 9], [14, 12, 8]]) { ell(dx, dy, r, r); ctx.fill(); ctx.strokeStyle = '#6a140f'; ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#f6d36a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (const [x0, len] of [[-18, 30], [6, 42], [28, 24]]) { ctx.beginPath(); ctx.moveTo(x0, k.mouthY + 22); ctx.quadraticCurveTo(x0 + 6 * Math.sin(t * 2 + x0), k.mouthY + 22 + len * .6, x0 - 3, k.mouthY + 22 + len); ctx.stroke(); }
  ctx.fillStyle = 'rgba(190,48,36,.7)'; for (const [dx, dy] of [[-48, 26], [52, 20], [-8, 58]]) { ell(k.rx * 0 + dx, dy, 13, 7, .4); ctx.fill(); }
  ctx.restore();
};
PROP_BOX.fp14v_bag = [-34, -8, 38, 100];   /* the bag itself (the tag on its string hangs far below the face, in front of the body) */
EXT.prop.fp14v_bag = (side, o, t) => {   /* the evidence bag: a clear zip bag held up by its zipper, the pen inside, and a tag on a string (EXHIBIT A) swinging beside it */
  const sw = (o.bagSwing ?? 0) + .03 * Math.sin(t * 3.1), tsw = .05 * Math.sin(t * 2.3 + 1) * (o.tagSwing ?? 1);
  ctx.save(); ctx.rotate(sw);
  ctx.fillStyle = 'rgba(214,236,252,.42)'; ctx.strokeStyle = 'rgba(235,246,255,.95)'; ctx.lineWidth = 3.4; rr(-26, -4, 56, 96, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-20, 8, 7, 72);
  ctx.fillStyle = '#d6202e'; rr(-26, -4, 56, 11, 4); ctx.fill(); ctx.strokeStyle = 'rgba(40,10,14,.8)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.translate(4, 52); ctx.rotate(.28); ctx.fillStyle = '#2a6fdb'; ctx.strokeStyle = '#10142a'; ctx.lineWidth = 2.4; rr(-4.5, -34, 9, 68, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e9edf4'; rr(-4.5, -34, 9, 16, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c0c6cf'; ctx.beginPath(); ctx.moveTo(-4.5, 34); ctx.lineTo(4.5, 34); ctx.lineTo(0, 44); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = '#d8d0b8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-22, 86); ctx.quadraticCurveTo(-36, 126, -50, 166); ctx.stroke();
  ctx.save(); ctx.translate(-50, 166); ctx.rotate(tsw);
  UI.tag(['EXHIBIT A'], -44, 22, { size: 22, fill: '#fff4c2', ink: '#1d1a16', stroke: 'rgba(60,40,10,.8)', lw: 2, id: 'exhibit', shadow: 0, h: 52, text: { transit: !!o.transit } });
  ctx.restore();
  ctx.restore();
};

// ------------------------------------------------------------------ the IMMEDIATE JEOPARDY stamp (screen space): slams on the siren, pulses on the klaxon, rises out of the way of Melon's face, fades
function overBong(lt) {   /* the bell, as a word, on the landing frame: pops, wobbles, fades before the cut to the surveyor */
  const age = lt - T_LAND;
  if (age < -1e-6 || age > .44) return;
  const pop = age < .12 ? easeBack(c01(age / .12)) : 1, fade = 1 - sstep(lt, T_LAND + .3, T_LAND + .44), wob = Math.sin(age * 38) * .035 * Math.exp(-age / .16), k = .45 + .55 * pop;
  ctx.save(); ctx.translate(380, 560); ctx.scale(k, k);
  UI.label('BONG!', 0, 0, { size: 150, font: 'Bangers', fill: '#ffd23a', stroke: '#3a1204', lw: 14, spacing: 4, rot: -.1 + wob, alpha: fade, hero: true, shadow: 10, id: 'bong' });
  ctx.restore();
}
function overJeopardy(lt) {
  const t0 = snapT(CUE.siren), kl = snapT(CUE.klaxon);
  if (lt < t0 - .11 || lt > 20.25) return;
  const sl = slam(lt, t0, 2.8); if (!sl) return;
  const mv = sstep(lt, 19.36, 19.5), fade = 1 - sstep(lt, 19.95, 20.2), cx = lerp(540, 650, mv), cy = lerp(452, 392, mv), sc = lerp(1, .6, mv) * (1 + .06 * Math.max(0, pulse(lt, kl, 30, .08)));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sl.k * sc, sl.k * sc); ctx.translate(-cx, -cy); ctx.globalAlpha *= fade;
  UI.sign([cx - 380, cy - 150, 760, 300], [{ t: 'IMMEDIATE', size: 150 }, { t: 'JEOPARDY', size: 150 }], { font: 'Bangers', ink: '#ffffff', tstroke: '#7a0c18', tlw: 10, spacing: 4, fill: 'rgba(206,30,48,.88)', stroke: '#ffffff', lw: 10, r: 26, pad: 26, rot: -.07, alpha: sl.a, id: 'jeo', text: { tilt: .2, crop: sl.k > 1.03, hero: true } });
  ctx.restore();
}
/*@@NEXT2@@*/
// ------------------------------------------------------------------ THE LAST SHOT: through the window, and a pull-back out of the conference room into the dollhouse (S14) at dusk
const T_OUT0 = 38.85, T_OUTX = 39.3, T_OUTZ = snapT(CUE.sting);
const outCam = lt => {
  if (!window.S14) return [560, 900, 1];
  const r = S14.rect('conf'), k = easeOut(c01((lt - T_OUTX) / (T_OUTZ - T_OUTX)));
  return mixA([r.cx, r.cy + 10, 3.1], [540, 850, 1.0], k);
};
function drawDollhouse(lt) {
  if (!window.S14) { ctx.fillStyle = '#2b2740'; ctx.fillRect(-200, -200, W + 400, H + 400); return; }
  V2.setLight({ key: [-.55, -.7], keyColor: '#ffd9a0', keyA: .3, rim: '#ff9a7a', rimA: .4, shadow: '#2a1d40', shadowA: .36, bounce: '#ffcf9a', bounceA: .14, amb: '#ffd8b0', ambA: .06 });
  const o = { t: lt, rooms: { station: { calls: callsAt(lt) } } };
  S14.back(lt, o);
  const fl = S14.rect('med').floor, rc = S14.rect('conf');
  /* the staff, seated at the conference table in its cell (small: the cell is 250 px wide), the Administrator at the head */
  const seated = [['lemon', A7.lemon, .12], ['mango', A7.mango, .29], ['clem', A10.clem, .46], ['straw', A11.straw, .63]], ss = S14.S * .55;
  const tr = lt < T_OUTZ + .02;
  for (const [id, ctor, u] of seated) { const [x, y] = S14.at('conf', u, -22); drawChar(ctor({ x, y, s: ss, noLegs: true, plant: true, t: lt, transit: tr, expr: id === 'straw' ? 'happy' : 'chill', lid: .25, look: [.1, .05], arms: { l: 'rest', r: 'rest' }, sparkle: id === 'straw' })); }
  const mx = S14.at('conf', .85, -22); drawChar(A9.melon({ x: mx[0], y: mx[1], s: ss * 1.2, noLegs: true, plant: true, t: lt, transit: tr, expr: 'weak', look: [-.4, .1], arms: { l: 'rest', r: 'rest' } }));
  /* the surveyor crosses the middle floor toward the call, the trainee trotting behind */
  const path = S14.move(39.3, 41.4, [S14.at('r4', .4)[0], fl], [S14.at('r7', .58)[0], fl], easeIO), path2 = S14.move(39.5, 41.5, [S14.at('r4', .06)[0], fl], [S14.at('r7', .2)[0], fl], easeIO);
  if (lt >= 39.3) {
    drawChar(S14.walk(A14.kumquat, path2, lt, { s: S14.S * .72, plant: true, t: lt, pose: 'carry', transit: tr }));
    drawChar(S14.walk(A14.stateman, path, lt, { s: S14.S, t: lt, pose: 'carry', expr: 'stateman_warm', transit: tr }));
  }
  S14.front(lt, o);
  { const k = sstep(lt, T_OUTX + .2, T_OUTX + .9); if (k > .01) { ctx.save(); for (let i = 0; i < 26; i++) { const x = 30 + hash(i * 2.7) * 1020, y = -240 + hash(i * 5.1 + 1) * 540, tw = .5 + .5 * Math.sin(lt * (1.5 + hash(i) * 2) + i); ctx.fillStyle = `rgba(255,246,220,${.75 * k * tw})`; ell(x, y, 2.2, 2.2); ctx.fill(); } ctx.restore(); } }
  /* the lit call-light dome over Room 7's door (set dressing: a red dome and its glow) */
  const d = S14.door('r7', 'l'), pl = .55 + .45 * Math.sin(lt * 9 + 1.2);
  if (d) { const dx = d.x + 38, dy = d.y0 - 10; ctx.fillStyle = '#f4f2ea'; rr(dx - 15, dy + 2, 30, 7, 3); ctx.fill(); ctx.fillStyle = mixColor('#7a1a22', '#ff3a44', pl); ctx.beginPath(); ctx.arc(dx, dy + 3, 12, PI, TAU); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(20,10,10,.8)'; ctx.lineWidth = 2; ctx.stroke(); V2.glow(dx, dy - 2, 70, '255,60,70', .7 * pl, 'screen', .9); }
}
const callsAt = lt => { const a = new Array(40).fill(0); a[13] = .55 + .45 * Math.sin(lt * 9 + 1.2) > .3 ? 1 : .6; return a; };
function drawOut(lt, sh) {
  if (lt < T_OUTX) {
    const u = easeIn(c01((lt - T_OUT0) / (T_OUTX - T_OUT0))), z = lerp(1.0, 3.6, u), cx = lerp(560, 190, u), cy = lerp(900, 600, u);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-cx, -cy);
    drawStageBody(lt, { pan: true, type: 'room' });
    ctx.restore();
  } else drawDollhouse(lt);
  const wash = lt < T_OUTX ? .95 * sstep(lt, T_OUT0 + .25, T_OUTX) : .95 * (1 - sstep(lt, T_OUTX, T_OUTX + .32));
  if (wash > .01) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,226,170,${wash})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}
// ------------------------------------------------------------------ the scene: camera, grade, motion blur, overlays
const shakeAt = lt => 12 * Math.exp(-Math.max(0, lt - T_TH) / .22) * (atTh(lt) ? 1 : 0) + 16 * Math.exp(-Math.max(0, lt - snapT(CUE.stamp2)) / .25) * (lt >= snapT(CUE.stamp2) ? 1 : 0) + 6 * Math.exp(-Math.max(0, lt - snapT(CUE.stamp1)) / .18) * (lt >= snapT(CUE.stamp1) ? 1 : 0) + 5 * Math.exp(-Math.max(0, lt - T_LAND) / .2) * (lt >= T_LAND ? 1 : 0);
function drawStage(lt, sh) {
  if (sh.type === 'form') { drawInsertBackdrop(lt, sh); drawForm(lt, sh.form === 1 ? 0 : 1); return; }
  if (sh.type === 'out') { drawOut(lt, sh); return; }
  drawStageBody(lt, sh);
}
/* the grade: warm afternoon; red under the beacon; a gold swell on NEW TAG; the light eases while they sit */
function fxAt(lt) {
  const bs = boardSt(lt), sw = Math.sin(bs.spin * 1.08), jeoK = sstep(lt, 18.9, 19.05) * (1 - sstep(lt, 20.1, 20.5)), red = bs.beacon * (.5 + .5 * sw) * (1 + 1.1 * jeoK), ts = lt - snapT(CUE.stamp2), gold = ts >= 0 ? Math.exp(-ts / .9) : 0, easeL = sstep(lt, 33.7, 35.4);
  const tint = [['#ffb36b', .08 * (1 - easeL) + .12 * easeL, 'soft-light']];
  if (red > .02) { tint.push(['#ff0a1e', Math.min(.9, .55 * red), 'soft-light']); tint.push(['#ff2a38', Math.min(.42, .2 * red), 'screen']); tint.push(['#3a0008', Math.min(.5, .22 * red + .12 * jeoK), 'multiply']); }
  if (gold > .02) { tint.push(['#ffd86a', .34 * gold, 'soft-light']); tint.push(['#fff2b0', .12 * gold, 'screen']); }
  const flash = ts >= 0 && ts < .13 ? 1 - ts / .13 : 0, dk = sstep(lt, T_OUTX, T_OUTX + .5), st = lt >= T_OUTZ ? Math.exp(-(lt - T_OUTZ) / .16) : 0;
  if (dk > .02) { tint.push(['#ff7a3a', .34 * dk, 'soft-light']); tint.push(['#6a3a9a', .26 * dk, 'soft-light']); tint.push(['#ff9a5a', .1 * dk, 'screen']); }
  return { bloom: .5 + .35 * gold + .3 * red + .12 * easeL + .2 * dk + .3 * st, vignette: .46 + .12 * red + .1 * dk, grain: .05, contrast: .16 + .1 * red, sat: .1 - .06 * red, tint, fade: Math.max(flash * .5, 1 - sstep(lt, 0, .3)), fadeColor: lt < .5 ? '0,0,0' : '255,248,220' };
}
const SCENE = {
  noScrim: false,
  shot: lt => shotAt(lt).id,
  cam(lt) {
    const sh = shotAt(lt), u = c01((lt - sh.t0) / Math.max(.001, sh.t1 - sh.t0)), [cx, cy, z] = (sh.cam || (() => [560, 840, .98]))(lt, u);
    zoomTo(cx + 1.6 * hn(lt, 1.1, 1) / z, cy + 1.2 * hn(lt, .9, 2) / z, z); CAM.shake = shakeAt(lt);
  },
  draw: guard('draw', lt => drawStage(lt, shotAt(lt)), () => { ctx.fillStyle = '#2b2740'; ctx.fillRect(0, 0, W, H); }),
  fx: lt => fxAt(lt),
  blur: lt => { const b = shotAt(lt).blur; return typeof b === 'function' ? b(lt) : (b || 1); },
  over: guard('over', lt => { overBong(lt); overJeopardy(lt); }),
};
window.__VERDICT_DBG = { ballAt, TV, CP, PLINK, START, T_LAND, T_REL, TOSS, T_APEX, HOP, snapT, DC, RB, RP, SQ, laneX, rowY, LANE_PATH };
window.__EP14_SCENES = window.__EP14_SCENES || {};
window.__EP14_SCENES.verdict = SCENE;
})();
