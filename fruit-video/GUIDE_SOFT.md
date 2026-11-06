# GUIDE_SOFT: soft2d.js (deterministic soft bodies for SHIFT HAPPENS, Episode 22)

One dependency-free file: `window.SOFT2D` in the browser (nothing else global), `require('./soft2d.js')` in node. No DOM in the solver, no `Math.random`, no clock, no `Math.sin/cos` (own `SOFT2D.sin/cos`): the same code and seed give bit-identical results in node and Chromium (checked on every demo case). The contract is `/tmp/shift_tools/briefs/SOFT22_API.md`; everything there exists under the same names; additions are marked ADDED.
Check: `node soft2d_test.js` (15 tests). Demo: `soft2d_demo.html?case=drape|wrap|tear|belt|sling|tape|glove|balloons|print&t=2.4` (1080x1920; `&sheet=0.5,1,2` contact sheet, `&zoom=2.5&cx=540&cy=1150`, `&debug=1` outlines, `&bench=10` warm draw timing). Capture: `node build/soft22/shot.js <case> 0.5,1,2 out.png 0.5`.

## How it works (read this to get good results)
Position-based dynamics, XPBD "small steps": each world step (`dt` 1/240) runs `iterations` (default 12) substeps; each substep integrates the particles, places the pinned ones, solves the constraints once (stretch every substep; shear and bending every other substep with their compliance taken over the doubled step) and pushes particles out of the colliders with Coulomb friction (static and kinetic, relative to a moving collider's surface). Constraints are therefore very stiff (paper does not stretch), contacts are exact to a fraction of a pixel and nothing explodes; velocities are capped at `maxSpeed` (4000 px/s).
**Bake once** (build the world on first use, `run(T)`), then `world.at(lt)` in `draw` (15 to 20 us); never step inside a render. The same sim module serves the picture and the foley tool.
**Particles are 3D** (x, y on screen, z toward the viewer). A cloth lies in the screen plane (`plane:'xy'`, the default: wrapping paper on a gift's front, a sling strip, name slips) or flat (`plane:'xz'`: a pad held level and dropped over a box, which then drapes over its top, front, back and sides; torn scraps tumble in depth). A front view draws x, y; z gives depth order and shading; `view:{ kx:0, ky:0.42 }` in `drawCloth` tilts it (a point at depth z is drawn at y + ky z, so a box's top face shows). Ropes and balloons live in a plane (their z is constant).

## API (as built)
```js
const w = SOFT2D.world({ gravity:[0,1500], dt:1/240, iterations:12, seed:22, damping:.02, air:0, wind:[0,0,0] /*ADDED*/, maxSpeed:4000 /*ADDED*/, materials:{} });
const box = w.collider({ box:[hw,hh] | circle:r | capsule:[halfLen,r] | poly:[[x,y],...] (convex, any winding) | floor:y | ceiling:y | wall:x,
  x, y, angle, pose: t => ({x,y,angle}) /*kinematic, carries cloth by friction*/, friction, mat, tag, skin, silent,
  z, depth /*ADDED: a slab of finite depth centred on z; default infinite = the 2D shape extruded*/, side /*ADDED wall: +1 free space to the right, -1 left (default by screen half)*/, sticky /*ADDED*/ });
const pad = w.cloth({ x, y /*top-left*/ | cx, cy /*ADDED: centre, per axis*/, width, height, cols, rows, angle, plane:'xy'|'xz' /*ADDED*/, z /*ADDED*/,
  mass, stretch, shear, bend, mat, tag, pins:[{ i, j /*negative counts from the end*/, to, from, until }], tear, collide:true|[ids], friction, thickness,
  damping, flutter, gravityScale, active:[t0,t1], silent /*ADDED*/ });     // the object: pad.id, pad.index(i,j), pad.n, pad.cols, pad.rows
const r = w.rope({ points:[[x,y],...] | from, to, length /*ADDED: longer than from-to sags; from = to with a length starts it coiled at a point*/, segments, mass, stretch, bend,
  width, thickness /*ADDED: collision radius, default width/2*/, mat, tag, pins:[{ k /*-1 = last*/, to, from, until }], tear, collide, friction, z, damping, gravityScale, active, sticky });
const g = w.balloon({ x, y, outline:'glove'|'circle'|[[x,y],...], scale, segments:64, mass, stretch:.02, bend:.15, pressure:1|t=>p, buoyancy, mat:'nitrile', tag,
  pins:[{ k /*0 = the knot*/, to, from, until }], collide, softCollide, pop:{ pressure:3 },
  shape:.004, limp:.03, gasHz:5, keel:true, radius /*circle*/, active /*ADDED*/ });      // g.tips (ADDED): particle indices of the five finger tips
// pin targets: [x,y(,z)] | t => [x,y(,z)] | { collider:id, local:[x,y] } | { obj:id, index:k } (ADDED: follow another particle) | omitted (ADDED: held where it is)
w.pin(id, index, to, { from, until })   w.unpin(id, index) /*ADDED*/   w.release(id) /*ADDED: all its pins off*/   w.cut(id, a, b)
w.rip(id, { path:[[u,v],...], t0, t1, jag:.3 }) /*ADDED: unzip a tear along a path in rest space (0..1)*/
w.set(id, { gravityScale, damping, flutter, friction, pressure, buoyancy }) /*ADDED*/   w.setPressure(id, p)   w.schedule(t, w => {...})
w.warmup(seconds)   w.run(T, { sampleHz:120 })   w.at(t[, out])   w.makeState() /*ADDED*/   w.object(id) /*ADDED*/   w.colliderPose(id, t) /*ADDED*/
w.events   w.warnings   w.rand()   w.kind === 'soft'
SOFT2D.drawCloth(ctx, st.by[pad.id], { fill:'#c62828' | (ctx, w, h) => {...print in rest space...}, back:'#f4f1ea', shade:.35, edge:{color,width}, quilt:0, ragged:1, fiber, alpha:1,
  view:{kx,ky}, zMin, zMax /*ADDED: only the triangles in that depth range*/, res:1.5 /*ADDED: print px per rest px*/, smooth:true /*ADDED*/, coarse /*ADDED*/ })
SOFT2D.drawRope(ctx, st.by[r.id], { width, color, style:'ribbon'|'belt'|'tape'|'tinsel'|'cord', buckle, alpha, shadow:true, twist:1.4, colors /*tinsel*/ })
SOFT2D.drawBalloon(ctx, st.by[g.id], { fill:'#8e6bd1', outline:'#3b2566', shine:.6, cuff:true, alpha })
SOFT2D.gloveOutline({ scale, puff:1 /*0 = the flat glove*/, segments })   SOFT2D.eventsToFoley(w.events, { sceneStart, screen, maxEvents:120, gain })
SOFT2D.stateHash(w, n)   SOFT2D.debugDraw(ctx, w, st)   SOFT2D.project(x, y, z, view)   SOFT2D.sin/cos/rng   SOFT2D.materials
```
`w.at(t)` returns `{ t, cloths:[{ id, tag, mat, cols, rows, width, height, pts:(x,y...), z, uv, tri, alive /*per triangle*/, torn /*per particle*/, flat }], ropes:[{ id, n, pts, alive /*per segment*/ }], balloons:[{ id, n, pts, area, area0, pressure, popped, outline, tips }], colliders:[{ id, x, y, angle }], by:{ [id]: state } }`. It REUSES one state object unless you pass your own (`w.makeState()`): copy what you need before the next call. Ids are unique across colliders and objects.

## Softness and materials
`stretch`, `shear`, `bend` are softness: 0 rigid; s is about the strain one cell takes under the weight of one particle (0.01 stiff, 1 floppy). Defaults from `mat`:

| mat | use | friction | stretch / shear / bend | damping | flutter | thickness | tear |
|---|---|---|---|---|---|---|---|
| paper | wrapping paper, name slips | .45 | 0 / .002 / .03 | .8 | 1.0 | 1.5 | 1.25 |
| chux | the blue underpad | .75 | .001 / .01 / .35 | 1.6 | .45 | 3 | 1.6 |
| fabric | the Hoyer sling | .8 | .003 / .03 / .9 | 1.4 | .6 | 2.5 | 1.8 |
| canvas | the gait belt | .8 | 0 / .01 / .08 | 1.4 | .25 | 3 | 2 |
| ribbon | curling ribbon | .25 | 0 / .02 / .35 | .9 | .8 | 1.5 | 1.6 |
| tape | paper tape (sticky) | .9 | 0 / .01 / .2 | 1.0 | .6 | 1.2 | 1.3 |
| tinsel | garland | .4 | 0 / .05 / 3 | .8 | 1.2 | 4 | 2 |
| nitrile | glove | .9 | .02 / .05 / .15 | 1.0 | .4 | 2 | 2 |
| string | light cords | .5 | 0 / .05 / 6 | .8 | .5 | 1 | 2 |
Collider materials (friction only; the sound keys on the names): default, wood, metal, cardboard, plastic, glass, ceramic, rubber, concrete, skin, felt. Contact friction is `sqrt(object friction x collider friction)`. `damping` is air drag on every particle (1/s); `flutter` is drag on a sheet's normal (1: a flat sheet falls at about g/6, 250 px/s; a flat Chux drops slowly, so carry it with pins or lower `flutter` to drop it fast; edge-on it slips through the air: scraps glide and tumble).

## Recipes (each is a case in soft2d_demo.js)
- **Drape over a box** (`drape`): `w.collider({ box:[hw,hh], x, y, depth:2*hd })`, `w.cloth({ cx, y: boxTop - 100, width, height, plane:'xz', mat:'chux' })`. Draw with the same `view` as your box: the cloth behind the box first (`zMax:-hd`), then the box, then the rest (`zMin:-hd`).
- **Fold it round the box** (`wrap`): after it settles, in a `schedule`, pin each particle of a flap's edge row (start from its current position `w.x[w.object(id).p0 + k]`) to an eased path that carries it under the box.
- **Rip the paper off a gift** (`tear`): paper `gravityScale:0` with its border pinned (folded round the box edges), `collide:[]` (it lies on the box's face), a 3 x 3 grip pinned to the hand; at the rip `w.set(id, { gravityScale:1 })`, `w.unpin` the flap's border particles (the paper comes off the box edge there), `w.rip(id, { path, t0, t1:t0+.3, jag:.6 })` with the rip LEADING the hand (the hand eases in over a second), release the grip. Keep `tear:{ strain:1.8 }` as a safety valve.
- **A Hoyer sling** (`sling`): a strip `cols 26, rows 5` in the screen plane, both end columns pinned to the hooks (functions of time for the lift), `collide:[body.id]` with Santa a kinematic circle (`pose`).
- **A belt round a body** (`belt`): the buckle end pinned to the body (`{ collider: body.id, local }`), the free end on the hand's path round the body, then a tug; `drawRope(..., { style:'belt', buckle:true })`. Two pins pulling an inextensible strap apart stretch it by exactly the pull.
- **Paper tape off a roll** (`tape`): `rope({ from: exit, to: exit, length: whole strip, mat:'tape' })`, every particle pinned at the exit until the hand has pulled it out, the end on the hand, pressed onto a `sticky:true` collider, then `w.cut(id, 0, 1)` at the roll and `unpin` what is left on it.
- **The glove** (`glove`): `w.balloon({ outline:'glove', pressure: t => 0 .. 1.1 over a breath, buoyancy:1850, pins:[{ k:0, to: hand, until: release }] })`. Pressure 0 is the flat, thin-fingered glove hanging limp; 1 is the puffed glove (five fat fingers, round palm, narrow knotted cuff). Three breaths = three ramps.
- **A dozen glove balloons on the ceiling** (`balloons`): `ceiling:y` collider, `softCollide:true` on each, staggered pressure ramps and releases; they rise knot-down (`keel`) and push each other along the ceiling (about 1 s of baking for 12 x 56 segments x 4.5 s).

## Tearing
`tear:{ strain:1.3, jag:.35 }` (or `true` for the material's default): a constraint whose smoothed length passes `1 + (strain - 1)(1 +/- jag)` of its rest length breaks; each object breaks only its single worst constraint per substep, so a tear runs from the stress concentration as one front. A torn triangle disappears (a gap about half a cell wide); `drawCloth` draws white ragged fibres along the torn edges (`ragged:1`, `fiber` colour). A particle left with no triangle is frozen (invisible, inert). The event carries the local `strain` at the break. Pulled between pins, a sheet tears when ONE cell reaches the strain; the sheet as a whole is then stretched far less (a strip with strain 1.2 tears at about 1.04 overall). Physical tearing alone tears a plug round a small grip: for a directed rip use `w.rip`.

## Balloons
`pressure` 0 limp, 1 the outline, above 1 bigger and rounder; the shape morphs from the flat outline to the full one and is held by a firm shape spring (`shape` .004 full, `limp` .03; bigger is wobblier) plus a gas spring (`gasHz` 5) that keeps the area when it is squashed. `buoyancy` (px/s^2) is an upward acceleration ADDED at full fill (area over the outline's area): it floats when buoyancy exceeds gravity (gravity 1500, buoyancy 1850 rises at about 350 px/s^2, `damping` caps the speed). The knot and cuff get no lift, so it rises knot-down. `pop:{ pressure:3 }` bursts it once (a 'pop' event; `popped` in the state; drawn as a limp scrap). `g.tips` gives the five finger tips (pinky, ring, middle, index, thumb) to hang a face or a ribbon on.

## Events and the foley tool
`w.events`: `{ t, kind, id, tag, mat, matB, tagB, b, x, y, mag, speed?, len?, strain?, rate? }`, one per object and kind per 50 ms (the louder kept). Kinds: `tear` (len torn), `crinkle` (stiff paper folding fast), `hit` (meeting a collider, or balloon on balloon: a bonk), `slide` (rubbing along a collider), `squeak` (nitrile rubbing a collider or another balloon), `stretch` (a strap or ribbon snapping taut), `pop`, `flap` (a sheet or ribbon whipping through the air: shaking out the Chux, a scrap falling). An object outside its `active` window, or `silent`, makes none.
`SOFT2D.eventsToFoley(w.events, { sceneStart, screen:{ w, h, cx, cam }, maxEvents })` gives `[{ t, name:'soft', mat:'paper'|'chux+cardboard', mag, pan, x, y, k, tag:'wrap'|'glove+ceiling', len? }]`, capped (the first event of each object and kind, then the loudest), off-screen events quieter.
`node tools_phys_events.js 22` runs every sim in `build/ep22/phys_sims.json`: a scene may map to an array (`{ "swap": ["ep22_swap_rigid_sim.js", "ep22_swap_sim.js"] }`); soft worlds go through SOFT2D, rigid ones through PHYS2D, all merged and sorted. Episodes 15 to 21 give byte-identical `phys_events.json` (checked against the committed files).

## Budgets (measured on this shared 4-core machine)
- Bake: a 24 x 24 cloth with three colliders, 10 s at 240 Hz: 1.35 to 1.5 s of CPU in node; twelve gloves with softCollide, 4.5 s: about 0.75 to 0.95 s; the santa sim (belt + sling, 27.7 s): 1.45 s. `at(t)`: 15 to 20 us.
- Draw (headless Chromium, software raster, including rasterization): a 24 x 24 solid flat cloth about 1 ms; printed (texture-mapped) 6 to 10 ms, 3.5 to 4.5 ms with `smooth:false`; a draped 3D printed cloth about 9 ms, solid about 5 ms. The print texture is built once per fill function and size (the first frame pays about 15 ms). Cost scales with the cloth's pixel area; `coarse` (cells of 2 or 3 quads textured as one where flat) is chosen automatically.
- Long scenes: give each object an `active:[t0, t1]` window (frozen before and after, pins included): a 26 s scene then costs only the seconds where things move.

## Traps
- `x, y` of a cloth is its top-left corner (as in PHYS2D); `cx`/`cy` centre it (per axis).
- A pin far from where its particle starts makes it jump on the first step: create the object where its pins are, or `warmup()`. When an `active` window opens, its pins pull it to their targets: start it where they are.
- Two pins (or a pin and a collider) that disagree stretch anything between them, and a released over-stretched rope snaps back (capped at `maxSpeed`): never pull a rope longer than its `length`.
- `collide:true` means every collider. Wrapping paper on a gift's front must not collide with that box: `collide:[]` or a list.
- Draw order of 3D cloth is back to front per triangle; parts behind and in front of your own art need two calls with `zMin`/`zMax`.
- `w.at()` reuses its state object: two times at once need `w.makeState()`.
- A flat (screen-plane) piece that lands on a floor folds onto the floor line (a sliver): let scraps fly out of frame, keep them in hand, or drop them on a 3D table drawn with `view`.
- Determinism: use `SOFT2D.sin/cos` (not `Math.sin/cos/atan2/pow/exp`) in pin paths, poses and build-time layout inside a sim: Chromium's Math may differ from node's in the last bit and the picture and the foley would drift apart.
- Objects that are simulated before they are seen still make events (a belt flapping at t = 0 off screen): use `active` or `silent`.
