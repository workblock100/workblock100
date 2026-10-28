'use strict';
/* KIT STATUS: v1. Every room is drawn with its live parts and front layers; the building, roof (with the hero sign), sky and lot are in; the shower room has its glass front, door, tape, sign, sock and stash; the
 * med room its lit fridge with 18 pens. Still to land, each saved as it arrives: the State's car (o.car, o.carDoor), the alert pulses and chat bubbles (o.rooms[id].alert, .bubble), room name plates, polish.
 * The geometry and every name below are final.
 * SHIFT HAPPENS, Episode 14: the dollhouse kit, window.S14. The building at Fruit Bowl Rehab & Nursing as a cutaway: a dollhouse seen straight on, one room per cell, every room lit
 * and furnished on its own. Shared by the colony, adapt, tracer and closet scenes (and the title and end card if they want the building).
 *
 * THE GEOMETRY BELOW IS FINAL AND NEVER CHANGES (scene modules are written against these numbers).
 *
 * The world is the 1080x1920 scene space (zoom 1). The building box is x 10..1070, y 340..1342. Three rows, four columns of rooms (the station is two columns wide):
 *
 *          col 0        col 1        col 2        col 3
 *   row 0  OFFICE       CONFERENCE   BREAK ROOM   ROOM 14          (top floor; the roof and the sign sit above it)
 *   row 1  MED ROOM     ROOM 4       ROOM 7       SHOWER ROOM      (the middle floor: the tracer runs left to right along it)
 *   row 2  LOBBY        NURSES' STATION (double)  DINING ROOM      (ground floor; the lot, the road and the State's car are below it)
 *
 * ids: office conf rest r14 med r4 r7 shower lobby station dining.   Room interiors are 250 x 318 (the station 512 x 318); walls and floor slabs are 12 px thick.
 * Every room has a floor line (feet go here), a ceiling, a back wall and a lamp. Between two neighbours in a row the wall has an arched opening at floor level (S14.door).
 * Each room is a shallow one-point-perspective box: the back wall is inset 22 px at the sides, 20 at the top and 48 at the bottom, so the floor is a trapezoid 48 px deep; the feet (the floor line)
 * stand 34 px in front of the wall's foot, furniture against the wall stands about 12 px out from it. Characters are drawn BETWEEN S14.back and S14.front.
 *
 * API (all coordinates are world / scene coordinates):
 *   S14.rect(id)             -> { id, col, row, span, x0, y0, x1, y1, w, h, cx, cy, floor }   room interior (floor = the y of the feet, 14 px above y1)
 *   S14.at(id, u, dy = 0)    -> [x, y]       a standing spot: u 0..1 across the room (0 left wall, 1 right wall), y = floor + dy
 *   S14.door(id, side)       -> { x, y0, y1, w } the arch in the wall to the 'l' or 'r' of the room (x = the wall's centre line; null on the building's outer walls)
 *   S14.S                    the scale of a standing adult inside a room (0.44: about 160 px tall); children and trainees are smaller
 *   S14.LOT                  the lot's numbers: { y0 (the plinth), curb, asphalt, bayY0, bayY1, bays: [[x0, x1], [x0, x1]], lane (the car's wheels when it is on the lane), dash }
 *   S14.who(id, ctor, u, extra) -> the drawChar options for ctor placed in a room: Object.assign({ x, y: floor, s: S14.S }, extra) passed through ctor
 *   S14.zoomRoom(id, z, dy = 0)  aims the camera at a room (zoomTo(cx, cy + dy, z)); z 3.4 fits a 250 px room across the frame, z 1 shows the whole building
 *   S14.back(lt, o)          draws the sky, roof, lot, car and every room as it is behind the characters. o: { t (the animation clock, default lt), rooms: { id: {...} }, only: [ids], noSky, noLot, noRoof, noCar, car, carDoor, carLeaf, lotSign, plates }
 *                            Rooms and scenery the camera cannot see are skipped. Call V2.setLight (or your own light) BEFORE S14.back: the rooms add their lamps as V2 lights for the characters.
 *   o.car = { x, k, door } (or a number x): the State's white sedan on the lot (x its centre, k 0 on the lane .. 1 pulled into the Administrator's reserved bay, door 0..1 the driver's door; o.carDoor overrides door).
 *                            o.carLeaf = 'front' leaves the open door leaf to S14.front, so a person stepping out of the car is drawn between the car and its door. S14.carGeom(car) -> { x, y, s, k, door, exit: [x, y] }.
 *                            o.lotSign: the RESERVED / ADMINISTRATOR sign is drawn only while the camera is aimed at the lot (camera y > 1380) unless you force it with true / false. o.plates false hides the room name plates.
 *   S14.front(lt, o)         draws what sits in front of the characters (counter fronts, desks, tables, blankets, armchair arms, bubbles). Call it after the characters; same o as back.
 *   S14.GEOM                 the numbers: { T, RW, RH, X0, Y0, COL, ROW }
 *   S14.walk(ctor, pathFn, lt, extra)       a walker: the drawChar options of ctor at pathFn(lt) = [x, y] in WORLD (scene) coordinates (y = the floor line, S14.rect(id).floor; s defaults to S14.S).
 *                                           Same contract as H6.person (ep6.js): speed from a centred difference, then gaitW (distance walked, in the character's LOCAL units = scene px / s, so
 *                                           the planted foot does not slide at the dollhouse scale), axis 'x', dir = sign(vx), vx = on-screen px/s; the footstep tool (render.js events) sees them.
 *   S14.run(ctor, pathFn, lt, extra, rate = 300)   a runner, like H6.runner: legs cycle at gaitW = lt * rate whatever the speed; vx clamped to +-1400.
 *   S14.move(t0, t1, a, b, ease = easeIO)   a pathFn gliding from [x, y] a to b (H6.move)
 *
 * Per-room options, o.rooms[id] = { ... } (every one optional; pass the same o to S14.back and S14.front):
 *   any room   lamp 0..1 (the ceiling light's strength; default 1, the locked break room 'rest' defaults to .6), flicker 0..1 (the lamp stutters),
 *              alert 0..1 (the alarm call: a yellow wash and rim on the room, a ring from alertAt [x, y] (room coordinates, default the middle), a phone buzzing at phoneAt [x, y] (default top right);
 *              1 at the buzz, falling to 0 as the ring expands), bubble 'text' | { t, k (the pop 0..1, 1 = settled), dx, dy, at ('top' default, inside the room's top | 'above', entirely above the room | 'bottom'), tail (x of the tail in room coordinates) }:
 *              a blue chat bubble inside the top of the room; its text is 32 px at zoom 1 and about 34 px at any zoom above that (the bubble scales down as the camera comes in), and it is kept whole inside the safe frame.
 *   office     desk (false leaves the Administrator's desk out of S14.front). He sits behind it: noLegs, x = x0 + 150, y = floor - 42; the desk top is at y0 + 226.
 *   r4         peel 0..1 (the banana peel decal on the floor, default 1 = shown; 0 hides it. The tracer draws its own peel: pass peel: 0).
 *   r7         the ARMCHAIR is fixed: its centre is x = rect('r7').x0 + 80 (= 626), the cushion's top is 50 px above the floor line (y = floor - 50). Seat Mrs. Cranberry with noLegs at
 *              x0 + 80, y = floor - 50: the chair back and wings are in S14.back, the cushion and both arms in S14.front, so she tucks in.
 *   r14        the blanket and the bed rail are in S14.front (a resident sits up in the bed: noLegs, x about x0 + 168, y about floor - 58).
 *   med        cart 0..1 (default 0: NO cart is drawn, so the tracer's own cart is the only one; 1 parks the kit's cart at x0 + 112), cartDrawer 0..1;
 *              fridge 0..1 (how far the glass door of the med fridge is open, default 0), pens 0..1 (the share of the 18 insulin pens whose open-date label is fresh, default .25: the rest still
 *              carry old, scribbled labels). S14.penSlots(pens) -> [{ i, row, col, x, y (foot), fresh }] in world coordinates, S14.fridge() -> { x0, y0, x1, y1 }.
 *              S14.cart(x, floorY, o) draws a med cart anywhere (o: s scale, drawer 0..1, color, accent).
 *   shower     stash 0..4 (default 2; 0 empty, 1 a few items, 2 half full, 3 full, 4 packed to the ceiling; fractional values bring items in one by one with a little pop),
 *              bulge 0..1 (the door bows, its panels crack, the tape strains and frays, the glass cracks, dust leaks at the edges; the door shakes a pixel or so when bulge > .45),
 *              door 0..1 (0 shut, 1 swung wide toward the camera; the tape snaps the moment it starts to move), junk(t, rect, items) (a hook called in WORLD coordinates after the stash is drawn and
 *              before the glass and the door, with S14.stashItems(stash): the closet's avalanche draws its falling pieces from here).
 *              THE DOOR (all of it, with the OUT OF ORDER tape, the DO NOT OPEN sign and the sock, is drawn in S14.back, behind the characters; nothing of the shower room is in S14.front):
 *                S14.showerDoor(st) -> { x0, y0, x1, y1 (the closed leaf: 88 wide, 198 tall, x 890..978, y 790..988), knob: [x, y] (the brass knob on the LEFT edge, about [901, 896] when shut; it follows the leaf as it swings),
 *                hinge: 'r', knobSide: 'l', cx, floor, w, h, open, bulge, tape: [[y0, y1], [y0, y1]] (the two strips, y 824..840 and 908..924), sign: [x, y, w, h] (DO NOT OPEN, [906, 794, 56, 28]), sock: [x, y] }
 *                st is the same object as o.rooms.shower ({ door, bulge }). A character standing to the left of the door reaches the knob; the sign is above the heads (y 794..822).
 *              The room is a glass-fronted closet: a steel-framed glass front (cracks at bulge) with the brown-framed door set in it; the stash is seen through the glass.
 *              S14.stashItems(level) -> [{ id, kind, x, y (the base), w, h, rot, z, at, o }] in world coordinates (what the room shows at that level), S14.drawItem(kind, x, y, s, rot, o) draws one sprite
 *              (kinds in S14.itemKinds: box wheelchair ivpole fan tree tv bucket rail banner qsign bag; x, y = the bottom centre).
 *   station    calls [0..1 x 40] (the call-light domes, row by row, 8 per row; 1 = lit and pulsing, a fraction = a steady glow), qHours (the number on the Q sign, default 41), qFlicker 0..1, time 'H:MM'
 *              (the wall clock; default: the scene's clock string, so it ticks with the pill), counter (false leaves the counter out of S14.front). The staff stand behind the counter at y = floor; the
 *              counter hides everything below y0 + 252 (their legs and bellies), heads and shoulders show above it; to hide a whole character (the meerkats crouching) push it down with S14.at('station', u, +70).
 *   lobby      desk (false leaves the front desk out of S14.front); Mango stands behind it at u .72. car 0..1: the white sedan seen through the glass doors, rolling in from the left.
 *   dining     table (false leaves the table out of S14.front); residents sit behind it (noLegs, y about floor - 38).
 * Text in the kit goes through the UI kit: dressing (wall charts, calendars, plates) is hero:false + crop:true; a sign that is big enough on screen, whole and clear of the clock pill and the
 * captions is automatically held to the hero rules (so a character in front of it is reported by the gate). No text is ever drawn into a cache.
 */
(() => {
if (!window.TIMELINE_EP14) return;
const T = 12, RW = 250, RH = 318, X0 = 10, Y0 = 340;
const COL = [22, 284, 546, 808], ROW = [352, 682, 1012];
const DEF = {
  office: [0, 0, 1], conf: [1, 0, 1], rest: [2, 0, 1], r14: [3, 0, 1],
  med: [0, 1, 1], r4: [1, 1, 1], r7: [2, 1, 1], shower: [3, 1, 1],
  lobby: [0, 2, 1], station: [1, 2, 2], dining: [3, 2, 1],
};
const NAMES = { office: 'ADMINISTRATOR', conf: 'CONFERENCE', rest: 'BREAK ROOM', r14: 'ROOM 14', med: 'MED ROOM', r4: 'ROOM 4', r7: 'ROOM 7', shower: 'SHOWER ROOM', lobby: 'LOBBY', station: "NURSES' STATION", dining: 'DINING ROOM' };
const COLORS = { office: '#c9a77a', conf: '#8fa7c9', rest: '#9fbf9a', r14: '#c9a0b8', med: '#a8d0c8', r4: '#e8d58a', r7: '#e8a8a0', shower: '#9ab8d6', lobby: '#d6c2a0', station: '#cfd8a8', dining: '#e0b88a' };

const S14 = window.S14 = {};
S14.GEOM = { T, RW, RH, X0, Y0, COL, ROW };
S14.S = 0.44;
S14.ids = Object.keys(DEF);
S14.names = NAMES;
S14.rect = id => {
  const d = DEF[id]; if (!d) throw new Error('S14.rect: unknown room ' + id);
  const [col, row, span] = d, x0 = COL[col], y0 = ROW[row], w = span === 2 ? 2 * RW + T : RW, h = RH;
  return { id, col, row, span, x0, y0, x1: x0 + w, y1: y0 + h, w, h, cx: x0 + w / 2, cy: y0 + h / 2, floor: y0 + h - 14 };
};
S14.at = (id, u, dy = 0) => { const r = S14.rect(id); return [r.x0 + u * r.w, r.floor + dy]; };
S14.door = (id, side) => {
  const r = S14.rect(id);
  if (side === 'l') { if (r.col === 0) return null; return { x: r.x0 - T / 2, y0: r.floor - 190, y1: r.floor, w: 150 }; }
  const endCol = r.col + r.span - 1; if (endCol === 3) return null;
  return { x: r.x1 + T / 2, y0: r.floor - 190, y1: r.floor, w: 150 };
};
S14.who = (id, ctor, u, extra = {}) => { const [x, y] = S14.at(id, u); return ctor(Object.assign({ x, y, s: S14.S }, extra)); };
S14.zoomRoom = (id, z, dy = 0) => { const r = S14.rect(id); window.H6.zoomTo(r.cx, r.cy + dy, z); };

/* ---- walkers and runners in WORLD (scene) coordinates (added at the lead's request; the same contract as H6.person / H6.runner in ep6.js, so the footstep tool (render.js events) sees them) */
/* the distance walked along fn(t) -> [x, y], integrated from t = 0 (copied from ep6.js pathDist) */
const pathDist = (fn, lt) => { let d = 0, p = fn(0); for (let t = .04; ; t += .04) { const tt = Math.min(t, lt), q = fn(tt); d += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; if (tt >= lt) break; } return d; };
S14.walk = (ctor, fn, lt, extra = {}) => {
  const [X, Y] = fn(lt), s = (extra && extra.s) || S14.S, dt = .03, a = fn(lt - dt), b = fn(lt + dt);
  const vX = (b[0] - a[0]) / (2 * dt), vY = (b[1] - a[1]) / (2 * dt), speed = Math.hypot(vX, vY) / s;
  const o = Object.assign({ x: X, y: Y, s }, extra);
  if (speed > 9) { o.gaitW = pathDist(fn, lt) / s; o.axis = 'x'; o.dir = Math.sign(vX) || 1; o.vx = vX; }
  return ctor(o);
};
S14.run = (ctor, fn, lt, extra = {}, rate = 300) => {
  const [X, Y] = fn(lt), s = (extra && extra.s) || S14.S, dt = .03, a = fn(lt - dt), b = fn(lt + dt);
  const vX = (b[0] - a[0]) / (2 * dt), vY = (b[1] - a[1]) / (2 * dt), sp = Math.hypot(vX, vY) / s;
  const o = Object.assign({ x: X, y: Y, s }, extra);
  if (sp > 30) { o.gaitW = lt * rate; o.axis = 'x'; o.dir = Math.sign(vX) || 1; o.vx = Math.max(-1400, Math.min(1400, vX)); }
  return ctor(o);
};
S14.move = (t0, t1, a, b, ease = easeIO) => (window.H6 && window.H6.move ? window.H6.move(t0, t1, a, b, ease) : lt => [lerp(a[0], b[0], ease(seg(lt, t0, t1))), lerp(a[1], b[1], ease(seg(lt, t0, t1)))]);

// ================================================================================================ small helpers
const clamp01 = v => Math.max(0, Math.min(1, v));
const parse = c => { c = String(c).replace('#', ''); if (c.length === 3) c = c.replace(/./g, '$&$&'); const n = parseInt(c, 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hexOf = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (c, f) => hexOf(parse(c).map(v => v * f));                       /* multiply: f < 1 darkens */
const lift = (c, t) => hexOf(parse(c).map(v => v + (255 - v) * t));            /* toward white */
const mixc = (a, b, t) => { const A = parse(a), B2 = parse(b); return hexOf(A.map((v, i) => v + (B2[i] - v) * t)); };
const rgba = (c, a) => { const [r, g, b] = parse(c); return `rgba(${r},${g},${b},${a})`; };
const rnd = (seed) => { let a = (seed * 2654435761) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const OUT = 'rgba(38,24,40,.78)';

function withCtx(g, fn) { const prev = ctx; ctx = g; try { fn(); } finally { ctx = prev; } }
const warned = new Set();
function guard(name, fn) { try { fn(); } catch (e) { if (!warned.has(name + e.message)) { warned.add(name + e.message); console.error('S14 ' + name + ': ' + (e && e.stack || e)); } } }

// what part of the world the camera can see (rooms and props outside it are not drawn)
function view(m = 80) {
  const z = CAM && CAM.z || 1, k = CAM && Math.abs(CAM.r || 0) > .002 ? 1.6 : 1, hw = W / 2 / z * k + m, hh = H / 2 / z * k + m, cx = CAM ? CAM.x : W / 2, cy = CAM ? CAM.y : H / 2;
  return { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
}
const seen = (v, x0, y0, x1, y1) => x1 > v.x0 && x0 < v.x1 && y1 > v.y0 && y0 < v.y1;

// ------------------------------------------------------------------------------------------------ drawing primitives (room-local or world: they just use the current ctx)
function path(pts) { ctx.beginPath(); for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); ctx.closePath(); }
function poly(pts, fill, stroke, lw = 2) {
  path(pts);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function vg(y0, y1, c0, c1, c2) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); if (c2) { g.addColorStop(.5, c1); g.addColorStop(1, c2); } else g.addColorStop(1, c1); return g; }
function hg(x0, x1, c0, c1) { const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
function rg(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }
function ln(x0, y0, x1, y1, stroke, lw = 1.5, cap = 'round') { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function ell(x, y, rx, ry, fill, stroke, lw = 1.6, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
/* a friendly body: rounded rectangle, light on top, a little darker below, a dark outline and a highlight along its top edge */
function rb(x, y, w, h, fill, o = {}) {
  const r = o.r ?? 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = o.flat ? fill : vg(y, y + h, lift(fill, .13), shade(fill, .87)); ctx.fill();
  if (o.lw !== 0) { ctx.lineWidth = o.lw ?? 1.8; ctx.strokeStyle = o.stroke ?? OUT; ctx.lineJoin = 'round'; ctx.stroke(); }
  if (!o.flat && !o.nohi && h > 8 && w > 8) { ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + r + 1, y + 2.4); ctx.lineTo(x + w - r - 1, y + 2.4); ctx.stroke(); }
}
/* a soft contact shadow on the floor */
function fsh(x, y, w, a = .3, h = 7) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, h / Math.max(1, w / 2));
  ctx.fillStyle = rg(0, 0, 0, w / 2, [[0, `rgba(25,14,30,${a})`], [.6, `rgba(25,14,30,${a * .5})`], [1, 'rgba(25,14,30,0)']]);
  ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, TAU); ctx.fill(); ctx.restore();
}
/* an ambient-occlusion smudge: a soft dark rectangle edge (used where furniture meets a wall) */
function ao(x, y, w, h, a = .22) { ctx.fillStyle = rg(x + w / 2, y + h / 2, 0, Math.max(w, h) / 2, [[0, `rgba(25,14,30,${a})`], [1, 'rgba(25,14,30,0)']]); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillRect(x - w, y - h, w * 3, h * 3); ctx.restore(); }
/* repeat-patterns on a wall (the caller clips) */
function stripesV(x0, y0, x1, y1, step, lw, col, off = 0) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; for (let x = x0 + off; x < x1; x += step) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); } }
function dotsGrid(x0, y0, x1, y1, step, r, col, stagger = true) { ctx.fillStyle = col; let row = 0; for (let y = y0; y < y1; y += step * .86, row++) for (let x = x0 + (stagger && row % 2 ? step / 2 : 0); x < x1; x += step) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); } }
function tileGrid(x0, y0, x1, y1, tw, th, grout, lw = 1.2, brick = false) { ctx.strokeStyle = grout; ctx.lineWidth = lw; let row = 0; for (let y = y0; y <= y1 + .1; y += th, row++) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); for (let x = x0 + (brick && row % 2 ? tw / 2 : 0); x <= x1; x += tw) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + th); ctx.stroke(); } } }
/* a five-pointed star */
function star(cx, cy, R, r, fill, stroke, lw = 1, rot = -PI / 2) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = rot + i * PI / 5, q = i % 2 ? r : R; i ? ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : ctx.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); } }

// ------------------------------------------------------------------------------------------------ text: everything goes through the UI kit; dressing is hero:false + crop:true unless it is big, whole and clear of the pill and the captions
const scrFrame = () => { const S = EP && EP.SCENES && CUR ? EP.SCENES[CUR.id] || {} : {}; return S; };
/* the screen box of a local rectangle under the current transform */
function screenOf(x0, y0, x1, y1) {
  const m = ctx.getTransform(); let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) { const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f; a = Math.min(a, X); b = Math.min(b, Y); c = Math.max(c, X); d = Math.max(d, Y); }
  return { x0: a, y0: b, x1: c, y1: d, sc: Math.hypot(m.a, m.b) };
}
/* hero when it is readable (30 px and up on screen), entirely inside the safe frame and clear of the caption zone and the clock pill; otherwise set dressing that may be cut by the frame */
function heroNow(x0, y0, x1, y1, sizePx) {
  const b = screenOf(x0, y0, x1, y1), S = scrFrame();
  if (sizePx * b.sc < 31) return false;
  if (b.x0 < 44 || b.y0 < 44 || b.x1 > W - 44 || b.y1 > H - 44) return false;
  if (!S.noScrim && b.y1 > 1374 && b.y0 < 1706) return false;
  if (!S.noChyron && b.x1 > 44 && b.x0 < 506 && b.y1 > 110 && b.y0 < 250) return false;
  return true;
}
/* The gate lets set dressing be cut by the frame, run under the captions or the clock pill and hide behind things (crop: true), but a viewer still reads a half-sliced word at the frame edge,
 * or a menu board running through the caption words, as broken text. So dressing lettering (and a dressing sign as a whole) fades out before it reaches the frame edge, the caption zone
 * or the clock pill: the room art stays, the lettering goes. Returns 0..1 for the screen box of a local rectangle: 1 while the box keeps the hero margins (44 px from the edge, clear of
 * the caption zone and the pill), falling to 0 over 40 px of intrusion. */
function dressGuard(x0, y0, x1, y1) {
  const b = screenOf(x0, y0, x1, y1), S = scrFrame();
  let d = Math.min(b.x0 - 44, b.y0 - 44, W - 44 - b.x1, H - 44 - b.y1);
  if (!S.noScrim) d = Math.min(d, Math.max(1374 - b.y1, b.y0 - 1706));
  if (!S.noChyron) d = Math.min(d, Math.max(44 - b.x1, b.x0 - 506, 110 - b.y1, b.y0 - 250));
  return d >= 0 ? 1 : clamp01(1 + d / 40);
}
/* dressing text: a centred label that never complains; the room's wall charts, calendars, name plates */
function dress(str, cx, cy, size, o = {}) {
  const w = Math.min(o.maxW || 1e9, UI.sizeOf(str, { size, weight: o.weight, spacing: o.spacing, font: o.font, italic: o.italic }).w), hw = o.align === 'left' ? [0, w] : o.align === 'right' ? [-w, 0] : [-w / 2, w / 2];
  const a = dressGuard(cx + hw[0], cy - size * .6, cx + hw[1], cy + size * .6);
  if (a < .02) return;
  if (a < 1) { ctx.save(); ctx.globalAlpha *= a; }
  UI.label(str, cx, cy, Object.assign({ size, hero: false, crop: true, fill: '#2a2230' }, o));
  if (a < 1) ctx.restore();
}
/* a sign or plate with centred text, as dressing unless it is hero-sized and whole (then the gate holds it to the full rules); a dressing sign fades out as a whole near the edge, the captions and the pill */
function plate(box, lines, o = {}) {
  const [x, y, w, h] = box, size = o.size ?? 20, hero = o.hero !== false && heroNow(x, y, x + w, y + h, o.heroSize ?? size);
  const a = hero || o.guard === false ? 1 : dressGuard(x, y, x + w, y + h);
  if (a < .02) return null;
  if (a < 1) { ctx.save(); ctx.globalAlpha *= a; }
  const r = UI.sign(box, lines, Object.assign({ fill: '#f2e8cf', ink: '#2a2230', stroke: '#2a2230', lw: 2, size, hero, crop: !hero }, o, { hero, crop: !hero }));
  if (a < 1) ctx.restore();
  return r;
}

// ================================================================================================ the room box: a shallow one-point perspective (back wall, two side walls, ceiling, floor)
const BX = 22, BT = 20, BB = 48;            /* the back wall is inset 22 px at the sides, 20 at the top, 48 at the bottom: the feet (floor line, 14 px above the room's bottom) stand 34 px in front of the wall's foot */
const FY = 282;                              /* the front edge of furniture that stands against the back wall */
const BASE_Y = RH - BB;                      /* the foot of the back wall in room coordinates (270) */
function boxOf(w, h) { return { bx0: BX, bx1: w - BX, by0: BT, by1: h - BB, w, h, cx: w / 2 }; }

