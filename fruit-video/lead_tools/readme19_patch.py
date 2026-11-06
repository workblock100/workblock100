#!/usr/bin/env python3
"""Applies the Episode 19 documentation to fruit-video/README.md and the CI workflow (after readme18_patch.py). Idempotent.
usage: readme19_patch.py <len e.g. 2:40> <size MiB> [--dry]"""
import sys
ROOT = '/home/user/workblock100'
len19, size19 = sys.argv[1:3]
dry = '--dry' in sys.argv
p = f'{ROOT}/fruit-video/README.md'
s = open(p).read()
if 'Episode 19: The Potluck' in s:
    print('README already patched'); sys.exit(0)


def rep(old, new, tag, count=1):
    global s
    assert s.count(old) >= 1, (tag, 'anchor missing: ' + old[:90])
    s = s.replace(old, new, count)
    print('ok:', tag)


row18 = "| 18: The Fire Drill | [`shift-happens-ep18.mp4`](shift-happens-ep18.mp4) | 2:54 |\n"
rep(row18, row18 + f"| 19: The Potluck | [`shift-happens-ep19.mp4`](shift-happens-ep19.mp4) | {len19} |\n", 'table row')
rep("(change `ep` to 1 through 18 for other episodes)", "(change `ep` to 1 through 19 for other episodes)", 'ep range')

EP19 = """## Episode 19: The Potluck

A full-length episode (2:40) for the week of Thanksgiving. At 3:15 PM the Fun Committee (HR) announces mandatory fun and everyone is bringing rolls (eleven baskets, seen from above); Compliance wants an allergen label on every dish ("Contains: bread."); Binder runs Remove Duplicates on the table and eleven baskets become one ("Rolls: one!"). At 5:00 PM in the Dietary kitchen Chef Cabbage turns one turkey into six textures on a conveyor and presses it into a beige turkey-shaped mold ("It is a beige turkey."), coffee is thickened to nectar, honey and pudding ("It is texture modified."), and a pecan pie, brought for a resident on a puree, goes into the blender ("Pie smoothie." "It is beige."). At 7:45 PM Mango makes Strawberry a plate and it travels through the building hand to hand in ONE continuous shot, each person adding a note, a sticker, a thermometer or a label. At 8:00 PM the food has been out two hours and Compliance discards all of it in one sweep, the plate included; Brenda, who went on break in 2019, has a sandwich ("It was a good year."). At 10:40 PM the residents say what they are thankful for ("Water." "It is a UTI."), ask Strawberry to sit, and she sits for a few seconds with her eyes closed until a call light rings; the Moon at the window says "Happy Thanksgiving, three to eleven." The title is a slow cooker whose steam writes the title; the end card is the sign-up sheet with the results and teases Episode 20, The Snow Day.

New in Episode 19: the food kit `ep19_food.js` (`window.F19`: twenty dishes drawn procedurally, the beige molds, steam, a thickened-liquid pour that goes from water to honey to pudding, stickers and labels; `GUIDE_FOOD19.md`), the new character Chef Cabbage (`ep19_art.js`, `window.A19`), a one-take shot (`ep19_plate.js` with its DOM-free camera path `ep19_plate_sim.js`; `tools_plate_path.js` writes `build/ep19/plate_path.json`, which the sound uses to move room tone and panning with the camera), a score that passes one tune from instrument to instrument at each hand-off, and a break-room groove locked to the microwave's beeps.

"""
rep("## The cast\n", EP19 + "## The cast\n", 'ep19 section')
rep("Episodes 6 to 18 are checked at 30 frames per second", "Episodes 6 to 19 are checked at 30 frames per second", 'audit range')
rep("`script_ep2.json` to `script_ep18.json`", "`script_ep2.json` to `script_ep19.json`", 'scripts')
rep("Episodes 6 to 18 use `build_audio6.py`", "Episodes 6 to 19 use `build_audio6.py`", 'audio6')
rep("`build_music6.py` to `build_music18.py`", "`build_music6.py` to `build_music19.py`", 'music')
rep("`ep1.js` to `ep18.js` are the episodes", "`ep1.js` to `ep19.js` are the episodes", 'episodes')
rep("Episodes 6 to 18 draw through an opt-in second renderer", "Episodes 6 to 19 draw through an opt-in second renderer", 'renderer')
rep("  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n",
    "  Episode 19 is `ep19_title.js` (title and end card), `ep19_signup.js` (the sign-up and the last round), `ep19_kitchen.js` and `ep19_art.js`, `ep19_plate.js` and `ep19_plate_sim.js`, `ep19_break.js`, on the kit `ep19_food.js`; `gen_script19.py` writes its script.\n"
    "  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n", 'files bullet')
GATE = f"""
## Episode 19 build and release gate

Same steps as Episode 15 with `19` in place of `15` (`gen_script19.py`, `build_audio19.py`, `build_music19.py`, `EP=19 node render.js audit 0.0333333333`, and so on). The audit steps on the renderer's own frame times (i / 30). Extra input for the sound: `node tools_plate_path.js` (the one-take camera path, `build/ep19/plate_path.json`); footsteps come from `EP=19 node render.js events`. The committed file is `shift-happens-ep19.mp4` ({size19} MiB), rendered at CRF 22.5 in 300-frame segments from an isolated snapshot of the sources.
"""
s = s.rstrip('\n') + '\n' + GATE
if dry:
    open('/tmp/shift_tools/README19_preview.md', 'w').write(s); print('dry run: wrote /tmp/shift_tools/README19_preview.md')
else:
    open(p, 'w').write(s); print('README patched')
    w = f'{ROOT}/.github/workflows/render-shift.yml'
    t = open(w).read()
    t = t.replace("(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 or 18)", "(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 or 19)")
    t = t.replace("options: ['18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6']", "options: ['19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6']")
    t = t.replace("default: '18'", "default: '19'")
    open(w, 'w').write(t); print('workflow patched')
