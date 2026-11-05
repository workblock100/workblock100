# GUIDE_ART20: the Episode 20 art kit (`window.A20`, `ep20_art.js`)

Winter gear for the whole cast, a hatchback the plow buries, the plow truck, Turnip, Eggplant, the picture of Eggplant in the ditch, a snowman and a snow shovel. Contract: `/tmp/shift_tools/briefs/A20_API.md` (names and shapes fixed; the options below are additions). Everything is a pure function of its arguments and `t` (no `Math.random`, no `Date`); soft shapes are cached or cheap. Test bench: `build/ep20_lot/a20_demo.html` with `node build/ep20_lot/shots.js "<view>[&k=v][@x,y,w,h][#name]"` (views in `build/ep20_lot/views.js`: `bare`, `winter`, `car`, `truck`, ...).

## Batch 1: winter gear, the car, the plow truck

### `A20.winter(o, g)` -> `o`
Dresses ANY `drawChar` options object (from `A7.*`, `A11.straw`, `A15.*`, `A20.*`) in winter gear and returns it. `g` (every key optional; `undefined` means the default):

| key | meaning |
|---|---|
| `hat` | `'beanie'` (default), `'earflap'` (trapper hat with fleece flaps and ties), `'hood'` (a bigger dome with fur flaps and a fur ring; no pom), `'none'` |
| `hatColor`, `cuffColor`, `stripeColor` | dome, rolled ribbed cuff, the stripe on the cuff |
| `pom`, `pomColor` | pom-pom on top (beanie only); the default follows `o.who` |
| `scarf` (default true), `scarfColor`, `scarf2` | a knit band under the mouth (below the lowest point the mouth reaches, drawn UNDER the face) with a fringed tail that streams with `wind`; `scarf2` is the stripe colour; `tail: false` leaves the tail off, `tailLen` |
| `mittens` (true), `mitten` | coloured mittens instead of the white gloves (the engine's glove gradient is swapped while the character is drawn) |
| `boots` (true), `boot`, `bootSole` | dark boots with a fur cuff over the ankle (the shoe colours are swapped while the character is drawn; the fur cuff is front view only, at a yaw the shoes are just recoloured) |
| `coat` (false), `coatColor` | a quilted vest from under the scarf to the hem; holds at every yaw |
| `wind` -1..1 | the scarf tail streams, the pom and the hat lean, the earflaps swing; `+` blows to screen right |
| `snow` 0..1 | a dusting on the hat, the pom, the scarf's top edge |
| `shiver` 0..1 | a tiny fast tremble: `o.shiverDx` / `o.shiverDy` (px; add them to `x` / `y`) and a small `o.shake` the engine applies by itself |
| `breath` (false) | a cold puff at the mouth every 1.9 s (`SN20.breath` when the weather kit is loaded, a stand-in puff otherwise); `breathDir` -1/1 (default: the way the face looks), `breathSize` in LOCAL units (1 = a ~60 px puff at body scale 1, default 1; the ditch picture uses .8), `breathAlpha`, `breathPhase` |
| `hatLift`, `hatTall`, `hatMaxW`, `cuffH`, `hatTilt`, `scarfH`, `scarfLift`, `poke` | fine tuning (px); `poke(o, k, t, G, apexY)` draws a stem through the crown |

What it changes: `o.acc` gets `fp20_hat`, `fp20_scarf`, `fp20_coat`, `fp20_boots`, `fp20_breath` (new array; the engine's shared accessory arrays are never mutated); a Strawberry's nurse cap is turned off (`cap: false`), her bandage and anything else that sits where the hat goes (the Onion's visor, the Tomato's headset, hard hats, party hats ...) is dropped; `o.topExtra` grows so the audit's head box includes the hat and the pom; `o.w20` holds the resolved gear. The Binder (`A15.binder`, a flat clip) gets a thin band round the foot of its cover with a short tail; it narrows with its own `yaw15` in profile. Defaults per `o.who`: `straw` red beanie, white pom, cream scarf with red stripes; `mango` orange trapper hat with a teal band and scarf; `lemon` yellow beanie with a navy cuff and pom and a navy scarf; `onion` cream beanie with a green cuff and scarf (the sprout pokes out of the crown); `tom` HR-purple pompom hat; `egg` teal beanie, mustard scarf; `turnip` no hat (his cap is part of him), no scarf. Anything else gets a blue beanie. The hat sits above the brows (its lowest point is 21 px above the brow line plus `browUp`); mittens and boots never touch the face box.
Front, three-quarter (`yaw`) and profile views all work (the knit ribs and the scarf stripes travel round with the turn; the pom stays on top). Traps: call it AFTER the constructor and BEFORE you merge `x`, `y`, `s`, `expr` (it reads `o.kind`, `o.who`, `o.browUp`, `o.seed`, `o.t`); call it every frame (the hat flutters with `o.t`); `A20.winter` installs ONE wrapper around the global `drawChar` (guarded, pass-through for every character that has no `o.w20`), which is how the mittens and boots get their colours: a scene that draws through a captured copy of `drawChar` still gets hat and scarf but white gloves.
```js
const o = A20.winter(A7.straw({ t: lt }), { wind: .6, snow: .5, breath: true }); drawChar(Object.assign(o, { x: 380 + o.shiverDx, y: 1316, s: .8, expr: 'neutral' }));
```
`A20.GEAR` holds the per-`who` defaults; `A20.halfW(kind, y)` is the silhouette's half width at height `y` (cached from the engine's own path) for anyone placing gear.

### `A20.car(ctx, o)` -> box `[x0, y0, x1, y1]` (world units)
A small hatchback, side view. `o = { x, y (ground centre), s (1 = 520 px long, 215 px tall), color, snow 0..1, facing (+1 front to the right, -1), lights, seed, t }`. `color`: any CSS colour; `A20.CAR_COLORS` = `{ red '#d9304f', teal, yellow, grey, white, plum }` (red is Strawberry's). `snow`: 0 clean; **.35 a cap of snow along the roof, hood and trunk** (windows clear); .5 the cap is thick and creeps down the glass; **.7 a mound with the windows buried** (body and wheels show below it); .9 a skirt reaching the wheels; **1 a smooth HILL** (angle-of-repose slopes to the ground, a body-coloured mirror poking out of the snow and the antenna with its red ball: the only signs of a car). It is continuous: animate it with `lerp`/`ease` (the plow raises it from .35 to .9 in a second); the hill spreads to about 690 px wide at `s` 1. `lights: true` adds headlights with a beam (`SN20.beam`, else `FX18.cone`) and a glow while `snow < .6`. `A20.carInfo(o)` returns the same box and key points without drawing: `{ box, mirror, antenna, roof, door, handle, front, rear, hood, wheelF, wheelR, ground }`, all `[x, y]` in world units for the given `x, y, s, facing` (put a character at `door`, a spray at `hood`, a flurry at `roof`).
```js
const box = A20.car(ctx, { x: 540, y: 1250, s: 1.1, color: A20.CAR_COLORS.red, snow: ss(lt, 1.9, 2.9) * .55 + .35, t: lt, seed: 3 });
```
Cost: about 1 ms (a few hundred path points).

### `A20.plowTruck(ctx, o)` -> `{ box, cab, blade, bladeTip, exhaust, beacon, headlight, door }`
A pickup with a V-plow, side view. `o = { x, y, s (1 = 770 px long, 335 px tall), facing, t, blade (the moldboard's lean in radians, default .14; .3 = leaning into a push), load 0..1 (snow heaped in front of the blade), beacon (default true; an amber dome whose glow swells every 2.2 s, never a strobe), beaconOn 0..1, headlights (default true; beam + glow), cab (true: an empty dim cab window with a slanted windshield and a wiper sweeping behind it), snow 0..1 (a dusting on the roof, hood and bed rail, default .25), color (default slate blue), wheelRot (radians: spin the tyres from the distance travelled / 58), seed }`. Returned in world units: `box`; `cab` = `[x0, y0, x1, y1]` the window rectangle (144 x 116 px at `s` 1): clip to it and draw `A20.turnip` inside (scale about .41 x truck `s` fills it); `blade` = the lip of the moldboard (where snow rolls off: emit `SN20.spray` here), `bladeTip` = the cutting edge on the ground, `exhaust` = the top of the stack behind the cab (`FX18.smoke` here), `beacon`, `headlight`, `door`. `A20.truck` is the same function. `A20.cabGlass(ctx, { x, y, s, facing, t })` draws the window's reflections, rain streaks and a sliver of snow on the sill AFTER the driver.
```js
const T1 = A20.plowTruck(ctx, { x: tx, y: 1300, s: .9, t: lt, blade: .3, load: .8, wheelRot: tx / 58 });
ctx.save(); ctx.beginPath(); ctx.rect(...cabRectAsXYWH(T1.cab)); ctx.clip(); drawChar(A20.turnip({ x: .., y: .., s: .41 * .9, noLegs: true, t: lt })); ctx.restore(); A20.cabGlass(ctx, { x: tx, y: 1300, s: .9, t: lt });
```
Cost: about 1.5 ms.

## Batch 2: Turnip, Eggplant, the picture in the ditch

### `A20.turnip(o)` and `A20.eggplant(o)` -> a `drawChar` options object
Two new kinds (`KINDS.turnip`, `KINDS.eggplant`; shape, texture, top and expressions registered through the engine's EXT hooks, `fp20_` names only). Both are made like `A15.onion`: call, merge `x, y, s`, draw with `drawChar`. They come WITH their winter gear (`gear: false` for none, `gear: {...}` overrides `A20.winter`'s keys) and the yaw rig works on them (`yaw`, `headYaw`).
- **Turnip** (the plow driver): a lilac-white bulb with a purple shoulder, a trucker cap with ear flaps (`fp20_cap`, head class) and a hi-vis vest over a work jacket (`fp20_hivis`, wrap class), mittens, flat stare. `pose` `'mug'` (default: the right hand holds his travel mug `fp20_mug`) or `'rest'`; `mugUp` 0..1 raises the mug to a sip (tilts it, `steam` 0..1); `expr` `turnip_flat` (default), `turnip_deadpan`, `turnip_proud` (a very small pride). He is built for the cab window: `noLegs: true`, scale about `.41 x truck s`, then `A20.cabClip` and `A20.cabGlass` (below).
- **Eggplant** (nights, on the phone): a deep-purple eggplant in scrubs (`fp20_scrubs`, sphere-mapped so it holds at every yaw) with a teal beanie her stem pokes through (`poke`), a mustard scarf, lashes and tired eyes. `pose` `'rest'` (default), `'phone'` (right hand holds a lit phone `fp20_phone`, `phoneLit`, `phoneBuzz` 0..1 shakes it), `'slice'` (a pizza slice `fp20_slice`, `bite` 0..1 how much is eaten); `winter: false` leaves the hat and scarf off; `expr` `egg_stuck` (default, patient and worried), `egg_calm` ("Spring."), `egg_cosy` (happy, chewing).
```js
drawChar(Object.assign(A20.eggplant({ t: lt, pose: 'slice', bite: .5, expr: 'egg_cosy' }), { x: 540, y: 1300, s: 1.2 }));
const T1 = A20.plowTruck(ctx, { x: tx, y: 1296, s: .9, t: lt });          // the cab window: clip to it, draw Turnip, then the glass
ctx.save(); A20.cabClip(ctx, { x: tx, y: 1296, s: .9, facing: 1 }); drawChar(Object.assign(A20.turnip({ t: lt, noLegs: true, noShadow: true, noReflect: true }), { x: (T1.cab[0] + T1.cab[2]) / 2, y: T1.cab[3] - 10, s: .41 * .9 })); ctx.restore(); A20.cabGlass(ctx, { x: tx, y: 1296, s: .9, t: lt });
```
`A20.cabClip(ctx, { x, y, s, facing })` sets the clip to the cab window of a truck drawn with the same `x, y, s, facing` (call it inside `ctx.save()`); `A20.cabGlass` draws the reflections, rain streaks and the sill's snow on top.

### `A20.ditchPicture(ctx, o)` -> `{ x0, y0, x1, y1, cx, cy, w, h }` (the box it filled)
Eggplant in her small mint car, nose down in a snowy ditch at night, seen from the front through the windshield, hazard lights ticking, snow falling through the headlight, a pizza box on the passenger seat. Designed on 600 x 720 and fitted to the box (cover), so it works as a small picture-in-picture and as a full-frame card. `o = { x, y (centre), w, h, t, eat, phoneRing, point, settle, frame, zoom, fx, fy, hazards, label, breath }`:
| key | meaning |
|---|---|
| `eat` 0..1 | 0 = the pizza box is shut (nothing to see); .3 = the pie is open and a bitten slice is in her hand; 1 = the whole pie is gone, crumbs, a very happy Eggplant (`egg_cosy`) |
| `phoneRing` 0..1 | the call: her phone lights and she holds it to her ear |
| `point` 0..1 | her free hand points out of the window (for "A ditch.") |
| `settle` 0..1 | she settles in: calm, the beanie dusted, the eyes half closed ("Spring.") |
| `frame` (true) | a white rounded frame and a soft shadow, as a video-call tile |
| `zoom` (1.25), `fx`, `fy` | zoom into the design space and where to focus (design coordinates, default 300, 392; her face is about 320, 335) |
| `hazards` (true), `label` (true) | the amber hazard lamps at the fender corners (a dim 1 Hz blink, never a strobe); the LIVE chip at the top right (`false` = none) |
| `breath` | her breath puff on/off (default on) |
Cost about 1.7 ms. It registers its own Eggplant as a body, so a full-frame use should hide anything it covers from the audit (`REG.suppress++` while drawing that other character).
```js
A20.ditchPicture(ctx, { x: 540, y: 900, w: 560, h: 680, t: lt, eat: 1, frame: true });               // the end card
A20.ditchPicture(ctx, { x: 868, y: 440, w: 340, h: 430, t: lt, eat: 0, phoneRing: 1, frame: true }); // a small tile at the top right
```

## Batch 3: the snowman, the shovel

### `A20.snowman(ctx, o)` -> `[x0, y0, x1, y1]`
A lopsided snowman: three snowballs, coal buttons, a carrot nose, twig arms and a pink party hat. `o = { x, y (ground centre), s (1 = 266 px tall), build 0..1, lean (radians), hat ('party' | 'none'), nose ('carrot'), t, seed, part ('all' | 'body' | 'head'), rot, wave 0..1 }`. `build` is the whole building animation: 0..0.3 the base ball grows, .3 the middle ball pops, .55 the head ball, .74 the face and buttons, .84 the arms, .9 the hat lands. `part: 'body'` leaves the head off; `part: 'head'` draws the head alone with (x, y) = its CENTRE and `rot` rolling it (a head that has fallen off and tumbles). `A20.snowmanInfo(o)` returns `{ head, body, top, base }` points for emitters.

### the shovel: prop `fp20_shovel`, `A20.shovelThrow(o, t, t0)` -> `{ x, y, ang, load, u, release }`
A red-bladed snow shovel with a wooden shaft, held ONE-handed (the hand at hip height 100 px beside the body; the short-armed fruit cannot reach more) so the face stays clear. `fp20_shovel` reads `o.shovelAng` (shaft angle, 0 = straight down, radians; the blade swings out to the side `o.shovelDir` = +1 right / -1 left), `o.shovelLoad` 0..1 (snow heaped on the blade). `A20.shovelThrow(o, t, t0)` sets all of that plus `arms`, `grip` and `hold` on the options object `o` for a dig, lift, throw cycle of `A20.SHOVEL.period` = .6 s starting at `t0` (before `t0` she holds it low and loaded with nothing). In a cycle `u = ((t - t0) / .6) % 1`: **u = 0 the blade goes into the snow (the sound cue), .1 loaded, .38 lifted, .46 the throw (`release` = 1 on that one frame: emit `SN20.spray` at the returned tip), then it swings back**. The return value is the blade tip in WORLD units for the given `o.x, o.y, o.s`: put the spray there and a pit at the plunge point. Call it with the real `x, y, s` already merged into `o`.
```js
const o = A20.winter(A7.straw({ t: lt }), { wind: .3 }); Object.assign(o, { x: 700, y: 1345, s: .46 });
const tip = A20.shovelThrow(o, lt, 12.407); drawChar(o);
if (tip.release) SN20.spray(ctx, { x: tip.x, y: tip.y, ang: -.8, t: lt, t0: lt, t1: lt + .1, seed: 4, power: .95, width: .85, gravity: 1200 });
```

## New names registered (for the audit and for other builders)
- kinds: `eggplant`, `turnip`; expressions `egg_stuck`, `egg_calm`, `egg_cosy`, `turnip_flat`, `turnip_deadpan`, `turnip_proud`.
- `EXT.acc`: `fp20_hat` (head), `fp20_scarf` (wrap), `fp20_coat` (wrap), `fp20_boots` (chest), `fp20_breath` (face), `fp20_cap` (head), `fp20_hivis` (wrap), `fp20_scrubs` (wrap), `fp20_ice` (face; `o.iceBeads` 0..1 freezes the tears into ice beads on the cheeks).
- `EXT.prop`: `fp20_mug` (`mugTilt`, `steam`), `fp20_phone` (`phoneLit`, `phoneBuzz`), `fp20_slice` (`bite`, `sliceRot`), `fp20_shovel` (`shovelAng`, `shovelLoad`, `shovelDir`). Their `PROP_BOX`es are `nearFace` (the owner's own face is exempt, nobody else's).
- `A20.PLATES`, `A20.GEAR`, `A20.CAR_COLORS`, `A20.SHOVEL = { period: .6, release: .46, L: 214 }`, `A20.halfW`.

## Traps learnt the hard way
- Eggplant's and Turnip's `y` is the FEET unless `noLegs: true` (then the body centre sits `ry * .9 * s` above `y`): when you hide the legs, put `y` there, not at the middle.
- `A20.winter` must be called every frame (the hat flutters with `o.t`) and only after the constructor and before you merge `x, y, s, expr`.
- Mittens and boots work through the one `drawChar` wrapper: a scene that keeps a captured copy of `drawChar` draws white gloves.
- A turned character (`yaw`) needs the TURN rig of the gear: all `fp20_` accessories are registered in `V2C.YAW_ACC`; if you add your own accessory read `V2C.yawInfo(o)`.
- The snow kit's emitters (`SN20.spray`, `flurry`, `breath`) are rigid at the x, y you give; flakes drawn AFTER a character can cross a face, so draw impact puffs BEFORE the character.
- Soft shapes are cached or cheap; nothing here calls `Math.random` or `Date`: the same `t` always gives the same frame.

