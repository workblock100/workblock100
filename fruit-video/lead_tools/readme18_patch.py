#!/usr/bin/env python3
"""Applies the Episode 18 documentation to fruit-video/README.md and the CI workflow (after readme1617_patch.py). Idempotent.
usage: readme18_patch.py <len e.g. 2:54> <size MiB> [--dry]"""
import sys
ROOT = '/home/user/workblock100'
len18, size18 = sys.argv[1:3]
dry = '--dry' in sys.argv
p = f'{ROOT}/fruit-video/README.md'
s = open(p).read()
if 'Episode 18: The Fire Drill' in s:
    print('README already patched'); sys.exit(0)


def rep(old, new, tag, count=1):
    global s
    assert s.count(old) >= 1, (tag, 'anchor missing: ' + old[:90])
    s = s.replace(old, new, count)
    print('ok:', tag)


row17 = "| 17: The Module | [`shift-happens-ep17.mp4`](shift-happens-ep17.mp4) | 1:13 |\n"
rep(row17, row17 + f"| 18: The Fire Drill | [`shift-happens-ep18.mp4`](shift-happens-ep18.mp4) | {len18} |\n", 'table row')
rep("(change `ep` to 1 through 17 for other episodes)", "(change `ep` to 1 through 18 for other episodes)", 'ep range')

EP18 = """## Episode 18: The Fire Drill

A full-length episode (2:54). At 7:40 PM Compliance announces a surprise fire drill for eight o'clock (surprise drills are announced first) and the drill log is already signed, Monday. Strawberry is on med pass ("Which one wins?" "Per policy."), HR says the drill is paid time and the evacuating is "Efficiency.", and Binder prints an evacuation map whose nearest exit is the Executive Suite on the roof ("Fire rises!"). The Fire Marshal from Episode 6 arrives and asks who is in charge; the extinguisher's tag says 2019 ("It is still passing."), the fire door is propped open by the linen cart ("The cart has seniority."), and the P.A.S.S. demonstration sends the extinguisher down the corridor like a rocket in a cloud of foam (a rigid-body simulation with thrust: `ep18_marshal_sim.js`). CODE RED: strobes flash with the horn in the real temporal-three pattern and the magnetic fire doors close one after another down a long corridor, each one muffling the alarm; Binder snoozes the alarm for ten minutes and the doors stay shut. Ten minutes later the horn is back, the residents will not leave the day room because the drill's fire is the Yule log on the TV, the staff extinguish it with the remote, and the headcount is forty residents plus the forty unassigned Strawberries from Fill Down (a crowd simulation of about 80 agents and a top-down view: `ep18_evac_sim.js`). The State passes the drill because the paperwork is perfect, a smoke detector chirps, and nobody is maintenance. The title is an exit sign above a pull station; the end card is the drill log under the chirping detector and teases Episode 19, The Potluck.

New in Episode 18: the effects kit `ep18_fx.js` (`window.FX18`: flames, foam, smoke, sparks, water, strobes, light cones and washes, all deterministic functions of time; `GUIDE_FX18.md`), the props kit `ep18_props.js` (`window.P18`: fire door, alarm panel, pull station, horn strobe, exit sign, and the extinguisher, evacuation map, drill log and smoke detector added by the scene files), the fire-door corridor with a sound that follows the doors (`ep18_alarm_sim.js` and `tools_door_events.js` write `build/ep18/door_events.json`), and the alarm pattern shared between picture and sound (`FX18.hornOn`, `FX18.strobe`).

"""
rep("## The cast\n", EP18 + "## The cast\n", 'ep18 section')
rep("Episodes 6 to 17 are checked at 30 frames per second", "Episodes 6 to 18 are checked at 30 frames per second", 'audit range')
rep("`script_ep2.json` to `script_ep17.json`", "`script_ep2.json` to `script_ep18.json`", 'scripts')
rep("Episodes 6 to 17 use `build_audio6.py`", "Episodes 6 to 18 use `build_audio6.py`", 'audio6')
rep("`build_music6.py` to `build_music17.py`", "`build_music6.py` to `build_music18.py`", 'music')
rep("`ep1.js` to `ep17.js` are the episodes", "`ep1.js` to `ep18.js` are the episodes", 'episodes')
rep("Episodes 6 to 17 draw through an opt-in second renderer", "Episodes 6 to 18 draw through an opt-in second renderer", 'renderer')
rep("  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n",
    "  Episode 18 is `ep18_title.js` (title and end card), `ep18_station.js` (the notice and the all clear), `ep18_marshal.js` and `ep18_marshal_sim.js`, `ep18_alarm.js` and `ep18_alarm_sim.js`, `ep18_evac.js` and `ep18_evac_sim.js`, on the kits `ep18_fx.js` and `ep18_props.js`; `gen_script18.py` writes its script.\n"
    "  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).\n", 'files bullet')
GATE = f"""
## Episode 18 build and release gate

Same steps as Episode 15 with `18` in place of `15` (`gen_script18.py`, `build_audio18.py`, `build_music18.py`, `EP=18 node render.js audit 0.0333333333`, and so on). Two extra inputs feed the sound: `node tools_door_events.js` (the fire doors' slam times, `build/ep18/door_events.json`, which drive the alarm's muffling) and `node tools_phys_events.js 18` (the extinguisher's collisions, `build/ep18/phys_sims.json`). The committed file is `shift-happens-ep18.mp4` ({size18} MiB), rendered at CRF 22.5 in 300-frame segments from an isolated snapshot of the sources.
"""
s = s.rstrip('\n') + '\n' + GATE
if dry:
    open('/tmp/shift_tools/README18_preview.md', 'w').write(s); print('dry run: wrote /tmp/shift_tools/README18_preview.md')
else:
    open(p, 'w').write(s); print('README patched')
    w = f'{ROOT}/.github/workflows/render-shift.yml'
    t = open(w).read()
    t = t.replace("(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 or 17)", "(Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 or 18)")
    t = t.replace("options: ['17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6']", "options: ['18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6']")
    t = t.replace("default: '17'", "default: '18'")
    open(w, 'w').write(t); print('workflow patched')