/* floors: wood planks, checker tiles, carpet, terrazzo, all in perspective (seams converge on the middle of the back wall) */
function floorFill(b, F) {
  const { w, h, bx0, bx1, by1 } = b, k = (bx1 - bx0) / w, cx = w / 2;
  ctx.save(); path([[0, h], [w, h], [bx1, by1], [bx0, by1]]); ctx.clip();
  ctx.fillStyle = vg(by1, h, shade(F.a, .9), lift(F.a, .06)); ctx.fillRect(0, by1 - 2, w, h - by1 + 4);
  const xb = x => cx + (x - cx) * k;                                              /* the back-edge x of a seam that starts at x on the front edge */
  if (F.kind === 'planks') {
    const pw = F.pw ?? 26, r = rnd(F.seed ?? 5);
    for (let x = -pw * 2, i = 0; x < w + pw * 2; x += pw, i++) {
      const t = r(); ctx.fillStyle = rgba(t > .5 ? '#000' : '#fff', .035 + .05 * Math.abs(t - .5));
      path([[x, h], [x + pw, h], [xb(x + pw), by1], [xb(x), by1]]); ctx.fill();
      ln(x, h, xb(x), by1, rgba(F.seam ?? shade(F.a, .6), .55), 1.2);
      for (let j = 0; j < 2; j++) { const z = r(), v = by1 + (h - by1) * z, xl = lerp(xb(x), x, z), xr = lerp(xb(x + pw), x + pw, z); ln(xl, v, xr, v, rgba(F.seam ?? shade(F.a, .6), .35), 1); }
    }
  } else if (F.kind === 'checker' || F.kind === 'tile') {
    const n = F.n ?? 8, rows = F.rows ?? 4, A = F.a, B2 = F.b ?? shade(F.a, .88), tw = w / n;
    for (let j = 0; j < rows; j++) {
      const z0 = Math.pow(j / rows, 1.45), z1 = Math.pow((j + 1) / rows, 1.45), v0 = by1 + (h - by1) * z0, v1 = by1 + (h - by1) * z1;
      for (let i = -1; i <= n; i++) {
        const xa = i * tw, xc = (i + 1) * tw;
        path([[lerp(xb(xa), xa, z0), v0], [lerp(xb(xc), xc, z0), v0], [lerp(xb(xc), xc, z1), v1], [lerp(xb(xa), xa, z1), v1]]);
        ctx.fillStyle = (i + j) % 2 ? B2 : A; ctx.fill();
        if (F.grout) { ctx.strokeStyle = F.grout; ctx.lineWidth = 1; ctx.stroke(); }
      }
    }
  } else if (F.kind === 'carpet') {
    const r = rnd(F.seed ?? 9);
    ctx.fillStyle = rgba('#000', .05); for (let i = 0; i < 260; i++) { const x = r() * w, v = by1 + r() * (h - by1); ctx.fillRect(x, v, 2, 1.2); }
    ctx.fillStyle = rgba('#fff', .06); for (let i = 0; i < 220; i++) { const x = r() * w, v = by1 + r() * (h - by1); ctx.fillRect(x, v, 2, 1.2); }
  } else if (F.kind === 'terrazzo') {
    const r = rnd(F.seed ?? 3), cols = F.flecks ?? ['#f6efe0', '#b9a98a', '#8c7f6a', '#d9cbb0'];
    for (let i = 0; i < 300; i++) { const z = Math.pow(r(), .8), v = by1 + (h - by1) * z, x = r() * w; ctx.fillStyle = cols[(r() * cols.length) | 0]; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(x, v, 2 + r() * 2.4, (1 + r()) * .7 + z, 0, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  /* the floor catches the back wall's shade at the foot and a soft light toward the front */
  ctx.fillStyle = vg(by1, by1 + 22, 'rgba(25,14,30,.28)', 'rgba(25,14,30,0)'); ctx.fillRect(0, by1, w, 22);
  ctx.fillStyle = vg(h - 16, h, 'rgba(25,14,30,0)', 'rgba(25,14,30,.18)'); ctx.fillRect(0, h - 16, w, 16);
  ctx.restore();
}

/* the shell of one room. P: { wall, side, ceil, base, trim, floor: {kind, a, b...}, wains: {h, color, rail, panels}, crown } */
function roomBox(w, h, P) {
  const b = boxOf(w, h), { bx0, bx1, by0, by1, cx } = b;
  ctx.fillStyle = P.ceil; ctx.fillRect(0, 0, w, h);
  /* back wall */
  ctx.fillStyle = vg(by0, by1, lift(P.wall, .07), shade(P.wall, .9)); ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
  /* side walls: they face each other across the room, away from the lamp: darker, a little lighter toward the back corner */
  for (const side of [-1, 1]) {
    const xf = side < 0 ? 0 : w, xbk = side < 0 ? bx0 : bx1;
    const g = ctx.createLinearGradient(xf, 0, xbk, 0); g.addColorStop(0, shade(P.side ?? P.wall, .72)); g.addColorStop(1, shade(P.side ?? P.wall, .96));
    poly([[xf, 0], [xbk, by0], [xbk, by1], [xf, h]], g);
  }
  /* ceiling */
  poly([[0, 0], [w, 0], [bx1, by0], [bx0, by0]], vg(0, by0, shade(P.ceil, .9), lift(P.ceil, .12)));
  /* floor */
  floorFill(b, P.floor);
  /* wainscot: panels on the back wall, a trapezoid on each side wall */
  if (P.wains) {
    const W2 = P.wains, top = by1 - W2.h;
    ctx.fillStyle = vg(top, by1, lift(W2.color, .06), shade(W2.color, .85)); ctx.fillRect(bx0, top, bx1 - bx0, W2.h);
    for (const side of [-1, 1]) { const xf = side < 0 ? 0 : w, xbk = side < 0 ? bx0 : bx1, tf = h - W2.h * h / (by1 - by0); poly([[xf, tf], [xbk, top], [xbk, by1], [xf, h]], side < 0 ? hg(0, bx0, shade(W2.color, .62), shade(W2.color, .84)) : hg(bx1, w, shade(W2.color, .84), shade(W2.color, .62))); }
    if (W2.panels !== false) { const n = W2.panels ?? 4, pw = (bx1 - bx0 - 12) / n; for (let i = 0; i < n; i++) { const px = bx0 + 6 + i * pw; ctx.strokeStyle = rgba(shade(W2.color, .55), .8); ctx.lineWidth = 1.6; ctx.strokeRect(px + 5, top + 12, pw - 10, W2.h - 24); ctx.strokeStyle = rgba(lift(W2.color, .35), .35); ctx.lineWidth = 1; ctx.strokeRect(px + 6.5, top + 13.5, pw - 13, W2.h - 27); } }
    ctx.fillStyle = W2.rail ?? lift(W2.color, .3); ctx.fillRect(bx0, top - 3, bx1 - bx0, 5); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(bx0, top + 2, bx1 - bx0, 3); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(bx0, top - 3, bx1 - bx0, 1.4);
  }
  /* skirting board: along the foot of the back wall and up the side walls */
  ctx.fillStyle = P.base; ctx.fillRect(bx0, by1 - 9, bx1 - bx0, 9); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(bx0, by1 - 9, bx1 - bx0, 1.4);
  poly([[0, h - 14], [0, h], [bx0, by1], [bx0, by1 - 9]], shade(P.base, .8)); poly([[w, h - 14], [w, h], [bx1, by1], [bx1, by1 - 9]], shade(P.base, .8));
  /* crown moulding and the corners where the walls meet (soft shade) */
  ctx.fillStyle = P.trim ?? lift(P.ceil, .2); ctx.fillRect(bx0, by0, bx1 - bx0, 6); ctx.fillStyle = 'rgba(25,14,30,.22)'; ctx.fillRect(bx0, by0 + 6, bx1 - bx0, 5); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(bx0, by0, bx1 - bx0, 1.3);
  for (const x of [bx0, bx1]) { ctx.fillStyle = vg(by0, by1, 'rgba(25,14,30,.22)', 'rgba(25,14,30,.10)'); ctx.fillRect(x - (x === bx0 ? 0 : 7), by0, 7, by1 - by0); }
  return b;
}
/* a final per-room vignette and the slab's shadow on the ceiling edge (call last, in the cache) */
function roomFinish(w, h, tone = .34) {
  ctx.save();
  ctx.fillStyle = rg(w / 2, h * .42, h * .22, Math.max(w * .62, h * .78), [[0, 'rgba(25,14,30,0)'], [1, `rgba(25,14,30,${tone})`]]); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = vg(0, 26, 'rgba(20,10,26,.34)', 'rgba(20,10,26,0)'); ctx.fillRect(0, 0, w, 26);
  ctx.restore();
}

// ================================================================================================ fixtures: ceiling lamps, windows, frames, plants
/* the lamp fixture (off); the live light is added on top by lampLive(). kinds: dome, panel, tube, bowl */
const LAMPS = {};
function lampDraw(x, y, kind = 'dome', col = '#fff3d2') {
  if (kind === 'panel') { rb(x - 34, y - 3, 68, 9, '#e8e6e0', { r: 3, lw: 1.5 }); ctx.fillStyle = col; ctx.fillRect(x - 31, y - 1.5, 62, 4.5); }
  else if (kind === 'tube') { rb(x - 46, y - 2, 92, 8, '#dcdad4', { r: 4, lw: 1.5 }); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 42, y - .5, 84, 4.5, 2); ctx.fill(); }
  else if (kind === 'bowl') { ln(x, 0, x, y - 12, 'rgba(40,28,40,.8)', 1.8); ctx.beginPath(); ctx.moveTo(x - 26, y - 8); ctx.quadraticCurveTo(x, y + 20, x + 26, y - 8); ctx.closePath(); ctx.fillStyle = vg(y - 8, y + 10, '#f4ead0', '#c9b98e'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke(); ell(x, y - 8, 26, 4, '#fff6dc', OUT, 1.4); }
  else { ctx.beginPath(); ctx.ellipse(x, y, 24, 7, 0, 0, TAU); ctx.fillStyle = vg(y - 7, y + 7, '#f7f2e4', '#c8c0aa'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); ell(x, y + 1, 15, 4.2, col, 'rgba(60,40,20,.35)', 1); }
}
/* the live light of a lamp: a warm glow at the fixture and a soft cone down to the floor (screen blend, bloom). x, y are world coordinates */
function lampLive(x, y, floorY, lamp, o = {}) {
  if (lamp <= 0) return;
  const col = o.color ?? '255,226,170', wTop = o.w0 ?? 40, wBot = o.w1 ?? 230;
  V2.beam(x, y + 4, x, floorY, wTop, wBot, col, .17 * lamp);
  V2.glow(x, y + 3, o.r ?? 120, col, .62 * lamp, 'screen', .45);
}

/* a window: frame, sky (with a cloud or two and an optional tree or hills), mullions, sill, curtains. Cached art (no text) */
function windowDraw(x, y, w, h, o = {}) {
  const fr = o.frame ?? '#f4ecda', gl = o.glass ?? ['#7db8ea', '#d9eefa'];
  rb(x - 5, y - 5, w + 10, h + 10, fr, { r: 4, lw: 1.8 });
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = vg(y, y + h, gl[0], gl[1]); ctx.fillRect(x, y, w, h);
  const r = rnd(o.seed ?? 4);
  ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 2; i++) { const cx = x + w * (.2 + .55 * r()), cy = y + h * (.15 + .25 * r()); ell(cx, cy, 14 + 8 * r(), 5 + 2 * r(), 'rgba(255,255,255,.85)'); ell(cx + 9, cy - 3, 10, 5, 'rgba(255,255,255,.85)'); }
  if (o.view === 'tree') { ln(x + w * .72, y + h, x + w * .72, y + h * .55, '#6a4a2e', 5); ell(x + w * .72, y + h * .42, w * .28, h * .26, '#5fae5f', 'rgba(20,70,30,.5)', 1.4); ell(x + w * .6, y + h * .5, w * .16, h * .16, '#79c576'); }
  if (o.view === 'hills') { ctx.fillStyle = '#8fc79a'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.quadraticCurveTo(x + w * .25, y + h * .55, x + w * .5, y + h * .8); ctx.quadraticCurveTo(x + w * .78, y + h * .55, x + w, y + h * .75); ctx.lineTo(x + w, y + h); ctx.fill(); }
  if (o.view === 'bldg') { rb(x + w * .12, y + h * .5, w * .3, h * .5, '#c9b6a0', { r: 2, lw: 1.2 }); rb(x + w * .52, y + h * .62, w * .36, h * .4, '#b7a48f', { r: 2, lw: 1.2 }); }
  /* a soft diagonal sheen */
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(x + w * .1, y); ctx.lineTo(x + w * .34, y); ctx.lineTo(x + w * .08, y + h); ctx.lineTo(x - w * .16, y + h); ctx.fill();
  if (o.blinds) { ctx.fillStyle = o.blinds; for (let by = y; by < y + h * (o.blindK ?? .5); by += 7) { ctx.fillStyle = shade(o.blinds, .94 + .06 * ((by / 7) % 2)); ctx.fillRect(x, by, w, 5.2); ln(x, by + 5.4, x + w, by + 5.4, 'rgba(0,0,0,.18)', 1, 'butt'); } }
  ctx.restore();
  if (o.mull !== false) { ln(x + w / 2, y, x + w / 2, y + h, fr, 3.4, 'butt'); ln(x, y + h * .5, x + w, y + h * .5, fr, 3.4, 'butt'); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); }
  rb(x - 9, y + h + 3, w + 18, 7, lift(fr, .0), { r: 2, lw: 1.5 });   /* the sill */
  if (o.curtain) {
    const c = o.curtain;
    for (const s of [-1, 1]) { const cxx = s < 0 ? x - 6 : x + w + 6, cw = o.curtW ?? w * .24; ctx.beginPath(); ctx.moveTo(cxx - (s < 0 ? 0 : cw), y - 8); ctx.lineTo(cxx + (s < 0 ? cw : 0), y - 8); ctx.quadraticCurveTo(cxx + (s < 0 ? cw * .85 : -cw * .15), y + h * .5, cxx + (s < 0 ? cw * .6 : -cw * .6), y + h + 6); ctx.lineTo(cxx - (s < 0 ? 0 : cw) - (s < 0 ? -cw * .1 : 0), y + h + 6); ctx.closePath(); ctx.fillStyle = hg(cxx - cw, cxx + cw, shade(c, .86), lift(c, .1)); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke(); for (let f = 1; f < 3; f++) ln(cxx + s * cw * (.2 + .25 * f) * (s < 0 ? 1 : -1) * -1, y - 6, cxx + s * cw * (.1 + .2 * f) * (s < 0 ? 1 : -1) * -1, y + h, 'rgba(0,0,0,.12)', 1.2); }
    rb(x - 14, y - 12, w + 28, 5, '#8a6a44', { r: 2.5, lw: 1.3 });
  }
}

/* a framed picture. art(x, y, w, h) paints the inside, clipped */
function frameDraw(x, y, w, h, o = {}, art) {
  const fc = o.frame ?? '#c9a24c', m = o.mat ?? 4, th = o.th ?? 5;
  ctx.save(); ctx.shadowColor = 'rgba(20,10,24,.35)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2; rb(x, y, w, h, fc, { r: o.r ?? 2, lw: 1.6 }); ctx.restore();
  ctx.fillStyle = o.matColor ?? '#f5efe0'; ctx.fillRect(x + th, y + th, w - 2 * th, h - 2 * th);
  const ix = x + th + m, iy = y + th + m, iw = w - 2 * (th + m), ih = h - 2 * (th + m);
  ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip(); if (art) art(ix, iy, iw, ih); ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(ix, iy, iw, ih);
}

/* a potted plant standing on the floor at (x, y): s scales it */
function plantDraw(x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fsh(0, 1, 46, .3, 5);
  const pot = o.pot ?? '#c8714a';
  ctx.beginPath(); ctx.moveTo(-16, -34); ctx.lineTo(16, -34); ctx.lineTo(12, 0); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fillStyle = hg(-16, 16, shade(pot, .85), lift(pot, .12)); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.7; ctx.stroke();
  rb(-18, -40, 36, 8, shade(pot, .95), { r: 3, lw: 1.6 });
  ell(0, -38, 15, 3, '#4a3626');
  const r = rnd(o.seed ?? 11), n = o.n ?? 9, c = o.leaf ?? '#4fa85a';
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + (i / (n - 1) - .5) * 2.4 + (r() - .5) * .2, len = (o.len ?? 62) * (.7 + .5 * r()), bx = Math.cos(a) * len, by = -38 + Math.sin(a) * len;
    ctx.strokeStyle = shade(c, .6); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -38); ctx.quadraticCurveTo(bx * .4, -38 + Math.sin(a) * len * .7, bx, by); ctx.stroke();
    ctx.save(); ctx.translate(bx, by); ctx.rotate(a + PI / 2); ctx.beginPath(); ctx.ellipse(0, -9, 8, 15, 0, 0, TAU); ctx.fillStyle = vg(-24, 6, lift(c, .22), shade(c, .82)); ctx.fill(); ctx.strokeStyle = 'rgba(15,60,25,.7)'; ctx.lineWidth = 1.3; ctx.stroke(); ln(0, 4, 0, -22, 'rgba(15,60,25,.4)', 1); ctx.restore();
  }
  ctx.restore();
}

/* a chair seen from the front (back, seat, legs); kind 'dining' | 'office' | 'folding' */
function chairDraw(x, y, o = {}) {
  const w = o.w ?? 34, h = o.h ?? 62, c = o.color ?? '#9a6a44';
  ctx.save(); ctx.translate(x, y);
  fsh(0, 1, w + 8, .25, 4);
  ln(-w / 2 + 3, -h * .36, -w / 2 + 3, 0, shade(c, .7), 3.4); ln(w / 2 - 3, -h * .36, w / 2 - 3, 0, shade(c, .7), 3.4);
  rb(-w / 2, -h * .46, w, h * .1, shade(c, 1.0), { r: 2.5, lw: 1.5 });
  rb(-w / 2 + 2, -h, w - 4, h * .54, c, { r: 5, lw: 1.7 });
  if (o.slats) { for (let i = 1; i < 3; i++) ln(-w / 2 + 6, -h + h * .54 * i / 3, w / 2 - 6, -h + h * .54 * i / 3, rgba(shade(c, .6), .6), 1.4); }
  ctx.restore();
}

/* the wall seen as a clip region: draw fn inside the back wall's rectangle */
function onBack(b, fn) { ctx.save(); ctx.beginPath(); ctx.rect(b.bx0, b.by0, b.bx1 - b.bx0, b.by1 - b.by0); ctx.clip(); fn(); ctx.restore(); }

// ------------------------------------------------------------------------------------------------ the per-room cache: static art at 3x, built on first use (no text in it)
const CS = 3, CACHE = {};
function cacheOf(id) {
  let c = CACHE[id];
  if (c) return c;
  const r = S14.rect(id), cv = document.createElement('canvas');
  cv.width = Math.ceil(r.w * CS); cv.height = Math.ceil(r.h * CS);
  const g = cv.getContext('2d'); g.scale(CS, CS);
  withCtx(g, () => guard('paint ' + id, () => { ctx.save(); STATIC[id](r.w, r.h, r); sideDoors(id, r.w, r.h); ctx.restore(); }));
  CACHE[id] = cv;
  return cv;
}
const STATIC = {}, LIVE = {}, FRONT = {};

// ================================================================================================ the rooms (static art, room coordinates, drawn once into the cache)
/* ---- 1. the Administrator's office: mustard wall, walnut panelling, a burgundy rug, the portrait, the budget chart, a ficus */
STATIC.office = (w, h) => {
  const b = roomBox(w, h, { wall: '#dcb87c', side: '#b48d56', ceil: '#f0e4ca', base: '#3b281e', trim: '#f6ebc9', floor: { kind: 'planks', a: '#6a4631', pw: 24, seam: '#3f281c', seed: 21 }, wains: { h: 92, color: '#744a33', rail: '#d3ad5f', panels: 4 } });
  const top = b.by1 - 92;
  onBack(b, () => { stripesV(b.bx0, b.by0, b.bx1, top, 14, 2.4, 'rgba(160,110,50,.3)'); stripesV(b.bx0, b.by0, b.bx1, top, 14, 1, 'rgba(255,240,200,.28)', 2.4); });
  lampDraw(w / 2, 11, 'bowl');
  /* the rug */
  poly([[40, 314], [212, 314], [194, 284], [58, 284]], '#8e3140', 'rgba(40,10,20,.6)', 1.6); poly([[50, 309], [202, 309], [187, 289], [64, 289]], null, '#d9b45a', 1.6); poly([[62, 304], [190, 304], [180, 293], [73, 293]], '#a23a4a');
  /* the ficus in the left corner */
  plantDraw(42, FY - 1, 1.08, { pot: '#b9683f', leaf: '#4c9a52', n: 11, len: 70, seed: 3 });
  /* the budget chart: a pie of one huge slice of pizza */
  rb(66, 56, 66, 62, '#fbf7ea', { r: 3, lw: 1.8 });
  const px = 99, py = 85, pr = 15; ctx.save(); ctx.translate(px, py); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, pr, -.5, TAU - .86); ctx.closePath(); ctx.fillStyle = '#f0a43a'; ctx.fill(); ctx.strokeStyle = '#8b4a12'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, pr, -.86, -.5); ctx.closePath(); ctx.fillStyle = '#4c7bd9'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c23a2b'; for (const [dx, dy] of [[-7, -5], [3, 7], [-3, 3], [8, -2], [-9, 5], [1, -9]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.1, 0, TAU); ctx.fill(); } ctx.restore();
  ctx.fillStyle = '#f0a43a'; ctx.fillRect(72, 103, 5, 4.4); ctx.fillStyle = '#4c7bd9'; ctx.fillRect(72, 110, 5, 4.4);
  /* the portrait of the founder (himself): gilded frame, drapery, the sitter, a slice raised like a scepter */
  frameDraw(140, 34, 60, 80, { frame: '#d4a93e', th: 6, m: 3, matColor: '#2c3a46' }, (x, y, ww, hh) => {
    ctx.fillStyle = vg(y, y + hh, '#2a3e4c', '#1a2833'); ctx.fillRect(x, y, ww, hh);
    ctx.fillStyle = '#7d2230'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + ww * .3, y + hh * .35, x, y + hh * .8); ctx.lineTo(x, y); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + ww, y); ctx.quadraticCurveTo(x + ww * .75, y + hh * .3, x + ww, y + hh * .7); ctx.lineTo(x + ww, y); ctx.fill();
    ell(x + ww / 2, y + hh * .84, ww * .46, hh * .24, '#3b3f66');
    ell(x + ww / 2, y + hh * .5, ww * .3, ww * .28, '#e8c98f', '#7a5a2a', 1.2); ell(x + ww * .42, y + hh * .47, 1.8, 2.2, '#1d1a22'); ell(x + ww * .58, y + hh * .47, 1.8, 2.2, '#1d1a22'); ln(x + ww * .44, y + hh * .58, x + ww * .56, y + hh * .58, '#7a3a2a', 1.3);
    ctx.save(); ctx.translate(x + ww * .86, y + hh * .56); ctx.rotate(.25); ln(0, 10, 0, -6, '#d4a93e', 1.8); ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(0, -17); ctx.closePath(); ctx.fillStyle = '#f0a43a'; ctx.fill(); ctx.strokeStyle = '#8b4a12'; ctx.lineWidth = .9; ctx.stroke(); ctx.restore();
  });
  /* two diplomas */
  for (const [dy2, c] of [[44, '#f6f0dc'], [82, '#f1ead2']]) { rb(204, dy2, 20, 28, '#6d4a2e', { r: 1.5, lw: 1.3 }); ctx.fillStyle = c; ctx.fillRect(206.5, dy2 + 2.5, 15, 23); for (let i = 0; i < 4; i++) ln(208, dy2 + 7 + i * 4.5, 220, dy2 + 7 + i * 4.5, 'rgba(60,40,30,.45)', 1); ell(213.5, dy2 + 22, 2.4, 2.4, '#c23a2b'); }
  /* the leather chair behind the desk: a tall tufted back */
  fsh(152, FY + 4, 78, .32, 6);
  ctx.beginPath(); ctx.roundRect(116, 126, 64, 116, [26, 26, 8, 8]); ctx.fillStyle = hg(116, 180, '#6a2630', '#8f3340'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { const bx = 130 + i * 18 + (j % 2) * 9, by = 146 + j * 22; ell(bx, by, 3.2, 3.2, '#4a1a22', 'rgba(255,230,200,.5)', .8); ln(bx, by, bx + 9, by + 11, 'rgba(0,0,0,.22)', 1.2); ln(bx, by, bx - 9, by + 11, 'rgba(0,0,0,.22)', 1.2); } ctx.restore();
  ctx.strokeStyle = 'rgba(255,230,210,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(121, 132, 54, 104, [22, 22, 6, 6]); ctx.stroke();
  ln(148, 242, 148, 270, '#2a2428', 5); ell(148, 272, 26, 4, '#2a2428');
  roomFinish(w, h, .36);
};

