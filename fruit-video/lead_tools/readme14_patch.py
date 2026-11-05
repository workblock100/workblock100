#!/usr/bin/env python3
"""Applies the Episode 14 documentation to fruit-video/README.md and the CI workflow. Idempotent. usage: readme14_patch.py <len14 e.g. 3:12> [--dry]  (--dry writes to /tmp/shift_tools/README14_preview.md and does not touch the repo)"""
import sys
ROOT = '/home/user/workblock100'
len14 = sys.argv[1]
dry = '--dry' in sys.argv
p = f'{ROOT}/fruit-video/README.md'
s = open(p).read()
if 'Episode 14: The Survey' in s:
    print('README already patched'); sys.exit(0)


def rep(old, new, tag, count=1):
    global s
    assert s.count(old) >= 1, (tag, 'anchor missing: ' + old[:80])
    s = s.replace(old, new, count)
    print('ok:', tag)


rep("| 13: The Float Pool | [`shift-happens-ep13.mp4`](shift-happens-ep13.mp4) | 2:52 |\n",
    "| 13: The Float Pool | [`shift-happens-ep13.mp4`](shift-happens-ep13.mp4) | 2:52 |\n" + f"| 14: The Survey | [`shift-happens-ep14.mp4`](shift-happens-ep14.mp4) | {len14} |\n", 'table row')
rep("(change `ep` to 1 through 13 for other episodes)", "(change `ep` to 1 through 14 for other episodes)", 'ep range')

EP14 = """## Episode 14: The Survey

A nature documentary about the State. A deadpan narrator watches the colony (the staff of Fruit Bowl Rehab and Nursing) in its habitat, the building, shown as a cutaway dollhouse.
At 3:02 PM a white sedan pulls into the lot: Mr. Stateman, the State surveyor, the Starfruit from Episode 2 ("Don't mind me. I'm just going to observe."). The alarm call, a text message,
crosses the building in eleven seconds; the staff stand up like meerkats; the colony adapts (the shower room "now holds the second floor", every insulin pen is born today, three weeks
of charting in nine minutes, call lights answered in nine seconds, the Administrator's display of pizza). The entrance conference: everything is in the binder ("Is there anything that
isn't in the binder?" "The staff."), and the surveyor and his trainee Kumquat pick one nurse to follow, through binoculars: Strawberry, per diem, not on the sheet. The tracer: she runs ahead of
him putting every call light within reach; he finds the one insulin pen she missed ("It's day one." "The label says June." "It's a long day."); Mr. Banana slips for the forty-ninth
time ("That is a fall." "That is a hobby."); the shower room door is opened and the stash lands on everyone ("Is the Christmas tree a tag?" "It is a tag."). Alone with the surveyor, the
residents speak ("The girl with the badge sits with me. She says it's nineteen sixty-two. So it is." ... "Give her a break."). In the exit conference a Plinko board picks the severity
(F-725, sufficient nursing staff, lands on L: immediate jeopardy), and then comes one new tag, F-999, "The facility failed to cover its staff." ("That is not a real tag." "It is now.").
The plan of correction: thirty minutes, seated, mandatory. Strawberry sits; a call light rings; the surveyor: "Don't mind me. I'm just going to help." The end card is a specimen wall and
teases Episode 15, The Merger.

Episode 14 is built under the text gate from the first frame, with a look of its own: a cutaway dollhouse of the whole building (`S14`), a field-guide design language, a camera-trap shot,
a binocular view, a continuous tracking run through the middle floor, a slow-motion landslide of junk, documentary interview framing and a Plinko board whose pegs are hit on the sound cues.

"""
rep("## The cast\n", EP14 + "## The cast\n", 'ep14 section')
rep("| Starfruit | State surveyor (Ep. 2) |", "| Starfruit | State surveyor, Mr. Stateman (Ep. 2, 14) |", 'starfruit')
if "| Kumquat |" not in s:
    i = s.index("| Starfruit |"); j = s.index("\n", i) + 1
    s = s[:j] + "| Kumquat | Trainee surveyor (Ep. 14) | Earnest, tiny, a clipboard bigger than he is. Asks whether everything is a tag |\n" + s[j:]
    print('ok: kumquat row')
