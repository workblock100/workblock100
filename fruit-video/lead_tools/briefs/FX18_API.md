# FX18_API: the effects kit contract for Episode 18 (`ep18_fx.js`, `window.FX18`). Written by the lead; implemented by the FX builder; used by every scene builder

Everybody codes against THIS file at once. Names, argument shapes and units are FIXED. The FX builder may ADD functions and options (document them at the top of `ep18_fx.js` and in `GUIDE_FX18.md`), never rename or reshape these. Until a function lands, a scene draws its own stand-in and swaps in the real one when `typeof FX18.name === 'function'` (check at draw time, never at load time: `ep18_fx.js` is loaded before the scene files, but guard anyway).

## Conventions (all functions)
- They draw into the current `ctx`, in WORLD units (the same transform the characters use, after the scene's camera), unless marked SCREEN (those are for `over()`: they use `W` x `H` = 1080 x 1920 and ignore the camera).
- Pure functions of their arguments and `t`: no `Math.random`, no `Date`, no `performance`, no state that depends on how many frames were drawn before. Randomness only from `FX18.rnd(seed, k)` (a hash, 0..1). Frame N must be identical in every worker and every run (frames are rendered by 4 parallel workers and in segments).
- `t` = scene-local seconds (the `lt` the scene receives). `t0` = the scene-local second an effect starts (nothing drawn before it; `t1` = when emission stops, particles finish their life). `seed` separates two instances.
- Each function saves and restores `ctx` state (composite operation, alpha, fill, filter, transform). Colours are CSS strings. `alpha` (default 1) multiplies the whole effect.
- Cost: about 2 ms per effect per frame at most. Pre-render soft sprites (puffs, bubbles, flames, glows) once into offscreen canvases keyed by size and colour and `drawImage` them; no per-particle gradients, no per-frame `ctx.filter` blur.
- NEVER let an effect cover text, a face or a caption zone (lowest 15 percent of the frame) at more than light haze; smoke and foam are in-world and sit BEHIND or BESIDE characters unless the shot is about them.
- PHOTOSENSITIVITY (a hard rule for the whole episode): never more than 3 flashes in any one second, and only one flashing source of a frame-sized change at a time. The horn pattern gives 1 flash per second. A full-frame wash flash is at most 0.35 alpha and lasts at most 0.25 s; no red/white alternation faster than 2 Hz.

## The alarm pattern (shared with the sound: the same numbers)
The fire alarm sounds the temporal-three pattern: 0.5 s on, 0.5 s off, three times, then 1.5 s off; the period is 4.0 s.
- `FX18.HORN = { period: 4.0, on: 0.5, off: 0.5, pulses: 3, gap: 1.5 }`
- `FX18.hornOn(k)` -> 0 or 1. `k` = seconds since the horn started (the scene-local time of the script's `horn3` cue minus `t`; negative -> 0). On during k mod 4 in [0, 0.5), [1.0, 1.5), [2.0, 2.5).
- `FX18.strobe(k)` -> 0..1 flash envelope for the wall strobes: jumps to 1 on the first frame of each horn pulse and decays (exp, about 0.22 s). Never anything else.
- Scenes get their `horn3` start from `python3 /tmp/shift_tools/cues.py 18 <scene>` (scene-local seconds) and their stop from `hornstop`.

## Light and screen passes
- `FX18.wash(ctx, {color, alpha, mode})` SCREEN. A full-frame colour wash. `mode`: 'add' | 'screen' | 'multiply' | 'normal'. For strobe flashes: `{color:'#ffeedd', alpha: 0.30 * FX18.strobe(k), mode:'add'}`; emergency tint: `{color:'#ff2020', alpha:.12, mode:'multiply'}`.
- `FX18.vignette(ctx, {alpha, color})` SCREEN. Darkened corners (emergency lighting, the quiet beat).
- `FX18.glow(ctx, {x, y, r, color, alpha, core})` WORLD. A radial additive glow (an LED, an exit sign's halo, a lamp). `core` (0..1) is the hot centre.
- `FX18.cone(ctx, {x, y, ang, spread, len, color, alpha, soft})` WORLD. A soft light cone from a point along `ang` (radians, 0 = +x), full angle `spread` (radians), length `len`: a flashlight, an exit sign's wash on the floor, a ceiling downlight.
- `FX18.lamp(ctx, {x, y, level, r, color, rays})` WORLD. A strobe lamp: hot core, bloom and short rays; `level` 0..1 from `FX18.strobe(k)`. At level 0 it draws the dead lens (a white-grey disc).

## Matter (particles)
- `FX18.flame(ctx, {x, y, w, h, t, seed, power, lean, kind})` WORLD. A fire whose base is centred on `(x, y)`, `w` wide at the base, `h` tall at power 1. `kind`: 'log' (a Yule-log flame cluster: several low tongues, warm and cosy), 'torch', 'candle', 'blaze'. `lean` in -1..1 leans the tongues. Additive layers (deep red, orange, yellow, white core), deterministic flicker (about 8 to 14 Hz mix); `power` 0..1.5 scales height and brightness (0 = out; use it to fade a fire).
- `FX18.embers(ctx, {x, y, w, t, seed, count, rise})` WORLD. Sparks drifting up from a fire.
- `FX18.smoke(ctx, {x, y, w, h, t, t0, seed, density, rise, color, drift, life})` WORLD. A plume that rises from `(x, y)`, widening and thinning; `h` = how high it reaches; `drift` leans it sideways.
- `FX18.smokeLayer(ctx, {x0, x1, yTop, depth, t, seed, color, alpha})` WORLD. A hanging layer under a ceiling at `yTop`, `depth` px thick, with a ragged, slowly moving underside. (Optional for the episode; a drill has no smoke unless a scene wants a haze.)
- `FX18.puff(ctx, {x, y, r, t, t0, life, color, n})` WORLD. One expanding poof (a door-slam dust puff, a landing).
- `FX18.foamJet(ctx, {nozzle, t0, t1, t, rate, speed, spread, size, gravity, seed, color})` WORLD. Extinguisher foam. `nozzle` is a function of an absolute scene-local time `te` returning `{x, y, ang}`: the nozzle position and the spray direction at the moment a particle leaves it. A particle born at `te` flies from `nozzle(te)` with a velocity along `ang + spread * (rnd - .5)`, `speed` px/s, gravity `gravity` px/s^2, grows while it flies, fades over its life (about 1.4 s). The emitter may move and spin (the can on the loose): the jet curls with it. `rate` particles per second (default 110).
- `FX18.foamPile(ctx, {x, y, w, h, t, t0, grow, seed, color})` WORLD. A blob of foam that accumulates on a surface or a character (clumps and bubbles); it swells from nothing at `t0` over `grow` seconds. For shapes other than a blob call it several times (a beard, a pool, a cap).
- `FX18.water(ctx, {x, y, ang, spread, len, t, t0, t1, seed, drops})` WORLD. A sprinkler fan and falling drops (optional).
- `FX18.sparks(ctx, {x, y, t, t0, count, speed, life, gravity, seed, color})` WORLD. A burst of bright sparks (a door magnet releasing, a short circuit).

## Helpers
`FX18.rnd(seed, k)` 0..1; `FX18.sprite(key, w, h, drawFn)` a cached offscreen canvas; `FX18.clamp01`, `FX18.ease`... (document what you add).

## Also required of the kit
- `GUIDE_FX18.md` in the project folder: one paragraph and one code line per function, the options, the cost, the traps. Written FIRST (within the first 20 minutes, from this contract, so the scene builders can read it), refined at the end.
- A demo that renders every effect (`fx18_demo.html` plus `fx18_test.js`, a node or Playwright script that writes PNGs of each effect at several times; not loaded by `index.html`) and a determinism test: the same `(args, t)` twice gives identical pixels, and frame t drawn first or last gives the same pixels.
- Order of delivery (each landed and `node --check` clean before the next): 1 the alarm pattern and the light passes (`HORN`, `hornOn`, `strobe`, `wash`, `vignette`, `glow`, `cone`, `lamp`), 2 `foamJet` and `foamPile`, 3 `flame` and `embers`, 4 `puff`, `sparks`, `smoke`, 5 `water`, `smokeLayer`.
