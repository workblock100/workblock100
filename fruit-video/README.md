# SHIFT HAPPENS

Animated fruit soap operas about a nurse's 3-11 shift at Fruit Bowl Rehab & Nursing.
Vertical 1080x1920, 30 fps, voiced, with captions. Made to be texted to a nurse.

| Episode | Watch | Length |
|---|---|---|
| 1: The 3-11 | [`shift-happens.mp4`](shift-happens.mp4) | 2:44 |
| 2: Survey Says | [`shift-happens-ep2.mp4`](shift-happens-ep2.mp4) | 2:22 |
| 3: The Holiday Schedule | [`shift-happens-ep3.mp4`](shift-happens-ep3.mp4) | 2:17 |
| 4: The New Grad | [`shift-happens-ep4.mp4`](shift-happens-ep4.mp4) | 2:09 |
| 5: Full Moon | [`shift-happens-ep5.mp4`](shift-happens-ep5.mp4) | 2:59 |
| 6: Five Seconds | **In production — not yet rendered** | TBD (voice-timed) |

To play an episode live in the browser, start a local server in this directory and open
`http://localhost:8000/index.html?ep=5` (change `ep` to 1 through 6 for other episodes):

```bash
python3 -m http.server 8000
```

## Episode 2: Survey Says

"Mr. Stateman is in the lobby." The state surveyor (a Starfruit) arrives, and for one afternoon the
building follows every rule: the Administrator (a Melon in a suit) appears with pizza, five agency Kiwis
materialize, hand hygiene hits 47, nobody crushes the ER, and Mr. Banana's fall gets stopped in slow motion.
Then the surveyor leaves, the Kiwis vanish, the pizza goes back, and the survey finds exactly one deficiency:
F-761, Grapefruit in the med fridge.

Episode 2 moves every caption, clock and title into a panel under the picture, so text never sits on the action.

## Episode 3: The Holiday Schedule

October 1st: the holiday schedule goes up, and Strawberry is on every holiday. "It's the rotation."
Cherry put her request in on January 1st at 12:01 AM. The Scheduler (a Fig in a fedora) makes an offer
nobody can refuse. The company thanks its holiday heroes with one pen, to share. Then a montage: at
Thanksgiving Mrs. Cranberry meets the cranberry sauce (cousin Doris); on Christmas the Administrator says
"nice and quiet" and every call light comes on; on New Year's Eve Dr. Apple returns a page from Thanksgiving.
At 12:05 AM, next year's schedule is posted.

## Episode 4: The New Grad

