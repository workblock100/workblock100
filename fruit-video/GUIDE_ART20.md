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
| `breath` (false) | a cold puff at the mouth every 1.9 s (`SN20.breath` when the weather kit is loaded, a stand-in puff otherwise); `breathDir` -1/1, `breathSize`, `breathPhase` |
| `hatLift`, `hatTall`, `hatMaxW`, `cuffH`, `hatTilt`, `scarfH`, `scarfLift`, `poke` | fine tuning (px); `poke(o, k, t, G, apexY)` draws a stem through the crown |

What it changes: `o.acc` gets `fp20_hat`, `fp20_scarf`, `fp20_coat`, `fp20_boots`, `fp20_breath` (new array; the engine's shared accessory arrays are never mutated); a Strawberry's nurse cap is turned off (`cap: false`), her bandage and anything else that sits where the hat goes (the Onion's visor, the Tomato's headset, hard hats, party hats ...) is dropped; `o.topExtra` grows so the audit's head box includes the hat and the pom; `o.w20` holds the resolved gear. Defaults per `o.who`: `straw` red beanie, white pom, cream scarf with red stripes; `mango` orange trapper hat with a teal band and scarf; `lemon` yellow beanie with a navy cuff and pom and a navy scarf; `onion` cream beanie with a green cuff and scarf (the sprout pokes out of the crown); `tom` HR-purple pompom hat; `egg` teal beanie, mustard scarf; `turnip` no hat (his cap is part of him), no scarf. Anything else gets a blue beanie. The hat sits above the brows (its lowest point is 21 px above the brow line plus `browUp`); mittens and boots never touch the face box.
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

<!-- @@GUIDE-PART2 -->
