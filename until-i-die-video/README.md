# Until I Die: animated fan video

An animated music video for Juice WRLD's **"Party In My Mind (Until I Die)"**, the unreleased
JW3-era track (recorded 2019, produced by Rex Kudo and T-Minus, leaked April 29, 2022).
It is not on *Legends Never Die*, *Fighting Demons*, or *The Party Never Ends*.

Unofficial, made for personal use. **No audio and no lyrics are included.** The video is cut to the
song's structure so you can put your copy of the track underneath it.

The lead is an original character, not a likeness of Juice WRLD: tousled black hair falling over his right
eye with a violet streak, a plum bomber jacket open over a black tee, a silver crescent-moon pendant, gray
cargo pants, white high-tops.

It is a cel-shaded 3D animation built entirely in code with three.js: a rigged character with skinned
limbs, a hand-drawn anime face that blinks and sings, hair that sways, toon shading with ink outlines and
colored rim light, and a set for every shot. There are no image assets.

## Use it

- **The video:** `tools/render.cjs` writes `out/until-i-die.mp4` (1920x1080, 30 fps, H.264, 2:28).
  The MP4 is not committed to the repo. In CapCut or iMovie, put the video at 0:00 and the song at 0:00.
  The last 3 seconds are the end card after the song finishes.
- **Live player:** serve this folder (`npx serve .` or `python3 -m http.server`) and open `index.html`.
  **Load song file** plays your copy of the track and drives the animation from the audio clock.

## Timing

Timed to the common **2:25** leak. Section starts, in seconds from the first sample of the audio file:

| Section | Starts |
|---|---|
| Intro | 0.0 |
| Chorus | 10.0 |
| Verse 1 | 36.4 |
| Chorus | 62.8 |
| Verse 2 | 89.2 |
| Chorus | 115.6 |
| End card | 142.0 |

These are **estimates from the song's structure** (16-bar sections), not measured from the waveform.
If a section lands early or late on your file, change `SECTION_STARTS` in `src/3d/timeline.js` and
re-render. Every shot re-times itself from those seven numbers.

## Shot list

Each section is split into 8 equal slots. Short performance shots (him under neon in the rain, hand over his
heart, singing) are cut into the back half of a few slots, so each story shot still starts on its line.

| Section | Shots |
|---|---|
| Intro | standing under a streetlight in the rain, title card |
| Chorus (violet, then crimson, then gold) | walking through a void beside an orb of light; a giant eye with a static pupil over the city; mirror shards orbiting him; old photos bleeding ink; his palm on a rainy window; a marionette under a spotlight; a rave inside a giant head with a heartbeat line |
| Verse 1 | a mirror whose reflection glitches and grins; a car racing toward a burning horizon; a shockwave through a crowd; walking toward the city at dusk; a sailboat under the moon; the same boat in a storm; holding demons back with a sigil; a figure made of light |
| Verse 2 | sinking underwater; sitting on a rooftop ledge under the moon; walking a night highway toward a glowing arch; crawling on that road; a coffin bursting open; a maze inside a head; demons circling; diamond tears |
| Last chorus | the chorus shots in gold, ending with an ascent through the clouds |
| End card | 999 constellation, title, LLJW 1998 - 2019 |

## Render it yourself

Requirements: Node 18+, `npm install` in this folder (three.js), Playwright with Chromium, and ffmpeg built
with libx264 (`ffmpeg` on PATH, or `FFMPEG=/path/to/ffmpeg`). Rendering runs WebGL in headless Chromium,
on the GPU if there is one and on SwiftShader (CPU) if not.

```sh
npm install
node tools/render.cjs                      # full video -> out/until-i-die.mp4
node tools/render.cjs --stills 12,40.5,90  # test frames -> out/still_*.jpg
node tools/render.cjs --from 60 --to 90    # just a range
```

Options: `--fps 30`, `--workers 4`, `--crf 18`, `--out`, `--frames`. Frames are cached as JPEGs in
`out/frames`, so an interrupted render resumes. Delete that folder after changing anything.

## How it's built

Each frame is a pure function of time, so the renderer splits the video across several headless Chromium
workers and stitches the frames with ffmpeg.

| File | What it holds |
|---|---|
| `src/3d/character.js` | the lead: bone rig, skinned jacket, sleeves and pants, head, drawn face, hair clumps |
| `src/3d/poses.js` | poses and motion cycles: walk, crawl, sitting, hand over heart, breathing |
| `src/3d/toon.js` | cel-shading materials with rim light, ink outlines, glow materials |
| `src/3d/kit.js` | set pieces: sky, stars, moon, rain, ripples, particles, city, street lights, neon, water, clouds |
| `src/3d/shots.js`, `shots-chorus.js`, `shots-verse.js` | one builder per shot: set, lights, camera move, animation |
| `src/3d/pipeline.js` | render targets, transitions, bloom, grading, grain |
| `src/3d/overlay.js` | title card and end card |
| `src/3d/timeline.js` | section times and shot order |
| `src/3d/main.js` | frame composer and the player |

Strobing is kept slow (about one pulse per second). Lightning and the chorus hits are single flashes.

## Fonts

New Rocker (OFL 1.1), Syncopate (Apache 2.0), and Share Tech Mono (OFL 1.1), from Fontsource.
License texts are in `fonts/`.
