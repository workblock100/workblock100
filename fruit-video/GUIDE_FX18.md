# GUIDE_FX18: the Episode 18 effects kit (`ep18_fx.js`, `window.FX18`)

Contract: `/tmp/shift_tools/briefs/FX18_API.md` (names and shapes are fixed; this file says what was built, with the additions). Owner: the FX builder. Every function below has landed. Still guard at draw time (`typeof FX18.foamJet === 'function'`): the file loads before the scene files, but the load order inside the episode is not yours to control. Demo and tests: `fx18_demo.html`, `fx18_test.js` (last section).

## Rules for every function
- Signature `FX18.name(c, o)`: `c` is the 2D context to draw into (pass `ctx`), `o` an options object. Colours are CSS strings (`'#ff8a00'`, `'rgb(255,200,80)'`).
- WORLD functions draw in the transform you already have (the characters' transform after the scene camera). SCREEN functions (`wash`, `vignette`) reset the transform to identity and use 1080 x 1920, so call them from `over(lt)` (after the grade) and never expect the camera to move them.
- Pure functions of `(options, t)`: no `Math.random`, no `Date`, no state, so frame N is the same in every worker, in every run and in any order of rendering (tested: see the last section). Randomness comes only from `FX18.rnd(seed, k)`. Two instances of the same effect need different `seed`s.
- `t` is scene-local seconds (the `lt` your scene gets). `t0` is when an effect starts (nothing is drawn before it); `t1` is when emission stops (what is in the air finishes its flight).
- Each call saves and restores the context state (transform, alpha, blend, fill, filter, shadow). Motion blur calls `draw` up to 16 times a frame and every sample draws the effect again, so do not stack twenty big ones in a background shot. Sub-frame sampling works as it should: effects are continuous in `t`, the strobe is the one deliberate jump.
- The text gate ignores additive, screen and low-alpha drawing but NOT solid foam or smoke (normal blend, alpha .5 and up): keep those off hero text, faces and the caption zone (lowest 15 percent of the frame). Light (`glow`, `cone`, `lamp`, `pool`, `wash` in `add`/`screen`) is safe over text.
- PHOTOSENSITIVITY: at most 3 flashes in any second and only one frame-sized flashing source at a time. The horn gives 1 flash per second. A full-frame wash flash is at most .35 alpha for at most .25 s: `wash` clamps `add`/`screen` to .35 unless you pass `steady: true` (a constant mood wash that does not pulse). The title card, which stacks a .22 wash, a cone and glows on the flash, measures a peak jump of .24 in mean luminance, three flashes in three seconds, none in the 2.5 s after.

## The alarm pattern (the sound uses the same numbers)
Temporal three: .5 s on, .5 s off, three times, then 1.5 s off; period 4.0 s.
- `FX18.HORN` = `{ period: 4.0, on: 0.5, off: 0.5, pulses: 3, gap: 1.5 }`.
- `FX18.hornOn(k)` -> 0 or 1. `k` = seconds since the horn started = `lt - horn3` (the scene-local second of the script's `horn3` cue, from `python3 /tmp/shift_tools/cues.py 18 <scene>`); `k < 0` gives 0. On during `k mod 4` in [0, .5), [1, 1.5), [2, 2.5).
- `FX18.strobe(k)` -> 0..1. Jumps to 1 on the first frame of each horn pulse, then decays exponentially (time constant .22 s: .63 at .1 s, .32 at .25 s, .10 at .5 s), 0 after the tail. Use it for every flash that follows the horn.
- Added: `FX18.hornK(lt, start, stop)` -> `k`, or `-1` when `lt` is before `start` or at / after `stop` (so after the `hornstop` cue everything goes quiet in one place). `FX18.hornPulse(k)` -> `{ on, index, age }` (`index` 0..2 inside a pulse, else -1; `age` = seconds since the latest pulse began, `Infinity` before the first).
- Frame alignment: snap the cue to the video frame, as `snapT` in `ep16_prize.js` does, and pass the snapped time as `start`; the functions carry a 1 microsecond slack, so a pulse that starts exactly on a frame lights that frame.
```js
const k = FX18.hornK(lt, CUE.horn3, CUE.hornstop), fl = FX18.strobe(k);   /* 0..1; k = -1 outside the horn */
```

## Light and screen passes
- `FX18.wash(c, { color, alpha, mode, steady })` SCREEN. A full-frame colour wash; `mode` is `'add' | 'screen' | 'multiply' | 'normal'`. Strobe flash: `{ color: '#ffeedd', alpha: .30 * FX18.strobe(k), mode: 'add' }`; emergency tint: `{ color: '#ff2020', alpha: .12, mode: 'multiply' }`. About 2 ms.
```js
FX18.wash(ctx, { color: '#ffeedd', alpha: .30 * FX18.strobe(k), mode: 'add' });   /* in over() */
```
- `FX18.vignette(c, { alpha, color })` SCREEN. Darkened corners with a smooth falloff (an ellipse that follows the frame): emergency lighting, a quiet beat. `alpha` default .35, `color` default `'#000'`. About 7 ms in the software renderer, the same as the grade's own `fx().vignette`: if you only want darker corners, set the grade's `vignette` in `fx(lt)` instead; use this one for a coloured vignette or one that must sit after the grade.
```js
FX18.vignette(ctx, { alpha: .45, color: '#12060a' });
```
- `FX18.glow(c, { x, y, r, color, alpha, core })` WORLD. A radial additive glow (an LED, an exit sign's halo, a lamp): a hot centre and a long halo. `core` 0..1 adds a near-white centre (default 0). `alpha` above 1 doubles up. It feeds the engine's bloom layer when `c` is the live `ctx`. Cost is fill rate: .6 ms at `r` 150, 5 ms at `r` 450.
```js
FX18.glow(ctx, { x: 540, y: 420, r: 120, color: '#38ff7a', alpha: .6, core: .5 });
```
- `FX18.cone(c, { x, y, ang, spread, len, color, alpha, soft })` WORLD. A soft light cone from `(x, y)` along `ang` (radians, 0 = +x, pi/2 = straight down on screen), full angle `spread` (radians, up to 2.8), length `len`. `soft` 0..1 (default .55) is how much of the edge fades. A bright axis, a gentle falloff and slight streak noise, so it never reads as a triangle (a flashlight, an exit sign's wash on a floor, a ceiling downlight). The shape is baked once per colour, spread and softness. 1 to 3 ms.
```js
FX18.cone(ctx, { x: 300, y: 900, ang: .35, spread: .5, len: 700, color: '#fff2c8', alpha: .5 });
```
- `FX18.lamp(c, { x, y, level, r, color, rays })` WORLD. A strobe lamp: a hot white core, bloom, a fan of thin rays and a flat streak. `level` 0..1 (pass `FX18.strobe(k)`); at level 0 it draws the dead lens (a pale grey disc with a highlight and a rim). `r` is the lens radius (default 14), `color` the bloom tint (default `'#fff0dc'`), `rays` the number of spikes (default 8). The lens is opaque, so draw the plate behind it. About 1.5 ms lit, 0.2 ms dead.
```js
FX18.lamp(ctx, { x: 820, y: 360, level: FX18.strobe(k), r: 16 });
```
- Added: `FX18.pool(c, { x, y, rx, ry, color, alpha })` WORLD. A soft elliptical light pool (an exit sign's glow on the floor, a lamp on a desk). Under 0.5 ms.

## Matter
- `FX18.foamJet(c, { nozzle, t0, t1, t, rate, speed, spread, size, gravity, seed, color, drag })` WORLD. Extinguisher foam. `nozzle(te)` is a function of an ABSOLUTE scene-local time returning `{ x, y, ang }` (position and spray direction at the moment a particle leaves): the can may move and spin and the jet curls with it. A particle born at `te` flies along `ang + spread * (rnd - .5)` (a triangular spread: dense on the axis) at `speed` px/s, slowed by `drag` (default .9 per second), falls with `gravity` px/s^2 (default 700), grows while it flies, then shrinks and pops (about 1.4 s; one in eight is a heavy clump that lasts 1.6 times longer and falls faster; a fine mist rides the edge; a bright burst sits at the nozzle while it fires). `rate` particles/s (default 120), `size` = final bubble radius (default 34), `spread` radians (default .35). Reach is about `speed * (1 - exp(-drag * 1.4)) / drag`. Soft shading: a lighter top and a faint blue-grey underside, rimmed surface bubbles. `nozzle` is called once per live particle (about 150 times a frame): keep it cheap. `color` default white. Normal blend: it covers what is behind it. Cost is fill rate: 5.6 ms at the defaults, 2.4 ms at `size` 22 and `rate` 80.
```js
FX18.foamJet(ctx, { nozzle: te => can.nozzleAt(te), t0: 20.2, t1: 24.6, t: lt, speed: 1500, spread: .32, seed: 3 });
```
- `FX18.foamPile(c, { x, y, w, h, t, t0, grow, seed, color })` WORLD. A blob of foam sitting on a surface or a character: `(x, y)` = bottom centre, `w` x `h` its size when grown. It swells from nothing at `t0` over `grow` seconds (default .8, with a little overshoot): a soft body, bubble-balls in a bumpy hump with a flat bottom, a faint contact shadow, rim bubbles that grow and pop. For other shapes call it several times (a beard under a chin, a cap on a head, a pool on a floor), each with its own `seed`. About 1 ms.
```js
FX18.foamPile(ctx, { x: 540, y: 980, w: 200, h: 120, t: lt, t0: 31.5, grow: 1.2, seed: 9 });
```
- `FX18.flame(c, { x, y, w, h, t, seed, power, lean, kind, glow })` WORLD. A fire whose base is centred on `(x, y)`, `w` wide at the base, `h` tall at `power` 1. `kind`: `'log'` (a cosy Yule-log cluster of low, wide tongues over a glowing ember bed), `'torch'` (three tall tongues), `'candle'` (a steady yellow drop with a blue base), `'blaze'` (nine tongues, chaotic and tall). `lean` -1..1 leans the tongues. `power` 0..1.5 scales height and brightness (0 = out; ramp it to fade a fire, a low power shrinks it to low red licks). `glow` 0..2 (default 1) scales the ambient light and the warm pool on the surface; 0 keeps the light inside the fire's own area (a TV screen). Each tongue is four nested layers (a deep red edge, an orange body, a yellow middle, a white-yellow core) and a second lick that splits off and rejoins; a slow uneven flicker (about 1 Hz) with a fast shimmer (9 to 14 Hz). The base is flat at `y`: it is meant to sit behind a log, a hearth or a torch head, so draw that after the flame. Cost: 8 ms for a 400 x 250 log (3 ms with `glow: 0`; the big soft glow is most of it), 4 ms a torch, 0.5 ms a candle, 8 ms a blaze at 280 x 300.
```js
FX18.flame(ctx, { x: 540, y: 1100, w: 260, h: 240, t: lt, seed: 1, kind: 'log', power: FX18.ease.out(FX18.seg(lt, 3, 4)) });
```
- `FX18.embers(c, { x, y, w, t, seed, count, rise })` WORLD. Sparks that drift up from a fire: `count` default 14 (max 80), `rise` default 260 px, each on its own 1.6 to 3.4 s cycle with its own wander, cooling from yellow to red. Under 0.2 ms.
```js
FX18.embers(ctx, { x: 540, y: 1080, w: 200, t: lt, seed: 2, count: 14, rise: 300 });
```
- `FX18.puff(c, { x, y, r, t, t0, life, color, n, flat, seed })` WORLD. One expanding poof (a door-slam dust puff, a landing): `n` soft lobes (default 7) that expand to radius `r` (default 80) and thin out over `life` (default .8 s); `flat` 0..1 (default .2) squashes it onto a floor; `color` default a dust beige. Nothing is drawn before `t0` or after `t0 + life`. About 0.8 ms.
```js
FX18.puff(ctx, { x: 640, y: 1500, r: 160, t: lt, t0: 61.2, life: .9, color: '#d5dbe4' });
```
- `FX18.sparks(c, { x, y, t, t0, count, speed, life, gravity, seed, color })` WORLD. A burst of bright sparks with tails and hot heads (defaults: count 18, speed 520 px/s, life .55 s, gravity 900, color `'#ffb830'`) and a small flash at the source for the first 4 frames. About 0.3 ms.
```js
FX18.sparks(ctx, { x: 300, y: 700, t: lt, t0: 14.1, count: 22, speed: 600, seed: 3 });
```
- `FX18.smoke(c, { x, y, w, h, t, t0, t1, seed, density, rise, color, drift, life, rate })` WORLD. A plume from `(x, y)`: puffs are born at `rate` per second (default 9) from `t0` (and stop at `t1` if you give one: the plume then drifts away), rise `h` px over `life` seconds (default 3.4), widen from `w` to about 2.5 `w`, thin, pale and lean by `drift` px at the top. `density` 0..1 (default .6) is the opacity, `color` the dense base colour (default `'#5e5c62'`). Mottled, soft-edged puffs; over a face it reads as a veil, not a disc. The plume only fills in after `t0`: start it early (or at a negative `t0`) if the shot opens on an established plume. Cost is fill rate: about 6 ms for a 600 px plume 100 px wide.
```js
FX18.smoke(ctx, { x: 300, y: 1400, w: 120, h: 800, t: lt, t0: -3, seed: 2, density: .6, drift: 160 });
```
- `FX18.water(c, { x, y, ang, spread, len, t, t0, t1, seed, drops })` WORLD. A sprinkler fan: streak-shaped drops (a few fat ones) leave `(x, y)` along `ang` (default straight down, pi/2) inside the full angle `spread` (default 1.7 rad), reach about `len` px (default 520), fall and die after about a second; a faint wet sheet near the head. `drops` per second (default 90). `t0` / `t1` start and stop the flow (the spray finishes its flight after `t1`). About 1.5 ms.
```js
FX18.water(ctx, { x: 540, y: 120, t: lt, t0: 20, t1: 26, seed: 2, len: 700 });
```
- `FX18.smokeLayer(c, { x0, x1, yTop, depth, t, seed, color, alpha })` WORLD. A hanging smoke layer under a ceiling at `yTop` (nothing is drawn above that line), `depth` px thick (default 200), from `x0` to `x1`, dense at the top, with a ragged soft underside that wanders slowly. `alpha` default .5, `color` default `'#6a6870'`. Keep it off faces and text (it is hazy, but it is normal blend). Fill-rate bound: about 8 ms for 1080 x 300.
```js
FX18.smokeLayer(ctx, { x0: 0, x1: 1080, yTop: 0, depth: 260, t: lt, seed: 4, alpha: .45 });
```

## Helpers
`FX18.rnd(seed, k)` hash in [0, 1) (integer mixing; `seed` and `k` may be fractions); `FX18.noise(seed, x)` smooth 1D noise in [0, 1]; `FX18.sprite(key, w, h, drawFn)` a cached offscreen canvas (`drawFn(g, w, h)` must be a pure function of `key`; the cache only saves time, dropping it never changes a pixel); `FX18.clamp01(x)`; `FX18.seg(t, a, b)` a clamped 0..1 ramp; `FX18.lerp(a, b, k)`; `FX18.ease.out / in / io / back(k)`; `FX18.rgb(css)` -> `[r, g, b]`; `FX18.rgba(css, a)`; `FX18.mix(css1, css2, k)` -> `'rgb(...)'`.

## Recipes
- The horn: in `draw`, `const k = FX18.hornK(lt, CUE.horn3, CUE.hornstop)`; the strobe plate gets `FX18.lamp(ctx, { x, y, level: FX18.strobe(k) })`, the room gets `FX18.cone(...)` and `FX18.glow(...)` at `alpha: .2 * strobe`; in `over`, `FX18.wash({ color: '#ff2a1c', alpha: .11, mode: 'multiply' })` (the emergency tint, steady) and `FX18.wash({ color: '#ffeedd', alpha: .22 * FX18.strobe(k), mode: 'add' })` (the flash). Silence the whole thing by letting `hornK` return -1.
- An exit sign: `FX18.glow({ r: 700, color: '#38ff7a', alpha: .27 })` behind it and `FX18.cone({ ang: Math.PI / 2, spread: 1.9, color: '#2cff7a', alpha: .09 })` below it; `FX18.pool` on the floor.
- A flashlight: `FX18.cone({ x, y, ang, spread: .45, len: 800, alpha: .6 })` from the hand, and `FX18.glow({ r: 40, core: .8 })` at the bulb.
- The Yule log: `FX18.flame({ kind: 'log', w, h, power })` then the logs on top of it, `FX18.embers` above; give `glow: 0` when the fire must stay inside a TV.
- The extinguisher: `FX18.foamJet` with a `nozzle` that reads the can's pose at time `te`, `t0` = the pull of the trigger, `t1` = the release; `FX18.foamPile` for what the foam lands on, started at the moment the first particles reach it.

## Traps
- Call SCREEN functions from `over()`; call WORLD functions from `draw()` after the characters they sit behind, before the ones they sit in front of.
- Do not create your own random numbers inside an effect call (`Math.random` is a bug: two workers render different frames).
- Giving two effects the same `seed` makes them twins.
- An effect is not text-safe unless it is light: never put foam, smoke or an opaque cone over hero text (the gate counts normal-blend alpha >= .5 as covering).
- Everything draws in the current transform: if you call a WORLD function after `ctx.restore()` from the camera, it lands in screen space.
- Big soft effects cost fill rate, not code: halve a radius and the cost falls by three quarters. A frame is rendered up to 16 times for motion blur.

## Testing (not loaded by index.html)
- `fx18_demo.html` renders every effect on its own (open it with `?case=flame&t=1.2`). `node fx18_test.js sheet <case,...> <t,...> out.png [cellW]` writes a contact sheet to `build/ep18_fx/`; `node fx18_test.js list` names the cases.
- `node fx18_test.js det` proves determinism: every case twice, in forward and reverse time order and in a second fresh page (a second worker) gives identical pixels. `node fx18_test.js enginedet` does the same through the real renderer, with a real Strawberry behind the effects. `node fx18_test.js engine <foam,smoke,flame,alarm,misc> <t,...> out.png` draws the effects over a Strawberry through the full pipeline (grade, bloom). `node fx18_test.js cost` times each case (the FX calls only).
