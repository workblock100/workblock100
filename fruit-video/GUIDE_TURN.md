# GUIDE_TURN: character turnarounds (`yaw`) in the v2 renderer (Episode 15)

Every character can now turn: three-quarter views, profile walks, backs. It is `drawChar({ ..., yaw, headYaw })`, implemented in `v2_char.js` (search "TURN").
**`yaw` and `headYaw` unset or 0: the original code path runs, byte-identical to Episodes 6 to 14** (`/tmp/wt_turn/turn_regress.sh` renders 42 reference frames before and after and `cmp`s them: it says IDENTICAL).
At yaw 0.002 the turned path is the same picture as the front one to within a pixel or two, so a turn can start from the front without a pop (`turn_tools/cont_test.py`).

## The contract

| option | meaning |
|---|---|
| `yaw` | radians, taken modulo 2 pi. 0 front. **Positive turns the FACE toward screen right**, negative toward screen left. +-pi/2 profile, pi the back. Turns the body: skin texture, arms, legs, shoes, chest dressing. |
| `headYaw` | the same angle for the head only: face, stem / leaves / cap / hats, what is worn on the face. Default: equal to `yaw`. It is absolute, not relative to the body: a front-facing body with the head turned to the left is `{ yaw: 0, headYaw: -0.6 }`. |
| `turnTo: [y0, y1, u, lead, dir]` | the body yaw eased from y0 to y1 by u (0..1, your own progress). `lead` (0..1, say .3) makes the head arrive that much before the body. `dir` +1 / -1 forces the turn to raise / lower the yaw (a half turn from +PI/2 to -PI/2 goes through the front with -1, through the back with +1; the default is the short way). `headTurnTo: [y0, y1, u, dir]` is the same for the head alone. |
| `swingZ` | forward / back swing of the arms, radians, positive forward: a number or `{ l, r }`. A walking character (`gait` or `gaitW`) with `rest` / `down` arms swings them by itself in profile (`armSwing`, default .62; 0 turns it off). |
| `armTwist` | how far a gesture arm turns toward the face side when the body turns, -1..1, a number, a pair `[upper arm, forearm]` or `{ l, r }`. The defaults are in `POSE_TWIST`: `point`, `reach`, `offer`, `stop` go forward in profile, `hips` goes back (elbow back, hand on the hip). |
| `gripSpace` | `'screen'` (default): `grip` targets are body-local pixels of the screen, as at the front: use it for a hand that goes to a place on screen (the head, a phone at the ear, another character). `'body'` (or `{ l: 'body', r: 'screen' }`): the target turns with the body: x foreshortens with cos(yaw) and the hands stay `gripZ` (default half the body radius) in front of it: use it for what is held against the body (a clipboard, a tray, a bag). A target that only went out of reach because the shoulder moved with the turn stops at full stretch (a target out of reach at the front is still reported by the audit). |
| `dir` | walking direction, +1 right, -1 left, as before. With a yaw and no `dir` a walker goes where the face points. `gaitW` is still the distance walked divided by the scale, so planted feet stay planted. |

