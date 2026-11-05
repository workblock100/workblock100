#!/usr/bin/env python3
"""Builds the new PR #1 body from the ORIGINAL (Episode 14 era) body saved in the scratchpad plus facts for the episodes shipped so far; re-runnable (always starts from the original).
usage: pr_update.py <facts.json> > new_body.md       facts.json: {"episodes": [ {num, name, len, mib, bytes, sha, commit, audit, review, decode, audio, encode, limits}, ... ]}  (ascending; any subset of 15, 16, 17)
It prints the body to stdout and the new title to stderr."""
import json, sys
SP = '/tmp/claude-0/-home-user-workblock100/a7ae9cc7-3306-516a-9318-51e578ae52e3/scratchpad'
body = open(f'{SP}/pr_body_current.md').read()
facts = json.load(open(sys.argv[1]))
eps = {e['num']: e for e in facts['episodes']}
nums = sorted(eps)
top = max(nums)

SUMMARY = {
15: """## Episode 15: The Merger

The day Fruit Bowl is acquired, carried out as operations in a spreadsheet. At 3:00 PM a mandatory all-hands in the activity room, the audience seen from behind: the CEO of Greenleaf Senior Living, Mr. Artichoke (eleven layers; his heart is somewhere inside), joins on a laggy video call and shares his screen. Binder, a binder-clip assistant, asks whether anyone would like help ("No." "Great! I'll help."), warns that merging keeps only the top-left value ("It is discarded!"), and Clementine says "Sure!". Then the building obeys the sheet: a crane lowers Greenleaf onto Fruit Bowl (a rigid-body simulation: the impact, the squat, the sign boards and the chimney flying), Mr. Broccoli rides a chute into the conference room with a bowl of salad ("We brought salad." "We brought pizza."), the staff try a zipper merge on a stairwell in profile ("After you." "No, after you.", a bonk), and Compliance arrives crying. The consultants (Onion, Compliance; Tomato, HR) run the model: Insert Row (an Executive Suite on the roof; the whole tower sinks one floor and the lobby goes below the sheet; residents come in through the window), Remove Duplicates (five poofs, "Four plus four equals five. That is synergy!", "The one with seniority."), Fill Down (Strawberry times forty, a chorus of "I'm one person.", a lookup that fails: "I never am.") and Find and Replace (BREAK becomes PENDING across the building, 214 replacements; "How long is pending?" "Pending!"). A huge banner renames the building FRUIT SALAD REHAB & NURSING, Ctrl+Z says "Can't undo!", Binder makes one last offer, and the sign reads PENDING. The end card is the staff as a spreadsheet and teases Episode 16, The Vote.
""",
16: """## Episode 16: The Vote

A short sequel built on the Episode 15 kits. At 6:30 PM the new management holds an Employee of the Month election. Compliance prints the ballots, HR says one choice per person, and the only candidate is Binder. The ballots go into a clear box; the forty unassigned Strawberries from Fill Down are eligible voters ("Per policy"), so the box floods. The count: Binder 48, Pending 1, Strawberry's own, the only real ballot. One real ballot makes the election void, and a void election goes to the incumbent, who is Binder. The plaque is engraved and the prize is a day off: pending. The end card teases Episode 17.
""",
17: """## Episode 17: The Module

A short sequel built on the Episode 15 kits. At 9:15 PM HR assigns mandatory training, Module 7, "How to Take a Break Safely": four hours of unskippable video, due before clock-out, proctored by Binder (looking away pauses the video; a call light is on; the progress bar has said 99 percent for an hour). The narrator is Mr. Artichoke on a laggy call: the break begins when the shift ends. The quiz has one answer, Pending, and it is correct; the certificate expires at eleven; clocking out requires a taken break and the break is pending until you clock out, so the clock stays on 10:59. The end card teases Episode 18.
""",
18: """## Episode 18: The Fire Drill

A full-length episode (2:54). At 7:40 PM Compliance announces a surprise fire drill (surprise drills are announced first) and the drill log is already signed, Monday. Strawberry is on med pass ("Which one wins?" "Per policy."), Binder prints an evacuation map whose nearest exit is the Executive Suite on the roof ("Fire rises!"), the Fire Marshal from Episode 6 finds an extinguisher tagged 2019 ("It is still passing."), a fire door propped open by the cart ("The cart has seniority.") and sends the extinguisher down the corridor like a rocket in a cloud of foam. CODE RED: strobes pulse with the horn in the temporal-three pattern, the magnetic fire doors close one by one down a long corridor (each one muffles the alarm), and Binder snoozes the alarm for ten minutes. At 8:10 the residents will not leave the day room because the drill's fire is the Yule log on the TV, the staff extinguish it with the remote, and the headcount is forty residents plus the forty unassigned Strawberries. The State passes the drill because the paperwork is perfect, and a smoke detector chirps. The end card teases Episode 19.
""",
19: """## Episode 19: The Potluck

A full-length episode (2:40) for the week of Thanksgiving. At 3:15 PM the Fun Committee announces mandatory fun and everyone brings rolls (eleven baskets, seen from above); Compliance wants an allergen label on every dish ("Contains: bread."); Binder runs Remove Duplicates on the table and eleven baskets become one. At 5:00 PM Chef Cabbage in the Dietary kitchen turns one turkey into six textures on a conveyor and presses it into a beige turkey-shaped mold, thickens coffee to nectar, honey and pudding, and puts a pecan pie in the blender ("Pie smoothie." "It is beige."). At 7:45 PM a plate travels through the building hand to hand in one continuous shot. At 8:00 PM the food has been out two hours and Compliance discards all of it, the plate included; Brenda, who went on break in 2019, has a sandwich ("It was a good year."). At 10:40 PM the residents say what they are thankful for, and Strawberry sits for a few seconds until a call light rings; the Moon says "Happy Thanksgiving, three to eleven." The title is a slow cooker whose steam writes the title; the end card is the sign-up sheet and teases Episode 20.
""",
20: """## Episode 20: The Snow Day

A full-length episode (2:43) in a blizzard. At 2:00 PM the TV promises thirty inches and Tomato announces a snow day; Compliance says healthcare is essential, the CEO calls it a "weather-related productivity opportunity" on the speakerphone, hazard pay turns out to be pizza, the day shift cannot leave and the night shift cannot arrive ("Who is working?" "You are."), and the front door opens onto a wall of snow. At 4:30 PM in the parking lot the plow driver plows the cars in ("I plowed the lot."), Strawberry's car is a hill, Compliance files an incident report from the ground, and the night nurse phones in from a ditch ("When will you be here?" "Spring."). At 6:12 PM the power fails: a cutaway of the building goes dark room by room, Binder is the only light and Strawberry says yes, the generator starts after exactly ten seconds, the coffee maker is not on the red outlet ("Coffee is not life safety." "It is to me."), and Brenda has a flashlight from 2019 ("It was a good flashlight."). At 8:40 PM the residents watch the snow by lamplight and Goji finally gets water; the Moon is behind the weather. At 10:59 PM nobody is coming for the night shift, so Strawberry gives report to herself in a twin shot; the night goes by in an eight-second time-lapse and the Moon says good morning at seven; the plow buries the door again. The title is a snow globe whose snow settles into the title; the end card is a TV closings ticker with the night nurse in her ditch, eating the pizza.
""",
}

