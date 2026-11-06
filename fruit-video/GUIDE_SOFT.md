# GUIDE_SOFT: soft2d.js (deterministic soft bodies for SHIFT HAPPENS, Episode 22)

One dependency-free file: `window.SOFT2D` in the browser, `require('./soft2d.js')` in node. No DOM in the solver, no `Math.random`, no clock, no `Math.sin/cos` (own `SOFT2D.sin/cos`): the same code and seed give bit-identical results in node and the browser. The contract is `/tmp/shift_tools/briefs/SOFT22_API.md`; everything there exists with the same names; additions are marked ADDED. Demo: `soft2d_demo.html?case=drape|wrap|tear|belt|sling|tape&t=2.4` (1080x1920, `&sheet=0.5,1,2` for a contact sheet, `&zoom=2.5&cx=540&cy=1150` to look closer, `&debug=1` for outlines). Capture: `node build/soft22/shot.js <case> 0.5,1,2 out.png 0.5`.

**Status: batches 1 and 2** (world, colliders, cloth, rope, pins, schedule, warmup, run, at, drawCloth, drawRope; tearing and `rip` paths with ragged edges, balloons and the glove, buoyancy, ceilings, `softCollide`, drawBalloon, events, eventsToFoley, the foley tool, sticky tape). Batch 3 (tests, budgets, the final guide) follows.

## How it works (what you need to know to get good results)
Position-based dynamics, XPBD "small steps": each world step (`dt` 1/240) runs `iterations` (default 12) substeps; each substep integrates the particles, places the pinned ones, solves every constraint once and pushes particles out of the colliders with Coulomb friction. So constraints are very stiff (paper does not stretch), collisions are exact to a fraction of a pixel and nothing explodes. Cost: about 1.2 to 1.6 s per 10 s for a 24 x 24 cloth with three colliders in node; ropes and small cloths are nearly free. **Bake once** (build the world on first use, `run(T)`), then `world.at(lt)` in `draw` (about 20 us); never step inside a render.

**Particles are 3D** (x, y on screen, z toward the viewer). A cloth can lie in the screen plane (`plane:'xy'`, the default: wrapping paper on a gift's front, a sling strip, name slips) or flat (`plane:'xz'`: a pad held horizontally and dropped over a box, which then drapes over the box's top, front, back and sides). A front view draws x, y and ignores z except for depth order and shading; `view:{ kx:0, ky:0.42 }` in `drawCloth` tilts it (a point at depth z is drawn at y + ky z, so the top face of a box shows). Ropes and balloons live in a plane (their z is constant).