Clementine arrives: licensed six days ago, passed her boards at 85 questions, price tag still on her stethoscope.
Orientation is three days of videos, then forty residents ("We don't eat our young. We just give them the heaviest
assignment."). She daydreams of NCLEX Land, where every nurse has one patient and Dr. Apple is already there.
Strawberry teaches her three rules (never say the Q word, always check the baseline, never lend your pen), her first
med pass takes four hours, she says "Sure!" to everyone, and she pages Dr. Apple because the blueberry is blue.
Then night shift calls out, and that is how marmalade is made.

## Episode 5: Full Moon

The Moon takes the night shift personally: every problem gets blamed on him, so he starts keeping score.
Strawberry's break lasts four seconds, Mr. Pear has the only protected break in the building, and CNA Mango
leads a quest for the one blood pressure cuff that works. A runaway laundry cart, a dying computer on wheels,
and a changed Wi-Fi password bring the score to seven. The real cause is staffing; the Moon is not even full
until tomorrow. Night Nurse Dragonfruit arrives rested, and the Sun claims sundowning in the post-credits scene.

## Episode 6: Five Seconds (production in progress)

Kumquat, corporate's Vice President of Speed, rolls out a call-light leaderboard. A resident's
needs don't count; only the first touch of the button counts. Staff become athletes, a mechanical
glove wins the KPI, and Mr. Pear exposes what the scoreboard can't measure. Strawberry and Mango
replace the metric with a simpler rule: answer the bell **and finish helping**. The wall is named
Employee of the Month. This episode has an all-new corporate arena, racing hallway, room-eight
conversation, overheated server room, podium tag, and episode-only IK arm/leg rig.

**Status:** Script and procedural animation sources implemented; exported voiced MP4 and visual,
audio, clinical and platform QC are **not completed**. `build/ep6/timeline.js` is an approximate
silent-preview timing guide until Kokoro regenerates it. See [EP6_PRODUCTION.md](EP6_PRODUCTION.md).

## The cast

| Fruit | Role | The bit |
|---|---|---|
| Strawberry | Nurse, 3-11 | Survives 40 residents, no breaks, then melts into jam |
| Cherry | Day shift | Cherry-picked the easy assignment, gone at 2:59:59 |
| Lemon | Charge nurse | Sour. Brings the staffing news and the mandatory OT |
| Blueberry | Room 12 | SpO2 87%. Baseline: blue |
| Cranberry | Room 7 | Thinks it's 1962. It's a UTI |
| Prune | Room 3 | Six days, no BM. The prune juice is his cousin Gary |
| Grapefruit | Villain | Natural enemy of the statin |
| Grape, then Raisin | Room 9 | "I had a sip on Tuesday." Deficient fluid volume |
| Banana | Room 4 | Slipped on his own peel. Fall number four |
| Dr. Apple | Attending | An apple a day keeps him away. Calls back at 3 AM |
| Pineapple | Family member | The crown is a "Can I speak to your manager" |
| Coconut | New admit, 10:55 PM | No med list. No paperwork. Just vibes |
| Starfruit | State surveyor (Ep. 2) | "Don't mind me. I'm just going to observe." |
| Melon | The Administrator (Ep. 2) | Leaves the office once a year, with pizza |
| Kiwis x5 | Agency nurses (Ep. 2) | Appear when the State does. Vanish at 4:45 |
| Nifedipine ER | Capsule (Ep. 2) | Almost crushed. Says thank you |
| Fig | The Scheduler (Ep. 3) | Makes you an offer you can't refuse. Texts "hey :)" at 3 AM |
| Doris | Cranberry sauce (Ep. 3) | Mrs. Cranberry's cousin. She was jellied |
| Clementine | New grad (Ep. 4) | Passed at 85 questions. Says "Sure!" to everyone. Becomes marmalade |
| Moon | Night-shift narrator (Ep. 5) | Keeps score whenever someone blames him for a problem |
| Sun | Day-shift counterpart (Ep. 5) | Takes credit for a quiet day, then claims sundowning |
| Mango | CNA (Ep. 5) | Knows the legend of the good blood pressure cuff |
| Mr. Pear | Resident (Ep. 5) | Still honors the paid-break clause in his old contract |
| Dragonfruit | Night nurse (Ep. 5) | Arrives rested just in time for the actual full moon |
| Kumquat | Corporate KPI consultant (Ep. 6) | Can measure a button, cannot measure actual help |

## Layout audit

`node render.js audit` renders every frame and checks it against the layout rules: no card, banner, caption,
prop or foreground set piece may cover a face, a head or a key sign; nothing important may be cut off at the
frame edge; no text may be squished. Episodes 2 to 5 previously passed at 20 frames per second. Episode 6 is not yet audited in-browser; its rig adds joint-length/reach and hand-grip checks.

## How it's made

Everything is generated from code, with no stock assets:

- `script.json` and `script_ep2.json` to `script_ep6.json` hold the scenes, dialogue, voices and sound cues. Episode 2's
  "previously on" clips are cut straight from Episode 1's audio and frames.
- `build_audio.py` voices each line with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) TTS, synthesizes every sound effect and the music bed in numpy, mixes an episode's `audio.wav`, and writes its `timeline.js` with timings and lip-sync envelopes.
- `engine.js` draws every character, set and overlay on a canvas, including the panel-layout kit shared by
  Episodes 2 to 5; `ep1.js` to `ep6.js` are the episodes. Episode 5's new art and sets live in
  `ep5_art.js` and `ep5_sets.js`.
  `renderAt(t)` is a pure function of time, so the same code drives live playback and frame capture.
- `render.js` drives headless Chromium to capture frames and pipes them to ffmpeg.

```bash
pip install kokoro-onnx soundfile scipy numpy
# model files: kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx releases page
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep2.json --out build/ep2 --var TIMELINE_EP2
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep3.json --out build/ep3 --var TIMELINE_EP3
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep4.json --out build/ep4 --var TIMELINE_EP4
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep5.json --out build/ep5 --var TIMELINE_EP5
ffmpeg -y -i build/ep5/audio.wav -c:a aac -b:a 192k build/ep5/audio.m4a   # browser playback
EP=2 node render.js audit 0.05                                        # layout check, every 1/20 s
EP=2 FMT=image/png CRF=27 FFMPEG=/path/to/ffmpeg node render.js video shift-happens-ep2.mp4
EP=2 node render.js preview 12.5 40 88                                # stills in build/ep2/preview
EP=5 node render.js audit 0.05                                        # Episode 5 layout check
EP=5 FMT=image/png CRF=27 node render.js video shift-happens-ep5.mp4
EP=5 node render.js preview 12.5 40 88                                # stills in build/ep5/preview
```

Fonts from Google Fonts: Bangers and Nunito (SIL OFL), Luckiest Guy (Apache 2.0). Licenses are in `fonts/`.


## Episode 6 build and release gate

```bash
python3 build_audio.py --model /path/to/kokoro-v1.0.onnx --voices /path/to/voices-v1.0.bin --script script_ep6.json --out build/ep6 --var TIMELINE_EP6
ffmpeg -y -i build/ep6/audio.wav -c:a aac -b:a 192k build/ep6/audio.m4a
EP=6 node render.js preview 1 10 30 60 90
EP=6 node render.js audit 0.0333333333
EP=6 FMT=image/png CRF=20 node render.js video shift-happens-ep6.mp4
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of json shift-happens-ep6.mp4
ffmpeg -v error -i shift-happens-ep6.mp4 -f null -
```

A clean terminal audit is **not** a visual sign-off: check every shot at full speed and at phone size,
inspect hand-to-button/clipboard contacts and listen to the entire encoded export. Do not distribute,
publish or merge Episode 6 without explicit owner approval.
