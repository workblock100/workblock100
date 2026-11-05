# Brief AUDIO12: sound and music for Episode 12 (The In-Service)

You own: `build_audio12.py` (the Episode 12 sound effects; five are first drafts you will refine: `sfx_clack`, `sfx_fanwhir`, `sfx_applause`, `sfx_firebell`, `sfx_gong`), `build_music12.py` (currently a silent placeholder: write the score), and nothing else. You may read everything. Do not run any git command that writes. Do not edit `script_ep12.json` or `gen_script12.py` (the lead owns the script). If you need a script change, say so in your report.

## Hard rules
1. Timing is frozen. Every spoken line, every pause length and every sound-cue offset in `script_ep12.json` stays exactly as it is. You may change a cue's sound and its gain, never its offset. The visual builders are designing to these offsets right now.
2. Never write into `build/ep12/timeline.js`, `build/ep12/timeline.json` or `build/ep12/events.json` by hand. The build writes the timeline; check that it did not change: scene starts and lengths and every line's start and end must equal the first build's (`build/ep12/timeline.json` as it is now; copy it to your scratch folder before you start and compare after each build).
3. Build into your own folder first (`--out` relative to the project, e.g. `--out build/ep12_sound`), compare the timeline, then copy `audio.wav` into `build/ep12/` only when the timeline is identical.
4. The TTS model: `/tmp/claude-0/-home-user-workblock100/a7ae9cc7-3306-516a-9318-51e578ae52e3/scratchpad/tts/kokoro-v1.0.onnx` and `voices-v1.0.bin` in the same folder. The build: `python3 build_audio12.py --model <onnx> --voices <bin> --out build/ep12_sound` (about 1.5 minutes, longer under load).

## The cues (offsets are scene-local seconds from the start of the pause beat; read them from `script_ep12.json`)
- title: theme7 (0.00), textding (0.12), fanwhir (0.00, a projector spinning up), clack x4 (0.45, 1.10, 1.75, 2.40).
- signin: slidedoor (0.95) and fanwhir (open); penscratch (sign 0.10, sign2 0.10: a real pen writing a name, with its little skips); pizzabox (pizza 0.20: a pizza cart's boxes stacked), tap (pizza 0.90); trombone (end 0.10, the sad sting).
- slides: fanwhir and clack at open; clack at each slide change (s2, s3, s4, quiz1: 0.05); boing (chart 0.10: the pizza slice swells); clack and three ticks (quiz2: 0.05, 0.20, 0.70, 1.20: a quiz timer); crickets (silence 0.10: the room is quiet); sting (end 0.10).
- drill: firebell at 0.10, 1.00 and pa_chime at 0.55 (alarm); scramble (run 0.10), wheels (run 0.20); peel (peel 0.20), boing (peel 0.40); crickets (muster 0.20); sting (end 0.10).
- award: applause (open 0.20: a small crowd, about 1.6 s); gong (gong 0.10, a struck brass gong that rings about 2.4 s); tick x3 (silence 0.00, 0.50, 1.00); sting (end 0.10).
- end: theme7 (card 0.00).
Pause beats are silent for the voice, so the score and the effects carry them. The gong and applause are the only big hits on the award's `open` and `gong` beats; keep the score quiet under them.

## Sound effects: the work
- Refine the five first drafts so they sit well in the mix: the clack (short, dry, plastic and wood, a little bright, not harsh), the fan (a low hum that spins up, never a whine), the applause (about forty claps, thick at first, thinning, not a machine gun), the fire bell (two electric strikes, a hard metallic ring with a buzz; loud enough to cut through and not painful), the gong (a real struck gong: a bright strike then a long low bloom with inharmonic partials).
- Check each with a spectrogram or a peak/RMS readout (the sound pass cannot listen; measure and say so).
- Keep the registration line `BA.SFX.update(...)` at the end of the sfx section so every new `sfx_*` is registered.

## The score: `build_music12.py`
Write `score(script, scenes, lines, N)` returning a (2, N) stereo bed, like `build_music11.py` and `build_music10.py` (they show the instruments and the per-scene cue functions; import what you need from `build_music6.py`, `build_music7.py`, `build_music8.py`, `build_music9.py`, `build_music10.py`, `build_music11.py`). The title and end cards reuse `cue_title7` and `cue_end7` (from `build_music7.py`).
Mood per scene (the score is quiet under speech; the mixer ducks it under every voice):
- title: the series sting (riser, timpani roll, choir, bells from cue_title7), then a dry projector groove: a click-clack pulse with a bass walk.
- signin: a hesitant office waltz on a music box and pizzicato, a little sad on "Persimmon is not attending."
- slides: a bright corporate march on marimba and brass for slides 1 to 4, a tense quiz vamp on ticking woodblock for the questions (the ticks at quiz2 are part of the music), then a long silence under "No." (no music at all from `silence` to `end`), and a single held note under "There is no slide for no."
- drill: an alarm riff (two-tone brass and snare), then a march that falls apart at the peel, then a lonely clarinet under the muster point and the Moon.
- award: a fanfare for the awards (brass and timpani), the gong on its beat, a tender string line under Clementine's rosette, and total silence from `silence` (the no) through `s4` (a bell at the end).
- end: cue_end7's reprise.
Keep the dialogue intelligible first: bed under speech about -22 to -26 dB, swells in pauses. Use `hall()` and the same stereo treatment as the earlier episodes.

## Build and check
1. Build; compare the timeline with the first build (identical scene starts, lengths and line times).
2. Measure: integrated loudness (target in line with Episode 11: about -14.8 LUFS after the mix), true peak (the aac guard keeps the m4a under -1 dBTP), no silence longer than 1.5 s inside a scene except the deliberate silence in slides and award (say how long they are), the speech-to-bed margin for the worst five lines (report them).
3. Copy `audio.wav` to `build/ep12/`, then encode `build/ep12/audio.m4a` (`ffmpeg -y -i build/ep12/audio.wav -c:a aac -b:a 192k build/ep12/audio.m4a`; the system `ffmpeg` is at /usr/bin/ffmpeg).
4. Report: the cue list as built (name, offset, gain), the five effects and what each is meant to sound like, the score's cue structure, the measurements, and anything you could not do.