Everything else is unchanged: `look` (relative to the head), `expr`, `who` (lip-sync works at every angle: a three-quarter mouth, and at profile a mouth lying along the silhouette edge with the lip overhanging it), `lid`, `lashes`, `arms`, `grip` (IK targets stay in SCREEN space unless `gripSpace` says otherwise: the shoulders move when the body turns, keep the target within reach, the audit prints it if not; while the character is drawn, `o.grip` holds the hands as they really are, so a prop that reads it, like the clipboard's pen string, follows the real hands), `hold` (props are drawn as before and ignore the yaw), `acc`, `flip` (mirrors the whole figure), `noLegs`, `plant`, `transit`, `center`. The key light does not turn: highlights and shading stay in screen space.

Helpers, all on `V2C` (a global in every scene module):

```js
V2C.faceDir(o)                    // +1 the face points to screen right, -1 to the left (flip counted)
V2C.yawToward(dx, { max: 1.15, k: 220 })   // a smooth yaw that points a character at something dx px to its right (negative: left); max 1.15 is a three-quarter view. For a velocity: { max: Math.PI / 2, k: 80 }
V2C.yawFromMotion(vx, toward, rest)        // face the way you are going: 0 front, +PI/2 walking right, PI walking away, -PI/2 left (vx screen velocity, toward > 0 toward the camera)
V2C.turnLerp(a, b, u, dir)        // the angle u of the way from a to b, eased (dir optional, see turnTo)
V2C.turnPair(a, b, u, 0.3, dir)   // { yaw, headYaw }: the head arrives 30 percent of the time before the body
V2C.yawInfo(o)                    // { y, h, sy, cy, sh, ch }: the normalised body / head yaw and their sines and cosines (kit authors)
V2C.faceAng(h)                    // the angle the face FEATURES are painted at for a head yaw h (see below)
```

## How it works (so you know what to expect)

* **Sphere-mapped.** Each fruit is a spheroid turning about its vertical axis. A feature at front x sits at longitude L = asin(x / R); after the turn it is at `R sin(L + yaw)` and as wide as `cos(L + yaw) / cos(L)` of its front width. Eyes (lids, lashes, bags, sparkle), brows (they keep their tilt and get shorter), cheeks, mouth, seeds, badges, pins: all follow, and hide beyond the horizon. R is the measured half width of the silhouette (rasterised once per kind, again the moment a kit replaces `PATHS[kind]`, 0.5 ms). Features are kept inside the silhouette; the far eye fades out at the limb.
* **The face leads a little.** Past about 40 degrees the face turns up to 15 degrees less than the head (`faceAng`) and, toward profile, the near eye is drawn wider than the sphere would make it, so the near eye and the mouth stay readable at the edge and at phone size; the face lingers to about 105 degrees, fades out by about 115 and is gone at the back (no face box is registered for the layout audit when no feature is visible).
* **The mouth** is a sampled outline mapped onto the sphere that morphs (point by point, between about 55 and 80 degrees) into a side view along the silhouette edge, the outer lip overhanging it. Open / spread / teeth / tongue all work.
* **Silhouette**, three modes per kind (`k.yawMode`, otherwise measured): `sym` the outline never changes (round, lemon, apple, strawberry, pear, citrus, melon, cone, onion, tomato, artichoke...); `tube` a curved body: the centre line swings with cos(yaw), so a banana (and, a little, a mango) straightens at profile and mirrors behind; `flat` a sprite (the starfruit `star` / `star14`, `k.flat`): it squeezes to `k.yawMin` (default .55) of its width at profile and mirrors at the back; `k.yawThick` is the half thickness of its face plate.
* **Arms.** Shoulders sit at +-90 degrees of longitude: x = shoulderX cos(yaw), and the arm on the side the face turns away from is the far one: drawn before the body, a little darker, and between 5 and 16 degrees of yaw it eases from in front to behind so nothing pops. Pose angles are frontal-plane angles, they foreshorten with cos(yaw); gesture poses twist toward the face side; walkers swing along the walk. From behind, an arm held out in front of the body (`grip`, `hold`, `point`, `offer`...) is behind the body.
* **Legs.** Hips are cos(yaw) apart; the gait still moves the feet along the screen x, so planted feet stay planted whatever the yaw. The far leg is drawn first and darker; knees bend toward the face side in profile; shoes show their length and point where the face points; from behind you see heels. Standing in profile one foot is a little ahead. Shadow and reflection follow.
* **Tops.** The strawberry calyx is two crossed fans of leaves (the side fan opens as the head turns); the nurse cap is a flattened bowl whose cross slides round the front and is gone at the back (a plain cap with a seam). Rings of leaves, caps and stubs (`TOP_SYM`) are the same from every side; any other engine top is a sprite that turns about the stem (62 percent wide at profile, mirrored at the back).
* **Skin.** Strawberry seeds (equal arc length on the sphere, blended from the flat lattice of the front art so a turn starts without a jump), citrus / lemon / melon net / mango blush / pear and kiwi and coconut marks are mapped onto the sphere with a twin on the far side; the patch of skin under the face follows the head. Any other texture is panned and squeezed (a cheap fake that never breaks).

## Accessories

Each accessory name has a class (`V2C.ACC_CLS`): `face` (glasses, mask, mustache: pan with the face, hidden when it turns away), `fdecal` (a patch on the head: the bandage), `head` (hats: a sprite turning about the head, 60 percent wide at profile), `decal` (badge, name tag, pin, price tag, key ring: its first `ctx.translate(x, y)` is its anchor, which is carried to where that spot of the sphere has turned to, the patch squeezed to match and a label that fits inside the silhouette at the front kept inside, one that already pokes out at the front brought back inside as the body turns, a quick fade at the limb), `wrap` (clothes), anything else is chest dressing (panned and squeezed, hidden behind the body). Hand-written, yaw-aware: `steth`, `lanyard`, `lanyard7` (a loop round the shoulders that climbs to the nape behind: you see it across the upper back), `glasses`, `readers` (each lens placed like an eye, a bridge, a temple arm to the near ear), `suit` (shirt, lapels and tie turn with the body; from behind a collar and a centre seam), `gaitbelt`, `gaitbelt7` (a band right round, the buckle in front only), `suspenders`, `curlers`, and the Stateman's windbreaker (`YAW_TEX.star14`: the back has no zip, crest or pocket protector).
Register your own: `V2C.YAW_ACC[name] = (o, k, t, layer, yaw, Y, P) => {...}` replaces the fallback (it is called for layer 'back', 'mid' and 'front' like an `EXT.acc` function; draw only the layer you need); give the function `.cls = 'face' | 'head' | 'chest' | 'wrap'` to choose which yaw it gets (`face` and `head` get `headYaw`, the others the body yaw). `Y = V2C.yawInfo(o)`, `P` is the measured silhouette (`P.mode`, half width at a height: look at `profW` in v2_char.js). `V2C.ACC_CLS[name] = 'decal'` etc. if the fallback of that class is enough. `V2C.YAW_TEX[kind or tex name or 'shape:' + shape] = (o, k, t, Y, P) => {...}` and `V2C.YAW_TOP[kind] = (o, k, t, layer, Y, P) => {...}` do the same for skin and tops (a kit whose own hooks already read `o.yaw` / `o.headYaw`, like A15, registers a wrapper that calls them).

## Supported ranges (honest)

What was checked, by eye: turntables every 30 degrees of every kind the episodes use, the plus and minus 35 and 145 degree sets, profile walks (left and right, scale .44 and 1.0), the whole of the new A15 cast at 0, 35, 90 and 180; no popping in 2 degree sweeps (straw, lemon, melon, mango, clem, Stateman, banana; the A15 cast only by turntable); draw time at 35 degrees is about 7 percent over the front on average (straw +18, mango +16, Stateman +10, lemon +7, clem -2, melon -5); 90 and 180 degrees cost the same as the front or less.

| kind | range | notes |
|---|---|---|
| straw (A7 nurse cap, A11 per diem), lemon (readers, lanyard), mango (belt, keys, badge), clem (steth, price tag), melon (suit, name tag), cran (curlers, glasses), pear (cap, suspenders), apple, kiwi, fig, pine, blue, cherry, grape, prune, coco, lime, pom, papaya, goji, persimmon, kumquat, dragon, sun, moons, pill, capsule | 0 to 360 | `sym` or nearly so: three-quarter, profile, back, every angle. The face reads out to about 105 degrees of head yaw and is gone by about 115 (no face at the back). |
| banana | 0 to 360 | `tube`: straightens at profile, mirrors behind |
| star, star14 (Mr. Stateman) | 0 to 360 | `flat`: a sprite that squeezes to 55 percent at profile and mirrors at the back; the windbreaker has a back (collar, seam) and swaps its details at profile |
| A15 arti, onion, tomato, broc, carrot, binder | 0 to 360 | their own tops, skin and accessories read the yaw (`yawOwn`); face, arms, legs and shoes are this rig's. The binder is a flat clip: it squeezes at profile |

Nothing is marked unsupported. Weak spots, said plainly:

* Profile shoes are plain ovals (a toe seam, no heel / sole shape).
* Garments other than the suit and the Stateman's windbreaker (cardigan, firecoat, gown, scrubs, robe, coats) are panned in front of the body and show their front design from behind: write a `YAW_ACC` for the one you need. Hats other than the nurse cap are flat sprites (60 percent wide at profile).
* Held props ignore the yaw (drawn as before, at the real hand). A badge or tag is a decal on the chest, not a swinging card: it has no blank back, and near the limb it is a thin card that fades out quickly. A key ring hangs at the hip even from behind (on the far side it is drawn over the lower edge of the body, not hidden by it).
* `grip` targets are in screen space by default: past about 100 degrees the hands that hold something go behind the body (`gripSpace: 'body'` keeps them with the body). A Stateman at profile has his near shoulder at the middle of a thin body, so the arm seems to leave the cheek.
* Textures without a `YAW_TEX` are a pan and a squeeze (prune / raisin wrinkles, dragon scales, moon craters).
* Not this rig's: A15's `fp15_headset` throws "non-finite gradient" on kinds that are not A15's (even at yaw 0).

## Snippets

A profile walker (left to right, dollhouse scale; arms swing by themselves). `gaitW` is the distance walked divided by the scale:

```js
const dir = 1, speed = 150, s = .44, dist = speed * lt;          // screen px walked: a function of time only
drawChar(A7.straw({ x: x0 + dir * dist, y: floorY, s, yaw: dir * PI / 2, dir, gaitW: dist / s, axis: 'x', vx: dir * speed }));
// with person() from ep6.js: const o = person(A7.straw, path, lt); o.yaw = (o.dir || 1) * PI / 2; drawChar(o)   (walking toward / away from the camera in a perspective set: o.yaw = V2C.yawFromMotion(vx, -vz))
// turning round at the end of the corridor: yaw: V2C.turnLerp(PI / 2, -PI / 2, seg(lt, t0, t0 + .8), -1)   (-1: through the front; +1: through the back)
```

A seated audience member seen from behind (the chair hides the legs), who turns his head to the neighbour on his right:

```js
const u = easeIO(seg(lt, t0, t0 + .5));                          // 0 -> 1
drawChar(A7.mango({ x, y, s: .5, noLegs: true, yaw: PI, headYaw: lerp(PI, PI - 1.35, u) }));   // the body shows its back; the head turns 77 degrees: the near eye and the cheek come into view
// the neighbour turning back: headYaw: lerp(PI, PI + 1.35, u)  (the face turns toward screen left). Both heads only: the shoulders keep facing the screen.
```

A three-quarter talker (the speaker faces the listener 220 px to his right):

```js
drawChar(A7.lemon({ x, y, s: 1, yaw: V2C.yawToward(220, { max: .62 }), look: [.5, 0], expr: 'neutral' }));   // who: 'lemon' makes the mouth move as usual
// the listener, turned back toward the speaker: yaw: V2C.yawToward(-220, { max: .62 })
// only the head follows a passing character: { yaw: 0, headYaw: V2C.yawToward(other.x - me.x, { max: .9 }) }
// a head that leads a body turn: Object.assign(A7.straw({...}), { turnTo: [0, 1.2, u, .3] })
```

## Notes for kit authors (E15-ART and later)

* A new kind needs nothing for a basic turn: the silhouette is measured, the face is mapped, the texture is panned. For a flat sprite set `yawMode: 'flat'` (or `flat: true`) on the kind; for a curved body `yawMode: 'tube'`. A kind whose `KINDS` fields or `PATHS[kind]` change while it is on screen (A15 artichoke) is measured again each time its path object is replaced (0.5 ms).
* A `decal` accessory must start with `ctx.save(); ctx.translate(x, y)`: that translate is the anchor. A `ctx.translate(fx, 0)` with y 0 first is ignored. Register its front width for the keep-inside rule: `V2C.ACC_W[name] = 52` (px, or a function of o); the default is 40.
* Text inside a mirrored sprite is un-mirrored for you (`FLIP`); text on a squeezed decal is squeezed (keep lettering on decals small and `hero: false`).
* Held props are drawn exactly as before (they ignore the yaw); their audit boxes are registered as before.