CHANGED = {
15: [
"- Episode 15 on the v2 renderer and the text gate, a merger told as spreadsheet operations: a title where a sheet merges its own cells (`ep15_title.js`), the all-hands on a rolling TV with the audience seen from behind and a CEO on a laggy call (`ep15_announce.js`), a crane that lowers one dollhouse onto another under a rigid-body simulation, with a chute, a profile stairwell and a zipper merge (`ep15_dock.js`, `ep15_dock_sim.js`), the consultants' model with Insert Row, Remove Duplicates and a sheet strip pinned over the world (`ep15_model1.js`), Fill Down with forty Strawberries in a hallway crowd and a failing lookup (`ep15_model2.js`), Find and Replace across the building with an odometer counter (`ep15_replace.js`), and the closing banner (a cloth simulation), an undo that cannot undo and a PENDING sign (`ep15_close.js`, `ep15_close_sim.js`); `ep15.js` registers them.",
"- New files used by Episode 15 (and by 16 and 17): `ep15_sheet.js` (`window.SH15`, the GridSheet UI kit: grid, ribbon, merge, flipping text, dialogs, fill drag, assistant bubble, pointer), `ep15_house.js` (`window.S15`, a six-floor tower with a crane, a sinking foundation and a ground cutaway), `ep15_art.js` (`window.A15`: Mr. Artichoke, Onion, Tomato, Broccoli, Carrot and Binder), `phys2d.js` (`window.PHYS2D`, a deterministic rigid-body and cloth library; `phys2d_test.js` passes 17 of 17) with `tools_phys_events.js`, which turns the simulations' collisions into sound events, and the guides `GUIDE_SHEET.md`, `GUIDE_S15.md`, `GUIDE_ART15.md`, `GUIDE_PHYS.md` and `GUIDE_TURN.md`.",
"- Shared file edited for Episode 15: `v2_char.js` gains character turnarounds (`yaw`, `headYaw`, `turnTo`, `swingZ`, `armTwist`, `gripSpace` and helper functions such as `V2C.faceDir` and `yawToward`; see `GUIDE_TURN.md`). A regression script rendered 42 reference frames from Episodes 6 to 14 before and after the change and they are byte-identical (run by the helper that wrote the change, after its last edit; I did not run it again), so earlier episodes should render as before; they were not re-rendered. The other shared edits are small: `index.html` (script tags), `.gitignore` (allowlist for `build/ep15` to `build/ep17`), the README and the CI workflow (the episode choices now include 15, default 15).",
"- Sound for Episode 15: `gen_script15.py` writes `script_ep15.json`; `build_audio15.py` (new effects such as the merge, the warning dialog, the glitch, the peeling layers, the dock impact and the banner; a physics foley family keyed by material pair and fed from `build/ep15/phys_events.json`; a synthesised stair patter; a per-line voice cache; a 180 ms end fade) and `build_music15.py` (the score: a Merge theme, a Binder jingle that curdles into a minor key, an elevator-jazz theme for the CEO). Footsteps from the animation: only 4 were detected (`build/ep15/events.json`). The level of every spoken line over the rest of the mix is measured in `build/ep15_sound/dialogue_margin.csv`: 88 lines, median 23.9 dB, 5th percentile 18.4 dB, minimum 14.8 dB. Measured, not listened to.",
],
16: [
"- Episode 16 (`ep16.js`, `ep16_title.js`, `ep16_ballot.js`, `ep16_ballot_sim.js`, `ep16_count.js`, `ep16_prize.js`, `gen_script16.py`, `script_ep16.json`, `build_audio16.py`, `build_music16.py`, `build/ep16/*`): a short sequel on the Episode 15 kits, text gate on.",
],
18: [
"- Episode 18 (`ep18.js`, `ep18_title.js`, `ep18_station.js`, `ep18_marshal.js`, `ep18_marshal_sim.js`, `ep18_alarm.js`, `ep18_alarm_sim.js`, `ep18_evac.js`, `ep18_evac_sim.js`, `gen_script18.py`, `script_ep18.json`, `build_audio18.py`, `build_music18.py`, `build/ep18/*`): a full-length episode, text gate on.",
"- New kits used by Episode 18: `ep18_fx.js` (`window.FX18`, the effects kit: flames, foam, smoke, sparks, water, strobes, light cones and washes as deterministic functions of time, with `GUIDE_FX18.md`), `ep18_props.js` (`window.P18`: fire door, alarm panel, pull station, horn strobe, exit sign; the scene files add the extinguisher, evacuation map, drill log and smoke detector), two DOM-free simulations (`ep18_marshal_sim.js`: a rigid-body extinguisher with thrust; `ep18_evac_sim.js`: a crowd of about 80 agents at a door) and `tools_door_events.js`, which writes the fire doors' slam times for the sound.",
],
17: [
"- Episode 17 (`ep17.js`, `ep17_title.js`, `ep17_assign.js`, `ep17_video.js`, `ep17_quiz.js`, `gen_script17.py`, `script_ep17.json`, `build_audio17.py`, `build_music17.py`, `build/ep17/*`): a short sequel on the Episode 15 kits, text gate on.",
],
19: [
"- Episode 19 (`ep19.js`, `ep19_title.js`, `ep19_signup.js`, `ep19_kitchen.js`, `ep19_plate.js`, `ep19_plate_sim.js`, `ep19_break.js`, `gen_script19.py`, `script_ep19.json`, `build_audio19.py`, `build_music19.py`, `build/ep19/*`): a full-length episode, text gate on.",
"- New kits used by Episode 19: `ep19_food.js` (`window.F19`, twenty procedural dishes including the beige molds, steam, a thickened-liquid pour that goes from water to honey to pudding, stickers and labels, with `GUIDE_FOOD19.md`), `ep19_art.js` (`window.A19`: Chef Cabbage), and the one-take plate shot: a DOM-free camera path (`ep19_plate_sim.js`) shared by the picture and by `tools_plate_path.js`, which writes the camera's position over time (`build/ep19/plate_path.json`) so the sound's room tone and panning follow the camera.",
"- Sound for Episode 19: `build_audio19.py` (kitchen foley, viscosity foley, the microwave and timer, a spatial one-take mix, the decoded-AAC true-peak check) and `build_music19.py` (the plate scene's tune passes from instrument to instrument; the break-room groove is locked to the microwave's beeps; the last scene is a hymn on felt piano). Episode 19 is added to the manual render workflow (`.github/workflows/render-shift.yml`) as its default.",
],
20: [
"- Episode 20 (`ep20.js`, `ep20_title.js`, `ep20_forecast.js`, `ep20_lot.js`, `ep20_blackout.js`, `ep20_night.js`, `ep20_lapse_sim.js`, `tools_lapse.js`, `gen_script20.py`, `script_ep20.json`, `build_audio20.py`, `build_music20.py`, `build/ep20/*`): a full-length episode, text gate on.",
"- New kits used by Episode 20: `ep20_fx.js` (`window.SN20`: layered snow with wind and gusts, frost, snow on sills, banks and car roofs, headlight and flashlight beams, breath, snow that settles into text; `window.L20`: a lighting pass with flashlight cones, point, screen and strip lights, flicker, bloom and emergency light; `GUIDE_WX20.md`), `ep20_art.js` (`window.A20`: winter gear, Turnip, Eggplant, a car that disappears under the snow, a plow truck, a snowman; `GUIDE_ART20.md`) and `ep20_props.js` (`window.P20`: flashlight, stopwatch, LED candle, outlets, coffee maker, cot, exit sign, emergency lamp, the Moon in a window). The time-lapse's world clock is a DOM-free module (`ep20_lapse_sim.js`) read by the scene and by `tools_lapse.js`, which writes `build/ep20/lapse.json` for the sound.",
"- Sound for Episode 20: `build_audio20.py` (speakerphone, phone, TV, truck-cab, buried and behind-the-weather voice treatments, the outdoor hush, the building's power-down and generator start, a time-lapse whose room tone, wind and clock ticks follow the picture's world clock, the decoded-AAC true-peak check) and `build_music20.py` (one tune in a bright, a deadpan minor and a lullaby version). Two new checks in the repository: `tools_luma.py` (a brightness gate: mean luminance and near-black share per frame) and `tools_flashcheck.py` (opposing changes of frame-average luminance per second). Episode 20 is added to the manual render workflow (`.github/workflows/render-shift.yml`) as its default.",
],
}