rep("| Melon | The Administrator (Ep. 2, 9, 10, 11, 12, 13)", "| Melon | The Administrator (Ep. 2, 9, 10, 11, 12, 13, 14)", 'melon')
for old, new in (("| Mr. Pear | Resident (Ep. 5)", "| Mr. Pear | Resident (Ep. 5, 14)"), ("| Goji | Resident, Room 14 (Ep. 7)", "| Goji | Resident, Room 14 (Ep. 7, 14)")):
    if old in s:
        s = s.replace(old, new, 1); print('ok:', new[:20])
rep("Episodes 6 to 13 are checked at 30 frames per second", "Episodes 6 to 14 are checked at 30 frames per second", 'audit range')
rep("`script_ep2.json` to `script_ep13.json`", "`script_ep2.json` to `script_ep14.json`", 'scripts')
rep("Episodes 6 to 13 use `build_audio6.py`", "Episodes 6 to 14 use `build_audio6.py`", 'audio6')
rep("`build_music6.py` to `build_music13.py`", "`build_music6.py` to `build_music14.py`", 'music')
rep("`ep1.js` to `ep13.js` are the episodes", "`ep1.js` to `ep14.js` are the episodes", 'episodes')
rep("Episodes 6 to 13 draw through an opt-in second renderer", "Episodes 6 to 14 draw through an opt-in second renderer", 'renderer')
rep("  with two-bone arms and real hands) that Episodes 1 to 5 never touch.", "  with two-bone arms and real hands) that Episodes 1 to 5 never touch. An episode may raise the motion-blur sample cap (`EP.blurMax`, default 10; Episode 14 sets 24 so fast whips are smooth, not stepped).", 'blurMax')
rep("  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n",
    "  Episode 14 is `ep14_title.js` (title and specimen-wall end card), `ep14_colony.js`, `ep14_adapt.js`, `ep14_arrive.js`, `ep14_tracer.js`, `ep14_closet.js`, `ep14_voices.js` and `ep14_verdict.js`\n"
    "  on the kits `ep14_house.js` (`window.S14`: the dollhouse, a cutaway of the whole building) and `ep14_art.js` (`window.A14`: the surveyors and their props); `gen_script14.py` writes `script_ep14.json`.\n"
    "  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n", 'files bullet')
GATE14 = """
## Episode 14 build and release gate

```bash
python3 gen_script14.py script_ep14.json                                     # the script (scenes, lines, voices, sound cues, the Plinko board's peg hits)
python3 build_audio14.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep14/audio.wav, timeline.js
EP=14 node render.js events 15                                               # footsteps from the animation -> build/ep14/events.json (then run build_audio14.py again with --events build/ep14/events.json)
EP=14 node render.js audit 0.0333333333                                      # hard gate, text gate included (textGate: true): exits non-zero on any layout or text issue
bash tools_gate_selftest.sh                                                  # re-proves the text gate and the UI kit on the test episode
ffmpeg -y -i build/ep14/audio.wav -c:a aac -b:a 192k build/ep14/audio.m4a     # browser playback and CI
EP=14 FMT=image/png CRF=21 node render.js video shift-happens-ep14.mp4
```

`build_audio14.py` and `build_music14.py` reuse the earlier mixers, effects and instruments (they import the Episode 6 to 13 builders); the scene modules and the two kits (`ep14_house.js`, `ep14_art.js`) are listed above.
"""
s = s.rstrip('\n') + '\n' + GATE14
if dry:
    open('/tmp/shift_tools/README14_preview.md', 'w').write(s); print('dry run: wrote /tmp/shift_tools/README14_preview.md')
else:
    open(p, 'w').write(s); print('README patched')
    w = f'{ROOT}/.github/workflows/render-shift.yml'
    t = open(w).read()
    t = t.replace("(Episode 6, 7, 8, 9, 10, 11, 12 or 13)", "(Episode 6, 7, 8, 9, 10, 11, 12, 13 or 14)")
    t = t.replace("options: ['13', '12', '11', '10', '9', '8', '7', '6']", "options: ['14', '13', '12', '11', '10', '9', '8', '7', '6']")
    t = t.replace("default: '13'", "default: '14'")
    open(w, 'w').write(t); print('workflow patched')
