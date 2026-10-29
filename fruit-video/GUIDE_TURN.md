# GUIDE_TURN: character turnarounds (`yaw`) in the v2 renderer (Episode 15)

Every character can now turn: three-quarter views, profile walks, backs. It is `drawChar({ ..., yaw, headYaw })`, implemented in `v2_char.js` (search "TURN").
**`yaw` and `headYaw` unset or 0: the original code path runs, byte-identical to Episodes 6 to 14** (`/tmp/wt_turn/turn_regress.sh` proves it on 42 reference frames).

## The contract

| option | meaning |
|---|---|
| `yaw` | radians, taken modulo 2 pi. 0 front. **Positive turns the FACE toward screen right**, negative toward screen left. +-pi/2 profile, pi the back. Turns the body: silhouette dressing, skin texture, arms, legs, shoes, chest accessories. |
| `headYaw` | the same angle for the head only: face, stem / leaves / cap / hats, things worn on the face. Default: equal to `yaw`. `headYaw` is absolute (not relative to the body): a front-facing body with a head turned to the left is `{ yaw: 0, headYaw: -0.6 }`. |
| `turnTo: [y0, y1, u]` / `headTurnTo: [y0, y1, u]` | yaw eased from y0 to y1 (the short way round) by u in 0..1, so a scene can pass its own progress. |
| `swingZ` | forward / back swing of the arms in radians (positive forward), a number or `{ l, r }`. A walking character (`gait`/`gaitW`) with `rest` arms swings them by itself (`armSwing`, default .62; 0 turns it off). |
| `armTwist` | how far a gesture arm turns toward the face side when the body turns, -1..1 (number or `{ l, r }`): `point`, `reach`, `offer` go forward in profile, `hips` goes back (see `POSE_TWIST`). |
| `dir` | walking direction (+1 right, -1 left), as before. With a yaw and no `dir` the walker goes where the face points. |

Everything else is unchanged: `look`, `expr`, `who` (lip-sync works at every angle: three-quarter, and a real profile mouth at the silhouette edge), `lid`, `arms`, `grip` (IK targets stay in screen space), `hold`, `acc`, `flip` (still mirrors the whole figure), `noLegs`, `plant`, `transit`. The key light does not turn: highlights and shading stay in screen space.

Helpers (all on `V2C`, usable from any scene module):

```js
V2C.faceDir(o)                 // +1 the face points to screen right, -1 to screen left (flip counted)
V2C.yawToward(dx, { max: 1.15, k: 220 })   // smooth yaw that points a character at something dx px to its right (negative: left). For a velocity: { max: Math.PI / 2, k: 80 }
V2C.turnLerp(a, b, u)          // the angle u of the way from a to b (eased, shortest way round)
V2C.turnPair(a, b, u, 0.3)     // { yaw, headYaw }: the head arrives 30 percent of the time before the body does
V2C.yawInfo(o)                 // { y, h, sy, cy, sh, ch } the normalised angles, for tools
```

## How it works (so you know what to expect)