/* ---- 2. the conference room: powder blue, grey carpet, a long table with six chairs, a whiteboard and a pull-down screen, a stack of sign-in sheets and a pizza box */
STATIC.conf = (w, h) => {
  const b = roomBox(w, h, { wall: '#a9bdd8', side: '#8096b6', ceil: '#e6ecf4', base: '#34415a', trim: '#f2f5fa', floor: { kind: 'carpet', a: '#6b7b99', seed: 4 }, wains: { h: 64, color: '#5d7091', rail: '#c9d4e8', panels: 5 } });
  lampDraw(w / 2, 11, 'panel');
  /* ceiling tile lines */
  ctx.save(); path([[0, 0], [w, 0], [b.bx1, b.by0], [b.bx0, b.by0]]); ctx.clip(); for (let x = -50; x < w + 50; x += 31) ln(x, 0, w / 2 + (x - w / 2) * .84, b.by0, 'rgba(60,70,90,.18)', 1); ln(0, 9, w, 9, 'rgba(60,70,90,.15)', 1); ctx.restore();
  /* whiteboard (the writing is live) */
  rb(28, 50, 86, 70, '#c9ced6', { r: 3, lw: 1.8 }); rb(32, 54, 78, 58, '#fdfdfb', { r: 1.5, lw: 1.1, flat: true }); rb(40, 116, 62, 5, '#9aa3b0', { r: 2, lw: 1.2 });
  ctx.fillStyle = '#c23a2b'; ctx.fillRect(48, 114.5, 8, 3); ctx.fillStyle = '#2b5fc2'; ctx.fillRect(60, 114.5, 8, 3);
  /* the pull-down screen */
  rb(122, 32, 104, 8, '#4a5266', { r: 3, lw: 1.6 }); ctx.fillStyle = vg(40, 130, '#f6f8fb', '#dfe5ee'); ctx.fillRect(126, 40, 96, 88); ctx.strokeStyle = OUT; ctx.lineWidth = 1.3; ctx.strokeRect(126, 40, 96, 88);
  ctx.fillStyle = '#9aa7ba'; ctx.fillRect(126, 126, 96, 4.5); ell(174, 134, 3.6, 3.6, '#c9d2e0', OUT, 1.2); ln(174, 130, 174, 134, OUT, 1);
  ctx.fillStyle = '#2d5fb0'; ctx.fillRect(132, 46, 84, 11); for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(40,50,70,.35)'; ctx.fillRect(134, 64 + i * 8, 40 + (i % 2) * 14, 3.4); } for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#e0583d', '#f0a43a', '#59b36b', '#4c7bd9'][i]; ctx.fillRect(184 + i * 7.5, 108 - (i + 1) * 9, 5.5, (i + 1) * 9); }
  /* six chairs: four across the far side, one at each end */
  for (const x of [56, 102, 148, 194]) chairDraw(x, 254, { w: 33, h: 86, color: '#3e4f74', slats: false });
  fsh(w / 2, FY + 6, 200, .32, 7);
  /* the table: a slab seen from a little above, two slab legs */
  for (const x of [58, 192]) { rb(x - 7, 252, 14, 30, '#6a4a30', { r: 2, lw: 1.5 }); }
  poly([[30, 236], [220, 236], [212, 252], [38, 252]], vg(236, 252, '#c98f5a', '#bd824e'), OUT, 1.8); ctx.fillStyle = 'rgba(255,255,255,.2)'; path([[34, 238], [216, 238], [214, 241], [36, 241]]); ctx.fill();
  poly([[38, 252], [212, 252], [212, 260], [38, 260]], '#8f5e36', OUT, 1.6);
  for (const x of [26, 224]) chairDraw(x, 276, { w: 28, h: 74, color: '#3e4f74' });
  /* on the table: the sign-in sheets, a pizza box, a speakerphone */
  for (let i = 0; i < 6; i++) { rb(62 + i * .6, 228 - i * 1.8, 30, 2.6, '#fbf7ec', { r: .6, lw: .8, flat: true }); }
  rb(60, 216, 34, 3, '#9aa3b0', { r: 1, lw: .8, flat: true }); ell(76, 217, 3, 1.4, '#c9d2e0');
  poly([[128, 232], [176, 232], [180, 240], [124, 240]], '#e7d3a8', OUT, 1.4); poly([[124, 240], [180, 240], [180, 246], [124, 246]], '#d1b985', OUT, 1.4);
  ctx.save(); ctx.translate(148, 228); ctx.rotate(-.1); poly([[-24, 0], [24, 0], [22, -4], [-22, -4]], '#c23a2b', OUT, 1.2); ctx.restore();
  star(w / 2 + 52, 240, 9, 4, '#2a2630', null); ell(w / 2 + 52, 240, 2.4, 1.4, '#c23a2b');
  roomFinish(w, h, .36);
};

/* ---- 3. the locked break room: sage green, a checker floor, a kitchenette, a table, a chair with a worn cardigan, a door with a padlock (the room is dim) */
STATIC.rest = (w, h) => {
  const b = roomBox(w, h, { wall: '#b6d3b0', side: '#8fae8a', ceil: '#e9efe2', base: '#5a6b52', trim: '#f2f6ea', floor: { kind: 'checker', a: '#e6d392', b: '#f6efcf', n: 7, rows: 4, grout: 'rgba(120,100,40,.25)' }, wains: { h: 56, color: '#8fb08a', rail: '#e4eedd', panels: 6 } });
  lampDraw(w / 2, 11, 'tube');
  onBack(b, () => dotsGrid(b.bx0, b.by0, b.bx1, 214, 14, 1.6, 'rgba(255,255,255,.4)'));
  /* kitchenette: wall cabinet, counter, microwave, kettle */
  rb(26, 52, 88, 66, '#d9a867', { r: 3, lw: 1.8 }); ln(70, 54, 70, 116, OUT, 1.6); for (const x of [62, 78]) rb(x - 1.5, 80, 3, 14, '#7a5a30', { r: 1.5, lw: 1 });
  fsh(70, FY + 2, 92, .3, 6);
  rb(26, 210, 90, 68, '#d9a867', { r: 3, lw: 1.8 }); ln(71, 224, 71, 276, OUT, 1.6); ln(26, 224, 116, 224, OUT, 1.3); for (const x of [62, 80]) rb(x - 1.5, 238, 3, 14, '#7a5a30', { r: 1.5, lw: 1 });
  rb(22, 200, 98, 11, '#f1efe8', { r: 2.5, lw: 1.8 });
  rb(34, 168, 46, 32, '#f2eee4', { r: 4, lw: 1.8 }); rb(39, 173, 28, 21, '#232a30', { r: 2, lw: 1.3, flat: true }); ctx.fillStyle = 'rgba(160,220,255,.22)'; ctx.fillRect(41, 175, 10, 17); for (let i = 0; i < 3; i++) ell(73.5, 177 + i * 8, 2.6, 2.6, '#9aa0a8', OUT, .9);
  ctx.beginPath(); ctx.roundRect(94, 178, 16, 22, [8, 8, 2, 2]); ctx.fillStyle = hg(94, 110, '#b3b8c0', '#e8ecf0'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); ln(110, 184, 117, 188, OUT, 2);
  /* the 2019 wall calendar (the writing is live) */
  rb(122, 44, 34, 56, '#fbf7ea', { r: 1.5, lw: 1.5 }); ctx.fillStyle = vg(46, 70, '#8fc5e6', '#d9ecf4'); ctx.fillRect(124, 46, 30, 24); ctx.fillStyle = '#5a8a5a'; ctx.beginPath(); ctx.moveTo(124, 70); ctx.lineTo(134, 56); ctx.lineTo(141, 64); ctx.lineTo(147, 52); ctx.lineTo(154, 70); ctx.fill();
  ctx.fillStyle = 'rgba(40,40,50,.55)'; for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) ctx.fillRect(125 + i * 5, 84 + j * 3.6, 3.4, 1.6);
  ell(139, 44, 2.2, 2.2, '#9aa0a8');
  /* the door, locked: planks, a hasp and a padlock */
  fsh(192, FY + 3, 76, .25, 5);
  rb(154, 54, 76, 232, '#e4d6b8', { r: 3, lw: 1.8 }); rb(160, 60, 64, 224, '#a8764a', { r: 2, lw: 1.8 });
  for (const [y0, hh] of [[68, 78], [154, 120]]) { ctx.strokeStyle = 'rgba(60,30,10,.45)'; ctx.lineWidth = 1.4; ctx.strokeRect(168, y0, 48, hh); ctx.strokeStyle = 'rgba(255,230,190,.25)'; ctx.strokeRect(169.4, y0 + 1.4, 45.2, hh - 2.8); }
  rb(168, 70, 50, 62, '#fbfbf6', { r: 3, lw: 1.5, flat: true }); ctx.strokeStyle = '#c23a2b'; ctx.lineWidth = 2.6; ctx.strokeRect(170.5, 72.5, 45, 57); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(172, 74, 8, 52);
  ctx.save(); ctx.translate(192, 148); ctx.rotate(-.07); rb(-17, -9, 34, 18, '#ffe135', { r: 1.5, lw: 1.2, flat: true }); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-17, 6, 34, 3); ctx.restore();
  ell(168, 190, 4.6, 4.6, '#d8c070', OUT, 1.3); ln(168, 190, 168, 200, '#d8c070', 2);
  rb(176, 176, 16, 4, '#8f969e', { r: 1.5, lw: 1 }); rb(166, 174, 6, 14, '#8f969e', { r: 1.5, lw: 1 });
  rb(170, 192, 14, 12, '#d8a62a', { r: 3, lw: 1.5 }); ctx.strokeStyle = '#8f969e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(177, 192, 5, PI, TAU); ctx.stroke(); ell(177, 198, 1.7, 1.7, '#3a2a10');
  ctx.save(); ctx.strokeStyle = '#7d8590'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ell(190 + i * 6, 178 + Math.sin(i) * 3 + i * 2, 2.6, 1.8, null, '#7d8590', 1.8, i % 2 ? .4 : -.4); } ctx.restore();
  /* the table and its two chairs: one carries a worn cardigan */
  fsh(124, FY + 6, 110, .3, 6);
  ln(124, 244, 124, 280, '#7a5a30', 5); ell(124, 281, 22, 4, '#6a4a28');
  ell(124, 240, 44, 9, vg(232, 248, '#e8c27c', '#d3a85e'), OUT, 1.7);
  chairDraw(76, 280, { w: 32, h: 70, color: '#c07f4a', slats: true });
  ctx.save(); ctx.translate(76, 280); ctx.beginPath(); ctx.moveTo(-17, -62); ctx.quadraticCurveTo(-5, -69, 17, -62); ctx.lineTo(19, -34); ctx.lineTo(14, -22); ctx.lineTo(10, -40); ctx.lineTo(-10, -40); ctx.lineTo(-13, -16); ctx.lineTo(-19, -20); ctx.closePath(); ctx.fillStyle = vg(-66, -16, '#d8a23a', '#b9822a'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(120,70,10,.45)'; ctx.lineWidth = 1.2; for (let y = -64; y < -14; y += 4.2) { ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(20, y + 1.4); ctx.stroke(); } ctx.restore();
  ell(-6, -48, 2, 2, '#7a4a10'); ell(6, -48, 2, 2, '#7a4a10'); ctx.restore();
  chairDraw(176, 282, { w: 32, h: 70, color: '#c07f4a', slats: true });
  /* a mug and a forgotten sandwich on the table */
  rb(106, 228, 11, 12, '#e7e2d6', { r: 2, lw: 1.3 }); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(118, 234, 3.6, -1.2, 1.2); ctx.stroke();
  roomFinish(w, h, .42);
};

