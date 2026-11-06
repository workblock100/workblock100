#!/usr/bin/env python3
"""Applies the Episode 12 / 13 documentation to fruit-video/README.md, the CI workflow and nothing else. Idempotent (does nothing twice).
usage: readme13_patch.py <ep12_len> <ep13_len>   e.g. 2:36 2:52"""
import re, sys
ROOT = '/home/user/workblock100'
len12, len13 = sys.argv[1], sys.argv[2]
WITH12 = len(sys.argv) > 3 and sys.argv[3] == 'with12'
p = f'{ROOT}/fruit-video/README.md'
s = open(p).read()
if 'Episode 13: The Float Pool' in s:
    print('README already patched'); sys.exit(0)

row12 = f"| 12: The In-Service | [`shift-happens-ep12.mp4`](shift-happens-ep12.mp4) | {len12} |\n" if WITH12 else ""
s = s.replace("| 11: Welcome Back | [`shift-happens-ep11.mp4`](shift-happens-ep11.mp4) | 2:13 |\n",
              "| 11: Welcome Back | [`shift-happens-ep11.mp4`](shift-happens-ep11.mp4) | 2:13 |\n" + row12 +
              f"| 13: The Float Pool | [`shift-happens-ep13.mp4`](shift-happens-ep13.mp4) | {len13} |\n")
s = s.replace("(change `ep` to 1 through 11 for other episodes)", "(change `ep` to 1 through 13 for other episodes)")

EP12 = """## Episode 12: The In-Service

A mandatory in-service that is voluntary for per diem staff. The Administrator's sign-in sheet (Persimmon: not attending, agency), four slides (Dignity First;
answer every call light within two minutes; teamwork, "We are a family." "Are families paid overtime?" "Families are unpaid."; the budget, ninety-seven percent
pizza, ninety-seven percent dignity), a quiz (a resident calls while you are on your break: "You are never on break."; a supervisor asks you to stay late:
yes, yes, or let me check my contract), and the word that has no slide: "No." "There is no slide for no." A fire drill whose muster point is the parking lot
("Residents first. Staff second." "And administration?" "Third." "Pizza last."), where the Moon counts everyone and Persimmon is "on another budget". The Staff
Engagement Awards: Most Reports Filed ("Nobody reads them." "I read every one. The good cuff is behind the Q word sign."), Newest Hire, and Strawberry
("Per diem. Not required to attend. Attended." "Under protest." "We need you Friday." "No.") ending on "Then it's not in my contract."

Episode 12 was repaired under the text gate (see Layout audit) (the sign-in sheet had been drawn upside down, and several posters and banners were sliced by the frame edge).

## Episode 13: The Float Pool

Hour four of eight, and Strawberry's break has said "pending" since the merger. "That's not a break. That's a heist." The float pool, the people no schedule can find,
plans to steal thirty minutes: a hologram blueprint of the facility (thirty-two rooms, two nurses, one called out), a freeze-frame crew intro (the Brains, the Ghost,
the Talker, the Muscle, the Distraction, the Eye in the Sky), and three obstacles: the call lights, which become a red laser grid that cannot see a per diem badge
(a slow-motion walk through the beams, "BADGE: PER DIEM / NO MATCH"); the Administrator, who loops every fourteen minutes and can be held for forty with slides;
and the Q word. The break room is locked by policy 14.3 (staff may not enter during a shift), and Strawberry is per diem, so she is not staff. Behind the door,
found by penlight, is Brenda, a prune in scrubs who went on break in 2019: "Nobody covered." Strawberry says "I've got it. Go." Brenda: "Nobody ever said that."
Strawberry sits and takes one bite; the Moon, on lookout, says "It's quiet out here"; every call light in the building goes off; and the crew takes over:
"We've got it. Sit." The last word is "Pending."

Episode 13 is the first built under the text gate and the UI kit (see Layout audit), with a new look: a hologram plan, comic-book crew cards with die-cut sticker figures,
a laser hall with a time-warped walk, radio HUD tags, a break room lit only by penlights, a police-lineup end card and a score of its own (heist funk that turns tender).

"""
if not WITH12:   # Episode 13 only: drop the Episode 12 section until it is published
    EP12 = EP12[EP12.index("## Episode 13: The Float Pool"):]
s = s.replace("## The cast\n", EP12 + "## The cast\n", 1)

s = re.sub(r"(\| Moon \| Night-shift narrator \(Ep\. 5, 7)\)", (r"\1, 12, 13)" if WITH12 else r"\1, 13)"), s, count=1)
brenda = "| Brenda | Prune nurse, the break room (Ep. 13) | Went on break in 2019. Nobody covered. \"Nobody ever said that.\" First one out the door when the call lights ring |\n"
if WITH12:
    s = re.sub(r"(\| Persimmon \| Agency nurse, per diem \(Ep\. 9, 11)\)", r"\1, 12)", s, count=1)
idx = s.index("## Layout audit")
head = s[:idx].rstrip('\n') + '\n' + brenda + '\n'
s = head + s[idx:]