* **Sphere-mapped.** Every fruit is a spheroid turning about its vertical axis. A feature at front x sits at longitude L = asin(x / R); after the yaw it is at `R sin(L + yaw)` and its width is `cos(L + yaw) / cos(L)` of the front width. Eyes, brows, lashes, cheeks, mouth, seeds, badges and pins all follow, and hide beyond the horizon. R is the measured half width of the silhouette (per kind, once). Past about 40 degrees the face turns a little less than the head so the near eye and the mouth stay readable at the edge: the face lingers to about 115 degrees. At the back there is no face (and no face box for the layout audit).
* **The mouth** is a sampled outline mapped onto the sphere; toward profile it morphs point by point into a side view lying along the silhouette edge with the lip overhanging it. Open / spread / teeth / tongue all work.
* **Silhouette.** `sym` kinds (round, lemon, apple, pear, strawberry, citrus, melon...): unchanged at every yaw. `tube` kinds (a curved body: banana, mango): the centre line swings with cos(yaw), so a banana straightens at profile and mirrors beyond. `flat` kinds (the starfruit `star`, `star14`, anything with `yawMode: 'flat'`): the sprite squeezes to `yawMin` (default .55) of its width at profile and mirrors at the back. Per kind: `k.yawMode = 'sym' | 'tube' | 'flat'`, `k.yawMin`, `k.yawThick` (half thickness of the face plate of a flat kind).
* **Arms.** Shoulders sit at +-90 degrees of longitude: x = shoulderX cos(yaw), and the arm on the side the face turns away from is behind the body (drawn first; it eases from in front to behind between 5 and 16 degrees so nothing pops). Pose angles are frontal-plane angles: they foreshorten with cos(yaw); gesture poses twist toward the face side; walkers swing along the walk. At the back, arms holding something in front of the body (`grip`, `hold`, `point`, `offer`...) are hidden behind it.
* **Legs.** Hips are cos(yaw) apart; the gait still moves the feet along the screen x, so planted feet stay planted. The far leg is drawn first and a touch darker; knees bend toward the face side in profile; shoes show their length and point where the face points; from behind you see heels. A standing character in profile has one foot a little ahead.
* **Tops** (stems, leaves, caps, hats, crowns): turn with `headYaw`. Strawberry: the calyx is two crossed fans of leaves, the nurse cap keeps its band, its cross slides round the front and is gone at the back (a plain cap with a seam). Any other top is a flat sprite that turns about the stem (35 percent wide at profile, mirrored at the back); write `V2C.YAW_TOP[kind] = (o, k, t, layer, Y, P) => {...}` to do better.
* **Textures:** `V2C.YAW_TEX[tex or kind] = (o, k, t, Y, P) => {...}` maps marks onto the sphere (strawberry seeds, citrus dots, melon net...); any other texture is panned and squeezed (a cheap fake that never breaks).
* **Accessories.** Each name has a class: `face` (glasses, mask, mustache, lashes: turns with the head, hidden when the face turns away), `fdecal` (a patch on the head: bandage), `head` (hats: flat sprite turning about the head), `decal` (badge, pin, tag, key ring: its first `ctx.translate` is its anchor, moved to where that spot of the sphere has turned to), `wrap` (clothes), anything else is chest dressing (panned and squeezed, hidden behind the body). `V2C.YAW_ACC[name] = (o, k, t, layer, yaw, Y, P) => {...}` replaces the fallback; give the function `.cls = 'face' | 'head' | 'chest'` to choose which yaw it is handed (`face`, `head` get headYaw, the rest the body yaw). `ACC_CLS` has the table; kit authors: register your accessory's class in `V2C.ACC_CLS[name]` or write the override.

## Kinds and ranges

See the bottom of this file ("Supported ranges", updated at the end of the work).

## Snippets

A profile walker (left to right, dollhouse scale), gait from the distance walked, arms swinging by themselves:

```js
const dist = x - x0;                                   // world units walked so far, a function of time only
drawChar(A7.straw({ x, y: floorY, s: .44, yaw: PI / 2, dir: 1, gaitW: dist / .44, axis: 'x', vx: speed }));
// walking left: yaw: -PI / 2, dir: -1. With person() from ep6.js pass the yaw in `extra`: person(A7.straw, path, lt, { yaw: V2C.yawToward(vx, { max: PI / 2, k: 80 }) })
// turning round at the end of the corridor: yaw: V2C.turnLerp(PI / 2, -PI / 2, seg(lt, t0, t0 + .8)) (it goes through the front; use PI / 2 -> 3 * PI / 2 to go through the back)
```

A seated audience member seen from behind, who turns his head to the neighbour on his right:

```js
const u = ease(seg(lt, t0, t0 + .5));                  // 0 -> 1
drawChar(A7.mango({ x, y, s: .5, noLegs: true, yaw: PI, headYaw: lerp(PI, PI - 1.35, u) }));   // the body shows its back; the head turns 77 degrees, the near eye and the cheek come into view
// two neighbours turning to each other: left one headYaw: lerp(PI, PI + 1.35, u) (the face turns toward screen left)
```

A three-quarter talker (the speaker faces the listener 220 px to his right and talks):

```js
drawChar(A7.lemon({ x, y, s: 1, yaw: V2C.yawToward(220, { max: .62 }), look: [.5, 0], expr: 'neutral' }));   // who: 'lemon' makes the mouth move as usual
// the listener, turned back toward the speaker: yaw: V2C.yawToward(-220, { max: .62 })
// only the head follows a passing character: { yaw: 0, headYaw: V2C.yawToward(other.x - me.x, { max: .9 }) }
```

## Notes for kit authors (E15-ART and later)

* A new kind needs nothing for a basic turn: the silhouette is measured, the face is mapped, the texture is panned. For a flat sprite (a binder clip, a card) set `yawMode: 'flat'` on the kind; for a curved body `yawMode: 'tube'`.
* The first `ctx.translate(x, y)` of an accessory registered as `decal` is its anchor; a `ctx.translate(fx, 0)` with y 0 first is ignored.
* Held props are drawn exactly as before (they ignore the yaw); their audit boxes are registered as before.
