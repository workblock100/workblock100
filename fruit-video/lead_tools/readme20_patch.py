#!/usr/bin/env python3
"""Applies the Episode 20 documentation to fruit-video/README.md and the CI workflow (after readme19_patch.py). Idempotent.
usage: readme20_patch.py <len e.g. 2:43> <size MiB> [--dry]"""
import sys
ROOT = '/home/user/workblock100'
len20, size20 = sys.argv[1:3]
dry = '--dry' in sys.argv
p = f'{ROOT}/fruit-video/README.md'
s = open(p).read()
if 'Episode 20: The Snow Day' in s:
    print('README already patched'); sys.exit(0)


def rep(old, new, tag, count=1):
    global s
    assert s.count(old) >= 1, (tag, 'anchor missing: ' + old[:90])
    s = s.replace(old, new, count)
    print('ok:', tag)


row19 = "| 19: The Potluck | [`shift-happens-ep19.mp4`](shift-happens-ep19.mp4) | 2:40 |\n"
rep(row19, row19 + f"| 20: The Snow Day | [`shift-happens-ep20.mp4`](shift-happens-ep20.mp4) | {len20} |\n", 'table row')
rep("(change `ep` to 1 through 19 for other episodes)", "(change `ep` to 1 through 20 for other episodes)", 'ep range')

EP20 = open('/tmp/shift_tools/README20_section.md').read().rstrip('\n') + '\n\n'
rep("## The cast\n", EP20 + "## The cast\n", 'ep20 section')
rep("Episodes 6 to 19 are checked at 30 frames per second", "Episodes 6 to 20 are checked at 30 frames per second", 'audit range')
rep("`script_ep2.json` to `script_ep19.json`", "`script_ep2.json` to `script_ep20.json`", 'scripts')
rep("Episodes 6 to 19 use `build_audio6.py`", "Episodes 6 to 20 use `build_audio6.py`", 'audio6')
rep("`build_music6.py` to `build_music19.py`", "`build_music6.py` to `build_music20.py`", 'music')
rep("`ep1.js` to `ep19.js` are the episodes", "`ep1.js` to `ep20.js` are the episodes", 'episodes')
rep("Episodes 6 to 19 draw through an opt-in second renderer", "Episodes 6 to 20 draw through an opt-in second renderer", 'renderer')
rep("  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n",
    "  Episode 20 is `ep20_title.js` (title and end card), `ep20_forecast.js` (the forecast and the day room), `ep20_lot.js`, `ep20_blackout.js`, `ep20_night.js` and `ep20_lapse_sim.js`, on the kits `ep20_fx.js` (weather and light), `ep20_art.js` (winter gear, Turnip, Eggplant, the plow) and `ep20_props.js`; `gen_script20.py` writes its script.\n"
    "  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n", 'files bullet')
GATE = f"""
## Episode 20 build and release gate

Same steps as Episode 15 with `20` in place of `15` (`gen_script20.py`, `build_audio20.py`, `build_music20.py`, `EP=20 node render.js audit 0.0333333333`, and so on); the audit steps on the renderer's own frame times (i / 30). Extra inputs for the sound: `node tools_lapse.js` (the time-lapse's world clock, `build/ep20/lapse.json`) and the footsteps from `EP=20 node render.js events`. Two checks are new in Episode 20: `python3 tools_luma.py 20 <scene> 0.5` renders frames of a scene and flags any whose mean luminance is under 0.20 or that are more than 45 percent near-black (the blackout's deliberate dark beat is exempt; `--mp4 FILE` runs it on a finished video), and `python3 tools_flashcheck.py FILE.mp4` counts opposing changes of frame-average luminance per second. The committed file is `shift-happens-ep20.mp4` ({size20} MiB), rendered at CRF 22.5 in 300-frame segments from an isolated snapshot of the sources.
"""
s = s.rstrip('\n') + '\n' + GATE
if dry:
    open('/tmp/shift_tools/README20_preview.md', 'w').write(s); print('dry run: wrote /tmp/shift_tools/README20_preview.md')
else:
    open(p, 'w').write(s); print('README patched')
    w = f'{ROOT}/.github/workflows/render-shift.yml'
    t = open(w).read()
    t = t.replace("(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 or 19)", "(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 or 20)")
    t = t.replace("options: ['19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6']", "options: ['20', '19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6']")
    t = t.replace("default: '19'", "default: '20'")
    open(w, 'w').write(t); print('workflow patched')