## API (as built)
```js
const w = SOFT2D.world({ gravity:[0,1500], dt:1/240, iterations:12, seed:22, damping:.02, air:0, wind:[0,0,0] /*ADDED*/, materials:{} });
const box = w.collider({ box:[hw,hh] | circle:r | capsule:[halfLen,r] | poly:[[x,y],...] | floor:y | ceiling:y | wall:x,
  x, y, angle, pose: t => ({x,y,angle}), friction, mat, tag, skin,
  z, depth /*ADDED: a slab of finite depth (centre z); default infinite = a 2D shape extruded*/, side /*ADDED wall: +1 free space right, -1 left (default by screen half)*/, sticky /*ADDED*/, silent });
const pad = w.cloth({ x, y /*top-left*/ | cx, cy /*ADDED: centre, per axis*/, width, height, cols, rows, angle, plane:'xy'|'xz' /*ADDED*/, z /*ADDED*/,
  mass, stretch, shear, bend, mat, tag, pins:[{ i, j /*negative counts from the end*/, to, from, until }], tear, collide:true|[ids], friction, thickness,
  damping, flutter, gravityScale /*ADDED*/ });              // -> the object: pad.id, pad.index(i,j), pad.n, pad.cols, pad.rows
const r = w.rope({ points:[[x,y],...] | from, to, length /*ADDED: longer than from-to sags*/, segments, mass, stretch, bend, width, thickness /*ADDED: collision radius, default width/2*/,
  mat, tag, pins:[{ k /*-1 = last*/, to, from, until }], tear, collide, friction, z });
// pin targets: [x,y(,z)] | t => [x,y(,z)] | { collider:id, local:[x,y] } | { obj:id, index:k } (ADDED: follow another particle) | omitted (ADDED: held where it is)
w.pin(id, index, to, { from, until })   w.unpin(id, index) /*ADDED*/   w.release(id) /*ADDED: all its pins off*/
w.cut(id, a, b)   w.set(id, { gravityScale, damping, flutter, friction, pressure, buoyancy }) /*ADDED*/   w.schedule(t, w => {...})
w.rip(id, { path:[[u,v],...] /*rest space 0..1*/, t0, t1, jag:.3 }) /*ADDED: unzip a tear along a path*/
const g = w.balloon({ x, y, outline:'glove'|'circle'|[[x,y],...], scale, segments:64, mass, stretch:.02, bend:.15, pressure:1|t=>p, buoyancy,
  mat:'nitrile', tag, pins:[{ k /*0 = the knot*/, to, from, until }], collide, softCollide, pop:{ pressure:3 },
  shape:.004, limp:.03, gasHz:5, keel:true, radius /*circle*/ /*ADDED*/ })
w.warmup(seconds)   w.run(T, { sampleHz:120 })   w.at(t[, out])   w.makeState() /*ADDED*/   w.object(id) /*ADDED*/   w.colliderPose(id, t) /*ADDED*/
w.events   w.warnings   w.rand()   w.kind === 'soft'
SOFT2D.drawCloth(ctx, st.by[pad.id] | st.cloths[0], { fill:'#c62828' | (ctx, w, h) => {...print in rest space...}, back:'#f4f1ea', shade:.35, edge:{color,width}, quilt:0, ragged:1, alpha:1,
  view:{kx,ky} /*ADDED*/, zMin, zMax /*ADDED: draw only the triangles in that depth range*/, res:1.5 /*ADDED: print texture px per rest px*/ })
SOFT2D.drawRope(ctx, st.by[r.id], { width, color, style:'ribbon'|'belt'|'tape'|'tinsel'|'cord', buckle, alpha, shadow:true /*ADDED*/, twist:1.4 /*ADDED ribbon*/, colors /*ADDED tinsel*/ })
SOFT2D.drawBalloon(ctx, st.by[g.id], { fill:'#8e6bd1', outline:'#3b2566', shine:.6, cuff:true, alpha })
SOFT2D.gloveOutline({ scale, puff:1 /*0 = the flat glove*/, segments /*ADDED*/ })   SOFT2D.eventsToFoley(w.events, { sceneStart, screen, maxEvents:120, gain })
SOFT2D.debugDraw(ctx, w, st)   SOFT2D.project(x, y, z, view) /*ADDED*/   SOFT2D.stateHash(w, n)   SOFT2D.sin/cos/rng   SOFT2D.materials
```
`w.at(t)` returns `{ t, cloths:[{ id, cols, rows, width, height, pts:(x,y...), z, uv, tri, alive, torn, flat }], ropes:[{ id, n, pts, alive /*per segment*/ }], balloons:[...], colliders:[{ id, x, y, angle }], by:{ [id]: state } }`. It reuses one state object unless you pass your own `out` (`w.makeState()`). Ids are unique across colliders and objects.

## Softness, materials
`stretch`, `shear`, `bend` are softness: 0 is rigid; s is roughly the strain a cell takes under the weight of one particle (so 0.01 is stiff, 1 is floppy). Defaults come from `mat`:

