# F19_API: the food kit contract for Episode 19 (`ep19_food.js`, `window.F19`). Written by the lead; implemented by the FOOD builder; used by every scene builder

Everybody codes against THIS file at once. Names, argument shapes and units are FIXED. The FOOD builder may ADD functions and options (document them at the top of `ep19_food.js` and in `GUIDE_FOOD19.md`), never rename or reshape these. Until a function lands, a scene draws its own stand-in and swaps in the real one when `typeof F19.name === 'function'` (check at draw time).

## Conventions (all functions)
- They draw into the current `ctx`, in WORLD units (the same transform the characters use, after the scene's camera). Pure functions of their arguments and `t`: no `Math.random`, no `Date`, no state that depends on how many frames were drawn before. Randomness only from `FX18.rnd(seed, k)` (see GUIDE_FX18.md) or your own hash. Frame N must be identical in every worker and every run (4 parallel workers, segmented renders).
- Each function saves and restores `ctx` state. Cost: about 2 ms per dish per frame at most; pre-render a dish once into an offscreen canvas keyed by kind, size and style and `drawImage` it (see `FX18.sprite`); only the animated parts (steam, wobble, liquid, lid) are drawn live.
- Text on food (labels, stickers, a dial legend) goes through the UI kit (`ui.js`), and is dressing (non-hero) unless a shot is a close-up at rest.
- The look: warm, soft, shaded cartoon food in the series' style (outlines like the characters, `rgba(28,20,14,.75)`), a lighter top and a darker underside, a soft contact shadow, small specular highlights; golden browns, creams and ONE special palette for the molded foods: BEIGE (`F19.BEIGE = '#d9c7a3'` with `#c4ad84` shadow): smooth, matte, slightly shiny, a little piping on the molds. The beige molds must be funny precisely because they are so neat and so beige.
- `o.view`: 'side' (default: a three-quarter table-level view) or 'top' (from above, for the sign-up table and for plates seen from above).

## Dishes: `F19.dish(ctx, kind, o)`
`o = { x, y, s, rot, t, seed, steam, shadow, alpha, view }`: `(x, y)` is the bottom centre of the dish's footprint (for `view: 'top'`, its centre), `s` the scale (1 = about 300 px wide), `steam` 0..1 (how much steam it gives off; default 0), `shadow` (default true). Returns `{ w, h, top: [x, y], hot: [x, y] }` (the drawn size and two anchors: the top centre and the spot steam rises from) so a caller can attach stickers, steam and hands.
Kinds and their extra options:
- `turkey`: a whole roast turkey on a platter, golden, glossy; `carve` 0..1 (slices removed from one side, the bone showing).
- `turkeySlices`: fanned slices on a platter. `turkeyChop`: chopped pieces in a pile. `turkeyMince`: a crumbly mound. `turkeyPuree`: a smooth beige scoop. `turkeyMold`: the beige turkey-shaped puree, with a sheen (`shine` 0..1) and a little piped detail.
- `pie`: a pecan pie in a tin (`slice` 0..1: a wedge missing). `pieMold`: the beige pie-shaped puree. `pieSlice`: one wedge.
- `roll` (one), `rolls` (a basket of rolls under a checked cloth, `n` 1..12 rolls showing), `basket` (empty, with the cloth).
- `casserole` (glass dish with foil), `slowcooker` (glass lid, a KEEP WARM dial, `lid` -1..1: lifts and rattles; steam from the lid gap; `light` 0..1), `cranCan` (the jellied cranberry sauce cylinder with the can's ridges standing on a plate, `slices` 0..4), `jello` (a mold with `wobble` 0..1: a damped wobble from `o.t - o.t0`), `pizzaBox`.
- `coffee`: a paper cup or mug of coffee; `thick` 0..1 (0 liquid, .35 nectar, .7 honey, 1 pudding: the surface and the way it sits change; pudding does not steam) and `fill` 0..1.
- `plate`: a paper plate; `items`: an array of kind strings placed in order (e.g. `['turkeyMold','roll','pieMold','coffee']`, drawn small and arranged by the kit); `stickers`: an array of `{ kind, text, at: [fx, fy] }` stuck on the plate or its items (`at` is a fraction of the plate's box).
- `blender`: a jar with a lid on a base; `on` 0..1 (spinning blur), `fill` 0..1, `color` (contents), `t`; the contents swirl while on.

## Liquids and steam
- `F19.steam(ctx, { x, y, w, h, t, seed, power, curl })`: thin curling wisps rising from `(x, y)` (uses `FX18.smoke` or `FX18.puff` when they exist, else its own).
- `F19.pour(ctx, { x0, y0, x1, y1, t, t0, t1, visc, color, width })`: a stream from a spout at `(x0, y0)` to a surface at `(x1, y1)` from `t0` to `t1`. `visc` 0 = water (a straight, fast, thin stream that splashes), .5 = honey (a slow wavy rope that folds on itself as it lands), 1 = pudding (it will not pour: a lump slides out of the spout, stretches, drops and plops with a slow wobble). Returns `{ lands: <time the first liquid reaches (x1, y1)> }`. `F19.viscosity(thick)` returns the matching `visc`.
- `F19.jiggle(t, t0, amp, freq, damp)` returns `{ sx, sy, skew }`: a damped wobble factor to multiply onto any drawn object (jello, a pudding cup, a mold).

## Stickers and labels: `F19.sticker(ctx, o)`
`o = { kind, x, y, s, rot, text, t }`; kinds: `note` (a yellow sticky note, handwritten look), `sticker` (a round badge, e.g. FUN COMMITTEE with a tiny turkey), `label` (a white allergen label with a printed barcode and CONTAINS: BREAD), `tag` (a hang tag), `clip` (a binder clip). Returns its box `[x0, y0, x1, y1]`. Text through the UI kit.

## Also required of the kit
- `GUIDE_FOOD19.md` in the project folder: one paragraph and one example line per function, the options and the traps. Written FIRST (within 20 minutes), refined at the end.
- A demo (`f19_demo.html` plus `f19_test.js`, not loaded by `index.html`) that renders every dish at three times, and a determinism test (the same call twice is pixel-identical; frame t drawn first or last is identical).
- ORDER OF DELIVERY (each landed and `node --check` clean before the next): 1 `steam`, `rolls`, `roll`, `basket`, `plate` (+ `sticker`), `coffee` (SIGNUP, PLATE, BREAK need these first); 2 the turkey family, `turkeyMold`, `pie`, `pieMold`, `blender`, `pour` and `viscosity` (KITCHEN); 3 `slowcooker`, `jello`, `cranCan`, `casserole`, `pizzaBox`, `jiggle`.
