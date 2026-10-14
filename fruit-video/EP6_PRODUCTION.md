# SHIFT HAPPENS — Episode 6 production package

**Title:** FIVE SECONDS  
**Status (October 14, 2026):** Script, scene animation, art, isolated rig, and silent preview timeline committed to the existing **draft** branch. **No voiced Episode 6 MP4 has been rendered, watched, listened to, or released.** The approximate preview currently runs about **2:37**; voice-synthesized timing will differ.

## Logline and comic mechanism

Corporate measures the time from a call bell to a finger touching the button, not the time it takes to help the resident. Fruit Bowl becomes a competitive arena: medals for button presses, punishment for listening, and eventually a spring-loaded glove with a perfect score. When the score machine itself cries for help, staff discover that "being answered" and "being helped" aren't interchangeable. Corporate awards Employee of the Month to the wall.

This is a **metric-measurement comedy**, not another shift meltdown, survey, holiday, new-grad orientation, or supernatural-blame episode. Residents and direct-care staff are sympathetic; the institutional incentive is the butt of the joke.

## Shot list / silent preview timeline

These are approximate cue windows from `build/ep6/timeline.js`, **not final voiced timestamps**.

| Preview time | Sequence | Story / staging | Key performance, props and audio |
| --- | --- | --- | --- |
| 00:00–00:10 | COLD: New record | Huge red timer over a resident room. Confetti explodes around Strawberry's button touch before anyone helps Pear with his blanket. | Contact pose: Strawberry right hand to wall button; Pear looks disappointed. Fanfare → trombone; freeze reaction. |
| 00:10–00:33 | THE ROLLOUT | Corporate classroom where a mammoth leaderboard dwarfs the staff. Kumquat, Vice President of Speed, explains "the button" is all the system measures. | Kumquat's lanyard/tie, Strawberry's gripped KPI clipboard, Melon's approving nod; timer glows. |
| 00:33–00:55 | THE FIVE-SECOND GAMES | Rehabilitation hallway becomes a finish line; every lamp is a race. Strawberry gets silver for 4.9 s. Mango gets 1.2 s without having entered the room. | More deliberate poses, stronger shoulder/elbow silhouette and grip contacts; gong, scoreboard tick, medal confetti. |
| 00:55–01:18 | ROOM 8 | Pear tells Strawberry he was a history teacher. She listens. The giant statistic calls the time "unscored interaction." | Quiet staging and close reactions; sparse tender underscore; scoreboard red intrusion interrupts the warmth. |
| 01:18–01:36 | ZERO-SECOND SOLUTION | Kumquat unveils a literal spring-mounted glove to keep a button constantly answered. Zero seconds wins compliance. | Original prop/set piece with physically touching glove, escalating spring coils, celebratory confetti. |
| 01:36–01:57 | SYSTEM ERROR | The machine overheats and cries for help. Kumquat discovers what it means to be left unanswered. | Cool dark server racks, red HELP display, panic acting, hard musical drop for confession. |
| 01:57–02:19 | THE REAL SCORE | Strawberry and Mango write "Answer the bell. Finish helping." Melon complains the numbers went down. Mr. Pear exposes the broken metric. | Bright return to resident room; visible marker-writing reveal; sincere beat without preaching. |
| 02:19–02:28 | CREDITS | Nurses, consultant and resident together. Show retains its signature fruit charm. | Logo, ensemble poses; 3–11 line; no baked player progress bar. |
| 02:28–02:37 | TAG | An award stands against a literal wall. "Employee of the Month: the wall." Pear: "At least the wall stays when you talk to it." | Hero podium and gold wall medal. End on reaction, not extended hold. |

## Character voice and dialogue direction

Voice assignments are in `script_ep6.json`, built through the existing Kokoro model and its original waveform-based mouth envelopes:

- **Strawberry:** `af_heart` — quick restrained sarcasm, then a grounded, warm exchange with Pear. Don't play cruelly toward residents.
- **Mango:** `af_bella` — weary, quick deadpan with surprised timing on "I haven't even walked into the room."
- **Kumquat (new):** `am_puck` — polished corporate enthusiasm that finally cracks. Do not sound like a malicious villain.
- **Melon:** `am_echo` — genial bureaucratic self-importance.
- **Mr. Pear:** `am_fenrir` — understated, dry, gentle.
- **Leaderboard:** `af_sarah` — cheerful PA voice, with warmer vulnerability in the system-error scene.

The complete **spoken lines and intended on-screen captions** are stored per beat as `say` and `text`. Caption word timing is derived from the finished TTS audio by `build_audio.py`; the currently checked-in silent-preview timing file uses estimated timing and deliberately zeroes mouth movement. It must be regenerated before final release. Pronunciation check: **Kumquat**, **compliance**, and **unscored**.

## Music and sound

Use original generated tones/sounds from `build_audio.py`: the gong/fanfare for the sports parody, the fast gallop underscore in the race, a quieter tender bed when Pear is heard, and sparse suspense in the overheating server scene. Duck music below every line. Do **not** reuse the Moon's theme. Listen for intelligibility of "zero point eight" and "one point two"; if Kokoro stumbles, update spoken phonetics without changing captions.

## Episode-specific rig and visual changes