| mat | use | friction | stretch / shear / bend | damping | flutter | thickness |
|---|---|---|---|---|---|---|
| paper | wrapping paper, name slips | .45 | 0 / .002 / .03 | .8 | 1.0 | 1.5 |
| chux | the blue underpad | .75 | .001 / .01 / .35 | 1.6 | .45 | 3 |
| fabric | the Hoyer sling, a scarf | .8 | .003 / .03 / .9 | 1.4 | .6 | 2.5 |
| canvas | the gait belt | .8 | 0 / .01 / .08 | 1.4 | .25 | 3 |
| ribbon | curling ribbon | .25 | 0 / .02 / .35 | .9 | .8 | 1.5 |
| tape | paper tape (sticky) | .9 | 0 / .01 / .2 | 1.0 | .6 | 1.2 |
| tinsel | garland | .4 | 0 / .05 / 3 | .8 | 1.2 | 4 |
| nitrile | glove | .9 | .02 / .05 / .15 | 1.0 | .4 | 2 |
| string | light cords | .5 | 0 / .05 / 6 | .8 | .5 | 1 |
Collider materials (friction only; the sound keys on the names): default, wood, metal, cardboard, plastic, glass, ceramic, rubber, concrete, skin, felt. `damping` is air drag on every particle (1/s); `flutter` is drag on a sheet's normal (1 = a flat sheet falls at about g/6, about 250 px/s: a Chux dropped flat takes a while; lower it or carry it with pins to drop it fast). A rope's `thickness` (collision radius) defaults to `width / 2` so a strap wrapped round a body does not sink into it; use a small thickness for a ribbon lying flat on a surface.

## Recipes
- **Drape over a box (3D)**: `w.collider({ box:[hw,hh], x, y, depth:2*hd })` and `w.cloth({ cx, y: boxTop - 100, width, height, plane:'xz', mat:'chux' })`. Draw with the same `view` as your box: cloth behind the box first (`zMax: -hd`), then the box, then the rest (`zMin: -hd`). See `CASES.drape` in `soft2d_demo.js`.
- **Fold round it** (the wrap): after it settles, `w.schedule(t0, w => w.pin(pad.id, idx, t => [...], { until }))` for each particle of a flap's edge row, carrying it under the box along an eased path (start from its current position: read `w.x[w.object(id).p0 + idx]` inside the schedule). See `CASES.wrap`.
- **A sling**: a strip `cols 26, rows 5` in the screen plane, both end columns pinned to the hooks (pins with functions of time for the lift), `collide:[santaCircle.id]` where the circle is kinematic (`pose: t => ...`). See `CASES.sling`.
- **A belt round a body**: the buckle end pinned to the body (`{ collider: body.id, local:[...] }`), the free end on a pin following the hand round the body, then tugged. `drawRope(..., { style:'belt', buckle:true })`. See `CASES.belt`.
- **Paper glued to a gift's front**: pin the border, and keep it from sagging with `gravityScale:0` until the rip starts (`w.set(id, { gravityScale:1 })` in a schedule).

