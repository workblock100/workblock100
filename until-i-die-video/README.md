# Until I Die: animated fan video

An animated music video for Juice WRLD's **"Party In My Mind (Until I Die)"**, the unreleased
JW3-era track (recorded 2019, produced by Rex Kudo and T-Minus, leaked April 29, 2022).
It is not on *Legends Never Die*, *Fighting Demons*, or *The Party Never Ends*.

Unofficial, made for personal use. **No audio and no lyrics are included.** The video is cut to the
song's structure so you can put your copy of the track underneath it.

The lead is an original character, not a likeness of Juice WRLD: tousled black hair falling over one eye
with a violet streak, a plum bomber jacket over a black tee, a silver crescent-moon pendant, gray cargo
pants, white high-tops.

Each shot is a painted anime-style still (made with Canva's image generator, one image per shot) that the
engine animates: camera moves, rain, fog, particles, flickering light, local warps (water, heat, wind in
the hair), glitches and beat-synced hits. The art is not committed; see **Art** below.

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
If a section lands early or late on your file, change `SECTION_STARTS` in `src/timeline.js` and
re-render. Every shot re-times itself from those seven numbers.

## Shot list

Each section is split into 8 equal slots. Short performance shots (him close to camera under neon, hand
over his heart or arms loose) are cut into the back half of a few slots, so each story shot still starts on its line.

| Section | Shots |
|---|---|
| Intro | rain under a streetlight, title card |
| Chorus (violet, then red, then gold) | lone walk with an orb light; giant eye with a static pupil; orbiting mirror shards; floating photos bleeding ink; rain on the window; marionette under a spotlight; neon lasers inside a head silhouette with a heartbeat trace |
| Verse 1 | mirror with a glitching reflection; burning highway (dash cluster, belt light); shockwave through a crowd; walk toward the city at dusk; sailboat at sea; the same sea in a hail storm; demons held back by a sigil; light figure |
| Verse 2 | underwater; rooftop ledge under the moon; night highway toward a finish arch; crawling on that road; coffin bursts open; maze inside a head; demons circling; diamond shards from a hooded profile |
| Last chorus | chorus shots in gold, ending with an ascent through the clouds |
| End card | 999 constellation, title, LLJW 1998 - 2019 |

## Render it yourself

Requirements: Node 18+, Playwright with Chromium, and ffmpeg built with libx264
(`ffmpeg` on PATH, or `FFMPEG=/path/to/ffmpeg`).

```sh
node tools/render.cjs                      # full video -> out/until-i-die.mp4
node tools/render.cjs --stills 12,40.5,90  # test frames -> out/still_*.jpg
node tools/render.cjs --from 60 --to 90    # just a range
```

Options: `--fps 30`, `--workers 4`, `--crf 18`, `--out`, `--frames`. Frames are cached as JPEGs in
`out/frames`, so an interrupted render resumes. Delete that folder after changing the timing.

## Art

`art/manifest.tsv` lists every still: its file name, its Canva media id, and the shot it belongs to.
Put the full-size images in `art/` under those names (`art/01_intro.jpg` and so on). Any image that is
missing falls back to its small preview in `art/thumbs/`, and if that is missing too the shot shows its
file name. Neither folder is committed.

## How it's built

Each frame is a pure function of time: the still for the active shot is drawn under a moving camera
and the effects are layered on top on a Canvas 2D context. The renderer splits the video across
several headless Chromium workers and stitches the frames with ffmpeg.

| File | What it holds |
|---|---|
| `src/core.js` | math, seeded randomness, noise, color, glow sprites, camera |
| `src/props.js` | rain, splashes, lightning timing, stars and other small drawing helpers |
| `src/stills.js` | art loading, the camera over a still, and the effects: rain, fog, particles, warps, glitch, grading |
| `src/scenes-stills.js` | one function per shot, plus the end card |
| `src/timeline.js` | section times and shot order |
| `src/main.js` | transitions, bloom, grain, vignette, the player |

Strobing is kept slow (about one pulse per second). Lightning and the chorus hits are single flashes.

## Fonts

New Rocker (OFL 1.1), Syncopate (Apache 2.0), and Share Tech Mono (OFL 1.1), from Fontsource.
License texts are in `fonts/`.
