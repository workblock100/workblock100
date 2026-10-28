'use strict';
/* KIT STATUS: stub (S14.walk, S14.run and S14.move are live now; the rooms, building, roof, lot and car are still the lead's placeholder and are being replaced; this line becomes "KIT STATUS: v1" when every room is drawn)
 * SHIFT HAPPENS, Episode 14: the dollhouse kit, window.S14. The building at Fruit Bowl Rehab & Nursing as a cutaway: a dollhouse seen straight on, one room per cell, every room lit
 * and furnished on its own. Shared by the colony, adapt, tracer and closet scenes (and the title and end card if they want the building).
 *
 * STUB written by the lead so every builder can start at once. THE GEOMETRY BELOW IS FINAL AND NEVER CHANGES (scene modules are being written against these numbers); what is drawn is a
 * placeholder that the kit builder (brief E14-K) replaces with the real dollhouse, keeping every name, argument and return value in this header.
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
 *
 * API (all coordinates are world / scene coordinates):
 *   S14.rect(id)             -> { id, col, row, span, x0, y0, x1, y1, w, h, cx, cy, floor }   room interior (floor = the y of the feet, 14 px above y1)
 *   S14.at(id, u, dy = 0)    -> [x, y]       a standing spot: u 0..1 across the room (0 left wall, 1 right wall), y = floor + dy
 *   S14.door(id, side)       -> { x, y0, y1, w } the arch in the wall to the 'l' or 'r' of the room (x = the wall's centre line; null on the building's outer walls)
 *   S14.S                    the scale of a standing adult inside a room (0.44: about 172 px tall); children and trainees are smaller
 *   S14.who(id, ctor, u, extra) -> the drawChar options for ctor placed in a room: Object.assign({ x, y: floor, s: S14.S }, extra) passed through ctor
 *   S14.zoomRoom(id, z, dy = 0)  aims the camera at a room (zoomTo(cx, cy + dy, z)); z 3.4 fits a 250 px room across the frame, z 1 shows the whole building
 *   S14.back(lt, o)          draws the sky, roof, lot, car and every room as it is behind the characters. o: { rooms: { id: { lamp 0..1, alert 0..1, ... } }, only: [ids], car: x, t }
 *   S14.front(lt, o)         draws what sits in front of the characters (counter fronts, plants, the cutaway frame). Call it after the characters of the same room(s).
 *   S14.GEOM                 the numbers: { T, RW, RH, X0, Y0, COL, ROW }
 *   S14.walk(ctor, pathFn, lt, extra)       a walker: the drawChar options of ctor at pathFn(lt) = [x, y] in WORLD (scene) coordinates (y = the floor line, S14.rect(id).floor; s defaults to S14.S).
 *                                           Same contract as H6.person (ep6.js): speed from a centred difference, then gaitW (distance walked, in the character's LOCAL units = scene px / s, so
 *                                           the planted foot does not slide at the dollhouse scale), axis 'x', dir = sign(vx), vx = on-screen px/s; the footstep tool (render.js events) sees them.
 *   S14.run(ctor, pathFn, lt, extra, rate = 300)   a runner, like H6.runner: legs cycle at gaitW = lt * rate whatever the speed; vx clamped to +-1400.
 *   S14.move(t0, t1, a, b, ease = easeIO)   a pathFn gliding from [x, y] a to b (H6.move)
 * The builder adds more per-room options (the stash level of the shower room, call lights, phones) and documents them here; the names above stay.
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
/* S14.walk(ctor, pathFn, lt, extra) -> the drawChar options of ctor placed at pathFn(lt) = [x, y] (world coordinates; y is the floor line of the room, S14.rect(id).floor; s defaults to S14.S).
 * Like H6.person: the speed comes from a centred difference (dt .03), and above 9 local units per second the gait fields are set: gaitW = the distance walked since t = 0, axis 'x', dir = sign(vx),
 * vx = the on-screen speed in px per second at zoom 1. One unit of ep6's "world" is one LOCAL unit of the character (the perspective scale turns it into pixels), so here the distance and the speeds are
 * measured in local units (scene px / s): the planted foot then stays planted at the dollhouse scale and nothing slides. */
S14.walk = (ctor, fn, lt, extra = {}) => {
  const [X, Y] = fn(lt), s = (extra && extra.s) || S14.S, dt = .03, a = fn(lt - dt), b = fn(lt + dt);
  const vX = (b[0] - a[0]) / (2 * dt), vY = (b[1] - a[1]) / (2 * dt), speed = Math.hypot(vX, vY) / s;
  const o = Object.assign({ x: X, y: Y, s }, extra);
  if (speed > 9) { o.gaitW = pathDist(fn, lt) / s; o.axis = 'x'; o.dir = Math.sign(vX) || 1; o.vx = vX; }
  return ctor(o);
};
/* S14.run(ctor, pathFn, lt, extra, rate = 300): like H6.runner, a dash whose legs cycle at a readable rate whatever the speed (gaitW = lt * rate, local units per second), above 30 local units per second;
 * vx = the on-screen speed clamped to +-1400 */
S14.run = (ctor, fn, lt, extra = {}, rate = 300) => {
  const [X, Y] = fn(lt), s = (extra && extra.s) || S14.S, dt = .03, a = fn(lt - dt), b = fn(lt + dt);
  const vX = (b[0] - a[0]) / (2 * dt), vY = (b[1] - a[1]) / (2 * dt), sp = Math.hypot(vX, vY) / s;
  const o = Object.assign({ x: X, y: Y, s }, extra);
  if (sp > 30) { o.gaitW = lt * rate; o.axis = 'x'; o.dir = Math.sign(vX) || 1; o.vx = Math.max(-1400, Math.min(1400, vX)); }
  return ctor(o);
};
/* S14.move(t0, t1, a, b, ease = easeIO) -> pathFn: a straight glide from [x, y] a to b between t0 and t1 (H6.move, which fits world [x, y] pairs) */
S14.move = (t0, t1, a, b, ease = easeIO) => (window.H6 && window.H6.move ? window.H6.move(t0, t1, a, b, ease) : lt => [lerp(a[0], b[0], ease(seg(lt, t0, t1))), lerp(a[1], b[1], ease(seg(lt, t0, t1)))]);

// ---- placeholder drawing (flat boxes and room names); the kit builder replaces everything below this line
S14.back = (lt, o = {}) => {
  const only = o.only;
  ctx.fillStyle = '#9ec9e8'; ctx.fillRect(-200, -200, W + 400, 1500);
  ctx.fillStyle = '#7fa3b8'; ctx.fillRect(-200, 1342, W + 400, 700);
  ctx.fillStyle = '#4a4458'; ctx.fillRect(X0, Y0, 1060, 1002);
  for (const id of S14.ids) {
    if (only && !only.includes(id)) continue;
    const r = S14.rect(id), st = (o.rooms || {})[id] || {};
    ctx.fillStyle = COLORS[id]; ctx.fillRect(r.x0, r.y0, r.w, r.h);
    ctx.fillStyle = 'rgba(40,30,50,.35)'; ctx.fillRect(r.x0, r.y1 - 14, r.w, 14);
    if (st.alert) { ctx.fillStyle = `rgba(255,230,80,${.35 * st.alert})`; ctx.fillRect(r.x0, r.y0, r.w, r.h); }
    UI.label(NAMES[id], r.cx, r.y0 + 26, { size: 22, fill: 'rgba(30,20,40,.7)', hero: false, crop: true, maxW: r.w - 20 });
  }
};
S14.front = () => {};
})();
