# SHIFT HAPPENS: scene builder's guide (Episode 12 and later; for Episode 13 also read /tmp/shift_tools/briefs/CONTEXT13.md FIRST: the alignment contract and the text gate are new)

You are one of several builders working in the same checkout at the same time: **/home/user/workblock100/fruit-video**.
You own the files named in your brief and nothing else. Rules at the end.

## What this is
Voiced, captioned, vertical (1080x1920, 30 fps) animated comedies about one nursing home's 3-11 shift, drawn entirely in code on a 2D canvas.
`renderAt(t)` is a pure function of time `t` (seconds): nothing may depend on state from earlier frames. The episodes use the "v2" renderer (lighting, bloom, grade, shutter-sampled motion blur).
The audio (voices, effects, music) and the timeline come from the script. **Timing is frozen: never change a beat's length, a line, or where a sound cue sits.**
The bar is "the best cartoon in the series": clean staging, readable acting, jokes that land visually, precision. Nothing obscured, blocked or cut off by the frame edge. Every frame looks intentional.

## Read these first (the models to copy from)
- `ep11_floor.js` (split screen, time-lapse, glass shatter, sfx words), `ep11_orient.js` (cards, a tower, a tag, props), `ep11_vault.js` and `ep11_exit.js` (a lot of props and inserts), `ep11_arrival.js` (a full lobby set and crowd).
- `ep10_party.js` (a crowd set, confetti, coins, a card), `ep10_days.js` (flip calendar, four sets), `ep10_title.js` (title and end card), `ep10_office.js`, `ep10_set.js` (an office set with a usage note at the top).
- `ep9_floor.js` (has the helpers `sfxWord`, `wordT`, `route`, `nbr`), `ep9_exit.js` (night lot), `ep9_arrival.js` (`lobby9`), `ep8_break.js` (a break room), `ep8_hall.js`.
- Sets and art kits: `ep6_sets.js`, `ep6_rooms.js` (S6: `corridor`, `shell`, `box3`, `onZ`, `lit`, `ceilingLamp`, `wallClock`, `backWindow`), `ep7_sets.js` (S7: `stationBack`, `stationCounter`, `whiteboard`, `qSign`, `lotDay`, `car`), `ep6_art.js`, `ep7_art.js` (A7: `straw`, `mango`, `lemon`, `cran`, `banana`, `moon`), `ep9_art.js` (A9: `melon`, `persimmon`, `money`, `phoneFrame`), `ep10_art.js` (A10.clem), `ep11_art.js` (A11.straw, per diem look).
- `v2_core.js` (lighting, camera, post, captions, chyron), `v2_char.js` (characters), `engine.js` (text, rr, ell, hash, seg, lerp, ease*, drawChar, EXT hooks).
- Private code in other episodes is NOT exported: copy what you need into your own module with a comment saying where it came from. Never edit an earlier episode's file.

## Scene module skeleton
```js
'use strict';
/* header: what the scene is, the shots, the layout numbers */
(() => {
if (!window.TIMELINE_EP12) return;
const { person, zoomTo, faceZoom, drawBg } = window.H6;   // H6 is the helper set exported by ep6.js
const A7 = window.A7, A9 = window.A9, A10 = window.A10, A11 = window.A11, S6 = window.S6, S7 = window.S7;
const SC = { shot(lt) { return 'name'; }, cam(lt) {...}, draw(lt) {...}, fx(lt) {...}, blur(lt) {...}, over(lt) {...} };
window.__EP12_SCENES = window.__EP12_SCENES || {};
window.__EP12_SCENES.<sceneId> = SC;   // the scene ids are fixed by the script
})();
```
`lt` is scene-local time. `B('id')`-style lookups: read the beat start and end from `build/ep12/timeline.json` (`scenes[].beats[id] = {s, e}`, scene-local seconds). Spoken lines are in `lines[]` with `words: [[word, start, end]]` (scene-local), so you can land an action on a word.
Scene object API:
- `cam(lt)`: `V2.setCam({ f, cy, hy, cz, cx })` for perspective sets, and/or `zoomTo(cx, cy, z)` which centres the scene point (cx, cy) on the frame and zooms by z (it is NOT zoom about the screen centre).
  `faceZoom(o, z, up)` frames a face `up` px above the frame centre.