- **Two-segment limbs:** `ep6_rig.js` defines shoulder-to-elbow-to-hand (and hip-to-knee-to-foot) IK with fixed link lengths and reach bounds. Character presets are scaled to anatomy, rather than stretching smaller fruit.
- **Explicit contacts:** The animator may provide `grip: { r: [x,y], l: [x,y] }` in local body coordinates. These contacts cannot be silently extended to unreachable locations; audits flag unrealistic targets. The clipboard `kpipad` is drawn with its handle at the hand origin and an overlapping glove thumb.
- **Persistent feet:** Standing `noBob:true`; walking feet compensate for parent walk-bob. Check actual pixel planting in the browser, because numeric IK alone cannot prove weight.
- **Isolation:** `engine.js` calls Episode 6's rig and diagnostic methods only when `EP.num === 6`. All previous episodes still use their old rendering paths. Their existing files must remain untouched.
- **Phone export:** Episode 6's caption panel omits fake video progress and clock controls. Keep all required dialogue readable above social-app controls; confirm inside actual TikTok UI safe regions, especially the last subtitle line, rather than trusting pixel coordinates alone.
- **New design vocabulary:** Corporate blue digital signage and gold stopwatch graphics contrasted with quiet sage resident-room interiors. The giant scoreboard visibly invades ever larger spaces. The server racks and the wall podium are new locations, not recycled Moon hall backgrounds.

### Must-pass automated checks

1. `node --check` new JavaScript files plus `python3 -m json.tool script_ep6.json >/dev/null`.
2. `EP=6 node render.js preview 0.2 4 12 35 55 66 82 102 118 140 152`.
3. `EP=6 node render.js audit 0.0333333333`, capturing **all** reported warnings (the old audit can return success even with layout errors). `checkFrame` now combines existing box errors with `EP6_RIG.validateFrame()` (segment-length, reach and grip-attachment checks).
4. Inspect all shots at start/middle/end, plus extreme poses and 0.1-second transition scrubs; inspect glove/button and left/right arms especially.
5. After building voices, play the **entire** episode and confirm scene timing, lip sync, SFX, caption line wraps, speech clarity, and character continuity.
6. Render 1080×1920 at 30 fps H.264/AAC, validate streams with `ffprobe`, and decode every frame with `ffmpeg -v error -i ... -f null -`.
7. View the final export at actual phone size with platform overlays and verify title/caption safe regions. Record any failures before calling the episode finished.

### Known limitations of the current draft

- The remote rendering computer connection was unavailable in this chat; the working container could not access GitHub directly or retrieve the Kokoro model. Consequently the final voices, AAC track, MP4, rendered shot images, frame-by-frame audit and phone-size visual/audio sign-off are **not yet done**.
- A JavaScript-only mocked Canvas smoke test sampled **630 time points at 0.25-second intervals** through all nine scenes with **zero IK/explicit-grip violations and zero JavaScript exceptions** after anchor corrections. It **cannot validate aesthetic quality or real overlap metrics**.
- The storyboard times above are provisional. Re-render the timeline from real speech before deciding whether to tighten pauses or cut a short teaser.

## Thumbnail / social package

**Cover direction:** Vertical 9:16 illustrated comedy key art. Foreground Strawberry in nurse scrubs reaches to press a huge red call-light button; behind her, charming older Pear looks up and waits patiently. Enormous stadium timer `00.8 SEC`, corporate gold confetti, sleek blue stadium-style signage and polished rehab hallway. Crisp large title `SHIFT HAPPENS` and subtitle `EPISODE 6 — FIVE SECONDS`. Maintain the established 2D fruit characters, readable emotional faces and clean hand contacts. Leave social overlay-safe margins.

**Post copy (draft, not posted):** "Corporate said five seconds. They forgot to specify what for. SHIFT HAPPENS Ep. 6: Five Seconds. #NurseHumor #LPN #NightShift #LongTermCare"

**Optional cutdown:** Cold-open 00:00–00:10 plus the spring glove's zero-second scoreboard and wall-wins-the-trophy tag; re-time sound and transitions, never export a rough concatenation as the final short.

## Novelty ledger (carry to Episode 7)

| Episode | Central engine | Distinct visual / payoff | Avoid recycling |
| --- | --- | --- | --- |
| 1 | Generic 3–11 assignment collapse | Jam transformation | Cascade of unrelated emergencies |
| 2 | State survey transforms staffing and compliance | Magic Kiwis, Grapefruit deficiency | Sudden miraculous compliance |
| 3 | Unfair holiday schedule | Fig's holiday montage, shared pen | Holiday rotation |
| 4 | Unrealistic new-grad orientation | NCLEX Land, marmalade | Naive newcomer overloaded |
| 5 | Moon blamed for unrelated chaos | Blame tally, quest for BP cuff, server/cart malfunction | Blame ledger / lost equipment chase |
| **6** | Broken response-speed KPI | LED stadium, five-second games, spring glove, overheating dashboard, wall receives award | Stopwatch competition, false button KPI, literal hand contraption |

Episode 7 should introduce a new practical setting or relationship and a different central mechanism.

## Release authorization

Do **not** publish on TikTok, send to a coworker, or merge PR #1 until the owner explicitly approves. The working files were added to the existing draft branch only.
