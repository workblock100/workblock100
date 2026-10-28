'use strict';
/* KIT STATUS: v1 (every room is drawn; the building, doorways and room lamps are in. Still coming, in this order, each saved as it lands: the roof, sky, lot and the State's car; the live options of every room
 * (call lights, fridge and pens, the shower room's stash, glass front and door, alert pulses, bubbles); the front layers (counters, desks, tables); then polish. The geometry and every name below are final.)
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
 *   S14.who(id, ctor, u, extra) -> the drawChar options for ctor placed in a room: Object.assign({ x, y: floor, s: S14.S }, extra) passed through ctor
 *   S14.zoomRoom(id, z, dy = 0)  aims the camera at a room (zoomTo(cx, cy + dy, z)); z 3.4 fits a 250 px room across the frame, z 1 shows the whole building
 *   S14.back(lt, o)          draws the sky, roof, lot, car and every room as it is behind the characters. o: { t (the animation clock, default lt), rooms: { id: {...} }, only: [ids], noSky, noLot, noRoof, noCar, car }
 *                            Rooms and scenery the camera cannot see are skipped. Call V2.setLight (or your own light) BEFORE S14.back: the rooms add their lamps as V2 lights for the characters.
 *   S14.front(lt, o)         draws what sits in front of the characters (counter fronts, desks, tables, blankets, armchair arms, bubbles). Call it after the characters; same o as back.
 *   S14.GEOM                 the numbers: { T, RW, RH, X0, Y0, COL, ROW }
 *   S14.walk(ctor, pathFn, lt, extra)       a walker: the drawChar options of ctor at pathFn(lt) = [x, y] in WORLD (scene) coordinates (y = the floor line, S14.rect(id).floor; s defaults to S14.S).
 *                                           Same contract as H6.person (ep6.js): speed from a centred difference, then gaitW (distance walked, in the character's LOCAL units = scene px / s, so
 *                                           the planted foot does not slide at the dollhouse scale), axis 'x', dir = sign(vx), vx = on-screen px/s; the footstep tool (render.js events) sees them.
 *   S14.run(ctor, pathFn, lt, extra, rate = 300)   a runner, like H6.runner: legs cycle at gaitW = lt * rate whatever the speed; vx clamped to +-1400.
 *   S14.move(t0, t1, a, b, ease = easeIO)   a pathFn gliding from [x, y] a to b (H6.move)
 *
 * Per-room options, o.rooms[id] = { ... } (every one optional):
 *   any room:  lamp 0..1 (the ceiling light's strength; default 1, the locked break room 'rest' defaults to .6), flicker 0..1 (the lamp stutters)
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
/* dressing text: a centred label that never complains; the room's wall charts, calendars, name plates */
function dress(str, cx, cy, size, o = {}) {
  UI.label(str, cx, cy, Object.assign({ size, hero: false, crop: true, fill: '#2a2230' }, o));
}
/* a sign or plate with centred text, as dressing unless it is hero-sized and whole (then the gate holds it to the full rules) */
function plate(box, lines, o = {}) {
  const [x, y, w, h] = box, size = o.size ?? 20, hero = o.hero !== false && heroNow(x, y, x + w, y + h, o.heroSize ?? size);
  return UI.sign(box, lines, Object.assign({ fill: '#f2e8cf', ink: '#2a2230', stroke: '#2a2230', lw: 2, size, hero, crop: !hero }, o, { hero, crop: !hero }));
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
  const px = 99, py = 88, pr = 19; ctx.save(); ctx.translate(px, py); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, pr, -.5, TAU - .86); ctx.closePath(); ctx.fillStyle = '#f0a43a'; ctx.fill(); ctx.strokeStyle = '#8b4a12'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, pr, -.86, -.5); ctx.closePath(); ctx.fillStyle = '#4c7bd9'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c23a2b'; for (const [dx, dy] of [[-9, -6], [4, 9], [-4, 4], [10, -2], [-11, 7], [2, -11]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.6, 0, TAU); ctx.fill(); } ctx.restore();
  ctx.fillStyle = '#f0a43a'; ctx.fillRect(72, 108, 6, 5); ctx.fillStyle = '#4c7bd9'; ctx.fillRect(100, 108, 6, 5);
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

