#!/usr/bin/env python3
"""Applies the Episode 15 documentation to fruit-video/README.md (the CI workflow is already patched). Idempotent.
usage: readme15_patch.py <len15 e.g. 2:58> <size_mib e.g. 78.4> [--dry]   (--dry writes /tmp/shift_tools/README15_preview.md and does not touch the repo)"""
import sys
ROOT = '/home/user/workblock100'
len15, size15 = sys.argv[1], sys.argv[2]
dry = '--dry' in sys.argv
p = f'{ROOT}/fruit-video/README.md'
s = open(p).read()
if 'Episode 15: The Merger' in s:
    print('README already patched'); sys.exit(0)


def rep(old, new, tag, count=1):
    global s
    assert s.count(old) >= 1, (tag, 'anchor missing: ' + old[:90])
    s = s.replace(old, new, count)
    print('ok:', tag)


rep("| 14: The Survey | [`shift-happens-ep14.mp4`](shift-happens-ep14.mp4) | 3:12 |\n",
    "| 14: The Survey | [`shift-happens-ep14.mp4`](shift-happens-ep14.mp4) | 3:12 |\n" + f"| 15: The Merger | [`shift-happens-ep15.mp4`](shift-happens-ep15.mp4) | {len15} |\n", 'table row')
rep("(change `ep` to 1 through 14 for other episodes)", "(change `ep` to 1 through 15 for other episodes)", 'ep range')

EP15 = """## Episode 15: The Merger

The day Fruit Bowl is acquired, carried out as operations in a spreadsheet. At 3:00 PM a mandatory all-hands in the activity room, the audience seen from behind: the CEO of Greenleaf Senior Living,
Mr. Artichoke (eleven layers; his heart is somewhere inside), joins on a laggy video call and shares his screen. Binder, a binder-clip assistant, asks whether anyone would like help ("No."
"Great! I'll help."), warns that merging keeps only the top-left value ("It is discarded!"), and Clementine says "Sure!". Then the building obeys the sheet: a crane lowers Greenleaf onto
Fruit Bowl (a rigid-body simulation: the impact, the squat, the sign boards and the chimney flying), Mr. Broccoli rides a chute into the conference room with a bowl of salad ("We brought salad."
"We brought pizza."), the staff try a zipper merge on a stairwell in profile ("After you." "No, after you.", a bonk), and Compliance arrives crying. The consultants (Onion, Compliance;
Tomato, HR) run the model: Insert Row (an Executive Suite on the roof; the whole tower sinks one floor and the lobby goes below the sheet; residents come in through the window), Remove
Duplicates (five poofs, "Four plus four equals five. That is synergy!", "The one with seniority."), Fill Down (Strawberry times forty, a chorus of "I'm one person.", a lookup that fails: "I never
am.") and Find and Replace (BREAK becomes PENDING across the building, 214 replacements; "How long is pending?" "Pending!"). A huge banner renames the building FRUIT SALAD REHAB & NURSING,
Ctrl+Z says "Can't undo!", Binder makes one last offer, and the sign reads PENDING. The end card is the staff as a spreadsheet and teases Episode 16, The Vote.

Episode 15 is the first built on a set of engine upgrades, all passing the same text gate: character turnarounds (`yaw` in `v2_char.js`: three-quarter views, profile walks and backs;
`GUIDE_TURN.md`); a deterministic rigid-body physics library whose collisions feed the sound (`phys2d.js`, DOM-free simulations in `ep15_dock_sim.js` and `ep15_close_sim.js`,
`tools_phys_events.js`, `GUIDE_PHYS.md`); a spreadsheet UI kit with merging, flipping text, dialogs, a fill drag and an assistant bubble (`ep15_sheet.js`, `window.SH15`, `GUIDE_SHEET.md`);
a six-floor tower with a crane, a sinking foundation and a ground cutaway (`ep15_house.js`, `window.S15`, `GUIDE_S15.md`); and five new characters (`ep15_art.js`, `window.A15`,
`GUIDE_ART15.md`). The audio adds an objective measurement: the level of every spoken line over everything else in the mix (`build/ep15_sound/dialogue_margin.csv`).

"""
rep("## The cast\n", EP15 + "## The cast\n", 'ep15 section')
if "| Binder |" not in s:
    i = s.index("| Kumquat |"); j = s.index("\n", i) + 1
    rows = (
        "| Mr. Artichoke | CEO of Greenleaf Senior Living (Ep. 15) | Eleven layers, a tiny heart somewhere inside. Always on a laggy call. \"We value our people.\" |\n"
        "| Onion | Compliance (Ep. 15) | Cries whenever she speaks, and so does everyone near her. \"Per policy.\" |\n"
        "| Tomato | HR (Ep. 15) | Perky. Cannot decide whether she is a fruit or a vegetable. \"Efficiency.\" Pending |\n"
        "| Broccoli | Administrator, Greenleaf (Ep. 15) | Brought salad. Pizza is not a vegetable |\n"
        "| Carrot | Charge nurse, Greenleaf (Ep. 15) | Seniority: removed |\n"
        "| Binder | The helpful assistant (Ep. 15) | \"It looks like you're trying to take a break. Would you like help?\" Does not take no for an answer. \"Pending!\" |\n")
    s = s[:j] + rows + s[j:]
    print('ok: cast rows')
