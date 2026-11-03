# GUIDE_PHYS: phys2d.js (deterministic 2D physics for SHIFT HAPPENS)

One dependency-free file: `window.PHYS2D` in the browser, `require('./phys2d.js')` in node. No DOM, no `Math.random`, no clock, no `Math.sin/cos`: the same code and seed give bit-identical results everywhere.
Fixed step 1/240 s, two internal substeps (up to 8 for fast bodies), sequential impulses with warm start, sleeping islands. Check: `node phys2d_test.js`. Demo: `phys2d_demo.html?scene=crane|jenga|banner&t=3.2` (1080x1920).

## Units and conventions
y points down (canvas), angles are radians clockwise on screen (the `ctx.rotate` direction). Use scene pixels. `unit` (units per metre) is inferred from gravity (|g|/9.8; the dollhouse uses g = 1100 to 1800, about 110 to 184 px per metre) and every tolerance scales with it. Origin of a body = its `x, y` (the centre of mass can differ for compound bodies).

## API in one screen
```js
const w = PHYS2D.world({ gravity:[0,1100], seed:15, dt:1/240, materials:{ name:{density,friction,restitution} }, feel:{ bounce:1, soft:0 } });
w.floor(y, {tag,mat,friction})                      // wide static ground, top surface at y
const b = w.body({ type:'dynamic'|'static'|'kinematic', box:[hw,hh] | circle:r | poly:[[x,y],...<=8] | shapes:[{box|circle|poly, offset:[x,y], angle, density,friction,restitution,mat}],
   x,y,angle, vx,vy,w, mat,density,mass,inertia,friction,restitution, tag,data, group(<0: never collide with same group),category,mask,
   pose:t=>({x,y,angle}) /*kinematic: follows pose(t) and pushes dynamic bodies*/, allowSleep, linearDamping, angularDamping, gravityScale, fixedRotation, silent })
w.joint({ type:'distance'|'spring', a,b, anchorA:[x,y], anchorB:[x,y] /*local*/ | anchor:[wx,wy], length, stiffness,damping | hz,ratio, mode:'max'(rope)|'min'(strut) })
w.joint({ type:'pin', a,b, anchor, lower,upper (rad), motorSpeed,maxMotorTorque })   // revolute
w.joint({ type:'weld', a,b, anchor, hz,ratio })      w.joint({ type:'mouse', b, target:[x,y] | t=>[x,y], hz,ratio,maxForce })
w.joint({ type:'slider', a,b, axis:[x,y] /*in a's frame*/, lower,upper, stiffness,damping | hz,ratio, motorSpeed,maxMotorForce })
   any joint: collideConnected, breakImpulse | breakForce (a break event fires, w.joint returns the joint, w.removeJoint(j))
const r = w.joint({ type:'rope', a,b | pointA,pointB, anchorA,anchorB, segments:20, length, radius, mass, bend, collide:true, category,mask, tag:'cable', mat:'metal' })
   r.releaseA() r.releaseB() r.cut(i)                // a rope is segments+1 hidden particles; total mass defaults to 10 % of the load
const c = w.cloth({ x,y,width,height,cols,rows, wind:{x,y,z,gust,hz,k,ky,gain,phase}, unroll:{t0,dur,r0,snap} /*starts rolled under the top edge*/,
   pins:[top-row column indices], body /*pin the top row to a body*/, hem, bend, iterations, drag, wallZ /*wall plane z*/, floorY })   // x,y screen plane, z toward the viewer
w.schedule(t, w=>{...})   w.warmup(seconds)  /*settle before t=0, call before run*/   w.run(T,{sampleHz:120})
w.at(t[,out]) -> { bodies:[{id,x,y,angle,vx,vy,awake}], by[id], ropes:[{n,pts:Float32Array(x,y,...)}], cloths:[{cols,rows,pts:(x,y,z),roll:{y,r,done}}] }   // pure function of t
w.pose(id,t)   w.makeState()   w.events   w.warnings   w.rand()
PHYS2D.eventsToFoley(w.events, { sceneStart, screen:{w,h,cx,cam:{x,y,zoom}|fn(t)|project}, maxEvents:120, panScale:.85, gain:1 })
PHYS2D.clothNormals(pts,cols,rows)   PHYS2D.stateHash(w,100)   PHYS2D.debugDraw(ctx,w,st)   PHYS2D.sin/cos/rng
```
`at(t)` reuses one state object unless you pass your own (`w.makeState()`); copy what you need before the next call. It is O(bodies) and allocation free (about 9 us for 200 bodies). Add bodies, joints and cloth before `warmup()`/`run()`; `run(T)` simulates once, then draw any time from `at()`.