/* ---- 6. Room 4, Mr. Banana's: butter stripes, a bed with rails, a blue floor mat, the FALL RISK sign over a tally of 49, a window, a peel on the floor */
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
  ctx.save(); ctx.translate(200, 301); ctx.scale(1, .36);
  for (const a of [-2.5, -.6, .9, 2.2]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -6, 30, -2); ctx.quadraticCurveTo(26, 8, 4, 6); ctx.closePath(); ctx.fillStyle = vg(-6, 8, '#fbe06a', '#e8b82a'); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,10,.8)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.fillStyle = '#7a4a1a'; ctx.beginPath(); ctx.arc(28, 1, 3.4, 0, TAU); ctx.fill(); ctx.restore(); }
  ell(0, 0, 7, 6, '#f0cc42', 'rgba(90,60,10,.8)', 2.4); ctx.restore();
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
  /* the armchair: back and wings (arms and cushion are in the front layer) */
  fsh(80, FY + 6, 92, .34, 7);
  for (const x of [58, 102]) { ln(x, 270, x, 282, '#5a3a22', 5); }
  ctx.beginPath(); ctx.roundRect(52, 160, 56, 98, [24, 24, 6, 6]); ctx.fillStyle = hg(52, 108, '#3f807e', '#58a09c'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; for (let y = 176; y < 258; y += 11) { ctx.beginPath(); ctx.moveTo(52, y); ctx.quadraticCurveTo(80, y + 5, 108, y); ctx.stroke(); } ctx.restore();
  for (const x of [52, 108]) { ctx.beginPath(); ctx.ellipse(x, 192, 9, 32, 0, 0, TAU); ctx.fillStyle = hg(x - 9, x + 9, '#3a7573', '#5aa5a0'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.stroke(); }
  /* the doily on the headrest */
  ctx.save(); ctx.translate(80, 176); ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(120,100,70,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, a2 = (i + .5) / 16 * TAU; ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 9); ctx.lineTo(Math.cos(a2) * 13.5, Math.sin(a2) * 7); } ctx.closePath(); ctx.fill(); ctx.stroke(); for (let i = 0; i < 8; i++) ell(Math.cos(i * .785) * 8, Math.sin(i * .785) * 4.2, 2.2, 1.3, null, 'rgba(120,100,70,.5)', .8); ctx.restore();
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
FRONT.r7 = (r) => {   /* the armchair's arms and cushion, over the sitter's lap */
  ctx.save(); ctx.translate(r.x0, r.y0);
  ctx.beginPath(); ctx.roundRect(52, 246, 56, 22, 8); ctx.fillStyle = vg(246, 268, '#5aa5a0', '#3f807e'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.24)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(58, 249); ctx.lineTo(102, 249); ctx.stroke();
  for (const x of [44, 106]) { ctx.beginPath(); ctx.roundRect(x, 216, 14, 54, 6); ctx.fillStyle = hg(x, x + 14, '#3a7573', '#5aa5a0'); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.stroke(); ctx.save(); ctx.translate(x + 7, 220); ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = 'rgba(120,100,70,.55)'; ctx.lineWidth = .9; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
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
    const l = side === 'l', xf = l ? 0 : w, xb = l ? b.bx0 : b.bx1, top = 114;
    ctx.save();
    poly([[xf, top], [xb, top - 3], [xb, b.by1], [xf, h]], hg(xf, xb, '#4a3a2c', '#7a6446'));
    ctx.strokeStyle = 'rgba(255,240,205,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xf, h); ctx.lineTo(xf, top); ctx.lineTo(xb, top - 3); ctx.lineTo(xb, b.by1); ctx.stroke();
    ctx.fillStyle = 'rgba(255,226,170,.18)'; path([[xf, top + 6], [xb, top + 3], [xb, b.by1 - 6], [xf, h - 10]]); ctx.fill();
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
    ctx.fillStyle = hg(x, x + T, '#6a5440', '#8a7050'); ctx.fill();
    ctx.fillStyle = 'rgba(255,226,170,.28)'; ctx.fillRect(x + 3, y0 + T, T - 6, y1 - y0 - T);
    ctx.strokeStyle = 'rgba(255,240,205,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y0 + T / 2); ctx.arc(x + T / 2, y0 + T / 2, T / 2, PI, 0); ctx.lineTo(x + T, y1); ctx.stroke();
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
})();