rep("| Melon | The Administrator (Ep. 2, 9, 10, 11, 12, 13, 14)", "| Melon | The Administrator (Ep. 2, 9, 10, 11, 12, 13, 14, 15)", 'melon')
rep("Episodes 6 to 14 are checked at 30 frames per second", "Episodes 6 to 15 are checked at 30 frames per second", 'audit range')
rep("`script_ep2.json` to `script_ep14.json`", "`script_ep2.json` to `script_ep15.json`", 'scripts')
rep("Episodes 6 to 14 use `build_audio6.py`", "Episodes 6 to 15 use `build_audio6.py`", 'audio6')
rep("`build_music6.py` to `build_music14.py`", "`build_music6.py` to `build_music15.py`", 'music')
rep("`ep1.js` to `ep14.js` are the episodes", "`ep1.js` to `ep15.js` are the episodes", 'episodes')
rep("Episodes 6 to 14 draw through an opt-in second renderer", "Episodes 6 to 15 draw through an opt-in second renderer", 'renderer')
rep("Episode 14 sets 24 so fast whips are smooth, not stepped)", "Episodes 14 and 15 set 24 so fast whips are smooth, not stepped)", 'blurMax')
rep("  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n",
    "  Episode 15 is `ep15_title.js` (the title: a spreadsheet merges its own title; and the end card: the staff as a sheet), `ep15_announce.js`, `ep15_dock.js`, `ep15_model1.js`, `ep15_model2.js`,\n"
    "  `ep15_replace.js` and `ep15_close.js` on the kits `ep15_sheet.js` (`window.SH15`), `ep15_house.js` (`window.S15`) and `ep15_art.js` (`window.A15`), the physics library `phys2d.js` (`window.PHYS2D`) and\n"
    "  the `yaw` turnaround in `v2_char.js`; `gen_script15.py` writes `script_ep15.json`.\n"
    "  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n", 'files bullet')
GATE15 = f"""
## Episode 15 build and release gate

```bash
python3 gen_script15.py script_ep15.json                                     # the script (scenes, lines, voices, sound cues)
python3 build_audio15.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync, physics foley -> build/ep15_sound/audio.wav, timeline, dialogue_margin.csv
EP=15 node render.js events 15                                               # footsteps from the animation -> build/ep15/events.json
node tools_phys_events.js 15                                                 # collisions from the simulations (build/ep15/phys_sims.json) -> build/ep15/phys_events.json
python3 build_audio15.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin --publish   # again with both event files; publishes build/ep15/audio.wav and audio.m4a when the timeline is identical
EP=15 node render.js audit 0.0333333333                                      # hard gate, text gate included (textGate: true): exits non-zero on any layout or text issue
EP=15 FMT=image/png CRF=22.5 node render.js video shift-happens-ep15.mp4     # {size15} MiB, under GitHub's 100 MiB file limit
```

`build_audio15.py` and `build_music15.py` reuse the earlier mixers, effects and instruments (they import the Episode 6 to 14 builders); the scene modules, the kits and the physics library are listed above.
"""
s = s.rstrip('\n') + '\n' + GATE15
if dry:
    open('/tmp/shift_tools/README15_preview.md', 'w').write(s); print('dry run: wrote /tmp/shift_tools/README15_preview.md')
else:
    open(p, 'w').write(s); print('README patched')