old_audit = s[s.index("## Layout audit"):s.index("## How it's made")]
new_audit = """## Layout audit

`node render.js audit` checks every on-screen box (faces, hands, props, captions, HUD, cards) for anything covered, cut off
or colliding. Episodes 2 to 5 passed at 20 frames per second. Episodes 6 to 13 are checked at 30 frames per second and the command
exits non-zero on any issue, so it works as a release gate (`EP=13 node render.js audit 0.0333333333`).

### The text gate (Episode 13 onward; Episode 12 after its repair)

The box audit never looked at text drawn into the world, so upside-down sheets, names printed over each other and posters sliced by the frame edge got through.
`txaudit.js` hooks `fillText` on every canvas and records every string with its true on-screen quad (camera, rotation and mirroring included). Every audit of an episode with
`textGate: true` fails mirrored, upside-down, tilted, skewed, cut-off, overlapping, covered and container-breaking text; a second render of each frame with every string painted in a
flat key colour measures how much of each string's ink really reaches the picture. Text the viewer must read ("hero" text) is held to 30 px, a 40 px margin, the caption zone and the clock
pill; set dressing gets informational `NOTE` lines that do not fail the audit. `TEXTGATE=1 EP=11 node render.js audit 0.25` holds an older episode to the same rules, and
`EP=13 node render.js textinv` lists every distinct string with where it is most visible. `ui.js` (guide: `GUIDE_UI.md`) is the drawing kit that makes the rules easy to meet: text is placed by its
measured ink and cap height, so labels centre in their pills and handwriting sits on the rules of a page by construction. `bash tools_gate_selftest.sh` re-proves the gate and the kit on a
test episode (`ep99.js`) that contains deliberate violations.

"""
if not WITH12:
    new_audit = new_audit.replace(' (Episode 13 onward; Episode 12 after its repair)', ' (Episode 13 onward)')
s = s.replace(old_audit, new_audit, 1)

s = s.replace("`script_ep2.json` to `script_ep11.json`", "`script_ep2.json` to `script_ep13.json`")
s = s.replace("Episodes 6 to 11 use `build_audio6.py`", "Episodes 6 to 13 use `build_audio6.py`")
s = s.replace("`build_music6.py` to `build_music11.py`", "`build_music6.py` to `build_music13.py`")
s = s.replace("`ep1.js` to `ep11.js` are the episodes", "`ep1.js` to `ep13.js` are the episodes")
s = s.replace("Episodes 6 to 11 draw through an opt-in second renderer", "Episodes 6 to 13 draw through an opt-in second renderer")
extra = """- Episode 12 is `ep12_title.js` (title and end card), `ep12_room.js` (the conference room), `ep12_signin.js`, `ep12_slides.js`, `ep12_drill.js` and `ep12_award.js`. Episode 13 is
  `ep13_title.js` (title and police-lineup end card), `ep13_crew.js` (freeze-frame cards), `ep13_open.js`, `ep13_plan.js` (the hologram blueprint), `ep13_hall.js` (the laser hall),
  `ep13_cross.js` and `ep13_vault.js` (the break room) on the kits `ep13_station.js` (`window.S13`: the nurses' station, the hall, the break room door) and `ep13_art.js` (`window.A13`: Brenda).
  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).
"""
s = s.replace("- `render.js` drives headless Chromium to capture frames and pipes them to ffmpeg.\n", extra + "- `render.js` drives headless Chromium to capture frames and pipes them to ffmpeg.\n", 1)

gates12 = """
## Episode 12 build and release gate

```bash
python3 build_audio12.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep12/audio.wav, timeline.js
EP=12 node render.js events 15                                               # footsteps from the animation -> build/ep12/events.json (then run build_audio12.py again with --events build/ep12/events.json)
EP=12 node render.js audit 0.0333333333                                      # hard gate: exits non-zero on any layout or text issue
ffmpeg -y -i build/ep12/audio.wav -c:a aac -b:a 192k build/ep12/audio.m4a     # browser playback and CI
EP=12 FMT=image/png CRF=21 node render.js video shift-happens-ep12.mp4
```

`script_ep12.json` holds the scenes, lines, voices and sound cues; `build_audio12.py` and `build_music12.py` are thin additions on the Episode 11 files (they import them, so each pair must stay together).

"""
gates13 = """
## Episode 13 build and release gate

```bash
python3 gen_script13.py script_ep13.json                                     # the script (scenes, lines, voices, sound cues)
python3 build_audio13.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep13/audio.wav, timeline.js
EP=13 node render.js events 15                                               # footsteps from the animation -> build/ep13/events.json (then run build_audio13.py again with --events build/ep13/events.json)
EP=13 node render.js audit 0.0333333333                                      # hard gate, text gate included (textGate: true): exits non-zero on any layout or text issue
bash tools_gate_selftest.sh                                                  # re-proves the text gate and the UI kit on the test episode
ffmpeg -y -i build/ep13/audio.wav -c:a aac -b:a 192k build/ep13/audio.m4a     # browser playback and CI
EP=13 FMT=image/png CRF=21 node render.js video shift-happens-ep13.mp4
```

`build_audio13.py` and `build_music13.py` are thin additions on the Episode 12 files (they import them); the scene modules, the station kit (`ep13_station.js`) and Brenda (`ep13_art.js`) are listed above.
"""
s = s.rstrip('\n') + '\n' + (gates12 if WITH12 else '') + gates13
open(p, 'w').write(s)
print('README patched')

# the manual render workflow
w = f'{ROOT}/.github/workflows/render-shift.yml'
t = open(w).read()
t = t.replace("(Episode 6, 7, 8, 9, 10 or 11)", "(Episode 6, 7, 8, 9, 10, 11, 12 or 13)")
t = t.replace("options: ['11', '10', '9', '8', '7', '6']", "options: ['13', '12', '11', '10', '9', '8', '7', '6']")
t = t.replace("default: '11'", "default: '13'")
open(w, 'w').write(t)
print('workflow patched')
