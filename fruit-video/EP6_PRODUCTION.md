# SHIFT HAPPENS — Episode 6 production package

**Title:** FIVE SECONDS  
**Status (October 14, 2026):** Episode 6 is rendered as a **2:09** (128.57-second) voiced H.264/AAC 1080×1920 30 fps MP4 on the existing **draft** branch. FFmpeg decodes the entire file. Source preflight and a 30 fps layout/rig audit report **zero issues across 3,857 frames**. Audio measures −17.1 dBFS mean and −1.1 dBFS peak. Representative frames from all nine sequences were visually reviewed in the encoded export. Whisper `small.en` transcribed the dialogue in order; it caught the revised “The patent is pending” line, while a couple of short conjunctions still need human listening. Full real-time human listening and a device-specific TikTok safe-zone preview remain outstanding. **Not released or shared to TikTok or coworkers.**

## Logline and comic mechanism

Corporate measures the time from a call bell to a finger touching the button, not the time it takes to help the resident. Fruit Bowl becomes a competitive arena: medals for button presses, punishment for listening, and eventually a spring-loaded glove with a perfect score. When the score machine itself cries for help, staff discover that "being answered" and "being helped" aren't interchangeable. Corporate awards Employee of the Month to the wall.

This is a **metric-measurement comedy**, not another shift meltdown, survey, holiday, new-grad orientation, or supernatural-blame episode. Residents and direct-care staff are sympathetic; the institutional incentive is the butt of the joke.

## Shot list / actual voiced timeline

These are the actual voiced scene boundaries from `build/ep6/timeline.js` (128.56 seconds total).

| Preview time | Sequence | Story / staging | Key performance, props and audio |
| --- | --- | --- | --- |
| 00:00–00:09.5 | COLD: New record | Huge red timer over a resident room. Confetti explodes around Strawberry's button touch before anyone helps Pear with his blanket. | Contact pose: Strawberry right hand to wall button; Pear looks disappointed. Fanfare → trombone; freeze reaction. |
| 00:09.5–00:26.9 | THE ROLLOUT | Corporate classroom where a mammoth leaderboard dwarfs the staff. Kumquat, Vice President of Speed, explains "the button" is all the system measures. | Kumquat's lanyard/tie, Strawberry's gripped KPI clipboard, Melon's approving nod; timer glows. |
| 00:26.9–00:45.2 | THE FIVE-SECOND GAMES | Rehabilitation hallway becomes a finish line; every lamp is a race. Strawberry gets silver for 4.9 s. Mango gets 1.2 s without having entered the room. | More deliberate poses, stronger shoulder/elbow silhouette and grip contacts; gong, scoreboard tick, medal confetti. |
| 00:45.2–01:03.3 | ROOM 8 | Pear tells Strawberry he was a history teacher. She listens. The giant statistic calls the time "unscored interaction." | Quiet staging and close reactions; sparse tender underscore; scoreboard red intrusion interrupts the warmth. |
| 01:03.3–01:19.4 | ZERO-SECOND SOLUTION | Kumquat unveils a literal spring-mounted glove to keep a button constantly answered. Zero seconds wins compliance. | Original prop/set piece with physically touching glove, escalating spring coils, celebratory confetti. |
| 01:19.4–01:36.6 | SYSTEM ERROR | The machine overheats and cries for help. Kumquat discovers what it means to be left unanswered. | Cool dark server racks, red HELP display, panic acting, hard musical drop for confession. |
| 01:36.6–01:53.2 | THE REAL SCORE | Strawberry and Mango write "Answer the bell. Finish helping." Melon complains the numbers went down. Mr. Pear exposes the broken metric. | Bright return to resident room; visible marker-writing reveal; sincere beat without preaching. |
| 01:53.2–02:00.8 | CREDITS | Nurses, consultant and resident together. Show retains its signature fruit charm. | Logo, ensemble poses; 3–11 line; no baked player progress bar. |
| 02:00.8–02:08.6 | TAG | An award stands against a literal wall. "Employee of the Month: the wall." Pear: "At least the wall stays when you talk to it." | Hero podium and gold wall medal. End on reaction, not extended hold. |

## Character voice and dialogue direction

Voice assignments are in `script_ep6.json`, built through the existing Kokoro model and its original waveform-based mouth envelopes:

