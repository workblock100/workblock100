# SHIFT HAPPENS

Animated fruit soap operas about a nurse's 3-11 shift at Fruit Bowl Rehab & Nursing.
Vertical 1080x1920, 30 fps, voiced, with captions. Made to be texted to a nurse.

| Episode | Watch | Length |
|---|---|---|
| 1: The 3-11 | [`shift-happens.mp4`](shift-happens.mp4) | 2:44 |
| 2: Survey Says | [`shift-happens-ep2.mp4`](shift-happens-ep2.mp4) | 2:22 |
| 3: The Holiday Schedule | [`shift-happens-ep3.mp4`](shift-happens-ep3.mp4) | 2:17 |
| 4: The New Grad | [`shift-happens-ep4.mp4`](shift-happens-ep4.mp4) | 2:09 |

Open `index.html?ep=4` (or `ep=1` to `ep=3`) through any local web server to play an episode live in the browser.

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

## Layout audit

`node render.js audit` renders every frame and checks it against the layout rules: no card, banner, caption,
prop or foreground set piece may cover a face, a head or a key sign; nothing important may be cut off at the
frame edge; no text may be squished. Episodes 2 to 4 pass with zero issues at 20 frames per second.

## How it's made

Everything is generated from code, with no stock assets:

- `script.json` and `script_ep2.json` to `script_ep4.json` hold the scenes, dialogue, voices and sound cues. Episode 2's
  "previously on" clips are cut straight from Episode 1's audio and frames.
- `build_audio.py` voices each line with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) TTS, synthesizes every sound effect and the music bed in numpy, mixes `build/audio.wav`, and writes `build/timeline.js` with timings and lip-sync envelopes.
- `engine.js` draws every character, set and overlay on a canvas, including the panel-layout kit shared by
  Episodes 2 to 4; `ep1.js` to `ep4.js` are the episodes.
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
EP=2 node render.js audit 0.05                                        # layout check, every 1/20 s
EP=2 FMT=image/png CRF=27 FFMPEG=/path/to/ffmpeg node render.js video shift-happens-ep2.mp4
EP=2 node render.js preview 12.5 40 88                                # stills in build/ep2/preview
```

Fonts from Google Fonts: Bangers and Nunito (SIL OFL), Luckiest Guy (Apache 2.0). Licenses are in `fonts/`.
