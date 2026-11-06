# GUIDE_SOFT: soft2d.js (deterministic soft bodies for SHIFT HAPPENS, Episode 22)

One dependency-free file: `window.SOFT2D` in the browser, `require('./soft2d.js')` in node. No DOM in the solver, no `Math.random`, no clock, no `Math.sin/cos` (own `SOFT2D.sin/cos`): the same code and seed give bit-identical results in node and the browser. The contract is `/tmp/shift_tools/briefs/SOFT22_API.md`; everything there exists with the same names; additions are marked ADDED. Demo: `soft2d_demo.html?case=drape|wrap|tear|belt|sling|tape&t=2.4` (1080x1920, `&sheet=0.5,1,2` for a contact sheet, `&zoom=2.5&cx=540&cy=1150` to look closer, `&debug=1` for outlines). Capture: `node build/soft22/shot.js <case> 0.5,1,2 out.png 0.5`.

**Status: batch 1 (world, colliders, cloth, rope, pins, schedule, warmup, run, at, drawCloth, drawRope).** Batch 2 (rip paths, balloons and the glove, events and eventsToFoley final, the foley tool, sticky tape) and batch 3 (softCollide, tests, budgets) follow; this guide grows with them.

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
w.warmup(seconds)   w.run(T, { sampleHz:120 })   w.at(t[, out])   w.makeState() /*ADDED*/   w.object(id) /*ADDED*/   w.colliderPose(id, t) /*ADDED*/
w.events   w.warnings   w.rand()   w.kind === 'soft'
SOFT2D.drawCloth(ctx, st.by[pad.id] | st.cloths[0], { fill:'#c62828' | (ctx, w, h) => {...print in rest space...}, back:'#f4f1ea', shade:.35, edge:{color,width}, quilt:0, ragged:1, alpha:1,
  view:{kx,ky} /*ADDED*/, zMin, zMax /*ADDED: draw only the triangles in that depth range*/, res:1.5 /*ADDED: print texture px per rest px*/ })
SOFT2D.drawRope(ctx, st.by[r.id], { width, color, style:'ribbon'|'belt'|'tape'|'tinsel'|'cord', buckle, alpha, shadow:true /*ADDED*/, twist:1.4 /*ADDED ribbon*/, colors /*ADDED tinsel*/ })
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

## Traps
- A pin moved far from where its particle starts makes it jump on the first step: create the cloth where its pins are, or `warmup()`.
- Two pins (or a pin and a collider) that disagree stretch anything between them: an inextensible rope pulled longer than its length stretches; a pinned paper pulled too far tears (when `tear` is on).
- The cloth's `x, y` is its top-left corner (as in PHYS2D); use `cx`/`cy` for the centre.
- `collide:true` means every collider. A cloth in front of a box face (wrapping paper on a gift's front) must not collide with that box: `collide:[]` or a list.
- Draw order of 3D cloth is per triangle back to front, so parts of one cloth behind and in front of your own art need two calls with `zMin`/`zMax`.