## Tearing (batch 2)
- `tear:{ strain:1.3, jag:.35 }` (or `tear:true` for the material's default) breaks a constraint stretched past `1 + (strain - 1)(1 +/- jag)` of its length; each object breaks its single worst constraint per substep, so a tear runs from the stress concentration as one front. A torn triangle disappears (a gap about half a cell wide) and `drawCloth` draws thin white fibres along the torn edges (`ragged:1`, `fiber` colour).
- Physical tearing alone tears a plug round a small grip. For an art-directed rip use **`w.rip(id, { path:[[0.42,0],[0.62,0.45],[1,0.78]], t0, t1, jag:.6 })`**: the tear unzips along that path (rest space: u across, v down, 0 to 1) between t0 and t1, wobbling by `jag` cells; a rip that starts or ends on the border cuts through it. Keep `tear` as a safety valve with a high strain (1.8).
- Recipe (the gift rip, `CASES.tear`): paper `gravityScale:0` with its border pinned; a grip of 3 x 3 pins on a corner; at the rip, `w.set(id, { gravityScale:1 })` and `w.unpin` the border particles of the flap (the paper comes off the box edge there; a flap still pinned to the box while the hand drags it 600 px is shredded); the rip leads the hand (rip 0.3 s, hand eases in over 1 s); release the grip and the flap falls. A flap that lands on a floor in the screen plane folds onto the floor line (a sliver): let it fly out of frame, keep it in hand, or drop it on a 3D table drawn with `view`.

## Balloons and the glove (batch 2)
- `pressure`: 0 limp (a flat, thin-fingered glove that hangs from the knot), 1 the outline (`gloveOutline()` puffed: five fat fingers, round palm, narrow knotted cuff), above 1 bigger and rounder. Animate it with a function of time (0 to 1.1 over 0.5 to 1 s is a breath). The shape morphs from the flat glove to the puffed one and is held by a firm shape spring (`shape` .004 full, `limp` .03 limp; bigger is wobblier), with a gas spring (`gasHz` 5) that keeps the area when it is squashed on the ceiling.
- `buoyancy` (px/s^2) is an upward acceleration ADDED at full fill (the area over the outline's area), so it floats when buoyancy is above gravity: with gravity 1500, `buoyancy:1850` rises at about 350 px/s^2 and air drag (`damping`) caps the speed. The knot and cuff get no lift (`keel`), so it rises knot-down.
- A `ceiling:y` collider stops it; `softCollide:true` on every balloon makes them push each other (a spatial hash; 12 gloves of 56 segments for 4.5 s bake in about 2 s). Pin the knot (`k:0`) to the hand with `until` to let go. `pop:{ pressure:3 }` bursts it when the pressure passes 3 (a 'pop' event).
- `drawBalloon` draws a smooth outline, an inner shade, a dark outline, the shine and (glove) the rolled cuff and the knot.

## Sticky tape (batch 2)
A rope with `mat:'tape'` (or `sticky:true`) sticks where it touches a collider with `sticky:true`: the touching particle is pinned to the collider at that point from then on (it follows a kinematic collider). Unroll recipe (`CASES.tape`): create the tape at the roll's exit with zero span and `length` = the whole strip; pin every particle at the exit until the hand has pulled it out, the end on the hand; press it down so it touches; `w.cut(id, 0, 1)` at the roll and `unpin` what is left on it. Never pull a rope longer than its `length` between two pins (it stretches and snaps back; speeds are capped at `maxSpeed`, 4000 px/s).

## Events and the foley tool (batch 2)
`w.events`: `{ t, kind, id, tag, mat, matB, tagB, b, x, y, mag, speed?, len?, rate? }`, one per object and kind per 50 ms (the louder kept). Kinds: `tear` (len torn), `crinkle` (stiff paper folding fast), `hit` (a particle meeting a collider, or balloon on balloon), `slide` (rubbing along a collider), `squeak` (nitrile rubbing), `stretch` (a strap or ribbon snapping taut), `pop`, `flap` (a sheet or ribbon whipping through the air). `SOFT2D.eventsToFoley` gives `[{ t, name:'soft', mat:'paper'|'chux+cardboard', mag, pan, x, y, k, tag:'wrap'|'glove+ceiling', len? }]` capped at `maxEvents` (the first event of each object and kind, then the loudest).
`node tools_phys_events.js 22` runs every sim in `build/ep22/phys_sims.json`; a scene may map to an array (`{ "swap": ["ep22_swap_rigid_sim.js", "ep22_swap_sim.js"] }`), soft worlds (`w.kind === 'soft'`) go through SOFT2D, the rest through PHYS2D, all merged and sorted. Episodes 15 to 21 give byte-identical `phys_events.json` (checked).

## Traps
- A pin moved far from where its particle starts makes it jump on the first step: create the cloth where its pins are, or `warmup()`.
- Two pins (or a pin and a collider) that disagree stretch anything between them: an inextensible rope pulled longer than its length stretches; a pinned paper pulled too far tears (when `tear` is on).
- The cloth's `x, y` is its top-left corner (as in PHYS2D); use `cx`/`cy` for the centre.
- `collide:true` means every collider. A cloth in front of a box face (wrapping paper on a gift's front) must not collide with that box: `collide:[]` or a list.
- Draw order of 3D cloth is per triangle back to front, so parts of one cloth behind and in front of your own art need two calls with `zMin`/`zMax`.
- Use `SOFT2D.sin/cos` (not `Math.sin/cos`) in pin paths and poses inside a sim: the browser's Math functions may differ from node's and the hash (and the foley) would drift.
