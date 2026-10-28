'use strict';
/* SHIFT HAPPENS, Episode 14: the dollhouse kit, window.S14. The building at Fruit Bowl Rehab & Nursing as a cutaway: a dollhouse seen straight on, one room per cell, every room lit
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