- **Strawberry:** `af_heart` — quick restrained sarcasm, then a grounded, warm exchange with Pear. Don't play cruelly toward residents.
- **Mango:** `af_bella` — weary, quick deadpan with surprised timing on "I haven't even walked into the room."
- **Kumquat (new):** `am_puck` — polished corporate enthusiasm that finally cracks. Do not sound like a malicious villain.
- **Melon:** `am_echo` — genial bureaucratic self-importance.
- **Mr. Pear:** `am_fenrir` — understated, dry, gentle.
- **Leaderboard:** `af_sarah` — cheerful PA voice, with warmer vulnerability in the system-error scene.

The complete **spoken lines and intended on-screen captions** are stored per beat as `say` and `text`. Caption word timing is derived from the finished TTS audio by `build_audio.py`; the checked-in `build/ep6/timeline.js` has been regenerated with the finished Kokoro voice waveform and mouth envelopes. Pronunciation and transcription checks include **Kumquat**, **compliance**, **unscored**, and the revised line **"The patent is pending."**

## Music and sound

Use original generated tones/sounds from `build_audio.py`: the gong/fanfare for the sports parody, the fast gallop underscore in the race, a quieter tender bed when Pear is heard, and sparse suspense in the overheating server scene. Duck music below every line. Do **not** reuse the Moon's theme. The full-export Whisper check recognizes the scripted number lines and the revised patent line; a human still needs to listen for performance, mix, and caption-to-voice timing.

## Episode-specific rig and visual changes

- **Two-segment limbs:** `ep6_rig.js` defines shoulder-to-elbow-to-hand (and hip-to-knee-to-foot) IK with fixed link lengths and reach bounds. Character presets are scaled to anatomy, rather than stretching smaller fruit.
- **Explicit contacts:** The animator may provide `grip: { r: [x,y], l: [x,y] }` in local body coordinates. These contacts cannot be silently extended to unreachable locations; audits flag unrealistic targets. The clipboard `kpipad` is drawn with its handle at the hand origin and an overlapping glove thumb.
- **Persistent feet:** Standing `noBob:true`; walking feet compensate for parent walk-bob. Check actual pixel planting in the browser, because numeric IK alone cannot prove weight.
- **Isolation:** `engine.js` calls Episode 6's rig and diagnostic methods only when `EP.num === 6`. All previous episodes still use their old rendering paths. Their existing files must remain untouched.
- **Phone export:** Episode 6's caption panel omits fake video progress and clock controls. Keep all required dialogue readable above social-app controls; confirm inside actual TikTok UI safe regions, especially the last subtitle line, rather than trusting pixel coordinates alone.
- **New design vocabulary:** Corporate blue digital signage and gold stopwatch graphics contrasted with quiet sage resident-room interiors. The giant scoreboard visibly invades ever larger spaces. The server racks and the wall podium are new locations, not recycled Moon hall backgrounds.

### QA record and release gates

- [x] `node ep6_preflight.js`: JavaScript syntax, scene/voice/SFX registration, timeline, and episode-only rig wiring pass.
- [x] Full 30 fps layout and IK audit: **3,857 frames, zero reported issues**.
- [x] Encoded export review: representative frames from all nine sequences; button/clipboard/spring-glove contacts, Pear's visible mouth, captions, and sign-off/tag were checked.
- [x] `ffprobe`: H.264 1080×1920 video at 30 fps and stereo 48 kHz AAC; duration **128.57 seconds**.
- [x] `ffmpeg -v error -i shift-happens-ep6.mp4 -f null -`: full-file decode completed with no errors. Audio measured −17.1 dBFS mean / −1.1 dBFS peak.
- [x] Whisper `small.en` transcript screen: the final mixed export covers the dialogue in order and recognizes “The patent is pending.” This is an automated text check, not an evaluation of voice performance or mix.
- [ ] Human full-speed listening pass for acting, intelligibility, sound balance, and lip-sync feel. The transcript check heard two brief conjunctions differently from the script; review those lines by ear.
- [ ] Device-specific TikTok preview and overlay-safe check before posting. TikTok says its in-feed safe-zone dimensions vary with format and caption length and that preview may differ slightly by device; use the current in-app preview for the chosen post type ([TikTok safe-zone guidance](https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en-GB)).

Re-run the automated checks from `fruit-video/`:

```bash
node ep6_preflight.js
EP=6 node render.js audit 0.0333333333
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of json shift-happens-ep6.mp4
ffmpeg -v error -i shift-happens-ep6.mp4 -f null -
```

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
