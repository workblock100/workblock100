# GUIDE_S15: the tower kit `S15` (ep15_house.js, owner E15-K)

The Fruit Bowl dollhouse (`S14`, drawn underneath, never copied) with the Greenleaf dollhouse stacked on top, an Executive Suite on request, the crane, the sky, the lot, the ground cutaway, the signs. Guard: `if (!window.S15) return;`.
STATUS: v1 is live (stack, squat, sink, exec, ground, crane with straight slings, signs, cameras; all 12 Greenleaf rooms furnished). The API below is FINAL. Coming: crane slings as PHYS2D ropes in the dock scene, `S15.stairs`, polish. A full-tower frame renders in about 0.15 to 0.2 s.

## World (tower coordinates = S14 coordinates; the building is x 10..1070, 1060 wide)
Ground line `S15.GEOM.GY = 1342` (the street, before any sinking). Fruit Bowl y 340..1342 (room rows 352, 682, 1012; rooms 250 x 318; slabs 12). Greenleaf docked: y -728..274 (its underside rests on the roof's ridge cap at y 274; rows -716, -386, -56), same columns (x0 = 22, 284, 546, 808).
Executive Suite docked: room y -1046..-728, roof above -1058. One floor = pitch 330, so `sink: 1` drops the tower exactly one floor. Crane mast x 1300, jib y about -1580, jib tip x -300.
Floor index (`S15.floorY(i, st)`): 0 FB ground, 1 FB middle, 2 FB top, 3 GL bottom, 4 GL middle, 5 GL top, 6 Executive Suite.

## Rooms
Fruit Bowl ids (S14): `office conf rest r14` (top) / `med r4 r7 shower` / `lobby station dining`. Greenleaf ids: top `gsky gsalad gzen gsun` (Sky Garden, Salad Bar, Meditation Room, Sunroom); middle `gwell gstation gmed gart` (Wellness Room, Nurses' Station with the ORGANIC sign, Med Room, Art Room);
bottom `globby gdining gtherapy gfish` (Lobby with the vertical garden, Dining Room, Therapy Garden, Fish Tank Lounge). Plus `exec`. `S15.ids`, `S15.fbIds`, `S15.glIds`, `S15.names`.
- `S15.rect(id, st)` -> `{ id, bld ('fb'|'gl'|'exec'), col, row, x0, y0, x1, y1, w, h, cx, cy, floor }` with the state applied (sink, squat, block pose). ALWAYS pass the same `st` you give `tower`, so characters move with the floors.
- `S15.at(id, u, dy, st)` -> `[x, y]` (u 0..1 across the room; y = floor line + dy). `S15.who(id, ctor, u, extra, st)`. `S15.S` = 0.44 (a standing adult: feet at `rect.floor`). `S15.walk / run / move` are S14's.
- `S15.floorY(i, st)`; `S15.toWorld(x, y, st)` maps a point in DOCKED Greenleaf coordinates through the block pose (swaying, squatting) to the world; `S15.blockXform(st)` -> `{ dx, dy, rot }`.
- `S15.zoomRoom(id, z, dy, st)` like S14's. `S15.towerTop(st)` y of the top of the sign of the tallest thing.

## Drawing (S14's pattern: back, characters, front)
```js
V2.setLight({...}); S15.light(st);   // optional: S15.light sets the kit's sun/dusk key and rim for st.tod
S15.tower(lt, st);                   // sky, lot or ground cutaway, crane, Fruit Bowl, roof, Greenleaf, exec, plates, signs, slings: everything BEHIND characters
drawChar(S15.who('conf', A9.melon, .4, {}, st));
S15.front(lt, st);                   // counters, desks, tables, the ORGANIC sign, the cab sill: what sits IN FRONT of characters
```
`st` (every field optional; a pure function of lt/st):
- `t` animation clock (default lt) | `tod` time of day 0..1 (0 noon, .45 gold afternoon = default, .8 sunset, 1 dusk with stars).
- `stack` 1 (default: Greenleaf docked) or 0 (it hangs at `blockPose`) | `blockPose` `{ x, y, angle }` = pose of the CENTRE of the Greenleaf block (docked: x 540, y -227; the block is 1060 x 1002), from the sim. Without a pose a stack-0 block hangs 560 px above its dock.
- `squat` px 0..~45: Fruit Bowl compresses vertically floor by floor and the Greenleaf block rides it (`rect()` follows). `roof` 0..1 = how cracked the FB roof is under the block (default 1 once docked).
- `sink` 0..1+: the whole tower sinks `sink` x 330 px (1.04 for an overshoot is fine). The ground cutaway fades in over the first sixth of the sink (`ground` 0..1 overrides). Sunk: the old ground floor is dark and lit by its own lamps, soil is pressed against the lobby's glass door, a LOBBY sign with an arrow stands in the street, a window ENTRANCE with a ladder appears at the middle floor.
- `exec` 0|1: the Executive Suite, docked on the Greenleaf roof; `execAt: [x, yBottom]` places it anywhere (bottom centre of its floor slab, e.g. hanging from the hook); `noExecRoof: true` leaves its roof furniture out.
- `rooms` `{ id: { lamp, flicker, dust, ... } }`: S14's options for Fruit Bowl rooms (lamp, flicker, alert, bubble, station calls, shower bulge ...), Greenleaf and exec rooms understand `lamp` 0..1, `flicker` 0..1, `dust` 0..1 (specks sifting from the ceiling).
- `roofParts`: 'intact' (default while hanging: FB sign in two halves, chimney of bricks, weathervane), 'rest' (default once docked: the crushed litter at the join), 'sim' or 'none' (the scene draws them itself from the physics; `S15.roofParts` has the rest geometry).
- `crane` `{ trolleyX, hook: [x, y], ropes: [[[x,y]..]x4], load: 'gl'|'exec'|null, off: true }`: `hook` is the hook-block centre (any path you like; default: above the load), `ropes` four polylines from the spreader eyes to the lugs (PHYS2D points); without `ropes` S15 draws taut straight slings.
  The load defaults to 'gl' while `stack` is 0. `crane: false` hides the crane. `lot: false` hides the lot.
- `signs` (see below).

## Crane
`S15.craneRig(lt, st)` -> `{ mastX, jibY, trolley: [x, y], hook: [x, y], spreader: [x, y], eyes: [[x,y]x4] (shackles on the spreader beam), attach: { gl: [[x,y]x4], exec: [[x,y]x4] } (the lugs of each load),
ropes, load, cab: [x, y, w, h] (the cab window: draw `A15.binderSmall` at its centre, between tower() and front()), cabFull }`. Sling x offsets are -400, -140, 140, 400 from the load centre. `S15.crane(lt, st)` draws only the crane.
For a lowering: give `blockPose` from the sim and `crane.hook` from the sim's hook, and `crane.ropes` from its rope bodies. To place the Executive Suite: `exec: 1, execAt: [540, y], crane: { load: 'exec', hook }`.

## Signs (for `SH15.flipText`)
`S15.sign(id, st)` -> `{ id, x0, y0, x1, y1, cx, cy, text, room }` in world coordinates (state applied). ids: `roof` (Fruit Bowl's roof sign), `plate:<room id>` (the name plate under each room, 7.4 px text at zoom 1: dressing, readable from zoom 3),
`door:rest` (BREAK ROOM plate above the break room's door), `board` (rect of the Fruit Bowl station whiteboard; draw on it yourself).
`st.signs[id]` = a string (new text), `{ from, to, u }` (a crude flip at u .5) or **a function `(box) => {...}`** that draws the label inside the plate with `box = { x0, y0, x1, y1, cx, cy, w, h, size }` (call `SH15.flipText` there: exact at rest, hero).
`signs.roof` as a string or function replaces the lettering of the GREENLEAF SENIOR LIVING sign (top of the tower); the FB sign halves are `'roof.a'` (FRUIT BOWL) and `'roof.b'` (REHAB & NURSING).

## Cameras
`S15.cam(view, st, o)` -> `{ x, y, z }` for `zoomTo(c.x, c.y, c.z)`; it aims at the clear band (y 244..1380). `S15.zoom(view, st, o)` applies it. Views: `'wide'` (whole tower and the mast, z about .45), `'tower'`, `'roof'`, `'join'` (the FB/GL seam, z 1.1), `'ground'`,
`'crane'` (jib and hook), `'cab'`, `'hook'`, `'floor:<i>'` (floor index above, whole width, z 1), `'room:<id>'` (z 3.4). `o.z` overrides the zoom, `o.dx, o.dy` nudge. All views follow `st` (sink, exec, hanging block).

## Tips
Dollhouse scale 0.44, feet at `rect.floor`; keep faces out of the caption zone (y 1380..1700) and the pill. Dressing lettering in the rooms fades before it is cut by the frame, like S14's (set `S15.keepOut = [[x0,y0,x1,y1,k]]` for your own hero overlays).
Static art is cached (3x per room); lettering is always live through `UI`; never cache text. `S15.drawItem` is S14's item library. `S15.stairs(lt, st)` is NOT ready yet (it arrives with the dock scene; do not rely on it).