/* ---- 4. Room 14, Mr. Goji's: mauve stripes, a hospital bed, a bedside table with the empty pitcher, a window with blinds, a wolf poster */
STATIC.r14 = (w, h) => {
  const b = roomBox(w, h, { wall: '#d4adc6', side: '#a8809c', ceil: '#f0e6ee', base: '#5a3e58', trim: '#f6ecf2', floor: { kind: 'planks', a: '#9a7658', pw: 25, seam: '#5a3e2c', seed: 14 } });
  lampDraw(w / 2, 11, 'dome');
  onBack(b, () => { stripesV(b.bx0, b.by0, b.bx1, b.by1, 12, 2.6, 'rgba(150,100,140,.26)'); });
  windowDraw(30, 56, 62, 74, { view: 'hills', blinds: '#efe7f2', blindK: .42, curtain: '#8d6aa8', seed: 7 });
  /* the wolf poster: a black wolf howling at a white moon over a violet hill */
  frameDraw(146, 40, 54, 70, { frame: '#2a2230', th: 3, m: 0, matColor: '#2a2230' }, (x, y, ww, hh) => {
    ctx.fillStyle = vg(y, y + hh, '#2a2a6a', '#6a4a9a'); ctx.fillRect(x, y, ww, hh);
    ell(x + ww * .7, y + hh * .22, 8, 8, '#fff6dc'); ell(x + ww * .7 + 3, y + hh * .22 - 2, 7, 7, 'rgba(255,246,220,0)');
    ctx.fillStyle = '#c8b0e8'; for (const [sx, sy] of [[.15, .12], [.3, .3], [.45, .1], [.88, .4], [.1, .45]]) ell(x + ww * sx, y + hh * sy, 1, 1, '#fff');
    ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(x, y + hh); ctx.quadraticCurveTo(x + ww * .4, y + hh * .62, x + ww, y + hh * .8); ctx.lineTo(x + ww, y + hh); ctx.fill();
    ctx.fillStyle = '#14101c'; ctx.beginPath(); ctx.moveTo(x + ww * .22, y + hh * .8); ctx.quadraticCurveTo(x + ww * .26, y + hh * .62, x + ww * .34, y + hh * .56); ctx.lineTo(x + ww * .3, y + hh * .4); ctx.lineTo(x + ww * .38, y + hh * .5); ctx.lineTo(x + ww * .5, y + hh * .4); ctx.lineTo(x + ww * .52, y + hh * .56); ctx.quadraticCurveTo(x + ww * .64, y + hh * .66, x + ww * .72, y + hh * .8); ctx.closePath(); ctx.fill();
  });
  /* the bed: head at the right; blanket and rail are in the front layer */
  fsh(168, FY + 6, 130, .32, 7);
  rb(204, 164, 18, 108, '#c9c3d6', { r: 5, lw: 1.8 }); rb(200, 156, 26, 14, '#b4adc6', { r: 5, lw: 1.6 });
  rb(110, 218, 12, 56, '#c9c3d6', { r: 4, lw: 1.7 });
  rb(116, 238, 92, 16, '#e9e6ee', { r: 5, lw: 1.8 }); ctx.fillStyle = '#9aa4c0'; ctx.fillRect(116, 252, 92, 6);
  for (const x of [122, 204]) { ln(x, 258, x, 280, '#8f8aa0', 4); ell(x, 281, 5, 3, '#2a2630'); }
  ctx.beginPath(); ctx.roundRect(176, 218, 34, 22, 8); ctx.fillStyle = vg(218, 240, '#ffffff', '#dcd8e8'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.7; ctx.stroke();   /* the pillow */
  /* the bedside table with the empty pitcher */
  fsh(96, FY + 5, 40, .3, 5);
  rb(80, 226, 30, 52, '#b98a5a', { r: 3, lw: 1.8 }); ln(80, 244, 110, 244, OUT, 1.4); rb(90, 232, 10, 3, '#6a4a2a', { r: 1.5, lw: 1 }); rb(90, 252, 10, 3, '#6a4a2a', { r: 1.5, lw: 1 });
  ln(84, 278, 84, 284, '#6a4a2a', 3); ln(106, 278, 106, 284, '#6a4a2a', 3);
  rb(78, 222, 34, 5, '#d1a06c', { r: 2, lw: 1.5 });
  ctx.beginPath(); ctx.moveTo(86, 222); ctx.lineTo(84, 198); ctx.quadraticCurveTo(95, 194, 106, 198); ctx.lineTo(104, 222); ctx.closePath(); ctx.fillStyle = 'rgba(190,225,245,.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(40,70,100,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(104, 202); ctx.quadraticCurveTo(113, 200, 112, 212); ctx.quadraticCurveTo(111, 218, 104, 216); ctx.strokeStyle = 'rgba(40,70,100,.7)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(87, 202, 2.4, 16); ell(95, 220, 7, 1.6, 'rgba(120,170,210,.5)');   /* a film of water at the bottom: it is nearly empty */
  roomFinish(w, h, .38);
};
FRONT.r14 = (r, lt, st) => {   /* the blanket and the bed rail, over a resident sitting up in the bed */
  ctx.save(); ctx.translate(r.x0, r.y0);
  ctx.beginPath(); ctx.moveTo(114, 244); ctx.lineTo(178, 244); ctx.quadraticCurveTo(190, 243, 210, 246); ctx.lineTo(210, 266); ctx.quadraticCurveTo(160, 274, 114, 266); ctx.closePath(); ctx.fillStyle = hg(114, 210, '#2f8f95', '#3aa6ad'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 3; for (let x = 120; x < 210; x += 14) { ctx.beginPath(); ctx.moveTo(x, 242); ctx.lineTo(x, 270); ctx.stroke(); } for (let y = 250; y < 270; y += 11) { ctx.beginPath(); ctx.moveTo(112, y); ctx.lineTo(212, y); ctx.stroke(); } ctx.restore();
  ctx.fillStyle = vg(244, 250, 'rgba(255,255,255,.3)', 'rgba(255,255,255,0)'); ctx.fillRect(116, 244, 92, 6);
  ln(126, 232, 200, 232, '#c9c3d6', 3.4); ln(126, 232, 126, 244, '#c9c3d6', 3.4); ln(200, 232, 200, 244, '#c9c3d6', 3.4);
  ctx.restore();
};

/* ---- 5. the med room: mint wall, white tile splash, cabinets, a sink, the locked narcotics box, a sharps box, sanitiser. (The fridge and the cart are live.) */
STATIC.med = (w, h) => {
  const b = roomBox(w, h, { wall: '#bfe2d8', side: '#93baae', ceil: '#eef6f3', base: '#e6eeec', trim: '#fbfdfc', floor: { kind: 'tile', a: '#dde3e5', b: '#d1d8db', n: 7, rows: 4, grout: 'rgba(90,100,110,.28)' } });
  lampDraw(w / 2, 11, 'tube');
  ctx.fillStyle = '#f6faf9'; ctx.fillRect(24, 124, 100, 84); tileGrid(24, 124, 124, 208, 14, 8, 'rgba(120,150,150,.45)', 1, true); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.strokeRect(24, 124, 100, 84);
  /* wall cabinets */
  rb(26, 38, 90, 74, '#f1f8f5', { r: 3, lw: 1.8 }); ln(71, 40, 71, 110, OUT, 1.6); for (const x of [66, 76]) rb(x - 1.5, 88, 3, 14, '#9aa8a8', { r: 1.5, lw: 1 });
  ctx.fillStyle = 'rgba(160,215,205,.35)'; ctx.fillRect(31, 44, 34, 40); ctx.fillRect(77, 44, 34, 40); ctx.strokeStyle = 'rgba(40,70,70,.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(31, 44, 34, 40); ctx.strokeRect(77, 44, 34, 40);
  for (let i = 0; i < 3; i++) { rb(36 + i * 9, 62, 6, 20, ['#e8903a', '#f6f0e0', '#d8584a'][i], { r: 1.5, lw: 1, flat: true }); rb(82 + i * 9, 66, 6, 16, ['#59b36b', '#f6f0e0', '#4c7bd9'][i], { r: 1.5, lw: 1, flat: true }); }
  /* counter, sink, faucet */
  fsh(72, FY + 2, 104, .3, 6);
  rb(24, 214, 98, 64, '#f1f8f5', { r: 3, lw: 1.8 }); ln(73, 226, 73, 276, OUT, 1.6); ln(24, 226, 122, 226, OUT, 1.3); for (const x of [66, 80]) rb(x - 1.5, 242, 3, 14, '#9aa8a8', { r: 1.5, lw: 1 });
  rb(20, 203, 106, 12, '#dfe6ea', { r: 3, lw: 1.8 }); ell(60, 207, 22, 4.2, '#9aa8b2', OUT, 1.4); ell(60, 207.5, 18, 2.6, '#6f7d88');
  ctx.strokeStyle = '#b8c4cc'; ctx.lineWidth = 4.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(60, 204); ctx.lineTo(60, 178); ctx.quadraticCurveTo(60, 170, 70, 170); ctx.lineTo(76, 170); ctx.lineTo(76, 176); ctx.stroke(); ctx.strokeStyle = '#eef3f6'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(58.4, 202); ctx.lineTo(58.4, 180); ctx.stroke();
  rb(54, 196, 12, 6, '#b8c4cc', { r: 2, lw: 1.2 }); ell(58, 196, 2, 2, '#4c7bd9'); ell(65, 196, 2, 2, '#d8584a');
  /* the locked narcotics box: steel, a keypad, a red light, a lock */
  rb(128, 80, 34, 46, '#8f99a6', { r: 4, lw: 2 }); rb(132, 84, 26, 38, '#a8b2be', { r: 3, lw: 1.3 });
  ctx.fillStyle = '#2a2f38'; ctx.fillRect(136, 90, 18, 4); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) ell(139 + i * 6.5, 101 + j * 6, 2, 2, '#e4e8ee');
  ell(145, 117, 2.8, 2.8, '#d8342c', 'rgba(0,0,0,.4)', .8);
  /* the sharps box and the sanitiser */
  rb(132, 150, 24, 32, '#d6382c', { r: 3, lw: 1.6 }); rb(130, 146, 28, 7, '#f3c633', { r: 2, lw: 1.3 }); ctx.fillStyle = '#7a1710'; ctx.fillRect(139, 149, 10, 2.4); rb(137, 160, 14, 12, '#fff6e8', { r: 1.5, lw: 1, flat: true });
  rb(166, 150, 11, 26, '#f6f8fa', { r: 3.5, lw: 1.5 }); rb(168, 144, 7, 7, '#9aa8b2', { r: 2, lw: 1.2 }); ln(175, 146, 181, 146, '#9aa8b2', 2.4); rb(163, 174, 17, 4, '#8f99a6', { r: 1.5, lw: 1.2 }); ctx.fillStyle = 'rgba(80,170,230,.6)'; ctx.fillRect(168, 158, 7, 12);
  roomFinish(w, h, .34);
};

/* ---- 6. Room 4, Mr. Banana's: butter stripes, a bed with rails, a blue floor mat, the FALL RISK sign over a tally of 49, a window. (The peel on the floor is live: rooms.r4.peel) */
STATIC.r4 = (w, h) => {
  const b = roomBox(w, h, { wall: '#f3e49c', side: '#cbb660', ceil: '#fcf5da', base: '#8a6a30', trim: '#fffbe8', floor: { kind: 'planks', a: '#c99f6c', pw: 24, seam: '#8a6238', seed: 4 }, wains: { h: 50, color: '#ecc75a', rail: '#fff3bd', panels: false } });
  lampDraw(w / 2, 11, 'dome');
  onBack(b, () => stripesV(b.bx0, b.by0, b.bx1, b.by1, 40, 20, 'rgba(232,200,80,.45)', 10));
  windowDraw(160, 46, 58, 76, { view: 'tree', curtain: '#e9a43a', seed: 2 });
  /* FALL RISK sign over a tally of forty-nine marks */
  rb(34, 32, 98, 42, '#ffd23f', { r: 4, lw: 2 }); ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 1.6; ctx.strokeRect(38, 36, 90, 34);
  poly([[56, 40], [44, 64], [68, 64]], '#ffffff', '#1d1a22', 2); ln(56, 48, 56, 56, '#1d1a22', 2.4); ell(56, 60, 1.4, 1.4, '#1d1a22');
  rb(34, 82, 98, 76, '#fbf7ea', { r: 3, lw: 1.8 });
  ctx.strokeStyle = '#1d3a8a'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  for (let g = 0; g < 10; g++) {
    const gx = 44 + (g % 5) * 17.6, gy = 90 + Math.floor(g / 5) * 33, n = g < 9 ? 5 : 4;
    for (let k = 0; k < Math.min(4, n); k++) { ctx.beginPath(); ctx.moveTo(gx + k * 3.5, gy); ctx.lineTo(gx + k * 3.5, gy + 22); ctx.stroke(); }
    if (n === 5) { ctx.beginPath(); ctx.moveTo(gx - 2, gy + 17); ctx.lineTo(gx + 14, gy + 4); ctx.stroke(); }
  }
  /* the bed with its rails */
  fsh(98, FY + 6, 150, .34, 7);
  rb(28, 168, 14, 108, '#7da1d8', { r: 5, lw: 1.8 }); rb(24, 160, 22, 12, '#6a8cc4', { r: 5, lw: 1.6 });
  rb(42, 240, 126, 16, '#eef0f4', { r: 5, lw: 1.8 }); rb(42, 254, 126, 6, '#9aa4c0', { r: 2, lw: 1.3 });
  for (const x of [48, 160]) { ln(x, 260, x, 280, '#8f8aa0', 4); ell(x, 281, 5, 3, '#2a2630'); }
  ctx.beginPath(); ctx.moveTo(42, 242); ctx.lineTo(168, 242); ctx.quadraticCurveTo(176, 240, 178, 248); ctx.lineTo(178, 256); ctx.lineTo(42, 256); ctx.closePath(); ctx.fillStyle = hg(42, 178, '#4a7fd0', '#5b95e6'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(44, 244, 130, 3);
  ctx.beginPath(); ctx.roundRect(46, 226, 36, 20, 8); ctx.fillStyle = vg(226, 246, '#ffffff', '#dcdcec'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.7; ctx.stroke();
  ctx.strokeStyle = '#c3cad8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (const y of [210, 224]) { ctx.beginPath(); ctx.moveTo(50, y); ctx.lineTo(162, y); ctx.stroke(); } for (const x of [56, 84, 112, 140, 160]) { ctx.beginPath(); ctx.moveTo(x, 206); ctx.lineTo(x, 244); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; for (const y of [209, 223]) { ctx.beginPath(); ctx.moveTo(52, y); ctx.lineTo(160, y); ctx.stroke(); }
  /* the bed-exit mat on the floor, and the peel */
  poly([[26, 314], [150, 314], [142, 290], [34, 290]], '#3f78c8', 'rgba(20,30,70,.7)', 1.6); ctx.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 6; i++) ln(40 + i * 20, 311, 44 + i * 18, 293, 'rgba(255,255,255,.3)', 1.2);
  roomFinish(w, h, .36);
};

/* ---- 7. Room 7, Mrs. Cranberry's: rose wallpaper, an armchair with a doily, a radio, a calendar stuck on 1962, curlers on the dresser, a framed photo, a floor lamp */
STATIC.r7 = (w, h) => {
  const b = roomBox(w, h, { wall: '#efbcb2', side: '#c58c82', ceil: '#fcefeb', base: '#7a4a3e', trim: '#fff5f1', floor: { kind: 'planks', a: '#94623f', pw: 26, seam: '#5a3a24', seed: 7 }, wains: { h: 38, color: '#f6e6dc', rail: '#ffffff', panels: 5 } });
  lampDraw(w / 2, 11, 'dome');
  onBack(b, () => {
    let row = 0; for (let y = b.by0 + 14; y < b.by1 - 38; y += 24, row++) for (let x = b.bx0 + (row % 2 ? 12 : 0) + 8; x < b.bx1; x += 24) { ell(x, y, 5.2, 5.2, 'rgba(206,86,108,.4)'); ell(x, y, 2.6, 2.6, 'rgba(250,170,184,.65)'); ell(x + 8, y + 6, 3.2, 1.6, 'rgba(90,150,90,.5)', null, 0, .5); ell(x - 8, y + 6, 3.2, 1.6, 'rgba(90,150,90,.5)', null, 0, -.5); }
  });
  ln(b.bx0, 40, b.bx1, 40, 'rgba(255,255,255,.6)', 2.4, 'butt'); ln(b.bx0, 42.6, b.bx1, 42.6, 'rgba(0,0,0,.15)', 1.4, 'butt');
  /* the calendar, stuck on 1962 (the writing is live) */
  rb(46, 50, 42, 54, '#fbf7ea', { r: 1.5, lw: 1.5 }); ctx.fillStyle = vg(52, 78, '#e8c27c', '#c9824a'); ctx.fillRect(48, 52, 38, 26); ell(67, 66, 8, 6, '#d9534a'); ctx.fillStyle = '#4a7a9a'; ctx.fillRect(48, 70, 38, 8);
  ctx.fillStyle = 'rgba(40,40,50,.55)'; for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) ctx.fillRect(49 + i * 5.2, 90 + j * 3.4, 3.2, 1.5);
  ell(67, 50, 2.2, 2.2, '#9aa0a8');
  /* framed wedding photo, sepia */
  frameDraw(132, 56, 30, 38, { frame: '#9a6a3c', th: 3, m: 2, matColor: '#efe2c4' }, (x, y, ww, hh) => { ctx.fillStyle = vg(y, y + hh, '#d8bf94', '#a98a5c'); ctx.fillRect(x, y, ww, hh); ell(x + ww * .34, y + hh * .5, 4.6, 5.6, '#6a4a2a'); ell(x + ww * .68, y + hh * .5, 4.2, 5, '#5a3a22'); ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x + 3, y + hh * .72, ww * .3, hh * .3); });
  /* the floor lamp with a fringed shade */
  fsh(33, FY + 4, 28, .28, 4);
  ln(33, 160, 33, 276, '#6a4a2a', 3.4); ell(33, 278, 13, 3.6, '#5a3a22', OUT, 1.3);
  ctx.beginPath(); ctx.moveTo(18, 140); ctx.lineTo(48, 140); ctx.lineTo(54, 170); ctx.lineTo(12, 170); ctx.closePath(); ctx.fillStyle = vg(140, 170, '#fff4c9', '#f0d58a'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); for (let x = 12; x <= 54; x += 4.2) ln(x, 170, x - .6, 175, '#d9b05a', 1.2);
  /* the oval braided rug */
  ell(125, 296, 82, 15, '#b5503f', 'rgba(60,20,20,.7)', 1.6); ell(125, 296, 66, 11.5, '#e8c27c', 'rgba(60,20,20,.35)', 1.2); ell(125, 296, 50, 8, '#7a9a8a', null); ell(125, 296, 34, 5.2, '#b5503f');
  /* the armchair (centre x 80): back and wings here; the arms and the cushion are in the front layer, so a sitter tucks into it. The cushion's top is 50 px above the floor line (v 254) */
  fsh(80, FY + 6, 112, .34, 7);
  for (const x of [52, 108]) { ln(x, 272, x, 283, '#5a3a22', 5); }
  ctx.beginPath(); ctx.roundRect(44, 160, 72, 100, [28, 28, 6, 6]); ctx.fillStyle = hg(44, 116, '#3f807e', '#58a09c'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; for (let y = 176; y < 258; y += 11) { ctx.beginPath(); ctx.moveTo(44, y); ctx.quadraticCurveTo(80, y + 5, 116, y); ctx.stroke(); } ctx.restore();
  for (const x of [44, 116]) { ctx.beginPath(); ctx.ellipse(x, 194, 9, 32, 0, 0, TAU); ctx.fillStyle = hg(x - 9, x + 9, '#3a7573', '#5aa5a0'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke(); }
  /* the doily on the headrest */
  ctx.save(); ctx.translate(80, 175); ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(120,100,70,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, a2 = (i + .5) / 18 * TAU; ctx.lineTo(Math.cos(a) * 21, Math.sin(a) * 10.5); ctx.lineTo(Math.cos(a2) * 17, Math.sin(a2) * 8.4); } ctx.closePath(); ctx.fill(); ctx.stroke(); for (let i = 0; i < 8; i++) ell(Math.cos(i * .785) * 10, Math.sin(i * .785) * 5, 2.4, 1.4, null, 'rgba(120,100,70,.5)', .8); ctx.restore();
  /* the radio on its little table */
  fsh(156, FY + 4, 54, .3, 5);
  for (const x of [138, 174]) ln(x, 232, x - (x < 156 ? 3 : -3), 278, '#6a4a2a', 3.4);
  ell(156, 230, 28, 6, vg(224, 236, '#c08a5a', '#a2693c'), OUT, 1.6); ln(142, 250, 170, 250, '#6a4a2a', 2.6);
  ctx.beginPath(); ctx.moveTo(138, 226); ctx.lineTo(138, 202); ctx.quadraticCurveTo(138, 190, 156, 190); ctx.quadraticCurveTo(174, 190, 174, 202); ctx.lineTo(174, 226); ctx.closePath(); ctx.fillStyle = hg(138, 174, '#8a5230', '#b4783e'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.stroke();
  ctx.fillStyle = '#cdb287'; ctx.beginPath(); ctx.roundRect(142, 196, 14, 26, 3); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1; for (let y = 200; y < 222; y += 3.6) { ctx.beginPath(); ctx.moveTo(143, y); ctx.lineTo(155, y); ctx.stroke(); }
  ell(165, 204, 6, 6, '#efe4c4', OUT, 1.3); ell(165, 214, 2.6, 2.6, '#2a2630'); ell(165, 220, 2.6, 2.6, '#2a2630');
  /* the dresser, a mirror, and curlers in a tray */
  fsh(202, FY + 4, 62, .3, 5);
  rb(178, 218, 50, 60, '#b4783e', { r: 3, lw: 1.8 }); for (const y of [238, 258]) ln(178, y, 228, y, OUT, 1.4); for (const y of [228, 248, 268]) { ell(197, y, 2, 2, '#e8d5a0', OUT, .8); ell(209, y, 2, 2, '#e8d5a0', OUT, .8); }
  rb(176, 212, 54, 8, '#cf9a60', { r: 2.5, lw: 1.5 });
  ctx.beginPath(); ctx.ellipse(204, 150, 19, 34, 0, 0, TAU); ctx.fillStyle = '#d7a64a'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.7; ctx.stroke(); ctx.beginPath(); ctx.ellipse(204, 150, 14.5, 29.5, 0, 0, TAU); ctx.fillStyle = vg(120, 180, '#cfe4ee', '#eef6fa'); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(196, 130); ctx.lineTo(202, 126); ctx.lineTo(194, 158); ctx.lineTo(190, 158); ctx.fill();
  rb(186, 205, 34, 8, '#e8d5b8', { r: 2.5, lw: 1.3 }); for (let i = 0; i < 5; i++) { rb(188 + i * 6.3, 195, 5.4, 10, '#f48fb1', { r: 2.4, lw: 1, flat: true }); ln(188.5 + i * 6.3, 198, 192.4 + i * 6.3, 198, 'rgba(255,255,255,.55)', 1); }
  rb(222, 206, 5, 8, '#9ad0e6', { r: 2, lw: 1 });
  roomFinish(w, h, .38);
};
FRONT.r7 = (r) => {   /* the armchair's arms and cushion, over the sitter's lap: Mrs. Cranberry sits at x 80 with noLegs and her seat at v 254 (50 px above the floor line) */
  ctx.save(); ctx.translate(r.x0, r.y0);
  ctx.beginPath(); ctx.roundRect(42, 254, 76, 22, 9); ctx.fillStyle = vg(254, 276, '#5aa5a0', '#3f807e'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.24)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(50, 257); ctx.lineTo(110, 257); ctx.stroke();
  for (const x of [32, 114]) { ctx.beginPath(); ctx.roundRect(x, 222, 14, 56, 6); ctx.fillStyle = hg(x, x + 14, '#3a7573', '#5aa5a0'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.stroke(); ctx.save(); ctx.translate(x + 7, 227); ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(120,100,70,.55)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
};

/* ---- 8. the shower room: pale blue tile, a showerhead, a drain, a curtain; the stash, the glass front and the door are live */
STATIC.shower = (w, h) => {
  const b = roomBox(w, h, { wall: '#b9d6ea', side: '#8fb2cc', ceil: '#f2f6f9', base: '#e8eff4', trim: '#ffffff', floor: { kind: 'tile', a: '#8fb1cc', b: '#9dbdd5', n: 8, rows: 4, grout: '#dceaf3' } });
  lampDraw(w / 2, 11, 'dome');
  onBack(b, () => { tileGrid(b.bx0, b.by0, b.bx1, b.by1, 14, 14, 'rgba(255,255,255,.75)', 1.3); ctx.fillStyle = 'rgba(70,120,170,.5)'; ctx.fillRect(b.bx0, 120, b.bx1 - b.bx0, 14); tileGrid(b.bx0, 120, b.bx1, 134, 14, 14, 'rgba(255,255,255,.7)', 1.2); });
  for (const side of [-1, 1]) { const xf = side < 0 ? 0 : w, xbk = side < 0 ? b.bx0 : b.bx1; ctx.save(); path([[xf, 0], [xbk, b.by0], [xbk, b.by1], [xf, h]]); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.1; for (let i = 1; i < 12; i++) { const t = i / 12; ln(xf, h * t, xbk, b.by0 + (b.by1 - b.by0) * t, 'rgba(255,255,255,.3)', 1, 'butt'); } ctx.restore(); }
  /* showerhead and valve */
  ctx.strokeStyle = '#b8c4cc'; ctx.lineWidth = 4.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(190, 150); ctx.lineTo(190, 62); ctx.quadraticCurveTo(190, 52, 180, 52); ctx.lineTo(170, 56); ctx.stroke();
  ctx.save(); ctx.translate(166, 62); ctx.rotate(.5); ctx.beginPath(); ctx.ellipse(0, 0, 13, 5.4, 0, 0, TAU); ctx.fillStyle = vg(-6, 6, '#eef3f6', '#a8b4bc'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fillStyle = '#5a6670'; for (let i = -3; i <= 3; i++) ell(i * 3.4, 1.8, .7, .7, '#5a6670'); ctx.restore();
  ell(190, 150, 6, 6, '#c9d2da', OUT, 1.3); ell(190, 150, 2.4, 2.4, '#d8584a');
  /* the curtain, pulled back to the left on its rail */
  ln(96, 46, 226, 46, '#9aa8b2', 3.4); for (let i = 0; i < 9; i++) ell(104 + i * 6.6, 46, 2, 2.4, null, '#9aa8b2', 1.2);
  ctx.beginPath(); ctx.moveTo(100, 48); ctx.lineTo(152, 48); for (let i = 0; i <= 8; i++) ctx.lineTo(152 - i * .2, 48 + 4 * Math.sin(i * 1.2) + i * 24 + 0); ctx.lineTo(100, 252); ctx.closePath();
  ctx.save(); ctx.beginPath(); ctx.rect(98, 48, 56, 204); ctx.clip(); ctx.fillStyle = hg(98, 154, 'rgba(236,244,250,.94)', 'rgba(200,222,238,.94)'); ctx.fillRect(98, 48, 56, 204); ctx.strokeStyle = 'rgba(70,110,150,.35)'; ctx.lineWidth = 1.6; for (let i = 0; i < 6; i++) { const x = 104 + i * 9; ctx.beginPath(); ctx.moveTo(x, 50); ctx.quadraticCurveTo(x + 3, 150, x - 1, 250); ctx.stroke(); } ctx.fillStyle = 'rgba(70,130,190,.35)'; for (let y = 66; y < 250; y += 28) for (let x = 108; x < 150; x += 20) { ell(x + (y % 56 ? 8 : 0), y, 3, 3, 'rgba(70,130,190,.3)'); } ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(98, 48); ctx.lineTo(98, 252); ctx.lineTo(154, 252); ctx.lineTo(154, 48); ctx.stroke();
  /* the drain */
  ell(176, 296, 13, 3.4, '#6f8296', OUT, 1.2); for (let i = -2; i <= 2; i++) ln(176 + i * 4, 294.6, 176 + i * 4, 297.4, '#d8e4ee', 1);
  roomFinish(w, h, .3);
};

/* ---- 9. the lobby: warm cream, green panelling, a checker floor, sliding glass doors onto the lot, a welcome banner, a pamphlet rack, a plant. (The desk is in the front layer.) */
STATIC.lobby = (w, h) => {
  const b = roomBox(w, h, { wall: '#eddab4', side: '#bfa87e', ceil: '#faf3e2', base: '#365e4c', trim: '#fffaf0', floor: { kind: 'checker', a: '#f0e8d6', b: '#c9bb9c', n: 6, rows: 4 }, wains: { h: 60, color: '#4a7a64', rail: '#d3ad5f', panels: 5 } });
  lampDraw(w / 2, 11, 'bowl');
  /* the sliding doors: an aluminium frame, two glass leaves, daylight and a hedge beyond */
  const dx = 30, dy = 70, dw = 100, dh = 202;
  rb(dx - 6, dy - 14, dw + 12, dh + 14, '#b9c3cc', { r: 3, lw: 1.8 });
  ctx.save(); ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
  ctx.fillStyle = vg(dy, dy + dh, '#9fd2f6', '#fbfdff'); ctx.fillRect(dx, dy, dw, dh);
  ctx.fillStyle = '#6ab86a'; ctx.beginPath(); ctx.ellipse(dx + 20, dy + dh - 62, 44, 36, 0, PI, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(dx + 78, dy + dh - 56, 40, 30, 0, PI, TAU); ctx.fill(); ctx.fillStyle = '#8f98a8'; ctx.fillRect(dx, dy + dh - 40, dw, 40); ln(dx, dy + dh - 40, dx + dw, dy + dh - 40, '#d8d4c8', 3, 'butt'); for (let i = 0; i < 5; i++) ln(dx + 10 + i * 22, dy + dh - 22, dx + 26 + i * 22, dy + dh - 22, 'rgba(255,255,255,.55)', 3, 'butt');
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(dx + 8, dy); ctx.lineTo(dx + 34, dy); ctx.lineTo(dx + 6, dy + dh); ctx.lineTo(dx - 20, dy + dh); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#b9c3cc'; ctx.lineWidth = 4; ctx.strokeRect(dx, dy, dw, dh); ln(dx + dw / 2, dy, dx + dw / 2, dy + dh, '#b9c3cc', 5, 'butt'); ln(dx, dy + dh * .52, dx + dw, dy + dh * .52, 'rgba(185,195,204,.9)', 3.4, 'butt');
  rb(dx + dw / 2 - 12, dy + dh * .5 - 20, 3, 40, '#e9eef2', { r: 1.5, lw: 1 }); rb(dx + dw / 2 + 9, dy + dh * .5 - 20, 3, 40, '#e9eef2', { r: 1.5, lw: 1 });
  rb(dx + 22, dy - 12, dw - 44, 11, '#2d3440', { r: 3, lw: 1.5 }); ell(dx + dw / 2, dy - 6.5, 2.4, 2.4, '#59d56b');
  poly([[40, 316], [128, 316], [120, 288], [48, 288]], 'rgba(255,248,214,.45)'); poly([[46, 312], [122, 312], [116, 292], [52, 292]], '#4a4a56', 'rgba(20,16,26,.7)', 1.4);   /* the light on the floor, and the mat */
  /* the welcome banner: cream cloth with red trim and two ties (the lettering is live) */
  ctx.beginPath(); ctx.moveTo(30, 28); ctx.lineTo(228, 28); ctx.lineTo(224, 56); ctx.lineTo(34, 56); ctx.closePath(); ctx.fillStyle = vg(28, 56, '#fff6dc', '#efdfb4'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.stroke(); ln(33, 32, 225, 32, '#c23a2b', 2, 'butt'); ln(35, 52, 223, 52, '#c23a2b', 2, 'butt');
  ln(32, 28, 26, 22, '#8a6a44', 1.6); ln(226, 28, 232, 22, '#8a6a44', 1.6);
  /* a pamphlet rack */
  fsh(214, 190, 4, 0, 0); rb(196, 86, 30, 84, '#3a3f4a', { r: 3, lw: 1.6 }); for (let r2 = 0; r2 < 3; r2++) for (let i = 0; i < 3; i++) rb(199 + i * 9, 90 + r2 * 26, 7.5, 22, ['#e0583d', '#59b36b', '#4c7bd9', '#f0a43a', '#c25fa0', '#4cb3c9'][(r2 * 3 + i) % 6], { r: 1.4, lw: 1, flat: true });
  /* a plant behind the desk */
  plantDraw(212, FY, .92, { pot: '#4a7a64', leaf: '#4fa85a', n: 9, len: 66, seed: 6 });
  roomFinish(w, h, .34);
};

/* ---- 10. the nurses' station (double width): the call-light board, the assignment whiteboard, a clock, the Q sign, a computer on wheels, a coffee corner. (The counter is in the front layer.) */
STATIC.station = (w, h) => {
  const b = roomBox(w, h, { wall: '#d8e0b4', side: '#a9b383', ceil: '#f1f4e4', base: '#4c5a3c', trim: '#fbfdf3', floor: { kind: 'checker', a: '#e2e8cc', b: '#c8d2a8', n: 16, rows: 4, grout: 'rgba(80,100,60,.2)' }, wains: { h: 58, color: '#80a06c', rail: '#eef4dc', panels: 13 } });
  lampDraw(w * .3, 11, 'panel'); lampDraw(w * .7, 11, 'panel');
  /* the call-light board: forty domes, all dark here (the lit ones are live) */
  rb(30, 32, 124, 94, '#242a32', { r: 5, lw: 2 }); ctx.fillStyle = '#323a44'; ctx.fillRect(34, 36, 116, 14);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) { const x = 45 + i * 13.5, y = 64 + j * 12.6; ell(x, y, 4.8, 4.8, '#46505c', '#161a20', 1); ell(x - 1, y - 1.3, 1.5, 1.5, 'rgba(255,255,255,.3)'); }
  /* the whiteboard with the assignment (the writing is live) */
  rb(172, 38, 104, 84, '#c9ced6', { r: 3, lw: 1.8 }); rb(176, 42, 96, 72, '#fdfdfb', { r: 1.5, lw: 1.1, flat: true }); rb(190, 118, 68, 5, '#9aa3b0', { r: 2, lw: 1.2 });
  ctx.fillStyle = '#2b5fc2'; ctx.fillRect(200, 117, 8, 3); ctx.fillStyle = '#c23a2b'; ctx.fillRect(212, 117, 8, 3);
  /* the clock face (the hands are live) */
  ell(318, 66, 21, 21, '#fbf7ea', OUT, 2.2); ell(318, 66, 17.5, 17.5, null, 'rgba(0,0,0,.25)', 1); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ln(318 + Math.cos(a) * 14, 66 + Math.sin(a) * 14, 318 + Math.cos(a) * 16.4, 66 + Math.sin(a) * 16.4, '#2a2630', i % 3 ? 1 : 1.9); }
  /* the Q sign: a black panel (the lettering and the red digits are live) */
  rb(346, 34, 108, 72, '#15131c', { r: 4, lw: 2, stroke: 'rgba(255,255,255,.28)' });
  /* the computer on wheels */
  fsh(398, FY + 2, 56, .3, 5);
  ln(398, 180, 398, 268, '#5a6670', 5); rb(382, 178, 32, 5, '#7d8a96', { r: 2, lw: 1.3 }); for (const x of [380, 416]) { ln(398, 268, x, 280, '#5a6670', 3.4); ell(x, 281, 4, 3, '#2a2630'); }
  rb(374, 130, 48, 38, '#2a2f38', { r: 3.5, lw: 1.8 }); ctx.fillStyle = vg(134, 164, '#57a8d8', '#2d6aa0'); ctx.fillRect(378, 134, 40, 28); for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(381, 138 + i * 6, 12 + (i % 2) * 14, 2.2); }
  rb(386, 168, 24, 6, '#2a2f38', { r: 2, lw: 1.2 }); rb(380, 184, 36, 7, '#dfe3e8', { r: 2.5, lw: 1.5 });
  /* the coffee corner at the right */
  fsh(466, FY + 2, 60, .3, 5);
  rb(442, 218, 48, 62, '#c9a26a', { r: 3, lw: 1.8 }); ln(466, 230, 466, 278, OUT, 1.4); for (const x of [460, 472]) rb(x - 1.5, 246, 3, 12, '#7a5a30', { r: 1.5, lw: 1 }); rb(438, 208, 56, 11, '#f1efe8', { r: 2.5, lw: 1.8 });
  rb(452, 168, 22, 40, '#2a2630', { r: 4, lw: 1.8 }); ctx.fillStyle = '#6a7480'; ctx.fillRect(455, 176, 16, 6); ell(463, 196, 5, 3, '#8a4a22'); ell(480, 200, 4, 5, '#fff6ea', OUT, 1.2); ell(484, 200, 2, 2.4, null, OUT, 1.1); ell(462, 172, 1.8, 1.8, '#d8342c');
  /* two office chairs behind the counter */
  for (const x of [170, 300]) { ln(x, 252, x, 276, '#2a2630', 4); for (const dx of [-14, 14]) { ln(x, 276, x + dx, 281, '#2a2630', 3); ell(x + dx, 282, 3, 2.4, '#15131c'); } rb(x - 20, 196, 40, 58, '#3b4452', { r: 12, lw: 1.8 }); ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 204; y < 250; y += 6) ctx.fillRect(x - 14, y, 28, 2); }
  fsh(w / 2, 308, w - 40, .3, 8);
  roomFinish(w, h, .34);
};

/* ---- 11. the dining room: peach walls, a chalkboard menu, a window, a row of chairs, a tray cart. (The table is in the front layer.) */
STATIC.dining = (w, h) => {
  const b = roomBox(w, h, { wall: '#f0cca4', side: '#c89e76', ceil: '#fbf0e2', base: '#6a4a34', trim: '#fff7ec', floor: { kind: 'checker', a: '#f6e8c8', b: '#dcbc8c', n: 8, rows: 4 }, wains: { h: 64, color: '#a8724c', rail: '#ebcba2', panels: 4 } });
  lampDraw(w / 2, 11, 'bowl');
  /* the menu board: a green chalkboard in a wooden frame (the writing is live) */
  rb(28, 36, 126, 72, '#8a5a34', { r: 4, lw: 2 }); ctx.fillStyle = vg(40, 104, '#35574a', '#2a4a3c'); ctx.fillRect(33, 41, 116, 62); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.ellipse(70, 80, 30, 16, .3, 0, TAU); ctx.fill(); rb(40, 104, 102, 4, '#6a4424', { r: 2, lw: 1.2 });
  windowDraw(168, 50, 52, 74, { view: 'bldg', curtain: '#f1a05a', seed: 9 });
  /* a row of chairs behind the table */
  for (const x of [46, 98, 150]) chairDraw(x, 256, { w: 34, h: 92, color: '#9a6a44', slats: true });
  /* the tray cart */
  fsh(218, FY + 2, 44, .3, 5);
  rb(198, 154, 38, 5, '#8f99a6', { r: 2, lw: 1.3 }); rb(198, 196, 38, 5, '#8f99a6', { r: 2, lw: 1.3 }); rb(198, 238, 38, 5, '#8f99a6', { r: 2, lw: 1.3 }); for (const x of [200, 233]) ln(x, 156, x, 276, '#8f99a6', 3.2);
  for (const [y, c] of [[146, '#c9d4e0'], [188, '#e6c9a0'], [230, '#d8e6d0']]) { rb(202, y, 30, 8, c, { r: 3, lw: 1.3 }); ctx.beginPath(); ctx.ellipse(217, y, 12, 8, 0, PI, TAU); ctx.fillStyle = '#f6f8fa'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); ell(217, y - 8.5, 1.8, 1.8, '#9aa8b2'); }
  for (const x of [202, 232]) { ln(x, 276, x, 280, '#2a2630', 3); ell(x, 281, 4, 3.2, '#2a2630'); }
  fsh(w / 2, 310, w - 40, .22, 7);
  roomFinish(w, h, .34);
};

// ================================================================================================ the building: cut walls, doorways, and the assembly of S14.back / S14.front
const SCENERY = {};   /* sky, roof, lot, car: filled in by the next part */
let HATCH = null;
function hatch() {
  if (HATCH) return HATCH;
  const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d');
  g.fillStyle = '#43313b'; g.fillRect(0, 0, 24, 24); g.strokeStyle = 'rgba(255,214,170,.14)'; g.lineWidth = 2;
  for (const o of [-24, 0, 24]) { g.beginPath(); g.moveTo(o, 24); g.lineTo(o + 24, 0); g.stroke(); }
  HATCH = mainCtx.createPattern(c, 'repeat');
  return HATCH;
}
/* doorway holes in a room's side walls (the walls that are shared with a neighbour); drawn into the cache after the room's own art */
function sideDoors(id, w, h) {
  const b = boxOf(w, h);
  for (const side of ['l', 'r']) {
    if (!S14.door(id, side)) continue;
    const l = side === 'l', xf = l ? 0 : w, xb = l ? b.bx0 : b.bx1, top = 118;
    ctx.save();
    /* the opening: a shadowed passage with the next room's warm light low down, and a cream architrave on its three outer edges */
    poly([[xf, top], [xb, top - 3], [xb, b.by1], [xf, h]], vg(top, h, '#2a1f2e', '#6a5240'));
    ctx.fillStyle = hg(xf, xb, 'rgba(255,214,150,.0)', 'rgba(255,214,150,.16)'); path([[xf, top + 20], [xb, top + 17], [xb, b.by1], [xf, h]]); ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(30,18,34,.8)'; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(xf, h); ctx.lineTo(xf, top); ctx.lineTo(xb, top - 3); ctx.lineTo(xb, b.by1); ctx.stroke();
    ctx.strokeStyle = '#f0e2c2'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(xf, h); ctx.lineTo(xf, top); ctx.lineTo(xb, top - 3); ctx.lineTo(xb, b.by1); ctx.stroke();
    ctx.restore();
  }
}
const LAMPDEF = { rest: .6 };                                   /* the locked break room is dim */
const LAMPSITE = { station: [.3, .7] };                          /* lamp fixtures at these fractions of the room's width (default: the middle) */
function drawRoom(id, r, t, st, o) {
  const cv = cacheOf(id);
  ctx.drawImage(cv, r.x0, r.y0, r.w, r.h);
  const lampBase = st.lamp ?? LAMPDEF[id] ?? 1, fl = st.flicker ? 1 - st.flicker * (.5 + .5 * Math.sin(t * 61 + id.length)) * (Math.sin(t * 17) > 0 ? 1 : .4) : 1, lamp = clamp01(lampBase * fl);
  for (const f of LAMPSITE[id] || [.5]) lampLive(r.x0 + f * r.w, r.y0 + 11, r.floor, lamp, { w1: r.span === 2 ? 190 : 230 });
  if (LIVE[id]) guard('live ' + id, () => LIVE[id](r, t, st, o, lamp));
}
function shellBack(t, o, V) {
  const x0 = X0, y0 = Y0, w = 1060, h = 1002;
  ctx.fillStyle = hatch(); ctx.fillRect(x0, y0, w, h);
  if (o.only) for (const id of S14.ids) if (!o.only.includes(id)) { const r = S14.rect(id); ctx.fillStyle = '#2b2230'; ctx.fillRect(r.x0, r.y0, r.w, r.h); }
}
function shellFront(t, o, V) {
  /* a bevel along every room's edge: light on the top and left, dark on the bottom and right, so the walls read as thick cut sections */
  for (const id of S14.ids) {
    if (o.only && !o.only.includes(id)) continue;
    const r = S14.rect(id);
    if (!seen(V, r.x0, r.y0, r.x1, r.y1)) continue;
    ctx.lineCap = 'butt';
    ln(r.x0, r.y0 - .8, r.x1, r.y0 - .8, 'rgba(25,14,30,.85)', 1.6); ln(r.x0 - .8, r.y0, r.x0 - .8, r.y1, 'rgba(25,14,30,.85)', 1.6);
    ln(r.x0, r.y1 + .8, r.x1, r.y1 + .8, 'rgba(255,236,210,.42)', 1.6); ln(r.x1 + .8, r.y0, r.x1 + .8, r.y1, 'rgba(255,236,210,.30)', 1.6);
  }
  /* the doorways: an arched notch through each partition, at the floor */
  for (const id of S14.ids) {
    const r = S14.rect(id), d = S14.door(id, 'r');
    if (!d || (o.only && !o.only.includes(id))) continue;
    const x = r.x1, y0 = d.y0 + 0, y1 = r.y1;
    if (!seen(V, x, y0, x + T, y1)) continue;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y0 + T / 2); ctx.arc(x + T / 2, y0 + T / 2, T / 2, PI, 0); ctx.lineTo(x + T, y1); ctx.closePath();
    ctx.fillStyle = vg(y0, y1, '#2a1f2e', '#7a6048'); ctx.fill();
    ctx.fillStyle = vg(y0 + T, y1, 'rgba(255,226,170,0)', 'rgba(255,226,170,.35)'); ctx.fillRect(x + 2, y0 + T, T - 4, y1 - y0 - T);
    ctx.strokeStyle = '#f0e2c2'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y0 + T / 2); ctx.arc(x + T / 2, y0 + T / 2, T / 2, PI, 0); ctx.lineTo(x + T, y1); ctx.stroke();
  }
  /* the outline of the whole building */
  ctx.strokeStyle = '#1d1a22'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeRect(X0 - 1, Y0 - 1, 1062, 1004);
}

/* ---- the scenery stand-ins (replaced by the real sky, roof, lot and car in the next part) */
SCENERY.sky = (t, o, V) => { ctx.fillStyle = vg(-1400, 700, '#2f6fc4', '#bfe0f6'); ctx.fillRect(-600, -1400, W + 1200, 2200); };
SCENERY.lot = (t, o, V) => { ctx.fillStyle = vg(1342, 1920, '#7a8094', '#4a4e5f'); ctx.fillRect(-600, 1342, W + 1200, 900); };
SCENERY.roof = () => {};
SCENERY.car = () => {};

S14.back = (lt, o = {}) => {
  const t = o.t ?? lt, V = view(120), rs = o.rooms || {};
  ctx.save();
  if (!o.noSky) guard('sky', () => SCENERY.sky(t, o, V));
  if (!o.noLot) guard('lot', () => SCENERY.lot(t, o, V));
  guard('shell', () => shellBack(t, o, V));
  for (const id of S14.ids) {
    if (o.only && !o.only.includes(id)) continue;
    const r = S14.rect(id);
    if (!seen(V, r.x0, r.y0, r.x1, r.y1)) continue;
    drawRoom(id, r, t, rs[id] || {}, o);
  }
  guard('shell edges', () => shellFront(t, o, V));
  if (!o.noRoof) guard('roof', () => SCENERY.roof(t, o, V));
  if (!o.noCar) guard('car', () => SCENERY.car(t, o, V));
  ctx.restore();
};
S14.front = (lt, o = {}) => {
  const t = o.t ?? lt, V = view(120), rs = o.rooms || {};
  ctx.save();
  for (const id of S14.ids) {
    if (!FRONT[id] || (o.only && !o.only.includes(id))) continue;
    const r = S14.rect(id);
    if (!seen(V, r.x0, r.y0, r.x1, r.y1)) continue;
    guard('front ' + id, () => FRONT[id](r, t, rs[id] || {}, o));
  }
  ctx.restore();
};

// ================================================================================================ the world around the building: sky, hills, roof, sign, chimney, weathervane, lot
const A7K = window.A7;
function vg2(y0, y1, c0, c1) { return vg(y0, y1, c0, c1); }
function hillsDraw() {
  /* the country behind the building: the horizon is low (y about 1000), two ridges of hills with round trees, then a meadow down to the building's foot */
  const ridge = (base, amp, f, ph, c0, c1, y1) => { ctx.beginPath(); ctx.moveTo(-1200, y1); for (let x = -1200; x <= 4000; x += 20) ctx.lineTo(x, base + amp * Math.sin(x * f + ph) + amp * .5 * Math.sin(x * f * 2.7 + ph * 2)); ctx.lineTo(4000, y1); ctx.closePath(); ctx.fillStyle = vg(base - amp, y1, c0, c1); ctx.fill(); };
  ridge(930, 70, .0021, 1.2, '#b9d8d4', '#8fc0b4', 1342);
  ridge(1010, 46, .0034, 3.1, '#8fc29d', '#6aa583', 1342);
  const r = rnd(8); for (let x = -1180; x < 3980; x += 30 + r() * 34) { const y = 1010 + 46 * Math.sin(x * .0034 + 3.1) + 23 * Math.sin(x * .0034 * 2.7 + 6.2) + 6, rr0 = 12 + r() * 14; ell(x, y - rr0 * .7, rr0, rr0 * 1.15, vg(y - rr0 * 2, y, '#6eb277', '#3f8a52'), null); ln(x, y - rr0 * .2, x, y + 4, '#5a4630', 3); }
  ridge(1112, 20, .0052, .5, '#86c26d', '#5aa24a', 1342);
  const q = rnd(19); for (let i = 0; i < 90; i++) { const x = -1200 + q() * 5200, y = 1130 + q() * 190; ell(x, y, 5 + q() * 9, 2 + q() * 3, `rgba(${q() > .5 ? '255,236,150' : '255,255,255'},.5)`, null); }   /* flowers in the meadow */
}
SCENERY.sky = (t, o, V) => {
  ctx.fillStyle = vg(-1600, 1020, '#1e56ae', '#7bbaee', '#fbe7c2'); ctx.fillRect(-1200, -1600, 5200, 3000);
  ctx.save();
  /* the low gold sun, upper left, with a few long soft rays */
  V2.glow(90, 90, 1100, '255,226,160', .5, 'screen', .35);
  if (A7K) A7K.rays(90, 90, 80, 1700, t, { n: 12, color: '255,236,190', a: .05, spin: .005 });
  if (A7K) { A7K.clouds(t, -1100, -150, { n: 6, a: .85, speed: 7, seed: 12, scale: 1.3, tint: '255,250,240', belly: '170,190,225' }); A7K.clouds(t, 10, 250, { n: 4, a: .92, speed: 9, seed: 2, scale: 1.05, tint: '255,248,235', belly: '200,200,220' }); A7K.birds(t, 90, 300, { n: 5, seed: 3, speed: 46, size: 1.1 }); }
  ctx.restore();
  hillsDraw();
};

/* ---- the roof: terracotta tiles, a ridge, a fascia, a chimney; cached at 2x (no text) */
let ROOFC = null;
function roofCache() {
  if (ROOFC) return ROOFC;
  const cs = 2, x0 = -20, y0 = 200, w = 1120, h = 170, cv = document.createElement('canvas'); cv.width = w * cs; cv.height = h * cs;
  const g = cv.getContext('2d'); g.scale(cs, cs); g.translate(-x0, -y0);
  withCtx(g, () => {
    /* the chimney (behind the roof) */
    const cx0 = 936, cw = 66;
    ctx.fillStyle = hg(cx0, cx0 + cw, '#b8674a', '#8e4430'); ctx.fillRect(cx0, 226, cw, 90);
    ctx.save(); ctx.beginPath(); ctx.rect(cx0, 226, cw, 90); ctx.clip(); ctx.strokeStyle = 'rgba(50,20,12,.5)'; ctx.lineWidth = 1.4; for (let y = 226, row = 0; y < 316; y += 9, row++) { ln(cx0, y, cx0 + cw, y, 'rgba(50,20,12,.5)', 1.3, 'butt'); for (let x = cx0 + (row % 2 ? 11 : 0); x < cx0 + cw; x += 22) ln(x, y, x, y + 9, 'rgba(50,20,12,.45)', 1.3, 'butt'); } ctx.restore();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(cx0, 226, cw, 90);
    rb(cx0 - 7, 214, cw + 14, 14, '#d6a07e', { r: 3, lw: 2 }); ell(cx0 + cw / 2, 216, cw / 2 - 8, 4, '#2a1d1a');
    /* the sign's two posts, standing on the roof */
    for (const x of [250, 818]) { rb(x, 318, 18, 30, '#4a3a2c', { r: 3, lw: 1.8 }); }
    /* the roof body: a low hip, tiles in scalloped rows */
    const body = [[-12, 344], [1092, 344], [954, 282], [126, 282]];
    ctx.save(); path(body); ctx.clip();
    ctx.fillStyle = vg(280, 344, '#d06d52', '#a74a38'); ctx.fillRect(-12, 280, 1108, 66);
    for (let y = 286, row = 0; y < 350; y += 8.5, row++) { for (let x = -20 + (row % 2 ? 11 : 0); x < 1100; x += 22) { ctx.beginPath(); ctx.arc(x + 11, y, 11, 0, PI); ctx.strokeStyle = 'rgba(70,22,14,.4)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.arc(x + 11, y - 1.2, 9.4, .25, PI - .25); ctx.strokeStyle = 'rgba(255,200,170,.17)'; ctx.lineWidth = 1.5; ctx.stroke(); } }
    ctx.fillStyle = hg(-12, 126, 'rgba(0,0,0,.0)', 'rgba(0,0,0,.0)'); ctx.restore();
    ctx.strokeStyle = 'rgba(40,14,10,.8)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; path(body); ctx.stroke();
    rb(120, 274, 840, 10, '#8d3f2d', { r: 5, lw: 2 });
    /* fascia board and the shadow it throws on the building's top slab */
    ctx.fillStyle = vg(344, 366, 'rgba(10,4,12,.5)', 'rgba(10,4,12,0)'); ctx.fillRect(-12, 346, 1104, 22);
    rb(-14, 335, 1108, 12, '#74321f', { r: 3, lw: 2 });
  });
  ROOFC = { cv, x0, y0, w, h };
  return ROOFC;
}
/* small live smoke from the chimney: a loop of soft puffs that rise, spread and fade */
function chimneySmoke(t) {
  const x = 969, y = 212, n = 9;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const ph = ((t * .32 + i / n) % 1 + 1) % 1, r = 16 + ph * 34, px = x + 8 * Math.sin(ph * 5 + i) + ph * 54, py = y - ph * 170, a = .5 * Math.sin(Math.min(1, ph * 3) * PI / 2) * (1 - ph);
    ctx.fillStyle = rg(px, py, 0, r, [[0, `rgba(238,238,244,${a})`], [1, 'rgba(238,238,244,0)']]); ctx.fillRect(px - r, py - r, r * 2, r * 2);
  }
  ctx.restore();
}
/* a fruit weathervane: an arrow with an apple at its tail, turning slowly in the wind */
function weathervane(t) {
  const x = 112, y0 = 292, top = 236;
  ln(x, y0, x, top, '#3a3340', 4); ell(x, top + 14, 5, 5, '#c9a24c', OUT, 1.4);
  ln(x - 20, top + 24, x + 20, top + 24, '#3a3340', 2.4); ln(x, top + 14, x, top + 34, '#3a3340', 2.4);
  ctx.save(); ctx.translate(x, top); ctx.rotate(.16 * Math.sin(t * .7) + .1 * Math.sin(t * 1.9));
  const sx = Math.cos(t * .4) * .5 + .5;                                   /* it swings round: the vane is seen edge-on and flat in turn */
  ctx.scale(.45 + .55 * sx, 1);
  ln(-30, 0, 30, 0, '#3a3340', 3.4); poly([[30, 0], [20, -7], [20, 7]], '#c23a2b', OUT, 1.4);
  ell(-32, 0, 9, 8, '#d8584a', OUT, 1.6); ln(-32, -8, -32, -13, '#5a3a22', 2); ell(-28, -12, 4, 2.2, '#4fa85a', null, 0, -.4);
  ctx.restore();
}
SCENERY.roof = (t, o, V) => {
  if (!seen(V, -20, 200, 1100, 366)) return;
  const c = roofCache();
  ctx.drawImage(c.cv, c.x0, c.y0, c.w, c.h);
  chimneySmoke(t); weathervane(t);
  /* the sign (hero text when it is whole on screen and clear of the pill and the captions) and its marquee bulbs */
  const bx = 200, by = 250, bw = 680, bh = 80, ga = heroNow(bx, by, bx + bw, by + bh, 34) ? 1 : dressGuard(bx - 8, by - 10, bx + bw + 8, by + bh + 10);
  ctx.save(); ctx.globalAlpha *= ga;
  for (let i = 0; i <= 24; i++) { const x = bx + 8 + i * (bw - 16) / 24, on = (Math.floor(t * 2.5 + i * .5) % 2) === 0; for (const y of [by - 6, by + bh + 6]) { ell(x, y, 3, 3, on ? '#ffe9a8' : '#c8a860', 'rgba(60,30,10,.6)', .8); if (on) V2.glow(x, y, 16, '255,226,150', .5, 'screen', .2); } }
  plate([bx, by, bw, bh], 'FRUIT BOWL REHAB & NURSING', { fill: '#24402e', stroke: '#d9b45a', lw: 5, ink: '#f2e8cf', size: 38, spacing: 1.5, pad: 10, r: 14, shadow: 12, id: 'k14.roofsign', heroSize: 34, guard: false });
  ctx.restore();
};

// ------------------------------------------------------------------------------------------------ the lot: plinth, sidewalk, curb, asphalt, the bays, a tree, a bench, the RESERVED sign
const LOT = { y0: 1342, curb: 1406, asphalt: 1420, bayY0: 1436, bayY1: 1524, bays: [[24, 474], [534, 984]], lane: 1590, dash: 1690 };
S14.LOT = LOT;
SCENERY.lot = (t, o, V) => {
  const y0 = LOT.y0, X = -1200, WW = 5200;
  if (V.y1 < y0) return;
  /* plinth of stone blocks */
  ctx.fillStyle = vg(y0, y0 + 24, '#a09b92', '#7d796f'); ctx.fillRect(X, y0, WW, 24);
  for (let x = X; x < X + WW; x += 64) { ln(x, y0, x, y0 + 12, 'rgba(40,36,30,.35)', 1.4, 'butt'); ln(x + 32, y0 + 12, x + 32, y0 + 24, 'rgba(40,36,30,.35)', 1.4, 'butt'); } ln(X, y0 + 12, X + WW, y0 + 12, 'rgba(40,36,30,.35)', 1.4, 'butt'); ln(X, y0 + 1, X + WW, y0 + 1, 'rgba(255,255,255,.25)', 1.6, 'butt');
  /* sidewalk */
  ctx.fillStyle = vg(y0 + 24, LOT.curb, '#dcd7c9', '#c2bdaf'); ctx.fillRect(X, y0 + 24, WW, LOT.curb - y0 - 24);
  for (let x = X; x < X + WW; x += 130) ln(x, y0 + 24, x - 8, LOT.curb, 'rgba(90,84,70,.3)', 1.4, 'butt');
  /* shrubs along the plinth */
  for (const sx of [110, 330, 650, 900]) for (let i = 0; i < 3; i++) ell(sx + i * 30 - 30, y0 + 22, 26, 20, vg(y0, y0 + 40, '#5fb067', '#2f7a42'), 'rgba(10,50,20,.55)', 1.5);
  /* curb */
  ctx.fillStyle = '#ebe7db'; ctx.fillRect(X, LOT.curb, WW, 8); ctx.fillStyle = '#9d988c'; ctx.fillRect(X, LOT.curb + 8, WW, LOT.asphalt - LOT.curb - 8); ctx.fillStyle = '#f2c230'; ctx.fillRect(540, LOT.curb + 8, 130, LOT.asphalt - LOT.curb - 8);
  /* asphalt, stains, cracks */
  ctx.fillStyle = vg(LOT.asphalt, 2400, '#707589', '#454a5a'); ctx.fillRect(X, LOT.asphalt, WW, 1100);
  const r = rnd(31); for (let i = 0; i < 14; i++) { const x = -600 + r() * 2200, y = 1450 + r() * 420; ctx.fillStyle = `rgba(30,32,44,${.06 + r() * .08})`; ctx.beginPath(); ctx.ellipse(x, y, 20 + r() * 50, 5 + r() * 12, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(30,32,44,.4)'; ctx.lineWidth = 1.6; for (let i = 0; i < 5; i++) { let x = 100 + r() * 800, y = 1580 + r() * 200; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - .3) * 40; y += (r() - .5) * 14; ctx.lineTo(x, y); } ctx.stroke(); }
  /* the bays: painted on three sides */
  ctx.strokeStyle = 'rgba(255,255,255,.82)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
  for (const [a, b] of LOT.bays) { ctx.beginPath(); ctx.moveTo(a, LOT.bayY0); ctx.lineTo(a, LOT.bayY1); ctx.lineTo(b, LOT.bayY1); ctx.lineTo(b, LOT.bayY0); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,214,70,.8)'; ctx.setLineDash([46, 34]); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X, LOT.dash); ctx.lineTo(X + WW, LOT.dash); ctx.stroke(); ctx.setLineDash([]);
  /* the island at the right: grass, a small round tree, a bench */
  ctx.beginPath(); ctx.ellipse(1060, 1478, 150, 58, 0, 0, TAU); ctx.fillStyle = vg(1420, 1536, '#78c070', '#4a9a52'); ctx.fill(); ctx.strokeStyle = '#d7d2c4'; ctx.lineWidth = 6; ctx.stroke();
  fsh(1034, 1486, 120, .3, 10); ln(1034, 1486, 1034, 1430, '#6a4a2e', 11); const cx = 1034, cy = 1394; for (const [dx, dy, rr0] of [[-26, 10, 34], [26, 10, 34], [0, -14, 40], [0, 8, 44]]) ell(cx + dx, cy + dy, rr0, rr0, vg(cy - 50, cy + 50, '#79c776', '#3d8f4c'), 'rgba(10,50,20,.5)', 1.6);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(cx - 14, cy - 14, 16, 10, -.5, 0, TAU); ctx.fill();
  const bxx = 880, byy = 1488; fsh(bxx, byy + 2, 130, .3, 8);
  for (const dx of [-52, 52]) { ln(bxx + dx, byy, bxx + dx, byy - 22, '#3a3340', 5); }
  rb(bxx - 62, byy - 40, 124, 10, '#4f9a5a', { r: 3, lw: 1.6 }); rb(bxx - 62, byy - 26, 124, 10, '#4f9a5a', { r: 3, lw: 1.6 }); rb(bxx - 62, byy - 58, 124, 12, '#5fae6a', { r: 3, lw: 1.6 });
  /* the sign on its short post: RESERVED, ADMINISTRATOR (the best bay) */
  const sx = 516, sy = 1342, sw = 168, sh = 82, camY = CAM ? CAM.y : 960, show = o.lotSign != null ? !!o.lotSign : camY > 1380;   /* at the wide and room shots it would sit under the speaker chip, so by default it is drawn only when the camera is aimed at the lot */
  if (!show) return;
  fsh(sx, 1488, 44, .3, 6); rb(sx - 6, sy + sh - 4, 12, 142 - sh + 4, '#6a6f7a', { r: 3, lw: 1.6 });
  plate([sx - sw / 2, sy, sw, sh], [{ t: 'RESERVED', size: 24 }, { t: 'ADMINISTRATOR', size: 16.5, weight: 800 }], { fill: '#1f4fa0', stroke: '#ffffff', lw: 4, ink: '#ffffff', r: 8, pad: 8, heroSize: 15, id: 'k14.reserved' });
};

// ================================================================================================ the State's car: a white sedan seen from the side, a slate-blue door panel and a star
/* S14.carGeom(car) -> where the car is: { x, y (the wheels' contact line), s, k, door, exit: [x, y] (where a character stands when stepping out of the driver's door), doorX, nose, tail }.
 * car = a number (x, parked) or { x, k (0 on the lane .. 1 pulled into the bay), door (0..1) }; the bay is the Administrator's RESERVED one (x 24..474), which is where the State parks. */
S14.carGeom = (car) => {
  const c = typeof car === 'number' ? { x: car, k: 1 } : (car || {}), k = clamp01(c.k ?? 1), x = c.x ?? 225, e = easeIO(k), y = lerp(LOT.lane, 1500, e), s = lerp(1.06, 1, e), door = clamp01(c.door ?? 0);
  return { x, y, s, k, door, exit: [x + 44 * s, y + 38 * s], doorX: x + 38 * s, nose: x + 196 * s, tail: x - 196 * s };
};
function carBody() {
  ctx.beginPath(); ctx.moveTo(-186, -24); ctx.quadraticCurveTo(-196, -28, -196, -42); ctx.lineTo(-195, -60); ctx.quadraticCurveTo(-193, -70, -170, -72); ctx.lineTo(-114, -75);
  ctx.quadraticCurveTo(-96, -92, -72, -120); ctx.quadraticCurveTo(-66, -127, -56, -127); ctx.lineTo(30, -127); ctx.quadraticCurveTo(42, -127, 52, -116); ctx.lineTo(92, -77);
  ctx.quadraticCurveTo(100, -73, 112, -72); ctx.lineTo(168, -66); ctx.quadraticCurveTo(190, -62, 194, -46); ctx.quadraticCurveTo(197, -30, 186, -24); ctx.closePath();
}
function carWheel(cx, spin) {
  ell(cx, -27, 33, 33, '#26222c'); ell(cx, -27, 27, 27, '#1d1a22', '#0c0a10', 1.4); ell(cx, -27, 17, 17, vg(-44, -10, '#e6ebf0', '#9aa4ae'), '#6a727c', 1.2);
  for (let i = 0; i < 5; i++) { const a = spin + i * TAU / 5; ln(cx, -27, cx + Math.cos(a) * 15, -27 + Math.sin(a) * 15, 'rgba(70,78,88,.8)', 2.6, 'round'); } ell(cx, -27, 4, 4, '#c9d0d8', '#5a626c', 1);
}
function carLeaf(door) {
  const th = door * 1.05, c = Math.cos(th), sn = Math.sin(th), hx = 88, w = 98, xf = hx - w * c;
    const q = [[xf, -118 - 10 * sn], [hx, -118], [hx, -26], [xf, -22 + 12 * sn]];
    poly(q, hg(xf, hx, '#c9cfd6', '#eef1f3'), OUT, 2);
    poly([[xf + (hx - xf) * .08, -108 - 8 * sn], [xf + (hx - xf) * .86, -108], [xf + (hx - xf) * .86, -82], [xf + (hx - xf) * .08, -82]], vg(-110, -80, '#b4e0f8', '#5a8ec0'), 'rgba(20,24,34,.85)', 1.6);
    poly([[xf, -66 - 5 * sn], [hx, -66], [hx, -38], [xf, -36 + 6 * sn]], '#33527a', 'rgba(255,255,255,.7)', 1.2);
}
/* o.leaf: 'all' (default) draws the whole car, 'none' leaves the open driver's door leaf out, 'only' draws just that leaf (the scene draws it over the person stepping out) */
function drawCar(x, y, s, o = {}) {
  const door = clamp01(o.door ?? 0), spin = x / 27, leaf = o.leaf || 'all';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (leaf === 'only') { if (door > .02) carLeaf(door); ctx.restore(); return; }
  fsh(0, 3, 440, .42, 16);
  carWheel(-120, spin); carWheel(118, spin);                                  /* the far side is hidden by the body; these are the near wheels, drawn over the arches below */
  ctx.save(); carBody(); ctx.fillStyle = vg(-127, -22, '#ffffff', '#cfd5da'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(-200, -34, 400, 12); ln(-196, -73, 194, -66, 'rgba(255,255,255,.9)', 1.6);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(-60, -125); ctx.lineTo(20, -125); ctx.lineTo(-4, -80); ctx.lineTo(-84, -80); ctx.fill();
  ctx.restore();
  /* wheel arches over the wheels */
  for (const cx of [-120, 118]) { ctx.save(); ctx.beginPath(); ctx.rect(cx - 36, -66, 72, 40); ctx.clip(); ctx.beginPath(); ctx.arc(cx, -27, 34, PI, TAU); ctx.fillStyle = '#26222c'; ctx.fill(); ctx.restore(); }
  carWheel(-120, spin); carWheel(118, spin);
  /* the slate-blue door panel with the white star (the lettering is live) */
  const doorOpen = door > .02;
  rb(-100, -66, 188, 28, '#33527a', { r: 4, lw: 1.6, flat: true }); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.roundRect(-97, -63, 182, 22, 3); ctx.stroke();
  star(-82, -52, 9, 4, '#ffffff', null);
  if (!doorOpen) dress('STATE SURVEY AGENCY', 4, -51.6, 11, { fill: '#ffffff', maxW: 138, spacing: 1 });
  /* windows and door seams */
  const glass = pts => { poly(pts, vg(-120, -78, '#b4e0f8', '#5a8ec0'), 'rgba(20,24,34,.85)', 2); ctx.fillStyle = 'rgba(255,255,255,.34)'; ctx.beginPath(); ctx.moveTo(pts[1][0] - 12, pts[1][1]); ctx.lineTo(pts[1][0] - 2, pts[1][1]); ctx.lineTo(pts[0][0] + 8, pts[0][1]); ctx.lineTo(pts[0][0] - 2, pts[0][1]); ctx.fill(); };
  glass([[-108, -79], [-72, -118], [-20, -118], [-18, -79]]);
  if (!doorOpen) glass([[-9, -79], [-7, -118], [31, -118], [50, -108], [86, -79]]);
  for (const sx of [-110, -14]) ln(sx, -76, sx, -26, 'rgba(20,24,34,.6)', 1.5, 'butt');
  if (!doorOpen) { ln(88, -76, 88, -26, 'rgba(20,24,34,.6)', 1.5, 'butt'); rb(70, -72, 14, 4, '#9aa4ae', { r: 2, lw: 1, flat: true }); }
  rb(-34, -72, 14, 4, '#9aa4ae', { r: 2, lw: 1, flat: true }); rb(88, -102, 12, 9, '#e6ebf0', { r: 3, lw: 1.3 });
  /* the front: grille, bumper, headlight, and the tail light */
  rb(176, -38, 20, 14, '#2a2f38', { r: 4, lw: 1.5 }); ell(186, -56, 8, 5, '#fffbe0', 'rgba(60,50,20,.7)', 1.2); rb(-197, -64, 6, 14, '#d8342c', { r: 2, lw: 1.1 }); rb(-198, -34, 12, 9, '#2a2f38', { r: 3, lw: 1.3 });
  if (o.lights) V2.glow(x + 190 * s, y - 56 * s, 70 * s, '255,240,190', .5, 'screen', .6);
  /* the driver's door, swung open toward us: the opening shows the dark cabin and a seat, the leaf narrows with the angle and stands taller at its free edge */
  if (doorOpen) {
    poly([[-9, -79], [-7, -118], [31, -118], [50, -108], [86, -79], [88, -26], [-12, -26]], '#252b36');
    rb(20, -92, 30, 40, '#4a5262', { r: 6, lw: 1.4 }); rb(10, -112, 16, 26, '#59627a', { r: 6, lw: 1.4 });
  }
  if (doorOpen && leaf === 'all') carLeaf(door);
  ctx.restore();
}
SCENERY.car = (t, o, V) => {
  if (o.car == null || o.car === false) return;
  const c = typeof o.car === 'number' ? { x: o.car, k: 1 } : o.car, g = S14.carGeom(Object.assign({}, c, { door: o.carDoor ?? c.door }));
  if (!seen(V, g.tail - 60, g.y - 140 * g.s, g.nose + 60, g.y + 40)) return;
  drawCar(g.x, g.y, g.s, { door: g.door, lights: (c.k ?? 1) < 1 || o.carLights, leaf: o.carLeaf === 'front' ? 'none' : 'all' });
};
S14._carLeafFront = (o, V) => {
  if (o.car == null || o.car === false || o.carLeaf !== 'front') return;
  const c = typeof o.car === 'number' ? { x: o.car, k: 1 } : o.car, g = S14.carGeom(Object.assign({}, c, { door: o.carDoor ?? c.door }));
  if (g.door > .02 && seen(V, g.tail - 60, g.y - 140 * g.s, g.nose + 60, g.y + 40)) drawCar(g.x, g.y, g.s, { door: g.door, leaf: 'only' });
};

// ================================================================================================ live layers: dressing text, animated bits; and the front layers (desks, counters, tables)
function inRoom(r, fn) { ctx.save(); ctx.translate(r.x0, r.y0); fn(); ctx.restore(); }
/* the scene's clock string ('3:02 PM') as hours and minutes, for the clock on the station wall (st.time = 'H:MM' overrides) */
function clockNow(st) {
  const s = st.time || (CUR && (EP.SCENES[CUR.id] && EP.SCENES[CUR.id].clock ? EP.SCENES[CUR.id].clock(T - CUR.start) : CUR.clock)) || '3:02 PM', m = /(\d+):(\d+)/.exec(s);
  return m ? { h: +m[1] % 12, m: +m[2] } : { h: 3, m: 2 };
}
/* a seven-segment digit (the Q sign's red numerals; same look as S7.qSign) */
const SEG7 = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function digit7(x, y, w, h, d, on = 1) {
  const lw = Math.max(2.4, w * .16), i = lw * .55, m = h / 2;
  const sg = { a: [x + i, y, x + w - i, y], b: [x + w, y + i, x + w, y + m - i], c: [x + w, y + m + i, x + w, y + h - i], d: [x + i, y + h, x + w - i, y + h], e: [x, y + m + i, x, y + h - i], f: [x, y + i, x, y + m - i], g: [x + i, y + m, x + w - i, y + m] };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = lw;
  for (const [nm, [ax, ay, bx, by]] of Object.entries(sg)) { ctx.strokeStyle = d != null && SEG7[d].includes(nm) ? `rgba(255,60,60,${.6 + .4 * on})` : 'rgba(80,16,16,.55)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
  ctx.restore();
}
/* a lit call-light dome at (x, y): level 0..1 (1 = lit and pulsing) */
function domeLive(x, y, level, t, i) {
  if (level <= 0) return;
  const p = level >= 1 ? .65 + .35 * Math.sin(t * 9 + i * 1.7) : level;
  ell(x, y, 4.8, 4.8, `rgb(255,${70 + 60 * (1 - p) | 0},${50 + 40 * (1 - p) | 0})`, '#5a1410', 1); ell(x - 1.2, y - 1.4, 1.6, 1.6, 'rgba(255,255,255,.8)');
  V2.glow(x, y, 26, '255,60,48', .8 * p, 'screen', .8);
}

LIVE.office = (r) => inRoom(r, () => {
  dress('FY BUDGET', 99, 62.4, 7, { fill: '#2a2230' });
  dress('PIZZA 97%', 79, 105.4, 5.8, { align: 'left', fill: '#4a3a2a' }); dress('OTHER 3%', 79, 112.4, 5.8, { align: 'left', fill: '#4a3a2a' });
});
LIVE.conf = (r) => inRoom(r, () => {
  dress('IN-SERVICE', 71, 69, 11.2, { fill: '#2b5fc2' }); dress('TODAY:', 71, 85, 11.2, { fill: '#26242c' }); dress('MANDATORY', 71, 101, 11.2, { fill: '#c23a2b' });
  ln(36, 108.5, 106, 107.5, '#c23a2b', 1.5);
});
LIVE.rest = (r) => inRoom(r, () => {
  dress('2019', 139, 77.5, 9, { fill: '#8a2a2a' });
  const o = { fill: '#c23a2b', maxW: 42 };
  dress('STAFF MAY', 193, 84, 7.4, o); dress('NOT ENTER', 193, 94, 7.4, o); dress('DURING', 193, 104, 7.4, o); dress('A SHIFT', 193, 114, 7.4, o); dress('POLICY 14.3', 193, 125, 6.2, { fill: '#2a2230', maxW: 42 });
  dress('BACK IN', 192, 144.6, 6.2, { fill: '#3a2a10', rot: -.07 }); dress('30 MIN', 192.4, 152, 6.2, { fill: '#3a2a10', rot: -.07 });
});
LIVE.r4 = (r, t, st) => inRoom(r, () => {
  dress('FALL', 101, 46, 14, { fill: '#1d1a22' }); dress('RISK', 101, 61, 14, { fill: '#1d1a22' });
  const pa = st.peel ?? 1;   /* the banana peel on the floor: a decal; rooms.r4.peel 0 hides it (1 shows it) */
  if (pa > 0) { ctx.save(); ctx.globalAlpha *= clamp01(pa);
  ctx.save(); ctx.translate(200, 301); ctx.scale(1, .36);
  for (const a of [-2.5, -.6, .9, 2.2]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -6, 30, -2); ctx.quadraticCurveTo(26, 8, 4, 6); ctx.closePath(); ctx.fillStyle = vg(-6, 8, '#fbe06a', '#e8b82a'); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,10,.8)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.fillStyle = '#7a4a1a'; ctx.beginPath(); ctx.arc(28, 1, 3.4, 0, TAU); ctx.fill(); ctx.restore(); }
  ell(0, 0, 7, 6, '#f0cc42', 'rgba(90,60,10,.8)', 2.4); ctx.restore();
  ctx.restore(); }
});
LIVE.r7 = (r) => inRoom(r, () => { dress('1962', 67, 84, 9.5, { fill: '#7a2a2a' }); });
LIVE.lobby = (r, t, st) => inRoom(r, () => {
  dress('WELCOME BACK STRAWBERY', 129, 42.5, 11.5, { fill: '#8a2a20', maxW: 184, spacing: .5 });
  const k = clamp01(st.car ?? 0);   /* the white sedan seen through the glass doors on the lot (rooms.lobby.car 0..1: how far it has rolled in from the left) */
  if (k > 0) { ctx.save(); ctx.beginPath(); ctx.rect(31, 71, 98, 200); ctx.clip(); drawCar(lerp(-10, 80, easeOut(k)), 262, .17, { leaf: 'none' }); ctx.restore(); }
});
LIVE.dining = (r) => inRoom(r, () => {
  const c = '#f2f0e0'; dress("TODAY'S MENU", 91, 51, 8.4, { fill: c, spacing: 1 }); ln(44, 57.5, 138, 57.5, 'rgba(242,240,224,.5)', 1);
  dress('PUREED MEATLOAF', 91, 71, 10.5, { fill: c, maxW: 104 }); dress('(SHAPE OF THE MOLD)', 91, 88, 7.6, { fill: 'rgba(242,240,224,.85)', maxW: 104 });
});
LIVE.station = (r, t, st) => inRoom(r, () => {
  const calls = st.calls || [];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) domeLive(45 + i * 13.5, 64 + j * 12.6, calls[j * 8 + i] || 0, t, j * 8 + i);
  dress('CALL LIGHTS', 92, 43, 8.4, { fill: '#c8d2e0', spacing: 1 });
  /* the assignment on the whiteboard */
  dress('ASSIGNMENT', 224, 54, 9, { fill: '#26242c' }); ln(184, 60.5, 264, 60.5, 'rgba(40,40,50,.5)', 1.2);
  dress('LEMON   1 - 20', 182, 72, 8.6, { align: 'left', fill: '#2b5fc2' }); dress('STRAW  21 - 30', 182, 85, 8.6, { align: 'left', fill: '#c23a2b' }); dress('CLEM   31 - 40', 182, 98, 8.6, { align: 'left', fill: '#26242c' }); dress('MANGO  LOBBY', 182, 110, 8.6, { align: 'left', fill: '#2a7a4a' });
  /* the clock: hour, minute, and a sweeping second hand */
  const { h, m } = clockNow(st), sec = (t * 1) % 60, hx = 318, hy = 66;
  const hand = (a, len, lw, c) => ln(hx, hy, hx + Math.sin(a) * len, hy - Math.cos(a) * len, c, lw);
  hand((h + m / 60) / 12 * TAU, 9, 2.6, '#2a2630'); hand(m / 60 * TAU, 13.5, 1.9, '#2a2630'); hand(sec / 60 * TAU, 14.5, 1, '#c23a2b'); ell(hx, hy, 1.8, 1.8, '#2a2630');
  /* the Q sign: HOURS SINCE THE Q WORD and two red digits */
  dress('HOURS SINCE THE Q WORD', 400, 45.5, 7.4, { fill: 'rgba(255,255,255,.9)', maxW: 98, spacing: .4 });
  const hrs = Math.max(0, Math.round(st.qHours ?? 41)), dg = [Math.floor(hrs / 10) % 10, hrs % 10];
  V2.glow(400, 80, 52, '255,50,50', .22 * (st.qFlicker ?? 1), 'screen', .35);
  dg.forEach((d, i) => digit7(380 + i * 24, 62, 17, 34, hrs < 10 && i === 0 ? null : d, st.qFlicker ?? 1));
  /* steam over the coffee */
  for (let i = 0; i < 3; i++) { const ph = ((t * .5 + i / 3) % 1), a = .4 * Math.sin(ph * PI); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(480 + Math.sin(ph * 6 + i) * 2, 194 - ph * 24); ctx.quadraticCurveTo(483 + Math.sin(ph * 6 + i + 1) * 3, 186 - ph * 24, 480, 178 - ph * 24); ctx.stroke(); }
});

// ------------------------------------------------------------------------------------------------ front layers: they are drawn over the characters (S14.front)
/* the Administrator's desk: walnut, a leather blotter, a banker's lamp, the pizza box, a landline. o.rooms.office.desk === false leaves it out */
FRONT.office = (r, t, st) => {
  if (st.desk === false) return;
  inRoom(r, () => {
    fsh(150, 292, 196, .3, 7);
    poly([[70, 212], [232, 212], [243, 226], [59, 226]], vg(212, 226, '#8f5e3a', '#7a4a2e'), OUT, 1.8);
    poly([[114, 216], [186, 216], [193, 224], [107, 224]], '#2f5a46', 'rgba(217,180,90,.9)', 1.2);
    rb(59, 226, 184, 60, '#6a4128', { r: 3, lw: 2 });
    for (const x of [65, 191]) for (let i = 0; i < 3; i++) { rb(x, 232 + i * 17.5, 46, 15, '#7e4e30', { r: 2, lw: 1.4 }); rb(x + 16, 237.5 + i * 17.5, 14, 3, '#d9b45a', { r: 1.5, lw: 1 }); }
    rb(117, 232, 68, 48, '#5a3620', { r: 3, lw: 1.4 }); ctx.strokeStyle = 'rgba(217,180,90,.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(124, 238, 54, 36);
    ln(59, 226.6, 243, 226.6, '#d9b45a', 2.2, 'butt'); ln(60, 285, 242, 285, 'rgba(0,0,0,.3)', 3, 'butt');
    /* the pizza box, open, a slice gone */
    poly([[74, 214], [126, 214], [131, 221], [69, 221]], '#e6cf9c', OUT, 1.3); ell(100, 217.4, 24, 3.8, '#f0a43a', '#8b4a12', 1); for (const x of [90, 100, 110, 96, 106]) ell(x, 217.4 + (x % 3 - 1) * .8, 2.4, 1.2, '#c23a2b'); poly([[100, 217.4], [111, 214.6], [114, 218.6]], '#e6cf9c');
    poly([[76, 214], [124, 214], [122, 197], [78, 197]], '#fbf3e0', OUT, 1.4); ell(100, 206, 8, 6, '#c23a2b', null); ell(100, 206, 5.4, 3.8, '#f6d68a', null); ln(80, 200, 120, 200, '#c23a2b', 1.4);
    /* the banker's lamp, at the right end of the desk, clear of the sitter's face */
    ell(188, 215, 8, 2.4, '#b8903a', OUT, 1.2); ln(188, 215, 188, 203, '#b8903a', 2.4); rb(178, 191, 20, 12, '#2f7a54', { r: 5, lw: 1.5 }); ctx.fillStyle = 'rgba(255,236,170,.5)'; ctx.fillRect(181, 193, 14, 8);
    /* the landline */
    rb(208, 207, 26, 9, '#e6dcc4', { r: 3, lw: 1.4 }); rb(206, 200, 30, 7, '#d8ccb0', { r: 3.4, lw: 1.3 }); for (let i = 0; i < 6; i++) ell(213 + (i % 3) * 7, 210.4 + Math.floor(i / 3) * 2.6, 1.2, 1, '#8a7a5a'); ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(236, 204); ctx.quadraticCurveTo(246, 212, 238, 220); ctx.stroke();
    V2.glow(188, 198, 70, '255,226,160', .32, 'screen', .25);
  });
};
/* the lobby's front desk, with the sign-in binder and the bell. o.rooms.lobby.desk === false leaves it out */
FRONT.lobby = (r, t, st) => {
  if (st.desk === false) return;
  inRoom(r, () => {
    fsh(188, 296, 112, .3, 7);
    poly([[140, 220], [236, 220], [244, 232], [132, 232]], vg(220, 232, '#f0e2bc', '#dfcf9c'), OUT, 1.7);
    rb(132, 232, 112, 58, '#4a7a64', { r: 3, lw: 2 }); for (let i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.3; ctx.strokeRect(139 + i * 26, 240, 21, 42); } ln(132, 232.6, 244, 232.6, '#d9b45a', 2.2, 'butt');
    /* the sign-in binder, open */
    poly([[146, 224], [178, 224], [182, 230], [142, 230]], '#fbf7ea', OUT, 1.2); ln(162, 224, 162, 230, 'rgba(0,0,0,.35)', 1); for (let i = 0; i < 3; i++) { ln(147 + i * .6, 225.4 + i * 1.7, 160, 225.4 + i * 1.7, 'rgba(40,60,140,.55)', .9); ln(165, 225.4 + i * 1.7, 178, 225.4 + i * 1.7, 'rgba(40,60,140,.55)', .9); }
    poly([[144, 230], [180, 230], [182, 233], [142, 233]], '#2a3f78', OUT, 1);
    /* the bell and a cup of pens */
    ctx.beginPath(); ctx.ellipse(204, 226, 9, 3, 0, 0, TAU); ctx.fillStyle = '#b8903a'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); ctx.beginPath(); ctx.ellipse(204, 223, 7.4, 6, 0, PI, TAU); ctx.fillStyle = vg(217, 224, '#f0d66a', '#c9a23a'); ctx.fill(); ctx.stroke(); ell(204, 216.4, 1.6, 1.6, '#8a6a1a');
    rb(222, 216, 9, 12, '#c25f4a', { r: 2, lw: 1.2 }); for (const [dx, c] of [[-2, '#2b5fc2'], [1, '#c23a2b'], [3.4, '#26242c']]) ln(226.5 + dx, 216, 226.5 + dx * 1.6, 208, c, 1.4);
    /* a tent card: PLEASE SIGN IN */
    poly([[212, 223], [222, 223], [221, 215], [213, 215]], '#fbf7ea', OUT, 1);
  });
};
/* the nurses' station counter: wood panels, a laminate top, a brass plate; the staff stand behind it. o.rooms.station.counter === false leaves it out */
FRONT.station = (r, t, st) => {
  if (st.counter === false) return;
  inRoom(r, () => {
    const w = r.w, x0 = 14, x1 = w - 14, CT = 240;       /* CT: the back edge of the counter top; its front edge is 12 px lower, at v 252 */
    fsh(w / 2, 312, w - 20, .34, 9);
    poly([[x0 + 4, CT], [x1 - 4, CT], [x1 + 6, CT + 12], [x0 - 6, CT + 12]], vg(CT, CT + 12, '#f2e8c8', '#dccfa0'), OUT, 1.8);
    rb(x0 - 6, CT + 12, x1 - x0 + 12, 58, '#bf935c', { r: 3, lw: 2 });
    for (let x = x0 + 6; x < x1 - 14; x += 34) { ctx.strokeStyle = 'rgba(80,50,20,.38)'; ctx.lineWidth = 1.4; ctx.strokeRect(x, CT + 20, 28, 40); ctx.strokeStyle = 'rgba(255,230,190,.25)'; ctx.lineWidth = 1; ctx.strokeRect(x + 1.4, CT + 21.4, 25.2, 37.2); }
    rb(x0 - 6, 300, x1 - x0 + 12, 12, '#3a2a22', { r: 2, lw: 1.6 }); ln(x0 - 6, CT + 12.6, x1 + 6, CT + 12.6, '#d9b45a', 2.4, 'butt');
    plate([w / 2 - 66, CT + 22, 132, 26], "NURSES' STATION", { fill: '#d9b45a', stroke: '#7a5a1a', lw: 1.6, ink: '#3a2a10', size: 13, r: 4, pad: 3, hero: false });
    /* on the counter: the phone, a stack of charts, a mug, a call bell */
    rb(72, CT - 12, 24, 9, '#2a2f38', { r: 3, lw: 1.3 }); rb(70, CT - 18, 28, 7, '#3a4150', { r: 3.4, lw: 1.2 });
    for (let i = 0; i < 5; i++) rb(112 + i * .8, CT - 5 - i * 2.2, 36, 3, ['#f4efe0', '#e9f0f7', '#f7ead8', '#eef4e6', '#f4efe0'][i], { r: 1, lw: 1, flat: true });
    rb(w - 130, CT - 12, 9, 11, '#e7e2d6', { r: 2, lw: 1.2 }); ell(w - 100, CT - 2, 8, 2.6, '#b8903a', OUT, 1.1); ell(w - 100, CT - 4.4, 6, 4, '#f0d66a', OUT, 1.1);
  });
};
/* the dining table: gingham cloth, place settings, a vase of flowers; the residents sit behind it. o.rooms.dining.table === false leaves it out */
FRONT.dining = (r, t, st) => {
  if (st.table === false) return;
  inRoom(r, () => {
    fsh(100, 296, 190, .3, 8);
    poly([[18, 238], [186, 238], [196, 254], [8, 254]], '#f6f0e0', OUT, 1.8);
    ctx.save(); path([[18, 238], [186, 238], [196, 254], [8, 254]]); ctx.clip(); ctx.fillStyle = 'rgba(214,72,72,.28)'; for (let x = -4; x < 200; x += 16) ctx.fillRect(x, 236, 8, 20); for (let y = 238; y < 256; y += 10) ctx.fillRect(0, y, 200, 5); ctx.restore();
    ctx.beginPath(); ctx.moveTo(8, 254); ctx.lineTo(196, 254); ctx.lineTo(196, 288); for (let i = 0; i <= 12; i++) ctx.lineTo(196 - i * 15.67, 288 + (i % 2 ? 0 : 5)); ctx.lineTo(8, 254); ctx.closePath(); ctx.fillStyle = '#f2ead6'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(214,72,72,.28)'; for (let x = 2; x < 200; x += 16) ctx.fillRect(x, 254, 8, 40); for (let y = 254; y < 294; y += 10) ctx.fillRect(0, y, 200, 5); ctx.restore();
    for (const x of [44, 84, 124, 160]) { ell(x, 242.5, 11, 2.8, '#ffffff', OUT, 1.2); ell(x, 242.5, 7.6, 1.8, 'rgba(120,150,200,.35)'); ell(x + 12, 241.6, 3.4, 1.6, '#c9d4e0', OUT, 1); rb(x - 16, 241, 5, 3, '#c23a2b', { r: 1, lw: .8, flat: true }); }
    ln(102, 240, 102, 226, '#4a8a5a', 1.8); rb(96, 232, 12, 9, '#9ad0e6', { r: 3, lw: 1.3 }); for (const [dx, dy, c] of [[-4, -3, '#e0583d'], [3, -5, '#f0c23a'], [0, -8, '#c25fa0'], [-6, -8, '#f6f0e0']]) ell(102 + dx, 226 + dy, 3.2, 3.2, c, 'rgba(60,20,20,.5)', .8);
  });
};

// ================================================================================================ the shower room: the stash, the glass front, the door
/* Stash sprites: each is drawn around its own origin, which is the bottom centre of the item (feet on the floor), facing the viewer. Units are scene px at zoom 1 (about 1.9 x a standing adult's hand). */
const ITEM = {};
ITEM.box = (o = {}) => {
  const w = o.w ?? 50, h = o.h ?? 40, c = o.color ?? '#c99a62';
  rb(-w / 2, -h, w, h, c, { r: 2.5, lw: 1.7 });
  ctx.fillStyle = shade(c, .84); ctx.fillRect(-w / 2 + 1, -h + 1, w - 2, 6); ln(-w / 2 + 2, -h + 7, w / 2 - 2, -h + 7, 'rgba(60,35,10,.4)', 1.2);
  ctx.fillStyle = 'rgba(240,222,176,.8)'; ctx.fillRect(-4, -h, 8, h * .6); ln(-4, -h, -4, -h + h * .6, 'rgba(60,35,10,.3)', .8); ln(4, -h, 4, -h + h * .6, 'rgba(60,35,10,.3)', .8);
  rb(w / 2 - 17, -h + 12, 12, 9, '#f6f0e0', { r: 1, lw: .8, flat: true }); ln(w / 2 - 15, -h + 15.5, w / 2 - 8, -h + 15.5, 'rgba(40,40,60,.5)', 1); ln(w / 2 - 15, -h + 18.2, w / 2 - 10, -h + 18.2, 'rgba(40,40,60,.4)', 1);
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(-w / 2 + 1, -5, w - 2, 4);
};
ITEM.wheelchair = () => {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ln(-8, -34, 24, -26, '#3a4150', 3.4); ln(24, -26, 32, -12, '#3a4150', 3.4); rb(26, -14, 14, 4, '#5a6270', { r: 2, lw: 1.4 });   /* leg rest and plate */
  rb(-26, -38, 50, 8, '#2f4f8a', { r: 3, lw: 1.6 }); ctx.beginPath(); ctx.moveTo(-26, -38); ctx.lineTo(-24, -76); ctx.lineTo(-16, -76); ctx.lineTo(-14, -38); ctx.closePath(); ctx.fillStyle = hg(-26, -14, '#2a4478', '#3f65aa'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.7; ctx.stroke();
  ln(-24, -76, -36, -80, '#3a4150', 3.4); ln(-30, -54, 20, -54, '#3a4150', 3); rb(-10, -60, 26, 5, '#1d2230', { r: 2.5, lw: 1.3 });   /* handle, armrest */
  ell(26, -8, 8, 8, '#2a2630', OUT, 1.5); ell(26, -8, 3, 3, '#9aa0a8');
  ell(-12, -22, 22, 22, null, '#242028', 5); ell(-12, -22, 17, 17, null, '#aab2bc', 1.8); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ln(-12, -22, -12 + Math.cos(a) * 18, -22 + Math.sin(a) * 18, 'rgba(120,130,140,.75)', .9); } ell(-12, -22, 3.4, 3.4, '#aab2bc', OUT, 1);
};
ITEM.ivpole = () => {
  ln(-18, -3, 18, -3, '#8f98a2', 3.6); for (const x of [-18, 18]) { ln(x, -3, x, -1, '#8f98a2', 3); ell(x, 1, 3.4, 2.6, '#2a2630'); } ln(0, -3, 0, -134, '#c3ccd6', 3.8); ln(-1.2, -6, -1.2, -130, 'rgba(255,255,255,.7)', 1.1);
  ln(-15, -134, 15, -134, '#c3ccd6', 3.4); for (const x of [-15, 15]) { ln(x, -134, x, -128, '#c3ccd6', 2.6); }
  ctx.beginPath(); ctx.roundRect(-22, -126, 14, 28, 5); ctx.fillStyle = vg(-126, -98, 'rgba(210,235,250,.85)', 'rgba(150,200,230,.9)'); ctx.fill(); ctx.strokeStyle = 'rgba(40,70,100,.8)'; ctx.lineWidth = 1.3; ctx.stroke(); ln(-15, -98, -15, -88, 'rgba(60,90,120,.8)', 1.2); ctx.strokeStyle = 'rgba(60,90,120,.7)'; ctx.beginPath(); ctx.moveTo(-15, -88); ctx.quadraticCurveTo(-4, -70, -2, -40); ctx.stroke();
};
ITEM.fan = () => {
  rb(-26, -52, 52, 52, '#e8e4d6', { r: 5, lw: 1.8 }); ell(0, -26, 22, 22, '#d4d0c0', OUT, 1.4);
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(0, -26); ctx.rotate(i * PI / 2 + .5); ctx.beginPath(); ctx.ellipse(0, -10, 6.4, 11, 0, 0, TAU); ctx.fillStyle = 'rgba(170,200,230,.7)'; ctx.fill(); ctx.strokeStyle = 'rgba(40,60,90,.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
  for (const r of [21, 16, 11, 6]) ell(0, -26, r, r, null, 'rgba(60,66,76,.8)', 1.1); ell(0, -26, 3.4, 3.4, '#5a6270', OUT, 1); rb(-8, -56, 16, 4, '#9aa0a8', { r: 2, lw: 1.2 }); ell(-14, -46, 2, 2, '#c23a2b'); rb(-22, -2, 10, 3, '#2a2630', { r: 1.5, lw: 1, flat: true }); rb(12, -2, 10, 3, '#2a2630', { r: 1.5, lw: 1, flat: true });
};
ITEM.tree = () => {
  rb(-15, -74, 30, 74, '#b94a34', { r: 2.5, lw: 1.7 }); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(-15, -74, 30, 8);
  ctx.save(); ctx.beginPath(); ctx.rect(-15, -64, 30, 60); ctx.clip(); poly([[0, -58], [-9, -36], [-4, -36], [-11, -16], [11, -16], [4, -36], [9, -36]], '#2f8a4a', 'rgba(0,50,20,.7)', 1.2); ctx.restore(); star(0, -60, 4, 1.8, '#f0c23a', null);
  const br = [[-10, -70, -36, -96, 1], [-4, -72, -18, -108, 0], [2, -72, 6, -112, 1], [8, -72, 28, -104, 0], [12, -68, 40, -88, 1], [14, -54, 40, -56, 0], [-14, -50, -38, -62, 1]];
  for (const [x0, y0, x1, y1, tn] of br) { ctx.strokeStyle = '#256f3a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = '#4fb15e'; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); for (let i = 0; i < 5; i++) { const u = .25 + i * .18; ln(lerp(x0, x1, u) - 4, lerp(y0, y1, u) - 3, lerp(x0, x1, u) + 4, lerp(y0, y1, u) + 3, '#2f8a4a', 2.2); } if (tn) { ctx.strokeStyle = '#f0c23a'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(lerp(x0, x1, .2), lerp(y0, y1, .2)); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]); } ell(x1, y1, 2.2, 2.2, tn ? '#d8342c' : '#f0c23a'); }
};
ITEM.tv = () => {
  ln(-14, -80, -4, -48, '#aab2bc', 2); ln(14, -76, 4, -48, '#aab2bc', 2); ell(-14, -81, 2.6, 2.6, '#aab2bc'); ell(14, -77, 2.6, 2.6, '#aab2bc');
  rb(-31, -48, 62, 48, '#7a5636', { r: 5, lw: 1.9 }); ctx.beginPath(); ctx.roundRect(-26, -43, 36, 34, 8); ctx.fillStyle = vg(-43, -9, '#2a3a48', '#121a22'); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-16, -34, 8, 4, -.5, 0, TAU); ctx.fill();
  ell(21, -34, 4.4, 4.4, '#c9c0a8', OUT, 1.1); ell(21, -22, 4.4, 4.4, '#c9c0a8', OUT, 1.1); for (let i = 0; i < 4; i++) ln(15, -15 + i * 2.6, 27, -15 + i * 2.6, 'rgba(30,20,10,.6)', 1); rb(-24, -2, 8, 3, '#2a2630', { r: 1, lw: 1, flat: true }); rb(16, -2, 8, 3, '#2a2630', { r: 1, lw: 1, flat: true });
};
ITEM.bucket = () => {
  ln(-6, -30, -16, -128, '#b98a52', 3.6); ln(-5, -30, -15, -126, 'rgba(255,255,255,.3)', 1.1);
  ctx.beginPath(); ctx.moveTo(-20, -32); ctx.lineTo(20, -32); ctx.lineTo(15, -3); ctx.lineTo(-15, -3); ctx.closePath(); ctx.fillStyle = hg(-20, 20, '#e8b82a', '#f7d54a'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-16, -29, 5, 24);
  for (let i = 0; i < 7; i++) { const a = -2.3 + i * .33; ctx.strokeStyle = i % 2 ? '#b7bcc4' : '#d4d8de'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -32); ctx.quadraticCurveTo(-8 + Math.cos(a) * 12, -36 + Math.sin(a) * 6, -8 + Math.cos(a) * 18, -22 + Math.sin(a) * 4); ctx.stroke(); }
  rb(18, -26, 14, 10, '#7a828e', { r: 2, lw: 1.3 }); ln(32, -21, 36, -34, '#7a828e', 2.6); for (const x of [-12, 12]) ell(x, -1, 3.6, 3.6, '#2a2630', null);
};
ITEM.rail = () => {
  ctx.strokeStyle = '#c3cad8'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 6.4; ctx.beginPath(); ctx.rect(-18, -84, 36, 84); ctx.stroke(); ctx.strokeStyle = '#c3cad8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.rect(-18, -84, 36, 84); ctx.stroke();
  for (const y of [-56, -28]) { ln(-18, y, 18, y, OUT, 6, 'butt'); ln(-18, y, 18, y, '#c3cad8', 3.6, 'butt'); } ln(-6, -84, -6, 0, '#c3cad8', 3.4); ln(6, -84, 6, 0, '#c3cad8', 3.4); ln(-17, -82, -17, -4, 'rgba(255,255,255,.7)', 1); rb(-22, -6, 10, 8, '#8f98a2', { r: 2, lw: 1.2 });
};
ITEM.banner = () => {
  poly([[40, -9], [52, -9], [50, 20], [42, 17], [38, 22]], '#fff6dc', OUT, 1.4); ln(44, 2, 48, 2, '#c23a2b', 2);
  rb(-52, -18, 98, 18, '#f8ecd0', { r: 9, lw: 1.8 }); ell(-52, -9, 5, 9, '#d8c8a0', OUT, 1.4); for (const x of [-22, 22]) { rb(x - 3, -19, 6, 20, '#c23a2b', { r: 2, lw: 1.1 }); } ln(-46, -14, 38, -14, 'rgba(255,255,255,.5)', 1.4);
};
ITEM.qsign = () => {
  rb(-30, -34, 60, 34, '#15131c', { r: 3, lw: 1.8, stroke: 'rgba(255,255,255,.3)' }); ln(-26, -4, -26, 0, '#5a6270', 3); ln(26, -4, 26, 0, '#5a6270', 3);
  dress('HOURS SINCE THE Q WORD', 0, -27, 4.6, { fill: 'rgba(255,255,255,.85)', maxW: 54 }); digit7(-12, -22, 10, 17, 0, .2); digit7(2, -22, 10, 17, 0, .2);
};
ITEM.bag = () => {
  ctx.beginPath(); ctx.moveTo(-15, -2); ctx.quadraticCurveTo(-22, -24, -10, -34); ctx.quadraticCurveTo(-6, -42, -2, -40); ctx.quadraticCurveTo(0, -48, 4, -42); ctx.quadraticCurveTo(14, -34, 17, -16); ctx.quadraticCurveTo(18, -4, 8, -1); ctx.closePath(); ctx.fillStyle = hg(-20, 18, '#cfd6dc', '#f2f5f7'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.7; ctx.stroke(); ln(-4, -40, 4, -42, '#8a929c', 2.6); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.quadraticCurveTo(-12, -18, -8, -8); ctx.stroke();
};
/* S14.drawItem(kind, x, y, s, rot, o): one stash sprite anywhere in the world (x, y = the bottom centre); the closet's avalanche draws the same sprites */
S14.drawItem = (kind, x, y, s = 1, rot = 0, o = {}) => {
  if (!ITEM[kind]) return;
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s); ITEM[kind](o); ctx.restore();
};
S14.itemKinds = Object.keys(ITEM);

/* the stash: where everything sits in the shower room. x and v are room coordinates (x across, v down; v is the item's base), w and h its size, z the draw order, at the stash level (0..4) at which it appears */
const STASH = [
  { id: 'bucket', kind: 'bucket', x: 34, v: 298, rot: -.04, z: 9, at: .3, w: 40, h: 128 },
  { id: 'box1', kind: 'box', x: 206, v: 298, rot: 0, z: 9, at: .3, w: 54, h: 42, o: { w: 54, h: 42, color: '#c99a62' } },
  { id: 'wheelchair', kind: 'wheelchair', x: 56, v: 294, rot: 0, z: 7, at: .8, w: 76, h: 76 },
  { id: 'ivpole', kind: 'ivpole', x: 226, v: 290, rot: .03, z: 3, at: 1.0, w: 40, h: 136 },
  { id: 'box2', kind: 'box', x: 176, v: 298, rot: 0, z: 8, at: 1.3, w: 48, h: 36, o: { w: 48, h: 36, color: '#b98a52' } },
  { id: 'fan', kind: 'fan', x: 206, v: 256, rot: -.05, z: 8.5, at: 1.6, w: 52, h: 56 },
  { id: 'rail', kind: 'rail', x: 24, v: 288, rot: -.1, z: 3, at: 1.9, w: 40, h: 88 },
  { id: 'box3', kind: 'box', x: 62, v: 262, rot: .04, z: 6.5, at: 2.0, w: 44, h: 36, o: { w: 44, h: 36, color: '#d8ac72' } },
  { id: 'tv', kind: 'tv', x: 60, v: 226, rot: -.03, z: 6.4, at: 2.2, w: 62, h: 84 },
  { id: 'tree', kind: 'tree', x: 194, v: 292, rot: -.1, z: 5, at: 2.5, w: 78, h: 112 },
  { id: 'banner', kind: 'banner', x: 196, v: 204, rot: .08, z: 8.6, at: 2.8, w: 100, h: 30 },
  { id: 'qsign', kind: 'qsign', x: 26, v: 204, rot: -.14, z: 3.2, at: 3.0, w: 60, h: 34 },
  { id: 'bag1', kind: 'bag', x: 100, v: 108, rot: .05, z: 2, at: 3.2, w: 36, h: 48 },
  { id: 'box4', kind: 'box', x: 142, v: 108, rot: -.03, z: 2, at: 3.3, w: 50, h: 40, o: { w: 50, h: 40, color: '#c99a62' } },
  { id: 'box5', kind: 'box', x: 204, v: 172, rot: .03, z: 8.4, at: 3.5, w: 46, h: 38, o: { w: 46, h: 38, color: '#b98a52' } },
  { id: 'box6', kind: 'box', x: 198, v: 134, rot: -.04, z: 8.3, at: 3.6, w: 48, h: 40, o: { w: 48, h: 40, color: '#d8ac72' } },
  { id: 'box7', kind: 'box', x: 58, v: 142, rot: .05, z: 6.3, at: 3.7, w: 46, h: 38, o: { w: 46, h: 38, color: '#c99a62' } },
  { id: 'box8', kind: 'box', x: 54, v: 104, rot: -.05, z: 6.2, at: 3.8, w: 44, h: 36, o: { w: 44, h: 36, color: '#b98a52' } },
  { id: 'box9', kind: 'box', x: 100, v: 68, rot: .04, z: 1.9, at: 3.9, w: 50, h: 40, o: { w: 50, h: 40, color: '#d8ac72' } },
  { id: 'box10', kind: 'box', x: 142, v: 66, rot: -.05, z: 1.8, at: 3.95, w: 52, h: 38, o: { w: 52, h: 38, color: '#c99a62' } },
  { id: 'bag2', kind: 'bag', x: 206, v: 96, rot: -.06, z: 8.2, at: 3.95, w: 36, h: 48 },
  { id: 'box11', kind: 'box', x: 122, v: 30, rot: .02, z: 1.7, at: 4.0, w: 54, h: 40, o: { w: 54, h: 40, color: '#b98a52' } },
  { id: 'box12', kind: 'box', x: 58, v: 68, rot: .03, z: 6.1, at: 4.0, w: 44, h: 34, o: { w: 44, h: 34, color: '#d8ac72' } },
  /* behind the door (hidden while it is shut; the closet's avalanche pours out of here) */
  { id: 'cbox1', kind: 'box', x: 98, v: 298, rot: .02, z: 4, at: 1.1, w: 50, h: 40, o: { w: 50, h: 40, color: '#c99a62' } },
  { id: 'cbox2', kind: 'box', x: 148, v: 298, rot: -.02, z: 4, at: 1.4, w: 50, h: 40, o: { w: 50, h: 40, color: '#b98a52' } },
  { id: 'wheelchair2', kind: 'wheelchair', x: 124, v: 296, rot: .03, z: 4.5, at: 2.6, w: 76, h: 76 },
  { id: 'cbox3', kind: 'box', x: 100, v: 258, rot: -.03, z: 3.8, at: 2.9, w: 44, h: 36, o: { w: 44, h: 36, color: '#d8ac72' } },
  { id: 'cbox4', kind: 'box', x: 148, v: 258, rot: .03, z: 3.8, at: 3.1, w: 46, h: 38, o: { w: 46, h: 38, color: '#c99a62' } },
  { id: 'cbag', kind: 'bag', x: 124, v: 226, rot: .04, z: 3.6, at: 3.3, w: 36, h: 48 },
  { id: 'cbox5', kind: 'box', x: 104, v: 220, rot: .04, z: 3.4, at: 3.5, w: 46, h: 38, o: { w: 46, h: 38, color: '#b98a52' } },
  { id: 'cbox6', kind: 'box', x: 148, v: 218, rot: -.04, z: 3.4, at: 3.6, w: 46, h: 36, o: { w: 46, h: 36, color: '#d8ac72' } },
  { id: 'cbox7', kind: 'box', x: 122, v: 182, rot: .02, z: 3.2, at: 3.7, w: 50, h: 40, o: { w: 50, h: 40, color: '#c99a62' } },
  { id: 'cbox8', kind: 'box', x: 126, v: 142, rot: -.03, z: 3.1, at: 3.8, w: 48, h: 38, o: { w: 48, h: 38, color: '#b98a52' } },
];
/* S14.stashItems(level) -> the items the room shows at that stash level, in WORLD coordinates: { id, kind, x, y (the base), w, h, rot, z, at, o } (S14.drawItem(kind, x, y, 1, rot, o) draws one) */
S14.stashItems = (level = 4) => {
  const r = S14.rect('shower');
  return STASH.filter(it => it.at <= level + 1e-6).map(it => ({ id: it.id, kind: it.kind, x: r.x0 + it.x, y: r.y0 + it.v, w: it.w, h: it.h, rot: it.rot, z: it.z, at: it.at, o: it.o || {} }));
};

/* the door (room coordinates): the leaf is 88 wide and 198 tall, hinged on the RIGHT, the knob on the LEFT, in a brown frame; the glass front surrounds it */
const SD = { x0: 82, x1: 170, top: 108, bot: 306, kx: 93, ky: 214 };
/* S14.showerDoor(st) -> the door in WORLD coordinates for the state st = o.rooms.shower ({ door 0..1, bulge 0..1 }): { x0, y0, x1, y1 (the closed leaf), knob: [x, y] (follows the leaf when it swings), hinge: 'r', knobSide: 'l', cx, floor,
 *    tape: [[y0, y1], [y0, y1]] (the two OUT OF ORDER strips), sign: [x, y, w, h] (DO NOT OPEN), sock: [x, y] } */
S14.showerDoor = (st = {}) => {
  const r = S14.rect('shower'), d = clamp01(st.door ?? 0), th = d * 1.25, wLeaf = (SD.x1 - SD.x0) * Math.cos(th), xf = SD.x1 - wLeaf;
  return { x0: r.x0 + SD.x0, y0: r.y0 + SD.top, x1: r.x0 + SD.x1, y1: r.y0 + SD.bot, w: SD.x1 - SD.x0, h: SD.bot - SD.top, cx: r.x0 + (SD.x0 + SD.x1) / 2, floor: r.floor,
    knob: [r.x0 + xf + (SD.kx - SD.x0) * Math.cos(th), r.y0 + SD.ky], hinge: 'r', knobSide: 'l', side: 'l', open: d, bulge: clamp01(st.bulge ?? 0),
    tape: [[r.y0 + 142, r.y0 + 158], [r.y0 + 226, r.y0 + 242]], sign: [r.x0 + 98, r.y0 + 112, 56, 28], sock: [r.x0 + 96, r.y0 + 304] };
};
function drawStash(r, t, st) {
  const stash = st.stash ?? 2, list = STASH.filter(it => it.at <= stash + .14).sort((a, b) => a.z - b.z);
  for (const it of list) {
    const k = clamp01((stash - it.at + .14) / .14), sc = k >= 1 ? 1 : easeBack(k);
    if (it.v > 280) fsh(it.x, it.v + 2, it.w * .9, .3, 5);
    ctx.save(); ctx.translate(it.x, it.v); if (it.rot) ctx.rotate(it.rot); ctx.scale(sc, sc); ITEM[it.kind](it.o || {}); ctx.restore();
  }
}
function glassFront(r, t, st, b) {
  /* a steel-framed glass front over the whole room (the stash is seen through it), with the door set in it */
  const gl = 'rgba(196,228,248,.10)';
  for (const [x0, y0, x1, y1] of [[0, 14, SD.x0 - 8, 318], [SD.x1 + 8, 14, 250, 318], [SD.x0 - 8, 14, SD.x1 + 8, SD.top - 8]]) {
    ctx.fillStyle = gl; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.16)'; for (const o of [.2, .62]) { ctx.beginPath(); ctx.moveTo(x0 + (x1 - x0) * o, y0); ctx.lineTo(x0 + (x1 - x0) * (o + .12), y0); ctx.lineTo(x0 + (x1 - x0) * (o - .5), y1); ctx.lineTo(x0 + (x1 - x0) * (o - .62), y1); ctx.fill(); } ctx.restore();
    ctx.strokeStyle = '#9aa8b2'; ctx.lineWidth = 3; ctx.strokeRect(x0 + 1.5, y0 + 1.5, x1 - x0 - 3, y1 - y0 - 3);
  }
  if (b > .3) {   /* the glass is cracking under the pile (the cracks stay inside the panes) */
    ctx.save(); ctx.beginPath(); ctx.rect(1, 15, SD.x0 - 10, 302); ctx.rect(SD.x1 + 9, 15, 240, 302); ctx.rect(SD.x0 - 7, 15, SD.x1 - SD.x0 + 14, SD.top - 24); ctx.clip();
    ctx.strokeStyle = `rgba(255,255,255,${.75 * clamp01((b - .3) / .5)})`; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    for (const [cx, cy, n, sd] of [[40, 130, 6, 1], [214, 182, 7, 2], [126, 60, 5, 3]]) { const rr = rnd(sd); for (let i = 0; i < n; i++) { const a = i / n * TAU + rr() * .5; let x = cx, y = cy; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 3; k++) { x += Math.cos(a + (rr() - .5) * .6) * (10 + rr() * 16); y += Math.sin(a + (rr() - .5) * .6) * (10 + rr() * 16); ctx.lineTo(x, y); } ctx.stroke(); } }
    ctx.restore();
  }
}
function showerDoorDraw(r, t, st) {
  const d = clamp01(st.door ?? 0), b = clamp01(st.bulge ?? 0), th = d * 1.25, s = Math.sin(th), c = Math.cos(th), wLeaf = (SD.x1 - SD.x0) * c, xf = SD.x1 - wLeaf;
  const jit = b > .45 && d < .02 ? b * .8 * Math.sin(t * 37) : 0, jy = b > .45 && d < .02 ? b * .5 * Math.sin(t * 29 + 1) : 0;
  /* the frame: brown casing and a threshold */
  ctx.fillStyle = vg(SD.top, SD.bot, 'rgba(20,12,8,.0)', 'rgba(20,12,8,.0)');
  for (const [x, y, w, h] of [[SD.x0 - 9, SD.top - 9, 9, SD.bot - SD.top + 9], [SD.x1, SD.top - 9, 9, SD.bot - SD.top + 9], [SD.x0 - 9, SD.top - 9, SD.x1 - SD.x0 + 18, 9]]) rb(x, y, w, h, '#8a6038', { r: 2, lw: 1.7 });
  if (d > .02) { ctx.fillStyle = hg(SD.x0, SD.x1, 'rgba(15,8,4,.45)', 'rgba(15,8,4,.0)'); ctx.fillRect(SD.x0, SD.top, SD.x1 - SD.x0, SD.bot - SD.top); }   /* the doorway is a little shadowed once the leaf swings away */
  rb(SD.x0 - 12, SD.bot + 3, SD.x1 - SD.x0 + 24, 6, '#aab2bc', { r: 2, lw: 1.3 });
  const pj = (u, v, ex = 0) => { const topf = lerp(SD.top - 14 * s, SD.top, u), botf = lerp(SD.bot + 10 * s, SD.bot, u); return [xf + (SD.x1 - xf) * u + ex, lerp(topf, botf, v)]; };
  /* the leaf, bowed by the pressure behind it */
  ctx.save(); ctx.translate(jit, jy);
  const bow = b * 11;
  ctx.beginPath(); const p0 = pj(0, 0), p1 = pj(1, 0), p2 = pj(1, 1), p3 = pj(0, 1);
  ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, p0[1] - bow * .9, p1[0], p1[1]); ctx.quadraticCurveTo(p1[0] + bow * .55, (p1[1] + p2[1]) / 2, p2[0], p2[1]); ctx.quadraticCurveTo((p2[0] + p3[0]) / 2, p2[1] + bow * .9, p3[0], p3[1]); ctx.quadraticCurveTo(p3[0] - bow * .75, (p3[1] + p0[1]) / 2, p0[0], p0[1]); ctx.closePath();
  const dim = 1 - .32 * s;
  ctx.fillStyle = hg(p0[0], p1[0], shade('#f2ead6', dim * .92), shade('#e4d9bd', dim)); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip();
  if (b > 0) { ctx.fillStyle = rg((p0[0] + p1[0]) / 2 - 6, (p0[1] + p3[1]) / 2 - 10, 4, 118, [[0, `rgba(255,255,255,${.5 * b})`], [.55, `rgba(255,255,255,${.0 * b})`], [1, `rgba(50,24,8,${.5 * b})`]]); ctx.fillRect(p0[0] - 20, SD.top - 24, 140, 230);
    ctx.strokeStyle = `rgba(30,14,4,${.5 * b})`; ctx.lineWidth = 7; ctx.stroke(); }
  for (const [v0, v1] of [[.1, .42], [.52, .94]]) { const q = [pj(.14, v0), pj(.86, v0), pj(.86, v1), pj(.14, v1)]; poly(q, 'rgba(0,0,0,.05)', 'rgba(70,50,20,.45)', 1.5); ln(q[0][0] + 1.6, q[0][1] + 1.6, q[1][0] - 1.6, q[1][1] + 1.6, 'rgba(255,255,255,.55)', 1.1); }
  ctx.restore();
  if (b > .4) { ctx.strokeStyle = `rgba(50,24,10,${.8 * clamp01((b - .4) / .4)})`; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; for (const [cx, cy, sd] of [[104, 176, 1], [152, 262, 2], [118, 288, 3]]) { const rr = rnd(sd); let x = cx, y = cy; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rr() - .5) * 12; y -= 6 + rr() * 8; ctx.lineTo(x, y); } ctx.stroke(); } }
  /* three hinges on the right, a brass knob with a plate on the left */
  for (const v of [.12, .5, .88]) { const q = pj(1, v); rb(q[0] - 5, q[1] - 6, 7, 12, '#c9a23a', { r: 2, lw: 1.2 }); }
  const kq = pj((SD.kx - SD.x0) / (SD.x1 - SD.x0) * 1.0 * 0 + (1 - (SD.x1 - SD.kx) / (SD.x1 - SD.x0)) * 0 + (SD.kx - SD.x0) / (SD.x1 - SD.x0), (SD.ky - SD.top) / (SD.bot - SD.top)), kk = c;
  ctx.save(); ctx.translate(kq[0], kq[1]); ctx.scale(Math.max(.3, kk), 1); rb(-4.4, -9, 8.8, 18, '#c9a23a', { r: 4, lw: 1.3 }); ell(0, 0, 5.6, 5.6, rg2(), '#6a4a10', 1.4); ell(-1.6, -1.8, 1.8, 1.4, 'rgba(255,255,255,.85)'); ctx.restore();
  ctx.restore();
}
function rg2() { return rg(-1.4, -1.6, .6, 7, [[0, '#fff0a8'], [.5, '#e0b83a'], [1, '#9a7418']]); }
/* the OUT OF ORDER tape (two strips), the DO NOT OPEN sign and the sock; they sit on the closed leaf and stay with it as it swings */
function showerDoorBits(r, t, st) {
  const d = clamp01(st.door ?? 0), b = clamp01(st.bulge ?? 0), th = d * 1.25, c = Math.cos(th), xf = SD.x1 - (SD.x1 - SD.x0) * c, jit = b > .45 && d < .02 ? b * .8 * Math.sin(t * 37) : 0;
  if (d > .9) return;
  ctx.save(); ctx.translate(jit, 0);
  const xa = Math.min(SD.x0 - 8, xf - 6), xb = SD.x1 + 8;
  for (const [y0, y1] of (d > .06 ? [] : [[142, 158], [226, 242]])) {
    const sag = b * 3;
    ctx.save(); ctx.beginPath(); ctx.moveTo(xa, y0); ctx.quadraticCurveTo((xa + xb) / 2, y0 - sag, xb, y0); ctx.lineTo(xb, y1 - sag * .3); ctx.quadraticCurveTo((xa + xb) / 2, y1 - sag, xa, y1); ctx.closePath(); ctx.fillStyle = '#f7d21e'; ctx.fill(); ctx.strokeStyle = 'rgba(60,40,0,.8)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.clip();
    ctx.fillStyle = '#1d1a16'; for (let x = xa - 20; x < xb + 20; x += 13) { ctx.beginPath(); ctx.moveTo(x, y1 + 2); ctx.lineTo(x + 6, y1 + 2); ctx.lineTo(x + 6 + 11, y0 - 2); ctx.lineTo(x + 11, y0 - 2); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#f7d21e'; ctx.fillRect(xf + 6 + (SD.x0 - xf) * 0, y0 + 1.5, (SD.x1 - xf) - 12, y1 - y0 - 3); ctx.restore();
    if (b > .75) { ctx.fillStyle = '#f7d21e'; for (const x of [xa, xb]) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (x < 100 ? -6 : 6), y0 + 5); ctx.lineTo(x, y0 + 8); ctx.lineTo(x + (x < 100 ? -4 : 4), y0 + 12); ctx.lineTo(x, y1); ctx.fill(); } }
    dress('OUT OF ORDER', (xf + SD.x1) / 2, (y0 + y1) / 2 + .2, 9.2, { fill: '#1d1a16', maxW: Math.max(20, (SD.x1 - xf) - 14), weight: 900 });
  }
  /* DO NOT OPEN, red and white, taped at the corners */
  const sx = (xf + SD.x1) / 2 - 28 + (SD.x0 + 16 - xf) * 0, sy = 112, sw = 56, sh = 28, hero = d < .02;
  ctx.save(); ctx.translate(sx + sw / 2, sy + sh / 2); ctx.rotate(-.03 + b * .04); if (d > .01) ctx.scale(Math.max(.2, c), 1); ctx.translate(-(sx + sw / 2), -(sy + sh / 2));
  rb(sx + 1.5, sy + 2.5, sw, sh, 'rgba(0,0,0,.25)', { r: 3, lw: 0, flat: true });
  plate([sx, sy, sw, sh], [{ t: 'DO NOT', size: 11.6 }, { t: 'OPEN', size: 11.6 }], { fill: '#c9302a', stroke: '#ffffff', lw: 2, ink: '#ffffff', r: 3, pad: 2.5, heroSize: 10.4, hero, id: 'k14.donotopen', spacing: .6 });
  for (const [tx, ty] of [[sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh]]) { ctx.save(); ctx.translate(tx, ty); ctx.rotate(.8); ctx.fillStyle = 'rgba(238,226,190,.85)'; ctx.fillRect(-5, -2, 10, 4); ctx.restore(); }
  ctx.restore();
  ctx.restore();
}
function showerSock(r, t, st) {
  if ((st.stash ?? 2) < 2.2) return;
  const d = clamp01(st.door ?? 0); if (d > .3) return;
  ctx.save(); ctx.translate(SD.x0 + 8, SD.bot + 1); ctx.rotate(.04);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8); ctx.lineTo(22, 8); ctx.quadraticCurveTo(32, 8, 31, 2); ctx.quadraticCurveTo(30, -2, 22, -1); ctx.closePath(); ctx.fillStyle = '#f6f2ea'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#c23a2b'; for (const x of [6, 14]) ctx.fillRect(x, -2, 3.4, 12); ctx.fillStyle = '#2b5fc2'; ctx.fillRect(26, -2, 8, 12); ctx.restore();
  ctx.restore();
}
LIVE.shower = (r, t, st, o, lamp) => {
  inRoom(r, () => {
    drawStash(r, t, st);
    ctx.save(); ctx.translate(-r.x0, -r.y0);
    if (typeof st.junk === 'function') st.junk(t, r, S14.stashItems(st.stash ?? 2));
    ctx.restore();
    glassFront(r, t, st, clamp01(st.bulge ?? 0));
    showerDoorDraw(r, t, st);
    showerDoorBits(r, t, st);
    showerSock(r, t, st);
    /* dust leaking from the edges of the door while it strains */
    const b = clamp01(st.bulge ?? 0), d = clamp01(st.door ?? 0);
    if (b > .5 && d < .05) for (let i = 0; i < 8; i++) { const ph = ((t * .7 + i / 8) % 1), x = i % 2 ? SD.x1 + 8 : SD.x0 - 8, y = 120 + (i * 53 % 170), a = .4 * b * Math.sin(ph * PI); ctx.fillStyle = rg(x + (i % 2 ? 1 : -1) * ph * 10, y + ph * 30, 0, 7, [[0, `rgba(220,212,196,${a})`], [1, 'rgba(220,212,196,0)']]); ctx.fillRect(x - 12, y - 8, 30, 50); }
  });
};

