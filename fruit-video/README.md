# SHIFT HAPPENS: Episode 1, "The 3-11"

A 2:44 animated fruit soap opera about one nurse's 3-11 shift at Fruit Bowl Rehab & Nursing.
Vertical 1080x1920, 30 fps, voiced, with captions. Made to be texted to a nurse.

**Watch:** [`shift-happens.mp4`](shift-happens.mp4)

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

## How it's made

Everything is generated from code, with no stock assets:

- `script.json` holds the scenes, dialogue, voices and sound cues.
- `build_audio.py` voices each line with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) TTS, synthesizes every sound effect and the music bed in numpy, mixes `build/audio.wav`, and writes `build/timeline.js` with timings and lip-sync envelopes.
- `index.html` + `anim.js` draw every frame on a canvas. `renderAt(t)` is a pure function of time, so opening `index.html` through any local web server plays the episode live.
- `render.js` drives headless Chromium to capture frames and pipes them to ffmpeg.

```bash
pip install kokoro-onnx soundfile scipy numpy
# model files: kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx releases page
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
FFMPEG=/path/to/ffmpeg node render.js video shift-happens.mp4   # needs playwright
node render.js preview 12.5 40 88                              # stills in build/preview
```

Fonts from Google Fonts: Bangers and Nunito (SIL OFL), Luckiest Guy (Apache 2.0). Licenses are in `fonts/`.