- `draw(lt)`: the world on the 2D context `ctx`, in scene coordinates (1080x1920). Perspective: `V2.at(X, Z)` -> `{x, y, s}`.
- `fx(lt)`: grade `{ bloom, vignette, grain, contrast, sat, tint: [[color, alpha, blend]], aberr, fade, fadeColor }`.
- `blur(lt)`: shutter samples 1..10. Raise for fast moves, keep low at hard cuts (a cut inside a blurred frame shows a double exposure).
- `over(lt)`: screen-space overlays after the grade (pills, inserts, sound words, HUD). `text()` called here registers an audited box.
- `clock(lt)` / `label(lt)`: strings for the top-left clock pill and the yellow place label. `noChyron: true` hides both; `noScrim: true` hides the caption scrim (title and end card).
Frame order: world, grade and bloom, `over()`, then captions (dark scrim from y 1390, speaker chip 1386-1448, caption words to y 1660), then the clock pill (x 48-480, y 116-184) and the place label (y 196-242).
**Keep faces, hands, props and text out of y 1380-1700 and out of the pills.** Feet may sit in the scrim, never on the speaker chip.

## Characters
Constructors (each returns the options object for `drawChar`): `A7.straw` (or `A11.straw` for the per diem look), `A7.mango`, `A7.lemon`, `A7.cran`, `A7.banana`, `A7.moon` (a lit face in a window or sky), `A9.melon` (the Administrator, s 1.22), `A9.persimmon` (not in this episode), `A10.clem` (Clementine).
Place with `person(ctor, pathFn, lt, extra)` (`pathFn(lt) -> [X, Z]`, gait and facing come from the path), or merge `V2.at(X, Z)` into the options.
Options: `who` (must match the script's voice id so the mouth moves: straw, strawphone, mango, lemon, melon, clem, cran, moon) | `expr` (neutral, happy, sad, shock, angry, hopeful, smug, chill, panic, sour, weak, dead ...) | `look: [x, y]` | `lid` | `arms: { l, r }` with presets 'rest', 'hold', 'hips', 'point', 'wave', 'up', 'shrug', 'cheer', 'flail', 'reach', 'run', 'down', or `[shoulder, elbow]` | `grip: { l: [x, y], r: [x, y] }` (local px, for arms set to 'hold') | `hold: { l: 'prop', r: 'prop' }` | `hand: { l: 'open'|'grip'|'fist'|'flat'|'point'|'thumb'|'wave' }` | `acc: [...]` accessories (steth, badge7, bandage7, perdiem9, nametag9, readers, lanyard7, keys7, gaitbelt7, ...) | `transit: true` (a character entering or leaving through the frame edge: exempt from the edge audit) | `plant: true` (a squashed pose keeps its shoes on the floor) | `noLegs` (behind a desk or chair) | `noShadow`, `noReflect`, `center`.
`drawBg(o)` draws a soft background neighbour (not audited); `V2.dof(px, fn)` blurs what `fn` draws (`const nbr = o => V2.dof(6, () => drawBg(o))`).
Props: held with `hold`, drawn through `EXT.prop.<name> = (side, o, t) => {...}`, and registered for the audit with `Object.assign(PROP_BOX, { name: [x0, y0, x1, y1] })`. Accessories through `EXT.acc.<name> = (o, k, t, layer) => {...}` (draw only when `layer === 'front'`). Use names with your scene prefix (for example `drill12_siren`), so nothing collides.
Speech bubbles and sound words: copy `sfxWord` from `ep9_floor.js`.

## The quality bar (what reviewers and the user check)
1. Layout: nothing obscured, blocked or cut off. Give faces and props air (about 20 px from the frame edge unless entering or leaving on purpose).
2. Staging: each beat gets a purposeful shot. Vary wide, two-shot, close-up, insert, push-in, dolly, whip. Cut where the comedy cuts. Slow, motivated moves (a few percent of zoom, a drift).
3. Acting: every character is always alive (blinks, breathing, gaze, small arm moves, head turns). Reactions are half the comedy: hold on the listener's face on the punchline.
4. Depth and light: lighting (`V2.setLight`, `addLight`, `glow`, `beam`, `dust`), depth of field, bloom, a grade per scene. No flat frames.
5. Continuity: the same building, cast and running gags (per diem, the pizza budget, the pen, the Q-word sign, the good cuff, Sure!, the R that is missing).
6. No pops: things enter and leave on purpose, eased. Text stays still unless it moves on purpose.
7. Beat times are the clock: land actions on the matching word (`lines[].words`) or on the beat start.

## Tools (in /tmp/shift_tools; they read /home/user/workblock100/fruit-video)
- `python3 /tmp/shift_tools/scene_info.py 12 [scene]`: each scene's start and length, each beat's scene-local start and end, and the spoken lines.
- `python3 /tmp/shift_tools/sheet.py 12 <scene> [step=1.0] [cell_w=300]`: renders the scene as the video captures it (motion blur on) into contact sheets at /tmp/shift_sheets/ep12_<scene>_<n>.png. Open them with the Read tool. Use step 0.5 for detail.
- For full-size detail: `EP=12 MB=1 node render.js preview <abs_seconds...>` writes `build/ep12/preview/t_<abs>.png` (1080x1920). Crop with PIL to inspect.
- `bash /tmp/shift_tools/audit_scene.sh 12 <scene> [step]`: the hard layout gate for one scene. Use step 0.1 while iterating (3x cheaper) and the default (every frame) for your final pass. It must print 0 issue-frames.
- `node -e "new Function(require('fs').readFileSync('FILE','utf8'))"` after every edit (syntax).
- Machine: 4 cores shared by several builders. Run at most one heavy process (audit, sheets) at a time.

## Engine facts and traps
- `S6.shell` and `S6.lit` parse hex colour strings only (`#rrggbb`), not `rgba()`. Use hex, or mix colours with a helper.
- `box3` with `fog` and no explicit hex `side` renders a green side face. Always pass explicit hex colours.
- A squash (`sy < 1`) lifts the shoes; add `plant: true` if a character crouches.
- `faceZoom`'s `up` argument moves the picture up as it grows: when a close-up zooms in, raise `up` with it (`lerp(a, b, k)`).
- Eyebrows = the expression's raise plus `o.browUp`. Accessories hang off the body proportions; check that a hand or a badge is not covered.
- Held props ignore mirroring. Text drawn inside a prop is not audited against captions.
- `text()` squishes when the string is wider than `maxW`: the audit flags squished text; never ship it.
- A hard cut inside a motion-blur window produces one double-exposure frame; set `blur` to 1 on the frame of a cut.
- Heavy loops (thousands of particles, `ctx.filter` blurs on large areas, gradients made every frame) make renders slow: a frame should take well under half a second. Pre-render static art into a cached canvas once (see `art()` in ep10_set.js).
- Never append a `//` comment mid-line when editing: it swallows the rest of the line. Use `/* */`.

## Process
1. `scene_info.py` for your scenes. Plan a shot list against the beat times and write it as a comment at the top of your module.
2. Blocking first (set, cast, camera per beat), then a contact sheet. Then props and inserts. Then polish (secondary motion, light, particles).
3. Review your sheets critically at full size: anything touching, covered, clipped, floating, too close to the caption zone, or flat.
4. Gates: the audit must be 0 issues at the end. Run it on your final file.
5. Final report (plain text, short): files you wrote, the shot list with times, the audit result, anything you could not verify, any request for the lead.

## Rules
- Touch only the files named in your brief. Never edit engine.js, v2_core.js, v2_char.js, any ep1..ep11 file, index.html, ep12.js, render.js, script_ep12.json, build_*.py, or anything under build/.
- Do not run any git command that writes (add, commit, push, checkout, stash, reset). Read-only `git status` and `git diff` are fine.
- Never leave a module in a state that throws. Other builders render the whole episode while you work. Syntax-check after each edit.
- The script is the source of truth. If a visual needs more or less time than a beat gives, solve it inside the beat or tell the lead in your report.
- Keep the report honest: say what you did not verify.