// ================================================================================================ the med room: the lit fridge with its insulin pens, the tap, the cart
const FR = { x0: 170, x1: 226, top: 112, bot: 270 };            /* the fridge (room coordinates) */
const PEN_ROWS = [150, 187, 224], PEN_COLS = 6;                  /* shelf heights (the pens stand on them) and pens per shelf */
const PEN_PERM = (() => { const a = Array.from({ length: PEN_ROWS.length * PEN_COLS }, (_, i) => i), r = rnd(77); for (let i = a.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; })();
/* the pens' slots in WORLD coordinates: { i, x, y (the foot of the pen), fresh (given the pens level 0..1) } (the camera-trap insert dates exactly these) */
S14.penSlots = (pens = .25) => {
  const r = S14.rect('med'), n = PEN_ROWS.length * PEN_COLS, nf = Math.round(clamp01(pens) * n), out = [];
  PEN_ROWS.forEach((v, row) => { for (let c = 0; c < PEN_COLS; c++) { const i = row * PEN_COLS + c; out.push({ i, row, col: c, x: r.x0 + FR.x0 + 9 + c * 7.6 + (c > 2 ? 0 : 0), y: r.y0 + v, fresh: PEN_PERM[i] < nf }); } });
  return out;
};
S14.fridge = () => { const r = S14.rect('med'); return { x0: r.x0 + FR.x0, y0: r.y0 + FR.top, x1: r.x0 + FR.x1, y1: r.y0 + FR.bot }; };
function penDraw(x, y, fresh, i) {
  const cap = ['#2b5fc2', '#e8903a', '#59b36b', '#8a4cb8', '#d8584a', '#3aa6ad'][i % 6];
  rb(x - 2.1, y - 19, 4.2, 19, '#f6f8fa', { r: 1.4, lw: .9, flat: true }); rb(x - 2.4, y - 21.4, 4.8, 5.4, cap, { r: 1.4, lw: .9, flat: true });
  rb(x - 2.1, y - 10, 4.2, 5.6, fresh ? '#ffe94a' : '#cfd2d6', { r: .5, lw: .6, flat: true });
  if (fresh) { ctx.strokeStyle = '#1d6a2a'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x - 1.2, y - 7.2); ctx.lineTo(x - .3, y - 5.8); ctx.lineTo(x + 1.3, y - 8.8); ctx.stroke(); }
  else { ctx.strokeStyle = '#d8342c'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x - 1.6, y - 5.6); ctx.lineTo(x - .6, y - 9); ctx.lineTo(x + .6, y - 5.6); ctx.lineTo(x + 1.6, y - 9); ctx.stroke(); }
}
function fridgeDraw(r, t, st) {
  const open = clamp01(st.fridge ?? 0), pens = st.pens ?? .25, nf = Math.round(clamp01(pens) * PEN_ROWS.length * PEN_COLS), { x0, x1, top, bot } = FR;
  rb(x0, top, x1 - x0, bot - top, '#eef2f4', { r: 6, lw: 2.2 });
  /* the lit inside */
  const ix = x0 + 4, iy = top + 6, iw = x1 - x0 - 8, ih = bot - top - 12;
  ctx.save(); ctx.beginPath(); ctx.roundRect(ix, iy, iw, ih, 3); ctx.clip();
  ctx.fillStyle = vg(iy, iy + ih, '#f4fcff', '#c9e4f2'); ctx.fillRect(ix, iy, iw, ih);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(ix, iy, 5, ih); ctx.fillStyle = 'rgba(0,40,70,.1)'; ctx.fillRect(ix + iw - 5, iy, 5, ih);
  PEN_ROWS.forEach((v, row) => {
    ctx.fillStyle = 'rgba(170,210,230,.7)'; ctx.fillRect(ix, v + 1, iw, 3.4); ln(ix, v + 4.6, ix + iw, v + 4.6, 'rgba(60,100,130,.5)', .9, 'butt');
    for (let c = 0; c < PEN_COLS; c++) { const i = row * PEN_COLS + c; penDraw(x0 + 9 + c * 7.6, v, PEN_PERM[i] < nf, i); }
  });
  rb(ix + 3, 233, iw - 6, 26, '#e6eef2', { r: 2, lw: 1, flat: true }); for (let i = 0; i < 3; i++) rb(ix + 6 + i * 13, 237, 10, 18, ['#f6d68a', '#d8e6d0', '#f0c9c0'][i], { r: 1.5, lw: .8, flat: true });
  ctx.restore();
  rb(x0 + 14, top - 6, 28, 6, '#2a2f38', { r: 2, lw: 1.2 }); ctx.fillStyle = '#ff5a48'; ctx.font = '900 5px Nunito'; ctx.fillRect(x0 + 17, top - 4.6, 3, 3.2); ctx.fillRect(x0 + 21.4, top - 4.6, 3, 3.2); ctx.fillRect(x0 + 25.8, top - 4.6, 3, 3.2);   /* the red temperature display */
  /* the glass door: a see-through leaf hinged on the right; it swings toward us when open */
  const th = open * 1.2, c = Math.cos(th), s = Math.sin(th), w = x1 - x0, xf = x1 - w * c;
  const q = [[xf, top - 8 * s], [x1, top], [x1, bot], [xf, bot + 8 * s]];
  ctx.beginPath(); ctx.moveTo(...q[0]); for (let i = 1; i < 4; i++) ctx.lineTo(...q[i]); ctx.closePath();
  ctx.fillStyle = `rgba(190,226,246,${.2 + .1 * open})`; ctx.fill(); ctx.strokeStyle = 'rgba(235,242,246,.95)'; ctx.lineWidth = 4.4; ctx.lineJoin = 'round'; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.moveTo(xf + w * c * .18, top - 10); ctx.lineTo(xf + w * c * .4, top - 10); ctx.lineTo(xf + w * c * .1, bot + 10); ctx.lineTo(xf - w * c * .1, bot + 10); ctx.fill(); ctx.restore();
  rb(xf + 4 * c, top + 52, 4.4 * Math.max(.4, c), 56, '#c9d2da', { r: 2, lw: 1.3 });   /* the handle, on the left edge of the door */
  dress('MEDICATION', (xf + x1) / 2, top + 11.5, 5.8, { fill: 'rgba(40,70,90,.9)', maxW: Math.max(14, (x1 - xf) - 10), spacing: .5 });
  V2.glow(r.x0 + (x0 + x1) / 2, r.y0 + 190, 120, '200,235,255', .22 + .22 * open, 'screen', .3);
  if (open > .05) { ctx.fillStyle = vg(bot, 318, `rgba(200,235,255,${.3 * open})`, 'rgba(200,235,255,0)'); ctx.beginPath(); ctx.moveTo(x0 - 14, 276); ctx.lineTo(x1 + 4, 276); ctx.lineTo(x1 + 18, 318); ctx.lineTo(x0 - 30, 318); ctx.closePath(); ctx.fill(); }
}
/* a rolling med cart anywhere: S14.cart(x, floorY, o) with o { s (scale, default 1), color, drawer 0..1 (a drawer slid out), cups } */
S14.cart = (x, y, o = {}) => {
  const s = o.s ?? 1, c = o.color ?? '#e9f3f1', accent = o.accent ?? '#4fb3b0';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fsh(0, 1, 74, .3, 5);
  for (const dx of [-22, 22]) { ln(dx, -8, dx, -3, '#5a6670', 3); ell(dx, -1, 4.6, 4.2, '#2a2630', OUT, 1.2); }
  rb(-29, -78, 58, 70, c, { r: 4, lw: 1.9 });
  for (let i = 0; i < 3; i++) { const dy = -72 + i * 21, out = i === 1 ? clamp01(o.drawer ?? 0) * 14 : 0; rb(-26 - out * .0, dy, 52, 18, i === 1 ? mixc(c, accent, .25) : c, { r: 2.5, lw: 1.5 }); rb(-9, dy + 6, 18, 3.4, '#8f99a6', { r: 1.7, lw: 1 }); if (out) ln(-26, dy + 18, 26, dy + 18 + out * .5, 'rgba(0,0,0,.25)', 3); }
  rb(-31, -86, 62, 9, accent, { r: 3.5, lw: 1.7 });
  for (let i = 0; i < 5; i++) { const cx = -22 + i * 11; ctx.beginPath(); ctx.moveTo(cx - 4, -86); ctx.lineTo(cx + 4, -86); ctx.lineTo(cx + 3, -95); ctx.lineTo(cx - 3, -95); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1; ctx.stroke(); ell(cx, -91, 1.6, 1.6, ['#f0a43a', '#e0583d', '#4c7bd9', '#59b36b', '#c25fa0'][i]); }
  ln(-29, -60, -36, -60, '#8f99a6', 3); ln(-36, -60, -36, -30, '#8f99a6', 3); ln(-36, -30, -29, -30, '#8f99a6', 3);
  ctx.restore();
};
LIVE.med = (r, t, st) => {
  inRoom(r, () => {
    dress('NARCOTICS', 145, 133, 6.4, { fill: '#8a1a14', spacing: .5 }); dress('SHARPS', 144, 190, 6.2, { fill: '#7a1710', spacing: .5 });
    /* a drop swells at the tip of the tap, falls into the sink and rings */
    const ph = (t * .75) % 1, dy = ph < .8 ? 177 + 26 * Math.pow(ph / .8, 2) : 203;
    if (ph < .8) { ctx.save(); ctx.translate(76, dy); ctx.beginPath(); ctx.moveTo(0, -4.4 * (ph < .3 ? ph / .3 : 1)); ctx.quadraticCurveTo(3, 0, 0, 2.2); ctx.quadraticCurveTo(-3, 0, 0, -4.4 * (ph < .3 ? ph / .3 : 1)); ctx.fillStyle = 'rgba(120,190,235,.95)'; ctx.fill(); ctx.restore(); }
    else { const k = (ph - .8) / .2; ctx.strokeStyle = `rgba(160,210,240,${.8 * (1 - k)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(76, 205, 3 + k * 9, 1 + k * 2, 0, 0, TAU); ctx.stroke(); }
    fridgeDraw(r, t, st);
    if ((st.cart ?? 0) > 0) { ctx.save(); ctx.globalAlpha *= clamp01(st.cart); S14.cart(112, 296, { drawer: st.cartDrawer }); ctx.restore(); }
  });
};

// ================================================================================================ the alarm call: alert pulses, buzzing phones, chat bubbles; and the brass name plates on the floor slabs
/* o.rooms[id].alert 0..1: the strength of the pulse at this moment (1 at the buzz, falling to 0): a yellow rim and wash on the room, a ring from the phone, the phone buzzing. alertAt: [x, y] in room coordinates (default the middle of the room, y 170)
 * o.rooms[id].bubble: 'text' or { t, k (the pop 0..1; 1 = settled), dx, dy (nudge, px), at ('top' (default) | 'bottom'), tail (x of the tail tip in room coordinates; default the middle) }: a chat bubble inside the top of the room (kept 44 px inside the frame) */
function alertBack(r, t, st) {
  const a = clamp01(st.alert || 0); if (a <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(r.x0, r.y0, r.w, r.h); ctx.clip();
  ctx.fillStyle = `rgba(255,226,80,${.2 * a})`; ctx.fillRect(r.x0, r.y0, r.w, r.h);
  ctx.strokeStyle = `rgba(255,224,60,${.9 * a})`; ctx.lineWidth = 8; ctx.strokeRect(r.x0 + 4, r.y0 + 4, r.w - 8, r.h - 8);
  const at = st.alertAt || [r.w / 2, 170];
  V2.ring(r.x0 + at[0], r.y0 + at[1], 1 - a, { r0: 16, r1: Math.min(r.w, 300) * .9, color: '255,226,70', lw: 9, alpha: .95, bloom: .5 });
  ctx.restore();
  V2.glow(r.cx, r.cy, r.w * .7, '255,226,70', .22 * a, 'screen', .45);
}
function phoneFront(r, t, st) {
  const a = clamp01(st.alert || 0); if (a <= 0.02) return;
  const at = st.alertAt || [r.w / 2, 170], sh = Math.sin(t * 90) * 2.6 * a, rot = Math.sin(t * 76) * .22 * a;
  ctx.save(); ctx.translate(r.x0 + (st.phoneAt ? st.phoneAt[0] : r.w - 34) + sh, r.y0 + (st.phoneAt ? st.phoneAt[1] : 40)); ctx.rotate(rot); ctx.globalAlpha *= clamp01(a * 2.4);
  rb(-9, -16, 18, 32, '#1d2230', { r: 4, lw: 1.6 }); ctx.fillStyle = vg(-13, 12, '#8fd0ff', '#3a7fd0'); ctx.beginPath(); ctx.roundRect(-7, -13, 14, 24, 2); ctx.fill(); rb(-5, -9, 10, 4, '#fff', { r: 1.4, lw: 0, flat: true }); rb(-5, -3, 10, 3, 'rgba(255,255,255,.7)', { r: 1, lw: 0, flat: true });
  for (const sgn of [-1, 1]) for (let i = 0; i < 2; i++) { ctx.strokeStyle = `rgba(255,226,70,${.85 - i * .3})`; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 18 + i * 6, sgn * .55 - 1.57 + (sgn < 0 ? 3.14 : 0) - .45, sgn * .55 - 1.57 + (sgn < 0 ? 3.14 : 0) + .45); ctx.stroke(); }
  V2.glow(0, -2, 26, '140,200,255', .6, 'screen', .4);
  ctx.restore();
}
function bubbleFront(r, t, st) {
  if (!st.bubble) return;
  const B = typeof st.bubble === 'string' ? { t: st.bubble } : st.bubble, k = clamp01(B.k ?? 1);
  if (k <= 0) return;
  /* the bubble keeps a constant size on screen once the camera is in close (its text is 32 px at zoom 1 and about 34 px at any zoom above that), and is kept whole inside the safe frame */
  const z = CAM && CAM.z || 1, sc = Math.min(1, 1.05 / z), size = 32 * sc;
  const lines = UI.wrap(String(B.t), 270 * sc, { size, weight: 900 }), L = lines.length, lw = Math.max(...lines.map(s => UI.sizeOf(s, { size, weight: 900 }).w));
  const bw = Math.max(120 * sc, lw + 44 * sc), bh = L * size * 1.18 + 30 * sc, inset = (bw - lw) / 2, cam = CAM || { x: W / 2, y: H / 2 };
  const sx0 = cam.x - (W / 2 - 46) / z, sx1 = cam.x + (W / 2 - 46) / z, sy0 = cam.y - (H / 2 - 252) / z, sy1 = cam.y + (1370 - H / 2) / z;
  let bx = r.cx - bw / 2 + (B.dx || 0), by = (B.at === 'bottom' ? r.y1 - bh - 30 * sc : B.at === 'above' ? r.y0 - bh - 22 * sc : r.y0 + 16 * sc) + (B.dy || 0);
  bx = Math.max(sx0 - inset, Math.min(sx1 - inset - lw, bx)); by = Math.max(sy0, Math.min(sy1 - bh - 16 * sc, by));
  const tx = Math.max(bx + 20 * sc, Math.min(bx + bw - 20 * sc, r.x0 + (B.tail ?? r.w / 2))), pop = k >= 1 ? 1 : easeBack(k), ox = tx, oy = by + bh + 14 * sc;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(pop, pop); ctx.translate(-ox, -oy);
  const hero = k >= 1 && heroNow(bx, by, bx + bw, by + bh, size);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 12 * sc; ctx.shadowOffsetY = 4 * sc;
  poly([[tx - 14 * sc, by + bh - 2 * sc], [tx + 14 * sc, by + bh - 2 * sc], [tx + (tx < bx + bw / 2 ? -5 : 5) * sc, by + bh + 16 * sc]], '#2b6fe0', '#ffffff', 3.5 * sc);
  ctx.restore();
  UI.sign([bx, by, bw, bh], lines.map(s => ({ t: s })), { fill: '#2b6fe0', stroke: '#ffffff', lw: 4 * sc, ink: '#ffffff', size, weight: 900, r: 22 * sc, pad: 14 * sc, shadow: 12 * sc, hero, crop: !hero, id: 'k14.bubble.' + r.id, spacing: .6 * sc });
  ctx.restore();
}
function platesDraw(o, V) {
  for (const id of S14.ids) {
    if (o.only && !o.only.includes(id)) continue;
    const r = S14.rect(id);
    if (!seen(V, r.x0, r.y1 - 2, r.x1, r.y1 + 14)) continue;
    const pw = UI.sizeOf(NAMES[id], { size: 7.4, spacing: .4 }).w + 12, pa = dressGuard(r.cx - pw / 2, r.y1 + .8, r.cx + pw / 2, r.y1 + 11.2);
    if (pa < .02) continue;
    ctx.save(); ctx.globalAlpha *= pa;
    UI.pill(NAMES[id], r.cx, r.y1 + 6, { size: 7.4, h: 10.4, padX: 5, pad: .5, fill: '#d9b45a', ink: '#3a2a10', stroke: '#7a5a1a', lw: .9, hero: false, crop: true, spacing: .4, id: 'k14.plate.' + id });
    ctx.restore();
  }
}
/* hook the pieces into back() and front(): alert washes behind the characters, plates on the slabs; phones and bubbles over everything */
{
  const back0 = S14.back, front0 = S14.front;
  S14.back = (lt, o = {}) => {
    back0(lt, o);
    const t = o.t ?? lt, V = view(120), rs = o.rooms || {};
    ctx.save();
    for (const id of S14.ids) { if (!rs[id] || !rs[id].alert || (o.only && !o.only.includes(id))) continue; const r = S14.rect(id); if (seen(V, r.x0, r.y0, r.x1, r.y1)) guard('alert ' + id, () => alertBack(r, t, rs[id])); }
    if (o.plates !== false) guard('plates', () => platesDraw(o, V));
    ctx.restore();
  };
  S14.front = (lt, o = {}) => {
    front0(lt, o);
    const t = o.t ?? lt, V = view(120), rs = o.rooms || {};
    ctx.save();
    guard('car leaf', () => S14._carLeafFront(o, V));
    for (const id of S14.ids) { if (!rs[id] || (o.only && !o.only.includes(id))) continue; const r = S14.rect(id); if (!seen(V, r.x0, r.y0, r.x1, r.y1)) continue; if (rs[id].alert) guard('phone ' + id, () => phoneFront(r, t, rs[id])); }
    for (const id of S14.ids) { if (!rs[id] || !rs[id].bubble || (o.only && !o.only.includes(id))) continue; const r = S14.rect(id); if (seen(V, r.x0, r.y0 - 40, r.x1, r.y1)) guard('bubble ' + id, () => bubbleFront(r, t, rs[id])); }
    ctx.restore();
  };
}
})();