# ---- title and the opening count
names = {15: 'The Merger', 16: 'The Vote', 17: 'The Module', 18: 'The Fire Drill', 19: 'The Potluck', 20: 'The Snow Day'}
old_title = "Add SHIFT HAPPENS Episodes 6 to 14: Alarm Fatigue, The Actual Full Moon, The Double Shift, The Agency Nurse, Two Weeks' Notice, Welcome Back, The In-Service, The Float Pool, The Survey"
new_title = f"Add SHIFT HAPPENS Episodes 6 to {top}: Alarm Fatigue, The Actual Full Moon, The Double Shift, The Agency Nurse, Two Weeks' Notice, Welcome Back, The In-Service, The Float Pool, The Survey" + ''.join(', ' + names[n] for n in nums)
words = {14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty'}
assert 'Fourteen voiced' in body
body = body.replace('Fourteen voiced', f'{words[top]} voiced', 1)

# ---- table rows
row14 = "| 14: The Survey | `fruit-video/shift-happens-ep14.mp4` | 3:12 |\n"
assert row14 in body
body = body.replace(row14, row14 + ''.join(f"| {n}: {names[n]} | `fruit-video/shift-happens-ep{n}.mp4` | {eps[n]['len']} |\n" for n in nums), 1)

# ---- episode summaries (newest first, before Episode 14's)
anchor = "## Episode 14: The Survey\n"
assert anchor in body
body = body.replace(anchor, ''.join(SUMMARY[n] + '\n' for n in reversed(nums)) + anchor, 1)

# ---- what changed (newest first)
a2 = "## What changed in this PR\n\n"
assert a2 in body
ch = ''.join(l + '\n' for n in reversed(nums) for l in CHANGED[n])
body = body.replace(a2, a2 + ch, 1)

# ---- tooling and CI bullets
body = body.replace("`node render.js audit` is a hard gate for Episodes 6 to 14 (non-zero exit on any layout issue; for Episodes 12 to 14 that includes the text gate)", f"`node render.js audit` is a hard gate for Episodes 6 to {top} (non-zero exit on any layout issue; for Episodes 12 to {top} that includes the text gate)")
body = body.replace("renders Episode 6, 7, 8, 9, 10, 11, 12, 13 or 14 (default 14)", "renders Episode 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 or 18 (default 18)")

body = body.replace("a run of the manual CI workflow on GitHub for Episodes 9 to 14", f"a run of the manual CI workflow on GitHub for Episodes 9 to {top}")

# ---- final export links
a3 = "## Final export\n\n"
assert a3 in body
links = ''
for n in reversed(nums):
    e = eps[n]
    links += (f"[Download the Episode {n} MP4](https://github.com/workblock100/workblock100/raw/{e['commit']}/fruit-video/shift-happens-ep{n}.mp4): 1080x1920, 30 fps H.264, stereo 48 kHz AAC, {e['len_exact']}, "
              f"{e['mib']} MiB ({e['bytes']} bytes), SHA-256 {e['sha']}.\n")
body = body.replace(a3, a3 + links, 1)

# ---- verification sections (newest first, before Episode 14's)
a4 = "## Verification, Episode 14\n"
assert a4 in body
ver = ''
for n in reversed(nums):
    e = eps[n]
    ver += f"## Verification, Episode {n}\n\n- {e['audit']}\n- {e['review']}\n- {e['decode']}\n- {e['encode']}\n- {e['audio']}\n- {e['limits']}\n\n"
body = body.replace(a4, ver + a4, 1)

# ---- keep the description short (GitHub rejects one over 65,536 characters, and every update has to be pasted in full): the newest episodes stay inline; older summaries, the file-level
# change list and the older verification sections are moved into fruit-video/QA_RECORD.md (committed with the branch) and the description points to it.
import re
KEEP_SUM, KEEP_VER = 4, 2
QA_URL = 'https://github.com/workblock100/workblock100/blob/claude/fruit-ai-video-nurse-98w13m/fruit-video/QA_RECORD.md'
parts = re.split(r'(?m)^(?=## )', body)
moved, out = [], []
for part in parts:
    h = part.split('\n', 1)[0]
    m, v = re.match(r'## Episode (\d+):', h), re.match(r'## Verification, Episode (\d+)\b', h)
    if m and int(m.group(1)) not in nums[-KEEP_SUM:]:
        moved.append(part); continue
    if v and int(v.group(1)) not in nums[-KEEP_VER:]:
        moved.append(part); continue
    if h.startswith('## What changed in this PR'):
        moved.append(part)
        out.append('## What changed in the latest episode\n\n' + ''.join(l + '\n' for l in CHANGED[top]) + f'\nThe file-level change list for every episode is in [`fruit-video/QA_RECORD.md`]({QA_URL}).\n\n')
        continue
    out.append(part)
if moved:
    open('/home/user/workblock100/fruit-video/QA_RECORD.md', 'w').write(
        '# Episode records moved out of the pull request description\n\nGitHub limits a pull request description to 65,536 characters and every update has to be pasted in full, so the older summaries, the file-level change list and the older verification sections live here. Text as written when each episode was delivered (later corrections are in the description and in the README).\n\n' + ''.join(moved))
    note = '## Earlier episodes, changes and verification\n\nThe summaries of the older episodes, the file-level change list for every episode and the verification sections of the older episodes are in [`fruit-video/QA_RECORD.md`](' + QA_URL + ').\n\nA re-audit of Episodes 15 to 17 on the renderer\'s exact frame times found one frame in Episode 15 (a flying pizza box prop 3 px past the left edge at 46.97 s) and one in Episode 17 (the red ring of the error beep crossing the BREAK PENDING text at 63.77 s); Episode 16 is clean; none of the three was re-rendered.\n\n'
    at = next((k for k, pt in enumerate(out) if pt.startswith('## Release status')), len(out))
    out.insert(at, note)
body = ''.join(out)
sys.stderr.write(f'moved {len(moved)} sections to QA_RECORD.md; body now {len(body)} characters\n')

sys.stderr.write(new_title + '\n')
sys.stdout.write(body)
