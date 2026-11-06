#!/usr/bin/env python3
"""Applies the Episode 16 and 17 documentation to fruit-video/README.md and the CI workflow (after readme15_patch.py). Idempotent.
usage: readme1617_patch.py <len16 e.g. 1:14> <size16 MiB> <len17 e.g. 1:13> <size17 MiB> [--dry]"""
import sys
ROOT = '/home/user/workblock100'
len16, size16, len17, size17 = sys.argv[1:5]
dry = '--dry' in sys.argv
p = f'{ROOT}/fruit-video/README.md'
s = open(p).read()
if 'Episode 16: The Vote' in s:
    print('README already patched'); sys.exit(0)


def rep(old, new, tag, count=1):
    global s
    assert s.count(old) >= 1, (tag, 'anchor missing: ' + old[:90])
    s = s.replace(old, new, count)
    print('ok:', tag)


row15 = "| 15: The Merger | [`shift-happens-ep15.mp4`](shift-happens-ep15.mp4) | 2:57 |\n"
rep(row15, row15 + f"| 16: The Vote | [`shift-happens-ep16.mp4`](shift-happens-ep16.mp4) | {len16} |\n| 17: The Module | [`shift-happens-ep17.mp4`](shift-happens-ep17.mp4) | {len17} |\n", 'table rows')
rep("(change `ep` to 1 through 15 for other episodes)", "(change `ep` to 1 through 17 for other episodes)", 'ep range')

EP1617 = """## Episode 16: The Vote

A short sequel built on the Episode 15 kits in one afternoon (74 seconds). At 6:30 PM the new management holds an Employee of the Month election. Compliance prints the ballots, HR says one choice per person, and the only candidate is Binder. The ballots go into a clear box (a small rigid-body simulation: `ep16_ballot_sim.js`); the forty unassigned Strawberries from Fill Down are eligible voters ("Per policy"), so the box floods. The count: Binder 48, Pending 1, Strawberry's own, the only real ballot. One real ballot makes the election void, and a void election goes to the incumbent, who is Binder. The plaque is engraved letter by letter and the prize is a day off: pending. The title is a poll form whose other options are ineligible; the end card is the results sheet and teases Episode 17.

## Episode 17: The Module

A second short sequel (73 seconds). At 9:15 PM HR assigns mandatory training, Module 7, "How to Take a Break Safely": four hours of unskippable video, due before clock-out, proctored by Binder (looking away pauses the video; a call light is on; the progress bar has said 99 percent for an hour). The narrator is Mr. Artichoke on a laggy call: the break begins when the shift ends. The quiz has one answer, Pending, and it is correct; the certificate expires at eleven; clocking out requires a taken break and the break is pending until you clock out, so the clock stays on 10:59. The title is a learning-platform page stuck at 99 percent; the end card is the module roster and teases Episode 18, The Fire Drill.

Episodes 16 and 17 use the Episode 15 kits (`ep15_sheet.js`, `ep15_house.js`, `ep15_art.js`, `phys2d.js`, the `yaw` turnarounds) unchanged and the same text gate; they are shorter and lighter than Episode 15 (fewer shots per scene, no new engine work).

"""
rep("## The cast\n", EP1617 + "## The cast\n", 'ep16/17 sections')
rep("Episodes 6 to 15 are checked at 30 frames per second", "Episodes 6 to 17 are checked at 30 frames per second", 'audit range')
rep("`script_ep2.json` to `script_ep15.json`", "`script_ep2.json` to `script_ep17.json`", 'scripts')
rep("Episodes 6 to 15 use `build_audio6.py`", "Episodes 6 to 17 use `build_audio6.py`", 'audio6')
rep("`build_music6.py` to `build_music15.py`", "`build_music6.py` to `build_music17.py`", 'music')
rep("`ep1.js` to `ep15.js` are the episodes", "`ep1.js` to `ep17.js` are the episodes", 'episodes')
rep("Episodes 6 to 15 draw through an opt-in second renderer", "Episodes 6 to 17 draw through an opt-in second renderer", 'renderer')
rep("  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n",
    "  Episode 16 is `ep16_title.js` (title and end card), `ep16_ballot.js`, `ep16_ballot_sim.js`, `ep16_count.js` and `ep16_prize.js`; Episode 17 is `ep17_title.js` (title and end card), `ep17_assign.js`, `ep17_video.js` and\n"
    "  `ep17_quiz.js`; both on the Episode 15 kits; `gen_script16.py` and `gen_script17.py` write their scripts.\n"
    "  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n", 'files bullet')
GATE = f"""
## Episodes 16 and 17 build and release gate

Same steps as Episode 15 with `16` or `17` in place of `15` (`gen_script16.py`, `build_audio16.py`, `build_music16.py`, `EP=16 node render.js audit 0.0333333333`, and so on). Episode 16 also has `node tools_phys_events.js 16` (the ballot simulation's collisions, `build/ep16/phys_sims.json`); no footsteps pass was run for either. The committed files are `shift-happens-ep16.mp4` ({size16} MiB) and `shift-happens-ep17.mp4` ({size17} MiB), both rendered at CRF 22.5.
"""
s = s.rstrip('\n') + '\n' + GATE
if dry:
    open('/tmp/shift_tools/README1617_preview.md', 'w').write(s); print('dry run: wrote /tmp/shift_tools/README1617_preview.md')
else:
    open(p, 'w').write(s); print('README patched')
    w = f'{ROOT}/.github/workflows/render-shift.yml'
    t = open(w).read()
    t = t.replace("(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14 or 15)", "(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 or 17)")
    t = t.replace("options: ['15', '14', '13', '12', '11', '10', '9', '8', '7', '6']", "options: ['17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6']")
    t = t.replace("default: '15'", "default: '17'")
    open(w, 'w').write(t); print('workflow patched')