## Events and foley
`w.events`: `{ t, kind:'hit'|'slide'|'roll'|'break', a,b (body ids), tagA,tagB, matA,matB, x,y, mag 0..1, speed }`, thinned to one per body pair and kind per 60 ms. `mag` is the impact energy on a log scale relative to the world's median mass.
`eventsToFoley` returns `[{ t, name:'phys', mat:'concrete+wood' (alphabetical), mag, pan, x, y, k, tag:'chair+floor' }]`, at most 120 (the first impact of every body, then the loudest), `pan` from x through the camera. Materials: default, wood, metal, cardboard, plastic, glass, fabric, ceramic, rubber, concrete (add your own with `materials`). Give bodies a `mat` and a `tag` (floor/ground, block, hook, cable, roof, room, chair, tray, pot, box, ball, leaf, badge ...): the sound builder keys on `mat` and `tag`. `silent:true` removes a body from the events.
CLI: `node tools_phys_events.js <ep>` reads `build/ep<ep>/phys_sims.json` (`{ "dock":"ep15_dock_sim.js", "x":"file.js#exportName" }`) and `timeline.json` (`scenes[].{id,start}`), runs every `build()` (it runs the world if build did not) and writes `build/ep<ep>/phys_events.json`: a flat array sorted by time, absolute seconds, with `scene`.

## Sim module convention (CONTEXT15)
DOM-free `ep15_<scene>_sim.js`: `build(opts)` returns `{ world, T, screen:{w:1080,h:1920,cx:540,cam}, sceneStart?, maxEvents?, sampleHz?, meta }` (build may run the world itself, otherwise the tool runs it for `T` seconds); also `window.__EP15_SIMS.<id> = { build }` and `module.exports`. `renderAt(t)` stays pure: build once, then `world.at(lt)` or `world.pose(id, lt)`; never step inside a render.

## Tips
- Heavy on light: stacks stand for mass ratios up to about 10:1 on 7 boxes and 50:1 on 3 to 5 boxes (tall misaligned 50:1 stacks fall). Give a heavy load more contact area, or make the lower bodies denser.
- Thin things: the tests stop a 4000 u/s box on a 3 unit platform (about 3 cm at 100 u/m); fast bodies get up to 8 substeps automatically (`maxSubsteps`). Do not scale one world to tiny units: `unit` comes from gravity.
- Believable tower squat (see `crane()` in `phys2d_demo.js`): floors are dynamic bodies, the lowest is static, and a `slider` joint joins each floor to the one below with `axis` tilted a few degrees from vertical, `stiffness = mass_above * g / squat_px`, `damping = 2 * 0.17 * sqrt(stiffness * mass_above)` (zeta 0.17: one visible rebound) and `lower`/`upper` limits (a few px up, about half a floor down). The landing block compresses the springs and the tower settles. Settle everything with `w.warmup(1)` so nothing creeps at t = 0.
- Props that must jump: `restitution` 0.3 to 0.6 and `w.feel.bounce = 1.5` (cartoon bounce); `w.feel.soft` (0..1) makes contacts softer.
- Ropes: use `collide:true` only when the rope must touch things; give it a `category`/`mask` that skips the load. Release with `schedule(t, () => r.releaseB())`. Heavy loads on 20 to 24 segments stretch under 1 % up to a 1000:1 node ratio.
- Cloth: a stiff, nearly inextensible strip. In a front view the z billow is invisible, so draw it with a 3/4 view or perspective and shade with `clothNormals` (see `phys2d_demo.html`). `wind.gust` with a low `k` swings the whole banner, a high `k` ripples it.
- Determinism: never use `Math.random` in a sim; use `w.rand()` (seeded). `PHYS2D.stateHash(w, 100)` must be equal for two builds.

## Known limits
Convex polygons only (up to 8 vertices; use compound `shapes` for concave bodies). No continuous collision between two thin fast bodies beyond the substeps. Cloth has no collisions. 150 awake bodies colliding for 8 s cost 1.2 to 1.4 s in node (a sleeping pile is nearly free); the dock scene (about 130 bodies, 10 s, warmup) takes 1.8 s.
